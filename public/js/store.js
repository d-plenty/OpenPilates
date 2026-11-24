// API client and shared caches.
import { applyStudioLists, flowTiming } from '/shared/vocab.js';
export class ApiError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

export async function api(method, path, body) {
  const res = await fetch('/api' + path, {
    method,
    credentials: 'same-origin',
    headers: { ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(method !== 'GET' ? { 'X-OpenPilates': '1' } : {}) },
    body: body !== undefined ? JSON.stringify(body) : undefined
  });
  let data = null;
  try { data = await res.json(); } catch { /* empty */ }
  if (!res.ok) {
    if (res.status === 401 && !path.startsWith('/login') && !path.startsWith('/state')) window.dispatchEvent(new CustomEvent('op:signed-out'));
    throw new ApiError(res.status, (data && data.error) || `Request failed (${res.status}).`);
  }
  return data;
}

// What each screen was showing (filters, search, the open category), so coming back puts you
// where you were instead of at the start. Kept for this browser tab, including across a reload.
const VIEW_KEY = 'op.views';
let views = null;
const loadViews = () => { if (!views) { try { views = JSON.parse(sessionStorage.getItem(VIEW_KEY) || '{}'); } catch { views = {}; } } return views; };
export function viewState(key, defaults) { const v = loadViews(); v[key] = { ...defaults, ...(v[key] || {}) }; return v[key]; }
export function keepViews() { if (!views) return; try { sessionStorage.setItem(VIEW_KEY, JSON.stringify(views)); } catch { /* private mode: memory only */ } }
export function forgetViews() { views = {}; try { sessionStorage.removeItem(VIEW_KEY); sessionStorage.removeItem('op.scroll'); } catch { /* ignore */ } }

export const store = {
  state: null, // { version, setupNeeded, user, studioName }
  movements: null, // { slug: movement }
  movementList: null,
  studio: null,
  clients: null,
  series: null,

  async loadState() { this.state = await api('GET', '/state'); return this.state; },
  get user() { return this.state && this.state.user; },
  get isAdmin() { return this.user && this.user.role === 'admin'; },

  async loadMovements(force) {
    if (this.movements && !force) return this.movements;
    const list = await api('GET', '/movements');
    // Movements taken out of the library stay resolvable (old flows still open) but are not offered anywhere.
    this.removedList = list.filter((m) => m.hidden).sort((a, b) => a.name.localeCompare(b.name));
    this.movementList = list.filter((m) => !m.hidden).sort((a, b) => a.name.localeCompare(b.name));
    this.movements = Object.fromEntries(list.map((m) => [m.slug, m]));
    return this.movements;
  },
  async loadSeries(force) {
    if (this.series && !force) return this.series;
    const all = await api('GET', '/series');
    this.removedSeries = all.filter((s) => s.hidden);
    this.series = all.filter((s) => !s.hidden);
    return this.series;
  },
  async loadStudio(force) {
    if (this.studio && !force) return this.studio;
    this.studio = await api('GET', '/studio');
    applyStudioLists(this.studio);
    return this.studio;
  },
  async loadClients(force) {
    if (this.clients && !force) return this.clients;
    this.clients = await api('GET', '/clients');
    return this.clients;
  },
  reset() { this.movements = this.movementList = this.studio = this.clients = this.series = null; forgetViews(); },

  // The room a flow uses decides which spring colours are shown.
  roomFor(flow) {
    const rooms = (this.studio && this.studio.rooms) || [];
    return rooms.find((r) => r.id === flow?.room) || rooms.find((r) => r.apparatus === (flow?.apparatus === 'mat' ? 'mat' : 'reformer')) || rooms[0] || { brand: 'balanced_body', springOverrides: {} };
  },
  // The seconds a flow counts with: the studio's timing, with its class type's own on top.
  timingFor(flow) { return flowTiming(this.studio, flow); },
  analysisContext(flow) {
    const clients = (flow.booked || []).map((b) => {
      const c = (this.clients || []).find((x) => x.id === b.clientId);
      return c ? { id: c.id, name: c.name, tags: c.tags, spot: b.spot } : null;
    }).filter(Boolean);
    return { flow, movements: this.movements || {}, studio: { props: this.studio?.props || {}, targets: this.studio?.targets, timing: this.studio?.timing, classTypes: this.studio?.classTypes }, clients };
  }
};
