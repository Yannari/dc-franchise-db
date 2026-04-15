// js/chal/talent-show.js
import { gs, players } from '../core.js';
import { pStats, pronouns, tribeColor, updateChalRecord } from '../players.js';
import { addBond, getBond } from '../bonds.js';

export function simulateTalentShow(ep) {
  const tribes = gs.tribes.filter(t => t.members.filter(m => gs.activePlayers.includes(m)).length >= 2);
  if (tribes.length < 2) return;

  const tribeMembers = tribes.map(t => ({
    name: t.name,
    members: t.members.filter(m => gs.activePlayers.includes(m))
  }));

  // ── Assign talent type to each player based on highest stat combo ──
  function assignTalent(name) {
    const s = pStats(name);
    let bestCat = TALENT_CATEGORIES[0], bestScore = 0;
    TALENT_CATEGORIES.forEach(cat => {
      const score = s[cat.stats[0]] + s[cat.stats[1]] + Math.random() * 2;
      if (score > bestScore) { bestScore = score; bestCat = cat; }
    });
    const pool = TALENT_POOL[bestCat.id];
    const talent = pool[Math.floor(Math.random() * pool.length)];
    return { category: bestCat.id, primaryStat: bestCat.stats[0], secondaryStat: bestCat.stats[1], talent };
  }

  // ── Audition scoring ──
  function auditionScore(name, talent) {
    const s = pStats(name);
    return s[talent.primaryStat] * 0.35 + s[talent.secondaryStat] * 0.25 + s.social * 0.15 + s.temperament * 0.10 + Math.random() * 3.0;
  }

  // ── Show scoring (fresh random) ──
  function showScore(name, talent) {
    const s = pStats(name);
    return s[talent.primaryStat] * 0.35 + s[talent.secondaryStat] * 0.25 + s.social * 0.15 + s.temperament * 0.10 + Math.random() * 3.0;
  }

  function chefScore(raw) {
    return Math.min(9, Math.max(0, Math.round(raw - 2)));
  }

  // ── Auditions ──
  const auditions = {};
  const captains = {};
  tribeMembers.forEach(t => {
    // Captain: highest social+strategic
    const captain = t.members.slice().sort((a, b) => {
      const sA = pStats(a), sB = pStats(b);
      return (sB.social * 0.5 + sB.strategic * 0.5) - (sA.social * 0.5 + sA.strategic * 0.5);
    })[0];
    captains[t.name] = captain;

    // Everyone auditions — pre-render all text (functions don't survive JSON serialization)
    const results = t.members.map(name => {
      const talentInfo = assignTalent(name);
      const score = auditionScore(name, talentInfo);
      const pr = pronouns(name);
      const t_ = talentInfo.talent;
      return {
        name,
        category: talentInfo.category,
        primaryStat: talentInfo.primaryStat,
        secondaryStat: talentInfo.secondaryStat,
        talentName: t_.name,
        talentId: t_.id,
        // Pre-rendered text strings (survive serialization)
        // 3-beat arrays: [setup, act, landing]
        auditionText: t_.audition(name, pr),
        performanceText: Array.isArray(t_.performance) ? t_.performance.map(fn => fn(name, pr)) : [t_.performance(name, pr)],
        disasterText: Array.isArray(t_.disaster) ? t_.disaster.map(fn => fn(name, pr)) : [t_.disaster(name, pr)],
        clutchText: Array.isArray(t_.clutch) ? t_.clutch.map(fn => fn(name, pr)) : [t_.clutch(name, pr)],
        auditionScore: score,
        selected: false,
      };
    }).sort((a, b) => b.auditionScore - a.auditionScore);

    // Top 3 selected (or 2 if tribe has exactly 2 members)
    const actsCount = Math.min(3, t.members.length);
    results.slice(0, actsCount).forEach(r => { r.selected = true; });
    auditions[t.name] = results;
  });

  // ── Audition Drama (1 per tribe, priority order) ──
  const auditionDrama = {};
  tribeMembers.forEach(t => {
    const results = auditions[t.name] || [];
    const captain = captains[t.name];
    const selected = results.filter(r => r.selected);
    const cut = results.filter(r => !r.selected);
    if (!selected.length) return;

    // Priority 1: Captain's Controversial Cut — cut player within 0.5 of 3rd pick (needs cuts)
    const thirdPick = selected[selected.length - 1];
    const closestCut = cut.find(c => c.name !== captain); // highest-scoring cut player (not the captain)
    if (closestCut && thirdPick && closestCut.name !== captain && Math.abs(closestCut.auditionScore - thirdPick.auditionScore) < 0.5) {
      const arch = players.find(p => p.name === closestCut.name)?.archetype || '';
      const pr = pronouns(closestCut.name);
      const text = ['hero', 'loyal', 'protector'].includes(arch)
        ? `${closestCut.name} stares at ${captain}. "You're cutting me? After what I did for this tribe?" The silence is brutal.`
        : ['villain', 'schemer', 'mastermind'].includes(arch)
        ? `${closestCut.name} smiles. Cold. "Fine. Remember this when we're at tribal." ${captain} pretends not to hear.`
        : `${closestCut.name} takes it hard. Scored nearly as high as the people who made it. ${captain}'s call. Not everyone agrees.`;
      addBond(closestCut.name, captain, -0.4);
      auditionDrama[t.name] = { type: 'controversialCut', players: [closestCut.name, captain], text, badge: 'CONTROVERSIAL CUT', badgeClass: 'red' };
      return;
    }

    // Priority 2: Last Spot Fight — 3rd and 4th within 0.3
    if (closestCut && thirdPick && Math.abs(closestCut.auditionScore - thirdPick.auditionScore) < 0.3) {
      addBond(closestCut.name, thirdPick.name, -0.3);
      auditionDrama[t.name] = {
        type: 'lastSpotFight',
        players: [thirdPick.name, closestCut.name],
        text: `${thirdPick.name} and ${closestCut.name} both know only one of them is getting on that stage. ${thirdPick.name} got it. ${closestCut.name} hasn't stopped staring since.`,
        badge: 'FIGHT FOR THE SPOT', badgeClass: 'red'
      };
      return;
    }

    // Priority 3: Diva Moment — highest scorer with boldness >= 7
    const topScorer = selected[0];
    const topS = pStats(topScorer.name);
    if (topS.boldness >= 7) {
      const lowBoldness = t.members.filter(m => m !== topScorer.name && pStats(m).boldness < 5);
      lowBoldness.forEach(m => addBond(m, topScorer.name, -0.2));
      auditionDrama[t.name] = {
        type: 'divaMoment',
        players: [topScorer.name],
        text: `${topScorer.name} scored highest and wants everyone to know it. "I go first. I close the show. I AM the show." Half the tribe rolls their eyes.`,
        badge: 'DIVA', badgeClass: 'gold'
      };
      return;
    }

    // Priority 4: Terrible Audition Roast — lowest score < 2.0
    const worst = results[results.length - 1];
    if (worst && worst.auditionScore < 2.0) {
      const reactor = t.members.find(m => m !== worst.name && pStats(m).social >= 5) || t.members.find(m => m !== worst.name);
      const rPr = pronouns(reactor);
      addBond(worst.name, reactor, -0.1);
      auditionDrama[t.name] = {
        type: 'terribleAudition',
        players: [worst.name, reactor],
        text: `${worst.name}'s audition was... something. ${reactor} covers ${rPr.posAdj} mouth trying not to laugh. "Was that... on purpose?"`,
        badge: 'ROASTED', badgeClass: 'red'
      };
      return;
    }

    // Priority 5: Confidence Boost — high social selected encourages cut player
    const supporter = selected.find(s => pStats(s.name).social >= 6);
    if (supporter && cut.length) {
      const cutPlayer = cut[0];
      addBond(supporter.name, cutPlayer.name, 0.3);
      addBond(cutPlayer.name, supporter.name, 0.3);
      auditionDrama[t.name] = {
        type: 'confidenceBoost',
        players: [supporter.name, cutPlayer.name],
        text: `${supporter.name} finds ${cutPlayer.name} after the audition. "Hey. You were good. This doesn't mean anything about you." ${cutPlayer.name} nods. Needed to hear that.`,
        badge: 'ENCOURAGEMENT', badgeClass: 'gold'
      };
    }
  });

  // ── Sabotage check (villain/schemer on opposing tribe, max 1) ──
  let sabotage = null;
  tribeMembers.forEach(t => {
    if (sabotage) return;
    t.members.forEach(name => {
      if (sabotage) return;
      const s = pStats(name);
      const arch = players.find(p => p.name === name)?.archetype || '';
      // Block nice archetypes entirely — they don't sabotage
      if (['hero', 'loyal', 'loyal-soldier', 'protector', 'social-butterfly', 'showmancer'].includes(arch)) return;
      // Proportional sabotage chance — every stat point matters, no thresholds
      // villain/schemer/mastermind: strategic drives it, low social boosts it
      // chaos-agent: mental drives it
      // hothead: strategic drives it, social dampens it
      // everyone else with the right stats: tiny base chance
      let sabChance = 0;
      if (['villain', 'schemer', 'mastermind'].includes(arch)) {
        sabChance = s.strategic * 0.03 + (10 - s.social) * 0.01 + s.boldness * 0.008;
      } else if (arch === 'chaos-agent') {
        sabChance = s.mental * 0.02 + s.boldness * 0.01;
      } else if (arch === 'hothead') {
        sabChance = s.strategic * 0.025 + s.boldness * 0.01 - s.social * 0.015;
      } else {
        // Non-blocked archetypes: very low base from boldness + low loyalty
        sabChance = s.boldness * 0.005 + (10 - s.loyalty) * 0.005 - 0.05;
      }
      if (Math.random() >= Math.max(0, sabChance)) return;
      // Pick target: highest audition scorer on an opposing tribe
      const otherTribes = tribeMembers.filter(ot => ot.name !== t.name);
      const targets = otherTribes.flatMap(ot => (auditions[ot.name] || []).filter(a => a.selected));
      if (!targets.length) return;
      const target = targets.sort((a, b) => b.auditionScore - a.auditionScore)[0];
      // Only allow 'replace' (diary reading) if saboteur is a performer — they need stage time to hijack
      const isPerformer = (auditions[t.name] || []).some(a => a.name === name && a.selected);
      const availableTypes = isPerformer ? SABOTAGE_TYPES : SABOTAGE_TYPES.filter(st => st.id !== 'replace');
      const sabType = availableTypes[Math.floor(Math.random() * availableTypes.length)];
      sabotage = {
        saboteur: name, saboteurTribe: t.name,
        target: target.name, targetTribe: otherTribes.find(ot => (auditions[ot.name] || []).some(a => a.name === target.name))?.name,
        type: sabType.id, effect: sabType.effect,
        text: sabType.text(name, target.name, pronouns(target.name)),
        stageText: sabType.stageText(name, target.name, pronouns(target.name)),
      };
    });
  });

  // ── Backstage Events (2-3 between auditions and show) ──
  const backstageEvents = [];
  const maxBackstage = 6;

  // Spy Mission — villain/schemer sends ally to watch other tribe rehearse (max 1)
  let _spyFired = false;
  if (backstageEvents.length < maxBackstage) {
    tribeMembers.forEach(t => {
      if (backstageEvents.length >= maxBackstage || _spyFired) return;
      t.members.forEach(name => {
        if (backstageEvents.length >= maxBackstage || _spyFired) return;
        const arch = players.find(p => p.name === name)?.archetype || '';
        const _niceArchs = ['hero', 'loyal', 'loyal-soldier', 'protector', 'social-butterfly', 'showmancer'];
        if (_niceArchs.includes(arch)) return; // nice archetypes don't spy
        const _spyS = pStats(name);
        // Proportional: strategic drives spy missions
        if (Math.random() >= _spyS.strategic * 0.025) return; // strategic 8 = 20%, strategic 5 = 12%
        const ally = t.members.find(m => m !== name && getBond(name, m) >= 1);
        if (!ally) return;
        const otherTribes = tribeMembers.filter(ot => ot.name !== t.name);
        const targetTribe = otherTribes[Math.floor(Math.random() * otherTribes.length)];
        const bestPerformer = (auditions[targetTribe.name] || []).filter(a => a.selected).sort((a, b) => b.auditionScore - a.auditionScore)[0];
        if (!bestPerformer) return;
        const pr = pronouns(name);
        // Consequence: spy intel forces sabotage to target this specific player
        if (!ep._spyIntel) ep._spyIntel = {};
        ep._spyIntel[name] = bestPerformer.name; // saboteur → forced target
        // Bond boost: teamwork between sender and spy
        addBond(name, ally, 0.4);
        addBond(ally, name, 0.3);
        _spyFired = true;
        backstageEvents.push({
          type: 'spyMission', players: [name, ally, bestPerformer.name],
          text: `${name} sends ${ally} to spy on ${targetTribe.name}'s rehearsal. ${ally} comes back with intel: "${bestPerformer.name} is their best. That's who we target."`,
          badge: 'SPY MISSION', badgeClass: 'gold',
        });
      });
    });
  }

  // Sabotage Setup — narrative card if sabotage fires
  if (sabotage && backstageEvents.length < maxBackstage) {
    const pr = pronouns(sabotage.saboteur);
    backstageEvents.push({
      type: 'sabotageSetup', players: [sabotage.saboteur],
      text: sabotage.type === 'props'
        ? `${sabotage.saboteur} sneaks backstage to ${sabotage.target}'s setup. ${pr.Sub} ${pr.sub === 'they' ? 'tamper' : 'tampers'} with the props — loosened joints, wrong strings, marked cards. By the time ${sabotage.target} notices, it'll be too late.`
        : sabotage.type === 'rumors'
        ? `${sabotage.saboteur} works the crowd before the show. "I heard ${sabotage.target} is planning to throw the challenge." The whisper spreads. By showtime, half the audience believes it.`
        : sabotage.type === 'psych'
        ? `${sabotage.saboteur} finds ${sabotage.target} alone backstage. A few words — quiet, personal, calculated. ${sabotage.target}'s face changes. Whatever ${sabotage.saboteur} said, it hit a nerve.`
        : sabotage.type === 'replace'
        ? `${sabotage.saboteur} isn't rehearsing ${pr.posAdj} act. ${pr.Sub} ${pr.sub === 'they' ? 'are' : 'is'} rehearsing something else entirely — something aimed at ${sabotage.target}. This won't be a performance. It'll be a public execution.`
        : `${sabotage.saboteur} slips away while the tribe rehearses. ${pr.Sub} ${pr.sub === 'they' ? 'have' : 'has'} a plan for ${sabotage.target}.`,
      badge: 'SABOTAGE SETUP', badgeClass: 'red',
    });
    addBond(sabotage.saboteur, sabotage.target, -0.2);
  }

  // Pep Talk — high social non-performer comforts nervous performer
  if (backstageEvents.length < maxBackstage) {
    tribeMembers.forEach(t => {
      if (backstageEvents.length >= maxBackstage) return;
      const selected = (auditions[t.name] || []).filter(a => a.selected);
      // Proportional: lower temperament = more likely to need a pep talk
      const nervousPerformer = selected.slice().sort((a, b) => pStats(a.name).temperament - pStats(b.name).temperament)[0];
      if (!nervousPerformer || Math.random() >= (10 - pStats(nervousPerformer.name).temperament) * 0.06) return; // temp 3 = 42%, temp 7 = 18%
      const nonPerformers = t.members.filter(m => !selected.some(s => s.name === m));
      const talker = nonPerformers.sort((a, b) => pStats(b).social - pStats(a).social)[0];
      if (!talker) return;
      const pr = pronouns(nervousPerformer.name);
      // Buff: +1 temperament for the show (stored on performer object)
      nervousPerformer._tempBuff = (nervousPerformer._tempBuff || 0) + 1;
      addBond(nervousPerformer.name, talker, 0.3);
      backstageEvents.push({
        type: 'pepTalk', players: [talker, nervousPerformer.name],
        text: `${talker} finds ${nervousPerformer.name} backstage, pacing. "Hey. You practiced this. You're ready." ${nervousPerformer.name} takes a breath. ${pr.Sub} needed that.`,
        badge: 'PEP TALK', badgeClass: 'gold',
      });
    });
  }

  // Rivalry Confrontation — cross-tribe bond <= -2 (max 1 per episode)
  let _rivalryFired = false;
  if (backstageEvents.length < maxBackstage) {
    const allPlayers = tribeMembers.flatMap(t => t.members);
    for (let i = 0; i < allPlayers.length && backstageEvents.length < maxBackstage && !_rivalryFired; i++) {
      for (let j = i + 1; j < allPlayers.length; j++) {
        if (_rivalryFired) break;
        const a = allPlayers[i], b = allPlayers[j];
        const aTribe = tribeMembers.find(t => t.members.includes(a))?.name;
        const bTribe = tribeMembers.find(t => t.members.includes(b))?.name;
        if (aTribe === bTribe) continue;
        if (getBond(a, b) > -2) continue; // bond <= -2 required
        if (Math.random() >= 0.25) continue;
        addBond(a, b, -0.4);
        _rivalryFired = true;
        const _rivalryTexts = [
          `${a} and ${b} cross paths backstage. Words are exchanged. It starts quiet and gets loud. Someone has to step between them.`,
          `${a} spots ${b} near the stage. Neither looks away. The tension is thick enough to cut. A tribemate pulls ${a} back before it escalates.`,
          `${b} bumps into ${a} backstage. "Watch it." "Make me." It takes three people to keep them apart.`,
          `${a} makes a comment about ${b}'s audition. ${b} hears it. The conversation that follows isn't about talent.`,
        ];
        backstageEvents.push({
          type: 'rivalryConfrontation', players: [a, b],
          text: _rivalryTexts[Math.floor(Math.random() * _rivalryTexts.length)],
          badge: 'RIVALRY', badgeClass: 'red',
        });
        break;
      }
    }
  }

  // Accident — performer with temperament <= 4 practicing backstage
  if (backstageEvents.length < maxBackstage) {
    tribeMembers.forEach(t => {
      if (backstageEvents.length >= maxBackstage) return;
      const selected = (auditions[t.name] || []).filter(a => a.selected);
      // Proportional: lower temperament = more accident-prone
      const clumsy = selected.slice().sort((a, b) => pStats(a.name).temperament - pStats(b.name).temperament)[0];
      if (!clumsy || Math.random() >= (10 - pStats(clumsy.name).temperament) * 0.04) return; // temp 2 = 32%, temp 6 = 16%
      const pr = pronouns(clumsy.name);
      // Coin flip: self-injury (-2 score) or prop break (substitution)
      if (Math.random() < 0.5) {
        clumsy._scorePenalty = (clumsy._scorePenalty || 0) - 2;
        backstageEvents.push({
          type: 'accidentInjury', players: [clumsy.name],
          text: `${clumsy.name} was practicing backstage and something went wrong. ${pr.Sub} ${pr.sub === 'they' ? 'are' : 'is'} nursing ${pr.posAdj} hand. "I'm fine. I can still go." ${pr.Sub} ${pr.sub === 'they' ? 'aren\'t' : 'isn\'t'} fine.`,
          badge: 'ACCIDENT', badgeClass: 'red',
        });
      } else {
        // Substitution: swap with best non-selected
        const cut = (auditions[t.name] || []).filter(a => !a.selected);
        const sub = cut[0]; // best cut player
        if (sub) {
          clumsy.selected = false;
          sub.selected = true;
          backstageEvents.push({
            type: 'accidentSubstitution', players: [clumsy.name, sub.name],
            text: `${clumsy.name} broke something backstage — ${pr.posAdj} props are ruined. ${sub.name} gets the call. "You're in." The Harold moment.`,
            badge: 'SUBSTITUTION', badgeClass: 'gold',
          });
        }
      }
    });
  }

  // Secret Rehearsal — cut player with boldness >= 6, practicing alone
  if (backstageEvents.length < maxBackstage) {
    tribeMembers.forEach(t => {
      if (backstageEvents.length >= maxBackstage) return;
      const cut = (auditions[t.name] || []).filter(a => !a.selected);
      // Proportional: higher boldness = more likely to keep practicing after being cut
      const bold = cut.slice().sort((a, b) => pStats(b.name).boldness - pStats(a.name).boldness)[0];
      if (!bold || Math.random() >= pStats(bold.name).boldness * 0.04) return; // boldness 8 = 32%, boldness 5 = 20%
      // 40% chance of being subbed in
      if (Math.random() < 0.40) {
        const selected = (auditions[t.name] || []).filter(a => a.selected);
        const weakest = selected[selected.length - 1]; // lowest scorer
        if (weakest) {
          weakest.selected = false;
          bold.selected = true;
          const pr = pronouns(bold.name);
          backstageEvents.push({
            type: 'secretRehearsalSubIn', players: [bold.name, weakest.name],
            text: `Someone spots ${bold.name} practicing alone behind the cabins. Word gets back to the captain. "${bold.name} looks good." A last-minute swap. ${weakest.name} is out. ${bold.name} is in.`,
            badge: 'SECRET REHEARSAL', badgeClass: 'gold',
          });
        }
      } else {
        // Even without a sub-in, the practice pays off — score buff if they perform later
        bold._tempBuff = (bold._tempBuff || 0) + 1.5;
        backstageEvents.push({
          type: 'secretRehearsalAlone', players: [bold.name],
          text: `${bold.name} didn't make the cut, but ${pronouns(bold.name).sub} ${pronouns(bold.name).sub === 'they' ? 'haven\'t' : 'hasn\'t'} stopped practicing. Alone. Behind the cabins. The extra reps won't go to waste.`,
          badge: 'SECRET REHEARSAL', badgeClass: 'gold',
        });
      }
    });
  }

  // Stage Fright — performer panicking, considering dropping out
  if (backstageEvents.length < maxBackstage) {
    tribeMembers.forEach(t => {
      if (backstageEvents.length >= maxBackstage) return;
      const selected = (auditions[t.name] || []).filter(a => a.selected);
      // Proportional: low boldness + low temperament = stage fright. Higher stats = less fear.
      const scared = selected.slice().sort((a, b) => {
        const aS = pStats(a.name), bS = pStats(b.name);
        return (aS.boldness + aS.temperament) - (bS.boldness + bS.temperament);
      })[0];
      const _fearScore = scared ? ((10 - pStats(scared.name).boldness) * 0.02 + (10 - pStats(scared.name).temperament) * 0.02) : 0;
      if (!scared || Math.random() >= _fearScore) return; // boldness 3+temp 3 = 28%, boldness 7+temp 7 = 12%
      const pr = pronouns(scared.name);
      const _texts = [
        `${scared.name} is pacing behind the stage. "I can't do this. I can't go out there." ${pr.PosAdj} hands are shaking.`,
        `${scared.name} is sitting alone, head in ${pr.posAdj} hands. "What if I freeze?" The doubt is eating ${pr.obj} alive.`,
        `${scared.name} tried to leave twice. Both times someone brought ${pr.obj} back. The show starts in five minutes.`,
      ];
      backstageEvents.push({
        type: 'stageFright', players: [scared.name],
        text: _texts[Math.floor(Math.random() * _texts.length)],
        badge: 'STAGE FRIGHT', badgeClass: 'red',
      });
      scared._tempDebuff = (scared._tempDebuff || 0) + 1; // nerves make disaster more likely
    });
  }

  // Trash Talk — bold player taunts a performer from another tribe
  if (backstageEvents.length < maxBackstage) {
    tribeMembers.forEach(t => {
      if (backstageEvents.length >= maxBackstage) return;
      // Proportional: boldness drives trash talk. Block nice archetypes.
      const _niceArchs = ['hero', 'loyal', 'loyal-soldier', 'protector', 'social-butterfly', 'showmancer'];
      const trashCandidates = t.members.filter(m => !_niceArchs.includes(players.find(p => p.name === m)?.archetype || ''));
      const trashTalker = trashCandidates.sort((a, b) => pStats(b).boldness - pStats(a).boldness)[0];
      if (!trashTalker || Math.random() >= pStats(trashTalker).boldness * 0.035) return; // boldness 8 = 28%, boldness 5 = 17%
      const otherTribes = tribeMembers.filter(ot => ot.name !== t.name);
      const targetTribe = otherTribes[Math.floor(Math.random() * otherTribes.length)];
      const targetPerformer = (auditions[targetTribe.name] || []).filter(a => a.selected)[0];
      if (!targetPerformer) return;
      const _texts = [
        `${trashTalker} corners ${targetPerformer.name} near the stage. "You know you're going to choke, right? Everyone knows." ${targetPerformer.name} says nothing.`,
        `${trashTalker} walks past ${targetPerformer.name} and mutters: "Save yourself the embarrassment." Loud enough for everyone to hear.`,
        `${trashTalker} watches ${targetPerformer.name} warm up and laughs. "That's your act? Seriously?" The confidence drain is visible.`,
      ];
      addBond(targetPerformer.name, trashTalker, -0.3);
      backstageEvents.push({
        type: 'trashTalk', players: [trashTalker, targetPerformer.name],
        text: _texts[Math.floor(Math.random() * _texts.length)],
        badge: 'TRASH TALK', badgeClass: 'red',
      });
    });
  }

  // Alliance Huddle — alliance members strategize about who should perform
  if (backstageEvents.length < maxBackstage) {
    const activeAlliances = (gs.namedAlliances || []).filter(a => a.active && a.members.length >= 3);
    if (activeAlliances.length && Math.random() < 0.30) {
      const alliance = activeAlliances[Math.floor(Math.random() * activeAlliances.length)];
      const huddle = alliance.members.filter(m => gs.activePlayers.includes(m)).slice(0, 3);
      if (huddle.length >= 2) {
        backstageEvents.push({
          type: 'allianceHuddle', players: huddle,
          text: `${huddle.join(' and ')} pull each other aside. Quick whispers. They're not just thinking about the show — they're thinking about what comes after. If they lose, who goes home?`,
          badge: 'ALLIANCE HUDDLE', badgeClass: 'gold',
        });
        // Small bond reinforcement
        for (let i = 0; i < huddle.length; i++) {
          for (let j = i + 1; j < huddle.length; j++) {
            addBond(huddle[i], huddle[j], 0.3);
          }
        }
      }
    }
  }

  // Pre-Show Jitters — general mood event (always available as filler)
  if (backstageEvents.length < maxBackstage && backstageEvents.length < 3) {
    const randomPerformer = Object.values(auditions).flatMap(a => a.filter(r => r.selected))[Math.floor(Math.random() * 6)] || Object.values(auditions).flatMap(a => a.filter(r => r.selected))[0];
    if (randomPerformer) {
      const pr = pronouns(randomPerformer.name);
      const _texts = [
        `The stage is set. The curtain's about to go up. ${randomPerformer.name} takes one last look at ${pr.posAdj} hands. Still shaking. Good.`,
        `Someone peeks through the curtain. "Chef looks angry." "Chef always looks angry." "No, like... MORE angry." The performers exchange glances.`,
        `The camp is buzzing. Everyone's picking their seats. The performers backstage can hear the noise building. This is real now.`,
        `${randomPerformer.name} rehearses ${pr.posAdj} opening one more time. Mumbles it under ${pr.posAdj} breath. Adjusts ${pr.posAdj} stance. Nods. Ready. Maybe.`,
      ];
      backstageEvents.push({
        type: 'preShowJitters', players: [randomPerformer.name],
        text: _texts[Math.floor(Math.random() * _texts.length)],
        badge: 'PRE-SHOW', badgeClass: 'gold',
      });
    }
  }

  // ── Backstage fallback: guarantee at least 2 events ──
  if (backstageEvents.length < 3) {
    // Fallback pep talk: find ANY performer + ANY non-performer with decent social
    for (const t of tribeMembers) {
      if (backstageEvents.length >= 2) break;
      const selected = (auditions[t.name] || []).filter(a => a.selected);
      const nonPerformers = t.members.filter(m => !selected.some(s => s.name === m));
      const talker = nonPerformers.find(m => pStats(m).social >= 4);
      const performer = selected[0];
      if (talker && performer && !backstageEvents.some(e => e.type === 'pepTalk' && e.players.includes(talker))) {
        const pr = pronouns(performer.name);
        const _pepTexts = [
          `${talker} finds ${performer.name} backstage. "You've got this." ${performer.name} nods. Simple words, but they land.`,
          `${talker} catches ${performer.name} staring at the stage. "Nervous?" "Terrified." "Good. Means you care." ${performer.name} half-smiles.`,
          `${talker} sits next to ${performer.name}. Doesn't say anything for a while. Then: "I'd pick you every time." ${performer.name} takes a breath.`,
        ];
        backstageEvents.push({
          type: 'pepTalk', players: [talker, performer.name],
          text: _pepTexts[Math.floor(Math.random() * _pepTexts.length)],
          badge: 'PEP TALK', badgeClass: 'gold',
        });
        addBond(performer.name, talker, 0.3);
      }
    }
  }

  // ── Apply spy intel to sabotage targeting ──
  if (sabotage && ep._spyIntel?.[sabotage.saboteur]) {
    const spiedTarget = ep._spyIntel[sabotage.saboteur];
    // Override sabotage target if the spied player is a selected performer
    const allSelected = Object.values(auditions).flatMap(a => a.filter(r => r.selected));
    if (allSelected.some(s => s.name === spiedTarget)) {
      sabotage.target = spiedTarget;
      sabotage.spyAssisted = true;
    }
  }

  // ── The Show: perform acts (interleaved) ──
  const performances = [];
  const maxActs = Math.max(...Object.values(auditions).map(a => a.filter(r => r.selected).length));
  for (let actIdx = 0; actIdx < maxActs; actIdx++) {
    tribeMembers.forEach(t => {
      const selected = (auditions[t.name] || []).filter(r => r.selected);
      if (actIdx >= selected.length) return;
      const performer = selected[actIdx];
      const name = performer.name;
      const pr = pronouns(name);
      const s = pStats(name);

      let rawScore = showScore(name, performer);
      let outcome = 'normal';

      // Backstage modifiers
      if (performer._tempBuff) rawScore += performer._tempBuff * 0.3; // pep talk temperament buff
      if (performer._scorePenalty) rawScore += performer._scorePenalty; // accident penalty

      // Sabotage effects (type-specific)
      const isSabotaged = sabotage?.target === name;
      const sabType = isSabotaged ? SABOTAGE_TYPES.find(st => st.id === sabotage.type) : null;
      if (isSabotaged && sabType) {
        if (sabType.effect === 'disaster') {
          // Props sabotage: force disaster outcome (use disaster text)
          rawScore = 1 + Math.random();
          outcome = 'disaster';
        } else if (sabType.effect === 'penalty') {
          // Rumors: score penalty, crowd hostile
          rawScore += sabType.penalty || -2;
          outcome = 'sabotaged';
        } else if (sabType.effect === 'tempDebuff') {
          // Psych warfare: temperament drop → increased disaster chance (don't force it)
          outcome = 'sabotaged'; // mark as sabotaged for VP
        }
        // 'selfScore0' (replace) is handled separately — affects the saboteur's own act, not the target's
      }

      // Check if saboteur replaced their own act (type 'replace') — applies to saboteur, not target
      const isSaboteurReplacingAct = sabotage?.saboteur === name && sabotage?.type === 'replace';
      if (isSaboteurReplacingAct) {
        rawScore = 0; // saboteur scores 0 — didn't perform a talent
        outcome = 'saboteurReplace';
        const _sabTarget = sabotage.target;

        // ── SOCIAL DESTRUCTION: the real payoff ──
        // Target's OWN tribe takes bond damage — the diary/secrets are about THEM
        // (crushes, complaints, real opinions — now public)
        const _sabTargetTribe = tribeMembers.find(tm => tm.members.includes(_sabTarget));
        if (_sabTargetTribe) {
          _sabTargetTribe.members.filter(m => m !== _sabTarget).forEach(m => {
            addBond(m, _sabTarget, -0.5); // hurt — the diary said things about them
          });
        }
        // Only close friends rally — people with existing bond >= 2 comfort the target
        gs.activePlayers.forEach(m => {
          if (m === name || m === _sabTarget) return;
          const bond = getBond(m, _sabTarget);
          if (bond >= 2) addBond(m, _sabTarget, 0.5); // close friend rallies
          if (bond <= -1) addBond(m, name, 0.2); // people who disliked the victim warm to the saboteur
        });
        // Target: sympathy boost (victim edit). Saboteur: popularity tanks (villain edit).
        if (!gs.popularity) gs.popularity = {};
        gs.popularity[_sabTarget] = (gs.popularity[_sabTarget] || 0) + 3; // sympathy underdog
        gs.popularity[name] = (gs.popularity[name] || 0) - 4; // saboteur villain edit
        // Target: temperament debuff for their performance
        const targetPerformer = Object.values(auditions).flatMap(a => a).find(a => a.name === _sabTarget && a.selected);
        if (targetPerformer) targetPerformer._tempDebuff = (targetPerformer._tempDebuff || 0) + 3;

        // ── SABOTEUR CONSEQUENCES ──
        // +bigMoves credit (this IS a big move, even if evil)
        const _sabState = gs.playerStates?.[name] || {};
        _sabState.bigMoves = (_sabState.bigMoves || 0) + 1;
        if (!gs.playerStates) gs.playerStates = {};
        gs.playerStates[name] = _sabState;
        if (!gs.bigMoveEarnersThisEp) gs.bigMoveEarnersThisEp = [];
        if (!gs.bigMoveEarnersThisEp.includes(name)) gs.bigMoveEarnersThisEp.push(name);
        // Heat: massive target on their back
        if (!gs._talentShowHeat) gs._talentShowHeat = {};
        gs._talentShowHeat[name] = { amount: 2.0, expiresEp: ((gs.episode || 0) + 1) + 2 };
        // Saboteur's own tribe: mixed reactions
        const _sabOwnTribe = tribeMembers.find(tm => tm.members.includes(name));
        if (_sabOwnTribe) {
          _sabOwnTribe.members.filter(m => m !== name).forEach(m => {
            const mArch = players.find(p => p.name === m)?.archetype || '';
            if (['villain', 'schemer', 'mastermind'].includes(mArch)) {
              addBond(m, name, 0.2); // respect the play
            } else {
              addBond(m, name, -0.3); // that was cruel
            }
          });
        }
        // Cross-tribe: everyone hates the saboteur
        gs.activePlayers.filter(p => p !== name && !(_sabOwnTribe?.members.includes(p))).forEach(p => {
          addBond(p, name, -0.5);
        });
      }

      // Disaster check (fires normally, but psych sabotage increases chance via temp debuff)
      if (outcome === 'normal' || outcome === 'sabotaged') {
        const tempMod = (performer._tempDebuff || 0);
        const effectiveTemp = Math.max(0, s.temperament - tempMod);
        const disasterChance = (10 - effectiveTemp) * 0.03;
        if (outcome !== 'disaster' && Math.random() < disasterChance) {
          rawScore = 1 + Math.random();
          outcome = 'disaster';
        }
      }

      // Clutch check: only for lowest audition scorer of the selected 3
      const lowestAuditioner = selected[selected.length - 1]?.name;
      if (outcome === 'normal' && name === lowestAuditioner) {
        const clutchChance = s.boldness * 0.02;
        if (Math.random() < clutchChance) {
          rawScore = 8 + Math.random();
          outcome = 'clutch';
        }
      }

      const chef = chefScore(rawScore);
      const _preBeats = outcome === 'disaster' ? performer.disasterText
        : outcome === 'clutch' ? performer.clutchText
        : performer.performanceText; // array of [setup, act, landing]
      // Replace the landing beat (3rd) with a score-reactive line — pre-rendered text
      // assumes success but the actual Chef score may be low
      const _scoreLandings = chef >= 8
        ? [`${name} finishes. The camp erupts. Chef's spoon shoots to ${chef}. That was special.`]
        : chef >= 6
        ? [`${name} finishes to solid applause. Chef gives a ${chef}. Respectable — the tribe will take it.`]
        : chef >= 4
        ? [`${name} finishes. Polite clapping. Chef marks a ${chef}. Not what the tribe was hoping for.`]
        : chef >= 2
        ? [`${name} finishes to near-silence. Chef's spoon barely moves. A ${chef}. That hurt.`]
        : [`${name} finishes — if you can call it that. Chef marks a ${chef}. Nobody makes eye contact.`];
      const performanceBeats = Array.isArray(_preBeats) && _preBeats.length >= 2
        ? [_preBeats[0], _preBeats[1], _scoreLandings[0]]
        : _preBeats;

      // Audience reactions (2-3 from same tribe)
      const reactors = t.members.filter(m => m !== name).slice(0, 3);
      const scoreLevel = chef >= 7 ? 'high' : chef <= 3 ? 'low' : 'mid';
      const reactions = reactors.map(r => {
        const rArch = players.find(p => p.name === r)?.archetype || '_default';
        const pool = isSabotaged ? AUDIENCE_REACTIONS.sabotage : AUDIENCE_REACTIONS[scoreLevel];
        const fn = pool[rArch] || pool._default;
        return { name: r, text: fn(r) };
      });

      performances.push({
        name, tribe: t.name, talent: performer.talentName, talentId: performer.talentId,
        category: performer.category,
        auditionScore: performer.auditionScore,
        showScore: rawScore, chefScore: chef, outcome,
        performanceBeats: outcome === 'saboteurReplace'
          ? [`${name} was supposed to perform ${performer.talentName}. Instead, ${pronouns(name).sub} ${pronouns(name).sub === 'they' ? 'walk' : 'walks'} to the mic with something else in mind.`,
             sabotage.stageText,
             `Chef marks a 0. No talent was performed. But the damage is done.`]
          : performanceBeats,
        // Sabotage card: on TARGET's act (including replace type). Never on saboteur's own act.
        sabotageText: isSabotaged ? sabotage.text : null,
        sabotageStageText: isSabotaged ? (sabotage.type === 'replace'
          ? `${sabotage.saboteur} used ${pronouns(sabotage.saboteur).posAdj} stage time to publicly attack ${name}. The fallout is still landing.`
          : sabotage.stageText) : null,
        sabotageType: isSabotaged ? sabotage.type : (isSaboteurReplacingAct ? 'saboteurReplace' : null),
        reactions,
      });
    });
  }

  // ── Determine winner/loser ──
  const tribeScores = {};
  tribeMembers.forEach(t => { tribeScores[t.name] = 0; });
  performances.forEach(p => { tribeScores[p.tribe] += p.chefScore; });

  const sortedTribes = Object.entries(tribeScores).sort(([,a], [,b]) => b - a);
  const winnerName = sortedTribes[0][0];
  const loserName = sortedTribes[sortedTribes.length - 1][0];
  const winner = gs.tribes.find(t => t.name === winnerName);
  const loser = gs.tribes.find(t => t.name === loserName);

  // ── chalMemberScores: only performers ──
  const playerScores = {};
  performances.forEach(p => { playerScores[p.name] = p.showScore; });

  // ── Set ep fields ──
  ep.winner = winner;
  ep.loser = loser;
  ep.challengeType = 'tribe';
  ep.tribalPlayers = [...loser.members];
  ep.challengeLabel = 'Talent Show';
  ep.challengeCategory = 'social';
  ep.challengeDesc = 'Camp talent show. Each tribe auditions, captain picks 3 acts. Chef scores 0-9.';
  ep.chalMemberScores = playerScores;
  ep.chalSitOuts = {};
  updateChalRecord(ep);

  // ── Camp events (2 per tribe) ──
  if (!ep.campEvents) ep.campEvents = {};
  tribeMembers.forEach(t => {
    const key = t.name;
    if (!ep.campEvents[key]) ep.campEvents[key] = { pre: [], post: [] };
    if (!ep.campEvents[key].post) ep.campEvents[key].post = [];

    const tribePerfs = performances.filter(p => p.tribe === t.name);
    const tribeAuditions = auditions[t.name] || [];

    // ── POSITIVE ──
    // Unlikely Hero: lowest auditioner who clutched
    const clutchPerf = tribePerfs.find(p => p.outcome === 'clutch');
    // Standing Ovation: highest chef score
    const bestPerf = tribePerfs.slice().sort((a, b) => b.chefScore - a.chefScore)[0];
    // Team Support: highest social non-performer
    const nonPerformers = t.members.filter(m => !tribePerfs.some(p => p.name === m));
    const supporter = nonPerformers.sort((a, b) => pStats(b).social - pStats(a).social)[0];

    if (clutchPerf) {
      const pr = pronouns(clutchPerf.name);
      ep.campEvents[key].post.push({
        type: 'talentShowUnlikelyHero', players: [clutchPerf.name],
        text: `Nobody expected ${clutchPerf.name} to steal the show. ${pr.Sub} almost didn't make the cut. Then ${pr.sub} walked on stage and changed everything.`,
        consequences: '+0.4 bond from tribemates, +2 popularity.',
        badgeText: 'UNLIKELY HERO', badgeClass: 'gold'
      });
      t.members.filter(m => m !== clutchPerf.name).forEach(m => addBond(m, clutchPerf.name, 0.4));
      if (!gs.popularity) gs.popularity = {};
      gs.popularity[clutchPerf.name] = (gs.popularity[clutchPerf.name] || 0) + 2; // underdog clutch = fan favourite moment
    } else if (bestPerf && bestPerf.chefScore >= 7) {
      const pr = pronouns(bestPerf.name);
      ep.campEvents[key].post.push({
        type: 'talentShowStandingOvation', players: [bestPerf.name],
        text: `${bestPerf.name} brought the house down. Chef gave ${pr.obj} a ${bestPerf.chefScore}. The tribe carried ${pr.obj} off the stage.`,
        consequences: '+0.5 bond from tribemates, +2 popularity.',
        badgeText: 'STANDING OVATION', badgeClass: 'gold'
      });
      t.members.filter(m => m !== bestPerf.name).forEach(m => addBond(m, bestPerf.name, 0.5));
      if (!gs.popularity) gs.popularity = {};
      gs.popularity[bestPerf.name] = (gs.popularity[bestPerf.name] || 0) + 2;
    } else if (supporter) {
      const pr = pronouns(supporter);
      ep.campEvents[key].post.push({
        type: 'talentShowTeamSupport', players: [supporter, ...(tribePerfs[0] ? [tribePerfs[0].name] : [])],
        text: `${supporter} didn't perform, but ${pr.sub} ${pr.sub === 'they' ? 'were' : 'was'} the loudest voice in the crowd. Every cheer, every clap — the performers felt it.`,
        consequences: '+0.3 bond with performers.',
        badgeText: 'TEAM SUPPORT', badgeClass: 'gold'
      });
      tribePerfs.forEach(p => addBond(p.name, supporter, 0.3));
    }

    // ── NEGATIVE ──
    const sabotaged = sabotage && sabotage.saboteurTribe !== t.name && tribePerfs.some(p => p.outcome === 'sabotaged');
    const disasterPerf = tribePerfs.find(p => p.outcome === 'disaster');
    const bitterReject = tribeAuditions.find((a, idx) => !a.selected && idx < 4); // close to cutoff

    if (sabotaged && sabotage) {
      const pr = pronouns(sabotage.saboteur);
      ep.campEvents[key].post.push({
        type: 'talentShowSabotageFallout', players: [sabotage.target, sabotage.saboteur],
        text: `What ${sabotage.saboteur} did to ${sabotage.target} won't be forgotten. The tribe is furious.`,
        consequences: '-0.5 bond with saboteur, +1.5 heat.',
        badgeText: 'SABOTAGE', badgeClass: 'red'
      });
      t.members.forEach(m => addBond(m, sabotage.saboteur, -0.5));
      if (!gs._talentShowHeat) gs._talentShowHeat = {};
      gs._talentShowHeat[sabotage.saboteur] = { amount: 1.5, expiresEp: ((gs.episode || 0) + 1) + 2 };
    } else if (disasterPerf) {
      const pr = pronouns(disasterPerf.name);
      ep.campEvents[key].post.push({
        type: 'talentShowDisaster', players: [disasterPerf.name],
        text: `${disasterPerf.name} choked on stage. Chef gave ${pr.obj} a ${disasterPerf.chefScore}. The tribe tries not to talk about it. They fail.`,
        consequences: '-0.3 bond from tribemates, +0.5 heat, -1 popularity.',
        badgeText: 'STAGE DISASTER', badgeClass: 'red'
      });
      t.members.filter(m => m !== disasterPerf.name).forEach(m => addBond(m, disasterPerf.name, -0.3));
      if (!gs._talentShowHeat) gs._talentShowHeat = {};
      gs._talentShowHeat[disasterPerf.name] = { amount: 0.5, expiresEp: ((gs.episode || 0) + 1) + 1 };
      if (!gs.popularity) gs.popularity = {};
      gs.popularity[disasterPerf.name] = (gs.popularity[disasterPerf.name] || 0) - 1; // stage disaster = cringe edit
    } else if (bitterReject) {
      const captain = captains[t.name];
      const pr = pronouns(bitterReject.name);
      ep.campEvents[key].post.push({
        type: 'talentShowBitterReject', players: [bitterReject.name, captain],
        text: `${bitterReject.name} was THIS close to making the cut. ${captain} chose someone else. ${pr.Sub} ${pr.sub === 'they' ? 'haven\'t' : 'hasn\'t'} forgotten.`,
        consequences: '-0.4 bond with captain.',
        badgeText: 'BITTER REJECTION', badgeClass: 'red'
      });
      addBond(bitterReject.name, captain, -0.4);
    }
  });

  // ── Store data ──
  ep.talentShow = {
    auditions, performances, captains, sabotage,
    auditionDrama, backstageEvents,
    tribeScores,
    winner: winnerName, loser: loserName,
    mvp: performances.slice().sort((a, b) => b.showScore - a.showScore)[0]?.name || null,
  };
}

