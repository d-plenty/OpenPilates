// "Draft a flow for me" — builds a starting class from the library.
// Structure follows a common class shape: warm-up, supine core, side body, plank & peak,
// back body, seated, cool-down. Instructors edit everything afterwards.
import { LEVELS } from './vocab.js';

const RANK = Object.fromEntries(LEVELS.map((l) => [l.id, l.rank]));

export const GOALS = [
  { id: 'full_body', label: 'Full body', muscles: [] },
  { id: 'posterior_chain', label: 'Posterior chain', muscles: ['glutes', 'hamstrings', 'spinal_extensors', 'upper_back'] },
  { id: 'core', label: 'Core', muscles: ['abdominals', 'obliques'] },
  { id: 'mobility', label: 'Mobility', muscles: [], purpose: ['flexibility', 'mobility'], maxIntensity: 5 },
  { id: 'prenatal', label: 'Prenatal', muscles: ['glutes', 'upper_back'], avoid: ['pregnancy'], maxIntensity: 6 },
  { id: 'rehab', label: 'Rehab-friendly', muscles: [], purpose: ['mobility', 'stability'], maxIntensity: 5, label_pref: 'rehab-friendly' }
];

const TEMPLATES = {
  reformer: [
    { name: 'Arrive & Align', role: 'warmup', share: 0.12, positions: ['standing', 'supine'], intensity: [1, 4], prefer: 'warm-up', bpm: 90 },
    { name: 'Supine Core', role: 'build', share: 0.16, positions: ['supine'], intensity: [3, 7], bpm: 100 },
    { name: 'Side Body', role: 'build', share: 0.12, positions: ['side-lying', 'standing'], intensity: [3, 7], plane: 'frontal', bpm: 104 },
    { name: 'Plank & Peak', role: 'peak', share: 0.2, positions: ['plank', 'kneeling', 'standing'], intensity: [5, 10], bpm: 112 },
    { name: 'Back Body', role: 'build', share: 0.15, positions: ['prone', 'kneeling'], intensity: [3, 8], spine: 'extension', bpm: 104 },
    { name: 'Seated', role: 'build', share: 0.13, positions: ['seated'], intensity: [3, 7], bpm: 100 },
    { name: 'Wind Down', role: 'cooldown', share: 0.12, positions: ['seated', 'kneeling', 'standing', 'quadruped'], intensity: [1, 3], prefer: 'cool-down', bpm: 80 }
  ],
  mat: [
    { name: 'Arrive & Align', role: 'warmup', share: 0.14, positions: ['standing', 'supine', 'quadruped'], intensity: [1, 4], prefer: 'warm-up', bpm: 90 },
    { name: 'Supine Core', role: 'build', share: 0.18, positions: ['supine'], intensity: [3, 8], bpm: 100 },
    { name: 'Side Body', role: 'build', share: 0.14, positions: ['side-lying'], intensity: [3, 7], bpm: 104 },
    { name: 'Plank & Peak', role: 'peak', share: 0.16, positions: ['plank', 'seated'], intensity: [5, 10], bpm: 112 },
    { name: 'Back Body', role: 'build', share: 0.14, positions: ['prone', 'quadruped'], intensity: [2, 7], spine: 'extension', bpm: 100 },
    { name: 'Standing', role: 'build', share: 0.1, positions: ['standing', 'seated'], intensity: [2, 7], bpm: 100 },
    { name: 'Wind Down', role: 'cooldown', share: 0.14, positions: ['seated', 'kneeling', 'standing', 'quadruped'], intensity: [1, 3], prefer: 'cool-down', bpm: 80 }
  ]
};

function rng(seed) {
  let s = (seed >>> 0) || 1;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

let idCounter = 0;
export function newId(prefix = 'i') {
  idCounter = (idCounter + 1) % 1e6;
  return prefix + Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36) + idCounter.toString(36);
}

