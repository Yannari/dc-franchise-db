// js/chal/say-uncle.js
import { SAY_UNCLE_CATEGORIES, SAY_UNCLE_POOL, gs, players } from '../core.js';
import { pStats, pronouns, updateChalRecord } from '../players.js';
import { addBond, getBond } from '../bonds.js';
import { wRandom, computeHeat } from '../alliances.js';
import { _challengeRomanceSpark } from '../romance.js';

export function simulateSayUncle(ep) {
  const activePlayers = [...gs.activePlayers];
  const _rp = arr => arr[Math.floor(Math.random() * arr.length)];
  const maxRounds = 50;

  const remaining = [...activePlayers];
  const eliminated = [];
  const rounds = [];
  const backfires = [];
  let immunityWinner = null;

  // ── Survival roll ──
  const _survivalRoll = (player, category, roundNum) => {
    const s = pStats(player);
    // Linear fatigue — spreads failures across rounds instead of bunching them at the end
    // Round 1: 0.02, Round 5: 0.10, Round 10: 0.20, Round 15: 0.30
    const fatigue = roundNum * 0.02;
    let primary = 0, secondary = 0;
    if (category === 'pain')        { primary = s.endurance * 0.07; secondary = s.physical * 0.04; }
    else if (category === 'fear')   { primary = s.boldness * 0.07;  secondary = s.endurance * 0.04; }
    else if (category === 'gross')  { primary = s.boldness * 0.07;  secondary = s.physical * 0.04; }
    else if (category === 'humiliation') { primary = s.boldness * 0.07; secondary = (10 - s.social) * 0.04; }
    const score = primary + secondary - fatigue + (Math.random() * 0.25 - 0.05);
    // Dominant is rare — only truly exceptional performances (stat 9+ or lucky roll)
    // Stat 9/7: ~0.83+variance → dominates sometimes. Stat 7/5: ~0.69 → almost never dominates.
    // Pass is the normal success. Fail = couldn't handle it.
    // Dominant threshold scales down with fatigue so picks can happen mid/late game too
    // Round 1: 0.74, Round 5: 0.70, Round 10: 0.65, Round 15: 0.60
    const dominantThreshold = Math.max(0.58, 0.75 - roundNum * 0.01);
    if (score >= dominantThreshold) return 'dominant';
    if (score >= 0.45) return 'pass';
    return 'fail';
  };

  // ── Reaction text ──
  const _surviveReaction = (player, result, dareTitle) => {
    const pr = pronouns(player);
    const arch = players.find(p => p.name === player)?.archetype || '';
    if (result === 'dominant') {
      const r = [
        `${player} didn't flinch. Didn't blink. Looked at the host and said "next."`,
        `${player} took it like it was nothing. The tribe is watching. ${pr.Sub} ${pr.sub === 'they' ? 'know' : 'knows'} they're watching.`,
        `${player} finished ${dareTitle} with a smirk. That wasn't a challenge. That was a warm-up.`,
        `${player} looked bored. Actually bored. The host had to check if ${dareTitle} was working properly.`,
        `${player} stared straight ahead the entire time. Ten seconds. Not a sound. Not a flinch. Nothing.`,
        `${player} breathed through it like ${pr.sub} ${pr.sub === 'they' ? 'were' : 'was'} meditating. The dungeon has a new favourite.`,
      ];
      if (arch === 'villain' || arch === 'mastermind') r.push(`${player} smiled through the pain. That's the scary part.`, `${player} made eye contact with the rest of the tribe during ${dareTitle}. A message. Received.`);
      if (arch === 'hero') r.push(`${player} gritted ${pr.pos} teeth and powered through. Not a sound. The tribe respects that.`, `${player} took ${dareTitle} like a warrior. The dungeon couldn't break what the game already tested.`);
      if (arch === 'chaos-agent') r.push(`${player} laughed through ${dareTitle}. Actually laughed. The tribe doesn't know what to do with that.`, `${player} started humming during ${dareTitle}. Nobody knows if that's bravery or insanity.`);
      if (arch === 'underdog' || arch === 'floater') r.push(`Nobody expected ${player} to take that. ${pr.Sub} did. The tribe is recalibrating.`);
      return _rp(r);
    }
    return _rp([
      `Teeth clenched. Eyes shut. Ten seconds never felt so long. But ${player} made it.`,
      `${player} was shaking by the end. But ${pr.sub} made it. Barely.`,
      `${player} survived ${dareTitle}. Not gracefully. But survival doesn't need to be graceful.`,
      `${player} hung on. The timer hit ten. ${pr.Sub} let out a breath ${pr.sub} didn't know ${pr.sub} ${pr.sub === 'they' ? 'were' : 'was'} holding.`,
      `${player} gripped the edges of the torture station until ${pr.pos} knuckles went white. The timer hit zero. ${pr.Sub} let go.`,
      `${player}'s whole body was rigid. The countdown finished. ${pr.Sub} survived, but it cost something.`,
      `${player} made a sound ${pr.sub} probably didn't mean to make. But ${pr.sub} made it through. That's what counts.`,
      `${player} didn't quit. Not because it was easy — because ${pr.sub} refused to give anyone the satisfaction of watching ${pr.obj} break.`,
    ]);
  };

  const _failReaction = (player, dareTitle) => {
    const pr = pronouns(player);
    return _rp([
      `${player} tapped out at 8 seconds. So close. Not close enough.`,
      `${player} said uncle before the timer hit 5. The body quit before the brain did.`,
      `${player} tried. You could see ${pr.obj} trying. But ${dareTitle} was too much.`,
      `${player} couldn't last. ${pr.Sub} ${pr.sub === 'they' ? 'step' : 'steps'} down. The pillory awaits.`,
      `${player} lasted 3 seconds. ${pr.Sub} ${pr.sub === 'they' ? 'look' : 'looks'} at the ground. "I can't."`,
      `${player} screamed. Not the dramatic kind — the involuntary kind. ${dareTitle} won.`,
      `${player} yanked free of the restraints before the host could finish counting. Some dares find your limit fast.`,
      `"Uncle. Uncle. UNCLE." ${player} said it three times before anyone could stop the machine. ${pr.Sub} ${pr.sub === 'they' ? 'are' : 'is'} done.`,
    ]);
  };

  const _pickReaction = (picker, victim, confident) => {
    const pr = pronouns(picker);
    if (confident) return _rp([
      `${picker} points at ${victim}. "Your turn." No hesitation.`,
      `${picker} picks ${victim} without blinking. ${pr.Sub} ${pr.sub === 'they' ? 'know' : 'knows'} ${victim}'s weakness.`,
      `"${victim}." ${picker} says the name like ${pr.sub} ${pr.sub === 'they' ? 'have' : 'has'} been waiting to say it.`,
      `${picker} walks straight to the wheel, spins it, then turns and points at ${victim}. Calculated.`,
      `${picker} doesn't even look at anyone else. "Get ${victim} in the chair."`,
    ]);
    return _rp([
      `${picker} picks ${victim}. Bold move. Could backfire.`,
      `${picker} hesitates, then points at ${victim}. Not the safest choice.`,
      `"${victim}." ${picker} doesn't sound sure. The tribe notices.`,
      `${picker} looks around the dungeon. Weighs it. Points at ${victim}. The tribe holds its breath.`,
      `${picker} closes ${pr.pos} eyes for a second before saying the name. "${victim}." ${pr.Sub} ${pr.sub === 'they' ? 'know' : 'knows'} what's at stake.`,
    ]);
  };

  const _backfireReaction = (picker, victim) => _rp([
    `The look on ${picker}'s face when ${victim} doesn't flinch. That backfire is going to sting longer than the dare.`,
    `${victim} walks out untouched. ${picker} walks to the pillory. The tribe saw everything.`,
    `${picker} picked wrong. ${victim} took it like nothing. Now ${picker}'s out. That's the game.`,
    `${picker} gambled on ${victim} breaking. ${victim} didn't. The dungeon has a new prisoner — and it's ${picker}.`,
    `The pillory opens for ${picker}. ${victim} doesn't even look back. The power move became a self-elimination.`,
    `${picker} watches ${victim} step down from the torture station untouched. ${picker} knows what's coming. The walk to the pillory is the longest walk in the dungeon.`,
  ]);

  const _calledItReaction = (picker, victim) => _rp([
    `${picker} called it. ${victim} couldn't handle it. The read was right.`,
    `${victim} breaks. ${picker} was counting on that. Smart play.`,
    `${picker} knew. Everybody watching knew. ${victim} wasn't built for that one.`,
    `${picker} doesn't celebrate. Just nods. The dungeon rewards those who read people.`,
    `${victim} goes to the pillory. ${picker} watches with the expression of someone who did their homework.`,
    `The dungeon claimed another. ${picker} pointed, the wheel turned, and ${victim} folded. Exactly as planned.`,
  ]);

  // ── Host commentary ──
  const _hostPhaseIntro = (phase) => {
    if (phase === 1) return _rp([
      `"Welcome to the Dungeon of Misfortune. The wheel decides your fate. Survive ten seconds — or say uncle."`,
      `"This is the Wheel of Misfortune. Pain, fear, disgust, humiliation — the wheel picks. You endure. Last one standing wins immunity."`,
      `"Step into the dungeon. The wheel is spinning. Your only job? Don't break."`,
    ]);
    if (phase === 2) return _rp([
      `"You survived the wheel. Now it gets personal. Dominate your dare — you pick who suffers next."`,
      `"Phase two. The Gauntlet. The wheel still turns, but now the players choose who faces it."`,
      `"The dungeon is thinning the herd. But now the herd gets to fight back."`,
    ]);
    if (phase === 3) return _rp([
      `"Three remain. The dares don't get easier. The wheel doesn't care about your endurance."`,
      `"The Rack. The final stage before the final sentence. Every dare could be your last."`,
      `"Look at the pillory. That's where everyone else ended up. Only a few are still standing."`,
    ]);
    return _rp([
      `"Two left. One dare. One winner. This is the Final Sentence."`,
      `"The dungeon comes down to this. One dare between immunity and the pillory."`,
      `"Two players. One torture. The Wheel of Misfortune decides who leaves the dungeon standing."`,
    ]);
  };

  const _hostWheelSpin = (category) => {
    const catName = { pain:'PAIN', fear:'FEAR', gross:'GROSS', humiliation:'HUMILIATION' }[category] || category.toUpperCase();
    return _rp([
      `The wheel turns... slows... clicks past one category after another... and lands on ${catName}.`,
      `The Wheel of Misfortune spins. The colours blur. It stops. ${catName}.`,
      `Spin. Click. Click. Click... ${catName}. The dungeon has spoken.`,
      `The wheel doesn't care about your feelings. It landed on ${catName}.`,
    ]);
  };

  const _hostTransition = (fromPhase) => {
    if (fromPhase === 1) return _rp([
      `"The wheel tested you. Now it's time to test each other. Welcome to the Gauntlet."`,
      `"Phase one is done. Some of you looked comfortable. Some of you didn't. Now we find out who can use that information."`,
      `"The easy part is over. From here on out, the dungeon gets personal."`,
    ]);
    if (fromPhase === 2) return _rp([
      `"Look around. Most of you are in the pillory. The few who remain — this is the Rack."`,
      `"The Gauntlet is done. What's left is the Rack. Harder dares. Higher stakes. Fewer friends."`,
      `"Three left. The dungeon is almost finished with you. Almost."`,
    ]);
    return _rp([
      `"It comes down to two. The dungeon has one more dare. One of you walks out. One of you joins the pillory."`,
      `"Final Sentence. The wheel decides the dare. Fate decides the rest."`,
      `"Two players. One torture station. The last dare of the Dungeon of Misfortune."`,
    ]);
  };

  // ── Spectator reactions from the pillory ──
  const _spectatorReaction = (spectator, activePlayer, result) => {
    const bond = getBond(spectator, activePlayer);
    const prS = pronouns(spectator);
    if (bond >= 3) {
      if (result === 'fail') return _rp([
        `In the pillory, ${spectator} winces. ${prS.Sub} wanted ${activePlayer} to make it.`,
        `${spectator} looks away from the pillory. ${prS.Sub} can't watch ${activePlayer} go down.`,
      ]);
      if (result === 'dominant') return _rp([
        `${spectator} grins from the pillory. That's ${prS.pos} person.`,
        `From the pillory, ${spectator} nods. ${activePlayer} is still in it.`,
      ]);
      return _rp([
        `${spectator} exhales from the pillory. ${activePlayer} survived. For now.`,
        `In the pillory, ${spectator} mouths "come on" as ${activePlayer} hangs on.`,
      ]);
    }
    if (bond <= -3) {
      if (result === 'fail') return _rp([
        `${spectator} smirks from the pillory. ${activePlayer} finally broke.`,
        `From the pillory, ${spectator} doesn't even try to hide the satisfaction.`,
      ]);
      if (result === 'dominant') return _rp([
        `${spectator}'s smirk fades in the pillory. ${activePlayer} isn't going anywhere.`,
        `${spectator} shifts uncomfortably in the pillory. ${activePlayer} just made a statement.`,
      ]);
      return _rp([
        `${spectator} rolls ${prS.posAdj} eyes from the pillory. ${activePlayer} barely made it.`,
        `From the pillory, ${spectator} watches ${activePlayer} survive with visible annoyance.`,
      ]);
    }
    if (result === 'fail') return _rp([
      `${spectator} watches from the pillory as ${activePlayer} taps out.`,
      `From the pillory, ${spectator} just shakes ${prS.posAdj} head.`,
    ]);
    return _rp([
      `${spectator} watches silently from the pillory.`,
      `From the pillory, ${spectator} raises an eyebrow but says nothing.`,
    ]);
  };

  const _showmanceSpectatorReaction = (spectator, activePlayer, result) => {
    const prS = pronouns(spectator);
    if (result === 'fail') return _rp([
      `${spectator} grips the pillory frame. Watching ${activePlayer} break is worse than any dare ${prS.sub} faced.`,
      `${spectator} can't look. ${prS.Sub} turns away in the pillory as ${activePlayer} says uncle.`,
      `"No..." ${spectator} whispers from the pillory. ${activePlayer} is done.`,
    ]);
    if (result === 'dominant') return _rp([
      `${spectator}'s face in the pillory — pure pride. ${activePlayer} didn't just survive. ${activePlayer} dominated.`,
      `From the pillory, ${spectator} beams. That's the person ${prS.sub} chose. Still fighting.`,
    ]);
    return _rp([
      `${spectator} holds ${prS.pos} breath in the pillory the entire ten seconds. ${activePlayer} made it. ${spectator} breathes again.`,
      `From the pillory, ${spectator}'s eyes don't leave ${activePlayer} for a single second of the dare.`,
    ]);
  };

  // ── Victim targeting ──
  const _pickVictim = (picker) => {
    const candidates = remaining.filter(p => p !== picker);
    if (!candidates.length) return null;
    const partners = new Set();
    (gs.namedAlliances || []).filter(a => a.active && a.members.includes(picker))
      .forEach(a => a.members.forEach(m => { if (m !== picker) partners.add(m); }));
    return wRandom(candidates, c => {
      const bond = getBond(picker, c);
      const heat = computeHeat(c, remaining, gs.namedAlliances || []);
      const s = pStats(c);
      const weakScore = ((10 - s.physical) * 0.1) + ((10 - s.endurance) * 0.1) + ((10 - s.boldness) * 0.1);
      const chalRec = gs.chalRecord?.[c];
      const chalWeak = chalRec ? chalRec.bombs * 0.15 : 0;
      const isPartner = partners.has(c);
      const partnerPenalty = isPartner ? -5.0 : 0;
      return Math.max(0.1, (-bond * 0.3) + (heat * 0.2) + weakScore + chalWeak + partnerPenalty + Math.random() * 0.2);
    });
  };

  // ── Category pick (target victim's weakest stat) ──
  const _pickCategory = (picker, victim) => {
    const s = pStats(victim);
    const scores = {
      pain: s.endurance * 0.07 + s.physical * 0.04,
      fear: s.boldness * 0.07 + s.endurance * 0.04,
      gross: s.boldness * 0.07 + s.physical * 0.04,
      humiliation: s.boldness * 0.07 + (10 - s.social) * 0.04,
    };
    const pickerStrat = pStats(picker).strategic;
    const weighted = SAY_UNCLE_CATEGORIES.map(cat => ({
      cat, score: scores[cat] + (Math.random() * (1.1 - pickerStrat * 0.1) * 0.3)
    }));
    weighted.sort((a, b) => a.score - b.score);
    return weighted[0].cat;
  };

  // ══════════════════════════════════════════════════════════════
  // MAIN ROUND LOOP — THE DUNGEON OF MISFORTUNE
  // ══════════════════════════════════════════════════════════════
  let nextPlayer = null;
  let nextCategory = null;
  let pickedBy = null;
  let _rotation = [...remaining].sort(() => Math.random() - 0.5);

  // Phase tracking
  let currentPhase = 1;
  const startingCount = remaining.length;
  const phase3Threshold = Math.max(3, Math.floor(startingCount * 0.3));
  const phases = [];
  const phaseBreaks = [];
  const pillory = [];
  let phaseStartRound = 1;
  let phaseStartPlayers = [...remaining];
  let phase1RotationComplete = false;
  const phase1Seen = new Set();

  for (let roundNum = 1; roundNum <= maxRounds; roundNum++) {
    if (remaining.length <= 1) break;

    // ── Phase transition checks ──
    const _needsPhaseTransition = (
      (currentPhase === 1 && phase1RotationComplete) ||
      (currentPhase === 2 && remaining.length <= phase3Threshold) ||
      (currentPhase === 3 && remaining.length <= 2)
    );
    if (_needsPhaseTransition) {
      phases.push({
        phase: currentPhase,
        name: ['The Wheel', 'The Gauntlet', 'The Rack', 'The Final Sentence'][currentPhase - 1],
        startRound: phaseStartRound, endRound: roundNum - 1,
        startingPlayers: [...phaseStartPlayers],
        eliminatedInPhase: phaseStartPlayers.filter(p => !remaining.includes(p)),
      });

      // Phase break content
      const _pbSpectatorReactions = [];
      if (pillory.length) {
        const _pbCandidates = pillory.map(p => ({
          name: p.name,
          maxBond: Math.max(...remaining.map(r => Math.abs(getBond(p.name, r)))),
        })).sort((a, b) => b.maxBond - a.maxBond);
        const _pbCount = Math.min(2, _pbCandidates.length);
        for (let _pi = 0; _pi < _pbCount; _pi++) {
          const spec = _pbCandidates[_pi];
          const aboutPlayer = remaining.reduce((best, r) => Math.abs(getBond(spec.name, r)) > Math.abs(getBond(spec.name, best)) ? r : best, remaining[0]);
          _pbSpectatorReactions.push({
            spectator: spec.name, about: aboutPlayer,
            text: _spectatorReaction(spec.name, aboutPlayer, 'pass'),
          });
        }
      }

      let _pbShowmanceMoment = null;
      if (currentPhase >= 2) {
        const _pbActiveShowmances = (gs.showmances || []).filter(sh =>
          sh.phase !== 'broken-up' && sh.players.some(p => remaining.includes(p)) && sh.players.some(p => pillory.some(pi => pi.name === p))
        );
        if (_pbActiveShowmances.length) {
          const sh = _pbActiveShowmances[0];
          const inPillory = sh.players.find(p => pillory.some(pi => pi.name === p));
          const stillIn = sh.players.find(p => remaining.includes(p));
          if (inPillory && stillIn) {
            const prP = pronouns(inPillory);
            _pbShowmanceMoment = {
              players: [inPillory, stillIn],
              text: _rp([
                `Between rounds, ${inPillory} catches ${stillIn}'s eye from the pillory. No words. Just a look that says everything.`,
                `${inPillory} can't help ${stillIn} from the pillory. But ${prP.sub} can watch. And ${prP.sub} ${prP.sub === 'they' ? 'haven\'t' : 'hasn\'t'} looked away once.`,
                `${stillIn} glances at ${inPillory} in the pillory before the next dare. A tiny nod. Keep going.`,
              ]),
            };
          }
        }

        // Romance spark check
        if (remaining.length >= 2) {
          for (let _si = 0; _si < remaining.length && !_pbShowmanceMoment; _si++) {
            for (let _sj = _si + 1; _sj < remaining.length; _sj++) {
              if (_challengeRomanceSpark(remaining[_si], remaining[_sj], ep, 'sayUnclePhase' + currentPhase, phases, ep.chalMemberScores || {}, 'dungeon endurance')) {
                break;
              }
            }
          }
        }
      }

      phaseBreaks.push({
        afterPhase: currentPhase,
        hostLine: _hostTransition(currentPhase),
        spectatorReactions: _pbSpectatorReactions,
        showmanceMoment: _pbShowmanceMoment,
      });

      currentPhase++;
      phaseStartRound = roundNum;
      phaseStartPlayers = [...remaining];
    }

    // ── Final two ──
    if (remaining.length === 2) {
      const finalist = nextPlayer || _rp(remaining);
      const other = remaining.find(p => p !== finalist);
      const category = nextCategory || _rp(SAY_UNCLE_CATEGORIES);
      const dareObj = _rp(SAY_UNCLE_POOL[category]);
      const result = _survivalRoll(finalist, category, roundNum);

      const round = {
        roundNum, player: finalist, pickedBy, pickerCategory: nextCategory,
        dareCategory: category, dareTitle: dareObj.title, dareText: dareObj.desc,
        result, isFinal: true, phase: currentPhase, hostLine: _hostWheelSpin(category),
        reaction: result !== 'fail' ? _surviveReaction(finalist, result, dareObj.title) : _failReaction(finalist, dareObj.title),
        backfire: null, calledIt: null, pick: null,
        spectatorReactions: pillory.slice(0, 2).map(p => {
          const isShowmance = (gs.showmances || []).some(sh => sh.phase !== 'broken-up' && sh.players.includes(p.name) && sh.players.includes(finalist));
          return { spectator: p.name, about: finalist, text: isShowmance ? _showmanceSpectatorReaction(p.name, finalist, result) : _spectatorReaction(p.name, finalist, result) };
        }),
      };

      if (result !== 'fail') {
        immunityWinner = finalist;
        eliminated.push(other);
        pillory.push({ name: other, eliminatedInPhase: currentPhase, eliminatedInRound: roundNum, wasBackfire: false });
        if (pickedBy && pickedBy !== finalist) {
          round.backfire = { picker: pickedBy, reaction: _backfireReaction(pickedBy, finalist) };
        }
      } else {
        immunityWinner = other;
        eliminated.push(finalist);
        pillory.push({ name: finalist, eliminatedInPhase: currentPhase, eliminatedInRound: roundNum, wasBackfire: false });
        if (pickedBy) {
          round.calledIt = { picker: pickedBy, reaction: _calledItReaction(pickedBy, finalist) };
        }
      }
      rounds.push(round);
      break;
    }

    // Select player — rotation ensures everyone gets a turn (picked victims count as a turn)
    let player;
    if (nextPlayer) {
      player = nextPlayer;
      // Remove from rotation — being picked counts as their turn
      const _pickIdx = _rotation.indexOf(player);
      if (_pickIdx !== -1) _rotation.splice(_pickIdx, 1);
    } else {
      // Clean rotation of eliminated players and reset if exhausted
      _rotation = _rotation.filter(p => remaining.includes(p));
      if (!_rotation.length) { _rotation = [...remaining].sort(() => Math.random() - 0.5); }
      player = _rotation.shift();
    }
    const category = nextCategory || _rp(SAY_UNCLE_CATEGORIES);
    const dareObj = _rp(SAY_UNCLE_POOL[category]);

    const _pickedBy = pickedBy;
    nextPlayer = null;
    nextCategory = null;
    pickedBy = null;

    const result = _survivalRoll(player, category, roundNum);

    const _roundSpectators = currentPhase >= 3 ? pillory.slice(0, 2).map(p => {
      const isShowmance = (gs.showmances || []).some(sh => sh.phase !== 'broken-up' && sh.players.includes(p.name) && sh.players.includes(player));
      return { spectator: p.name, about: player, text: isShowmance ? _showmanceSpectatorReaction(p.name, player, result) : _spectatorReaction(p.name, player, result) };
    }) : [];

    const round = {
      roundNum, player, pickedBy: _pickedBy, pickerCategory: _pickedBy ? category : null,
      dareCategory: category, dareTitle: dareObj.title, dareText: dareObj.desc,
      result, isFinal: false, phase: currentPhase, hostLine: _hostWheelSpin(category),
      reaction: result !== 'fail' ? _surviveReaction(player, result, dareObj.title) : _failReaction(player, dareObj.title),
      backfire: null, calledIt: null, pick: null,
      spectatorReactions: _roundSpectators,
    };

    if (result === 'fail') {
      remaining.splice(remaining.indexOf(player), 1);
      eliminated.push(player);
      pillory.push({ name: player, eliminatedInPhase: currentPhase, eliminatedInRound: roundNum, wasBackfire: false });
      if (_pickedBy) {
        round.calledIt = { picker: _pickedBy, reaction: _calledItReaction(_pickedBy, player) };
        addBond(player, _pickedBy, -0.2);
      }
    } else if (result === 'dominant') {
      if (_pickedBy) {
        // Picked victim dominated — backfire on picker, but NO pick power (only random-turn players pick)
        round.backfire = { picker: _pickedBy, reaction: _backfireReaction(_pickedBy, player) };
        backfires.push({ picker: _pickedBy, victim: player, round: roundNum });
        remaining.splice(remaining.indexOf(_pickedBy), 1);
        eliminated.push(_pickedBy);
        pillory.push({ name: _pickedBy, eliminatedInPhase: currentPhase, eliminatedInRound: roundNum, wasBackfire: true });
        addBond(_pickedBy, player, -0.3);
        addBond(player, _pickedBy, 0.3);
        // Next player is random — victim doesn't get pick power
      } else {
        // Random-turn player dominated — THEY get pick power
        const victim = _pickVictim(player);
        if (victim) {
          const victimCategory = _pickCategory(player, victim);
          const victimStats = pStats(victim);
          const isConfident = victimStats.physical <= 5 || victimStats.endurance <= 5 || victimStats.boldness <= 5;
          round.pick = {
            victim, category: victimCategory,
            reaction: _pickReaction(player, victim, isConfident),
            categoryReason: `${player} targets ${victim}'s weakness: ${victimCategory}.`,
          };
          nextPlayer = victim;
          nextCategory = victimCategory;
          pickedBy = player;
        }
      }
    } else {
      // Normal pass — survived but didn't dominate. No pick power.
      if (_pickedBy) {
        // Backfire: picker is out (their victim survived)
        round.backfire = { picker: _pickedBy, reaction: _backfireReaction(_pickedBy, player) };
        backfires.push({ picker: _pickedBy, victim: player, round: roundNum });
        remaining.splice(remaining.indexOf(_pickedBy), 1);
        eliminated.push(_pickedBy);
        pillory.push({ name: _pickedBy, eliminatedInPhase: currentPhase, eliminatedInRound: roundNum, wasBackfire: true });
        addBond(_pickedBy, player, -0.3);
        addBond(player, _pickedBy, 0.3);
        // No pick power — next player is random
      }
    }

    rounds.push(round);

    // Phase 1 rotation tracking
    if (currentPhase === 1) {
      phase1Seen.add(player);
      if (phase1Seen.size >= startingCount || remaining.every(p => phase1Seen.has(p))) {
        phase1RotationComplete = true;
      }
    }
  }

  if (!immunityWinner && remaining.length) {
    immunityWinner = remaining[0];
  }

  // Record final phase
  phases.push({
    phase: currentPhase,
    name: ['The Wheel', 'The Gauntlet', 'The Rack', 'The Final Sentence'][currentPhase - 1],
    startRound: phaseStartRound, endRound: rounds.length,
    startingPlayers: [...phaseStartPlayers],
    eliminatedInPhase: phaseStartPlayers.filter(p => !remaining.includes(p) && p !== immunityWinner),
  });

  const placements = [immunityWinner, ...eliminated.reverse()].filter(Boolean);

  // Set results on ep
  ep.sayUncle = {
    rounds, placements, backfires,
    eliminated: [...eliminated].reverse(),
    immunityWinner,
    playerCount: activePlayers.length,
    phases, phaseBreaks, pillory,
  };

  ep.immunityWinner = immunityWinner;
  ep.challengeType = 'individual';
  ep.challengeLabel = 'Say Uncle';
  ep.challengeCategory = 'endurance';
  ep.challengeDesc = 'Torture endurance challenge — last one standing wins immunity.';
  ep.chalPlacements = placements;
  ep.chalMemberScores = {};
  placements.forEach((name, i) => { ep.chalMemberScores[name] = placements.length - i; });

  // Camp events
  const campKey = gs.mergeName || 'merge';
  if (!ep.campEvents) ep.campEvents = {};
  if (!ep.campEvents[campKey]) ep.campEvents[campKey] = { pre: [], post: [] };

  if (immunityWinner) {
    ep.campEvents[campKey].post.push({
      type: 'sayUncleWinner', players: [immunityWinner],
      text: `${immunityWinner} walked out of the Dungeon of Misfortune standing. Everyone else is in the pillory. That's immunity.`,
      badgeText: 'LAST ONE STANDING', badgeClass: 'gold'
    });
    if (!gs.popularity) gs.popularity = {};
    gs.popularity[immunityWinner] = (gs.popularity[immunityWinner] || 0) + 2; // last one standing in the dungeon = legend
  }

  // First player into the pillory loses a bit of shine
  if (pillory.length > 0) {
    const firstPillory = pillory[0];
    if (!gs.popularity) gs.popularity = {};
    gs.popularity[firstPillory.name] = (gs.popularity[firstPillory.name] || 0) - 1; // first out of the dungeon = soft target
  }

  backfires.forEach(bf => {
    ep.campEvents[campKey].post.push({
      type: 'sayUncleBackfire', players: [bf.picker, bf.victim],
      text: `${bf.picker} picked ${bf.victim} in the dungeon — and it backfired. ${bf.victim} passed. ${bf.picker} walked to the pillory.`,
      badgeText: 'BACKFIRE', badgeClass: 'red'
    });
    // Victim survived the pick = respect earned
    if (!gs.popularity) gs.popularity = {};
    gs.popularity[bf.victim] = (gs.popularity[bf.victim] || 0) + 1; // survived a dominator pick = crowd moment
  });

  rounds.filter(r => r.result === 'dominant' && !r.isFinal).forEach(r => {
    ep.campEvents[campKey].post.push({
      type: 'sayUncleDominated', players: [r.player],
      text: `${r.player} dominated ${r.dareTitle} in the Dungeon of Misfortune. Didn't flinch.`,
      badgeText: 'DIDN\'T FLINCH', badgeClass: 'gold'
    });
  });

  updateChalRecord(ep);
}

