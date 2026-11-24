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
  assert.deepEqual(item.options.map((o) => o.kind), ['progression', 'regression', 'progression']);
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

test('movements carry other names and variations; old "modifications" become regressions', async () => {
  const r = await call('admin', 'POST', '/movements', { name: 'Var Test', position: 'kneeling', muscles: { primary: ['deltoids'] }, aka: ['Other name', ''], modifications: ['Sit on the box'],
    variations: [{ name: 'Single arm', kind: 'variation', springs: ['xlight', 'nope'] }, { name: 'Kneel up', kind: 'harder' }, { name: 'single arm', kind: 'variation' }, { kind: 'variation' }] });
  assert.equal(r.status, 201);
  assert.deepEqual(r.data.aka, ['Other name']);
  assert.deepEqual(r.data.variations, [{ name: 'Single arm', kind: 'variation', springs: ['xlight'] }, { name: 'Kneel up', kind: 'progression' }, { name: 'Sit on the box', kind: 'regression' }]);
  assert.equal(r.data.modifications, undefined);
  const f = await call('admin', 'POST', '/flows', { title: 'V', segments: [{ name: 'A', bpm: 100, items: [{ slug: r.data.slug, variation: 'Single arm' }] }] });
  assert.equal(f.data.segments[0].items[0].variation, 'Single arm');
  await call('admin', 'DELETE', `/flows/${f.data.id}`);
  await call('admin', 'DELETE', `/movements/${r.data.slug}`);
});

test('retired movements still resolve; the library lists series', async () => {
  const all = (await call('admin', 'GET', '/movements')).data;
  const retired = all.filter((m) => m.retired);
  assert.ok(retired.length > 0 && retired.every((m) => m.slug && m.name));
  const series = (await call('admin', 'GET', '/series')).data;
  const footwork = series.find((s) => s.slug === 'footwork-series');
  assert.ok(footwork && footwork.source === 'library' && footwork.items.length >= 5);
  const bySlug = Object.fromEntries(all.map((m) => [m.slug, m]));
  for (const s of series) for (const i of s.items) {
    assert.ok(bySlug[i.slug] && !bySlug[i.slug].retired, `${s.slug}: ${i.slug}`);
    if (i.variation) assert.ok(bySlug[i.slug].variations.some((v) => v.name === i.variation), `${s.slug}: ${i.variation}`);
  }
});

test('a studio can save, list and delete its own series, but not library ones', async () => {
  assert.equal((await call('admin', 'POST', '/series', { name: 'Empty', items: [] })).status, 400);
  const made = await call('admin', 'POST', '/series', { name: 'My glute block', items: [{ slug: 'standing-lunge', variation: 'Curtsy lunge', duration: 90 }, { slug: 'Scooter' }, { slug: '' }] });
  assert.equal(made.status, 201);
  assert.equal(made.data.slug, 'my-glute-block');
  assert.equal(made.data.items.length, 2);
  assert.equal(made.data.source, 'custom');
  assert.ok((await call('admin', 'GET', '/series')).data.some((s) => s.slug === 'my-glute-block'));
  assert.equal((await call('admin', 'DELETE', '/series/footwork-series')).status, 400);
  assert.equal((await call('admin', 'DELETE', '/series/my-glute-block')).status, 200);
  assert.equal((await call('admin', 'DELETE', '/series/my-glute-block')).status, 404);
});

test('a teacher can mark a movement checked or flagged, and export the list', async () => {
  assert.equal((await call('admin', 'PUT', '/movements/nope/check', { status: 'ok' })).status, 404);
  const ok = await call('admin', 'PUT', '/movements/offering/check', { status: 'ok' });
  assert.equal(ok.data.status, 'ok');
  assert.equal(ok.data.by, 'Sarah');
  const fix = await call('admin', 'PUT', '/movements/elephant/check', { status: 'fix', note: 'Springs too light' });
  assert.equal(fix.data.status, 'fix');
  const all = (await call('admin', 'GET', '/movements')).data;
  assert.equal(all.find((m) => m.slug === 'offering').check.status, 'ok');
  assert.equal(all.find((m) => m.slug === 'elephant').check.note, 'Springs too light');
  const exp = (await call('admin', 'GET', '/reviews/export')).data;
  assert.equal(exp.openpilates, 'review');
  assert.ok(exp.reviews.some((r) => r.slug === 'elephant' && r.name === 'Elephant' && r.status === 'fix'));
  await call('admin', 'PUT', '/movements/offering/check', { status: '' });
  assert.equal((await call('admin', 'GET', '/movements')).data.find((m) => m.slug === 'offering').check, undefined);
});

