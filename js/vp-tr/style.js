// ══════════════════════════════════════════════════════════════════════
// vp-tr/style.js — the conclave's visual system, as approved
// ══════════════════════════════════════════════════════════════════════
//
// Lifted from `mockup-tr-conclave.html`, which is the visual target and is
// kept in the repo. Two things are DIFFERENT here and both are noted in the
// mockup's own comments as builder-only corrections:
//
//   * every absolutely-positioned scenery layer starts at `top:46px`, because
//     the real VP has the 46px `.rp-nav` bar above it and the mockup does not;
//   * the sticky sidebar panel sits at `top:56px` for the same reason.
//
// TYPE. Display is FRAUNCES 900, WONK 1 — the logotype's serifs are wedges
// flaring to a point, a Roman trait, not a Didone's flat slabs; the earlier
// Bodoni Moda pass was working from a brief that turned out to be wrong.
// mockup-tr-fonts.html is the specimen sheet that reversed it, and §2.5 there
// is the ladder the hero title's 0.80 squeeze came off. Body is Cormorant
// Garamond; the hand — spoken lines, vellum, the host — is IM Fell English.
//
// MATERIAL, NOT COLOUR. Stone is turbulence-grained and pitted, vellum has
// fibre and a torn deckle edge, wax has a specular dome, brass has wear. All
// of it is SVG filters, which nothing else in this repo uses.

// THE NEUTRAL PORTRAIT'S OWN RULES, SPLIT OUT SO THERE IS ONE COPY.
//
// `_portrait()` (js/vp-tr/conclave.js) is exported for every screen in this
// directory, and a helper is only shared if its stylesheet is too: the Round
// Table draws the same faces and does not load the conclave's stylesheet, so
// without this the base rules would have been retyped into a second file and
// the two would have drifted the first time a radius changed.
//
// The `--cv-*` custom properties it reads are declared by whichever screen is
// hosting it, which is what lets the same markup be bone-on-green in the hall
// and amber-on-black in the turret. Nothing here is atmosphere: the lantern's
// rim-light, the shadow side and the graded film are `.cv-lit`, and `.cv-lit`
// stays in CONCLAVE_CSS where it belongs.
export const PORTRAIT_CSS = `
.cv-av{
  position:relative;display:inline-block;overflow:hidden;flex:none;vertical-align:middle;
  border-radius:50% 50% 12% 12% / 44% 44% 9% 9%;
  background:linear-gradient(162deg,#252b37,#080b11);
  box-shadow:0 0 0 1px rgba(224,160,73,.30),0 4px 12px rgba(0,0,0,.5);
}
.cv-av img{
  width:100%;height:100%;object-fit:cover;display:block;position:relative;z-index:2;
}
.cv-av-ini{
  position:absolute;inset:0;z-index:1;display:flex;align-items:center;justify-content:center;
  font-family:var(--cv-display);font-weight:900;letter-spacing:.02em;
  color:rgba(224,160,73,.62);
}
`;

export const CONCLAVE_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght,SOFT,WONK@9..144,400;9..144,600;9..144,700;9..144,900&family=IM+Fell+English:ital@0;1&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,400&display=swap');

.cv-root{
  --cv-void:#040508;
  --cv-stone:#0e1117;
  --cv-lantern:#e0a049;
  --cv-lantern-hot:#ffdb95;
  --cv-lantern-dim:rgba(224,160,73,.16);
  --cv-vellum:#e8ddc1;
  --cv-vellum-2:#c9ba95;
  --cv-vellum-ink:#241b11;
  --cv-wax:#75121e;
  --cv-wax-hot:#b32633;
  --cv-moon:#8fa6c2;
  --cv-moon-dim:rgba(143,166,194,.5);
  --cv-mute:#6a7484;
  --cv-rule:rgba(224,160,73,.22);
  --cv-display:'Fraunces',Georgia,'Times New Roman',serif;
  --cv-hand:'IM Fell English',Georgia,serif;
  --cv-body:'Cormorant Garamond',Georgia,'Times New Roman',serif;
  color:var(--cv-vellum);
  font-family:var(--cv-body);
  font-size:17px;line-height:1.6;
  -webkit-font-smoothing:antialiased;
  padding-bottom:104px;
  background:#000;
}
.cv-root *{box-sizing:border-box}

/* ── SHELL — never full-screen; 1100px, centred, in the dark of the turret ── */
.cv-shell{
  position:relative;
  max-width:1100px;margin:0 auto;
  background:var(--cv-stone);
  box-shadow:0 0 0 1px rgba(224,160,73,.10),0 0 90px rgba(0,0,0,.9),0 0 200px rgba(0,0,0,.7);
  overflow:visible;
  transition:background 1.6s ease;
}

/* == THE CLIP LIVES HERE, NOT ON THE SHELL ==================================
   'overflow:hidden' on .cv-shell clipped the scenery correctly and, as a side
   effect, made the shell a scroll container -- which kills 'position:sticky'
   for every descendant. The sidebar measured top:-2455 at a page scroll of
   3000: gone by the third beat, which is not a live-updating sidebar.

   So the clip moves onto a layer of its own. The planes inside it are already
   absolutely positioned, so none of them needed the shell's clip.

   IT MUST NOT GET A z-index. With 'z-index:auto' this layer is NOT a stacking
   context, so .cv-grain still paints at 9 (above .cv-body at 5) and the veil's
   'screen' and the vignette's 'multiply' still blend against the shell's own
   background rather than against an isolated, transparent group. Giving this
   rule a z-index changes the picture.                                       */
.cv-scenery{position:absolute;inset:0;overflow:hidden;pointer-events:none}

/* ── PLANES — z-index is how far away it is. Every layer starts at top:46px
   so nothing is drawn over the .rp-nav bar. ───────────────────────────────── */
.cv-veil,.cv-vig,.cv-grain{position:absolute;left:0;right:0;top:46px;bottom:0;pointer-events:none}
.cv-far,.cv-mid,.cv-fore{
  position:absolute;left:0;right:0;top:46px;height:1560px;bottom:auto;
  pointer-events:none;overflow:hidden;
}
.cv-far::after,.cv-mid::after{
  content:'';position:absolute;left:0;right:0;bottom:0;height:420px;
  background:linear-gradient(180deg,transparent,var(--cv-stone));
}
.cv-shell::before{
  content:'';position:absolute;inset:0;z-index:0;pointer-events:none;
  background-image:var(--cv-rock-src);background-size:340px 340px;
  opacity:.16;mix-blend-mode:overlay;
}
.cv-far {z-index:0}
.cv-mid {z-index:1}
.cv-fore{z-index:2}
.cv-veil{z-index:3}
.cv-vig {z-index:4}
.cv-grain{z-index:9}
.cv-body{position:relative;z-index:5}
.cv-far svg,.cv-mid svg,.cv-fore svg{position:absolute;inset:0;width:100%;height:100%}

