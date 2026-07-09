// ══════════════════════════════════════════════════════════════════════
// poles-apart.js — "Poles Apart" (pre-merge beach team challenge)
// Best of 3 rounds. Each round both teams plant HOLDERS gripping poles in the
// sand; everyone else are PULLERS who swarm the ENEMY holders and drag them
// across the center line. Down all of a team's holders and they're out of the
// round — last team standing wins it. First to 2 rounds takes immunity.
//
//   HOLD (resisting) = endurance*0.4 + physical*0.4 + (10 - temperament)*0.2
//     → scrappy hot-heads (low temperament) grip harder and fight pullers off
//   PULL (dragging)  = physical*0.5 + boldness*0.3 + social*0.2 (teamwork)
//
// Depth beyond raw stats: pullers can GANG UP (2+ on one holder → coordination
// bonus, shown on the map), smart teams TARGET-SWITCH to the weakest holder,
// and a benched/downed teammate can RALLY a holder for a second wind. Comedic
// resist moves (kick/bite/tickle). noise(2.5)+ everywhere → upsets happen.
// Bigger team sits one out each round. Scales to 3+ teams (battle royale).
// ══════════════════════════════════════════════════════════════════════
import { gs, players, seasonConfig } from '../core.js';
import { pStats, pronouns, updateChalRecord, romanticCompat } from '../players.js';
import { addBond, getBond } from '../bonds.js';
import { _challengeRomanceSpark, _checkShowmanceChalMoment } from '../romance.js';

// ── helpers ──
function _noise(m) { return (Math.random() - 0.5) * 2 * m; }
function _archOf(n) { return players.find(p => p.name === n)?.archetype || ''; }
function _pron(n) { return pronouns(n); }
function _rp(arr) { return arr.length ? arr[Math.floor(Math.random() * arr.length)] : ''; }
function _hold(n) { const s = pStats(n); return s.endurance * 0.4 + s.physical * 0.4 + (10 - s.temperament) * 0.2; }
function _pull(n) { const s = pStats(n); return s.physical * 0.5 + s.boldness * 0.3 + s.social * 0.2; }
// cycling no-repeat text picker (reset per sim run)
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
function _canScheme(n) {
  const a = _archOf(n), s = pStats(n);
  if (['villain', 'mastermind', 'schemer'].includes(a)) return true;
  if (['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat'].includes(a)) return false;
  return s.strategic >= 6 && s.loyalty <= 4;
}
// "Emmah" / "Emmah and MK" / "Emmah, MK and Chase"
function _names(arr) {
  if (!arr || !arr.length) return '';
  if (arr.length === 1) return arr[0];
  if (arr.length === 2) return `${arr[0]} and ${arr[1]}`;
  return `${arr.slice(0, -1).join(', ')} and ${arr[arr.length - 1]}`;
}

// ── SOCIAL EVENTS between rounds (guaranteed density, real consequences) ──
function _socialEvent(team, allTeams, ep) {
  const own = [...new Set([...(team.roster || [])])].filter(m => gs.activePlayers.includes(m));
  if (own.length < 2) return null;
  if (!gs.popularity) gs.popularity = {};
  const roll = Math.random();

  // THROW-THE-CHALLENGE (schemer fakes weakness) — straight from the transcript
  const schemers = own.filter(_canScheme);
  if (schemers.length && roll < 0.22) {
    const a = _rp(schemers);
    const b = own.slice().sort((x, y) => pStats(y).intuition - pStats(x).intuition).find(m => m !== a) || own.find(m => m !== a);
    addBond(a, b, -0.5);
    gs.popularity[a] = (gs.popularity[a] || 0) - 0.5;
    return { type: 'paThrow', players: [a, b], badgeText: 'THROWING IT', badgeClass: 'suspect',
      text: _vary([
        `${a} fakes getting overpowered and flops early — but ${b} sees right through the act. "You're not fooling anyone."`,
        `${a} goes limp the second a puller touches ${_pron(a).obj}, throwing the round on purpose. ${b} clocks the con instantly.`,
        `${a} "loses" grip suspiciously fast. ${b} narrows ${_pron(b).posAdj} eyes — that was on purpose, and now it's noted.`,
      ], 'throw'),
      consequences: `-0.5 bond ${a}/${b} · ${a} -0.5 pop · team loses ground` };
  }
  // ROMANCE spark
  if (seasonConfig.romance !== 'disabled' && roll < 0.42) {
    const a = _rp(own), b = own.find(m => m !== a && romanticCompat(a, m));
    if (b) {
      addBond(a, b, 1.2);
      try { _challengeRomanceSpark(a, b, ep, null, null); } catch (e) {}
      return { type: 'paSpark', players: [a, b], badgeText: 'SPARK', badgeClass: 'romance',
        text: _vary([
          `${a} pries a puller off ${b} and the two of them collapse in the sand laughing. Something clicks that has nothing to do with the challenge.`,
          `${b} grabs ${a}'s arm just as ${_pron(a).sub} ${_pron(a).sub === 'they' ? 'lose' : 'loses'} ${_pron(a).posAdj} footing — and doesn't quite let go once ${_pron(a).sub}${_pron(a).sub === 'they' ? "'re" : "'s"} steady again. Neither of them mentions it.`,
          `${a} and ${b} keep ending up back to back defending the same pole. Neither minds the excuse to stay close.`,
        ], 'spark'),
        consequences: `+1.2 bond ${a}/${b} · possible showmance` };
    }
  }
  // SUSPICION / BLAME (negative)
  if (roll < 0.68) {
    const a = _rp(own);
    const b = own.filter(m => m !== a).slice().sort((x, y) => getBond(a, x) - getBond(a, y))[0];
    if (b) {
      addBond(a, b, -0.6);
      return { type: 'paBlame', players: [a, b], badgeText: 'BLAME', badgeClass: 'suspect',
        text: _vary([
          `${a} rounds on ${b} for letting go too easy: "You barely fought!" ${b} fires back. The sand gets tense.`,
          `${a} blames ${b} for the lost round — should've helped on the double-team. ${b} doesn't take it lying down.`,
          `${a} noticed ${b} standing around while the poles fell. ${a} says so, loudly. It sticks.`,
        ], 'blame'),
        consequences: `-0.6 bond ${a}/${b}` };
    }
  }
  // OLIVE BRANCH (alliance repair)
  const mender = own.slice().sort((x, y) => (pStats(y).social + pStats(y).loyalty) - (pStats(x).social + pStats(x).loyalty))[0];
  const mtarget = own.filter(m => m !== mender).slice().sort((x, y) => getBond(mender, x) - getBond(mender, y))[0];
  if (mender && mtarget && getBond(mender, mtarget) < 3 && Math.random() < 0.5) {
    addBond(mender, mtarget, 1.5);
    return { type: 'paAlliance', players: [mender, mtarget], badgeText: 'OLIVE BRANCH', badgeClass: 'alliance',
      text: _vary([
        `Catching their breath between rounds, ${mender} pulls ${mtarget} aside and squashes the old grudge. "Clean slate — we need each other out here."`,
        `${mender} and ${mtarget} finally talk it out in the shade. Whatever was broken feels a little more fixable now.`,
        `${mender} offers ${mtarget} a way back in, loyalty for loyalty. They shake on it where nobody's watching.`,
      ], 'olive'),
      consequences: `+1.5 bond ${mender}/${mtarget} · alliance repair flagged` };
  }
  // ENCOURAGEMENT (default, keeps density)
  const a = _rp(own), b = own.filter(m => m !== a)[0];
  if (!b) return null;
  addBond(a, b, 0.5);
  return { type: 'paCheer', players: [a, b], badgeText: 'HYPED UP', badgeClass: 'cheer',
    text: _vary([
      `${a} rallies the team on the sand — "one more round, all of us on the weak pole!" ${b} is the first to buy in.`,
      `${a} and ${b} sync up a plan: gang the smallest holder, ignore the rest. It's smart, and it fires the team up.`,
      `${a} hypes ${b} through the exhaustion between rounds. Small moment, real one.`,
    ], 'cheer'),
    consequences: `+0.5 bond ${a}/${b}` };
}

