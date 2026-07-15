// ══════════════════════════════════════════════════════════════════════
// bumper-car-bash.js — "Bumper Car Bash" (DC4, post-merge individual)
// A neon-tent point-scoring demolition derby. Every camper drives a bumper
// car and racks up points by ramming rivals:
//   REAR hit   = 1  ·  T-BONE (side) = 2  ·  HEAD-ON AMBUSH = 3
//   HEAD-ON when BOTH hit dead-on at once = 0 (null — they just bounce)
// First driver to 20 points wins immunity.
//
//   ATK (positioning/offense) = boldness*0.4 + strategic*0.35 + intuition*0.25
//   EVA (read/dodge a hit)    = intuition*0.45 + physical*0.35 + mental*0.2
//   CTRL(car handling)        = mental*0.5 + intuition*0.3 + physical*0.2
//
// Real consequences on every social beat: alliances set up combos and block
// for each other, a stalled car can cost you the game, cross-alliance tips
// earn partner heat, leaders get DENIED at the line, allies BETRAY when only
// one can win, and vote-scheme chatter shifts who's hunting whom. Points ARE
// the score, so the first driver to 20 is already #1.
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

function atkScore(n) { const s = pStats(n); return s.boldness * 0.4 + s.strategic * 0.35 + s.intuition * 0.25; }
function evaScore(n) { const s = pStats(n); return s.intuition * 0.45 + s.physical * 0.35 + s.mental * 0.2; }
function ctrlScore(n) { const s = pStats(n); return s.mental * 0.5 + s.intuition * 0.3 + s.physical * 0.2; }

function canScheme(n) {
  const a = archOf(n), s = pStats(n);
  if (['villain', 'mastermind', 'schemer'].includes(a)) return true;
  if (['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat'].includes(a)) return false;
  return s.strategic >= 6 && s.loyalty <= 4;
}
function isNice(n) { return ['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat'].includes(archOf(n)); }
function archAgg(n) {
  const a = archOf(n);
  if (['villain', 'mastermind', 'schemer'].includes(a)) return 2;
  if (a === 'hothead') return 1.8;
  if (['chaos-agent', 'wildcard', 'challenge-beast'].includes(a)) return 1.1;
  if (isNice(n)) return 0.3;
  return 0.7;
}

const POINT_TARGET = 20;

// name-stripped no-repeat text picker + per-run event-type usage (reset per run)
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
  (H) => `${H}: "Welcome to Bumper Car Bash! Ram someone from behind, one point. Catch 'em on the side, two. Nail a surprise head-on, three — but if you BOTH go nose-first at once, nobody scores. First to twenty wins immunity. Green light in three… two…"`,
  (H) => `${H}: "Twenty points, one immunity necklace, and a whole lot of whiplash out there tonight. Ram your friends. Ram your enemies. Ram ESPECIALLY whoever's in the lead." The klaxon sounds and the tent fills with the smell of rubber and ozone.`,
  (H) => `${H}: "Rules are simple. Bump for points — one, two, or three depending on where you hit — and don't hit anybody head-on at the same time they hit you, because that's worth nothing. Get to twenty first. Drivers… START YOUR CARS."`,
];
const HOST_CLOSERS = [
  (H, w) => `${H}: "${w} hits twenty and takes immunity — a spot in the finale, locked in." The neon cuts out on the losers, still circling in the dark. "The rest of you? See you at the vote."`,
  (H, w) => `The buzzer screams. ${w}'s car is the only one lit up. "${w} wins the Bash and wins immunity," ${H} calls over the feedback. "Everybody else, park it. We've got a name to write down."`,
  (H, w) => `${H}: "That's twenty! ${w} is SAFE." Sparks are still drifting down off the ceiling grid as the other drivers coast to a stop, points short and headed for tribal.`,
];

