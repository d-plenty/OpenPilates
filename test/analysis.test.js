import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { analyze } from '../shared/analysis.js';
import { draftFlow } from '../shared/draft.js';
import { springFor, springLabel, sameSetting, sectionOf, categoriesOf } from '../shared/vocab.js';

const dir = fileURLToPath(new URL('../library/movements', import.meta.url));
const movements = {};
for (const a of readdirSync(dir)) for (const f of readdirSync(join(dir, a))) { const m = JSON.parse(readFileSync(join(dir, a, f), 'utf8')); movements[m.slug] = m; }
const props = { long_box: 4, short_box: 4, magic_circle: 6, loop_band: 10, hand_weights: 8 };

const flow = (segments) => ({ title: 'T', apparatus: 'reformer', level: 'intermediate', lengthMin: 50, target: 'general', segments });

test('empty flow gives a gentle prompt', () => {
  const a = analyze({ flow: flow([]), movements });
  assert.equal(a.count, 0);
  assert.equal(a.checks[0].id, 'empty');
});

test('counts spring and position changes', () => {
  const a = analyze({ flow: flow([{ id: 's', role: 'build', items: [
    { id: '1', slug: 'footwork-series' }, { id: '2', slug: 'bridging-reformer' }, { id: '3', slug: 'swan-long-box' }] }]), movements });
  assert.equal(a.count, 3);
  assert.equal(a.springChanges, 1); // footwork -> bridge is a change; the swan can stay (one yellow apart)
  assert.equal(a.positionChanges, 1); // supine -> prone
  assert.equal(a.boxChanges, 1); // long box goes on
  assert.ok(a.transitionSec > 0);
});

test('spine balance and missing directions', () => {
  const a = analyze({ flow: flow([{ id: 's', role: 'build', items: [{ id: '1', slug: 'hundred-reformer' }] }]), movements });
  assert.equal(a.spine.flexion, 100);
  assert.ok(a.checks.some((c) => c.id === 'spine-missing'));
  assert.ok(a.checks.some((c) => c.id === 'warmup'));
});

test('client cautions produce swaps', () => {
  const a = analyze({ flow: flow([{ id: 's', role: 'build', items: [{ id: 'x', slug: 'swan-long-box' }] }]), movements, clients: [{ id: 1, name: 'Jo', tags: ['pregnancy'] }] });
  assert.equal(a.clientChecks.length, 1);
  assert.equal(a.clientChecks[0].issues[0].swap.slug, 'chest-expansion');
});

test('missing equipment is flagged', () => {
  const a = analyze({ flow: flow([{ id: 's', role: 'build', items: [{ id: 'x', slug: 'jumping' }] }]), movements, studio: { props: {} } });
  assert.ok(a.checks.some((c) => c.id === 'equipment'));
});

test('drafts fill the class and cover all spine directions', () => {
  for (const goal of ['full_body', 'posterior_chain', 'core']) {
    const f = draftFlow({ movements, goal, apparatus: 'reformer', lengthMin: 50, level: 'intermediate', props, seed: 7 });
    const a = analyze({ flow: f, movements, studio: { props } });
    assert.ok(a.totalSec / 60 > 40 && a.totalSec / 60 < 62, `${goal} length ${a.totalSec / 60}`);
    for (const d of ['flexion', 'extension', 'rotation', 'side-bend']) assert.ok(a.spine[d] > 0, `${goal} missing ${d}`);
    assert.ok(f.segments.some((s) => s.role === 'warmup') && f.segments.some((s) => s.role === 'cooldown'));
  }
});

test('prenatal drafts leave out pregnancy-flagged movements', () => {
  const f = draftFlow({ movements, goal: 'prenatal', apparatus: 'reformer', lengthMin: 45, props, seed: 3 });
  for (const s of f.segments) for (const i of s.items) assert.ok(!(movements[i.slug].cautions || []).some((c) => c.tag === 'pregnancy' && c.severity !== 'modify'), i.slug);
});

test('spring colours per brand', () => {
  assert.equal(springFor('balanced_body', 'medium').name, 'Red');
  assert.equal(springFor('merrithew', 'medium').name, 'Blue');
  assert.equal(springFor('peak', 'medium').name, 'Yellow');
  assert.equal(springFor('merrithew', 'xlight').approx, true);
  assert.equal(springLabel('balanced_body', ['medium', 'medium', 'light']), '2R 1B');
});

test('a movement stays on the current springs when its "to advance" setting matches', () => {
  // lunge (R, RY to advance) after bridge (RY): no change needed
  const a = analyze({ flow: flow([{ id: 's', role: 'build', items: [{ id: '1', slug: 'bridging-reformer' }, { id: '2', slug: 'standing-lunge' }, { id: '3', slug: 'kneeling-chest-press' }] }]), movements });
  assert.equal(a.springChanges, 1);
  assert.deepEqual(a.springPlan.map((p) => p.changed), [false, false, true]);
  assert.equal(a.springStops[0].before, 'Kneeling Chest Press');
});

