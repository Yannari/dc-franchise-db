// js/text-backlog.js - Text backlog generators for non-challenge episode sections
import { gs, seasonConfig, players } from './core.js';
import { pStats, pronouns, challengeWeakness } from './players.js';
import { getBond, bondLabel, bondFeeling } from './bonds.js';
import { buildCrashout, vpGenerateQuote, _riLastWords } from './vp-screens.js';

// Challenge-specific text functions
import { _textCliffDive } from './chal/cliff-dive.js';
import { _textAwakeAThon } from './chal/awake-a-thon.js';
import { _textDodgebrawl } from './chal/dodgebrawl.js';
import { _textTalentShow } from './chal/talent-show.js';
import { _textSuckyOutdoors } from './chal/sucky-outdoors.js';
import { _textUpTheCreek } from './chal/up-the-creek.js';
import { _textPaintballHunt } from './chal/paintball-hunt.js';
import { _textHellsKitchen } from './chal/hells-kitchen.js';
import { _textTrustChallenge } from './chal/trust.js';
import { _textBasicStraining } from './chal/basic-straining.js';
import { _textXtremeTorture } from './chal/x-treme-torture.js';
import { _textPhobiaFactor } from './chal/phobia-factor.js';
import { _textBrunchOfDisgustingness } from './chal/brunch.js';
import { _textLuckyHunt } from './chal/lucky-hunt.js';
import { _textSayUncle } from './chal/say-uncle.js';
import { _textTripleDogDare } from './chal/triple-dog-dare.js';
import { _textSlasherNight } from './chal/slasher-night.js';
import { _textMonsterCash } from './chal/monster-cash.js';
import { _textMineOverMatter } from './chal/mine-over-matter.js';
import { _textMerryGoRoundUp } from './chal/merry-go-round-up.js';
import { _textMazeOfTheFallen } from './chal/maze-of-the-fallen.js';
import { _textDemonsPlainer } from './chal/demons-plainer.js';
import { _textTreasureIsland } from './chal/treasure-island.js';
import { _textOperationClassified } from './chal/operation-classified.js';
import { _textHideAndBeSneaky } from './chal/hide-and-be-sneaky.js';
import { _textOffTheChain } from './chal/off-the-chain.js';
import { _textWawanakwaGoneWild } from './chal/wawanakwa-gone-wild.js';
import { _textTriArmedTriathlon } from './chal/tri-armed-triathlon.js';
import { _textCampCastaways } from './chal/camp-castaways.js';
import { _textBeachBlanketBogus } from './chal/beach-blanket-bogus.js';
import { _textCrazytown } from './chal/crazytown.js';
import { _textChefshank } from './chal/chefshank.js';
import { _textOneFlu } from './chal/one-flu.js';
import { _textMastersOfDisasters } from './chal/masters-of-disasters.js';
import { _textFullMetalDrama } from './chal/full-metal-drama.js';
import { _textOceansHeist } from './chal/oceans-heist.js';
import { _textMillionBucksBC } from './chal/million-bucks-bc.js';
import { _textSportsMarathon } from './chal/sports-marathon.js';
import { _textSuperHerold, rpBuildSuperHeroldTitleCard, rpBuildSuperHeroldCostume, rpBuildSuperHeroldPrizes, rpBuildSuperHeroldRound, rpBuildSuperHeroldBoss } from './chal/super-hero-ld.js';
import { rpBuildHauntedTitleCard, rpBuildHauntedLibrary, rpBuildHauntedKeys, rpBuildHauntedBoss } from './chal/haunted-house.js';
import { rpBuildHungTitleCard, rpBuildHungWarmup, rpBuildHungKnife, rpBuildHungFinal } from './chal/hung-out-to-dry.js';
import { _textPrincessPride, rpBuildPrincessPrideTitleCard, rpBuildPrincessPrideCeremony, rpBuildPrincessPrideForest, rpBuildPrincessPrideBridge, rpBuildPrincessPrideDragon, rpBuildPrincessPrideTower, rpBuildPrincessPrideDuel } from './chal/princess-pride.js';
import { _textGetAClue, rpBuildGetAClueTitleCard, rpBuildGetAClueCollection, rpBuildGetAClueTrain, rpBuildGetAClueTrial, rpBuildGetAClueVerdict } from './chal/get-a-clue.js';
import { _textRockNRule, rpBuildRockNRuleTitleCard, rpBuildRockNRuleGuitar, rpBuildRockNRuleCarpet, rpBuildRockNRuleHotel, rpBuildRockNRuleResults } from './chal/rock-n-rule.js';
import { _textCrouchingCourtney, rpBuildCrouchingCourtneyTitleCard, rpBuildCrouchingCourtneyTraining, rpBuildCrouchingCourtneyFight, rpBuildCrouchingCourtneyClimb } from './chal/crouching-courtney.js';
import { rpBuildHoustonTitleCard, rpBuildHoustonZeroG, rpBuildHoustonRedAlert, rpBuildHoustonReEntry, rpBuildHoustonSprint, rpBuildHoustonWinner } from './chal/houston.js';
import { rpBuildTopDogTitleCard, rpBuildTopDogAssignment, rpBuildTopDogTraining, rpBuildTopDogJudging, rpBuildTopDogForest, rpBuildTopDogWinner } from './chal/top-dog.js';
import { rpBuildEgyptTitleCard, rpBuildEgyptPyramid, rpBuildEgyptDesert, rpBuildEgyptNile, rpBuildEgyptResults } from './chal/walk-like-an-egyptian.js';
import { rpBuildBigBaddTitleCard, rpBuildBigBaddPhase1, rpBuildBigBaddPhase2, rpBuildBigBaddPhase3, rpBuildBigBaddResults } from './chal/bigger-badder-brutaler.js';
import { rpBuildCFTTitleCard, rpBuildCFTPinball, rpBuildCFTDramaBreak, rpBuildCFTCommercial, rpBuildCFTVerdict, rpBuildCFTResults } from './chal/crazy-fun-time.js';
import { rpBuildFCTitleCard, rpBuildFCPhase1, rpBuildFCSledAssignment, rpBuildFCPhase2, rpBuildFCResults } from './chal/frozen-crossing.js';
import { rpBuildVSTitleCard, rpBuildVSPhase1, rpBuildVSPhase2, rpBuildVSPhase3, rpBuildVSResults } from './chal/viking-sour.js';
import { rpBuildBRBTitleCard, rpBuildBRBSlotMachine, rpBuildBRBObstacleCourse, rpBuildBRBTightrope, rpBuildBRBCustomsTrivia, rpBuildBRBFinalResults } from './chal/bridal-brawls.js';
import { rpBuildGFOTitleCard, rpBuildGFOScramble, rpBuildGFORace, rpBuildGFOTransition, rpBuildGFOEating, rpBuildGFOResults } from './chal/great-fake-out.js';
import { rpBuildSafariColdOpen, rpBuildSafariPhase1, rpBuildSafariPhase2, rpBuildSafariHunt, rpBuildSafariResults } from './chal/african-lying-safari.js';
import { rpBuildRPTitleCard, rpBuildRPFieldPhase, rpBuildRPCavePhase, rpBuildRPPillarPhase, rpBuildRPResults } from './chal/rapa-phooey.js';
import { rpBuildDHTitleCard, rpBuildDHBuildPhase, rpBuildDHVotePhase, rpBuildDHDigPhase, rpBuildDHResults } from './chal/drumheller.js';
import { rpBuildIIBTitleCard, rpBuildIIBSummit, rpBuildIIBFortBuild, rpBuildIIBCtfAssault, rpBuildIIBResults } from './chal/ice-ice-baby.js';
import { rpBuildFCRTitleCard, rpBuildFCRForest, rpBuildFCRCemetery, rpBuildFCRCave, rpBuildFCRResults } from './chal/finders-creepers.js';
import { rpBuildBATitleCard, rpBuildBADive, rpBuildBARace, rpBuildBAResults } from './chal/backstabbers-ahoy.js';
import { rpBuildPTTitleCard, rpBuildPTScavenge, rpBuildPTLandRace, rpBuildPTSeaCrossing, rpBuildPTBeachSprint, rpBuildPTResults } from './chal/planes-trains.js';
import { rpBuildPRTitleCard, rpBuildPRRoles, rpBuildPRCreatureHunt, rpBuildPRDesignStudio, rpBuildPRRunway, rpBuildPRBerserk, rpBuildPRResults } from './chal/project-runaway.js';
import { rpBuildHDTitleCard, rpBuildHDEmuWrangling, rpBuildHDEmuRace, rpBuildHDBungeeGrab, rpBuildHDResults } from './chal/picnic-hanging-dork.js';
import { rpBuildSSRTitleCard, rpBuildSSRGrind, rpBuildSSRDescent, rpBuildSSRHats, rpBuildSSRDraft, rpBuildSSRRound, rpBuildSSRResults } from './chal/slap-slap-revolution.js';
import { rpBuildBBTitleCard, rpBuildBBPhase1, rpBuildBBPhase2, rpBuildBBPhase3, rpBuildBBResults } from './chal/broadway-baby.js';
import { rpBuildAZTitleCard, rpBuildAZZipline, rpBuildAZTrek, rpBuildAZGuardian, rpBuildAZRuins, rpBuildAZResults } from './chal/amazon-race.js';
import { rpBuildNMTitleCard, rpBuildNMSecurity, rpBuildNMGallery, rpBuildNMAssembly, rpBuildNMResults } from './chal/night-at-museum.js';
import { rpBuildTlsTitleCard, rpBuildTlsRounds, rpBuildTlsResults } from './chal/truth-or-shark.js';
import { rpBuildRTDTitleCard, rpBuildRTDSwim, rpBuildRTDRelay, rpBuildRTDResults } from './chal/rock-the-dock.js';
import { rpBuildTTTitleCard, rpBuildTTCaptainDraft, rpBuildTTCliffDive, rpBuildTTChainHunt, rpBuildTTLongboardRace, rpBuildTTResults } from './chal/tropical-takedown.js';
import { rpBuildMMTitleCard, rpBuildMMGuardStrip, rpBuildMMRack, rpBuildMMManhunt, rpBuildMMResults } from './chal/midnight-manhunt.js';
import { rpBuildGPTitleCard, rpBuildGPMaze, rpBuildGPWrestling, rpBuildGPHurdles, rpBuildGPIcarus, rpBuildGPResults } from './chal/greeces-pieces.js';
import { rpBuildHBTitleCard, rpBuildHBEntry, rpBuildHBHunt, rpBuildHBExtract, rpBuildHBResults } from './chal/hangar-black.js';
import { rpBuildAlienEggTitleCard, rpBuildAlienEggRounds, rpBuildAlienEggImmunity, rpBuildAlienEggTribeResults, rpBuildAlienEggLeaderboard } from './chal/alien-egg.js';
import { rpBuildYetiDropOff, rpBuildYetiTrail, rpBuildYetiTraps, rpBuildYetiNight, rpBuildYetiSprint, rpBuildYetiVerdict, rpBuildYetiElimination } from './chal/are-we-there-yeti.js';
import { rpBuildTDTTitleCard, rpBuildTDTRace, rpBuildTDTResults } from './chal/truth-or-dare-train.js';
import { rpBuildAMGTitleCard, rpBuildAMGRace, rpBuildAMGResults } from './chal/a-maze-ing-grip.js';
import { rpBuildPolesApartTitleCard, rpBuildPolesApartArena, rpBuildPolesApartResults } from './chal/poles-apart.js';
import { rpBuildTusksTitleCard, rpBuildTusksHunt, rpBuildTusksFinish } from './chal/tusks-and-ladders.js';
import { rpBuildClownTitleCard, rpBuildClownStalk, rpBuildClownRun } from './chal/killer-clown.js';
import { rpBuildBashTitleCard, rpBuildBashArena, rpBuildBashResults } from './chal/bumper-car-bash.js';
import { rpBuildCheeseTitleCard, rpBuildCheeseDrop, rpBuildCheeseResults } from './chal/say-cheese.js';
import { rpBuildBenches, rpBuildRelayPitch, rpBuildRelayFlagpole, rpBuildRelayBeam, rpBuildRelaySprint, rpBuildRelayFinish, rpBuildJuryVotes } from './vp-finale.js';
// rpBuildAftermath is read off window (not statically imported) — aftermath.js already imports from
// this module, so a static import here would create a circular dependency.

export function _textStripHtml(s) { return s ? s.replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<[^>]+>/g, '') : ''; }

// ══════════════════════════════════════════════════════════════
// GENERIC TWIST CHALLENGE TEXT — renders VP screens as plain text
// Instead of walking data structures, we call the actual VP build
// functions and strip HTML to get the exact narration the VP shows.
// ══════════════════════════════════════════════════════════════
export function _textTwistChallenge(ep, ln, sec, dataKey, label, vpBuilders) {
  const data = ep[dataKey];
  if (!data) return;
  sec(label);

  // Force all reveal states to "show everything" so VP renders full content
  const savedState = window._tvState;
  window._tvState = new Proxy({}, {
    get(target, key) {
      if (key === '__isProxy') return true;
      if (!(key in target)) target[key] = { idx: 99999 };
      return target[key];
    },
    set(target, key, val) { target[key] = val; return true; },
    has() { return true; }
  });

  for (const builder of vpBuilders) {
    try {
      // Set reveal state to show all steps
      const html = builder(ep);
      if (!html) continue;
      // Strip HTML tags, collapse whitespace, split into lines
      const text = html
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<\/div>/gi, '\n')
        .replace(/<\/p>/gi, '\n')
        .replace(/<[^>]+>/g, '')
        .replace(/&middot;/g, '·')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&nbsp;/g, ' ')
        .split('\n')
        .map(l => l.trim())
        .filter(l => l.length > 0)
        .filter(l => !/^(Investigate|Reveal All|NEXT|SMASH|REVEAL|SHOW ALL|DESTROY ALL|SET COMPLETE|CARPET CLEARED|ROOM DEMOLISHED|SHOW'S OVER|CASE CLOSED|ALL RISE|COLLECTION COMPLETE|INVESTIGATION CLOSED)$/i.test(l) && !/^Next\s*\(/i.test(l) && !/^Skip to results/i.test(l));

      for (const line of text) {
        ln(`  ${line}`);
      }
      ln('');
    } catch (e) {
      // If VP builder fails (eg missing window context), skip silently
    }
  }

  // Restore reveal states
  window._tvState = savedState;
}

export function _textExileFound(name, found, ln) {
  if (!found) { ln(`${name} searches Exile Island but finds nothing.`); return; }
  const labels = { idol:'a Hidden Immunity Idol', secondLife:'the Second Life Amulet', extraVote:'an Extra Vote', safetyNoPower:'a Safety Without Power', soleVote:'a Sole Vote', clue:'an Idol Clue' };
  ln(`${name} searches Exile Island and finds ${labels[found.type] || found.type}.`);
}

export function _textBetrayReasonNote(reason) {
  if (!reason) return null;
  const r = reason.toLowerCase();
  if (r.includes('preemptive') || r.includes('sensed they were being targeted')) return 'made a preemptive strike — felt the vote was already coming for them';
  if ((r.includes('protecting') || r.includes('protect')) && (r.includes('bond') || r.includes('expense') || r.includes('untouchable'))) return "couldn't write that name — too strong a bond";
  if (r.includes('two alliances') || r.includes('split') || r.includes('conflict') || (r.includes('chose') && r.includes('over'))) return 'pulled by a competing alliance';
  if (r.includes('broke from their own bloc') || r.includes('cast a completely different ballot') || r.includes('stated plan was') || r.includes('went to tribal with a plan') || r.includes('the group followed the plan')) return 'ran the plan publicly, privately voted elsewhere';
  if (r.includes('personal animosity') || r.includes('pure hostility') || r.includes("can't work with")) return 'personal conflict drove the vote';
  if (r.includes('threat') || r.includes('winning too much')) return 'saw a bigger strategic threat';
  const fc = reason.split(' — ')[0];
  return fc.length > 0 && fc.length <= 65 ? fc : null;
}

export function _textTribeGroups() {
  if (gs.phase === 'pre-merge' && gs.tribes.length) {
    const tg = gs.tribes.map(t => ({ ...t, members: [...t.members] }));
    const inTribe = new Set(tg.flatMap(t => t.members));
    gs.activePlayers.filter(n => !inTribe.has(n)).forEach(n => {
      tg.sort((a,b) => a.members.length - b.members.length)[0].members.push(n);
    });
    return tg;
  }
  return [{ name: 'merged', members: [...gs.activePlayers] }];
}

// ── HEADER: META ──
export function _textMeta(ep, ln, sec) {
  const cfg = seasonConfig;
  sec('META');
  const epTitle = _generateEpisodeTitle(ep);
  ln(`SEASON: ${cfg.name||'Unknown'}`);
  ln(`EPISODE ${ep.num} - "${epTitle}"`);
  ln(`Phase: ${gs.phase || 'unknown'} | Players Remaining: ${gs.activePlayers.length}`);
  if (cfg.ri && cfg.riFormat !== 'rescue') ln('Format: Redemption Island — voted out players may fight back via RI duels');
  if (cfg.ri && cfg.riFormat === 'rescue') ln('Format: Rescue Island — all eliminees go to Rescue Island (social game)');
}

function _generateEpisodeTitle(ep) {
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  if (ep.num === 1) {
    const openers = ['New Arrivals','Welcome to the Jungle','Game On','First Impressions','Day One','Let the Games Begin','Fresh Meat','Ready or Not'];
    return pick(openers);
  }
  if (ep.isFinale) return 'The Final Showdown';
  if (ep.isMerge) return 'The Merge';
  if (ep.challengeLabel) return ep.challengeLabel;
  if (ep.eliminated) {
    const templates = [
      `The Fall of ${ep.eliminated}`,
      `Goodbye, ${ep.eliminated}`,
      `${ep.eliminated}'s Last Stand`,
      `End of the Line`,
    ];
    return pick(templates);
  }
  return `Episode ${ep.num}`;
}

// ── HEADER: CAST ──
export function _textCast(ep, ln, sec) {
  const cfg = seasonConfig;
  // Use CAST (ALL) header — current-season.html parser depends on this exact format
  // Each name on its own line so parseCastFromSummary's cleanNameLine/isProbablyName can read them
  sec('CAST (ALL)');
  players.forEach(p => ln(p.name));

  // Separate TRIBES section — current-season.html parser looks for === TRIBES header
  // Format: "TribeName Tribe (N): Name1, Name2" so Pattern 3 in current-season.html matches
  sec('TRIBES (ACTIVE)');
  if (ep.isMerge) {
    ln(`Remaining (${gs.activePlayers.length}): ${gs.activePlayers.join(', ')}`);
  } else if (ep.tribesAtStart?.length) {
    ep.tribesAtStart.forEach(t => ln(`${t.name} Tribe (${t.members.length}): ${t.members.join(', ')}`));
    if (ep.swapResult) ln(`(tribes shown before Elimination Swap fired)`);
  } else if (gs.tribes.length) {
    gs.tribes.forEach(t => ln(`${t.name} Tribe (${t.members.length}): ${t.members.join(', ')}`));
  } else {
    ln(`MERGED (${gs.activePlayers.length}): ${gs.activePlayers.join(', ')}`);
  }

  sec('ELIMINATED (PERMANENT)');
  if (gs.eliminated.length) gs.eliminated.forEach(name => ln(name));
  else ln('None yet.');

  // CHRONOLOGY: the lists above are the END-of-episode state. Make the start-of-episode roster
  // explicit so the writer keeps this-episode boots alive until their elimination beat (and out of
  // the "previously on" recap). activeAtStart was snapshotted before any elimination ran this episode.
  const _activeStart = (ep.activeAtStart && ep.activeAtStart.length) ? ep.activeAtStart : null;
  const _elimThis = _activeStart ? _activeStart.filter(n => gs.eliminated.includes(n)) : [];
  if (_elimThis.length) {
    sec('ROSTER AT EPISODE START');
    ln('Everyone alive and active when this episode BEGAN. Players marked (OUT THIS EPISODE) are eliminated later THIS episode but are fully present in every scene until their elimination beat — never write them as gone before then.');
    _activeStart.forEach(name => ln(`${name}${_elimThis.includes(name) ? ' (OUT THIS EPISODE)' : ''}`));
    sec('ELIMINATED THIS EPISODE');
    ln('Eliminated DURING this episode (NOT before it). Alive until their elimination at the challenge / Tribal / duel / twist. The "previously on" recap must NEVER mention these names:');
    _elimThis.forEach(name => ln(name));
  }
  if (cfg.ri) {
    sec('ON REDEMPTION ISLAND');
    ln(gs.riPlayers.length ? gs.riPlayers.join(', ') : 'None.');
  }
  if (gs.exileDuelPlayer) {
    sec('ON EXILE');
    ln(`${gs.exileDuelPlayer} — sent to exile last episode. Will duel the next player voted out for a chance to return.`);
  }
}

