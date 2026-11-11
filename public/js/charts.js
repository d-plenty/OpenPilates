import { h, s } from './ui.js';
import { POSITIONS, springFor, springLabel, PURPOSES } from '/shared/vocab.js';
import { fmtClock } from '/shared/analysis.js';

const BASE = '#E2E7E4';
const shade = (lvl) => (lvl == null || lvl <= 0 ? '#D3DAD7' : lvl > 0.66 ? '#0F6E62' : lvl > 0.33 ? '#4E9C8F' : '#A9D3CA');

function silhouette() {
  return [
    s('circle', { cx: 60, cy: 18, r: 13, fill: BASE }), s('rect', { x: 54, y: 30, width: 12, height: 10, fill: BASE }),
    s('rect', { x: 34, y: 40, width: 52, height: 80, rx: 14, fill: BASE }),
    s('rect', { x: 18, y: 44, width: 14, height: 78, rx: 7, fill: BASE }), s('rect', { x: 88, y: 44, width: 14, height: 78, rx: 7, fill: BASE }),
    s('rect', { x: 38, y: 116, width: 20, height: 124, rx: 9, fill: BASE }), s('rect', { x: 62, y: 116, width: 20, height: 124, rx: 9, fill: BASE })
  ];
}

const pair = (tag, a, b, fill, extra = {}) => [s(tag, { ...a, fill, ...extra }), s(tag, { ...b, fill, ...extra })];

// levels: { muscleId: 0..1 }, gaps: Set of muscle ids to outline
export function bodyMap(levels = {}, { size = 120, gaps = new Set() } = {}) {
  const f = (id) => shade(levels[id]);
  const gap = (id) => (gaps.has(id) ? { stroke: '#C2571A', 'stroke-width': 1.6, 'stroke-dasharray': '3 2', fill: '#FFFFFF' } : {});
  const hgt = Math.round(size * 250 / 120);
  const front = s('svg', { width: size, height: hgt, viewBox: '0 0 120 250', role: 'img', 'aria-label': 'Front of body: ' + describe(levels, 'F') },
    ...silhouette(),
    ...pair('ellipse', { cx: 33, cy: 50, rx: 9, ry: 8 }, { cx: 87, cy: 50, rx: 9, ry: 8 }, f('deltoids')),
    s('rect', { x: 40, y: 46, width: 40, height: 18, rx: 6, fill: f('chest'), ...gap('chest') }),
    s('rect', { x: 51, y: 67, width: 18, height: 40, rx: 5, fill: f('abdominals'), ...gap('abdominals') }),
    ...pair('rect', { x: 39, y: 70, width: 10, height: 34, rx: 5 }, { x: 71, y: 70, width: 10, height: 34, rx: 5 }, f('obliques')),
    s('rect', { x: 42, y: 108, width: 36, height: 9, rx: 4, fill: f('hip_flexors') }),
    ...pair('rect', { x: 20, y: 62, width: 10, height: 26, rx: 5 }, { x: 90, y: 62, width: 10, height: 26, rx: 5 }, f('biceps')),
    ...pair('rect', { x: 40, y: 122, width: 13, height: 54, rx: 6 }, { x: 67, y: 122, width: 13, height: 54, rx: 6 }, f('quadriceps')),
    ...pair('rect', { x: 53, y: 124, width: 5, height: 40, rx: 2.5 }, { x: 62, y: 124, width: 5, height: 40, rx: 2.5 }, f('adductors')));
  const back = s('svg', { width: size, height: hgt, viewBox: '0 0 120 250', role: 'img', 'aria-label': 'Back of body: ' + describe(levels, 'B') },
    ...silhouette(),
    ...pair('ellipse', { cx: 33, cy: 50, rx: 9, ry: 8 }, { cx: 87, cy: 50, rx: 9, ry: 8 }, f('deltoids')),
    s('rect', { x: 40, y: 44, width: 40, height: 18, rx: 7, fill: f('upper_back') }),
    ...pair('rect', { x: 38, y: 64, width: 11, height: 32, rx: 5 }, { x: 71, y: 64, width: 11, height: 32, rx: 5 }, f('lats')),
    s('rect', { x: 55, y: 62, width: 10, height: 44, rx: 4, fill: f('spinal_extensors'), ...gap('spinal_extensors') }),
    ...pair('rect', { x: 20, y: 62, width: 10, height: 26, rx: 5 }, { x: 90, y: 62, width: 10, height: 26, rx: 5 }, f('triceps')),
    s('rect', { x: 40, y: 106, width: 40, height: 22, rx: 10, fill: f('glutes') }),
    ...pair('ellipse', { cx: 38, cy: 112, rx: 4, ry: 8 }, { cx: 82, cy: 112, rx: 4, ry: 8 }, f('abductors')),
    ...pair('rect', { x: 40, y: 132, width: 16, height: 46, rx: 7 }, { x: 64, y: 132, width: 16, height: 46, rx: 7 }, f('hamstrings')),
    ...pair('rect', { x: 41, y: 186, width: 14, height: 40, rx: 7 }, { x: 65, y: 186, width: 14, height: 40, rx: 7 }, f('calves')));
  return h('div', { class: 'bodymap' },
    h('figure', null, front, h('figcaption', null, 'Front')),
    h('figure', null, back, h('figcaption', null, 'Back')));
}

