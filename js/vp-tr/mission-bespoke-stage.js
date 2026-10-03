// ══════════════════════════════════════════════════════════════════════
// vp-tr/mission-bespoke-stage.js — the twelve themed missions, played
// ══════════════════════════════════════════════════════════════════════
//
// The themed afternoons (the Drowned Causeway, the Orrery, the Ash Vault and
// the rest — js/vp-tr/mission-bespoke.js) each draw their own page and never
// had a watch-it-played stage; the user asked for one ("we needed more
// dialogue in mission anyway"). This plays the page's OWN view — the same
// curated cards, the same banter, the same confessionals — out on the field:
// the host's briefing, each phase opened as a title, the teams on either side,
// every beat bringing its player forward lit for how it went, what is said
// between teammates as live talk in the room, confessionals cutting away to
// the chair, each phase's scores racing, and the money landing in the pot.
//
// Like every other file in this directory it imports no engine state.
import { bespokeStageData, isBespokeMissionRec } from './mission-bespoke.js';
import { trsStageShell as stageShell, trsFold, trsReg as reg, trsEsc as esc, trsFace as face } from './castle-stage.js';
import { footCard, playCard, CARD_CSS, relicReveal, relicBadge } from './stage-cards.js';
import { confessional } from './stage-cutin.js';
import { trPlay } from './sfx.js';

const hash = s => { let h = 7; for (const c of String(s)) h = (Math.imul(h, 31) + c.charCodeAt(0)) >>> 0; return h; };
const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI'];
const gbp = n => '£' + Math.round(Number(n || 0)).toLocaleString('en-GB');

// THE STEPS, off the page's view, in the page's order
function stepsOf(v) {
  const out = [];
  if (v.staging) out.push({ t: 'narr', tag: v.name, text: v.staging, k: 'brief' });
  let acted = false;
  for (const b of v.hostBeats || []) {
    if (b.action && !acted) { acted = true; out.push({ t: 'narr', tag: 'The host', text: b.action, k: 'brief' }); }
    if (b.text) out.push({ t: 'host', text: b.text, k: 'brief' });
  }
  v.phases.forEach((ph, pi) => {
    out.push({ t: 'phase', ph, n: pi + 1, k: 'phase' });
    for (const c of ph.cards) {
      if (c.isSocial) {
        out.push({ t: 'narr', text: c.text, whoList: c.who, team: c.team, tone: c.tone, k: 'scene' });
        if (c.conf) out.push({ t: 'cam', who: c.conf.speaker, text: c.conf.text, k: 'scene' });
      } else {
        out.push({ t: 'narr', who: c.who[0], tag: c.who[0] + (c.team ? ' · ' + c.team : ''), text: c.text, team: c.team, tone: c.tone, k: 'beat' });
        (c.said || []).forEach((x, i) => out.push({ t: 'say', who: x.who, text: x.text, to: (c.said[1 - i] || {}).who, team: c.team, k: 'said' }));
      }
    }
    if ((ph.teams || []).length) out.push({ t: 'score', ph, k: 'score' });
  });
  if (v.shield && Array.isArray(v.shield.lines)) {
    const relic = { kind: v.shield.kind || 'shield', awarded: v.shield.awarded != null ? !!v.shield.awarded : !!v.shield.holder, holder: v.shield.holder || null };
    v.shield.lines.forEach((l, i) => out.push({ t: 'narr', tag: i ? null : 'The shield', text: l, who: v.shield.holder || null, k: 'shield', relic, relicFirst: i === 0 }));
  }
  out.push({ t: 'money', k: 'money' });
  if (v.summary) out.push({ t: 'narr', tag: 'The afternoon', text: v.summary, k: 'end' });
  return out;
}