export function _textSayUncle(ep, ln, sec) {
  const su = ep.sayUncle;
  if (!su) return;
  sec('THE DUNGEON OF MISFORTUNE');
  ln(`${su.playerCount} players. ${su.phases?.length || '?'} phases. ${su.rounds.length} rounds. Torture endurance.`);
  ln('');

  let lastPhase = 0;
  su.rounds.forEach(round => {
    if (round.phase && round.phase !== lastPhase) {
      if (round.phase > 1) {
        const pb = su.phaseBreaks?.find(b => b.afterPhase === round.phase - 1);
        if (pb) {
          ln('');
          if (pb.hostLine) ln(`Host: ${pb.hostLine}`);
          if (pb.spectatorReactions?.length) {
            pb.spectatorReactions.forEach(sr => ln(`  [Pillory] ${sr.text}`));
          }
          if (pb.showmanceMoment) ln(`  [Moment] ${pb.showmanceMoment.text}`);
        }
      }
      const phaseName = ['THE WHEEL', 'THE GAUNTLET', 'THE RACK', 'THE FINAL SENTENCE'][round.phase - 1] || 'PHASE ' + round.phase;
      ln('');
      ln(`=== ${phaseName} ===`);
      lastPhase = round.phase;
    }

    const picked = round.pickedBy ? ` [PICKED BY ${round.pickedBy}]` : '';
    ln(`Round ${round.roundNum}: ${round.player}${picked} — [${round.dareCategory.toUpperCase()}] ${round.dareTitle}`);
    if (round.hostLine) ln(`  Host: "${round.hostLine}"`);
    ln(`  Result: ${round.result.toUpperCase()}`);
    if (round.reaction) ln(`  ${round.reaction}`);
    if (round.spectatorReactions?.length) {
      round.spectatorReactions.forEach(sr => ln(`  [Pillory] ${sr.text}`));
    }
    if (round.backfire) ln(`  BACKFIRE: ${round.backfire.picker} goes to the pillory`);
    if (round.calledIt) ln(`  CALLED IT: ${round.calledIt.picker} was right`);
    if (round.pick) ln(`  PICKS: ${round.pick.victim} (${round.pick.category})`);
  });
  ln('');
  if (su.backfires.length) {
    ln('BACKFIRES:');
    su.backfires.forEach(bf => ln(`- Round ${bf.round}: ${bf.picker} picked ${bf.victim} — backfired`));
    ln('');
  }
  ln('THE PILLORY (elimination order):');
  su.placements.forEach((name, i) => {
    const pilloryEntry = su.pillory?.find(p => p.name === name);
    const phase = pilloryEntry ? ['Wheel', 'Gauntlet', 'Rack', 'Final'][pilloryEntry.eliminatedInPhase - 1] || '' : '';
    ln(`  ${i + 1}. ${name}${i === 0 ? ' (IMMUNITY)' : ''}${phase ? ' [' + phase + ']' : ''}`);
  });
}

