// ══════════════════════════════════════════════════════════════════════
// vp-tr/table-stage.js — the Round Table, played on its set
// ══════════════════════════════════════════════════════════════════════
//
// The Round Table page (round-table.js) is a long run of cards. This plays
// the SAME cards — `roundTableStageData` hands over the page's own beats,
// built by the page's own `_buildBeats` with the same keys — one line at a
// time on the table the show sits at: the host at the head, everybody else
// evenly round the star, a red thread from each accuser to the name they put
// up, every slate written in chalk in the voter's own hand while they say why,
// the count, the chair, and the card turned over slowly enough to matter.
//
// EVERY WORD COMES OFF THE PAGE'S MARKUP. A beat is parsed into lines: a host
// band is the host speaking, a quoted row is a player speaking, a paragraph
// is narration, a note is a note, and "What the room cannot see" stays the
// audience's alone because the page only writes it on that layer. Nothing on
// this stage is written here except the chrome, so nothing here can say what
// the page does not.
//
// Like every other file in this directory it imports no engine state.
import { roundTableStageData } from './round-table.js';
import { trsStageShell as stageShell, trsFold, trsReg as reg, trsEsc as esc, trsFace as face, trsLater as later } from './castle-stage.js';
import { TRScenery } from './cutaway-scenery.js';
import { beatLines } from './stage-lines.js';

const hash = s => { let h = 7; for (const c of String(s)) h = (Math.imul(h, 31) + c.charCodeAt(0)) >>> 0; return h; };
const clean = s => String(s || '').replace(/\s+/g, ' ').trim();

// ── THE PAGE, READ AS LINES (stage-lines.js), with the parts this stage
// draws itself claimed: the slate, the count, the chair, the card.
function parseBeats(data) {
  const accsAt = [];
  const accs = [];
  data.beats.forEach((b, bi) => {
    const m = b.meta || {};
    if (m.kind === 'debate' && m.target) for (const a of m.accusers || []) {
      if (!accs.some(x => x[0] === a && x[1] === m.target)) accs.push([a, m.target]);
    }
    accsAt[bi] = accs.slice();
  });
  const announced = new Set();
  const special = (n, part, ctx) => {
    const m = ctx.meta;
    if (part === 'slate') {
      const note = ctx.tpl.content.querySelector('.rt-note');
      return [{ t: 'slate', ballot: m.ballot, tally: m.tally || {}, round: m.round || 0,
        ord: clean(n.querySelector('.rt-slate-ord')?.textContent), reason: m.reason || '',
        note: note ? clean(note.textContent) : '', noteTone: note ? note.dataset.tone || '' : '' }];
    }
    if (part === 'note' && m.kind === 'read') return [];
    if (part === 'tally') return [{ t: 'count', tally: m.tally || {} }];
    if (part === 'verdict') return [{ t: 'chair', who: m.who || data.chosen }];
    if (part === 'said' && m.kind === 'reveal' && !announced.has(ctx.beat)) {
      announced.add(ctx.beat);
      return [{ t: 'reveal', who: data.chosen, alignment: m.alignment,
        line: clean(n.querySelector('.rt-said-txt')?.textContent).replace(/^[“"]+|[”"]+$/g, '') }];
    }
    return null;
  };
  return beatLines(data.beats, special).map(st => ({ ...st, target: st.meta.target || null,
    pair: st.meta.pair || null, accs: accsAt[st.beat] || [] }));
}

// ── THE SCREEN ───────────────────────────────────────────────────────────
export function tableStageScreen(ep, observer, pageHtml) {
  const rec = ep && ep.tr && ep.tr.table;
  if (!rec || !(rec.seated || []).length) return pageHtml;
  // LAZY — read at mount, see castle-stage.js `mount`.
  const init = () => {
    const data = roundTableStageData(ep, observer);
    if (!data) return { steps: [] };
    const truth = data.truth || {};
    return { data, steps: parseBeats(data), traitors: Object.keys(truth).filter(n => truth[n] === 'traitor') };
  };
  const uid = 'trt-' + String(ep.num) + '-' + (hash(observer) % 1e6);
  reg()[uid] = { uid, steps: null, init, idx: -1, title: 'The Round Table', traitors: [],
    day: (ep.tr && ep.tr.ep) || ep.num, pot: ep.tr && ep.tr.pot, timers: [], painter: paintTable };
  if (typeof queueMicrotask === 'function' && typeof window !== 'undefined' && window.trStageMountAll) {
    queueMicrotask(window.trStageMountAll);
  }
  return trsFold(stageShell(uid, '<div class="trt"></div><div class="trs-corner"></div><div class="trs-start"></div>', CSS), pageHtml);
}

// ── THE SEATS: the host at the head, everybody else evenly round the star ─
// EQUAL DISTANCES ROUND THE EDGE, not equal angles: on a flattened ellipse
// equal angles bunch the people at either end of the table and spread them
// along the near and far sides, which is what the first build looked like.
const TABLE_CY = .425;
const _ringCache = new Map();
function seatAt(slot, slots, W, H) {
  const k = slots + '|' + Math.round(W) + '|' + Math.round(H);
  let ring = _ringCache.get(k);
  if (!ring) {
    const cx = W * .5, cy = H * TABLE_CY, rx = W * .41, ry = H * .235, N = 720;
    const pts = [], len = [0];
    for (let i = 0; i <= N; i++) {
      const a = -Math.PI / 2 + i / N * Math.PI * 2;
      pts.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]);
      if (i) len.push(len[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    }
    ring = [];
    for (let s2 = 0, j = 0; s2 < slots; s2++) {
      const want = len[N] * s2 / slots;
      while (j < N && len[j + 1] < want) j++;
      ring.push({ x: pts[j][0], y: pts[j][1], z: 100 + Math.round(pts[j][1]), gap: len[N] / slots });
    }
    _ringCache.set(k, ring);
  }
  return ring[slot];
}

