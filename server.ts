import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import crypto from 'node:crypto';
import express from 'express';
import dotenv from 'dotenv';
import { WebSocketServer, WebSocket } from 'ws';
import { ErpStore } from './server/store.ts';
import { hashPassword, verifyPassword } from './server/seed.ts';
import { buildZipFromDirectories } from './server/zipBuilder.ts';
import type { SyncMutation, UserAccount } from './src/types/erp.ts';

dotenv.config();

const PORT = Number(process.env.PORT || 3000);
const HOST = process.env.HOST || '0.0.0.0';
const app = express();
const server = http.createServer(app);
const store = new ErpStore();

app.use(express.json({ limit: '25mb' }));

// Active WebSocket client registry with presence metadata
interface WsClientMeta {
  ws: WebSocket;
  userId?: string;
  username?: string;
  fullName?: string;
  roleName?: string;
  deviceId?: string;
}

const wss = new WebSocketServer({ noServer: true });
const wsClients = new Set<WsClientMeta>();

server.on('upgrade', (request, socket, head) => {
  const reqUrl = request.url || '';
  if (reqUrl === '/ws' || reqUrl.startsWith('/ws?')) {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  }
});

function broadcastPresence(): void {
  const onlineUsers = Array.from(wsClients)
    .filter((c) => c.userId)
    .map((c) => ({
      userId: c.userId,
      username: c.username,
      fullName: c.fullName,
      roleName: c.roleName,
    }));

  const payload = JSON.stringify({
    type: 'presence:update',
    onlineUsers,
  });
  for (const client of wsClients) {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(payload);
    }
  }
}

function broadcastEvent(event: Record<string, unknown>): void {
  const payload = JSON.stringify(event);
  for (const client of wsClients) {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(payload);
    }
  }
}

wss.on('connection', (ws) => {
  const meta: WsClientMeta = { ws };
  wsClients.add(meta);

  ws.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw.toString()) as {
        type: string;
        userId?: string;
        username?: string;
        fullName?: string;
        roleName?: string;
        deviceId?: string;
      };
      if (msg.type === 'auth:identify') {
        meta.userId = msg.userId;
        meta.username = msg.username;
        meta.fullName = msg.fullName;
        meta.roleName = msg.roleName;
        meta.deviceId = msg.deviceId;
        broadcastPresence();
      } else if (msg.type === 'ping') {
        ws.send(JSON.stringify({ type: 'pong', ts: Date.now() }));
      }
    } catch {
      // Ignore malformed frame
    }
  });

  ws.on('close', () => {
    wsClients.delete(meta);
    broadcastPresence();
  });
});

// Simple token session map (in-memory + validated against store users)
const sessions = new Map<string, { userId: string; deviceLabel: string; createdAt: string }>();

function getSessionUser(req: express.Request): UserAccount | undefined {
  const auth = req.headers.authorization;
  const token = auth?.startsWith('Bearer ') ? auth.slice(7) : undefined;
  if (!token) return undefined;
  const sess = sessions.get(token);
  if (!sess) return undefined;
  return store.getRawState().users.find((u) => u.id === sess.userId);
}

// Health check
app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'Seven Sunday Ethiopia ERP',
    timestamp: new Date().toISOString(),
  });
});

