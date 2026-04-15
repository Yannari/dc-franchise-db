// js/chal/phobia-factor.js
import { PHOBIA_CATEGORIES, PHOBIA_POOL, gs, players, seasonConfig } from '../core.js';
import { pStats, pronouns, tribeColor, updateChalRecord } from '../players.js';
import { addBond, getBond } from '../bonds.js';
import { _challengeRomanceSpark } from '../romance.js';

export function simulatePhobiaFactor(ep) {
  const tribes = gs.tribes;
  const _rp = arr => arr[Math.floor(Math.random() * arr.length)];

  // Initialize camp events for each tribe (may not exist yet — challenge runs before generateCampEvents)
  if (!ep.campEvents) ep.campEvents = {};
  tribes.forEach(t => { if (!ep.campEvents[t.name]) ep.campEvents[t.name] = { pre: [], post: [] }; });

  // Step 1: Assign random fears to each player
  const fears = {};
  const allPlayers = tribes.flatMap(t => t.members);
  allPlayers.forEach(player => {
    const category = _rp(PHOBIA_CATEGORIES);
    const fear = _rp(PHOBIA_POOL[category]);
    fears[player] = { category, title: fear.title, desc: fear.desc };
  });

  // Detect shared fears
  const sharedFears = [];
  const fearsByTitle = {};
  Object.entries(fears).forEach(([player, f]) => {
    if (!fearsByTitle[f.title]) fearsByTitle[f.title] = [];
    fearsByTitle[f.title].push(player);
  });
  Object.entries(fearsByTitle).forEach(([title, fPlayers]) => {
    if (fPlayers.length >= 2) {
      sharedFears.push({ players: [...fPlayers], fear: title });
      for (let i = 0; i < fPlayers.length; i++) {
        for (let j = i + 1; j < fPlayers.length; j++) {
          addBond(fPlayers[i], fPlayers[j], 0.2);
        }
      }
    }
  });

  // Step 2: Campfire confessions
  const confessions = [];
  allPlayers.forEach(player => {
    const f = fears[player];
    const pr = pronouns(player);
    const arch = players.find(p => p.name === player)?.archetype || '';
    let confText;
    if (arch === 'villain' || arch === 'mastermind') {
      confText = _rp([
        `${player} hesitates before speaking. "I don't have fears." Nobody believes ${pr.obj}. Finally: "${f.title}."`,
        `${player} says "${f.title}" like it's a strategic move. Maybe it is.`,
      ]);
    } else if (arch === 'hero') {
      confText = _rp([
        `${player} doesn't flinch. "${f.title}. I'm not proud of it, but it's real."`,
        `${player} looks into the fire. "${f.title}." ${pr.Sub} ${pr.sub === 'they' ? 'say' : 'says'} it like ${pr.sub} ${pr.sub === 'they' ? 'are' : 'is'} already preparing to face it.`,
      ]);
    } else if (arch === 'chaos-agent') {
      confText = _rp([
        `${player} blurts it out: "${f.title}. Don't judge me." The tribe can't tell if ${pr.sub} ${pr.sub === 'they' ? 'are' : 'is'} serious.`,
        `"${f.title}," ${player} says cheerfully. "Terrifies me. Can we talk about something else?"`,
      ]);
    } else {
      confText = _rp([
        `${player} stares into the fire. "${f.title}." The tribe goes quiet.`,
        `"You want to know my fear? ${f.title}." ${player} looks away. The vulnerability is real.`,
        `${player} admits ${pr.pos} fear quietly: ${f.title}. ${pr.Sub} ${pr.sub === 'they' ? 'don\'t' : 'doesn\'t'} want to talk about it.`,
      ]);
    }
    confessions.push({ player, fear: f.title, category: f.category, reaction: confText });
  });

  // Step 3: Run the challenge
  const results = {};
  const tribeScores = {};
  const _conquerReaction = (player, fear, desc) => {
    const pr = pronouns(player);
    const arch = players.find(p => p.name === player)?.archetype || '';
    const r = [
      `${player} stares at what's in front of ${pr.obj}. ${desc} ${pr.Sub} ${pr.sub === 'they' ? 'do' : 'does'} it. Hands shaking. Eyes wet. But ${pr.sub} ${pr.sub === 'they' ? 'do' : 'does'} it.`,
      `"${fear}." ${player} says it out loud. Then ${pr.sub} ${pr.sub === 'they' ? 'walk' : 'walks'} toward it. The tribe holds its breath. ${pr.Sub} ${pr.sub === 'they' ? 'come' : 'comes'} out the other side.`,
      `${player} almost quits. You can see it \u2014 the moment where ${pr.sub} nearly ${pr.sub === 'they' ? 'turn' : 'turns'} around. But ${pr.sub} ${pr.sub === 'they' ? 'don\'t' : 'doesn\'t'}. ${pr.Sub} ${pr.sub === 'they' ? 'push' : 'pushes'} through. The tribe erupts.`,
      `${player} takes the longest 10 seconds of ${pr.pos} life. ${desc} When the timer hits zero, ${pr.sub} ${pr.sub === 'they' ? 'collapse' : 'collapses'} into a heap. But ${pr.sub} did it.`,
    ];
    if (arch === 'hero') r.push(`${player} locks ${pr.pos} jaw and walks straight into ${fear}. Not a word. Not a flinch. The tribe watches in silence.`);
    if (arch === 'villain' || arch === 'mastermind') r.push(`${player} smirks through ${fear}. Whether ${pr.sub} ${pr.sub === 'they' ? 'are' : 'is'} actually scared or just performing, nobody can tell.`);
    if (arch === 'chaos-agent') r.push(`${player} laughs through ${fear}. Actually laughs. "${pr.Sub} ${pr.sub === 'they' ? 'don\'t' : 'doesn\'t'} know why everyone's so worried."`);
    if (arch === 'floater') r.push(`${player} does it so quietly nobody even realizes it's done. No drama. No spectacle. Just conquered.`);
    return _rp(r);
  };
  const _failReaction = (player, fear, desc) => {
    const pr = pronouns(player);
    return _rp([
      `${player} takes one look at ${fear} and the color drains from ${pr.pos} face. ${pr.Sub} ${pr.sub === 'they' ? 'back' : 'backs'} away. "I can't. I physically cannot do this."`,
      `${player} gets within arm's reach of ${fear}. Then ${pr.pos} whole body locks up. ${pr.Sub} can't move forward. The tribe watches ${pr.obj} give up.`,
      `"No. No no no." ${player} is already shaking before it starts. ${desc} ${pr.Sub} ${pr.sub === 'they' ? 'don\'t' : 'doesn\'t'} even attempt it. The phobia wins.`,
      `${player} tries. You can see ${pr.obj} trying. ${pr.Sub} ${pr.sub === 'they' ? 'get' : 'gets'} halfway through and panics. "${fear} is just \u2014 it's too much." The tribe is sympathetic. The scoreboard doesn't care.`,
      `${player} stands there for a long time. Nobody rushes ${pr.obj}. But eventually ${pr.sub} ${pr.sub === 'they' ? 'sit' : 'sits'} down. "${fear}" is all ${pr.sub} ${pr.sub === 'they' ? 'say' : 'says'}.`,
    ]);
  };
  const reactions = {};

  tribes.forEach(tribe => {
    let completions = 0;
    tribe.members.forEach(player => {
      const f = fears[player];
      const s = pStats(player);
      let primary = 0, secondary = 0;
      if (f.category === 'pain')        { primary = s.endurance * 0.07; secondary = s.physical * 0.04; }
      else if (f.category === 'fear')   { primary = s.boldness * 0.07;  secondary = s.endurance * 0.04; }
      else if (f.category === 'gross')  { primary = s.boldness * 0.07;  secondary = s.physical * 0.04; }
      else if (f.category === 'humiliation') { primary = s.boldness * 0.07; secondary = (10 - s.social) * 0.04; }
      // Phobias are deeply personal — even strong players can freeze
      // ~50% pass for average stats, ~75% for high, ~25% for low
      const score = primary + secondary + (Math.random() * 0.40 - 0.15);
      const passed = score >= 0.55;
      results[player] = passed ? 'pass' : 'fail';
      reactions[player] = passed ? _conquerReaction(player, f.title, f.desc) : _failReaction(player, f.title, f.desc);
      if (passed) completions++;
    });
    tribeScores[tribe.name] = {
      completions, total: tribe.members.length,
      percentage: tribe.members.length ? completions / tribe.members.length : 0,
    };
  });

  // Step 3b: Romance moments — comforting after failure OR celebrating a conquered fear
  if (seasonConfig.romance !== 'disabled') {
    tribes.forEach(tribe => {
      // Find a failed player and a high-bond/social tribemate who comforted them
      const failed = tribe.members.filter(m => results[m] === 'fail');
      const passed = tribe.members.filter(m => results[m] === 'pass');

      // Comfort after failure — spark opportunity
      failed.forEach(failedPlayer => {
        const comforters = tribe.members.filter(m => m !== failedPlayer && getBond(m, failedPlayer) >= 2)
          .sort((a, b) => (pStats(b).social * 0.5 + getBond(b, failedPlayer) * 0.3) - (pStats(a).social * 0.5 + getBond(a, failedPlayer) * 0.3));
        const comforter = comforters[0];
        if (!comforter) return;
        if (Math.random() >= pStats(comforter).social * 0.03 + getBond(comforter, failedPlayer) * 0.02) return;

        const prC = pronouns(comforter);
        const prF = pronouns(failedPlayer);
        const f = fears[failedPlayer];
        const _comfortTexts = [
          `${failedPlayer} walks away after failing ${f.title}. ${comforter} follows. Sits next to ${prF.obj}. Doesn't say anything for a while. Then: "That took guts to even try."`,
          `${comforter} finds ${failedPlayer} alone after ${prF.posAdj} fear won. "${prC.Sub} ${prC.sub === 'they' ? 'put' : 'puts'} a hand on ${failedPlayer}'s shoulder. "You're braver than you think."`,
          `${failedPlayer} can't look anyone in the eye. ${comforter} sits down. "I would've frozen too." It's not true, but it helps.`,
          `${comforter} brings ${failedPlayer} water after ${prF.posAdj} breakdown. No speech. No pep talk. Just presence. ${failedPlayer} takes a breath. "Thanks."`,
        ];
        addBond(failedPlayer, comforter, 0.4);
        addBond(comforter, failedPlayer, 0.3);
        ep.campEvents[tribe.name].post.push({
          type: 'phobiaComfort', players: [comforter, failedPlayer],
          text: _comfortTexts[Math.floor(Math.random() * _comfortTexts.length)],
          badgeText: 'COMFORT', badgeClass: 'gold'
        });
        // Romance spark — comforting someone after vulnerability is a charged moment
        _challengeRomanceSpark(comforter, failedPlayer, ep, null, null, null, 'comforting after fear');
      });

      // Celebrating a conquered fear — spark opportunity
      passed.forEach(conquerer => {
        const supporters = tribe.members.filter(m => m !== conquerer && getBond(m, conquerer) >= 3)
          .sort((a, b) => getBond(b, conquerer) - getBond(a, conquerer));
        const supporter = supporters[0];
        if (!supporter) return;
        if (Math.random() >= getBond(supporter, conquerer) * 0.03) return;

        const prS = pronouns(supporter);
        const prQ = pronouns(conquerer);
        const f = fears[conquerer];
        const _cheerTexts = [
          `${conquerer} conquers ${f.title} and ${supporter} is the first one there. Arms around ${prQ.obj}. "I knew you could do it." The hug lasts a beat too long.`,
          `${supporter} screams louder than anyone when ${conquerer} beats ${prQ.posAdj} fear. Runs over. The pride on ${prS.posAdj} face is personal, not tribal.`,
          `${conquerer} is shaking after ${f.title}. ${supporter} grabs ${prQ.posAdj} hands. "Look at me. You did it." Neither lets go right away.`,
        ];
        addBond(conquerer, supporter, 0.3);
        ep.campEvents[tribe.name].post.push({
          type: 'phobiaSupport', players: [supporter, conquerer],
          text: _cheerTexts[Math.floor(Math.random() * _cheerTexts.length)],
          badgeText: 'SUPPORT', badgeClass: 'gold'
        });
        _challengeRomanceSpark(supporter, conquerer, ep, null, null, null, 'cheering on a conquered fear');
      });
    });
  }

  // Step 4: Determine winner + loser
  const ranked = [...tribes].sort((a, b) => {
    const diff = tribeScores[b.name].percentage - tribeScores[a.name].percentage;
    return diff !== 0 ? diff : tribeScores[b.name].completions - tribeScores[a.name].completions || (Math.random() - 0.5);
  });
  let winningTribe = ranked[0];
  let losingTribe = ranked[ranked.length - 1];

  // Step 5: Triple points clutch
  let clutch = null;
  const winPct = tribeScores[winningTribe.name].percentage;
  const losePct = tribeScores[losingTribe.name].percentage;
  if (winPct - losePct >= 0.20 && losingTribe.members.length >= 2) {
    const clutchPlayer = [...losingTribe.members].sort((a, b) => pStats(a).boldness - pStats(b).boldness)[0];
    const cs = pStats(clutchPlayer);
    const catScores = {
      pain: cs.endurance * 0.07 + cs.physical * 0.04,
      fear: cs.boldness * 0.07 + cs.endurance * 0.04,
      gross: cs.boldness * 0.07 + cs.physical * 0.04,
      humiliation: cs.boldness * 0.07 + (10 - cs.social) * 0.04,
    };
    const weakestCat = [...PHOBIA_CATEGORIES].sort((a, b) => catScores[a] - catScores[b])[0];
    const clutchFear = _rp(PHOBIA_POOL[weakestCat]);
    let cPrimary = 0, cSecondary = 0;
    if (weakestCat === 'pain')        { cPrimary = cs.endurance * 0.07; cSecondary = cs.physical * 0.04; }
    else if (weakestCat === 'fear')   { cPrimary = cs.boldness * 0.07;  cSecondary = cs.endurance * 0.04; }
    else if (weakestCat === 'gross')  { cPrimary = cs.boldness * 0.07;  cSecondary = cs.physical * 0.04; }
    else if (weakestCat === 'humiliation') { cPrimary = cs.boldness * 0.07; cSecondary = (10 - cs.social) * 0.04; }
    const clutchScore = cPrimary + cSecondary + (Math.random() * 0.25 - 0.05);
    const clutchPassed = clutchScore >= 0.45;
    clutch = {
      player: clutchPlayer,
      fear: { category: weakestCat, title: clutchFear.title, desc: clutchFear.desc },
      result: clutchPassed ? 'pass' : 'fail',
      tribe: losingTribe.name,
      overturned: false,
    };
    const cpr = pronouns(clutchPlayer);
    reactions['_clutch'] = clutchPassed
      ? `Triple points on the line. The whole tribe is watching. ${clutchPlayer} stares at ${clutchFear.title}. And ${cpr.sub} ${cpr.sub === 'they' ? 'do' : 'does'} it.`
      : `${clutchPlayer} can't. Not with everyone watching. Not with this. The tribe's hope dies right there.`;
    if (clutchPassed) {
      tribeScores[losingTribe.name].completions += 3;
      tribeScores[losingTribe.name].percentage = tribeScores[losingTribe.name].completions / tribeScores[losingTribe.name].total;
    }
  }

  // Final ranking after potential clutch
  const finalRanked = [...tribes].sort((a, b) => {
    const diff = tribeScores[b.name].percentage - tribeScores[a.name].percentage;
    return diff !== 0 ? diff : tribeScores[b.name].completions - tribeScores[a.name].completions || (Math.random() - 0.5);
  });
  const finalWinner = finalRanked[0];
  const finalLoser = finalRanked[finalRanked.length - 1];
  if (clutch && finalWinner.name !== winningTribe.name) clutch.overturned = true;

  // Set results on ep
  ep.phobiaFactor = {
    fears, sharedFears, results, tribeScores, clutch, confessions, reactions,
    winningTribe: finalWinner.name, losingTribe: finalLoser.name,
  };

  // Standard challenge fields
  ep.challengeType = 'tribe';
  ep.winner = finalWinner;
  ep.loser = finalLoser;
  ep.safeTribes = finalRanked.slice(1, -1);
  ep.challengeLabel = 'Phobia Factor';
  ep.challengeCategory = 'mixed';
  ep.challengeDesc = 'Face your fear. Tribe with the best completion rate wins immunity.';
  ep.tribalPlayers = [...finalLoser.members];
  ep.challengePlacements = finalRanked.map(t => ({ name: t.name, members: [...t.members] }));

  // Challenge member scores — feeds into standout/weak link system
  // Failed = bottom (score 1), Passed = decent (score 5), Clutch pass = podium (score 9)
  ep.chalMemberScores = {};
  allPlayers.forEach(player => {
    if (results[player] === 'pass') ep.chalMemberScores[player] = 5;
    else ep.chalMemberScores[player] = 1; // failed — bottom
  });
  if (clutch && clutch.result === 'pass') {
    ep.chalMemberScores[clutch.player] = 9; // clutch hero — podium
  }

  // Camp events — confessions (pre)
  confessions.forEach(conf => {
    const tribeName = tribes.find(t => t.members.includes(conf.player))?.name;
    if (tribeName && ep.campEvents?.[tribeName]) {
      const block = ep.campEvents[tribeName];
      (block.pre = block.pre || []).push({
        type: 'phobiaConfession', players: [conf.player],
        text: conf.reaction, badgeText: 'CONFESSION', badgeClass: 'gold'
      });
    }
  });

  // Determine blame BEFORE generating camp events so we can merge badges
  const loserFailures = finalLoser.members.filter(p => results[p] === 'fail');
  // Clutch redeems: if the clutch player passed, they're no longer blamed
  const clutchRedeemed = clutch && clutch.result === 'pass' ? clutch.player : null;
  const blamedPlayers = new Set(
    loserFailures.length && loserFailures.length < finalLoser.members.length
      ? loserFailures.filter(p => p !== clutchRedeemed)
      : []
  );

  // Blame heat
  if (blamedPlayers.size) {
    if (!gs._phobiaBlame) gs._phobiaBlame = {};
    const blamePerPlayer = 2.0 / blamedPlayers.size;
    blamedPlayers.forEach(player => {
      gs._phobiaBlame[player] = blamePerPlayer;
      finalLoser.members.forEach(tm => {
        if (tm !== player) addBond(tm, player, -0.3);
      });
    });
  }

  // Camp events — only failures and blame matter (conquering is the expectation, not worth an event)
  allPlayers.forEach(player => {
    const tribeName = tribes.find(t => t.members.includes(player))?.name;
    if (tribeName && ep.campEvents?.[tribeName]) {
      const passed = results[player] === 'pass';
      if (passed) return; // conquering your fear = expected, no camp event needed
      const block = ep.campEvents[tribeName];
      const isBlamed = blamedPlayers.has(player);
      (block.post = block.post || []).push({
        type: isBlamed ? 'phobiaBlame' : 'phobiaFailed',
        players: [player], text: isBlamed
          ? `${player} couldn't face ${fears[player]?.title || 'their fear'}, and now the tribe is going to tribal. ${reactions[player]}`
          : reactions[player],
        badgeText: isBlamed ? 'COST THE TRIBE' : 'COULDN\'T DO IT',
        badgeClass: 'red',
      });
    }
  });

  // Shared fear events
  sharedFears.forEach(sf => {
    const tribeName = tribes.find(t => t.members.includes(sf.players[0]))?.name;
    if (tribeName && ep.campEvents?.[tribeName]) {
      (ep.campEvents[tribeName].post = ep.campEvents[tribeName].post || []).push({
        type: 'phobiaSharedFear', players: sf.players,
        text: `${sf.players.join(' and ')} share the same fear: ${sf.fear}. They faced it knowing the other was watching.`,
        badgeText: 'SHARED FEAR', badgeClass: 'gold',
      });
    }
  });

  // Clutch events
  if (clutch) {
    const tribeName = clutch.tribe;
    if (ep.campEvents?.[tribeName]) {
      (ep.campEvents[tribeName].post = ep.campEvents[tribeName].post || []).push({
        type: clutch.result === 'pass' ? 'phobiaClutchPass' : 'phobiaClutchFail',
        players: [clutch.player], text: reactions['_clutch'],
        badgeText: clutch.result === 'pass' ? 'CLUTCH' : 'CHOKED',
        badgeClass: clutch.result === 'pass' ? 'gold' : 'red',
      });
    }
    // Popularity: clutch pass = hero moment, clutch fail = goat moment
    if (!gs.popularity) gs.popularity = {};
    if (clutch.result === 'pass') {
      gs.popularity[clutch.player] = (gs.popularity[clutch.player] || 0) + 2; // saved the tribe = clutch hero
    } else {
      gs.popularity[clutch.player] = (gs.popularity[clutch.player] || 0) - 1; // choked the clutch = sympathy + target
    }
    // Choking the clutch = massive heat (you had the chance to save the tribe and blew it)
    if (clutch.result === 'fail') {
      if (!gs._phobiaBlame) gs._phobiaBlame = {};
      gs._phobiaBlame[clutch.player] = (gs._phobiaBlame[clutch.player] || 0) + 3.0;
      // Extra bond damage — the tribe trusted you with everything
      finalLoser.members.forEach(tm => {
        if (tm !== clutch.player) addBond(tm, clutch.player, -0.5);
      });
    }
  }

  updateChalRecord(ep);
}