/* aerial perspective: the cheapest thing that turns flat layers into distance */
.cv-far{filter:blur(2.4px) saturate(.5) brightness(.72);opacity:.55}
.cv-mid{filter:blur(.4px);opacity:.62}

.cv-veil{
  transition:background 1.8s ease,opacity 1.8s ease;
  mix-blend-mode:screen;opacity:.6;
  background:radial-gradient(120% 62% at 50% 2%,var(--cv-lantern-dim) 0%,transparent 62%);
}
.cv-vig{
  background:
    radial-gradient(130% 88% at 50% 34%,transparent 0%,transparent 40%,rgba(2,3,5,.42) 72%,rgba(2,3,5,.86) 100%),
    linear-gradient(180deg,rgba(2,3,5,.7) 0%,transparent 16%,transparent 78%,rgba(2,3,5,.8) 100%);
  mix-blend-mode:multiply;
}
.cv-grain{
  opacity:.14;mix-blend-mode:soft-light;
  background-image:var(--cv-grain-src);
  background-size:220px 220px;
  animation:cv-grainshift 1.1s steps(4) infinite;
}
@keyframes cv-grainshift{
  0%{transform:translate(0,0)} 25%{transform:translate(-6px,4px)}
  50%{transform:translate(4px,-5px)} 75%{transform:translate(-3px,-3px)}
  100%{transform:translate(0,0)}
}

/* ── AMBIENT MOTION ──────────────────────────────────────────────────────── */
.cv-ember{animation:cv-rise linear infinite;transform-origin:center}
@keyframes cv-rise{
  0%{transform:translateY(0) translateX(0) scale(1);opacity:0}
  10%{opacity:.9}
  45%{transform:translateY(-280px) translateX(16px) scale(.8);opacity:.55}
  72%{opacity:.3}
  100%{transform:translateY(-660px) translateX(34px) scale(.4);opacity:0}
}
.cv-mote{animation:cv-float linear infinite}
@keyframes cv-float{
  0%{transform:translate(0,0);opacity:0}
  14%{opacity:.55}
  50%{transform:translate(22px,-90px);opacity:.4}
  86%{opacity:.2}
  100%{transform:translate(-8px,-190px);opacity:0}
}
/* a real flicker curve: irregular stops and a double gutter, not a sine */
.cv-cone{animation:cv-flicker 6.3s linear infinite}
@keyframes cv-flicker{
  0%{opacity:.62}  6%{opacity:.58}  9%{opacity:.72} 13%{opacity:.44}
 15%{opacity:.66} 27%{opacity:.6}  33%{opacity:.78} 36%{opacity:.5}
 38%{opacity:.71} 52%{opacity:.64} 61%{opacity:.4}  63%{opacity:.69}
 74%{opacity:.58} 83%{opacity:.75} 88%{opacity:.47} 94%{opacity:.66}
100%{opacity:.62}
}
.cv-bloom{animation:cv-breathe 6.3s linear infinite;transform-origin:center}
@keyframes cv-breathe{
  0%,100%{opacity:.85;transform:scale(1)}
  13%{opacity:.6;transform:scale(.96)}
  33%{opacity:1;transform:scale(1.06)}
  61%{opacity:.55;transform:scale(.93)}
  83%{opacity:.95;transform:scale(1.03)}
}
.cv-flame{animation:cv-lick 1.5s ease-in-out infinite;transform-origin:50% 92%}
@keyframes cv-lick{
  0%,100%{transform:scale(1,1) skewX(0deg)}
  22%{transform:scale(.9,1.14) skewX(-5deg)}
  47%{transform:scale(1.08,.93) skewX(4deg)}
  71%{transform:scale(.95,1.06) skewX(-2deg)}
}
.cv-draught{animation:cv-drift 26s ease-in-out infinite}
@keyframes cv-drift{0%,100%{transform:translateX(0)}50%{transform:translateX(30px)}}
.cv-sway{animation:cv-swing 11s ease-in-out infinite;transform-origin:50% 0}
@keyframes cv-swing{0%,100%{transform:rotate(-.9deg)}50%{transform:rotate(.9deg)}}

