// Layers and variations for one movement inside a flow.
//  - teach as: the version of the movement the whole class does (standard, single arm, Pilates V…)
//  - layers: which of the movement's own layers the class is built through, in order
//  - variations to offer: regressions, progressions and other versions offered to individuals:
//    different springs, an extra movement added in, or just a note
import { h, btn, field, select, chips, modal, fill, icon } from '../ui.js';
import { store } from '../store.js';
import { springDots } from '../charts.js';
import { newId } from '/shared/draft.js';
import { LOAD_LEVELS, springFor, OPTION_KINDS, kindOf, variationsOf, variationOf } from '/shared/vocab.js';

const KIND = Object.fromEntries(OPTION_KINDS.map((k) => [k.id, k]));

export function optionTitle(o) {
  if (o.title) return o.title;
  const add = o.slug && store.movements[o.slug];
  if (add) return `Add ${add.name}`;
  if (o.springs) return kindOf(o.kind) === 'regression' ? 'Regression springs' : kindOf(o.kind) === 'progression' ? 'Progression springs' : 'Different springs';
  return o.note || 'Variation';
}

// The lines shown under a movement wherever the flow is listed.
export function itemExtras(item, mv, room, { dark } = {}) {
  if (!mv) return null;
  const picked = (item.layers || []).map((t) => (mv.layers || []).find((l) => l.tag === t)).filter(Boolean);
  const opts = item.options || [];
  if (!picked.length && !opts.length) return null;
  return h('div', { class: ['extras', dark && 'extras-dark'] },
    picked.length ? h('div', { class: 'extra' }, h('span', { class: 'extra-k' }, 'Layers'), h('span', null, picked.map((l, i) => [i ? ' → ' : '', l.title]))) : null,
    opts.map((o) => {
      const k = kindOf(o.kind);
      const add = o.slug && store.movements[o.slug];
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

// The "Layers & variations" dialog. Resolves to the changed fields, or null if cancelled.
export async function editItemDialog(item, mv, room) {
  const st = {
    reps: item.reps || '',
    note: item.note || '',
    variation: variationOf(mv, item) ? item.variation : '',
    springs: item.load?.springs ? [...item.load.springs] : null, // null = follow the plan
    mode: null,
    layers: [...(item.layers || [])],
    options: (item.options || []).map((o) => ({ ...o, kind: kindOf(o.kind), springs: o.springs ? [...o.springs] : undefined }))
  };
  const reformer = mv.apparatus === 'reformer';
  const advance = mv.load?.advance || [];
  const vars = variationsOf(mv);
  // "Teach as" offers real versions of the movement. Longer regressions are advice for one person, so they stay under "offer".
  const versions = vars.filter((v) => v.kind !== 'regression' || v.name.length <= 34);
  const body = h('div', { class: 'stack' });
  const others = store.movementList.filter((m) => m.slug !== mv.slug && (m.apparatus === mv.apparatus || m.apparatus === 'mat'));
  const usual = () => { const v = vars.find((x) => x.name === st.variation); return v && v.springs && v.springs.length ? v.springs : (mv.load?.springs || []); };

  const springPicker = (get, set, redraw) => h('div', { class: 'btn-row' },
    springDots(get(), room),
    roomLevels(room).map((l) => { const sp = springFor(room.brand, l, room.springOverrides); return btn(`+ ${sp.name}`, () => { if (get().length < 5) { set([...get(), l]); redraw(); } }, { small: true }); }),
    btn('Clear', () => { set([]); redraw(); }, { small: true, kind: 'ghost' }));

  const addOption = (o) => { st.options.push({ id: newId('o'), kind: 'progression', title: '', ...o }); draw(); };

  const optionRow = (o, i) => h('div', { class: 'opt-row' },
    h('div', { class: 'opt-head' },
      chips(OPTION_KINDS.map((k) => ({ id: k.id, label: `${k.mark} ${k.label}`, title: k.hint })), o.kind, (v) => { o.kind = v; }, { multi: false, small: true }),
      h('input', { type: 'text', value: o.title || '', placeholder: optionTitle({ ...o, title: '' }), 'aria-label': 'What the variation is', oninput: (e) => { o.title = e.target.value; } }),
      btn('', () => { st.options.splice(i, 1); draw(); }, { iconName: 'close', small: true, kind: 'ghost', title: 'Remove variation' })),
    o.springs !== undefined && reformer ? h('div', { class: 'opt-line' }, h('span', { class: 'tiny muted' }, 'Springs'), springPicker(() => o.springs, (v) => { o.springs = v; }, draw)) : null,
    o.slug !== undefined ? h('div', { class: 'opt-line' }, h('span', { class: 'tiny muted' }, 'Add in'),
      select([{ id: '', label: 'Choose a movement…' }, ...others.map((m) => ({ id: m.slug, label: m.name }))], o.slug || '', (v) => { o.slug = v; draw(); }, { 'aria-label': 'Movement to add' })) : null,
    h('div', { class: 'opt-line' }, h('span', { class: 'tiny muted' }, 'Note'), h('input', { type: 'text', value: o.note || '', placeholder: 'How you\'ll offer it (optional)', 'aria-label': 'Variation note', oninput: (e) => { o.note = e.target.value; } })));

  function draw() {
    const pinned = st.springs !== null;
    const offered = new Set(st.options.map((o) => (o.title || '').toLowerCase()));
    const ideas = vars.filter((v) => v.name !== st.variation && !offered.has(v.name.toLowerCase()));
    fill(body,
      versions.length ? h('div', { class: 'dialog-block', style: { borderTop: 0, paddingTop: 0 } },
        h('h3', null, 'Teach as'),
        h('p', { class: 'hint' }, 'The version the whole class does.'),
        chips([{ id: '', label: 'Standard' }, ...versions.map((v) => ({ id: v.name, label: `${KIND[v.kind].mark} ${v.name}`, title: [KIND[v.kind].label, v.note].filter(Boolean).join(': ') }))], st.variation,
          (v) => { st.variation = v || ''; if (st.mode === 'usual') st.springs = [...usual()]; draw(); }, { multi: false, small: true })) : null,

      h('div', { class: 'grid-2' },
        field('Reps or time', h('input', { type: 'text', value: st.reps, placeholder: mv.reps || 'e.g. 8 each side', oninput: (e) => { st.reps = e.target.value; } })),
        field('Note to self', h('input', { type: 'text', value: st.note, placeholder: 'Shown in Play mode', oninput: (e) => { st.note = e.target.value; } }))),

      reformer ? h('div', { class: 'dialog-block' },
        h('h3', null, 'Springs for the class'),
        h('div', { class: 'btn-row' },
          chips([{ id: 'plan', label: 'Follow the plan' }, { id: 'usual', label: 'Usual' }, ...(advance.length ? [{ id: 'advance', label: 'Progression' }] : []), { id: 'own', label: 'My own' }],
            st.mode || (!pinned ? 'plan' : st.springs.join() === usual().join() ? 'usual' : advance.length && st.springs.join() === advance.join() ? 'advance' : 'own'),
            (v) => { st.mode = v; st.springs = v === 'plan' ? null : v === 'usual' ? [...usual()] : v === 'advance' ? [...advance] : [...(st.springs || usual())]; draw(); }, { multi: false, small: true })),
        pinned ? springPicker(() => st.springs, (v) => { st.springs = v; st.mode = 'own'; }, draw)
          : h('p', { class: 'hint' }, 'Stays on whichever of its usual or progression springs is already on the machine, so the class changes springs as rarely as possible.', mv.load?.lighterIsHarder ? ' Lighter is harder here.' : '', mv.load?.note ? ` ${mv.load.note}` : '')) : null,

      (mv.layers || []).length ? h('div', { class: 'dialog-block' },
        h('h3', null, 'Layers to teach'),
        h('p', { class: 'hint' }, 'What you build on top, in order, with the whole class.'),
        chips(mv.layers.map((l) => ({ id: l.tag, label: l.title, title: l.text })), st.layers, (v) => { st.layers = mv.layers.map((l) => l.tag).filter((t) => v.includes(t)); }, { small: true })) : null,

      h('div', { class: 'dialog-block' },
        h('h3', null, 'Variations to offer'),
        h('p', { class: 'hint' }, 'For individuals: a regression (simpler), a progression (harder), or another version.'),
        st.options.length ? h('div', { class: 'stack-sm' }, st.options.map(optionRow)) : h('p', { class: 'small muted' }, 'None yet.'),
        ideas.length ? h('div', { style: { marginTop: '10px' } }, h('div', { class: 'tiny muted', style: { marginBottom: '4px' } }, 'From the library'),
          h('div', { class: 'btn-row' }, ideas.map((v) => btn(`${KIND[v.kind].mark} ${v.name}`, () => addOption({ kind: v.kind, title: v.name, ...(v.springs && reformer ? { springs: [...v.springs] } : {}), ...(v.note ? { note: v.note } : {}) }), { small: true, kind: 'ghost', title: KIND[v.kind].label })))) : null,
        h('div', { class: 'btn-row', style: { marginTop: '10px' } },
          reformer ? btn('Progression springs', () => addOption({ kind: 'progression', springs: advance.length ? [...advance] : (mv.load?.lighterIsHarder ? lighter(usual()) : heavier(usual())) }), { small: true, iconName: 'plus' }) : null,
          reformer ? btn('Regression springs', () => addOption({ kind: 'regression', springs: mv.load?.lighterIsHarder ? heavier(usual()) : lighter(usual()) }), { small: true, iconName: 'plus' }) : null,
          btn('Add a movement', () => addOption({ kind: 'progression', slug: '' }), { small: true, iconName: 'plus' }),
          btn('Something else', () => addOption({ kind: 'variation' }), { small: true, iconName: 'plus' }))));
  }
  draw();

  const ok = await modal(`${mv.name}: layers & variations`, body, { wide: true, actions: [{ label: 'Cancel', value: false }, { label: 'Save', value: true, kind: 'primary' }] });
  if (!ok) return null;
  const options = st.options
    .map((o) => ({ ...o, title: (o.title || '').trim(), note: (o.note || '').trim() || undefined, slug: o.slug || undefined }))
    .filter((o) => o.title || o.slug || o.note || (o.springs && o.springs.length));
  return {
    reps: st.reps.trim() || undefined,
    note: st.note.trim() || undefined,
    variation: st.variation || undefined,
    load: st.springs !== null ? { springs: st.springs } : undefined,
    layers: st.layers.length ? st.layers : undefined,
    options: options.length ? options : undefined
  };
}

export const optionsBadge = (item) => {
  const n = (item.options || []).length + ((item.layers || []).length ? 1 : 0);
  return n ? h('span', { class: 'tag tag-accent', title: 'Layers and variations planned for this movement' }, icon('layers', 11), ` ${n}`) : null;
};
