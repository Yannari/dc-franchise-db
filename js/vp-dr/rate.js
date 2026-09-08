// ══════════════════════════════════════════════════════════════════════
// vp-dr/rate.js — the Rate-a-Queen screen
// ══════════════════════════════════════════════════════════════════════
//
// Built against the show's own set, from three frames of it: a monitor in a
// heavy gold frame on the werk room's brick wall; on it a huge magenta neon
// TRIANGLE with hollow neon RATE-A-QUEEN across the middle and a grid of
// queens down the right, each portrait masked into a triangle; and, when a
// queen locks her ranking in, the triangle FILLS solid pink with a white
// padlock in the centre of it.
//
// ── IT IS SCORED LIKE EUROVISION ──────────────────────────────────────
//
// One click per CHOICE. Every single ranking lands on its own step — she
// gives her first place and the board moves, her second and it moves again —
// and the leaderboard RE-SORTS underneath with the rows sliding past each
// other. The whole point of the twist is watching the night's best
// performance get buried while it happens, and that is only visible if the
// board moves on every score rather than once a ballot.
//
// THE ROWS ARE ABSOLUTELY POSITIONED AND MOVED BY TRANSFORM. Reordering flex
// children with `order` does not animate: the row is simply somewhere else on
// the next frame, which is a jump cut rather than a scoreboard. Every row
// keeps its place in the DOM forever and is translated to its rank, so the
// browser tweens it and two queens swapping actually slide past one another.
//
// ── AND IT NEVER SPOILS ───────────────────────────────────────────────
//
// The board holds the total from the choices REVEALED SO FAR. Nothing on the
// page carries the final order until the last choice is open.
import { _shell, _portrait } from './style.js';
import { _controls, _state, _reapplyVisibility } from './reveal.js';

