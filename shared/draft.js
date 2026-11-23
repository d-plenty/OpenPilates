// "Draft it for me": builds a starting class the way teachers plan one.
// The class type (set up in Studio) gives the phases and how long each runs. Each phase is filled with
// a few blocks: one movement each, with time to build it up through layers. Warm-ups and cool-downs only
// use movements marked for them, the hardest work is kept for the peak, and movements that share a
// spring setting sit together. Everything is a starting point the teacher edits.
import { sectionOf, sameSetting, levelRange, classLevel, usesOf, variationsOf, DEFAULT_CLASS_TYPES, DEFAULT_TARGETS, TIMING } from './vocab.js';
import { analyze } from './analysis.js';

export const GOALS = [
  { id: 'full_body', label: 'Full body', muscles: [] },
  { id: 'posterior_chain', label: 'Posterior chain', muscles: ['glutes', 'hamstrings', 'spinal_extensors', 'upper_back'] },
  { id: 'core', label: 'Core', muscles: ['abdominals', 'obliques'] },
  { id: 'upper_body', label: 'Upper body', muscles: ['shoulders', 'upper_back', 'chest', 'triceps', 'biceps', 'lats'] },
  { id: 'lower_body', label: 'Legs & glutes', muscles: ['glutes', 'quadriceps', 'hamstrings', 'calves', 'hip_abductors', 'adductors'] },
  { id: 'mobility', label: 'Mobility', muscles: [], purpose: ['flexibility', 'mobility'], maxIntensity: 5 },
  { id: 'prenatal', label: 'Prenatal', muscles: ['glutes', 'upper_back'], avoid: ['pregnancy', 'pregnancy_early'], maxIntensity: 6 },
  { id: 'rehab', label: 'Rehab-friendly', muscles: [], purpose: ['mobility', 'stability'], maxIntensity: 5, label_pref: 'rehab-friendly' }
];

// How long one block is aimed at, in seconds, by where it sits in the class.
const BLOCK_SEC = { warmup: 180, build: 270, peak: 240, cooldown: 150 };
const MIN_BLOCK = { warmup: 60, build: 120, peak: 90, cooldown: 60 };
// The longest a movement can carry a block: its own time and a half, plus a minute for each layer there is to build (up to three).
const maxBlock = (mv) => (mv.duration || 120) * 1.5 + Math.min(3, (mv.layers || []).length) * 60;

function rng(seed) {
  let s = (seed >>> 0) || 1;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

let idCounter = 0;
export function newId(prefix = 'i') {
  idCounter = (idCounter + 1) % 1e6;
  return prefix + Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36) + idCounter.toString(36);
}

// Settings are kept as sorted "a+b" strings; two match when they are the same working load.
const keyOf = (l) => [...(l || [])].sort().join('+');
const optionKeys = (mv) => (mv && mv.load ? [keyOf(mv.load.springs), ...(mv.load.advance && mv.load.advance.length ? [keyOf(mv.load.advance)] : [])] : []);
const split = (k) => (k ? k.split('+') : []);
const shares = (mv, keys) => optionKeys(mv).some((k) => keys.some((c) => sameSetting(split(k), split(c))));


// The class type a draft is built on: the one asked for, else the studio's first for that apparatus.
export function pickClassType({ classType, classTypes, apparatus = 'reformer', format } = {}) {
  if (classType && typeof classType === 'object') return classType;
  const all = Array.isArray(classTypes) && classTypes.length ? classTypes : DEFAULT_CLASS_TYPES;
  const want = apparatus === 'mat' ? 'mat' : 'reformer';
  return all.find((c) => c.id === classType) || (format === 'fit' && all.find((c) => c.id === 'reformer_fit')) || all.find((c) => c.apparatus === want) || DEFAULT_CLASS_TYPES.find((c) => c.apparatus === want);
}

