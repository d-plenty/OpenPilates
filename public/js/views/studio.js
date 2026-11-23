import { h, icon, btn, toast, field, select, chips, modal, confirmDialog, empty, fmtDate, fill, debounce } from '../ui.js';
import { api, store, viewState } from '../store.js';
import { BRANDS, LOAD_LEVELS, CAUTIONS, BUILTIN, studioList, applyStudioLists, springFor, labelOf, DEFAULT_TARGETS, LEVEL_PRESETS, DEFAULT_CLASS_TYPES, DEFAULT_LENGTHS, DEFAULT_TIMING, SEGMENT_ROLES, SECTIONS, POSITIONS } from '/shared/vocab.js';

const ROLE_COLOR = { warmup: '#7FB8AD', build: '#4E9C8F', peak: '#0F6E62', cooldown: '#A9C7BF' };

export async function studioView() {
  const s = structuredClone(await store.loadStudio(true));
  const admin = store.isAdmin;
  const dis = !admin;
  const vs = viewState('studio', { tab: 'rooms', openType: '' });
  const wrap = h('div');
  const status = h('span', { class: 'tiny muted', 'aria-live': 'polite' }, admin ? 'Changes save as you make them' : 'Only admins can change studio settings');

  for (const k of ['customProps', 'removedProps', 'customCautions', 'removedCautions', 'customMuscles', 'removedMuscles']) s[k] = s[k] || [];
  s.sectionLabels = s.sectionLabels || {};
  s.levels = s.levels && s.levels.length ? s.levels : LEVEL_PRESETS.three.levels.map((x) => ({ ...x }));
  s.classTypes = s.classTypes && s.classTypes.length ? s.classTypes : structuredClone(DEFAULT_CLASS_TYPES);
  s.lengths = s.lengths && s.lengths.length ? s.lengths : [...DEFAULT_LENGTHS];
  s.defaultLength = s.defaultLength || 50;
  s.timing = { ...DEFAULT_TIMING, ...(s.timing || {}) };

  // Studio settings save themselves a moment after each change, like flows do.
  const save = debounce(async () => {
    try {
      store.studio = await api('PUT', '/studio', s);
      applyStudioLists(store.studio);
      store.state.studioName = store.studio.name;
      status.textContent = 'Saved';
    } catch (e) { status.textContent = 'Not saved'; toast(e.message, { kind: 'error' }); }
  }, 700);
  const touch = () => { if (!admin) return; status.textContent = 'Saving…'; save(); };
  const redo = () => { touch(); draw(); };
  wrap.addEventListener('input', touch);
  wrap.addEventListener('change', touch);

  const makeId = (prefix, label, taken) => {
    const base = prefix + label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 36);
    let id = base || prefix + 'item';
    for (let i = 2; taken.includes(id); i++) id = `${base}_${i}`;
    return id;
  };

  // A list the studio owns: the built-in entries it hasn't removed, plus its own.
  const listCard = ({ title, hint, builtin, customKey, removedKey, prefix, addLabel, placeholder, counts }) => {
    const items = studioList(builtin, s[customKey], s[removedKey]);
    const gone = builtin.filter((x) => s[removedKey].includes(x.id));
    const input = h('input', { type: 'text', placeholder, 'aria-label': addLabel, style: { maxWidth: '280px' }, onkeydown: (e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } } });
    const add = () => {
      const label = input.value.trim();
      if (!label) return;
      if (items.some((x) => x.label.toLowerCase() === label.toLowerCase())) { toast(`${label} is already in the list.`); return; }
      const id = makeId(prefix, label, [...builtin, ...s[customKey]].map((x) => x.id));
      s[customKey].push({ id, label });
      if (counts) s.props[id] = 1;
      redo();
    };
    const remove = (x) => {
      if (x.custom) s[customKey] = s[customKey].filter((c) => c.id !== x.id); else s[removedKey].push(x.id);
      if (counts) delete s.props[x.id];
      redo();
    };
    return h('section', { class: 'card stack' },
      h('h2', null, title),
      h('p', { class: 'hint' }, hint),
      h('div', { class: 'own-list' }, items.map((e) => h('div', { class: ['own-item', counts && s.props[e.id] > 0 && 'has'] },
        e.custom && admin
          ? h('input', { type: 'text', class: 'own-name-input', value: e.label, 'aria-label': `Name of ${e.label}`, onchange: (ev) => { const c = s[customKey].find((x) => x.id === e.id); if (c && ev.target.value.trim()) c.label = ev.target.value.trim(); } })
          : h('span', { class: 'own-name' }, e.label),
        e.custom ? h('span', { class: 'tag tag-accent' }, 'Yours') : null,
        counts ? h('input', { type: 'number', min: 0, max: 200, value: s.props[e.id] || 0, disabled: dis, 'aria-label': `${e.label} quantity`, oninput: (ev) => { s.props[e.id] = Number(ev.target.value); ev.target.closest('.own-item').classList.toggle('has', s.props[e.id] > 0); } }) : null,
        admin ? btn('', () => remove(e), { iconName: 'close', small: true, kind: 'ghost', title: `Remove ${e.label}` }) : null))),
      admin ? h('div', { class: 'btn-row' }, input, btn(addLabel, add, { small: true, iconName: 'plus' })) : null,
      gone.length ? h('div', { class: 'small muted' }, 'Removed: ', gone.map((x) => h('button', { type: 'button', class: 'chip chip-sm', disabled: dis, title: `Put ${x.label} back`, onclick: () => { s[removedKey] = s[removedKey].filter((id) => id !== x.id); redo(); } }, `+ ${x.label}`))) : null);
  };

  // ---------- rooms & springs
  const roomCard = (r, i) => {
    const brand = BRANDS[r.brand] || BRANDS.balanced_body;
    return h('div', { class: 'box stack-sm' },
      h('div', { class: 'grid-2' },
        field('Room name', h('input', { type: 'text', value: r.name, disabled: dis, oninput: (e) => { r.name = e.target.value; } })),
        field('Used for', select([{ id: 'reformer', label: 'Reformer' }, { id: 'mat', label: 'Mat' }], r.apparatus, (v) => { r.apparatus = v; redo(); }, { disabled: dis }))),
      h('div', { class: 'grid-2' },
        r.apparatus === 'reformer' ? field('Reformer brand', select(Object.entries(BRANDS).map(([id, b]) => ({ id, label: b.label })), r.brand, (v) => { r.brand = v; r.springs = { ...BRANDS[v].standard }; redo(); }, { disabled: dis })) : h('div'),
        field(r.apparatus === 'reformer' ? 'Number of reformers' : 'Number of mats', h('input', { type: 'number', min: 0, max: 100, value: r.count, disabled: dis, oninput: (e) => { r.count = Number(e.target.value); } }))),
      r.apparatus === 'reformer' ? h('div', null,
        h('div', { class: 'label' }, 'Springs on each reformer'),
        h('div', { class: 'btn-row' }, LOAD_LEVELS.filter((l) => brand.springs[l] || r.springOverrides?.[l]).map((l) => {
          const sp = springFor(r.brand, l, r.springOverrides);
          return h('label', { class: 'spring-count' },
            h('span', { class: 'dot', style: { background: sp.color } }),
            h('input', { type: 'number', min: 0, max: 10, value: r.springs[l] || 0, disabled: dis, 'aria-label': `${sp.name} springs`, oninput: (e) => { r.springs[l] = Number(e.target.value); } }),
            `${sp.name} · ${l.replace('x', 'extra ')}`);
        })),
        h('p', { class: 'hint', style: { marginTop: '6px' } }, 'Every spring setting in the app is shown in these springs, and only springs you have are offered. Movements store a load (light, medium, heavy), so the same library works on any brand.'),
        admin ? h('details', { style: { marginTop: '6px' } }, h('summary', { class: 'small', style: { cursor: 'pointer' } }, 'Use your own spring names and colours'),
          h('div', { class: 'stack-sm', style: { marginTop: '8px' } }, LOAD_LEVELS.map((l) => {
            const o = r.springOverrides[l] || {};
            const base = springFor(r.brand, l);
            return h('div', { class: 'grid-3', style: { gridTemplateColumns: '90px minmax(0,1fr) 70px' } },
              h('span', { class: 'small', style: { alignSelf: 'center' } }, l.replace('x', 'extra ')),
              h('input', { type: 'text', placeholder: base.name, value: o.name || '', 'aria-label': `Name for ${l}`, oninput: (e) => { r.springOverrides[l] = { ...(r.springOverrides[l] || {}), name: e.target.value, short: (e.target.value[0] || '').toUpperCase(), color: r.springOverrides[l]?.color || base.color }; if (!e.target.value) delete r.springOverrides[l]; } }),
              h('input', { type: 'color', value: o.color || base.color, 'aria-label': `Colour for ${l}`, style: { height: '40px', width: '70px', padding: '2px' }, oninput: (e) => { r.springOverrides[l] = { name: r.springOverrides[l]?.name || base.name, short: r.springOverrides[l]?.short || base.short, color: e.target.value }; } }));
          }))) : null) : null,
      admin && s.rooms.length > 1 ? h('div', null, btn('Remove room', () => { s.rooms.splice(i, 1); redo(); }, { small: true, kind: 'ghost', iconName: 'trash' })) : null);
  };
  const roomsTab = () => [
    h('section', { class: 'card stack' },
      h('div', { class: 'card-head' }, h('h2', null, 'Studio & rooms'), h('div', { class: 'spacer' }),
        admin ? btn('Add room', () => { s.rooms.push({ id: 'room' + Date.now().toString(36), name: 'New room', apparatus: 'reformer', brand: s.rooms[0]?.brand || 'balanced_body', count: 0, springs: { ...BRANDS[s.rooms[0]?.brand || 'balanced_body'].standard }, springOverrides: {} }); redo(); }, { small: true, iconName: 'plus' }) : null),
      field('Studio name', h('input', { type: 'text', value: s.name, disabled: dis, style: { maxWidth: '420px' }, oninput: (e) => { s.name = e.target.value; } })),
      h('div', { class: 'auto-grid' }, s.rooms.map(roomCard)))];

  // ---------- classes: levels, lengths, class types, timing, targets
  const SPANS = [[1, 1, 'Beginner'], [1, 2, 'Beginner + intermediate'], [2, 2, 'Intermediate'], [2, 3, 'Intermediate + advanced'], [3, 3, 'Advanced'], [1, 3, 'All of it']];
  const scheme = () => Object.entries(LEVEL_PRESETS).find(([, p]) => JSON.stringify(p.levels.map((l) => [l.label, l.from, l.to])) === JSON.stringify(s.levels.map((l) => [l.label, l.from, l.to])))?.[0] || 'own';
  const levelsCard = () => h('section', { class: 'card stack' },
    h('h2', null, 'Class levels'),
    h('p', { class: 'hint' }, 'The levels your timetable uses. Pick a set or write your own names. Each level covers a span of difficulty, and that span decides which movements a class at that level is offered.'),
    chips([...Object.entries(LEVEL_PRESETS).map(([id, p]) => ({ id, label: p.levels.map((l) => l.label).join(' · ') })), ...(scheme() === 'own' ? [{ id: 'own', label: 'Our own' }] : [])], scheme(),
      (v) => { if (v !== 'own' && LEVEL_PRESETS[v]) { s.levels = LEVEL_PRESETS[v].levels.map((x) => ({ ...x })); redo(); } }, { multi: false, small: true }),
    h('div', { class: 'st-row st-head' }, h('span', null, 'Called'), h('span', null, 'Offered movements of difficulty'), h('span')),
    h('div', { class: 'stack-sm' }, s.levels.map((l, i) => h('div', { class: 'st-row' },
      h('input', { type: 'text', value: l.label, disabled: dis, 'aria-label': 'Level name', oninput: (e) => { l.label = e.target.value; } }),
      select(SPANS.map(([f, t, label]) => ({ id: `${f}-${t}`, label })), `${l.from}-${l.to}`, (v) => { [l.from, l.to] = v.split('-').map(Number); redo(); }, { disabled: dis, 'aria-label': `What ${l.label} covers` }),
      admin && s.levels.length > 1 ? btn('', () => { s.levels.splice(i, 1); redo(); }, { iconName: 'close', small: true, kind: 'ghost', title: `Remove ${l.label}` }) : h('span')))),
    admin && s.levels.length < 8 ? h('div', null, btn('Add a level', () => { s.levels.push({ id: makeId('', 'level', s.levels.map((x) => x.id)), label: 'New level', from: 1, to: 3 }); redo(); }, { small: true, iconName: 'plus' })) : null);

  const lengthsCard = () => {
    const input = h('input', { type: 'number', min: 10, max: 180, placeholder: 'e.g. 40', 'aria-label': 'Class length in minutes', style: { width: '110px' }, onkeydown: (e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } } });
    const add = () => { const n = Math.round(Number(input.value)); if (n >= 10 && n <= 180 && !s.lengths.includes(n)) { s.lengths = [...s.lengths, n].sort((a, b) => a - b); redo(); } };
    return h('section', { class: 'card stack' },
      h('h2', null, 'Class lengths'),
      h('p', { class: 'hint' }, 'The lengths you run. Each class type has its own usual length; a new class type starts on the one marked usual here.'),
      h('div', { class: 'btn-row' }, s.lengths.map((n) => h('span', { class: ['len-chip', n === s.defaultLength && 'on'] },
        h('button', { type: 'button', class: 'len-pick', disabled: dis, title: 'Make this the usual length', 'aria-pressed': n === s.defaultLength ? 'true' : 'false', onclick: () => { s.defaultLength = n; redo(); } }, `${n} min${n === s.defaultLength ? ' · usual' : ''}`),
        admin && s.lengths.length > 1 ? h('button', { type: 'button', class: 'len-x', 'aria-label': `Remove ${n} minutes`, onclick: () => { s.lengths = s.lengths.filter((x) => x !== n); if (s.defaultLength === n) s.defaultLength = s.lengths[0]; redo(); } }, '×') : null))),
      admin ? h('div', { class: 'btn-row' }, input, btn('Add a length', add, { small: true, iconName: 'plus' })) : null);
  };

  const phaseRow = (ct, ph, i) => h('div', { class: 'phase' },
    h('div', { class: 'phase-top' },
      h('span', { class: 'seg-dot', style: { background: ROLE_COLOR[ph.role] } }),
      h('input', { type: 'text', value: ph.name, disabled: dis, 'aria-label': 'Phase name', oninput: (e) => { ph.name = e.target.value; } }),
      select(SEGMENT_ROLES, ph.role, (v) => { ph.role = v; redo(); }, { disabled: dis, 'aria-label': 'What this phase is', style: { width: 'auto' } }),
      h('label', { class: 'mins' }, h('input', { type: 'number', min: 1, max: 60, value: ph.minutes, disabled: dis, 'aria-label': `Minutes for ${ph.name}`, oninput: (e) => { ph.minutes = Math.max(1, Number(e.target.value) || 1); const t = e.target.closest('.ct-body')?.querySelector('.ct-total'); if (t) t.textContent = totalText(ct); } }), 'min'),
      admin ? h('div', { class: 'tools' },
        btn('', () => { if (i > 0) { [ct.phases[i - 1], ct.phases[i]] = [ct.phases[i], ct.phases[i - 1]]; redo(); } }, { iconName: 'up', small: true, kind: 'ghost', title: 'Move earlier' }),
        btn('', () => { if (i < ct.phases.length - 1) { [ct.phases[i + 1], ct.phases[i]] = [ct.phases[i], ct.phases[i + 1]]; redo(); } }, { iconName: 'down', small: true, kind: 'ghost', title: 'Move later' }),
        btn('', () => { ct.phases.splice(i, 1); redo(); }, { iconName: 'close', small: true, kind: 'ghost', title: 'Remove phase' })) : null),
    h('div', { class: 'phase-line' }, h('span', { class: 'tiny muted' }, 'Drafts fill it from'),
      chips(SECTIONS.map((x) => ({ id: x.id, label: x.label })), ph.sections || [], (v) => { ph.sections = v; touch(); }, { small: true })),
    h('div', { class: 'phase-line' }, h('span', { class: 'tiny muted' }, 'Only in'),
      chips(POSITIONS.filter((x) => ct.apparatus !== 'mat' || true).map((x) => ({ id: x.id, label: x.label })), ph.positions || [], (v) => { if (v.length) ph.positions = v; else delete ph.positions; touch(); }, { small: true }),
      !(ph.positions || []).length ? h('span', { class: 'tiny muted' }, 'any position') : null));
  const totalText = (ct) => { const t = ct.phases.reduce((a, p) => a + Number(p.minutes || 0), 0); return `Phases add up to ${t} min${t !== ct.lengthMin ? `. For a ${ct.lengthMin} min class each phase is scaled to fit.` : '.'}`; };
  const typeCard = (ct, i) => {
    const open = vs.openType === ct.id;
    return h('div', { class: ['box', 'ct', open && 'open'] },
      h('button', { type: 'button', class: 'ct-head', 'aria-expanded': open ? 'true' : 'false', onclick: () => { vs.openType = open ? '' : ct.id; draw(); } },
        h('span', { class: 'ct-name' }, ct.name),
        h('span', { class: 'tag tag-accent' }, ct.apparatus === 'mat' ? 'Mat' : 'Reformer'),
        h('span', { class: 'tiny muted' }, `${ct.lengthMin} min · ${ct.phases.length} phases${ct.apparatus === 'mat' ? '' : ` · up to ${ct.springBudget} spring changes`}`),
        h('span', { class: 'spacer' }), icon(open ? 'up' : 'down', 16)),
      h('div', { class: 'mini-bar' }, ct.phases.map((p) => h('div', { title: `${p.name} · ${p.minutes} min`, style: { flex: `${p.minutes} 1 0`, background: ROLE_COLOR[p.role] } }))),
      open ? h('div', { class: 'ct-body stack' },
        h('div', { class: 'grid-2' },
          field('Name', h('input', { type: 'text', value: ct.name, disabled: dis, oninput: (e) => { ct.name = e.target.value; } })),
          field('Apparatus', select([{ id: 'reformer', label: 'Reformer' }, { id: 'mat', label: 'Mat' }], ct.apparatus, (v) => { ct.apparatus = v; redo(); }, { disabled: dis }))),
        h('div', { class: 'grid-2' },
          field('Usual length', select(s.lengths.map((n) => ({ id: String(n), label: `${n} min` })).concat(s.lengths.includes(ct.lengthMin) ? [] : [{ id: String(ct.lengthMin), label: `${ct.lengthMin} min` }]), String(ct.lengthMin), (v) => { ct.lengthMin = Number(v); redo(); }, { disabled: dis })),
          ct.apparatus !== 'mat' ? field('Spring changes, at most', h('input', { type: 'number', min: 0, max: 20, value: ct.springBudget, disabled: dis, oninput: (e) => { ct.springBudget = Number(e.target.value); } }), 'Flows over this are flagged, and drafts stay inside it.') : h('div')),
        field('What makes this class this class', h('input', { type: 'text', value: ct.note || '', disabled: dis, placeholder: 'A line for your team', oninput: (e) => { ct.note = e.target.value; } })),
        h('div', null, h('div', { class: 'label' }, 'Phases, in order'),
          h('p', { class: 'hint', style: { marginBottom: '8px' } }, 'A new flow of this type starts with these phases. Drafts give each one its minutes and fill it with a few blocks from the parts of the library you tick. Warm-up and cool-down phases only use movements marked for them.'),
          h('div', { class: 'stack-sm' }, ct.phases.map((p, pi) => phaseRow(ct, p, pi))),
          h('div', { class: 'btn-row', style: { marginTop: '10px' } },
            admin ? btn('Add a phase', () => { ct.phases.push({ name: 'New phase', role: 'build', minutes: 5, sections: [] }); redo(); }, { small: true, iconName: 'plus' }) : null,
            h('span', { class: 'tiny muted ct-total' }, totalText(ct)))),
        admin ? h('div', { class: 'btn-row' },
          btn('Duplicate', () => { const c = structuredClone(ct); c.name = `${ct.name} copy`; c.id = makeId('', c.name, s.classTypes.map((x) => x.id)); s.classTypes.splice(i + 1, 0, c); vs.openType = c.id; redo(); }, { small: true, iconName: 'copy' }),
          s.classTypes.length > 1 ? btn('Delete this class type', async () => { if (await confirmDialog(`Delete ${ct.name}?`, 'Flows already made from it keep everything they have.')) { s.classTypes.splice(i, 1); redo(); } }, { small: true, kind: 'ghost', iconName: 'trash' }) : null) : null) : null);
  };
  const typesCard = () => h('section', { class: 'card stack' },
    h('div', { class: 'card-head' }, h('h2', null, 'Class types'), h('div', { class: 'spacer' }),
      admin ? btn('New class type', () => { const c = { id: makeId('', 'class', s.classTypes.map((x) => x.id)), name: 'New class', apparatus: 'reformer', lengthMin: s.defaultLength, springBudget: 3, note: '', phases: [{ name: 'Warm-up', role: 'warmup', minutes: 6, sections: [] }, { name: 'Main', role: 'build', minutes: 34, sections: [] }, { name: 'Cool-down', role: 'cooldown', minutes: 5, sections: ['stretch'] }] }; s.classTypes.push(c); vs.openType = c.id; redo(); }, { small: true, iconName: 'plus' }) : null),
    h('p', { class: 'hint' }, 'The classes on your timetable, each with the shape it usually takes. Set them up once: every new flow starts from one, and "Draft it for me" follows its phases.'),
    h('div', { class: 'stack-sm' }, s.classTypes.map(typeCard)),
    admin ? h('div', null, btn('Put the built-in class types back', async () => { if (await confirmDialog('Put the built-in class types back?', 'Any built-in type you changed or deleted returns to how it shipped. Types you added stay.', 'Put them back', 'primary')) { const mine = s.classTypes.filter((c) => !DEFAULT_CLASS_TYPES.some((d) => d.id === c.id)); s.classTypes = [...structuredClone(DEFAULT_CLASS_TYPES), ...mine]; redo(); } }, { small: true, kind: 'ghost' })) : null);

  const TIMING_ROWS = [['perLayer', 'Each layer added to a block', 'Added to a movement\'s own time for every layer you build on top.'], ['finisher', 'A finisher', 'Pulses or a hold to end a block.'], ['springChange', 'A spring change', ''], ['positionChange', 'A change of position', 'Lying to kneeling, kneeling to standing and so on.'], ['boxChange', 'Box or board on or off', '']];
  const timingCard = () => h('section', { class: 'card stack' },
    h('h2', null, 'Timing'),
    h('p', { class: 'hint' }, 'The seconds a plan allows for the things that are not the movement itself. These are why a flow\'s total is longer than its movements added up. Typing a time on a block always wins.'),
    h('div', { class: 'stack-sm' }, TIMING_ROWS.map(([k, label, hint]) => h('label', { class: 'time-row' },
      h('span', null, label, hint ? h('span', { class: 'tiny muted', style: { display: 'block', fontWeight: 400 } }, hint) : null),
      h('input', { type: 'number', min: 0, max: 300, step: 5, value: s.timing[k], disabled: dis, 'aria-label': `${label}, seconds`, oninput: (e) => { s.timing[k] = Math.max(0, Number(e.target.value) || 0); } }), h('span', { class: 'tiny muted' }, 'sec')))));

  const targetsCard = () => h('section', { class: 'card stack' },
    h('div', { class: 'card-head' }, h('h2', null, 'Balance targets'), h('div', { class: 'spacer' }),
      admin ? btn('New target', () => { const k = 'target' + Date.now().toString(36); s.targets[k] = { label: 'New target', flexion: 50, extension: 25, rotation: 12, 'side-bend': 13 }; redo(); }, { small: true, iconName: 'plus' }) : null),
    h('p', { class: 'hint' }, 'What "balanced" means for a class: how its spine movement should be shared out. A flow is compared against the target you pick for it.'),
    h('div', { class: 'auto-grid' }, Object.entries(s.targets).map(([k, t]) => {
      const sum = () => ['flexion', 'extension', 'rotation', 'side-bend'].reduce((a, d) => a + Number(t[d] || 0), 0);
      const sumEl = h('span', { class: ['tiny', 'sum', sum() === 100 && 'ok'] }, `Adds up to ${sum()}%`);
      return h('div', { class: 'box stack-sm' },
        h('div', { class: 'btn-row' }, h('input', { type: 'text', value: t.label, disabled: dis, 'aria-label': 'Target name', style: { maxWidth: '220px', fontWeight: 600 }, oninput: (e) => { t.label = e.target.value; } }), sumEl,
          h('div', { class: 'spacer' }), admin && Object.keys(s.targets).length > 1 && !DEFAULT_TARGETS[k] ? btn('', () => { delete s.targets[k]; redo(); }, { iconName: 'trash', small: true, kind: 'ghost', title: 'Remove target' }) : null),
        ['flexion', 'extension', 'rotation', 'side-bend'].map((d) => {
          const out = h('span', { style: { textAlign: 'right' } }, `${t[d]}%`);
          return h('label', { class: 'range-row' },
            d === 'side-bend' ? 'Side bend' : d[0].toUpperCase() + d.slice(1),
            h('input', { type: 'range', min: 0, max: 80, value: t[d], disabled: dis, oninput: (e) => { t[d] = Number(e.target.value); out.textContent = `${t[d]}%`; sumEl.textContent = `Adds up to ${sum()}%`; sumEl.classList.toggle('ok', sum() === 100); } }), out);
        }));
    })));
  const classesTab = () => [typesCard(), h('div', { class: 'auto-grid' }, levelsCard(), lengthsCard(), timingCard()), targetsCard()];

  // ---------- lists
  const sectionsCard = () => h('section', { class: 'card stack' },
    h('h2', null, 'Parts of the class'),
    h('p', { class: 'hint' }, 'How the library is grouped. Call them what your studio calls them.'),
    h('div', { class: 'stack-sm' }, BUILTIN.sections.map((x) => h('div', { class: 'st-row st-row-2' },
      h('input', { type: 'text', value: s.sectionLabels[x.id] || x.label, placeholder: x.label, disabled: dis, 'aria-label': `Name for ${x.label}`, oninput: (e) => { const v = e.target.value.trim(); if (v && v !== x.label) s.sectionLabels[x.id] = v; else delete s.sectionLabels[x.id]; } }),
      s.sectionLabels[x.id] ? h('span', { class: 'tiny muted' }, `Built in as "${x.label}"`) : h('span')))));
  const listsTab = () => [
    listCard({ title: 'Props & accessories', hint: 'What you have and how many. Movements that need something you have none of are left out of drafts and flagged in a flow. Add anything your studio uses; remove what it never will.',
      builtin: BUILTIN.equipment, customKey: 'customProps', removedKey: 'removedProps', prefix: 'p_', addLabel: 'Add a prop', placeholder: 'e.g. Pilates arc, toning balls', counts: true }),
    listCard({ title: 'Client cautions', hint: 'The things you can tag a client with. Each movement lists the cautions it matters for, and a flow is checked against who is booked. Add your own, then tick them on the movements they affect.',
      builtin: BUILTIN.cautions, customKey: 'customCautions', removedKey: 'removedCautions', prefix: 'c_', addLabel: 'Add a caution', placeholder: 'e.g. Vertigo, diastasis recti' }),
    listCard({ title: 'Muscles', hint: 'The muscle names you can tick on a movement and filter by. Add your own if you teach with different names. Your own names show in lists and filters; the body picture keeps to the built-in ones.',
      builtin: BUILTIN.muscles, customKey: 'customMuscles', removedKey: 'removedMuscles', prefix: 'm_', addLabel: 'Add a muscle', placeholder: 'e.g. Pelvic floor, serratus' }),
    sectionsCard()];

  // ---------- library & data
  let withFlows = true;
  const importPack = async (file) => {
    let data;
    try { data = JSON.parse(await file.text()); } catch { toast('That file could not be read.', { kind: 'error' }); return; }
    if (data.openpilates !== 'pack') { toast('That isn\'t an OpenPilates pack file.', { kind: 'error' }); return; }
    const take = { studio: true, rooms: false, movements: true, series: true, reviews: true, flows: false };
    const row = (k, label, n, hint) => h('label', { class: 'check-row' }, h('input', { type: 'checkbox', checked: take[k], onchange: (e) => { take[k] = e.target.checked; } }), h('span', null, h('strong', null, label), n != null ? ` (${n})` : '', hint ? h('span', { class: 'tiny muted', style: { display: 'block' } }, hint) : null));
    const ok = await modal('Bring in a pack', h('div', { class: 'stack-sm' },
      h('p', { class: 'small muted' }, `From ${data.studioName || 'another studio'}, made ${fmtDate(data.exportedAt)} on OpenPilates ${data.appVersion || '?'}. Tick what to bring in. Anything with the same name here is replaced by the pack's version.`),
      row('studio', 'Class types, levels, lengths, timing, targets and lists', null, 'Also which movements are in or out of the library.'),
      row('rooms', 'Rooms and springs', (data.studio?.rooms || []).length, 'Leave off to keep your own rooms.'),
      row('movements', 'Movements they added or changed', (data.movements || []).length),
      row('series', 'Series', (data.series || []).length),
      row('reviews', 'Review marks and notes', (data.reviews || []).length),
      row('flows', 'Flows', (data.flows || []).length, 'Added as new flows under your name. No client details are ever in a pack.')),
    { actions: [{ label: 'Cancel', value: false }, { label: 'Bring in', value: true, kind: 'primary' }] });
    if (!ok) return;
    try {
      const r = await api('POST', '/pack/import', { ...data, take });
      store.reset();
      await Promise.all([store.loadStudio(true), store.loadMovements(true), store.loadSeries(true), store.loadClients(true)]);
      toast(`Brought in: ${[r.settings && 'settings', r.movements && `${r.movements} movements`, r.series && `${r.series} series`, r.reviews && `${r.reviews} review marks`, r.flows && `${r.flows} flows`].filter(Boolean).join(', ') || 'nothing'}${r.skipped ? `. ${r.skipped} skipped.` : '.'}`);
      Object.assign(s, structuredClone(store.studio));
      draw();
    } catch (e) { toast(e.message, { kind: 'error' }); }
  };
  const packInput = h('input', { type: 'file', accept: '.json,application/json', class: 'sr-only', onchange: (e) => { if (e.target.files[0]) importPack(e.target.files[0]); e.target.value = ''; } });
  const dataTab = () => {
    const changed = (store.movementList || []).concat(store.removedList || []).filter((m) => m.source !== 'library');
    const checked = Object.values(store.movements || {}).filter((m) => m.check);
    const packLink = h('a', { class: 'btn btn-primary', href: '/api/pack', download: '' }, icon('download'), 'Export a pack');
    return [
      h('section', { class: 'card stack' },
        h('h2', null, 'Your library'),
        h('p', { class: 'hint' }, 'Every movement and series can be edited, added to, removed and put back. Edits to a built-in movement are yours: they survive updates, and "Reset to library version" on a movement undoes them.'),
        h('div', { class: 'stat-row' },
          h('div', { class: 'stat' }, h('div', { class: 'stat-n' }, String((store.movementList || []).length)), h('div', { class: 'tiny muted' }, 'movements in use')),
          h('div', { class: 'stat' }, h('div', { class: 'stat-n' }, String(changed.length)), h('div', { class: 'tiny muted' }, 'added or changed by you')),
          h('div', { class: 'stat' }, h('div', { class: 'stat-n' }, String(checked.length)), h('div', { class: 'tiny muted' }, 'checked or flagged')),
          h('div', { class: 'stat' }, h('div', { class: 'stat-n' }, String((store.removedList || []).length)), h('div', { class: 'tiny muted' }, 'taken out'))),
        h('div', { class: 'btn-row' },
          h('a', { class: 'btn', href: '#/movements/new' }, icon('plus'), 'New movement'),
          h('a', { class: 'btn', href: '#/review' }, icon('check'), 'Review the library'),
          h('a', { class: 'btn', href: '#/removed' }, 'Removed movements and series'))),
      admin ? h('section', { class: 'card stack' },
        h('h2', null, 'Packs: move your work, or send it back'),
        h('p', { class: 'hint' }, 'A pack is one file holding everything your studio has changed: movements you added or edited, series, class types, levels, lists, timing, review marks and what you took out. Use it to copy your set-up to another server, or send it to whoever maintains OpenPilates so your corrections go into the next version. Client names and notes are never in a pack.'),
        h('label', { class: 'check-row' }, h('input', { type: 'checkbox', checked: withFlows, onchange: (e) => { withFlows = e.target.checked; packLink.href = withFlows ? '/api/pack' : '/api/pack?flows=0'; } }), h('span', null, 'Include our flows', h('span', { class: 'tiny muted', style: { display: 'block' } }, 'Shows how you really plan a class, which is the most useful thing to learn from. Booked clients are stripped out.'))),
        h('div', { class: 'btn-row' }, packLink, h('label', { class: 'btn' }, icon('upload'), 'Bring in a pack', packInput))) : null,
      admin ? h('section', { class: 'card stack' },
        h('h2', null, 'Backup'),
        h('p', { class: 'hint' }, 'Everything on this server in one file: settings, flows, clients, your movements and notes (no passwords). Keep it somewhere safe. For a full copy, back up the container\'s /data folder.'),
        h('div', { class: 'btn-row' }, h('a', { class: 'btn', href: '/api/backup', download: '' }, icon('download'), 'Download backup'), h('a', { class: 'btn btn-ghost', href: '#/team' }, icon('user'), 'Team'))) : null];
  };

  const TABS = [['rooms', 'Rooms & springs'], ['classes', 'Classes'], ['lists', 'Lists'], ['data', 'Library & data']];
  const tabsEl = h('div', { class: 'seg', role: 'tablist', 'aria-label': 'Studio settings' });
  const draw = () => {
    if (!TABS.some(([id]) => id === vs.tab)) vs.tab = 'rooms';
    fill(tabsEl, TABS.map(([id, label]) => h('button', { type: 'button', role: 'tab', 'aria-selected': vs.tab === id ? 'true' : 'false', class: vs.tab === id ? 'on' : null, onclick: () => { vs.tab = id; draw(); } }, label)));
    fill(wrap, h('div', { class: 'stack' }, vs.tab === 'classes' ? classesTab() : vs.tab === 'lists' ? listsTab() : vs.tab === 'data' ? dataTab() : roomsTab()));
  };
  await Promise.all([store.loadMovements(), store.loadSeries()]);
  draw();
  return { title: 'Studio', cleanup: () => save.flush(), node: [
    h('div', { class: 'page-head' }, h('div', { class: 'grow' }, h('h1', null, 'Studio'), h('p', { class: 'small muted' }, 'Set this up once. Everything else in OpenPilates follows it: spring colours, what the library offers, class shapes, levels and timing.')),
      h('div', { class: 'btn-row' }, status)),
    h('div', { style: { marginBottom: '14px' } }, tabsEl),
    wrap] };
}