export function missionBespokeStageScreen(ep, observer, pageHtml) {
  const m = ep && ep.tr && ep.tr.mission;
  if (!m || !isBespokeMissionRec(m)) return pageHtml;
  const init = () => {
    const d = bespokeStageData(ep);
    return d ? { data: d, steps: stepsOf(d.v) } : { steps: [] };
  };
  const uid = 'trq-' + String(ep.num) + '-' + (hash(observer) % 1e6);
  reg()[uid] = { uid, steps: null, init, idx: -1, title: m.name || 'The Mission',
    day: (ep.tr && ep.tr.ep) || ep.num, pot: null, timers: [], painter: paint };
  if (typeof queueMicrotask === 'function' && typeof window !== 'undefined' && window.trStageMountAll) {
    queueMicrotask(window.trStageMountAll);
  }
  return trsFold(stageShell(uid, '<div class="trq"></div><div class="trs-corner"></div><div class="trs-start"></div>', CARD_CSS + CSS), pageHtml);
}

// the teams, in columns across the field
function layout(teams, W, H) {
  const n = Math.max(1, teams.length), pos = {};
  teams.forEach((t, ti) => {
    const cx = W * (ti + .5) / n, colW = W / n * .86;
    // two rows at most: a third ran under the caption
    const per = Math.max(2, Math.ceil(t.members.length / 2));
    const size = Math.min(colW / per * .72, H * .068);
    t.members.forEach((name, i) => {
      const r = Math.floor(i / per), c = i % per, inRow = Math.min(per, t.members.length - r * per);
      pos[name] = { x: cx + (c - (inRow - 1) / 2) * (colW / per), y: H * .67 + r * size * 1.5, s: size, team: t.name };
    });
    pos['@' + t.name] = { x: cx, y: H * .595 };
  });
  return pos;
}

