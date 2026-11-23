// Review list: a teacher works down the library and marks each movement right or wrong.
import { h, icon, btn, toast, fill } from '../ui.js';
import { api, store } from '../store.js';
import { APPARATUS, levelLabel, namesOf } from '/shared/vocab.js';
import { thumb, muscleLabel, springDots, repsLabel } from './common.js';

export async function reviewView() {
  const st = { apparatus: 'reformer', show: 'todo', q: '' };
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
        mv.summary ? h('div', { class: 'tiny muted', style: { marginTop: '4px' } }, mv.summary) : null),
      h('div', { class: 'review-act' },
        h('div', { class: 'btn-row' },
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
      h('input', { type: 'search', placeholder: 'Search any name', 'aria-label': 'Search movements', style: { width: '220px' }, oninput: (e) => { st.q = e.target.value.toLowerCase(); draw(); } })),
    listEl] };
}
