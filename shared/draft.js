// "Draft a flow for me" — builds a starting class from the library.
// Reformer drafts are built in blocks by body section (legs, hips, arms, back, core, stretch),
// start with simple big-range leg work, save the hardest core work for late in the class, and
// keep movements that share a spring setting next to each other. Instructors edit everything afterwards.
import { LEVELS, FORMATS, sectionOf, roleOf, sameSetting, levelRange } from './vocab.js';

const RANK = Object.fromEntries(LEVELS.map((l) => [l.id, l.rank]));

export const GOALS = [
  { id: 'full_body', label: 'Full body', muscles: [] },
  { id: 'posterior_chain', label: 'Posterior chain', muscles: ['glutes', 'hamstrings', 'spinal_extensors', 'upper_back'] },
  { id: 'core', label: 'Core', muscles: ['abdominals', 'obliques'] },
  { id: 'mobility', label: 'Mobility', muscles: [], purpose: ['flexibility', 'mobility'], maxIntensity: 5 },
  { id: 'prenatal', label: 'Prenatal', muscles: ['glutes', 'upper_back'], avoid: ['pregnancy', 'pregnancy_early'], maxIntensity: 6 },
  { id: 'rehab', label: 'Rehab-friendly', muscles: [], purpose: ['mobility', 'stability'], maxIntensity: 5, label_pref: 'rehab-friendly' }
];

const REFORMER_FLOW = [
  { name: 'Warm-up: Footwork', role: 'warmup', share: 0.12, sections: ['lower'], positions: ['supine'], intensity: [1, 4], prefer: 'warm-up', bpm: 95 },
  { name: 'Hips & Hamstrings', role: 'build', share: 0.14, sections: ['pelvic'], positions: ['supine'], intensity: [2, 7], bpm: 100 },
  { name: 'Standing Legs', role: 'build', share: 0.15, sections: ['lower'], positions: ['standing', 'kneeling', 'quadruped'], intensity: [3, 8], bpm: 108 },
  { name: 'Side-lying Hips', role: 'build', share: 0.09, sections: ['pelvic', 'lower'], positions: ['side-lying'], intensity: [2, 7], bpm: 104 },
  { name: 'Arms & Chest', role: 'build', share: 0.11, sections: ['chest_arms', 'single_arm'], intensity: [2, 7], bpm: 104 },
  { name: 'Back & Shoulders', role: 'build', share: 0.11, sections: ['back_shoulders'], intensity: [2, 8], spine: 'extension', bpm: 104 },
  { name: 'Core', role: 'peak', share: 0.18, sections: ['core'], intensity: [4, 10], bpm: 112 },
  { name: 'Stretch', role: 'cooldown', share: 0.1, sections: ['stretch'], intensity: [1, 4], prefer: 'cool-down', bpm: 80 }
];

const REFORMER_FIT = [
  { name: 'Warm-up: Footwork', role: 'warmup', share: 0.11, sections: ['lower'], positions: ['supine'], intensity: [1, 4], prefer: 'warm-up', bpm: 100 },
  { name: 'Jump Board', role: 'build', share: 0.14, sections: ['cardio'], intensity: [4, 10], bpm: 128 },
  { name: 'Standing Legs', role: 'build', share: 0.15, sections: ['lower'], positions: ['standing', 'kneeling', 'quadruped'], intensity: [4, 9], bpm: 116 },
  { name: 'Hips', role: 'build', share: 0.1, sections: ['pelvic'], positions: ['side-lying'], intensity: [2, 7], bpm: 104 },
  { name: 'Arms & Chest', role: 'build', share: 0.12, sections: ['chest_arms', 'single_arm'], intensity: [3, 8], bpm: 112 },
  { name: 'Back & Shoulders', role: 'build', share: 0.11, sections: ['back_shoulders'], intensity: [3, 8], spine: 'extension', bpm: 112 },
  { name: 'Core', role: 'peak', share: 0.17, sections: ['core'], intensity: [5, 10], bpm: 120 },
  { name: 'Stretch', role: 'cooldown', share: 0.1, sections: ['stretch'], intensity: [1, 4], prefer: 'cool-down', bpm: 80 }
];

