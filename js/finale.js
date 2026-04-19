// js/finale.js - Finale simulation: final challenge, jury vote, fan campaign, fan vote
import { gs, gsCheckpoints, seasonConfig, players, repairGsSets } from './core.js';
import { pStats, pronouns } from './players.js';
import { getBond, addBond } from './bonds.js';
import { handleAdvantageInheritance } from './advantages.js';
import { simulateIndividualChallenge } from './challenges-core.js';
import { generateCampEvents } from './camp-events.js';

// Functions still in simulator.html inline script — accessed via window at call time:
//   saveGameState, snapshotGameState

export function ordinal(n) {
  const s = ['th','st','nd','rd'], v = n % 100;
  return n + (s[(v-20)%10] || s[v] || s[0]);
}

// ══════════════════════════════════════════════════════════════════════
// ENGINE: FINALE
// ══════════════════════════════════════════════════════════════════════

// Replace generic camp events with finale-themed "last day" events
export function generateFinaleCampOverride(ep, finalists) {
  const campKey = Object.keys(ep.campEvents || {})[0] || 'merge';
  const events = [];
  const _pick = (arr, seed) => arr[([...seed].reduce((a,c)=>a+c.charCodeAt(0),0)+(ep.num||0)*7)%arr.length];

  // 1. Opening atmosphere — the last morning
  const openers = [
    `The fire burned low overnight. Nobody relit it. The game doesn\u2019t need warmth anymore \u2014 it needs an ending.`,
    `The sun rises on the last day. The camp feels different. Smaller. The empty spots where the others used to sit say more than anyone will today.`,
    `Morning. The last one. The sounds are the same \u2014 birds, waves, wind through the shelter. But everything feels heavier.`,
    `There are ${finalists.length} torches left. ${finalists.length} people. After today, there will be one.`,
  ];
  events.push({ type: 'atmosphere', text: _pick(openers, 'open' + finalists.join('')), players: finalists, badge: null });

  // 2. Per-finalist reflection — looking back on the game
  finalists.forEach(f => {
    const s = pStats(f);
    const fp = pronouns(f);
    const wins = (gs.episodeHistory || []).filter(e => e.immunityWinner === f).length;
    const votesAgainst = (gs.episodeHistory || []).reduce((sum, e) =>
      sum + ((e.votingLog || []).filter(v => v.voted === f && v.voter !== 'THE GAME').length), 0);
    const elimCount = (gs.episodeHistory || []).filter(e => e.eliminated || e.firstEliminated).length;
    const daysPlayed = ep.num > 1 ? (ep.num - 1) * 3 : 1;

    const reflections = [];
    if (s.strategic >= 8)
      reflections.push(`${f} sits alone, running the numbers one last time. Every vote, every alliance, every move that led here. "I made this happen. Today I finish it."`);
    else if (s.social >= 8)
      reflections.push(`${f} takes a walk around camp. Past the shelter ${fp.sub} built. Past the fire pit where every real conversation happened. "I\u2019m going to miss this place. Not the game \u2014 the people."`);
    else if (wins >= 2)
      reflections.push(`${f} stares at the challenge course in the distance. ${wins} wins got ${fp.obj} here. "One more. That\u2019s all I need. One more."`);
    else if (votesAgainst >= 5)
      reflections.push(`${f} counts the empty torches. ${votesAgainst} times they came for ${fp.obj}. ${votesAgainst} times ${fp.sub} survived. "They tried everything. I\u2019m still here."`);
    else if (s.loyalty >= 8)
      reflections.push(`${f} looks at the names scratched into the shelter wall. Every player who was here. "I kept my promises. Most of them. The ones that mattered."`);
    else
      reflections.push(`${f} sits by the water\u2019s edge. ${daysPlayed} days. "I never thought I\u2019d make it this far. But I did. And today I find out if it was enough."`);

    if (s.temperament <= 3)
      reflections.push(`${f} is restless. Pacing. Fidgeting. The calm before the finale doesn\u2019t suit ${fp.obj}. "I can\u2019t just sit here. I need this to start."`);
    else if (s.boldness >= 8)
      reflections.push(`${f} looks at the other finalists and grins. "I outplayed all of you. The only question is whether you\u2019re honest enough to admit it tonight."`);

    events.push({ type: 'reflection', text: _pick(reflections, f + 'reflect'), players: [f], badge: null });
  });

  // 3. Relationship moment — the strongest bond among finalists
  let bestPair = null, bestBond = -Infinity;
  for (let i = 0; i < finalists.length; i++) {
    for (let j = i + 1; j < finalists.length; j++) {
      const b = getBond(finalists[i], finalists[j]);
      if (b > bestBond) { bestBond = b; bestPair = [finalists[i], finalists[j]]; }
    }
  }
  if (bestPair && bestBond >= 1) {
    const [a, b] = bestPair;
    const bondTexts = bestBond >= 3 ? [
      `${a} and ${b} sit together one last time. They built something real out here. In a few hours, they\u2019ll be trying to take it from each other. Neither of them mentions that.`,
      `${a} looks at ${b}. "Whatever happens tonight \u2014 we did this together." ${b} nods. They both know what\u2019s coming.`,
    ] : [
      `${a} and ${b} share a quiet moment by the fire. Not allies, not enemies \u2014 just two people who survived the same game. "Good luck tonight." "You too."`,
    ];
    events.push({ type: 'bond', text: _pick(bondTexts, a + b + 'finalbond'), players: bestPair, badge: null });
  }

  // 4. Rivalry moment — the lowest bond among finalists
  let worstPair = null, worstBond = Infinity;
  for (let i = 0; i < finalists.length; i++) {
    for (let j = i + 1; j < finalists.length; j++) {
      const b = getBond(finalists[i], finalists[j]);
      if (b < worstBond) { worstBond = b; worstPair = [finalists[i], finalists[j]]; }
    }
  }
  if (worstPair && worstBond <= -1) {
    const [a, b] = worstPair;
    const rivalTexts = [
      `${a} and ${b} don\u2019t speak this morning. They haven\u2019t spoken in days. The game put them on opposite sides and nothing about the finale will fix that.`,
      `${a} catches ${b}\u2019s eye across camp. No words. Just the understanding that one of them is about to end the other\u2019s game. For good.`,
    ];
    events.push({ type: 'rivalry', text: _pick(rivalTexts, a + b + 'rival'), players: worstPair, badge: null });
  }

  // 5. Closing — burning the shelter / saying goodbye to camp
  const closers = [
    `The finalists stand together. They look at the shelter one last time. ${finalists[0]} picks up a torch. "It\u2019s time." The shelter burns. The game ends where it started \u2014 with fire.`,
    `They walk out of camp single file. Nobody looks back. The game is ahead of them now, not behind.`,
    `${finalists[0]} douses the fire. The smoke rises and disappears. "That\u2019s it. That\u2019s the last camp." They grab their torches and leave.`,
    `The last meal. The last conversation. The last time this camp will hold all of them. Then they leave \u2014 and the game takes over.`,
  ];
  events.push({ type: 'closing', text: _pick(closers, 'close' + finalists.join('')), players: finalists, badge: null });

  // Override the camp events — replace whatever was generated
  const override = { pre: events };
  ep.campEvents = { [campKey]: override };
}