test('a studio can add its own props and cautions, remove built-in ones, and use them', async () => {
  const st = (await call('admin', 'GET', '/studio')).data;
  const saved = await call('admin', 'PUT', '/studio', { ...st, customProps: [{ label: 'Pilates arc' }, { label: 'Pilates arc' }, { label: '' }], removedProps: ['foam_roller', 'not-a-prop'],
    customCautions: [{ label: 'Vertigo' }], removedCautions: ['balance'], props: { ...st.props, p_pilates_arc: 3 } });
  assert.equal(saved.status, 200);
  assert.deepEqual(saved.data.customProps.map((p) => p.id), ['p_pilates_arc', 'p_pilates_arc_2']);
  assert.deepEqual(saved.data.removedProps, ['foam_roller']);
  assert.equal(saved.data.props.p_pilates_arc, 3);
  assert.equal(saved.data.props.foam_roller, undefined);
  assert.deepEqual(saved.data.customCautions, [{ id: 'c_vertigo', label: 'Vertigo' }]);
  // a movement can need the new prop and carry the new caution; a client can be tagged with it
  const mv = await call('admin', 'POST', '/movements', { name: 'Arc Stretch', position: 'supine', apparatus: 'mat', muscles: { primary: ['abdominals'] }, equipment: ['p_pilates_arc', 'foam_roller', 'made_up'], cautions: [{ tag: 'c_vertigo', severity: 'avoid', note: 'Head below the hips' }, { tag: 'made_up' }] });
  assert.deepEqual(mv.data.equipment, ['p_pilates_arc', 'foam_roller']); // a removed built-in is still valid data
  assert.deepEqual(mv.data.cautions.map((c) => c.tag), ['c_vertigo']);
  const cl = await call('admin', 'POST', '/clients', { name: 'Dizzy D', tags: ['c_vertigo', 'nope'] });
  assert.deepEqual(cl.data.tags, ['c_vertigo']);
  await call('admin', 'DELETE', `/clients/${cl.data.id}`);
  await call('admin', 'DELETE', `/movements/${mv.data.slug}`);
  const back = await call('admin', 'PUT', '/studio', { ...saved.data, customProps: [], removedProps: [], customCautions: [], removedCautions: [] });
  assert.equal(back.data.props.foam_roller, 0);
  assert.equal((await call('admin', 'POST', '/clients', { name: 'X', tags: ['c_vertigo'] })).data.tags.length, 0);
});

test('a studio can take a movement or series out of its library and put it back; retired ones can be brought back', async () => {
  const get = async (slug) => (await call('admin', 'GET', '/movements')).data.find((m) => m.slug === slug);
  assert.equal((await get('elephant')).hidden, undefined);
  assert.equal((await call('admin', 'PUT', '/movements/elephant/library', { inLibrary: false })).data.hidden, true);
  assert.equal((await get('elephant')).hidden, true);
  await call('admin', 'PUT', '/movements/elephant/library', { inLibrary: true });
  assert.equal((await get('elephant')).hidden, undefined);
  const retired = (await call('admin', 'GET', '/movements')).data.find((m) => m.retired);
  assert.equal(retired.hidden, true);
  await call('admin', 'PUT', `/movements/${retired.slug}/library`, { inLibrary: true });
  const now = await get(retired.slug);
  assert.equal(now.hidden, undefined);
  assert.equal(now.retired, true);
  await call('admin', 'PUT', `/movements/${retired.slug}/library`, { inLibrary: false });
  assert.equal((await get(retired.slug)).hidden, true);
  await call('admin', 'PUT', '/series/footwork-series/library', { inLibrary: false });
  assert.equal((await call('admin', 'GET', '/series')).data.find((s) => s.slug === 'footwork-series').hidden, true);
  await call('admin', 'PUT', '/series/footwork-series/library', { inLibrary: true });
  assert.equal((await call('admin', 'GET', '/series')).data.find((s) => s.slug === 'footwork-series').hidden, undefined);
  assert.equal((await call('admin', 'PUT', '/movements/nope/library', { inLibrary: false })).status, 404);
});

