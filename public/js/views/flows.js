import { h, icon, btn, toast, chips, field, select, empty, fmtDate, fill } from '../ui.js';
import { api, store } from '../store.js';
import { go } from '../app.js';
import { analyze } from '/shared/analysis.js';
import { draftFlow, GOALS, newId } from '/shared/draft.js';
import { LEVELS, CAUTIONS, labelOf } from '/shared/vocab.js';
import { fmtMin } from './common.js';

export async function flowsView() {
  const flows = await api('GET', '/flows');
  let filter = 'all';
  let q = '';
  const listEl = h('div');

  const draw = () => {
    const me = store.user.id;
    const shown = flows.filter((f) => (filter === 'all' || (filter === 'mine' ? f.ownerId === me : filter === 'shared' ? f.shared : f.apparatus === filter))
      && (!q || f.title.toLowerCase().includes(q)));
    fill(listEl, shown.length ? h('div', { class: 'flow-grid' }, shown.map(card)) :
      empty(flows.length ? 'No flows match' : 'No flows yet', flows.length ? 'Try another filter.' : 'Start your first class plan — build it yourself or let OpenPilates draft one.',
        flows.length ? null : h('a', { class: 'btn btn-primary', href: '#/flows/new' }, icon('plus'), 'New flow')));
  };

  const card = (f) => {
    const a = analyze({ ...store.analysisContext(f), flow: f });
    const segTotal = a.totalSec || 1;
    const warn = a.checks.filter((c) => c.level === 'warn' || c.level === 'action').length;
    return h('a', { class: 'flow-card', href: `#/flows/${f.id}` },
      h('div', { style: { display: 'flex', gap: '6px', flexWrap: 'wrap' } },
        h('span', { class: 'tag tag-accent' }, f.apparatus === 'mat' ? 'Mat' : f.apparatus === 'mixed' ? 'Mixed' : 'Reformer'),
        h('span', { class: 'tag' }, labelOf(LEVELS, f.level)),
        f.shared ? h('span', { class: 'tag' }, 'Shared') : null,
        f.ownerId !== store.user.id ? h('span', { class: 'tag' }, `By ${f.ownerName}`) : null),
      h('div', { class: 't' }, f.title),
      h('div', { class: 'mini-bar' }, a.segments.map((s, i) => h('div', { style: { flex: `${s.sec || 1} 1 0`, background: ['#7FB8AD', '#4E9C8F', '#0F6E62', '#2F4A3F'][i % 4] } }))),
      h('div', { class: 'tiny muted' }, `${fmtMin(a.totalSec)} · ${f.segments.length} segments · ${a.count} movements`),
      h('div', { class: 'tiny', style: { fontWeight: 600, color: warn ? '#8A3A14' : '#0A5047' } }, warn ? `${warn} thing${warn > 1 ? 's' : ''} to check` : a.count ? 'Looks balanced' : 'Empty'),
      h('div', { class: 'tiny muted' }, `Updated ${fmtDate(f.updatedAt)}`));
  };

  const importFile = async (file) => {
    try {
      const data = JSON.parse(await file.text());
      const f = await api('POST', '/flows/import', data);
      toast(f.movementsAdded ? `Imported, with ${f.movementsAdded} new movement${f.movementsAdded > 1 ? 's' : ''}.` : 'Flow imported.');
      go(`/flows/${f.id}`);
    } catch (e) { toast(e.message, { kind: 'error' }); }
  };
  const fileInput = h('input', { type: 'file', accept: '.json,application/json', class: 'sr-only', onchange: (e) => e.target.files[0] && importFile(e.target.files[0]) });

  draw();
  return { title: 'Flows', node: [
    h('div', { class: 'page-head' },
      h('div', { class: 'grow' }, h('div', { class: 'eyebrow' }, store.state.studioName), h('h1', null, 'Flows')),
      h('div', { class: 'btn-row' },
        h('label', { class: 'btn' }, icon('upload'), 'Import', fileInput),
        h('a', { class: 'btn btn-primary', href: '#/flows/new' }, icon('plus'), 'New flow'))),
    h('div', { class: 'btn-row', style: { marginBottom: '14px' } },
      chips([{ id: 'all', label: 'All' }, { id: 'mine', label: 'Mine' }, { id: 'shared', label: 'Shared' }, { id: 'reformer', label: 'Reformer' }, { id: 'mat', label: 'Mat' }], filter, (v) => { filter = v; draw(); }, { multi: false }),
      h('div', { class: 'spacer' }),
      h('input', { type: 'search', placeholder: 'Search flows', 'aria-label': 'Search flows', style: { maxWidth: '260px' }, oninput: (e) => { q = e.target.value.toLowerCase(); draw(); } })),
    listEl] };
}

