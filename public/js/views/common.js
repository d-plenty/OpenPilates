import { h, icon, btn } from '../ui.js';
import { POSITIONS, LEVELS, labelOf, SPINE, MUSCLES, springLabel } from '/shared/vocab.js';
import { fmtClock, fmtMin } from '/shared/analysis.js';
import { bodyMap, bodyLegend, radar, intensityChart, positionStrip, positionKey, purposeBars, springDots } from '../charts.js';

export const posColor = (id) => (POSITIONS.find((p) => p.id === id) || { color: '#56625C' }).color;
export const posLabel = (id) => labelOf(POSITIONS, id);
export const muscleLabel = (id) => labelOf(MUSCLES, id);

export function initials(name) {
  return name.replace(/\(.*?\)|—.*$/g, '').split(/\s+/).filter(Boolean).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

export function mvMeta(mv, room) {
  const parts = [mv.apparatus === 'mat' ? 'Mat' : 'Reformer', posLabel(mv.position)];
  if (mv.apparatus === 'reformer' && mv.load) parts.push(springLabel(room.brand, mv.load.springs, room.springOverrides));
  return parts.join(' · ');
}

export function movementCard(mv, room, { draggable, onAdd, addLabel = 'Add', inFlow, extraTags = [] } = {}) {
  const card = h('div', { class: 'mv-card', draggable: draggable ? 'true' : null },
    h('div', { class: 'thumb', style: { background: posColor(mv.position) }, 'aria-hidden': 'true' }, initials(mv.name)),
    h('div', { class: 'body' },
      h('a', { class: 'name', href: `#/movements/${mv.slug}`, style: { color: 'inherit', textDecoration: 'none' } }, mv.name),
      h('div', { class: 'meta' }, mvMeta(mv, room)),
      h('div', { class: 'tags' },
        (mv.spine || []).filter((s) => s !== 'neutral').map((s) => h('span', { class: 'tag' }, labelOf(SPINE, s))),
        h('span', { class: 'tag' }, labelOf(LEVELS, mv.level)),
        mv.source !== 'library' ? h('span', { class: 'tag tag-accent' }, mv.source === 'studio' ? 'Studio edit' : 'Custom') : null,
        extraTags)),
    onAdd ? h('button', { type: 'button', class: ['btn', 'btn-sm', !addLabel && 'btn-icon', inFlow ? '' : 'btn-primary'], onclick: (e) => { e.stopPropagation(); onAdd(mv); }, 'aria-label': `${addLabel || 'Add'} ${mv.name}`, title: addLabel ? null : `Add ${mv.name}` },
      inFlow ? icon('check', 16) : icon('plus', 16), addLabel ? h('span', null, inFlow ? 'In flow' : addLabel) : null) : null);
  if (draggable) card.addEventListener('dragstart', (e) => { e.dataTransfer.setData('text/x-op-slug', mv.slug); e.dataTransfer.effectAllowed = 'copy'; });
  return card;
}

export function checksList(checks, { limit } = {}) {
  const list = limit ? checks.slice(0, limit) : checks;
  return h('ul', { class: 'checks' }, list.map((c) => h('li', { class: ['check', c.level] },
    h('i', { class: 'dot', 'aria-hidden': 'true' }),
    h('div', null, h('b', null, c.title), h('span', null, c.body)))));
}

export function statTiles(a) {
  return h('section', { class: 'stats', 'aria-label': 'Flow summary' },
    tile(fmtMin(a.totalSec), 'Total time'),
    tile(`${a.count}`, 'Movements'),
    tile(`${a.movingPct}%`, 'Time moving', a.movingPct >= 85 ? 'good' : a.movingPct < 80 ? 'warn' : ''),
    tile(`${a.positionChanges}`, 'Position changes'),
    tile(`${a.springChanges}`, 'Spring changes'),
    tile(`${a.clientChecks.length}`, 'Client checks', a.clientChecks.length ? 'warn' : ''));
}
const tile = (v, l, cls) => h('div', { class: ['stat', cls] }, h('b', null, v), h('span', null, l));

export function radarCard(a) {
  return h('div', { class: 'card' },
    h('div', { class: 'card-head' }, h('h2', null, 'Spine movement'), h('div', { class: 'spacer' }), h('span', { class: 'tiny muted' }, `vs ${a.target.label || 'target'}`)),
    h('div', { style: { display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' } },
      radar(a.spine, a.target),
      h('table', { class: 'tbl', style: { flex: '1 1 150px' } },
        h('thead', null, h('tr', null, h('th', { scope: 'col' }, 'Direction'), h('th', { scope: 'col', style: { textAlign: 'right' } }, 'Flow'), h('th', { scope: 'col', style: { textAlign: 'right' } }, 'Target'))),
        h('tbody', null, [['flexion', 'Flexion'], ['extension', 'Extension'], ['rotation', 'Rotation'], ['side-bend', 'Side bend']].map(([k, l]) => {
          const low = a.spine[k] - (a.target[k] || 0) <= -8;
          return h('tr', null, h('td', null, l), h('td', { style: { textAlign: 'right', fontWeight: 700, color: low ? '#A9481A' : null } }, `${a.spine[k]}%`), h('td', { style: { textAlign: 'right' } }, `${a.target[k] || 0}%`));
        })))));
}

export function bodyCard(a, { size = 110 } = {}) {
  const levels = Object.fromEntries(a.muscles.map((m) => [m.id, m.level]));
  const gaps = new Set();
  if (a.spine.extension === 0 && a.count) gaps.add('spinal_extensors');
  return h('div', { class: 'card' },
    h('div', { class: 'card-head' }, h('h2', null, 'Muscles worked'), h('div', { class: 'spacer' }), h('span', { class: 'tiny muted' }, `Front ${a.frontBack.F}% · back ${a.frontBack.B}%`)),
    bodyMap(levels, { size, gaps }), bodyLegend());
}

export function intensityCard(a, flow) {
  return h('div', { class: 'card' },
    h('div', { class: 'card-head' }, h('h2', null, 'Effort & tempo'),
      h('span', { class: 'tiny muted' }, a.peak ? `Peak: ${a.peak.name} at ${a.peak.pct}%` : ''),
      h('div', { class: 'spacer' }),
      h('span', { class: 'legend', style: { margin: 0 } }, h('span', null, h('i', { style: { background: '#0F6E62' } }), 'Effort'), h('span', null, h('i', { style: { background: '#7A4FA0' } }), 'BPM'))),
    intensityChart(a, flow));
}

export function positionsCard(a) {
  return h('div', { class: 'card' },
    h('div', { class: 'card-head' }, h('h2', null, 'Body positions'), h('span', { class: 'tiny muted' }, `${a.positionChanges} change${a.positionChanges === 1 ? '' : 's'}`)),
    a.timeline.length ? positionStrip(a.timeline) : h('p', { class: 'muted small' }, 'No movements yet.'),
    positionKey(a.positionMinutes),
    h('h3', { style: { margin: '14px 0 6px' } }, 'Time moving vs setting up'),
    h('div', { class: 'split' },
      h('div', { style: { width: a.movingPct + '%', background: '#0F6E62', color: '#fff' } }, `Moving · ${fmtMin(a.movingSec)}`),
      h('div', { style: { width: (100 - a.movingPct) + '%', background: '#E3BC2C', color: '#16201C' } }, fmtMin(a.transitionSec))),
    h('p', { class: 'tiny muted', style: { marginTop: '6px' } }, `${a.springChanges} spring change${a.springChanges === 1 ? '' : 's'}, ${a.boxChanges} box/board change${a.boxChanges === 1 ? '' : 's'}, ${a.positionChanges} position change${a.positionChanges === 1 ? '' : 's'}. Estimated at 15 s, 45 s and 20 s each.`));
}

export function focusCard(a) {
  const total = a.multiJoint.multi + a.multiJoint.isolated || 1;
  const pct = Math.round((a.multiJoint.multi / total) * 100);
  return h('div', { class: 'card' },
    h('h2', null, 'Training focus'),
    purposeBars(a.purpose),
    h('h3', { style: { margin: '12px 0 6px' } }, 'Full-body vs isolated'),
    h('div', { class: 'split' },
      h('div', { style: { width: pct + '%', background: '#3E6FA0', color: '#fff' } }, `Multi-joint · ${a.multiJoint.multi}`),
      h('div', { style: { width: (100 - pct) + '%', background: '#C9D9EA', color: '#16201C' } }, `${a.multiJoint.isolated}`)));
}

export function muscleListCard(a) {
  return h('div', { class: 'card' },
    h('h2', null, 'Muscle breakdown'),
    a.muscles.slice(0, 12).map((m) => h('div', { style: { display: 'grid', gridTemplateColumns: '130px minmax(0,1fr) 28px', gap: '8px', alignItems: 'center', fontSize: '12px', marginBottom: '6px' } },
      h('span', { style: { fontWeight: 600 } }, m.label),
      h('div', { class: 'bar-track' }, h('div', { class: 'bar-fill', style: { width: Math.round(m.level * 100) + '%', background: m.side === 'B' ? '#2F4A3F' : '#0F6E62' } })),
      h('span', { style: { textAlign: 'right' } }, m.count))),
    h('p', { class: 'tiny muted' }, 'Number = movements that target it. Darker bars are back of body.'));
}

export function clientsCard(a, { onSwap } = {}) {
  if (!a.clientChecks.length) return null;
  return h('div', { class: 'card' },
    h('h2', null, 'Client checks'),
    a.clientChecks.map((c) => h('div', { style: { border: '1px solid #EBC9B1', background: '#FFFAF6', borderRadius: '12px', padding: '12px 14px', marginTop: '8px' } },
      h('div', { style: { display: 'flex', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' } }, h('b', null, c.client.name), c.client.spot ? h('span', { class: 'tiny muted' }, c.client.spot) : null),
      c.issues.map((i) => h('div', { class: 'swap-row' },
        h('span', { class: 'tag tag-warn' }, i.tagLabel),
        h('b', null, i.name),
        i.swap ? [icon('next', 14), h('span', { style: { color: '#0A5047', fontWeight: 600 } }, i.swap.name), onSwap ? btn('Swap', () => onSwap(i), { small: true }) : null] : h('span', { class: 'muted' }, 'no automatic swap'),
        i.note ? h('div', { class: 'tiny muted', style: { flexBasis: '100%' } }, i.note) : null)))),
    h('p', { class: 'tiny muted', style: { marginTop: '8px' } }, 'Suggestions come from each movement\'s cautions. You decide what\'s right for the client.'));
}

export { fmtClock, fmtMin, springDots };
