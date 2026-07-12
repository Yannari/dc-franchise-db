// ══════════════════════════════════════════════════════════════════════
// tusks-and-ladders.js — "Tusks and Ladders" (DC4, pre-merge team challenge)
// Each team pulls its LADDER PIECES off one angry elephant (trunk/tail/leg/back),
// assembles a ladder, sends two climbers to a cannon, and fires at the rival
// team's flag. First flag hit wins immunity.
//
//   GRAB (piece off the elephant) = boldness*0.45 + physical*0.3 + intuition*0.15
//     → bold players snatch pieces; the timid ("please don't send me out") choke
//   AIM  (cannon at the flag)     = intuition*0.4 + mental*0.35 + boldness*0.15
//
// Depth: the elephant runs a RAGE meter (Calm→Agitated→Charging→Rampage). Schemers
// can smack its rump to send it CHARGING the rival team (heat + disruption); heroes
// RESCUE thrown teammates / lead it into getting its tusks stuck; counter-sabotage
// frees it to chase back. A host tranquilizer ends the rampage before the cannon
// duel. Every social beat has real consequences (bonds/pop/heat/showmance).
// ══════════════════════════════════════════════════════════════════════
import { gs, players, seasonConfig } from '../core.js';
import { pStats, pronouns, updateChalRecord, romanticCompat } from '../players.js';
import { addBond, getBond } from '../bonds.js';
import { _challengeRomanceSpark, _checkShowmanceChalMoment } from '../romance.js';

function noise(m) { return (Math.random() - 0.5) * 2 * m; }
function archOf(n) { return players.find(p => p.name === n)?.archetype || 'floater'; }
function pick(a) { return a.length ? a[Math.floor(Math.random() * a.length)] : null; }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function bumpPop(n, d) { if (!gs.popularity) gs.popularity = {}; gs.popularity[n] = (gs.popularity[n] || 0) + d; }
function grabScore(n) { const s = pStats(n); return s.boldness * 0.45 + s.physical * 0.3 + s.intuition * 0.15; }
function aimScore(n) { const s = pStats(n); return s.intuition * 0.4 + s.mental * 0.35 + s.boldness * 0.15; }
function climbScore(n) { const s = pStats(n); return s.physical * 0.5 + s.endurance * 0.4 + s.boldness * 0.1; }
function canScheme(n) {
  const a = archOf(n), s = pStats(n);
  if (['villain', 'mastermind', 'schemer'].includes(a)) return true;
  if (['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat'].includes(a)) return false;
  return s.strategic >= 6 && s.loyalty <= 4;
}
function isNice(n) { return ['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat'].includes(archOf(n)); }

// name-stripped no-repeat text picker (reset per run)
let _usedTpl;
function draw(pool, ...ctx) {
  const built = pool.map(f => f(...ctx));
  const strip = (t) => gs.activePlayers.reduce((s, n) => s.split(n).join('~'), t);
  const fresh = built.filter(t => !_usedTpl.has(strip(t)));
  const from = fresh.length ? fresh : built;
  const chosen = from[Math.floor(Math.random() * from.length)];
  _usedTpl.add(strip(chosen));
  return chosen;
}

const RAGE_STAGES = [
  { at: 0, name: 'Calm', cls: 'calm' },
  { at: 30, name: 'Agitated', cls: 'agit' },
  { at: 60, name: 'Charging', cls: 'charge' },
  { at: 85, name: 'RAMPAGE', cls: 'rampage' },
];
function rageStage(r) { let s = RAGE_STAGES[0]; for (const st of RAGE_STAGES) if (r >= st.at) s = st; return s; }
const BODY_PARTS = ['trunk', 'tail', 'left ear', 'back leg', 'broad back', 'front tusk'];

const OPENERS = [
  "Today's challenge is tied to something a little... bigger than usual. Say hello to your ladder pieces, campers. They're strapped to that elephant. Good luck.",
  "Each team needs to build a ladder to a cannon and blast the other team's flag. Small catch: every ladder piece is tethered to one very cranky elephant.",
  "Grab your ladder pieces, build to the cannon, sink the other team's flag. The pieces? They're on the elephant. The elephant? It did not consent to this.",
];
const CLOSERS = [
  "And that's a wrap — one flag down, one team headed to tribal, and one elephant that needs a long nap and a good lawyer.",
  "Immunity's decided by a cannonball. Somewhere a zoologist is filing a complaint.",
  "The flag's down, the elephant's asleep, and somebody's going home tonight.",
];

