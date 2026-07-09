// ══════════════════════════════════════════════════════════════════════
// a-maze-ing-grip.js — "A-Maze-ing Grip" (pre-merge team challenge)
// Each team commits 2 HOLDERS who suspend their team's net on ropes, plus a
// designated DUNKER. The rest raid a corn maze for coconuts (found at
// scarecrows) and sink them into a RIVAL team's net — every coconut adds
// weight, straining that team's holders. Holders can SWAP with a willing
// teammate (mutual agreement). First net to hit the dirt loses (→ tribal);
// last net standing wins immunity.
//
//   grip     = endurance*0.5 + physical*0.4 + boldness*0.1   (holder capacity)
//   throw    = physical*0.5 + boldness*0.3 + intuition*0.2    (scoring)
//   navigate = mental*0.4 + intuition*0.4 + physical*0.2      (maze hunting)
// All proportional (stat*factor); thresholds only pick narrative tier. Uneven
// teams are equalized with sit-outs (down to the smallest team's scorer count).
// Scales to 3+ teams — scorers gang up on the strongest surviving rival net.
// ══════════════════════════════════════════════════════════════════════
import { gs, players, seasonConfig } from '../core.js';
import { pStats, pronouns, updateChalRecord, romanticCompat } from '../players.js';
import { addBond, getBond } from '../bonds.js';
import { _challengeRomanceSpark, _checkShowmanceChalMoment } from '../romance.js';

// ── tuning ──
const CAP_FACTOR   = 9;    // net capacity = combined holder grip * this
const COCO_WEIGHT  = 9;    // weight one landed coconut adds
const MAX_ROUNDS   = 16;
const DROP_AT      = 100;  // strain % that drops a net (+ noise)

