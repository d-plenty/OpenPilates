import { h, icon, btn, toast, field, select, chips, confirmDialog, debounce, fill } from '../ui.js';
import { api, store } from '../store.js';
import { go } from '../app.js';
import { POSITIONS, SPINE, PATTERNS, PLANES, MUSCLES, EQUIPMENT, LEVELS, CAUTIONS, PURPOSES, LOAD_LEVELS, BRANDS, springFor, labelOf } from '/shared/vocab.js';
import { bodyMap, bodyLegend, springDots, bar } from '../charts.js';
import { posLabel, muscleLabel } from './common.js';
import { fmtClock } from '/shared/analysis.js';

export async function movementView(slug) {
  const mv = await api('GET', `/movements/${slug}`);
  const room = store.roomFor({ apparatus: mv.apparatus });
  const canEdit = store.isAdmin || (mv.source === 'custom' && mv.ownerId === store.user.id);
  const levels = {};
  for (const m of mv.muscles.primary) levels[m] = 1;
  for (const m of mv.muscles.secondary) levels[m] = levels[m] || 0.5;

  const saveNote = debounce(async (text) => { await api('PUT', `/movements/${slug}/note`, { text }); toast('Note saved.'); }, 900);
  const exportFile = () => {
    const clean = { ...mv };
    for (const k of ['source', 'ownerId', 'updatedAt', 'myNote', 'hasLibraryVersion']) delete clean[k];
    const blob = new Blob([JSON.stringify(clean, null, 2) + '\n'], { type: 'application/json' });
    const a = h('a', { href: URL.createObjectURL(blob), download: `${mv.slug}.json` });
    document.body.append(a); a.click(); a.remove();
  };
  const duplicate = async () => {
    const copy = { ...mv, name: `${mv.name} (my version)`, slug: undefined, review: { status: 'draft', note: `Based on ${mv.name}.` } };
    const created = await api('POST', '/movements', copy);
    await store.loadMovements(true);
    toast('Copy made. Edit it to suit.');
    go(`/movements/${created.slug}/edit`);
  };
  const remove = async () => {
    const restoring = mv.hasLibraryVersion;
    if (!await confirmDialog(restoring ? 'Reset to library version?' : 'Delete this movement?', restoring ? 'Your studio\'s changes will be replaced by the library version.' : 'Flows that use it will show it as missing.', restoring ? 'Reset' : 'Delete')) return;
    await api('DELETE', `/movements/${slug}`);
    await store.loadMovements(true);
    toast(restoring ? 'Reset to the library version.' : 'Movement deleted.');
    go(restoring ? `/movements/${slug}` : '/explore');
  };

  const brandRows = Object.entries(BRANDS).filter(([k]) => k !== 'custom').map(([k, b]) => {
    const loads = mv.load?.springs || [];
    const mine = room.brand === k;
    return h('tr', null, h('td', { style: { fontWeight: mine ? 700 : 500 } }, b.label, mine ? ' (your studio)' : ''),
      h('td', null, springDots(loads, { brand: k, springOverrides: mine ? room.springOverrides : {} })));
  });

  return { title: mv.name, node: [
    h('div', { class: 'page-head' },
      h('div', { class: 'grow' },
        h('a', { href: '#/explore', class: 'small' }, '← Movements'),
        h('h1', null, mv.name),
        h('div', { class: 'btn-row', style: { marginTop: '8px' } },
          h('span', { class: 'tag tag-accent' }, mv.apparatus === 'mat' ? 'Mat' : 'Reformer'),
          h('span', { class: 'tag' }, labelOf(LEVELS, mv.level)),
          h('span', { class: 'tag' }, posLabel(mv.position)),
          (mv.spine || []).map((s) => h('span', { class: 'tag' }, `Spine: ${labelOf(SPINE, s)}`)),
          h('span', { class: 'tag' }, mv.multiJoint ? 'Multi-joint' : 'Isolated'),
          mv.source !== 'library' ? h('span', { class: 'tag tag-dark' }, mv.source === 'studio' ? 'Studio edit' : 'Custom') : null)),
      h('div', { class: 'btn-row' },
        canEdit ? h('a', { class: 'btn btn-primary', href: `#/movements/${slug}/edit` }, icon('edit'), 'Edit') : null,
        btn('Duplicate as my own', duplicate, { iconName: 'copy' }),
        btn('', exportFile, { iconName: 'download', title: 'Download movement file' }),
        canEdit && mv.source !== 'library' ? btn('', remove, { iconName: mv.hasLibraryVersion ? 'undo' : 'trash', title: mv.hasLibraryVersion ? 'Reset to library version' : 'Delete' }) : null)),
    mv.review?.status !== 'reviewed' ? h('p', { class: 'review-note', style: { marginBottom: '14px' } }, mv.review?.note || 'Draft entry — check before teaching from it.') : h('p', { class: 'tiny muted', style: { marginBottom: '14px' } }, `Reviewed by ${mv.review.by || 'an instructor'}${mv.review.date ? ' · ' + mv.review.date : ''}`),
    h('div', { class: 'auto-grid' },
      h('div', { class: 'card stack' },
        h('h2', null, 'About'),
        mv.summary ? h('p', null, mv.summary) : h('p', { class: 'muted' }, 'No description yet.'),
        h('dl', { class: 'kv' },
          h('dt', null, 'Typical'), h('dd', null, `${mv.reps || '—'} · about ${fmtClock(mv.duration)}`),
          h('dt', null, 'Effort'), h('dd', null, `${mv.intensity} / 10`),
          h('dt', null, 'Plane'), h('dd', null, labelOf(PLANES, mv.plane)),
          h('dt', null, 'Patterns'), h('dd', null, (mv.patterns || []).map((p) => labelOf(PATTERNS, p)).join(', ') || '—'),
          h('dt', null, 'Equipment'), h('dd', null, (mv.equipment || []).map((e) => labelOf(EQUIPMENT, e)).join(', ') || (mv.apparatus === 'mat' ? 'Mat' : 'Reformer')),
          mv.labels?.length ? [h('dt', null, 'Labels'), h('dd', null, mv.labels.join(', '))] : null)),
      mv.apparatus === 'reformer' ? h('div', { class: 'card' },
        h('h2', null, 'Springs'),
        h('p', { class: 'small muted', style: { margin: '-4px 0 10px' } }, `Saved as a load: ${(mv.load?.springs || []).join(' + ') || 'no springs'}. Shown in each brand\'s colours — conversions are approximate, so check on your machine.`),
        h('table', { class: 'tbl' }, h('tbody', null, brandRows))) : null,
      h('div', { class: 'card' },
        h('h2', null, 'Muscles'),
        h('div', { style: { display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'flex-start' } },
          bodyMap(levels, { size: 84 }),
          h('dl', { class: 'kv', style: { flex: '1 1 160px', gridTemplateColumns: '90px minmax(0,1fr)' } },
            h('dt', null, 'Primary'), h('dd', null, mv.muscles.primary.map(muscleLabel).join(', ')),
            h('dt', null, 'Secondary'), h('dd', null, mv.muscles.secondary.map(muscleLabel).join(', ') || '—'))), bodyLegend()),
      h('div', { class: 'card' }, h('h2', null, 'What it does'), PURPOSES.map((p) => bar(p.label, Math.round(((mv.purpose?.[p.id] || 0) / 3) * 100), p.color, ['None', 'Low', 'Medium', 'High'][mv.purpose?.[p.id] || 0]))),
      mv.layers?.length ? h('div', { class: 'card stack-sm' }, h('h2', null, 'Layers'), mv.layers.map((l) => h('div', { class: 'layer' }, h('span', { class: 'lt' }, l.tag), h('div', null, h('b', { class: 'small' }, l.title), h('div', { class: 'tiny muted' }, l.text))))) : null,
      h('div', { class: 'card stack-sm' }, h('h2', null, 'Cautions & swaps'),
        mv.cautions?.length ? mv.cautions.map((c) => h('div', { class: 'caution' }, h('b', null, labelOf(CAUTIONS, c.tag)), h('div', { class: 'tiny' }, c.note),
          c.swap && store.movements[c.swap] ? h('div', { class: 'tiny', style: { marginTop: '4px' } }, 'Swap: ', h('a', { href: `#/movements/${c.swap}` }, store.movements[c.swap].name)) : null)) : h('p', { class: 'muted small' }, 'None listed.')),
      h('div', { class: 'card stack-sm' }, h('h2', null, 'Cues & notes'),
        mv.cues ? h('p', { class: 'small', style: { whiteSpace: 'pre-line' } }, mv.cues) : h('p', { class: 'muted small' }, 'No shared cues yet.'),
        field('My notes (only you see these)', h('textarea', { rows: 4, oninput: (e) => saveNote(e.target.value) }, mv.myNote || '')))
    )] };
}