function _rp_hostPhaseIntro(phase) {
  const _rp = arr => arr[Math.floor(Math.random() * arr.length)];
  if (phase === 1) return _rp([
    `Welcome to the Dungeon of Misfortune. The wheel decides your fate. Survive ten seconds — or say uncle.`,
    `This is the Wheel of Misfortune. Pain, fear, disgust, humiliation — the wheel picks. You endure. Last one standing wins immunity.`,
    `Step into the dungeon. The wheel is spinning. Your only job? Don't break.`,
  ]);
  if (phase === 2) return _rp([
    `You survived the wheel. Now it gets personal. Dominate your dare — you pick who suffers next.`,
    `Phase two. The Gauntlet. The wheel still turns, but now the players choose who faces it.`,
    `The dungeon is thinning the herd. But now the herd gets to fight back.`,
  ]);
  if (phase === 3) return _rp([
    `Three remain. The dares don't get easier. The wheel doesn't care about your endurance.`,
    `The Rack. The final stage before the final sentence. Every dare could be your last.`,
    `Look at the pillory. That's where everyone else ended up. Only a few are still standing.`,
  ]);
  return _rp([
    `Two left. One dare. One winner. This is the Final Sentence.`,
    `The dungeon comes down to this. One dare between immunity and the pillory.`,
    `Two players. One torture. The Wheel of Misfortune decides who leaves the dungeon standing.`,
  ]);
}