// ══════════════════════════════════════════════════════════════════════
export function simulatePolesApart(ep) {
  const active = gs.activePlayers.filter(p => p !== gs.exileDuelPlayer);
  const tribes = (gs.tribes || []).filter(t => t.members.some(m => active.includes(m)));
  if (tribes.length < 2) return;

  const personalScores = {};
  ep.campEvents = ep.campEvents || {};
  _usedText = {};
  const steps = [];

  const rosters = tribes.map(t => ({ tribe: t, name: t.name, color: t.color,
    members: t.members.filter(m => active.includes(m)) })).filter(r => r.members.length >= 3);
  if (rosters.length < 2) return;
  const minSize = Math.min(...rosters.map(r => r.members.length));
  const HOLDERS_PER = Math.max(1, Math.min(3, minSize - 1)); // 3 holders, or fewer if tiny team

  const teamData = rosters.map((r, ti) => {
    ep.campEvents[r.name] = ep.campEvents[r.name] || { pre: [], post: [] };
    r.members.forEach(m => { personalScores[m] = 0; });
    return { tribe: r.tribe, name: r.name, color: r.color, members: r.members, ti,
      roundWins: 0, downsDealt: 0, holdersLost: 0, sitRot: 0, roster: r.members };
  });

  const _push = (step, bf) => { if (bf) step.bf = bf; steps.push(step); };

  // ── LINEUP-less intro handled per-round; first a title-ready snapshot ──
  const _bfSnap = (round, teamsState) => ({
    round,
    teams: teamsState.map(ts => ({ name: ts.name, color: ts.color,
      holders: ts.holders.map(h => ({ player: h.player, slip: Math.round(Math.min(h.slip, 100)), downed: h.downed, attackers: [...h.attackers] })),
      pullers: ts.pullers.map(p => p),
      sitOuts: [...ts.sitOuts], holdersLeft: ts.holders.filter(h => !h.downed).length })),
    pullerActions: teamsState.flatMap(ts => (ts._pullerActions || [])),
  });

  let roundNum = 0;
  const roundResults = [];
  const heldCount = {};   // how many rounds each player has held — drives role ROTATION
  const majority = tribes.length === 2 ? 2 : Math.ceil(3 / 1); // 2-team: first to 2; else play 3

  while (roundNum < 3) {
    roundNum++;
    // stop early if someone clinched (2-team best of 3)
    if (tribes.length === 2 && teamData.some(t => t.roundWins >= 2)) break;

    // ── set up the round: equalize sit-outs, assign holders/pullers ──
    const state = teamData.map(t => {
      const order = [...t.roster];
      // rotate who sits out across rounds for the bigger teams
      const nSit = t.roster.length - minSize;
      let sitOuts = [];
      let playing = order;
      if (nSit > 0) {
        // sit out the least useful (low hold+pull), rotating the start point
        const ranked = [...order].sort((a, b) => (_hold(b) + _pull(b)) - (_hold(a) + _pull(a)));
        const start = (t.sitRot++) % ranked.length;
        sitOuts = ranked.slice(ranked.length - nSit);
        // small rotation so it isn't always the exact same bench
        if (start % 2 === 1 && ranked.length > nSit + 1) sitOuts = [ranked[ranked.length - nSit - 1], ...ranked.slice(ranked.length - nSit + 1)];
        playing = order.filter(m => !sitOuts.includes(m));
      }
      // ROLE PICK: favor good grippers, but ROTATE — noise + a penalty for anyone who
      // already held, so holding gets shared round-to-round (matches the show; nobody
      // is stuck pulling all game) and different faces defend each round.
      const holdRoll = {};
      playing.forEach(m => { holdRoll[m] = _hold(m) + _noise(2.4) - (heldCount[m] || 0) * 2.0; });
      const byHold = [...playing].sort((a, b) => holdRoll[b] - holdRoll[a]);
      const holders = byHold.slice(0, HOLDERS_PER).map(p => ({ player: p, slip: 0, downed: false, attackers: [], survives: 0 }));
      holders.forEach(h => { heldCount[h.player] = (heldCount[h.player] || 0) + 1; });
      const pullers = playing.filter(m => !holders.some(h => h.player === m));
      // per-round FORM (±23%): a team can catch a hot round or a flat one, so a
      // weaker team can steal a round and best-of-3 upsets happen (MD rule).
      const form = 1 + _noise(0.23);
      return { name: t.name, color: t.color, ti: t.ti, tref: t, holders, pullers, sitOuts, form, _pullerActions: [] };
    });

    // LINEUP step
    _push({ stepType: 'lineup', round: roundNum,
      lineups: state.map(s => ({ name: s.name, color: s.color,
        holders: s.holders.map(h => ({ player: h.player, grip: Math.round(_hold(h.player)) })),
        pullers: s.pullers.map(p => ({ player: p, pull: Math.round(_pull(p)) })),
        sitOuts: [...s.sitOuts] })) },
      _bfSnap(roundNum, state));

    // ── the melee: teams take turns attacking enemy holders until a team is wiped ──
    let beatCount = 0;
    const alive = () => state.filter(s => s.holders.some(h => !h.downed));
    while (alive().length > 1 && beatCount < 22) {
      beatCount++;
      const attackers = alive();
      for (const atk of attackers) {
        if (alive().length <= 1) break;
        const upPullers = atk.pullers.slice();
        // even a team's up-holders can lend a hand once their own pole is momentarily safe
        if (!upPullers.length) continue;
        // choose a target TEAM: strongest surviving enemy (most holders left)
        const enemies = state.filter(s => s !== atk && s.holders.some(h => !h.downed));
        if (!enemies.length) break;
        const targetTeam = enemies.slice().sort((a, b) =>
          (b.holders.filter(h => !h.downed).length - a.holders.filter(h => !h.downed).length) ||
          (avgHold(b) - avgHold(a)))[0];
        const upHolders = targetTeam.holders.filter(h => !h.downed);
        // TARGET-SWITCH tactic: usually swarm the WEAKEST-grip up holder
        let target = upHolders.slice().sort((a, b) => (a.slip - b.slip === 0 ? _hold(a.player) - _hold(b.player) : b.slip - a.slip))[0];
        // (prefer whoever's already closest to going over the line; tiebreak weakest grip)
        target = upHolders.slice().sort((a, b) => (b.slip - a.slip) || (_hold(a.player) - _hold(b.player)))[0];

        // GANG-UP: commit 1-3 pullers; smart teams pile onto a weak target
        const wantGang = _hold(target.player) < 6 || target.slip > 40 || Math.random() < 0.5;
        const nP = Math.min(upPullers.length, wantGang ? (2 + (Math.random() < 0.4 ? 1 : 0)) : 1);
        const committed = upPullers.slice().sort((a, b) => _pull(b) - _pull(a)).slice(0, nP);
        const coordinated = committed.length >= 2;
        target.attackers = committed;
        atk._pullerActions = committed.map(p => ({ player: p, color: atk.color, target: target.player, targetColor: targetTeam.color, coordinated }));

        const pullForce = committed.reduce((s, p) => s + _pull(p), 0) * (coordinated ? 1.15 : 1.0) * (atk.form || 1) + _noise(4);
        const resistForce = _hold(target.player) * (committed.length > 1 ? committed.length * 0.62 : 1) * (targetTeam.form || 1) + _noise(4);
        // scrappy holders (low temper / bold / wildcard) can pull off a resist MOVE
        const scrap = (10 - pStats(target.player).temperament) * 0.5 + pStats(target.player).boldness * 0.4;
        const resistMove = Math.random() < Math.min(0.5, scrap * 0.045) && !coordinated;
        const atkNames = _names(committed);           // every attacker, named
        const lead = committed[0];

        if (resistMove || resistForce > pullForce) {
          // holder survives — knocks pullers loose / escapes
          target.slip = Math.max(0, target.slip - (resistMove ? 14 : 6));
          target.survives = (target.survives || 0) + 1;
          personalScores[target.player] = (personalScores[target.player] || 0) + 1.6;
          if (!gs.popularity) gs.popularity = {};
          if (resistMove) gs.popularity[target.player] = (gs.popularity[target.player] || 0) + 0.5;
          const move = _rp(['kicks free of', 'bites the arm of', 'tickles loose', 'twists out of the grip of', 'headbutts back at']);
          _push({ stepType: resistMove ? 'escape' : 'resist', round: roundNum, team: targetTeam.name, color: targetTeam.color,
            player: target.player, attackers: committed, atkTeam: atk.name, atkColor: atk.color,
            text: resistMove
              ? _vary([
                  `${target.player} ${move} ${lead} and clings back to the pole — the crowd on the beach loses it.`,
                  `Down to one hand, ${target.player} ${move} ${lead} and somehow hangs on. Pure scrap.`,
                  `${target.player} refuses to go quietly — ${move} ${lead} and digs both heels into the sand.`,
                  `${target.player} wraps a leg around the pole and ${move} ${lead}. Not today.`,
                ], 'escape')
              : _vary([
                  `${atkNames} (${atk.name}) heave, but ${target.player}'s grip holds. The pole doesn't budge.`,
                  `${target.player} grits through the pull. ${atkNames} can't break ${_pron(target.player).obj} loose yet.`,
                  `Sand flies but ${target.player} stays planted. ${atkNames} reset for another go.`,
                ], 'resist'),
            meta: resistMove ? `${target.player} shakes off ${atkNames} · +0.5 pop` : `${target.player}'s grip ${Math.round(_hold(target.player))} holds vs ${atk.name}'s pull ${Math.round(pullForce)}` },
            _bfSnap(roundNum, state));
        } else {
          const dmg = Math.max(14, (pullForce - resistForce) * 4 + 18 + _noise(6));
          target.slip = Math.min(100, target.slip + dmg);
          if (target.slip >= 100) {
            target.downed = true;
            atk.tref.downsDealt++; targetTeam.tref.holdersLost++;   // tiebreak metrics
            const downer = committed[0];
            personalScores[downer] = (personalScores[downer] || 0) + 3;
            committed.slice(1).forEach(p => { personalScores[p] = (personalScores[p] || 0) + 1.2; });
            const left = targetTeam.holders.filter(h => !h.downed).length;
            _push({ stepType: 'down', round: roundNum, team: targetTeam.name, color: targetTeam.color, player: target.player,
              attackers: committed, atkTeam: atk.name, atkColor: atk.color, coordinated,
              text: _vary([
                `${target.player}'s grip finally gives — ${atkNames} haul ${_pron(target.player).obj} across the line for ${atk.name}. ${targetTeam.name} down to ${left}.`,
                `${atkNames} overpower ${target.player} and drag ${_pron(target.player).obj} over. ${targetTeam.name}: ${left} holder${left === 1 ? '' : 's'} left.`,
                `Heels dig, sand sprays, but ${atkNames} plant the drag and ${target.player} goes across. ${left} to go for ${targetTeam.name}.`,
              ], 'down'),
              meta: `${coordinated ? `Coordinated gang-up by ${atkNames}` : `${downer} solo`} · ${atk.name} +1 down · ${targetTeam.name} ${left}/${HOLDERS_PER} up` },
              _bfSnap(roundNum, state));
          } else {
            // progress grab (dragging, not yet over)
            _push({ stepType: 'grab', round: roundNum, team: targetTeam.name, color: targetTeam.color, player: target.player,
              attackers: committed, atkTeam: atk.name, atkColor: atk.color, coordinated,
              text: _vary([
                `${atkNames} latch onto ${target.player} and start hauling toward ${atk.name}'s side — heels plowing through the sand.`,
                `${target.player} slides toward the line, ${atkNames} dragging hard. Not over yet.`,
                `${atkNames} get a grip and drag ${target.player} closer to the line. ${target.player} scrambles for the pole.`,
              ], 'grab'),
              meta: `${coordinated ? `Gang-up: ${atkNames}` : `${lead} solo`} · ${target.player} at ${Math.round(target.slip)}% dragged` },
              _bfSnap(roundNum, state));
          }
        }
      }

      // RALLY intervention: a benched/downed teammate gives a straining holder a second wind
      alive().forEach(s => {
        const strained = s.holders.find(h => !h.downed && h.slip >= 55);
        const bench = [...s.sitOuts, ...s.holders.filter(h => h.downed).map(h => h.player)];
        if (strained && bench.length && Math.random() < 0.22) {
          const rallier = _rp(bench);
          strained.slip = Math.max(0, strained.slip - 22);
          personalScores[strained.player] = (personalScores[strained.player] || 0) + 1;
          addBond(rallier, strained.player, 0.5);
          _push({ stepType: 'rally', round: roundNum, team: s.name, color: s.color, player: strained.player, rallier,
            text: _vary([
              `${rallier} screams encouragement from the sideline and ${strained.player} finds a second wind — clawing back from the brink of the line.`,
              `"DON'T YOU DARE LET GO!" — ${rallier}'s voice cuts through and ${strained.player} digs in, hauling back toward the pole.`,
              `${rallier} rallies ${strained.player} from the bench. It works — ${strained.player} regrips the pole and steadies.`,
            ], 'rally'),
            meta: `Second wind · ${strained.player} regains ground · +0.5 bond ${rallier}/${strained.player}` },
            _bfSnap(roundNum, state));
        }
      });
    }

    // round winner = last team with a holder up (or most holders up if capped)
    const survivors = alive();
    let roundWinner;
    if (survivors.length === 1) roundWinner = survivors[0];
    else roundWinner = state.slice().sort((a, b) =>
      (b.holders.filter(h => !h.downed).length - a.holders.filter(h => !h.downed).length) ||
      (b.holders.reduce((s, h) => s + h.survives, 0) - a.holders.reduce((s, h) => s + h.survives, 0)))[0];
    roundWinner.tref.roundWins++;
    roundResults.push({ round: roundNum, winner: roundWinner.name, color: roundWinner.color });
    // score: winning team survivors + the team overall
    roundWinner.holders.filter(h => !h.downed).forEach(h => { personalScores[h.player] = (personalScores[h.player] || 0) + 2; });
    [...roundWinner.holders.map(h => h.player), ...roundWinner.pullers].forEach(m => { personalScores[m] = (personalScores[m] || 0) + 2; });

    _push({ stepType: 'roundwin', round: roundNum, team: roundWinner.name, color: roundWinner.color,
      standings: teamData.map(t => ({ name: t.name, color: t.color, wins: t.roundWins })),
      text: _vary([
        `${roundWinner.name} downs the last enemy holder and takes Round ${roundNum}!`,
        `The sand settles — ${roundWinner.name} is the last team with a pole standing. Round ${roundNum} to ${roundWinner.name}.`,
        `All rivals dragged across. ${roundWinner.name} claims Round ${roundNum}.`,
      ], 'roundwin'),
      meta: teamData.map(t => `${t.name} ${t.roundWins}`).join(' — ') },
      _bfSnap(roundNum, state));

    // social event between rounds (guaranteed)
    const evTeam = teamData[(roundNum - 1) % teamData.length];
    const evt = _socialEvent(evTeam, teamData, ep);
    if (evt) {
      ep.campEvents[evTeam.name].post.push(evt);
      _push({ stepType: 'event', round: roundNum, team: evTeam.name, color: evTeam.color, ...evt });
    }
  }

  try { _checkShowmanceChalMoment(ep, null, null, personalScores, 'danger', tribes); } catch (e) {}

  // ── RANK: most round wins; ties broken by TOTAL RIVALS DRAGGED ACROSS, then
  //   fewest of your own holders lost, then total scores. All thematic + shown. ──
  const _tieActive = new Set();
  const _byWins = {}; teamData.forEach(t => { _byWins[t.roundWins] = (_byWins[t.roundWins] || 0) + 1; });
  teamData.forEach(t => { if (_byWins[t.roundWins] > 1) _tieActive.add(t.roundWins); });
  teamData.sort((a, b) => (b.roundWins - a.roundWins) ||
    (b.downsDealt - a.downsDealt) || (a.holdersLost - b.holdersLost) ||
    (b.members.reduce((s, m) => s + (personalScores[m] || 0), 0) - a.members.reduce((s, m) => s + (personalScores[m] || 0), 0)));
  const winner = teamData[0].tribe;
  const loser = teamData[teamData.length - 1].tribe;
  const safeTribes = teamData.slice(1, -1).map(t => t.tribe);
  // note which placements were decided by the tiebreak (for the VP results screen)
  const tiebreakWinner = _tieActive.has(teamData[0].roundWins) ? teamData[0].name : null;
  const tiebreakLoser = _tieActive.has(teamData[teamData.length - 1].roundWins) ? teamData[teamData.length - 1].name : null;
  // winning team finish bonus
  teamData[0].members.forEach(m => { personalScores[m] = (personalScores[m] || 0) + 4; });

  ep.polesApart = {
    teams: teamData.map(t => ({ name: t.name, color: t.color, members: t.members, roundWins: t.roundWins, downsDealt: t.downsDealt, holdersLost: t.holdersLost })),
    rounds: roundResults,
    steps,
    holdersPer: HOLDERS_PER,
    winner: winner.name, loser: loser.name,
    tiebreakWinner, tiebreakLoser,
  };
  ep.winner = winner;
  ep.loser = loser;
  ep.safeTribes = safeTribes;
  ep.tribalPlayers = [...loser.members];
  ep.challengeType = 'poles-apart';
  ep.challengeLabel = 'Poles Apart';
  ep.challengeCategory = 'physical';
  ep.chalMemberScores = personalScores;
  ep.chalPlacements = Object.entries(personalScores).sort((a, b) => b[1] - a[1]).map(([n]) => n);
  ep.isPolesApart = true;

  updateChalRecord(ep);
}
function avgHold(s) { const up = s.holders.filter(h => !h.downed); return up.length ? up.reduce((a, h) => a + _hold(h.player), 0) / up.length : 0; }

