// ══════════════════════════════════════════════════════════════════════
// vp-dr/results.js — the call, the lip sync, the exit, the crown
// ══════════════════════════════════════════════════════════════════════
//
// The end of the night, and the four screens that decide it.
//
// ── THE CALL IS WHERE THE HOST'S DECISION FINALLY SHOWS ───────────────
//
// The critiques screen deliberately does not carry `finalRank`, because at
// that point the host has not decided. THIS screen is where she has. So it
// is the one place the two ranks appear together, and where a queen the host
// moved is marked as moved — the panel had her fourth, the call has her
// second, and that difference is the show.
//
// ── AND THE LIP SYNC IS A VERSUS ──────────────────────────────────────
//
// Two busts facing off, energy bars, beat by beat. Not a scene list with
// two names in it: the reveal is a fight and the screen is built like one.
// The loser's portrait greys out under a stamp at the end.
import { _shell, _portrait, _judgePortrait, _icon } from './style.js';
import { resultOrder } from '../dr/data/results-order.js';
import { _controls, _seedRail } from './reveal.js';
import { GRID_RESULTS } from '../dr/grid.js';
import { showWords } from '../shows.js';

const esc = v => String(v ?? '').replace(/[&<>"]/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const n1 = v => (Number.isFinite(Number(v)) ? Number(v).toFixed(1) : '—');
const epOf = row => ({ num: row?.num ?? row?.dr?.ep ?? 0, format: 'drag-race', dr: row?.dr || {} });

export const RESULTS_CSS = `
/* The pause before the last call. Deliberately not a call row: it is not
   about a queen and should read as a gap in the column rather than a row. */
.dr-hold{display:grid;grid-template-columns:auto 1fr;gap:12px;align-items:center;
  padding:12px 16px;opacity:.92}
.dr-hold p{margin:0;color:#f4e3ed;line-height:1.6;text-wrap:pretty}

/* THE HOST'S OWN LINES ON THE LIP SYNC, with her face on them. She speaks
   five of the beats on this screen — the address, the hold, the shantay, the
   sashay and the fallback call — and they were drawn as anonymous paragraphs
   with the queen's portrait beside them, which reads as narration about her
   rather than her talking. In drag, because she is on the main stage. */
.dr-hostsay{display:inline-flex;align-items:center;gap:-6px}
.dr-hostsay > :nth-child(2){margin-left:-14px;box-shadow:0 0 0 3px #1a0f18}

.dr-said{margin:8px 0 0;color:#f4e3ed;line-height:1.55;text-wrap:pretty}
/* THE CARD TAKES THE COLOUR OF THE VERDICT. Every row on the call was the
   same pink lozenge and only the rubber stamp differed, so a screen whose
   whole job is sorting eight queens into six outcomes read as one block of
   text. The verdict already has a colour in GRID_RESULTS; the row now wears
   it — rail, wash and border — and the shape of the week is legible before
   a word is read. */
.dr-callrow{display:grid;grid-template-columns:auto 1fr auto auto;gap:14px;align-items:center;
  padding:13px 16px 13px 20px}
/* .dr-panel FIRST: the shell's accent class sets the same left border, and a
   bare .dr-callrow ties with it on specificity — the tint applied to the
   heading and to nothing else. */
.dr-panel.dr-callrow{border:1px solid color-mix(in srgb,var(--v,#7a3a5e) 30%,var(--dr-line));
  border-left:4px solid var(--v,#7a3a5e);
  background:linear-gradient(90deg,color-mix(in srgb,var(--v,#7a3a5e) 22%,transparent),
    transparent 44%),var(--dr-panel)}
/* SAFE IS THE ABSENCE OF A RESULT and should recede rather than glow. */
.dr-panel.dr-callrow.dr-quiet{opacity:.8}
/* ══ THE LIP SYNC FLOOR ══ two spots on a black stage ══ */
.dr-lsroom{position:relative}
.dr-lsfloor{position:absolute;inset:-24px -18px;z-index:-1;pointer-events:none;
  overflow:hidden;background:linear-gradient(180deg,rgba(30,2,10,.6),transparent 42%)}
.dr-lsfloor i{position:absolute;display:block}
.dr-ls-a,.dr-ls-b{top:0;width:250px;height:60%;
  background:linear-gradient(180deg,rgba(255,41,75,.24),transparent 74%);
  clip-path:polygon(36% 0,64% 0,100% 100%,0 100%)}
.dr-ls-a{left:14%}.dr-ls-b{right:14%}
/* The speakers, under everything. */
.dr-ls-thud{left:0;right:0;bottom:0;height:30%;
  background:radial-gradient(70% 100% at 50% 100%,rgba(255,41,75,.20),transparent 72%);
  animation:drThud 1.9s ease-in-out infinite}
@keyframes drThud{0%,100%{opacity:.55}50%{opacity:1}}

/* ══ THE WAY OUT ══ a lit door at the end of a dark corridor ══ */
.dr-exitroom{position:relative}
.dr-exitway{position:absolute;inset:-24px -18px;z-index:-1;pointer-events:none;
  overflow:hidden;background:linear-gradient(180deg,rgba(10,2,6,.55),transparent 50%)}
.dr-exitway i{position:absolute;display:block}
.dr-ex-door{top:14%;left:50%;width:120px;height:210px;transform:translateX(-50%);
  background:linear-gradient(180deg,rgba(255,233,168,.22),rgba(255,233,168,.05));
  box-shadow:0 0 90px 26px rgba(255,200,61,.13)}
.dr-ex-dark{inset:0;box-shadow:inset 0 0 200px 80px rgba(0,0,0,.7)}

@media(prefers-reduced-motion:reduce){.dr-ls-thud{animation:none}}

/* ══ THE LINE ══ the queens the panel kept back, standing for the call ══ */
.dr-lineup-stage{position:sticky;top:0;z-index:6;display:flex;justify-content:center;
  gap:14px;flex-wrap:wrap;padding:16px 18px;margin:0 0 18px;
  background:radial-gradient(120% 110% at 50% 0%,rgba(56,189,248,.14),transparent 62%),
    linear-gradient(180deg,#12071C,#0a0410 78%,rgba(6,2,8,.96));
  border-bottom:1px solid rgba(255,255,255,.12);
  box-shadow:0 18px 38px -22px rgba(0,0,0,.95)}
.dr-standing{width:104px;text-align:center;opacity:.5;filter:grayscale(.55);
  transition:opacity .35s,filter .35s,transform .35s}
.dr-standing.called{opacity:1;filter:none;transform:translateY(-3px)}
.dr-standing .dr-por{margin:0 auto;border:2px solid rgba(255,255,255,.18)}
.dr-standing b{display:block;margin-top:6px;font-size:12px;color:#f0dfe9;
  overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dr-standing-tag{display:block;min-height:13px;margin-top:3px;font-size:9.5px;
  letter-spacing:.16em}
/* Her stamp's colour is the chart's, so the line and the record agree. */
.dr-r-WIN .dr-standing-tag{color:#38bdf8}
.dr-r-WIN .dr-por{border-color:#38bdf8}
.dr-r-HIGH .dr-standing-tag{color:#7dd3fc}
.dr-r-HIGH .dr-por{border-color:#7dd3fc}
.dr-r-LOW .dr-standing-tag{color:#fb923c}
.dr-r-LOW .dr-por{border-color:#fb923c}
.dr-r-BTM .dr-standing-tag{color:#fca5a5}
.dr-r-BTM .dr-por{border-color:#fca5a5}
.dr-r-BTM2 .dr-standing-tag{color:#f87171}
.dr-r-BTM2 .dr-por{border-color:#f87171}
.dr-step{scroll-margin-top:200px}
@media(max-width:760px){.dr-lineup-stage{position:static}.dr-standing{width:78px}}
@media(prefers-reduced-motion:reduce){.dr-standing{transition:none}}

/* The safe queens, on one card, because they share one sentence. */
.dr-safefaces{display:flex;flex-wrap:wrap;gap:5px;max-width:190px}
.dr-safegroup h3{margin-bottom:2px}
.dr-callrow h3{color:color-mix(in srgb,var(--v,#fff) 42%,#fff)}
.dr-callrow h3{margin:0;font-size:18px}
.dr-stamp{font-size:22px;padding:7px 14px;border:3px solid currentColor;transform:rotate(-6deg);
  line-height:1;animation:drSlam .45s cubic-bezier(.2,1.6,.4,1) both}
@keyframes drSlam{from{transform:rotate(-6deg) scale(2.4);opacity:0}
  to{transform:rotate(-6deg) scale(1);opacity:1}}
.dr-moved{font-size:10px;letter-spacing:.14em;text-transform:uppercase;padding:3px 9px;
  border:1px solid #FFC83D;color:#FFC83D}

/* ── THE VERSUS ── */
.dr-vs{display:grid;grid-template-columns:1fr auto 1fr;gap:16px;align-items:center;
  padding:22px;margin-bottom:14px;border:1px solid rgba(255,41,75,.5);position:relative;
  overflow:hidden;background:radial-gradient(600px 260px at 50% 40%,rgba(255,41,75,.26),transparent 70%),
    linear-gradient(180deg,#2a0410,#120207)}
.dr-vs::before{content:"";position:absolute;inset:0;
  background:repeating-linear-gradient(115deg,transparent 0 22px,rgba(255,41,75,.09) 22px 44px);
  animation:drSlide 8s linear infinite}
@keyframes drSlide{to{transform:translateX(44px)}}
.dr-fighter{position:relative;z-index:2;text-align:center}
.dr-fighter .dr-por{margin:0 auto;border:3px solid rgba(255,240,200,.6);
  box-shadow:0 0 46px rgba(255,41,75,.6)}
.dr-fighter.dr-r .dr-por{transform:scaleX(-1)}
.dr-fighter b{display:block;margin-top:8px;font-size:20px}
.dr-energy{height:12px;background:rgba(0,0,0,.6);border:1px solid rgba(255,255,255,.3);
  margin-top:9px;overflow:hidden}
.dr-energy i{display:block;height:100%;background:linear-gradient(90deg,#FFC83D,#FF294B)}
.dr-bolt{position:relative;z-index:2;font-size:56px;color:#fff;
  text-shadow:0 0 22px #FF294B,0 0 60px #FF294B;animation:drPulse 1.6s ease-in-out infinite}
@keyframes drPulse{0%,100%{transform:scale(1)}50%{transform:scale(1.1)}}
/* THE BEAT CARDS UNDER THE VERSUS. */
.dr-beat{display:grid;grid-template-columns:1fr;gap:13px;align-items:start;
  padding:14px 16px 14px 20px}
.dr-beat p{margin:0;color:#f4e3ed;line-height:1.6;text-wrap:pretty}
.dr-beat .dr-por{border:2px solid rgba(255,240,200,.45)}
.dr-beat-a,.dr-beat-b{grid-template-columns:auto 1fr}
/* .dr-panel FIRST, deliberately. The shell's accent classes set the same
   left border, so a bare .dr-beat-a ties on specificity and loses to
   whichever stylesheet was injected last — both sides came out the same red
   and the whole point of the two colours went with it. */
.dr-panel.dr-beat-a{border-left:3px solid #FFC83D;
  background:linear-gradient(90deg,rgba(255,200,61,.13),transparent 40%),var(--dr-panel)}
/* The second queen's beats mirror: her portrait sits on the right, the way
   she does on the stage above. */
.dr-panel.dr-beat-b{direction:rtl;border-left:0;border-right:3px solid #FF294B;
  background:linear-gradient(270deg,rgba(255,41,75,.15),transparent 40%),var(--dr-panel)}
.dr-beat-b > *{direction:ltr}
.dr-beat-b .dr-por{transform:scaleX(-1)}
/* ══ THE SCOREBOARD ══ the fight, scored as it happens ══ */
.dr-mid{display:flex;flex-direction:column;align-items:center;gap:10px;
  position:relative;z-index:2;min-width:150px}
/* The four rounds of the song, lighting as it runs. */
.dr-rounds{display:flex;gap:5px}
.dr-rounds i{position:relative;width:26px;height:4px;border-radius:2px;
  background:rgba(255,255,255,.16);transition:background .3s,box-shadow .3s}
/* ONLY THE ROUND THAT IS PLAYING IS NAMED. Four labels under four 26px
   pips ran into each other — "VERSECHORUS HOOK ENDING" — so the strip
   said less the more of it was lit. The name belongs to the round the song
   is in; the others are pips. */
.dr-rounds i b{position:absolute;top:9px;left:50%;transform:translateX(-50%);
  font-size:8px;letter-spacing:.16em;text-transform:uppercase;color:#FFE9A8;
  font-weight:400;white-space:nowrap;opacity:0;transition:opacity .3s}
.dr-rounds i.now b{opacity:1}
.dr-rounds i.on{background:#FF294B;box-shadow:0 0 10px rgba(255,41,75,.8)}
.dr-rounds i.now{background:#FFE9A8;box-shadow:0 0 16px rgba(255,233,168,.95)}
.dr-rounds i.on:last-child b{opacity:1}
/* The tug of war: who is winning the exchange, right now. */
.dr-tug{position:relative;width:130px;height:3px;margin-top:22px;border-radius:2px;
  background:linear-gradient(90deg,rgba(255,41,75,.5),rgba(255,255,255,.18),rgba(255,41,75,.5))}
.dr-tug i{position:absolute;top:-5px;left:50%;width:3px;height:13px;border-radius:2px;
  background:#fff;box-shadow:0 0 12px rgba(255,255,255,.95);transform:translateX(-50%);
  transition:left .55s cubic-bezier(.2,1,.3,1)}
/* The number only exists once the call has been made. */
.dr-final{display:block;margin-top:8px;min-height:22px;font-size:20px;color:#FFE9A8}
/* And when it has, the stage picks a side. */
.dr-vs.dr-decided .dr-fighter{transition:opacity .5s,filter .5s}
.dr-vs.dr-won-a .dr-fighter.dr-r,.dr-vs.dr-won-b .dr-fighter:not(.dr-r){
  opacity:.42;filter:grayscale(1)}
.dr-vs.dr-won-a .dr-fighter:not(.dr-r) .dr-por,
.dr-vs.dr-won-b .dr-fighter.dr-r .dr-por{
  border-color:#FFE9A8;box-shadow:0 0 60px -4px rgba(255,233,168,.9)}
.dr-energy i{transition:width .6s cubic-bezier(.2,1,.3,1)}
/* ── HER LAST CARD, AND THE LIGHT GOING OUT ──
   Modelled on the Total Drama torch snuff (css/simulator.css, torchSnuff):
   an ANIMATION rather than a transition, and a HELD DELAY before it runs.
   The delay is the whole effect. She is revealed lit, the reader has time
   to read what she said, and only then does the light come off her —
   greying her the instant the card appears reads as a state, greying her a
   beat late reads as something happening to her.
   It keys off .dr-vis, the class the reveal adds, so the snuff cannot
   desync from the reveal the way a hook-driven one can. */
@keyframes drSnuff{
  from{filter:brightness(1) grayscale(0)}
  to{filter:brightness(.42) grayscale(1)}
}
@keyframes drFareLift{
  from{opacity:0;transform:translate3d(0,18px,0)}
  to{opacity:1;transform:none}
}
.dr-farebox{text-align:center;padding:26px 20px 22px;position:relative;overflow:hidden}
/* The spot she is standing in, which goes down with her. */
.dr-farebox::before{content:'';position:absolute;left:50%;top:-40px;width:280px;height:220px;
  transform:translateX(-50%);pointer-events:none;
  background:radial-gradient(ellipse at 50% 0%,rgba(255,233,168,.22),transparent 70%);
  animation:drSnuff 1.6s ease-in 1.5s both}
.dr-farelabel{display:block;font-size:11px;letter-spacing:.28em;text-transform:uppercase;
  color:#FF7FA8;margin-bottom:14px}
.dr-farepor{display:inline-block;position:relative}
.dr-farepor .dr-por,.dr-farepor .dr-initials{
  border-radius:50%;border:2px solid rgba(255,233,168,.55);
  box-shadow:0 0 46px -6px rgba(255,233,168,.7)}
.dr-fare.dr-vis .dr-farepor .dr-por,.dr-fare.dr-vis .dr-farepor .dr-initials{
  animation:drSnuff 1.4s ease-in 1.5s both}
.dr-farename{display:block;margin-top:12px;font-size:26px;letter-spacing:.04em;color:#fff}
.dr-faresay{max-width:44ch;margin:10px auto 0;font-size:17px;line-height:1.65;
  color:#ffd7e8}
.dr-fare.dr-vis .dr-farebox{animation:drFareLift .55s cubic-bezier(.2,1,.3,1) both}

@media(prefers-reduced-motion:reduce){
  .dr-tug i,.dr-energy i,.dr-rounds i{transition:none}
  .dr-fare.dr-vis .dr-farebox{animation:none}
  /* The snuff still has to LAND — reduced motion means no drawn-out fade,
     not a queen who goes home with her light still on. */
  .dr-fare.dr-vis .dr-farepor .dr-por,.dr-fare.dr-vis .dr-farepor .dr-initials,
  .dr-farebox::before{animation:none;filter:brightness(.42) grayscale(1)}
}

.dr-song{text-align:center;font-family:Didot,'Bodoni MT',Georgia,serif;font-style:italic;
  font-size:19px;color:#ffd0e8;margin-bottom:12px}

/* ── THE EXIT ── */
/* THREE COLUMNS, and the stamp lives in the third. It was absolutely
   positioned at right:24px over a two-column card, so SASHAYED AWAY was
   printed straight across the middle of the mirror message and neither was
   readable. The rotation is a transform and costs no layout, so the stamp
   still reads as slammed on. */
.dr-exit{position:relative;display:grid;grid-template-columns:auto 1fr auto;gap:20px;
  align-items:center;padding:22px;border:1px solid rgba(255,41,75,.4);
  background:linear-gradient(180deg,#20030c,#0d0206)}
@media(max-width:760px){.dr-exit{grid-template-columns:auto 1fr}}
.dr-exit .dr-por{filter:grayscale(1) brightness(.5)}
.dr-bigstamp{align-self:start;justify-self:end;font-size:34px;color:#FF294B;
  white-space:nowrap;
  border:4px solid #FF294B;padding:8px 16px;transform:rotate(-11deg);
  text-shadow:0 0 26px rgba(255,41,75,.9);animation:drSlam .5s cubic-bezier(.2,1.6,.4,1) both}
.dr-mirrorline{font-family:Didot,'Bodoni MT',Georgia,serif;font-style:italic;font-size:18px;
  color:#ffd0e8;border-left:3px solid #FF294B;padding-left:14px;margin:8px 0 0;text-wrap:pretty}

/* ── THE CROWN ── */
.dr-crown{text-align:center;padding:34px 22px;
  background:radial-gradient(600px 300px at 50% 20%,rgba(255,200,61,.28),transparent 70%),
    linear-gradient(180deg,#2a1d00,#0d0700)}
.dr-crown .dr-por{margin:0 auto;border:3px solid #FFC83D;
  box-shadow:0 0 70px rgba(255,200,61,.8)}
.dr-crown h2{margin:14px 0 4px;font-size:42px;text-wrap:balance}
.dr-sash{display:inline-block;margin-top:10px;padding:6px 20px;font-size:12px;
  letter-spacing:.24em;background:linear-gradient(90deg,#FFC83D,#a97400);color:#241a00}
.dr-duelrow{display:flex;align-items:center;gap:10px;flex-wrap:wrap;padding:9px 0;
  border-bottom:1px solid rgba(255,255,255,.1)}
.dr-duelrow .dr-win{color:#FFC83D;margin-left:auto}
@media(prefers-reduced-motion:reduce){
  .dr-stamp,.dr-bigstamp{animation:none;transform:rotate(-6deg)}
  .dr-vs::before,.dr-bolt{animation:none}}
`;

const CHIP = {
  WIN: 'dr-c-win', HIGH: 'dr-c-high', SAFE: 'dr-c-safe', LOW: 'dr-c-low',
  BTM: 'dr-c-btm', BTM2: 'dr-c-btm2', ELIM: 'dr-c-elim',
};

/**
 * The call — and the one screen where the panel's rank and the host's sit
 * side by side, because this is the moment she has decided.
 */
export function rpBuildResults(row) {
  const ep = epOf(row);
  const call = row?.dr?.call;
  if (!call) return '';
  const bend = new Map((row.dr.bend || []).map(b => [b.name, b]));
  /* THE SAFE QUEENS ARE DISMISSED AS A GROUP AND GO FIRST. That is the
     order the host calls it in — they leave the stage and the night narrows
     to the people it is about — and it is also the only honest way to draw
     them: they share ONE line between them, so giving each of them a row
     produced a column of portraits with a rank arrow, a rubber stamp and no
     words. Eight of thirteen rows silent on the screenshot that found this.
     They get one card with all their faces on it instead. */
  const safe = call.safe || [];
  /* IN THE ORDER SHE CALLED IT, which this screen used to ignore. The groups
     were hardcoded win-first, so the winner was drawn before anybody else had
     been told anything and the night ended on two names the critiques had
     already given away. The order is a decision the engine makes from what
     happened — see js/dr/data/results-order.js — and the screen is the place
     it is supposed to be visible. */
  const byGroup = {
    WIN: call.win || [], HIGH: call.high || [], LOW: call.low || [],
    BTM: call.atRisk || [], BTM2: call.bottom || [],
  };
  const shape = resultOrder(row?.dr?.callOrder);
  const groups = shape.groups.map(g => [g, byGroup[g] || []]);
  const named = groups.flatMap(([r, list]) => list.map(n => [r, n]));
  if (!named.length && !safe.length) return '';

  /* WHAT THE HOST ACTUALLY SAID. The row carries a written line for every
     call — `stage:result-win`, `-safe`, `-bottom` — and this screen drew a
     portrait, a rank arrow and a stamp and none of the words. Four written
     lines on the row, a hundred and seventy-seven characters on the screen.
     "Condragulations, you are the winner of this week's maxi challenge" is
     the single most quotable sentence the show has and it was on the floor. */
  /* ONE KIND PER CALL. This mapped HIGH onto the winner's line and LOW onto
     the safe group's, which is how a queen told she was LOW read the words
     said to the people being sent to the back. Each call has its own beat
     now — js/dr/data/stage-beats.js grew result-high, result-low and
     result-btm, which had never existed. */
  const RESULT_SCENE = { WIN: 'stage:result-win', HIGH: 'stage:result-high',
    LOW: 'stage:result-low', BTM: 'stage:result-btm',
    BTM2: 'stage:result-bottom' };
  const spoken = new Set();
  const lineFor = (result, name) => {
    const kind = RESULT_SCENE[result];
    const sc = (row.dr.scenes || []).find(x => x.kind === kind
      && ((x.data?.players || []).includes(name) || !(x.data?.players || []).length)
      && !spoken.has(x));
    if (sc) spoken.add(sc);
    return sc?.text || '';
  };

  /* THE SAFE QUEENS ARE NOT ON THIS SCREEN. They are dismissed BEFORE the
     critiques — the host names them, they leave the main stage and go
     straight to Untucked, and the panel then critiques only the queens left
     standing. So the safe card lives at the top of the critiques screen,
     which is the moment it happens in, and this screen carries only the
     queens the panel actually placed.
     It was here for one commit, which was already an improvement on giving
     each safe queen her own silent row, but it put the dismissal after the
     critiques of people who were dismissed before them. */
  /* AND THE PAUSE, WHICH IS A CARD. `stage:results-hold` is the beat where
     the host stops before the last call of the night, and it carries `before`
     — the group it precedes — so it goes in at that seam rather than at the
     end. It is not about a queen, so it gets no portrait and no stamp: it is
     the room holding its breath, and it should look like a gap in the
     column rather than another row in it. */
  const hold = (row.dr.scenes || []).find(x => x.kind === 'stage:results-hold' && x.text);
  const holdBefore = hold?.data?.before || null;
  const holdCard = i => `<div class="dr-step" id="dr-step-results-${i}">
      <div class="dr-panel dr-a-room dr-hold">
        ${_judgePortrait('rupaul', { stage: true, size: 40 })}
        <p>${esc(hold.text)}</p>
      </div></div>`;

  let holdDrawn = !hold;
  const steps = named.map(([result, name], i) => {
    const b = bend.get(name);
    const moved = b && b.panelRank !== b.finalRank;
    const meta = GRID_RESULTS[result] || {};
    const said = lineFor(result, name);
    // The seam: the first row of the block the host paused before.
    let before = '';
    if (!holdDrawn && holdBefore === result) { before = holdCard(-1); holdDrawn = true; }
    return `${before}<div class="dr-step" id="dr-step-results-${i}">
      <div class="dr-panel dr-a-score dr-callrow${
  result === 'SAFE' ? ' dr-quiet' : ''}" style="--v:${meta.color || '#7a3a5e'}">
        ${_portrait(name, ep, { size: 52, station: true })}
        <div><h3 class="dr-disp">${esc(name)}</h3>
          ${b ? `<span style="font-size:11px;color:#C9A6BC">panel ${b.panelRank} → ${b.finalRank}</span>` : ''}
          ${said ? `<p class="dr-said">${esc(said)}</p>` : ''}
        </div>
        ${moved ? '<span class="dr-moved dr-disp">the host moved her</span>' : '<span></span>'}
        <span class="dr-stamp dr-disp" style="color:${meta.color || '#fff'}">${esc(meta.label || result)}</span>
      </div></div>`;
  }).join('');

  if (typeof window !== 'undefined') {
    window._drSidebar = window._drSidebar || {};
    /* The safe queens stay in the rail as CONTEXT — they were dismissed on
       the critiques screen and are not steps here, but a reader wants to
       know the room is smaller than the cast. */
    const panelFor = k => `<h4 class="dr-disp">The call</h4>${
      (safe.length ? `<div class="dr-slot dr-waiting"><span></span>
        <div><div class="dr-nm">${esc(safe.length)} already safe</div></div>
        <span class="dr-chip dr-c-safe">SAFE</span></div>` : '')}${
      named.slice(0, k).map(([r, n]) => `<div class="dr-slot">${_portrait(n, ep, { size: 32 })}
        <div><div class="dr-nm">${esc(n)}</div></div>
        <span class="dr-chip ${CHIP[r] || 'dr-c-safe'}">${esc(GRID_RESULTS[r]?.label || r)}</span>
      </div>`).join('')}`;
    window._drSidebar.results = named.map((_, i) => panelFor(i + 1));
  }

  /* ── THE LINE, STILL STANDING ──
     The call is the last thing that happens on the main stage and it drew
     as a list: the queens were never on the screen, only their verdicts
     were. This is the line they are standing in — the ones the panel kept
     back after the safe were dismissed — and it stays at the top while the
     calls are read, taking each queen's stamp as it lands.
     Placement order would print the answer along the top of the screen, so
     it is drawn in the order the panel ranked them, which the critiques
     screen has already shown. */
  const line = named.map(([, n]) => n);
  const stand = line.length ? `<div class="dr-lineup-stage" id="dr-call-line">
    ${line.map(n => `<div class="dr-standing" data-queen="${esc(n)}">
      ${_portrait(n, ep, { size: 54, station: true })}
      <b class="dr-disp">${esc(n)}</b>
      <span class="dr-standing-tag dr-disp"></span>
    </div>`).join('')}
  </div>` : '';

  /* Each step says what the line looks like after it — the stamp lands on
     the queen it belongs to and the ones already called stay marked. */
  if (typeof window !== 'undefined') {
    const called = [];
    window._drRevealExtra = window._drRevealExtra || {};
    window._drRevealExtra.results = (idx) => {
      const upto = named.slice(0, idx + 1);
      const map = new Map(upto);
      const byName = new Map(upto.map(([r, n]) => [n, r]));
      for (const el of document.querySelectorAll('.dr-standing')) {
        const n = el.getAttribute('data-queen');
        const r = byName.get(n);
        el.classList.toggle('called', !!r);
        for (const c of ['WIN', 'HIGH', 'LOW', 'BTM', 'BTM2']) {
          el.classList.toggle(`dr-r-${c}`, r === c);
        }
        const tag = el.querySelector('.dr-standing-tag');
        if (tag) tag.textContent = r ? (GRID_RESULTS[r]?.label || r) : '';
      }
      void map;
    };
  }

  /* ── AND WHAT THE LIP SYNC IS FOR, WHICH IS THE LAST THING SAID ──
     `stage:call-stakes` is the host naming the terms — for your life, for the
     win, for a place in the show's history — and it is the sentence that
     turns a list of names into a threat. It was written, emitted every week
     and drawn by nothing: the sweep that asserts written prose reaches a page
     caught it, which is the only check that would have.
     It goes last because it IS the handoff: the call ends, the stakes are
     named, and the next screen is two queens on the mark. */
  const stakes = (row.dr.scenes || []).find(x => x.kind === 'stage:call-stakes' && x.text);
  const stakesCard = stakes ? `<div class="dr-step" id="dr-step-results-${named.length}">
      <div class="dr-panel dr-a-room dr-hold dr-stakes">
        ${_judgePortrait('rupaul', { stage: true, size: 40 })}
        <p>${esc(stakes.text)}</p>
      </div></div>` : '';

  return `<style>${RESULTS_CSS}</style>${_shell(stand + steps + stakesCard, ep, {
    phase: 'stage', title: 'The Call', subtitle: 'who the panel kept back',
    sidebar: _seedRail('results', '<h4 class="dr-disp">The call</h4>'),
  })}${_controls('results', named.length + (stakes ? 1 : 0), ep.num)}`;
}

/** The lip sync, built as a fight. */
export function rpBuildLipSync(row) {
  const ep = epOf(row);
  const ls = row?.dr?.lipsync;
  if (!ls || !(ls.queens || []).length) return '';
  const [a, b] = ls.queens;
  /* WHO IS ACTUALLY GOING. `ls.loser` is the engine's word for it, and a
     double shantay has no loser at all — on that night nobody's light goes
     out, which is the whole point of the call. */
  const goesHome = ls.call === 'double-shantay' ? null : ls.loser;
  const beats = (row.dr.scenes || []).filter(s => s.step === 'lipsync' && s.text);
  const scoreOf = nm => Number(ls.scores?.[nm] ?? ls[nm]?.score) || 0;

  /* ══ THE SCOREBOARD ══
     THE RESULT WAS ON THE SCREEN BEFORE THE SONG STARTED. Both energy bars
     were drawn from the FINAL scores at build time, so at 0 / 6 — before a
     single beat had been read — the longer bar told you who was staying.
     The one screen in the format that is pure suspense had none.

     It is a fight now and it is scored as one. The engine has always kept
     `lipsync.beats[queen]` — four named rounds, verse, chorus, hook and
     ending, with a delta for EACH queen in each — and no screen has ever
     drawn a single one of them. So: four round pips that light as the song
     runs, two bars that fill from nothing, and a tug-of-war between them
     that swings to whoever is winning the exchange.
     The final scores and the winner appear on the last card and nowhere
     before it. */
  const roundsOf = nm => (ls.beats?.[nm] || []).map(x => Number(x.delta) || 0);
  const rA = roundsOf(a); const rB = roundsOf(b);
  const ROUNDS = ['verse', 'chorus', 'hook', 'ending'];
  const nR = Math.max(rA.length, rB.length, 0);

  const vs = `<div class="dr-song dr-fash">${esc(ls.song || '')}${
    ls.artist ? ` — ${esc(ls.artist)}` : ''}</div>
    <div class="dr-vs" id="dr-vs">
      <div class="dr-fighter">${_portrait(a, ep, { size: 140 })}
        <b class="dr-disp">${esc(a)}</b>
        <div class="dr-energy"><i id="dr-en-a" style="width:0%"></i></div>
        <span class="dr-final dr-num" id="dr-fin-a"></span>
      </div>
      <div class="dr-mid">
        <div class="dr-bolt dr-disp">VS</div>
        ${nR ? `<div class="dr-rounds" id="dr-rounds">${
    ROUNDS.slice(0, nR).map(r => `<i data-r="${r}"><b>${r}</b></i>`).join('')}</div>` : ''}
        <div class="dr-tug"><i id="dr-tug"></i></div>
      </div>
      ${b ? `<div class="dr-fighter dr-r">${_portrait(b, ep, { size: 140 })}
        <b class="dr-disp">${esc(b)}</b>
        <div class="dr-energy"><i id="dr-en-b" style="width:0%"></i></div>
        <span class="dr-final dr-num" id="dr-fin-b"></span>
      </div>` : '<div></div>'}
    </div>`;

  /* WHOSE BEAT IS THIS. The duel is two queens and the beats below it were
     eight identical paragraphs — you could not see, without reading, that
     the fight went one way and then the other. Each beat now carries the
     face of the queen it is about and leans to her side of the stage, so the
     column reads as a rally. A beat about both of them, or about the room,
     stays centred and unattributed, which is also information. */
  const sideOf = sc => {
    const who = (sc.data?.players || []).filter(n => n === a || n === b);
    return who.length === 1 ? who[0] : null;
  };
  const steps = beats.map((sc, i) => {
    const who = sideOf(sc);
    const right = who && who === b;

    /* ── HER LAST CARD ──
       The queen who is going gets the closing card on this screen, and it is
       the only one in her own voice. It does not use the beat layout: a beat
       card is a paragraph with a small face on it, and this is a portrait
       with a sentence under it. The light goes out ON REVEAL — see .dr-fare
       in the CSS — so the reader sees her lit, reads what she said, and then
       watches the room take the light off her. */
    if ((sc.kind || '') === 'stage:sashay-words') {
      const her = (sc.data?.players || [])[0] || goesHome;
      return `<div class="dr-step dr-fare" id="dr-step-lipsync-${i}">
      <div class="dr-panel dr-a-lip dr-farebox">
        <span class="dr-farelabel dr-disp">Sashay away</span>
        <span class="dr-farepor">${_portrait(her, ep, { size: 132 })}</span>
        <b class="dr-farename dr-disp">${esc(her)}</b>
        <p class="dr-faresay dr-fash">${esc(sc.text)}</p>
      </div></div>`;
    }

    return `<div class="dr-step" id="dr-step-lipsync-${i}">
    <div class="dr-panel dr-a-lip dr-beat${who ? (right ? ' dr-beat-b' : ' dr-beat-a') : ''}">
      ${/^stage:(lipsync-intro|lipsync-suspense|lipsync-shantay|lipsync-sashay|lipsync-call)$/
    .test(sc.kind || '')
    ? `<span class="dr-hostsay">${_judgePortrait('rupaul', { stage: true, size: 42 })}
        ${who ? _portrait(who, ep, { size: 42 }) : ''}</span>`
    : who ? _portrait(who, ep, { size: 42 }) : ''}
      <p>${esc(sc.text)}</p></div></div>`;
  }).join('');

  /* THE FLOOR THEY FIGHT ON. Two hard spots on a black stage, and a low
     throb from the speakers under everything. The VS panel already had its
     own stripes; the room around it was the same purple as the werk room. */
  const floor = `<div class="dr-lsfloor" aria-hidden="true">
      <i class="dr-ls-a"></i><i class="dr-ls-b"></i><i class="dr-ls-thud"></i>
    </div>`;
  /* ── THE SONG RUNS AS YOU READ ──
     The card count and the round count are different numbers — there are
     four rounds and however many beats the night produced — so the song
     advances WITH THE REVEAL rather than one card per round. That is the
     honest mapping: the reader is moving through the performance, and by
     the last beat card all four rounds have played.
     The call card is excluded from that: by then the song is over, and it
     is the step that finally shows the scores. */
  const callAt = beats.findIndex(sc => /lipsync-call|lipsync-shantay|lipsync-sashay/
    .test(sc.kind || ''));
  const lastBeat = (callAt >= 0 ? callAt : beats.length) - 1;

  /* THE HOOK RUNS WHENEVER THERE IS A DUEL, not only when there is round
     data. It was gated on `nR` — the number of scored rounds — which tied
     two unrelated things together: whether the scoreboard can animate, and
     whether the queen who LOST is shown to have lost. A night whose engine
     wrote no per-round deltas therefore ended with both queens still lit
     and nothing marking the sashay at all. The rounds and the tug check
     `nR` for themselves; the verdict does not need it. */
  if (typeof window !== 'undefined') {
    const sum = (arr, k) => arr.slice(0, k).reduce((t, v) => t + v, 0);
    window._drRevealExtra = window._drRevealExtra || {};
    window._drRevealExtra.lipsync = (idx) => {
      const done = callAt >= 0 && idx >= callAt;
      // How far through the song this click is.
      const k = done ? nR
        : Math.max(0, Math.min(nR, Math.round(((idx + 1) / Math.max(1, lastBeat + 1)) * nR)));

      for (const el of document.querySelectorAll('#dr-rounds i')) {
        if (!nR) break;
        const at = [...el.parentNode.children].indexOf(el);
        el.classList.toggle('on', at < k);
        el.classList.toggle('now', at === k - 1 && !done);
      }

      const sa = sum(rA, k); const sb = sum(rB, k);
      /* AMPLIFIED ON PURPOSE, and this is a display scale rather than a
         claim. A round delta is about a fifth of a point, so a true-to-scale
         bar moves from 50% to 54% and the fight looks like two queens
         standing still. The span maps the range the deltas actually occupy
         onto the range the eye can read — the ORDER and the direction are
         exactly the engine's, only the size of the swing is drawn larger. */
      const span = 1.3;
      const pctA = Math.max(4, Math.min(100, 50 + (sa / span) * 50));
      const pctB = Math.max(4, Math.min(100, 50 + (sb / span) * 50));
      const enA = document.getElementById('dr-en-a');
      const enB = document.getElementById('dr-en-b');
      const tug = document.getElementById('dr-tug');
      /* ON THE CALL, THE BARS SNAP TO THE REAL SCORES. Until then they are
         the exchange — who is winning the song — and the actual numbers are
         not the reader's yet. */
      if (enA) enA.style.width = `${done ? Math.max(6, Math.min(100, scoreOf(a) * 10)) : pctA}%`;
      if (enB) enB.style.width = `${done ? Math.max(6, Math.min(100, scoreOf(b) * 10)) : pctB}%`;
      if (tug) tug.style.left = `${Math.max(6, Math.min(94, 50 + (sa - sb) * 34))}%`;

      const fa = document.getElementById('dr-fin-a');
      const fb = document.getElementById('dr-fin-b');
      if (fa) fa.textContent = done ? scoreOf(a).toFixed(1) : '';
      if (fb) fb.textContent = done ? scoreOf(b).toFixed(1) : '';
      const goes = goesHome;
      const box = document.getElementById('dr-vs');
      if (box) {
        /* THE SIDE THAT DIMS IS THE SIDE THE ENGINE SENT HOME, not the side
           holding the lower number. Comparing scoreOf(a) to scoreOf(b) was a
           second, independent verdict that could disagree with the first: it
           declared a winner on a double shantay, where there is none, and on
           a tie it quietly handed the song to whoever sat in slot A. */
        box.classList.toggle('dr-decided', !!(done && goes));
        box.classList.toggle('dr-won-a', !!(done && goes && goes === b));
        box.classList.toggle('dr-won-b', !!(done && goes && goes === a));
      }

      /* HER LIGHT IS NOT DRIVEN FROM HERE. The sashay is its own card at the
         end of the screen and it snuffs itself on reveal (.dr-fare), which
         is one fewer thing that can fall out of step with the reveal. */
    };
  }

  return `<style>${RESULTS_CSS}</style>${_shell(
    `<div class="dr-lsroom">${floor}${vs}${steps}</div>`, ep, {
      phase: 'lipsync', title: 'Lip Sync For Your Life',
      subtitle: ls.call === 'double-shantay' ? 'both of them stay' : 'two queens, one song',
    })}${_controls('lipsync', Math.max(1, beats.length), ep.num)}`;
}

/**
 * The exit, the Miss Congeniality announcement, and the crown.
 *
 * All three live on one screen because they are one moment of television —
 * and because a queen leaving and a queen being crowned never happen on the
 * same night, so only one of them ever draws.
 */
export function rpBuildExit(row) {
  const ep = epOf(row);
  const w = showWords('drag-race');
  const fin = row?.dr?.finale;
  const exits = row?.exits || [];
  /* THE CROWNING'S OWN PROSE, which this screen was dropping on the floor.
     The filter was `step === 'exit'` alone, and the finale keeps its sash,
     its runner-up, the crowning, the winner's speech and "prance, my queens"
     on `finale-award` and `finale-crown`. All of it was written, stored on the
     row, and rendered nowhere — the same shape as every other bug this build
     has turned up, and the one that would have hurt most: the last thing the
     host says in a season, missing from the screen that says it. */
  const CROWN_STEPS = new Set(['exit', 'finale-award', 'finale-crown']);
  const scenes = (row.dr.scenes || []).filter(s => CROWN_STEPS.has(s.step) && s.text);
  if (!fin && !exits.length && !scenes.length) return '';

  let lead = '';
  /* Held out here so the steps below can skip whatever the lead already
     showed: the mirror message was drawn as the featured line on the card
     AND again as an ordinary paragraph two cards down, word for word. */
  let msg = null;
  /* The finale's structured blocks, held back to run AFTER the prose. An
     ARRAY, not a marked-up string: the first version concatenated them with
     a sentinel div and split on it, which needs matching nested </div>s to
     come out right and would fail silently the first time a block grew one. */
  const finaleBlocks = [];

  if (fin) {
    /* THE FINALE. The bracket and the finishing order are structured data on
       `dr.finale` and sit on no scene at all — built from scenes alone this
       screen would lose the entire result of the season. */
    const duels = (fin.rounds || []).map(r => `<div class="dr-duelrow">
        ${_portrait(r.a, ep, { size: 38 })}<b class="dr-disp">${esc(r.a)}</b>
        <span style="color:#FF294B">vs</span>
        <b class="dr-disp">${esc(r.b)}</b>${_portrait(r.b, ep, { size: 38 })}
        <span class="dr-win dr-disp">${esc(r.winner)} takes it</span>
      </div>`).join('');

    /* MISS CONGENIALITY, ANNOUNCED. Plan 6 computes the award; without this
       it was a number nothing ever said out loud. Skipped entirely when the
       season did not name one — a blank sash is worse than no sash. The
       word comes from the registry, never a hardcoded string. */
    const cong = row.dr.congeniality;
    const congBlock = cong ? `<div class="dr-panel dr-a-room"
        style="padding:18px 20px;margin:14px 0;text-align:center">
        ${_portrait(cong, ep, { size: 76, station: true })}
        <div class="dr-sash dr-disp">${esc(w.audienceAward)}</div>
        <h3 class="dr-disp" style="margin:8px 0 0;font-size:24px">${esc(cong)}</h3>
      </div>` : '';

    const champ = fin.winner || (fin.placements || [])[0];
    /* AND THE FINISHING ORDER. Task 3's `finaleBlock` drew this and taking
       over its screen without it would drop the whole result of the season
       for the second time — the transcript has a test that catches exactly
       that, which is how this was noticed. */
    const places = (fin.placements || []).map((n, i) => `<div class="dr-duelrow">
        <span class="dr-disp" style="color:#C9A6BC;min-width:24px">${i + 1}</span>
        ${_portrait(n, ep, { size: 34 })}<b class="dr-disp">${esc(n)}</b>
        ${i === 0 ? _icon('crown') : ''}</div>`).join('');

    /* NOT A LEAD. THESE ARE THE LAST CLICKS OF THE SEASON.
       All of this used to be drawn above the prose, ungated: the bracket
       with every winner, the full finishing order, the crown and Miss
       Congeniality, all legible at 0 / 5 on the screen whose entire job is
       to withhold them. A viewer opening the finale was told who won before
       reading a word of it — the worst instance of a bug class this build
       has now hit on five screens.
       They are steps now, in the order the night runs them, and the crown
       is the last one. `finaleSteps` is appended after the prose below. */
    finaleBlocks.push(`<div class="dr-panel dr-a-lip" style="padding:16px 18px 16px 22px">
      <h3 class="dr-disp" style="margin:0 0 10px">The finale — ${esc(fin.type || '')}</h3>
      ${duels}</div>`);
    if (congBlock) finaleBlocks.push(congBlock);
    finaleBlocks.push(`<div class="dr-panel dr-a-lip" style="padding:16px 18px 16px 22px">
      <h4 class="dr-disp" style="margin:0 0 6px">Placements</h4>
      ${places}</div>`);
    finaleBlocks.push(`<div class="dr-crown">
      ${_portrait(champ, ep, { size: 150 })}
      <div class="dr-sash dr-disp">${esc(w.compWon ? 'The Winner' : 'Winner')}</div>
      <h2 class="dr-disp">${esc(champ)}</h2>
      ${_icon('crown')}
    </div>`);
  } else if (exits.length) {
    const gone = exits[0];
    msg = (row.dr.scenes || []).find(s => /mirror-message/.test(s.kind || ''));
    // Portrait, words, stamp — in that order, because they are grid cells now.
    lead = `<div class="dr-exit">
      ${_portrait(gone.name, ep, { size: 128 })}
      <div><h3 class="dr-disp" style="margin:0;font-size:26px">${esc(gone.name)}</h3>
        ${msg ? `<p class="dr-mirrorline">${esc(msg.text)}</p>` : ''}</div>
      <span class="dr-bigstamp dr-disp">${esc(gone.verb || w.exit)}</span>
    </div>`;
  }

  const rest = scenes.filter(sc => sc !== msg);
  let n = 0;
  const wrap = inner => `<div class="dr-step" id="dr-step-exit-${n++}">${inner}</div>`;
  const steps = rest.map(sc => wrap(
    `<div class="dr-panel dr-a-lip" style="padding:14px 16px 14px 20px">
      <p style="margin:0;color:#f4e3ed;line-height:1.6;text-wrap:pretty">${esc(sc.text)}</p>
    </div>`)).join('');
  /* The held-back finale blocks become steps here, numbered on from the
     prose so `_reapplyVisibility` walks one continuous run. */
  const tail = finaleBlocks.map(wrap).join('');
  const total = Math.max(1, n);

  /* THE WAY OUT. A lit door at the back of a dark corridor, which is what
     the last shot of an episode actually is. Not drawn on the crowning,
     which is the same builder for a very different night. */
  const corridor = fin ? '' : `<div class="dr-exitway" aria-hidden="true">
      <i class="dr-ex-door"></i><i class="dr-ex-dark"></i></div>`;
  return `<style>${RESULTS_CSS}</style>${_shell(
    `<div class="dr-exitroom">${corridor}${lead}${steps}${tail}</div>`, ep, {
      phase: 'lipsync',
      title: fin ? 'The Crowning' : 'Sashay Away',
      subtitle: fin ? 'the last queen standing' : 'the mirror message',
    })}${_controls('exit', total, ep.num)}`;
}


/**
 * The Grand Finale title card.
 *
 * `finale-open` is a MARKER — it carries no prose, only the finalists — so the
 * generic scene renderer drew this screen with nothing on it at all: claimed,
 * and empty, on every finale. Found by rendering a hundred seasons and
 * measuring how much text each screen produced.
 */
export function rpBuildFinaleOpen(row) {
  const ep = row;
  const fin = row?.dr?.finale;
  const open = (row?.dr?.scenes || []).find(sc => sc.kind === 'finale-open');
  const finalists = open?.data?.finalists || fin?.placements || row?.dr?.living || [];
  if (!finalists.length) return '';

  const SHAPE = {
    top4: 'Four queens. Two lip syncs, then one more.',
    top3: 'Three queens. One lip sync, then the crown.',
    top2: 'Two queens. One song.',
    'perform-then-lipsync': 'They perform, the host cuts it to two, and those two lip sync.',
  };

  const cards = finalists.map(n => `<div class="dr-fin-card">
      ${_portrait(n, ep, { size: 96, station: true })}
      <b class="dr-disp">${esc(n)}</b>
    </div>`).join('');

  /* AND THE WRITTEN OPENING, WHICH THIS SCREEN WAS STEPPING OVER.
     There are two things called finale-open. `finale-open` is the marker this
     builder reads — finalists and a type, no words — and `finale:finale-open`
     and `finale:finale-open-queen` are the AUTHORED prose in
     js/dr/data/finale-beats.js: the host's opening and one card per finalist.
     Reading the marker and ignoring the prose meant a written scene per
     finalist fired on the biggest night of the season and reached no screen.
     The near-identical kind is exactly why it went unnoticed. */
  const said = (row?.dr?.scenes || []).filter(sc =>
    /^finale:finale-open/.test(sc.kind || '') && sc.text);
  const spoken = said.map(sc => {
    const who = (sc.data?.players || [])[0];
    return `<div class="dr-panel dr-a-room" style="padding:14px 16px;display:grid;
      grid-template-columns:${who ? 'auto 1fr' : '1fr'};gap:14px;align-items:center;
      text-align:left;margin-top:12px">
      ${who ? _portrait(who, ep, { size: 48, station: true }) : ''}
      <p style="margin:0;color:#f4e3ed;line-height:1.6">${esc(sc.text)}</p>
    </div>`;
  }).join('');

  const body = `<div class="dr-panel dr-a-score" style="padding:24px 20px;text-align:center">
      <div class="dr-sash dr-disp">Grand Finale</div>
      <h2 class="dr-disp" style="margin:10px 0 4px;font-size:30px">
        One of them is crowned tonight</h2>
      <p style="color:#C9A6BC;margin:0 0 18px">
        ${esc(SHAPE[fin?.type] || 'The last night of the season.')}</p>
      <div class="dr-fin-grid">${cards}</div>
    </div>${spoken}`;

  return `<style>${RESULTS_CSS}
.dr-fin-grid{display:flex;justify-content:center;gap:18px;flex-wrap:wrap;margin-top:6px}
.dr-fin-card{display:flex;flex-direction:column;align-items:center;gap:8px}
</style>${_shell(body, ep, {
    phase: 'stage', title: 'Grand Finale', subtitle: "America's Next Drag Superstar",
  })}`;
}