const esc = v => String(v ?? '').replace(/[&<>"]/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const ROW_H = 34;

/* Why a ranking was not simply the night's order. The engine derives these
   from the same terms that produced the ballot, so a reason can never
   disagree with the ranking it explains — and most picks have none, because
   most of the time she is calling it as she saw it. */
const WHY = {
  threat: 'the one she has to beat',
  friend: 'her friend in the room',
  grudge: 'no love lost',
  misread: 'she did not see it',
};

export const RATE_CSS = `
/* NO overflow:hidden UP THIS TREE: it silently kills position:sticky on the
   set below, with no warning — the element just scrolls away. */
.raq{position:relative;padding:20px 16px 26px;border-radius:6px;
  background:
    radial-gradient(120% 80% at 50% 0%,rgba(90,20,60,.5),transparent 60%),
    repeating-linear-gradient(0deg,#2a1418 0 1px,transparent 1px 30px),
    repeating-linear-gradient(90deg,#2a1418 0 1px,transparent 1px 62px),
    linear-gradient(180deg,#3a1c22,#210f14)}

/* ── THE SET, WHICH STAYS PUT WHILE THE BALLOTS SCROLL ── */
.raq-frame{position:sticky;top:46px;z-index:5;max-width:1000px;margin:0 auto 12px;
  border-radius:5px;padding:9px;
  background:linear-gradient(150deg,#e8c47a,#8a6a2f 40%,#f0d79b 55%,#7a5c28);
  box-shadow:0 26px 60px -20px rgba(0,0,0,.9),0 0 0 1px rgba(0,0,0,.5)}
.raq-screen{position:relative;border-radius:2px;overflow:hidden;
  display:grid;grid-template-columns:1fr 232px;min-height:236px;
  background:radial-gradient(120% 90% at 42% 55%,#5b1780,#2a0740 55%,#160325);
  box-shadow:inset 0 0 90px 20px rgba(0,0,0,.6)}
.raq-beam{position:absolute;inset:0;pointer-events:none;opacity:.5;background:
  linear-gradient(104deg,transparent 38%,rgba(255,120,220,.22) 44%,transparent 50%),
  linear-gradient(72deg,transparent 55%,rgba(190,130,255,.18) 61%,transparent 67%)}
.raq-floorglow{position:absolute;left:6%;right:30%;bottom:0;height:64px;pointer-events:none;
  background:radial-gradient(60% 100% at 50% 100%,rgba(255,45,180,.5),transparent 70%);
  filter:blur(10px)}

/* ── THE NEON TRIANGLE ── */
.raq-stage{position:relative;display:grid;place-items:center;padding:14px 10px 10px}
.raq-tri{position:relative;width:min(272px,76%);aspect-ratio:1/.86}
.raq-tri svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible}
.raq-outline{fill:none;stroke:#FF3DC8;stroke-width:3;stroke-linejoin:round;
  filter:drop-shadow(0 0 6px #FF3DC8) drop-shadow(0 0 22px rgba(255,61,200,.85))
    drop-shadow(0 0 54px rgba(255,61,200,.5))}
/* The fill and the padlock: the lock-in, straight off the show. */
.raq-fill{fill:url(#raqFill);opacity:0;transform-origin:50% 60%;transform:scale(.9)}
.raq-lock{fill:#fff;opacity:0;transform-origin:50% 62%;transform:scale(.6)}
.raq-screen.raq-locked .raq-fill{animation:raqFillIn .5s cubic-bezier(.2,1.2,.4,1) forwards}
.raq-screen.raq-locked .raq-lock{animation:raqLockIn .45s cubic-bezier(.2,1.6,.4,1) .12s forwards}
@keyframes raqFillIn{to{opacity:.92;transform:scale(1)}}
@keyframes raqLockIn{to{opacity:1;transform:scale(1)}}
.raq-word{position:absolute;left:50%;top:58%;transform:translate(-50%,-50%);
  font-family:'Anton','Arial Narrow Bold',sans-serif;letter-spacing:.06em;
  font-size:clamp(16px,3.2vw,29px);white-space:nowrap;transition:opacity .3s;
  color:rgba(255,214,245,.10);-webkit-text-stroke:2px #FFA8EC;
  text-shadow:0 0 4px #fff,0 0 12px #FF5FD4,0 0 30px rgba(255,61,200,.95)}
.raq-screen.raq-locked .raq-word{opacity:0}
/* And it flashes white as each score lands. */
.raq-screen.raq-hit .raq-outline{animation:raqPulse .4s ease-out}
@keyframes raqPulse{0%{stroke-width:3}40%{stroke-width:8;stroke:#fff}100%{stroke-width:3}}

/* ── WHO IS RATING ── */
.raq-voter{position:absolute;left:16px;top:12px;display:flex;gap:9px;align-items:center;z-index:3}
.raq-voter .dr-por,.raq-voter .dr-initials{border-radius:50%;
  border:2px solid rgba(255,122,224,.85);box-shadow:0 0 22px rgba(255,61,200,.6)}
.raq-vlabel{display:block;font-size:8px;letter-spacing:.26em;text-transform:uppercase;color:#FFAEEB}
.raq-vname{display:block;font-family:'Anton',sans-serif;font-size:18px;color:#fff;
  letter-spacing:.04em;line-height:1.05}
/* The call-out: the score she just gave, and who to. */
.raq-call{position:absolute;left:50%;bottom:12px;transform:translateX(-50%);z-index:4;
  display:flex;gap:10px;align-items:center;padding:6px 14px 6px 12px;border-radius:40px;
  background:rgba(18,2,28,.85);border:1px solid rgba(255,122,224,.45);
  box-shadow:0 0 30px rgba(255,61,200,.35);opacity:0;transition:opacity .25s}
.raq-call.on{opacity:1;animation:raqCall .42s cubic-bezier(.2,1.4,.4,1)}
@keyframes raqCall{from{transform:translateX(-50%) scale(.86)}to{transform:translateX(-50%) scale(1)}}
.raq-callpts{font-family:'Anton',sans-serif;font-size:21px;color:#FFD23F;line-height:1;
  text-shadow:0 0 14px rgba(255,210,63,.7)}
.raq-callnm{display:block;font-size:13px;color:#fff;font-weight:700}
.raq-callrank{display:block;font-family:'Space Mono',monospace;font-size:8px;color:#FFAEEB;
  letter-spacing:.14em;text-transform:uppercase}
.raq-callwhy{margin-left:4px;font-size:10px;font-style:italic;color:#FFD9F4;opacity:.85}

/* ── TRIANGLE-MASKED PORTRAITS ──
   The mask cuts the top corners off a square avatar, which is exactly where
   a head is, so the image is scaled and pushed down until the face sits in
   the wide part of the triangle instead of in the point. */
.raq-tile{position:relative;display:block;margin:0 auto;overflow:hidden;
  clip-path:polygon(50% 0,100% 100%,0 100%);
  background:linear-gradient(180deg,#FF3DC8,#8a1a6a)}
.raq-tile img{position:absolute;left:50%;top:100%;width:88%;height:auto;
  transform:translate(-50%,-88%);display:block}

/* ── THE GRID OF QUEENS ── */
.raq-grid{position:relative;z-index:2;padding:10px;display:grid;
  grid-template-columns:1fr 1fr;gap:7px;align-content:start;
  background:linear-gradient(180deg,rgba(20,3,32,.35),rgba(20,3,32,.6));
  border-left:1px solid rgba(255,122,224,.18);max-height:236px;overflow:auto}
.raq-card{border-radius:8px;padding:7px 4px 5px;text-align:center;
  background:linear-gradient(180deg,rgba(120,40,150,.42),rgba(45,10,70,.5));
  border:1px solid rgba(255,122,224,.16);transition:transform .3s,box-shadow .3s,opacity .3s}
.raq-card .raq-tile{width:48px;height:41px}
.raq-card b{display:block;margin-top:4px;font-size:8px;font-weight:800;letter-spacing:.1em;
  color:#fff;text-transform:uppercase;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.raq-card.raq-picked{transform:translateY(-3px) scale(1.08);
  box-shadow:0 0 0 1px #FF7AE0,0 0 26px rgba(255,61,200,.7)}
.raq-card.raq-spent{opacity:.34}

/* ── THE SCOREBOARD ── */
.raq-board{max-width:1000px;margin:0 auto 12px;border-radius:8px;overflow:hidden;
  border:1px solid rgba(255,122,224,.28);background:rgba(22,4,34,.92)}
.raq-bhead{display:flex;justify-content:space-between;align-items:baseline;
  padding:8px 13px;border-bottom:1px solid rgba(255,122,224,.18)}
.raq-bhead h4{margin:0;font-family:'Anton',sans-serif;font-size:13px;letter-spacing:.12em;
  color:#FFAEEB;text-transform:uppercase}
.raq-bhead span{font-family:'Space Mono',monospace;font-size:10px;color:#e7c9de}
.raq-rows{position:relative;margin:7px 10px 9px}
.raq-row{position:absolute;left:0;right:0;top:0;height:${ROW_H - 4}px;
  display:grid;grid-template-columns:24px auto minmax(66px,1fr) 2fr 44px;
  gap:9px;align-items:center;padding:0 6px;border-radius:6px;
  transition:transform .62s cubic-bezier(.34,.9,.3,1),background .3s}
.raq-rank{font-family:'Space Mono',monospace;font-size:12px;color:#FFAEEB;text-align:right}
.raq-row .dr-por,.raq-row .dr-initials{border-radius:50%;display:block}
.raq-nm{font-size:12px;color:#fff;font-weight:600;overflow:hidden;
  text-overflow:ellipsis;white-space:nowrap}
.raq-bar{height:7px;border-radius:4px;background:rgba(255,255,255,.08);overflow:hidden}
.raq-bar i{display:block;height:100%;border-radius:4px;
  background:linear-gradient(90deg,#8b2fd0,#FF3DC8);
  transition:width .55s cubic-bezier(.2,.9,.25,1)}
.raq-pts{font-family:'Space Mono',monospace;font-size:13px;color:#FFD9F4;text-align:right}
.raq-row.raq-scored{background:linear-gradient(90deg,rgba(255,210,63,.22),transparent)}
.raq-row.raq-scored .raq-pts{color:#FFD23F;animation:raqTick .45s ease-out}
@keyframes raqTick{0%{transform:scale(1)}45%{transform:scale(1.55)}100%{transform:scale(1)}}
.raq-row.raq-top{background:linear-gradient(90deg,rgba(255,210,63,.2),transparent)}
.raq-row.raq-top .raq-pts{color:#FFD23F}
.raq-row.raq-btm{background:linear-gradient(90deg,rgba(255,41,75,.18),transparent)}
.raq-row.raq-btm .raq-pts{color:#FF6B8A}

/* ── THE TABS: one per queen, to step between ballots ── */
.raq-tabs{display:flex;gap:6px;flex-wrap:wrap;max-width:1000px;margin:0 auto 12px;
  padding:8px;border-radius:8px;background:rgba(22,4,34,.72);
  border:1px solid rgba(255,122,224,.18)}
.raq-tab{display:flex;gap:6px;align-items:center;padding:4px 9px 4px 4px;border-radius:30px;
  border:1px solid rgba(255,122,224,.22);background:rgba(255,255,255,.03);
  color:#e7c9de;font:600 11px/1 inherit;cursor:pointer;opacity:.5;
  transition:opacity .25s,border-color .25s,background .25s}
.raq-tab .dr-por,.raq-tab .dr-initials{border-radius:50%;display:block}
.raq-tab:hover,.raq-tab:focus-visible{opacity:.85;outline:none}
.raq-tab.raq-done{opacity:.8}
.raq-tab.on{opacity:1;color:#fff;border-color:#FF7AE0;background:rgba(255,61,200,.18);
  box-shadow:0 0 18px rgba(255,61,200,.35)}
.raq-tab i{font-style:normal;font-family:'Space Mono',monospace;font-size:9px;color:#FFAEEB}

/* ── THE LOG: every choice, one per click ── */
.raq-log{max-width:1000px;margin:0 auto}
.raq-vhead{display:flex;gap:9px;align-items:center;margin:14px 0 7px;opacity:.3;
  transition:opacity .35s}
.raq-vhead.on{opacity:1}
.raq-vhead .dr-por,.raq-vhead .dr-initials{border-radius:50%}
.raq-vhead b{font-family:'Anton',sans-serif;font-size:14px;color:#FFD9F4;letter-spacing:.05em}
.raq-vhead i{font-style:normal;font-size:9px;letter-spacing:.2em;text-transform:uppercase;
  color:#c79ab8}
.raq-picks{display:flex;flex-wrap:wrap;gap:7px}
.raq-log .dr-step{width:56px}
.raq-pick{position:relative;display:block;text-align:center}
.raq-pick .raq-tile{width:46px;height:40px}
.raq-pick em{position:absolute;top:-8px;left:50%;transform:translateX(-50%);font-style:normal;
  font-family:'Space Mono',monospace;font-size:9px;color:#FFD9F4;
  background:rgba(20,2,30,.92);padding:0 4px;border-radius:2px;z-index:2}
.raq-pick b{display:block;margin-top:3px;font-size:8px;font-weight:700;color:#F6D9F0;
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.raq-pick s{display:block;text-decoration:none;font-size:7px;font-style:italic;color:#FFAEEB;
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap}

@media(max-width:820px){
  .raq-screen{grid-template-columns:1fr}
  .raq-grid{max-height:170px;grid-template-columns:repeat(4,1fr)}
}
@media(prefers-reduced-motion:reduce){
  .raq-row,.raq-bar i,.raq-card,.raq-call,.raq-tab{transition:none}
  .raq-call.on,.raq-row.raq-scored .raq-pts,.raq-screen.raq-hit .raq-outline{animation:none}
  .raq-screen.raq-locked .raq-fill{animation:none;opacity:.92;transform:none}
  .raq-screen.raq-locked .raq-lock{animation:none;opacity:1;transform:none}
}
`;

/** Her portrait, cropped into the set's triangle. */
function tile(name, ep, size) {
  const p = _portrait(name, ep, { size });
  const src = /src="([^"]+)"/.exec(p);
  return `<span class="raq-tile">${src
    ? `<img src="${esc(src[1])}" alt="${esc(name)}" loading="lazy">`
    : ''}</span>`;
}