// ---- 0.5: studio set-up, blocks, packs
test('studio settings: class levels, class types, lengths, timing, own muscles and names for the parts of a class', async () => {
  const s = (await call('admin', 'GET', '/studio')).data;
  assert.deepEqual(s.levels.map((l) => l.id), ['beginner', 'intermediate', 'advanced', 'beg_int', 'int_adv', 'open']);
  assert.ok(s.classTypes.length >= 4 && s.lengths.includes(50) && s.timing.perLayer > 0);
  const next = { ...s,
    levels: [{ label: 'Foundations', from: 1, to: 1 }, { label: 'Open', from: 1, to: 3 }, { label: '' }],
    lengths: [45, 60, 5, 'x', 60], defaultLength: 60,
    timingRows: s.timingRows.map((r) => (r.id === 'perLayer' ? { ...r, seconds: 30 } : r.id === 'springChange' ? { ...r, seconds: 9999 } : r)),
    customMuscles: [{ label: 'Pelvic floor' }], sectionLabels: { core: 'Abs', nope: 'x' },
    classTypes: [...s.classTypes, { name: 'Express', apparatus: 'reformer', lengthMin: 30, springBudget: 2, phases: [{ name: 'Go', role: 'nonsense', minutes: 30, sections: ['core', 'zzz'] }] }] };
  const out = (await call('admin', 'PUT', '/studio', next)).data;
  assert.deepEqual(out.levels.map((l) => l.label), ['Beginner', 'Intermediate', 'Advanced', 'Foundations', 'Open']);
  assert.ok(out.levels.every((l) => /^[a-z0-9_]+$/.test(l.id)));
  assert.deepEqual(out.lengths, [45, 60]);
  assert.equal(out.defaultLength, 60);
  assert.equal(out.timing.perLayer, 30);
  assert.equal(out.timing.springChange, 600);
  assert.equal(out.customMuscles[0].id, 'm_pelvic_floor');
  assert.deepEqual(out.sectionLabels, { core: 'Abs' });
  const express = out.classTypes.find((c) => c.name === 'Express');
  assert.equal(express.phases[0].role, 'build');
  assert.deepEqual(express.phases[0].sections, ['core']);
  // the studio's own muscle can now be ticked on a movement, and a flow can sit on the studio's own level
  const mv = (await call('admin', 'POST', '/movements', { name: 'Pelvic floor lifts', apparatus: 'mat', position: 'supine', muscles: { primary: ['m_pelvic_floor', 'made_up'] }, uses: ['warmup', 'nonsense'] })).data;
  assert.deepEqual(mv.muscles.primary, ['m_pelvic_floor']);
  assert.deepEqual(mv.uses, ['warmup']);
  const f = (await call('admin', 'POST', '/flows', { title: 'Levels', level: out.levels[3].id, classType: express.id, segments: [] })).data;
  assert.equal(f.level, out.levels[3].id);
  assert.equal(f.classType, express.id);
  await call('admin', 'PUT', '/studio', s);
});

