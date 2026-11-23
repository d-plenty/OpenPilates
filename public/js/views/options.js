// A block: one movement in a flow and everything planned around it.
//  - version: the version of the movement the whole class does (standard, single arm, Pilates V…)
//  - springs: for the class, with support and challenge springs for individuals
//  - layers: what is built on top, in order. Either one of the movement's own layers or the teacher's words
//  - finisher: pulses or a hold to end the block
//  - offers: regressions, progressions and other versions offered to individuals
import { h, btn, field, select, chips, icon } from '../ui.js';
import { store } from '../store.js';
import { springDots } from '../charts.js';
import { newId } from '/shared/draft.js';
import { fmtClock } from '/shared/analysis.js';
import { LOAD_LEVELS, springFor, OPTION_KINDS, kindOf, variationsOf, variationOf, layersOf, blockSeconds, FINISHERS } from '/shared/vocab.js';

const KIND = Object.fromEntries(OPTION_KINDS.map((k) => [k.id, k]));

export function optionTitle(o) {
  if (o.title) return o.title;
  const add = o.slug && store.movements[o.slug];
  if (add) return `Add ${add.name}`;
  if (o.springs) return kindOf(o.kind) === 'regression' ? 'Support springs' : kindOf(o.kind) === 'progression' ? 'Challenge springs' : 'Different springs';
  return o.note || 'Variation';
}

// The plan for a block, shown under the movement wherever the flow is listed.
export function itemExtras(item, mv, room, { dark } = {}) {
  if (!mv) return null;
  const layers = layersOf(mv, item);
  const opts = item.options || [];
  if (!layers.length && !opts.length && !item.finisher) return null;
  return h('div', { class: ['extras', dark && 'extras-dark'] },
    layers.length ? h('ol', { class: 'extra-layers' }, layers.map((l) => h('li', null, h('span', { class: 'extra-layer-t' }, l.title), l.tag && l.text && dark ? h('span', { class: 'extra-note' }, ` — ${l.text}`) : null))) : null,
    item.finisher ? h('div', { class: 'extra extra-finisher' }, h('span', { class: 'extra-k' }, 'Finish'), h('span', null, item.finisher)) : null,
    opts.map((o) => {
      const k = kindOf(o.kind);
      const add = o.slug && store.movements[o.slug];
      // springs on their own read as teachers say them: support and challenge
      if (o.springs && !o.slug && !o.title && k !== 'variation' && mv.apparatus === 'reformer') {
        return h('div', { class: ['extra', `extra-${k}`] }, h('span', { class: 'extra-k' }, `${KIND[k].mark} ${k === 'regression' ? 'Support' : 'Challenge'}`), h('span', null, springDots(o.springs, room), o.note ? h('span', { class: 'extra-note' }, ` — ${o.note}`) : null));
      }
      return h('div', { class: ['extra', `extra-${k}`] },
        h('span', { class: 'extra-k' }, `${KIND[k].mark} ${KIND[k].label}`),
        h('span', null, optionTitle(o), o.springs && mv.apparatus === 'reformer' ? [' ', springDots(o.springs, room)] : null,
          add && o.title ? [' · ', add.name] : null,
          o.note && o.note !== optionTitle(o) ? h('span', { class: 'extra-note' }, ` — ${o.note}`) : null));
    }));
}

// Only the springs this room's reformers really have are offered.
const roomLevels = (room) => {
  const have = room.springs && Object.keys(room.springs).length ? LOAD_LEVELS.filter((l) => Number(room.springs[l]) > 0) : [];
  return have.length ? have : LOAD_LEVELS.filter((l) => !springFor(room.brand, l, room.springOverrides).approx);
};
const lighter = (springs) => {
  const s = [...(springs || [])];
  if (s.length > 1) { const i = s.indexOf('xlight') >= 0 ? s.indexOf('xlight') : s.indexOf('light') >= 0 ? s.indexOf('light') : s.length - 1; s.splice(i, 1); return s; }
  const i = LOAD_LEVELS.indexOf(s[0]);
  return i > 0 ? [LOAD_LEVELS[i - 1]] : s;
};
const heavier = (springs) => {
  const s = [...(springs || [])];
  if (s.length === 1) { const i = LOAD_LEVELS.indexOf(s[0]); if (i >= 0 && i < 2) return [LOAD_LEVELS[i + 1]]; }
  return s.length < 5 ? [...s, 'light'] : s;
};