// Empty segments for a class type, with each phase's minutes scaled to the class length.
export function phasesFor(type, lengthMin, { props } = {}) {
  let phases = (type.phases || []).filter((p) => p && p.minutes > 0);
  // a jump-board block is no use to a studio with no boards
  if (props && !(Number(props.jump_board) > 0)) { const kept = phases.filter((p) => !(p.sections && p.sections.length && p.sections.every((s) => s === 'cardio'))); if (kept.length) phases = kept; }
  const sum = phases.reduce((a, p) => a + p.minutes, 0) || 1;
  const scale = (lengthMin || type.lengthMin || sum) / sum;
  return phases.map((p) => ({ ...p, sec: p.minutes * 60 * scale }));
}
export function blankSegments(type, lengthMin, opts) {
  return phasesFor(type, lengthMin, opts).map((p) => ({ id: newId('s'), name: p.name, role: p.role, minutes: Math.max(1, Math.round(p.sec / 60)), song: '', items: [] }));
}

function draftOnce({ movements, classType, classTypes, goal = 'full_body', apparatus, format, lengthMin, level, props = {}, clientTags = [], seed = 1, timing = TIMING, targets }) {
  const g = GOALS.find((x) => x.id === goal) || GOALS[0];
  const rand = rng(seed);
  const type = pickClassType({ classType, classTypes, apparatus, format });
  const app = type.apparatus === 'mat' ? 'mat' : 'reformer';
  const length = lengthMin || type.lengthMin || 50;
  const lv = classLevel(level);
  const top = goal === 'rehab' ? 1 : goal === 'prenatal' ? Math.min(2, lv.to) : lv.to;
  const avoid = new Set(g.avoid || []);
  const prefer = new Set(clientTags || []);
  const used = new Set();
  const prenatal = g.id === 'prenatal';
  const pool = Object.values(movements).filter((mv) => {
    if (mv.hidden ?? mv.retired) return false;
    if (mv.apparatus !== app) return false;
    if (levelRange(mv)[0] > top) return false;
    if ((mv.equipment || []).some((e) => !(Number(props[e]) > 0))) return false;
    if ((mv.cautions || []).some((c) => avoid.has(c.tag) && c.severity !== 'modify')) return false;
    if (g.maxIntensity && (mv.intensity || 3) > g.maxIntensity) return false;
    return true;
  });
  const phases = phasesFor(type, length, { props });
  const builds = phases.filter((p) => p.role === 'build').length || 1;
  let buildIndex = 0;
  // Spine balance is steered as the class is filled: a direction that is behind its target share gets a push.
  const targetKey = goal === 'prenatal' ? 'prenatal' : goal === 'core' ? 'core-glutes' : 'general';
  const tgt = (targets && targets[targetKey]) || DEFAULT_TARGETS[targetKey] || DEFAULT_TARGETS.general;
  const dirSec = { flexion: 0, extension: 0, rotation: 0, 'side-bend': 0 };
  const balance = (mv) => {
    const total = Object.values(dirSec).reduce((a, b) => a + b, 0);
    return [...new Set(spineDirs(mv))].filter((d) => d in dirSec).reduce((a, d) => a + ((Number(tgt[d]) || 0) / 100 - (total ? dirSec[d] / total : 0)) * 10, 0);
  };

  // Who may go in a phase. Warm-ups and cool-downs only take movements marked for them; if the studio's
  // library has none that fit the phase's part of the body, the part of the body is dropped before the rule is.
  const inSection = (mv, p) => !p.sections || !p.sections.length || p.sections.includes(sectionOf(mv));
  const inPosition = (mv, p) => !p.positions || !p.positions.length || p.positions.includes(mv.position);
  const okPrenatal = (mv, p) => !(prenatal && p.role !== 'warmup' && (mv.pregnancy === 'supine' || mv.position === 'supine' || mv.position === 'prone'));
  const marked = (mv, p) => (p.role === 'warmup' ? usesOf(mv).includes('warmup') : p.role === 'cooldown' ? usesOf(mv).includes('cooldown') : true);
  const candidates = (p) => {
    const free = pool.filter((mv) => !used.has(mv.slug) && okPrenatal(mv, p));
    const tries = [
      (mv) => marked(mv, p) && inSection(mv, p) && (prenatal && p.role !== 'warmup' ? true : inPosition(mv, p)),
      (mv) => marked(mv, p) && inSection(mv, p),
      ...(p.role === 'warmup' || p.role === 'cooldown' ? [(mv) => marked(mv, p), (mv) => inSection(mv, p) && (mv.intensity || 3) <= 3, (mv) => (mv.intensity || 3) <= 2] : [(mv) => inSection(mv, p)])
    ];
    for (const t of tries) { const list = free.filter(t); if (list.length) return list; }
    return [];
  };

  let lastKeys = [];
  const segments = phases.map((p) => {
    // the working intensity a phase aims at: building through the class, hardest at the peak
    const aim = p.role === 'warmup' ? 2.5 : p.role === 'cooldown' ? 1.5 : p.role === 'peak' ? Math.min(9, 5 + top * 1.2) : 3.5 + (builds > 1 ? (buildIndex / (builds - 1)) * 2 : 1) + (top - 2) * 0.6;
    if (p.role === 'build') buildIndex++;
    const want = Math.max(1, Math.round(p.sec / BLOCK_SEC[p.role]));
    const items = [];
    const incoming = lastKeys;
    let capacity = 0;
    for (let n = 0; n < 6 && (n < want || capacity < p.sec * 0.85); n++) {
      const next = candidates(p).map((mv) => ({ mv, s: score(mv, p, g, lv, top, aim) + rand() * 1.2 - flagged(mv, prefer) * 6
        + (lastKeys.length && shares(mv, lastKeys) ? 5 : mv.load?.flexible ? 2.5 : 0)
        + balance(mv)
        // a movement that needs a lead-in waits until one of its lead-ins is in the class
        + (!(mv.prep || []).length || ((mv.intensity || 3) < 7 && mv.level !== 'advanced') ? 0 : mv.prep.some((s) => used.has(s)) ? 1 : -2) })).sort((a, b) => b.s - a.s)[0];
      if (!next) break;
      used.add(next.mv.slug);
      for (const d of new Set(spineDirs(next.mv))) if (d in dirSec) dirSec[d] += maxBlock(next.mv);
      items.push({ id: newId(), slug: next.mv.slug });
      capacity += maxBlock(next.mv);
      if (next.mv.load && !next.mv.load.flexible) lastKeys = optionKeys(next.mv);
    }
    let ordered;
    if (p.role === 'warmup') {
      // easiest first, and Footwork itself opens a footwork block
      const first = (s) => (s === 'footwork-series' ? -1 : 0);
      ordered = [...items].sort((a, b) => first(a.slug) - first(b.slug) || (movements[a.slug].intensity || 0) - (movements[b.slug].intensity || 0));
    } else if (p.role === 'cooldown') {
      ordered = [...items].sort((a, b) => (movements[b.slug].intensity || 0) - (movements[a.slug].intensity || 0));
    } else {
      const r = orderBySprings(items, movements, incoming);
      ordered = r.ordered; lastKeys = r.keys;
    }
    return { id: newId('s'), name: p.name, role: p.role, minutes: Math.max(1, Math.round(p.sec / 60)), song: '', items: ordered, _p: p };
  }).filter((s) => s.items.length);

  // The spine should move in all four directions if the library allows it: swap one in where it fits.
  const has = (dir) => segments.some((s) => s.items.some((i) => spineDirs(movements[i.slug]).includes(dir)));
  for (const dir of ['rotation', 'side-bend', 'extension', 'flexion']) {
    if (has(dir)) continue;
    const order = [...segments].sort((a, b) => (b.role === 'cooldown') - (a.role === 'cooldown') || (b.role === 'build') - (a.role === 'build'));
    for (const seg of order) {
      const cand = pool.filter((mv) => !used.has(mv.slug) && marked(mv, seg._p) && inSection(mv, seg._p) && okPrenatal(mv, seg._p) && spineDirs(mv).includes(dir))
        .sort((a, b) => score(b, seg._p, g, lv, top, 4) - score(a, seg._p, g, lv, top, 4))[0];
      if (!cand) continue;
      used.add(cand.slug);
      // take the place of a movement whose directions are all covered elsewhere, so the block count holds
      const spare = seg.items.length > 1 ? seg.items.findIndex((i) => spineDirs(movements[i.slug]).every((d) => segments.some((s) => s.items.some((x) => x !== i && spineDirs(movements[x.slug]).includes(d))))) : -1;
      if (spare >= 0) seg.items.splice(spare, 1, { id: newId(), slug: cand.slug }); else seg.items.push({ id: newId(), slug: cand.slug });
      break;
    }
  }

  // Lead-ins first: inside a phase, a movement goes after any of its preparation movements.
  for (const seg of segments) {
    seg.items.sort((a, b) => {
      const A = movements[a.slug]; const B = movements[b.slug];
      if ((A.prep || []).includes(b.slug)) return 1;
      if ((B.prep || []).includes(a.slug)) return -1;
      return 0;
    });
  }

  // A phase that found nothing gives its time to the others. Then every block gets an even share of its
  // phase, the layers there is time for, and the last block of a strength phase gets a finisher.
  const keptSec = segments.reduce((a, s) => a + s._p.sec, 0) || 1;
  const classSec = length * 60;
  for (const seg of segments) {
    const phaseSec = seg._p.sec * (classSec / keptSec);
    seg.minutes = Math.max(1, Math.round(phaseSec / 60));
    const weights = seg.items.reduce((a, i) => a + maxBlock(movements[i.slug]), 0);
    seg.items.forEach((it, idx) => {
      const mv = movements[it.slug];
      // time is shared by how much each movement can carry, so a quick one is not stretched to fill a block
      const each = phaseSec * (maxBlock(mv) / weights);
      const room = each - (mv.duration || 120);
      const k = Math.max(0, Math.min(3, (mv.layers || []).length, Math.floor(room / Math.max(20, timing.perLayer || 45))));
      if (k && seg.role !== 'cooldown') it.layers = mv.layers.slice(0, k).map((l) => l.tag);
      const strength = ['lower', 'pelvic', 'chest_arms', 'back_shoulders', 'single_arm'].includes(sectionOf(mv));
      if (seg.role === 'build' && strength && idx === seg.items.length - 1 && each >= (mv.duration || 120) + 45 && (mv.intensity || 3) <= 7 && !prenatal && g.id !== 'rehab') {
        it.finisher = ['lower', 'pelvic'].includes(sectionOf(mv)) ? 'Pulses × 10' : 'Hold for 10';
      }
      it.duration = Math.max(MIN_BLOCK[seg.role], Math.round(each / 15) * 15);
      withRegression(it, mv);
    });
  }

  const flow = {
    title: `${g.label} · ${type.name} ${length} min`,
    apparatus: app, level: lv.id, lengthMin: length, goal, classType: type.id,
    format: app === 'mat' ? 'open' : type.id === 'reformer_fit' ? 'fit' : 'flow',
    springBudget: app === 'mat' ? 6 : (type.springBudget ?? 3),
    target: targetKey,
    segments
  };

  // Fit the class to its length: changes of springs, position and box take real time, so the blocks
  // give a little back until the whole plan lands on the class length.
  for (let pass = 0; pass < 4; pass++) {
    const total = analyze({ flow, movements, studio: { props, timing } }).totalSec;
    const moving = segments.reduce((a, s) => a + s.items.reduce((x, i) => x + i.duration, 0) * (s.bothSides ? 2 : 1), 0);
    const over = total - classSec;
    if (Math.abs(over) < 45 || !moving) break;
    const f = (moving - over) / moving;
    for (const seg of segments) for (const it of seg.items) it.duration = Math.max(MIN_BLOCK[seg.role], Math.round((it.duration * f) / 15) * 15);
  }
  for (const seg of segments) delete seg._p;
  return flow;
}

