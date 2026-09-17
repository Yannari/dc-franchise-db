// ══════════════════════════════════════════════════════════════════════
// vp-dr/crowning.js — the crowning, staged
// ══════════════════════════════════════════════════════════════════════
//
// The last screen of a season was a stack of cards: a bracket, a list of
// placements, a portrait with the word WINNER over it. Everything it needed
// to say was on it and none of it felt like anything, because a ceremony is
// not a summary of a ceremony — it is a room, a line of people who have to
// stand in it, and a result that takes a long time to arrive.
//
// ── WHAT THIS DRAWS ───────────────────────────────────────────────────
//
// A STAGE, and it is sticky: the line of finalists stays at the top of the
// screen while the ceremony scrolls underneath, so the reader is looking at
// the room the whole time rather than at a card that has scrolled away.
//
// Each finalist stands on a lit PLINTH — her portrait under a lamp, her name
// in the display face, her season's record in the track record's own colours
// beneath it. The portraits are the point: this is the one night the whole
// cast is in one room and you want to see who is in it.
//
// As the ceremony reveals, the plinths go dark from the bottom up. The queen
// called fourth loses her light, greys out and takes her placement; then
// third; and the stage narrows to two, and then to one, and the last one
// gets the crown, the gold, and the confetti. THE STAGE IS THE PROGRESS BAR
// — you can see how far into the ceremony you are by how many lamps are
// still lit.
//
// ── HOW THE STAGE KNOWS ───────────────────────────────────────────────
//
// Through the reveal hook in js/vp-dr/reveal.js: every step carries the
// state of the room AFTER it, as a data attribute, and the hook reads the
// current step's attribute and repaints the plinths from it. Nothing is
// rebuilt — the same rule as every other screen here, because a rebuild
// loses the reader's place and any scroll they had. It repaints the whole
// line every time rather than patching the newest plinth, which is what
// makes it survive a tab switch.
//
// ── WHAT IT MAY NOT DO ────────────────────────────────────────────────
//
// SHOW THE RESULT BEFORE IT IS REVEALED. The version this replaces printed
// every duel, the whole finishing order, the crown and Miss Congeniality at
// 0 / 5 — on the one screen in the season whose entire job is withholding
// exactly those four things. tests/dr-vp-spoilers.test.js reads this screen
// the way a viewer opens it and fails if any of that is legible at rest.
// The line of plinths is drawn in ALPHABETICAL order for the same reason:
// placement order would print the result along the top of the screen in the
// arrangement of the plinths themselves.
import { _shell, _portrait, _icon, _judgePortrait } from './style.js';
import { _controls, _state } from './reveal.js';