export async function clientsView() {
  let clients = await store.loadClients(true);
  const wrap = h('div');
  const vs = viewState('clients', { showArchived: false, q: '' });
  let showArchived = vs.showArchived;
  let q = vs.q;

  const edit = async (c) => {
    const st = c ? { ...c, tags: [...c.tags] } : { name: '', notes: '', tags: [] };
    const err = h('p', { class: 'error' });
    const name = h('input', { type: 'text', value: st.name });
    const notes = h('textarea', { rows: 4 }, st.notes);
    const res = await modal(c ? `Edit ${c.name}` : 'New client', h('div', { class: 'stack' },
      field('Name', name, 'First name and initial is enough.'),
      field('Cautions', chips(CAUTIONS, st.tags, (v) => { st.tags = v; }), 'Flows check movements against these.'),
      field('Notes', notes, 'Stays on this server. Never included in exported flows.'), err),
    { actions: [{ label: 'Cancel', value: false }, { label: 'Save', value: true, kind: 'primary' }] });
    if (!res) return;
    try {
      const body = { name: name.value, notes: notes.value, tags: st.tags, archived: c?.archived };
      if (c) await api('PUT', `/clients/${c.id}`, body); else await api('POST', '/clients', body);
      clients = await store.loadClients(true);
      toast('Client saved.');
      draw();
    } catch (e) { toast(e.message, { kind: 'error' }); }
  };

  const draw = () => {
    const list = clients.filter((c) => (showArchived || !c.archived) && (!q || c.name.toLowerCase().includes(q)));
    fill(wrap, list.length ? h('div', { class: 'card', style: { overflowX: 'auto' } }, h('table', { class: 'tbl', style: { minWidth: '560px' } },
      h('thead', null, h('tr', null, h('th', { scope: 'col' }, 'Client'), h('th', { scope: 'col' }, 'Cautions'), h('th', { scope: 'col' }, 'Notes'), h('th', { scope: 'col' }, 'Updated'), h('th', { scope: 'col' }, h('span', { class: 'sr-only' }, 'Actions')))),
      h('tbody', null, list.map((c) => h('tr', { style: { opacity: c.archived ? 0.6 : 1 } },
        h('td', { style: { fontWeight: 600 } }, c.name, c.archived ? ' (archived)' : ''),
        h('td', null, c.tags.length ? c.tags.map((t) => h('span', { class: 'tag tag-warn', style: { margin: '0 4px 4px 0' } }, labelOf(CAUTIONS, t))) : h('span', { class: 'tiny muted' }, 'None')),
        h('td', { class: 'small', style: { maxWidth: '320px' } }, c.notes),
        h('td', { class: 'tiny muted' }, fmtDate(c.updatedAt)),
        h('td', { style: { whiteSpace: 'nowrap' } },
          btn('', () => edit(c), { iconName: 'edit', small: true, kind: 'ghost', title: `Edit ${c.name}` }),
          btn(c.archived ? 'Restore' : 'Archive', async () => { await api('PUT', `/clients/${c.id}`, { ...c, archived: !c.archived }); clients = await store.loadClients(true); draw(); }, { small: true, kind: 'ghost' }),
          store.isAdmin ? btn('', async () => { if (await confirmDialog(`Delete ${c.name}?`, 'Their notes are deleted for good. Archive instead if you might need them.')) { await api('DELETE', `/clients/${c.id}`); clients = await store.loadClients(true); draw(); } }, { iconName: 'trash', small: true, kind: 'ghost', title: `Delete ${c.name}` }) : null))))))
      : empty(clients.length ? 'No clients match' : 'No clients yet', 'Add clients with cautions like pregnancy or a knee replacement, then add them to a flow to get checks and swaps.', btn('Add client', () => edit(null), { kind: 'primary', iconName: 'plus' })));
  };

  draw();
  return { title: 'Clients', node: [
    h('div', { class: 'page-head' }, h('div', { class: 'grow' }, h('h1', null, 'Clients'), h('p', { class: 'small muted' }, 'Shared with every instructor in the studio. Health notes stay on this server.')),
      btn('Add client', () => edit(null), { kind: 'primary', iconName: 'plus' })),
    h('div', { class: 'btn-row', style: { marginBottom: '12px' } },
      h('input', { type: 'search', value: q, placeholder: 'Search clients', 'aria-label': 'Search clients', style: { maxWidth: '280px' }, oninput: (e) => { q = vs.q = e.target.value.toLowerCase(); draw(); } }),
      h('label', { class: 'small', style: { display: 'flex', gap: '8px', alignItems: 'center' } }, h('input', { type: 'checkbox', checked: showArchived, onchange: (e) => { showArchived = vs.showArchived = e.target.checked; draw(); } }), 'Show archived')),
    wrap] };
}

