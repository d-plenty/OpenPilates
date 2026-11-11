import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { analyze } from '../shared/analysis.js';
import { draftFlow } from '../shared/draft.js';
import { springFor, springLabel } from '../shared/vocab.js';

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
  assert.equal(a.springChanges, 2);
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
  for (const s of f.segments) for (const i of s.items) assert.ok(!(movements[i.slug].cautions || []).some((c) => c.tag === 'pregnancy'), i.slug);
});

test('spring colours per brand', () => {
  assert.equal(springFor('balanced_body', 'medium').name, 'Red');
  assert.equal(springFor('merrithew', 'medium').name, 'Blue');
  assert.equal(springFor('peak', 'medium').name, 'Yellow');
  assert.equal(springFor('merrithew', 'xlight').approx, true);
  assert.equal(springLabel('balanced_body', ['medium', 'medium', 'light']), '2R 1B');
});
