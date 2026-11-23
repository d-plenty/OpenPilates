import { h, icon, btn, toast, select, debounce, fill } from '../ui.js';
import { api, store, viewState } from '../store.js';
import { go } from '../app.js';
import { POSITIONS, SPINE, PATTERNS, EQUIPMENT, APPARATUS, CLASS_LEVELS, REGIONS, PURPOSES, SECTIONS, CATEGORIES, ROLES, PREGNANCY, labelOf, sectionOf, categoriesOf, roleOf, levelsOf, namesOf, fitSprings, loadWeight, USES, usesOf } from '/shared/vocab.js';
import { springNames } from '../charts.js';
import { newId } from '/shared/draft.js';
import { movementCard } from './common.js';

const FACETS = [
  { id: 'section', label: 'By part of the class', values: (m) => [sectionOf(m)], names: SECTIONS },
  { id: 'category', label: 'By movement category', values: (m) => categoriesOf(m), names: CATEGORIES },
  { id: 'position', label: 'By starting position', values: (m) => [m.position], names: POSITIONS },
  { id: 'region', label: 'By region', values: (m) => REGIONS.filter((r) => m.muscles.primary.some((x) => r.muscles.includes(x))).map((r) => r.id), names: REGIONS },
  { id: 'spine', label: 'By spine movement', values: (m) => m.spine || [], names: SPINE },
  { id: 'pattern', label: 'By movement pattern', values: (m) => m.patterns || [], names: PATTERNS },
  { id: 'equipment', label: 'By equipment', values: (m) => (m.equipment && m.equipment.length ? m.equipment : [m.apparatus === 'mat' ? 'none-mat' : 'none-reformer']), names: null },
  { id: 'load', label: 'By springs', values: null, names: null },
  { id: 'series', label: 'By series', values: (m) => (store.series || []).filter((s) => s.items.some((i) => i.slug === m.slug)).map((s) => s.slug), names: null },
  { id: 'purpose', label: 'By purpose', values: (m) => PURPOSES.filter((p) => (m.purpose?.[p.id] || 0) >= 2).map((p) => p.id), names: PURPOSES },
  { id: 'level', label: 'By level', values: (m) => levelsOf(m), names: CLASS_LEVELS },
  { id: 'role', label: 'Stability or mobility', values: (m) => [roleOf(m)], names: ROLES },
  { id: 'pregnancy', label: 'Pregnancy', values: (m) => [m.pregnancy || 'ok'], names: PREGNANCY },
  { id: 'uses', label: 'By place in the class', values: (m) => (usesOf(m).length ? usesOf(m) : ['work']), names: [...USES, { id: 'work', label: 'Working movements' }] },
  { id: 'status', label: 'By who has checked it', values: (m) => [m.check ? (m.check.status === 'ok' ? 'ok' : 'fix') : 'none', ...(m.source !== 'library' ? ['ours'] : [])],
    names: [{ id: 'ok', label: 'Checked by us' }, { id: 'fix', label: 'Flagged to fix' }, { id: 'none', label: 'Not checked yet' }, { id: 'ours', label: 'Added or changed by us' }] }
];

