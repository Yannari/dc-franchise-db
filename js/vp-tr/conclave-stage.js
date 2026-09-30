// ══════════════════════════════════════════════════════════════════════
// vp-tr/conclave-stage.js — the turret, played in the turret
// ══════════════════════════════════════════════════════════════════════
//
// The page (conclave.js) is a run of cards. This plays the same cards
// (`conclaveStageData`: the page's own beats and host lines, withheld from
// whoever the page withholds them from) in the turret: the pact round a small
// table by candlelight, the names they argue laid on it as they are argued —
// the one chosen burning, the ones overruled struck — the letter written and
// the wax pressed, and a cut downstairs whenever the page says what the rest
// of the castle was doing at that minute.
//
// Like every other file in this directory it imports no engine state.
import { conclaveStageData, conclaveVisibleTo } from './conclave.js';
import { trsStageShell as stageShell, trsFold, trsReg as reg, trsEsc as esc, trsFace as face, trsLater as later } from './castle-stage.js';
import { TRScenery } from './cutaway-scenery.js';
import { trPlay } from './sfx.js';
import { beatLines } from './stage-lines.js';
import { footCard, playCard, CARD_CSS } from './stage-cards.js';
import { cutIn, CUTIN_CSS } from './stage-cutin.js';

const hash = s => { let h = 7; for (const c of String(s)) h = (Math.imul(h, 31) + c.charCodeAt(0)) >>> 0; return h; };
const clean = s => String(s || '').replace(/\s+/g, ' ').trim();
const stripTags = s => clean(String(s || '').replace(/<[^>]*>/g, ' '));

function parse(data) {
  const special = (n, part) => {
    if (part === 'tally') {
      return [{ t: 'tally', rows: [...n.querySelectorAll('.cv-tally-row')].map(r => {
        const nm = r.querySelector('.cv-tally-name');
        const by = clean(nm?.querySelector('span')?.textContent).replace(/^—\s*/, '');
        const name = clean(nm?.childNodes[0]?.textContent);
        const st = r.querySelector('.cv-tally-state');
        return { name, by, state: st?.classList.contains('cv-st-chosen') ? 'chosen' : st?.classList.contains('cv-st-struck') ? 'struck' : 'open',
          label: clean(st?.textContent) };
      }) }];
    }
    if (part === 'letter') {
      return [{ t: 'letter', names: [...n.querySelectorAll('.cv-letter-name')].map(x => clean(x.textContent)) }];
    }
    if (part === 'cost' || part === 'seal-slot' || part === 'shock' || part === 'strike' || part === 'overruled-stamp') return [];
    if (part === 'cloak') {
      const up = clean(n.querySelector('.cv-cloak-name')?.textContent);
      const who = data.turret.find(x => x.toUpperCase() === up) || up;
      const note = clean(n.querySelector('.cv-cloak-note')?.textContent);
      return note ? [{ t: 'narr', who, text: who + '. ' + note, react: true, focus: who }] : [];
    }
    if (part === 'slip') {
      const b = clean(n.querySelector('.cv-slip-reason b')?.textContent);
      const m = /^(.+?) (?:proposes|settles on) (.+)\.$/.exec(b);
      const by = m ? m[1] : clean(n.querySelector('.cv-slip-by')?.textContent).replace(/^(proposed|chosen) by /, '');
      const target = m ? m[2] : clean(n.querySelector('.cv-slip-target')?.textContent);
      const struck = n.dataset.struck === '1';
      const out = [{ t: 'slip', target, by, struck }];
      const rs = /reason: [“"](.+)[”"]\s*$/.exec(clean(n.querySelector('.cv-slip-reason')?.textContent));
      if (!struck && rs) out.push({ t: 'say', who: by, text: rs[1] });
      const un = n.querySelector('.cv-unsaid');
      if (un) out.push({ t: 'narr', tag: 'What they did not say', text: clean(un.textContent).replace(/^What they did not say\s*/, ''), aud: true });
      return out;
    }
    if (part === 'meanwhile') {
      const pair = [...n.querySelectorAll('.cv-pair-nm')].map(x => clean(x.textContent));
      return [...n.querySelectorAll('.cv-meanwhile-txt')].map((x, i) => ({ t: 'narr', tag: i ? null : 'Meanwhile, downstairs',
        text: clean(x.textContent), down: pair }));
    }
    return null;
  };
  const lines = beatLines(data.beats, special);
  // each beat's downstairs margin plays just before the beat it sits beside
  const out = [];
  let lastBeat = -1;
  for (const st of lines) {
    if (st.beat !== lastBeat) {
      lastBeat = st.beat;
      const mg = (data.beats[st.beat].meta || {}).margin;
      if (mg && stripTags(mg.m)) out.push({ ...st, t: 'narr', tag: 'Downstairs · ' + stripTags(mg.t), text: stripTags(mg.m),
        down: mg.who ? [mg.who] : [], who: null, react: false });
    }
    out.push(st);
  }
  return out;
}