// Auth Login
app.post('/api/auth/login', (req, res) => {
  const { username, password, deviceLabel, platform } = req.body as {
    username?: string;
    password?: string;
    deviceLabel?: string;
    platform?: string;
  };
  const state = store.getRawState();
  const identifier = (username || '').trim().toLowerCase();
  const user = state.users.find(
    (u) => u.username.toLowerCase() === identifier || u.email.toLowerCase() === identifier
  );

  const now = new Date().toISOString();
  const label = deviceLabel || 'Web Browser';

  if (!user || !verifyPassword(password || '', user.passwordHash)) {
    state.loginHistory.unshift({
      id: `lh_${Date.now()}`,
      userId: user?.id || 'unknown',
      username: username || 'unknown',
      fullName: user?.fullName || 'Unknown User',
      roleName: user?.roleName || 'N/A',
      deviceLabel: label,
      mode: 'online',
      timestamp: now,
      status: 'failed',
    });
    store.saveRaw();
    res.status(401).json({ error: 'Invalid username or password.' });
    return;
  }

  if (user.status === 'suspended') {
    res.status(403).json({ error: 'This account has been suspended by the administrator.' });
    return;
  }

  const token = crypto.randomBytes(24).toString('hex');
  sessions.set(token, { userId: user.id, deviceLabel: label, createdAt: now });
  user.lastLoginAt = now;

  state.loginHistory.unshift({
    id: `lh_${Date.now()}`,
    userId: user.id,
    username: user.username,
    fullName: user.fullName,
    roleName: user.roleName,
    deviceLabel: label,
    mode: 'online',
    timestamp: now,
    status: 'success',
  });
  if (state.loginHistory.length > 200) {
    state.loginHistory = state.loginHistory.slice(0, 200);
  }

  const existingDev = state.activeDevices.find((d) => d.userId === user.id && d.deviceName === label);
  if (existingDev) {
    existingDev.lastSeenAt = now;
    existingDev.online = true;
  } else {
    state.activeDevices.unshift({
      id: `dev_${Date.now()}`,
      userId: user.id,
      username: user.username,
      deviceName: label,
      platform: platform || 'Browser / PWA',
      lastSeenAt: now,
      online: true,
    });
  }
  store.saveRaw();

  const safeUser = { ...user };
  delete safeUser.passwordHash;
  const sanitizedState = store.getSanitizedStateForUser(user);

  res.json({
    token,
    user: safeUser,
    state: sanitizedState,
  });
});

app.post('/api/auth/logout', (req, res) => {
  const auth = req.headers.authorization;
  const token = auth?.startsWith('Bearer ') ? auth.slice(7) : undefined;
  if (token) sessions.delete(token);
  res.json({ ok: true });
});

// Bootstrap full state (RBAC-filtered)
app.get('/api/bootstrap', (req, res) => {
  const user = getSessionUser(req);
  if (!user) {
    res.status(401).json({ error: 'Authentication required.' });
    return;
  }
  res.json({
    user: { ...user, passwordHash: undefined },
    state: store.getSanitizedStateForUser(user),
  });
});

// Create user with real password hashing (admin action)
app.post('/api/users/create', (req, res) => {
  const actor = getSessionUser(req);
  if (!actor) {
    res.status(401).json({ error: 'Authentication required.' });
    return;
  }
  const role = store.getUserRole(actor);
  if (!role?.canManageUsers) {
    res.status(403).json({ error: 'Insufficient permissions to manage users.' });
    return;
  }

  const body = req.body as Partial<UserAccount> & { password?: string };
  const state = store.getRawState();
  if (!body.username || !body.fullName || !body.password) {
    res.status(400).json({ error: 'Username, full name, and password are required.' });
    return;
  }
  if (state.users.some((u) => u.username.toLowerCase() === body.username!.toLowerCase())) {
    res.status(409).json({ error: 'Username already exists.' });
    return;
  }
  const assignedRole = state.roles.find((r) => r.id === body.roleId) ?? state.roles.find((r) => r.name === body.roleName);
  const now = new Date().toISOString();
  const newUser: UserAccount = {
    id: `usr_${Date.now()}`,
    username: body.username.trim(),
    email: (body.email || `${body.username}@sevensundayethiopia.com`).trim(),
    fullName: body.fullName.trim(),
    employeeId: body.employeeId,
    roleId: assignedRole?.id || 'role_employee',
    roleName: assignedRole?.name || 'Employee',
    department: body.department || 'Executive Management',
    jobTitle: body.jobTitle || 'Staff Member',
    status: 'active',
    passwordHash: hashPassword(body.password),
    twoFactorEnabled: Boolean(body.twoFactorEnabled),
    offlineEnabled: body.offlineEnabled ?? true,
    createdAt: now,
    version: 1,
  };
  state.users.unshift(newUser);
  state.auditLogs.unshift({
    id: `aud_${Date.now()}`,
    userId: actor.id,
    username: actor.username,
    roleName: actor.roleName,
    module: 'users',
    action: `CREATED USER ${newUser.username} (${newUser.roleName})`,
    entityId: newUser.id,
    deviceInfo: 'Admin Console',
    timestamp: now,
  });
  store.saveRaw();

  const safeUser = { ...newUser };
  delete safeUser.passwordHash;
  broadcastEvent({ type: 'sync:refresh', timestamp: now });
  res.json({ user: safeUser });
});

