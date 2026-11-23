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
  'mat-lunge': { label: 'Lunge', ctx: 'mat',
    a: { hip: [120, 62], torso: 90, thigh: 270, shin: 270, thigh2: 268, shin2: 268, uarm: 268, farm: 270 },
    b: { hip: [118, 80], legTo: [142, 113], thigh2: 235, shin2: 190 } }
};

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
export function solve(pose, frame) {
  const f = frame === 'b' && pose.b ? { ...pose.a, ...pose.b } : pose.a;
  const car = (frame === 'b' && pose.b && pose.b.car !== undefined ? pose.b.car : (pose.car || 0));
  const hip = at(f.hip, car);
  // A curled spine is drawn as a bend: the shoulder sits off the straight line.
  const sh = step(hip, LEN.torso, f.torso);
  // The front of the body is to the right of the hip-to-shoulder line unless the pose is flipped.
  const curl = f.curl || 0;
  const side = pose.flip ? 1 : -1;
  const mid = step(step(hip, LEN.torso / 2, f.torso), curl * 0.28, f.torso - side * 90);
  const head = step(sh, LEN.head, f.head !== undefined ? f.head : f.torso + side * curl * 0.9);
  const leg = (toKey, thKey, shKey, bend) => {
    if (f[toKey]) { const r = reach(hip, at(f[toKey], car), LEN.thigh, LEN.shin, bend); return { knee: r.mid, foot: r.end }; }
    if (f[thKey] === undefined) return null;
    const knee = step(hip, LEN.thigh, f[thKey]);
    return { knee, foot: step(knee, LEN.shin, f[shKey] !== undefined ? f[shKey] : f[thKey]) };
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
