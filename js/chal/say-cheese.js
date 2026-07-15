// ══════════════════════════════════════════════════════════════════════
// say-cheese.js — "Say Cheese" (DC4, post-merge individual)
// Bungee off the drop tower and land a selfie with ZERO fear on your face.
// First perfect fearless shot wins immunity; the rest face the jury.
//
//   Three heights — BOTTOM / HALFWAY / TOP — are drawn blind from a hat, a
//   real trade-off either way: the higher you draw, the more airtime you have
//   to compose a clean shot, but the longer/scarier the climb — harder to hold
//   a fearless face and easier to freeze (HFEAR roughly cancels the TOP's own
//   airtime). The Disadvantage Vote target is forced to the TOP with the fear
//   cost but NONE of the airtime edge — strictly the worst seat. Nerve holds
//   your composure; snap times a clean confident shot. Sabotage (rock at the phone,
//   rope-yank to the face, phone-drop distraction, a psychological jab about a
//   real showmance/eliminated ally) ruins a shot — break a phone and you get
//   ONE warning; do it twice and you're disqualified.
//
//   NERVE (composure) = temperament*0.4 + boldness*0.35 + endurance*0.25
//   SNAP  (clean shot) = intuition*0.45 + mental*0.35 + social*0.2
//   SABO  (sabotage)   = strategic*0.4 + boldness*0.3 + intuition*0.3
//
// Points ARE the result: best selfie quality → chalMemberScores, the first
// perfect selfie is the winner (clamped to #1).
// ══════════════════════════════════════════════════════════════════════
import { gs, players, seasonConfig } from '../core.js';
import { pStats, pronouns, updateChalRecord, romanticCompat } from '../players.js';
import { addBond, getBond, getPerceivedBond } from '../bonds.js';
import { _challengeRomanceSpark, _checkShowmanceChalMoment } from '../romance.js';

function noise(m) { return (Math.random() - 0.5) * 2 * m; }
function archOf(n) { return players.find(p => p.name === n)?.archetype || 'floater'; }
function pick(a) { return a.length ? a[Math.floor(Math.random() * a.length)] : null; }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function bumpPop(n, d) { if (!gs.popularity) gs.popularity = {}; gs.popularity[n] = (gs.popularity[n] || 0) + d; }
function hostName() { return seasonConfig?.host || 'Chris'; }

function nerveOf(n) { const s = pStats(n); return s.temperament * 0.4 + s.boldness * 0.35 + s.endurance * 0.25; }
function snapOf(n) { const s = pStats(n); return s.intuition * 0.45 + s.mental * 0.35 + s.social * 0.2; }
function saboOf(n) { const s = pStats(n); return s.strategic * 0.4 + s.boldness * 0.3 + s.intuition * 0.3; }

function canScheme(n) {
  const a = archOf(n), s = pStats(n);
  if (['villain', 'mastermind', 'schemer'].includes(a)) return true;
  if (['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat'].includes(a)) return false;
  return s.strategic >= 6 && s.loyalty <= 4;
}
function isNice(n) { return ['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat'].includes(archOf(n)); }

const HEIGHTS = ['bottom', 'halfway', 'top'];
// airtime edge by height — more freefall = more time to compose the shot (small plus)
const AIRTIME = [0, 0.4, 0.8];
// fear cost by height — the higher/scarier the cord, the harder to hold a fearless
// face and the more likely to freeze. TOP roughly cancels its own airtime edge, so
// each height is a real trade-off, not a free upgrade.
const HFEAR = [0, 0.6, 1.2];
// universal "look fearless off a tower" difficulty, height-independent
const TOWER_DROP = 2.0;
const HLABEL = ['BOTTOM', 'HALFWAY', 'TOP'];
const PERFECT = 5.2;
// selfie fail categories, worst → best
const CAT = { froze: 0, fear: 1, blurry: 2, perfect: 3 };
const CATLABEL = { froze: 'FROZE', fear: 'FEAR-FACE', blurry: 'TOO BLURRY', perfect: 'PERFECT' };

// name-stripped no-repeat picker + per-run type usage
let _usedTpl, _typeUsed;
function draw(pool, ...ctx) {
  const built = pool.map(f => f(...ctx));
  const strip = (t) => (gs.activePlayers || []).reduce((s, n) => s.split(n).join('~'), t);
  const fresh = built.filter(t => !_usedTpl.has(strip(t)));
  const from = fresh.length ? fresh : built;
  const chosen = from[Math.floor(Math.random() * from.length)];
  _usedTpl.add(strip(chosen));
  return chosen;
}

