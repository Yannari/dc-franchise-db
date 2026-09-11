// ══════════════════════════════════════════════════════════════════════
// vp-dr/challenge.js — the mini, the brief, the draft, prep, and the maxi
// ══════════════════════════════════════════════════════════════════════
//
// The prose is already written (js/dr/data/challenge-beats.js,
// maxi-events.js, maxi-performance.js) and the engine has already decided
// everything. These screens RENDER; they do not compute. A screen that
// called a simulation function would show tonight's answer on a replay of
// episode four.
//
// ── ONE PANEL PER CHALLENGE TYPE, BECAUSE THE DATA IS DIFFERENT ───────
//
// Every maxi writes its own `detail` block per queen, and they share almost
// nothing:
//
//   snatch-game  { character, rounds[6] }        six answers, one per round
//   ball         { theme, looks[{label,sewn}] }  three walks, one sewn
//   roast        { slot, slotKind, bits[], roomTemp, duds }
//   makeover     { partner, resemblance, ownLook, partnerLook }
//   improv       { premise, froze }
//   acting       { script, part, dropped, needs }
//   girl-group   { verse, teamWon, teamMean }     and music-video, rusical
//
// A generic score card over all of that would throw away everything that
// makes a Snatch Game a Snatch Game. So the dispatch is on
// `row.dr.challenge.id`, and anything unrecognised falls to the generic
// card rather than to a blank — a new challenge type is playable the day
// it is written, and looks plain until somebody gives it a panel.
//
// ── AND THE BRIEF IS DRAWN IN FULL ────────────────────────────────────
//
// `desc` from the catalogue is the ONLY place the viewer is told what the
// queens are physically doing. The narration says what happened, not what
// the rules were, so a truncated desc leaves a result nobody can follow.
// That is a project rule with its own test on the Big Brother side.
import { _shell, _portrait, _icon, _note, _judgePortrait } from './style.js';
import { _controls, _seedRail, _state, _reapplyVisibility } from './reveal.js';
import { JUDGES } from '../dr/data/judges.js';
import { maxiById } from '../dr/data/challenges.js';
import { sceneCard, WERK_CSS } from './werk.js';
import { characterById } from '../dr/data/snatch-characters.js';
import { rpBuildTournament } from './smackdown.js';

