import { POSITIONS, SPINE, MUSCLES, EQUIPMENT, LEVELS, CAUTIONS, PATTERNS, PLANES, LOAD_LEVELS, SEGMENT_ROLES, BRANDS, DEFAULT_TARGETS } from '../shared/vocab.js';

const ids = (list) => new Set(list.map((x) => x.id));
const POS = ids(POSITIONS), SP = ids(SPINE), MU = ids(MUSCLES), EQ = ids(EQUIPMENT), LV = ids(LEVELS), CA = ids(CAUTIONS),
  PA = ids(PATTERNS), PL = ids(PLANES), RO = ids(SEGMENT_ROLES), LOADS = new Set(LOAD_LEVELS);

export class Invalid extends Error {}

const str = (v, max = 200) => String(v ?? '').slice(0, max).trim();
const num = (v, min, max, dflt) => { const n = Number(v); return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : dflt; };
const pick = (arr, allowed, max = 20) => (Array.isArray(arr) ? [...new Set(arr.filter((x) => allowed.has(x)))].slice(0, max) : []);

export function slugify(s) {
  return String(s || '').toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '').trim().replace(/[\s_]+/g, '-').replace(/-+/g, '-').slice(0, 60);
}

export function cleanMovement(input, { slug } = {}) {
  const m = input || {};
  const name = str(m.name, 100);
  if (!name) throw new Invalid('Give the movement a name.');
  const apparatus = m.apparatus === 'mat' ? 'mat' : 'reformer';
  const position = POS.has(m.position) ? m.position : null;
  if (!position) throw new Invalid('Choose a starting position.');
  const primary = pick(m.muscles?.primary, MU, 8);
  if (!primary.length) throw new Invalid('Choose at least one primary muscle.');
  const purpose = {};
  for (const k of ['strength', 'stability', 'flexibility', 'mobility']) purpose[k] = num(m.purpose?.[k], 0, 3, 0);
  return {
    slug: slug || slugify(m.slug || name),
    name,
    apparatus,
    level: LV.has(m.level) ? m.level : 'beginner',
    position,
    spine: pick(m.spine, SP, 4).length ? pick(m.spine, SP, 4) : ['neutral'],
    plane: PL.has(m.plane) ? m.plane : 'sagittal',
    patterns: pick(m.patterns, PA, 6),
    muscles: { primary, secondary: pick(m.muscles?.secondary, MU, 8).filter((x) => !primary.includes(x)) },
    equipment: pick(m.equipment, EQ, 6),
    load: apparatus === 'reformer' ? { springs: (Array.isArray(m.load?.springs) ? m.load.springs : []).filter((x) => LOADS.has(x)).slice(0, 5) } : null,
    purpose,
    multiJoint: m.multiJoint !== false,
    intensity: num(m.intensity, 1, 10, 4),
    duration: Math.round(num(m.duration, 15, 1800, 120)),
    reps: str(m.reps, 60),
    summary: str(m.summary, 600),
    layers: (Array.isArray(m.layers) ? m.layers : []).slice(0, 6).map((l) => ({ tag: str(l.tag, 4) || 'L1', title: str(l.title, 80), text: str(l.text, 300) })).filter((l) => l.title),
    cautions: (Array.isArray(m.cautions) ? m.cautions : []).slice(0, 12).filter((c) => CA.has(c.tag)).map((c) => ({ tag: c.tag, note: str(c.note, 300), ...(c.swap ? { swap: slugify(c.swap) } : {}) })),
    cues: str(m.cues, 2000),
    labels: (Array.isArray(m.labels) ? m.labels : []).map((x) => slugify(x)).filter(Boolean).slice(0, 12),
    review: m.review && typeof m.review === 'object' ? { status: str(m.review.status, 20) || 'draft', note: str(m.review.note, 300), by: str(m.review.by, 80), date: str(m.review.date, 20) } : { status: 'draft', note: '' }
  };
}

