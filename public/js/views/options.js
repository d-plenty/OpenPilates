// Layers and options for one movement inside a flow.
//  - layers: which of the movement's own layers the class will be taught through, in order
//  - options: easier or harder versions offered to individuals — different springs, an extra
//    movement added in, or just a note
import { h, btn, field, select, chips, modal, fill, icon } from '../ui.js';
import { store } from '../store.js';
import { springDots } from '../charts.js';
import { newId } from '/shared/draft.js';
import { LOAD_LEVELS, springFor, OPTION_KINDS } from '/shared/vocab.js';

const KIND = Object.fromEntries(OPTION_KINDS.map((k) => [k.id, k]));

export function optionTitle(o) {
  if (o.title) return o.title;
  const add = o.slug && store.movements[o.slug];
  if (add) return `Add ${add.name}`;
  if (o.springs) return o.kind === 'easier' ? 'Lighter springs' : 'Advance springs';
  return o.note || 'Option';
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
      const add = o.slug && store.movements[o.slug];
      return h('div', { class: ['extra', `extra-${o.kind}`] },
        h('span', { class: 'extra-k' }, `${KIND[o.kind].mark} ${KIND[o.kind].label}`),
        h('span', null, optionTitle(o), o.springs && mv.apparatus === 'reformer' ? [' ', springDots(o.springs, room)] : null,
          add && o.title ? [' · ', h('a', { href: `#/movements/${add.slug}` }, add.name)] : null,
          o.note && o.note !== optionTitle(o) ? h('span', { class: 'extra-note' }, ` — ${o.note}`) : null));
    }));
}

const lighter = (springs) => {
  const s = [...(springs || [])];
  if (s.length > 1) { const i = s.indexOf('xlight') >= 0 ? s.indexOf('xlight') : s.indexOf('light') >= 0 ? s.indexOf('light') : s.length - 1; s.splice(i, 1); return s; }
  const i = LOAD_LEVELS.indexOf(s[0]);
  return i > 0 ? [LOAD_LEVELS[i - 1]] : s;
};
const heavier = (springs) => {
  const s = [...(springs || [])];
  if (s.length < 5) return [...s, 'xlight'];
  return s;
};