export function _textPhobiaFactor(ep, ln, sec) {
  const pf = ep.phobiaFactor;
  if (!pf) return;
  sec('PHOBIA FACTOR');
  ln('Campfire Confessions:');
  (pf.confessions || []).forEach(c => ln(`  ${c.player}: ${c.fear} (${c.category})`));
  ln('');
  ln('Challenge Results:');
  const tribes = ep.tribesAtStart || [];
  tribes.forEach(tribe => {
    const ts = pf.tribeScores[tribe.name] || {};
    ln(`  ${tribe.name}: ${ts.completions}/${ts.total} (${Math.round((ts.percentage || 0) * 100)}%)`);
    tribe.members.forEach(name => {
      ln(`    ${name}: ${pf.results[name]?.toUpperCase()} \u2014 ${pf.fears[name]?.title}`);
    });
  });
  if (pf.clutch) {
    ln('');
    ln(`TRIPLE POINTS: ${pf.clutch.player} (${pf.clutch.tribe}) \u2014 ${pf.clutch.fear.title} \u2014 ${pf.clutch.result.toUpperCase()}`);
    if (pf.clutch.overturned) ln('  RESULT OVERTURNED!');
  }
  ln('');
  ln(`WINNER: ${pf.winningTribe}`);
  ln(`LOSER: ${pf.losingTribe} \u2014 goes to tribal`);
}

