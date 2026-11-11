import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createApp } from '../server/index.js';

let server, base, app, dataDir;
const jar = {};

async function call(who, method, path, body) {
  const res = await fetch(base + '/api' + path, {
    method,
    headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(method !== 'GET' ? { 'X-OpenPilates': '1' } : {}), ...(jar[who] ? { Cookie: jar[who] } : {}) },
    body: body ? JSON.stringify(body) : undefined
  });
  const set = res.headers.get('set-cookie');
  if (set) jar[who] = set.split(';')[0];
  let data = null; try { data = await res.json(); } catch { /* not json */ }
  return { status: res.status, data };
}

before(async () => {
  dataDir = mkdtempSync(join(tmpdir(), 'op-test-'));
  app = createApp({ dataDir, quiet: true });
  server = createServer(app.handler);
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  base = `http://127.0.0.1:${server.address().port}`;
});
after(() => { server.close(); app.close(); rmSync(dataDir, { recursive: true, force: true }); });

test('first-run setup, then setup is locked', async () => {
  assert.equal((await call('admin', 'GET', '/state')).data.setupNeeded, true);
  assert.equal((await call('admin', 'POST', '/setup', { username: 'sarah', password: 'short' })).status, 400);
  assert.equal((await call('admin', 'POST', '/setup', { username: 'sarah', displayName: 'Sarah', password: 'spring carriage footbar', studioName: 'Test' })).status, 201);
  assert.equal((await call('x', 'POST', '/setup', { username: 'evil', password: 'spring carriage footbar' })).status, 409);
  assert.equal((await call('admin', 'GET', '/state')).data.user.role, 'admin');
});

test('state-changing calls need the header', async () => {
  const res = await fetch(base + '/api/flows', { method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: jar.admin }, body: '{}' });
  assert.equal(res.status, 403);
});

test('instructors: own flows, shared flows, no admin routes', async () => {
  assert.equal((await call('admin', 'POST', '/users', { username: 'alex', displayName: 'Alex', password: 'another long password' })).status, 201);
  assert.equal((await call('alex', 'POST', '/login', { username: 'alex', password: 'wrong password!!' })).status, 401);
  assert.equal((await call('alex', 'POST', '/login', { username: 'alex', password: 'another long password' })).status, 200);
  assert.equal((await call('alex', 'GET', '/users')).status, 403);
  assert.equal((await call('alex', 'PUT', '/studio', {})).status, 403);

  const f = (await call('admin', 'POST', '/flows', { title: 'Admin flow', segments: [{ name: 'W', role: 'warmup', items: [{ slug: 'footwork-series' }] }] })).data;
  assert.equal((await call('alex', 'GET', `/flows/${f.id}`)).status, 404);
  await call('admin', 'PUT', `/flows/${f.id}`, { ...f, shared: true });
  const seen = await call('alex', 'GET', `/flows/${f.id}`);
  assert.equal(seen.status, 200);
  assert.equal(seen.data.canEdit, false);
  assert.equal((await call('alex', 'PUT', `/flows/${f.id}`, { title: 'Hijack' })).status, 403);
  const copy = await call('alex', 'POST', `/flows/${f.id}/duplicate`);
  assert.equal(copy.status, 201);
  assert.equal(copy.data.canEdit, true);
});

test('exports never include clients', async () => {
  const c = (await call('admin', 'POST', '/clients', { name: 'Jo', tags: ['pregnancy', 'not-a-tag'], notes: 'private' })).data;
  assert.deepEqual(c.tags, ['pregnancy']);
  const f = (await call('admin', 'POST', '/flows', { title: 'With client', booked: [{ clientId: c.id, spot: 'R3' }], segments: [] })).data;
  assert.equal(f.booked.length, 1);
  const res = await fetch(`${base}/api/flows/${f.id}/export`, { headers: { Cookie: jar.admin } });
  const text = await res.text();
  assert.ok(!text.includes('booked') && !text.includes('Jo'));
  const imported = await call('alex', 'POST', '/flows/import', JSON.parse(text));
  assert.equal(imported.status, 201);
});

test('movements: custom create, library edit by admin only, reset', async () => {
  const mv = await call('alex', 'POST', '/movements', { name: 'Alex Lunge', apparatus: 'mat', position: 'standing', muscles: { primary: ['glutes'] } });
  assert.equal(mv.status, 201);
  assert.equal(mv.data.slug, 'alex-lunge');
  assert.equal((await call('alex', 'PUT', '/movements/swan-long-box', { name: 'X', position: 'prone', muscles: { primary: ['glutes'] } })).status, 403);
  const lib = (await call('admin', 'GET', '/movements/swan-long-box')).data;
  const edited = await call('admin', 'PUT', '/movements/swan-long-box', { ...lib, cues: 'Long neck.' });
  assert.equal(edited.data.source, 'studio');
  const reset = await call('admin', 'DELETE', '/movements/swan-long-box');
  assert.equal(reset.data.restored, true);
  assert.equal((await call('admin', 'GET', '/movements/swan-long-box')).data.source, 'library');
});

test('cannot remove the last admin', async () => {
  const users = (await call('admin', 'GET', '/users')).data;
  const me = users.find((u) => u.username === 'sarah');
  assert.equal((await call('admin', 'PUT', `/users/${me.id}`, { role: 'instructor' })).status, 400);
});

test('static files and path traversal', async () => {
  assert.equal((await fetch(base + '/')).status, 200);
  assert.equal((await fetch(base + '/shared/vocab.js')).status, 200);
  const bad = await fetch(base + '/shared/..%2f..%2fpackage.json');
  assert.notEqual(await bad.text().then((t) => t.includes('"name": "openpilates"')), true);
});