// The "Layers, options and notes" dialog. Resolves to the changed fields, or null if cancelled.
export async function editItemDialog(item, mv, room) {
  const st = {
    reps: item.reps || '',
    note: item.note || '',
    springs: item.load?.springs ? [...item.load.springs] : null, // null = follow the plan
    mode: null,
    layers: [...(item.layers || [])],
    options: (item.options || []).map((o) => ({ ...o, springs: o.springs ? [...o.springs] : undefined }))
  };
  const reformer = mv.apparatus === 'reformer';
  const usual = mv.load?.springs || [];
  const advance = mv.load?.advance || [];
  const body = h('div', { class: 'stack' });
  const others = store.movementList.filter((m) => m.slug !== mv.slug && (m.apparatus === mv.apparatus || m.apparatus === 'mat'));

  const springPicker = (get, set, redraw) => h('div', { class: 'btn-row' },
    springDots(get(), room),
    LOAD_LEVELS.filter((l) => !springFor(room.brand, l, room.springOverrides).approx).map((l) => { const sp = springFor(room.brand, l, room.springOverrides); return btn(`+ ${sp.name}`, () => { if (get().length < 5) { set([...get(), l]); redraw(); } }, { small: true }); }),
    btn('Clear', () => { set([]); redraw(); }, { small: true, kind: 'ghost' }));

  const addOption = (o) => { st.options.push({ id: newId('o'), kind: 'harder', title: '', ...o }); draw(); };

  const optionRow = (o, i) => h('div', { class: 'opt-row' },
    h('div', { class: 'opt-head' },
      chips(OPTION_KINDS.map((k) => ({ id: k.id, label: `${k.mark} ${k.label}` })), o.kind, (v) => { o.kind = v; }, { multi: false, small: true }),
      h('input', { type: 'text', value: o.title || '', placeholder: optionTitle({ ...o, title: '' }), 'aria-label': 'What the option is', oninput: (e) => { o.title = e.target.value; } }),
      btn('', () => { st.options.splice(i, 1); draw(); }, { iconName: 'close', small: true, kind: 'ghost', title: 'Remove option' })),
    o.springs !== undefined && reformer ? h('div', { class: 'opt-line' }, h('span', { class: 'tiny muted' }, 'Springs'), springPicker(() => o.springs, (v) => { o.springs = v; }, draw)) : null,
    o.slug !== undefined ? h('div', { class: 'opt-line' }, h('span', { class: 'tiny muted' }, 'Add in'),
      select([{ id: '', label: 'Choose a movement…' }, ...others.map((m) => ({ id: m.slug, label: m.name }))], o.slug || '', (v) => { o.slug = v; draw(); }, { 'aria-label': 'Movement to add' })) : null,
    h('div', { class: 'opt-line' }, h('span', { class: 'tiny muted' }, 'Note'), h('input', { type: 'text', value: o.note || '', placeholder: 'How you\'ll offer it (optional)', 'aria-label': 'Option note', oninput: (e) => { o.note = e.target.value; } })));

  function draw() {
    const pinned = st.springs !== null;
    fill(body,
      h('div', { class: 'grid-2' },
        field('Reps or time cue', h('input', { type: 'text', value: st.reps, placeholder: mv.reps || 'e.g. 8 each side', oninput: (e) => { st.reps = e.target.value; } })),
        field('Note to self', h('input', { type: 'text', value: st.note, placeholder: 'Shown in Play mode', oninput: (e) => { st.note = e.target.value; } }))),

      reformer ? h('div', { class: 'dialog-block' },
        h('h3', null, 'Springs for the class'),
        h('div', { class: 'btn-row' },
          chips([{ id: 'plan', label: 'Follow the plan' }, { id: 'usual', label: 'Usual' }, ...(advance.length ? [{ id: 'advance', label: 'To advance' }] : []), { id: 'own', label: 'My own' }],
            st.mode || (!pinned ? 'plan' : st.springs.join() === usual.join() ? 'usual' : advance.length && st.springs.join() === advance.join() ? 'advance' : 'own'),
            (v) => { st.mode = v; st.springs = v === 'plan' ? null : v === 'usual' ? [...usual] : v === 'advance' ? [...advance] : [...(st.springs || usual)]; draw(); }, { multi: false, small: true })),
        pinned ? springPicker(() => st.springs, (v) => { st.springs = v; st.mode = 'own'; }, draw)
          : h('p', { class: 'hint' }, 'The class stays on whichever of this movement\'s usual or advance springs is already on the machine, so you change springs as little as possible.', mv.load?.note ? ` ${mv.load.note}` : '')) : null,

      (mv.layers || []).length ? h('div', { class: 'dialog-block' },
        h('h3', null, 'Layers to teach'),
        h('p', { class: 'hint' }, 'Pick the layers you\'ll build through with the whole class, in order.'),
        chips(mv.layers.map((l) => ({ id: l.tag, label: l.title, title: l.text })), st.layers, (v) => { st.layers = mv.layers.map((l) => l.tag).filter((t) => v.includes(t)); }, { small: true })) : null,

      h('div', { class: 'dialog-block' },
        h('h3', null, 'Options to offer'),
        h('p', { class: 'hint' }, 'For people who need less or want more: different springs, an extra movement added in, or a variation.'),
        st.options.length ? h('div', { class: 'stack-sm' }, st.options.map(optionRow)) : h('p', { class: 'small muted' }, 'None yet.'),
        h('div', { class: 'btn-row', style: { marginTop: '8px' } },
          reformer ? btn('Harder springs', () => addOption({ kind: 'harder', springs: advance.length ? [...advance] : (mv.load?.lighterIsHarder ? lighter(usual) : heavier(usual)) }), { small: true, iconName: 'plus' }) : null,
          reformer ? btn('Easier springs', () => addOption({ kind: 'easier', springs: mv.load?.lighterIsHarder ? heavier(usual) : lighter(usual) }), { small: true, iconName: 'plus' }) : null,
          btn('Add a movement', () => addOption({ kind: 'harder', slug: '' }), { small: true, iconName: 'plus' }),
          btn('Other option', () => addOption({ kind: 'easier' }), { small: true, iconName: 'plus' })),
        (mv.modifications || []).length || (mv.layers || []).length ? h('details', { class: 'small', style: { marginTop: '8px' } }, h('summary', null, 'Ideas from the library'),
          h('div', { class: 'btn-row', style: { marginTop: '6px' } },
            (mv.modifications || []).map((m) => btn(`▼ ${m}`, () => addOption({ kind: 'easier', title: m }), { small: true, kind: 'ghost' })),
            (mv.layers || []).slice(1).map((l) => btn(`▲ ${l.title}`, () => addOption({ kind: 'harder', title: l.title, note: l.text }), { small: true, kind: 'ghost' })))) : null));
  }
  draw();

  const ok = await modal(mv.name, body, { wide: true, actions: [{ label: 'Cancel', value: false }, { label: 'Save', value: true, kind: 'primary' }] });
  if (!ok) return null;
  const options = st.options
    .map((o) => ({ ...o, title: (o.title || '').trim(), note: (o.note || '').trim() || undefined, slug: o.slug || undefined }))
    .filter((o) => o.title || o.slug || o.note || (o.springs && o.springs.length));
  return {
    reps: st.reps.trim() || undefined,
    note: st.note.trim() || undefined,
    load: st.springs !== null ? { springs: st.springs } : undefined,
    layers: st.layers.length ? st.layers : undefined,
    options: options.length ? options : undefined
  };
}

export const optionsBadge = (item) => {
  const n = (item.options || []).length + ((item.layers || []).length ? 1 : 0);
  return n ? h('span', { class: 'tag tag-accent', title: 'Layers and options planned for this movement' }, icon('layers', 11), ` ${n}`) : null;
};