export function rpBuildPhobiaConfessions(ep) {
  const pf = ep.phobiaFactor;
  if (!pf) return '';
  const uid = 'pf-conf-' + ep.num;
  const confessions = pf.confessions || [];
  const _catColor = { 'pain': '#da3633', 'fear': '#8957e5', 'gross': '#3fb950', 'humiliation': '#db61a2' };

  let html = `<div class="rp-page tod-dusk" id="${uid}-page" data-pf-revealed="0" data-pf-total="${confessions.length}">
    <div style="font-family:var(--font-display);font-size:28px;letter-spacing:2px;text-align:center;color:var(--accent-fire);text-shadow:0 0 20px var(--accent-fire);margin-bottom:4px;animation:scrollDrop 0.5s var(--ease-broadcast) both">CAMPFIRE CONFESSIONS</div>
    <div style="font-size:11px;color:var(--muted);text-align:center;margin-bottom:20px">"What are you afraid of?"</div>`;

  confessions.forEach((conf, i) => {
    const f = pf.fears[conf.player];
    const catCol = _catColor[f?.category] || '#8b949e';
    html += `<div class="${uid}-item" style="display:none" data-idx="${i}">
      <div class="vp-card" style="margin-bottom:10px;border-left:3px solid ${catCol}">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
          ${rpPortrait(conf.player, 'pb-sm')}
          <div style="flex:1">
            <div style="font-size:13px;font-weight:700;color:var(--vp-text)">${conf.player}</div>
            <span class="pf-fear-badge" style="color:${catCol};background:${catCol}15;box-shadow:0 0 8px ${catCol}18">${f?.title || 'Unknown'}</span>
          </div>
        </div>
        <div style="font-size:12px;color:var(--vp-text);line-height:1.5;font-style:italic">${conf.reaction}</div>
      </div>
    </div>`;
  });

  html += `<div style="display:flex;gap:10px;justify-content:center;margin-top:16px;position:sticky;bottom:10px;z-index:5">
    <button class="rp-camp-toggle-btn" style="border-color:var(--accent-fire);color:var(--accent-fire);padding:8px 20px;font-size:12px" onclick="pfRevealNext('${uid}')">NEXT</button>
    <button class="rp-camp-toggle-btn" style="border-color:#484f58;color:#8b949e;padding:8px 16px;font-size:11px" onclick="pfRevealAll('${uid}')">REVEAL ALL</button>
  </div></div>`;
  return html;
}