// A hard block is drafted with a way down already planned: the movement's first regression.
function withRegression(it, mv) {
  if ((mv.intensity || 0) < 7) return it;
  const v = variationsOf(mv).find((x) => x.kind === 'regression');
  if (v) it.options = [{ id: newId('o'), kind: 'regression', title: v.name, ...(v.note ? { note: v.note } : {}), ...(v.springs && v.springs.length && mv.apparatus === 'reformer' ? { springs: [...v.springs] } : {}) }];
  return it;
}

// How many booked clients' cautions a movement carries (used as a penalty, not a ban,
// so group classes still get a full plan and the analysis suggests swaps).
function flagged(mv, tags) {
  if (!tags.size) return 0;
  return (mv.cautions || []).filter((c) => tags.has(c.tag)).reduce((a, c) => a + (c.severity === 'modify' ? 0.3 : 1), 0);
}

function spineDirs(mv) {
  return (mv?.spine || []).map((s) => (s === 'articulation' ? 'flexion' : s));
}

function loadWeight(mv) {
  if (!mv || !mv.load) return 0;
  const w = { xlight: 1, light: 2, medium: 3, heavy: 4, xheavy: 5 };
  return (mv.load.springs || []).reduce((a, l) => a + (w[l] || 0), 0);
}

// Put a block's movements in an order that changes springs as rarely as possible, starting
// from whatever is already on the machine. Returns the ordered items and the setting left on.
export function orderBySprings(items, movements, incoming = []) {
  const ordered = [];
  const rest = [...items];
  let keys = incoming;
  while (rest.length) {
    rest.sort((a, b) => {
      const A = movements[a.slug]; const B = movements[b.slug];
      if (!A || !B) return 0;
      const sa = shares(A, keys) || A.load?.flexible || !A.load ? 1 : 0;
      const sb = shares(B, keys) || B.load?.flexible || !B.load ? 1 : 0;
      return sb - sa || loadWeight(B) - loadWeight(A) || (A.intensity || 0) - (B.intensity || 0);
    });
    const next = rest.shift();
    ordered.push(next);
    const mv = movements[next.slug];
    if (mv && mv.load && !mv.load.flexible && !next.load && !shares(mv, keys)) keys = optionKeys(mv).slice(0, 1);
    if (next.load && Array.isArray(next.load.springs)) keys = [keyOf(next.load.springs)];
  }
  // a movement goes after any of its lead-ins that are in the same block
  ordered.sort((a, b) => {
    const A = movements[a.slug]; const B = movements[b.slug];
    if (A && (A.prep || []).includes(b.slug)) return 1;
    if (B && (B.prep || []).includes(a.slug)) return -1;
    return 0;
  });
  return { ordered, keys };
}