export function simulateFinale() {
  const cfg = seasonConfig;
  // Fire-making / Koh-Lanta override — ensure F4 even if loaded from save
  if ((cfg.firemaking || cfg.finaleFormat === 'fire-making' || cfg.finaleFormat === 'koh-lanta') && cfg.finaleSize < 4) cfg.finaleSize = 4;
  const epNum = gs.episode + 1;
  const players = [...gs.activePlayers];
  // Save checkpoint before finale so it can be replayed
  gsCheckpoints[epNum] = JSON.parse(JSON.stringify(gs));
  repairGsSets(gsCheckpoints[epNum]);
  try {
    localStorage.setItem('simulator_cp_' + epNum, JSON.stringify(gsCheckpoints[epNum]));
  } catch(e) {
    const _pruneKeys = Object.keys(localStorage)
      .filter(k => k.startsWith('simulator_cp_') && k !== 'simulator_cp_' + epNum)
      .sort((a, b) => parseInt(a.replace('simulator_cp_', '')) - parseInt(b.replace('simulator_cp_', '')));
    const _pruneCount = Math.max(1, Math.ceil(_pruneKeys.length / 2));
    _pruneKeys.slice(0, _pruneCount).forEach(k => { localStorage.removeItem(k); delete gsCheckpoints[parseInt(k.replace('simulator_cp_', ''))]; });
    try { localStorage.setItem('simulator_cp_' + epNum, JSON.stringify(gsCheckpoints[epNum])); } catch(e2) {}
  }

  const ep = {
    num: epNum, isFinale: true, challengeType: 'individual',
    alliances: [], votingLog: [], votes: {},
    idolFinds: [], idolPlays: [], idolRehide: false,
    journey: null, twist: null, campEvents: {},
    finaleEntrants: [...players], // snapshot of all players entering the finale (before any eliminations)
  };

  generateCampEvents(ep, 'both');

  // ── Override camp events with finale-themed "last day" events ──
  generateFinaleCampOverride(ep, players);

  // Final immunity challenge — skip for fan-vote F2 (no one to cut)
  const _skipImmunity = cfg.finaleFormat === 'fan-vote' && cfg.finaleSize <= 2;
  if (!_skipImmunity) {
    const immResult = simulateIndividualChallenge(players, null);
    ep.immunityWinner = immResult?.name || players[0];
    ep.challengeLabel = immResult?.challengeType || 'Mixed';
    ep.chalPlacements = immResult?.chalPlacements || null;
  }

  let finalists = [...players];

  // ── FIRE-MAKING FINALE: forced F4 → decision → fire duel → F3 enters finaleFormat ──
  if (cfg.firemaking && players.length === 4) {
    const _fmImmWinner = ep.immunityWinner;
    const _fmOthers = players.filter(p => p !== _fmImmWinner);
    const _fmS = pStats(_fmImmWinner);

    // THE DECISION: immunity winner picks one person to save
    let _fmSaved, _fmSavedReason;
    const _fmUseStrategy = Math.random() < _fmS.strategic * 0.1; // stat 5=50%, stat 8=80%, stat 10=100%

    if (_fmUseStrategy) {
      // Strategic read: project jury votes, save the person I can BEAT at FTC
      const _fmProjections = _fmOthers.map(candidate => {
        const trio = [_fmImmWinner, candidate, ..._fmOthers.filter(p => p !== candidate).slice(0, 1)];
        const projected = projectJuryVotes([_fmImmWinner, ...(_fmOthers.filter(p => p !== candidate))]);
        const myVotes = projected[_fmImmWinner] || 0;
        const theirVotes = Math.max(..._fmOthers.filter(p => p !== candidate).map(r => projected[r] || 0), projected[candidate] || 0);
        return { name: candidate, margin: myVotes - theirVotes, juryThreat: projected[candidate] || 0 };
      });
      // Save the WEAKEST jury threat (easiest to beat at FTC)
      _fmProjections.sort((a, b) => a.juryThreat - b.juryThreat);
      _fmSaved = _fmProjections[0].name;
      _fmSavedReason = 'strategic';
    } else {
      // Bond-based: save closest ally
      _fmSaved = _fmOthers.sort((a, b) => getBond(_fmImmWinner, b) - getBond(_fmImmWinner, a))[0];
      _fmSavedReason = 'bond';
    }

    // The two NOT saved go to fire-making
    const _fmCompetitors = _fmOthers.filter(p => p !== _fmSaved);

    // FIRE-MAKING DUEL
    const _fmScores = _fmCompetitors.map(p => {
      const s = pStats(p);
      return {
        name: p,
        score: s.physical * 0.4 + s.endurance * 0.4 + s.temperament * 0.2 + (Math.random() * 3 - 1.5),
      };
    });
    _fmScores.sort((a, b) => b.score - a.score);
    const _fmWinner = _fmScores[0].name;
    const _fmLoser = _fmScores[1].name;

    // Store data
    ep.firemakingDecision = {
      immunityWinner: _fmImmWinner,
      saved: _fmSaved,
      savedReason: _fmSavedReason,
      competitors: [_fmCompetitors[0], _fmCompetitors[1]],
    };
    ep.firemakingResult = {
      winner: _fmWinner,
      loser: _fmLoser,
      winnerScore: Math.round(_fmScores[0].score * 10) / 10,
      loserScore: Math.round(_fmScores[1].score * 10) / 10,
    };
    ep.firemaking = true;

    // Eliminate the loser (4th place)
    handleAdvantageInheritance(_fmLoser, ep);
    ep.eliminated = _fmLoser;
    gs.eliminated.push(_fmLoser);
    gs.jury.push(_fmLoser);
    gs.activePlayers = gs.activePlayers.filter(p => p !== _fmLoser);

    // F3 proceeds to finale format
    finalists = [_fmImmWinner, _fmSaved, _fmWinner];
    ep.finaleFinalists = finalists;

    // Bond consequences
    addBond(_fmImmWinner, _fmSaved, 2.0); // saving someone is a massive trust gesture
    addBond(_fmWinner, _fmImmWinner, -0.5); // fire winner might resent not being saved

    // Skip the finaleSize cut logic below — fire-making already handled the cut
  }

  // ── KOH-LANTA FINALE: orienteering → perch → choice → F2 FTC ──
  if (cfg.finaleFormat === 'koh-lanta' && players.length === 4) {
    const _pick = arr => arr[Math.floor(Math.random() * arr.length)];

    // ── STEP 1: ORIENTEERING RACE (F4 → F3) ──
    const _orScores = players.map(p => {
      const s = pStats(p);
      return {
        name: p,
        score: s.mental * 0.3 + s.intuition * 0.25 + s.physical * 0.2 + s.endurance * 0.15 + s.strategic * 0.1 + (Math.random() * 5 - 2.5),
      };
    }).sort((a, b) => b.score - a.score);

    const _orPlacements = _orScores.map(s => s.name);
    const _orEliminated = _orPlacements[3]; // last place
    const _or1Pr = pronouns(_orPlacements[0]), _or2Pr = pronouns(_orPlacements[1]);
    const _or3Pr = pronouns(_orPlacements[2]), _or4Pr = pronouns(_orEliminated);
    const _or1S = pStats(_orPlacements[0]), _or2S = pStats(_orPlacements[1]);
    const _or3S = pStats(_orPlacements[2]), _or4S = pStats(_orEliminated);
    // Determine if any two players have a strong bond (might follow each other)
    const _orBonds = [];
    for (let i = 0; i < 4; i++) for (let j = i+1; j < 4; j++) _orBonds.push({ a: _orPlacements[i], b: _orPlacements[j], bond: getBond(_orPlacements[i], _orPlacements[j]) });
    _orBonds.sort((a,b) => b.bond - a.bond);
    const _orRival = _orBonds.find(b => b.bond <= -1);
    const _orAlly = _orBonds.find(b => b.bond >= 2);
    // The two slowest — locked in a race for last
    const _orSlow1 = _orPlacements[2], _orSlow2 = _orPlacements[3];
    const _s1Pr = pronouns(_orSlow1), _s2Pr = pronouns(_orSlow2);
    const _s1S = pStats(_orSlow1), _s2S = pStats(_orSlow2);

    const _orStages = [
      // 1. THE START
      { type: 'start', text: _pick([
        `Four players. Four maps. Four compasses. Somewhere in that jungle, four daggers are hidden — one for each of them. The first three to return with their dagger survive. The last one is eliminated on the spot. No tribal. No vote. No second chance. The host raises a hand — and drops it. They scatter.`,
        `The host lays it out: four colored beacons are hidden in the jungle. Each one holds coordinates to a dagger. Find the beacon, decode the direction, retrieve the dagger. First three back are safe. The fourth goes home. ${_orPlacements.join(', ')} — all four take one last look at each other. Then they run.`,
      ]) },
      // 2. WAITING — nobody's come back yet
      { type: 'waiting', text: _pick([
        `Five minutes. Nothing. The clearing is empty. The jury watches the treeline. Somewhere in there, four people are fighting for their lives with a compass and a piece of paper. A bird screams. Nobody laughs.`,
        `It's been seven minutes. No horn. No movement in the trees. Just the jungle sounds and the host standing at the finish line, waiting. The crew adjusts the cameras. The jury shifts in their seats. Everyone's thinking the same thing: who's lost out there?`,
        `The minutes stretch. No sign of anyone. ${_orPlacements[0]} and ${_orPlacements[1]} went east. ${_orPlacements[2]} and ${_orEliminated} went west. The jungle has swallowed all four of them. The heat is brutal — the kind that melts your focus and makes the compass swim.`,
      ]) },
      // 3. JUNGLE CHAOS — what's happening in there
      { type: 'jungle', text: (() => {
        const _jTexts = [];
        // Compass/navigation struggle
        if (_or4S.mental <= 4) _jTexts.push(`Deep in the jungle, ${_orEliminated} is turning the map sideways, then upside down. ${_or4Pr.Sub} can't make the compass work — north keeps shifting, or maybe ${_or4Pr.sub} ${_or4Pr.sub==='they'?'are':'is'} the one shifting. ${_or4Pr.Sub} ${_or4Pr.sub==='they'?'pick':'picks'} a direction and ${_or4Pr.sub==='they'?'commit':'commits'}.`);
        else _jTexts.push(`In the jungle, ${_orEliminated} is methodical — reading the map, checking the compass, recalibrating. But methodical takes time. And time is the one thing ${_or4Pr.sub} ${_or4Pr.sub==='they'?'don\'t':'doesn\'t'} have.`);
        // Following / same path
        if (_orAlly && ((_orAlly.a === _orSlow1 && _orAlly.b === _orSlow2) || (_orAlly.b === _orSlow1 && _orAlly.a === _orSlow2)))
          _jTexts.push(`${_orSlow1} and ${_orSlow2} started heading the same direction — old habits from being allies. But there's only one dagger per beacon. At some point, one of them is going to realize they're wasting time following a friend.`);
        else if (Math.random() < 0.5)
          _jTexts.push(`${_orSlow2} doesn't know where to go. ${_s2Pr.Sub} ${_s2Pr.sub==='they'?'spot':'spots'} ${_orSlow1} through the trees and ${_s2Pr.sub==='they'?'start':'starts'} following — maybe ${_s1Pr.sub} ${_s1Pr.sub==='they'?'know':'knows'} something. ${_orSlow1} hasn't noticed yet.`);
        else
          _jTexts.push(`Somewhere in the east quadrant, two players nearly collide at the same beacon. They both grab for the coordinates — but there's only one set. One of them takes it and runs. The other has to find another beacon.`);
        return _jTexts.join(' ');
      })() },
      // 4. FIRST HORN
      { type: 'horn1', player: _orPlacements[0], text: _pick([
        `Then — a horn blasts through the trees. ${_orPlacements[0]} breaks out of the undergrowth, dagger raised high. ${_or1S.mental >= 7 ? `${_or1Pr.Sub} read the map like it was second nature — beacon found, coordinates decoded, dagger recovered before the others even had a bearing.` : _or1S.physical >= 7 ? `Pure speed. ${_or1Pr.Sub} covered more ground than anyone and found ${_or1Pr.pos} beacon first.` : `${_or1Pr.Sub} got lucky — found the beacon early and never second-guessed the bearing.`} Safe. Three still out there.`,
        `A horn rips through the silence. ${_orPlacements[0]} emerges at a dead sprint, dagger in hand. ${_or1Pr.Sub} ${_or1Pr.sub==='they'?'slam':'slams'} it into the pedestal. Safe. The three still in the jungle hear that horn — and the panic sets in.`,
      ]) },
      // 5. AFTER FIRST HORN — pressure building
      { type: 'pressure1', text: _pick([
        `${_orPlacements[0]} catches ${_or1Pr.pos} breath at the finish line, mud-streaked and winded. ${_or1Pr.Sub} ${_or1Pr.sub==='they'?'look':'looks'} back at the jungle. "Come on," ${_or1Pr.sub} ${_or1Pr.sub==='they'?'whisper':'whispers'}. Nobody knows who ${_or1Pr.sub}'s talking to.`,
        `One spot filled. Two left. The horn echoes and fades. In the jungle, three people just heard the starting gun of a race they're losing. The calculations change — it's not about finding your dagger anymore. It's about not being the last one to find it.`,
        `The waiting resumes. Longer this time. The heat isn't letting up. It's past noon and the jungle is an oven. Whatever stamina they had at the start is being cooked out of them step by step.`,
      ]) },
      // 6. SECOND HORN
      { type: 'horn2', player: _orPlacements[1], text: _pick([
        `The second horn. ${_orPlacements[1]} appears at the clearing's edge, legs shaking, mud-streaked, dagger in hand. ${_or2S.intuition >= 7 ? `${_or2Pr.Sub} found the beacon early but got turned around — instinct got ${_or2Pr.obj} back on track.` : `It wasn't pretty — wrong turns, retracing steps — but the dagger is in ${_or2Pr.pos} hand.`} Safe. One spot left. ${_orPlacements[2]} and ${_orEliminated} — one of them is going home.`,
        `The second horn echoes. ${_orPlacements[1]} staggers back, holding the dagger like a lifeline. ${_or2Pr.Sub} ${_or2Pr.sub==='they'?'collapse':'collapses'} at the finish. One dagger remains. Two players are fighting for it somewhere in that jungle.`,
      ]) },
      // 7. THE RACE FOR LAST — extended suspense
      { type: 'raceForLast', text: (() => {
        const _rl = [];
        _rl.push(`${_orSlow1} and ${_orSlow2}. One of them will survive. One of them won't. The clearing is silent.`);
        // Time passage
        _rl.push(_pick([
          `Twenty minutes pass. Then twenty-five. The shadows are getting longer. ${_orPlacements[0]} and ${_orPlacements[1]} sit at the finish line, watching the treeline, saying nothing.`,
          `It's been over half an hour. The jungle is brutally quiet. Every snap of a branch in the distance makes the jury turn their heads. Nothing. Nothing. Nothing.`,
          `The waiting is unbearable. It's so hot that the air itself seems to shimmer above the clearing. The crew starts exchanging looks. How long can this go on?`,
        ]));
        // What the two are doing
        if (_s1S.physical >= 7 && _s2S.physical < 5)
          _rl.push(`${_orSlow1} is covering ground fast but reading the map wrong. ${_orSlow2} is reading the map right but can barely run. It's a race between legs and brains.`);
        else if (_orRival && ((_orRival.a === _orSlow1 && _orRival.b === _orSlow2) || (_orRival.b === _orSlow1 && _orRival.a === _orSlow2)))
          _rl.push(`Somewhere in the trees, ${_orSlow1} and ${_orSlow2} cross paths. They lock eyes. There's nothing to say — they've been rivals all season. Now one of them ends the other's game. They split in opposite directions.`);
        else
          _rl.push(_pick([
            `${_orSlow2} can hear ${_orSlow1} crashing through the undergrowth nearby. ${_s2Pr.Sub} doesn't know if that means ${_orSlow1} is close to the dagger or just as lost as ${_s2Pr.sub} ${_s2Pr.sub==='they'?'are':'is'}.`,
            `${_orSlow1} finds a beacon — wrong color. It's not ${_s1Pr.pos}. ${_s1Pr.Sub} ${_s1Pr.sub==='they'?'slam':'slams'} a fist against a tree and ${_s1Pr.sub==='they'?'keep':'keeps'} moving. Every wrong turn feels like a death sentence.`,
          ]));
        return _rl.join(' ');
      })() },
      // 8. THIRD HORN + ELIMINATION
      { type: 'horn3', player: _orPlacements[2], eliminated: _orEliminated, text: _pick([
        `Then — movement in the treeline. ${_orPlacements[2]} stumbles into the clearing, barely standing, dagger in hand. The third horn sounds. Safe. The other three watch the jungle. Minutes pass. Finally, ${_orEliminated} appears — slow, empty-handed. ${_or4S.temperament >= 7 ? `${_or4Pr.Sub} ${_or4Pr.sub==='they'?'take':'takes'} a breath, ${_or4Pr.sub==='they'?'nod':'nods'}, and ${_or4Pr.sub==='they'?'accept':'accepts'} it.` : `The look on ${_or4Pr.pos} face says everything.`} It's over.`,
        `The third horn. ${_orPlacements[2]} crashes through the trees holding a dagger. Safe. Then the wait. The long, awful wait. When ${_orEliminated} finally emerges — no dagger — ${_or4Pr.sub} ${_or4Pr.sub==='they'?'don\'t':'doesn\'t'} need to be told. ${_or4S.social >= 7 ? `${_or4Pr.Sub} ${_or4Pr.sub==='they'?'hug':'hugs'} each of the remaining three before walking away.` : `${_or4Pr.Sub} ${_or4Pr.sub==='they'?'stand':'stands'} there for a moment. Then ${_or4Pr.sub} ${_or4Pr.sub==='they'?'turn':'turns'} and ${_or4Pr.sub==='they'?'walk':'walks'} away.`}`,
      ]) },
    ];

    ep.klOrienteering = { placements: _orPlacements, eliminated: _orEliminated, scores: Object.fromEntries(_orScores.map(s => [s.name, Math.round(s.score * 10) / 10])), stages: _orStages };

    // Eliminate 4th place
    handleAdvantageInheritance(_orEliminated, ep);
    gs.eliminated.push(_orEliminated);
    gs.jury.push(_orEliminated);
    gs.activePlayers = gs.activePlayers.filter(p => p !== _orEliminated);

    // ── STEP 2: THE PERCH (F3 → immunity winner) ──
    const _perchPlayers = _orPlacements.slice(0, 3); // F3
    const _perchCumulative = Object.fromEntries(_perchPlayers.map(p => [p, 0]));
    const _perchPhases = [];
    const _perchDropOrder = [];
    const _phasePlatforms = ['21×16 cm (full)', '16×16 cm (first peg removed)', '10×16 cm (second peg removed)', '10×10 cm (final stage)'];

    for (let phase = 0; phase < 4; phase++) {
      const remaining = _perchPlayers.filter(p => !_perchDropOrder.includes(p));
      if (remaining.length <= 1) break;

      // Score this phase
      remaining.forEach(p => {
        const s = pStats(p);
        const phaseScore = s.endurance * 0.4 + s.temperament * 0.3 + s.physical * 0.2 + s.mental * 0.1 + (Math.random() * 4 - 2);
        _perchCumulative[p] += phaseScore;
      });

      // Sort by cumulative (lowest = most likely to drop)
      const sorted = remaining.sort((a, b) => _perchCumulative[a] - _perchCumulative[b]);
      const weakest = sorted[0];

      // Drop logic: phase 0 = no drop, phase 1 = 40% chance, phase 2+ = guaranteed
      const dropChance = phase === 0 ? 0 : phase === 1 ? 0.4 : 1.0;
      const drops = Math.random() < dropChance;

      let phaseText;
      if (phase === 0) {
        phaseText = _pick([
          `The three finalists step onto their perches. Platform: ${_phasePlatforms[0]}. Wide enough to stand comfortably — but that won't last. The host explains: every few minutes, they'll each pull a cord that removes a peg from beneath their platform. The surface shrinks. Last one standing wins immunity and gets to choose who sits next to them at Final Tribal Council. The jungle goes quiet. Nobody moves. The challenge begins.`,
          `${remaining.join(', ')} take their positions on the wooden perches. ${_phasePlatforms[0]}. The host reminds them what's at stake: the person who outlasts the other two doesn't just win immunity — they choose their opponent at FTC. This isn't just about endurance. It's about who gets to decide the entire outcome of this game. The first minutes pass in silence. Everyone is steady. For now.`,
          `Three perches. Three players. One winner. The platforms are ${_phasePlatforms[0]} — generous, but temporary. The mechanism is simple: pull the cord, lose a peg, lose surface. The challenge is patience. The stakes are everything. ${remaining[0]} closes ${pronouns(remaining[0]).pos} eyes. ${remaining[1]} stares straight ahead. ${remaining[2]} looks down at the platform beneath ${pronouns(remaining[2]).pos} feet — measuring it, memorizing it. They all know it's about to get smaller.`,
        ]);
      } else if (phase === 3 && remaining.length === 2) {
        // Final showdown
        const [a, b] = remaining;
        const winner = _perchCumulative[a] > _perchCumulative[b] ? a : b;
        const loser = winner === a ? b : a;
        const _wPrF = pronouns(winner), _lPrF = pronouns(loser);
        const _wSF = pStats(winner), _lSF = pStats(loser);
        _perchDropOrder.push(loser);
        phaseText = _pick([
          `Platform: ${_phasePlatforms[3]}. One foot each. ${a} and ${b} are both shaking — calves burning, ankles screaming. Neither speaks. The jury watches from the bench. The wind picks up. A bird screams somewhere above them. Five minutes. Ten. Then ${loser}'s knee buckles — ${_lPrF.sub} ${_lPrF.sub==='they'?'try':'tries'} to correct — overcorrects. ${_lPrF.Sub} ${_lPrF.sub==='they'?'grab':'grabs'} at air. Falls. ${winner} doesn't move. Doesn't celebrate. Just stands there — one foot on a 10-centimeter platform, the last person standing. It's over.`,
          `The final stage. ${_phasePlatforms[3]}. Nothing left to hold. The platform is barely bigger than a hand. ${a} and ${b} are trembling — not from cold, but from the muscle fatigue that comes after standing still for this long. The jury is on the edge of their seats. Minutes feel like hours. ${_wSF.endurance >= 7 ? `${winner}'s breathing is slow, controlled — ${_wPrF.sub} ${_wPrF.sub==='they'?'have':'has'} been training for this ${_wPrF.pos} whole life.` : `${winner} is hurting — but ${_wPrF.sub} ${_wPrF.sub==='they'?'refuse':'refuses'} to show it.`} Then ${loser}'s balance shifts — a fraction too far. ${_lPrF.Sub} ${_lPrF.sub==='they'?'reach':'reaches'} for the perch — too late. ${winner} is the last one standing. The jury erupts.`,
          `${_phasePlatforms[3]}. One foot. No room for error. ${a} and ${b} have been up here for what feels like an eternity. ${_lSF.temperament >= 7 ? `${loser} has been remarkably composed — until now. The tremor starts in ${_lPrF.pos} ankle and works upward.` : `${loser} has been fighting ${_lPrF.pos} body for the last ten minutes — and the body is winning.`} The wind gusts. ${loser} sways. Catches it. Sways again. This time there's nothing left to catch. ${_lPrF.Sub} steps off the perch. ${winner} exhales for what might be the first time in twenty minutes. The host calls it: ${winner} wins the Perch.`,
        ]);
      } else if (drops) {
        _perchDropOrder.push(weakest);
        const _wPr = pronouns(weakest);
        const _wS = pStats(weakest);
        const _remainStr = remaining.filter(p => p !== weakest).join(' and ');
        phaseText = _pick([
          `Platform reduced to ${_phasePlatforms[phase]}. ${weakest} pulls the cord. The peg drops. The platform shrinks beneath ${_wPr.pos} feet. ${_wPr.Sub} ${_wPr.sub==='they'?'adjust':'adjusts'} — shifts weight to the center — but the new surface is merciless. A wobble. ${_wPr.Sub} ${_wPr.sub==='they'?'fight':'fights'} it. Arms out. Legs shaking. For a moment it looks like ${_wPr.sub} might hold. Then — ${_wPr.sub} ${_wPr.sub==='they'?'fall':'falls'}. The sound of feet hitting sand. ${_remainStr} remain. Neither of them looked down.`,
          `${_phasePlatforms[phase]} now. ${weakest} was solid on the last surface. But the cord pull changes everything — the platform shrinks and suddenly ${_wS.physical >= 7 ? `${_wPr.pos} strength becomes a liability. Too much weight, too little surface.` : `the math doesn't work. ${_wPr.Sub} ${_wPr.sub==='they'?'don\'t':'doesn\'t'} have the frame for this.`} ${_wPr.Sub} ${_wPr.sub==='they'?'fight':'fights'} it for twenty agonizing seconds — legs shaking, arms out, jaw clenched — but physics wins. Down. ${_remainStr} ${remaining.filter(p => p !== weakest).length > 1 ? 'are' : 'is'} still up. The challenge continues.`,
          `The cord pulls. ${_phasePlatforms[phase]}. ${weakest} recalibrates — feet together, center of gravity low — but the surface betrays ${_wPr.obj}. ${_wPr.Sub} ${_wPr.sub==='they'?'start':'starts'} to lean, ${_wPr.sub==='they'?'overcorrect':'overcorrects'}, and for one long second the outcome hangs in the air. Then gravity decides. ${weakest} is down. ${_wPr.Sub} ${_wS.temperament >= 6 ? `${_wPr.sub==='they'?'take':'takes'} it in stride — ${_wPr.sub==='they'?'nod':'nods'} to the others as ${_wPr.sub} ${_wPr.sub==='they'?'step':'steps'} off.` : `${_wPr.sub==='they'?'slam':'slams'} a fist against the post. ${_wPr.Sub} ${_wPr.sub==='they'?'know':'knows'} what this means.`} ${_remainStr} stand alone.`,
        ]);
      } else {
        const _wkPr = pronouns(weakest);
        phaseText = _pick([
          `Platform reduced to ${_phasePlatforms[phase]}. All ${remaining.length} pull their cords simultaneously. The platform shrinks. For a moment, everyone freezes — recalibrating, finding their center. ${weakest} wobbles — a sharp intake of breath from the jury — but ${_wkPr.sub} ${_wkPr.sub==='they'?'hold':'holds'}. Not yet. The challenge continues. But the cracks are showing.`,
          `${_phasePlatforms[phase]}. The surface is visibly smaller. ${remaining.join(', ')} recalibrate — feet closer together, arms out for balance. ${weakest} is working harder than the others — shifting weight more often, breathing faster. But ${_wkPr.sub} ${_wkPr.sub==='they'?'refuse':'refuses'} to fall. The jury leans forward. Everyone can feel it — someone is about to go. But not this round.`,
          `The pegs drop. ${_phasePlatforms[phase]}. Less room. More pressure. ${remaining.join(' and ')} all adjust. ${weakest} is the first to wobble — catches it with an arm swing that draws a gasp from the watching players — but ${_wkPr.sub} ${_wkPr.sub==='they'?'stay':'stays'} up. Barely. The host says nothing. The jungle says nothing. The challenge stretches on.`,
        ]);
      }

      _perchPhases.push({ phase, platform: _phasePlatforms[phase], text: phaseText, dropped: drops ? weakest : null, remaining: [...remaining] });

      // Add interlude beats between phases (time passing, heat, pain, faces, jury)
      const _intRemaining = _perchPlayers.filter(p => !_perchDropOrder.includes(p));
      if (_intRemaining.length >= 2 && phase < 3) {
        const _intWeak = _intRemaining.reduce((w, p) => _perchCumulative[p] < _perchCumulative[w] ? p : w, _intRemaining[0]);
        const _intStrong = _intRemaining.reduce((s, p) => _perchCumulative[p] > _perchCumulative[s] ? p : s, _intRemaining[0]);
        const _iwPr = pronouns(_intWeak), _isPr = pronouns(_intStrong);
        const _iwS = pStats(_intWeak), _isS = pStats(_intStrong);
        const _timeMarks = ['It\'s been forty-five minutes.', 'Over an hour now.', 'An hour and a half. Nobody expected this.', 'Two hours in.', 'It\'s been three hours. Nobody has moved.'];
        const _intTexts = [];
        // Time + conditions
        _intTexts.push(_pick([
          `${_timeMarks[Math.min(phase, _timeMarks.length - 1)]} The sun has shifted. The shadows have moved. The perches haven't.`,
          `${_timeMarks[Math.min(phase, _timeMarks.length - 1)]} The heat is relentless. Sweat rolls down every face. The wooden perch is slick now.`,
          `${_timeMarks[Math.min(phase, _timeMarks.length - 1)]} The jungle sounds have changed — the afternoon insects have taken over. Nobody on the perches notices. They're somewhere else entirely.`,
        ]));
        // Body language / pain
        _intTexts.push(_pick([
          `${_intWeak} can't feel ${_iwPr.pos} legs anymore. ${_iwPr.Sub} ${_iwPr.sub==='they'?'shift':'shifts'} weight from one foot to the other — each transfer a risk. The muscles have gone from burning to numb. ${_iwPr.Sub} ${_iwPr.sub==='they'?'don\'t':'doesn\'t'} know which is worse.`,
          `${_intStrong} hasn't moved in ten minutes. Eyes closed. Breathing slow. ${_isS.temperament >= 7 ? `${_isPr.Sub} ${_isPr.sub==='they'?'look':'looks'} almost meditative — like ${_isPr.sub} could stand here forever.` : `It's not calm — it's concentration so intense that everything else has disappeared.`}`,
          `${_intWeak}'s face is telling a story. The jaw is clenched. The eyes are wet — not crying, just the strain. ${_iwS.boldness >= 7 ? `${_iwPr.Sub} ${_iwPr.sub==='they'?'catch':'catches'} ${_intStrong}'s eye and ${_iwPr.sub==='they'?'grin':'grins'}. It's not real — it's defiance.` : `${_iwPr.Sub} ${_iwPr.sub==='they'?'stare':'stares'} straight ahead. Don't look down. Don't think about falling.`}`,
          `A cramp shoots through ${_intWeak}'s calf. ${_iwPr.Sub} ${_iwPr.sub==='they'?'flinch':'flinches'} — for one terrible second ${_iwPr.pos} balance wavers — then ${_iwPr.sub} ${_iwPr.sub==='they'?'steady':'steadies'}. The jury exhales. ${_intStrong} doesn't react. ${_isPr.Sub} heard it. ${_isPr.Sub} felt it. But ${_isPr.sub} ${_isPr.sub==='they'?'don\'t':'doesn\'t'} give ${_intWeak} the satisfaction.`,
        ]));
        // Opponent's face / jury
        if (phase >= 1) _intTexts.push(_pick([
          `The face of ${_intStrong} — steady, composed, almost bored — is the worst thing ${_intWeak} can see right now. It makes ${_iwPr.obj} want to hold on longer just to wipe that look off.`,
          `On the jury bench, someone whispers. ${_intWeak} can't hear what — but ${_iwPr.sub} ${_iwPr.sub==='they'?'see':'sees'} them looking. Are they impressed or are they already writing ${_iwPr.obj} off?`,
          `${_intStrong} opens ${_isPr.pos} eyes for the first time in minutes. ${_isPr.Sub} ${_isPr.sub==='they'?'look':'looks'} at ${_intWeak}. Not challenging. Not pitying. Just… acknowledging. We're both still here.`,
        ]));
        _perchPhases.push({ phase: phase + 0.5, platform: '', text: _intTexts.join(' '), dropped: null, remaining: [..._intRemaining], isInterlude: true });
      }
    }

    const _perchWinner = _perchPlayers.filter(p => !_perchDropOrder.includes(p))[0];
    ep.immunityWinner = _perchWinner; // override immunity from the orienteering challenge
    ep.klPerch = { phases: _perchPhases, dropOrder: _perchDropOrder, winner: _perchWinner, scores: { ..._perchCumulative } };

    // Perch victory = resume-worthy moment: jury respects the iconic endurance win
    gs.playerStates[_perchWinner] = gs.playerStates[_perchWinner] || { emotional: 'content', votesReceived: 0, lastVotedEp: null, bigMoves: 0 };
    gs.playerStates[_perchWinner].bigMoves = (gs.playerStates[_perchWinner].bigMoves || 0) + 1;
    gs.playerStates[_perchWinner].perchWinner = true; // tracked for jury bonus

    // ── STEP 3: THE CHOICE (winner picks F2 opponent) ──
    const _choiceOthers = _perchPlayers.filter(p => p !== _perchWinner);
    const _choiceS = pStats(_perchWinner);
    const _choiceUseStrategy = Math.random() < _choiceS.strategic * 0.1;
    let _choiceChosen, _choiceReason;

    if (_choiceUseStrategy) {
      // Jury projection: pick who I can beat
      const projections = _choiceOthers.map(opp => {
        const proj = projectJuryVotes([_perchWinner, opp]);
        return { name: opp, myVotes: proj[_perchWinner] || 0, theirVotes: proj[opp] || 0 };
      });
      projections.sort((a, b) => (b.myVotes - b.theirVotes) - (a.myVotes - a.theirVotes));
      _choiceChosen = projections[0].name; // pick the one I beat by the most
      _choiceReason = 'strategic';
    } else {
      // Bond: pick closest ally
      _choiceChosen = _choiceOthers.sort((a, b) => getBond(_perchWinner, b) - getBond(_perchWinner, a))[0];
      _choiceReason = 'bond';
    }

    const _choiceEliminated = _choiceOthers.find(p => p !== _choiceChosen);
    ep.klChoice = { winner: _perchWinner, chosen: _choiceChosen, eliminated: _choiceEliminated, reason: _choiceReason };

    // Eliminate 3rd place
    handleAdvantageInheritance(_choiceEliminated, ep);
    gs.eliminated.push(_choiceEliminated);
    gs.jury.push(_choiceEliminated);
    gs.activePlayers = gs.activePlayers.filter(p => p !== _choiceEliminated);

    // F2 finalists
    finalists = [_perchWinner, _choiceChosen];
    ep.finaleFinalists = finalists;
    ep.eliminated = _choiceEliminated; // last eliminated for history

    // Bond consequences — scale by betrayal severity
    const _choiceBondWithElim = getBond(_perchWinner, _choiceEliminated);
    const _choiceBondWithChosen = getBond(_perchWinner, _choiceChosen);
    addBond(_perchWinner, _choiceChosen, 2.0); // choosing someone = trust gesture
    if (_choiceBondWithElim >= 2) {
      // Cutting an ally = betrayal. The stronger the bond, the deeper the wound.
      // Bond ≥ 2 → -3.0 to -5.0, scaled by how close they were
      const _betrayalDamage = -(3.0 + Math.min(2.0, (_choiceBondWithElim - 2) * 0.5));
      addBond(_perchWinner, _choiceEliminated, _betrayalDamage);
      ep.klChoice.betrayal = true;
      ep.klChoice.preBond = _choiceBondWithElim;
    } else {
      // Not close — mild resentment
      addBond(_perchWinner, _choiceEliminated, -1.0);
    }
    // If winner picked someone they DON'T like over an ally, the chosen player gets a bond boost too (gratitude)
    if (_choiceBondWithChosen <= 0 && _choiceBondWithElim >= 2) {
      addBond(_choiceChosen, _perchWinner, 1.5); // unexpected save = gratitude
    }
  }

  // If 3 remain and need to cut to F2: finaleSize===2 (always cut), OR winner's-cut format with finaleSize===3 (winner decides who to cut)
  const _needsF3Cut = (cfg.finaleSize === 2) || (cfg.finaleFormat === 'jury-cut' && cfg.finaleSize === 3) || (cfg.finaleFormat === 'fan-vote' && cfg.finaleSize === 3);
  if (!ep.firemaking && !ep.klChoice && _needsF3Cut && players.length === 3 && cfg.finaleFormat !== 'final-challenge' && cfg.finaleFormat !== 'olympic-relay' && cfg.finaleFormat !== 'koh-lanta') {
    const others = players.filter(p => p !== ep.immunityWinner);
    let brought, cut;
    // Smart decision: immunity winner projects jury votes for each possible F2 pairing
    {
      const immWinner = ep.immunityWinner;
      const immS = pStats(immWinner);
      const pairings = others.map(partner => {
        const opponent = others.find(p => p !== partner);
        const projected = projectJuryVotes([immWinner, partner]);
        const margin = (projected[immWinner] || 0) - (projected[partner] || 0);
        return { partner, opponent, margin, bond: getBond(immWinner, partner) };
      });
      // Strategic players pick the most beatable opponent; loyal players lean toward allies
      const loyaltyWeight = immS.loyalty * 0.1;  // 0-1 range
      const stratWeight = immS.strategic * 0.1;
      pairings.forEach(p => {
        p.score = p.margin * (0.5 + stratWeight * 0.3) + p.bond * loyaltyWeight * 0.5;
      });
      pairings.sort((a, b) => b.score - a.score);
      brought = pairings[0].partner;
      cut = others.find(p => p !== brought);
      const projectedVotes = projectJuryVotes([immWinner, brought]);
      ep.finalCut = {
        winner: immWinner, brought, cut,
        reasoning: {
          projectedVotes,
          margin: pairings[0].margin,
          loyaltyDriven: loyaltyWeight > stratWeight,
          bondWithBrought: pairings[0].bond,
        }
      };
    }
    ep.eliminated = cut;
    gs.eliminated.push(cut);
    gs.jury.push(cut);
    gs.activePlayers = gs.activePlayers.filter(p => p !== cut);
    finalists = [ep.immunityWinner, brought];
  }

  // If finaleSize === 4: immunity winner cuts 1, top 3 go to FTC
  if (!ep.firemaking && !ep.klChoice && cfg.finaleSize === 4 && players.length === 4 && cfg.finaleFormat !== 'final-challenge' && cfg.finaleFormat !== 'olympic-relay' && cfg.finaleFormat !== 'koh-lanta') {
    const others4 = players.filter(p => p !== ep.immunityWinner);
    // Smart decision: project jury votes for each possible F3 trio
    const immWinner4 = ep.immunityWinner;
    const immS4 = pStats(immWinner4);
    const cutCandidates = others4.map(candidate => {
      const remaining = others4.filter(p => p !== candidate);
      const trio = [immWinner4, ...remaining];
      const projected = projectJuryVotes(trio);
      const myVotes = projected[immWinner4] || 0;
      const bestRival = Math.max(...remaining.map(r => projected[r] || 0));
      return { cut: candidate, margin: myVotes - bestRival, bond: getBond(immWinner4, candidate) };
    });
    const loyaltyW4 = immS4.loyalty * 0.1;
    const stratW4 = immS4.strategic * 0.1;
    cutCandidates.forEach(c => {
      // High margin = immunity winner does well when this person is REMOVED = good candidate to cut
      // High bond = loyalty cost of cutting them = bad candidate to cut (for loyal players)
      // High cutScore = SHOULD be cut
      c.cutScore = c.margin * (0.5 + stratW4 * 0.3) - c.bond * loyaltyW4 * 0.5;
    });
    // Highest cutScore = best candidate to cut (removes biggest threat / least loyal cost)
    cutCandidates.sort((a, b) => b.cutScore - a.cutScore);
    const cut4 = cutCandidates[0].cut;
    const brought4 = others4.filter(p => p !== cut4);
    const projectedVotes4 = projectJuryVotes([immWinner4, ...brought4]);
    ep.finalCut = {
      winner: immWinner4, brought: brought4, cut: cut4,
      reasoning: {
        projectedVotes: projectedVotes4,
        margin: cutCandidates[0].margin,
        loyaltyDriven: loyaltyW4 > stratW4,
        bondWithCut: cutCandidates[0].bond,
      }
    };
    ep.eliminated = cut4;
    gs.eliminated.push(cut4);
    gs.jury.push(cut4);
    gs.activePlayers = gs.activePlayers.filter(p => p !== cut4);
    finalists = [immWinner4, ...brought4];
  }

  ep.finaleFinalists = finalists;

  // ── FAN VOTE FINALE: fan campaign + popularity-based vote ──
  if (cfg.finaleFormat === 'fan-vote') {
    // Require popularity system
    if (!seasonConfig.popularityEnabled || !gs.popularity) {
      // Fallback: treat as traditional jury if popularity not enabled
      cfg.finaleFormat = 'traditional';
    } else {
      // Generate fan campaign data
      ep.fanCampaign = generateFanCampaign(finalists);

      // Run the fan vote
      ep.fanVoteResult = simulateFanVote(finalists);
      ep.winner = ep.fanVoteResult.winner;
      gs.finaleResult = { winner: ep.winner, votes: null, reasoning: null, finalists, fanVote: true };
    }
  }

  // Bench selection: eliminated players pick sides (final-challenge format ONLY — jury formats don't have benches)
  const hasFinaleChallenge = cfg.finaleFormat === 'final-challenge' || cfg.finaleFormat === 'olympic-relay';
  if (hasFinaleChallenge && (gs.eliminated.length > 0 || (gs.jury || []).length > 0)) {
    const benchResult = generateBenchAssignments(finalists);
    ep.benchAssignments = benchResult.assignments;
    ep.benchReasons = benchResult.reasons;
  }

  // Assistant selection: final-challenge format only, when setting enabled
  if ((cfg.finaleFormat === 'final-challenge' || cfg.finaleFormat === 'olympic-relay') && cfg.finaleAssistants && ep.benchAssignments) {
    ep.assistants = selectAssistants(finalists, ep.benchAssignments);
  }

  // Generate final challenge reenactment stages (used by VP viewer)
  ep.finalChallengeStages = generateFinalChallengeStages(finalists, ep.immunityWinner);

  if (cfg.finaleFormat === 'final-challenge' || cfg.finaleFormat === 'olympic-relay') {
    let chalResult;
    if (cfg.finaleFormat === 'olympic-relay') {
      // Rejected Olympic Relay — TDI-style finale
      const preRace = generateRelayPreRace(finalists, ep.benchAssignments || {});
      ep.benchAssignments = preRace.benchAssignments; // may have flips
      ep.relayPreRace = { pitches: preRace.pitches, confessionals: preRace.confessionals, benchFlips: preRace.benchFlips };
      chalResult = simulateRejectedOlympicRelay(finalists, ep.assistants || null, ep.benchAssignments || {}, preRace);
      ep.relayData = chalResult.relayData;
    } else {
      // Generic 3-stage finale challenge
      chalResult = simulateFinaleChallenge(finalists, ep.assistants || null);
    }
    ep.finaleChallengeStages = chalResult.stages;
    ep.finaleChallengeScores = chalResult.totalScores;
    ep.finaleChallengeWinner = chalResult.winner;
    ep.finalChallengePlacements = chalResult.placements;
    ep.finaleSabotageEvents = chalResult.sabotageEvents;
    ep.winner = chalResult.winner;
    ep.juryResult = null;
    gs.finaleResult = { winner: ep.winner, votes: null, reasoning: null, finalists, finalChallenge: true };
  } else if (cfg.finaleFormat !== 'fan-vote' || !ep.fanVoteResult) {
    // FTC swing votes: nudge hesitating juror bonds based on FTC performance
    // Must happen BEFORE simulateJuryVote so the vote uses post-FTC bonds
    ep.ftcSwings = applyFTCSwingVotes(finalists);

    // Jury vote (uses post-swing bonds)
    const juryResult = simulateJuryVote(finalists);
    ep.juryResult = juryResult;
    const jSorted = Object.entries(juryResult.votes).sort(([,a],[,b]) => b-a);
    // Tiebreaker: if top 2 have equal votes
    if (jSorted.length >= 2 && jSorted[0][1] === jSorted[1][1]) {
      const tied = jSorted.filter(([,v]) => v === jSorted[0][1]).map(([n]) => n);

      // Step 1: Revote — jurors re-evaluate with slight shift (reduced randomness)
      const revoteResult = { votes: Object.fromEntries(tied.map(f => [f, 0])), reasoning: [] };
      (gs.jury || []).forEach(juror => {
        const scores = tied.map(f => {
          const fS = pStats(f);
          const bond = getBond(juror, f);
          const gameplay = fS.strategic * 0.3 + fS.boldness * 0.2 + fS.social * 0.2;
          return { name: f, score: gameplay + bond * 1.5 + (Math.random() * 1.2) };
        });
        scores.sort((a, b) => b.score - a.score);
        revoteResult.votes[scores[0].name]++;
        revoteResult.reasoning.push({ juror, votedFor: scores[0].name });
      });
      const rvSorted = Object.entries(revoteResult.votes).sort(([,a],[,b]) => b-a);

      if (rvSorted[0][1] !== rvSorted[1]?.[1]) {
        // Revote broke the tie
        ep.juryTiebreak = { tied, winner: rvSorted[0][0], method: 'revote', revote: revoteResult };
        ep.winner = rvSorted[0][0];
      } else {
        // Step 2: Still tied — check if finalists agree to share the title
        // Double crowning requires a genuine bond (>= 4) — they must actually respect each other
        const _tieBond = tied.length === 2 ? getBond(tied[0], tied[1]) : 0;
        const _bothAgree = tied.length === 2 && _tieBond >= 4;
        // Even with high bond, personalities matter — bold/competitive players refuse to share
        const _willingToShare = tied.every(f => {
          const fs = pStats(f);
          // Bold/competitive players won't share — they want sole credit
          return fs.boldness <= 7 && Math.random() < 0.5 + _tieBond * 0.05;
        });

        if (_bothAgree && _willingToShare) {
          // Double crowning — mutual respect, they agree to share
          ep.juryTiebreak = { tied, winners: tied, method: 'double-crowning', revote: revoteResult, bond: Math.round(_tieBond * 10) / 10 };
          ep.winner = tied.join(' & ');
        } else {
          // Step 3: No agreement — the eliminated finalist (3rd place) casts the deciding vote
          // In real Survivor, this is often how ties are broken (the non-finalist breaks the deadlock)
          const _tiebreaker = ep.finalCut?.cut || ep.eliminated || (gs.jury.length ? gs.jury[gs.jury.length - 1] : null);
          if (_tiebreaker && players.find(p => p.name === _tiebreaker)) {
            const _tbS = pStats(_tiebreaker);
            const _tbScores = tied.map(f => ({
              name: f,
              score: getBond(_tiebreaker, f) * 1.5 + pStats(f).strategic * 0.2 + pStats(f).social * 0.2 + Math.random() * 0.5,
            })).sort((a, b) => b.score - a.score);
            const _tbWinner = _tbScores[0].name;
            const _tbReason = getBond(_tiebreaker, _tbWinner) >= 3
              ? `${_tiebreaker} votes based on loyalty — ${_tbWinner} was closer.`
              : `${_tiebreaker} votes based on gameplay — ${_tbWinner} played the stronger game.`;
            ep.juryTiebreak = { tied, winner: _tbWinner, method: 'finalist-tiebreaker', revote: revoteResult,
              tiebreaker: _tiebreaker, tiebreakerReason: _tbReason };
            ep.winner = _tbWinner;
          } else {
            // Ultimate fallback: eliminated finalist not available — force double crowning
            ep.juryTiebreak = { tied, winners: tied, method: 'double-crowning', revote: revoteResult };
            ep.winner = tied.join(' & ');
          }
        }
      }
    } else {
      ep.winner = jSorted[0]?.[0] || finalists[0];
    }
    gs.finaleResult = { winner: ep.winner, votes: juryResult.votes, reasoning: juryResult.reasoning, finalists };
    // Generate FTC narrative data (opening statements + juror Q&A) for VP viewer
    ep.ftcData = generateFTCData(finalists, juryResult);
  }

  // ── Fan Favorite ──
  if (seasonConfig.popularityEnabled !== false && gs.popularity) {
    const _allNames = players.map(p => p.name);
    const _fanFav = _allNames.reduce((best, name) =>
      (gs.popularity[name] || 0) > (gs.popularity[best] || 0) ? name : best,
      _allNames[0]
    );
    gs.fanFavorite = _fanFav;
    ep.fanFavorite = _fanFav;
    ep.fanFavoriteScore = gs.popularity[_fanFav] || 0;
    ep.fanFavoriteIsWinner = _fanFav === ep.winner;
  }

  const summaryText = generateFinaleSummaryText(ep);
  ep.summaryText = summaryText;

  // Deduplicate jury + eliminated (can accumulate duplicates from multi-path finales)
  gs.jury = [...new Set(gs.jury || [])];
  gs.eliminated = [...new Set(gs.eliminated || [])];
  gs.phase = 'complete';
  gs.episode = epNum;
  gs.episodeHistory.push({
    num: epNum, eliminated: ep.eliminated || null, firstEliminated: null,
    riChoice: null, immunityWinner: ep.immunityWinner, challengeType: 'individual',
    challengeLabel: ep.challengeLabel || null,
    chalPlacements: ep.chalPlacements || null,
    isMerge: false, isFinale: true, votes: {}, alliances: [], summaryText, gsSnapshot: window.snapshotGameState(),
    fanFavorite: ep.fanFavorite || null, fanFavoriteScore: ep.fanFavoriteScore || 0, fanFavoriteIsWinner: ep.fanFavoriteIsWinner || false,
    winner: ep.winner || null,
    // Finale-specific fields
    finaleFinalists: ep.finaleFinalists || null,
    finalCut: ep.finalCut || null,
    immunityNarrationStages: ep.finalChallengeStages || null,
    juryResult: ep.juryResult || null,
    juryTiebreak: ep.juryTiebreak || null,
    ftcData: ep.ftcData || null,
    ftcSwings: ep.ftcSwings || [],
    benchAssignments: ep.benchAssignments || null,
    benchReasons: ep.benchReasons || null,
    assistants: ep.assistants || null,
    finaleChallengeStages: ep.finaleChallengeStages || null,
    finaleChallengeScores: ep.finaleChallengeScores || null,
    finaleChallengeWinner: ep.finaleChallengeWinner || null,
    finalChallengePlacements: ep.finalChallengePlacements || null,
    finaleSabotageEvents: ep.finaleSabotageEvents || [],
    relayData: ep.relayData || null,
    relayPreRace: ep.relayPreRace || null,
    campEvents: ep.campEvents || null,
    // Fire-making finale
    firemaking: ep.firemaking || false,
    firemakingDecision: ep.firemakingDecision || null,
    firemakingResult: ep.firemakingResult || null,
    // Koh-Lanta finale
    klOrienteering: ep.klOrienteering || null,
    klPerch: ep.klPerch || null,
    klChoice: ep.klChoice || null,
    // Fan vote finale
    fanCampaign: ep.fanCampaign || null,
    fanVoteResult: ep.fanVoteResult || null,
    // All players who entered the finale (before fire-making/koh-lanta eliminations)
    finaleEntrants: ep.finaleEntrants || null,
  });

  window.saveGameState();
  return ep;
}

