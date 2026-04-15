// js/advantages.js - Advantage finding, idol plays, advantage inheritance
import { gs, players, ADVANTAGES, seasonConfig } from './core.js';
import { pStats, pronouns, threatScore, getPlayerState } from './players.js';
import { getBond, getPerceivedBond, addBond } from './bonds.js';
import { computeHeat, wRandom } from './alliances.js';
import { resolveVotes } from './voting.js';

export function handleAdvantageInheritance(eliminatedName, ep) {
  if (!eliminatedName || !gs.advantages?.length) return;
  // Legacy willing
  const legacyAdvs = gs.advantages.filter(a => a.type === 'legacy' && a.holder === eliminatedName);
  legacyAdvs.forEach(adv => {
    const candidates = gs.activePlayers.filter(p => p !== eliminatedName);
    if (!candidates.length) return;
    const heir = candidates.sort((a, b) => getBond(eliminatedName, b) - getBond(eliminatedName, a))[0];
    adv.holder = heir;
    adv.inheritedFrom = eliminatedName;
    adv.inheritedEp = ep?.num || (gs.episode || 0) + 1;
    // Track for camp events next episode
    if (!gs.legacyInheritances) gs.legacyInheritances = [];
    gs.legacyInheritances.push({ from: eliminatedName, to: heir, ep: adv.inheritedEp });
  });
  // Amulet power upgrade — count remaining holders after this elimination
  const amuletAdvs = gs.advantages.filter(a => a.type === 'amulet');
  if (amuletAdvs.some(a => a.holder === eliminatedName)) {
    // Remove the eliminated player's amulet
    gs.advantages = gs.advantages.filter(a => !(a.type === 'amulet' && a.holder === eliminatedName));
    const remainingAmulets = gs.advantages.filter(a => a.type === 'amulet');
    // Update power level for remaining holders
    const newPower = remainingAmulets.length >= 3 ? 'extraVote' : remainingAmulets.length === 2 ? 'voteSteal' : remainingAmulets.length === 1 ? 'idol' : null;
    remainingAmulets.forEach(a => { a.amuletPower = newPower; });
    // Track for camp events
    if (!gs.amuletUpgrades) gs.amuletUpgrades = [];
    gs.amuletUpgrades.push({ eliminated: eliminatedName, remainingHolders: remainingAmulets.map(a => a.holder), newPower, ep: ep?.num || (gs.episode || 0) + 1 });
  }
}