// "Tidy springs": reorder inside each segment (never across segments) to cut spring changes.
// Warm-ups and cool-downs keep their order.
export function tidySprings(flow, movements) {
  let keys = [];
  const segments = (flow.segments || []).map((seg) => {
    if (seg.role === 'warmup' || seg.role === 'cooldown') {
      for (const it of seg.items || []) { const mv = movements[it.slug]; if (mv && mv.load && !mv.load.flexible && !shares(mv, keys)) keys = optionKeys(mv).slice(0, 1); }
      return seg;
    }
    const r = orderBySprings(seg.items || [], movements, keys);
    keys = r.keys;
    return { ...seg, items: r.ordered };
  });
  // Never hand back an order that changes springs more often than the one we were given.
  const count = (segs) => analyze({ flow: { ...flow, segments: segs }, movements }).springChanges;
  return count(segments) <= count(flow.segments || []) ? segments : flow.segments;
}

function score(mv, p, g, lv, top, aim) {
  let s = 0;
  // movements written for this class level come first; far-too-easy ones last
  const [from, to] = levelRange(mv);
  if (from <= lv.to && to >= lv.from) s += 2; else if (to < lv.from) s -= (lv.from - to) * 1.5;
  const i = mv.intensity || 3;
  s -= Math.abs(i - aim) * 0.9;
  if (p.role === 'peak') s += usesOf(mv).includes('peak') && from <= top ? 2.5 : 0;
  if (p.role === 'build' && usesOf(mv).includes('peak') && i >= 8) s -= 2; // keep the hardest work for the peak
  if (p.sections && p.sections[0] === sectionOf(mv)) s += 1;
  const prim = (mv.muscles && mv.muscles.primary) || [];
  s += prim.filter((m) => g.muscles.includes(m)).length * 1.5;
  for (const q of g.purpose || []) s += (mv.purpose?.[q] || 0) * 0.8;
  if (g.label_pref && (mv.labels || []).includes(g.label_pref)) s += 2;
  if (g.id === 'prenatal' && mv.pregnancy === 'recommended') s += 3;
  if (g.id === 'prenatal' && mv.pregnancy === 'supine') s -= 3;
  if (p.role === 'cooldown') s += (mv.purpose?.flexibility || 0) * 0.8;
  if ((mv.layers || []).length) s += 0.5; // something to build on
  s += Math.min(3, (mv.variations || []).length * 0.3); // staples with many versions lead their block
  return s;
}

