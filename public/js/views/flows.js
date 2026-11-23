import { h, icon, btn, toast, chips, field, select, empty, fmtDate, fill } from '../ui.js';
import { api, store, viewState } from '../store.js';
import { go } from '../app.js';
import { analyze } from '/shared/analysis.js';
import { draftFlow, GOALS, phasesFor, blankSegments } from '/shared/draft.js';
import { CAUTIONS, CLASS_LEVELS, labelOf, classLevel, defaultClassLevel, classTypesOf } from '/shared/vocab.js';

const ROLE_COLOR = { warmup: '#7FB8AD', build: '#4E9C8F', peak: '#0F6E62', cooldown: '#A9C7BF' };
import { fmtMin } from './common.js';

export async function flowsView() {
  const flows = await api('GET', '/flows');
  const vs = viewState('flows', { filter: 'all', q: '' });
  let filter = vs.filter;
  let q = vs.q;
  const listEl = h('div');

  const draw = () => {
    const me = store.user.id;
    const shown = flows.filter((f) => (filter === 'all' || (filter === 'mine' ? f.ownerId === me : filter === 'shared' ? f.shared : f.apparatus === filter))
      && (!q || f.title.toLowerCase().includes(q)));
    fill(listEl, shown.length ? h('div', { class: 'flow-grid' }, shown.map(card)) :
      empty(flows.length ? 'No flows match' : 'No flows yet', flows.length ? 'Try another filter.' : 'Start your first class plan — build it yourself or let OpenPilates draft one.',
        flows.length ? null : h('a', { class: 'btn btn-primary', href: '#/flows/new' }, icon('plus'), 'New flow')));
  };

  const typeName = (f) => (classTypesOf(store.studio).find((c) => c.id === f.classType) || {}).name;
  const card = (f) => {
    const a = analyze({ ...store.analysisContext(f), flow: f });
    const segTotal = a.totalSec || 1;
    const warn = a.checks.filter((c) => c.level === 'warn' || c.level === 'action').length;
    return h('div', { class: 'flow-card' },
      a.count ? h('a', { class: 'card-play', href: `#/flows/${f.id}/play`, 'aria-label': `Play ${f.title}`, title: 'Start teaching' }, icon('play', 20)) : null,
      h('a', { class: 'card-link', href: `#/flows/${f.id}` },
        h('div', { style: { display: 'flex', gap: '6px', flexWrap: 'wrap' } },
          h('span', { class: 'tag tag-accent' }, f.apparatus === 'mat' ? 'Mat' : f.apparatus === 'mixed' ? 'Mixed' : 'Reformer'),
          h('span', { class: 'tag' }, classLevel(f.level).label),
          typeName(f) ? h('span', { class: 'tag' }, typeName(f)) : null,
          f.shared ? h('span', { class: 'tag' }, 'Shared') : null,
          f.ownerId !== store.user.id ? h('span', { class: 'tag' }, `By ${f.ownerName}`) : null),
        h('div', { class: 't' }, f.title),
        h('div', { class: 'mini-bar' }, a.segments.map((s, i) => h('div', { style: { flex: `${s.sec || 1} 1 0`, background: ROLE_COLOR[f.segments[i]?.role] || '#4E9C8F' } }))),
        h('div', { class: 'tiny muted' }, `${fmtMin(a.totalSec)} · ${a.count} block${a.count === 1 ? '' : 's'}${a.hasReformer ? ` · ${a.springChanges} spring change${a.springChanges === 1 ? '' : 's'}` : ''}`),
        h('div', { class: 'tiny', style: { fontWeight: 600, color: warn ? '#8A3A14' : '#0A5047' } }, warn ? `${warn} thing${warn > 1 ? 's' : ''} to check` : a.count ? 'Looks balanced' : 'Empty'),
        h('div', { class: 'tiny muted' }, `Updated ${fmtDate(f.updatedAt)}`)));
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
      chips([{ id: 'all', label: 'All' }, { id: 'mine', label: 'Mine' }, { id: 'shared', label: 'Shared' }, { id: 'reformer', label: 'Reformer' }, { id: 'mat', label: 'Mat' }], filter, (v) => { filter = vs.filter = v; draw(); }, { multi: false }),
      h('div', { class: 'spacer' }),
      h('input', { type: 'search', value: q, placeholder: 'Search flows', 'aria-label': 'Search flows', style: { maxWidth: '260px' }, oninput: (e) => { q = vs.q = e.target.value.toLowerCase(); draw(); } })),
    listEl] };
}