function stateAt(S) {
  // what is true at step idx: the tally on the table, the slate just turned,
  // the chair, whether the card has turned
  const r = { tally: {}, round: 0, chair: null, turned: false, counted: false, phase: 'gather', reads: 0, total: 0 };
  for (let k = 0; k <= S.idx; k++) {
    const s = S.steps[k];
    r.phase = s.phase || r.phase;
    if (s.t === 'slate') {
      if (s.round !== r.round) { r.round = s.round; r.counted = false; }
      r.tally = { ...s.tally }; r.reads++;
      const m = /(\d+)\s*\/\s*(\d+)/.exec(s.ord || ''); r.total = m ? +m[2] : r.total; r.ordN = m ? +m[1] : r.reads;
    }
    if (s.t === 'count') { r.tally = { ...s.tally }; r.counted = true; }
    if (s.t === 'chair') r.chair = s.who;
    if (s.t === 'reveal') { r.turned = true; r.alignment = s.alignment; }
  }
  return r;
}

const HANDS = ["'Caveat',cursive", "'Kalam',cursive", "'Gochi Hand',cursive", "'Shadows Into Light',cursive", "'Reenie Beanie',cursive"];

function paintTable(root, S, fresh) {
  const view = root.querySelector('.trs-view'), rt = root.querySelector('.trt');
  const W = view.clientWidth, H = view.clientHeight;
  if (!W) return;
  const D = S.data;
  const order = ['breakfast', 'morning', 'mission', 'evening', 'table', 'night'];
  root.querySelectorAll('.trs-seg').forEach(el => {
    const me = order.indexOf(el.dataset.k);
    el.classList.toggle('trs-done', S.idx >= 0 && me < 4); el.classList.toggle('trs-now', S.idx >= 0 && me === 4);
  });
  const start = root.querySelector('.trs-start');
  if (S.idx < 0) {
    rt.innerHTML = TRScenery.roundTableSet(W, H) + TRScenery.roundTable(W * .5, H * (TABLE_CY + .005), W * .3, H * .16, D.seated.length + 1);
    start.innerHTML = `<b>The Round Table</b><span>${D.seated.length} at the table · press Next, or click the table</span>`;
    start.classList.add('trs-in');
    root.querySelector('.trs-corner').classList.remove('trs-in');
    return;
  }
  start.classList.remove('trs-in');
  const st = S.steps[S.idx], r = stateAt(S);
  const slots = D.seated.length + 1;
  const pw = Math.min(H * .09, seatAt(0, slots, W, H).gap * .58);
  const small = slots > 16;
  const speaker = st.t === 'say' ? st.who : st.t === 'slate' ? st.ballot && st.ballot.voter : st.t === 'host' ? '@host' : null;
  const pair = st.pair || [];
  const focus = st.t === 'say' || st.t === 'slate' || st.t === 'host' || pair.length > 0;
  let h = `<svg width="0" height="0" style="position:absolute"><filter id="trtChalk"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" seed="4" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="2.6"/></filter></svg>`
    + TRScenery.roundTableSet(W, H) + TRScenery.roundTable(W * .5, H * (TABLE_CY + .005), W * .3, H * .16, slots);
  // the red threads: who has put whom up, the newest drawn as it is said
  const pos = n => { const i = D.seated.indexOf(n); const p = seatAt(i + 1, slots, W, H); return [p.x, p.y]; };
  if (r.phase === 'debate' || r.phase === 'gather' || st.t === 'say' || st.accs.length) {
    const threads = st.accs.filter(([a, b]) => D.seated.includes(a) && D.seated.includes(b));
    const fade = r.reads > 0;
    h += '<svg class="trt-threads">' + threads.map(([a, b]) => {
      const [x1, y1] = pos(a), [x2, y2] = pos(b);
      const mx = (x1 + x2) / 2 + (W * .5 - (x1 + x2) / 2) * .35, my = (y1 + y2) / 2 + (H * TABLE_CY - (y1 + y2) / 2) * .35;
      const isNew = fresh && st.t === 'say' && st.who === a && st.target === b;
      return `<path class="trt-thread${isNew ? '' : ' trt-old'}${fade ? ' trt-faded' : ''}" d="M${x1},${y1} Q${mx},${my} ${x2},${y2}"/>`;
    }).join('') + '</svg>';
  }
  // the count on the baize, while the slates are read
  if (st.t === 'slate' || (r.reads && !r.counted && !r.chair)) {
    if (st.t !== 'slate') h += `<div class="trt-counter" style="left:${W * .5}px;top:${H * (TABLE_CY - .02)}px"><b>${r.ordN || r.reads} / ${r.total || D.seated.length}</b><span>Read aloud</span></div>`;
  }
  // the host's place
  const hp = seatAt(0, slots, W, H);
  h += `<div class="trt-seat trt-host${speaker === '@host' ? ' trt-speak' : (focus ? ' trt-quiet' : '')}" style="left:${hp.x}px;top:${hp.y}px;width:${pw}px;z-index:${hp.z}">`
    + `<div class="trt-av">${face(D.host.name, D.host.slug)}</div><div class="trt-nm${small ? ' trt-sm' : ''}">${esc(D.host.name)}</div></div>`;
  // everybody else, with the chalk marks against them at their place
  const justVoted = st.t === 'slate' && st.ballot ? st.ballot.target : null;
  const per = fresh ? .14 : 0, begin = fresh ? .7 : 0;
  const writeDur = justVoted ? String(justVoted).length * per : 0;
  D.seated.forEach((n, i) => {
    const p = seatAt(i + 1, slots, W, H);
    const cnt = r.tally[n] || 0;
    const pending = fresh && justVoted === n ? 1 : 0;
    const cls = ['trt-seat', speaker === n || pair.includes(n) ? 'trt-speak' : (focus ? 'trt-quiet' : ''),
      st.target === n && speaker !== n && !r.reads ? 'trt-accused' : '',
      S.traitors.includes(n) ? 'trt-traitor' : '', r.turned && r.chair === n ? 'trt-out' : ''].join(' ');
    h += `<div class="${cls}" style="left:${p.x}px;top:${p.y}px;width:${pw}px;z-index:${p.z}">`
      + `<div class="trt-av">${face(n)}</div><div class="trt-nm${small ? ' trt-sm' : ''}">${esc(n)}</div>`
      + `<div class="trt-ticks">${'/'.repeat(Math.max(0, cnt - pending))}${pending ? `<i style="animation-delay:${(begin + writeDur + .2).toFixed(2)}s">/</i>` : ''}</div></div>`;
  });
  // THE SLATE, written in chalk in the voter's own hand, and the voter's reason
  if (st.t === 'slate' && st.ballot) {
    const b = st.ballot, nm = b.target || '';
    const hand = HANDS[hash(b.voter) % HANDS.length];
    const lead = Math.max(0, ...Object.values(r.tally));
    const chips = Object.keys(r.tally).sort((a, c) => r.tally[c] - r.tally[a] || a.localeCompare(c)).slice(0, 6).map(n =>
      `<span class="trt-chip"${r.tally[n] === lead ? ' data-lead="1"' : ''}${n === nm ? ' data-just="1"' : ''}>${esc(n)} <b>${r.tally[n]}</b></span>`).join('');
    const dust = fresh ? Array.from({ length: 9 }, (_, i) =>
      `<b class="trt-dust" style="left:${(i + .5) / 9 * 100}%;--d:${(begin + writeDur * (i + .5) / 9).toFixed(2)}s;--dx:${(i % 3 - 1) * 6}px"></b>`).join('') : '';
    h += `<div class="trt-slate${fresh ? '' : ' trt-in'}" style="--per:${per}s;--start:${begin}s;--dur:${writeDur}s"><div class="trt-face"><span class="trt-ord">${esc(st.ord)}</span>`
      + (nm ? `<div class="trt-chalk" style="font-family:${hand}">` + [...nm].map((c, i) => `<span style="--i:${i}">${esc(c)}</span>`).join('')
        + (fresh ? '<i class="trt-stick"></i>' : '') + dust + '</div>' : '<div class="trt-blank">left blank</div>')
      + `<div class="trt-by"><span class="trt-qf trt-bf">${face(b.voter)}</span><span>${esc(b.voter)}</span></div></div>`
      + `<div class="trt-run">${chips}</div></div>`;
    if (st.reason || st.note) {
      h += `<div class="trt-slot trt-late" style="--late:${(begin + writeDur + .35).toFixed(2)}s"><div class="trt-dcard">`
        + (st.reason ? `<div class="trt-quote"><span class="trt-qf">${face(b.voter)}</span><div><p class="trt-q"></p><small>${esc(b.voter)}</small></div></div>` : '')
        + (st.note ? `<div class="trt-note"${st.noteTone ? ` data-tone="${esc(st.noteTone)}"` : ''}>${esc(st.note)}</div>` : '')
        + '</div></div>';
    }
  }
  // THE COUNT: big when it is read, then in the corner for the rest of the night
  if (r.counted || st.t === 'count') {
    const names = Object.keys(r.tally).sort((a, c) => r.tally[c] - r.tally[a] || a.localeCompare(c)), top = r.tally[names[0]] || 1;
    h += `<div class="trt-count${st.t === 'count' ? ' trt-big' : ''}"><h5>The count</h5>` + names.slice(0, 8).map(n =>
      `<div class="trt-crow"${r.tally[n] === top ? ' data-top="1"' : ''}><span class="trt-cf">${face(n)}</span><span>${esc(n)}</span><b>${r.tally[n]}</b><i style="--w:${r.tally[n] / top * 100}%"></i></div>`).join('') + '</div>';
  }
  // THE CHAIR, and the card that turns over
  // once the chair is called it stays in the room: the reveal, the room
  // after it and the host's send-off all happen in front of it
  const onChair = !!r.chair;
  if (onChair) {
    const suspense = fresh && st.t === 'reveal';
    const faithful = (r.alignment || D.chosenAlignment) !== 'traitor';
    h += `<div class="trt-chair${r.turned && !suspense ? ' trt-turned' : ''}${suspense ? ' trt-suspense' : ''}${r.turned ? (faithful ? ' trt-fa' : ' trt-tr') : ''}">`
      + '<div class="trt-flash"></div><div class="trt-burst"></div>'
      + `<div class="trt-bigword">${faithful ? 'Faithful' : 'Traitor'}</div>`
      + `<div class="trt-cin"><div class="trt-k">The chair</div><div class="trt-who">${esc(r.chair)}</div><div class="trt-word">${esc(String(D.banish || '').replace(/^./, c => c.toUpperCase()))}</div>`
      + `<div class="trt-flip"><div class="trt-rin"><div class="trt-rf">${face(r.chair)}</div>`
      + `<div class="trt-rb ${faithful ? 'trt-faithful' : 'trt-traitorcard'}"><div><small>I am</small><strong>${faithful ? 'A Faithful' : 'A Traitor'}</strong></div></div></div></div>`
      + '</div></div>';
  }
  // THE LINE AT THE FOOT OF THE STAGE: the host, a player, or the narration
  let card = '';
  if (st.t === 'host') {
    card = `<div class="trt-hostcard"><span class="trt-hf">${face(D.host.name, D.host.slug)}</span><div><div class="trt-k">${esc(D.host.name)}</div><p class="trt-type"></p></div></div>`;
  } else if (st.t === 'say' || st.t === 'reveal') {
    const who = st.t === 'reveal' ? st.who : st.who;
    const tgt = st.t === 'say' && r.phase === 'debate' && st.target ? st.target : null;
    const voices = tgt ? st.accs.filter(x => x[1] === tgt).length : 0;
    card = '<div class="trt-dcard">'
      + (tgt ? `<div class="trt-dhead"><span class="trt-qf trt-acc">${face(tgt)}</span><div><div class="trt-k">The debate</div><b>${esc(tgt)}</b></div>`
        + (voices ? `<div class="trt-v"><em>${voices}</em>${voices === 1 ? 'voice' : 'voices'} at this name</div>` : '') + '</div>' : '')
      + `<div class="trt-quote"><span class="trt-qf">${face(who)}</span><div><p class="trt-type"></p><small>${esc(who)}</small></div></div></div>`;
  } else if (st.t === 'narr') {
    card = `<div class="trt-narr${st.aud ? ' trt-aud' : ''}${st.murmur ? ' trt-mur' : ''}">${st.tag ? `<span class="trt-tag">${esc(st.tag)}</span>` : ''}<p class="trt-type"></p></div>`;
  }
  if (card) h += `<div class="trt-slot${onChair ? ' trt-overchair' : ''}">${card}</div>`;
  rt.innerHTML = h;
  // motion
  const slot = rt.querySelector('.trt-slot:not(.trt-late)'), slate = rt.querySelector('.trt-slate');
  requestAnimationFrame(() => { if (slot) slot.classList.add('trt-in'); if (slate) slate.classList.add('trt-in'); });
  const type = (el, txt, speed, delay) => {
    if (!el) return;
    if (!fresh) { el.textContent = txt; return; }
    el.textContent = '';
    later(S, () => {
      let k = 0;
      const t = setInterval(() => { el.textContent = txt.slice(0, ++k); if (k >= txt.length) clearInterval(t); }, speed);
      S.timers.push(t);
    }, delay || 0);
  };
  const q = s => '“' + s + '”';
  if (st.t === 'slate' && st.reason) type(rt.querySelector('.trt-q'), q(st.reason), 14, (begin + writeDur + .5) * 1000);
  if (st.t === 'host') type(rt.querySelector('.trt-type'), q(st.text), 16);
  if (st.t === 'say') type(rt.querySelector('.trt-type'), q(st.text), 16);
  if (st.t === 'narr') type(rt.querySelector('.trt-type'), st.text, 12);
  if (st.t === 'reveal') revealSequence(rt, S, st, fresh);
  // the corner
  const corner = root.querySelector('.trs-corner');
  const label = r.turned ? 'The reveal' : r.chair ? 'The chair' : r.counted ? 'The count' : r.reads ? 'The slates' : r.phase === 'debate' ? 'The debate' : 'The table sits';
  corner.innerHTML = `The Round Table · <b>${label}</b>`;
  corner.classList.add('trs-in');
}

