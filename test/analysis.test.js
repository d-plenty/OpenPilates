import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { analyze } from '../shared/analysis.js';
import { draftFlow } from '../shared/draft.js';
import { springFor, springLabel, sameSetting, sectionOf, categoriesOf, fitSprings, itemName, kindOf } from '../shared/vocab.js';

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
  assert.equal(a.springChanges, 2); // 3 red -> 2 red for the bridge -> 1 red for the swan
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
  // scooter (1 red, 1 blue to progress) after the lunge (1 blue): no change needed; footwork then needs one
  const a = analyze({ flow: flow([{ id: 's', role: 'build', items: [{ id: '1', slug: 'standing-lunge' }, { id: '2', slug: 'scooter' }, { id: '3', slug: 'footwork-series' }] }]), movements });
  assert.equal(a.springChanges, 1);
  assert.deepEqual(a.springPlan.map((p) => p.changed), [false, false, true]);
  assert.equal(a.springPlan[1].advanced, true);
  assert.equal(a.springStops[0].before, 'Footwork');
});

test('settings one extra-light spring apart count as the same', () => {
  assert.equal(sameSetting(['medium'], ['medium', 'xlight']), true);
  assert.equal(sameSetting(['medium'], ['light']), false);
  assert.equal(sameSetting(['medium', 'medium'], ['medium']), false);
});

