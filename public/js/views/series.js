// Make or change a series: a ready-built run of movements that drops into a flow in one go.
import { h, btn, field, select, modal, toast, fill } from '../ui.js';
import { api, store } from '../store.js';
import { variationsOf } from '/shared/vocab.js';

export async function editSeriesDialog(series, { apparatus = 'reformer' } = {}) {
  const s = series ? structuredClone(series) : { name: '', apparatus, aka: [], summary: '', items: [] };
  s.items = (s.items || []).filter((i) => store.movements[i.slug]);
  const listEl = h('div', { class: 'stack-sm' });
  const err = h('p', { class: 'error', role: 'alert' });
  const pool = () => store.movementList.filter((m) => m.apparatus === s.apparatus);
  const draw = () => fill(listEl,
    s.items.length ? s.items.map((it, i) => {
      const mv = store.movements[it.slug];
      const vars = variationsOf(mv);
      return h('div', { class: 'series-edit-row' },
        h('span', { class: 'be-n' }, String(i + 1)),
        h('b', { class: 'small' }, mv.name),
        vars.length ? select([{ id: '', label: 'Standard' }, ...vars.map((v) => ({ id: v.name, label: v.name }))], it.variation || '', (v) => { if (v) it.variation = v; else delete it.variation; }, { 'aria-label': `Version of ${mv.name}` }) : h('span', { class: 'tiny muted' }, 'One version'),
        h('span', { class: 'tools' },
          btn('', () => { if (i > 0) { [s.items[i - 1], s.items[i]] = [s.items[i], s.items[i - 1]]; draw(); } }, { iconName: 'up', small: true, kind: 'ghost', title: 'Earlier' }),
          btn('', () => { if (i < s.items.length - 1) { [s.items[i + 1], s.items[i]] = [s.items[i], s.items[i + 1]]; draw(); } }, { iconName: 'down', small: true, kind: 'ghost', title: 'Later' }),
          btn('', () => { s.items.splice(i, 1); draw(); }, { iconName: 'close', small: true, kind: 'ghost', title: 'Take out' })));
    }) : h('p', { class: 'small muted' }, 'No movements yet. Add the first one below.'),
    select([{ id: '', label: 'Add a movement…' }, ...pool().map((m) => ({ id: m.slug, label: m.name }))], '', (v) => { if (v) { s.items.push({ slug: v }); draw(); } }, { 'aria-label': 'Add a movement' }));
  draw();
  const ok = await modal(series ? `Edit ${series.name}` : 'New series', h('div', { class: 'stack' },
    h('div', { class: 'grid-2' },
      field('Name', h('input', { type: 'text', value: s.name, placeholder: 'e.g. Short box series', oninput: (e) => { s.name = e.target.value; } })),
      series ? field('Apparatus', h('input', { type: 'text', value: s.apparatus === 'mat' ? 'Mat' : 'Reformer', disabled: true }))
        : field('Apparatus', select([{ id: 'reformer', label: 'Reformer' }, { id: 'mat', label: 'Mat' }], s.apparatus, (v) => { s.apparatus = v; s.items = []; draw(); }))),
    field('What it is', h('input', { type: 'text', value: s.summary || '', placeholder: 'A line for your team (optional)', oninput: (e) => { s.summary = e.target.value; } })),
    field('Movements, in teaching order', listEl), err),
  { wide: true, actions: [{ label: 'Cancel', value: false }, { label: series ? 'Save series' : 'Create series', value: true, kind: 'primary' }] });
  if (!ok) return null;
  try {
    const out = series ? await api('PUT', `/series/${series.slug}`, s) : await api('POST', '/series', s);
    await store.loadSeries(true);
    toast(series ? 'Series saved.' : 'Series created. Find it under Series in the library.');
    return out;
  } catch (e) { toast(e.message, { kind: 'error' }); return null; }
}
