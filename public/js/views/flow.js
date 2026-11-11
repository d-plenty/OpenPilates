import { h, icon, btn, toast, select, field, chips, debounce, confirmDialog, modal, fill } from '../ui.js';
import { api, store } from '../store.js';
import { go } from '../app.js';
import { analyze, itemDuration, fmtClock } from '/shared/analysis.js';
import { newId } from '/shared/draft.js';
import { POSITIONS, SPINE, MUSCLES, LEVELS, SEGMENT_ROLES, CAUTIONS, labelOf } from '/shared/vocab.js';
import { movementCard, checksList, statTiles, radarCard, bodyCard, intensityCard, positionsCard, focusCard, muscleListCard, clientsCard, posLabel, muscleLabel, springDots, fmtMin } from './common.js';
import { playView } from './play.js';

const ROLE_COLOR = { warmup: '#7FB8AD', build: '#4E9C8F', peak: '#0F6E62', cooldown: '#A9C7BF' };

export async function flowView(id, tab) {
  const data = await api('GET', `/flows/${id}`);
  if (tab === 'play') return playView(data);
  const meta = { id: data.id, ownerName: data.ownerName, ownerId: data.ownerId, canEdit: data.canEdit, shared: data.shared };
  const flow = pickFlow(data);
  const history = [];
  let activeSeg = flow.segments[0]?.id || null;
  let dragItemId = null;

  const save = debounce(async () => {
    try {
      await api('PUT', `/flows/${meta.id}`, { ...flow, shared: meta.shared });
      status.textContent = 'Saved';
    } catch (e) { status.textContent = 'Not saved'; toast(e.message, { kind: 'error' }); }
  }, 700);
  const status = h('span', { class: 'tiny muted', 'aria-live': 'polite' }, meta.canEdit ? 'Saved' : `Read only · by ${meta.ownerName}`);

  const change = (fn, { redraw = true } = {}) => {
    if (!meta.canEdit) return;
    history.push(JSON.stringify(flow));
    if (history.length > 60) history.shift();
    fn();
    status.textContent = 'Saving…';
    save();
    if (redraw) drawAll();
    else if (tab !== 'analysis') drawLive();
  };
  const undo = () => {
    if (!history.length) return;
    const prev = JSON.parse(history.pop());
    Object.keys(flow).forEach((k) => delete flow[k]);
    Object.assign(flow, prev);
    status.textContent = 'Saving…';
    save();
    drawAll();
  };

  const room = () => store.roomFor(flow);
  const ctx = () => store.analysisContext(flow);
  const analysis = () => analyze(ctx());
  const bookedTags = () => new Set(ctx().clients.flatMap((c) => c.tags));

  // ---------- header
  const titleInput = h('input', { type: 'text', value: flow.title, class: 'title-input', 'aria-label': 'Flow title', disabled: !meta.canEdit,
    style: { width: '100%', fontFamily: 'var(--display)', fontSize: '28px', fontWeight: 700, height: '48px', border: '1px solid transparent', background: 'transparent', padding: '0 6px', marginLeft: '-7px' },
    oninput: (e) => change(() => { flow.title = e.target.value; }, { redraw: false }) });

  const settingsRow = () => h('div', { class: 'btn-row', style: { marginTop: '6px' } },
    select([{ id: 'reformer', label: 'Reformer' }, { id: 'mat', label: 'Mat' }, { id: 'mixed', label: 'Mixed' }], flow.apparatus, (v) => change(() => { flow.apparatus = v; }), { 'aria-label': 'Apparatus', disabled: !meta.canEdit, style: { width: 'auto' } }),
    select(LEVELS.map((l) => ({ id: l.id, label: l.label })), flow.level, (v) => change(() => { flow.level = v; }), { 'aria-label': 'Level', disabled: !meta.canEdit, style: { width: 'auto' } }),
    select([30, 40, 45, 50, 55, 60, 75, 90].map((n) => ({ id: String(n), label: `${n} min class` })), String(flow.lengthMin), (v) => change(() => { flow.lengthMin = Number(v); }), { 'aria-label': 'Class length', disabled: !meta.canEdit, style: { width: 'auto' } }),
    store.studio.rooms.length > 1 ? select(store.studio.rooms.map((r) => ({ id: r.id, label: r.name })), room().id, (v) => change(() => { flow.room = v; }), { 'aria-label': 'Room', disabled: !meta.canEdit, style: { width: 'auto' } }) : null,
    select(Object.entries(store.studio.targets || {}).map(([k, t]) => ({ id: k, label: `Target: ${t.label}` })), flow.target, (v) => change(() => { flow.target = v; }), { 'aria-label': 'Balance target', disabled: !meta.canEdit, style: { width: 'auto' } }));

  const tabs = (current) => h('div', { class: 'seg', role: 'tablist', 'aria-label': 'Flow views' },
    [['build', 'Build'], ['analysis', 'Analysis'], ['play', 'Play']].map(([t, l]) =>
      h('a', { role: 'tab', 'aria-selected': current === t ? 'true' : 'false', class: current === t ? 'on' : null, href: `#/flows/${meta.id}/${t}` }, l)));

  const actions = () => h('div', { class: 'btn-row no-print' },
    meta.canEdit ? btn('', undo, { iconName: 'undo', title: 'Undo (Ctrl+Z)' }) : null,
    meta.canEdit && meta.ownerId === store.user.id ? h('label', { class: 'btn', title: 'Let other instructors see and copy this flow' },
      h('input', { type: 'checkbox', checked: meta.shared, onchange: (e) => { meta.shared = e.target.checked; change(() => {}, { redraw: false }); } }), 'Share with team') : null,
    btn('Duplicate', async () => { const f = await api('POST', `/flows/${meta.id}/duplicate`); toast('Copy made.'); go(`/flows/${f.id}`); }, { iconName: 'copy' }),
    h('a', { class: 'btn', href: `/api/flows/${meta.id}/export`, download: '', title: 'Download a flow file to share. Client details are never included.' }, icon('download'), 'Export'),
    btn('', () => window.print(), { iconName: 'print', title: 'Print' }),
    meta.canEdit ? btn('', async () => { if (await confirmDialog('Delete this flow?', `"${flow.title}" will be deleted for everyone.`)) { await api('DELETE', `/flows/${meta.id}`); toast('Flow deleted.'); go('/'); } }, { iconName: 'trash', title: 'Delete flow' }) : null);

  // ---------- library pane
  const lib = { q: '', position: '', spine: '', muscle: '', ownedOnly: true, safe: true };
  const libList = h('div', { class: 'lib-list' });
  const drawLibrary = () => {
    const tags = bookedTags();
    const owned = store.studio.props || {};
    const list = store.movementList.filter((mv) =>
      (flow.apparatus === 'mixed' || mv.apparatus === flow.apparatus) &&
      (!lib.q || (mv.name + ' ' + mv.muscles.primary.join(' ') + ' ' + (mv.labels || []).join(' ')).toLowerCase().includes(lib.q)) &&
      (!lib.position || mv.position === lib.position) &&
      (!lib.spine || (mv.spine || []).includes(lib.spine)) &&
      (!lib.muscle || mv.muscles.primary.includes(lib.muscle) || mv.muscles.secondary.includes(lib.muscle)) &&
      (!lib.ownedOnly || (mv.equipment || []).every((e) => Number(owned[e]) > 0)) &&
      (!lib.safe || !(mv.cautions || []).some((c) => tags.has(c.tag))));
    fill(libList, ...(list.length ? list.map((mv) => movementCard(mv, room(), { draggable: meta.canEdit, onAdd: meta.canEdit ? addMovement : null, addLabel: '' })) : [h('p', { class: 'muted small' }, 'No movements match.')]));
  };
  const libraryPane = () => h('aside', { class: 'col-side card', 'aria-label': 'Movement library' },
    h('div', { class: 'card-head' }, h('h2', null, 'Movements'), h('span', { class: 'tiny muted' }, `${store.movementList.length} in library`), h('div', { class: 'spacer' }), h('a', { class: 'small', href: '#/movements/new' }, '+ New')),
    h('input', { type: 'search', placeholder: 'Search name, muscle, label', 'aria-label': 'Search movements', oninput: (e) => { lib.q = e.target.value.toLowerCase(); drawLibrary(); } }),
    h('div', { class: 'grid-2', style: { margin: '8px 0' } },
      select([{ id: '', label: 'Any position' }, ...POSITIONS], '', (v) => { lib.position = v; drawLibrary(); }, { 'aria-label': 'Position' }),
      select([{ id: '', label: 'Any spine' }, ...SPINE], '', (v) => { lib.spine = v; drawLibrary(); }, { 'aria-label': 'Spine movement' }),
      select([{ id: '', label: 'Any muscle' }, ...MUSCLES], '', (v) => { lib.muscle = v; drawLibrary(); }, { 'aria-label': 'Muscle', style: { gridColumn: '1 / -1' } })),
    h('label', { class: 'small', style: { display: 'flex', gap: '8px', alignItems: 'center', minHeight: '30px' } }, h('input', { type: 'checkbox', checked: lib.ownedOnly, onchange: (e) => { lib.ownedOnly = e.target.checked; drawLibrary(); } }), 'Only equipment we have'),
    h('label', { class: 'small', style: { display: 'flex', gap: '8px', alignItems: 'center', minHeight: '30px', marginBottom: '8px' } }, h('input', { type: 'checkbox', checked: lib.safe, onchange: (e) => { lib.safe = e.target.checked; drawLibrary(); } }), 'Safe for everyone booked'),
    meta.canEdit ? h('p', { class: 'tiny muted', style: { marginBottom: '8px' } }, 'Drag into a segment, or press Add to put it in the highlighted segment.') : null,
    libList);

  // ---------- segments
  const segWrap = h('section', { class: 'stack', 'aria-label': 'Segments' });
  const findItem = (itemId) => {
    for (const seg of flow.segments) { const i = seg.items.findIndex((x) => x.id === itemId); if (i >= 0) return { seg, i }; }
    return null;
  };
  function addMovement(mv, segId = activeSeg, beforeId = null) {
    change(() => {
      let seg = flow.segments.find((s) => s.id === segId) || flow.segments[flow.segments.length - 1];
      if (!seg) { seg = { id: newId('s'), name: 'Main', role: 'build', bpm: null, items: [] }; flow.segments.push(seg); }
      const item = { id: newId(), slug: mv.slug };
      const at = beforeId ? seg.items.findIndex((x) => x.id === beforeId) : -1;
      if (at >= 0) seg.items.splice(at, 0, item); else seg.items.push(item);
      activeSeg = seg.id;
    });
    toast(`Added ${mv.name}.`);
  }
  const moveItem = (itemId, segId, beforeId) => change(() => {
    const from = findItem(itemId);
    if (!from) return;
    const [item] = from.seg.items.splice(from.i, 1);
    const seg = flow.segments.find((s) => s.id === segId);
    const at = beforeId ? seg.items.findIndex((x) => x.id === beforeId) : -1;
    if (at >= 0) seg.items.splice(at, 0, item); else seg.items.push(item);
  });
  const nudge = (itemId, dir) => change(() => {
    const { seg, i } = findItem(itemId);
    const si = flow.segments.indexOf(seg);
    const j = i + dir;
    if (j >= 0 && j < seg.items.length) { [seg.items[i], seg.items[j]] = [seg.items[j], seg.items[i]]; return; }
    const target = flow.segments[si + dir];
    if (!target) return;
    const [item] = seg.items.splice(i, 1);
    if (dir < 0) target.items.push(item); else target.items.unshift(item);
  });

  const onDrop = (e, segId, beforeId) => {
    e.preventDefault(); e.stopPropagation();
    document.querySelectorAll('.drop-before, .drop-target').forEach((x) => x.classList.remove('drop-before', 'drop-target'));
    if (!meta.canEdit) return;
    const slug = e.dataTransfer.getData('text/x-op-slug');
    const itemId = e.dataTransfer.getData('text/x-op-item') || dragItemId;
    if (slug && store.movements[slug]) addMovement(store.movements[slug], segId, beforeId);
    else if (itemId && itemId !== beforeId) moveItem(itemId, segId, beforeId);
    dragItemId = null;
  };

  const itemRow = (seg, item) => {
    const mv = store.movements[item.slug];
    const tags = bookedTags();
    const flags = mv ? (mv.cautions || []).filter((c) => tags.has(c.tag)) : [];
    const li = h('li', { class: 'item', draggable: meta.canEdit ? 'true' : null, 'data-id': item.id },
      meta.canEdit ? h('span', { 'aria-hidden': 'true' }, icon('grip')) : h('span'),
      h('div', { style: { minWidth: 0 } },
        h('div', { style: { display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' } },
          mv ? h('a', { class: 'name', href: `#/movements/${mv.slug}`, style: { color: 'inherit', textDecoration: 'none' } }, mv.name) : h('span', { class: 'name' }, `Missing: ${item.slug}`),
          flags.length ? h('span', { class: 'tag tag-warn', title: flags.map((f) => f.note).join(' ') }, icon('alert', 11), flags.map((f) => labelOf(CAUTIONS, f.tag)).join(', ')) : null,
          item.note ? h('span', { class: 'tag', title: item.note }, 'Note') : null),
        mv ? h('div', { class: 'sub' }, mv.muscles.primary.slice(0, 3).map(muscleLabel).join(' · '), item.reps || mv.reps ? ` · ${item.reps || mv.reps}` : '') : null),
      h('span', { class: 'pos' }, mv ? posLabel(mv.position) : ''),
      mv && mv.apparatus === 'reformer' ? springDots(item.load?.springs || mv.load?.springs || [], room()) : h('span', { class: 'tiny muted' }, mv ? 'Mat' : ''),
      h('div', { style: { display: 'flex', alignItems: 'center', gap: '4px' } },
        h('input', { type: 'text', class: 'dur', value: fmtClock(itemDuration(item, mv)), 'aria-label': `Time for ${mv?.name || 'movement'} (minutes:seconds)`, disabled: !meta.canEdit,
          onchange: (e) => { const sec = parseClock(e.target.value); if (sec) change(() => { item.duration = sec; }); else e.target.value = fmtClock(itemDuration(item, mv)); } }),
        meta.canEdit ? h('div', { class: 'tools' },
          btn('', () => nudge(item.id, -1), { iconName: 'up', small: true, kind: 'ghost', title: 'Move up' }),
          btn('', () => nudge(item.id, 1), { iconName: 'down', small: true, kind: 'ghost', title: 'Move down' }),
          btn('', () => editItem(item, mv), { iconName: 'edit', small: true, kind: 'ghost', title: 'Reps, springs and notes' }),
          btn('', () => { change(() => { seg.items = seg.items.filter((x) => x.id !== item.id); }); toast('Removed.', { action: { label: 'Undo', run: undo } }); }, { iconName: 'close', small: true, kind: 'ghost', title: 'Remove' })) : null));
    if (meta.canEdit) {
      li.addEventListener('dragstart', (e) => { dragItemId = item.id; e.dataTransfer.setData('text/x-op-item', item.id); e.dataTransfer.effectAllowed = 'move'; li.classList.add('dragging'); });
      li.addEventListener('dragend', () => li.classList.remove('dragging'));
      li.addEventListener('dragover', (e) => { e.preventDefault(); e.stopPropagation(); li.classList.add('drop-before'); });
      li.addEventListener('dragleave', () => li.classList.remove('drop-before'));
      li.addEventListener('drop', (e) => onDrop(e, seg.id, item.id));
    }
    return li;
  };

  const segmentCard = (seg, si) => {
    const a = segSeconds(seg);
    const el = h('div', { class: ['segment'], style: activeSeg === seg.id && meta.canEdit ? { borderColor: '#0F6E62', boxShadow: '0 0 0 1px #0F6E62' } : null, onclick: () => { if (activeSeg !== seg.id) { activeSeg = seg.id; drawSegments(); } } },
      h('div', { class: 'seg-head' },
        h('span', { class: 'seg-dot', style: { background: ROLE_COLOR[seg.role] } }),
        h('input', { class: 'seg-name', type: 'text', value: seg.name, 'aria-label': 'Segment name', disabled: !meta.canEdit, oninput: (e) => change(() => { seg.name = e.target.value; }, { redraw: false }) }),
        select(SEGMENT_ROLES, seg.role, (v) => change(() => { seg.role = v; }), { 'aria-label': 'Segment role', disabled: !meta.canEdit }),
        h('span', { class: 'tiny muted' }, fmtMin(a)),
        h('span', { style: { display: 'inline-flex', alignItems: 'center', gap: '6px' } }, icon('music', 16),
          h('input', { class: 'song', type: 'text', placeholder: 'Song (optional)', value: seg.song || '', 'aria-label': 'Song', disabled: !meta.canEdit, oninput: (e) => change(() => { seg.song = e.target.value; }, { redraw: false }) }),
          h('input', { class: 'bpm', type: 'number', min: 30, max: 220, placeholder: 'BPM', value: seg.bpm ?? '', 'aria-label': 'Beats per minute', disabled: !meta.canEdit, onchange: (e) => change(() => { seg.bpm = e.target.value ? Number(e.target.value) : null; }, { redraw: false }) })),
        meta.canEdit ? h('div', { class: 'tools', style: { display: 'flex' } },
          btn('', () => change(() => { if (si > 0) [flow.segments[si - 1], flow.segments[si]] = [flow.segments[si], flow.segments[si - 1]]; }), { iconName: 'up', small: true, kind: 'ghost', title: 'Move segment up' }),
          btn('', () => change(() => { if (si < flow.segments.length - 1) [flow.segments[si + 1], flow.segments[si]] = [flow.segments[si], flow.segments[si + 1]]; }), { iconName: 'down', small: true, kind: 'ghost', title: 'Move segment down' }),
          btn('', async () => { if (!seg.items.length || await confirmDialog('Delete segment?', `"${seg.name}" and its ${seg.items.length} movements will be removed.`)) change(() => { flow.segments = flow.segments.filter((s) => s.id !== seg.id); }); }, { iconName: 'trash', small: true, kind: 'ghost', title: 'Delete segment' })) : null),
      h('ol', { class: 'seg-items' }, seg.items.map((it) => itemRow(seg, it))),
      !seg.items.length ? h('p', { class: 'small muted', style: { padding: '14px' } }, meta.canEdit ? 'Drop movements here.' : 'No movements.') : null);
    if (meta.canEdit) {
      el.addEventListener('dragover', (e) => { e.preventDefault(); el.classList.add('drop-target'); });
      el.addEventListener('dragleave', (e) => { if (!el.contains(e.relatedTarget)) el.classList.remove('drop-target'); });
      el.addEventListener('drop', (e) => onDrop(e, seg.id, null));
    }
    return el;
  };
  const segSeconds = (seg) => seg.items.reduce((t, i) => t + itemDuration(i, store.movements[i.slug]), 0);

  const drawSegments = () => {
    fill(segWrap, 
      ...flow.segments.map(segmentCard),
      meta.canEdit ? h('button', { type: 'button', class: 'add-seg', onclick: () => change(() => { const s = { id: newId('s'), name: 'New segment', role: 'build', bpm: null, song: '', items: [] }; flow.segments.push(s); activeSeg = s.id; }) }, '+ Add a segment') : null,
      bookedCard());
  };

  // ---------- booked clients
  const bookedCard = () => {
    const clients = store.clients.filter((c) => !c.archived);
    const booked = flow.booked || [];
    const available = clients.filter((c) => !booked.some((b) => b.clientId === c.id));
    return h('div', { class: 'card' },
      h('div', { class: 'card-head' }, h('h2', null, 'Who\'s booked'), h('span', { class: 'tiny muted' }, 'Used for client checks. Never included in exports.')),
      booked.length ? h('table', { class: 'tbl' }, h('tbody', null, booked.map((b) => {
        const c = clients.find((x) => x.id === b.clientId);
        return h('tr', null,
          h('td', { style: { fontWeight: 600 } }, c ? c.name : 'Removed client'),
          h('td', null, c && c.tags.length ? c.tags.map((t) => h('span', { class: 'tag tag-warn', style: { marginRight: '4px' } }, labelOf(CAUTIONS, t))) : h('span', { class: 'tiny muted' }, 'No notes')),
          h('td', { style: { width: '120px' } }, h('input', { type: 'text', value: b.spot || '', placeholder: 'Reformer #', 'aria-label': 'Spot', disabled: !meta.canEdit, onchange: (e) => change(() => { b.spot = e.target.value; }, { redraw: false }) })),
          h('td', { style: { width: '40px' } }, meta.canEdit ? btn('', () => change(() => { flow.booked = booked.filter((x) => x !== b); }), { iconName: 'close', small: true, kind: 'ghost', title: 'Remove from class' }) : null));
      }))) : h('p', { class: 'small muted' }, 'Nobody added yet.'),
      meta.canEdit && available.length ? h('div', { style: { marginTop: '8px', maxWidth: '320px' } },
        select([{ id: '', label: 'Add a client…' }, ...available.map((c) => ({ id: String(c.id), label: c.name }))], '', (v) => { if (v) change(() => { flow.booked = [...booked, { clientId: Number(v), spot: '' }]; }); }, { 'aria-label': 'Add a client' })) : null,
      !clients.length ? h('p', { class: 'tiny muted', style: { marginTop: '6px' } }, h('a', { href: '#/clients' }, 'Add clients'), ' to check flows against injuries and pregnancy.') : null);
  };

  // ---------- item editor
  const editItem = async (item, mv) => {
    if (!mv) return;
    const reps = h('input', { type: 'text', value: item.reps || '', placeholder: mv.reps || 'e.g. 8 each side' });
    const layerOptions = [{ id: '', label: 'Not set' }, ...(mv.layers || []).map((l) => ({ id: l.tag, label: `${l.tag} — ${l.title}` }))];
    let layer = item.layer || '';
    const note = h('textarea', { rows: 3, placeholder: 'Notes for this class' }, item.note || '');
    let springs = [...(item.load?.springs || mv.load?.springs || [])];
    const springsEl = h('div');
    const drawSprings = () => fill(springsEl, springDots(springs, room()), ' ',
      ['xlight', 'light', 'medium', 'heavy'].map((l) => btn(`+ ${l}`, () => { if (springs.length < 5) springs.push(l); drawSprings(); }, { small: true })),
      btn('Clear', () => { springs = []; drawSprings(); }, { small: true, kind: 'ghost' }));
    drawSprings();
    const r = await modal(mv.name, h('div', { class: 'stack' },
      field('Reps', reps),
      mv.layers?.length ? field('Layer', select(layerOptions, layer, (v) => { layer = v; })) : null,
      mv.apparatus === 'reformer' ? field('Springs for this class', springsEl, `Library default: ${mv.load?.springs?.join(' + ') || 'none'}`) : null,
      field('Note', note)), { actions: [{ label: 'Cancel', value: false }, { label: 'Save', value: true, kind: 'primary' }] });
    if (!r) return;
    change(() => {
      item.reps = reps.value.trim() || undefined;
      item.layer = layer || undefined;
      item.note = note.value.trim() || undefined;
      const def = (mv.load?.springs || []).join('+');
      item.load = springs.join('+') !== def ? { springs } : undefined;
    });
  };

  // ---------- live analysis aside
  const statsEl = h('div');
  const asideEl = h('aside', { class: 'col-aside', 'aria-label': 'Live analysis' });
  const drawLive = () => {
    const a = analysis();
    fill(statsEl, statTiles(a));
    fill(asideEl, 
      radarCard(a),
      bodyCard(a, { size: 96 }),
      h('div', { class: 'card' }, h('div', { class: 'card-head' }, h('h2', null, 'Checks')), checksList(a.checks, { limit: 6 }),
        h('a', { class: 'btn btn-dark', style: { width: '100%', marginTop: '10px' }, href: `#/flows/${meta.id}/analysis` }, 'Open full analysis')));
  };
  const drawBody = () => { drawSegments(); drawLive(); drawLibrary(); };

  // ---------- analysis tab
  const analysisBody = () => {
    const a = analysis();
    const swap = (issue) => change(() => {
      for (const seg of flow.segments) for (const it of seg.items) if (it.id === issue.itemId) { it.slug = issue.swap.slug; delete it.load; delete it.layer; }
    });
    return h('div', { class: 'stack' },
      statTiles(a),
      intensityCard(a, flow),
      h('div', { class: 'auto-grid' }, radarCard(a), positionsCard(a), bodyCard(a), muscleListCard(a), focusCard(a),
        h('div', { class: 'card' }, h('h2', null, 'Class check'), checksList(a.checks))),
      clientsCard(a, { onSwap: meta.canEdit ? swap : null }));
  };

  const analysisWrap = h('div');
  const drawAll = () => {
    titleInput.value = flow.title;
    if (tab === 'analysis') fill(analysisWrap, analysisBody());
    else drawBody();
  };

  const onKey = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) { e.preventDefault(); undo(); }
  };
  document.addEventListener('keydown', onKey);
  const cleanup = () => { document.removeEventListener('keydown', onKey); save.flush(); };

  const head = h('div', { class: 'page-head' },
    h('div', { class: 'grow' }, h('a', { href: '#/', class: 'small no-print' }, '← Flows'), titleInput, settingsRow(), h('div', { style: { marginTop: '4px' } }, status)),
    tabs(tab), actions());

  if (tab === 'analysis') {
    drawAll();
    return { title: flow.title, cleanup, node: [head, analysisWrap] };
  }
  drawAll();
  return { title: flow.title, cleanup, node: [head, statsEl, h('div', { class: 'cols' }, meta.canEdit ? libraryPane() : null, h('div', { class: 'col-main' }, segWrap), asideEl)] };

  function parseClock(v) {
    const m = String(v).trim().match(/^(\d{1,3})(?::(\d{1,2}))?$/);
    if (!m) return null;
    const sec = m[2] != null ? Number(m[1]) * 60 + Number(m[2]) : Number(m[1]) * 60;
    return sec >= 10 && sec <= 1800 ? sec : null;
  }
}

function pickFlow(d) {
  const { title, apparatus, level, lengthMin, goal, target, room, when, notes, labels, booked, segments } = d;
  return { title, apparatus, level, lengthMin, goal, target, room, when, notes, labels, booked: booked || [], segments: segments || [] };
}