test('0.6.3 studio settings: locked core levels, timing rows, parts of the class, focuses, what a class type sets for itself', async () => {
  const s = (await call('admin', 'GET', '/studio')).data;
  assert.equal(s.timingRows.length, 5);
  assert.ok(s.focuses.length >= 10 && s.focuses.some((f) => f.id === 'full_body'));
  const next = { ...s,
    // the core three cannot be deleted, only renamed; the examples can go
    levels: [{ id: 'intermediate', label: 'Middle', from: 1, to: 3 }, { id: 'open', label: 'Open level', from: 1, to: 3 }],
    // built-in rows can be renamed, noted and switched off but never lost; the studio's own rows are added
    timingRows: [{ id: 'finisher', label: 'Burner', note: 'Pulses at the end', seconds: 25 }, { id: 'boxChange', label: 'Box', seconds: 30, off: true },
      { label: 'Water break', note: 'Everyone off the carriage', seconds: 90 }, { label: '' }],
    customSections: [{ label: 'Power', group: 'lower' }, { label: 'Balance', group: 'zzz' }], removedSections: ['single_arm', 'nope'], sectionMap: { single_arm: 'chest_arms', gone: 'nowhere', core: 'single_arm' },
    focuses: [{ id: 'full_body', label: 'Whole body', muscles: [] }, { label: 'Runners', muscles: ['glutes', 'made_up', 'hamstrings'] }],
    classTypes: [{ ...s.classTypes[0], springBudget: '', timing: { perLayer: 20, springChange: '', nonsense: 5 }, target: 'prenatal', phases: [] },
      { ...s.classTypes[1], phases: [{ name: 'Arms', role: 'build', minutes: 10, sections: ['single_arm', 'lower', 'chest_arms'] }] }] };
  const out = (await call('admin', 'PUT', '/studio', next)).data;
  assert.deepEqual(out.levels.map((l) => [l.id, l.label, l.from, l.to]), [['beginner', 'Beginner', 1, 1], ['intermediate', 'Middle', 2, 2], ['advanced', 'Advanced', 3, 3], ['open', 'Open level', 1, 3]]);
  assert.deepEqual(out.timingRows.map((r) => r.id), ['perLayer', 'finisher', 'springChange', 'positionChange', 'boxChange', 't_water_break']);
  assert.equal(out.timingRows[1].label, 'Burner');
  assert.equal(out.timingRows[1].note, 'Pulses at the end');
  assert.equal(out.timing.finisher, 25);
  assert.equal(out.timing.boxChange, 0); // switched off counts for nothing
  assert.equal(out.timingRows[5].seconds, 90);
  assert.deepEqual(out.customSections, [{ id: 's_power', label: 'Power', group: 'lower' }, { id: 's_balance', label: 'Balance', group: 'core' }]);
  assert.deepEqual(out.removedSections, ['single_arm']);
  assert.deepEqual(out.sectionMap, { single_arm: 'chest_arms' });
  assert.deepEqual(out.focuses.map((f) => [f.id, f.label]), [['full_body', 'Whole body'], ['runners', 'Runners']]);
  assert.deepEqual(out.focuses[1].muscles, ['glutes', 'hamstrings']);
  assert.equal(out.classTypes[0].springBudget, 0); // blank means no limit
  assert.deepEqual(out.classTypes[0].timing, { perLayer: 20 });
  assert.equal(out.classTypes[0].target, 'prenatal');
  assert.deepEqual(out.classTypes[0].phases, []);
  assert.deepEqual(out.classTypes[1].phases[0].sections, ['chest_arms', 'lower']); // the deleted part's phases follow it to its new home
  // a movement can sit in the studio's own part; one filed under the deleted part shows under the part it moved to
  const mv = (await call('admin', 'POST', '/movements', { name: 'Power squats', apparatus: 'reformer', position: 'supine', section: 's_power', muscles: { primary: ['quadriceps'] } })).data;
  assert.equal(mv.section, 's_power');
  // a flow keeps a typed focus, the no-phases switch and timed lines; junk lines are dropped
  const f = (await call('admin', 'POST', '/flows', { title: 'Own focus', focusText: '  Runners\' hips ', noPhases: true, springBudget: 0, segments: [{ name: 'Class', items: [
    { slug: 'footwork-series' }, { pause: true, label: 'Water break', duration: 90, note: 'Towels' }, { pause: true }, { nothing: true }] }] })).data;
  assert.equal(f.focusText, 'Runners\' hips');
  assert.equal(f.noPhases, true);
  assert.equal(f.springBudget, 0);
  assert.deepEqual(f.segments[0].items.map((i) => (i.pause ? [i.label, i.duration, i.note] : i.slug)), ['footwork-series', ['Water break', 90, 'Towels'], ['Break', 60, undefined]]);
  // a flow with a timed line still exports, and comes back in with the line in place
  const ex = await fetch(base + `/api/flows/${f.id}/export`, { headers: { Cookie: jar.admin } });
  assert.equal(ex.status, 200);
  const file = await ex.json();
  const again = (await call('admin', 'POST', '/flows/import', file)).data;
  assert.equal(again.segments[0].items[1].label, 'Water break');
  assert.equal(again.noPhases, true);
  await call('admin', 'DELETE', '/movements/' + mv.slug);
  await call('admin', 'PUT', '/studio', s);
  assert.equal((await call('admin', 'GET', '/studio')).data.levels.length, 6);
});