export function rpBuildPhobiaAnnouncement(ep) {
  const pf = ep.phobiaFactor;
  if (!pf) return '';
  const tribes = ep.tribesAtStart || gs.tribes || [];

  let html = `<div class="rp-page tod-dawn">
    <div style="font-family:var(--font-display);font-size:32px;letter-spacing:3px;text-align:center;color:var(--accent-fire);text-shadow:0 0 20px var(--accent-fire);margin-bottom:4px;animation:scrollDrop 0.5s var(--ease-broadcast) both">PHOBIA FACTOR</div>
    <div style="font-size:10px;font-weight:700;letter-spacing:3px;text-transform:uppercase;color:var(--muted);text-align:center;margin-bottom:20px">Face Your Fear</div>
    <div style="font-size:13px;color:var(--vp-text);text-align:center;margin-bottom:24px;line-height:1.7;max-width:460px;margin-left:auto;margin-right:auto;font-style:italic">
      "We watched the tapes. We know what you're afraid of. Today's challenge: face your fear. Tribe with the best completion rate wins immunity."
    </div>`;

  tribes.forEach(tribe => {
    const tc = tribeColor(tribe.name);
    html += `<div class="rp-tribe" style="margin-bottom:16px">
      <div class="rp-tribe-head" style="color:${tc};border-color:${tc}">${tribe.name}</div>`;
    tribe.members.forEach(name => {
      const f = pf.fears[name];
      if (!f) return;
      const cc = { 'pain': '#da3633', 'fear': '#8957e5', 'gross': '#3fb950', 'humiliation': '#db61a2' }[f.category] || '#8b949e';
      html += `<div style="display:flex;align-items:center;gap:8px;padding:5px 0">
        ${rpPortrait(name, 'pb-sm')}
        <span style="font-size:12px;color:var(--vp-text);flex:1">${name}</span>
        <span class="pf-fear-badge" style="color:${cc};background:${cc}15;box-shadow:0 0 8px ${cc}18">${f.title}</span>
      </div>`;
    });
    html += `</div>`;
  });

  html += `</div>`;
  return html;
}

