import { h, icon, toast, fill } from './ui.js';
import { api, store } from './store.js';
import { setupView, loginView } from './views/auth.js';
import { flowsView, newFlowView } from './views/flows.js';
import { flowView } from './views/flow.js';
import { exploreView } from './views/explore.js';
import { movementView, movementEditView } from './views/movement.js';
import { studioView, clientsView, teamView, accountView } from './views/studio.js';

const root = document.getElementById('app');
let cleanup = null;

const routes = [
  [/^\/?$/, () => flowsView()],
  [/^\/flows\/new$/, () => newFlowView()],
  [/^\/flows\/([\w-]+)(?:\/(build|analysis|play))?$/, (m) => flowView(m[1], m[2] || 'build')],
  [/^\/explore$/, (m, q) => exploreView(q)],
  [/^\/movements\/new$/, () => movementEditView(null)],
  [/^\/movements\/([\w-]+)\/edit$/, (m) => movementEditView(m[1])],
  [/^\/movements\/([\w-]+)$/, (m) => movementView(m[1])],
  [/^\/studio$/, () => studioView()],
  [/^\/clients$/, () => clientsView()],
  [/^\/team$/, () => teamView()],
  [/^\/account$/, () => accountView()]
];

export function go(path) { location.hash = '#' + path; }

function currentPath() {
  const raw = location.hash.replace(/^#/, '') || '/';
  const [path, qs] = raw.split('?');
  return { path, query: new URLSearchParams(qs || '') };
}

function shell(active, content) {
  const nav = [['/', 'Flows', 'list'], ['/explore', 'Movements', 'compass'], ['/clients', 'Clients', 'user'], ['/studio', 'Studio', 'home']];
  const user = store.user;
  return [
    h('header', { class: 'topbar no-print' },
      h('a', { class: 'brand', href: '#/' },
        h('img', { src: '/icon.svg', width: 28, height: 28, alt: '' }), 'OpenPilates'),
      h('nav', { class: 'nav', 'aria-label': 'Main' },
        nav.map(([p, l]) => h('a', { href: '#' + p, class: active === p ? 'on' : null, 'aria-current': active === p ? 'page' : null }, l)),
        store.isAdmin ? h('a', { href: '#/team', class: active === '/team' ? 'on' : null }, 'Team') : null),
      h('div', { class: 'spacer' }),
      h('div', { class: 'userchip' },
        h('span', { class: 'who' }, store.state?.studioName ? `${store.state.studioName} · ` : '', user?.displayName),
        h('a', { href: '#/account', class: 'btn btn-sm btn-ghost', title: 'Your account', 'aria-label': 'Your account' }, icon('user', 18)),
        h('button', { class: 'btn btn-sm btn-ghost', title: 'Sign out', 'aria-label': 'Sign out', onclick: async () => { await api('POST', '/logout'); store.state.user = null; store.reset(); render(); } }, icon('logout', 18)))),
    h('main', { class: 'page', id: 'main' }, content),
    h('nav', { class: 'tabbar no-print', 'aria-label': 'Tabs' },
      nav.map(([p, l, ic]) => h('a', { href: '#' + p, class: active === p ? 'on' : null }, icon(ic, 22), l)))
  ];
}

export async function render() {
  if (cleanup) { try { cleanup(); } catch { /* ignore */ } cleanup = null; }
  const { path, query } = currentPath();
  try {
    if (!store.state) await store.loadState();
  } catch {
    fill(root, h('div', { class: 'auth-wrap' }, h('div', { class: 'auth' }, h('h2', null, 'Can\'t reach the OpenPilates server.'), h('p', null, 'Check the container is running, then reload.'))));
    return;
  }
  if (store.state.setupNeeded) return mount(await setupView(render));
  if (!store.user) return mount(await loginView(render));

  for (const [re, view] of routes) {
    const m = path.match(re);
    if (!m) continue;
    try {
      await Promise.all([store.loadMovements(), store.loadStudio(), store.loadClients()]);
      const result = await view(m, query);
      if (result.fullscreen) return mount(result.node, result.cleanup);
      const active = path === '/' || path.startsWith('/flows') ? '/' : path.startsWith('/explore') || path.startsWith('/movements') ? '/explore' : '/' + path.split('/')[1];
      mount(shell(active, result.node || result), result.cleanup);
      if (result.title) document.title = `${result.title} · OpenPilates`;
      else document.title = 'OpenPilates';
    } catch (e) {
      console.error(e);
      mount(shell('', h('div', { class: 'empty' }, h('h3', null, 'Something went wrong'), h('p', null, e.message), h('a', { class: 'btn', href: '#/' }, 'Back to flows'))));
    }
    return;
  }
  mount(shell('', h('div', { class: 'empty' }, h('h3', null, 'Page not found'), h('a', { class: 'btn', href: '#/' }, 'Back to flows'))));
}

function mount(nodes, onCleanup) {
  fill(root, nodes);
  cleanup = onCleanup || null;
  window.scrollTo(0, 0);
}

window.addEventListener('hashchange', render);
window.addEventListener('op:signed-out', () => { if (store.state) store.state.user = null; store.reset(); toast('Your session ended. Please sign in again.'); render(); });
render();
