import { h, icon, btn, toast, select, field, chips, debounce, confirmDialog, modal, fill, undoStack } from '../ui.js';
import { api, store, viewState } from '../store.js';
import { go } from '../app.js';
import { analyze, itemDuration, fmtClock, avoids } from '/shared/analysis.js';
import { newId, tidySprings, fillPhase } from '/shared/draft.js';
import { POSITIONS, SPINE, MUSCLES, CLASS_LEVELS, SEGMENT_ROLES, CAUTIONS, SECTIONS, FOCUSES, labelOf, sectionOf, namesOf, variationOf, classLevel, classTypesOf, layersOf, levelsOf, levelRange, usesOf, timedLinesOf } from '/shared/vocab.js';
import { checksList, statTiles, radarCard, bodyCard, intensityCard, positionsCard, focusCard, muscleListCard, clientsCard, springsCard, balanceCard, setOutCard, thumb, posLabel, muscleLabel, springDots, fmtMin, peekMovement, repsLabel } from './common.js';
import { playView } from './play.js';
import { sheetView } from './sheet.js';
import { itemExtras, blockEditor } from './options.js';
import { editSeriesDialog } from './series.js';

const ROLE_COLOR = { warmup: '#7FB8AD', build: '#4E9C8F', peak: '#0F6E62', cooldown: '#A9C7BF' };