const esc = v => String(v ?? '').replace(/[&<>"]/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const n1 = v => (Number.isFinite(Number(v)) ? Number(v).toFixed(1) : '—');
const epOf = row => ({ num: row?.num ?? row?.dr?.ep ?? 0, format: 'drag-race', dr: row?.dr || {} });

export /* THE TRACK AND WHAT IT SOUNDS LIKE. The girl group's theme reached the row
   and no screen read it — the group names rendered, the song they were
   recording did not, which is the same "computed and drawn nowhere" shape as
   everything else this build has turned up. Drawn on the brief, where the
   queens are actually told what they are making. */
function _trackLine(row) {
  const d = _sceneData(row, 'group-parts') || row?.dr?.assignment?.theme;
  if (!d?.track) return '';
  /* NO "X vs Y" LINE ANY MORE. The team board under this now names both
     groups and lists who is in them, and printing the same two names again
     one line above it was the only thing the brief said about the split. */
  return `<p class="dr-track"><b class="dr-disp">&ldquo;${esc(d.track)}&rdquo;</b>`
    + `${d.sound ? ` &mdash; ${esc(d.sound)}` : ''}</p>`;
}

/** One scene's data off the row, by kind. */
function _sceneData(ep, kind) {
  return (ep?.dr?.scenes || []).find(sc => sc.kind === kind)?.data || null;
}

const CHAL_CSS = `
/* THE NARRATION SPANS THE ROW. These paragraphs are injected into the
   performance card just before its closing tags, which puts them inside
   .dr-row — a three-column grid of bust / detail / score. Each paragraph
   therefore landed in the next free CELL, so a queen's performance was
   rendered eighty pixels wide, one word per line, down the score column.
   1/-1 puts them back across the whole card. */
/* ══ THE SIX ROOMS ══ ambient, behind the cards, drawn in CSS ══
   Each is a fixed layer so it does not scroll with the prose — the room
   stays still and the night moves through it. All of them are cheap: a
   gradient, a repeat, and at most one slow animation. */
/* NAMED dr-set, NOT dr-room: js/vp-dr/werk.js already uses .dr-room for its
   content wrapper, and two files defining the same class differently is a
   collision waiting for the day a screen pulls in both stylesheets.
   (No backticks in here. This comment is inside a template literal and a
   backtick ends it — the fourth time in this build.)

   THE SET IS THE SCREEN, NOT THE WINDOW. Fixed to the viewport, the
   theatre's left curtain sat underneath the navigation sidebar and its
   footlights ran along the bottom of the browser rather than the bottom of
   the stage — the set was in the wrong building. Absolute inside the
   content column makes the edges of the room the edges of the screen the
   reader is actually looking at, and the walls then run the full length of
   the night rather than one screenful of it. */
.dr-fam{position:relative;z-index:1}
/* THESE WERE TOO FAINT TO READ AND THAT WAS THE BUG. Calibrated as ambient
   wash — a 10% gradient behind a card that is already a gradient — they were
   invisible at a glance, which for a set is the same as not existing. The
   opacities below are two to three times what they were, and each room now
   owns its BACKDROP rather than tinting somebody else's: the panel behind
   the cards is darkened so the room around it can be seen at all. */
.dr-set{position:absolute;inset:-24px -18px;z-index:-1;pointer-events:none;
  overflow:hidden;border-radius:2px}
/* The cards sit on the room, not in front of a wash of it. */
.dr-fam .dr-panel{background:rgba(10,3,8,.78);backdrop-filter:blur(2px)}
.dr-set i{position:absolute;display:block}

/* A TELEVISION STUDIO: the tally light and the scan of a monitor.
   THE TALLY SAT AT 50% AND LANDED ON THE EPISODE HEADER — a red dot in the
   middle of the title, which reads as a fault rather than a camera. It goes
   in the corner where a tally actually is. */
.dr-set-studio{background:
  radial-gradient(120% 70% at 50% 0%,rgba(56,189,248,.42),transparent 62%),
  radial-gradient(90% 60% at 50% 110%,rgba(56,189,248,.22),transparent 70%),
  linear-gradient(180deg,#04121c,#02060c)}
.dr-set-studio::after{content:"";position:absolute;inset:0;
  box-shadow:inset 0 0 190px 60px rgba(0,0,0,.6)}
.dr-tally{top:16px;right:20px;width:10px;height:10px;border-radius:50%;background:#FF294B;
  box-shadow:0 0 26px 7px rgba(255,41,75,.7);animation:drTally 3.4s ease-in-out infinite}
@keyframes drTally{0%,88%,100%{opacity:1}92%{opacity:.2}}
.dr-scan{inset:0;background:repeating-linear-gradient(180deg,
  rgba(255,255,255,.11) 0 1px,transparent 1px 4px)}

/* A THEATRE: two curtains and a row of footlights. */
.dr-set-stage{background:radial-gradient(120% 80% at 50% 100%,rgba(255,200,61,.34),transparent 65%),
  linear-gradient(180deg,#160209,#0a0105)}
.dr-set-stage::after{content:"";position:absolute;inset:0;
  box-shadow:inset 0 0 200px 70px rgba(0,0,0,.62)}
.dr-curtain{top:0;bottom:0;width:15%;opacity:1;
  background:repeating-linear-gradient(90deg,#7a0a28 0 14px,#3c0414 14px 28px);
  box-shadow:inset 0 0 60px rgba(0,0,0,.7)}
.dr-curtain.dr-l{left:0}.dr-curtain.dr-r{right:0;transform:scaleX(-1)}
.dr-foots{left:15%;right:15%;bottom:0;height:90px;
  background:repeating-linear-gradient(90deg,rgba(255,233,168,.55) 0 7px,transparent 7px 34px);
  filter:blur(7px)}

/* A COMEDY CLUB: brick, and one hard spot on the mic. */
.dr-set-club{background:linear-gradient(180deg,#0d0709,#050203)}
.dr-brick{inset:0;opacity:1;
  background:repeating-linear-gradient(0deg,rgba(255,255,255,.075) 0 1px,transparent 1px 26px),
    repeating-linear-gradient(90deg,rgba(255,255,255,.075) 0 1px,transparent 1px 54px)}
.dr-clubspot{top:0;left:50%;width:380px;height:78%;transform:translateX(-50%);
  background:linear-gradient(180deg,rgba(255,233,168,.26),transparent 72%);
  clip-path:polygon(44% 0,56% 0,100% 100%,0 100%)}

/* AN ATELIER: a cutting mat, and bolts of fabric leaning in the corners. */
.dr-set-atelier{background:radial-gradient(100% 60% at 50% 100%,rgba(255,61,154,.30),transparent 70%),
  linear-gradient(180deg,#150414,#07010a)}
.dr-cutting{inset:auto 0 0 0;height:46%;opacity:.5;
  background:repeating-linear-gradient(0deg,rgba(56,189,248,.16) 0 1px,transparent 1px 30px),
    repeating-linear-gradient(90deg,rgba(56,189,248,.16) 0 1px,transparent 1px 30px)}
.dr-bolt-a,.dr-bolt-b{bottom:0;width:52px;height:44%;
  background:linear-gradient(180deg,rgba(255,61,154,.22),rgba(255,61,154,.05))}
.dr-bolt-a{left:3%;transform:rotate(7deg)}
.dr-bolt-b{right:3%;transform:rotate(-9deg);
  background:linear-gradient(180deg,rgba(56,189,248,.2),rgba(56,189,248,.04))}

/* A DANCE FLOOR: marley, and the mirror wall behind it. */
.dr-set-floor{background:linear-gradient(180deg,#12040e,#050208)}
.dr-marley{inset:auto 0 0 0;height:38%;background:linear-gradient(180deg,transparent,rgba(0,0,0,.6));
  border-top:1px solid rgba(255,255,255,.09)}
.dr-mirror{top:8%;left:8%;right:8%;height:34%;opacity:.55;
  background:linear-gradient(110deg,rgba(255,255,255,.07),transparent 45%,rgba(255,255,255,.05));
  border:1px solid rgba(255,255,255,.08)}

/* A SOUNDSTAGE: a barn-door flag and a boom shadow. */
.dr-set-set{background:radial-gradient(110% 70% at 30% 0%,rgba(255,233,168,.26),transparent 60%),
  linear-gradient(180deg,#100a04,#050302)}
.dr-flag{top:0;left:14%;width:26%;height:32%;background:rgba(0,0,0,.45);
  clip-path:polygon(0 0,100% 0,72% 100%,0 78%)}
.dr-boom{top:6%;right:10%;width:44%;height:8px;background:rgba(0,0,0,.5);
  transform:rotate(-8deg);filter:blur(3px)}

@media(prefers-reduced-motion:reduce){.dr-tally{animation:none}}

/* ══════════════════════════════════════════════════════════════════
   ONE ROOM PER CHALLENGE
   ══════════════════════════════════════════════════════════════════
   Nineteen challenges used to share SIX backdrops and one card. Measured
   with a structural fingerprint of the rendered card: Snatch Game, the Ball
   and the Roast produced the same skeleton — portrait, name, marks, score,
   prose — over one of six tinted gradients. A night in a comedy club and a
   night on a film set were the same screen with a different colour behind.
   Every challenge now has its OWN room, its OWN palette and its OWN card
   frame. Rooms are CSS only, no images and no emoji.
   NO BACKTICKS ANYWHERE IN THIS BLOCK. It is a template literal and one
   inside a comment ends it, which has broken this repo five times. */

.dr-chal{--c1:#FF2D8B;--c2:#38bdf8;--ink:#F4EFE4}
.dr-chal .dr-score{color:var(--c1)}
.dr-chal .dr-panel{border-left:2px solid var(--c1)}
.dr-chal .dr-sub b{color:var(--c2)}
.dr-chal .dr-mark{background:linear-gradient(180deg,var(--c1),var(--c2))}

/* ── 1. SNATCH GAME - a game show floor ── */
.dr-chal-snatch-game{--c1:#FFD23F;--c2:#38bdf8}
.dr-set-snatch-game{background:radial-gradient(120% 70% at 50% 0%,rgba(56,189,248,.4),transparent 62%),
  linear-gradient(180deg,#04121c,#02060c)}
.dr-podia{inset:auto 0 0 0;height:36%;
  background:repeating-linear-gradient(90deg,rgba(255,210,63,.16) 0 62px,transparent 62px 104px);
  border-top:2px solid rgba(255,210,63,.35)}
.dr-qcard{top:12%;left:50%;width:190px;height:70px;transform:translateX(-50%) rotate(-3deg);
  background:linear-gradient(180deg,rgba(255,255,255,.14),rgba(255,255,255,.04));
  border:1px solid rgba(255,210,63,.4)}

/* ── 2. COMMERCIAL - a live ad shoot behind colour bars ── */
.dr-chal-commercial{--c1:#22d3ee;--c2:#F87171}
.dr-set-commercial{background:linear-gradient(180deg,#0a0f14,#03060a)}
.dr-bars{top:0;left:0;right:0;height:34%;opacity:.22;background:linear-gradient(90deg,
  #c0c0c0 0 14.28%,#c0c000 14.28% 28.56%,#00c0c0 28.56% 42.84%,#00c000 42.84% 57.12%,
  #c000c0 57.12% 71.4%,#c00000 71.4% 85.68%,#0000c0 85.68% 100%)}
.dr-onair{top:16px;left:50%;transform:translateX(-50%);width:132px;height:26px;
  border:2px solid rgba(248,113,113,.75);box-shadow:0 0 24px rgba(248,113,113,.5)}

/* ── 3. MUSIC VIDEO - sprockets and a dolly track ── */
.dr-chal-music-video{--c1:#FF2D8B;--c2:#2dd4bf}
.dr-set-music-video{background:radial-gradient(100% 60% at 50% 0%,rgba(45,212,191,.26),transparent 66%),
  linear-gradient(180deg,#0a0413,#040108)}
.dr-sprock-l,.dr-sprock-r{top:0;bottom:0;width:34px;
  background:repeating-linear-gradient(180deg,rgba(255,255,255,.16) 0 10px,transparent 10px 30px)}
.dr-sprock-l{left:0}
.dr-sprock-r{right:0}
.dr-dolly{inset:auto 8% 6% 8%;height:6px;
  background:linear-gradient(90deg,transparent,rgba(255,255,255,.3),transparent)}

/* ── 4. PHOTOSHOOT - a contact sheet and one strobe pop ── */
.dr-chal-photoshoot{--c1:#e5e7eb;--c2:#FFD23F}
.dr-set-photoshoot{background:linear-gradient(180deg,#0b0b0d,#030304)}
.dr-contact{inset:0;opacity:.5;
  background:repeating-linear-gradient(0deg,rgba(255,255,255,.1) 0 2px,transparent 2px 96px),
    repeating-linear-gradient(90deg,rgba(255,255,255,.1) 0 2px,transparent 2px 140px)}
.dr-strobe{top:0;left:50%;width:520px;height:60%;transform:translateX(-50%);
  background:radial-gradient(60% 70% at 50% 0%,rgba(255,255,255,.22),transparent 70%);
  animation:drPop 6s ease-out infinite}
@keyframes drPop{0%,7%,100%{opacity:.25}3%{opacity:1}}

/* ── 5. RUSICAL - a proscenium and a music staff ── */
.dr-chal-rusical{--c1:#e11d48;--c2:#FFD23F}
.dr-set-rusical{background:radial-gradient(120% 80% at 50% 100%,rgba(255,200,61,.34),transparent 65%),
  linear-gradient(180deg,#180309,#0a0105)}
.dr-arch{top:0;left:6%;right:6%;height:64%;border:14px solid rgba(255,210,63,.16);
  border-top-width:26px;border-radius:50% 50% 0 0/28% 28% 0 0}
.dr-staff{inset:auto 12% 12% 12%;height:52px;opacity:.5;
  background:repeating-linear-gradient(180deg,rgba(255,233,168,.5) 0 1px,transparent 1px 13px)}

/* ── 6. TALENT SHOW - a marquee of bulbs over a star drop ── */
.dr-chal-talent-show{--c1:#f59e0b;--c2:#fde68a}
.dr-set-talent-show{background:radial-gradient(110% 70% at 50% 0%,rgba(255,210,63,.28),transparent 62%),
  linear-gradient(180deg,#140a02,#070301)}
.dr-marquee{top:10px;left:4%;right:4%;height:14px;
  background:repeating-radial-gradient(circle at 10px 7px,rgba(255,233,168,.95) 0 3px,transparent 3px 22px);
  filter:drop-shadow(0 0 7px rgba(255,210,63,.7))}
.dr-stardrop{inset:0;opacity:.45;background:
  radial-gradient(1.4px 1.4px at 18% 30%,#fff,transparent),
  radial-gradient(1.6px 1.6px at 64% 18%,#fff,transparent),
  radial-gradient(1.2px 1.2px at 82% 46%,#fff,transparent),
  radial-gradient(1.5px 1.5px at 36% 62%,#fff,transparent)}

/* ── 7. SINGING - a mic halo over a waveform ── */
.dr-chal-singing{--c1:#a78bfa;--c2:#f472b6}
.dr-set-singing{background:radial-gradient(90% 60% at 50% 20%,rgba(167,139,250,.3),transparent 68%),
  linear-gradient(180deg,#0b0616,#040209)}
.dr-halo{top:12%;left:50%;width:230px;height:230px;transform:translateX(-50%);border-radius:50%;
  border:1px solid rgba(167,139,250,.35);box-shadow:0 0 90px rgba(167,139,250,.28) inset}
.dr-wave{inset:auto 0 12% 0;height:74px;opacity:.6;
  background:repeating-linear-gradient(90deg,rgba(244,114,182,.6) 0 3px,transparent 3px 11px);
  mask-image:radial-gradient(70% 100% at 50% 50%,#000,transparent)}

/* ── 8. RUMIX - a mixing desk ── */
.dr-chal-rumix{--c1:#4ade80;--c2:#22d3ee}
.dr-set-rumix{background:linear-gradient(180deg,#04120c,#010604)}
.dr-faders{inset:auto 10% 10% 10%;height:120px;
  background:repeating-linear-gradient(90deg,rgba(74,222,128,.28) 0 2px,transparent 2px 44px)}
.dr-vu{top:12%;left:50%;width:280px;height:10px;transform:translateX(-50%);
  background:linear-gradient(90deg,#4ade80,#FFD23F 70%,#F87171);opacity:.55}

/* ── 9. LIP SYNC CHALLENGE - two spots and a hard waveform ── */
.dr-chal-lipsync-challenge{--c1:#FF294B;--c2:#FF2D8B}
.dr-set-lipsync-challenge{background:radial-gradient(80% 70% at 30% 0%,rgba(255,41,75,.3),transparent 64%),
  radial-gradient(80% 70% at 70% 0%,rgba(255,45,139,.3),transparent 64%),
  linear-gradient(180deg,#12030a,#050106)}
.dr-lsbars{inset:auto 6% 8% 6%;height:110px;
  background:repeating-linear-gradient(90deg,rgba(255,45,139,.55) 0 5px,transparent 5px 15px);
  mask-image:linear-gradient(90deg,transparent,#000 20%,#000 80%,transparent)}

/* ── 10. ROAST - brick, one hard spot, a mic stand ── */
.dr-chal-roast{--c1:#fb923c;--c2:#FFD23F}
.dr-set-roast{background:linear-gradient(180deg,#0d0705,#050202)}
.dr-micstand{inset:auto 50% 0 auto;width:3px;height:34%;transform:translateX(50%);
  background:linear-gradient(180deg,rgba(255,255,255,.3),transparent)}

/* ── 11. STAND-UP - a basement room and a red neon sign ── */
.dr-chal-stand-up{--c1:#F87171;--c2:#fb923c}
.dr-set-stand-up{background:radial-gradient(70% 50% at 50% 10%,rgba(248,113,113,.22),transparent 70%),
  linear-gradient(180deg,#0a0406,#030102)}
.dr-neon{top:9%;left:50%;width:150px;height:36px;transform:translateX(-50%);
  border:2px solid rgba(248,113,113,.85);border-radius:6px;
  box-shadow:0 0 30px rgba(248,113,113,.65),0 0 60px rgba(248,113,113,.3) inset;
  animation:drBuzz 5s steps(1) infinite}
@keyframes drBuzz{0%,92%,100%{opacity:1}94%{opacity:.35}96%{opacity:1}97%{opacity:.5}}
.dr-stool{inset:auto 50% 4% auto;width:56px;height:8px;transform:translateX(50%);
  background:rgba(255,255,255,.14);border-radius:3px}

/* ── 12. IMPROV - suggestion cards pinned on a wall ── */
.dr-chal-improv{--c1:#2dd4bf;--c2:#FFD23F}
.dr-set-improv{background:radial-gradient(100% 60% at 50% 0%,rgba(45,212,191,.22),transparent 66%),
  linear-gradient(180deg,#04100f,#020706)}
.dr-cards{inset:0;opacity:.5;background:
  linear-gradient(4deg,transparent 47%,rgba(255,255,255,.09) 47% 53%,transparent 53%),
  linear-gradient(-7deg,transparent 62%,rgba(255,255,255,.07) 62% 67%,transparent 67%)}
.dr-chairs{inset:auto 0 6% 0;height:44px;background:repeating-linear-gradient(90deg,
  transparent 0 40%,rgba(255,255,255,.12) 40% 44%,transparent 44% 100%)}

/* ── 13. DESIGN - a cutting table and pattern pieces ── */
.dr-chal-design{--c1:#38bdf8;--c2:#FF2D8B}
.dr-set-design{background:linear-gradient(180deg,#0a0d12,#040609)}
.dr-mat{inset:auto 0 0 0;height:52%;opacity:.55;
  background:repeating-linear-gradient(0deg,rgba(56,189,248,.16) 0 1px,transparent 1px 26px),
    repeating-linear-gradient(90deg,rgba(56,189,248,.16) 0 1px,transparent 1px 26px)}
.dr-pattern{top:14%;left:12%;width:180px;height:150px;transform:rotate(-8deg);
  border:1px dashed rgba(255,255,255,.26)}

/* ── 14. BALL - three lit alcoves, because a ball is three looks ── */
.dr-chal-ball{--c1:#f0abfc;--c2:#FFD23F}
.dr-set-ball{background:radial-gradient(110% 70% at 50% 100%,rgba(255,210,63,.26),transparent 68%),
  linear-gradient(180deg,#120a02,#060301)}
.dr-alcoves{inset:6% 8% 18% 8%;border-bottom:1px solid rgba(255,210,63,.3);
  background:repeating-linear-gradient(90deg,rgba(255,210,63,.13) 0 22%,transparent 22% 33.3%)}

/* ── 15. MAKEOVER - two vanity mirrors, side by side ── */
.dr-chal-makeover{--c1:#f472b6;--c2:#FFD23F}
.dr-set-makeover{background:radial-gradient(90% 60% at 50% 30%,rgba(244,114,182,.24),transparent 70%),
  linear-gradient(180deg,#140510,#070209)}
.dr-vanity{top:14%;left:12%;right:12%;height:44%;
  border-top:2px dotted rgba(255,233,168,.5);border-bottom:2px dotted rgba(255,233,168,.5);
  background:repeating-linear-gradient(90deg,transparent 0 44%,rgba(255,255,255,.05) 44% 56%,transparent 56%)}

/* ── 16. RUNWAY CHALLENGE - a catwalk in perspective ── */
.dr-chal-runway-challenge{--c1:#5eead4;--c2:#f0abfc}
.dr-set-runway-challenge{background:linear-gradient(180deg,#0c0413,#040108)}
.dr-catwalk{inset:auto 0 0 0;height:56%;
  background:linear-gradient(180deg,transparent,rgba(240,171,252,.16));
  clip-path:polygon(38% 0,62% 0,100% 100%,0 100%)}

/* ── 17. CHOREOGRAPHY - marley, a barre and the mirror wall ── */
.dr-chal-choreography{--c1:#818cf8;--c2:#f472b6}
.dr-set-choreography{background:linear-gradient(180deg,#06111a,#02060a)}
.dr-barre{top:44%;left:0;right:0;height:4px;background:rgba(255,255,255,.22)}
.dr-mirrorwall{top:8%;left:6%;right:6%;height:34%;opacity:.5;
  border:1px solid rgba(255,255,255,.09);
  background:linear-gradient(110deg,rgba(255,255,255,.08),transparent 45%,rgba(255,255,255,.05))}

/* ── 18. GIRL GROUP - risers and a row of mic stands ── */
.dr-chal-girl-group{--c1:#c084fc;--c2:#22d3ee}
.dr-set-girl-group{background:radial-gradient(110% 60% at 50% 0%,rgba(34,211,238,.24),transparent 64%),
  linear-gradient(180deg,#0a0616,#040209)}
.dr-risers{inset:auto 0 0 0;height:34%;background:
  linear-gradient(180deg,transparent,rgba(0,0,0,.55)),
  repeating-linear-gradient(90deg,rgba(244,114,182,.14) 0 90px,transparent 90px 96px)}
.dr-mics{inset:auto 12% 22% 12%;height:90px;background:repeating-linear-gradient(90deg,
  transparent 0 46px,rgba(255,255,255,.22) 46px 48px,transparent 48px 120px)}

/* ── 19. ACTING - a soundstage, a flag and the boom ── */
.dr-chal-acting{--c1:#94a3b8;--c2:#FFD23F}
.dr-set-acting{background:radial-gradient(110% 70% at 30% 0%,rgba(255,233,168,.24),transparent 60%),
  linear-gradient(180deg,#100a04,#050302)}

@media(prefers-reduced-motion:reduce){
  .dr-strobe,.dr-neon{animation:none}
}

/* ══════════════════════════════════════════════════════════════════
   AND ONE CARD PER CHALLENGE
   ══════════════════════════════════════════════════════════════════
   The room alone was not enough. Every challenge still put its queens on
   the identical panel, so the screens differed only in what was behind
   them. Each challenge now stamps its own object on the card: the thing
   that challenge physically produces. Drawn with ::before on the panel, so
   nothing in the markup changes and every card keeps its reveal id.
   Bounded, quiet, and never over the text. */

.dr-chal .dr-panel{position:relative;overflow:hidden}
.dr-chal .dr-panel::before{content:"";position:absolute;pointer-events:none;opacity:.5}

/* A game show podium, under her. */
.dr-chal-snatch-game .dr-panel::before{left:0;right:0;bottom:0;height:5px;
  background:repeating-linear-gradient(90deg,var(--c1) 0 26px,transparent 26px 44px)}
/* Colour bars down the edge of a tape. */
.dr-chal-commercial .dr-panel::before{top:0;bottom:0;right:0;width:7px;
  background:linear-gradient(180deg,#c0c000,#00c0c0,#00c000,#c000c0,#c00000)}
/* Film sprockets. */
.dr-chal-music-video .dr-panel::before{top:0;bottom:0;right:0;width:14px;
  background:repeating-linear-gradient(180deg,rgba(255,255,255,.5) 0 6px,transparent 6px 18px)}
/* A contact-sheet frame notch. */
.dr-chal-photoshoot .dr-panel::before{top:6px;right:8px;width:34px;height:22px;
  border:2px solid rgba(255,255,255,.5);border-radius:2px}
/* A stave running under the card. */
.dr-chal-rusical .dr-panel::before{left:0;right:0;bottom:4px;height:20px;
  background:repeating-linear-gradient(180deg,var(--c1) 0 1px,transparent 1px 5px);opacity:.28}
/* Marquee bulbs across the top. */
.dr-chal-talent-show .dr-panel::before{left:0;right:0;top:0;height:6px;
  background:repeating-radial-gradient(circle at 6px 3px,var(--c1) 0 2px,transparent 2px 14px)}
/* A single hanging mic cable. */
.dr-chal-singing .dr-panel::before{top:0;right:34px;width:2px;height:30px;background:var(--c1)}
/* A fader travelling the width of the card. */
.dr-chal-rumix .dr-panel::before{left:0;right:0;bottom:0;height:3px;
  background:linear-gradient(90deg,var(--c1),var(--c2))}
/* A hard waveform strip. */
.dr-chal-lipsync-challenge .dr-panel::before{left:0;right:0;bottom:0;height:8px;
  background:repeating-linear-gradient(90deg,var(--c1) 0 3px,transparent 3px 9px)}
/* Brick, in the corner. */
.dr-chal-roast .dr-panel::before{left:0;top:0;bottom:0;width:16px;opacity:.35;
  background:repeating-linear-gradient(0deg,rgba(255,255,255,.3) 0 1px,transparent 1px 12px)}
/* A neon underline that buzzes on. */
.dr-chal-stand-up .dr-panel::before{left:14px;bottom:6px;width:56px;height:2px;
  background:var(--c1);box-shadow:0 0 12px var(--c1)}
/* A pinned suggestion card, cornered. */
.dr-chal-improv .dr-panel::before{top:-10px;right:16px;width:26px;height:26px;
  transform:rotate(12deg);border:1px solid rgba(255,255,255,.45);
  background:rgba(255,255,255,.07)}
/* Cutting-mat grid, bottom corner. */
.dr-chal-design .dr-panel::before{right:0;bottom:0;width:64px;height:44px;opacity:.3;
  background:repeating-linear-gradient(0deg,var(--c1) 0 1px,transparent 1px 11px),
    repeating-linear-gradient(90deg,var(--c1) 0 1px,transparent 1px 11px)}
/* Three alcoves, because a ball is three looks. */
.dr-chal-ball .dr-panel::before{left:0;right:0;top:0;height:3px;
  background:repeating-linear-gradient(90deg,var(--c1) 0 30%,transparent 30% 33.33%)}
/* Two mirrors, because a makeover is two people. */
.dr-chal-makeover .dr-panel::before{top:8px;right:10px;width:44px;height:20px;
  border-left:2px solid var(--c1);border-right:2px solid var(--c1);opacity:.7}
/* The catwalk, in perspective. */
.dr-chal-runway-challenge .dr-panel::before{left:50%;bottom:0;width:120px;height:4px;
  transform:translateX(-50%);background:linear-gradient(90deg,transparent,var(--c1),transparent)}
/* An eight-count ruler. */
.dr-chal-choreography .dr-panel::before{left:0;right:0;bottom:0;height:4px;
  background:repeating-linear-gradient(90deg,var(--c1) 0 2px,transparent 2px 12.5%)}
/* Risers, stepped. */
.dr-chal-girl-group .dr-panel::before{right:0;bottom:0;width:54px;height:18px;
  background:linear-gradient(90deg,var(--c1) 0 33%,transparent 33%),
    linear-gradient(180deg,transparent 50%,var(--c2) 50%);opacity:.5}
/* A clapperboard, because acting is takes. */
.dr-chal-acting .dr-panel::before{left:0;right:0;top:0;height:9px;
  background:repeating-linear-gradient(115deg,var(--c1) 0 12px,#111 12px 24px)}

/* WHAT ONE MARK MEANS, said once per card. The marks were anonymous bars on
   every challenge that detailFor does not label — a row of numbers with no
   noun. The engine has always known they were rounds, looks, bits. */
.dr-chal .dr-unit{display:block;margin-top:2px;font-size:9px;letter-spacing:.18em;
  text-transform:uppercase;opacity:.55}

.dr-perf-line{grid-column:1/-1;margin:9px 0 0;color:#f4e3ed;line-height:1.6;
  max-width:74ch;text-wrap:pretty}
.dr-track{margin-top:10px;color:#FFC83D;font-size:13px;line-height:1.5}
.dr-track span{color:#C9A6BC}
.dr-brief{padding:18px 22px;margin-bottom:14px;
  background:linear-gradient(180deg,rgba(0,229,255,.10),rgba(10,2,7,.6));
  border:1px solid rgba(0,229,255,.4)}
.dr-brief h3{margin:0 0 8px;font-size:26px;text-wrap:balance}
.dr-brief p{margin:0;color:#eaf7fb;font-size:15px;line-height:1.6;text-wrap:pretty}
.dr-brief .dr-fmt{display:inline-block;font-size:9px;letter-spacing:.2em;text-transform:uppercase;
  padding:3px 10px;margin-bottom:8px;border:1px solid rgba(0,229,255,.6);color:#00E5FF}

.dr-row{display:grid;grid-template-columns:auto 1fr auto;gap:14px;align-items:center;
  padding:13px 16px 13px 20px}
.dr-row h3{margin:0;font-size:17px}
.dr-row .dr-sub{font-size:11px;letter-spacing:.1em;color:#C9A6BC}
/* THE SCORE LANDS. It is the verdict on a performance and it appeared the
   same way the paragraph did — it should arrive after the reading, hard.
   Only on a revealed card, so it fires on the click rather than on paint. */
.dr-score{font-size:22px;font-variant-numeric:tabular-nums;padding:5px 12px;
  border:1px solid currentColor;color:#00E5FF}
.dr-score.dr-hot{color:#FFC83D}
.dr-score.dr-cold{color:#FF294B}
.dr-step.dr-vis .dr-score{animation:drScore .5s cubic-bezier(.2,1.6,.35,1) both;
  animation-delay:.12s}
@keyframes drScore{from{opacity:0;transform:scale(2.1) rotate(-7deg)}
  to{opacity:1;transform:scale(1) rotate(0)}}
/* And the card itself arrives from the room rather than fading in place. */
.dr-step.dr-vis .dr-panel{animation:drCard .42s ease-out both}
@keyframes drCard{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}

/* THE CARDS BELONG TO THEIR ROOM. Each family sets the accent its own left
   rail and score take, so a Snatch Game card is not a Rusical card in a
   different building. */
/* The six family accents are gone: the palette is per challenge now and
   lives on .dr-chal-<id> with that challenge's room. */
.dr-fam .dr-perf-line{border-left:0}

@media(prefers-reduced-motion:reduce){
  .dr-step.dr-vis .dr-score,.dr-step.dr-vis .dr-panel{animation:none}
}

/* A bar of per-round marks — Snatch Game's six, the Ball's three, a roast set. */
.dr-marks{display:flex;gap:5px;margin-top:9px;flex-wrap:wrap}
.dr-mark{min-width:34px;text-align:center;font-size:11px;font-weight:700;padding:4px 6px;
  font-variant-numeric:tabular-nums;background:rgba(255,255,255,.08);
  border-bottom:2px solid var(--m,#00E5FF)}
.dr-mark small{display:block;font-size:8px;letter-spacing:.08em;color:#C9A6BC;font-weight:400}

.dr-tag{display:inline-block;font-size:9px;letter-spacing:.14em;text-transform:uppercase;
  padding:2px 8px;margin-left:6px;border:1px solid currentColor}
.dr-t-warn{color:#FF294B}.dr-t-good{color:#3BE08A}.dr-t-note{color:#FFC83D}

/* The draft board: what is still on it, and who took what. */
/* THE BOARD IS WHO TOOK WHAT. The dr-taken class used to strike the chip
   through at a third opacity, from when a chip was a character crossed OFF
   the board; it now names a queen and her pick and has to be readable.
   NO BACKTICKS: this comment is inside a template literal. */
/* The mini's result card — the last click on that screen. */
/* ══ THE MINI ══ one queen aiming at another ══ */
.dr-minirow{display:grid;grid-template-columns:auto 1fr;gap:16px;align-items:start;
  padding:14px 16px 14px 20px}
.dr-minirow p{margin:6px 0 0;color:#f4e3ed;line-height:1.6;max-width:74ch;text-wrap:pretty}
.dr-aim{display:flex;align-items:center;gap:6px}
.dr-aim .dr-por{border:1px solid rgba(255,255,255,.22)}
/* The shot, drawn from her to her mark. */
.dr-aim-arrow{position:relative;width:26px;height:2px;background:rgba(255,255,255,.28);
  flex:0 0 auto}
.dr-aim-arrow::after{content:"";position:absolute;right:-1px;top:-3px;
  border-left:7px solid rgba(255,255,255,.28);
  border-top:4px solid transparent;border-bottom:4px solid transparent}
/* It landed. */
.dr-aim-arrow.dr-hit{background:#FF3D9A;box-shadow:0 0 12px rgba(255,61,154,.8)}
.dr-aim-arrow.dr-hit::after{border-left-color:#FF3D9A}
.dr-step.dr-vis .dr-aim-arrow{animation:drAim .5s cubic-bezier(.2,1,.3,1) both .1s}
@keyframes drAim{from{transform:scaleX(0);transform-origin:left}to{transform:scaleX(1)}}
.dr-aim-target{opacity:.75}
.dr-step.dr-vis .dr-aim-arrow.dr-hit + .dr-bust{animation:drStruck .45s ease-out .38s}
@keyframes drStruck{0%{transform:none}35%{transform:translateX(4px) rotate(3deg)}
  100%{transform:none}}
.dr-aim-k{display:block;margin-top:2px;font-size:10px;letter-spacing:.14em;
  text-transform:uppercase;color:#FF7BC8}
@media(prefers-reduced-motion:reduce){
  .dr-step.dr-vis .dr-aim-arrow,.dr-step.dr-vis .dr-aim-arrow.dr-hit + .dr-bust{animation:none}
}

.dr-miniwin{display:grid;grid-template-columns:auto 1fr;gap:16px;align-items:center;
  padding:16px 20px;border-left:4px solid #FFC83D;
  background:linear-gradient(90deg,rgba(255,200,61,.16),transparent 55%),var(--dr-panel)}
.dr-miniwin b{display:block;font-size:26px;color:#FFC83D;line-height:1.05}
.dr-miniwin p{margin:4px 0 0;color:#f4e3ed}
/* THE GROUPS, on the brief. */
.dr-teams{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));
  gap:12px;margin:0 0 14px}
.dr-team{padding:12px 14px;border:1px solid var(--dr-line);background:rgba(0,0,0,.26)}
.dr-team-k{margin-bottom:9px;padding-bottom:6px;font-size:15px;color:#FFC83D;
  border-bottom:1px solid rgba(255,200,61,.28);text-wrap:balance}
.dr-team-q{display:grid;grid-template-columns:auto 1fr auto;gap:9px;align-items:center;
  padding:4px 0}
.dr-team-q b{font-size:12.5px;font-weight:600;color:#f0dfe9}
.dr-team-q i{font-size:9px;letter-spacing:.14em;text-transform:uppercase;
  font-style:normal;color:#C9A6BC}
/* ══ HOW THE ROOM TOOK THE BRIEF ══
   NAMED dr-reax, NOT dr-took: .dr-took is already the DRAFT board's chip in
   this same stylesheet, so the first version of this inherited its
   display:block and its gold — the board came out as a vertical column of
   faces all labelled the same colour. Two things with one class name in one
   file, which is the third time in this build.
   A face per queen, dark until her reaction is read, then wearing the
   colour of her verdict. Green delighted, gold braced, red dreading —
   the same three the prose is tiered by. */
.dr-reax{position:sticky;top:0;z-index:6;display:flex;flex-wrap:wrap;gap:12px;
  justify-content:center;padding:14px 16px;margin:0 0 18px;
  background:linear-gradient(180deg,#1a0713,#0b0309 78%,rgba(6,2,5,.96));
  border-bottom:1px solid rgba(255,255,255,.12);
  box-shadow:0 16px 34px -22px rgba(0,0,0,.95)}
.dr-reax-q{width:74px;text-align:center;opacity:.32;filter:grayscale(1);
  transition:opacity .4s,filter .4s,transform .4s}
.dr-reax-q.on{opacity:1;filter:none;transform:translateY(-2px)}
.dr-reax-q .dr-por{margin:0 auto;display:block;border:2px solid transparent;
  transition:border-color .4s;border-color:var(--took,transparent)}
.dr-reax-q b{display:block;margin-top:4px;font-size:9.5px;font-weight:600;color:#e3cfdd;
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dr-reax-q i{display:block;font-style:normal;font-size:8.5px;letter-spacing:.14em;
  text-transform:uppercase;color:var(--took,transparent);min-height:11px}
/* Her card wears the same colour as her face on the board. */
.dr-hasreact{border-left-color:var(--took)!important}
.dr-reax-k{display:block;margin-bottom:3px;font-size:9px;letter-spacing:.18em;
  text-transform:uppercase;color:var(--took)}
.dr-brief-room .dr-step{scroll-margin-top:150px}
@media(max-width:760px){.dr-took{position:static}.dr-reax-q{width:56px}}
@media(prefers-reduced-motion:reduce){.dr-reax-q,.dr-reax-q .dr-por{transition:none}}

/* ══ THE DOORWAY ══ the host walks in and the room stops ══ */
.dr-brief-room{position:relative}
.dr-doorway{position:absolute;inset:-24px -18px;z-index:-1;pointer-events:none;overflow:hidden}
.dr-doorway i{position:absolute;display:block}
.dr-door-light{top:0;left:50%;width:230px;height:56%;transform:translateX(-50%);
  background:linear-gradient(180deg,rgba(255,233,168,.20),transparent 76%);
  clip-path:polygon(34% 0,66% 0,100% 100%,0 100%)}
.dr-door-floor{left:0;right:0;bottom:0;height:24%;
  background:linear-gradient(180deg,transparent,rgba(0,0,0,.45));
  border-top:1px solid rgba(255,255,255,.07)}
/* The brief is the one the whole week hangs off, so it is brightest. */
.dr-door-brief{background:radial-gradient(110% 60% at 50% 0%,rgba(255,233,168,.16),transparent 62%)}
.dr-door-mini{background:radial-gradient(100% 55% at 50% 0%,rgba(56,189,248,.13),transparent 62%)}
.dr-door-draft{background:radial-gradient(100% 55% at 50% 0%,rgba(255,61,154,.13),transparent 62%)}

.dr-board{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));
  gap:9px;margin-bottom:16px}
.dr-chip-lg{display:grid;grid-template-columns:auto 1fr;gap:9px;align-items:center;
  padding:8px 11px;font-size:12px;border:1px solid var(--dr-line);
  background:rgba(0,0,0,.24)}
.dr-chip-lg .dr-por{border:1px solid rgba(255,255,255,.22)}
.dr-took{display:block;min-width:0}
.dr-took b{display:block;font-size:12px;font-weight:600;color:#f0dfe9;
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dr-took i{display:block;font-style:normal;font-size:12.5px;color:#FFC83D;
  line-height:1.25;text-wrap:pretty}
.dr-took u{display:block;margin-top:2px;font-size:9.5px;letter-spacing:.1em;
  text-transform:uppercase;color:#FF294B;text-decoration:none}
/* She wanted something else and did not get it. */
.dr-chip-lg.dr-lost{border-color:rgba(255,41,75,.4)}
.dr-nm-sub{font-size:10.5px;color:#FFC83D;line-height:1.25}

/* Teams, side by side. */
.dr-teams{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px}
.dr-team{padding:12px 14px;border:1px solid rgba(255,255,255,.16)}
.dr-team h4{margin:0 0 8px;font-size:12px;letter-spacing:.2em;color:#FFC83D}
.dr-member{display:flex;align-items:center;gap:8px;padding:4px 0;font-size:13px}
.dr-role{margin-left:auto;font-size:9px;letter-spacing:.12em;color:#C9A6BC;text-transform:uppercase}

/* The roast's room temperature, moving down the running order. */
.dr-temp{height:6px;background:rgba(255,255,255,.12);margin-top:8px;overflow:hidden}
.dr-temp i{display:block;height:100%;background:linear-gradient(90deg,#00E5FF,#FFC83D,#FF294B)}

/* The makeover's second face. Small, beside the name, and never competing with
   the queen's own portrait at the top of the card. */
.dr-mk-with{display:flex;align-items:center;gap:8px}
.dr-mk-face{width:34px;height:34px;border-radius:8px;object-fit:cover;flex:0 0 auto;
  border:1px solid rgba(255,255,255,.22);box-shadow:0 6px 14px -8px rgba(0,0,0,.9)}
.dr-mk-note{display:block;font-size:10px;line-height:1.35;color:var(--muted,#8b949e);
  max-width:56ch;margin-top:2px}

/* The guest's face on the draft board, inline with what she took. */
.dr-seat-face{width:22px;height:22px;border-radius:5px;object-fit:cover;
  vertical-align:-6px;margin-right:6px;border:1px solid rgba(255,255,255,.2)}
.dr-seat-by{display:block;font-size:9.5px;letter-spacing:.4px;text-transform:uppercase;
  color:var(--muted,#8b949e);font-style:normal;text-decoration:none;margin-top:2px}
`;

/* ── the pieces ─────────────────────────────────────────────────── */

function marks(list, labels = []) {
  if (!Array.isArray(list) || !list.length) return '';
  return `<div class="dr-marks">${list.map((v, i) => {
    const num = Number(v);
    const hue = num >= 8 ? '#3BE08A' : num >= 6 ? '#00E5FF' : num >= 4 ? '#FFC83D' : '#FF294B';
    return `<span class="dr-mark" style="--m:${hue}">${n1(num)}${
      labels[i] ? `<small>${esc(labels[i])}</small>` : ''}</span>`;
  }).join('')}</div>`;
}

const scoreClass = p => (p >= 8.5 ? 'dr-hot' : p <= 4.5 ? 'dr-cold' : '');

/**
 * The per-type body for one queen's performance.
 *
 * Returns '' for a type with no panel yet, and the caller falls back to the
 * generic card — so a challenge nobody has designed a panel for still plays
 * and still reads, it simply looks plain.
 */
function detailFor(id, perf) {
  const d = perf?.detail || {};
  switch (id) {
    case 'snatch-game':
      return `<div class="dr-sub">as <b>${esc(d.character || '—')}</b>${
        d.dying ? '<span class="dr-tag dr-t-warn">dying</span>' : ''}${
        d.doubleAct ? '<span class="dr-tag dr-t-good">double act</span>' : ''}</div>
        ${marks(d.rounds || [], (d.rounds || []).map((_, i) => `R${i + 1}`))}`;
    case 'ball':
      return `<div class="dr-sub">${esc(d.theme || 'the ball')}</div>
        ${marks((d.looks || []).map(l => l.score), (d.looks || []).map(l =>
    `${l.label}${l.sewn ? ' ✂' : ''}`))}`;
    case 'roast':
      return `<div class="dr-sub">slot ${esc(d.slot ?? '—')} · ${esc(d.slotKind || '')}${
        d.duds ? `<span class="dr-tag dr-t-warn">${esc(d.duds)} dud${d.duds === 1 ? '' : 's'}</span>` : ''}</div>
        ${marks(d.bits || [], (d.bits || []).map((_, i) => `bit ${i + 1}`))}
        ${d.roomTemp !== undefined ? `<div class="dr-temp"><i style="width:${
    Math.max(0, Math.min(100, 50 + Number(d.roomTemp) * 12))}%"></i></div>` : ''}`;
    case 'makeover':
      /* THE OTHER HALF OF THE PAIR, drawn rather than named. A makeover card
         is about two people and only one of them was ever on it. The portrait
         lives in `assets/guests/` — deliberately not with the players, see the
         header of js/dr/data/partners.js — and is absent for a loved one or an
         eliminated queen, where the card falls back to the name alone. */
      return `<div class="dr-sub dr-mk-with">${d.partnerPortrait
    ? `<img class="dr-mk-face" src="${esc(d.partnerPortrait)}" alt=""
        loading="lazy" onerror="this.style.display='none'">` : ''}
        <span>with <b>${esc(d.partner || '—')}</b>${
    /* AND WHAT HE DID WITH THE DAY. He is worth about a point of performance
       and he can now spend it on the morning rather than on a constant, so
       the card has to say which — a score a point down with nothing on the
       screen explaining it is the average that hides its own event.
       Read off the engine's flag, never re-derived from the numbers: a card
       that guessed would eventually disagree with the scene beside it. */
    d.partnerFought ? `<span class="dr-tag dr-t-warn">he fought it${
      d.partnerCost ? ` · −${n1(d.partnerCost)}` : ''}</span>`
      : d.partnerTook ? `<span class="dr-tag dr-t-good">he took to it${
        d.partnerCost ? ` · +${n1(d.partnerCost)}` : ''}</span>` : ''
}${d.partnerNote
    ? `<small class="dr-mk-note">${esc(d.partnerNote)}</small>` : ''}</span></div>
        ${marks([d.resemblance, d.ownLook, d.partnerLook], ['likeness', 'her look', 'theirs'])}`;
    case 'improv':
      return `<div class="dr-sub">${esc(d.premise || '')}${
        d.froze ? '<span class="dr-tag dr-t-warn">froze</span>' : ''}</div>`;
    case 'acting':
      return `<div class="dr-sub"><b>${esc(d.part || '—')}</b> in ${esc(d.script || '')}${
        d.dropped ? '<span class="dr-tag dr-t-warn">dropped a line</span>' : ''}</div>`;
    /* ── THE VERSE, AND THE SHOOT ──
       Both used to render out of the girl group case below, because both used
       to BE the girl group: one module served all three. They are `format:
       'cast'` — one room, one track — so `d.teamWon` was `ti === bestTeam`
       with a single team, and every queen on the screen wore a WINNING TEAM
       tag on a challenge that has no teams to win. Their own modules now
       compute their own detail, and it is the detail the night is actually
       about. */
    case 'rumix':
      return `<div class="dr-sub">verse ${esc(d.slot ?? '—')}${
        d.slotKind ? ` · ${esc(d.slotKind)}` : ''}${
        d.hook ? '<span class="dr-tag dr-t-good">hook</span>' : ''}${
        d.filler ? `<span class="dr-tag dr-t-warn">${esc(d.filler)} filler bar${
          d.filler === 1 ? '' : 's'}</span>` : ''}</div>
        ${marks(d.bars || [], (d.bars || []).map((_, i) => `bar ${i + 1}`))}
        ${marks([d.booth, d.live], ['on tape', 'live'])}`;
    case 'music-video':
      return `<div class="dr-sub"><b>${esc(d.part || '—')}</b>${
        d.takes ? ` · ${esc(d.takes)} take${d.takes === 1 ? '' : 's'}` : ''}${
        d.findable === false
          ? '<span class="dr-tag dr-t-warn">lost in the background</span>' : ''}${
        Number(d.impression) >= 0.45
          ? `<span class="dr-tag dr-t-good">the director’s pick</span>`
          : Number(d.impression) <= -0.45
            ? '<span class="dr-tag dr-t-warn">a bad day on set</span>' : ''}</div>`;
    case 'girl-group': case 'rusical': case 'singing': {
      /* ONLY SAY TEAM WHEN THERE IS A TEAM, and only print a mark that has a
         number behind it. The Rusical and the singing challenge are also
         whole-cast, and they carry neither `verse` nor `teamMean` — so this
         line printed the word "team" and two empty marks over both of them.
         The girl group genuinely has teams and is unchanged. */
      const onATeam = (d.teamMean !== undefined && d.teamMean !== null);
      const vals = [d.verse, onATeam ? d.teamMean : undefined];
      const labs = ['her verse', 'the team'];
      const keep = vals.map((v, i) => [v, labs[i]]).filter(([v]) => Number.isFinite(Number(v)));
      /* NOT "winning team". Same spoiler as the board above, one card lower:
         the first member of the better team to be revealed gave the result
         away, on the screen whose whole job is the performances. */
      return `<div class="dr-sub">${perf.role ? `${esc(perf.role)}` : ''}${
        onATeam ? `${perf.role ? ' · ' : ''}team` : ''}</div>
        ${marks(keep.map(x => x[0]), keep.map(x => x[1]))}`;
    }

    /* ── THE NINE THAT HAD NO PANEL ──
       Ten types were rendered and nine were not, and every one of those nine
       carries real detail the engine had already computed — the product she
       was selling, the fabric she was handed, the formation she blew. Their
       cards drew a portrait, a score bar and no words at all.
       It surfaced on `stand-up` alone, and only because a late episode with
       four queens left produced a screen short enough to trip a
       text-length check: the others were padded over the threshold by the
       scenes around them. One instance of a nine-way gap. */
    case 'stand-up':
      return `<div class="dr-sub">slot ${esc(d.slot ?? '—')}${d.slotKind ? ` · ${esc(d.slotKind)}` : ''}${
        d.duds ? `<span class="dr-tag dr-t-warn">${esc(d.duds)} dud${d.duds === 1 ? '' : 's'}</span>` : ''}</div>
        ${marks(d.bits || [], (d.bits || []).map((_, i) => `bit ${i + 1}`))}`;
    case 'photoshoot':
      return `<div class="dr-sub">${esc(d.hazard || 'the shoot')}${
        d.best !== undefined ? `<span class="dr-tag dr-t-good">best ${Number(d.best).toFixed(1)}</span>` : ''}</div>
        ${marks(d.frames || [], (d.frames || []).map((_, i) => `frame ${i + 1}`))}`;
    case 'design':
      return `<div class="dr-sub">out of <b>${esc(d.material || '—')}</b>${
        d.difficulty !== undefined ? ` · difficulty ${esc(d.difficulty)}` : ''}</div>
        ${marks([d.buildQuality], ['the build'])}`;
    case 'talent-show':
      return `<div class="dr-sub"><b>${esc(d.talent || '—')}</b>${
        d.landed === false ? '<span class="dr-tag dr-t-warn">did not land</span>'
    : d.landed ? '<span class="dr-tag dr-t-good">landed it</span>' : ''}</div>`;
    case 'runway-challenge':
      return `<div class="dr-sub">${(d.cats || []).map(c => esc(c)).join(' · ') || 'three looks'}${
        d.repeated ? '<span class="dr-tag dr-t-warn">repeated a look</span>' : ''}</div>
        ${marks(d.walks || [], (d.walks || []).map((_, i) => `look ${i + 1}`))}`;
    case 'lipsync-challenge':
      return `<div class="dr-sub">${esc(d.wins ?? 0)}W &ndash; ${esc(d.losses ?? 0)}L${
        (d.wins || 0) >= 3 ? '<span class="dr-tag dr-t-good">assassin</span>' : ''}</div>`;
    case 'commercial':
      return `<div class="dr-sub">selling <b>${esc(d.product || '—')}</b>${
        d.foundAngle ? '<span class="dr-tag dr-t-good">found the angle</span>'
    : '<span class="dr-tag dr-t-warn">never found the angle</span>'}</div>`;
    case 'choreography':
      return `<div class="dr-sub">${d.solo ? 'took the solo' : 'in the line'}${
        d.blewFormation ? '<span class="dr-tag dr-t-warn">blew the formation</span>' : ''}</div>`;
    default:
      return '';
  }
}

function perfCard(name, perf, i, suffix, ep, id) {
  const body = detailFor(id, perf);
  return `<div class="dr-step" id="dr-step-${suffix}-${i}">
    <div class="dr-panel dr-a-score dr-row">
      ${_portrait(name, ep, { size: 54, station: true })}
      <div><h3 class="dr-disp">${esc(name)}${
    perf?.moment ? '<span class="dr-tag dr-t-note">moment</span>' : ''}</h3>${body}</div>
      <span class="dr-score dr-disp ${scoreClass(perf?.perf)}">${n1(perf?.perf)}</span>
    </div></div>`;
}

/* ══════════════════════════════════════════════════════════════════
   THE BALL — three looks, three judges, one leaderboard
   ══════════════════════════════════════════════════════════════════
   A ballroom scoring screen: each CATEGORY walks the full cast, then the
   next. Judges raise a paddle from 0 to 10 for each queen on each look,
   and the leaderboard re-sorts after every score. The final placement
   comes from the three-step rule — best score does not guarantee the win.
*/

const BALL_ROW_H = 38;

const BALL_CSS = `
/* ═══════════════════════════════════════════════════════
   THE MAIN STAGE — blue star-panel walls, silver runway,
   dramatic spotlights, crystalline glam
   ═══════════════════════════════════════════════════════ */

/* ── THE STAGE — blue-lit star panels + reflective floor ── */
.ball{position:relative;padding:28px 16px 34px;border-radius:6px;overflow:hidden;
  background:linear-gradient(180deg,#0a0820 0%,#0d1040 35%,#10143a 60%,#080618 100%)}
/* star-panel wall — a grid of lit squares behind everything */
.ball::before{content:"";position:absolute;inset:0;opacity:.35;pointer-events:none;
  background:
    radial-gradient(circle 3px at 32px 32px,rgba(140,180,255,.9),transparent 4px),
    radial-gradient(circle 3px at 96px 32px,rgba(140,180,255,.9),transparent 4px),
    radial-gradient(circle 3px at 160px 32px,rgba(140,180,255,.9),transparent 4px),
    radial-gradient(circle 3px at 224px 32px,rgba(140,180,255,.9),transparent 4px),
    radial-gradient(circle 3px at 288px 32px,rgba(140,180,255,.9),transparent 4px),
    radial-gradient(circle 3px at 32px 96px,rgba(140,180,255,.9),transparent 4px),
    radial-gradient(circle 3px at 96px 96px,rgba(140,180,255,.9),transparent 4px),
    radial-gradient(circle 3px at 160px 96px,rgba(140,180,255,.9),transparent 4px),
    radial-gradient(circle 3px at 224px 96px,rgba(140,180,255,.9),transparent 4px),
    radial-gradient(circle 3px at 288px 96px,rgba(140,180,255,.9),transparent 4px),
    repeating-linear-gradient(0deg,rgba(80,120,200,.12) 0 1px,transparent 1px 64px),
    repeating-linear-gradient(90deg,rgba(80,120,200,.12) 0 1px,transparent 1px 64px)}
/* runway spotlight wash from below */
.ball::after{content:"";position:absolute;bottom:0;left:0;right:0;height:55%;
  pointer-events:none;
  background:
    radial-gradient(ellipse 40% 70% at 50% 100%,rgba(180,200,255,.1),transparent),
    radial-gradient(ellipse 80% 40% at 50% 100%,rgba(255,215,80,.06),transparent),
    linear-gradient(0deg,rgba(200,210,255,.04),transparent 60%)}

/* ── CATEGORY BANNER — the runway call-out, lit from behind ── */
.ball-cat{position:relative;z-index:1;max-width:1000px;margin:8px auto 22px;
  padding:22px 24px 18px;border-radius:12px;overflow:hidden;
  background:
    radial-gradient(ellipse 120% 100% at 50% 0%,rgba(80,120,220,.2),transparent 70%),
    linear-gradient(145deg,rgba(20,30,80,.92),rgba(10,14,50,.96));
  border:1px solid rgba(100,140,255,.35);
  box-shadow:0 0 60px rgba(80,130,255,.2),0 0 120px rgba(80,130,255,.08),
    inset 0 1px 0 rgba(180,200,255,.12)}
/* shimmer stripe across the banner */
.ball-cat::before{content:"";position:absolute;inset:0;
  background:linear-gradient(105deg,transparent 30%,rgba(180,210,255,.06) 45%,
    rgba(180,210,255,.06) 55%,transparent 70%);
  pointer-events:none}
.ball-cat-num{position:absolute;top:10px;right:16px;
  font-family:'Space Mono',monospace;font-size:9px;letter-spacing:.22em;
  text-transform:uppercase;color:rgba(140,180,255,.6)}
.ball-cat h3{margin:0 0 4px;font-family:'Anton','Arial Narrow Bold',sans-serif;
  font-size:clamp(20px,3.5vw,30px);letter-spacing:.08em;text-transform:uppercase;
  color:#FFD23F;
  text-shadow:0 0 20px rgba(255,210,63,.8),0 0 60px rgba(255,210,63,.3),
    0 2px 4px rgba(0,0,0,.5)}
.ball-cat small{font-family:'Space Mono',monospace;font-size:9px;letter-spacing:.18em;
  text-transform:uppercase;color:rgba(180,200,255,.7)}
.ball-cat-bar{position:absolute;bottom:0;left:0;right:0;height:3px;
  background:linear-gradient(90deg,transparent,rgba(100,160,255,.6) 15%,#FFD23F 50%,
    rgba(100,160,255,.6) 85%,transparent)}
/* SEWN CATEGORY BANNER — she is building this one, golden border */
.ball-cat.ball-cat-sewn{
  border-color:rgba(255,210,63,.5);
  box-shadow:0 0 60px rgba(255,210,63,.2),0 0 120px rgba(255,210,63,.06),
    inset 0 1px 0 rgba(255,220,100,.15);
  background:
    radial-gradient(ellipse 120% 100% at 50% 0%,rgba(255,210,63,.12),transparent 70%),
    linear-gradient(145deg,rgba(30,24,10,.92),rgba(14,10,4,.96))}
.ball-cat.ball-cat-sewn .ball-cat-bar{
  background:linear-gradient(90deg,transparent,#FFD23F 15%,#FFD23F 85%,transparent)}
.ball-cat.ball-cat-sewn small{color:#FFD23F}

/* ── QUEEN WALK CARD — she hits the runway ── */
.ball-walk{position:relative;z-index:1;max-width:1000px;margin:0 auto 16px;
  display:grid;grid-template-columns:72px 1fr;gap:16px;align-items:start;
  padding:16px 18px 14px;border-radius:12px;
  background:
    linear-gradient(160deg,rgba(40,60,140,.18),rgba(8,10,30,.92) 40%),
    linear-gradient(0deg,rgba(180,200,255,.03),transparent 40%);
  border:1px solid rgba(100,140,255,.18);
  box-shadow:0 6px 30px rgba(0,0,20,.5),0 0 1px rgba(140,180,255,.3)}
/* left accent — the runway edge light */
.ball-walk::after{content:"";position:absolute;top:0;left:0;bottom:0;width:3px;
  border-radius:12px 0 0 12px;
  background:linear-gradient(180deg,rgba(100,160,255,.8),#FFD23F,rgba(100,160,255,.5))}
/* THE SEWN LOOK — golden glow, the one she built this morning */
.ball-walk.ball-sewn{
  background:
    linear-gradient(160deg,rgba(255,210,63,.1),rgba(8,10,30,.9) 50%),
    linear-gradient(0deg,rgba(255,210,63,.04),transparent 40%);
  border-color:rgba(255,210,63,.3);
  box-shadow:0 6px 30px rgba(0,0,20,.5),0 0 40px rgba(255,210,63,.1),
    0 0 1px rgba(255,210,63,.4)}
.ball-walk.ball-sewn::after{
  background:linear-gradient(180deg,#FFD23F,rgba(255,180,50,.6),#FFD23F)}
.ball-walk.ball-sewn .dr-por,.ball-walk.ball-sewn .dr-initials{
  border-color:rgba(255,210,63,.5);
  box-shadow:0 0 20px rgba(255,210,63,.35),0 0 40px rgba(255,210,63,.15)}
.ball-walk .dr-por,.ball-walk .dr-initials{border-radius:50%;
  border:2px solid rgba(180,200,255,.4);
  box-shadow:0 0 20px rgba(80,130,255,.35),0 0 40px rgba(80,130,255,.15)}
.ball-walk h4{margin:0 0 10px;font-size:15px;color:#fff;font-weight:700;
  letter-spacing:.03em;text-shadow:0 1px 3px rgba(0,0,0,.5)}

/* ── SCORE PADDLES — metallic gold cards that flip in ── */
.ball-paddles{display:flex;gap:10px;flex-wrap:wrap;align-items:center}
.ball-paddle{position:relative;display:inline-flex;flex-direction:column;align-items:center;
  gap:3px;padding:10px 12px 7px;border-radius:10px;min-width:66px;
  background:
    linear-gradient(170deg,rgba(255,225,120,.3),rgba(255,190,50,.1) 40%,rgba(255,170,30,.05));
  border:1px solid rgba(255,210,63,.55);
  box-shadow:0 0 24px rgba(255,210,63,.25),0 0 50px rgba(255,210,63,.08),
    inset 0 1px 0 rgba(255,255,200,.2),inset 0 -1px 0 rgba(0,0,0,.15);
  transform:rotateY(90deg);animation:ballFlip .5s cubic-bezier(.2,1.3,.4,1) forwards}
@keyframes ballFlip{to{transform:rotateY(0)}}
.ball-paddle b{font-family:'Anton','Arial Narrow Bold',sans-serif;font-size:32px;
  color:#FFD23F;line-height:1;
  text-shadow:0 0 10px rgba(255,210,63,1),0 0 30px rgba(255,210,63,.5),
    0 0 60px rgba(255,180,40,.2)}
.ball-paddle small{font-size:8px;letter-spacing:.08em;text-transform:uppercase;
  color:rgba(180,200,255,.7)}
/* the total badge */
.ball-paddle-sum{display:inline-flex;align-items:baseline;gap:5px;
  margin-left:8px;padding:5px 14px;border-radius:20px;
  background:linear-gradient(135deg,rgba(255,215,80,.2),rgba(255,200,50,.06));
  border:1px solid rgba(255,210,63,.4);
  box-shadow:0 0 16px rgba(255,210,63,.15)}
.ball-paddle-sum b{font-family:'Anton','Arial Narrow Bold',sans-serif;font-size:20px;
  color:#FFD23F;line-height:1;text-shadow:0 0 8px rgba(255,210,63,.6)}
.ball-paddle-sum small{font-size:8px;letter-spacing:.1em;
  color:rgba(180,200,255,.6)}

/* prose lines — lit-runway accent */
.ball-walk .dr-perf-line{margin:12px 0 2px;font-size:12.5px;line-height:1.6;
  color:rgba(220,225,255,.82);
  border-left:2px solid rgba(100,160,255,.4);padding-left:12px}

/* ── THE SIDEBAR SCOREBOARD — chrome + blue glass ── */
.ball-board{max-width:1000px;margin:0 auto 12px;border-radius:10px;overflow:hidden;
  border:1px solid rgba(100,140,255,.3);
  background:linear-gradient(180deg,rgba(10,14,50,.96),rgba(6,8,30,.98));
  box-shadow:0 4px 24px rgba(0,0,20,.4)}
.ball-bhead{display:flex;justify-content:space-between;align-items:baseline;
  padding:10px 14px;border-bottom:1px solid rgba(100,140,255,.22);
  background:linear-gradient(90deg,rgba(80,120,220,.12),transparent)}
.ball-bhead h4{margin:0;font-family:'Anton','Arial Narrow Bold',sans-serif;font-size:14px;
  letter-spacing:.14em;color:#FFD23F;text-transform:uppercase;
  text-shadow:0 0 12px rgba(255,210,63,.5)}
.ball-bhead span{font-family:'Space Mono',monospace;font-size:10px;
  color:rgba(180,200,255,.65)}
.ball-rows{position:relative;margin:8px 10px 10px}
.ball-row{position:absolute;left:0;right:0;top:0;height:${BALL_ROW_H - 4}px;
  display:grid;grid-template-columns:22px 28px auto 2fr 48px;
  gap:7px;align-items:center;padding:0 6px;border-radius:6px;
  transition:transform .62s cubic-bezier(.34,.9,.3,1),background .3s}
.ball-rank{font-family:'Space Mono',monospace;font-size:11px;
  color:rgba(140,180,255,.8);text-align:right;font-weight:700}
.ball-row .dr-por,.ball-row .dr-initials{border-radius:50%;display:block}
.ball-nm{font-size:11px;color:rgba(220,225,255,.92);font-weight:600;overflow:hidden;
  text-overflow:ellipsis;white-space:nowrap}
.ball-bar{height:8px;border-radius:4px;
  background:rgba(80,120,200,.1);overflow:hidden}
.ball-bar i{display:block;height:100%;border-radius:4px;
  background:linear-gradient(90deg,rgba(100,160,255,.7),#FFD23F);
  box-shadow:0 0 10px rgba(100,160,255,.4);
  transition:width .55s cubic-bezier(.2,.9,.25,1)}
.ball-pts{font-family:'Space Mono',monospace;font-size:13px;
  color:rgba(220,225,255,.85);text-align:right;font-weight:700}
/* just scored — golden flash */
.ball-row.ball-scored{background:linear-gradient(90deg,rgba(255,210,63,.22),transparent)}
.ball-row.ball-scored .ball-pts{color:#FFD23F;animation:ballTick .45s ease-out}
@keyframes ballTick{0%{transform:scale(1)}45%{transform:scale(1.7)}100%{transform:scale(1)}}
/* leader */
.ball-row.ball-top{background:linear-gradient(90deg,rgba(255,210,63,.18),transparent)}
.ball-row.ball-top .ball-pts{color:#FFD23F}
.ball-row.ball-top .ball-rank{color:#FFD23F}
/* bottom */
.ball-row.ball-btm{background:linear-gradient(90deg,rgba(255,50,90,.18),transparent)}
.ball-row.ball-btm .ball-pts{color:#FF6B8A}

/* ── PANEL PLACEMENT — the winner's spotlight ── */
.ball-final{position:relative;z-index:1;max-width:1000px;margin:24px auto;
  padding:20px;border-radius:12px;
  background:
    radial-gradient(ellipse 80% 60% at 50% 0%,rgba(255,210,63,.1),transparent 60%),
    linear-gradient(160deg,rgba(20,30,80,.9),rgba(8,10,30,.95));
  border:1px solid rgba(255,210,63,.35);
  box-shadow:0 0 80px rgba(255,210,63,.1),0 0 40px rgba(80,130,255,.08)}
.ball-final h3{margin:0 0 16px;font-family:'Anton','Arial Narrow Bold',sans-serif;
  font-size:20px;letter-spacing:.12em;text-transform:uppercase;color:#FFD23F;
  text-shadow:0 0 20px rgba(255,210,63,.8),0 0 50px rgba(255,210,63,.3)}
.ball-final-row{display:grid;grid-template-columns:30px 44px 1fr 54px;
  gap:10px;align-items:center;padding:10px 12px;border-radius:10px;margin-bottom:6px;
  background:rgba(40,60,140,.08);transition:background .3s}
.ball-final-row.ball-f-win{
  background:linear-gradient(90deg,rgba(255,210,63,.2),rgba(80,120,220,.08));
  border:1px solid rgba(255,210,63,.3);
  box-shadow:0 0 30px rgba(255,210,63,.1)}
.ball-final-row.ball-f-win .ball-final-pos{color:#FFD23F;font-weight:700}
.ball-final-row.ball-f-btm{background:linear-gradient(90deg,rgba(255,50,90,.12),transparent)}
.ball-final-row .dr-por,.ball-final-row .dr-initials{border-radius:50%;
  box-shadow:0 0 10px rgba(80,130,255,.2)}
.ball-final-pos{font-family:'Space Mono',monospace;font-size:13px;
  color:rgba(140,180,255,.8);text-align:right}
.ball-final-nm{font-size:13px;color:#fff;font-weight:600}
.ball-final-sc{font-family:'Space Mono',monospace;font-size:12px;
  color:rgba(220,225,255,.75);text-align:right}

@media(prefers-reduced-motion:reduce){
  .ball-row,.ball-bar i,.ball-paddle{transition:none;animation:none;transform:none}
  .ball-row.ball-scored .ball-pts{animation:none}
}
`;

function rpBuildBall(row) {
  const ep = epOf(row);
  const ch = row?.dr?.challenge;
  const perfs = row?.dr?.performances || {};
  const names = Object.keys(perfs);
  if (!ch || !names.length) return '';
  const a = row?.dr?.assignment || {};
  const order = (a.order || []).filter(n => perfs[n]);
  const running = order.length ? order : names;

  const panelViews = row?.dr?.panel?.views || {};
  const judgeIds = Object.keys(panelViews).slice(0, 3);
  const judgeNames = judgeIds.map(id => {
    const j = JUDGES.find(x => x.id === id);
    return j ? j.name.split(' ')[0] : id;
  });

  const firstDetail = perfs[running[0]]?.detail || {};
  const numLooks = (firstDetail.looks || []).length || 3;
  const lookCategories = (firstDetail.looks || []).map(l => l.label);
  const lookMeta = (firstDetail.looks || []).map(l => ({ sewn: l.sewn }));
  const theme = firstDetail.theme || 'the ball';

  /* ── BUILD STEPS: per CATEGORY, not per queen ──
     Look 1 → all queens walk → Look 2 → all queens walk → Look 3 → all queens.
     This is how the real ball works: one runway pass per category. */
  const steps = [];
  const sfx = 'ball';
  for (let li = 0; li < numLooks; li++) {
    for (const name of running) {
      const d = perfs[name]?.detail || {};
      const look = (d.looks || [])[li] || { label: `Look ${li + 1}`, score: 5, sewn: false };
      const jScores = _paddlesFor(row, name, look, d.looks || [], judgeIds, li);
      steps.push({ name, look, lookIdx: li, jScores });
    }
  }

  /* ── PROSE: engine prose on the SEWN look, runway reads on the rest ──
     The engine writes one block per queen about her whole ball ("three looks,
     one voice..."). That belongs on the sewn look — the climax, where the
     judges have seen the full trio. The earlier runway walks get short
     per-look commentary generated from the score so they are never bare.
     The filter is TIGHT: only `perform:ball` (the performance narration),
     `maxi:wardrobe-malfunction` (the garment failing on the runway), and
     `chal:performance-moment`. Werk room scenes like reads, shade, and
     rivalry carry a `maxi:` prefix too and would leak in here otherwise. */
  /* `maxi:showstopper` BELONGS HERE TOO, and was the one ball event this
     allowlist did not name. The ball fires exactly two — a garment failing on
     the runway and a look that stops the room — and only the failure had a
     screen, so the best thing that can happen at a ball was written, fired,
     and drawn nowhere. It surfaced when an unrelated change shifted the
     season draw and `showstopper` started landing in the sweep's seasons:
     "written scenes that no screen draws: maxi:showstopper". An allowlist is
     only ever as complete as the day somebody wrote it. */
  const maxiScenes = (row.dr.scenes || []).filter(sc => sc.text
    && sc.step !== 'prep'
    && /^(perform:ball|maxi:wardrobe|maxi:showstopper|chal:performance)/.test(sc.kind || ''));
  const proseByQueen = {};
  const usedScene = new Set();
  for (const name of running) {
    proseByQueen[name] = maxiScenes.filter(sc => {
      if (usedScene.has(sc)) return false;
      if ((sc.data?.players || [])[0] !== name) return false;
      usedScene.add(sc);
      return true;
    }).map(sc => sc.text);
  }

  const _runwayRead = (name, score, label) => {
    const lo = label.toLowerCase();
    if (score >= 9) return `${name} owns the ${lo} category. The look is immaculate and the walk sells it twice.`;
    if (score >= 7) return `A strong ${lo} from ${name}. The look reads from the back of the room and the silhouette is clean.`;
    if (score >= 5) return `${name} walks the ${lo} competently — nothing wrong, nothing the panel will remember tomorrow.`;
    if (score >= 3) return `The ${lo} does not land. ${name} walks it with commitment but the look itself is the problem.`;
    return `${name}'s ${lo} is a miss. The concept is unclear and the execution does not rescue it.`;
  };

  let stepIdx = 0;
  const html = [];
  let lastLookIdx = -1;

  for (const s of steps) {
    if (s.lookIdx !== lastLookIdx) {
      const meta = lookMeta[s.lookIdx] || {};
      html.push(`<div class="dr-step" id="dr-step-${sfx}-${stepIdx}">
        <div class="ball-cat${meta.sewn ? ' ball-cat-sewn' : ''}">
          <span class="ball-cat-num">look ${s.lookIdx + 1} of ${numLooks}</span>
          <h3>${esc(lookCategories[s.lookIdx] || `Look ${s.lookIdx + 1}`)}</h3>
          <small>${meta.sewn ? '✂ constructed on the day' : 'brought from home'}</small>
          <i class="ball-cat-bar"></i>
        </div></div>`);
      stepIdx++;
      lastLookIdx = s.lookIdx;
    }

    const paddleTotal = s.jScores.reduce((a, b) => a + b, 0);
    const paddleHtml = s.jScores.map((sc, ji) =>
      `<span class="ball-paddle" style="animation-delay:${(ji * 0.14).toFixed(2)}s">
        <b>${sc}</b><small>${esc(judgeNames[ji] || `J${ji + 1}`)}</small></span>`
    ).join('')
      + `<span class="ball-paddle-sum"><b>${paddleTotal}</b><small>total</small></span>`;

    let lines;
    if (s.look.sewn) {
      lines = (proseByQueen[s.name] || [])
        .map(t => `<p class="dr-perf-line">${esc(t)}</p>`).join('');
    } else {
      const read = _runwayRead(s.name, s.look.score, s.look.label);
      lines = `<p class="dr-perf-line">${esc(read)}</p>`;
    }

    html.push(`<div class="dr-step" id="dr-step-${sfx}-${stepIdx}">
      <div class="ball-walk${s.look.sewn ? ' ball-sewn' : ''}">
        ${_portrait(s.name, ep, { size: 60, station: true })}
        <div><h4 class="dr-disp">${esc(s.name)}${
      s.look.fit ? '<span class="dr-tag dr-t-good">in her element</span>' : ''}${
      s.look.sewn && (s.look.score > 9) ? '<span class="dr-tag dr-t-note">showstopper</span>' : ''}</h4>
          <div class="ball-paddles">${paddleHtml}</div>
          ${lines}</div>
      </div></div>`);
    stepIdx++;
  }

  const ranking = row?.dr?.panel?.ranking || [];

  /* ── THE NUMBER IN THIS LIST HAS TO BE THE ONE THE LIST IS ABOUT ──
     This row printed `perf` -- the raw challenge score -- beside a position
     taken from the panel's ranking, which is a different quantity arrived at
     a different way (js/dr/judging.js weighs perf, runway, risk, polish, the
     judge's style bias and what she remembers, then merges four opinions into
     a mean rank, and the host may still move somebody two places). So the
     column never sorted: a queen could sit fifth showing 8.5 above a second
     place showing 7.2, and the screen looked broken because it was claiming a
     relationship that did not exist.
     The paddle total is the honest partner for it. It is the number the
     scoreboard has been counting up all night in front of the viewer, so the
     placement now reads as "the panel saw it differently, and here is the
     score it differed from". */
  const paddleTotals = {};
  for (const st of steps) {
    paddleTotals[st.name] = (paddleTotals[st.name] || 0)
      + st.jScores.reduce((a, b) => a + b, 0);
  }

  html.push(`<div class="dr-step" id="dr-step-${sfx}-${stepIdx}">
    <div class="ball-final"><h3>Panel placement</h3>${
    (ranking.length ? ranking : running.map((n, i) => ({ name: n, panelRank: i + 1 }))).map((r, i) => {
      const cls = i === 0 ? 'ball-f-win' : i >= ranking.length - 2 ? 'ball-f-btm' : '';
      return `<div class="ball-final-row ${cls}">
        <span class="ball-final-pos">${i + 1}</span>
        ${_portrait(r.name, ep, { size: 36 })}
        <span class="ball-final-nm dr-disp">${esc(r.name)}</span>
        <span class="ball-final-sc">${paddleTotals[r.name] ?? 0}</span></div>`;
    }).join('')}</div></div>`);
  stepIdx++;
  const totalSteps = stepIdx;

  const board = `<div class="ball-board">
    <div class="ball-bhead"><h4>Scoreboard</h4>
      <span id="ball-count">0 / ${steps.length} scores</span></div>
    <div class="ball-rows" id="ball-rows" style="height:${running.length * BALL_ROW_H}px">${
    running.map((n, i) => `<div class="ball-row" data-q="${esc(n)}" style="transform:translateY(${i * BALL_ROW_H}px)">
      <span class="ball-rank">${i + 1}</span>${_portrait(n, ep, { size: 26 })}
      <span class="ball-nm">${esc(n)}</span>
      <span class="ball-bar"><i style="width:0%"></i></span>
      <span class="ball-pts">0</span>
    </div>`).join('')}</div></div>`;

  if (typeof window !== 'undefined') {
    window._drBallData = { steps, running, rowH: BALL_ROW_H, judgeNames, totalSteps, numLooks };

    window._drSidebar = window._drSidebar || {};
    const sidebarPanels = [];
    const cumPts = Object.fromEntries(running.map(n => [n, 0]));
    let prevLookIdx = -1;

    for (let qi = 0; qi < steps.length; qi++) {
      const s = steps[qi];
      if (s.lookIdx !== prevLookIdx) {
        sidebarPanels.push(_ballSidebarPanel(running, cumPts, ep));
        prevLookIdx = s.lookIdx;
      }
      const jTotal = s.jScores.reduce((a, b) => a + b, 0);
      cumPts[s.name] = (cumPts[s.name] || 0) + jTotal;
      sidebarPanels.push(_ballSidebarPanel(running, cumPts, ep));
    }
    sidebarPanels.push(_ballSidebarPanel(running, cumPts, ep, true));
    window._drSidebar[sfx] = sidebarPanels;

    window._drRevealExtra = window._drRevealExtra || {};
    window._drRevealExtra[sfx] = (upToIdx) => {
      const d = window._drBallData;
      if (!d) return;

      const pts = Object.fromEntries(d.running.map(n => [n, 0]));
      let scoreSteps = 0;
      let domStep = 0;
      let prevLI = -1;
      for (let qi = 0; qi < d.steps.length; qi++) {
        const s = d.steps[qi];
        if (s.lookIdx !== prevLI) { domStep++; prevLI = s.lookIdx; }
        domStep++;
        if (domStep - 1 > upToIdx) break;
        pts[s.name] += s.jScores.reduce((a, b) => a + b, 0);
        scoreSteps++;
      }

      const order = [...d.running].sort((a, b) => pts[b] - pts[a] || a.localeCompare(b));
      const max = Math.max(1, ...Object.values(pts));
      const done = upToIdx >= d.totalSteps - 2;
      const justName = scoreSteps > 0 ? d.steps[scoreSteps - 1]?.name : null;

      const rows = new Map([...document.querySelectorAll('.ball-row')]
        .map(el => [el.getAttribute('data-q'), el]));
      order.forEach((n, r) => {
        const el = rows.get(n);
        if (!el) return;
        el.style.transform = `translateY(${r * d.rowH}px)`;
        el.querySelector('.ball-rank').textContent = scoreSteps ? r + 1 : '–';
        el.querySelector('.ball-bar i').style.width = `${Math.round((pts[n] / max) * 100)}%`;
        el.querySelector('.ball-pts').textContent = pts[n];
        el.classList.toggle('ball-scored', !!justName && n === justName && !done);
        el.classList.toggle('ball-top', done && r === 0);
        el.classList.toggle('ball-btm', done && r >= order.length - 2);
      });

      const count = document.getElementById('ball-count');
      if (count) count.textContent = `${scoreSteps} / ${d.steps.length} scores`;
    };
  }

  return `<style>${CHAL_CSS}${BALL_CSS}</style>${_shell(
    `<div class="dr-fam dr-chal dr-chal-ball ball">${ambientFor('ball')}${html.join('')}</div>`, ep, {
      phase: 'stage', title: ch.name || theme, subtitle: 'three looks, one queen',
      sidebar: board,
    })}${_controls(sfx, totalSteps, ep.num)}`;
}

/**
 * The paddles a queen actually got, from the judges who actually scored her.
 *
 * THE SCOREBOARD WAS NOT THE SCORE. `_derivePaddleScores` below invented the
 * paddles from her look score plus a hash of her name, and nothing downstream
 * read them -- while the week was decided by `judgeViews`, which weighs her
 * performance alongside risk, polish, the seat's own style bias, what it
 * remembers and the night's form. The two could disagree completely: reported
 * from a played Ball, a queen sat top of the placement list on a scoreboard
 * total of 40 while the queen on 73 placed third, and the 40 won the night.
 * A viewer watched a number climb for eight minutes and then watched it not
 * matter.
 *
 * So the paddles come from `panel.views` -- each judge's own number for that
 * queen, which is what a paddle IS. Scaled to the 0-10 a paddle can show,
 * against the spread of this episode's own views so the board uses its range.
 * The per-look variation is the look's deviation from her own three, so a
 * better look still scores better and her total still lands where the panel
 * put her.
 *
 * Falls back to the old derivation for a row with no views on it -- an older
 * save, or a week run by a test.
 */
function _paddlesFor(row, name, look, looks, judgeIds, lookIdx) {
  const views = row?.dr?.panel?.views;
  if (!views) return _derivePaddleScores(look.score, judgeIds.length, name, lookIdx);

  /* ── THE PADDLE IS THAT JUDGE'S PLACING, NOT HER RAW NUMBER ──────
     Scaling the raw `view` got the board and the panel agreeing 86% of the
     time and no further, because they are different aggregations: the panel
     ranks on the MEAN RANK across judges, and a total of raw scores is a
     different election. Building each paddle from that judge's own rank of
     her makes the column at the end sum to exactly what the panel decided,
     and it is the truer object anyway -- a paddle is a placing held up, not a
     spreadsheet cell. A split panel still shows its split, because a judge
     who put her last holds up a low number whatever the others think. */
  const field = (views[Object.keys(views)[0]] || []).length || 1;

  // How this look compares with her other two: the reason a paddle moves
  // between categories at all.
  const mine = looks.map(l => l.score);
  const mean = mine.length ? mine.reduce((a, b) => a + b, 0) / mine.length : look.score;
  const dev = Math.max(-2, Math.min(2, (look.score - mean) * 0.6));

  /* ── THE TOTAL IS FIXED FIRST, THEN SPREAD OVER THE LOOKS ────────
     Rounding each look independently let a close pair swap once the three
     were added up, so the board still disagreed with the panel on about one
     ball in six. Her total for a judge is decided from that judge's view and
     the per-look numbers are made to sum to it: the looks still differ from
     each other, and the column at the end is the panel's own order. */
  const n = Math.max(1, looks.length || 1);
  return judgeIds.map(id => {
    const row2 = (views[id] || []).find(r => r.name === name);
    if (!row2) return _derivePaddleScores(look.score, 1, name, lookIdx)[0];
    const scaled = field > 1
      ? 10 - ((row2.rank - 1) / (field - 1)) * 8                // 10 best .. 2 worst
      : 6;
    const target = Math.round(scaled * n);                     // her total
    // Deal the total out, biased by how each look compared with her others.
    const devs = looks.map(l => Math.max(-2, Math.min(2, (l.score - mean) * 0.6)));
    const want = devs.map(dv => scaled + dv);
    const got = want.map(v => Math.max(0, Math.min(10, Math.round(v))));
    // Push the rounding error onto the looks that can absorb it, so the sum
    // is exact without any single paddle leaving 0..10.
    let drift = target - got.reduce((a, b) => a + b, 0);
    for (let pass = 0; pass < 3 && drift !== 0; pass++) {
      for (let i = 0; i < got.length && drift !== 0; i++) {
        const step = drift > 0 ? 1 : -1;
        const next = got[i] + step;
        if (next >= 0 && next <= 10) { got[i] = next; drift -= step; }
      }
    }
    return got[lookIdx] ?? got[0];
  });
}

/** The old derivation, kept for rows that carry no panel views. */
function _derivePaddleScores(lookScore, numJudges, name, lookIdx) {
  const n = numJudges || 3;
  const base = Math.max(0, Math.min(10, lookScore));
  const scores = [];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
  for (let j = 0; j < n; j++) {
    const seed = Math.abs(hash * 31 + j * 17 + lookIdx * 7);
    const wobble = ((seed % 30) - 15) / 10;
    scores.push(Math.max(0, Math.min(10, Math.round(base + wobble))));
  }
  return scores;
}

function _ballSidebarPanel(running, cumPts, ep, isFinal = false) {
  const sorted = [...running]
    .map(n => ({ n, p: cumPts[n] || 0 }))
    .sort((a, b) => b.p - a.p);
  return `<h4 class="dr-disp">${isFinal ? 'Final scores' : 'Scoreboard'}</h4>${
    sorted.map(({ n, p }) => `<div class="dr-slot">${_portrait(n, ep, { size: 32 })}
      <div><div class="dr-nm">${esc(n)}</div></div>
      <span class="dr-chip ${p >= 50 ? 'dr-c-win' : p >= 30 ? 'dr-c-high' : p >= 15 ? 'dr-c-safe' : 'dr-c-low'}">${p}</span>
    </div>`).join('')}`;
}

/* ── the screens ────────────────────────────────────────────────── */

/** The mini: who won it and what the win buys. */
/**
 * The set for the three screens where the host walks in and tells them
 * something: the mini, the brief and the draft.
 *
 * All three are the same moment structurally — the room is working, the door
 * goes, and everything stops — and all three were drawn on the werk room's
 * gradient with no door in it. The set is that door: a lit rectangle at the
 * back with the room falling away from it, and a floor the announcement
 * lands on. The brief gets it brightest, because that is the one the whole
 * week hangs off.
 */
const briefSet = kind => `<div class="dr-doorway dr-door-${kind}" aria-hidden="true">
    <i class="dr-door-light"></i><i class="dr-door-floor"></i></div>`;

export function rpBuildMini(row) {
  const ep = epOf(row);
  const m = row?.dr?.mini;
  if (!m) return '';
  const scenes = (row.dr.scenes || []).filter(s => s.step === 'mini' && s.text);
  /* NOUN PHRASES, BECAUSE THEY ARE DROPPED INTO A SENTENCE.
     `captain` read "she picks the teams", a whole clause, and the two places
     that use this map say "Whoever takes it takes ${prize}." and "She takes
     ${prize}." — so every captaincy mini in the show rendered the sentence
     "Whoever takes it takes she picks the teams."
     AND THE MAP HAD DRIFTED OFF THE DATA. js/dr/data/minis.js uses exactly
     four values — pick-order, captain, first-pick and prize — and this
     carried `immunity` and `advantage`, which nothing has ever set, while
     missing two of the four that are real. `pick-order` therefore fell
     through to the raw slug and drew the literal string "pick-order" on the
     card. A test now checks the two agree. */
  const BUYS = {
    'pick-order': 'first choice when the parts go out',
    captain: 'the captaincy, and the right to pick the teams',
    'first-pick': 'first pick of the draft',
    prize: 'a prize, and a moment on screen',
  };
  /* THE LEAD SAYS WHAT IS AT STAKE, NOT WHO WON IT. It read "Priya takes it
     — and with it, pick-order" above eleven unrevealed beats: the screen
     announced the winner before the challenge it is a recording of had been
     watched. The rail did the same at every index. The prize is the right
     thing to open with; the winner is the thing the last click is for. */
  const prize = esc(BUYS[m.buys] || m.buys || 'the bragging rights');
  const lead = `<div class="dr-brief">
    <span class="dr-fmt">Mini challenge</span>
    <h3 class="dr-disp">${esc(m.name)}</h3>
    <p>Whoever takes it takes ${prize}.</p>
  </div>`;
  /* WHO SHE WAS AIMING AT, WHICH THE SCREEN NEVER SAID. A reading mini is
     one queen reading ANOTHER — `mini.detail[queen] = { target, pulled }`
     has carried that since the mini engine was written, and the card drew a
     portrait and a paragraph, so the whole point of the format ("she read
     HER, and it landed") was in the data and nowhere on the page.
     Three of the seven minis are `targets` and one is `pairs`; a solo mini
     has no target and simply does not draw the arrow. */
  const aimOf = n => (m.detail?.[n]?.target) || null;
  const landed = n => !!m.detail?.[n]?.pulled;

  const steps = scenes.map((sc, i) => {
    const who = (sc.data?.players || [])[0];
    const at = who ? aimOf(who) : null;
    return `<div class="dr-step" id="dr-step-mini-${i}">
      <div class="dr-panel dr-a-score dr-card dr-minirow">
        <div class="dr-aim">
          ${who ? _portrait(who, ep, { size: 46 }) : '<span></span>'}
          ${at ? `<span class="dr-aim-arrow ${landed(who) ? 'dr-hit' : ''}"></span>
            ${_portrait(at, ep, { size: 34, cls: 'dr-aim-target' })}` : ''}
        </div>
        <div>${who ? `<h3 class="dr-disp">${esc(who)}</h3>` : ''}
          ${at ? `<span class="dr-aim-k">reads ${esc(at)}${
    landed(who) ? ' — and it lands' : ''}</span>` : ''}
          ${_note(sc) ? `<span class="dr-note">${esc(_note(sc))}</span>` : ''}
          <p>${esc(sc.text)}</p></div>
      </div></div>`;
  }).join('');

  // The result, as the last card rather than as the headline.
  const winStep = m.winner ? `<div class="dr-step" id="dr-step-mini-${scenes.length}">
    <div class="dr-panel dr-miniwin">
      ${_portrait(m.winner, ep, { size: 64, station: true })}
      <div><span class="dr-fmt">Wins the mini</span>
        <b class="dr-disp">${esc(m.winner)}</b>
        <p>She takes ${prize}.</p></div>
    </div></div>` : '';
  const total = scenes.length + (m.winner ? 1 : 0);

  if (typeof window !== 'undefined') {
    window._drSidebar = window._drSidebar || {};
    window._drSidebar.mini = Array.from({ length: total }, (_, i) =>
      `<h4 class="dr-disp">The mini</h4><p style="font-size:13px">${esc(m.name)}<br>
       <span style="color:#C9A6BC">Worth ${prize}.</span>${
  m.winner && i >= total - 1 ? `<br><br>Won by <b>${esc(m.winner)}</b>` : ''}</p>`);
  }
  /* ── WERK_CSS IS WHAT STYLES A CARD ──
     `.dr-card` lives there — the gradient, the hairline along the top edge and
     the shadow that lifts it off the set — and this screen was the only one
     building rows without it, which is the whole of why the mini read as
     older than everything around it. `.dr-minirow` keeps the aim arrow's
     layout; the card is the surface it sits on. */
  return `<style>${CHAL_CSS}${WERK_CSS}</style>${_shell(
    `<div class="dr-brief-room">${briefSet('mini')}${lead}${steps}${winStep}</div>`, ep, {
      phase: 'werk', title: 'The Mini Challenge', subtitle: esc(m.name),
    sidebar: `<h4 class="dr-disp">The mini</h4><p style="font-size:13px">${esc(m.name)}<br>
      <span style="color:#C9A6BC">Worth ${prize}.</span></p>`,
    })}${_controls('mini', Math.max(1, total), ep.num)}`;
}

/**
 * The brief. The catalogue's `desc` IN FULL — it is the only place the
 * viewer learns what the queens are physically doing.
 */
/**
 * The groups, with the queens actually in them.
 *
 * A team challenge said "2 teams." and then printed the two band names on
 * one line — every roster the engine had built was on `assignment.teams`,
 * indexed against `teamNames`, and drawn nowhere. Who is in a group with
 * whom is the thing a team challenge IS, and the brief was the last screen
 * before the room split up.
 *
 * Roles come off the picks, so a lead reads as a lead here rather than
 * being something you work out later from a score.
 */
function _teamBoard(a, ep) {
  const teams = a?.teams || [];
  if (teams.length < 2) return '';
  const names = a.teamNames || a.theme?.names || [];
  return `<div class="dr-teams">${teams.map((members, i) => `
    <div class="dr-team">
      <div class="dr-team-k dr-disp">${esc(names[i] || `Group ${i + 1}`)}</div>
      ${(members || []).map(n => `<div class="dr-team-q">
        ${_portrait(n, ep, { size: 34 })}
        <b>${esc(n)}</b>
        ${a.picks?.[n]?.role ? `<i>${esc(a.picks[n].role)}</i>` : ''}
      </div>`).join('')}
    </div>`).join('')}</div>`;
}

export function rpBuildMaxiAnnounce(row) {
  const ep = epOf(row);
  const ch = row?.dr?.challenge;
  if (!ch) return '';
  const cat = maxiById(ch.id) || {};
  const a = row?.dr?.assignment || {};
  const scenes = (row.dr.scenes || []).filter(s => s.step === 'maxi-announce' && s.text);

  const lead = `<div class="dr-brief">
    <span class="dr-fmt">${esc(cat.format || ch.format || 'maxi challenge')}</span>
    <h3 class="dr-disp">${esc(ch.name)}</h3>
    <p>${esc(cat.desc || 'The brief is on the table.')}</p>
    ${_trackLine(row)}
  </div>
  ${_teamBoard(a, ep)}`;
  /* WHO IS TALKING, WHICH THIS SCREEN NEVER SAID.
     Three different people speak on this night — the host walks in, the host
     explains the week, and then individual queens react to it — and all three
     were drawn as the same anonymous card with a paragraph in it. The main
     stage draws its panel and the prep room draws a portrait per scene; the
     one screen where RuPaul actually enters the room drew nobody at all.
     OUT OF DRAG, deliberately. She arrives in the werk room in a suit, and
     `portraitStage` is the other picture — the one for the night she hosts
     from the main stage. A screen that uses the wrong one is wrong twice,
     which is why js/dr/data/judges.js carries both. */
  /* ── HOW THE ROOM TOOK IT ──
     The brief is the moment the host says what the week is, and half the
     room lights up while half of it dies inside. Every reaction carries a
     TIER — delighted, braced, dreading — and the screen spent it on
     nothing: identical paragraphs where the entire point is that they
     disagree.
     A board of faces above the cards, each taking her verdict's colour as
     her card is read. A queen the engine gave no reaction stays neutral
     rather than being dropped: she is in the room either way, and a face
     missing from a board reads as a queen missing from the week. */
  const TIER_COLOUR = { delighted: '#3BE08A', braced: '#FFC83D', dreading: '#FF294B' };
  /* THE ROOM AT THE START OF THE NIGHT, not the end of it. `dr.living` is
     who is left AFTER the elimination, and the brief happens hours before
     that — so the queen who goes home tonight heard the brief, reacted to
     it, had a card on this very screen, and was missing from the board
     about it. Caught by the board itself: her card said "dreading" and her
     face was not there to say it.
     `houseAtStart` is the honest list; living plus tonight's exits is the
     same thing for a row that does not carry one. */
  const room = (row?.houseAtStart?.length ? row.houseAtStart
    : [...(row?.dr?.living || []), ...(row?.exits || []).map(x => x.name)])
    .filter(Boolean);
  const board = room.length ? `<div class="dr-reax" id="dr-reax">
      ${room.map(n => `<div class="dr-reax-q" data-queen="${esc(n)}">
        ${_portrait(n, ep, { size: 40 })}<b>${esc(n)}</b><i></i>
      </div>`).join('')}
    </div>` : '';

  if (typeof window !== 'undefined') {
    const upTo = []; const seen = {};
    for (const sc of scenes) {
      const w = (sc.data?.players || [])[0];
      if (w && sc.data?.tier) seen[w] = sc.data.tier;
      upTo.push({ ...seen });
    }
    window._drRevealExtra = window._drRevealExtra || {};
    window._drRevealExtra.announce = (idx) => {
      const at = upTo[Math.max(0, Math.min(idx, upTo.length - 1))] || {};
      for (const el of document.querySelectorAll('#dr-reax .dr-reax-q')) {
        const t = idx >= 0 ? at[el.getAttribute('data-queen')] : null;
        el.classList.toggle('on', !!t);
        el.style.setProperty('--took', t ? (TIER_COLOUR[t] || '#C9A6BC') : 'transparent');
        const tag = el.querySelector('i');
        if (tag) tag.textContent = t || '';
      }
    };
  }

  const steps = scenes.map((sc, i) => {
    const host = /host-arrives|the-brief/.test(sc.kind || '');
    const who = (sc.data?.players || [])[0];
    const t = sc.data?.tier;
    const col = !host && t && TIER_COLOUR[t];
    const face = host ? _judgePortrait('rupaul', { size: 46 })
      : who ? _portrait(who, ep, { size: 46 }) : '';
    return `<div class="dr-step" id="dr-step-announce-${i}">
      <div class="dr-panel ${host ? 'dr-a-score' : 'dr-a-room'} dr-row${col ? ' dr-hasreact' : ''}"
        style="padding:14px 16px 14px 20px${col ? `;--took:${col}` : ''}">
        ${face}
        <div>${col ? `<span class="dr-reax-k">${esc(t)}</span>` : ''}
          <p style="margin:0;color:#f4e3ed">${esc(sc.text)}</p>
          ${host ? '<span class="dr-sub">the host</span>' : ''}</div>
      </div></div>`;
  }).join('');
  return `<style>${CHAL_CSS}</style>${_shell(
    `<div class="dr-brief-room">${briefSet('brief')}${lead}${board}${steps}</div>`, ep, {
      phase: 'werk', title: 'The Maxi Challenge', subtitle: 'the brief',
    })}${_controls('announce', Math.max(1, scenes.length), ep.num)}`;
}

/**
 * What a queen actually took, as words.
 *
 * The draft board read `p.name || p.role || who` — and `p.name` is the
 * QUEEN'S name, which every pick carries, so the condition never fell
 * through and the board drew nine chips each labelled with the name of the
 * queen standing next to it. What she picked is on `p.choice`, and was
 * being read by nothing.
 *
 * Snatch Game's pool has authored names; every other challenge's choices are
 * slugs, so a slug is title-cased rather than printed raw.
 */
function _choiceLabel(p) {
  const id = p?.choice || p?.pick || p?.part || '';
  if (!id) return '';
  return characterById(id)?.name
    || String(id).replace(/-/g, ' ').replace(/[a-z]/g, c => c.toUpperCase());
}

/* THE SAME ROOM AS werk.js DRAWS, for the one screen in this file that
   happens in it. Copied rather than imported: a stylesheet constant is not
   worth a module dependency, and the two are meant to look identical — if
   they ever drift, prep is the one that is wrong. */
/* ══════════════════════════════════════════════════════════════════════
   THE DRAFT BOARD
   ══════════════════════════════════════════════════════════════════════
   A draft is a board with names coming off it, so it is drawn as one: a
   numbered order down the left of each seat, the pick beside the name, and a
   red strike on the queen who reached for something that had gone. On a
   night with nothing contested the numbers disappear — there is no order to
   pick in — and the board becomes a line-up of what everybody is doing, with
   the clashes marked instead, because two queens landing on the same act is
   the only jeopardy that kind of night has. */
const DRAFT_CSS = `
.dr-draft{position:relative}
.dr-boardwrap{position:relative;z-index:2;margin:0 0 18px;border-radius:10px;overflow:hidden;
  border:1px solid rgba(124,58,237,.35);background:rgba(16,6,26,.86);
  box-shadow:0 20px 44px -26px rgba(0,0,0,.95)}
.dr-boardhead{display:flex;justify-content:space-between;align-items:baseline;gap:12px;
  padding:9px 14px;border-bottom:1px solid rgba(124,58,237,.3);
  background:linear-gradient(90deg,rgba(123,47,247,.22),transparent)}
.dr-boardhead b{font-size:14px;letter-spacing:.14em;text-transform:uppercase;color:#E9D5FF}
.dr-boardhead span{font-family:'Space Mono',ui-monospace,monospace;font-size:10px;color:#c4b5fd}
.dr-seats{display:grid;grid-template-columns:repeat(auto-fill,minmax(212px,1fr));gap:8px;
  padding:11px}
/* Two casts doing the same script. Banded and labelled, because thirteen
   queens in one ungrouped list numbered 1..13 is how the first-picker of the
   second cast came out looking like seat 8 of a stitch-up. */
.dr-cast + .dr-cast{border-top:1px solid rgba(124,58,237,.28)}
.dr-casthead{display:block;padding:8px 14px 0;font-size:11px;letter-spacing:.16em;
  text-transform:uppercase;color:#c4b5fd}
.dr-cast .dr-seats{padding-top:7px}
.dr-seat{position:relative;display:grid;grid-template-columns:auto auto 1fr;gap:10px;
  align-items:center;padding:8px 10px;border-radius:8px;
  background:linear-gradient(180deg,rgba(124,58,237,.16),rgba(30,10,50,.5));
  border:1px solid rgba(196,181,253,.16)}
/* The slot she picked in. Gone entirely when nothing was contested: a
   number implies an order, and an order implies somebody went last. */
.dr-seat-n{font-style:normal;font-family:'Space Mono',ui-monospace,monospace;font-size:11px;
  color:#c4b5fd;min-width:16px;text-align:right}
.dr-seat .dr-por,.dr-seat .dr-initials{border-radius:50%;display:block}
.dr-seat-b{min-width:0}
.dr-seat-b b{display:block;font-size:13px;letter-spacing:.03em;color:#fff;
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dr-seat-took{display:block;font-size:11px;color:#E9D5FF;opacity:.92;
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
/* NOT UPPERCASE. It was, and it fits a name plus a part plus a verb -- "wanted
   The Returning Twin, Cupcakke took it" -- which ran to three lines of small
   caps inside a card 212px wide and buried the row it was annotating. */
.dr-seat-b u{display:block;text-decoration:none;font-size:9.5px;letter-spacing:.02em;
  color:#FF7A9A;margin-top:2px;line-height:1.45}
.dr-seat-b s{display:block;text-decoration:none;font-size:9px;letter-spacing:.04em;
  color:#FFD23F;margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
/* She reached for something that had gone. */
.dr-seat-lost{border-color:rgba(255,41,75,.45);
  background:linear-gradient(180deg,rgba(255,41,75,.16),rgba(30,10,50,.5))}
.dr-seat-lost::after{content:"";position:absolute;left:8px;right:8px;top:50%;height:1px;
  background:rgba(255,122,154,.5)}
/* Two queens doing the same thing, on a night where that is allowed. */
.dr-seat-clash{border-color:rgba(255,210,63,.42)}

/* The pick, said on her own card as well as on the board — the card used to
   describe a choice it never named. */
.dr-took-tag{display:inline-block;margin-left:9px;padding:2px 8px;border-radius:20px;
  font-family:'Space Mono',ui-monospace,monospace;font-size:9px;letter-spacing:.06em;
  color:#E9D5FF;background:rgba(124,58,237,.28);border:1px solid rgba(196,181,253,.3);
  text-transform:none;vertical-align:middle}
@media(max-width:620px){.dr-seats{grid-template-columns:1fr}}

/* Two or more queens in one draft scene card. The primary portrait stays full
   size; the secondary faces stack behind it, smaller and offset, so the reader
   sees everybody involved at a glance. */
.dr-draft-pair{position:relative;display:inline-flex;align-items:flex-end}
.dr-draft-pair .dr-por:not(:first-child),.dr-draft-pair .dr-initials:not(:first-child){
  margin-left:-14px;border:2px solid rgba(124,58,237,.5);
  box-shadow:0 0 8px rgba(124,58,237,.35);opacity:.88}
`;

const PREP_SHOP_CSS = `
.dr-prep-room{position:relative}
.dr-shop{position:absolute;inset:-24px -18px;z-index:-1;pointer-events:none;overflow:hidden}
.dr-shop i{position:absolute;display:block}
.dr-shop-mirrors{top:10px;left:6%;right:6%;height:210px;opacity:.5;
  background:
    repeating-linear-gradient(90deg,rgba(255,233,168,.5) 0 7px,transparent 7px 46px) top/100% 4px no-repeat,
    repeating-linear-gradient(90deg,rgba(255,233,168,.5) 0 7px,transparent 7px 46px) bottom/100% 4px no-repeat,
    linear-gradient(180deg,rgba(255,255,255,.05),transparent 70%);
  border-left:1px solid rgba(255,255,255,.07);
  border-right:1px solid rgba(255,255,255,.07)}
.dr-shop-bench{left:0;right:0;bottom:0;height:26%;
  background:linear-gradient(180deg,transparent,rgba(255,61,154,.14));
  border-top:1px solid rgba(255,255,255,.08)}
.dr-shop-sign{top:34px;right:9%;width:120px;height:3px;background:#FF3D9A;
  box-shadow:0 0 26px 7px rgba(255,61,154,.45)}
.dr-shop-work{background:radial-gradient(90% 55% at 50% 100%,rgba(255,61,154,.13),transparent 68%)}

/* ── THE WALKTHROUGH CARD ──
   One card, three stops. The host at the head of it once, then each queen
   he stops at with her own portrait and her own words, separated by a rule
   rather than by a whole new card. */
.dr-walkcard{display:block}
.dr-walkhead{display:grid;grid-template-columns:auto 1fr;gap:12px;align-items:center;
  padding-bottom:12px;border-bottom:1px solid rgba(255,233,168,.22)}
.dr-walkhead h3{margin:0}
.dr-stops{display:block}
.dr-stop{display:grid;grid-template-columns:auto 1fr;gap:14px;align-items:start;
  padding:14px 0;border-bottom:1px dashed rgba(255,255,255,.10)}
.dr-stop:last-child{border-bottom:0;padding-bottom:0}
.dr-stop>div>b{display:block;font-size:15px;letter-spacing:.04em;color:#FFE9A8;margin-bottom:4px}
/* THE LINE LENGTH IS THE READABILITY FIX. The prose ran the full width of
   the shell, which is well past the point a reader can find the start of the
   next line without hunting for it. */
.dr-stop p{margin:0;max-width:62ch;line-height:1.65;color:#f4e3ed}
.dr-prep-room .dr-card p{max-width:66ch}

/* The room has to sit BEHIND the cards and still be visible. It was drawn at
   z-index -1 against a stacking context that put it behind the shell as
   well, so the set the screen was given never actually reached the screen. */
.dr-prep-room{position:relative;z-index:0}
.dr-prep-room .dr-step{position:relative;z-index:1}
`;

/* ══════════════════════════════════════════════════════════════════════
   CAPTAIN PICKS — girl group, choreography, any captains-format draft
   ══════════════════════════════════════════════════════════════════════
   Captains alternate picking queens. Each pick is a card. The sidebar
   builds two (or three) team columns that fill in as the viewer clicks
   through the picks. The full team table is the last step — never
   spoiled upfront.

   The pick sequence is reconstructed from the final teams: each team's
   members after the captain are in the order they were picked. Interleave
   them to get the draft order: captain 0's first, captain 1's first,
   captain 0's second, … with the last unpicked queen going to whichever
   team is still short.
*/
const TEAM_NEON = [
  { bg: 'rgba(0,255,170,.12)', border: 'rgba(0,255,170,.55)', glow: '0 0 18px rgba(0,255,170,.35)', text: '#00FFAA', dim: 'rgba(0,255,170,.25)' },
  { bg: 'rgba(255,61,200,.12)', border: 'rgba(255,61,200,.55)', glow: '0 0 18px rgba(255,61,200,.35)', text: '#FF3DC8', dim: 'rgba(255,61,200,.25)' },
  { bg: 'rgba(61,180,255,.12)', border: 'rgba(61,180,255,.55)', glow: '0 0 18px rgba(61,180,255,.35)', text: '#3DB4FF', dim: 'rgba(61,180,255,.25)' },
];
const CAPTAIN_CSS = `
/* ── PICK CARDS ── */
.dr-pick-card{position:relative;display:grid;grid-template-columns:auto 1fr;gap:16px;
  align-items:center;padding:14px 18px;border-radius:12px;
  background:linear-gradient(135deg,rgba(16,6,26,.92),rgba(30,12,50,.85));
  border:1px solid rgba(124,58,237,.3);overflow:hidden;
  transition:border-color .3s,box-shadow .3s}
.dr-pick-card::before{content:"";position:absolute;inset:0;
  background:linear-gradient(90deg,var(--tc,rgba(124,58,237,.18)) 0%,transparent 60%);
  opacity:.45;pointer-events:none}
.dr-pick-num{position:absolute;top:0;right:0;width:32px;height:32px;
  display:flex;align-items:center;justify-content:center;
  font-family:'Space Mono',ui-monospace,monospace;font-size:11px;font-weight:700;
  color:var(--tt,#E9D5FF);
  background:linear-gradient(135deg,var(--tc,rgba(124,58,237,.35)),rgba(16,6,26,.9));
  border-bottom-left-radius:10px;border-left:1px solid var(--tb,rgba(124,58,237,.35));
  border-bottom:1px solid var(--tb,rgba(124,58,237,.35))}
.dr-pick-card .dr-por,.dr-pick-card .dr-initials{border-radius:50%;
  box-shadow:0 0 14px var(--tc,rgba(124,58,237,.4));border:2px solid var(--tb,rgba(124,58,237,.5))}
.dr-pick-body{min-width:0}
.dr-pick-body h3{margin:0 0 3px;font-size:16px;letter-spacing:.06em;color:#fff}
.dr-pick-body p{margin:0;max-width:58ch;line-height:1.6;color:#e4d3ee;font-size:13.5px}
/* Team tag in header */
.dr-took-tag{display:inline-block;margin-left:9px;padding:2px 10px;border-radius:20px;
  font-family:'Space Mono',ui-monospace,monospace;font-size:9px;letter-spacing:.08em;
  color:var(--tt,#E9D5FF);background:var(--tc,rgba(124,58,237,.28));
  border:1px solid var(--tb,rgba(124,58,237,.4));text-transform:uppercase;vertical-align:middle}
/* The last pick — she didn't get chosen, she got what was left */
.dr-pick-last{border-style:dashed;opacity:.88}
.dr-pick-last .dr-pick-num{font-style:italic}

/* ── SIDEBAR TEAM COLUMNS ── */
.dr-cap-col{margin:0 0 12px;padding:10px 12px;border-radius:10px;
  background:rgba(16,6,26,.88);border:1px solid var(--tb,rgba(124,58,237,.35));
  box-shadow:var(--tg,none)}
.dr-cap-col h4{margin:0 0 8px;font-size:12px;letter-spacing:.16em;text-transform:uppercase;
  color:var(--tt,#E9D5FF);text-shadow:0 0 8px var(--tc,rgba(124,58,237,.4))}
.dr-cap-col .dr-cap-member{display:flex;align-items:center;gap:8px;padding:5px 0;
  font-size:13px;color:#f4e3ed;border-bottom:1px solid rgba(255,255,255,.04);transition:opacity .3s}
.dr-cap-col .dr-cap-member:last-child{border-bottom:0}
.dr-cap-col .dr-cap-member.dr-cap-captain{color:#FFE9A8;font-weight:600}
.dr-cap-col .dr-cap-member.dr-cap-captain::after{content:"★";margin-left:auto;font-size:10px;color:#FFE9A8}
.dr-cap-col .dr-cap-member.dr-cap-hidden{opacity:0.12;font-size:11px;letter-spacing:.12em;color:#7c5ca0}

/* ── FINAL TEAM TABLE ── */
.dr-cap-final{margin-top:16px}
.dr-cap-final .dr-teams{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:14px}
.dr-cap-final .dr-team{padding:14px;border-radius:12px;
  background:linear-gradient(180deg,rgba(124,58,237,.14),rgba(30,10,50,.55));
  border:1px solid var(--tb,rgba(196,181,253,.22));box-shadow:var(--tg,none)}
.dr-cap-final .dr-team h4{margin:0 0 10px;font-size:14px;letter-spacing:.12em;
  text-transform:uppercase;color:var(--tt,#E9D5FF);
  text-shadow:0 0 10px var(--tc,rgba(124,58,237,.5))}
.dr-cap-final .dr-member{display:flex;align-items:center;gap:8px;padding:4px 0;
  font-size:13px;color:#f4e3ed;border-bottom:1px solid rgba(255,255,255,.04)}
.dr-cap-final .dr-member:last-child{border-bottom:0}
.dr-cap-final .dr-member .dr-role{margin-left:auto;font-size:10px;letter-spacing:.08em;
  text-transform:uppercase;color:#c4b5fd;opacity:.75}
`;

function _rpBuildCaptainPicks(row, ep, a, scenes, teamPickData) {
  const teams = a.teams || [];
  const teamNames = a.teamNames || teamPickData.teamNames || [];
  const captains = teamPickData.captains || teams.map(t => t[0]);

  /* Reconstruct the interleaved pick sequence from the final teams.
     Each team's members (after the captain) are in pick order. */
  const pickLists = teams.map(t => t.slice(1));
  const maxLen = Math.max(...pickLists.map(l => l.length));
  const pickSequence = [];
  for (let round = 0; round < maxLen; round++) {
    for (let ti = 0; ti < teams.length; ti++) {
      if (round < pickLists[ti].length) {
        pickSequence.push({ captain: captains[ti], picked: pickLists[ti][round], team: ti });
      }
    }
  }

  const totalSteps = pickSequence.length + scenes.length + 1;

  /* ── SIDEBAR PANELS ──
     One panel per reveal step, each showing the teams filled in to that
     point. The existing _drSidebar system swaps the active panel on every
     reveal click. Captains are always shown; picks appear as they are
     revealed. The final step shows everybody. */
  const tc = (ti) => TEAM_NEON[ti % TEAM_NEON.length];
  const sidebarForRevealed = (n) => {
    const shown = new Set(captains);
    for (let i = 0; i < Math.min(n, pickSequence.length); i++) shown.add(pickSequence[i].picked);
    return teams.map((team, ti) => {
      const c = tc(ti);
      const label = teamNames[ti] || `Team ${ti + 1}`;
      const count = team.filter(q => shown.has(q)).length;
      return `<div class="dr-cap-col" style="--tc:${c.bg};--tb:${c.border};--tg:${c.glow};--tt:${c.text}"><h4>${esc(label)} &middot; ${count}</h4>${
        team.map(q => {
          const isCap = q === captains[ti];
          const vis = shown.has(q);
          return `<div class="dr-cap-member${isCap ? ' dr-cap-captain' : ''}${
            !vis ? ' dr-cap-hidden' : ''}">${
            vis ? `${_portrait(q, ep, { size: 26 })}${esc(q)}` : '&middot;&middot;&middot;'
          }</div>`;
        }).join('')}</div>`;
    }).join('');
  };

  const panels = [];
  for (let s = 0; s < totalSteps; s++) panels.push(sidebarForRevealed(s));

  const _CAP_PICK_LINES = [
    (a, b) => `${a} calls ${b}. Quick. No drama. ${b} sits down with the team and does not look back at the queens still standing.`,
    (a, b) => `"${b}." ${a} says the name and ${b} is already walking. She knew. Everybody knew. That pick was decided before the draft started.`,
    (a, b) => `${a} looks at who is left. Looks at her team. "${b}." Filling a hole — the team needed a voice and ${b} has one.`,
    (a, b) => `${b} hears her name and mouths "thank god" to nobody. She joins ${a}'s side. The queens still in the middle go quiet.`,
    (a, b) => `A pause. ${a} is thinking. The room holds still. "${b}." ${b} walks over. The pause told everybody it was close between her and someone else.`,
    (a, b) => `${a} picks ${b} and the other captain's face changes. That was the queen she wanted next. ${b} does not see it. ${b} is already sitting down.`,
    (a, b) => `${b} gets the call. Stands up, walks to ${a}'s team, sits down between two queens she has never worked with. This is her group now.`,
    (a, b) => `${a} takes ${b}. ${b} nods once. Professional. She is not going to perform gratitude for being picked fourth. She is going to perform on stage.`,
    (a, b) => `Fewer queens left. The maths is getting obvious. ${a} picks ${b} and ${b} accepts it with the face of someone who knows she was not first but is glad she was not last.`,
    (a, b) => `"${b}, come here." ${a} does not deliberate. ${b} crosses the room and the other team watches a gap open in their options.`,
  ];
  const _CAP_LAST_LINES = [
    (a, b) => `${b} is the last one standing. Nobody had to say her name. ${a} waves her over. ${b} walks to the team that is left. She sits down. She gets to work.`,
    (a, b) => `${b} is what is left. ${a} gestures her over. ${b} joins the team she did not choose and the team that did not choose her. She will make them remember she was here.`,
  ];

  let _capIdx = 0;
  const pickCards = pickSequence.map((pk, i) => {
    const c = tc(pk.team);
    const teamLabel = esc(teamNames[pk.team] || `Team ${pk.team + 1}`);
    const a = esc(pk.captain), b = esc(pk.picked);
    const isLast = i === pickSequence.length - 1;
    const line = isLast
      ? _CAP_LAST_LINES[i % _CAP_LAST_LINES.length](a, b)
      : _CAP_PICK_LINES[_capIdx++ % _CAP_PICK_LINES.length](a, b);
    return `<div class="dr-step" id="dr-step-choice-${i}">
      <div class="dr-pick-card${isLast ? ' dr-pick-last' : ''}" style="--tc:${c.bg};--tb:${c.border};--tg:${c.glow};--tt:${c.text}">
        <span class="dr-pick-num">${i + 1}</span>
        ${_portrait(pk.picked, ep, { size: 58, station: true })}
        <div class="dr-pick-body">
          <h3 class="dr-disp">${esc(pk.picked)}
            <span class="dr-took-tag">&rarr; ${teamLabel}</span></h3>
          <p>${line}</p>
        </div>
      </div></div>`;
  });

  const sceneCards = scenes.map((sc, i) => {
    const allPlayers = sc.data?.players || [];
    const who = allPlayers[0];
    const others = allPlayers.slice(1);
    const hasPair = who && others.length > 0;
    const busts = who
      ? `<span class="${hasPair ? 'dr-draft-pair' : ''}">${
        _portrait(who, ep, { size: hasPair ? 48 : 54, station: true })}${
        others.slice(0, 2).map(n =>
          _portrait(n, ep, { size: 36 })).join('')}</span>`
      : '';
    return `<div class="dr-step" id="dr-step-choice-${pickSequence.length + i}">
      <div class="dr-panel dr-a-bond dr-card dr-k-${who ? 'solo' : 'confess'}">
        ${busts}
        <div>${who ? `<h3 class="dr-disp">${esc(who)}</h3>` : ''}
          <p>${esc(sc.text)}</p></div>
      </div></div>`;
  });

  const finalStep = `<div class="dr-step dr-cap-final" id="dr-step-choice-${pickSequence.length + scenes.length}">
    <div class="dr-teams">${teams.map((team, ti) => {
    const c = tc(ti);
    const label = teamNames[ti] || `Team ${ti + 1}`;
    return `<div class="dr-team" style="--tc:${c.bg};--tb:${c.border};--tg:${c.glow};--tt:${c.text}">
        <h4 class="dr-disp">${esc(label)}</h4>
        ${team.map(n => `<div class="dr-member">
          ${_portrait(n, ep, { size: 30 })}
          ${esc(n)}
          ${n === captains[ti] ? '<span class="dr-role">captain</span>' : ''}
          <span class="dr-role">${esc(a.roles?.[n] || '')}</span>
        </div>`).join('')}
      </div>`;
  }).join('')}</div></div>`;

  if (typeof window !== 'undefined') {
    window._drSidebar = window._drSidebar || {};
    window._drSidebar['choice'] = panels;
  }

  const steps = [...pickCards, ...sceneCards, finalStep].join('');

  return `<style>${CHAL_CSS}${WERK_CSS}${DRAFT_CSS}${CAPTAIN_CSS}</style>${_shell(
    `<div class="dr-brief-room dr-draft">${briefSet('draft')}${steps}</div>`, ep, {
      phase: 'werk',
      title: 'Captain Picks',
      subtitle: 'the room gets divided',
      sidebar: panels[0] || '',
    })}${_controls('choice', totalSteps, ep.num)}`;
}