// ══════════════════════════════════════════════════════════════════════
//  VP SCREENS — reproduces mockup-poles-apart.html: sunny beach, sticky
//  best-of-3 scoreboard + live battlefield (poles + pullers + drag line),
//  sticky sidebar, avatar cards, animated cold open.
// ══════════════════════════════════════════════════════════════════════
const _paState = {};
function _paEnsure(key, total) { if (!_paState[key]) _paState[key] = { idx: -1, total }; return _paState[key]; }

function _paPortrait(name, cls, color) {
  const p = players.find(x => x.name === name);
  const slug = p?.slug || String(name).toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const init = String(name).slice(0, 2).toUpperCase();
  return `<span class="pa-pf ${cls || ''}" style="background:${color || '#88a'}"><img src="assets/avatars/${slug}.png" alt="${name}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"/><b>${init}</b></span>`;
}
function _paActor(name, color, badge) {
  return `<span class="pa-actor">${_paPortrait(name, 'lg', color)}${badge ? `<span class="pa-actor-badge">${badge}</span>` : ''}</span>`;
}
// team emblem: colored circle + initials, NO avatar image (avoids 404s on team names)
function _paEmblem(name, cls, color) {
  const init = String(name).slice(0, 2).toUpperCase();
  return `<span class="pa-pf ${cls || ''}" style="background:${color || '#88a'}"><b style="display:flex">${init}</b></span>`;
}
// clash visual for grab/down/resist/escape: attacker avatars → rope → target holder.
// `winning` = attackers overpowering (grab/down) vs target holding them off (resist/escape).
function _paClash(attackers, atkColor, atkTeam, target, targetColor, targetTeam, badge, winning) {
  const atk = (attackers || []).slice(0, 3).map((p, i) => `<span class="pa-cl-av" style="${i ? 'margin-left:-12px' : ''}">${_paPortrait(p, 'md', atkColor)}</span>`).join('');
  return `<div class="pa-clash">
    <div class="pa-clash-atk" title="${atkTeam}: ${(attackers || []).join(', ')}">${atk}<div class="pa-cl-tag" style="color:${atkColor}">${atkTeam}</div></div>
    <div class="pa-clash-rope ${winning ? 'win' : 'block'}">${winning ? '⟶' : '⊘'}</div>
    <div class="pa-clash-tgt"><span class="pa-actor">${_paPortrait(target, 'lg', targetColor)}<span class="pa-actor-badge">${badge}</span></span><div class="pa-cl-tag" style="color:${targetColor}">${target}</div></div>
  </div>`;
}
function _clashCard(s, cls, badge, tgtBadge, winning) {
  return `<div class="pa-card"><div class="pa-card-head"><span class="pa-badge ${cls}">${badge}</span><span style="font-size:11px;color:#5a7488">${s.atkTeam || ''} → ${s.team}'s ${s.player}</span></div>
    <div class="pa-card-body">${_paClash(s.attackers, s.atkColor, s.atkTeam, s.player, s.color, s.team, tgtBadge, winning)}<div><div class="pa-card-txt">${s.text}</div><div class="pa-card-meta">${s.meta || ''}</div></div></div></div>`;
}

