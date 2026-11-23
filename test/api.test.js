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

test('movement photos: admin can add and remove, instructors cannot, files need a login', async () => {
  // a 1x1 JPEG
  const jpeg = '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAAMCAgICAgMCAgIDAwMDBAYEBAQEBAgGBgUGCQgKCgkICQkKDA8MCgsOCwkJDRENDg8QEBEQCgwSExIQEw8QEBD/yQALCAABAAEBAREA/8wABgAQEAX/2gAIAQEAAD8A0s8g/9k=';
  const dataUrl = `data:image/jpeg;base64,${jpeg}`;
  assert.equal((await call('admin', 'PUT', '/movements/scooter/photo', { dataUrl: 'data:text/html;base64,PGI+' })).status, 400);
  assert.equal((await call('admin', 'PUT', '/movements/scooter/photo', { dataUrl: `data:image/png;base64,${jpeg}` })).status, 400); // says PNG, isn't
  const up = await call('admin', 'PUT', '/movements/scooter/photo', { dataUrl, credit: 'Sarah' });
  assert.equal(up.status, 200);
  assert.match(up.data.photo, /^\/api\/media\/scooter-[0-9a-f]+\.jpg$/);
  const mv = (await call('admin', 'GET', '/movements/scooter')).data;
  assert.equal(mv.photo, up.data.photo);
  assert.equal(mv.photoCredit, 'Sarah');
  assert.ok((await call('admin', 'GET', '/movements')).data.find((m) => m.slug === 'scooter').photo);
  const file = await fetch(base + up.data.photo, { headers: { Cookie: jar.admin } });
  assert.equal(file.status, 200);
  assert.equal(file.headers.get('content-type'), 'image/jpeg');
  assert.equal((await fetch(base + up.data.photo)).status, 401); // no cookie
  assert.equal((await fetch(base + '/api/media/..%2Fopenpilates.db', { headers: { Cookie: jar.admin } })).status, 404);
  // saving the movement must not wipe the photo, and the photo isn't stored inside the movement data
  const saved = await call('admin', 'PUT', '/movements/scooter', { ...mv, summary: 'Edited.' });
  assert.equal(saved.status, 200);
  assert.equal((await call('admin', 'GET', '/movements/scooter')).data.photo, up.data.photo);
  assert.equal((await call('admin', 'DELETE', '/movements/scooter/photo')).status, 200);
  assert.equal((await call('admin', 'GET', '/movements/scooter')).data.photo, undefined);
  assert.equal((await fetch(base + up.data.photo, { headers: { Cookie: jar.admin } })).status, 404);
  await call('admin', 'DELETE', '/movements/scooter'); // back to the library version
});

test('flows keep layers and options, and drop junk', async () => {
  const made = await call('admin', 'POST', '/flows', { title: 'Options', segments: [{ name: 'A', items: [
    { slug: 'standing-lunge', layer: 'L2', layers: ['L1', 'L1'], options: [
      { kind: 'harder', springs: ['medium', 'bogus', 'light'] },
      { kind: 'easier', title: 'Hands on the bar', note: 'x'.repeat(500) },
      { kind: 'sideways', slug: 'Kneeling Biceps Curl' },
      {}
    ] }] }] });
  assert.equal(made.status, 201);
  const item = made.data.segments[0].items[0];
  assert.deepEqual(item.layers, ['L1', 'L2']);
  assert.equal(item.layer, undefined);
  assert.equal(item.options.length, 3);
  assert.deepEqual(item.options[0].springs, ['medium', 'light']);
  assert.equal(item.options[1].note.length, 300);
  assert.equal(item.options[2].kind, 'harder');
  assert.equal(item.options[2].slug, 'kneeling-biceps-curl');
  await call('admin', 'DELETE', `/flows/${made.data.id}`);
});

test('movements keep a level range and a picture, and fix an upside-down range', async () => {
  const base0 = { name: 'Range Test', position: 'supine', muscles: { primary: ['glutes'] } };
  const a = await call('admin', 'POST', '/movements', { ...base0, level: 'beginner', levelTo: 'intermediate', pose: 'supine-bridge' });
  assert.equal(a.data.levelTo, 'intermediate');
  assert.equal(a.data.pose, 'supine-bridge');
  const b = await call('admin', 'PUT', `/movements/${a.data.slug}`, { ...a.data, level: 'advanced', levelTo: 'beginner', pose: 'not-a-pose' });
  assert.equal(b.data.levelTo, 'advanced');
  assert.equal(b.data.pose, undefined);
  await call('admin', 'DELETE', `/movements/${a.data.slug}`);
});