/**
 * The draft — or the line-up, when nothing was actually contested.
 *
 * ── TWO NIGHTS, NOT ONE ───────────────────────────────────────────────
 *
 * Most challenges hand out something exclusive: one Cher, one part, one pile
 * of fabric. Somebody reaches for a thing and finds it gone, and that is a
 * draft. Measured across five challenges, four of them contest between three
 * and nine picks a night.
 *
 * The talent show contests NOTHING. Every queen picks her own act, two of
 * them may pick the same one, and nothing is ever taken off anybody — and
 * this screen still called it a draft, printed a pick order and narrated
 * thirteen queens all getting "exactly what she asked for" with "the quiet
 * fury of people who wanted the same thing". Nobody was furious. Nobody lost
 * anything. It was a list with a fight drawn over it.
 *
 * So the screen asks the assignment which night it is. What does not change
 * is that you can see WHAT EVERYBODY IS DOING — that is the useful thing on
 * both kinds of night, and on the uncontested ones it is the only thing.
 */
/* ══ THE SECOND PERSON IN THE ROOM ══════════════════════════════════════
   A makeover is the only night where a large part of what the panel scores
   is somebody who is not a queen. Measured over 3,200 paired queens: the
   partner's ease correlates r=0.37 with her performance against r=0.54 for
   her own runway, and the gap between the hardest partner in a cohort and
   the easiest is worth about a point — two thirds of what her own best stat
   is worth on the same night.
   Every rail on this show listed the room as though she were doing it
   alone. His face goes under her name, on the two screens that have a rail
   while the pair is a pair: the line-up, where he is handed to her, and the
   main stage, where the two of them are scored as one thing. */
