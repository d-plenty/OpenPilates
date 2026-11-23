import { h, icon, btn, modal } from '../ui.js';
import { POSITIONS, labelOf, SPINE, MUSCLES, SECTIONS, OPTION_KINDS, springLabel, sectionOf, levelLabel, fitSprings, variationsOf } from '/shared/vocab.js';
import { figure, figurePair } from '../figure.js';
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
  if (mv.apparatus === 'reformer' && mv.load) parts.push(springLabel(room.brand, fitSprings(mv.load.springs, room).loads, room.springOverrides));
  return parts.join(' · ');
}

export const sectionLabel = (mv) => labelOf(SECTIONS, sectionOf(mv));

const PREG_TAG = { recommended: ['Pregnancy-friendly', 'tag-accent'], supine: ['Pregnancy: keep it short', ''], early_only: ['Pregnancy: first 12 wks only', 'tag-warn'], avoid: ['Not in pregnancy', 'tag-warn'] };
export function pregnancyTag(mv) {
  const p = PREG_TAG[mv.pregnancy];
  return p ? h('span', { class: ['tag', p[1]] }, p[0]) : null;
}

// The picture for a movement: the studio's own photo if there is one, otherwise the drawn figure.
export function thumb(mv, { width = 72, photo = true } = {}) {
  if (photo && mv.photo) return h('img', { class: 'thumb-photo', src: mv.photo, alt: `${mv.name}${mv.photoCredit ? ' — photo: ' + mv.photoCredit : ''}`, width, height: Math.round(width * 0.66), loading: 'lazy' });
  return h('span', { class: 'thumb-fig', style: { width: width + 'px' } }, figure(mv, { width }));
}

// "20–30" on its own means nothing to a reader, so bare numbers get the word "reps".
export const repsLabel = (r) => { const t = String(r || '').trim(); return !t ? '' : /^[\d\s–\-to]+$/.test(t) ? `${t} reps` : /^[\d–\-]+ each/.test(t) ? t.replace(/^([\d–\-]+) each/, '$1 reps each') : t; };

const KIND = Object.fromEntries(OPTION_KINDS.map((k) => [k.id, k]));
// One line per variation: mark, name, springs if it has its own, and the note.
export function variationList(mv, room) {
  const vs = variationsOf(mv);
  if (!vs.length) return null;
  return h('ul', { class: 'var-list' }, ['variation', 'progression', 'regression'].flatMap((k) => vs.filter((v) => v.kind === k)).map((v) => h('li', { class: `var-${v.kind}` },
    h('span', { class: 'var-k', title: KIND[v.kind].hint }, `${KIND[v.kind].mark} ${KIND[v.kind].label}`),
    h('span', null, h('b', null, v.name), v.springs && mv.apparatus === 'reformer' ? [' ', springDots(v.springs, room)] : null, v.note ? h('span', { class: 'muted' }, ` — ${v.note}`) : null))));
}

