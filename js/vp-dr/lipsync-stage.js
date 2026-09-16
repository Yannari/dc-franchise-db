// ══════════════════════════════════════════════════════════════════════
// vp-dr/lipsync-stage.js — the lip sync, staged as a concert
// ══════════════════════════════════════════════════════════════════════
//
// The lip sync screen was a VS card and a column of paragraphs. This is the
// stage the paragraphs happen on:
//   - a NOW PLAYING bar with the song, its tempo and a live equaliser that
//     pulses at the song's speed, and the song's four parts lighting up as the
//     performance moves through them (verse, chorus, the big moment, ending);
//   - the queens under their own spotlights, the one performing lit and
//     lifted, the other dimmed, with a meter each and a tug-of-war between
//     them built from the engine's own per-part scores;
//   - the BIG MOMENT (key change, dance break, breakdown, spoken bit) and every
//     stunt land as a banner across the stage, with stars when it works and a
//     shudder when it does not;
//   - a CONFESSIONAL cuts away: the stage freezes grey and the queen talks to
//     camera from a card of her own;
//   - the host's pause drops the lights to a heartbeat, and the verdict stamps
//     each queen SHANTAY or SASHAY (or WINNER on a night the song is a prize).
//
// Every step's stage state is built here from the row, so nothing on the
// stage runs ahead of the card that has been revealed. Objects are SVG;
// lights, bars and particles are plain geometry. Reduced motion shows the
// end states and moves nothing.
import { _portrait } from './style.js';