/** "st", "nd", "rd", "th" — the suffix only, for a seat number. */
function _ordSuffix(n) {
  return ['th', 'st', 'nd', 'rd'][(n % 100 - n % 10 !== 10) * (n % 10)] || 'th';
}

function _mateChip(row, name) {
  const p = row?.dr?.assignment?.picks?.[name]?.partner;
  if (!p?.portrait) return '';
  return `<span class="dr-mate"><img src="${esc(p.portrait)}" alt="" loading="lazy"
    onerror="this.parentNode.style.display='none'"><small>${esc(p.name)}</small></span>`;
}

export function rpBuildChoice(row) {
  const ep = epOf(row);
  const a = row?.dr?.assignment || {};
  const scenes = (row.dr.scenes || []).filter(s => s.step === 'choice' && s.text);
  const picks = Object.entries(a.picks || {});

  /* ── CAPTAIN PICKS (girl group, choreography) ───────────────────────
     No formal role draft — captains pick team members. The draft screen
     shows each pick as a card (with dump-event narration when it fires),
     a live sidebar tracking both teams, and the full team table at the
     end as the final reveal. */
  const teamPickData = _sceneData(row, 'team-pick');
  if (teamPickData && (a.teams || []).length > 1) {
    return _rpBuildCaptainPicks(row, ep, a, scenes, teamPickData);
  }

  /* ── A SCREEN FOR ONE PARAGRAPH IS NOT A SCREEN ──
     The ball, the photoshoot and the runway challenge hand out nothing, so
     this screen was a heading, a click and one sentence saying there is
     nothing to draft. js/dr/stage.js now says that sentence on the BRIEF
     instead — moving it rather than dropping it, because a written scene that
     is filed nowhere is what tests/dr-vp-sweep.test.js exists to refuse — and
     the choice step on those nights is simply empty, so this returns early on
     the line below without needing a rule of its own.
     Kept as a belt: a challenge that emits a choice scene and hands nothing
     out still has no board to draw. */
  const hasTeams = (a.teams || []).length > 1;
  const onlyDivision = scenes.length && scenes.every(s => s.kind === 'chal:the-division');
  if (!picks.length && !hasTeams && onlyDivision) return '';
  if (!picks.length && !scenes.length) return '';

  const contested = a.contested !== false && picks.some(([, p]) => p?.lostTo);
  // The queen who handed the room out, when somebody did — she is on every
  // other pick as `assignedBy`, and on her own as the one who chose.
  const paired = (picks.find(([, p]) => p?.assignedBy) || [])[1]?.assignedBy || null;
  const order = (a.order || []).filter(n => a.picks?.[n]);

  /* WHO ELSE IS DOING IT. On a night with no draft two queens can land on the
     same act, and that is the only real jeopardy such a night has — so it is
     the thing the board should show, in place of the collisions it has
     nothing to draw. */
  const byChoice = {};
  for (const [who, p] of picks) {
    const k = String(p?.choice ?? '');
    (byChoice[k] ||= []).push(who);
  }

  /* ── TWO CASTS IS NOT THIRTEEN QUEENS IN A QUEUE ──
     The acting challenge cuts the room in half and runs the same six-part
     script twice. The board drew all thirteen as ONE list numbered 1..13, so
     the queen who picked first in the second cast was seat 8 — and both
     first-pickers came out looking like two queens who had taken everything
     between them, which is the shape a room reads as a stitch-up.
     Split, and numbered within her own cast, so "one Matriarch each" is
     visible instead of "two queens with the same part". */
  const casts = (a.teams || []).filter(t => (t || []).length > 1);
  const splitRoom = casts.length > 1 && a.division === 'two-casts';

  const seat = (who, p, idx) => {
    const took = _choiceLabel(p);
    const shared = (byChoice[String(p?.choice ?? '')] || []).filter(n => n !== who);
    const wanted = p?.wanted && p.wanted !== p.choice ? _choiceLabel({ choice: p.wanted }) : '';
    /* ── A NEAR MISS IS A RIVALRY; A LONG FALL IS THE ORDER ──
       `lostTo` names whoever holds her FIRST choice however far down she went,
       so a queen who fell through five parts blamed the queen at the top of a
       list she was never close to — and since every list opens on the lead,
       one name landed on three or four cards a night. Measured over 200
       casts: 71.7% of the room misses its first choice, mean fall 1.8 parts,
       and the most-blamed queen averages 3.4 cards of 13.
       Past a near miss the honest subject is where she picked, not who beat
       her. And "lost hers" now says what HERS WAS — the board named the queen
       who took it and never once named the part. */
    const near = p?.lostTo && Number(p.depth) <= 2;
    return `<div class="dr-seat${p?.lostTo ? ' dr-seat-lost' : ''}${
      shared.length && !splitRoom ? ' dr-seat-clash' : ''}">
      ${contested ? `<i class="dr-seat-n">${idx + 1}</i>` : ''}
      ${_portrait(who, ep, { size: 44 })}
      <div class="dr-seat-b">
        <b class="dr-disp">${esc(who)}</b>
        <span class="dr-seat-took">${p?.partner?.portrait
    ? `<img class="dr-seat-face" src="${esc(p.partner.portrait)}" alt="" loading="lazy"
        onerror="this.style.display='none'">` : ''}${took ? esc(took) : 'no pick'}</span>
        ${p?.assignedBy ? `<u class="dr-seat-by">paired by ${esc(p.assignedBy)}</u>` : ''}
        ${p?.chosen && p?.partner ? '<u class="dr-seat-by">won the mini · picked first</u>' : ''}
        ${near ? `<u>wanted ${esc(wanted || 'it')} &mdash; ${esc(p.lostTo)} took it</u>`
    : p?.lostTo ? `<u>picked ${idx + 1}${_ordSuffix(idx + 1)}${
      wanted ? `, wanted ${esc(wanted)}` : ''}</u>` : ''}
        ${shared.length ? (splitRoom
    /* HER OPPOSITE NUMBER, NOT A CLASH. On a two-cast night every part is
       doubled BY DESIGN — that is the format — so "also Gigi Cherie" fired on
       every card in the room and read as thirteen collisions. The queen
       playing her part in the other cast is the one she is judged directly
       against, which is the real jeopardy of the night. The clash styling is
       for a night where two queens landed on the same act by accident. */
    ? `<s>against ${esc(shared.join(', '))}</s>`
    : `<s>also ${esc(shared.join(', '))}</s>`) : ''}
      </div></div>`;
  };

  const seated = order.length ? order.map(n => [n, a.picks[n]]) : picks;
  /* THE HEADLINE WAS THE GRIEVANCE. "10 of 13 lost a pick" over a serial
     draft whose preference lists all open on the lead is not news, it is the
     format: the measurement above says seven queens in ten miss their first
     choice on an ordinary night. Putting that in the header framed every
     board as a stitch-up. The head-to-heads are what actually happened. */
  const nearMisses = picks.filter(([, p]) => p?.lostTo && Number(p.depth) <= 2).length;
  const heads = nearMisses
    ? ` &middot; ${nearMisses} head-to-head${nearMisses === 1 ? '' : 's'}` : '';
  const headline = contested
    ? (splitRoom
      ? `two casts &middot; the same script${heads}`
      : `${picks.length} queens${heads}`)
    : paired
      /* A PAIRED ROOM IS NOT A DRAFT AND ITS BOARD SHOULD NOT COUNT LOSSES.
         "7 of 8 lost a pick" was the headline on a makeover for as long as
         the partners were contested; the room is handed out by the mini
         winner now, so the number worth printing is who did the handing. */
      ? `paired by ${esc(paired)}`
      : `${Object.keys(byChoice).length} different acts across ${picks.length} queens`;

  const seatsFor = names => `<div class="dr-seats">${
    names.map((n, i) => seat(n, a.picks[n], i)).join('')}</div>`;
  const board = picks.length
    ? `<div class="dr-boardwrap">
        <div class="dr-boardhead">
          <b class="dr-disp">${contested ? 'The board' : 'The line-up'}</b>
          <span>${headline}</span>
        </div>
        ${splitRoom
    ? casts.map((t, ci) => `<div class="dr-cast">
          <b class="dr-casthead dr-disp">Cast ${'AB'[ci] || ci + 1}</b>
          ${seatsFor(order.filter(n => t.includes(n)))}
        </div>`).join('')
    : `<div class="dr-seats">${seated.map(([who, p], i) => seat(who, p, i)).join('')}</div>`}
      </div>`
    : '';

  const steps = scenes.map((sc, i) => {
    const allPlayers = sc.data?.players || [];
    const who = allPlayers[0];
    const p = who ? a.picks?.[who] : null;
    const took = p ? _choiceLabel(p) : '';
    const others = new Set(allPlayers.slice(1));
    if (sc.data?.lostTo) others.add(sc.data.lostTo);
    if (p?.lostTo && !others.has(p.lostTo)) others.add(p.lostTo);
    if (p?.assignedBy && !others.has(p.assignedBy)) others.add(p.assignedBy);
    const hasPair = who && others.size > 0;
    const busts = who
      ? `<span class="${hasPair ? 'dr-draft-pair' : ''}">${
        _portrait(who, ep, { size: hasPair ? 48 : 54, station: true })}${
        [...others].slice(0, 2).map(n =>
          _portrait(n, ep, { size: 36 })).join('')}</span>`
      : '';
    return `<div class="dr-step" id="dr-step-choice-${i}">
      <div class="dr-panel dr-a-bond dr-card dr-k-${who ? 'solo' : 'confess'}">
        ${busts}
        <div>${who ? `<h3 class="dr-disp">${esc(who)}${
    took ? `<span class="dr-took-tag">${esc(took)}</span>` : ''}</h3>` : ''}
          ${_note(sc) ? `<span class="dr-note">${esc(_note(sc))}</span>` : ''}
          <p>${esc(sc.text)}</p></div>
      </div></div>`;
  }).join('');

  /* ── THIS SCREEN HAD NO RAIL AT ALL ──
     The captain path next door builds one and this path never did, so the
     line-up ran with whatever the previous screen happened to leave in
     `_drSidebar` — on a makeover, a column of queens with no partners on a
     screen whose entire subject is who is paired with whom.
     NOT GATED, deliberately. The board at the top of this screen already
     lists every pairing before the first click; hiding the same information
     in the rail would be a gate on nothing. What advances is the tick: who
     has had her card read so far. */
  const railRoom = (row.dr.assignment?.order || []).filter(n => a.picks?.[n]);
  const railAt = (upTo) => {
    const done = new Set(scenes.slice(0, upTo)
      .flatMap(sc => sc.data?.players || []));
    /* WHOSE RAIL THIS IS. "The pairs" is the makeover's word and this screen
       runs on every draft night -- so an acting room, which has casts and no
       pairs in it at all, ran a sidebar headed with another challenge's
       vocabulary. */
    const railWord = a.division === 'two-casts' ? 'The cast'
      : (a.division === 'pairs' || paired) ? 'The pairs' : 'The room';
    return `<h4 class="dr-disp">${railWord} &middot; ${railRoom.length}</h4>${
      railRoom.map(n => `<div class="dr-slot${done.has(n) ? '' : ' dr-waiting'}">
        ${_portrait(n, ep, { size: 34 })}
        <div><div class="dr-nm">${esc(n)}</div>${_mateChip(row, n)}</div>
        <span class="dr-up">${done.has(n)
    // She did not get paired, she did the pairing — the board says so above
    // her name and a rail that calls her "paired" contradicts it.
    ? (a.picks[n]?.chosen ? 'picked first' : 'paired') : ''}</span></div>`).join('')}`;
  };
  if (typeof window !== 'undefined' && railRoom.length) {
    window._drSidebar = window._drSidebar || {};
    window._drSidebar['choice'] = scenes.map((_, i) => railAt(i + 1));
  }

  return `<style>${CHAL_CSS}${WERK_CSS}${DRAFT_CSS}</style>${_shell(
    `<div class="dr-brief-room dr-draft">${briefSet('draft')}${board}${steps}</div>`, ep, {
      phase: 'werk',
      title: contested ? 'The Draft' : 'The Line-Up',
      subtitle: contested ? 'who takes what, and who misses out' : 'what everybody is doing',
      ...(railRoom.length ? { sidebar: railAt(0) } : {}),
    })}${_controls('choice', Math.max(1, scenes.length), ep.num)}`;
}

