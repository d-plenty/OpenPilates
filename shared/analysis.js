// OpenPilates flow analysis. Pure functions, no DOM — runs in the browser and in Node tests.
// Measures follow Kaleen Canevari's class-design metrics: spine movement against a target,
// body-position changes, time moving vs setting up, and muscle balance.
import { MUSCLES, SPINE_DIRECTIONS, DEFAULT_TARGETS, PURPOSES, LEVELS, CAUTIONS, labelOf, byId } from './vocab.js';

const MUSCLE = byId(MUSCLES);
const LEVEL_RANK = Object.fromEntries(LEVELS.map((l) => [l.id, l.rank]));

// Seconds lost to each kind of change between movements (rough studio averages).
export const TRANSITION_COST = { spring: 15, position: 20, box: 45, apparatus: 60 };

const BOXES = ['long_box', 'short_box', 'jump_board', 'platform_extender'];

export function itemDuration(item, mv) {
  const d = Number(item && item.duration);
  if (d > 0) return d;
  return (mv && mv.duration) || 120;
}

function loadKey(item, mv) {
  if (!mv || mv.apparatus !== 'reformer') return null;
  const loads = (item.load && item.load.springs) || (mv.load && mv.load.springs) || [];
  return [...loads].sort().join('+');
}

function boxKey(mv) {
  if (!mv) return '';
  return (mv.equipment || []).filter((e) => BOXES.includes(e)).sort().join('+');
}

export function flatten(flow) {
  const out = [];
  for (const seg of flow.segments || []) {
    for (const item of seg.items || []) out.push({ seg, item });
  }
  return out;
}