function describe(levels, side) {
  const F = ['deltoids', 'chest', 'abdominals', 'obliques', 'hip_flexors', 'biceps', 'quadriceps', 'adductors'];
  const B = ['deltoids', 'upper_back', 'lats', 'spinal_extensors', 'triceps', 'glutes', 'abductors', 'hamstrings', 'calves'];
  const list = (side === 'F' ? F : B).filter((m) => levels[m] > 0.33).map((m) => m.replace('_', ' '));
  return list.length ? 'most worked ' + list.join(', ') : 'little work';
}

export function bodyLegend() {
  return h('div', { class: 'legend' },
    [['#0F6E62', 'High'], ['#4E9C8F', 'Medium'], ['#A9D3CA', 'Low'], ['#D3DAD7', 'None']].map(([c, l]) => h('span', null, h('i', { style: { background: c } }), l)));
}

// Spine radar. values/target: { flexion, extension, rotation, 'side-bend' } in %
export function radar(values, target, { size = 180 } = {}) {
  const c = 90, R = 70, max = 60;
  const pt = (v, ang) => { const r = Math.min(v, max) / max * R; return [c + r * Math.cos(ang), c + r * Math.sin(ang)]; };
  const angles = { flexion: -Math.PI / 2, rotation: 0, extension: Math.PI / 2, 'side-bend': Math.PI };
  const poly = (vals) => Object.entries(angles).map(([k, a]) => pt(vals[k] || 0, a).map((n) => n.toFixed(1)).join(',')).join(' ');
  const desc = Object.keys(angles).map((k) => `${k.replace('-', ' ')} ${values[k] || 0}% (target ${target[k] || 0}%)`).join(', ');
  return s('svg', { width: size, height: size, viewBox: '0 0 180 180', role: 'img', 'aria-label': 'Spine movement: ' + desc, class: 'radar' },
    s('circle', { cx: c, cy: c, r: R, fill: 'none', stroke: '#E2E7E4' }), s('circle', { cx: c, cy: c, r: R * 2 / 3, fill: 'none', stroke: '#E2E7E4' }), s('circle', { cx: c, cy: c, r: R / 3, fill: 'none', stroke: '#E2E7E4' }),
    s('path', { d: `M${c} ${c - R}V${c + R}M${c - R} ${c}H${c + R}`, stroke: '#E2E7E4' }),
    s('polygon', { points: poly(target), fill: 'none', stroke: '#56625C', 'stroke-width': 1.5, 'stroke-dasharray': '4 3' }),
    s('polygon', { points: poly(values), fill: 'rgba(15,110,98,.22)', stroke: '#0F6E62', 'stroke-width': 2 }),
    s('text', { x: c, y: 12, 'text-anchor': 'middle', class: 'radar-label' }, 'Flexion'),
    s('text', { x: c, y: 177, 'text-anchor': 'middle', class: 'radar-label' }, 'Extension'),
    s('text', { x: 178, y: 94, 'text-anchor': 'end', class: 'radar-label' }, 'Rotation'),
    s('text', { x: 2, y: 94, class: 'radar-label' }, 'Side'));
}