// The block editor, shown inside the flow under the movement. Every control changes the flow straight away
// through `change`; `focus` remembers which box to put the cursor back in after the flow redraws.
export function blockEditor({ item, mv, room, change, planned, focus }) {
  const reformer = mv.apparatus === 'reformer';
  const advance = mv.load?.advance || [];
  const vars = variationsOf(mv);
  // "Teach as" offers real versions of the movement. Longer regressions are advice for one person, so they stay under "offer".
  const versions = vars.filter((v) => v.kind !== 'regression' || v.name.length <= 34);
  const picked = variationOf(mv, item);
  const usual = () => (picked && picked.springs && picked.springs.length ? picked.springs : (mv.load?.springs || []));
  const others = store.movementList.filter((m) => m.slug !== mv.slug && (m.apparatus === mv.apparatus || m.apparatus === 'mat'));
  const set = (fn) => change(fn);
  const quiet = (fn) => change(fn, { redraw: false });
  const drop = (k) => { if (item[k] === undefined || item[k] === '' || (Array.isArray(item[k]) && !item[k].length)) delete item[k]; };

  const springPicker = (get, put) => h('div', { class: 'btn-row' },
    springDots(get(), room),
    roomLevels(room).map((l) => { const sp = springFor(room.brand, l, room.springOverrides); return btn(`+ ${sp.name}`, () => { if (get().length < 5) put([...get(), l]); }, { small: true }); }),
    btn('Clear', () => put([]), { small: true, kind: 'ghost' }));

  // ---- springs
  const pinned = !!(item.load && Array.isArray(item.load.springs));
  const mode = !pinned ? 'plan' : item.load.springs.join() === usual().join() ? 'usual' : advance.length && item.load.springs.join() === advance.join() ? 'advance' : 'own';
  const optOf = (kind) => (item.options || []).find((o) => kindOf(o.kind) === kind && o.springs && !o.slug && !o.title);
  const sideSprings = (kind, label, hint, make) => {
    const o = optOf(kind);
    return h('div', { class: 'be-line' }, h('span', { class: 'be-k', title: hint }, `${KIND[kind].mark} ${label}`),
      o ? [springPicker(() => o.springs, (v) => set(() => { o.springs = v; })), btn('', () => set(() => { item.options = item.options.filter((x) => x !== o); drop('options'); }), { iconName: 'close', small: true, kind: 'ghost', title: `Remove ${label.toLowerCase()} springs` })]
        : btn(`Add ${label.toLowerCase()} springs`, () => set(() => { item.options = [...(item.options || []), { id: newId('o'), kind, title: '', springs: make() }]; }), { small: true, kind: 'ghost', iconName: 'plus' }));
  };
  const springs = reformer ? h('div', { class: 'be-block' },
    h('h3', null, 'Springs'),
    h('div', { class: 'be-line' }, h('span', { class: 'be-k' }, 'Class'),
      chips([{ id: 'plan', label: 'Follow the plan' }, { id: 'usual', label: 'Usual' }, ...(advance.length ? [{ id: 'advance', label: 'Progression' }] : []), { id: 'own', label: 'My own' }], mode,
        (v) => set(() => { if (v === 'plan') delete item.load; else item.load = { springs: v === 'usual' ? [...usual()] : v === 'advance' ? [...advance] : [...(item.load?.springs || (planned ? planned.loads : usual()))] }; }), { multi: false, small: true }),
      pinned ? springPicker(() => item.load.springs, (v) => set(() => { item.load = { springs: v }; }))
        : h('span', { class: 'be-now' }, springDots(planned ? planned.loads : usual(), room))),
    !pinned ? h('p', { class: 'hint' }, 'Stays on whichever of its usual or progression springs is already on, so the class changes springs as rarely as possible.', mv.load?.lighterIsHarder ? ' Lighter is harder here.' : '', mv.load?.note ? ` ${mv.load.note}` : '') : null,
    sideSprings('regression', 'Support', 'Springs for anyone who needs it easier', () => (mv.load?.lighterIsHarder ? heavier(usual()) : lighter(usual()))),
    sideSprings('progression', 'Challenge', 'Springs for anyone ready for more', () => (advance.length ? [...advance] : (mv.load?.lighterIsHarder ? lighter(usual()) : heavier(usual()))))) : null;

  // ---- layers
  const layers = item.layers || [];
  const usedTags = new Set(layers.filter((l) => typeof l === 'string'));
  const ideas = (mv.layers || []).filter((l) => !usedTags.has(l.tag));
  const newLayer = h('input', { type: 'text', placeholder: layers.length ? 'Next layer, in your words' : 'e.g. Add a small pulse at the top', 'aria-label': 'Add a layer', 'data-focus': `layer:${item.id}`,
    onkeydown: (e) => { if (e.key === 'Enter') { e.preventDefault(); addLayer(); } } });
  const addLayer = () => { const text = newLayer.value.trim(); if (!text) return; focus.key = `layer:${item.id}`; set(() => { item.layers = [...layers, { text }]; }); };
  const layerRow = (l, i) => {
    const lib = typeof l === 'string' ? (mv.layers || []).find((x) => x.tag === l) : null;
    if (typeof l === 'string' && !lib) return null;
    return h('li', { class: 'be-layer' },
      h('span', { class: 'be-n' }, String(i + 1)),
      lib ? h('span', { class: 'be-lib', title: lib.text }, h('b', null, lib.title), lib.text ? h('span', { class: 'tiny muted' }, ` ${lib.text}`) : null)
        : h('input', { type: 'text', value: l.text, 'aria-label': `Layer ${i + 1}`, onchange: (e) => { const v = e.target.value.trim(); if (v) quiet(() => { l.text = v; }); else set(() => { item.layers = layers.filter((x) => x !== l); drop('layers'); }); } }),
      h('span', { class: 'tools' },
        lib ? btn('', () => set(() => { item.layers = layers.map((x) => (x === l ? { text: lib.title } : x)); }), { iconName: 'edit', small: true, kind: 'ghost', title: 'Put it in your own words' }) : null,
        i > 0 ? btn('', () => set(() => { const a = [...layers]; [a[i - 1], a[i]] = [a[i], a[i - 1]]; item.layers = a; }), { iconName: 'up', small: true, kind: 'ghost', title: 'Earlier' }) : null,
        i < layers.length - 1 ? btn('', () => set(() => { const a = [...layers]; [a[i + 1], a[i]] = [a[i], a[i + 1]]; item.layers = a; }), { iconName: 'down', small: true, kind: 'ghost', title: 'Later' }) : null,
        btn('', () => set(() => { item.layers = layers.filter((x) => x !== l); drop('layers'); }), { iconName: 'close', small: true, kind: 'ghost', title: 'Remove layer' })));
  };
  const layersBlock = h('div', { class: 'be-block' },
    h('h3', null, 'Layers'),
    h('p', { class: 'hint' }, 'What you build on top with the whole class, in order. Each layer adds time to the block.'),
    layers.length ? h('ol', { class: 'be-layers' }, layers.map(layerRow)) : null,
    h('div', { class: 'btn-row' }, newLayer, btn('Add layer', addLayer, { small: true, iconName: 'plus' })),
    ideas.length ? h('div', { class: 'be-ideas' }, h('span', { class: 'tiny muted' }, 'From the library:'), ideas.map((l) => h('button', { type: 'button', class: 'chip chip-sm', title: l.text, onclick: () => set(() => { item.layers = [...layers, l.tag]; }) }, `+ ${l.title}`))) : null);

  // ---- finisher, reps, time, note
  const fin = h('input', { type: 'text', value: item.finisher || '', placeholder: 'e.g. Pulses × 10', 'aria-label': 'Finisher', onchange: (e) => set(() => { item.finisher = e.target.value.trim(); drop('finisher'); }) });
  const auto = blockSeconds({ ...item, duration: 0 }, mv);
  const details = h('div', { class: 'be-block' },
    h('div', { class: 'be-grid' },
      field('Finisher', fin, 'How the block ends.'),
      field('Reps or time', h('input', { type: 'text', value: item.reps || '', placeholder: mv.reps || 'e.g. 8 each side', onchange: (e) => quiet(() => { item.reps = e.target.value.trim(); drop('reps'); }) })),
      field('Note to self', h('input', { type: 'text', value: item.note || '', placeholder: 'Shown on the run sheet and in Play', onchange: (e) => quiet(() => { item.note = e.target.value.trim(); drop('note'); }) }))),
    h('div', { class: 'be-ideas' }, h('span', { class: 'tiny muted' }, 'Finishers:'), FINISHERS.filter((f) => f !== item.finisher).map((f) => h('button', { type: 'button', class: 'chip chip-sm', onclick: () => set(() => { item.finisher = f; }) }, f))),
    h('p', { class: 'tiny muted be-time' }, item.duration
      ? [`Block time typed in: ${fmtClock(item.duration)}. `, h('button', { type: 'button', class: 'linkish', onclick: () => set(() => { delete item.duration; }) }, `Work it out instead (${fmtClock(auto)})`)]
      : `Block time worked out: ${fmtClock(auto)} = the movement${layersOf(mv, item).length ? `, ${layersOf(mv, item).length} layer${layersOf(mv, item).length > 1 ? 's' : ''}` : ''}${item.finisher ? ' and the finisher' : ''}. Type a time on the block to set your own.`));

  // ---- offers for individuals
  const offers = (item.options || []).filter((o) => !(o.springs && !o.slug && !o.title && kindOf(o.kind) !== 'variation'));
  const offered = new Set((item.options || []).map((o) => (o.title || '').toLowerCase()));
  const offerIdeas = vars.filter((v) => v.name !== item.variation && !offered.has(v.name.toLowerCase()));
  const addOffer = (o) => set(() => { item.options = [...(item.options || []), { id: newId('o'), kind: 'progression', title: '', ...o }]; });
  const offerRow = (o) => h('div', { class: 'opt-row' },
    h('div', { class: 'opt-head' },
      chips(OPTION_KINDS.map((k) => ({ id: k.id, label: `${k.mark} ${k.label}`, title: k.hint })), kindOf(o.kind), (v) => set(() => { o.kind = v; }), { multi: false, small: true }),
      h('input', { type: 'text', value: o.title || '', placeholder: optionTitle({ ...o, title: '' }), 'aria-label': 'What is offered', onchange: (e) => quiet(() => { o.title = e.target.value.trim(); }) }),
      btn('', () => set(() => { item.options = item.options.filter((x) => x !== o); drop('options'); }), { iconName: 'close', small: true, kind: 'ghost', title: 'Remove' })),
    o.springs !== undefined && reformer ? h('div', { class: 'opt-line' }, h('span', { class: 'tiny muted' }, 'Springs'), springPicker(() => o.springs, (v) => set(() => { o.springs = v; }))) : null,
    o.slug !== undefined ? h('div', { class: 'opt-line' }, h('span', { class: 'tiny muted' }, 'Add in'),
      select([{ id: '', label: 'Choose a movement…' }, ...others.map((m) => ({ id: m.slug, label: m.name }))], o.slug || '', (v) => set(() => { o.slug = v; }), { 'aria-label': 'Movement to add' })) : null,
    h('div', { class: 'opt-line' }, h('span', { class: 'tiny muted' }, 'Note'), h('input', { type: 'text', value: o.note || '', placeholder: 'How you\'ll offer it (optional)', 'aria-label': 'Note', onchange: (e) => quiet(() => { o.note = e.target.value.trim(); if (!o.note) delete o.note; }) })));
  const offersBlock = h('div', { class: 'be-block' },
    h('h3', null, 'Offer to individuals'),
    h('p', { class: 'hint' }, 'A regression for anyone who needs less, a progression for anyone ready for more, or another version.'),
    offers.length ? h('div', { class: 'stack-sm' }, offers.map(offerRow)) : null,
    h('div', { class: 'be-ideas' },
      offerIdeas.map((v) => h('button', { type: 'button', class: 'chip chip-sm', title: [KIND[v.kind].label, v.note].filter(Boolean).join(': '), onclick: () => addOffer({ kind: v.kind, title: v.name, ...(v.springs && reformer ? { springs: [...v.springs] } : {}), ...(v.note ? { note: v.note } : {}) }) }, `${KIND[v.kind].mark} ${v.name}`)),
      h('button', { type: 'button', class: 'chip chip-sm', onclick: () => addOffer({ kind: 'progression', slug: '' }) }, '+ Add a movement'),
      h('button', { type: 'button', class: 'chip chip-sm', onclick: () => addOffer({ kind: 'variation' }) }, '+ Something else')));

  return h('div', { class: 'block-editor', onclick: (e) => e.stopPropagation() },
    versions.length ? h('div', { class: 'be-block' },
      h('h3', null, 'Version'),
      chips([{ id: '', label: 'Standard' }, ...versions.map((v) => ({ id: v.name, label: v.name, title: [KIND[v.kind].label, v.note].filter(Boolean).join(': ') }))], picked ? item.variation : '',
        (v) => set(() => { if (v) item.variation = v; else delete item.variation; if (item.load && mode === 'usual') { const nv = vars.find((x) => x.name === v); item.load = { springs: [...(nv && nv.springs && nv.springs.length ? nv.springs : (mv.load?.springs || []))] }; } }), { multi: false, small: true })) : null,
    springs, layersBlock, details, offersBlock);
}

export const optionsBadge = (item) => {
  const n = (item.options || []).length + ((item.layers || []).length ? 1 : 0);
  return n ? h('span', { class: 'tag tag-accent', title: 'Layers and variations planned for this block' }, icon('layers', 11), ` ${n}`) : null;
};
