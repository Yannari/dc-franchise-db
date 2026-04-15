// js/bonds.js - Bond tracking, perceived bonds, bond recovery
import { gs, players, seasonConfig } from './core.js';
import { pStats, pronouns, threatScore } from './players.js';

export function bKey(a, b)         { return [a,b].sort().join('||'); }

export function getBond(a, b)      { return gs?.bonds?.[bKey(a,b)] ?? 0; }

export function setBond(a, b, val) { if(gs) gs.bonds[bKey(a,b)] = Math.max(-10, Math.min(10, val)); }

export function addBond(a, b, d) {
  // Temperament scaling: hotheads feel everything harder (bonds swing faster both ways)
  const _pA = players.find(p => p.name === a), _pB = players.find(p => p.name === b);
  const _sA = _pA?.stats, _sB = _pB?.stats;
  if (_sA || _sB) {
    const _minTemp = Math.min(_sA?.temperament ?? 5, _sB?.temperament ?? 5);
    const _tempScale = 1.0 + (5 - _minTemp) * 0.04;
    d *= _tempScale;
  }
  // Villain bond dynamics: villains gain LESS from positive bonds (they use people, not love them)
  // But they lose LESS from negative ones too (they don't care what people think)
  const _archA = _pA?.archetype, _archB = _pB?.archetype;
  if (_archA === 'villain' || _archB === 'villain') {
    if (d > 0) d *= 0.7; // positive bonds form slower for villains (not genuine)
    if (d < 0) d *= 0.8; // negative bonds hit less (they don't care)
  }
  // Hero bond dynamics: heroes give MORE but receive slightly less (taken for granted)
  if (_archA === 'hero' || _archB === 'hero') {
    if (d > 0) d *= 1.15; // heroes build bonds faster (genuine warmth)
  }
  setBond(a, b, getBond(a,b)+d);
}

export function getPerceivedBond(a, b) {
  const key = a + '→' + b;
  const entry = gs?.perceivedBonds?.[key];
  if (entry && Math.abs(entry.perceived - getBond(a, b)) >= 0.3) {
    return entry.perceived;
  }
  return getBond(a, b);
}

export function addPerceivedBond(a, b, perceived, reason) {
  if (!gs.perceivedBonds) gs.perceivedBonds = {};
  const s = pStats(a);
  const correctionRate = s.intuition * 0.07 + s.mental * 0.025;
  gs.perceivedBonds[a + '→' + b] = { perceived, reason, createdEp: (gs.episode || 0) + 1, correctionRate };
}

export function removePerceivedBondsFor(name) {
  if (!gs.perceivedBonds) return;
  Object.keys(gs.perceivedBonds).forEach(k => {
    if (k.startsWith(name + '→') || k.endsWith('→' + name)) delete gs.perceivedBonds[k];
  });
}