export async function exploreView(query) {
  const flows = (await api('GET', '/flows')).filter((f) => f.canEdit);
  const st = viewState('explore', { facet: 'section', cat: '', apparatus: 'all', q: '', flowId: '', activeSeg: null, dockOpen: false, moreFacets: false });
  if (query.get('flow')) st.flowId = query.get('flow');
  if (!flows.some((f) => f.id === st.flowId)) { st.flowId = flows[0]?.id || ''; st.activeSeg = null; }
  if (!FACETS.some((f) => f.id === st.facet)) st.facet = 'section';
  let flow = flows.find((f) => f.id === st.flowId) || null;
  const room = () => store.roomFor(flow || { apparatus: st.apparatus === 'mat' ? 'mat' : 'reformer' });

  const save = debounce(async () => {
    if (!flow) return;
    try { await api('PUT', `/flows/${flow.id}`, flow); } catch (e) { toast(e.message, { kind: 'error' }); }
  }, 500);

  // Spring settings exactly as they'd be set on this studio's reformers, lightest first.
  const loadKey = (m) => (m.load && m.apparatus === 'reformer' ? [...fitSprings(m.load.springs, room()).loads].sort().join('+') || 'none' : 'mat');
  const loadNames = () => {
    const seen = new Map();
    for (const m of store.movementList) { const k = loadKey(m); if (!seen.has(k)) seen.set(k, k === 'mat' ? null : k === 'none' ? [] : k.split('+')); }
    return [...seen.entries()].sort((a, b) => (a[1] ? loadWeight(a[1]) : 999) - (b[1] ? loadWeight(b[1]) : 999)).map(([k, loads]) => ({ id: k, label: loads ? springNames(loads, room()) : 'No springs (mat)' }));
  };
  const valuesOf = (f) => (f.id === 'load' ? (m) => [loadKey(m)] : f.values);
  const namesFor = (f) => (f.id === 'load' ? loadNames() : f.id === 'series' ? (store.series || []).map((s) => ({ id: s.slug, label: s.name })) : f.id === 'equipment' ? [...EQUIPMENT, { id: 'none-mat', label: 'Mat only' }, { id: 'none-reformer', label: 'Reformer only' }] : f.names);

  const facetsEl = h('div', { role: 'tablist', 'aria-label': 'Browse by', class: 'chips', style: { marginBottom: '14px' } });
  const catsEl = h('div', { class: 'cat-grid' });
  const cardsEl = h('section', { class: 'cards-pane', 'aria-label': 'Movements in this category' });
  const dockEl = h('aside', { class: 'flow-drawer', 'aria-label': 'Flow builder' });
  const tabEl = h('button', { type: 'button', class: 'flow-tab', 'aria-label': 'Open the flow builder' });

  const pool = () => store.movementList.filter((m) => (st.apparatus === 'all' || m.apparatus === st.apparatus) && (!st.q || (namesOf(m).join(' ') + ' ' + m.muscles.primary.join(' ')).toLowerCase().includes(st.q)));

  const draw = () => {
    const f = FACETS.find((x) => x.id === st.facet);
    const names = namesFor(f);
    const values = valuesOf(f);
    const counts = new Map();
    for (const m of pool()) for (const v of values(m)) counts.set(v, (counts.get(v) || 0) + 1);
    const cats = names.filter((n) => counts.get(n.id));
    if (!counts.get(st.cat)) st.cat = cats[0]?.id || '';
    // The six ways teachers browse most are always there; the rest are one press away.
    const MAIN = ['section', 'position', 'load', 'level', 'series', 'uses'];
    const shown = FACETS.filter((x) => st.moreFacets || MAIN.includes(x.id) || x.id === st.facet).sort((a, b) => (MAIN.includes(a.id) ? MAIN.indexOf(a.id) : 99) - (MAIN.includes(b.id) ? MAIN.indexOf(b.id) : 99));
    fill(facetsEl, ...shown.map((x) => h('button', { type: 'button', role: 'tab', 'aria-selected': x.id === st.facet ? 'true' : 'false', class: ['chip', x.id === st.facet && 'on'], onclick: () => { st.facet = x.id; st.cat = ''; draw(); } }, x.label)),
      h('button', { type: 'button', class: 'chip chip-more', 'aria-expanded': st.moreFacets ? 'true' : 'false', onclick: () => { st.moreFacets = !st.moreFacets; draw(); } }, st.moreFacets ? 'Fewer' : `More ways to browse (${FACETS.length - shown.length})`));
    fill(catsEl, ...(cats.length ? cats.map((c) => h('button', { type: 'button', class: ['cat', c.id === st.cat && 'on'], 'aria-pressed': c.id === st.cat ? 'true' : 'false', onclick: () => { st.cat = c.id; draw(); } },
      h('span', null, c.label), h('span', { class: 'n' }, counts.get(c.id)))) : [h('p', { class: 'muted' }, 'Nothing matches.')]));
    let list = pool().filter((m) => values(m).includes(st.cat));
    // A series lists its movements in teaching order.
    const series = f.id === 'series' ? (store.series || []).find((s) => s.slug === st.cat) : null;
    if (series) { const order = series.items.map((i) => i.slug); list = [...list].sort((a, b) => order.indexOf(a.slug) - order.indexOf(b.slug)); }
    const inFlow = new Set(flow ? flow.segments.flatMap((s) => s.items.map((i) => i.slug)) : []);
    fill(cardsEl, 
      h('div', { class: 'card-head' }, h('h2', null, labelOf(names, st.cat) || 'Movements'), h('span', { class: 'tiny muted' }, `${list.length} movement${list.length === 1 ? '' : 's'}`)),
      series && series.summary ? h('p', { class: 'small muted', style: { margin: '-4px 0 10px' } }, series.summary, ' Add the whole series in one go from the builder’s library, under Series.') : null,
      h('div', { class: 'cards-grid' }, list.map((m) => movementCard(m, room(), { onAdd: flow ? addToFlow : null, addLabel: 'Add to flow', inFlow: inFlow.has(m.slug), big: true, hide: f.id }))));
    drawDock();
  };

  const addToFlow = (mv) => {
    if (!flow) return;
    let seg = flow.segments.find((s) => s.id === st.activeSeg) || flow.segments[0];
    if (!seg) { seg = { id: newId('s'), name: 'Main', role: 'build', items: [] }; flow.segments.push(seg); }
    st.activeSeg = seg.id;
    seg.items.push({ id: newId(), slug: mv.slug });
    save();
    toast(`${mv.name} added to ${seg.name}.`);
    draw();
  };

  // The flow you're adding to lives in a drawer at the side, behind a small tab, so the
  // movements keep the whole page. Adding works with the drawer shut.
  const drawDock = () => {
    const count = flow ? flow.segments.reduce((a, s) => a + s.items.length, 0) : 0;
    const seg = flow ? flow.segments.find((s) => s.id === st.activeSeg) || flow.segments[0] : null;
    if (seg) st.activeSeg = seg.id;
    const toggle = (open) => { st.dockOpen = open; drawDock(); };
    fill(tabEl,
      icon('list', 16),
      h('span', null, flow ? h('b', null, flow.title) : 'Flow builder', flow && seg ? ` › ${seg.name}` : flow ? '' : ': no flow yet'),
      flow ? h('span', { class: 'n' }, count) : null);
    tabEl.setAttribute('aria-expanded', st.dockOpen ? 'true' : 'false');
    tabEl.onclick = () => toggle(!st.dockOpen);
    dockEl.classList.toggle('open', !!st.dockOpen);
    dockEl.inert = !st.dockOpen;
    fill(dockEl,
      h('div', { class: 'dock-head' },
        h('h2', null, 'Flow builder'),
        h('div', { class: 'spacer' }),
        btn('', () => toggle(false), { iconName: 'close', small: true, kind: 'ghost', title: 'Close the flow builder' })),
      flows.length ? h('label', { class: 'drawer-field' }, h('span', null, 'Adding to'),
        select(flows.map((f) => ({ id: f.id, label: f.title })), st.flowId, (v) => { st.flowId = v; flow = flows.find((f) => f.id === v); st.activeSeg = flow?.segments[0]?.id; draw(); }, { 'aria-label': 'Flow to add to' })) : h('p', { class: 'small', style: { color: '#A7B5AF' } }, 'You have no flows yet.'),
      flow ? h('div', { class: 'tiny', style: { color: '#A7B5AF', margin: '6px 0 10px' } }, `${flow.segments.length} phases · ${count} blocks. Pick a phase, then press + Flow on any movement.`) : null,
      flow ? h('div', { class: 'dock-segs' },
        flow.segments.map((s) => h('button', { type: 'button', class: ['dock-seg', st.activeSeg === s.id && 'on'], 'aria-pressed': st.activeSeg === s.id ? 'true' : 'false', onclick: () => { st.activeSeg = s.id; drawDock(); } },
          h('div', { style: { display: 'flex', justifyContent: 'space-between', gap: '8px', fontWeight: 700, fontSize: '14px' } }, h('span', null, s.name), h('span', { class: 'tiny muted' }, `${s.items.length}`)),
          s.items.length ? h('ol', null, s.items.map((i) => h('li', null, store.movements[i.slug]?.name || i.slug, i.variation ? ` · ${i.variation}` : ''))) : h('div', { class: 'tiny muted', style: { marginTop: '6px' } }, 'Empty'))),
        h('button', { type: 'button', class: 'dock-seg', style: { borderStyle: 'dashed', textAlign: 'center', color: '#7FD3C3', fontWeight: 700 }, onclick: () => {
          const s = { id: newId('s'), name: 'New phase', role: 'build', items: [] };
          const cool = flow.segments.findIndex((x) => x.role === 'cooldown');
          if (cool >= 0) flow.segments.splice(cool, 0, s); else flow.segments.push(s);
          st.activeSeg = s.id; save(); drawDock();
        } }, '+ Add a phase')) : null,
      h('div', { class: 'btn-row', style: { marginTop: '12px' } },
        flow ? h('a', { class: 'btn btn-sm btn-primary', href: `#/flows/${flow.id}` }, 'Open in builder') : null,
        btn(flow ? 'New flow' : 'Create a flow', async () => {
          const f = await api('POST', '/flows', { title: 'New flow', apparatus: st.apparatus === 'mat' ? 'mat' : 'reformer', segments: [{ id: newId('s'), name: 'Warm-up', role: 'warmup', items: [] }, { id: newId('s'), name: 'Main', role: 'build', items: [] }, { id: newId('s'), name: 'Cool-down', role: 'cooldown', items: [] }] });
          flows.unshift(f); flow = f; st.flowId = f.id; st.activeSeg = f.segments[0].id; st.dockOpen = true; draw();
        }, { small: true, kind: flow ? 'secondary' : 'primary' })));
  };

  draw();
  return { title: 'Movements', cleanup: () => save.flush(), node: [
    h('div', { class: 'page-head' },
      h('div', { class: 'grow' }, h('h1', null, 'Movement explorer'), h('div', { class: 'small muted' }, `${store.movementList.filter((m) => m.apparatus === 'reformer').length} reformer · ${store.movementList.filter((m) => m.apparatus === 'mat').length} mat · ${(store.series || []).length} series`)),
      h('div', { class: 'btn-row' },
        h('div', { class: 'seg', role: 'group', 'aria-label': 'Apparatus' }, [{ id: 'all', label: 'All' }, ...APPARATUS].map((a) =>
          h('button', { type: 'button', class: st.apparatus === a.id ? 'on' : null, 'aria-pressed': st.apparatus === a.id ? 'true' : 'false', onclick: (e) => { st.apparatus = a.id; e.currentTarget.parentElement.querySelectorAll('button').forEach((b) => { b.classList.toggle('on', b === e.currentTarget); b.setAttribute('aria-pressed', b === e.currentTarget ? 'true' : 'false'); }); draw(); } }, a.label))),
        h('input', { type: 'search', value: st.q, placeholder: 'Search any name', 'aria-label': 'Search movements', style: { width: '220px' }, oninput: (e) => { st.q = e.target.value.toLowerCase(); draw(); } }),
        (store.removedList || []).length + (store.removedSeries || []).length ? h('a', { class: 'btn', href: '#/removed', title: 'Movements and series taken out of your library' }, `Removed · ${store.removedList.length + store.removedSeries.length}`) : null,
        h('a', { class: 'btn', href: '#/review', title: 'Mark each movement as right or needing a fix' }, icon('check'), `Review · ${store.movementList.filter((m) => m.check).length}/${store.movementList.length}`),
        h('a', { class: 'btn btn-primary', href: '#/movements/new' }, icon('plus'), 'New movement'))),
    facetsEl,
    h('div', { class: 'explorer' }, catsEl, cardsEl),
    tabEl, dockEl] };
}
