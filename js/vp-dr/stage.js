// ══════════════════════════════════════════════════════════════════════
// vp-dr/stage.js — the main stage, the runway, the critiques, Untucked
// ══════════════════════════════════════════════════════════════════════
//
// The four screens the episode turns on, and the one place the show's own
// ORDER matters more than anything on the page:
//
//   THE PANEL RANKS.        Then the host decides. Those are two different
//                           moments and the critiques screen only knows the
//                           first one. `finalRank` is not on it — not
//                           hidden, ABSENT — because at that point in the
//                           night the host has not decided, and putting the
//                           answer on the screen where the question is asked
//                           is the whole spoiler.
//
// ── AND THE PANEL DISAGREES ───────────────────────────────────────────
//
// Measured at 24.7% of critiqued queens. Tone comes from each judge's own
// view rather than from the call, so a MIXED plate beside a PRAISE plate is
// a real disagreement and not decoration. The rail carries the panel's
// running ranking, which is what the viewer is actually watching.
import { _shell, _portrait, _judgePortrait, _icon, _note, _roomRail, ROOM_RAIL_CSS } from './style.js';
import { _controls, _seedRail } from './reveal.js';
import { JUDGES } from '../dr/data/judges.js';

const esc = v => String(v ?? '').replace(/[&<>"]/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const n1 = v => (Number.isFinite(Number(v)) ? Number(v).toFixed(1) : '—');
const epOf = row => ({ num: row?.num ?? row?.dr?.ep ?? 0, format: 'drag-race', dr: row?.dr || {} });
const judgeName = id => (JUDGES.find(j => j.id === id)?.name || id);

export const STAGE_CSS = `
/* ══ THE MAIN STAGE ══ the arch, the wash and the lip of the runway ══ */
.dr-mainroom{position:relative}
.dr-mainhall{position:absolute;inset:-24px -18px;z-index:-1;pointer-events:none;
  overflow:hidden;background:radial-gradient(110% 60% at 50% 0%,rgba(255,61,154,.16),transparent 62%)}
.dr-mainhall i{position:absolute;display:block}
/* The arch the whole night is framed by. */
.dr-mh-arch{top:0;left:4%;right:4%;height:130px;
  border:2px solid rgba(255,200,61,.22);border-top:0;border-radius:0 0 60px 60px;
  box-shadow:0 14px 44px -22px rgba(255,200,61,.5)}
.dr-mh-wash{top:0;left:50%;width:520px;height:64%;transform:translateX(-50%);
  background:linear-gradient(180deg,rgba(255,233,168,.13),transparent 74%)}
/* The lip of the runway, where it meets the seats. */
.dr-mh-lip{left:0;right:0;bottom:0;height:16%;
  background:linear-gradient(180deg,transparent,rgba(255,200,61,.10));
  border-top:1px solid rgba(255,200,61,.22)}

/* ══ THE LOUNGE ══ where Untucked happens, which is not the main stage ══ */
.dr-lounge{position:absolute;inset:-24px -18px;z-index:-1;pointer-events:none;
  overflow:hidden;background:
    radial-gradient(90% 55% at 50% 0%,rgba(123,47,247,.20),transparent 62%),
    linear-gradient(180deg,rgba(18,6,24,.5),transparent 40%)}
.dr-lounge i{position:absolute;display:block}
/* The sign on the wall, lit and buzzing. */
.dr-lo-sign{top:26px;left:50%;width:210px;height:3px;transform:translateX(-50%);
  background:#FF3D9A;box-shadow:0 0 30px 8px rgba(255,61,154,.55);
  animation:drBuzz 6s ease-in-out infinite}
@keyframes drBuzz{0%,96%,100%{opacity:1}97%{opacity:.35}98.5%{opacity:.9}}
/* The couch, along the back. */
.dr-lo-couch{left:8%;right:8%;bottom:16%;height:120px;border-radius:14px 14px 0 0;
  background:linear-gradient(180deg,rgba(123,47,247,.16),rgba(0,0,0,.35));
  border-top:2px solid rgba(255,255,255,.07)}
/* The bar, off to one side, under-lit. */
.dr-lo-bar{right:2%;bottom:0;width:110px;height:34%;
  background:linear-gradient(180deg,rgba(255,200,61,.10),transparent 70%);
  border-left:1px solid rgba(255,200,61,.16)}

/* THE ROOM'S TEMPERATURE, in the rail. */
.dr-temp{position:relative;height:5px;margin:4px 0 5px;border-radius:3px;
  background:linear-gradient(90deg,#FF294B,rgba(255,255,255,.18),#3BE08A)}
.dr-temp i{position:absolute;top:-4px;width:3px;height:13px;background:#fff;
  border-radius:2px;box-shadow:0 0 10px rgba(255,255,255,.8);transform:translateX(-50%);
  transition:left .4s}
.dr-temp-k{display:flex;justify-content:space-between;font-size:8.5px;
  letter-spacing:.16em;text-transform:uppercase;color:#b892a8}
.dr-temp-v{margin:7px 0 0;font-size:14px;color:#ffd0e8}

@media(prefers-reduced-motion:reduce){.dr-lo-sign{animation:none}.dr-temp i{transition:none}}

/* ══ THE CATWALK ══ the walkway, drawn behind the walks ══
   A perspective floor running away from the reader with a lit edge down
   each side and the back wall at the top. Absolute inside the content
   column so the walkway is the screen, and it runs the full length of the
   night rather than one screenful. */
.dr-catwalk{position:absolute;inset:-24px -18px;z-index:-1;pointer-events:none;
  overflow:hidden}
.dr-catwalk i{position:absolute;display:block}
.dr-cw-floor{inset:0;background:
  linear-gradient(180deg,rgba(255,61,154,.12),transparent 30%),
  linear-gradient(90deg,transparent,rgba(255,233,168,.05) 32%,
    rgba(255,233,168,.05) 68%,transparent)}
.dr-cw-edge{top:0;bottom:0;width:2px;
  background:linear-gradient(180deg,rgba(255,200,61,.65),rgba(255,200,61,.06));
  box-shadow:0 0 22px 3px rgba(255,200,61,.28)}
.dr-cw-edge.dr-l{left:15%}
.dr-cw-edge.dr-r{right:15%}
.dr-cw-back{top:0;left:0;right:0;height:180px;
  background:radial-gradient(60% 100% at 50% 0%,rgba(255,61,154,.26),transparent 70%)}

/* THE PHOTOGRAPHERS' PIT, for a look that earns it. */
.dr-walk{position:relative}
.dr-pit{position:absolute;inset:0;overflow:hidden;pointer-events:none;border-radius:2px}
.dr-pit i{position:absolute;top:8%;width:52px;height:52px;border-radius:50%;
  background:radial-gradient(circle,rgba(255,255,255,.85),transparent 62%);
  opacity:0;animation:drFlash 2.6s ease-out infinite}
.dr-pit i:nth-child(1){left:6%;animation-delay:.1s}
.dr-pit i:nth-child(2){left:26%;animation-delay:.7s}
.dr-pit i:nth-child(3){right:24%;animation-delay:1.3s}
.dr-pit i:nth-child(4){right:5%;animation-delay:1.9s}
@keyframes drFlash{0%,100%{opacity:0}3%{opacity:.9}12%{opacity:0}}
.dr-flashy{border-color:rgba(255,233,168,.45)}

@media(prefers-reduced-motion:reduce){.dr-pit i{animation:none;opacity:0}}

/* ══ THE BENCH ══ the panel, seated, above the critiques it is giving ══
   Sticky, because the panel does not leave while it is judging. The seat
   of whoever is speaking about the current queen comes up in the light and
   the others go back — which is what a bench looks like on the night. */
.dr-bench{position:sticky;top:0;z-index:6;display:flex;justify-content:center;
  gap:26px;padding:16px 18px 0;margin:0 0 20px;align-items:flex-end;
  background:radial-gradient(120% 130% at 50% 0%,rgba(255,61,154,.16),transparent 62%),
    linear-gradient(180deg,#22091A,#12040C 78%,rgba(8,2,5,.96));
  border-bottom:1px solid rgba(255,61,154,.28);
  box-shadow:0 18px 38px -22px rgba(0,0,0,.95)}
/* THE DESK WAS EATING THE NAMES. It is a 22px bar pinned to the bottom of
   the bench, and the seats only reserved 16px, so a judge's taste line ran
   under it and the longer ones were cut in half. */
.dr-seat-j{position:relative;z-index:2;width:132px;text-align:center;padding-bottom:30px;
  opacity:.45;filter:grayscale(.7);transition:opacity .35s,filter .35s,transform .35s}
.dr-seat-j.on{opacity:1;filter:none;transform:translateY(-4px)}
.dr-seat-j .dr-por{margin:0 auto;border:2px solid rgba(255,255,255,.22)}
.dr-seat-j.on .dr-por{border-color:#FFC83D;box-shadow:0 0 34px -6px rgba(255,200,61,.75)}
.dr-seat-j b{display:block;margin-top:7px;font-size:12.5px;color:#f0dfe9}
.dr-seat-j i{display:block;margin-top:2px;font-size:9.5px;font-style:normal;
  color:#b892a8;line-height:1.3}
/* The desk they are sitting behind. */
.dr-bench-desk{position:absolute;left:0;right:0;bottom:0;height:22px;z-index:1;
  background:linear-gradient(180deg,rgba(255,255,255,.10),rgba(0,0,0,.5));
  border-top:1px solid rgba(255,255,255,.16)}
@media(max-width:760px){
  .dr-bench{position:static;gap:12px}
  .dr-seat-j{width:96px}
  .dr-seat-j i{display:none}
}
@media(prefers-reduced-motion:reduce){.dr-seat-j{transition:none}}
/* The critiques scroll under a sticky bench, so they reserve its room. */
.dr-step{scroll-margin-top:210px}

/* ── THE DISMISSAL ── the safe queens, sent to Untucked ── */
.dr-delib{display:grid;grid-template-columns:auto 1fr;gap:14px;align-items:start;
  padding:14px 16px 14px 20px}
.dr-delib p{margin:4px 0 0;color:#f4e3ed;line-height:1.6;text-wrap:pretty}
.dr-delib .dr-sub{font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:#C9A6BC}
.dr-delib-q{display:inline-flex;align-items:center;gap:6px;margin-top:8px;
  font-size:11px;color:#C9A6BC}
.dr-delib-q b{color:#FF7BC8;letter-spacing:.08em}
.dr-dismiss{display:grid;grid-template-columns:auto 1fr;gap:15px;align-items:start;
  padding:15px 18px;border-left:3px solid #4b5563}
.dr-dismiss-faces{display:flex;flex-wrap:wrap;gap:5px;max-width:200px}
.dr-dismiss h3{margin:0 0 3px;font-size:16px;color:#C9A6BC}
.dr-dismiss p{margin:7px 0 0;color:#f4e3ed;line-height:1.6;max-width:74ch;text-wrap:pretty}

/* ── UNTUCKED: THE THREE PARTS OF THE NIGHT ── */
.dr-band{display:flex;align-items:baseline;gap:12px;margin:26px 0 12px;
  padding-bottom:7px;border-bottom:1px solid rgba(255,255,255,.1)}
.dr-band b{font-size:15px;letter-spacing:.13em;text-transform:uppercase;color:#ffd0e8}
.dr-band span{font-size:12px;color:#b892a8;font-style:italic}
.dr-step:first-child .dr-band{margin-top:0}
.dr-utk{padding:14px 16px 14px 20px;display:grid;grid-template-columns:auto 1fr;gap:14px}
.dr-utk .dr-utk-who{display:flex;gap:7px}
.dr-utk p{margin:5px 0 0;color:#f4e3ed;line-height:1.6;text-wrap:pretty}
/* WHAT THE SCENE DID TO THEM. Warm: they ended closer. Cold: they did not. */
.dr-panel.dr-u-warm{border-left:3px solid #FFC83D;
  background:linear-gradient(90deg,rgba(255,200,61,.11),transparent 38%),var(--dr-panel)}
.dr-panel.dr-u-cold{border-left:3px solid #FF294B;
  background:linear-gradient(90deg,rgba(255,41,75,.13),transparent 38%),var(--dr-panel)}
/* ── THE PANEL, taking its seats ── */
.dr-panelrow{display:flex;gap:12px;flex-wrap:wrap;align-items:flex-end;
  padding:16px 18px;margin-bottom:14px;
  background:linear-gradient(180deg,rgba(255,61,154,.14),rgba(10,2,7,.6));
  border:1px solid rgba(255,61,154,.4)}
.dr-seat{text-align:center;font-size:11px;letter-spacing:.1em;color:#ffd0e8}
.dr-seat b{display:block;margin-top:5px;font-size:12px;color:#fff}

/* ── THE RUNWAY ── one walk, one meter ── */
/* ── THE WALK CARD ──
   The prose used to live in the middle cell of a three-column grid, between the
   portrait and the score, which is the narrowest place on the card: a 178px
   ribbon of text inside a 358px card. The header row keeps that shape — face,
   name, bar, score — and the paragraph runs the FULL width underneath it,
   where a paragraph belongs. */
.dr-walk-line{grid-column:1/-1;margin:12px 0 0;color:#f4e3ed;font-size:15px;
  line-height:1.6;max-width:74ch;text-wrap:pretty}
.dr-walk-fit{grid-column:1/-1;margin:7px 0 0;color:#C9A6BC;font-size:13.5px;
  line-height:1.55;max-width:74ch;text-wrap:pretty}
.dr-walk{display:grid;grid-template-columns:auto 1fr auto;gap:15px;align-items:center;
  padding:14px 16px 14px 20px}
.dr-walk h3{margin:0;font-size:18px}
.dr-look{font-family:Didot,'Bodoni MT',Georgia,serif;font-style:italic;color:#ffd0e8;
  margin:4px 0 0;text-wrap:pretty}
/* ── THE CATEGORY, AS A MARQUEE ──
   It was a plain rectangle with centred text. A category announcement is the
   one piece of signage this show puts on screen every week, so it gets the
   thing signage has: a lit border, bulbs, and a name big enough to read from
   the back. */
.dr-marquee{position:relative;text-align:center;padding:26px 24px 28px;
  border:1px solid rgba(255,200,61,.42);border-radius:2px;
  background:radial-gradient(120% 140% at 50% 0%,rgba(255,200,61,.13),transparent 62%),
    linear-gradient(180deg,#2A1020,#180A14);
  box-shadow:inset 0 1px 0 rgba(255,214,240,.18),0 22px 50px -18px rgba(0,0,0,.85)}
.dr-marquee::before,.dr-marquee::after{content:"";position:absolute;left:14px;right:14px;
  height:7px;background:radial-gradient(circle at 50% 50%,#FFE9A8 0 2.1px,rgba(255,200,61,.28) 2.6px,transparent 3px) 0 0/17px 7px repeat-x}
.dr-marquee::before{top:7px}
.dr-marquee::after{bottom:7px}
.dr-marquee .dr-cat-k{font-size:9.5px;letter-spacing:.34em;color:#FFC83D}
.dr-marquee .dr-cat-v{font-size:34px;line-height:1.1;margin-top:8px;
  text-shadow:0 0 26px rgba(255,123,200,.45);text-wrap:balance}

/* The runway strip the cards stand on. */
.dr-floor{height:3px;margin:16px 0 4px;border-radius:2px;
  background:linear-gradient(90deg,transparent,rgba(255,200,61,.55),transparent)}

.dr-bar{height:10px;background:rgba(255,255,255,.12);margin-top:9px;overflow:hidden}
.dr-bar i{display:block;height:100%;background:linear-gradient(90deg,#00E5FF,#FF3D9A);
  box-shadow:0 0 14px rgba(255,61,154,.7)}
.dr-runscore{font-size:23px;font-variant-numeric:tabular-nums;padding:9px 14px;
  border-radius:3px;background:linear-gradient(180deg,#31142A,#1C0A18);
  box-shadow:inset 0 1px 0 rgba(255,214,240,.2),0 8px 18px -6px rgba(0,0,0,.8);
  border:1px solid currentColor;color:#FF7BC8}

/* ── THE PANEL'S TASTES, AND TONIGHT'S BILL ── */
.dr-seat .dr-taste{display:block;max-width:150px;margin-top:4px;font-size:10px;
  line-height:1.35;color:#C9A6BC;text-wrap:pretty}
.dr-seat .dr-taste::before{display:inline-block;width:12px;font-weight:700}
.dr-t-yes::before{content:"+";color:#3BE08A}
.dr-t-no::before{content:"−";color:#FF294B}
.dr-t-guest{color:#FFC83D!important;letter-spacing:.14em;text-transform:uppercase}
.dr-callout{display:flex;align-items:baseline;gap:14px;flex-wrap:wrap;
  margin:0 0 14px;padding:16px 20px;border-left:4px solid #FFC83D;
  background:linear-gradient(90deg,rgba(255,200,61,.14),transparent 60%),rgba(0,0,0,.3)}
.dr-callout-k{font-size:10px;letter-spacing:.24em;text-transform:uppercase;color:#C9A6BC}
.dr-callout b{font-size:26px;color:#FFC83D;line-height:1.05;text-wrap:balance}
.dr-lineup{margin:0 0 16px;padding:13px 18px;border:1px solid var(--dr-line);
  background:rgba(0,0,0,.22)}
.dr-lineup-k{display:block;margin-bottom:9px;font-size:10px;letter-spacing:.2em;
  text-transform:uppercase;color:#b892a8}
.dr-lineup-row{display:flex;gap:14px;flex-wrap:wrap}
.dr-lineup-q{display:flex;flex-direction:column;align-items:center;gap:4px;width:56px}
.dr-lineup-q i{font-size:9.5px;font-style:normal;color:#e3cfdd;text-align:center;
  line-height:1.2}
.dr-lineup-q .dr-por{border:1px solid rgba(255,255,255,.2)}

/* ── VISUAL-NOVEL CRITIQUE ── the bust breaks OUT of the box ── */
.dr-vn{position:relative;margin:26px 0 14px;padding:15px 17px 15px 118px;min-height:104px}
.dr-vn .dr-bust{position:absolute;left:-14px;bottom:0}
.dr-vn .dr-por{border:2px solid rgba(255,255,255,.35)}
/* THE LOWER-THIRD, IN THE FLOW. Both of these were absolutely positioned:
   the name plate at left:-14px, which the card clipped so the judge's name
   read "MICHELLE V", and the tone tag at right:12px, which sat on top of the
   first line of the quote. They are one header row now — nothing overlaps
   text and nothing hangs off an edge. */
.dr-vn-head{display:flex;align-items:center;justify-content:space-between;gap:12px;
  margin:-4px 0 9px}
.dr-plate{padding:4px 13px;font-size:12px;letter-spacing:.14em;color:#1a0a02;
  background:var(--dr-tone,#FFC83D);
  clip-path:polygon(0 0,100% 0,calc(100% - 9px) 100%,0 100%);padding-right:20px}
/* THE QUOTE IS SPEECH AND IS SET AS SPEECH. It carried .dr-disp, which is
   the condensed uppercase display face — fine on a three-word title, close
   to unreadable on a forty-word critique, which is what a judge actually
   says. And <q> supplies its own quotation marks, so a line that already
   opened with one printed two. */
.dr-vn q{display:block;font-family:Didot,'Bodoni MT',Georgia,serif;font-size:18px;
  line-height:1.45;margin-bottom:7px;color:#fff6fb;text-wrap:pretty;quotes:none}
.dr-vn q::before,.dr-vn q::after{content:none}
/* ── THE JUDGES WHO DID NOT SPEAK ── */
.dr-quiet-panel{display:flex;align-items:center;gap:10px;flex-wrap:wrap;
  margin:10px 0 4px;padding:9px 14px;border:1px dashed rgba(255,255,255,.14);
  background:rgba(0,0,0,.22)}
.dr-quiet-k{font-size:9px;letter-spacing:.18em;text-transform:uppercase;color:#b892a8}
.dr-quiet-j{display:inline-flex;align-items:center;gap:7px;padding:3px 9px 3px 3px;
  border-left:3px solid var(--dr-tone,#FFC83D);background:rgba(255,255,255,.04)}
.dr-quiet-j b{font-size:12px;font-weight:600;color:#f0dfe9}
.dr-quiet-j i{font-size:9px;letter-spacing:.14em;text-transform:uppercase;
  color:var(--dr-tone,#FFC83D);font-style:normal}
.dr-quiet-j .dr-por{border:1px solid rgba(255,255,255,.25)}
.dr-vn p{margin:0;color:#f0dfe9;font-size:14px;text-wrap:pretty}
.dr-vn::before{background:var(--dr-tone,#FFC83D);box-shadow:0 0 14px var(--dr-tone,#FFC83D)}
.dr-tone-praise{--dr-tone:#3BE08A}
.dr-tone-mixed{--dr-tone:#FFC83D}
.dr-tone-pan{--dr-tone:#FF294B}
.dr-tonetag{flex:none;font-size:9px;letter-spacing:.16em;
  padding:3px 8px;border:1px solid var(--dr-tone,#FFC83D);color:var(--dr-tone,#FFC83D)}
.dr-reasons{margin-top:8px;font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:#C9A6BC}
.dr-split{display:inline-block;margin-left:8px;font-size:9px;letter-spacing:.14em;
  padding:2px 8px;border:1px solid #FF7BC8;color:#FF7BC8}

/* Her reaction, under the panel's words. */
.dr-react{margin-top:12px;padding:10px 14px;border-left:3px solid #7B2FF7;
  background:rgba(123,47,247,.10);font-size:13.5px;color:#e5d5f2}

/* ── UNTUCKED ── a room, not a stage. It can also shake. ── */
.dr-shake{animation:drShake .5s ease}
@keyframes drShake{10%,90%{transform:translateX(-4px)}30%,70%{transform:translateX(6px)}
  50%{transform:translateX(-6px)}}
.dr-act{margin:20px 0 10px;font-size:11px;letter-spacing:.24em;text-transform:uppercase;
  color:#C9A6BC;border-bottom:1px solid rgba(255,255,255,.14);padding-bottom:6px}
@media(prefers-reduced-motion:reduce){.dr-shake{animation:none}}
`;

/** The panel takes its seats — the host in drag, because this is the stage. */
export function rpBuildMainStage(row) {
  const ep = epOf(row);
  const ids = row?.dr?.judges || [];
  if (!ids.length) return '';
  const guest = row?.dr?.guest;
  const scenes = (row.dr.scenes || []).filter(s => s.step === 'main-stage' && s.text);

  /* WHAT EACH JUDGE IS LOOKING FOR, before she looks at anybody. The seats
     were three portraits and three names on a screen that then had one line
     of prose and half a page of nothing under it. `petPeeve` and `softSpot`
     are authored on every judge and were being read by no screen at all —
     and they are the most useful thing on this night, because they are what
     the critiques twenty minutes later are going to turn on. */
  const seatOf = id => {
    const j = JUDGES.find(x => x.id === id) || {};
    return `<span class="dr-seat">
      ${_judgePortrait(id, { stage: true, size: 62 })}<b>${esc(judgeName(id))}</b>
      ${j.softSpot ? `<span class="dr-taste dr-t-yes">${esc(j.softSpot)}</span>` : ''}
      ${j.petPeeve ? `<span class="dr-taste dr-t-no">${esc(j.petPeeve)}</span>` : ''}
    </span>`;
  };
  const seats = `<div class="dr-panelrow">${ids.map(seatOf).join('')}
    ${guest ? `<span class="dr-seat">${_portrait(guest.name || guest, ep, { size: 62 })}
      <b>${esc(guest.name || guest)}</b>${guest.credit
    ? `<div style="font-size:9px;opacity:.7">${esc(guest.credit)}</div>` : ''}
      <span class="dr-taste dr-t-guest">guest judge</span></span>` : ''}
  </div>`;

  /* THE CATEGORY, AND WHO IS ABOUT TO WALK IN IT. Both were already on the
     row and neither was drawn here — the reader met the category for the
     first time on the runway screen, after it had already been walked. */
  const cat = row?.dr?.runway?.category;
  const living = row?.dr?.living || [];
  const bill = `${cat ? `<div class="dr-callout">
      <span class="dr-callout-k dr-disp">The category is</span>
      <b class="dr-disp">${esc(cat)}</b></div>` : ''}
    ${living.length ? `<div class="dr-lineup">
      <span class="dr-lineup-k dr-disp">Walking tonight</span>
      <div class="dr-lineup-row">${living.map(n => `<span class="dr-lineup-q">
        ${_portrait(n, ep, { size: 40 })}<i>${esc(n)}</i></span>`).join('')}</div>
    </div>` : ''}`;

  const steps = scenes.map((sc, i) => `<div class="dr-step" id="dr-step-mainstage-${i}">
    <div class="dr-panel dr-a-score" style="padding:14px 16px 14px 20px">
      <p style="margin:0;color:#f4e3ed;line-height:1.6;text-wrap:pretty">${esc(sc.text)}</p>
    </div></div>`).join('');

  /* THE MAIN STAGE ITSELF. The one screen that is named after the room it
     happens in was the only one on this night not drawing it: a proscenium
     arch, the panel's table below it, and the top of the runway. */
  const hall = `<div class="dr-mainhall" aria-hidden="true">
      <i class="dr-mh-arch"></i><i class="dr-mh-wash"></i><i class="dr-mh-lip"></i>
    </div>`;
  return `<style>${STAGE_CSS}</style>${_shell(
    `<div class="dr-mainroom">${hall}${seats}${bill}${steps}</div>`, ep, {
      phase: 'stage', title: 'The Main Stage', subtitle: 'the panel takes its seats',
    })}${_controls('mainstage', Math.max(1, scenes.length), ep.num)}`;
}

/** The runway: the category, then one walk at a time. */
export function rpBuildRunway(row) {
  const ep = epOf(row);
  const rw = row?.dr?.runway;
  if (!rw?.category) return '';
  const order = (row.dr.assignment?.order || []).filter(n => rw[n]);
  const walkers = order.length ? order : Object.keys(rw).filter(k => rw[k]?.score !== undefined);
  if (!walkers.length) return '';

  /* ── THE CATWALK ITSELF ──
     The runway is the one thing a viewer sees every single episode and it
     was a marquee over a column of cards on the same purple gradient as the
     werk room. It has a shape — a lit walkway running away from you between
     two banks of photographers — and that shape is drawable: a perspective
     floor behind the cards, edge lights down both sides, and the queens
     walking down it one at a time.
     Anchored to the content column, not the window, so the walkway is the
     screen rather than the browser. */
  const cat = `<div class="dr-catwalk" aria-hidden="true">
      <i class="dr-cw-floor"></i>
      <i class="dr-cw-edge dr-l"></i><i class="dr-cw-edge dr-r"></i>
      <i class="dr-cw-back"></i>
    </div>`;
  const lead = `${cat}<div class="dr-marquee">
      <div class="dr-cat-k dr-disp">Tonight&rsquo;s category is</div>
      <div class="dr-cat-v dr-fash">${esc(rw.category)}</div>
    </div><div class="dr-floor"></div>`;

  /* THE WALK ITSELF, WHICH THIS SCREEN WAS THROWING AWAY.
     Every queen has a written walk on the row — `stage:walk`, and often a
     `stage:walk-fit` line about whether the look answered the category — and
     this drew a portrait, a bar and a number and none of the words. Nine
     descriptions on the row, a hundred and ten characters on the screen. The
     runway is the one thing a viewer sees every single episode and it was the
     emptiest thing in the reader. */
  const lineFor = (kind, name) => (row.dr.scenes || []).find(sc =>
    sc.kind === kind && (sc.data?.players || [])[0] === name)?.text || '';

  const steps = walkers.map((name, i) => {
    const w = rw[name] || {};
    const score = Number(w.score) || 0;
    const walk = lineFor('stage:walk', name);
    const fit = lineFor('stage:walk-fit', name);
    /* THE PIT GOES OFF FOR A LOOK THAT DESERVES IT. Not decoration: the
       flashes fire on the scores the panel is about to call high, so the
       screen reacts to the look before anybody says a word about it, which
       is what the room does. */
    const big = score >= 8;
    return `<div class="dr-step" id="dr-step-runway-${i}">
      <div class="dr-panel dr-a-score dr-walk${big ? ' dr-flashy' : ''}">
        ${big ? '<span class="dr-pit"><i></i><i></i><i></i><i></i></span>' : ''}
        ${_portrait(name, ep, { size: 58, station: true })}
        <div><h3 class="dr-disp">${esc(name)}</h3>
          ${(w.walks || []).length > 1
    ? `<p class="dr-look">${w.walks.length} looks tonight</p>` : ''}
          <div class="dr-bar"><i style="width:${Math.max(4, Math.min(100, score * 10))}%"></i></div>
        </div>
        <span class="dr-runscore dr-disp">${n1(score)}</span>
        ${walk ? `<p class="dr-walk-line">${esc(walk)}</p>` : ''}
        ${fit ? `<p class="dr-walk-fit">${esc(fit)}</p>` : ''}
      </div></div>`;
  }).join('');

  /* THE LEADERBOARD, GATED. Only the queens who have already walked — a
     board carrying a score the viewer has not been shown is the spoiler. */
  if (typeof window !== 'undefined') {
    window._drSidebar = window._drSidebar || {};
    window._drSidebar.runway = walkers.map((_, i) => `<h4 class="dr-disp">The runway</h4>${
      walkers.slice(0, i + 1)
        .map(n => ({ n, s: Number(rw[n]?.score) || 0 }))
        .sort((a, b) => b.s - a.s)
        .map(({ n, s }) => `<div class="dr-slot">${_portrait(n, ep, { size: 32 })}
          <div><div class="dr-nm">${esc(n)}</div></div>
          <span class="dr-chip ${s >= 8 ? 'dr-c-win' : s >= 6 ? 'dr-c-high' : 'dr-c-safe'}">${n1(s)}</span>
        </div>`).join('')}`);
  }

  return `<style>${STAGE_CSS}</style>${_shell(lead + steps, ep, {
    phase: 'stage', title: 'The Runway', subtitle: esc(rw.category),
    sidebar: _seedRail('runway', '<h4 class="dr-disp">The runway</h4>'),
  })}${_controls('runway', walkers.length, ep.num)}`;
}

/**
 * The critiques — one queen at a time, every judge who spoke about her.
 *
 * THE FINAL RANK IS NOT ON THIS SCREEN. The panel ranks and then the host
 * decides; those are two moments, and at this one the host has not decided.
 * The rail carries the PANEL's running ranking only.
 */
export function rpBuildCritiques(row) {
  const ep = epOf(row);
  const lines = row?.dr?.critiques || [];
  if (!lines.length) return '';
  const reactions = row?.dr?.reactions || {};
  const split = row?.dr?.panel?.split;
  const ids = row?.dr?.judges || [];

  /* THE WORDS ARE ON THE SCENES, NOT ON `dr.critiques`.
     `critiques` carries the judgement — judge, tone, reasons, rank, gap —
     and the LINE she actually said is a `stage:critique` scene. Reading only
     the first gave a screen of "RuPaul praise challenge · risk" with no
     critique on it: every judge accounted for and not one of them speaking.
     Matched on queen and judge, which both records carry. */
  /* HOW SHE TOOK IT, IN WORDS. `stage:critique-reaction` has authored prose
     per tier and this card printed only the tier NAME — "She takes it:
     gracious." — so a written paragraph per critiqued queen fired every week
     and was drawn nowhere. The label stays because it is a useful summary;
     the paragraph goes under it. */
  const reactionSaid = new Map();
  for (const sc of row.dr.scenes || []) {
    if (sc.kind !== 'stage:critique-reaction' || !sc.text) continue;
    reactionSaid.set((sc.data?.players || [])[0], sc.text);
  }

  const said = new Map();
  for (const sc of row.dr.scenes || []) {
    if (sc.kind !== 'stage:critique' || !sc.text) continue;
    const q = (sc.data?.players || [])[0];
    said.set(`${q}|${sc.data?.judge}`, sc);
  }

  const byQueen = new Map();
  for (const c of lines) {
    if (!byQueen.has(c.queen)) byQueen.set(c.queen, []);
    const spoken = said.get(`${c.queen}|${c.judgeName || judgeName(c.judge)}`);
    byQueen.get(c.queen).push({ ...c, text: c.text || spoken?.text || '', note: spoken ? _note(spoken) : '' });
  }
  const queens = [...byQueen.keys()];

  /* ── THE DISMISSAL, WHICH IS WHERE THIS SCREEN STARTS ──
     The host names the safe queens and they leave the main stage and go
     straight to Untucked; the panel then critiques only the queens still
     standing. That is why this screen has never shown the whole cast, and
     until now it never said so — a reader saw six queens critiqued out of
     nine living and was told nothing about the other three.
     They share one spoken line between them, so they share one card. */
  const safe = row?.dr?.call?.safe || [];
  const safeLine = (row.dr.scenes || []).find(x => x.kind === 'stage:result-safe')?.text || '';
  const bendOf = new Map((row.dr.bend || []).map(b => [b.name, b]));
  const safeCard = safe.length ? `<div class="dr-step" id="dr-step-critiques-0">
    <div class="dr-panel dr-a-room dr-dismiss">
      <span class="dr-dismiss-faces">${safe.map(n =>
    _portrait(n, ep, { size: 42, station: true })).join('')}</span>
      <div><h3 class="dr-disp">Safe — you may leave the stage</h3>
        <span class="dr-sub">${esc(safe.join(', '))}</span>
        ${safeLine ? `<p>${esc(safeLine)}</p>` : ''}
        ${safe.filter(n => bendOf.get(n)
    && bendOf.get(n).panelRank !== bendOf.get(n).finalRank)
    .map(n => `<span class="dr-moved dr-disp">the host moved her: ${esc(n)}</span>`)
    .join(' ')}</div>
    </div></div>` : '';
  const dOff = safe.length ? 1 : 0;

  /* ── THE PANEL, SEATED ──
     The critiques are the one screen in the show where three people sit in
     a row and take turns, and it drew them as a stack of quote cards — the
     panel was never actually ON the screen, only its opinions were. This is
     the bench: it stays at the top while the critiques scroll under it, and
     the judge currently speaking is the one in the light.
     It is also where the reader learns the panel is not one voice. Each
     judge carries her taste, so a queen praised by the judge who wants risk
     and panned by the judge who wants polish is legible as a disagreement
     rather than as noise. */
  const bench = ids.length ? `<div class="dr-bench" id="dr-bench">
    ${ids.map(id => {
    const j = JUDGES.find(x => x.id === id) || {};
    return `<div class="dr-seat-j" id="dr-seat-${esc(id)}" data-judge="${esc(id)}">
        ${_judgePortrait(id, { stage: true, size: 54 })}
        <b class="dr-disp">${esc(judgeName(id))}</b>
        ${j.softSpot ? `<i>${esc(j.softSpot)}</i>` : ''}
      </div>`;
  }).join('')}
    <div class="dr-bench-desk"></div>
  </div>` : '';

  const steps = safeCard + queens.map((name, i) => {
    const hers = byQueen.get(name);
    const tones = new Set(hers.map(c => c.tone));
    const disagreed = tones.size > 1;
    /* A JUDGE WHO DID NOT SPEAK DOES NOT GET A QUOTE BOX. The panel forms an
       opinion of every queen — three judges, six queens, eighteen rows on
       `dr.critiques` — but only two of them are given a line about each, so
       ten of those eighteen were drawn as an empty pair of quote marks with
       a portrait beside it. Forty-four per cent of this screen was blank
       boxes.
       The silent judge's opinion is still real and still counts, so it is
       not thrown away: she goes in a tone strip under the spoken critiques,
       which says what she thought without pretending she said it. */
    const spokeUp = hers.filter(c => (c.text || c.line || '').trim());
    const quiet = hers.filter(c => !(c.text || c.line || '').trim());
    const cards = spokeUp.map(c => `<div class="dr-panel dr-vn dr-tone-${esc(c.tone)}">
        <div class="dr-vn-head">
          <span class="dr-plate dr-disp">${esc(c.judgeName || judgeName(c.judge))}</span>
          <span class="dr-tonetag dr-disp">${esc(c.tone)}</span>
        </div>
        ${_judgePortrait(c.judge, { stage: true, size: 118 })}
        <q>${esc(c.text || c.line || '')}</q>
        ${c.note ? `<p>${esc(c.note)}</p>` : ''}
        ${(c.reasons || []).length
    ? `<div class="dr-reasons">${c.reasons.map(esc).join(' · ')}</div>` : ''}
      </div>`).join('')
      + (quiet.length ? `<div class="dr-quiet-panel">
        <span class="dr-quiet-k dr-disp">Also on the panel</span>
        ${quiet.map(c => `<span class="dr-quiet-j dr-tone-${esc(c.tone)}">
          ${_judgePortrait(c.judge, { size: 30 })}
          <b>${esc(c.judgeName || judgeName(c.judge))}</b>
          <i class="dr-disp">${esc(c.tone)}</i></span>`).join('')}
      </div>` : '');
    const spokeIds = spokeUp.map(c => c.judge).filter(Boolean).join(',');
    return `<div class="dr-step" id="dr-step-critiques-${i + dOff}"
      data-judges="${esc(spokeIds)}">
      <div class="dr-panel dr-a-score" style="padding:14px 16px 14px 20px">
        ${_portrait(name, ep, { size: 54, station: true })}
        <b class="dr-disp" style="font-size:19px;margin-left:10px">${esc(name)}</b>
        ${disagreed ? '<span class="dr-split dr-disp">the panel is split</span>' : ''}
      </div>
      ${cards}
      ${reactions[name]
    ? `<div class="dr-react">She takes it: <b>${esc(reactions[name])}</b>.
        ${reactionSaid.get(name)
      ? `<p style="margin:6px 0 0;color:#f4e3ed;line-height:1.6">${esc(reactionSaid.get(name))}</p>`
      : ''}</div>` : ''}
    </div>`;
  }).join('');

  /* ── THE DELIBERATION, WHICH NO SCREEN HAS EVER DRAWN ──
     `stage:deliberation` has had written prose in stage-beats.js the whole
     time and there is not one reference to it anywhere in js/vp-dr — this
     screen builds its cards from `byQueen` and stops. So the beat existed,
     fired every week, and was shown to nobody.
     It belongs here and at the end: the safe queens were dismissed at the top
     of this screen, the rest are critiqued through the middle of it, and then
     they all go to Untucked and the panel says what it actually thinks with
     the stage empty. The arguments name the judge on each side and the queen
     they are fighting over; the host's call is last, because she is. */
  const delib = (row.dr.scenes || []).filter(sc =>
    /^stage:deliberation/.test(sc.kind || '') && sc.text);
  const delibCards = delib.map((sc, i) => {
    const isHost = sc.kind === 'stage:deliberation-host';
    const arg = sc.kind === 'stage:deliberation-argument';
    const who = (sc.data?.players || [])[0];
    const jid = (row?.dr?.judges || []).find(id => judgeName(id) === sc.data?.judge);
    return `<div class="dr-step" id="dr-step-critiques-${queens.length + dOff + i}">
      <div class="dr-panel ${isHost ? 'dr-a-score' : 'dr-a-room'} dr-delib">
        ${isHost ? _judgePortrait('rupaul', { stage: true, size: 44 })
    : jid ? _judgePortrait(jid, { size: 44 }) : ''}
        <div>
          <span class="dr-sub">${isHost ? 'the host decides'
    : arg ? `${esc(sc.data?.judge || '')} · ${esc(sc.data?.taste || '')}`
      : 'the panel deliberates'}</span>
          <p>${esc(sc.text)}</p>
          ${who && arg ? `<span class="dr-delib-q">${_portrait(who, ep, { size: 26 })}
            <i>${esc(who)}</i>${sc.data?.spread
    ? `<b>${sc.data.spread} ranks apart</b>` : ''}</span>` : ''}
          ${isHost && sc.data?.panelRank && sc.data?.finalRank
    ? `<span class="dr-delib-q"><b>panel ${sc.data.panelRank} → ${sc.data.finalRank}</b></span>` : ''}
        </div>
      </div></div>`;
  }).join('');

  /* THE PANEL'S RUNNING RANKING — the screen's whole point. Gated to the
     queens critiqued so far, and it is the PANEL's order, never the host's. */
  if (typeof window !== 'undefined') {
    window._drSidebar = window._drSidebar || {};
    const rankOf = n => (byQueen.get(n) || []).reduce((m, c) => Math.min(m, c.rank ?? 99), 99);
    window._drSidebar.critiques = queens.map((_, i) => `<h4 class="dr-disp">The panel, so far</h4>${
      queens.slice(0, i + 1).sort((a, b) => rankOf(a) - rankOf(b))
        .map(n => `<div class="dr-slot">${_portrait(n, ep, { size: 32 })}
          <div><div class="dr-nm">${esc(n)}</div></div>
          <span class="dr-chip dr-c-safe">${rankOf(n) === 99 ? '—' : rankOf(n)}</span></div>`).join('')}
      <p style="margin:10px 0 0;font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:#C9A6BC">
        The panel's order. The host has not decided yet.</p>`);
  }

  /* WHO IS TALKING, LIVE. Each step carries the judges who speak on it, and
     the reveal hook lights those seats and dims the rest — so the bench is
     doing what a bench does rather than being a decorative header. */
  if (typeof window !== 'undefined') {
    window._drRevealExtra = window._drRevealExtra || {};
    window._drRevealExtra.critiques = (idx) => {
      const step = document.getElementById(`dr-step-critiques-${idx}`);
      const who = (step?.getAttribute('data-judges') || '').split(',').filter(Boolean);
      for (const seat of document.querySelectorAll('.dr-seat-j')) {
        seat.classList.toggle('on', who.includes(seat.getAttribute('data-judge')));
      }
    };
  }

  return `<style>${STAGE_CSS}</style>${_shell(bench + steps + delibCards, ep, {
    phase: 'stage', title: 'The Critiques',
    subtitle: split ? 'the panel is split tonight' : 'the panel speaks',
    sidebar: _seedRail('critiques', '<h4 class="dr-disp">The panel, so far</h4>'),
  })}${_controls('critiques', queens.length + dOff + delib.length, ep.num)}`;
}

/** Untucked: a room, not a stage — and it can get loud. */
export function rpBuildUntucked(row) {
  const ep = epOf(row);
  const scenes = (row.dr.scenes || []).filter(s => s.step === 'untucked' && s.text);
  if (!scenes.length) return '';
  /* THE ROOM HAS AN ARC AND THE SCREEN NOW SHOWS IT. Untucked runs
     arrival → middle → late — off the stage still in the look, the long
     wait where the fights happen, then being called back — and every event
     carries which one it is. Nine identical lozenges threw that away; the
     column now breaks into the three parts of the night.
     And each card takes its colour from what the scene DID: the bond
     delta is already on the scene, so a moment that pulled two queens
     together and one that pushed them apart no longer look the same. */
  const BAND = {
    arrival: ['Off the stage', 'still in the look, still shaking'],
    middle: ['The long wait', 'nobody knows the verdict yet'],
    late: ['Called back', 'the door opens again'],
  };
  let band = null;
  const steps = scenes.map((sc, i) => {
    const players = sc.data?.players || [];
    // The fight escalating: the shell shakes on the beat that escalates it.
    const loud = /blow-up|walks-out|say-it-to-my-face|told-to-stop/.test(sc.kind || '');
    const d = Number(sc.effects?.bond) || 0;
    const heat = d > 0.15 ? ' dr-u-warm' : d < -0.15 ? ' dr-u-cold' : '';
    const ph = sc.data?.phase;
    let head = '';
    if (ph && ph !== band && BAND[ph]) {
      band = ph;
      head = `<div class="dr-band"><b class="dr-disp">${esc(BAND[ph][0])}</b>
        <span>${esc(BAND[ph][1])}</span></div>`;
    }
    /* THE HEADER LIVES INSIDE THE STEP, so it arrives with the first card of
       its band rather than sitting there before anything is revealed
       announcing that a third act exists. */
    return `<div class="dr-step" id="dr-step-untucked-${i}">${head}
      <div class="dr-panel ${players.length > 1 ? 'dr-a-bond' : 'dr-a-room'}${loud ? ' dr-shake' : ''}${heat} dr-utk">
        <span class="dr-utk-who">${players.slice(0, 2)
    .map(n => _portrait(n, ep, { size: 46 })).join('')}</span>
        <div>${players.length ? `<b class="dr-disp">${esc(players.join(' & '))}</b>` : ''}
          <p>${esc(sc.text)}</p></div>
      </div></div>`;
  }).join('');
  /* ── THE LOUNGE ──
     Untucked is a room, and a specific one: low light, a long couch, a bar
     nobody is really drinking at, and a sign on the wall. It was drawn on
     the same gradient as every other screen, so the one part of the night
     that is explicitly somewhere else looked like the rest of it. */
  const lounge = `<div class="dr-lounge" aria-hidden="true">
      <i class="dr-lo-sign"></i><i class="dr-lo-couch"></i><i class="dr-lo-bar"></i>
    </div>`;

  /* THE ROOM'S TEMPERATURE, which the scenes are already deciding. Every
     Untucked beat carries a bond delta and the screen was spending it on a
     border colour; summed as the night goes on it is the one number that
     says whether this room is coming together or coming apart, and that is
     what Untucked is FOR. Gated per step, so it never runs ahead. */
  if (typeof window !== 'undefined') {
    window._drSidebar = window._drSidebar || {};
    let heat = 0;
    window._drSidebar.untucked = scenes.map(sc => {
      heat += Number(sc.effects?.bond) || 0;
      const pct = Math.max(0, Math.min(100, 50 + heat * 12));
      const word = heat > 1.2 ? 'coming together'
        : heat < -1.2 ? 'coming apart' : 'holding';
      return `<h4 class="dr-disp">The room</h4>
        <div class="dr-temp"><i style="left:${pct}%"></i></div>
        <div class="dr-temp-k"><span>apart</span><span>together</span></div>
        <p class="dr-temp-v dr-disp">${esc(word)}</p>`;
    });
  }

  return `<style>${STAGE_CSS}${ROOM_RAIL_CSS}</style>${_shell(lounge + steps, ep, {
    phase: 'untucked', title: 'Untucked', subtitle: 'Illusions Lounge',
    /* THE TEMPERATURE GAUGE WAS A PICTURE OF NOTHING — a needle pinned at
       fifty per cent with the word "holding" under it, on every episode of
       every season, because no relationship state had ever reached a screen.
       The rail under it is the real thing: who is close, who is at war, and
       which of them are family. */
    sidebar: `<h4 class="dr-disp">The room</h4>
      <div class="dr-temp"><i style="left:50%"></i></div>
      <div class="dr-temp-k"><span>apart</span><span>together</span></div>
      <p class="dr-temp-v dr-disp">holding</p>${_roomRail(row)}`,
  })}${_controls('untucked', scenes.length, ep.num)}`;
}
