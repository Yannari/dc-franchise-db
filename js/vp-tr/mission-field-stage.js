// ══════════════════════════════════════════════════════════════════════
// vp-tr/mission-field-stage.js — an afternoon's mission, played on the estate
// ══════════════════════════════════════════════════════════════════════
//
// The archetype missions (the money, knowledge and shield afternoons) were a
// run of cards. This plays the same cards (`missionStageData`: the page's own
// beats and host lines) out on the field: the two teams under their banners,
// the better afternoon's banner gold, each side objective popping its bonus
// over the one who earned it, and at the count the coins going into the chest
// while the fund climbs from what it was to what it is. The bespoke missions
// already play on their own themed stages and are left to them.
//
// Like every other file in this directory it imports no engine state.
import { missionStageData } from './mission.js';
import { isBespokeMissionRec } from './mission-bespoke.js';
import { trsStageShell as stageShell, trsFold, trsReg as reg, trsEsc as esc, trsFace as face, trsLater as later } from './castle-stage.js';
import { TRScenery } from './cutaway-scenery.js';
import { beatLines } from './stage-lines.js';
import { footCard, playCard, CARD_CSS } from './stage-cards.js';

const hash = s => { let h = 7; for (const c of String(s)) h = (Math.imul(h, 31) + c.charCodeAt(0)) >>> 0; return h; };
const clean = s => String(s || '').replace(/\s+/g, ' ').trim();
const money = n => '£' + Math.round(Number(n) || 0).toLocaleString('en-GB');

function parse(data) {
  const special = (n, part) => {
    if (part === 'teams' || part === 'sums' || part === 'bar' || part === 'count-of') return [];
    if (part === 'task') return [{ t: 'narr', tag: 'The task', text: clean(n.textContent) }];
    if (part === 'extras') {
      return [...n.querySelectorAll('.mi-extra')].map(x => ({ t: 'extra', who: x.dataset.name,
        text: clean(x.querySelector('.mi-extra-t')?.textContent), money: clean(x.querySelector('.mi-extra-p')?.textContent),
        won: x.dataset.won === '1' }));
    }
    if (part === 'count') return [{ t: 'count' }];
    if (part === 'relic') {
      const holder = clean(n.querySelector('.mi-relic-h')?.textContent);
      const known = holder && !/did not see/i.test(holder) ? holder : null;
      const notes = [...n.querySelectorAll('.mi-relic-note')].map(x => clean(x.textContent)).filter(Boolean);
      const tag = clean(n.querySelector('.mi-relic-k')?.textContent);
      return (notes.length ? notes : [holder || tag]).map((t, i) => ({ t: 'narr', tag: i ? null : tag,
        who: known, react: !!known, text: t }));
    }
    return null;
  };
  return beatLines(data.beats, special);
}

export function missionFieldStageScreen(ep, observer, pageHtml) {
  const m = ep && ep.tr && ep.tr.mission;
  if (!m || isBespokeMissionRec(m) || !(m.teams || []).length) return pageHtml;
  // LAZY — read at mount, see castle-stage.js `mount`.
  const init = () => {
    const data = missionStageData(ep, observer);
    return data && data.teams.length ? { data, steps: parse(data), pot: data.potBefore } : { steps: [] };
  };
  const uid = 'trm-' + String(ep.num) + '-' + (hash(observer) % 1e6);
  reg()[uid] = { uid, steps: null, init, idx: -1, title: m.name || 'The Mission',
    day: (ep.tr && ep.tr.ep) || ep.num, pot: null, timers: [], painter: paint };
  if (typeof queueMicrotask === 'function' && typeof window !== 'undefined' && window.trStageMountAll) {
    queueMicrotask(window.trStageMountAll);
  }
  return trsFold(stageShell(uid, '<div class="trm"></div><div class="trs-corner"></div><div class="trs-start"></div>', CARD_CSS + CSS), pageHtml);
}