// A quick look at a movement without leaving the page you're on.
export function peekMovement(mv, room) {
  const body = (close) => h('div', { class: 'stack-sm peek' },
    (mv.aka || []).length ? h('p', { class: 'small muted', style: { margin: 0 } }, 'Also called: ', mv.aka.join(', ')) : null,
    h('div', { class: 'hero-figs' }, mv.photo ? h('figure', { style: { background: 'none', padding: 0 } }, h('img', { class: 'hero-photo', src: mv.photo, alt: mv.name, style: { maxHeight: '180px' } })) : null,
      figurePair(mv, { width: 200 }).map((f, i, all) => h('figure', null, f, h('figcaption', null, all.length === 1 ? 'Position' : i === 0 ? 'Start' : 'Finish')))),
    mv.summary ? h('p', { style: { margin: 0 } }, mv.summary) : null,
    h('dl', { class: 'kv' },
      mv.apparatus === 'reformer' ? [h('dt', null, 'Springs'), h('dd', null, springDots(mv.load?.springs || [], room), mv.load?.advance?.length ? [h('span', { class: 'tiny muted' }, ' · to progress '), springDots(mv.load.advance, room)] : null)] : null,
      h('dt', null, 'Level'), h('dd', null, levelLabel(mv)),
      h('dt', null, 'Works'), h('dd', null, mv.muscles.primary.map(muscleLabel).join(', '), mv.muscles.secondary.length ? h('span', { class: 'muted' }, ` · also ${mv.muscles.secondary.map(muscleLabel).join(', ')}`) : null),
      mv.reps ? [h('dt', null, 'Typical'), h('dd', null, repsLabel(mv.reps))] : null),
    (mv.layers || []).length ? h('div', null, h('h3', null, 'Layers'), h('ol', { class: 'small', style: { margin: '4px 0 0', paddingLeft: '20px' } }, mv.layers.map((l) => h('li', null, h('b', null, l.title), l.text ? ` — ${l.text}` : '')))) : null,
    variationsOf(mv).length ? h('div', null, h('h3', null, 'Variations'), variationList(mv, room)) : null,
    mv.cues ? h('div', null, h('h3', null, 'Cues'), h('ul', { class: 'cue-list' }, mv.cues.split('\n').filter(Boolean).map((c) => h('li', null, c)))) : null,
    mv.myNote ? h('div', null, h('h3', null, 'My notes'), h('p', { class: 'small', style: { margin: 0, whiteSpace: 'pre-wrap' } }, mv.myNote)) : null,
    h('p', { style: { margin: 0 } }, h('a', { href: `#/movements/${mv.slug}`, onclick: () => close(null) }, 'Open the full page')));
  return modal(mv.name, body, { wide: true, actions: [{ label: 'Close', value: false }] });
}

export function movementCard(mv, room, { draggable, onAdd, addLabel = 'Add', inFlow, extraTags = [], big, onOpen, hide } = {}) {
  const open = onOpen ? (e) => { e.preventDefault(); onOpen(mv); } : null;
  const dirs = (mv.spine || []).filter((s) => s !== 'neutral');
  const card = h('div', { class: ['mv-card', big && 'mv-card-big'], draggable: draggable ? 'true' : null },
    h('a', { class: 'thumb', href: `#/movements/${mv.slug}`, onclick: open, tabindex: '-1', 'aria-hidden': 'true', style: { borderColor: posColor(mv.position) } }, thumb(mv, { width: big ? 132 : 66 })),
    h('div', { class: 'body' },
      h('a', { class: 'name', href: `#/movements/${mv.slug}`, onclick: open, style: { color: 'inherit', textDecoration: 'none' } }, mv.name),
      big && (mv.aka || []).length ? h('div', { class: 'aka' }, mv.aka.slice(0, 2).join(' · ')) : null,
      h('div', { class: 'meta' }, mvMeta(mv, room)),
      // one quiet line of facts instead of a pile of tags; whatever the page is already sorted by is left out
      h('div', { class: 'facts' }, [hide !== 'section' && sectionLabel(mv), hide !== 'level' && levelLabel(mv), dirs.length && hide !== 'spine' && dirs.map((s) => labelOf(SPINE, s)).join(', '), mv.perSide && 'each side'].filter(Boolean).join(' · ')),
      mv.source !== 'library' || mv.check || extraTags.length ? h('div', { class: 'tags' },
        mv.source !== 'library' ? h('span', { class: 'tag tag-accent' }, mv.source === 'studio' ? 'Edited by us' : 'Ours') : null,
        mv.check ? h('span', { class: ['tag', mv.check.status === 'ok' ? 'tag-ok' : 'tag-warn'], title: mv.check.note || (mv.check.status === 'ok' ? `Checked by ${mv.check.by || 'your studio'}` : 'Flagged to fix') }, mv.check.status === 'ok' ? '✓ Checked' : 'To fix') : null,
        extraTags) : null),
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
    tile(`${a.count}`, a.count === 1 ? 'Block' : 'Blocks'),
    tile(`${a.movingPct}%`, 'Time moving', a.movingPct >= 85 ? 'good' : a.movingPct < 80 ? 'warn' : ''),
    tile(`${a.positionChanges}`, 'Position changes'),
    tile(a.hasReformer ? `${a.springChanges} / ${a.springBudget}` : '—', 'Spring changes / limit', a.hasReformer && a.springChanges > a.springBudget ? 'warn' : a.hasReformer ? 'good' : ''),
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
    h('div', { class: 'card-head' }, h('h2', null, 'Effort across the class'),
      h('span', { class: 'tiny muted' }, a.peak ? `Peak: ${a.peak.name} at ${a.peak.pct}%` : ''),
      h('div', { class: 'spacer' }),
      null),
    intensityChart(a, flow));
}