export function generateFinaleSummaryText(ep) {
  const L = [], cfg = seasonConfig;
  const finalists = ep.finaleFinalists || gs.activePlayers;
  const jury = gs.jury || [];
  const juryResult = ep.juryResult || {};
  function sec(title) { L.push(''); L.push(`=== ${title} ===`); }
  function ln(t) { L.push(t); }

  sec('META');
  ln(`Season: ${cfg.name || 'Untitled'}`);
  ln(`Episode: ${ep.num} — FINALE`);
  ln(`Finalists: ${finalists.join(', ')}`);
  ln(`Jury (${jury.length}): ${jury.join(', ')}`);

  // Camp events
  if (ep.campEvents && Object.keys(ep.campEvents).length) {
    sec('CAMP EVENTS');
    Object.entries(ep.campEvents).forEach(([campName, phaseData]) => {
      const preEvs  = Array.isArray(phaseData) ? phaseData : (phaseData?.pre  || []);
      const postEvs = Array.isArray(phaseData) ? []         : (phaseData?.post || []);
      if (!preEvs.length && !postEvs.length) return;
      if (campName !== 'merge') ln(`${campName.toUpperCase()} CAMP:`);
      [...preEvs, ...postEvs].forEach(e => ln(`- ${e.text}`)); // finale = single block, no pre/post label needed
    });
  }

  if (ep.immunityWinner) {
    sec('FINAL IMMUNITY CHALLENGE');
    ln(`${ep.immunityWinner} wins the Final Immunity Challenge (${ep.challengeLabel||'Mixed'}).`);
    const immS = pStats(ep.immunityWinner);
    if (immS.physical >= 8 || immS.endurance >= 8) ln(`A dominant performance — ${ep.immunityWinner} wanted this one.`);
    else ln(`${ep.immunityWinner} digs deep when it matters most.`);
  }

  if (ep.finalCut) {
    const fc = ep.finalCut;
    if (fc.byJury) {
      sec('WINNER\'S CUT');
      ln(`${fc.winner} wins immunity and is safe. The jury now decides who joins them in the finale.`);
      const jvTally = Object.entries(fc.juryCutVotes).sort(([,a],[,b]) => b-a).map(([n,v]) => `${n}: ${v}`).join(' | ');
      ln(`Jury vote (between ${fc.brought} and ${fc.cut}): ${jvTally}`);
      ln(`${fc.brought} advances to the finale. ${fc.cut} is eliminated in ${ordinal(finalists.length + jury.length)} place.`);
      ln('');
      if (fc.juryCutReasoning?.length) {
        fc.juryCutReasoning.slice(0, 3).forEach(r => {
          ln(`${r.juror} → ${r.votedFor}`);
        });
        if (fc.juryCutReasoning.length > 3) ln(`...and ${fc.juryCutReasoning.length - 3} more.`);
      }
    } else {
      sec('FINAL DECISION');
      const bond = getBond(fc.winner, fc.brought);
      const bondReason = bond >= 3 ? `loyal ally throughout the game` : bond >= 1 ? `easier opponent at FTC` : `the safer choice`;
      ln(`${fc.winner} holds the power. They must choose who sits beside them.`);
      ln(`${fc.winner} brings ${fc.brought} to the Final Tribal Council (${bondReason}).`);
      ln(`${fc.cut} is eliminated in ${ordinal(finalists.length + jury.length)} place.`);
      ln('');
      const cutS = pStats(fc.cut);
      const cutBond = getBond(fc.winner, fc.cut);
      if (cutBond <= -1) ln(`${fc.winner} never fully trusted ${fc.cut}. The finale was the first clean chance to act on it.`);
      else if (cutS.social >= 7) ln(`${fc.cut} had too many jury friends. ${fc.winner} could not afford to let them into the finals.`);
      else ln(`${fc.winner} calculated ${fc.brought} was the right seat-mate — and did not look back.`);
    }
  }

  if (cfg.finaleFormat === 'fan-vote' && ep.fanVoteResult) {
    sec('FAN CAMPAIGN');
    ln(`The finalists pitch to the audience. No jury vote tonight — the fans decide.`);
    ln('');
    (ep.fanCampaign?.phases || []).forEach(phase => {
      ln(`${phase.finalist} (${phase.style} pitch): pulse reaction — ${phase.pulseReaction}`);
      if (phase.juryReactions?.length) phase.juryReactions.forEach(jr => ln(`  ${jr.juror}: ${jr.text}`));
    });

    sec('FAN VOTE');
    const fvr = ep.fanVoteResult;
    fvr.breakdown.forEach(b => ln(`${b.name}: ${b.pct}% (popularity: ${b.popularity}, campaign boost: ${b.campaignBoost})`));
    ln('');
    ln(`Margin: ${fvr.margin}`);

    sec('WINNER');
    const winner = ep.winner;
    const ws = pStats(winner);
    const winPct = fvr.percentages[winner] || 0;
    ln(`${winner} wins the fan vote with ${winPct}% of the audience vote (${fvr.margin})!`);
    ln('');
    if (ws.social >= 8) ln(`${winner} won the fans over with charm and heart. The audience saw what the island saw.`);
    else if (ws.strategic >= 8) ln(`${winner} played a game the fans could respect — calculated, controlled, dominant.`);
    else if (ws.boldness >= 8) ln(`${winner} played with guts and the fans loved every second of it.`);
    else ln(`${winner} connected with the audience and earned their vote. A fan-crowned champion.`);

    // Runner-up
    if (fvr.rankings.length >= 2) {
      const ru = fvr.rankings[1];
      const ruPct = fvr.percentages[ru] || 0;
      if (fvr.margin === 'razor-thin') ln(`${ru} came agonizingly close — ${ruPct}%. A few more fans and the result flips.`);
      else ln(`${ru} finishes with ${ruPct}% of the fan vote.`);
    }

    return L.join('\n');
  } else if (cfg.finaleFormat === 'final-challenge' || cfg.finaleFormat === 'olympic-relay') {
    sec('FINAL CHALLENGE');
    ln(`No jury. The winner is decided by a final challenge among all finalists.`);
    ln('');
    finalists.forEach(f => {
      const fs = pStats(f);
      const wins = gs.episodeHistory.filter(e => e.immunityWinner === f).length;
      ln(`${f}: ${wins} individual immunity win${wins !== 1 ? 's' : ''} — ${fs.physical >= 8 ? 'physical threat' : fs.endurance >= 8 ? 'endurance specialist' : fs.mental >= 8 ? 'mental powerhouse' : 'all-around competitor'}`);
    });
    ln('');
    ln(`${ep.finaleChallengeWinner} wins the Final Challenge and takes the season.`);

    sec('WINNER');
    const winner = ep.winner;
    const ws = pStats(winner);
    ln(`${winner} wins the season by winning the Final Challenge!`);
    ln('');
    if (ws.physical >= 8 || ws.endurance >= 8) ln(`${winner} dominated when it mattered most — a worthy champion.`);
    else if (ws.mental >= 8) ln(`${winner} outlasted every mental obstacle thrown at them. The final challenge was just one more.`);
    else ln(`${winner} dug deep and won the only vote that counted — the final challenge.`);
  } else {
    sec('FINAL TRIBAL COUNCIL');
    ln(`The jury of ${jury.length} faces the finalists.`);
    ln('');
    finalists.forEach(f => {
      const fs = pStats(f);
      const wins = gs.episodeHistory.filter(e => e.immunityWinner === f).length;
      const votes = gs.episodeHistory.reduce((sum, e) => sum + (e.votes?.[f] || 0), 0);
      ln(`${f}:`);
      if (fs.strategic >= 8 && fs.social >= 7) ln(`  - Complete player. Dominated strategy and maintained relationships.`);
      else if (fs.strategic >= 8) ln(`  - Ruthless strategist. Controlled the vote at every critical juncture.`);
      else if (fs.social >= 8) ln(`  - Social anchor. Nobody wanted to vote against them — and nobody did.`);
      else if (fs.physical >= 8 || wins >= 3) ln(`  - Challenge beast. Won immunity when it counted.`);
      else ln(`  - Survived against the odds. The journey matters as much as the destination.`);
      ln(`  - Individual immunities won: ${wins}`);
      ln(`  - Votes against (total): ${votes}`);
    });

    sec('JURY VOTE');
    juryResult.reasoning?.forEach(r => {
      const js = pStats(r.juror);
      const bond = getBond(r.juror, r.votedFor);
      const history = gs.jurorHistory?.[r.juror];
      const wasVotedOutBy = history?.voters.includes(r.votedFor);
      const bondAtBoot = history?.finalBonds?.[r.votedFor] ?? bond;
      let reason;
      if (wasVotedOutBy && bondAtBoot >= 3) reason = `forgave the betrayal — ${r.votedFor} played the better game despite writing their name`;
      else if (wasVotedOutBy && bondAtBoot < 0) reason = `expected it — no personal betrayal, just the game`;
      else if (!wasVotedOutBy && bond >= 2) reason = `gratitude and respect — ${r.votedFor} never wrote their name`;
      else if (bond >= 4) reason = `strong personal loyalty — felt closest to ${r.votedFor}`;
      else if (bond >= 2) reason = `respected ${r.votedFor}'s game and felt a genuine connection`;
      else if (js.strategic >= 8) reason = `pure gameplay — ${r.votedFor} made the best moves`;
      else if (js.intuition >= 7) reason = `read the game correctly — ${r.votedFor} earned it`;
      else if (bond >= 0) reason = `liked ${r.votedFor} the most of the remaining options`;
      else reason = `voted against who they disliked more`;
      ln(`${r.juror} → ${r.votedFor} — ${reason}`);
    });

    const sorted = Object.entries(juryResult.votes).sort(([,a],[,b]) => b-a);
    const tally = sorted.map(([n,v]) => `${n}: ${v}`).join(' | ');

    sec('FINAL TALLY');
    ln(tally);

    sec('WINNER');
    const winner = ep.winner;
    const ws = pStats(winner);
    const winVotes = juryResult.votes[winner] || 0;
    const totalJury = jury.length;
    ln(`${winner} wins the season with a ${winVotes}-${totalJury - winVotes}${sorted.length > 2 ? `-${sorted[2]?.[1]||0}` : ''} jury vote!`);
    ln('');
    if (ws.strategic >= 8 && ws.social >= 7) ln(`${winner} played a complete game — controlling votes while keeping the jury's respect. A textbook win.`);
    else if (ws.strategic >= 8) ln(`${winner} played a dominant strategic game. Not everyone on the jury loved the moves — but they could not argue with them.`);
    else if (ws.social >= 8) ln(`${winner} won through sheer social mastery. Made everyone feel like they mattered. In the end, the jury voted for someone they actually liked.`);
    else if (ws.physical >= 8) ln(`${winner} won the challenges when it counted. The jury respected someone who earned their safety.`);
    else ln(`${winner} outlasted, outplayed, and outsurvivedeveryone. A win built on resilience.`);

    // Runner-up note
    if (sorted.length >= 2) {
      const ru = sorted[1][0];
      const ruVotes = sorted[1][1];
      if (ruVotes >= Math.floor(totalJury / 2)) ln(`${ru} came agonizingly close — ${ruVotes} jury votes. A different night, a different result.`);
      else ln(`${ru} finishes as runner-up with ${ruVotes} jury vote${ruVotes !== 1 ? 's' : ''}.`);
    }
  }

  return L.join('\n');
}

export function simulateJuryVote(finalists) {
  // Deduplicate jury (can happen if a player is added by multiple code paths, e.g. koh-lanta orienteering + finale)
  const jury = [...new Set(gs.jury || [])];
  gs.jury = jury; // fix the source too
  if (!jury.length || !finalists.length) return { votes: {}, reasoning: [], jury: [] };

  const votes = Object.fromEntries(finalists.map(f => [f, 0]));
  const reasoning = [];

  jury.forEach(juror => {
    const jS = pStats(juror);
    const scores = finalists.map(f => {
      const fS = pStats(f);
      const bond = getBond(juror, f);
      // Gameplay = strategic + boldness (big moves) + social (jury management)
      const gameplay = fS.strategic * 0.3 + fS.boldness * 0.2 + fS.social * 0.2 + (fS.physical + fS.endurance) / 2 * 0.1;
      // Loyalty honor (behavior-based) + big moves resume
      const _betrayalCount = (gs.namedAlliances || []).reduce((n, a) => n + (a.betrayals || []).filter(b => b.player === f).length, 0);
      const _loyaltyHonor = _betrayalCount === 0 ? 0.6 : _betrayalCount <= 1 ? 0.3 : _betrayalCount <= 2 ? 0.1 : 0;
      const _bigMoves = gs.playerStates?.[f]?.bigMoves || 0;
      // Zero big moves = passenger penalty. Jury doesn't respect coasting to the end.
      const _resumeBonus = _bigMoves === 0 ? -0.6
        : _bigMoves === 1 ? 0
        : Math.min(0.8, _bigMoves * 0.15);
      // Survival resume: cumulative votes survived — jurors respect someone who kept getting targeted and kept surviving
      const _totalVotesReceived = gs.playerStates?.[f]?.votesReceived || 0;
      const _survivalBonus = Math.min(0.5, _totalVotesReceived * 0.04); // 5 votes = 0.2, 10 votes = 0.4, caps at 0.5
      // Challenge dominance: individual immunity wins impress the jury
      const _immWins = gs.episodeHistory.filter(e => e.immunityWinner === f && e.challengeType === 'individual').length;
      const _challengeBonus = _immWins >= 5 ? 0.8 : _immWins >= 4 ? 0.6 : _immWins >= 3 ? 0.4 : _immWins >= 2 ? 0.2 : 0;
      // Underdog bonus: high votes received in pre-merge but made it to the end — comeback story
      const _preMergeVotes = gs.episodeHistory.filter(e => !e.isMerge && e.challengeType === 'tribe')
        .reduce((s, e) => s + ((e.votingLog || []).filter(v => v.voted === f).length), 0);
      const _underdogBonus = _preMergeVotes >= 6 ? 0.5 : _preMergeVotes >= 4 ? 0.3 : _preMergeVotes >= 2 ? 0.15 : 0;
      // Social breadth: positive bonds with many jurors (not just deep bonds with a few)
      const _posJurorBonds = (gs.jury || []).filter(j => getBond(j, f) >= 1).length;
      const _socialBreadth = Math.min(0.5, _posJurorBonds * 0.08); // 3 jurors = 0.24, 6 = 0.48, cap 0.5
      // Provider bonus: camp workhorse respected by jury
      const _providerEps = gs.providerHistory?.[f] || 0;
      const _providerBonus = Math.min(0.4, _providerEps * 0.04); // 5 eps = 0.2, 10 = 0.4
      // Showmance partner on jury: strong emotional pull — they almost always vote for you
      const _showmanceOnJury = gs.showmances?.find(sm => sm.players.includes(f) && sm.phase !== 'broken-up'
        && sm.players.some(p => p !== f && (gs.jury || []).includes(p)));
      const _showmanceJuryBonus = (_showmanceOnJury && juror === _showmanceOnJury.players.find(p => p !== f)) ? 2.5 : 0;
      // Hero/Villain archetype FTC modifiers
      const _fArch = players.find(p => p.name === f)?.archetype || '';
      const _heroBonus = _fArch === 'hero' ? 2.0 : 0; // jury loves heroes
      // Villain polarization: jurors with positive bond = respect, negative bond = extra bitter
      const _villainMod = _fArch === 'villain' ? (bond >= 1 ? 1.5 : bond <= -1 ? -2.0 : 0) : 0;
      // Perch victory bonus: winning the iconic endurance finale earns jury respect (proportional to juror's physical/endurance appreciation)
      const _perchBonus = gs.playerStates?.[f]?.perchWinner ? 0.4 + jS.physical * 0.05 : 0;
      const personal = bond * 1.5 + _loyaltyHonor + _resumeBonus + _survivalBonus + _challengeBonus + _underdogBonus + _socialBreadth + _providerBonus + _showmanceJuryBonus + _heroBonus + _villainMod + _perchBonus;
      // Bitterness/gratitude: was this finalist the one who voted me out?
      const history = gs.jurorHistory?.[juror];
      let bitterness = 0;
      if (history) {
        const bondAtBoot = history.finalBonds?.[f] ?? 0;
        if (history.voters.includes(f)) {
          // Higher bond at boot = bigger betrayal sting
          bitterness = -(0.6 + Math.max(0, bondAtBoot) * 0.5);
        } else {
          // Didn't vote me out — small gratitude, more if we had a bond
          bitterness = 0.25 + Math.max(0, bondAtBoot) * 0.15;
        }
      }
      // Strategic/intuitive jurors weigh gameplay more and forgive gameplay betrayals better
      // Loyal/emotional jurors weight bitterness more heavily
      const score = jS.strategic > 7 || jS.intuition > 7
        ? gameplay * 0.7 + personal * 0.3 + bitterness * 0.3
        : gameplay * 0.3 + personal * 0.7 + bitterness * 0.8;
      return { name: f, score: score + (Math.random() * 1.5) };
    });
    scores.sort((a, b) => b.score - a.score);
    const pick = scores[0].name;
    votes[pick]++;
    // Generate reason text for the vote
    const _jrBond = getBond(juror, pick);
    const _jrHistory = gs.jurorHistory?.[juror];
    const _jrVotedOut = _jrHistory?.voters?.includes(pick);
    const _jrFp = pronouns(pick);
    const _jrPick = arr => arr[([...juror+pick].reduce((a,c)=>a+c.charCodeAt(0),0)+gs.episode*7)%arr.length];
    // Compute finalist stats for reasoning
    const _jrImmWins = gs.episodeHistory.filter(e => e.immunityWinner === pick && e.challengeType === 'individual').length;
    const _jrPreMergeVotes = gs.episodeHistory.filter(e => !e.isMerge && e.challengeType === 'tribe')
      .reduce((s, e) => s + ((e.votingLog || []).filter(v => v.voted === pick).length), 0);
    const _jrPosJurorBonds = (gs.jury || []).filter(j => getBond(j, pick) >= 1).length;
    const _jrShowmance = gs.showmances?.find(sm => sm.players.includes(pick) && sm.phase !== 'broken-up' && sm.players.includes(juror));
    let _jrReason;
    // Showmance partner — strongest emotional pull, takes priority
    if (_jrShowmance) {
      _jrReason = _jrPick([
        `${pick} is my person. Out there and in here. There was never a question who I'm voting for.`,
        `We went through this game together. ${pick} is the reason I survived as long as I did. My vote is for ${_jrFp.obj} — and it's not even close.`,
        `I'm not going to pretend this is objective. ${pick} and I had something real. ${_jrFp.Sub} ${_jrFp.sub==='they'?'deserve':'deserves'} this. I believe that with everything I have.`,
      ]);
    } else if (_jrVotedOut && _jrBond >= 2) {
      _jrReason = _jrPick([
        `${pick} voted me out — and I'm voting for ${_jrFp.obj} to win. That's how good ${_jrFp.pos} game was.`,
        `${pick} ended my game. I hated it then. But watching from the bench, I see it was the right move. That's why ${_jrFp.sub} ${_jrFp.sub==='they'?'get':'gets'} my vote.`,
        `I was bitter. I'm not anymore. ${pick} played the best game and I can admit that now.`,
      ]);
    } else if (_jrVotedOut && _jrBond < 0) {
      _jrReason = _jrPick([
        `${pick} didn't vote me out. That matters more than people think. Loyalty deserves to be rewarded.`,
        `I looked at who sent me home and who didn't. ${pick} wasn't part of that vote. ${_jrFp.Sub} ${_jrFp.sub==='they'?'have':'has'} my respect.`,
        `${pick} kept ${_jrFp.pos} hands clean when others didn't. That's the kind of game I want to reward.`,
      ]);
    } else if (_jrBond >= 4) {
      _jrReason = _jrPick([
        `${pick} and I had something real out there. I'm voting for ${_jrFp.obj} because ${_jrFp.sub} earned it — as a player and as a person.`,
        `I trust ${pick}. I've trusted ${_jrFp.obj} since the beginning. My vote reflects that.`,
        `${pick} was my closest ally. ${_jrFp.Sub} played hard and ${_jrFp.sub} played honest. That's enough for me.`,
        `gratitude and respect — ${pick} never wrote my name`,
      ]);
    } else if (jS.strategic >= 7) {
      _jrReason = _jrPick([
        `${pick} played the most complete game. Strategic, social, physical — ${_jrFp.sub} checked every box.`,
        `I'm voting for the best game, not the best person. ${pick} controlled more votes than anyone up there.`,
        `From the jury bench, it's clear: ${pick} made the moves that shaped this season. That deserves the win.`,
        `respected ${pick}'s game and felt a genuine connection`,
        `${pick} outplayed everyone sitting next to ${_jrFp.obj}. The jury should reward gameplay, not feelings.`,
      ]);
    } else if (_jrImmWins >= 3) {
      _jrReason = _jrPick([
        `${_jrImmWins} individual immunities. ${pick} won when it mattered. You can't argue with someone who earned their safety that many times.`,
        `${pick} is a challenge beast — ${_jrImmWins} immunity wins. ${_jrFp.Sub} didn't need alliances to survive. ${_jrFp.Sub} just kept winning.`,
        `I respect dominance. ${pick} won ${_jrImmWins} immunities. That's not luck — that's will. My vote goes to the competitor.`,
      ]);
    } else if (_jrPreMergeVotes >= 4) {
      _jrReason = _jrPick([
        `${pick} was on the bottom from day one. ${_jrPreMergeVotes} votes before the merge — and ${_jrFp.sub} ${_jrFp.sub==='they'?'are':'is'} still here. That's the best underdog story I've seen.`,
        `Everyone tried to get rid of ${pick} early. It didn't work. ${_jrFp.Sub} clawed ${_jrFp.pos} way to the end and I respect that more than any blindside.`,
        `${pick} was targeted before most people even learned each other's names. The fact that ${_jrFp.sub} survived to the finale is ${_jrFp.pos} argument. I'm voting for the comeback.`,
      ]);
    } else if (_jrPosJurorBonds >= 5) {
      _jrReason = _jrPick([
        `Everybody on this jury has something good to say about ${pick}. That's not an accident — ${_jrFp.sub} built real relationships with real people. My vote reflects that.`,
        `${pick} connected with more people on this jury than anyone else up there. That's social game. That's what Survivor is about.`,
        `I look at this jury and I see ${_jrPosJurorBonds} people who genuinely like ${pick}. You can't fake that over 30 days. ${_jrFp.Sub} earned every one of those relationships.`,
      ]);
    } else if ((gs.providerHistory?.[pick] || 0) >= 5) {
      _jrReason = _jrPick([
        `${pick} fed this tribe. While everyone else was scheming, ${_jrFp.sub} ${_jrFp.sub==='they'?'were':'was'} fishing, foraging, keeping the fire alive. That matters. That's real.`,
        `I watched ${pick} work every single day. Camp wasn't glamorous, but it kept us alive. The jury remembers who carried the weight.`,
        `${pick} didn't just play the game — ${_jrFp.sub} kept us FED. Try thinking strategically on an empty stomach. ${pick} made that possible for all of us.`,
      ]);
    } else if (_jrBond >= 1) {
      _jrReason = _jrPick([
        `${pick} treated people well. In this game, that's rare. My vote is personal — and I'm okay with that.`,
        `I like ${pick}. I think ${_jrFp.sub} played a good game. That combination gets my vote.`,
        `${pick} was genuine out there. Not everyone can say that. My vote reflects who I connected with.`,
        `strong personal loyalty — felt closest to ${pick}`,
      ]);
    } else {
      _jrReason = _jrPick([
        `${pick} is the least bad option up there. Not a ringing endorsement — but it's the truth.`,
        `I don't love any of the finalists. But ${pick} at least played ${_jrFp.pos} own game.`,
        `Process of elimination. The others gave me less reason to vote for them than ${pick} did.`,
        `${pick} survived. That's not nothing. In this game, making it to the end is its own argument.`,
      ]);
    }
    reasoning.push({ juror, votedFor: pick, reason: _jrReason });
  });

  return { votes, reasoning, jury };
}