/** Prep: the room at work, and the host's walkthrough. */
export function rpBuildPrep(row, mine = null) {
  const ep = epOf(row);
  /* ── ONLY THE SCENES THIS SCREEN OWNS ──
     `mine` is the section, handed in by js/vp-dr/screens.js, and it is the
     answer. Filtering the whole episode by `step === 'prep'` was not: the
     booth, the rehearsal room and the set all carry that step and all have
     screens of their own, so ten cards of an afternoon taking notes from the
     director rendered here AND on On Set — the same prose twice, once under
     a heading about sewing.
     The step filter stays for the fallback path and is harmless over a
     section that is already this screen's. */
  const scenes = (mine || row.dr.scenes || []).filter(s => s.step === 'prep' && s.text);
  const hasChoreo = !!_sceneData(row, 'choreographer-pick')?.choreographers;
  if (!scenes.length && !hasChoreo) return '';

  const isWalk = sc => /walkthrough/.test(sc.kind || '');

  /* ── THE WALKTHROUGH, THREE STOPS TO A CARD ──
     The host visits every queen at her station, so a ten-queen room produced
     TEN cards on this screen — ten clicks of the same shot, which is most of
     the screen and all of the reason it dragged. Measured on one episode:
     fourteen cards, ten of them the walkthrough.
     It is one continuous walk, not ten events, so it is drawn as one: three
     stops to a card, the host at the head of it, each stop keeping its own
     queen and her own words. Fourteen cards become six.
     Order is preserved — the stops are consecutive in the scene list, so a
     merged card never straddles something that happened in between. */
  const groups = [];

  /* ── CHOREOGRAPHER PICK ──
     The girl group's prep starts with each team choosing a choreographer.
     Rendered as one card per team at the top of the prep screen. */
  const _CHOREO_LINES = [
    a => `${a} is already counting eights in her head. She has not heard the track yet. She does not need to.`,
    a => `${a} steps up. "I got this." The team lets her have it because nobody else was volunteering.`,
    a => `${a} takes the choreography. She has been moving her whole life. This is the week that pays off.`,
    a => `"I will choreograph." ${a} says it before anybody asks. The team exhales. One fewer thing to fight about.`,
    a => `${a} gets the choreography and her face says she knows what that means. Every missed count is on her now.`,
    a => `The team looks at each other. ${a} raises her hand. The last time she choreographed anything was a number in a bar at one in the morning. This is not that.`,
    a => `${a} takes it. Quiet confidence. She is not performing the role — she is just the queen in the room who moves the best and everybody knows it.`,
    a => `"Okay, I will do it." ${a} did not fight for it. She did not need to. The team pointed at her and she nodded.`,
    a => `${a} has the choreography and the team is watching her the way a team watches the person who just became responsible for all of them.`,
    a => `${a} volunteers and immediately starts spacing the room. "Stand here. No, HERE." She was a choreographer before anybody asked.`,
    a => `The team gives it to ${a}. She takes it the way she takes everything — with a plan already half-built and a look that says do not argue with the plan.`,
    a => `${a} is choreographing. The room clears for her. She walks the formation once, alone, lips moving, counting something nobody else can hear.`,
  ];
  let _choreoIdx = 0;
  const choreoData = _sceneData(row, 'choreographer-pick');
  if (choreoData?.choreographers) {
    const ca = row?.dr?.assignment || {};
    const ctNames = ca.teamNames || [];
    for (const [choreo] of Object.entries(choreoData.choreographers)) {
      const ti = (ca.teams || []).findIndex(t => t.includes(choreo));
      const label = ctNames[ti] || `Team ${ti + 1}`;
      const line = _CHOREO_LINES[_choreoIdx++ % _CHOREO_LINES.length](esc(choreo));
      const idx = groups.length;
      groups.push({ walk: false, items: [], custom:
        `<div class="dr-step" id="dr-step-prep-${idx}">
          <div class="dr-panel dr-a-bond dr-card dr-k-solo">
            ${_portrait(choreo, ep, { size: 54, station: true })}
            <div>
              <h3 class="dr-disp">${esc(choreo)}
                <span class="dr-took-tag">choreographer &middot; ${esc(label)}</span></h3>
              <p>${line}</p>
            </div>
          </div></div>` });
    }
  }

  for (const sc of scenes) {
    const last = groups[groups.length - 1];
    if (isWalk(sc) && last && last.walk && last.items.length < 3) last.items.push(sc);
    else groups.push({ walk: isWalk(sc), items: [sc] });
  }

  const steps = groups.map((g, i) => {
    if (g.custom) return g.custom;
    if (!g.walk) return sceneCard(g.items[0], i, 'prep', ep, row);

    const stops = g.items.map(sc => {
      const who = (sc.data?.players || [])[0];
      return `<div class="dr-stop">
        ${who ? _portrait(who, ep, { size: 44, station: true }) : '<span></span>'}
        <div>${who ? `<b class="dr-disp">${esc(who)}</b>` : ''}
          <p>${esc(sc.text)}</p></div>
      </div>`;
    }).join('');

    return `<div class="dr-step" id="dr-step-prep-${i}">
      <div class="dr-panel dr-a-score dr-card dr-walkcard">
        <div class="dr-walkhead">
          ${_judgePortrait('rupaul', { size: 46 })}
          <div><h3 class="dr-disp">The walkthrough</h3>
            <span class="dr-note">He comes round the room, station by station.</span></div>
        </div>
        <div class="dr-stops">${stops}</div>
      </div></div>`;
  }).join('');

  /* THE RAIL IS WHAT EVERYBODY IS MAKING. Prep drew two cards and half a
     page of nothing, on the one night the room is full of people building
     different things — and the draft has already told us what each of them
     took, so this is not a spoiler, it is the thing you want beside the
     prose while you read it. */
  const picks = Object.entries(row?.dr?.assignment?.picks || {});
  const rail = picks.length
    ? `<h4 class="dr-disp">On the table</h4>${picks.map(([who, p]) => {
      const took = _choiceLabel(p);
      return `<div class="dr-slot">${_portrait(who, ep, { size: 32 })}
        <div><div class="dr-nm">${esc(who)}</div>
        ${took ? `<div class="dr-nm-sub">${esc(took)}</div>` : ''}</div><span></span></div>`;
    }).join('')}`
    : '';

  /* PREP IS THE WERK ROOM, and it is built here rather than in werk.js
     because it hangs off the challenge. Same set as the cold open, the
     morning and elimination day — a mirror wall, a bench of stations, the
     sign — lit for the hour it happens in, which is late and warm with the
     machines running. */
  const shopPrep = `<div class="dr-shop dr-shop-work" aria-hidden="true">
      <i class="dr-shop-sign"></i><i class="dr-shop-mirrors"></i>
      <i class="dr-shop-bench"></i></div>`;
  return `<style>${CHAL_CSS}${WERK_CSS}${PREP_SHOP_CSS}</style>${_shell(
    `<div class="dr-prep-room">${shopPrep}${steps}</div>`, ep, {
      phase: 'werk', title: 'The Work Room', subtitle: 'building it',
      sidebar: rail,
    })}${_controls('prep', groups.length, ep.num)}`;
}