const HOST_OPENERS = [
  (H) => `${H}: "The others are off building the finale, so you're stuck with me. Here's the deal — you each drew your platform out of a hat, bottom, middle or top, luck of the draw. Bungee off, take a selfie, and I do NOT want one flicker of fear. Top cords give you more airtime to nail it — but it's a longer, scarier climb and a lot easier to lose your nerve up there. Perfect fearless shot wins immunity. Smile!"`,
  (H) => `${H}: "Three heights, pulled blind from the hat. Draw high and you get more airtime to fix that face — but the climb's longer and the drop's a whole lot scarier, so good luck keeping it fearless. Jump, snap a selfie, first perfect one is safe. The other two? You're pleading to the jury. Climb!"`,
  (H) => `${H}: "Reach in, pull a cord — bottom, middle, top, no complaining. Fall off a tower on a rubber band and look like you're loving it. Top buys you a few extra beats of air but it's the meanest climb and the hardest place to smile; the bottom's calmer but you'd better be quick. One perfect fearless selfie ends this."`,
];
const HOST_CLOSERS = [
  (H, w) => `${H}: "THAT is how you smile through terror. ${w} takes the perfect shot and the immunity — into the Final Two. Everybody else, start writing your jury speech."`,
  (H, w) => `The flash goes off, the face is fearless, and ${H} calls it. "${w} wins Say Cheese." The cords keep swinging over two very nervous runners-up.`,
  (H, w) => `${H} holds up the phone: one calm, grinning, fearless face. "${w}. Immunity. Done. The rest of you have a jury to convince."`,
];