// Project jury vote outcome for a given finalist set — used by smart decision logic
// Thin wrapper around simulateJuryVote's scoring logic, but deterministic (no random noise)
// Returns { [finalist]: projectedVotes } without modifying game state
export function projectJuryVotes(finalistSet) {
  const jury = gs.jury || [];
  if (!jury.length || !finalistSet.length) return {};
  const votes = Object.fromEntries(finalistSet.map(f => [f, 0]));
  jury.forEach(juror => {
    const jS = pStats(juror);
    const scores = finalistSet.map(f => {
      const fS = pStats(f);
      const bond = getBond(juror, f);
      // Same formula as simulateJuryVote — keep in sync if that changes
      const gameplay = fS.strategic * 0.3 + fS.boldness * 0.2 + fS.social * 0.2 + (fS.physical + fS.endurance) / 2 * 0.1;
      // Loyalty honor: jurors respect finalists who ACTUALLY stayed loyal (behavior, not stat)
      const _betrayalCount = (gs.namedAlliances || []).reduce((n, a) => n + (a.betrayals || []).filter(b => b.player === f).length, 0);
      const _loyaltyHonor = _betrayalCount === 0 ? 0.6 : _betrayalCount <= 1 ? 0.3 : _betrayalCount <= 2 ? 0.1 : 0;
      // Big moves resume: bold players who made flashy moves earn jury respect
      const _bigMoves = gs.playerStates?.[f]?.bigMoves || 0;
      const _resumeBonus = _bigMoves === 0 ? -0.6
        : _bigMoves === 1 ? 0
        : Math.min(0.8, _bigMoves * 0.15);
      // Survival resume: cumulative votes survived
      const _totalVotesReceived = gs.playerStates?.[f]?.votesReceived || 0;
      const _survivalBonus = Math.min(0.5, _totalVotesReceived * 0.04);
      // Challenge dominance: individual immunity wins
      const _immWins = gs.episodeHistory.filter(e => e.immunityWinner === f && e.challengeType === 'individual').length;
      const _challengeBonus = _immWins >= 5 ? 0.8 : _immWins >= 4 ? 0.6 : _immWins >= 3 ? 0.4 : _immWins >= 2 ? 0.2 : 0;
      // Underdog bonus: high votes in pre-merge but survived to finale
      const _preMergeVotes = gs.episodeHistory.filter(e => !e.isMerge && e.challengeType === 'tribe')
        .reduce((s, e) => s + ((e.votingLog || []).filter(v => v.voted === f).length), 0);
      const _underdogBonus = _preMergeVotes >= 6 ? 0.5 : _preMergeVotes >= 4 ? 0.3 : _preMergeVotes >= 2 ? 0.15 : 0;
      // Social breadth: positive bonds with many jurors
      const _posJurorBonds = (gs.jury || []).filter(j => getBond(j, f) >= 1).length;
      const _socialBreadth = Math.min(0.5, _posJurorBonds * 0.08);
      // Provider bonus: camp workhorse respected by jury
      const _providerEps = gs.providerHistory?.[f] || 0;
      const _providerBonus = Math.min(0.4, _providerEps * 0.04); // 5 eps = 0.2, 10 = 0.4
      // Showmance partner on jury
      const _showmanceOnJury = gs.showmances?.find(sm => sm.players.includes(f) && sm.phase !== 'broken-up'
        && sm.players.some(p => p !== f && (gs.jury || []).includes(p)));
      const _showmanceJuryBonus = (_showmanceOnJury && juror === _showmanceOnJury.players.find(p => p !== f)) ? 2.5 : 0;
      // Hero/Villain archetype FTC modifiers
      const _fArch = players.find(p => p.name === f)?.archetype || '';
      const _heroBonus = _fArch === 'hero' ? 2.0 : 0;
      const _villainMod = _fArch === 'villain' ? (bond >= 1 ? 1.5 : bond <= -1 ? -2.0 : 0) : 0;
      // Perch victory bonus (koh-lanta): jurors respect iconic endurance win (proportional to juror's physical appreciation)
      const _perchBonus = gs.playerStates?.[f]?.perchWinner ? 0.4 + jS.physical * 0.05 : 0;
      const personal = bond * 1.5 + _loyaltyHonor + _resumeBonus + _survivalBonus + _challengeBonus + _underdogBonus + _socialBreadth + _providerBonus + _showmanceJuryBonus + _heroBonus + _villainMod + _perchBonus;
      const history = gs.jurorHistory?.[juror];
      let bitterness = 0;
      if (history) {
        const bondAtBoot = history.finalBonds?.[f] ?? 0;
        if (history.voters.includes(f)) bitterness = -(0.6 + Math.max(0, bondAtBoot) * 0.5);
        else bitterness = 0.25 + Math.max(0, bondAtBoot) * 0.15;
      }
      const score = jS.strategic > 7 || jS.intuition > 7
        ? gameplay * 0.7 + personal * 0.3 + bitterness * 0.3
        : gameplay * 0.3 + personal * 0.7 + bitterness * 0.8;
      // Deterministic tiebreaker: use bond magnitude to break score ties
      return { name: f, score, tiebreak: Math.abs(bond) };
    });
    scores.sort((a, b) => b.score - a.score || b.tiebreak - a.tiebreak);
    votes[scores[0].name]++;
  });
  return votes;
}

// ── Generate final challenge stage-by-stage progression ──
export function generateFinalChallengeStages(finalists, winner) {
  const losers = finalists.filter(p => p !== winner);
  // Weaker stats drop first (with noise)
  const sortedLosers = [...losers].sort((a, b) => {
    const sa = pStats(a), sb = pStats(b);
    const scoreA = sa.endurance * 0.5 + sa.mental * 0.3 + sa.physical * 0.2 + Math.random() * 1.5;
    const scoreB = sb.endurance * 0.5 + sb.mental * 0.3 + sb.physical * 0.2 + Math.random() * 1.5;
    return scoreA - scoreB;
  });

  const wStats = pStats(winner);
  const challengeType = wStats.endurance >= wStats.mental ? 'endurance' : 'mental';
  const stages = [];
  let remaining = [...finalists];

  // Opening
  stages.push({ type: 'opening', remaining: [...remaining],
    text: challengeType === 'endurance'
      ? `The finalists take their positions on the final platform. Everything — every vote, every betrayal, every deal — comes down to this. Last one standing wins immunity and a guaranteed spot at the end.`
      : `The finalists face the final puzzle. One wrong move. One moment of lost focus. The entire game can unravel in seconds.` });

  // Each loser drops with suspense
  sortedLosers.forEach((dropper, i) => {
    const ds = pStats(dropper);
    const ws = pStats(winner);
    const isClose = Math.random() < 0.45;
    let dropText;
    if (isClose) {
      dropText = challengeType === 'endurance'
        ? `${dropper} fights longer than anyone expected. The muscles are screaming. The will is there — but the body finally gives out. ${dropper} steps down.`
        : `${dropper} is right on the edge of cracking it. Then one misstep derails everything. ${dropper} is out of the challenge.`;
    } else if (ds.endurance <= 5 && challengeType === 'endurance') {
      dropText = `${dropper} felt it early. The legs go first. Then the grip. Then the balance. ${dropper} drops — they have no more to give.`;
    } else if (ds.mental <= 5 && challengeType === 'mental') {
      dropText = `${dropper} rushes and makes a critical error. There's no coming back from that kind of mistake under this pressure. ${dropper} is eliminated from the challenge.`;
    } else {
      dropText = challengeType === 'endurance'
        ? `${dropper} stays as long as they can. Then — quietly, with no drama — they step down. The game narrows.`
        : `${dropper} can't find the pattern. Time compounds the pressure. Eventually ${dropper} falters and steps back.`;
    }
    remaining = remaining.filter(p => p !== dropper);
    stages.push({ type: 'drop', dropper, remaining: [...remaining], text: dropText });

    if (remaining.length === 2) {
      const [a, b] = remaining;
      const aWins = a === winner;
      const strong = aWins ? a : b, weak = aWins ? b : a;
      const strongS = pStats(strong);
      stages.push({ type: 'headToHead', remaining: [...remaining],
        text: strongS.endurance >= 8
          ? `Two left. ${strong} looks locked in — breathing steady, eyes forward. ${weak} is straining. This is a battle of wills that neither wants to lose.`
          : challengeType === 'endurance'
          ? `${a} and ${b} alone now. The minutes stretch out. Nobody says a word. Nobody moves. Nobody breaks.`
          : `${a} and ${b} neck and neck. Every move matters. One slip ends it all.` });
    }
  });

  // Winner takes it
  const wLabel = wStats.endurance >= 8 ? 'endurance' : wStats.mental >= 8 ? 'mental' : wStats.physical >= 8 ? 'physical' : 'mixed';
  stages.push({ type: 'win', winner, remaining: [winner],
    text: wLabel === 'endurance'
      ? `${winner} holds. And holds. The seconds become minutes. The tribe watches. Then — it's over. ${winner} wins the Final Immunity Challenge.`
      : wLabel === 'mental'
      ? `${winner} locks in. The answer is right. The challenge is over. ${winner} wins the Final Immunity Challenge.`
      : `${winner} pushes through the last stretch when everyone else had nothing left. ${winner} wins the Final Immunity Challenge.` });

  return stages;
}

// Eliminated players pick which finalist's bench to sit on
export function generateBenchAssignments(finalists) {
  // Pool: jury for jury formats, all eliminated for final-challenge
  const pool = (seasonConfig.finaleFormat === 'final-challenge' || seasonConfig.finaleFormat === 'olympic-relay') ? [...gs.eliminated] : [...(gs.jury || [])];
  const assignments = Object.fromEntries(finalists.map(f => [f, []]));
  const reasons = {};

  pool.forEach(supporter => {
    const elimEp = (gs.episodeHistory || []).find(h => h.eliminated === supporter || h.firstEliminated === supporter);
    const votersWhoGotMeOut = (elimEp?.votingLog || []).filter(v => v.voted === supporter && v.voter !== 'THE GAME').map(v => v.voter);

    const scored = finalists.map(f => {
      const bond = getBond(supporter, f);
      const votedMeOut = votersWhoGotMeOut.includes(f);
      const penalty = votedMeOut && bond < 2 ? -1.5 : 0;
      return { finalist: f, bond, score: bond + penalty };
    });
    scored.sort((a, b) => b.score - a.score);

    const best = scored[0];
    const finalist = best.finalist;
    assignments[finalist].push(supporter);

    // Build context-rich reason referencing actual game history
    const _pick = (arr, seed) => arr[([...seed].reduce((a,c)=>a+c.charCodeAt(0),0)+(gs.episode||0)*7)%arr.length];
    const votedMeOut = votersWhoGotMeOut.includes(finalist);
    const otherFinalist = scored.length >= 2 ? scored[scored.length - 1].finalist : null;
    const otherVotedMeOut = otherFinalist ? votersWhoGotMeOut.includes(otherFinalist) : false;
    const otherBond = otherFinalist ? getBond(supporter, otherFinalist) : 0;
    const wereAllied = (gs.episodeHistory || []).some(h =>
      (h.alliances || []).some(a => a.members?.includes(supporter) && a.members?.includes(finalist))
    );
    const wereAlliedOther = otherFinalist && (gs.episodeHistory || []).some(h =>
      (h.alliances || []).some(a => a.members?.includes(supporter) && a.members?.includes(otherFinalist))
    );
    // Who has a friend still supporting from the jury?
    const friendOnJury = pool.find(j => j !== supporter && getBond(supporter, j) >= 2 && getBond(j, finalist) >= 2);

    const reasonPool = [];

    // Tier 1: strong ally — references the actual alliance
    if (wereAllied && best.bond >= 2)
      reasonPool.push(`${finalist} and I were allied from the start. We had each other\u2019s backs. That doesn\u2019t end because I got voted out.`);
    if (wereAllied && best.bond >= 2)
      reasonPool.push(`We played together. We strategized together. ${finalist} is the person I want to see win because I know what ${finalist} went through.`);

    // Tier 2: rejected the other finalist — reference WHY
    if (otherVotedMeOut && otherBond <= 0)
      reasonPool.push(`${otherFinalist} voted me out. So no \u2014 I\u2019m not sitting on ${otherFinalist}\u2019s bench. ${finalist} gets my support by default, but I mean it.`);
    if (otherVotedMeOut && wereAlliedOther)
      reasonPool.push(`${otherFinalist} and I were in the same alliance. Then ${otherFinalist} wrote my name down. That\u2019s why I\u2019m here \u2014 on ${finalist}\u2019s side.`);
    if (otherBond <= -2)
      reasonPool.push(`I\u2019ve watched ${otherFinalist} play from the bench. I don\u2019t respect it. I don\u2019t want ${otherFinalist} to win. ${finalist} is my pick.`);
    if (otherBond <= -2)
      reasonPool.push(`${otherFinalist} played selfish the entire season. Burned people, broke deals, never owned it. I\u2019d sit on anyone\u2019s bench to make sure ${otherFinalist} doesn\u2019t win.`);

    // Tier 3: genuine support for this finalist
    if (best.bond >= 3)
      reasonPool.push(`${finalist} was real with me the entire game. Never lied to my face, never went behind my back. I\u2019m here because ${finalist} earned it.`);
    if (best.bond >= 3 && friendOnJury)
      reasonPool.push(`${friendOnJury} and I talked about this at the jury house. We both agree \u2014 ${finalist} played the best game. This bench was an easy choice.`);
    if (best.bond >= 1 && !votedMeOut)
      reasonPool.push(`${finalist} never came after me. In a game where everyone writes names, that means something. I remember who didn\u2019t try to end my game.`);

    // Tier 4: voted me out but I respect it
    if (votedMeOut && best.bond >= 0)
      reasonPool.push(`${finalist} voted me out. I know that. But I\u2019ve had time to think about it, and it was the right move. I can\u2019t be angry at someone for playing the game well.`);
    if (votedMeOut && best.bond >= 1)
      reasonPool.push(`Yeah, ${finalist} was part of the vote against me. But ${finalist} told me to my face before tribal. That\u2019s more than most people did. I respect the honesty.`);

    // Tier 5: reluctant / no good option
    if (best.bond <= 0 && otherBond <= 0)
      reasonPool.push(`I don\u2019t love either option. But ${finalist} didn\u2019t actively make my life worse out here. ${otherFinalist ? `${otherFinalist} did.` : `That\u2019s the bar.`} So here I am.`);
    if (best.bond <= 0 && best.bond > otherBond)
      reasonPool.push(`This isn\u2019t a vote for ${finalist}. This is a vote against ${otherFinalist || 'the alternative'}. Sometimes that\u2019s how this game works.`);

    // Fallback
    if (!reasonPool.length) {
      reasonPool.push(`I\u2019ve been thinking about this since I got here. ${finalist} is the right call. Not emotional \u2014 just clear.`);
      reasonPool.push(`From the jury bench, ${finalist}\u2019s game makes the most sense to me. That\u2019s where I\u2019m sitting.`);
    }

    const reason = _pick(reasonPool, supporter + finalist + 'bench');
    reasons[supporter] = { finalist, reason, bond: best.bond };
  });

  return { assignments, reasons };
}

// Each finalist picks an assistant from their bench (final-challenge format only)
export function selectAssistants(finalists, benchAssignments) {
  const assistants = {};

  finalists.forEach(f => {
    const bench = benchAssignments[f] || [];
    if (!bench.length) {
      assistants[f] = null;
      return;
    }

    const fS = pStats(f);
    const heartWeight = (fS.loyalty + fS.social + fS.temperament) / 3;
    const brainWeight = (fS.strategic + fS.mental + fS.boldness) / 3;
    const diff = heartWeight - brainWeight;

    const heartPick = bench.reduce((best, p) =>
      getBond(f, p) > getBond(f, best) ? p : best, bench[0]);
    const brainPick = bench.reduce((best, p) => {
      const pS = pStats(p), bS = pStats(best);
      const pScore = pS.physical + pS.endurance + pS.mental;
      const bScore = bS.physical + bS.endurance + bS.mental;
      return pScore > bScore ? p : best;
    }, bench[0]);

    let chosen, decision;
    if (heartPick === brainPick) {
      chosen = heartPick;
      decision = 'unanimous';
    } else if (diff >= 3) {
      chosen = heartPick;
      decision = 'heart';
    } else if (diff <= -3) {
      chosen = brainPick;
      decision = 'brain';
    } else {
      const heartChance = 0.5 + (diff / 6) * 0.3;
      if (fS.temperament < 4) {
        chosen = Math.random() < 0.5 ? heartPick : brainPick;
        decision = 'impulsive';
      } else {
        chosen = Math.random() < heartChance ? heartPick : brainPick;
        decision = 'agonized';
      }
    }

    const chosenBond = getBond(f, chosen);
    assistants[f] = {
      name: chosen,
      stats: pStats(chosen),
      bond: chosenBond,
      heartPick, brainPick,
      decision,
    };
  });

  return assistants;
}

// Multi-stage finale challenge (replaces single simulateIndividualChallenge for final-challenge format)
export function simulateFinaleChallenge(finalists, assistants) {
  const _allStages = [
    { name: 'The Perch', finalName: 'Last One Standing', statA: 'endurance', statB: 'mental', assistStat: 'endurance', desc: 'Hold on. Outlast. The last one standing moves forward.', finalDesc: 'Hold on. Outlast. The last one standing wins everything.' },
    { name: 'The Gauntlet', finalName: 'The Final Sprint', statA: 'physical', statB: 'endurance', assistStat: 'physical', desc: 'Sprint, climb, crawl. Pure physical will.', finalDesc: 'Sprint, climb, crawl. No help. No second chances. First across the line wins it all.' },
    { name: 'The Cipher', finalName: 'The Final Code', statA: 'mental', statB: 'strategic', assistStat: 'mental', desc: 'Decode, assemble, solve. Brains over brawn.', finalDesc: 'One lock. One code. Solve it or lose everything.' },
  ];
  // Randomize all three stages — puzzle can come first, making mental assistants valuable
  for (let i = _allStages.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [_allStages[i], _allStages[j]] = [_allStages[j], _allStages[i]];
  }
  const stages = _allStages;

  const scores = Object.fromEntries(finalists.map(f => [f, 0]));
  const stageResults = [];
  const sabotageEvents = [];

  stages.forEach((stage, idx) => {
    const stageScores = {};
    const isLastAssistedStage = idx === stages.length - 2; // assistants drop off before the final stage
    finalists.forEach(f => {
      const s = pStats(f);
      let base = s[stage.statA] * 0.6 + s[stage.statB] * 0.4 + (Math.random() * 3 - 1.5);

      // Assistant boost (first 2 stages only — final stage is always solo)
      if (stage.assistStat && assistants?.[f]?.name && idx < stages.length - 1) {
        const asst = assistants[f];
        const aStats = asst.stats || pStats(asst.name);
        const boost = aStats[stage.assistStat] * 0.15;
        // Sabotage: roll fresh each assisted stage — scales with hatred intensity
        const sabotageChance = asst.bond < 0 ? Math.min(0.50, Math.abs(asst.bond) * 0.05) : 0;
        if (sabotageChance > 0 && Math.random() < sabotageChance) {
          base -= boost * 1.5;
          sabotageEvents.push({ stage: idx, stageName: stage.name, finalist: f, assistant: asst.name });
        } else {
          base += boost;
        }
      }

      stageScores[f] = Math.max(0, base);
      scores[f] += stageScores[f];
    });

    const stageSorted = Object.entries(stageScores).sort(([,a],[,b]) => b - a);
    const _isFinalStage = idx === stages.length - 1;
    stageResults.push({
      name: _isFinalStage && stage.finalName ? stage.finalName : stage.name,
      desc: _isFinalStage && stage.finalDesc ? stage.finalDesc : stage.desc,
      scores: { ...stageScores },
      winner: stageSorted[0][0],
      hasAssistant: !!stage.assistStat && idx < stages.length - 1,
      assistantDropoff: isLastAssistedStage,
    });
  });

  const sorted = Object.entries(scores).sort(([,a],[,b]) => b - a);
  const winner = sorted[0][0];

  return {
    stages: stageResults,
    totalScores: scores,
    winner,
    placements: sorted.map(([name]) => name),
    sabotageEvents,
  };
}

// ══════════════════════════════════════════════════════════════════════
// REJECTED OLYMPIC RELAY — TDI-style finale challenge
// ══════════════════════════════════════════════════════════════════════

// Pre-race phase: pitches, confessionals, sabotage planting
export function generateRelayPreRace(finalists, benchAssignments) {
  const _pick = (arr, seed) => arr[([...seed].reduce((a,c)=>a+c.charCodeAt(0),0)+(gs.episode||0)*7)%arr.length];
  const confessionals = [];
  const benchFlips = [];
  let plantedSabotage = null;
  let plantedSabotage2 = null;

  // ── Finalist pitches ──
  const pitches = {};
  finalists.forEach(f => {
    const s = pStats(f);
    const pr = pronouns(f);
    const p = players.find(pl => pl.name === f);
    const arch = p?.archetype || 'floater';
    let pitchType, pitchText, pitchQuality;

    if (s.boldness >= 7 && s.social >= 6) {
      pitchType = 'yacht-party';
      pitchQuality = s.social * 0.4 + s.boldness * 0.3 + Math.random() * 2;
      pitchText = _pick([
        `${f} steps up: "If I win, we're ALL celebrating. Yacht party. Everyone's invited. That's a promise."`,
        `${f} grins at the bench: "I didn't get here alone. You all know that. Win or lose, we eat tonight."`,
        `"Look — I know what you want to hear. So here it is: I will throw the biggest party this island has EVER seen." ${f} winks.`,
      ], f + 'pitch');
    } else if (s.loyalty >= 7 && ['hero','loyal-soldier','social-butterfly','underdog'].includes(arch)) {
      pitchType = 'split-winnings';
      pitchQuality = s.loyalty * 0.4 + s.social * 0.3 + Math.random() * 2;
      pitchText = _pick([
        `${f} looks each supporter in the eye: "I meant every alliance. Every promise. If I win this, the people who had my back get taken care of."`,
        `"I'm not here to showboat." ${f} pauses. "I'm here because of you. And I don't forget that."`,
        `${f} keeps it simple: "You stuck with me. I'll stick with you. That's the deal."`,
      ], f + 'pitch');
    } else if (s.strategic >= 7 && ['villain','mastermind','schemer'].includes(arch)) {
      pitchType = 'earned-this';
      pitchQuality = s.strategic * 0.4 + s.boldness * 0.3 + Math.random() * 2;
      pitchText = _pick([
        `${f} doesn't apologize: "I played the hardest game out here. Every move, every blindside — that was me. I earned this spot."`,
        `"You don't have to like how I played." ${f} stares down the bench. "But you have to respect it."`,
        `${f} smirks: "I'm not gonna beg. I'm gonna win. And deep down, you all know I deserve to."`,
      ], f + 'pitch');
    } else {
      pitchType = 'underdog';
      pitchQuality = s.social * 0.3 + s.temperament * 0.3 + Math.random() * 2;
      pitchText = _pick([
        `${f} takes a breath: "Nobody expected me here. I didn't expect me here. But I'm not leaving without a fight."`,
        `"I know I'm not the loudest. I know I'm not the strongest." ${f} sets ${pr.posAdj} jaw. "But I'm still here. That has to count for something."`,
        `${f} stumbles on ${pr.posAdj} words, then steadies: "I just want to prove that the quiet ones can win too."`,
      ], f + 'pitch');
    }

    pitches[f] = { type: pitchType, text: pitchText, quality: pitchQuality };
  });

  // ── Bench flips from pitches ──
  finalists.forEach(pitcher => {
    const pitch = pitches[pitcher];
    const otherFinalists = finalists.filter(f => f !== pitcher);
    otherFinalists.forEach(rival => {
      const rivalBench = benchAssignments[rival] || [];
      rivalBench.forEach(supporter => {
        const currentBond = getBond(supporter, rival);
        const pitcherBond = getBond(supporter, pitcher);
        const flipRoll = pitch.quality * 0.03 - currentBond * 0.02 + pitcherBond * 0.01 + (Math.random() * 0.3 - 0.15);
        if (flipRoll > 0.35 && currentBond < 3) {
          benchFlips.push({ supporter, from: rival, to: pitcher, reason: pitch.type });
          // Move supporter
          benchAssignments[rival] = benchAssignments[rival].filter(s => s !== supporter);
          if (!benchAssignments[pitcher]) benchAssignments[pitcher] = [];
          benchAssignments[pitcher].push(supporter);
        }
      });
    });
  });

  // ── Chris Intro ──
  const finalistList = finalists.length === 2
    ? `${finalists[0]} and ${finalists[1]}`
    : finalists.join(', ');
  confessionals.push({
    player: 'Chris',
    text: _pick([
      `Chris grins at the camera: "Welcome to the FINALE of Total Drama Island! After weeks of backstabbing, alliances, and questionable hygiene — it all comes down to THIS. ${finalistList}. One obstacle course. One winner. One. Hundred. Thousand. DOLLARS. Let's do this."`,
      `"Ladies and gentlemen — and you, Chef — it's FINALE TIME!" Chris spreads his arms. "The Rejected Olympic Relay! Three phases. Two finalists. ${finalistList} have clawed their way here, and only ONE walks away a hundred grand richer. I literally cannot WAIT."`,
      `Chris adjusts his hair one final time. "This is it, people. The big one. ${finalistList} are about to face the most grueling, humiliating, and frankly hilarious obstacle course I've ever designed. Which is saying something. Chef, start the dramatic music!" Chef glares. There is no music.`,
    ], 'chrisIntro'),
  });

  // ── Confessionals ──
  finalists.forEach(f => {
    const s = pStats(f);
    const pr = pronouns(f);
    const p = players.find(pl => pl.name === f);
    const arch = p?.archetype || 'floater';
    const benchSize = (benchAssignments[f] || []).length;
    const rival = finalists.find(o => o !== f);
    const rivalBond = rival ? getBond(f, rival) : 0;

    const pool = [];
    if (['villain','mastermind','schemer'].includes(arch)) {
      pool.push(`*Confessional — ${f}:* "They can cheer all they want. I know exactly how this ends. I've known since day one."`);
      pool.push(`*Confessional — ${f}:* "Every person I eliminated? A stepping stone. And now there's one stone left." ${f} cracks ${pr.posAdj} knuckles.`);
      pool.push(`*Confessional — ${f}:* "The best villain doesn't just win. The best villain makes everyone WATCH ${pr.obj} win. That's the real prize."`);
    }
    if (['hero','loyal-soldier'].includes(arch)) {
      pool.push(`*Confessional — ${f}:* "I can hear them cheering for me. That means more than the money. …Okay, the money too."`);
      pool.push(`*Confessional — ${f}:* "My mom is watching this. My whole FAMILY is watching this. I'm not losing in front of them. No way."`);
      pool.push(`*Confessional — ${f}:* "Win or lose, I played this game the right way. But between you and me? I'd rather win."`);
    }
    if (['social-butterfly','showmancer'].includes(arch)) {
      pool.push(`*Confessional — ${f}:* "Everyone said I was just here to make friends. Well look who's in the FINALE, Janet." ${f} snaps ${pr.posAdj} fingers.`);
      pool.push(`*Confessional — ${f}:* "I talked my way here. Now I just gotta... run my way to the end? That's... less ideal. But I'll figure it out."`);
    }
    if (['challenge-beast'].includes(arch)) {
      pool.push(`*Confessional — ${f}:* "This whole game I've been winning when it counts. Finale's no different. This is MY arena."`);
      pool.push(`*Confessional — ${f}:* "An obstacle course? Finally. Something that rewards ACTUAL skill. Let's go."`);
    }
    if (['wildcard','chaos-agent'].includes(arch)) {
      pool.push(`*Confessional — ${f}:* "Honestly? I have NO idea how I got here. But I'm here. And that's terrifying for everyone else."`);
      pool.push(`*Confessional — ${f}:* "Plan? What plan? The plan is CHAOS. Same as every other episode."`);
    }
    if (s.boldness >= 8)
      pool.push(`*Confessional — ${f}:* "I've been waiting for this my ENTIRE life. Let's GO!"`);
    if (s.boldness <= 3)
      pool.push(`*Confessional — ${f}:* "I think I'm gonna throw up. Is that normal? Is that a finale thing? Someone tell me that's normal."`);
    if (benchSize <= 2)
      pool.push(`*Confessional — ${f}:* "Not a lot of people on my bench. That's fine. I don't need a crowd. I need a finish line."`);
    if (benchSize >= 5)
      pool.push(`*Confessional — ${f}:* "Look at that bench. Every single one of those people believed in me enough to sit there. I can't let them down."`);
    if (['underdog','goat'].includes(arch)) {
      pool.push(`*Confessional — ${f}:* "Everyone counted me out. I counted me out. But here I am. In the finale. What even IS this game?"`);
      pool.push(`*Confessional — ${f}:* "If I win this… I don't even know what I'd do. Cry? Probably cry. Definitely cry."`);
    }
    if (['floater','perceptive-player'].includes(arch))
      pool.push(`*Confessional — ${f}:* "I flew under the radar all season. Nobody thought I was a threat. And now I'm HERE. The invisibility cloak WORKED."`);
    if (rival && rivalBond <= -3)
      pool.push(`*Confessional — ${f}:* "Of all people to face in the finale, it's ${rival}. The ONE person I cannot STAND losing to. So I won't."`);
    if (rival && rivalBond >= 5)
      pool.push(`*Confessional — ${f}:* "Yeah, ${rival}'s my friend. Yeah, I want ${pronouns(rival).obj} to be happy. But a hundred thousand dollars is a hundred thousand dollars. Friendship has a LIMIT."`);
    pool.push(`*Confessional — ${f}:* "Deep breath. This is it. Everything comes down to right now."`);

    confessionals.push({ player: f, text: _pick(pool, f + 'conf') });
  });

  // Chef confessionals (2-3 lines)
  confessionals.push({
    player: 'Chef',
    text: _pick([
      `*Confessional — Chef Hatchet:* "I built that obstacle course with my own two hands. If neither of these maggots can finish it, I'm keeping the prize money myself."`,
      `*Confessional — Chef Hatchet:* "Been watching these two all season. One of 'em might actually deserve to win. The other one? Heh. We'll see."`,
      `*Confessional — Chef Hatchet:* "Chris told me to make it fair. I told Chris to mind his business. This is MY course."`,
    ], 'chef-conf'),
  });
  confessionals.push({
    player: 'Chef',
    text: _pick([
      `*Confessional — Chef Hatchet:* "I put extra grease on that flagpole myself. Not sabotage — maintenance. Very different. Very legal."`,
      `*Confessional — Chef Hatchet:* "The sharks in that gorge? Fed 'em this morning. …Mostly. One of 'em looked at me funny so I cut his breakfast short."`,
      `*Confessional — Chef Hatchet:* "If BOTH of 'em fall off the beam, do I get the money? Asking for me."`,
    ], 'chef-conf2'),
  });

  // ── Sabotage planting ──
  finalists.forEach(f => {
    const bench = benchAssignments[f] || [];
    const otherFinalist = finalists.find(o => o !== f);
    if (!otherFinalist) return;

    bench.forEach(supporter => {
      const p = players.find(pl => pl.name === supporter);
      const arch = p?.archetype || 'floater';
      const s = pStats(supporter);
      const isVillain = ['villain','mastermind','schemer'].includes(arch);
      const isNeutralSchemer = !isVillain && !['hero','loyal-soldier','social-butterfly','showmancer','underdog','goat'].includes(arch) && s.strategic >= 6 && s.loyalty <= 4;

      if (!isVillain && !isNeutralSchemer) return;
      if (plantedSabotage && plantedSabotage.targetFinalist === otherFinalist) return; // max 1 per side

      const plantChance = isVillain ? 0.5 : 0.25;
      if (Math.random() > plantChance) return;

      const sabType = !plantedSabotage ? 'cupcake' : !plantedSabotage2 ? 'grease' : null;
      if (!sabType) return;

      const sab = { planter: supporter, onBehalfOf: f, targetFinalist: otherFinalist, type: sabType };
      if (sabType === 'cupcake') plantedSabotage = sab;
      else plantedSabotage2 = sab;
    });
  });

  return { pitches, confessionals, benchFlips, plantedSabotage, plantedSabotage2, benchAssignments };
}