// walk steps back to the last one carrying a battlefield snapshot
function _paBfAt(data, idx) {
  const steps = data.steps || [];
  for (let i = Math.min(idx, steps.length - 1); i >= 0; i--) { if (steps[i] && steps[i].bf) return steps[i].bf; }
  return null;
}
// current round-win tally up to idx
function _paWinsAt(data, idx) {
  const wins = {}; (data.teams || []).forEach(t => wins[t.name] = 0);
  const steps = data.steps || [];
  for (let i = 0; i <= idx && i < steps.length; i++) {
    if (steps[i].stepType === 'roundwin') wins[steps[i].team] = (wins[steps[i].team] || 0) + 1;
  }
  return wins;
}
function _paCurRound(data, idx) {
  const steps = data.steps || [];
  let r = 1; for (let i = 0; i <= idx && i < steps.length; i++) if (steps[i].round) r = steps[i].round;
  return r;
}

function _paScoreboardInner(data, idx) {
  const teams = data.teams || [];
  const wins = _paWinsAt(data, idx);
  const cur = _paCurRound(data, idx);
  const t0 = teams[0], t1 = teams[1] || teams[0];
  const pip = (t, n) => Array.from({ length: 3 }, (_, i) => `<span class="pa-pip ${i < (wins[t.name] || 0) ? 'won' : ''}" style="${i < (wins[t.name] || 0) ? `background:${t.color};border-color:${t.color};box-shadow:0 0 8px ${t.color}88` : ''}"></span>`).join('');
  if (teams.length === 2) {
    const lead = (wins[t0.name] || 0) === (wins[t1.name] || 0) ? 'all square' : `${((wins[t0.name] || 0) > (wins[t1.name] || 0)) ? t0.name : t1.name} lead`;
    return `<div class="pa-score-team" style="color:${t0.color}">${_paEmblem(t0.name, 'md', t0.color)} ${t0.name.toUpperCase()}<div class="pa-pips">${pip(t0)}</div></div>
      <div class="pa-vs">VS</div>
      <div class="pa-score-team right" style="color:${t1.color}"><div class="pa-pips">${pip(t1)}</div>${t1.name.toUpperCase()} ${_paEmblem(t1.name, 'md', t1.color)}</div>
      <div class="pa-round-label">Round ${cur} of 3 · ${teams.map(t => `${t.name} ${wins[t.name] || 0}`).join(' — ')} · ${lead}</div>`;
  }
  // 3+ teams: row of team pip blocks
  return teams.map(t => `<div class="pa-score-team" style="color:${t.color};justify-content:center">${_paEmblem(t.name, 'sm', t.color)} ${t.name.toUpperCase()} <div class="pa-pips">${pip(t)}</div></div>`).join('') +
    `<div class="pa-round-label">Round ${cur} of 3 · ${teams.map(t => `${t.name} ${wins[t.name] || 0}`).join(' — ')}</div>`;
}

// spatial battlefield for 2 teams; strip view for 3+
function _paBattlefieldInner(data, idx) {
  const bf = _paBfAt(data, idx);
  const teams = data.teams || [];
  if (!bf) return `<div class="pa-arena-line"></div><div class="pa-arena-label">DRAG LINE</div>`;
  if (bf.teams.length === 2) {
    const [T0, T1] = bf.teams;               // T0 left/red, T1 right/blue
    let html = `<div class="pa-side-tag l" style="color:${T0.color}">${T0.name.toUpperCase()} SIDE</div>
      <div class="pa-side-tag r" style="color:${T1.color}">${T1.name.toUpperCase()} SIDE</div>
      <div class="pa-arena-line"></div><div class="pa-arena-label">DRAG LINE</div>`;
    // T0 holders home 16..40 (dragged rightward toward 92 as slip↑); T1 home 84..60 (dragged left toward 8)
    const poleEls = [], pullerEls = [];
    T0.holders.forEach((h, i) => {
      const home = 16 + i * 12, x = home + (h.slip / 100) * (92 - home);
      poleEls.push(_poleEl(h, x, T0.color, h.slip >= 100));
      (h.attackers || []).forEach((p, k) => pullerEls.push(_pullerEl(p, x + 4 + k * 2.4, T1.color, (h.attackers.length > 1))));
    });
    T1.holders.forEach((h, i) => {
      const home = 84 - i * 12, x = home - (h.slip / 100) * (home - 8);
      poleEls.push(_poleEl(h, x, T1.color, h.slip >= 100));
      (h.attackers || []).forEach((p, k) => pullerEls.push(_pullerEl(p, x - 4 - k * 2.4, T0.color, (h.attackers.length > 1))));
    });
    return html + poleEls.join('') + pullerEls.join('');
  }
  // 3+ teams: per-team strip; each holder pole shows the ATTACKER avatars pulling it
  return `<div class="pa-strips">` + bf.teams.map(t => `<div class="pa-strip"><div class="pa-strip-name" style="color:${t.color}">${t.name}</div>${
    t.holders.map(h => {
      const atk = (h.attackers || []).slice(0, 3).map((p, i) => `<span class="pa-strip-atk" style="${i ? 'margin-left:-9px' : ''}">${_paPortrait(p, 'sm', '#d8532e')}</span>`).join('');
      return `<div class="pa-strip-pole ${h.downed ? 'downed' : ''}">${_paPortrait(h.player, 'sm', t.color)}
        <div class="pa-strip-bar"><div class="pa-strip-fill" style="width:${h.downed ? 100 : h.slip}%;background:${h.downed ? '#d8532e' : (h.attackers && h.attackers.length ? '#e0894a' : '#2ba36a')}"></div></div>
        <div class="pa-strip-atks">${h.downed ? '<span style="font-size:9px;color:#d8532e">dragged ✗</span>' : atk}</div></div>`;
    }).join('')
  }</div>`).join('') + `</div>`;
}
function _poleEl(h, x, color, downed) {
  return `<div class="pa-pole ${downed ? 'downed' : ''}" style="left:${Math.max(4, Math.min(96, x))}%">
    ${_paPortrait(h.player, 'sm', color)}<div class="pa-pole-stick"></div><div class="pa-holder-nm">${h.player}</div></div>`;
}
// a puller on the map = a small AVATAR (identifiable), pulsing when ganging up
function _pullerEl(name, x, color, ganged) {
  return `<div class="pa-puller ${ganged ? 'ganged' : ''}" style="left:${Math.max(3, Math.min(97, x))}%;border-color:${color}" title="${name}${ganged ? ' (ganging up)' : ''}">${_paPortrait(name, 'sm', color)}</div>`;
}