export function updatePerceivedBonds(ep) {
  if (!gs.perceivedBonds || !Object.keys(gs.perceivedBonds).length) return;
  const _pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const curEp = (gs.episode || 0) + 1;

  Object.keys(gs.perceivedBonds).forEach(key => {
    const entry = gs.perceivedBonds[key];
    if (!entry) return;
    const [from, to] = key.split('→');
    if (!gs.activePlayers.includes(from) || !gs.activePlayers.includes(to)) {
      delete gs.perceivedBonds[key]; return;
    }
    const real = getBond(from, to);
    let rate = entry.correctionRate;

    // Situational modifiers
    const _prevEp = gs.episodeHistory?.[gs.episodeHistory.length - 1];
    // Received votes at tribal last episode
    if (_prevEp?.votes?.[from]) rate += 0.30;
    // Witnessed deceiver betray someone else
    if (_prevEp?.votingLog?.some(v => v.voter === to && v.voted !== from && getBond(from, v.voted) >= 2)) rate += 0.20;
    // Paranoid emotional state
    if (gs.playerStates?.[from]?.emotional === 'paranoid') rate += 0.10;
    // Trigger E: loyalty slows correction
    if (entry.reason === 'post-betrayal-denial') {
      const _loy = pStats(from).loyalty || 5;
      rate = Math.max(0.05, rate - _loy * 0.03);
    }
    // Trigger F: showmance blindspot — very slow
    if (entry.reason === 'showmance-blindspot') {
      rate = Math.min(rate, pStats(from).intuition * 0.05);
    }

    // If this was a positive-inflation trigger but real has overtaken perceived, gap is irrelevant
    const _positiveInflation = ['villain-manipulation', 'goat-keeping', 'swap-loyalty-assumption', 'provider-entitlement', 'showmance-blindspot'];
    if (_positiveInflation.includes(entry.reason) && entry.perceived <= real) {
      delete gs.perceivedBonds[key]; return;
    }
    // Apply correction
    entry.perceived += (real - entry.perceived) * Math.min(1, rate);

    // Check if gap is closed
    if (Math.abs(entry.perceived - real) < 0.3) {
      const gapSize = Math.abs(entry.perceived - real + (real - entry.perceived) / Math.min(1, rate)); // original gap before this correction
      const _origGap = Math.abs((gs.perceivedBonds[key]?.perceived ?? real) - real);
      // Fire realization camp event
      const pr = pronouns(from);
      const campKey = gs.isMerged ? 'merge' : (gs.tribes.find(t => t.members.includes(from))?.name || 'merge');
      if (ep.campEvents?.[campKey]?.pre) {
        const _realizationText = {
          'low-loyalty-betrayal': [
            `${from} replays the last vote in ${pr.pos} head. The math doesn't add up. ${to}'s name keeps coming back.`,
            `${from} finally sees what everyone else saw weeks ago. ${to} was never on ${pr.pos} side.`,
            `${from} catches ${to} avoiding eye contact. It clicks.`
          ],
          'villain-manipulation': [
            `${from} catches ${to} in a lie. A small one. But it rewrites everything.`,
            `${from} watched ${to} do to someone else exactly what ${to} did to ${pr.obj}. The pattern is clear now.`,
            `${from} sees through ${to} for the first time. The warmth was never real.`
          ],
          'goat-keeping': [
            `${from} overhears a conversation ${pr.sub} wasn't supposed to hear.`,
            `${from} asks ${to} about the final three. The pause before the answer says everything.`,
            `Someone tells ${from} the truth. ${pr.Sub} didn't believe it at first. Now ${pr.sub} ${pr.sub==='they'?'do':'does'}.`
          ],
          'alliance-blindspot': [
            `${from} counts the eye contact at dinner. Something changed.`,
            `${from} sees it too late. The alliance moved without ${pr.obj}.`
          ],
          'post-betrayal-denial': [
            `${from} stops sitting next to ${to}. No announcement. Just a gap at the fire.`,
            `${from} doesn't forgive ${to}. ${pr.Sub} just stop${pr.sub==='they'?'':'s'} pretending.`
          ],
          'showmance-blindspot': [
            `${from} finds out about the other alliance. The look on ${pr.pos} face says everything.`,
            `${from} and ${to} sit apart for the first time. The tribe notices before either of them does.`
          ],
          'provider-entitlement': [
            `${from} got votes. After everything ${pr.sub} did for the tribe. The betrayal isn't strategic — it's personal.`,
            `${from} stopped fishing. Not because ${pr.sub} can't. Because ${pr.sub} finally realized it wasn't earning ${pr.obj} anything.`
          ],
          'swap-loyalty-assumption': [
            `${from} realizes the new tribe was never ${pr.pos} tribe. Just a waiting room.`,
            `${from} hears ${pr.pos} name come up. Not as a target — just as an option. That's worse.`
          ]
        };
        const variants = _realizationText[entry.reason] || [`${from} finally sees the truth about ${to}.`];
        // Cap wake-up call events at 2 per episode to avoid flooding camp feed
        const _wakeUpCount = ep.campEvents[campKey].pre.filter(e => e.type === 'perceptionRealization').length;
        if (_wakeUpCount < 3) {
          ep.campEvents[campKey].pre.push({
            type: 'perceptionRealization', players: [from, to],
            text: _pick(variants), badgeText: 'WAKE-UP CALL', badgeClass: 'red'
          });
        }
      }
      // Consequences based on gap size
      const _entryGap = Math.abs(entry.perceived - real) / Math.max(0.01, 1 - Math.min(1, rate)); // estimate original gap
      if (_entryGap >= 2.0) addBond(from, to, -0.5); // pain of being wrong
      if (_entryGap >= 4.0) {
        if (gs.playerStates?.[from]) gs.playerStates[from].emotional = 'desperate';
      } else if (_entryGap >= 3.0) {
        if (gs.playerStates?.[from]) gs.playerStates[from].emotional = 'paranoid';
      }
      delete gs.perceivedBonds[key];
    }
  });
}