test('settings one extra-light spring apart count as the same', () => {
  assert.equal(sameSetting(['medium'], ['medium', 'xlight']), true);
  assert.equal(sameSetting(['medium'], ['light']), false);
  assert.equal(sameSetting(['medium', 'medium'], ['medium']), false);
});

test('spring budget check warns when the class changes springs too often', () => {
  const items = ['footwork-series', 'kneeling-chest-press', 'bridging-reformer', 'kneeling-row', 'feet-in-straps', 'external-rotation'].map((slug, i) => ({ id: String(i), slug }));
  const a = analyze({ flow: { ...flow([{ id: 's', role: 'build', items }]), springBudget: 3 }, movements });
  assert.equal(a.springChanges, 4); // the row can stay on the bridge springs
  assert.ok(a.checks.some((c) => c.id === 'springs' && c.level === 'warn'));
});

test('repeating a block on the other side doubles its time, not its movement count', () => {
  const seg = { id: 's', role: 'build', items: [{ id: '1', slug: 'standing-lunge' }, { id: '2', slug: 'scooter' }] };
  const once = analyze({ flow: flow([seg]), movements });
  const twice = analyze({ flow: flow([{ ...seg, bothSides: true }]), movements });
  assert.equal(twice.count, once.count);
  assert.ok(twice.movingSec === once.movingSec * 2);
});

test('"modify" cautions are listed without a swap; "avoid" cautions get one', () => {
  const a = analyze({ flow: flow([{ id: 's', role: 'build', items: [{ id: '1', slug: 'footwork-series' }, { id: '2', slug: 'ab-curl-in-straps' }] }]), movements, clients: [{ id: 1, name: 'Jo', tags: ['pregnancy'] }] });
  const issues = a.clientChecks[0].issues;
  assert.equal(issues[0].severity, 'avoid');
  assert.equal(issues[0].slug, 'ab-curl-in-straps');
  assert.ok(issues[0].swap);
  assert.equal(issues[1].severity, 'modify');
  assert.equal(issues[1].swap, null);
});

test('first-trimester clients are only flagged on movements ruled out for the whole pregnancy', () => {
  const items = [{ id: '1', slug: 'bridging-reformer' }, { id: '2', slug: 'ab-curl-in-straps' }];
  const a = analyze({ flow: flow([{ id: 's', role: 'build', items }]), movements, clients: [{ id: 1, name: 'Jo', tags: ['pregnancy_early'] }] });
  assert.deepEqual(a.clientChecks[0].issues.map((i) => i.slug), ['ab-curl-in-straps']);
});

test('class balance: sections, categories, hard start and missing lead-in', () => {
  const items = ['snake', 'footwork-series', 'feet-in-straps', 'kneeling-row', 'kneeling-chest-press', 'scooter'].map((slug, i) => ({ id: String(i), slug }));
  const a = analyze({ flow: flow([{ id: 's', role: 'build', items }]), movements });
  assert.ok(a.checks.some((c) => c.id === 'starts-hard'));
  assert.ok(a.checks.some((c) => c.id === 'lead-in'));
  assert.ok(a.sections.find((s) => s.id === 'lower').pct > 0);
  assert.ok(a.sections.find((s) => s.id === 'upper').pct > 0);
  assert.equal(a.roles.stability + a.roles.mobility, 100);
  assert.ok(a.categories.find((c) => c.id === 'upper_body').count >= 2);
});

test('older movements without the new fields still get a section and categories', () => {
  const old = { position: 'prone', spine: ['extension'], patterns: [], muscles: { primary: ['spinal_extensors', 'upper_back'], secondary: [] }, purpose: { strength: 2 }, equipment: [] };
  assert.equal(sectionOf(old), 'back_shoulders');
  assert.ok(categoriesOf(old).includes('trunk_extension'));
});

test('reformer flow drafts stay close to the spring budget and work the whole body', () => {
  for (const seed of [1, 2, 3, 4, 5, 6]) {
    const f = draftFlow({ movements, goal: 'full_body', apparatus: 'reformer', format: 'flow', lengthMin: 50, level: 'intermediate', props, seed });
    const a = analyze({ flow: f, movements, studio: { props } });
    assert.ok(a.springChanges <= f.springBudget + 1, `seed ${seed}: ${a.springChanges} changes`);
    for (const g of ['lower', 'upper', 'core', 'stretch']) assert.ok(a.sections.find((s) => s.id === g).sec > 0, `seed ${seed}: no ${g}`);
    assert.ok(!a.checks.some((c) => c.id === 'starts-hard'), `seed ${seed} starts hard`);
  }
});

test('every library movement names real lead-ins and swaps', () => {
  for (const mv of Object.values(movements)) {
    for (const p of mv.prep || []) assert.ok(movements[p], `${mv.slug} prep ${p}`);
    for (const c of mv.cautions || []) if (c.swap) assert.ok(movements[c.swap], `${mv.slug} swap ${c.swap}`);
    assert.ok(mv.section && mv.role && mv.pregnancy, mv.slug);
  }
});

import { levelLabel, levelsOf } from '../shared/vocab.js';
import { tidySprings } from '../shared/draft.js';
import { POSES, POSE_IDS, solve, poseOf } from '../shared/poses.js';

