import { h, icon, btn, toast, field, select, chips, confirmDialog, debounce, fill } from '../ui.js';
import { api, store } from '../store.js';
import { go, render, backLink } from '../app.js';
import { POSITIONS, SPINE, PATTERNS, PLANES, MUSCLES, EQUIPMENT, LEVELS, CAUTIONS, PURPOSES, LOAD_LEVELS, BRANDS, SECTIONS, CATEGORIES, ROLES, PREGNANCY, HEADREST, STRAPS, SEVERITIES, OPTION_KINDS, springFor, labelOf, sectionOf, categoriesOf, roleOf, levelLabel, variationsOf, USES, usesOf, levelsOf, classLevel } from '/shared/vocab.js';
import { POSES, POSE_IDS, poseOf } from '/shared/poses.js';
import { figure, figureFrames } from '../figure.js';
import { bodyMap, bodyLegend, springDots, bar } from '../charts.js';
import { posLabel, muscleLabel, pregnancyTag, variationList, repsLabel } from './common.js';
import { fmtClock } from '/shared/analysis.js';

export async function movementView(slug) {
  const mv = await api('GET', `/movements/${slug}`);
  const room = store.roomFor({ apparatus: mv.apparatus });
  const canEdit = store.isAdmin || (mv.source === 'custom' && mv.ownerId === store.user.id);
  const levels = {};
  for (const m of mv.muscles.primary) levels[m] = 1;
  for (const m of mv.muscles.secondary) levels[m] = levels[m] || 0.5;

  const leadsTo = store.movementList.filter((m) => (m.prep || []).includes(mv.slug)).slice(0, 8);

  // Shrink the chosen photo in the browser, then send it to this studio's server.
  const pickPhoto = async (file) => {
    try {
      const bmp = await createImageBitmap(file);
      const scale = Math.min(1, 1400 / Math.max(bmp.width, bmp.height));
      const cv = document.createElement('canvas');
      cv.width = Math.round(bmp.width * scale); cv.height = Math.round(bmp.height * scale);
      cv.getContext('2d').drawImage(bmp, 0, 0, cv.width, cv.height);
      const dataUrl = cv.toDataURL('image/jpeg', 0.86);
      await api('PUT', `/movements/${slug}/photo`, { dataUrl, credit: creditInput.value });
      await store.loadMovements(true);
      toast('Photo added.');
      render();
    } catch (e) { toast(e.message || 'That photo could not be read.', { kind: 'error' }); }
  };
  const creditInput = h('input', { type: 'text', placeholder: 'Photo credit (optional)', 'aria-label': 'Photo credit', value: mv.photoCredit || '', style: { maxWidth: '200px', height: '36px' } });
  const fileInput = h('input', { type: 'file', accept: 'image/jpeg,image/png,image/webp', class: 'sr-only', onchange: (e) => e.target.files[0] && pickPhoto(e.target.files[0]) });
  const photoControls = () => h('div', { class: 'btn-row' },
    creditInput,
    h('label', { class: 'btn btn-sm' }, icon('camera', 16), mv.photo ? 'Replace photo' : 'Add a photo', fileInput),
    mv.photo ? btn('Remove photo', async () => { await api('DELETE', `/movements/${slug}/photo`); await store.loadMovements(true); toast('Photo removed.'); render(); }, { small: true, kind: 'ghost' }) : null);

  const saveNote = debounce(async (text) => { await api('PUT', `/movements/${slug}/note`, { text }); toast('Note saved.'); }, 900);
  const exportFile = () => {
    const clean = { ...mv };
    for (const k of ['source', 'ownerId', 'updatedAt', 'myNote', 'hasLibraryVersion', 'photo', 'photoCredit', 'check']) delete clean[k];
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

  // The studio's own check: has a teacher looked at this entry, and is it right?
  const checkNote = h('input', { type: 'text', value: mv.check?.note || '', placeholder: 'What needs fixing (optional)', 'aria-label': 'Review note', style: { flex: '1 1 240px', height: '36px' } });
  const setCheck = async (status) => {
    try { await api('PUT', `/movements/${slug}/check`, { status, note: checkNote.value }); await store.loadMovements(true); toast(status === 'ok' ? 'Marked as checked.' : status === 'fix' ? 'Flagged for fixing.' : 'Review cleared.'); render(); } catch (e) { toast(e.message, { kind: 'error' }); }
  };
  const checkBar = () => h('div', { class: ['check-bar', mv.check ? `check-${mv.check.status}` : ''] },
    h('div', { style: { flex: '1 1 260px' } },
      mv.check ? h('b', null, mv.check.status === 'ok' ? `Checked by ${mv.check.by}` : `Flagged by ${mv.check.by}`, mv.check.note ? `: ${mv.check.note}` : '')
        : h('span', null, h('b', null, 'Not checked yet. '), 'Written for OpenPilates and cross-checked for name and springs', (mv.sources || []).length ? ` against ${mv.sources.length} reference${mv.sources.length === 1 ? '' : 's'}` : '', '. A teacher still needs to look it over.')),
    checkNote,
    btn('Looks right', () => setCheck('ok'), { small: true, iconName: 'check', kind: mv.check?.status === 'ok' ? 'primary' : 'secondary' }),
    btn('Needs fixing', () => setCheck('fix'), { small: true, iconName: 'alert', kind: mv.check?.status === 'fix' ? 'primary' : 'secondary' }),
    mv.check ? btn('Clear', () => { checkNote.value = ''; setCheck(''); }, { small: true, kind: 'ghost' }) : null);
  const back = backLink();
  const setInLibrary = async (inLibrary) => {
    try { await api('PUT', `/movements/${slug}/library`, { inLibrary }); await store.loadMovements(true); toast(inLibrary ? 'Back in your library.' : 'Removed from your library. Find it under Movements → Removed.'); render(); } catch (e) { toast(e.message, { kind: 'error' }); }
  };

  return { title: mv.name, node: [
    h('div', { class: 'page-head' },
      h('div', { class: 'grow' },
        h('a', { href: back.href, class: 'small', onclick: back.onclick }, `← ${back.label}`),
        h('h1', null, mv.name),
        (mv.aka || []).length ? h('div', { class: 'aka-line' }, 'Also called: ', mv.aka.join(', ')) : null,
        h('div', { class: 'btn-row', style: { marginTop: '8px' } },
          h('span', { class: 'tag tag-accent' }, mv.apparatus === 'mat' ? 'Mat' : 'Reformer'),
          h('span', { class: 'tag tag-accent' }, labelOf(SECTIONS, sectionOf(mv))),
          h('span', { class: 'tag' }, levelLabel(mv)),
          h('span', { class: 'tag' }, posLabel(mv.position)),
          h('span', { class: 'tag' }, { stability: 'Stability exercise', mobility: 'Mobility exercise', both: 'Stability + mobility' }[roleOf(mv)]),
          mv.perSide ? h('span', { class: 'tag' }, 'Each side') : null,
          pregnancyTag(mv),
          (mv.spine || []).map((s) => h('span', { class: 'tag' }, `Spine: ${labelOf(SPINE, s)}`)),
          h('span', { class: 'tag' }, mv.multiJoint ? 'Multi-joint' : 'Isolated'),
          mv.source !== 'library' ? h('span', { class: 'tag tag-dark' }, mv.source === 'studio' ? 'Edited by us' : 'Ours') : null)),
      h('div', { class: 'btn-row' },
        canEdit ? h('a', { class: 'btn btn-primary', href: `#/movements/${slug}/edit` }, icon('edit'), 'Edit') : null,
        btn('Duplicate as my own', duplicate, { iconName: 'copy' }),
        btn('', exportFile, { iconName: 'download', title: 'Download movement file' }),
        store.isAdmin && !mv.hidden ? btn('Remove from our library', () => setInLibrary(false), { iconName: 'close', kind: 'ghost', title: 'Stops it being offered anywhere. Flows that use it still open, and you can put it back.' }) : null,
        canEdit && mv.source !== 'library' ? btn(mv.hasLibraryVersion ? 'Reset to library version' : 'Delete', remove, { iconName: mv.hasLibraryVersion ? 'undo' : 'trash', kind: 'ghost', title: mv.hasLibraryVersion ? 'Drop your studio\'s changes to this movement' : 'Delete this movement for good' }) : null)),
    mv.hidden ? h('p', { class: 'review-note', style: { marginBottom: '14px' } }, mv.retired ? 'Not in your library: no reference confirmed this entry, so it isn\'t offered. ' : 'Removed from your library. ', 'Flows that already use it still work.', store.isAdmin ? [' ', btn('Put it back', () => setInLibrary(true), { small: true })] : null) : null,
    checkBar(),
    h('div', { class: 'card', style: { marginBottom: '16px' } },
      h('div', { class: 'hero-figs' },
        mv.photo ? h('figure', { style: { flex: '2 1 300px', maxWidth: '460px', background: 'none', padding: 0 } }, h('img', { class: 'hero-photo', src: mv.photo, alt: `${mv.name}` }), mv.photoCredit ? h('figcaption', { style: { textTransform: 'none', letterSpacing: 0, fontWeight: 500 } }, `Photo: ${mv.photoCredit}`) : null) : null,
        figureFrames(mv, { width: 340 }).map((f) => h('figure', null, f.svg, h('figcaption', null, f.label)))),
      h('div', { class: 'btn-row', style: { marginTop: '10px' } },
        h('span', { class: 'tiny muted', style: { flex: '1 1 260px' } }, `Diagram: ${POSES[poseOf(mv)].label.toLowerCase()}.`, canEdit ? ' Add your studio\'s own photo if you have one.' : ''),
        canEdit ? photoControls() : null)),
    h('div', { class: 'card-cols' },
      h('div', { class: 'card stack' },
        h('h2', null, 'About'),
        mv.summary ? h('p', null, mv.summary) : h('p', { class: 'muted' }, 'No description yet.'),
        h('dl', { class: 'kv' },
          h('dt', null, 'Level'), h('dd', null, levelLabel(mv)),
          h('dt', null, 'Typical'), h('dd', null, `${repsLabel(mv.reps) || '—'} · about ${fmtClock(mv.duration)}`),
          h('dt', null, 'Effort'), h('dd', null, `${mv.intensity} / 10`),
          h('dt', null, 'Categories'), h('dd', null, categoriesOf(mv).map((c) => labelOf(CATEGORIES, c)).join(', ') || '—'),
          h('dt', null, 'Plane'), h('dd', null, labelOf(PLANES, mv.plane)),
          h('dt', null, 'Patterns'), h('dd', null, (mv.patterns || []).map((p) => labelOf(PATTERNS, p)).join(', ') || '—'),
          h('dt', null, 'Equipment'), h('dd', null, (mv.equipment || []).map((e) => labelOf(EQUIPMENT, e)).join(', ') || (mv.apparatus === 'mat' ? 'Mat' : 'Reformer')),
          mv.labels?.length ? [h('dt', null, 'Labels'), h('dd', null, mv.labels.join(', '))] : null)),
      mv.apparatus === 'reformer' ? h('div', { class: 'card' },
        h('h2', null, 'Springs & set-up'),
        h('dl', { class: 'kv', style: { marginBottom: '10px' } },
          h('dt', null, 'Usual'), h('dd', null, springDots(mv.load?.springs || [], room)),
          mv.load?.advance?.length ? [h('dt', null, 'To progress'), h('dd', null, springDots(mv.load.advance, room), mv.load.lighterIsHarder ? h('span', { class: 'tiny muted' }, ' lighter is harder here') : null)] : mv.load?.lighterIsHarder ? [h('dt', null, 'To progress'), h('dd', null, 'Go lighter: less spring means more work here')] : null,
          variationsOf(mv).filter((v) => v.springs && v.springs.length).map((v) => [h('dt', null, v.name), h('dd', null, springDots(v.springs, room))]),
          mv.setup?.headrest && mv.setup.headrest !== 'any' ? [h('dt', null, 'Headrest'), h('dd', null, labelOf(HEADREST, mv.setup.headrest))] : null,
          mv.setup?.straps && mv.setup.straps !== 'none' ? [h('dt', null, 'Straps'), h('dd', null, labelOf(STRAPS, mv.setup.straps))] : null,
          (mv.equipment || []).length ? [h('dt', null, 'Box / board'), h('dd', null, mv.equipment.map((e) => labelOf(EQUIPMENT, e)).join(', '))] : null),
        mv.load?.note ? h('p', { class: 'small', style: { margin: '0 0 10px' } }, mv.load.note) : null,
        h('p', { class: 'tiny muted', style: { margin: 0 } }, `Shown for ${room.name || 'your reformers'} (${BRANDS[room.brand]?.label || 'custom springs'}). Change the springs your reformers have in Studio. * marks a setting adjusted to the springs you have.`)) : null,
      h('div', { class: 'card' },
        h('h2', null, 'Muscles'),
        h('div', { style: { display: 'flex', gap: '14px', flexWrap: 'wrap', alignItems: 'flex-start' } },
          bodyMap(levels, { size: 84 }),
          h('dl', { class: 'kv', style: { flex: '1 1 160px', gridTemplateColumns: '90px minmax(0,1fr)' } },
            h('dt', null, 'Primary'), h('dd', null, mv.muscles.primary.map(muscleLabel).join(', ')),
            h('dt', null, 'Secondary'), h('dd', null, mv.muscles.secondary.map(muscleLabel).join(', ') || '—'))), bodyLegend()),
      h('div', { class: 'card' }, h('h2', null, 'What it does'), PURPOSES.map((p) => bar(p.label, Math.round(((mv.purpose?.[p.id] || 0) / 3) * 100), p.color, ['None', 'Low', 'Medium', 'High'][mv.purpose?.[p.id] || 0]))),
      mv.steps?.length || mv.stable || mv.mobile ? h('div', { class: 'card stack-sm' }, h('h2', null, 'How to do it'),
        mv.steps?.length ? h('ol', { class: 'steps-list' }, mv.steps.map((s) => h('li', null, s))) : null,
        mv.stable || mv.mobile ? h('dl', { class: 'stable-mobile', style: { marginTop: '10px' } },
          mv.stable ? [h('dt', null, 'Stays still'), h('dd', null, mv.stable)] : null,
          mv.mobile ? [h('dt', null, 'Moves'), h('dd', null, mv.mobile)] : null) : null) : null,
      mv.layers?.length || variationsOf(mv).length || mv.prep?.length || leadsTo.length ? h('div', { class: 'card stack-sm' }, h('h2', null, 'Layers & variations'),
        mv.layers?.length ? [h('h3', null, 'Layers'), h('ol', { class: 'layer-list' }, mv.layers.map((l) => h('li', null, h('div', null, h('b', null, l.title), l.text ? h('span', { class: 'muted' }, ` ${l.text}`) : null)))), h('p', { class: 'tiny muted' }, 'Easiest first. In a flow, each is one press away when you plan a block.')] : null,
        variationsOf(mv).length ? [h('h3', { style: { marginTop: '10px' } }, 'Variations'), variationList(mv, room)] : null,
        (mv.prep || []).filter((p) => store.movements[p]).length ? h('p', { class: 'small', style: { marginTop: '8px' } }, h('b', null, 'Build up to it with: '),
          mv.prep.filter((p) => store.movements[p]).map((p, i) => [i ? ', ' : '', h('a', { href: `#/movements/${p}` }, store.movements[p].name)])) : null,
        leadsTo.length ? h('p', { class: 'small', style: { marginTop: '6px' } }, h('b', null, 'Leads on to: '), leadsTo.map((m, i) => [i ? ', ' : '', h('a', { href: `#/movements/${m.slug}` }, m.name)])) : null) : null,
      h('div', { class: 'card stack-sm' }, h('h2', null, 'Cautions & swaps'),
        mv.cautions?.length ? mv.cautions.map((c) => h('div', { class: 'caution' }, h('b', null, labelOf(CAUTIONS, c.tag)), ' ', h('span', { class: ['tag', c.severity === 'modify' ? '' : 'tag-warn'] }, c.severity === 'modify' ? 'Adjust' : 'Avoid'), h('div', { class: 'tiny' }, c.note),
          c.swap && store.movements[c.swap] ? h('div', { class: 'tiny', style: { marginTop: '4px' } }, 'Swap: ', h('a', { href: `#/movements/${c.swap}` }, store.movements[c.swap].name)) : null)) : h('p', { class: 'muted small' }, 'None listed.')),
      h('div', { class: 'card stack-sm' }, h('h2', null, 'Cues & notes'),
        mv.cues ? h('ul', { class: 'cue-list' }, mv.cues.split('\n').filter(Boolean).map((c) => h('li', null, c))) : h('p', { class: 'muted small' }, 'No shared cues yet.'),
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
    levelTo: 'beginner', equipment: [], load: { springs: ['medium'] }, setup: { headrest: 'any', straps: 'none' }, section: 'core', role: 'both', stable: '', mobile: '', categories: [], pregnancy: 'ok', perSide: false, steps: [], aka: [], variations: [], prep: [], purpose: { strength: 1, stability: 1, flexibility: 0, mobility: 0 }, multiJoint: true, intensity: 4, duration: 120, reps: '', summary: '', layers: [], cautions: [], cues: '', labels: [], review: { status: 'draft', note: '' }
  };
  mv.load = mv.load || { springs: [] };
  mv.load.advance = mv.load.advance || [];
  mv.setup = mv.setup || { headrest: 'any', straps: 'none' };
  mv.section = mv.section || sectionOf(mv);
  mv.role = mv.role || roleOf(mv);
  mv.categories = mv.categories && mv.categories.length ? mv.categories : (existing ? categoriesOf(mv) : []);
  mv.pregnancy = mv.pregnancy || 'ok';
  mv.levelTo = mv.levelTo || mv.level;
  for (const k of ['steps', 'aka', 'variations', 'prep']) mv[k] = mv[k] || [];
  const linesArea = (key, rows, placeholder) => h('textarea', { rows, placeholder, oninput: (e) => { mv[key] = e.target.value.split('\n').map((x) => x.trim()).filter(Boolean); } }, (mv[key] || []).join('\n'));
  const err = h('p', { class: 'error', role: 'alert' });
  const wrap = h('div', { class: 'stack' });
  const room = () => store.roomFor({ apparatus: mv.apparatus });

  const input = (key, attrs = {}) => h('input', { type: 'text', value: mv[key] ?? '', oninput: (e) => { mv[key] = attrs.type === 'number' ? Number(e.target.value) : e.target.value; }, ...attrs });
  const area = (key, rows = 3) => h('textarea', { rows, oninput: (e) => { mv[key] = e.target.value; } }, mv[key] || '');

  const draw = () => {
    const springsEl = h('div', { class: 'btn-row' }, springDots(mv.load.springs, room()),
      LOAD_LEVELS.filter((l) => !springFor(room().brand, l, room().springOverrides).approx).map((l) => { const sp = springFor(room().brand, l, room().springOverrides); return btn(`+ ${sp.name}`, () => { if (mv.load.springs.length < 5) { mv.load.springs.push(l); draw(); } }, { small: true, title: l }); }),
      btn('Clear', () => { mv.load.springs = []; draw(); }, { small: true, kind: 'ghost' }));
    const advanceEl = h('div', { class: 'btn-row' }, mv.load.advance.length ? springDots(mv.load.advance, room()) : h('span', { class: 'tiny muted' }, 'None set'),
      LOAD_LEVELS.filter((l) => !springFor(room().brand, l, room().springOverrides).approx).map((l) => { const sp = springFor(room().brand, l, room().springOverrides); return btn(`+ ${sp.name}`, () => { if (mv.load.advance.length < 5) { mv.load.advance.push(l); draw(); } }, { small: true, title: l }); }),
      btn('Clear', () => { mv.load.advance = []; draw(); }, { small: true, kind: 'ghost' }));
    fill(wrap, 
      h('div', { class: 'card stack' }, h('h2', null, 'Basics'),
        field('Name', input('name', { required: true }), 'The name most teachers use.'),
        field('Also called', h('input', { type: 'text', value: (mv.aka || []).join(', '), placeholder: 'Classical name, nickname…', oninput: (e) => { mv.aka = e.target.value.split(',').map((x) => x.trim()).filter(Boolean); } }), 'Other names, comma separated. Search finds all of them.'),
        h('div', { class: 'grid-3' },
          field('Apparatus', select([{ id: 'reformer', label: 'Reformer' }, { id: 'mat', label: 'Mat' }], mv.apparatus, (v) => { mv.apparatus = v; draw(); })),
          field('Difficulty, from', select(LEVELS, mv.level, (v) => { mv.level = v; if (LEVELS.findIndex((l) => l.id === mv.levelTo) < LEVELS.findIndex((l) => l.id === v)) mv.levelTo = v; draw(); }), 'Who the basic version suits.'),
          field('Difficulty, up to', select(LEVELS.filter((l) => l.rank >= LEVELS.find((x) => x.id === mv.level).rank), mv.levelTo, (v) => { mv.levelTo = v; draw(); }), 'How far layers and springs can take it.')),
        h('p', { class: 'hint', style: { marginTop: '-6px' } }, `In your studio's levels this shows as "${levelLabel(mv)}" and is offered to: ${levelsOf(mv).map((id) => classLevel(id).label).join(', ') || 'no class level'}.`),
        field('Where it belongs in a class', chips(USES.map((u) => ({ id: u.id, label: u.label, title: u.hint })), usesOf(mv), (v) => { mv.uses = USES.map((u) => u.id).filter((u) => v.includes(u)); }),
          'Drafts only put a movement in a warm-up or cool-down if it is marked for one, and keep peak movements for the hardest part of the class. Leave all three off for ordinary working movements.'),
        h('div', { class: 'grid-3' },
          field('Starting position', select(POSITIONS, mv.position, (v) => { mv.position = v; draw(); })),
          field('Part of the class', select(SECTIONS, mv.section, (v) => { mv.section = v; })),
          field('Stability or mobility', select(ROLES, mv.role, (v) => { mv.role = v; }))),
        field('Pregnancy', select(PREGNANCY, mv.pregnancy, (v) => { mv.pregnancy = v; }, { style: { maxWidth: '320px' } }), 'Also add a matching caution below so clients are flagged.'),
        h('label', { class: 'small', style: { display: 'flex', gap: '8px', alignItems: 'center' } }, h('input', { type: 'checkbox', checked: mv.perSide, onchange: (e) => { mv.perSide = e.target.checked; } }), 'Done one side at a time'),
        field('Short description', area('summary', 3), 'In your own words. Don\'t copy text from books or other apps.'),
        h('div', { class: 'field' }, h('label', null, 'Picture'),
          h('div', { class: 'pose-pick', role: 'group', 'aria-label': 'Picture' }, POSE_IDS.filter((id) => POSES[id].ctx === (mv.apparatus === 'mat' ? 'mat' : 'reformer')).map((id) =>
            h('button', { type: 'button', class: poseOf(mv) === id ? 'on' : null, title: POSES[id].label, 'aria-label': POSES[id].label, 'aria-pressed': poseOf(mv) === id ? 'true' : 'false', onclick: (e) => { mv.pose = id; const b = e.currentTarget; [...b.parentElement.children].forEach((x) => { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); }); b.parentElement.nextElementSibling.textContent = `Showing: ${POSES[id].label}.`; } }, figure(id, { width: 96 })))),
          h('div', { class: 'hint' }, `Showing: ${POSES[poseOf(mv)].label}. Pick the drawing closest to the starting position.`)),
        h('div', { class: 'grid-3' },
          field('Typical reps', input('reps', { placeholder: 'e.g. 8 each side' })),
          field('Typical time (seconds)', input('duration', { type: 'number', min: 15, max: 1800 })),
          field('Effort (1–10)', input('intensity', { type: 'number', min: 1, max: 10 })))),
      mv.apparatus === 'reformer' ? h('div', { class: 'card stack' }, h('h2', null, 'Springs & set-up'),
        field('Usual springs', springsEl),
        field('To progress', advanceEl, 'The harder setting. The class plan treats either setting as fine, which is what keeps spring changes down.'),
        h('label', { class: 'small', style: { display: 'flex', gap: '8px', alignItems: 'center' } }, h('input', { type: 'checkbox', checked: !!mv.load.lighterIsHarder, onchange: (e) => { mv.load.lighterIsHarder = e.target.checked; } }), 'Lighter springs make this harder'),
        h('label', { class: 'small', style: { display: 'flex', gap: '8px', alignItems: 'center' } }, h('input', { type: 'checkbox', checked: !!mv.load.flexible, onchange: (e) => { mv.load.flexible = e.target.checked; } }), 'Any light setting works (most stretches)'),
        h('div', { class: 'grid-3' },
          field('Headrest', select(HEADREST, mv.setup.headrest, (v) => { mv.setup.headrest = v; })),
          field('Straps', select(STRAPS, mv.setup.straps, (v) => { mv.setup.straps = v; })),
          field('Spring note', h('input', { type: 'text', value: mv.load.note || '', oninput: (e) => { mv.load.note = e.target.value; } }))),
        h('p', { class: 'hint' }, `Shown in ${BRANDS[room().brand]?.label || 'your'} colours.`)) : null,
      h('div', { class: 'card stack' }, h('h2', null, 'How to do it'),
        field('Set-up and movement, one step per line', linesArea('steps', 5, 'Start position\nBreathe out to…\nBreathe in to…'), 'In your own words. Include the breath.'),
        h('div', { class: 'grid-2' },
          field('What stays still', input('stable', { placeholder: 'e.g. Pelvis and spine' })),
          field('What moves', input('mobile', { placeholder: 'e.g. Hips and knees' }))),
        field('Build up to it with', h('div', { class: 'stack-sm' },
          mv.prep.length ? h('div', { class: 'btn-row' }, mv.prep.map((s) => h('button', { type: 'button', class: 'chip chip-sm on', title: 'Take out', onclick: () => { mv.prep = mv.prep.filter((x) => x !== s); draw(); } }, `${store.movements[s]?.name || s} ×`))) : null,
          mv.prep.length < 6 ? select([{ id: '', label: 'Add a lead-in movement…' }, ...store.movementList.filter((m) => m.slug !== mv.slug && m.apparatus === mv.apparatus && !mv.prep.includes(m.slug)).map((m) => ({ id: m.slug, label: m.name }))], '', (v) => { if (v) { mv.prep = [...mv.prep, v]; draw(); } }, { 'aria-label': 'Add a lead-in movement', style: { maxWidth: '360px' } }) : null),
          'Easier movements that prepare for this one. The class check looks for one of them earlier in the plan.')),
      h('div', { class: 'card stack' }, h('h2', null, 'Movement'),
        field('Spine', chips(SPINE, mv.spine, (v) => { mv.spine = v; })),
        field('Plane', chips(PLANES, mv.plane, (v) => { mv.plane = v; draw(); }, { multi: false })),
        field('Patterns', chips(PATTERNS, mv.patterns, (v) => { mv.patterns = v; })),
        field('Movement categories', chips(CATEGORIES, mv.categories, (v) => { mv.categories = v; }, { small: true }), 'Used for the class-balance check. Leave empty to let the app work them out.'),
        h('label', { class: 'small', style: { display: 'flex', gap: '8px', alignItems: 'center' } }, h('input', { type: 'checkbox', checked: mv.multiJoint, onchange: (e) => { mv.multiJoint = e.target.checked; } }), 'Multi-joint (full-body) movement')),
      h('div', { class: 'card stack' }, h('h2', null, 'Muscles'),
        h('div', { class: 'muscle-edit' },
          h('div', { class: 'stack' },
            field('Primary: what does the work', chips(MUSCLES, mv.muscles.primary, (v) => { mv.muscles.primary = v; mv.muscles.secondary = mv.muscles.secondary.filter((x) => !v.includes(x)); draw(); }, { small: true })),
            field('Secondary: what helps or holds', chips(MUSCLES.filter((m) => !mv.muscles.primary.includes(m.id)), mv.muscles.secondary, (v) => { mv.muscles.secondary = v; draw(); }, { small: true })),
            h('p', { class: 'hint' }, 'Missing a muscle name? Add it under Studio → Lists.')),
          h('div', { class: 'muscle-map', 'aria-hidden': 'true' }, bodyMap(Object.fromEntries([...mv.muscles.primary.map((m) => [m, 3]), ...mv.muscles.secondary.map((m) => [m, 1])]), { size: 120 })))),
      h('div', { class: 'card stack' }, h('h2', null, 'What it does'),
        PURPOSES.map((p) => field(p.label, chips([0, 1, 2, 3].map((n) => ({ id: n, label: ['None', 'Low', 'Medium', 'High'][n] })), mv.purpose[p.id] || 0, (v) => { mv.purpose[p.id] = v; draw(); }, { multi: false, small: true })))),
      h('div', { class: 'card stack' }, h('h2', null, 'Equipment needed'),
        chips(EQUIPMENT, mv.equipment, (v) => { mv.equipment = v; }, { small: true })),
      h('div', { class: 'card stack' }, h('div', { class: 'card-head', style: { margin: 0 } }, h('h2', null, 'Layers'), h('div', { class: 'spacer' }), btn('Add layer', () => { let n = mv.layers.length + 1; while (mv.layers.some((x) => x.tag === `L${n}`)) n++; mv.layers.push({ tag: `L${n}`, title: '', text: '' }); draw(); }, { small: true, iconName: 'plus' })),
        h('p', { class: 'hint' }, 'What can be built on top of the basic movement, easiest first. In a flow these are offered one press away when you plan a block.'),
        mv.layers.map((l, i) => h('div', { class: 'layer-edit' },
          h('span', { class: 'be-n' }, String(i + 1)),
          h('input', { type: 'text', value: l.title, placeholder: 'The layer, e.g. Add arm circles', 'aria-label': 'Layer title', oninput: (e) => { l.title = e.target.value; } }),
          h('input', { type: 'text', value: l.text, placeholder: 'What changes or what to watch (optional)', 'aria-label': 'Layer description', oninput: (e) => { l.text = e.target.value; } }),
          h('span', { class: 'tools' },
            btn('', () => { if (i > 0) { [mv.layers[i - 1], mv.layers[i]] = [mv.layers[i], mv.layers[i - 1]]; draw(); } }, { iconName: 'up', small: true, kind: 'ghost', title: 'Earlier' }),
            btn('', () => { if (i < mv.layers.length - 1) { [mv.layers[i + 1], mv.layers[i]] = [mv.layers[i], mv.layers[i + 1]]; draw(); } }, { iconName: 'down', small: true, kind: 'ghost', title: 'Later' }),
            btn('', () => { mv.layers.splice(i, 1); draw(); }, { iconName: 'close', small: true, kind: 'ghost', title: 'Remove layer' }))))),
      h('div', { class: 'card stack' }, h('div', { class: 'card-head', style: { margin: 0 } }, h('h2', null, 'Variations'), h('div', { class: 'spacer' }), btn('Add variation', () => { mv.variations.push({ name: '', kind: 'variation' }); draw(); }, { small: true, iconName: 'plus' })),
        h('p', { class: 'hint' }, 'Other versions of this movement. A regression is simpler, a progression is harder, and a variation is just different (single arm, another foot position).'),
        mv.variations.map((v, i) => h('div', { class: 'var-edit' },
          select(OPTION_KINDS.map((k) => ({ id: k.id, label: `${k.mark} ${k.label}` })), v.kind, (x) => { v.kind = x; }, { 'aria-label': 'Kind of variation' }),
          h('input', { type: 'text', value: v.name, placeholder: 'Name, e.g. Single arm', 'aria-label': 'Variation name', oninput: (e) => { v.name = e.target.value; } }),
          h('input', { type: 'text', value: v.note || '', placeholder: 'What changes (optional)', 'aria-label': 'Variation note', oninput: (e) => { v.note = e.target.value; } }),
          btn('', () => { mv.variations.splice(i, 1); draw(); }, { iconName: 'close', small: true, kind: 'ghost', title: 'Remove variation' }),
          mv.apparatus === 'reformer' ? h('div', { class: 'btn-row', style: { gridColumn: '1 / -1' } }, h('span', { class: 'tiny muted' }, 'Own springs:'), (v.springs || []).length ? springDots(v.springs, room()) : h('span', { class: 'tiny muted' }, 'same as usual'),
            LOAD_LEVELS.filter((l) => !springFor(room().brand, l, room().springOverrides).approx).map((l) => btn(`+ ${springFor(room().brand, l, room().springOverrides).name}`, () => { v.springs = [...(v.springs || []), l].slice(0, 5); draw(); }, { small: true })),
            (v.springs || []).length ? btn('Clear', () => { delete v.springs; draw(); }, { small: true, kind: 'ghost' }) : null) : null))),
      h('div', { class: 'card stack' }, h('div', { class: 'card-head', style: { margin: 0 } }, h('h2', null, 'Cautions & swaps'), h('div', { class: 'spacer' }), btn('Add caution', () => { mv.cautions.push({ tag: 'knee', severity: 'avoid', note: '' }); draw(); }, { small: true, iconName: 'plus' })),
        h('p', { class: 'hint' }, 'Clients tagged with the same caution are flagged when this movement is in their class.'),
        mv.cautions.map((c, i) => h('div', { class: 'grid-3', style: { gridTemplateColumns: 'minmax(0,1fr) minmax(0,.8fr) minmax(0,2fr) minmax(0,1fr) 40px' } },
          select(CAUTIONS, c.tag, (v) => { c.tag = v; }, { 'aria-label': 'Caution' }),
          select(SEVERITIES, c.severity || 'avoid', (v) => { c.severity = v; }, { 'aria-label': 'How strongly' }),
          h('input', { type: 'text', value: c.note, placeholder: 'What to watch for', 'aria-label': 'Caution note', oninput: (e) => { c.note = e.target.value; } }),
          select([{ id: '', label: 'No swap' }, ...store.movementList.filter((m) => m.slug !== mv.slug && m.apparatus === mv.apparatus).map((m) => ({ id: m.slug, label: m.name }))], c.swap || '', (v) => { c.swap = v || undefined; }, { 'aria-label': 'Swap to' }),
          btn('', () => { mv.cautions.splice(i, 1); draw(); }, { iconName: 'close', small: true, kind: 'ghost', title: 'Remove caution' })))),
      h('div', { class: 'card stack' }, h('h2', null, 'Cues & labels'),
        field('Teaching cues, one per line', area('cues', 5), 'Everyone in the studio sees these in the builder and Play mode.'),
        field('Labels', h('input', { type: 'text', value: (mv.labels || []).join(', '), oninput: (e) => { mv.labels = e.target.value.split(',').map((x) => x.trim()).filter(Boolean); } }), 'Comma separated, e.g. warm-up, pregnancy-friendly'),
        store.isAdmin ? h('div', { class: 'grid-3' },
          field('Review status', select([{ id: 'draft', label: 'Draft' }, { id: 'reviewed', label: 'Reviewed' }], mv.review?.status || 'draft', (v) => { mv.review = { ...(mv.review || {}), status: v }; })),
          field('Reviewed by', h('input', { type: 'text', value: mv.review?.by || '', oninput: (e) => { mv.review = { ...(mv.review || {}), by: e.target.value }; } })),
          field('Date', h('input', { type: 'text', value: mv.review?.date || '', placeholder: 'YYYY-MM-DD', oninput: (e) => { mv.review = { ...(mv.review || {}), date: e.target.value }; } }))) : null),
      h('div', { class: 'save-bar' }, err, h('div', { class: 'btn-row' }, btn(existing ? 'Save movement' : 'Create movement', save, { kind: 'primary', iconName: 'check' }), h('a', { class: 'btn btn-ghost', href: existing ? `#/movements/${slug}` : '#/explore' }, 'Cancel'))));
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
    h('div', { class: 'page-head' }, h('div', { class: 'grow' }, h('a', { href: existing ? `#/movements/${slug}` : backLink().href, class: 'small' }, '← Back'), h('h1', null, existing ? `Edit ${existing.name}` : 'New movement'),
      existing?.source === 'library' ? h('p', { class: 'small muted' }, 'Saving makes a studio copy. You can reset it to the library version later.') : null)),
    h('div', { style: { maxWidth: '900px' } }, wrap)] };
}
