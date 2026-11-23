// How OpenPilates works: the words it uses and what its checks mean.
import { h } from '../ui.js';
import { store } from '../store.js';
import { BRANDS, springFor, LOAD_LEVELS } from '/shared/vocab.js';

const dl = (...pairs) => h('dl', null, pairs.map(([t, d]) => [h('dt', null, t), h('dd', null, d)]));

export async function guideView() {
  const room = store.roomFor({ apparatus: 'reformer' });
  const brand = BRANDS[room.brand] || BRANDS.balanced_body;
  const have = room.springs && Object.keys(room.springs).length ? LOAD_LEVELS.filter((l) => Number(room.springs[l]) > 0) : LOAD_LEVELS.filter((l) => !springFor(room.brand, l, room.springOverrides).approx);
  return { title: 'Guide', node: h('div', { class: 'guide' },
    h('div', { class: 'page-head' }, h('div', { class: 'grow' }, h('h1', null, 'Guide'), h('p', { class: 'small muted' }, 'How the app works. It assumes you know your Pilates.'))),

    h('section', { class: 'card stack' }, h('h2', null, 'From blank page to class'),
      h('ol', { class: 'steps-list' },
        h('li', null, h('b', null, 'Make a flow. '), 'Flows → New flow. Draft one, or start blank.'),
        h('li', null, h('b', null, 'Fill the segments. '), 'Drag movements in from the library, or press +. Switch the library to Series to drop in a whole run at once.'),
        h('li', null, h('b', null, 'Set layers & variations. '), 'The layers button on each movement: which version the class does, the springs, the layers you\'ll build, and what you\'ll offer individuals.'),
        h('li', null, h('b', null, 'Check it. '), 'The right-hand column and the Analysis tab.'),
        h('li', null, h('b', null, 'Teach it. '), 'The play button on the flow, or print the run sheet.'))),

    h('section', { class: 'card stack' }, h('h2', null, 'Words the app uses'),
      dl(['Movement', 'One exercise: Footwork, Offering, Elephant. It has a usual spring setting and, often, a setting to progress to.'],
        ['Also called', 'Other names for the same movement: the classical name, a studio nickname. Search finds all of them.'],
        ['Variation', 'Another version of a movement. A regression (▼) is simpler or more supported. A progression (▲) is harder. A plain variation (◆) is just different: single arm instead of double, a different foot position. A variation can have its own springs.'],
        ['Layer', 'Something built on top of the movement with the whole class, in order: pulses, a hold, tempo, arms added.'],
        ['Series', 'A ready-built run of movements and variations, such as the Footwork series or the Short Box series. Adding a series drops every movement into the segment, where you can reorder, edit or remove them. Save any segment as a series of your own.'],
        ['Level', 'A range, such as Beginner–Intermediate: where the standard version starts and how far its progressions take it.'])),

    h('section', { class: 'card stack' }, h('h2', null, `Springs (${room.name || 'your reformers'}: ${brand.label})`),
      h('div', { class: 'btn-row' }, have.map((l) => { const s = springFor(room.brand, l, room.springOverrides); return h('span', { class: 'tag', style: { fontSize: '13px' } }, h('span', { style: { display: 'inline-block', width: '12px', height: '12px', borderRadius: '6px', background: s.color, border: '1px solid rgba(0,0,0,.2)', marginRight: '6px', verticalAlign: '-1px' } }), `${room.springs?.[l] ? room.springs[l] + ' × ' : ''}${s.name}`); })),
      h('p', { class: 'small' }, 'Every spring setting in the app is shown in the springs your reformers have, as set in Studio. If a movement asks for a spring you don\'t have, the closest one is shown with a *. Change brand, colours or how many of each spring you have in Studio and everything follows.'),
      h('p', { class: 'small' }, h('b', null, 'Spring changes. '), 'The app works out which setting each movement runs on. A movement stays on the springs already set when its usual or progression setting matches, and the changes are counted against the limit for the flow. ', h('b', null, 'Tidy springs'), ' reorders movements inside each segment to cut the count.')),

    h('section', { class: 'card stack' }, h('h2', null, 'What the checks look at'),
      dl(['Spine movement', 'Share of class time in flexion, extension, rotation and side bend, against the target for the class type.'],
        ['Parts of the body', 'Time on lower body, upper body, core and stretch.'],
        ['Stability vs mobility', 'Holding still against load versus moving through range.'],
        ['Movement categories', 'Trunk flexion, extension, side bend and rotation, upper body, the four hip directions, hands-and-knees and standing.'],
        ['Lead-in', 'A harder movement with none of its build-up movements earlier in the class.'],
        ['Client checks', 'Each booked client\'s cautions against each movement: "adjust" (teach it with the noted change) or "avoid" (with a suggested swap).'])),

    h('section', { class: 'card stack' }, h('h2', null, 'How far to trust the library'),
      h('p', { class: 'small' }, 'Every movement was written for OpenPilates and cross-checked against several published references for its name, other names and springs. Set-up, cues, muscles, levels and timings are still one author\'s draft until a teacher has looked at them.'),
      h('p', { class: 'small' }, h('a', { href: '#/review' }, 'Review the library'), ' lists every movement with a "Looks right" and a "Needs fixing" button. Anything flagged can be fixed on the movement\'s Edit page, or downloaded and sent to whoever maintains the library.'),
      h('p', { class: 'small' }, 'The pictures are drawn diagrams of the start and finish positions. Add your studio\'s own photo to any movement from its page.'))) };
}
