import type { ErpDatabaseState, SyncConflict, SyncMutation, UserAccount } from '../types/erp';

const DB_NAME = 'SevenSundayERP_DB';
const DB_VERSION = 1;
const STORE_KV = 'kv_store';
const LS_SNAPSHOT_KEY = 'sse_erp_snapshot_v1';
const LS_OFFLINE_AUTH_KEY = 'sse_erp_offline_auth_v1';
const LS_SESSION_KEY = 'sse_erp_session_v1';

interface OfflineCredentialEntry {
  userId: string;
  username: string;
  email: string;
  credentialDigest: string;
  user: UserAccount;
  cachedAt: string;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB unavailable'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_KV)) {
        db.createObjectStore(STORE_KV);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbGet<T>(key: string): Promise<T | null> {
  try {
    const db = await openDb();
    return await new Promise<T | null>((resolve, reject) => {
      const tx = db.transaction(STORE_KV, 'readonly');
      const store = tx.objectStore(STORE_KV);
      const req = store.get(key);
      req.onsuccess = () => resolve((req.result as T) ?? null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

async function idbSet<T>(key: string, value: T): Promise<void> {
  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_KV, 'readwrite');
      const store = tx.objectStore(STORE_KV);
      const req = store.put(value, key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    // Graceful fallback to localStorage mirror
  }
}

export async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export const localDb = {
  async saveState(state: ErpDatabaseState, allowOfflinePayroll: boolean): Promise<void> {
    const toStore: ErpDatabaseState = allowOfflinePayroll
      ? state
      : {
          ...state,
          payrollRuns: [],
          bonuses: [],
          employees: state.employees.map((e) => ({
            ...e,
            bankAccountNumber: e.bankAccountNumber ? 'Protected Online Only' : undefined,
          })),
        };

    await idbSet('erp_state', toStore);
    try {
      localStorage.setItem(LS_SNAPSHOT_KEY, JSON.stringify(toStore));
    } catch {
      // Ignore quota exceeded on secondary mirror
    }
  },

  async loadState(): Promise<ErpDatabaseState | null> {
    const fromIdb = await idbGet<ErpDatabaseState>('erp_state');
    if (fromIdb) return fromIdb;
    try {
      const raw = localStorage.getItem(LS_SNAPSHOT_KEY);
      return raw ? (JSON.parse(raw) as ErpDatabaseState) : null;
    } catch {
      return null;
    }
  },

  async getSyncQueue(): Promise<SyncMutation[]> {
    const q = await idbGet<SyncMutation[]>('sync_queue');
    if (q) return q;
    try {
      const raw = localStorage.getItem('sse_sync_queue');
      return raw ? (JSON.parse(raw) as SyncMutation[]) : [];
    } catch {
      return [];
    }
  },

  async saveSyncQueue(queue: SyncMutation[]): Promise<void> {
    await idbSet('sync_queue', queue);
    try {
      localStorage.setItem('sse_sync_queue', JSON.stringify(queue));
    } catch {
      // Ignore
    }
  },

  async getConflicts(): Promise<SyncConflict[]> {
    return (await idbGet<SyncConflict[]>('sync_conflicts')) ?? [];
  },

  async saveConflicts(conflicts: SyncConflict[]): Promise<void> {
    await idbSet('sync_conflicts', conflicts);
  },

  async getLastSyncAt(): Promise<string | null> {
    return (await idbGet<string>('last_sync_at')) ?? localStorage.getItem('sse_last_sync_at');
  },

  async setLastSyncAt(iso: string): Promise<void> {
    await idbSet('last_sync_at', iso);
    localStorage.setItem('sse_last_sync_at', iso);
  },

  async cacheOfflineCredential(user: UserAccount, rawPassword: string): Promise<void> {
    if (!user.offlineEnabled) return;
    const digest = await sha256Hex(`${user.username.toLowerCase()}::${rawPassword}`);
    const existingRaw = localStorage.getItem(LS_OFFLINE_AUTH_KEY);
    const list: OfflineCredentialEntry[] = existingRaw ? JSON.parse(existingRaw) : [];
    const filtered = list.filter((e) => e.userId !== user.id);
    filtered.push({
      userId: user.id,
      username: user.username.toLowerCase(),
      email: user.email.toLowerCase(),
      credentialDigest: digest,
      user,
      cachedAt: new Date().toISOString(),
    });
    localStorage.setItem(LS_OFFLINE_AUTH_KEY, JSON.stringify(filtered));
  },

  async verifyOfflineLogin(identifier: string, rawPassword: string): Promise<UserAccount | null> {
    const raw = localStorage.getItem(LS_OFFLINE_AUTH_KEY);
    if (!raw) return null;
    const list: OfflineCredentialEntry[] = JSON.parse(raw);
    const idLower = identifier.trim().toLowerCase();
    const entry = list.find((e) => e.username === idLower || e.email === idLower);
    if (!entry) return null;
    const digest = await sha256Hex(`${entry.username}::${rawPassword}`);
    if (digest !== entry.credentialDigest) return null;
    return entry.user;
  },

  saveSession(token: string, user: UserAccount, mode: 'online' | 'offline'): void {
    localStorage.setItem(LS_SESSION_KEY, JSON.stringify({ token, user, mode }));
  },

  loadSession(): { token: string; user: UserAccount; mode: 'online' | 'offline' } | null {
    try {
      const raw = localStorage.getItem(LS_SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  clearSession(): void {
    localStorage.removeItem(LS_SESSION_KEY);
  },
};
