// js/text-backlog.js - Text backlog generators for non-challenge episode sections
import { gs, seasonConfig, players } from './core.js';
import { pStats, pronouns, challengeWeakness } from './players.js';
import { getBond, bondLabel, bondFeeling } from './bonds.js';

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
import { _textHideAndBeSneaky } from './chal/hide-and-be-sneaky.js';
import { _textOffTheChain } from './chal/off-the-chain.js';
import { _textWawanakwaGoneWild } from './chal/wawanakwa-gone-wild.js';
import { _textTriArmedTriathlon } from './chal/tri-armed-triathlon.js';
import { _textCampCastaways } from './chal/camp-castaways.js';

export function _textStripHtml(s) { return s ? s.replace(/<[^>]+>/g, '') : ''; }

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
  ln(`Season: ${cfg.name||'Unknown'} | Episode: ${ep.num} | Phase: ${gs.phase || 'unknown'} | Players Remaining: ${gs.activePlayers.length}`);
  if (cfg.ri && cfg.riFormat !== 'rescue') ln('Format: Redemption Island — voted out players may fight back via RI duels');
  if (cfg.ri && cfg.riFormat === 'rescue') ln('Format: Rescue Island — all eliminees go to Rescue Island (social game)');
}

// ── HEADER: CAST ──
export function _textCast(ep, ln, sec) {
  const cfg = seasonConfig;
  // Use CAST (ALL) header — current-season.html parser depends on this exact format
  // Each name on its own line so parseCastFromSummary's cleanNameLine/isProbablyName can read them
  sec('CAST (ALL)');
  ln(`STARTING CAST (${players.length}):`);
  players.forEach(p => ln(p.name));

  // Separate TRIBES section — current-season.html parser looks for === TRIBES header
  // Format: "TribeName Tribe (N): Name1, Name2" so Pattern 3 in current-season.html matches
  sec('TRIBES (ACTIVE)');
  if (ep.isMerge) {
    ln('MERGED THIS EPISODE');
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
  ln(gs.eliminated.length ? gs.eliminated.join(', ') : 'None yet.');
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
    if (prev.lastChance) {
      ln(`Ep.${prev.num}: Last Chance Challenge. ${prev.eliminated} was eliminated in a head-to-head duel.`);
    } else {
      ln(`Ep.${prev.num}: ${prev.immunityWinner ? prev.immunityWinner + ' won immunity. ' : ''}${prev.eliminated} was voted out${prev.riChoice === 'REDEMPTION ISLAND' ? ' and chose Redemption Island' : ''}.`);
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
    sec('RETURNS');
    ln(`${ep.riReentrant} wins the re-entry challenge and rejoins the game.`);
    if (ep.riReentryLosers?.length) ln(`Permanently eliminated: ${ep.riReentryLosers.join(', ')}`);
  }
  if (ep.exileDuelResult) {
    if (!ep.isRIReentry) sec('RETURNS');
    const _ed = ep.exileDuelResult;
    ln(`EXILE DUEL: ${_ed.exilePlayer} (exile) vs ${_ed.newBoot} (just voted out) — ${_ed.challengeLabel} duel.`);
    ln(`Winner: ${_ed.winner} — ${_ed.winner === _ed.exilePlayer ? 'returns to the game' : 'stays in the game'}.`);
    ln(`Loser: ${_ed.loser} — permanently eliminated.`);
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
        ln(`- ${p.a} and ${p.b} ${bondFeeling(p.val)}${note}.`);
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
  // Standalone reward challenge data
  if (ep.rewardChalData && !_rcTwist) {
    const rc = ep.rewardChalData;
    sec('REWARD CHALLENGE');
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
  sec('IMMUNITY CHALLENGE');
  if (ep.challengeType === 'tribe') {
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
export function _textTwists(ep, ln, sec) {
  const allTwists = ep.twists?.length ? ep.twists : (ep.twist ? [ep.twist] : []);
  // Filter out types handled by other sections
  const skipTypes = new Set(['reward-challenge','hero-duel','shared-immunity','double-safety','elimination-swap','exile-duel','fire-making','jury-elimination','tiebreaker-challenge']);
  const twists = allTwists.filter(t => !skipTypes.has(t.type));
  if (!twists.length && !ep.journey) return;
  sec('TWISTS');

  twists.forEach(tw => {
    if (tw.type === 'tribe-swap') {
      ln('TRIBE SWAP — all players redistributed into new tribes.');
      if (tw.newTribes) tw.newTribes.forEach(t => ln(`${t.name.toUpperCase()}: ${t.members.join(', ')}`));
      ln('New idols hidden for each tribe after the swap.');
    } else if (tw.type === 'double-elim') {
      ln('DOUBLE ELIMINATION — two players voted out this episode.');
    } else if (tw.type === 'no-tribal') {
      ln('NO TRIBAL COUNCIL this episode. No one is voted out.');
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
      ln('SURVIVOR AUCTION — players received $500 each to bid on items.');
      if (tw.auctionResults?.length) tw.auctionResults.forEach(r => ln(`${r.winner} won: ${r.label} — bid $${r.bid}${r.isPool ? ' (pooled)' : ''}.`));
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
  sec('CAMP — POST-CHALLENGE');
  Object.entries(ep.campEvents).forEach(([campName, phaseData]) => {
    if (Array.isArray(phaseData)) return;
    const postEvs = phaseData?.post || [];
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

  // Advantages being considered
  const advLines = [];
  const idolHolders = (ep.idolPlays||[]).map(i => i.player);
  if (idolHolders.length) advLines.push(`${idolHolders.join(' and ')} entered tribal with ${idolHolders.length > 1 ? 'idols' : 'an idol'}.`);
  if (ep.shotInDark?.player) advLines.push(`${ep.shotInDark.player} is weighing whether to play a Shot in the Dark.`);
  if (advLines.length) { ln(''); ln('ADVANTAGES:'); advLines.forEach(l => ln(l)); }

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
    ep.votingLog.forEach(({ voter, voted, reason }) => {
      const rv = ep.revoteLog?.find(r => r.voter === voter);
      let line = `${voter} voted for ${voted} — ${reason||'strategic read'}`;
      if (rv) { const rvReason = rv.reason ? ` — ${rv.reason}` : ''; line += `; voted for ${rv.voted} on revote${rvReason}`; }
      ln(line);
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
          if (p.misplay) ln(`IDOL MISPLAY: ${p.player} wasted the idol.`);
          else if (p.superIdol) ln(`SUPER IDOL: ${p.player}${p.playedFor ? ` for ${p.playedFor}` : ''} — ${p.votesNegated} votes cancelled.`);
          else if (p.playedFor) ln(`IDOL: ${p.player} for ${p.playedFor} — ${p.votesNegated} votes cancelled.`);
          else if (p.type !== 'kip' && p.type !== 'extraVote' && p.type !== 'voteSteal') ln(`IDOL: ${p.player} — ${p.votesNegated} votes cancelled.`);
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
      ln(`${_ed.loser} was eliminated via Exile Duel. ${_ed.exilePlayer} faced ${_ed.newBoot} in a ${_ed.challengeLabel} challenge. ${_ed.winner} won. ${_ed.loser} is permanently out.`);
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
    if (ep.isTie && !ep.isRockDraw) ln(`- Went to a revote`);
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
  const _juryElimTw = (ep.twists||[]).find(t => t.type === 'jury-elimination');
  const _tiebrkTw = (ep.twists||[]).find(t => t.type === 'tiebreaker-challenge');
  if (_elimSwapTw && ep.swapResult) {
    const sr = ep.swapResult;
    ln('');
    ln(`ELIMINATION SWAP — ${sr.swapper} was voted out but moves to ${sr.toTribe}. Nobody eliminated.`);
    ln(`${sr.swapper} chose ${sr.pickedPlayer} from ${sr.toTribe} in exchange.`);
  }
  if (_exileDuelTw && ep.exilePlayer) { ln(''); ln(`EXILE DUEL — ${ep.exilePlayer} voted out but sent to exile. Next episode: duel whoever gets voted out.`); }
  if (_fireMakingTw && ep.fireMaking) { const fm = ep.fireMaking; ln(''); ln(`SECOND LIFE — ${fm.player} was voted out but gets a second chance. Picks ${fm.opponent}. ${fm.winner} wins. ${fm.loser} eliminated.`); }
  if (_juryElimTw?.juryBooted) { ln(''); ln(`JURY ELIMINATION — ${_juryElimTw.juryBooted} was eliminated by the jury.`); }
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
  if (!ep.tribalBlowup && typeof buildCrashout === 'function') {
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
    const elimS = pStats(elim);
    const arch = elimP?.archetype || '';
    const archLabel = arch ? arch.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : '';
    ln('');
    ln(`${elim}${archLabel ? ` (${archLabel})` : ''} — the tribe has spoken.`);
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
  am.returnEvents?.forEach(re => { re.beats?.forEach(b => ln(`  [${re.tribe}] ${b}`)); });
}

// ── RI DUEL / RESCUE ISLAND ──
export function _textRIDuel(ep, ln, sec) {
  if (ep.riDuel) {
    sec('REDEMPTION ISLAND DUEL');
    ln(`Contestants: ${ep.riDuel.winner} vs ${ep.riDuel.loser}`);
    ln(`Result: ${ep.riDuel.winner} wins — remains on Redemption Island`);
    ln(`${ep.riDuel.loser} loses — permanently eliminated`);
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

  // Ongoing storylines
  ln('');
  ln('ONGOING STORYLINES:');
  buildStorylines(ep).forEach(s => ln(`- ${s}`));
}

// ── FINALE: REJECTED OLYMPIC RELAY ──
export function _textOlympicRelay(ep, ln, sec) {
  const rd = ep.relayData;
  if (!rd) return;
  sec('REJECTED OLYMPIC RELAY');

  const winner = ep.finaleChallengeWinner || ep.winner;
  const finalists = ep.finaleFinalists || [];

  // Pre-race pitches
  if (rd.pitches && Object.keys(rd.pitches).length) {
    ln('PRE-RACE PITCHES:');
    Object.entries(rd.pitches).forEach(([f, p]) => ln(`  ${f} (${p.type}): ${p.text}`));
  }

  // Bench assignments
  if (ep.benchAssignments && Object.keys(ep.benchAssignments).length) {
    ln('BENCH ASSIGNMENTS:');
    finalists.forEach(f => {
      const supporters = Object.entries(ep.benchAssignments)
        .filter(([, side]) => side === f).map(([name]) => name);
      if (supporters.length) ln(`  Team ${f}: ${supporters.join(', ')}`);
    });
  }

  // Bench flips
  if (rd.benchFlips?.length) {
    ln('BENCH FLIPS:');
    rd.benchFlips.forEach(flip => ln(`  ${flip.supporter} flipped from ${flip.from} to ${flip.to} (${flip.reason})`));
  }

  // Confessionals
  if (rd.confessionals?.length) {
    ln('PRE-RACE CONFESSIONALS:');
    rd.confessionals.forEach(c => ln(`  ${c.player}: "${c.text}"`));
  }

  // Assistants
  if (ep.assistants && Object.keys(ep.assistants).length) {
    ln('ASSISTANTS:');
    Object.entries(ep.assistants).forEach(([f, a]) => ln(`  ${f} chose ${a}`));
  }

  // Sabotage plants
  if (rd.plantedSabotage) ln(`SABOTAGE: ${rd.plantedSabotage.planter} planted a laxative cupcake targeting ${rd.plantedSabotage.targetFinalist}`);
  if (rd.plantedSabotage2) ln(`SABOTAGE: ${rd.plantedSabotage2.planter} greased the flagpole targeting ${rd.plantedSabotage2.targetFinalist}`);

  // Stage results
  if (ep.finaleChallengeStages?.length) {
    ep.finaleChallengeStages.forEach(stage => {
      ln(`--- ${stage.name} ---`);
      if (stage.desc) ln(`  ${stage.desc}`);
      if (stage.scores) {
        const sorted = Object.entries(stage.scores).sort(([,a],[,b]) => b - a);
        sorted.forEach(([name, score]) => ln(`  ${name}: ${typeof score === 'number' ? score.toFixed(1) : score}`));
      }
      if (stage.winner) ln(`  Stage winner: ${stage.winner}`);
    });
  }

  // Timeline events
  if (rd.timeline?.length) {
    ln('RELAY TIMELINE:');
    rd.timeline.forEach(ev => ln(`  [${ev.type}] ${ev.text}`));
  }

  // Final scores + placements
  if (ep.finaleChallengeScores) {
    ln('FINAL SCORES:');
    const sorted = Object.entries(ep.finaleChallengeScores).sort(([,a],[,b]) => b - a);
    sorted.forEach(([name, score], i) => ln(`  ${i + 1}. ${name}: ${score.toFixed(1)}`));
  }

  if (winner) ln(`WINNER: ${winner}`);

  // Sabotage summary
  if (ep.finaleSabotageEvents?.length) {
    ln('SABOTAGE EVENTS:');
    ep.finaleSabotageEvents.forEach(s => ln(`  ${s.text || `${s.planter || s.saboteur} sabotaged ${s.target || s.victim} (${s.type || 'unknown'})`}`));
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
  // Fan Call
  if (a.fanCall) {
    ln('');
    ln(`FAN CALL: ${a.fanCall.fanName} asks ${a.fanCall.target}: "${a.fanCall.question}"`);
    ln(`Answer: ${a.fanCall.answer}`);
  }
  // Fan Vote
  if (a.fanVote) {
    ln('');
    ln('FAN VOTE RESULTS:');
    a.fanVote.results.forEach(r => ln(`${r.name}: ${r.pct}%${r.name === a.fanVote.winner ? ' — RETURNING' : ''}`));
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
  ln(`Captains: ${sp.captains[0]} and ${sp.captains[1]} (${sp.captainSource === 'challenge' ? 'top challenge performers' : 'randomly selected'})`);
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

export function _textWriterContext(ep, ln, sec) {
  sec('WRITER CONTEXT');

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
  const L = [];
  const ln  = s => L.push(s);
  const sec = t => { ln(''); ln(`=== ${t} ===`); };

  // Header block
  _textMeta(ep, ln, sec);
  _textCast(ep, ln, sec);

  // Episode flow — VP screen order
  _textColdOpen(ep, ln, sec);
  _textReturns(ep, ln, sec);
  _textDockArrivals(ep, ln, sec);
  _textFirstImpressions(ep, ln, sec);
  _textFanVoteReturn(ep, ln, sec);
  _textSecondChanceVote(ep, ln, sec);
  _textMerge(ep, ln, sec);
  _textFeast(ep, ln, sec);
  _textCampPre(ep, ln, sec);
  _textRewardChallenge(ep, ln, sec);
  _textImmunityChallenge(ep, ln, sec);
  _textTwists(ep, ln, sec);
  _textExile(ep, ln, sec);
  _textCampPost(ep, ln, sec);
  _textMoleExposed(ep, ln, sec);
  _textTiedDestinies(ep, ln, sec);
  _textVotingPlans(ep, ln, sec);
  _textTribalCouncil(ep, ln, sec);
  _textTheVotes(ep, ln, sec);
  _textMoleDisruption(ep, ln, sec);
  _textWhyVote(ep, ln, sec);
  _textMoleReveal(ep, ln, sec);
  _textVolunteerDuel(ep, ln, sec);
  _textSchoolyardPick(ep, ln, sec);
  _textAftermath(ep, ln, sec);
  _textSlasherNight(ep, ln, sec);
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
  _textAmbassadors(ep, ln, sec);
  _textRIDuel(ep, ln, sec);
  _textJuryLife(ep, ln, sec);
  _textCampOverview(ep, ln, sec);
  _textAftermath(ep, ln, sec);

  // Finale screens
  _textOlympicRelay(ep, ln, sec);
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
