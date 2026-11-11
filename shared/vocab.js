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
  { id: 'pregnancy', label: 'Pregnancy' },
  { id: 'knee', label: 'Knee pain / replacement' },
  { id: 'hip_replacement', label: 'Hip replacement' },
  { id: 'wrist', label: 'Wrist pain' },
  { id: 'shoulder', label: 'Shoulder pain / instability' },
  { id: 'neck', label: 'Neck pain' },
  { id: 'low_bone_density', label: 'Low bone density' },
  { id: 'extension_pain', label: 'Pain arching the back' },
  { id: 'flexion_pain', label: 'Pain rounding the back' },
  { id: 'balance', label: 'Balance concerns' }
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
