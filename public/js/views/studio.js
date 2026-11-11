import { h, icon, btn, toast, field, select, chips, modal, confirmDialog, empty, fmtDate, fill } from '../ui.js';
import { api, store } from '../store.js';
import { BRANDS, LOAD_LEVELS, EQUIPMENT, CAUTIONS, springFor, labelOf, DEFAULT_TARGETS } from '/shared/vocab.js';
import { springDots } from '../charts.js';

export async function studioView() {
  const s = structuredClone(await store.loadStudio(true));
  const admin = store.isAdmin;
  const wrap = h('div', { class: 'auto-grid' });
  const dis = !admin;

  const save = async () => {
    try {
      store.studio = await api('PUT', '/studio', s);
      store.state.studioName = store.studio.name;
      toast('Studio settings saved.');
    } catch (e) { toast(e.message, { kind: 'error' }); }
  };

  const roomCard = (r, i) => {
    const brand = BRANDS[r.brand] || BRANDS.balanced_body;
    return h('div', { style: { border: '1px solid #DDE3E0', borderRadius: '12px', padding: '14px' }, class: 'stack-sm' },
      h('div', { class: 'grid-2' },
        field('Room name', h('input', { type: 'text', value: r.name, disabled: dis, oninput: (e) => { r.name = e.target.value; } })),
        field('Used for', select([{ id: 'reformer', label: 'Reformer' }, { id: 'mat', label: 'Mat' }], r.apparatus, (v) => { r.apparatus = v; draw(); }, { disabled: dis }))),
      h('div', { class: 'grid-2' },
        r.apparatus === 'reformer' ? field('Reformer brand', select(Object.entries(BRANDS).map(([id, b]) => ({ id, label: b.label })), r.brand, (v) => { r.brand = v; r.springs = { ...BRANDS[v].standard }; draw(); }, { disabled: dis })) : h('div'),
        field(r.apparatus === 'reformer' ? 'Number of reformers' : 'Number of mats', h('input', { type: 'number', min: 0, max: 100, value: r.count, disabled: dis, oninput: (e) => { r.count = Number(e.target.value); } }))),
      r.apparatus === 'reformer' ? h('div', null,
        h('div', { class: 'tiny', style: { fontWeight: 600, color: '#3E4A44', marginBottom: '6px' } }, 'Springs on each reformer'),
        h('div', { class: 'btn-row' }, LOAD_LEVELS.filter((l) => brand.springs[l] || r.springOverrides?.[l]).map((l) => {
          const sp = springFor(r.brand, l, r.springOverrides);
          return h('label', { style: { display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '6px 10px', borderRadius: '8px', background: '#F4F7F6', fontSize: '13px' } },
            h('span', { class: 'dot', style: { width: '14px', height: '14px', borderRadius: '7px', background: sp.color, border: '1px solid rgba(0,0,0,.15)', display: 'inline-block' } }),
            h('input', { type: 'number', min: 0, max: 10, value: r.springs[l] || 0, disabled: dis, style: { width: '56px', height: '32px' }, 'aria-label': `${sp.name} springs`, oninput: (e) => { r.springs[l] = Number(e.target.value); } }),
            `${sp.name} · ${l.replace('x', 'extra ')}`);
        })),
        h('p', { class: 'hint', style: { marginTop: '6px' } }, 'Movements store a load (light, medium, heavy…). It\'s shown in this brand\'s colours. Brand conversions are approximate.'),
        admin ? h('details', { style: { marginTop: '6px' } }, h('summary', { class: 'small', style: { cursor: 'pointer' } }, 'Use your own spring names and colours'),
          h('div', { class: 'stack-sm', style: { marginTop: '8px' } }, LOAD_LEVELS.map((l) => {
            const o = r.springOverrides[l] || {};
            const base = springFor(r.brand, l);
            return h('div', { class: 'grid-3', style: { gridTemplateColumns: '90px minmax(0,1fr) 70px' } },
              h('span', { class: 'small', style: { alignSelf: 'center' } }, l.replace('x', 'extra ')),
              h('input', { type: 'text', placeholder: base.name, value: o.name || '', 'aria-label': `Name for ${l}`, oninput: (e) => { r.springOverrides[l] = { ...(r.springOverrides[l] || {}), name: e.target.value, short: (e.target.value[0] || '').toUpperCase(), color: r.springOverrides[l]?.color || base.color }; if (!e.target.value) delete r.springOverrides[l]; } }),
              h('input', { type: 'color', value: o.color || base.color, 'aria-label': `Colour for ${l}`, style: { height: '40px', width: '70px', padding: '2px' }, oninput: (e) => { r.springOverrides[l] = { name: r.springOverrides[l]?.name || base.name, short: r.springOverrides[l]?.short || base.short, color: e.target.value }; } }));
          }))) : null) : null,
      admin && s.rooms.length > 1 ? h('div', null, btn('Remove room', () => { s.rooms.splice(i, 1); draw(); }, { small: true, kind: 'ghost', iconName: 'trash' })) : null);
  };

  const draw = () => {
    fill(wrap, 
      h('section', { class: 'card stack' },
        h('div', { class: 'card-head' }, h('h2', null, 'Studio & rooms'), h('div', { class: 'spacer' }),
          admin ? btn('Add room', () => { s.rooms.push({ id: 'room' + Date.now().toString(36), name: 'New room', apparatus: 'reformer', brand: s.rooms[0]?.brand || 'balanced_body', count: 0, springs: { ...BRANDS.balanced_body.standard }, springOverrides: {} }); draw(); }, { small: true, iconName: 'plus' }) : null),
        field('Studio name', h('input', { type: 'text', value: s.name, disabled: dis, oninput: (e) => { s.name = e.target.value; } })),
        s.rooms.map(roomCard)),
      h('section', { class: 'card stack' },
        h('h2', null, 'Props & accessories'),
        h('p', { class: 'hint' }, 'Movements that need something you have none of are hidden by default and flagged in analysis.'),
        h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: '8px' } },
          EQUIPMENT.map((e) => h('label', { style: { display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', borderRadius: '10px', border: '1px solid ' + (s.props[e.id] > 0 ? '#BFDCD5' : '#DDE3E0'), background: s.props[e.id] > 0 ? '#F4F9F7' : '#fff', fontSize: '13px', fontWeight: 600 } },
            h('span', { style: { flex: 1 } }, e.label),
            h('input', { type: 'number', min: 0, max: 200, value: s.props[e.id] || 0, disabled: dis, style: { width: '64px', height: '32px' }, 'aria-label': `${e.label} quantity`, oninput: (ev) => { s.props[e.id] = Number(ev.target.value); } }))))),
      h('section', { class: 'card stack' },
        h('div', { class: 'card-head' }, h('h2', null, 'Class targets'), h('div', { class: 'spacer' }),
          admin ? btn('New target', () => { const k = 'target' + Object.keys(s.targets).length; s.targets[k] = { label: 'New target', flexion: 50, extension: 25, rotation: 12, 'side-bend': 13 }; draw(); }, { small: true, iconName: 'plus' }) : null),
        h('p', { class: 'hint' }, 'What "balanced" means for each class type. Flows compare their spine movement against the target you pick.'),
        Object.entries(s.targets).map(([k, t]) => {
          const sum = ['flexion', 'extension', 'rotation', 'side-bend'].reduce((a, d) => a + Number(t[d] || 0), 0);
          const sumEl = h('span', { class: 'tiny', style: { color: sum === 100 ? '#0A5047' : '#8A3A14', fontWeight: 600 } }, `Adds up to ${sum}%`);
          return h('div', { style: { border: '1px solid #DDE3E0', borderRadius: '12px', padding: '12px' }, class: 'stack-sm' },
            h('div', { class: 'btn-row' }, h('input', { type: 'text', value: t.label, disabled: dis, 'aria-label': 'Target name', style: { maxWidth: '220px', fontWeight: 600 }, oninput: (e) => { t.label = e.target.value; } }), sumEl,
              h('div', { class: 'spacer' }), admin && Object.keys(s.targets).length > 1 && !DEFAULT_TARGETS[k] ? btn('', () => { delete s.targets[k]; draw(); }, { iconName: 'trash', small: true, kind: 'ghost', title: 'Remove target' }) : null),
            ['flexion', 'extension', 'rotation', 'side-bend'].map((d) => {
              const out = h('span', { style: { textAlign: 'right' } }, `${t[d]}%`);
              return h('label', { style: { display: 'grid', gridTemplateColumns: '90px minmax(0,1fr) 44px', alignItems: 'center', gap: '10px', fontSize: '13px', fontWeight: 600 } },
                d === 'side-bend' ? 'Side bend' : d[0].toUpperCase() + d.slice(1),
                h('input', { type: 'range', min: 0, max: 80, value: t[d], disabled: dis, oninput: (e) => { t[d] = Number(e.target.value); out.textContent = `${t[d]}%`; const ss = ['flexion', 'extension', 'rotation', 'side-bend'].reduce((a, x) => a + Number(t[x] || 0), 0); sumEl.textContent = `Adds up to ${ss}%`; sumEl.style.color = ss === 100 ? '#0A5047' : '#8A3A14'; } }), out);
            }));
        }),
        h('p', { class: 'tiny muted' }, 'The General default (50/25/12/13) follows Kaleen Canevari\'s class-design work. Change it to suit your teaching.')));
  };

  draw();
  return { title: 'Studio', node: [
    h('div', { class: 'page-head' }, h('div', { class: 'grow' }, h('h1', null, 'Studio'), h('p', { class: 'small muted' }, admin ? 'These settings filter the library, set spring colours and drive the analysis for everyone.' : 'Only admins can change studio settings.')),
      admin ? btn('Save studio settings', save, { kind: 'primary', iconName: 'check' }) : null),
    wrap,
    admin ? h('div', { class: 'btn-row', style: { marginTop: '16px' } }, btn('Save studio settings', save, { kind: 'primary', iconName: 'check' })) : null] };
}