function paint(root, S, fresh) {
  const view = root.querySelector('.trs-view'), el = root.querySelector('.trq');
  const W = view.clientWidth, H = view.clientHeight;
  if (!W) return;
  const v = S.data.v, teams = v.teams.filter(t => t.members.length);
  root.querySelectorAll('.trs-seg').forEach(s => {
    s.classList.toggle('trs-done', S.idx >= 0 && ['breakfast', 'morning'].includes(s.dataset.k));
    s.classList.toggle('trs-now', S.idx >= 0 && s.dataset.k === 'mission');
  });
  const st = S.idx >= 0 ? S.steps[S.idx] : null;
  const pos = layout(teams, W, H);
  // what has happened so far this afternoon: each player's last tone, the pot
  const tone = {};
  for (let k = 0; k <= S.idx; k++) { const x = S.steps[k]; if (x.k === 'beat' && x.who) tone[x.who] = x.tone; }
  const paid = st && S.steps.slice(0, S.idx + 1).some(x => x.t === 'money');
  const lit = new Set(st ? [st.who, st.to, ...(st.whoList || [])].filter(Boolean) : []);
  // the relic, once reached: who wears it from here on
  const relicAt = S.steps.slice(0, S.idx + 1).find(x => x.relic);
  const wearer = relicAt && relicAt.relic.awarded ? relicAt.relic.holder : null;
  let h = '<div class="trq-world">' + (S.data.scene ? `<div class="trq-floor"></div><section class="${S.data.sceneCls === 'fx' ? 'fx' : 'ms'} trq-ms" data-phase="rest" data-scene="proc">${S.data.scene}</section>` : '<img class="trs-plate" src="assets/sets/traitors/field.webp" alt="">')
    + '<div class="trq-shade"></div>';
  teams.forEach(t => {
    const p = pos['@' + t.name];
    h += `<div class="trq-banner${st && st.team === t.name ? ' trq-hot' : ''}" style="left:${p.x}px;top:${p.y}px" data-n="${esc(t.name)}"></div>`;
  });
  for (const t of teams) for (const name of t.members) {
    const p = pos[name];
    const cls = ['trq-p', lit.has(name) ? 'trq-lit' : (lit.size ? 'trq-dim' : ''), tone[name] ? 'trq-' + tone[name] : '',
      st && st.k === 'beat' && st.who === name && fresh ? 'trq-now' : ''].join(' ');
    h += `<div class="${cls}${wearer === name ? ' trs-relic-holder' : ''}" style="left:${p.x}px;top:${p.y}px;width:${p.s}px"><div class="trq-av">${face(name)}</div><div class="trq-nm" data-n="${esc(name)}"></div>`
      + (wearer === name ? relicBadge(relicAt.relic.kind) : '') + '</div>';
  }
  h += '</div>';
  // THE PLAYER, BROUGHT FORWARD for their beat: large, lit for how it went
  if (st && st.k === 'beat' && st.who) {
    h += `<div class="trq-spot trq-${st.tone || 'steady'}${fresh ? ' trq-in' : ''}" data-w="${st.tone === 'good' ? 'Nailed it' : st.tone === 'bad' ? 'Blew it' : 'Steady'}">`
      + `<div class="trq-sav">${face(st.who)}</div></div>`;
  }
  // A PHASE OPENS: the theme's own title over the numeral and the setting
  if (st && st.t === 'phase') {
    h += `<div class="trq-phase${fresh ? ' trq-in' : ''}"><div class="trq-roman" data-n="${ROMAN[st.n] || st.n}"></div>`
      + `<div class="trq-pname" data-n="${esc(st.ph.name)}"></div><div class="trq-set" data-n="${esc(st.ph.setting || '')}"></div></div>`;
  }
  // THE PHASE SCORES, racing
  if (st && st.t === 'score') {
    const ts = st.ph.teams, top = Math.max(0.01, ...ts.map(x => Number(x.score) || 0));
    h += `<div class="trq-score${fresh ? ' trq-in' : ''}"><div class="trq-sk" data-n="${esc(st.ph.name)}"></div>` + ts.map(x =>
      `<div class="trq-row${(Number(x.score) || 0) === top ? ' trq-top' : ''}"><span data-n="${esc(x.name)}"></span><i style="--w:${((Number(x.score) || 0) / top * 100).toFixed(1)}%"></i></div>`).join('') + '</div>';
  }
  // THE MONEY: the pot counts up
  if (st && st.t === 'money') {
    h += `<div class="trq-money${fresh ? ' trq-in' : ''}"><div class="trq-mk" data-n="Added to the prize pot"></div><b class="trq-earn">${gbp(v.earned)}</b>`
      + `<div class="trq-pot" data-n="${esc('Pot: ' + gbp(v.potAfter))}"></div>`
      + (fresh ? '<div class="trq-coins">' + Array.from({ length: 22 }, (_, i) => `<i style="left:${(hash('c' + i) % 100)}%;animation-delay:${(i * .07).toFixed(2)}s"></i>`).join('') + '</div>' : '') + '</div>';
  }
  if (S.idx === 0 && fresh && S.data.title) h += `<div class="trq-title">${S.data.title}</div>`;
  // THE RELIC RISES while the page is on it
  if (st && st.relic) h += relicReveal(st.relic, fresh && st.relicFirst);
  // CONFESSIONAL: cut away to the chair
  if (st && st.t === 'cam') h += confessional({ who: st.who, fresh });
  const start = root.querySelector('.trs-start');
  if (!st) {
    el.innerHTML = h;
    start.innerHTML = `<b>${esc(v.name)}</b><span>${teams.length} teams · press Next, or click the field</span>`;
    start.classList.add('trs-in');
    root.querySelector('.trs-corner').classList.remove('trs-in');
    return;
  }
  start.classList.remove('trs-in');
  const card = st.t === 'narr' || st.t === 'host' || st.t === 'say' || st.t === 'cam' ? footCard(st, trHostOf(S)) : '';
  el.innerHTML = h + card;
  if (card) playCard(el, st, S, fresh);
  // the camera: in on whoever the step is about
  const world = el.querySelector('.trq-world');
  const focus = [...lit].map(n => pos[n]).filter(Boolean);
  let cam = 'translate(0px,0px) scale(1)';
  if (focus.length && (st.t === 'say' || st.k === 'scene')) {
    const k = 1.5, fx = focus.reduce((a, q) => a + q.x, 0) / focus.length, fy = focus.reduce((a, q) => a + q.y, 0) / focus.length;
    cam = `translate(${Math.min(0, Math.max(W - W * k, W / 2 - fx * k)).toFixed(1)}px,${Math.min(0, Math.max(H - H * k, H * .42 - fy * k)).toFixed(1)}px) scale(${k})`;
  }
  world.style.setProperty('--cam', cam);
  world.style.setProperty('--cam0', fresh ? (S.cam || cam) : cam);
  if (fresh) world.classList.add('trq-move');
  S.cam = cam;
  // the sound of it
  if (fresh) {
    if (st.t === 'phase') trPlay('tr-drum');
    else if (st.k === 'beat') trPlay(st.tone === 'good' ? 'tr-chalk' : st.tone === 'bad' ? 'tr-strike' : 'tr-tap', 200);
    else if (st.t === 'money') { trPlay('tr-coins', 300); trPlay('tr-coins', 900); }
  }
  const corner = root.querySelector('.trs-corner');
  const phNow = S.steps.slice(0, S.idx + 1).filter(x => x.t === 'phase').pop();
  corner.innerHTML = `${esc(v.name)} · <b>${esc(paid ? 'The pot' : phNow ? phNow.ph.name : 'The briefing')}</b>`;
  corner.classList.add('trs-in');
}
// the host, for the foot card
function trHostOf(S) { return (S.data && S.data.host) || { name: 'The host', slug: null }; }