const MAT_TEMPLATE = [
  { name: 'Mobilise', role: 'warmup', share: 0.14, sections: ['stretch', 'pelvic', 'core'], intensity: [1, 3], prefer: 'warm-up', bpm: 90 },
  { name: 'Core on the Back', role: 'build', share: 0.18, sections: ['core'], positions: ['supine', 'seated'], intensity: [2, 8], bpm: 100 },
  { name: 'Hips & Side Body', role: 'build', share: 0.15, sections: ['pelvic', 'lower'], intensity: [2, 7], bpm: 104 },
  { name: 'Planks & Peak', role: 'peak', share: 0.16, sections: ['core'], positions: ['plank', 'quadruped', 'seated', 'standing'], intensity: [4, 10], bpm: 112 },
  { name: 'Back Body', role: 'build', share: 0.13, sections: ['back_shoulders'], intensity: [2, 8], spine: 'extension', bpm: 100 },
  { name: 'Arms & Standing', role: 'build', share: 0.1, sections: ['chest_arms', 'lower', 'pelvic'], positions: ['standing', 'kneeling'], intensity: [2, 7], bpm: 100 },
  { name: 'Wind Down', role: 'cooldown', share: 0.14, sections: ['stretch'], intensity: [1, 3], prefer: 'cool-down', bpm: 80 }
];

export const TEMPLATES = { reformer: REFORMER_FLOW, reformer_fit: REFORMER_FIT, mat: MAT_TEMPLATE };

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

export function draftFlow({ movements, goal = 'full_body', apparatus = 'reformer', format = 'flow', lengthMin = 50, level = 'intermediate', props = {}, clientTags = [], seed = Date.now() }) {
  const g = GOALS.find((x) => x.id === goal) || GOALS[0];
  const rand = rng(seed);
  const fmt = FORMATS.find((f) => f.id === format) || FORMATS[0];
  const useFit = apparatus !== 'mat' && fmt.id === 'fit' && Number(props.jump_board) > 0 && goal !== 'prenatal' && goal !== 'rehab';
  const template = apparatus === 'mat' ? MAT_TEMPLATE : useFit ? REFORMER_FIT : REFORMER_FLOW;
  const avoid = new Set(g.avoid || []);
  const prefer = new Set(clientTags || []);
  const maxLevel = goal === 'rehab' ? 1 : goal === 'prenatal' ? Math.max(2, RANK[level] || 2) : (RANK[level] || 2);
  const used = new Set();
  const pool = Object.values(movements).filter((mv) => {
    if (apparatus !== 'mixed' && mv.apparatus !== apparatus) return false;
    if ((RANK[mv.level] || 1) > maxLevel) return false;
    if ((mv.equipment || []).some((e) => !(Number(props[e]) > 0))) return false;
    if ((mv.cautions || []).some((c) => avoid.has(c.tag) && c.severity !== 'modify')) return false;
    if (g.maxIntensity && (mv.intensity || 3) > g.maxIntensity) return false;
    return true;
  });
  const prenatal = g.id === 'prenatal';
  // Prenatal plans keep time flat on the back to the short warm-up only.
  const fits = (mv, tpl) => (!tpl.sections || tpl.sections.includes(sectionOf(mv)))
    && (!tpl.positions || (prenatal && tpl.role !== 'warmup') || tpl.positions.includes(mv.position))
    && !(prenatal && tpl.role !== 'warmup' && (mv.pregnancy === 'supine' || mv.position === 'supine' || mv.position === 'prone'));

  const totalSec = lengthMin * 60 * 0.9; // leave room for transitions
  let lastKeys = [];
  const segments = template.map((tpl) => {
    const budget = totalSec * tpl.share;
    const items = [];
    let filled = 0;
    const incoming = lastKeys;
    const scored = () => pool
      .filter((mv) => !used.has(mv.slug) && fits(mv, tpl))
      // prefer movements that can stay on the springs already set
      .map((mv) => ({ mv, s: score(mv, tpl, g, RANK[level] || 2) + rand() * 1.5 - flagged(mv, prefer) * 6 + (lastKeys.length && shares(mv, lastKeys) ? 5 : mv.load?.flexible ? 2 : 0) }))
      .sort((a, b) => b.s - a.s);
    let guard = 0;
    while (filled < budget * 0.8 && guard++ < 8) {
      const next = scored()[0];
      if (!next) break;
      const dur = next.mv.duration || 120;
      if (items.length && filled + dur > budget * 1.35) break;
      used.add(next.mv.slug);
      items.push({ id: newId(), slug: next.mv.slug });
      filled += dur;
      if (next.mv.load && !next.mv.load.flexible) lastKeys = optionKeys(next.mv);
    }
    // Order the block so movements that share a spring setting sit together, starting with
    // whatever is already on the machine. Warm-ups and cool-downs simply go easiest first.
    let ordered;
    if (tpl.role === 'cooldown' || tpl.role === 'warmup') {
      ordered = [...items].sort((a, b) => (movements[a.slug].intensity || 0) - (movements[b.slug].intensity || 0));
    } else {
      const r = orderBySprings(items, movements, incoming);
      ordered = r.ordered;
      lastKeys = r.keys;
    }
    items.length = 0; items.push(...ordered);
    return { id: newId('s'), name: tpl.name, role: tpl.role, bpm: tpl.bpm, song: '', items, _tpl: tpl, _budget: budget };
  }).filter((s) => s.items.length);

  // If a block found nothing to offer, share its time among the others.
  const kept = segments.reduce((a, s) => a + s._budget, 0) || 1;
  for (const s of segments) s._budget *= totalSec / kept;

  // Make sure the spine moves in all four directions if the library allows it.
  const covered = (dir) => segments.some((s) => s.items.some((i) => spineDirs(movements[i.slug]).includes(dir)));
  for (const dir of ['rotation', 'side-bend', 'extension', 'flexion']) {
    if (covered(dir)) continue;
    const order = [...segments].sort((a, b) => (b._tpl.role === 'cooldown') - (a._tpl.role === 'cooldown') || (b._tpl.role === 'build') - (a._tpl.role === 'build'));
    let placed = false;
    for (const strict of [true, false]) {
      for (const seg of order) {
        const cand = pool.filter((mv) => !used.has(mv.slug) && (strict ? fits(mv, seg._tpl) : (!seg._tpl.sections || seg._tpl.sections.includes(sectionOf(mv)))) && spineDirs(mv).includes(dir))
          .map((mv) => ({ mv, s: score(mv, seg._tpl, g) + (mv.load?.flexible || !mv.load || seg.items.some((i) => shares(mv, optionKeys(movements[i.slug]))) ? 5 : 0) }))
          .sort((a, b) => b.s - a.s)[0]?.mv;
        if (cand) { used.add(cand.slug); seg.items.push({ id: newId(), slug: cand.slug }); placed = true; break; }
      }
      if (placed) break;
    }
  }

  // Lead-ins first: inside a block, a movement goes after any of its preparation movements.
  for (const seg of segments) {
    seg.items.sort((a, b) => {
      const A = movements[a.slug]; const B = movements[b.slug];
      if ((A.prep || []).includes(b.slug)) return 1;
      if ((B.prep || []).includes(a.slug)) return -1;
      return 0;
    });
  }

  // Stretch or shrink movement times so each segment fills its share of the class.
  for (const seg of segments) {
    const base = seg.items.reduce((a, i) => a + (movements[i.slug].duration || 120), 0);
    const factor = Math.min(2.5, Math.max(0.7, seg._budget / base));
    for (const i of seg.items) {
      const d = Math.round(((movements[i.slug].duration || 120) * factor) / 30) * 30;
      if (d !== movements[i.slug].duration) i.duration = Math.max(30, d);
    }
    delete seg._tpl; delete seg._budget;
  }

  const kind = apparatus === 'mat' ? 'Mat' : apparatus === 'mixed' ? 'Mixed' : useFit ? 'Reformer Fit' : 'Reformer Flow';
  return {
    title: `${g.label} — ${kind} ${lengthMin} min`,
    apparatus, level, lengthMin, goal,
    format: apparatus === 'mat' ? 'open' : useFit ? 'fit' : 'flow',
    springBudget: apparatus === 'mat' ? 6 : fmt.springBudget,
    target: goal === 'prenatal' ? 'prenatal' : goal === 'core' ? 'core-glutes' : 'general',
    segments
  };
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
  return segments;
}