export function positionsCard(a) {
  return h('div', { class: 'card' },
    h('div', { class: 'card-head' }, h('h2', null, 'Body positions'), h('span', { class: 'tiny muted' }, `${a.positionChanges} change${a.positionChanges === 1 ? '' : 's'}`)),
    a.timeline.length ? positionStrip(a.timeline) : h('p', { class: 'muted small' }, 'No blocks yet.'),
    positionKey(a.positionMinutes),
    h('h3', { style: { margin: '14px 0 6px' } }, 'Time moving vs setting up'),
    h('div', { class: 'split' },
      h('div', { style: { width: a.movingPct + '%', background: '#0F6E62', color: '#fff' } }, `Moving · ${fmtMin(a.movingSec)}`),
      h('div', { style: { width: (100 - a.movingPct) + '%', background: '#E3BC2C', color: '#16201C' } }, fmtMin(a.transitionSec))),
    h('p', { class: 'tiny muted', style: { marginTop: '6px' } }, `${a.springChanges} spring change${a.springChanges === 1 ? '' : 's'}, ${a.boxChanges} box/board change${a.boxChanges === 1 ? '' : 's'}, ${a.positionChanges} position change${a.positionChanges === 1 ? '' : 's'}. Estimated at 15 s, 45 s and 20 s each.`));
}

// The spring setting for each stretch of the class, in teaching order.
export function springsCard(a, room, { compact } = {}) {
  if (!a.hasReformer) return null;
  const blocks = [];
  for (const p of a.springPlan) {
    const last = blocks[blocks.length - 1];
    if (last && !p.changed) { if (last.names[last.names.length - 1] !== p.name) last.names.push(p.name); } else blocks.push({ loads: p.loads, names: [p.name] });
  }
  const over = a.springChanges > a.springBudget;
  return h('div', { class: 'card' },
    h('div', { class: 'card-head' }, h('h2', null, 'Springs'), h('div', { class: 'spacer' }),
      h('span', { class: ['tag', over ? 'tag-warn' : 'tag-accent'] }, `${a.springChanges} change${a.springChanges === 1 ? '' : 's'} · limit ${a.springBudget}`)),
    blocks.length ? h('ol', { class: 'spring-map' }, blocks.map((b, i) => h('li', null,
      h('div', { class: 'sm-head' }, springDots(b.loads, room), h('span', { class: 'tiny muted' }, i === 0 ? 'Start' : `Change ${i}`), h('span', { class: 'tiny muted' }, `${b.names.length} block${b.names.length === 1 ? '' : 's'}`)),
      compact ? null : h('div', { class: 'tiny muted' }, b.names.join(' → '))))) : h('p', { class: 'muted small' }, 'No reformer blocks yet.'),
    h('p', { class: 'tiny muted', style: { marginTop: '8px' } }, 'A movement stays on the springs already set when its usual or progression setting matches. One of the lightest springs on or off is not counted as a change.'));
}