/** The performance itself, with the panel this challenge type deserves. */
/* ══════════════════════════════════════════════════════════════════════
   THE SIX WORLDS A MAXI CHALLENGE HAPPENS IN
   ══════════════════════════════════════════════════════════════════════

   One builder serves nineteen challenges, so it drew all nineteen the same
   way: a portrait, a score, a paragraph, nineteen times over. A Snatch Game
   and a Ball and a stand-up set are three different rooms with three
   different lights in them and the screen said nothing about which one you
   were in.

   It cannot have nineteen identities. It CAN have the rooms they happen in,
   which is six — and a family is a real property of the challenge, not a
   decoration: a queen doing comedy at a mic and a queen sewing at a station
   are being judged on different things, and the screen should not pretend
   otherwise.

   `format` on the challenge is solo/teams/cast/pairs — that is the team
   shape, not the subject — so the mapping is by hand and lives here.

   Each world sets its own accent and its own ambient layer. The ambient is
   CSS, not an image: a tally light and scanlines for a studio, footlights
   and a curtain for a stage, a brick wall and a lit mic for a club. */
/**
 * ── ONE SKIN PER CHALLENGE ──
 *
 * Was a table of six FAMILIES: nineteen challenges mapped onto six backdrops,
 * so four different nights shared the studio and five shared the stage. With
 * one card shape underneath, a Snatch Game and a Ball came out as the same
 * screen in a different colour — which is exactly what they looked like.
 *
 * Each entry is the room that challenge happens in:
 *   props   the scenery, drawn in CSS, no images and no emoji
 *   sub     what the screen is called under the title, in that room's words
 *   unit    what one mark on the card MEANS here, so the marks stop being
 *           anonymous bars: rounds in a game show, looks at a ball, bits in
 *           a roast. The engine has always known; the card never said.
 *
 * The palette lives in CSS beside the room, on .dr-chal-<id>.
 */