function _paSidebarInner(data, idx) {
  const bf = _paBfAt(data, idx);
  const wins = _paWinsAt(data, idx);
  let html = '';
  if (bf) {
    bf.teams.forEach(t => {
      const up = t.holders.filter(h => !h.downed).length;
      let rows = t.holders.map(h => {
        const st = h.downed ? 'dragged ✗' : (h.attackers && h.attackers.length ? 'under attack' : 'holding');
        const col = h.downed ? '#d8532e' : (h.attackers && h.attackers.length ? '#e0894a' : '#2ba36a');
        return `<div class="pa-side-row" style="${h.downed ? 'opacity:.5' : ''}">${_paPortrait(h.player, 'sm', t.color)} ${h.player} <span style="font-size:9px;color:${col}">${st}</span><span class="pa-side-dot" style="background:${col}"></span></div>`;
      }).join('');
      (t.pullers || []).slice(0, 3).forEach(p => { rows += `<div class="pa-side-row" style="opacity:.7">${_paPortrait(p, 'sm', t.color)} ${p} <span style="font-size:9px;color:#e0894a">puller</span></div>`; });
      (t.sitOuts || []).slice(0, 1).forEach(p => { rows += `<div class="pa-side-row" style="opacity:.45">${_paPortrait(p, 'sm', t.color)} ${p} <span style="font-size:9px;color:#8896a4">sitting out</span></div>`; });
      html += `<div class="pa-side-team"><div class="pa-side-team-bar" style="background:${t.color}"><span>${t.name.toUpperCase()}</span><span style="font-family:'Righteous'">${up} up</span></div>${rows}</div>`;
    });
  }
  html += `<div class="pa-legend"><span><span class="pa-side-dot" style="background:#2ba36a"></span>holding</span>
    <span><span class="pa-side-dot" style="background:#e0894a"></span>under attack</span>
    <span><span class="pa-side-dot" style="background:#d8532e"></span>dragged out</span></div>`;
  return html;
}
function _paRoundsInner(data, idx) {
  const wins = _paWinsAt(data, idx);
  const cur = _paCurRound(data, idx);
  const done = {}; const steps = data.steps || [];
  for (let i = 0; i <= idx && i < steps.length; i++) if (steps[i].stepType === 'roundwin') done[steps[i].round] = { name: steps[i].team, color: steps[i].color };
  return `<div style="display:flex;flex-direction:column;gap:6px;font-size:12px">` + [1, 2, 3].map(r => {
    const w = done[r];
    return `<div style="display:flex;justify-content:space-between"><span>Round ${r}</span>${w ? `<b style="color:${w.color}">${w.name} ✓</b>` : (r === cur ? `<b style="color:#0a6ba8">in progress…</b>` : `<span style="color:#8896a4">—</span>`)}</div>`;
  }).join('') + `</div>`;
}

function _reapplyVisibility(suffix, upToIdx, total) {
  for (let i = 0; i <= upToIdx; i++) { const el = document.getElementById(`pa-step-${suffix}-${i}`); if (el) el.classList.add('pa-visible'); }
  const c = document.getElementById(`pa-counter-${suffix}`); if (c) c.textContent = `${Math.min(upToIdx + 1, total)} / ${total}`;
  if (upToIdx >= total - 1) { const ctl = document.getElementById(`pa-controls-${suffix}`); if (ctl) ctl.querySelectorAll('.pa-btn').forEach(b => b.style.opacity = '0.45'); }
}
function _paData() { const ep = gs.episodeHistory?.[window.vpEpNum - 1]; return ep?.polesApart || null; }
function _paLiveUpdate(idx) {
  const data = _paData(); if (!data) return;
  const sc = document.getElementById('pa-scoreboard-inner'); if (sc) sc.innerHTML = _paScoreboardInner(data, idx);
  const bf = document.getElementById('pa-battlefield-inner'); if (bf) bf.innerHTML = _paBattlefieldInner(data, idx);
  const sb = document.getElementById('pa-sidebar-inner'); if (sb) sb.innerHTML = _paSidebarInner(data, idx);
  const rd = document.getElementById('pa-rounds-inner'); if (rd) rd.innerHTML = _paRoundsInner(data, idx);
}
export function polesApartRevealNext(screenKey, total) {
  const s = _paEnsure(screenKey, total); if (s.idx >= s.total - 1) return; s.idx++;
  const suffix = screenKey.replace('pa-', '');
  _reapplyVisibility(suffix, s.idx, s.total);
  const idx = s.idx;
  requestAnimationFrame(() => requestAnimationFrame(() => {
    const el = document.getElementById(`pa-step-${suffix}-${idx}`); if (!el) return;
    const stick = document.querySelector('.pa-stickwrap');
    const h = stick ? stick.getBoundingClientRect().height : 220;
    el.style.scrollMarginTop = Math.round(h + 56) + 'px';
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }));
  try { _paLiveUpdate(s.idx); } catch (e) {}
}
export function polesApartRevealAll(screenKey, total) {
  const s = _paEnsure(screenKey, total); s.idx = s.total - 1;
  _reapplyVisibility(screenKey.replace('pa-', ''), s.idx, s.total);
  try { _paLiveUpdate(s.idx); } catch (e) {}
}