export function conclaveStageScreen(ep, observer, pageHtml) {
  const rec = ep && ep.tr && ep.tr.conclave;
  if (!rec || !conclaveVisibleTo(rec, observer)) return pageHtml;
  // LAZY — read at mount, see castle-stage.js `mount`.
  const init = () => {
    const data = conclaveStageData(ep, observer);
    return data ? { data, steps: parse(data) } : { steps: [] };
  };
  const uid = 'trc-' + String(ep.num) + '-' + (hash(observer) % 1e6);
  reg()[uid] = { uid, steps: null, init, idx: -1, title: 'The Conclave',
    day: (ep.tr && ep.tr.ep) || ep.num, pot: ep.tr && ep.tr.pot, timers: [], painter: paint };
  if (typeof queueMicrotask === 'function' && typeof window !== 'undefined' && window.trStageMountAll) {
    queueMicrotask(window.trStageMountAll);
  }
  return trsFold(stageShell(uid, '<div class="trc"></div><div class="trs-corner"></div><div class="trs-start"></div>', CARD_CSS + CUTIN_CSS + CSS), pageHtml);
}

function stateAt(S) {
  let tally = null, letter = null;
  const slips = [];
  for (let k = 0; k <= S.idx; k++) {
    const s = S.steps[k];
    if (s.t === 'tally') tally = s.rows;
    if (s.t === 'letter') letter = s;
    if (s.t === 'slip') {
      const had = slips.find(x => x.name === s.target);
      if (had) had.state = s.struck ? 'struck' : had.state;
      else slips.push({ name: s.target, by: s.by, state: s.struck ? 'struck' : 'open', label: s.struck ? 'Overruled' : 'Proposed' });
    }
  }
  // the names on the table: the page's own tally once it has one, the slips
  // before that — and an overrule strikes a name whichever of the two is showing
  const struck = new Set(slips.filter(x => x.state === 'struck').map(x => x.name));
  const rows = (tally || (slips.length ? slips : null));
  return { tally: rows && rows.map(r => (struck.has(r.name) && r.state !== 'chosen'
    ? { ...r, state: 'struck', label: 'Overruled' } : r)), letter };
}

// the pact, in an arc behind the table
function seatAt(i, n, W, H) {
  const a0 = Math.PI * (n > 4 ? 1.02 : 1.12), a1 = Math.PI * (n > 4 ? 1.98 : 1.88);
  const a = n === 1 ? Math.PI * 1.5 : a0 + (a1 - a0) * i / (n - 1);
  return { x: W / 2 + Math.cos(a) * W * .27, y: H * .6 + Math.sin(a) * H * .27 };
}