// ══════════════════════════════════════════════════════════════════════
export function simulateTusksLadders(ep) {
  const active = gs.activePlayers.filter(p => p !== gs.exileDuelPlayer);
  const tribes = (gs.tribes || []).filter(t => t.members.some(m => active.includes(m)));
  if (tribes.length < 2) return;
  _usedTpl = new Set();
  ep.campEvents = ep.campEvents || {};
  const personalScores = {};

  const rosters = tribes.map(t => ({ tribe: t, name: t.name, color: t.color, members: t.members.filter(m => active.includes(m)) }))
    .filter(r => r.members.length >= 2);
  if (rosters.length < 2) return;
  const minSize = Math.min(...rosters.map(r => r.members.length));
  const PIECES = clamp(minSize + 1, 3, 5);

  const teams = rosters.map(r => {
    ep.campEvents[r.name] = ep.campEvents[r.name] || { pre: [], post: [] };
    r.members.forEach(m => { personalScores[m] = 0; });
    return { name: r.name, color: r.color, members: [...r.members], tribe: r.tribe,
      pieces: 0, disruption: 0, gatherRound: null };
  });
  const teamOf = (n) => teams.find(t => t.members.includes(n));
  const rival = (t) => teams[(teams.indexOf(t) + 1) % teams.length];

  const beats = [];   // hunt beats (VP)
  let rage = 8;
  const rageAt = []; // rage snapshot after each beat

  const addBeat = (b) => { beats.push(b); rageAt.push(Math.round(rage)); };

  // ── PHASE 1: THE HUNT ──
  const maxRounds = PIECES * teams.length + 4;
  let tranq = false;
  for (let round = 1; round <= maxRounds; round++) {
    const stillGathering = teams.filter(t => t.pieces < PIECES);
    if (!stillGathering.length) break;

    for (const team of stillGathering) {
      // pick a grabber — prefer bold, unused-ish; cowards sometimes get shoved out
      const roster = team.members.slice().sort((a, b) => grabScore(b) - grabScore(a));
      const bold = roster[0];
      const timid = roster[roster.length - 1];
      const stage = rageStage(rage);
      // occasional "coward begs off" beat when the elephant is dangerous
      if (stage.at >= 60 && pStats(timid).boldness <= 4 && !team._cowardShown && Math.random() < 0.3) {
        team._cowardShown = true; // one begging-off beat per team, max
        bumpPop(timid, -1);
        addBeat({ team: team.name, color: team.color, type: 'coward', players: [timid], part: null,
          badge: 'BEGGING OFF', badgeClass: 'bad',
          text: draw([
            (n) => `${n} plants both feet and refuses. "You want me to walk up to a RAMPAGING elephant? Absolutely not. Send literally anyone else." The team loses the beat arguing about it.`,
            (n) => `${n} freezes at the edge of the ring. "Nope. Nope nope nope." ${pronouns(n).PosAdj} teammates groan as the clock ticks.`,
            (n) => `${n} tries to hide behind ${pronouns(n).posAdj} own teammates. "I'm a lover, not a — is that thing looking at me? It's looking at me. I'm out." The team shoves ${pronouns(n).obj} forward anyway.`,
            (n) => `${n} suddenly develops a limp, a headache, and an urgent need to "check on the flag." Nobody buys it. Least of all the elephant.`,
          ], timid) });
        continue;
      }
      const grabber = (Math.random() < 0.7) ? bold : pick(team.members);
      const part = pick(BODY_PARTS);
      const success = grabScore(grabber) + noise(3) - (stage.at >= 60 ? 1.5 : 0) > 4.5;
      if (success) {
        team.pieces++;
        personalScores[grabber] += 2;
        const faith = archOf(grabber) === 'social-butterfly' || pStats(grabber).boldness >= 8;
        if (faith) bumpPop(grabber, 1);
        addBeat({ team: team.name, color: team.color, type: 'grab', players: [grabber], part,
          badge: `PIECE ${team.pieces}/${PIECES}`, badgeClass: 'good',
          text: draw([
            (n, p) => `${n} darts in and rips a ladder piece off the elephant's ${p}. Clean. Bold. "See? Didn't even flinch."`,
            (n, p) => `${n} times it perfect, snatching a piece from the ${p} the instant the elephant looks away. ${team.name} roars.`,
            (n, p) => `Cool as anything, ${n} lifts a piece off the ${p} like the six-ton animal isn't even there. Nerves of steel.`,
            (n, p) => `${n} ducks a swinging trunk and comes up with a piece torn free of the ${p}. The crowd loses it.`,
            (n, p) => `No hesitation — ${n} vaults in, wrenches a piece off the ${p}, and rolls clear before the elephant even reacts.`,
          ], grabber, part) });
        rage += 6;
      } else {
        personalScores[grabber] += 0.3;
        addBeat({ team: team.name, color: team.color, type: 'miss', players: [grabber], part,
          badge: 'NO GRAB', badgeClass: 'neutral',
          text: draw([
            (n, p) => `${n} lunges for the ${p} — and gets a faceful of trunk for the trouble. Back to the line, empty-handed.`,
            (n, p) => `The elephant shifts just as ${n} reaches for the ${p}. ${pronouns(n).Sub} bail${pronouns(n).sub === 'they' ? '' : 's'} out with nothing but a bruised ego.`,
            (n, p) => `${n} gets one hand on the ${p} piece before the elephant stamps and sends ${pronouns(n).obj} sprawling into the sawdust. No dice.`,
            (n, p) => `A near thing — ${n} grabs at the ${p}, slips on the churned-up dirt, and comes away with a fistful of nothing.`,
          ], grabber, part) });
        rage += 3;
      }
      if (team.pieces >= PIECES && team.gatherRound == null) team.gatherRound = round;

      // ── a social event roughly every other grab ──
      if (Math.random() < 0.9) _huntSocial(team, teams, rival(team), PIECES, personalScores, ep, addBeat, () => rage, (d) => { rage = clamp(rage + d, 0, 100); }, 1 + (Math.random() < 0.45 ? 1 : 0));
    }
    rage = clamp(rage + 2, 0, 100); // natural escalation

    // tranquilizer near the climax
    if (!tranq && rage >= 90 && teams.some(t => t.pieces >= PIECES - 1)) {
      tranq = true;
      const medic = 'Emily';
      addBeat({ team: null, color: '#7fd1b9', type: 'tranq', players: [], part: null,
        badge: '💤 TRANQUILIZED', badgeClass: 'good',
        text: `Just as the elephant lowers its head for a full RAMPAGE, ${medic} steps out with a tranq gun and drops a dart in its flank. It wobbles, sits, and — mercifully — sleeps. The ring goes quiet.` });
      rage = 0;
    }
  }
  // any team that never finished gathering gets a heavy penalty
  teams.forEach(t => { if (t.gatherRound == null) { t.gatherRound = maxRounds + 3; t.disruption += 6; } });

  // showmance danger moments
  if (seasonConfig.romance) {
    for (const sm of (gs.showmances || [])) {
      if (sm.pair && !sm.broken && active.includes(sm.pair[0]) && active.includes(sm.pair[1])) _checkShowmanceChalMoment(sm.pair[0], sm.pair[1], ep);
    }
  }

  // ── PHASE 2 & 3: ASSEMBLE + CANNON DUEL ──
  const finish = [];
  for (const team of teams) {
    const avgBuild = team.members.reduce((s, m) => { const st = pStats(m); return s + (st.mental + st.physical) / 2; }, 0) / team.members.length;
    const assembleTime = clamp(22 - avgBuild * 1.1 + noise(3), 6, 30);
    // two climbers = best climbScore
    const climbers = team.members.slice().sort((a, b) => climbScore(b) - climbScore(a)).slice(0, 2);
    climbers.forEach(c => personalScores[c] += 3);
    const climbTime = clamp(16 - (climbScore(climbers[0]) + (climbScore(climbers[1]) || 0)) / 2 * 0.9 + noise(2.5), 4, 24);
    const readyTime = team.gatherRound * 6 + team.disruption + assembleTime + climbTime;
    const aim = (aimScore(climbers[0]) + (aimScore(climbers[1]) || aimScore(climbers[0]))) / 2;
    finish.push({ team, climbers, assembleTime: Math.round(assembleTime), climbTime: Math.round(climbTime), readyTime, aim, volleys: [] });
  }

  // simulate volleys: from each team's readyTime, fire every ~7s; hit chance from aim
  finish.forEach(f => {
    let t = f.readyTime, shots = 0;
    while (shots < 8) {
      shots++;
      const hitChance = clamp(0.18 + f.aim * 0.05, 0.15, 0.72);
      const hit = Math.random() < hitChance;
      f.volleys.push({ n: shots, hit, at: Math.round(t) });
      if (hit) { f.hitTime = t; f.shotsToHit = shots; break; }
      t += 7;
    }
    if (f.hitTime == null) { f.hitTime = t + 7; f.shotsToHit = shots; f.volleys[f.volleys.length - 1].hit = true; }
  });

  finish.sort((a, b) => a.hitTime - b.hitTime);
  const winnerF = finish[0], loserF = finish[finish.length - 1];
  const winner = winnerF.team, loser = loserF.team;
  const safeTribes = tribes.filter(t => t !== winner.tribe && t !== loser.tribe);

  // scoring: the winning shot + team finish bonus
  winnerF.climbers.forEach(c => personalScores[c] += 5);
  winner.members.forEach(m => personalScores[m] = (personalScores[m] || 0) + 4);
  bumpPop(winnerF.climbers[0], 2);

  // ── finalize (pre-merge tribe dispatch) ──
  ep.tusksLadders = {
    pieces: PIECES,
    teams: teams.map(t => ({ name: t.name, color: t.color, members: t.members, pieces: t.pieces, gatherRound: t.gatherRound, disruption: Math.round(t.disruption) })),
    beats, rageAt,
    finish: finish.map(f => ({ team: f.team.name, color: f.team.color, climbers: f.climbers, assembleTime: f.assembleTime, climbTime: f.climbTime, readyTime: Math.round(f.readyTime), aim: Math.round(f.aim * 10) / 10, volleys: f.volleys, shotsToHit: f.shotsToHit, hitTime: Math.round(f.hitTime) })),
    winner: winner.name, loser: loser.name,
    opener: pick(OPENERS), closer: pick(CLOSERS),
  };
  ep.winner = winner.tribe;
  ep.loser = loser.tribe;
  ep.safeTribes = safeTribes;
  ep.tribalPlayers = [...loser.members];
  ep.challengePlacements = finish.map(f => { const t = gs.tribes.find(x => x.name === f.team.name); return { name: f.team.name, members: [...(t?.members || [])] }; });
  ep.challengeType = 'tusks-and-ladders';
  ep.challengeLabel = 'Tusks and Ladders';
  ep.challengeCategory = 'chaos';
  ep.chalMemberScores = {}; active.forEach(n => { ep.chalMemberScores[n] = Math.round((personalScores[n] || 0) * 10) / 10; });
  ep.chalPlacements = Object.entries(personalScores).sort((a, b) => b[1] - a[1]).map(([n]) => n);
  ep.isTusksLadders = true;

  updateChalRecord(ep);
}

