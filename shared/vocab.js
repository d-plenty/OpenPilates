// OpenPilates shared vocabulary — used by the server, the web app and the analysis.
// Keep ids stable: movement files and saved flows refer to them.

export const POSITIONS = [
  { id: 'standing', label: 'Standing', color: '#7A4FA0' },
  { id: 'supine', label: 'Supine', color: '#0F6E62' },
  { id: 'side-lying', label: 'Side-lying', color: '#5E8F86' },
  { id: 'quadruped', label: 'Quadruped', color: '#9C5B7A' },
  { id: 'kneeling', label: 'Kneeling', color: '#B4651F' },
  { id: 'plank', label: 'Plank', color: '#3E6FA0' },
  { id: 'prone', label: 'Prone', color: '#2F4A3F' },
  { id: 'seated', label: 'Seated', color: '#8A6D1F' },
  { id: 'inverted', label: 'Inverted', color: '#56625C' }
];

export const SPINE = [
  { id: 'flexion', label: 'Flexion' },
  { id: 'extension', label: 'Extension' },
  { id: 'rotation', label: 'Rotation' },
  { id: 'side-bend', label: 'Side bend' },
  { id: 'articulation', label: 'Articulation' },
  { id: 'neutral', label: 'Neutral' }
];

// The four directions used for the spine-balance chart.
export const SPINE_DIRECTIONS = ['flexion', 'extension', 'rotation', 'side-bend'];

export const DEFAULT_TARGETS = {
  general: { label: 'General', flexion: 50, extension: 25, rotation: 12, 'side-bend': 13 },
  'core-glutes': { label: 'Core & glutes', flexion: 55, extension: 20, rotation: 13, 'side-bend': 12 },
  prenatal: { label: 'Prenatal', flexion: 35, extension: 30, rotation: 15, 'side-bend': 20 }
};

// side: F = front of body, B = back of body
export const MUSCLES = [
  { id: 'abdominals', label: 'Abdominals', side: 'F' },
  { id: 'obliques', label: 'Obliques', side: 'F' },
  { id: 'hip_flexors', label: 'Hip flexors', side: 'F' },
  { id: 'quadriceps', label: 'Quadriceps', side: 'F' },
  { id: 'adductors', label: 'Adductors (inner thigh)', side: 'F' },
  { id: 'chest', label: 'Chest', side: 'F' },
  { id: 'biceps', label: 'Biceps', side: 'F' },
  { id: 'serratus', label: 'Serratus anterior', side: 'F' },
  { id: 'deltoids', label: 'Shoulders (deltoids)', side: 'F' },
  { id: 'spinal_extensors', label: 'Spinal extensors', side: 'B' },
  { id: 'upper_back', label: 'Upper back', side: 'B' },
  { id: 'lats', label: 'Lats', side: 'B' },
  { id: 'triceps', label: 'Triceps', side: 'B' },
  { id: 'glutes', label: 'Glutes', side: 'B' },
  { id: 'abductors', label: 'Abductors (outer hip)', side: 'B' },
  { id: 'hamstrings', label: 'Hamstrings', side: 'B' },
  { id: 'calves', label: 'Calves', side: 'B' }
];

export const REGIONS = [
  { id: 'core', label: 'Core', muscles: ['abdominals', 'obliques', 'spinal_extensors'] },
  { id: 'lower', label: 'Lower body', muscles: ['glutes', 'hamstrings', 'quadriceps', 'adductors', 'abductors', 'calves', 'hip_flexors'] },
  { id: 'upper', label: 'Upper body', muscles: ['deltoids', 'chest', 'upper_back', 'lats', 'triceps', 'biceps', 'serratus'] }
];