function _paCSS() {
  return `<style>
  @import url('https://fonts.googleapis.com/css2?family=Righteous&family=Nunito:wght@400;600;700;800;900&display=swap');
  .pa-shell{max-width:1100px;margin:0 auto;font-family:'Nunito',system-ui,sans-serif;color:#123;position:relative;padding-bottom:24px}
  .pa-bgfx{position:fixed;inset:0;z-index:-2;pointer-events:none;background:linear-gradient(180deg,#7ec8f0 0%,#a8e0f5 30%,#ffe9a8 56%,#f5d98a 100%)}
  .pa-sun{position:fixed;top:56px;right:8%;width:80px;height:80px;border-radius:50%;background:radial-gradient(circle,#fff6c0,#ffd75e 60%,transparent 72%);box-shadow:0 0 60px 20px rgba(255,220,90,.4);z-index:-1;animation:paSun 6s ease-in-out infinite}
  @keyframes paSun{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}
  .pa-gull{position:fixed;font-size:15px;color:#33506a;z-index:-1;opacity:.45;animation:paGull 16s linear infinite}
  @keyframes paGull{from{transform:translateX(-40px)}to{transform:translateX(105vw)}}
  @media(prefers-reduced-motion:reduce){.pa-sun,.pa-gull{animation:none}}
  .pa-hero{text-align:center;padding:6px 0 12px}
  .pa-eyebrow{font-size:11px;letter-spacing:4px;text-transform:uppercase;color:#0a6ba8;font-weight:800;text-shadow:0 1px 0 rgba(255,255,255,.6)}
  .pa-title{font-family:'Righteous',cursive;font-size:clamp(32px,6vw,56px);line-height:1;letter-spacing:1px;margin-top:4px;color:#fff;text-shadow:0 2px 0 #0a6ba8,0 4px 0 #075a8e,0 6px 14px rgba(0,0,0,.25)}
  .pa-sub{font-size:12.5px;color:#0b4c72;margin-top:8px;font-weight:600;max-width:660px;margin-left:auto;margin-right:auto}
  .pa-pf{display:inline-flex;align-items:center;justify-content:center;border-radius:50%;overflow:hidden;position:relative;flex-shrink:0;vertical-align:middle;border:2px solid #fff;background:#88a;box-shadow:0 2px 6px rgba(0,0,0,.25)}
  .pa-pf img{width:100%;height:100%;object-fit:cover;display:block}
  .pa-pf b{display:none;width:100%;height:100%;align-items:center;justify-content:center;font-family:'Righteous';font-size:10px;color:#fff}
  .pa-pf.sm{width:24px;height:24px}.pa-pf.sm b{font-size:9px}
  .pa-pf.md{width:34px;height:34px}.pa-pf.lg{width:46px;height:46px;border-width:3px}
  /* sticky wrapper holds scoreboard + battlefield together */
  .pa-stickwrap{position:sticky;top:8px;z-index:6;margin-bottom:16px}
  .pa-score{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:12px;background:rgba(255,255,255,.85);backdrop-filter:blur(8px);border:2px solid rgba(255,255,255,.9);border-radius:16px 16px 0 0;padding:10px 16px;box-shadow:0 6px 20px rgba(11,76,114,.18)}
  .pa-score-team{display:flex;align-items:center;gap:8px;font-family:'Righteous';font-size:17px}
  .pa-score-team.right{justify-content:flex-end}
  .pa-pips{display:flex;gap:5px}
  .pa-pip{width:15px;height:15px;border-radius:50%;border:2px solid rgba(0,0,0,.15);background:rgba(255,255,255,.5)}
  .pa-vs{font-family:'Righteous';font-size:21px;color:#0a6ba8;text-shadow:0 1px 0 #fff}
  .pa-round-label{grid-column:1/-1;text-align:center;font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:#0b4c72;font-weight:800;margin-top:2px}
  .pa-arena{position:relative;height:142px;border-radius:0 0 14px 14px;overflow:hidden;background:linear-gradient(180deg,#ffe9a8,#f0cf7e);border:2px solid #e0b95e;border-top:none;box-shadow:inset 0 0 30px rgba(180,130,40,.25)}
  .pa-arena-line{position:absolute;top:0;bottom:0;left:50%;width:3px;transform:translateX(-50%);background:repeating-linear-gradient(180deg,#d8532e 0 8px,transparent 8px 16px);opacity:.7}
  .pa-arena-label{position:absolute;top:3px;left:50%;transform:translateX(-50%);font-size:8px;letter-spacing:1px;color:#b8642a;font-weight:800}
  .pa-side-tag{position:absolute;top:5px;font-family:'Righteous';font-size:10px;opacity:.7}.pa-side-tag.l{left:8px}.pa-side-tag.r{right:8px}
  .pa-pole{position:absolute;bottom:12px;display:flex;flex-direction:column;align-items:center;transition:left .6s cubic-bezier(.5,0,.3,1);z-index:2}
  .pa-pole-stick{width:5px;height:42px;background:linear-gradient(180deg,#c9a15a,#8a6a30);border-radius:3px;box-shadow:1px 0 2px rgba(0,0,0,.2)}
  .pa-pole .pa-pf{margin-bottom:-6px;z-index:2}
  .pa-holder-nm{font-size:8px;font-weight:800;margin-top:2px;color:#123;background:rgba(255,255,255,.7);padding:0 4px;border-radius:3px;white-space:nowrap}
  .pa-pole.downed{opacity:.4;filter:grayscale(.7)}.pa-pole.downed .pa-holder-nm::after{content:' ✗';color:#d8532e}
  .pa-puller{position:absolute;bottom:16px;transform:translateX(-50%);transition:left .6s;z-index:3;border-radius:50%;border:2px solid;box-shadow:0 1px 4px rgba(0,0,0,.3);line-height:0}
  .pa-puller .pa-pf{width:22px;height:22px;border:none;box-shadow:none}
  .pa-puller.ganged{box-shadow:0 0 0 2px #fff,0 0 9px 3px rgba(216,83,46,.85);animation:paGang .8s ease-in-out infinite}
  @keyframes paGang{0%,100%{transform:translateX(-50%) scale(1)}50%{transform:translateX(-50%) scale(1.2)}}
  @media(prefers-reduced-motion:reduce){.pa-puller.ganged{animation:none}}
  .pa-strips{display:flex;gap:8px;padding:6px 10px;height:100%;align-items:stretch}
  .pa-strip{flex:1;background:rgba(255,255,255,.45);border-radius:8px;padding:5px 7px;display:flex;flex-direction:column;justify-content:center}
  .pa-strip-name{font-family:'Righteous';font-size:11px;margin-bottom:3px}
  .pa-strip-pole{display:flex;align-items:center;gap:5px;margin:2px 0}.pa-strip-pole.downed{opacity:.45}
  .pa-strip-bar{flex:1;height:6px;border-radius:4px;background:rgba(0,0,0,.1);overflow:hidden}.pa-strip-fill{height:100%;border-radius:4px;transition:width .5s}
  .pa-strip-atks{display:flex;align-items:center;min-width:44px;justify-content:flex-end}
  .pa-strip-atk .pa-pf{width:20px;height:20px;border-width:2px}
  /* clash card visual: attackers → target */
  .pa-clash{display:flex;align-items:center;gap:8px;flex-shrink:0}
  .pa-clash-atk{display:flex;flex-direction:column;align-items:center;gap:2px}
  .pa-clash-atk .pa-cl-av{display:inline-block}
  .pa-cl-tag{font-size:8px;font-weight:800;max-width:64px;text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .pa-clash-rope{font-size:18px;font-weight:900}
  .pa-clash-rope.win{color:#d8532e;animation:paPull 1s ease-in-out infinite}
  .pa-clash-rope.block{color:#2ba36a}
  @keyframes paPull{0%,100%{transform:translateX(0)}50%{transform:translateX(-3px)}}
  .pa-clash-tgt{display:flex;flex-direction:column;align-items:center;gap:2px}
  @media(prefers-reduced-motion:reduce){.pa-clash-rope.win{animation:none}}
  .pa-body{display:grid;grid-template-columns:1fr 290px;gap:16px}
  @media(max-width:860px){.pa-body{grid-template-columns:1fr}}
  .pa-stage{display:flex;flex-direction:column}
  .pa-step{max-height:0;overflow:hidden;opacity:0;transform:translateY(14px);transition:max-height .5s ease,opacity .5s,transform .5s;scroll-margin-top:260px}
  .pa-step.pa-visible{max-height:1400px;opacity:1;transform:none;margin-bottom:11px}
  @media(prefers-reduced-motion:reduce){.pa-step{transition:max-height .2s,opacity .2s}.pa-pole,.pa-puller{transition:none}}
  .pa-card{background:rgba(255,255,255,.92);border:1px solid rgba(11,76,114,.12);border-radius:13px;padding:12px 14px;box-shadow:0 4px 12px rgba(11,76,114,.12)}
  .pa-card-head{display:flex;align-items:center;gap:9px;margin-bottom:7px;flex-wrap:wrap}
  .pa-badge{font-size:9px;font-weight:900;letter-spacing:1px;padding:3px 9px;border-radius:5px;color:#fff}
  .b-round{background:#0a6ba8}.b-grab{background:#e0894a}.b-down{background:#d8532e}.b-resist{background:#2ba36a}.b-escape{background:#7a5ad0}.b-rally{background:#1a9ec0}.b-win{background:#e0a91a}
  .b-romance{background:#e05a96}.b-alliance{background:#3aa85a}.b-suspect{background:#d87a4a}.b-cheer{background:#2ba36a}
  .pa-card-body{display:flex;align-items:flex-start;gap:11px}
  .pa-card-txt{font-size:13.5px;line-height:1.5;color:#1a2b38}.pa-card-txt b{color:#0a6ba8}
  .pa-card-meta{font-size:11px;color:#5a7488;margin-top:5px}
  .pa-actor{position:relative;flex-shrink:0}
  .pa-actor-badge{position:absolute;bottom:-5px;right:-6px;width:22px;height:22px;border-radius:50%;background:#fff;border:2px solid #e0b95e;display:flex;align-items:center;justify-content:center;font-size:11px}
  .pa-actor-duo{display:flex;flex-shrink:0}.pa-actor-duo .pa-pf{margin-left:-10px}.pa-actor-duo .pa-pf:first-child{margin-left:0}
  .pa-lineup{display:grid;grid-template-columns:1fr 1fr;gap:10px}
  @media(max-width:560px){.pa-lineup{grid-template-columns:1fr}}
  .pa-lineup-team{background:rgba(11,76,114,.05);border-radius:10px;padding:9px 10px}
  .pa-lineup-role{display:flex;align-items:center;gap:6px;font-size:12px;margin:4px 0}
  .pa-role-tag{font-size:8px;font-weight:900;padding:1px 5px;border-radius:4px;margin-left:auto;color:#fff}
  .pa-social{border:1px dashed rgba(214,120,180,.5);background:rgba(255,240,248,.9)}
  .pa-side{align-self:start;position:sticky;top:8px;display:flex;flex-direction:column;gap:12px}
  .pa-side-card{background:rgba(255,255,255,.92);border:1px solid rgba(11,76,114,.12);border-radius:13px;padding:12px;box-shadow:0 4px 12px rgba(11,76,114,.1)}
  .pa-side-h{font-size:9px;letter-spacing:2px;text-transform:uppercase;color:#5a7488;margin-bottom:9px;font-weight:800}
  .pa-side-team{margin-bottom:12px}
  .pa-side-team-bar{display:flex;align-items:center;justify-content:space-between;padding:5px 9px;border-radius:8px;font-weight:800;font-size:12px;margin-bottom:5px;color:#fff}
  .pa-side-row{display:flex;align-items:center;gap:7px;font-size:11.5px;padding:3px 6px;color:#1a2b38}
  .pa-side-dot{width:7px;height:7px;border-radius:50%;margin-left:auto}
  .pa-legend{font-size:10px;color:#5a7488;display:flex;flex-wrap:wrap;gap:5px 10px;padding-top:8px;border-top:1px solid rgba(11,76,114,.1)}
  .pa-legend span{display:flex;align-items:center;gap:4px}
  .pa-controls{display:flex;gap:10px;justify-content:center;align-items:center;padding:11px;margin-top:14px;position:sticky;bottom:10px;z-index:8;background:rgba(255,255,255,.94);border:2px solid #fff;border-radius:14px;box-shadow:0 6px 22px rgba(11,76,114,.28)}
  .pa-btn{font-family:'Nunito';font-weight:800;font-size:13px;border:none;border-radius:10px;padding:10px 18px;cursor:pointer;color:#fff;background:linear-gradient(135deg,#ffb02e,#f08a2a);display:flex;align-items:center;gap:6px;box-shadow:0 3px 10px rgba(240,138,42,.4)}
  .pa-btn.ghost{background:linear-gradient(135deg,#7aa0b8,#5a7d96)}
  .pa-counter{font-family:'Righteous';font-size:13px;color:#0a6ba8}
  .pa-result-row{display:flex;align-items:center;gap:12px;padding:11px 14px;border-radius:11px;margin-bottom:8px;border-left:5px solid}
  .pa-rank{font-family:'Righteous';font-size:20px;width:30px;text-align:center}
  /* cold open */
  .pa-co{padding:18px 12px 44px;text-align:center;position:relative;min-height:520px;overflow:hidden}
  .pa-co-title{font-family:'Righteous',cursive;font-size:clamp(38px,8vw,74px);line-height:1;letter-spacing:1px;color:#fff;position:relative;z-index:2;text-shadow:0 3px 0 #0a6ba8,0 6px 0 #075a8e,0 8px 18px rgba(0,0,0,.3);animation:paTitle 2.6s ease-in-out infinite}
  @keyframes paTitle{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
  .pa-co-stage{display:flex;align-items:flex-end;justify-content:center;gap:min(5vw,40px);margin-top:30px;position:relative;z-index:2;flex-wrap:nowrap}
  .pa-co-team{display:flex;flex-direction:column;align-items:center;gap:9px;animation:paTeamIn .6s cubic-bezier(.22,1,.36,1) both}
  .pa-co-team.t1{animation-delay:.25s}.pa-co-team.t2{animation-delay:.45s}
  @keyframes paTeamIn{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:none}}
  .pa-co-team-name{font-family:'Righteous';font-size:clamp(16px,3vw,24px)}
  .pa-co-roster{display:flex;flex-wrap:wrap;justify-content:center;gap:6px;max-width:clamp(150px,26vw,240px)}
  .pa-co-av{display:inline-block;animation:paBob 2.4s ease-in-out infinite}
  .pa-co-av .pa-pf{box-shadow:0 4px 8px rgba(0,0,0,.3)}
  @keyframes paBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}
  .pa-co-mid{display:flex;flex-direction:column;align-items:center;gap:4px}
  .pa-co-pole{width:6px;height:64px;background:linear-gradient(180deg,#e9d08a,#a8823a);border-radius:4px;box-shadow:0 0 0 2px rgba(255,255,255,.3);animation:paPoleWobble 3.6s ease-in-out infinite;transform-origin:50% 100%}
  @keyframes paPoleWobble{0%,100%{transform:rotate(-3deg)}50%{transform:rotate(3deg)}}
  .pa-co-vs{font-family:'Righteous';font-size:clamp(22px,4vw,34px);color:#fff;text-shadow:0 2px 0 #0a6ba8;animation:paVs 1.6s ease-in-out infinite}
  @keyframes paVs{0%,100%{transform:scale(1)}50%{transform:scale(1.14)}}
  .pa-co-waves{position:absolute;left:0;right:0;bottom:0;height:70px;z-index:1;pointer-events:none}
  .pa-co-waves svg{width:100%;height:100%}
  .pa-co-wave{animation:paWave 5s ease-in-out infinite}@keyframes paWave{0%,100%{transform:translateX(0)}50%{transform:translateX(-16px)}}
  .pa-co-cta{margin-top:30px;font-size:13px;color:#0b4c72;font-weight:700;position:relative;z-index:2;animation:paCta 2.2s ease-in-out infinite}
  @keyframes paCta{0%,100%{opacity:.7}50%{opacity:1}}
  @media(prefers-reduced-motion:reduce){.pa-co-title,.pa-co-av,.pa-co-pole,.pa-co-vs,.pa-co-team,.pa-co-wave,.pa-co-cta{animation:none}}
  </style>`;
}
function _paAmbient() {
  return `<div class="pa-bgfx"></div><div class="pa-sun"></div>
    <div class="pa-gull" style="top:90px;animation-delay:0s">〰️</div><div class="pa-gull" style="top:130px;animation-delay:7s">〰️</div>`;
}

