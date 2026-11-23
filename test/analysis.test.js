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
