import { h, icon, toast, fill } from './ui.js';
import { api, store, keepViews } from './store.js';
import { setupView, loginView } from './views/auth.js';
import { flowsView, newFlowView } from './views/flows.js';
import { flowView } from './views/flow.js';
import { exploreView } from './views/explore.js';
import { movementView, movementEditView } from './views/movement.js';
import { studioView, clientsView, teamView, accountView } from './views/studio.js';
import { guideView } from './views/guide.js';
import { reviewView, removedView } from './views/review.js';

const root = document.getElementById('app');
let cleanup = null;

const routes = [
  [/^\/?$/, () => flowsView()],
  [/^\/flows\/new$/, () => newFlowView()],
  [/^\/flows\/([\w-]+)(?:\/(build|analysis|play|sheet))?$/, (m) => flowView(m[1], m[2] || 'build')],
  [/^\/explore$/, (m, q) => exploreView(q)],
  [/^\/movements\/new$/, () => movementEditView(null)],
  [/^\/movements\/([\w-]+)\/edit$/, (m) => movementEditView(m[1])],
  [/^\/movements\/([\w-]+)$/, (m) => movementView(m[1])],
  [/^\/studio$/, () => studioView()],
  [/^\/clients$/, () => clientsView()],
  [/^\/team$/, () => teamView()],
  [/^\/account$/, () => accountView()],
  [/^\/guide$/, () => guideView()],
  [/^\/review$/, () => reviewView()],
  [/^\/removed$/, () => removedView()]
];

// Where you came from, so "back" returns you there instead of to a fixed page.
//  - origin: the last page that wasn't a movement page (a flow, the explorer, the review list…)
//  - playFrom: the page Play mode was started from
export const nav = { origin: '/explore', playFrom: null, last: null, stack: [], returning: false, pushedFrom: null };
let scrolls = {};
try { scrolls = JSON.parse(sessionStorage.getItem('op.scroll') || '{}'); } catch { scrolls = {}; }
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
const firstLoadIsReturn = (() => { try { const t = performance.getEntriesByType('navigation')[0]?.type; return t === 'reload' || t === 'back_forward'; } catch { return false; } })();
export function backLink(fallbackLabel = 'Movements') {
  const o = nav.origin || '/explore';
  const label = /^\/flows\/[\w-]+/.test(o) ? 'Back to the flow' : o === '/' ? 'Flows' : o.startsWith('/review') ? 'Back to the review list' : o.startsWith('/removed') ? 'Back to removed movements' : o.startsWith('/clients') ? 'Clients' : o.startsWith('/guide') ? 'Guide' : o.startsWith('/studio') ? 'Studio' : fallbackLabel;
  // When the page you came from is the one right behind you in the browser's history, go back
  // to it properly, so the browser's own Back and Forward stay in step with the app.
  const onclick = (e) => { if (nav.pushedFrom === o && !e.ctrlKey && !e.metaKey && !e.shiftKey && e.button === 0) { e.preventDefault(); history.back(); } };
  return { href: '#' + o, label, onclick };
}
function track(full, path) {
  if (nav.last === full) { nav.returning = false; return; }
  const st = nav.stack;
  if (nav.last === null) { nav.returning = firstLoadIsReturn; nav.pushedFrom = null; st.push(full); }
  else if (st.length > 1 && st[st.length - 2] === full) { st.pop(); nav.returning = true; nav.pushedFrom = null; } // back to the page before
  else { nav.returning = false; nav.pushedFrom = st[st.length - 1] || null; st.push(full); if (st.length > 60) st.shift(); }
  const isPlay = /^\/flows\/[\w-]+\/play$/.test(path);
  if (isPlay) { if (!nav.playFrom) nav.playFrom = nav.last && !/\/play$/.test(nav.last) ? nav.last : null; } else nav.playFrom = null;
  if (!path.startsWith('/movements/') && !isPlay) nav.origin = full;
  nav.last = full;
}

// Going to the page you are already on re-draws it (the browser fires no event for that).
export function go(path) { if (location.hash === '#' + path) render(); else location.hash = '#' + path; }

