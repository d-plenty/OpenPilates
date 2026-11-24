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
// An id the lists no longer hold (a prop the studio removed) still reads as words, not as an id.
const pretty = (id) => { const s = String(id ?? '').replace(/^[pcmst]_/, '').replace(/[_-]+/g, ' ').trim(); return s ? s[0].toUpperCase() + s.slice(1) : ''; };
export const labelOf = (list, id) => (list.find((x) => x.id === id) || { label: pretty(id) }).label;

// ---- studio lists. Props and client cautions start from the built-in lists; a studio can add
// its own and remove the ones it doesn't use. The exported arrays are updated in place so every
// screen and check sees the studio's version.
export const BUILTIN = { equipment: EQUIPMENT.map((x) => ({ ...x })), cautions: CAUTIONS.map((x) => ({ ...x })), muscles: MUSCLES.map((x) => ({ ...x })), sections: SECTIONS.map((x) => ({ ...x })) };
export function studioList(builtin, custom, removed) {
  const gone = new Set(removed || []);
  const seen = new Set();
  const out = [];
  for (const x of [...builtin, ...(custom || []).map((c) => ({ ...c, id: c.id, label: c.label, custom: true }))]) {
    if (!x.id || gone.has(x.id) || seen.has(x.id)) continue;
    seen.add(x.id); out.push(x);
  }
  return out;
}
export function applyStudioLists(studio) {
  const s = studio || {};
  EQUIPMENT.splice(0, EQUIPMENT.length, ...studioList(BUILTIN.equipment, s.customProps, s.removedProps));
  CAUTIONS.splice(0, CAUTIONS.length, ...studioList(BUILTIN.cautions, s.customCautions, s.removedCautions));
  MUSCLES.splice(0, MUSCLES.length, ...studioList(BUILTIN.muscles, s.customMuscles, s.removedMuscles));
  // Parts of the class keep their ids (the balance check groups by them); a studio can rename them.
  SECTIONS.splice(0, SECTIONS.length, ...studioList(BUILTIN.sections.map((x) => ({ ...x, label: (s.sectionLabels && s.sectionLabels[x.id]) || x.label })), (s.customSections || []).map((c) => ({ group: 'core', ...c })), s.removedSections));
  // a part the studio deleted hands its movements to the part chosen when it was deleted
  for (const k of Object.keys(SECTION_MAP)) delete SECTION_MAP[k];
  Object.assign(SECTION_MAP, s.sectionMap || {});
  CLASS_LEVELS.splice(0, CLASS_LEVELS.length, ...withCoreLevels(Array.isArray(s.levels) && s.levels.length ? s.levels : DEFAULT_LEVELS).map((x) => ({ ...x })));
  FOCUSES.splice(0, FOCUSES.length, ...(Array.isArray(s.focuses) && s.focuses.length ? s.focuses : DEFAULT_FOCUSES).map((x) => ({ muscles: [], ...x })));
  Object.assign(TIMING, DEFAULT_TIMING, s.timing || {});
}
export const SECTION_MAP = {};

const SECTION_IDS = { has: (id) => SECTIONS.some((x) => x.id === id) };
// Where a movement sits once deleted parts have been followed to their new home.
const homeOf = (id) => { let x = id; for (let i = 0; i < 6 && SECTION_MAP[x]; i++) x = SECTION_MAP[x]; return SECTION_IDS.has(x) ? x : null; };

