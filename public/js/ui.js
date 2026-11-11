// Tiny DOM helpers — no framework, no build step.
export function h(tag, attrs, ...children) {
  const el = tag === 'svg' || attrs?.svg ? document.createElementNS('http://www.w3.org/2000/svg', tag) : document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v == null || v === false || k === 'svg') continue;
    if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'class') el.setAttribute('class', Array.isArray(v) ? v.filter(Boolean).join(' ') : v);
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (k === 'html') el.innerHTML = v; // only ever used with trusted, static strings
    else if (k === 'value' && 'value' in el) el.value = v;
    else if (k === 'checked' || k === 'selected' || k === 'disabled') el[k] = !!v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  append(el, children);
  return el;
}

// Replace an element's children; skips null/false and flattens arrays.
export function fill(el, ...children) {
  el.textContent = '';
  append(el, children);
  return el;
}

function append(el, children) {
  for (const c of children.flat(Infinity)) {
    if (c == null || c === false || c === true) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
}

// SVG element helper
export function s(tag, attrs = {}, ...children) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  for (const [k, v] of Object.entries(attrs)) if (v != null && v !== false) el.setAttribute(k, v);
  append(el, children);
  return el;
}

const ICONS = {
  plus: 'M12 5v14M5 12h14',
  search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-4-4',
  back: 'M15 5l-7 7 7 7',
  next: 'M9 5l7 7-7 7',
  close: 'M6 6l12 12M18 6L6 18',
  play: 'M7 5l12 7-12 7z',
  pause: 'M7 5h3v14H7zM14 5h3v14h-3z',
  alert: 'M12 3l10 18H2L12 3zM12 10v5M12 18v.5',
  check: 'M5 12l5 5 9-10',
  up: 'M6 15l6-6 6 6',
  down: 'M6 9l6 6 6-6',
  trash: 'M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13',
  copy: 'M8 8h11v11H8zM5 16V5h11',
  music: 'M9 18V5l11-2v13M6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM17 19a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  download: 'M12 4v11M7 10l5 5 5-5M5 20h14',
  upload: 'M12 20V9M7 14l5-5 5 5M5 4h14',
  edit: 'M4 20h4L19 9l-4-4L4 16zM14 6l4 4',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21c0-4 3.6-7 8-7s8 3 8 7',
  home: 'M3 10l9-6 9 6v10H3zM9 20v-6h6v6',
  list: 'M4 6h16M4 12h16M4 18h10',
  compass: 'M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16zM15 9l-2 4-4 2 2-4z',
  grip: '',
  sparkle: 'M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6',
  logout: 'M10 4H5v16h5M14 8l4 4-4 4M18 12H9',
  share: 'M12 15V4M8 8l4-4 4 4M5 13v7h14v-7',
  print: 'M6 9V4h12v5M6 17H4v-6h16v6h-2M7 14h10v6H7z',
  undo: 'M9 14L4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3'
};

export function icon(name, size = 18, extra = {}) {
  if (name === 'grip') {
    return s('svg', { width: 16, height: 16, viewBox: '0 0 16 16', 'aria-hidden': 'true', class: 'grip-icon', ...extra },
      ...[4, 8, 12].flatMap((y) => [s('circle', { cx: 5, cy: y, r: 1.3 }), s('circle', { cx: 11, cy: y, r: 1.3 })]));
  }
  return s('svg', { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': 2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'aria-hidden': 'true', ...extra },
    s('path', { d: ICONS[name] || '' }));
}

export function btn(label, onClick, { kind = 'secondary', iconName, title, type = 'button', small, disabled, ariaLabel } = {}) {
  return h('button', { type, class: ['btn', `btn-${kind}`, small && 'btn-sm', !label && 'btn-icon'], onclick: onClick, title, disabled, 'aria-label': ariaLabel || (!label ? title : null) },
    iconName ? icon(iconName, small ? 16 : 18) : null, label ? h('span', null, label) : null);
}

let toastTimer;
export function toast(message, { kind = 'info', action } = {}) {
  let el = document.getElementById('toast');
  if (!el) { el = h('div', { id: 'toast', role: 'status', 'aria-live': 'polite' }); document.body.append(el); }
  el.replaceChildren(...[h('span', null, message), action ? h('button', { class: 'toast-action', onclick: () => { action.run(); el.classList.remove('show'); } }, action.label) : null].filter(Boolean));
  el.className = `show toast-${kind}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), action ? 6000 : 3200);
}

export function modal(title, body, { actions = [], wide } = {}) {
  return new Promise((resolve) => {
    const close = (v) => { overlay.remove(); document.removeEventListener('keydown', onKey); resolve(v); };
    const onKey = (e) => { if (e.key === 'Escape') close(null); };
    const overlay = h('div', { class: 'modal-overlay', onclick: (e) => { if (e.target === overlay) close(null); } },
      h('div', { class: ['modal', wide && 'modal-wide'], role: 'dialog', 'aria-modal': 'true', 'aria-label': title },
        h('div', { class: 'modal-head' }, h('h2', null, title), btn('', () => close(null), { iconName: 'close', title: 'Close', kind: 'ghost' })),
        h('div', { class: 'modal-body' }, typeof body === 'function' ? body(close) : body),
        actions.length ? h('div', { class: 'modal-actions' }, actions.map((a) => btn(a.label, () => close(a.value ?? a.label), { kind: a.kind || 'secondary' }))) : null));
    document.body.append(overlay);
    document.addEventListener('keydown', onKey);
    const first = overlay.querySelector('input, select, textarea, .btn-primary');
    if (first) first.focus();
  });
}

export async function confirmDialog(title, message, okLabel = 'Delete', kind = 'danger') {
  const r = await modal(title, h('p', null, message), { actions: [{ label: 'Cancel', value: false }, { label: okLabel, value: true, kind }] });
  return r === true;
}

export function field(label, input, hint) {
  const id = input.id || 'f' + Math.random().toString(36).slice(2, 8);
  input.id = id;
  return h('div', { class: 'field' }, h('label', { for: id }, label), input, hint ? h('div', { class: 'hint' }, hint) : null);
}

export function select(options, value, onChange, attrs = {}) {
  return h('select', { ...attrs, onchange: (e) => onChange(e.target.value) },
    options.map((o) => h('option', { value: o.id ?? o.value, selected: (o.id ?? o.value) === value }, o.label)));
}

export function chips(options, selected, onToggle, { multi = true, small } = {}) {
  const set = new Set(Array.isArray(selected) ? selected : [selected]);
  return h('div', { class: 'chips', role: 'group' }, options.map((o) =>
    h('button', { type: 'button', class: ['chip', set.has(o.id) && 'on', small && 'chip-sm'], 'aria-pressed': set.has(o.id) ? 'true' : 'false', onclick: () => {
      if (multi) { set.has(o.id) ? set.delete(o.id) : set.add(o.id); onToggle([...set]); } else onToggle(o.id);
    } }, o.label)));
}

export function empty(title, text, action) {
  return h('div', { class: 'empty' }, h('h3', null, title), h('p', null, text), action || null);
}

export function debounce(fn, ms = 600) {
  let t;
  const d = (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
  d.flush = (...a) => { clearTimeout(t); fn(...a); };
  return d;
}

export function fmtDate(s) {
  if (!s) return '';
  const d = new Date(s.includes('T') ? s : s.replace(' ', 'T') + 'Z');
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: d.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined });
}