test('blocks keep free-text layers, a finisher and the phase minutes', async () => {
  const f = (await call('admin', 'POST', '/flows', { title: 'Blocks', segments: [{ name: 'Legs', role: 'build', minutes: 7.4, items: [
    { slug: 'footwork-series', layers: ['L1', { text: '  Add a pulse  ' }, { text: '' }, { nope: 1 }, 'L1'], finisher: 'Hold for 10', duration: 240 }] }] })).data;
  const it = f.segments[0].items[0];
  assert.deepEqual(it.layers, ['L1', { text: 'Add a pulse' }]);
  assert.equal(it.finisher, 'Hold for 10');
  assert.equal(f.segments[0].minutes, 7);
});

test('a pack carries the studio\'s changes to another set-up, and never clients', async () => {
  await call('admin', 'POST', '/clients', { name: 'Private Person', notes: 'secret note', tags: ['knee'] });
  const c = (await call('admin', 'GET', '/clients')).data.find((x) => x.name === 'Private Person');
  await call('admin', 'POST', '/flows', { title: 'Pack flow', booked: [{ clientId: c.id, spot: '3' }], segments: [{ name: 'A', items: [{ slug: 'footwork-series' }] }] });
  await call('admin', 'PUT', '/movements/bridging-reformer', { ...(await call('admin', 'GET', '/movements/bridging-reformer')).data, name: 'Bridge (ours)' });
  await call('admin', 'PUT', '/movements/footwork-series/check', { status: 'ok', note: 'Sarah checked' });
  assert.equal((await call('alex', 'GET', '/pack')).status, 403);
  const res = await fetch(base + '/api/pack', { headers: { Cookie: jar.admin } });
  const text = await res.text();
  assert.ok(!text.includes('Private Person') && !text.includes('secret note') && !text.includes('"booked"'));
  const pack = JSON.parse(text);
  assert.equal(pack.openpilates, 'pack');
  assert.ok(pack.movements.some((m) => m.slug === 'bridging-reformer' && m.name === 'Bridge (ours)'));
  assert.ok(pack.reviews.some((r) => r.slug === 'footwork-series' && r.status === 'ok'));
  assert.ok(pack.flows.some((f) => f.title === 'Pack flow'));
  assert.ok(pack.studio.classTypes.length && pack.studio.levels.length);
  assert.ok(pack.studio.timingRows.length >= 5 && pack.studio.focuses.length && Array.isArray(pack.studio.customSections));
  const none = await (await fetch(base + '/api/pack?flows=0', { headers: { Cookie: jar.admin } })).json();
  assert.equal(none.flows, undefined);

  // undo the changes here, then bring the pack back in
  await call('admin', 'DELETE', '/movements/bridging-reformer');
  await call('admin', 'PUT', '/movements/footwork-series/check', { status: '', note: '' });
  assert.equal((await call('admin', 'GET', '/movements/bridging-reformer')).data.name, 'Bridging');
  assert.equal((await call('admin', 'POST', '/pack/import', { openpilates: 'flow' })).status, 400);
  pack.studio.levels = [{ id: 'all', label: 'Everyone', from: 1, to: 3 }];
  // an older pack has plain timing numbers and no timing list; a newer one brings its focuses
  delete pack.studio.timingRows; pack.studio.timing = { ...pack.studio.timing, perLayer: 33 };
  pack.studio.focuses = [{ label: 'Pack focus', muscles: ['glutes'] }];
  pack.movements.push({ name: 'Brand new from the pack', apparatus: 'mat', position: 'seated', muscles: { primary: ['abdominals'] } }, { nonsense: true });
  const done = (await call('admin', 'POST', '/pack/import', { ...pack, take: { flows: true } })).data;
  assert.ok(done.movements >= 2 && done.reviews >= 1 && done.flows >= 1 && done.settings === 1 && done.skipped >= 1, JSON.stringify(done));
  const back = (await call('admin', 'GET', '/movements/bridging-reformer')).data;
  assert.equal(back.name, 'Bridge (ours)');
  assert.equal(back.source, 'studio');
  assert.equal((await call('admin', 'GET', '/movements/brand-new-from-the-pack')).data.source, 'custom');
  assert.equal((await call('admin', 'GET', '/movements/footwork-series')).data.check.status, 'ok');
  assert.deepEqual((await call('admin', 'GET', '/studio')).data.levels.map((l) => l.label), ['Beginner', 'Intermediate', 'Advanced', 'Everyone']);
  const after = (await call('admin', 'GET', '/studio')).data;
  assert.equal(after.timing.perLayer, 33);
  assert.deepEqual(after.focuses.map((f) => f.label), ['Pack focus']);
  await call('admin', 'DELETE', '/movements/bridging-reformer');
  const st = (await call('admin', 'GET', '/studio')).data;
  await call('admin', 'PUT', '/studio', { ...st, levels: [], focuses: [], timingRows: [] });
});

