import { h, icon, btn, toast, select, debounce, fill } from '../ui.js';
import { api, store } from '../store.js';
import { go } from '../app.js';
import { POSITIONS, SPINE, PATTERNS, EQUIPMENT, APPARATUS, LEVELS, REGIONS, PURPOSES, LOAD_LEVELS, springFor, labelOf } from '/shared/vocab.js';
import { newId } from '/shared/draft.js';
import { movementCard } from './common.js';

const FACETS = [
  { id: 'position', label: 'By starting position', values: (m) => [m.position], names: POSITIONS },
  { id: 'region', label: 'By region', values: (m) => REGIONS.filter((r) => m.muscles.primary.some((x) => r.muscles.includes(x))).map((r) => r.id), names: REGIONS },
  { id: 'spine', label: 'By spine movement', values: (m) => m.spine || [], names: SPINE },
  { id: 'pattern', label: 'By movement pattern', values: (m) => m.patterns || [], names: PATTERNS },
  { id: 'equipment', label: 'By equipment', values: (m) => (m.equipment && m.equipment.length ? m.equipment : [m.apparatus === 'mat' ? 'none-mat' : 'none-reformer']), names: [...EQUIPMENT, { id: 'none-mat', label: 'Mat only' }, { id: 'none-reformer', label: 'Reformer only' }] },
  { id: 'load', label: 'By spring load', values: (m) => (m.load ? [...new Set(m.load.springs)] : ['none']), names: null },
  { id: 'purpose', label: 'By purpose', values: (m) => PURPOSES.filter((p) => (m.purpose?.[p.id] || 0) >= 2).map((p) => p.id), names: PURPOSES },
  { id: 'level', label: 'By level', values: (m) => [m.level], names: LEVELS }
];

