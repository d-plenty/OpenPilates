// Run sheet: the whole flow on one printable page.
import { h, icon, btn } from '../ui.js';
import { store } from '../store.js';
import { analyze, itemDuration, fmtClock } from '/shared/analysis.js';
import { LEVELS, FORMATS, labelOf } from '/shared/vocab.js';
import { springDots, fmtMin, setOutCard, thumb, posLabel } from './common.js';
import { itemExtras } from './options.js';

export function sheetView(flow) {
  const room = store.roomFor(flow);
  const a = analyze(store.analysisContext(flow));
  const plan = new Map(a.springPlan.filter((p) => p.pass === 1).map((p) => [p.itemId, p]));
  let showCues = true;
  let n = 0;
  const cuesOf = (mv) => (mv.cues || '').split('\n').filter(Boolean).slice(0, 3);

  const body = h('div');
  const draw = () => {
    n = 0;
    body.replaceChildren(...flow.segments.filter((s) => s.items.length).map((seg) => {
      const sec = seg.items.reduce((t, i) => t + itemDuration(i, store.movements[i.slug]), 0) * (seg.bothSides ? 2 : 1);
      return h('section', null,
        h('h2', null, seg.name, h('span', { class: 'tiny muted' }, `${fmtMin(sec)}${seg.bpm ? ` · ${seg.bpm} BPM` : ''}${seg.song ? ` · ${seg.song}` : ''}${seg.bothSides ? ' · teach one side, then repeat on the other' : ''}`)),
        h('table', null,
          h('thead', null, h('tr', null, h('th', { class: 'n' }, '#'), h('th', null, 'Movement'), h('th', null, 'Springs'), h('th', null, 'Reps / time'), showCues ? h('th', null, 'Cues') : null)),
          h('tbody', null, seg.items.map((item) => {
            const mv = store.movements[item.slug];
            if (!mv) return h('tr', null, h('td', { class: 'n' }, ++n), h('td', { colspan: 4 }, `Missing movement: ${item.slug}`));
            const p = plan.get(item.id);
            const row = h('tr', null,
              h('td', { class: 'n' }, ++n),
              h('td', null, h('div', { class: 'item-main' }, h('span', { class: 'item-thumb' }, thumb(mv, { width: 54, photo: false })),
                h('div', null, h('b', null, mv.name), h('div', { class: 'tiny muted' }, posLabel(mv.position), mv.setup?.headrest && mv.setup.headrest !== 'any' ? ` · headrest ${mv.setup.headrest}` : '', mv.perSide ? ' · each side' : ''),
                  itemExtras(item, mv, room),
                  item.note ? h('div', { class: 'tiny', style: { marginTop: '4px' } }, h('b', null, 'Note: '), item.note) : null))),
              h('td', null, mv.apparatus === 'reformer' ? springDots(p ? p.loads : (item.load?.springs || mv.load?.springs || []), room) : 'Mat'),
              h('td', null, item.reps || mv.reps || '', h('div', { class: 'tiny muted' }, fmtClock(itemDuration(item, mv)))),
              showCues ? h('td', { class: 'small' }, cuesOf(mv).map((c) => h('div', null, '• ', c))) : null);
            return p && p.changed ? [h('tr', { class: 'chg' }, h('td', { colspan: showCues ? 5 : 4 }, 'Change springs → ', springDots(p.loads, room))), row] : row;
          }))));
    }));
  };
  draw();

  return { title: `${flow.title} · run sheet`, node: h('div', { class: 'sheet' },
    h('div', { class: 'page-head' },
      h('div', { class: 'grow' }, h('a', { href: `#/flows/${flow.id}`, class: 'small no-print' }, '← Back to the builder'),
        h('h1', null, flow.title),
        h('p', { class: 'small muted' }, [flow.apparatus === 'mat' ? 'Mat' : flow.apparatus === 'mixed' ? 'Mixed' : 'Reformer', labelOf(LEVELS, flow.level), flow.format && flow.format !== 'open' ? labelOf(FORMATS, flow.format) : '', fmtMin(a.totalSec), `${a.count} movements`, a.hasReformer ? `${a.springChanges} spring change${a.springChanges === 1 ? '' : 's'}` : ''].filter(Boolean).join(' · '))),
      h('div', { class: 'btn-row no-print' },
        h('label', { class: 'btn' }, h('input', { type: 'checkbox', checked: showCues, onchange: (e) => { showCues = e.target.checked; draw(); } }), 'Show cues'),
        btn('Print', () => window.print(), { iconName: 'print', kind: 'primary' }),
        h('a', { class: 'btn', href: `#/flows/${flow.id}/play` }, icon('play'), 'Play'))),
    setOutCard(a, room),
    body,
    h('p', { class: 'tiny muted', style: { marginTop: '14px' } }, 'Client names and health notes are never printed on the run sheet.')) };
}