const esc = v => String(v ?? '').replace(/[&<>"]/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* The record letters, in the chart's own colours, so a résumé on this stage
   and the same résumé on the track record are recognisably one object. */
const REC = {
  WIN: '#38bdf8', HIGH: '#7dd3fc', SAFE: '#4b5563', LOW: '#fb923c',
  BTM: '#fca5a5', BTM2: '#f87171', ELIM: '#7f1d1d',
  WINNER: '#facc15', FINALIST: '#c4b5fd',
};

export const CROWN_CSS = `
.cr-wrap{--cr-gold:#FFC83D;--cr-warm:#FFE9A8;--cr-deep:#12030A;--cr-dark:#1D0710}

/* ══ THE HOUSE ══ a lit proscenium behind everything, fixed to the page ══ */
.cr-house{position:fixed;inset:46px 0 0;z-index:0;pointer-events:none;overflow:hidden}
.cr-house::before{content:"";position:absolute;inset:0;
  background:radial-gradient(120% 80% at 50% 0%,rgba(255,200,61,.13),transparent 62%),
    radial-gradient(90% 60% at 50% 110%,rgba(255,61,154,.10),transparent 70%)}
/* The back wall: a slow sweep, like a follow-spot crossing it. */
.cr-sweep{position:absolute;top:-20%;left:-30%;width:60%;height:140%;
  background:linear-gradient(100deg,transparent,rgba(255,233,168,.09),transparent);
  animation:crSweep 17s ease-in-out infinite}
@keyframes crSweep{0%{transform:translateX(0) rotate(6deg)}
  50%{transform:translateX(180%) rotate(6deg)}100%{transform:translateX(0) rotate(6deg)}}

/* ══ THE STAGE ══ sticky, because the room does not scroll away ══ */
/* THE HEADROOM IS FOR THE CROWN. It sits at top:-34px on the winner's
   plinth and the plinth's top is the stage's padding edge, so with the
   16px this had the crown was sliced off along its band — the one object
   the entire screen builds towards, clipped by its own container. */
.cr-stage{position:sticky;top:0;z-index:6;margin:0 0 20px;padding:16px 18px 18px;
  background:radial-gradient(130% 100% at 50% -20%,rgba(255,200,61,.17),transparent 60%),
    linear-gradient(180deg,var(--cr-dark),var(--cr-deep) 72%,rgba(8,2,5,.97));
  border-bottom:1px solid rgba(255,200,61,.3);
  box-shadow:0 20px 44px -24px rgba(0,0,0,.96)}
/* The lighting rig over the line. */
.cr-truss{position:relative;display:flex;justify-content:center;gap:14px;
  padding-bottom:12px;margin-bottom:26px}
.cr-truss::before{content:"";position:absolute;left:8%;right:8%;top:0;height:3px;
  background:linear-gradient(90deg,transparent,rgba(255,255,255,.22),transparent)}
.cr-lamp{width:22px;height:6px;border-radius:0 0 3px 3px;background:rgba(255,200,61,.2);
  transition:background .4s,box-shadow .4s}
.cr-lamp.lit{background:var(--cr-warm);box-shadow:0 8px 30px rgba(255,200,61,.8)}

.cr-line{display:flex;justify-content:center;align-items:flex-end;gap:16px;flex-wrap:wrap}

/* ══ ONE FINALIST, ON A PLINTH ══ */
.cr-plate{position:relative;width:150px;padding:14px 12px 12px;text-align:center;
  border:1px solid rgba(255,255,255,.15);border-radius:2px;
  background:linear-gradient(180deg,rgba(255,255,255,.08),rgba(0,0,0,.45));
  transition:opacity .5s,filter .5s,transform .5s cubic-bezier(.2,1.1,.4,1),
    border-color .5s,box-shadow .5s}
/* Her beam, drawn behind her and dimmed with her. */
.cr-plate::before{content:"";position:absolute;left:50%;bottom:100%;
  width:130px;height:190px;transform:translateX(-50%);pointer-events:none;
  background:linear-gradient(180deg,rgba(255,233,168,.32),transparent 78%);
  clip-path:polygon(40% 0,60% 0,100% 100%,0 100%);transition:opacity .5s}
.cr-plate .dr-por{margin:0 auto;border:2px solid rgba(255,233,168,.45);
  box-shadow:0 0 26px -4px rgba(255,200,61,.5);transition:filter .5s,border-color .5s}
.cr-name{margin-top:9px;font-size:18px;line-height:1.05;color:#fff6fb;text-wrap:balance}
.cr-rec{display:flex;justify-content:center;gap:3px;margin-top:8px;flex-wrap:wrap}
.cr-rec i{width:7px;height:7px;border-radius:1px;display:block}
.cr-place{position:absolute;top:7px;right:8px;font-size:11px;letter-spacing:.14em;
  text-transform:uppercase;color:#C9A6BC;opacity:0;transition:opacity .4s}

/* OUT: her light goes, she greys, the plinth settles back. */
.cr-plate.out{opacity:.42;transform:translateY(8px) scale(.9);
  border-color:rgba(255,255,255,.07)}
.cr-plate.out .dr-por{filter:grayscale(1) brightness(.55);
  border-color:rgba(255,255,255,.12);box-shadow:none}
.cr-plate.out::before{opacity:0}
.cr-plate.out .cr-place{opacity:1}

/* THE LAST TWO: the rest of the stage is dark, so these come up. */
.cr-plate.finaltwo{border-color:rgba(255,200,61,.55);transform:translateY(-3px)}
.cr-plate.finaltwo::before{background:linear-gradient(180deg,rgba(255,233,168,.52),transparent 78%)}

/* THE CROWN LANDS. */
.cr-plate.crowned{border-color:var(--cr-gold);transform:translateY(-12px) scale(1.1);
  background:linear-gradient(180deg,rgba(255,200,61,.28),rgba(0,0,0,.5));
  box-shadow:0 0 70px -6px rgba(255,200,61,.7)}
.cr-plate.crowned .cr-name{color:var(--cr-gold)}
.cr-plate.crowned .dr-por{border-color:var(--cr-gold);
  box-shadow:0 0 46px -2px rgba(255,200,61,.85)}
.cr-plate.crowned::before{background:linear-gradient(180deg,rgba(255,233,168,.8),transparent 84%)}
.cr-crown{position:absolute;left:50%;top:-34px;width:56px;
  transform:translate(-50%,-18px) rotate(-8deg);opacity:0;
  transition:opacity .5s,transform .7s cubic-bezier(.2,1.6,.35,1)}
.cr-plate.crowned .cr-crown{opacity:1;transform:translate(-50%,0) rotate(0deg)}

/* The gold flash across the whole stage when it happens. */
.cr-stage.flash{animation:crFlash 1.1s ease-out}
@keyframes crFlash{0%{box-shadow:0 0 0 rgba(255,200,61,0)}
  22%{box-shadow:0 0 140px 40px rgba(255,200,61,.5)}
  100%{box-shadow:0 20px 44px -24px rgba(0,0,0,.96)}}

/* Confetti, cheap and CSS-only: one strip per lamp, falling once. */
.cr-conf{position:absolute;inset:0;overflow:hidden;pointer-events:none;opacity:0}
.cr-stage.flash .cr-conf{opacity:1}
.cr-conf i{position:absolute;top:-14px;width:5px;height:12px;border-radius:1px}
/* Only when it is lit: running at load, invisibly, meant it had already
   landed by the time the name was read. */
.cr-stage.flash .cr-conf i{animation:crFall 2.6s linear forwards}
@keyframes crFall{to{transform:translateY(300px) rotate(540deg);opacity:0}}

/* ══ THE CEREMONY ══ two registers: he says it, or it happens ══ */
/* THE STAGE IS STICKY AND OPAQUE, so a beat scrolled to sits behind it
   unless it reserves the room the stage occupies. scrollIntoView respects
   scroll-margin-top; without it the reveal centres a card the stage is
   covering and the reader sees the bottom half of a sentence. */
.cr-beat{margin:0 0 16px;position:relative;z-index:1;scroll-margin-top:290px}
@media(max-width:760px){.cr-beat{scroll-margin-top:12px}}

/* THE RAIL DIMS WITH THE STAGE. These two classes are defined in
   screens.js, which only the generic section builder pulls in — this screen
   has its own builder, so it shipped the markup with no styling behind it
   and the rail showed every queen at full strength beside a heading that
   said two were left. A screen that names a class has to carry it. */
.dr-waiting{opacity:.42}
.dr-waiting .dr-por{filter:grayscale(1) brightness(.6)}
.dr-up{font-size:9px;letter-spacing:.16em;text-transform:uppercase;color:var(--cr-gold)}
.cr-said{position:relative;padding:24px 26px;text-align:center;
  border-top:1px solid rgba(255,200,61,.32);border-bottom:1px solid rgba(255,200,61,.32);
  background:linear-gradient(180deg,rgba(255,200,61,.08),transparent)}
.cr-said q{display:block;font-family:Didot,'Bodoni MT',Georgia,serif;font-size:21px;
  line-height:1.5;color:#fff6fb;quotes:none;text-wrap:pretty;max-width:62ch;margin:0 auto}
.cr-said q::before,.cr-said q::after{content:none}
.cr-who{display:block;margin-bottom:10px;font-size:9px;letter-spacing:.3em;
  text-transform:uppercase;color:var(--cr-gold)}
.cr-told{display:grid;grid-template-columns:auto 1fr;gap:15px;align-items:start;
  padding:16px 20px;border-left:3px solid rgba(255,255,255,.16);background:rgba(0,0,0,.3)}
.cr-told:not(:has(.dr-por)){grid-template-columns:1fr}
.cr-told p{margin:0;color:#f4e3ed;line-height:1.65;text-wrap:pretty;max-width:74ch}
.cr-told .dr-por{border:2px solid rgba(255,255,255,.2)}

/* CARD PHYSICS, one per register. A ceremony where every beat arrives the
   same way has no shape; these are what a ceremony's beats actually do. */
.dr-step.dr-vis .cr-said{animation:crSpeak .55s cubic-bezier(.2,.9,.3,1) both}
@keyframes crSpeak{from{opacity:0;transform:scaleX(.86)}to{opacity:1;transform:scaleX(1)}}
.dr-step.dr-vis .cr-told{animation:crTell .45s ease-out both}
@keyframes crTell{from{opacity:0;transform:translateX(-14px)}to{opacity:1;transform:none}}
/* THE NAME. It does not arrive, it lands. */
.dr-step.dr-vis .cr-said.cr-name-beat{animation:crSlam .5s cubic-bezier(.2,1.7,.35,1) both}
@keyframes crSlam{from{opacity:0;transform:scale(1.14)}to{opacity:1;transform:scale(1)}}
.cr-name-beat q{font-size:26px;color:var(--cr-gold)}

/* THE HOLD. The beat where nothing happens gets room to happen in, and
   arrives slower than anything else on the screen. */
.cr-hold{padding:52px 26px;text-align:center;
  background:radial-gradient(80% 120% at 50% 50%,rgba(255,200,61,.1),transparent 70%)}
.cr-hold p{margin:0 auto;max-width:56ch;font-family:Didot,'Bodoni MT',Georgia,serif;
  font-size:19px;font-style:italic;line-height:1.65;color:#ffd0e8}
.dr-step.dr-vis .cr-hold{animation:crHold 1.5s ease-out both}
@keyframes crHold{from{opacity:0}60%{opacity:.35}to{opacity:1}}

/* THE SASH — the one award the panel had no say in. */
.cr-sash{display:flex;align-items:center;justify-content:center;gap:18px;
  padding:20px;border:1px solid rgba(255,200,61,.38);
  background:linear-gradient(100deg,rgba(255,200,61,.15),transparent 70%)}
.cr-sash .dr-por{border:2px solid var(--cr-gold);box-shadow:0 0 30px -6px rgba(255,200,61,.7)}
.cr-sash-k{font-size:9px;letter-spacing:.28em;text-transform:uppercase;color:#C9A6BC}
.cr-sash b{display:block;font-size:27px;color:var(--cr-gold);line-height:1.1}

/* ══ THE RECORD OF THE NIGHT ══ the last two clicks ══ */
.cr-record{padding:16px 20px;border:1px solid rgba(255,200,61,.26);
  background:rgba(0,0,0,.34)}
.cr-record h4{margin:0 0 12px;font-size:12px;letter-spacing:.24em;
  text-transform:uppercase;color:var(--cr-gold)}
.cr-duel,.cr-place-row{display:flex;align-items:center;gap:10px;padding:7px 0;
  border-bottom:1px solid rgba(255,255,255,.08);flex-wrap:wrap}
.cr-duel b,.cr-place-row b{font-size:14px;color:#f0dfe9}
.cr-vs{color:#FF294B;font-size:15px}
.cr-song{color:#C9A6BC;font-size:12px;font-style:italic;margin-left:auto}
.cr-took{color:var(--cr-gold);font-size:12px;letter-spacing:.1em;
  text-transform:uppercase;margin-left:auto}
.cr-n{min-width:22px;font-variant-numeric:tabular-nums;color:#C9A6BC;font-size:15px}
.cr-record .dr-por{border:1px solid rgba(255,255,255,.2)}

/* ══ THE WINNER MOMENT ══ her portrait, her speech, her final card ══ */
.cr-winner{text-align:center;padding:40px 24px 36px;position:relative;overflow:hidden;
  background:radial-gradient(500px 350px at 50% 30%,rgba(255,200,61,.25),transparent 65%),
    radial-gradient(400px 300px at 50% 80%,rgba(255,61,154,.1),transparent 60%),
    linear-gradient(180deg,#241a00,#0a0400)}
.cr-winner::before{content:"";position:absolute;inset:0;
  background:repeating-conic-gradient(from 0deg at 50% 50%,
    rgba(255,200,61,.04) 0 10deg,transparent 10deg 20deg);
  animation:crRays 40s linear infinite}
@keyframes crRays{to{transform:rotate(360deg)}}
.cr-winner .dr-por{margin:0 auto;border:4px solid var(--cr-gold);
  box-shadow:0 0 80px -4px rgba(255,200,61,.9),0 0 140px rgba(255,200,61,.3)}
.cr-winner-label{display:block;margin-top:18px;font-size:10px;letter-spacing:.36em;
  text-transform:uppercase;color:var(--cr-gold)}
.cr-winner-name{display:block;margin-top:8px;font-size:42px;line-height:1.1;
  color:var(--cr-gold);text-shadow:0 0 40px rgba(255,200,61,.5)}
.cr-winner-speech{max-width:50ch;margin:18px auto 0;font-family:Didot,'Bodoni MT',Georgia,serif;
  font-style:italic;font-size:19px;line-height:1.65;color:#fff6fb;text-wrap:pretty}
.dr-step.dr-vis .cr-winner{animation:crWinIn .8s cubic-bezier(.2,1,.3,1) both}
@keyframes crWinIn{from{opacity:0;transform:scale(.9)}to{opacity:1;transform:none}}

/* ══ THE PRANCE ══ the last line of the season ══ */
.cr-prance{text-align:center;padding:36px 24px;position:relative;
  border-top:2px solid rgba(255,200,61,.4);
  background:linear-gradient(180deg,rgba(255,200,61,.12),transparent 40%,
    rgba(255,61,154,.06))}
.cr-prance q{display:block;font-family:Didot,'Bodoni MT',Georgia,serif;font-size:24px;
  line-height:1.5;color:var(--cr-gold);quotes:none;text-wrap:pretty;max-width:60ch;margin:0 auto}
.cr-prance-host{display:flex;justify-content:center;margin-bottom:14px}
.cr-prance-label{display:block;margin-top:6px;font-size:9px;letter-spacing:.3em;
  text-transform:uppercase;color:var(--cr-warm)}
.dr-step.dr-vis .cr-prance{animation:crPranceIn .6s cubic-bezier(.2,.9,.3,1) both}
@keyframes crPranceIn{from{opacity:0;transform:scaleX(.88)}to{opacity:1;transform:none}}

/* ══ THE CEREMONY ON THE STAGE ══ (the pieces the reveal plays) */
.cr-stage{top:6px;border-radius:22px;overflow:hidden;isolation:isolate}
.cr-stage > .cr-bgx,.cr-stage > .cr-hunt,.cr-stage > .cr-bannerx,.cr-stage > .cr-quote,.cr-stage > .cr-conf{position:absolute}
.cr-bgx{inset:0;pointer-events:none;z-index:0}
.cr-bgx i{position:absolute;inset:0}
.cr-rays{opacity:.5;background:repeating-conic-gradient(from 180deg at 50% -12%,rgba(255,214,107,.07) 0 4deg,transparent 4deg 11deg)}
.cr-washx{opacity:0;transition:opacity .6s,background .6s}
.cr-stage[data-mood=gold] .cr-washx{opacity:1;background:radial-gradient(90% 70% at 50% 60%,rgba(255,214,107,.32),transparent 70%)}
.cr-stage[data-mood=red] .cr-washx{opacity:1;background:radial-gradient(90% 70% at 50% 100%,rgba(255,30,60,.28),transparent 70%)}
.cr-vigx{box-shadow:inset 0 0 130px 45px rgba(0,0,0,.8);opacity:.35;transition:opacity .6s}
.cr-stage[data-phase=hold] .cr-vigx{opacity:1;animation:crHeart 1s ease-in-out infinite}
@keyframes crHeart{0%,100%{box-shadow:inset 0 0 130px 45px rgba(0,0,0,.85)}15%{box-shadow:inset 0 0 200px 90px rgba(40,10,0,.95)}30%{box-shadow:inset 0 0 130px 45px rgba(0,0,0,.85)}45%{box-shadow:inset 0 0 180px 70px rgba(40,10,0,.9)}}
.cr-stage > *:not(.cr-bgx):not(.cr-hunt):not(.cr-bannerx):not(.cr-quote):not(.cr-conf){position:relative;z-index:1}
.cr-topx{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-bottom:8px}
.cr-titlex{font:400 20px/1 'Anton','Impact',sans-serif;letter-spacing:.08em;text-transform:uppercase;color:#fff3cf}
.cr-titlex small{display:block;margin-top:3px;font:600 10px/1 system-ui,sans-serif;letter-spacing:.24em;color:var(--cr-gold)}
.cr-headx{flex:1 1 auto;display:flex;justify-content:center;min-width:0}
.cr-headx span{padding:4px 14px;border-radius:99px;font:400 15px/1.1 'Anton','Impact',sans-serif;letter-spacing:.08em;text-transform:uppercase;
  color:#2a1a00;background:linear-gradient(90deg,#ffd66b,#fff1a8);box-shadow:0 0 18px rgba(255,214,107,.5);
  opacity:0;transform:translateY(-6px);transition:opacity .4s .9s,transform .4s .9s;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}
.cr-headx span.on{opacity:1;transform:none}
.cr-headx span.red{color:#fff;background:linear-gradient(90deg,#ff294b,#ff6b8a)}
.cr-headx span small{font:600 10px/1 system-ui,sans-serif;letter-spacing:.16em;margin-left:8px;opacity:.85}
.cr-podium{display:flex;align-items:center;gap:8px;padding:3px 10px 3px 3px;border-radius:99px;background:rgba(255,255,255,.06);
  border:1px solid rgba(255,214,107,.2);transition:box-shadow .4s,border-color .4s}
.cr-podium.on{box-shadow:0 0 22px rgba(255,214,107,.5);border-color:var(--cr-gold)}
.cr-hf{width:34px;height:34px;border-radius:50%;overflow:hidden;box-shadow:0 0 0 2px var(--cr-gold)}
.cr-hf > *,.cr-hf img{width:100%!important;height:100%!important;object-fit:cover;margin:0!important}
.cr-env{width:44px;height:30px;opacity:0;transform:translateY(8px) rotate(-8deg) scale(.7);transition:opacity .4s,transform .5s cubic-bezier(.2,1.6,.4,1)}
.cr-stage[data-env=held] .cr-env,.cr-stage[data-env=open] .cr-env{opacity:1;transform:none}
.cr-stage[data-env=held] .cr-env{animation:crEnv .9s ease-in-out infinite}
@keyframes crEnv{50%{transform:translateY(-3px) rotate(3deg)}}
.cr-env .flap{transform-origin:22px 4px;transition:transform .6s}
.cr-stage[data-env=open] .cr-env .flap{transform:scaleY(-1)}
.cr-env .card{transition:transform .6s .3s}
.cr-stage[data-env=open] .cr-env .card{transform:translateY(-12px)}
.cr-stage[data-phase=hall] .cr-lamp{animation:crLampRun 1.6s ease-in-out infinite;animation-delay:var(--dl)}
@keyframes crLampRun{50%{background:#fff;box-shadow:0 8px 40px rgba(255,241,168,1)}}
.cr-stage.arrive .cr-plate{animation:crArrive .8s cubic-bezier(.2,1.4,.4,1) both;animation-delay:var(--dl)}
@keyframes crArrive{from{opacity:0;transform:translateY(40px) scale(.8)}}
.cr-hunt{top:0;bottom:0;left:50%;width:220px;margin-left:-110px;pointer-events:none;opacity:0;z-index:0;
  background:radial-gradient(40% 30% at 50% 78%,rgba(255,255,255,.3),transparent 70%),linear-gradient(180deg,rgba(255,241,200,.28),rgba(255,255,255,.04) 70%,transparent);
  clip-path:polygon(44% 0,56% 0,100% 100%,0 100%);transition:left .7s cubic-bezier(.3,1.3,.5,1),opacity .4s}
.cr-stage[data-phase=hold] .cr-hunt{opacity:1;animation:crHunt 1.8s ease-in-out infinite alternate}
.cr-stage[data-env=held] .cr-hunt{animation-duration:.7s}
.cr-stage[data-phase=crowned] .cr-hunt{opacity:1;animation:none}
@keyframes crHunt{from{transform:translateX(calc(var(--hunt,100px) * -1))}to{transform:translateX(var(--hunt,100px))}}
.cr-plate.stamped .cr-place{opacity:1;animation:crStamp .5s cubic-bezier(.5,0,.3,1.4)}
@keyframes crStamp{0%{transform:scale(3) rotate(-12deg);opacity:0}100%{transform:none;opacity:1}}
.cr-plate .cr-place.big{top:40%;right:50%;transform:translate(50%,-50%) rotate(-10deg);padding:4px 10px;border:3px solid #ff5a6e;border-radius:6px;
  font:400 18px/1 'Anton','Impact',sans-serif;letter-spacing:.08em;color:#ff5a6e;background:rgba(10,2,5,.7)}
.cr-plate.stamped .cr-place.big{animation:crStampC .5s cubic-bezier(.5,0,.3,1.4)}
@keyframes crStampC{0%{transform:translate(50%,-50%) rotate(-10deg) scale(3);opacity:0}100%{transform:translate(50%,-50%) rotate(-10deg);opacity:1}}
.cr-sashx{position:absolute;left:4px;top:34%;width:calc(100% - 8px);height:44px;pointer-events:none;opacity:0;transform:translateY(-30px);z-index:2;
  transition:opacity .4s,transform .7s cubic-bezier(.2,1.5,.4,1)}
.cr-plate.sashed .cr-sashx{opacity:1;transform:none}
.cr-plate.regal .dr-por{animation:crGlint 1.4s ease-in-out infinite}
@keyframes crGlint{50%{box-shadow:0 0 70px 10px rgba(255,241,168,.95)}}
.cr-castx{display:flex;justify-content:center;flex-wrap:wrap;gap:4px;margin-top:8px;min-height:0}
.cr-castx span{width:26px;height:26px;border-radius:50%;overflow:hidden;opacity:0;transform:translateY(20px) scale(.4);box-shadow:0 0 0 2px rgba(255,214,107,.5)}
.cr-castx span > *,.cr-castx span img{width:100%!important;height:100%!important;object-fit:cover;margin:0!important}
.cr-stage.flood .cr-castx span{animation:crFlood .6s cubic-bezier(.2,1.5,.4,1) forwards;animation-delay:var(--dl)}
@keyframes crFlood{to{opacity:1;transform:none}}
.cr-bannerx{left:0;right:0;top:42%;text-align:center;pointer-events:none;opacity:0;z-index:5}
.cr-bannerx b{display:inline-block;padding:6px 26px;font:400 clamp(30px,5.6vw,60px)/1 'Anton','Impact',sans-serif;letter-spacing:.05em;
  text-transform:uppercase;color:#fff;text-shadow:0 0 30px #ffd66b,0 6px 0 #7a4a00;background:linear-gradient(90deg,transparent,rgba(255,214,107,.32),transparent)}
.cr-bannerx small{display:block;margin-top:6px;font-size:12px;letter-spacing:.3em;text-transform:uppercase;color:var(--cr-gold)}
.cr-bannerx.red b{color:#e3e3ec;text-shadow:0 0 22px #000,0 6px 0 #3a0010;background:linear-gradient(90deg,transparent,rgba(255,41,75,.3),transparent)}
.cr-bannerx.show{animation:crBanner 2.6s cubic-bezier(.2,1.5,.4,1) forwards}
@keyframes crBanner{0%{opacity:0;transform:scale(.6)}15%{opacity:1;transform:scale(1.06)}25%{transform:scale(1)}75%{opacity:1}100%{opacity:0;transform:scale(.92)}}
.cr-stage.rain .cr-conf{opacity:1}
.cr-stage.rain .cr-conf i{animation:crFall 2.6s linear infinite}
.cr-stage.shake{animation:crShake .45s linear}
@keyframes crShake{20%{transform:translateX(-6px)}40%{transform:translateX(5px)}60%{transform:translateX(-4px)}80%{transform:translateX(3px)}}
.cr-stage[data-phase=quote] .cr-line,.cr-stage[data-phase=quote] .cr-truss,.cr-stage[data-phase=quote] .cr-bgx{filter:grayscale(1) brightness(.4)}
.cr-quote{inset:0;z-index:7;display:flex;align-items:center;justify-content:center;gap:18px;padding:20px;opacity:0;pointer-events:none;transition:opacity .35s}
.cr-stage[data-phase=quote] .cr-quote{opacity:1}
.cr-qf{flex:0 0 130px;width:130px;height:130px;border-radius:18px;overflow:hidden;box-shadow:0 0 0 3px var(--cr-gold),0 20px 50px rgba(0,0,0,.8);transform:rotate(-3deg)}
.cr-qf > *,.cr-qf img{width:100%!important;height:100%!important;object-fit:cover;margin:0!important}
.cr-qb{max-width:480px;padding:14px 18px;border-radius:16px;background:rgba(24,14,2,.94);border:1px solid rgba(255,214,107,.45)}
.cr-qb small{display:inline-block;margin-bottom:8px;padding:3px 10px;border-radius:99px;background:var(--cr-gold);color:#2a1a00;
  font-size:10px;letter-spacing:.26em;text-transform:uppercase}
.cr-qb q{display:block;font-size:17px;line-height:1.45;font-style:italic;quotes:none}
@media(prefers-reduced-motion:reduce){
  .cr-stage,.cr-stage *{animation:none!important}
  .cr-bannerx.show{opacity:0}
}
@media(max-width:760px){
  .cr-podium .cr-hl{display:none}.cr-headx{order:3;flex-basis:100%}
  .cr-plate{width:112px;padding:11px 8px 9px}
  .cr-name{font-size:15px}
  .cr-said q{font-size:18px}
  .cr-winner-name{font-size:30px}
}
@media(prefers-reduced-motion:reduce){
  .cr-plate,.cr-plate::before,.cr-crown,.cr-sweep,.cr-conf i,
  .dr-step.dr-vis .cr-said,.dr-step.dr-vis .cr-told,.dr-step.dr-vis .cr-hold,
  .cr-stage.flash,.cr-winner::before,
  .dr-step.dr-vis .cr-winner,.dr-step.dr-vis .cr-prance{animation:none;transition:none}
}
/* Last, so it wins over the base sizes above: a shorter window. */
@media (max-height: 999px){
  .cr-stage{padding:8px 12px 10px}
  .cr-truss{margin-bottom:18px;padding-bottom:6px}
  .cr-plate{width:118px;padding:9px 8px 8px}
  .cr-plate .dr-por{width:60px!important;height:60px!important}
  .cr-name{font-size:14px;margin-top:5px}
  .cr-rec{margin-top:5px}
  .cr-crown{width:42px;top:-26px}
  .cr-qf{flex-basis:80px;width:80px;height:80px}.cr-qb q{font-size:14px}
  .cr-bannerx b{font-size:clamp(24px,4vw,40px)}
  .cr-beat{scroll-margin-top:340px}
}
`;

/** The crown, drawn rather than typed — no emoji anywhere on this screen. */
const CROWN_SVG = `<svg class="cr-crown" viewBox="0 0 64 42" aria-hidden="true">
  <defs><linearGradient id="crg" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#FFF3CF"/><stop offset="1" stop-color="#D8990F"/>
  </linearGradient></defs>
  <path d="M4 34 L2 7 L18 20 L32 2 L46 20 L62 7 L60 34 Z"
    fill="url(#crg)" stroke="#7A4E00" stroke-width="1.2" stroke-linejoin="round"/>
  <rect x="3" y="33" width="58" height="7" rx="1.5"
    fill="url(#crg)" stroke="#7A4E00" stroke-width="1.2"/>
  <circle cx="32" cy="12" r="3.4" fill="#FF3D9A" stroke="#7A4E00" stroke-width="1"/>
  <circle cx="12" cy="18" r="2.3" fill="#38bdf8" stroke="#7A4E00" stroke-width="1"/>
  <circle cx="52" cy="18" r="2.3" fill="#38bdf8" stroke="#7A4E00" stroke-width="1"/>
</svg>`;

/** Miss Congeniality's sash, across her plinth. */
const SASH_SVG = `<svg class="cr-sashx" viewBox="0 0 150 60" preserveAspectRatio="none" aria-hidden="true">
  <path d="M8 6 L30 6 L142 48 L142 58 L120 58 L8 16 Z" fill="#ff3d9a" stroke="#7a0f3e" stroke-width="1.2"/>
  <path d="M14 9 L136 52" stroke="#fff1a8" stroke-width="1.4" stroke-dasharray="3 3"/></svg>`;

const ENVELOPE_SVG = `<svg class="cr-env" viewBox="0 0 44 30" aria-hidden="true">
  <rect class="card" x="7" y="6" width="30" height="18" rx="1.5" fill="#fff8e6" stroke="#b58a2a"/>
  <rect x="2" y="8" width="40" height="20" rx="2" fill="#d8a72f" stroke="#7a4e00"/>
  <path class="flap" d="M2 9 L22 21 L42 9 L42 8 L2 8 Z" fill="#f1c24c" stroke="#7a4e00"/></svg>`;

/** A long line cut at a word, with an ellipsis: the whole of it is on the card. */
const clip = (t, n) => {
  const str = String(t || '');
  if (str.length <= n) return str;
  const cut = str.slice(0, n);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(' '), n - 20)).trimEnd()}…`;
};

const CONFETTI_COLOURS = ['#FFC83D', '#FF3D9A', '#38bdf8', '#3BE08A', '#fff6fb'];
const confetti = () => `<div class="cr-conf">${
  Array.from({ length: 34 }, (_, i) => {
    const left = Math.round((i * 37) % 100);
    const delay = ((i * 13) % 90) / 100;
    const c = CONFETTI_COLOURS[i % CONFETTI_COLOURS.length];
    return `<i style="left:${left}%;background:${c};animation-delay:${delay}s"></i>`;
  }).join('')}</div>`;

/** One finalist on her plinth: her face under a lamp, her name, her season. */
function plinth(name, record, ep) {
  const chips = (record || []).map(r =>
    `<i style="background:${REC[r] || '#4b5563'}" title="${esc(r)}"></i>`).join('');
  return `<div class="cr-plate" id="cr-plate-${esc(name)}" data-queen="${esc(name)}">
    ${CROWN_SVG}
    ${SASH_SVG}
    <span class="cr-place"></span>
    ${_portrait(name, ep, { size: 92, station: true })}
    <div class="cr-name dr-disp">${esc(name)}</div>
    <div class="cr-rec">${chips}</div>
  </div>`;
}

/* WHICH BEATS ARE SPOKEN. The host's lines are set as speech — centred,
   serif, ruled above and below — and the narrator's are set as prose beside
   a portrait. A ceremony where both look the same is a ceremony in which
   nobody is talking. */
const SPOKEN = new Set(['crown-summon', 'crown-congeniality', 'crown-address',
  'crown-place', 'crown-envelope', 'crown-name', 'crown-prance',
  'finale-congeniality', 'finale-runnerup', 'finale-crowning', 'finale-prance']);

/** The ids that end the season on the winner being named. */
const NAME_BEATS = new Set(['crown-name', 'finale-crowning']);

/**
 * The crowning.
 *
 * Every step carries `data-stage`: the state of the room after that beat, as
 * "out:Name,Name|two:Name,Name|crown:Name". The reveal hook reads the
 * current step's and repaints the line from it — so the stage is always
 * exactly as far along as the reader is, including after a tab switch, when
 * the DOM is fresh and every class the earlier clicks added is gone.
 */
export function rpBuildCrowning(row) {
  const ep = { num: row?.num ?? row?.dr?.ep ?? 0, format: 'drag-race', dr: row?.dr || {} };
  const fin = row?.dr?.finale;
  if (!fin) return '';

  const placements = fin.placements || [];
  const record = row?.dr?.record || {};

  // Alphabetical, deliberately — see the note at the top of the file.
  const line = [...placements].sort((a, b) => a.localeCompare(b));

  const castAll = [...new Set([...((row.dr.scenes || []).find(x => x.data?.cast)?.data?.cast || []), ...line])];
  const stage = `<!--dr-chrome--><div class="cr-stage" id="cr-stage" data-phase="idle" data-env="">
    <div class="cr-bgx"><i class="cr-rays"></i><i class="cr-washx"></i><i class="cr-vigx"></i></div>
    <i class="cr-hunt"></i>
    ${confetti()}
    <div class="cr-topx">
      <div class="cr-titlex">The crowning<small>${esc(line.length)} finalists</small></div>
      <div class="cr-headx"><span data-hd></span></div>
      <div class="cr-podium" data-podium><span class="cr-hf">${_judgePortrait('rupaul', { stage: true, size: 34 })}</span>${ENVELOPE_SVG}<span class="cr-hl dr-up">The host</span></div>
    </div>
    <div class="cr-truss">${line.map((_, j) => `<i class="cr-lamp lit" style="--dl:${(j * 0.15).toFixed(2)}s"></i>`).join('')}</div>
    <div class="cr-line">${line.map((n, j) => plinth(n, record[n], ep).replace('class="cr-plate"', `class="cr-plate" style="--dl:${(j * 0.18).toFixed(2)}s"`)).join('')}</div>
    <div class="cr-castx">${castAll.map((n, j) => `<span style="--dl:${(j * 0.06).toFixed(2)}s">${_portrait(n, ep, { size: 26 })}</span>`).join('')}</div>
    <div class="cr-bannerx"><b data-bn></b><small data-bs></small></div>
    <div class="cr-quote" data-quote></div>
  </div><!--/dr-chrome-->`;

  /* The scenes, in the order the engine wrote them. `crowning:` is the
     ceremony pool; the `finale:` ids are the five-line version it replaces,
     still drawn while a tier of the new pool is unwritten. */
  const scenes = (row.dr.scenes || []).filter(s =>
    (s.step === 'crowning'
      || /^finale:(finale-congeniality|finale-runnerup|finale-crowning|finale-speech|finale-prance)$/
        .test(s.kind || ''))
    && s.text);
  if (!scenes.length) return '';

  // The room's state accumulates as the beats go by.
  /* TWO CROWNS, WHEN THE SEASON MADE TWO. All Stars 4 crowned Trinity the
     Tuck and Monet X Change together and it is the only time it has happened,
     so this is an exception the ceremony has to survive rather than a shape
     it is built around. `crowned` is a list: one name on every ordinary
     season, two when the finale could not separate them. Without this the
     chart showed two WINNER cells and the ceremony lit one plinth, which is
     the screen disagreeing with the record it was drawn from. */
  const alsoCrowned = fin.doubleCrown ? (fin.winners || []) : [];
  const out = [];
  let crowned = [];
  const steps = scenes.map((sc, i) => {
    const beat = sc.data?.beat || String(sc.kind || '').split(':')[1] || '';
    const who = (sc.data?.players || [])[0];

    if (beat === 'crown-place' && who) out.push(who);
    // The naming beat crowns her — and her co-winner with her, if there is one.
    if (NAME_BEATS.has(beat) && who) {
      crowned = alsoCrowned.length ? [...alsoCrowned] : [who];
    }

    const standing = line.filter(n => !out.includes(n));
    const attr = `out:${out.join(',')}|two:${
      standing.length === 2 && !crowned.length ? standing.join(',') : ''}|crown:${crowned.join(',')}`;

    let body;
    if (beat === 'crown-final-two') {
      body = `<div class="cr-hold"><p>${esc(sc.text)}</p></div>`;
    } else if (beat === 'crown-congeniality' || beat === 'finale-congeniality') {
      body = `<div class="cr-sash">
        ${who ? _portrait(who, ep, { size: 72, station: true }) : ''}
        <div><span class="cr-sash-k">The cast chose her</span>
          <b class="dr-disp">${esc(who || '')}</b></div>
      </div>
      <div class="cr-said" style="border-top:0"><q>${esc(sc.text)}</q></div>`;
    } else if (beat === 'crown-speech' || beat === 'finale-speech') {
      body = `<div class="cr-winner">
        ${who ? _portrait(who, ep, { size: 160, station: true }) : ''}
        <span class="cr-winner-label dr-disp">America's Next Drag Superstar</span>
        <b class="cr-winner-name dr-disp">${esc(who || '')}</b>
        <p class="cr-winner-speech">${esc(sc.text)}</p>
      </div>`;
    } else if (beat === 'crown-prance' || beat === 'finale-prance') {
      body = `<div class="cr-prance">
        <div class="cr-prance-host">
          ${_judgePortrait('rupaul', { stage: true, size: 56 })}
        </div>
        <span class="cr-prance-label">The host</span>
        <q>${esc(sc.text)}</q>
      </div>`;
    } else if (SPOKEN.has(beat)) {
      body = `<div class="cr-said${NAME_BEATS.has(beat) ? ' cr-name-beat' : ''}">
        <div style="display:flex;justify-content:center;margin-bottom:10px">
          ${_judgePortrait('rupaul', { stage: true, size: 44 })}
        </div>
        <span class="cr-who">The host</span><q>${esc(sc.text)}</q></div>`;
    } else {
      body = `<div class="cr-told">
        ${who ? _portrait(who, ep, { size: 56, station: true }) : ''}
        <p>${esc(sc.text)}</p></div>`;
    }

    return `<div class="dr-step cr-beat" id="dr-step-fincrown-${i}"
      data-stage="${esc(attr)}" data-crownbeat="${NAME_BEATS.has(beat) ? '1' : ''}">
      ${body}</div>`;
  }).join('');

  /* ── THE RECORD OF THE NIGHT, at the end where it belongs ──
     The screen this replaces drew the crown lip sync bracket and the
     finishing order at the TOP, ungated, which is how it gave away the
     season. Cutting them entirely is the other half of that mistake and one
     this file has already made once: the finishing order stopped reaching
     the transcript, which is a written record of a season that no longer
     said who came where. tests/dr-vp-summary.test.js caught it.
     So they stay, as the last two clicks — after the ceremony has actually
     announced everything on them. */
  const afterCrown = `out:${line.filter(n => !crowned.includes(n)).join(',')}|two:|crown:${crowned.join(',')}`;
  const duels = (fin.rounds || []).map(r => `<div class="cr-duel">
      ${_portrait(r.a, ep, { size: 34 })}<b class="dr-disp">${esc(r.a)}</b>
      <span class="cr-vs">vs</span>
      <b class="dr-disp">${esc(r.b)}</b>${_portrait(r.b, ep, { size: 34 })}
      <span class="cr-song">${esc(r.song || '')}</span>
      <span class="cr-took dr-disp">${esc(r.winner || '')} takes it</span>
    </div>`).join('');
  const places = placements.map((n, idx) => `<div class="cr-place-row">
      <span class="cr-n dr-disp">${idx + 1}</span>
      ${_portrait(n, ep, { size: 34 })}
      <b class="dr-disp">${esc(n)}</b>
      ${idx === 0 ? '<span class="cr-took dr-disp">crowned</span>' : ''}
    </div>`).join('');

  let n = scenes.length;
  const tail = (duels ? `<div class="dr-step cr-beat" id="dr-step-fincrown-${n++}"
      data-stage="${esc(afterCrown)}">
      <div class="cr-record"><h4 class="dr-disp">For the crown</h4>${duels}</div></div>` : '')
    + `<div class="dr-step cr-beat" id="dr-step-fincrown-${n++}"
      data-stage="${esc(afterCrown)}">
      <div class="cr-record"><h4 class="dr-disp">Placements</h4>${places}</div></div>`;
  const total = n;

  /* THE HOOK. Reads the current step's `data-stage` and repaints the whole
     line from it, every time, rather than patching the newest plinth — see
     the note at the top of reveal.js for why the cheap version breaks on a
     tab switch. `placeOf` is looked up rather than counted, so a plinth
     always shows the placement the season actually recorded. */
  /* ── ONE STATE PER STEP ──
     What the room looks like after each beat, and what the beat itself plays:
     a placement stamped, the envelope, the heartbeat between the last two,
     the name, the crown, the speech to camera, the cast flooding the stage.
     Built once, from the same scenes the cards are. */
  const placeOf = {};
  placements.forEach((q, idx) => { placeOf[q] = idx + 1; });
  const ord = k => `${k}${k === 1 ? 'st' : k === 2 ? 'nd' : k === 3 ? 'rd' : 'th'}`;
  const quote = (who, label, text) => `<span class="cr-qf">${_portrait(who, ep, { size: 130 })}</span>
    <div class="cr-qb"><small>${esc(label)}</small><q>${esc(clip(text, 210))}</q></div>`;
  const states = [];
  {
    const gone = [];
    let wins = [];
    let two = [];
    let sash = null;
    let runner = null;
    let env = '';
    let flooded = false;
    let regal = false;
    for (const sc of scenes) {
      const beat = sc.data?.beat || String(sc.kind || '').split(':')[1] || '';
      const who = (sc.data?.players || [])[0];
      const st = { phase: 'cer', mood: '', banner: null, stamped: null, burst: false, shake: false, quote: '', hostOn: false, arrive: false, rain: false };
      if (beat === 'crown-hall') st.phase = 'hall';
      else if (beat === 'crown-summon') { st.arrive = true; st.hostOn = true; }
      else if (beat === 'crown-address') st.hostOn = true;
      else if (beat === 'crown-congeniality' || beat === 'finale-congeniality') {
        st.banner = { text: 'Miss Congeniality', sub: who || '' };
        st.mood = 'gold';
        if (who && line.includes(who)) sash = who;
        else if (who) { st.phase = 'quote'; st.quote = quote(who, 'Miss Congeniality', sc.text); }
      } else if (beat === 'crown-place' && who) {
        gone.push(who);
        st.stamped = who;
        st.banner = { text: `${ord(Number(sc.data?.place) || placeOf[who] || 0)} place`, sub: who, red: true };
        st.mood = 'red';
        st.shake = true;
      } else if (beat === 'crown-final-two') {
        two = (sc.data?.finalTwo || sc.data?.players || []).slice(0, 2);
        st.phase = 'hold';
        st.banner = { text: 'The final two', sub: two.join(' & ') };
      } else if (beat === 'crown-envelope') {
        env = 'held';
        st.phase = 'hold';
        st.hostOn = true;
      } else if (NAME_BEATS.has(beat) && who) {
        wins = alsoCrowned.length ? [...alsoCrowned] : [who];
        env = 'open';
        st.phase = 'crowned';
        st.mood = 'gold';
        st.burst = true;
        st.banner = { text: 'Condragulations', sub: wins.join(' & ') };
      } else if (beat === 'crown-runnerup' || beat === 'finale-runnerup') {
        runner = who || runner;
        st.stamped = runner;
        st.phase = wins.length ? 'crowned' : 'cer';
        st.banner = { text: 'Runner-up', sub: runner || '', red: true };
      } else if (beat === 'crown-regalia') {
        regal = true;
        st.phase = 'crowned';
        st.mood = 'gold';
        st.burst = true;
      } else if (beat === 'crown-speech' || beat === 'finale-speech') {
        st.phase = 'quote';
        st.quote = quote(who || wins[0], 'Her first words as the winner', sc.text);
      } else if (beat === 'crown-cast') {
        flooded = true;
        st.phase = 'crowned';
      } else if (beat === 'crown-prance' || beat === 'finale-prance') {
        flooded = true;
        st.phase = 'crowned';
        st.rain = true;
        st.banner = { text: 'Now prance', sub: 'the season is over' };
      }
      if (wins.length && st.phase === 'cer') st.phase = 'crowned';
      Object.assign(st, {
        gone: [...gone], wins: [...wins], two: wins.length ? [] : [...two], sash, runner: wins.length ? runner : null,
        env, flooded, regal,
      });
      states.push(st);
    }
  }
  const lastState = states[states.length - 1];
  while (states.length < total) states.push({ ...lastState, banner: null, burst: false, shake: false, quote: '', phase: lastState.phase === 'quote' ? 'crowned' : lastState.phase });

  if (typeof window !== 'undefined') {
    let prev = -99;
    let timer = null;
    const apply = idx => {
      const stageEl = document.getElementById('cr-stage');
      if (!stageEl) return;
      const st = idx < 0 ? null : states[Math.min(idx, states.length - 1)];
      const fresh = idx === prev + 1;
      prev = idx;
      clearTimeout(timer);
      stageEl.classList.remove('flash', 'shake', 'arrive', 'rain', 'flood');
      const bn = stageEl.querySelector('.cr-bannerx');
      bn.classList.remove('show', 'red');
      const hd = stageEl.querySelector('[data-hd]');
      hd.classList.remove('on', 'red');
      stageEl.dataset.phase = st ? st.phase : 'idle';
      stageEl.dataset.mood = st?.mood || '';
      stageEl.dataset.env = st?.env || '';
      stageEl.querySelector('[data-podium]')?.classList.toggle('on', !!st?.hostOn);
      stageEl.querySelector('[data-quote]').innerHTML = st?.quote || '';
      const gone = st?.gone || [];
      const wins = st?.wins || [];
      const two = st?.two || [];
      let lit = 0;
      for (const el of stageEl.querySelectorAll('.cr-plate')) {
        const q = el.getAttribute('data-queen');
        const isOut = gone.includes(q) || (wins.length && !wins.includes(q));
        el.classList.toggle('out', !!isOut);
        el.classList.toggle('finaltwo', two.includes(q));
        el.classList.toggle('crowned', wins.includes(q));
        el.classList.toggle('sashed', !!st && st.sash === q);
        el.classList.toggle('regal', !!st?.regal && wins.includes(q));
        el.classList.toggle('stamped', !!st && fresh && st.stamped === q);
        if (!isOut) lit += 1;
        const tag = el.querySelector('.cr-place');
        const isRunner = !!st && st.runner === q;
        tag.textContent = gone.includes(q) && placeOf[q] ? ord(placeOf[q]) : isRunner ? 'Runner-up' : '';
        tag.classList.toggle('big', !!st && st.stamped === q && st.phase !== 'crowned');
      }
      const lamps = [...stageEl.querySelectorAll('.cr-lamp')];
      lamps.forEach((l, j) => l.classList.toggle('lit', j < Math.max(1, lit)));
      if (!st) return;
      // The spotlight: between the last two while they wait, on the winner after.
      const target = wins.length ? wins : two;
      const plates = [...stageEl.querySelectorAll('.cr-plate')].filter(p => target.includes(p.getAttribute('data-queen')));
      if (plates.length) {
        const box = stageEl.getBoundingClientRect();
        const xs = plates.map(p => { const r = p.getBoundingClientRect(); return r.left + r.width / 2 - box.left; });
        stageEl.querySelector('.cr-hunt').style.left = `${(Math.min(...xs) + Math.max(...xs)) / 2}px`;
        stageEl.style.setProperty('--hunt', `${Math.max(10, (Math.max(...xs) - Math.min(...xs)) / 2)}px`);
      }
      if (st.flooded) stageEl.classList.add('flood');
      if (st.rain) stageEl.classList.add('rain');
      if (st.banner) {
        stageEl.querySelector('[data-bn]').textContent = st.banner.text;
        stageEl.querySelector('[data-bs]').textContent = st.banner.sub || '';
        bn.classList.toggle('red', !!st.banner.red);
        hd.innerHTML = `${esc(st.banner.text)}${st.banner.sub ? `<small>${esc(st.banner.sub)}</small>` : ''}`;
        hd.classList.toggle('red', !!st.banner.red);
        hd.classList.add('on');
        if (fresh) { void stageEl.offsetWidth; bn.classList.add('show'); }
      }
      if (fresh) {
        if (st.arrive) stageEl.classList.add('arrive');
        if (st.burst) stageEl.classList.add('flash');
        if (st.shake) stageEl.classList.add('shake');
        timer = setTimeout(() => stageEl.classList.remove('flash', 'shake', 'arrive'), 2800);
      }
    };
    window._drRevealExtra = window._drRevealExtra || {};
    window._drRevealExtra.fincrown = idx => apply(idx);
    setTimeout(() => {
      try { const { idx } = _state(ep, 'fincrown'); if (idx >= 0) apply(idx); } catch { /* decoration */ }
    }, 0);
  }

  /* THE RAIL: who is still standing, and it shrinks. Gated by step, so it
     never shows a plinth going dark before the beat that darkens it. */
  if (typeof window !== 'undefined') {
    window._drSidebar = window._drSidebar || {};
    const gone = [];
    let won = null;
    window._drSidebar.fincrown = scenes.map(sc => {
      const beat = sc.data?.beat || String(sc.kind || '').split(':')[1] || '';
      const who = (sc.data?.players || [])[0];
      if (beat === 'crown-place' && who) gone.push(who);
      if (NAME_BEATS.has(beat) && who) won = who;
      const left = line.filter(n => !gone.includes(n));
      return `<h4 class="dr-disp">Still standing · ${won ? 1 : left.length}</h4>${
        line.map(n => {
          const dark = gone.includes(n) || (won && n !== won);
          return `<div class="dr-slot${dark ? ' dr-waiting' : ''}">
            ${_portrait(n, ep, { size: 32 })}
            <div><div class="dr-nm">${esc(n)}</div></div>
            <span class="dr-up">${n === won ? 'crowned' : ''}</span></div>`;
        }).join('')}`;
    });
    // The two record cards keep the last panel rather than blanking the rail.
    const last = window._drSidebar.fincrown[window._drSidebar.fincrown.length - 1] || '';
    window._drSidebar.fincrown.push(last, last);
  }

  const house = '<div class="cr-house"><div class="cr-sweep"></div></div>';
  const rail = `<h4 class="dr-disp">Still standing · ${line.length}</h4>${
    line.map(n => `<div class="dr-slot">${_portrait(n, ep, { size: 32 })}
      <div><div class="dr-nm">${esc(n)}</div></div><span></span></div>`).join('')}`;

  return `<style>${CROWN_CSS}</style>${_shell(
    `<div class="cr-wrap">${house}${stage}${steps}${tail}</div>`, ep, {
      phase: 'stage', title: 'The Crowning', subtitle: 'the last queen standing',
      sidebar: rail,
    })}${_controls('fincrown', Math.max(1, total), ep.num)}`;
}