test('a series can be edited; editing a library series makes it the studio\'s', async () => {
  const all = (await call('admin', 'GET', '/series')).data;
  const lib = all.find((s) => s.source === 'library');
  assert.equal((await call('alex', 'PUT', `/series/${lib.slug}`, { ...lib, name: 'Nope' })).status, 403);
  const out = (await call('admin', 'PUT', `/series/${lib.slug}`, { ...lib, name: `${lib.name} (ours)`, items: lib.items.slice(0, 2) })).data;
  assert.equal(out.source, 'studio');
  assert.equal(out.items.length, 2);
  assert.equal(out.slug, lib.slug);
  // deleting an edited library series puts the shipped one back
  assert.equal((await call('admin', 'DELETE', `/series/${lib.slug}`)).data.restored, true);
  const again = (await call('admin', 'GET', '/series')).data.find((s) => s.slug === lib.slug);
  assert.equal(again.source, 'library');
  assert.equal(again.name, lib.name);
  assert.equal(again.items.length, lib.items.length);
});

test('a signed-in user sets a new password without the old one; other devices are signed out', async () => {
  const second = await fetch(base + '/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-OpenPilates': '1' }, body: JSON.stringify({ username: 'alex', password: 'another long password' }) });
  const other = second.headers.get('set-cookie').split(';')[0];
  assert.equal((await fetch(base + '/api/flows', { headers: { Cookie: other } })).status, 200);
  assert.equal((await call('alex', 'PUT', '/me', { newPassword: 'short' })).status, 400);
  assert.equal((await call('alex', 'PUT', '/me', { newPassword: 'a brand new password' })).status, 200);
  assert.equal((await call('alex', 'GET', '/flows')).status, 200, 'the device that changed it stays signed in');
  assert.equal((await fetch(base + '/api/flows', { headers: { Cookie: other } })).status, 401, 'other devices are signed out');
  const again = await fetch(base + '/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-OpenPilates': '1' }, body: JSON.stringify({ username: 'alex', password: 'a brand new password' }) });
  assert.equal(again.status, 200);
});
