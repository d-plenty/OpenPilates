// Poses for the movement pictures. Every picture is drawn by the app from these
// numbers — there are no image files. A pose has a start position (a) and, usually, an end
// position (b) that is drawn as a ghost so you can see what moves.
//
// Canvas is 240 x 130, side view, reformer footbar on the right. Angles are in degrees from
// "pointing right", anticlockwise (90 = straight up). A point written [x, y, 'c'] rides on the
// carriage, so it shifts left when the carriage is pressed out (car = how far, in px).

export const CANVAS = { w: 240, h: 160, top: -34 };
export const LEN = { torso: 36, head: 11, thigh: 27, shin: 27, uarm: 18, farm: 17, foot: 7 };

// Fixed reformer landmarks.
export const RIG = {
  floor: 119, railY: 98, frame: [28, 224], carriage: [100, 198], padY: 88,
  shoulderRest: 128, bar: [207, 66], platform: [201, 224, 90], riser: [34, 52],
  longBoxTop: 70, shortBoxTop: 70, matY: 114
};

const CAR_Y = 81; // centre of a body lying on the carriage
const MAT_Y = 107; // centre of a body lying on the mat
const BOX_Y = 63; // lying on the long box
const SEAT_BOX = 64; // sitting on a box
const BAR = [205, 67];
const KNEEL_Y = 56; // hip height when kneeling upright on the carriage
const HEEL_SIT = 75; // hip height sitting on the heels on the carriage