/* ── PHASE ATMOSPHERE — the room changes temperature, not just tint ──────── */
.cv-shell[data-phase="gather"]{background:#0b0e15}
.cv-shell[data-phase="gather"] .cv-veil{background:radial-gradient(110% 56% at 50% 4%,rgba(143,166,194,.2) 0%,transparent 60%);opacity:.75}
.cv-shell[data-phase="gather"] .cv-far{filter:blur(3px) saturate(.4) brightness(.6) hue-rotate(-8deg)}

.cv-shell[data-phase="argue"]{background:#14181f}
.cv-shell[data-phase="argue"] .cv-veil{background:radial-gradient(120% 66% at 50% 8%,rgba(224,160,73,.3) 0%,transparent 66%);opacity:.9}

.cv-shell[data-phase="overrule"]{background:#181016}
.cv-shell[data-phase="overrule"] .cv-veil{background:radial-gradient(130% 72% at 50% 18%,rgba(179,38,51,.34) 0%,transparent 62%);opacity:1}
.cv-shell[data-phase="overrule"] .cv-far{filter:blur(2.4px) saturate(.6) brightness(.62) hue-rotate(-16deg)}

.cv-shell[data-phase="seal"]{background:#140e0d}
.cv-shell[data-phase="seal"] .cv-veil{background:radial-gradient(84% 46% at 50% 28%,rgba(255,219,149,.4) 0%,transparent 58%);opacity:1}
.cv-shell[data-phase="seal"] .cv-vig{background:
  radial-gradient(96% 62% at 50% 32%,transparent 0%,transparent 26%,rgba(2,3,5,.6) 62%,rgba(2,3,5,.94) 100%)}

.cv-shell[data-phase="meanwhile"]{background:#080c12}
.cv-shell[data-phase="meanwhile"] .cv-veil{background:radial-gradient(96% 58% at 74% 40%,rgba(255,219,149,.24) 0%,transparent 55%);opacity:.85}

/* == PORTRAITS: NEUTRAL BY DEFAULT, LIT ONLY IN THE TURRET ==================
   .cv-av is the SHARED portrait and carries no atmosphere: the arched niche,
   a thin frame, the picture, and the initials in the same niche when the file
   is missing (the roster is incomplete, so that is the normal path).

   .cv-av.cv-lit is THE CONCLAVE'S OWN LIGHTING, and nothing else's: rim-light
   from the lantern side, the far side sunk into shadow, the hood shading the
   top third. That is right in a dark room lit by one lamp and wrong in every
   other room this show has. The Round Table, the cold open, house status, the
   mission, recruitment and the endgame are not the turret, and a portrait that
   arrived pre-darkened would look broken on all six.

   Same principle as the vocabulary coming from the registry: the shared thing
   stays neutral, and each screen opts into its own character. A helper that
   bakes in one screen's atmosphere forces every later screen either to fight
   it or to inherit a look that does not fit.                                */
${PORTRAIT_CSS}
/* -- the turret's lamp, and only the turret's -- */
.cv-av.cv-lit{
  box-shadow:
    0 0 0 1px rgba(224,160,73,.30),
    inset 0 -10px 20px rgba(0,0,0,.75),
    inset 3px 0 12px rgba(255,214,150,.10),
    0 6px 16px rgba(0,0,0,.65);
}
.cv-av.cv-lit img{filter:sepia(.32) saturate(.8) contrast(1.14) brightness(.84)}
.cv-av.cv-lit::before{
  content:'';position:absolute;inset:0;z-index:3;pointer-events:none;
  background:linear-gradient(101deg,
    rgba(255,224,168,.5) 0%,
    rgba(255,214,150,.16) 20%,
    rgba(255,214,150,.02) 40%,
    rgba(4,5,9,.42) 74%,
    rgba(4,5,9,.8) 100%);
}
.cv-av.cv-lit::after{
  content:'';position:absolute;inset:0;z-index:4;pointer-events:none;
  background:
    radial-gradient(120% 78% at 50% -14%,rgba(2,3,6,.82) 0%,rgba(2,3,6,.3) 44%,transparent 62%),
    linear-gradient(180deg,transparent 62%,rgba(4,5,9,.55));
}
.cv-av.cv-lit[data-lit="dim"] img{filter:sepia(.4) saturate(.55) contrast(1.1) brightness(.58)}
.cv-av.cv-lit[data-lit="dim"]::before{background:linear-gradient(101deg,rgba(190,205,225,.2) 0%,rgba(4,5,9,.5) 55%,rgba(4,5,9,.86) 100%)}
.cv-av.cv-lit[data-lit="dim"] .cv-av-ini{color:rgba(143,166,194,.45)}
.cv-av.cv-lit[data-lit="hot"] img{filter:sepia(.24) saturate(.95) contrast(1.16) brightness(1.02)}
.cv-av.cv-lit[data-lit="hot"]{box-shadow:0 0 0 1px rgba(255,219,149,.5),0 0 26px rgba(224,160,73,.32),inset 0 -10px 20px rgba(0,0,0,.65)}

/* ═══ THE HERO PLATE — a chapter card, not a page header ═══════════════════ */
.cv-hero{
  position:relative;height:474px;overflow:hidden;
  background:#06080d;
  border-bottom:1px solid rgba(224,160,73,.18);
}
.cv-hero svg.cv-hero-scene{position:absolute;inset:0;width:100%;height:100%}
.cv-hero-lock{position:absolute;left:0;right:0;bottom:0;z-index:6;padding:0 44px 26px;text-align:center}
.cv-eyebrow{
  font-family:var(--cv-display);font-weight:600;font-size:10px;letter-spacing:.46em;
  text-transform:uppercase;color:var(--cv-moon);opacity:.8;
  text-shadow:0 2px 8px rgba(0,0,0,.9);
}
/* THE LOCKUP. Fraunces 900 squeezed 0.80 + 1.3px stroke — the only distorted
   text on the screen. mockup-tr-fonts.html §2.5 is the ladder it came from. */
.cv-title{
  display:inline-block;
  font-family:var(--cv-display);font-weight:900;
  font-size:clamp(42px,7.6vw,92px);line-height:1.02;padding:0 0 .06em;
  letter-spacing:-.02em;
  transform:scaleX(.80);transform-origin:center bottom;
  -webkit-text-stroke:1.3px currentColor;paint-order:stroke fill;
  color:var(--cv-lantern-hot);
  margin:10px 0 0;
  text-shadow:
    0 0 8px rgba(255,231,183,.55),
    0 0 30px rgba(224,160,73,.6),
    0 0 78px rgba(224,160,73,.42),
    0 0 150px rgba(224,160,73,.24),
    0 4px 0 rgba(0,0,0,.55),
    0 10px 30px rgba(0,0,0,.9);
  animation:cv-titleburn 7s ease-in-out infinite;
}
@keyframes cv-titleburn{
  0%,100%{text-shadow:0 0 8px rgba(255,231,183,.55),0 0 30px rgba(224,160,73,.6),0 0 78px rgba(224,160,73,.42),0 0 150px rgba(224,160,73,.24),0 4px 0 rgba(0,0,0,.55),0 10px 30px rgba(0,0,0,.9)}
  34%{text-shadow:0 0 10px rgba(255,231,183,.72),0 0 40px rgba(224,160,73,.8),0 0 100px rgba(224,160,73,.56),0 0 190px rgba(224,160,73,.3),0 4px 0 rgba(0,0,0,.55),0 10px 30px rgba(0,0,0,.9)}
  61%{text-shadow:0 0 6px rgba(255,231,183,.4),0 0 22px rgba(224,160,73,.46),0 0 60px rgba(224,160,73,.3),0 0 120px rgba(224,160,73,.18),0 4px 0 rgba(0,0,0,.55),0 10px 30px rgba(0,0,0,.9)}
}
.cv-title-rule{display:flex;align-items:center;justify-content:center;gap:16px;margin:16px auto 12px;max-width:560px}
.cv-title-rule i{flex:1;height:1px;background:linear-gradient(90deg,transparent,rgba(224,160,73,.55),transparent)}
.cv-sub{
  font-family:var(--cv-hand);font-style:italic;
  font-size:18.5px;line-height:1.5;color:rgba(232,221,193,.8);
  max-width:690px;margin:0 auto;
  text-shadow:0 2px 10px rgba(0,0,0,.95);
}
.cv-head{
  padding:16px 40px;position:relative;
  border-bottom:1px solid var(--cv-rule);
  background:linear-gradient(180deg,rgba(4,5,8,.7),rgba(4,5,8,.25));
  display:flex;gap:14px;align-items:center;flex-wrap:wrap;
}
.cv-observer{
  display:inline-flex;align-items:center;gap:9px;
  padding:7px 14px;border:1px solid var(--cv-rule);
  background:rgba(224,160,73,.05);
  font-family:var(--cv-display);font-weight:700;font-size:10px;letter-spacing:.24em;
  text-transform:uppercase;color:var(--cv-lantern);
}
.cv-observer em{
  font-family:var(--cv-body);font-style:italic;text-transform:none;
  letter-spacing:0;font-size:14px;color:var(--cv-mute);
}

/* ── GRID: stream + sidebar ─────────────────────────────────────────────── */
.cv-grid{display:grid;grid-template-columns:1fr 292px;gap:0;align-items:stretch}
.cv-main{padding:34px 34px 70px;min-width:0}

/* THE RAIL RUNS THE WHOLE COLUMN; THE PANEL INSIDE IT IS WHAT STICKS.
   'position:sticky' on .cv-side itself did nothing, and measurably: the rail
   is as tall as the grid that contains it (3946px of both), so there was no
   range to stick through and it scrolled away like any static box. Sticky
   needs an element SHORTER than its containing block. So the rail keeps the
   border, the panel gradient and the column's full height, and the sticky
   element is the inner panel — which is also the element the reveal handlers
   already replace by id, so its position survives every innerHTML swap.

   (The other half of the same bug was 'overflow:hidden' on .cv-shell, which
   made the shell a scroll container and killed sticky for every descendant.
   Both had to go, and neither alone was enough.) */
.cv-side{
  border-left:1px solid var(--cv-rule);
  background:linear-gradient(180deg,rgba(4,5,8,.86),rgba(4,5,8,.42));
  backdrop-filter:blur(3px);
  padding:26px 20px 44px;min-height:100%;
  box-shadow:inset 22px 0 40px -30px rgba(0,0,0,.9);
}
#cv-sidebar-inner{
  position:sticky;top:56px;
  max-height:calc(100vh - 88px);
  overflow-y:auto;overflow-x:hidden;
  scrollbar-width:thin;scrollbar-color:rgba(224,160,73,.3) transparent;
}

/* ── THE IRONY GUTTER — the screen's signature primitive ────────────────────
   Every beat in the turret carries, in the left margin, the face of whoever
   was downstairs and what they were doing at that minute. The audience reads
   both columns at once; the castle only ever gets the right one. Deliberately
   COLDER and flatter than the turret column: another room, another light. */
.cv-beat{display:grid;grid-template-columns:160px 1fr;gap:0 24px}
.cv-margin{
  position:relative;padding:8px 18px 8px 0;text-align:right;
  border-right:1px dashed rgba(143,166,194,.24);
  filter:saturate(.72);
}
.cv-margin::after{
  content:'';position:absolute;right:-1px;top:0;bottom:0;width:1px;
  background:linear-gradient(180deg,transparent,rgba(143,166,194,.28),transparent);
}
.cv-margin-time{
  font-family:var(--cv-display);font-weight:700;font-size:10px;letter-spacing:.2em;
  color:var(--cv-moon);opacity:.85;display:block;margin-bottom:8px;
}
.cv-margin-txt{
  font-family:var(--cv-hand);font-style:italic;
  font-size:13.5px;line-height:1.5;color:var(--cv-moon-dim);display:block;
}
.cv-margin-ic{position:absolute;right:-11px;top:1px;opacity:.7;background:var(--cv-stone);padding:2px 0;line-height:0;border-radius:50%}
.cv-margin-av{margin-bottom:9px}
/* A minute with no castle scene of its own. The rule and the ::after glow carry
   on down the page so the column never breaks; the cell is simply empty,
   because the alternative is printing the same downstairs line twice and a
   repeat reads as a bug where a gap reads as a quiet castle. */
.cv-margin-quiet{min-height:34px}

/* ── THE HOST LAYER ─────────────────────────────────────────────────────────
   She narrates OVER the footage, so her band breaks out of the card column
   and spans the gutter too — a different layer of the picture, letterboxed
   top and bottom. She is not a caption, and she is not the subject. */
.cv-host{
  grid-column:1/-1;position:relative;overflow:hidden;
  display:grid;grid-template-columns:auto 1fr;gap:20px;align-items:center;
  padding:17px 26px;margin-bottom:18px;
  background:linear-gradient(100deg,rgba(4,5,8,.96),rgba(44,30,15,.82) 52%,rgba(4,5,8,.96));
  border-top:1px solid rgba(224,160,73,.45);
  border-bottom:1px solid rgba(224,160,73,.45);
  box-shadow:inset 0 0 40px -8px rgba(224,160,73,.22),0 14px 34px rgba(0,0,0,.5);
}
.cv-host::before{
  content:'';position:absolute;inset:0;pointer-events:none;
  background:linear-gradient(105deg,transparent 30%,rgba(255,219,149,.14) 50%,transparent 70%);
  animation:cv-sweep 9s ease-in-out infinite alternate;
}
.cv-host::after{
  content:'';position:absolute;left:0;right:0;top:0;bottom:0;pointer-events:none;
  border-top:3px solid rgba(2,3,5,.85);border-bottom:3px solid rgba(2,3,5,.85);
}
@keyframes cv-sweep{0%{transform:translateX(-60%)}100%{transform:translateX(60%)}}
.cv-host .cv-av.cv-lit{box-shadow:0 0 0 1px rgba(224,160,73,.65),0 0 24px rgba(224,160,73,.22),inset 0 -8px 18px rgba(0,0,0,.6)}
.cv-host-name{
  font-family:var(--cv-display);font-weight:700;font-size:10px;letter-spacing:.32em;
  text-transform:uppercase;color:var(--cv-lantern);margin-bottom:7px;
  display:flex;align-items:center;gap:8px;
}
.cv-host-line{
  font-family:var(--cv-hand);font-style:italic;
  font-size:20px;line-height:1.5;color:rgba(255,228,176,.95);
  text-shadow:0 1px 12px rgba(224,160,73,.22);
}

/* ── CARDS — a slab of lit stone standing in the room ───────────────────── */
.cv-card{
  position:relative;padding:24px 28px;
  border:1px solid rgba(224,160,73,.14);
  background:
    linear-gradient(178deg,rgba(255,219,149,.05),transparent 18%),
    linear-gradient(160deg,rgba(32,38,49,.95),rgba(10,13,19,.96));
  box-shadow:
    0 26px 54px rgba(0,0,0,.62),
    0 4px 10px rgba(0,0,0,.5),
    inset 0 1px 0 rgba(255,224,168,.14),
    inset 0 -1px 0 rgba(0,0,0,.7);
}
.cv-card::before{
  content:'';position:absolute;inset:0;pointer-events:none;z-index:0;
  background-image:var(--cv-rock-src);background-size:300px 300px;
  opacity:.14;mix-blend-mode:overlay;
}
.cv-card>*{position:relative;z-index:1}
.cv-card-label{
  font-family:var(--cv-display);font-weight:700;font-size:10px;letter-spacing:.3em;
  text-transform:uppercase;color:var(--cv-lantern);opacity:.88;margin-bottom:11px;
  display:flex;align-items:center;gap:9px;
}
.cv-card-title{
  font-family:var(--cv-display);font-weight:900;font-size:25px;
  letter-spacing:-.005em;color:var(--cv-vellum);margin:0 0 12px;
  text-shadow:0 2px 14px rgba(0,0,0,.7);
}
.cv-card p{margin:0 0 13px;color:rgba(232,221,193,.86)}
.cv-card p:last-child{margin-bottom:0}
.cv-said{
  display:grid;grid-template-columns:auto 1fr;gap:17px;align-items:start;
  border-left:2px solid var(--cv-lantern);padding:6px 0 6px 19px;margin:16px 0;
  box-shadow:-14px 0 26px -18px rgba(224,160,73,.7);
}
.cv-said-txt{font-family:var(--cv-hand);font-size:19.5px;line-height:1.55;color:var(--cv-vellum)}
.cv-said cite{
  display:block;margin-top:9px;font-style:normal;
  font-family:var(--cv-display);font-weight:700;font-size:10px;letter-spacing:.28em;
  text-transform:uppercase;color:var(--cv-mute);
}

/* the arriving cloaks — a portrait inside each hood */
.cv-cloaks{display:flex;gap:20px;justify-content:center;padding:22px 0 8px;flex-wrap:wrap}
.cv-cloak{width:138px;text-align:center}
.cv-cloak-fig{position:relative;display:inline-block;filter:drop-shadow(0 12px 22px rgba(0,0,0,.85))}
.cv-cloak-face{position:absolute;left:26px;top:11px}
.cv-cloak-name{
  font-family:var(--cv-display);font-weight:900;font-size:14px;letter-spacing:.06em;
  color:var(--cv-vellum);margin-top:10px;
}
.cv-cloak-note{
  font-family:var(--cv-hand);font-style:italic;
  font-size:13px;color:var(--cv-mute);line-height:1.4;margin-top:4px;
}
.cv-cloak[data-state="nervy"] .cv-cloak-fig{animation:cv-shiver 6s ease-in-out infinite}
@keyframes cv-shiver{
  0%,88%,100%{transform:translateX(0)}
  91%{transform:translateX(-1.5px)} 94%{transform:translateX(1.5px)} 97%{transform:translateX(-1px)}
}

/* ── VELLUM — real paper: fibre, a torn deckle edge on the BACKING layer only
   so the type stays sharp, and a warm sheen where the lantern crosses it ── */
.cv-slip{
  position:relative;margin:18px 0 6px;padding:22px 26px 24px;
  color:var(--cv-vellum-ink);
  filter:drop-shadow(0 16px 26px rgba(0,0,0,.7));
}
.cv-slip::before{
  content:'';position:absolute;inset:0;z-index:0;
  background:
    linear-gradient(176deg,rgba(255,255,255,.14),transparent 32%),
    radial-gradient(120% 90% at 18% 0%,rgba(255,240,205,.6),transparent 58%),
    linear-gradient(160deg,var(--cv-vellum) 0%,var(--cv-vellum-2) 100%);
  filter:url(#cvDeckle);
}
.cv-slip::after{
  content:'';position:absolute;inset:0;z-index:1;pointer-events:none;
  background-image:var(--cv-fibre-src);background-size:180px 180px;
  opacity:.55;mix-blend-mode:multiply;
}
.cv-slip>*{position:relative;z-index:2}
.cv-slip-head{
  display:grid;grid-template-columns:auto 1fr auto;gap:15px;align-items:center;
  border-bottom:1px solid rgba(36,27,17,.3);padding-bottom:11px;margin-bottom:13px;
}
.cv-slip-target{
  font-family:var(--cv-display);font-weight:900;font-size:29px;
  letter-spacing:-.01em;color:var(--cv-vellum-ink);
}
.cv-slip-by{
  font-family:var(--cv-display);font-weight:700;font-size:10px;letter-spacing:.22em;
  text-transform:uppercase;color:rgba(36,27,17,.6);white-space:nowrap;
  display:flex;align-items:center;gap:9px;
}
.cv-slip .cv-av.cv-lit{box-shadow:0 0 0 1px rgba(36,27,17,.42),inset 0 -6px 14px rgba(0,0,0,.4),0 3px 8px rgba(36,27,17,.3)}
.cv-slip .cv-av.cv-lit::before{background:linear-gradient(101deg,rgba(255,236,196,.4) 0%,rgba(36,27,17,.28) 68%,rgba(36,27,17,.6) 100%)}
.cv-slip-reason{font-family:var(--cv-hand);font-size:18.5px;line-height:1.55;color:rgba(36,27,17,.94)}
/* what they did NOT say — the audience's privilege, in red ink */
.cv-unsaid{
  margin-top:15px;padding-top:12px;border-top:1px dashed rgba(117,18,30,.42);
  font-family:var(--cv-hand);font-style:italic;
  font-size:15.5px;line-height:1.5;color:var(--cv-wax);
}
.cv-unsaid b{
  display:block;font-family:var(--cv-display);font-style:normal;
  font-weight:700;font-size:9px;letter-spacing:.3em;text-transform:uppercase;
  color:rgba(117,18,30,.68);margin-bottom:5px;
}
/* the struck slip — the losing argument stays visible, crossed out */
.cv-slip[data-struck="1"]{
  filter:saturate(.5) brightness(.82) drop-shadow(0 10px 18px rgba(0,0,0,.7));
  transform:rotate(-1.4deg) translateY(6px);
}
.cv-strike{position:absolute;inset:0;pointer-events:none;z-index:3}
.cv-strike line{stroke:var(--cv-wax-hot);stroke-width:4;stroke-linecap:round;
  stroke-dasharray:1200;stroke-dashoffset:1200;animation:cv-draw .8s ease-out .25s forwards}
@keyframes cv-draw{to{stroke-dashoffset:0}}
.cv-overruled-stamp{
  position:absolute;right:22px;bottom:14px;z-index:4;
  font-family:var(--cv-display);font-weight:900;font-size:16px;
  letter-spacing:.28em;color:rgba(179,38,51,.88);
  border:2.5px solid rgba(179,38,51,.6);padding:3px 11px;transform:rotate(-6deg);
  text-shadow:0 1px 0 rgba(255,255,255,.25);
}

/* the ledger of the argument */
.cv-tally{display:grid;gap:9px;margin-top:18px}
.cv-tally-row{
  display:grid;grid-template-columns:32px 1fr auto;gap:13px;align-items:center;
  padding:10px 13px;border:1px solid rgba(224,160,73,.13);
  background:linear-gradient(160deg,rgba(9,12,18,.75),rgba(4,5,8,.6));
  box-shadow:inset 0 1px 0 rgba(255,224,168,.06);
}
.cv-tally-name{font-family:var(--cv-display);font-weight:700;font-size:14px;letter-spacing:.01em}
.cv-tally-state{
  font-family:var(--cv-display);font-weight:700;font-size:9.5px;letter-spacing:.2em;
  text-transform:uppercase;
}
.cv-st-chosen{color:#e2515f;text-shadow:0 0 14px rgba(179,38,51,.5)}
.cv-st-struck{color:var(--cv-mute);text-decoration:line-through}
.cv-st-open{color:var(--cv-lantern);opacity:.85}

/* ── WHAT IT COST — prose, never a stat readout ─────────────────────────────
   The engine moves bonds and grudges here; the screen says what that means in
   words. "Bowie & Chef -2" is a number. This is a consequence. */
.cv-ledger{
  margin-top:20px;padding:15px 0 3px 19px;border-left:2px solid rgba(179,38,51,.6);
  box-shadow:-14px 0 26px -18px rgba(179,38,51,.8);
}
.cv-ledger-h{
  display:block;font-family:var(--cv-display);font-weight:700;font-size:9.5px;letter-spacing:.3em;
  text-transform:uppercase;color:rgba(226,120,130,.9);margin-bottom:9px;
}
.cv-ledger p{font-family:var(--cv-hand);font-size:16.5px;line-height:1.55;color:rgba(232,221,193,.8);margin:0 0 10px}
.cv-ledger p:last-child{margin-bottom:0}

/* ── THE LETTER AND THE SEAL ────────────────────────────────────────────── */
.cv-letter{position:relative;margin:10px auto 0;max-width:470px;text-align:center}
.cv-letter-sheet{
  position:relative;padding:30px 30px 66px;
  color:var(--cv-vellum-ink);
  filter:drop-shadow(0 30px 54px rgba(0,0,0,.85));
}
.cv-letter-sheet::before{
  content:'';position:absolute;inset:0;z-index:0;
  background:
    linear-gradient(176deg,rgba(255,255,255,.16),transparent 26%),
    radial-gradient(110% 80% at 22% 4%,rgba(255,243,212,.72),transparent 60%),
    linear-gradient(158deg,var(--cv-vellum),var(--cv-vellum-2));
  filter:url(#cvDeckle);
}
.cv-letter-sheet::after{
  content:'';position:absolute;inset:0;z-index:1;pointer-events:none;
  background-image:var(--cv-fibre-src);background-size:180px 180px;
  opacity:.5;mix-blend-mode:multiply;
}
.cv-letter-sheet>*{position:relative;z-index:2}
.cv-letter-sheet .cv-av.cv-lit{box-shadow:0 0 0 1px rgba(36,27,17,.48),inset 0 -10px 20px rgba(0,0,0,.45),0 6px 14px rgba(36,27,17,.35)}
.cv-letter-sheet .cv-av.cv-lit::before{background:linear-gradient(101deg,rgba(255,238,200,.42) 0%,rgba(36,27,17,.3) 66%,rgba(36,27,17,.62) 100%)}
.cv-letter-hand{font-family:var(--cv-hand);font-size:20px;line-height:1.7}
.cv-letter-name{font-family:var(--cv-display);font-weight:900;font-size:40px;letter-spacing:-.015em;margin:10px 0 4px}
.cv-seal-slot{
  position:absolute;left:50%;bottom:-46px;transform:translateX(-50%);
  filter:drop-shadow(0 10px 16px rgba(0,0,0,.85));z-index:5;
}
.cv-seal-slot svg{animation:cv-press .78s cubic-bezier(.18,1.7,.36,1) both}
@keyframes cv-press{
  0%{transform:scale(3.1) translateY(-40px);opacity:0;filter:blur(7px)}
  55%{transform:scale(.9) translateY(3px);opacity:1;filter:blur(0)}
  74%{transform:scale(1.05) translateY(-2px)}
  100%{transform:scale(1) translateY(0);opacity:1}
}
.cv-shock{
  position:absolute;left:50%;bottom:-46px;width:120px;height:120px;
  transform:translate(-50%,0);border-radius:50%;pointer-events:none;z-index:4;
  border:2px solid rgba(255,219,149,.6);
  animation:cv-shock .9s cubic-bezier(.1,.7,.3,1) .45s both;
}
@keyframes cv-shock{
  0%{transform:translate(-50%,0) scale(.35);opacity:0}
  22%{opacity:.85}
  100%{transform:translate(-50%,0) scale(3.4);opacity:0}
}
.cv-shake{animation:cv-shake .5s cubic-bezier(.36,.07,.19,.97)}
@keyframes cv-shake{
  0%,100%{transform:translate(0,0)}
  14%{transform:translate(-9px,2px)} 28%{transform:translate(8px,-3px)}
  43%{transform:translate(-6px,2px)} 57%{transform:translate(5px,-1px)}
  72%{transform:translate(-3px,1px)} 86%{transform:translate(2px,0)}
}

/* the irony beat — a warm room seen from a cold corridor, through a doorway */
.cv-meanwhile{position:relative;padding:0;border:none;background:none;box-shadow:none}
.cv-meanwhile-frame{
  position:relative;overflow:hidden;
  border:1px solid rgba(255,219,149,.3);
  background:
    radial-gradient(46% 40% at 16% 88%,rgba(255,148,60,.34),transparent 70%),
    radial-gradient(76% 92% at 50% 68%,rgba(255,206,132,.34),transparent 66%),
    radial-gradient(130% 130% at 50% 46%,rgba(46,32,18,.6),rgba(5,7,11,.99) 74%);
  padding:44px 40px 34px;text-align:center;
  box-shadow:inset 0 0 110px rgba(0,0,0,.85),0 30px 60px rgba(0,0,0,.7);
  animation:cv-hearth 7.4s ease-in-out infinite;
}
.cv-meanwhile-frame::before{
  content:'';position:absolute;inset:0;pointer-events:none;z-index:3;
  background:radial-gradient(64% 82% at 50% 62%,transparent 54%,rgba(3,4,7,.34) 84%,rgba(3,4,7,.72) 100%);
}
.cv-meanwhile-door{position:absolute;inset:0;z-index:0;pointer-events:none}
.cv-meanwhile-door svg{width:100%;height:100%;display:block}
@keyframes cv-hearth{
  0%,100%{filter:brightness(1)}
  23%{filter:brightness(1.07)}
  46%{filter:brightness(.95)}
  71%{filter:brightness(1.04)}
}
.cv-meanwhile-frame>*{position:relative;z-index:1}
.cv-pair{display:flex;gap:22px;align-items:center;justify-content:center;margin-bottom:4px}
.cv-pair-nm{
  font-family:var(--cv-display);font-weight:700;font-size:10px;letter-spacing:.24em;
  text-transform:uppercase;color:rgba(255,219,149,.72);margin-top:9px;
}
.cv-meanwhile-txt{
  font-family:var(--cv-hand);font-size:20.5px;line-height:1.6;
  color:rgba(255,224,170,.92);max-width:560px;margin:18px auto 0;
  text-shadow:0 2px 18px rgba(0,0,0,.8);
}
.cv-meanwhile-cold{
  font-family:var(--cv-display);font-weight:700;font-size:10.5px;letter-spacing:.3em;
  text-transform:uppercase;color:var(--cv-moon);margin-top:26px;opacity:.8;
}

/* ── STATE CHIPS — only for state, never for a number ───────────────────── */
.cv-cost{display:flex;gap:12px;flex-wrap:wrap;margin-top:18px;padding-top:15px;border-top:1px solid rgba(224,160,73,.14)}
.cv-chip{
  display:inline-flex;align-items:center;gap:8px;padding:6px 13px;
  border:1px solid rgba(224,160,73,.26);
  background:linear-gradient(170deg,rgba(224,160,73,.12),rgba(224,160,73,.03));
  font-family:var(--cv-display);font-weight:700;font-size:10px;letter-spacing:.14em;
  text-transform:uppercase;color:var(--cv-lantern);
  box-shadow:inset 0 1px 0 rgba(255,224,168,.16);
}
.cv-chip[data-tone="bad"]{border-color:rgba(179,38,51,.45);background:linear-gradient(170deg,rgba(179,38,51,.18),rgba(179,38,51,.04));color:#e2707a}
.cv-chip[data-tone="cold"]{border-color:rgba(143,166,194,.32);background:linear-gradient(170deg,rgba(143,166,194,.12),rgba(143,166,194,.03));color:var(--cv-moon)}

/* ── SIDEBAR ────────────────────────────────────────────────────────────── */
.cv-side-h{
  font-family:var(--cv-display);font-weight:700;font-size:10px;letter-spacing:.3em;
  text-transform:uppercase;color:var(--cv-lantern);opacity:.88;
  padding-bottom:9px;margin-bottom:15px;border-bottom:1px solid var(--cv-rule);
  display:flex;align-items:center;gap:8px;
}
.cv-side-block{margin-bottom:28px}
.cv-side-row{
  display:grid;grid-template-columns:32px 1fr auto;gap:11px;align-items:center;
  padding:8px 0;border-bottom:1px solid rgba(224,160,73,.07);
}
.cv-side-name{font-family:var(--cv-display);font-weight:700;font-size:12.5px;letter-spacing:.01em}
.cv-side-note{
  font-family:var(--cv-hand);font-style:italic;
  font-size:12px;color:var(--cv-mute);line-height:1.35;grid-column:2/4;margin-top:-3px;
}
.cv-side-tag{font-family:var(--cv-display);font-weight:700;font-size:9px;letter-spacing:.14em;text-transform:uppercase;color:var(--cv-mute)}
.cv-side-pend{font-family:var(--cv-hand);font-style:italic;font-size:13px;color:rgba(106,116,132,.78);padding:7px 0}
.cv-side-host{display:grid;grid-template-columns:auto 1fr;gap:12px;align-items:center;padding:5px 0}
.cv-side-host-nm{font-family:var(--cv-display);font-weight:700;font-size:12px;letter-spacing:.02em;color:var(--cv-vellum)}
.cv-side-host-rl{font-family:var(--cv-hand);font-style:italic;font-size:12px;color:var(--cv-mute);line-height:1.35}
.cv-side-state{
  font-family:var(--cv-display);font-weight:600;font-size:11px;letter-spacing:.22em;
  color:var(--cv-vellum);padding:4px 0 12px;
}
.cv-pot{
  font-family:var(--cv-display);font-weight:900;font-size:33px;letter-spacing:-.02em;
  color:var(--cv-lantern-hot);text-align:center;padding:6px 0 3px;
  text-shadow:0 0 26px rgba(224,160,73,.5),0 2px 0 rgba(0,0,0,.6);
}
.cv-pot-sub{font-family:var(--cv-hand);font-style:italic;font-size:12.5px;color:var(--cv-mute);text-align:center;line-height:1.45}
.cv-side-seal{text-align:center;padding:12px 0 4px}
.cv-side-seal-cap{
  font-family:var(--cv-display);font-weight:700;font-size:9.5px;letter-spacing:.24em;
  text-transform:uppercase;color:var(--cv-mute);margin-top:9px;
}
.cv-side-target{display:grid;grid-template-columns:auto 1fr;gap:13px;align-items:center;margin-top:11px}

/* ── REVEAL MACHINERY ───────────────────────────────────────────────────── */
.cv-beat{opacity:0;pointer-events:none;height:0;overflow:hidden;margin:0}
.cv-beat.cv-vis{opacity:1;pointer-events:auto;height:auto;overflow:visible;margin-bottom:30px}
.cv-beat.cv-vis .cv-card,
.cv-beat.cv-vis .cv-meanwhile{animation-duration:.9s;animation-fill-mode:both;animation-timing-function:cubic-bezier(.16,.9,.28,1)}
/* CARD PHYSICS — cards MOVE differently per phase, and they have mass */
.cv-beat.cv-vis[data-phase="gather"]    .cv-card{animation-name:cv-emerge}
.cv-beat.cv-vis[data-phase="argue"]     .cv-card{animation-name:cv-lay}
.cv-beat.cv-vis[data-phase="overrule"]  .cv-card{animation-name:cv-jolt}
.cv-beat.cv-vis[data-phase="seal"]      .cv-card{animation-name:cv-slam}
.cv-beat.cv-vis[data-phase="meanwhile"] .cv-meanwhile{animation-name:cv-farfade;animation-duration:1.7s}
.cv-beat.cv-vis .cv-margin{animation:cv-margin-in 1.2s ease .3s both}
.cv-beat.cv-vis .cv-host{animation:cv-host-in 1s ease both}
@keyframes cv-emerge{
  from{opacity:0;transform:translateY(22px) scale(.99);filter:blur(9px) brightness(.4)}
  to{opacity:1;transform:none;filter:blur(0) brightness(1)}
}
@keyframes cv-lay{
  0%{opacity:0;transform:translateY(-34px) rotate(2.2deg)}
  62%{opacity:1;transform:translateY(5px) rotate(-.5deg)}
  82%{transform:translateY(-2px) rotate(.2deg)}
  100%{opacity:1;transform:none}
}
@keyframes cv-jolt{
  0%{opacity:0;transform:translateX(-20px) skewX(2deg)}
  26%{opacity:1;transform:translateX(12px) skewX(-1.5deg)}
  48%{transform:translateX(-7px) skewX(.8deg)}
  70%{transform:translateX(3px)}
  100%{transform:none}
}
@keyframes cv-slam{
  0%{opacity:0;transform:translateY(-58px) scale(1.05);filter:brightness(1.5)}
  66%{opacity:1;transform:translateY(7px) scale(.994);filter:brightness(1)}
  84%{transform:translateY(-3px)}
  100%{transform:none}
}
@keyframes cv-farfade{from{opacity:0;transform:scale(1.06);filter:blur(7px)}to{opacity:1;transform:scale(1);filter:blur(0)}}
@keyframes cv-margin-in{from{opacity:0;transform:translateX(-12px)}to{opacity:1;transform:none}}
@keyframes cv-host-in{from{opacity:0}to{opacity:1}}

/* ── STICKY CONTROLS ────────────────────────────────────────────────────── */
.cv-controls{
  position:fixed;left:0;right:0;bottom:0;z-index:40;
  background:linear-gradient(180deg,rgba(4,5,8,.1),rgba(4,5,8,.98) 44%);
  border-top:1px solid var(--cv-rule);
  padding:17px 20px;display:flex;gap:15px;justify-content:center;align-items:center;
  backdrop-filter:blur(7px);
}
.cv-btn{
  font-family:var(--cv-display);font-weight:700;font-size:11px;letter-spacing:.22em;
  text-transform:uppercase;cursor:pointer;
  background:linear-gradient(170deg,rgba(224,160,73,.16),rgba(224,160,73,.04));
  color:var(--cv-lantern);
  border:1px solid rgba(224,160,73,.42);padding:12px 26px;
  transition:background .25s,color .25s,border-color .25s,opacity .25s,box-shadow .25s;
  display:inline-flex;align-items:center;gap:10px;
  box-shadow:inset 0 1px 0 rgba(255,224,168,.18);
}
.cv-btn:hover{background:rgba(224,160,73,.26);color:var(--cv-lantern-hot);box-shadow:0 0 26px rgba(224,160,73,.3),inset 0 1px 0 rgba(255,224,168,.3)}
.cv-btn[disabled],.cv-btn.cv-dim{opacity:.3;cursor:default;pointer-events:none}
.cv-counter{
  font-family:var(--cv-display);font-weight:700;font-size:11px;letter-spacing:.26em;
  color:var(--cv-mute);min-width:86px;text-align:center;
}

.cv-ic{display:inline-block;vertical-align:middle;flex:none}

/* ── THE SEALED DOOR — what an observer who was not up there is shown ─────
   Its own layout, not the turret's with the names taken out. See the header
   of js/vp-tr/conclave.js for why that distinction is load-bearing. */
.cv-shut{
  max-width:620px;margin:0 auto;padding:64px 34px 90px;text-align:center;
}
.cv-shut-door{margin:0 auto 30px;filter:drop-shadow(0 20px 40px rgba(0,0,0,.9))}
.cv-shut-h{
  font-family:var(--cv-display);font-weight:900;font-size:34px;letter-spacing:-.01em;
  color:var(--cv-vellum);margin:0 0 16px;text-shadow:0 3px 20px rgba(0,0,0,.8);
}
.cv-shut-p{font-family:var(--cv-hand);font-size:19px;line-height:1.65;color:rgba(232,221,193,.74);margin:0 auto 14px;max-width:520px}
.cv-shut-cold{
  font-family:var(--cv-display);font-weight:700;font-size:10px;letter-spacing:.3em;
  text-transform:uppercase;color:var(--cv-moon);margin-top:34px;opacity:.75;
}

/* ── RESPONSIVE ─────────────────────────────────────────────────────────── */
@media(max-width:900px){
  .cv-grid{grid-template-columns:1fr}
  .cv-side{border-left:none;border-top:1px solid var(--cv-rule)}
  #cv-sidebar-inner{position:static;max-height:none;overflow:visible}
  .cv-hero{height:392px}
}
@media(max-width:700px){
  .cv-beat,.cv-beat.cv-vis{grid-template-columns:1fr}
  .cv-margin{text-align:left;border-right:none;border-left:1px dashed rgba(143,166,194,.24);padding:6px 0 6px 16px;margin-bottom:12px}
  .cv-margin::after{display:none}
  .cv-margin-ic{right:auto;left:-11px}
  .cv-main{padding:24px 18px 56px}
  .cv-head{padding:14px 20px}
  .cv-hero{height:324px}
  .cv-hero-lock{padding:0 20px 22px}
  .cv-host{grid-template-columns:1fr;gap:10px}
}

/* ── REDUCED MOTION — every animation off ───────────────────────────────── */
@media(prefers-reduced-motion:reduce){
  .cv-root *,.cv-root *::before,.cv-root *::after{animation:none!important;transition:none!important}
  .cv-strike line{stroke-dashoffset:0}
  .cv-shock{display:none}
  .cv-beat.cv-vis .cv-card,.cv-beat.cv-vis .cv-meanwhile,
  .cv-beat.cv-vis .cv-margin,.cv-beat.cv-vis .cv-host{opacity:1;transform:none;filter:none}
}
`;