function _noise(m) { return (Math.random() - 0.5) * 2 * m; }
function _pick(arr, seed) {
  if (!arr.length) return '';
  const h = [...String(seed)].reduce((a, c) => a + c.charCodeAt(0), 0);
  return arr[h % arr.length];
}
function _rp(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
// cycling no-repeat picker (reset per sim run) — walks the whole pool before repeating,
// never the same line twice in a row, so high-frequency beats stay varied.
let _usedText = {};
function _vary(arr, cat) {
  if (!arr.length) return '';
  let used = _usedText[cat] || (_usedText[cat] = []);
  let avail = arr.map((_, i) => i).filter(i => !used.includes(i));
  if (!avail.length) { used = _usedText[cat] = used.length ? [used[used.length - 1]] : []; avail = arr.map((_, i) => i).filter(i => !used.includes(i)); }
  const idx = avail[Math.floor(Math.random() * avail.length)];
  used.push(idx);
  return arr[idx];
}
function _archOf(n) { return players.find(p => p.name === n)?.archetype || ''; }
function _pron(n) { return pronouns(n); }
function _grip(n)  { const s = pStats(n); return s.endurance * 0.5 + s.physical * 0.4 + s.boldness * 0.1; }
function _throw(n) { const s = pStats(n); return s.physical * 0.5 + s.boldness * 0.3 + s.intuition * 0.2; }
function _nav(n)   { const s = pStats(n); return s.mental * 0.4 + s.intuition * 0.4 + s.physical * 0.2; }

// ── SOCIAL EVENTS between rounds (guaranteed density, real consequences) ──
// Mix of POSITIVE intra-team (spark / olive branch / encouragement), NEGATIVE
// intra-team (blame / suspicion), and INTER-TRIBE (steal / taunt / collision /
// trash talk). Schemes/steals/taunts are archetype-gated per the rules.
function _canScheme(n) {
  const a = _archOf(n), s = pStats(n);
  if (['villain', 'mastermind', 'schemer'].includes(a)) return true;
  if (['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat'].includes(a)) return false;
  return s.strategic >= 6 && s.loyalty <= 4;
}
function _socialEvent(team, allTeams, ep) {
  const own = [...new Set([...(team.holders || []), ...(team.scorers || [])])].filter(m => gs.activePlayers.includes(m));
  if (own.length < 2) return null;
  if (!gs.popularity) gs.popularity = {};
  const rivals = (allTeams || []).filter(t => t !== team && !t.dropped);
  const rivalTeam = rivals.length ? _rp(rivals) : null;
  const rivalPool = rivalTeam ? [...new Set([...(rivalTeam.holders || []), ...(rivalTeam.scorers || [])])].filter(m => gs.activePlayers.includes(m)) : [];
  const roll = Math.random();

  // ══ INTER-TRIBE (~38%, needs a live rival team) ══
  if (rivalTeam && rivalPool.length && roll < 0.38) {
    const r2 = Math.random();
    const schemers = own.filter(_canScheme);
    // STEAL / SABOTAGE — schemer archetypes only
    if (r2 < 0.30 && schemers.length) {
      const thief = _rp(schemers), victim = _rp(rivalPool);
      addBond(thief, victim, -1.1);
      gs.popularity[thief] = (gs.popularity[thief] || 0) - 0.6;
      gs.popularity[victim] = (gs.popularity[victim] || 0) + 0.4;
      return { type: 'amgSteal', players: [thief, victim], colors: [team.color, rivalTeam.color], badgeText: 'COCONUT SWIPED', badgeClass: 'steal',
        text: _pick([
          `${thief} spots ${victim} of ${rivalTeam.name} carrying a coconut and snatches it clean out of ${_pron(victim).posAdj} arms in the corn. Dirty — and effective.`,
          `${thief} ambushes ${victim} at a blind corner and makes off with ${rivalTeam.name}'s coconut. ${victim} is left grasping at air.`,
          `${thief} shadows ${victim} through the rows, waits for the fumble, and swipes the coconut with a grin. ${rivalTeam.name} is furious.`,
        ], thief + victim + 'steal'),
        consequences: `-1.1 bond ${thief}/${victim} (cross-team) · ${thief} -0.6 pop · ${victim} +0.4 pop` };
    }
    // TAUNT — a bold player heckles the rival holders
    if (r2 < 0.58) {
      const taunter = own.slice().sort((x, y) => pStats(y).boldness - pStats(x).boldness)[0];
      const target = (rivalTeam.holders || [])[0] || _rp(rivalPool);
      addBond(taunter, target, -0.7);
      if (pStats(taunter).boldness >= 6) gs.popularity[taunter] = (gs.popularity[taunter] || 0) + 0.5;
      return { type: 'amgTaunt', players: [taunter, target], colors: [team.color, rivalTeam.color], badgeText: 'TAUNT', badgeClass: 'taunt',
        text: _pick([
          `${taunter} cups ${_pron(taunter).posAdj} hands and bellows across the maze at ${target}: "Your net's already kissing the dirt — give it up!" ${rivalTeam.name}'s holders grit their teeth.`,
          `${taunter} struts past ${rivalTeam.name}'s net just to tell ${target} exactly how bad the sag looks from over here.`,
          `${taunter} keeps up a running commentary on ${target}'s shaking arms. It's obnoxious — and it's getting in ${_pron(target).posAdj} head.`,
        ], taunter + target + 'taunt'),
        consequences: `-0.7 bond ${taunter}/${target} (cross-team) · ${taunter} +0.5 pop` };
    }
    // COLLISION — two rival scorers crash in the maze
    if (r2 < 0.80) {
      const a = _rp(own), b = _rp(rivalPool);
      addBond(a, b, -0.6);
      return { type: 'amgCollision', players: [a, b], colors: [team.color, rivalTeam.color], badgeText: 'COLLISION', badgeClass: 'suspect',
        text: _pick([
          `${a} (${team.name}) and ${b} (${rivalTeam.name}) come barreling around the same blind corner and crash in a heap of elbows and coconuts. Both stagger up glaring.`,
          `${a} and ${b} hit the same dead end at a full sprint from opposite teams. The pile-up gets heated fast.`,
          `${a} and ${b} both claim the row — and the shoulder-check that follows is no accident.`,
        ], a + b + 'coll'),
        consequences: `-0.6 bond ${a}/${b} (cross-team)` };
    }
    // TRASH TALK
    const a = _rp(own), b = _rp(rivalPool);
    addBond(a, b, -0.5);
    return { type: 'amgTrash', players: [a, b], colors: [team.color, rivalTeam.color], badgeText: 'TRASH TALK', badgeClass: 'suspect',
      text: _pick([
        `${a} and ${b} trade barbs across the corn — ${team.name} versus ${rivalTeam.name}, nothing but attitude. Neither backs down.`,
        `${a} lobs an insult at ${b}; ${b} fires back twice as hard. This rivalry's got legs now.`,
        `${a} and ${b} turn the whole thing into a grudge match. The coconuts are almost an afterthought.`,
      ], a + b + 'trash'),
      consequences: `-0.5 bond ${a}/${b} (cross-team)` };
  }

  // ══ NEGATIVE intra-team (~30%) ══
  if (roll < 0.68) {
    // BLAME after a miss / penalty
    if (Math.random() < 0.5) {
      const a = _rp(own);
      const b = own.filter(m => m !== a).slice().sort((x, y) => getBond(a, x) - getBond(a, y))[0];
      if (b) {
        addBond(a, b, -0.7);
        gs.popularity[b] = (gs.popularity[b] || 0) - 0.3;
        return { type: 'amgBlame', players: [a, b], badgeText: 'BLAME', badgeClass: 'suspect',
          text: _pick([
            `A coconut sails wide and ${a} rounds on ${b}: "That's on YOU — quit rushing the throws." The row goes cold.`,
            `${a} snaps at ${b} for wandering off while the net sags. ${b} doesn't take it quietly.`,
            `${a} pins the last miss on ${b}. It might even be fair. It doesn't help the mood.`,
            `${a} and ${b} argue over who blew the easy score. Voices carry across the corn.`,
          ], a + b + 'blame'),
          consequences: `-0.7 bond ${a}→${b} · ${b} -0.3 pop` };
      }
    }
    // SUSPICION / paranoia
    const watcher = _rp(own);
    const suspect = own.filter(m => m !== watcher).slice().sort((x, y) => getBond(watcher, x) - getBond(watcher, y))[0];
    if (suspect) {
      addBond(watcher, suspect, -0.6);
      return { type: 'amgSuspect', players: [watcher, suspect], badgeText: 'SUSPICION', badgeClass: 'suspect',
        text: _pick([
          `${watcher} notices how fast ${suspect} slipped off alone. "Nobody knows this maze that well by accident. What's ${_pron(suspect).sub} really doing out there?" The seed is planted.`,
          `${suspect} keeps vanishing between the rows. ${watcher} clocks it — and starts counting how often ${_pron(suspect).sub} comes back empty-handed.`,
          `${watcher} can't shake it: ${suspect} is spending an awful lot of time in the corn for so few coconuts. Something doesn't add up.`,
        ], watcher + suspect + 'sus'),
        consequences: `-0.6 bond ${watcher}→${suspect}` };
    }
  }

  // ══ POSITIVE intra-team (~32%) ══
  // romance spark
  if (seasonConfig.romance !== 'disabled' && Math.random() < 0.4) {
    const a = _rp(own);
    const b = own.find(m => m !== a && romanticCompat(a, m));
    if (b) {
      addBond(a, b, 1.2);
      try { _challengeRomanceSpark(a, b, ep, null, null); } catch (e) {}
      return { type: 'amgSpark', players: [a, b], badgeText: 'SPARK', badgeClass: 'romance',
        text: _pick([
          `Lost between the same two rows, ${a} and ${b} keep finding excuses to double back to each other. By the time they find the coconut, neither's thinking about the challenge.`,
          `${a} and ${b} get turned around in the maze together — and don't seem in any hurry to find the way out. Something's brewing in the corn.`,
          `${b} steadies ${a} over a tangle of stalks, hand lingering a beat too long. The maze is suddenly a lot more interesting.`,
        ], a + b + 'spark'),
        consequences: `+1.2 bond ${a}/${b} · possible showmance` };
    }
  }
  // olive branch (alliance repair)
  const mender = own.slice().sort((x, y) => (pStats(y).social + pStats(y).loyalty) - (pStats(x).social + pStats(x).loyalty))[0];
  const mtarget = own.filter(m => m !== mender).slice().sort((x, y) => getBond(mender, x) - getBond(mender, y))[0];
  if (mender && mtarget && getBond(mender, mtarget) < 3 && Math.random() < 0.5) {
    addBond(mender, mtarget, 1.5);
    return { type: 'amgAlliance', players: [mender, mtarget], badgeText: 'OLIVE BRANCH', badgeClass: 'alliance',
      text: _pick([
        `Between scarecrows, ${mender} catches ${mtarget} alone and extends a hand — a fresh start, no vote between them if they lose. ${mtarget}'s been waiting for exactly this opening.`,
        `${mender} pulls ${mtarget} aside in the corn and squashes the old grudge. "Clean slate. We need each other." ${mtarget} takes the branch.`,
        `In the quiet of the maze, ${mender} and ${mtarget} finally talk it out. Whatever was broken feels a little more fixable now.`,
      ], mender + mtarget + 'olive'),
      consequences: `+1.5 bond ${mender}/${mtarget} · alliance repair flagged` };
  }
  // encouragement (default — keeps density)
  const a = _rp(own), b = own.filter(m => m !== a)[0];
  if (!b) return null;
  addBond(a, b, 0.5);
  return { type: 'amgCheer', players: [a, b], badgeText: 'HYPED UP', badgeClass: 'cheer',
    text: _pick([
      `${a} hollers across the maze that the rival net is one drop from folding — the whole team surges on the news.`,
      `${a} and ${b} sync up on a plan: flood one net, ignore the rest. It's working, and they know it.`,
      `${a} tosses ${b} a found coconut mid-sprint and yells for the dunker. Small play, real chemistry.`,
      `${a} keeps ${b}'s spirits up when the rows all start to look the same. They push on together.`,
    ], a + b + 'cheer'),
    consequences: `+0.5 bond ${a}/${b}` };
}

// ══════════════════════════════════════════════════════════════════════
export function simulateAMazeInGrip(ep) {
  const active = gs.activePlayers.filter(p => p !== gs.exileDuelPlayer);
  const tribes = (gs.tribes || []).filter(t => t.members.some(m => active.includes(m)));
  if (tribes.length < 2) return;

  const personalScores = {};
  ep.campEvents = ep.campEvents || {};
  const steps = [];
  _usedText = {};   // reset the no-repeat text picker for this run

  // ── build each team: 2 holders (grip) + dunker (throw) + scorers, equalized ──
  const rosters = tribes.map(t => ({ tribe: t, name: t.name, color: t.color,
    members: t.members.filter(m => active.includes(m)) })).filter(r => r.members.length >= 3);
  if (rosters.length < 2) return;   // need 2 holders + 1 scorer each
  const K = Math.max(1, Math.min(...rosters.map(r => r.members.length)) - 2); // scorers/team after sit-outs

  const teamData = rosters.map(r => {
    const key = r.name;
    ep.campEvents[key] = ep.campEvents[key] || { pre: [], post: [] };
    // Role picks are NOISY (noise ~1.6 on the ~10 stat scale) — the team doesn't always
    // pick the mathematically-optimal holders/dunker, and a bold volunteer can step up.
    const gripRoll = {}; r.members.forEach(m => gripRoll[m] = _grip(m) + _noise(1.6));
    const byGrip = [...r.members].sort((a, b) => gripRoll[b] - gripRoll[a]);
    const holders = byGrip.slice(0, 2);
    let rest = r.members.filter(m => !holders.includes(m));
    let sitOuts = [];
    if (rest.length > K) {
      const useRoll = {}; rest.forEach(m => useRoll[m] = _nav(m) + _throw(m) + _noise(1.8));
      const ranked = [...rest].sort((a, b) => useRoll[b] - useRoll[a]);
      sitOuts = ranked.slice(K);
      rest = ranked.slice(0, K);
    }
    const throwRoll = {}; rest.forEach(m => throwRoll[m] = _throw(m) + _noise(1.6));
    const dunker = [...rest].sort((a, b) => throwRoll[b] - throwRoll[a])[0] || null;
    const capacity = (_grip(holders[0]) + _grip(holders[1])) * CAP_FACTOR + _noise(14);
    const avgEnd = (pStats(holders[0]).endurance + pStats(holders[1]).endurance) / 2;
    holders.concat(rest).forEach(m => { personalScores[m] = 0; });
    return {
      tribe: r.tribe, name: r.name, color: r.color, members: r.members, key,
      holders: [...holders], holderStart: [...holders], dunker, scorers: [...rest], rest: [...rest], sitOuts,
      capacity, capacity0: capacity, fatigue: 0.90 + avgEnd * 0.008,
      weight: 0, coconuts: 0, strainPct: 0, dropped: false, dropOrder: 0, swaps: 0,
    };
  });

  // scarecrows (fixed maze positions) — 3–4 marked spots
  const scarecrows = [{ x: 28, y: 24 }, { x: 74, y: 52 }, { x: 44, y: 80 }, { x: 18, y: 60 }].slice(0, 3 + (Math.random() < 0.5 ? 1 : 0));
  ep._amgScarecrows = scarecrows;

  const _snap = () => teamData.map(t => ({
    name: t.name, color: t.color, coconuts: t.coconuts, strainPct: Math.round(Math.min(t.strainPct, 100)),
    dropped: t.dropped, holders: [...t.holders], dunker: t.dunker, swaps: t.swaps,
    inMaze: t.scorers.filter(s => !t.holders.includes(s)),
    sitOuts: [...t.sitOuts],
  }));
  const _mazeSnap = (featured) => {
    const runners = [];
    teamData.filter(t => !t.dropped).forEach(t => {
      const who = featured[t.name] || t.scorers.filter(s => !t.holders.includes(s))[0];
      if (!who) return;
      const near = _rp(scarecrows);
      runners.push({ name: who, color: t.color, x: Math.round(near.x + _noise(14)), y: Math.round(near.y + _noise(14)) });
    });
    return runners;
  };
  const _push = (step, featured = {}) => { step.snap = _snap(); step.maze = _mazeSnap(featured); steps.push(step); };

  // ── LINEUP step ──
  _push({ stepType: 'lineup' });

  // ── ROUNDS ──
  let dropCounter = 0;
  const _target = (team) => {
    // strongest surviving RIVAL net = most capacity headroom left (gang up on the leader)
    const rivals = teamData.filter(t => t !== team && !t.dropped);
    if (!rivals.length) return null;
    return rivals.slice().sort((a, b) => (b.capacity - b.weight) - (a.capacity - a.weight))[0];
  };

  for (let round = 1; round <= MAX_ROUNDS; round++) {
    const alive = teamData.filter(t => !t.dropped);
    if (alive.length <= 1) break;
    const featured = {};

    // each surviving team: feature a hunt + a score onto a rival net
    alive.forEach(team => {
      const pool = team.scorers.filter(s => !team.holders.includes(s));
      if (!pool.length) return;
      const hunter = pool[(round - 1) % pool.length];
      featured[team.name] = hunter;
      // HUNT
      const found = _nav(hunter) * 0.09 + Math.random() > 0.35;
      personalScores[hunter] = (personalScores[hunter] || 0) + (found ? 2 : 0.5);
      _push({ stepType: 'hunt', team: team.name, color: team.color, player: hunter, found,
        text: found
          ? _vary([
              `${hunter} reads the maze like a map and beelines to a marked scarecrow, shaking a coconut loose from its straw arms.`,
              `${hunter} threads three dead ends and pops out right at a scarecrow — coconut in hand before anyone else finds the row.`,
              `${hunter} follows the crow-marks straight to the stash and grabs a coconut clean.`,
              `${hunter} knows exactly where to turn. Scarecrow found, coconut collected, already sprinting back.`,
              `${hunter} spots the straw hat over the corn tops and cuts a diagonal nobody else thought of. One coconut, secured.`,
              `${hunter} doubles back on a hunch and there it is — a scarecrow loaded with coconuts. ${_pron(hunter).Sub} grab${_pron(hunter).sub === 'they' ? '' : 's'} one and bolt${_pron(hunter).sub === 'they' ? '' : 's'}.`,
              `${hunter} listens for the crowd, triangulates the scarecrow, and snatches a coconut without breaking stride.`,
            ], 'hunt-found')
          : _vary([
              `${hunter} takes a wrong turn, then another, and burns half the round wandering the same three rows.`,
              `${hunter} swears the scarecrow was right here. It was not. Empty-handed and annoyed.`,
              `${hunter} gets thoroughly lost in the corn and comes back with nothing but cobwebs.`,
              `${hunter} circles a dead end twice before giving up on that row entirely.`,
              `${hunter} hits a fork, guesses wrong, and ends up right back where ${_pron(hunter).sub} started. Nothing to show for it.`,
              `${hunter} chases a scarecrow silhouette that turns out to be a signpost. The corn wins this round.`,
            ], 'hunt-lost'),
        meta: found ? `Navigation good — coconut in hand` : `Lost in the maze — no coconut this trip` }, featured);

      // SCORE (only if found) — dunker may convert for the hunter
      if (found) {
        const tgt = _target(team);
        if (tgt) {
          const useDunker = team.dunker && team.dunker !== hunter && Math.random() < 0.45 && !team.holders.includes(team.dunker);
          const shooter = useDunker ? team.dunker : hunter;
          const hitChance = Math.min(0.92, Math.max(0.14, 0.32 + _throw(shooter) * 0.055 + _noise(0.19)));
          const hit = Math.random() < hitChance;
          let add = 0;
          if (hit) {
            // each landed coconut's weight varies ±22% (a heavy one strains more)
            add = COCO_WEIGHT * (1 + (K - 1) * 0.45) * (0.78 + Math.random() * 0.44);
            tgt.weight += add;
            tgt.coconuts += 1;
            personalScores[shooter] = (personalScores[shooter] || 0) + (useDunker ? 5 : 4);
            if (!gs.popularity) gs.popularity = {};
            gs.popularity[shooter] = (gs.popularity[shooter] || 0) + 0.5;
          } else {
            personalScores[shooter] = (personalScores[shooter] || 0) + 0.5;
          }
          tgt.strainPct = tgt.weight / tgt.capacity * 100;
          _push({
            stepType: 'score', team: team.name, color: team.color, targetTeam: tgt.name, targetColor: tgt.color,
            player: shooter, dunker: useDunker, hit,
            text: hit
              ? (useDunker
                  ? _vary([
                      `${shooter} takes the coconut ${hunter} couldn't land, sizes up the rival net, and calls it before it even leaves ${_pron(shooter).posAdj} hand — straight into ${tgt.name}'s net.`,
                      `The dunker earns the title: ${shooter} sinks it clean into ${tgt.name}'s net without breaking stride.`,
                      `${hunter} feeds it to ${shooter}, who drills ${tgt.name}'s net dead center. Textbook.`,
                      `${shooter} waves off the easy toss and windmills it home — ${tgt.name}'s net swallows another coconut.`,
                      `${hunter}'s hand-off, ${shooter}'s finish. ${tgt.name}'s holders sag a little lower.`,
                    ], 'score-dunk')
                  : _vary([
                      `${shooter} lines it up and sinks it into ${tgt.name}'s net. The rope groans a little lower.`,
                      `${shooter} makes it look easy — coconut in ${tgt.name}'s net, holders wincing.`,
                      `${shooter} arcs it over the lip and into ${tgt.name}'s net. Clean score.`,
                      `${shooter} calls the shot and lands it on ${tgt.name}. That net just got heavier.`,
                      `${shooter} banks it off the frame and in — ${tgt.name} takes on the weight.`,
                      `${shooter} steps up and buries it in ${tgt.name}'s net. One more toward the dirt.`,
                    ], 'score-hit'))
              : _vary([
                  `${shooter} winds up too big and sends it sailing clean over the net — it bounces off the far post and rolls back into the corn. No score.`,
                  `${shooter} clanks it off the pole. The rebound nearly takes ${_pron(shooter).obj} out. No good.`,
                  `${shooter} misjudges the distance and comes up short. The coconut thuds in the dirt.`,
                  `${shooter} rushes the throw and skies it. ${tgt.name}'s holders exhale.`,
                  `${shooter}'s throw wobbles wide and disappears back into the rows. Nothing gained.`,
                  `${shooter} double-clutches and the coconut squirts out of ${_pron(shooter).posAdj} hands. Airballed.`,
                ], 'score-miss'),
            meta: hit ? `+${Math.max(1, Math.round(add / tgt.capacity * 100))}% strain on ${tgt.name} · ${shooter} +0.5 pop`
                      : `Throw failed · no strain added` }, featured);
        }
      }
    });

    // every maze scorer earns a little each round for working the rows (not just the
    // featured one) so the offense accumulates across rounds like the holders do.
    alive.forEach(team => {
      team.scorers.filter(s => !team.holders.includes(s)).forEach(s => { personalScores[s] = (personalScores[s] || 0) + 0.9 + _throw(s) * 0.09; });
    });

    // ── FATIGUE + DROP checks ──
    const roundAlive = teamData.filter(t => !t.dropped);
    roundAlive.forEach(team => {
      // fatigue is noisy — some rounds the holders lose more grip than others (±6%),
      // so a weaker team can catch a lucky stretch and a favorite can slip.
      team.capacity *= team.fatigue * (1 + _noise(0.06));
      team.strainPct = team.weight / team.capacity * 100;
      // holders score for HOLDING — holding a heavily-loaded net is worth more than an
      // empty one, so a holder who endures near-collapse can top the chart. Kept in
      // rough parity with a strong scorer's offensive game.
      const load = Math.min(team.strainPct, 100);
      team.holders.forEach(h => { personalScores[h] = (personalScores[h] || 0) + 0.8 + pStats(h).endurance * 0.10 + load * 0.013; });
    });
    // teams past the drop line this round — but NEVER drop the last net standing (it wins).
    // If several cross together, the highest-strain nets hit the dirt; the lowest survives.
    const overLine = roundAlive.filter(t => t.strainPct >= DROP_AT + _noise(6)).sort((a, b) => b.strainPct - a.strainPct);
    const maxDrops = Math.max(0, roundAlive.length - 1);
    overLine.slice(0, maxDrops).forEach(team => {
      team.dropped = true; team.dropOrder = ++dropCounter; team.strainPct = 100;
      _push({ stepType: 'drop', team: team.name, color: team.color, order: team.dropOrder, holders: [...team.holders],
        text: _pick([
          `It's too much. ${team.name}'s holders can't hold the sag any longer — the net hits the dirt with a final coconut thud.`,
          `The rope burns through their grip and ${team.name}'s net collapses into the corn. That's the end for them.`,
          `${team.holders[0]} and ${team.holders[1]} give everything they've got, but ${team.name}'s net finally folds. Down it goes.`,
        ], team.name + 'drop'),
        meta: `${team.name} net DOWN · ${team.coconuts} coconuts too many` });
    });
    // survivors clinging near the line get a clutch beat
    roundAlive.filter(t => !t.dropped && t.strainPct >= 84).forEach(team => {
      const clutch = team.holders.slice().sort((a, b) => pStats(b).endurance - pStats(a).endurance)[0];
      if (Math.random() < 0.7) {
        personalScores[clutch] = (personalScores[clutch] || 0) + 4;
        if (!gs.popularity) gs.popularity = {};
        gs.popularity[clutch] = (gs.popularity[clutch] || 0) + 0.6;
        _push({ stepType: 'clutch', team: team.name, color: team.color, player: clutch,
          text: _pick([
            `The coconuts drag ${team.name}'s net toward the dirt — but ${clutch} plants ${_pron(clutch).posAdj} feet, knuckles white, and refuses to let it fall. It holds by an inch.`,
            `${clutch} lets out a roar and hauls the sagging net back up. ${team.name} lives another round.`,
            `Everyone braced for the drop. ${clutch} had other plans — pure grit keeps ${team.name}'s net off the ground.`,
          ], clutch + round + 'c'),
          meta: `Endurance check: ${clutch} survived · ${team.name} at ${Math.round(Math.min(team.strainPct, 99))}% strain`,
          snap: null }, {});
      }
    });

    // ── SWAP (a straining team may sub a fresh holder, mutual agreement) ──
    const straining = teamData.filter(t => !t.dropped && t.strainPct >= 70 && t.swaps < 2);
    straining.forEach(team => {
      if (Math.random() > 0.5) return;
      const bench = team.scorers.filter(s => !team.holders.includes(s));
      if (!bench.length) return;
      const tired = team.holders.slice().sort((a, b) => pStats(a).endurance - pStats(b).endurance)[0];
      const fresh = bench.slice().sort((a, b) => _grip(b) - _grip(a))[0];
      const outIdx = team.holders.indexOf(tired);
      team.holders[outIdx] = fresh;
      team.swaps += 1;
      // fresh grip relieves strain
      team.weight *= 0.82;
      team.capacity = (_grip(team.holders[0]) + _grip(team.holders[1])) * CAP_FACTOR;
      team.strainPct = team.weight / team.capacity * 100;
      addBond(tired, fresh, 0.6);
      _push({ stepType: 'swap', team: team.name, color: team.color, out: tired, in: fresh,
        text: _pick([
          `${tired}'s arms are shaking and ${_pron(tired).sub} calls for relief. The team gives the nod, and ${fresh} steps in to take the rope. Both agreed, so the swap is clean.`,
          `${fresh} taps in for a spent ${tired} — fresh grip on the rope just when ${team.name} needed it.`,
          `${tired} can't hold anymore. ${fresh} volunteers, hands ready. ${team.name}'s net steadies.`,
        ], team.name + round + 'sw'),
        meta: `${team.name} strain −18% (fresh grip) · ${fresh} now holding · ${tired} → maze · swap ${team.swaps} of 2${team.swaps >= 2 ? ' (no swaps left)' : ''}` }, featured);
    });

    // ── SOCIAL EVENT (guaranteed 1 per round, rotate teams) ──
    const evTeam = teamData[(round - 1) % teamData.length];
    const evt = _socialEvent(evTeam, teamData, ep);
    if (evt) {
      ep.campEvents[evTeam.key].post.push(evt);
      _push({ stepType: 'event', team: evTeam.name, color: evTeam.color, ...evt }, featured);
    }
  }

  // showmance moment if a showmance pair is in the challenge
  try { _checkShowmanceChalMoment(ep, null, null, personalScores, 'danger', tribes); } catch (e) {}

  // any team still up at MAX_ROUNDS: they didn't drop — assign dropOrder by strain (higher strain = closer to dropping = worse)
  const survivors = teamData.filter(t => !t.dropped);
  survivors.slice().sort((a, b) => b.strainPct - a.strainPct).forEach(t => { if (!t.dropOrder) t.dropOrder = ++dropCounter; });

  // ── RANK: highest dropOrder = survived longest = best. Winner = last net up. ──
  teamData.sort((a, b) => b.dropOrder - a.dropOrder);
  const winner = teamData[0].tribe;
  const loser = teamData[teamData.length - 1].tribe;
  const safeTribes = teamData.slice(1, -1).map(t => t.tribe);

  // team win bonus to member scores (keeps winner MVP near the top)
  teamData[0].holders.concat(teamData[0].scorers).forEach(m => { personalScores[m] = (personalScores[m] || 0) + 4; });
  // the winning team's final holders literally held the net to the end — reward that
  teamData[0].holders.forEach(h => { personalScores[h] = (personalScores[h] || 0) + 2; });

  ep.aMazeInGrip = {
    teams: teamData.map(t => ({
      name: t.name, color: t.color, holders: t.holders, holderStart: t.holderStart, dunker: t.dunker,
      scorers: t.scorers, sitOuts: t.sitOuts, coconuts: t.coconuts,
      finalStrain: t.dropped ? 100 : Math.round(Math.min(t.strainPct, 99)),
      dropped: t.dropped, dropOrder: t.dropOrder, swaps: t.swaps,
    })),
    steps,
    scarecrows,
    winner: winner.name, loser: loser.name,
  };
  ep.winner = winner;
  ep.loser = loser;
  ep.safeTribes = safeTribes;
  ep.tribalPlayers = [...loser.members];
  ep.challengeType = 'a-maze-ing-grip';
  ep.challengeLabel = 'A-Maze-ing Grip';
  ep.challengeCategory = 'endurance';
  ep.chalMemberScores = personalScores;
  ep.chalPlacements = Object.entries(personalScores).sort((a, b) => b[1] - a[1]).map(([n]) => n);
  ep.isAMazeInGrip = true;

  updateChalRecord(ep);
}

// ══════════════════════════════════════════════════════════════════════
//  VP SCREENS — reproduces mockup-a-maze-ing-grip.html: corn-maze-at-dusk,
//  sticky net-strain panel, live sidebar + maze map (with scarecrows),
//  role-lineup / hunt / score / swap / clutch / drop / social cards.
// ══════════════════════════════════════════════════════════════════════
const _amgState = {};
function _amgEnsure(key, total) { if (!_amgState[key]) _amgState[key] = { idx: -1, total }; return _amgState[key]; }

function _amgPortrait(name, cls, color) {
  const p = players.find(x => x.name === name);
  const slug = p?.slug || String(name).toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const init = String(name).slice(0, 2).toUpperCase();
  return `<span class="amg-pf ${cls || ''}" style="background:${color || '#4a3320'}"><img src="assets/avatars/${slug}.png" alt="${name}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"/><b>${init}</b></span>`;
}

function _amgScarecrowSVG(w) { const s = w || 40; return `<svg width="${s}" height="${s * 1.3}" viewBox="0 0 40 52"><g stroke="#7a4a24" stroke-width="3" stroke-linecap="round"><line x1="20" y1="14" x2="20" y2="40"/><line x1="6" y1="22" x2="34" y2="22"/></g><circle cx="20" cy="10" r="7" fill="#d6a45a"/><path d="M13 6 L20 -1 L27 6 Z" fill="#c98a2e"/><circle cx="17" cy="9" r="1.3" fill="#3a2410"/><circle cx="23" cy="9" r="1.3" fill="#3a2410"/><path d="M16 13 Q20 16 24 13" stroke="#3a2410" stroke-width="1.2" fill="none"/></svg>`; }
// the actor of a card = their avatar + a small themed corner badge (scarecrow / coconut / …)
function _amgActor(name, color, accentSvg) {
  return `<span class="amg-actor">${_amgPortrait(name, 'lg', color)}${accentSvg ? `<span class="amg-actor-badge">${accentSvg}</span>` : ''}</span>`;
}
function _amgCocoSVG() { return `<svg width="40" height="40" viewBox="0 0 40 40"><circle cx="20" cy="20" r="14" fill="none" stroke="#e8b944" stroke-width="2.5" stroke-dasharray="4 3"/><circle cx="20" cy="20" r="7" fill="#7a4a24"/></svg>`; }
function _amgMissSVG() { return `<svg width="40" height="40" viewBox="0 0 40 40"><circle cx="20" cy="20" r="14" fill="none" stroke="#7a7a86" stroke-width="2.5" stroke-dasharray="4 3"/><path d="M12 12 L28 28 M28 12 L12 28" stroke="#b9bcc6" stroke-width="2.5" stroke-linecap="round"/></svg>`; }
function _amgGripSVG() { return `<svg width="40" height="46" viewBox="0 0 40 46"><path d="M20 4 L20 34" stroke="#e0524a" stroke-width="5" stroke-linecap="round"/><path d="M20 12 L8 24 M20 12 L32 24" stroke="#e0524a" stroke-width="5" stroke-linecap="round"/><circle cx="8" cy="26" r="4" fill="#6b4423"/><circle cx="32" cy="26" r="4" fill="#6b4423"/></svg>`; }

function _strainColor(pct) {
  if (pct >= 80) return '#e0524a';
  if (pct >= 55) return '#e8b944';
  return '#6a8f4a';
}

// hanging-net SVG that sags with strain (0 = taut, 100 = on the dirt)
function _amgNetSVG(pct) {
  const sag = 12 + (pct / 100) * 46; // control-point y
  const sag2 = sag + 8;
  return `<svg viewBox="0 0 300 74" preserveAspectRatio="none">
    <line x1="14" y1="6" x2="14" y2="70" stroke="#6b4423" stroke-width="5"/>
    <line x1="286" y1="6" x2="286" y2="70" stroke="#6b4423" stroke-width="5"/>
    <path d="M14 12 Q150 ${sag} 286 12" fill="none" stroke="#d9c9a8" stroke-width="2.5"/>
    <path d="M14 12 Q150 ${sag} 286 12 L286 20 Q150 ${sag2} 14 20 Z" fill="rgba(217,201,168,.10)"/>
    <g stroke="#d9c9a8" stroke-width="1" opacity=".6">
      <path d="M50 18 Q150 ${sag} 250 18" fill="none"/>
      <path d="M14 12 L20 30 M70 24 L74 44 M150 30 L150 ${Math.min(56, sag)} M226 24 L230 44 M286 12 L280 30" fill="none"/>
    </g></svg>`;
}

// which team snapshot applies at reveal idx (walk back to the last step carrying a snap)
function _amgSnapAt(data, idx) {
  const steps = data.steps || [];
  for (let i = Math.min(idx, steps.length - 1); i >= 0; i--) {
    if (steps[i] && steps[i].snap) return steps[i].snap;
  }
  // pre-reveal baseline
  return (data.teams || []).map(t => ({ name: t.name, color: t.color, coconuts: 0, strainPct: 0, dropped: false,
    holders: t.holderStart || t.holders, dunker: t.dunker, inMaze: t.scorers || [], sitOuts: t.sitOuts || [] }));
}
function _amgMazeAt(data, idx) {
  const steps = data.steps || [];
  for (let i = Math.min(idx, steps.length - 1); i >= 0; i--) {
    if (steps[i] && steps[i].maze && steps[i].maze.length) return steps[i].maze;
  }
  return [];
}

function _amgNetPanelInner(data, idx) {
  const snap = _amgSnapAt(data, idx);
  return snap.map(t => {
    const pct = t.dropped ? 100 : t.strainPct;
    const cocoDots = Array.from({ length: Math.min(t.coconuts, 12) }, () => '<span class="amg-coco"></span>').join('');
    const holders = (t.holders || []).map((h, i) => {
      const g = _grip(h);
      const swapped = (data.teams.find(x => x.name === t.name)?.holderStart || []).includes(h) ? '' : ' <span style="font-size:8px;color:#7fbcf0">⇄ in</span>';
      return `<div class="amg-holder">${_amgPortrait(h, 'md', t.color)}
        <div class="amg-holder-info"><div class="amg-holder-name">${h}${swapped}</div>
          <div class="amg-holder-grip">GRIP ${Math.round(g)}/10 · ${t.dropped ? 'dropped' : 'holding'}</div>
          <div class="amg-grip-bar" style="width:${Math.min(100, g * 6)}%;background:${_strainColor(pct)}"></div></div></div>`;
    }).join('');
    return `<div class="amg-net-card">
      <div class="amg-net-head"><div class="amg-team-name" style="color:${t.color}">${t.name.toUpperCase()}</div>
        <div class="amg-team-tag" style="background:${t.color}22;color:${t.color}">${t.coconuts} coconut${t.coconuts === 1 ? '' : 's'} on net</div></div>
      <div class="amg-net-vis">${_amgNetSVG(pct)}<div class="amg-cocos">${cocoDots}</div></div>
      <div class="amg-strain-row"><div class="amg-strain-track"><div class="amg-strain-fill" style="width:${pct}%;background:linear-gradient(90deg,#6a8f4a,${_strainColor(pct)})"></div></div>
        <div class="amg-strain-pct" style="color:${_strainColor(pct)}">${t.dropped ? 'DOWN' : pct + '%'}</div></div>
      <div class="amg-holders">${holders}</div></div>`;
  }).join('');
}

function _amgSidebarInner(data, idx) {
  const snap = _amgSnapAt(data, idx);
  let html = '';
  snap.forEach(t => {
    const pct = t.dropped ? 100 : t.strainPct;
    let rows = (t.holders || []).map(h => `<div class="amg-side-row">${_amgPortrait(h, 'sm', t.color)} ${h} <span style="font-size:9px;color:#b79a6a">holder</span><span class="amg-side-dot" style="background:${_strainColor(pct)}"></span></div>`).join('');
    if (t.dunker && !(t.holders || []).includes(t.dunker)) rows += `<div class="amg-side-row" style="opacity:.75">${_amgPortrait(t.dunker, 'sm', t.color)} ${t.dunker} <span style="font-size:9px;color:#ff9b6b">dunker</span></div>`;
    (t.inMaze || []).filter(m => m !== t.dunker && !(t.holders || []).includes(m)).slice(0, 2).forEach(m => {
      rows += `<div class="amg-side-row" style="opacity:.7">${_amgPortrait(m, 'sm', t.color)} ${m} <span style="font-size:9px;color:#7fbcf0">in maze</span></div>`;
    });
    (t.sitOuts || []).slice(0, 1).forEach(m => { rows += `<div class="amg-side-row" style="opacity:.5">${_amgPortrait(m, 'sm', t.color)} ${m} <span style="font-size:9px;color:#9c9c9c">sitting out</span></div>`; });
    const swapsLeft = 2 - (t.swaps || 0);
    html += `<div class="amg-side-team"><div class="amg-side-team-bar" style="background:linear-gradient(90deg,${t.color}33,transparent);color:${t.color};border:1px solid ${t.color}44">
      <span>${t.name.toUpperCase()}</span><span style="font-family:'Rye'">${t.dropped ? 'net DOWN' : pct + '% strain'}</span></div>
      ${!t.dropped ? `<div style="font-size:9px;color:#9c855f;padding:0 6px 4px">🔄 ${swapsLeft} swap${swapsLeft === 1 ? '' : 's'} left</div>` : ''}${rows}</div>`;
  });
  html += `<div class="amg-legend"><span><span class="amg-side-dot" style="background:#6a8f4a"></span>fresh grip</span>
    <span><span class="amg-side-dot" style="background:#e8b944"></span>straining</span>
    <span><span class="amg-side-dot" style="background:#e0524a"></span>failing</span></div>`;
  return html;
}

function _amgMazeInner(data, idx) {
  const scares = data.scarecrows || [];
  const runners = _amgMazeAt(data, idx);
  const scareEls = scares.map(s => `<div class="amg-maze-scare" style="left:${s.x}%;top:${s.y}%">${_amgScarecrowSVG(20)}</div>`).join('');
  const runEls = runners.map(r => `<div class="amg-maze-runner" style="left:${Math.max(7, Math.min(93, r.x))}%;top:${Math.max(7, Math.min(93, r.y))}%;border-color:${r.color};color:${r.color}" title="${r.name}">${_amgPortrait(r.name, 'sm', r.color)}</div>`).join('');
  return `<svg viewBox="0 0 100 100" preserveAspectRatio="none"><g stroke="#4a6b26" stroke-width="7" fill="none" stroke-linecap="square" opacity=".8">
    <path d="M10 10 H90 V40 H30 V70 H90"/><path d="M10 40 V90 H60"/><path d="M50 10 V30"/></g></svg>${scareEls}${runEls}`;
}

function _reapplyVisibility(suffix, upToIdx, total) {
  for (let i = 0; i <= upToIdx; i++) { const el = document.getElementById(`amg-step-${suffix}-${i}`); if (el) el.classList.add('amg-visible'); }
  const counter = document.getElementById(`amg-counter-${suffix}`);
  if (counter) counter.textContent = `${Math.min(upToIdx + 1, total)} / ${total}`;
  if (upToIdx >= total - 1) { const c = document.getElementById(`amg-controls-${suffix}`); if (c) c.querySelectorAll('.amg-btn').forEach(b => b.style.opacity = '0.45'); }
}
function _amgData() { const ep = gs.episodeHistory?.[window.vpEpNum - 1]; return ep?.aMazeInGrip || null; }
function _amgLiveUpdate(idx) {
  const data = _amgData(); if (!data) return;
  const nets = document.getElementById('amg-nets-inner'); if (nets) nets.innerHTML = _amgNetPanelInner(data, idx);
  const side = document.getElementById('amg-sidebar-inner'); if (side) side.innerHTML = _amgSidebarInner(data, idx);
  const maze = document.getElementById('amg-maze-inner'); if (maze) maze.innerHTML = _amgMazeInner(data, idx);
}
export function aMazeInGripRevealNext(screenKey, total) {
  const s = _amgEnsure(screenKey, total); if (s.idx >= s.total - 1) return; s.idx++;
  const suffix = screenKey.replace('amg-', '');
  _reapplyVisibility(suffix, s.idx, s.total);
  // scroll to the just-revealed card AFTER layout settles. block:'start' + the card's
  // scroll-margin-top (set in CSS to clear the sticky net panel) keeps the card's top
  // in view even while it's still expanding (max-height animates downward).
  const idx = s.idx;
  requestAnimationFrame(() => requestAnimationFrame(() => {
    const el = document.getElementById(`amg-step-${suffix}-${idx}`);
    if (!el) return;
    // clear the sticky net panel by its ACTUAL height (varies with team count: a
    // 3-team panel is much taller than a 2-team one, so a fixed margin hid cards).
    const panel = document.querySelector('.amg-nets');
    const h = panel ? panel.getBoundingClientRect().height : 200;
    el.style.scrollMarginTop = Math.round(h + 60) + 'px';
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }));
  try { _amgLiveUpdate(s.idx); } catch (e) {}
}
export function aMazeInGripRevealAll(screenKey, total) {
  const s = _amgEnsure(screenKey, total); s.idx = s.total - 1;
  _reapplyVisibility(screenKey.replace('amg-', ''), s.idx, s.total);
  try { _amgLiveUpdate(s.idx); } catch (e) {}
}

function _amgCSS() {
  return `<style>
  @import url('https://fonts.googleapis.com/css2?family=Rye&family=Nunito:wght@400;600;700;800;900&display=swap');
  .amg-shell{--corn:#e8b944;max-width:1100px;margin:0 auto;font-family:'Nunito',system-ui,sans-serif;color:#f6ead2;position:relative;padding-bottom:24px}
  .amg-bgfx{position:fixed;inset:0;z-index:-1;pointer-events:none;background:radial-gradient(ellipse at 50% 116%,#c9662f 0%,transparent 40%),linear-gradient(180deg,#201233 0%,#35204a 34%,#6a3a3a 72%,#8a5326 100%)}
  .amg-field{position:fixed;left:0;right:0;bottom:0;height:140px;z-index:-1;pointer-events:none;opacity:.9}
  .amg-field svg{width:100%;height:100%;display:block}
  .amg-firefly{position:fixed;width:4px;height:4px;border-radius:50%;background:#ffe08a;box-shadow:0 0 8px 2px rgba(255,224,138,.8);pointer-events:none;z-index:-1;animation:amgFloat 6s ease-in-out infinite;opacity:0}
  @keyframes amgFloat{0%,100%{transform:translateY(0);opacity:0}50%{transform:translateY(-26px);opacity:.9}}
  .amg-hero{text-align:center;padding:8px 0 12px}
  .amg-eyebrow{font-size:11px;letter-spacing:4px;text-transform:uppercase;color:var(--corn);font-weight:800}
  .amg-title{font-family:'Rye',cursive;font-size:clamp(30px,5.5vw,50px);line-height:.95;letter-spacing:1px;margin-top:6px;color:#f2c94c;text-shadow:0 2px 0 #7a4a10,0 4px 0 #5a3608,0 0 32px rgba(242,201,76,.5)}
  .amg-sub{font-size:12.5px;color:#e7cfa0;margin-top:8px;max-width:680px;margin:8px auto 0}
  .amg-pf{display:inline-flex;align-items:center;justify-content:center;border-radius:50%;overflow:hidden;position:relative;flex-shrink:0;vertical-align:middle;border:2px solid rgba(0,0,0,.35);background:#4a3320}
  .amg-pf img{width:100%;height:100%;object-fit:cover;display:block}
  .amg-pf b{display:none;width:100%;height:100%;align-items:center;justify-content:center;font-family:'Rye';font-size:10px;color:#f6ead2}
  .amg-pf.sm{width:24px;height:24px}.amg-pf.sm b{font-size:9px}
  .amg-pf.md{width:34px;height:34px}
  .amg-pf.lg{width:48px;height:48px;border-width:3px}
  .amg-nets{position:sticky;top:50px;z-index:6;display:grid;gap:12px;margin:8px 0 18px;grid-template-columns:1fr 1fr}
  /* compact cards when 3+ teams share one row */
  .amg-nets.compact{gap:9px}
  .amg-nets.compact .amg-net-card{padding:9px 11px 11px}
  .amg-nets.compact .amg-net-vis{height:56px}
  .amg-nets.compact .amg-team-name{font-size:16px}
  .amg-nets.compact .amg-team-tag{font-size:9px;padding:2px 6px}
  .amg-nets.compact .amg-holder{padding:4px 6px;gap:5px}
  .amg-nets.compact .amg-pf.md{width:28px;height:28px}
  .amg-nets.compact .amg-holder-name{font-size:11px}
  @media(max-width:860px){.amg-nets{grid-template-columns:1fr !important}}
  .amg-net-card{background:linear-gradient(180deg,rgba(40,26,20,.94),rgba(28,16,12,.94));border:1px solid rgba(232,185,68,.28);border-radius:14px;padding:12px 14px 14px;backdrop-filter:blur(6px);box-shadow:0 8px 26px rgba(0,0,0,.45)}
  .amg-net-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px}
  .amg-team-name{font-family:'Rye',cursive;font-size:18px;letter-spacing:1px}
  .amg-team-tag{font-size:10px;font-weight:800;letter-spacing:1px;padding:2px 8px;border-radius:20px}
  .amg-net-vis{position:relative;height:74px;margin:4px 0 8px}.amg-net-vis svg{width:100%;height:100%;display:block}
  .amg-cocos{position:absolute;left:0;right:0;bottom:6px;display:flex;justify-content:center;gap:3px;flex-wrap:wrap;padding:0 26px}
  .amg-coco{width:13px;height:13px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#a3703f,#5a3316 70%);box-shadow:inset -2px -2px 3px rgba(0,0,0,.5)}
  .amg-strain-row{display:flex;align-items:center;gap:8px;margin-top:6px}
  .amg-strain-track{flex:1;height:9px;border-radius:6px;background:rgba(255,255,255,.08);overflow:hidden}
  .amg-strain-fill{height:100%;border-radius:6px;transition:width .6s cubic-bezier(.5,0,.3,1),background .4s}
  .amg-strain-pct{font-family:'Rye',cursive;font-size:13px;min-width:46px;text-align:right}
  .amg-holders{display:flex;gap:8px;margin-top:10px}
  .amg-holder{flex:1;display:flex;align-items:center;gap:7px;background:rgba(255,255,255,.04);border-radius:9px;padding:5px 8px;border:1px solid rgba(255,255,255,.06)}
  .amg-holder-info{min-width:0}.amg-holder-name{font-size:12px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .amg-holder-grip{font-size:9px;color:#b79a6a;letter-spacing:.5px}.amg-grip-bar{height:3px;border-radius:2px;margin-top:2px}
  .amg-body{display:grid;grid-template-columns:1fr 300px;gap:16px}
  @media(max-width:860px){.amg-body{grid-template-columns:1fr}}
  .amg-stage{display:flex;flex-direction:column}
  .amg-step{max-height:0;overflow:hidden;opacity:0;transform:translateY(14px);transition:max-height .5s ease,opacity .5s,transform .5s;scroll-margin-top:250px}
  .amg-step.amg-visible{max-height:1400px;opacity:1;transform:none;margin-bottom:11px}
  @media(prefers-reduced-motion:reduce){.amg-step{transition:max-height .2s,opacity .2s}.amg-firefly{animation:none}.amg-maze-runner{transition:none}}
  .amg-card{background:linear-gradient(180deg,rgba(46,30,20,.9),rgba(30,20,14,.9));border:1px solid rgba(232,185,68,.16);border-radius:13px;padding:12px 14px;box-shadow:0 4px 14px rgba(0,0,0,.35)}
  .amg-card-head{display:flex;align-items:center;gap:9px;margin-bottom:7px;flex-wrap:wrap}
  .amg-badge{font-size:9px;font-weight:900;letter-spacing:1px;padding:3px 9px;border-radius:5px}
  .b-role{background:rgba(232,185,68,.22);color:#f2c94c}.b-hunt{background:rgba(106,143,74,.22);color:#a6d178}
  .b-hit{background:rgba(232,185,68,.22);color:#f2c94c}.b-miss{background:rgba(120,120,130,.2);color:#b9bcc6}
  .b-swap{background:rgba(87,166,232,.2);color:#7fbcf0}.b-clutch{background:rgba(255,120,90,.2);color:#ff9b6b}
  .b-drop{background:rgba(224,82,74,.24);color:#ff8a80}
  .amg-card-body{display:flex;align-items:flex-start;gap:11px}
  .amg-card-txt{font-size:13.5px;line-height:1.55;color:#efdcb8}.amg-card-txt b{color:#f2c94c}
  .amg-card-meta{font-size:11px;color:#b79a6a;margin-top:5px}.amg-icon{flex-shrink:0}
  .amg-actor{position:relative;flex-shrink:0;display:inline-block}
  .amg-actor-badge{position:absolute;bottom:-5px;right:-6px;background:#241309;border:2px solid #3a2414;border-radius:50%;width:24px;height:24px;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 6px rgba(0,0,0,.5)}
  .amg-actor-badge svg{width:16px;height:16px}
  .amg-actor-duo{display:flex;flex-shrink:0}.amg-actor-duo .amg-pf{margin-left:-10px}.amg-actor-duo .amg-pf:first-child{margin-left:0}
  .amg-lineup{display:grid;grid-template-columns:1fr 1fr;gap:10px}
  @media(max-width:560px){.amg-lineup{grid-template-columns:1fr}}
  .amg-lineup-team{background:rgba(255,255,255,.03);border-radius:10px;padding:9px 10px}
  .amg-lineup-role{display:flex;align-items:center;gap:6px;font-size:12px;margin:4px 0}
  .amg-role-tag{font-size:8px;font-weight:900;letter-spacing:.5px;padding:1px 5px;border-radius:4px;margin-left:auto}
  .amg-social{border:1px dashed rgba(214,120,180,.5);background:linear-gradient(180deg,rgba(50,26,42,.85),rgba(30,16,26,.85))}
  .badge-romance{background:rgba(232,90,150,.22);color:#ff8ac0}.badge-alliance{background:rgba(120,200,120,.2);color:#9ae59a}
  .badge-suspect{background:rgba(232,110,90,.2);color:#ff9b7a}.badge-cheer{background:rgba(106,143,74,.22);color:#a6d178}
  .badge-taunt{background:rgba(232,150,60,.22);color:#ffb86b}.badge-steal{background:rgba(200,90,200,.2);color:#e58ae5}
  .amg-social-avas{display:flex}.amg-social-avas .amg-pf{margin-left:-8px;border:2px solid #2a1626}.amg-social-avas .amg-pf:first-child{margin-left:0}
  .amg-side{align-self:start;position:sticky;top:160px;display:flex;flex-direction:column;gap:12px}
  .amg-side-card{background:linear-gradient(180deg,rgba(36,24,18,.92),rgba(24,16,12,.92));border:1px solid rgba(232,185,68,.2);border-radius:13px;padding:12px}
  .amg-side-h{font-size:9px;letter-spacing:2px;text-transform:uppercase;color:#b79a6a;margin-bottom:9px;font-weight:800}
  .amg-side-team{margin-bottom:12px}
  .amg-side-team-bar{display:flex;align-items:center;justify-content:space-between;padding:5px 9px;border-radius:8px;font-weight:800;font-size:12px;margin-bottom:5px}
  .amg-side-row{display:flex;align-items:center;gap:7px;font-size:11.5px;padding:3px 6px}
  .amg-side-dot{width:7px;height:7px;border-radius:50%;margin-left:auto}
  .amg-legend{font-size:10px;color:#9c855f;display:flex;flex-wrap:wrap;gap:5px 10px;padding-top:8px;border-top:1px solid rgba(255,255,255,.06)}
  .amg-legend span{display:flex;align-items:center;gap:4px}
  .amg-maze{position:relative;aspect-ratio:1;border-radius:10px;overflow:hidden;border:2px solid #5a4020;background:#2e441a}
  .amg-maze svg{position:absolute;inset:0;width:100%;height:100%}
  .amg-maze-scare{position:absolute;transform:translate(-50%,-50%);z-index:2}
  .amg-maze-runner{position:absolute;width:28px;height:28px;border-radius:50%;transform:translate(-50%,-50%);z-index:3;border:2px solid currentColor;box-shadow:0 0 8px currentColor;transition:left .6s,top .6s;display:flex;align-items:center;justify-content:center;overflow:hidden;background:#241309}
  .amg-maze-runner .amg-pf{width:100%;height:100%;border:none}
  .amg-controls{display:flex;gap:10px;justify-content:center;align-items:center;padding:11px;margin-top:14px;position:sticky;bottom:10px;z-index:8;background:rgba(28,16,12,.94);border:1px solid rgba(232,185,68,.3);border-radius:13px;box-shadow:0 6px 22px rgba(0,0,0,.5);backdrop-filter:blur(8px)}
  .amg-btn{font-family:'Nunito';font-weight:800;font-size:13px;border:none;border-radius:10px;padding:10px 18px;cursor:pointer;background:linear-gradient(135deg,#e8b944,#b5822f);color:#2a1608;display:flex;align-items:center;gap:6px;box-shadow:0 3px 12px rgba(232,185,68,.35)}
  .amg-btn.ghost{background:linear-gradient(135deg,#6a7280,#4b5563);color:#fff}
  .amg-counter{font-family:'Rye',cursive;font-size:13px;color:var(--corn)}
  .amg-result-row{display:flex;align-items:center;gap:12px;padding:11px 14px;border-radius:11px;margin-bottom:8px;border-left:4px solid}
  .amg-rank{font-family:'Rye',cursive;font-size:20px;width:30px;text-align:center}
  /* cold open */
  .amg-co{padding:20px 12px 52px;text-align:center;position:relative;min-height:540px;overflow:hidden}
  .amg-co-title{font-family:'Rye',cursive;font-size:clamp(36px,7.5vw,68px);line-height:.95;color:#f2c94c;position:relative;z-index:2;
    text-shadow:0 3px 0 #7a4a10,0 6px 0 #5a3608,0 0 44px rgba(242,201,76,.5);animation:amgPulse 2.6s ease-in-out infinite}
  @keyframes amgPulse{0%,100%{filter:drop-shadow(0 0 0 transparent)}50%{filter:drop-shadow(0 0 18px rgba(242,201,76,.4))}}
  .amg-co-stage{display:flex;align-items:center;justify-content:center;gap:min(4vw,36px);margin-top:26px;position:relative;z-index:2;flex-wrap:nowrap}
  @media(max-width:640px){.amg-co-stage{gap:10px}}
  .amg-co-team{display:flex;flex-direction:column;align-items:center;gap:8px;flex:0 1 auto;animation:amgTeamIn .6s cubic-bezier(.22,1,.36,1) both}
  .amg-co-team.t0{animation-delay:.1s}.amg-co-team.t1{animation-delay:.28s}.amg-co-team.t2{animation-delay:.46s}
  @keyframes amgTeamIn{from{opacity:0;transform:translateY(22px)}to{opacity:1;transform:none}}
  .amg-co-team-name{font-family:'Rye',cursive;font-size:clamp(15px,3vw,22px);letter-spacing:1px}
  .amg-co-net-mini{width:clamp(120px,24vw,210px);height:52px;filter:drop-shadow(0 4px 10px rgba(0,0,0,.5))}
  .amg-co-net-mini svg{width:100%;height:100%;display:block}
  .amg-co-roster{display:flex;flex-wrap:wrap;justify-content:center;gap:5px;max-width:clamp(150px,26vw,230px)}
  .amg-co-av{display:inline-block;animation:amgBob 2.6s ease-in-out infinite}
  @keyframes amgBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
  .amg-co-av .amg-pf{box-shadow:0 3px 8px rgba(0,0,0,.5)}
  .amg-co-center{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;flex:0 0 auto}
  .amg-co-scarecrow{width:clamp(78px,15vw,124px);transform-origin:50% 92%;animation:amgSway 4.2s ease-in-out infinite;filter:drop-shadow(0 6px 14px rgba(0,0,0,.5))}
  .amg-co-scarecrow svg{width:100%;height:auto;display:block;overflow:visible}
  @keyframes amgSway{0%,100%{transform:rotate(-2.6deg)}50%{transform:rotate(2.6deg)}}
  .amg-co-vs{font-family:'Rye',cursive;font-size:clamp(20px,4vw,32px);color:#e8b944;text-shadow:0 0 20px rgba(232,185,68,.6);animation:amgVs 1.7s ease-in-out infinite}
  @keyframes amgVs{0%,100%{transform:scale(1);opacity:.9}50%{transform:scale(1.14);opacity:1}}
  .amg-co-cta{margin-top:30px;font-size:13px;color:#e7cfa0;font-weight:700;position:relative;z-index:2;animation:amgCta 2.2s ease-in-out infinite}
  @keyframes amgCta{0%,100%{opacity:.7}50%{opacity:1}}
  @media(prefers-reduced-motion:reduce){.amg-co-title,.amg-co-scarecrow,.amg-co-av,.amg-co-vs,.amg-co-team,.amg-co-cta{animation:none}}
  </style>`;
}

function _amgField() {
  return `<div class="amg-bgfx"></div>
  <div class="amg-field"><svg viewBox="0 0 400 150" preserveAspectRatio="none"><defs>
    <pattern id="amgCornBack" width="26" height="150" patternUnits="userSpaceOnUse"><g fill="#243d14">
      <rect x="12" y="40" width="2.4" height="110"/><path d="M13 60 Q2 54 -3 64 Q6 62 13 70 Z"/><path d="M13 60 Q24 54 29 64 Q20 62 13 70 Z"/>
      <path d="M13 78 Q1 74 -4 86 Q7 82 13 88 Z"/><path d="M13 78 Q25 74 30 86 Q19 82 13 88 Z"/><path d="M13 40 Q9 30 13 24 Q17 30 13 40 Z"/></g></pattern>
    <pattern id="amgCornFront" width="34" height="150" patternUnits="userSpaceOnUse"><g fill="#152a09">
      <rect x="16" y="20" width="3.2" height="130"/><path d="M17 46 Q2 38 -4 52 Q8 48 17 58 Z"/><path d="M17 46 Q32 38 38 52 Q26 48 17 58 Z"/>
      <path d="M17 70 Q1 62 -5 78 Q9 72 17 82 Z"/><path d="M17 70 Q33 62 39 78 Q25 72 17 82 Z"/><path d="M17 96 Q3 90 -3 104 Q10 98 17 106 Z"/>
      <path d="M17 96 Q31 90 37 104 Q24 98 17 106 Z"/><path d="M17 20 Q11 8 17 0 Q23 8 17 20 Z"/><ellipse cx="17" cy="6" rx="4" ry="8" fill="#3a5320"/></g></pattern>
    </defs><rect width="400" height="150" fill="url(#amgCornBack)" opacity=".75"/><rect width="400" height="150" fill="url(#amgCornFront)"/></svg></div>
  <div class="amg-firefly" style="left:12%;top:30%;animation-delay:0s"></div><div class="amg-firefly" style="left:78%;top:22%;animation-delay:1.4s"></div>
  <div class="amg-firefly" style="left:46%;top:44%;animation-delay:2.8s"></div><div class="amg-firefly" style="left:88%;top:52%;animation-delay:3.6s"></div>`;
}

function _shell(content, ep, data) {
  return `${_amgCSS()}<div class="amg-shell">${_amgField()}
    <div class="amg-hero"><div class="amg-eyebrow">Carnival of Chaos · Immunity Challenge</div>
      <div class="amg-title">A-Maze-ing Grip</div>
      <div class="amg-sub">Two hold the net. The rest raid the maze and sink coconuts into a rival's net until their grip gives out. Last net standing takes immunity.</div></div>
    <div class="amg-nets${(data.teams || []).length >= 3 ? ' compact' : ''}" style="grid-template-columns:repeat(${Math.min((data.teams || []).length || 2, 3)},1fr)" id="amg-nets-inner">${_amgNetPanelInner(data, -1)}</div>
    ${content}</div>`;
}

// big, detailed, sway-animated scarecrow for the cold open
function _amgBigScarecrow() {
  return `<svg viewBox="0 0 120 152" aria-hidden="true">
    <rect x="56" y="54" width="8" height="94" rx="2" fill="#6b4423"/>
    <rect x="14" y="73" width="92" height="7" rx="3" fill="#5a3a1e"/>
    <path d="M30 78 L90 78 L84 122 L36 122 Z" fill="#a8452e"/>
    <g stroke="#7a2e1c" stroke-width="2" opacity=".55"><line x1="45" y1="78" x2="42" y2="122"/><line x1="60" y1="78" x2="60" y2="122"/><line x1="75" y1="78" x2="78" y2="122"/><line x1="32" y1="92" x2="88" y2="92"/><line x1="34" y1="106" x2="86" y2="106"/></g>
    <g stroke="#e0b44a" stroke-width="2.6" stroke-linecap="round"><line x1="16" y1="76" x2="4" y2="68"/><line x1="16" y1="76" x2="5" y2="80"/><line x1="16" y1="76" x2="3" y2="74"/><line x1="104" y1="76" x2="116" y2="68"/><line x1="104" y1="76" x2="115" y2="80"/><line x1="104" y1="76" x2="117" y2="74"/></g>
    <g stroke="#e0b44a" stroke-width="2" stroke-linecap="round" opacity=".9"><line x1="52" y1="78" x2="48" y2="69"/><line x1="60" y1="78" x2="60" y2="68"/><line x1="68" y1="78" x2="72" y2="69"/></g>
    <circle cx="60" cy="43" r="20" fill="#d6a45a"/><circle cx="60" cy="43" r="20" fill="none" stroke="#b5843a" stroke-width="1.5"/>
    <g stroke="#3a2410" stroke-width="2" stroke-linecap="round"><line x1="49" y1="39" x2="55" y2="45"/><line x1="55" y1="39" x2="49" y2="45"/><line x1="65" y1="39" x2="71" y2="45"/><line x1="71" y1="39" x2="65" y2="45"/></g>
    <path d="M50 53 Q60 59 70 53" fill="none" stroke="#3a2410" stroke-width="2" stroke-linecap="round"/>
    <g stroke="#3a2410" stroke-width="1.2"><line x1="52" y1="54" x2="52" y2="58"/><line x1="56" y1="55" x2="56" y2="59"/><line x1="60" y1="56" x2="60" y2="60"/><line x1="64" y1="55" x2="64" y2="59"/><line x1="68" y1="54" x2="68" y2="58"/></g>
    <ellipse cx="60" cy="26" rx="27" ry="6" fill="#7a4a24"/><path d="M44 26 Q46 5 60 3 Q74 5 76 26 Z" fill="#8a5628"/><rect x="44" y="23" width="32" height="5" rx="2" fill="#5a3418"/>
    <g stroke="#e0b44a" stroke-width="2" stroke-linecap="round"><line x1="44" y1="27" x2="37" y2="23"/><line x1="76" y1="27" x2="83" y2="23"/></g>
  </svg>`;
}

// ── SCREEN 1: cold open (animated corn-maze face-off) ──
export function rpBuildAMGTitleCard(ep) {
  const data = ep.aMazeInGrip; if (!data) return '';
  const teams = data.teams || [];
  const _teamBlock = (t, i) => {
    const roster = [...new Set([...(t.holderStart || []), ...(t.scorers || []), ...(t.sitOuts || [])])];
    const avs = roster.map((m, j) => `<span class="amg-co-av" style="animation-delay:${(j * 0.16).toFixed(2)}s">${_amgPortrait(m, 'md', t.color)}</span>`).join('');
    return `<div class="amg-co-team t${i}">
      <div class="amg-co-team-name" style="color:${t.color}">${t.name.toUpperCase()}</div>
      <div class="amg-co-net-mini">${_amgNetSVG(16)}</div>
      <div class="amg-co-roster">${avs}</div></div>`;
  };
  const center = `<div class="amg-co-center"><div class="amg-co-scarecrow">${_amgBigScarecrow()}</div><div class="amg-co-vs">VS</div></div>`;
  let stage;
  if (teams.length === 2) {
    stage = `${_teamBlock(teams[0], 0)}${center}${_teamBlock(teams[1], 1)}`;
  } else {
    // 3+ teams: scarecrow presides at the top, teams line up below
    stage = `<div style="display:flex;flex-direction:column;align-items:center;gap:16px;width:100%">
      <div class="amg-co-center">${`<div class="amg-co-scarecrow">${_amgBigScarecrow()}</div>`}</div>
      <div style="display:flex;justify-content:center;gap:min(3vw,24px);flex-wrap:wrap">${teams.map((t, i) => _teamBlock(t, Math.min(i, 2))).join('')}</div></div>`;
  }
  return `${_amgCSS()}<div class="amg-shell amg-co">${_amgField()}
    <div class="amg-eyebrow" style="position:relative;z-index:2">Carnival of Chaos · Immunity Challenge</div>
    <div class="amg-co-title">A-Maze-ing Grip</div>
    <div class="amg-sub" style="max-width:640px;position:relative;z-index:2">Derek and Trevor gather the teams at the corn maze. Two hold the net; the rest raid the rows for coconuts and sink them into a rival's net. Hold on longest and you're safe — drop first, and it's off to tribal.</div>
    <div class="amg-co-stage">${stage}</div>
    <div class="amg-co-cta">🌽 Ropes up. Into the corn.</div></div>`;
}

// ── SCREEN 2: the challenge (main reveal) ──
export function rpBuildAMGRace(ep) {
  const data = ep.aMazeInGrip; if (!data) return '';
  const steps = data.steps || [];
  const suffix = 'race';
  const cards = steps.map((s, i) => {
    let inner = '';
    if (s.stepType === 'lineup') {
      const teamCols = (data.teams || []).map(t => {
        const rows = [];
        (t.holderStart || t.holders).forEach(h => rows.push(`<div class="amg-lineup-role">${_amgPortrait(h, 'sm', t.color)} ${h} <span class="amg-role-tag" style="background:rgba(232,185,68,.25);color:#f2c94c">HOLDER · grip ${Math.round(_grip(h))}/10</span></div>`));
        if (t.dunker) rows.push(`<div class="amg-lineup-role">${_amgPortrait(t.dunker, 'sm', t.color)} ${t.dunker} <span class="amg-role-tag" style="background:rgba(232,90,90,.2);color:#ff8a80">DUNKER · throw ${Math.round(_throw(t.dunker))}/10</span></div>`);
        (t.sitOuts || []).forEach(so => rows.push(`<div class="amg-lineup-role" style="opacity:.6">${_amgPortrait(so, 'sm', t.color)} ${so} <span class="amg-role-tag" style="background:rgba(150,150,160,.2);color:#c9ccd6">SITTING OUT</span></div>`));
        return `<div class="amg-lineup-team"><div style="font-family:'Rye';color:${t.color};font-size:14px;margin-bottom:4px">${t.name.toUpperCase()}</div>${rows.join('')}</div>`;
      }).join('');
      inner = `<div class="amg-card"><div class="amg-card-head"><span class="amg-badge b-role">🪢 THE LINEUP</span><span style="font-size:11px;color:#b79a6a">Each team locks in 2 holders + a designated dunker</span></div>
        <div class="amg-lineup">${teamCols}</div>
        <div class="amg-card-meta" style="margin-top:8px"><b style="color:#e8b944">Grip</b> (endurance + physical + a little boldness, out of 10) = how much coconut-weight a holder can bear before the net drops. <b style="color:#ff8a80">Throw</b> (out of 10) = how reliably a dunker sinks it. Holders <b>tire every round</b> — endurance slows the fade, and each team may <b>swap in a fresh holder up to twice</b>. Uneven teams equalized — the bigger team sits out its weakest hunters down to matching scorer counts.</div></div>`;
    } else if (s.stepType === 'hunt') {
      inner = `<div class="amg-card"><div class="amg-card-head"><span class="amg-badge b-hunt">🌽 ${s.found ? 'SCARECROW FOUND' : 'LOST IN THE CORN'}</span><span style="font-size:11px;color:#b79a6a">${s.player} · ${s.team} · the maze</span></div>
        <div class="amg-card-body">${_amgActor(s.player, s.color, _amgScarecrowSVG(16))}<div><div class="amg-card-txt">${s.text}</div><div class="amg-card-meta">${s.meta || ''}</div></div></div></div>`;
    } else if (s.stepType === 'score') {
      const badge = s.hit ? `<span class="amg-badge b-hit">🥥 SCORED</span>` : `<span class="amg-badge b-miss">✗ OVERSHOT</span>`;
      const dir = `${s.player} · ${s.team} → ${s.targetTeam}'s net${s.dunker ? ' · dunker' : ''}`;
      inner = `<div class="amg-card"><div class="amg-card-head">${badge}<span style="font-size:11px;color:#b79a6a">${dir}</span></div>
        <div class="amg-card-body">${_amgActor(s.player, s.color, s.hit ? _amgCocoSVG() : _amgMissSVG())}<div><div class="amg-card-txt">${s.text}</div><div class="amg-card-meta">${s.meta || ''}</div></div></div></div>`;
    } else if (s.stepType === 'swap') {
      inner = `<div class="amg-card"><div class="amg-card-head"><span class="amg-badge b-swap">⇄ HOLDER SWAP</span><span style="font-size:11px;color:#b79a6a">${s.out} → ${s.in} · ${s.team}</span></div>
        <div class="amg-card-body"><div class="amg-actor-duo">${_amgPortrait(s.out, 'lg', s.color)}${_amgPortrait(s.in, 'lg', s.color)}</div><div><div class="amg-card-txt">${s.text}</div><div class="amg-card-meta">${s.meta || ''}</div></div></div></div>`;
    } else if (s.stepType === 'clutch') {
      inner = `<div class="amg-card"><div class="amg-card-head"><span class="amg-badge b-clutch">💪 PULLED THROUGH</span><span style="font-size:11px;color:#b79a6a">${s.player} · ${s.team}</span></div>
        <div class="amg-card-body">${_amgActor(s.player, s.color, _amgGripSVG())}<div><div class="amg-card-txt">${s.text}</div><div class="amg-card-meta">${s.meta || ''}</div></div></div></div>`;
    } else if (s.stepType === 'drop') {
      const duo = (s.holders || []).slice(0, 2).map(h => _amgPortrait(h, 'lg', s.color)).join('');
      inner = `<div class="amg-card" style="border-color:${s.color}66"><div class="amg-card-head"><span class="amg-badge b-drop">🪂 NET DOWN</span><span style="font-size:11px;color:#b79a6a">${s.team}</span></div>
        <div class="amg-card-body"><div class="amg-actor-duo">${duo || `<span class="amg-icon">${_amgGripSVG()}</span>`}</div><div><div class="amg-card-txt">${s.text}</div><div class="amg-card-meta">${s.meta || ''}</div></div></div></div>`;
    } else { // event
      const avas = (s.players || []).slice(0, 2).map((p, ai) => _amgPortrait(p, 'md', (s.colors && s.colors[ai]) || s.color)).join('');
      const scope = s.colors ? 'cross-team' : `${s.team} · the maze`;
      inner = `<div class="amg-card amg-social"><div class="amg-card-head"><span class="amg-badge badge-${s.badgeClass || 'cheer'}">${s.badgeText || 'MOMENT'}</span><span style="font-size:11px;color:#b79a6a">${scope}</span></div>
        <div class="amg-card-body"><div class="amg-social-avas">${avas}</div><div><div class="amg-card-txt">${s.text || ''}</div><div class="amg-card-meta">${s.consequences || ''}</div></div></div></div>`;
    }
    return `<div class="amg-step" id="amg-step-${suffix}-${i}">${inner}</div>`;
  }).join('');

  return _shell(`<div class="amg-body">
    <div><div class="amg-stage">${cards}</div>
      <div class="amg-scroll-spacer" style="height:50vh;pointer-events:none"></div>
      <div class="amg-controls" id="amg-controls-${suffix}">
        <button class="amg-btn" onclick="aMazeInGripRevealNext('amg-${suffix}',${steps.length})">🌽 Next Beat</button>
        <span class="amg-counter" id="amg-counter-${suffix}">0 / ${steps.length}</span>
        <button class="amg-btn ghost" onclick="aMazeInGripRevealAll('amg-${suffix}',${steps.length})">Skip to result</button>
      </div></div>
    <div class="amg-side">
      <div class="amg-side-card"><div class="amg-side-h">🪢 Net Status — live</div><div id="amg-sidebar-inner">${_amgSidebarInner(data, -1)}</div></div>
      <div class="amg-side-card"><div class="amg-side-h">🌽 The Maze</div><div class="amg-maze" id="amg-maze-inner">${_amgMazeInner(data, -1)}</div>
        <div style="font-size:10px;color:#9c855f;margin-top:7px">Runners hunt scarecrows for coconuts, then race back to sink them. Positions move each reveal.</div></div>
    </div></div>`, ep, data);
}

// ── SCREEN 3: results ──
export function rpBuildAMGResults(ep) {
  const data = ep.aMazeInGrip; if (!data) return '';
  const ranked = (data.teams || []).slice().sort((a, b) => b.dropOrder - a.dropOrder);
  const rows = ranked.map((t, i) => {
    const isWin = t.name === data.winner, isLose = t.name === data.loser;
    const tag = isWin ? 'WINS IMMUNITY' : isLose ? 'GOES TO TRIBAL' : 'SAFE';
    const tagCol = isWin ? '#9ae59a' : isLose ? '#ff6a5a' : '#c9b48f';
    const note = t.dropped ? `Net hit the dirt · ${t.coconuts} coconuts sunk into it${t.swaps ? ` · ${t.swaps} swap${t.swaps > 1 ? 's' : ''}` : ''}` : `Net held to the end · ${t.finalStrain}% final strain`;
    return `<div class="amg-result-row" style="border-color:${t.color};background:${t.color}14">
      <span class="amg-rank" style="color:${t.color}">${i + 1}</span>
      <div style="flex:1"><div style="font-weight:800;color:${t.color}">${t.name.toUpperCase()}</div><div style="font-size:11px;color:#b79a6a">${note}</div></div>
      <span style="font-weight:800;font-size:11px;color:${tagCol}">${tag}</span></div>`;
  }).join('');
  return _shell(`<div class="amg-body"><div><div class="amg-side-card">
      <div style="font-family:'Rye';color:var(--corn);font-size:16px;margin-bottom:10px">🏆 LAST NET STANDING</div>${rows}
      <div style="font-size:12px;color:#b79a6a;margin-top:8px;line-height:1.5">Last team with its net off the dirt takes immunity. First to drop heads to tribal council.</div></div></div>
    <div class="amg-side"><div class="amg-side-card"><div class="amg-side-h">🪢 Final Net Status</div><div id="amg-sidebar-inner">${_amgSidebarInner(data, (data.steps || []).length - 1)}</div></div></div></div>`, ep, data);
}