export const PATTERNS = [
  { id: 'flexion', label: 'Flexion' }, { id: 'extension', label: 'Extension' }, { id: 'rotation', label: 'Rotation' },
  { id: 'lateral-flexion', label: 'Lateral flexion' }, { id: 'spinal-articulation', label: 'Spinal articulation' },
  { id: 'stabilisation', label: 'Stabilisation' }, { id: 'abduction', label: 'Abduction' }, { id: 'adduction', label: 'Adduction' },
  { id: 'hip-dissociation', label: 'Hip dissociation' }, { id: 'coordination', label: 'Coordination' }, { id: 'push', label: 'Push' }, { id: 'pull', label: 'Pull' }
];

export const PLANES = [
  { id: 'sagittal', label: 'Sagittal (forward/back)' },
  { id: 'frontal', label: 'Frontal (side)' },
  { id: 'transverse', label: 'Transverse (twist)' }
];

export const EQUIPMENT = [
  { id: 'long_box', label: 'Long box' },
  { id: 'short_box', label: 'Short box' },
  { id: 'jump_board', label: 'Jump board' },
  { id: 'platform_extender', label: 'Platform extender' },
  { id: 'magic_circle', label: 'Magic circle' },
  { id: 'loop_band', label: 'Loop band' },
  { id: 'resistance_band', label: 'Resistance band' },
  { id: 'small_ball', label: 'Small ball' },
  { id: 'hand_weights', label: 'Hand weights' },
  { id: 'ankle_weights', label: 'Ankle weights' },
  { id: 'sliders', label: 'Sliders' },
  { id: 'foam_roller', label: 'Foam roller' }
];

export const APPARATUS = [
  { id: 'reformer', label: 'Reformer' },
  { id: 'mat', label: 'Mat' }
];

export const LEVELS = [
  { id: 'beginner', label: 'Beginner', rank: 1 },
  { id: 'intermediate', label: 'Intermediate', rank: 2 },
  { id: 'advanced', label: 'Advanced', rank: 3 }
];

export const PURPOSES = [
  { id: 'strength', label: 'Strength', color: '#0F6E62' },
  { id: 'stability', label: 'Stability / control', color: '#3E6FA0' },
  { id: 'flexibility', label: 'Flexibility', color: '#B4651F' },
  { id: 'mobility', label: 'Mobility / rehab', color: '#7A4FA0' }
];

// Caution tags shared by movements and clients. A client tagged "knee" is checked
// against every movement that carries a "knee" caution.
export const CAUTIONS = [
  { id: 'pregnancy', label: 'Pregnancy (after 12 weeks)' },
  { id: 'pregnancy_early', label: 'Pregnancy (first 12 weeks)' },
  { id: 'knee', label: 'Knee pain / replacement' },
  { id: 'hip_replacement', label: 'Hip replacement' },
  { id: 'hip_pain', label: 'Hip pain (arthritis, bursitis, labrum)' },
  { id: 'groin', label: 'Groin / inner-thigh strain' },
  { id: 'si_joint', label: 'SI joint / pelvic instability' },
  { id: 'wrist', label: 'Wrist pain' },
  { id: 'shoulder', label: 'Shoulder pain / instability' },
  { id: 'neck', label: 'Neck pain' },
  { id: 'low_bone_density', label: 'Low bone density' },
  { id: 'extension_pain', label: 'Pain arching the back (stenosis, spondylolisthesis)' },
  { id: 'flexion_pain', label: 'Pain rounding the back (disc issues)' },
  { id: 'balance', label: 'Balance concerns' }
];

// How strongly a caution applies. "modify" = teach it with the noted change; "avoid" = swap it out.
export const SEVERITIES = [
  { id: 'avoid', label: 'Avoid — swap it' },
  { id: 'modify', label: 'Modify — adjust it' }
];

// Where a movement sits in a reformer class. Used to check the whole body gets worked.
export const SECTIONS = [
  { id: 'lower', label: 'Legs & glutes', group: 'lower' },
  { id: 'pelvic', label: 'Hips & pelvic stability', group: 'lower' },
  { id: 'cardio', label: 'Jump board', group: 'lower' },
  { id: 'back_shoulders', label: 'Back & shoulders', group: 'upper' },
  { id: 'single_arm', label: 'Single-arm work', group: 'upper' },
  { id: 'chest_arms', label: 'Chest & arms', group: 'upper' },
  { id: 'core', label: 'Core', group: 'core' },
  { id: 'stretch', label: 'Stretch & mobility', group: 'stretch' }
];

