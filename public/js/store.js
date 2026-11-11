// API client and shared caches.
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

export const store = {
  state: null, // { version, setupNeeded, user, studioName }
  movements: null, // { slug: movement }
  movementList: null,
  studio: null,
  clients: null,

  async loadState() { this.state = await api('GET', '/state'); return this.state; },
  get user() { return this.state && this.state.user; },
  get isAdmin() { return this.user && this.user.role === 'admin'; },

  async loadMovements(force) {
    if (this.movements && !force) return this.movements;
    const list = await api('GET', '/movements');
    this.movementList = list.sort((a, b) => a.name.localeCompare(b.name));
    this.movements = Object.fromEntries(list.map((m) => [m.slug, m]));
    return this.movements;
  },
  async loadStudio(force) {
    if (this.studio && !force) return this.studio;
    this.studio = await api('GET', '/studio');
    return this.studio;
  },
  async loadClients(force) {
    if (this.clients && !force) return this.clients;
    this.clients = await api('GET', '/clients');
    return this.clients;
  },
  reset() { this.movements = this.movementList = this.studio = this.clients = null; },

  // The room a flow uses decides which spring colours are shown.
  roomFor(flow) {
    const rooms = (this.studio && this.studio.rooms) || [];
    return rooms.find((r) => r.id === flow?.room) || rooms.find((r) => r.apparatus === (flow?.apparatus === 'mat' ? 'mat' : 'reformer')) || rooms[0] || { brand: 'balanced_body', springOverrides: {} };
  },
  analysisContext(flow) {
    const clients = (flow.booked || []).map((b) => {
      const c = (this.clients || []).find((x) => x.id === b.clientId);
      return c ? { id: c.id, name: c.name, tags: c.tags, spot: b.spot } : null;
    }).filter(Boolean);
    return { flow, movements: this.movements || {}, studio: { props: this.studio?.props || {}, targets: this.studio?.targets }, clients };
  }
};