function _shell(content, ep, data) {
  return `${_paCSS()}<div class="pa-shell">${_paAmbient()}
    <div class="pa-hero"><div class="pa-eyebrow">Carnival of Chaos · Immunity Challenge</div>
      <div class="pa-title">POLES APART</div>
      <div class="pa-sub">Three grip the poles; the rest drag the rivals across the line. Down all their holders to take the round — best of three wins immunity.</div></div>
    <div class="pa-stickwrap">
      <div class="pa-score" id="pa-scoreboard-inner">${_paScoreboardInner(data, -1)}</div>
      <div class="pa-arena" id="pa-battlefield-inner">${_paBattlefieldInner(data, -1)}</div>
    </div>
    ${content}</div>`;
}

// ── SCREEN 1: animated cold open (beach face-off) ──
export function rpBuildPolesApartTitleCard(ep) {
  const data = ep.polesApart; if (!data) return '';
  const teams = data.teams || [];
  const _tb = (t, i) => `<div class="pa-co-team t${i}">
    <div class="pa-co-team-name" style="color:${t.color}">${t.name.toUpperCase()}</div>
    <div class="pa-co-roster">${(t.members || []).map((m, j) => `<span class="pa-co-av" style="animation-delay:${(j * 0.15).toFixed(2)}s">${_paPortrait(m, 'md', t.color)}</span>`).join('')}</div></div>`;
  const mid = `<div class="pa-co-mid"><div class="pa-co-pole"></div><div class="pa-co-vs">VS</div><div class="pa-co-pole"></div></div>`;
  const stage = teams.length === 2 ? `${_tb(teams[0], 1)}${mid}${_tb(teams[1], 2)}`
    : `<div style="display:flex;flex-direction:column;gap:14px;align-items:center;width:100%"><div class="pa-co-mid"><div class="pa-co-pole"></div></div><div style="display:flex;gap:min(3vw,24px);flex-wrap:wrap;justify-content:center">${teams.map((t, i) => _tb(t, Math.min(i, 2))).join('')}</div></div>`;
  const waves = `<div class="pa-co-waves"><svg viewBox="0 0 400 70" preserveAspectRatio="none"><path class="pa-co-wave" d="M-20 40 Q30 24 80 40 T180 40 T280 40 T380 40 T480 40 V70 H-20 Z" fill="#7ec8f0" opacity=".55"/><path class="pa-co-wave" style="animation-delay:1.2s" d="M-20 50 Q30 36 80 50 T180 50 T280 50 T380 50 T480 50 V70 H-20 Z" fill="#5ab0e0" opacity=".5"/></svg></div>`;
  return `${_paCSS()}<div class="pa-shell pa-co">${_paAmbient()}
    <div class="pa-eyebrow" style="position:relative;z-index:2">Carnival of Chaos · Immunity Challenge</div>
    <div class="pa-co-title">POLES APART</div>
    <div class="pa-sub" style="max-width:640px;position:relative;z-index:2">Derek and Trevor line the teams up on the sand. Three grip the poles while the rest try to drag the rivals across the line. Down all their holders to win the round — best of three takes immunity.</div>
    <div class="pa-co-stage">${stage}</div>
    <div class="pa-co-cta">🏖️ Dig in. Grip the pole. First to two rounds.</div>
    ${waves}</div>`;
}

