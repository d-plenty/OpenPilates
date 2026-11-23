import { h, icon, fill } from '../ui.js';
import { store } from '../store.js';
import { go, nav } from '../app.js';
import { itemDuration, fmtClock, analyze } from '/shared/analysis.js';
import { CAUTIONS, labelOf, variationOf } from '/shared/vocab.js';
import { donut, springDots } from '../charts.js';
import { posLabel, thumb, repsLabel } from './common.js';
import { itemExtras } from './options.js';

export function playView(flow) {
  const room = store.roomFor(flow);
  const steps = [];
  const planOf = new Map(analyze(store.analysisContext(flow)).springPlan.map((p) => [`${p.itemId}:${p.pass}`, p]));
  flow.segments.forEach((seg, si) => (seg.bothSides ? [1, 2] : [1]).forEach((pass) => seg.items.forEach((item) => {
    const mv = store.movements[item.slug];
    if (mv) steps.push({ seg, si, item, mv, pass, dur: itemDuration(item, mv), plan: planOf.get(`${item.id}:${pass}`) });
  })));
  const total = steps.reduce((a, s) => a + s.dur, 0);
  const clients = store.analysisContext(flow).clients;

  let idx = 0;
  let left = steps[0]?.dur || 0;
  let running = false;
  let sound = true;
  let more = false; // set-up and cues stay folded away unless asked for
  let last = performance.now();
  let audio = null;
  let wake = null;

  const el = h('div', { class: 'play', role: 'region', 'aria-label': 'Play mode' });
  const beep = () => {
    if (!sound) return;
    try {
      audio = audio || new (window.AudioContext || window.webkitAudioContext)();
      const o = audio.createOscillator(); const g = audio.createGain();
      o.frequency.value = 880; g.gain.value = 0.08; o.connect(g); g.connect(audio.destination);
      o.start(); o.stop(audio.currentTime + 0.25);
    } catch { /* no audio */ }
  };
  const keepAwake = async () => { try { if ('wakeLock' in navigator && !wake) wake = await navigator.wakeLock.request('screen'); } catch { /* ignore */ } };

  const goTo = (i) => { idx = Math.max(0, Math.min(steps.length - 1, i)); left = steps[idx].dur; draw(); };
  const toggle = () => { running = !running; last = performance.now(); if (running) keepAwake(); draw(); };

  const tick = () => {
    if (!running || !steps.length) return;
    const now = performance.now();
    left -= (now - last) / 1000;
    last = now;
    if (left <= 0) {
      beep();
      if (idx < steps.length - 1) { idx++; left = steps[idx].dur; draw(); return; }
      left = 0; running = false;
    }
    drawClock();
  };
  const timer = setInterval(tick, 250);

  let clockEl = null;
  const drawClock = () => {
    if (!clockEl || !steps.length) return;
    const st = steps[idx];
    fill(clockEl, donut(1 - left / st.dur, { label: st.seg.name, big: fmtClock(left), sub: repsLabel(st.item.reps || st.mv.reps || '') }));
  };

  const draw = () => {
    if (!steps.length) {
      fill(el, h('div', { class: 'play-top' }, h('button', { class: 'round', onclick: exit, 'aria-label': 'Exit play mode' }, icon('close'))),
        h('div', { class: 'empty', style: { color: '#A7B5AF' } }, h('h3', { style: { color: '#fff' } }, 'Nothing to play yet'), h('p', null, 'Add some blocks to this flow first.')));
      return;
    }
    const st = steps[idx];
    const elapsedBefore = steps.slice(0, idx).reduce((a, s) => a + s.dur, 0) + (st.dur - left);
    const next = steps.slice(idx + 1, idx + 4);
    const loadsOf = (s) => (s.plan ? s.plan.loads : (s.item.load?.springs || s.mv.load?.springs || []));
    const nextChange = next[0] && next[0].plan && next[0].plan.changed;
    const setup = st.mv.setup || {};
    const setupBits = [setup.headrest && setup.headrest !== 'any' ? `Headrest ${setup.headrest}` : '', setup.straps && setup.straps !== 'none' ? `${setup.straps === 'long' ? 'Long' : 'Short'} loops` : '', ...(st.mv.equipment || []).map((e) => e.replace(/_/g, ' '))].filter(Boolean);
    const alerts = [];
    for (const c of clients) for (const ca of st.mv.cautions || []) if ((c.tags || []).includes(ca.tag)) alerts.push({ c, ca });
    const nextAlerts = [];
    if (next[0]) for (const c of clients) for (const ca of next[0].mv.cautions || []) if ((c.tags || []).includes(ca.tag)) nextAlerts.push({ c, ca });

    clockEl = h('div', { style: { display: 'flex', justifyContent: 'center' } });
    fill(el, 
      h('div', { class: 'play-top' },
        h('button', { class: 'round', onclick: exit, 'aria-label': 'Exit play mode' }, icon('close')),
        h('div', { style: { flex: 1 } },
          h('div', { class: 'tiny muted' }, `${flow.title} · block ${idx + 1} of ${steps.length} · ${fmtClock(elapsedBefore)} / ${fmtClock(total)}`),
          h('div', { class: 'progress' }, steps.map((s, i) => h('div', { style: { flex: `${s.dur} 1 0`, background: i < idx ? '#2BA391' : i === idx ? '#7FD3C3' : '#2E3B36' } })))),
        h('button', { class: 'round', onclick: () => { sound = !sound; draw(); }, 'aria-label': sound ? 'Turn sound off' : 'Turn sound on', title: sound ? 'Sound on' : 'Sound off', style: { opacity: sound ? 1 : 0.5 } }, icon('music'))),
      h('div', { class: 'play-body' },
        clockEl,
        h('div', { class: 'stack' },
          h('div', null,
            h('div', { class: 'now' }, 'NOW', st.seg.role === 'peak' ? ' · PEAK' : '', st.seg.bothSides ? (st.pass === 2 ? ' · SECOND SIDE' : ' · FIRST SIDE') : '', st.plan && st.plan.changed ? ' · SPRINGS CHANGED' : ''),
            h('h1', null, st.mv.name, variationOf(st.mv, st.item) ? h('span', { class: 'play-var' }, st.item.variation) : null),
            h('div', { class: 'muted', style: { marginTop: '6px', display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' } },
              st.mv.apparatus === 'reformer' ? springDots(loadsOf(st), room) : h('span', null, 'Mat'),
              h('span', null, posLabel(st.mv.position)),
              st.item.reps || st.mv.reps ? h('span', null, repsLabel(st.item.reps || st.mv.reps)) : null,
              setupBits.length ? h('span', null, setupBits.join(' · ')) : null,
              null)),
          itemExtras(st.item, st.mv, room, { dark: true }) ? h('div', { class: 'panel' }, h('div', { class: 'tiny muted' }, 'The plan for this block'), itemExtras(st.item, st.mv, room, { dark: true })) : null,
          st.item.note || st.mv.myNote ? h('div', { class: 'panel' }, h('div', { class: 'tiny muted' }, 'Your notes'), st.item.note ? h('div', null, st.item.note) : null, st.mv.myNote ? h('div', { style: { whiteSpace: 'pre-wrap' } }, st.mv.myNote) : null) : null,
          ...alerts.map(({ c, ca }) => h('div', { class: 'panel alert' }, h('b', null, `${c.name}${c.spot ? ' · ' + c.spot : ''}: ${labelOf(CAUTIONS, ca.tag)}`), h('div', { class: 'small' }, ca.note))),
          h('button', { type: 'button', class: 'play-more', 'aria-expanded': more ? 'true' : 'false', onclick: () => { more = !more; draw(); } }, more ? 'Hide picture, set-up and cues' : 'Picture, set-up and cues'),
          more ? h('div', { class: 'panel' },
            h('div', { class: 'play-fig' }, thumb(st.mv, { width: 230 })),
            st.mv.steps?.length ? [h('div', { class: 'tiny muted', style: { marginTop: '8px' } }, 'Set-up'), h('ol', { class: 'small' }, st.mv.steps.map((s) => h('li', null, s)))] : null,
            st.mv.cues ? [h('div', { class: 'tiny muted' }, 'Cues'), h('ul', { class: 'small' }, st.mv.cues.split('\n').filter(Boolean).map((c) => h('li', null, c)))] : null) : null,
          next.length ? h('div', { class: 'upnext' }, next.map((s, i) => h('div', null,
            h('span', { class: 'muted', style: { width: '44px' } }, i === 0 ? 'Next' : ''),
            h('span', { style: { flex: 1, fontWeight: 600 } }, s.mv.name, variationOf(s.mv, s.item) ? h('span', { class: 'muted', style: { fontWeight: 400 } }, ` · ${s.item.variation}`) : null, i === 0 && nextAlerts.length ? h('span', { style: { color: '#F2A979' } }, ` · check ${[...new Set(nextAlerts.map((x) => x.c.name))].join(', ')}`) : null),
            s.mv.apparatus === 'reformer' ? springDots(loadsOf(s), room) : h('span', { class: 'muted' }, 'Mat'),
            i === 0 && nextChange ? h('span', { style: { color: '#E8C547', fontWeight: 700, fontSize: '12px', flexBasis: '100%', paddingLeft: '54px' } }, 'SPRING CHANGE NEXT') : null))) : h('div', { class: 'panel' }, 'Last block.'))),
      h('div', { class: 'controls' },
        h('button', { onclick: () => goTo(idx - 1), 'aria-label': 'Previous block' }, icon('back', 24)),
        h('button', { class: 'main', onclick: toggle }, icon(running ? 'pause' : 'play', 20), running ? 'Pause' : (idx === 0 && left === st.dur ? 'Start' : 'Resume')),
        h('button', { onclick: () => goTo(idx + 1), 'aria-label': 'Next block' }, icon('next', 24))),
      h('p', { class: 'tiny muted', style: { textAlign: 'center' } }, 'Space to start or pause · arrow keys to move between blocks'));
    drawClock();
  };

  const onKey = (e) => {
    if (e.key === ' ') { e.preventDefault(); toggle(); }
    else if (e.key === 'ArrowRight') goTo(idx + 1);
    else if (e.key === 'ArrowLeft') goTo(idx - 1);
    else if (e.key === 'Escape') exit();
  };
  document.addEventListener('keydown', onKey);
  // Back to wherever Play was started from: the flows list, the builder or the run sheet.
  function exit() { go(nav.playFrom || `/flows/${flow.id}`); }
  const cleanup = () => { clearInterval(timer); document.removeEventListener('keydown', onKey); try { wake && wake.release(); } catch { /* ignore */ } };
  draw();
  return { fullscreen: true, node: el, cleanup };
}