export function findAdvantages(ep) {
  const cfg = seasonConfig;
  ep.idolFinds = ep.idolFinds || [];

  // ── IDOLS ──
  if (cfg.advantages?.idol?.enabled) {
    const tribeGroups = gs.isMerged
      ? [{ name: '__merge__', members: [...gs.activePlayers] }]
      : gs.tribes;

    tribeGroups.forEach(tribe => {
      const isMergeSlot = tribe.name === '__merge__';
      const hasSlot = isMergeSlot ? gs.mergeIdolHidden : (gs.idolSlots[tribe.name] || false);
      if (!hasSlot) return;

      const currentIdolCount = gs.advantages.filter(a => a.type === 'idol').length;
      const maxIdols = cfg.advantages.idol.count || 2;
      if (currentIdolCount >= maxIdols) return;

      const shuffled = [...tribe.members].sort(() => Math.random() - 0.5);
      for (const name of shuffled) {
        const s = pStats(name);
        // ep1: ~0.6% per player → ~3.5% tribe (6p). ep5: ~1.4% → ~8%. Idols typically ep 4–7.
        const epScale = Math.min(ep.num * 0.002, 0.02);
        const eavBoostFind = gs.playerStates[name]?.eavesdropBoostThisEp ? 0.008 + s.intuition * 0.001 : 0;
        if (Math.random() < 0.004 + epScale + s.intuition * 0.001 + s.strategic * 0.0005 + eavBoostFind) {
          gs.advantages.push({ holder: name, type: 'idol', foundEp: ep.num, foundTribe: isMergeSlot ? 'merge' : tribe.name });
          if (isMergeSlot) gs.mergeIdolHidden = Math.max(0, (gs.mergeIdolHidden || 1) - 1);
          else gs.idolSlots[tribe.name] = Math.max(0, (gs.idolSlots[tribe.name] || 1) - 1);
          ep.idolFinds.push({ finder: name, type: 'idol', tribe: isMergeSlot ? 'merge' : tribe.name });
          break;
        }
      }
    });
  }

  // ── LEGACY ADVANTAGE: guaranteed find in episodes 1-3 ──
  // Legacy needs time to breathe — confessions, scheming, heir dynamics.
  // Finding it late (ep 7+) when it activates at F5 wastes the whole mechanic.
  if (cfg.advantages?.legacy?.enabled && ep.num <= 3 && !gs.advantages.some(a => a.type === 'legacy')) {
    // Escalating chance: ep1 = 40%, ep2 = 70%, ep3 = 100% (guaranteed by ep3)
    const _legacyChance = ep.num === 1 ? 0.4 : ep.num === 2 ? 0.7 : 1.0;
    if (Math.random() < _legacyChance) {
      const _legPool = gs.activePlayers.filter(p => p !== gs.exileDuelPlayer).sort(() => Math.random() - 0.5);
      if (_legPool.length) {
        // Slight bias toward intuitive players (they search harder)
        const _legWeighted = _legPool.map(p => ({ name: p, w: 1 + pStats(p).intuition * 0.1 }));
        const _legTotal = _legWeighted.reduce((s, w) => s + w.w, 0);
        let _legRoll = Math.random() * _legTotal;
        let _legFinder = _legWeighted[0].name;
        for (const w of _legWeighted) { _legRoll -= w.w; if (_legRoll <= 0) { _legFinder = w.name; break; } }
        const _legTribe = gs.isMerged ? 'merge' : (gs.tribes.find(t => t.members.includes(_legFinder))?.name || 'camp');
        gs.advantages.push({ holder: _legFinder, type: 'legacy', foundEp: ep.num, foundTribe: _legTribe, activatesAt: seasonConfig.legacyActivatesAt || [5] });
        ep.idolFinds.push({ finder: _legFinder, type: 'legacy', tribe: _legTribe });
      }
    }
  }

  // ── NON-IDOL ADVANTAGES (found at camp via hidden notes/clues) ──
  // Each type has its own rate and game-phase requirement. Only included if 'camp' is in sources.
  const _campAdvTypes = [
    { key: 'extraVote',    postMergeOnly: false, baseChance: 0.003, epScaleCap: 0.012 },
    { key: 'voteSteal',    postMergeOnly: false, baseChance: 0.002, epScaleCap: 0.010 },
    { key: 'kip',          postMergeOnly: true,  baseChance: 0.004, epScaleCap: 0.010 },
    { key: 'secondLife',   postMergeOnly: false, baseChance: 0.001, epScaleCap: 0.005 },
    { key: 'teamSwap',     postMergeOnly: false, baseChance: 0.002, epScaleCap: 0.008 },
    { key: 'voteBlock',    postMergeOnly: false, baseChance: 0.002, epScaleCap: 0.010 },
    { key: 'safetyNoPower', postMergeOnly: false, baseChance: 0.001, epScaleCap: 0.005 },
    { key: 'soleVote',     postMergeOnly: false, baseChance: 0.001, epScaleCap: 0.005 },
  ];
  const nonIdolTypes = _campAdvTypes.filter(({ key }) => {
    const src = cfg.advantages?.[key]?.sources || ADVANTAGES.find(a => a.key === key)?.defaultSources || [];
    return src.includes('camp');
  });

  const _advFoundThisEp = new Set(); // prevent one player finding multiple advantages per episode
  nonIdolTypes.forEach(({ key, postMergeOnly, baseChance, epScaleCap }) => {
    const typeCfg = cfg.advantages?.[key];
    if (!typeCfg?.enabled) return;
    if (postMergeOnly && !gs.isMerged) return;
    const max = typeCfg.count || 1;
    if (gs.advantages.filter(a => a.type === key).length >= max) return;
    // Once-per-season: if enabled, check lifetime counter
    if (typeCfg.oncePer === 'season' && (gs.advantagesFoundThisSeason?.[key] || 0) >= max) return;
    if (typeCfg.oncePer === 'phase' && (gs.advantagesFoundThisPhase?.[key] || 0) >= max) return;

    const pool = gs.activePlayers.filter(p => p !== gs.exileDuelPlayer && !_advFoundThisEp.has(p)).sort(() => Math.random() - 0.5);
    for (const name of pool) {
      const s = pStats(name);
      const epScale = Math.min(ep.num * 0.001, epScaleCap);
      if (Math.random() < baseChance + epScale + s.intuition * 0.0008) {
        const _advTribe = gs.isMerged ? 'merge' : (gs.tribes.find(t => t.members.includes(name))?.name || 'camp');
        const _advExtra = key === 'legacy' ? { activatesAt: seasonConfig.legacyActivatesAt || [5] }
          : key === 'amulet' ? { amuletPower: (() => { const c = gs.advantages.filter(a => a.type === 'amulet').length + 1; return c >= 3 ? 'extraVote' : c === 2 ? 'voteSteal' : 'idol'; })() }
          : {};
        gs.advantages.push({ holder: name, type: key, foundEp: ep.num, foundTribe: _advTribe, ..._advExtra });
        // Track lifetime finds for once-per-season/phase caps
        if (typeCfg.oncePer) {
          const _counterKey = typeCfg.oncePer === 'phase' ? 'advantagesFoundThisPhase' : 'advantagesFoundThisSeason';
          if (!gs[_counterKey]) gs[_counterKey] = {};
          gs[_counterKey][key] = (gs[_counterKey][key] || 0) + 1;
        }
        ep.idolFinds.push({ finder: name, type: key, tribe: _advTribe });
        _advFoundThisEp.add(name);
        // ── Discovery camp event for tactical advantages ──
        if (['teamSwap', 'voteBlock', 'voteSteal', 'safetyNoPower', 'soleVote'].includes(key)) {
          const _discLabel = { teamSwap: 'Team Swap', voteBlock: 'Vote Block', voteSteal: 'Vote Steal', safetyNoPower: 'Safety Without Power', soleVote: 'Sole Vote' }[key];
          const _discPr = pronouns(name);
          const _discLines = key === 'safetyNoPower' ? [
            `${name} found a Safety Without Power hidden at camp. ${_discPr.Sub} read the note twice. Leave tribal. Stay safe. Lose your vote. That's one hell of a trade-off.`,
            `${name} discovered a Safety Without Power tucked under a rock. ${_discPr.Sub} can walk out of tribal whenever ${_discPr.sub} want${_discPr.sub === 'they' ? '' : 's'}. The question is whether ${_discPr.sub}'ll have the nerve to use it.`,
            `${name} found something at camp — a Safety Without Power. An escape hatch. No vote, no voice, but no torch snuffed either. ${_discPr.Sub} pocketed it fast.`,
          ] : key === 'soleVote' ? [
            `${name} found a Sole Vote hidden at camp. ${_discPr.Sub} read the parchment: "When played, you cast the only vote. All other votes are void." ${_discPr.Sub} didn't blink.`,
            `${name} discovered a Sole Vote wedged under a tree root. One vote. The only vote. Everyone else silenced. ${_discPr.Sub} tucked it away before anyone noticed.`,
            `${name} found something terrifying — a Sole Vote. Play it, and you decide who goes home. No discussion. No democracy. Just you.`,
          ] : key === 'teamSwap' ? [
            `${name} found something hidden at camp — a ${_discLabel}. ${_discPr.Sub} can feel the weight of it already. The power to move someone between tribes... that changes everything.`,
            `${name} was alone when ${_discPr.sub} found the ${_discLabel}. ${_discPr.Sub} turned it over in ${_discPr.posAdj} hands. This could save ${_discPr.obj} — or save someone else. Either way, the game just shifted.`,
            `${name} discovered a ${_discLabel} tucked into a tree. ${_discPr.Sub} pocketed it fast. Nobody saw. But now ${_discPr.sub} ${_discPr.sub === 'they' ? 'have' : 'has'} an escape route nobody knows about.`,
          ] : [
            `${name} found a ${_discLabel} at camp. A quiet advantage — but a useful one. The right play at the right time could change a vote.`,
            `${name} discovered a ${_discLabel} hidden near the well. ${_discPr.Sub} slipped it into ${_discPr.posAdj} bag without a word. One more tool in the arsenal.`,
            `${name} was searching near the shelter when ${_discPr.sub} found a ${_discLabel}. Not flashy, but tactical. ${_discPr.Sub} ${_discPr.sub === 'they' ? 'know' : 'knows'} exactly when to use it.`,
          ];
          const _discTribe = _advTribe;
          // Ensure campEvents structure exists (findAdvantages runs before generateCampEvents)
          if (!ep.campEvents) ep.campEvents = {};
          if (_discTribe && !ep.campEvents[_discTribe]) ep.campEvents[_discTribe] = { pre: [], post: [] };
          if (_discTribe && ep.campEvents[_discTribe]) {
            const _discBlock = ep.campEvents[_discTribe];
            (Array.isArray(_discBlock) ? _discBlock : (_discBlock.pre || [])).push({
              type: key + 'Found', players: [name],
              text: _discLines[Math.floor(Math.random() * _discLines.length)]
            });
          }
        }
        break;
      }
    }
  });

  // ── AMULET ADVANTAGE: all 3 given simultaneously in episode 1 (one per tribe) ──
  if (cfg.advantages?.amulet?.enabled && !gs.amuletPlanted && !gs.isMerged && gs.tribes.length >= 2 && ep.num <= 2) {
    gs.amuletPlanted = true;
    const _amuletHolders = [];
    gs.tribes.forEach(tribe => {
      const candidates = tribe.members.filter(n => gs.activePlayers.includes(n)).sort(() => Math.random() - 0.5);
      if (!candidates.length) return;
      // Pick the player who ran the challenge leg (simulated: random from tribe)
      const holder = candidates[0];
      const count = _amuletHolders.length + 1;
      gs.advantages.push({ holder, type: 'amulet', foundEp: ep.num, foundTribe: tribe.name,
        amuletPower: 'pending', amuletGroup: true }); // power set after all holders determined
      _amuletHolders.push(holder);
      ep.idolFinds.push({ finder: holder, type: 'amulet', tribe: tribe.name });
    });
    // All holders know about each other — mutual awareness + initial bond
    if (_amuletHolders.length >= 2) {
      gs.amuletHolders = [..._amuletHolders]; // track the original group
      for (let i = 0; i < _amuletHolders.length; i++) {
        for (let j = i + 1; j < _amuletHolders.length; j++) {
          addBond(_amuletHolders[i], _amuletHolders[j], 0.5); // shared secret bond
        }
      }
      // Update power based on actual count
      const _amulets = gs.advantages.filter(a => a.type === 'amulet');
      const _power = _amulets.length >= 3 ? 'extraVote' : _amulets.length === 2 ? 'voteSteal' : 'idol';
      _amulets.forEach(a => { a.amuletPower = _power; });
    }
  }

  // ── BEWARE ADVANTAGE (pre-merge only; one slot per tribe) ──
  if (cfg.advantages?.beware?.enabled && gs.bewares && !gs.isMerged) {
    gs.tribes.forEach(tribe => {
      const slot = gs.bewares[tribe.name];
      if (!slot || !slot.hidden) return;
      const shuffled = tribe.members.filter(n => gs.activePlayers.includes(n)).sort(() => Math.random() - 0.5);
      for (const name of shuffled) {
        const s = pStats(name);
        const epScale = Math.min(ep.num * 0.003, 0.025);
        if (Math.random() < 0.008 + epScale + s.intuition * 0.001) {
          slot.hidden = false;
          slot.holder = name;
          ep.idolFinds.push({ finder: name, type: 'beware', tribe: tribe.name });
          // Also add to lostVotes for this episode (finding it mid-ep still costs the vote)
          if (!gs.lostVotes.includes(name)) {
            gs.lostVotes.push(name);
            ep.bewareLostVotes = ep.bewareLostVotes || [];
            if (!ep.bewareLostVotes.includes(name)) ep.bewareLostVotes.push(name);
          }
          // Check for activation — if all tribes have found their beware
          const allFound = Object.values(gs.bewares).every(b => !b.hidden);
          if (allFound) {
            const activatedHolders = [];
            Object.values(gs.bewares).forEach(b => {
              if (b.holder && !b.activated && gs.activePlayers.includes(b.holder)) {
                b.activated = true;
                gs.advantages.push({ holder: b.holder, type: 'idol', foundEp: ep.num, fromBeware: true });
                activatedHolders.push(b.holder);
                // Remove from lostVotes — the restriction lifts on activation
                gs.lostVotes = gs.lostVotes.filter(p => p !== b.holder);
                if (ep.bewareLostVotes) ep.bewareLostVotes = ep.bewareLostVotes.filter(p => p !== b.holder);
              }
            });
            if (activatedHolders.length) {
              ep.idolFinds.push({ finder: '__activation__', type: 'beware-activated', tribe: 'camp', holders: activatedHolders });
            }
          }
          break;
        }
      }
    });
  }
}

