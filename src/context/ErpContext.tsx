import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type {
  CollectionName,
  ErpDatabaseState,
  LanguageCode,
  ModuleKey,
  RoleDefinition,
  SyncConflict,
  SyncMutation,
  UserAccount,
} from '../types/erp';
import { localDb } from '../services/localDb';
import { useOnlineStatus } from '../hooks/usePWAInstall';

export interface OnlinePresenceUser {
  userId: string;
  username: string;
  fullName: string;
  roleName: string;
}

interface ErpContextValue {
  state: ErpDatabaseState | null;
  currentUser: UserAccount | null;
  currentRole: RoleDefinition | null;
  authToken: string | null;
  authMode: 'online' | 'offline';
  isOnline: boolean;
  wsConnected: boolean;
  onlineUsers: OnlinePresenceUser[];
  syncQueue: SyncMutation[];
  conflicts: SyncConflict[];
  lastSyncAt: string | null;
  isSyncing: boolean;
  language: LanguageCode;
  darkMode: boolean;
  setLanguage: (lang: LanguageCode) => void;
  toggleDarkMode: () => void;
  canAccessModule: (mod: ModuleKey) => boolean;
  login: (username: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  mutate: (
    collection: CollectionName | 'companySettings' | 'payrollConfig',
    operation: 'create' | 'update' | 'delete',
    recordId: string,
    payload: unknown,
    baseVersion?: number
  ) => Promise<{ ok: boolean; queued?: boolean; error?: string }>;
  syncNow: () => Promise<void>;
  resolveConflict: (conflictId: string, choice: 'local' | 'server') => Promise<void>;
  loadDemoData: () => Promise<void>;
  clearDemoData: () => Promise<void>;
  refreshFromServer: () => Promise<void>;
}

const ErpContext = createContext<ErpContextValue | null>(null);

function applyOptimisticMutation(
  prev: ErpDatabaseState,
  mutation: SyncMutation
): ErpDatabaseState {
  const next: ErpDatabaseState = { ...prev };
  const now = new Date().toISOString();

  if (mutation.collection === 'companySettings') {
    next.companySettings = {
      ...prev.companySettings,
      ...(mutation.payload as Partial<ErpDatabaseState['companySettings']>),
      updatedAt: now,
    };
    return next;
  }

  if (mutation.collection === 'payrollConfig') {
    next.payrollConfig = {
      ...prev.payrollConfig,
      ...(mutation.payload as Partial<ErpDatabaseState['payrollConfig']>),
    };
    return next;
  }

  const colName = mutation.collection as CollectionName;
  const list = [...((prev[colName] as Array<{ id: string; version?: number }>) || [])];

  if (mutation.operation === 'create') {
    const rec = { ...(mutation.payload as Record<string, unknown>), id: mutation.recordId } as {
      id: string;
      version?: number;
    };
    if (!list.some((x) => x.id === mutation.recordId)) {
      list.unshift(rec);
    }
  } else if (mutation.operation === 'update') {
    const idx = list.findIndex((x) => x.id === mutation.recordId);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...(mutation.payload as Record<string, unknown>) };
    }
  } else if (mutation.operation === 'delete') {
    const idx = list.findIndex((x) => x.id === mutation.recordId);
    if (idx !== -1) {
      list.splice(idx, 1);
    }
  }

  (next[colName] as unknown) = list;
  next.lastUpdatedAt = now;
  return next;
}