// THE REVEAL, SLOWLY. The room waits: the face under the light, a heartbeat,
// "I am…" said and held, a shake, then the card turns with the word stamped
// on it and the rest of the sentence arrives after it.
function revealSequence(rt, S, st, fresh) {
  const el = rt.querySelector('.trt-type'), chair = rt.querySelector('.trt-chair');
  const full = '“' + st.line + '”';
  if (!fresh || !chair) { if (el) el.textContent = full; return; }
  el.textContent = '';
  let k = 0;
  const lead = '“I am…';
  later(S, () => {
    const t = setInterval(() => { el.textContent = lead.slice(0, ++k); if (k >= lead.length) clearInterval(t); }, 150);
    S.timers.push(t);
  }, 700);
  later(S, () => chair.classList.add('trt-shake'), 3000);
  later(S, () => {
    chair.classList.remove('trt-shake');
    chair.classList.remove('trt-suspense');
    chair.classList.add('trt-turned', 'trt-flashing');
    const burst = chair.querySelector('.trt-burst');
    if (burst) burst.innerHTML = Array.from({ length: 28 }, (_, i) => {
      const a = i / 28 * Math.PI * 2, d = 140 + (i * 37) % 120;
      return `<i style="--x:${Math.cos(a) * d}px;--y:${Math.sin(a) * d}px;animation-delay:${(i % 5) * .03}s"></i>`;
    }).join('');
  }, 3500);
  later(S, () => {
    let j = 0;
    const t = setInterval(() => { el.textContent = full.slice(0, ++j); if (j >= full.length) clearInterval(t); }, 18);
    S.timers.push(t);
  }, 5000);
}