export function checkIdolPreTribal(ep, tribalPlayers) {
  const holdersAtTribal = gs.advantages.filter(a => a.type === 'idol' && tribalPlayers.includes(a.holder));
  if (!holdersAtTribal.length) return;
  ep.idolShares = ep.idolShares || [];
  ep.idolFlushPlanted = ep.idolFlushPlanted || [];

  const _pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const tribeName = gs.isMerged
    ? 'merge'
    : (gs.tribes.find(t => tribalPlayers.some(p => t.members.includes(p)))?.name || 'merge');

  const pushCampEvt = (evt) => {
    if (!ep.campEvents?.[tribeName]) return;
    const block = ep.campEvents[tribeName];
    (Array.isArray(block) ? block : (block.post || [])).push(evt);
  };

  holdersAtTribal.forEach(adv => {
    const holder = adv.holder;
    const s = pStats(holder);

    // ── DECEPTION: find the most dangerous schemer on the same tribal group ──
    const schemer = tribalPlayers
      .filter(p => {
        if (p === holder) return false;
        const ps = pStats(p);
        return getBond(holder, p) >= 1.5 && ps.strategic >= 6 && ps.loyalty <= 5;
      })
      .sort((a, b) => {
        const as = pStats(a), bs = pStats(b);
        return (bs.strategic - bs.loyalty) - (as.strategic - as.loyalty);
      })[0] || null;

    if (schemer) {
      const ss = pStats(schemer);
      const bond = getBond(holder, schemer);

      // ── GIVE & BETRAY: schemer convinces holder to hand over the idol, then votes them out ──
      // Requires very high trust (bond >= 5, holder is social/trusting) and a very cold schemer
      const holderTrusting = bond >= 2 && s.social >= 4 && Math.random() < bond * 0.12; // scales: bond 3=36%, 5=60%, 8=96%
      const giveChance = Math.max(0.03, Math.min(0.18,
        (bond - 3) * 0.04 + ss.strategic * 0.008 + (10 - ss.loyalty) * 0.008 - 0.04
      ));
      if (holderTrusting && Math.random() < giveChance) {
        adv.holder = schemer;
        ep.idolGiveBetrayal = { victim: holder, schemer };
        addBond(holder, schemer, -3);
        const vP = pronouns(holder);
        pushCampEvt({ type: 'idolBetrayal', text: _pick([
          `Before tribal, ${schemer} pulled ${holder} aside and made a case: hand over the idol, play it together, cover each other. ${holder} weighed it — and trusted ${schemer}. ${vP.Sub} shouldn't have.`,
          `${holder} had the idol. ${schemer} had a plan. The conversation was short and the logic felt clean. ${holder} passed it over. ${schemer} pocketed it without a word about what came next.`,
          `"Give it to me — I'll protect you." ${holder} believed it. ${holder} handed the idol to ${schemer} on the walk to tribal.`,
        ]) });
        return; // holder no longer has the idol — skip share check
      }

      // ── FLUSH PLANT: schemer plants fear so the holder wastes the idol on a non-threat vote ──
      const holderSusceptible = getPlayerState(holder).emotional === 'paranoid' || s.intuition <= 5;
      const flushChance = Math.max(0.05, Math.min(0.32,
        (bond - 3) * 0.03 + ss.strategic * 0.012 + (10 - ss.loyalty) * 0.008
      ));
      if (holderSusceptible && Math.random() < flushChance) {
        ep.idolFlushPlanted.push({ holder, schemer });
        pushCampEvt({ type: 'idolConfession', text: _pick([
          `${schemer} sat next to ${holder} before the tribe left and quietly said a name. "I've been hearing things. You should be careful tonight." ${holder} filed it away.`,
          `${schemer} found a moment alone with ${holder}. The message was simple: your name is out there. Whether that was true or not, ${holder} believed it.`,
          `${holder} hadn't planned to use the idol. Then ${schemer} pulled ${pronouns(holder).obj} aside. The conversation lasted two minutes. ${holder} walked to tribal with a different read.`,
        ]) });
        return; // deception fired — skip share for this holder
      }
    }

    // ── IDOL SHARE: holder proactively passes idol to a close ally ──
    // Don't share if holder is likely in danger — prioritize self-play
    const _holderHeat = computeHeat(holder, tribalPlayers, gs.namedAlliances || []);
    const _holderThreat = threatScore(holder);
    const _holderInDanger = _holderHeat >= 3 || _holderThreat >= 7 || (getPlayerState(holder).emotional === 'paranoid' || getPlayerState(holder).emotional === 'desperate');
    if (_holderInDanger) return; // keep your idol — you might need it

    // Don't share to someone who already holds an idol — they'll play their own at F5
    const best = tribalPlayers
      .filter(p => p !== holder && getBond(holder, p) >= 2
        && !gs.advantages.some(a => a.type === 'idol' && a.holder === p)) // skip players who already have an idol
      .map(p => ({ name: p, bond: getBond(holder, p) }))
      .sort((a, b) => b.bond - a.bond)[0] || null;

    if (!best) return;

    const sharedAlliance = (gs.namedAlliances || []).some(al =>
      al.active && al.members.includes(holder) && al.members.includes(best.name)
    );
    const veryClose = best.bond >= 7; // F2 deal / showmance proxy
    const shareChance = Math.min(0.60,
      0.03 + (best.bond - 4) * 0.07 + s.loyalty * 0.018 + (sharedAlliance ? 0.12 : 0) + (veryClose ? 0.15 : 0)
    );
    if (Math.random() >= shareChance) return;

    // Share fires — idol moves to ally
    adv.holder = best.name;
    ep.idolShares.push({ from: holder, to: best.name, bond: best.bond, sharedAlliance, veryClose });
    addBond(holder, best.name, 1.0);
    const hP = pronouns(holder);
    pushCampEvt({ type: 'idolShare', text: _pick([
      `${holder} and ${best.name} found a moment alone before tribal. What ${holder} handed over wasn't just an idol — it was trust made physical. ${best.name} took it without hesitating.`,
      `${holder} pulled ${best.name} aside and pressed the idol into ${pronouns(best.name).posAdj} hands. "Take it. I trust you more than I trust luck tonight."`,
      `${hP.Sub} didn't say much. ${holder} just put something in ${best.name}'s palm on the walk to tribal. ${best.name} looked down and understood.`,
    ]) });
  });
}