export function _textTalentShow(ep, ln, sec) {
  if (!ep.isTalentShow || !ep.talentShow) return;
  const ts = ep.talentShow;
  sec('TALENT SHOW');
  Object.entries(ts.auditions).forEach(([tribe, results]) => {
    ln(`${tribe} (Captain: ${ts.captains[tribe]})`);
    results.forEach(r => ln(`  ${r.selected ? '+' : '-'} ${r.name} — ${r.talentName || r.talent?.name || '?'} (${r.auditionScore.toFixed(1)})`));
  });
  // Audition drama
  if (ts.auditionDrama) {
    Object.entries(ts.auditionDrama).forEach(([tribe, drama]) => {
      ln(`  ${tribe} DRAMA: [${drama.badge}] ${drama.text}`);
    });
  }
  // Backstage
  if (ts.backstageEvents?.length) {
    ln('');
    ln('BACKSTAGE:');
    ts.backstageEvents.forEach(evt => ln(`  [${evt.badge}] ${evt.text}`));
  }
  if (ts.sabotage) ln(`SABOTAGE: ${ts.sabotage.saboteur} sabotaged ${ts.sabotage.target} (${ts.sabotage.type})`);
  ln('');
  ts.performances.forEach(p => {
    const tag = p.outcome === 'disaster' ? ' [DISASTER]' : p.outcome === 'clutch' ? ' [CLUTCH]' : p.outcome === 'sabotaged' ? ' [SABOTAGED]' : '';
    ln(`${p.tribe} — ${p.name}: ${p.talent} — Chef: ${p.chefScore}/9${tag}`);
    const beats = p.performanceBeats || (typeof p.performanceText === 'string' ? [p.performanceText] : p.performanceText) || [];
    beats.forEach(b => { if (b) ln(`  ${b}`); });
  });
  ln(`Final: ${Object.entries(ts.tribeScores).map(([t, s]) => `${t} ${s}`).join(' — ')}`);
  ln(`Winner: ${ts.winner}. ${ts.loser} goes to tribal.`);
  if (ts.mvp) ln(`MVP: ${ts.mvp}`);
}