// ══════════════════════════════════════════════════════════════════════
export function simulateBumperCarBash(ep) {
  const active = gs.activePlayers.filter(p => p !== gs.exileDuelPlayer);
  if (active.length < 2) return;
  _usedTpl = new Set(); _typeUsed = {};
  const campKey = gs.mergeName || 'merge';
  if (!ep.campEvents) ep.campEvents = {};
  if (!ep.campEvents[campKey]) ep.campEvents[campKey] = { pre: [], post: [] };
  const camp = ep.campEvents[campKey];

  const personalScores = {}; active.forEach(n => personalScores[n] = 0);
  const bumpScore = (n, d) => { personalScores[n] = (personalScores[n] || 0) + d; };

  // per-driver state
  const P = {};
  active.forEach(n => { P[n] = { name: n, points: 0, stalled: false, surge: 0 }; });

  // ── alliances (perceived bonds) — allies avoid each other + set up combos ──
  const allyOf = (a, b) => a !== b && getPerceivedBond(a, b) >= 4;
  const alliesOf = (n) => active.filter(m => allyOf(n, m));

  // ── CAR TROUBLE — 1-2 lowest-control drivers stall out of the gate ──
  const stallCount = active.length >= 6 ? 2 : 1;
  const stallers = active.slice().sort((a, b) => ctrlScore(a) - ctrlScore(b)).slice(0, stallCount);
  stallers.forEach(n => { P[n].stalled = true; });

  // ── beat log ──
  const beats = [];
  let clock = 0;
  const roster = active.map(n => ({ name: n, arch: archOf(n), allies: alliesOf(n).slice(0, 2) }));
  const snap = () => active.map(n => ({ name: n, points: P[n].points, stalled: P[n].stalled }))
    .sort((a, b) => b.points - a.points || (personalScores[b.name] - personalScores[a.name]));
  const addBeat = (b) => {
    clock += 5 + Math.random() * 7;
    beats.push({ ...b, standings: snap(), lap: beats.length + 1 });
  };
  const leaderPts = () => Math.max(...active.map(n => P[n].points));
  const leaderName = () => active.slice().sort((a, b) => P[b].points - P[a].points)[0];

  let winnerName = null, denials = 0;

  // opening car-trouble beats
  stallers.forEach(n => {
    addBeat({ type: 'trouble', kind: 'trouble', players: [n], badge: 'CAR TROUBLE', badgeClass: 'trouble', pts: 0,
      text: draw([
        (x) => `${x} stamps the pedal and the car just… bucks. Wheel yanks left, then dead. "Come ON!" Half the field is already scoring while ${pronouns(x).sub} fight${pronouns(x).sub === 'they' ? '' : 's'} a car that won't cooperate.`,
        (x) => `${x}'s bumper car sputters, lurches, and spins a slow useless circle. ${pronouns(x).Sub} can't find the throttle, and every second stuck here is a point ${pronouns(x).sub}'${pronouns(x).sub === 'they' ? 're' : 's'} not getting.`,
        (x) => `Something's wrong with ${x}'s car — it crawls when ${pronouns(x).sub} floor${pronouns(x).sub === 'they' ? '' : 's'} it and jerks when ${pronouns(x).sub} ${pronouns(x).sub === 'they' ? "don't" : "doesn't"}. ${pronouns(x).Sub} start${pronouns(x).sub === 'they' ? '' : 's'} the Bash flat-footed and furious.`,
      ], n) });
  });

  // ── MAIN LOOP: race to 20 ──
  const cap = clamp(active.length * 4, 34, 44);
  let rounds = 0;
  while (leaderPts() < POINT_TARGET && rounds < cap) {
    rounds++;
    _scoringExchange();
    if (winnerName) break;
    const nSoc = (Math.random() < 0.5 ? 1 : 0) + (Math.random() < 0.2 ? 1 : 0);
    for (let k = 0; k < nSoc; k++) _fireSpecial();
  }

  // if nobody reached 20 by the horn, the points leader wins
  if (!winnerName) {
    winnerName = leaderName();
    addBeat({ type: 'win', kind: 'horn', players: [winnerName], badge: 'WINS ON POINTS', badgeClass: 'ambush', pts: 0,
      text: draw([
        (w) => `The buzzer beats anyone to twenty — but ${w} is out front when it screams, and out front is all that matters. Immunity, on points.`,
        (w) => `Time's up before anyone reaches the magic number, and ${w} has the most. The Bash goes to the leader. ${w} is safe.`,
      ], winnerName) });
  }

  // ── existing-showmance danger moment ──
  if (seasonConfig.romance !== 'disabled') {
    _checkShowmanceChalMoment(ep, null, null, personalScores, 'danger', [{ members: active }]);
  }

  // ── final standings ──
  const results = active.map(n => ({ name: n, points: P[n].points }))
    .sort((a, b) => b.points - a.points || (personalScores[b.name] - personalScores[a.name]));
  // guarantee the winner sits at #1
  const wi = results.findIndex(r => r.name === winnerName);
  if (wi > 0) { const [w] = results.splice(wi, 1); results.unshift(w); }

  bumpScore(winnerName, 1); bumpPop(winnerName, 2);
  camp.post.push({ type: 'bashWin', players: [winnerName], badgeText: 'IMMUNITY', badgeClass: 'green', tag: 'bumper-car-bash',
    text: `${winnerName} ran up ${P[winnerName].points} points in Bumper Car Bash and won immunity.` });

  // ── FINALIZE ──
  const H = hostName();
  ep.bumperCarBash = {
    immunityWinner: winnerName,
    host: H,
    hostOpen: pick(HOST_OPENERS)(H),
    hostClose: pick(HOST_CLOSERS)(H, winnerName),
    roster, beats, results,
    target: POINT_TARGET,
  };
  ep.isBumperCarBash = true;
  ep.challengeType = 'bumper-car-bash';
  ep.challengeLabel = 'Bumper Car Bash';
  ep.challengeCategory = 'physical';
  ep.immunityWinner = winnerName;
  ep.tribalPlayers = active;

  // scoring: points ARE the score (doubled so they dominate the small social bonuses)
  ep.chalMemberScores = ep.chalMemberScores || {};
  active.forEach(n => {
    ep.chalMemberScores[n] = Math.round(((ep.chalMemberScores[n] || 0) + P[n].points * 2 + (personalScores[n] || 0)) * 10) / 10;
  });
  const maxOther = Math.max(0, ...active.filter(n => n !== winnerName).map(n => ep.chalMemberScores[n] || 0));
  ep.chalMemberScores[winnerName] = Math.max(ep.chalMemberScores[winnerName] || 0, Math.round((maxOther + 1) * 10) / 10);
  ep.chalPlacements = results.map(r => r.name);

  updateChalRecord(ep);
  return ep;

  // ─────────────────────────────────────────────────────────────────────
  // one scoring exchange: an aggressor picks a target and rams for points
  function _scoringExchange() {
    const canAttack = active.filter(n => !P[n].stalled);
    if (canAttack.length < 1) { // everyone stalled — let one recover
      const r = pick(active); P[r].stalled = false; return;
    }
    // aggressor: heavily concentrated on the aggressive drivers (squared rating)
    // so a couple of them run the score up and a clear winner reaches 20
    const lp = leaderPts();
    const agg = _weightedPick(canAttack, n => {
      const rating = atkScore(n) * 1.4 + archAgg(n) * 1.5 + pStats(n).boldness * 0.3 + P[n].points * 0.2 + P[n].surge + 1;
      return rating * rating * (0.72 + Math.random() * 0.56);
    });
    if (P[agg].surge > 0) P[agg].surge = Math.max(0, P[agg].surge - 1);

    // ── DENIAL: if the aggressor is a leader about to win, a trailing driver blocks ──
    if (P[agg].points >= 18 && denials < 2) {
      const deniers = active.filter(n => n !== agg && !P[n].stalled && P[n].points < P[agg].points);
      const denier = _weightedPick(deniers, n =>
        1 + (getPerceivedBond(n, agg) < 2 ? 2 : 0) + atkScore(n) * 0.2 + archAgg(n) + noise(1.5));
      if (denier && Math.random() < 0.72) {
        denials++;
        P[denier].points += 2; bumpScore(denier, 0.6); bumpPop(denier, 0.5);
        addBond(denier, agg, -1.5);
        _heat(denier, agg, 1);
        camp.post.push({ type: 'bashDeny', players: [denier, agg], badgeText: 'BLOCKED THE WIN', badgeClass: 'red', tag: 'bumper-car-bash',
          text: `With ${agg} one bump from winning Bumper Car Bash, ${denier} slammed ${pronouns(agg).obj} out of the lane to deny the point. ${agg} won't forget it.` });
        addBeat({ type: 'deny', kind: 'deny', players: [denier, agg], badge: 'DENIAL BLOCK', badgeClass: 'deny', pts: 2, scorer: denier,
          text: draw([
            (d, l) => `${l} lines up the winning bump — and ${d} comes out of nowhere to T-bone ${pronouns(l).obj} out of the lane a half-second early. The twentieth point evaporates. ${d} banks two of ${pronouns(d).posAdj} own off the hit.`,
            (d, l) => `"${l}'s got it—" and then ${pronouns(l).sub} DON'T, because ${d} buries a bumper in ${pronouns(l).posAdj} door and spins ${pronouns(l).obj} into the wall. Win denied. ${d} pockets two points for the trouble.`,
            (d, l) => `${d} has been reading ${l} the whole heat, and now cashes it in: a clean block that stops the winning shot cold and knocks ${l} sideways. Two points to ${d}, and a very angry ${l}.`,
          ], denier, agg) });
        return;
      }
    }

    // target selection
    const allies = alliesOf(agg);
    let pool = active.filter(n => n !== agg && !allies.includes(n));
    if (!pool.length) pool = active.filter(n => n !== agg); // all allies → have to hit someone
    const tgt = _weightedPick(pool, n =>
      1 + (P[n].points >= 18 ? 4 : P[n].points >= 14 ? 1.6 : 0) + (getPerceivedBond(agg, n) < 0 ? 2 : 0) + (P[n].stalled ? 1.2 : 0) + noise(1.4));
    if (!tgt) return;

    // resolve the hit (+2.5 baseline so most exchanges actually score points)
    const edge = atkScore(agg) - evaScore(tgt) + 2.5 + noise(2.6) + (P[tgt].stalled ? 1.6 : 0);
    const mutual = !P[tgt].stalled && pStats(tgt).boldness >= 5 && Math.random() < 0.08;

    if (mutual) {
      addBeat({ type: 'ram', kind: 'null', players: [agg, tgt], badge: 'HEAD-ON · MUTUAL', badgeClass: 'null', pts: 0,
        text: draw([
          (a, b) => `${a} and ${b} both go nose-first at the exact same instant — a bone-rattling head-on that rebounds them both in a shower of sparks. Dead even. Nobody scores.`,
          (a, b) => `${a} charges ${b}; ${b} charges right back. They meet dead center with a CLANG and bounce apart, rattled and pointless. Equal hits cancel — zero.`,
          (a, b) => `Two cars, one lane, same idea. ${a} and ${b} smash front-to-front and ricochet off each other. The ref waves it off: mutual, no points.`,
        ], agg, tgt) });
      return;
    }

    let kind, pts, badge;
    if (edge >= 5.8) { kind = 'ambush'; pts = 3; badge = 'HEAD-ON AMBUSH!'; }
    else if (edge >= 3.2) { kind = 'tbone'; pts = 2; badge = 'T-BONE'; }
    else if (edge >= -1.2) { kind = 'rear'; pts = 1; badge = 'REAR HIT'; }
    else { kind = 'miss'; pts = 0; badge = 'EVADED'; }

    if (kind === 'miss') {
      // target out-reads the aggressor; a sharp one counter-taps for a rear
      const counter = Math.random() < 0.35;
      if (counter) { P[tgt].points += 1; bumpScore(tgt, 0.2); }
      addBeat({ type: 'ram', kind: 'miss', players: [tgt, agg], badge: counter ? 'DODGE + COUNTER' : 'EVADED', badgeClass: counter ? 'rear' : 'null', pts: counter ? 1 : 0, scorer: counter ? tgt : null,
        text: draw([
          (t, a) => counter
            ? `${a} lunges for ${t} and hits nothing but air — ${t} reads it, slips the lane, and clips ${a} on the way past for a cheeky point. Ice cold.`
            : `${a} commits to the ram; ${t} feathers the wheel at the last instant and ${a} sails clean past into open floor. Nothing but embarrassment.`,
          (t, a) => counter
            ? `${t} sees ${a} coming a mile off, pivots out, and taps ${pronouns(a).posAdj} back bumper as ${pronouns(a).sub} overshoot${pronouns(a).sub === 'they' ? '' : 's'}. One point, all style.`
            : `${a} winds up for a big hit and ${t} simply… isn't there anymore. The wall is, though. ${a} eats it and scores nothing.`,
        ], tgt, agg) });
      return;
    }

    P[agg].points += pts; bumpScore(agg, pts * 0.1);
    if (kind === 'ambush') bumpPop(agg, 0.4);

    // does this win it?
    const winning = P[agg].points >= POINT_TARGET;
    if (winning) winnerName = agg;

    const rear = [
      (a, b) => `${a} slots in behind ${b} and taps the back bumper clean. Cheap, easy, and one point richer.`,
      (a, b) => `${b} is looking the wrong way and ${a} makes ${pronouns(b).obj} pay — a rear-end nudge for a point. The scoreboard doesn't care how pretty it was.`,
      (a, b) => `${a} sneaks up on ${b}'s tail and rear-ends ${pronouns(b).obj} into a spin. One point, no mercy.`,
      (a, b) => `A quick shunt from behind — ${a} catches ${b} napping and banks the single. "That's how it's done."`,
      (a, b) => `${a} tucks into ${b}'s slipstream, waits, and pops the back corner just enough to register. One, quietly.`,
      (a, b) => `${b} never checks the mirror. ${a} does, and clips ${pronouns(b).posAdj} bumper for a free point on ${pronouns(b).posAdj} way past.`,
      (a, b) => `${a} nudges ${b} from dead astern — barely a love-tap, but the horn blares and the counter ticks. One point.`,
      (a, b) => `${a} coasts up on ${b}'s blind side and bunts ${pronouns(b).obj} forward. Not glamorous. Still a point.`,
      (a, b) => `${a} rides ${b}'s tail through two full corners, then rams home the second ${b} hesitates. A patient single.`,
      (a, b) => `A cheeky tap from behind and ${a} is already gone before ${b} even realizes ${pronouns(b).sub} got scored on. One.`,
      (a, b) => `${a} boxes ${b} toward the wall, then dabs the rear quarter as ${pronouns(b).sub} slow${pronouns(b).sub === 'they' ? '' : 's'} to correct. A tidy point.`,
      (a, b) => `${a} lets ${b} drift a half-length ahead and pops the bumper the instant the gap closes. One on the board, textbook.`,
      (a, b) => `${b} celebrates a hit a beat too long and ${a} punishes it — a clean rear tap while ${pronouns(b).sub}'${pronouns(b).sub === 'they' ? 're' : 's'} still grinning. One point.`,
      (a, b) => `${a} feathers up behind ${b} and taps the back plate almost politely. The horn disagrees with "politely." One.`,
    ];
    const tbone = [
      (a, b) => `${a} reads the angle, cuts across, and catches ${b} flush on the side panel. A clean T-bone — two points, and ${b} spins out furious.`,
      (a, b) => `${a} lines up ${b}'s door and buries the bumper right in the ribs of the car. Textbook T-bone. Two.`,
      (a, b) => `${b} tries to turn away too late; ${a} slams the side hard enough to lift two wheels. Two points and a rattled ${b}.`,
      (a, b) => `${a} sells a fake one way, then rams ${b} broadside the other. Two on the board and a lane cleared.`,
      (a, b) => `${a} cuts the corner tight and catches ${b} square amidships — a proper side-on crunch. Two points, and ${b} sees stars.`,
      (a, b) => `${a} times the intercept perfectly and drills ${b} in the door as ${pronouns(b).sub} cross${pronouns(b).sub === 'they' ? '' : 'es'} the lane. Two, and a lovely bit of driving.`,
      (a, b) => `Broadside! ${a} T-bones ${b} hard enough to send ${pronouns(b).posAdj} car skating sideways into the boards. Two points.`,
      (a, b) => `${a} waits for ${b} to over-rotate, then punches the exposed flank. Clean two, and ${b} is spinning like a top.`,
      (a, b) => `${a} swings wide, lines up ${b}'s midsection, and hammers it. A textbook side-hit — two points and a dented ego.`,
      (a, b) => `${a} catches ${b} mid-turn and slams the side panel with a bang that echoes off the tent. Two on the board.`,
      (a, b) => `${a} dives the inside line and clips ${b} square on the flank, spinning ${pronouns(b).obj} out into the neon haze. Two points.`,
      (a, b) => `Perfect intercept — ${a} arrives at ${b}'s door the exact moment ${pronouns(b).sub} least want${pronouns(b).sub === 'they' ? '' : 's'} company. Two, emphatically.`,
      (a, b) => `${a} pins the throttle and rams ${b} amidships, both cars screeching sideways in a spray of sparks. Two for ${a}.`,
      (a, b) => `${a} baits ${b} into overcommitting, then buries the bumper in ${pronouns(b).posAdj} exposed side. Two points, clinical.`,
    ];
    const ambush = [
      (a, b) => `${a} feints, cuts back, and slams ${b} nose-to-nose before ${pronouns(b).sub} can brace — a full-blooded ambush head-on. Three points, no argument.`,
      (a, b) => `Out of nowhere ${a} whips around a stalled car and catches ${b} dead in the front, full surprise. The crowd ROARS. Three.`,
      (a, b) => `${a} times it perfectly: ${b} never sees the head-on coming, and takes the maximum. Three points and a ringing skull.`,
      (a, b) => `${a} baits ${b} into the open and drives straight through ${pronouns(b).obj} for the ambush. Three. That's a statement.`,
      (a, b) => `${a} comes screaming out of a blind corner and meets ${b} nose-first before ${pronouns(b).sub} even flinch${pronouns(b).sub === 'they' ? '' : 'es'}. Maximum points — three.`,
      (a, b) => `A perfect trap: ${a} lets ${b} commit, then buries the front bumper head-on. ${b} is stunned, the crowd's on its feet, and it's three.`,
      (a, b) => `${a} reverses into a gap, waits a beat, and launches into ${b}'s nose the instant ${pronouns(b).sub} turn${pronouns(b).sub === 'they' ? '' : 's'} in. Full ambush, three points.`,
      (a, b) => `${b} thinks the lane is clear. It is not. ${a} detonates a head-on out of nowhere for the full three. Brutal and beautiful.`,
      (a, b) => `${a} hides behind the pack, picks the moment, and spears ${b} head-on the instant ${pronouns(b).sub} break${pronouns(b).sub === 'they' ? '' : 's'} clear. Ambush — three, and the tent erupts.`,
      (a, b) => `Dead-eye timing: ${a} meets ${b} nose-to-nose at full tilt while ${pronouns(b).sub} still think${pronouns(b).sub === 'they' ? '' : 's'} ${pronouns(b).sub}'${pronouns(b).sub === 'they' ? 're' : 's'} safe. Maximum damage, maximum points. Three.`,
      (a, b) => `${a} fakes a retreat, whips around, and blindsides ${b} with a full frontal ram. Three points and a stunned silence before the roar.`,
      (a, b) => `${a} reads ${b}'s line two moves ahead and is waiting nose-first when ${pronouns(b).sub} arrive${pronouns(b).sub === 'they' ? '' : 's'}. A perfect ambush — the full three.`,
    ];
    const winPool = [
      (a, b) => `${a} lines up the pinned ${b} and drives straight through for the head-on. TWENTY POINTS. Immunity, and a seat in the finale.`,
      (a, b) => `That's the one. ${a} nails the bump that ticks the counter over to twenty and the neon floods ${pronouns(a).posAdj} car gold. ${a} wins the Bash.`,
      (a, b) => `${a} caps it off with the winning ram — number twenty — and throws both fists up as the buzzer goes wild. Safe.`,
    ];
    const poolFor = winning ? winPool : kind === 'ambush' ? ambush : kind === 'tbone' ? tbone : rear;
    addBeat({ type: winning ? 'win' : 'ram', kind, players: [agg, tgt], badge: winning ? 'WINS IMMUNITY · 20!' : badge,
      badgeClass: winning ? 'ambush' : kind, pts, scorer: agg, winning,
      text: draw(poolFor, agg, tgt) });

    // taunt / trash-talk chaser after a big hit (real bond/pop cost)
    if (!winning && kind !== 'rear' && Math.random() < 0.32) {
      addBond(agg, tgt, -1);
      if (canScheme(agg)) bumpPop(agg, -0.3);
      addBeat({ type: 'taunt', kind: 'social', players: [agg, tgt], badge: 'TRASH TALK', badgeClass: 'social', pts: 0,
        text: draw([
          (a, b) => `${a} cruises a slow victory lap past ${b}'s spun-out car. "Aw, you okay over there? Need a tow?" ${b} is going to remember that at the vote.`,
          (a, b) => `${a} can't resist a jab after that hit — a honk, a wave, a grin. ${b}'s knuckles go white on the wheel. That's personal now.`,
          (a, b) => `"That's TWO, if you're counting," ${a} calls to ${b}, tapping the side of ${pronouns(a).posAdj} head. ${b} says nothing. ${b} says it with ${pronouns(b).posAdj} bumper, later.`,
        ], agg, tgt) });
    }
  }

  // ─────────────────────────────────────────────────────────────────────
  // one special / social beat — weighted, type-aware, every beat has teeth
  function _fireSpecial() {
    const live = active.slice();
    if (live.length < 2) return;
    const events = [];
    const add = (w, type, fire) => events.push({ w, type, fire });

    // ── STALL RECOVERY (self) — a stalled driver finally gets the hang of it ──
    const stuck = live.filter(n => P[n].stalled);
    if (stuck.length) add(2.2, 'recover', () => {
      const n = pick(stuck); P[n].stalled = false; P[n].surge = 2; bumpScore(n, 0.3); bumpPop(n, 0.3);
      addBeat({ type: 'recover', kind: 'trouble', players: [n], badge: 'FOUND THE GAS', badgeClass: 'trouble', pts: 0,
        text: draw([
          (x) => `${x} finally stops fighting the car — lets off the gas, swerves into the skid — and suddenly it snaps into line. "THERE it is." ${pronouns(x).Sub} come${pronouns(x).sub === 'they' ? '' : 's'} off the wall hungry for points.`,
          (x) => `Something clicks for ${x}. The bucking stops, the wheel bites, and ${pronouns(x).posAdj} car finally does what ${pronouns(x).sub} tell${pronouns(x).sub === 'they' ? '' : 's'} it. The comeback starts now.`,
          (x) => `${x} smacks the dash once, out of pure spite, and the car chooses that exact moment to behave. Whatever — ${pronouns(x).sub}'${pronouns(x).sub === 'they' ? 're' : 's'} moving now, and moving angry.`,
        ], n) });
    });

    // ── CROSS-ALLIANCE HELP (a tip) — helps a rival, costs partner heat ──
    const helper = live.find(n => stuck.length && !P[n].stalled && !canScheme(n));
    if (helper && stuck.length) add(1.6, 'help', () => {
      const saved = pick(stuck.filter(n => n !== helper)); if (!saved) return;
      P[saved].stalled = false; P[saved].surge = 1;
      addBond(helper, saved, 2); bumpPop(helper, 1); bumpScore(helper, 0.3);
      // a helper's own ally is not thrilled about arming a rival
      const partner = pick(alliesOf(helper).filter(a => a !== saved));
      let partnerLine = '';
      if (partner) { addBond(helper, partner, -1); _heat(helper, partner, 1); partnerLine = ` ${partner} is NOT thrilled to watch ${helper} arm a rival.`; }
      addBeat({ type: 'help', kind: 'help', players: [helper, saved], badge: 'DRIVING TIP', badgeClass: 'help', pts: 0,
        text: draw([
          (h, s) => `${h} pulls alongside a struggling ${s}: "Let off the gas — swerve INTO it, don't fight it." The tip works instantly.${partnerLine}`,
          (h, s) => `${h} could just leave ${s} stranded. Instead ${pronouns(h).sub} coach${pronouns(h).sub === 'they' ? '' : 'es'} ${pronouns(s).obj} through the skid, car to car, until ${s}'s wheels finally grip.${partnerLine}`,
          (h, s) => `"You're overcorrecting — small hands, small hands!" ${h} talks ${s} out of the spin and back into the fight. Decent of ${pronouns(h).obj}.${partnerLine}`,
        ], helper, saved) });
    });

    // ── ALLIANCE COMBO — one ally blocks a defender so the partner scores ──
    const comboA = live.find(n => !P[n].stalled && alliesOf(n).some(m => !P[m].stalled));
    if (comboA) add(1.5, 'combo', () => {
      const scorer = pick(alliesOf(comboA).filter(m => !P[m].stalled)); if (!scorer) return;
      const victim = pick(live.filter(n => n !== comboA && n !== scorer && !alliesOf(comboA).includes(n))); if (!victim) return;
      P[scorer].points += 2; bumpScore(scorer, 0.4); addBond(comboA, scorer, 1);
      const winning = P[scorer].points >= POINT_TARGET; if (winning) winnerName = scorer;
      addBeat({ type: winning ? 'win' : 'combo', kind: 'tbone', players: [comboA, scorer, victim], badge: winning ? 'COMBO · WINS IT!' : 'ALLEY-OOP', badgeClass: winning ? 'ambush' : 'tbone', pts: 2, scorer, winning,
        text: draw([
          (a, s, v) => `${a} pins ${v} against the boards and holds ${pronouns(v).obj} there — "GO, GO!" — and ${s} swings in for the free T-bone. Two points, gift-wrapped.${winning ? ` And that's twenty — ${s} wins it!` : ''}`,
          (a, s, v) => `Set play: ${a} bodies ${v} out of the lane, ${s} rolls through the gap and cracks ${pronouns(v).obj} on the side. Clean two off the block.${winning ? ` The Bash is over — ${s} takes immunity!` : ''}`,
          (a, s, v) => `${a} and ${s} run it like they practiced — ${a} the screen, ${s} the finish, ${v} the target. Two points and a furious ${v}.${winning ? ` Number twenty. ${s} is safe!` : ''}`,
        ], comboA, scorer, victim) });
    });

    // ── BETRAYAL — when the win is close, an ally rams an ally ──
    if (leaderPts() >= 14) {
      const betrayer = live.find(n => !P[n].stalled && !isNice(n) && alliesOf(n).length);
      if (betrayer) add(1.7, 'betray', () => {
        const mark = pick(alliesOf(betrayer).filter(m => !P[m].stalled)); if (!mark) return;
        P[betrayer].points += 2; bumpScore(betrayer, 0.4); addBond(betrayer, mark, -3); bumpPop(betrayer, -0.4);
        _heat(betrayer, mark, 2);
        camp.post.push({ type: 'bashBetray', players: [betrayer, mark], badgeText: 'BETRAYED AN ALLY', badgeClass: 'red', tag: 'bumper-car-bash',
          text: `In the closing points of Bumper Car Bash, ${betrayer} turned on ${mark} — a two-point hit on ${pronouns(mark).posAdj} own supposed ally. "Only one of us wins."` });
        addBeat({ type: 'betray', kind: 'tbone', players: [betrayer, mark], badge: 'BETRAYAL', badgeClass: 'deny', pts: 2, scorer: betrayer,
          text: draw([
            (b, m) => `${m} rolls up expecting cover from ${pronouns(m).posAdj} own alliance — and ${b} T-bones ${pronouns(m).obj} instead. "Only one of us can win this, ${m}." Two points, and a pact in pieces.`,
            (b, m) => `The mask comes off. ${b} waves ${m} in close like it's a set play, then rams ${pronouns(m).obj} broadside and cackles. "Sorry! Game's a game." ${m}'s jaw is on the floor.`,
            (b, m) => `${b} decides immunity is worth more than loyalty and drives it home — a two-point hit on ${m}, ${pronouns(b).posAdj} closest ally out here. That one echoes all the way to the jury.`,
          ], betrayer, mark) });
      });
    }

    // ── VOTE SCHEME — mid-arena targeting talk shifts who's hunting whom ──
    const schemer = live.find(canScheme);
    if (schemer) add(1.3, 'scheme', () => {
      const conspirator = pick(live.filter(n => n !== schemer && getPerceivedBond(schemer, n) >= 0)) || pick(live.filter(n => n !== schemer));
      if (!conspirator) return;
      const mark = pick(live.filter(n => n !== schemer && n !== conspirator)) || null;
      addBond(schemer, conspirator, 1);
      if (mark) { addBond(schemer, mark, -0.5); addBond(conspirator, mark, -0.5); }
      camp.post.push({ type: 'bashScheme', players: [schemer, conspirator], badgeText: 'ARENA DEAL', badgeClass: 'blue', tag: 'bumper-car-bash',
        text: `Circling the floor in Bumper Car Bash, ${schemer} cut a quiet deal with ${conspirator}${mark ? ` — target ${mark} if this goes to a tie` : ''}. Strategy at forty miles an hour.` });
      addBeat({ type: 'scheme', kind: 'social', players: [schemer, conspirator], badge: 'VOTE SCHEME', badgeClass: 'social', pts: 0,
        text: draw([
          (s, c) => `${s} pulls ${c} into a slow parallel drift and talks fast under the engine noise: "If they force a tie, we take whoever's beatable.${mark ? ` Chase ${mark} — we don't want ${pronouns(mark).obj} at the fire.` : ''}" ${c} nods along at forty miles an hour.`,
          (s, c) => `Two cars, one whispered plan. ${s} and ${c} use the Bash as cover to line up tonight's vote${mark ? `, ${mark}'s name already halfway written` : ''}. The bumping's just noise.`,
          (s, c) => `${s} leans across the gap between cars: "Distract the leader, save your points, we deal after." ${c} agrees — reluctantly, but ${pronouns(c).sub} agree${pronouns(c).sub === 'they' ? '' : 's'}.${mark ? ` ${mark} has no idea.` : ''}`,
        ], schemer, conspirator) });
    });

    // ── SPINOUT / WALL PIN — knock a rival's control out (brief stall), no points ──
    add(1.1, 'spinout', () => {
      const a = pick(live.filter(n => !P[n].stalled)); if (!a) return;
      const b = pick(live.filter(n => n !== a && !alliesOf(a).includes(n))) || pick(live.filter(n => n !== a)); if (!b) return;
      P[b].stalled = true; addBond(a, b, -0.5);
      addBeat({ type: 'spinout', kind: 'social', players: [a, b], badge: 'SPUN OUT', badgeClass: 'social', pts: 0,
        text: draw([
          (x, y) => `${x} doesn't bother scoring — just pins ${y} against the boards and holds ${pronouns(y).obj} there, engine screaming, wheels smoking. No points, but ${y}'s stuck and stewing.`,
          (x, y) => `${x} spins ${y} into a lazy, helpless circle in the corner and rolls off. Pure sabotage. ${y} loses all ${pronouns(y).posAdj} momentum.`,
          (x, y) => `A hard shove sends ${y} nose-first into the wall, stalled and cursing while ${x} goes hunting for actual points elsewhere.`,
        ], a, b) });
    });

    // ── ENCOURAGE — rally a driver stuck near the bottom ──
    const social = live.find(n => archOf(n) === 'social-butterfly' || pStats(n).social >= 7);
    if (social) add(1.2, 'encourage', () => {
      const down = live.slice().sort((a, b) => P[a].points - P[b].points)[0];
      if (!down || down === social) return;
      P[down].surge = Math.max(P[down].surge, 1); bumpPop(social, 0.4); bumpPop(down, 0.4); addBond(social, down, 1.2);
      addBeat({ type: 'encourage', kind: 'help', players: [social, down], badge: 'RALLIED', badgeClass: 'help', pts: 0,
        text: draw([
          (s, d) => `${d} is dead last and ready to coast it out. ${s} pulls alongside: "You're one good hit from back in this. Pick a car and GO." ${d} squares the wheel and goes.`,
          (s, d) => `${s} won't let ${d} give up out there — a whole pep talk shouted across two moving cars. Ridiculous. Also working. ${d} finds a gear.`,
          (s, d) => `"Points are points, doesn't matter how far back you are — start bumping!" ${s} lights a fire under ${d}, who peels off the wall with fresh purpose.`,
        ], social, down) });
    });

    // ── RIVALRY — two who don't get along collide hard ──
    let rivalryPair = null, minB = 1;
    for (let i = 0; i < live.length; i++) for (let j = i + 1; j < live.length; j++) {
      const bd = getBond(live[i], live[j]);
      if (bd < minB) { minB = bd; rivalryPair = [live[i], live[j]]; }
    }
    if (rivalryPair) add(1.3, 'rivalry', () => {
      const [a, b] = rivalryPair;
      addBond(a, b, -1.5); bumpPop(a, -0.3);
      if (Math.random() < 0.4) _heat(a, b, 1);
      addBeat({ type: 'rivalry', kind: 'social', players: [a, b], badge: 'RIVALRY', badgeClass: 'social', pts: 0,
        text: draw([
          (x, y) => `${x} and ${y} forget the scoreboard entirely and just start ramming each OTHER, over and over, teeth bared. Old business, settled at thirty miles an hour. Neither scores; both seethe.`,
          (x, y) => `It gets personal fast: ${x} chases ${y} across the whole floor trading furious hits, ignoring every easy point on offer. "That's for last week." "For LAST WEEK?!"`,
          (x, y) => `${x} and ${y} lock bumpers and shove, engines howling, refusing to break off. The ref is yelling. They aren't listening. This ends at tribal.`,
          (x, y) => `Whatever's between ${x} and ${y} boils over out here — a grinding, pointless, personal duel in the middle of the arena while everyone else racks up points around them.`,
        ], a, b) });
    });

    // ── RESPECT — a gutsy move earns grudging respect ──
    if (live.length >= 2) add(1.0, 'respect', () => {
      const doer = live.slice().sort((a, b) => pStats(b).boldness - pStats(a).boldness)[0];
      const witness = pick(live.filter(n => n !== doer && getBond(n, doer) < 3)) || pick(live.filter(n => n !== doer));
      if (!doer || !witness) return;
      addBond(doer, witness, 1.5); bumpPop(doer, 0.8);
      addBeat({ type: 'respect', kind: 'help', players: [doer, witness], badge: 'RESPECT', badgeClass: 'help', pts: 0,
        text: draw([
          (d, w) => `${d} takes on two cars at once and comes out the other side still scoring. ${w}, who never rated ${d}, just stares. "...Okay. That was actually kind of incredible."`,
          (d, w) => `A fearless, reckless, brilliant bit of driving from ${d} — and even ${w} has to give it up. "Didn't think ${d} had it in ${pronouns(d).obj}."`,
          (d, w) => `${d} throws ${pronouns(d).ref} into a hit no sane driver would try, and pulls it off. ${w} claps, almost against ${pronouns(w).posAdj} will.`,
        ], doer, witness) });
    });

    // ── SHOWMANCE SPARK — the chaos throws a compatible pair together ──
    if (seasonConfig.romance !== 'disabled') {
      let sparkPair = null;
      for (let i = 0; i < live.length && !sparkPair; i++) for (let j = i + 1; j < live.length; j++) {
        const a = live[i], b = live[j];
        if (romanticCompat(a, b) && !gs.showmances?.some(sh => sh.phase !== 'broken-up' && sh.players.includes(a) && sh.players.includes(b))) { sparkPair = [a, b]; break; }
      }
      if (sparkPair) add(1.4, 'spark', () => {
        const [a, b] = sparkPair;
        const sparked = _challengeRomanceSpark(a, b, ep, null, null, personalScores, 'bumper-car chaos');
        if (sparked) {
          addBeat({ type: 'spark', kind: 'help', players: [a, b], badge: '💘 SPARKS', badgeClass: 'spark', pts: 0,
            text: draw([
              (x, y) => `${x} and ${y} keep "accidentally" bumping each other — gentle taps, laughing every time — while the rest of the field wages war. By the end they're driving in lazy circles together. The camp will have OPINIONS.`,
              (x, y) => `In the middle of the demolition, ${x} pulls a chivalrous block for ${y} and gets a look back that has nothing to do with strategy. Something just started in the neon.`,
            ], a, b) });
        } else {
          addBond(a, b, 1);
          addBeat({ type: 'chemistry', kind: 'help', players: [a, b], badge: 'CHEMISTRY', badgeClass: 'spark', pts: 0,
            text: draw([
              (x, y) => `${x} keeps pulling punches whenever ${pronouns(x).posAdj} car lines up on ${y} — a two-point T-bone right there, and ${pronouns(x).sub} just… taps the brakes and grins instead.`,
              (x, y) => `${x} and ${y} spend more of the Bash circling each other than scoring, trading grins across the gap. Terrible strategy. Great television.`,
            ], a, b) });
        }
      });
    }

    if (!events.length) return;
    // downweight already-used TYPES so variety spreads across the whole Bash
    const eff = events.map(e => e.w / (1 + (_typeUsed[e.type] || 0) * 1.6));
    const total = eff.reduce((s, w) => s + w, 0);
    let roll = Math.random() * total, idx = 0;
    for (let i = 0; i < events.length; i++) { roll -= eff[i]; if (roll <= 0) { idx = i; break; } }
    const e = events[idx];
    _typeUsed[e.type] = (_typeUsed[e.type] || 0) + 1;
    e.fire();
  }

  function _heat(a, b, amt) {
    if (!gs._bumperHeat) gs._bumperHeat = {};
    gs._bumperHeat[a] = { target: b, amount: (gs._bumperHeat[a]?.amount || 0) + amt, expiresEp: (gs.episode || 0) + 2 };
  }
}

function _weightedPick(arr, wf) {
  if (!arr.length) return null;
  const ws = arr.map(x => Math.max(0.01, wf(x)));
  const total = ws.reduce((s, w) => s + w, 0);
  let roll = Math.random() * total;
  for (let i = 0; i < arr.length; i++) { roll -= ws[i]; if (roll <= 0) return arr[i]; }
  return arr[arr.length - 1];
}

// ══════════════════════════════════════════════════════════════════════
// VP + TEXT are in bumper-car-bash-vp.js
// ══════════════════════════════════════════════════════════════════════
export { rpBuildBashTitleCard, rpBuildBashArena, rpBuildBashResults, bashRevealNext, bashRevealAll } from './bumper-car-bash-vp.js';