export function checkIdolPlays(tribalPlayers, votesObj, ep, voteLog = []) {
  ep.idolPlays   = ep.idolPlays   || [];
  ep.idolMisplays = ep.idolMisplays || [];
  ep.idolRehide  = ep.idolRehide  || false;

  // ── Pre-check: if a Sole Vote holder will play it, suppress their other advantage plays ──
  // Sole Vote makes all other plays redundant — your vote is the only one that counts
  const _svPrecheckAdv = gs.advantages.find(a => a.type === 'soleVote' && tribalPlayers.includes(a.holder));
  if (_svPrecheckAdv) {
    const _svH = _svPrecheckAdv.holder;
    const _svHS = pStats(_svH);
    const _svHeat = computeHeat(_svH, tribalPlayers, []);
    const _svVotes = votesObj[_svH] || 0;
    const _svEffHeat = _svHeat + _svVotes * 0.5;
    const _svForce = ep._forceAdvantages || gs.activePlayers.length <= (seasonConfig.advExpire || 4);
    const _svChance = _svForce ? 1.0 : _svEffHeat * (0.08 + _svHS.strategic * 0.008) + _svHS.boldness * 0.005;
    if (Math.random() < _svChance) {
      // Sole vote WILL be played — flag the holder so idol/advantage checks skip them
      ep._soleVoteHolder = _svH;
    }
  }

  // ── KiP fires FIRST (before any idol plays) ──
  // KiP holder picks a target and asks "Do you have an idol?" — if they're wrong, KiP is wasted
  const kip = gs.advantages.find(a => a.type === 'kip' && tribalPlayers.includes(a.holder));
  if (kip) {
    const _kipHolder = kip.holder;
    const _kipS = pStats(_kipHolder);
    // If the KiP holder just RECEIVED an idol via sharing, they already have one — skip KiP
    const _kipJustReceivedIdol = (ep.idolShares || []).some(s => s.to === _kipHolder);
    if (_kipJustReceivedIdol) {
      // Don't use KiP — you just got an idol handed to you, no need to steal one
    } else {
    const stealableTypes = ['idol', 'extraVote', 'voteSteal'];
    const _kipRealTargets = gs.advantages.filter(a => stealableTypes.includes(a.type) && tribalPlayers.includes(a.holder) && a.holder !== _kipHolder);
    const known = gs.knownIdolHoldersThisEp || new Set();
    // Remove people who just shared their idol to this holder — you KNOW they don't have it
    const _kipSharers = new Set((ep.idolShares || []).filter(s => s.to === _kipHolder).map(s => s.from));
    const _kipVotesAgainst = Object.entries(votesObj).find(([n]) => n === _kipHolder)?.[1] || 0;
    const _kipInDanger = _kipVotesAgainst >= 2 || computeHeat(_kipHolder, tribalPlayers, ep.alliances || []) >= 3;
    const _kipHasKnowledge = _kipRealTargets.some(t => known.has(t.holder));
    // Decision to use KiP — same calculation as before
    const _kipUseChance = (_kipS.intuition * 0.4 + _kipS.strategic * 0.4 + _kipS.boldness * 0.2) / 10
      * (_kipInDanger ? 1.5 : 0.6) * (_kipHasKnowledge ? 1.4 : 0.5);
    const _kipWillUse = ep._forceAdvantages || (_kipRealTargets.length > 0 && Math.random() < Math.min(_kipUseChance, 0.95));
    // Also use if they THINK someone has an advantage (even if wrong) — bold/paranoid players guess
    const _kipGuessUse = !_kipWillUse && _kipRealTargets.length === 0 && _kipInDanger
      && Math.random() < Math.max(_kipS.boldness, _kipS.intuition) * 0.03; // proportional: stat 5=15%, stat 8=24%, stat 10=30%
    if (_kipWillUse || _kipGuessUse) {
      // Pick who to ask — score all tribal players, not just confirmed holders
      const _kipCandidates = tribalPlayers.filter(p => p !== _kipHolder && !_kipSharers.has(p)).map(p => {
        let score = 0;
        // Known holder = guaranteed correct target
        if (known.has(p)) score += 10;
        // Actual holder (even if not known) — intuitive players sense it
        const hasAdv = _kipRealTargets.some(t => t.holder === p);
        if (hasAdv) score += _kipS.intuition * 0.4; // proportional: stat 4=1.6, stat 7=2.8, stat 10=4.0
        if (hasAdv) score += 1;
        // Suspicion: players who search a lot, act secretive, or have been near idol spots
        score += pStats(p).strategic * 0.1;
        // Negative bond = more likely to target them (rivals)
        score -= getBond(_kipHolder, p) * 0.2;
        // Randomness — gut feelings
        score += Math.random() * 2;
        return { name: p, score, hasAdv };
      }).sort((a, b) => b.score - a.score);
      const _kipTarget = _kipCandidates[0];
      // Consume KiP regardless of success — it's a one-shot
      gs.advantages.splice(gs.advantages.indexOf(kip), 1);
      if (_kipTarget.hasAdv) {
        // SUCCESS — target actually has an advantage
        const victim = _kipRealTargets.find(t => t.holder === _kipTarget.name);
        const originalHolder = victim.holder;
        const _kipWasAlly = getBond(_kipHolder, originalHolder) >= 2;
        victim.holder = _kipHolder;
        ep.idolPlays.push({ player: _kipHolder, type: 'kip', stolenFrom: originalHolder, stolenType: victim.type });
        ep.kipSteal = { holder: _kipHolder, victim: originalHolder, stolenType: victim.type, wasAlly: _kipWasAlly, success: true };
        addBond(originalHolder, _kipHolder, _kipWasAlly ? -4.0 : -2.5);
        tribalPlayers.filter(p => p !== _kipHolder && p !== originalHolder).forEach(p => {
          if (getBond(p, originalHolder) >= 1) addBond(p, _kipHolder, -0.5);
        });
        gs.kipStealLastEp = { holder: _kipHolder, victim: originalHolder, stolenType: victim.type, wasAlly: _kipWasAlly, success: true };
      } else {
        // FAIL — target has nothing, KiP wasted
        const _kipFailVictim = _kipTarget.name;
        ep.idolPlays.push({ player: _kipHolder, type: 'kip', stolenFrom: _kipFailVictim, stolenType: null, failed: true });
        ep.kipSteal = { holder: _kipHolder, victim: _kipFailVictim, stolenType: null, wasAlly: false, success: false };
        // Embarrassment: holder looks foolish, target gets sympathy
        addBond(_kipFailVictim, _kipHolder, -1.0);
        gs.kipStealLastEp = { holder: _kipHolder, victim: _kipFailVictim, stolenType: null, wasAlly: false, success: false };
      }
    } else if (ep._forceAdvantages && !_kipRealTargets.length) {
      // F5 force-play with nobody holding anything — consume it
      gs.advantages.splice(gs.advantages.indexOf(kip), 1);
    }
    } // end: !_kipJustReceivedIdol
  }

  // ── LEGACY ADVANTAGE: auto-activates when player count matches activatesAt ──
  const _legacyAdvs = gs.advantages.filter(a => a.type === 'legacy' && tribalPlayers.includes(a.holder));
  _legacyAdvs.forEach(adv => {
    if (!adv.activatesAt?.includes(gs.activePlayers.length)) return;
    // Legacy fires — grants immunity like an idol
    const holder = adv.holder;
    const voteCount = votesObj[holder] || 0;
    gs.advantages.splice(gs.advantages.indexOf(adv), 1);
    if (voteCount > 0) delete votesObj[holder];
    ep.idolPlays.push({ player: holder, type: 'legacy', votesNegated: voteCount });
    ep.legacyActivated = holder;
  });

  if (!seasonConfig.advantages?.idol?.enabled) return;

  const _idolPlayedThisTribal = new Set(); // track who already played an idol — one per tribal
  const sorted = Object.entries(votesObj).sort(([,a],[,b]) => b - a);
  for (const [name, voteCount] of sorted) {
    if (_idolPlayedThisTribal.has(name)) continue; // already played an idol this tribal
    // Skip if already protected by someone else's idol play (don't waste your own)
    if (ep.idolPlays.some(p => p.playedFor === name && (p.votesNegated || 0) > 0)) continue;
    // Skip if this player will play Sole Vote — makes idol redundant
    if (ep._soleVoteHolder === name) continue;
    const idolIdx = gs.advantages.findIndex(a => a.holder === name && !a.superIdol && (a.type === 'idol' || (a.type === 'amulet' && a.amuletPower === 'idol')));
    if (idolIdx === -1) continue;
    const _idolAdv = gs.advantages[idolIdx];

    // ── FAKE IDOL CHECK — played at tribal, revealed as fake ──
    if (_idolAdv.fake) {
      const s = pStats(name);
      const _fPr = pronouns(name);
      const _fPlanter = _idolAdv.plantedBy;
      // Remove the fake idol
      gs.advantages.splice(idolIdx, 1);
      // Votes are NOT negated — they count
      ep.idolPlays.push({ player: name, type: 'fake-idol', votesNegated: 0, fake: true, plantedBy: _fPlanter,
        misplay: true, misplayReason: 'Fake idol — planted by ' + (_fPlanter || 'unknown') });
      // Bond consequences
      if (_fPlanter && gs.activePlayers.includes(_fPlanter)) {
        addBond(name, _fPlanter, -3.0); // deep betrayal
        // Tribe sees the deception — planter's reputation tanks
        tribalPlayers.filter(p => p !== _fPlanter && p !== name).forEach(p => addBond(p, _fPlanter, -0.5));
      }
      // Store for VP
      if (!ep.fakeIdolEvents) ep.fakeIdolEvents = [];
      ep.fakeIdolEvents.push({ arc: 'played-at-tribal', victim: name, planter: _fPlanter, votesAgainst: voteCount });
      continue; // skip the real idol play logic
    }

    const s = pStats(name);
    const totalVoters = tribalPlayers.length;
    const isInDanger = voteCount >= 3 || (voteCount / totalVoters >= 0.33);
    if (!isInDanger) continue;

    // If a betrayal fired this episode the confidant sold the secret — no tip-off can come
    // from them, and the holder feels falsely secure (penalty to play chance)
    const wasBetrayed = ep.idolBetrayals?.some(b => b.holder === name);

    // ── Tip-off: close ally with high intuition who is NOT voting against the holder ──
    const tipOffCandidates = wasBetrayed ? [] : tribalPlayers.filter(p => {
      if (p === name) return false;
      if (getBond(name, p) < 1.5) return false;            // needs at least a meaningful bond
      if (Math.random() > pStats(p).intuition * 0.08) return false; // proportional: stat 4=32%, stat 7=56%, stat 10=80%
      const theirVote = voteLog.find(l => l.voter === p)?.voted;
      return theirVote !== name;                            // not voting against the holder
    });
    const tipOffAlly = tipOffCandidates.sort((a,b) => getBond(name, b) - getBond(name, a))[0] || null;
    // Tip-off bonus scales with bond intensity — stronger allies give better intel
    const tipOffBonus = tipOffCandidates.length
      ? Math.min(0.50, tipOffCandidates.reduce((s, p) => s + Math.min(0.25, getBond(name, p) * pStats(p).intuition * 0.005), 0))
      : 0;

    // boldness + strategic drives willingness; intuition + emotional state raises readiness
    const iState = getPlayerState(name);
    const intuitionBonus = (iState.emotional === 'paranoid' || iState.emotional === 'desperate' || iState.emotional === 'uneasy')
      ? s.intuition * 0.04 : 0;
    // Comfort blindspot: checked-out player doesn't feel the danger — less likely to play
    const comfortPenalty = (iState.emotional === 'comfortable' && s.boldness < 6 && s.strategic < 6) ? -0.15 : 0;

    // Betrayal penalty: holder trusts their confidant, doesn't feel in danger → less likely to play
    const betrayalPenalty = wasBetrayed ? -0.20 : 0;
    // Flush plant bonus: schemer planted fear → holder is more likely to panic and play
    const flushBonus = ep.idolFlushPlanted?.some(f => f.holder === name) ? 0.25 : 0;
    // Eavesdrop bonus: player overheard something suspicious this episode — acts on instinct
    const eavesdropBonus = gs.playerStates[name]?.eavesdropBoostThisEp ? 0.12 + s.intuition * 0.015 : 0;
    const didPlay = Math.random() < 0.25 + s.boldness * 0.05 + s.strategic * 0.025 + intuitionBonus + tipOffBonus + betrayalPenalty + flushBonus + eavesdropBonus + comfortPenalty;
    const _pickLocal = arr => arr[Math.floor(Math.random() * arr.length)];
    const tribeName = gs.tribes?.find(t => t.members.includes(name))?.name || 'merge';

    if (tipOffAlly) {
      // Is the tip-off ally crossing alliance lines? (in a named alliance that doesn't include holder)
      const tipperAlliance = (gs.namedAlliances||[]).find(a => a.active && a.members.includes(tipOffAlly) && !a.members.includes(name));
      const isRivalTipOff = !!tipperAlliance;

      ep.tipOffCampEvents = ep.tipOffCampEvents || {};
      // The tip-off recipient gained privileged info — mark for intuition boost
      if (!gs.playerStates[name]) gs.playerStates[name] = {};
      gs.playerStates[name].eavesdropBoostThisEp = true;
      if (didPlay) {
        ep.tipOffCampEvents[tribeName] = { type: 'eavesdrop', isRivalTipOff,
          text: _pickLocal([
            `Before the tribe left for tribal, ${tipOffAlly} pulled ${name} aside. A few words — quiet enough that nobody else caught it. ${name} went to tribal with a different kind of attention.`,
            `${tipOffAlly} didn't say much. Just enough. ${name} heard it and understood.`,
            `Something passed between ${tipOffAlly} and ${name} on the walk to tribal. A look, a word, a signal. ${name} walked in with their hand already moving toward their pocket.`,
          ]),
        };
        // Rival crossing: store for betrayal processing after the vote resolves
        if (isRivalTipOff) {
          ep.tipOffBetrayalRisk = {
            tipper: tipOffAlly,
            saved: name,
            allianceName: tipperAlliance.name,
            allianceMembers: tipperAlliance.members.filter(m => m !== tipOffAlly && gs.activePlayers.includes(m)),
          };
        }
      } else {
        // Tip-off ally was there but the warning either didn't happen or wasn't enough
        ep.tipOffCampEvents[tribeName] = { type: 'doubt',
          text: _pickLocal([
            `${tipOffAlly} noticed something in the energy before tribal. They glanced at ${name}. The conversation that should have happened didn't.`,
            `${tipOffAlly} had a read on the vote. They didn't say it out loud. ${name} walked to tribal not knowing what was coming.`,
            `There was a moment, right before they left for tribal, where ${tipOffAlly} could have said something to ${name}. The moment passed.`,
          ]),
        };
      }
    }

    if (didPlay) {
      gs.advantages.splice(idolIdx, 1);
      delete votesObj[name];
      _idolPlayedThisTribal.add(name);
      ep.idolPlays.push({ player: name, votesNegated: voteCount, tippedOff: !!tipOffAlly });
      ep.idolRehide = true;
    } else {
      // Sat on the idol — record for WHY section analysis
      ep.idolMisplays.push({
        player: name,
        votesAgainst: voteCount,
        tipOffAlly,
        holderVotedFor: voteLog.find(l => l.voter === name)?.voted || null,
      });
    }
  }

  // ── Idol Misplay: player wastes idol when they're NOT actually the target ──
  // Multiple triggers — each represents a different way a player misreads the situation
  const _unusedIdolHolders = gs.advantages.filter(a =>
    a.type === 'idol' && !a.superIdol && tribalPlayers.includes(a.holder) &&
    !_idolPlayedThisTribal.has(a.holder) &&
    !ep.idolPlays.some(p => p.player === a.holder) &&
    !ep.idolMisplays?.some(m => m.player === a.holder)
  );
  for (const _adv of _unusedIdolHolders) {
    const _ph = _adv.holder;
    const _ps = pStats(_ph);
    const _pState = getPlayerState(_ph);
    const _votesAgainst = votesObj[_ph] || 0;
    if (_votesAgainst >= 2) continue; // actually in danger — handled by self-play above

    let _misplayChance = 0;
    let _misplayReason = '';

    // 1. Fed bad info: someone planted a flush — most reliable trigger
    if (ep.idolFlushPlanted?.some(f => f.holder === _ph)) {
      _misplayChance += 0.18 + _ps.boldness * 0.01;
      _misplayReason = 'fed bad info — someone planted fear and it worked';
    }

    // 2. Bottom dweller: been on the outside for multiple tribals, assumes every vote is theirs
    const _onBottom = (_pState.consecutiveVotesReceived || 0) >= 2 || _pState.emotional === 'desperate';
    if (_onBottom) {
      _misplayChance += 0.06 + (7 - _ps.intuition) * 0.01;
      if (!_misplayReason) _misplayReason = 'been on the bottom too long — assumed the worst';
    }

    // 3. Paranoid spiral: emotional state clouds judgment, can't read body language
    if (_pState.emotional === 'paranoid' && _ps.temperament <= 5) {
      _misplayChance += 0.05 + (7 - _ps.intuition) * 0.015;
      if (!_misplayReason) _misplayReason = 'paranoid spiral — read danger in every sideways glance at tribal';
    }

    // 4. Overconfident read: strategic player THINKS they've cracked the plan, but the alliance lied
    if (_ps.strategic >= 7 && _ps.intuition <= 5 && _pState.emotional !== 'comfortable') {
      const _wasLiedTo = (ep.alliances || []).some(a => a.members.includes(_ph) && a.target !== _ph);
      if (_wasLiedTo) {
        _misplayChance += 0.04;
        if (!_misplayReason) _misplayReason = 'thought they had the read — the alliance fed them a decoy plan';
      }
    }

    // 5. Last-second vote shift: they WERE the original target but a scramble redirected votes
    //    They don't know the plan changed. Most dramatic misplay.
    const _wasOriginalTarget = (ep.defections || []).some(d => d.originalTarget === _ph);
    if (_wasOriginalTarget) {
      _misplayChance += 0.10 + (7 - _ps.intuition) * 0.01;
      if (!_misplayReason) _misplayReason = 'the plan shifted at the last second — they didn\'t know';
    }

    if (_misplayChance > 0 && Math.random() < Math.min(0.30, _misplayChance)) {
      const idolIdx = gs.advantages.indexOf(_adv);
      gs.advantages.splice(idolIdx, 1);
      delete votesObj[_ph];
      _idolPlayedThisTribal.add(_ph);
      ep.idolPlays.push({ player: _ph, votesNegated: _votesAgainst, misplay: true, misplayReason: _misplayReason });
      ep.idolRehide = true;
    }
  }

  // ── Idol for Ally ──
  // Holder is NOT in danger themselves — might burn their idol to protect a close ally
  const _allyPlayHolders = gs.advantages.filter(a =>
    a.type === 'idol' && !a.superIdol && tribalPlayers.includes(a.holder) &&
    !_idolPlayedThisTribal.has(a.holder) &&
    !ep.idolPlays.some(p => p.player === a.holder)
  );
  for (const _adv of _allyPlayHolders) {
    const _holder = _adv.holder;
    const _hVotes = votesObj[_holder] || 0;
    const _hInDanger = _hVotes >= 3 || (_hVotes / tribalPlayers.length >= 0.33);
    // Tied Destinies: check if TD partner is in danger (saving them = saving yourself)
    const _tdPartner = (gs._tiedDestiniesActive || []).find(p => p.a === _holder || p.b === _holder);
    const _tdAllyName = _tdPartner ? (_tdPartner.a === _holder ? _tdPartner.b : _tdPartner.a) : null;
    const _tdAllyVotes = _tdAllyName ? (votesObj[_tdAllyName] || 0) : 0;
    const _tdInDanger = _tdAllyName && (_tdAllyVotes >= 3 || _tdAllyVotes / tribalPlayers.length >= 0.33);
    if (_hInDanger && !_tdInDanger) continue; // in danger themselves — self-play didn't fire, skip ally play (unless TD partner needs saving)

    const _hs = pStats(_holder);

    // Find allies in danger, sorted by bond (closest first) — TD partner jumps to front
    // EXCLUDE anyone the holder voted for — you don't save someone you're trying to eliminate
    const _holderVotedFor = (voteLog || []).find(v => v.voter === _holder)?.voted;
    const _alliesInDanger = Object.entries(votesObj)
      .filter(([n, vc]) => n !== _holder && n !== _holderVotedFor && (vc >= 3 || vc / tribalPlayers.length >= 0.33))
      .sort(([a], [b]) => {
        // TD partner always first — their death = your death
        if (a === _tdAllyName) return -1;
        if (b === _tdAllyName) return 1;
        return getBond(_holder, b) - getBond(_holder, a);
      });
    if (!_alliesInDanger.length) continue;

    const [_allyName, _allyVotes] = _alliesInDanger[0];
    const _bond = getBond(_holder, _allyName);
    const _sharedAlliance = (gs.namedAlliances || []).find(a =>
      a.active && a.members.includes(_holder) && a.members.includes(_allyName)
    );

    // Tied Destinies partner in danger: near-guaranteed idol play (self-preservation)
    if (_allyName === _tdAllyName && _tdInDanger) {
      const _advIdx = gs.advantages.indexOf(_adv);
      gs.advantages.splice(_advIdx, 1);
      delete votesObj[_allyName];
      _idolPlayedThisTribal.add(_holder);
      ep.idolPlays.push({ player: _holder, playedFor: _allyName, votesNegated: _allyVotes, allianceName: _sharedAlliance?.name || null, tdProtection: true });
      addBond(_holder, _allyName, 3.0);
      addBond(_allyName, _holder, 3.0);
      ep.idolRehide = true;
      continue;
    }

    // Tiered base chance: alliance+high bond / alliance+low bond / no alliance but deep bond
    // Scales with bond intensity: higher bond = more likely to confide
    let _baseChance = 0;
    if (_bond < 1) continue;
    if (_sharedAlliance) _baseChance = Math.min(0.25, _bond * 0.04);  // alliance: bond 2=8%, 5=20%, 8+=25%
    else                 _baseChance = Math.min(0.15, _bond * 0.025); // no alliance: bond 2=5%, 5=12.5%, 6+=15%

    // Archetype modifiers
    const _hArch = players.find(p => p.name === _holder)?.archetype || '';
    const _archMod = _hArch === 'hero'              ?  0.15  // heroes sacrifice for allies — doubled chance
                   : _hArch === 'loyal-soldier'    ?  0.07
                   : _hArch === 'social-butterfly'  ?  0.04
                   : (_hArch === 'wildcard' || _hArch === 'chaos-agent') ? 0.03
                   : _hArch === 'villain'           ? -0.08  // villains don't waste power on others
                   : _hArch === 'mastermind'        ? -0.05 : 0;

    const _doAllyPlay = Math.random() < _baseChance + _hs.boldness * 0.03 + _hs.loyalty * 0.03 + _archMod;
    if (_doAllyPlay) {
      const _advIdx = gs.advantages.indexOf(_adv);
      gs.advantages.splice(_advIdx, 1);
      delete votesObj[_allyName];
      _idolPlayedThisTribal.add(_holder);
      ep.idolPlays.push({ player: _holder, playedFor: _allyName, votesNegated: _allyVotes, allianceName: _sharedAlliance?.name || null });
      // Massive bond boost — playing an idol for someone is the biggest trust move in the game
      addBond(_holder, _allyName, 3.0);
      addBond(_allyName, _holder, 3.0);
      ep.idolRehide = true;
    }
  }

  // (KiP logic moved to top of function — fires before idol plays)
}