const CSS = `
.trq{position:absolute;inset:0;overflow:hidden;background:#0a0c08}
.trq-world{position:absolute;inset:0;transform-origin:0 0;transform:var(--cam)}
.trq-world.trq-move{animation:trqCam 1s cubic-bezier(.6,0,.2,1) both}
@keyframes trqCam{from{transform:var(--cam0)}to{transform:var(--cam)}}
.trq-ms{position:absolute!important;left:0!important;right:0!important;top:0!important;height:56%!important;margin:0!important;border-radius:0!important;box-shadow:none!important;z-index:0!important}
.trq-ms::after{content:"";position:absolute;left:0;right:0;bottom:0;height:40%;background:linear-gradient(180deg,transparent,#0a0908);pointer-events:none}
.trq-floor{position:absolute;left:0;right:0;top:55%;bottom:0;background:radial-gradient(80% 90% at 50% 0%,#2a2218,#0a0908 75%)}
.trq-shade{position:absolute;inset:0;background:linear-gradient(180deg,transparent 50%,rgba(0,0,0,.4))}
.trq-banner{position:absolute;transform:translate(-50%,-50%);z-index:5}
.trq-banner::before{content:attr(data-n);display:inline-block;padding:6px 18px;font-family:var(--v-display);font-weight:900;font-size:clamp(12px,1.3vw,17px);
  letter-spacing:.24em;text-transform:uppercase;color:#241b11;background:linear-gradient(180deg,#f7e2a6,#c99a48);transform:skewX(-10deg);box-shadow:0 8px 20px rgba(0,0,0,.6)}
.trq-banner.trq-hot::before{box-shadow:0 0 0 2px #fff3d2,0 0 30px rgba(255,219,149,.6)}
.trq-p{position:absolute;transform:translate(-50%,-50%);text-align:center;transition:filter .4s,transform .4s}
.trq-av{position:relative;width:100%;aspect-ratio:1/1.12;overflow:hidden;border-radius:50% 50% 12% 12%/44% 44% 9% 9%;background:#141922;
  box-shadow:0 0 0 2px rgba(222,214,196,.35),0 8px 18px rgba(0,0,0,.8)}
.trq-av img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 18%;z-index:1}
.trq-nm::before{content:attr(data-n);display:inline-block;margin-top:3px;padding:1px 6px;white-space:nowrap;font-family:var(--v-display);font-weight:700;font-size:8.5px;
  letter-spacing:.1em;text-transform:uppercase;color:#ded6c4;background:rgba(4,5,4,.75)}
.trq-p.trq-good .trq-av{box-shadow:0 0 0 2px #9fe07a,0 8px 18px rgba(0,0,0,.8)}
.trq-p.trq-bad .trq-av{box-shadow:0 0 0 2px #ff5f75,0 8px 18px rgba(0,0,0,.8)}
.trq-p.trq-dim{filter:brightness(.5)}
.trq-p.trq-lit{transform:translate(-50%,-50%) scale(1.18);z-index:9}
.trq-p.trq-now{animation:trqHop .5s ease}
@keyframes trqHop{40%{transform:translate(-50%,-62%) scale(1.2)}}
/* the player, brought forward */
.trq-spot{position:absolute;left:50%;top:34%;width:min(20%,190px);transform:translate(-50%,-50%);z-index:1800;text-align:center}
.trq-sav{position:relative;aspect-ratio:1/1.12;overflow:hidden;border-radius:50% 50% 12% 12%/44% 44% 9% 9%;background:#141922;
  box-shadow:0 0 0 4px #fff3d2,0 0 50px rgba(255,219,149,.5),0 24px 50px rgba(0,0,0,.9)}
.trq-sav img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 18%;z-index:1}
.trq-spot.trq-good .trq-sav{box-shadow:0 0 0 4px #9fe07a,0 0 60px rgba(159,224,122,.55),0 24px 50px rgba(0,0,0,.9)}
.trq-spot.trq-bad .trq-sav{box-shadow:0 0 0 4px #ff5f75,0 0 60px rgba(255,95,117,.55),0 24px 50px rgba(0,0,0,.9)}
.trq-spot::after{content:attr(data-w);display:inline-block;margin-top:12px;padding:5px 16px;border:3px solid currentColor;font-family:var(--v-display);font-weight:900;
  font-size:clamp(14px,1.6vw,22px);letter-spacing:.14em;text-transform:uppercase;background:rgba(6,6,10,.85);transform:rotate(-4deg);color:#e2c47e}
.trq-spot.trq-good::after{color:#b8f07a}.trq-spot.trq-bad::after{color:#ff5f75}
.trq-spot.trq-in{animation:trqSpot .55s cubic-bezier(.2,1.3,.4,1) both}
.trq-spot.trq-in::after{animation:trqStamp .4s cubic-bezier(.2,1.6,.4,1) .55s both}
@keyframes trqSpot{from{opacity:0;transform:translate(-50%,-30%) scale(.6)}to{opacity:1;transform:translate(-50%,-50%)}}
@keyframes trqStamp{from{opacity:0;transform:rotate(-4deg) scale(2.6)}to{opacity:1;transform:rotate(-4deg)}}
.trq-spot.trq-bad.trq-in .trq-sav{animation:trqShake .45s linear .5s}
@keyframes trqShake{25%{transform:translateX(-8px) rotate(-2deg)}50%{transform:translateX(7px) rotate(2deg)}75%{transform:translateX(-4px)}}
/* a phase opening */
.trq-phase{position:absolute;inset:0;z-index:1900;display:grid;place-content:center;text-align:center;background:radial-gradient(60% 60% at 50% 45%,rgba(8,8,10,.6),rgba(4,4,6,.93))}
.trq-roman::before{content:attr(data-n);font-family:var(--v-display);font-weight:900;font-size:clamp(60px,10vw,140px);color:rgba(226,196,126,.9);text-shadow:0 0 40px rgba(226,196,126,.5)}
.trq-pname::before{content:attr(data-n);display:block;font-family:var(--v-display);font-weight:900;font-size:clamp(26px,3.6vw,48px);letter-spacing:.1em;text-transform:uppercase;color:#fff3d2}
.trq-set::before{content:attr(data-n);display:block;max-width:640px;margin:10px auto 0;font-family:var(--v-body);font-style:italic;font-size:clamp(14px,1.4vw,19px);color:rgba(241,230,204,.85)}
.trq-phase.trq-in .trq-roman{animation:trqSlam .6s cubic-bezier(.2,1.4,.4,1) both}
.trq-phase.trq-in .trq-pname{animation:trqRise .5s ease .35s both}.trq-phase.trq-in .trq-set{animation:trqRise .5s ease .6s both}
@keyframes trqSlam{from{opacity:0;transform:scale(2.4);filter:blur(8px)}to{opacity:1;transform:none;filter:none}}
@keyframes trqRise{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
/* the scores */
.trq-score{position:absolute;left:50%;top:44%;width:min(56%,560px);transform:translate(-50%,-50%);z-index:1900;padding:18px 22px;background:rgba(8,8,10,.9);border:1px solid rgba(226,196,126,.35);box-shadow:0 24px 60px rgba(0,0,0,.8)}
.trq-sk::before{content:attr(data-n);display:block;margin-bottom:12px;font-family:var(--v-display);font-weight:700;font-size:11px;letter-spacing:.34em;text-transform:uppercase;color:#e2c47e}
.trq-row{display:grid;grid-template-columns:120px 1fr;gap:12px;align-items:center;margin:8px 0}
.trq-row span::before{content:attr(data-n);font-family:var(--v-display);font-weight:900;font-size:14px;letter-spacing:.12em;text-transform:uppercase;color:#f4f1e8}
.trq-row i{height:14px;background:rgba(255,255,255,.08);position:relative}
.trq-row i::after{content:"";position:absolute;left:0;top:0;bottom:0;width:var(--w);background:linear-gradient(90deg,#8a6a2a,#e2c47e)}
.trq-row.trq-top i::after{background:linear-gradient(90deg,#6aa84a,#b8f07a);box-shadow:0 0 16px rgba(184,240,122,.5)}
.trq-score.trq-in .trq-row i::after{animation:trqBar 1.2s cubic-bezier(.2,.9,.3,1) both}
@keyframes trqBar{from{width:0}}
/* the money */
.trq-money{position:absolute;inset:0;z-index:1900;display:grid;place-content:center;text-align:center;background:radial-gradient(50% 50% at 50% 45%,rgba(40,30,8,.7),rgba(4,4,6,.93))}
.trq-mk::before{content:attr(data-n);font-family:var(--v-display);font-weight:700;font-size:12px;letter-spacing:.4em;text-transform:uppercase;color:#e2c47e}
.trq-earn{display:block;margin:10px 0;font-family:var(--v-display);font-weight:900;font-size:clamp(46px,8vw,110px);color:#efcb5f;text-shadow:0 0 40px rgba(239,203,95,.6)}
.trq-pot::before{content:attr(data-n);font-family:var(--v-display);font-weight:700;font-size:14px;letter-spacing:.2em;text-transform:uppercase;color:#f4f1e8}
.trq-money.trq-in .trq-earn{animation:trqSlam .6s cubic-bezier(.2,1.4,.4,1) .2s both}
.trq-coins{position:absolute;inset:0;pointer-events:none}
.trq-coins i{position:absolute;top:-6%;width:14px;height:14px;border-radius:50%;background:radial-gradient(circle at 35% 35%,#fff3c0,#e2b440 55%,#8a6a1a);animation:trqCoin 1.6s cubic-bezier(.4,0,.8,1) both}
@keyframes trqCoin{to{transform:translateY(120vh) rotate(720deg)}}
.trq-title{position:absolute;inset:0;z-index:3500;display:grid;place-items:center;pointer-events:none;background:rgba(4,4,6,.55);animation:trqTitle 2.8s ease both}
@keyframes trqTitle{0%{opacity:0;transform:scale(1.4)}14%{opacity:1;transform:none}72%{opacity:1}100%{opacity:0}}
@media (prefers-reduced-motion:reduce){.trq *{animation:none!important}}
`;