export const POSES = {
  // ---------------------------------------------------------------- reformer, lying on the back
  'supine-footbar': { label: 'On the back, feet on the footbar', ctx: 'reformer',
    a: { hip: [170, CAR_Y, 'c'], torso: 180, legTo: BAR, leg2To: BAR, uarm: 0, farm: 0 },
    b: { car: 17 } },
  'supine-single-leg': { label: 'On the back, one foot on the bar', ctx: 'reformer',
    a: { hip: [170, CAR_Y, 'c'], torso: 180, legTo: BAR, thigh2: 90, shin2: 0, uarm: 0, farm: 0 },
    b: { car: 17 } },
  'supine-bridge': { label: 'Bridge, feet on the footbar', ctx: 'reformer',
    a: { hip: [172, CAR_Y, 'c'], torso: 180, legTo: BAR, leg2To: BAR, uarm: 0, farm: 0 },
    b: { hip: [176, 62, 'c'], torso: 207, legTo: BAR, leg2To: BAR, uarm: -10, farm: 0 } },
  'supine-feet-straps': { label: 'On the back, feet in the straps', ctx: 'reformer', strap: 'foot', car: 14,
    a: { hip: [168, CAR_Y, 'c'], torso: 180, thigh: 82, shin: 82, thigh2: 82, shin2: 82, uarm: 0, farm: 0 },
    b: { thigh: 28, shin: 28, thigh2: 28, shin2: 28 } },
  'supine-frog': { label: 'On the back, frog in the straps', ctx: 'reformer', strap: 'foot', car: 14,
    a: { hip: [168, CAR_Y, 'c'], torso: 180, thigh: 95, shin: 10, thigh2: 95, shin2: 10, uarm: 0, farm: 0 },
    b: { thigh: 42, shin: 42, thigh2: 42, shin2: 42 } },
  'supine-roll-over': { label: 'Rolled up onto the shoulders, legs in straps', ctx: 'reformer', strap: 'foot', car: 10,
    a: { hip: [166, CAR_Y, 'c'], torso: 180, thigh: 85, shin: 85, thigh2: 85, shin2: 85, uarm: 0, farm: 0 },
    b: { hip: [150, 52, 'c'], torso: 232, thigh: 150, shin: 150, thigh2: 150, shin2: 150, uarm: 5, farm: 0 } },
  'supine-arms-straps': { label: 'On the back, hands in the straps, legs in tabletop', ctx: 'reformer', strap: 'hand', car: 8,
    a: { hip: [170, CAR_Y, 'c'], torso: 180, thigh: 90, shin: 0, thigh2: 90, shin2: 0, uarm: 100, farm: 100 },
    b: { car: 20, uarm: 2, farm: 2 } },
  'supine-curl': { label: 'Curled up, arms long, legs out', ctx: 'reformer', strap: 'hand', car: 18,
    a: { hip: [170, CAR_Y, 'c'], torso: 180, thigh: 90, shin: 0, thigh2: 90, shin2: 0, uarm: 100, farm: 100 },
    b: { torso: 158, curl: 26, thigh: 40, shin: 40, thigh2: 40, shin2: 40, uarm: 0, farm: 0 } },
  'supine-jump': { label: 'On the back, feet on the jump board', ctx: 'reformer', board: true,
    a: { hip: [170, CAR_Y, 'c'], torso: 180, legTo: [206, 72], leg2To: [206, 72], uarm: 0, farm: 0 },
    b: { car: 30, thigh: 12, shin: 12, thigh2: 12, shin2: 12 } },
  'side-lying-footbar': { label: 'Lying on one side, top foot on the bar', ctx: 'reformer', view: 'cam',
    a: { hip: [170, CAR_Y - 2, 'c'], torso: 180, legTo: [205, 64], thigh2: 14, shin2: 338, uarm: 20, farm: 315, uarm2: 180, farm2: 176 },
    b: { car: 17 } },
  'side-lying-strap': { label: 'Lying on one side, top foot in a strap', ctx: 'reformer', view: 'cam', strap: 'foot', car: 12,
    a: { hip: [166, CAR_Y - 2, 'c'], torso: 180, thigh: 55, shin: -35, thigh2: 14, shin2: 338, uarm: 20, farm: 315, uarm2: 180, farm2: 176 },
    b: { thigh: 8, shin: 8 } },

  // ---------------------------------------------------------------- reformer, kneeling and sitting
  'kneel-face-straps': { label: 'Kneeling, facing the straps', ctx: 'reformer', flip: true, strap: 'hand', car: 10,
    a: { hip: [158, HEEL_SIT, 'c'], torso: 92, thigh: 193, shin: 357, thigh2: 193, shin2: 357, uarm: 218, farm: 200 },
    b: { car: 22, uarm: 285, farm: 275 } },
  'kneel-face-bar': { label: 'Kneeling, back to the straps', ctx: 'reformer', strap: 'hand', car: 10,
    a: { hip: [140, HEEL_SIT, 'c'], torso: 88, thigh: 347, shin: 183, thigh2: 347, shin2: 183, uarm: 262, farm: 255 },
    b: { car: 22, uarm: 355, farm: 0 } },
  'kneel-side': { label: 'Kneeling side-on, one hand in a strap', ctx: 'reformer', view: 'cam', strap: 'hand', car: 10,
    a: { hip: [150, HEEL_SIT, 'c'], torso: 90, thigh: 193, shin: 357, thigh2: 193, shin2: 357, uarm: 250, farm: 185, uarm2: 280, farm2: 270 },
    b: { car: 20, uarm: 330, farm: 5 } },
  'kneel-up-face-straps': { label: 'Kneeling upright, leaning back in one line', ctx: 'reformer', flip: true, strap: 'hand', car: 10,
    a: { hip: [150, KNEEL_Y, 'c'], torso: 90, thigh: 270, shin: 0, thigh2: 270, shin2: 0, uarm: 215, farm: 200 },
    b: { car: 22, hip: [157, 59, 'c'], torso: 74, thigh: 254, thigh2: 254, uarm: 225, farm: 205 } },
  'sit-box-face-bar': { label: 'Sitting on the long box, back to the straps', ctx: 'reformer', strap: 'hand', box: 'long', car: 10,
    a: { hip: [140, SEAT_BOX, 'c'], torso: 75, thigh: 350, shin: 268, thigh2: 350, shin2: 268, uarm: 130, farm: 60 },
    b: { car: 22, uarm: 45, farm: 45 } },
  'sit-carriage-face-straps': { label: 'Sitting tall, facing the straps', ctx: 'reformer', strap: 'hand', car: 10, flip: true,
    a: { hip: [164, CAR_Y - 4, 'c'], torso: 92, thigh: 178, shin: 180, thigh2: 178, shin2: 180, uarm: 205, farm: 195 },
    b: { car: 22, torso: 62, curl: 28, uarm: 250, farm: 160 } },
  'sit-carriage-face-bar': { label: 'Sitting tall, back to the straps', ctx: 'reformer', strap: 'hand', car: 10,
    a: { hip: [120, CAR_Y - 4, 'c'], torso: 88, thigh: 2, shin: 0, thigh2: 2, shin2: 0, uarm: 300, farm: 20 },
    b: { car: 22, torso: 120, curl: 30, uarm: 350, farm: 350 } },
  'short-box': { label: 'Sitting on the short box, feet under the strap', ctx: 'reformer', box: 'short',
    a: { hip: [138, SEAT_BOX, 'c'], torso: 90, legTo: [192, 80], leg2To: [192, 80], uarm: 300, farm: 120 },
    b: { torso: 135, uarm: 345, farm: 165 } },
  'short-box-side': { label: 'Short box, side bend', ctx: 'reformer', view: 'cam', box: 'short',
    a: { hip: [138, SEAT_BOX, 'c'], torso: 90, legTo: [192, 80], thigh2: 350, shin2: 250, uarm: 95, farm: 100, uarm2: 300, farm2: 200 },
    b: { torso: 150, uarm: 160, farm: 170 } },
  'mermaid': { label: 'Sitting side-on, one hand on the footbar', ctx: 'reformer', view: 'cam',
    a: { hip: [150, CAR_Y - 5, 'c'], torso: 90, thigh: 200, shin: 350, thigh2: 340, shin2: 190, armTo: BAR, uarm2: 240, farm2: 250 },
    b: { car: 16, torso: 62, armTo: BAR, uarm2: 60, farm2: 40 } },

  // ---------------------------------------------------------------- reformer, face down and on the box
  'prone-long-box': { label: 'Face down on the long box, pulling the straps', ctx: 'reformer', flip: true, box: 'long', strap: 'hand', car: 8,
    a: { hip: [150, BOX_Y, 'c'], torso: 180, thigh: 0, shin: 0, thigh2: 0, shin2: 0, uarm: 235, farm: 225 },
    b: { car: 24, torso: 168, uarm: 350, farm: 355 } },
  'prone-long-box-bar': { label: 'Face down on the long box, hands on the footbar', ctx: 'reformer', box: 'long',
    a: { hip: [150, BOX_Y, 'c'], torso: 30, thigh: 195, shin: 185, thigh2: 195, shin2: 185, armTo: BAR },
    b: { car: 22, torso: 8, thigh: 170, shin: 165, thigh2: 170, shin2: 165, armTo: BAR } },
  'teaser-box': { label: 'V-sit on the long box', ctx: 'reformer', box: 'long', strap: 'hand', car: 12,
    a: { hip: [150, BOX_Y - 2, 'c'], torso: 180, thigh: 0, shin: 0, thigh2: 0, shin2: 0, uarm: 240, farm: 230 },
    b: { torso: 125, thigh: 48, shin: 48, thigh2: 48, shin2: 48, uarm: 35, farm: 35 } },
  'quadruped-box': { label: 'Hands and knees on the long box, one foot in a strap', ctx: 'reformer', flip: true, box: 'long', strap: 'foot', car: 10,
    a: { hip: [156, 42, 'c'], torso: 178, thigh: 268, shin: 0, thigh2: 285, shin2: 30, uarm: 268, farm: 270 },
    b: { thigh2: 358, shin2: 0 } },

  'prone-box-hamstring': { label: 'Face down on the long box, feet in the straps', ctx: 'reformer', box: 'long', strap: 'foot', car: 14,
    a: { hip: [168, BOX_Y, 'c'], torso: 0, thigh: 180, shin: 180, thigh2: 180, shin2: 180, uarm: 20, farm: 150 },
    b: { car: 26, shin: 85, shin2: 85 } },

  // ---------------------------------------------------------------- reformer, hands and knees, planks
  'quadruped-foot-bar': { label: 'Hands and knees facing the straps, one foot on the footbar', ctx: 'reformer', flip: true,
    a: { hip: [176, 56, 'c'], torso: 180, thigh: 268, shin: 0, leg2To: BAR, uarm: 268, farm: 270 },
    b: { car: 20 } },
  'sit-feet-bar': { label: 'Sitting at the front of the carriage, feet on the footbar', ctx: 'reformer',
    a: { hip: [184, CAR_Y - 4, 'c'], torso: 105, curl: 30, legTo: BAR, leg2To: BAR, uarm: 262, farm: 300 },
    b: { car: 20 } },
  'down-stretch': { label: 'Kneeling, hips forward, chest lifted, hands on the footbar', ctx: 'reformer',
    a: { hip: [182, 58, 'c'], torso: 62, thigh: 258, shin: 183, thigh2: 258, shin2: 183, armTo: BAR },
    b: { car: 18, torso: 42, armTo: BAR } },
  'knee-stretch': { label: 'Kneeling, hands on the footbar', ctx: 'reformer',
    a: { hip: [162, 56, 'c'], torso: 22, thigh: 285, shin: 185, thigh2: 285, shin2: 185, armTo: BAR },
    b: { car: 22, hip: [160, 60, 'c'], torso: 14, thigh: 218, shin: 183, thigh2: 218, shin2: 183, armTo: BAR } },
  'plank-bar': { label: 'Plank, hands on the footbar', ctx: 'reformer', car: 12,
    a: { hip: [168, 58, 'c'], torso: 14, thigh: 196, shin: 196, thigh2: 196, shin2: 196, armTo: BAR },
    b: { car: 32, hip: [166, 62, 'c'], torso: 8, thigh: 190, shin: 190, thigh2: 190, shin2: 190, armTo: BAR } },
  'pike-bar': { label: 'Standing on the carriage, hands on the footbar', ctx: 'reformer',
    a: { hip: [160, 38, 'c'], torso: 330, thigh: 262, shin: 262, thigh2: 262, shin2: 262, armTo: BAR },
    b: { car: 20, hip: [158, 44, 'c'], torso: 340, thigh: 244, shin: 244, thigh2: 244, shin2: 244, armTo: BAR } },
  'arabesque': { label: 'One leg lifted behind, hands on the footbar', ctx: 'reformer',
    a: { hip: [160, 38, 'c'], torso: 330, thigh: 262, shin: 262, thigh2: 165, shin2: 165, armTo: BAR },
    b: { car: 20, hip: [158, 44, 'c'], torso: 340, thigh: 244, shin: 244, thigh2: 160, shin2: 160, armTo: BAR } },
  'plank-platform': { label: 'Plank, hands on the platform', ctx: 'reformer', car: 26,
    a: { hip: [200, 60, 'c'], torso: 10, thigh: 192, shin: 192, thigh2: 192, shin2: 192, armTo: [212, 88] },
    b: { car: 4, hip: [176, 52, 'c'], torso: 352, thigh: 250, shin: 185, thigh2: 250, shin2: 185, armTo: [212, 88] } },
  'plank-rear': { label: 'Plank facing the straps, feet on the platform', ctx: 'reformer', flip: true, car: 30,
    a: { hip: [168, 62, 'c'], torso: 172, legTo: [212, 88], leg2To: [212, 88], uarm: 262, farm: 266 },
    b: { car: 8, hip: [172, 44, 'c'], torso: 205, legTo: [212, 88], leg2To: [212, 88], uarm: 262, farm: 266 } },
  'quadruped-carriage': { label: 'Hands and knees on the carriage', ctx: 'reformer', flip: true,
    a: { hip: [168, 56, 'c'], torso: 180, thigh: 268, shin: 0, thigh2: 268, shin2: 0, uarm: 268, farm: 270 },
    b: { thigh2: 358, shin2: 2 } },
  'cat-carriage': { label: 'Hands and knees, hands on the footbar, spine rounding', ctx: 'reformer',
    a: { hip: [162, 56, 'c'], torso: 12, thigh: 275, shin: 185, thigh2: 275, shin2: 185, armTo: BAR },
    b: { torso: 20, curl: 34, armTo: BAR } },
  'rest-carriage': { label: 'Sitting back on the heels, arms long to the footbar', ctx: 'reformer',
    a: { hip: [158, 60, 'c'], torso: 18, thigh: 280, shin: 185, thigh2: 280, shin2: 185, armTo: BAR },
    b: { car: 20, hip: [156, 70, 'c'], torso: 6, curl: 18, thigh: 340, shin: 182, thigh2: 340, shin2: 182, armTo: BAR } },

  'prone-long-box-lift': { label: 'Face down on the long box, hands by the ears, chest lifting', ctx: 'reformer', flip: true, box: 'long',
    a: { hip: [150, BOX_Y, 'c'], torso: 180, thigh: 0, shin: 0, thigh2: 0, shin2: 0, uarm: 200, farm: 130 },
    b: { torso: 160, thigh2: 10, shin2: 10, uarm: 185, farm: 115 } },
  'kneel-up-pull-back': { label: 'Kneeling upright facing the straps, straight arms pulling back', ctx: 'reformer', flip: true, strap: 'hand', car: 10,
    a: { hip: [150, KNEEL_Y, 'c'], torso: 90, thigh: 270, shin: 0, thigh2: 270, shin2: 0, uarm: 212, farm: 205 },
    b: { car: 22, uarm: 292, farm: 288 } },
  'supine-overhead': { label: 'On the back, hands in the straps, legs going over the head', ctx: 'reformer', strap: 'hand', car: 10,
    a: { hip: [166, CAR_Y, 'c'], torso: 180, thigh: 60, shin: 60, thigh2: 60, shin2: 60, uarm: 95, farm: 95 },
    b: { car: 20, hip: [150, 52, 'c'], torso: 232, thigh: 172, shin: 172, thigh2: 172, shin2: 172, uarm: 4, farm: 0 } },
  'supine-jackknife': { label: 'On the back, hands in the straps, hips and legs lifted straight up', ctx: 'reformer', strap: 'hand', car: 10,
    a: { hip: [166, CAR_Y, 'c'], torso: 180, thigh: 88, shin: 88, thigh2: 88, shin2: 88, uarm: 95, farm: 95 },
    b: { car: 20, hip: [144, 40, 'c'], torso: 250, thigh: 96, shin: 96, thigh2: 96, shin2: 96, uarm: 4, farm: 0 } },
  'supine-corkscrew': { label: 'On the back, hands holding the frame, legs circling overhead', ctx: 'reformer',
    a: { hip: [166, CAR_Y, 'c'], torso: 180, thigh: 88, shin: 88, thigh2: 88, shin2: 88, uarm: 172, farm: 186 },
    b: { hip: [152, 56, 'c'], torso: 228, thigh: 150, shin: 150, thigh2: 132, shin2: 132, uarm: 172, farm: 186 } },
  'reverse-plank-bar': { label: 'Facing up, hands on the footbar behind, feet against the shoulder rests', ctx: 'reformer', flip: true, car: 6,
    a: { hip: [180, 56, 'c'], torso: 43, legTo: [134, 84, 'c'], leg2To: [134, 84, 'c'], armTo: BAR, elbowBend: -1 },
    b: { car: 22, hip: [176, 68, 'c'], torso: 52, legTo: [134, 84, 'c'], leg2To: [134, 84, 'c'], armTo: BAR, elbowBend: -1 } },
  'tendon-stretch': { label: 'Hands on the footbar, hips lifted above it, feet on the edge of the carriage', ctx: 'reformer', flip: true,
    a: { hip: [214, 36], torso: 203, legTo: [190, 86, 'c'], leg2To: [190, 86, 'c'], armTo: BAR, kneeBend: 1 },
    b: { car: 14, hip: [212, 30], torso: 208, legTo: [190, 86, 'c'], leg2To: [190, 86, 'c'], armTo: BAR, kneeBend: 1 } },

  // ---------------------------------------------------------------- reformer, standing
  'lunge-floor': { label: 'One foot on the floor, one on the carriage', ctx: 'reformer',
    a: { hip: [186, 50, 'c'], torso: 86, legTo: [212, 117], leg2To: [140, 84, 'c'], armTo: BAR },
    b: { car: 26, hip: [190, 64], torso: 80, legTo: [212, 117], leg2To: [140, 84, 'c'], armTo: BAR } },
  'kneel-lunge': { label: 'Kneeling lunge stretch', ctx: 'reformer',
    a: { hip: [178, 62, 'c'], torso: 84, legTo: [212, 88], thigh2: 240, shin2: 182, armTo: BAR },
    b: { car: 22, hip: [184, 68], torso: 80, legTo: [212, 88], thigh2: 215, shin2: 182, armTo: BAR } },
  'stand-side': { label: 'Standing side-on, one foot on the platform, one on the carriage', ctx: 'reformer', view: 'cam',
    a: { hip: [190, 38], torso: 90, legTo: [210, 88], leg2To: [180, 86, 'c'], uarm: 262, farm: 266, uarm2: 278, farm2: 274 },
    b: { car: 34, hip: [178, 44], legTo: [210, 88], leg2To: [180, 86, 'c'], uarm: 195, farm: 190, uarm2: 345, farm2: 350 } },
  'squat-side': { label: 'Squat, one foot on the platform, one on the carriage', ctx: 'reformer', view: 'cam', car: 16,
    a: { hip: [188, 40], torso: 90, legTo: [212, 88], leg2To: [182, 86, 'c'], uarm: 262, farm: 266, uarm2: 278, farm2: 274 },
    b: { hip: [188, 58], torso: 82, legTo: [212, 88], leg2To: [182, 86, 'c'], uarm: 350, farm: 5, uarm2: 355, farm2: 10 } },
  'splits-front': { label: 'Splits: front foot on the platform, back foot on the carriage', ctx: 'reformer',
    a: { hip: [186, 44], torso: 86, legTo: [212, 88], leg2To: [150, 84, 'c'], armTo: BAR },
    b: { car: 34, hip: [174, 62], torso: 88, legTo: [212, 88], leg2To: [150, 84, 'c'], uarm: 200, farm: 195, uarm2: 340, farm2: 345 } },
  'side-plank-carriage': { label: 'Side plank, forearm on the carriage', ctx: 'reformer', view: 'cam', car: 28,
    a: { hip: [170, 64, 'c'], torso: 165, legTo: [212, 88], leg2To: [212, 88], uarm: 265, farm: 180, uarm2: 80, farm2: 90 },
    b: { hip: [170, 58, 'c'] } },
  'snake': { label: 'Twisted pike, feet on the footbar', ctx: 'reformer', view: 'cam', car: 10,
    a: { hip: [168, 34, 'c'], torso: 215, legTo: BAR, leg2To: BAR, uarm: 262, farm: 266 },
    b: { car: 34, hip: [166, 66, 'c'], torso: 160, legTo: BAR, leg2To: BAR, uarm: 262, farm: 266 } },

  // ---------------------------------------------------------------- mat
  'mat-supine': { label: 'On the back, knees bent', ctx: 'mat',
    a: { hip: [120, MAT_Y], torso: 180, thigh: 55, shin: 300, thigh2: 55, shin2: 300, uarm: 0, farm: 0 },
    b: { thigh2: 90, shin2: 0 } },
  'mat-dead-bug': { label: 'On the back, legs in tabletop, arms up', ctx: 'mat',
    a: { hip: [120, MAT_Y], torso: 180, thigh: 90, shin: 0, thigh2: 90, shin2: 0, uarm: 90, farm: 90, uarm2: 90, farm2: 90 },
    b: { thigh: 20, shin: 20, uarm2: 170, farm2: 170 } },
  'mat-squat': { label: 'Squat', ctx: 'mat',
    a: { hip: [120, 62], torso: 90, thigh: 270, shin: 270, thigh2: 270, shin2: 270, uarm: 268, farm: 270 },
    b: { hip: [106, 84], torso: 62, legTo: [124, 113], leg2To: [124, 113], uarm: 345, farm: 350 } },
  'mat-bridge': { label: 'Bridge', ctx: 'mat',
    a: { hip: [120, MAT_Y], torso: 180, thigh: 55, shin: 300, thigh2: 55, shin2: 300, uarm: 0, farm: 0 },
    b: { hip: [124, 86], torso: 208, legTo: [148, 112], leg2To: [148, 112], uarm: -8, farm: 0 } },
  'mat-curl': { label: 'Curled up, legs in tabletop', ctx: 'mat',
    a: { hip: [120, MAT_Y], torso: 180, thigh: 90, shin: 0, thigh2: 90, shin2: 0, uarm: 0, farm: 0 },
    b: { torso: 158, curl: 28, thigh: 40, shin: 40, uarm: 10, farm: 10 } },
  'mat-legs-up': { label: 'On the back, legs to the ceiling', ctx: 'mat',
    a: { hip: [120, MAT_Y], torso: 180, thigh: 88, shin: 88, thigh2: 88, shin2: 88, uarm: 0, farm: 0 },
    b: { thigh: 40, shin: 40, thigh2: 88, shin2: 88 } },
  'mat-roll-over': { label: 'Legs overhead, weight on the shoulders', ctx: 'mat',
    a: { hip: [120, MAT_Y], torso: 180, thigh: 88, shin: 88, thigh2: 88, shin2: 88, uarm: 0, farm: 0 },
    b: { hip: [104, 76], torso: 238, thigh: 172, shin: 172, thigh2: 172, shin2: 172, uarm: 5, farm: 0 } },
  'mat-roll-up': { label: 'Rolling up to reach over the legs', ctx: 'mat',
    a: { hip: [112, MAT_Y], torso: 180, thigh: 0, shin: 0, thigh2: 0, shin2: 0, uarm: 180, farm: 180 },
    b: { torso: 62, curl: 42, uarm: 345, farm: 350 } },
  'mat-sit-tall': { label: 'Sitting tall, legs long', ctx: 'mat',
    a: { hip: [112, MAT_Y - 3], torso: 90, thigh: 0, shin: 0, thigh2: 0, shin2: 0, uarm: 0, farm: 0, uarm2: 180, farm2: 180 },
    b: { uarm: 30, farm: 30, uarm2: 210, farm2: 210 } },
  'mat-half-roll-back': { label: 'Sitting, knees bent, rolling back', ctx: 'mat',
    a: { hip: [110, MAT_Y - 3], torso: 88, thigh: 50, shin: 300, thigh2: 50, shin2: 300, uarm: 0, farm: 0 },
    b: { torso: 130, curl: 36, uarm: 10, farm: 5 } },
  'mat-teaser': { label: 'V-sit balance', ctx: 'mat',
    a: { hip: [116, MAT_Y], torso: 180, thigh: 0, shin: 0, thigh2: 0, shin2: 0, uarm: 180, farm: 180 },
    b: { torso: 128, thigh: 48, shin: 48, thigh2: 48, shin2: 48, uarm: 40, farm: 40 } },
  'mat-side-lying': { label: 'Lying on one side, top leg lifting', ctx: 'mat', view: 'cam',
    a: { hip: [120, MAT_Y - 2], torso: 180, thigh: 8, shin: 5, thigh2: 355, shin2: 355, uarm: 15, farm: 310, uarm2: 180, farm2: 176 },
    b: { thigh: 42, shin: 40 } },
  'mat-side-clam': { label: 'Lying on one side, knees bent', ctx: 'mat', view: 'cam',
    a: { hip: [124, MAT_Y - 2], torso: 180, thigh: 35, shin: 300, thigh2: 30, shin2: 295, uarm: 15, farm: 310, uarm2: 180, farm2: 176 },
    b: { thigh: 62, shin: 325 } },
  'mat-prone': { label: 'Face down, chest lifting', ctx: 'mat', flip: true,
    a: { hip: [128, MAT_Y], torso: 180, thigh: 0, shin: 0, thigh2: 0, shin2: 0, uarm: 350, farm: 172 },
    b: { torso: 152, thigh2: 12, shin2: 12, uarm: 285, farm: 185 } },
  'mat-quadruped': { label: 'Hands and knees', ctx: 'mat', flip: true,
    a: { hip: [138, 78], torso: 180, thigh: 268, shin: 0, thigh2: 268, shin2: 0, uarm: 268, farm: 270 },
    b: { thigh2: 358, shin2: 2, uarm2: 178, farm2: 180 } },
  'mat-cat': { label: 'Hands and knees, spine rounding', ctx: 'mat', flip: true,
    a: { hip: [138, 78], torso: 180, thigh: 268, shin: 0, thigh2: 268, shin2: 0, uarm: 268, farm: 270 },
    b: { torso: 172, curl: 40 } },
  'mat-plank': { label: 'Plank', ctx: 'mat', flip: true,
    a: { hip: [128, 86], torso: 168, legTo: [180, 112], leg2To: [180, 112], uarm: 262, farm: 268 },
    b: { thigh2: 15, shin2: 15 } },
  'mat-side-plank': { label: 'Side plank', ctx: 'mat', view: 'cam',
    a: { hip: [124, MAT_Y - 3], torso: 150, legTo: [176, 112], leg2To: [176, 112], uarm: 268, farm: 182, uarm2: 310, farm2: 320 },
    b: { hip: [124, 90], torso: 162, uarm: 268, farm: 182, uarm2: 85, farm2: 90 } },
  'mat-reverse-plank': { label: 'Reverse plank', ctx: 'mat',
    a: { hip: [116, MAT_Y - 3], torso: 110, thigh: 0, shin: 0, thigh2: 0, shin2: 0, uarm: 255, farm: 265 },
    b: { hip: [118, 90], torso: 160, legTo: [172, 112], leg2To: [172, 112], uarm: 265, farm: 268 } },
  'mat-kneel-rest': { label: 'Sitting back on the heels, folded forward', ctx: 'mat', flip: true,
    a: { hip: [140, 96], torso: 172, curl: 20, thigh: 195, shin: 2, thigh2: 195, shin2: 2, uarm: 185, farm: 182 } },
  'mat-kneel-side': { label: 'Kneeling on one knee and one hand, top leg long', ctx: 'mat', view: 'cam',
    a: { hip: [122, 84], torso: 168, thigh: 270, shin: 0, thigh2: 0, shin2: 0, uarm: 266, farm: 270, uarm2: 60, farm2: 150 },
    b: { thigh2: 25, shin2: 25 } },
  'mat-mermaid': { label: 'Sitting, side bend', ctx: 'mat', view: 'cam',
    a: { hip: [118, MAT_Y - 4], torso: 90, thigh: 200, shin: 350, thigh2: 340, shin2: 190, uarm: 95, farm: 95, uarm2: 300, farm2: 280 },
    b: { torso: 58, uarm: 55, farm: 35 } },
  'mat-kneel-up': { label: 'Kneeling upright, elbows by the sides', ctx: 'mat',
    a: { hip: [120, 82], torso: 90, thigh: 270, shin: 180, thigh2: 270, shin2: 180, uarm: 270, farm: 0 },
    b: { farm: 55 } },
  'mat-stand': { label: 'Standing', ctx: 'mat',
    a: { hip: [120, 62], torso: 90, thigh: 270, shin: 270, thigh2: 270, shin2: 270, uarm: 268, farm: 270 },
    b: { uarm: 5, farm: 60 } },
  'mat-stand-roll-down': { label: 'Standing, rolling down', ctx: 'mat',
    a: { hip: [120, 62], torso: 90, thigh: 270, shin: 270, thigh2: 270, shin2: 270, uarm: 268, farm: 270 },
    b: { hip: [116, 62], torso: 320, curl: 40, uarm: 270, farm: 270 } },
  'mat-stand-hinge': { label: 'Standing on one leg, tipping forward', ctx: 'mat',
    a: { hip: [120, 62], torso: 90, thigh: 270, shin: 270, thigh2: 262, shin2: 262, uarm: 268, farm: 270 },
    b: { torso: 20, thigh2: 200, shin2: 200, uarm: 285, farm: 290 } },
  'mat-side-plank-hold': { label: 'Side plank: hold one long line', ctx: 'mat', view: 'cam',
    a: { hip: [124, 90], torso: 162, legTo: [176, 112], leg2To: [176, 112], uarm: 268, farm: 182, uarm2: 85, farm2: 90 } },
  'mat-lunge': { label: 'Lunge', ctx: 'mat',
    a: { hip: [120, 62], torso: 90, thigh: 270, shin: 270, thigh2: 268, shin2: 268, uarm: 268, farm: 270 },
    b: { hip: [118, 80], legTo: [142, 113], thigh2: 235, shin2: 190 } }
};

