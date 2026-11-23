// A plain-language guide to how OpenPilates thinks, for people who aren't Pilates teachers.
import { h } from '../ui.js';
import { store } from '../store.js';
import { BRANDS, springFor, LOAD_LEVELS } from '/shared/vocab.js';
import { figure } from '../figure.js';

const dl = (...pairs) => h('dl', null, pairs.map(([t, d]) => [h('dt', null, t), h('dd', null, d)]));

export async function guideView() {
  const room = store.roomFor({ apparatus: 'reformer' });
  const brand = BRANDS[room.brand] || BRANDS.balanced_body;
  const springs = LOAD_LEVELS.map((l) => springFor(room.brand, l, room.springOverrides)).filter((s) => !s.approx);
  return { title: 'Guide', node: h('div', { class: 'guide' },
    h('div', { class: 'page-head' }, h('div', { class: 'grow' }, h('h1', null, 'Guide'), h('p', { class: 'small muted' }, 'What the words mean and how to get from a blank page to a class you can teach.'))),

    h('section', { class: 'card stack' }, h('h2', null, 'The quick version'),
      h('ol', { class: 'steps-list' },
        h('li', null, h('b', null, 'Make a flow. '), 'Flows → New flow. Let the app draft one, or start blank.'),
        h('li', null, h('b', null, 'Fill the segments. '), 'A flow is split into segments (warm-up, legs, arms, core, stretch…). Drag movements in from the list on the left, or press + on a movement.'),
        h('li', null, h('b', null, 'Add layers and options. '), 'Press the layers button on any movement to choose the layers you\'ll teach, and the easier and harder options you\'ll offer.'),
        h('li', null, h('b', null, 'Check it. '), 'The right-hand column and the Analysis tab tell you what the class does and what to fix.'),
        h('li', null, h('b', null, 'Teach it. '), 'Press the green play button on the flow. Or print the run sheet.'))),

    h('section', { class: 'card stack' }, h('h2', null, 'The reformer'),
      h('div', { style: { maxWidth: '360px' } }, figure('supine-footbar', { width: 340 })),
      dl(['Carriage', 'The padded platform that slides. You lie, sit, kneel or stand on it.'],
        ['Footbar', 'The bar at one end that feet or hands push against.'],
        ['Springs', 'They pull the carriage back towards the footbar. More spring is usually more resistance — but for planks and balance work, less spring is harder because the carriage is free to slide.'],
        ['Straps', 'Ropes with loops for the hands (short loops) or feet (long loops). They pull from the end away from the footbar.'],
        ['Shoulder rests and headrest', 'Blocks that stop you sliding off when you push with your legs, and a small adjustable pillow.'],
        ['Long box / short box', 'A padded box. Lengthways on the carriage it is the "long box" (lie on it); crossways it is the "short box" (sit on it).'],
        ['Jump board', 'A padded board in place of the footbar, for lying-down jumping.'])),

    h('section', { class: 'card stack' }, h('h2', null, `Springs in your studio (${brand.label})`),
      h('div', { class: 'btn-row' }, springs.map((s) => h('span', { class: 'tag', style: { fontSize: '13px' } }, h('span', { style: { display: 'inline-block', width: '12px', height: '12px', borderRadius: '6px', background: s.color, border: '1px solid rgba(0,0,0,.2)', marginRight: '6px', verticalAlign: '-1px' } }), `${s.name} = ${s.level.replace('x', 'extra ')}`))),
      h('p', { class: 'small' }, 'Movements are saved with a load (light, medium, heavy) and shown in your machine\'s colours. Each movement has its ', h('b', null, 'usual'), ' springs and, often, springs ', h('b', null, 'to advance'), '.'),
      h('p', { class: 'small' }, h('b', null, 'Spring changes. '), 'Every time the class stops to change springs, the flow is broken. The app plans which setting each movement runs on, keeps a movement on the springs already set whenever its usual or advance setting allows, and counts the changes against your limit. ', h('b', null, 'Tidy springs'), ' reorders movements inside each segment to cut the count.')),

    h('section', { class: 'card stack' }, h('h2', null, 'Levels, layers and options'),
      dl(['Level', 'Most movements suit a range, such as Beginner–Intermediate. The first level is where the basic version starts; the second is how far the layers and heavier or lighter springs can take it.'],
        ['Layers', 'Steps that build one movement up for the whole class: start with the basic shape, add a pulse, add an arm, lift a leg. In a flow you pick which layers you\'ll teach.'],
        ['Options', 'What you offer to individuals: an easier version for someone who needs less, a harder one for someone who wants more. An option can be different springs, an extra movement added in (a biceps curl during a lunge), or a variation.'],
        ['Build-up', 'Easier movements that prepare the body for a harder one. The app checks one of them comes earlier in the class.'])),

    h('section', { class: 'card stack' }, h('h2', null, 'What the checks mean'),
      dl(['Spine movement', 'How the class shares out bending forward (flexion), arching back (extension), twisting (rotation) and bending sideways. A balanced class does all four.'],
        ['Parts of the body', 'Time on legs, arms and back, core, and stretching. A full-body class has all of them.'],
        ['Stability vs mobility', 'Stability work holds part of the body still against load (a plank). Mobility work moves through range (a roll down). Classes feel best when hard holds are paired with something that moves.'],
        ['Movement categories', 'Eleven things a rounded class usually touches: trunk flexion, extension, side bend, rotation, upper body, the four hip directions, hands-and-knees work, and standing.'],
        ['Client checks', 'If someone booked in has a caution (pregnancy, a sore knee), each movement that matters is flagged "adjust" (teach it with a change) or "avoid" (with a suggested swap).'],
        ['Draft', 'Every library movement is marked as a draft until a qualified instructor has checked it. Treat the app as a planning aid, not as teaching advice.'])),

    h('section', { class: 'card stack' }, h('h2', null, 'Pictures'),
      h('p', { class: 'small' }, 'Each movement has a simple drawn figure: the solid figure is the start, the faint one is where it goes. They are diagrams to jog the memory, not technique photos. An admin can add your studio\'s own photo to any movement from its page.'))) };
}