export function checkPerceivedBondTriggers(ep) {
  if (!gs.perceivedBonds) gs.perceivedBonds = {};
  // Clean up stale gaps: positive-inflation triggers where real has overtaken perceived
  const _posInf = ['villain-manipulation', 'goat-keeping', 'swap-loyalty-assumption', 'provider-entitlement', 'showmance-blindspot'];
  Object.keys(gs.perceivedBonds).forEach(key => {
    const entry = gs.perceivedBonds[key];
    if (!entry) return;
    const [from, to] = key.split('→');
    const real = getBond(from, to);
    if (_posInf.includes(entry.reason) && entry.perceived <= real) delete gs.perceivedBonds[key];
    if (Math.abs(entry.perceived - real) < 0.3) delete gs.perceivedBonds[key];
  });
  const _pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const curEp = (gs.episode || 0) + 1;
  const campKey = gs.isMerged ? 'merge' : null;
  // Use pre-vote bond snapshot if available (bonds change during vote resolution)
  const _preVoteBonds = ep._preVoteBondSnapshot || {};
  const _getPreVoteBond = (a, b) => _preVoteBonds[bKey(a, b)] ?? getBond(a, b);
  if (!ep._pbTriggerLog) ep._pbTriggerLog = [];
  const _tlog = msg => ep._pbTriggerLog.push(msg);

  // ── Trigger A: Low-Loyalty Betrayal ──
  // After votes: if B voted against A, A had bond >= 1.5 with B, and B has loyalty <= 6
  const vlog = ep.votingLog || [];
  _tlog(`Trigger A: checking ${vlog.length} votes, snapshot has ${Object.keys(_preVoteBonds).length} bonds`);
  vlog.forEach(v => {
    if (!v.voter || v.voter === 'THE GAME' || !v.voted) return;
    const voter = v.voter, target = v.voted;
    if (!gs.activePlayers.includes(target)) { _tlog(`  A skip: ${target} not active (eliminated)`); return; }
    const targetBond = _getPreVoteBond(target, voter);
    const voterLoyalty = pStats(voter).loyalty;
    if (targetBond >= 1.5 && voterLoyalty <= 6) {
      const key = target + '→' + voter;
      if (gs.perceivedBonds[key]) { _tlog(`  A skip: ${key} already exists`); return; }
      addPerceivedBond(target, voter, targetBond, 'low-loyalty-betrayal');
      _tlog(`  A CREATED: ${target}→${voter} perceived=${targetBond.toFixed(1)} loyalty=${voterLoyalty}`);
    } else {
      _tlog(`  A miss: ${voter}→${target} bond=${targetBond.toFixed(1)} loyalty=${voterLoyalty}`);
    }
  });

  // ── Trigger B: Villain Manipulation ──
  // Each episode: villain with strategic >= 7 picks ONE target to manipulate (most vulnerable)
  gs.activePlayers.forEach(name => {
    const arch = players.find(p => p.name === name)?.archetype;
    if (arch !== 'villain') return;
    const vS = pStats(name);
    if (vS.strategic < 7) return;
    // Pick the single most manipulable non-villain: bond >= 2, intuition <= 5, no existing gap
    const candidates = gs.activePlayers.filter(t => {
      if (t === name) return false;
      if (players.find(p => p.name === t)?.archetype === 'villain') return false;
      if (pStats(t).intuition > 5) return false;
      if (getBond(t, name) < 2) return false;
      if (gs.perceivedBonds[t + '→' + name]) return false;
      return true;
    });
    if (!candidates.length) return;
    const target = candidates.sort((a, b) => pStats(a).intuition - pStats(b).intuition)[0];
    const realBond = getBond(target, name);
    const inflation = 1.0 + Math.random() * 0.5; // meaningful gap: +1.0 to +1.5
    addPerceivedBond(target, name, realBond + inflation, 'villain-manipulation');
    _tlog(`  B CREATED: ${target}→${name} real=${realBond.toFixed(1)} perceived=${(realBond + inflation).toFixed(1)}`);
    // Camp event (~40% chance)
    if (Math.random() < 0.40) {
      const pr = pronouns(name);
      const tPr = pronouns(target);
      const tribeKey = campKey || gs.tribes.find(t => t.members.includes(name))?.name;
      if (tribeKey && ep.campEvents?.[tribeKey]?.pre) {
        ep.campEvents[tribeKey].pre.push({
          type: 'villainManipulation', players: [name, target],
          text: _pick([
            `${name} smiles at ${target}. It's rehearsed. ${target} doesn't notice.`,
            `${name} tells ${target} exactly what ${tPr.sub} need${tPr.sub==='they'?'':'s'} to hear. None of it is real.`,
            `${name} puts an arm around ${target}. The camera catches the look on ${name}'s face when ${target} turns away.`,
            `${name} and ${target} talk for an hour. ${name} learned everything. ${target} learned nothing true.`,
          ]),
          badgeText: 'ONE-SIDED', badgeClass: 'gold'
        });
      }
    }
  });

  // ── Trigger C: Mastermind Goat-Keeping ──
  // Strategic >= 7 player allied with a lower-threat player (threat gap >= 3), real bond <= 3
  (gs.namedAlliances || []).forEach(alliance => {
    if (!alliance.active) return;
    const activeMembers = alliance.members.filter(m => gs.activePlayers.includes(m));
    if (activeMembers.length < 2) return;
    activeMembers.forEach(mastermind => {
      const mS = pStats(mastermind);
      if (mS.strategic < 7) return;
      const mThreat = threatScore(mastermind);
      activeMembers.forEach(goat => {
        if (goat === mastermind) return;
        const gThreat = threatScore(goat);
        if (mThreat - gThreat < 3) return; // not enough of a gap — they're peers, not goat-keeper
        const realBond = getBond(goat, mastermind);
        if (realBond > 3) return; // mastermind actually likes them — not goat-keeping
        const key = goat + '→' + mastermind;
        if (gs.perceivedBonds[key]) return; // already has a gap
        const inflation = 2 + Math.random();
        addPerceivedBond(goat, mastermind, realBond + inflation, 'goat-keeping');
        // Camp event (~35% chance)
        if (Math.random() < 0.35) {
          const pr = pronouns(goat);
          const tribeKey = campKey || gs.tribes.find(t => t.members.includes(goat))?.name;
          if (tribeKey && ep.campEvents?.[tribeKey]?.pre) {
            ep.campEvents[tribeKey].pre.push({
              type: 'goatKeeping', players: [goat, mastermind],
              text: _pick([
                `${goat} tells the camera ${mastermind} is taking ${pr.obj} to the end. ${mastermind} told ${pr.obj} so.`,
                `${goat} walks around camp like ${pr.sub} already won. ${mastermind} watches. Smiles. Says nothing.`,
                `${mastermind} needs ${goat} for three more votes. After that, ${pr.sub} ${pr.sub==='they'?'are':'is'} disposable.`,
                `${goat} thinks ${pr.sub} ${pr.sub==='they'?'have':'has'} a final two deal. ${mastermind} has three of those.`,
              ]),
              badgeText: 'ONE-SIDED', badgeClass: 'gold'
            });
          }
        }
      });
    });
  });

  // ── Trigger D: Alliance Blindspot ──
  // An alliance targets one of its own members AND the target didn't sense it (failed scramble check)
  (gs.namedAlliances || []).forEach(alliance => {
    if (!alliance.active) return;
    const activeMembers = alliance.members.filter(m => gs.activePlayers.includes(m));
    if (activeMembers.length < 3) return;
    // Check if this alliance's vote target is one of its own members
    const epAlliances = ep.alliances || [];
    epAlliances.forEach(a => {
      if (a.label !== alliance.name) return;
      if (!a.target || !activeMembers.includes(a.target)) return;
      const target = a.target;
      // Did the target sense it? Use the scramble check formula
      const tS = pStats(target);
      const _senseChance = tS.strategic * 0.05 + tS.intuition * 0.02;
      if (Math.random() < _senseChance) return; // they sensed it — no blindspot
      // Freeze perceived bonds with alliance members
      activeMembers.forEach(member => {
        if (member === target) return;
        const key = target + '→' + member;
        if (gs.perceivedBonds[key]) return;
        const realBond = getBond(target, member);
        if (realBond < 1) return; // they already don't trust this person
        addPerceivedBond(target, member, realBond, 'alliance-blindspot');
      });
      // Camp event (~40% chance)
      if (Math.random() < 0.40) {
        const pr = pronouns(target);
        const tribeKey = campKey || gs.tribes.find(t => t.members.includes(target))?.name;
        if (tribeKey && ep.campEvents?.[tribeKey]?.pre) {
          ep.campEvents[tribeKey].pre.push({
            type: 'allianceBlindspot', players: [target],
            text: _pick([
              `${target} sits with the alliance at dinner. The conversation feels the same as always. It isn't.`,
              `${target} checks in with everyone. They all say the right things. None of them mean it.`,
              `The plan is set. ${target} is the only one who doesn't know.`,
              `${target} goes to bed feeling safe. ${pr.Sub} shouldn't.`,
            ]),
            badgeText: 'ONE-SIDED', badgeClass: 'gold'
          });
        }
      }
    });
  });

  // ── Trigger E: Post-Betrayal Denial ──
  // After votes: if A was betrayed by an ally and A has loyalty >= 6, perceived bond drops slower
  vlog.forEach(v => {
    if (!v.voter || v.voter === 'THE GAME' || !v.voted) return;
    const betrayer = v.voter, victim = v.voted;
    if (!gs.activePlayers.includes(victim)) return;
    const victimS = pStats(victim);
    if (victimS.loyalty < 6) return;
    const preBond = _getPreVoteBond(victim, betrayer);
    if (preBond < 1) return; // wasn't a trusted relationship
    // Check if they were in the same named alliance
    const sharedAlliance = (gs.namedAlliances || []).some(a =>
      a.active && a.members.includes(victim) && a.members.includes(betrayer)
    );
    if (!sharedAlliance && preBond < 2) return; // needs either alliance or decent bond
    const key = victim + '→' + betrayer;
    if (gs.perceivedBonds[key]) return;
    // Perceived bond freezes near pre-vote level; real bond will crash from the betrayal
    const correctionRate = Math.max(0.05, victimS.intuition * 0.08 - victimS.loyalty * 0.03);
    gs.perceivedBonds[key] = { perceived: preBond, reason: 'post-betrayal-denial', createdEp: curEp, correctionRate };
    // Camp event (~45% chance — denial is visible to the tribe)
    if (Math.random() < 0.45) {
      const pr = pronouns(victim);
      const tribeKey = campKey || gs.tribes.find(t => t.members.includes(victim))?.name;
      if (tribeKey && ep.campEvents?.[tribeKey]?.pre) {
        ep.campEvents[tribeKey].pre.push({
          type: 'betrayalDenial', players: [victim, betrayer],
          text: _pick([
            `${victim} still sits next to ${betrayer} at the fire. Everyone else sees it. ${pr.Sub} ${pr.sub==='they'?'don\'t':'doesn\'t'}. Not yet.`,
            `${victim} makes excuses for ${betrayer}. "Maybe ${betrayer} had no choice." The tribe doesn't argue. They know.`,
            `${victim} won't hear it. ${betrayer} is still ${pr.pos} ally. That's the story ${pr.sub} ${pr.sub==='they'?'are':'is'} telling ${pr.ref}.`,
          ]),
          badgeText: 'ONE-SIDED', badgeClass: 'gold'
        });
      }
    }
  });

  // ── Trigger F: Showmance Blindspot ──
  // Partner in showmance with loyalty <= 5 OR in a separate alliance targeting the player
  (gs.showmances || []).forEach(shm => {
    if (!shm.players || shm.players.length < 2) return;
    if (shm.phase !== 'honeymoon' && shm.phase !== 'ride-or-die') return;
    const [a, b] = shm.players;
    if (!gs.activePlayers.includes(a) || !gs.activePlayers.includes(b)) return;
    // Check each direction
    [{ loyal: a, drifter: b }, { loyal: b, drifter: a }].forEach(({ loyal, drifter }) => {
      const dS = pStats(drifter);
      // Drifter has low loyalty OR is in a separate alliance targeting the loyal partner
      const isLowLoyalty = dS.loyalty <= 5;
      const isPlotting = (gs.namedAlliances || []).some(al =>
        al.active && al.members.includes(drifter) && !al.members.includes(loyal)
      );
      if (!isLowLoyalty && !isPlotting) return;
      const key = loyal + '→' + drifter;
      if (gs.perceivedBonds[key]) return;
      const realBond = getBond(loyal, drifter);
      if (realBond < 5) return; // showmance bond should be high
      // Inflate perceived bond to showmance levels
      addPerceivedBond(loyal, drifter, Math.min(10, realBond + 1.5), 'showmance-blindspot');
      // Override correction rate — very slow for showmance
      gs.perceivedBonds[key].correctionRate = pStats(loyal).intuition * 0.05;
      // Camp event (~30% chance)
      if (Math.random() < 0.30) {
        const pr = pronouns(loyal);
        const tribeKey = campKey || gs.tribes.find(t => t.members.includes(loyal))?.name;
        if (tribeKey && ep.campEvents?.[tribeKey]?.pre) {
          ep.campEvents[tribeKey].pre.push({
            type: 'showmanceBlindspot', players: [loyal, drifter],
            text: _pick([
              `${loyal} thinks they're going to the end together. ${drifter} has been having conversations ${loyal} doesn't know about.`,
              `The showmance is real for ${loyal}. For ${drifter}, it's a strategy.`,
              `${loyal} trusts ${drifter} completely. ${drifter} trusts the game more.`,
            ]),
            badgeText: 'ONE-SIDED', badgeClass: 'gold'
          });
        }
      }
    });
  });

  // ── Trigger G: Provider Entitlement ──
  // Provider whose tribe bonds are declining — only when survival mechanics are enabled
  if (seasonConfig.foodWater === 'enabled' && gs.currentProviders?.length) {
    gs.currentProviders.forEach(provider => {
      if (!gs.activePlayers.includes(provider)) return;
      // Only fire once per provider per season
      if (gs.perceivedBonds && Object.keys(gs.perceivedBonds).some(k => k.startsWith(provider + '→') && gs.perceivedBonds[k].reason === 'provider-entitlement')) return;
      const tribe = gs.isMerged ? gs.activePlayers : (gs.tribes.find(t => t.members.includes(provider))?.members || []);
      const tribemates = tribe.filter(m => m !== provider);
      if (!tribemates.length) return;
      const avgBond = tribemates.reduce((sum, m) => sum + getBond(provider, m), 0) / tribemates.length;
      // Only trigger if avg bond is low despite providing — they should be loved but aren't
      if (avgBond >= 1.5) return;
      // Need at least ep 4 — takes time for entitlement to build
      if (curEp < 4) return;
      // Pick ONE tribemate with lowest bond
      const worstMate = tribemates.filter(m => !gs.perceivedBonds[provider + '→' + m]).sort((a, b) => getBond(provider, a) - getBond(provider, b))[0];
      if (!worstMate) return;
      const decliningMates = [worstMate];
      decliningMates.forEach(mate => {
        const key = provider + '→' + mate;
        if (gs.perceivedBonds[key]) return;
        const realBond = getBond(provider, mate);
        addPerceivedBond(provider, mate, realBond + 1.0 + Math.random() * 0.5, 'provider-entitlement');
      });
      // Camp event (~25% chance)
      if (decliningMates.length && Math.random() < 0.25) {
        const pr = pronouns(provider);
        const tribeKey = campKey || gs.tribes.find(t => t.members.includes(provider))?.name;
        if (tribeKey && ep.campEvents?.[tribeKey]?.pre) {
          ep.campEvents[tribeKey].pre.push({
            type: 'providerEntitlement', players: [provider],
            text: _pick([
              `${provider} caught three fish today. ${pr.Sub} think${pr.sub==='they'?'s':''} that buys ${pr.obj} another week. It doesn't.`,
              `${provider} works harder than anyone at camp. ${pr.Sub} think${pr.sub==='they'?'s':''} that matters more than it does.`,
              `${provider} looks at the fire ${pr.sub} built, the food ${pr.sub} caught, and wonders why the tribe isn't more grateful.`,
            ]),
            badgeText: 'ONE-SIDED', badgeClass: 'gold'
          });
        }
      }
    });
  }

  // ── Trigger H: Swap Loyalty Assumption ──
  // Player recently swapped tribes and mistakes early friendliness for genuine loyalty
  if (gs._recentSwaps) {
    Object.entries(gs._recentSwaps).forEach(([name, swapEp]) => {
      if (!gs.activePlayers.includes(name)) return;
      if (curEp - swapEp > 2) { delete gs._recentSwaps[name]; return; } // only first 2 episodes after swap
      const tribe = gs.tribes.find(t => t.members.includes(name));
      if (!tribe) return;
      const newMates = tribe.members.filter(m => m !== name);
      // Cap at 2 gaps per swapped player — pick the 2 highest-bond new tribemates
      const _swapCandidates = newMates
        .filter(m => !gs.perceivedBonds[name + '→' + m] && getBond(name, m) >= 1)
        .sort((a, b) => getBond(name, b) - getBond(name, a))
        .slice(0, 2);
      _swapCandidates.forEach(mate => {
        const key = name + '→' + mate;
        const realBond = getBond(name, mate);
        addPerceivedBond(name, mate, realBond + 1.0 + Math.random() * 0.5, 'swap-loyalty-assumption');
      });
      // Camp event (once per swap, first episode only)
      if (curEp === swapEp) {
        const pr = pronouns(name);
        const tribeKey = tribe.name;
        if (ep.campEvents?.[tribeKey]?.pre) {
          ep.campEvents[tribeKey].pre.push({
            type: 'swapLoyaltyAssumption', players: [name],
            text: _pick([
              `${name} thinks ${pr.sub} ${pr.sub==='they'?'have':'has'} found a new home. The tribe is being kind. Kind isn't the same as loyal.`,
              `The new tribe welcomed ${name}. Smiles. Shelter space. A seat at the fire. It felt real. The question is whether it stays that way.`,
              `${name} reads the warmth as loyalty. It might just be politeness. ${pr.Sub} can't tell yet.`,
            ]),
            badgeText: 'ONE-SIDED', badgeClass: 'gold'
          });
        }
      }
    });
  }
}