// ---------------------------------------------------------------- one picture per movement
// A shared position is not enough when two movements do different things in it. Each entry below starts
// from a position above and says what this movement's start, middle (when it helps) and finish look like.
const V = (base, label, o = {}) => {
  const p = POSES[base];
  return { ...p, ...o, label, a: { ...p.a, ...(o.a || {}) }, m: o.m || null, b: 'b' in o ? o.b : p.b };
};
const UP = { hip: [150, 52, 'c'], torso: 232 }; // rolled up onto the shoulders on the carriage
Object.assign(POSES, {
  // ---- reformer, on the back
  'running': V('supine-footbar', 'On the back, carriage pressed out: one heel drops under the bar as the other knee bends', { car: 17, frames: ['One side', 'The other'],
    a: { legTo: [207, 72], foot: 110, leg2To: [193, 57], foot2: 325 }, b: { legTo: [193, 57], foot: 325, leg2To: [207, 72], foot2: 110 } }),
  'calf-raises': V('supine-footbar', 'On the back, legs long, carriage pressed out: heels lift and lower under the bar', { car: 17, frames: ['Heels lifted', 'Heels lowered'],
    a: { legTo: [205, 63], leg2To: [205, 63], foot: 335, foot2: 335 }, b: { legTo: [206, 74], leg2To: [206, 74], foot: 108, foot2: 108 } }),
  'hundred-reformer': V('supine-curl', 'Curled up, arms long by the hips, legs reaching out', { car: 18,
    a: { torso: 158, curl: 26, uarm: 14, farm: 14 }, b: { thigh: 40, shin: 40, thigh2: 40, shin2: 40, uarm: 355, farm: 355 } }),
  'coordination': V('supine-curl', 'Curled up: arms press down as the legs reach out, then the knees fold in', { car: 8,
    a: { torso: 158, curl: 26, uarm: 0, farm: 80 }, m: { car: 18, uarm: 352, farm: 352, thigh: 38, shin: 38, thigh2: 38, shin2: 38 }, b: { car: 18, uarm: 352, farm: 352, thigh: 102, shin: 350, thigh2: 102, shin2: 350 } }),
  'leg-lowers-straps': V('supine-curl', 'Curled up, arms held down by the hips, straight legs lower and lift', { car: 18,
    a: { torso: 158, curl: 26, thigh: 88, shin: 88, thigh2: 88, shin2: 88, uarm: 0, farm: 0 }, b: { thigh: 30, shin: 30, thigh2: 30, shin2: 30 } }),
  'arms-out-in': V('supine-arms-straps', 'On the back, legs in tabletop: long arms open out to the sides and draw back in', { car: 8,
    a: { uarm: 6, farm: 6 }, b: { car: 16, uarm: 52, farm: 52 } }),
  'supine-triceps': V('supine-arms-straps', 'On the back, upper arms down: the forearms press from vertical to long', { car: 10,
    a: { uarm: 4, farm: 88 }, b: { car: 18, uarm: 4, farm: 4 } }),
  'straps-stretches': V('supine-feet-straps', 'On the back, feet in the loops: one leg draws towards you as the other reaches away', {
    a: { thigh: 84, shin: 84, thigh2: 84, shin2: 84 }, b: { thigh: 116, shin: 116, thigh2: 38, shin2: 38 } }),
  'hamstring-curl-straps': V('supine-frog', 'On the back, feet in the loops: long legs on a diagonal, then the heels pull towards the seat', {
    a: { thigh: 42, shin: 42, thigh2: 42, shin2: 42 }, b: { thigh: 72, shin: 318, thigh2: 72, shin2: 318 } }),
  'short-spine': V('supine-roll-over', 'Feet in the loops: fold over onto the shoulders, bend the knees, roll down', { car: 12,
    a: { thigh: 40, shin: 40, thigh2: 40, shin2: 40 }, m: { ...UP, car: 6, thigh: 152, shin: 152, thigh2: 152, shin2: 152, uarm: 5, farm: 0 }, b: { hip: [160, 72, 'c'], torso: 196, car: 4, thigh: 118, shin: 330, thigh2: 118, shin2: 330 } }),
  'long-spine': V('supine-roll-over', 'Feet in the loops: straight legs lift and the spine rolls up onto the shoulders', { car: 12,
    a: { thigh: 86, shin: 86, thigh2: 86, shin2: 86 }, b: { ...UP, car: 6, thigh: 96, shin: 96, thigh2: 96, shin2: 96, uarm: 5, farm: 0 } }),
  'semi-circle': V('supine-bridge', 'Bridge with feet on the footbar: press out, lower the spine, come in and roll up', {
    a: { hip: [176, 62, 'c'], torso: 207, uarm: -10 }, m: { car: 16, hip: [176, 62, 'c'], torso: 207 }, b: { car: 16, hip: [174, 82, 'c'], torso: 184 } }),
  // ---- reformer, long box
  'swimming-long-box': V('prone-long-box-lift', 'Face down on the long box, chest lifted: opposite arm and leg lift, then switch', { frames: ['One side', 'The other'],
    a: { torso: 166, uarm: 170, farm: 170, uarm2: 194, farm2: 194, thigh: 352, shin: 352, thigh2: 13, shin2: 13 }, b: { uarm: 194, farm: 194, uarm2: 170, farm2: 170, thigh: 13, shin: 13, thigh2: 352, shin2: 352 } }),
  'backstroke': V('teaser-box', 'On the back on the long box, curled up: reach up, open, and circle to a long line', { car: 8,
    a: { torso: 164, curl: 22, thigh: 106, shin: 345, thigh2: 106, shin2: 345, uarm: 100, farm: 186 }, m: { car: 14, thigh: 84, shin: 84, thigh2: 84, shin2: 84, uarm: 92, farm: 92 }, b: { car: 20, thigh: 22, shin: 22, thigh2: 22, shin2: 22, uarm: 6, farm: 6 } }),
  'breaststroke-box': V('prone-long-box', 'Face down on the long box: reach forward, then sweep the arms to the hips as the chest lifts', { car: 8,
    a: { uarm: 250, farm: 172 }, m: { car: 16, uarm: 178, farm: 178 }, b: { car: 24, torso: 165, uarm: 356, farm: 356 } }),
  'grasshopper': V('prone-long-box-bar', 'Face down on the long box, hands on the footbar: the chest lowers as the legs sweep up and bend', {
    b: { car: 22, torso: 6, thigh: 160, shin: 108, thigh2: 160, shin2: 108, armTo: BAR } }),
  'horseback': V('sit-box-face-bar', 'Astride the long box: squeeze, lift the seat and reach the arms forward', {
    a: { torso: 88, uarm: 280, farm: 284 }, b: { car: 22, hip: [140, SEAT_BOX - 5, 'c'], uarm: 20, farm: 20 } }),
  'salute': V('sit-box-face-bar', 'Sitting on the long box, tipped forward: hands at the forehead press out along the diagonal', {
    a: { torso: 62, uarm: 28, farm: 165 }, b: { car: 22, uarm: 58, farm: 58 } }),
  'serve-a-tray': V('sit-box-face-bar', 'Sitting on the long box, elbows by the waist: the forearms slide straight forward', {
    a: { torso: 88, uarm: 268, farm: 2 }, b: { car: 22, uarm: 335, farm: 2 } }),
  // ---- reformer, kneeling
  'knee-pulls': V('quadruped-carriage', 'Hands on the frame, knees on the carriage: the knees pull in towards the wrists', {
    a: { hip: [176, 56, 'c'], torso: 178, armTo: [140, 96] }, b: { car: 14, torso: 170, curl: 34, armTo: [140, 96], thigh: 286, shin: 0, thigh2: 286, shin2: 0 } }),
  'cat-cow-carriage': V('cat-carriage', 'On hands and knees: the spine arches, then rounds', { frames: ['Arch', 'Round'], a: { curl: -12 } }),
  'thread-carriage': V('cat-carriage', 'On hands and knees: one arm threads under as that shoulder lowers', {
    b: { torso: 2, curl: 12, armTo: BAR, uarm2: 252, farm2: 205 } }),
  'draw-a-sword': V('kneel-side', 'Kneeling side-on: the hand starts at the far hip, pulls up across the body and reaches on a high diagonal', {
    a: { uarm: 250, farm: 200 }, m: { car: 15, uarm: 335, farm: 95 }, b: { car: 20, uarm: 42, farm: 42 } }),
  'external-rotation': V('kneel-side', 'Kneeling side-on, elbow at the waist: the forearm swings away from the body', {
    a: { uarm: 270, farm: 182 }, b: { car: 18, uarm: 270, farm: 358 } }),
  'internal-rotation': V('kneel-side', 'Kneeling side-on, elbow at the waist: the forearm swings in across the stomach', {
    a: { uarm: 270, farm: 358 }, b: { car: 18, uarm: 270, farm: 182 } }),
  'kneeling-rotation': V('kneel-side', 'Kneeling side-on, both hands on one strap: the ribs turn away and return', {
    a: { uarm: 300, farm: 205, uarm2: 240, farm2: 335 }, b: { car: 20, uarm: 348, farm: 0, uarm2: 305, farm2: 5 } }),
  'side-triceps': V('kneel-side', 'Kneeling, tipped to the side with one hand down: the top arm bends and presses long overhead', {
    a: { torso: 118, uarm2: 246, farm2: 262, uarm: 122, farm: 12 }, b: { car: 18, uarm: 122, farm: 122 } }),
  'side-arc': V('kneel-side', 'Kneeling side-on: a softly curved arm lifts from shoulder height to above the head', {
    a: { uarm: 2, farm: 12 }, b: { car: 18, uarm: 78, farm: 102 } }),
  'hug-a-tree': V('kneel-face-bar', 'Kneeling with your back to the straps: rounded arms open wide, then close in front', { frames: ['Open', 'Closed'],
    a: { uarm: 345, farm: 62 }, b: { car: 22, uarm: 352, farm: 350 } }),
  'arm-circles-front': V('kneel-face-bar', 'Kneeling with your back to the straps: long arms travel from the hips forward and up', {
    a: { uarm: 264, farm: 260 }, m: { car: 16, uarm: 0, farm: 0 }, b: { car: 22, uarm: 82, farm: 86 } }),
  'chest-press': V('kneel-face-bar', 'Kneeling with your back to the straps: bent elbows press the hands straight forward', {
    a: { uarm: 248, farm: 18 }, b: { car: 22, uarm: 355, farm: 0 } }),
  'offering': V('kneel-face-bar', 'Kneeling with your back to the straps: elbows at the waist, palms up, forearms reach forward', {
    a: { uarm: 268, farm: 2 }, b: { car: 22, uarm: 345, farm: 2 } }),
  'shave': V('kneel-face-bar', 'Kneeling, tipped forward: hands behind the head press up along the diagonal', {
    a: { torso: 76, uarm: 58, farm: 205 }, b: { car: 22, uarm: 64, farm: 64 } }),
  'arm-circles-back': V('kneel-face-straps', 'Kneeling facing the straps: long arms lift forward and up, then press down to the hips', {
    a: { uarm: 186, farm: 186 }, m: { car: 16, uarm: 102, farm: 98 }, b: { car: 22, uarm: 278, farm: 274 } }),
  'biceps-curl': V('kneel-face-straps', 'Kneeling facing the straps, arms long in front: the elbows bend to bring the hands in', {
    a: { uarm: 196, farm: 192 }, b: { car: 22, uarm: 196, farm: 78 } }),
  'kneeling-row': V('kneel-face-straps', 'Kneeling facing the straps: the elbows draw back past the ribs', {
    a: { uarm: 198, farm: 192 }, b: { car: 22, uarm: 318, farm: 192 } }),
  'triceps-press-back': V('kneel-face-straps', 'Kneeling facing the straps, tipped forward, elbows by the ribs: the arms straighten behind you', {
    a: { torso: 110, uarm: 332, farm: 205 }, b: { car: 22, uarm: 336, farm: 336 } }),
  'shoulder-retraction': V('kneel-face-straps', 'Kneeling facing the straps, long arms by the hips: the arms press a little behind as the shoulder blades draw together', {
    a: { uarm: 266, farm: 268 }, b: { car: 16, uarm: 292, farm: 290 } }),
  'kneeling-long-stretch': V('knee-stretch', 'Knees on the carriage, hands on the footbar: straight arms push the body away and pull it back', {
    a: { hip: [166, 54, 'c'], torso: 18, thigh: 262, shin: 185, thigh2: 262, shin2: 185 }, b: { car: 22, hip: [166, 60, 'c'], torso: 10, thigh: 234, shin: 185, thigh2: 234, shin2: 185, armTo: BAR } }),
  // ---- reformer, hands on the bar or platform
  'up-stretch': V('pike-bar', 'Hands on the footbar: from a pike, travel out to a plank and lift back up', { frames: ['Pike', 'Plank'],
    b: { car: 28, hip: [184, 59, 'c'], torso: 10, thigh: 191, shin: 191, thigh2: 191, shin2: 191, armTo: BAR } }),
  'jackrabbit': V('pike-bar', 'Hands on the footbar, feet at the shoulder rests: knees tuck under a rounded back, then push out to a plank', { car: 6, frames: ['Tuck', 'Plank'],
    a: { hip: [156, 44, 'c'], torso: 348, curl: 30, legTo: [133, 84, 'c'], leg2To: [133, 84, 'c'] }, b: { car: 28, hip: [184, 59, 'c'], torso: 10, curl: 0, legTo: [133, 84, 'c'], leg2To: [133, 84, 'c'], armTo: BAR } }),
  'reformer-pike': V('plank-platform', 'Hands on the platform, feet on the carriage: from plank, the hips lift to a pike', { frames: ['Plank', 'Pike'],
    b: { car: 4, hip: [178, 36, 'c'], torso: 322, thigh: 258, shin: 258, thigh2: 258, shin2: 258, armTo: [212, 88] } }),
  'reformer-plank': V('plank-platform', 'Hands on the platform, feet on the carriage: hold the plank', { b: null }),
  'scooter': V('lunge-floor', 'One foot on the platform, hands on the footbar: the other leg pushes the carriage back from the hip', {
    a: { hip: [190, 50], torso: 52, legTo: [212, 88], leg2To: [166, 86, 'c'], armTo: BAR }, b: { car: 26, hip: [190, 50], torso: 52, legTo: [212, 88], leg2To: [166, 86, 'c'], armTo: BAR } }),
  'carriage-lunge': V('splits-front', 'Front foot on the platform, back foot on the carriage: the back leg slides away into a lunge', {
    b: { car: 22, hip: [178, 60], torso: 86, legTo: [212, 88], leg2To: [150, 84, 'c'], uarm: 280, farm: 300 } }),
  'skater': V('squat-side', 'Low squat, one foot on the platform: the other leg presses the carriage out to the side', { car: 2,
    a: { hip: [190, 56], torso: 80, uarm: 350, farm: 20, uarm2: 355, farm2: 25 }, b: { car: 26, hip: [190, 56], torso: 80 } }),
  'star': V('side-plank-carriage', 'Side plank, hand on the footbar: the top arm and leg lift into a star', {
    a: { hip: [170, 58, 'c'] }, b: { hip: [170, 56, 'c'], thigh2: 208, shin2: 208, uarm2: 84, farm2: 88 } }),
  'side-lying-inner-thigh': V('side-lying-strap', 'On your side, top foot in the loop: the long top leg draws down to meet the bottom leg', {
    a: { thigh: 30, shin: 30 }, b: { thigh: 352, shin: 352 } }),
  'side-lying-jumps': V('side-lying-footbar', 'On your side, top foot on the jump board: the top leg jumps and lands', { board: true,
    a: { legTo: [206, 66] }, b: { car: 28, thigh: 8, shin: 8 } }),
  // ---- reformer, sitting
  'rowing-back': V('sit-carriage-face-straps', 'Sitting facing the straps: roll back, open the arms, fold forward and circle round', {
    a: { uarm: 248, farm: 100 }, m: { car: 22, torso: 62, curl: 28, uarm: 250, farm: 160 }, b: { car: 16, torso: 150, curl: 30, uarm: 338, farm: 338 } }),
  'short-box-round': V('short-box', 'Sitting on the short box, feet under the strap: the spine curls back and rolls up', { b: { torso: 140, curl: 34, uarm: 300, farm: 120 } }),
  'short-box-flat': V('short-box', 'Sitting on the short box, arms overhead: hinge back in one long line', {
    a: { uarm: 90, farm: 90 }, b: { torso: 126, uarm: 126, farm: 126 } }),
  'short-box-twist': V('short-box', 'Sitting on the short box, hands behind the head: turn, then lean back on the diagonal', {
    a: { uarm: 62, farm: 172 }, b: { torso: 128, uarm: 100, farm: 208 } }),
  'short-box-world': V('short-box', 'Sitting on the short box, arms overhead: lean, travel round through the back and come up', {
    a: { uarm: 90, farm: 90 }, m: { torso: 112, uarm: 112, farm: 112 }, b: { torso: 142, uarm: 142, farm: 142 } }),
  'short-box-tree': V('short-box', 'Sitting on the short box holding one straight leg: walk the hands down it as the spine rolls back', {
    a: { leg2To: null, thigh2: 48, shin2: 48, uarm: 15, farm: 40 }, b: { torso: 148, curl: 20, thigh2: 78, shin2: 78, uarm: 50, farm: 80 } }),
  // ---- mat, standing
  'curl-and-press': V('mat-stand', 'Standing: curl the hands to the shoulders, then press overhead', {
    m: { uarm: 288, farm: 74 }, b: { uarm: 86, farm: 90 } }),
  'overhead-triceps': V('mat-stand', 'Standing, elbow by the ear: the arm bends behind the head and presses long', {
    a: { uarm: 78, farm: 205 }, b: { uarm: 84, farm: 88 } }),
  'arm-weights': V('mat-stand', 'Standing with light weights: curl, then reach the arms forward', {
    m: { uarm: 288, farm: 74 }, b: { uarm: 2, farm: 2 } }),
  'calf-raise-stand': V('mat-stand', 'Standing: the heels lift and lower', { frames: ['Heels down', 'Heels lifted'],
    b: { hip: [120, 57], foot: 312, foot2: 312 } }),
  'side-bend-stand': V('mat-stand', 'Standing, seen from the front: one arm reaches up and over as the ribs bend to the side', { view: 'cam',
    a: { uarm: 86, farm: 92, uarm2: 276, farm2: 272 }, b: { torso: 66, uarm: 60, farm: 48, uarm2: 280, farm2: 276 } }),
  'hip-flexor-stand': V('mat-lunge', 'A long lunge: tuck the tail, shift forward and reach the arm up and over', {
    a: { hip: [118, 80], legTo: [142, 113], thigh2: 235, shin2: 190 }, b: { hip: [122, 82], legTo: [142, 113], thigh2: 228, shin2: 188, uarm: 84, farm: 100 } }),
  'inchworm': V('mat-plank', 'From standing, fold forward and walk the hands out to a plank', {
    a: { hip: [150, 62], torso: 90, legTo: null, leg2To: null, thigh: 270, shin: 270, thigh2: 270, shin2: 270, uarm: 268, farm: 270 },
    m: { hip: [146, 62], torso: 216, curl: 30, uarm: 262, farm: 264 }, b: { hip: [102, 88], torso: 168, legTo: [150, 113], leg2To: [150, 113], uarm: 262, farm: 268 } }),
  // ---- mat, on hands and knees or in plank
  'bear-hover': V('mat-quadruped', 'On hands and knees, toes tucked: the knees lift a few centimetres and hover', {
    b: { hip: [138, 72], thigh: 262, shin: 12, thigh2: 262, shin2: 12 } }),
  'donkey-kick': V('mat-quadruped', 'On hands and knees: one bent leg presses the sole of the foot to the ceiling', {
    b: { thigh2: 4, shin2: 92 } }),
  'cat-cow-mat': V('mat-cat', 'On hands and knees: the spine arches, then rounds', { frames: ['Arch', 'Round'], a: { curl: -12 } }),
  'thread-mat': V('mat-cat', 'On hands and knees: one arm opens to the ceiling, then threads under', {
    m: { uarm2: 96, farm2: 96 }, b: { torso: 190, curl: 10, uarm2: 345, farm2: 350 } }),
  'plank-hold': V('mat-plank', 'Plank: hold one long line from head to heels', { b: null }),
  'push-up': V('mat-plank', 'Plank: the elbows bend back along the ribs and press up', {
    a: { armTo: [92, 112] }, b: { hip: [128, 99], torso: 176, armTo: [92, 112], legTo: [180, 112], leg2To: [180, 112] } }),
  'leg-pull-back': V('mat-reverse-plank', 'Reverse plank: one straight leg kicks up and lowers', {
    a: { hip: [118, 90], torso: 160, legTo: [172, 112], leg2To: [172, 112], uarm: 265, farm: 268 }, b: { thigh2: 48, shin2: 48 } }),
  'side-twist': V('mat-side-plank', 'Side plank: open the chest, then thread the top arm under as the hips lift', {
    a: { hip: [124, 90], torso: 162, uarm2: 85, farm2: 90 }, b: { hip: [124, 80], torso: 172, uarm2: 262, farm2: 205 } }),
  // ---- mat, on the back
  'toe-taps': V('mat-supine', 'On the back, legs in tabletop: one bent leg lowers to tap the toes and lifts', {
    a: { thigh: 90, shin: 0, thigh2: 90, shin2: 0 }, b: { thigh2: 56, shin2: 300 } }),
  'imprint': V('mat-supine', 'On the back, knees bent: the pelvis rocks between neutral and a small tuck', { b: null }),
  'shoulder-bridge': V('mat-bridge', 'Bridge: one leg lifts to the ceiling and lowers while the hips stay level', {
    a: { hip: [124, 86], torso: 208, legTo: [148, 112], leg2To: [148, 112], uarm: -8 }, b: { thigh2: 82, shin2: 82 } }),
  'ab-curl-mat': V('mat-curl', 'On the back, knees bent, hands behind the head: the head and shoulders curl up', {
    a: { thigh: 55, shin: 300, thigh2: 55, shin2: 300, uarm: 122, farm: 205 }, b: { torso: 158, curl: 28, uarm: 100, farm: 190 } }),
  'hundred-mat': V('mat-curl', 'Curled up, arms long by the hips, legs reaching out', {
    a: { torso: 158, curl: 28, uarm: 14, farm: 14 }, b: { thigh: 40, shin: 40, thigh2: 40, shin2: 40, uarm: 356, farm: 356 } }),
  'single-leg-stretch': V('mat-curl', 'Curled up: one knee draws in as the other leg reaches long, then switch', { frames: ['One side', 'The other'],
    a: { torso: 158, curl: 28, thigh: 112, shin: 342, thigh2: 34, shin2: 34, uarm: 22, farm: 62 }, b: { thigh: 34, shin: 34, thigh2: 112, shin2: 342 } }),
  'double-leg-stretch': V('mat-curl', 'Curled up: hug the knees, then reach arms and legs away', {
    a: { torso: 158, curl: 28, thigh: 112, shin: 342, thigh2: 112, shin2: 342, uarm: 22, farm: 62 }, b: { thigh: 40, shin: 40, thigh2: 40, shin2: 40, uarm: 152, farm: 152 } }),
  'criss-cross': V('mat-curl', 'Curled up, hands behind the head: the ribs turn to the bent knee, then switch', { frames: ['One side', 'The other'],
    a: { torso: 158, curl: 28, thigh: 112, shin: 342, thigh2: 34, shin2: 34, uarm: 100, farm: 190 }, b: { thigh: 34, shin: 34, thigh2: 112, shin2: 342 } }),
  'scissors': V('mat-legs-up', 'Curled up: hold one straight leg close as the other reaches long, then switch', { frames: ['One side', 'The other'],
    a: { torso: 160, curl: 26, thigh: 96, shin: 96, thigh2: 28, shin2: 28, uarm: 62, farm: 82 }, b: { thigh: 28, shin: 28, thigh2: 96, shin2: 96 } }),
  'double-leg-lower': V('mat-legs-up', 'Curled up, hands behind the head: both straight legs lower and lift', {
    a: { torso: 160, curl: 26, uarm: 100, farm: 190 }, b: { thigh: 34, shin: 34, thigh2: 34, shin2: 34 } }),
  'one-leg-circle': V('mat-legs-up', 'On the back, one leg long on the mat: the other draws a circle from the hip', {
    a: { thigh2: 0, shin2: 0 }, b: { thigh: 62, shin: 62, thigh2: 0, shin2: 0 } }),
  'corkscrew-mat': V('mat-legs-up', 'On the back, legs together to the ceiling: both legs circle down and round', {
    b: { thigh: 54, shin: 54, thigh2: 54, shin2: 54 } }),
  'jackknife-mat': V('mat-roll-over', 'Roll over, then shoot the legs up over the shoulders', {
    m: { hip: [104, 76], torso: 238, thigh: 172, shin: 172, thigh2: 172, shin2: 172, uarm: 5, farm: 0 }, b: { hip: [100, 66], torso: 250, thigh: 96, shin: 96, thigh2: 96, shin2: 96, uarm: 5, farm: 0 } }),
  'neck-pull': V('mat-roll-up', 'On the back, hands behind the head: roll up and fold forward', {
    a: { uarm: 140, farm: 205 }, b: { torso: 62, curl: 42, uarm: 80, farm: 170 } }),
  // ---- mat, sitting
  'rolling-ball': V('mat-half-roll-back', 'Balanced in a tight tuck: roll back to the shoulder blades and up', {
    a: { torso: 106, curl: 36, thigh: 82, shin: 300, thigh2: 82, shin2: 300, uarm: 330, farm: 22 }, b: { hip: [98, 84], torso: 206, curl: 36, thigh: 152, shin: 22, thigh2: 152, shin2: 22, uarm: 60, farm: 110 } }),
  'seal': V('mat-half-roll-back', 'Balanced, hands holding the ankles from inside: clap the feet, roll back and up', {
    a: { torso: 106, curl: 36, thigh: 72, shin: 318, thigh2: 72, shin2: 318, uarm: 342, farm: 12 }, b: { hip: [98, 84], torso: 206, curl: 36, thigh: 142, shin: 28, thigh2: 142, shin2: 28, uarm: 55, farm: 95 } }),
  'oblique-roll-back': V('mat-half-roll-back', 'Roll back, then turn the ribs and reach one arm behind', {
    m: { torso: 130, curl: 36, uarm: 10, farm: 5 }, b: { torso: 130, curl: 36, uarm: 10, farm: 5, uarm2: 205, farm2: 200 } }),
  'saw': V('mat-sit-tall', 'Sitting tall, arms wide: twist and reach the front hand past the foot', {
    b: { torso: 52, curl: 30, uarm: 350, farm: 350, uarm2: 162, farm2: 162 } }),
  'spine-stretch': V('mat-sit-tall', 'Sitting tall, arms forward: curl the spine forward and stack back up', {
    a: { uarm: 0, farm: 0, uarm2: undefined, farm2: undefined }, b: { torso: 56, curl: 40, uarm: 356, farm: 356 } }),
  'shoulder-glides': V('mat-sit-tall', 'Sitting tall, arms forward: the shoulder blades glide up and down, forward and back', {
    a: { uarm: 0, farm: 0, uarm2: undefined, farm2: undefined }, b: null }),
  'open-leg-rocker': V('mat-teaser', 'Balanced in a V holding the ankles: rock back to the shoulders and up', {
    a: { hip: [116, MAT_Y - 2], torso: 118, curl: 14, thigh: 52, shin: 52, thigh2: 52, shin2: 52, uarm: 28, farm: 58 }, b: { hip: [102, 84], torso: 214, curl: 14, thigh: 146, shin: 146, thigh2: 146, shin2: 146, uarm: 120, farm: 150 } }),
  'hip-twist': V('mat-teaser', 'Leaning back on straight arms, legs in a V: the legs circle down, round and up', {
    a: { hip: [116, MAT_Y - 2], torso: 124, thigh: 52, shin: 52, thigh2: 52, shin2: 52, uarm: 236, farm: 250 }, b: { thigh: 20, shin: 20, thigh2: 20, shin2: 20 } }),
  'boomerang': V('mat-teaser', 'Roll over, roll up to a balanced V, then fold forward with the arms sweeping behind', {
    a: { hip: [104, 76], torso: 238, thigh: 172, shin: 172, thigh2: 172, shin2: 172, uarm: 5, farm: 0 },
    m: { hip: [116, MAT_Y - 2], torso: 125, thigh: 48, shin: 48, thigh2: 48, shin2: 48, uarm: 300, farm: 300 },
    b: { hip: [116, MAT_Y - 3], torso: 42, curl: 36, thigh: 0, shin: 0, thigh2: 0, shin2: 0, uarm: 168, farm: 150 } }),
  // ---- mat, face down or on the side
  'swan-prep': V('mat-prone', 'Face down, hands under the shoulders: the chest lifts and lowers', { b: { torso: 157, uarm: 285, farm: 185 } }),
  'swan-dive': V('mat-prone', 'Face down: press up into a high arch, then rock forward as the legs lift', {
    a: { torso: 142, uarm: 264, farm: 268 }, b: { torso: 174, thigh: 26, shin: 26, thigh2: 26, shin2: 26, uarm: 176, farm: 176 } }),
  'swimming-mat': V('mat-prone', 'Face down, chest lifted: opposite arm and leg lift, then switch', { frames: ['One side', 'The other'],
    a: { torso: 166, uarm: 170, farm: 170, uarm2: 194, farm2: 194, thigh: 352, shin: 352, thigh2: 13, shin2: 13 }, b: { uarm: 194, farm: 194, uarm2: 170, farm2: 170, thigh: 13, shin: 13, thigh2: 352, shin2: 352 } }),
  'double-leg-kick': V('mat-prone', 'Face down, hands on the low back: kick both heels to the seat, then reach long and lift the chest', {
    a: { uarm: 340, farm: 205, thigh: 0, shin: 100, thigh2: 0, shin2: 100 }, b: { torso: 156, thigh: 4, shin: 4, thigh2: 4, shin2: 4, uarm: 352, farm: 352 } }),
  'single-leg-kick': V('mat-prone', 'Propped on the forearms: one heel kicks to the seat, then the other', { frames: ['One side', 'The other'],
    a: { torso: 152, uarm: 252, farm: 176, thigh: 0, shin: 100, thigh2: 0, shin2: 0 }, b: { thigh: 0, shin: 0, thigh2: 0, shin2: 100 } }),
  'breaststroke-mat': V('mat-prone', 'Face down: arms reach forward, then sweep wide to the hips as the chest lifts', {
    a: { uarm: 180, farm: 180 }, b: { torso: 160, uarm: 356, farm: 356 } }),
  'heel-squeeze': V('mat-prone', 'Face down, knees bent and wide, heels together: the heels press into each other', {
    a: { uarm: 200, farm: 105, thigh: 0, shin: 82, thigh2: 0, shin2: 82 }, b: null }),
  'rocking': V('mat-prone', 'Face down, holding the ankles: lift into a bow and rock forward and back', {
    a: { torso: 150, thigh: 20, shin: 122, thigh2: 20, shin2: 122, uarm: 346, farm: 346 }, b: { torso: 166, thigh: 36, shin: 138, thigh2: 36, shin2: 138 } }),
  'chest-opening': V('mat-side-clam', 'On your side, knees bent, arms together in front: the top arm opens like a book', {
    b: { uarm: 108, farm: 150 } }),
  // ---- movements added in 0.6
  'high-scissors': V('mat-roll-over', 'Up on the shoulders, hands under the hips: straight legs split and switch', { frames: ['One side', 'The other'],
    a: { hip: [104, 74], torso: 240, thigh: 134, shin: 134, thigh2: 42, shin2: 42, uarm: 0, farm: 72 }, b: { thigh: 42, shin: 42, thigh2: 134, shin2: 134 } }),
  'high-bicycle': V('mat-roll-over', 'Up on the shoulders, hands under the hips: one leg reaches away and bends under as the other comes over', { frames: ['One side', 'The other'],
    a: { hip: [104, 74], torso: 240, thigh: 134, shin: 134, thigh2: 48, shin2: 318, uarm: 0, farm: 72 }, b: { thigh: 48, shin: 318, thigh2: 134, shin2: 134 } }),
  'crab': V('mat-half-roll-back', 'A tight tuck with crossed ankles: roll back, then forward until the head touches the mat', {
    a: { torso: 106, curl: 36, thigh: 78, shin: 305, thigh2: 78, shin2: 305, uarm: 335, farm: 15 },
    m: { hip: [98, 84], torso: 206, curl: 36, thigh: 150, shin: 24, thigh2: 150, shin2: 24, uarm: 60, farm: 105 },
    b: { hip: [104, 80], torso: 328, curl: 38, thigh: 292, shin: 200, thigh2: 292, shin2: 200, uarm: 312, farm: 30 } }),
  'control-balance': V('mat-roll-over', 'Rolled over with the feet behind the head: one leg reaches to the ceiling while the hands hold the other ankle', {
    a: { hip: [104, 76], torso: 238, thigh: 172, shin: 172, thigh2: 172, shin2: 172, uarm: 5, farm: 0 }, b: { hip: [100, 70], torso: 245, thigh: 176, shin: 176, thigh2: 94, shin2: 94, uarm: 168, farm: 160 } }),
  'knee-folds': V('mat-supine', 'On the back, knees bent: one knee floats up to tabletop and lowers', {}),
  'supine-twist': V('mat-supine', 'On the back, knees together: both knees sway to one side and return', {
    a: { thigh: 62, shin: 300, thigh2: 62, shin2: 300, uarm: 95, farm: 95 }, b: { thigh: 22, shin: 318, thigh2: 30, shin2: 322 } }),
  'chest-lift-rotation': V('mat-curl', 'Curled up with hands behind the head: the ribs turn to one side and back', {
    a: { torso: 158, curl: 28, thigh: 55, shin: 300, thigh2: 55, shin2: 300, uarm: 100, farm: 190 }, b: { torso: 152, curl: 32, uarm: 64, farm: 178, uarm2: 126, farm2: 205 } }),
  'leg-slides': V('mat-supine', 'On the back, knees bent: one heel slides away until the leg is long, then home', {
    b: { thigh2: 0, shin2: 0 } }),
  'arm-arcs': V('mat-supine', 'On the back, arms to the ceiling: both arms arc back overhead and return', {
    a: { uarm: 90, farm: 90 }, b: { uarm: 166, farm: 170 } }),
  'thigh-stretch-mat': V('mat-kneel-up', 'Kneeling upright, arms forward: hinge back from the knees in one line', {
    a: { uarm: 0, farm: 0 }, b: { hip: [113, 83], torso: 105, thigh: 285, thigh2: 285, uarm: 12, farm: 12 } }),
  'pelvic-lift': V('supine-bridge', 'On the back, arches on the footbar, tail just off the carriage: press out and in holding the lift', {
    a: { hip: [173, 74, 'c'], torso: 191, uarm: -4 }, b: { car: 17, hip: [173, 74, 'c'], torso: 191 } }),
  'supine-arm-circles': V('supine-arms-straps', 'On the back, legs in tabletop: arms press to the hips, open to the sides and return to the ceiling', { car: 8, frames: ['Up', 'Down', 'Open'],
    a: { uarm: 96, farm: 96 }, m: { car: 20, uarm: 3, farm: 3 }, b: { car: 15, uarm: 50, farm: 50 } }),
  'kneeling-side-splits': V('stand-side', 'Kneeling side-on, one knee on the platform and one on the carriage: the carriage knee slides out and the inner thighs draw it home', {
    a: { hip: [192, 62], torso: 90, legTo: null, leg2To: null, thigh: 292, shin: 112, thigh2: 248, shin2: 68, uarm: 248, farm: 300, uarm2: 292, farm2: 240 },
    b: { car: 22, hip: [181, 69], thigh: 319, shin: 139, thigh2: 219, shin2: 39, uarm: 248, farm: 300, uarm2: 292, farm2: 240 } }),
  'mountain-climbers': V('plank-platform', 'Plank, hands on the platform and feet on the carriage: one knee drives in, then the other', { car: 26, frames: ['One side', 'The other'],
    a: { thigh: 246, shin: 188 }, b: { thigh: 192, shin: 192, thigh2: 246, shin2: 188 } }),
  'curtsy-lunge': V('lunge-floor', 'One foot on the floor beside the footbar: the carriage leg travels back and across behind as the standing leg bends', {
    a: { hip: [188, 50], torso: 84, legTo: [210, 117], leg2To: [168, 86, 'c'], armTo: BAR }, b: { car: 22, hip: [188, 64], torso: 76, legTo: [210, 117], leg2To: [168, 86, 'c'], armTo: BAR } })
});