export const SECTION_GROUPS = [
  { id: 'lower', label: 'Lower body', color: '#0F6E62' },
  { id: 'upper', label: 'Upper body', color: '#3E6FA0' },
  { id: 'core', label: 'Core', color: '#B4651F' },
  { id: 'stretch', label: 'Stretch & relief', color: '#7A4FA0' }
];

// Movement categories for the class-balance check: what the trunk and hips do, plus
// a few whole-body positions. A rounded class touches most of them.
export const CATEGORIES = [
  { id: 'trunk_flexion', label: 'Trunk flexion' },
  { id: 'trunk_extension', label: 'Trunk extension' },
  { id: 'lateral_flexion', label: 'Side bend' },
  { id: 'rotation', label: 'Rotation' },
  { id: 'upper_body', label: 'Upper body' },
  { id: 'hip_flexion', label: 'Hip flexion' },
  { id: 'hip_extension', label: 'Hip extension' },
  { id: 'hip_abduction', label: 'Hip abduction' },
  { id: 'hip_adduction', label: 'Hip adduction' },
  { id: 'quadruped', label: 'Hands & knees / plank' },
  { id: 'standing', label: 'Standing' }
];

// Does the movement mainly ask the body to hold still against load, or to move through range?
export const ROLES = [
  { id: 'stability', label: 'Stability' },
  { id: 'mobility', label: 'Mobility' },
  { id: 'both', label: 'Both' }
];

export const PREGNANCY = [
  { id: 'ok', label: 'No special note' },
  { id: 'recommended', label: 'Good option in pregnancy' },
  { id: 'supine', label: 'On the back — keep it short' },
  { id: 'early_only', label: 'First 12 weeks only' },
  { id: 'avoid', label: 'Not in pregnancy' }
];

export const HEADREST = [
  { id: 'any', label: 'Either' }, { id: 'up', label: 'Up' }, { id: 'down', label: 'Down' }
];

export const STRAPS = [
  { id: 'none', label: 'Not used' }, { id: 'short', label: 'Short loops' }, { id: 'long', label: 'Long loops' }
];

export const FORMATS = [
  { id: 'flow', label: 'Flow', springBudget: 3, note: 'Movements run into each other with very few spring changes.' },
  { id: 'fit', label: 'Fit / cardio', springBudget: 3, note: 'Faster, compound movements with jump-board intervals.' },
  { id: 'open', label: 'Open', springBudget: 6, note: 'No particular format.' }
];

export const SEGMENT_ROLES = [
  { id: 'warmup', label: 'Warm-up' },
  { id: 'build', label: 'Build' },
  { id: 'peak', label: 'Peak' },
  { id: 'cooldown', label: 'Cool-down' }
];

// Spring loads are stored as levels and shown in each brand's colours.
// Source: published brand charts (Balanced Body, Merrithew, Peak, BASI, Align-Pilates, Flexia).
// Conversions between brands are approximate — studios can override names and colours in Studio settings.
export const LOAD_LEVELS = ['xlight', 'light', 'medium', 'heavy', 'xheavy'];