export function analyze({ flow, movements, studio = {}, clients = [] }) {
  const mvOf = (slug) => movements[slug] || null;
  const targetKey = flow.target || 'general';
  const targets = { ...DEFAULT_TARGETS, ...(studio.targets || {}) };
  const target = targets[targetKey] || targets.general || DEFAULT_TARGETS.general;
  const owned = studio.props || {};
  const flowLevel = LEVEL_RANK[flow.level] || 3;

  const rows = flatten(flow);
  let t = 0;
  let movingSec = 0;
  let springChanges = 0;
  let boxChanges = 0;
  let positionChanges = 0;
  let apparatusChanges = 0;
  const timeline = [];
  const intensity = [];
  const spineSec = Object.fromEntries(SPINE_DIRECTIONS.map((d) => [d, 0]));
  const muscleCount = {};
  const muscleScore = {};
  const purposeSum = Object.fromEntries(PURPOSES.map((p) => [p.id, 0]));
  let multi = 0;
  let isolated = 0;
  const missingEquip = new Map();
  const aboveLevel = [];
  const unknown = [];
  const segInfo = [];
  let prev = null;

  for (const seg of flow.segments || []) {
    const segStart = t;
    for (const item of seg.items || []) {
      const mv = mvOf(item.slug);
      if (!mv) { unknown.push(item.slug); continue; }
      const dur = itemDuration(item, mv);

      // transitions from the previous movement
      if (prev) {
        let cost = 0;
        if (prev.mv.position !== mv.position) { positionChanges++; cost += TRANSITION_COST.position; }
        if (prev.mv.apparatus !== mv.apparatus) { apparatusChanges++; cost += TRANSITION_COST.apparatus; }
        else if (mv.apparatus === 'reformer' && loadKey(prev.item, prev.mv) !== loadKey(item, mv)) { springChanges++; cost += TRANSITION_COST.spring; }
        if (boxKey(prev.mv) !== boxKey(mv)) { boxChanges++; cost += TRANSITION_COST.box; }
        t += cost;
      }

      const last = timeline[timeline.length - 1];
      if (last && last.position === mv.position) last.sec += dur;
      else timeline.push({ position: mv.position, sec: dur });

      intensity.push({ at: t, end: t + dur, value: mv.intensity || 3, slug: mv.slug, name: mv.name, segId: seg.id });
      t += dur;
      movingSec += dur;

      // spine: split the movement's time across the directions it uses
      const dirs = (mv.spine || []).flatMap((s) => (s === 'articulation' ? ['flexion'] : SPINE_DIRECTIONS.includes(s) ? [s] : []));
      const uniq = [...new Set(dirs)];
      for (const d of uniq) spineSec[d] += dur / uniq.length;

      for (const m of mv.muscles.primary || []) { muscleCount[m] = (muscleCount[m] || 0) + 1; muscleScore[m] = (muscleScore[m] || 0) + dur; }
      for (const m of mv.muscles.secondary || []) { muscleCount[m] = (muscleCount[m] || 0) + 1; muscleScore[m] = (muscleScore[m] || 0) + dur * 0.4; }

      const ptotal = PURPOSES.reduce((a, p) => a + (mv.purpose?.[p.id] || 0), 0) || 1;
      for (const p of PURPOSES) purposeSum[p.id] += ((mv.purpose?.[p.id] || 0) / ptotal) * dur;

      if (mv.multiJoint === false) isolated++; else multi++;

      for (const e of mv.equipment || []) {
        if (!(Number(owned[e]) > 0)) {
          if (!missingEquip.has(e)) missingEquip.set(e, []);
          missingEquip.get(e).push(mv.name);
        }
      }
      if ((LEVEL_RANK[mv.level] || 1) > flowLevel) aboveLevel.push(mv.name);

      prev = { mv, item };
    }
    segInfo.push({ id: seg.id, name: seg.name, role: seg.role, start: segStart, sec: t - segStart });
  }

  const totalSec = t;
  const transitionSec = totalSec - movingSec;
  const count = rows.length - unknown.length;

  const spineTotal = SPINE_DIRECTIONS.reduce((a, d) => a + spineSec[d], 0);
  const spine = Object.fromEntries(SPINE_DIRECTIONS.map((d) => [d, spineTotal ? Math.round((spineSec[d] / spineTotal) * 100) : 0]));

  const muscles = Object.keys(muscleScore)
    .map((id) => ({ id, label: MUSCLE[id]?.label || id, side: MUSCLE[id]?.side || 'F', count: muscleCount[id], score: muscleScore[id] }))
    .sort((a, b) => b.score - a.score);
  const maxScore = muscles[0]?.score || 1;
  for (const m of muscles) m.level = m.score / maxScore;
  const fSum = muscles.filter((m) => m.side === 'F').reduce((a, m) => a + m.score, 0);
  const bSum = muscles.filter((m) => m.side === 'B').reduce((a, m) => a + m.score, 0);
  const frontBack = fSum + bSum ? { F: Math.round((fSum / (fSum + bSum)) * 100), B: Math.round((bSum / (fSum + bSum)) * 100) } : { F: 0, B: 0 };

  const purposeTotal = Object.values(purposeSum).reduce((a, b) => a + b, 0) || 1;
  const purpose = Object.fromEntries(PURPOSES.map((p) => [p.id, Math.round((purposeSum[p.id] / purposeTotal) * 100)]));

  const positionMinutes = {};
  for (const p of timeline) positionMinutes[p.position] = (positionMinutes[p.position] || 0) + p.sec;

  let peak = null;
  for (const i of intensity) if (!peak || i.value > peak.value) peak = i;
  if (peak) peak = { ...peak, pct: totalSec ? Math.round(((peak.at + (peak.end - peak.at) / 2) / totalSec) * 100) : 0 };

  // ---- checks
  const checks = [];
  const add = (level, id, title, body) => checks.push({ level, id, title, body });
  const roles = new Set((flow.segments || []).filter((s) => (s.items || []).length).map((s) => s.role));
  if (count === 0) {
    add('info', 'empty', 'Add some movements', 'Drag movements into a segment to see the analysis.');
  } else {
    if (!roles.has('warmup')) add('warn', 'warmup', 'No warm-up', 'Mark a segment as Warm-up and start with lower-effort movements.');
    else add('ok', 'warmup', 'Warm-up in place', `${fmtMin(segSec(segInfo, 'warmup'))} to start.`);
    if (!roles.has('cooldown')) add('warn', 'cooldown', 'No cool-down', 'Finish with a stretch segment marked Cool-down.');
    else add('ok', 'cooldown', 'Cool-down in place', `${fmtMin(segSec(segInfo, 'cooldown'))} to finish.`);

    const missingDirs = SPINE_DIRECTIONS.filter((d) => spine[d] === 0);
    if (missingDirs.length) add('warn', 'spine-missing', `No ${missingDirs.map(dirLabel).join(' or ')}`, 'A balanced class moves the spine in all four directions.');
    else add('ok', 'spine-all', 'All four spine movements', 'Flexion, extension, rotation and side bend are all here.');

    for (const d of SPINE_DIRECTIONS) {
      const diff = spine[d] - (target[d] || 0);
      if (spine[d] > 0 && diff <= -8) add('warn', 'spine-low-' + d, `${cap(dirLabel(d))} below target`, `${spine[d]}% vs ${target[d]}% for "${target.label || targetKey}".`);
      if (diff >= 12) add('info', 'spine-high-' + d, `${cap(dirLabel(d))} above target`, `${spine[d]}% vs ${target[d]}%.`);
    }

    if (frontBack.B < 35) add('warn', 'back-body', 'Light on the back body', `Back of the body gets ${frontBack.B}% of the work. Add prone or posterior-chain work.`);

    const transPct = totalSec ? Math.round((transitionSec / totalSec) * 100) : 0;
    if (transPct > 15) add('warn', 'transitions', `Setting up takes ${fmtMin(transitionSec)}`, `${transPct}% of the class is spring, box or position changes. Group movements that share a set-up.`);

    if (peak && count >= 5) {
      if (peak.pct < 30) add('info', 'peak-early', 'Peak comes early', `Hardest move (${peak.name}) is at ${peak.pct}% of the class.`);
      else if (peak.pct > 85) add('info', 'peak-late', 'Peak comes late', `Hardest move (${peak.name}) is at ${peak.pct}% — leave time to wind down.`);
      else add('ok', 'peak', 'Builds to a peak', `${peak.name} at ${peak.pct}% of the class.`);
    }

    if (missingEquip.size) add('warn', 'equipment', 'Needs equipment you don\'t have', [...missingEquip.entries()].map(([e, names]) => `${e.replace(/_/g, ' ')}: ${[...new Set(names)].join(', ')}`).join('; '));
    if (aboveLevel.length) add('info', 'level', 'Above the class level', [...new Set(aboveLevel)].join(', '));
    if (flow.lengthMin && Math.abs(totalSec / 60 - flow.lengthMin) > 5) add('info', 'length', `Runs ${fmtMin(totalSec)} for a ${flow.lengthMin} min class`, 'Adjust movement times or add/remove movements.');
    if (unknown.length) add('warn', 'unknown', 'Movements not in the library', unknown.join(', '));
  }

  // ---- clients
  const clientChecks = [];
  for (const c of clients) {
    const tags = new Set(c.tags || []);
    if (!tags.size) continue;
    const issues = [];
    for (const { item } of rows) {
      const mv = mvOf(item.slug);
      if (!mv) continue;
      for (const caution of mv.cautions || []) {
        if (!tags.has(caution.tag)) continue;
        const swap = caution.swap && movements[caution.swap] && !(movements[caution.swap].cautions || []).some((x) => tags.has(x.tag))
          ? { slug: caution.swap, name: movements[caution.swap].name }
          : suggestSwap(mv, tags, movements);
        issues.push({ itemId: item.id, slug: mv.slug, name: mv.name, tag: caution.tag, tagLabel: labelOf(CAUTIONS, caution.tag), note: caution.note, swap });
      }
    }
    if (issues.length) clientChecks.push({ client: { id: c.id, name: c.name, spot: c.spot || '' }, issues });
  }
  if (clientChecks.length) add('action', 'clients', `Changes for ${clientChecks.length} client${clientChecks.length > 1 ? 's' : ''}`, clientChecks.map((c) => `${c.client.name}: ${c.issues.length} movement${c.issues.length > 1 ? 's' : ''}`).join(' · '));

  const order = { action: 0, warn: 1, info: 2, ok: 3 };
  checks.sort((a, b) => order[a.level] - order[b.level]);

  return {
    count, segments: segInfo, totalSec, movingSec, transitionSec,
    movingPct: totalSec ? Math.round((movingSec / totalSec) * 100) : 0,
    springChanges, boxChanges, positionChanges, apparatusChanges,
    timeline, positionMinutes, spine, target: { key: targetKey, ...target },
    muscles, frontBack, purpose, multiJoint: { multi, isolated },
    intensity, peak, checks, clientChecks
  };
}