export function recoverBonds(ep) {
  const epNum = ep?.num || (gs.episode || 0) + 1;
  // Build set of pairs who actively clashed this episode (voted against each other, negative camp events)
  const _activeFeuds = new Set();
  // Voters who targeted each other
  (ep.votingLog || []).forEach(v => {
    if (v.voter !== 'THE GAME') _activeFeuds.add([v.voter, v.voted].sort().join('|'));
  });
  // Negative camp events between players
  const _allCampEvts = ep.campEvents ? Object.values(ep.campEvents).flatMap(phase =>
    Array.isArray(phase) ? phase : [...(phase?.pre || []), ...(phase?.post || [])]
  ) : [];
  _allCampEvts.forEach(evt => {
    if (evt.players?.length === 2 && ['fight','dispute','hotheadExplosion','socialBomb','socialBombReaction'].includes(evt.type)) {
      _activeFeuds.add(evt.players.sort().join('|'));
    }
  });

  // Recovery: soften extreme bonds toward -2.0 baseline (weakened — feuds stick longer)
  const active = gs.activePlayers;
  for (let i = 0; i < active.length; i++) {
    for (let j = i + 1; j < active.length; j++) {
      const a = active[i], b = active[j];
      const bond = getBond(a, b);
      // Only recover bonds below -3.0 (mild-to-moderate dislike is stable — only extreme hatred softens)
      if (bond >= -3.0) continue;
      // Skip if they actively fought this episode
      if (_activeFeuds.has([a, b].sort().join('|'))) continue;
      // Recovery rate: slower than before. bond -4 → +0.08, bond -6 → +0.12, bond -8 → +0.16
      const _avgSocial = (pStats(a).social + pStats(b).social) / 2;
      const _socialBonus = _avgSocial * 0.008; // halved: stat 4=0.032, stat 8=0.064
      const recovery = Math.min(0.20, 0.05 + Math.abs(bond + 3.0) * 0.02 + _socialBonus);
      // Cap: never recover past -2.0 (feuds leave deep scars)
      const newBond = Math.min(-2.0, bond + recovery);
      if (newBond > bond) {
        const key = [a, b].sort().join('|');
        gs.bonds[key] = newBond;
      }
    }
  }

  // ── Positive bond cooling: strong bonds drift down gently unless reinforced ──
  // Bonds above +4.0 cool slightly each episode — relationships require maintenance
  const _posReinforced = new Set();
  _allCampEvts.forEach(evt => {
    if (evt.players?.length >= 2 && ['bond','tdBond','comfort','strategicTalk','flirtation',
        'sharedStruggle','rivalThaw','teachingMoment','vulnerability','insideJoke','loyaltyProof',
        'showmancerMoment','soldierCheckin'].includes(evt.type)) {
      for (let pi = 0; pi < evt.players.length; pi++) {
        for (let pj = pi + 1; pj < evt.players.length; pj++) {
          _posReinforced.add([evt.players[pi], evt.players[pj]].sort().join('|'));
        }
      }
    }
  });
  for (let i = 0; i < active.length; i++) {
    for (let j = i + 1; j < active.length; j++) {
      const a = active[i], b = active[j];
      const bond = getBond(a, b);
      if (bond <= 4.0) continue; // only cool strong bonds
      if (_posReinforced.has([a, b].sort().join('|'))) continue; // reinforced this ep
      if (_activeFeuds.has([a, b].sort().join('|'))) continue; // fighting cools bonds via the fight itself
      if (gs.showmances?.some(sh => sh.players.includes(a) && sh.players.includes(b) && sh.phase !== 'broken-up')) continue;
      // Gentle cooling: bond +5 → -0.06, bond +7 → -0.10, bond +9 → -0.14
      const _avgLoyalty = (pStats(a).loyalty + pStats(b).loyalty) / 2;
      const cooling = Math.max(0.03, 0.04 + (bond - 4.0) * 0.02 - _avgLoyalty * 0.005);
      const newBond = Math.max(3.0, bond - cooling); // floor at +3.0
      if (newBond < bond) gs.bonds[[a, b].sort().join('|')] = newBond;
    }
  }

  // ── Loyalty glue: players who have ACTUALLY been loyal strengthen their alliance bonds ──
  // Based on behavior (betrayal record), not just their loyalty stat
  // Only fires when the alliance DID something together this episode:
  //   - Voted the same target (coordination), OR
  //   - Survived a tribal together (shared threat)
  // Just existing isn't enough — alliances that coast don't strengthen passively.
  const _epNum = ep?.num || gs.episode || 0;
  const _epVoteLog = ep?.votingLog || [];
  (gs.namedAlliances || []).forEach(alliance => {
    if (!alliance.active) return;
    const allyActive = alliance.members.filter(m => active.includes(m));
    if (allyActive.length < 2) return;
    // Check if alliance members coordinated this episode
    const _allyVotes = _epVoteLog.filter(v => allyActive.includes(v.voter));
    const _allyTargets = _allyVotes.map(v => v.voted);
    // Did at least 2 members vote the same target?
    const _targetCounts = {};
    _allyTargets.forEach(t => { _targetCounts[t] = (_targetCounts[t] || 0) + 1; });
    const _coordinated = Object.values(_targetCounts).some(c => c >= 2);
    // Did they survive a tribal together? (at least 2 members were at tribal and none eliminated)
    const _tribalMembers = ep?.tribalPlayers || [];
    const _allyAtTribal = allyActive.filter(m => _tribalMembers.includes(m));
    const _survivedTogether = _allyAtTribal.length >= 2 && !_allyAtTribal.includes(ep?.eliminated);
    if (!_coordinated && !_survivedTogether) return; // alliance coasted — no glue
    allyActive.forEach(m => {
      // Check actual loyalty: how many times have they betrayed THIS alliance?
      const _myBetrayals = (alliance.betrayals || []).filter(b => b.player === m).length;
      if (_myBetrayals >= 2) return; // serial betrayer of this alliance — no glue
      // Didn't betray this episode
      const _betrayedThisEp = (alliance.betrayals || []).some(b => b.player === m && b.ep === _epNum);
      if (_betrayedThisEp) return;
      // Boost scales with clean record: 0 betrayals → +0.06, 1 betrayal → +0.02
      const loyaltyBoost = _myBetrayals === 0 ? 0.06 : 0.02;
      allyActive.filter(o => o !== m).forEach(o => {
        if (!_activeFeuds.has([m, o].sort().join('|'))) {
          addBond(m, o, loyaltyBoost);
        }
      });
    });
  });

  // ── Tribe cohesion: tribemates who coexist without fighting naturally drift closer ──
  // Shared survival builds bonds over time — this is why pre-merge tribes are tight
  const _tribeGroups = gs.isMerged ? [{ members: [...active] }] : gs.tribes;
  _tribeGroups.forEach(tribe => {
    const members = tribe.members?.filter(m => active.includes(m)) || [];
    for (let i = 0; i < members.length; i++) {
      for (let j = i + 1; j < members.length; j++) {
        const a = members[i], b = members[j];
        if (_activeFeuds.has([a, b].sort().join('|'))) continue;
        const bond = getBond(a, b);
        if (bond >= 5) continue;
        // Base cohesion + social butterfly bonus
        // If EITHER player is highly social, bonds grow faster — they make everyone around them comfortable
        const _sA = pStats(a).social, _sB = pStats(b).social;
        const _highestSocial = Math.max(_sA, _sB);
        const nudge = 0.10
          + _highestSocial * 0.02                          // proportional: stat 4=0.08, stat 8=0.16, stat 10=0.20
          + _highestSocial * 0.01;                         // butterfly bonus: stat 4=0.04, stat 8=0.08, stat 10=0.10
        addBond(a, b, nudge);
      }
    }
  });
}