// What to put out before people arrive.
export function setOutCard(a, room) {
  const s = a.setOut;
  if (!a.count) return null;
  const rows = [];
  if (a.hasReformer && s.springs) rows.push(h('li', null, h('b', null, 'Start on '), springDots(s.springs, room)));
  if (s.straps.length) rows.push(h('li', null, h('b', null, 'Straps: '), s.straps.map((x) => (x === 'long' ? 'long loops (feet)' : 'short loops (hands)')).join(' and ')));
  for (const e of s.equipment) rows.push(h('li', null, h('b', null, e.label), e.have ? '' : h('span', { class: 'tag tag-warn', style: { marginLeft: '6px' } }, 'none listed in Studio'), h('div', { class: 'tiny muted' }, `for ${e.for.slice(0, 4).join(', ')}${e.for.length > 4 ? '…' : ''}`)));
  if (!rows.length) rows.push(h('li', { class: 'muted' }, 'Nothing extra — just the mat.'));
  return h('div', { class: 'card' }, h('h2', null, 'Set out before class'), h('ul', { class: 'setout' }, rows));
}

// Whole-body balance: body sections, stabilising vs moving work, and movement categories.
export function balanceCard(a) {
  return h('div', { class: 'card' },
    h('h2', null, 'Class balance'),
    h('h3', { style: { margin: '4px 0 6px' } }, 'Parts of the body'),
    a.sections.map((s) => h('div', { style: { display: 'grid', gridTemplateColumns: '120px minmax(0,1fr) 84px', gap: '8px', alignItems: 'center', fontSize: '12px', marginBottom: '6px' } },
      h('span', { style: { fontWeight: 600 } }, s.label),
      h('div', { class: 'bar-track' }, h('div', { class: 'bar-fill', style: { width: s.pct + '%', background: s.color } })),
      h('span', { style: { textAlign: 'right', color: s.sec ? null : '#A9481A', fontWeight: s.sec ? 400 : 700 } }, s.sec ? `${s.pct}% · ${fmtMin(s.sec)}` : 'none'))),
    h('h3', { style: { margin: '12px 0 6px' } }, 'Holding still vs moving'),
    h('div', { class: 'split' },
      h('div', { style: { width: Math.max(a.roles.stability, 8) + '%', background: '#3E6FA0', color: '#fff' } }, `Stability · ${a.roles.stability}%`),
      h('div', { style: { width: Math.max(a.roles.mobility, 8) + '%', background: '#D9C7E8', color: '#16201C' } }, `Mobility · ${a.roles.mobility}%`)),
    h('h3', { style: { margin: '12px 0 6px' } }, 'Movement categories'),
    h('div', { class: 'tags' }, a.categories.map((c) => h('span', { class: ['tag', c.count ? 'tag-accent' : 'tag-miss'], title: c.count ? `${c.count} movement${c.count === 1 ? '' : 's'}` : 'Not in this class yet' }, c.label, c.count ? ` ${c.count}` : ''))),
    h('p', { class: 'tiny muted', style: { marginTop: '8px' } }, 'Greyed-out categories are not in the class yet. Not every class needs all of them, but most rounded ones touch each at least once.'));
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
        h('span', { class: ['tag', i.severity === 'modify' ? '' : 'tag-warn'] }, i.tagLabel),
        h('b', null, i.name),
        i.severity === 'modify' ? h('span', { class: 'tag' }, 'Adjust') : i.swap ? [icon('next', 14), h('span', { style: { color: '#0A5047', fontWeight: 600 } }, i.swap.name), onSwap ? btn('Swap', () => onSwap(i), { small: true }) : null] : h('span', { class: 'muted' }, 'no automatic swap'),
        i.note ? h('div', { class: 'tiny muted', style: { flexBasis: '100%' } }, i.note) : null)))),
    h('p', { class: 'tiny muted', style: { marginTop: '8px' } }, '"Adjust" means teach it with the noted change; the rest are best swapped. Suggestions come from each movement\'s cautions. You decide what is right for the client, and refer on rather than diagnose.'));
}

export { fmtClock, fmtMin, springDots };