export function rpBuildSayUncleAnnouncement(ep) {
  const su = ep.sayUncle;
  if (!su) return '';
  const prevEp = (gs.episodeHistory || []).filter(h => h.num < ep.num).slice(-1)[0];
  const prevSnap = prevEp?.gsSnapshot || {};
  const snap = ep.gsSnapshot || {};
  const _tm = ep.tribesAtStart?.flatMap(t => t.members);
  const activePlayers = (_tm?.length ? _tm : null) || prevSnap.activePlayers || snap.activePlayers || [];

  const _hostQuotes = [
    `Welcome to the Dungeon of Misfortune. The wheel decides your fate. Survive ten seconds — or say uncle. Last one standing gets immunity. But dominate your dare, and you become the executioner. Choose your next victim wisely — because if they survive, YOU go to the pillory.`,
    `This is the Wheel of Misfortune. Four categories. Four flavours of suffering. Pain. Fear. Disgust. Humiliation. The wheel picks your poison. Your job is to endure it. Ten seconds. That's all. But ten seconds in this dungeon can feel like a lifetime.`,
    `The dungeon doesn't care about your alliances. Doesn't care about your strategy. In here, it's just you and the wheel. Survive, and you move on. Dominate, and you get to pick who goes next. But pick wrong — and the dungeon swallows you instead.`,
  ];
  const _hostQuote = _hostQuotes[Math.floor(Math.abs((ep.num || 1) * 23) % _hostQuotes.length)];

  const _wheelSvg = `<div class="su-wheel-spin" style="position:relative;width:120px;height:120px;margin:0 auto 16px">
    <svg viewBox="0 0 120 120" style="width:100%;height:100%;filter:drop-shadow(0 0 12px rgba(232,160,53,0.3))">
      <circle cx="60" cy="60" r="56" fill="none" stroke="#e8a035" stroke-width="2"/>
      <path d="M60,4 A56,56 0 0,1 116,60 L60,60 Z" fill="rgba(218,54,51,0.25)" stroke="#da3633" stroke-width="1"/>
      <path d="M116,60 A56,56 0 0,1 60,116 L60,60 Z" fill="rgba(137,87,229,0.25)" stroke="#8957e5" stroke-width="1"/>
      <path d="M60,116 A56,56 0 0,1 4,60 L60,60 Z" fill="rgba(63,185,80,0.25)" stroke="#3fb950" stroke-width="1"/>
      <path d="M4,60 A56,56 0 0,1 60,4 L60,60 Z" fill="rgba(219,97,162,0.25)" stroke="#db61a2" stroke-width="1"/>
      <circle cx="60" cy="60" r="8" fill="#e8a035"/>
    </svg>
    <div style="position:absolute;top:15px;right:18px;font-size:8px;font-weight:700;color:#da3633">PAIN</div>
    <div style="position:absolute;bottom:15px;right:18px;font-size:8px;font-weight:700;color:#8957e5">FEAR</div>
    <div style="position:absolute;bottom:15px;left:18px;font-size:8px;font-weight:700;color:#3fb950">GROSS</div>
    <div style="position:absolute;top:15px;left:12px;font-size:8px;font-weight:700;color:#db61a2">HUMIL.</div>
  </div>`;

  // Floating embers
  const _embers = Array.from({length: 6}, (_, i) => `<div class="su-ember" style="left:${10 + i * 15}%;bottom:${5 + (i % 3) * 10}%;animation-delay:${i * 0.4}s;animation-duration:${2 + (i % 3) * 0.8}s"></div>`).join('');

  let html = `<div class="rp-page su-dungeon">
    ${_embers}
    <div style="font-family:var(--font-display);font-size:28px;letter-spacing:4px;text-align:center;color:#e8a035;text-shadow:0 0 20px rgba(232,160,53,0.4),0 0 40px rgba(232,160,53,0.15);margin-bottom:2px;animation:scrollDrop 0.5s var(--ease-broadcast) both">THE DUNGEON OF MISFORTUNE</div>
    <div style="font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:#8b6914;text-align:center;margin-bottom:20px">Torture Endurance Challenge</div>
    ${_wheelSvg}
    <div style="font-size:12px;color:#cdd6f4;text-align:center;margin-bottom:24px;line-height:1.7;max-width:460px;margin-left:auto;margin-right:auto;font-style:italic;border-left:3px solid #e8a035;padding-left:16px;text-align:left">"${_hostQuote}"</div>
    <div style="display:flex;flex-wrap:wrap;gap:12px;justify-content:center;margin-bottom:24px;max-width:520px;margin-left:auto;margin-right:auto">
      <div style="flex:1;min-width:200px;background:rgba(232,160,53,0.06);border:1px solid rgba(232,160,53,0.15);border-radius:8px;padding:14px;text-align:left">
        <div style="font-size:9px;font-weight:700;letter-spacing:2px;color:#e8a035;margin-bottom:10px">THE RULES OF THE DUNGEON</div>
        <div style="font-size:11px;color:#8b949e;line-height:1.7">
          <div style="margin-bottom:4px"><span style="color:#3fb950;font-weight:700">Survive</span> 10 seconds \u2014 move on</div>
          <div style="margin-bottom:4px"><span style="color:var(--accent-gold);font-weight:700">Dominate</span> \u2014 pick the next victim + category</div>
          <div style="margin-bottom:4px"><span style="color:#da3633;font-weight:700">Victim passes</span> \u2014 YOU go to the pillory</div>
          <div><span style="color:#da3633;font-weight:700">Fail</span> \u2014 straight to the pillory</div>
        </div>
      </div>
      <div style="flex:1;min-width:140px;background:rgba(232,160,53,0.06);border:1px solid rgba(232,160,53,0.15);border-radius:8px;padding:14px;text-align:center">
        <div style="font-size:9px;font-weight:700;letter-spacing:2px;color:#e8a035;margin-bottom:10px">THE STAKES</div>
        <div style="font-size:11px;color:#8b949e;line-height:1.7">
          <div style="margin-bottom:4px">${su.playerCount} players enter</div>
          <div style="margin-bottom:4px">${su.phases?.length || 4} phases</div>
          <div style="margin-bottom:4px">${su.rounds.length} rounds</div>
          <div style="color:var(--accent-gold);font-weight:700">Winner gets immunity</div>
        </div>
      </div>
    </div>
    <div style="font-size:9px;font-weight:700;letter-spacing:2px;color:#8b6914;text-align:center;margin-bottom:10px">ENTERING THE DUNGEON</div>
    <div class="rp-portrait-row" style="justify-content:center">${activePlayers.map(name => rpPortrait(name)).join('')}</div>
  </div>`;
  return html;
}