test('level ranges read naturally', () => {
  assert.equal(levelLabel({ level: 'beginner' }), 'Beginner');
  assert.equal(levelLabel({ level: 'beginner', levelTo: 'intermediate' }), 'Beginner–Intermediate');
  assert.equal(levelLabel({ level: 'beginner', levelTo: 'advanced' }), 'All levels');
  assert.equal(levelLabel({ level: 'advanced', levelTo: 'beginner' }), 'Advanced');
  assert.deepEqual(levelsOf({ level: 'intermediate', levelTo: 'advanced' }), ['intermediate', 'advanced']);
  assert.equal(levelLabel(movements['kneeling-arm-circles-front']), 'Beginner–Intermediate');
});

test('tidy springs never adds changes and keeps every movement in its segment', () => {
  for (const seed of [1, 2, 3, 4, 5]) {
    const f = draftFlow({ movements, goal: 'full_body', apparatus: 'reformer', lengthMin: 50, level: 'intermediate', props, seed });
    // shuffle each build block so there is something to tidy
    for (const s of f.segments) if (s.role === 'build' || s.role === 'peak') s.items.reverse();
    const before = analyze({ flow: f, movements }).springChanges;
    const tidy = { ...f, segments: tidySprings(f, movements) };
    const after = analyze({ flow: tidy, movements }).springChanges;
    assert.ok(after <= before, `seed ${seed}: ${before} -> ${after}`);
    f.segments.forEach((s, i) => assert.deepEqual(tidy.segments[i].items.map((x) => x.slug).sort(), s.items.map((x) => x.slug).sort()));
  }
});

test('an add-on movement inside an option counts towards muscles, categories and kit', () => {
  const item = { id: '1', slug: 'standing-lunge' };
  const plain = analyze({ flow: flow([{ id: 's', role: 'build', items: [item] }]), movements, studio: { props: {} } });
  const withAdd = analyze({ flow: flow([{ id: 's', role: 'build', items: [{ ...item, options: [{ id: 'o', kind: 'harder', slug: 'salute' }] }] }]), movements, studio: { props: {} } });
  assert.ok(!plain.muscles.some((m) => m.id === 'triceps'));
  assert.ok(withAdd.muscles.some((m) => m.id === 'triceps'));
  assert.equal(withAdd.categories.find((c) => c.id === 'upper_body').count, 1);
  assert.ok(withAdd.setOut.equipment.some((e) => e.id === 'long_box'));
  assert.equal(withAdd.springChanges, plain.springChanges); // options never count as a class spring change
  assert.equal(withAdd.withOptions, 1);
});

test('hard movements with no easier option are pointed out when someone is booked', () => {
  const items = [{ id: '1', slug: 'footwork-series' }, { id: '2', slug: 'elephant' }, { id: '3', slug: 'long-stretch' }, { id: '4', slug: 'snake' }, { id: '5', slug: 'mermaid' }, { id: '6', slug: 'kneeling-row' }];
  const a = analyze({ flow: flow([{ id: 's', role: 'build', items }]), movements, clients: [{ id: 1, name: 'Jo', tags: [] }] });
  const mentions = (r) => { const c = r.checks.find((x) => x.id === 'options'); return c ? c.title + ' ' + c.body : ''; };
  assert.ok(mentions(a).includes('Snake'));
  items[3].options = [{ id: 'o', kind: 'easier', title: 'Plank and pike only' }];
  const b = analyze({ flow: flow([{ id: 's', role: 'build', items }]), movements, clients: [{ id: 1, name: 'Jo', tags: [] }] });
  assert.ok(!mentions(b).includes('Snake'));
});

test('every pose draws, and every library movement names a real pose for its apparatus', () => {
  for (const id of POSE_IDS) for (const frame of ['a', 'b']) {
    const j = solve(POSES[id], frame);
    for (const pt of [j.hip, j.sh, j.head, j.mid, ...(j.leg ? [j.leg.knee, j.leg.foot] : []), ...(j.arm ? [j.arm.elbow, j.arm.hand] : [])]) {
      assert.ok(Number.isFinite(pt[0]) && Number.isFinite(pt[1]), `${id} ${frame}`);
      assert.ok(pt[0] > 0 && pt[0] < 240 && pt[1] > -34 && pt[1] < 126, `${id} ${frame} off the canvas: ${pt}`);
    }
  }
  for (const mv of Object.values(movements)) {
    assert.ok(POSES[mv.pose], `${mv.slug} has no pose`);
    assert.equal(POSES[mv.pose].ctx, mv.apparatus === 'mat' ? 'mat' : 'reformer', `${mv.slug} uses a ${POSES[mv.pose].ctx} picture`);
    assert.ok(mv.levelTo, `${mv.slug} has no level range`);
  }
  assert.ok(POSES[poseOf({ apparatus: 'reformer', position: 'kneeling', setup: { straps: 'short' } })]);
  assert.ok(POSES[poseOf({ apparatus: 'mat', position: 'prone' })]);
});