export async function exploreView(query) {
  const flows = (await api('GET', '/flows')).filter((f) => f.canEdit);
  const st = { facet: 'position', cat: '', apparatus: 'all', q: '', flowId: query.get('flow') || flows[0]?.id || '', activeSeg: null };
  let flow = flows.find((f) => f.id === st.flowId) || null;
  const room = () => store.roomFor(flow || { apparatus: st.apparatus === 'mat' ? 'mat' : 'reformer' });

  const save = debounce(async () => {
    if (!flow) return;
    try { await api('PUT', `/flows/${flow.id}`, flow); } catch (e) { toast(e.message, { kind: 'error' }); }
  }, 500);

  const loadNames = () => LOAD_LEVELS.map((l) => { const sp = springFor(room().brand, l, room().springOverrides); return { id: l, label: `${l.replace('x', 'extra ')} · ${sp.name}${sp.approx ? ' (closest)' : ''}` }; }).concat([{ id: 'none', label: 'No springs (mat)' }]);

  const facetsEl = h('div', { role: 'tablist', 'aria-label': 'Browse by', class: 'chips', style: { marginBottom: '14px' } });
  const catsEl = h('div', { class: 'cat-grid' });
  const cardsEl = h('section', { class: 'cards-pane', 'aria-label': 'Movements in this category' });
  const dockEl = h('section', { class: 'dock', 'aria-label': 'Flow builder' });

  const pool = () => store.movementList.filter((m) => (st.apparatus === 'all' || m.apparatus === st.apparatus) && (!st.q || (m.name + ' ' + m.muscles.primary.join(' ')).toLowerCase().includes(st.q)));

  const draw = () => {
    const f = FACETS.find((x) => x.id === st.facet);
    const names = f.names || loadNames();
    const counts = new Map();
    for (const m of pool()) for (const v of f.values(m)) counts.set(v, (counts.get(v) || 0) + 1);
    const cats = names.filter((n) => counts.get(n.id));
    if (!counts.get(st.cat)) st.cat = cats[0]?.id || '';
    fill(facetsEl, ...FACETS.map((x) => h('button', { type: 'button', role: 'tab', 'aria-selected': x.id === st.facet ? 'true' : 'false', class: ['chip', x.id === st.facet && 'on'], onclick: () => { st.facet = x.id; st.cat = ''; draw(); } }, x.label)));
    fill(catsEl, ...(cats.length ? cats.map((c) => h('button', { type: 'button', class: ['cat', c.id === st.cat && 'on'], 'aria-pressed': c.id === st.cat ? 'true' : 'false', onclick: () => { st.cat = c.id; draw(); } },
      h('span', null, c.label), h('span', { class: 'n' }, counts.get(c.id)))) : [h('p', { class: 'muted' }, 'Nothing matches.')]));
    const list = pool().filter((m) => f.values(m).includes(st.cat));
    const inFlow = new Set(flow ? flow.segments.flatMap((s) => s.items.map((i) => i.slug)) : []);
    fill(cardsEl, 
      h('div', { class: 'card-head' }, h('h2', null, labelOf(names, st.cat) || 'Movements'), h('span', { class: 'tiny muted' }, `${list.length} movement${list.length === 1 ? '' : 's'}`)),
      h('div', { class: 'cards-grid' }, list.map((m) => movementCard(m, room(), { onAdd: flow ? addToFlow : null, addLabel: 'Flow', inFlow: inFlow.has(m.slug) }))));
    drawDock();
  };

  const addToFlow = (mv) => {
    if (!flow) return;
    let seg = flow.segments.find((s) => s.id === st.activeSeg) || flow.segments[0];
    if (!seg) { seg = { id: newId('s'), name: 'Main', role: 'build', bpm: null, items: [] }; flow.segments.push(seg); }
    st.activeSeg = seg.id;
    seg.items.push({ id: newId(), slug: mv.slug });
    save();
    toast(`${mv.name} added to ${seg.name}.`);
    draw();
  };

  const drawDock = () => {
    const count = flow ? flow.segments.reduce((a, s) => a + s.items.length, 0) : 0;
    fill(dockEl, 
      h('div', { class: 'dock-head' },
        h('h2', null, 'Flow builder'),
        flows.length ? select(flows.map((f) => ({ id: f.id, label: f.title })), st.flowId, (v) => { st.flowId = v; flow = flows.find((f) => f.id === v); st.activeSeg = flow?.segments[0]?.id; draw(); }, { 'aria-label': 'Flow to add to' }) : null,
        flow ? h('span', { class: 'tiny muted' }, `${flow.segments.length} segments · ${count} movements`) : h('span', { class: 'tiny muted' }, 'No flow yet'),
        h('div', { class: 'spacer' }),
        flow ? h('a', { class: 'btn btn-sm btn-primary', href: `#/flows/${flow.id}` }, 'Open in builder') : btn('Create a flow', async () => {
          const f = await api('POST', '/flows', { title: 'New flow', apparatus: st.apparatus === 'mat' ? 'mat' : 'reformer', segments: [{ id: newId('s'), name: 'Warm-up', role: 'warmup', items: [] }, { id: newId('s'), name: 'Main', role: 'build', items: [] }, { id: newId('s'), name: 'Cool-down', role: 'cooldown', items: [] }] });
          flows.unshift(f); flow = f; st.flowId = f.id; st.activeSeg = f.segments[0].id; draw();
        }, { small: true, kind: 'primary' })),
      flow ? h('div', { class: 'dock-segs' },
        flow.segments.map((s) => {
          if (!st.activeSeg) st.activeSeg = s.id;
          return h('button', { type: 'button', class: ['dock-seg', st.activeSeg === s.id && 'on'], 'aria-pressed': st.activeSeg === s.id ? 'true' : 'false', onclick: () => { st.activeSeg = s.id; drawDock(); } },
            h('div', { style: { display: 'flex', justifyContent: 'space-between', gap: '8px', fontWeight: 700, fontSize: '14px' } }, h('span', null, s.name), h('span', { class: 'tiny muted' }, `${s.items.length}${s.bpm ? ' · ' + s.bpm + ' BPM' : ''}`)),
            s.items.length ? h('ol', null, s.items.map((i) => h('li', null, store.movements[i.slug]?.name || i.slug))) : h('div', { class: 'tiny muted', style: { marginTop: '6px' } }, 'Select, then press + Flow'));
        }),
        h('button', { type: 'button', class: 'dock-seg', style: { borderStyle: 'dashed', textAlign: 'center', color: '#7FD3C3', fontWeight: 700 }, onclick: () => {
          const s = { id: newId('s'), name: 'New segment', role: 'build', bpm: null, items: [] };
          const cool = flow.segments.findIndex((x) => x.role === 'cooldown');
          if (cool >= 0) flow.segments.splice(cool, 0, s); else flow.segments.push(s);
          st.activeSeg = s.id; save(); drawDock();
        } }, '+ Add segment')) : null);
  };

  draw();
  return { title: 'Movements', cleanup: () => save.flush(), node: [
    h('div', { class: 'page-head' },
      h('div', { class: 'grow' }, h('h1', null, 'Movement explorer'), h('div', { class: 'small muted' }, `${store.movementList.length} movements · reformer and mat`)),
      h('div', { class: 'btn-row' },
        h('div', { class: 'seg', role: 'group', 'aria-label': 'Apparatus' }, [{ id: 'all', label: 'All' }, ...APPARATUS].map((a) =>
          h('button', { type: 'button', class: st.apparatus === a.id ? 'on' : null, 'aria-pressed': st.apparatus === a.id ? 'true' : 'false', onclick: (e) => { st.apparatus = a.id; e.currentTarget.parentElement.querySelectorAll('button').forEach((b) => { b.classList.toggle('on', b === e.currentTarget); b.setAttribute('aria-pressed', b === e.currentTarget ? 'true' : 'false'); }); draw(); } }, a.label))),
        h('input', { type: 'search', placeholder: 'Search', 'aria-label': 'Search movements', style: { width: '220px' }, oninput: (e) => { st.q = e.target.value.toLowerCase(); draw(); } }),
        h('a', { class: 'btn btn-primary', href: '#/movements/new' }, icon('plus'), 'New movement'))),
    facetsEl,
    h('div', { class: 'explorer' }, catsEl, cardsEl),
    dockEl] };
}