const SKIN = {
  'snatch-game': { props: '<i class="dr-podia"></i><i class="dr-qcard"></i>',
    sub: 'and the answer is', unit: 'round' },
  commercial: { props: '<i class="dr-bars"></i><i class="dr-onair"></i>',
    sub: 'we are rolling', unit: 'take' },
  'music-video': { props: '<i class="dr-sprock-l"></i><i class="dr-sprock-r"></i><i class="dr-dolly"></i>',
    sub: 'playback, from the top', unit: 'setup' },
  photoshoot: { props: '<i class="dr-contact"></i><i class="dr-strobe"></i>',
    sub: 'give me something', unit: 'frame' },
  rusical: { props: '<i class="dr-arch"></i><i class="dr-staff"></i>',
    sub: 'places, please', unit: 'number' },
  'talent-show': { props: '<i class="dr-stardrop"></i><i class="dr-marquee"></i>',
    sub: 'next on the bill', unit: 'act' },
  singing: { props: '<i class="dr-halo"></i><i class="dr-wave"></i>',
    sub: 'live vocals', unit: 'verse' },
  rumix: { props: '<i class="dr-vu"></i><i class="dr-faders"></i>',
    sub: 'in the booth', unit: 'bar' },
  'lipsync-challenge': { props: '<i class="dr-lsbars"></i>',
    sub: 'to the track', unit: 'section' },
  roast: { props: '<i class="dr-brick"></i><i class="dr-clubspot"></i><i class="dr-micstand"></i>',
    sub: 'the room goes quiet', unit: 'bit' },
  'stand-up': { props: '<i class="dr-neon"></i><i class="dr-stool"></i>',
    sub: 'five minutes, no net', unit: 'bit' },
  improv: { props: '<i class="dr-cards"></i><i class="dr-chairs"></i>',
    sub: 'nothing is written', unit: 'scene' },
  design: { props: '<i class="dr-mat"></i><i class="dr-pattern"></i>',
    sub: 'the machines are running', unit: 'piece' },
  ball: { props: '<i class="dr-alcoves"></i>',
    sub: 'three looks, one queen', unit: 'look' },
  makeover: { props: '<i class="dr-vanity"></i>',
    sub: 'two of you now', unit: 'read' },
  'runway-challenge': { props: '<i class="dr-catwalk"></i>',
    sub: 'the walk is the challenge', unit: 'pass' },
  choreography: { props: '<i class="dr-mirrorwall"></i><i class="dr-barre"></i><i class="dr-marley"></i>',
    sub: 'from the top, five six seven eight', unit: 'eight' },
  'girl-group': { props: '<i class="dr-risers"></i><i class="dr-mics"></i>',
    sub: 'one track, everybody on it', unit: 'verse' },
  acting: { props: '<i class="dr-flag"></i><i class="dr-boom"></i>',
    sub: 'quiet on set', unit: 'scene' },
};

/* A challenge with no skin of its own still gets a room rather than a blank
   gradient — but it is a fallback, not a family, and adding a challenge
   without adding its room is a thing the test below will say out loud. */
const DEFAULT_SKIN = { props: '<i class="dr-curtain dr-l"></i><i class="dr-curtain dr-r"></i><i class="dr-foots"></i>',
  sub: 'places, please', unit: 'round' };

export const skinFor = id => SKIN[id] || DEFAULT_SKIN;
export const SKIN_IDS = Object.keys(SKIN);

/** The room, drawn in CSS. No images, no emoji. */
const ambientFor = id => `<div class="dr-set dr-set-${id}">${skinFor(id).props}</div>`;

/* ══════════════════════════════════════════════════════════════════
   SNATCH GAME — a game show, not a card
   ══════════════════════════════════════════════════════════════════
   RuPaul hosts. Two panelists sit beside him. Six rounds, each with a
   fill-in-the-blank question, 2-3 featured queens answering in character,
   reactions (kill / laugh / silence / bomb), host engagements, and
   confessional reads. The format is the show, not a summary of it. */

const SG_CSS = `
/* ═══════════════════════════════════════════════════
   THE SET — a game show stage, alive with light
   ═══════════════════════════════════════════════════ */
@keyframes sg-spot{0%,100%{opacity:.45}50%{opacity:.7}}
@keyframes sg-scan{0%{transform:translateY(-100%)}100%{transform:translateY(100%)}}
@keyframes sg-pulse{0%,100%{box-shadow:0 0 8px rgba(255,210,63,.3)}50%{box-shadow:0 0 22px rgba(255,210,63,.6)}}
@keyframes sg-glow{0%,100%{opacity:.5}50%{opacity:1}}
@keyframes sg-kill-flash{0%{background:rgba(59,224,138,.25)}100%{background:transparent}}
@keyframes sg-bomb-shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-3px)}40%{transform:translateX(3px)}60%{transform:translateX(-2px)}80%{transform:translateX(2px)}}
@keyframes sg-meter-fill{0%{width:0}100%{width:var(--fill)}}

.sg{position:relative;padding:24px 14px 32px;border-radius:8px;overflow:hidden;
  background:linear-gradient(180deg,#020a14 0%,#061224 30%,#0a1a30 60%,#020a14 100%)}
/* TRIPLE-LAYER STAGE LIGHT — two coloured spots + a centre wash, all breathing */
.sg::before{content:"";position:absolute;inset:0;pointer-events:none;
  animation:sg-spot 4s ease-in-out infinite;
  background:
    radial-gradient(ellipse 45% 55% at 25% 15%,rgba(255,210,63,.28),transparent 65%),
    radial-gradient(ellipse 45% 55% at 75% 15%,rgba(56,189,248,.28),transparent 65%),
    radial-gradient(ellipse 90% 40% at 50% 0%,rgba(255,255,255,.06),transparent 60%)}
/* SCANLINES — the taping monitor look */
.sg::after{content:"";position:absolute;inset:0;pointer-events:none;opacity:.06;
  background:repeating-linear-gradient(0deg,transparent 0 2px,rgba(255,255,255,.5) 2px 3px);
  animation:sg-scan 8s linear infinite}

/* ── THE PODIUM ROW — glowing desk edge ── */
.sg-podium{position:absolute;bottom:0;left:0;right:0;height:42%;pointer-events:none;
  background:
    repeating-linear-gradient(90deg,rgba(255,210,63,.1) 0 58px,transparent 58px 100px);
  border-top:2px solid rgba(255,210,63,.35);
  box-shadow:0 -12px 40px rgba(255,210,63,.08)}
.sg-podium::after{content:"";position:absolute;top:-1px;left:5%;right:5%;height:2px;
  background:linear-gradient(90deg,transparent,rgba(56,189,248,.6),rgba(255,210,63,.6),transparent);
  animation:sg-glow 3s ease-in-out infinite}

/* ── HOST DESK — the centre panel ── */
.sg-desk{display:flex;gap:14px;align-items:center;justify-content:center;
  padding:18px 20px;margin:0 auto 10px;max-width:560px;position:relative;z-index:1;
  background:linear-gradient(180deg,rgba(255,210,63,.06),transparent 70%);
  border:1px solid rgba(255,210,63,.15);border-radius:10px;
  animation:sg-pulse 5s ease-in-out infinite}
.sg-desk::before{content:"SNATCH GAME";position:absolute;top:-10px;left:50%;
  transform:translateX(-50%);font-size:9px;font-weight:800;letter-spacing:2.5px;
  color:#FFD23F;background:#020a14;padding:2px 12px;border:1px solid rgba(255,210,63,.3);
  border-radius:3px;text-transform:uppercase}

.sg-host{display:flex;flex-direction:column;align-items:center;gap:5px}
.sg-host-name{font-size:12px;font-weight:800;color:#FFD23F;letter-spacing:1px;text-transform:uppercase;
  text-shadow:0 0 8px rgba(255,210,63,.4)}
.sg-guest{display:flex;flex-direction:column;align-items:center;gap:4px}
.sg-guest-name{font-size:10px;color:rgba(244,239,228,.7);font-weight:600}
.sg-divider{width:1px;height:40px;background:linear-gradient(180deg,transparent,rgba(255,210,63,.3),transparent)}

/* ── QUESTION CARD — the fill-in-the-blank reveal ── */
.sg-round{margin:20px 0 8px;position:relative}
.sg-round-hdr{position:relative;padding:12px 18px;margin-bottom:14px;
  background:linear-gradient(135deg,rgba(255,210,63,.1),rgba(56,189,248,.05) 80%);
  border:1px solid rgba(255,210,63,.2);border-radius:8px;overflow:hidden}
.sg-round-hdr::before{content:"";position:absolute;top:0;left:0;width:4px;height:100%;
  background:linear-gradient(180deg,#FFD23F,#38bdf8)}
.sg-round-hdr::after{content:"";position:absolute;top:0;right:0;bottom:0;width:30%;
  background:linear-gradient(90deg,transparent,rgba(255,210,63,.04));pointer-events:none}
.sg-round-top{display:flex;align-items:center;gap:10px;margin-bottom:4px}
.sg-round-num{font-size:10px;font-weight:800;color:#020a14;letter-spacing:1px;
  text-transform:uppercase;background:#FFD23F;padding:2px 8px;border-radius:3px}
.sg-round-q{font-size:14px;font-weight:600;color:rgba(244,239,228,.95);font-style:italic;
  line-height:1.35;text-shadow:0 1px 2px rgba(0,0,0,.3)}

/* ── ANSWER CARD — the podium reveal, not a paragraph ── */
.sg-answer{position:relative;margin:8px 0;padding:12px 14px;border-radius:8px;overflow:hidden;
  background:linear-gradient(145deg,rgba(255,255,255,.06),rgba(255,255,255,.02));
  border:1px solid rgba(255,255,255,.08);transition:border-color .3s}
.sg-answer.sg-a-kill{border-color:rgba(59,224,138,.35);animation:sg-kill-flash .6s ease-out}
.sg-answer.sg-a-bomb{border-color:rgba(255,41,75,.35);animation:sg-bomb-shake .4s ease-out}
.sg-answer.sg-a-laugh{border-color:rgba(56,189,248,.2)}

.sg-answer-row{display:flex;gap:10px;align-items:center}
.sg-answer-id{flex:1;min-width:0}
.sg-answer-name{font-size:13px;font-weight:700;color:rgba(244,239,228,.95)}
.sg-answer-as{font-size:11px;font-weight:600;color:#38bdf8;display:block;margin-top:1px}

/* THE ANSWER — what she actually said, short and in character */
.sg-answer-quote{margin:8px 0 6px;padding:8px 12px;position:relative;
  font-size:13px;color:rgba(244,239,228,.92);line-height:1.4;font-style:italic;
  background:linear-gradient(90deg,rgba(255,210,63,.04),transparent 60%);
  border-left:3px solid rgba(255,210,63,.25);border-radius:0 4px 4px 0}
.sg-answer-quote::before{content:"\\201C";position:absolute;top:-4px;left:4px;
  font-size:24px;color:rgba(255,210,63,.3);font-style:normal;line-height:1}

/* ── THE LAUGH-O-METER ── */
.sg-meter{display:flex;align-items:center;gap:8px;margin-top:6px}
.sg-meter-label{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;
  min-width:36px;text-align:right}
.sg-meter-label.sg-ml-l{color:rgba(255,41,75,.7)}
.sg-meter-label.sg-ml-l::after{content:"bomb"}
.sg-meter-label.sg-ml-r{color:rgba(59,224,138,.7);text-align:left}
.sg-meter-label.sg-ml-r::after{content:"kill"}
.sg-meter-track{flex:1;height:10px;border-radius:5px;position:relative;overflow:hidden;
  background:linear-gradient(90deg,rgba(255,41,75,.12),rgba(255,200,61,.08) 50%,rgba(59,224,138,.12))}
.sg-meter-fill{position:absolute;top:0;left:0;height:100%;border-radius:5px;
  animation:sg-meter-fill .8s ease-out forwards;width:0}
.sg-meter-fill.sg-mf-kill{background:linear-gradient(90deg,#38bdf8,#3BE08A);
  box-shadow:0 0 10px rgba(59,224,138,.4)}
.sg-meter-fill.sg-mf-laugh{background:linear-gradient(90deg,#FFC83D,#38bdf8);
  box-shadow:0 0 6px rgba(56,189,248,.3)}
.sg-meter-fill.sg-mf-silence{background:linear-gradient(90deg,#FF8C42,#FFC83D)}
.sg-meter-fill.sg-mf-bomb{background:linear-gradient(90deg,#FF294B,#FF6B35);
  box-shadow:0 0 8px rgba(255,41,75,.3)}
.sg-meter-pip{position:absolute;top:-2px;height:14px;width:3px;border-radius:2px;
  background:#fff;box-shadow:0 0 6px rgba(255,255,255,.5);
  transition:left .5s ease-out}

/* HOST ENGAGEMENT — a beat in the round */
.sg-host-beat{margin:4px 0 2px;padding:6px 10px;font-size:11.5px;font-style:italic;
  color:#FFD23F;border-radius:4px;
  background:linear-gradient(90deg,rgba(255,210,63,.06),transparent 70%)}
.sg-host-beat.sg-hb-fail{color:rgba(255,200,61,.55)}

/* ── CONFESSIONAL — the talking-head cut ── */
.sg-confessional{margin:8px 16px;padding:10px 14px;position:relative;
  font-size:12px;color:rgba(244,239,228,.7);font-style:italic;line-height:1.4;
  background:linear-gradient(135deg,rgba(255,210,63,.04),transparent 50%);
  border:1px solid rgba(255,210,63,.1);border-radius:6px}
.sg-confessional::before{content:"CONFESSIONAL";position:absolute;top:-7px;left:12px;
  font-size:8px;font-weight:800;letter-spacing:1.5px;color:rgba(255,210,63,.5);
  background:#020a14;padding:0 6px;font-style:normal}

/* ── DOUBLE ACT / DYING — event callouts ── */
.sg-double{display:flex;align-items:center;gap:10px;padding:12px 16px;margin:10px 0;
  border-radius:8px;position:relative;overflow:hidden;
  background:linear-gradient(135deg,rgba(56,189,248,.08),transparent 60%);
  border:1px solid rgba(56,189,248,.2)}
.sg-double::before{content:"";position:absolute;top:0;left:0;width:3px;height:100%;background:#38bdf8}
.sg-double-badge{font-size:9px;font-weight:800;letter-spacing:1px;text-transform:uppercase;
  color:#020a14;background:#38bdf8;padding:2px 8px;border-radius:3px;white-space:nowrap}
.sg-double-text{font-size:12px;color:rgba(244,239,228,.85);flex:1}

.sg-dying{display:flex;align-items:center;gap:10px;padding:12px 16px;margin:10px 0;
  border-radius:8px;position:relative;overflow:hidden;
  background:linear-gradient(135deg,rgba(255,41,75,.08),transparent 60%);
  border:1px solid rgba(255,41,75,.2)}
.sg-dying::before{content:"";position:absolute;top:0;left:0;width:3px;height:100%;background:#FF294B}
.sg-dying-badge{font-size:9px;font-weight:800;letter-spacing:1px;text-transform:uppercase;
  color:#020a14;background:#FF294B;padding:2px 8px;border-radius:3px;white-space:nowrap}
.sg-dying-text{font-size:12px;color:rgba(244,239,228,.8);flex:1}

/* ── SCOREBOARD — final tally ── */
.sg-scoreboard{max-width:520px;margin:18px auto 0;padding:14px;position:relative;
  background:linear-gradient(180deg,rgba(255,210,63,.04),transparent 40%);
  border:1px solid rgba(255,210,63,.12);border-radius:8px}
.sg-scoreboard::before{content:"FINAL STANDINGS";position:absolute;top:-8px;left:50%;
  transform:translateX(-50%);font-size:9px;font-weight:800;letter-spacing:2px;
  color:#FFD23F;background:#020a14;padding:2px 10px;border:1px solid rgba(255,210,63,.2);
  border-radius:3px}
.sg-sb-row{display:flex;align-items:center;gap:10px;padding:7px 10px;
  border-bottom:1px solid rgba(255,255,255,.05);transition:background .2s}
.sg-sb-row:first-child{background:rgba(59,224,138,.06);border-radius:4px 4px 0 0}
.sg-sb-row:last-child{border-bottom:none}
.sg-sb-rank{width:22px;font-size:12px;font-weight:800;text-align:center}
.sg-sb-row:first-child .sg-sb-rank{color:#3BE08A}
.sg-sb-row:nth-last-child(-n+2) .sg-sb-rank{color:#FF294B}
.sg-sb-name{flex:1;font-size:12.5px;font-weight:600;color:rgba(244,239,228,.9)}
.sg-sb-char{font-size:10px;color:#38bdf8;font-weight:400}
.sg-sb-meter{width:80px;height:8px;border-radius:4px;background:rgba(255,255,255,.06);overflow:hidden}
.sg-sb-meter i{display:block;height:100%;border-radius:4px;
  background:linear-gradient(90deg,#FF294B,#FFC83D 40%,#38bdf8 70%,#3BE08A)}
.sg-sb-score{font-size:14px;font-weight:800;min-width:38px;text-align:right}
.sg-sb-score.sg-hot{color:#3BE08A;text-shadow:0 0 6px rgba(59,224,138,.3)}
.sg-sb-score.sg-cold{color:#FF294B;text-shadow:0 0 6px rgba(255,41,75,.3)}
.sg-sb-score.sg-mid{color:#FFC83D}
`;

