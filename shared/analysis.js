// OpenPilates flow analysis. Pure functions, no DOM — runs in the browser and in Node tests.
// Measures follow Kaleen Canevari's class-design metrics: spine movement against a target,
// body-position changes, time moving vs setting up, and muscle balance. On top of that it checks
// the things a reformer class is usually planned around: how often the springs change, whether
// every part of the body gets a turn, and whether stabilising work is balanced with movement.
import { MUSCLES, SPINE_DIRECTIONS, DEFAULT_TARGETS, PURPOSES, LEVELS, CAUTIONS, SECTION_GROUPS, CATEGORIES, EQUIPMENT, labelOf, byId, sectionOf, sectionGroupOf, categoriesOf, roleOf, sameSetting, variationOf, itemName, kindOf } from './vocab.js';

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

const keyOf = (loads) => [...(loads || [])].sort().join('+');
const LOAD_WEIGHT = { xlight: 1, light: 2, medium: 3, heavy: 4, xheavy: 5 };
const weightOf = (loads) => (loads || []).reduce((a, l) => a + (LOAD_WEIGHT[l] || 0), 0);

// Spring settings this movement can be taught on: the class override if there is one,
// otherwise the usual setting and the "to advance" setting.
function loadOptions(item, mv) {
  if (item.load && Array.isArray(item.load.springs)) return [item.load.springs];
  const v = variationOf(mv, item);
  if (v && v.springs && v.springs.length) return [v.springs];
  const out = [(mv.load && mv.load.springs) || []];
  if (mv.load && mv.load.advance && mv.load.advance.length && keyOf(mv.load.advance) !== keyOf(out[0])) out.push(mv.load.advance);
  return out;
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
  let currentLoad = null;
  const springPlan = [];
  const springStops = [];
  const groupSec = Object.fromEntries(SECTION_GROUPS.map((g) => [g.id, 0]));
  const sectionSec = {};
  const categoryCount = Object.fromEntries(CATEGORIES.map((c) => [c.id, 0]));
  const roleSec = { stability: 0, mobility: 0 };
  const sequence = [];
  const positionsUsed = new Set();
  let hasReformer = false;
  let withOptions = 0;
  const noEasier = [];
  const kit = new Map();
  const strapsUsed = new Set();
  let firstLoad = null;

  for (const seg of flow.segments || []) {
    const segStart = t;
    const passes = seg.bothSides ? [1, 2] : [1];
    for (const pass of passes) for (const item of seg.items || []) {
      const mv = mvOf(item.slug);
      if (!mv) { if (pass === 1) unknown.push(item.slug); continue; }
      const dur = itemDuration(item, mv);

      // transitions from the previous movement
      if (prev) {
        let cost = 0;
        if (prev.mv.position !== mv.position) { positionChanges++; cost += TRANSITION_COST.position; }
        if (prev.mv.apparatus !== mv.apparatus) { apparatusChanges++; cost += TRANSITION_COST.apparatus; }
        if (boxKey(prev.mv) !== boxKey(mv)) { boxChanges++; cost += TRANSITION_COST.box; }
        t += cost;
      }

      // springs: stay on the current setting whenever this movement can be taught on it
      if (mv.apparatus === 'reformer') {
        hasReformer = true;
        const options = loadOptions(item, mv);
        // "flexible" movements (most stretches) work on whatever light setting is already on
        const flexible = !item.load && mv.load && mv.load.flexible && currentLoad && weightOf(currentLoad) <= 5;
        const stay = currentLoad && (flexible ? currentLoad : options.find((o) => keyOf(o) === keyOf(currentLoad)) || (options.some((o) => sameSetting(o, currentLoad)) ? currentLoad : null));
        let changed = false;
        if (!stay) {
          if (currentLoad) { springChanges++; t += TRANSITION_COST.spring; changed = true; springStops.push({ before: itemName(mv, item), loads: options[0] }); }
          currentLoad = options[0];
        }
        if (!firstLoad) firstLoad = currentLoad;
        springPlan.push({ itemId: item.id, pass, slug: mv.slug, name: itemName(mv, item), loads: currentLoad, changed, advanced: !!stay && !flexible && options.length > 1 && keyOf(options[1]) === keyOf(currentLoad) });
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

      const group = sectionGroupOf(mv);
      groupSec[group] += dur;
      const sec = sectionOf(mv);
      sectionSec[sec] = (sectionSec[sec] || 0) + dur;
      if (pass === 1) for (const c of categoriesOf(mv)) if (c in categoryCount) categoryCount[c]++;
      const role = roleOf(mv);
      if (role === 'both') { roleSec.stability += dur / 2; roleSec.mobility += dur / 2; } else roleSec[role] += dur;
      positionsUsed.add(mv.position);
      sequence.push({ mv, role, pass });

      const needs = (m) => {
        for (const e of m.equipment || []) {
          if (!kit.has(e)) kit.set(e, new Set());
          kit.get(e).add(m.name);
          if (!(Number(owned[e]) > 0)) {
            if (!missingEquip.has(e)) missingEquip.set(e, []);
            missingEquip.get(e).push(m.name);
          }
        }
        if (m.setup && m.setup.straps && m.setup.straps !== 'none') strapsUsed.add(m.setup.straps);
      };
      needs(mv);
      // options offered inside this movement: an add-on movement brings its own muscles and kit
      if (pass === 1) {
        const opts = item.options || [];
        if (opts.length || (item.layers || []).length) withOptions++;
        for (const o of opts) {
          const add = o.slug && mvOf(o.slug);
          if (!add) continue;
          needs(add);
          for (const m of add.muscles.primary || []) { muscleCount[m] = (muscleCount[m] || 0) + 1; muscleScore[m] = (muscleScore[m] || 0) + dur * 0.3; }
          for (const c of categoriesOf(add)) if (c in categoryCount) categoryCount[c]++;
        }
        if (((mv.intensity || 3) >= 7 || mv.level === 'advanced') && !opts.some((o) => kindOf(o.kind) === 'regression')) noEasier.push(mv.name);
      }
      if ((LEVEL_RANK[mv.level] || 1) > flowLevel) aboveLevel.push(mv.name);

      prev = { mv, item };
    }
    segInfo.push({ id: seg.id, name: seg.name, role: seg.role, start: segStart, sec: t - segStart });
  }

  const totalSec = t;
  const transitionSec = totalSec - movingSec;
  const count = rows.length - unknown.length;

  const groupTotal = Object.values(groupSec).reduce((a, b) => a + b, 0) || 1;
  const sections = SECTION_GROUPS.map((g) => ({ id: g.id, label: g.label, color: g.color, sec: groupSec[g.id], pct: Math.round((groupSec[g.id] / groupTotal) * 100) }));
  const roleTotal = roleSec.stability + roleSec.mobility || 1;
  const roles = { stability: Math.round((roleSec.stability / roleTotal) * 100), mobility: Math.round((roleSec.mobility / roleTotal) * 100) };
  const categories = CATEGORIES.map((c) => ({ id: c.id, label: c.label, count: categoryCount[c.id] }));
  const springBudget = Number.isFinite(Number(flow.springBudget)) && flow.springBudget !== null && flow.springBudget !== undefined ? Number(flow.springBudget) : 6;

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
  const segRoles = new Set((flow.segments || []).filter((s) => (s.items || []).length).map((s) => s.role));
  if (count === 0) {
    add('info', 'empty', 'Add some movements', 'Drag movements into a segment to see the analysis.');
  } else {
    if (!segRoles.has("warmup")) add('warn', 'warmup', 'No warm-up', 'Mark a segment as Warm-up and start with lower-effort movements.');
    else add('ok', 'warmup', 'Warm-up in place', `${fmtMin(segSec(segInfo, 'warmup'))} to start.`);
    if (!segRoles.has("cooldown")) add('warn', 'cooldown', 'No cool-down', 'Finish with a stretch segment marked Cool-down.');
    else add('ok', 'cooldown', 'Cool-down in place', `${fmtMin(segSec(segInfo, 'cooldown'))} to finish.`);

    const missingDirs = SPINE_DIRECTIONS.filter((d) => spine[d] === 0);
    if (missingDirs.length) add('warn', 'spine-missing', `No ${missingDirs.map(dirLabel).join(' or ')}`, 'A balanced class moves the spine in all four directions.');
    else add('ok', 'spine-all', 'All four spine movements', 'Flexion, extension, rotation and side bend are all here.');

    for (const d of SPINE_DIRECTIONS) {
      const diff = spine[d] - (target[d] || 0);
      if (spine[d] > 0 && diff <= -8) add('warn', 'spine-low-' + d, `${cap(dirLabel(d))} below target`, `${spine[d]}% vs ${target[d]}% for "${target.label || targetKey}".`);
      if (diff >= 12) add('info', 'spine-high-' + d, `${cap(dirLabel(d))} above target`, `${spine[d]}% vs ${target[d]}%.`);
    }

    // ---- reformer class design
    if (hasReformer) {
      if (springChanges > springBudget) add('warn', 'springs', `${springChanges} spring changes (aiming for ${springBudget} or fewer)`, `Changes come before: ${springStops.map((s) => s.before).join(', ')}. Group movements that share a setting, or use a movement's "to advance" spring to stay put. Settings one extra-light spring apart aren't counted.`);
      else add('ok', 'springs', springChanges === 0 ? 'One spring setting all class' : `${springChanges} spring change${springChanges === 1 ? '' : 's'}`, `Within the limit of ${springBudget}.`);
    }
    if (count >= 6) {
      const missing = sections.filter((s) => s.id !== 'stretch' && s.sec === 0);
      if (missing.length) add('warn', 'sections', `No ${missing.map((s) => s.label.toLowerCase()).join(' or ')} work`, 'Pick something from each part of the body so the whole body feels worked.');
      else add('ok', 'sections', 'Whole body covered', sections.filter((s) => s.sec).map((s) => `${s.label} ${s.pct}%`).join(' · '));
      if (groupSec.stretch === 0) add('info', 'relief', 'No stretch or relief', 'Add a stretch or a mobility movement between hard blocks or at the end.');

      if (roles.mobility < 15 && !['mobility', 'rehab'].includes(flow.goal)) add('info', 'roles', 'Mostly stabilising work', `${roles.stability}% of the class holds the body still against load. Pair hard holds with something that moves the spine or opens the hips.`);
      let run = 0; let runEnd = null; let worst = 0; let worstEnd = null;
      for (const s of sequence) {
        if (s.role === 'stability' && (s.mv.intensity || 3) >= 5) { run++; runEnd = s.mv.name; if (run > worst) { worst = run; worstEnd = runEnd; } } else run = 0;
      }
      if (worst >= 6) add('info', 'run', `${worst} hard stability movements in a row`, `Slot a stretch or mobility movement in before ${worstEnd}.`);

      const uncovered = categories.filter((c) => c.count === 0);
      if (count >= 8 && uncovered.length) add('info', 'categories', `Not covered: ${uncovered.map((c) => c.label.toLowerCase()).join(', ')}`, 'A rounded class usually touches every movement category at least once.');
      else if (count >= 8) add('ok', 'categories', 'Every movement category covered', 'Trunk, hips, upper body, hands-and-knees and standing work are all here.');

      if (boxChanges > 3) add('info', 'box', `The box or board goes on and off ${boxChanges} times`, 'Put the movements that share a box or jump board next to each other.');
      if (noEasier.length && (clients.length || noEasier.length >= 2)) add('info', 'options', `No regression planned for ${noEasier.length === 1 ? noEasier[0] : noEasier.length + ' harder movements'}`, `${noEasier.length > 1 ? [...new Set(noEasier)].join(', ') + '. ' : ''}Open the movement in the builder and add a regression so nobody is left out.`);
      if (positionsUsed.size < 3) add('info', 'positions', 'Not much change of position', 'Vary the orientation: lying on the back, side or front, kneeling, standing, facing the front or back.');
    }
    if (sequence.length >= 4) {
      const first = sequence[0].mv;
      if ((first.intensity || 3) >= 6 || first.level === 'advanced') add('warn', 'starts-hard', 'Starts with a hard movement', `${first.name} is first. Open with simple, big-range movements that warm up what's coming.`);
      const last = sequence[sequence.length - 1].mv;
      if ((last.intensity || 3) >= 6) add('info', 'ends-hard', 'Ends on a hard movement', `${last.name} is last. Leave room to wind down.`);
    }
    {
      const seen = new Set();
      const noLeadIn = [];
      for (const s of sequence) {
        const prep = (s.mv.prep || []).filter((p) => movements[p]);
        if (s.pass === 1 && prep.length && !prep.some((p) => seen.has(p)) && !noLeadIn.some((n) => n.slug === s.mv.slug)) noLeadIn.push({ slug: s.mv.slug, name: s.mv.name, try: prep.slice(0, 2).map((p) => movements[p].name) });
        seen.add(s.mv.slug);
      }
      if (noLeadIn.length) add('info', 'lead-in', `No lead-in for ${noLeadIn.length === 1 ? noLeadIn[0].name : noLeadIn.length + ' harder movements'}`, noLeadIn.map((n) => `${n.name}: build up with ${n.try.join(' or ')}`).join('. ') + '.');
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
        const modify = caution.severity === 'modify';
        const swap = modify ? null : caution.swap && movements[caution.swap] && !avoids(movements[caution.swap], tags)
          ? { slug: caution.swap, name: movements[caution.swap].name }
          : suggestSwap(mv, tags, movements);
        issues.push({ itemId: item.id, slug: mv.slug, name: mv.name, tag: caution.tag, tagLabel: labelOf(CAUTIONS, caution.tag), note: caution.note, severity: modify ? 'modify' : 'avoid', swap });
      }
    }
    issues.sort((a, b) => (a.severity === 'modify') - (b.severity === 'modify'));
    if (issues.length) clientChecks.push({ client: { id: c.id, name: c.name, spot: c.spot || '' }, issues });
  }
  if (clientChecks.length) add('action', 'clients', `Changes for ${clientChecks.length} client${clientChecks.length > 1 ? 's' : ''}`, clientChecks.map((c) => { const sw = c.issues.filter((i) => i.severity !== 'modify').length; const md = c.issues.length - sw; return `${c.client.name}: ${[sw ? `${sw} to swap` : '', md ? `${md} to adjust` : ''].filter(Boolean).join(', ')}`; }).join(' · '));

  const order = { action: 0, warn: 1, info: 2, ok: 3 };
  checks.sort((a, b) => order[a.level] - order[b.level]);

  return {
    count, segments: segInfo, totalSec, movingSec, transitionSec,
    movingPct: totalSec ? Math.round((movingSec / totalSec) * 100) : 0,
    springChanges, boxChanges, positionChanges, apparatusChanges,
    timeline, positionMinutes, spine, target: { key: targetKey, ...target },
    springPlan, springBudget, springStops, sections, sectionSec, roles, categories, hasReformer, withOptions,
    setOut: {
      springs: firstLoad,
      equipment: [...kit.entries()].map(([id, names]) => ({ id, label: labelOf(EQUIPMENT, id), for: [...names], have: Number(owned[id]) || 0 })),
      straps: [...strapsUsed]
    },
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
    if (avoids(cand, tags)) continue;
    let s = 0;
    if (sectionOf(cand) === sectionOf(mv)) s += 2;
    if (cand.position === mv.position) s += 2;
    if ((cand.spine || []).some((x) => (mv.spine || []).includes(x))) s += 2;
    const prim = new Set(mv.muscles.primary);
    s += (cand.muscles.primary || []).filter((m) => prim.has(m)).length * 1.5;
    if (Math.abs((cand.intensity || 3) - (mv.intensity || 3)) <= 2) s += 1;
    if (s > bestScore) { bestScore = s; best = cand; }
  }
  return best && bestScore >= 3 ? { slug: best.slug, name: best.name } : null;
}

// True when the movement carries an "avoid" caution for any of these tags.
export function avoids(mv, tags) {
  return (mv.cautions || []).some((c) => tags.has(c.tag) && c.severity !== 'modify');
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
