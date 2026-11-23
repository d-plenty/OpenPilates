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

    h('section', { class: 'card stack' }, h('h2', null, 'Set the studio up once'),
      h('p', { class: 'small' }, 'Everything else follows ', h('a', { href: '#/studio' }, 'Studio'), ', so start there. It saves as you go.'),
      dl(['Rooms & springs', 'Your reformer brand and how many of each spring a reformer has. Every setting in the app is then shown in your springs.'],
        ['Class types', 'The classes on your timetable, each with its phases in order and the minutes each usually gets. A new flow starts from one.'],
        ['Class levels', 'Your own level names. Each covers a span of difficulty, which decides the movements a class at that level is offered.'],
        ['Lengths & timing', 'The class lengths you run, and the seconds allowed for a spring change, a change of position, a box, each layer and a finisher.'],
        ['Lists', 'Props, client cautions, muscle names and what the parts of a class are called. Add your own, remove what you never use.'])),

    h('section', { class: 'card stack' }, h('h2', null, 'From blank page to class'),
      h('ol', { class: 'steps-list' },
        h('li', null, h('b', null, 'Make a flow. '), 'Flows → New flow. Pick the class type, length and level. Draft it, or start with empty phases.'),
        h('li', null, h('b', null, 'Fill the phases with blocks. '), 'A block is one movement and what you build on it. Press "Add a block" in a phase, press + in the library, or drag. Switch the library to Series to drop in a whole run.'),
        h('li', null, h('b', null, 'Plan each block. '), '"Plan block" opens it in place: the version the class does, springs (with support and challenge springs for individuals), layers in your own words, a finisher, and what you\'ll offer anyone who needs less or more.'),
        h('li', null, h('b', null, 'Watch the time. '), 'Each phase shows its time against the minutes it was given, and the top of the page shows the class total. A block\'s time is worked out from the movement, its layers and finisher until you type your own.'),
        h('li', null, h('b', null, 'Check it. '), 'The right-hand column and the Analysis tab.'),
        h('li', null, h('b', null, 'Teach it. '), 'Play, or print the run sheet.'))),

    h('section', { class: 'card stack' }, h('h2', null, 'Words the app uses'),
      dl(['Movement', 'One exercise: Footwork, Offering, Elephant. It has a usual spring setting and, often, a setting to progress to.'],
        ['Block', 'A movement in a flow, with its version, springs, layers and finisher. The unit a class is planned in.'],
        ['Phase', 'A stretch of the class: warm-up, footwork, standing legs, cool-down. A class type lists its phases.'],
        ['Layer', 'Something built on top of the movement with the whole class, in order: a bigger range, arms added, a pulse. Pick from the movement\'s own layers or write your own.'],
        ['Finisher', 'How a block ends: pulses, a hold, the last few slow.'],
        ['Variation', 'Another version of a movement. A regression (▼) is simpler or more supported. A progression (▲) is harder. A plain variation (◆) is just different: single arm instead of double, a different foot position.'],
        ['Series', 'A ready-built run of movements, such as Footwork or the Short Box. Adding one drops every movement into the phase. Save any phase as a series, make one from scratch, or edit one under Series in the builder\'s library.'],
        ['Also called', 'Other names for the same movement: the classical name, a studio nickname. Search finds all of them.'],
        ['Difficulty and level', 'A movement has a difficulty range: where its basic version starts and how far its progressions take it. Your class levels each cover part of that range.'],
        ['Warm-up, cool-down, peak', 'Marked on each movement under "Where it belongs in a class". Drafts only use marked movements for warm-ups and cool-downs, and keep peak movements for the hardest phase.'])),

    h('section', { class: 'card stack' }, h('h2', null, 'How a draft is built'),
      h('p', { class: 'small' }, '"Draft it for me" follows the class type you picked. Each phase gets its share of the class length and a few blocks from the parts of the library that phase is for, at the class level, using only equipment you have. Movements that share a spring setting are kept together, the spine is moved in every direction where the library allows, and the plan is fitted to the class length including the time changes take. It is a starting point: every part of it can be changed.'),
      h('p', { class: 'small' }, 'If a draft keeps choosing something you would never teach there, fix it at the source: change where the movement belongs in a class, its difficulty or its part of the class on its Edit page, or take it out of your library.')),

    h('section', { class: 'card stack' }, h('h2', null, 'Making it yours'),
      dl(['Edit anything', 'Every movement and series has an Edit page. Changing a built-in one makes it your studio\'s version; it survives updates and can be put back to how it shipped.'],
        ['Add your own', 'Movements → New movement builds one from scratch: names, picture, springs, muscles, layers, variations, cautions and cues.'],
        ['Take things out', 'Remove a movement or series from your library and it stops being offered. Flows that use it still open. Put it back from Movements → Removed.'],
        ['Light or dark', 'The sun or moon at the top of the page, or Account → Appearance.'],
        ['Packs', 'Studio → Library & data exports everything you have changed as one file, and brings a pack in. Use it to copy your set-up to another server, or to send your corrections back so they go into the next version. Clients are never in a pack.'])),

    h('section', { class: 'card stack' }, h('h2', null, `Springs (${room.name || 'your reformers'}: ${brand.label})`),
      h('div', { class: 'btn-row' }, have.map((l) => { const s = springFor(room.brand, l, room.springOverrides); return h('span', { class: 'tag', style: { fontSize: '13px' } }, h('span', { style: { display: 'inline-block', width: '12px', height: '12px', borderRadius: '6px', background: s.color, border: '1px solid rgba(0,0,0,.2)', marginRight: '6px', verticalAlign: '-1px' } }), `${room.springs?.[l] ? room.springs[l] + ' × ' : ''}${s.name}`); })),
      h('p', { class: 'small' }, 'Every spring setting in the app is shown in the springs your reformers have, as set in Studio. If a movement asks for a spring you don\'t have, the closest one is shown with a *. Change brand, colours or how many of each spring you have in Studio and everything follows.'),
      h('p', { class: 'small' }, h('b', null, 'Spring changes. '), 'The app works out which setting each movement runs on. A movement stays on the springs already set when its usual or progression setting matches, and the changes are counted against the limit for the flow. ', h('b', null, 'Tidy springs'), ' reorders blocks inside each phase to cut the count.')),

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