export function rpBuildPhobiaChallenge(ep) {
  const pf = ep.phobiaFactor;
  if (!pf) return '';
  const uid = 'pf-chal-' + ep.num;
  const tribes = ep.tribesAtStart || gs.tribes || [];
  const _catColor = { 'pain': '#da3633', 'fear': '#8957e5', 'gross': '#3fb950', 'humiliation': '#db61a2' };
  const revealItems = [];

  tribes.forEach(tribe => {
    const tc = tribeColor(tribe.name);
    const ts = pf.tribeScores[tribe.name] || {};
    revealItems.push({ type: 'header', html: `<div style="font-size:13px;font-weight:700;letter-spacing:2px;color:${tc};border-bottom:2px solid ${tc};padding-bottom:6px;margin:16px 0 8px">${tribe.name} <span style="color:var(--muted);font-weight:400">${ts.completions || 0}/${ts.total || 0}</span></div>` });
    tribe.members.forEach(name => {
      const f = pf.fears[name];
      const result = pf.results[name];
      const reaction = pf.reactions[name];
      const catCol = _catColor[f?.category] || '#8b949e';
      const passed = result === 'pass';
      revealItems.push({ type: 'player', html: `<div class="vp-card ${passed ? '' : 'fire'}" style="margin-bottom:8px;border-left:3px solid ${passed ? '#3fb950' : '#da3633'}">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
          ${rpPortrait(name, 'pb-sm')}
          <div style="flex:1">
            <div style="font-size:12px;font-weight:700;color:var(--vp-text)">${name}</div>
            <span class="pf-fear-badge" style="color:${catCol};background:${catCol}15">${f?.title || '?'}</span>
          </div>
          <span class="pf-result-badge ${passed ? 'pass' : 'fail'} revealed">${passed ? '\u2713 CONQUERED' : '\u2717 FAILED'}</span>
        </div>
        <div style="font-size:11px;color:var(--muted);line-height:1.5">${f?.desc || ''}</div>
        <div style="font-size:12px;color:var(--vp-text);line-height:1.5;margin-top:6px">${reaction || ''}</div>
      </div>` });
    });
  });

  let html = `<div class="rp-page tod-arena" id="${uid}-page" data-pf-revealed="0" data-pf-total="${revealItems.length}">
    <div style="font-family:var(--font-display);font-size:22px;letter-spacing:2px;text-align:center;color:var(--accent-fire);margin-bottom:16px">THE CHALLENGE</div>`;
  revealItems.forEach((item, i) => {
    html += `<div class="${uid}-item" style="display:none" data-idx="${i}">${item.html}</div>`;
  });
  html += `<div style="display:flex;gap:10px;justify-content:center;margin-top:16px;position:sticky;bottom:10px;z-index:5">
    <button class="rp-camp-toggle-btn" style="border-color:var(--accent-fire);color:var(--accent-fire);padding:8px 20px;font-size:12px" onclick="pfRevealNext('${uid}')">NEXT \u25B6</button>
    <button class="rp-camp-toggle-btn" style="border-color:#484f58;color:#8b949e;padding:8px 16px;font-size:11px" onclick="pfRevealAll('${uid}')">REVEAL ALL</button>
  </div></div>`;
  return html;
}