export const POSE_IDS = Object.keys(POSES);

const rad = (d) => (d * Math.PI) / 180;
const step = (p, len, deg) => [p[0] + len * Math.cos(rad(deg)), p[1] - len * Math.sin(rad(deg))];

// Two-bone reach: where the middle joint goes so a limb of lengths l1 + l2 ends at the target.
function reach(from, to, l1, l2, bend) {
  const dx = to[0] - from[0]; const dy = to[1] - from[1];
  let d = Math.hypot(dx, dy) || 0.001;
  const max = l1 + l2 - 0.5;
  const end = d > max ? [from[0] + (dx / d) * max, from[1] + (dy / d) * max] : to;
  d = Math.min(d, max);
  const a = Math.acos(Math.max(-1, Math.min(1, (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d))));
  const base = Math.atan2(end[1] - from[1], end[0] - from[0]);
  const ang = base + bend * a;
  return { mid: [from[0] + l1 * Math.cos(ang), from[1] + l1 * Math.sin(ang)], end };
}

const at = (pt, car) => (pt[2] === 'c' ? [pt[0] - car, pt[1]] : [pt[0], pt[1]]);

// Work out every joint for one frame of a pose.
// A later frame is the start frame with its changes on top. Giving a limb angles in a later frame
// lets go of any point that limb was reaching for in the start frame.
function merge(a, x) {
  const f = { ...a, ...x };
  for (const [ang, to] of [['thigh', 'legTo'], ['thigh2', 'leg2To'], ['uarm', 'armTo'], ['uarm2', 'arm2To']]) if (ang in x && !(to in x)) delete f[to];
  return f;
}