function paint(root, S, fresh) {
  const view = root.querySelector('.trs-view'), el = root.querySelector('.trc');
  const W = view.clientWidth, H = view.clientHeight;
  if (!W) return;
  const D = S.data;
  root.querySelectorAll('.trs-seg').forEach(s => {
    s.classList.toggle('trs-done', S.idx >= 0 && s.dataset.k !== 'night'); s.classList.toggle('trs-now', S.idx >= 0 && s.dataset.k === 'night');
  });
  const start = root.querySelector('.trs-start');
  let h = '<div class="trc-world">' + TRScenery.turretSet(W, H);
  const pact = D.turret.length ? D.turret : [];
  const st = S.idx >= 0 ? S.steps[S.idx] : null;
  const speaker = st && (st.t === 'say' ? st.who : st.focus || (st.t === 'slip' ? st.by : null));
  const pw = Math.min(H * .13, W * .1);
  pact.forEach((n, i) => {
    const p = seatAt(i, pact.length, W, H);
    h += `<div class="trc-seat${speaker === n ? ' trc-speak' : (speaker ? ' trc-quiet' : '')}" style="left:${p.x}px;top:${p.y}px;width:${pw}px">`
      + `<div class="trc-hood"></div><div class="trc-av">${face(n)}</div><div class="trc-nm">${esc(n)}</div></div>`;
  });
  if (!st) {
    el.innerHTML = h + '</div>' + AIR;
    start.innerHTML = `<b>The Conclave</b><span>${pact.length ? pact.length + ' in the turret' : 'The turret'} · press Next, or click the room</span>`;
    start.classList.add('trs-in');
    root.querySelector('.trs-corner').classList.remove('trs-in');
    return;
  }
  start.classList.remove('trs-in');
  const r = stateAt(S);
  // the names on the table
  if (r.tally && !r.letter) {
    const n = r.tally.length, cw = Math.min(W * .1, W * .5 / Math.max(1, n));
    h += '<div class="trc-cards">' + r.tally.map((t, i) =>
      `<div class="trc-card trc-${t.state}${fresh && (st.t === 'tally' || (st.t === 'slip' && st.target === t.name)) ? ' trc-deal' : ''}" style="width:${cw}px;animation-delay:${i * .18}s">`
      + `<div class="trc-cav">${face(t.name)}</div><div class="trc-cnm">${esc(t.name)}</div>`
      + `<div class="trc-cby">${esc(t.by)}</div><div class="trc-cst">${esc(t.label)}</div></div>`).join('') + '</div>';
  }
  // the letter, and the wax
  if (r.letter) {
    const fr = fresh && st.t === 'letter';
    const names = r.letter.names.length ? r.letter.names : [D.target || ''];
    h += `<div class="trc-letter${fr ? ' trc-fresh' : ''}"><div class="trc-sheet">`
      + '<div class="trc-hand">Tonight the castle loses' + (names.length > 1 ? ' two' : '') + '</div>'
      + '<div class="trc-lfaces">' + names.map(nm => {
        const real = [D.target, D.second].find(x => x && x.toUpperCase() === nm) || nm;
        return `<div><div class="trc-lav">${face(real)}</div><div class="trc-lname">${[...String(real)].map((c, i) => `<span style="--i:${i}">${esc(c)}</span>`).join('')}</div></div>`;
      }).join('') + '</div>'
      + '<div class="trc-hand trc-small">— and will be told so at first light</div>'
      + '</div><div class="trc-wax"><svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="#8f1a26"/><circle cx="50" cy="50" r="30" fill="none" stroke="#5a0c14" stroke-width="3"/>'
      + '<path d="M22 50 Q50 26 78 50 Q50 74 22 50Z" fill="none" stroke="#c9283c" stroke-width="3"/><circle cx="50" cy="50" r="8" fill="#c9283c"/></svg></div>'
      + '<div class="trc-shock"></div></div>';
  }
  h += '</div>';
  // ── THE CONCLAVE, PLAYED (2026-09-30) ────────────────────────────────
  // A line said in the turret is a hooded cut-in in blood; a name put on the
  // table is a bolt from the one who proposes it into the face they propose;
  // an overrule comes in on steel. The camera pushes in on whoever has the
  // floor, candlelight moves on everything, and when the wax goes down the
  // red comes in from the edges of the room.
  const away = !!(st.down && st.down.length);
  if (!away && !r.letter) {
    if (st.t === 'say' && st.who) h += cutIn({ who: st.who, tone: 'blood', hood: pact.includes(st.who), fresh });
    else if (st.t === 'slip' && st.by && st.target) h += cutIn({ who: st.by, tone: st.struck ? 'steel' : 'blood', hood: true,
      label: st.struck ? 'Overruled' : 'Proposes', at: st.target, fresh });
  }
  // the camera, in on whoever has the floor
  let cam = 'translate(0px,0px) scale(1)';
  const fi = speaker ? pact.indexOf(speaker) : -1;
  if (fi >= 0 && !r.letter && !away) {
    const p = seatAt(fi, pact.length, W, H), k = 1.3;
    const tx = Math.min(0, Math.max(W - W * k, W / 2 - p.x * k)), ty = Math.min(0, Math.max(H - H * k, H * .45 - p.y * k));
    cam = `translate(${tx.toFixed(1)}px,${ty.toFixed(1)}px) scale(${k})`;
  } else if (r.letter) cam = `translate(${(-W * .06).toFixed(1)}px,${(-H * .05).toFixed(1)}px) scale(1.12)`;
  const cam0 = S.cam || 'translate(0px,0px) scale(1)';
  S.cam = cam;
  // the title, on the first beat of the night
  if (S.idx === 0 && fresh) h += `<div class="trc-title" data-a="The Conclave" data-b="Night ${esc(S.day)}"></div>`;
  // the wax is down: the red comes in from the edges
  if (r.letter) h += `<div class="trc-bleed${fresh && st.t === 'letter' ? ' trc-fresh' : ''}"></div>`;
  h += AIR;
  // downstairs, cut in
  if (st.down && st.down.length) {
    h += '<div class="trc-downstairs"><div class="trc-dframe">' + st.down.slice(0, 2).map(n =>
      `<div><div class="trc-dav">${face(n)}</div><div class="trc-dnm">${esc(n)}</div></div>`).join('') + '</div></div>';
  }
  const bare = st.t === 'tally' || st.t === 'letter' || st.t === 'slip';
  h += footCard(bare ? null : st, D.host);
  el.innerHTML = h;
  const world = el.querySelector('.trc-world');
  world.style.setProperty('--cam', cam);
  world.style.setProperty('--cam0', fresh ? cam0 : cam);
  if (fresh) world.classList.add('trc-move');
  world.classList.toggle('trc-dim', !!el.querySelector('.tci'));
  if (!bare) playCard(el, st, S, fresh);
  // THE SOUND OF IT, on a fresh step: the door, the quill, the wax.
  if (fresh) {
    if (S.idx === 0) trPlay('tr-door');
    else if (st.t === 'slip') { trPlay(st.struck ? 'tr-strike' : 'tr-quill'); if (!st.struck) trPlay('tr-heartbeat', 700); }
    else if (st.t === 'letter') { trPlay('tr-quill', 900); trPlay('tr-wax', 2400); }
  }
  root.querySelector('.trs-view').classList.toggle('trc-away', !!(st.down && st.down.length));
  const corner = root.querySelector('.trs-corner');
  corner.innerHTML = st.down && st.down.length ? 'Downstairs · <b>Meanwhile</b>'
    : `The turret · <b>${r.letter ? 'Sealed' : r.tally ? 'The name' : 'The pact'}</b>`;
  corner.classList.add('trs-in');
}