export function draftFlow({ movements, goal = 'full_body', apparatus = 'reformer', lengthMin = 50, level = 'intermediate', props = {}, clientTags = [], seed = Date.now() }) {
  const g = GOALS.find((x) => x.id === goal) || GOALS[0];
  const rand = rng(seed);
  const template = TEMPLATES[apparatus === 'mat' ? 'mat' : 'reformer'];
  const avoid = new Set(g.avoid || []);
  const prefer = new Set(clientTags || []);
  const maxLevel = goal === 'rehab' ? 1 : (RANK[level] || 2);
  const used = new Set();
  const pool = Object.values(movements).filter((mv) => {
    if (apparatus !== 'mixed' && mv.apparatus !== apparatus) return false;
    if ((RANK[mv.level] || 1) > maxLevel) return false;
    if ((mv.equipment || []).some((e) => !(Number(props[e]) > 0))) return false;
    if ((mv.cautions || []).some((c) => avoid.has(c.tag))) return false;
    if (g.maxIntensity && (mv.intensity || 3) > g.maxIntensity) return false;
    return true;
  });

  const totalSec = lengthMin * 60 * 0.88; // leave room for transitions
  const segments = template.map((tpl) => {
    const budget = totalSec * tpl.share;
    const items = [];
    let filled = 0;
    const scored = () => pool
      .filter((mv) => !used.has(mv.slug) && tpl.positions.includes(mv.position))
      .map((mv) => ({ mv, s: score(mv, tpl, g) + rand() * 1.5 - flagged(mv, prefer) * 6 }))
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
    }
    // Fewer spring changes: order heavier set-ups first within a segment.
    items.sort((a, b) => loadWeight(movements[b.slug]) - loadWeight(movements[a.slug]));
    if (tpl.role === 'cooldown' || tpl.role === 'warmup') items.sort((a, b) => (movements[a.slug].intensity || 0) - (movements[b.slug].intensity || 0));
    return { id: newId('s'), name: tpl.name, role: tpl.role, bpm: tpl.bpm, song: '', items, _tpl: tpl, _budget: budget };
  }).filter((s) => s.items.length);

  // Make sure the spine moves in all four directions if the library allows it.
  const covered = (dir) => segments.some((s) => s.items.some((i) => spineDirs(movements[i.slug]).includes(dir)));
  for (const dir of ['rotation', 'side-bend', 'extension', 'flexion']) {
    if (covered(dir)) continue;
    const order = [...segments].sort((a, b) => (b._tpl.role === 'cooldown') - (a._tpl.role === 'cooldown') || (b._tpl.role === 'build') - (a._tpl.role === 'build'));
    for (const seg of order) {
      const cand = pool.filter((mv) => !used.has(mv.slug) && seg._tpl.positions.includes(mv.position) && spineDirs(mv).includes(dir))
        .sort((a, b) => score(b, seg._tpl, g) - score(a, seg._tpl, g))[0];
      if (cand) { used.add(cand.slug); seg.items.push({ id: newId(), slug: cand.slug }); break; }
    }
  }

  // Stretch or shrink movement times so each segment fills its share of the class.
  for (const seg of segments) {
    const base = seg.items.reduce((a, i) => a + (movements[i.slug].duration || 120), 0);
    const factor = Math.min(3, Math.max(0.7, seg._budget / base));
    for (const i of seg.items) {
      const d = Math.round(((movements[i.slug].duration || 120) * factor) / 30) * 30;
      if (d !== movements[i.slug].duration) i.duration = Math.max(30, d);
    }
    delete seg._tpl; delete seg._budget;
  }

  return {
    title: `${g.label} — ${apparatus === 'mat' ? 'Mat' : apparatus === 'mixed' ? 'Mixed' : 'Reformer'} ${lengthMin} min`,
    apparatus, level, lengthMin, goal, target: goal === 'prenatal' ? 'prenatal' : goal === 'core' ? 'core-glutes' : 'general',
    segments
  };
}

// How many booked clients' cautions a movement carries (used as a penalty, not a ban,
// so group classes still get a full plan and the analysis suggests swaps).
function flagged(mv, tags) {
  if (!tags.size) return 0;
  return (mv.cautions || []).filter((c) => tags.has(c.tag)).length;
}

function spineDirs(mv) {
  return (mv?.spine || []).map((s) => (s === 'articulation' ? 'flexion' : s));
}

function loadWeight(mv) {
  if (!mv || !mv.load) return 0;
  const w = { xlight: 1, light: 2, medium: 3, heavy: 4, xheavy: 5 };
  return (mv.load.springs || []).reduce((a, l) => a + (w[l] || 0), 0);
}

function score(mv, tpl, g) {
  let s = 0;
  const [lo, hi] = tpl.intensity;
  const i = mv.intensity || 3;
  s += i >= lo && i <= hi ? 3 : -Math.min(Math.abs(i - lo), Math.abs(i - hi));
  if (tpl.role === 'peak') s += i / 2;
  if (tpl.prefer && (mv.labels || []).includes(tpl.prefer)) s += 3;
  if (tpl.spine && (mv.spine || []).includes(tpl.spine)) s += 3;
  if (tpl.plane && mv.plane === tpl.plane) s += 1.5;
  const prim = mv.muscles.primary || [];
  s += prim.filter((m) => g.muscles.includes(m)).length * 1.5;
  for (const p of g.purpose || []) s += (mv.purpose?.[p] || 0) * 0.8;
  if (g.label_pref && (mv.labels || []).includes(g.label_pref)) s += 2;
  if (tpl.role === 'cooldown') s += (mv.purpose?.flexibility || 0);
  return s;
}