export const ErpProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isOnline = useOnlineStatus();
  const [state, setState] = useState<ErpDatabaseState | null>(null);
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<'online' | 'offline'>('online');
  const [wsConnected, setWsConnected] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<OnlinePresenceUser[]>([]);
  const [syncQueue, setSyncQueue] = useState<SyncMutation[]>([]);
  const [conflicts, setConflicts] = useState<SyncConflict[]>([]);
  const [lastSyncAt, setLastSyncAt] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [language, setLanguageState] = useState<LanguageCode>(() => {
    return (localStorage.getItem('sse_ui_lang') as LanguageCode) || 'en';
  });
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('sse_dark_mode') === 'true';
  });

  const wsRef = useRef<WebSocket | null>(null);
  const broadcastRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('sse_dark_mode', String(darkMode));
  }, [darkMode]);

  const setLanguage = useCallback((lang: LanguageCode) => {
    setLanguageState(lang);
    localStorage.setItem('sse_ui_lang', lang);
  }, []);

  const toggleDarkMode = useCallback(() => {
    setDarkMode((d) => !d);
  }, []);

  const currentRole = useMemo(() => {
    if (!state || !currentUser) return null;
    return (
      state.roles.find((r) => r.id === currentUser.roleId) ??
      state.roles.find((r) => r.name === currentUser.roleName) ??
      null
    );
  }, [state, currentUser]);

  const canAccessModule = useCallback(
    (mod: ModuleKey) => {
      if (!currentRole) return false;
      return currentRole.modules.includes(mod);
    },
    [currentRole]
  );

  // Hydrate from IndexedDB / localStorage on mount + BroadcastChannel cross-tab sync
  useEffect(() => {
    let mounted = true;
    (async () => {
      const [cachedState, q, confs, lSync] = await Promise.all([
        localDb.loadState(),
        localDb.getSyncQueue(),
        localDb.getConflicts(),
        localDb.getLastSyncAt(),
      ]);
      const sess = localDb.loadSession();
      if (!mounted) return;
      setSyncQueue(q);
      setConflicts(confs);
      setLastSyncAt(lSync);
      if (sess) {
        setCurrentUser(sess.user);
        setAuthToken(sess.token);
        setAuthMode(sess.mode);
      }
      if (cachedState) {
        setState(cachedState);
      }
      if (sess?.token && navigator.onLine) {
        try {
          const resp = await fetch('/api/bootstrap', {
            headers: { Authorization: `Bearer ${sess.token}` },
          });
          if (resp.ok) {
            const data = await resp.json();
            if (mounted && data.state) {
              setState(data.state);
              const role = data.state.roles?.find((r: RoleDefinition) => r.id === data.user.roleId);
              await localDb.saveState(data.state, Boolean(role?.canAccessOfflinePayroll));
              const now = new Date().toISOString();
              setLastSyncAt(now);
              await localDb.setLastSyncAt(now);
            }
          }
        } catch {
          // Stay with offline cached state seamlessly
        }
      }
    })();

    if (typeof BroadcastChannel !== 'undefined') {
      const bc = new BroadcastChannel('sse_erp_realtime_tabs');
      broadcastRef.current = bc;
      bc.onmessage = (ev) => {
        if (ev.data?.type === 'tab:state_updated' && ev.data.state) {
          setState(ev.data.state);
        }
      };
    }

    return () => {
      mounted = false;
      broadcastRef.current?.close();
    };
  }, []);

  const refreshFromServer = useCallback(async () => {
    if (!authToken || !navigator.onLine) return;
    try {
      const resp = await fetch('/api/bootstrap', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (resp.ok) {
        const data = await resp.json();
        setState(data.state);
        const role = data.state.roles?.find((r: RoleDefinition) => r.id === data.user.roleId);
        await localDb.saveState(data.state, Boolean(role?.canAccessOfflinePayroll));
        const now = new Date().toISOString();
        setLastSyncAt(now);
        await localDb.setLastSyncAt(now);
      }
    } catch {
      // Offline fallback
    }
  }, [authToken]);

  const syncNow = useCallback(async () => {
    if (!authToken || !navigator.onLine || isSyncing) return;
    const queue = await localDb.getSyncQueue();
    if (queue.length === 0) {
      await refreshFromServer();
      return;
    }
    setIsSyncing(true);
    try {
      const resp = await fetch('/api/sync/push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ mutations: queue }),
      });
      if (resp.ok) {
        const data = (await resp.json()) as {
          appliedTxIds: string[];
          conflicts: SyncConflict[];
          rejected: Array<{ txId: string; reason: string }>;
          state: ErpDatabaseState;
        };
        const handled = new Set([
          ...data.appliedTxIds,
          ...data.conflicts.map((c) => c.txId),
          ...data.rejected.map((r) => r.txId),
        ]);
        const remaining = queue.filter((m) => !handled.has(m.txId));
        await localDb.saveSyncQueue(remaining);
        setSyncQueue(remaining);

        if (data.conflicts.length > 0) {
          const mergedConflicts = [...conflicts, ...data.conflicts];
          await localDb.saveConflicts(mergedConflicts);
          setConflicts(mergedConflicts);
        }

        if (data.state) {
          setState(data.state);
          const role = data.state.roles?.find((r) => r.id === currentUser?.roleId);
          await localDb.saveState(data.state, Boolean(role?.canAccessOfflinePayroll));
          broadcastRef.current?.postMessage({ type: 'tab:state_updated', state: data.state });
        }
        const now = new Date().toISOString();
        setLastSyncAt(now);
        await localDb.setLastSyncAt(now);
      }
    } finally {
      setIsSyncing(false);
    }
  }, [authToken, conflicts, currentUser?.roleId, isSyncing, refreshFromServer]);

  // WebSocket real-time connection
  useEffect(() => {
    if (!currentUser || !isOnline || authMode === 'offline') {
      setWsConnected(false);
      return;
    }

    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${proto}//${window.location.host}/ws`);
    wsRef.current = ws;

    ws.onopen = () => {
      setWsConnected(true);
      ws.send(
        JSON.stringify({
          type: 'auth:identify',
          userId: currentUser.id,
          username: currentUser.username,
          fullName: currentUser.fullName,
          roleName: currentUser.roleName,
          deviceId: navigator.userAgent.slice(0, 48),
        })
      );
      void syncNow();
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'presence:update') {
          setOnlineUsers(msg.onlineUsers || []);
        } else if (msg.type === 'sync:delta' && msg.mutation) {
          setState((prev) => {
            if (!prev) return prev;
            const next = applyOptimisticMutation(prev, msg.mutation as SyncMutation);
            void localDb.saveState(next, Boolean(currentRole?.canAccessOfflinePayroll));
            return next;
          });
        } else if (msg.type === 'sync:refresh') {
          void refreshFromServer();
        }
      } catch {
        // Ignore
      }
    };

    ws.onclose = () => {
      setWsConnected(false);
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, [authMode, currentRole?.canAccessOfflinePayroll, currentUser, isOnline, refreshFromServer, syncNow]);

  const login = useCallback(async (username: string, password: string) => {
    const deviceLabel = `${navigator.platform || 'Web'} (${window.innerWidth}px)`;
    if (navigator.onLine) {
      try {
        const resp = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password, deviceLabel, platform: navigator.userAgent.slice(0, 60) }),
        });
        const data = await resp.json();
        if (!resp.ok) {
          return { ok: false, error: data.error || 'Login failed' };
        }
        setAuthToken(data.token);
        setCurrentUser(data.user);
        setAuthMode('online');
        setState(data.state);
        localDb.saveSession(data.token, data.user, 'online');
        await localDb.cacheOfflineCredential(data.user, password);
        const role = data.state.roles?.find((r: RoleDefinition) => r.id === data.user.roleId);
        await localDb.saveState(data.state, Boolean(role?.canAccessOfflinePayroll));
        const now = new Date().toISOString();
        setLastSyncAt(now);
        await localDb.setLastSyncAt(now);
        return { ok: true };
      } catch {
        // Fall through to offline verification if server unreachable
      }
    }

    const offlineUser = await localDb.verifyOfflineLogin(username, password);
    if (!offlineUser) {
      return {
        ok: false,
        error: 'Offline login failed. Sign in online at least once on this device to provision offline access.',
      };
    }
    const cachedState = await localDb.loadState();
    setCurrentUser(offlineUser);
    setAuthToken('offline_token');
    setAuthMode('offline');
    if (cachedState) setState(cachedState);
    localDb.saveSession('offline_token', offlineUser, 'offline');
    return { ok: true };
  }, []);

  const logout = useCallback(async () => {
    if (authToken && authMode === 'online' && navigator.onLine) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${authToken}` },
        });
      } catch {
        // Ignore
      }
    }
    wsRef.current?.close();
    localDb.clearSession();
    setCurrentUser(null);
    setAuthToken(null);
  }, [authMode, authToken]);

  const mutate = useCallback(
    async (
      collection: CollectionName | 'companySettings' | 'payrollConfig',
      operation: 'create' | 'update' | 'delete',
      recordId: string,
      payload: unknown,
      baseVersion?: number
    ) => {
      if (!currentUser || !state) {
        return { ok: false, error: 'Not authenticated' };
      }

      const txId =
        typeof crypto.randomUUID === 'function'
          ? crypto.randomUUID()
          : `tx_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

      const mutation: SyncMutation = {
        txId,
        collection,
        operation,
        recordId,
        payload,
        baseVersion,
        actorId: currentUser.id,
        actorName: currentUser.fullName,
        actorRole: currentUser.roleName,
        deviceInfo: navigator.platform || 'Web Browser',
        createdAt: new Date().toISOString(),
        retries: 0,
      };

      // Optimistically update IndexedDB + localStorage + React state immediately
      const optimisticState = applyOptimisticMutation(state, mutation);
      setState(optimisticState);
      await localDb.saveState(optimisticState, Boolean(currentRole?.canAccessOfflinePayroll));
      broadcastRef.current?.postMessage({ type: 'tab:state_updated', state: optimisticState });

      if (navigator.onLine && authToken && authMode === 'online') {
        try {
          const resp = await fetch('/api/mutate', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${authToken}`,
            },
            body: JSON.stringify(mutation),
          });
          if (resp.ok) {
            await refreshFromServer();
            return { ok: true };
          }
          if (resp.status === 409) {
            const conflictData = await resp.json();
            if (conflictData.conflict) {
              const nextConfs = [...conflicts, conflictData.conflict];
              setConflicts(nextConfs);
              await localDb.saveConflicts(nextConfs);
            }
            await refreshFromServer();
            return { ok: false, error: 'Version conflict detected. Resolve in Synchronization Center.' };
          }
          if (resp.status === 403) {
            const errData = await resp.json();
            await refreshFromServer();
            return { ok: false, error: errData.reason || 'Permission denied.' };
          }
        } catch {
          // Network dropped mid-request -> queue offline
        }
      }

      // Queue for background/manual sync
      const nextQueue = [...syncQueue, mutation];
      setSyncQueue(nextQueue);
      await localDb.saveSyncQueue(nextQueue);
      return { ok: true, queued: true };
    },
    [authMode, authToken, conflicts, currentRole?.canAccessOfflinePayroll, currentUser, refreshFromServer, state, syncQueue]
  );

  const resolveConflict = useCallback(
    async (conflictId: string, choice: 'local' | 'server') => {
      const target = conflicts.find((c) => c.id === conflictId);
      if (!target) return;

      if (choice === 'local') {
        await mutate(
          target.collection as CollectionName,
          'update',
          target.recordId,
          target.localPayload
        );
      } else {
        await refreshFromServer();
      }
      const remaining = conflicts.filter((c) => c.id !== conflictId);
      setConflicts(remaining);
      await localDb.saveConflicts(remaining);
    },
    [conflicts, mutate, refreshFromServer]
  );

  const loadDemoData = useCallback(async () => {
    if (!authToken || !navigator.onLine) return;
    const resp = await fetch('/api/demo/load', {
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken}` },
    });
    if (resp.ok) {
      const data = await resp.json();
      setState(data.state);
      await localDb.saveState(data.state, Boolean(currentRole?.canAccessOfflinePayroll));
    }
  }, [authToken, currentRole?.canAccessOfflinePayroll]);

  const clearDemoData = useCallback(async () => {
    if (!authToken || !navigator.onLine) return;
    const resp = await fetch('/api/demo/clear', {
      method: 'POST',
      headers: { Authorization: `Bearer ${authToken}` },
    });
    if (resp.ok) {
      const data = await resp.json();
      setState(data.state);
      await localDb.saveState(data.state, Boolean(currentRole?.canAccessOfflinePayroll));
    }
  }, [authToken, currentRole?.canAccessOfflinePayroll]);

  const value: ErpContextValue = {
    state,
    currentUser,
    currentRole,
    authToken,
    authMode,
    isOnline,
    wsConnected,
    onlineUsers,
    syncQueue,
    conflicts,
    lastSyncAt,
    isSyncing,
    language,
    darkMode,
    setLanguage,
    toggleDarkMode,
    canAccessModule,
    login,
    logout,
    mutate,
    syncNow,
    resolveConflict,
    loadDemoData,
    clearDemoData,
    refreshFromServer,
  };

  return <ErpContext.Provider value={value}>{children}</ErpContext.Provider>;
};

export function useErp(): ErpContextValue {
  const ctx = useContext(ErpContext);
  if (!ctx) throw new Error('useErp must be used inside ErpProvider');
  return ctx;
}
