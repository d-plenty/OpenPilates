// Review list: a teacher works down the library and marks each movement right or wrong.
import { h, icon, btn, toast, fill } from '../ui.js';
import { api, store, viewState } from '../store.js';
import { APPARATUS, levelLabel, namesOf, usesOf, USES, labelOf } from '/shared/vocab.js';
import { thumb, muscleLabel, springDots, repsLabel } from './common.js';

export async function reviewView() {
  const st = viewState('review', { apparatus: 'reformer', show: 'todo', q: '' });
  const listEl = h('div', { class: 'review-list' });
  const countEl = h('span', { class: 'small muted' });
  const room = () => store.roomFor({ apparatus: st.apparatus === 'mat' ? 'mat' : 'reformer' });

  const mark = async (mv, status, note) => {
    try {
      const c = await api('PUT', `/movements/${mv.slug}/check`, { status, note });
      if (c && c.status) mv.check = c; else delete mv.check;
      draw();
    } catch (e) { toast(e.message, { kind: 'error' }); }
  };

  const row = (mv) => {
    const note = h('input', { type: 'text', value: mv.check?.note || '', placeholder: 'What is wrong? (name, springs, level, muscles, picture…)', 'aria-label': `Note for ${mv.name}` });
    return h('div', { class: ['review-row', mv.check ? `check-${mv.check.status}` : ''] },
      h('a', { class: 'review-thumb', href: `#/movements/${mv.slug}`, 'aria-label': `Open ${mv.name}` }, thumb(mv, { width: 96 })),
      h('div', { class: 'review-main' },
        h('a', { class: 'name', href: `#/movements/${mv.slug}` }, mv.name),
        (mv.aka || []).length ? h('div', { class: 'tiny muted' }, 'Also called: ', mv.aka.join(', ')) : null,
        h('div', { class: 'small', style: { display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center', marginTop: '4px' } },
          h('span', { class: 'tag' }, levelLabel(mv)),
          mv.apparatus === 'reformer' ? springDots(mv.load?.springs || [], room()) : null,
          mv.apparatus === 'reformer' && mv.load?.advance?.length ? [h('span', { class: 'tiny muted' }, 'to progress'), springDots(mv.load.advance, room())] : null,
          h('span', { class: 'muted' }, mv.muscles.primary.map(muscleLabel).join(', ')),
          mv.reps ? h('span', { class: 'muted' }, repsLabel(mv.reps)) : null),
        mv.summary ? h('div', { class: 'tiny muted', style: { marginTop: '4px' } }, mv.summary) : null,
        // the parts that steer drafts and block planning, so they can be checked in the same pass
        h('div', { class: 'tiny review-plan' },
          h('span', null, h('b', null, 'In a class: '), usesOf(mv).length ? usesOf(mv).map((u) => labelOf(USES, u)).join(', ') : 'working movement'),
          (mv.layers || []).length ? h('span', null, h('b', null, 'Layers: '), mv.layers.map((l) => l.title).join(' → ')) : h('span', null, h('b', null, 'Layers: '), 'none'))),
      h('div', { class: 'review-act' },
        h('div', { class: 'btn-row' },
          store.isAdmin ? h('a', { class: 'btn btn-sm', href: `#/movements/${mv.slug}/edit`, 'aria-label': `Edit ${mv.name}` }, icon('edit', 14), 'Edit') : null,
          btn('Looks right', () => mark(mv, 'ok', note.value), { small: true, iconName: 'check', kind: mv.check?.status === 'ok' ? 'primary' : 'secondary', ariaLabel: `${mv.name} looks right` }),
          btn('Needs fixing', () => mark(mv, 'fix', note.value), { small: true, iconName: 'alert', kind: mv.check?.status === 'fix' ? 'primary' : 'secondary', ariaLabel: `${mv.name} needs fixing` }),
          mv.check ? btn('Clear', () => mark(mv, '', ''), { small: true, kind: 'ghost', ariaLabel: `Clear the review of ${mv.name}` }) : null),
        note,
        mv.check ? h('div', { class: 'tiny muted' }, `${mv.check.status === 'ok' ? 'Checked' : 'Flagged'} by ${mv.check.by}`) : null));
  };

  const draw = () => {
    const all = store.movementList.filter((m) => m.apparatus === st.apparatus);
    const done = all.filter((m) => m.check).length;
    const flagged = all.filter((m) => m.check?.status === 'fix').length;
    countEl.textContent = `${done} of ${all.length} looked at · ${flagged} flagged`;
    const list = all.filter((m) => (st.show === 'all' || (st.show === 'todo' && !m.check) || (st.show === 'ok' && m.check?.status === 'ok') || (st.show === 'fix' && m.check?.status === 'fix')) &&
      (!st.q || namesOf(m).join(' ').toLowerCase().includes(st.q)));
    fill(listEl, ...(list.length ? list.map(row) : [h('div', { class: 'empty' }, h('h3', null, st.show === 'todo' ? 'Nothing left to look at here' : 'Nothing to show'), h('p', null, st.show === 'todo' ? 'Every movement in this list has been checked or flagged.' : 'Try another filter.'))]));
  };

  const seg = (options, key) => h('div', { class: 'seg', role: 'group' }, options.map(([id, label]) =>
    h('button', { type: 'button', class: st[key] === id ? 'on' : null, 'aria-pressed': st[key] === id ? 'true' : 'false', onclick: (e) => { st[key] = id; [...e.currentTarget.parentElement.children].forEach((b) => { b.classList.toggle('on', b === e.currentTarget); b.setAttribute('aria-pressed', b === e.currentTarget ? 'true' : 'false'); }); draw(); } }, label)));

  draw();
  return { title: 'Review', node: [
    h('div', { class: 'page-head' },
      h('div', { class: 'grow' }, h('a', { href: '#/explore', class: 'small' }, '← Movements'), h('h1', null, 'Review the library'),
        h('p', { class: 'small muted', style: { maxWidth: '720px' } }, 'Every movement was written for OpenPilates and cross-checked for its name and springs, but a teacher hasn’t signed it off. Work down the list: mark what is right, flag what isn’t and say why. Flags can be downloaded and sent to whoever maintains the library.'),
        countEl),
      h('div', { class: 'btn-row' },
        h('a', { class: 'btn', href: '/api/reviews/export', download: '' }, icon('download'), 'Download review'))),
    h('div', { class: 'btn-row', style: { marginBottom: '14px' } },
      seg(APPARATUS.map((a) => [a.id, a.label]), 'apparatus'),
      seg([['todo', 'To look at'], ['fix', 'Flagged'], ['ok', 'Checked'], ['all', 'All']], 'show'),
      h('input', { type: 'search', value: st.q, placeholder: 'Search any name', 'aria-label': 'Search movements', style: { width: '220px' }, oninput: (e) => { st.q = e.target.value.toLowerCase(); draw(); } })),
    listEl] };
}

// Everything taken out of this studio's library, with a way to put each one back.
export async function removedView() {
  await Promise.all([store.loadMovements(true), store.loadSeries(true)]);
  const wrap = h('div', { class: 'review-list' });
  const put = async (kind, slug) => {
    try { await api('PUT', `/${kind}/${slug}/library`, { inLibrary: true }); await Promise.all([store.loadMovements(true), store.loadSeries(true)]); toast('Back in your library.'); draw(); } catch (e) { toast(e.message, { kind: 'error' }); }
  };
  const draw = () => {
    const mine = store.removedList.filter((m) => !m.retired);
    const unconfirmed = store.removedList.filter((m) => m.retired);
    const block = (title, hint, list) => (list.length ? [h('h2', { style: { margin: '14px 0 2px' } }, title), h('p', { class: 'small muted', style: { margin: '0 0 6px' } }, hint),
      list.map((m) => h('div', { class: 'review-row' },
        h('a', { class: 'review-thumb', href: `#/movements/${m.slug}`, 'aria-label': `Open ${m.name}` }, thumb(m, { width: 96 })),
        h('div', { class: 'review-main' }, h('a', { class: 'name', href: `#/movements/${m.slug}` }, m.name), h('div', { class: 'tiny muted' }, m.apparatus === 'mat' ? 'Mat' : 'Reformer', (m.aka || []).length ? ` · also called ${m.aka.join(', ')}` : ''), m.summary ? h('div', { class: 'tiny muted', style: { marginTop: '4px' } }, m.summary) : null),
        h('div', { class: 'review-act' }, store.isAdmin ? btn('Put it back', () => put('movements', m.slug), { small: true, iconName: 'plus', ariaLabel: `Put ${m.name} back` }) : null)))] : null);
    fill(wrap,
      !store.removedList.length && !store.removedSeries.length ? h('div', { class: 'empty' }, h('h3', null, 'Nothing has been removed'), h('p', null, 'Every movement and series is in your library.')) : null,
      block('Removed by your studio', 'Taken out with the remove button on the movement page.', mine),
      block('Not confirmed by any reference', 'These shipped in earlier versions. No reference named them, so they are left out unless you put them back.', unconfirmed),
      store.removedSeries.length ? [h('h2', { style: { margin: '14px 0 2px' } }, 'Series'), store.removedSeries.map((s) => h('div', { class: 'review-row', style: { gridTemplateColumns: 'minmax(0, 1fr) auto' } },
        h('div', { class: 'review-main' }, h('span', { class: 'name' }, s.name), h('div', { class: 'tiny muted' }, `${s.items.length} movements`)),
        store.isAdmin ? btn('Put it back', () => put('series', s.slug), { small: true, iconName: 'plus', ariaLabel: `Put ${s.name} back` }) : null))] : null);
  };
  draw();
  return { title: 'Removed', node: [
    h('div', { class: 'page-head' }, h('div', { class: 'grow' }, h('a', { href: '#/explore', class: 'small' }, '← Movements'), h('h1', null, 'Removed from your library'),
      h('p', { class: 'small muted', style: { maxWidth: '720px' } }, 'Nothing here is deleted. Flows that use a removed movement still open; it just isn\'t offered when you build. Put anything back with one press.'))),
    wrap] };
}