export async function movementEditView(slug) {
  const existing = slug ? await api('GET', `/movements/${slug}`) : null;
  if (existing && !(store.isAdmin || (existing.source === 'custom' && existing.ownerId === store.user.id))) {
    return h('div', { class: 'empty' }, h('h3', null, 'You can\'t edit this movement'), h('p', null, 'Duplicate it to make your own version.'), h('a', { class: 'btn', href: `#/movements/${slug}` }, 'Back'));
  }
  const mv = existing ? structuredClone(existing) : {
    name: '', apparatus: 'reformer', level: 'beginner', position: 'supine', spine: ['neutral'], plane: 'sagittal', patterns: [], muscles: { primary: [], secondary: [] },
    equipment: [], load: { springs: ['medium'] }, purpose: { strength: 1, stability: 1, flexibility: 0, mobility: 0 }, multiJoint: true, intensity: 4, duration: 120, reps: '', summary: '', layers: [], cautions: [], cues: '', labels: [], review: { status: 'draft', note: '' }
  };
  mv.load = mv.load || { springs: [] };
  const err = h('p', { class: 'error', role: 'alert' });
  const wrap = h('div', { class: 'stack' });
  const room = () => store.roomFor({ apparatus: mv.apparatus });

  const input = (key, attrs = {}) => h('input', { type: 'text', value: mv[key] ?? '', oninput: (e) => { mv[key] = attrs.type === 'number' ? Number(e.target.value) : e.target.value; }, ...attrs });
  const area = (key, rows = 3) => h('textarea', { rows, oninput: (e) => { mv[key] = e.target.value; } }, mv[key] || '');

  const draw = () => {
    const springsEl = h('div', { class: 'btn-row' }, springDots(mv.load.springs, room()),
      LOAD_LEVELS.map((l) => { const sp = springFor(room().brand, l, room().springOverrides); return btn(`+ ${sp.name}${sp.approx ? '*' : ''}`, () => { if (mv.load.springs.length < 5) { mv.load.springs.push(l); draw(); } }, { small: true, title: l }); }),
      btn('Clear', () => { mv.load.springs = []; draw(); }, { small: true, kind: 'ghost' }));
    fill(wrap, 
      h('div', { class: 'card stack' }, h('h2', null, 'Basics'),
        field('Name', input('name', { required: true })),
        h('div', { class: 'grid-3' },
          field('Apparatus', select([{ id: 'reformer', label: 'Reformer' }, { id: 'mat', label: 'Mat' }], mv.apparatus, (v) => { mv.apparatus = v; draw(); })),
          field('Level', select(LEVELS, mv.level, (v) => { mv.level = v; })),
          field('Starting position', select(POSITIONS, mv.position, (v) => { mv.position = v; }))),
        field('Short description', area('summary', 3), 'In your own words. Don\'t copy text from books or other apps.'),
        h('div', { class: 'grid-3' },
          field('Typical reps', input('reps', { placeholder: 'e.g. 8 each side' })),
          field('Typical time (seconds)', input('duration', { type: 'number', min: 15, max: 1800 })),
          field('Effort (1–10)', input('intensity', { type: 'number', min: 1, max: 10 })))),
      mv.apparatus === 'reformer' ? h('div', { class: 'card stack' }, h('h2', null, 'Springs'), springsEl, h('p', { class: 'hint' }, `Shown in ${BRANDS[room().brand]?.label || 'your'} colours. * = closest available spring.`)) : null,
      h('div', { class: 'card stack' }, h('h2', null, 'Movement'),
        field('Spine', chips(SPINE, mv.spine, (v) => { mv.spine = v; })),
        field('Plane', chips(PLANES, mv.plane, (v) => { mv.plane = v; draw(); }, { multi: false })),
        field('Patterns', chips(PATTERNS, mv.patterns, (v) => { mv.patterns = v; })),
        h('label', { class: 'small', style: { display: 'flex', gap: '8px', alignItems: 'center' } }, h('input', { type: 'checkbox', checked: mv.multiJoint, onchange: (e) => { mv.multiJoint = e.target.checked; } }), 'Multi-joint (full-body) movement')),
      h('div', { class: 'card stack' }, h('h2', null, 'Muscles'),
        field('Primary', chips(MUSCLES, mv.muscles.primary, (v) => { mv.muscles.primary = v; mv.muscles.secondary = mv.muscles.secondary.filter((x) => !v.includes(x)); draw(); }, { small: true })),
        field('Secondary', chips(MUSCLES.filter((m) => !mv.muscles.primary.includes(m.id)), mv.muscles.secondary, (v) => { mv.muscles.secondary = v; }, { small: true }))),
      h('div', { class: 'card stack' }, h('h2', null, 'What it does'),
        PURPOSES.map((p) => field(p.label, chips([0, 1, 2, 3].map((n) => ({ id: n, label: ['None', 'Low', 'Medium', 'High'][n] })), mv.purpose[p.id] || 0, (v) => { mv.purpose[p.id] = v; draw(); }, { multi: false, small: true })))),
      h('div', { class: 'card stack' }, h('h2', null, 'Equipment needed'),
        chips(EQUIPMENT, mv.equipment, (v) => { mv.equipment = v; }, { small: true })),
      h('div', { class: 'card stack' }, h('div', { class: 'card-head', style: { margin: 0 } }, h('h2', null, 'Layers'), h('div', { class: 'spacer' }), btn('Add layer', () => { mv.layers.push({ tag: `L${mv.layers.length + 1}`, title: '', text: '' }); draw(); }, { small: true, iconName: 'plus' })),
        mv.layers.map((l, i) => h('div', { class: 'grid-3', style: { gridTemplateColumns: '70px minmax(0,1fr) minmax(0,2fr) 40px' } },
          h('input', { type: 'text', value: l.tag, 'aria-label': 'Layer tag', oninput: (e) => { l.tag = e.target.value; } }),
          h('input', { type: 'text', value: l.title, placeholder: 'Title', 'aria-label': 'Layer title', oninput: (e) => { l.title = e.target.value; } }),
          h('input', { type: 'text', value: l.text, placeholder: 'What changes', 'aria-label': 'Layer description', oninput: (e) => { l.text = e.target.value; } }),
          btn('', () => { mv.layers.splice(i, 1); draw(); }, { iconName: 'close', small: true, kind: 'ghost', title: 'Remove layer' })))),
      h('div', { class: 'card stack' }, h('div', { class: 'card-head', style: { margin: 0 } }, h('h2', null, 'Cautions & swaps'), h('div', { class: 'spacer' }), btn('Add caution', () => { mv.cautions.push({ tag: 'knee', note: '' }); draw(); }, { small: true, iconName: 'plus' })),
        h('p', { class: 'hint' }, 'Clients tagged with the same caution are flagged when this movement is in their class.'),
        mv.cautions.map((c, i) => h('div', { class: 'grid-3', style: { gridTemplateColumns: 'minmax(0,1fr) minmax(0,2fr) minmax(0,1fr) 40px' } },
          select(CAUTIONS, c.tag, (v) => { c.tag = v; }, { 'aria-label': 'Caution' }),
          h('input', { type: 'text', value: c.note, placeholder: 'What to watch for', 'aria-label': 'Caution note', oninput: (e) => { c.note = e.target.value; } }),
          select([{ id: '', label: 'No swap' }, ...store.movementList.filter((m) => m.slug !== mv.slug && m.apparatus === mv.apparatus).map((m) => ({ id: m.slug, label: m.name }))], c.swap || '', (v) => { c.swap = v || undefined; }, { 'aria-label': 'Swap to' }),
          btn('', () => { mv.cautions.splice(i, 1); draw(); }, { iconName: 'close', small: true, kind: 'ghost', title: 'Remove caution' })))),
      h('div', { class: 'card stack' }, h('h2', null, 'Cues & labels'),
        field('Shared cues', area('cues', 4), 'Everyone in the studio sees these in the builder and Play mode.'),
        field('Labels', h('input', { type: 'text', value: (mv.labels || []).join(', '), oninput: (e) => { mv.labels = e.target.value.split(',').map((x) => x.trim()).filter(Boolean); } }), 'Comma separated, e.g. warm-up, pregnancy-friendly'),
        store.isAdmin ? h('div', { class: 'grid-3' },
          field('Review status', select([{ id: 'draft', label: 'Draft' }, { id: 'reviewed', label: 'Reviewed' }], mv.review?.status || 'draft', (v) => { mv.review = { ...(mv.review || {}), status: v }; })),
          field('Reviewed by', h('input', { type: 'text', value: mv.review?.by || '', oninput: (e) => { mv.review = { ...(mv.review || {}), by: e.target.value }; } })),
          field('Date', h('input', { type: 'text', value: mv.review?.date || '', placeholder: 'YYYY-MM-DD', oninput: (e) => { mv.review = { ...(mv.review || {}), date: e.target.value }; } }))) : null),
      err,
      h('div', { class: 'btn-row' }, btn(existing ? 'Save movement' : 'Create movement', save, { kind: 'primary', iconName: 'check' }), h('a', { class: 'btn btn-ghost', href: existing ? `#/movements/${slug}` : '#/explore' }, 'Cancel')));
  };

  const save = async () => {
    err.textContent = '';
    try {
      const body = { ...mv, load: mv.apparatus === 'reformer' ? mv.load : null };
      const out = existing ? await api('PUT', `/movements/${slug}`, body) : await api('POST', '/movements', body);
      await store.loadMovements(true);
      toast('Movement saved.');
      go(`/movements/${out.slug}`);
    } catch (e) { err.textContent = e.message; }
  };

  draw();
  return { title: existing ? `Edit ${existing.name}` : 'New movement', node: [
    h('div', { class: 'page-head' }, h('div', { class: 'grow' }, h('a', { href: existing ? `#/movements/${slug}` : '#/explore', class: 'small' }, '← Back'), h('h1', null, existing ? `Edit ${existing.name}` : 'New movement'),
      existing?.source === 'library' ? h('p', { class: 'small muted' }, 'Saving makes a studio copy. You can reset it to the library version later.') : null)),
    h('div', { style: { maxWidth: '900px' } }, wrap)] };
}