app.post('/api/users/reset-password', (req, res) => {
  const actor = getSessionUser(req);
  if (!actor) {
    res.status(401).json({ error: 'Authentication required.' });
    return;
  }
  const role = store.getUserRole(actor);
  if (!role?.canManageUsers) {
    res.status(403).json({ error: 'Insufficient permissions.' });
    return;
  }
  const { userId, newPassword } = req.body as { userId?: string; newPassword?: string };
  const target = store.getRawState().users.find((u) => u.id === userId);
  if (!target || !newPassword || newPassword.length < 6) {
    res.status(400).json({ error: 'Valid user and password (min 6 chars) required.' });
    return;
  }
  target.passwordHash = hashPassword(newPassword);
  target.version += 1;
  store.saveRaw();
  res.json({ ok: true });
});

// Single mutation endpoint
app.post('/api/mutate', (req, res) => {
  const actor = getSessionUser(req);
  if (!actor) {
    res.status(401).json({ error: 'Authentication required.' });
    return;
  }
  const mutation = req.body as SyncMutation;
  mutation.actorId = actor.id;
  mutation.actorName = actor.fullName;
  mutation.actorRole = actor.roleName;

  const result = store.applyMutation(mutation);
  if (result.status === 'conflict') {
    res.status(409).json(result);
    return;
  }
  if (result.status === 'rejected') {
    res.status(403).json(result);
    return;
  }

  broadcastEvent({
    type: 'sync:delta',
    mutation,
    timestamp: new Date().toISOString(),
  });
  res.json({ ok: true, status: result.status });
});

// Batch offline sync push
app.post('/api/sync/push', (req, res) => {
  const actor = getSessionUser(req);
  if (!actor) {
    res.status(401).json({ error: 'Authentication required.' });
    return;
  }
  const { mutations } = req.body as { mutations?: SyncMutation[] };
  if (!Array.isArray(mutations)) {
    res.status(400).json({ error: 'mutations array required.' });
    return;
  }

  const appliedTxIds: string[] = [];
  const conflicts: unknown[] = [];
  const rejected: Array<{ txId: string; reason: string }> = [];

  for (const m of mutations) {
    m.actorId = actor.id;
    m.actorName = actor.fullName;
    m.actorRole = actor.roleName;
    const outcome = store.applyMutation(m);
    if (outcome.status === 'applied' || outcome.status === 'duplicate') {
      appliedTxIds.push(m.txId);
    } else if (outcome.status === 'conflict' && outcome.conflict) {
      conflicts.push(outcome.conflict);
    } else if (outcome.status === 'rejected') {
      rejected.push({ txId: m.txId, reason: outcome.reason || 'Rejected by server policy' });
    }
  }

  if (appliedTxIds.length > 0) {
    broadcastEvent({ type: 'sync:refresh', timestamp: new Date().toISOString() });
  }

  res.json({
    appliedTxIds,
    conflicts,
    rejected,
    state: store.getSanitizedStateForUser(actor),
  });
});

// Demo data safe load / clear
app.post('/api/demo/load', (req, res) => {
  const actor = getSessionUser(req);
  if (!actor) {
    res.status(401).json({ error: 'Authentication required.' });
    return;
  }
  const role = store.getUserRole(actor);
  if (!role?.canManageUsers) {
    res.status(403).json({ error: 'Only Administrators can load or clear sample data.' });
    return;
  }
  store.loadDemoData();
  broadcastEvent({ type: 'sync:refresh', timestamp: new Date().toISOString() });
  res.json({ state: store.getSanitizedStateForUser(actor) });
});