export function rpBuildRate(row) {
  const raq = row?.dr?.rateAQueen;
  if (!raq?.ballots) return '';
  const epNum = row?.num ?? row?.dr?.ep ?? 1;
  const ep = { num: epNum, format: 'drag-race', dr: row?.dr || {} };

  const voters = Object.keys(raq.ballots);
  if (!voters.length) return '';
  const field = (raq.board || []).map(r => r.name);
  const reasons = raq.reasons || {};

  /* ── EVERY CHOICE, FLATTENED ──
     One step per ranking given, so Next advances one score at a time and the
     board can move on each of them. `last` marks the choice that completes a
     ballot, which is where the triangle locks. */
  const picks = [];
  voters.forEach((v, vi) => {
    const b = raq.ballots[v] || [];
    b.forEach((n, k) => picks.push({
      v, vi, n, rank: k + 1, pts: b.length - k, last: k === b.length - 1,
      why: WHY[reasons[v]?.[n]] || '',
    }));
  });

  const grid = `<div class="raq-grid">${field.map(n =>
    `<div class="raq-card" data-q="${esc(n)}">${tile(n, ep, 64)}<b>${esc(n)}</b></div>`).join('')}</div>`;

  const stage = `<div class="raq-frame"><div class="raq-screen" id="raq-screen">
      <i class="raq-beam"></i><i class="raq-floorglow"></i>
      <span class="raq-voter">
        <span id="raq-vpor">${_portrait(voters[0], ep, { size: 36 })}</span>
        <span><span class="raq-vlabel">Now rating</span>
          <span class="raq-vname dr-disp" id="raq-vname">${esc(voters[0])}</span></span></span>
      <div class="raq-stage"><div class="raq-tri">
        <svg viewBox="0 0 100 88" aria-hidden="true">
          <defs><linearGradient id="raqFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stop-color="#FF6ADB"/><stop offset="1" stop-color="#E01B9B"/>
          </linearGradient></defs>
          <polygon class="raq-fill" points="50,12 88,80 12,80"></polygon>
          <polygon class="raq-outline" points="50,4 96,84 4,84"></polygon>
          <path class="raq-lock" d="M42,52 a8,8 0 0 1 16,0 v6 h-4 v-6 a4,4 0 0 0 -8,0 v6 h-4 z
            M38,58 h24 a2,2 0 0 1 2,2 v14 a2,2 0 0 1 -2,2 h-24 a2,2 0 0 1 -2,-2 v-14 a2,2 0 0 1 2,-2 z"></path>
        </svg>
        <span class="raq-word">RATE-A-QUEEN</span>
      </div></div>
      ${grid}
      <span class="raq-call" id="raq-call">
        <span class="raq-callpts" id="raq-callpts">0</span>
        <span><span class="raq-callrank" id="raq-callrank">rank</span>
          <span class="raq-callnm" id="raq-callnm"></span></span>
        <span class="raq-callwhy" id="raq-callwhy"></span>
      </span>
    </div></div>`;

  const board = `<div class="raq-board">
    <div class="raq-bhead"><h4>The tally</h4>
      <span id="raq-count">0 of ${picks.length} scores in</span></div>
    <div class="raq-rows" id="raq-rows" style="height:${field.length * ROW_H}px">${
  field.map(n => `<div class="raq-row" data-q="${esc(n)}" style="transform:translateY(0px)">
        <span class="raq-rank">–</span>${_portrait(n, ep, { size: 24 })}
        <span class="raq-nm">${esc(n)}</span>
        <span class="raq-bar"><i style="width:0%"></i></span>
        <span class="raq-pts">0</span>
      </div>`).join('')}</div></div>`;

  /* THE TABS. One per queen, jumping the reveal to the last choice of her
     ballot — forwards or backwards, so a viewer can step through the room
     rather than through a hundred and ten clicks to reach the one she wants. */
  const tabs = `<!--dr-chrome--><div class="raq-tabs">${voters.map((v, vi) => {
    const endsAt = picks.reduce((acc, p, i) => (p.vi === vi ? i : acc), 0);
    return `<button type="button" class="raq-tab" data-vi="${vi}"
      onclick="drRateGo(${epNum},${endsAt})">${_portrait(v, ep, { size: 20 })}
      <span>${esc(v)}</span><i>${vi + 1}</i></button>`;
  }).join('')}</div><!--/dr-chrome-->`;

  let idx = 0;
  const log = voters.map((v, vi) => {
    const b = raq.ballots[v] || [];
    const tiles = b.map((n, k) => {
      const id = idx++;
      const why = WHY[reasons[v]?.[n]] || '';
      return `<div class="dr-step" id="dr-step-rate-${id}">
        <span class="raq-pick"><em>${k + 1}</em>${tile(n, ep, 44)}<b>${esc(n)}</b>
          ${why ? `<s>${esc(why)}</s>` : ''}</span></div>`;
    }).join('');
    return `<div class="raq-vhead" data-vi="${vi}">${_portrait(v, ep, { size: 26 })}
        <b>${esc(v)}</b><i>ranks the room</i></div>
      <div class="raq-picks">${tiles}</div>`;
  }).join('');

  if (typeof window !== 'undefined') {
    window._drRateData = { picks, field, voters, rowH: ROW_H };

    /** Jump the reveal to a given choice — the tabs' handler. */
    window.drRateGo = (num, to) => {
      const st = _state({ num }, 'rate');
      const total = window._drRateData?.picks?.length || 0;
      st.idx = Math.max(0, Math.min(to, total - 1));
      _reapplyVisibility('rate', st.idx, total);
      document.getElementById(`dr-step-rate-${st.idx}`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };

    window._drRevealExtra = window._drRevealExtra || {};
    window._drRevealExtra.rate = (i) => {
      const d = window._drRateData;
      if (!d) return;
      const upTo = Math.max(0, Math.min(i + 1, d.picks.length));

      /* Recomputed from scratch each time rather than accumulated, so stepping
         backwards is the same code path as stepping forwards. */
      const pts = Object.fromEntries(d.field.map(n => [n, 0]));
      for (let k = 0; k < upTo; k++) pts[d.picks[k].n] += d.picks[k].pts;
      const order = [...d.field].sort((a, b) => pts[b] - pts[a] || a.localeCompare(b));
      const max = Math.max(1, ...Object.values(pts));
      const done = upTo >= d.picks.length;
      const just = upTo > 0 ? d.picks[upTo - 1] : null;

      // THE SLIDE: every row translated to its rank, so the browser tweens it.
      const rows = new Map([...document.querySelectorAll('.raq-row')]
        .map(el => [el.getAttribute('data-q'), el]));
      order.forEach((n, r) => {
        const el = rows.get(n);
        if (!el) return;
        el.style.transform = `translateY(${r * d.rowH}px)`;
        el.querySelector('.raq-rank').textContent = upTo ? r + 1 : '–';
        el.querySelector('.raq-bar i').style.width = `${Math.round((pts[n] / max) * 100)}%`;
        el.querySelector('.raq-pts').textContent = pts[n];
        el.classList.toggle('raq-scored', !!just && n === just.n && !done);
        el.classList.toggle('raq-top', done && r === 0);
        el.classList.toggle('raq-btm', done && r >= order.length - 2);
      });

      const count = document.getElementById('raq-count');
      if (count) count.textContent = `${upTo} of ${d.picks.length} scores in`;

      const vname = document.getElementById('raq-vname');
      if (vname && just) vname.textContent = just.v;
      const call = document.getElementById('raq-call');
      if (call) {
        call.classList.toggle('on', !!just);
        if (just) {
          document.getElementById('raq-callpts').textContent = just.pts;
          document.getElementById('raq-callnm').textContent = just.n;
          document.getElementById('raq-callrank').textContent = `her number ${just.rank}`;
          document.getElementById('raq-callwhy').textContent = just.why ? `— ${just.why}` : '';
        }
      }

      for (const h of document.querySelectorAll('.raq-vhead')) {
        h.classList.toggle('on', !!just && Number(h.getAttribute('data-vi')) === just.vi);
      }
      for (const t of document.querySelectorAll('.raq-tab')) {
        const vi = Number(t.getAttribute('data-vi'));
        t.classList.toggle('on', !!just && vi === just.vi);
        t.classList.toggle('raq-done', !!just && vi < just.vi);
      }

      /* HER CARD LIFTS OUT OF THE GRID, and the ones she has already placed
         sit back — so the grid reads as a ballot being filled in. */
      const spent = new Set();
      if (just) {
        for (let k = 0; k < upTo; k++) if (d.picks[k].vi === just.vi) spent.add(d.picks[k].n);
      }
      for (const el of document.querySelectorAll('.raq-card')) {
        const n = el.getAttribute('data-q');
        el.classList.toggle('raq-picked', !!just && n === just.n);
        el.classList.toggle('raq-spent', spent.has(n) && (!just || n !== just.n));
      }

      /* AND THE LOCK. On the choice that completes a ballot the triangle
         fills solid and the padlock drops in — the show's own beat for a
         queen locking her ranking in. */
      const screen = document.getElementById('raq-screen');
      if (screen) {
        screen.classList.remove('raq-hit');
        void screen.offsetWidth;
        if (just) screen.classList.add('raq-hit');
        screen.classList.toggle('raq-locked', !!just && just.last);
      }
    };
  }

  return `<style>${RATE_CSS}</style>${_shell(
    `<div class="raq">${stage}${board}${tabs}<div class="raq-log">${log}</div></div>`, ep, {
      phase: 'werk', title: 'Rate-a-Queen', subtitle: 'the room ranks the room',
    })}${_controls('rate', picks.length, ep.num)}`;
}