export async function flowView(id, tab) {
  const data = await api('GET', `/flows/${id}`);
  if (tab === 'play') return playView(data);
  if (tab === 'sheet') return sheetView(data);
  const meta = { id: data.id, ownerName: data.ownerName, ownerId: data.ownerId, canEdit: data.canEdit, shared: data.shared };
  const flow = pickFlow(data);
  const remembered = viewState('flow:' + data.id, { activeSeg: null, lib: null, open: [] });
  let activeSeg = flow.segments.some((s) => s.id === remembered.activeSeg) ? remembered.activeSeg : flow.segments[0]?.id || null;
  let dragItemId = null;
  // Which blocks have their editor open, and where the cursor goes back to after a redraw.
  const openBlocks = new Set(remembered.open || []);
  const openPhases = new Set();
  const focus = { key: null };

  const save = debounce(async () => {
    try {
      await api('PUT', `/flows/${meta.id}`, { ...flow, shared: meta.shared });
      status.textContent = 'Saved';
    } catch (e) { status.textContent = 'Not saved'; toast(e.message, { kind: 'error' }); }
  }, 700);
  const status = h('span', { class: 'tiny muted', 'aria-live': 'polite' }, meta.canEdit ? 'Saved' : `Read only · by ${meta.ownerName}`);

  // Undo and redo: every change is a step, and a run of typing is one step.
  const hist = undoStack(() => flow, (copy) => {
    Object.keys(flow).forEach((k) => delete flow[k]);
    Object.assign(flow, copy);
    status.textContent = 'Saving…';
    save();
    drawAll();
  });
  const change = (fn, { redraw = true } = {}) => {
    if (!meta.canEdit) return;
    hist.note();
    fn();
    hist.note(!redraw);
    status.textContent = 'Saving…';
    save();
    if (redraw) drawAll();
    else if (tab !== 'analysis') drawLive();
  };
  const undo = () => hist.undo();

  const room = () => store.roomFor(flow);
  // the seconds this flow counts with: the studio's timing, with its class type's own on top
  const tm = () => store.timingFor(flow);
  const phased = () => !flow.noPhases;
  const ctx = () => store.analysisContext(flow);
  const analysis = () => analyze(ctx());
  const bookedTags = () => new Set(ctx().clients.flatMap((c) => c.tags));

  // ---------- header
  const titleInput = h('input', { type: 'text', value: flow.title, class: 'title-input', 'aria-label': 'Flow title', disabled: !meta.canEdit,
    style: { width: '100%', fontFamily: 'var(--display)', fontSize: '28px', fontWeight: 700, height: '48px', border: '1px solid transparent', background: 'transparent', padding: '0 6px', marginLeft: '-7px' },
    oninput: (e) => change(() => { flow.title = e.target.value; }, { redraw: false }) });

  const ownFocus = async () => {
    const input = h('input', { type: 'text', maxlength: 60, value: flow.focusText || '', placeholder: 'e.g. Runners\' hips, wedding arms', 'aria-label': 'Your own focus' });
    const ok = await modal('Your own focus for this class', h('div', { class: 'stack-sm' }, field('Focus', input), h('p', { class: 'hint' }, 'For a class that doesn\'t fit one of the studio\'s focuses. It shows on the flow and its run sheet.')),
      { actions: [{ label: 'Cancel', value: false }, { label: 'Use it', value: true, kind: 'primary' }] });
    if (ok && input.value.trim()) change(() => { flow.focusText = input.value.trim().slice(0, 60); }); else drawAll();
  };
  const togglePhases = async (on) => {
    if (on) {
      change(() => { delete flow.noPhases; if (flow.segments.length === 1 && flow.segments[0].name === 'Class') flow.segments[0].name = 'Main'; });
      toast('Phases are on. Add phases and move blocks between them.');
      return;
    }
    const many = flow.segments.filter((s) => s.items.length).length > 1 || flow.segments.length > 1;
    if (many && !(await confirmDialog('Plan this flow without phases?', `Its ${flow.segments.length} phases become one list of blocks, in the same order. Phase names, minutes and songs are dropped. Undo brings them back.`, 'Use one list', 'primary'))) { drawAll(); return; }
    change(() => {
      const items = flow.segments.flatMap((s) => (s.bothSides ? [...s.items, ...s.items.map((i) => ({ ...structuredClone(i), id: newId() }))] : s.items));
      flow.segments = [{ id: flow.segments[0]?.id || newId('s'), name: 'Class', role: 'build', song: '', items }];
      flow.noPhases = true;
      activeSeg = remembered.activeSeg = flow.segments[0].id;
    });
  };
  const settingsEl = h('div');
  const settingsRow = () => {
    const types = classTypesOf(store.studio);
    const lens = [...new Set([...(store.studio.lengths || [30, 45, 50, 55, 60]), flow.lengthMin])].sort((x, y) => x - y);
    const levels = CLASS_LEVELS.some((l) => l.id === flow.level) ? CLASS_LEVELS : [...CLASS_LEVELS, classLevel(flow.level)];
    const sel = (opts, value, on, label) => select(opts, value, on, { 'aria-label': label, title: label, disabled: !meta.canEdit, style: { width: 'auto' } });
    const limit = Number(flow.springBudget) > 0 ? Number(flow.springBudget) : 0;
    return h('div', { class: 'btn-row flow-settings', style: { marginTop: '6px' } },
      sel([...(types.some((c) => c.id === flow.classType) ? [] : [{ id: '', label: 'No class type' }]), ...types.map((c) => ({ id: c.id, label: c.name }))], flow.classType || '', (v) => change(() => {
        const c = types.find((x) => x.id === v);
        if (!c) { delete flow.classType; return; }
        // the class type brings what the studio set for it; the blocks and phases already planned stay
        flow.classType = c.id; flow.apparatus = c.apparatus; flow.springBudget = c.apparatus === 'mat' ? 0 : (c.springBudget || 0);
        if (c.target && (store.studio.targets || {})[c.target]) flow.target = c.target;
      }), 'Class type'),
      sel(levels.map((l) => ({ id: l.id, label: l.label })), classLevel(flow.level).id, (v) => change(() => { flow.level = v; }), 'Level'),
      sel(lens.map((n) => ({ id: String(n), label: `${n} min class` })), String(flow.lengthMin), (v) => change(() => { flow.lengthMin = Number(v); }), 'Class length'),
      sel([...FOCUSES.map((f) => ({ id: f.id, label: `Focus: ${f.label}` })), ...(flow.focusText ? [{ id: '__own', label: `Focus: ${flow.focusText}` }] : []), ...(!flow.focusText && flow.goal && !FOCUSES.some((f) => f.id === flow.goal) ? [{ id: flow.goal, label: 'Focus: not set' }] : []), { id: '__type', label: flow.focusText ? 'Change our own focus…' : 'Type our own focus…' }],
        flow.focusText ? '__own' : flow.goal || FOCUSES[0].id, (v) => { if (v === '__type') ownFocus(); else if (v !== '__own') change(() => { flow.goal = v; delete flow.focusText; }); }, 'Focus'),
      store.studio.rooms.length > 1 ? sel(store.studio.rooms.map((r) => ({ id: r.id, label: r.name })), room().id, (v) => change(() => { flow.room = v; }), 'Room') : null,
      h('details', { class: 'more-settings', open: remembered.more ? '' : null, ontoggle: (e) => { remembered.more = e.target.open; } }, h('summary', null, 'More'),
        h('div', { class: 'btn-row' },
          sel([{ id: 'reformer', label: 'Reformer' }, { id: 'mat', label: 'Mat' }, { id: 'mixed', label: 'Mixed' }], flow.apparatus, (v) => change(() => { flow.apparatus = v; }), 'Apparatus'),
          sel(Object.entries(store.studio.targets || {}).map(([k, x]) => ({ id: k, label: `Balance target: ${x.label}` })), flow.target, (v) => change(() => { flow.target = v; }), 'Balance target'),
          flow.apparatus !== 'mat' ? sel([...new Set([0, 1, 2, 3, 4, 5, 6, 8, 10, limit])].sort((x, y) => x - y).map((n) => ({ id: String(n), label: n ? `Spring changes: up to ${n}` : 'Spring changes: no limit' })), String(limit), (v) => change(() => { flow.springBudget = Number(v); }), 'Spring-change limit') : null,
          sel([{ id: 'on', label: 'Planned in phases' }, { id: 'off', label: 'One list, no phases' }], phased() ? 'on' : 'off', (v) => togglePhases(v === 'on'), 'Phases. Optional, but recommended: they help plan the class the way clients expect it.'))));
  };

  const tabs = (current) => h('div', { class: 'seg', role: 'tablist', 'aria-label': 'Flow views' },
    [['build', 'Build'], ['analysis', 'Analysis'], ['sheet', 'Run sheet'], ['play', 'Play']].map(([t, l]) =>
      h('a', { role: 'tab', 'aria-selected': current === t ? 'true' : 'false', class: current === t ? 'on' : null, href: `#/flows/${meta.id}/${t}` }, l)));

  const actions = () => h('div', { class: 'btn-row no-print' },
    meta.canEdit && flow.apparatus !== 'mat' ? btn('Tidy springs', () => {
      const before = analysis().springChanges;
      change(() => { flow.segments = tidySprings(flow, store.movements); });
      const after = analysis().springChanges;
      toast(after < before ? `Reordered inside each phase: ${before} spring changes down to ${after}.` : 'Already as tidy as it gets without moving blocks between phases.', after < before ? { action: { label: 'Undo', run: undo } } : {});
    }, { iconName: 'wand', title: 'Reorder blocks inside each phase so the springs change as rarely as possible' }) : null,
    meta.canEdit && meta.ownerId === store.user.id ? h('label', { class: 'btn', title: 'Let other instructors see and copy this flow' },
      h('input', { type: 'checkbox', checked: meta.shared, onchange: (e) => { meta.shared = e.target.checked; change(() => {}, { redraw: false }); } }), 'Share with team') : null,
    btn('Duplicate', async () => { const f = await api('POST', `/flows/${meta.id}/duplicate`); toast('Copy made.'); go(`/flows/${f.id}`); }, { iconName: 'copy' }),
    h('a', { class: 'btn', href: `/api/flows/${meta.id}/export`, download: '', title: 'Download a flow file to share. Client details are never included.' }, icon('download'), 'Export'),
    h('a', { class: 'btn btn-icon', href: `#/flows/${meta.id}/sheet`, title: 'Run sheet to print', 'aria-label': 'Run sheet to print' }, icon('print')),
    meta.canEdit ? btn('', async () => { if (await confirmDialog('Delete this flow?', `"${flow.title}" will be deleted for everyone.`)) { await api('DELETE', `/flows/${meta.id}`); toast('Flow deleted.'); go('/'); } }, { iconName: 'trash', title: 'Delete flow' }) : null);

  // ---------- library pane
  const lib = remembered.lib = { q: '', section: '', position: '', spine: '', muscle: '', ownedOnly: true, safe: true, level: true, show: 'movements', ...(remembered.lib || {}) };
  const peek = (mv) => peekMovement(mv, room());
  const libList = h('div', { class: 'lib-list' });
  const drawLibrary = () => {
    const tags = bookedTags();
    const owned = store.studio.props || {};
    clearEl.hidden = !filtersOn();
    drawSummary();
    if (lib.show === 'series') return drawSeries();
    const list = store.movementList.filter((mv) =>
      (flow.apparatus === 'mixed' || mv.apparatus === flow.apparatus) &&
      (!lib.q || (namesOf(mv).join(' ') + ' ' + mv.muscles.primary.join(' ') + ' ' + (mv.labels || []).join(' ')).toLowerCase().includes(lib.q)) &&
      (!lib.section || sectionOf(mv) === lib.section) &&
      (!lib.position || mv.position === lib.position) &&
      (!lib.spine || (mv.spine || []).includes(lib.spine)) &&
      (!lib.muscle || mv.muscles.primary.includes(lib.muscle) || mv.muscles.secondary.includes(lib.muscle)) &&
      (!lib.ownedOnly || (mv.equipment || []).every((e) => Number(owned[e]) > 0)) &&
      (!lib.safe || !avoids(mv, tags)) &&
      (!lib.level || levelsOf(mv).includes(classLevel(flow.level).id) || (levelRange(mv)[0] <= classLevel(flow.level).to && levelRange(mv)[1] >= classLevel(flow.level).from)));
    const inFlow = new Set(flow.segments.flatMap((s) => s.items.map((i) => i.slug)));
    fill(libList, h('div', { class: 'tiny muted lib-count' }, `${list.length} movement${list.length === 1 ? '' : 's'}`), ...(list.length ? list.map(libRow(inFlow)) : [h('p', { class: 'muted small' }, 'No movements match. Clear a filter, or untick the boxes above.')]));
  };
  // One line per movement: picture, name, where and on what springs, and a + to add it.
  const libRow = (inFlow) => (mv) => {
    const row = h('div', { class: ['lib-row', inFlow.has(mv.slug) && 'used'], draggable: meta.canEdit ? 'true' : null },
      h('span', { class: 'lib-thumb', 'aria-hidden': 'true' }, thumb(mv, { width: 46 })),
      h('a', { class: 'lib-main', href: `#/movements/${mv.slug}`, title: 'Quick look', onclick: (e) => { e.preventDefault(); peek(mv); } },
        h('span', { class: 'lib-name' }, mv.name),
        h('span', { class: 'lib-meta' }, posLabel(mv.position), mv.apparatus === 'reformer' && mv.load ? [' · ', springDots(mv.load.springs, room(), { label: false })] : null, inFlow.has(mv.slug) ? ' · in this flow' : '')),
      meta.canEdit ? h('button', { type: 'button', class: 'btn btn-sm btn-icon lib-add', 'aria-label': `Add ${mv.name}`, title: `Add ${mv.name} to the highlighted phase`, onclick: () => addMovement(mv) }, icon('plus', 16)) : null);
    if (meta.canEdit) row.addEventListener('dragstart', (e) => { e.dataTransfer.setData('text/x-op-slug', mv.slug); e.dataTransfer.effectAllowed = 'copy'; });
    return row;
  };
  // A series is a ready-built run of movements. Adding one drops every movement in, in order, ready to edit.
  const drawSeries = () => {
    const list = (store.series || []).filter((s) => (flow.apparatus === 'mixed' || s.apparatus === flow.apparatus) &&
      (!lib.q || [s.name, ...(s.aka || []), ...s.items.map((i) => store.movements[i.slug]?.name || '')].join(' ').toLowerCase().includes(lib.q)));
    fill(libList, ...(list.length ? list.map((s) => h('div', { class: 'series-card' },
      h('div', { class: 'series-head' },
        h('div', { style: { minWidth: 0, flex: 1 } }, h('div', { class: 'name' }, s.name), h('div', { class: 'meta' }, `${s.apparatus === 'mat' ? 'Mat' : 'Reformer'} · ${s.items.length} movements${s.source === 'custom' ? ' · made by your studio' : s.source === 'studio' ? ' · edited by your studio' : ''}`)),
        meta.canEdit ? h('button', { type: 'button', class: 'btn btn-sm btn-primary btn-icon', 'aria-label': `Add ${s.name}`, title: `Add all ${s.items.length} to the highlighted phase`, onclick: () => addSeries(s) }, icon('plus', 16)) : null,
        store.isAdmin || (s.source === 'custom' && s.ownerId === store.user.id) ? btn('', async () => { if (await editSeriesDialog(s)) drawLibrary(); }, { iconName: 'edit', small: true, kind: 'ghost', title: 'Edit this series' }) : null,
        s.source !== 'custom' && store.isAdmin ? btn('', async () => { await api('PUT', `/series/${s.slug}/library`, { inLibrary: false }); await store.loadSeries(true); toast(`${s.name} removed from your library. Put it back from Movements → Removed.`); drawLibrary(); }, { iconName: 'close', small: true, kind: 'ghost', title: 'Remove from our library (you can put it back)' }) : null,
        s.source === 'studio' && store.isAdmin ? btn('', async () => { if (await confirmDialog('Put this series back to how it shipped?', `Your changes to "${s.name}" are dropped.`, 'Put it back', 'primary')) { await api('DELETE', `/series/${s.slug}`); await store.loadSeries(true); drawLibrary(); } }, { iconName: 'undo', small: true, kind: 'ghost', title: 'Back to the library version' }) : null,
        s.source === 'custom' && (store.isAdmin || s.ownerId === store.user.id) ? btn('', async () => { if (await confirmDialog('Delete this series?', `"${s.name}" will be removed from the library. Flows that used it keep their movements.`)) { await api('DELETE', `/series/${s.slug}`); await store.loadSeries(true); drawLibrary(); } }, { iconName: 'trash', small: true, kind: 'ghost', title: 'Delete series' }) : null),
      s.summary ? h('div', { class: 'tiny muted' }, s.summary) : null,
      h('ol', { class: 'series-items' }, s.items.map((i) => h('li', null, store.movements[i.slug]?.name || i.slug, i.variation ? h('span', { class: 'muted' }, ` · ${i.variation}`) : null))))) : [h('p', { class: 'muted small' }, 'No series match.')]));
  };
  function addSeries(s) {
    const items = s.items.filter((i) => store.movements[i.slug]);
    if (!items.length) return;
    change(() => {
      let seg = flow.segments.find((x) => x.id === activeSeg) || flow.segments[flow.segments.length - 1];
      if (!seg) { seg = { id: newId('s'), name: s.name, role: 'build', items: [] }; flow.segments.push(seg); }
      for (const i of items) seg.items.push({ id: newId(), slug: i.slug, ...(i.variation ? { variation: i.variation } : {}), ...(i.duration ? { duration: i.duration } : {}), ...(i.reps ? { reps: i.reps } : {}) });
      activeSeg = remembered.activeSeg = seg.id;
    });
    toast(`Added ${s.name}: ${items.length} movements.`, { action: { label: 'Undo', run: undo } });
  }
  const saveAsSeries = async (seg) => {
    const nameInput = h('input', { type: 'text', value: seg.name, 'aria-label': 'Series name' });
    const ok = await modal('Save as a series', h('div', { class: 'stack-sm' }, field('Name', nameInput), h('p', { class: 'hint' }, `Saves these ${seg.items.filter((i) => !i.pause).length} movements, in this order, so anyone in the studio can drop them into a flow in one go.`)), { actions: [{ label: 'Cancel', value: false }, { label: 'Save series', value: true, kind: 'primary' }] });
    if (!ok) return;
    try {
      const first = store.movements[(seg.items.find((i) => !i.pause) || {}).slug];
      await api('POST', '/series', { name: nameInput.value, apparatus: first && first.apparatus === 'mat' ? 'mat' : 'reformer', items: seg.items.filter((i) => !i.pause).map((i) => ({ slug: i.slug, variation: i.variation, duration: i.duration, reps: i.reps })) });
      await store.loadSeries(true);
      toast('Series saved. Find it under Series in the library.');
      if (lib.show === 'series') drawLibrary();
    } catch (e) { toast(e.message, { kind: 'error' }); }
  };

  const libraryPane = () => h('aside', { class: 'col-side card', 'aria-label': 'Movement library' },
    h('div', { class: 'card-head' },
      h('div', { class: 'seg', role: 'group', 'aria-label': 'Library' }, [['movements', `Movements`], ['series', 'Series']].map(([id, l]) =>
        h('button', { type: 'button', class: lib.show === id ? 'on' : null, 'aria-pressed': lib.show === id ? 'true' : 'false', onclick: (e) => { lib.show = id; [...e.currentTarget.parentElement.children].forEach((b) => { b.classList.toggle('on', b === e.currentTarget); b.setAttribute('aria-pressed', b === e.currentTarget ? 'true' : 'false'); }); filtersEl.hidden = id === 'series'; drawLibrary(); } }, l))),
      h('div', { class: 'spacer' }), h('button', { type: 'button', class: 'linkish small', onclick: async () => { if (lib.show === 'series') { if (await editSeriesDialog(null, { apparatus: flow.apparatus === 'mat' ? 'mat' : 'reformer' })) drawLibrary(); } else go('/movements/new'); } }, '+ New')),
    h('input', { type: 'search', value: lib.q, placeholder: 'Search any name, muscle or label', 'aria-label': 'Search movements', oninput: (e) => { lib.q = e.target.value.toLowerCase(); drawLibrary(); } }),
    filtersEl,
    libList);
  // Filters are remembered, so make it obvious when some are on and give one press to clear them.
  const filtersOn = () => !!(lib.q || lib.section || lib.position || lib.spine || lib.muscle);
  const clearEl = h('button', { type: 'button', class: 'btn btn-sm btn-ghost clear-filters', hidden: !filtersOn(), onclick: () => {
    Object.assign(lib, { q: '', section: '', position: '', spine: '', muscle: '' });
    const pane = clearEl.closest('.col-side');
    pane.querySelectorAll('select').forEach((s) => { s.value = ''; });
    pane.querySelector('input[type=search]').value = '';
    drawLibrary();
  } }, 'Clear filters');
  const filterCount = () => [lib.section, lib.position, lib.spine, lib.muscle].filter(Boolean).length;
  const filtersSummary = h('summary', null);
  const drawSummary = () => { const n = filterCount(); fill(filtersSummary, 'Filters', n ? h('span', { class: 'tag tag-accent' }, `${n} on`) : null, h('span', { class: 'tiny muted' }, [lib.ownedOnly && 'our equipment', lib.safe && 'safe for booked', lib.level && classLevel(flow.level).label].filter(Boolean).join(' · '))); };
  const filtersEl = h('details', { class: 'lib-filters', hidden: lib.show === 'series', open: lib.open ? '' : null, ontoggle: (e) => { lib.open = e.target.open; } }, filtersSummary,
    h('div', { class: 'grid-2', style: { margin: '8px 0' } },
      select([{ id: '', label: 'Any part of the class' }, ...SECTIONS], lib.section, (v) => { lib.section = v; drawLibrary(); }, { 'aria-label': 'Part of the class', style: { gridColumn: '1 / -1' } }),
      select([{ id: '', label: 'Any position' }, ...POSITIONS], lib.position, (v) => { lib.position = v; drawLibrary(); }, { 'aria-label': 'Position', style: { gridColumn: '1 / -1' } }),
      select([{ id: '', label: 'Any spine movement' }, ...SPINE], lib.spine, (v) => { lib.spine = v; drawLibrary(); }, { 'aria-label': 'Spine movement', style: { gridColumn: '1 / -1' } }),
      select([{ id: '', label: 'Any muscle' }, ...MUSCLES], lib.muscle, (v) => { lib.muscle = v; drawLibrary(); }, { 'aria-label': 'Muscle', style: { gridColumn: '1 / -1' } })),
    h('div', { class: 'lib-checks' },
      h('label', null, h('input', { type: 'checkbox', checked: lib.ownedOnly, onchange: (e) => { lib.ownedOnly = e.target.checked; drawLibrary(); } }), 'Only equipment we have'),
      h('label', null, h('input', { type: 'checkbox', checked: lib.safe, onchange: (e) => { lib.safe = e.target.checked; drawLibrary(); } }), 'Safe for everyone booked'),
      h('label', null, h('input', { type: 'checkbox', checked: !!lib.level, onchange: (e) => { lib.level = e.target.checked; drawLibrary(); } }), `Only ${classLevel(flow.level).label} level`)),
    clearEl);

  // ---------- segments
  const segWrap = h('section', { class: 'stack', 'aria-label': 'Phases' });
  const findItem = (itemId) => {
    for (const seg of flow.segments) { const i = seg.items.findIndex((x) => x.id === itemId); if (i >= 0) return { seg, i }; }
    return null;
  };
  function addMovement(mv, segId = activeSeg, beforeId = null) {
    change(() => {
      let seg = flow.segments.find((s) => s.id === segId) || flow.segments[flow.segments.length - 1];
      if (!seg) { seg = { id: newId('s'), name: 'Main', role: 'build', items: [] }; flow.segments.push(seg); }
      const item = { id: newId(), slug: mv.slug };
      const at = beforeId ? seg.items.findIndex((x) => x.id === beforeId) : -1;
      if (at >= 0) seg.items.splice(at, 0, item); else seg.items.push(item);
      activeSeg = remembered.activeSeg = seg.id;
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

  // A timed line: time in the plan that is not a movement (a water break, setting up the tower).
  const addLine = (seg) => {
    activeSeg = remembered.activeSeg = seg.id;
    const mine = timedLinesOf(store.studio);
    const put = (label, seconds, note) => { change(() => { seg.items.push({ id: newId(), pause: true, label, duration: Math.min(3600, Math.max(5, seconds)), ...(note ? { note } : {}) }); }); toast(`Added ${label}.`, { action: { label: 'Undo', run: undo } }); };
    const name = h('input', { type: 'text', maxlength: 60, placeholder: 'e.g. Water break', 'aria-label': 'Name of the timed line' });
    const mins = h('input', { type: 'text', value: '1:00', 'aria-label': 'Time (minutes:seconds)', style: { width: '90px' } });
    const body = (close) => h('div', { class: 'stack-sm' },
      h('p', { class: 'hint' }, 'Time in the plan that is not a movement. It adds to the class total and shows on the run sheet and in Play.'),
      mine.length ? h('div', { class: 'stack-sm' }, h('div', { class: 'label' }, 'Your studio\'s'), mine.map((r) => h('button', { type: 'button', class: 'lib-row pick-row', onclick: () => { put(r.label, Number(r.seconds) || 60, r.note); close(false); } },
        h('span', { class: 'pause-ico', 'aria-hidden': 'true' }, icon('clock', 18)),
        h('span', { class: 'lib-main' }, h('span', { class: 'lib-name' }, r.label), r.note ? h('span', { class: 'lib-meta' }, r.note) : null),
        h('span', { class: 'tiny muted' }, fmtClock(Number(r.seconds) || 60))))) : null,
      h('div', { class: 'label' }, mine.length ? 'Or your own' : 'What is it?'),
      h('div', { class: 'line-new' }, name, mins),
      !mine.length ? h('p', { class: 'tiny muted' }, 'A studio admin can keep the usual ones in Studio → Classes → Timing, so they are one press away here.') : null);
    modal('Add a timed line', body, { actions: [{ label: 'Cancel', value: false }, { label: 'Add', value: true, kind: 'primary' }] }).then((ok) => { if (ok && name.value.trim()) put(name.value.trim(), parseClock(mins.value, 5, 3600) || 60); });
  };
  const pauseRow = (seg, item) => {
    const li = h('li', { class: ['item', 'block', 'pause-line'], draggable: meta.canEdit ? 'true' : null, 'data-id': item.id },
      h('div', { class: 'block-row' },
        meta.canEdit ? h('span', { class: 'grip', 'aria-hidden': 'true' }, icon('grip')) : h('span'),
        h('div', { class: 'item-main' }, h('span', { class: 'pause-ico', 'aria-hidden': 'true' }, icon('clock', 20)), h('div', { style: { minWidth: 0, flex: 1 } },
          h('input', { type: 'text', class: 'pause-name', value: item.label, maxlength: 60, 'aria-label': 'Name of this timed line', disabled: !meta.canEdit, oninput: (e) => change(() => { item.label = e.target.value || 'Break'; }, { redraw: false }) }),
          h('input', { type: 'text', class: 'pause-note', value: item.note || '', maxlength: 300, placeholder: meta.canEdit ? 'Note (optional)' : '', 'aria-label': 'Note for this timed line', disabled: !meta.canEdit, oninput: (e) => change(() => { if (e.target.value.trim()) item.note = e.target.value; else delete item.note; }, { redraw: false }) }))),
        h('span', { class: 'tiny muted block-springs' }, 'Timed line'),
        h('div', { class: 'block-end' },
          h('input', { type: 'text', class: 'dur', value: fmtClock(item.duration), title: 'Time for this line', 'aria-label': `Time for ${item.label} (minutes:seconds)`, disabled: !meta.canEdit,
            onchange: (e) => { const s = parseClock(e.target.value, 5, 3600); if (s) change(() => { item.duration = s; }); else e.target.value = fmtClock(item.duration); } }),
          meta.canEdit ? h('div', { class: 'tools' },
            btn('', () => nudge(item.id, -1), { iconName: 'up', small: true, kind: 'ghost', title: 'Move up' }),
            btn('', () => nudge(item.id, 1), { iconName: 'down', small: true, kind: 'ghost', title: 'Move down' }),
            btn('', () => { change(() => { seg.items = seg.items.filter((x) => x.id !== item.id); }); toast('Removed.', { action: { label: 'Undo', run: undo } }); }, { iconName: 'close', small: true, kind: 'ghost', title: 'Remove this line' })) : null)));
    if (meta.canEdit) {
      li.addEventListener('dragstart', (e) => { if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return; dragItemId = item.id; e.dataTransfer.setData('text/x-op-item', item.id); e.dataTransfer.effectAllowed = 'move'; li.classList.add('dragging'); });
      li.addEventListener('dragend', () => li.classList.remove('dragging'));
      li.addEventListener('dragover', (e) => { e.preventDefault(); e.stopPropagation(); li.classList.add('drop-before'); });
      li.addEventListener('dragleave', () => li.classList.remove('drop-before'));
      li.addEventListener('drop', (e) => onDrop(e, seg.id, item.id));
    }
    return li;
  };

  let plan = new Map();
  const toggleBlock = (id) => { if (openBlocks.has(id)) openBlocks.delete(id); else openBlocks.add(id); remembered.open = [...openBlocks]; drawSegments(); };
  const itemRow = (seg, item) => {
    if (item.pause) return pauseRow(seg, item);
    const mv = store.movements[item.slug];
    const tags = bookedTags();
    const all = mv ? (mv.cautions || []).filter((c) => tags.has(c.tag)) : [];
    const flags = all.filter((c) => c.severity !== 'modify');
    const adjust = all.filter((c) => c.severity === 'modify');
    const planned = plan.get(item.id);
    const open = !!mv && meta.canEdit && openBlocks.has(item.id);
    const sec = itemDuration(item, mv, tm());
    const li = h('li', { class: ['item', 'block', open && 'open'], draggable: meta.canEdit && !open ? 'true' : null, 'data-id': item.id },
      h('div', { class: 'block-row' },
        meta.canEdit ? h('span', { class: 'grip', 'aria-hidden': 'true' }, icon('grip')) : h('span'),
        h('div', { class: 'item-main' }, mv ? h('span', { class: 'item-thumb', 'aria-hidden': 'true' }, thumb(mv, { width: 54 })) : null, h('div', { style: { minWidth: 0, flex: 1 } },
          h('div', { class: 'block-title' },
            mv ? h('a', { class: 'name', href: `#/movements/${mv.slug}`, title: 'Quick look', onclick: (e) => { e.preventDefault(); peek(mv); } }, mv.name) : h('span', { class: 'name' }, `Missing: ${item.slug}`),
            mv && variationOf(mv, item) ? h('span', { class: 'tag tag-accent', title: variationOf(mv, item).note || 'The version the class does' }, item.variation) : null,
            flags.length ? h('span', { class: 'tag tag-warn', title: flags.map((f) => f.note).join(' ') }, icon('alert', 11), flags.map((f) => labelOf(CAUTIONS, f.tag)).join(', ')) : null,
            adjust.length ? h('span', { class: 'tag', title: adjust.map((f) => `${labelOf(CAUTIONS, f.tag)}: ${f.note}`).join(' ') }, 'Adjust') : null,
            planned && planned.advanced ? h('span', { class: 'tag', title: 'Taught on its progression springs so the class doesn\'t stop for a change' }, 'On progression springs') : null),
          mv ? h('div', { class: 'sub' }, [posLabel(mv.position), mv.muscles.primary.slice(0, 3).map(muscleLabel).join(', '), repsLabel(item.reps || mv.reps)].filter(Boolean).join(' · ')) : null,
          item.note ? h('div', { class: 'block-note' }, item.note) : null,
          !open ? itemExtras(item, mv, room()) : null)),
        mv && mv.apparatus === 'reformer' ? h('span', { class: 'block-springs' }, springDots(planned ? planned.loads : (item.load?.springs || mv.load?.springs || []), room())) : h('span', { class: 'tiny muted block-springs' }, mv ? 'Mat' : ''),
        h('div', { class: 'block-end' },
          h('input', { type: 'text', class: ['dur', !item.duration && 'auto'], value: fmtClock(sec), title: item.duration ? 'Time for this block (typed in)' : 'Time for this block, worked out from the movement, its layers and finisher. Type to set your own.', 'aria-label': `Time for ${mv?.name || 'block'} (minutes:seconds)`, disabled: !meta.canEdit,
            onchange: (e) => { const s = parseClock(e.target.value); if (s) change(() => { item.duration = s; }); else e.target.value = fmtClock(sec); } }),
          meta.canEdit ? h('div', { class: 'tools' },
            btn('', () => nudge(item.id, -1), { iconName: 'up', small: true, kind: 'ghost', title: 'Move up' }),
            btn('', () => nudge(item.id, 1), { iconName: 'down', small: true, kind: 'ghost', title: 'Move down' }),
            btn('', () => { change(() => { seg.items = seg.items.filter((x) => x.id !== item.id); }); toast('Removed.', { action: { label: 'Undo', run: undo } }); }, { iconName: 'close', small: true, kind: 'ghost', title: 'Remove block' })) : null)),
      mv && meta.canEdit ? h('button', { type: 'button', class: 'block-toggle', 'aria-expanded': open ? 'true' : 'false', onclick: (e) => { e.stopPropagation(); toggleBlock(item.id); } },
        icon(open ? 'up' : 'layers', 14), open ? 'Done' : (layersOf(mv, item).length || item.finisher || (item.options || []).length || item.variation ? 'Edit block' : 'Plan block')) : null,
      open ? blockEditor({ item, mv, room: room(), change, planned, focus, timing: tm() }) : null);
    if (meta.canEdit) {
      li.addEventListener('dragstart', (e) => { dragItemId = item.id; e.dataTransfer.setData('text/x-op-item', item.id); e.dataTransfer.effectAllowed = 'move'; li.classList.add('dragging'); });
      li.addEventListener('dragend', () => li.classList.remove('dragging'));
      li.addEventListener('dragover', (e) => { e.preventDefault(); e.stopPropagation(); li.classList.add('drop-before'); });
      li.addEventListener('dragleave', () => li.classList.remove('drop-before'));
      li.addEventListener('drop', (e) => onDrop(e, seg.id, item.id));
    }
    if (planned && planned.changed) return [h('li', { class: 'spring-change', 'aria-label': 'Spring change' }, 'Change springs', springDots(planned.loads, room())), li];
    return li;
  };

  const segmentCard = (seg, si) => {
    const a = segSeconds(seg);
    // Selecting a segment only moves the highlight; redrawing here would swallow the click on whatever was pressed.
    const el = h('div', { class: ['segment', activeSeg === seg.id && meta.canEdit && 'active'], 'data-seg': seg.id, onclick: () => { if (activeSeg !== seg.id) { activeSeg = remembered.activeSeg = seg.id; segWrap.querySelectorAll('.segment').forEach((x) => x.classList.toggle('active', meta.canEdit && x.dataset.seg === seg.id)); } } },
      !phased() ? h('div', { class: 'seg-head seg-plain' }, h('span', { class: 'seg-name-plain' }, 'Blocks, in order'), h('span', { class: 'seg-time' }, fmtClock(a))) : h('div', { class: 'seg-head' },
        h('span', { class: 'seg-dot', style: { background: ROLE_COLOR[seg.role] } }),
        h('input', { class: 'seg-name', type: 'text', value: seg.name, 'aria-label': 'Phase name', disabled: !meta.canEdit, oninput: (e) => change(() => { seg.name = e.target.value; }, { redraw: false }) }),
        select(SEGMENT_ROLES, seg.role, (v) => change(() => { seg.role = v; }), { 'aria-label': 'What this phase is', disabled: !meta.canEdit }),
        h('span', { class: ['seg-time', seg.minutes && a > seg.minutes * 60 + 45 && 'over', seg.minutes && a < seg.minutes * 60 - 45 && seg.items.length && 'under'], title: seg.minutes ? `This phase is planned for ${seg.minutes} min` : 'No time set for this phase' },
          fmtClock(a), ' of ',
          h('input', { type: 'number', class: 'seg-min', min: 0, max: 120, value: seg.minutes || '', placeholder: '–', 'aria-label': `Minutes planned for ${seg.name}`, disabled: !meta.canEdit, onchange: (e) => change(() => { const n = Math.round(Number(e.target.value)); if (n > 0) seg.minutes = n; else delete seg.minutes; }) }), ' min'),
        meta.canEdit ? h('div', { class: 'tools', style: { display: 'flex' } },
          btn('', () => change(() => { if (si > 0) [flow.segments[si - 1], flow.segments[si]] = [flow.segments[si], flow.segments[si - 1]]; }), { iconName: 'up', small: true, kind: 'ghost', title: 'Move phase up' }),
          btn('', () => change(() => { if (si < flow.segments.length - 1) [flow.segments[si + 1], flow.segments[si]] = [flow.segments[si], flow.segments[si + 1]]; }), { iconName: 'down', small: true, kind: 'ghost', title: 'Move phase down' }),
          btn('', (e) => { if (openPhases.has(seg.id)) openPhases.delete(seg.id); else openPhases.add(seg.id); drawSegments(); }, { iconName: 'edit', small: true, kind: 'ghost', title: 'Song, repeat on the other side, save as a series, delete' })) : null),
      phased() && (seg.song || seg.bothSides) && !openPhases.has(seg.id) ? h('div', { class: 'seg-notes' }, seg.song ? h('span', null, icon('music', 13), ' ', seg.song) : null, seg.bothSides ? h('span', null, '↻ One side, then the other') : null) : null,
      phased() && meta.canEdit && openPhases.has(seg.id) ? h('div', { class: 'seg-more' },
        h('label', { class: 'seg-song' }, icon('music', 16), h('input', { class: 'song', type: 'text', placeholder: 'Song or playlist (optional)', value: seg.song || '', 'aria-label': 'Song', oninput: (e) => change(() => { seg.song = e.target.value; }, { redraw: false }) })),
        h('label', { class: 'both-sides', title: 'Teach the whole phase on one side, then repeat it on the other. Doubles its time.' }, h('input', { type: 'checkbox', checked: !!seg.bothSides, onchange: (e) => change(() => { seg.bothSides = e.target.checked || undefined; }) }), 'Teach one side, then repeat on the other'),
        h('span', { class: 'spacer' }),
        seg.items.filter((i) => !i.pause).length > 1 ? btn('Save as a series', () => saveAsSeries(seg), { iconName: 'copy', small: true }) : null,
        btn('Delete phase', async () => { if (!seg.items.length || await confirmDialog('Delete this phase?', `"${seg.name}" and its ${seg.items.length} block${seg.items.length === 1 ? '' : 's'} will be removed.`)) change(() => { flow.segments = flow.segments.filter((s) => s.id !== seg.id); }); }, { iconName: 'trash', small: true, kind: 'ghost' })) : null,
      h('ol', { class: 'seg-items' }, seg.items.map((it) => itemRow(seg, it))),
      seg.bothSides && seg.items.length ? h('div', { class: 'seg-repeat' }, `↻ Then repeat all ${seg.items.length} on the other side`) : null,
      !seg.items.length && !meta.canEdit ? h('p', { class: 'small muted', style: { padding: '14px' } }, 'Nothing planned.') : null,
      meta.canEdit ? h('div', { class: 'add-row' },
        h('button', { type: 'button', class: 'add-block', onclick: (e) => { e.stopPropagation(); pickFor(seg); } }, icon('plus', 14), seg.items.length ? 'Add a block' : 'Add a block, or drag a movement here'),
        h('button', { type: 'button', class: 'add-block suggest', title: 'Picks from what suits this phase, at this class level, leaving out what the flow already has', onclick: (e) => { e.stopPropagation(); suggest(seg); } }, icon('sparkle', 14), seg.items.length ? 'Suggest one' : 'Suggest blocks'),
        h('button', { type: 'button', class: 'add-block line', title: 'Time that is not a movement: a water break, a change of set-up', onclick: (e) => { e.stopPropagation(); addLine(seg); } }, icon('clock', 14), 'Timed line')) : null);
    if (meta.canEdit) {
      el.addEventListener('dragover', (e) => { e.preventDefault(); el.classList.add('drop-target'); });
      el.addEventListener('dragleave', (e) => { if (!el.contains(e.relatedTarget)) el.classList.remove('drop-target'); });
      el.addEventListener('drop', (e) => onDrop(e, seg.id, null));
    }
    return el;
  };
  // Fill a phase, or add one more block to it, the way a draft would.
  const suggest = (seg) => {
    const type = classTypesOf(store.studio).find((c) => c.id === flow.classType);
    const phase = type && type.phases.find((p) => p.name === seg.name);
    const items = fillPhase({ movements: store.movements, flow, seg, phase, props: store.studio.props || {}, clientTags: [...bookedTags()], timing: tm(), count: seg.items.length ? 1 : undefined });
    if (!items.length) { toast('Nothing left in the library suits this phase at this level. Try "Add a block" and untick the box.'); return; }
    activeSeg = remembered.activeSeg = seg.id;
    change(() => { seg.items.push(...items); });
    toast(`Added ${items.map((i) => store.movements[i.slug].name).join(', ')}.`, { action: { label: 'Undo', run: undo } });
  };
  // Pick movements for a phase from a searchable list. It starts on the part of the body the phase is for.
  const pickFor = (seg) => {
    activeSeg = remembered.activeSeg = seg.id;
    const type = classTypesOf(store.studio).find((c) => c.id === flow.classType);
    const phase = type && type.phases.find((p) => p.name === seg.name);
    const st = { q: '', fit: !!(phase || seg.role === 'warmup' || seg.role === 'cooldown') };
    const listEl = h('div', { class: 'pick-list' });
    const tags = bookedTags();
    const owned = store.studio.props || {};
    const lv = classLevel(flow.level);
    const draw = () => {
      const inFlow = new Set(flow.segments.flatMap((s) => s.items.map((i) => i.slug)));
      const list = store.movementList.filter((mv) => (flow.apparatus === 'mixed' || mv.apparatus === flow.apparatus)
        && (!st.q || (namesOf(mv).join(' ') + ' ' + mv.muscles.primary.join(' ') + ' ' + (mv.labels || []).join(' ')).toLowerCase().includes(st.q))
        && (!lib.ownedOnly || (mv.equipment || []).every((e) => Number(owned[e]) > 0)) && (!lib.safe || !avoids(mv, tags))
        && (!st.fit || st.q || ((seg.role !== 'warmup' || usesOf(mv).includes('warmup')) && (seg.role !== 'cooldown' || usesOf(mv).includes('cooldown'))
          && (!phase || !(phase.sections || []).length || phase.sections.includes(sectionOf(mv))) && levelRange(mv)[0] <= lv.to)));
      fill(listEl, list.length ? list.map((mv) => h('button', { type: 'button', class: ['lib-row', 'pick-row', inFlow.has(mv.slug) && 'used'], onclick: () => { addMovement(mv, seg.id); draw(); } },
        h('span', { class: 'lib-thumb', 'aria-hidden': 'true' }, thumb(mv, { width: 46 })),
        h('span', { class: 'lib-main' }, h('span', { class: 'lib-name' }, mv.name), h('span', { class: 'lib-meta' }, posLabel(mv.position), mv.apparatus === 'reformer' && mv.load ? [' · ', springDots(mv.load.springs, room(), { label: false })] : null, ` · ${mv.muscles.primary.slice(0, 2).map(muscleLabel).join(', ')}`, inFlow.has(mv.slug) ? ' · in this flow' : '')),
        h('span', { class: 'pick-plus', 'aria-hidden': 'true' }, icon('plus', 16)))) : h('p', { class: 'small muted' }, 'Nothing matches. Untick the box above to see the whole library.'));
    };
    draw();
    modal(phased() ? `Add to ${seg.name}` : 'Add a block', h('div', { class: 'stack-sm' },
      h('input', { type: 'search', placeholder: 'Search any name, muscle or label', 'aria-label': 'Search movements', oninput: (e) => { st.q = e.target.value.trim().toLowerCase(); draw(); } }),
      h('label', { class: 'check-row' }, h('input', { type: 'checkbox', checked: st.fit, onchange: (e) => { st.fit = e.target.checked; draw(); } }),
        h('span', null, seg.role === 'warmup' ? 'Only warm-up movements' : seg.role === 'cooldown' ? 'Only cool-down movements' : 'Only what suits this phase', h('span', { class: 'tiny muted', style: { display: 'block' } }, `${phase && (phase.sections || []).length ? phase.sections.map((x) => labelOf(SECTIONS, x)).join(', ') + ' · ' : ''}up to ${lv.label}. Searching looks through everything.`))),
      listEl), { actions: [{ label: 'Done', value: true, kind: 'primary' }] });
  };
  const segSeconds = (seg) => seg.items.reduce((t, i) => t + itemDuration(i, store.movements[i.slug], tm()), 0) * (seg.bothSides ? 2 : 1);

  const drawSegments = () => {
    plan = new Map(analysis().springPlan.filter((p) => p.pass === 1).map((p) => [p.itemId, p]));
    fill(segWrap, 
      ...flow.segments.map(segmentCard),
      meta.canEdit && phased() ? h('button', { type: 'button', class: 'add-seg', onclick: () => change(() => { const s = { id: newId('s'), name: 'New phase', role: 'build', song: '', items: [] }; flow.segments.push(s); activeSeg = s.id; }) }, '+ Add a phase') : null,
      bookedCard());
    if (focus.key) { const el = segWrap.querySelector(`[data-focus="${focus.key}"]`); focus.key = null; if (el) el.focus(); }
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

  // ---------- live analysis aside
  const statsEl = h('div');
  const asideEl = h('aside', { class: 'col-aside', 'aria-label': 'Live analysis' });
  const drawLive = () => {
    const a = analysis();
    fill(statsEl, statTiles(a));
    fill(asideEl, 
      springsCard(a, room(), { compact: true }),
      radarCard(a),
      bodyCard(a, { size: 96 }),
      h('div', { class: 'card' }, h('div', { class: 'card-head' }, h('h2', null, 'Checks')), checksList(a.checks, { limit: 6 }),
        h('a', { class: 'btn btn-dark', style: { width: '100%', marginTop: '10px' }, href: `#/flows/${meta.id}/analysis` }, 'Open full analysis')),
      setOutCard(a, room()));
  };
  const drawBody = () => { drawSegments(); drawLive(); drawLibrary(); };

  // ---------- analysis tab
  const analysisBody = () => {
    const a = analysis();
    const swap = (issue) => change(() => {
      for (const seg of flow.segments) for (const it of seg.items) if (it.id === issue.itemId) { it.slug = issue.swap.slug; delete it.load; delete it.layer; delete it.layers; delete it.options; delete it.variation; delete it.finisher; }
    });
    return h('div', { class: 'stack' },
      statTiles(a),
      intensityCard(a, flow),
      h('div', { class: 'card-cols' }, springsCard(a, room()), balanceCard(a), setOutCard(a, room()), radarCard(a), positionsCard(a), bodyCard(a), muscleListCard(a), focusCard(a),
        h('div', { class: 'card' }, h('h2', null, 'Class check'), checksList(a.checks))),
      clientsCard(a, { onSwap: meta.canEdit ? swap : null }));
  };

  const analysisWrap = h('div');
  const drawAll = () => {
    titleInput.value = flow.title;
    fill(settingsEl, settingsRow());
    if (activeSeg && !flow.segments.some((s) => s.id === activeSeg)) activeSeg = remembered.activeSeg = flow.segments[0]?.id || null;
    if (tab === 'analysis') fill(analysisWrap, analysisBody());
    else drawBody();
  };

  if (meta.canEdit) hist.keys(true);
  const cleanup = () => { hist.keys(false); save.flush(); };

  const head = h('div', { class: 'page-head flow-head' },
    h('div', { class: 'grow' }, h('a', { href: '#/', class: 'small no-print' }, '← Flows'), titleInput, settingsEl, h('div', { class: 'save-state', style: { marginTop: '6px' } }, meta.canEdit ? hist.el : null, status)),
    tabs(tab), actions());

  if (tab === 'analysis') {
    drawAll();
    return { title: flow.title, cleanup, node: [head, analysisWrap] };
  }
  drawAll();
  return { title: flow.title, cleanup, node: [head, statsEl, h('div', { class: 'cols' }, meta.canEdit ? libraryPane() : null, h('div', { class: 'col-main' }, segWrap), asideEl)] };

  function parseClock(v, min = 10, max = 1800) {
    const m = String(v).trim().match(/^(\d{1,3})(?::(\d{1,2}))?$/);
    if (!m) return null;
    const sec = m[2] != null ? Number(m[1]) * 60 + Number(m[2]) : Number(m[1]) * 60;
    return sec >= min && sec <= max ? sec : null;
  }
}

function pickFlow(d) {
  const { title, apparatus, level, lengthMin, goal, focusText, noPhases, target, format, classType, springBudget, theme, room, when, notes, labels, booked, segments } = d;
  return { title, apparatus, level, lengthMin, goal, ...(focusText ? { focusText } : {}), ...(noPhases ? { noPhases: true } : {}), target, format: format || 'open', ...(classType ? { classType } : {}), springBudget: springBudget ?? 0, theme: theme || '', room, when, notes, labels, booked: booked || [], segments: segments || [] };
}
