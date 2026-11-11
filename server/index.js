// OpenPilates server — zero runtime dependencies (Node 22+: node:http, node:sqlite, node:crypto).
import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync, createReadStream } from 'node:fs';
import { join, extname, resolve, normalize } from 'node:path';
import { randomBytes } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { openDb, loadLibrary, libraryVersionOf, getSetting, setSetting } from './db.js';
import { hashPassword, verifyPassword, passwordProblem, createSession, userForToken, parseCookies, loginBlocked, noteFailure, clearFailures } from './auth.js';
import { cleanMovement, cleanFlow, cleanClient, cleanStudio, defaultStudio, Invalid, slugify } from './validate.js';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const PKG = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
const VERSION = PKG.version;

const config = {
  port: Number(process.env.PORT || 8080),
  host: process.env.HOST || '0.0.0.0',
  dataDir: process.env.DATA_DIR || join(ROOT, 'data'),
  libraryDir: process.env.LIBRARY_DIR || join(ROOT, 'library', 'movements'),
  secureCookies: process.env.SECURE_COOKIES || 'auto', // auto | true | false
  trustProxy: process.env.TRUST_PROXY !== 'false'
};

export function createApp(opts = {}) {
  const cfg = { ...config, ...opts };
  const db = openDb(cfg.dataDir);
  const loaded = loadLibrary(db, cfg.libraryDir);
  if (!cfg.quiet) console.log(`OpenPilates ${VERSION}: ${loaded} library movements loaded, data in ${cfg.dataDir}`);

  // Optional first admin from environment (handy for scripted installs).
  const userCount = () => db.prepare('SELECT COUNT(*) n FROM users').get().n;
  if (!userCount() && process.env.ADMIN_USERNAME && process.env.ADMIN_PASSWORD) {
    if (passwordProblem(process.env.ADMIN_PASSWORD)) console.warn('ADMIN_PASSWORD is too short (10+ characters); use the setup page instead.');
    else {
      db.prepare('INSERT INTO users (username, display_name, role, pass_hash) VALUES (?, ?, ?, ?)').run(process.env.ADMIN_USERNAME, process.env.ADMIN_USERNAME, 'admin', hashPassword(process.env.ADMIN_PASSWORD));
      setSetting(db, 'studio', defaultStudio(process.env.STUDIO_NAME || 'My studio'));
    }
  }

  const studio = () => getSetting(db, 'studio', defaultStudio());

  // ---------- helpers
  const send = (res, status, body, headers = {}) => {
    const data = typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body);
    res.writeHead(status, { 'Content-Type': typeof body === 'object' && !Buffer.isBuffer(body) ? 'application/json; charset=utf-8' : 'text/plain; charset=utf-8', 'Cache-Control': 'no-store', ...headers });
    res.end(data);
  };
  const fail = (res, status, message) => send(res, status, { error: message });
  const readBody = (req) => new Promise((ok, bad) => {
    let size = 0;
    const chunks = [];
    req.on('data', (c) => { size += c.length; if (size > 5e6) { bad(new Invalid('Request too large.')); req.destroy(); } else chunks.push(c); });
    req.on('end', () => {
      if (!chunks.length) return ok({});
      try { ok(JSON.parse(Buffer.concat(chunks).toString('utf8'))); } catch { bad(new Invalid('Request body must be JSON.')); }
    });
    req.on('error', bad);
  });
  const isHttps = (req) => cfg.secureCookies === 'true' || (cfg.secureCookies === 'auto' && cfg.trustProxy && String(req.headers['x-forwarded-proto'] || '').split(',')[0].trim() === 'https');
  const clientIp = (req) => (cfg.trustProxy && String(req.headers['x-forwarded-for'] || '').split(',')[0].trim()) || req.socket.remoteAddress || '?';
  const sessionCookie = (req, token, maxAge) => `op_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${isHttps(req) ? '; Secure' : ''}`;

  const movementRow = (r, notes) => {
    const d = JSON.parse(r.data);
    return { ...d, source: r.source, ownerId: r.owner_id, updatedAt: r.updated_at, myNote: notes ? notes[r.slug] || '' : undefined };
  };
  const allMovements = (userId) => {
    const notes = {};
    if (userId) for (const n of db.prepare('SELECT slug, text FROM movement_notes WHERE user_id = ?').all(userId)) notes[n.slug] = n.text;
    return db.prepare('SELECT * FROM movements ORDER BY apparatus, slug').all().map((r) => movementRow(r, notes));
  };
  const flowOut = (r, user) => {
    const owner = r.owner_id ? db.prepare('SELECT display_name FROM users WHERE id = ?').get(r.owner_id) : null;
    return { id: r.id, title: r.title, shared: !!r.shared, ownerId: r.owner_id, ownerName: owner ? owner.display_name : 'Former instructor', canEdit: !!user && (user.role === 'admin' || r.owner_id === user.id), createdAt: r.created_at, updatedAt: r.updated_at, ...JSON.parse(r.data) };
  };
  const canSeeFlow = (r, user) => r && (r.owner_id === user.id || r.shared || user.role === 'admin');
  const clientOut = (r) => ({ id: r.id, name: r.name, notes: r.notes, tags: JSON.parse(r.tags), archived: !!r.archived, updatedAt: r.updated_at });
  const userOut = (r) => ({ id: r.id, username: r.username, displayName: r.display_name, role: r.role, disabled: !!r.disabled, createdAt: r.created_at });
  const newFlowId = () => randomBytes(9).toString('base64url');
  const stripClients = (data) => { const d = { ...data }; delete d.booked; return d; };

  // ---------- routes
  const routes = [];
  const route = (method, pattern, handler, opts = {}) => {
    const keys = [];
    const re = new RegExp('^' + pattern.replace(/:(\w+)/g, (_, k) => { keys.push(k); return '([^/]+)'; }) + '$');
    routes.push({ method, re, keys, handler, auth: opts.auth ?? 'user' });
  };

  route('GET', '/api/health', (req, res) => send(res, 200, { ok: true, version: VERSION }), { auth: 'none' });

  route('GET', '/api/state', (req, res, { user }) => {
    send(res, 200, { version: VERSION, setupNeeded: userCount() === 0, user, studioName: userCount() ? studio().name : null });
  }, { auth: 'optional' });

  route('POST', '/api/setup', async (req, res) => {
    if (userCount() > 0) return fail(res, 409, 'This studio is already set up.');
    const b = await readBody(req);
    const username = String(b.username || '').trim().toLowerCase();
    if (!/^[a-z0-9._-]{2,40}$/.test(username)) return fail(res, 400, 'Usernames use 2–40 letters, numbers, dots, dashes or underscores.');
    const p = passwordProblem(b.password); if (p) return fail(res, 400, p);
    const info = db.prepare('INSERT INTO users (username, display_name, role, pass_hash) VALUES (?, ?, ?, ?)').run(username, String(b.displayName || username).slice(0, 80), 'admin', hashPassword(b.password));
    setSetting(db, 'studio', defaultStudio(String(b.studioName || 'My studio').slice(0, 80), b.brand));
    const s = createSession(db, Number(info.lastInsertRowid));
    send(res, 201, { ok: true }, { 'Set-Cookie': sessionCookie(req, s.token, s.maxAge) });
  }, { auth: 'none' });

  route('POST', '/api/login', async (req, res) => {
    const ip = clientIp(req);
    if (loginBlocked(ip)) return fail(res, 429, 'Too many attempts. Wait 15 minutes and try again.');
    const b = await readBody(req);
    const row = db.prepare('SELECT * FROM users WHERE username = ?').get(String(b.username || '').trim());
    if (!row || row.disabled || !verifyPassword(b.password, row.pass_hash)) { noteFailure(ip); return fail(res, 401, 'That username and password don\'t match.'); }
    clearFailures(ip);
    const s = createSession(db, row.id);
    send(res, 200, { ok: true, user: { id: row.id, username: row.username, displayName: row.display_name, role: row.role } }, { 'Set-Cookie': sessionCookie(req, s.token, s.maxAge) });
  }, { auth: 'none' });

  route('POST', '/api/logout', (req, res, { token }) => {
    if (token) db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
    send(res, 200, { ok: true }, { 'Set-Cookie': sessionCookie(req, '', 0) });
  }, { auth: 'optional' });

  route('PUT', '/api/me', async (req, res, { user }) => {
    const b = await readBody(req);
    if (b.displayName) db.prepare('UPDATE users SET display_name = ? WHERE id = ?').run(String(b.displayName).slice(0, 80), user.id);
    if (b.newPassword) {
      const row = db.prepare('SELECT pass_hash FROM users WHERE id = ?').get(user.id);
      if (!verifyPassword(b.currentPassword, row.pass_hash)) return fail(res, 400, 'Your current password is wrong.');
      const p = passwordProblem(b.newPassword); if (p) return fail(res, 400, p);
      db.prepare('UPDATE users SET pass_hash = ? WHERE id = ?').run(hashPassword(b.newPassword), user.id);
    }
    send(res, 200, { ok: true });
  });

  // ---- users (admin)
  route('GET', '/api/users', (req, res) => send(res, 200, db.prepare('SELECT * FROM users ORDER BY display_name').all().map(userOut)), { auth: 'admin' });
  route('POST', '/api/users', async (req, res) => {
    const b = await readBody(req);
    const username = String(b.username || '').trim().toLowerCase();
    if (!/^[a-z0-9._-]{2,40}$/.test(username)) return fail(res, 400, 'Usernames use 2–40 letters, numbers, dots, dashes or underscores.');
    const p = passwordProblem(b.password); if (p) return fail(res, 400, p);
    if (db.prepare('SELECT 1 FROM users WHERE username = ?').get(username)) return fail(res, 409, 'That username is taken.');
    const info = db.prepare('INSERT INTO users (username, display_name, role, pass_hash) VALUES (?, ?, ?, ?)').run(username, String(b.displayName || username).slice(0, 80), b.role === 'admin' ? 'admin' : 'instructor', hashPassword(b.password));
    send(res, 201, userOut(db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid)));
  }, { auth: 'admin' });
  route('PUT', '/api/users/:id', async (req, res, { user, params }) => {
    const id = Number(params.id);
    const row = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    if (!row) return fail(res, 404, 'No such user.');
    const b = await readBody(req);
    const admins = db.prepare("SELECT COUNT(*) n FROM users WHERE role = 'admin' AND disabled = 0").get().n;
    const losingAdmin = row.role === 'admin' && !row.disabled && ((b.role && b.role !== 'admin') || b.disabled === true);
    if (losingAdmin && admins <= 1) return fail(res, 400, 'Keep at least one active admin.');
    if (b.displayName) db.prepare('UPDATE users SET display_name = ? WHERE id = ?').run(String(b.displayName).slice(0, 80), id);
    if (b.role) db.prepare('UPDATE users SET role = ? WHERE id = ?').run(b.role === 'admin' ? 'admin' : 'instructor', id);
    if (typeof b.disabled === 'boolean') {
      db.prepare('UPDATE users SET disabled = ? WHERE id = ?').run(b.disabled ? 1 : 0, id);
      if (b.disabled) db.prepare('DELETE FROM sessions WHERE user_id = ?').run(id);
    }
    if (b.password) {
      const p = passwordProblem(b.password); if (p) return fail(res, 400, p);
      db.prepare('UPDATE users SET pass_hash = ? WHERE id = ?').run(hashPassword(b.password), id);
      if (id !== user.id) db.prepare('DELETE FROM sessions WHERE user_id = ?').run(id);
    }
    send(res, 200, userOut(db.prepare('SELECT * FROM users WHERE id = ?').get(id)));
  }, { auth: 'admin' });

  // ---- studio
  route('GET', '/api/studio', (req, res) => send(res, 200, studio()));
  route('PUT', '/api/studio', async (req, res) => {
    const s = cleanStudio(await readBody(req));
    setSetting(db, 'studio', s);
    send(res, 200, s);
  }, { auth: 'admin' });

  // ---- movements
  route('GET', '/api/movements', (req, res, { user }) => send(res, 200, allMovements(user.id)));
  route('GET', '/api/movements/:slug', (req, res, { user, params }) => {
    const r = db.prepare('SELECT * FROM movements WHERE slug = ?').get(params.slug);
    if (!r) return fail(res, 404, 'No such movement.');
    const note = db.prepare('SELECT text FROM movement_notes WHERE user_id = ? AND slug = ?').get(user.id, params.slug);
    send(res, 200, { ...movementRow(r), myNote: note ? note.text : '', hasLibraryVersion: !!libraryVersionOf(cfg.libraryDir, params.slug) });
  });
  route('POST', '/api/movements', async (req, res, { user }) => {
    const mv = cleanMovement(await readBody(req));
    if (!mv.slug) return fail(res, 400, 'Give the movement a name.');
    let slug = mv.slug;
    for (let i = 2; db.prepare('SELECT 1 FROM movements WHERE slug = ?').get(slug); i++) slug = `${mv.slug}-${i}`;
    mv.slug = slug;
    db.prepare("INSERT INTO movements (slug, apparatus, data, source, owner_id) VALUES (?, ?, ?, 'custom', ?)").run(slug, mv.apparatus, JSON.stringify(mv), user.id);
    send(res, 201, movementRow(db.prepare('SELECT * FROM movements WHERE slug = ?').get(slug)));
  });
  route('PUT', '/api/movements/:slug', async (req, res, { user, params }) => {
    const r = db.prepare('SELECT * FROM movements WHERE slug = ?').get(params.slug);
    if (!r) return fail(res, 404, 'No such movement.');
    const mine = r.source === 'custom' && r.owner_id === user.id;
    if (!mine && user.role !== 'admin') return fail(res, 403, 'Only an admin can change library movements. Duplicate it to make your own version.');
    const mv = cleanMovement(await readBody(req), { slug: params.slug });
    const source = r.source === 'library' ? 'studio' : r.source;
    db.prepare("UPDATE movements SET data = ?, apparatus = ?, source = ?, owner_id = COALESCE(owner_id, ?), updated_at = datetime('now') WHERE slug = ?").run(JSON.stringify(mv), mv.apparatus, source, user.id, params.slug);
    send(res, 200, movementRow(db.prepare('SELECT * FROM movements WHERE slug = ?').get(params.slug)));
  });
  route('DELETE', '/api/movements/:slug', (req, res, { user, params }) => {
    const r = db.prepare('SELECT * FROM movements WHERE slug = ?').get(params.slug);
    if (!r) return fail(res, 404, 'No such movement.');
    if (r.source === 'library') return fail(res, 400, 'Library movements can\'t be deleted.');
    if (!(r.source === 'custom' && r.owner_id === user.id) && user.role !== 'admin') return fail(res, 403, 'You can only delete your own movements.');
    const lib = libraryVersionOf(cfg.libraryDir, params.slug);
    if (lib) db.prepare("UPDATE movements SET data = ?, apparatus = ?, source = 'library', owner_id = NULL, updated_at = datetime('now') WHERE slug = ?").run(JSON.stringify(lib), lib.apparatus, params.slug);
    else db.prepare('DELETE FROM movements WHERE slug = ?').run(params.slug);
    send(res, 200, { ok: true, restored: !!lib });
  });
  route('PUT', '/api/movements/:slug/note', async (req, res, { user, params }) => {
    const b = await readBody(req);
    const text = String(b.text || '').slice(0, 4000);
    if (text.trim()) db.prepare('INSERT INTO movement_notes (user_id, slug, text) VALUES (?, ?, ?) ON CONFLICT(user_id, slug) DO UPDATE SET text = excluded.text').run(user.id, params.slug, text);
    else db.prepare('DELETE FROM movement_notes WHERE user_id = ? AND slug = ?').run(user.id, params.slug);
    send(res, 200, { ok: true });
  });

  // ---- flows
  route('GET', '/api/flows', (req, res, { user }) => {
    const rows = user.role === 'admin'
      ? db.prepare('SELECT * FROM flows ORDER BY updated_at DESC').all()
      : db.prepare('SELECT * FROM flows WHERE owner_id = ? OR shared = 1 ORDER BY updated_at DESC').all(user.id);
    send(res, 200, rows.map((r) => flowOut(r, user)));
  });
  route('POST', '/api/flows', async (req, res, { user }) => {
    const f = cleanFlow(await readBody(req));
    const id = newFlowId();
    db.prepare('INSERT INTO flows (id, owner_id, title, data) VALUES (?, ?, ?, ?)').run(id, user.id, f.title, JSON.stringify(f));
    send(res, 201, flowOut(db.prepare('SELECT * FROM flows WHERE id = ?').get(id), user));
  });
  route('GET', '/api/flows/:id', (req, res, { user, params }) => {
    const r = db.prepare('SELECT * FROM flows WHERE id = ?').get(params.id);
    if (!canSeeFlow(r, user)) return fail(res, 404, 'No such flow.');
    send(res, 200, flowOut(r, user));
  });
  route('PUT', '/api/flows/:id', async (req, res, { user, params }) => {
    const r = db.prepare('SELECT * FROM flows WHERE id = ?').get(params.id);
    if (!canSeeFlow(r, user)) return fail(res, 404, 'No such flow.');
    if (r.owner_id !== user.id && user.role !== 'admin') return fail(res, 403, 'This flow belongs to someone else. Duplicate it to make your own copy.');
    const b = await readBody(req);
    const f = cleanFlow(b);
    db.prepare("UPDATE flows SET title = ?, data = ?, shared = ?, updated_at = datetime('now') WHERE id = ?").run(f.title, JSON.stringify(f), typeof b.shared === 'boolean' ? (b.shared ? 1 : 0) : r.shared, params.id);
    send(res, 200, flowOut(db.prepare('SELECT * FROM flows WHERE id = ?').get(params.id), user));
  });
  route('DELETE', '/api/flows/:id', (req, res, { user, params }) => {
    const r = db.prepare('SELECT * FROM flows WHERE id = ?').get(params.id);
    if (!canSeeFlow(r, user)) return fail(res, 404, 'No such flow.');
    if (r.owner_id !== user.id && user.role !== 'admin') return fail(res, 403, 'Only the owner or an admin can delete this flow.');
    db.prepare('DELETE FROM flows WHERE id = ?').run(params.id);
    send(res, 200, { ok: true });
  });
  route('POST', '/api/flows/:id/duplicate', (req, res, { user, params }) => {
    const r = db.prepare('SELECT * FROM flows WHERE id = ?').get(params.id);
    if (!canSeeFlow(r, user)) return fail(res, 404, 'No such flow.');
    const data = JSON.parse(r.data);
    if (r.owner_id !== user.id) delete data.booked;
    data.title = `${data.title} (copy)`;
    const id = newFlowId();
    db.prepare('INSERT INTO flows (id, owner_id, title, data) VALUES (?, ?, ?, ?)').run(id, user.id, data.title, JSON.stringify(data));
    send(res, 201, flowOut(db.prepare('SELECT * FROM flows WHERE id = ?').get(id), user));
  });
  route('GET', '/api/flows/:id/export', (req, res, { user, params }) => {
    const r = db.prepare('SELECT * FROM flows WHERE id = ?').get(params.id);
    if (!canSeeFlow(r, user)) return fail(res, 404, 'No such flow.');
    const data = stripClients(JSON.parse(r.data));
    // Include any custom movements the flow uses so the file works on another server.
    const slugs = new Set(data.segments.flatMap((s) => s.items.map((i) => i.slug)));
    const custom = [...slugs].map((s) => db.prepare("SELECT * FROM movements WHERE slug = ? AND source != 'library'").get(s)).filter(Boolean).map((m) => JSON.parse(m.data));
    const file = { openpilates: 'flow', version: 1, exportedAt: new Date().toISOString(), flow: data, movements: custom };
    send(res, 200, JSON.stringify(file, null, 2), { 'Content-Type': 'application/json', 'Content-Disposition': `attachment; filename="${slugify(data.title) || 'flow'}.openpilates.json"` });
  });
  route('POST', '/api/flows/import', async (req, res, { user }) => {
    const b = await readBody(req);
    if (b.openpilates !== 'flow' || !b.flow) return fail(res, 400, 'That isn\'t an OpenPilates flow file.');
    let added = 0;
    for (const m of Array.isArray(b.movements) ? b.movements.slice(0, 200) : []) {
      try {
        const mv = cleanMovement(m, { slug: slugify(m.slug || m.name) });
        if (!db.prepare('SELECT 1 FROM movements WHERE slug = ?').get(mv.slug)) {
          db.prepare("INSERT INTO movements (slug, apparatus, data, source, owner_id) VALUES (?, ?, ?, 'custom', ?)").run(mv.slug, mv.apparatus, JSON.stringify(mv), user.id);
          added++;
        }
      } catch { /* skip bad movement */ }
    }
    const f = cleanFlow({ ...b.flow, booked: [] });
    const id = newFlowId();
    db.prepare('INSERT INTO flows (id, owner_id, title, data) VALUES (?, ?, ?, ?)').run(id, user.id, f.title, JSON.stringify(f));
    send(res, 201, { ...flowOut(db.prepare('SELECT * FROM flows WHERE id = ?').get(id), user), movementsAdded: added });
  });

  // ---- clients (studio-wide; health notes never leave the server in exports)
  route('GET', '/api/clients', (req, res) => send(res, 200, db.prepare('SELECT * FROM clients ORDER BY archived, name').all().map(clientOut)));
  route('POST', '/api/clients', async (req, res) => {
    const c = cleanClient(await readBody(req));
    const info = db.prepare('INSERT INTO clients (name, notes, tags) VALUES (?, ?, ?)').run(c.name, c.notes, JSON.stringify(c.tags));
    send(res, 201, clientOut(db.prepare('SELECT * FROM clients WHERE id = ?').get(info.lastInsertRowid)));
  });
  route('PUT', '/api/clients/:id', async (req, res, { params }) => {
    const b = await readBody(req);
    const c = cleanClient(b);
    const r = db.prepare("UPDATE clients SET name = ?, notes = ?, tags = ?, archived = ?, updated_at = datetime('now') WHERE id = ?").run(c.name, c.notes, JSON.stringify(c.tags), b.archived ? 1 : 0, Number(params.id));
    if (!r.changes) return fail(res, 404, 'No such client.');
    send(res, 200, clientOut(db.prepare('SELECT * FROM clients WHERE id = ?').get(Number(params.id))));
  });
  route('DELETE', '/api/clients/:id', (req, res, { params }) => {
    db.prepare('DELETE FROM clients WHERE id = ?').run(Number(params.id));
    send(res, 200, { ok: true });
  }, { auth: 'admin' });

  // ---- backup (admin): everything except password hashes and sessions
  route('GET', '/api/backup', (req, res) => {
    const backup = {
      openpilates: 'backup', version: 1, appVersion: VERSION, exportedAt: new Date().toISOString(),
      studio: studio(),
      users: db.prepare('SELECT * FROM users').all().map(userOut),
      movements: db.prepare("SELECT * FROM movements WHERE source != 'library'").all().map((r) => ({ ...JSON.parse(r.data), source: r.source, ownerId: r.owner_id })),
      flows: db.prepare('SELECT * FROM flows').all().map((r) => ({ id: r.id, ownerId: r.owner_id, shared: !!r.shared, createdAt: r.created_at, updatedAt: r.updated_at, ...JSON.parse(r.data) })),
      clients: db.prepare('SELECT * FROM clients').all().map(clientOut),
      notes: db.prepare('SELECT * FROM movement_notes').all()
    };
    send(res, 200, JSON.stringify(backup, null, 2), { 'Content-Type': 'application/json', 'Content-Disposition': `attachment; filename="openpilates-backup-${new Date().toISOString().slice(0, 10)}.json"` });
  }, { auth: 'admin' });

  // ---------- static files
  const STATIC = { '/shared/': join(ROOT, 'shared'), '/': join(ROOT, 'public') };
  const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon', '.webmanifest': 'application/manifest+json', '.woff2': 'font/woff2' };
  const SECURITY = {
    'Content-Security-Policy': "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'; frame-ancestors 'self'; base-uri 'self'; form-action 'self'",
    'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'same-origin', 'X-Frame-Options': 'SAMEORIGIN', 'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
  };
  const serveStatic = (req, res, pathname) => {
    for (const [prefix, dir] of Object.entries(STATIC)) {
      if (!pathname.startsWith(prefix)) continue;
      const rel = normalize(decodeURIComponent(pathname.slice(prefix.length))).replace(/^(\.\.[/\\])+/, '');
      let file = join(dir, rel);
      if (!file.startsWith(dir)) return false;
      if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');
      if (!existsSync(file) || !statSync(file).isFile()) {
        if (prefix !== '/' || extname(pathname)) return false;
        file = join(dir, 'index.html'); // SPA fallback
      }
      res.writeHead(200, { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream', 'Cache-Control': extname(file) === '.html' ? 'no-cache' : 'public, max-age=300', ...SECURITY });
      createReadStream(file).pipe(res);
      return true;
    }
    return false;
  };

  const handler = async (req, res) => {
    const url = new URL(req.url, 'http://x');
    const pathname = url.pathname;
    try {
      if (pathname.startsWith('/api/')) {
        for (const r of routes) {
          if (r.method !== req.method) continue;
          const m = pathname.match(r.re);
          if (!m) continue;
          const params = Object.fromEntries(r.keys.map((k, i) => [k, decodeURIComponent(m[i + 1])]));
          // CSRF guard: state-changing API calls must come from our own scripts.
          if (req.method !== 'GET' && req.headers['x-openpilates'] !== '1') return fail(res, 403, 'Missing request header.');
          const token = parseCookies(req.headers.cookie).op_session;
          const user = userForToken(db, token);
          if (r.auth === 'user' && !user) return fail(res, 401, 'Please sign in.');
          if (r.auth === 'admin' && (!user || user.role !== 'admin')) return fail(res, user ? 403 : 401, user ? 'Admins only.' : 'Please sign in.');
          return await r.handler(req, res, { user, token, params, url });
        }
        return fail(res, 404, 'Not found.');
      }
      if ((req.method === 'GET' || req.method === 'HEAD') && serveStatic(req, res, pathname)) return;
      fail(res, 404, 'Not found.');
    } catch (e) {
      if (e instanceof Invalid) return fail(res, 400, e.message);
      console.error(e);
      if (!res.headersSent) fail(res, 500, 'Something went wrong on the server.');
    }
  };

  // Tidy expired sessions daily.
  const tidy = setInterval(() => db.prepare("DELETE FROM sessions WHERE expires_at < strftime('%Y-%m-%dT%H:%M:%fZ','now')").run(), 864e5);
  tidy.unref();

  return { handler, db, close: () => { clearInterval(tidy); db.close(); } };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const app = createApp();
  const server = createServer(app.handler);
  server.listen(config.port, config.host, () => console.log(`OpenPilates listening on http://${config.host}:${config.port}`));
  const stop = () => { server.close(); app.close(); process.exit(0); };
  process.on('SIGTERM', stop);
  process.on('SIGINT', stop);
}