const SG_CONFESSIONALS = {
  kill: [
    '{a} as {c} just ate that round and left nothing for the table.',
    'I think {a} might actually BE {c} at this point.',
    '{a} just had a moment. {c} would be proud.',
    'That was the answer of the night. {a} is in another league.',
    '{c} could not have said it better. {a} is winning this.',
    'The panel is GONE. {a} just took that whole round.',
  ],
  laugh: [
    '{a} is finding {c}. That one landed.',
    'I see what {a} is doing with {c}. It is working.',
    '{a} as {c} is giving the panel something to work with.',
    'Not the funniest answer, but {a} sold it. The character is there.',
  ],
  silence: [
    '{a} as {c}... I mean... yeah.',
    'The silence after {a} answered was... a choice.',
    '{a} is losing {c}. The impression is slipping.',
    '{c} just left the building and {a} is still sitting there.',
  ],
  bomb: [
    '{a} as {c} just died on that panel.',
    'If {c} saw what {a} just did, she would sue.',
    '{a} is giving us nothing. {c} has left the building.',
    'That was painful. {a} knows it too.',
    'The host is already looking at the next queen. {a} is cooked.',
    'That silence after {a} answered? That is the sound of the bottom two.',
  ],
};

const SG_HOST_LINES = {
  worked: [
    'RuPaul leans in, feeds her a setup, and she takes it and runs.',
    'RuPaul throws her a rope and she swings from it.',
    'The host plays along and she matches him beat for beat.',
  ],
  failed: [
    'RuPaul tries to throw her a lifeline. She does not catch it.',
    'The host gives her a setup and she stares at him. The panel waits.',
    'RuPaul feeds her a line and she has nothing to say back.',
  ],
};

const SG_ANSWERS = {
  kill: [
    'Honey, the answer is ALWAYS me.',
    'Well, obviously, a sequinned restraining order.',
    'I did, and the judge threw out the case because I looked that good.',
    'Darling, I invented that. You are welcome.',
    'The same thing I do every morning: terrify someone.',
    'A glass of champagne and a grudge.',
    'My third husband. He does not know yet.',
    'Whatever it is, I am charging double.',
    'Security! ...no, actually, let them watch.',
    'Two words: plausible deniability.',
    'I already trademarked that, so technically you owe me money.',
    'My lawyer said I cannot answer that. My lawyer is wrong.',
    'Botox and a dream, darling.',
    'I would tell you, but then I would have to style you.',
    'The IRS. And they did NOT see it coming.',
    'Baby, I do not have problems. I have plot twists.',
    'Five hundred dollars in quarters and a very strong purse.',
    'A restraining order and a key to the same front door.',
  ],
  laugh: [
    'Something expensive, probably.',
    'I mean... look at me. You already know.',
    'My publicist told me not to say, so... a felony.',
    'That depends on who is asking and who is paying.',
    'Oh, I have STORIES, but not for basic cable.',
    'Ask my accountant. She cries.',
    'Listen, I am not saying yes, but I am not NOT saying yes.',
    'Whatever my ex is doing, but better.',
    'A wig and a prayer.',
    'That is above my pay grade. And my pay grade is very high.',
    'My memoir covers that in chapter twelve. Pre-order now.',
    'Is that a trick question? Because I love tricks.',
    'My mother warned me about this exact situation.',
    'Well, not LEGALLY...',
    'Honestly? A nap. But make it fashion.',
    'Three martinis and a PowerPoint presentation.',
    'My therapist says I should not answer that.',
    'That is between me and God, and God is not talking.',
  ],
  silence: [
    '...yes.',
    'I... hm. Pass?',
    'That is a great question. Next question.',
    'Um. Something... fabulous?',
    'I wrote something down but I cannot read my own handwriting.',
    'What she said.',
    'Can you repeat the question? ...slower?',
    '*looks at card* I had something for this.',
    'Oh! I know this one. Wait. No I do not.',
    'Is this a test? It feels like a test.',
    'Something something... glamour?',
    'I am going to say... shoes? Final answer.',
    '*nervous laugh* Define "blank."',
    'My answer is... pending.',
    '*taps card* Come on, brain.',
    'That is... a word. That I know. Probably.',
    '*looks to the queen next to her* Help.',
    '*stares ahead* I think my character just died.',
  ],
  bomb: [
    '...',
    '*blinks*',
    'I... um... *nervous laugh*',
    '*stares into the camera*',
    '*long pause* ...bananas?',
    '*opens mouth, closes it, opens it again*',
    '*dead silence*',
    '*looks down at blank card*',
    '*whispers* I forgot who I am.',
    '*just shakes head slowly*',
    '*starts to speak, stops, starts again, stops*',
    '*taps microphone* Is this thing on? ...I wish it was not.',
    '*visibly panicking*',
    '*turns card over as if the answer is on the back*',
    '*mouth opens but nothing comes out*',
    '*looks at host like a deer in headlights*',
    '*silence so long the host moves on*',
    '*tries to laugh it off, does not succeed*',
  ],
};

function _sgMeter(score, reaction) {
  const pct = Math.max(5, Math.min(100, Math.round((score / 12) * 100)));
  return `<div class="sg-meter" aria-label="Score: ${Math.round(score)} out of 12">
    <span class="sg-meter-label sg-ml-l" aria-hidden="true"></span>
    <div class="sg-meter-track">
      <div class="sg-meter-fill sg-mf-${reaction}" style="--fill:${pct}%;width:${pct}%"></div>
      <div class="sg-meter-pip" style="left:${pct}%"></div>
    </div>
    <span class="sg-meter-label sg-ml-r" aria-hidden="true"></span>
  </div>`;
}

function rpBuildSnatchGame(row) {
  const ep = epOf(row);
  const ch = row?.dr?.challenge;
  const perfs = row?.dr?.performances || {};
  const asgn = row?.dr?.assignment || {};
  const order = (asgn.order || []).filter(n => perfs[n]);
  const running = order.length ? order : Object.keys(perfs);
  if (!ch || !running.length) return '';

  const tapingData = _sceneData(ep, 'snatch-taping') || {};
  const rounds = tapingData.rounds || [];
  const hostBeats = tapingData.hostBeats || [];

  const MAXI_STEPS = new Set(['maxi-pre', 'maxi-main']);
  const maxiScenes = (row.dr.scenes || []).filter(sc => sc.text
    && MAXI_STEPS.has(sc.step)
    && /^(perform:|maxi:|chal:performance)/.test(sc.kind || ''));
  const usedScene = new Set();
  const sceneFor = name => {
    const sc = maxiScenes.find(s => {
      if (usedScene.has(s)) return false;
      if ((s.data?.players || [])[0] !== name) return false;
      usedScene.add(s);
      return true;
    });
    return sc?.text || '';
  };

  const pickGuests = () => {
    const nonPerm = JUDGES.filter(j => !j.permanent && j.id !== 'rupaul');
    if (nonPerm.length >= 2) return nonPerm.slice(0, 2);
    return JUDGES.filter(j => j.id !== 'rupaul').slice(0, 2);
  };
  const guests = pickGuests();

  const sfx = 'maxi';
  const steps = [];
  let stepIdx = 0;
  const rng = _seedRng(ep.num || 0);

  steps.push(`<div class="dr-step" id="dr-step-${sfx}-${stepIdx}">
    <div class="sg-desk">
      <div class="sg-host">
        ${_judgePortrait('rupaul', { stage: true, size: 60 })}
        <span class="sg-host-name">RuPaul</span>
      </div>
      <div class="sg-divider"></div>
      ${guests.map(g => `<div class="sg-guest">
        ${_judgePortrait(g.id, { stage: true, size: 46, name: g.name })}
        <span class="sg-guest-name">${esc(g.name)}</span>
      </div>`).join('<div class="sg-divider"></div>')}
    </div>
    <div class="sg-confessional">Welcome to Snatch Game, where our queens become the celebrities and the celebrities become the punchlines. Joining me on the panel: ${guests.map(g => g.name).join(' and ')}.</div>
  </div>`);
  stepIdx++;

  const dyingQueens = new Set();
  for (const n of running) {
    if ((perfs[n]?.detail?.flops || 0) >= 3) dyingQueens.add(n);
  }
  const usedAnswers = new Set();

  for (const rd of rounds) {
    const featured = rd.featured || [];
    if (!featured.length) continue;

    steps.push(`<div class="dr-step" id="dr-step-${sfx}-${stepIdx}">
      <div class="sg-round">
        <div class="sg-round-hdr">
          <div class="sg-round-top">
            <span class="sg-round-num">Round ${rd.round}</span>
          </div>
          <span class="sg-round-q">${esc(rd.question || `Question ${rd.round}`)}</span>
        </div>
        ${featured.map(f => {
    const cardCls = f.reaction === 'kill' ? ' sg-a-kill'
      : f.reaction === 'bomb' ? ' sg-a-bomb'
        : f.reaction === 'laugh' ? ' sg-a-laugh' : '';
    const hbThis = f.hostBeat
      ? hostBeats.find(h => h.round === rd.round && h.name === f.name) : null;

    const answerPool = SG_ANSWERS[f.reaction] || SG_ANSWERS.silence;
    const fresh = answerPool.filter(a => !usedAnswers.has(a));
    const pick = fresh.length ? fresh : answerPool;
    const answer = pick[Math.floor(rng() * pick.length)];
    usedAnswers.add(answer);
    const prose = sceneFor(f.name);

    const hostLine = hbThis
      ? _pickLine(hbThis.worked ? SG_HOST_LINES.worked : SG_HOST_LINES.failed, rng)
      : '';

    return `<div class="sg-answer${cardCls}">
            <div class="sg-answer-row">
              ${_portrait(f.name, ep, { size: 48, station: true })}
              <div class="sg-answer-id">
                <span class="sg-answer-name">${esc(f.name)}</span>
                <span class="sg-answer-as">as ${esc(f.character || '???')}</span>
              </div>
            </div>
            <div class="sg-answer-quote">${esc(answer)}</div>
            ${_sgMeter(f.score, f.reaction)}
            ${hostLine ? `<div class="sg-host-beat${hbThis && !hbThis.worked ? ' sg-hb-fail' : ''}">${esc(hostLine)}</div>` : ''}
            ${prose ? `<p class="dr-perf-line" style="font-size:11px;margin:4px 0 0;color:rgba(244,239,228,.55)">${esc(prose)}</p>` : ''}
          </div>`;
  }).join('')}
      </div>
    </div>`);
    stepIdx++;

    if (featured.some(f => f.reaction === 'kill' || f.reaction === 'bomb')) {
      const notable = featured.find(f => f.reaction === 'kill' || f.reaction === 'bomb');
      if (notable) {
        const pool = SG_CONFESSIONALS[notable.reaction] || [];
        const line = _pickLine(pool, rng, notable.name, notable.character);
        if (line) {
          steps.push(`<div class="dr-step" id="dr-step-${sfx}-${stepIdx}">
            <div class="sg-confessional">${esc(line)}</div>
          </div>`);
          stepIdx++;
        }
      }
    }
  }

  for (const sc of (row.dr.scenes || [])) {
    if (sc.kind !== 'maxi:double-act' && sc.data?.type !== 'double-act') continue;
    const pls = sc.data?.players || [];
    if (pls.length < 2) continue;
    const chars = pls.map(n => characterById(asgn.picks?.[n]?.choice)?.name || '???');
    steps.push(`<div class="dr-step" id="dr-step-${sfx}-${stepIdx}">
      <div class="sg-double">
        ${pls.slice(0, 2).map(n => _portrait(n, ep, { size: 38 })).join('')}
        <span class="sg-double-badge">Double Act</span>
        <span class="sg-double-text">${esc(pls[0])} as ${esc(chars[0])} and ${esc(pls[1])} as ${esc(chars[1])} build a bit together and the whole panel lifts.</span>
      </div>
    </div>`);
    stepIdx++;
  }

  for (const n of running) {
    if (!dyingQueens.has(n)) continue;
    const c = characterById(asgn.picks?.[n]?.choice)?.name || '???';
    steps.push(`<div class="dr-step" id="dr-step-${sfx}-${stepIdx}">
      <div class="sg-dying">
        ${_portrait(n, ep, { size: 38 })}
        <span class="sg-dying-badge">Dying on the Panel</span>
        <span class="sg-dying-text">${esc(n)} as ${esc(c)} has flatlined. Three rounds of silence and the host has moved on.</span>
      </div>
    </div>`);
    stepIdx++;
  }

  const ranked = [...running]
    .map(n => ({ n, p: Number(perfs[n]?.perf) || 0, c: perfs[n]?.detail?.character || '???' }))
    .sort((x, y) => y.p - x.p);
  const maxScore = Math.max(1, ...ranked.map(r => r.p));
  steps.push(`<div class="dr-step" id="dr-step-${sfx}-${stepIdx}">
    <div class="sg-scoreboard">
      ${ranked.map((r, i) => {
    const cls = r.p >= 8 ? 'sg-hot' : r.p <= 4 ? 'sg-cold' : 'sg-mid';
    return `<div class="sg-sb-row">
          <span class="sg-sb-rank">${i + 1}</span>
          ${_portrait(r.n, ep, { size: 32 })}
          <span class="sg-sb-name">${esc(r.n)} <span class="sg-sb-char">as ${esc(r.c)}</span></span>
          <span class="sg-sb-meter"><i style="width:${Math.round((r.p / maxScore) * 100)}%"></i></span>
          <span class="sg-sb-score ${cls}">${n1(r.p)}</span>
        </div>`;
  }).join('')}
    </div>
  </div>`);
  stepIdx++;

  if (typeof window !== 'undefined') {
    window._drSidebar = window._drSidebar || {};
    const panels = [];
    for (let si = 0; si <= stepIdx; si++) {
      const upTo = Math.min(si, rounds.length);
      const shown = new Set();
      for (let ri = 0; ri < upTo; ri++) {
        for (const f of (rounds[ri]?.featured || [])) shown.add(f.name);
      }
      panels.push(`<h4 class="dr-disp">The Panel</h4>${
        ranked.filter(r => shown.has(r.n) || si >= stepIdx - 1)
          .map(r => `<div class="dr-slot">${_portrait(r.n, ep, { size: 30 })}
            <div><div class="dr-nm">${esc(r.n)}</div>
            <div style="font-size:10px;color:#38bdf8">${esc(r.c)}</div></div>
            ${si >= stepIdx - 1
    ? `<span class="dr-chip ${r.p >= 8 ? 'dr-c-win' : r.p >= 6 ? 'dr-c-high' : r.p >= 4 ? 'dr-c-safe' : 'dr-c-low'}">${n1(r.p)}</span>`
    : ''}</div>`).join('')}`);
    }
    window._drSidebar[sfx] = panels;
  }

  const leftoverScenes = maxiScenes.filter(sc => !usedScene.has(sc))
    .map((sc, i) => {
      usedScene.add(sc);
      return `<div class="dr-step" id="dr-step-${sfx}-room-${i}">
      <div class="dr-panel dr-a-room dr-scene">
        ${(sc.data?.players || []).length
    ? `<span class="dr-who">${(sc.data.players || []).slice(0, 2)
      .map(n => _portrait(n, ep, { size: 42 })).join('')}</span>` : ''}
        <div class="dr-scene-body">${esc(sc.text)}</div>
      </div></div>`;
    }).join('');

  return `<style>${CHAL_CSS}${SG_CSS}</style>${_shell(
    `<div class="dr-fam dr-chal dr-chal-snatch-game sg"><div class="sg-podium"></div>${steps.join('')}${leftoverScenes}</div>`, ep, {
      phase: 'stage', title: 'Snatch Game', subtitle: 'and the answer is',
      sidebar: _seedRail(sfx, '<h4 class="dr-disp">The Panel</h4>'),
    })}${_controls(sfx, stepIdx, ep.num)}`;
}

function _seedRng(seed) {
  let s = seed | 0;
  return () => { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; };
}

function _pickLine(pool, rng, name, character) {
  if (!pool || !pool.length) return '';
  const idx = Math.floor(rng() * pool.length);
  return pool[idx].replace(/\{a\}/g, name).replace(/\{c\}/g, character || '???');
}

export function rpBuildMaxi(row) {
  if (row?.dr?.tournament) return rpBuildTournament(row);
  if (row?.dr?.challenge?.id === 'ball') return rpBuildBall(row);
  if (row?.dr?.challenge?.id === 'snatch-game') return rpBuildSnatchGame(row);
  const ep = epOf(row);
  const ch = row?.dr?.challenge;
  const perfs = row?.dr?.performances || {};
  const names = Object.keys(perfs);
  if (!ch || !names.length) return '';
  const a = row?.dr?.assignment || {};
  const order = (a.order || []).filter(n => perfs[n]);
  const running = order.length ? order : names;

  /* THE GROUP'S OWN NAME. These read "Team 1" and "Team 2" — the girl group
     challenge had no theme at all, so the track was nameless and two identical
     groups performed the same nothing every time it came up. The theme now
     names the night's sound and each group falls out of it. Falls back to the
     number for any challenge that genuinely has unnamed teams. */
  const teamNames = a.teamNames || _sceneData(ep, 'group-parts')?.teamNames || [];
  /* ── THE BOARD IS THE LINE-UP, NOT THE RESULT ──
     This drew the winning team with a gold border and "— took it" beside its
     name, at the TOP of the maxi screen, before a single performance had been
     revealed. The reader was told who won the challenge and then invited to
     click through thirteen cards finding out how.
     The three-step rule in docs/drag-race.md is the same point from the other
     end: what she did, then what the panel thought, then what the host
     decided. A screen showing the performances cannot know the third one.
     The winning team is announced on the call, where the host announces it —
     every row there carries her team now, so "the winning team is Candy
     Coated" reads off the WIN row at the moment it is revealed. */
  const teams = (a.teams || []).length > 1 ? `<div class="dr-teams">${
    a.teams.map((team, ti) => {
      const label = teamNames[ti] || `Team ${ti + 1}`;
      return `<div class="dr-team">
        <h4 class="dr-disp">${esc(label)}</h4>
        ${team.map(n => `<div class="dr-member">${_portrait(n, ep, { size: 30 })}
          ${esc(n)}<span class="dr-role">${esc(perfs[n]?.role || '')}</span></div>`).join('')}
      </div>`;
    }).join('')}</div>` : '';

  /* AND THE NIGHT AS IT WAS WRITTEN. This drew a card per queen — portrait,
     score bar, a detail panel — and dropped every word of the challenge:
     9,452 characters of narration on the row against 657 on the screen. The
     maxi is the longest part of an episode and it was the emptiest.
     Her own lines sit with her card; anything about the room rather than one
     queen (the taping, a bit stolen, the whole cast reacting) runs between
     the cards in the order it happened. */
  /* NOT THE ONES THAT HAPPEN IN THE WERK ROOM. This filtered on kind alone,
     and the host's walkthrough is a `maxi:` kind that happens at a station
     while the queens are still building — js/dr/data/maxi-events.js has said
     `from: 'prep'` about it since it was written. Caught on kind, RuPaul
     looking at a half-built garment was drawn on the card for the
     performance given afterwards: the wrong screen, and the wrong moment in
     the night, because the note is given so the runway can answer it. */
  /* ── AND ON THE STEP, POSITIVELY ──
     This said `step !== 'prep'`, which is a denylist of one: a `maxi:` kind
     that happens at any OTHER moment of the night still landed here. The
     draft's contest scenes carry step `choice` and kind `maxi:contest`, so
     "she reaches for the same part and MK gets there first" was drawn on the
     card for a makeover, above the score for a wig.
     The maxi happens on `maxi-pre` or `maxi-main` and nowhere else, so that
     is what this asks for. A kind that arrives on a third step is a scene
     that belongs to a third screen. */
  const MAXI_STEPS = new Set(['maxi-pre', 'maxi-main']);
  const maxiScenes = (row.dr.scenes || []).filter(sc => sc.text
    && MAXI_STEPS.has(sc.step)
    && /^(perform:|maxi:|chal:performance)/.test(sc.kind || ''));
  const usedScene = new Set();
  const linesFor = name => maxiScenes.filter(sc => {
    if (usedScene.has(sc)) return false;
    const players = sc.data?.players || [];
    if (players[0] !== name) return false;
    usedScene.add(sc);
    return true;
  });

  /* WHICH OF THE TWO MAXI SCREENS THIS IS. A challenge filmed during the
     week and a challenge performed live on the main stage are two different
     nights and two different slots in the running order, so they are two
     sections — and the reveal state, the step ids and the controls are keyed
     by suffix, which therefore has to follow the stage rather than be typed
     once. js/dr/data/challenges.js has recorded the stage since it was
     written; this is the first screen to read it. */
  const sfx = (maxiById(ch.id)?.stage === 'pre') ? 'maxi' : 'maxistage';

  const steps = running.map((name, i) => {
    const said = linesFor(name)
      .map(sc => `<p class="dr-perf-line">${esc(sc.text)}</p>`).join('');
    const card = perfCard(name, perfs[name], i, sfx, ep, ch.id);
    return said
      ? card.replace(/<\/div><\/div>$/, `${said}</div></div>`)
      : card;
  }).join('');

  // Whatever was about the room rather than one queen, after the cards.
  const room = maxiScenes.filter(sc => !usedScene.has(sc))
    .map((sc, i) => `<div class="dr-step" id="dr-step-${sfx}-room-${i}">
      <div class="dr-panel dr-a-room dr-scene">
        ${(sc.data?.players || []).length
    ? `<span class="dr-who">${(sc.data.players || []).slice(0, 2)
      .map(n => _portrait(n, ep, { size: 42 })).join('')}</span>` : ''}
        <div class="dr-scene-body">${esc(sc.text)}</div>
      </div></div>`).join('');

  /* THE RUNNING ORDER, GATED. The rail shows the queens up to the step the
     viewer has reached and nobody after — a panel carrying a score she has
     not been shown is the spoiler this screen exists to avoid. */
  if (typeof window !== 'undefined') {
    window._drSidebar = window._drSidebar || {};
    window._drSidebar[sfx] = running.map((_, i) => `<h4 class="dr-disp">So far</h4>${
      running.slice(0, i + 1)
        .map(n => ({ n, p: Number(perfs[n]?.perf) || 0 }))
        .sort((x, y) => y.p - x.p)
        .map(({ n, p }) => `<div class="dr-slot">${_portrait(n, ep, { size: 32 })}
          <div><div class="dr-nm">${esc(n)}</div>${_mateChip(row, n)}</div>
          <span class="dr-chip ${p >= 8 ? 'dr-c-win' : p >= 6 ? 'dr-c-high' : p >= 4 ? 'dr-c-safe' : 'dr-c-low'}">${n1(p)}</span>
        </div>`).join('')}`);
  }

  const skin = skinFor(ch.id);
  return `<style>${CHAL_CSS}</style>${_shell(
    `<div class="dr-fam dr-chal dr-chal-${ch.id}">${ambientFor(ch.id)}${teams}${steps}${room}</div>`, ep, {
      phase: 'stage', title: ch.name, subtitle: skin.sub,
      sidebar: _seedRail(sfx, '<h4 class="dr-disp">So far</h4>'),
    })}${_controls(sfx, running.length, ep.num)}`;
}