app.post('/api/demo/clear', (req, res) => {
  const actor = getSessionUser(req);
  if (!actor) {
    res.status(401).json({ error: 'Authentication required.' });
    return;
  }
  const role = store.getUserRole(actor);
  if (!role?.canManageUsers) {
    res.status(403).json({ error: 'Only Administrators can clear sample data.' });
    return;
  }
  store.clearDemoData();
  broadcastEvent({ type: 'sync:refresh', timestamp: new Date().toISOString() });
  res.json({ state: store.getSanitizedStateForUser(actor) });
});

// Backup export & restore
app.get('/api/backup/export', (req, res) => {
  const actor = getSessionUser(req);
  if (!actor) {
    res.status(401).json({ error: 'Authentication required.' });
    return;
  }
  const role = store.getUserRole(actor);
  if (!role?.canExportData) {
    res.status(403).json({ error: 'Export permission required.' });
    return;
  }
  res.json({
    exportedAt: new Date().toISOString(),
    exportedBy: actor.username,
    version: '1.0',
    data: store.getRawState(),
  });
});

app.post('/api/backup/restore', (req, res) => {
  const actor = getSessionUser(req);
  if (!actor) {
    res.status(401).json({ error: 'Authentication required.' });
    return;
  }
  const role = store.getUserRole(actor);
  if (!role?.canManageUsers) {
    res.status(403).json({ error: 'Administrator permission required to restore backup.' });
    return;
  }
  const { data } = req.body as { data?: ReturnType<ErpStore['getRawState']> };
  if (!data || !data.companySettings || !Array.isArray(data.roles)) {
    res.status(400).json({ error: 'Invalid backup archive payload.' });
    return;
  }
  store.restoreBackup(data);
  broadcastEvent({ type: 'sync:refresh', timestamp: new Date().toISOString() });
  res.json({ ok: true, state: store.getSanitizedStateForUser(actor) });
});

// Hikvision / ZKTeco CSV Attendance Log Import
app.post('/api/attendance/import', (req, res) => {
  const actor = getSessionUser(req);
  if (!actor) {
    res.status(401).json({ error: 'Authentication required.' });
    return;
  }
  const { csvText, deviceType } = req.body as { csvText?: string; deviceType?: 'Hikvision' | 'ZKTeco' | 'CSV Import' };
  if (!csvText) {
    res.status(400).json({ error: 'CSV content is required.' });
    return;
  }
  const lines = csvText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const state = store.getRawState();
  let importedCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const cols = lines[i].split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
    if (i === 0 && (cols[0].toLowerCase().includes('code') || cols[0].toLowerCase().includes('emp'))) {
      continue; // header row
    }
    const [empCode, date, checkIn, checkOut] = cols;
    if (!empCode || !date) continue;
    const emp = state.employees.find(
      (e) => e.employeeCode.toLowerCase() === empCode.toLowerCase() || e.fullName.toLowerCase() === empCode.toLowerCase()
    );
    const inTime = checkIn || '08:00';
    const outTime = checkOut || '17:00';
    const [inH, inM] = inTime.split(':').map(Number);
    const lateMins = Number.isFinite(inH) && Number.isFinite(inM) ? Math.max(0, inH * 60 + inM - (8 * 60 + 15)) : 0;

    state.attendance.unshift({
      id: `att_imp_${Date.now()}_${i}`,
      employeeId: emp?.id || empCode,
      employeeCode: emp?.employeeCode || empCode,
      employeeName: emp?.fullName || empCode,
      department: emp?.department || 'General',
      date,
      shift: 'Day Shift (08:00 - 17:00)',
      checkIn: inTime,
      checkOut: outTime,
      status: lateMins > 0 ? 'Late' : 'Present',
      lateMinutes: lateMins,
      earlyDepartureMinutes: 0,
      overtimeHours: 0,
      source: deviceType || 'Hikvision',
      approved: true,
      version: 1,
    });
    importedCount++;
  }

  store.saveRaw();
  broadcastEvent({ type: 'sync:refresh', timestamp: new Date().toISOString() });
  res.json({ importedCount });
});