test('spring budget check warns when the class changes springs too often', () => {
  const items = ['footwork-series', 'kneeling-chest-press', 'bridging-reformer', 'feet-in-straps', 'kneeling-row', 'external-rotation'].map((slug, i) => ({ id: String(i), slug }));
  const a = analyze({ flow: { ...flow([{ id: 's', role: 'build', items }]), springBudget: 3 }, movements });
  assert.equal(a.springChanges, 4); // feet in straps stays on the bridge's two reds
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
  for (const id of POSE_IDS) for (const frame of ['a', 'm', 'b']) {
    if (frame !== 'a' && !POSES[id][frame]) continue;
    const j = solve(POSES[id], frame);
    for (const pt of [j.hip, j.sh, j.head, j.mid, ...(j.leg ? [j.leg.knee, j.leg.foot] : []), ...(j.leg2 ? [j.leg2.knee, j.leg2.foot] : []), ...(j.arm ? [j.arm.elbow, j.arm.hand] : []), ...(j.arm2 ? [j.arm2.elbow, j.arm2.hand] : [])]) {
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

test('a picked variation names the item and brings its own springs', () => {
  const offering = movements.offering;
  const single = offering.variations.find((v) => v.name === 'Single arm');
  assert.ok(single && single.kind === 'variation' && single.springs.length);
  assert.equal(itemName(offering, { variation: 'Single arm' }), 'Offering · Single arm');
  assert.equal(itemName(offering, {}), 'Offering');
  const a = analyze({ flow: flow([{ id: 's', role: 'build', items: [{ id: '1', slug: 'offering' }, { id: '2', slug: 'offering', variation: 'Single arm' }] }]), movements });
  assert.deepEqual(a.springPlan[0].loads, ['light']);
  assert.deepEqual(a.springPlan[1].loads, single.springs);
  assert.equal(a.springPlan[1].name, 'Offering · Single arm');
  assert.equal(a.springChanges, 1);
});

test('old easier/harder options read as regression/progression', () => {
  assert.equal(kindOf('easier'), 'regression');
  assert.equal(kindOf('harder'), 'progression');
  assert.equal(kindOf('variation'), 'variation');
  const hard = { id: '1', slug: 'jackknife-reformer', options: [{ id: 'o', kind: 'easier', title: 'Overhead only' }] };
  const a = analyze({ flow: flow([{ id: 's', role: 'build', items: [{ id: 'a', slug: 'footwork-series' }, { id: 'b', slug: 'bridging-reformer' }, { id: 'c', slug: 'scooter' }, { id: 'd', slug: 'offering' }, { id: 'e', slug: 'pulling-straps' }, { id: 'f', slug: 'mermaid' }, hard, { id: '2', slug: 'snake' }, { id: '3', slug: 'star' }] }]), movements });
  const c = a.checks.find((x) => x.id === 'options');
  assert.ok(c && !c.body.includes('Jackknife') && c.title.includes('regression'));
});

test("springs are written in the springs the studio's reformers have", () => {
  const room = { brand: 'align', springs: { heavy: 1, medium: 2, light: 2 } }; // no extra-light spring, only two reds
  assert.deepEqual(fitSprings(['medium', 'xlight'], room), { loads: ['medium', 'light'], approx: true, short: false });
  assert.equal(fitSprings(['medium', 'medium', 'medium'], room).short, true);
  assert.deepEqual(fitSprings(['light'], room), { loads: ['light'], approx: false, short: false });
  assert.deepEqual(fitSprings(['medium'], {}).loads, ['medium']);
});

test('the library ships no unconfirmed or half-converted movements', () => {
  const live = Object.values(movements).filter((m) => !m.retired);
  assert.ok(live.length >= 160);
  for (const m of live) {
    assert.ok((m.sources || []).length >= 1, `${m.slug} has no source`);
    assert.equal(m.modifications, undefined, `${m.slug} still has modifications`);
    assert.ok(Array.isArray(m.aka) && Array.isArray(m.variations), m.slug);
    for (const v of m.variations) assert.ok(['regression', 'progression', 'variation'].includes(v.kind), `${m.slug}: ${v.name}`);
    for (const p of m.prep || []) assert.ok(!movements[p].retired, `${m.slug} leads in with a retired movement`);
  }
  assert.ok(movements['jackknife-reformer'] && movements['jackknife-mat']);
  assert.equal(movements['footwork-series'].name, 'Footwork');
  assert.ok(movements['footwork-series'].variations.some((v) => v.name === 'Pilates V'));
});

test('drafts never use retired movements and open footwork with Footwork', () => {
  for (const seed of [1, 2, 3, 4]) {
    const f = draftFlow({ movements, goal: 'full_body', apparatus: 'reformer', format: 'flow', lengthMin: 50, level: 'intermediate', props, seed });
    for (const s of f.segments) { assert.equal(s.bpm, undefined); for (const i of s.items) assert.ok(!movements[i.slug].retired, i.slug); }
    const warm = f.segments[0].items.map((i) => i.slug);
    if (warm.includes('footwork-series')) assert.equal(warm[0], 'footwork-series');
  }
});

// ---- 0.5: class levels, blocks and drafts built on class types
import { applyStudioLists, classLevel, LEVEL_PRESETS, usesOf, blockSeconds, layersOf, DEFAULT_CLASS_TYPES } from '../shared/vocab.js';
import { phasesFor, blankSegments } from '../shared/draft.js';

test('class levels follow the studio: names and what each level is offered', () => {
  const mv = { level: 'beginner', levelTo: 'intermediate' };
  applyStudioLists({ levels: LEVEL_PRESETS.two.levels });
  assert.equal(levelLabel(mv), 'Beginner/Intermediate');
  assert.deepEqual(levelsOf({ level: 'intermediate', levelTo: 'intermediate' }), ['beg_int', 'int_adv']);
  assert.equal(classLevel('int_adv').to, 3);
  // a flow saved under another scheme still resolves
  assert.equal(classLevel('advanced').label, 'Advanced');
  applyStudioLists({ levels: [{ id: 'l1', label: 'Foundations', from: 1, to: 1 }, { id: 'l2', label: 'Dynamic', from: 2, to: 3 }] });
  assert.equal(levelLabel(mv), 'All levels'); // offered to both of this studio's levels
  applyStudioLists({});
  assert.equal(levelLabel(mv), 'Beginner–Intermediate');
});

test('a block takes its own time, plus time for each layer and a finisher, unless a time is typed', () => {
  const mv = movements['bridging-reformer'];
  const timing = { perLayer: 45, finisher: 20 };
  assert.equal(blockSeconds({ slug: mv.slug }, mv, timing), mv.duration);
  assert.equal(blockSeconds({ slug: mv.slug, layers: [mv.layers[0].tag, { text: 'Single leg' }], finisher: 'Pulses × 10' }, mv, timing), mv.duration + 90 + 20);
  assert.equal(blockSeconds({ slug: mv.slug, duration: 300, layers: [{ text: 'x' }] }, mv, timing), 300);
  // layers: a library tag resolves to its title, the teacher's words stay as they are, junk is dropped
  assert.deepEqual(layersOf(mv, { layers: [mv.layers[0].tag, { text: ' Hold the top ' }, 'ZZ', { text: '' }] }).map((l) => l.title), [mv.layers[0].title, 'Hold the top']);
});

test('drafts follow the class type: right length, real warm-ups and cool-downs, time in each block', () => {
  for (const [classType, level, lengthMin] of [['reformer_flow', 'intermediate', 50], ['reformer_flow', 'beginner', 45], ['reformer_foundations', 'beginner', 45], ['reformer_flow', 'advanced', 60], ['mat_flow', 'intermediate', 45], ['mat_flow', 'beginner', 30]]) {
    for (const seed of [1, 2, 3, 4]) {
      const f = draftFlow({ movements, classType, level, lengthMin, props, seed });
      const a = analyze({ flow: f, movements, studio: { props } });
      const tag = `${classType} ${level} ${lengthMin} seed ${seed}`;
      assert.ok(Math.abs(a.totalSec / 60 - lengthMin) <= 1.5, `${tag}: runs ${(a.totalSec / 60).toFixed(1)} min`);
      assert.equal(f.classType, classType);
      const top = classLevel(level).to;
      for (const s of f.segments) {
        assert.ok(s.minutes >= 1, `${tag}: ${s.name} has minutes`);
        for (const i of s.items) {
          const mv = movements[i.slug];
          if (s.role === 'warmup') assert.ok(usesOf(mv).includes('warmup'), `${tag}: ${mv.name} is not a warm-up`);
          if (s.role === 'cooldown') assert.ok(usesOf(mv).includes('cooldown'), `${tag}: ${mv.name} is not a cool-down`);
          assert.ok(i.duration >= 60, `${tag}: ${mv.name} gets ${i.duration}s`);
          assert.ok({ beginner: 1, intermediate: 2, advanced: 3 }[mv.level] <= top, `${tag}: ${mv.name} is above the class level`);
          assert.ok(!mv.retired, `${tag}: ${mv.name} is retired`);
        }
      }
      // enough room to teach: no more than one block for every two and a half minutes
      assert.ok(a.count <= lengthMin / 2.5, `${tag}: ${a.count} blocks is too many`);
    }
  }
});

test('a class type gives empty phases with its minutes scaled to the class length', () => {
  const ct = DEFAULT_CLASS_TYPES.find((c) => c.id === 'reformer_fit');
  const withBoards = blankSegments(ct, 45, { props: { jump_board: 4 } });
  const without = blankSegments(ct, 45, { props: {} });
  assert.ok(withBoards.some((s) => s.name === 'Jump board'));
  assert.ok(!without.some((s) => s.name === 'Jump board'), 'no jump-board phase without boards');
  for (const segs of [withBoards, without]) assert.ok(Math.abs(segs.reduce((a, s) => a + s.minutes, 0) - 45) <= 3);
  assert.equal(Math.round(phasesFor(ct, 60, {}).reduce((a, p) => a + p.sec, 0)), 3600);
});

import { fillPhase } from '../shared/draft.js';
test('suggesting blocks for one phase follows the same rules and never repeats what the flow has', () => {
  const type = DEFAULT_CLASS_TYPES.find((c) => c.id === 'reformer_flow');
  const f = { title: 'T', apparatus: 'reformer', level: 'intermediate', lengthMin: 50, goal: 'full_body', classType: type.id, segments: blankSegments(type, 50, { props }) };
  f.segments[1].items.push({ id: 'a', slug: 'footwork-series' });
  for (const seg of f.segments) {
    const phase = type.phases.find((p) => p.name === seg.name);
    const items = fillPhase({ movements, flow: f, seg, phase, props, seed: 3 });
    assert.ok(items.length >= 1, `${seg.name}: nothing suggested`);
    for (const i of items) {
      const mv = movements[i.slug];
      assert.notEqual(i.slug, 'footwork-series');
      if (seg.role === 'warmup') assert.ok(usesOf(mv).includes('warmup'), `${mv.name} suggested as a warm-up`);
      if (seg.role === 'cooldown') assert.ok(usesOf(mv).includes('cooldown'), `${mv.name} suggested as a cool-down`);
      assert.ok(!phase.sections.length || phase.sections.includes(sectionOf(mv)), `${mv.name} is from the wrong part of the class for ${seg.name}`);
      assert.equal(mv.apparatus, 'reformer');
    }
    seg.items.push(...items);
  }
  const slugs = f.segments.flatMap((s) => s.items.map((i) => i.slug));
  assert.equal(new Set(slugs).size, slugs.length, 'a movement was suggested twice');
  assert.equal(fillPhase({ movements, flow: f, seg: f.segments[2], phase: type.phases[2], props, count: 1 }).length, 1);
});

// The image build cannot be run here, so this guards the mistake that is easy to make: copying
// something into the image that .dockerignore leaves out of the build, which stops the build.
test('everything the Dockerfile copies exists and is not left out by .dockerignore', () => {
  const root = join(dirname(fileURLToPath(import.meta.url)), '..');
  const ignored = readFileSync(join(root, '.dockerignore'), 'utf8').split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#') && !l.startsWith('!'));
  const sources = readFileSync(join(root, 'Dockerfile'), 'utf8').split('\n').filter((l) => /^COPY\s/.test(l) && !l.includes('--from=')).map((l) => l.trim().split(/\s+/).slice(1, -1)).flat();
  assert.ok(sources.length >= 6);
  for (const src of sources) {
    const top = src.replace(/^\.\//, '').split('/')[0];
    assert.ok(existsSync(join(root, src)), `Dockerfile copies ${src}, which does not exist`);
    assert.ok(!ignored.includes(top) && !ignored.includes(src), `Dockerfile copies ${src}, but .dockerignore leaves it out of the build`);
    if (/\.md$/.test(src)) assert.equal(src, 'README.md');
  }
});