export const BRANDS = {
  balanced_body: { label: 'Balanced Body', springs: {
    xlight: { name: 'Yellow', short: 'Y', color: '#E3BC2C' }, light: { name: 'Blue', short: 'B', color: '#3B78C2' },
    medium: { name: 'Red', short: 'R', color: '#D9473F' }, heavy: { name: 'Green', short: 'G', color: '#3E9A4D' } },
    standard: { medium: 3, light: 1, xlight: 1 } },
  merrithew: { label: 'Merrithew (Stott)', springs: {
    light: { name: 'White', short: 'W', color: '#E9ECEB' }, medium: { name: 'Blue', short: 'B', color: '#3B78C2' },
    heavy: { name: 'Red', short: 'R', color: '#D9473F' }, xheavy: { name: 'Black', short: 'K', color: '#222222' } },
    standard: { heavy: 3, medium: 1, light: 1 } },
  peak: { label: 'Peak Pilates', springs: {
    light: { name: 'Blue', short: 'B', color: '#3B78C2' }, medium: { name: 'Yellow', short: 'Y', color: '#E3BC2C' },
    heavy: { name: 'Red', short: 'R', color: '#D9473F' } },
    standard: { heavy: 1, medium: 2, light: 2 } },
  basi: { label: 'BASI', springs: {
    light: { name: 'Yellow', short: 'Y', color: '#E3BC2C' }, medium: { name: 'Blue', short: 'B', color: '#3B78C2' },
    heavy: { name: 'Red', short: 'R', color: '#D9473F' } },
    standard: { heavy: 2, medium: 1, light: 1 } },
  align: { label: 'Align-Pilates', springs: {
    xlight: { name: 'Yellow', short: 'Y', color: '#E3BC2C' }, light: { name: 'Blue', short: 'B', color: '#3B78C2' },
    medium: { name: 'Red', short: 'R', color: '#D9473F' }, heavy: { name: 'Green', short: 'G', color: '#3E9A4D' } },
    standard: { heavy: 1, medium: 2, light: 2 } },
  flexia: { label: 'Flexia', springs: {
    xlight: { name: 'White', short: 'W', color: '#E9ECEB' }, light: { name: 'Orange', short: 'O', color: '#E08A2E' },
    medium: { name: 'Blue', short: 'B', color: '#3B78C2' }, heavy: { name: 'Black', short: 'K', color: '#222222' } },
    standard: { heavy: 2, medium: 2, light: 1 } },
  classical: { label: 'Classical (Gratz etc.)', springs: {
    heavy: { name: 'Spring', short: 'S', color: '#9AA39F' } },
    standard: { heavy: 4 } },
  custom: { label: 'Other / custom', springs: {
    xlight: { name: 'Extra light', short: 'XL', color: '#E3BC2C' }, light: { name: 'Light', short: 'L', color: '#3B78C2' },
    medium: { name: 'Medium', short: 'M', color: '#D9473F' }, heavy: { name: 'Heavy', short: 'H', color: '#3E9A4D' },
    xheavy: { name: 'Extra heavy', short: 'XH', color: '#222222' } },
    standard: { medium: 3, light: 1, xlight: 1 } }
};

// Find the closest spring a brand has for a load level.
export function springFor(brandId, level, overrides) {
  const brand = BRANDS[brandId] || BRANDS.balanced_body;
  const table = { ...brand.springs, ...(overrides || {}) };
  if (table[level]) return { level, ...table[level], approx: false };
  const i = LOAD_LEVELS.indexOf(level);
  for (let d = 1; d < LOAD_LEVELS.length; d++) {
    for (const j of [i - d, i + d]) {
      const l = LOAD_LEVELS[j];
      if (l && table[l]) return { level: l, ...table[l], approx: true };
    }
  }
  return { level, name: level, short: '?', color: '#9AA39F', approx: true };
}

// "1R 1B" style label for a list of load levels.
export function springLabel(brandId, loads, overrides) {
  if (!loads || !loads.length) return 'No springs';
  const counts = new Map();
  for (const l of loads) {
    const s = springFor(brandId, l, overrides);
    const key = s.short;
    counts.set(key, (counts.get(key) || 0) + 1);
  }
  return [...counts.entries()].map(([k, n]) => `${n}${k}`).join(' ');
}

export const byId = (list) => Object.fromEntries(list.map((x) => [x.id, x]));
export const labelOf = (list, id) => (list.find((x) => x.id === id) || { label: id }).label;

const SECTION_IDS = new Set(SECTIONS.map((x) => x.id));

