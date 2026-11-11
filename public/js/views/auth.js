import { h, field, select } from '../ui.js';
import { api, store } from '../store.js';
import { BRANDS } from '/shared/vocab.js';

function authShell(...children) {
  return h('div', { class: 'auth-wrap' }, h('div', { class: 'auth' },
    h('div', { class: 'brand' }, h('img', { src: '/icon.svg', width: 34, height: 34, alt: '' }), 'OpenPilates'), ...children));
}

export async function setupView(done) {
  const err = h('p', { class: 'error', role: 'alert' });
  const studio = h('input', { type: 'text', value: 'My studio', autocomplete: 'organization' });
  let brand = 'balanced_body';
  const display = h('input', { type: 'text', autocomplete: 'name', placeholder: 'e.g. Sarah Blake' });
  const user = h('input', { type: 'text', autocomplete: 'username', placeholder: 'e.g. sarah', autocapitalize: 'none' });
  const pass = h('input', { type: 'password', autocomplete: 'new-password' });
  const pass2 = h('input', { type: 'password', autocomplete: 'new-password' });
  const submit = async (e) => {
    e.preventDefault();
    err.textContent = '';
    if (pass.value !== pass2.value) { err.textContent = 'The passwords don\'t match.'; return; }
    try {
      await api('POST', '/setup', { studioName: studio.value, brand, displayName: display.value || user.value, username: user.value, password: pass.value });
      store.state = null;
      done();
    } catch (x) { err.textContent = x.message; }
  };
  return authShell(
    h('h1', { style: { fontSize: '22px' } }, 'Set up your studio'),
    h('p', { class: 'muted small' }, 'This creates the first admin account. You can add instructors afterwards.'),
    h('form', { class: 'stack', onsubmit: submit },
      field('Studio name', studio),
      field('Reformer brand', select(Object.entries(BRANDS).map(([id, b]) => ({ id, label: b.label })), brand, (v) => { brand = v; }), 'Used to show spring colours. You can change this later.'),
      field('Your name', display),
      field('Username', user),
      field('Password', pass, 'At least 10 characters. A few random words works well.'),
      field('Password again', pass2),
      err,
      h('button', { class: 'btn btn-primary', type: 'submit' }, 'Create studio')));
}

export async function loginView(done) {
  const err = h('p', { class: 'error', role: 'alert' });
  const user = h('input', { type: 'text', autocomplete: 'username', autocapitalize: 'none' });
  const pass = h('input', { type: 'password', autocomplete: 'current-password' });
  const submit = async (e) => {
    e.preventDefault();
    err.textContent = '';
    try {
      await api('POST', '/login', { username: user.value, password: pass.value });
      store.state = null;
      done();
    } catch (x) { err.textContent = x.message; }
  };
  return authShell(
    store.state?.studioName ? h('p', { class: 'muted' }, store.state.studioName) : null,
    h('form', { class: 'stack', onsubmit: submit },
      field('Username', user),
      field('Password', pass),
      err,
      h('button', { class: 'btn btn-primary', type: 'submit' }, 'Sign in')),
    h('p', { class: 'hint' }, 'Forgotten your password? Ask your studio admin to set a new one.'));
}