// Main relay simulation — 3 phases: flagpole, beam, sprint
export function simulateRejectedOlympicRelay(finalists, assistants, benchAssignments, preRaceData) {
  const _pick = (arr, seed) => arr[([...seed].reduce((a,c)=>a+c.charCodeAt(0),0)+(gs.episode||0)*7)%arr.length];
  const plantedSabotage = preRaceData?.plantedSabotage || null;
  const plantedSabotage2 = preRaceData?.plantedSabotage2 || null;
  const timeline = [];
  const scores = Object.fromEntries(finalists.map(f => [f, 0]));
  const stageResults = [];
  const sabotageEvents = [];

  // ════════ PHASE 1: FLAGPOLE ════════
  const flagpoleScores = {};
  const flagpoleEvents = [];

  // Chris commentary — phase start
  flagpoleEvents.push({
    type: 'chrisCommentary', phase: 0, player: 'Chris',
    players: finalists.slice(),
    text: _pick([
      `Chris cups his hands: "Phase ONE! The Flagpole of SHAME! Climb up, grab your flag, slide down. First one back gets a lead. Oh, and we greased it. Obviously."`,
      `"Alright, campers—" Chris catches himself. "Sorry, finalists. Phase one: the greased flagpole. It's exactly as miserable as it sounds. On your marks!"`,
      `Chris leans into his megaphone: "THE FLAGPOLE! Fifty feet of slippery, humiliating glory! Who wants it more?! CLIMB!"`,
    ], 'chrisFlagpole'),
    badgeText: 'HOST', badgeClass: 'yellow',
  });

  // Hat assignment (archetype-specific comedy)
  finalists.forEach(f => {
    const p = players.find(pl => pl.name === f);
    const arch = p?.archetype || 'floater';
    const pr = pronouns(f);
    let hat, reaction;
    if (['villain','mastermind','schemer'].includes(arch)) {
      hat = _pick(['a pair of devil horns glued to a bicycle helmet', 'a cape made from a garbage bag and a "VILLAIN" sash', 'a headband with tiny pitchforks sticking out'], f + 'hat');
      reaction = _pick([`"You think this is funny, McLean?"`, `${f} puts it on with zero hesitation. "I've worn worse."`, `${f} glares at it, then at Chris, then puts it on with murderous calm.`], f + 'hatR');
    } else if (['hero','loyal-soldier'].includes(arch)) {
      hat = _pick(['a halo made of duct tape and coat hangers', 'a cardboard crown spray-painted gold', 'a "HERO" headband with a cape made of paper towels'], f + 'hat');
      reaction = _pick([`${f} actually smiles. "I've always wanted a halo."`, `"Is this... supposed to be inspiring?" ${f} adjusts the tape. "Because it's working."`, `${f} strikes a heroic pose. The bench cheers.`], f + 'hatR');
    } else if (['challenge-beast'].includes(arch)) {
      hat = _pick(['a bull horn headband with "BEAST MODE" written in marker', 'a gladiator helmet made of cardboard and tinfoil', 'a sweatband with a cartoon muscle arm on it'], f + 'hat');
      reaction = _pick([`${f} punches the air. "LET'S GO!"`, `"I look ridiculous." ${f} grins. "But I look ridiculous in the FINALE."`, `${f} flexes. The horns fall off. ${pr.Sub} puts them back on.`], f + 'hatR');
    } else if (['social-butterfly','showmancer'].includes(arch)) {
      hat = _pick(['a tiara made of sporks and sparkly pipe cleaners', 'a flower crown that smells suspiciously like Chef\'s kitchen', 'a bedazzled visor that says "POPULAR"'], f + 'hat');
      reaction = _pick([`"Okay, this is actually cute?" ${f} adjusts it like a real crown.`, `${f} takes a selfie. "Content FIRST, competition second."`, `"I will win this looking FABULOUS." ${f} strikes a pose.`], f + 'hatR');
    } else if (['underdog','goat'].includes(arch)) {
      hat = _pick(['a dunce cap with "SURPRISE FINALIST" written on it', 'a paper bag with eye holes and a smiley face drawn on', 'an oversized baseball cap that keeps falling over ${pr.posAdj} eyes'], f + 'hat');
      reaction = _pick([`${f} stares at it. "…Yeah, that tracks."`, `"At least it matches my expectations." ${f} sighs and puts it on.`, `${f} puts it on backwards. "There. Now it says TSILANIF ESIRPRUS. Much better."`], f + 'hatR');
    } else if (['wildcard','chaos-agent'].includes(arch)) {
      hat = _pick(['a propeller beanie that actually spins', 'a rubber chicken strapped to a headband', 'a raccoon-shaped headband with glowing LED eyes'], f + 'hat');
      reaction = _pick([`${f} LOVES it. Spins around. The bench is concerned.`, `"BEST. HAT. EVER." ${f} will NOT be taking it off after the race.`, `${f} puts it on upside down. On purpose? Maybe.`], f + 'hatR');
    } else {
      hat = _pick(['a chef\'s hat three sizes too big', 'an "I ♥ Chef" baseball cap', 'a rubber chicken helmet with feathers falling off'], f + 'hat');
      reaction = _pick([`"You're kidding." ${f} puts it on anyway.`, `${f} looks at it like it personally offended ${pr.obj}.`, `"This is a JOKE, right?" ${f} turns to Chris. Chris is already laughing.`], f + 'hatR');
    }
    flagpoleEvents.push({ type: 'hatAssign', phase: 0, player: f, players: [f], hat, text: `${f} is handed ${hat}. ${reaction}`, badgeText: 'HAT', badgeClass: 'yellow' });
  });

  finalists.forEach(f => {
    const s = pStats(f);
    const pr = pronouns(f);
    const p = players.find(pl => pl.name === f);
    const arch = p?.archetype || 'floater';
    let base = s.physical * 0.3 + s.endurance * 0.2 + s.boldness * 0.1 + (Math.random() * 3 - 1.5);

    // Climbing narration — stat-driven opening beat
    const climbRating = s.physical * 0.4 + s.endurance * 0.3 + s.boldness * 0.3;
    if (climbRating >= 7) {
      flagpoleEvents.push({ type: 'flagpoleStruggle', phase: 0, player: f, players: [f],
        text: _pick([
          `${f} attacks the pole like ${pr.sub}'s done this before. Hand over hand, feet locked, steady rhythm. ${pr.Sub} doesn't even look down.`,
          `${f} LAUNCHES up the pole. Pure power. ${pr.Sub}'s halfway up before the bench finishes gasping.`,
          `${f} grips the pole and climbs with terrifying efficiency. No wasted motion. No hesitation. The bench goes quiet — this looks like a winner.`,
        ], f + 'climb'),
        badgeText: 'CLIMBING', badgeClass: 'green' });
    } else if (climbRating >= 4) {
      flagpoleEvents.push({ type: 'flagpoleStruggle', phase: 0, player: f, players: [f],
        text: _pick([
          `${f} starts climbing. Slips. Tries again. Gets a grip. Slips again. "Come ON!" The progress is real, but ugly.`,
          `${f} makes it a quarter of the way up, hugging the pole for dear life. Deep breath. Another lunge upward. Slow but determined.`,
          `${f}'s technique is… creative. Part climbing, part hugging, part threatening the pole with bodily harm. It's working. Barely.`,
        ], f + 'climb'),
        badgeText: 'STRUGGLING', badgeClass: 'yellow' });
    } else {
      flagpoleEvents.push({ type: 'flagpoleStruggle', phase: 0, player: f, players: [f],
        text: _pick([
          `${f} jumps at the pole. Slides back down immediately. Jumps again. Slides down. ${pr.Sub} looks up at it like it's personally insulted ${pr.obj}.`,
          `${f} wraps ${pr.posAdj} arms around the pole and just… hangs there. Not climbing. Not falling. Just existing vertically.`,
          `${f} makes it two feet off the ground before gravity has a word. And another word. And another. This is going to take a while.`,
        ], f + 'climb'),
        badgeText: 'FLAILING', badgeClass: 'red' });
    }

    // Grease sabotage
    if (plantedSabotage2 && plantedSabotage2.targetFinalist === f) {
      let penalty = -1.5;
      // Detection by perceptive supporter
      const bench = benchAssignments[f] || [];
      const detector = bench.find(s2 => pStats(s2).intuition * 0.12 > 0.7);
      if (detector) {
        penalty *= 0.5;
        flagpoleEvents.push({ type: 'flagpoleSabotageDetect', phase: 0, player: detector, target: f, players: [detector, f], text: `${detector} spots the grease on the pole. "HEY! That pole's been tampered with!" The penalty is halved.`, badgeText: 'DETECTED', badgeClass: 'green' });
      }
      base += penalty;
      flagpoleEvents.push({ type: 'flagpoleSabotage', phase: 0, player: f, planter: plantedSabotage2.planter, players: [f, plantedSabotage2.planter], penalty, text: `${f}'s hands slip — the pole is greased! ${plantedSabotage2.planter}'s handiwork from earlier.`, badgeText: 'SABOTAGE', badgeClass: 'red' });
      sabotageEvents.push({ phase: 0, type: 'grease', target: f, planter: plantedSabotage2.planter });
    }

    // Supporter boost
    const bench = benchAssignments[f] || [];
    const booster = bench.find(s2 => {
      const p2 = players.find(pl => pl.name === s2);
      const arch2 = p2?.archetype || 'floater';
      return ['villain','mastermind','schemer','challenge-beast','hero'].includes(arch2);
    });
    if (booster) {
      const bS = pStats(booster);
      const p2 = players.find(pl => pl.name === booster);
      const arch2 = p2?.archetype || 'floater';
      let boost = 0;
      if (['villain','mastermind','schemer'].includes(arch2)) boost = bS.physical * 0.05;
      else if (arch2 === 'hero') boost = bS.social * 0.03;
      else if (arch2 === 'challenge-beast') boost = bS.physical * 0.06;
      base += boost;
      flagpoleEvents.push({ type: 'flagpoleBoost', phase: 0, player: f, booster, players: [f, booster], boost, text: `${booster} pushes ${f} from below — "CLIMB! Don't look down!"`, badgeText: 'BOOST', badgeClass: 'blue' });
    }

    // Assistant contribution — Phase 1
    const asst = assistants?.[f];
    if (asst?.name) {
      const aS = asst.stats || pStats(asst.name);
      const asstBoost = (aS.physical * 0.08 + aS.endurance * 0.04);
      const sabChance = asst.bond < 0 ? Math.min(0.45, Math.abs(asst.bond) * 0.05) : 0;
      if (sabChance > 0 && Math.random() < sabChance) {
        base -= asstBoost * 1.5;
        sabotageEvents.push({ phase: 0, type: 'assistant-sabotage', target: f, planter: asst.name });
        flagpoleEvents.push({ type: 'assistantSabotage', phase: 0, player: asst.name, players: [asst.name, f],
          text: _pick([
            `${asst.name} is supposed to be helping ${f} climb. Instead, ${pronouns(asst.name).sub} ${pronouns(asst.name).sub === 'they' ? '"accidentally" step' : '"accidentally" steps'} on ${f}'s foot. Hard.`,
            `${asst.name} holds the pole "steady" — and gives it a twist at the worst possible moment. ${f} slips back three feet.`,
          ], asst.name + 'asstSab1'),
          badgeText: 'ASSISTANT SABOTAGE', badgeClass: 'red' });
      } else {
        base += asstBoost;
        flagpoleEvents.push({ type: 'assistantHelp', phase: 0, player: asst.name, players: [asst.name, f],
          text: _pick([
            `${asst.name} braces the pole from below, giving ${f} a stable base. "Go! I've got you!"`,
            `${asst.name} interlocks ${pronouns(asst.name).posAdj} hands into a step. ${f} launches upward. Teamwork.`,
            `${asst.name} wipes down the pole ahead of ${f}'s grip. Every inch counts.`,
          ], asst.name + 'asstHelp1'),
          badgeText: 'ASSISTANT', badgeClass: 'blue' });
      }
    }

    flagpoleScores[f] = Math.max(0, base);
    scores[f] += flagpoleScores[f];
  });

  const flagSorted = Object.entries(flagpoleScores).sort(([,a],[,b]) => b - a);
  const flagWinner = flagSorted[0][0];
  const flagLoser = flagSorted.length > 1 ? flagSorted[flagSorted.length - 1][0] : flagWinner;
  const flagCarryover = 1.0;
  scores[flagWinner] += flagCarryover;

  // Taunt — if finalists have negative bond, the leader taunts from above
  if (finalists.length >= 2 && getBond(flagWinner, flagLoser) <= -2) {
    const winArch = players.find(pl => pl.name === flagWinner)?.archetype || 'floater';
    const winPr = pronouns(flagWinner);
    const tauntText = ['villain','mastermind','schemer'].includes(winArch)
      ? _pick([
        `${flagWinner} looks DOWN at ${flagLoser} from the top and laughs. "Take your time! I'll wait!" ${flagLoser}'s face goes red.`,
        `${flagWinner} grabs the flag and waves it at ${flagLoser}. "Looking for THIS?" The bench gasps.`,
        `"Hey ${flagLoser}!" ${flagWinner} calls from the top. "The view up here is AMAZING. Shame you'll never see it."`,
      ], flagWinner + 'taunt')
      : _pick([
        `${flagWinner} can't resist a look down. "${flagLoser}. SERIOUSLY?" It's not trash talk. It's worse — it's disappointment.`,
        `${flagWinner} reaches the top first and mutters just loud enough for the mic to catch: "Knew it." ${flagLoser} hears every word.`,
      ], flagWinner + 'taunt');
    flagpoleEvents.push({ type: 'flagpoleTaunt', phase: 0, player: flagWinner, players: [flagWinner, flagLoser], text: tauntText, badgeText: 'TAUNT', badgeClass: 'red' });
  }

  flagpoleEvents.push({ type: 'flagpoleWin', phase: 0, player: flagWinner, players: [flagWinner], text: `${flagWinner} grabs the flag first! A ${flagCarryover.toFixed(1)}-point lead heading into the beam.`, badgeText: 'PHASE 1 WIN', badgeClass: 'gold' });

  // Bench reaction to flagpole result
  {
    const winnerBench = benchAssignments[flagWinner] || [];
    const loserBench = benchAssignments[flagLoser] || [];
    if (winnerBench.length > 0) {
      const reactor = _pick(winnerBench, 'flagBenchW');
      const reactPr = pronouns(reactor);
      flagpoleEvents.push({ type: 'flagpoleBenchReaction', phase: 0, player: reactor, players: [reactor, flagWinner],
        text: _pick([
          `${reactor} leaps off the bench: "THAT'S MY PLAYER! LET'S GO!" ${reactPr.Sub} high-fives the air.`,
          `${reactor} pumps ${reactPr.posAdj} fist and screams at an octave that shouldn't be physically possible.`,
          `${reactor} grabs the person next to ${reactPr.obj}: "DID YOU SEE THAT?! DID YOU SEE?!" They did. Everyone did.`,
        ], reactor + 'flagBenchR'),
        badgeText: 'BENCH', badgeClass: 'blue' });
    }
    if (loserBench.length > 0) {
      const reactor = _pick(loserBench, 'flagBenchL');
      flagpoleEvents.push({ type: 'flagpoleBenchReaction', phase: 0, player: reactor, players: [reactor, flagLoser],
        text: _pick([
          `${reactor} winces from ${flagLoser}'s bench. "It's okay! It's only phase one! You've GOT this!" The confidence is… thin.`,
          `${reactor} buries ${pronouns(reactor).posAdj} face in ${pronouns(reactor).posAdj} hands. "Come on, come on, come on…"`,
          `${reactor} forces a smile and claps. The clapping gets faster. More desperate. "You're FINE! YOU'RE FINE!"`,
        ], reactor + 'flagBenchR'),
        badgeText: 'BENCH', badgeClass: 'grey' });
    }
  }

  // Chris commentary — phase end
  flagpoleEvents.push({ type: 'chrisCommentary', phase: 0, player: 'Chris', players: [flagWinner, flagLoser],
    text: _pick([
      `Chris grins: "Phase one to ${flagWinner}! That was BRUTAL. And we're just getting started."`,
      `"${flagWinner} takes phase one!" Chris turns to the camera. "If you thought THAT was messy, wait until the balance beam. It's above sharks. Real sharks. I checked."`,
      `Chris makes a note on his clipboard. "Flagpole: done. ${flagLoser}, you're gonna need to pick it up. Like, a LOT."`,
    ], 'chrisFlagEnd'),
    badgeText: 'HOST', badgeClass: 'yellow' });
  timeline.push(...flagpoleEvents);

  stageResults.push({
    name: 'The Flagpole',
    desc: 'Climb the greased flagpole, grab the flag, slide down. First one back wins the lead.',
    scores: { ...flagpoleScores },
    winner: flagWinner,
    phase: 0,
  });

  // ════════ PHASE 2: BALANCE BEAM ════════
  const beamScores = {};
  const beamEvents = [];
  const showmancePair = (gs.showmances || []).find(sh => {
    const [smA, smB] = sh.players || [];
    return finalists.includes(smA) && finalists.includes(smB);
  });

  // Chris commentary — phase start
  beamEvents.push({ type: 'chrisCommentary', phase: 1, player: 'Chris', players: finalists.slice(),
    text: _pick([
      `Chris gestures to the gorge: "Phase TWO! The Balance Beam of DOOM! Cross the gorge, don't drop the egg, don't feed the sharks. Simple! …For me. I'm not doing it."`,
      `"Alright, finalists — see those beams?" Chris points. "Hundred-foot drop. Shark-infested water. Oh, and you're each carrying a bald eagle egg. Mama eagle is NOT happy about it. Have fun!"`,
      `Chris peers over the edge. "Yep, the sharks are still down there. Phase two: the gorge crossing. Try not to die — the paperwork is TERRIBLE."`,
    ], 'chrisBeam'),
    badgeText: 'HOST', badgeClass: 'yellow' });

  finalists.forEach(f => {
    const s = pStats(f);
    const pr = pronouns(f);
    const fArch = players.find(pl => pl.name === f)?.archetype || 'floater';
    let base = s.endurance * 0.25 + s.mental * 0.2 + s.temperament * 0.15 + (Math.random() * 3 - 1.5);

    // Beam narration — per-finalist crossing opening beat
    const balanceRating = s.endurance * 0.3 + s.mental * 0.3 + s.temperament * 0.4;
    if (balanceRating >= 7) {
      beamEvents.push({ type: 'beamNarration', phase: 1, player: f, players: [f],
        text: _pick([
          `${f} steps onto the beam with unsettling calm. One foot. Then the other. Arms steady. ${pr.Sub} moves like ${pr.sub}'s done this a thousand times.`,
          `${f} takes a breath, locks ${pr.posAdj} eyes on the far side, and walks. Not fast. Not slow. Just relentless. The bench watches in silence.`,
          `${f} crosses like it's a sidewalk. No wobble. No hesitation. Just pure focus. Chris mutters: "Well that's boring. Where's the drama?"`,
        ], f + 'beamNar'),
        badgeText: 'STEADY', badgeClass: 'green' });
    } else if (balanceRating >= 4) {
      beamEvents.push({ type: 'beamNarration', phase: 1, player: f, players: [f],
        text: _pick([
          `${f} inches onto the beam. Arms out wide. Eyes fixed ahead. Every step is a negotiation with gravity.`,
          `${f} starts crossing — steady enough, but the wind picks up and ${pr.sub} freezes. Deep breath. Another step. Another. Progress.`,
          `"Don't look down. Don't look down." ${f} is DEFINITELY looking down. ${pr.Sub} corrects, refocuses, and shuffles forward.`,
        ], f + 'beamNar'),
        badgeText: 'CROSSING', badgeClass: 'yellow' });
    } else {
      beamEvents.push({ type: 'beamNarration', phase: 1, player: f, players: [f],
        text: _pick([
          `${f} puts one foot on the beam and immediately sits down. ${pr.Sub}'s going to scoot. ${pr.Sub}'s scooting across the entire gorge. This is happening.`,
          `${f} grabs the beam with both hands and crawls. Dignity left the chat three seconds ago. But at least ${pr.sub}'s moving.`,
          `${f}'s legs are shaking before ${pr.sub} even starts. "I can't do this." Beat. "I'm doing it. I HATE it. But I'm doing it."`,
        ], f + 'beamNar'),
        badgeText: 'PANICKING', badgeClass: 'red' });
    }

    // Eagle nest — dramatic multi-beat eagle encounter
    const eagleRoll = s.physical * 0.15 + s.boldness * 0.1;
    if (Math.random() < 0.6) {
      // The egg has a parent
      beamEvents.push({ type: 'eagleNest', phase: 1, player: f, players: [f],
        text: _pick([
          `A shadow passes overhead. ${f} looks up — a MASSIVE bald eagle is circling. It saw the egg. It knows. "Oh no. Oh no no no no no—"`,
          `The mama eagle appears on a thermal, eyes locked on the egg in ${f}'s hands. ${f} clutches it tighter. The eagle screams. ${f} screams back.`,
          `${f} hears it before ${pr.sub} sees it — the shriek of a very angry, very large bird. The eagle dive-bombs from nowhere.`,
        ], f + 'eagleNest'),
        badgeText: 'EAGLE', badgeClass: 'red' });

      if (eagleRoll > 0.9) {
        beamEvents.push({ type: 'eagleAttack', phase: 1, player: f, players: [f], result: 'fend',
          text: _pick([
            `${f} ducks, swings ${pr.posAdj} hat at the eagle — the bird veers off with an indignant screech. ${f} straightens up on the beam, heart pounding. Still standing.`,
            `${f} holds the egg up like a shield. The eagle pulls up at the last second, talons inches from ${pr.posAdj} face. "THAT'S RIGHT! BACK OFF!" The bench cheers.`,
            `The eagle swoops — ${f} rolls ${pr.posAdj} shoulder and the talons rake nothing but air. Incredible reflexes. The eagle circles for another pass but thinks better of it.`,
          ], f + 'eagleFend'),
          badgeText: 'FENDED OFF', badgeClass: 'green' });
      } else {
        const penalty = -1.0;
        base += penalty;
        beamEvents.push({ type: 'eagleAttack', phase: 1, player: f, players: [f], result: 'hit',
          text: _pick([
            `The eagle clips ${f} across the shoulder! ${f} staggers sideways, arms windmilling over the gorge. The egg nearly slips. Barely — BARELY — holds on.`,
            `WHAM — talons rake across ${f}'s back. ${f} yelps, drops to one knee on the beam, the egg rolling in ${pr.posAdj} grip. The sharks below sense opportunity.`,
            `The eagle gets a piece of ${f}'s hat. ${f} jerks sideways — too far — and has to throw ${pr.posAdj} whole body back onto the beam. Lost seconds. Lost dignity.`,
          ], f + 'eagleHit'),
          badgeText: 'HIT', badgeClass: 'red' });
      }
    }

    // Justin distraction (high-social supporter strips)
    const distractorBench = benchAssignments[finalists.find(o => o !== f)] || [];
    const distractor = distractorBench.find(s2 => pStats(s2).social >= 8);
    if (distractor && Math.random() < 0.4) {
      const dS = pStats(distractor);
      const penalty = -(s.mental * 0.08 - dS.social * 0.06);
      if (penalty < -0.2) {
        base += penalty;
        beamEvents.push({ type: 'justinDistraction', phase: 1, player: f, distractor, players: [f, distractor], text: `${distractor} flexes from the sideline. ${f} glances over — and wobbles. "Eyes FORWARD!" Chef barks from below.`, badgeText: 'DISTRACTED', badgeClass: 'pink' });
      }
    }

    // Wobble mechanic
    let wobbles = 0;
    if (base < 4.0) {
      wobbles++;
      beamEvents.push({ type: 'beamWobble', phase: 1, player: f, players: [f], text: `${f} wobbles dangerously on the beam. Arms out. Deep breath. Steady…`, badgeText: 'WOBBLE', badgeClass: 'yellow' });

      // Shark reaction to wobble
      beamEvents.push({ type: 'sharkReaction', phase: 1, player: f, players: [f],
        text: _pick([
          `Below, a dorsal fin cuts the water. Then another. The sharks can smell the fear. Or maybe the eagle egg. Either way, they're circling.`,
          `${f} glances down — mistake. Three fins. Circling. Waiting. ${f} snaps ${pronouns(f).posAdj} eyes back up. "Nope. NOPE."`,
          `A shark breaches the surface with a lazy roll, like it's stretching before a meal. ${f}'s knuckles go white on the beam.`,
        ], f + 'sharkW'),
        badgeText: 'SHARKS', badgeClass: 'grey' });
    }
    if (base < 2.5) {
      wobbles++;
      base -= 2.0;
      beamEvents.push({ type: 'beamFall', phase: 1, player: f, players: [f], text: `${f} FALLS! Splash! The sharks circle — ${f} scrambles back up soaking wet. Massive time penalty.`, badgeText: 'FALL', badgeClass: 'red' });

      // Shark reaction to fall
      beamEvents.push({ type: 'sharkReaction', phase: 1, player: f, players: [f],
        text: _pick([
          `The sharks CONVERGE. ${f} has never swum so fast in ${pronouns(f).posAdj} life. Hands slapping water, legs kicking — ${pronouns(f).sub} grabs the beam ladder and pulls ${pronouns(f).ref} up, dripping and gasping.`,
          `A shark bumps ${f}'s leg. ${f} SCREAMS. The bench SCREAMS. Chef does NOT scream but does reach for the emergency flare. ${f} somehow launches ${pronouns(f).ref} back onto the beam through pure adrenaline.`,
          `${f} hits the water and immediately regrets every life decision. The sharks circle. ${f} grabs a support rope, hauls ${pronouns(f).ref} up, and collapses on the beam. "I HATE THIS SHOW."`,
        ], f + 'sharkF'),
        badgeText: 'SHARK ATTACK', badgeClass: 'red' });
    }

    // Cupcake flashback confessional (reveal planted, effect later)
    if (plantedSabotage && plantedSabotage.targetFinalist === f) {
      beamEvents.push({ type: 'cupcakeFlashback', phase: 1, player: f, planter: plantedSabotage.planter, players: [f, plantedSabotage.planter], text: `*Flashback:* Earlier, ${plantedSabotage.planter} offered ${f} a "congratulations cupcake." ${f} didn't think twice about eating it. That was a mistake.`, badgeText: 'FLASHBACK', badgeClass: 'grey' });
    }

    if (showmancePair) {
      const [smA, smB] = showmancePair.players || [];
      const partner = smA === f ? smB : smB === f ? smA : null;
      if (partner && finalists.includes(partner)) {
        const comedyBeat = Math.random() < 0.5;
        if (comedyBeat) {
          beamEvents.push({ type: 'showmanceEncouragement', phase: 1, player: f, partner, players: [f, partner], text: `"I love you!" ${partner} shouts from across the gorge. "${f === finalists[0] ? 'NOT NOW!' : 'Can we TALK about this LATER?!'}" ${f} shrieks back.`, badgeText: 'SHOWMANCE', badgeClass: 'pink' });
        } else {
          base += 0.3;
          beamEvents.push({ type: 'showmanceEncouragement', phase: 1, player: f, partner, players: [f, partner], text: `${partner} locks eyes with ${f} across the beam. A nod. ${f} steadies. Love is a performance enhancer, apparently.`, badgeText: 'SHOWMANCE', badgeClass: 'pink' });
        }
      }
    }

    // Assistant contribution — Phase 2 (verbal guidance from the other side)
    const asstBeam = assistants?.[f];
    if (asstBeam?.name) {
      const abS = asstBeam.stats || pStats(asstBeam.name);
      const asstBoost = abS.mental * 0.05 + abS.social * 0.03;
      const sabChance = asstBeam.bond < 0 ? Math.min(0.45, Math.abs(asstBeam.bond) * 0.05) : 0;
      if (sabChance > 0 && Math.random() < sabChance) {
        base -= asstBoost * 1.2;
        sabotageEvents.push({ phase: 1, type: 'assistant-sabotage', target: f, planter: asstBeam.name });
        beamEvents.push({ type: 'assistantSabotage', phase: 1, player: asstBeam.name, players: [asstBeam.name, f],
          text: _pick([
            `${asstBeam.name} shouts directions from the other side. Wrong directions. ${f} wobbles.`,
            `"JUMP LEFT!" ${asstBeam.name} yells. There is no left. ${f} nearly goes over the edge.`,
          ], asstBeam.name + 'asstSab2'),
          badgeText: 'ASSISTANT SABOTAGE', badgeClass: 'red' });
      } else {
        base += asstBoost;
        beamEvents.push({ type: 'assistantHelp', phase: 1, player: asstBeam.name, players: [asstBeam.name, f],
          text: _pick([
            `${asstBeam.name} calls from the far side: "Don't look down. Eyes on me. One step at a time." ${f} steadies.`,
            `${asstBeam.name} talks ${f} through every step. Calm. Measured. The beam feels narrower but ${f}'s feet feel surer.`,
            `"You're halfway! The hard part is behind you!" ${asstBeam.name} lies. ${f} believes it. That's enough.`,
          ], asstBeam.name + 'asstHelp2'),
          badgeText: 'ASSISTANT', badgeClass: 'blue' });
      }
    }

    beamScores[f] = Math.max(0, base);
    scores[f] += beamScores[f];
  });

  // Beam rivalry — finalists on parallel beams, eye contact / psych-out
  if (finalists.length >= 2) {
    const [fA, fB] = finalists;
    const bondAB = getBond(fA, fB);
    const archA = players.find(pl => pl.name === fA)?.archetype || 'floater';
    const archB = players.find(pl => pl.name === fB)?.archetype || 'floater';
    if (bondAB <= -2) {
      const aggressor = ['villain','mastermind','schemer'].includes(archA) ? fA : ['villain','mastermind','schemer'].includes(archB) ? fB : (Math.random() < 0.5 ? fA : fB);
      const target = aggressor === fA ? fB : fA;
      beamEvents.push({ type: 'beamRivalry', phase: 1, player: aggressor, players: [aggressor, target],
        text: _pick([
          `${aggressor} and ${target} are on parallel beams. ${aggressor} makes eye contact. Holds it. Then mouths: "You're DONE." ${target} nearly loses ${pronouns(target).posAdj} footing.`,
          `${aggressor} spits into the gorge in ${target}'s direction. "That's what I think of your chances." ${target} grits ${pronouns(target).posAdj} teeth and walks FASTER.`,
          `${aggressor} starts whistling casually on the beam — staring right at ${target}. The message is clear: this is EASY for me. You should be scared.`,
        ], aggressor + 'beamRiv'),
        badgeText: 'RIVALRY', badgeClass: 'red' });
    } else if (bondAB >= 3) {
      beamEvents.push({ type: 'beamRivalry', phase: 1, player: fA, players: [fA, fB],
        text: _pick([
          `${fA} and ${fB} catch each other's eye mid-crossing. A nod of respect. They're friends. But only one wins. The nod says everything: no hard feelings.`,
          `"Race you!" ${fA} calls across the gap. ${fB} laughs despite ${pronouns(fB).ref}. For one second, it's not a finale — it's just two friends on a dumb obstacle course.`,
        ], fA + 'beamRiv'),
        badgeText: 'RESPECT', badgeClass: 'blue' });
    }
  }

  const beamSorted = Object.entries(beamScores).sort(([,a],[,b]) => b - a);
  const beamWinner = beamSorted[0][0];
  const beamLoser = beamSorted.length > 1 ? beamSorted[beamSorted.length - 1][0] : beamWinner;

  // Momentum shift — if the beam result flips the overall leader
  const preBeamLeader = flagWinner;
  const postBeamSorted = Object.entries(scores).sort(([,a],[,b]) => b - a);
  const postBeamLeader = postBeamSorted[0][0];
  if (preBeamLeader !== postBeamLeader) {
    beamEvents.push({ type: 'beamMomentumShift', phase: 1, player: postBeamLeader, players: [postBeamLeader, preBeamLeader],
      text: _pick([
        `Wait — ${postBeamLeader} has pulled AHEAD! ${preBeamLeader} led after the flagpole, but the gorge crossing changed everything. This race is WIDE open.`,
        `The scoreboard flips! ${postBeamLeader} takes the overall lead! ${preBeamLeader}'s flagpole advantage — gone. The bench is on its feet.`,
        `"MOMENTUM SHIFT!" Chris screams into his megaphone. ${postBeamLeader} came from behind and NOW leads the relay! ${preBeamLeader} looks shaken.`,
      ], 'beamMomentum'),
      badgeText: 'LEAD CHANGE', badgeClass: 'gold' });
  }

  beamEvents.push({ type: 'beamCross', phase: 1, player: beamWinner, players: [beamWinner], text: `${beamWinner} reaches the other side first! The gap is ${Math.abs(beamScores[finalists[0]] - beamScores[finalists[1] || finalists[0]]).toFixed(1)} points.`, badgeText: 'PHASE 2 WIN', badgeClass: 'gold' });

  // Bench reaction to beam
  {
    const winBench = benchAssignments[beamWinner] || [];
    const loseBench = benchAssignments[beamLoser] || [];
    if (winBench.length > 0) {
      const reactor = _pick(winBench, 'beamBenchW');
      beamEvents.push({ type: 'beamBenchReaction', phase: 1, player: reactor, players: [reactor, beamWinner],
        text: _pick([
          `${reactor} is SCREAMING from the bench. Incomprehensible. Just pure emotion and volume.`,
          `${reactor} grabs two other supporters and shakes them. "WE'RE WINNING! WE'RE ACTUALLY WINNING!" (They might not be. But the energy is there.)`,
          `${reactor} has tears in ${pronouns(reactor).posAdj} eyes. Actual tears. Over a balance beam. This game does things to people.`,
        ], reactor + 'beamBenchR'),
        badgeText: 'BENCH', badgeClass: 'blue' });
    }
    if (loseBench.length > 0) {
      const reactor = _pick(loseBench, 'beamBenchL');
      beamEvents.push({ type: 'beamBenchReaction', phase: 1, player: reactor, players: [reactor, beamLoser],
        text: _pick([
          `${reactor} looks like ${pronouns(reactor).sub}'s watching a horror movie. Hands over ${pronouns(reactor).posAdj} mouth. Peeking through fingers.`,
          `"It's not over." ${reactor} says it to the bench. Then louder: "IT'S NOT OVER!" The bench nods. They need to believe it.`,
          `${reactor} starts pacing behind the bench. Can't sit. Can't watch. Can't NOT watch.`,
        ], reactor + 'beamBenchR'),
        badgeText: 'BENCH', badgeClass: 'grey' });
    }
  }

  // Chris commentary — phase end
  beamEvents.push({ type: 'chrisCommentary', phase: 1, player: 'Chris', players: [beamWinner, beamLoser],
    text: _pick([
      `Chris: "Phase two is DONE! ${beamWinner} crosses first. Into the final sprint — this is where it gets REAL."`,
      `"The gorge has been conquered!" Chris raises his coffee. "One phase left. One sprint. A hundred thousand dollars. I am LIVING for this."`,
      `Chris leans to Chef: "That was good TV, right?" Chef: "That was animal cruelty." Chris: "…Good TV."`,
    ], 'chrisBeamEnd'),
    badgeText: 'HOST', badgeClass: 'yellow' });
  timeline.push(...beamEvents);

  stageResults.push({
    name: 'The Gorge',
    desc: 'Cross the balance beam over shark-infested waters. Eagles overhead. Don\'t look down.',
    scores: { ...beamScores },
    winner: beamWinner,
    phase: 1,
  });

  // ════════ PHASE 3: SPRINT ════════
  const sprintScores = {};
  const sprintEvents = [];

  // Determine losing pair for desperation/false finish
  const midScores = { ...scores };
  const midSorted = Object.entries(midScores).sort(([,a],[,b]) => b - a);
  const leader = midSorted[0][0];
  const trailer = midSorted.length > 1 ? midSorted[midSorted.length - 1][0] : midSorted[0][0];

  // Chris commentary — phase start
  sprintEvents.push({ type: 'chrisCommentary', phase: 2, player: 'Chris', players: finalists.slice(),
    text: _pick([
      `Chris is RUNNING alongside the course now: "FINAL PHASE! The sprint! Everything you've done — the flagpole, the gorge, the sharks — it all comes down to THIS! RUN!"`,
      `"Phase THREE!" Chris's voice cracks with excitement. "The finish line is RIGHT THERE! A hundred thousand dollars! WHO WANTS IT?!"`,
      `Chris drops all pretense of professionalism: "SPRINT! SPRINT SPRINT SPRINT! This is the best finale we've EVER had and it's not even CLOSE!"`,
    ], 'chrisSprint'),
    badgeText: 'HOST', badgeClass: 'yellow' });

  // False finish (trailer without a map mistakes a landmark)
  if (finalists.length >= 2 && Math.random() < 0.65) {
    sprintEvents.push({ type: 'falseFinish', phase: 2, player: trailer, players: [trailer, leader], text: `${trailer} sees a clearing ahead — "THERE! I SEE IT!" — and sprints. It's… a porta-potty. Not the finish line. ${trailer}'s face falls. ${leader} passes ${pronouns(trailer).obj} during the confusion.`, badgeText: 'FALSE FINISH', badgeClass: 'red' });
  }

  finalists.forEach(f => {
    const s = pStats(f);
    const pr = pronouns(f);
    const fP = players.find(pl => pl.name === f);
    const fArch = fP?.archetype || 'floater';
    let base = s.physical * 0.2 + s.endurance * 0.25 + s.boldness * 0.1 + (Math.random() * 3 - 1.5);

    // Carryover
    base += scores[f] * 0.1;

    // Sprint narration — opening beat per finalist
    const sprintRating = s.physical * 0.4 + s.endurance * 0.3 + s.boldness * 0.3;
    if (sprintRating >= 7) {
      sprintEvents.push({ type: 'sprintNarration', phase: 2, player: f, players: [f],
        text: _pick([
          `${f} EXPLODES off the line. Legs pumping, arms driving, hat flying off — pure, unbridled speed.`,
          `${f} runs like something is chasing ${pr.obj}. (Technically the other finalist is, but still.) Every stride eats ground.`,
          `${f} hits the trail at a dead sprint. This is what ${pr.sub} trained for. Every morning run, every pushup — this is the moment.`,
        ], f + 'sprintNar'),
        badgeText: 'SPRINTING', badgeClass: 'green' });
    } else if (sprintRating >= 4) {
      sprintEvents.push({ type: 'sprintNarration', phase: 2, player: f, players: [f],
        text: _pick([
          `${f} takes off at a solid pace — not the fastest, but ${pr.sub}'s got endurance. This is a marathon, not a sprint. Well, it IS a sprint. But ${pr.sub}'s treating it like a marathon.`,
          `${f} runs. Not pretty, not fast, but determined. One foot in front of the other. The finish line is somewhere ahead. Probably.`,
          `${f} pushes off — stumbles — recovers — and finds a rhythm. Not graceful. But functional.`,
        ], f + 'sprintNar'),
        badgeText: 'RUNNING', badgeClass: 'yellow' });
    } else {
      sprintEvents.push({ type: 'sprintNarration', phase: 2, player: f, players: [f],
        text: _pick([
          `${f} tries to sprint but ${pr.posAdj} legs have filed a formal complaint after the beam phase. The "sprint" is more of an aggressive walk.`,
          `${f} is running on pure willpower. The body said no three obstacles ago. The brain overruled it. For now.`,
          `${f} starts strong for exactly four seconds, then the exhaustion from the first two phases catches up. The pace drops. The bench winces.`,
        ], f + 'sprintNar'),
        badgeText: 'STRUGGLING', badgeClass: 'red' });
    }

    // Laxative cupcake fires
    if (plantedSabotage && plantedSabotage.targetFinalist === f) {
      const ateIt = s.temperament * 0.1 + s.endurance * 0.05 < 0.8;
      if (ateIt) {
        // Check misfire: shared food with someone else
        const misfireChance = s.loyalty * 0.08 + s.social * 0.06;
        if (misfireChance > 0.7 && Math.random() < 0.4) {
          sprintEvents.push({ type: 'laxativeMisfire', phase: 2, player: f, players: [f, plantedSabotage.planter], text: `${f} actually shared that cupcake with a camera operator. The wrong person is running for the bathroom. ${plantedSabotage.planter}'s plan backfired spectacularly.`, badgeText: 'MISFIRE', badgeClass: 'yellow' });
        } else {
          base -= 2.0;
          sprintEvents.push({ type: 'laxativeFires', phase: 2, player: f, planter: plantedSabotage.planter, players: [f, plantedSabotage.planter], text: `${f} doubles over mid-sprint. The cupcake. THE CUPCAKE. ${f} stumbles behind a bush. Lost time: catastrophic.`, badgeText: 'SABOTAGE', badgeClass: 'red' });
          sabotageEvents.push({ phase: 2, type: 'cupcake', target: f, planter: plantedSabotage.planter });
        }
      } else {
        sprintEvents.push({ type: 'cupcakeResist', phase: 2, player: f, players: [f, plantedSabotage.planter], text: `${f}'s stomach gurgles ominously... but holds. Iron constitution. ${plantedSabotage.planter} watches in disbelief from the sideline.`, badgeText: 'RESISTED', badgeClass: 'green' });
      }
    }

    // Brownie temptation (universal — everyone faces it, different resist thresholds)
    {
      const resistRoll = s.mental * 0.3 + s.strategic * 0.2 + s.endurance * 0.1;
      if (resistRoll > 5.0) {
        // Strong willpower — runs right past
        sprintEvents.push({ type: 'brownieResist', phase: 2, player: f, players: [f],
          text: _pick([
            `A table of fresh brownies appears on the trail. ${f} doesn't even slow down. "NICE TRY, MCLEAN!" Heroic self-control.`,
            `${f} spots the brownie trap. Sniffs the air. Keeps running. "I'm on a DIET." (${pr.Sub} is not on a diet. That was pure willpower.)`,
            `The brownies are RIGHT THERE. Warm. Gooey. ${f} locks eyes with them, then looks away. "After. AFTER the race." ${pr.Sub} sprints harder to get away from temptation.`,
          ], f + 'brownieR'),
          badgeText: 'WILLPOWER', badgeClass: 'green' });
        base += 0.5;
      } else if (resistRoll > 3.0) {
        // Moderate — hesitates but pushes through
        sprintEvents.push({ type: 'brownieHesitate', phase: 2, player: f, players: [f],
          text: _pick([
            `${f} slows at the brownie table. Reaches out. Hand hovering. "No. NO." Pulls back. Runs. But the hesitation cost precious seconds.`,
            `A brownie table. ${f} stops. Picks one up. Stares at it. Puts it back down. "I hate this game." Starts running again — time lost, dignity intact.`,
            `${f} literally grabs a brownie, takes one sniff, then THROWS it into the woods and keeps running. "THAT WAS THE HARDEST THING I'VE EVER DONE."`,
          ], f + 'brownieH'),
          badgeText: 'TEMPTED', badgeClass: 'yellow' });
        base -= 0.5;
      } else {
        // Low willpower — brownie break
        sprintEvents.push({ type: 'brownieTemptation', phase: 2, player: f, players: [f],
          text: _pick([
            `A table of fresh brownies appears on the trail. ${f} stops. Sits down. Takes a bite. Then another. "${f}! THE RACE!" "Five more minutes…" Chef face-palms.`,
            `${f} sees brownies. The race ceases to exist. ${pr.Sub} sits cross-legged in the dirt, eating with both hands. "${f}, WHAT ARE YOU DOING?!" "Living my BEST LIFE."`,
            `The brownies. ${f} was doing so well. But the brownies. ${pr.Sub} eats three before anyone can stop ${pr.obj}. "WORTH IT." (Narrator: It was not worth it.)`,
          ], f + 'brownieT'),
          badgeText: 'BROWNIE BREAK', badgeClass: 'red' });
        base -= 2.5;
      }
    }

    // Fan backfire
    if (Math.random() < 0.3) {
      const operatorMental = 3 + Math.random() * 4;
      if (operatorMental * 0.05 < 0.3) {
        sprintEvents.push({ type: 'fanBackfire', phase: 2, player: f, players: [f], text: `An intern turns on the industrial fan — backwards. ${f} gets blasted with a 60mph headwind. Papers, leaves, and somebody's wig go flying.`, badgeText: 'FAN FAIL', badgeClass: 'yellow' });
        base -= 0.8;
      }
    }

    // Showmance boulder gesture
    if (showmancePair) {
      const [smA2, smB2] = showmancePair.players || [];
      const partner = smA2 === f ? smB2 : smB2 === f ? smA2 : null;
      if (partner && finalists.includes(partner)) {
        const gestureRoll = s.physical * 0.1 + s.loyalty * 0.08;
        if (gestureRoll > 1.2 && Math.random() < 0.4) {
          base += 0.4;
          sprintEvents.push({ type: 'boulderGesture', phase: 2, player: f, partner, players: [f, partner], text: `${partner} runs alongside ${f} from the sideline, pushing a boulder out of the path. "GO! I've got this!" The bond fuels the sprint.`, badgeText: 'SHOWMANCE', badgeClass: 'pink' });
        }
      }
    }

    // Supporter accompaniment (top 2-3 run alongside)
    const bench = benchAssignments[f] || [];
    const topSupporters = [...bench]
      .sort((a, b) => pStats(b).physical + pStats(b).endurance - pStats(a).physical - pStats(a).endurance)
      .slice(0, Math.min(3, bench.length));
    if (topSupporters.length > 0) {
      const supportStr = topSupporters.reduce((sum, s2) => sum + (pStats(s2).physical + pStats(s2).endurance) * 0.01, 0);
      base += supportStr;
      const names = topSupporters.length === 1 ? topSupporters[0] : topSupporters.slice(0, -1).join(', ') + ' and ' + topSupporters[topSupporters.length - 1];
      sprintEvents.push({ type: 'supporterSprint', phase: 2, player: f, supporters: topSupporters, players: [f, ...topSupporters], text: `${names} sprint${topSupporters.length === 1 ? 's' : ''} alongside ${f}, screaming encouragement. The bench is ALL IN.`, badgeText: 'SUPPORT', badgeClass: 'blue' });
    }

    // Supporter intervention — a supporter does something dramatic to help/hinder
    if (bench.length > 0 && Math.random() < 0.45) {
      const intervener = _pick(bench, f + 'intervene');
      const intS = pStats(intervener);
      const intP = players.find(pl => pl.name === intervener);
      const intArch = intP?.archetype || 'floater';
      const rival = finalists.find(o => o !== f);
      if (rival) {
        const isVillain = ['villain','mastermind','schemer'].includes(intArch);
        const isNice = ['hero','loyal-soldier','social-butterfly','showmancer','underdog','goat'].includes(intArch);
        if (isVillain) {
          // Villain supporter sabotages the rival
          sprintEvents.push({ type: 'supporterIntervention', phase: 2, player: intervener, players: [intervener, rival, f],
            text: _pick([
              `${intervener} "accidentally" steps into ${rival}'s path. ${rival} has to dodge, losing a full stride. "Oops." The smirk says it all.`,
              `${intervener} kicks a branch onto the trail right as ${rival} approaches. ${rival} stumbles. ${intervener} is already looking the other way, whistling.`,
              `${intervener} screams fake directions: "${rival}! WRONG WAY! THE FINISH IS LEFT!" ${rival} hesitates for ONE critical second before realizing it's a trick.`,
            ], intervener + 'sabInt'),
            badgeText: 'DIRTY PLAY', badgeClass: 'red' });
          if (!gs.popularity) gs.popularity = {};
          gs.popularity[intervener] = (gs.popularity[intervener] || 0) - 2;
        } else if (isNice) {
          // Nice supporter gives an encouraging boost
          base += intS.social * 0.02;
          sprintEvents.push({ type: 'supporterIntervention', phase: 2, player: intervener, players: [intervener, f],
            text: _pick([
              `${intervener} sprints to the edge of the trail: "YOU'RE SO CLOSE! DON'T STOP! I BELIEVE IN YOU!" ${f} finds a gear ${pr.sub} didn't know ${pr.sub} had.`,
              `${intervener} holds up a sign — wait, where did ${pronouns(intervener).sub} GET a sign? It reads: "RUN LIKE CHEF IS COOKING DINNER." ${f} runs VERY fast.`,
              `${intervener} runs alongside for a few strides, matching pace: "Remember why you're here. Remember what you told me on Day 3. FINISH THIS." ${f} nods and PUSHES.`,
            ], intervener + 'niceInt'),
            badgeText: 'INSPIRATION', badgeClass: 'green' });
          if (!gs.popularity) gs.popularity = {};
          gs.popularity[intervener] = (gs.popularity[intervener] || 0) + 1;
        }
      }
    }

    // Assistant contribution — Phase 3 (pacing alongside)
    const asstSprint = assistants?.[f];
    if (asstSprint?.name) {
      const aspS = asstSprint.stats || pStats(asstSprint.name);
      const asstBoost = aspS.physical * 0.04 + aspS.endurance * 0.04;
      const sabChance = asstSprint.bond < 0 ? Math.min(0.45, Math.abs(asstSprint.bond) * 0.05) : 0;
      if (sabChance > 0 && Math.random() < sabChance) {
        base -= asstBoost * 1.5;
        sabotageEvents.push({ phase: 2, type: 'assistant-sabotage', target: f, planter: asstSprint.name });
        sprintEvents.push({ type: 'assistantSabotage', phase: 2, player: asstSprint.name, players: [asstSprint.name, f],
          text: _pick([
            `${asstSprint.name} "trips" right in front of ${f}. ${f} goes down hard. "Oh no! Are you okay?" The smile says everything.`,
            `${asstSprint.name} points ${f} toward what looks like a shortcut. It's a dead end. By the time ${f} backtracks, the gap is wider.`,
          ], asstSprint.name + 'asstSab3'),
          badgeText: 'ASSISTANT SABOTAGE', badgeClass: 'red' });
      } else {
        base += asstBoost;
        sprintEvents.push({ type: 'assistantHelp', phase: 2, player: asstSprint.name, players: [asstSprint.name, f],
          text: _pick([
            `${asstSprint.name} runs stride for stride with ${f}. "Match my pace! We've got this!" The finish line is getting closer.`,
            `${asstSprint.name} pulls ahead slightly, creating a slipstream. ${f} tucks in behind. Every second counts.`,
            `"Don't slow down! I can see the line!" ${asstSprint.name} sprints alongside ${f}, both of them giving everything left.`,
          ], asstSprint.name + 'asstHelp3'),
          badgeText: 'ASSISTANT', badgeClass: 'blue' });
      }
    }

    sprintScores[f] = Math.max(0, base);
    scores[f] += sprintScores[f];
  });

  // Sprint rivalry — neck and neck moment
  if (finalists.length >= 2) {
    const [fA, fB] = finalists;
    const gapAfterSprint = Math.abs(scores[fA] - scores[fB]);
    if (gapAfterSprint < 2.0) {
      sprintEvents.push({ type: 'sprintRivalry', phase: 2, player: fA, players: [fA, fB],
        text: _pick([
          `They're SHOULDER TO SHOULDER! ${fA} and ${fB}, stride for stride, neither giving an inch. The bench is LOSING ITS MIND.`,
          `${fA} pulls even with ${fB}. Eyes locked. Teeth gritted. Neither looks away. This is it — the race within the race.`,
          `For thirty agonizing seconds, ${fA} and ${fB} run in perfect lockstep. The only sound is their breathing and the bench screaming.`,
        ], 'sprintRivalry'),
        badgeText: 'NECK AND NECK', badgeClass: 'gold' });
    }

    // Desperation — the trailer does something desperate
    const finalTrailer = scores[fA] < scores[fB] ? fA : fB;
    const finalLeader = finalTrailer === fA ? fB : fA;
    const trArch = players.find(pl => pl.name === finalTrailer)?.archetype || 'floater';
    const trPr = pronouns(finalTrailer);
    if (scores[finalLeader] - scores[finalTrailer] > 0.5) {
      if (['villain','mastermind','schemer'].includes(trArch)) {
        sprintEvents.push({ type: 'sprintDesperation', phase: 2, player: finalTrailer, players: [finalTrailer, finalLeader],
          text: _pick([
            `${finalTrailer} is losing. And ${trPr.sub} KNOWS it. ${trPr.Sub} grabs a branch off the ground and HURLS it at ${finalLeader}'s feet. "IF I'M GOING DOWN, I'M TAKING YOU WITH ME!"`,
            `Desperation. ${finalTrailer} cuts across the trail, trying to body-check ${finalLeader}. It's blatant. It's ugly. The bench boos. ${finalTrailer} doesn't care.`,
            `${finalTrailer}'s eyes go wild. ${trPr.Sub} scoops a handful of dirt and throws it backwards. "EAT DUST!" It doesn't help ${trPr.posAdj} time at all, but it feels good.`,
          ], finalTrailer + 'desp'),
          badgeText: 'DESPERATE', badgeClass: 'red' });
        if (!gs.popularity) gs.popularity = {};
        gs.popularity[finalTrailer] = (gs.popularity[finalTrailer] || 0) - 2;
      } else if (['hero','underdog','loyal-soldier'].includes(trArch)) {
        sprintEvents.push({ type: 'sprintDesperation', phase: 2, player: finalTrailer, players: [finalTrailer],
          text: _pick([
            `${finalTrailer} is behind. And something shifts in ${trPr.posAdj} eyes. Not anger — something quieter. Something fiercer. ${trPr.Sub} puts ${trPr.posAdj} head down and RUNS. Harder than ${trPr.sub}'s run all day.`,
            `"I didn't come this far to lose." ${finalTrailer} says it out loud. To no one. To everyone. And ${trPr.sub} finds one more gear.`,
            `The bench is screaming ${finalTrailer}'s name. ${trPr.Sub} hears every voice. And ${trPr.sub} runs like the answer to every person who ever counted ${trPr.obj} out.`,
          ], finalTrailer + 'desp'),
          badgeText: 'DIG DEEP', badgeClass: 'green' });
        if (!gs.popularity) gs.popularity = {};
        gs.popularity[finalTrailer] = (gs.popularity[finalTrailer] || 0) + 2;
      } else if (['wildcard','chaos-agent'].includes(trArch)) {
        sprintEvents.push({ type: 'sprintDesperation', phase: 2, player: finalTrailer, players: [finalTrailer, finalLeader],
          text: _pick([
            `${finalTrailer} does something UNHINGED — ${trPr.sub} veers off the trail entirely, crashing through underbrush on a "shortcut." Is it shorter? NOBODY knows. Not even ${finalTrailer}.`,
            `${finalTrailer} screams something incomprehensible and starts ZIGZAGGING. It's chaos. It's insanity. But somehow — SOMEHOW — ${trPr.sub}'s closing ground?`,
          ], finalTrailer + 'desp'),
          badgeText: 'CHAOS', badgeClass: 'yellow' });
      } else {
        sprintEvents.push({ type: 'sprintDesperation', phase: 2, player: finalTrailer, players: [finalTrailer],
          text: _pick([
            `${finalTrailer} is falling behind. ${trPr.Sub} grits ${trPr.posAdj} teeth and pushes everything left into one final burst.`,
            `"Not like this." ${finalTrailer} refuses to accept it. The legs are screaming. The lungs are burning. But ${trPr.sub} keeps going.`,
          ], finalTrailer + 'desp'),
          badgeText: 'PUSH', badgeClass: 'yellow' });
      }
    }
  }

  // Sprint bench reaction — crowd goes wild as finish approaches
  if (finalists.length >= 2) {
    const allBench = [...new Set([...(benchAssignments[finalists[0]] || []), ...(benchAssignments[finalists[1]] || [])])];
    if (allBench.length >= 2) {
      const reactor1 = _pick(allBench, 'sprintBench1');
      const reactor2 = allBench.find(b => b !== reactor1) || reactor1;
      sprintEvents.push({ type: 'sprintBenchReaction', phase: 2, player: reactor1, players: [reactor1, reactor2],
        text: _pick([
          `The benches are in CHAOS. ${reactor1} is standing on ${pronouns(reactor1).posAdj} seat screaming. ${reactor2} is grabbing strangers. Camera operators are ducking flying hats.`,
          `${reactor1} and ${reactor2} are both on their feet — on OPPOSITE benches — screaming at each other across the gap. This isn't about strategy anymore. This is war.`,
          `${reactor1} has completely lost ${pronouns(reactor1).posAdj} voice but is still screaming. It's just air. ${reactor2} is crying. The interns are crying. EVERYONE is crying.`,
        ], 'sprintBench'),
        badgeText: 'PANDEMONIUM', badgeClass: 'blue' });
    }
  }

  // Chris building suspense
  sprintEvents.push({ type: 'chrisCommentary', phase: 2, player: 'Chris', players: finalists.slice(),
    text: _pick([
      `Chris is sprinting alongside the course, megaphone bouncing: "THEY'RE APPROACHING THE FINISH! I CAN'T TELL WHO'S AHEAD! THIS IS INCREDIBLE!"`,
      `"COME ON COME ON COME ON!" Chris is no longer hosting. Chris is WATCHING. Even he's been pulled in.`,
      `Chris grabs a cameraman: "TELL ME YOU'RE GETTING THIS! ZOOM IN! THIS IS TELEVISION GOLD!"`,
    ], 'chrisFinish'),
    badgeText: 'HOST', badgeClass: 'yellow' });

  // Photo finish
  const sprintSorted = Object.entries(sprintScores).sort(([,a],[,b]) => b - a);
  const finalGap = Math.abs(scores[finalists[0]] - scores[finalists[1] || finalists[0]]);
  if (finalGap < 0.5 && finalists.length >= 2) {
    sprintEvents.push({ type: 'photoFinish', phase: 2, players: finalists.slice(), text: `It's a photo finish! Both finalists lunge for the line — Chef squints at the instant replay. "That was close. REAL close."`, badgeText: 'PHOTO FINISH', badgeClass: 'gold' });
  }

  const totalSorted = Object.entries(scores).sort(([,a],[,b]) => b - a);
  const winner = totalSorted[0][0];
  const loser = totalSorted.length > 1 ? totalSorted[totalSorted.length - 1][0] : winner;
  const winPr = pronouns(winner);
  const winArch = players.find(pl => pl.name === winner)?.archetype || 'floater';
  const losePr = pronouns(loser);
  const loseArch = players.find(pl => pl.name === loser)?.archetype || 'floater';

  // Finish line lunge — phase 3 (post-race, shown on Finish screen only)
  sprintEvents.push({ type: 'finishLineLunge', phase: 3, player: winner, players: finalists.slice(),
    text: _pick([
      `${winner} DIVES for the line — hands outstretched, body horizontal, crashing into the dirt. ${winPr.Sub} slides across the finish in a cloud of dust. It's over.`,
      `${winner} lunges, stumbles, catches ${winPr.ref}, and crosses the line at a full sprint. Legs give out immediately after — ${winPr.sub} collapses into the dirt, gasping.`,
      `${winner} throws ${winPr.ref} across the finish line like ${winPr.posAdj} life depends on it. Because a hundred thousand dollars of it does.`,
    ], winner + 'lunge'),
    badgeText: 'FINISH', badgeClass: 'gold' });

  // Winner reaction — archetype-driven
  {
    let winText;
    if (['villain','mastermind','schemer'].includes(winArch)) {
      winText = _pick([
        `${winner} stands up, dusts ${winPr.ref} off, and turns to the bench with a grin that could curdle milk. "I TOLD you. I told ALL of you." Not humble. Never humble.`,
        `${winner} raises both arms. Not joy — triumph. The villain won. And ${winPr.sub} wants every single person to LOOK at ${winPr.obj}.`,
        `${winner} laughs. Just laughs. Standing at the finish line, dirt-covered, victorious, laughing at every person who ever underestimated ${winPr.obj}.`,
      ], winner + 'winReact');
    } else if (['hero','loyal-soldier'].includes(winArch)) {
      winText = _pick([
        `${winner} drops to ${winPr.posAdj} knees. Tears. Actual tears. ${winPr.Sub} points to ${winPr.posAdj} bench: "THAT'S for you. ALL of you."`,
        `${winner} crosses the line and immediately turns to find ${winPr.posAdj} supporters. The hug is instant. And long. And loud.`,
        `${winner} wins and ${winPr.posAdj} first reaction is to look for the people who believed in ${winPr.obj}. That tells you everything about how ${winPr.sub} played this game.`,
      ], winner + 'winReact');
    } else if (['underdog','goat'].includes(winArch)) {
      winText = _pick([
        `${winner} stares at the finish line like ${winPr.sub} can't believe ${winPr.sub}'s actually on the right side of it. "I won? I WON?!" The disbelief is heartbreaking and beautiful.`,
        `${winner} collapses. Not from exhaustion — from shock. The underdog won. The person nobody picked. The person ${winPr.sub} didn't even pick. WON.`,
      ], winner + 'winReact');
    } else if (['challenge-beast'].includes(winArch)) {
      winText = _pick([
        `${winner} crosses the line and ROARS. Not a word — a sound. Pure animal triumph. The challenge beast just won the biggest challenge of ${winPr.posAdj} life.`,
        `${winner} pumps ${winPr.posAdj} fist so hard ${winPr.sub} almost dislocates ${winPr.posAdj} shoulder. "THAT'S how you FINISH!"`,
      ], winner + 'winReact');
    } else {
      winText = _pick([
        `${winner} crosses the line and stops. Blinks. Looks around. "Did I… did I just win?" The reality hasn't hit yet. It will.`,
        `${winner} finishes and just… stands there. Breathing. Then the smile comes. Slowly, then all at once.`,
      ], winner + 'winReact');
    }
    sprintEvents.push({ type: 'winnerReaction', phase: 3, player: winner, players: [winner], text: winText, badgeText: 'WINNER', badgeClass: 'gold' });
    if (!gs.popularity) gs.popularity = {};
    gs.popularity[winner] = (gs.popularity[winner] || 0) + 3;
  }

  // Loser reaction — archetype-driven
  if (loser !== winner) {
    let loseText;
    if (['villain','mastermind','schemer'].includes(loseArch)) {
      loseText = _pick([
        `${loser} stops running. Stares at the finish line ${losePr.sub} didn't reach first. ${losePr.Sub} doesn't cry. Doesn't scream. ${losePr.Sub} just goes very, very still. That's scarier.`,
        `${loser}'s face cycles through fury, disbelief, and something that might be respect — then settles back on fury. "This isn't over." (It is.)`,
        `${loser} kicks the dirt. Then kicks it again. Then turns away from the cameras entirely. The villain lost. And ${losePr.sub} will NEVER forgive this moment.`,
      ], loser + 'loseReact');
    } else if (['hero','loyal-soldier','underdog'].includes(loseArch)) {
      loseText = _pick([
        `${loser} crosses the line second and takes a long, shaky breath. Then walks to ${winner}: "You earned it." The handshake is genuine. The eyes are wet.`,
        `${loser} sits down in the dirt, head in ${losePr.posAdj} hands. Not angry. Just spent. Everything ${losePr.sub} had, and it wasn't quite enough.`,
        `${loser} finishes and immediately hugs ${losePr.posAdj} supporters. "Thank you. I mean it. Thank you." The loss hurts. The love helps.`,
      ], loser + 'loseReact');
    } else if (['wildcard','chaos-agent'].includes(loseArch)) {
      loseText = _pick([
        `${loser} finishes second and… shrugs? "Eh. I made it to the finale. That's pretty sick." The bench can't tell if ${losePr.sub}'s coping or genuinely unbothered.`,
        `${loser} takes the loss with a laugh. "Dude, I just ran an obstacle course over SHARKS. Win or lose, that's a STORY."`,
      ], loser + 'loseReact');
    } else {
      loseText = _pick([
        `${loser} finishes and nods slowly. Processing. "Okay. Okay." A supporter puts a hand on ${losePr.posAdj} shoulder. That's when the composure cracks.`,
        `${loser} walks past the finish line in silence. Doesn't stop. Doesn't look at anyone. Needs a minute. Or several.`,
      ], loser + 'loseReact');
    }
    sprintEvents.push({ type: 'loserReaction', phase: 3, player: loser, players: [loser], text: loseText, badgeText: 'RUNNER-UP', badgeClass: 'grey' });
  }

  // Crowd storm — bench empties, everyone rushes
  {
    const winBench = benchAssignments[winner] || [];
    const loseBench = loser !== winner ? (benchAssignments[loser] || []) : [];
    const allPlayers = [...new Set([...winBench, ...loseBench, ...finalists])];
    if (winBench.length > 0) {
      const stormer = _pick(winBench, 'crowdStorm');
      sprintEvents.push({ type: 'crowdStorm', phase: 3, player: stormer, players: allPlayers.slice(0, 6),
        text: _pick([
          `The bench EMPTIES. ${stormer} leads the charge — ${winBench.length > 1 ? 'they' : pronouns(stormer).sub} PILE onto ${winner}. It's a dogpile of tears and screaming and someone's hat getting crushed. Beautiful chaos.`,
          `${stormer} vaults over the bench railing and TACKLES ${winner} in celebration. Others follow. Within seconds it's a pile of bodies and joy and ugly-crying.`,
          `The supporters swarm the finish line. ${stormer} reaches ${winner} first, grabbing ${winPr.obj} by the shoulders: "YOU DID IT! YOU ACTUALLY DID IT!" The celebration is deafening.`,
        ], 'crowdStormW'),
        badgeText: 'CELEBRATION', badgeClass: 'gold' });
    }
    if (loseBench.length > 0 && loser !== winner) {
      const consoler = _pick(loseBench, 'crowdConsole');
      sprintEvents.push({ type: 'crowdStorm', phase: 3, player: consoler, players: [consoler, loser],
        text: _pick([
          `On the other side, ${consoler} walks to ${loser}. No words. Just a hand on ${losePr.posAdj} shoulder. Then a hug. The bench follows. They lost together.`,
          `${consoler} sits down next to ${loser} in the dirt. "You were incredible." ${loser} nods. Can't talk yet. But the presence helps.`,
          `${loser}'s bench gathers quietly. No celebration, but no collapse either. ${consoler} breaks the silence: "Second place in the entire game. That's not nothing." ${loser} almost smiles.`,
        ], 'crowdStormL'),
        badgeText: 'CONSOLATION', badgeClass: 'blue' });
    }
  }

  sprintEvents.push({ type: 'relayWinner', phase: 3, player: winner, players: [winner], text: `${winner} WINS the Rejected Olympic Relay! A hundred thousand dollars. One obstacle course. Zero regrets.`, badgeText: 'CHAMPION', badgeClass: 'gold' });
  timeline.push(...sprintEvents);

  stageResults.push({
    name: 'The Sprint',
    desc: 'Final dash to the finish. Brownies, fans, sabotage, and pure willpower.',
    scores: { ...sprintScores },
    winner: sprintSorted[0][0],
    phase: 2,
  });

  return {
    stages: stageResults,
    totalScores: scores,
    winner,
    placements: totalSorted.map(([name]) => name),
    sabotageEvents,
    relayData: {
      benchFlips: preRaceData?.benchFlips || [],
      confessionals: preRaceData?.confessionals || [],
      pitches: preRaceData?.pitches || {},
      plantedSabotage,
      plantedSabotage2,
      timeline,
      showmancePair: showmancePair || null,
    },
  };
}