// the air of the turret: embers rising off the candles, and the light moving
const AIR = '<div class="trc-air"><div class="trc-flicker"></div>' + Array.from({ length: 16 }, (_, i) =>
  `<i style="left:${20 + (hash('e' + i) % 600) / 10}%;animation-duration:${6 + hash('d' + i) % 6}s;animation-delay:-${hash('z' + i) % 9}s"></i>`).join('') + '</div>';

const CSS = `
.trc{position:absolute;inset:0;overflow:hidden}
.trc-world{position:absolute;inset:0;transform-origin:0 0;transform:var(--cam);transition:filter .6s}
.trc-world.trc-move{animation:trcCam 1.1s cubic-bezier(.6,0,.2,1) both}
@keyframes trcCam{from{transform:var(--cam0)}to{transform:var(--cam)}}
.trc-world.trc-dim{filter:brightness(.4) blur(2px)}
.trc-air{position:absolute;inset:0;z-index:1500;pointer-events:none}
.trc-flicker{position:absolute;inset:0;background:radial-gradient(60% 55% at 50% 62%,rgba(255,170,90,.14),transparent 70%);animation:trcFlick 2.3s steps(9) infinite}
@keyframes trcFlick{0%,100%{opacity:.8}20%{opacity:1}35%{opacity:.6}50%{opacity:.95}70%{opacity:.7}85%{opacity:1}}
.trc-air i{position:absolute;bottom:-4%;width:3px;height:3px;border-radius:50%;background:#ffb46a;box-shadow:0 0 8px #ff7a2a;opacity:0;animation:trcEmber 8s linear infinite}
@keyframes trcEmber{0%{opacity:0;transform:translate(0,0)}10%{opacity:.9}100%{opacity:0;transform:translate(30px,-90vh)}}
.trc-title{position:absolute;inset:0;z-index:3500;display:grid;place-items:center;pointer-events:none;animation:trcTitle 2.8s ease both}
.trc-title::before{content:attr(data-a);grid-area:1/1;transform:translateY(-18%);font-family:var(--v-display);font-weight:900;font-size:clamp(40px,7vw,104px);
  letter-spacing:.16em;text-transform:uppercase;color:#ffd0d4;text-shadow:0 0 40px rgba(201,40,60,.9),0 8px 0 rgba(0,0,0,.6)}
.trc-title::after{content:attr(data-b);grid-area:1/1;transform:translateY(160%);font-family:var(--v-display);font-weight:700;font-size:13px;letter-spacing:.6em;text-transform:uppercase;color:#c9283c}
@keyframes trcTitle{0%{opacity:0;transform:scale(1.6);filter:blur(10px)}14%{opacity:1;transform:none;filter:none}70%{opacity:1}100%{opacity:0;transform:scale(.96)}}
.trc-bleed{position:absolute;inset:0;z-index:25;pointer-events:none;box-shadow:inset 0 0 160px 60px rgba(120,8,20,.75)}
.trc-bleed.trc-fresh{animation:trcBleed 2.6s ease 2.6s both}
@keyframes trcBleed{from{box-shadow:inset 0 0 0 0 rgba(120,8,20,0)}to{box-shadow:inset 0 0 160px 60px rgba(120,8,20,.75)}}
.trc-downstairs::before{content:"";position:absolute;inset:-100vh -100vw;background:rgba(200,220,255,.5);animation:trcCutFlash .35s ease-out both;pointer-events:none}
@keyframes trcCutFlash{from{opacity:1}to{opacity:0}}
@media (prefers-reduced-motion:reduce){.trc-world,.trc-air *,.trc-title,.trc-bleed{animation:none!important}}
.trc-seat{position:absolute;transform:translate(-50%,-50%);text-align:center;z-index:10;transition:filter .45s,transform .45s}
.trc-av{position:relative;width:100%;aspect-ratio:1/1.12;overflow:hidden;border-radius:50% 50% 12% 12%/44% 44% 9% 9%;background:#140608;
  box-shadow:0 0 0 2px rgba(201,40,60,.7),0 0 30px rgba(142,21,38,.5),0 10px 24px rgba(0,0,0,.85)}
.trc-av img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 18%;z-index:1;filter:saturate(.85) brightness(.92)}
.trc-hood{position:absolute;left:-18%;right:-18%;top:-16%;bottom:28%;border-radius:50% 50% 30% 30%/60% 60% 20% 20%;
  background:radial-gradient(60% 70% at 50% 60%,transparent 52%,#2a0508 54%,#12030a 100%);z-index:2;pointer-events:none}
.trc-nm{display:inline-block;margin-top:6px;padding:2px 8px;font-family:var(--v-display);font-weight:700;font-size:10px;letter-spacing:.2em;text-transform:uppercase;
  color:#f3dcd8;background:rgba(20,4,6,.8);border:1px solid rgba(201,40,60,.4)}
.trc-seat.trc-quiet{filter:brightness(.5)}
.trc-seat.trc-speak{transform:translate(-50%,-50%) scale(1.14);z-index:20}
.trc-seat.trc-speak .trc-av{box-shadow:0 0 0 2px #ff9a9f,0 0 44px rgba(201,40,60,.8),0 10px 24px rgba(0,0,0,.85)}
.trc-cards{position:absolute;left:50%;top:60%;transform:translate(-50%,-50%);display:flex;gap:12px;z-index:15}
.trc-card{padding:8px 8px 7px;text-align:center;background:linear-gradient(170deg,#efe5cc,#cdbd98);color:#241b11;box-shadow:0 12px 28px rgba(0,0,0,.7);transform:rotate(-2deg)}
.trc-card:nth-child(even){transform:rotate(2deg)}
.trc-card.trc-deal{animation:trcDeal .6s cubic-bezier(.2,1.3,.4,1) both}
@keyframes trcDeal{from{opacity:0;transform:translateY(-60px) rotate(-14deg)}}
.trc-cav{position:relative;width:100%;aspect-ratio:1/1.1;overflow:hidden;background:#241b11}
.trc-cav img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 18%;z-index:1}
.trc-cnm{margin-top:5px;font-family:var(--v-display);font-weight:900;font-size:12px}
.trc-cby{font-family:var(--v-hand);font-style:italic;font-size:11px;opacity:.7}
.trc-cst{margin-top:3px;font-family:var(--v-display);font-weight:700;font-size:9px;letter-spacing:.24em;text-transform:uppercase}
.trc-card.trc-chosen{box-shadow:0 0 0 3px #c9283c,0 0 40px rgba(201,40,60,.7),0 12px 28px rgba(0,0,0,.7)}
.trc-card.trc-chosen .trc-cst{color:#8e1526}
.trc-card.trc-struck{filter:grayscale(.9) brightness(.6)}
.trc-card.trc-struck .trc-cav::after{content:"";position:absolute;inset:0;z-index:2;background:linear-gradient(135deg,transparent 46%,#8e1526 47%,#8e1526 53%,transparent 54%)}
.trc-letter{position:absolute;left:50%;top:44%;transform:translate(-50%,-50%);z-index:30;width:min(34%,380px)}
.trc-sheet{padding:18px 20px 16px;text-align:center;background:linear-gradient(170deg,#f1e6c8,#d3c29a);color:#3a1a10;box-shadow:0 24px 50px rgba(0,0,0,.8),inset 0 0 40px rgba(120,80,30,.25)}
.trc-letter.trc-fresh .trc-sheet{animation:trcSlide .8s cubic-bezier(.2,1,.3,1) both}
@keyframes trcSlide{from{opacity:0;transform:translateY(50px) rotate(4deg)}}
.trc-hand{font-family:var(--v-hand);font-style:italic;font-size:18px}
.trc-hand.trc-small{font-size:14px;opacity:.75;margin-top:6px}
.trc-lfaces{display:flex;justify-content:center;gap:22px;margin:10px 0 4px}
.trc-lav{position:relative;width:74px;height:82px;margin:0 auto;overflow:hidden;border-radius:50% 50% 12% 12%/44% 44% 9% 9%;box-shadow:0 0 0 2px #8e1526;background:#241b11}
.trc-lav img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 18%;z-index:1}
.trc-lname{margin-top:6px;font-family:'Caveat',var(--v-hand),cursive;font-weight:700;font-size:26px;color:#5a0c14}
.trc-letter.trc-fresh .trc-lname span{display:inline-block;white-space:pre;clip-path:inset(-30% 100% -30% -30%);animation:trcInk .12s linear forwards;animation-delay:calc(.9s + var(--i) * .12s)}
@keyframes trcInk{to{clip-path:inset(-30% -30% -30% -30%)}}
.trc-wax{position:absolute;right:-26px;bottom:-30px;width:92px;height:92px;filter:drop-shadow(0 8px 12px rgba(0,0,0,.7))}
.trc-letter.trc-fresh .trc-wax{animation:trcWax .5s cubic-bezier(.2,1.6,.4,1) 2.4s both}
@keyframes trcWax{from{opacity:0;transform:scale(2.8) rotate(-30deg)}}
.trc-shock{position:absolute;right:20px;bottom:16px;width:0;height:0;border-radius:50%;box-shadow:0 0 0 0 rgba(201,40,60,.8);opacity:0;pointer-events:none}
.trc-letter.trc-fresh .trc-shock{animation:trcShock .9s ease-out 2.75s}
@keyframes trcShock{0%{opacity:1;box-shadow:0 0 0 0 rgba(201,40,60,.85)}100%{opacity:0;box-shadow:0 0 0 160px rgba(201,40,60,0)}}
.trs-view.trc-away .trc-world>svg,.trs-view.trc-away .trc-seat,.trs-view.trc-away .trc-cards,.trs-view.trc-away .trc-letter{filter:brightness(.3) saturate(.4);transition:filter .6s}
.trc-downstairs{position:absolute;left:50%;top:36%;transform:translate(-50%,-50%);z-index:40;animation:trcDown .6s ease both}
@keyframes trcDown{from{opacity:0;transform:translate(-50%,-44%)}}
.trc-dframe{display:flex;gap:26px;padding:18px 26px 14px;background:radial-gradient(70% 90% at 50% 40%,rgba(143,166,194,.28),rgba(8,12,20,.92));
  border:1px solid rgba(143,166,194,.45);box-shadow:0 20px 50px rgba(0,0,0,.8)}
.trc-dav{position:relative;width:84px;height:94px;overflow:hidden;border-radius:50% 50% 12% 12%/44% 44% 9% 9%;box-shadow:0 0 0 2px rgba(143,166,194,.6);background:#0f141d}
.trc-dav img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 18%;z-index:1;filter:saturate(.7)}
.trc-dnm{margin-top:6px;text-align:center;font-family:var(--v-display);font-weight:700;font-size:10px;letter-spacing:.22em;text-transform:uppercase;color:#dfe7f2}
`;