// Section, categories and role fall back to a best guess when a movement doesn't state them
// (older library files, mat work and custom movements).
export function sectionOf(mv) {
  if (!mv) return 'core';
  const home = homeOf(mv.section);
  if (home) return home;
  const guess = guessSection(mv);
  return homeOf(guess) || (SECTIONS[0] ? SECTIONS[0].id : guess);
}
export function guessSection(mv) {
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

// ---- levels. Underneath, a movement suits a range on three steps of difficulty: `level` is
// where it starts, `levelTo` where it tops out. What a studio calls its class levels is its own
// business: three levels, two overlapping ones, or its own names. Each class level covers a
// span of the three steps, and every screen shows the studio's names.
export const LEVEL_PRESETS = {
  three: { label: 'Beginner, Intermediate, Advanced', levels: [
    { id: 'beginner', label: 'Beginner', from: 1, to: 1 }, { id: 'intermediate', label: 'Intermediate', from: 2, to: 2 }, { id: 'advanced', label: 'Advanced', from: 3, to: 3 }] },
  two: { label: 'Beginner/Intermediate and Intermediate/Advanced', levels: [
    { id: 'beg_int', label: 'Beginner/Intermediate', from: 1, to: 2 }, { id: 'int_adv', label: 'Intermediate/Advanced', from: 2, to: 3 }] },
  five: { label: 'All five: Beginner, Beginner/Intermediate, Intermediate, Intermediate/Advanced, Advanced', levels: [
    { id: 'beginner', label: 'Beginner', from: 1, to: 1 }, { id: 'beg_int', label: 'Beginner/Intermediate', from: 1, to: 2 }, { id: 'intermediate', label: 'Intermediate', from: 2, to: 2 },
    { id: 'int_adv', label: 'Intermediate/Advanced', from: 2, to: 3 }, { id: 'advanced', label: 'Advanced', from: 3, to: 3 }] },
  open: { label: 'Open level and Advanced', levels: [
    { id: 'open', label: 'Open level', from: 1, to: 2 }, { id: 'advanced', label: 'Advanced', from: 3, to: 3 }] }
};
// Every studio has Beginner, Intermediate and Advanced. The three below them are common extras a studio
// can delete, and it can add its own. Each level covers a span of the three steps of difficulty.
export const CORE_LEVELS = LEVEL_PRESETS.three.levels;
export const DEFAULT_LEVELS = [...CORE_LEVELS,
  { id: 'beg_int', label: 'Beginner/Intermediate', from: 1, to: 2 }, { id: 'int_adv', label: 'Intermediate/Advanced', from: 2, to: 3 }, { id: 'open', label: 'Open level', from: 1, to: 3 }];
export const isCoreLevel = (id) => CORE_LEVELS.some((l) => l.id === id);
// A list of levels with the three core ones guaranteed, first and in order. Their names can be changed, not their place.
export function withCoreLevels(levels) {
  const list = (levels || []).filter((l) => l && l.id);
  return [...CORE_LEVELS.map((c) => ({ ...c, ...(list.find((l) => l.id === c.id) ? { label: list.find((l) => l.id === c.id).label || c.label } : {}) })), ...list.filter((l) => !isCoreLevel(l.id))];
}
// The studio's class levels. Updated in place by applyStudioLists.
export const CLASS_LEVELS = DEFAULT_LEVELS.map((x) => ({ ...x }));
// A class level by id. A level the studio no longer has (an old flow) still resolves.
export function classLevel(id) {
  const hit = CLASS_LEVELS.find((l) => l.id === id);
  if (hit) return hit;
  const gone = DEFAULT_LEVELS.find((l) => l.id === id);
  if (gone) return gone;
  for (const p of Object.values(LEVEL_PRESETS)) { const old = p.levels.find((l) => l.id === id); if (old) return old; }
  return CLASS_LEVELS[Math.min(CLASS_LEVELS.length - 1, Math.floor(CLASS_LEVELS.length / 2))];
}
// The class level a studio would start a new flow on: its middle one.
export const defaultClassLevel = () => 'intermediate';
// What a single step of difficulty is called: the studio's name if it has a level for exactly that step.
export const rankLabel = (rank) => (CLASS_LEVELS.find((l) => l.from === rank && l.to === rank) || LEVELS.find((l) => l.rank === rank) || { label: '' }).label;
const LEVEL_RANK = Object.fromEntries(LEVELS.map((l) => [l.id, l.rank]));
export function levelRange(mv) {
  const from = LEVEL_RANK[mv && mv.level] || 1;
  const to = Math.max(from, LEVEL_RANK[mv && mv.levelTo] || from);
  return [from, to];
}
// The studio's class levels a movement belongs in: any whose span overlaps the movement's range.
export function levelsOf(mv) {
  const [from, to] = levelRange(mv);
  return CLASS_LEVELS.filter((l) => l.from <= to && l.to >= from).map((l) => l.id);
}
// The movement's level in the studio's words. Beginner, Intermediate and Advanced are always
// among a studio's levels (it may rename them), so a movement reads as one of them, a range
// of them, or "All levels".
export function levelLabel(mv) {
  const [from, to] = levelRange(mv);
  const name = (rank) => {
    const core = CLASS_LEVELS.find((l) => isCoreLevel(l.id) && l.from === rank && l.to === rank);
    return core ? core.label : (LEVELS.find((l) => l.rank === rank) || {}).label || '';
  };
  if (from <= 1 && to >= 3) return 'All levels';
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

// ---- class types. A class type is the shape of a class the studio teaches: its length, level,
// spring-change limit and the phases it runs through, with minutes and what belongs in each.
// New flows start from one; drafts fill its phases. Studios edit these freely.
export const DEFAULT_CLASS_TYPES = [
  { id: 'reformer_flow', name: 'Reformer Flow', apparatus: 'reformer', lengthMin: 50, springBudget: 4, note: 'Blocks run into each other with very few spring changes.', phases: [
    { name: 'Warm-up', role: 'warmup', minutes: 5, sections: ['stretch', 'pelvic', 'core'] },
    { name: 'Footwork', role: 'warmup', minutes: 6, sections: ['lower'], positions: ['supine'] },
    { name: 'Hips & hamstrings', role: 'build', minutes: 6, sections: ['pelvic'], positions: ['supine'] },
    { name: 'Abs & arms in straps', role: 'build', minutes: 5, sections: ['core'], positions: ['supine'] },
    { name: 'Standing & kneeling legs', role: 'build', minutes: 8, sections: ['lower'], positions: ['standing', 'kneeling', 'quadruped'] },
    { name: 'Arms & back', role: 'build', minutes: 9, sections: ['chest_arms', 'back_shoulders', 'single_arm'] },
    { name: 'Core', role: 'peak', minutes: 9, sections: ['core'] },
    { name: 'Cool-down', role: 'cooldown', minutes: 7, sections: ['stretch', 'pelvic'] }] },
  { id: 'reformer_fit', name: 'Reformer Fit', apparatus: 'reformer', lengthMin: 45, springBudget: 4, note: 'Faster, with a jump-board block if the studio has boards.', phases: [
    { name: 'Footwork', role: 'warmup', minutes: 5, sections: ['lower'], positions: ['supine'] },
    { name: 'Jump board', role: 'build', minutes: 7, sections: ['cardio'] },
    { name: 'Standing legs', role: 'build', minutes: 8, sections: ['lower'], positions: ['standing', 'kneeling', 'quadruped'] },
    { name: 'Arms & back', role: 'build', minutes: 8, sections: ['chest_arms', 'back_shoulders', 'single_arm'] },
    { name: 'Core', role: 'peak', minutes: 9, sections: ['core'] },
    { name: 'Hips', role: 'build', minutes: 4, sections: ['pelvic'] },
    { name: 'Cool-down', role: 'cooldown', minutes: 4, sections: ['stretch'] }] },
  { id: 'reformer_foundations', name: 'Reformer Foundations', apparatus: 'reformer', lengthMin: 45, springBudget: 4, note: 'A first-timer class: fewer blocks, more time in each.', phases: [
    { name: 'Warm-up', role: 'warmup', minutes: 6, sections: ['stretch', 'pelvic', 'core'] },
    { name: 'Footwork', role: 'warmup', minutes: 8, sections: ['lower'], positions: ['supine'] },
    { name: 'Hips & hamstrings', role: 'build', minutes: 8, sections: ['pelvic'], positions: ['supine'] },
    { name: 'Arms', role: 'build', minutes: 8, sections: ['chest_arms', 'back_shoulders'] },
    { name: 'Core', role: 'peak', minutes: 8, sections: ['core'] },
    { name: 'Cool-down', role: 'cooldown', minutes: 7, sections: ['stretch', 'pelvic'] }] },
  { id: 'mat_flow', name: 'Mat Flow', apparatus: 'mat', lengthMin: 45, springBudget: 6, note: 'Mat class from the floor up.', phases: [
    { name: 'Mobilise', role: 'warmup', minutes: 6, sections: ['stretch', 'pelvic', 'core'] },
    { name: 'Core on the back', role: 'build', minutes: 9, sections: ['core'], positions: ['supine', 'seated'] },
    { name: 'Hips & side body', role: 'build', minutes: 8, sections: ['pelvic', 'lower'] },
    { name: 'Planks & peak', role: 'peak', minutes: 7, sections: ['core'], positions: ['plank', 'quadruped', 'seated', 'standing'] },
    { name: 'Back body', role: 'build', minutes: 6, sections: ['back_shoulders'] },
    { name: 'Standing & arms', role: 'build', minutes: 4, sections: ['chest_arms', 'lower', 'pelvic'], positions: ['standing', 'kneeling'] },
    { name: 'Wind down', role: 'cooldown', minutes: 5, sections: ['stretch'] }] }
];
export const classTypesOf = (studio) => (studio && Array.isArray(studio.classTypes) && studio.classTypes.length ? studio.classTypes : DEFAULT_CLASS_TYPES);
export const DEFAULT_LENGTHS = [30, 45, 50, 55, 60];
// Seconds the plan allows for the things that are not movement, and for building a block up.
export const DEFAULT_TIMING = { springChange: 15, positionChange: 20, boxChange: 45, perLayer: 45, finisher: 20 };
// The studio's current timing; applyStudioLists keeps it up to date so block times agree everywhere.
export const TIMING = { ...DEFAULT_TIMING };
export const timingOf = (studio) => ({ ...TIMING, ...((studio && studio.timing) || {}) });
// The timing list as the studio sees it. The five built-in rows are counted automatically (their `id` is the
// key the app works with); a studio can rename them, write a note, or switch one off. Rows a studio adds
// are timed lines an instructor can drop into a flow: a water break, a set-up change, a demo.
export const DEFAULT_TIMING_ROWS = [
  { id: 'perLayer', label: 'Each layer added to a block', note: 'Added to a movement\'s own time for every layer built on top.', seconds: 45 },
  { id: 'finisher', label: 'A finisher', note: 'Pulses or a hold to end a block.', seconds: 20 },
  { id: 'springChange', label: 'A spring change', note: 'Counted every time the springs change between blocks.', seconds: 15 },
  { id: 'positionChange', label: 'A change of position', note: 'Lying to kneeling, kneeling to standing and so on.', seconds: 20 },
  { id: 'boxChange', label: 'Box or board on or off', note: 'Counted when the next block needs the box or jump board and the last one did not.', seconds: 45 }
];
export const isBuiltinTiming = (id) => id in DEFAULT_TIMING;
export function timingRowsOf(studio) {
  const s = studio || {};
  if (Array.isArray(s.timingRows) && s.timingRows.length) return s.timingRows;
  return DEFAULT_TIMING_ROWS.map((r) => ({ ...r, seconds: s.timing && s.timing[r.id] !== undefined ? s.timing[r.id] : r.seconds }));
}
// The numbers the app counts with: each built-in row's seconds, or nothing for a row that is switched off.
export function timingFromRows(rows) {
  const out = { ...DEFAULT_TIMING };
  for (const k of Object.keys(out)) { const r = (rows || []).find((x) => x.id === k); if (r) out[k] = r.off ? 0 : Math.max(0, Number(r.seconds) || 0); }
  return out;
}
export const timedLinesOf = (studio) => timingRowsOf(studio).filter((r) => !isBuiltinTiming(r.id) && !r.off);
// Timing for one flow: the studio's, with anything its class type sets for itself on top.
export function flowTiming(studio, flow) {
  const ct = flow && classTypesOf(studio).find((c) => c.id === flow.classType);
  return { ...timingOf(studio), ...((ct && ct.timing) || {}) };
}

// ---- focuses: what a class leans towards. A studio keeps its own list; an instructor can also type one for a single flow.
// `muscles` are favoured when a class is drafted. The other fields are optional steers.
export const DEFAULT_FOCUSES = [
  { id: 'full_body', label: 'Full body', muscles: [] },
  { id: 'core', label: 'Core', muscles: ['abdominals', 'obliques'] },
  { id: 'glutes', label: 'Glutes', muscles: ['glutes', 'abductors'] },
  { id: 'lower_body', label: 'Legs & glutes', muscles: ['glutes', 'quadriceps', 'hamstrings', 'calves', 'abductors', 'adductors'] },
  { id: 'upper_body', label: 'Arms & shoulders', muscles: ['deltoids', 'upper_back', 'chest', 'triceps', 'biceps', 'lats'] },
  { id: 'back_posture', label: 'Back & posture', muscles: ['upper_back', 'spinal_extensors', 'lats'] },
  { id: 'posterior_chain', label: 'Posterior chain', muscles: ['glutes', 'hamstrings', 'spinal_extensors', 'upper_back'] },
  { id: 'mobility', label: 'Mobility', muscles: [], purpose: ['flexibility', 'mobility'], maxIntensity: 5 },
  { id: 'stretch', label: 'Stretch & release', muscles: [], purpose: ['flexibility'], maxIntensity: 4 },
  { id: 'prenatal', label: 'Prenatal', muscles: ['glutes', 'upper_back'], avoid: ['pregnancy', 'pregnancy_early'], maxIntensity: 6 },
  { id: 'rehab', label: 'Rehab-friendly', muscles: [], purpose: ['mobility', 'stability'], maxIntensity: 5, label_pref: 'rehab-friendly' }
];
export const FOCUSES = DEFAULT_FOCUSES.map((x) => ({ ...x }));
// The focus of a flow: the studio's, or the words the instructor typed for this one class.
export const focusOf = (flow) => (flow && flow.focusText) || (FOCUSES.find((x) => x.id === (flow && flow.goal)) || { label: '' }).label;

// ---- where a movement belongs in a class. Teachers set this; when a movement says nothing, a careful guess is used.
export const USES = [
  { id: 'warmup', label: 'Warm-up', hint: 'Simple, low load, gets the body moving. Offered when a warm-up is drafted.' },
  { id: 'cooldown', label: 'Cool-down', hint: 'Stretch or release to finish on. Offered when a cool-down is drafted.' },
  { id: 'peak', label: 'Peak', hint: 'The hardest work of the class. Drafts save it for the peak block.' }
];
export function usesOf(mv) {
  if (!mv) return [];
  if (Array.isArray(mv.uses)) return mv.uses;
  const labels = mv.labels || [];
  const out = [];
  if (labels.includes('warm-up')) out.push('warmup');
  if (labels.includes('cool-down')) out.push('cooldown');
  if ((mv.intensity || 0) >= 7) out.push('peak');
  return out;
}

// ---- a block: one movement in a flow, with the layers built on top and a finisher.
// A layer is either one of the movement's own layers (stored by its tag) or the teacher's own words.
export function layersOf(mv, item) {
  return ((item && item.layers) || []).map((l) => {
    if (typeof l === 'string') { const lib = ((mv && mv.layers) || []).find((x) => x.tag === l); return lib ? { tag: l, title: lib.title, text: lib.text } : null; }
    const text = String((l && l.text) || '').trim();
    return text ? { text, title: text } : null;
  }).filter(Boolean);
}
// Time for a block. A time the teacher typed wins; otherwise the movement's own time plus time for each layer and the finisher.
export function blockSeconds(item, mv, timing = TIMING) {
  const d = Number(item && item.duration);
  if (item && item.pause) return d > 0 ? d : 60; // a timed line is just its time
  if (d > 0) return d;
  const base = (mv && mv.duration) || 120;
  return base + layersOf(mv, item).length * (timing.perLayer || 0) + (item && item.finisher ? (timing.finisher || 0) : 0);
}
export const FINISHERS = ['Pulses × 10', 'Hold for 10', 'Small range × 8', 'Slow lower, 4 counts', 'Hold, then pulse × 8', 'Last 4 as slow as you can'];