export async function teamView() {
  if (!store.isAdmin) return h('div', { class: 'empty' }, h('h3', null, 'Admins only'));
  let users = await api('GET', '/users');
  const wrap = h('div');

  const addUser = async () => {
    const name = h('input', { type: 'text', placeholder: 'e.g. Alex Smith' });
    const username = h('input', { type: 'text', placeholder: 'e.g. alex', autocapitalize: 'none' });
    const pass = h('input', { type: 'text', value: suggestPassword() });
    let role = 'instructor';
    const res = await modal('Add an instructor', h('div', { class: 'stack' },
      field('Name', name), field('Username', username),
      field('Temporary password', pass, 'Share it with them privately. They can change it under their account.'),
      field('Role', select([{ id: 'instructor', label: 'Instructor' }, { id: 'admin', label: 'Admin (can manage studio, team and library)' }], role, (v) => { role = v; }))),
    { actions: [{ label: 'Cancel', value: false }, { label: 'Add', value: true, kind: 'primary' }] });
    if (!res) return;
    try {
      await api('POST', '/users', { displayName: name.value, username: username.value, password: pass.value, role });
      users = await api('GET', '/users'); toast('Instructor added.'); draw();
    } catch (e) { toast(e.message, { kind: 'error' }); }
  };

  const resetPw = async (u) => {
    const pass = h('input', { type: 'text', value: suggestPassword() });
    const res = await modal(`New password for ${u.displayName}`, field('New password', pass, 'They\'ll be signed out everywhere.'), { actions: [{ label: 'Cancel', value: false }, { label: 'Set password', value: true, kind: 'primary' }] });
    if (!res) return;
    try { await api('PUT', `/users/${u.id}`, { password: pass.value }); toast('Password changed.'); } catch (e) { toast(e.message, { kind: 'error' }); }
  };

  const update = async (u, body) => {
    try { await api('PUT', `/users/${u.id}`, body); users = await api('GET', '/users'); draw(); } catch (e) { toast(e.message, { kind: 'error' }); draw(); }
  };

  const draw = () => fill(wrap, h('div', { class: 'card', style: { overflowX: 'auto' } }, h('table', { class: 'tbl', style: { minWidth: '560px' } },
    h('thead', null, h('tr', null, ['Name', 'Username', 'Role', 'Since', ''].map((t) => h('th', { scope: 'col' }, t)))),
    h('tbody', null, users.map((u) => h('tr', { style: { opacity: u.disabled ? 0.55 : 1 } },
      h('td', { style: { fontWeight: 600 } }, u.displayName, u.id === store.user.id ? ' (you)' : ''),
      h('td', null, u.username),
      h('td', null, select([{ id: 'instructor', label: 'Instructor' }, { id: 'admin', label: 'Admin' }], u.role, (v) => update(u, { role: v }), { 'aria-label': `Role for ${u.displayName}`, style: { width: 'auto', height: '34px' } })),
      h('td', { class: 'tiny muted' }, fmtDate(u.createdAt)),
      h('td', { style: { whiteSpace: 'nowrap' } },
        btn('New password', () => resetPw(u), { small: true }),
        u.id !== store.user.id ? btn(u.disabled ? 'Enable' : 'Disable', () => update(u, { disabled: !u.disabled }), { small: true, kind: 'ghost' }) : null)))))));

  draw();
  return { title: 'Team', node: [
    h('div', { class: 'page-head' }, h('div', { class: 'grow' }, h('h1', null, 'Team'), h('p', { class: 'small muted' }, 'Everyone shares the movement library, studio settings and clients. Each instructor has their own flows and notes.')),
      btn('Add instructor', addUser, { kind: 'primary', iconName: 'plus' })),
    wrap,
    h('p', { class: 'small muted', style: { marginTop: '14px' } }, 'Backups and packs are under ', h('a', { href: '#/studio' }, 'Studio → Library & data'), '.')] };
}