export function solve(pose, frame) {
  const part = frame === 'b' ? pose.b : frame === 'm' ? pose.m : null;
  const f = part ? merge(pose.a, part) : pose.a;
  const car = part && part.car !== undefined ? part.car : (pose.car || 0);
  const hip = at(f.hip, car);
  // A curled spine is drawn as a bend: the shoulder sits off the straight line.
  const sh = step(hip, LEN.torso, f.torso);
  // The front of the body is to the right of the hip-to-shoulder line unless the pose is flipped.
  const curl = f.curl || 0;
  const side = pose.flip ? 1 : -1;
  const mid = step(step(hip, LEN.torso / 2, f.torso), curl * 0.28, f.torso - side * 90);
  const head = step(sh, LEN.head, f.head !== undefined ? f.head : f.torso + side * curl * 0.9);
  const leg = (toKey, thKey, shKey, bend) => {
    const toe = f[toKey === 'legTo' ? 'foot' : 'foot2']; // which way the foot points, when a pose needs to say
    if (f[toKey]) { const r = reach(hip, at(f[toKey], car), LEN.thigh, LEN.shin, bend); return { knee: r.mid, foot: r.end, toe }; }
    if (f[thKey] === undefined) return null;
    const knee = step(hip, LEN.thigh, f[thKey]);
    return { knee, foot: step(knee, LEN.shin, f[shKey] !== undefined ? f[shKey] : f[thKey]), toe };
  };
  const arm = (toKey, uKey, fKey, bend) => {
    if (f[toKey]) { const r = reach(sh, at(f[toKey], car), LEN.uarm, LEN.farm, bend); return { elbow: r.mid, hand: r.end }; }
    if (f[uKey] === undefined) return null;
    const elbow = step(sh, LEN.uarm, f[uKey]);
    return { elbow, hand: step(elbow, LEN.farm, f[fKey] !== undefined ? f[fKey] : f[uKey]) };
  };
  // Knees bend up/forward; elbows bend down/back.
  const kneeBend = f.kneeBend !== undefined ? f.kneeBend : -1;
  const elbowBend = f.elbowBend !== undefined ? f.elbowBend : 1;
  return {
    faces: pose.flip ? -1 : 1, cam: pose.view === 'cam',
    car, hip, mid, sh, head,
    leg: leg('legTo', 'thigh', 'shin', kneeBend), leg2: leg('leg2To', 'thigh2', 'shin2', kneeBend),
    arm: arm('armTo', 'uarm', 'farm', elbowBend), arm2: arm('arm2To', 'uarm2', 'farm2', elbowBend)
  };
}