export function rpBuildTalentAuditions(ep) {
  const ts = ep.talentShow;
  if (!ts?.auditions) return null;

  const stateKey = `ts_aud_${ep.num}`;
  if (!_tvState[stateKey]) _tvState[stateKey] = { idx: -1 };
  const state = _tvState[stateKey];

  const tribeNames = Object.keys(ts.auditions);
  const totalItems = tribeNames.length;
  const allRevealed = state.idx >= totalItems - 1;

  const _tsReveal = (targetIdx) => `if(!_tvState['${stateKey}'])_tvState['${stateKey}']={idx:-1};_tvState['${stateKey}'].idx=${targetIdx};const ep=gs.episodeHistory.find(e=>e.num===${ep.num});if(ep){const m=document.querySelector('.rp-main');const st=m?m.scrollTop:0;buildVPScreens(ep);renderVPScreen();if(m)m.scrollTop=st;}`;

  let html = `<div class="rp-page tod-dawn">
    <div class="rp-eyebrow">Episode ${ep.num}</div>
    <div style="font-family:var(--font-display);font-size:28px;letter-spacing:2px;text-align:center;color:#8b5cf6;text-shadow:0 0 20px rgba(139,92,246,0.3);margin-bottom:6px">🎭 TALENT SHOW — AUDITIONS</div>
    <div style="text-align:center;font-size:12px;color:#8b949e;margin-bottom:20px">Each tribe auditions. Captain picks the 3 best acts for the show.</div>`;

  tribeNames.forEach((tribeName, tIdx) => {
    const isVisible = tIdx <= state.idx;
    if (!isVisible) {
      html += `<div style="padding:14px;margin-bottom:6px;border:1px solid var(--border);border-radius:8px;opacity:0.12;text-align:center;color:var(--muted)">${tribeName} Auditions</div>`;
      return;
    }

    const tc = tribeColor(tribeName);
    const captain = ts.captains[tribeName];
    const results = ts.auditions[tribeName] || [];

    html += `<div style="margin-bottom:16px;padding:14px;border-radius:10px;border:1px solid ${tc}44;background:${tc}08;animation:scrollDrop 0.3s var(--ease-broadcast) both">`;
    html += `<div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
      <div style="font-family:var(--font-display);font-size:14px;letter-spacing:1px;color:${tc}">${tribeName.toUpperCase()} AUDITIONS</div>`;
    if (captain) {
      html += `<div style="display:flex;align-items:center;gap:4px;margin-left:auto">
        ${rpPortrait(captain, 'xs')}
        <span style="font-size:9px;font-weight:700;letter-spacing:1px;color:#f0a500">CAPTAIN</span>
      </div>`;
    }
    html += `</div>`;

    results.forEach((r, i) => {
      const pr = pronouns(r.name);
      const badgeColor = r.selected ? '#3fb950' : (i === 3 ? '#f0a500' : '#f85149');
      const badgeText = r.selected ? 'SELECTED' : (i === 3 ? 'CLOSE CALL' : 'CUT');
      const opacity = r.selected ? '1' : '0.5';
      html += `<div style="display:flex;align-items:center;gap:10px;padding:8px;margin-bottom:4px;border-radius:6px;background:rgba(255,255,255,0.02);opacity:${opacity}">
        ${rpPortrait(r.name, 'sm')}
        <div style="flex:1;min-width:0">
          <div style="font-size:12px;font-weight:600;color:#e6edf3">${r.name}</div>
          <div style="font-size:10px;color:#8b949e">${r.talentName || r.talent?.name || '?'}</div>
          <div style="font-size:10px;color:#6e7681;font-style:italic;margin-top:2px">${r.auditionText || ''}</div>
        </div>
        <div style="text-align:right">
          <span style="font-size:9px;font-weight:700;letter-spacing:1px;color:${badgeColor};background:${badgeColor}18;padding:2px 6px;border-radius:3px">${badgeText}</span>
          <div style="font-size:10px;color:#8b949e;margin-top:2px">${r.auditionScore.toFixed(1)}</div>
        </div>
      </div>`;
    });

    // Audition drama card (if one fired for this tribe)
    const drama = ts.auditionDrama?.[tribeName];
    if (drama) {
      const dColor = drama.badgeClass === 'gold' ? '#f0a500' : '#f85149';
      html += `<div style="margin-top:10px;padding:10px;border-radius:8px;
        border-left:3px solid ${dColor};background:${dColor}08;
        animation:scrollDrop 0.3s var(--ease-broadcast) both">
        <span style="font-size:9px;font-weight:700;letter-spacing:1px;color:${dColor}">${drama.badge}</span>
        <div style="display:flex;gap:6px;margin:6px 0">
          ${(drama.players || []).map(p => rpPortrait(p, 'xs')).join('')}
        </div>
        <div style="font-size:11px;color:#cdd9e5;font-style:italic;line-height:1.5">${drama.text}</div>
      </div>`;
    }

    html += `</div>`;
  });

  if (!allRevealed) {
    html += `<div style="position:sticky;bottom:0;padding:12px 0;text-align:center;background:linear-gradient(transparent,var(--bg-primary) 30%)">
      <button class="rp-btn" onclick="${_tsReveal(state.idx + 1)}">NEXT (${state.idx + 2}/${totalItems})</button>
      <button class="rp-btn rp-btn-secondary" onclick="${_tsReveal(totalItems - 1)}" style="margin-left:8px">REVEAL ALL</button>
    </div>`;
  }

  html += `</div>`;
  return html;
}