export async function accountView() {
  const name = h('input', { type: 'text', value: store.user.displayName });
  const cur = h('input', { type: 'password', autocomplete: 'current-password' });
  const next = h('input', { type: 'password', autocomplete: 'new-password' });
  return { title: 'Account', node: [
    h('div', { class: 'page-head' }, h('div', { class: 'grow' }, h('h1', null, 'Your account'), h('p', { class: 'small muted' }, `Signed in as ${store.user.username} · ${store.user.role === 'admin' ? 'Admin' : 'Instructor'} · OpenPilates ${store.state.version}`))),
    h('div', { class: 'auto-grid', style: { maxWidth: '900px' } },
      h('div', { class: 'card stack' }, h('h2', null, 'Appearance'),
        chips([{ id: 'light', label: 'Light' }, { id: 'dark', label: 'Dark' }, { id: 'auto', label: 'Follow this device' }], window.opTheme.get(), (v) => { window.opTheme.set(v); location.reload(); }, { multi: false }),
        h('p', { class: 'hint' }, 'Kept in this browser, so each device can have its own. The sun or moon at the top of every page switches it too.')),
      h('div', { class: 'card stack' }, h('h2', null, 'Name'), field('Display name', name),
        h('div', null, btn('Save name', async () => { try { await api('PUT', '/me', { displayName: name.value }); store.state = null; toast('Saved.'); location.reload(); } catch (e) { toast(e.message, { kind: 'error' }); } }, { kind: 'primary' }))),
      h('div', { class: 'card stack' }, h('h2', null, 'Password'), field('Current password', cur), field('New password', next, 'At least 10 characters.'),
        h('div', null, btn('Change password', async () => { try { await api('PUT', '/me', { currentPassword: cur.value, newPassword: next.value }); cur.value = next.value = ''; toast('Password changed.'); } catch (e) { toast(e.message, { kind: 'error' }); } }, { kind: 'primary' })))),
    h('p', { class: 'tiny muted', style: { marginTop: '18px' } }, 'OpenPilates is free software (GPL-3.0). ', h('a', { href: 'https://github.com/d-plenty/OpenPilates', target: '_blank', rel: 'noopener' }, 'Source code and help on GitHub'), '.')] };
}

function suggestPassword() {
  const words = ['spring', 'carriage', 'footbar', 'mermaid', 'swan', 'teaser', 'hundred', 'bridge', 'strap', 'roll', 'plank', 'breath', 'flow', 'core', 'reach', 'stretch'];
  const a = new Uint32Array(4); crypto.getRandomValues(a);
  return [...a].map((n) => words[n % words.length]).join('-') + '-' + (a[0] % 90 + 10);
}