export function rpBuildPhobiaClutch(ep) {
  const pf = ep.phobiaFactor;
  if (!pf?.clutch) return '';
  const c = pf.clutch;
  const cc = { 'pain': '#da3633', 'fear': '#8957e5', 'gross': '#3fb950', 'humiliation': '#db61a2' }[c.fear.category] || '#8b949e';
  const passed = c.result === 'pass';

  let html = `<div class="rp-page tod-arena" style="text-align:center">
    <div style="font-family:var(--font-display);font-size:24px;letter-spacing:2px;color:var(--accent-fire);margin-bottom:8px;animation:scrollDrop 0.5s var(--ease-broadcast) both">TRIPLE POINTS</div>
    <div style="font-size:12px;color:var(--muted);margin-bottom:16px">${c.tribe} is behind. One last chance. Triple the stakes.</div>
    ${rpPortrait(c.player, 'lg')}
    <div style="font-size:14px;font-weight:700;color:var(--vp-text);margin-top:12px">${c.player}</div>
    <div style="margin:12px 0">
      <span class="pf-fear-badge" style="color:${cc};background:${cc}15;box-shadow:0 0 12px ${cc}22;font-size:10px;padding:3px 10px">${c.fear.title}</span>
    </div>
    <div style="font-size:12px;color:var(--muted);font-style:italic;margin-bottom:20px">${c.fear.desc}</div>
    <div class="pf-clutch-result" style="font-family:var(--font-display);font-size:22px;letter-spacing:2px;color:${passed ? 'var(--accent-gold)' : '#da3633'};margin-bottom:10px;text-shadow:0 0 16px ${passed ? 'rgba(240,192,64,0.3)' : 'rgba(218,54,51,0.3)'}">${passed ? 'CLUTCH' : 'CHOKED'}</div>
    <div style="font-size:12px;color:var(--vp-text);line-height:1.5">${pf.reactions['_clutch'] || ''}</div>
    ${c.overturned ? '<div class="pf-overturned" style="font-family:var(--font-display);font-size:14px;color:var(--accent-gold);margin-top:14px;letter-spacing:2px;text-shadow:0 0 12px rgba(240,192,64,0.3)">THE RESULT IS OVERTURNED!</div>' : ''}
  </div>`;
  return html;
}