// Blocks for one phase of a flow that is already being built: the same rules as a draft, leaving out
// what the flow already uses. `phase` is the class type's phase when the flow has one.
export function fillPhase({ movements, flow, seg, phase, props = {}, clientTags = [], timing = TIMING, seed = Date.now(), count }) {
  const rand = rng(seed);
  const g = GOALS.find((x) => x.id === flow.goal) || GOALS[0];
  const lv = classLevel(flow.level);
  const app = flow.apparatus === 'mat' ? 'mat' : flow.apparatus === 'mixed' ? null : 'reformer';
  const p = { role: seg.role, sections: (phase && phase.sections) || [], positions: (phase && phase.positions) || [] };
  const used = new Set(flow.segments.flatMap((s) => s.items.map((i) => i.slug)));
  const prefer = new Set(clientTags);
  const ok = (mv) => !(mv.hidden ?? mv.retired) && !used.has(mv.slug) && (!app || mv.apparatus === app) && levelRange(mv)[0] <= lv.to
    && (mv.equipment || []).every((e) => Number(props[e]) > 0) && !(g.maxIntensity && (mv.intensity || 3) > g.maxIntensity);
  const marked = (mv) => (p.role === 'warmup' ? usesOf(mv).includes('warmup') : p.role === 'cooldown' ? usesOf(mv).includes('cooldown') : true);
  const inSection = (mv) => !p.sections.length || p.sections.includes(sectionOf(mv));
  const inPosition = (mv) => !p.positions.length || p.positions.includes(mv.position);
  const free = Object.values(movements).filter(ok);
  let list = [];
  for (const t of [(mv) => marked(mv) && inSection(mv) && inPosition(mv), (mv) => marked(mv) && inSection(mv), (mv) => marked(mv)]) { list = free.filter(t); if (list.length) break; }
  const aim = p.role === 'warmup' ? 2.5 : p.role === 'cooldown' ? 1.5 : p.role === 'peak' ? Math.min(9, 5 + lv.to * 1.2) : 4.5 + (lv.to - 2) * 0.6;
  // stay on the springs the phase before finishes on, when something suitable does
  let lastKeys = [];
  for (const s of flow.segments) { if (s === seg) break; for (const i of s.items) { const mv = movements[i.slug]; if (mv && mv.load && !mv.load.flexible) lastKeys = optionKeys(mv); } }
  const phaseSec = (seg.minutes || 5) * 60 - seg.items.reduce((a, i) => a + (i.duration || (movements[i.slug] || {}).duration || 120), 0);
  const want = count || Math.max(1, Math.round(Math.max(60, phaseSec) / BLOCK_SEC[p.role]));
  const picked = list.map((mv) => ({ mv, s: score(mv, p, g, lv, lv.to, aim) + rand() * 1.5 - flagged(mv, prefer) * 6 + (lastKeys.length && shares(mv, lastKeys) ? 4 : mv.load?.flexible ? 2 : 0) + (!(mv.prep || []).length || ((mv.intensity || 3) < 7 && mv.level !== 'advanced') ? 0 : mv.prep.some((s) => used.has(s)) ? 1 : -2) }))
    .sort((a, b) => b.s - a.s).slice(0, want).map((x) => x.mv);
  const weights = picked.reduce((a, mv) => a + maxBlock(mv), 0) || 1;
  return picked.map((mv) => {
    const each = Math.max(60, phaseSec) * (maxBlock(mv) / weights);
    const k = Math.max(0, Math.min(3, (mv.layers || []).length, Math.floor((each - (mv.duration || 120)) / Math.max(20, timing.perLayer || 45))));
    return withRegression({ id: newId(), slug: mv.slug, ...(k && p.role !== 'cooldown' ? { layers: mv.layers.slice(0, k).map((l) => l.tag) } : {}), ...(seg.minutes && !count ? { duration: Math.max(MIN_BLOCK[p.role], Math.round(Math.min(each, maxBlock(mv)) / 15) * 15) } : {}) }, mv);
  });
}

// A draft that respects the spring limit. Several candidates are built from the same request
// and the first one inside the limit wins; failing that, the one with the fewest changes.
export function draftFlow(opts) {
  const seed = opts.seed === undefined ? Date.now() : opts.seed;
  let best = null;
  for (let k = 0; k < 16; k++) {
    const flow = draftOnce({ ...opts, seed: seed + k * 7919 });
    if (flow.apparatus === 'mat') return flow;
    const changes = analyze({ flow, movements: opts.movements, studio: { props: opts.props || {}, timing: opts.timing } }).springChanges;
    if (!best || changes < best.changes) best = { flow, changes };
    if (changes <= (flow.springBudget ?? 3)) break;
  }
  return best.flow;
}