export function rpBuildSayUncleRounds(ep) {
  const su = ep.sayUncle;
  if (!su || !su.rounds?.length) return '';
  const uid = 'su-' + ep.num;
  const _catColor = { 'pain': '#da3633', 'fear': '#8957e5', 'gross': '#3fb950', 'humiliation': '#db61a2' };
  const _catEmoji = { 'pain': '\uD83D\uDD25', 'fear': '\uD83D\uDC80', 'gross': '\uD83E\uDD22', 'humiliation': '\uD83D\uDE48' };

  const revealItems = [];
  let lastPhase = 0;

  const _renderPillory = (currentPillory) => {
    if (!currentPillory.length) return '';
    return `<div style="margin-top:12px;padding:10px;background:rgba(139,105,20,0.08);border:1px solid rgba(139,105,20,0.2);border-radius:6px">
      <div style="font-size:8px;font-weight:700;letter-spacing:2px;color:#8b6914;margin-bottom:8px;text-align:center">THE PILLORY</div>
      <div style="display:flex;flex-wrap:wrap;gap:10px;justify-content:center">${currentPillory.map((p, _pi) =>
        `<div class="su-pillory-sway" style="display:flex;flex-direction:column;align-items:center;gap:2px;opacity:0.7;animation-delay:${_pi * 0.3}s">
          ${rpPortrait(p.name, 'sm')}
          <div style="font-size:7px;font-weight:700;letter-spacing:0.5px;color:${p.wasBackfire ? '#da3633' : '#8b6914'};text-align:center">${p.wasBackfire ? 'BACKFIRE' : 'OUT'}</div>
        </div>`
      ).join('')}</div>
    </div>`;
  };

  su.rounds.forEach((round, roundIdx) => {
    const catColor = _catColor[round.dareCategory] || '#8b949e';
    const catEmoji = _catEmoji[round.dareCategory] || '\uD83C\uDFB2';
    const isFinal = round.isFinal;
    const roundPhase = round.phase || 1;

    if (roundPhase !== lastPhase) {
      // Phase break card (between phases)
      if (roundPhase > 1) {
        const pb = su.phaseBreaks?.find(b => b.afterPhase === roundPhase - 1);
        if (pb) {
          let pbHtml = `<div style="font-size:12px;color:#cdd6f4;font-style:italic;border-left:3px solid #e8a035;padding-left:12px;margin-bottom:10px;line-height:1.6">${pb.hostLine}</div>`;
          if (pb.spectatorReactions?.length) {
            pb.spectatorReactions.forEach(sr => {
              pbHtml += `<div style="display:flex;align-items:center;gap:6px;margin-bottom:6px">
                <div style="opacity:0.7">${rpPortrait(sr.spectator, 'xs', 'elim')}</div>
                <div style="font-size:11px;color:#8b949e;line-height:1.4">${sr.text}</div>
              </div>`;
            });
          }
          if (pb.showmanceMoment) {
            pbHtml += `<div style="border-top:1px solid rgba(232,160,53,0.15);padding-top:8px;margin-top:8px">
              <div style="font-size:9px;font-weight:700;letter-spacing:1px;color:#db61a2;margin-bottom:4px">\u2764\uFE0F MOMENT</div>
              <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
                ${pb.showmanceMoment.players.map(p => rpPortrait(p, 'xs')).join('')}
              </div>
              <div style="font-size:11px;color:#cdd6f4;line-height:1.5">${pb.showmanceMoment.text}</div>
            </div>`;
          }
          const _pilloryAtBreak = su.pillory?.filter(p => p.eliminatedInPhase < roundPhase) || [];
          if (_pilloryAtBreak.length) pbHtml += _renderPillory(_pilloryAtBreak);
          revealItems.push({ type: 'phase-break', html: `<div style="background:rgba(232,160,53,0.04);border:1px solid rgba(232,160,53,0.12);border-radius:8px;padding:14px;margin-bottom:12px">${pbHtml}</div>` });
        }
      }

      // Phase intro card
      const phaseName = ['The Wheel', 'The Gauntlet', 'The Rack', 'The Final Sentence'][roundPhase - 1] || 'Phase ' + roundPhase;
      const phaseData = su.phases?.find(p => p.phase === roundPhase);
      const phasePlayerCount = phaseData?.startingPlayers?.length || '?';
      let phaseHtml = `<div style="text-align:center;margin-bottom:8px">
        <div style="font-family:var(--font-display);font-size:18px;letter-spacing:3px;color:#e8a035;text-shadow:0 0 12px rgba(232,160,53,0.3)">${phaseName.toUpperCase()}</div>
        <div style="font-size:10px;color:#8b6914;margin-top:4px">${phasePlayerCount} players remaining</div>
      </div>`;
      if (roundPhase === 1) {
        phaseHtml += `<div style="font-size:12px;color:#cdd6f4;font-style:italic;border-left:3px solid #e8a035;padding-left:12px;margin-top:8px;line-height:1.6">"${_rp_hostPhaseIntro(roundPhase)}"</div>`;
      }
      revealItems.push({ type: 'phase-header', html: `<div class="su-phase-wipe" style="background:rgba(232,160,53,0.06);border:1px solid rgba(232,160,53,0.15);border-radius:8px;padding:14px;margin-bottom:12px">${phaseHtml}</div>` });
      lastPhase = roundPhase;
    }

    // Final Two announcement
    if (isFinal) {
      const _f2 = su.placements.slice(0, 2);
      revealItems.push({ type: 'final-two', html: `<div style="background:rgba(232,160,53,0.08);border:1px solid rgba(232,160,53,0.2);border-radius:8px;padding:16px;margin-bottom:12px;text-align:center">
        <div style="font-family:var(--font-display);font-size:14px;letter-spacing:2px;color:#e8a035;margin-bottom:12px">THE FINAL SENTENCE</div>
        <div class="rp-portrait-row" style="justify-content:center;gap:20px;margin-bottom:8px">
          ${_f2.map(name => rpPortrait(name)).join('<span style="font-size:20px;color:#e8a035;align-self:center">VS</span>')}
        </div>
        <div style="font-size:11px;color:#8b949e">One more dare. One walks free. One joins the pillory.</div>
      </div>` });
    }

    // Round card
    let rh = '';
    rh += `<div style="font-size:10px;font-weight:700;color:#8b6914;font-family:var(--font-mono);margin-bottom:6px">${isFinal ? 'FINAL DARE' : 'ROUND ' + round.roundNum}</div>`;
    if (round.pickedBy) {
      rh += `<div style="font-size:11px;font-weight:700;color:#da3633;letter-spacing:0.5px;margin-bottom:6px">\uD83C\uDFAF PICKED BY ${round.pickedBy.toUpperCase()}</div>`;
    }
    if (round.hostLine) {
      rh += `<div style="font-size:11px;color:#8b949e;font-style:italic;margin-bottom:8px;line-height:1.5">${round.hostLine}</div>`;
    }
    rh += `<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
      ${rpPortrait(round.player, 'sm')}
      <div style="font-size:12px;color:#cdd6f4">${round.player} faces the Wheel of Misfortune\u2026</div>
    </div>
    <div style="background:${catColor}0a;border-left:3px solid ${catColor};padding:8px 12px;margin-bottom:12px;border-radius:0 6px 6px 0">
      <div style="font-size:10px;font-weight:700;letter-spacing:1px;color:${catColor};margin-bottom:4px">${catEmoji} ${round.dareCategory.toUpperCase()}</div>
      <div style="font-size:14px;font-weight:700;color:#cdd6f4;margin-bottom:4px">${round.dareTitle}</div>
      <div style="font-size:12px;color:#8b949e;line-height:1.5">${round.dareText}</div>
    </div>`;

    if (round.result === 'dominant') {
      rh += `<div style="font-size:11px;font-weight:700;color:var(--accent-gold);letter-spacing:0.5px;margin-bottom:4px">\u2B50 DOMINATED \u2014 DIDN'T FLINCH</div>`;
    } else if (round.result === 'pass') {
      rh += `<div style="font-size:11px;font-weight:700;color:#3fb950;letter-spacing:0.5px;margin-bottom:4px">\u2705 SURVIVED</div>`;
    } else {
      rh += `<div style="font-size:11px;font-weight:700;color:#da3633;letter-spacing:0.5px;margin-bottom:4px">\u274c SAID UNCLE</div>`;
    }

    if (round.reaction) rh += `<div style="font-size:12px;color:#cdd6f4;line-height:1.5;margin-bottom:8px">${round.reaction}</div>`;

    if (round.spectatorReactions?.length) {
      rh += `<div style="border-top:1px solid rgba(139,105,20,0.2);padding-top:8px;margin-top:8px">
        <div style="font-size:9px;font-weight:700;letter-spacing:1px;color:#8b6914;margin-bottom:6px">FROM THE PILLORY</div>`;
      round.spectatorReactions.forEach(sr => {
        rh += `<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
          <div style="opacity:0.7">${rpPortrait(sr.spectator, 'xs', 'elim')}</div>
          <div style="font-size:11px;color:#8b949e;line-height:1.4">${sr.text}</div>
        </div>`;
      });
      rh += `</div>`;
    }

    if (round.backfire) {
      rh += `<div style="border-top:1px solid rgba(218,54,51,0.2);padding-top:8px;margin-top:8px">
        <div style="font-size:11px;font-weight:700;color:#da3633;letter-spacing:1px;margin-bottom:4px">\uD83D\uDCA5 BACKFIRE</div>
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
          ${rpPortrait(round.backfire.picker, 'sm', 'elim')}
          <div style="font-size:12px;color:#cdd6f4;line-height:1.5">${round.backfire.reaction}</div>
        </div>
      </div>`;
    }

    if (round.calledIt) {
      rh += `<div style="border-top:1px solid rgba(232,160,53,0.15);padding-top:8px;margin-top:8px">
        <div style="font-size:11px;font-weight:700;color:var(--accent-gold);letter-spacing:1px;margin-bottom:4px">\u2705 CALLED IT</div>
        <div style="font-size:12px;color:#8b949e;line-height:1.5">${round.calledIt.reaction}</div>
      </div>`;
    }

    if (round.pick) {
      rh += `<div style="border-top:1px solid rgba(232,160,53,0.15);padding-top:8px;margin-top:8px">
        <div style="font-size:11px;font-weight:700;color:#e8a035;letter-spacing:1px;margin-bottom:4px">\uD83C\uDFAF PICKS NEXT VICTIM</div>
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
          ${rpPortrait(round.player, 'sm')}
          <span style="font-size:14px;color:#e8a035">\u2192</span>
          ${rpPortrait(round.pick.victim, 'sm')}
        </div>
        <div style="font-size:12px;color:#cdd6f4;line-height:1.5;margin-bottom:4px">${round.pick.reaction}</div>
        <div style="font-size:10px;color:#8b949e;font-style:italic">${round.pick.categoryReason}</div>
      </div>`;
    }

    if (isFinal && su.immunityWinner) {
      rh += `<div style="border-top:2px solid var(--accent-gold);padding-top:12px;margin-top:12px;text-align:center">
        <div style="font-family:var(--font-display);font-size:12px;letter-spacing:2px;color:var(--accent-gold);margin-bottom:8px">IMMUNITY WINNER</div>
        ${rpPortrait(su.immunityWinner, 'md')}
        <div style="font-size:14px;font-weight:700;color:#cdd6f4;margin-top:8px">${su.immunityWinner}</div>
        <div style="font-size:11px;color:var(--accent-gold)">Last one standing in the Dungeon of Misfortune</div>
      </div>`;
    }

    const cardBorder = round.result === 'fail' ? 'rgba(218,54,51,0.2)' : round.backfire ? 'rgba(218,54,51,0.2)' : round.result === 'dominant' ? 'rgba(232,160,53,0.2)' : isFinal ? 'rgba(232,160,53,0.2)' : 'rgba(139,105,20,0.1)';
    const cardAnim = round.result === 'fail' ? 'su-card-fail' : round.result === 'dominant' ? 'su-card-dominant' : round.backfire ? 'su-card-backfire' : 'su-card-slam';
    revealItems.push({ type: 'round', html: `<div class="${cardAnim}" style="background:rgba(26,26,46,0.6);border:1px solid ${cardBorder};border-radius:8px;padding:14px;margin-bottom:12px">${rh}</div>` });
  });

  if (su.pillory?.length) {
    revealItems.push({ type: 'pillory-final', html: _renderPillory(su.pillory) });
  }

  const _embers2 = Array.from({length: 5}, (_, i) => `<div class="su-ember" style="left:${8 + i * 18}%;bottom:${3 + (i % 3) * 8}%;animation-delay:${i * 0.5}s;animation-duration:${2.2 + (i % 3) * 0.6}s"></div>`).join('');
  let html = `<div class="rp-page su-dungeon" id="${uid}-page" data-su-revealed="0" data-su-total="${revealItems.length}">
    ${_embers2}
    <div style="font-family:var(--font-display);font-size:22px;letter-spacing:3px;text-align:center;color:#e8a035;text-shadow:0 0 12px rgba(232,160,53,0.3);margin-bottom:4px">THE TORTURE</div>
    <div style="font-size:10px;color:#8b6914;text-align:center;margin-bottom:16px">${su.playerCount} players \u2014 ${su.phases?.length || '?'} phases \u2014 ${su.rounds.length} rounds</div>`;
  revealItems.forEach((item, i) => {
    html += `<div class="${uid}-item" style="display:none" data-idx="${i}">${item.html}</div>`;
  });
  html += `<div style="display:flex;gap:10px;justify-content:center;margin-top:16px;position:sticky;bottom:10px;z-index:5">
    <button class="rp-camp-toggle-btn" style="border-color:#e8a035;color:#e8a035;padding:8px 20px;font-size:12px" onclick="suRevealNext('${uid}')">NEXT \u25B6</button>
    <button class="rp-camp-toggle-btn" style="border-color:#484f58;color:#8b949e;padding:8px 16px;font-size:11px" onclick="suRevealAll('${uid}')">REVEAL ALL</button>
  </div></div>`;
  return html;
}