// Text backlog for relay
export function generateRelayTextBacklog(ep) {
  const rd = ep.relayData;
  if (!rd) return '';
  const lines = [];
  const winner = ep.finaleChallengeWinner || ep.winner;
  const finalists = ep.finaleFinalists || [];

  lines.push('=== REJECTED OLYMPIC RELAY ===');
  lines.push('');

  // Pitches
  if (rd.pitches) {
    lines.push('— PRE-RACE PITCHES —');
    Object.entries(rd.pitches).forEach(([f, p]) => lines.push(`${f} (${p.type}): ${p.text}`));
    lines.push('');
  }

  // Bench flips
  if (rd.benchFlips?.length) {
    lines.push('— BENCH FLIPS —');
    rd.benchFlips.forEach(flip => lines.push(`${flip.supporter} flipped from ${flip.from}'s bench to ${flip.to}'s bench (${flip.reason})`));
    lines.push('');
  }

  // Sabotage plants
  if (rd.plantedSabotage) lines.push(`SABOTAGE: ${rd.plantedSabotage.planter} planted a laxative cupcake targeting ${rd.plantedSabotage.targetFinalist}`);
  if (rd.plantedSabotage2) lines.push(`SABOTAGE: ${rd.plantedSabotage2.planter} greased the flagpole targeting ${rd.plantedSabotage2.targetFinalist}`);

  // Timeline
  if (rd.timeline?.length) {
    lines.push('');
    lines.push('— RELAY TIMELINE —');
    rd.timeline.forEach(ev => lines.push(`[${ev.type}] ${ev.text}`));
  }

  // Scores
  lines.push('');
  lines.push('— FINAL SCORES —');
  const sorted = Object.entries(ep.finaleChallengeScores || {}).sort(([,a],[,b]) => b - a);
  sorted.forEach(([name, score], i) => lines.push(`${i + 1}. ${name}: ${score.toFixed(1)}`));
  lines.push(`WINNER: ${winner}`);

  return lines.join('\n');
}

