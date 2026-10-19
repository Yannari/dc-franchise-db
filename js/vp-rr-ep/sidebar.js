// ══════════════════════════════════════════════════════════════════════
// vp-rr-ep/sidebar.js — Intel: what the viewer knows, only once it has aired
// ══════════════════════════════════════════════════════════════════════
//
// Spec §9.5. Every fact comes from intelAt (steps.js): where each team was last seen and
// at what hour, its money and who leads it as recorded in that scene, its placement once
// Don has given it on the mat, an exit once it has aired. Teams keep the order the leg
// started in until they are checked in, so the board never gives the finish away; the
// checked-in teams rise to the top in the order they reached the mat.
import { intelAt } from './steps.js';

const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const ORD = n => (n === 1 ? '1st' : n === 2 ? '2nd' : n === 3 ? '3rd' : n + 'th');
const ROW = 60;

export function createSidebar(el, { faceOf }) {
  let built = null;
  function paint(ep, si, idx, { speaking = null } = {}) {
    const it = intelAt(ep, si, idx);
    const st = ep.res.state;
    const order = ep.startOrder;
    const placed = order.filter(id => it.placed[id] != null).sort((a, b) => it.placed[a] - it.placed[b]);
    const rest = order.filter(id => it.placed[id] == null);
    const shown = [...placed, ...rest];
    const key = ep.n + '|' + ep.res.state.seed;
    if (built !== key) {
      built = key;
      const prev = ep.res.legs.slice(0, ep.n - 1);
      const gone = prev.flatMap(l => l.eliminated || []);
      const winners = prev.map(l => `<b>${esc(st.teams[l.order[0]]?.name)}</b>`);
      el.innerHTML = `<h3>INTEL</h3>
        <div class="sub">${ep.kind === 'final' ? 'The final leg' : `Leg ${ep.n} of ${ep.total}`} · ${ep.racing.length} teams racing</div>
        <div class="board" style="height:${order.length * ROW}px">${order.map(id => {
          const t = st.teams[id];
          return `<div class="row" data-team="${id}" style="--c:${ep.color[id]}"><div class="rk"></div><div class="pp"><img src="${faceOf(t.a)}" alt=""><img src="${faceOf(t.b)}" alt=""></div>
            <div class="tx"><div class="nm">${esc(t.name)}</div><div class="st"></div></div></div>`;
        }).join('')}</div>
        <h3>STORYLINES</h3><div class="feed"></div>
        <h3>THE SEASON</h3><div class="season">${prev.length ? `Leg winners: ${winners.join(', ')}<br>` : 'The first leg.'}
          ${gone.length ? `Out: ${gone.map(id => esc(st.teams[id]?.name)).join(', ')}` : ''}</div>`;
    }
    shown.forEach((id, i) => {
      const r = el.querySelector(`.row[data-team="${id}"]`);
      if (!r) return;
      r.style.top = i * ROW + 'px';
      const p = it.placed[id];
      r.querySelector('.rk').textContent = it.out[id] ? 'OUT' : p ? ORD(p) : '–';
      const bits = [];
      if (it.out[id]) bits.push('eliminated');
      else if (it.winner === id) bits.push('wins the race!');
      else if (p) bits.push(`checked in ${ORD(p)}`);
      else if (it.where[id]) bits.push(`${it.where[id].label}${it.where[id].clock ? ' · ' + it.where[id].clock : ''}`);
      else bits.push('not seen yet');
      if (it.safe[id]) bits.push('non-elimination');
      if (it.money[id] != null) bits.push('$' + it.money[id]);
      if (it.lead[id]) bits.push(`${it.lead[id]} leads`);
      r.querySelector('.st').textContent = bits.join(' · ');
      r.classList.toggle('out', !!it.out[id]);
      r.classList.toggle('lead', p === 1 || it.winner === id);
      r.classList.toggle('safe', !!it.safe[id]);
      r.classList.toggle('speaking', speaking === id);
    });
    el.querySelector('.feed').innerHTML = it.events.slice(-6).reverse().map(e => `<div>${esc(e.text)}</div>`).join('') || '<div style="border-color:#333;color:#6c779a">Nothing yet.</div>';
  }
  return { paint };
}