export function cleanFlow(input) {
  const f = input || {};
  const title = str(f.title, 120) || 'Untitled flow';
  const segments = (Array.isArray(f.segments) ? f.segments : []).slice(0, 30).map((s) => ({
    id: str(s.id, 40) || Math.random().toString(36).slice(2),
    name: str(s.name, 80) || 'Segment',
    role: RO.has(s.role) ? s.role : 'build',
    bpm: s.bpm === '' || s.bpm == null ? null : num(s.bpm, 30, 220, null),
    song: str(s.song, 160),
    notes: str(s.notes, 1000),
    items: (Array.isArray(s.items) ? s.items : []).slice(0, 60).map((i) => ({
      id: str(i.id, 40) || Math.random().toString(36).slice(2),
      slug: slugify(i.slug),
      ...(i.duration ? { duration: Math.round(num(i.duration, 10, 1800, 120)) } : {}),
      ...(i.reps ? { reps: str(i.reps, 60) } : {}),
      ...(i.layer ? { layer: str(i.layer, 4) } : {}),
      ...(i.note ? { note: str(i.note, 500) } : {}),
      ...(i.load && Array.isArray(i.load.springs) ? { load: { springs: i.load.springs.filter((x) => LOADS.has(x)).slice(0, 5) } } : {})
    })).filter((i) => i.slug)
  }));
  return {
    title,
    apparatus: ['reformer', 'mat', 'mixed'].includes(f.apparatus) ? f.apparatus : 'reformer',
    level: LV.has(f.level) ? f.level : 'intermediate',
    lengthMin: Math.round(num(f.lengthMin, 10, 180, 50)),
    goal: str(f.goal, 40),
    target: str(f.target, 40) || 'general',
    room: str(f.room, 40),
    when: str(f.when, 40),
    notes: str(f.notes, 2000),
    labels: (Array.isArray(f.labels) ? f.labels : []).map((x) => str(x, 30)).filter(Boolean).slice(0, 12),
    booked: (Array.isArray(f.booked) ? f.booked : []).slice(0, 40).map((b) => ({ clientId: Math.trunc(Number(b.clientId)) || 0, spot: str(b.spot, 20) })).filter((b) => b.clientId > 0),
    segments
  };
}

export function cleanClient(input) {
  const c = input || {};
  const name = str(c.name, 80);
  if (!name) throw new Invalid('Give the client a name.');
  return { name, notes: str(c.notes, 2000), tags: pick(c.tags, CA, 12) };
}

export function cleanStudio(input) {
  const s = input || {};
  const rooms = (Array.isArray(s.rooms) ? s.rooms : []).slice(0, 10).map((r, i) => {
    const brand = BRANDS[r.brand] ? r.brand : 'balanced_body';
    const springs = {};
    for (const l of LOAD_LEVELS) if (r.springs && Number(r.springs[l]) > 0) springs[l] = Math.min(10, Math.trunc(Number(r.springs[l])));
    const overrides = {};
    for (const l of LOAD_LEVELS) {
      const o = r.springOverrides?.[l];
      if (o && (o.name || o.color)) overrides[l] = { name: str(o.name, 20) || l, short: str(o.short, 3) || l[0].toUpperCase(), color: /^#[0-9a-f]{6}$/i.test(o.color) ? o.color : '#9AA39F' };
    }
    return {
      id: str(r.id, 40) || `room${i + 1}`,
      name: str(r.name, 60) || `Room ${i + 1}`,
      apparatus: r.apparatus === 'mat' ? 'mat' : 'reformer',
      brand, count: Math.trunc(num(r.count, 0, 100, 0)), springs, springOverrides: overrides
    };
  });
  const props = {};
  for (const e of EQUIPMENT) props[e.id] = Math.trunc(num(s.props?.[e.id], 0, 200, 0));
  const targets = {};
  for (const [k, t] of Object.entries(s.targets || {}).slice(0, 12)) {
    const key = slugify(k) || 'custom';
    targets[key] = { label: str(t.label, 40) || key, flexion: num(t.flexion, 0, 100, 0), extension: num(t.extension, 0, 100, 0), rotation: num(t.rotation, 0, 100, 0), 'side-bend': num(t['side-bend'], 0, 100, 0) };
  }
  return {
    name: str(s.name, 80) || 'My studio',
    rooms: rooms.length ? rooms : defaultStudio().rooms,
    props,
    targets: Object.keys(targets).length ? targets : structuredClone(DEFAULT_TARGETS)
  };
}

export function defaultStudio(name = 'My studio', brand = 'balanced_body') {
  const b = BRANDS[brand] ? brand : 'balanced_body';
  return {
    name,
    rooms: [
      { id: 'room1', name: 'Reformer room', apparatus: 'reformer', brand: b, count: 8, springs: { ...BRANDS[b].standard }, springOverrides: {} },
      { id: 'room2', name: 'Mat room', apparatus: 'mat', brand: b, count: 12, springs: {}, springOverrides: {} }
    ],
    props: { long_box: 4, short_box: 4, jump_board: 0, platform_extender: 0, magic_circle: 6, loop_band: 10, resistance_band: 6, small_ball: 6, hand_weights: 8, ankle_weights: 0, sliders: 0, foam_roller: 4 },
    targets: structuredClone(DEFAULT_TARGETS)
  };
}