// FTC swing votes: hesitating jurors can change their vote based on FTC performance
export function applyFTCSwingVotes(finalists) {
  const jury = gs.jury || [];
  const swings = [];

  jury.forEach(juror => {
    const jS = pStats(juror);
    const bonds = finalists.map(f => ({ name: f, bond: getBond(juror, f) }));
    bonds.sort((a, b) => b.bond - a.bond);

    if (bonds.length < 2) return;
    const top = bonds[0], second = bonds[1];
    const isHesitating = top.bond <= 1.5 && top.bond >= -0.5 && second.bond >= -0.5 && (top.bond - second.bond) < 2;
    if (!isHesitating) return;

    // Simulate FTC performance
    const performances = finalists.map(f => {
      const fS = pStats(f);
      const answerQuality = fS.social * 0.5 + fS.strategic * 0.3 + fS.boldness * 0.2;
      const bitterness = Math.max(0, -getBond(juror, f));
      const difficulty = jS.strategic * 0.4 + bitterness * 0.6;
      const performance = answerQuality - difficulty + (Math.random() * 2 - 1);
      return { name: f, performance };
    });
    performances.sort((a, b) => b.performance - a.performance);

    const bestPerformer = performances[0].name;
    const worstPerformer = performances[performances.length - 1].name;
    const nudge = 0.3 + Math.random() * 0.2;

    const originalPick = top.name;

    addBond(juror, bestPerformer, nudge);
    addBond(juror, worstPerformer, -nudge * 0.5);

    // Supporting moment: strong ally juror boosts a finalist for hesitating jurors
    finalists.forEach(f => {
      const allySupporter = jury.find(j =>
        j !== juror && getBond(j, f) >= 3 && !(
          finalists.every(ff => getBond(j, ff) >= -0.5 && getBond(j, ff) <= 1.5)
        )
      );
      if (allySupporter) addBond(juror, f, 0.2);
    });

    const newBonds = finalists.map(f => ({ name: f, bond: getBond(juror, f) }));
    newBonds.sort((a, b) => b.bond - a.bond);
    const newPick = newBonds[0].name;

    if (newPick !== originalPick) {
      swings.push({ juror, originalVote: originalPick, finalVote: newPick, reason: `FTC performance and jury support changed ${juror}'s mind` });
    }
  });

  return swings;
}

