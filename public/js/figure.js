// Draws the movement pictures as inline SVG from the pose numbers in /shared/poses.js.
import { s } from './ui.js';
import { POSES, RIG, CANVAS, solve, poseOf } from '/shared/poses.js';

const C = { body: '#23433A', far: '#7FA296', ghost: '#0F6E62', frame: '#C3CEC9', pad: '#9DB0A9', wood: '#D9C39A', strap: '#B4651F', skin: '#F0D9C6', mat: '#BFD5CE', floor: '#DDE3E0' };
const P = (pt) => `${pt[0].toFixed(1)},${pt[1].toFixed(1)}`;
const line = (a, b, w, color, extra = {}) => s('line', { x1: a[0].toFixed(1), y1: a[1].toFixed(1), x2: b[0].toFixed(1), y2: b[1].toFixed(1), stroke: color, 'stroke-width': w, 'stroke-linecap': 'round', ...extra });

function reformer(pose, car) {
  const [f0, f1] = RIG.frame; const [c0, c1] = RIG.carriage; const [bx, by] = RIG.bar; const [p0, p1, py] = RIG.platform;
  const out = [];
  out.push(s('rect', { x: f0, y: RIG.railY, width: f1 - f0, height: 6, rx: 3, fill: C.frame }));
  out.push(line([f0 + 8, RIG.railY + 6], [f0 + 8, RIG.floor], 4, C.frame), line([f1 - 8, RIG.railY + 6], [f1 - 8, RIG.floor], 4, C.frame));
  // platform and footbar (or jump board)
  out.push(s('rect', { x: p0, y: py, width: p1 - p0, height: RIG.railY - py + 2, rx: 2, fill: C.frame }));
  if (pose.board) out.push(s('rect', { x: bx + 1, y: 40, width: 6, height: py - 40, rx: 2, fill: C.wood }));
  else out.push(s('path', { d: `M ${p0 + 2} ${py} Q ${p0 + 2} ${by} ${bx + 3} ${by}`, fill: 'none', stroke: '#7E8B85', 'stroke-width': 3.2, 'stroke-linecap': 'round' }));
  // risers for the straps
  const [rx, ry] = RIG.riser;
  out.push(line([rx, RIG.railY], [rx, ry], 3, C.frame));
  // carriage
  const x = c0 - car;
  out.push(s('rect', { x, y: RIG.padY, width: c1 - c0, height: 9, rx: 3.5, fill: C.pad }));
  out.push(s('rect', { x: RIG.shoulderRest - car - 3, y: RIG.padY - 10, width: 5, height: 11, rx: 2, fill: C.pad }));
  out.push(s('circle', { cx: x + 14, cy: RIG.railY - 0.5, r: 2.4, fill: '#7E8B85' }), s('circle', { cx: x + c1 - c0 - 14, cy: RIG.railY - 0.5, r: 2.4, fill: '#7E8B85' }));
  if (pose.box === 'long') out.push(s('rect', { x: RIG.shoulderRest - car + 4, y: RIG.longBoxTop, width: 62, height: RIG.padY - RIG.longBoxTop, rx: 3, fill: C.wood }));
  if (pose.box === 'short') out.push(s('rect', { x: RIG.shoulderRest - car - 2, y: RIG.shortBoxTop, width: 26, height: RIG.padY - RIG.shortBoxTop, rx: 3, fill: C.wood }));
  return out;
}

function matFloor() {
  return [s('rect', { x: 34, y: RIG.matY, width: 172, height: 4, rx: 2, fill: C.mat })];
}

// Unit vector for a direction given as two points, and helpers to turn it.
const dir = (a, b) => { const dx = b[0] - a[0]; const dy = b[1] - a[1]; const d = Math.hypot(dx, dy) || 1; return [dx / d, dy / d]; };
// A quarter turn clockwise on screen (y runs down), scaled by s: up becomes right for s = 1.
const turn = (v, s) => [-v[1] * s, v[0] * s];
const add = (p, v, k) => [p[0] + v[0] * k, p[1] + v[1] * k];