// Section, categories and role fall back to a best guess when a movement doesn't state them
// (older library files, mat work and custom movements).
export function sectionOf(mv) {
  if (!mv) return 'core';
  if (SECTION_IDS.has(mv.section)) return mv.section;
  const prim = mv.muscles?.primary || [];
  const purpose = mv.purpose || {};
  if ((mv.equipment || []).includes('jump_board')) return 'cardio';
  if ((purpose.flexibility || 0) >= 2 && (purpose.strength || 0) <= 1) return 'stretch';
  const hit = (ids) => prim.filter((m) => ids.includes(m)).length;
  const core = hit(['abdominals', 'obliques']);
  const lower = hit(['glutes', 'hamstrings', 'quadriceps', 'adductors', 'abductors', 'calves', 'hip_flexors']);
  const back = hit(['upper_back', 'lats', 'spinal_extensors']);
  const arms = hit(['chest', 'biceps', 'triceps', 'deltoids', 'serratus']);
  const best = Math.max(core, lower, back, arms);
  if (best === 0) return 'core';
  if (core === best) return 'core';
  if (lower === best) return 'lower';
  if (back === best) return 'back_shoulders';
  return 'chest_arms';
}

export const sectionGroupOf = (mv) => (SECTIONS.find((s) => s.id === sectionOf(mv)) || { group: 'core' }).group;

const CATEGORY_IDS = new Set(CATEGORIES.map((x) => x.id));
export function categoriesOf(mv) {
  if (!mv) return [];
  if (Array.isArray(mv.categories) && mv.categories.length) return mv.categories.filter((c) => CATEGORY_IDS.has(c));
  const out = new Set();
  const spine = mv.spine || [];
  const pat = mv.patterns || [];
  const prim = mv.muscles?.primary || [];
  if (spine.includes('flexion') || spine.includes('articulation')) out.add('trunk_flexion');
  if (spine.includes('extension')) out.add('trunk_extension');
  if (spine.includes('side-bend')) out.add('lateral_flexion');
  if (spine.includes('rotation')) out.add('rotation');
  if (prim.some((m) => ['upper_back', 'lats', 'chest', 'biceps', 'triceps', 'deltoids', 'serratus'].includes(m))) out.add('upper_body');
  if (prim.includes('hip_flexors')) out.add('hip_flexion');
  if (prim.includes('glutes') || prim.includes('hamstrings')) out.add('hip_extension');
  if (prim.includes('abductors') || pat.includes('abduction')) out.add('hip_abduction');
  if (prim.includes('adductors') || pat.includes('adduction')) out.add('hip_adduction');
  if (mv.position === 'quadruped' || mv.position === 'plank') out.add('quadruped');
  if (mv.position === 'standing') out.add('standing');
  return [...out];
}

export function roleOf(mv) {
  if (!mv) return 'both';
  if (['stability', 'mobility', 'both'].includes(mv.role)) return mv.role;
  const p = mv.purpose || {};
  const move = (p.flexibility || 0) + (p.mobility || 0);
  const hold = (p.strength || 0) + (p.stability || 0);
  if (move > hold) return 'mobility';
  if (hold > move + 1) return 'stability';
  return 'both';
}

// Spring settings a movement can be taught on without stopping to change: its usual
// setting and its harder option.
export function springOptions(mv, item) {
  if (!mv || mv.apparatus !== 'reformer') return [];
  const key = (l) => [...(l || [])].sort().join('+');
  if (item && item.load && Array.isArray(item.load.springs)) return [key(item.load.springs)];
  const v = variationOf(mv, item);
  if (v && v.springs && v.springs.length) return [key(v.springs)];
  const out = [key(mv.load?.springs)];
  if (mv.load?.advance && mv.load.advance.length) out.push(key(mv.load.advance));
  return [...new Set(out)];
}