// ── COLD OPEN ──
export function _textColdOpen(ep, ln, sec) {
  const prev = gs.episodeHistory.filter(h => h.num < ep.num).slice(-1)[0];
  if (!prev) return;
  sec('COLD OPEN');
  if (prev.eliminated) {
    // Pre-merge: name the boot's tribe so the worker only has THAT tribe react.
    // The other tribe doesn't know yet — they find out at the next challenge.
    const wasMerged = prev.isMerge || gs.isMerged;
    let bootTribe = null;
    if (!wasMerged) {
      bootTribe = (prev.tribesAtStart || []).find(t => (t.members || []).includes(prev.eliminated))?.name || null;
    }
    if (prev.lastChance) {
      ln(`Ep.${prev.num}: Last Chance Challenge. ${prev.eliminated} was eliminated in a head-to-head duel.`);
    } else {
      ln(`Ep.${prev.num}: ${prev.immunityWinner ? prev.immunityWinner + ' won immunity. ' : ''}${prev.eliminated} was voted out${bootTribe ? ` at ${bootTribe}'s Tribal Council` : ''}${prev.riChoice === 'REDEMPTION ISLAND' ? ' and chose Redemption Island' : ''}.`);
    }
    if (bootTribe) {
      ln(`NOTE: ${prev.eliminated} was on ${bootTribe}. ONLY ${bootTribe} attended that Tribal and knows ${prev.eliminated} is gone — the post-Tribal debrief is ${bootTribe} members ONLY. The other tribe has NOT learned this yet and finds out at the next challenge.`);
    }
  }
  const recentBetrayals = gs.namedAlliances?.flatMap(a => a.betrayals.filter(b => b.ep === prev.num)) || [];
  recentBetrayals.forEach(b => {
    const alliance = gs.namedAlliances.find(a => a.betrayals.includes(b));
    const allianceName = alliance?.name || 'their alliance';
    const newAllianceNote = b.formedThisEp ? ` The alliance had only just formed that episode — no time to build trust before the vote fractured it.` : '';
    const impactNote = b.votedFor === prev.eliminated ? ` The person they voted for was eliminated anyway.` : b.consensusWas === prev.eliminated ? ` Their alliance's target still went home.` : ` The alliance's target, ${b.consensusWas}, survived because of it.`;
    const motive = _textBetrayReasonNote(b.reason);
    const motiveNote = motive ? ` Why: ${motive}.` : '';
    ln(`${b.player} broke ${allianceName} — voted ${b.votedFor} instead of ${b.consensusWas}.${motiveNote}${impactNote}${newAllianceNote} The relationship with remaining members has taken damage.`);
  });
}

// ── RETURNS (RI re-entry, exile duel result) ──
export function _textReturns(ep, ln, sec) {
  if (ep.isRIReentry && ep.riReentrant) {
    sec('THE CHAMPION RETURNS');
    const _rr = ep.rescueReturn;
    const _returnees = ep.riReentrants && ep.riReentrants.length ? ep.riReentrants : [ep.riReentrant];
    if (_rr?.phases) {
      ln(`EDGE OF EXTINCTION — THE RETURN: ${(_rr.competitors||[]).length} castaways who refused to quit fight a five-stage gauntlet for ${_returnees.length>1?`${_returnees.length} spots`:'one spot'} back in the game.`);
      (_rr.competitors||[]).forEach(n => {
        const sp = (_rr.snapshot||{})[n] || {};
        ln(`  ${n}: ${sp.days||0} day(s) on the Edge — body ${sp.pw??'?'}/100, mind ${sp.mh??'?'}/100, +${(sp.bonus||0).toFixed(1)} banked in training.`);
      });
      (_rr.phases||[]).forEach((ph, i) => {
        const ordered = Object.keys(ph.scores).sort((a,b)=>ph.scores[b]-ph.scores[a]);
        ln(`STAGE ${i+1} — ${ph.name} (${ph.stat}): ${ordered.map(n => `${n} ${ph.scores[n].toFixed(1)}`).join(', ')}.`);
        (ph.events||[]).forEach(evt => ln(`  ${evt.text}`));
      });
      ln(`${_returnees.join(' and ')} ${_returnees.length>1?'are the last ones':'is the last one'} standing and ${_returnees.length>1?'return':'returns'} to the game.`);
    } else {
      ln(`${_returnees.join(' and ')} ${_returnees.length>1?'win':'wins'} the return challenge and ${_returnees.length>1?'rejoin':'rejoins'} the game.`);
    }
    const _ri = ep.riReentry;
    if (_ri?.streakCount >= 2) ln(`Win streak: ${_ri.streakCount} — returns as a perceived threat.`);
    if (ep.riReentryLosers?.length) ln(`Permanently eliminated: ${ep.riReentryLosers.join(', ')}`);
  }
  if (ep.exileDuelResult) {
    if (!ep.isRIReentry) sec('RETURNS');
    const _ed = ep.exileDuelResult;
    ln(`EXILE DUEL: ${_ed.exilePlayer} (exile) vs ${_ed.newBoot} (just voted out) — ${_ed.challengeLabel} duel.`);
    ln(`Winner: ${_ed.winner} — ${_ed.winner === _ed.exilePlayer ? 'returns to the game' : 'stays in the game'}.`);
    ln(`Loser: ${_ed.loser} — ${ep.exileDuelToRescue ? 'sent to ' + (ep.exileDuelRILabel || 'Rescue Island') + '.' : 'permanently eliminated.'}`);
  }
}

// ── MERGE ──
export function _textMerge(ep, ln, sec) {
  if (!ep.isMerge) return;
  sec('MERGE');
  ln(`Tribes dissolve. Individual immunity. Everyone votes.`);
  if (gs.mergeName) ln(`New tribe name: ${gs.mergeName}`);
  ln(`Merged players (${gs.activePlayers.length}): ${gs.activePlayers.join(', ')}`);
}

// ── CAMP — PRE-CHALLENGE ──
export function _textCampPre(ep, ln, sec) {
  const tribeGroups = _textTribeGroups();

  // Advantage status per tribe
  tribeGroups.forEach(tribe => {
    const isMerge = tribe.name === 'merged';
    sec(`CAMP — PRE-CHALLENGE${isMerge ? '' : ' — ' + tribe.name.toUpperCase()}`);
    ln('ADVANTAGES:');
    const advLines = window.getTribeAdvantageStatus(tribe.name, isMerge);
    advLines.length ? advLines.forEach(l => ln(`- ${_textStripHtml(l)}`)) : ln('- No advantages active.');
  });

  // Beware activation
  const bewareAct = ep.idolFinds?.find(f => f.type === 'beware-activated');
  if (bewareAct) ln(`BEWARE ACTIVATION — All tribes have now found their beware. Idols activated for: ${bewareAct.holders.join(', ')}. Vote restriction lifted.`);

  // Survival status
  if (ep.survivalSnapshot && seasonConfig.foodWater === 'enabled') {
    ln('');
    ln('SURVIVAL:');
    const _tf = ep.tribeFoodSnapshot || {};
    Object.entries(_tf).forEach(([tribe, food]) => ln(`  ${tribe}: ${Math.round(food)} food (${food >= 80 ? 'Well-Fed' : food >= 60 ? 'Comfortable' : food >= 40 ? 'Hungry' : food >= 20 ? 'Starving' : 'Critical'})`));
    if (ep.providerSlackerData) {
      if (ep.providerSlackerData.providers.length) ln(`  Providers: ${ep.providerSlackerData.providers.join(', ')}`);
      if (ep.providerSlackerData.slackers.length) ln(`  Slackers: ${ep.providerSlackerData.slackers.join(', ')}`);
    }
    if (ep.medevac) ln(`  MEDEVAC: ${ep.medevac.name} (survival: ${ep.medevac.survival})`);
    if (ep.medevacReplacement) ln(`  REPLACEMENT: ${ep.medevacReplacement.returned} returns (${ep.medevacReplacement.mindset} mindset)`);
  }

  // Camp events (pre phase)
  if (ep.campEvents && Object.keys(ep.campEvents).length) {
    const hasPreEvs = Object.values(ep.campEvents).some(phaseData => {
      const evs = Array.isArray(phaseData) ? phaseData : (phaseData?.pre || []);
      return evs.length > 0;
    });
    if (hasPreEvs) {
      ln('');
      ln('CAMP EVENTS:');
      Object.entries(ep.campEvents).forEach(([campName, phaseData]) => {
        const preEvs = Array.isArray(phaseData) ? phaseData : (phaseData?.pre || []);
        if (!preEvs.length) return;
        if (campName !== 'merge') ln(`${campName.toUpperCase()} CAMP:`);
        preEvs.forEach(e => {
          const badge = e.badgeText ? `[${e.badgeText}] ` : '';
          ln(`- ${badge}${e.text}`);
        });
      });
    }
  }

  // Relationship highlights — after camp events so bonds reflect what just happened
  const relTribeGroups = tribeGroups.map(t => ({ ...t, members: [...t.members] }));
  const addElim = (name) => {
    if (!name) return;
    const target = ep.loser?.name ? relTribeGroups.find(t => t.name === ep.loser.name) : relTribeGroups[0];
    if (target && !target.members.includes(name)) target.members.push(name);
  };
  addElim(ep.eliminated);
  addElim(ep.firstEliminated);

  relTribeGroups.forEach(tribe => {
    const isMerge = tribe.name === 'merged';
    ln('');
    ln(`RELATIONSHIPS${isMerge ? '' : ' — ' + tribe.name.toUpperCase()}:`);
    const relPairs = window.getTribeRelationshipHighlights(tribe.members, ep.gsSnapshot);
    if (relPairs.length) {
      relPairs.forEach(p => {
        const preRel = relationships.find(r => [r.a,r.b].sort().join('|')===[p.a,p.b].sort().join('|'));
        const note = preRel?.note ? ` (${preRel.note})` : '';
        if (p.hasGap) {
          ln(`- ${p.a} & ${p.b} — ${p.a} feels ${bondLabel(p.aPerceived)}. ${p.b} feels ${bondLabel(p.bPerceived)}${note}.`);
        } else {
          ln(`- ${p.a} and ${p.b} ${bondFeeling(p.val)}${note}.`);
        }
      });
    } else {
      ln('- No notable bonds established yet.');
    }
  });

  // Alliance status
  const prev = gs.episodeHistory.filter(h => h.num < ep.num).slice(-1)[0];
  const activeAlliances = gs.namedAlliances?.filter(a => a.active && a.members.filter(m => gs.activePlayers.includes(m)).length >= 2) || [];
  const prevSnapAllianceNames = new Set((prev?.gsSnapshot?.namedAlliances || []).map(a => a.name));
  const dissolvedThisEp = (gs.namedAlliances || []).filter(a => !a.active && prevSnapAllianceNames.has(a.name));
  const playerTribeMap = {};
  if (!gs.isMerged) (gs.tribes || []).forEach(t => t.members.forEach(m => { playerTribeMap[m] = t.name; }));

  if (activeAlliances.length || dissolvedThisEp.length) {
    ln('');
    ln('ALLIANCES:');
    [...activeAlliances, ...dissolvedThisEp].forEach(a => {
      const isDissolved = !a.active;
      const active = a.members.filter(m => gs.activePlayers.includes(m));
      const formedThisEp = a.formed === ep.num;
      let splitNote = '';
      if (!gs.isMerged && !isDissolved && Object.keys(playerTribeMap).length) {
        const tg = {};
        active.forEach(m => { const t = playerTribeMap[m] || 'unknown'; if (!tg[t]) tg[t] = []; tg[t].push(m); });
        if (Object.keys(tg).length > 1) {
          const breakdown = Object.entries(tg).map(([t, ms]) => `${t}: ${ms.join(', ')}`).join(' / ');
          splitNote = ` — SPLIT ACROSS TRIBES (${breakdown})`;
        }
      }
      const statusTag = isDissolved ? ' — DISSOLVED' : formedThisEp ? ' — FORMED THIS EPISODE' : '';
      ln(`${a.name} (formed ep.${a.formed})${statusTag}: ${active.join(', ')}${splitNote}`);
      if (a.betrayals?.length) {
        a.betrayals.forEach(b => {
          const votedAnAlly = a.members.includes(b.votedFor);
          const allyNote = votedAnAlly ? ` — voted against own ally` : '';
          const ageNote = b.formedThisEp ? ` (brand new alliance)` : '';
          const motive = _textBetrayReasonNote(b.reason);
          const motiveNote = motive ? ` — ${motive}` : '';
          ln(`  > ${b.player} betrayed ep.${b.ep} — voted ${b.votedFor} instead of ${b.consensusWas}${allyNote}${ageNote}${motiveNote}`);
        });
      }
      if (a.quits?.length) {
        a.quits.forEach(q => {
          const reasonNote = q.reason ? ` (${q.reason})` : '';
          ln(`  > ${q.player} left ep.${q.ep}${reasonNote}`);
        });
      }
    });
  }

  // Alliance quits this episode
  if (ep.allianceQuits?.length) {
    ln('');
    ln('ALLIANCE CHANGES:');
    ep.allianceQuits.forEach(q => {
      const _pick = arr => arr[Math.floor(Math.random() * arr.length)];
      let line;
      if (q.reason === 'alliance turned') {
        line = _pick([
          `The relationships inside ${q.alliance} had been eroding for a while. Before tribal, the group quietly decides ${q.player} is the liability.`,
          `${q.alliance} fractures before tribal. ${q.player}'s bonds inside the group were already threadbare.`,
          `${q.player} is cut loose from ${q.alliance} before the vote even happens. Not through a blow-up — through silence.`,
          `The trust between ${q.player} and ${q.alliance} was already gone. The others formalize it before tribal.`,
        ]);
      } else if (q.reason === 'betrayed by alliance member') {
        line = _pick([
          `${q.player} finds out someone in ${q.alliance} wrote their name down. The alliance is done.`,
          `${q.player} knows. Someone in ${q.alliance} voted against them. ${q.alliance} is finished to them.`,
          `${q.player} is out of ${q.alliance}. Someone in that group proved they can't be trusted.`,
          `The trust in ${q.alliance} is gone. ${q.player} got a vote from inside.`,
        ]);
      } else if (q.reason === 'tribe split — drifted away on separate tribe') {
        line = _pick([
          `${q.player} and ${q.alliance} are on different tribes now. The alliance technically exists. Practically, it doesn't.`,
          `Distance did the work. ${q.player} steps back from ${q.alliance}.`,
          `${q.alliance} was built on proximity. ${q.player} is on the other side of the swap.`,
          `The tribe swap quietly ends ${q.player}'s involvement in ${q.alliance}.`,
        ]);
      } else if (q.reason === 'relationship breakdown') {
        line = _pick([
          `${q.player} has had enough of ${q.alliance}. The bonds were already thin.`,
          `${q.player} pulls back from ${q.alliance}. The relationships aren't worth protecting anymore.`,
          `Something cracked between ${q.player} and ${q.alliance}.`,
          `The chemistry in ${q.alliance} was never right for ${q.player}. They've stopped pretending.`,
        ]);
      } else if (q.reason === 'strategic pivot') {
        line = _pick([
          `${q.player} quietly reclassifies ${q.alliance} as a liability.`,
          `${q.alliance} served its purpose for ${q.player}. They're done with it.`,
          `${q.player} has already moved on from ${q.alliance} in their head.`,
          `${q.player} reassesses. ${q.alliance} doesn't fit the plan anymore.`,
        ]);
      } else {
        line = _pick([
          `${q.player} quietly steps away from ${q.alliance} — chose to go solo.`,
          `${q.player} drifts out of ${q.alliance}. No drama, no announcement — just gone.`,
          `${q.alliance} loses ${q.player} this episode.`,
          `${q.player} decouples from ${q.alliance}. They'll work as a free agent from here.`,
        ]);
      }
      ln(`- ${line}`);
    });
  }
}

// ── REWARD CHALLENGE ──
export function _textRewardChallenge(ep, ln, sec) {
  // Twist-based reward challenge
  const _rcTwist = (ep.twists||[]).find(t => t.type === 'reward-challenge');
  if (_rcTwist) {
    sec('REWARD CHALLENGE');
    const _isTribeRew = _rcTwist.rewardWinnerType === 'tribe';
    ln(`${_isTribeRew ? 'TRIBE' : 'INDIVIDUAL'} REWARD (${_rcTwist.rewardChalLabel||'Reward Challenge'} — ${_rcTwist.rewardChalCategory||'mixed'})`);
    if (_rcTwist.rewardChalDesc) ln(_rcTwist.rewardChalDesc);
    if (_isTribeRew && _rcTwist.rewardChalPlacements?.length) {
      _rcTwist.rewardChalPlacements.forEach((tribe, i) => {
        const suffix = i === 0 ? '— WON REWARD' : '— no reward';
        ln(`  ${i+1}. ${tribe.name} ${suffix}`);
        const sc = tribe.memberScores || {};
        const ranked = [...(tribe.members||[])].sort((a,b) => (sc[b]||0)-(sc[a]||0));
        if (ranked.length) ln(`     Standings: ${ranked.map((n,j) => j===0 ? `${n} (standout)` : j===ranked.length-1 ? `${n} (weak link)` : n).join(' > ')}`);
      });
    } else if (_rcTwist.rewardChalPlacements?.length) {
      const _rpl = _rcTwist.rewardChalPlacements;
      ln(`  Full standings: ${_rpl.map((n,j) => j===0 ? `${n} (1st)` : j===_rpl.length-1 ? `${n} (last)` : n).join(' > ')}`);
    }
    if (_rcTwist.rewardItemLabel) ln(`REWARD: ${_rcTwist.rewardItemLabel} — ${_rcTwist.rewardItemDesc||''}`);
    ln(`RESULT: ${_rcTwist.rewardWinner} ${_isTribeRew ? 'wins' : 'won'} the reward.`);
    if (_rcTwist.rewardItemId === 'clue' && _rcTwist.rewardCluedPlayer) ln(`NOTE: ${_rcTwist.rewardCluedPlayer} received the idol clue.`);
    if (_rcTwist.rewardItemId === 'overnight' && _rcTwist.rewardCompanions?.length) ln(`NOTE: ${_rcTwist.rewardWinner} brought ${_rcTwist.rewardCompanions.join(' and ')} on the overnight trip.`);
    const _rcScores = {};
    if (_isTribeRew) (_rcTwist.rewardChalPlacements||[]).forEach(t => Object.assign(_rcScores, t.memberScores||{}));
    else Object.assign(_rcScores, _rcTwist.rewardMemberScores||{});
    window.generateChallengeNotes(_rcTwist.rewardChalPlacements, _rcScores, 2).forEach(n => ln(n));
    if (_rcTwist.rewardBackfire?.fired) {
      if (_rcTwist.rewardBackfire.path === 'alliance') {
        ln(`BACKFIRE: Left-behind players formed alliance "${_rcTwist.rewardBackfire.allianceName}" (${(_rcTwist.rewardBackfire.allianceMembers||[]).join(', ')}). Heat +1.5 on ${_rcTwist.rewardBackfire.heatTarget}.`);
      } else {
        ln(`LEFT BEHIND: Snubbed players bonded. Heat +1.0 on ${_rcTwist.rewardBackfire.heatTarget}.${_rcTwist.rewardBackfire.blocPair ? ` F2 deal: ${_rcTwist.rewardBackfire.blocPair.join(' + ')}.` : ''}`);
      }
    }
  }
  // Standalone reward challenge data (including reward-twist-challenge)
  if (ep.rewardChalData && !_rcTwist) {
    const rc = ep.rewardChalData;
    sec(rc.isRewardOnly ? 'REWARD-ONLY EPISODE' : 'REWARD CHALLENGE');
    if (rc.isRewardOnly) ln('No elimination this episode — challenge played for reward only.');
    ln(`${rc.label} (${rc.category}): ${rc.winner} wins.`);
    if (rc.rewardItemLabel) ln(`Reward: ${rc.rewardItemLabel}`);
    if (rc.rewardCompanions?.length) ln(`Shares with: ${rc.rewardCompanions.join(', ')} (${rc.rewardPickStrategy || 'heart'} pick)`);
    if (rc.rewardPickReasons?.length) rc.rewardPickReasons.forEach(pr => ln(`  ${pr.name}: ${pr.reason} (bond: ${pr.bond})`));
    if (rc.rewardSnubs?.length) ln(`Snubbed: ${rc.rewardSnubs.map(s => `${s.player} (bond ${s.bond}, hit ${s.damage})`).join(', ')}`);
    if (rc.rewardAllianceFormed) ln(`ALLIANCE FORMED during reward: ${rc.rewardAllianceFormed}`);
    if (rc.rewardAllianceFailed) ln(`Alliance pitch FAILED during reward.`);
    if (rc.rewardAllianceStrengthened) ln(`Alliance ${rc.rewardAllianceStrengthened} STRENGTHENED during reward.`);
    if (rc.rewardPitchLeaks?.length) rc.rewardPitchLeaks.forEach(l => ln(`LEAKED: ${l.leaker} told ${l.toldTo} about the failed pitch.`));
    if (rc.rewardBackfire?.fired) {
      if (rc.rewardBackfire.path === 'alliance') {
        ln(`BACKFIRE: Left-behind players formed alliance "${rc.rewardBackfire.allianceName}" (${(rc.rewardBackfire.allianceMembers||[]).join(', ')}). Heat +1.5 on ${rc.rewardBackfire.heatTarget}.`);
      } else {
        ln(`LEFT BEHIND: Snubbed players bonded. Heat +1.0 on ${rc.rewardBackfire.heatTarget}.${rc.rewardBackfire.blocPair ? ` F2 deal: ${rc.rewardBackfire.blocPair.join(' + ')}.` : ''}`);
      }
    }
    if (rc.rewardShareInvite) ln(`REWARD SHARED: ${rc.rewardShareInvite.invited} invited by ${rc.rewardShareInvite.invitedBy} (${rc.rewardShareInvite.reason})`);
  }
}

// ── IMMUNITY CHALLENGE ──
export function _textImmunityChallenge(ep, ln, sec) {
  if (ep.isFinale) return;
  const standardTypes = new Set(['tribe','team','individual','mixed',undefined,'']);
  if (!standardTypes.has(ep.challengeType)) return;
  sec('IMMUNITY CHALLENGE');
  const isTribeChallenge = ep.challengeType === 'tribe' || ep.challengeType === 'team' || (ep.winner && ep.loser && !ep.immunityWinner);
  if (isTribeChallenge) {
    ln(`TRIBE IMMUNITY (${ep.challengeLabel||'Mixed'} challenge — ${ep.challengeCategory||'mixed'})`);
    if (ep.challengeDesc) ln(ep.challengeDesc);
    const _imScores = ep.chalMemberScores || {};
    if (ep.challengePlacements?.length > 2) {
      ep.challengePlacements.forEach((t, i) => {
        const suffix = i === 0 ? '— WIN, immune' : i === ep.challengePlacements.length - 1 ? '— LAST, goes to tribal' : '— safe';
        ln(`  ${i+1}. ${t.name} ${suffix}`);
        const tribeSitOuts = ep.chalSitOuts?.[t.name] || [];
        const competitors = (t.members||[]).filter(m => !tribeSitOuts.includes(m));
        const ranked = [...competitors].sort((a,b) => (_imScores[b]||0)-(_imScores[a]||0));
        if (ranked.length) ln(`     Standings: ${ranked.map((n,j) => j===0 ? `${n} (standout)` : j===ranked.length-1 ? `${n} (weak link)` : n).join(' > ')}`);
        if (tribeSitOuts.length) ln(`     Sat out: ${tribeSitOuts.join(', ')}`);
      });
    } else {
      if (ep.lastChance) ln(`${ep.winner?.name} win immunity. ${ep.loser?.name} face the Last Chance Challenge.`);
      else ln(`${ep.winner?.name} win. ${ep.loser?.name} go to tribal council.`);
    }
    if (ep.lastChance) ln(`RESULT: ${ep.loser?.name} (2 players) go to Last Chance Challenge instead of tribal council.`);
    else if (ep.tribeDissolve) ln(`RESULT: ${ep.tribeDissolve.fromTribe} has only one player left — the tribe is dissolved. ${ep.tribeDissolve.player} is absorbed into ${ep.tribeDissolve.toTribe}. No tribal council.`);
    else ln(`RESULT: ${ep.loser?.name} go to tribal council.`);
    window.generateChallengeNotes(ep.challengePlacements, ep.chalMemberScores, 2).forEach(n => ln(n));
  } else {
    ln(`INDIVIDUAL IMMUNITY (${ep.challengeLabel||'Mixed'} challenge — ${ep.challengeCategory||'mixed'}): ${ep.immunityWinner} wins.`);
    if (ep.challengeDesc) ln(ep.challengeDesc);
    if (ep.chalPlacements?.length > 1) {
      const _ipl = ep.chalPlacements;
      ln(`  Full standings: ${_ipl.map((n,j) => j===0 ? `${n} (1st, immune)` : j===_ipl.length-1 ? `${n} (last)` : n).join(' > ')}`);
    }
    window.generateChallengeNotes(ep.chalPlacements, ep.chalMemberScores, 2).forEach(n => ln(n));
  }

  // Last Chance Challenge
  if (ep.lastChance) {
    const _lc = ep.lastChance;
    ln('');
    ln(`LAST CHANCE: ${_lc.loser} vs. ${_lc.winner} — ${_lc.challengeLabel}`);
    const _lcLP = pronouns(_lc.loser);
    const _lcLines = [
      `It comes down to two. ${_lc.loser} and ${_lc.winner} face off in a ${_lc.challengeLabel} challenge. No vote, no alliance — just who wins. ${_lc.winner} outlasts ${_lc.loser}. ${_lcLP.Sub} ${_lcLP.sub==='they'?'are':'is'} eliminated.`,
      `No tribal council. ${_lc.loser} and ${_lc.winner}, head-to-head. The ${_lc.challengeLabel} challenge runs until someone breaks. ${_lc.loser} breaks first.`,
      `One challenge. One person goes home. ${_lc.winner} wins the ${_lc.challengeLabel} duel against ${_lc.loser}. ${_lcLP.Sub} ${_lcLP.sub==='they'?'are':'is'} eliminated on the spot.`,
    ];
    ln(_lcLines[Math.floor(Math.random() * _lcLines.length)]);
    if (_lc.toTribe) ln(`${_lc.winner} joins ${_lc.toTribe}. ${ep.loser?.name} is dissolved.`);
  }

  // Immunity-result twists (hero duel, shared immunity, double safety)
  const _heroTw = (ep.twists||[]).find(t => t.type === 'hero-duel');
  const _sharedTw = (ep.twists||[]).find(t => t.type === 'shared-immunity');
  const _dblSafeTw = (ep.twists||[]).find(t => t.type === 'double-safety');
  if (_heroTw?.duelWinner) ln(`HERO DUEL RESULT: ${_heroTw.duelWinner} wins. ${_heroTw.duelLoser} is vulnerable.`);
  if (_sharedTw?.sharedWith) ln(`SHARED IMMUNITY: ${ep.immunityWinner} chose to share the necklace with ${_sharedTw.sharedWith}. Both are safe.`);
  if (_dblSafeTw?.secondImmune) ln(`DOUBLE SAFETY: ${ep.immunityWinner} won immunity. ${_dblSafeTw.secondImmune} finished second — also safe tonight.`);
}

// ── TWISTS ──
// Roster-changing twists fire at the START of an episode (before camp life and
// the challenge), so their announcement must appear BEFORE camp events — otherwise
// the backlog describes camp life on the new tribes before ever saying the swap
// happened. Emitted in its own early section; skipped in _textTwists below.
const ROSTER_TWIST_TYPES = new Set(['producer-swap','tribe-swap','tribe-dissolve','tribe-expansion','mutiny','abduction']);

export function _textRosterSwaps(ep, ln, sec) {
  const allTwists = ep.twists?.length ? ep.twists : (ep.twist ? [ep.twist] : []);
  const swaps = allTwists.filter(t => ROSTER_TWIST_TYPES.has(t.type));
  if (!swaps.length) return;
  sec('TRIBE SHAKE-UP');
  swaps.forEach(tw => {
    if (tw.type === 'producer-swap') {
      ln('PRODUCER SWAP — before anything else this episode, Chris McLean invoked a production override (NOT a vote, NOT random, NOT a reward). He personally reassigned players between tribes.');
      (tw.producerMoves || []).forEach(m => ln(`- ${m.player} reassigned: ${m.from} → ${m.to} (effective immediately).`));
      ln('This happened FIRST — all camp life and the challenge below take place on these NEW tribes:');
      if (tw.newTribes) tw.newTribes.forEach(t => ln(`${t.name.toUpperCase()}: ${t.members.join(', ')}`));
    } else if (tw.type === 'tribe-swap') {
      ln('TRIBE SWAP — before the challenge, all players were redistributed into new tribes. Everything below happens on these NEW tribes:');
      if (tw.newTribes) tw.newTribes.forEach(t => ln(`${t.name.toUpperCase()}: ${t.members.join(', ')}`));
      ln('New idols hidden for each tribe after the swap.');
    } else if (tw.type === 'tribe-dissolve') {
      ln(`TRIBE DISSOLVE — ${tw.dissolvedTribe || 'a tribe'} was dissolved and players reshuffled. Everything below happens on these NEW tribes:`);
      if (tw.newTribes) tw.newTribes.forEach(t => ln(`${t.name.toUpperCase()}: ${t.members.join(', ')}`));
    } else if (tw.type === 'tribe-expansion') {
      ln(`TRIBE EXPANSION — a new tribe "${tw.newTribeName || 'New Tribe'}" was formed and players split into ${tw.newTribes?.length || '?'} groups. Everything below happens on these NEW tribes:`);
      if (tw.newTribes) tw.newTribes.forEach(t => ln(`${t.name.toUpperCase()}: ${t.members.join(', ')}`));
    } else if (tw.type === 'mutiny') {
      if (tw.mutineers?.length) {
        ln(`MUTINY — before the challenge, ${tw.mutineers.length} player(s) voluntarily switched tribes:`);
        tw.mutineers.forEach(m => ln(`- ${m.name} left ${m.from} to join ${m.to}`));
      } else ln('MUTINY — players were offered the chance to switch tribes; nobody took it.');
    } else if (tw.type === 'abduction') {
      if (tw.stolen?.length) { ln('ABDUCTION — before the challenge, each tribe kidnapped one player from a rival:'); tw.stolen.forEach(s => ln(`- ${s.name} taken from ${s.from} by ${s.to}`)); }
      else ln('ABDUCTION — no players stolen (tribes too small).');
    }
  });
}

export function _textTwists(ep, ln, sec) {
  const allTwists = ep.twists?.length ? ep.twists : (ep.twist ? [ep.twist] : []);
  // Filter out types handled by other sections (roster swaps render early via _textRosterSwaps)
  const skipTypes = new Set(['reward-challenge','hero-duel','shared-immunity','double-safety','elimination-swap','exile-duel','fire-making','jury-elimination','tiebreaker-challenge',
    ...ROSTER_TWIST_TYPES]);
  const twists = allTwists.filter(t => !skipTypes.has(t.type));
  if (!twists.length && !ep.journey) return;
  sec('TWISTS');

  twists.forEach(tw => {
    if (tw.type === 'tribe-swap') {
      ln('TRIBE SWAP — all players redistributed into new tribes.');
      if (tw.newTribes) tw.newTribes.forEach(t => ln(`${t.name.toUpperCase()}: ${t.members.join(', ')}`));
      ln('New idols hidden for each tribe after the swap.');
    } else if (tw.type === 'producer-swap') {
      ln('PRODUCER SWAP — Chris McLean invoked a production override (not a vote, not random).');
      (tw.producerMoves || []).forEach(m => ln(`${m.player} reassigned: ${m.from} → ${m.to}.`));
      if (tw.newTribes) tw.newTribes.forEach(t => ln(`${t.name.toUpperCase()}: ${t.members.join(', ')}`));
    } else if (tw.type === 'double-elim') {
      ln('DOUBLE ELIMINATION — two players voted out this episode.');
    } else if (tw.type === 'no-tribal') {
      ln('NO TRIBAL COUNCIL this episode. No one is voted out.');
    } else if (tw.type === 'no-challenge') {
      ln('NO CHALLENGE this episode — no immunity was contested. Nobody wins safety; everyone is vulnerable heading into a normal tribal council decided purely by social play.');
    } else if (tw.type === 'exile-island') {
      if (tw.exiled) {
        const _chooserNote = tw.exileChooser ? ` (chosen by ${tw.exileChooser})` : tw.exileChooserTribe ? ` (chosen by ${tw.exileChooserTribe} tribe)` : '';
        ln(`EXILE ISLAND — ${tw.exiled}${_chooserNote} is sent to Exile Island. They miss tribal council.`);
        _textExileFound(tw.exiled, tw.exileFound, ln);
      }
    } else if (tw.type === 'double-tribal') {
      ln('DOUBLE TRIBAL — both tribes attend tribal council. Two players voted out.');
    } else if (tw.type === 'mutiny') {
      if (tw.mutineers?.length) {
        ln(`MUTINY — ${tw.mutineers.length} player(s) voluntarily switched tribes:`);
        tw.mutineers.forEach(m => ln(`- ${m.name} left ${m.from} to join ${m.to}`));
      } else ln('MUTINY — no players chose to switch tribes.');
    } else if (tw.type === 'penalty-vote') {
      if (tw.penaltyTarget) ln(`PENALTY VOTE — ${tw.penaltyTarget} starts tribal with 1 pre-cast vote against them.`);
    } else if (tw.type === 'disadvantage-vote' && tw.trial) {
      const tr = tw.trial;
      ln('THE DISADVANTAGE TRIAL');
      ln(`At the elimination area, ${tr.host} tells the field they must argue it out and vote to hand one player a disadvantage in the immunity challenge.`);
      ln('');
      (tr.debate || []).forEach(b => ln(b.text));
      ln('');
      Object.keys(tr.votes).forEach(v => ln(`- ${v} votes for ${tr.votes[v]}${tr.voteReasons?.[v] ? ` (${tr.voteReasons[v]})` : ''}.`));
      ln('');
      ln(`In a ${tr.margin}-vote decision, ${tr.target} gets the disadvantage — a ~35% handicap in the immunity challenge.`);
      if (tr.flipped) ln(`The handicap decided it: ${tr.flipped.from} lost immunity to ${tr.flipped.to}.`);
    } else if (tw.type === 'second-chance') {
      if (tw.blocked) ln('SECOND CHANCE VOTE — cancelled (Redemption Island active).');
      else if (tw.noReturn) ln('SECOND CHANCE VOTE — no eligible players could return.');
      else if (tw.returnee) {
        ln(`SECOND CHANCE VOTE — the fans voted. ${tw.returnee} returns to the game.`);
        if (tw.fanVoteResults?.length > 1) { ln('Fan vote results:'); tw.fanVoteResults.forEach((r, i) => ln(`  ${i+1}. ${r.name} — ${r.pct}% of the vote`)); }
      }
    } else if (tw.type === 'returning-player') {
      if (tw.noReturn) ln('RETURNING PLAYER — no eligible players could return.');
      else if (tw.returnees?.length) {
        const _rpReasonLabel = { 'unfinished-business':'unfinished business', 'entertainment':'entertainment value', 'strategic-threat':'strategic threat', 'underdog':'underdog grit', 'random':'sheer will' };
        tw.returnees.forEach(r => ln(`RETURNING PLAYER — ${r.name} fought back into the game (${_rpReasonLabel[r.reason] || 'sheer will'}).`));
      } else if (tw.returnee) ln(`RETURNING PLAYER — ${tw.returnee} fought their way back into the game.`);
    } else if (tw.type === 'shot-in-dark') {
      ln('SHOT IN THE DARK available this tribal. Any player may sacrifice their vote for a 1-in-6 chance of safety.');
      if (ep.shotInDark) {
        const sid = ep.shotInDark;
        ln(`${sid.player} played the Shot in the Dark (${sid.voteCount} votes against).`);
        ln(sid.safe ? `Result: SAFE — ${sid.votesNegated} votes cancelled.` : `Result: NOT SAFE — still vulnerable.`);
      }
    } else if (tw.type === 'tribe-expansion') {
      ln(`TRIBE EXPANSION — a new tribe "${tw.newTribeName || 'New Tribe'}" was formed. Players split into ${tw.newTribes?.length || '?'} groups.`);
      if (tw.newTribes) tw.newTribes.forEach(t => ln(`${t.name.toUpperCase()}: ${t.members.join(', ')}`));
    } else if (tw.type === 'kidnapping') {
      if (tw.kidnapped) { ln(`KIDNAPPING — ${tw.toTribe} kidnapped ${tw.kidnapped} from ${tw.fromTribe}. ${tw.kidnapped} skips tribal and returns next episode.`); if (tw.reason) ln(tw.reason); }
    } else if (tw.type === 'rock-draw') {
      ln('ROCK DRAW in effect — if the vote ties, no re-vote. Non-immune players draw rocks.');
    } else if (tw.type === 'open-vote') {
      ln('OPEN VOTE — votes are public, cast one by one. Cascade pressure builds.');
      if (ep.openVoteOrderedBy) ln(`Voting order chosen by: ${ep.openVoteOrderedBy}`);
      if (ep.openVoteOrder?.length) ln(`Order: ${ep.openVoteOrder.join(' → ')}`);
    } else if (tw.type === 'abduction') {
      if (tw.stolen?.length) { ln('ABDUCTION — each tribe kidnapped one player from a rival:'); tw.stolen.forEach(s => ln(`- ${s.name} taken from ${s.from} by ${s.to}`)); }
      else ln('ABDUCTION — no players stolen (tribes too small).');
    } else if (tw.type === 'guardian-angel') {
      if (tw.guardianAngel) ln(`GUARDIAN ANGEL — ${tw.guardianAngel} earned automatic immunity through the strength of their bonds.`);
    } else if (tw.type === 'sudden-death') {
      ln('SUDDEN DEATH — no tribal council, no vote. Whoever finishes last in the immunity challenge is automatically eliminated on the spot.');
      const _sdOut = ep.suddenDeathEliminated || ep.eliminated;
      if (_sdOut) {
        ln(`${_sdOut} finished last in the challenge and was eliminated — no second chance.`);
        if (ep.immunityWinner) ln(`${ep.immunityWinner} won the challenge and immunity.`);
      }
    } else if (tw.type === 'slasher-night') {
      ln('SLASHER NIGHT — a slasher hunts the tribe. Last one standing wins immunity. Lowest scorer eliminated.');
    } else if (tw.type === 'cultural-reset') {
      ln('CULTURAL RESET — all active alliances publicly revealed. The social game resets.');
      if (tw.revealedAlliances?.length) ln(`Alliances exposed: ${tw.revealedAlliances.join(', ')}`);
      if (tw.allianceOutcomes) Object.entries(tw.allianceOutcomes).forEach(([aName, outcome]) => ln(`  ${aName}: ${outcome.toUpperCase()}`));
      if (tw.exposedPlayers?.length) { ln('Double-dippers exposed:'); tw.exposedPlayers.forEach(exp => ln(`  ${exp.name} — in ${exp.alliances.join(' & ')} (${exp.conflicting ? 'conflicting' : 'overlapping'})`)); }
      if (tw.freeAgents?.length) ln(`Free agents: ${tw.freeAgents.join(', ')}`);
    } else if (tw.type === 'spirit-island') {
      if (tw.spiritVisitor) ln(`SPIRIT ISLAND — jury member ${tw.spiritVisitor} returns to camp for one day.`);
      else ln('SPIRIT ISLAND — no jury members available this episode.');
    } else if (tw.type === 'ri-duel') {
      ln('2ND CHANCE DUEL — determines who stays and who is permanently eliminated.');
    } else if (tw.type === 'the-feast' || tw.type === 'merge-reward') {
      ln(`${tw.name?.toUpperCase() || 'FEAST'} — all players shared a meal. Cross-tribal bonds strengthened.`);
    } else if (tw.type === 'loved-ones') {
      ln('LOVED ONES VISIT — players\' loved ones joined camp. Emotional bonds shifted.');
    } else if (tw.type === 'ambassadors') {
      ln('AMBASSADORS — each tribe named an ambassador. They met to negotiate an elimination.');
      if (tw.ambassadorMeeting) {
        const am = tw.ambassadorMeeting;
        am.types?.forEach(t => ln(`  ${t.name} — ${t.type === 'manipulator' ? 'The Manipulator' : t.type === 'villain' ? 'The Villain' : t.type === 'dealmaker' ? 'The Dealmaker' : t.type === 'loyal-shield' ? 'The Loyal Shield' : 'The Emotional Pitch'}`));
        if (am.agreed) ln(`  AGREED: ${am.target} eliminated. ${am.targetReason}`);
        else { ln(`  DEADLOCKED: No agreement. Rock draw.`); ln(`  ${am.rockDrawLoser} drew the wrong rock — eliminated.`); }
        am.returnEvents?.forEach(re => ln(`  ${re.tribe}: ${re.type === 'safe' ? 'Safe' : re.type === 'ambassador-eliminated' ? 'Ambassador lost' : 'Tribemate eliminated'}`));
      }
    } else if (tw.type === 'emissary-vote') {
      ln('EMISSARY VOTE — winning tribe sends an emissary to losing tribe\'s tribal.');
      if (ep.emissary) {
        ln(`${ep.emissary.name} (${ep.emissary.tribe}) volunteers to visit ${ep.emissary.targetTribe}'s tribal council.`);
      }
      if (ep.emissaryScoutEvents?.length) {
        ln('  Scouting:');
        ep.emissaryScoutEvents.forEach(evt => {
          if (evt.type === 'emissaryPitch') ln(`    PITCH: ${evt.pitcher} lobbies against ${evt.pitchTarget} (${(evt.pitchStrength * 100).toFixed(0)}% receptiveness)`);
          else if (evt.type === 'emissaryObservation') ln(`    OBSERVATION: ${evt.text}`);
          else if (evt.type === 'emissaryDeal') ln(`    DEAL: ${evt.players.join(' & ')} — cross-tribe F2 pact`);
        });
      }
      if (ep.emissaryPick) {
        ln(`  EMISSARY PICK: ${ep.emissaryPick.name} — ${ep.emissaryPick.reason}`);
      }
      if (ep.emissaryBondShifts?.length) {
        const grudges = ep.emissaryBondShifts.filter(s => s.reason === 'ally-grudge');
        const grateful = ep.emissaryBondShifts.filter(s => s.reason === 'gratitude');
        if (grudges.length) ln(`  Grudges: ${grudges.map(s => s.from).join(', ')}`);
        if (grateful.length) ln(`  Grateful: ${grateful.map(s => s.from).join(', ')}`);
      }
    } else if (tw.type === 'fan-vote-boot') {
      if (tw.fanVoteSaved) { const _fvr = tw.fanVoteIsPreMerge ? 'tribal immunity' : 'an Extra Vote'; ln(`FAN VOTE — fans saved ${tw.fanVoteSaved} (score ${tw.fanVoteScore || 0}). Receives ${_fvr}.`); }
    } else if (tw.type === 'legacy-awakens') {
      if (tw.legacyActivated) ln(`LEGACY ADVANTAGE ACTIVATES — ${tw.legacyActivated}'s Legacy Advantage fires. Immune this tribal.`);
    } else if (tw.type === 'amulet-activate') {
      if (tw.amuletActivated) ln(`AMULET ACTIVATES — ${tw.amuletActivated}'s Amulet grants immunity this episode.`);
    } else if (tw.type === 'idol-wager') {
      if (tw.idolWagerResults?.length) {
        ln('IDOL WAGER — all idol holders offered the choice:');
        tw.idolWagerResults.forEach(r => {
          if (r.decision === 'no-idols') ln('  No idol holders in the game.');
          else if (r.decision === 'declined') ln(`  ${r.holder} — DECLINED. Kept idol safe.`);
          else if (r.won) ln(`  ${r.holder} — WAGERED on ${r.challenge} (score: ${r.score}). WON. Idol upgraded to Super Idol.`);
          else ln(`  ${r.holder} — WAGERED on ${r.challenge} (score: ${r.score}). LOST. Idol destroyed.`);
        });
      }
    } else if (tw.type === 'journey') {
      ln('JOURNEY — players sent on a journey for a chance at an advantage.');
    } else if (tw.type === 'auction') {
      const a = tw.auction;
      ln('THE AUCTION ("Hell of a Deal") — each player got $500 to bid in $20 increments. Lend money, never share the goods. Ends without warning.');
      if (a) {
        if (a.hostOpener) ln(`"${a.hostOpener}"`);
        a.items.forEach(it => {
          if (!it.offered) { ln(`LOT ${it.order}: never came up — the auction ended without warning first (${it.blind ? 'a covered mystery item' : it.label}).`); return; }
          const head = it.blind ? 'a covered BLIND lot' : it.label;
          if (!it.sold) { ln(`LOT ${it.order} (${head}): no bids — the lot passed untouched.`); return; }
          ln(`LOT ${it.order} — ${it.blind ? `a BLIND lot (revealed: ${it.revealedLabel})` : it.label}:`);
          (it.narration || []).forEach(t => ln(`   ${t}`));
          const trail = it.bidLog.map(bd => `${bd.bidder} $${bd.amount}${bd.failed ? '✗' : bd.lent ? `(loan from ${bd.lent.from})` : bd.jump ? '(jump)' : ''}`).join(' → ');
          ln(`   [bid trail: ${trail}]`);
          if (it.confessional) ln(`   ${it.winner} (confessional): "${it.confessional}"`);
        });
        ln('');
        if (a.immunityMode && !a.immuneWinner) ln('RESULT: immunity never sold — NOBODY is immune. Everyone is vulnerable at the vote.');
        else if (a.immuneWinner) ln(`RESULT: ${a.immuneWinner} bought individual immunity and is safe tonight.`);
        else ln('RESULT: a reward night — immunity is still decided at the challenge.');
        ln(`Final banks: ${a.roster.map(n => `${n} $${a.budgetsRemaining[n] ?? 0}`).join(', ')}.`);
      } else if (tw.auctionResults?.length) {
        tw.auctionResults.forEach(r => ln(`${r.winner} won: ${r.label} — bid $${r.bid}.`));
      }
    } else if (tw.type === 'three-gifts') {
      ln('THE SUMMIT — one nominee per tribe chose one of three gifts.');
      if (tw.nominationDrama?.length) { ln(''); tw.nominationDrama.forEach(({ player, tribe, event }) => ln(`[${tribe}] ${event.text}`)); }
      ln('Gift 1: Tribal Survival Kit — selfless, boosts tribe comfort.');
      ln('Gift 2: Idol Clue — 65% chance of finding the idol; tribemates may notice.');
      ln('Gift 3: Immunity Totem — live idol, but tribe gets nothing. -1 bond with every tribemate.');
      if (tw.giftResults) {
        ln('');
        tw.giftResults.forEach(({ player, tribe, gift, searchOutcome }) => {
          if (gift === 1) ln(`${player} (${tribe}): Gift 1 — Survival Kit. +2 relationship with each tribemate.`);
          else if (gift === 2) {
            const idolLine = searchOutcome === 'found' ? `Found the Hidden Immunity Idol.` : searchOutcome === 'slotTaken' ? `Idol already taken.` : `Came up empty.`;
            ln(`${player} (${tribe}): Gift 2 — Idol Clue. ${idolLine}`);
          } else ln(`${player} (${tribe}): Gift 3 — Immunity Totem. Holds a live idol. Tribe got nothing.`);
        });
        if (tw.giftDrama?.length) { ln(''); tw.giftDrama.forEach(({ player, reason, affected }) => ln(`DRAMA — ${player} ${reason}. Bond penalty with: ${affected.length ? affected.join(', ') : 'the tribe'}.`)); }
      }
    }
  });

  // Journey (separate from twist array)
  if (ep.journey) {
    ln('');
    ln('JOURNEY:');
    const { travelers, results, challengeLabel, challengeDesc, challengeStat, winner } = ep.journey;
    const advLabel = { extraVote:'Extra Vote', voteSteal:'Vote Steal' };
    const travelerCtx = travelers.map(name => {
      const tribe = gs.tribes?.find(t => t.members.includes(name));
      return tribe ? `${name} (${tribe.name})` : name;
    });
    if (ep.journey.nominationDrama?.length) ep.journey.nominationDrama.forEach(({ player, tribe, event }) => ln(`[${tribe || player}] ${event.text}`));
    ln(`Travelers: ${travelerCtx.join(', ')}.`);
    if (challengeLabel && challengeDesc) { ln(`Challenge — ${challengeLabel.toUpperCase()}: ${challengeDesc}`); }
    const _isDeal = results.some(r => r.dealMade);
    if (_isDeal) {
      ln(`${travelers.join(' and ')} struck a deal — no competition, no votes lost. Both return with their votes.`);
    } else {
      results.filter(r => r.result === 'advantage').forEach(r => { const aLabel = advLabel[r.type] || r.type; ln(`${r.name} wins — takes the ${aLabel}.`); });
      results.filter(r => r.result === 'lostVote').forEach(r => ln(`${r.name} lost${winner && winner !== r.name ? ` to ${winner}` : ''}. Cannot vote at next Tribal.`));
      results.filter(r => r.result === 'safe' && !r.dealMade).forEach(r => ln(`${r.name} wins — returns with vote intact.`));
    }
  }
}

// ── EXILE ISLAND ──
export function _textExile(ep, ln, sec) {
  if (!ep.exileFormatData?.exiled) return;
  sec('EXILE ISLAND');
  const d = ep.exileFormatData;
  if (d.chooser) ln(`${d.chooser} sends ${d.exiled} to Exile Island.`);
  else ln(`${d.chooserTribe} sends ${d.exiled} to Exile Island.`);
  if (d.reasoning) ln(`Reasoning: ${d.reasoning}`);
  _textExileFound(d.exiled, d.exileFound, ln);
  ln(`${d.exiled} returns to camp and will attend tribal council.`);
  if (d.survivalDrain) ln(`Survival drain: ${d.exiled} lost ${d.survivalDrain} endurance from time on exile.`);
}

// ── LUCKY HUNT ──

// ── CAMP — POST-CHALLENGE ──
export function _textCampPost(ep, ln, sec) {
  if (!ep.campEvents || !Object.keys(ep.campEvents).length) return;
  const hasPostEvs = Object.values(ep.campEvents).some(phaseData => {
    if (Array.isArray(phaseData)) return false;
    return (phaseData?.post || []).length > 0;
  });
  if (!hasPostEvs) return;
  const _stdTypes = new Set(['tribe','team','individual','mixed',undefined,'']);
  const hasTwistChallenge = !_stdTypes.has(ep.challengeType);
  sec('CAMP — POST-CHALLENGE');
  Object.entries(ep.campEvents).forEach(([campName, phaseData]) => {
    if (Array.isArray(phaseData)) return;
    let postEvs = phaseData?.post || [];
    if (hasTwistChallenge) postEvs = postEvs.filter(e => !e.tag);
    if (!postEvs.length) return;
    if (campName !== 'merge') ln(`${campName.toUpperCase()} CAMP:`);
    postEvs.forEach(e => {
      const badge = e.badgeText ? `[${e.badgeText}] ` : '';
      ln(`- ${badge}${e.text}`);
    });
    if (ep.tipOffCampEvents?.[campName]) ln(`- ${ep.tipOffCampEvents[campName].text}`);
  });
  if (ep.tipOffCampEvents?.['merge'] && !Object.keys(ep.campEvents).includes('merge')) ln(`- ${ep.tipOffCampEvents['merge'].text}`);
}

// ── VOTING PLANS ──
export function _textVotingPlans(ep, ln, sec) {
  const allAlliances = ep.alliances || [];
  const votingLog = ep.votingLog || [];
  const tribalPlayers = ep.tribalPlayers || [];
  if (!votingLog.length) return;

  const tribeName = ep.challengeType === 'tribe' && ep.loser ? ep.loser.name : '';
  sec(tribeName ? `VOTING PLANS — ${tribeName.toUpperCase()}` : 'VOTING PLANS');

  // Early exit for non-vote episodes
  if (ep.lastChance || ep.tribeDissolve) {
    if (ep.lastChance) { const _lc = ep.lastChance; ln(`${_lc.loser} and ${_lc.winner} faced off directly. No vote — just a challenge. ${_lc.loser} lost.`); }
    else { const _td = ep.tribeDissolve; ln(`${_td.fromTribe} is dissolved. ${_td.player} joins ${_td.toTribe}. No vote.`); }
    return;
  }

  if (ep.immunityWinner && ep.challengeType !== 'tribe') ln(`${ep.immunityWinner} is safe (${ep.challengeLabel||'Mixed'} challenge). Everyone else is vulnerable.`);

  // Lost votes
  const lostVoters = (gs.lostVotes || []).filter(p => tribalPlayers.includes(p));
  if (lostVoters.length) {
    lostVoters.forEach(p => {
      const reason = ep.bewareLostVotes?.includes(p) ? 'Beware Advantage — lost vote until all tribes find theirs' : 'lost vote on journey';
      ln(`${p} — No Vote (${reason})`);
    });
    ln('');
  }

  // Alliance plans
  const namedAlliances = allAlliances.filter(a => (a.type === 'alliance' || a.type === 'consensus') && a.label && a.members.length >= 2);
  const allAllianceMembers = new Set(namedAlliances.flatMap(a => a.members));

  if (namedAlliances.length) {
    ln('ALLIANCE PLANS:');
    namedAlliances.forEach(a => {
      const canVote = a.members.filter(m => tribalPlayers.includes(m) && !lostVoters.includes(m));
      const spearheader = canVote.slice().sort((x, y) => (pStats(y).social + pStats(y).strategic) - (pStats(x).social + pStats(x).strategic))[0];
      ln(`${a.label} (${a.members.length} members, ${canVote.length} can vote)`);
      ln(`  TARGET: ${a.target || 'undecided'}`);

      // Target reasoning from actual vote log
      const targetVoter = canVote.find(m => votingLog.some(v => v.voter === m && v.voted === a.target));
      const targetReason = targetVoter ? votingLog.find(v => v.voter === targetVoter && v.voted === a.target)?.reason : null;
      if (targetReason) ln(`  REASONING: ${targetReason}`);

      ln(`  MEMBERS: ${a.members.join(', ')}`);
      if (spearheader) ln(`  SPEARHEADER: ${spearheader}`);
      if (a.splitTarget) ln(`  SPLIT VOTE: ${a.splitTarget}`);

      // Conflicted players: member whose actual vote differs from alliance target, or who has strong bond with target
      const conflicted = canVote.filter(m => {
        const actualVote = votingLog.find(v => v.voter === m);
        if (actualVote && actualVote.voted !== a.target && actualVote.voted !== a.splitTarget) return true;
        if (getBond(m, a.target) >= 3) return true;
        const sharedAlliance = (gs.namedAlliances || []).find(al => al.active !== false && al.members.includes(m) && al.members.includes(a.target));
        if (sharedAlliance) return true;
        return false;
      });
      if (conflicted.length) {
        ln(`  CONFLICTED:`);
        conflicted.forEach(m => {
          const bond = getBond(m, a.target);
          const actualVote = votingLog.find(v => v.voter === m);
          const sharedA = (gs.namedAlliances || []).find(al => al.active !== false && al.members.includes(m) && al.members.includes(a.target));
          let reason = '';
          if (actualVote && actualVote.voted !== a.target) reason = `Actually voted ${actualVote.voted} — ${actualVote.reason || 'deviated from plan'}`;
          else if (bond >= 5) reason = `Extremely close bond with ${a.target} (${bond.toFixed(1)}) — betrayal risk`;
          else if (sharedA) reason = `Also in ${sharedA.name} with ${a.target} — torn loyalties`;
          else if (bond >= 3) reason = `Strong bond with ${a.target} (${bond.toFixed(1)}) — may hesitate`;
          ln(`    ${m}: ${reason}`);
        });
      }
      ln('');
    });
  }

  // Independent votes (players not in any named alliance)
  const independents = tribalPlayers.filter(p => !allAllianceMembers.has(p) && !lostVoters.includes(p));
  if (independents.length) {
    ln('INDEPENDENT VOTES:');
    independents.forEach(p => {
      const vote = votingLog.find(v => v.voter === p);
      if (vote) ln(`  ${p} → ${vote.voted} — ${vote.reason || 'strategic read'}`);
      else ln(`  ${p} — no clear target`);
    });
    ln('');
  }

  // Primary target going into tribal
  if (ep.votes) {
    const ftSorted = Object.entries(ep.votes).sort(([,a],[,b]) => b-a);
    const topN = ftSorted[0]?.[1] || 0;
    const primaryTargets = ftSorted.filter(([,v]) => v >= topN * 0.6).slice(0, 3);
    if (primaryTargets.length) {
      ln('GOING INTO TRIBAL:');
      primaryTargets.forEach(([name, count], i) => {
        const label = i === 0 ? 'Primary Target' : i === 1 ? 'Counter Target' : 'Dark Horse';
        ln(`  ${label}: ${name} (${count} vote${count !== 1 ? 's' : ''})`);
      });
    }
  }

  // Advantages in play that could affect the vote
  const advInPlay = (ep.advantagesPreTribal || gs.advantages || []).filter(a => tribalPlayers.includes(a.holder));
  if (advInPlay.length) {
    ln('');
    ln('ADVANTAGES IN PLAY:');
    const typeLabel = { idol:'Hidden Immunity Idol', voteSteal:'Vote Steal', extraVote:'Extra Vote', kip:'Knowledge is Power', legacy:'Legacy Advantage', amulet:'Amulet', secondLife:'Second Life', teamSwap:'Team Swap', voteBlock:'Vote Block', safetyNoPower:'Safety Without Power', soleVote:'Sole Vote' };
    advInPlay.forEach(a => ln(`  ${a.holder} holds ${typeLabel[a.type] || a.type}`));
  }

  // Key confessionals — spearheader + most conflicted player
  const allSpearheaders = namedAlliances.map(a => {
    const canVote = a.members.filter(m => tribalPlayers.includes(m) && !lostVoters.includes(m));
    return canVote.slice().sort((x, y) => (pStats(y).social + pStats(y).strategic) - (pStats(x).social + pStats(x).strategic))[0];
  }).filter(Boolean);
  const confPlayers = [...new Set(allSpearheaders)].slice(0, 2);
  // Add one conflicted player if available
  const anyConflicted = tribalPlayers.find(p => {
    const actualVote = votingLog.find(v => v.voter === p);
    const myAlliance = namedAlliances.find(a => a.members.includes(p));
    return myAlliance && actualVote && actualVote.voted !== myAlliance.target;
  });
  if (anyConflicted && !confPlayers.includes(anyConflicted)) confPlayers.push(anyConflicted);

  if (confPlayers.length) {
    ln('');
    ln('KEY CONFESSIONALS:');
    confPlayers.forEach(p => {
      const vote = votingLog.find(v => v.voter === p);
      const myAlliance = namedAlliances.find(a => a.members.includes(p));
      const isConflicted = myAlliance && vote && vote.voted !== myAlliance.target;
      const isSpear = allSpearheaders.includes(p);
      const tag = isConflicted ? 'Conflicted' : isSpear ? 'Spearheader' : '';
      const reason = vote?.reason || 'strategic read';
      ln(`  ${p}${tag ? ` [${tag}]` : ''}: "${reason}"`);
    });
  }
}

// ── TRIBAL COUNCIL ──
export function _textTribalCouncil(ep, ln, sec) {
  if (!ep.votingLog?.length || ep.multiTribalResults?.length || ep.isSlasherNight || ep.isTripleDogDare) return;
  sec(ep.isFireMaking ? 'TRIBAL COUNCIL — FIRE-MAKING VOTE' : ep.firstEliminated ? 'TRIBAL COUNCIL — VOTE 1 OF 2' : 'TRIBAL COUNCIL');

  const tribal = ep.tribalPlayers || gs.activePlayers;
  const vlog = ep.votingLog || [];

  // Attendees + emotional states
  ln(`Attendees: ${tribal.join(', ')}`);
  if (ep.gsSnapshot?.playerStates) {
    const moods = tribal.map(n => {
      const state = ep.gsSnapshot.playerStates[n]?.emotional || 'content';
      return `${n}: ${state}`;
    });
    ln(`Mood: ${moods.join(', ')}`);
  }

  // Advantages played at tribal
  const advLines = [];
  (ep.idolPlays||[]).forEach(play => {
    const { player, type } = play;
    if (type === 'voteBlock') {
      advLines.push(`VOTE BLOCK: ${player} blocks ${play.blockedPlayer}'s vote. ${play.blockedPlayer} cannot vote tonight.`);
    } else if (type === 'voteSteal') {
      advLines.push(`VOTE STEAL: ${player} steals ${play.stolenFrom ? `${play.stolenFrom}'s vote` : 'a vote'}. The redirect will be read with the others.`);
    } else if (type === 'extraVote') {
      advLines.push(`EXTRA VOTE: ${player} plays an Extra Vote${play.forAlly ? ` for ${play.forAlly}` : ''}.`);
    } else if (type === 'kip') {
      if (play.failed) advLines.push(`KNOWLEDGE IS POWER: ${player} guesses ${play.stolenFrom} has an advantage — WRONG. The play fizzles.`);
      else advLines.push(`KNOWLEDGE IS POWER: ${player} takes ${play.stolenFrom}'s ${play.stolenType || 'advantage'}.`);
    } else if (type === 'soleVote') {
      advLines.push(`SOLE VOTE: ${player} plays the Sole Vote. All other votes are void — only ${player}'s vote counts.`);
    } else if (type === 'safetyNoPower') {
      advLines.push(`SAFETY WITHOUT POWER: ${player} leaves Tribal Council — safe tonight but cannot vote.${play.warned ? ` Warned ${play.warned} before leaving.` : ''}`);
    } else if (type === 'teamSwap') {
      if (play.playedFor) advLines.push(`TEAM SWAP: ${player} plays Team Swap for ${play.playedFor}. ${play.playedFor} swaps tribes instead of going home.`);
      else advLines.push(`TEAM SWAP: ${player} plays Team Swap — swaps tribes instead of going home.`);
    } else if (play.misplay) {
      advLines.push(`IDOL MISPLAY: ${player} played a Hidden Immunity Idol${play.playedFor ? ` for ${play.playedFor}` : ''} — wasted. ${play.votesNegated || 0} vote${(play.votesNegated||0) !== 1 ? 's' : ''} cancelled.`);
    } else if (play.superIdol) {
      advLines.push(`SUPER IDOL: ${player}${play.playedFor ? ` for ${play.playedFor}` : ''} — ${play.votesNegated} votes cancelled AFTER the read.`);
    } else if (play.playedFor) {
      advLines.push(`HIDDEN IMMUNITY IDOL: ${player} plays for ${play.playedFor} — all votes against ${play.playedFor} do not count.`);
    } else {
      advLines.push(`HIDDEN IMMUNITY IDOL: ${player} plays — all votes against ${player} do not count.`);
    }
  });
  if (ep.shotInDark?.player) {
    const sid = ep.shotInDark;
    advLines.push(`SHOT IN THE DARK: ${sid.player} sacrifices their vote. ${sid.safe ? `SAFE — ${sid.votesNegated||0} votes cancelled.` : 'NOT SAFE — still vulnerable.'}`);
  }
  if (advLines.length) { ln(''); ln('ADVANTAGES PLAYED:'); advLines.forEach(l => ln(l)); }

  // Word at camp — danger board (top 3 targets)
  const voteCounts = {};
  vlog.forEach(({ voted }) => { if (voted) voteCounts[voted] = (voteCounts[voted]||0)+1; });
  const dangerSorted = Object.entries(voteCounts).filter(([n]) => tribal.includes(n)).sort(([,a],[,b]) => b-a).slice(0, 3);
  if (dangerSorted.length) {
    const rankLabels = ['#1 TARGET', '#2 TARGET', '#3 WATCH'];
    const heatLabel = count => count >= 5 ? 'Heavy heat going in' : count >= 4 ? 'The writing is on the wall' : count >= 3 ? 'Numbers are pointing here' : count >= 2 ? 'The tribe is watching' : 'Floated as a possibility';
    ln('');
    ln('WORD AT CAMP:');
    dangerSorted.forEach(([name, count], i) => {
      const s = pStats(name);
      let reason = '';
      if (s.strategic >= 8) reason = 'Strategic threat — hard to beat at FTC.';
      else if ((s.physical + s.endurance) / 2 >= 8) reason = 'Challenge dominance.';
      else if (s.social >= 8) reason = 'Too well-liked. Jury threat.';
      else if (s.loyalty <= 3) reason = 'Known flipper. No one trusts the vote will hold.';
      else {
        const bloc = (ep.alliances||[]).find(a => a.target === name && a.type !== 'solo');
        reason = bloc ? `${bloc.label} made the call.` : 'Threat assessment converged here.';
      }
      ln(`  ${rankLabels[i] || '#3 WATCH'}: ${name} — ${reason} (${heatLabel(count)})`);
    });
  }

  // Tribal Q&A dialogue
  if (typeof buildTribalQA === 'function') {
    const qa = window.buildTribalQA(ep, tribal);
    if (qa.length) {
      ln('');
      ln('AT TRIBAL COUNCIL:');
      qa.forEach(item => {
        if (item.type === 'group') {
          ln(item.question);
          item.exchanges.forEach(({ player, line }) => ln(`  ${player}: "${line}"`));
          ln(`  -> ${item.consequence}`);
        } else {
          ln(item.question);
          ln(`  ${item.player}: "${item.answer}"`);
          ln(`  -> ${item.consequence}`);
        }
      });
    }
  }

  // Tribal disruption (hothead blowup)
  if (ep.tribalDisruption) {
    const td = ep.tribalDisruption;
    ln('');
    ln(`TRIBAL DISRUPTION: ${td.disruptor} erupted at tribal, calling out ${td.organizer}.`);
    ln(td.helped
      ? `The outburst made the tribe reconsider. ${td.organizer}'s plan is exposed.`
      : `The explosion confirmed suspicions — ${td.disruptor} is too volatile to keep around.`);
  }

  // Overplaying
  if (ep.overplayer) {
    const ovp = ep.overplayer;
    ln('');
    ln(`OVERPLAYING: ${ovp.player} was seen scrambling — pulling ${ovp.votersFlipped.join(' and ')} aside, too many side deals. ${ovp.votesRedirected} vote${ovp.votesRedirected !== 1 ? 's' : ''} flipped from ${ovp.originalTarget} onto ${ovp.player}.`);
  }

  // Comfort blindspot
  if (ep.comfortBlindspotPlayer && ep.comfortBlindspotPlayer === ep.eliminated) {
    ln('');
    ln(`BLINDSPOT: ${ep.comfortBlindspotPlayer} was too comfortable — checked out, didn't see the vote coming.`);
  }

  // Vote tally
  ln('');
  ln('"The votes have been cast."');
}

// ── THE VOTES (per-player reasoning) ──
export function _textTheVotes(ep, ln, sec) {
  if (!ep.votingLog?.length || ep.multiTribalResults?.length || ep.isSlasherNight || ep.isTripleDogDare) return;
  sec('THE VOTES');

  if (ep.openVote && ep.openVoteOrder?.length) {
    ln('OPEN VOTE (sequential):');
    ep.openVoteOrder.forEach((voter, pos) => {
      const entry = (ep.votingLog || []).find(e => e.voter === voter);
      if (!entry) { ln(`${voter} — [no vote]`); return; }
      const cascade = (ep.cascadeSwitches || []).find(c => c.voter === voter);
      let line = `#${pos + 1} ${voter} voted for ${entry.voted}`;
      if (cascade) line += ` [SWITCHED from ${cascade.originalTarget}]`;
      line += ` — ${entry.reason || 'strategic read'}`;
      if (pos === 0) line += ' [SETS THE TONE]';
      if (pos === ep.openVoteOrder.length - 1) line += ' [FINAL WORD]';
      ln(line);
    });
    if (ep.cascadeSwitches?.length) {
      ln('');
      ln(`CASCADE SWITCHES (${ep.cascadeSwitches.length}):`);
      ep.cascadeSwitches.forEach(c => ln(`- ${c.voter} switched from ${c.originalTarget} to ${c.newTarget} (position #${c.position + 1})`));
    }
  } else {
    const _blockedPlayers = new Set((ep.idolPlays||[]).filter(p => p.type === 'voteBlock').map(p => p.blockedPlayer));
    const _stolenPlayers = new Set((ep.idolPlays||[]).filter(p => p.type === 'voteSteal').map(p => p.stolenFrom));
    const _safetyPlayers = new Set((ep.idolPlays||[]).filter(p => p.type === 'safetyNoPower').map(p => p.player));
    ep.votingLog.forEach(({ voter, voted, reason, voteBlocked }) => {
      if (voteBlocked || _blockedPlayers.has(voter)) {
        ln(`${voter} — VOTE BLOCKED (cannot vote)`);
        return;
      }
      if (_safetyPlayers.has(voter)) {
        ln(`${voter} — LEFT TRIBAL (Safety Without Power)`);
        return;
      }
      const rv = ep.revoteLog?.find(r => r.voter === voter);
      let line = `${voter} voted for ${voted}`;
      if (_stolenPlayers.has(voter)) line += ' [VOTE STOLEN]';
      line += ` — ${reason||'strategic read'}`;
      if (rv) { const rvReason = rv.reason ? ` — ${rv.reason}` : ''; line += `; voted for ${rv.voted} on revote${rvReason}`; }
      ln(line);
    });
    // Extra votes and stolen redirects (appear as additional vote entries from the advantage holder)
    const _extraVotePlays = (ep.idolPlays||[]).filter(p => p.type === 'extraVote');
    _extraVotePlays.forEach(ev => {
      if (ev.target) ln(`${ev.player} cast an EXTRA VOTE for ${ev.target}`);
    });
    const _stealPlays = (ep.idolPlays||[]).filter(p => p.type === 'voteSteal');
    _stealPlays.forEach(sv => {
      if (sv.target) ln(`${sv.player} redirected ${sv.stolenFrom}'s stolen vote to ${sv.target}`);
    });
  }
  if (ep.revoteLog && !ep.sidFreshVote) {
    ep.tiedPlayers?.forEach(p => ln(`${p} — could not vote on revote (was in the tie)`));
    gs.lostVotes?.filter(p => ep.tribalPlayers?.includes(p)).forEach(p => {
      const reason = ep.bewareLostVotes?.includes(p) ? 'Beware Advantage — idol inactive' : 'lost vote on journey';
      ln(`${p} — [no vote — ${reason}]`);
    });
  }

  // Double elim second vote
  if (ep.firstEliminated) {
    ln('');
    ln('VOTE 2 OF 2 — DOUBLE ELIMINATION:');
    if (ep.immunityWinner2) ln(`Second immunity: ${ep.immunityWinner2}`);
    if (ep.votes2 && ep.votingLog2) {
      const vg2 = {};
      ep.votingLog2.forEach(({ voter, voted }) => { if (!vg2[voted]) vg2[voted] = []; vg2[voted].push(voter); });
      Object.entries(vg2).sort(([,a],[,b]) => b.length-a.length).forEach(([t, vs]) => ln(`${t} (${vs.length}): ${vs.join(', ')}`));
      ln('');
      ep.votingLog2.forEach(({ voter, voted, reason }) => ln(`${voter} voted for ${voted} — ${reason||'strategic read'}`));
    }
  }

  // Multi-tribal
  if (ep.multiTribalResults?.length) {
    ln(`${ep.winner?.name || '?'} tribe won immunity — safe.`);
    ep.multiTribalResults.forEach(r => {
      ln('');
      ln(`${r.tribe.toUpperCase()} TRIBAL:`);
      if (r.shotInDark) {
        const sid = r.shotInDark;
        ln(`SHOT IN THE DARK: ${sid.player} — ${sid.safe ? `SAFE, ${sid.votesNegated||0} votes cancelled` : 'NOT SAFE'}.`);
      }
      if (r.idolPlays?.length) {
        r.idolPlays.forEach(p => {
          if (p.type === 'voteBlock') ln(`VOTE BLOCK: ${p.player} blocks ${p.blockedPlayer}'s vote.`);
          else if (p.type === 'voteSteal') ln(`VOTE STEAL: ${p.player} steals ${p.stolenFrom ? `${p.stolenFrom}'s vote` : 'a vote'}.`);
          else if (p.type === 'extraVote') ln(`EXTRA VOTE: ${p.player} plays an Extra Vote.`);
          else if (p.type === 'kip') { if (p.failed) ln(`KNOWLEDGE IS POWER: ${p.player} guesses wrong — play fizzles.`); else ln(`KNOWLEDGE IS POWER: ${p.player} takes ${p.stolenFrom}'s ${p.stolenType || 'advantage'}.`); }
          else if (p.type === 'soleVote') ln(`SOLE VOTE: ${p.player} — all other votes are void.`);
          else if (p.type === 'safetyNoPower') ln(`SAFETY WITHOUT POWER: ${p.player} leaves tribal — safe but cannot vote.`);
          else if (p.type === 'teamSwap') ln(`TEAM SWAP: ${p.player}${p.playedFor ? ` for ${p.playedFor}` : ''} — swaps tribes instead of elimination.`);
          else if (p.misplay) ln(`IDOL MISPLAY: ${p.player} wasted the idol.`);
          else if (p.superIdol) ln(`SUPER IDOL: ${p.player}${p.playedFor ? ` for ${p.playedFor}` : ''} — ${p.votesNegated} votes cancelled.`);
          else if (p.playedFor) ln(`IDOL: ${p.player} for ${p.playedFor} — ${p.votesNegated} votes cancelled.`);
          else ln(`IDOL: ${p.player} — ${p.votesNegated} votes cancelled.`);
        });
      }
      const mvg = {};
      (r.log||[]).forEach(({ voter, voted }) => { if (!mvg[voted]) mvg[voted] = []; mvg[voted].push(voter); });
      Object.entries(mvg).sort(([,a],[,b]) => b.length-a.length).forEach(([t, vs]) => ln(`${t} (${vs.length}): ${vs.join(', ')}`));
      if (r.tiebreakerResult) { const tr = r.tiebreakerResult; ln(`TIE — ${(r.tiedPlayers||[]).join(', ')}. Challenge tiebreaker: ${tr.loser} loses.`); }
      if (r.sidFreshVote) ln(`All votes cancelled — fresh vote held.`);
      if (r.fireMaking) { const fm = r.fireMaking; ln(`SECOND LIFE: ${fm.player} picked ${fm.opponent}. ${fm.winner} wins, ${fm.loser} eliminated.`); }
      ln(`Voted out: ${r.eliminated || 'none'}`);
    });
    if (ep.multiTribalElims?.length > 1) ln(`\nTotal eliminated: ${ep.multiTribalElims.join(', ')}`);
  }
}

// ── WHY THIS VOTE HAPPENED ──
export function _textWhyVote(ep, ln, sec) {
  sec('WHY THIS VOTE HAPPENED');
  const elim = ep.eliminated;

  // Multi-tribal summaries
  if (ep.multiTribalResults?.length) {
    ep.multiTribalResults.forEach(r => {
      if (!r.eliminated) return;
      ln(`${r.eliminated} was voted out at ${r.tribe} tribal.`);
      if (r.tiebreakerResult) ln(`  Tied with ${(r.tiedPlayers||[]).filter(n=>n!==r.eliminated).join(', ')} — lost tiebreaker.`);
      if (r.fireMaking) ln(`  Second Life: ${r.fireMaking.player} picked ${r.fireMaking.opponent}. ${r.fireMaking.winner} survived, ${r.fireMaking.loser} eliminated.`);
      if (r.shotInDark?.safe) ln(`  Shot in the Dark saved ${r.shotInDark.player} — fresh vote followed.`);
    });
  }

  // explainBoot — inner function for vote analysis
  function explainBoot(name, votelog, alliances2) {
    if (!name) return;
    if (ep.swapResult && !ep.eliminated) {
      const sr = ep.swapResult;
      ln(`${sr.swapper} received the most votes but was NOT eliminated — Elimination Swap redirected them to ${sr.toTribe}. ${sr.swapper} chose ${sr.pickedPlayer} in exchange.`);
      return;
    }
    if (ep.exileDuelResult && name === ep.eliminated) {
      const _ed = ep.exileDuelResult;
      ln(`${_ed.exilePlayer} faced ${_ed.newBoot} in a ${_ed.challengeLabel} Exile Duel. ${_ed.winner} won. ${_ed.loser} ${ep.exileDuelToRescue ? 'was sent to ' + (ep.exileDuelRILabel || 'Rescue Island') + '.' : 'is permanently out.'}`);
      return;
    }
    if (ep.tiebreakerResult && name === ep.eliminated && !ep.firstEliminated) {
      const tr = ep.tiebreakerResult;
      ln(`${name} was eliminated in a Challenge Tiebreaker. The vote tied between ${tr.participants.join(', ')}. ${name} lost. ${tr.winner} is safe.`);
      return;
    }
    if (ep.isRockDraw && name === ep.eliminated && !ep.firstEliminated) {
      if (ep.isFullDeadlock) ln(`${name} was eliminated by rock draw after a complete deadlock. Every player received one vote. Re-vote still no majority. Pure chance.`);
      else ln(`${name} was eliminated by rock draw — was NOT in the tie and never received a vote. Pure chance.`);
      return;
    }
    if (ep.isFullDeadlock && !ep.isRockDraw && name === ep.eliminated && !ep.firstEliminated) {
      ln(`${name} was eliminated after a full deadlock re-vote. First vote was a stalemate. Fresh re-vote gave ${name} the most votes.`);
      return;
    }
    if (ep.isTie && ep.revoteLog && !ep.isRockDraw && ep.tiedPlayers?.includes(name)) {
      const other = ep.tiedPlayers.find(p => p !== name);
      const initForName = (ep.votingLog||[]).filter(l => l.voted === name).map(l => l.voter);
      const initForOther = other ? (ep.votingLog||[]).filter(l => l.voted === other).map(l => l.voter) : [];
      ln(`${name} was voted out on the revote after tying ${initForName.length}-${initForOther.length} with ${other || 'another player'}:`);
      ln(`- The tie: ${initForName.join(', ')} voted ${name} / ${initForOther.join(', ')} voted ${other}`);
      ln(`- On the revote, ${ep.tiedPlayers.join(' and ')} could not vote`);
      const held = ep.revoteLog.filter(r => { const orig = (ep.votingLog||[]).find(l => l.voter === r.voter)?.voted; return r.voted === orig; });
      const flipped = ep.revoteLog.filter(r => { const orig = (ep.votingLog||[]).find(l => l.voter === r.voter)?.voted; return r.voted !== orig; });
      if (held.length) held.forEach(r => ln(`- ${r.voter} held on ${r.voted}${r.reason ? ` — ${r.reason}` : ''}`));
      if (flipped.length) flipped.forEach(r => { const orig = (ep.votingLog||[]).find(l => l.voter === r.voter)?.voted; ln(`- ${r.voter} flipped from ${orig} to ${r.voted}${r.reason ? ` — ${r.reason}` : ''}`); });
      const rvGroups = {};
      ep.revoteLog.forEach(r => { rvGroups[r.voted] = (rvGroups[r.voted]||[]).concat(r.voter); });
      const rvSummary = Object.entries(rvGroups).sort(([,a],[,b])=>b.length-a.length).map(([t, vs]) => `${t} (${vs.length}): ${vs.join(', ')}`).join(' | ');
      ln(`- Final revote: ${rvSummary}`);
      const flippedToName = flipped.filter(r => r.voted === name);
      const heldOnName = held.filter(r => r.voted === name);
      if (flippedToName.length && heldOnName.length === 0) ln(`- ${name} went home because nobody held firm on the original anti-${name} vote — all flippers landed on ${name}`);
      else if (flippedToName.length) ln(`- ${name} went home because the flippers broke toward ${name}, giving them the revote majority`);
      else ln(`- ${name} went home because the bloc that originally targeted them held firm while the other side cracked`);
      return;
    }

    const es = pStats(name);
    const majVoters = (votelog||[]).filter(l => l.voted === name).map(l => l.voter);
    const hadAlly = (alliances2||ep.alliances||[]).find(a => a.members.includes(name) && a.type !== 'solo');
    const betrayedByAlly = hadAlly && majVoters.some(v => hadAlly.members.includes(v));
    const priorVotes = (gs.episodeHistory || []).reduce((n, h) => n + (h.votingLog||[]).filter(v => v.voted === name).length, 0);
    const hasAdv = (gs.advantages||[]).some(a => a.holder === name);
    const cw = challengeWeakness(name);
    const th = (es.physical + es.strategic + es.social) / 3;
    const thStr = th.toFixed(1);

    const logReasons = majVoters.map(v => (votelog||[]).find(l => l.voter === v && l.voted === name)?.reason).filter(Boolean);
    const reasonTypes = { personal: 0, challenge: 0, threat: 0, loyalty: 0 };
    logReasons.forEach(r => {
      if (/personal|distrust|animosity|hostility|friction|tension|dislike|rubs/i.test(r)) reasonTypes.personal++;
      else if (/challenge|weakest link|liability|costing/i.test(r)) reasonTypes.challenge++;
      else if (/threat|dangerous|puppeteer|strategic|jury|runs the game/i.test(r)) reasonTypes.threat++;
      else if (/loyal|committed|follows|aligned|alliance/i.test(r)) reasonTypes.loyalty++;
    });
    const dominantType = Object.entries(reasonTypes).sort(([,a],[,b]) => b-a)[0][0];

    ln(`${name} was voted out because:`);
    if (gs.phase === 'pre-merge' && cw >= 5.5) ln(`- Challenge liability — ${name} has been a weak link`);
    else if (th >= 7.5) ln(`- Threat level too high to ignore (${thStr}/10)`);
    else if (th >= 6 && dominantType === 'threat') ln(`- Identified as a long-term jury threat (${thStr}/10) — the group decided the window was now`);
    else if (th <= 3.5 && dominantType === 'challenge') ln(`- Seen as the weakest player — no challenge value and no strategic protection`);
    else if (dominantType === 'personal') ln(`- Personal tension — the vote was driven by distrust and friction`);
    else if (priorVotes >= 2) ln(`- The name had already come up before — the consensus vote became inevitable`);
    else ln(`- Became the consensus name — path of least resistance`);

    if (hasAdv) ln(`- Suspected of holding an advantage — more urgent to remove`);
    if (priorVotes >= 2 && dominantType !== 'personal') ln(`- Name written down ${priorVotes} time${priorVotes > 1 ? 's' : ''} before`);
    if (es.boldness >= 8 && es.loyalty <= 4) ln(`- Unpredictable and hard to control`);
    if (es.strategic >= 8 && gs.phase !== 'pre-merge') ln(`- Strategic read: ${name} was running things`);
    if (es.social >= 8 && gs.phase !== 'pre-merge') ln(`- Jury threat: genuine relationships that translate to Final Tribal votes`);

    const _txtSoleVote = (ep.idolPlays || []).find(p => p.type === 'soleVote');
    if (_txtSoleVote) ln(`- ${_txtSoleVote.player}'s Sole Vote was the only vote that counted`);
    else if (majVoters.length >= 2) ln(`- Voted out by: ${majVoters.join(', ')}`);

    if (betrayedByAlly) {
      const traitors = majVoters.filter(v => hadAlly.members.includes(v));
      const elimInNamedAlliance = gs.namedAlliances?.some(a => a.members.includes(name) && traitors.some(t => a.members.includes(t)));
      traitors.forEach(traitor => {
        const bondVal = getBond(traitor, name);
        const traitorS = pStats(traitor);
        if (!elimInNamedAlliance) {
          const doubleGame = (ep.votingLog||[]).find(l => l.voter === traitor && /broke own bloc|spearhead/i.test(l.reason||''));
          if (doubleGame) ln(`- ${traitor} played a double game — told ${hadAlly.label} to vote elsewhere, secretly put the real votes on ${name}`);
          else ln(`- ${traitor} (${hadAlly.label}) voted against ${name} — ${traitorS.strategic >= 8 ? 'calculated pivot' : 'numbers decision'}`);
        } else {
          const betrayalContext = bondVal <= -1.5 ? `personal — fractured relationship` : bondVal <= -0.5 ? `bond had been quietly eroding` : traitorS.strategic >= 8 ? `pure calculation` : traitorS.loyalty <= 3 ? `never had strong loyalty here` : `numbers more important than the alliance`;
          ln(`- Betrayed by ${traitor} (${hadAlly.label}) — ${betrayalContext}`);
        }
      });
    } else if (hadAlly) {
      const _txtElimVote = (votelog||[]).find(l => l.voter === name)?.voted;
      const _txtElimFollowed = _txtElimVote === hadAlly.target || (hadAlly.splitTarget && _txtElimVote === hadAlly.splitTarget);
      if (_txtElimFollowed) ln(`- ${hadAlly.label} tried to protect them — but was outnumbered`);
      else ln(`- ${name} broke from ${hadAlly.label}'s plan. Without protection, the vote landed on them`);
    }

    const allAlliances = alliances2 || ep.alliances || [];
    const protectors = (votelog||[]).filter(l => {
      if (l.voted === name) return false;
      if (!gs.activePlayers.includes(l.voter)) return false;
      const sharedAlliance = allAlliances.find(a => a.members.includes(l.voter) && a.members.includes(name));
      if (sharedAlliance && sharedAlliance.members.includes(l.voted)) return false;
      return sharedAlliance || getBond(l.voter, name) >= 1.5;
    });
    if (protectors.length) {
      protectors.forEach(l => {
        const sharedA = allAlliances.find(a => a.members.includes(l.voter) && a.members.includes(name));
        const context = sharedA ? `voted ${l.voted} to hold ${sharedA.label} together — it wasn't enough` : `voted ${l.voted} — tried to pull the numbers a different way`;
        ln(`- ${l.voter} ${context}`);
      });
    }

    if (ep.idolGiveBetrayal?.victim === name) {
      const gb = ep.idolGiveBetrayal;
      ln(`- Had an idol — willingly gave it to ${gb.schemer} before tribal`);
      ln(`  ${gb.schemer} convinced ${name} to hand it over. ${gb.schemer} voted for ${name}. The idol is gone.`);
    }
    const receivedShare = ep.idolShares?.find(sh => sh.to === name);
    if (receivedShare) ln(`- ${receivedShare.from} passed their idol to ${name} before tribal — ${name} went in holding it`);
    const misplay = ep.idolMisplays?.find(m => m.player === name);
    if (misplay) {
      ln(`- Held an idol — and never played it`);
      const inTiebreaker = ep.tiebreakerResult?.participants?.includes(name);
      if (inTiebreaker) ln(`  Idol window closed when the tie was called — idols can only be played before votes are read`);
      else if (misplay.holderVotedFor) ln(`  ${name} voted for ${misplay.holderVotedFor} — thought they were safe`);
      else ln(`  ${misplay.votesAgainst} vote(s) against — didn't feel dangerous enough`);
      const betrayal = ep.idolBetrayals?.find(b => b.holder === name);
      const witnessed = ep.idolFinds?.find(f => f.finder === name && f.witnesses?.length);
      if (betrayal) ln(`  ${betrayal.betrayer} knew about the idol and sold that information before tribal`);
      else if (witnessed) ln(`  ${witnessed.witnesses.join(', ')} saw ${name} searching at camp`);
      else if (misplay.tipOffAlly) { const tipS = pStats(misplay.tipOffAlly); ln(`  ${misplay.tipOffAlly} (intuition ${tipS.intuition}/10) was at tribal — perceptive enough to have warned them. Nobody did`); }
      else ln(`  No ally was well-positioned to warn them`);
    }

    if (ep.tipOffBetrayalFired && ep.tipOffBetrayalFired.saved !== name) {
      const tb = ep.tipOffBetrayalFired;
      ln(`- ${tb.tipper} crossed alliance lines to warn ${tb.saved}. ${tb.saved} played the idol because of it.`);
      ln(`  ${tb.tipper}'s position inside ${tb.allianceName} is now damaged.`);
    }
  }

  // Main elimination explanation
  if (ep.firstEliminated) {
    explainBoot(ep.firstEliminated, ep.votingLog, ep.alliances);
    ln('');
    explainBoot(elim, ep.votingLog2, null);
  } else if (ep.fireMaking) {
    const fm = ep.fireMaking;
    const _fmDN = fm.duelName || 'Fire-Making';
    const _fmSrc = fm.fromAmulet ? 'Second Life Amulet' : 'Second Life';
    if (fm.winner === fm.player) {
      ln(`${fm.player} received the most votes but activated ${_fmSrc} — picked ${fm.opponent} for the ${_fmDN} duel and won.`);
      ln(`${fm.opponent} lost the ${_fmDN} duel — eliminated.`);
    } else {
      explainBoot(fm.player, ep.votingLog, ep.alliances);
      ln(`${fm.player} activated ${_fmSrc}, picked ${fm.opponent} for the ${_fmDN} duel, but lost — eliminated.`);
    }
  } else if (elim) {
    explainBoot(elim, ep.votingLog, ep.alliances);
    if (ep.isTie && !ep.isRockDraw && !ep.tiebreakerResult) ln(`- Went to a revote`);
    if (ep.tiebreakerResult && !ep.firstEliminated) {
      const tr = ep.tiebreakerResult;
      ln(`- The vote tied between ${tr.participants.join(' and ')} — no revote, straight to a head-to-head ${tr.challengeLabel} challenge.`);
      ln(`- ${tr.loser} lost the tiebreaker to ${tr.winner}. ${tr.winner} is safe. ${tr.loser} is out.`);
    }
  } else if (ep.lastChance) {
    const _lc = ep.lastChance;
    const _lcWS = pStats(_lc.winner); const _lcLS = pStats(_lc.loser);
    ln(`${_lc.loser} and ${_lc.winner} went head-to-head in ${_lc.challengeLabel}.`);
    ln(`- ${_lc.winner} (score: ~${Math.round(_lcWS.physical * 0.5 + _lcWS.endurance * 0.5)}) outlasted ${_lc.loser} (score: ~${Math.round(_lcLS.physical * 0.5 + _lcLS.endurance * 0.5)}).`);
    if (_lc.toTribe) ln(`- ${_lc.winner} joins ${_lc.toTribe}. ${ep.loser?.name} is gone.`);
  } else if (ep.tribeDissolve) {
    const _td = ep.tribeDissolve;
    ln(`No vote this episode. ${_td.fromTribe} dissolved. ${_td.player} is now on ${_td.toTribe}.`);
  } else {
    ln('No elimination this episode.');
  }

  // Faction meltdown detection
  const allLogs = [...(ep.votingLog || []), ...(ep.votingLog2 || [])];
  (ep.alliances || []).forEach(alliance => {
    if (!alliance.target || !alliance.label || alliance.type === 'solo') return;
    const memberSet = new Set(alliance.members);
    if (memberSet.size < 2) return;
    const memberVotes = allLogs.filter(l => memberSet.has(l.voter));
    if (memberVotes.length < 2) return;
    const votedTarget = memberVotes.filter(l => l.voted === alliance.target);
    const votedInternal = memberVotes.filter(l => memberSet.has(l.voted));
    const votedOther = memberVotes.filter(l => l.voted !== alliance.target && !memberSet.has(l.voted));
    const isMeltdown = votedTarget.length === 0 && votedInternal.length >= 2;
    const isFracture = votedTarget.length < Math.ceil(memberVotes.length / 2) && votedInternal.length >= 1;
    if (!isMeltdown && !isFracture) return;
    const chainParts = memberVotes.map(l => `${l.voter}→${l.voted}`);
    if (isMeltdown) {
      ln('');
      ln(`FACTION COLLAPSE — ${alliance.label} (${alliance.members.join(', ')})`);
      ln(`- Stated plan: vote ${alliance.target}`);
      ln(`- What happened: ${chainParts.join(', ')}`);
      ln(`- Zero members voted the stated target — they scattered`);
      if (votedInternal.length > 0) ln(`- Internal votes: ${votedInternal.map(l => `${l.voter}→${l.voted}`).join(', ')} — the group ate itself`);
    } else if (isFracture) {
      ln('');
      ln(`FACTION FRACTURE — ${alliance.label} split at tribal`);
      ln(`- Stated plan: vote ${alliance.target}`);
      ln(`- Votes cast: ${chainParts.join(', ')}`);
      if (votedInternal.length > 0) ln(`- Members voted each other: ${votedInternal.map(l => `${l.voter}→${l.voted}`).join(', ')}`);
      if (votedOther.length > 0) ln(`- Stray votes: ${votedOther.map(l => `${l.voter}→${l.voted}`).join(', ')}`);
    }
  });

  // Post-elimination twists
  const _elimSwapTw = (ep.twists||[]).find(t => t.type === 'elimination-swap');
  const _exileDuelTw = (ep.twists||[]).find(t => t.type === 'exile-duel');
  const _fireMakingTw = (ep.twists||[]).find(t => t.type === 'fire-making');
  const _tiebrkTw = (ep.twists||[]).find(t => t.type === 'tiebreaker-challenge');
  if (_elimSwapTw && ep.swapResult) {
    const sr = ep.swapResult;
    ln('');
    ln(`ELIMINATION SWAP — ${sr.swapper} was voted out but moves to ${sr.toTribe}. Nobody eliminated.`);
    ln(`${sr.swapper} chose ${sr.pickedPlayer} from ${sr.toTribe} in exchange.`);
  }
  if (_exileDuelTw && ep.exilePlayer) { ln(''); ln(`EXILE DUEL — ${ep.exilePlayer} voted out but sent to exile. Next episode: duel whoever gets voted out.`); }
  if (_fireMakingTw && ep.fireMaking) { const fm = ep.fireMaking; ln(''); ln(`SECOND LIFE — ${fm.player} was voted out but gets a second chance. Picks ${fm.opponent}. ${fm.winner} wins. ${fm.loser} eliminated.`); }
  // Jury elimination is transcribed in full by _textJuryElimination() (tribal-council slot), not here.
  if (_tiebrkTw && ep.tiebreakerResult) { const tr = ep.tiebreakerResult; ln(''); ln(`CHALLENGE TIEBREAKER — vote tied. ${tr.participants.join(', ')} competed. ${tr.loser} lost. ${tr.winner} survived.`); }

  // Tribal blowup (high-boldness exit explosion)
  if (ep.tribalBlowup) {
    const tb = ep.tribalBlowup;
    ln('');
    ln(`TRIBAL BLOWUP — ${tb.player}:`);
    if (tb.reveals?.length) tb.reveals.forEach(r => {
      ln(`  "${r.text}"`);
      if (r.consequence) ln(`  -> ${r.consequence}`);
    });
  }

  // Crashout (bold eliminated player's last words + reveals)
  if (!ep.tribalBlowup) {
    const crashout = buildCrashout(ep);
    if (crashout) {
      ln('');
      ln(`CRASHOUT — ${crashout.player} — Last Words:`);
      crashout.reveals.forEach(r => {
        ln(`  "${r.text}"`);
        if (r.consequence) ln(`  -> ${r.consequence}`);
      });
    }
  }

  // Exit quote for the eliminated player
  if (elim) {
    const elimP = players.find(p => p.name === elim);
    const arch = elimP?.archetype || '';
    const archLabel = arch ? arch.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : '';
    ln('');
    ln(`${elim}${archLabel ? ` (${archLabel})` : ''} — the tribe has spoken.`);
    const exitQuote = vpGenerateQuote(elim, ep, 'eliminated');
    if (exitQuote) ln(`"${exitQuote}"`);
  }

  // Black vote cast on exit
  if (ep.blackVote) {
    ln('');
    const bv = ep.blackVote;
    if (bv.type === 'classic') ln(`BLACK VOTE CAST: ${bv.from} casts a Black Vote against ${bv.target} before leaving. This vote counts at the next tribal.`);
    else ln(`BLACK VOTE CAST: ${bv.from} gifts an Extra Vote to ${bv.recipient} before leaving.`);
    if (bv.reason) ln(`  Reason: ${bv.reason}`);
  }
  if (ep.blackVoteApplied) ln(`BLACK VOTE APPLIED: ${ep.blackVoteApplied.from}'s vote against ${ep.blackVoteApplied.target} counts tonight.`);

  // Voted out summary
  const cfg = seasonConfig;
  ln('');
  ln('VOTED OUT THIS EPISODE:');
  if (ep.multiTribalElims?.length) ln(ep.multiTribalElims.join(', '));
  else if (ep.emissaryEliminated) {
    ln(`1. ${elim || '???'} — Tribal Vote`);
    ln(`2. ${ep.emissaryEliminated} — Emissary Pick (${ep.emissary?.name || 'emissary'})`);
  } else if (ep.firstEliminated) {
    ln(`1. ${ep.firstEliminated}${cfg.ri && ep.firstRIChoice ? ` — ${ep.firstRIChoice}` : ''}`);
    ln(`2. ${elim || '???'}${cfg.ri && ep.riChoice ? ` — ${ep.riChoice}` : ''}`);
  } else if (ep.isSlasherNight && ep.slasherNight?.eliminated) ln(ep.slasherNight.eliminated + ' — Slasher Night (lowest score)');
  else if (ep.isTripleDogDare && ep.tripleDogDare?.eliminated) ln(ep.tripleDogDare.eliminated + ' — Triple Dog Dare (failed dare)');
  else if (ep.lastChance) ln(`${ep.lastChance.loser} — Last Chance Challenge (lost to ${ep.lastChance.winner})`);
  else if (elim) { ln(elim); if (cfg.ri) ln(`Chose: ${ep.riChoice || 'N/A'}`); }
  else ln('No elimination.');
}

// ── AWAKE-A-THON ──

// ── DODGEBRAWL ──

// ── TALENT SHOW ──

// ── SUCKY OUTDOORS ──

// ── UP THE CREEK ──



// ── TRUST CHALLENGE ──

// ── PHOBIA FACTOR ──


// ── SAY UNCLE ──

// ── BASIC STRAINING ──

// ── BRUNCH OF DISGUSTINGNESS ──

// ── X-TREME TORTURE ──

// ── TRIPLE DOG DARE ──

// ── SLASHER NIGHT ──

// ── AMBASSADORS ──
export function _textAmbassadors(ep, ln, sec) {
  if (!ep.ambassadorData?.ambassadorMeeting) return;
  sec('AMBASSADORS');
  const am = ep.ambassadorData.ambassadorMeeting;
  am.types?.forEach(t => ln(`Ambassador: ${t.name} — ${t.type}`));
  ln('MEETING:');
  am.narrative?.forEach(beat => ln(`  ${beat}`));
  if (am.agreed) ln(`AGREED: ${am.target} eliminated. ${am.targetReason}`);
  else ln(`DEADLOCKED: Rock draw. ${am.rockDrawLoser} eliminated.`);
  ln('RETURN:');
  am.returnEvents?.forEach(re => {
    // 2-tribe negotiations carry a multi-beat dramatic scene; 3+-tribe coalitions carry a
    // single text line. Render whichever exists so the full detail always appears.
    if (re.beats?.length) re.beats.forEach(b => ln(`  [${re.tribe}] ${b}`));
    else if (re.text) ln(`  [${re.tribe}] ${re.text}`);
  });
}

// ── RI DUEL / RESCUE ISLAND ──
export function _textRIDuel(ep, ln, sec) {
  // Life events (training, mental arcs, pre-duel tension)
  const lifeEvts = (ep.riLifeEvents || []).filter(e =>
    !['winner-relief','winner-hardened','winner-streak','winner-obsessed',
      'loser-graceful','loser-bitter','loser-emotional','loser-neutral'].includes(e.type));
  if (lifeEvts.length) {
    sec('REDEMPTION ISLAND — LIFE ON THE ISLAND');
    lifeEvts.forEach(e => ln(`- ${e.text || e.type}`));
  }

  if (ep.riDuel) {
    const d = ep.riDuel;
    sec('REDEMPTION ISLAND — THE ARENA');
    const duelists = d.duelists || [d.winner, d.loser];
    ln(`Duelists: ${duelists.join(' vs ')}`);
    if (d.challenge?.name) ln(`Challenge: ${d.challenge.name}${d.challenge.desc ? ' — ' + d.challenge.desc : ''}`);
    else if (d.challengeLabel) ln(`Challenge: ${d.challengeLabel}${d.challengeDesc ? ' — ' + d.challengeDesc : ''}`);
    if (d.preStreakData) {
      Object.entries(d.preStreakData).forEach(([name, count]) => {
        if (count >= 2) ln(`${name} enters with a ${count}-duel win streak.`);
      });
    } else if (d.streakData) {
      Object.entries(d.streakData).forEach(([name, count]) => {
        if (count >= 2) ln(`${name} enters with a ${count}-duel win streak.`);
      });
    }
    const _duelPhases = d.phases || d.exchanges || [];
    if (_duelPhases.length) {
      _duelPhases.forEach((p, i) => {
        ln(`${p.name || `Round ${i + 1}`}: ${p.narration} [${p.winner} wins, margin ${p.margin.toFixed(2)}]`);
      });
    }
    if (d.breathingMoments?.length) {
      d.breathingMoments.filter(Boolean).forEach(m => {
        ln(`[${m.badgeText || m.type}] ${m.text}`);
      });
    }
    if (d.tiebreaker) {
      ln(`TIEBREAKER (${d.tiebreaker.stat}): ${d.tiebreaker.winner} takes it.`);
    }
    ln(`Result: ${d.winner} survives — remains on Redemption Island.`);
    ln(`${d.loser} is permanently eliminated.`);
    const riWords = _riLastWords(d.loser, d.winner, d, ep);
    if (riWords) ln(`"${riWords}"`);

    // Post-duel events
    const postEvts = (ep.riLifeEvents || []).filter(e =>
      ['winner-relief','winner-hardened','winner-streak','winner-obsessed',
       'loser-graceful','loser-bitter','loser-emotional','loser-neutral'].includes(e.type));
    postEvts.forEach(e => ln(`- ${e.text}`));
  }

  if (ep.rescueIslandEvents?.length) {
    sec('RESCUE ISLAND');
    ep.rescueIslandEvents.forEach(e => ln(`- ${e.text || e.type}`));
  }
}

// ── JURY LIFE ──
export function _textJuryLife(ep, ln, sec) {
  if (!ep.juryLife?.length) return;
  sec('JURY LIFE');
  ep.juryLife.forEach(j => ln(`- ${j.text || j}`));
}

// ── INTERLUDE EPISODE (non-elimination): rescue-island camp or jury-house motel ──
export function _textInterlude(ep, ln, sec) {
  const d = ep.interlude || ep.juryHouse;
  const jury = ep.interludeMode === 'jury-house';
  sec(jury ? 'THE JURY MOTEL' : 'RESCUE ISLAND');
  ln(jury
    ? 'A non-elimination interlude — nobody goes home. The jury, out of the game for good, shares a motel: processing, feuding, and debating who deserves the win.'
    : 'A non-elimination interlude — nobody goes home. The marooned cast, still fighting for a way back in, survives Rescue Island together.');
  ln(`Residents: ${(d?.residents || []).join(', ') || '—'}`);
  const renderRoundtable = (rt) => {
    ln('  The jury debates who deserves the win:');
    rt.lines.forEach(l => { ln(`    On ${l.finalist}:`); ln(`      + ${l.backText}`); ln(`      - ${l.doubtText}`); });
  };
  const clean = (t) => String(t).replace(/<\/?b>/g, '');
  if (d?.acts?.length) {
    d.acts.forEach((act, i) => {
      ln(''); ln(`--- ACT ${i + 1}: ${act.title} ---`);
      (act.beats || []).forEach(e => ln(`- ${e.badge ? `[${e.badge}] ` : ''}${clean(e.text)}`));
      if (act.roundtable) renderRoundtable(act.roundtable);
    });
  } else {
    ln('');
    (d?.events || []).forEach(e => ln(`- ${e.badge ? `[${e.badge}] ` : ''}${clean(e.text)}`));
    if (d?.roundtable?.lines?.length) renderRoundtable(d.roundtable);
  }
  if (d?.teaser) { ln(''); ln(d.teaser); }
}

// ── JURY ELIMINATION TWIST (mid-game): the eliminated players vote out an active player ──
// Full retranscription of the VP screens (Jury Convenes + Jury Votes). Vote reasons are pulled
// straight from the pure rpBuildJuryVotes builder (via its data- attributes), so the text matches
// the VP narration exactly without re-running rpBuildJuryLife (which mutates bonds).
export function _textJuryElimination(ep, ln, sec) {
  const tw = (ep.twists || []).find(t => t.type === 'jury-elimination' && t.juryBooted);
  if (!tw) return;
  const jBooted = tw.juryBooted;
  const jLog = tw.elimLog || [];
  const jVotes = tw.elimVotes || {};
  const jurors = [...new Set(jLog.map(e => e.juror))];

  sec('JURY ELIMINATION');
  ln('The eliminated players convene. Tonight the jury votes to remove one active player from the game — no tribal council.');
  if (jurors.length) ln(`The Jury: ${jurors.join(', ')}.`);
  if (ep.immunityWinner) ln(`Immune (cannot be targeted): ${ep.immunityWinner}.`);

  const candidates = Object.keys(jVotes);
  if (candidates.length) {
    ln('');
    ln('Vulnerable:');
    candidates.forEach(c => {
      const avg = jurors.length ? jurors.reduce((s, j) => s + getBond(j, c), 0) / jurors.length : 0;
      const label = avg <= -1 ? 'burned bridges with the jury' : avg <= 1 ? 'mixed relationships with the jury' : 'well-liked by the jury';
      ln(`- ${c} — ${label}`);
    });
  }

  // Exact vote reasons from the VP builder (pure — no side effects)
  const reasonMap = {};
  try {
    const html = rpBuildJuryVotes(ep) || '';
    const dec = s => s.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ').trim();
    const re = /data-voted="([^"]+)"\s+data-voter="([^"]+)"[\s\S]*?class="tv-vote-reason">([\s\S]*?)<\/div>/g;
    let m;
    while ((m = re.exec(html))) reasonMap[dec(m[2]) + '||' + dec(m[1])] = dec(m[3]);
  } catch (e) { /* VP builder unavailable — fall back to reason-less lines */ }

  if (jLog.length) {
    ln('');
    ln('The Jury Votes:');
    jLog.forEach(({ juror, votedOut }) => {
      const reason = reasonMap[juror + '||' + votedOut];
      ln(`${juror} → ${votedOut}${reason ? `: "${reason}"` : ''}`);
    });
  }

  const tally = Object.entries(jVotes).sort((a, b) => b[1] - a[1]);
  if (tally.length) {
    ln('');
    ln('Jury Tally:');
    tally.forEach(([name, count]) => ln(`  ${name}: ${count}`));
  }

  if (tw.juryTie && (tw.juryTiedPlayers || []).length > 1) {
    ln('');
    ln(`Jury deadlock — ${tw.juryTiedPlayers.join(' and ')} tied. After further deliberation, the jury settled on ${jBooted}.`);
  }

  const place = (ep.gsSnapshot?.activePlayers ?? gs.activePlayers ?? []).length + 1;
  const ord = n => { const s = ['th', 'st', 'nd', 'rd'], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); };
  ln('');
  ln(`JURY ELIMINATION — ${jBooted} was eliminated by the jury (${ord(place)} place).`);
}

// ── CAMP OVERVIEW ──
export function _textCampOverview(ep, ln, sec) {
  sec('CAMP OVERVIEW');

  // Current advantages
  const typeLabel = { idol:'Hidden Immunity Idol', voteSteal:'Vote Steal', extraVote:'Extra Vote', kip:'Knowledge is Power', legacy:'Legacy Advantage', amulet:'Amulet Advantage', secondLife:'Second Life Amulet', teamSwap:'Team Swap', voteBlock:'Vote Block', safetyNoPower:'Safety Without Power', soleVote:'Sole Vote' };
  const _hasBewares = gs.bewares && Object.values(gs.bewares).some(b => b.holder && !b.activated);
  if (gs.advantages.length || _hasBewares) {
    ln('ADVANTAGES IN PLAY:');
    if (gs.bewares) Object.values(gs.bewares).forEach(b => {
      if (b.holder && !b.activated && gs.activePlayers.includes(b.holder)) ln(`- ${b.holder}: Beware Advantage (idol INACTIVE — VOTE RESTRICTED)`);
    });
    gs.advantages.forEach(adv => {
      const label = adv.fromBeware ? 'Hidden Immunity Idol (Beware — activated)' : adv.fromTotem ? 'Immunity Totem' : (typeLabel[adv.type] || adv.type);
      ln(`- ${adv.holder}: ${label} (found ep.${adv.foundEp})`);
    });
  }

  // Current game status
  ln('');
  if (gs.phase === 'pre-merge' && gs.tribes.length) gs.tribes.forEach(t => ln(`${t.name.toUpperCase()} (${t.members.length}): ${t.members.join(', ')}`));
  else ln(`Active (${gs.activePlayers.length}): ${gs.activePlayers.join(', ')}`);
  if (gs.riPlayers.length) ln(`On RI: ${gs.riPlayers.join(', ')}`);
  if (gs.eliminated.length) ln(`Permanently out: ${gs.eliminated.join(', ')}`);
}

// ── AFTERMATH ──

// NOTE: renamed from _textAftermath to avoid shadowing the TDI Aftermath version below
export function _textAftermathStrategic(ep, ln, sec) {
  sec('AFTERMATH');

  // Strategic analysis
  const elim = ep.eliminated;
  if (ep.tiebreakerResult && !ep.firstEliminated) {
    const tr = ep.tiebreakerResult;
    ln(`The vote tied — ${tr.participants.join(', ')} competed in a ${tr.challengeLabel} challenge. ${tr.loser} was eliminated. ${tr.winner} survived.`);
  } else if (ep.lastChance) {
    const _lc = ep.lastChance;
    const _wS = pStats(_lc.winner); const _lS = pStats(_lc.loser);
    ln(`No vote. ${_lc.loser} and ${_lc.winner} competed in ${_lc.challengeLabel}. Result came down to performance.`);
    ln(`${_lc.winner} (phys: ${_wS.physical}, end: ${_wS.endurance}) outlasted ${_lc.loser} (phys: ${_lS.physical}, end: ${_lS.endurance}).`);
  } else if (ep.isRockDraw && elim) {
    if (ep.isFullDeadlock) {
      ln(`${elim} was eliminated by rock draw after full deadlock. All players were at equal risk.`);
      const others = (ep.tiedPlayers || []).filter(p => p !== elim);
      if (others.length) ln(`${others.join(', ')} survive${others.length === 1 ? 's' : ''} — equally lucky.`);
    } else {
      ln(`${elim} was eliminated by rock draw — nobody chose to write their name down. Chance decided.`);
      const tied = ep.tiedPlayers?.filter(p => p !== elim).join(' and ') || 'the tied players';
      ln(`${tied} were in the tie and are safe. ${elim} drew the unlucky rock.`);
    }
  } else if (elim && ep.votes) {
    const totalVotes = Object.values(ep.votes).reduce((a,b)=>a+b, 0);
    const topVotes = Math.max(...Object.values(ep.votes), 0);
    if (topVotes === totalVotes) ln(`Unanimous vote (${topVotes}-0). ${elim} had no allies at the table.`);
    else ln(`${elim} received ${topVotes} of ${totalVotes} votes.`);
    const _saElim = ep.eliminated || ep.firstEliminated;
    const dominant = ep.alliances?.find(a=>a.members.length>=(ep.tribalPlayers?.length||0)/2);
    if (dominant) {
      const domLeader = dominant.members.find(m => gs.activePlayers.includes(m) && m !== _saElim) || dominant.members[0];
      const ls = pStats(domLeader);
      const elimVoteShare = (ep.votes?.[_saElim] || 0) / Math.max(1, totalVotes);
      const planWorked = (dominant.target === _saElim) || (elimVoteShare > 0.5);
      if (domLeader !== _saElim && planWorked && ls.strategic >= 8) ln(`${domLeader} is orchestrating votes with precision — a long-term threat nobody is naming yet.`);
      else if (domLeader !== _saElim && planWorked) ln(`${dominant.members.filter(m=>m!==_saElim).join(', ')} held the numbers and didn't crack.`);
      else if (domLeader !== _saElim && !planWorked) ln(`${domLeader}'s bloc had the numbers but their stated target survived.`);
      else ln(`${dominant.members.join(', ')} held the numbers.`);
    }
    const wasTargeted = (ep.alliances||[]).some(a => a.target === _saElim);
    if (!wasTargeted && _saElim) ln(`${_saElim} was not the stated target of any alliance — this elimination was unplanned.`);
  }

  // Season-long arcs (multi-episode continuity) — feeds "continuation" feel
  const arcs = buildSeasonArcs(ep);
  if (arcs.length) {
    ln('');
    ln('SEASON ARCS (multi-episode threads to CONTINUE and ESCALATE — these have been building; reference and advance them, do not reset them each episode):');
    arcs.forEach(s => ln(`- ${s}`));
  }

  // Ongoing storylines
  ln('');
  ln('ONGOING STORYLINES:');
  buildStorylines(ep).forEach(s => ln(`- ${s}`));
}

// ── SEASON ARCS: multi-episode narrative threads derived from history ──
// Unlike buildStorylines (which reads the CURRENT episode's state), this reads
// ACROSS gs.episodeHistory + votingHistory + popularity + showmances to surface
// threads that have been BUILDING over time — so the writer can continue and
// escalate them instead of treating every episode as a fresh start. Returns a
// capped list of plain-string arc beats. No-op early in the season.
export function buildSeasonArcs(ep) {
  const lines = [];
  const hist = (gs.episodeHistory || []).filter(h => h && h.num < ep.num);
  if (hist.length < 2) return lines; // need a couple episodes of history for arcs
  const active = new Set(gs.activePlayers || []);
  const bKey = (a, b) => [a, b].sort().join('|');

  // 1. PERENNIAL TARGETS — players whose name keeps coming up at tribal but who survive.
  const voteCounts = {}; // name -> number of episodes they received >=1 vote
  hist.forEach(h => {
    const v = h.votes || {};
    Object.keys(v).forEach(n => { if (v[n] > 0 && n !== h.eliminated) voteCounts[n] = (voteCounts[n] || 0) + 1; });
  });
  Object.entries(voteCounts)
    .filter(([n, c]) => active.has(n) && c >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .forEach(([n, c]) => lines.push(`${n} has had votes cast against them at ${c} different Tribals and is STILL here — a survivor/escape-artist arc. The tribe keeps coming for ${pronouns(n).obj} and keeps failing. That tension should be acknowledged and is overdue for a payoff.`));

  // 2. CHALLENGE THREAT — repeat immunity winners.
  const immCounts = {};
  hist.forEach(h => { if (h.immunityWinner) immCounts[h.immunityWinner] = (immCounts[h.immunityWinner] || 0) + 1; });
  Object.entries(immCounts)
    .filter(([n, c]) => active.has(n) && c >= 2)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .forEach(([n, c]) => lines.push(`${n} has won immunity ${c} times — an established challenge threat. Allies value it; rivals fear what happens if ${pronouns(n).sub} keeps winning when the numbers tighten.`));

  // 3. SHOWMANCE PROGRESSION — active romances with longevity, and recent breakups.
  (gs.showmances || []).forEach(sh => {
    const [a, b] = sh.players || [];
    if (!a || !b) return;
    if (!sh.broken && active.has(a) && active.has(b)) {
      const eps = sh.episodesActive || 0;
      if (eps >= 2) lines.push(`${a} and ${b} have been a showmance for ${eps} episode(s) now — it's no longer a secret. The longer it lasts, the bigger the target on both of them, and the harder the eventual "the game vs. the relationship" choice gets.`);
      else lines.push(`${a} and ${b}'s showmance is still new and fragile — others are starting to notice. Show it deepening or straining, not static.`);
    } else if (sh.broken && sh.breakupEp && sh.breakupEp >= ep.num - 2 && (active.has(a) || active.has(b))) {
      lines.push(`The ${a}/${b} showmance recently fell apart${sh.breakupVoter ? ` (${sh.breakupVoter} was involved)` : ''}. That wreckage is still fresh — the fallout shapes how they move now.`);
    }
  });

  // 4. POPULARITY POLES — the season's emerging hero and its emerging villain.
  const pop = gs.popularity || {};
  const ranked = Object.entries(pop).filter(([n]) => active.has(n)).sort((a, b) => b[1] - a[1]);
  if (ranked.length >= 3) {
    const [topN, topV] = ranked[0];
    const [botN, botV] = ranked[ranked.length - 1];
    if (topV >= 4) lines.push(`${topN} has quietly become the season's fan-favorite/hero figure — the camp gravitates to ${pronouns(topN).obj}. That likability is itself a late-game threat worth seeding now.`);
    if (botV <= -4) lines.push(`${botN} has hardened into the season's villain in the eyes of the others — moves keep landing badly for ${pronouns(botN).posAdj} reputation. Lean into that heel arc.`);
  }

  // 5. ESCALATING FEUD — the deepest-running rivalry among active players.
  const feuds = [];
  active.forEach(a => active.forEach(b => {
    if (a >= b) return;
    const v = gs.bonds?.[bKey(a, b)] || 0;
    if (v <= -4) feuds.push({ a, b, v });
  }));
  feuds.sort((x, y) => x.v - y.v);
  if (feuds[0]) lines.push(`${feuds[0].a} vs ${feuds[0].b} is the season's nastiest running feud and it has only gotten worse. This needs to keep escalating toward a head — don't let it quietly reset to civil.`);

  // 6. POWER PLAYER — alliance leader who has steered multiple votes.
  const ctrl = {};
  hist.forEach(h => {
    (h.alliances || []).forEach(al => {
      if (al.target && al.target === h.eliminated && al.members?.length) {
        const lead = al.spearhead || al.members[0];
        if (lead) ctrl[lead] = (ctrl[lead] || 0) + 1;
      }
    });
  });
  const topCtrl = Object.entries(ctrl).filter(([n, c]) => active.has(n) && c >= 2).sort((a, b) => b[1] - a[1])[0];
  if (topCtrl) lines.push(`${topCtrl[0]} has gotten ${pronouns(topCtrl[0]).posAdj} way at ${topCtrl[1]}+ votes now — a quiet kingmaker arc. At some point the others realize ${pronouns(topCtrl[0]).sub} ${pronouns(topCtrl[0]).sub === 'they' ? 'have' : 'has'} been running things. Build toward that reckoning.`);

  return lines.slice(0, 8);
}

// ── TRACKED ARCS: reader-facing, status-gated, mortal storyline threads ──
// Unlike buildSeasonArcs (always-on writer instructions), this returns STRUCTURED arcs and only
// surfaces a thread when it actually MOVED this episode or is DUE FOR PAYOFF — dormant threads
// stay silent (anti-repetition). Arcs resolve and retire once paid off. Capped at 3/episode,
// prioritised payoffs > peaks > builds so no episode is a checklist of every thread.
// Returns [{ type, players, status:'building'|'peaking'|'resolved', intensity, summary, payoff }].
export function buildTrackedArcs(ep) {
  const arcs = [];
  const hist = (gs.episodeHistory || []).filter(h => h && h.num < ep.num);
  if (hist.length < 2 && !ep.isFinale) return arcs; // need a little history before threads exist
  const active = new Set(gs.activePlayers || []);
  const bKey = (a, b) => [a, b].sort().join('|');
  const elimThis = new Set([ep.eliminated, ep.firstEliminated, ep.suddenDeathEliminated].filter(Boolean));
  const votesThis = ep.votes || {};
  const vlogThis = ep.votingLog || [];
  const isFinale = !!ep.isFinale;
  const pr = n => pronouns(n);

  // 1. SURVIVOR / ESCAPE-ARTIST — kept getting votes and kept surviving.
  const voteCounts = {};
  hist.forEach(h => { const v = h.votes || {}; Object.keys(v).forEach(n => { if (v[n] > 0 && n !== h.eliminated) voteCounts[n] = (voteCounts[n] || 0) + 1; }); });
  Object.entries(voteCounts).filter(([, c]) => c >= 2).forEach(([n, c]) => {
    if (elimThis.has(n)) arcs.push({ type: 'survivor', players: [n], status: 'resolved', intensity: c,
      summary: `${n} dodged the vote at ${c} tribals — and the tribe finally caught up.`,
      payoff: `The escape artist's run ended.` });
    else if (active.has(n) && ((votesThis[n] || 0) > 0 || isFinale)) arcs.push({ type: 'survivor', players: [n], status: isFinale ? 'peaking' : 'building', intensity: c + ((votesThis[n] || 0) > 0 ? 1 : 0),
      summary: `${n} keeps landing in danger — ${c}${(votesThis[n] || 0) > 0 ? '+' : ''} tribals with votes cast, still standing.` });
  });

  // 2. CHALLENGE THREAT — repeat immunity winners.
  const immCounts = {};
  hist.forEach(h => { if (h.immunityWinner) immCounts[h.immunityWinner] = (immCounts[h.immunityWinner] || 0) + 1; });
  Object.entries(immCounts).filter(([, c]) => c >= 2).forEach(([n, c]) => {
    if (elimThis.has(n)) arcs.push({ type: 'challenge', players: [n], status: 'resolved', intensity: c,
      summary: `${n} won immunity ${c} times — but got cut the moment ${pr(n).sub} couldn't.`,
      payoff: `The challenge threat is gone.` });
    else if (active.has(n) && (ep.immunityWinner === n || isFinale)) arcs.push({ type: 'challenge', players: [n], status: 'peaking', intensity: c + (ep.immunityWinner === n ? 1 : 0),
      summary: `${n} is a proven challenge threat — ${c}${ep.immunityWinner === n ? '+' : ''} immunity wins and rivals can't touch ${pr(n).obj} at tribal.` });
  });

  // 3. SHOWMANCE — surface only when it MOVES (forms, breaks, or a partner is cut this ep).
  (gs.showmances || []).forEach(sh => {
    const [a, b] = sh.players || [];
    if (!a || !b) return;
    const partnerCut = elimThis.has(a) || elimThis.has(b);
    // Retire-once: the "game ended it" beat may only fire on the FIRST time a partner is cut
    // (a returnee getting re-eliminated must not re-resolve the same thread).
    const _elimEpOf = nm => { const h = (gs.episodeHistory || []).find(e => e && (e.eliminated === nm || e.firstEliminated === nm || e.suddenDeathEliminated === nm)); return h ? h.num : Infinity; };
    const _firstCutEp = Math.min(_elimEpOf(a), _elimEpOf(b), elimThis.has(a) || elimThis.has(b) ? ep.num : Infinity);
    if (sh.broken && sh.breakupEp === ep.num) arcs.push({ type: 'showmance', players: [a, b], status: 'resolved', intensity: sh.episodesActive || 1,
      summary: `${a} and ${b}'s showmance fell apart${sh.breakupVoter ? ` — ${sh.breakupVoter} pulled the trigger` : ''}.`, payoff: `The relationship didn't survive the game.` });
    else if (partnerCut && !sh.broken && _firstCutEp === ep.num) arcs.push({ type: 'showmance', players: [a, b], status: 'resolved', intensity: sh.episodesActive || 1,
      summary: `The ${a}/${b} showmance ended the only way the game allows — one of them went home.`, payoff: `Game beat the relationship.` });
    else if (!sh.broken && active.has(a) && active.has(b) && (sh.sparkEp === ep.num || sh.formedEp === ep.num)) arcs.push({ type: 'showmance', players: [a, b], status: 'building', intensity: 1,
      summary: `${a} and ${b} are becoming a thing — and a target.` });
  });

  // 4. VILLAIN / HERO POLE — conservative: only at payoff (eliminated / finale), never ambient.
  const pop = gs.popularity || {};
  const ranked = Object.entries(pop).sort((x, y) => x[1] - y[1]);
  const villain = ranked[0] && ranked[0][1] <= -4 ? ranked[0][0] : null;
  const hero = ranked.length && ranked[ranked.length - 1][1] >= 4 ? ranked[ranked.length - 1][0] : null;
  if (villain) {
    if (elimThis.has(villain)) arcs.push({ type: 'villain', players: [villain], status: 'resolved', intensity: -pop[villain],
      summary: `${villain} played the season's heel — and the others finally made ${pr(villain).obj} pay.`, payoff: `Comeuppance.` });
    else if (isFinale && active.has(villain)) arcs.push({ type: 'villain', players: [villain], status: 'peaking', intensity: -pop[villain],
      summary: `${villain} is the villain the jury loves to hate — and ${pr(villain).sub} made the end anyway.` });
  }
  if (hero && isFinale && active.has(hero)) arcs.push({ type: 'hero', players: [hero], status: 'peaking', intensity: pop[hero],
    summary: `${hero} became the season's fan favorite and rode that goodwill to the finale.` });

  // 5. FEUD — surface only when the pair CLASH this episode (one votes the other, or one is cut).
  const feuds = [];
  active.forEach(a => active.forEach(b => { if (a >= b) return; const v = gs.bonds?.[bKey(a, b)] || 0; if (v <= -4) feuds.push({ a, b, v }); }));
  feuds.sort((x, y) => x.v - y.v);
  feuds.slice(0, 2).forEach(f => {
    const clashed = vlogThis.some(l => (l.voter === f.a && l.voted === f.b) || (l.voter === f.b && l.voted === f.a));
    const oneCut = elimThis.has(f.a) || elimThis.has(f.b);
    if (oneCut) arcs.push({ type: 'feud', players: [f.a, f.b], status: 'resolved', intensity: -f.v,
      summary: `The ${f.a}–${f.b} feud settled the hard way: ${elimThis.has(f.a) ? f.b : f.a} outlasted ${elimThis.has(f.a) ? f.a : f.b}.`, payoff: `One rival sent the other home (or watched them fall).` });
    else if (clashed) arcs.push({ type: 'feud', players: [f.a, f.b], status: 'peaking', intensity: -f.v,
      summary: `${f.a} and ${f.b} went at each other again at tribal — the season's nastiest feud isn't cooling.` });
  });

  // 6. KINGMAKER — steered multiple votes; surface when they steer THIS ep or get dethroned.
  const ctrl = {};
  hist.forEach(h => { (h.alliances || []).forEach(al => { if (al.target && al.target === h.eliminated && al.members?.length) { const lead = al.spearhead || al.members[0]; if (lead) ctrl[lead] = (ctrl[lead] || 0) + 1; } }); });
  Object.entries(ctrl).filter(([, c]) => c >= 2).forEach(([n, c]) => {
    const steeredThis = (ep.alliances || []).some(al => al.target && elimThis.has(al.target) && (al.spearhead === n || al.members?.[0] === n));
    if (elimThis.has(n)) arcs.push({ type: 'kingmaker', players: [n], status: 'resolved', intensity: c,
      summary: `${n} quietly ran ${c}+ votes — until the tribe woke up and dethroned the kingmaker.`, payoff: `The puppetmaster got cut.` });
    else if (active.has(n) && (steeredThis || isFinale)) arcs.push({ type: 'kingmaker', players: [n], status: 'peaking', intensity: c,
      summary: `${n} has steered ${c}${steeredThis ? '+' : ''} votes now — a kingmaker hiding in plain sight.` });
  });

  // Prioritise payoffs, then peaks, then builds; cap at 3 so no episode is a full checklist.
  const rank = { resolved: 0, peaking: 1, building: 2 };
  arcs.sort((a, b) => (rank[a.status] - rank[b.status]) || (b.intensity - a.intensity));
  return arcs.slice(0, 3);
}

// Emits the tracked threads into the episode summary. This is (a) human-readable in the
// aftermath and (b) the story spine the worker's beat sheet builds from — see generateBeatSheet
// in worker-episode-live.js, which advances BUILDING/PEAKING threads and pays off PAID OFF ones.
// Status-gated + capped in buildTrackedArcs, so it can't spam the same thread every episode.
export function _textSeasonThreads(ep, ln, sec) {
  const tracked = buildTrackedArcs(ep);
  if (!tracked.length) return;
  sec('SEASON THREADS');
  ln('The season\'s ongoing storylines and where each stands this episode:');
  tracked.forEach(t => ln(`- [${t.status.toUpperCase()}] ${t.summary}${t.status === 'resolved' && t.payoff ? ` (${t.payoff})` : ''}`));
}

// ── FINALE: THE LAST MORNING ──
export function _textLastMorning(ep, ln, sec) {
  if (!ep.isFinale) return;
  const finalists = ep.finaleEntrants || ep.finaleFinalists || [];
  if (!finalists.length) return;
  sec('THE LAST MORNING');
  const day = ep.num > 1 ? (ep.num - 1) * 3 : 1;
  ln(`Day ${day}. The fire is low. The game is almost over.`);
  ln('');
  finalists.forEach(f => {
    const s = pStats(f);
    const fp = pronouns(f);
    const arch = players.find(p => p.name === f)?.archetype || '';
    const wins = gs.episodeHistory.filter(e => e.immunityWinner === f).length;
    const votesAgainst = gs.episodeHistory.reduce((sum, e) => {
      return sum + (e.votingLog || []).filter(v => v.voted === f && v.voter !== 'THE GAME').length;
    }, 0);
    const allianceNames = [...new Set(gs.episodeHistory.flatMap(e =>
      (e.alliances || []).filter(a => a.members?.includes(f) && a.members?.length >= 2).flatMap(a => a.members.filter(m => m !== f))
    ))].slice(0, 3);
    const rivalNames = [...gs.episodeHistory.reduce((rivals, e) => {
      (e.alliances || []).forEach(a => { if (a.target === f && a.members?.length) rivals.add(a.members[0]); });
      return rivals;
    }, new Set())];

    let journey;
    if (arch === 'mastermind' || arch === 'schemer' || s.strategic >= 8)
      journey = `"I came into this game knowing exactly what I wanted to do. Control the votes. Control the relationships. Control the outcome. And I'm still here — so either I did that, or I got lucky. I don't believe in luck."`;
    else if (arch === 'challenge-beast' || s.physical >= 8)
      journey = `"People underestimated me early. They saw a physical player and thought that's all I had. But I learned. I adapted. And every time they came for me, I won the challenge that mattered."`;
    else if (arch === 'social-butterfly' || s.social >= 8)
      journey = `"I built something real out here. Every conversation, every late-night talk by the fire — those weren't moves. Those were genuine connections. And somehow, they carried me to the end."`;
    else if (arch === 'loyal-soldier' || s.loyalty >= 8)
      journey = `"I gave my word to the people I trusted, and I kept it. In a game full of liars, I tried to be someone you could count on. Maybe that's not flashy. But I'm still here."`;
    else if (arch === 'underdog')
      journey = `"Nobody picked me to make it this far. Not the other players, not the audience, probably not even myself. But here I am. I survived every vote they threw at me."`;
    else if (arch === 'hothead' || s.temperament <= 3)
      journey = `"I know I'm not easy. I know I burned some people. But I never pretended to be something I wasn't out here. Every emotion was real. Every fight was real. And I'm in the finale."`;
    else
      journey = `"If you told me on day one that I'd be sitting here on the last morning, I would have laughed. But here I am. And I earned every single day."`;

    ln(`${f} (${arch}, ${wins} challenge win${wins !== 1 ? 's' : ''})`);
    ln(journey);
    if (allianceNames.length >= 2)
      ln(`${fp.Sub} built ${fp.pos} game around ${allianceNames.slice(0, 2).join(' and ')}. Some of those bonds survived. Some didn't.${rivalNames.length ? ` ${rivalNames[0]} was the rival ${fp.sub} never shook.` : ''}`);
    if (votesAgainst >= 6) ln(`${f} has survived ${votesAgainst} votes against. The target was always there.`);
    else if (wins >= 3) ln(`${f} has dominated challenges. The jury knows it.`);
    ln('');
  });
  ln(`Someone looks at the tribe flag one last time. It's faded now. Weathered. Just like them.`);
}

// ── FINALE: REJECTED OLYMPIC RELAY ──
export function _textOlympicRelay(ep, ln, sec) {
  if (!ep.relayData) return;
  _textTwistChallenge(ep, ln, sec, 'relayData', 'REJECTED OLYMPIC RELAY', [
    rpBuildBenches, rpBuildRelayPitch, rpBuildRelayFlagpole, rpBuildRelayBeam, rpBuildRelaySprint, rpBuildRelayFinish
  ]);
}

// ── FINALE: HAWAIIAN PUNCH ──
export function _textHawaiianPunch(ep, ln, sec) {
  if (ep.hpFIC) {
    const fic = ep.hpFIC;
    sec('HAWAIIAN STYLE — FINAL IMMUNITY CHALLENGE');
    ln(`Spirit Animals: ${Object.entries(fic.spiritAnimals || {}).map(([n, a]) => `${n} → ${a}`).join(', ')}`);
    ln('');
    (fic.phases || []).forEach((phase, i) => {
      ln(`Phase ${i + 1}: ${phase.name}`);
      phase.results.forEach(r => {
        const mishap = r.stumble ? ' (stumbled!)' : r.wipeout ? ' (wiped out!)' : r.animalAttack ? ' (attacked by animal!)' : '';
        ln(`  ${r.player}: ${r.score.toFixed(1)}${mishap}`);
      });
      ln(`  → Phase winner: ${phase.winner}`);
      ln('');
    });
    const stealEvt = (fic.events || []).find(e => e.type === 'lei-steal');
    if (stealEvt) ln(`Lei Steal: ${stealEvt.attacker} ${stealEvt.success ? 'steals' : 'tries to steal'} ${stealEvt.victim}'s lei!`);
    ln(`Final Results: ${(fic.placements || []).map((p, i) => `${i + 1}. ${p.player} (${p.score.toFixed(1)})`).join(', ')}`);
    ln(`${fic.placements[0]?.player} wins Final Immunity!`);
    ln('');
  }
  if (ep.hpTiebreaker) {
    const tb = ep.hpTiebreaker;
    sec('JOUSTING TIEBREAKER');
    ln(`${tb.immunityWinner} is safe with immunity. ${tb.duelists[0]} and ${tb.duelists[1]} duel for the final spot.`);
    ln('');
    tb.exchanges.forEach(ex => {
      if (ex.suddenDeath) {
        ln(`SUDDEN DEATH: ${ex.winner} wins the deciding exchange!`);
      } else {
        ln(`Exchange ${ex.round}: ${ex.winner} wins (${tb.duelists[0]}: ${(ex.scoreA||0).toFixed(1)} vs ${tb.duelists[1]}: ${(ex.scoreB||0).toFixed(1)})`);
        if (ex.rallyA) ln(`  ${tb.duelists[0]} rallies from behind!`);
        if (ex.rallyB) ln(`  ${tb.duelists[1]} rallies from behind!`);
      }
    });
    ln('');
    ln(`Result: ${tb.winner} advances (${tb.winsA}-${tb.winsB}). ${tb.loser} is knocked into the water and eliminated.`);
  }

  if (ep.hpRaceData) {
    const rd = ep.hpRaceData;
    const [rdA, rdB] = rd.finalists || [];
    sec('HAWAIIAN PUNCH — VOLCANO RACE');
    ln(`Finalists: ${(rd.finalists || []).join(' vs ')}`);
    ln('');

    (rd.phaseResults || []).forEach(phase => {
      ln(`--- ${phase.name} ---`);
      if (phase.scoreA !== undefined && phase.scoreB !== undefined) {
        ln(`  ${rdA}: ${(phase.scoreA || 0).toFixed(1)}`);
        ln(`  ${rdB}: ${(phase.scoreB || 0).toFixed(1)}`);
      }
      if (phase.winner && phase.name !== 'Summit Showdown') ln(`  Phase winner: ${phase.winner}`);
      if (phase.name === 'Summit Showdown' && phase.leader) ln(`  ${phase.leader} leads into the summit; ${phase.trailer} pushes for the flip.`);

      if (phase.mindGameResult) {
        const mg = phase.mindGameResult;
        ln(`  MIND GAMES: ${mg.attacker} attempts ${mg.type.replace(/-/g, ' ')} on ${mg.defender}${mg.hasShowmance ? ' (showmance vulnerability!)' : ''}`);
        ln(`  Result: ${mg.success ? `SUCCESS — ${mg.attacker} FLIPS the race!` : `FAILED — ${mg.defender} stays focused.`}`);
      }
      ln('');
    });

    ln(`WINNER: ${rd.winner} throws their dummy into the volcano!`);
    if (rd.feralCameo) ln(`...and ${rd.feralCameo.player} emerges from the volcano, snatching the prize money!`);
  }
}

// ── FINALE: GRAND CHALLENGE ──
export function _textGrandChallenge(ep, ln, sec) {
  if (!ep.grandChallenge) return;
  sec('GRAND CHALLENGE');
  const gc = ep.grandChallenge;
  ln(`Final immunity challenge: ${gc.label || 'Endurance'}`);
  if (gc.desc) ln(gc.desc);
  if (gc.placements?.length) ln(`Placements: ${gc.placements.join(' > ')}`);
  if (gc.winner) ln(`Winner: ${gc.winner}`);
}

// ── FINALE: FINAL CUT ──
export function _textFinalCut(ep, ln, sec) {
  if (!ep.fireMaking && !ep.finalCut) return;
  if (ep.fireMaking) {
    sec('FINAL CUT — FIRE MAKING');
    const fm = ep.fireMaking;
    ln(`${fm.player} vs ${fm.opponent} — ${fm.duelName || 'Fire-Making'}`);
    ln(`${fm.winner} wins. ${fm.loser} is eliminated.`);
  }
  if (ep.finalCut) {
    sec('FINAL CUT');
    const fc = ep.finalCut;
    if (fc.method === 'jury-cut') ln(`Jury vote cut: ${fc.eliminated} is removed by jury vote.`);
    else if (fc.method === 'fire') ln(`Fire-making: ${fc.winner} defeats ${fc.loser}.`);
    else ln(`${fc.eliminated} is eliminated.`);
  }
}

// ── FINALE: FTC Q&A ──
export function _textFTCQA(ep, ln, sec) {
  if (!ep.ftcData?.jurorQA?.length) return;
  sec('FTC Q&A');
  ep.ftcData.jurorQA.forEach(qa => {
    ln(`${qa.juror} asks ${qa.targetForQuestion}:`);
    ln(`  Q: ${qa.question}`);
    ln(`  A: ${qa.response}`);
  });
}

// ── FINALE: JURY CONVENES ──
export function _textJuryConvenes(ep, ln, sec) {
  if (!ep.juryConvenes) return;
  sec('JURY CONVENES');
  const jc = ep.juryConvenes;
  if (jc.deliberation?.length) jc.deliberation.forEach(d => ln(`- ${d}`));
  if (jc.projections?.length) { ln('Vote projections:'); jc.projections.forEach(p => ln(`  ${p.juror}: leaning ${p.leaning}`)); }
}

// ── FINALE: JURY VOTES ──
export function _textJuryVotes(ep, ln, sec) {
  if (!ep.juryVotes?.length && !ep.finaleResult?.juryVotes?.length) return;
  sec('JURY VOTES');
  const votes = ep.juryVotes || ep.finaleResult?.juryVotes || [];
  votes.forEach(v => ln(`${v.juror} votes for ${v.votedFor}${v.reason ? ` — ${v.reason}` : ''}`));
}

// ── FINALE: FAN CAMPAIGN ──
export function _textFanCampaign(ep, ln, sec) {
  if (!ep.fanCampaign?.phases?.length) return;
  sec('FAN CAMPAIGN');
  ep.fanCampaign.phases.forEach(phase => {
    ln(`${phase.finalist} (${phase.style} pitch): pulse ${phase.pulseReaction}`);
    ln(`Speech: ${phase.speech}`);
    phase.fanReactions?.forEach(r => ln(`  [${r.sentiment}] "${r.text}"`));
    phase.juryReactions?.forEach(jr => ln(`  ${jr.juror}: ${jr.text}`));
  });
}

// ── FINALE: FAN VOTE ──
export function _textFanVote(ep, ln, sec) {
  if (!ep.fanVoteResult) return;
  sec('FAN VOTE');
  ep.fanVoteResult.breakdown?.forEach(b => ln(`${b.name}: ${b.pct}% (popularity: ${b.popularity}, boost: ${b.campaignBoost})`));
  ln(`Winner: ${ep.fanVoteResult.winner} (${ep.fanVoteResult.margin})`);
}

// ── FINALE: WINNER CEREMONY ──
export function _textWinnerCeremony(ep, ln, sec) {
  if (!ep.finaleResult?.winner) return;
  sec('WINNER CEREMONY');
  const winner = ep.finaleResult.winner;
  ln(`WINNER: ${typeof winner === 'object' ? winner.name || JSON.stringify(winner) : winner}`);
  if (ep.finaleResult?.voteCount) {
    const vc = ep.finaleResult.voteCount;
    ln(`Final vote count: ${Object.entries(vc).sort(([,a],[,b])=>b-a).map(([n,v])=>`${n} (${v})`).join(', ')}`);
  }
}

// ── FINALE: REUNION ──
export function _textReunion(ep, ln, sec) {
  if (!ep.reunion) return;
  sec('REUNION');
  if (ep.reunion.reflections?.length) ep.reunion.reflections.forEach(r => ln(`- ${r}`));
  if (ep.reunion.awards?.length) { ln('Awards:'); ep.reunion.awards.forEach(a => ln(`  ${a.title}: ${a.winner}`)); }
}

// ── FINALE: SEASON STATS ──
export function _textSeasonStats(ep, ln, sec) {
  if (!ep.seasonStats) return;
  sec('SEASON STATS');
  const ss = ep.seasonStats;
  if (ss.mostVotesReceived) ln(`Most votes received: ${ss.mostVotesReceived}`);
  if (ss.mostIdolsPlayed) ln(`Most idols played: ${ss.mostIdolsPlayed}`);
  if (ss.mostImmunityWins) ln(`Most immunity wins: ${ss.mostImmunityWins}`);
  if (ss.biggestBlindsides?.length) ln(`Biggest blindsides: ${ss.biggestBlindsides.join(', ')}`);
  Object.entries(ss).forEach(([k, v]) => {
    if (['mostVotesReceived','mostIdolsPlayed','mostImmunityWins','biggestBlindsides'].includes(k)) return;
    ln(`${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`);
  });
}

// ── WRITER EXTRAS ──
// ── THE MOLE: text backlog formatters ──

export function _textChainOfCommand(ep, ln, sec) {
  const coc = ep.chainOfCommand;
  if (!coc) return;
  sec('CHAIN OF COMMAND');
  ln(`${coc.immunityWinner} holds the power. The chain begins.`);
  ln('');
  if (coc.idolPlays.length > 0) {
    coc.idolPlays.forEach(ip => {
      ln(`${ip.player} plays a Hidden Immunity Idol — automatically safe at position ${ip.position}.`);
    });
    ln('');
  }
  coc.chain.forEach(entry => {
    if (entry.type === 'immunity') {
      ln(`[IMMUNITY] ${entry.player} — safe as immunity winner.`);
    } else if (entry.type === 'idol') {
      ln(`[IDOL] ${entry.player} — safe via idol play.`);
    } else if (entry.type === 'pick') {
      const hesText = entry.hesitation && entry.hesitationText ? ` [HESITATION] ${entry.hesitationText}` : '';
      ln(`Pick ${entry.position}: ${entry.pickedBy} saves ${entry.player}.${hesText}`);
    } else if (entry.type === 'eliminated') {
      ln('');
      ln(`ELIMINATED: ${entry.player}. No one saved them.`);
    }
  });
  if (coc.bondShifts.length > 0) {
    ln('');
    ln('Bond shifts:');
    coc.bondShifts.forEach(bs => {
      const sign = bs.delta > 0 ? '+' : '';
      ln(`  ${bs.from} → ${bs.to}: ${sign}${bs.delta} (${bs.reason})`);
    });
  }
  ln('');
}

export function _textTiedDestinies(ep, ln, sec) {
  const td = (ep.twists || []).find(t => t.tiedDestinies);
  if (!td?.pairs?.length) return;
  sec('TIED DESTINIES');
  ln('Players are randomly paired. Vote someone out and their partner goes too.');
  ln('');
  ln('PAIRS:');
  td.pairs.forEach(pair => {
    const bond = getBond(pair.a, pair.b);
    const react = td.reactions?.[pair.a] || 'cautious';
    ln(`${pair.a} & ${pair.b} — ${bondLabel(bond)} (${react})`);
  });
  if (ep.tiedDestinies?.immunePair) {
    const ip = ep.tiedDestinies.immunePair;
    ln('');
    ln(`IMMUNE PAIR: ${ip.a} & ${ip.b}`);
  }
  if (ep.tiedDestinies?.eliminatedPartner) {
    ln('');
    ln(`COLLATERAL ELIMINATION: ${ep.tiedDestinies.eliminatedPartner} — tied to ${ep.tiedDestinies.eliminatedTarget}`);
    ln(`${ep.tiedDestinies.eliminatedPartner} wasn't the target. The twist took them out.`);
  }
}

export function _textMoleExposed(ep, ln, sec) {
  if (!ep.moleExposure?.length) return;
  const exp = ep.moleExposure[0];
  sec('THE MOLE — EXPOSED');
  ln(`${exp.exposedBy} figured it out. ${exp.mole} has been The Mole.`);
  ln(`Total sabotage acts: ${exp.sabotageCount}`);

  // Sabotage breakdown from snapshot
  const _moleData = (ep.gsSnapshot?.moles || gs.moles || []).find(m => m.player === exp.mole);
  if (_moleData?.sabotageLog?.length) {
    const _typeCounts = {};
    _moleData.sabotageLog.forEach(s => { _typeCounts[s.type] = (_typeCounts[s.type] || 0) + 1; });
    const _labels = { bondSabotage: 'Fabricated conflicts', challengeThrow: 'Threw challenges', challengeSabotage: 'Sabotaged challenges', infoLeak: 'Leaked intel', voteDisruption: 'Disrupted votes', advantageSabotage: 'Sabotaged advantages' };
    ln('');
    ln('SABOTAGE BREAKDOWN:');
    Object.entries(_typeCounts).forEach(([type, count]) => {
      ln(`- ${_labels[type] || type}: ${count}`);
    });

    // Most affected players
    const _targetCounts = {};
    _moleData.sabotageLog.forEach(s => {
      (s.targets || []).forEach(t => { _targetCounts[t] = (_targetCounts[t] || 0) + 1; });
      if (s.target) _targetCounts[s.target] = (_targetCounts[s.target] || 0) + 1;
    });
    const _topTargets = Object.entries(_targetCounts).sort((a, b) => b[1] - a[1]).slice(0, 4);
    if (_topTargets.length) {
      ln('');
      ln('MOST AFFECTED:');
      _topTargets.forEach(([name, count]) => ln(`- ${name} (${count}x)`));
    }

    // Timeline
    ln('');
    ln('SABOTAGE TIMELINE:');
    _moleData.sabotageLog.forEach(s => {
      const label = _labels[s.type] || s.type;
      const detail = s.targets ? `${s.targets.join(' vs ')}` : s.target ? `→ ${s.target}` : s.leakedTo ? `leaked to ${s.leakedTo}` : '';
      ln(`Ep ${s.ep}: ${label} ${detail}`);
    });
  }

  ln('');
  ln('CONSEQUENCES:');
  ln('- Trust shattered: -1.5 bond with everyone');
  ln('- Massive target: +3.0 heat for 2 episodes');
  ln('- All advantages revealed');
  ln('- No more sabotage powers');
  ln('');
  ln(`DETECTIVE REWARD: ${exp.exposedBy} gains +0.5 bond with the tribe, -1.5 heat for 2 episodes, +6 popularity.`);
}

export function _textMoleDisruption(ep, ln, sec) {
  if (!ep.moleVoteDisruptions?.length) return;
  sec('MOLE VOTE DISRUPTION');
  ep.moleVoteDisruptions.forEach(vd => {
    if (vd.type === 'rogue') {
      ln(`${vd.voter} went rogue — voted ${vd.rogueTarget} instead of the plan (${vd.originalTarget}).`);
    } else if (vd.type === 'pitch') {
      ln(`${vd.pitcher} whispered to ${vd.swayed} before the vote — redirected their vote to ${vd.newTarget}.`);
    }
  });
}

export function _textMoleReveal(ep, ln, sec) {
  if (!ep.moleReveal) return;
  const mr = ep.moleReveal;
  sec('THE MOLE — UNDISCOVERED');
  ln(`${mr.player} was The Mole. ${mr.sabotageCount} acts of sabotage — and nobody figured it out.`);
  if (mr.sabotageLog?.length) {
    const _labels = { bondSabotage: 'Fabricated conflicts', challengeThrow: 'Threw challenges', challengeSabotage: 'Sabotaged challenges', infoLeak: 'Leaked intel', voteDisruption: 'Disrupted votes', advantageSabotage: 'Sabotaged advantages' };
    const _typeCounts = {};
    mr.sabotageLog.forEach(s => { _typeCounts[s.type] = (_typeCounts[s.type] || 0) + 1; });
    Object.entries(_typeCounts).forEach(([type, count]) => {
      ln(`- ${_labels[type] || type}: ${count}`);
    });
  }
  ln(`"They never figured it out." — ${mr.player}`);
}

function _textAftermayhem(am, ln) {
  // Lottery
  ln('GOLDEN CAN LOTTERY');
  ln(`${am.lottery.winners.length} players drew golden Chris heads from ${am.lottery.pool.length} eliminated players.`);
  am.lottery.winnerReactions.forEach(r => ln(r.text));
  am.lottery.loserReactions.forEach(r => ln(r.text));

  // Board Race
  ln('');
  ln('BOARD RACE');
  ln(`${am.board.squares.length}-square board with ${am.board.traps.length} booby traps.`);

  am.rounds.forEach(rd => {
    ln('');
    ln(`— Round ${rd.roundNum} —`);
    rd.turns.forEach(t => {
      ln(t.rollText);
      if (t.isTrap && t.trapText) ln(t.trapText);
      if (t.trapSurviveText) ln(t.trapSurviveText);
      if (t.trapBacktrackText) ln(t.trapBacktrackText);
      if (t.challengeText) ln(t.challengeText);
      if (t.dominationText) ln(t.dominationText);
      if (t.cameo?.text) ln(t.cameo.text);
      if (t.isWinner) {
        const winPool = am.winCondition === 'last-standing'
          ? [`${t.player} is the last one standing! All others have been KO'd!`]
          : [`${t.player} reaches the Trophy Case! The race is over!`];
        ln(winPool[0]);
      }
    });
    rd.socialEvents.forEach(se => ln(se.text));
    rd.eliminations.forEach(el => ln(el.text));
    if (rd.hostEvents?.length) rd.hostEvents.forEach(he => ln(he.text));
  });

  // Result
  ln('');
  if (am.winner) {
    ln(`WINNER: ${am.winner} (${am.winCondition === 'last-standing' ? 'last standing' : 'reached Trophy Case'})`);
    ln(`${am.winner} returns to the game, joining the ${am.returnedTo} group.`);
  }
  const eliminated = am.racers.filter(r => !r.alive).sort((a, b) => (b.koRound || 0) - (a.koRound || 0));
  if (eliminated.length) {
    ln('Eliminated from board: ' + eliminated.map(r => `${r.name} (Rd ${r.koRound})`).join(', '));
  }
}

export function _textAftermath(ep, ln, sec) {
  if (!ep.aftermath) return;
  const a = ep.aftermath;
  sec(a.isReunion ? 'TOTAL DRAMA AFTERMATH: THE REUNION' : `AFTERMATH #${a.number}`);
  ln(`Guests: ${a.interviewees.join(', ')}`);
  if (a.peanutGallery.length) ln(`Peanut Gallery: ${a.peanutGallery.join(', ')}`);
  // Interviews
  a.interviews.forEach(iv => {
    ln('');
    ln(`INTERVIEW — ${iv.player}${iv.isActive ? ' (Winner)' : ` (Eliminated Ep ${iv.elimEpNum})`}`);
    ln(`Crowd: ${iv.crowdReaction}. ${iv.entranceQuote}`);
    ln(`Blame: ${iv.blameText}`);
    ln(`Mistake: ${iv.mistakeText}`);
    ln(`Prediction: ${iv.predictionText}`);
    ln(`Last words: ${iv.lastWords}`);
  });
  // Truth or Anvil
  if (a.truthOrAnvil?.length) {
    ln('');
    ln('TRUTH OR ANVIL:');
    a.truthOrAnvil.forEach(toa => {
      ln(`${toa.player} (${toa.secretType}):`);
      if (toa.dialogue?.length) toa.dialogue.forEach(d => ln(`  ${d.speaker}: ${d.text.replace(/"/g, '')}`));
      ln(`Result: ${toa.toldTruth ? 'TRUTH' : 'ANVIL'}${toa.consequence ? '. ' + toa.consequence : ''}`);
    });
  }
  // Unseen Footage
  if (a.unseenFootage?.length) {
    ln('');
    ln('UNSEEN FOOTAGE:');
    a.unseenFootage.forEach(clip => ln(`Ep ${clip.sourceEp}: ${clip.description}`));
  }
  // Fan Call — a fan video-calls in for a 3-round Q&A with one player
  if (a.fanCall) {
    const fc = a.fanCall;
    const _fanTypeLabels = { superfan: 'Superfan', drama: 'Drama Fan', hater: 'The Hater', supporter: 'Biggest Fan' };
    ln('');
    ln(`FAN CALL: ${fc.fanName}${fc.fanType ? ` (${_fanTypeLabels[fc.fanType] || fc.fanType})` : ''} takes a call with ${fc.target}.`);
    (fc.exchanges || []).forEach((ex, i) => {
      ln(`${fc.fanName}: "${ex.q}"`);
      ln(`${fc.target}: "${ex.a}"`);
      if (fc.hostReactions?.[i] && i < (fc.exchanges.length - 1)) ln(fc.hostReactions[i]);
    });
  }
  // Fan Vote
  if (a.fanVote) {
    ln('');
    ln('FAN VOTE RESULTS:');
    a.fanVote.results.forEach(r => ln(`${r.name}: ${r.pct}%${r.name === a.fanVote.winner ? ' — RETURNING' : ''}`));
  }
  // Aftermayhem
  if (a.aftermayhem) {
    ln('');
    sec('AFTERMATH AFTERMAYHEM');
    _textAftermayhem(a.aftermayhem, ln);
  }
  // Awards
  if (a.awards?.length) {
    ln('');
    ln('SEASON AWARDS:');
    a.awards.forEach(aw => ln(`${aw.title}: ${aw.winner} — ${aw.description}`));
  }
  if (a.seasonRating) ln(`Season Rating: ${a.seasonRating.score}/10 — "${a.seasonRating.comment}"`);
}

export function _textSchoolyardPick(ep, ln, sec) {
  const sp = ep.schoolyardPick;
  if (!sp?.picks?.length) return;
  sec('SCHOOLYARD PICK');
  ln(`Captains: ${(sp.captains || []).join(', ')} (${sp.captainSource === 'challenge' ? 'top challenge performers' : 'randomly selected'})`);
  ln('Draft order:');
  sp.picks.forEach(p => ln(`  #${p.pickNumber} — ${p.captain} picks ${p.picked}`));
  if (sp.lastPicked) ln(`Last picked: ${sp.lastPicked} (dominant emotion: ${sp.dominantEmotion})`);
  if (sp.exiled) ln(`Sent to exile: ${sp.exiled} — will return to the tribe that loses someone at tribal.`);
  if (sp.newTribes?.length) {
    ln('New tribes:');
    sp.newTribes.forEach(t => ln(`  ${t.name}: ${t.members.join(', ')}`));
  }
  if (ep.schoolyardExileReturn) {
    const r = ep.schoolyardExileReturn;
    ln(`Exile return: ${r.player} rejoined ${r.tribe} (emotion: ${r.emotion}).`);
  }
}

export function _textVolunteerDuel(ep, ln, sec) {
  if (!ep.volunteerDuel) return;
  const vd = ep.volunteerDuel;
  sec('VOLUNTEER EXILE DUEL');
  ln(`${vd.volunteer} volunteered to be voted out to face ${vd.rival} at the exile duel.`);
  ln(vd.granted ? 'The tribe granted the request.' : 'The tribe had other priorities.');
  if (vd.duelResult === 'won') ln(`${vd.volunteer} WON the duel. Returned with grudge bonus.`);
  if (vd.duelResult === 'lost') ln(`${vd.volunteer} LOST the duel. Permanently eliminated.`);
  if (ep.volunteerDuelReturn) {
    const vdr = ep.volunteerDuelReturn;
    ln(`${vdr.volunteer} ${vdr.result === 'won' ? 'returned victorious — grudge bonus applied.' : 'fell at the duel. The gamble did not pay off.'}`);
  }
}

export function _textDockArrivals(ep, ln, sec) {
  if (!ep.dockArrivals?.length) return;
  sec('THE ARRIVAL');
  const host = seasonConfig.host || 'Chris';
  const _arr = (typeof settingArrival === 'function') ? settingArrival() : null;
  if (_arr) ln(`The ${ep.dockArrivals.length} players arrive by ${_arr.vehicle} ${_arr.onPoint}. ${_arr.headline}`);
  ep.dockArrivals.forEach(a => {
    ln(`[${host}] ${a.hostLine}`);
    ln(`[${a.name}] ${a.playerLine}`);
    if (a.dockReaction) ln(`  ${a.dockReaction.text}`);
  });
}

export function _textFirstImpressions(ep, ln, sec) {
  const _tw = (ep.twists || []).find(t => t.type === 'first-impressions' || t.catalogId === 'first-impressions');
  const fi = _tw?.firstImpressions;
  if (!fi?.length) return;
  sec('FIRST IMPRESSIONS');
  ln('No camp. No alliances. Just gut feeling. Each tribe votes one person out immediately.');
  fi.forEach(tribe => {
    ln(`${tribe.tribe}:`);
    (tribe.log || []).forEach(v => {
      ln(`  ${v.voter} voted ${v.voted}${v.reason ? ` — "${v.reason}"` : ''}`);
    });
    const sortedVotes = Object.entries(tribe.votes || {}).sort(([,a],[,b]) => b - a);
    ln(`  Result: ${tribe.votedOut} (${sortedVotes.map(([n,c]) => `${n}: ${c}`).join(', ')})`);
  });
  ln('TWIST: Voted-out players are NOT eliminated — they swap tribes.');
  fi.forEach(tribe => {
    ln(`  ${tribe.votedOut}: ${tribe.tribe} → ${tribe.sentTo}`);
  });
  if (_tw.newTribes?.length) {
    ln('New tribe compositions:');
    _tw.newTribes.forEach(t => ln(`  ${t.name}: ${t.members.join(', ')}`));
  }
}

export function _textSecondChanceVote(ep, ln, sec) {
  const _tw = (ep.twists || []).find(t => t.type === 'second-chance' || t.catalogId === 'second-chance' || (t.type === 'returning-player' && t.catalogId === 'second-chance'));
  if (!_tw?.returnee) return;
  sec('SECOND CHANCE VOTE');
  ln('The fans have voted. One eliminated player returns to the game.');
  const results = _tw.fanVoteResults || [];
  if (results.length) {
    ln('Fan vote standings:');
    results.forEach((r, i) => ln(`  ${i + 1}. ${r.name} — ${r.votes || r.score || '?'} votes${r.name === _tw.returnee ? ' ★ WINNER' : ''}`));
  }
  ln(`RESULT: ${_tw.returnee} returns to the game.`);
}

export function _textFeast(ep, ln, sec) {
  const evts = ep.feastEvents;
  if (!evts?.length) return;
  const _tw = (ep.twists || []).find(t => t.type === 'the-feast' || t.type === 'merge-reward' || t.catalogId === 'the-feast' || t.catalogId === 'merge-reward');
  const isMerge = _tw?.type === 'merge-reward' || _tw?.catalogId === 'merge-reward';
  sec(isMerge ? 'THE MERGE FEAST' : 'THE FEAST');
  evts.forEach(evt => {
    const badge = evt.badgeText ? `[${evt.badgeText}] ` : '';
    ln(`- ${badge}${evt.text}`);
  });
}

export function _textFanVoteReturn(ep, ln, sec) {
  if (!ep.fanVoteReturnee) return;
  sec('FAN VOTE RETURN');
  ln(`The fans have voted. ${ep.fanVoteReturnee} returns to the game.`);
  const _elimEp = gs.episodeHistory?.find(h => h.eliminated === ep.fanVoteReturnee || h.firstEliminated === ep.fanVoteReturnee || h.ambassadorData?.ambassadorEliminated === ep.fanVoteReturnee);
  if (_elimEp) ln(`Originally eliminated: Episode ${_elimEp.num}`);
}

// Renders the post-tribal "Aftermath" VP screen (Power Shifts / Threads to Watch / Next Episode)
// as plain text. Reuses the VP builder as the single source of truth, then strips HTML — filtering
// out portrait initials (lone single chars) and collapsing the doubled portrait name into one line.
export function _textAftermathScreen(ep, ln) {
  if (ep.isFinale) return; // finale has no post-tribal Aftermath screen
  if (typeof window === 'undefined' || typeof window.rpBuildAftermath !== 'function') return;
  let html;
  try { html = window.rpBuildAftermath(ep); } catch (e) { return; }
  if (!html) return;

  const rawLines = html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0)
    .filter(l => !/^[A-Z]$/.test(l)); // drop portrait initials ("A", "B", ...)

  // Collapse consecutive duplicate lines (portrait name + card name render the name twice)
  const lines = rawLines.filter((l, i) => l !== rawLines[i - 1]);
  if (!lines.length) return;

  ln('');
  ln('AFTERMATH SCREEN:');
  lines.forEach(l => ln(`  ${l}`));
}

export function _textWriterContext(ep, ln, sec) {
  sec('WRITER CONTEXT');

  // Aftermath screen — Power Shifts / Gained-Lost Ground / Threads to Watch / Next Episode.
  // Rendered straight from the VP builder (rpBuildAftermath) and stripped to clean text so the
  // writer sees the exact strategic read the viewer gets. Skipped on finale/aftermath-show episodes.
  _textAftermathScreen(ep, ln);

  // Stolen credit
  if (ep.stolenCreditEvents?.length) {
    ln('STOLEN CREDIT:');
    ep.stolenCreditEvents.forEach(sc => {
      if (sc.type === 'theft') ln(`- ${sc.stealer} stole credit for ${sc.architect}'s big move.`);
      if (sc.type === 'confrontation') ln(`- ${sc.architect} confronted ${sc.stealer}. ${sc.architectWins ? 'Architect won.' : 'Architect lost — looked petty.'}`);
    });
  }

  // Fake idol
  if (ep.fakeIdolEvents?.length) {
    ln('FAKE IDOL:');
    ep.fakeIdolEvents.forEach(fi => {
      if (fi.arc === 'caught-crafting') ln(`- ${fi.planter} caught crafting by ${fi.caughtBy}. Exposed.`);
      if (fi.arc === 'planted') ln(`- ${fi.planter} planted a fake. ${fi.victim} thinks it's real.`);
      if (fi.arc === 'tipped-off') ln(`- ${fi.planter} planted a fake. ${fi.tippedOffBy} warned ${fi.victim}.`);
      if (fi.arc === 'played-at-tribal') ln(`- ${fi.victim} played a FAKE idol (planted by ${fi.planter}). Humiliated.`);
    });
  }

  // Challenge throws
  if (ep.challengeThrows?.length) {
    ln('CHALLENGE THROWS:');
    ep.challengeThrows.forEach(ct => ln(`- ${ct.thrower} threw the challenge.${ct.caught ? ` CAUGHT by ${ct.detectedBy.join(', ')}.` : ' Not detected.'}`));
  }

  // Cold open hook for next episode
  ln('');
  ln('COLD OPEN HOOK:');
  ln(buildColdOpen(ep));

  // Next episode questions
  ln('');
  ln('NEXT EPISODE QUESTIONS:');
  buildNextEpQs(ep).forEach(q => ln(`- ${q}`));
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN — generateSummaryText
// ══════════════════════════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════════════
// AFTERMATH SHOW — generates all segment data from game state
// ══════════════════════════════════════════════════════════════════════════════

export function generateSummaryText(ep) {
  // Generate aftermath data before building text (aftermath is created in patchEpisodeHistory,
  // which runs AFTER this function — so we must generate it here to include it in the text backlog)
  if (!ep.aftermath && window.generateAftermathShow) window.generateAftermathShow(ep);

  const L = [];
  const ln  = s => L.push(s);
  const sec = t => { ln(''); ln(`=== ${t} ===`); };

  // Header block
  _textMeta(ep, ln, sec);
  _textCast(ep, ln, sec);

  // ── INTERLUDE EPISODE (non-elimination) — only the out-of-game life segment ──
  if (ep.isInterlude) {
    _textInterlude(ep, ln, sec);
    return L.join('\n');
  }

  // Episode flow — VP screen order
  _textColdOpen(ep, ln, sec);
  _textReturns(ep, ln, sec);
  _textDockArrivals(ep, ln, sec);
  _textFirstImpressions(ep, ln, sec);
  _textFanVoteReturn(ep, ln, sec);
  _textSecondChanceVote(ep, ln, sec);
  _textMerge(ep, ln, sec);
  _textFeast(ep, ln, sec);
  _textRosterSwaps(ep, ln, sec); // tribe swaps fire first — announce BEFORE camp life
  _textCampPre(ep, ln, sec);
  _textRewardChallenge(ep, ln, sec);
  _textImmunityChallenge(ep, ln, sec);
  _textTwists(ep, ln, sec);
  _textExile(ep, ln, sec);

  // ── TWIST CHALLENGES — before camp post since they ARE the immunity challenge ──
  _textSlasherNight(ep, ln, sec);
  _textMonsterCash(ep, ln, sec);
  _textMineOverMatter(ep, ln, sec);
  _textMerryGoRoundUp(ep, ln, sec);
  _textMazeOfTheFallen(ep, ln, sec);
  _textDemonsPlainer(ep, ln, sec);
  _textTreasureIsland(ep, ln, sec);
  _textOperationClassified(ep, ln, sec);
  _textAwakeAThon(ep, ln, sec);
  _textDodgebrawl(ep, ln, sec);
  _textTalentShow(ep, ln, sec);
  _textSuckyOutdoors(ep, ln, sec);
  _textUpTheCreek(ep, ln, sec);
  _textPaintballHunt(ep, ln, sec);
  _textHellsKitchen(ep, ln, sec);
  _textTrustChallenge(ep, ln, sec);
  _textCliffDive(ep, ln, sec);
  _textPhobiaFactor(ep, ln, sec);
  _textSayUncle(ep, ln, sec);
  if (ep.isBrunchOfDisgustingness) _textBrunchOfDisgustingness(ep, ln, sec);
  _textLuckyHunt(ep, ln, sec);
  _textBasicStraining(ep, ln, sec);
  _textXtremeTorture(ep, ln, sec);
  _textTripleDogDare(ep, ln, sec);
  _textHideAndBeSneaky(ep, ln, sec);
  _textOffTheChain(ep, ln, sec);
  _textWawanakwaGoneWild(ep, ln, sec);
  _textTriArmedTriathlon(ep, ln, sec);
  _textCampCastaways(ep, ln, sec);
  _textBeachBlanketBogus(ep, ln, sec);
  _textCrazytown(ep, ln, sec);
  _textChefshank(ep, ln, sec);
  _textOneFlu(ep, ln, sec);
  _textMastersOfDisasters(ep, ln, sec);
  _textFullMetalDrama(ep, ln, sec);
  _textOceansHeist(ep, ln, sec);
  _textMillionBucksBC(ep, ln, sec);
  _textSportsMarathon(ep, ln, sec);
  // VP-rendered text backlogs (full narration from VP screens)
  if (ep.superHerold) {
    const shBuilders = [rpBuildSuperHeroldTitleCard, rpBuildSuperHeroldCostume, rpBuildSuperHeroldPrizes];
    const brRounds = ep.superHerold?.battleRoyale?.rounds || [];
    for (let i = 0; i < brRounds.length; i++) shBuilders.push((e) => rpBuildSuperHeroldRound(e, i));
    shBuilders.push(rpBuildSuperHeroldBoss);
    _textTwistChallenge(ep, ln, sec, 'superHerold', 'SUPER HERO-LD', shBuilders);
  } else _textSuperHerold(ep, ln, sec);
  if (ep.hauntedHouse) {
    _textTwistChallenge(ep, ln, sec, 'hauntedHouse', 'HAUNTED HOUSE', [
      rpBuildHauntedTitleCard, rpBuildHauntedLibrary, rpBuildHauntedKeys, rpBuildHauntedBoss,
    ]);
  }
  if (ep.hungOut) {
    _textTwistChallenge(ep, ln, sec, 'hungOut', 'HUNG OUT TO DRY', [
      rpBuildHungTitleCard, rpBuildHungWarmup, rpBuildHungKnife, rpBuildHungFinal,
    ]);
  }
  if (ep.princessPride) {
    _textTwistChallenge(ep, ln, sec, 'princessPride', 'THE PRINCESS PRIDE', [
      rpBuildPrincessPrideTitleCard, rpBuildPrincessPrideCeremony,
      rpBuildPrincessPrideForest, rpBuildPrincessPrideBridge,
      rpBuildPrincessPrideDragon, rpBuildPrincessPrideTower, rpBuildPrincessPrideDuel,
    ]);
  } else _textPrincessPride(ep, ln, sec);
  if (ep.getAClue) {
    _textTwistChallenge(ep, ln, sec, 'getAClue', 'GET A CLUE — MURDER MYSTERY', [
      rpBuildGetAClueTitleCard, rpBuildGetAClueCollection, rpBuildGetAClueTrain,
      rpBuildGetAClueTrial, rpBuildGetAClueVerdict,
    ]);
  } else _textGetAClue(ep, ln, sec);
  if (ep.rockNRule) {
    _textTwistChallenge(ep, ln, sec, 'rockNRule', 'ROCK N\' RULE', [
      rpBuildRockNRuleTitleCard, rpBuildRockNRuleGuitar, rpBuildRockNRuleCarpet,
      rpBuildRockNRuleHotel, rpBuildRockNRuleResults,
    ]);
  } else _textRockNRule(ep, ln, sec);
  if (ep.crouchingCourtney) {
    _textTwistChallenge(ep, ln, sec, 'crouchingCourtney', 'WAY OF THE WARRIOR', [
      rpBuildCrouchingCourtneyTitleCard, rpBuildCrouchingCourtneyTraining,
      rpBuildCrouchingCourtneyFight, rpBuildCrouchingCourtneyClimb,
    ]);
  } else _textCrouchingCourtney(ep, ln, sec);
  if (ep.houston) {
    _textTwistChallenge(ep, ln, sec, 'houston', 'HOUSTON, WE HAVE A PROBLEM', [
      rpBuildHoustonTitleCard, rpBuildHoustonZeroG,
      rpBuildHoustonRedAlert, rpBuildHoustonReEntry,
      rpBuildHoustonSprint, rpBuildHoustonWinner,
    ]);
  }
  if (ep.topDog) {
    _textTwistChallenge(ep, ln, sec, 'topDog', 'TOP DOG', [
      rpBuildTopDogTitleCard, rpBuildTopDogAssignment,
      rpBuildTopDogTraining, rpBuildTopDogJudging,
      rpBuildTopDogForest, rpBuildTopDogWinner,
    ]);
  }
  if (ep.walkEgypt) {
    _textTwistChallenge(ep, ln, sec, 'walkEgypt', 'WALK LIKE AN EGYPTIAN', [
      rpBuildEgyptTitleCard, rpBuildEgyptPyramid,
      rpBuildEgyptDesert, rpBuildEgyptNile,
      rpBuildEgyptResults,
    ]);
  }
  if (ep.brutaler) {
    _textTwistChallenge(ep, ln, sec, 'brutaler', 'BIGGER! BADDER! BRUTAL-ER!', [
      rpBuildBigBaddTitleCard, rpBuildBigBaddPhase1,
      rpBuildBigBaddPhase2, rpBuildBigBaddPhase3,
      rpBuildBigBaddResults,
    ]);
  }
  if (ep.crazyFunTime) {
    const cftBuilders = [rpBuildCFTTitleCard, rpBuildCFTPinball, rpBuildCFTDramaBreak];
    const cftTribes = ep.crazyFunTime?.tribes || [];
    for (let i = 0; i < cftTribes.length; i++) {
      cftBuilders.push((e) => rpBuildCFTCommercial(e, i));
    }
    cftBuilders.push(rpBuildCFTVerdict, rpBuildCFTResults);
    _textTwistChallenge(ep, ln, sec, 'crazyFunTime', 'SUPER HAPPY CRAZY FUN TIME', cftBuilders);
  }
  if (ep.frozenCrossing) {
    _textTwistChallenge(ep, ln, sec, 'frozenCrossing', 'FROZEN CROSSING', [
      rpBuildFCTitleCard, rpBuildFCPhase1, rpBuildFCSledAssignment, rpBuildFCPhase2, rpBuildFCResults
    ]);
  }
  if ((ep.challengeData || ep.bridalBrawls) && ep.isBridalBrawls) {
    if (ep.bridalBrawls && !ep.challengeData) ep.challengeData = ep.bridalBrawls;
    _textTwistChallenge(ep, ln, sec, 'challengeData', 'BRIDAL BRAWLS', [
      rpBuildBRBTitleCard, rpBuildBRBSlotMachine, rpBuildBRBObstacleCourse, rpBuildBRBTightrope, rpBuildBRBCustomsTrivia, rpBuildBRBFinalResults
    ]);
  }
  if ((ep.challengeData || ep.greatFakeOut) && ep.isGreatFakeOut) {
    if (ep.greatFakeOut && !ep.challengeData) ep.challengeData = ep.greatFakeOut;
    _textTwistChallenge(ep, ln, sec, 'challengeData', 'THE GREAT FAKE-OUT', [
      rpBuildGFOTitleCard, rpBuildGFOScramble, rpBuildGFORace, rpBuildGFOTransition, rpBuildGFOEating, rpBuildGFOResults
    ]);
  }
  if ((ep.challengeData || ep.africanLyingSafari) && ep.isAfricanLyingSafari) {
    if (ep.africanLyingSafari && !ep.challengeData) ep.challengeData = ep.africanLyingSafari;
    _textTwistChallenge(ep, ln, sec, 'challengeData', 'AFRICAN LYING SAFARI', [
      rpBuildSafariColdOpen, rpBuildSafariPhase1, rpBuildSafariPhase2, rpBuildSafariHunt, rpBuildSafariResults
    ]);
  }
  if (ep.challengeData && ep.isRapaPhooey) {
    _textTwistChallenge(ep, ln, sec, 'challengeData', 'RAPA PHOOEY!', [rpBuildRPTitleCard, rpBuildRPFieldPhase, rpBuildRPCavePhase, rpBuildRPPillarPhase, rpBuildRPResults]);
  }
  if (ep.challengeData && ep.isDrumheller) {
    _textTwistChallenge(ep, ln, sec, 'challengeData', 'AWWWWWW, DRUMHELLER', [rpBuildDHTitleCard, rpBuildDHBuildPhase, rpBuildDHVotePhase, rpBuildDHDigPhase, rpBuildDHResults]);
  }
  if (ep.iceIceBaby) {
    _textTwistChallenge(ep, ln, sec, 'iceIceBaby', 'ICE ICE BABY', [
      rpBuildIIBTitleCard, rpBuildIIBSummit, rpBuildIIBFortBuild, rpBuildIIBCtfAssault, rpBuildIIBResults
    ]);
  }
  if (ep.findersCreepers) {
    _textTwistChallenge(ep, ln, sec, 'findersCreepers', 'FINDERS CREEPERS', [
      rpBuildFCRTitleCard, rpBuildFCRForest, rpBuildFCRCemetery, rpBuildFCRCave, rpBuildFCRResults
    ]);
  }
  if (ep.backstabbersAhoy) {
    _textTwistChallenge(ep, ln, sec, 'backstabbersAhoy', 'BACKSTABBERS AHOY', [
      rpBuildBATitleCard, rpBuildBADive, rpBuildBARace, rpBuildBAResults
    ]);
  }
  if (ep.projectRunaway) {
    const prBuilders = [rpBuildPRTitleCard, rpBuildPRRoles, rpBuildPRCreatureHunt, rpBuildPRDesignStudio, rpBuildPRRunway];
    if (ep.projectRunaway.berserkTriggered) prBuilders.push(rpBuildPRBerserk);
    prBuilders.push(rpBuildPRResults);
    _textTwistChallenge(ep, ln, sec, 'projectRunaway', 'PROJECT RUNAWAY', prBuilders);
  }
  if (ep.isPlanesTrains && (ep.planesTrains || ep.challengeData)) {
    _textTwistChallenge(ep, ln, sec, ep.planesTrains ? 'planesTrains' : 'challengeData', 'PLANES TRAINS & HOT AIR MOBILES', [
      rpBuildPTTitleCard, rpBuildPTScavenge, rpBuildPTLandRace, rpBuildPTSeaCrossing, rpBuildPTBeachSprint, rpBuildPTResults
    ]);
  }
  if (ep.vikingSour) {
    _textTwistChallenge(ep, ln, sec, 'vikingSour', 'VIKING SOUR', [
      rpBuildVSTitleCard, rpBuildVSPhase1, rpBuildVSPhase2, rpBuildVSPhase3, rpBuildVSResults
    ]);
  }
  if (ep.picnicHangingDork) {
    _textTwistChallenge(ep, ln, sec, 'picnicHangingDork', 'PICNIC AT HANGING DORK', [
      rpBuildHDTitleCard, rpBuildHDEmuWrangling, rpBuildHDEmuRace, rpBuildHDBungeeGrab, rpBuildHDResults
    ]);
  }
  if (ep.slapRevolution) {
    const ssrRoundBuilders = (ep.slapRevolution.tournament?.rounds || []).map((_, ri) => (e) => rpBuildSSRRound(e, ri));
    _textTwistChallenge(ep, ln, sec, 'slapRevolution', 'SLAP SLAP REVOLUTION', [
      rpBuildSSRTitleCard, rpBuildSSRGrind, rpBuildSSRDescent, rpBuildSSRHats, rpBuildSSRDraft, ...ssrRoundBuilders, rpBuildSSRResults
    ]);
  }
  if (ep.broadwayBaby) {
    _textTwistChallenge(ep, ln, sec, 'broadwayBaby', 'BROADWAY BABY', [
      rpBuildBBTitleCard, rpBuildBBPhase1, rpBuildBBPhase2, rpBuildBBPhase3, rpBuildBBResults
    ]);
  }
  if (ep.amazonRace) {
    _textTwistChallenge(ep, ln, sec, 'amazonRace', 'THE AM-AH-ZON RACE', [
      rpBuildAZTitleCard, rpBuildAZZipline, rpBuildAZTrek, rpBuildAZGuardian, rpBuildAZRuins, rpBuildAZResults
    ]);
  }
  if (ep.nightAtMuseum) {
    _textTwistChallenge(ep, ln, sec, 'nightAtMuseum', 'NIGHT AT THE MUSEUM', [
      rpBuildNMTitleCard, rpBuildNMSecurity, rpBuildNMGallery, rpBuildNMAssembly, rpBuildNMResults
    ]);
  }
  if (ep.truthOrShark) {
    _textTwistChallenge(ep, ln, sec, 'truthOrShark', 'TRUTH OR SHARK', [
      rpBuildTlsTitleCard, rpBuildTlsRounds, rpBuildTlsResults
    ]);
  }
  if (ep.rockTheDock) {
    _textTwistChallenge(ep, ln, sec, 'rockTheDock', 'ROCK THE DOCK', [
      rpBuildRTDTitleCard, rpBuildRTDSwim, rpBuildRTDRelay, rpBuildRTDResults,
    ]);
  }
  if (ep.tropicalTakedown) {
    _textTwistChallenge(ep, ln, sec, 'tropicalTakedown', 'TROPICAL TAKEDOWN', [
      rpBuildTTTitleCard, rpBuildTTCaptainDraft, rpBuildTTCliffDive, rpBuildTTLongboardRace, rpBuildTTResults,
    ]);
  }
  if (ep.midnightManhunt) {
    _textTwistChallenge(ep, ln, sec, 'midnightManhunt', 'MIDNIGHT MANHUNT', [
      rpBuildMMTitleCard, rpBuildMMGuardStrip, rpBuildMMRack, rpBuildMMManhunt, rpBuildMMResults,
    ]);
  }
  if (ep.challengeData && ep.isGreecesPieces) {
    const gpBuilders = [rpBuildGPTitleCard, rpBuildGPMaze, rpBuildGPWrestling, rpBuildGPHurdles];
    if (ep.challengeData.icarus) gpBuilders.push(rpBuildGPIcarus);
    gpBuilders.push(rpBuildGPResults);
    _textTwistChallenge(ep, ln, sec, 'challengeData', "GREECE'S PIECES", gpBuilders);
  }
  if (ep.challengeData && ep.isHangarBlack) {
    _textTwistChallenge(ep, ln, sec, 'challengeData', 'OPERATION: HANGAR BLACK', [
      rpBuildHBTitleCard, rpBuildHBEntry, rpBuildHBHunt, rpBuildHBExtract, rpBuildHBResults
    ]);
  }
  if (ep.alienEgg) {
    _textTwistChallenge(ep, ln, sec, 'alienEgg', 'ALIEN RESURR-EGGTION', [
      rpBuildAlienEggTitleCard, rpBuildAlienEggRounds,
      rpBuildAlienEggImmunity, rpBuildAlienEggTribeResults,
      rpBuildAlienEggLeaderboard,
    ]);
  }
  if (ep.areWeThereYeti) {
    const ytBuilders = [rpBuildYetiDropOff];
    (ep.areWeThereYeti.pairs || []).forEach(p => ytBuilders.push((e) => rpBuildYetiTrail(e, p)));
    ytBuilders.push(rpBuildYetiTraps, rpBuildYetiNight, rpBuildYetiSprint, rpBuildYetiVerdict, rpBuildYetiElimination);
    _textTwistChallenge(ep, ln, sec, 'areWeThereYeti', 'ARE WE THERE YETI?', ytBuilders);
  }
  if (ep.truthOrDareTrain) {
    _textTwistChallenge(ep, ln, sec, 'truthOrDareTrain', 'TRUTH OR DARE TRAIN', [rpBuildTDTTitleCard, rpBuildTDTRace, rpBuildTDTResults]);
  }
  if (ep.aMazeInGrip) {
    _textTwistChallenge(ep, ln, sec, 'aMazeInGrip', 'A-MAZE-ING GRIP', [rpBuildAMGTitleCard, rpBuildAMGRace, rpBuildAMGResults]);
  }
  if (ep.polesApart) {
    _textTwistChallenge(ep, ln, sec, 'polesApart', 'POLES APART', [rpBuildPolesApartTitleCard, rpBuildPolesApartArena, rpBuildPolesApartResults]);
  }
  if (ep.tusksLadders) {
    _textTwistChallenge(ep, ln, sec, 'tusksLadders', 'TUSKS AND LADDERS', [rpBuildTusksTitleCard, rpBuildTusksHunt, rpBuildTusksFinish]);
  }
  if (ep.killerClown) {
    _textTwistChallenge(ep, ln, sec, 'killerClown', 'NIGHT OF THE KILLER CLOWN', [rpBuildClownTitleCard, rpBuildClownStalk, rpBuildClownRun]);
  }
  if (ep.bumperCarBash) {
    _textTwistChallenge(ep, ln, sec, 'bumperCarBash', 'BUMPER CAR BASH', [rpBuildBashTitleCard, rpBuildBashArena, rpBuildBashResults]);
  }
  if (ep.sayCheese) {
    _textTwistChallenge(ep, ln, sec, 'sayCheese', 'SAY CHEESE', [rpBuildCheeseTitleCard, rpBuildCheeseDrop, rpBuildCheeseResults]);
  }

  // ── CHAIN OF COMMAND ──
  _textChainOfCommand(ep, ln, sec);

  // ── POST-CHALLENGE ──
  _textCampPost(ep, ln, sec);
  _textMoleExposed(ep, ln, sec);
  _textTiedDestinies(ep, ln, sec);
  _textJuryElimination(ep, ln, sec); // mid-game jury-elimination twist replaces the tribal-council block
  _textVotingPlans(ep, ln, sec);
  _textTribalCouncil(ep, ln, sec);
  _textTheVotes(ep, ln, sec);
  _textMoleDisruption(ep, ln, sec);
  _textWhyVote(ep, ln, sec);
  _textMoleReveal(ep, ln, sec);
  _textVolunteerDuel(ep, ln, sec);
  _textSchoolyardPick(ep, ln, sec);
  _textAftermath(ep, ln, sec);
  _textSeasonThreads(ep, ln, sec); // tracked story threads — worker beat-sheet spine + reader recap
  _textAmbassadors(ep, ln, sec);
  _textRIDuel(ep, ln, sec);
  _textJuryLife(ep, ln, sec);
  _textCampOverview(ep, ln, sec);
  _textAftermath(ep, ln, sec);

  // Finale screens
  _textLastMorning(ep, ln, sec);
  _textOlympicRelay(ep, ln, sec);
  _textHawaiianPunch(ep, ln, sec);
  _textGrandChallenge(ep, ln, sec);
  _textFinalCut(ep, ln, sec);
  _textFTCQA(ep, ln, sec);
  _textJuryConvenes(ep, ln, sec);
  _textJuryVotes(ep, ln, sec);
  _textFanCampaign(ep, ln, sec);
  _textFanVote(ep, ln, sec);
  _textWinnerCeremony(ep, ln, sec);
  _textReunion(ep, ln, sec);
  _textSeasonStats(ep, ln, sec);

  // Writer extras
  _textWriterContext(ep, ln, sec);

  return L.join('\n');
}

export function buildStorylines(ep) {
  const lines = [], cfg = seasonConfig;
  const elim = ep.eliminated;

  // Last Chance arc
  if (ep.lastChance) {
    const _lc = ep.lastChance;
    const _wS = pStats(_lc.winner);
    const _wP = pronouns(_lc.winner);
    if (_lc.toTribe) {
      if (_wS.social >= 7) lines.push(`${_lc.winner} survived the Last Chance Challenge and just walked into ${_lc.toTribe} camp. ${_wP.Sub} ${_wP.sub==='they'?'know':'knows'} how to win people over fast — which is exactly what ${_wP.sub} ${_wP.sub==='they'?'need':'needs'} right now.`);
      else if (_wS.strategic >= 7) lines.push(`${_lc.winner} beat ${_lc.loser} one-on-one and landed at ${_lc.toTribe}. ${_wP.Sub} ${_wP.sub==='they'?'have':'has'} no alliance and no safety. The question is whether ${_wP.sub} ${_wP.sub==='they'?'can':'can'} build something fast enough to matter.`);
      else lines.push(`${_lc.winner} is on ${_lc.toTribe} now. ${_wP.Sub} beat ${_lc.loser} to get there. That's a story — but stories don't vote. Numbers do.`);
    }
  }

  // Tribe dissolution arc
  if (ep.tribeDissolve && !ep.lastChance) {
    const _td = ep.tribeDissolve;
    const _s = pStats(_td.player);
    const _prn = pronouns(_td.player);
    if (_s.social >= 7) lines.push(`${_td.player} just joined ${_td.toTribe} with no numbers and no allies — but ${_prn.sub} ${_prn.sub==='they'?'know':'knows'} how to make people like them. That's the play.`);
    else if (_s.strategic >= 7) lines.push(`${_td.player} is the new face at ${_td.toTribe} camp. ${_prn.Sub} ${_prn.sub==='they'?'have':'has'} no alliance and no safety net. That's a problem. Or it's an opportunity — if ${_prn.sub} ${_prn.sub==='they'?'move':'moves'} fast.`);
    else lines.push(`${_td.player} arrives at ${_td.toTribe} camp as a free agent. ${_prn.Sub} ${_prn.sub==='they'?'didn\'t':'didn\'t'} choose these people. They didn't choose ${_prn.obj}. Now they have to coexist.`);
  }

  // RI arc
  if (cfg.ri && ep.riChoice === 'REDEMPTION ISLAND' && elim) {
    const s = pStats(elim);
    lines.push(s.physical >= 7 ? `${elim} arrives at RI as a challenge threat. Can anyone beat them in a duel?` : `${elim} refuses to go quietly. The underdog arc begins on Redemption Island.`);
  }

  // Named alliance storylines
  const namedActive = gs.namedAlliances?.filter(a => a.active && a.members.filter(m => gs.activePlayers.includes(m)).length >= 2) || [];
  // Most recently formed alliance
  const newestAlliance = namedActive[namedActive.length - 1];
  if (newestAlliance && newestAlliance.formed === ep.num) {
    const activeM = newestAlliance.members.filter(m => gs.activePlayers.includes(m));
    lines.push(`${newestAlliance.name} just formed — ${activeM.join(', ')}. Whether it holds is another question.`);
  } else if (newestAlliance) {
    const activeM = newestAlliance.members.filter(m => gs.activePlayers.includes(m));
    lines.push(`${newestAlliance.name} (${activeM.join(', ')}) is the most visible alliance in the game. Everyone not in it knows it.`);
  }
  // Recent betrayal storyline (this episode)
  const recentBetrayal = gs.namedAlliances?.flatMap(a => a.betrayals.filter(b => b.ep === ep.num))?.[0];
  if (recentBetrayal) {
    const betrayedAlliance = gs.namedAlliances.find(a => a.betrayals.some(b => b === recentBetrayal));
    lines.push(`${recentBetrayal.player} just broke ${betrayedAlliance?.name || 'their alliance'} — voted ${recentBetrayal.votedFor} while the rest went ${recentBetrayal.consensusWas}. That does not go unnoticed.`);
  }

  // Dominant player story — exclude the eliminated player, only credit if their plan worked
  const _domElim = ep.eliminated || ep.firstEliminated;
  const _domAlliance = ep.alliances
    ?.filter(a => a.members.length >= Math.ceil((ep.tribalPlayers?.length || 0) / 2))
    ?.[0];
  const dom = _domAlliance?.members?.find(m => gs.activePlayers.includes(m) && m !== _domElim);
  const _domEpVotes = ep.votes || {};
  const _domTotalV = Object.values(_domEpVotes).reduce((a,b)=>a+b,0);
  const _domElimShare = (_domEpVotes[_domElim] || 0) / Math.max(1, _domTotalV);
  const domPlanWorked = dom && (_domAlliance?.target === _domElim || _domElimShare > 0.5);
  if (dom) {
    const ds = pStats(dom);
    if (domPlanWorked && ds.strategic >= 8)
      lines.push(`${dom} controlled this vote cleanly. At what point does the rest of the game turn on them?`);
    else if (domPlanWorked && ds.social >= 7)
      lines.push(`${dom} is quietly liked by everyone. Nobody is naming them yet — but they should be.`);
    else if (!domPlanWorked && ds.strategic >= 8)
      lines.push(`${dom} ran the numbers going into tribal — but the vote landed somewhere else. The plan didn't hold.`);
  }

  // Dynamic bond storylines from gs.bonds
  const seen = new Set();
  const activePairs = [];
  gs.activePlayers.forEach(a => {
    gs.activePlayers.forEach(b => {
      if (a >= b) return;
      const k = bKey(a, b);
      if (seen.has(k)) return;
      seen.add(k);
      const val = gs.bonds?.[k] || 0;
      if (Math.abs(val) >= 2) activePairs.push({ a, b, val });
    });
  });
  activePairs.sort((x, y) => Math.abs(y.val) - Math.abs(x.val));
  const strongBond = activePairs.find(p => p.val >= 4);
  if (strongBond) lines.push(`${strongBond.a} and ${strongBond.b} are becoming inseparable. Everyone else sees it. Nobody is ready to break it up yet.`);
  const bigRival = activePairs.find(p => p.val <= -3);
  if (bigRival) lines.push(`${bigRival.a} and ${bigRival.b} can barely be in the same space. That animosity will force a decision before the end.`);

  // Pre-defined relationships (all-star seasons)
  const activeRels = relationships.filter(r => gs.activePlayers.includes(r.a) && gs.activePlayers.includes(r.b));
  const ub = activeRels.find(r => r.type === 'unbreakable');
  if (ub) lines.push(`${ub.a} + ${ub.b}: Unbreakable Bond still intact. How long before the rest of the game forces a choice?`);
  const rival = activeRels.find(r => r.type === 'rival' || r.type === 'enemy');
  if (rival) lines.push(`${rival.a} vs ${rival.b}: ${rival.note || 'The tension between them is still there. It has not been resolved.'}`);

  // Someone on the outs — low average bond with everyone
  const outcast = gs.activePlayers.find(p => {
    const others = gs.activePlayers.filter(q => q !== p);
    const avg = others.reduce((sum, q) => sum + (gs.bonds?.[bKey(p, q)] || 0), 0) / Math.max(1, others.length);
    return avg < -1;
  });
  if (outcast) {
    const os = pStats(outcast);
    lines.push(os.strategic >= 7
      ? `${outcast} knows they are on the bottom. They are smart enough to know it. The question is whether that is enough.`
      : `${outcast} has rubbed people the wrong way and does not seem to know it. They are one bad tribal away from going home.`);
  }

  // Advantage holder storyline
  const adv = gs.advantages?.[0];
  if (adv) {
    const typeLabel = { idol: 'a Hidden Immunity Idol', voteSteal: 'a Vote Steal', extraVote: 'an Extra Vote', kip: 'Knowledge is Power', legacy: 'the Legacy Advantage', amulet: 'an Amulet Advantage' };
    lines.push(`${adv.holder} is sitting on ${typeLabel[adv.type] || 'a secret advantage'}. The longer they hold it, the more dangerous it becomes — for them and for everyone else.`);
  }

  // Twist-seeded storylines
  const allTwistsStory = ep.twists?.length ? ep.twists : (ep.twist ? [ep.twist] : []);
  allTwistsStory.forEach(tw => {
    if (!tw?.type) return;
    if (tw.type === 'loved-ones') lines.push(`The loved ones visit cracked something open. Players who seemed composed showed a side the game hadn't seen. That vulnerability doesn't disappear after the visit ends.`);
    if (tw.type === 'tribe-swap' || tw.type === 'tribe-dissolve' || tw.type === 'tribe-expansion' || tw.type === 'abduction') lines.push(`The swap reshuffled more than just tribes. Old loyalties are still there — but so is the reality that everyone is sleeping next to different people now.`);
    if (tw.type === 'cultural-reset') lines.push(`The reset blew up the social contract. Everything everyone thought was private is now public. The scramble starts from zero.`);
    if (tw.type === 'returning-player') {
      const _rpN = tw.returnees?.length || 1;
      if (_rpN === 1) lines.push(`A player came back. The tribe that voted them out has to decide whether that's a threat or an asset. Both options have a cost.`);
      else lines.push(`${_rpN} players came back. The game that moved on without them just got a lot more crowded. Every existing alliance has to recalculate.`);
    }
    if (tw.type === 'slasher-night') lines.push(`Someone was eliminated without a vote. The tribe woke up one smaller and nobody knows who made the call. That paranoia does not leave quickly.`);
    if (tw.type === 'journey') lines.push(`The players who went on the journey came back knowing something. Whether they share it — or use it alone — will define the next few episodes.`);
  });

  // Events from this episode that seeded ongoing threads
  const allEvents = allCampEvents(ep);
  const flirt = allEvents.find(e => e.type === 'flirtation');
  if (flirt) {
    const text = flirt.text;
    // Extract names from the flirtation text (first two proper nouns) — just surface it as a storyline
    lines.push(`Something is developing at camp that has nothing to do with strategy. The tribe has noticed. Whether it helps or hurts someone's game is an open question.`);
  }
  const lied = allEvents.find(e => e.type === 'lie');
  if (lied) lines.push(`A lie is in the air this episode. Someone planted it. Someone else is carrying it around as fact. When it surfaces, it will damage more than one relationship.`);
  const eavesdropped = allEvents.find(e => e.type === 'eavesdrop');
  if (eavesdropped) lines.push(`Someone knows something they weren't supposed to know. They haven't used it yet. That won't last.`);
  const pranked = allEvents.find(e => e.type === 'prank' && e.text.includes('does not'));
  if (pranked) lines.push(`A prank went wrong. The tension from it is still sitting in camp, unresolved.`);
  const lcEvent = allEvents.find(e => e.type === 'leadershipClash');
  if (lcEvent) lines.push(`Two people both tried to lead today. The tribe noticed. One of them is going to have to back down — or the tribe will make the decision for them.`);

  // Phase approaching
  if (!gs.isMerged && gs.activePlayers.length <= (cfg.mergeAt || 12) + 2) lines.push('Merge is two eliminations away at most. Cross-tribe bonds are currency right now. Who has them?');
  if (cfg.ri && gs.riPlayers.length) lines.push(`${gs.riPlayers.join(' and ')} on RI — waiting. Watching. The door back into the game is still open.`);

  // Generic fallback only if truly nothing generated
  if (!lines.length) lines.push('The alliances are still forming. The first vote set a precedent — who follows it, and who is already thinking differently?');
  return lines.slice(0, 6);
}

export function buildColdOpen(ep) {
  // Cold open = NEXT episode's opening scene, set back at camp after this tribal
  const elim = ep.eliminated;
  const majority = ep.alliances?.find(a => a.members.length >= Math.ceil((ep.tribalPlayers?.length||0)/2));
  const hub = majority?.members?.[0];
  const hubS = hub ? pStats(hub) : null;

  // Find someone who voted against the majority (a dissenter)
  const dissenter = ep.votingLog?.find(v => v.voted !== elim && elim)?.voter;
  // Find someone who might be shaken — was on the wrong side
  const wrongSide = ep.votingLog?.find(v => v.voted !== elim && elim && ep.alliances?.find(a => a.members.includes(v.voter) && a.members.length < Math.ceil((ep.tribalPlayers?.length||0)/2)))?.voter;

  // Active pre-game rivalry/bond for drama
  const activeRels = relationships.filter(r => gs.activePlayers.includes(r.a) && gs.activePlayers.includes(r.b));
  const rival = activeRels.find(r => r.type === 'enemy' || r.type === 'rival');
  const bond = activeRels.find(r => r.type === 'unbreakable');

  // Pick players for variety hooks — must be from the same camp (tribal tribe when pre-merge)
  let hookPool;
  if (gs.phase === 'pre-merge' && ep.tribalPlayers?.length) {
    // Post-tribal episode: use surviving players from the tribe that just voted
    hookPool = ep.tribalPlayers.filter(p => gs.activePlayers.includes(p));
  } else if (gs.phase === 'pre-merge' && gs.tribes.length) {
    // No-tribal / slasher: pick one tribe at random so p1+p2 are at the same camp
    const tribe = gs.tribes[Math.floor(Math.random() * gs.tribes.length)];
    hookPool = tribe.members.filter(p => gs.activePlayers.includes(p));
  } else {
    hookPool = [...gs.activePlayers];
  }
  if (!hookPool.length) hookPool = [...gs.activePlayers];
  // Solo-player tribe: return a single-player narrative immediately (no p2 available)
  if (hookPool.length === 1) {
    const solo = hookPool[0];
    const soloLines = [
      `${solo} is alone at camp. No alliances to navigate, no conversations to manage, no one watching. Just ${solo} and the fire and the knowledge that this can't last much longer.`,
      `${solo} wakes up on an empty beach. There's something clarifying about it — no noise, no politics, no one to trust or distrust. Just survival. For now.`,
      `${solo} sits at the edge of camp as the sun goes down. Alone has its advantages. Alone also has an expiration date.`,
      `${solo} is the last one standing on their tribe. They've already survived what was supposed to end them. Whether that matters when the merge comes is another question.`,
    ];
    return soloLines[Math.floor(Math.random() * soloLines.length)];
  }
  const rndPlayer = () => hookPool[Math.floor(Math.random() * hookPool.length)];
  const p1 = rndPlayer();
  const p2pool = hookPool.filter(p => p !== p1);
  const p2 = p2pool.length ? p2pool[Math.floor(Math.random() * p2pool.length)] : p1;
  const advHolder = gs.advantages?.find(a => gs.activePlayers.includes(a.holder));

  // ── Category buckets — one option added per category so no type dominates ──
  const pool = [];

  // [ROCK DRAW] — only fires when relevant, takes priority
  if (ep.isRockDraw && elim) {
    pool.push(`Nobody chose to send ${elim} home. A rock did. The tribe sits in silence at camp, processing something nobody knows how to talk about.`);
    pool.push(`Morning. The tribe barely looks at each other. Everyone is thinking about what they almost drew.`);
    return pool[Math.floor(Math.random() * pool.length)];
  }

  // [POST-TRIBAL FALLOUT] — one option, only if a meaningful vote happened
  if (elim) {
    const fallout = [];
    if (hub && hubS?.strategic >= 8) fallout.push(`${hub} got exactly what they wanted from tribal. That is the most dangerous sentence in this game.`);
    if (wrongSide) fallout.push(`${wrongSide} lost the vote. They know it. But they're still here — and in this game, still here is everything.`);
    if (dissenter && dissenter !== elim) fallout.push(`${dissenter} was on the wrong side of the numbers tonight. Morning comes and nobody says anything. That silence is louder than any conversation.`);
    fallout.push(`The tribe wakes up one player smaller. The game doesn't pause to mourn. It never does.`);
    pool.push(fallout[Math.floor(Math.random() * fallout.length)]);
  }

  // [MORNING ROUTINE] — mundane, character-driven, no vote reference
  const morning = [
    `${p1} is the first one up. They poke the fire back to life and sit there in the dark for a while. Not strategizing. Just existing. For now.`,
    `The sun isn't up yet. ${p1} is already moving — water, wood, a rhythm that looks like helpfulness. It might be.`,
    `Morning. Someone burned the rice. Nobody admits it. The tribe eats it anyway.`,
    `${p1} finds a crab near camp and holds it up like a trophy. ${p2} refuses to cook it. They argue about this for forty minutes.`,
    `Two players slept on opposite ends of camp last night. They both pretend they didn't notice.`,
    `The rain starts before sunrise. Camp is soaked before anyone wakes up. Everything is miserable. Nobody wants to be the first to complain.`,
    `${p1} starts humming something while gathering wood. By mid-morning half the tribe is humming the same thing without realizing it.`,
    `The shelter is leaking again. ${p1} patches it. It leaks somewhere else. That's this game in miniature.`,
    `${p1} catches ${p2} going through their bag. ${p2} says they were looking for sunscreen. Maybe they were.`,
    `Someone made a joke at breakfast that landed wrong. The tribe laughed anyway. It's going to come up later.`,
    `${p1} hasn't eaten enough in three days and they're starting to feel it. They don't say anything. They can't afford to look weak right now.`,
  ];
  pool.push(morning[Math.floor(Math.random() * morning.length)]);

  // [CHARACTER MOMENT] — one player revealing who they are
  const character = [
    `${p1} is quiet today. Not thinking-quiet — something-is-wrong quiet. The tribe notices. Nobody asks.`,
    `${p1} spends twenty minutes alone near the water. They come back with a different energy. Whatever decision they made out there, it's made.`,
    `${p1} works harder at camp today than anyone else. That's not an accident. They are building something.`,
    `${p1} volunteers for everything today. Firewood. Water. Cooking. The tribe is grateful. They should also be suspicious.`,
    `${p1} laughs too easily today. When someone plays that relaxed, either everything is fine — or nothing is.`,
    `${p1} wanders off alone for an hour. When they come back they say they were "just walking." Nobody believes that.`,
    `${p1} catches ${p2}'s eye across camp. Neither of them looks away first. Neither of them says what that means.`,
  ];
  pool.push(character[Math.floor(Math.random() * character.length)]);

  // [RIVALRY / BOND] — relationship-driven, only if relevant
  if (rival) {
    const rivalLines = [
      `${rival.a} and ${rival.b} haven't spoken since tribal. They don't need to. The look across the fire says everything.`,
      `${rival.a} and ${rival.b} work on camp at the same time and never once acknowledge each other. That takes more effort than talking.`,
      `${rival.b} makes a comment at breakfast that was clearly aimed at ${rival.a}. ${rival.a} lets it land and smiles. That's worse.`,
    ];
    pool.push(rivalLines[Math.floor(Math.random() * rivalLines.length)]);
  } else if (bond) {
    const bondLines = [
      `${bond.a} and ${bond.b} are working well together — almost too well. The rest of the tribe is watching and starting to do the math.`,
      `${bond.a} checks in with ${bond.b} before doing anything. The tribe has clocked it. Whether they say something about it is another question.`,
    ];
    pool.push(bondLines[Math.floor(Math.random() * bondLines.length)]);
  }

  // [ADVANTAGE / SECRET] — if someone holds something
  if (advHolder) {
    const advLines = [
      `${advHolder.holder} has a secret. They carry it quietly through the morning — fire, water, small talk. Nobody knows. Not yet.`,
      `${advHolder.holder} checks their bag when nobody is looking. Still there. They zip it back up and return to camp like nothing happened.`,
      `${advHolder.holder} knows something the rest of the tribe doesn't. You can't see it on their face. That's the point.`,
    ];
    pool.push(advLines[Math.floor(Math.random() * advLines.length)]);
  }

  // [MERGE APPROACHING] — only when close
  if (!gs.isMerged && gs.activePlayers.length <= (seasonConfig.mergeAt || 12) + 2) {
    pool.push([
      `The numbers are getting small. Somewhere on another beach, people they've never spoken to are planning for a world where the tribes no longer exist.`,
      `Merge is close. Everyone can feel it — the way camp gets quieter, the way people stop making long-term plans out loud.`,
      `${p1} does the math out loud without meaning to. If merge is next, the tribe swap just became the most important thing that happened all season.`,
    ][Math.floor(Math.random() * 3)]);
  }

  // [RI] — if Redemption Island is active
  if (seasonConfig.ri && gs.riPlayers.length) {
    const ri = gs.riPlayers[gs.riPlayers.length-1];
    pool.push([
      `On Redemption Island, ${ri} wakes up alone. They start a fire. They don't have a choice about what happens next — but they have a choice about how they face it.`,
      `${ri} paces the Redemption Island camp as the sun comes up. Back home the vote already happened. Out here time moves differently.`,
    ][Math.floor(Math.random() * 2)]);
  }

  // [NO ELIM] — no tribal this episode
  if (!elim) {
    pool.push([
      `No one went home. The tribe returns to camp and acts like everything is fine. Nothing is fine.`,
      `Tribal was cancelled. The tension that was supposed to be released at the vote is still sitting in camp, looking for somewhere to go.`,
      `The vote didn't happen — which means everything that was about to happen is still in play, still unresolved, still live.`,
    ][Math.floor(Math.random() * 3)]);
  }

  // Fallback if somehow pool is still empty
  if (!pool.length) {
    pool.push(`New day. Same game. Different math.`);
    pool.push(`The fire burns down overnight. By sunrise the tribe has already had three separate conversations nobody reported.`);
  }

  return pool[Math.floor(Math.random() * pool.length)];
}

export function buildNextEpQs(ep) {
  const qs = [], cfg = seasonConfig, elim = ep.eliminated;
  const active = gs.activePlayers;
  const _rp = arr => arr[Math.floor(Math.random() * arr.length)];

  // Twist-driven questions
  if (ep.lastChance) {
    const _lc = ep.lastChance;
    if (_lc.toTribe) qs.push(`${_lc.winner} just survived the Last Chance Challenge and joined ${_lc.toTribe} — do they find allies, or are they the next target?`);
  } else if (ep.tribeDissolve) {
    qs.push(`${ep.tribeDissolve.player} just joined ${ep.tribeDissolve.toTribe} with no allies — do they find a foothold, or are they the next boot?`);
  }
  if (cfg.ri && ep.riChoice === 'REDEMPTION ISLAND' && elim) qs.push(`Can ${elim} survive their first RI duel?`);
  if (gs.riPlayers.length >= 2) qs.push(`${gs.riPlayers.join(' vs ')} — who wins the duel?`);

  // Merge proximity
  if (!gs.isMerged && active.length <= (cfg.mergeAt || 12) + 2) qs.push('The merge is close. Who has the numbers to survive it?');

  // Dominant player — varied phrasing
  const dom = ep.alliances?.find(a => a.members.length >= Math.ceil((ep.tribalPlayers?.length || 0) / 2))?.members?.[0];
  if (dom && active.includes(dom)) {
    qs.push(_rp([
      `${dom} ran the vote tonight. Can anyone break that grip before it's too late?`,
      `${dom} is calling the shots. The question isn't if someone tries to stop it — it's who goes first.`,
      `${dom} controlled the numbers again. At what point does the rest of the tribe decide enough is enough?`,
    ]));
  }

  // Close vote aftermath
  if (ep.votes) {
    const sorted = Object.entries(ep.votes).sort(([,a],[,b]) => b - a);
    if (sorted.length >= 2 && sorted[0][1] - sorted[1][1] <= 1 && active.includes(sorted[1][0])) {
      qs.push(`${sorted[1][0]} survived by a single vote. Do they scramble or play it cool?`);
    }
  }

  // Idol holder questions
  const idolHolders = (gs.advantages || []).filter(a => a.type === 'idol' && active.includes(a.holder)).map(a => a.holder);
  if (idolHolders.length) {
    qs.push(_rp([
      `${idolHolders[0]} is holding an idol. Does the tribe know? And if they do — what's the plan?`,
      `There's a hidden idol in play. The wrong vote could blow up in someone's face.`,
    ]));
  }

  // Alliance tension
  const tensedAlliances = (gs.namedAlliances || []).filter(a => {
    if (!a.active) return false;
    const am = a.members.filter(m => active.includes(m));
    if (am.length < 2) return false;
    let totalBond = 0, pairs = 0;
    for (let i = 0; i < am.length; i++) for (let j = i + 1; j < am.length; j++) { totalBond += getBond(am[i], am[j]); pairs++; }
    return pairs > 0 && totalBond / pairs < 1;
  });
  if (tensedAlliances.length) {
    const t = tensedAlliances[0];
    qs.push(`${t.name} is showing cracks. How long before someone exploits it?`);
  }

  // Free agents
  const freeAgents = active.filter(n => !(gs.namedAlliances || []).some(a => a.active && a.members.includes(n) && a.members.filter(m => active.includes(m)).length >= 2));
  if (freeAgents.length === 1) {
    qs.push(`${freeAgents[0]} has no alliance. Are they the next target — or the next swing vote?`);
  } else if (freeAgents.length >= 2) {
    qs.push(`${freeAgents.slice(0,2).join(' and ')} are both on the outside. Do they find each other?`);
  }

  // Emotional state questions
  const desperate = active.filter(n => gs.playerStates?.[n]?.emotional === 'desperate');
  if (desperate.length) {
    qs.push(`${desperate[0]} is desperate. Desperate players make big moves — or big mistakes.`);
  }

  // Post-merge specific
  if (gs.isMerged && active.length <= 7) {
    qs.push(_rp([
      `With ${active.length} left, every vote is personal. Who draws the line?`,
      `The endgame is here. Shields are becoming threats. Who goes first?`,
      `${active.length} players remain. The margin for error just disappeared.`,
    ]));
  }

  // Fallback
  if (!qs.length) qs.push(_rp([
    'The game is wide open. Anything can happen next.',
    'No one is safe. The question is who figures that out first.',
    'The next vote will define the rest of this season.',
  ]));

  return qs.slice(0, 4);
}