export function rpBuildSayUncleImmunity(ep) {
  const su = ep.sayUncle;
  if (!su || !su.immunityWinner) return '';
  const winner = su.immunityWinner;
  const p = players.find(x => x.name === winner);
  const arch = p?.archetype || 'player';
  const archLabel = arch.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  let html = `<div class="rp-page su-dungeon" style="text-align:center">
    <div style="font-family:var(--font-display);font-size:12px;letter-spacing:3px;color:#e8a035;margin-bottom:20px;text-shadow:0 0 12px rgba(232,160,53,0.3);animation:scrollDrop 0.5s var(--ease-broadcast) both">IMMUNITY WINNER</div>
    <div style="position:relative;display:inline-block;animation:suGoldBurst 1.5s ease-out 0.3s both">
      ${rpPortrait(winner, 'lg')}
      <div style="position:absolute;inset:-4px;border:2px solid rgba(232,160,53,0.3);border-radius:50%;box-shadow:0 0 20px rgba(232,160,53,0.15);pointer-events:none"></div>
    </div>
    <div style="font-size:18px;font-weight:700;color:#cdd6f4;margin-top:16px;font-family:var(--font-display)">${winner}</div>
    <div style="font-size:11px;color:#8b949e;margin-top:4px">${archLabel}</div>
    <div style="font-size:12px;color:var(--accent-gold);font-weight:700;letter-spacing:2px;margin-top:8px">LAST ONE STANDING</div>
    <div style="font-size:11px;color:#8b6914;margin-top:4px">Survived the Dungeon of Misfortune</div>
    <div style="width:60px;height:1px;background:rgba(232,160,53,0.3);margin:20px auto"></div>
    <div style="font-size:9px;font-weight:700;letter-spacing:2px;color:#8b6914;margin-bottom:12px">PLACEMENT ORDER</div>`;

  su.placements.forEach((name, i) => {
    const isWinner = i === 0;
    const isBackfire = su.backfires.some(bf => bf.picker === name);
    const badge = isWinner ? 'WINNER' : isBackfire ? 'BACKFIRE' : '#' + (i + 1);
    const badgeColor = isWinner ? 'var(--accent-gold)' : isBackfire ? '#da3633' : '#8b6914';
    const pilloryEntry = su.pillory?.find(p => p.name === name);
    const phaseLabel = pilloryEntry ? ['Wheel', 'Gauntlet', 'Rack', 'Final'][pilloryEntry.eliminatedInPhase - 1] || '' : '';
    html += `<div style="display:flex;align-items:center;gap:8px;padding:4px 0;${i > 0 ? 'opacity:0.7' : ''};justify-content:center">
      <span style="font-size:10px;font-weight:700;color:${badgeColor};font-family:var(--font-mono);width:70px;text-align:right;flex-shrink:0">${badge}</span>
      ${rpPortrait(name, 'sm', i > 0 ? 'elim' : '')}
      <span style="font-size:12px;color:#cdd6f4;width:100px;text-align:left">${name}</span>
      ${phaseLabel && i > 0 ? `<span style="font-size:9px;color:#8b6914">${phaseLabel}</span>` : ''}
    </div>`;
  });

  html += `</div>`;
  return html;
}