const esc = v => String(v ?? '').replace(/[&<>"]/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const HOOK = {
  'key-change': 'Key change', 'dance-break': 'Dance break', breakdown: 'The breakdown', spoken: 'Spoken word',
};
const TEMPO = { ballad: 'Ballad', mid: 'Mid-tempo', uptempo: 'Uptempo', dance: 'Dance' };
// Seconds per equaliser bounce: a ballad breathes, a dance track does not.
const BEAT = { ballad: 1.4, mid: 0.9, uptempo: 0.6, dance: 0.45 };
const STUNT_WORD = [
  [/death.?drop|dip/i, 'Death drop'], [/split/i, 'The split'], [/cartwheel/i, 'Cartwheel'],
  [/reveal/i, 'The reveal'], [/wig/i, 'Wig reveal'], [/jump|leap/i, 'The leap'], [/spin|turn/i, 'The spin'],
];

const spread = (n, seed) => {
  let s = seed;
  const r = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  return Array.from({ length: n }, () => ({ a: r(), b: r(), c: r(), d: r() }));
};

export const LS_CSS = `
.lsx{position:relative;isolation:isolate;overflow:hidden;border-radius:22px;margin:0 0 18px;padding:14px 18px 16px;
  background:radial-gradient(120% 90% at 50% 115%,#3a0716 0,#14030a 55%,#070105 100%);
  box-shadow:0 30px 80px -30px #000,inset 0 0 0 1px rgba(255,255,255,.07);color:#fff}
/* Always pinned; smaller on a shorter window, so the card just revealed
   still has room below it. */
.lsx{position:sticky;top:6px;z-index:5}
.lsx-cards .dr-step{scroll-margin-top:540px}
.lsx-bg,.lsx-bg i{position:absolute;inset:0;pointer-events:none}
.lsx-bg{z-index:0;transition:filter .7s}
.lsx > *:not(.lsx-bg){position:relative;z-index:1}
.lsx > .lsx-conf,.lsx > .lsx-banner,.lsx > .lsx-stars{position:absolute}
.lsx > .lsx-conf{z-index:6}.lsx > .lsx-banner{z-index:4}.lsx > .lsx-stars{z-index:3}
.lsx-haze{background:radial-gradient(70% 40% at 50% 100%,rgba(255,61,154,.18),transparent 70%)}
.lsx-flash{opacity:0;background:radial-gradient(circle at 50% 50%,#fff,rgba(255,220,240,.6) 25%,transparent 65%)}
.lsx-vig{box-shadow:inset 0 0 140px 50px rgba(0,0,0,.85);opacity:.5;transition:opacity .6s}
.lsx-sweep{opacity:0;background:linear-gradient(100deg,transparent 35%,rgba(255,255,255,.22) 50%,transparent 65%);background-size:250% 100%}

/* now playing */
.lsx-now{display:flex;align-items:center;gap:14px;flex-wrap:wrap;padding:8px 12px;border-radius:14px;
  background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);backdrop-filter:blur(6px)}
.lsx-note{width:30px;height:30px;flex:0 0 30px}
.lsx-song{display:flex;flex-direction:column;line-height:1.15;min-width:0}
.lsx-song b{font:400 20px/1.1 'Anton','Impact',sans-serif;letter-spacing:.02em;text-transform:uppercase}
.lsx-song small{font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#ffb3dc}
.lsx-eq{display:flex;align-items:flex-end;gap:3px;height:28px;margin-left:auto}
.lsx-eq i{width:5px;border-radius:2px;background:linear-gradient(0deg,#ff294b,#ffd66b);height:30%;
  animation:lsx-eq var(--bt) ease-in-out infinite alternate;animation-delay:var(--dl)}
@keyframes lsx-eq{from{height:18%}to{height:100%}}
.lsx[data-phase=idle] .lsx-eq i,.lsx[data-phase=hold] .lsx-eq i,.lsx[data-phase=confess] .lsx-eq i,.lsx[data-phase=verdict] .lsx-eq i{animation-play-state:paused;height:14%}
.lsx-tempo{font-size:10px;letter-spacing:.24em;text-transform:uppercase;padding:4px 9px;border-radius:99px;border:1px solid rgba(255,255,255,.2)}
.lsx-parts{display:flex;gap:6px;margin:10px 0 0;justify-content:center}
.lsx-parts span{font-size:10px;letter-spacing:.2em;text-transform:uppercase;padding:4px 10px;border-radius:99px;
  background:rgba(255,255,255,.05);color:#9d8193;transition:all .4s}
.lsx-parts span.on{background:rgba(255,61,154,.22);color:#fff}
.lsx-parts span.now{background:#ff3d9a;color:#fff;box-shadow:0 0 18px rgba(255,61,154,.7)}
.lsx-parts span.big.now{background:#ffd66b;color:#2a1a00;box-shadow:0 0 22px rgba(255,214,107,.8)}

/* the stage */
.lsx-stage{position:relative;display:grid;grid-template-columns:repeat(var(--n),1fr);gap:10px;align-items:end;
  min-height:250px;margin-top:6px}
.lsx-q{position:relative;display:flex;flex-direction:column;align-items:center;gap:8px;padding-top:30px;
  transition:transform .6s cubic-bezier(.2,1.4,.4,1),filter .6s,opacity .6s}
.lsx-cone{position:absolute;top:-30px;left:50%;width:240px;height:330px;transform:translateX(-50%);z-index:-1;
  background:linear-gradient(180deg,rgba(255,236,220,.28),rgba(255,61,154,.06) 70%,transparent);
  clip-path:polygon(44% 0,56% 0,100% 100%,0 100%);opacity:.35;transition:opacity .6s,background .6s}
.lsx-face{width:140px;height:140px;border-radius:50%;overflow:hidden;box-shadow:0 0 0 3px rgba(255,255,255,.15),0 20px 40px -12px #000;
  transition:box-shadow .5s}
.lsx-face > *,.lsx-face img{width:100%!important;height:100%!important;object-fit:cover;margin:0!important}
.lsx-q b{font:400 20px/1 'Anton','Impact',sans-serif;letter-spacing:.04em;text-transform:uppercase}
.lsx-meter{width:min(180px,90%);height:9px;border-radius:99px;background:rgba(255,255,255,.1);overflow:hidden}
.lsx-meter i{display:block;height:100%;width:50%;border-radius:99px;background:linear-gradient(90deg,#ff294b,#ffd66b);
  transition:width .8s cubic-bezier(.2,1.2,.4,1)}
.lsx-score{font:700 15px/1 ui-monospace,Menlo,monospace;color:#ffd66b;min-height:16px}
.lsx-stamp{position:absolute;top:44%;left:50%;transform:translate(-50%,-50%) rotate(-10deg) scale(2.6);opacity:0;white-space:nowrap;
  padding:6px 16px;border:4px solid currentColor;border-radius:8px;font:400 30px/1 'Anton','Impact',sans-serif;letter-spacing:.08em;
  background:rgba(10,2,6,.6);transition:none}
.lsx-q.st-shantay .lsx-stamp{color:#3be08a}
.lsx-q.st-sashay .lsx-stamp{color:#ff294b}
.lsx-q.st-winner .lsx-stamp{color:#ffd66b}
.lsx-q.st-chance .lsx-stamp{color:#b07aff}
.lsx-q[class*=st-] .lsx-stamp{animation:lsx-slam .45s cubic-bezier(.5,0,.3,1.4) .1s forwards}
@keyframes lsx-slam{to{opacity:1;transform:translate(-50%,-50%) rotate(-10deg) scale(1)}}

/* who is performing */
.lsx.any .lsx-q:not(.on){filter:brightness(.5) saturate(.6);transform:scale(.94)}
.lsx-q.on{transform:translateY(-10px) scale(1.06)}
.lsx-q.on .lsx-cone{opacity:1}
.lsx-q.on .lsx-face{box-shadow:0 0 0 4px #ff3d9a,0 0 60px 14px rgba(255,61,154,.55);animation:lsx-bop var(--bt) ease-in-out infinite alternate}
@keyframes lsx-bop{from{transform:translateY(0) rotate(-1.5deg)}to{transform:translateY(-6px) rotate(1.5deg)}}
.lsx-q.good .lsx-face{box-shadow:0 0 0 4px #ffd66b,0 0 70px 18px rgba(255,214,107,.6)}
.lsx-q.bad .lsx-face{box-shadow:0 0 0 4px #7a7a8a,0 0 30px rgba(0,0,0,.6);animation:lsx-wobble .5s ease-in-out 2}
@keyframes lsx-wobble{25%{transform:rotate(-6deg)}75%{transform:rotate(6deg)}}

/* the tug-of-war */
.lsx-tug{position:relative;height:10px;margin:12px auto 0;width:min(520px,90%);border-radius:99px;
  background:linear-gradient(90deg,rgba(255,61,154,.5),rgba(255,255,255,.08) 50%,rgba(56,189,248,.5))}
.lsx-tug i{position:absolute;top:50%;left:50%;width:22px;height:22px;margin:-11px 0 0 -11px;border-radius:50%;
  background:#fff;box-shadow:0 0 16px #fff;transition:left .8s cubic-bezier(.2,1.4,.4,1)}
.lsx-tug-k{display:flex;justify-content:space-between;width:min(520px,90%);margin:4px auto 0;font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:#c9a6bc}

/* the big moment */
.lsx-banner{position:absolute;left:0;right:0;top:40%;z-index:4;text-align:center;pointer-events:none;opacity:0;transform:scale(.6)}
.lsx-banner b{display:inline-block;padding:6px 26px;font:400 clamp(34px,6vw,64px)/1 'Anton','Impact',sans-serif;letter-spacing:.04em;
  text-transform:uppercase;color:#fff;text-shadow:0 0 30px #ff3d9a,0 6px 0 #7a0f3e;
  background:linear-gradient(90deg,transparent,rgba(255,61,154,.35),transparent)}
.lsx-banner.fail b{color:#c9c9d6;text-shadow:0 0 20px #000,0 6px 0 #333;background:linear-gradient(90deg,transparent,rgba(80,80,90,.4),transparent)}
.lsx-banner small{display:block;margin-top:6px;font-size:12px;letter-spacing:.3em;text-transform:uppercase;color:#ffd66b}
.lsx-banner.fail small{color:#ff8fa3}
.lsx-banner.show{animation:lsx-banner .7s cubic-bezier(.2,1.5,.4,1) forwards}
/* It stays up until the next card: a banner that fades before it is read is decoration. */
@keyframes lsx-banner{0%{opacity:0;transform:scale(.6)}60%{opacity:1;transform:scale(1.06)}100%{opacity:1;transform:scale(1)}}
.lsx.moment .lsx-sweep{animation:lsx-sweep 1.2s ease-out}
@keyframes lsx-sweep{0%{opacity:1;background-position:120% 0}100%{opacity:0;background-position:-120% 0}}
.lsx.moment .lsx-flash{animation:lsx-flash .9s ease-out}
@keyframes lsx-flash{0%{opacity:0}10%{opacity:.8}100%{opacity:0}}
.lsx.shake{animation:lsx-shake .45s linear}
@keyframes lsx-shake{20%{transform:translateX(-6px)}40%{transform:translateX(5px)}60%{transform:translateX(-4px)}80%{transform:translateX(3px)}}
.lsx-stars{position:absolute;left:50%;top:45%;width:0;height:0;z-index:3;pointer-events:none}
.lsx-stars i{position:absolute;width:var(--w);height:var(--w);opacity:0;background:var(--c);
  clip-path:polygon(50% 0,61% 38%,100% 50%,61% 62%,50% 100%,39% 62%,0 50%,39% 38%)}
.lsx.stars .lsx-stars i{animation:lsx-burst var(--t) cubic-bezier(.1,.7,.3,1) var(--dl) forwards}
@keyframes lsx-burst{0%{opacity:1;transform:translate(0,0) scale(.4) rotate(0)}80%{opacity:1}100%{opacity:0;transform:translate(var(--x),var(--y)) scale(1) rotate(var(--r))}}

/* the confessional cut */
.lsx[data-phase=confess] .lsx-bg,.lsx[data-phase=confess] .lsx-stage,.lsx[data-phase=confess] .lsx-tug{filter:grayscale(1) brightness(.45)}
.lsx-conf{position:absolute;inset:0;z-index:6;display:flex;align-items:center;justify-content:center;gap:20px;padding:24px;
  opacity:0;pointer-events:none;transition:opacity .35s}
.lsx[data-phase=confess] .lsx-conf{opacity:1}
.lsx-conf .lsx-cframe{position:relative;flex:0 0 150px;width:150px;height:150px;border-radius:18px;overflow:hidden;
  box-shadow:0 0 0 3px #b07aff,0 20px 50px rgba(0,0,0,.8);transform:rotate(-3deg)}
.lsx-conf .lsx-cframe > *,.lsx-conf .lsx-cframe img{width:100%!important;height:100%!important;object-fit:cover;margin:0!important}
.lsx-conf .lsx-cbody{max-width:460px;padding:16px 20px;border-radius:16px;background:rgba(20,8,30,.92);border:1px solid rgba(176,122,255,.5)}
.lsx-conf small{display:inline-block;margin-bottom:8px;padding:3px 10px;border-radius:99px;background:#b07aff;color:#12051f;
  font-size:10px;letter-spacing:.28em;text-transform:uppercase}
.lsx-conf q{display:block;font-size:18px;line-height:1.45;font-style:italic;quotes:none}
.lsx[data-phase=confess] .lsx-conf .lsx-cframe{animation:lsx-in .45s cubic-bezier(.2,1.4,.4,1)}
@keyframes lsx-in{from{transform:rotate(-10deg) translateX(-40px);opacity:0}}

/* the host's pause */
.lsx[data-phase=hold] .lsx-vig{opacity:1;animation:lsx-heart 1s ease-in-out infinite}
@keyframes lsx-heart{0%,100%{box-shadow:inset 0 0 140px 50px rgba(0,0,0,.85)}15%{box-shadow:inset 0 0 200px 90px rgba(60,0,15,.95)}30%{box-shadow:inset 0 0 140px 50px rgba(0,0,0,.85)}45%{box-shadow:inset 0 0 180px 70px rgba(60,0,15,.9)}}
.lsx[data-phase=hold] .lsx-q{filter:brightness(.8)}
.lsx[data-phase=hold] .lsx-q .lsx-cone{opacity:.15}
.lsx[data-phase=verdict] .lsx-q.st-sashay{filter:grayscale(1) brightness(.6);transform:scale(.92)}
.lsx[data-phase=verdict] .lsx-q.st-shantay .lsx-face,.lsx[data-phase=verdict] .lsx-q.st-winner .lsx-face{box-shadow:0 0 0 4px #ffd66b,0 0 60px 16px rgba(255,214,107,.55)}
.lsx[data-phase=verdict] .lsx-q.st-shantay .lsx-cone,.lsx[data-phase=verdict] .lsx-q.st-winner .lsx-cone{opacity:1;background:linear-gradient(180deg,rgba(255,236,160,.45),transparent 80%)}

/* the cards under the stage */
.lsx-cards{display:grid;gap:10px}
.lsx-cards .dr-panel.lsx-cconf{border-color:rgba(176,122,255,.5);background:linear-gradient(180deg,rgba(60,22,96,.5),rgba(30,10,48,.5))}
.lsx-cards .dr-panel.lsx-cconf p{font-style:italic}
.lsx-cards .lsx-ctag{display:inline-block;margin-bottom:4px;font-size:10px;letter-spacing:.24em;text-transform:uppercase;color:#cbb3ff}
.lsx-cards .dr-panel.lsx-cmoment{border-color:rgba(255,214,107,.55)}
.lsx-cards .lsx-ctag.m{color:#ffd66b}

@media (max-width:640px){.lsx-face{width:96px;height:96px}.lsx-cone{width:160px}.lsx-stage{min-height:230px}}
@media (prefers-reduced-motion: reduce){
  .lsx,.lsx *{animation:none!important;transition:none!important}
  .lsx-q[class*=st-] .lsx-stamp{opacity:1;transform:translate(-50%,-50%) rotate(-10deg)}
}
/* Last, so it wins over the base sizes above. */
@media (max-height: 999px){
  .lsx{padding:8px 14px 10px}
  .lsx-now{padding:5px 10px;gap:10px}
  .lsx-song b{font-size:16px}
  .lsx-song small{font-size:9.5px}
  .lsx-eq{height:20px}
  .lsx-parts{margin-top:6px}
  .lsx-parts span{padding:3px 8px;font-size:9px}
  .lsx-stage{min-height:0}
  .lsx-q{padding-top:14px;gap:5px}
  .lsx-face{width:78px;height:78px}
  .lsx-cone{width:150px;height:200px;top:-14px}
  .lsx-q b{font-size:15px}
  .lsx-stamp{font-size:20px;padding:4px 10px;border-width:3px}
  .lsx-tug{margin-top:8px;height:8px}
  .lsx-tug i{width:16px;height:16px;margin:-8px 0 0 -8px}
  .lsx-banner b{font-size:clamp(26px,4.5vw,40px)}
  .lsx-conf{padding:12px;gap:12px}
  .lsx-conf .lsx-cframe{flex-basis:86px;width:86px;height:86px}
  .lsx-conf q{font-size:14px}
  .lsx-cards .dr-step{scroll-margin-top:360px}
}
`;

function noteSvg() {
  return `<svg class="lsx-note" viewBox="0 0 32 32" aria-hidden="true">
    <circle cx="16" cy="16" r="15" fill="#ff3d9a"/>
    <path d="M13 22.5a3 3 0 11-2-2.8V9l10-2v11.5a3 3 0 11-2-2.8V10.4l-6 1.2z" fill="#fff"/></svg>`;
}

function stars(n = 26) {
  const cols = ['#ffd66b', '#fff1a8', '#ff7bc8', '#ffffff'];
  return spread(n, 19).map((p, i) => {
    const ang = p.a * Math.PI * 2;
    const dist = 90 + p.b * 220;
    return `<i style="--x:${Math.round(Math.cos(ang) * dist)}px;--y:${Math.round(Math.sin(ang) * dist * 0.7)}px;`
      + `--r:${Math.round(p.c * 360)}deg;--t:${(0.9 + p.d * 0.8).toFixed(2)}s;--dl:${(p.c * 0.15).toFixed(2)}s;`
      + `--w:${8 + Math.round(p.d * 14)}px;--c:${cols[i % cols.length]}"></i>`;
  }).join('');
}

/**
 * The stage and a function that applies step `idx` to it.
 *
 * `beats` are the lip sync screen's own steps (the scenes it reveals, in
 * order). Returns `{ html, apply }`.
 */
export function lipsyncStage(row, beats, { ep, goesHome = null, callAt = -1 } = {}) {
  const ls = row?.dr?.lipsync || {};
  const queens = (ls.queens || []).slice(0, 3);
  const two = queens.length === 2;
  const tempo = ls.tempo || 'mid';
  const bt = BEAT[tempo] || 0.9;
  const hookName = HOOK[ls.hook] || null;
  const parts = ['Verse', 'Chorus', hookName || 'Bridge', 'Ending'];
  const roundsOf = nm => (ls.beats?.[nm] || []).map(x => Number(x.delta) || 0);
  const rounds = Object.fromEntries(queens.map(q => [q, roundsOf(q)]));
  const nR = Math.max(0, ...queens.map(q => rounds[q].length));
  const scoreOf = nm => Number(ls.scores?.[nm]) || 0;
  const saved = new Set(ls.saved || []);
  const tried = new Set((ls.saveTries || []).map(t => t.queen));
  const legacy = ls.call === 'legacy';
  const prize = ls.call === 'for-the-win' || legacy;

  const lastBeat = (callAt >= 0 ? callAt : beats.length) - 1;
  const sideOf = sc => {
    const who = (sc.data?.players || []).filter(n => queens.includes(n));
    return who.length === 1 ? who[0] : null;
  };
  const hookAt = beats.findIndex(sc => sc.kind === 'stage:lipsync-hook');

  // ── one state per step ──
  const states = beats.map((sc, idx) => {
    const done = callAt >= 0 && idx >= callAt;
    let k = done ? nR : Math.max(0, Math.min(nR, Math.round(((idx + 1) / Math.max(1, lastBeat + 1)) * nR)));
    // The big moment is the third part of the song, whenever its card lands.
    if (idx >= hookAt && hookAt >= 0) k = Math.max(k, Math.min(nR, 3));
    const sums = Object.fromEntries(queens.map(q => [q, rounds[q].slice(0, k).reduce((t, v) => t + v, 0)]));
    const meters = Object.fromEntries(queens.map(q => [q, done
      ? Math.max(6, Math.min(100, scoreOf(q) * 10))
      : Math.max(6, Math.min(100, 50 + (sums[q] / 1.3) * 50))]));
    /* At the verdict the rope follows the FINAL scores, which carry the
       host's lean as well as the four parts — otherwise it could point at the
       queen who is going home. */
    const tug = !two ? 50 : done
      ? Math.max(6, Math.min(94, 50 + (scoreOf(queens[1]) - scoreOf(queens[0])) * 8))
      : Math.max(6, Math.min(94, 50 + (sums[queens[1]] - sums[queens[0]]) * 34));
    const who = sideOf(sc);
    const kind = sc.kind || '';
    const st = {
      phase: 'song', k, meters, tug, on: who, mood: null, banner: null, stamps: {}, scores: done ? Object.fromEntries(queens.map(q => [q, scoreOf(q).toFixed(1)])) : {},
      stars: false, shake: false, moment: false, confess: null,
    };
    if (idx < 0 || kind === 'stage:lipsync-intro') { st.phase = 'intro'; st.on = null; }
    if (kind === 'stage:lipsync-hook') {
      const good = sc.data?.tier === 'nailed';
      st.moment = true; st.mood = good ? 'good' : 'bad';
      st.banner = { text: hookName || 'The big moment', sub: good ? `${who} owns it` : `${who} misses it`, fail: !good };
      st.stars = good; st.shake = !good;
    } else if (kind === 'stage:lipsync-stunt') {
      const good = sc.data?.tier === 'landed';
      const word = (STUNT_WORD.find(([re]) => re.test(sc.text || '')) || [null, 'The stunt'])[1];
      st.moment = true; st.mood = good ? 'good' : 'bad';
      st.banner = { text: good ? `${word}!` : `${word}... oof`, sub: good ? `${who} lands it` : `${who} does not`, fail: !good };
      st.stars = good; st.shake = !good;
    } else if (kind.startsWith('confess:')) {
      const speaker = (sc.data?.players || [])[0];
      st.phase = 'confess';
      st.on = null;
      st.confess = `<span class="lsx-cframe">${speaker ? _portrait(speaker, ep, { size: 150 }) : ''}</span>
        <div class="lsx-cbody"><small>Confessional${speaker ? ` · ${esc(speaker)}` : ''}</small><q>${esc(sc.text)}</q></div>`;
    } else if (kind === 'stage:lipsync-suspense' || kind === 'stage:lipsync-call') {
      st.phase = kind === 'stage:lipsync-call' ? 'verdict' : 'hold';
      st.on = null;
    }
    if (done && kind !== 'stage:lipsync-suspense') {
      st.phase = kind.startsWith('confess:') ? 'confess' : 'verdict';
      st.on = null;
    }
    return st;
  });

  // The verdict stamps land one at a time, in the order the host says them.
  const stamped = {};
  beats.forEach((sc, idx) => {
    const kind = sc.kind || '';
    const who = sideOf(sc) || (sc.data?.players || [])[0];
    if (kind === 'stage:lipsync-shantay' && who) stamped[who] = 'shantay';
    if (kind === 'stage:lipsync-sashay' && who) stamped[who] = tried.has(who) || saved.has(who) ? 'chance' : 'sashay';
    if ((kind === 'stage:lipsync-win-name' || kind === 'stage:lipsync-win-reaction') && who) stamped[who] = 'winner';
    if (kind === 'stage:lipsync-call' || (callAt >= 0 && idx >= callAt && !Object.keys(stamped).length)) {
      for (const q of queens) {
        if (ls.call === 'double-shantay') stamped[q] = 'shantay';
        else if (ls.call === 'double-sashay') stamped[q] = 'sashay';
        else if (prize) stamped[q] = q === ls.winner ? 'winner' : null;
        else if (q === goesHome || (ls.losers || []).includes(q)) stamped[q] = tried.has(q) ? 'chance' : 'sashay';
        else if (q === ls.winner || !goesHome) stamped[q] = 'shantay';
      }
    }
    if (callAt >= 0 && idx >= callAt) states[idx].stamps = { ...stamped };
  });

  const STAMP = { shantay: 'Shantay', sashay: 'Sashay away', winner: legacy ? 'The power' : 'Winner', chance: 'Last chance' };
  const eq = Array.from({ length: 12 }, (_, i) => `<i style="--dl:${(i * 0.07).toFixed(2)}s"></i>`).join('');
  const cols = queens.map(q => `<div class="lsx-q" data-q="${esc(q)}">
      <i class="lsx-cone"></i>
      <div class="lsx-face">${_portrait(q, ep, { size: 140 })}</div>
      <b>${esc(q)}</b>
      <div class="lsx-meter"><i data-m="${esc(q)}" style="width:50%"></i></div>
      <span class="lsx-score" data-s="${esc(q)}"></span>
      <span class="lsx-stamp" data-st="${esc(q)}"></span>
    </div>`).join('');
  const html = `<!--dr-chrome--><div class="lsx" id="lsx" data-phase="idle" style="--n:${Math.max(1, queens.length)};--bt:${bt}s">
    <div class="lsx-bg"><i class="lsx-haze"></i><i class="lsx-sweep"></i><i class="lsx-flash"></i><i class="lsx-vig"></i></div>
    <div class="lsx-now">${noteSvg()}
      <div class="lsx-song"><small>Lip sync ${prize ? (legacy ? 'for your legacy' : 'for the win') : 'for your life'}</small>
        <b>${esc(ls.song || '')}</b><small style="color:#c9a6bc">${esc(ls.artist || '')}</small></div>
      <span class="lsx-tempo">${esc(TEMPO[tempo] || tempo)}</span>
      <div class="lsx-eq" style="--bt:${(bt / 2).toFixed(2)}s">${eq}</div>
    </div>
    <div class="lsx-parts">${parts.map((p, i) => `<span data-p="${i}" class="${i === 2 && hookName ? 'big' : ''}">${esc(p)}</span>`).join('')}</div>
    <div class="lsx-stage">${cols}</div>
    ${two ? `<div class="lsx-tug"><i data-tug></i></div>
      <div class="lsx-tug-k"><span>${esc(queens[0])}</span><span>who has the room</span><span>${esc(queens[1])}</span></div>` : ''}
    <div class="lsx-banner"><b data-bn></b><small data-bs></small></div>
    <div class="lsx-stars">${stars()}</div>
    <div class="lsx-conf" data-conf></div>
  </div><!--/dr-chrome-->`;

  let prev = -99;
  let timer = null;
  const apply = idx => {
    if (typeof document === 'undefined') return;
    const el = document.getElementById('lsx');
    if (!el) return;
    const st = idx < 0 ? null : states[Math.min(idx, states.length - 1)];
    const fresh = idx === prev + 1;
    prev = idx;
    clearTimeout(timer);
    el.classList.remove('moment', 'stars', 'shake');
    const bn = el.querySelector('.lsx-banner');
    bn.classList.remove('show', 'fail');
    if (!st) {
      el.dataset.phase = 'idle';
      el.classList.remove('any');
      return;
    }
    el.dataset.phase = st.phase;
    el.classList.toggle('any', !!st.on);
    el.querySelectorAll('.lsx-parts span').forEach((p, i) => {
      p.classList.toggle('on', i < st.k);
      p.classList.toggle('now', i === st.k - 1 && st.phase === 'song');
    });
    for (const q of el.querySelectorAll('.lsx-q')) {
      const n = q.dataset.q;
      q.classList.toggle('on', st.on === n);
      q.classList.toggle('good', st.on === n && st.mood === 'good');
      q.classList.toggle('bad', st.on === n && st.mood === 'bad');
      q.classList.remove('st-shantay', 'st-sashay', 'st-winner', 'st-chance');
      const s = st.stamps[n];
      if (s) q.classList.add(`st-${s}`);
      const stamp = q.querySelector('.lsx-stamp');
      if (stamp) stamp.textContent = s ? STAMP[s] : '';
    }
    for (const m of el.querySelectorAll('[data-m]')) m.style.width = `${st.meters[m.dataset.m] ?? 50}%`;
    for (const s of el.querySelectorAll('[data-s]')) s.textContent = st.scores[s.dataset.s] || '';
    const tug = el.querySelector('[data-tug]');
    if (tug) tug.style.left = `${st.tug}%`;
    const conf = el.querySelector('[data-conf]');
    if (conf) conf.innerHTML = st.confess || '';
    // The big moment only plays when it is the step just revealed.
    if (fresh && st.banner) {
      el.querySelector('[data-bn]').textContent = st.banner.text;
      el.querySelector('[data-bs]').textContent = st.banner.sub;
      void el.offsetWidth;
      bn.classList.toggle('fail', !!st.banner.fail);
      bn.classList.add('show');
      if (st.moment) el.classList.add('moment');
      if (st.stars) el.classList.add('stars');
      if (st.shake) el.classList.add('shake');
      timer = setTimeout(() => el.classList.remove('stars', 'shake', 'moment'), 1600);
    }
  };
  return { html, apply, states };
}

/** A card's extra class and tag, so the column reads as the show does. */
export function lipsyncCardDecor(sc) {
  const kind = sc?.kind || '';
  if (kind.startsWith('confess:')) return { cls: ' lsx-cconf', tag: '<span class="lsx-ctag">Confessional</span>' };
  if (kind === 'stage:lipsync-hook') return { cls: ' lsx-cmoment', tag: `<span class="lsx-ctag m">${esc(HOOK[sc.data?.hook] || 'The big moment')}</span>` };
  if (kind === 'stage:lipsync-stunt') return { cls: ' lsx-cmoment', tag: '<span class="lsx-ctag m">Stunt</span>' };
  return { cls: '', tag: '' };
}