// ── SOCIAL EVENTS during the hunt — a weighted catalog, EVERY event with real
// gameplay consequences (bonds / popularity / heat / disruption / showmances).
// Fires 1-2 events per call. ──
function _huntSocial(team, teams, rival, pieces, personalScores, ep, addBeat, getRage, addRage, count) {
  const own = team.members;
  if (own.length < 1) return;
  const rage = getRage();
  const bumpScore = (n, d) => { personalScores[n] = (personalScores[n] || 0) + d; };
  const schemer = own.find(canScheme);
  const hero = own.find(n => ['hero', 'loyal-soldier'].includes(archOf(n)) || pStats(n).loyalty >= 6);
  const counterP = own.find(n => !isNice(n) && pStats(n).boldness >= 6);
  const social = own.find(n => archOf(n) === 'social-butterfly' || pStats(n).social >= 7);

  // find a low-bond pair within the team (rivalry) and a compatible pair (spark)
  let rivalryPair = null, sparkPair = null, minB = 2;
  for (let i = 0; i < own.length; i++) for (let j = i + 1; j < own.length; j++) {
    const a = own[i], b = own[j], bd = getBond(a, b);
    if (bd < minB && (archOf(a) !== archOf(b) || bd <= -1)) { minB = bd; rivalryPair = [a, b]; }
    if (seasonConfig.romance && !sparkPair && romanticCompat(a, b) && !gs.showmances?.some(sh => sh.phase !== 'broken-up' && sh.players.includes(a) && sh.players.includes(b))) sparkPair = [a, b];
  }
  const rivalTeamMember = rival ? pick(rival.members) : null;

  const events = [];
  const add = (w, fire) => events.push({ w, fire });

  // ── SABOTAGE: send the elephant charging at the rival team ──
  if (schemer && rival && rival.pieces < pieces) add(3.2, () => {
    const victim = rivalTeamMember;
    rival.disruption += 3; bumpScore(schemer, 1); bumpPop(schemer, -1);
    if (victim) addBond(schemer, victim, -2);
    if (!gs._tusksHeat) gs._tusksHeat = {};
    if (victim) gs._tusksHeat[schemer] = { target: victim, amount: (gs._tusksHeat[schemer]?.amount || 0) + 2, expiresEp: (gs.episode || 0) + 3 };
    addRage(14);
    ep.campEvents[team.name]?.pre.push({ type: 'tusksSabotage', players: [schemer, victim].filter(Boolean), badgeText: 'SABOTAGE', badgeClass: 'red',
      text: `${schemer} smacked the elephant toward ${rival.name} during Tusks and Ladders${victim ? ` — ${victim} took the brunt of the charge` : ''}. "It's not against the rules."` });
    addBeat({ team: team.name, color: team.color, type: 'sabotage', players: [schemer, victim].filter(Boolean),
      badge: 'SABOTAGE', badgeClass: 'bad',
      text: draw([
        (n, v) => `${n} slaps the elephant hard on the rump and points it straight at ${rival.name}. It charges — ${v ? `${v} dives clear as` : 'the whole team scatters as'} the seats explode into splinters. "It's not against the rules."`,
        (n, v) => `With a grin, ${n} spooks the elephant toward ${rival.name}. ${v ? `${v} goes flying` : 'Their whole line scatters'}; their half-built progress scatters with them.`,
        (n, v) => `${n} whistles sharp and flings a rock past the elephant's ear, steering the stampede right into ${rival.name}'s work zone. ${v ? `${v} barely rolls aside.` : 'Chaos.'} "Rules said grab pieces. Said nothing about THIS."`,
        (n, v) => `${n} cuts the elephant's tether loose on ${rival.name}'s side and just... lets nature happen. ${v ? `${v} takes the hit` : 'Their line breaks'} as the beast plows through. Cold-blooded.`,
      ], schemer, victim) });
  });

  // ── RESCUE: save a teammate; can spark a showmance under real danger ──
  if (hero && rage >= 45) add(3.0, () => {
    const saved = pick(own.filter(n => n !== hero)) || hero;
    bumpScore(hero, 3); bumpPop(hero, 2);
    if (saved && saved !== hero) addBond(hero, saved, 2);
    addRage(-8);
    addBeat({ team: team.name, color: team.color, type: 'rescue', players: (saved && saved !== hero) ? [hero, saved] : [hero],
      badge: 'HERO PLAY', badgeClass: 'good',
      text: draw([
        (h, s) => s && s !== h ? `The elephant flings ${s} off its back — and ${h} is there, arms out, catching ${pronouns(s).obj} clean and taking the fall for both of them. Pure instinct.` : `${h} throws a fistful of dirt in the elephant's eye and hauls the team behind the door as it blunders past. Quick thinking, no glory.`,
        (h, s) => s && s !== h ? `${h} sees ${s} about to get trampled and yanks ${pronouns(s).obj} out of the path at the last second. "I've got you. GO."` : `${h} leads the elephant on a mad dash until its tusks jam into the ring — bought the whole team ten safe seconds.`,
        (h, s) => s && s !== h ? `${h} throws ${pronouns(h).ref} bodily between ${s} and the charging elephant, absorbing the shove so ${s} keeps ${pronouns(s).posAdj} piece. "You'd have done the same."` : `${h} waves ${pronouns(h).posAdj} shirt like a matador and peels the elephant off the whole team at the worst possible moment. Fearless.`,
        (h, s) => s && s !== h ? `${s} loses ${pronouns(s).posAdj} footing right under the elephant — ${h} hauls ${pronouns(s).obj} up by the collar and shoves ${pronouns(s).obj} to safety, then dives the other way. Both alive. Barely.` : `${h} baits the elephant into a full charge, then side-steps at the last instant — it plows head-first into the seats and gets stuck fast. Genius, or lucky.`,
      ], hero, saved) });
    // a life-or-death save between compatible people can light a real spark
    if (seasonConfig.romance && saved && saved !== hero && romanticCompat(hero, saved)) {
      const sparked = _challengeRomanceSpark(hero, saved, ep, null, null, personalScores, 'life-or-death save under the elephant');
      if (sparked) addBeat({ team: team.name, color: team.color, type: 'spark', players: [hero, saved],
        badge: '💘 SPARKS', badgeClass: 'good',
        text: draw([
          (a, b) => `${a} doesn't let go of ${b} right away after the save. Neither of them mentions it. But the whole camp saw the way they looked at each other. Something just started.`,
          (a, b) => `For one second after ${a} pulls ${b} clear, the elephant, the challenge, the game all disappear. It's just the two of them, breathing hard, way too close. A showmance is born in the sawdust.`,
        ], hero, saved) });
    }
  });

  // ── SHOWMANCE SPARK: danger + downtime throws two compatible players together ──
  if (seasonConfig.romance && sparkPair && rage >= 35) add(2.6, () => {
    const [a, b] = sparkPair;
    const sparked = _challengeRomanceSpark(a, b, ep, null, null, personalScores, 'the chaos of Tusks and Ladders');
    if (sparked) {
      addBeat({ team: team.name, color: team.color, type: 'spark', players: [a, b],
        badge: '💘 SPARKS', badgeClass: 'good',
        text: draw([
          (x, y) => `Pinned behind the shelter door as the elephant thunders past, ${x} and ${y} end up nose to nose, hearts hammering. When it's over, neither steps back. The camp exchanges knowing looks.`,
          (x, y) => `${x} grabs ${y}'s hand to pull ${pronouns(y).obj} out of the elephant's path — and just... doesn't let go. The challenge keeps going. So does the hand-holding. Showmance, incoming.`,
          (x, y) => `A near-miss with six tons of angry elephant leaves ${x} and ${y} tangled in the dirt, laughing in that giddy way people do when they almost die together. Something clicks.`,
        ], a, b) });
    } else {
      // no full spark, but the near-moment still moves the needle
      addBond(a, b, 1);
      addBeat({ team: team.name, color: team.color, type: 'chemistry', players: [a, b],
        badge: 'CHEMISTRY', badgeClass: 'good',
        text: draw([
          (x, y) => `${x} shields ${y} from a swinging trunk and holds the look a beat too long. Nothing said. But something's there, and everyone can feel it.`,
          (x, y) => `In the middle of the chaos, ${x} and ${y} keep finding reasons to be near each other. Coincidence, they'd both swear. The camp isn't convinced.`,
          (x, y) => `${x} pulls ${y} down out of the elephant's path and their eyes lock a half-second too long. Both look away fast. Both are smiling.`,
          (x, y) => `${x} and ${y} keep bickering like it's nothing, but everyone can see it's the good kind of bickering. The kind that turns into something.`,
        ], a, b) });
    }
  });

  // ── RIVALRY: two who don't get along clash in the chaos (deepens the feud) ──
  if (rivalryPair) add(2.4, () => {
    const [a, b] = rivalryPair;
    addBond(a, b, -1.5); bumpPop(a, -0.5);
    if (Math.random() < 0.3) { if (!gs._tusksHeat) gs._tusksHeat = {}; gs._tusksHeat[a] = { target: b, amount: (gs._tusksHeat[a]?.amount || 0) + 1, expiresEp: (gs.episode || 0) + 2 }; }
    addBeat({ team: team.name, color: team.color, type: 'rivalry', players: [a, b],
      badge: 'RIVALRY', badgeClass: 'bad',
      text: draw([
        (x, y) => `The pressure cracks ${x} and ${y} wide open. "${y}, you had ONE job!" "And you had none, so shut it." They're on the same team and can't stand each other — and the whole camp is watching it fester.`,
        (x, y) => `${x} blames ${y} for dropping a piece; ${y} blames ${x} for a bad call. It gets loud. It gets personal. This one's going to follow them to tribal.`,
        (x, y) => `${x} shoves past ${y} to grab a piece first, and ${y} shoves right back. Two rivals, one team, zero trust. The elephant is honestly the less dangerous problem here.`,
        (x, y) => `"I'd rather lose than win with you," ${x} snaps at ${y} mid-scramble. Nobody laughs. The feud just got a whole lot deeper.`,
        (x, y) => `${x} and ${y} nearly come to blows over who climbs the cannon. Teammates pull them apart. Whatever happens tonight, one of them is writing the other's name down.`,
      ], a, b) });
  });

  // ── TAUNT / TRASH TALK: bold player razzes the rival team (motivates + friction) ──
  if (rival && rivalTeamMember && own.some(n => pStats(n).boldness >= 7)) add(1.8, () => {
    const talker = own.slice().sort((a, b) => pStats(b).boldness - pStats(a).boldness)[0];
    bumpPop(talker, 1); addBond(talker, rivalTeamMember, -1);
    addBeat({ team: team.name, color: team.color, type: 'taunt', players: [talker, rivalTeamMember],
      badge: 'TRASH TALK', badgeClass: 'neutral',
      text: draw([
        (t, r) => `${t} holds a ladder piece over ${pronouns(t).posAdj} head and yells across the ring: "Hey ${r}! How's that elephant treating you? We'll wave from the cannon!" ${rival.name} does not find it funny.`,
        (t, r) => `${t} does a full victory lap after a grab, blowing kisses at ${rival.name}. "${r}, sweetheart, you might want to hurry." Petty. Effective. ${rival.name} grabs faster out of pure spite.`,
        (t, r) => `"You call THAT a strategy?" ${t} heckles ${r} across the sawdust. The taunt lands — ${rival.name} redoubles, furious, and ${t} just grins.`,
        (t, r) => `${t} mimes falling asleep waiting for ${rival.name} to catch up. "${r}, wake me when you get a piece!" The whole ring hears it. ${r} does not laugh.`,
        (t, r) => `${t} plants a piece like a flag and salutes ${r}. "Save me a seat at tribal, yeah?" It's ruthless. It's working — ${rival.name} is rattled.`,
      ], talker, rivalTeamMember) });
  });

  // ── RESPECT: a bold play earns grudging respect from a low-bond teammate ──
  if (own.length >= 2 && rage >= 30) add(1.6, () => {
    const doer = own.slice().sort((a, b) => pStats(b).boldness - pStats(a).boldness)[0];
    const witness = pick(own.filter(n => n !== doer && getBond(n, doer) < 3)) || pick(own.filter(n => n !== doer));
    if (!doer || !witness) return;
    addBond(doer, witness, 1.5); bumpPop(doer, 1);
    addBeat({ team: team.name, color: team.color, type: 'respect', players: [doer, witness],
      badge: 'RESPECT', badgeClass: 'good',
      text: draw([
        (d, w) => `${d} walks up to a RAMPAGING elephant like it's nothing and comes back with a piece. ${w}, who never rated ${d}, just stares. "...Okay. That was actually kind of amazing."`,
        (d, w) => `Even ${w} — no fan of ${d} — has to admit it after that grab. "I didn't think ${d} had it in ${pronouns(d).obj}. I was wrong." Respect, earned the hard way.`,
        (d, w) => `${d} takes a hit meant for the whole team and keeps ${pronouns(d).posAdj} feet. ${w} claps, almost against ${pronouns(w).posAdj} will. Something between them thaws.`,
      ], doer, witness) });
  });

  // ── ENCOURAGEMENT: a social player rallies a struggling teammate ──
  if (social) add(1.5, () => {
    const down = own.slice().sort((a, b) => pStats(a).boldness - pStats(b).boldness)[0];
    if (!down || down === social) return;
    addBond(social, down, 1.5); bumpPop(social, 0.5); bumpPop(down, 0.5);
    addBeat({ team: team.name, color: team.color, type: 'encourage', players: [social, down],
      badge: 'RALLIED', badgeClass: 'good',
      text: draw([
        (s, d) => `${d} is ready to give up when ${s} grabs ${pronouns(d).obj} by the shoulders. "Hey. HEY. You've got this. In and out, I'll cover you." ${d} takes a breath — and goes.`,
        (s, d) => `${s} won't let ${d} spiral. "One piece. That's all. I believe in you more than you do right now." ${d} actually smiles, and steps up.`,
        (s, d) => `${s} pulls ${d} aside and drops the act. "Look at me. We lose if you freeze. I need you. Go get one." ${d} nods, jaw set.`,
        (s, d) => `${s} makes ${d} laugh right when ${pronouns(d).sub} ${pronouns(d).sub === "they" ? "need" : "needs"} it most, then points at the elephant. "Adrenaline is a gift. Use it. I will be right behind you." And ${s} is.`,
        (s, d) => `"You have been counted out your whole life, huh?" ${s} says quietly to ${d}. "Then you already know how to prove people wrong. Do it now." ${d} squares up and charges in.`,
      ], social, down) });
  });

  // ── COUNTER-SABOTAGE: free the stuck elephant back at the rivals ──
  if (counterP && rival && rage >= 30) add(1.4, () => {
    const victim = rivalTeamMember;
    rival.disruption += 2; bumpScore(counterP, 1);
    if (victim) addBond(counterP, victim, -1);
    addRage(10);
    addBeat({ team: team.name, color: team.color, type: 'counter', players: [counterP, victim].filter(Boolean),
      badge: 'COUNTER-PLAY', badgeClass: 'bad',
      text: draw([
        (n, v) => `${n} kicks the ring the elephant's tusks are stuck in — freeing it right as it turns toward ${rival.name}. ${v ? `${v} sprints for ${pronouns(v).posAdj} life.` : 'The rivals scatter.'} Turnabout.`,
        (n, v) => `Payback: ${n} yanks the elephant's tail hard and points the fury straight back at ${rival.name}. ${v ? `${v} dives into the dirt.` : 'Their line breaks again.'} "You started it."`,
        (n, v) => `${n} spots the elephant calming and re-lights the fuse, driving it into ${rival.name}'s half of the ring. ${v ? `${v} scrambles clear.` : 'Chaos, take two.'} No mercy out here.`,
      ], counterP, victim) });
  });

  // ── TEAMWORK / DISTRACTION: buys a safe grab, small bond ──
  if (own.length >= 2) add(1.6, () => {
    const a = pick(own), b = pick(own.filter(n => n !== a));
    if (!a || !b) return;
    addBond(a, b, 1); bumpScore(a, 0.5); addRage(-3);
    addBeat({ team: team.name, color: team.color, type: 'teamwork', players: [a, b],
      badge: 'TEAMWORK', badgeClass: 'good',
      text: draw([
        (x, y) => `${x} waves ${pronouns(x).posAdj} arms and hollers to pull the elephant's eyes away while ${y} sneaks in for a clean grab. Textbook.`,
        (x, y) => `${x} and ${y} work it like a bullfight — one distracts, one darts in. The camp's finding a rhythm.`,
        (x, y) => `${x} lobs a coconut to spin the elephant around; ${y} is already gone with a piece before it turns back. Slick.`,
        (x, y) => `${x} and ${y} count it down and move as one — ${x} draws the charge, ${y} slips past its flank. Two-person poetry.`,
        (x, y) => `${x} mimics a wounded animal to reel the elephant in while ${y} works fast and low. Ridiculous. Effective.`,
      ], a, b) });
  });

  // ── INJURY: the elephant clips someone; a teammate helps them up ──
  if (own.length >= 2 && rage >= 60) add(1.2, () => {
    const hurt = pick(own);
    const helper = pick(own.filter(n => n !== hurt));
    if (!hurt || !helper) return;
    if (!gs.survival) gs.survival = {};
    gs.survival[hurt] = Math.max(0, (gs.survival[hurt] == null ? 80 : gs.survival[hurt]) - 5);
    addBond(hurt, helper, 1); bumpPop(helper, 0.5);
    addBeat({ team: team.name, color: team.color, type: 'injury', players: [hurt, helper],
      badge: 'OUCH', badgeClass: 'neutral',
      text: draw([
        (h, x) => `The elephant's trunk catches ${h} across the ribs and folds ${pronouns(h).obj} into the sawdust. ${x} drags ${pronouns(h).obj} out by the ankles before it can stomp. "You're okay. You're okay. Breathe."`,
        (h, x) => `${h} takes a tusk to the thigh and goes down hard. ${x} is there instantly, hauling ${pronouns(h).obj} clear. It's going to bruise for a week — but ${h} kept the piece.`,
      ], hurt, helper) });
  });

  if (!events.length) return;
  // weighted pick of `count` DISTINCT events
  const want = Math.max(1, count || 1);
  const chosen = [];
  const pool = events.slice();
  for (let k = 0; k < want && pool.length; k++) {
    const total = pool.reduce((s, e) => s + e.w, 0);
    let roll = Math.random() * total, idx = 0;
    for (let i = 0; i < pool.length; i++) { roll -= pool[i].w; if (roll <= 0) { idx = i; break; } }
    chosen.push(pool.splice(idx, 1)[0]);
  }
  chosen.forEach(e => e.fire());
}
// ══════════════════════════════════════════════════════════════════════
// VP + TEXT are in tusks-and-ladders-vp.js
// ══════════════════════════════════════════════════════════════════════
export { rpBuildTusksTitleCard, rpBuildTusksHunt, rpBuildTusksFinish, tusksRevealNext, tusksRevealAll } from './tusks-and-ladders-vp.js';