export function checkNonIdolAdvantageUse(tribalPlayers, votesObj, ep, voteLog = []) {
  ep.idolPlays = ep.idolPlays || [];
  // If sole vote will be played, skip extra vote / vote steal for the sole vote holder
  // (sole vote makes them redundant — your vote is the only one)
  const _svSkip = ep._soleVoteHolder || null;

  // ── Extra Vote ──
  const _evAdvs = gs.advantages.filter(a => a.type === 'extraVote' && tribalPlayers.includes(a.holder));
  for (const _adv of _evAdvs) {
    const _holder = _adv.holder;
    if (_holder === _svSkip) continue; // sole vote makes extra vote redundant
    if (gs.lostVotes.includes(_holder)) continue; // already lost their vote this episode
    const _s = pStats(_holder);
    const _state = getPlayerState(_holder);
    const _holderTarget = voteLog.find(l => l.voter === _holder)?.voted;

    // ── Ally-save path: redirect extra vote to protect a close ally in danger ──
    let _evTarget = _holderTarget;
    let _forAlly = null;
    const _allyInDanger = tribalPlayers
      .filter(p => p !== _holder && getBond(_holder, p) >= 1.5
        && !ep.idolPlays?.some(ip => ip.player === p || ip.playedFor === p))
      .sort((a, b) => (votesObj[b] || 0) - (votesObj[a] || 0))[0];
    if (_allyInDanger && (votesObj[_allyInDanger] || 0) >= 2) {
      // Find best pile-on target to help ally survive (most votes, not self, not ally, not idol-immune)
      const _bestAttacker = Object.entries(votesObj)
        .filter(([p]) => p !== _holder && p !== _allyInDanger && tribalPlayers.includes(p)
          && !ep.idolPlays?.some(ip => ip.player === p || ip.playedFor === p))
        .sort(([,a],[,b]) => b - a)[0]?.[0];
      if (_bestAttacker) { _evTarget = _bestAttacker; _forAlly = _allyInDanger; }
    }

    if (!_evTarget || !tribalPlayers.includes(_evTarget)) continue;
    // Don't pile onto an idol-protected player
    if (ep.idolPlays?.some(p => p.player === _evTarget || p.playedFor === _evTarget)) continue;

    const _targetVotes = votesObj[_evTarget] || 0;
    const _allVoteCounts = Object.values(votesObj);
    const _maxVotes = _allVoteCounts.length ? Math.max(..._allVoteCounts) : 0;
    const _isCloseRace = _targetVotes > 0 && _targetVotes >= _maxVotes - 1;
    const _isNervous = ['paranoid', 'desperate'].includes(_state.emotional);
    // Proportional: boldness scales advantage play aggressiveness
    const _evHeat = computeHeat(_holder, tribalPlayers, []);
    let _chance = _evHeat * (0.03 + _s.strategic * 0.003) + _s.boldness * 0.015 + (_isCloseRace ? 0.25 : 0) + (_isNervous ? 0.12 : 0);
    if (_forAlly) {
      // Selfish/scheming players won't burn an advantage for someone else.
      // Scale the ally-save bonus by loyalty; schemer archetype gets an extra penalty.
      const _arch = players.find(p => p.name === _holder)?.archetype || '';
      const _loy  = _s.loyalty;
      const _allyBias = (_loy - 5) * 0.06; // proportional: loyalty 3=-0.12, loyalty 5=0, loyalty 7=+0.12, loyalty 10=+0.30
      const _schemerPenalty = (_arch === 'schemer') ? -0.15 : 0;
      _chance += _allyBias + _schemerPenalty;
    }

    if (ep._forceAdvantages || Math.random() < _chance) {
      votesObj[_evTarget] = _targetVotes + 1;
      gs.advantages.splice(gs.advantages.indexOf(_adv), 1);
      ep.idolPlays.push({ player: _holder, type: 'extraVote', target: _evTarget, forAlly: _forAlly || null, forced: !!ep._forceAdvantages });
    }
  }

  // ── Vote Steal ──
  const _vsAdvs = gs.advantages.filter(a => a.type === 'voteSteal' && tribalPlayers.includes(a.holder));
  for (const _adv of _vsAdvs) {
    const _holder = _adv.holder;
    if (_holder === _svSkip) continue; // sole vote makes vote steal redundant
    const _s = pStats(_holder);
    const _state = getPlayerState(_holder);

    const _stealPool = tribalPlayers.filter(p => p !== _holder && !gs.lostVotes.includes(p));
    if (!_stealPool.length) continue;

    // Prioritise stealing from someone voting against holder, otherwise biggest threat
    const _stealTarget = _stealPool
      .map(p => ({
        name: p,
        score: threatScore(p) * 0.4
             + (voteLog.find(l => l.voter === p)?.voted === _holder ? 3 : 0)
             + Math.random() * 1.5,
      }))
      .sort((a, b) => b.score - a.score)[0]?.name;
    if (!_stealTarget) continue;

    const _vsHeat = computeHeat(_holder, tribalPlayers, []);
    const _chance = _vsHeat * (0.05 + _s.strategic * 0.005) + _s.boldness * 0.015 + (_state.emotional === 'paranoid' ? 0.15 : 0);

    if (ep._forceAdvantages || Math.random() < _chance) {
      const _stolenEntry = voteLog.find(l => l.voter === _stealTarget);
      const _stolenVotedFor = _stolenEntry?.voted;
      // Remove stolen vote from tally
      if (_stolenVotedFor && (votesObj[_stolenVotedFor] || 0) > 0)
        votesObj[_stolenVotedFor] = votesObj[_stolenVotedFor] - 1;
      // Mark the stolen voter's log entry so VP can display it as stolen
      if (_stolenEntry) _stolenEntry.voteStolen = true;
      // Holder casts the stolen vote at their own target
      const _holderTarget = voteLog.find(l => l.voter === _holder)?.voted;
      if (_holderTarget) votesObj[_holderTarget] = (votesObj[_holderTarget] || 0) + 1;

      gs.advantages.splice(gs.advantages.indexOf(_adv), 1);
      gs.knownVoteStealHolders?.delete(_holder);
      ep.idolPlays.push({ player: _holder, type: 'voteSteal', stolenFrom: _stealTarget, target: _holderTarget, forced: !!ep._forceAdvantages });
    }
  }

  // ── Amulet (power-scaled) — requires COORDINATED PLAY from all holders at this tribal ──
  // When amuletPower is 'idol' (1 holder left), it's handled in checkIdolPlays as a regular idol — no coordination needed
  // With 2-3 holders: ALL holders present at this tribal must agree to play. Bond-driven negotiation.
  const _amuAdvs = gs.advantages.filter(a => a.type === 'amulet' && a.amuletPower && a.amuletPower !== 'idol');
  const _amuHoldersAtTribal = _amuAdvs.filter(a => tribalPlayers.includes(a.holder)).map(a => a.holder);
  if (_amuHoldersAtTribal.length >= 2) {
    // All holders must be at this tribal AND agree to play
    const allHoldersPresent = _amuAdvs.every(a => tribalPlayers.includes(a.holder));
    if (allHoldersPresent) {
      // Each holder votes on whether to play: based on danger, bonds with other holders, strategic position
      const _amuVotes = _amuHoldersAtTribal.map(h => {
        const _s = pStats(h);
        const _hVotes = votesObj[h] || 0;
        const _inDanger = _hVotes >= 2 || computeHeat(h, tribalPlayers, ep.alliances || []) >= 3;
        const _avgHolderBond = _amuHoldersAtTribal.filter(o => o !== h).reduce((s, o) => s + getBond(h, o), 0) / Math.max(1, _amuHoldersAtTribal.length - 1);
        // Want to play if: in danger, bonds are positive (trust), strategic sees value
        const _wantPlay = ep._forceAdvantages ? true : Math.random() < Math.min(0.85,
          0.05 + (_inDanger ? 0.40 : 0) + _avgHolderBond * 0.05 + _s.strategic * 0.03 + _s.boldness * 0.02
        );
        return { holder: h, wantsToPlay: _wantPlay, inDanger: _inDanger };
      });
      const _allAgree = _amuVotes.every(v => v.wantsToPlay);
      ep.amuletCoordination = { holders: _amuHoldersAtTribal, votes: _amuVotes, agreed: _allAgree, power: _amuAdvs[0].amuletPower };
      if (_allAgree) {
        // Coordinated play — the initiator is the most in-danger holder
        const _initiator = _amuVotes.sort((a, b) => (b.inDanger ? 1 : 0) - (a.inDanger ? 1 : 0))[0].holder;
        if (_amuAdvs[0].amuletPower === 'extraVote') {
          const _target = voteLog.find(l => l.voter === _initiator)?.voted;
          if (_target && tribalPlayers.includes(_target)) {
            votesObj[_target] = (votesObj[_target] || 0) + 1;
            _amuAdvs.forEach(a => gs.advantages.splice(gs.advantages.indexOf(a), 1));
            ep.idolPlays.push({ player: _initiator, type: 'extraVote', fromAmulet: true, amuletHolders: [..._amuHoldersAtTribal], forced: !!ep._forceAdvantages });
          }
        } else if (_amuAdvs[0].amuletPower === 'voteSteal') {
          const _stealPool = tribalPlayers.filter(p => !_amuHoldersAtTribal.includes(p) && !gs.lostVotes.includes(p));
          if (_stealPool.length) {
            const _stealTarget = _stealPool.sort((a, b) => getBond(_initiator, a) - getBond(_initiator, b))[0];
            const _stolenEntry = voteLog.find(l => l.voter === _stealTarget);
            if (_stolenEntry) {
              const _stolenVotedFor = _stolenEntry.voted;
              if (_stolenVotedFor && (votesObj[_stolenVotedFor] || 0) > 0)
                votesObj[_stolenVotedFor] = votesObj[_stolenVotedFor] - 1;
              _stolenEntry.voteStolen = true;
              const _target = voteLog.find(l => l.voter === _initiator)?.voted;
              if (_target) votesObj[_target] = (votesObj[_target] || 0) + 1;
              _amuAdvs.forEach(a => gs.advantages.splice(gs.advantages.indexOf(a), 1));
              ep.idolPlays.push({ player: _initiator, type: 'voteSteal', stolenFrom: _stealTarget, target: _target, fromAmulet: true, amuletHolders: [..._amuHoldersAtTribal], forced: !!ep._forceAdvantages });
            }
          }
        }
      }
      // If they didn't agree, the amulet stays — disagreement recorded for camp events
    }
  } else if (_amuHoldersAtTribal.length === 1 && _amuAdvs.length >= 2) {
    // Only 1 holder at this tribal but 2+ holders exist — can't play without the others
    // (pre-merge: holders on different tribes. The amulet is useless until they're together)
  }

  // ── Vote Block: holder blocks one player's vote this tribal ──
  const _vbAdvs = gs.advantages.filter(a => a.type === 'voteBlock' && tribalPlayers.includes(a.holder));
  for (const _vbAdv of _vbAdvs) {
    const _vbHolder = _vbAdv.holder;
    const _vbS = pStats(_vbHolder);
    const _vbState = getPlayerState(_vbHolder);
    // Play when in danger or strategically useful — proportional to strategic + boldness
    const _vbHeat = computeHeat(_vbHolder, tribalPlayers, []);
    const _vbActualVotes = votesObj[_vbHolder] || 0;
    const _vbEffectiveHeat = _vbHeat + _vbActualVotes * 0.5;
    const _vbForcePlay = ep._forceAdvantages || gs.activePlayers.length <= (seasonConfig.advExpire || 4);
    const _vbPlayChance = _vbForcePlay ? 1.0 : _vbEffectiveHeat * (0.05 + _vbS.strategic * 0.005) + _vbS.boldness * 0.03;
    if (Math.random() >= _vbPlayChance) continue;

    // Target: the biggest threat who is likely to vote against the holder
    const _vbCandidates = tribalPlayers.filter(p => p !== _vbHolder && !gs.lostVotes.includes(p));
    const _vbTarget = _vbCandidates.sort((a, b) => {
      const bondA = getBond(_vbHolder, a), bondB = getBond(_vbHolder, b);
      const threatA = threatScore(a), threatB = threatScore(b);
      // Block the biggest enemy who's likely to vote against us
      return (bondA - threatA * 0.3) - (bondB - threatB * 0.3);
    })[0];
    if (!_vbTarget) continue;

    // Block the vote
    gs.advantages.splice(gs.advantages.indexOf(_vbAdv), 1);
    gs.knownVoteBlockHolders?.delete(_vbHolder);
    gs.lostVotes.push(_vbTarget);
    // Remove their vote from the tally if already cast
    const _vbEntry = voteLog.find(l => l.voter === _vbTarget);
    if (_vbEntry) {
      const _vbVoted = _vbEntry.voted;
      if (_vbVoted && votesObj[_vbVoted]) votesObj[_vbVoted]--;
      _vbEntry.voteBlocked = true;
    }
    ep.idolPlays.push({ player: _vbHolder, type: 'voteBlock', blockedPlayer: _vbTarget, forced: _vbForcePlay });
    // Bond consequences
    addBond(_vbTarget, _vbHolder, -1.0); // getting silenced is personal
    // Check if this protected an ally (blocked someone voting against holder's ally)
    const _vbBlockedVote = voteLog.find(l => l.voter === _vbTarget);
    if (_vbBlockedVote?.voted) {
      const _vbProtected = _vbBlockedVote.voted;
      if (_vbProtected !== _vbHolder && getBond(_vbHolder, _vbProtected) >= 2) {
        addBond(_vbHolder, _vbProtected, 0.5); // mild gratitude for protection
      }
    }
  }

  // ── Sole Vote: holder casts the ONLY vote — all others silenced ──
  const _svAdvs = gs.advantages.filter(a => a.type === 'soleVote' && tribalPlayers.includes(a.holder));
  for (const _svAdv of _svAdvs) {
    const _svHolder = _svAdv.holder;
    const _svS = pStats(_svHolder);
    const _svHeat = computeHeat(_svHolder, tribalPlayers, []);
    const _svActualVotes = votesObj[_svHolder] || 0;
    const _svEffectiveHeat = _svHeat + _svActualVotes * 0.5;
    const _svForcePlay = ep._forceAdvantages || gs.activePlayers.length <= (seasonConfig.advExpire || 4);
    const _svPreChecked = ep._soleVoteHolder === _svHolder; // already decided in checkIdolPlays pre-check
    const _svPlayChance = _svPreChecked ? 1.0 : (_svForcePlay ? 1.0 : _svEffectiveHeat * (0.08 + _svS.strategic * 0.008) + _svS.boldness * 0.005);
    if (Math.random() >= _svPlayChance) continue;

    // Silence every other player's vote
    const _svSilenced = tribalPlayers.filter(p => p !== _svHolder && !gs.lostVotes.includes(p));
    _svSilenced.forEach(p => {
      gs.lostVotes.push(p);
      // Remove their vote from tally if already cast
      const _svEntry = voteLog.find(l => l.voter === p);
      if (_svEntry) {
        const _svVoted = _svEntry.voted;
        if (_svVoted && votesObj[_svVoted]) votesObj[_svVoted]--;
        _svEntry.voteBlocked = true;
      }
    });
    // Also remove Black Vote / penalty votes — Sole Vote means THE ONLY vote
    voteLog.filter(l => l.isBlackVote && l.voter !== _svHolder).forEach(bvEntry => {
      if (bvEntry.voted && votesObj[bvEntry.voted]) votesObj[bvEntry.voted]--;
      bvEntry.voteBlocked = true;
    });

    // Consume advantage
    gs.advantages.splice(gs.advantages.indexOf(_svAdv), 1);
    gs.knownSoleVoteHolders?.delete(_svHolder);

    // Check if holder had confessed to someone (warned ally for aftermath)
    const _svConfidants = gs.knownSoleVoteHolders?.size
      ? [...(gs.knownSoleVoteHolders || [])].filter(p => p !== _svHolder && gs.activePlayers.includes(p) && getBond(_svHolder, p) >= 2)
      : [];
    const _svWarnedAlly = _svConfidants[0] || null;

    // Record play
    ep.idolPlays.push({ player: _svHolder, type: 'soleVote', silencedPlayers: _svSilenced, forced: _svForcePlay });
    ep.soleVotePlayed = { holder: _svHolder, warnedAlly: _svWarnedAlly };
    gs.soleVotePlayed = { holder: _svHolder, warnedAlly: _svWarnedAlly };

    // Bond consequences — everyone whose vote was silenced
    _svSilenced.forEach(p => {
      const _svBond = getBond(p, _svHolder);
      addBond(p, _svHolder, -(0.5 + _svBond * 0.05));
    });

    // Popularity
    if (seasonConfig.popularityEnabled && gs.popularity) {
      gs.popularity[_svHolder] = (gs.popularity[_svHolder] || 0) - 0.3;
    }

    // Heat next episode
    gs.soleVoteHeat = { player: _svHolder, ep: (gs.episode || 0) + 1 };

    // bigMoves
    const _svBmState = getPlayerState(_svHolder);
    _svBmState.bigMoves = (_svBmState.bigMoves || 0) + 1;
    if (!gs.bigMoveEarnersThisEp) gs.bigMoveEarnersThisEp = [];
    if (!gs.bigMoveEarnersThisEp.includes(_svHolder)) gs.bigMoveEarnersThisEp.push(_svHolder);
    break; // one per tribal
  }

  // ── Team Swap: holder plays it at tribal → triggers elimination-swap post-vote ──
  // The actual tribe swap happens AFTER resolveVotes, using the same path as the elimination-swap twist.
  // Here we just decide whether to play it and flag it.
  if (!gs.isMerged && gs.tribes.length >= 2) {
    const _tsAdvs = gs.advantages.filter(a => a.type === 'teamSwap' && tribalPlayers.includes(a.holder));
    for (const _tsAdv of _tsAdvs) {
      const _tsHolder = _tsAdv.holder;
      const _tsS = pStats(_tsHolder);
      const _tsHeat = computeHeat(_tsHolder, tribalPlayers, []);
      const _tsActualVotes = votesObj[_tsHolder] || 0;
      const _tsEffectiveHeat = _tsHeat + _tsActualVotes * 1.5;
      const _tsForcePlay = ep._forceAdvantages;
      const _tsPlayChance = _tsForcePlay ? 1.0 : _tsEffectiveHeat * (0.05 + _tsS.strategic * 0.005) + _tsS.boldness * 0.02;
      if (Math.random() >= _tsPlayChance) continue;

      // Consume the advantage and flag for post-vote elimination-swap
      gs.advantages.splice(gs.advantages.indexOf(_tsAdv), 1);
      gs.knownTeamSwapHolders?.delete(_tsHolder);
      ep.eliminationSwap = true; // triggers the elimination-swap handler post-vote
      ep.teamSwapAdvantage = true; // distinguish from the twist version
      ep.idolPlays.push({ player: _tsHolder, type: 'teamSwap', forced: _tsForcePlay });
      ep.teamSwapPlayed = { holder: _tsHolder };
      // bigMoves credit
      const _tsBmState = getPlayerState(_tsHolder);
      _tsBmState.bigMoves = (_tsBmState.bigMoves || 0) + 1;
      if (!gs.bigMoveEarnersThisEp) gs.bigMoveEarnersThisEp = [];
      if (!gs.bigMoveEarnersThisEp.includes(_tsHolder)) gs.bigMoveEarnersThisEp.push(_tsHolder);
      break;
    }
  }
}