// ══════════════════════════════════════════════════════════════════════
export function simulateSayCheese(ep) {
  const active = gs.activePlayers.filter(p => p !== gs.exileDuelPlayer);
  if (active.length < 2) return;
  _usedTpl = new Set(); _typeUsed = {};
  const H = hostName();
  const campKey = gs.mergeName || 'merge';
  if (!ep.campEvents) ep.campEvents = {};
  if (!ep.campEvents[campKey]) ep.campEvents[campKey] = { pre: [], post: [] };
  const camp = ep.campEvents[campKey];
  const personalScores = {}; active.forEach(n => personalScores[n] = 0);
  const bumpScore = (n, d) => { personalScores[n] = (personalScores[n] || 0) + d; };

  // ── height assignment — drawn blind from a hat (random), balanced across the
  //    three cords. Higher draw = more airtime (a small selfie edge). The
  //    Disadvantage target is forced to the TOP but gets NO airtime edge. ──
  const disTarget = (gs._disadvantage?.target && active.includes(gs._disadvantage.target)) ? gs._disadvantage.target : null;
  const P = {};
  active.forEach(n => { P[n] = { name: n, height: 0, airtime: 0, attempts: 0, fails: 0, saboHits: 0, bestCat: -1, bestQ: -99, won: false, dq: false }; });
  const rest = active.filter(n => n !== disTarget);
  const hat = rest.map((_, i) => i % 3);                              // balanced spread of bottom/halfway/top
  for (let i = hat.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [hat[i], hat[j]] = [hat[j], hat[i]]; } // shuffle the hat
  rest.forEach((n, i) => { P[n].height = hat[i]; P[n].airtime = AIRTIME[hat[i]]; });
  if (disTarget) { P[disTarget].height = 2; P[disTarget].airtime = 0; }  // forced to top, no airtime edge

  const roster = active.map(n => ({ name: n, arch: archOf(n), height: P[n].height, disadvantaged: n === disTarget }));

  const beats = [];
  const boardSnap = () => active.map(n => ({
    name: n, height: P[n].height, best: P[n].bestCat < 0 ? 'none' : Object.keys(CAT).find(k => CAT[k] === P[n].bestCat),
    fearPct: clamp(20 + HFEAR[P[n].height] * 10 + P[n].fails * 9 + P[n].saboHits * 12 - (P[n].won ? 60 : 0), 8, 94),
    won: P[n].won, dq: P[n].dq,
  }));
  let warnings = 0;
  const addBeat = (b) => beats.push({ ...b, board: boardSnap(), warnings });

  let winner = null;

  // ── opening: follow everyone up the tower to their drawn height (bottom→top) ──
  active.slice().sort((a, b) => P[a].height - P[b].height).forEach(n => {
    addBeat({ type: 'climb', kind: 'climb', players: [n], badge: `${HLABEL[P[n].height]} Climb`, badgeClass: 'climb', selfie: null,
      text: _climbText(n) });
  });

  // ── ROUNDS — race to the first perfect fearless selfie ──
  const cap = clamp(active.length * 3, 8, 12);
  const settleOf = (r) => clamp(-3.2 + (r - 1) * 0.55, -3.2, 0);   // nerves settle slowly → several rounds of attempts
  for (let r = 1; r <= cap && !winner; r++) {
    // rattle the leader with sabotage (schemers, once or twice a round)
    _maybeSabotage(r);
    if (winner) break;
    if (r > 1) { _climbBack(r); _social(r); }   // the ladder grind + a beat of life to open each round

    const order = active.filter(n => !P[n].dq).sort((a, b) => P[b].bestQ - P[a].bestQ); // leaders jump amid pressure
    for (const n of order) {
      if (winner || P[n].dq) continue;
      const sabotaged = P[n]._ruinedThisRound;
      P[n]._ruinedThisRound = null;
      P[n].attempts++;
      const clutch = Math.random() < 0.15 ? 2.0 : 0;
      let q = nerveOf(n) * 0.55 + snapOf(n) * 0.55 - TOWER_DROP - HFEAR[P[n].height] + P[n].airtime + settleOf(r) + clutch + noise(2.6);
      let cat, sel;
      if (sabotaged) { q -= 4; cat = sabotaged.ruinCat; sel = sabotaged.ruinSel; }
      else if (q >= PERFECT && r >= 3) { cat = 'perfect'; sel = 'perfect'; }  // first two rounds are warm-ups — nerves too raw
      else {
        // categorize the miss: nerve-limited → fear-face, snap-limited → blurry, very low → froze
        const nervePart = nerveOf(n) - TOWER_DROP - HFEAR[P[n].height] + settleOf(r); // scarier cords freeze more; airtime doesn't help you jump
        if (nervePart + noise(1.5) < 1.2) cat = 'froze';
        else cat = (nerveOf(n) < snapOf(n)) ? 'fear' : (Math.random() < 0.5 ? 'blurry' : 'fear');
        sel = cat;
      }
      P[n].bestQ = Math.max(P[n].bestQ, q);
      if (CAT[cat] > P[n].bestCat) P[n].bestCat = CAT[cat];

      if (cat === 'perfect') {
        winner = n; P[n].won = true; bumpScore(n, 3); bumpPop(n, 2);
        addBeat({ type: 'win', kind: 'perfect', players: [n], badge: clutch ? 'Swan Dive!' : 'Perfect Selfie', badgeClass: 'perfect', selfie: 'perfect',
          text: draw(clutch ? [
            (x) => `${x} takes a long, slow breath, spreads ${pronouns(x).posAdj} arms wide, and swan-dives off the ${HLABEL[P[x].height].toLowerCase()} platform — calm, grinning, utterly fearless — and snaps the shot on the way down. It's flawless. Immunity. Final Two.`,
            (x) => `While everyone else is falling apart, ${x} just... lets go. Arms out, eyes up, a real smile — and the camera catches every fearless inch of it. Perfect. ${x} is safe.`,
          ] : [
            (x) => `${x} steps off clean, holds the phone steady through the whole drop, and lands a selfie so calm you'd think ${pronouns(x).sub} ${pronouns(x).sub === 'they' ? 'were' : 'was'} posing on a beach. Perfect. Immunity, and a seat in the Final Two.`,
            (x) => `No panic, no blur, no fear — ${x} nails the fearless selfie on the first honest try of the round. The flash goes off and it's over. ${x} wins.`,
          ], n) });
        break;
      }

      // fail beat
      const failText = sabotaged ? sabotaged.failText : draw(
        cat === 'froze' ? [
          (x) => `${x} gets to the edge and just... can't. The legs won't move, the phone stays in ${pronouns(x).posAdj} pocket. No jump, no selfie, back down the ladder to try again.`,
          (x) => `The height wins this round — ${x} freezes solid on the platform and never takes the leap. Zero on the board.`,
          (x) => `${x} counts down — "three, two, one" — and doesn't go. Then again. Then again. The drop stares back and ${x} can't make the legs listen.`,
          (x) => `${x} inches both toes over the lip, feels the whole tower sway, and lurches back to safety with a shaky "nope." No attempt this round.`,
        ] : cat === 'fear' ? [
          (x) => `${x} jumps, but the second the cord snaps taut the terror flashes across ${pronouns(x).posAdj} face — and the selfie catches all of it. Pure fear. No good.`,
          (x) => `${x} takes the plunge and mostly holds it together, but the selfie shows wide eyes and a clenched jaw. Fear-face. Try again.`,
          (x) => `Down ${x} goes, phone up — and the shot is a mask of panic. ${pronouns(x).Sub} know${pronouns(x).sub === 'they' ? '' : 's'} it the second ${pronouns(x).sub} see${pronouns(x).sub === 'they' ? '' : 's'} it. Rejected.`,
          (x) => `${x} means to smile and instead bares ${pronouns(x).posAdj} teeth in a rictus of pure dread. The camera does not lie. Back up the tower.`,
          (x) => `${x} screams the entire way down — a great jump, a terrible selfie. Every ounce of the fear is right there on ${pronouns(x).posAdj} face.`,
          (x) => `The cord recoils and so does ${x}'s face: eyes shut, mouth open, white-knuckle terror. Not the fearless look ${H} is after.`,
          (x) => `${x} looked calm on the platform and lost it in freefall — the shot is all clenched jaw and saucer eyes. No good.`,
        ] : [
          (x) => `${x} nails the nerve — steady face, no fear at all — but the shot comes out a smeared, motion-blurred mess. So close. Back up ${pronouns(x).sub} go${pronouns(x).sub === 'they' ? '' : 'es'}.`,
          (x) => `Fearless face, terrible timing: ${x}'s selfie is a blurry streak of sky and hair. No good, ${pronouns(x).sub === 'they' ? "they'll" : (pronouns(x).sub === 'she' ? "she'll" : "he'll")} have to redo it.`,
          (x) => `${x} keeps it cool the whole drop — and thumbs the shutter a half-second too early. The selfie's a blur of motion and disappointment.`,
          (x) => `Perfect composure, ruined by a shaky hand: ${x}'s photo is an abstract smear. Composure isn't the problem — the camera is.`,
          (x) => `${x} holds the fearless face beautifully, but the wind and the speed turn the selfie into soup. Rejected on a technicality.`,
        ], n);
      P[n].fails++;
      addBeat({ type: sabotaged ? 'sabo' : 'jump', kind: sabotaged ? 'sabo' : (cat === 'froze' ? 'fear' : 'fail'),
        players: sabotaged ? [sabotaged.by, n] : [n],
        badge: sabotaged ? sabotaged.badge : (cat === 'froze' ? 'Froze' : cat === 'fear' ? `${HLABEL[P[n].height]} Jump` : 'Blurry'),
        badgeClass: sabotaged ? 'sabo' : (cat === 'froze' ? 'fear' : cat === 'blurry' ? 'fail' : 'jump'),
        selfie: cat === 'froze' ? null : sel, text: failText });

      // social beat between jumps
      if (Math.random() < 0.7) _social(r);
      if (winner) break;
    }
    if (!winner) _social(r); // guarantee a beat of life each round
  }

  // ── nobody landed a perfect selfie → closest to fearless wins ──
  if (!winner) {
    winner = active.filter(n => !P[n].dq).sort((a, b) => (P[b].bestCat - P[a].bestCat) || (P[b].bestQ - P[a].bestQ))[0];
    P[winner].won = true; bumpScore(winner, 2); bumpPop(winner, 1);
    addBeat({ type: 'win', kind: 'perfect', players: [winner], badge: 'Closest to Fearless', badgeClass: 'perfect', selfie: 'perfect',
      text: draw([
        (x) => `Nobody lands a truly perfect shot — but ${x}'s is the calmest, cleanest of a very shaky bunch. ${H_or(x)} the closest to fearless, and that's enough. Immunity.`,
        (x) => `The sun's fully up and every phone's been used twice. ${x} has the best of the near-misses — steadiest face, least blur — and takes the win on points.`,
      ], winner) });
  }
  function H_or(x) { return pronouns(x).Sub + (pronouns(x).sub === 'they' ? "'re" : "'s"); }

  // ── showmance danger moment ──
  if (seasonConfig.romance !== 'disabled') _checkShowmanceChalMoment(ep, null, null, personalScores, 'danger', [{ members: active }]);

  // ── final standings: winner first, rest by best selfie then quality ──
  const results = active.map(n => ({
    name: n, height: HEIGHTS[P[n].height], best: P[n].bestCat < 0 ? 'froze' : Object.keys(CAT).find(k => CAT[k] === P[n].bestCat),
    won: P[n].won, dq: P[n].dq, attempts: P[n].attempts,
  })).sort((a, b) => (b.won - a.won) || (P[a.name].dq - P[b.name].dq) || (P[b.name].bestCat - P[a.name].bestCat) || (P[b.name].bestQ - P[a.name].bestQ));

  camp.post.push({ type: 'sayCheeseWin', players: [winner], badgeText: 'IMMUNITY', badgeClass: 'green', tag: 'say-cheese',
    text: `${winner} landed the first fearless selfie off the drop tower and won immunity in Say Cheese.` });

  // ── romance sparks from the shared terror ──
  if (seasonConfig.romance !== 'disabled') {
    const seen = new Set();
    for (const b of beats) {
      if (!b.players || b.players.length !== 2) continue;
      const [a, c] = b.players; const key = [a, c].sort().join('|');
      if (seen.has(key)) continue; seen.add(key);
      if (!romanticCompat(a, c)) continue;
      if (gs.showmances?.some(sh => sh.phase !== 'broken-up' && sh.players.includes(a) && sh.players.includes(c))) continue;
      if (Math.random() < 0.4 && _challengeRomanceSpark(a, c, ep, null, null, personalScores, 'white-knuckle terror on the tower')) {
        addBeat({ type: 'spark', kind: 'social', players: [a, c], badge: '💘 Sparks', badgeClass: 'social', selfie: null,
          text: draw([
            (x, y) => `${x} and ${y} end up clinging to the same rail, laughing that shaky almost-died laugh — and something in the look between them lingers a beat too long. The camp will notice.`,
            (x, y) => `Terror does strange things. ${x} talks ${y} back from the edge, ${y} won't let go of ${x}'s hand, and by the bottom of the tower there's a whole new storyline.`,
          ], a, c) });
        break;
      }
    }
  }

  // ── FINALIZE ──
  ep.sayCheese = {
    immunityWinner: winner, host: H,
    hostOpen: pick(HOST_OPENERS)(H), hostClose: pick(HOST_CLOSERS)(H, winner),
    roster, beats, results, warnings, disTarget,
  };
  ep.isSayCheese = true;
  ep.challengeType = 'say-cheese';
  ep.challengeLabel = 'Say Cheese';
  ep.challengeCategory = 'adventure';
  ep.immunityWinner = winner;
  ep.tribalPlayers = active;

  // scoring: best selfie quality → score; winner clamped to #1
  ep.chalMemberScores = ep.chalMemberScores || {};
  active.forEach(n => {
    const base = (P[n].bestCat + 1) * 2 + Math.max(0, P[n].bestQ) * 0.4 - (P[n].dq ? 4 : 0);
    ep.chalMemberScores[n] = Math.round(((ep.chalMemberScores[n] || 0) + base + (personalScores[n] || 0)) * 10) / 10;
  });
  const maxOther = Math.max(0, ...active.filter(n => n !== winner).map(n => ep.chalMemberScores[n] || 0));
  ep.chalMemberScores[winner] = Math.max(ep.chalMemberScores[winner] || 0, Math.round((maxOther + 2) * 10) / 10);
  ep.chalPlacements = results.map(r => r.name);

  updateChalRecord(ep);
  return ep;

  // ─────────────────────────────────────────────────────────────────────
  // sabotage: a schemer rattles the current leader mid-jump (real stakes)
  function _maybeSabotage(round) {
    const inplay = active.filter(n => !P[n].dq);
    const saboteur = inplay.filter(canScheme).sort((a, b) => saboOf(b) - saboOf(a))[0];
    if (!saboteur || inplay.length < 2) return;
    // fire ~55% a round, targeting the leader (or a rival)
    if (Math.random() > (round >= 2 ? 0.72 : 0.4)) return;
    const victim = inplay.filter(n => n !== saboteur)
      .sort((a, b) => (P[b].bestCat - P[a].bestCat) + (getPerceivedBond(saboteur, a) - getPerceivedBond(saboteur, b)) * 0.3)[0];
    if (!victim) return;

    const kinds = [];
    kinds.push('rock', 'rope', 'drop');
    // psychological jab needs a real lever (showmance / eliminated ally)
    const psychLever = _psychLever(victim);
    if (psychLever) kinds.push('psych', 'psych');
    const kind = pick(kinds);
    const breaks = (kind === 'rock' || kind === 'rope') && Math.random() < 0.6;

    // consequences
    addBond(saboteur, victim, -2); bumpPop(saboteur, canScheme(saboteur) ? -0.4 : 0); bumpScore(saboteur, 0.4);
    _heat(saboteur, victim, 2);
    P[victim].saboHits++;

    let badge, failText, ruinCat = 'fear', ruinSel = 'fear';
    if (kind === 'rock') {
      badge = 'Sabotage · Rock Throw';
      failText = draw([
        (s, v) => `${v} leaps with a grin — and mid-fall ${s} whips a rock clean off ${pronouns(v).posAdj} phone. The shot's gone before ${v} can even smile. "${s.toUpperCase()}!"`,
        (s, v) => `${s} waits for ${v} to drop, then pegs the phone dead-on with a stone. ${v}'s selfie is a blur of shock and a spinning camera. Ruined.`,
      ], saboteur, victim);
    } else if (kind === 'rope') {
      badge = 'Sabotage · Rope Yank';
      failText = draw([
        (s, v) => `${v} tops out and jumps — and ${s} yanks the cord so it whips ${pronouns(v).obj} across the face at the worst possible second. Selfie ruined. The two of them are at war now.`,
        (s, v) => `${s} grabs ${v}'s bungee and snaps it hard mid-drop; ${v} lurches, the phone flies wide, the shot's a write-off. "You did NOT just do that."`,
      ], saboteur, victim);
    } else if (kind === 'drop') {
      badge = 'Sabotage · Distraction'; ruinSel = 'fear';
      failText = draw([
        (s, v) => `Right as ${v} lines up the jump, ${s} shouts something that makes ${pronouns(v).obj} flinch — and ${v} fumbles the phone clean off the platform. No phone, no selfie.`,
        (s, v) => `${s} times a taunt for the exact instant ${v} steps off, and ${v}'s grip slips. The phone tumbles away; the attempt's dead on arrival.`,
      ], saboteur, victim);
    } else {
      badge = 'Sabotage · Head Game';
      failText = draw([
        (s, v, lev) => `${s} leans in as ${v} preps the jump: "${lev}" ${v}'s composure buckles — the selfie catches every ounce of that hit. Ruined, and it's personal.`,
        (s, v, lev) => `Mid-air, ${s} calls out to ${v}: "${lev}" It lands like a gut-punch; ${v}'s fearless face collapses into something raw, and the shot's no good.`,
      ], saboteur, victim, psychLever);
    }

    // phone-break warning / DQ
    let warnText = '';
    if (breaks) {
      warnings++;
      if (warnings >= 2) {
        P[saboteur].dq = true;
        camp.post.push({ type: 'sayCheeseDQ', players: [saboteur, victim], badgeText: 'DISQUALIFIED', badgeClass: 'red', tag: 'say-cheese',
          text: `${saboteur} broke a second phone sabotaging ${victim} in Say Cheese and was disqualified from the challenge.` });
        warnText = ` A second shattered phone — and ${H}: "${saboteur}, that's TWO. You're out." Disqualified.`;
        bumpScore(saboteur, -3);
      } else {
        warnText = ` The phone shatters on the mat. ${H}: "New phone — but break one more and you are DONE."`;
      }
    }

    camp.post.push({ type: 'sayCheeseSabotage', players: [saboteur, victim], badgeText: 'SABOTAGE', badgeClass: 'red', tag: 'say-cheese',
      text: `${saboteur} sabotaged ${victim}'s selfie off the drop tower in Say Cheese (${badge.split('· ')[1] || 'sabotage'}). ${victim} won't forget it.` });

    P[victim]._ruinedThisRound = { by: saboteur, badge, failText: failText + warnText, ruinCat, ruinSel };
  }

  // a REAL psychological lever: an active showmance partner or a close eliminated ally
  function _psychLever(v) {
    const sh = (gs.showmances || []).find(x => x.phase !== 'broken-up' && Array.isArray(x.players) && x.players.includes(v));
    const partner = sh ? sh.players.find(p => p !== v) : null;
    if (partner) return partner === (gs.activePlayers || []).find(n => n === partner)
      ? `Careful — wouldn't want ${partner} watching you crack up there.`
      : `Bet you can't wait to see ${partner} again. Shame about how you got here.`;
    // a close eliminated ally
    const gone = players.map(p => p.name).filter(nm => !(gs.activePlayers || []).includes(nm));
    const ally = gone.map(nm => ({ nm, b: getBond(v, nm) })).sort((a, b) => b.b - a.b)[0];
    if (ally && ally.b >= 3) return `What are you going to tell ${ally.nm}, after everything?`;
    return null;
  }

  // ── social beats between jumps (weighted, type-aware, real consequences) ──
  function _social(round) {
    const live = active.filter(n => !P[n].dq);
    if (live.length < 2) return;
    const events = [];
    const add = (w, type, fire) => events.push({ w, type, fire });
    const social = live.find(n => archOf(n) === 'social-butterfly' || pStats(n).social >= 7);
    const hero = live.find(n => ['hero', 'loyal-soldier'].includes(archOf(n)) || pStats(n).loyalty >= 6);

    // ENCOURAGE — talk a scared jumper off the ledge
    if (hero) add(1.4, 'encourage', () => {
      const scared = live.slice().sort((a, b) => (P[b].saboHits + P[b].fails) - (P[a].saboHits + P[a].fails))[0];
      if (!scared || scared === hero) return;
      addBond(hero, scared, 1.5); bumpPop(hero, 0.6);
      addBeat({ type: 'encourage', kind: 'social', players: [hero, scared], badge: 'Steadies Nerves', badgeClass: 'social', selfie: null,
        text: draw([
          (h, s) => `${h} climbs up next to a shaking ${s}. "Eyes on me, not the ground. Breathe. It's a rubber band and a phone — you've done scarier." ${s} actually laughs, and steadies.`,
          (h, s) => `"You're overthinking the drop," ${h} tells ${s}. "Fall first, smile second, don't look down." Simple, calm, exactly what ${s} needed.`,
          (h, s) => `${h} refuses to let ${s} spiral, matching ${pronouns(s).posAdj} breathing until the panic drains out. "There. Now go get your shot." A real one.`,
          (h, s) => `${h} talks ${s} down from full-blown panic with a steady hand on the shoulder. "You're not falling, you're flying. Now smile like you mean it." ${s} nods, calmer.`,
          (h, s) => `"Hey — look at me. You've survived worse than a rubber band," ${h} says, and somehow ${s} believes it enough to step to the edge without shaking.`,
        ], hero, scared) });
    });

    // RIVALRY — the sabotage feud boils over ("who screwed X")
    let lowPair = null, minB = 1;
    for (let i = 0; i < live.length; i++) for (let j = i + 1; j < live.length; j++) {
      const bd = getBond(live[i], live[j]); if (bd < minB) { minB = bd; lowPair = [live[i], live[j]]; }
    }
    if (lowPair) add(1.3, 'rivalry', () => {
      const [a, b] = lowPair; addBond(a, b, -1.5); bumpPop(a, -0.3);
      addBeat({ type: 'rivalry', kind: 'social', players: [a, b], badge: 'Blame Game', badgeClass: 'social', selfie: null,
        text: draw([
          (x, y) => `A ruined selfie sparks a screaming match — ${x} is certain ${y} threw the last shot, ${y} swears it wasn't ${pronouns(y).obj}, and the whole tower echoes with "WHO screwed me?!" Nobody's smiling now.`,
          (x, y) => `${x} and ${y} stop even pretending to be friendly. "That was YOU." "Prove it." They're jabbing fingers at the bottom of the tower while the cords swing empty above them.`,
          (x, y) => `The pressure cracks ${x} and ${y} wide open — old grudges, this challenge's sabotage, all of it, right there at the jump line. This ends at the jury.`,
          (x, y) => `${x} shoves ${y} at the base of the ladder. "You've been playing dirty all morning." ${y} shoves right back. The hosts don't even try to break it up.`,
          (x, y) => `"Enjoy the win you cheated for," ${x} spits at ${y}. ${y} just smiles, which somehow makes it worse. Two people who will absolutely be voting against each other.`,
        ], a, b) });
    });

    // RESPECT — a fearless jump earns grudging respect
    if (live.length >= 2) add(1.1, 'respect', () => {
      const doer = live.slice().sort((a, b) => nerveOf(b) - nerveOf(a))[0];
      const witness = pick(live.filter(n => n !== doer && getBond(n, doer) < 3)) || pick(live.filter(n => n !== doer));
      if (!doer || !witness) return;
      addBond(doer, witness, 1.2); bumpPop(doer, 0.6);
      addBeat({ type: 'respect', kind: 'social', players: [doer, witness], badge: 'Respect', badgeClass: 'social', selfie: null,
        text: draw([
          (d, w) => `${d} steps off the ${HLABEL[P[d].height].toLowerCase()} like it's nothing, arms wide, no fear at all. Even ${w}, who never rated ${d}, has to nod. "...Okay. That was cold-blooded."`,
          (d, w) => `The way ${d} attacks the jump — zero hesitation — shuts everyone up. ${w} gives it up out loud: "I could not do that. Respect."`,
          (d, w) => `${d} doesn't even look down, just walks off the edge mid-sentence. ${w} whistles. "Okay, that was genuinely fearless. I hate that it was impressive."`,
          (d, w) => `Everyone else is white-knuckling the rail and ${d} is up there yawning. ${w} shakes ${pronouns(w).posAdj} head. "Nerves of absolute steel. Fine. Respect."`,
        ], doer, witness) });
    });

    // BANTER / trash talk with a small edge
    add(0.9, 'banter', () => {
      const a = pick(live), b = pick(live.filter(n => n !== a)); if (!a || !b) return;
      if (canScheme(a)) addBond(a, b, -0.5);
      addBeat({ type: 'banter', kind: 'social', players: [a, b], badge: 'Trash Talk', badgeClass: 'social', selfie: null,
        text: draw([
          (x, y) => `${x} calls up to ${y} on the platform: "Try not to cry on camera this time!" ${y} flips ${pronouns(x).obj} off and jumps anyway.`,
          (x, y) => `"Nice fear-face earlier," ${x} smirks at ${y}. "Real cover-model stuff." ${y} promises payback with the next phone.`,
          (x, y) => `${x} and ${y} keep up a running commentary on each other's terrible selfies, half joking, half absolutely not.`,
          (x, y) => `${x} holds up ${y}'s last blurry disaster of a photo for the whole tower to see. "Is this art? Should we frame it?" ${y} vows revenge.`,
          (x, y) => `"You scream like that on every jump or just the ones with cameras?" ${x} needles ${y}, who is too busy climbing back up to clap back.`,
        ], a, b) });
    });

    if (!events.length) return;
    const eff = events.map(e => e.w / (1 + (_typeUsed[e.type] || 0) * 1.6));
    const total = eff.reduce((s, w) => s + w, 0);
    let roll = Math.random() * total, idx = 0;
    for (let i = 0; i < events.length; i++) { roll -= eff[i]; if (roll <= 0) { idx = i; break; } }
    _typeUsed[events[idx].type] = (_typeUsed[events[idx].type] || 0) + 1;
    events[idx].fire();
  }

  // ── climb narration — follow a jumper up the tower to their drawn height ──
  function _climbText(n) {
    if (n === disTarget) return draw([
      (x) => `The disadvantage vote marches ${x} past the low cords and all the way to the top platform — the longest, meanest climb on the tower — with none of the extra composing time the height would normally buy. Just further to fall.`,
      (x) => `${x} climbs, and keeps climbing, because the vote said so: straight to the top, no shortcuts, no perks. The others watch ${pronouns(x).obj} shrink against the sky.`,
      (x) => `Up ${x} goes to the very top, the disadvantage heavier with every rung. Same odds as everyone below — just a lot more ladder to regret.`,
      (x) => `The vote parks ${x} on the highest platform: all the fear of the top, none of the airtime bonus. A long, lonely climb into a bad seat.`,
    ], n);
    if (P[n].height === 2) return draw([
      (x) => `${x} draws the top cord and starts the long haul up — platform after platform, the midway shrinking to a toy set below. Way up here there's real time to compose a shot on the way down.`,
      (x) => `Rung after rung, ${x} climbs to the top of the tower until the wind actually changes. Terrifying — but all that airtime means all that time to nail the selfie.`,
      (x) => `${x} pulled the highest slip from the hat and pays for it now, climbing until the ground blurs. Consolation: the longest drop is the longest chance to look fearless.`,
      (x) => `The top platform. ${x} gets there breathing hard, grips the rail, and looks down at a very small, very distant safety mat. Lots of sky to work with.`,
    ], n);
    if (P[n].height === 1) return draw([
      (x) => `${x} climbs to the middle platform, halfway up, and blows out a long breath. A fair chunk of air to compose the shot — not so much it turns the stomach inside out.`,
      (x) => `Halfway cord for ${x}. The climb's honest, the drop's honest, and there's a decent beat of freefall to get the face right.`,
      (x) => `${x} settles onto the middle platform, tests the cord with a tug, and nods. Middle of the tower, middle of the risk, a workable window for the selfie.`,
      (x) => `Up to the halfway mark ${x} goes — high enough to matter, low enough to breathe. A reasonable amount of airtime to work with.`,
    ], n);
    return draw([
      (x) => `${x} takes the short climb to the bottom cord — barely a story up — and shrugs. Quick and low: not much drop, which means not much time to get the shot right.`,
      (x) => `Bottom cord for ${x}, a stubby little climb. Least scary spot on the tower — and the least airtime to compose a fearless face before the ground arrives.`,
      (x) => `${x} draws the bottom slip and hops up the short ladder, almost relieved. The catch: the shortest drop gives the smallest window for a clean selfie.`,
      (x) => `${x} climbs the few rungs to the bottom platform. Easy nerves down here — but the ground comes up fast, so the shot has to be quick.`,
    ], n);
  }
  function _climbBack(round) {
    if (Math.random() > 0.4) return;
    const n = pick(active.filter(x => !P[x].dq && !P[x].won && P[x].fails > 0));
    if (!n) return;
    addBeat({ type: 'climb', kind: 'climb', players: [n], badge: 'Back Up', badgeClass: 'climb', selfie: null,
      text: draw([
        (x) => `${x} trudges back up the ladder for another go, legs like lead, phone shoved in a pocket. The tower doesn't get any shorter no matter how many times you climb it.`,
        (x) => `Another rejected shot, another climb. ${x} hauls back up to the platform, blowing on chalky hands, muttering the plan for this attempt.`,
        (x) => `${x} makes the long climb back up, slower this time — the failed jumps are piling up in the legs as much as the head.`,
        (x) => `Back to the top of the ladder ${x} goes, wiping sweat, re-clipping the cord. "This one. This one's the one," ${pronouns(x).sub} mutter${pronouns(x).sub === 'they' ? '' : 's'}, and start${pronouns(x).sub === 'they' ? '' : 's'} up again.`,
        (x) => `${x} re-scales the tower for round ${round}, the novelty long gone — just grind and grip and one more shot at a fearless face.`,
      ], n) });
  }

  function _heat(a, b, amt) {
    if (!gs._sayCheeseHeat) gs._sayCheeseHeat = {};
    gs._sayCheeseHeat[a] = { target: b, amount: (gs._sayCheeseHeat[a]?.amount || 0) + amt, expiresEp: (gs.episode || 0) + 2 };
  }
}

// ══════════════════════════════════════════════════════════════════════
// VP + TEXT are in say-cheese-vp.js
// ══════════════════════════════════════════════════════════════════════
export { rpBuildCheeseTitleCard, rpBuildCheeseDrop, rpBuildCheeseResults, cheeseRevealNext, cheeseRevealAll } from './say-cheese-vp.js';