function currentPath() {
  const raw = location.hash.replace(/^#/, '') || '/';
  const [path, qs] = raw.split('?');
  return { path, query: new URLSearchParams(qs || '') };
}

function shell(active, content) {
  const nav = [['/', 'Flows', 'list'], ['/explore', 'Movements', 'compass'], ['/clients', 'Clients', 'user'], ['/studio', 'Studio', 'home']];
  const tabs = [...nav, ['/guide', 'Guide', 'help']];
  const user = store.user;
  return [
    h('header', { class: 'topbar no-print' },
      h('a', { class: 'brand', href: '#/' },
        h('img', { src: '/icon.svg', width: 28, height: 28, alt: '' }), 'OpenPilates', h('span', { class: 'brand-tag' }, 'Server')),
      h('nav', { class: 'nav', 'aria-label': 'Main' },
        nav.map(([p, l]) => h('a', { href: '#' + p, class: active === p ? 'on' : null, 'aria-current': active === p ? 'page' : null }, l)),
        store.isAdmin ? h('a', { href: '#/team', class: active === '/team' ? 'on' : null, 'aria-current': active === '/team' ? 'page' : null }, 'Team') : null,
        h('a', { href: '#/guide', class: active === '/guide' ? 'on' : null, 'aria-current': active === '/guide' ? 'page' : null }, 'Guide')),
      h('div', { class: 'spacer' }),
      h('div', { class: 'userchip' },
        h('span', { class: 'who' }, store.state?.studioName ? `${store.state.studioName} · ` : '', user?.displayName),
        h('button', { class: 'btn btn-sm btn-ghost', title: window.opTheme.isDark() ? 'Switch to light mode' : 'Switch to dark mode', 'aria-label': window.opTheme.isDark() ? 'Switch to light mode' : 'Switch to dark mode', onclick: () => { window.opTheme.set(window.opTheme.isDark() ? 'light' : 'dark'); render(); } }, icon(window.opTheme.isDark() ? 'sun' : 'moon', 18)),
        h('a', { href: '#/account', class: 'btn btn-sm btn-ghost', title: 'Your account', 'aria-label': 'Your account' }, icon('user', 18)),
        h('button', { class: 'btn btn-sm btn-ghost', title: 'Sign out', 'aria-label': 'Sign out', onclick: async () => { await api('POST', '/logout'); store.state.user = null; store.reset(); if (location.hash && location.hash !== '#/') location.hash = '#/'; else render(); } }, icon('logout', 18)))),
    h('main', { class: 'page', id: 'main' }, content),
    h('nav', { class: 'tabbar no-print', 'aria-label': 'Tabs' },
      tabs.map(([p, l, ic]) => h('a', { href: '#' + p, class: active === p ? 'on' : null, 'aria-current': active === p ? 'page' : null }, icon(ic, 22), l)))
  ];
}

export async function render() {
  document.querySelectorAll('.modal-overlay').forEach((x) => x.remove());
  // Remember how far down the page we were, and what its filters were, before leaving it.
  if (nav.last) { scrolls[nav.last] = Math.round(window.scrollY); try { sessionStorage.setItem('op.scroll', JSON.stringify(scrolls)); } catch { /* ignore */ } }
  keepViews();
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
      await Promise.all([store.loadMovements(), store.loadStudio(), store.loadClients(), store.loadSeries()]);
      track(location.hash.replace(/^#/, '') || '/', path);
      const result = await view(m, query);
      if (result.fullscreen) return mount(result.node, result.cleanup);
      const active = path === '/' || path.startsWith('/flows') ? '/' : path.startsWith('/explore') || path.startsWith('/movements') ? '/explore' : '/' + path.split('/')[1];
      mount(shell(active, result.node || result), result.cleanup);
      if (result.title) document.title = `${result.title} · OpenPilates Server`;
      else document.title = 'OpenPilates Server';
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
  // Coming back to a page returns you to where you were on it; a new page starts at the top.
  const y = nav.returning && nav.last ? scrolls[nav.last] || 0 : 0;
  window.scrollTo(0, y);
  if (y) requestAnimationFrame(() => window.scrollTo(0, y));
}

window.addEventListener('hashchange', render);
window.addEventListener('pagehide', () => { if (nav.last) { scrolls[nav.last] = Math.round(window.scrollY); try { sessionStorage.setItem('op.scroll', JSON.stringify(scrolls)); } catch { /* ignore */ } } keepViews(); });
window.addEventListener('op:signed-out', () => { if (store.state) store.state.user = null; store.reset(); toast('Your session ended. Please sign in again.'); render(); });
render();