function paint(root, S, fresh) {
  const view = root.querySelector('.trs-view'), el = root.querySelector('.trm');
  const W = view.clientWidth, H = view.clientHeight;
  if (!W) return;
  const D = S.data;
  const order = ['breakfast', 'morning', 'mission', 'evening', 'table', 'night'];
  root.querySelectorAll('.trs-seg').forEach(s => {
    const me = order.indexOf(s.dataset.k);
    s.classList.toggle('trs-done', S.idx >= 0 && me < 2); s.classList.toggle('trs-now', S.idx >= 0 && me === 2);
  });
  const start = root.querySelector('.trs-start');
  const st = S.idx >= 0 ? S.steps[S.idx] : null;
  const seen = S.steps.slice(0, S.idx + 1);
  const teamsShown = seen.some(s => (s.meta || {}).kind === 'field');
  const counted = seen.some(s => s.t === 'count');
  const extras = seen.filter(s => s.t === 'extra');
  let h = TRScenery.fieldSet(W, H);
  // the two teams, under their banners
  if (teamsShown || !st) {
    const nT = D.teams.length;
    D.teams.forEach((t, ti) => {
      const side = nT === 1 ? .5 : (ti === 0 ? .2 : ti === nT - 1 ? .8 : .2 + .6 * ti / (nT - 1));
      const best = t.name === D.bestTeam && teamsShown;
      const per = Math.ceil(t.members.length / 2), pw = Math.min(H * .075, W * .3 / Math.max(per, 1) * .62);
      h += `<div class="trm-banner${best ? ' trm-best' : ''}" style="left:${side * 100}%"><span>${esc(t.name)}</span></div>`;
      t.members.forEach((m, i) => {
        const row = i % 2, col = Math.floor(i / 2);
        const x = W * side + (col - (per - 1) / 2) * pw * 1.55 + (row ? pw * .78 : 0);
        const y = H * (.53 + row * .12);
        const ex = extras.find(e => e.who === m);
        const speaking = st && (st.who === m);
        h += `<div class="trm-p${speaking ? ' trm-speak' : (st && st.who ? ' trm-quiet' : '')}${!teamsShown ? ' trm-ghost' : ''}" style="left:${x}px;top:${y}px;width:${pw}px">`
          + `<div class="trm-av">${face(m)}</div><div class="trm-nm">${esc(m)}</div>`
          + (ex ? `<div class="trm-bonus${ex.won ? '' : ' trm-none'}${fresh && st === ex ? ' trm-pop' : ''}">${esc(ex.money)}</div>` : '')
          + '</div>';
      });
    });
  }
  // the fund: what it was, and — at the count — what it is
  h += `<div class="trm-fund"><span>The prize fund</span><b data-to="${D.pot}">${money(counted ? D.pot : D.potBefore)}</b>`
    + (counted ? `<em>+${money(D.earned)} this afternoon</em>` : '') + '</div>';
  if (counted && D.ceiling > 0) {
    const pct = Math.max(0, Math.min(100, Math.round(D.pot / D.ceiling * 100)));
    h += `<div class="trm-bar"><i style="width:${pct}%"></i><span>${money(D.pot)} of ${money(D.ceiling)}</span></div>`;
  }
  if (st && st.t === 'count' && fresh) {
    h += '<div class="trm-coins">' + Array.from({ length: 26 }, (_, i) =>
      `<i style="left:${(i * 37) % 100}%;animation-delay:${(i % 9) * .09}s"></i>`).join('') + '</div>';
  }
  if (!st) {
    el.innerHTML = h;
    start.innerHTML = `<b>${esc(D.name)}</b><span>${D.teams.reduce((a, t) => a + t.members.length, 0)} on the field · press Next, or click the field</span>`;
    start.classList.add('trs-in');
    root.querySelector('.trs-corner').classList.remove('trs-in');
    return;
  }
  start.classList.remove('trs-in');
  const card = st.t === 'extra' ? { t: 'narr', react: true, who: st.who, text: st.text, tag: st.won ? 'Done — ' + st.money : 'Not done' } : st;
  h += st.t === 'count' ? '' : footCard(card, D.host);
  el.innerHTML = h;
  if (st.t !== 'count') playCard(el, card, S, fresh);
  // the fund counts up at the count
  if (st.t === 'count' && fresh) {
    const b = el.querySelector('.trm-fund b');
    const from = D.potBefore, to = D.pot, t0 = performance.now(), dur = 1600;
    b.textContent = money(from);
    const tick = () => {
      const k = Math.min(1, (performance.now() - t0) / dur);
      b.textContent = money(from + (to - from) * (1 - Math.pow(1 - k, 3)));
      if (k < 1 && document.body.contains(b)) S.timers.push(setTimeout(tick, 30));
    };
    later(S, tick, 500);
  }
  const corner = root.querySelector('.trs-corner');
  corner.innerHTML = `${esc(D.name)} · <b>${counted ? 'The count' : extras.length ? 'The extras' : teamsShown ? 'On the field' : 'The brief'}</b>`;
  corner.classList.add('trs-in');
}