// The figure is drawn so you can tell which way it faces: a nose and a hair bun on the head,
// feet that point the way the toes point, and hands. Seen from the front (side-lying, side-on
// standing and kneeling) the head has two eyes instead and the trunk is drawn wider.
function body(j, color, far, opacity) {
  const g = [];
  const spine = dir(j.sh, j.head); // neck direction
  const front = turn(spine, j.faces); // where the face and chest point
  const foot = (leg, col, w) => {
    if (!leg) return;
    const shin = dir(leg.knee, leg.foot);
    // Shin lying flat with the knee lower than the hip is kneeling: the foot points back along the shin.
    const kneeling = Math.abs(shin[1]) < 0.3 && leg.knee[1] - j.hip[1] > 4;
    const toe = j.cam || kneeling ? shin : turn(shin, -j.faces);
    g.push(line(leg.foot, add(leg.foot, toe, j.cam ? 4 : 6.5), w, col));
  };
  const limb = (a, b, c, w1, w2, col) => { if (!a) return; g.push(line(a, b, w1, col), line(b, c, w2, col)); };
  if (j.leg2) { limb(j.hip, j.leg2.knee, j.leg2.foot, 8.4, 6.8, far); foot(j.leg2, far, 4.6); }
  if (j.arm2) { limb(j.sh, j.arm2.elbow, j.arm2.hand, 5.8, 5, far); g.push(s('circle', { cx: j.arm2.hand[0].toFixed(1), cy: j.arm2.hand[1].toFixed(1), r: 2.9, fill: far })); }
  g.push(s('path', { d: `M ${P(j.hip)} Q ${P(j.mid)} ${P(j.sh)}`, fill: 'none', stroke: color, 'stroke-width': j.cam ? 15 : 12, 'stroke-linecap': 'round' }));
  // head: dark hair at the back, a light face at the front, so the facing direction reads at any size
  const hc = j.head;
  const dot = (pt, r, fill) => g.push(s('circle', { cx: pt[0].toFixed(1), cy: pt[1].toFixed(1), r, fill }));
  if (j.cam) {
    dot(add(hc, spine, 6.6), 3.6, color);
    dot(hc, 7.6, color);
    if (!opacity) {
      dot(add(hc, spine, -0.8), 5.4, C.skin);
      const across = turn(spine, 1);
      for (const k of [-2.3, 2.3]) dot(add(add(hc, across, k), spine, 0.2), 1.05, color);
    }
  } else {
    dot(add(add(hc, front, -6.4), spine, 2.4), 3.8, color);
    dot(hc, 7.4, color);
    dot(add(add(hc, front, 7.6), spine, -0.8), 2.2, opacity ? color : C.skin);
    if (!opacity) {
      dot(add(add(hc, front, 2.9), spine, -0.6), 4.9, C.skin);
      dot(add(add(hc, front, 4.4), spine, 0.9), 0.95, color);
    }
  }
  if (j.leg) { limb(j.hip, j.leg.knee, j.leg.foot, 9, 7.2, color); foot(j.leg, color, 5); }
  if (j.arm) { limb(j.sh, j.arm.elbow, j.arm.hand, 6.2, 5.4, color); g.push(s('circle', { cx: j.arm.hand[0].toFixed(1), cy: j.arm.hand[1].toFixed(1), r: 3.1, fill: color })); }
  return s('g', opacity ? { opacity } : {}, ...g);
}

function straps(pose, j) {
  if (!pose.strap) return [];
  const [rx, ry] = RIG.riser;
  const ends = pose.strap === 'foot' ? [j.leg && j.leg.foot, j.leg2 && j.leg2.foot] : [j.arm && j.arm.hand];
  return ends.filter(Boolean).map((e) => line([rx, ry], e, 1.2, C.strap, { 'stroke-linecap': 'butt' }));
}

// Low poses get a short canvas so the figure fills the picture; tall ones get headroom.
function crop(pose, a, b) {
  let top = 999;
  for (const j of [a, b]) {
    if (!j) continue;
    top = Math.min(top, j.head[1] - 9, j.sh[1], j.hip[1]);
    for (const l of [j.leg, j.leg2]) if (l) top = Math.min(top, l.knee[1], l.foot[1]);
    for (const l of [j.arm, j.arm2]) if (l) top = Math.min(top, l.elbow[1], l.hand[1]);
  }
  if (pose.strap) top = Math.min(top, RIG.riser[1]);
  const bottom = RIG.floor + 7;
  if (top > 34) return [28, bottom - 28];
  if (top > 4) return [0, bottom];
  return [CANVAS.top, bottom - CANVAS.top];
}

// figure(movement or pose id, { size, ghost })
export function figure(mvOrPose, { width = 240, ghost = true, title } = {}) {
  const id = typeof mvOrPose === 'string' ? mvOrPose : poseOf(mvOrPose);
  const pose = POSES[id] || POSES['mat-stand'];
  const a = solve(pose, 'a');
  const b = pose.b && ghost && width >= 100 ? solve(pose, 'b') : null;
  const label = title || (typeof mvOrPose === 'object' && mvOrPose ? `${mvOrPose.name}: ${pose.label}` : pose.label);
  const [vy, vh] = crop(pose, a, b);
  return s('svg', { viewBox: `0 ${vy} ${CANVAS.w} ${vh}`, width, height: Math.round((width * vh) / CANVAS.w), role: 'img', 'aria-label': label, class: 'figure' },
    s('title', {}, label),
    line([14, RIG.floor], [226, RIG.floor], 1.5, C.floor),
    ...(pose.ctx === 'reformer' ? reformer(pose, a.car) : matFloor()),
    b ? body(b, C.ghost, C.ghost, 0.3) : null,
    ...straps(pose, a),
    body(a, C.body, C.far));
}

// Two frames side by side: start and finish.
export function figurePair(mv, { width = 220 } = {}) {
  const id = poseOf(mv);
  const pose = POSES[id] || POSES['mat-stand'];
  if (!pose.b) return [figure(id, { width, ghost: false, title: `${mv.name}: start` })];
  const end = { ...pose, a: { ...pose.a, ...pose.b }, car: pose.b.car !== undefined ? pose.b.car : pose.car, b: null };
  const box = crop(pose, solve(pose, 'a'), solve(pose, 'b'));
  return [figureFrom({ ...pose, b: null }, width, `${mv.name}: start`, box), figureFrom(end, width, `${mv.name}: finish`, box)];
}

function figureFrom(pose, width, label, cropTo) {
  const a = solve(pose, 'a');
  const [vy, vh] = cropTo || crop(pose, a, null);
  return s('svg', { viewBox: `0 ${vy} ${CANVAS.w} ${vh}`, width, height: Math.round((width * vh) / CANVAS.w), role: 'img', 'aria-label': label, class: 'figure' },
    s('title', {}, label),
    line([14, RIG.floor], [226, RIG.floor], 1.5, C.floor),
    ...(pose.ctx === 'reformer' ? reformer(pose, a.car) : matFloor()),
    ...straps(pose, a),
    body(a, C.body, C.far));
}