export async function newFlowView() {
  const st = { goal: 'full_body', apparatus: 'reformer', lengthMin: 50, level: 'intermediate', adapt: true, booked: [], room: '' };
  const clients = store.clients.filter((c) => !c.archived);
  const wrap = h('div', { class: 'stack', style: { maxWidth: '760px' } });

  const draw = () => {
    const rooms = store.studio.rooms.filter((r) => st.apparatus === 'mixed' || r.apparatus === st.apparatus);
    if (!rooms.find((r) => r.id === st.room)) st.room = rooms[0]?.id || '';
    const bookedTags = new Set(st.booked.flatMap((id) => clients.find((c) => c.id === id)?.tags || []));
    fill(wrap, 
      h('div', { class: 'card stack' },
        h('h2', null, 'What kind of class?'),
        field('Goal', chips(GOALS.map((g) => ({ id: g.id, label: g.label })), st.goal, (v) => { st.goal = v; draw(); }, { multi: false })),
        field('Apparatus', chips([{ id: 'reformer', label: 'Reformer' }, { id: 'mat', label: 'Mat' }], st.apparatus, (v) => { st.apparatus = v; draw(); }, { multi: false })),
        field('Length', chips([30, 45, 50, 55, 60].map((n) => ({ id: n, label: `${n} min` })), st.lengthMin, (v) => { st.lengthMin = v; draw(); }, { multi: false })),
        field('Level', chips(LEVELS.map((l) => ({ id: l.id, label: l.label })), st.level, (v) => { st.level = v; draw(); }, { multi: false })),
        rooms.length > 1 ? field('Room', select(rooms.map((r) => ({ id: r.id, label: r.name })), st.room, (v) => { st.room = v; })) : null),
      h('div', { class: 'card stack' },
        h('div', { class: 'card-head', style: { margin: 0 } }, h('h2', null, 'Who\'s booked'), h('span', { class: 'tiny muted' }, 'Optional')),
        clients.length ? chips(clients.map((c) => ({ id: c.id, label: c.name + (c.tags.length ? ' •' : '') })), st.booked, (v) => { st.booked = v; draw(); }) :
          h('p', { class: 'muted small' }, 'No clients yet. Add them on the Clients page to get checks for injuries and pregnancy.'),
        bookedTags.size ? h('label', { style: { display: 'flex', gap: '8px', alignItems: 'center', fontSize: '14px' } },
          h('input', { type: 'checkbox', checked: st.adapt, onchange: (e) => { st.adapt = e.target.checked; } }),
          `Prefer movements that suit: ${[...bookedTags].map((t) => labelOf(CAUTIONS, t)).join(', ')}`) : null),
      h('div', { class: 'btn-row' },
        btn('Draft a flow for me', () => create(true), { kind: 'primary', iconName: 'sparkle' }),
        btn('Start blank', () => create(false)),
        h('a', { class: 'btn btn-ghost', href: '#/' }, 'Cancel')),
      h('p', { class: 'tiny muted' }, 'Drafts are built from your library, your studio\'s equipment and your class targets. Change anything afterwards.'));
  };

  const create = async (draft) => {
    const bookedTags = st.adapt ? [...new Set(st.booked.flatMap((id) => clients.find((c) => c.id === id)?.tags || []))] : [];
    let flow;
    if (draft) {
      flow = draftFlow({ movements: store.movements, goal: st.goal, apparatus: st.apparatus, lengthMin: st.lengthMin, level: st.level, props: store.studio.props, clientTags: bookedTags });
      if (!flow.segments.length) { toast('Not enough movements match. Try another goal or level.', { kind: 'error' }); return; }
    } else {
      flow = { title: 'New flow', apparatus: st.apparatus, level: st.level, lengthMin: st.lengthMin, goal: st.goal, target: 'general',
        segments: [{ id: newId('s'), name: 'Warm-up', role: 'warmup', bpm: 90, items: [] }, { id: newId('s'), name: 'Main', role: 'build', bpm: 104, items: [] }, { id: newId('s'), name: 'Cool-down', role: 'cooldown', bpm: 80, items: [] }] };
    }
    flow.room = st.room;
    flow.booked = st.booked.map((id) => ({ clientId: id, spot: '' }));
    try {
      const saved = await api('POST', '/flows', flow);
      go(`/flows/${saved.id}`);
    } catch (e) { toast(e.message, { kind: 'error' }); }
  };

  draw();
  return { title: 'New flow', node: [h('div', { class: 'page-head' }, h('div', { class: 'grow' }, h('a', { href: '#/', class: 'small' }, '← Flows'), h('h1', null, 'New flow'))), wrap] };
}