export async function clientsView() {
  let clients = await store.loadClients(true);
  const wrap = h('div');
  let showArchived = false;
  let q = '';

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
      h('input', { type: 'search', placeholder: 'Search clients', 'aria-label': 'Search clients', style: { maxWidth: '280px' }, oninput: (e) => { q = e.target.value.toLowerCase(); draw(); } }),
      h('label', { class: 'small', style: { display: 'flex', gap: '8px', alignItems: 'center' } }, h('input', { type: 'checkbox', onchange: (e) => { showArchived = e.target.checked; draw(); } }), 'Show archived')),
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
    try { await api('PUT', `/users/${u.id}`, body); users = await api('GET', '/users'); draw(); } catch (e) { toast(e.message, { kind: 'error' }); }
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
    h('div', { class: 'card', style: { marginTop: '16px' } },
      h('h2', null, 'Backup'),
      h('p', { class: 'small muted', style: { margin: '4px 0 10px' } }, 'Downloads studio settings, flows, clients, custom movements and notes as one file (no passwords). For a full backup, copy the container\'s /data folder.'),
      h('a', { class: 'btn', href: '/api/backup', download: '' }, icon('download'), 'Download backup'))] };
}

export async function accountView() {
  const name = h('input', { type: 'text', value: store.user.displayName });
  const cur = h('input', { type: 'password', autocomplete: 'current-password' });
  const next = h('input', { type: 'password', autocomplete: 'new-password' });
  return { title: 'Account', node: [
    h('div', { class: 'page-head' }, h('div', { class: 'grow' }, h('h1', null, 'Your account'), h('p', { class: 'small muted' }, `Signed in as ${store.user.username} · ${store.user.role === 'admin' ? 'Admin' : 'Instructor'} · OpenPilates ${store.state.version}`))),
    h('div', { class: 'auto-grid', style: { maxWidth: '900px' } },
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