export function updateBonds(votingLog, eliminated, alliances) {
  const changes = [];

  votingLog.forEach(({ voter, voted }) => {
    // People who voted the same way grow closer
    const sameVoters = votingLog.filter(l => l.voted===voted && l.voter!==voter).map(l=>l.voter);
    sameVoters.forEach(other => {
      if (getBond(voter,other) < 8) {
        addBond(voter, other, 0.5);
        changes.push({ a:voter, b:other, delta:0.5, reason:'voted together' });
      }
    });

    // Voted for someone still in the game: small negative
    if (voted !== eliminated) {
      addBond(voter, voted, -0.5);
      changes.push({ a:voter, b:voted, delta:-0.5, reason:'voted against (missed)' });
    }
  });

  // Betrayal: if eliminated player was in majority alliance and majority voted for them
  if (eliminated) {
    const eliminatedVoters = votingLog.filter(l=>l.voted===eliminated).map(l=>l.voter);
    const allianceOfElim = alliances.find(a => a.members.includes(eliminated));
    if (allianceOfElim) {
      allianceOfElim.members.forEach(m => {
        if (eliminatedVoters.includes(m)) {
          addBond(m, eliminated, -2);
          changes.push({ a:m, b:eliminated, delta:-2, reason:'betrayal (voted out ally)' });
        }
      });
    }
  }

  // Spearheader defection: bloc leader votes differently from their own bloc's stated target
  // The bloc members followed the plan — the leader secretly went elsewhere
  alliances.forEach(alliance => {
    if (!alliance.target || !alliance.members?.length) return;
    const spear = alliance.members[0];
    const spearEntry = votingLog.find(l => l.voter === spear);
    if (!spearEntry || spearEntry.voted === alliance.target) return; // voted as planned — no issue

    // Spearheader defected from their own bloc
    const actualTarget = spearEntry.voted;

    // Bond hit with the person they unexpectedly voted for
    if (gs.activePlayers.includes(actualTarget)) {
      addBond(spear, actualTarget, -1.5);
      changes.push({ a:spear, b:actualTarget, delta:-1.5, reason:'voted against unexpectedly (bloc defection)' });
    }

    // Bond hit with loyal bloc members who followed the stated plan (they were misled)
    const loyalFollowers = alliance.members.slice(1).filter(m =>
      votingLog.find(l => l.voter === m && l.voted === alliance.target) && gs.activePlayers.includes(m)
    );
    loyalFollowers.forEach(m => {
      addBond(spear, m, -1.2);
      changes.push({ a:spear, b:m, delta:-1.2, reason:'misled ally (deviated from own bloc)' });
    });

    // Tag votingLog entry so updatePlayerStates counts it as a big move
    const _cleanReason = (spearEntry.reason || '').replace(/\s*—\s*broke own bloc/gi, '').trim();
    spearEntry.reason = (_cleanReason ? _cleanReason + ' — ' : '') + 'broke own bloc';
  });

  return changes;
}

export function bondLabel(val) {
  if (val >= 9)   return 'unbreakable bond';
  if (val >= 7)   return 'ride-or-die bond';
  if (val >= 5)   return 'strong bond';
  if (val >= 3)   return 'solid bond';
  if (val >= 1)   return 'slight bond';
  if (val >= 0.5) return 'very slight bond';
  if (val > -0.5) return 'neutral relationship';
  if (val <= -9)  return 'pure hatred';
  if (val <= -7)  return 'deep-rooted hostility';
  if (val <= -5)  return 'strong hostility';
  if (val <= -3)  return 'strong dislike';
  if (val <= -1)  return 'dislike';
  return 'slight dislike';
}

export function bondFeeling(val) {
  if (val > -0.5 && val < 0.5) return 'have a neutral relationship with each other';
  return val >= 0.5
    ? `feel a mutual ${bondLabel(val)} toward one another`
    : `feel mutual ${bondLabel(val)} toward one another`;
}