const CSS = `
.trm{position:absolute;inset:0}
.trm-banner{position:absolute;top:38%;transform:translateX(-50%);z-index:5;padding:6px 16px 10px;background:linear-gradient(180deg,#3a1a20,#1e0a10);
  border:1px solid rgba(224,160,73,.4);clip-path:polygon(0 0,100% 0,100% 80%,50% 100%,0 80%);font-family:var(--v-display);font-weight:700;font-size:11px;
  letter-spacing:.24em;text-transform:uppercase;color:#e8ddc1;white-space:nowrap}
.trm-banner.trm-best{background:linear-gradient(180deg,#b8863e,#6a4a1a);color:#241b11;box-shadow:0 0 30px rgba(255,219,149,.6)}
.trm-p{position:absolute;transform:translate(-50%,-50%);text-align:center;z-index:10;transition:filter .4s,transform .4s,opacity .4s}
.trm-p.trm-ghost{opacity:0}
.trm-av{position:relative;width:100%;aspect-ratio:1/1.12;overflow:hidden;border-radius:50% 50% 12% 12%/44% 44% 9% 9%;background:#141922;
  box-shadow:0 0 0 2px rgba(232,221,193,.5),0 8px 18px rgba(0,0,0,.6)}
.trm-av img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 18%;z-index:1}
.trm-nm{display:inline-block;margin-top:3px;padding:1px 5px;font-family:var(--v-display);font-weight:700;font-size:8.5px;letter-spacing:.08em;text-transform:uppercase;
  color:#e8ddc1;background:rgba(10,14,8,.75);white-space:nowrap}
.trm-p.trm-quiet{filter:brightness(.6)}
.trm-p.trm-speak{transform:translate(-50%,-50%) scale(1.15);z-index:20}
.trm-p.trm-speak .trm-av{box-shadow:0 0 0 2px #fff3d2,0 0 30px rgba(255,243,210,.6)}
.trm-bonus{position:absolute;left:50%;top:-18px;transform:translateX(-50%);padding:2px 8px;font-family:var(--v-display);font-weight:900;font-size:12px;color:#241b11;
  background:linear-gradient(180deg,#ffe7a8,#d8b15e);border-radius:10px;box-shadow:0 4px 12px rgba(0,0,0,.5);white-space:nowrap}
.trm-bonus.trm-none{background:#3a3d44;color:#c9c2ac}
.trm-bonus.trm-pop{animation:trmPop .7s cubic-bezier(.2,1.6,.4,1)}
@keyframes trmPop{from{transform:translateX(-50%) translateY(20px) scale(.4);opacity:0}}
.trm-fund{position:absolute;right:14px;top:14px;z-index:30;padding:9px 14px;text-align:right;background:rgba(4,5,8,.82);box-shadow:0 0 0 1px rgba(224,160,73,.35)}
.trm-fund span{display:block;font-family:var(--v-display);font-size:9.5px;font-weight:700;letter-spacing:.3em;text-transform:uppercase;color:#c9ba95}
.trm-fund b{display:block;font-family:var(--v-display);font-weight:900;font-size:24px;color:#ffdb95;text-shadow:0 0 16px rgba(224,160,73,.5)}
.trm-fund em{font-style:normal;font-family:var(--v-display);font-weight:700;font-size:11px;color:#8fd19e}
.trm-bar{position:absolute;left:50%;top:20%;transform:translateX(-50%);width:min(46%,520px);height:14px;z-index:30;background:rgba(4,5,8,.8);box-shadow:0 0 0 1px rgba(224,160,73,.4)}
.trm-bar i{position:absolute;left:0;top:0;bottom:0;background:linear-gradient(90deg,#b8863e,#ffdb95);animation:trmBar 1.6s cubic-bezier(.2,.9,.3,1) .4s both}
@keyframes trmBar{from{width:0}}
.trm-bar span{position:absolute;left:0;right:0;top:20px;text-align:center;font-family:var(--v-display);font-size:11px;font-weight:700;letter-spacing:.2em;color:#fff3d2;text-shadow:0 2px 8px #000}
.trm-coins{position:absolute;left:50%;top:0;width:24%;height:56%;transform:translateX(-50%);pointer-events:none;z-index:25}
.trm-coins i{position:absolute;top:-6%;width:12px;height:12px;border-radius:50%;background:radial-gradient(circle at 35% 35%,#fff3c0,#d8b15e 60%,#8a6428);
  box-shadow:0 0 8px rgba(255,219,149,.7);animation:trmCoin 1.1s cubic-bezier(.5,0,.8,.6) both}
@keyframes trmCoin{to{top:92%;transform:scale(.6);opacity:0}}
`;