// ── Generate FTC opening statements + juror Q&A from game data ──
export function generateFTCData(finalists, juryResult) {
  const jury = gs.jury || [];

  // Opening statements: grounded in each finalist's actual game stats
  const finalistStatements = {};
  finalists.forEach(f => {
    const fs = pStats(f);
    const arch = players.find(p => p.name === f)?.archetype || '';
    const wins = gs.episodeHistory.filter(e => e.immunityWinner === f).length;
    const totalVotes = gs.episodeHistory.reduce((s, e) => s + (e.votes?.[f] || 0), 0);
    const lines = [];

    if (fs.strategic >= 8 && fs.social >= 7)
      lines.push(`I played this game on every level — strategy, relationships, competition. I want your vote based on gameplay, because I believe mine was the best game up here.`);
    else if (fs.strategic >= 8)
      lines.push(`I controlled this game. Every big vote — I was behind it. I'm not apologizing for playing hard. I'm asking you to respect it.`);
    else if (fs.social >= 8)
      lines.push(`I played this game with each of you in mind. I kept my word where I could. I built real relationships. I'm here because people trusted me.`);
    else if (wins >= 3 || fs.physical >= 8)
      lines.push(`I earned every single day out here. I won when I had to. I never hid. I competed — and I'm asking you to reward that.`);
    else
      lines.push(`I know I'm not the flashiest player up here. But I navigated this game on my own terms and I'm standing at the end. That took something real.`);

    if (totalVotes >= 5)
      lines.push(`I was targeted multiple times. People wanted me gone. I found a way to survive every single time.`);
    else if (wins >= 2)
      lines.push(`${wins} individual wins — including the one that guaranteed my spot tonight. I was never just along for the ride.`);

    finalistStatements[f] = lines;
  });

  // Juror Q&A: each juror gets a pointed question and a finalist's response
  const jurorQA = [];
  const _usedQs = new Set(); // prevent repeats
  const _h = (a,b) => [...a+b].reduce((s,c)=>s+c.charCodeAt(0),0); // deterministic hash
  const _pick = (arr,seed) => arr[seed % arr.length];

  // ── Question-Answer pairs: responses reference actual game data (names, events, numbers) ──
  const _wins = name => gs.episodeHistory.filter(e => e.immunityWinner === name).length;
  const _bigMoves = name => gs.playerStates?.[name]?.bigMoves || 0;
  const _betrayalCount = name => (gs.namedAlliances || []).reduce((n, a) => n + (a.betrayals || []).filter(b => b.player === name).length, 0);
  // Find the finalist's closest ally (for specific references)
  const _closestAlly = name => {
    const active = [...finalists, ...jury];
    return active.filter(p => p !== name).sort((a, b) => getBond(name, b) - getBond(name, a))[0] || 'my ally';
  };
  // Find the biggest threat the finalist helped eliminate
  const _biggestKill = name => {
    for (let i = gs.episodeHistory.length - 1; i >= 0; i--) {
      const e = gs.episodeHistory[i];
      if (e.eliminated && e.votingLog?.some(v => v.voter === name && v.voted === e.eliminated)) return e.eliminated;
    }
    return null;
  };
  const _qa = (target, fS, wins, juror) => {
    const hi = v => fS[v] >= 7, lo = v => fS[v] <= 4;
    const tPr = pronouns(target);
    const ally = _closestAlly(target);
    const kill = _biggestKill(target);
    const bCount = _betrayalCount(target);
    const bigM = _bigMoves(target);
    const jPr = pronouns(juror);
    return {
    // ── Betrayal (voted them out, hostile) ──
    betrayalHostile: [
      { q:`You voted me out, ${target}. Give me one real reason I should vote for you tonight.`,
        r: hi('strategic') ? `"Because voting you out, ${juror}, was the hardest call I made in this game — and I'm standing here because I had the guts to make it."` : `"${juror}, I had to make the move that kept me alive. I'm sorry it came at your expense — but I'd make that call again."` },
      { q:`You wrote my name down, ${target}. Look me in the eye and tell me why.`,
        r: hi('strategic') ? `"Because you were the biggest threat left, ${juror}. I respected you enough to make the move myself instead of hiding behind someone else."` : `"Because the numbers told me it was you or me, ${juror}. I chose me. I'd do it again."` },
      { q:`I'm gone because of you, ${target}. What makes you think you deserve my vote?`,
        r: hi('social') ? `"Because I owned what I did to you, ${juror}. I never hid behind excuses. You deserved honesty then, and I'm giving it to you now."` : `"I don't think I deserve it. I think I earned it. ${bigM > 0 ? `${bigM} big moves — including the one that sent you home.` : `Every day I survived was earned.`}"` },
    ],
    // ── Betrayal (voted them out, neutral) ──
    betrayalNeutral: [
      { q:`You had a hand in getting me eliminated, ${target}. Was it personal, or purely the game?`,
        r: hi('strategic') ? `"Purely game, ${juror}. You were too dangerous to keep around — everyone knew it. The decision wasn't easy but it was right."` : `"It wasn't personal, ${juror}. The alliance needed a name and yours came up. I followed the numbers."` },
      { q:`My torch got snuffed and you were part of it, ${target}. Tell me why.`,
        r: hi('social') ? `"${ally} and I made that call together. I could've fought it, but breaking ranks would've ended my game."` : `"I went along with the group. I'm not going to pretend I drove that vote, ${juror}."` },
      { q:`I thought we had something out there, ${target}. Then you voted me out. What happened?`,
        r: hi('loyalty') ? `"We did, ${juror}. And losing that was one of the worst parts of this game. But the numbers left me no choice."` : `"The game moved faster than our relationship could keep up. I made a call — and I'm sorry."` },
    ],
    // ── Strategic ──
    strategic: [
      { q:`What was your single biggest move, ${target} — and how do you know it was yours?`,
        r: hi('strategic') ? `"${kill ? `Getting ${kill} out. That was my idea — I pulled the votes together and made it happen.` : `The merge vote. I set the direction and everyone followed.`} Ask anyone on this jury."` : wins >= 2 ? `"Winning immunity when I absolutely had to. ${wins} times I saved myself — including the one that got me this seat."` : `"Staying alive when everyone counted me out. That's not one move — that's a whole game."` },
      { q:`Name one player you outplayed, ${target}. Tell me exactly how.`,
        r: hi('strategic') ? `"${kill || jury[0]}. I saw ${pronouns(kill || jury[0]).pos} game before ${pronouns(kill || jury[0]).sub} did. I let ${pronouns(kill || jury[0]).obj} feel safe, then moved when ${pronouns(kill || jury[0]).sub} ${pronouns(kill || jury[0]).sub==='they'?'weren\'t':'wasn\'t'} looking."` : hi('social') ? `"${kill || jury[0]}. I built a relationship ${pronouns(kill || jury[0]).sub} trusted completely. When the vote came, ${pronouns(kill || jury[0]).sub} never saw it coming from me."` : `"${kill || jury[0]}. ${pronouns(kill || jury[0]).Sub} made a mistake at the wrong time and I was positioned to capitalize. That's how you win this game."` },
      { q:`When did you realize you could actually win this game, ${target}?`,
        r: hi('strategic') ? `"At the merge. I looked around and knew I could outmaneuver everyone left."` : wins >= 2 ? `"After my second immunity win. I realized nobody could stop me if I kept competing."` : `"Honestly? Not until I was sitting in this chair. I just kept surviving."` },
      { q:`Walk me through your endgame, ${target}. When did you start building it?`,
        r: hi('strategic') ? `"I started building it at the merge. ${ally} was my endgame partner — every vote after that was a step toward tonight."` : hi('social') ? `"I kept ${ally} close. My endgame was my relationships — they carried me here."` : `"I didn't have a master plan. I had a next-day plan, every day. And here I am."` },
      { q:`Who was your most dangerous opponent, ${target}, and how did you handle ${jPr.obj}?`,
        r: hi('strategic') ? `"${kill || jury[jury.length-1]}. I identified ${pronouns(kill || jury[jury.length-1]).obj} as the biggest threat and made sure the votes went that way."` : hi('social') ? `"${kill || jury[jury.length-1]}. I kept ${pronouns(kill || jury[jury.length-1]).obj} close enough that ${pronouns(kill || jury[jury.length-1]).sub} never saw me as a threat. Until it was too late."` : `"${kill || jury[jury.length-1]}. I stayed out of ${pronouns(kill || jury[jury.length-1]).pos} crosshairs and let other people take the shot."` },
    ],
    // ── Social ──
    social: [
      { q:`I never felt like you were being straight with me, ${target}. Convince me I was wrong.`,
        r: hi('social') ? `"${juror}, I was as real with you as this game allowed. I never lied to your face. I can look you in the eye on that."` : `"I played a game, ${juror}. Not everything I did was pretty. But I was never fake with you — I just couldn't show all my cards."` },
      { q:`Who out here actually trusted you, ${target} — and did you deserve it?`,
        r: hi('loyalty') ? `"${ally} trusted me completely, and I never broke that. ${pronouns(ally).Sub} deserved someone who had ${pronouns(ally).pos} back and I was that person."` : `"${ally} trusted me. Did I deserve it? ${bCount === 0 ? 'Yes — I never betrayed anyone.' : `Mostly. But I broke ${bCount} promise${bCount !== 1 ? 's' : ''} to get here.`}"` },
      { q:`What relationship in this game are you most proud of, ${target}?`,
        r: hi('social') ? `"My relationship with ${ally}. It didn't always help my game, but it was the most real thing out here."` : `"${ally}. ${pronouns(ally).Sub} had no reason to trust me early on and ended up in my corner. That wasn't strategy — that was earned."` },
      { q:`Did anyone here see the real you, ${target}, or were you performing the whole time?`,
        r: hi('social') ? `"${ally} saw the real me. Late at night, away from the game. Those conversations were real."` : `"Honestly? I don't know where the performance ended and I began. This game does that to you."` },
    ],
    // ── Loyalty ──
    loyalty: [
      { q:`Did you keep your word out there, ${target}? If you broke it — when, and why?`,
        r: hi('loyalty') ? `"I kept my word to ${ally}. When the game forced hard calls, I owned them instead of hiding."` : `"I broke ${bCount > 0 ? bCount + ' promise' + (bCount !== 1 ? 's' : '') : 'promises'}. I won't pretend otherwise. Every time I did, standing still meant going home."` },
      { q:`Name one promise you made and kept, ${target} — even when it cost you.`,
        r: hi('loyalty') ? `"I promised ${ally} I'd never write ${pronouns(ally).pos} name down. I didn't. Even when it would've been the easier play."` : `"I promised myself I'd play my own game. That cost me allies, but I'm sitting here."` },
      { q:`Who did you betray, ${target}, and would you do it again?`,
        r: hi('loyalty') ? `"${bCount === 0 ? 'Nobody. I played clean and I\'m proud of that.' : 'I only moved against people who were already coming for me. And yes, I would.'}"` : lo('loyalty') ? `"${bCount} alliance${bCount !== 1 ? 's' : ''}. And yeah — I would. This game doesn't reward loyalty. It rewards results."` : `"${kill ? kill + '. ' + pronouns(kill).Sub + ' ' + (pronouns(kill).sub==='they'?'know':'knows') + ' why.' : 'One person. They know who they are.'} I'd do it differently if I could. But I'd still be here."` },
      { q:`Was there anyone you refused to write down, ${target}, no matter what?`,
        r: hi('loyalty') ? `"${ally}. I never wrote ${pronouns(ally).pos} name and I never would have. That was a line I drew on day one."` : `"No. Everyone was on the table. That's not cold — that's honest."` },
    ],
    // ── General ──
    general: [
      { q:`Tell me something real, ${target}. What do you think you did better than everyone up here?`,
        r: hi('strategic') ? `"I read the room better. Every vote, I knew where it was going before anyone spoke. ${bigM >= 3 ? bigM + ' big moves — I shaped this season.' : ''}"` : hi('social') ? `"I connected with people. Not as a strategy — because I actually cared. Ask ${ally}."` : `"I survived. ${wins >= 2 ? wins + ' immunity wins. ' : ''}Every day someone could've taken me out and no one did. That's not luck."` },
      { q:`What's the one thing you wish the jury knew about your game, ${target}?`,
        r: hi('strategic') ? `"How much of what happened was my idea. ${kill ? 'The ' + kill + ' vote? Mine.' : 'You\'d be surprised how many votes I quietly shaped.'}"` : `"How hard it was. I made it look easy, but every day was a fight. ${wins >= 2 ? wins + ' immunity wins didn\'t fall from the sky.' : ''}"` },
      { q:`If you were sitting where I am, ${target}, would you vote for yourself? Why?`,
        r: hi('strategic') ? `"Absolutely. ${bigM >= 2 ? bigM + ' big moves, ' : ''}${wins >= 2 ? wins + ' immunity wins, ' : ''}I played the best game and I know it."` : hi('social') ? `"I'd vote for the person who played with the most heart. I think that's me. Ask ${ally}."` : `"Honestly? I'd probably struggle with it. But yeah — I'd vote for me. I earned this seat."` },
      { q:`What moment in this game changed who you are, ${target}?`,
        r: hi('social') ? `"The night ${ally} broke down at camp and I was the only one who stayed. That wasn't gameplay. That was just human."` : `"${kill ? 'The vote that took out ' + kill + '.' : 'The first time I survived a vote I shouldn\'t have.'} It changed how I saw the whole game."` },
      { q:`Forget strategy, ${target}. Tell me who you actually are outside this game.`,
        r: `"I'm someone who cares more than I let on out here. This game forces you to hide that. But I'm ready to stop hiding."` },
      { q:`Why should I vote for you over ${finalists.find(x => x !== target) || 'them'}, ${target}?`,
        r: hi('strategic') ? `"Because ${finalists.find(x => x !== target) || 'they'} rode coattails while I drove the bus. ${bigM >= 2 ? bigM + ' big moves to their... what, exactly?' : 'My game had direction. Theirs had survival.'}"` : hi('social') ? `"Because I treated people like people, not like chess pieces. ${finalists.find(x => x !== target) || 'They'} can't say that."` : `"Because I earned this seat the hard way. ${wins >= 2 ? wins + ' immunity wins.' : 'Every day was a fight.'} I never had it easy."` },
      { q:`${target}, what was the hardest day out here for you?`,
        r: hi('social') ? `"The day ${kill || jury[0]} went home. I knew it was coming and I couldn't stop it. That stuck with me."` : `"Day ${Math.max(1, (gs.episodeHistory.length - 3) * 3)}. I was exhausted, paranoid, and completely alone. But I didn't quit."` },
    ],
    // ── Challenge / Physical ──
    challenge: [
      { q:`${target}, you ${wins >= 3 ? 'dominated challenges' : wins >= 1 ? 'won some challenges' : 'barely won challenges'}. Is that enough to earn a vote?`,
        r: wins >= 3 ? `"${wins} immunity wins. ${wins >= 4 ? 'Nobody in this game came close.' : 'When my life was on the line, I saved it myself.'} That's not just physical — that's mental toughness."` : wins >= 1 ? `"I won when it counted most. One immunity win at the right time is worth more than three at the wrong time."` : `"I didn't need immunity because I built relationships that kept me safe. That takes a different kind of strength."` },
      { q:`Did you ever throw a challenge, ${target}? Be honest.`,
        r: hi('strategic') ? `"I played every challenge to win. But I also knew when winning would put a target on my back."` : `"Never. I gave everything every single time. Ask anyone who competed next to me."` },
    ],
    // ── Respect / Acknowledgment ──
    respect: [
      { q:`Who sitting next to you deserves to be here, ${target}? And who doesn't?`,
        r: hi('strategic') ? `"Everyone here earned their spot. But only one of us controlled how we got here. I'll let you figure out who."` : hi('social') ? `"I respect everyone sitting next to me. We all survived the same game. But our games were very different."` : `"We're all here. That means something. But my path was harder than ${finalists.find(x => x !== target) || 'theirs'}. And I think the jury knows it."` },
      { q:`${target}, is there anyone on this jury you owe an apology to?`,
        r: bCount >= 2 ? `"${kill || jury[0]}. I owe ${pronouns(kill || jury[0]).obj} that. What I did was game, but it was also personal, and I should have handled it better."` : bCount === 1 ? `"One person. ${pronouns(kill || jury[0]).Sub} ${pronouns(kill || jury[0]).sub==='they'?'know':'knows'} who ${pronouns(kill || jury[0]).sub} ${pronouns(kill || jury[0]).sub==='they'?'are':'is'}. I'm sorry for how it went down — not for the move, but for the way I did it."` : `"No. I played with integrity. I didn't always succeed, but I never did anything I need to apologize for."` },
      { q:`What would you say to the person you hurt most in this game, ${target}?`,
        r: hi('social') ? `"I'd say I'm sorry it happened in this context. Outside the game, it wouldn't have gone that way. But in here, I had to make choices I'm not proud of."` : `"I'd tell ${pronouns(kill || jury[0]).obj} I respected ${pronouns(kill || jury[0]).pos} game. The move wasn't about disrespect — it was about winning."` },
    ],
    // ── Fire / Aggressive ──
    fire: [
      { q:`Be honest, ${target}. Did you ride coattails to get here?`,
        r: hi('strategic') ? `"Name one vote I didn't have a hand in. I'll wait."` : wins >= 2 ? `"${wins} immunity wins and you think I rode coattails? I saved myself more than anyone out here."` : hi('social') ? `"I built every relationship that got me here. That's not riding coattails — that's a different kind of game."` : `"Maybe. But I'm sitting here and a lot of people who played 'their own game' aren't. Results matter."` },
      { q:`${target}, why do you think half this jury is rolling their eyes right now?`,
        r: hi('social') ? `"Because this game makes people bitter. I get it. But bitterness doesn't change who played the best game."` : hi('strategic') ? `"Because I beat them and they know it. I'd be rolling my eyes too."` : `"Because nobody wants to admit that the person who beat them deserved it. That's human nature."` },
      { q:`Stop performing, ${target}. Who are you really?`,
        r: hi('social') ? `"This IS who I am, ${juror}. The person you saw at camp, the one who listened, who cared — that's not an act. I brought myself to this game."` : `"I'm someone who wanted to win badly enough to do things I wouldn't do in real life. I'm not proud of all of it. But I'd do it again."` },
      { q:`${target}, you're sitting there acting humble. We both know that's not real. Drop the act.`,
        r: hi('boldness') ? `"Fine. I played the best game out here. I know it. You know it. Everyone on that bench knows it. I'm not apologizing for winning."` : `"It's not an act, ${juror}. I'm genuinely grateful to be here. If that looks like performance to you, that says more about the game than about me."` },
    ],
    };
  };

  function _pickUnusedQA(pool, seed) {
    const unused = pool.filter(qa => !_usedQs.has(qa.q));
    const src = unused.length ? unused : pool;
    const qa = _pick(src, seed);
    _usedQs.add(qa.q);
    return qa;
  }

  (juryResult?.reasoning || []).forEach((r, ri) => {
    const { juror, votedFor } = r;
    const jS = pStats(juror);
    const jHistory = gs.jurorHistory?.[juror];
    const other = finalists.find(f => f !== votedFor);
    const target = Math.random() < 0.45 && other ? other : votedFor;
    const bond = getBond(juror, target);
    const votedThemOut = jHistory?.voters?.includes(target);
    const fS = pStats(target);
    const seed = _h(juror, target) + ri * 7;
    const qa = _qa(target, fS, _wins(target), juror);

    // Pick the most relevant Q&A category based on juror personality + relationship
    // Multiple categories can apply — use proportional weighting to vary the selection
    let picked;
    if (votedThemOut && bond < 0) {
      picked = _pickUnusedQA(qa.betrayalHostile, seed);
    } else if (votedThemOut) {
      picked = _pickUnusedQA(qa.betrayalNeutral, seed);
    } else {
      // Build a weighted pool of eligible categories
      const _catPool = [];
      if (jS.strategic >= 6) _catPool.push(...Array(Math.round(jS.strategic * 0.3)).fill('strategic'));
      if (jS.social >= 5) _catPool.push(...Array(Math.round(jS.social * 0.2)).fill('social'));
      if (jS.loyalty >= 6) _catPool.push(...Array(Math.round(jS.loyalty * 0.2)).fill('loyalty'));
      if (jS.physical >= 7 || _wins(target) >= 2) _catPool.push('challenge', 'challenge');
      if (jS.boldness >= 7 || jS.temperament <= 4) _catPool.push('fire', 'fire', 'fire');
      if (bond >= 2) _catPool.push('respect', 'respect');
      if (bond <= -1) _catPool.push('fire', 'fire');
      _catPool.push('general', 'general', 'respect'); // always some general/respect chance
      const _catChoice = _pick(_catPool, seed);
      picked = _pickUnusedQA(qa[_catChoice] || qa.general, seed);
    }

    jurorQA.push({ juror, targetForQuestion: target, question: picked.q, response: picked.r });
  });

  return { finalistStatements, jurorQA };
}

export function generateFanCampaign(finalists) {
  const jury = gs.jury || [];
  const _pick = (arr, seed) => arr[([...seed].reduce((a,c)=>a+c.charCodeAt(0),0)+gs.episode*7)%arr.length];
  const usedJurors = new Set();

  const phases = finalists.map((name, idx) => {
    const s = pStats(name);
    const pr = pronouns(name);
    const arch = players.find(p => p.name === name)?.archetype || '';
    const pop = gs.popularity?.[name] || 0;
    const _betrayalCount = (gs.namedAlliances || []).reduce((n, a) => n + (a.betrayals || []).filter(b => b.player === name).length, 0);
    const _bigMoves = gs.playerStates?.[name]?.bigMoves || 0;
    const wins = gs.episodeHistory.filter(e => e.immunityWinner === name).length;
    const showmance = gs.showmances?.find(sm => sm.players.includes(name) && sm.phase !== 'broken-up');

    // Determine speech style from highest stat
    const styleScores = [
      { style: 'bold', val: s.boldness },
      { style: 'social', val: s.social },
      { style: 'strategic', val: s.strategic },
    ].sort((a, b) => b.val - a.val);
    const style = styleScores[0].style;

    // Speech — personality-driven, references actual game
    let speech;
    if (style === 'bold') {
      speech = _pick([
        `"I didn't come here to make friends. I came here to win. ${_betrayalCount > 0 ? `Yeah, I cut people. ${_betrayalCount} alliance${_betrayalCount !== 1 ? 's' : ''} — I broke them because they were in my way.` : `I stayed loyal when I could, and I fought when I had to.`} ${wins > 0 ? `${wins} immunity win${wins !== 1 ? 's' : ''} — I earned my safety.` : `I didn't need immunity. I made myself too valuable to vote out.`} You want a winner who played scared? Vote for ${pr.obj === 'them' ? 'someone else' : 'the other one'}. You want a winner who played with guts? I'm right here."`,
        `"Every person sitting on that jury knows what I did. I owned every move. ${_bigMoves > 0 ? `${_bigMoves} big move${_bigMoves !== 1 ? 's' : ''} — and I'd make every one of them again.` : `I played steady when others crumbled.`} This isn't a popularity contest — wait, actually, it is. And I think the fans respect someone who plays hard."`,
        `"Look — I'm not perfect. I know that. But I played THIS game harder than anyone sitting next to me. ${showmance ? `${showmance.players.find(p => p !== name)} and I had something real out there — that wasn't strategy, that was human.` : `I connected with people when it mattered.`} ${_betrayalCount >= 2 ? `Did I betray people? Absolutely. Did I feel good about it? No. Did it get me here? Yes.` : `I kept my word more than most.`} Vote for the player who actually played."`,
      ], name + 'bold');
    } else if (style === 'social') {
      speech = _pick([
        `"I know people think this game is about strategy. And it is. But it's also about people. ${showmance ? `${showmance.players.find(p => p !== name)} — you know what we had was real. That's not a weakness.` : `Every relationship I built out there was genuine.`} I listened. I cared. And I made it to the end because people trusted me — not because I tricked them. ${wins > 0 ? `I won challenges too — ${wins} of them.` : ''} I played a full game. A human game. I hope that's enough."`,
        `"Thirty-something days out here. I've laughed, I've cried, I've been scared, I've been angry. ${_betrayalCount === 0 ? `And through all of it, I never wrote down someone I promised I wouldn't.` : `I made mistakes — I know that. But I owned them.`} I built real connections with real people. That's not weakness. That's the hardest thing to do in this game. If the fans saw that — if they felt what I felt — then I think they'll know who to vote for."`,
        `"I want to tell you who I am. Not what I did in the game — who I AM. I'm someone who ${s.loyalty >= 7 ? `keeps ${pr.pos} word even when it costs ${pr.obj}` : `fights for the people ${pr.sub} ${pr.sub==='they'?'care':'cares'} about`}. That's what I brought to this island. ${_bigMoves > 0 ? `I made moves too — don't think I didn't. But the moves meant something because the relationships meant something.` : `I survived by being someone people wanted around.`} I hope the fans saw that."`,
      ], name + 'social');
    } else {
      speech = _pick([
        `"Let me break it down. ${_bigMoves > 0 ? `${_bigMoves} big move${_bigMoves !== 1 ? 's' : ''}. ` : ''}${wins > 0 ? `${wins} immunity win${wins !== 1 ? 's' : ''}. ` : ''}${_betrayalCount > 0 ? `${_betrayalCount} alliance${_betrayalCount !== 1 ? 's' : ''} broken — each one for a reason.` : `Zero betrayals. I played clean.`} I controlled votes. I read the room. I positioned myself where I needed to be at every tribal. ${pr.Sub} sitting next to me ${finalists.length > 2 ? 'can\'t say that' : 'can\'t say that'}. If you're voting on gameplay — the choice is obvious."`,
        `"I played this game like a chess match. Every vote, I knew who was going home before tribal started. ${_betrayalCount >= 2 ? `Yes, I cut allies. Because I understood the board better than they did.` : `I didn't need to betray people — I set the board so I didn't have to.`} ${showmance ? `Even my relationship with ${showmance.players.find(p => p !== name)} — I won't pretend that wasn't partly strategic. But it was real too.` : ''} The fans have watched every episode. They've seen every confessional. They know who ran this game."`,
        `"Strategy. That's what got me here. Not luck, not immunity wins${wins > 0 ? ` — well, ${wins} of those too` : ''}, not being liked. I outplayed everyone. ${_bigMoves >= 2 ? `The idol play in episode — that was me. The alliance flip — me. The split vote — me.` : `Every move I made was calculated.`} I'm not going to stand here and cry about relationships. I'm going to tell you I played the best game. And I think the fans agree."`,
      ], name + 'strategic');
    }

    // Pulse reaction — based on popularity rank among finalists
    const popRanks = [...finalists].sort((a, b) => (gs.popularity?.[b] || 0) - (gs.popularity?.[a] || 0));
    const popRank = popRanks.indexOf(name);
    const pulseReaction = popRank === 0 ? 'surging' : popRank === popRanks.length - 1 ? (Math.random() < 0.5 ? 'mixed' : 'cooling') : 'steady';

    // Fan reactions — keyed to archetype and game history
    const posPool = arch === 'villain'
      ? ['ICONIC VILLAIN', 'love to hate you', 'RESPECT THE GAME', 'villain era']
      : arch === 'hero'
      ? ['DESERVES IT', 'the real deal', 'HERO', 'pure heart']
      : _bigMoves >= 2
      ? ['GAME CHANGER', 'what a player', 'MASTERMIND', 'ran the season']
      : showmance
      ? ['power couple energy', 'heart of the season', 'LOVE WINS', 'rooting for you']
      : ['let\'s GO', 'earned it', 'WINNER', 'fan favorite'];
    const negPool = arch === 'villain'
      ? ['snake', 'didn\'t deserve it', 'carried', 'no loyalty']
      : _betrayalCount >= 2
      ? ['backstabber', 'can\'t trust that', 'FAKE', 'snake energy']
      : ['overrated', 'meh', 'boring winner', 'not impressed'];

    // Higher popularity = more positive reactions
    const otherMaxPop = Math.max(...finalists.filter(f => f !== name).map(f => gs.popularity?.[f] || 0));
    const posCount = pop >= otherMaxPop ? 2 : 1;
    const negCount = 3 - posCount;
    const fanReactions = [];
    const _usedPos = new Set(), _usedNeg = new Set();
    for (let i = 0; i < posCount; i++) {
      const r = _pick(posPool.filter(x => !_usedPos.has(x)), name + 'pos' + i);
      _usedPos.add(r);
      fanReactions.push({ text: r, sentiment: 'positive' });
    }
    for (let i = 0; i < negCount; i++) {
      const r = _pick(negPool.filter(x => !_usedNeg.has(x)), name + 'neg' + i);
      _usedNeg.add(r);
      fanReactions.push({ text: r, sentiment: 'negative' });
    }

    // Jury reactions — pick juror with strongest bond to THIS finalist, not used yet
    const juryReactions = [];
    const availJurors = jury.filter(j => !usedJurors.has(j));
    if (availJurors.length) {
      // Sort by absolute bond strength — strongest relationship reacts
      const ranked = availJurors.map(j => ({ juror: j, bond: getBond(j, name), absBond: Math.abs(getBond(j, name)) }))
        .sort((a, b) => b.absBond - a.absBond);
      // Take 1-2 jurors (1 for F3, 2 for F2 to fill the space)
      const takeCount = finalists.length <= 2 ? Math.min(2, ranked.length) : Math.min(1, ranked.length);
      for (let i = 0; i < takeCount; i++) {
        const { juror, bond } = ranked[i];
        usedJurors.add(juror);
        const jPr = pronouns(juror);
        const fPr = pronouns(name);
        let text;
        if (bond >= 3) {
          text = _pick([
            `"We were allies from day one. Everything ${name} said up there is true. ${fPr.Sub} earned this."`,
            `"${name} played with heart. I watched it every day. The fans see what I see — ${fPr.sub} ${fPr.sub==='they'?'deserve':'deserves'} this."`,
            `"I trust ${name}. I trusted ${fPr.obj} out there and I trust ${fPr.obj} now. My vote would go to ${fPr.obj} — but tonight it's not my call."`,
            `"${name} and I had something real. Not strategy — real. ${fPr.Sub} played the game I wish I could have played."`,
          ], juror + name + 'pos');
        } else if (bond <= -2) {
          text = _pick([
            `"${name} talks about loyalty? Ask me how that loyalty felt when the votes came out. I'll never forget."`,
            `"I sat on that jury and watched ${name} do to others what ${fPr.sub} did to me. The fans should see through it."`,
            `"${name} is a good player. I'll give ${fPr.obj} that. But ${fPr.sub} ${fPr.sub==='they'?'are':'is'}n't a good person out here. And the fans know the difference."`,
            `"I have nothing nice to say about ${name}'s game. ${fPr.Sub} got here by cutting people who trusted ${fPr.obj}. That's not a winner."`,
          ], juror + name + 'neg');
        } else {
          text = _pick([
            `"${name} played hard. Whether that's enough — the fans will decide. Not me. Not anymore."`,
            `"I respect ${name}'s game. I don't love it. But I respect it. The fans have more information than we did — let them judge."`,
            `"${name} made it to the end. That's not nothing. Whether ${fPr.sub} ${fPr.sub==='they'?'deserve':'deserves'} to win — that's between ${fPr.obj} and a million viewers."`,
            `"I've watched ${name} play for ${gs.episode || 0} episodes. ${fPr.Sub} ${fPr.sub==='they'?'are':'is'} good. ${fPr.Sub} ${fPr.sub==='they'?'are':'is'}n't great. But good might be enough tonight."`,
          ], juror + name + 'neutral');
        }
        juryReactions.push({ juror, text, bond: Math.round(bond * 10) / 10 });
      }
    }

    return { finalist: name, style, speech, pulseReaction, fanReactions, juryReactions };
  });

  return { finalists: [...finalists], phases };
}

export function simulateFanVote(finalists) {
  const scores = {};
  const breakdown = [];
  finalists.forEach(name => {
    const s = pStats(name);
    const pop = gs.popularity?.[name] || 0;
    const campaignBoost = s.social * 0.3 + s.boldness * 0.2 + s.strategic * 0.1;
    const variance = Math.random() * 1.5;
    const total = pop * 1.0 + campaignBoost + variance;
    scores[name] = total;
    breakdown.push({ name, popularity: pop, campaignBoost: Math.round(campaignBoost * 10) / 10, totalScore: Math.round(total * 10) / 10 });
  });

  const totalScore = Object.values(scores).reduce((s, v) => s + Math.max(0, v), 0) || 1;
  const percentages = {};
  // Ensure percentages sum to 100
  const sorted = Object.entries(scores).sort(([,a],[,b]) => b - a);
  let pctRemaining = 100;
  sorted.forEach(([name, score], i) => {
    if (i === sorted.length - 1) {
      percentages[name] = pctRemaining;
    } else {
      const pct = Math.round((Math.max(0, score) / totalScore) * 100);
      percentages[name] = pct;
      pctRemaining -= pct;
    }
  });

  breakdown.forEach(b => { b.pct = percentages[b.name]; });
  breakdown.sort((a, b) => b.totalScore - a.totalScore);

  const rankings = sorted.map(([name]) => name);
  const winner = rankings[0];
  const winnerPct = percentages[winner];
  const isF3 = finalists.length >= 3;
  const margin = isF3
    ? (winnerPct >= 45 ? 'landslide' : winnerPct >= 37 ? 'comfortable' : 'razor-thin')
    : (winnerPct >= 60 ? 'landslide' : winnerPct >= 52 ? 'comfortable' : 'razor-thin');

  return { scores, percentages, rankings, winner, margin, breakdown };
}