function score(mv, tpl, g, classRank) {
  let s = 0;
  if (classRank) { const [from, to] = levelRange(mv); if (classRank >= from && classRank <= to) s += 1.5; else if (to < classRank) s -= (classRank - to) * 1.5; }
  const [lo, hi] = tpl.intensity;
  const i = mv.intensity || 3;
  s += i >= lo && i <= hi ? 3 : -Math.min(Math.abs(i - lo), Math.abs(i - hi));
  if (tpl.role === 'peak') s += i / 2;
  if (tpl.prefer && (mv.labels || []).includes(tpl.prefer)) s += 3;
  if (tpl.sections && tpl.sections[0] === sectionOf(mv)) s += 1;
  if (tpl.spine && (mv.spine || []).includes(tpl.spine)) s += 2.5;
  const prim = mv.muscles.primary || [];
  s += prim.filter((m) => g.muscles.includes(m)).length * 1.5;
  for (const p of g.purpose || []) s += (mv.purpose?.[p] || 0) * 0.8;
  if (g.label_pref && (mv.labels || []).includes(g.label_pref)) s += 2;
  if (g.id === 'prenatal' && mv.pregnancy === 'recommended') s += 3;
  if (g.id === 'prenatal' && mv.pregnancy === 'supine') s -= 3;
  if (tpl.role === 'cooldown') s += (mv.purpose?.flexibility || 0);
  if (tpl.role === 'warmup' && roleOf(mv) !== 'stability') s += 0.5;
  return s;
}