export function rpBuildPhobiaResults(ep) {
  const pf = ep.phobiaFactor;
  if (!pf) return '';
  const tribes = ep.tribesAtStart || gs.tribes || [];
  const ranked = [...tribes].sort((a, b) => (pf.tribeScores[b.name]?.percentage || 0) - (pf.tribeScores[a.name]?.percentage || 0));

  let html = `<div class="rp-page tod-dawn" style="text-align:center">
    <div style="font-family:var(--font-display);font-size:22px;letter-spacing:2px;color:var(--accent-gold);margin-bottom:16px;animation:scrollDrop 0.5s var(--ease-broadcast) both">RESULTS</div>`;
  ranked.forEach((tribe, ri) => {
    const ts = pf.tribeScores[tribe.name] || {};
    const tc = tribeColor(tribe.name);
    const isWinner = tribe.name === pf.winningTribe;
    const isLoser = tribe.name === pf.losingTribe;
    const pct = Math.round((ts.percentage || 0) * 100);
    const barColor = isWinner ? 'var(--accent-gold)' : isLoser ? '#da3633' : tc;
    html += `<div class="vp-card ${isWinner ? 'gold' : isLoser ? 'fire' : ''}" style="margin-bottom:12px;text-align:left;animation:pfRevealIn 0.4s var(--ease-broadcast) ${ri * 0.15}s both">
      <div style="display:flex;align-items:center;gap:10px">
        <div style="font-size:14px;font-weight:700;color:${tc}">${tribe.name}</div>
        <div style="flex:1;text-align:right;font-size:14px;font-weight:700;font-family:var(--font-mono);color:${isWinner ? 'var(--accent-gold)' : isLoser ? '#da3633' : 'var(--muted)'}">${ts.completions}/${ts.total} (${pct}%)</div>
      </div>
      <div class="pf-bar-track">
        <div class="pf-bar-fill" style="--pf-pct:${pct}%;background:${barColor};animation-delay:${ri * 0.15 + 0.2}s"></div>
      </div>
      <div style="font-size:11px;font-weight:700;letter-spacing:1px;margin-top:8px;color:${isWinner ? 'var(--accent-gold)' : isLoser ? '#da3633' : 'var(--muted)'}">${isWinner ? 'WINS IMMUNITY' : isLoser ? 'GOES TO TRIBAL' : 'SAFE'}</div>
    </div>`;
  });
  html += `</div>`;
  return html;
}