export function pickNomineeWithDrama(pool, weightFn) {
  const nominee = wRandom(pool, weightFn);
  if (!nominee || pool.length < 2) return { nominee, dramaEvent: null };

  const s = pStats(nominee);
  const others = pool.filter(p => p !== nominee);

  // Who else had a strong claim (within 70% of winner's weight)?
  const nWeight = weightFn(nominee);
  const rivals = others.filter(p => weightFn(p) >= nWeight * 0.70);

  const roll = Math.random();
  let dramaEvent = null;

  if (rivals.length && roll < 0.32) {
    // Someone else wanted to go — quiet tension between them
    const rival = rivals[Math.floor(Math.random() * rivals.length)];
    addBond(nominee, rival, -0.5);
    const rLines = [
      `${rival} had been ready to go. ${nominee} got chosen instead. ${rival} didn't push back — just got quieter.`,
      `There was a moment where both ${rival} and ${nominee} clearly wanted the same thing. ${nominee} ended up going. ${rival} took it well, outwardly.`,
      `${rival} put their name forward first. The tribe picked ${nominee} anyway. The decision didn't sit perfectly with ${rival}.`,
    ];
    dramaEvent = { type: 'watchingYou', mentioned: [rival, nominee], text: rLines[Math.floor(Math.random() * rLines.length)] };
  } else if (s.strategic >= 7 && roll < 0.22) {
    // Strategic nominee suspects they were volunteered on purpose
    const instigator = others.reduce((best, p) => pStats(p).strategic > pStats(best).strategic ? p : best, others[0]);
    addBond(nominee, instigator, -0.5);
    const iLines = [
      `${nominee} agreed to go, but filed away the fact that ${instigator} had been the first to suggest it.`,
      `${nominee} noticed who pushed hardest for them to leave camp. ${nominee} smiled, said yes, and started paying closer attention to ${instigator}.`,
      `${instigator} volunteered ${nominee}'s name almost immediately. ${nominee} went. ${instigator} is going to hear about that eventually.`,
    ];
    dramaEvent = { type: 'watchingYou', mentioned: [nominee, instigator], text: iLines[Math.floor(Math.random() * iLines.length)] };
  } else if (s.loyalty >= 8 && roll < 0.18) {
    // Loyal player steps up — tribe appreciates it
    const closestAlly = others.reduce((best, p) => getBond(nominee, p) > getBond(nominee, best) ? p : best, others[0]);
    addBond(nominee, closestAlly, 0.5);
    const lLines = [
      `${nominee} volunteered to go when nobody else stepped up. ${closestAlly} noticed. Small things add up.`,
      `Nobody wanted to leave camp. ${nominee} said they'd do it. That didn't go unnoticed by ${closestAlly}.`,
    ];
    dramaEvent = { type: 'bond', mentioned: [nominee, closestAlly], text: lLines[Math.floor(Math.random() * lLines.length)] };
  }

  return { nominee, dramaEvent };
}