// Intensity curve over the class with segment bands and BPM steps.
export function intensityChart(a, flow, { height = 200 } = {}) {
  const W = 1000, H = 200, top = 14, bottom = 170;
  const total = a.totalSec || 1;
  const x = (t) => (t / total) * W;
  const y = (v) => bottom - ((v - 1) / 9) * (bottom - top);
  const bands = a.segments.map((sg, i) => s('rect', { x: x(sg.start).toFixed(1), y: 0, width: Math.max(0, x(sg.sec)).toFixed(1), height: bottom, fill: i % 2 ? '#F6F8F7' : '#EAF4F1' }));
  const pts = a.intensity.flatMap((i) => [[x(i.at), y(i.value)], [x(i.end), y(i.value)]]);
  const line = pts.length ? s('polyline', { points: pts.map((p) => p.map((n) => n.toFixed(1)).join(',')).join(' '), fill: 'none', stroke: '#0F6E62', 'stroke-width': 3, 'vector-effect': 'non-scaling-stroke', 'stroke-linejoin': 'round' }) : null;
  const bpmPts = [];
  (flow.segments || []).forEach((seg, i) => {
    const sg = a.segments[i];
    if (!sg || !seg.bpm) return;
    const yy = bottom - ((seg.bpm - 60) / 120) * (bottom - top);
    bpmPts.push([x(sg.start), yy], [x(sg.start + sg.sec), yy]);
  });
  const bpm = bpmPts.length ? s('polyline', { points: bpmPts.map((p) => p.map((n) => n.toFixed(1)).join(',')).join(' '), fill: 'none', stroke: '#7A4FA0', 'stroke-width': 2, 'stroke-dasharray': '6 4', 'vector-effect': 'non-scaling-stroke' }) : null;
  const peak = a.peak ? s('circle', { cx: x(a.peak.at + (a.peak.end - a.peak.at) / 2).toFixed(1), cy: y(a.peak.value).toFixed(1), r: 6, fill: '#16201C' }) : null;
  const labels = a.segments.map((sg) => s('text', { x: (x(sg.start) + 6).toFixed(1), y: 192, class: 'chart-label' }, sg.name));
  return s('svg', { width: '100%', height, viewBox: `0 0 ${W} ${H}`, preserveAspectRatio: 'none', role: 'img', class: 'intensity-chart',
    'aria-label': a.peak ? `Effort across the class, peaking at ${a.peak.name} around ${a.peak.pct}% of the way through` : 'Effort across the class' },
  ...bands, bpm, line, peak, ...labels);
}

export function positionStrip(timeline, { height = 36, labels = true } = {}) {
  const colors = Object.fromEntries(POSITIONS.map((p) => [p.id, p]));
  return h('div', { class: 'pos-strip', style: { height: height + 'px' }, role: 'img', 'aria-label': 'Body positions in order: ' + timeline.map((p) => colors[p.position]?.label).join(', ') },
    timeline.map((p) => h('div', { style: { flex: `${p.sec} 1 0`, background: colors[p.position]?.color || '#999' }, title: `${colors[p.position]?.label} · ${fmtClock(p.sec)}` },
      labels && p.sec >= 120 ? colors[p.position]?.label : '')));
}

export function positionKey(positionMinutes) {
  return h('div', { class: 'legend' }, POSITIONS.filter((p) => positionMinutes[p.id]).map((p) =>
    h('span', null, h('i', { style: { background: p.color } }), `${p.label} · ${Math.round(positionMinutes[p.id] / 60)} min`)));
}

export function bar(label, pct, color, right) {
  return h('div', { class: 'bar' },
    h('div', { class: 'bar-top' }, h('span', null, label), h('span', null, right ?? `${pct}%`)),
    h('div', { class: 'bar-track' }, h('div', { class: 'bar-fill', style: { width: Math.max(0, Math.min(100, pct)) + '%', background: color } })));
}

export function purposeBars(purpose) {
  return PURPOSES.map((p) => bar(p.label, purpose[p.id] || 0, p.color));
}

export function springDots(loads, room, { label = true } = {}) {
  if (!loads || !loads.length) return h('span', { class: 'springs muted' }, 'No springs');
  const dots = loads.map((l) => {
    const sp = springFor(room.brand, l, room.springOverrides);
    return h('span', { class: 'dot', style: { background: sp.color }, title: `${sp.name} (${l})` });
  });
  return h('span', { class: 'springs', title: loads.join(' + ') }, ...dots, label ? h('span', { class: 'spring-label' }, springLabel(room.brand, loads, room.springOverrides)) : null);
}

export function donut(fraction, { size = 250, label = '', big = '', sub = '' } = {}) {
  const r = 108, C = 2 * Math.PI * r;
  return s('svg', { width: size, height: size, viewBox: '0 0 250 250', role: 'img', 'aria-label': `${big} ${label}` },
    s('circle', { cx: 125, cy: 125, r, fill: 'none', stroke: 'rgba(255,255,255,.12)', 'stroke-width': 16 }),
    fraction <= 0.002 ? null : s('circle', { cx: 125, cy: 125, r, fill: 'none', stroke: '#2BA391', 'stroke-width': 16, 'stroke-linecap': 'round', 'stroke-dasharray': `${(C * Math.max(0, Math.min(1, fraction))).toFixed(1)} ${C.toFixed(1)}`, transform: 'rotate(-90 125 125)' }),
    s('text', { x: 125, y: 100, 'text-anchor': 'middle', class: 'donut-label' }, label),
    s('text', { x: 125, y: 146, 'text-anchor': 'middle', class: 'donut-big' }, big),
    s('text', { x: 125, y: 174, 'text-anchor': 'middle', class: 'donut-sub' }, sub));
}