export function rpBuildTalentBackstage(ep) {
  const ts = ep.talentShow;
  const events = ts?.backstageEvents;
  if (!events?.length) return null;

  const stateKey = `ts_back_${ep.num}`;
  if (!_tvState[stateKey]) _tvState[stateKey] = { idx: -1 };
  const state = _tvState[stateKey];
  const allRevealed = state.idx >= events.length - 1;

  const _bsReveal = (targetIdx) => `if(!_tvState['${stateKey}'])_tvState['${stateKey}']={idx:-1};_tvState['${stateKey}'].idx=${targetIdx};const ep=gs.episodeHistory.find(e=>e.num===${ep.num});if(ep){const m=document.querySelector('.rp-main');const st=m?m.scrollTop:0;buildVPScreens(ep);renderVPScreen();if(m)m.scrollTop=st;}`;

  let html = `<div class="rp-page tod-dusk" style="background:linear-gradient(180deg,rgba(25,18,35,1) 0%,rgba(15,12,20,1) 100%)">
    <div class="rp-eyebrow">Episode ${ep.num}</div>
    <div style="font-family:var(--font-display);font-size:24px;letter-spacing:2px;text-align:center;
      color:#8b5cf6;text-shadow:0 0 20px rgba(139,92,246,0.3);margin-bottom:4px">BACKSTAGE</div>
    <div style="text-align:center;font-size:11px;color:#6e7681;margin-bottom:20px;letter-spacing:1px">
      Between auditions and the show, things happen in the shadows.</div>`;

  events.forEach((evt, i) => {
    const isVisible = i <= state.idx;
    if (!isVisible) {
      html += `<div style="padding:12px;margin-bottom:6px;border:1px solid var(--border);border-radius:8px;
        opacity:0.1;text-align:center;color:var(--muted);font-style:italic">Something is happening backstage...</div>`;
      return;
    }
    const bColor = evt.badgeClass === 'gold' ? '#f0a500' : evt.badgeClass === 'red' ? '#f85149' : '#8b5cf6';
    html += `<div style="padding:14px;margin-bottom:8px;border-radius:10px;
      border-left:3px solid ${bColor};
      background:linear-gradient(135deg,${bColor}08 0%,transparent 60%);
      animation:scrollDrop 0.3s var(--ease-broadcast) both">
      <span style="font-size:9px;font-weight:700;letter-spacing:1px;color:${bColor}">${evt.badge}</span>
      <div style="display:flex;gap:8px;margin:8px 0">
        ${(evt.players || []).map(p => rpPortrait(p, 'sm')).join('')}
      </div>
      <div style="font-size:12px;color:#cdd9e5;line-height:1.6;font-style:italic">${evt.text}</div>
    </div>`;
  });

  if (!allRevealed) {
    html += `<div style="position:sticky;bottom:0;padding:12px 0;text-align:center;
      background:linear-gradient(transparent,rgba(15,12,20,1) 30%)">
      <button class="rp-btn" onclick="${_bsReveal(state.idx + 1)}">NEXT (${state.idx + 2}/${events.length})</button>
      <button class="rp-btn rp-btn-secondary" onclick="${_bsReveal(events.length - 1)}" style="margin-left:8px">REVEAL ALL</button>
    </div>`;
  }

  html += `</div>`;
  return html;
}