// Pick a replacement: same apparatus, no matching caution, closest by position, spine and muscles.
export function suggestSwap(mv, tags, movements) {
  let best = null;
  let bestScore = -1;
  for (const cand of Object.values(movements)) {
    if (cand.slug === mv.slug || cand.apparatus !== mv.apparatus) continue;
    if ((cand.cautions || []).some((c) => tags.has(c.tag))) continue;
    let s = 0;
    if (cand.position === mv.position) s += 2;
    if ((cand.spine || []).some((x) => (mv.spine || []).includes(x))) s += 2;
    const prim = new Set(mv.muscles.primary);
    s += (cand.muscles.primary || []).filter((m) => prim.has(m)).length * 1.5;
    if (Math.abs((cand.intensity || 3) - (mv.intensity || 3)) <= 2) s += 1;
    if (s > bestScore) { bestScore = s; best = cand; }
  }
  return best && bestScore >= 3 ? { slug: best.slug, name: best.name } : null;
}

function segSec(segInfo, role) { return segInfo.filter((s) => s.role === role).reduce((a, s) => a + s.sec, 0); }
function dirLabel(d) { return d === 'side-bend' ? 'side bend' : d; }
function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
export function fmtMin(sec) {
  const m = Math.round(sec / 60);
  return `${m} min`;
}
export function fmtClock(sec) {
  sec = Math.max(0, Math.round(sec));
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
}