export async function newFlowView() {
  const types = classTypesOf(store.studio);
  const lengths = store.studio.lengths && store.studio.lengths.length ? store.studio.lengths : [30, 45, 50, 55, 60];
  const vs = viewState('newflow', { classType: types[0].id, goal: 'full_body', level: '', lengthMin: 0 });
  const st = { classType: types.some((c) => c.id === vs.classType) ? vs.classType : types[0].id, goal: vs.goal, level: CLASS_LEVELS.some((l) => l.id === vs.level) ? vs.level : defaultClassLevel(), lengthMin: vs.lengthMin, adapt: true, booked: [], room: '' };
  const type = () => types.find((c) => c.id === st.classType) || types[0];
  if (!st.lengthMin) st.lengthMin = type().lengthMin || store.studio.defaultLength || 50;
  const clients = store.clients.filter((c) => !c.archived);
  const wrap = h('div', { class: 'stack', style: { maxWidth: '860px' } });

  const draw = () => {
    const ct = type();
    Object.assign(vs, { classType: st.classType, goal: st.goal, level: st.level, lengthMin: st.lengthMin });
    const rooms = store.studio.rooms.filter((r) => r.apparatus === ct.apparatus);
    if (!rooms.find((r) => r.id === st.room)) st.room = rooms[0]?.id || '';
    const bookedTags = new Set(st.booked.flatMap((id) => clients.find((c) => c.id === id)?.tags || []));
    const phases = phasesFor(ct, st.lengthMin, { props: store.studio.props });
    const lens = lengths.includes(st.lengthMin) ? lengths : [...lengths, st.lengthMin].sort((a, b) => a - b);
    const lv = classLevel(st.level);
    fill(wrap,
      h('div', { class: 'card stack' },
        h('h2', null, 'What are you teaching?'),
        h('div', { class: 'pick-grid' }, types.map((c) => h('button', { type: 'button', class: ['pick-card', c.id === st.classType && 'on'], 'aria-pressed': c.id === st.classType ? 'true' : 'false',
          onclick: () => { st.classType = c.id; st.lengthMin = c.lengthMin || st.lengthMin; if (c.level && CLASS_LEVELS.some((l) => l.id === c.level)) st.level = c.level; draw(); } },
          h('span', { class: 'pick-top' }, h('span', { class: 'pick-name' }, c.name), h('span', { class: 'tag tag-accent' }, c.apparatus === 'mat' ? 'Mat' : 'Reformer')),
          c.note ? h('span', { class: 'pick-note' }, c.note) : null,
          h('span', { class: 'mini-bar' }, c.phases.map((p) => h('span', { style: { flex: `${p.minutes} 1 0`, background: ROLE_COLOR[p.role] } })))))),
        h('p', { class: 'tiny muted' }, 'Class types, levels and lengths are yours to change in ', h('a', { href: '#/studio' }, 'Studio → Classes'), '.'),
        field('Length', chips(lens.map((n) => ({ id: n, label: `${n} min` })), st.lengthMin, (v) => { st.lengthMin = v; draw(); }, { multi: false })),
        field('Level', chips(CLASS_LEVELS.map((l) => ({ id: l.id, label: l.label })), st.level, (v) => { st.level = v; draw(); }, { multi: false }),
          lv.from === lv.to ? null : 'Offered movements span this level\'s range, so there is something for each end of the room.'),
        field('Focus', chips(GOALS.map((g) => ({ id: g.id, label: g.label })), st.goal, (v) => { st.goal = v; draw(); }, { multi: false }), 'Only steers a draft. Full body follows the class type as it is.'),
        rooms.length > 1 ? field('Room', select(rooms.map((r) => ({ id: r.id, label: r.name })), st.room, (v) => { st.room = v; })) : null),
      h('div', { class: 'card stack' },
        h('div', { class: 'card-head', style: { margin: 0 } }, h('h2', null, `How ${st.lengthMin} minutes is shared out`), h('span', { class: 'tiny muted' }, ct.apparatus === 'mat' ? '' : `Up to ${ct.springBudget} spring changes`)),
        h('div', { class: 'phase-preview' }, phases.map((p) => h('div', { class: 'pp', style: { flex: `${p.sec} 1 0` } },
          h('div', { class: 'pp-bar', style: { background: ROLE_COLOR[p.role] } }),
          h('div', { class: 'pp-name' }, p.name), h('div', { class: 'tiny muted' }, `${Math.max(1, Math.round(p.sec / 60))} min`))))),
      h('div', { class: 'card stack' },
        h('div', { class: 'card-head', style: { margin: 0 } }, h('h2', null, 'Who\'s booked'), h('span', { class: 'tiny muted' }, 'Optional')),
        clients.length ? chips(clients.map((c) => ({ id: c.id, label: c.name + (c.tags.length ? ' •' : '') })), st.booked, (v) => { st.booked = v; draw(); }) :
          h('p', { class: 'muted small' }, 'No clients yet. Add them on the Clients page to check a flow against injuries and pregnancy.'),
        bookedTags.size ? h('label', { class: 'check-row' },
          h('input', { type: 'checkbox', checked: st.adapt, onchange: (e) => { st.adapt = e.target.checked; } }),
          h('span', null, `Steer a draft away from movements flagged for: ${[...bookedTags].map((t) => labelOf(CAUTIONS, t)).join(', ')}`)) : null),
      h('div', { class: 'btn-row' },
        btn('Draft it for me', () => create(true), { kind: 'primary', iconName: 'sparkle' }),
        btn('Start with empty phases', () => create(false)),
        h('a', { class: 'btn btn-ghost', href: '#/' }, 'Cancel')),
      h('p', { class: 'tiny muted' }, 'A draft follows the class type: each phase gets its minutes and a few blocks, warm-ups and cool-downs only use movements marked for them, and the hardest work is kept for the peak. It is a starting point. Change anything.'));
  };

  const create = async (draft) => {
    const ct = type();
    const bookedTags = st.adapt ? [...new Set(st.booked.flatMap((id) => clients.find((c) => c.id === id)?.tags || []))] : [];
    let flow;
    if (draft) {
      flow = draftFlow({ movements: store.movements, classType: ct, goal: st.goal, lengthMin: st.lengthMin, level: st.level, props: store.studio.props, clientTags: bookedTags, timing: store.studio.timing, targets: store.studio.targets });
      if (!flow.segments.length) { toast('Not enough movements in the library match. Try another level or focus.', { kind: 'error' }); return; }
    } else {
      flow = { title: `${ct.name} ${st.lengthMin} min`, apparatus: ct.apparatus, level: st.level, lengthMin: st.lengthMin, goal: st.goal, classType: ct.id, target: 'general', format: ct.apparatus === 'mat' ? 'open' : 'flow', springBudget: ct.apparatus === 'mat' ? 6 : ct.springBudget,
        segments: blankSegments(ct, st.lengthMin, { props: store.studio.props }) };
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