// ── SCREEN 2: the arena (main reveal) ──
export function rpBuildPolesApartArena(ep) {
  const data = ep.polesApart; if (!data) return '';
  const steps = data.steps || [];
  const suffix = 'arena';
  const cards = steps.map((s, i) => {
    let inner = '';
    if (s.stepType === 'lineup') {
      const cols = (s.lineups || []).map(L => {
        const rows = [];
        L.holders.forEach(h => rows.push(`<div class="pa-lineup-role">${_paPortrait(h.player, 'sm', L.color)} ${h.player} <span class="pa-role-tag" style="background:#2ba36a">HOLDER · grip ${h.grip}</span></div>`));
        L.pullers.forEach(p => rows.push(`<div class="pa-lineup-role">${_paPortrait(p.player, 'sm', L.color)} ${p.player} <span class="pa-role-tag" style="background:#e0894a">PULLER · pull ${p.pull}</span></div>`));
        (L.sitOuts || []).forEach(so => rows.push(`<div class="pa-lineup-role" style="opacity:.55">${_paPortrait(so, 'sm', L.color)} ${so} <span class="pa-role-tag" style="background:#8896a4">SITTING OUT</span></div>`));
        return `<div class="pa-lineup-team"><div style="font-family:'Righteous';color:${L.color};font-size:14px;margin-bottom:4px">${L.name.toUpperCase()}</div>${rows.join('')}</div>`;
      }).join('');
      inner = `<div class="pa-card"><div class="pa-card-head"><span class="pa-badge b-round">🏖️ ROUND ${s.round} · THE LINEUP</span><span style="font-size:11px;color:#5a7488">${data.holdersPer} holders per team · bigger team sits one out</span></div>
        <div class="pa-lineup">${cols}</div>
        <div class="pa-card-meta" style="margin-top:8px"><b style="color:#2ba36a">Grip</b> (endurance + physical + scrappiness, /10) = how long a holder resists — hot-heads grip hardest. <b style="color:#e0894a">Pull</b> (physical + boldness + teamwork, /10) = drag power; 2+ pullers ganging one holder get a coordination bonus.</div></div>`;
    } else if (s.stepType === 'grab') {
      inner = _clashCard(s, 'b-grab', s.coordinated ? '👥 GANG-UP GRAB' : '🫳 GRAB', s.coordinated ? '👥' : '🫳', true);
    } else if (s.stepType === 'resist') {
      inner = _clashCard(s, 'b-resist', '💪 HELD', '💪', false);
    } else if (s.stepType === 'escape') {
      inner = _clashCard(s, 'b-escape', '🏃 SHAKEN LOOSE', '🦵', false);
    } else if (s.stepType === 'down') {
      inner = _clashCard(s, 'b-down', '❌ DRAGGED ACROSS', '❌', true);
    } else if (s.stepType === 'rally') {
      inner = `<div class="pa-card"><div class="pa-card-head"><span class="pa-badge b-rally">📣 SECOND WIND</span><span style="font-size:11px;color:#5a7488">${s.rallier} → ${s.player} · ${s.team}</span></div>
        <div class="pa-card-body"><div class="pa-actor-duo">${_paPortrait(s.rallier, 'lg', s.color)}${_paPortrait(s.player, 'lg', s.color)}</div><div><div class="pa-card-txt">${s.text}</div><div class="pa-card-meta">${s.meta || ''}</div></div></div></div>`;
    } else if (s.stepType === 'roundwin') {
      inner = `<div class="pa-card" style="border-color:${s.color}66"><div class="pa-card-head"><span class="pa-badge b-win">🏁 ROUND ${s.round} — ${s.team.toUpperCase()}</span><span style="font-size:11px;color:#5a7488">${(s.standings || []).map(t => `${t.name} ${t.wins}`).join(' — ')}</span></div>
        <div class="pa-card-body"><span class="pa-actor">${_paEmblem(s.team, 'lg', s.color)}<span class="pa-actor-badge">🏁</span></span><div><div class="pa-card-txt">${s.text}</div><div class="pa-card-meta">${s.meta || ''}</div></div></div></div>`;
    } else { // event
      const avas = (s.players || []).slice(0, 2).map(p => _paPortrait(p, 'md', s.color)).join('');
      inner = `<div class="pa-card pa-social"><div class="pa-card-head"><span class="pa-badge b-${s.badgeClass || 'cheer'}">${s.badgeText || 'MOMENT'}</span><span style="font-size:11px;color:#5a7488">${s.team} · the sand</span></div>
        <div class="pa-card-body"><div class="pa-actor-duo">${avas}</div><div><div class="pa-card-txt">${s.text || ''}</div><div class="pa-card-meta">${s.consequences || ''}</div></div></div></div>`;
    }
    return `<div class="pa-step" id="pa-step-${suffix}-${i}">${inner}</div>`;
  }).join('');

  return _shell(`<div class="pa-body">
    <div><div class="pa-stage">${cards}</div>
      <div style="height:40vh;pointer-events:none"></div>
      <div class="pa-controls" id="pa-controls-${suffix}">
        <button class="pa-btn" onclick="polesApartRevealNext('pa-${suffix}',${steps.length})">🏖️ Next Beat</button>
        <span class="pa-counter" id="pa-counter-${suffix}">0 / ${steps.length}</span>
        <button class="pa-btn ghost" onclick="polesApartRevealAll('pa-${suffix}',${steps.length})">Skip to result</button>
      </div></div>
    <div class="pa-side">
      <div class="pa-side-card"><div class="pa-side-h">🏖️ Round Status — live</div><div id="pa-sidebar-inner">${_paSidebarInner(data, -1)}</div></div>
      <div class="pa-side-card"><div class="pa-side-h">🏁 Rounds</div><div id="pa-rounds-inner">${_paRoundsInner(data, -1)}</div></div>
    </div></div>`, ep, data);
}
function _cardActor(s, cls, badge, sub, actorHtml) {
  return `<div class="pa-card"><div class="pa-card-head"><span class="pa-badge ${cls}">${badge}</span><span style="font-size:11px;color:#5a7488">${sub}</span></div>
    <div class="pa-card-body">${actorHtml}<div><div class="pa-card-txt">${s.text}</div><div class="pa-card-meta">${s.meta || ''}</div></div></div></div>`;
}

// ── SCREEN 3: results ──
export function rpBuildPolesApartResults(ep) {
  const data = ep.polesApart; if (!data) return '';
  const ranked = (data.teams || []).slice().sort((a, b) => (b.roundWins - a.roundWins) || (b.downsDealt - a.downsDealt) || (a.holdersLost - b.holdersLost));
  const rows = ranked.map((t, i) => {
    const isWin = t.name === data.winner, isLose = t.name === data.loser;
    const tag = isWin ? 'WINS IMMUNITY' : isLose ? 'GOES TO TRIBAL' : 'SAFE';
    const tagCol = isWin ? '#2ba36a' : isLose ? '#d8532e' : '#5a7488';
    const wonRounds = (data.rounds || []).filter(r => r.winner === t.name).map(r => r.round);
    const tbNote = (t.name === data.tiebreakWinner || t.name === data.tiebreakLoser)
      ? ` · <b style="color:#0a6ba8">${t.downsDealt} rivals dragged</b>` : '';
    return `<div class="pa-result-row" style="border-color:${t.color};background:${t.color}14">
      <span class="pa-rank" style="color:${t.color}">${i + 1}</span>
      <div style="flex:1"><div style="font-weight:800;color:${t.color}">${t.name.toUpperCase()}</div>
        <div style="font-size:11px;color:#5a7488">${t.roundWins} round${t.roundWins === 1 ? '' : 's'} won${wonRounds.length ? ` (${wonRounds.map(r => 'R' + r).join(', ')})` : ''}${tbNote}</div></div>
      <span style="font-weight:800;font-size:11px;color:${tagCol}">${tag}</span></div>`;
  }).join('');
  const tiebroke = data.tiebreakWinner || data.tiebreakLoser;
  return _shell(`<div class="pa-body"><div><div class="pa-side-card">
      <div style="font-family:'Righteous';color:#0a6ba8;font-size:16px;margin-bottom:10px">🏆 BEST OF THREE</div>${rows}
      <div style="font-size:12px;color:#5a7488;margin-top:8px;line-height:1.5">Most rounds won takes immunity. The team left in the sand heads to tribal council.${tiebroke ? ` <b style="color:#0a6ba8">Rounds were tied</b> — broken by total rivals dragged across the line.` : ''}</div></div></div>
    <div class="pa-side"><div class="pa-side-card"><div class="pa-side-h">🏁 Rounds</div><div id="pa-rounds-inner">${_paRoundsInner(data, (data.steps || []).length - 1)}</div></div></div></div>`, ep, data);
}