// ── THE LOOK: the US chamber, the old screen's slate, card, count and chair ─
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Caveat:wght@600;700&family=Kalam:wght@400;700&family=Gochi+Hand&family=Shadows+Into+Light&family=Reenie+Beanie&display=swap');
.trt{position:absolute;inset:0;--t-bone:#ded6c4;--t-bone-dim:rgba(222,214,196,.62);--t-candle:#fff3d2;--t-chalk:#eef2ec;
  --t-slate:#20262c;--t-slate-2:#12171c;--t-blood:#8e1526;--t-blood-hot:#c9283c;--t-rule:rgba(222,214,196,.17)}
.trt-seat{position:absolute;transform:translate(-50%,-50%);text-align:center;transition:filter .45s,transform .45s cubic-bezier(.2,1.2,.4,1)}
.trt-av{position:relative;width:100%;aspect-ratio:1/1.12;overflow:hidden;border-radius:50% 50% 12% 12%/44% 44% 9% 9%;
  background:linear-gradient(162deg,#252b37,#080b11);box-shadow:0 0 0 2px rgba(222,214,196,.35),0 8px 20px rgba(0,0,0,.8)}
.trt-av img,.trt-qf img,.trt-cf img,.trt-hf img,.trt-rf img,.trt-by img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:50% 18%;z-index:1}
.trt .trs-ini{font-size:14px}
.trt-nm{display:inline-block;margin-top:5px;padding:2px 8px;white-space:nowrap;font-family:var(--v-display);font-weight:700;font-size:10px;
  letter-spacing:.16em;text-transform:uppercase;color:var(--t-bone);background:rgba(4,7,5,.74);border:1px solid var(--t-rule)}
.trt-nm.trt-sm{font-size:8.5px;letter-spacing:.1em;padding:2px 5px}
.trt-ticks{height:12px;margin-top:2px;font-family:'Caveat',cursive;font-size:17px;line-height:12px;color:var(--t-chalk);letter-spacing:1px;text-shadow:0 0 6px rgba(238,242,236,.4)}
.trt-ticks i{font-style:normal;opacity:0;animation:trtIn .3s forwards}
.trt-seat.trt-quiet{filter:brightness(.55) saturate(.75)}
.trt-seat.trt-speak{transform:translate(-50%,-50%) scale(1.16);z-index:1400!important}
.trt-seat.trt-speak .trt-av{box-shadow:0 0 0 2px var(--t-candle),0 0 34px rgba(255,243,210,.55),0 8px 20px rgba(0,0,0,.8)}
.trt-seat.trt-accused .trt-av{box-shadow:0 0 0 2px var(--t-blood-hot),0 0 26px rgba(201,40,60,.6),0 8px 20px rgba(0,0,0,.8)}
.trt-seat.trt-host .trt-av{box-shadow:0 0 0 2px var(--t-candle),0 8px 20px rgba(0,0,0,.8)}
.trt-seat.trt-host .trt-nm{color:var(--t-candle)}
.trt-seat.trt-traitor .trt-av::after{content:"";position:absolute;inset:0;z-index:2;border-radius:inherit;box-shadow:inset 0 0 0 2px rgba(201,40,60,.9),inset 0 -26px 34px -16px rgba(142,21,38,.8)}
.trt-seat.trt-out{filter:grayscale(1) brightness(.35)}
.trt-threads{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;overflow:visible;z-index:900}
.trt-thread{fill:none;stroke:var(--t-blood-hot);stroke-width:3;stroke-linecap:round;filter:drop-shadow(0 0 5px rgba(201,40,60,.9));stroke-dasharray:1400;stroke-dashoffset:1400;animation:trtDraw 1s ease forwards}
.trt-thread.trt-old{stroke:rgba(201,40,60,.45);filter:none;animation:none;stroke-dashoffset:0}
.trt-thread.trt-faded{opacity:.35}
@keyframes trtDraw{to{stroke-dashoffset:0}}
.trt-counter{position:absolute;transform:translate(-50%,-50%);text-align:center;z-index:800;font-family:var(--v-display);color:var(--t-candle);text-shadow:0 2px 12px #000}
.trt-counter b{display:block;font-size:30px;font-weight:900}
.trt-counter span{font-size:10px;font-weight:700;letter-spacing:.3em;text-transform:uppercase;color:var(--t-bone-dim)}
.trt-slot{position:absolute;left:50%;bottom:3.5%;width:min(64%,780px);transform:translate(-50%,12px);opacity:0;z-index:3200;transition:.4s}
.trt-slot.trt-in{opacity:1;transform:translate(-50%,0)}
.trt-slot.trt-late{animation:trtLate .45s ease forwards;animation-delay:var(--late)}
@keyframes trtLate{to{opacity:1;transform:translate(-50%,0)}}
.trt-dcard,.trt-narr,.trt-hostcard{padding:13px 18px 12px;background:linear-gradient(160deg,rgba(26,14,7,.98),rgba(10,6,4,.98));border:1px solid var(--t-rule);box-shadow:0 18px 40px rgba(0,0,0,.75)}
.trt-dhead{display:flex;align-items:center;gap:12px;padding-bottom:9px;margin-bottom:10px;border-bottom:1px solid var(--t-rule)}
.trt-dhead b{display:block;font-family:var(--v-display);font-weight:900;font-size:21px;color:var(--t-bone)}
.trt-k{font-family:var(--v-display);font-size:9.5px;font-weight:700;letter-spacing:.32em;color:var(--t-bone-dim);text-transform:uppercase}
.trt-v{margin-left:auto;text-align:right;font-family:var(--v-display);font-size:9.5px;font-weight:700;letter-spacing:.22em;color:var(--t-bone-dim);text-transform:uppercase}
.trt-v em{display:block;font-style:normal;font-size:18px;color:var(--t-candle)}
.trt-qf,.trt-cf,.trt-hf{position:relative;display:block;flex:none;overflow:hidden;border-radius:50% 50% 12% 12%/44% 44% 9% 9%;background:#141922}
.trt-qf{width:40px;height:44px}.trt-qf.trt-acc{box-shadow:0 0 0 2px var(--t-blood-hot)}
.trt-hf{width:52px;height:58px}
.trt-quote{display:flex;gap:12px;align-items:flex-start;padding:9px 12px;border-left:2px solid var(--t-rule);background:rgba(255,243,210,.03)}
.trt-quote p,.trt-hostcard p{margin:0;font-family:var(--v-hand);font-size:clamp(16px,1.45vw,20px);line-height:1.38;color:var(--t-bone);min-height:1.4em}
.trt-quote small{display:block;margin-top:4px;font-family:var(--v-display);font-size:9.5px;font-weight:700;letter-spacing:.28em;color:var(--t-bone-dim);text-transform:uppercase}
.trt-hostcard{display:flex;gap:14px;align-items:center;background:radial-gradient(80% 140% at 50% 50%,rgba(74,40,16,.98),rgba(10,6,4,.98))}
.trt-hostcard p{font-style:italic;color:var(--t-candle)}
.trt-narr p{margin:0;font-family:var(--v-body);font-style:italic;font-size:clamp(16px,1.5vw,21px);line-height:1.38;color:#f1e6cc;text-align:center}
.trt-tag{display:block;text-align:center;margin-bottom:4px;font-family:var(--v-display);font-style:normal;font-size:9.5px;font-weight:700;letter-spacing:.32em;text-transform:uppercase;color:var(--v-lantern)}
.trt-narr.trt-aud{border-color:rgba(201,40,60,.45);background:linear-gradient(160deg,rgba(58,10,18,.97),rgba(20,5,8,.98))}
.trt-narr.trt-aud .trt-tag{color:#e87a82}
.trt-narr.trt-mur .trt-tag{color:var(--t-bone-dim)}
.trt-note{margin-top:8px;font-family:var(--v-body);font-style:italic;font-size:clamp(14px,1.3vw,18px);color:rgba(241,230,204,.85);text-align:center}
.trt-note[data-tone="turn"]{color:#e87a82}
.trt-slate{position:absolute;left:50%;top:22%;width:min(36%,420px);transform:translateX(-50%) rotateX(80deg);transform-origin:top;opacity:0;z-index:2500;
  padding:12px;border-radius:3px;background:linear-gradient(150deg,#4b3a22,#241b10);box-shadow:0 22px 44px rgba(0,0,0,.72),inset 0 1px 0 rgba(255,243,210,.2);transition:transform .55s cubic-bezier(.2,1.3,.4,1),opacity .25s}
.trt-slate.trt-in{transform:translateX(-50%) rotateX(0);opacity:1}
.trt-face{position:relative;padding:16px 18px 12px;text-align:center;background:linear-gradient(158deg,var(--t-slate),var(--t-slate-2));box-shadow:inset 0 0 40px rgba(0,0,0,.75)}
.trt-ord{position:absolute;left:12px;top:8px;font-family:var(--v-display);font-weight:900;font-size:11px;letter-spacing:.14em;color:rgba(238,242,236,.32)}
.trt-chalk{position:relative;display:inline-block;font-size:clamp(38px,4.4vw,58px);line-height:1.12;padding:0 6px;color:var(--t-chalk);filter:url(#trtChalk);
  text-shadow:0 0 1px rgba(238,242,236,.95),0 0 12px rgba(238,242,236,.25)}
.trt-chalk span{display:inline-block;white-space:pre;clip-path:inset(-30% 100% -30% -30%);animation:trtL var(--per) cubic-bezier(.4,.1,.6,.9) forwards;animation-delay:calc(var(--start) + var(--i) * var(--per))}
@keyframes trtL{to{clip-path:inset(-30% -30% -30% -30%)}}
.trt-blank{font-family:var(--v-display);font-size:14px;letter-spacing:.3em;text-transform:uppercase;color:rgba(238,242,236,.5);padding:14px 0}
.trt-stick{position:absolute;left:0;top:55%;width:38px;height:10px;border-radius:2px 4px 4px 2px;opacity:0;pointer-events:none;
  background:linear-gradient(180deg,#fffef8,#d9d6c8 70%,#b9b5a4);box-shadow:0 3px 6px rgba(0,0,0,.55);transform-origin:0 50%;
  animation:trtGo var(--dur) linear var(--start) forwards,trtBob var(--per) ease-in-out var(--start) infinite alternate,trtVis calc(var(--dur) + .5s) linear calc(var(--start) - .2s) forwards}
@keyframes trtGo{from{left:0}to{left:100%}}
@keyframes trtBob{from{transform:translate(-2px,-70%) rotate(-40deg)}to{transform:translate(-2px,-10%) rotate(-32deg)}}
@keyframes trtVis{0%{opacity:0}12%{opacity:1}88%{opacity:1}100%{opacity:0}}
.trt-dust{position:absolute;top:70%;width:3px;height:3px;border-radius:50%;background:#f4f2ea;opacity:0;animation:trtDust .9s ease-in forwards;animation-delay:var(--d)}
@keyframes trtDust{0%{opacity:.95;transform:translate(0,0)}100%{opacity:0;transform:translate(var(--dx),34px)}}
.trt-by{display:flex;align-items:center;justify-content:center;gap:10px;margin-top:10px;padding-top:9px;border-top:1px solid rgba(238,242,236,.14);
  font-family:var(--v-display);font-weight:700;font-size:10px;letter-spacing:.24em;text-transform:uppercase;color:rgba(238,242,236,.72)}
.trt-qf.trt-bf{width:26px;height:28px}
.trt-run{display:flex;gap:7px;flex-wrap:wrap;justify-content:center;padding:10px 2px 0;opacity:0;animation:trtIn .45s ease forwards calc(var(--start) + var(--dur) + .15s)}
@keyframes trtIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
.trt-chip{display:inline-flex;align-items:center;gap:6px;padding:3px 9px;border:1px solid rgba(222,214,196,.2);background:rgba(4,7,5,.55);
  font-family:var(--v-display);font-weight:700;font-size:9.5px;letter-spacing:.1em;text-transform:uppercase;color:rgba(222,214,196,.8)}
.trt-chip b{font-size:12px;color:var(--t-candle)}
.trt-chip[data-lead="1"]{border-color:rgba(201,40,60,.55);color:#e58490}.trt-chip[data-lead="1"] b{color:#e58490}
.trt-chip[data-just="1"]{border-color:rgba(240,224,170,.6);background:rgba(240,224,170,.1);color:rgba(246,238,214,.95)}
.trt-count{position:absolute;right:14px;bottom:14px;width:230px;padding:12px 14px;z-index:3300;background:linear-gradient(160deg,rgba(26,14,7,.98),rgba(10,6,4,.98));
  border:1px solid var(--t-rule);box-shadow:0 18px 40px rgba(0,0,0,.75);transition:.5s}
.trt-count.trt-big{right:50%;bottom:auto;top:18%;transform:translateX(50%);width:min(40%,420px);animation:trtIn .5s ease}
.trt-count h5{margin:0 0 8px;font-family:var(--v-display);font-size:10px;font-weight:700;letter-spacing:.34em;text-transform:uppercase;color:var(--t-bone-dim)}
.trt-crow{display:grid;grid-template-columns:24px 1fr auto;gap:9px;align-items:center;padding:6px 8px;margin-bottom:5px;border:1px solid rgba(222,214,196,.11);background:rgba(4,7,5,.5)}
.trt-cf{width:24px;height:26px}
.trt-crow span{font-family:var(--v-display);font-weight:700;font-size:13px;color:var(--t-bone)}
.trt-crow b{font-family:var(--v-display);font-weight:900;font-size:16px;color:var(--t-candle)}
.trt-crow i{grid-column:1/-1;height:3px;background:rgba(222,214,196,.09);position:relative}
.trt-crow i::after{content:"";position:absolute;left:0;top:0;bottom:0;width:var(--w);background:linear-gradient(90deg,rgba(142,21,38,.9),rgba(201,40,60,.9));animation:trtBar .8s ease both}
@keyframes trtBar{from{width:0}}
.trt-crow[data-top="1"]{border-color:rgba(201,40,60,.5)}.trt-crow[data-top="1"] b{color:#e58490}
.trt-chair{position:absolute;inset:0;z-index:3000;display:grid;place-items:center;background:radial-gradient(45% 55% at 50% 42%,rgba(4,4,6,.55),rgba(4,4,6,.96));animation:trtFade .8s ease}
@keyframes trtFade{from{opacity:0}}
.trt-cin{position:relative;text-align:center;width:min(46%,480px);margin-top:-12%}
.trt-who{font-family:var(--v-display);font-weight:900;font-size:clamp(28px,3.8vw,46px);color:var(--t-bone);margin:6px 0 2px}
.trt-word{font-family:var(--v-display);font-size:11px;font-weight:700;letter-spacing:.4em;color:#e58490;text-transform:uppercase}
.trt-flip{position:relative;margin:14px auto 0;width:min(46%,200px);aspect-ratio:3/4;perspective:1200px}
.trt-rin{position:relative;width:100%;height:100%;transform-style:preserve-3d;transition:transform 1.3s cubic-bezier(.3,1.25,.3,1)}
.trt-chair.trt-turned .trt-rin{transform:rotateY(180deg)}
.trt-rf,.trt-rb{position:absolute;inset:0;overflow:hidden;backface-visibility:hidden;border-radius:50% 50% 8% 8%/40% 40% 6% 6%}
.trt-rf{box-shadow:0 0 0 3px var(--t-bone),0 30px 70px rgba(0,0,0,.9);background:#141922}
.trt-rb{transform:rotateY(180deg);display:grid;place-items:center;padding:16px;text-align:center}
.trt-rb.trt-faithful{background:radial-gradient(circle at 50% 35%,#f1e6c8,#c9ba95);color:#241b11;box-shadow:0 0 0 3px var(--t-candle),0 0 60px rgba(255,243,210,.45)}
.trt-rb.trt-traitorcard{background:radial-gradient(circle at 50% 35%,#8e1526,#2a0508);color:#f3dcd8;box-shadow:0 0 0 3px var(--t-blood-hot),0 0 70px rgba(201,40,60,.65)}
.trt-rb small{display:block;font-family:var(--v-display);font-size:11px;font-weight:700;letter-spacing:.4em;margin-bottom:8px;opacity:.75;text-transform:uppercase}
.trt-rb strong{display:block;font-family:var(--v-display);font-weight:900;font-size:clamp(18px,1.9vw,26px);letter-spacing:.04em;line-height:1.1;text-transform:uppercase}
.trt-chair.trt-flashing .trt-rb strong{animation:trtStamp .7s cubic-bezier(.2,1.6,.4,1) 1.1s both}
@keyframes trtStamp{from{transform:scale(2.6);filter:blur(6px);opacity:0}to{transform:none;filter:none;opacity:1}}
/* the suspense: the light closes in, the face breathes, the room holds */
.trt-chair.trt-suspense{background:radial-gradient(22% 30% at 50% 42%,rgba(4,4,6,.2),rgba(0,0,0,.985));transition:background 2.4s}
.trt-chair.trt-suspense .trt-flip{animation:trtBreathe 1.1s ease-in-out infinite}
@keyframes trtBreathe{50%{transform:scale(1.045)}}
.trt-chair.trt-suspense .trt-rf{animation:trtBeat 1.1s ease-in-out infinite}
@keyframes trtBeat{0%,100%{box-shadow:0 0 0 3px var(--t-bone),0 0 0 rgba(255,243,210,0)}35%{box-shadow:0 0 0 3px var(--t-bone),0 0 60px rgba(255,243,210,.55)}}
.trt-chair.trt-shake .trt-flip{animation:trtShake .5s linear}
@keyframes trtShake{0%,100%{transform:translate(0)}20%{transform:translate(-4px,1px) rotate(-1deg)}40%{transform:translate(4px,-1px) rotate(1deg)}60%{transform:translate(-3px,0)}80%{transform:translate(3px,1px)}}
.trt-flash{position:absolute;inset:0;pointer-events:none;opacity:0}
.trt-chair.trt-flashing .trt-flash{animation:trtFlash 1.4s ease-out}
.trt-chair.trt-fa .trt-flash{background:radial-gradient(circle at 50% 42%,rgba(255,243,210,.95),rgba(255,219,149,.3) 40%,transparent 70%)}
.trt-chair.trt-tr .trt-flash{background:radial-gradient(circle at 50% 42%,rgba(255,80,90,.9),rgba(142,21,38,.45) 40%,transparent 70%)}
@keyframes trtFlash{0%{opacity:0}12%{opacity:1}100%{opacity:0}}
.trt-burst{position:absolute;left:50%;top:40%;width:0;height:0;pointer-events:none}
.trt-burst i{position:absolute;width:6px;height:6px;border-radius:50%;opacity:0;animation:trtSpark 1.3s cubic-bezier(.1,.8,.3,1) forwards;animation-delay:1.2s}
.trt-chair.trt-fa .trt-burst i{background:#ffe7a8;box-shadow:0 0 10px #ffdb95}
.trt-chair.trt-tr .trt-burst i{background:#ff5a64;box-shadow:0 0 10px #c9283c}
@keyframes trtSpark{0%{opacity:1;transform:translate(0,0) scale(1)}100%{opacity:0;transform:translate(var(--x),var(--y)) scale(.3)}}
.trt-slot.trt-overchair{z-index:3400}
/* the word itself, slammed across the room as the card turns, then left
   burning behind the chair for the rest of the night */
.trt-bigword{position:absolute;left:50%;top:44%;transform:translate(-50%,-50%);white-space:nowrap;pointer-events:none;opacity:0;
  font-family:var(--v-display);font-weight:900;font-size:clamp(70px,11vw,170px);letter-spacing:.12em;text-transform:uppercase}
.trt-chair.trt-fa .trt-bigword{color:rgba(255,243,210,.9);text-shadow:0 0 40px rgba(255,219,149,.8),0 0 120px rgba(255,219,149,.5)}
.trt-chair.trt-tr .trt-bigword{color:rgba(255,120,130,.92);text-shadow:0 0 40px rgba(201,40,60,.9),0 0 120px rgba(201,40,60,.6)}
.trt-chair.trt-turned .trt-bigword{opacity:.13;transform:translate(-50%,-50%) scale(1.05)}
.trt-chair.trt-flashing .trt-bigword{animation:trtSlam 3.2s cubic-bezier(.2,.9,.3,1) 1.05s both}
@keyframes trtSlam{0%{z-index:3;opacity:0;transform:translate(-50%,-50%) scale(3.2);letter-spacing:.6em;filter:blur(14px)}
  14%{opacity:1;transform:translate(-50%,-50%) scale(1);letter-spacing:.12em;filter:none}
  18%{transform:translate(calc(-50% - 6px),-50%) scale(1)}22%{transform:translate(calc(-50% + 5px),-50%) scale(1)}26%{transform:translate(-50%,-50%) scale(1)}
  62%{z-index:3;opacity:1}70%{z-index:0}100%{z-index:0;opacity:.13;transform:translate(-50%,-50%) scale(1.05)}}
.trt-cin{z-index:1}
@media (max-width:700px){.trt-slot{width:92%}.trt-slate{width:70%}.trt-count{display:none}.trt-count.trt-big{display:block;width:80%}}
`;