// A reasonable picture for movements that don't name one (custom movements).
export function poseOf(mv) {
  if (mv && mv.pose && POSES[mv.pose]) return mv.pose;
  if (!mv) return 'mat-stand';
  const mat = mv.apparatus === 'mat';
  const eq = mv.equipment || [];
  const straps = mv.setup && mv.setup.straps && mv.setup.straps !== 'none';
  const pos = mv.position;
  if (mat) {
    return { supine: 'mat-supine', prone: 'mat-prone', 'side-lying': 'mat-side-lying', quadruped: 'mat-quadruped', plank: 'mat-plank', seated: 'mat-sit-tall', kneeling: 'mat-kneel-rest', standing: 'mat-stand', inverted: 'mat-roll-over' }[pos] || 'mat-stand';
  }
  if (eq.includes('jump_board')) return 'supine-jump';
  if (eq.includes('short_box')) return 'short-box';
  if (eq.includes('long_box')) return pos === 'seated' ? 'sit-box-face-bar' : pos === 'quadruped' ? 'quadruped-box' : 'prone-long-box';
  switch (pos) {
    case 'supine': return straps ? (mv.setup.straps === 'long' ? 'supine-feet-straps' : 'supine-arms-straps') : 'supine-footbar';
    case 'side-lying': return straps ? 'side-lying-strap' : 'side-lying-footbar';
    case 'kneeling': return straps ? 'kneel-face-straps' : 'knee-stretch';
    case 'seated': return straps ? 'sit-carriage-face-straps' : 'mermaid';
    case 'plank': return 'plank-bar';
    case 'quadruped': return 'quadruped-carriage';
    case 'standing': return 'lunge-floor';
    case 'prone': return 'prone-long-box';
    case 'inverted': return 'supine-roll-over';
    default: return 'supine-footbar';
  }
}