export function rpBuildTalentShowStage(ep) {
  const ts = ep.talentShow;
  if (!ts?.performances?.length) return null;

  const stateKey = `ts_show_${ep.num}`;
  if (!_tvState[stateKey]) _tvState[stateKey] = { idx: -1 };
  const state = _tvState[stateKey];

  const totalItems = ts.performances.length;
  const allRevealed = state.idx >= totalItems - 1;

  const _tsReveal = (targetIdx) => `if(!_tvState['${stateKey}'])_tvState['${stateKey}']={idx:-1};_tvState['${stateKey}'].idx=${targetIdx};const ep=gs.episodeHistory.find(e=>e.num===${ep.num});if(ep){const m=document.querySelector('.rp-main');const st=m?m.scrollTop:0;buildVPScreens(ep);renderVPScreen();if(m)m.scrollTop=st;}`;

  // Live scoreboard
  const revealedScores = {};
  Object.keys(ts.tribeScores).forEach(t => { revealedScores[t] = 0; });
  ts.performances.forEach((p, i) => { if (i <= state.idx) revealedScores[p.tribe] += p.chefScore; });

  // ═══ STAGE AMBIENCE ═══
  // Deep dark stage with red velvet curtain drapes at top, wood floor at bottom, spotlight cone
  let html = `<div class="rp-page" style="
    background:
      linear-gradient(180deg, #2a0a0a 0%, #1a0505 4%, #0d0915 12%, #08060f 30%, #0a0710 70%, #1a1008 92%, #2a1a0c 100%);
    position:relative;overflow:hidden;
  ">`;

  // Curtain drapes (CSS pseudo-elements via inline divs)
  html += `<div style="position:absolute;top:0;left:0;right:0;height:60px;pointer-events:none;
    background:linear-gradient(180deg,
      #5c1515 0%, #4a1010 30%, #3a0a0a 60%, transparent 100%);
    mask-image:linear-gradient(180deg, black 0%, black 50%, transparent 100%);
    -webkit-mask-image:linear-gradient(180deg, black 0%, black 50%, transparent 100%);
  "></div>`;
  // Left curtain fold
  html += `<div style="position:absolute;top:0;left:0;width:30px;height:200px;pointer-events:none;
    background:linear-gradient(90deg, #6b1a1a 0%, #4a1010 40%, transparent 100%);
    opacity:0.6;
  "></div>`;
  // Right curtain fold
  html += `<div style="position:absolute;top:0;right:0;width:30px;height:200px;pointer-events:none;
    background:linear-gradient(-90deg, #6b1a1a 0%, #4a1010 40%, transparent 100%);
    opacity:0.6;
  "></div>`;
  // Stage floor (wood planks at bottom)
  html += `<div style="position:absolute;bottom:0;left:0;right:0;height:40px;pointer-events:none;
    background:linear-gradient(0deg, #3d2b1a 0%, #2a1c10 60%, transparent 100%);
    opacity:0.5;
  "></div>`;

  // Header
  html += `<div style="position:relative;z-index:1">
    <div class="rp-eyebrow" style="color:#8b6040">Episode ${ep.num}</div>
    <div style="font-family:var(--font-display);font-size:30px;letter-spacing:4px;text-align:center;
      color:#f0a500;text-shadow:0 0 40px rgba(240,165,0,0.5),0 0 80px rgba(240,165,0,0.2);
      margin-bottom:4px">THE TALENT SHOW</div>
    <div style="text-align:center;font-size:11px;color:#8b7060;margin-bottom:16px;letter-spacing:1px">
      CHEF SCORES EACH ACT 0–9 &nbsp;·&nbsp; HIGHEST TOTAL WINS IMMUNITY</div>`;

  // ═══ SCOREBOARD (gilded frame look) ═══
  html += `<div style="display:flex;justify-content:center;gap:20px;margin:0 auto 20px;padding:12px 20px;
    border-radius:8px;border:1px solid rgba(240,165,0,0.15);
    background:linear-gradient(135deg,rgba(240,165,0,0.04) 0%,rgba(0,0,0,0.3) 100%);
    box-shadow:inset 0 1px 0 rgba(240,165,0,0.1),0 4px 20px rgba(0,0,0,0.4)">`;
  Object.entries(revealedScores).forEach(([tribe, score], i, arr) => {
    const tc = tribeColor(tribe);
    const isWinner = allRevealed && tribe === ts.winner;
    html += `<div style="text-align:center;${isWinner ? 'text-shadow:0 0 15px ' + tc + ',0 0 30px ' + tc : ''}">
      <div style="font-family:var(--font-display);font-size:${isWinner ? '32' : '24'}px;color:${tc};font-weight:700;
        ${isWinner ? 'animation:scrollDrop 0.4s var(--ease-broadcast) both' : ''}">${score}</div>
      <div style="font-size:9px;color:${tc};opacity:0.7;letter-spacing:1px;text-transform:uppercase">${tribe}</div>
    </div>`;
    if (i < arr.length - 1) html += `<div style="font-size:18px;color:#3d2b1a;align-self:center">·</div>`;
  });
  html += `</div>`;

  // ═══ PER-ACT CARDS ═══
  ts.performances.forEach((perf, i) => {
    const isVisible = i <= state.idx;
    if (!isVisible) {
      // Dimmed placeholder — like an unlit stage
      html += `<div style="padding:20px;margin-bottom:8px;border-radius:10px;
        background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.04);
        text-align:center;color:#3d2b1a;font-size:12px;font-style:italic;
        letter-spacing:1px">Act ${i + 1} — waiting in the wings...</div>`;
      return;
    }

    const tc = tribeColor(perf.tribe);
    const isDisaster = perf.outcome === 'disaster';
    const isClutch = perf.outcome === 'clutch';
    const isSabotaged = perf.outcome === 'sabotaged' || !!perf.sabotageText || !!perf.sabotageType;
    const spotlightColor = isDisaster ? '#f85149' : isClutch ? '#f0a500' : isSabotaged ? '#da3633' : tc;

    // Act card with spotlight cone
    html += `<div style="position:relative;margin-bottom:12px;padding:20px;border-radius:12px;
      background:radial-gradient(ellipse 70% 120% at 50% -10%, ${spotlightColor}18 0%, transparent 70%),
        linear-gradient(180deg,rgba(0,0,0,0.2) 0%,rgba(0,0,0,0.4) 100%);
      border:1px solid ${spotlightColor}22;
      box-shadow:0 0 40px ${spotlightColor}08,inset 0 1px 0 rgba(255,255,255,0.03);
      animation:scrollDrop 0.4s var(--ease-broadcast) both">`;

    // Sabotage pre-card
    if (isSabotaged && (perf.sabotageText || perf.sabotageStageText)) {
      const _sabText = perf.sabotageStageText || perf.sabotageText;
      const _saboteur = ts.sabotage?.saboteur;
      html += `<div style="padding:12px;margin-bottom:14px;border-radius:8px;
        background:linear-gradient(135deg,rgba(218,54,51,0.12) 0%,rgba(218,54,51,0.04) 100%);
        border:1px solid rgba(218,54,51,0.25);
        box-shadow:0 0 20px rgba(218,54,51,0.08)">
        <div style="font-size:10px;font-weight:800;letter-spacing:2px;color:#da3633;margin-bottom:8px">🗡️ SABOTAGED BY ${(_saboteur || 'UNKNOWN').toUpperCase()}</div>
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
          ${_saboteur ? rpPortrait(_saboteur, 'sm') : ''}
          <span style="font-size:11px;color:#da3633">→</span>
          ${rpPortrait(perf.name, 'sm')}
        </div>
        <div style="font-size:12px;color:#e6edf3;font-style:italic;line-height:1.5">${_sabText}</div>
      </div>`;
    }

    // ═══ PERFORMER: centered with spotlight glow ═══
    html += `<div style="text-align:center;margin-bottom:14px;position:relative">
      <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
        width:120px;height:120px;border-radius:50%;
        background:radial-gradient(circle,${spotlightColor}20 0%,${spotlightColor}08 40%,transparent 70%);
        pointer-events:none"></div>
      <div style="position:relative;display:inline-block;
        border-radius:12px;padding:4px;
        box-shadow:0 0 20px ${spotlightColor}30,0 0 60px ${spotlightColor}10;
        border:2px solid ${spotlightColor}30">
        ${rpPortrait(perf.name, 'md')}
      </div>
      <div style="font-family:var(--font-display);font-size:16px;font-weight:700;color:#e6edf3;
        margin-top:8px;text-shadow:0 0 10px rgba(0,0,0,0.5)">${perf.name}</div>
      <div style="font-size:10px;color:${tc};letter-spacing:1px;text-transform:uppercase;margin-top:2px">${perf.tribe}</div>
      <div style="font-size:11px;color:#8b7060;margin-top:4px">${perf.talent}</div>
    </div>`;

    // Outcome badge (prominent, centered)
    if (isDisaster) {
      html += `<div style="text-align:center;margin-bottom:10px">
        <span style="font-size:11px;font-weight:800;letter-spacing:2px;color:#f85149;
          background:rgba(248,81,73,0.15);padding:5px 14px;border-radius:20px;
          border:1px solid rgba(248,81,73,0.3);
          box-shadow:0 0 15px rgba(248,81,73,0.15)">💥 DISASTER</span>
      </div>`;
    }
    if (isClutch) {
      html += `<div style="text-align:center;margin-bottom:10px">
        <span style="font-size:11px;font-weight:800;letter-spacing:2px;color:#f0a500;
          background:rgba(240,165,0,0.15);padding:5px 14px;border-radius:20px;
          border:1px solid rgba(240,165,0,0.3);
          box-shadow:0 0 15px rgba(240,165,0,0.15)">⭐ SURPRISE HIT</span>
      </div>`;
    }

    // 3-beat performance narrative
    const beats = perf.performanceBeats || (typeof perf.performanceText === 'string' ? [perf.performanceText] : perf.performanceText) || [''];
    beats.forEach((beat, bIdx) => {
      if (!beat) return;
      const delay = bIdx * 0.15;
      const opacity = bIdx === 0 ? '0.7' : bIdx === 2 ? '1' : '0.85';
      const size = bIdx === 1 ? '13px' : '11px'; // act text is larger
      html += `<div style="font-size:${size};color:#cdd9e5;text-align:center;line-height:1.7;
        margin-bottom:${bIdx < 2 ? '8' : '16'}px;font-style:italic;max-width:360px;margin-left:auto;margin-right:auto;
        opacity:${opacity};text-shadow:0 1px 2px rgba(0,0,0,0.3);
        animation:scrollDrop 0.3s var(--ease-broadcast) both;animation-delay:${delay}s">${beat}</div>`;
    });

    // ═══ CHEF-O-METER (spoon-style, bigger, bouncier) ═══
    const scoreColor = perf.chefScore >= 7 ? '#3fb950' : perf.chefScore >= 4 ? '#f0a500' : '#f85149';
    html += `<div style="display:flex;align-items:center;justify-content:center;gap:10px;
      margin-bottom:12px;padding:10px;border-radius:8px;
      background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.05)">
      <div style="font-size:28px;filter:drop-shadow(0 0 8px rgba(240,165,0,0.3))">👨‍🍳</div>
      <div style="display:flex;gap:3px;align-items:center">`;
    for (let seg = 0; seg < 9; seg++) {
      const filled = seg < perf.chefScore;
      const segBg = filled ? scoreColor : 'rgba(255,255,255,0.06)';
      const delay = filled ? seg * 0.08 : 0;
      html += `<div style="width:22px;height:18px;border-radius:3px;
        background:${segBg};
        ${filled ? `box-shadow:0 0 6px ${scoreColor}40;animation:scrollDrop 0.3s var(--ease-broadcast) both;animation-delay:${delay}s` : ''}
      "></div>`;
    }
    html += `</div>
      <div style="font-family:var(--font-display);font-size:24px;font-weight:800;
        color:${scoreColor};text-shadow:0 0 12px ${scoreColor}40;min-width:28px;text-align:center">${perf.chefScore}</div>
    </div>`;

    // ═══ AUDIENCE REACTIONS (speech bubbles that pop in) ═══
    if (perf.reactions?.length) {
      html += `<div style="margin-top:10px;padding-top:10px;
        border-top:1px solid rgba(255,255,255,0.04)">
        <div style="font-size:8px;font-weight:700;letter-spacing:1.5px;color:#3d2b1a;
          text-transform:uppercase;margin-bottom:8px;text-align:center">AUDIENCE</div>`;
      perf.reactions.forEach((r, rIdx) => {
        html += `<div style="display:flex;align-items:flex-start;gap:8px;margin-bottom:6px;
          animation:scrollDrop 0.25s var(--ease-broadcast) both;animation-delay:${0.5 + rIdx * 0.12}s">
          ${rpPortrait(r.name, 'xs')}
          <div style="position:relative;flex:1;padding:6px 10px;border-radius:8px;border-top-left-radius:2px;
            background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.06)">
            <span style="font-size:10px;color:#a0a0a0;font-style:italic;line-height:1.4">${r.text}</span>
          </div>
        </div>`;
      });
      html += `</div>`;
    }

    html += `</div>`; // end act card
  });

  // ═══ FINAL RESULT ═══
  if (allRevealed) {
    const wTC = tribeColor(ts.winner);
    const lTC = tribeColor(ts.loser);
    html += `<div style="padding:20px;margin-top:14px;border-radius:12px;
      border:2px solid ${wTC};
      background:radial-gradient(ellipse at 50% 0%, ${wTC}15 0%, transparent 60%),
        linear-gradient(180deg,rgba(0,0,0,0.2) 0%,rgba(0,0,0,0.4) 100%);
      box-shadow:0 0 40px ${wTC}15;
      text-align:center;animation:scrollDrop 0.5s var(--ease-broadcast) both">
      <div style="font-family:var(--font-display);font-size:22px;letter-spacing:3px;
        color:${wTC};text-shadow:0 0 20px ${wTC},0 0 40px ${wTC}80;
        margin-bottom:6px">${ts.winner.toUpperCase()} WINS</div>
      <div style="font-size:12px;color:#8b949e;margin-bottom:8px">${ts.loser} goes to tribal council.</div>
      <div style="font-size:11px;color:#6e7681;margin-bottom:10px">
        Final: ${Object.entries(revealedScores).map(([t, s]) => {
          const tc2 = tribeColor(t);
          return `<span style="color:${tc2};font-weight:700">${t} ${s}</span>`;
        }).join(' <span style="color:#3d2b1a">·</span> ')}</div>
      ${ts.mvp ? `<div style="margin-top:10px;padding-top:10px;border-top:1px solid rgba(255,255,255,0.06)">
        <div style="font-size:8px;font-weight:700;letter-spacing:1.5px;color:#f0a500;margin-bottom:6px">SHOW MVP</div>
        ${rpPortrait(ts.mvp, 'sm')}
        <div style="font-size:11px;color:#e6edf3;margin-top:4px">${ts.mvp}</div>
      </div>` : ''}
    </div>`;
  }

  // ═══ NEXT ACT BUTTON ═══
  if (!allRevealed) {
    html += `<div style="position:sticky;bottom:0;padding:14px 0;text-align:center;
      background:linear-gradient(transparent,#0a0710 25%)">
      <button class="rp-btn" style="background:linear-gradient(135deg,#f0a500,#d4900a);color:#000;font-weight:700;
        border:none;padding:8px 20px;border-radius:6px;cursor:pointer;font-size:12px;letter-spacing:1px;
        box-shadow:0 0 15px rgba(240,165,0,0.2)"
        onclick="${_tsReveal(state.idx + 1)}">NEXT ACT (${state.idx + 2}/${totalItems})</button>
      <button class="rp-btn rp-btn-secondary" onclick="${_tsReveal(totalItems - 1)}" style="margin-left:8px">REVEAL ALL</button>
    </div>`;
  }

  html += `</div>`; // close z-index wrapper
  html += `</div>`; // close rp-page
  return html;
}