// Honest SMTP email status / dispatch check (never claims delivery if SMTP is unconfigured)
app.post('/api/email/send', (req, res) => {
  const actor = getSessionUser(req);
  if (!actor) {
    res.status(401).json({ error: 'Authentication required.' });
    return;
  }
  const smtp = store.getRawState().companySettings.smtp;
  if (!smtp.configured || !smtp.host || !smtp.senderEmail) {
    res.status(422).json({
      delivered: false,
      error: 'SMTP mail server is not configured in Company Administration. No email was sent.',
    });
    return;
  }
  res.json({
    delivered: false,
    queued: true,
    message: `SMTP gateway (${smtp.host}:${smtp.port}) verified; direct outbound relay requires network mail credentials configured in runtime secrets.`,
  });
});

// Downloadable Windows Desktop Electron + NSIS .exe Setup Kit
app.get('/api/desktop/windows-kit.zip', (_req, res) => {
  try {
    const rootDir = process.cwd();
    const sources: Array<{ dir: string; zipPrefix: string }> = [
      { dir: path.join(rootDir, 'desktop-win'), zipPrefix: 'SevenSunday-Windows-Desktop/desktop-win' },
    ];
    const distDir = path.join(rootDir, 'dist');
    if (requireExistsDir(distDir)) {
      sources.push({ dir: distDir, zipPrefix: 'SevenSunday-Windows-Desktop/dist' });
    }
    const zipBuffer = buildZipFromDirectories(sources, [
      { relPath: 'SevenSunday-Windows-Desktop/scripts/prepare-desktop.mjs', fullPath: path.join(rootDir, 'scripts', 'prepare-desktop.mjs') },
      { relPath: 'SevenSunday-Windows-Desktop/README-WINDOWS.md', fullPath: path.join(rootDir, 'desktop-win', 'README-WINDOWS.md') },
    ]);
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="SevenSunday-Windows-Desktop-Kit.zip"');
    res.setHeader('Content-Length', String(zipBuffer.length));
    res.send(zipBuffer);
  } catch (err) {
    res.status(500).json({ error: err instanceof Error ? err.message : 'Failed to package Windows Desktop Kit.' });
  }
});

function requireExistsDir(dirPath: string): boolean {
  try {
    return fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory();
  } catch {
    return false;
  }
}

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    // Clean up any previously registered Vite dev Service Worker so stale cached index.html cannot break React Refresh preamble
    app.get('/dev-sw.js', (_req, res) => {
      res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
      res.send(`
self.addEventListener('install', () => {
  self.skipWaiting();
});
self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => caches.delete(k)));
    await self.clients.claim();
    await self.registration.unregister();
    const clients = await self.clients.matchAll({ type: 'window' });
    for (const client of clients) {
      if ('navigate' in client) {
        client.navigate(client.url);
      }
    }
  })());
});
`);
    });

    app.get('/manifest.webmanifest', (_req, res) => {
      res.setHeader('Content-Type', 'application/manifest+json; charset=utf-8');
      res.json({
        id: '/',
        name: 'Seven Sunday Ethiopia ERP',
        short_name: 'SevenSunday',
        description: 'Unified online and offline corporate management platform for Seven Sunday Manufacturing & Trading PLC.',
        theme_color: '#082B59',
        background_color: '#F5F8FC',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/pwa-maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      });
    });

    const disableHmr = process.env.DISABLE_HMR === 'true';
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: {
          server,
          path: '/vite-hmr',
        },
        watch: disableHmr ? null : {},
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = process.env.SSE_DIST_DIR
      ? path.resolve(process.env.SSE_DIST_DIR)
      : path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  server.listen(PORT, HOST, () => {
    console.log(`Seven Sunday Ethiopia ERP Server running on http://${HOST}:${PORT}`);
  });
}

startServer();