// Two spring settings count as the same working load when they match, or when the only
// difference is one extra-light spring on or off — you'd teach through that without stopping.
export function sameSetting(a, b) {
  const x = [...(a || [])].sort(); const y = [...(b || [])].sort();
  if (x.join('+') === y.join('+')) return true;
  const [long, short] = x.length > y.length ? [x, y] : [y, x];
  if (long.length !== short.length + 1) return false;
  const rest = [...long];
  for (const l of short) { const i = rest.indexOf(l); if (i < 0) return false; rest.splice(i, 1); }
  return rest.length === 1 && rest[0] === 'xlight';
}

// ---- levels. A movement suits a range of levels: `level` is where it starts, `levelTo` where it tops out.
const LEVEL_RANK = Object.fromEntries(LEVELS.map((l) => [l.id, l.rank]));
export function levelRange(mv) {
  const from = LEVEL_RANK[mv && mv.level] || 1;
  const to = Math.max(from, LEVEL_RANK[mv && mv.levelTo] || from);
  return [from, to];
}
export function levelsOf(mv) {
  const [from, to] = levelRange(mv);
  return LEVELS.filter((l) => l.rank >= from && l.rank <= to).map((l) => l.id);
}
export function levelLabel(mv) {
  const [from, to] = levelRange(mv);
  const name = (r) => LEVELS.find((l) => l.rank === r).label;
  if (from === 1 && to === 3) return 'All levels';
  return from === to ? name(from) : `${name(from)}–${name(to)}`;
}
// ---- variations. A variation is another version of a movement: a regression (simpler),
// a progression (harder), or just a different version (one arm instead of two).
export const OPTION_KINDS = [
  { id: 'regression', label: 'Regression', mark: '▼', hint: 'Simpler or more supported' },
  { id: 'progression', label: 'Progression', mark: '▲', hint: 'Harder' },
  { id: 'variation', label: 'Variation', mark: '◆', hint: 'A different version, such as single arm' }
];
export const kindOf = (k) => (k === 'easier' || k === 'regression' ? 'regression' : k === 'variation' ? 'variation' : 'progression');
export const variationsOf = (mv) => (mv && Array.isArray(mv.variations) ? mv.variations : []);
// The version of the movement a flow item is taught as (by name), if one was picked.
export function variationOf(mv, item) {
  if (!item || !item.variation) return null;
  return variationsOf(mv).find((v) => v.name === item.variation) || null;
}
export const itemName = (mv, item) => (mv ? mv.name + (item && item.variation ? ` · ${item.variation}` : '') : '');
// Every name a movement goes by, for search.
export const namesOf = (mv) => [mv.name, ...(mv.aka || [])];

// ---- the studio's own springs. A room lists how many of each spring its reformers have.
// A setting is re-written in springs that room really has: a missing spring becomes the nearest one.
export function fitSprings(loads, room) {
  const have = room && room.springs ? room.springs : null;
  const list = [...(loads || [])];
  if (!have || !Object.keys(have).length) return { loads: list, approx: false, short: false };
  const present = LOAD_LEVELS.filter((l) => Number(have[l]) > 0);
  if (!present.length) return { loads: list, approx: false, short: false };
  let approx = false;
  const out = list.map((l) => {
    if (Number(have[l]) > 0) return l;
    approx = true;
    const i = LOAD_LEVELS.indexOf(l);
    return present.slice().sort((a, b) => Math.abs(LOAD_LEVELS.indexOf(a) - i) - Math.abs(LOAD_LEVELS.indexOf(b) - i) || LOAD_LEVELS.indexOf(a) - LOAD_LEVELS.indexOf(b))[0];
  });
  const counts = {};
  for (const l of out) counts[l] = (counts[l] || 0) + 1;
  const short = Object.entries(counts).some(([l, n]) => n > Number(have[l] || 0));
  return { loads: out, approx, short };
}
// Rough total load of a setting, for ordering lightest to heaviest.
const LOAD_WEIGHT = { xlight: 1, light: 2, medium: 4, heavy: 6, xheavy: 7 };
export const loadWeight = (loads) => (loads || []).reduce((n, l) => n + (LOAD_WEIGHT[l] || 0), 0);
