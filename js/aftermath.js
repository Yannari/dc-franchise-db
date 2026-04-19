// js/aftermath.js - Aftermath show generation and VP screens
import { gs, seasonConfig, players } from './core.js';
import { pStats, pronouns } from './players.js';
import { getBond, addBond } from './bonds.js';
import { buildNextEpQs } from './text-backlog.js';

// Functions still in simulator.html inline script — accessed via window at call time:
//   rpPortrait, vpArchLabel

export function generateAftermathShow(ep) {
  const cfg = seasonConfig;
  const curEp = ep.num || (gs.episode || 0) + 1;
  const isFinale = !!(ep.winner && ep.isFinale); // BOTH must be true — winner decided AND engine explicitly marked it as finale
  const isScheduled = (ep.twists || []).some(t => t.type === 'aftermath' || t.catalogId === 'aftermath');
  const lastAftermath = gs.lastAftermathEp || 0;
  // Count eliminations since last aftermath (not episodes — Team Swap skips mess up episode counting)
  // Count TOTAL eliminations, not episodes — double boots count as 2, exile setups count as 0
  const _elimsSinceLastAftermath = (gs.episodeHistory || []).filter(h => h.num > lastAftermath && h.num <= curEp).reduce((count, h) => {
    let c = 0;
    if (h.eliminated) c++;
    if (h.firstEliminated) c++;
    if (h.tiedDestinies?.eliminatedPartner) c++;
    if (h.ambassadorData?.ambassadorEliminated && h.ambassadorData.ambassadorEliminated !== h.eliminated) c++;
    return count + c;
  }, 0);
  const autoFire = cfg.aftermath === 'enabled' && _elimsSinceLastAftermath >= 3;
  // Pre-finale aftermath: always fire right before the finale so the last aftermath covers the finalists
  const _isPreFinale = cfg.aftermath === 'enabled' && !isFinale && gs.activePlayers.length <= (cfg.finaleSize || 3) + 1 && lastAftermath < curEp;
  if (!isScheduled && !autoFire && !_isPreFinale && !(isFinale && cfg.aftermath === 'enabled')) return;

  const _pick = arr => arr.length ? arr[Math.floor(Math.random() * arr.length)] : '';
  const _host = cfg.host || 'Chris';

  // ── Determine interviewees and gallery ──
  // Build eliminated list from episode history (more reliable than gs.eliminated for double elims / returnees)
  const _allElimFromHistory = [];
  (gs.episodeHistory || []).forEach(h => {
    if (h.eliminated) _allElimFromHistory.push(h.eliminated);
    if (h.firstEliminated) _allElimFromHistory.push(h.firstEliminated);
    if (h.tiedDestinies?.eliminatedPartner) _allElimFromHistory.push(h.tiedDestinies.eliminatedPartner);
    if (h.ambassadorData?.ambassadorEliminated) _allElimFromHistory.push(h.ambassadorData.ambassadorEliminated);
  });
  const allEliminated = [...new Set([...(_allElimFromHistory), ...(gs.eliminated || [])])];
  const prevInterviewed = gs.aftermathHistory?.flatMap(a => a.interviewees) || [];
  // Returnees: remove from interviewee pool if they came back and are still active
  const _returnees = new Set(gs.activePlayers);
  // A player who was interviewed, returned, and got eliminated AGAIN should be re-interviewed
  const _lastInterviewEp = {};
  (gs.aftermathHistory || []).forEach(a => { a.interviewees.forEach(n => { _lastInterviewEp[n] = a.ep; }); });
  const interviewees = allEliminated.filter(n => {
    if (_returnees.has(n)) return false; // still active
    if (!prevInterviewed.includes(n)) return true; // never interviewed
    // Was interviewed before — check if eliminated AGAIN after the interview
    const _lastIntEp = _lastInterviewEp[n] || 0;
    const _reElim = (gs.episodeHistory || []).find(h => h.num > _lastIntEp && (h.eliminated === n || h.firstEliminated === n || h.ambassadorData?.ambassadorEliminated === n || h.tiedDestinies?.eliminatedPartner === n));
    return !!_reElim; // re-eliminated after last interview
  });
  const peanutGallery = prevInterviewed.filter(n => !_returnees.has(n));

  if (!interviewees.length && !isFinale) {
    // No new eliminees — still reset the timer so it doesn't fire next episode
    if (autoFire) gs.lastAftermathEp = curEp;
    return;
  }

  const aftermathNum = (gs.aftermathHistory?.length || 0) + 1;
  const isReunion = isFinale;

  // ── BUILD INTERVIEWS ──
  // Reunion: only interview people who haven't been interviewed yet + the finalists
  // Everyone else is present for group discussion but doesn't get a solo interview
  const _reunionNewGuests = isReunion ? [...gs.activePlayers, ...interviewees] : interviewees;
  const _reunionAll = _reunionNewGuests;
  const interviews = _reunionAll.map(name => {
    const s = pStats(name);
    const pr = pronouns(name);
    const arch = s.archetype || 'unknown';
    const isActive = gs.activePlayers.includes(name);
    const pop = gs.popularity?.[name] || 0;

    // Find their elimination episode data
    const elimEp = gs.episodeHistory.find(h => h.eliminated === name || h.firstEliminated === name || h.tiedDestinies?.eliminatedPartner === name);
    const elimEpNum = elimEp?.num || '?';
    const voters = (elimEp?.votingLog || []).filter(v => v.voted === name).map(v => v.voter);

    // Crowd reaction
    const crowdReaction = pop >= 8 ? 'wild' : pop >= 3 ? 'warm' : pop >= 0 ? 'polite' : 'boos';

    // Entrance quote
    const wasBlindside = elimEp?.votingLog && voters.length >= 3;
    const wasBetrayedBy = voters.find(v => getBond(name, v) >= 3);
    const entranceQuote = isActive
      ? _pick([`${name} walks on stage as the season's winner. The crowd erupts.`, `${name} takes the hot seat. The game is over — but the story isn't.`])
      : wasBetrayedBy
      ? _pick([`"I trusted ${wasBetrayedBy}. That's on me."`, `"${wasBetrayedBy} looked me in the eye and lied. I won't forget that."`, `"Betrayal is part of the game. Doesn't mean it doesn't sting."`])
      : wasBlindside
      ? _pick([`"I didn't see it coming. And honestly? I'm still processing."`, `"The blindside was clean. I'll give them that."`, `"I had no idea. Zero. That's the worst part."`])
      : _pick([`"I knew it was my time. Doesn't make it easier."`, `"I played my game. I'm proud of what I did out there."`, `"It's over for me. But the game isn't over."`]);

    // Build a POOL of possible Q&As — pick 3-4 randomly so each interview is different
    const blameTarget = voters.sort((a, b) => getBond(name, a) - getBond(name, b))[0] || null;
    const activeByBond = gs.activePlayers.filter(p => p !== name).sort((a, b) => getBond(name, b) - getBond(name, a));
    const prediction = activeByBond[0] || null;
    const enemy = gs.activePlayers.filter(p => p !== name).sort((a, b) => getBond(name, a) - getBond(name, b))[0];
    const bestAlly = activeByBond[0];
    const _showmance = gs.showmances?.find(sh => sh.players.includes(name));
    const _wasMole = gs.moles?.find(m => m.player === name);
    // Specific idol play data
    const _idolPlayEp = gs.episodeHistory?.find(h => (h.idolPlays || []).some(ip => ip.player === name && (ip.type === 'idol' || ip.type === 'superIdol')));
    const _idolPlay = _idolPlayEp ? (_idolPlayEp.idolPlays || []).find(ip => ip.player === name) : null;
    // Specific betrayal data
    const _betrayalEp = gs.episodeHistory?.find(h => (h.defections || []).some(d => d.player === name));
    const _betrayal = _betrayalEp ? (_betrayalEp.defections || []).find(d => d.player === name) : null;
    // Alliance history
    const _alliances = (gs.namedAlliances || []).filter(a => a.members.includes(name));
    const _dissolvedAlliance = _alliances.find(a => !a.active);
    // Vote count at elimination
    const _elimVoteCount = elimEp?.votes?.[name] || 0;
    const _elimTotalVoters = elimEp?.votingLog?.length || 0;
    // Challenge record
    const _chalRec = gs.chalRecord?.[name];
    const _chalWins = _chalRec?.wins || 0;

    const _allQAs = [
      // Blame — specific vote data
      blameTarget && { q: `"${_elimVoteCount} votes against you in episode ${elimEpNum}. ${blameTarget} was one of them. Did you see it coming?"`, a: _pick([
        `"${blameTarget} looked me in the eye at camp that morning and said we were good. ${_elimVoteCount} votes later, here I am."`,
        `"I knew ${blameTarget} was capable of it. I just didn't think ${pronouns(blameTarget).sub} ${pronouns(blameTarget).sub === 'they' ? 'would' : 'would'} actually do it. ${_elimVoteCount} votes — ${pronouns(blameTarget).sub} organized that."`,
        `"${blameTarget}. We were supposed to be close and ${pronouns(blameTarget).sub} still wrote my name. That tells you everything."`,
      ]), cat: 'blame' },
      // Mistake — references specific game events
      { q: s.strategic >= 7 ? `"You were one of the most strategic players out there. ${_chalWins ? `${_chalWins} challenge wins.` : ''} But strategy didn't save you. What went wrong?"` : _dissolvedAlliance ? `"${_dissolvedAlliance.name} fell apart. You were in it. What happened?"` : `"Walk me through your game. Where did it go sideways?"`,
        a: _dissolvedAlliance ? _pick([`"${_dissolvedAlliance.name} was solid until it wasn't. Someone flipped — and once trust breaks, it's over."`, `"We had the numbers with ${_dissolvedAlliance.name}. Then the cracks started showing around episode ${_dissolvedAlliance.formed + 2 || '?'}."`,]) : s.strategic >= 7 ? _pick([`"I saw the move three episodes out. But seeing it and executing it are different things."`, `"I had too many plans running. When one collapsed, they all did."`,]) : _pick([`"I didn't play hard enough when it mattered. By the time I woke up, it was too late."`, `"I trusted the wrong person at the wrong time. That one decision cost me everything."`,]), cat: 'mistake' },
      // Prediction — with reasoning
      prediction && { q: `"${gs.activePlayers.length} players left. Who takes it?"`, a: _pick([`"${prediction}. I know ${pronouns(prediction).posAdj} game better than anyone. ${pronouns(prediction).Sub} ${pronouns(prediction).sub === 'they' ? 'have' : 'has'} the path."`, `"${prediction}. ${pronouns(prediction).Sub} ${pronouns(prediction).sub === 'they' ? 'are' : 'is'} playing the game nobody else sees. Somehow still under the radar."`,]), cat: 'prediction' },
      // Enemy — specific bond and incident
      enemy && getBond(name, enemy) <= -2 && { q: `"You and ${enemy}. That's ${getBond(name, enemy) <= -5 ? 'hatred' : getBond(name, enemy) <= -3 ? 'serious hostility' : 'real tension'}. What happened between you two?"`, a: _pick([`"${enemy} and I clashed from day one. By episode ${Math.max(1, (elimEpNum || 5) - 3)}, it was personal."`, `"I tried to work with ${enemy}. Genuinely. But ${pronouns(enemy).sub} made it impossible. Ask anyone at camp."`, `"${enemy} played a dirty game. I played mine. We just happened to be playing against each other."`,]), cat: 'enemy' },
      // Showmance — specific partner and phase
      _showmance && { q: `"You and ${_showmance.players.find(p => p !== name)}. The showmance started around episode ${_showmance.sparkEp || '?'}. ${_showmance.phase === 'broken-up' ? 'And then it ended.' : 'Is it still going?'}"`, a: _showmance.phase === 'broken-up' ? _pick([`"It was real while it lasted. The game killed it. Not us."`, `"I don't regret it. Even the ending. ${_showmance.players.find(p => p !== name)} knows how I felt."`,]) : _pick([`"It's real. Whatever anyone says, it's real. ${_showmance.players.find(p => p !== name)} is the best thing that happened to me out there."`, `"The game complicates everything. But what we have? That's not complicated."`,]), cat: 'showmance' },
      // Showmance betrayal interview
      _showmance && _showmance.breakupVoter === name ? { q: `"You wrote ${_showmance.players.find(p => p !== name)}'s name down. After everything. Was there even a moment of hesitation?"`,
        a: _pick([`"A moment? It was the longest walk to the voting booth of my life. But the game demanded it."`, `"I hesitated. I won't pretend I didn't. But survival comes first. Even over love."`, `"${_showmance.players.find(p => p !== name)} would have done the same thing. I just did it first."`]), cat: 'showmance' } : null,
      // Affair interviews
      ...(() => {
        const _ia = (gs.affairs || []).find(af => af.cheater === name || af.partner === name || af.secretPartner === name || af.caughtBy === name);
        if (!_ia) return [];
        const entries = [];
        if (_ia.cheater === name) entries.push({ q: `"Walk us through the timeline. When did the showmance with ${_ia.partner} stop being real and the affair with ${_ia.secretPartner} start?"`, a: _pick([`"It wasn't planned. Things with ${_ia.secretPartner} just... happened. I know how that sounds."`, `"I kept telling myself I'd end it. Every day. And every day I didn't."`]), cat: 'affair' });
        if (_ia.partner === name) entries.push({ q: `"When did you first suspect something between ${_ia.cheater} and ${_ia.secretPartner}?"`, a: _pick([`"I had no idea. Zero. I feel stupid saying that, but it's the truth."`, `"There were signs. I just didn't want to see them."`]), cat: 'affair' });
        if (_ia.secretPartner === name && _ia.complicit) entries.push({ q: `"You knew ${_ia.cheater} was with ${_ia.partner}. At any point did you think about walking away?"`, a: _pick([`"Every day. But the heart wants what it wants."`, `"I'm not proud of it. But I'm not going to pretend I didn't feel what I felt."`]), cat: 'affair' });
        if (_ia.secretPartner === name && !_ia.complicit) entries.push({ q: `"When did you find out you were the other ${pronouns(name).sub === 'she' ? 'woman' : pronouns(name).sub === 'he' ? 'man' : 'person'}?"`, a: _pick([`"Finding out on camera? In front of everyone? That's a special kind of humiliation."`, `"${_ia.cheater} told me ${pronouns(_ia.cheater).sub} ${pronouns(_ia.cheater).sub === 'they' ? 'were' : 'was'} single. I believed ${pronouns(_ia.cheater).obj}."`]), cat: 'affair' });
        if (_ia.caughtBy === name && _ia.caughtTold) entries.push({ q: `"You're the one who blew it up. Do you regret telling ${_ia.partner}?"`, a: _pick([`"Not for a second. ${_ia.partner} deserved to know."`, `"It was the hardest conversation I've had out here. But I'd do it again."`]), cat: 'affair' });
        if (_ia.caughtBy === name && !_ia.caughtTold) entries.push({ q: `"You watched the affair happen and said nothing. Would you tell ${_ia.partner} if you could go back?"`, a: _pick([`"I should have. I know that now."`, `"It wasn't my secret to tell. At least that's what I told myself."`]), cat: 'affair' });
        return entries;
      })(),
      // Triangle interviews
      ...(() => {
        const _it = (gs.loveTriangles || []).find(t => t.center === name || t.suitors.includes(name));
        if (!_it) return [];
        const entries = [];
        if (_it.center === name) {
          const _triCenterBondA = getBond(name, _it.suitors[0]), _triCenterBondC = getBond(name, _it.suitors[1]);
          const _triWasReal = _triCenterBondA >= 2 && _triCenterBondC >= 2;
          entries.push({ q: `"Two people. One choice. What was going through your head when you realized you were caught between ${_it.suitors[0]} and ${_it.suitors[1]}?"`,
            a: _triWasReal
              ? _pick([`"I cared about both of them. But the game doesn't let you have both."`, `"I didn't ask for this. By the time I realized, everyone was watching."`])
              : _pick([`"It wasn't what people think. I was never torn — I knew where I stood. But the tribe made it into something it wasn't."`, `"${_it.suitors[1]} read into something that wasn't there. I was loyal to ${_it.suitors[0]} from the start."`]),
            cat: 'triangle' });
        }
        if (_it.resolution?.type === 'chose' && _it.center === name) entries.push({ q: `"You chose ${_it.resolution.chosen}. Do you think ${_it.resolution.rejected} will ever forgive you?"`, a: _pick([`"I hope so. But I understand if ${pronouns(_it.resolution.rejected).sub} ${pronouns(_it.resolution.rejected).sub === 'they' ? 'don\'t' : 'doesn\'t'}."`, `"Forgive me? I'm not sure I've forgiven myself."`]), cat: 'triangle' });
        if (_it.resolution?.rejected === name) entries.push({ q: `"You watched ${_it.center} choose someone else. On a scale of one to devastated — where did you land?"`, a: (players.find(p => p.name === name)?.archetype === 'villain' || players.find(p => p.name === name)?.archetype === 'schemer') ? `"Devastated? No. Motivated."` : _pick([`"Off the scale. I thought what we had was real."`, `"Devastated doesn't cover it. But I'm still here."`]), cat: 'triangle' });
        if (_it.resolution?.chosen === name) entries.push({ q: `"You won the triangle. Did you feel guilty — even for a second?"`, a: _pick([`"Every second. But I can't control who ${_it.center} chooses."`, `"Guilty? A little. But I'm not going to apologize for being chosen."`]), cat: 'triangle' });
        return entries;
      })(),
      // Betrayal — specific episode and target
      _betrayal && { q: `"Episode ${_betrayalEp.num}. You flipped on ${_betrayal.alliance || 'your alliance'}. ${_betrayal.votedFor ? `Voted ${_betrayal.votedFor} instead of the plan.` : 'Broke rank.'} Was it worth it?"`, a: _pick([`"In that moment? Absolutely. I'd do it again. The numbers were shifting and I read it right."`, `"I didn't flip. I made a strategic decision. There's a difference. The alliance was already dead — I just made it official."`, `"Worth it? I'm sitting on this couch instead of still playing. You tell me. ...Yeah. Still worth it."`,]), cat: 'betrayal' },
      // Idol — specific episode and vote count
      _idolPlay && { q: `"Episode ${_idolPlayEp.num}. You played your idol${_idolPlay.playedFor && _idolPlay.playedFor !== name ? ` for ${_idolPlay.playedFor}` : ''}. ${_idolPlay.votesNegated ? `${_idolPlay.votesNegated} votes cancelled.` : ''} Take us back to that moment."`, a: _idolPlay.playedFor && _idolPlay.playedFor !== name ? _pick([`"Playing it for ${_idolPlay.playedFor} was the hardest decision I made out there. ${_idolPlay.votesNegated} votes gone. The look on the tribe's face..."`, `"I knew ${_idolPlay.playedFor} was going home. I couldn't let that happen. ${_idolPlay.votesNegated} votes negated — it was the right call."`,]) : _pick([`"${_idolPlay.votesNegated || 'Those'} votes hit the table and my name was on every one. Then the idol came out. Best moment of my entire game."`, `"I'd been holding it since episode ${_idolPlayEp.num - 2 > 0 ? _idolPlayEp.num - 2 : 1}. Every tribal I debated playing it. That night I finally knew."`,]), cat: 'idol' },
      // Mole — specific sabotage count and acts
      _wasMole && { q: `"${_wasMole.sabotageCount} acts of sabotage. ${_wasMole.exposed ? `Exposed in episode ${_wasMole.exposedEp} by ${_wasMole.exposedBy}.` : 'Never caught.'} The Mole. Was that worth it?"`, a: _wasMole.exposed ? _pick([`"${_wasMole.sabotageCount} moves and ${_wasMole.exposedBy} figured it out. I respect that. But those ${_wasMole.sabotageCount} acts? Every single one landed."`, `"Getting caught was inevitable. I just wanted to do as much damage as possible before it happened."`,]) : _pick([`"[leans back] ${_wasMole.sabotageCount} sabotage acts. Zero detection. I played two games at once and nobody knew."`, `"Every broken alliance, every leaked plan — that was me. And I'm sitting here with a clean record. You're welcome."`,]), cat: 'mole' },
      // Challenge record
      _chalWins >= 2 && { q: `"${_chalWins} challenge wins. ${_chalWins >= 4 ? 'You dominated.' : 'Solid record.'} Did that help or hurt your game?"`, a: _chalWins >= 4 ? _pick([`"It painted a target. Everyone knew I could win my way to the end. That's why they came for me at tribal instead."`, `"${_chalWins} wins made me a threat. But without them I'd have been gone way earlier."`,]) : _pick([`"Every win bought me another day. But it also put me on people's radar."`, `"I earned my spot through those challenges. The social game just didn't back it up."`,]), cat: 'challenge' },
      // General — data-specific
      { q: `"You lasted ${elimEpNum || '?'} episodes. ${_alliances.length ? `Part of ${_alliances.length} alliance${_alliances.length > 1 ? 's' : ''}.` : 'Never found a real alliance.'} Looking back — what's the one thing you'd change?"`, a: _alliances.length >= 3 ? `"Too many alliances. I spread myself too thin. By the end nobody believed me."` : _alliances.length === 0 ? `"I'd find an alliance day one. Playing alone doesn't work. I learned that the hard way."` : _pick([`"I'd trust my gut more. There were moments I KNEW something was wrong and I ignored it."`, `"One conversation. There's one conversation I'd have differently. And I'd probably still be out there."`,]), cat: 'regret' },
      { q: voters.length >= 3 ? `"${voters.length} people wrote your name. ${voters.slice(0, 2).join(', ')}${voters.length > 2 ? ` and ${voters.length - 2} more` : ''}. Any message for them?"` : `"Any last words for the tribe?"`, a: _pick([`"${voters[0] || 'You'} — I know what you did. And I respect it. Doesn't mean I forgive it."`, `"I hope you win. Because if you don't, that vote was for nothing."`, `"No message. They know what they did. I'll see them at the reunion."`,]), cat: 'message' },
    ].filter(Boolean);

    // Pick 3-4 unique questions, prioritizing rare/interesting ones
    const _rarecats = ['showmance', 'mole', 'betrayal', 'idol', 'enemy', 'affair', 'triangle'];
    const _rareQs = _allQAs.filter(q => _rarecats.includes(q.cat));
    const _normalQs = _allQAs.filter(q => !_rarecats.includes(q.cat));
    const _shuffledRare = _rareQs.sort(() => Math.random() - 0.5);
    const _shuffledNormal = _normalQs.sort(() => Math.random() - 0.5);
    const _pickedQAs = [..._shuffledRare.slice(0, 3), ..._shuffledNormal.slice(0, 3)].slice(0, 6);
    if (!_pickedQAs.length) _pickedQAs.push(..._shuffledNormal.slice(0, 4));

    // Closing statement based on archetype
    const lastWords = arch === 'villain' || arch === 'schemer'
      ? _pick([`"They haven't seen the last of me."`, `"I'd do it all again. Every single move."`, `"The game needed a villain. You're welcome."`, `"I didn't lose. I just ran out of time."`])
      : arch === 'hero'
      ? _pick([`"Play with integrity. That's all that matters."`, `"I'm proud of the game I played."`, `"Win or lose — I stayed true to myself."`, `"I hope I inspired someone out there."`])
      : arch === 'hothead' || arch === 'chaos-agent'
      ? _pick([`"I hope they all turn on each other."`, `"I regret NOTHING."`, `"This isn't over. Not for me."`, `"You're welcome for the entertainment."`])
      : arch === 'floater'
      ? _pick([`"I played a quieter game than people realize."`, `"Nobody noticed me until it was too late. Unfortunately, it was too late for me too."`, `"I flew under the radar. It just wasn't far enough."`])
      : arch === 'challenge-beast'
      ? _pick([`"I gave every challenge everything I had."`, `"They couldn't beat me in challenges. So they got me at tribal."`, `"I went out swinging. Literally."`])
      : _pick([`"It was an experience. That's what I'll take away."`, `"I gave it everything I had."`, `"No regrets. Well... maybe one or two."`, `"I'll be back. Count on it."`]);

    return { player: name, isActive, elimEpNum, arch, pop, crowdReaction, entranceQuote, questions: _pickedQAs, lastWords, voters };
  });

  // ── AFTERMATH MOMENTS — ALL qualifying moments fire, not just one ──
  const aftermathMoments = [];

  // Confrontation: two interviewees who hate each other — full dialogue
  for (let i = 0; i < interviewees.length; i++) {
    for (let j = i + 1; j < interviewees.length; j++) {
      const a1 = interviewees[i], a2 = interviewees[j];
      const _cBond = getBond(a1, a2);
      if (_cBond <= -3) {
        const _p1 = pronouns(a1), _p2 = pronouns(a2);
        const _incident = gs.episodeHistory.find(h => (h.defections || []).some(d => (d.player === a1 && d.votedFor === a2) || (d.player === a2 && d.votedFor === a1)));
        const _votedA1 = gs.episodeHistory.find(h => (h.votingLog || []).some(v => v.voter === a1 && v.voted === a2));
        const _votedA2 = gs.episodeHistory.find(h => (h.votingLog || []).some(v => v.voter === a2 && v.voted === a1));
        // Build actual dialogue
        const _lines = [];
        _lines.push({ speaker: _host, text: _incident ? `"Episode ${_incident.num}. One of you betrayed the other. Let's talk about it."` : `"You two. The audience saw everything. Let's get into it."` });
        if (_votedA1) {
          _lines.push({ speaker: a1, text: _pick([`"I voted for ${a2} in episode ${_votedA1.num}. And I'd do it again."`, `"Yeah, I wrote ${_p2.posAdj} name. ${_p2.Sub} know${_p2.sub === 'they' ? '' : 's'} why."`, `"I had my reasons. And ${a2} knows every single one of them."`]) });
          _lines.push({ speaker: a2, text: _pick([`"You sat there and LIED to my face. Don't act like it was just strategy."`, `"I trusted you. That's what makes it worse."`, `"I'm not surprised. I just wish you'd had the guts to say it to my face first."`]) });
        } else {
          _lines.push({ speaker: a1, text: _pick([`"${a2} made my life out there miserable. That's not gameplay — that's personal."`, `"I don't have anything nice to say about ${a2}. So I'll just say what's true."`, `"We tried to coexist. It didn't work. Some people just don't mix."`]) });
          _lines.push({ speaker: a2, text: _pick([`"The feeling is mutual. Ask anyone at camp."`, `"I'm not going to sit here and pretend we're fine. We're not."`, `"${a1} says it was personal. ${_p1.Sub} ${_p1.sub === 'they' ? 'are' : 'is'} right. It was."`]) });
        }
        _lines.push({ speaker: _host, text: _pick([`"Okay. I think the audience gets the picture."`, `"...and on that note, let's move on before someone throws a chair."`, `"The tension in here is REAL. That's what this show is about."`]) });
        aftermathMoments.push({ type: 'confrontation', players: [a1, a2], dialogue: _lines, text: '' });
        break;
      }
    }
  }

  // Gallery eruption: gallery member hates an interviewee — full dialogue
  peanutGallery.forEach(g => {
    const _target = interviewees.find(iv => getBond(g, iv) <= -5);
    if (_target) {
      const _gPr = pronouns(g), _tPr = pronouns(_target);
      const _gBond = getBond(g, _target);
      const _votedOut = gs.episodeHistory.find(h => h.eliminated === g && (h.votingLog || []).some(v => v.voter === _target && v.voted === g));
      const _lines = [];
      _lines.push({ speaker: g, text: _votedOut ? `"I've been sitting here since episode ${_votedOut.num} waiting to say this. ${_target}, you voted me out. I thought we were good."` : `"${_target}. You KNOW what you did to me out there. Don't sit there and pretend it was just a game."` });
      _lines.push({ speaker: _target, text: _pick([`"I played MY game. If you can't handle that, that's on you."`, `"I did what I had to do. I'm not apologizing."`, `"${g}, I hear you. But this is a competition. I made a call."`, `"...I actually feel bad about that one. But I'd still make the same choice."`]) });
      _lines.push({ speaker: g, text: _pick([`"That's exactly what I expected you to say."`, `"The audience sees right through you. Even if the tribe didn't."`, `"Say it to my face one more time. I dare you."`]) });
      _lines.push({ speaker: _host, text: _pick([`"And THAT is why we have a Peanut Gallery."`, `"Security is on standby. Just so everyone knows."`, `"The gallery has SPOKEN."`]) });
      aftermathMoments.push({ type: 'gallery_eruption', players: [g, _target], dialogue: _lines, text: '' });
    }
  });

  // Emotional moment: interviewee betrayed by close ally
  interviewees.forEach(name => {
    const _elimEp = gs.episodeHistory.find(h => h.eliminated === name);
    if (!_elimEp) return;
    const _betrayer = (_elimEp.votingLog || []).find(v => v.voted === name && getBond(name, v.voter) >= 4);
    if (_betrayer && pStats(name).temperament <= 5) {
      aftermathMoments.push({ type: 'emotional', players: [name], text: `${_host} brings up ${_betrayer.voter}. "${_betrayer.voter} was your closest ally. And then ${pronouns(_betrayer.voter).sub} wrote your name down." ${name} tries to answer. Can't. The crowd goes quiet. Even ${_host} gives ${pronouns(name).obj} a moment.` });
    }
  });

  // Standing ovation: ONLY popularity >= 8
  const _popular = interviewees.sort((a, b) => (gs.popularity?.[b] || 0) - (gs.popularity?.[a] || 0))[0];
  if (_popular && (gs.popularity?.[_popular] || 0) >= 8) {
    const _popScore = gs.popularity[_popular];
    const _popMoment = gs.episodeHistory.find(h => h.popularityDeltas?.[_popular]?.some(d => d.delta >= 3));
    aftermathMoments.push({ type: 'standing_ovation', players: [_popular], text: `${_popular} gets a standing ovation. The entire gallery is on their feet. Popularity score: ${_popScore}.${_popMoment ? ` The fans fell in love after episode ${_popMoment.num}.` : ''} ${_host}: "In all my years doing this — THAT is a reaction. ${_popular}, the fans adore you."` });
  }

  // Host roast: always available as the closer (game-specific, unique per player)
  const _roastTargets = gs.activePlayers.slice(0, 6);
  if (_roastTargets.length >= 3) {
    const _usedRoasts = new Set();
    const _roastLines = _roastTargets.map(p => {
      const rs = pStats(p); const rPr = pronouns(p); const rArch = rs.archetype || '';
      const _betrayals = gs.episodeHistory.filter(h => (h.defections || []).some(d => d.player === p)).length;
      const _chalWins = gs.chalRecord?.[p]?.wins || 0;
      const _chalBombs = gs.chalRecord?.[p]?.bombs || 0;
      const _allianceCount = (gs.namedAlliances || []).filter(a => a.members.includes(p)).length;
      const _votesReceived = gs.episodeHistory.reduce((n, h) => n + ((h.votes || {})[p] || 0), 0);
      const _bigMoves = gs.playerStates?.[p]?.bigMoves || 0;
      const _pop = gs.popularity?.[p] || 5;
      const _sideDeals = (gs.sideDeals || []).filter(d => d.players.includes(p)).length;
      const _showmance = (gs.showmances || []).find(s => s.players.includes(p));
      const _showPartner = _showmance?.players?.find(n => n !== p);
      // Build a pool of possible roasts for this player — all game-data-driven
      const pool = [];
      if (_betrayals >= 3) pool.push(`"${p} has betrayed ${_betrayals} alliances. At this point it's not strategy — it's a personality trait."`);
      if (_betrayals === 2) pool.push(`"${p} has betrayed two alliances. ${rPr.Sub} ${rPr.sub === 'they' ? 'call' : 'calls'} it 'adapting.' Everyone else calls it something different."`);
      if (_betrayals === 1) pool.push(`"${p} betrayed ${rPr.posAdj} alliance once. Just once. But nobody's forgotten."`);
      if (_chalWins >= 4) pool.push(`"${p} has won ${_chalWins} challenges. At what point do we just give ${rPr.obj} a trophy and send ${rPr.obj} home?"`);
      if (_chalWins >= 2) pool.push(`"${p}, ${_chalWins} challenge wins. Impressive. Now do something strategic with that."`);
      if (_chalBombs >= 3) pool.push(`"${p} has bombed ${_chalBombs} challenges. ${rPr.Sub} ${rPr.sub === 'they' ? 'are' : 'is'} single-handedly responsible for half ${rPr.posAdj} tribe's losses."`);
      if (_allianceCount >= 4) pool.push(`"${p} has been in ${_allianceCount} alliances. ${rPr.Sub} ${rPr.sub === 'they' ? 'collect' : 'collects'} alliances like they expire."`);
      if (_allianceCount >= 3) pool.push(`"${p} — three alliances deep. At this point, who ISN'T ${rPr.sub} aligned with?"`);
      if (_votesReceived >= 6) pool.push(`"${p} has received ${_votesReceived} votes and is STILL here. Like a cockroach. A very strategic cockroach."`);
      if (_votesReceived >= 4) pool.push(`"${p}, ${_votesReceived} votes against ${rPr.obj} so far. The tribe keeps trying. ${rPr.Sub} ${rPr.sub === 'they' ? 'keep' : 'keeps'} surviving."`);
      if (_sideDeals >= 3) pool.push(`"${p} has made ${_sideDeals} side deals. That's not an alliance strategy — that's a Ponzi scheme."`);
      if (_sideDeals >= 2) pool.push(`"${p} — final two deals with multiple people. ${rPr.Sub} can't take everyone to the end. Math doesn't work that way."`);
      if (_showPartner) pool.push(`"${p} and ${_showPartner}. How romantic. How strategically foolish."`);
      if (_bigMoves >= 3) pool.push(`"${p} has made ${_bigMoves} big moves. At some point the target on ${rPr.posAdj} back becomes a bullseye."`);
      if (_bigMoves === 0 && gs.episodeHistory.length >= 4) pool.push(`"${p}. Zero big moves. ${rPr.Sub} ${rPr.sub === 'they' ? 'are' : 'is'} playing the 'exist and hope nobody notices' strategy."`);
      if (_pop >= 8) pool.push(`"${p} — fan favorite. Which means everyone in the game wants ${rPr.obj} gone. Popularity is a death sentence out there."`);
      if (_pop <= 3) pool.push(`"${p}. The fans have spoken. They just didn't say anything nice."`);
      // Archetype-based (2+ options each to avoid repeats)
      if (rArch === 'villain') pool.push(`"${p} — the only player whose alliance members sleep with one eye open."`, `"${p}. Even ${rPr.posAdj} own reflection doesn't trust ${rPr.obj}."`, `"${p} is playing like a villain. Not the fun kind. The kind people root against."`);
      if (rArch === 'schemer') pool.push(`"${p} has a plan. And a backup plan. And a backup to the backup. None of them are working."`, `"${p} thinks ${rPr.sub}'${rPr.sub === 'they' ? 're' : 's'} the puppet master. The puppets disagree."`);
      if (rArch === 'floater') pool.push(`"${p} — has anyone checked if ${rPr.sub} ${rPr.sub === 'they' ? 'are' : 'is'} still playing?"`, `"I forgot ${p} was here. And I'm the HOST."`, `"${p}'s strategy: don't be interesting enough to eliminate."`);
      if (rArch === 'challenge-beast') pool.push(`"${p} wins challenges and nothing else. ${rPr.Sub} ${rPr.sub === 'they' ? 'have' : 'has'} the social game of a rock."`, `"${p}. Unbeatable in challenges. Invisible everywhere else."`);
      if (rArch === 'hothead') pool.push(`"${p} — one bad comment away from a tribal council meltdown. Every episode."`, `"${p}'s temperament has its own threat level. It's currently at orange."`);
      if (rArch === 'social-butterfly') pool.push(`"${p} talks to everyone. Commits to no one. It's giving politician."`, `"${p} knows everyone's secrets. The question is whether anyone knows ${rPr.posAdj}."`);
      if (rArch === 'underdog') pool.push(`"${p} — the underdog story that won't end. At some point, you're just a dog."`, `"${p} has survived everything. Through skill? Luck? Nobody's sure. Including ${rPr.obj}."`);
      if (rArch === 'hero') pool.push(`"${p} thinks ${rPr.sub}'${rPr.sub === 'they' ? 're' : 's'} the hero of this story. Somebody should tell ${rPr.obj} this isn't that kind of show."`, `"${p} — honorable, loyal, principled. Which is why ${rPr.sub}'ll finish third."`);
      if (rArch === 'mastermind') pool.push(`"${p} wants you to think ${rPr.sub}'${rPr.sub === 'they' ? 're' : 's'} the smartest person out there. The jury will decide that."`, `"${p} — the self-proclaimed mastermind. Self-proclaimed being the key word."`);
      if (rArch === 'chaos-agent') pool.push(`"${p} doesn't have a strategy. ${rPr.Sub} ${rPr.sub === 'they' ? 'have' : 'has'} a mood. And right now it's chaos."`, `"${p}. Nobody knows what ${rPr.sub}'ll do next. Including ${rPr.obj}."`);
      if (rArch === 'provider') pool.push(`"${p} keeps the tribe fed. The tribe keeps writing ${rPr.posAdj} name down. Gratitude isn't a game mechanic."`);
      // Stat-driven fallbacks (proportional — higher stat = funnier)
      if (rs.social >= 7 && !pool.some(r => r.includes('friends'))) pool.push(`"${p} — knows everyone, trusts everyone, will be blindsided by everyone."`, `"${p}'s social game is flawless. ${rPr.Sub} ${rPr.sub === 'they' ? 'are' : 'is'} going to be DEVASTATED when it doesn't save ${rPr.obj}."`);
      if (rs.strategic >= 7 && !pool.some(r => r.includes('running'))) pool.push(`"${p} thinks ${rPr.sub} ${rPr.sub === 'they' ? 'are' : 'is'} running this game. ${rPr.Sub} ${rPr.sub === 'they' ? 'are' : 'is'} running... something."`, `"${p} — strategic genius. Just ask ${rPr.obj}. ${rPr.Sub}'ll tell you."`);
      if (rs.boldness >= 7) pool.push(`"${p} is the boldest player left. Which is another way of saying the most reckless."`, `"${p} makes moves. Not all of them are smart. But ${rPr.sub} make${rPr.sub === 'they' ? '' : 's'} them."`);
      if (rs.loyalty >= 8) pool.push(`"${p} — loyal to a fault. Literally. The loyalty is going to get ${rPr.obj} eliminated."`, `"${p} has never broken a promise. How quaint. How doomed."`);
      if (rs.loyalty <= 3) pool.push(`"${p}'s word is worth exactly nothing. And everyone knows it. Yet people KEEP making deals with ${rPr.obj}."`, `"${p} — loyalty of a weathervane. Points wherever the wind blows."`);
      if (rs.temperament <= 3) pool.push(`"${p} is one bad tribal away from a complete meltdown. I've got the footage ready."`, `"${p}. I'd say something sharp but I'm genuinely afraid of the reaction."`);
      // Love triangle roasts
      const _triRoast = (gs.loveTriangles || []).find(t => t.center === p || t.suitors.includes(p));
      if (_triRoast) {
        if (_triRoast.center === p) {
          pool.push(`"${p} managed to have TWO showmances. Most people can't maintain one alliance, and ${rPr.sub} ${rPr.sub === 'they' ? 'are' : 'is'} out here collecting partners."`);
          pool.push(`"${p} — the center of a love triangle. Which sounds glamorous until you realize it means TWO people want to vote you out for personal reasons."`);
        } else if (_triRoast.resolution?.rejected === p) {
          pool.push(`"${p} got chosen last in the love triangle. At least in Schoolyard Pick you get sent to Exile — here ${rPr.sub} just ${rPr.sub === 'they' ? 'have' : 'has'} to watch."`);
          pool.push(`"${p}. Lost the love triangle AND the game. At least ${rPr.sub} ${rPr.sub === 'they' ? 'are' : 'is'} consistent."`);
        } else {
          pool.push(`"${p} won the love triangle. Congratulations. Now the entire tribe wants ${rPr.obj} both gone."`);
        }
      }
      // Affair roasts
      const _afRoast = (gs.affairs || []).find(af => af.cheater === p || af.partner === p || af.secretPartner === p);
      if (_afRoast) {
        if (_afRoast.cheater === p) {
          pool.push(`"${p} had a showmance AND a secret affair. Most people can't manage one relationship out here and ${rPr.sub} ${rPr.sub === 'they' ? 'are' : 'is'} running a franchise."`);
          pool.push(`"${p} — the first player to get eliminated from a relationship AND the game in the same week."`);
        } else if (_afRoast.partner === p) {
          pool.push(`"${p} trusted ${_afRoast.cheater}. Which is like trusting a snake to watch your eggs. But ${pronouns(_afRoast.cheater).sub} looked so sincere!"`);
        } else {
          pool.push(`"${p} — the other ${rPr.sub === 'she' ? 'woman' : rPr.sub === 'he' ? 'man' : 'person'}. Every reality show needs one. ${p} delivered."`);
        }
      }
      // Universal fallbacks (varied enough to never repeat)
      if (!pool.length) pool.push(
        `"${p}. ${rPr.Sub} ${rPr.sub === 'they' ? 'have' : 'has'} been here the whole time and I still can't describe ${rPr.posAdj} game in one sentence."`,
        `"${p} — the human equivalent of a participation trophy. Still in the game, but why?"`,
        `"${p}. No enemies. No big moves. No story. That's not a strategy — that's a waiting room."`,
        `"${p} is surviving, not playing. There's a difference. The jury knows it too."`
      );
      // Pick one that hasn't been used yet
      const _available = pool.filter(r => !_usedRoasts.has(r));
      const _chosen = _available.length ? _available[([...p].reduce((s,c) => s + c.charCodeAt(0), 0) + ep.num) % _available.length] : pool[0];
      _usedRoasts.add(_chosen);
      return _chosen;
    });
    aftermathMoments.push({ type: 'host_roast', players: _roastTargets, roasts: _roastLines, text: `${_host}: "Before we go — let's check in on the players still out there." The gallery leans forward. Nobody is safe.` });
  }

  // Remove empty/null moments
  const aftermathMoment = aftermathMoments.length ? aftermathMoments : null;

  // ── BUILD TRUTH OR ANVIL — confrontation scene per interviewee ──
  // Chris has RECEIPTS. He sets up what the player CLAIMED, asks "is that the truth?",
  // then either confirms or plays the tape with specific evidence. Full dialogue scene.
  const truthOrAnvil = interviewees.map(name => {
    const s = pStats(name);
    const pr = pronouns(name);
    const _host = seasonConfig.host || 'Chris';
    const _elimEp = gs.episodeHistory.find(h => h.eliminated === name || h.firstEliminated === name);

    // Build pool of contradictions — the gap between what they CLAIMED and what ACTUALLY happened
    const _contradictions = [];

    // Vote lie: told alliance one thing, voted another
    if (_elimEp?.votingLog) {
      const _theirVote = _elimEp.votingLog.find(v => v.voter === name);
      const _allianceTarget = (_elimEp.alliances || []).find(a => a.members?.includes(name))?.target;
      if (_theirVote && _allianceTarget && _theirVote.voted !== _allianceTarget && gs.activePlayers.includes(_theirVote.voted)) {
        _contradictions.push({
          setup: `You told your alliance you were voting ${_allianceTarget}. You wrote down ${_theirVote.voted}.`,
          evidence: `Episode ${_elimEp.num} vote log: ${name} → ${_theirVote.voted}. Alliance target was ${_allianceTarget}.`,
          affected: [_theirVote.voted],
          type: 'vote-lie', drama: 8
        });
      }
    }

    // Fake deal: made a deal they never intended to honor
    const _fakeDeal = (gs.sideDeals || []).find(d => d.players.includes(name) && !d.genuine);
    if (_fakeDeal) {
      const _other = _fakeDeal.players.find(p => p !== name);
      const _otherPr = _other ? pronouns(_other) : { sub: 'they', obj: 'them', pos: 'their' };
      _contradictions.push({
        setup: `You made a ${_fakeDeal.type} deal with ${_other} in episode ${_fakeDeal.madeEp}. You shook on it. You looked ${_otherPr.obj} in the eye.`,
        evidence: `Deal flagged as non-genuine at creation. ${name} never intended to honor the ${_fakeDeal.type} pact.`,
        affected: _other && gs.activePlayers.includes(_other) ? [_other] : [],
        type: 'fake-deal', drama: 7
      });
    }

    // Perceived bond gap: told someone they were tight, real bond was negative
    if (gs.perceivedBonds) {
      const _gapKey = Object.keys(gs.perceivedBonds).find(k => {
        const [from] = k.split('→');
        if (from !== name) return false;
        const data = gs.perceivedBonds[k];
        const [, to] = k.split('→');
        return data.perceived >= 3 && getBond(name, to) <= 0 && gs.activePlayers.includes(to);
      });
      if (_gapKey) {
        const [, _gapTarget] = _gapKey.split('→');
        const _gapData = gs.perceivedBonds[_gapKey];
        _contradictions.push({
          setup: `You told ${_gapTarget} you had ${pronouns(_gapTarget).posAdj} back. You said you two were solid.`,
          evidence: `${name} perceived bond with ${_gapTarget}: +${_gapData.perceived.toFixed(1)}. Actual bond: ${getBond(name, _gapTarget).toFixed(1)}. The trust was one-directional.`,
          affected: [_gapTarget],
          type: 'bond-gap', drama: 7
        });
      }
    }

    // Double agent: in 2+ alliances with conflicting targets
    const _myAlliances = (gs.namedAlliances || []).filter(a => a.members.includes(name));
    if (_myAlliances.length >= 2) {
      const _a1 = _myAlliances[0], _a2 = _myAlliances[1];
      _contradictions.push({
        setup: `You were in ${_a1.name}. You were ALSO in ${_a2.name}. Those alliances had different targets. You told each one you were loyal.`,
        evidence: `${_a1.name} members: ${_a1.members.join(', ')}. ${_a2.name} members: ${_a2.members.join(', ')}. Overlapping membership: ${name}.`,
        affected: [..._a1.members, ..._a2.members].filter(m => m !== name && gs.activePlayers.includes(m)).slice(0, 2),
        type: 'double-agent', drama: 6
      });
    }

    // Hidden advantage: found something and never told anyone
    const _secretAdv = gs.advantages?.find(a => a.holder === name);
    if (_secretAdv) {
      const _typeLabel = { idol: 'Hidden Immunity Idol', extraVote: 'Extra Vote', voteSteal: 'Vote Steal', soleVote: 'Sole Vote', safetyNoPower: 'Safety Without Power' }[_secretAdv.type] || _secretAdv.type;
      _contradictions.push({
        setup: `Your tribemates thought you were playing clean. No advantages. Nothing hidden.`,
        evidence: `${name} held a ${_typeLabel} since episode ${_secretAdv.foundEp || '?'}. Never disclosed it.`,
        affected: [],
        type: 'hidden-advantage', drama: 5
      });
    }

    // Mole identity
    if (gs.moles?.some(m => m.player === name && !m.exposed)) {
      const _mole = gs.moles.find(m => m.player === name);
      _contradictions.push({
        setup: `You played the loyal teammate for ${_mole.sabotageCount || 0} episodes. You sat around the fire. You voted with the group. You looked concerned when things went wrong.`,
        evidence: `${name} was The Mole. ${_mole.sabotageCount || 0} sabotage acts. ${(_mole.sabotageLog || []).map(s => s.type).filter((v,i,a) => a.indexOf(v) === i).join(', ') || 'None logged'}.`,
        affected: [],
        type: 'mole', drama: 10
      });
    }

    // Betrayal: voted against their own alliance
    const _betrayalEp = gs.episodeHistory.find(h => (h.defections || []).some(d => d.player === name));
    if (_betrayalEp) {
      const _defection = _betrayalEp.defections.find(d => d.player === name);
      const _alliance = (_betrayalEp.alliances || []).find(a => a.members?.includes(name));
      if (_alliance) {
        _contradictions.push({
          setup: `You were in an alliance. You said you were loyal. At tribal council in episode ${_betrayalEp.num}, you flipped.`,
          evidence: `${name} defected from ${_alliance.label || 'the alliance'} in episode ${_betrayalEp.num}. The group voted ${_alliance.target || '?'}. ${name} voted elsewhere.`,
          affected: _alliance.members?.filter(m => m !== name && gs.activePlayers.includes(m)).slice(0, 2) || [],
          type: 'betrayal', drama: 6
        });
      }
    }

    // Who they REALLY hated but never said
    const _worstActive = gs.activePlayers.filter(p => p !== name).sort((a, b) => getBond(name, a) - getBond(name, b))[0];
    if (_worstActive && getBond(name, _worstActive) <= -3) {
      _contradictions.push({
        setup: `You and ${_worstActive} — you were civil. Polite. Never a public fight. But the data tells a different story.`,
        evidence: `Bond between ${name} and ${_worstActive}: ${getBond(name, _worstActive).toFixed(1)}. That's not "civil." That's hostility with a smile.`,
        affected: [_worstActive],
        type: 'hidden-hatred', drama: 5
      });
    }

    // Showmance betrayal — voted out partner (higher drama than generic showmance)
    const _showmanceBetray = (gs.showmances || []).find(sh => sh.breakupVoter === name);
    if (_showmanceBetray) {
      const _betrayPartner = _showmanceBetray.players.find(p => p !== name);
      _contradictions.push({
        setup: `You voted out the person you were sleeping next to every night. ${_betrayPartner}. Look ${pronouns(_betrayPartner).obj} in the eye and explain.`,
        evidence: `Showmance from episode ${_showmanceBetray.sparkEp}. Voted out partner in episode ${_showmanceBetray.breakupEp}. Bond at breakup: ${getBond(name, _betrayPartner).toFixed(1)}.`,
        affected: [_betrayPartner].filter(p => [...gs.activePlayers, ...(gs.jury || [])].includes(p)),
        type: 'showmance-betrayal', drama: 8
      });
    }

    // Showmance secret
    const _showmance = (gs.showmances || []).find(sh => sh.players.includes(name));
    if (_showmance) {
      const _partner = _showmance.players.find(p => p !== name);
      if (_showmance.phase === 'broken') {
        _contradictions.push({
          setup: `You and ${_partner}. The whole camp was talking about it. You told people it was real.`,
          evidence: `Showmance status: broken. It ended. ${name} and ${_partner} are done — but the tribe doesn't know yet.`,
          affected: _partner && gs.activePlayers.includes(_partner) ? [_partner] : [],
          type: 'showmance', drama: 6
        });
      } else if (gs.activePlayers.includes(_partner)) {
        _contradictions.push({
          setup: `You and ${_partner}. Everyone saw the looks. The whispers. Was it strategy or was it real?`,
          evidence: `Showmance active since episode ${_showmance.sparkEp}. Bond: ${getBond(name, _partner).toFixed(1)}.`,
          affected: [_partner],
          type: 'showmance', drama: 4
        });
      }
    }

    // Love triangle secret
    const _triangle = (gs.loveTriangles || []).find(t =>
      t.center === name || t.suitors.includes(name));
    if (_triangle) {
      const _triRole = _triangle.center === name ? 'center'
        : (_triangle.resolution?.rejected === name ? 'rejected' : 'chosen');
      const _triResolved = _triangle.resolved;
      const _triDrama = _triResolved && _triangle.resolution?.type === 'chose' ? 8
        : _triResolved ? 6 : 7;
      const _triOther1 = _triangle.center === name ? _triangle.suitors[0] : _triangle.center;
      const _triOther2 = _triangle.center === name ? _triangle.suitors[1]
        : _triangle.suitors.find(s => s !== name) || _triangle.center;

      if (_triRole === 'center') {
        _contradictions.push({
          setup: `You had two people fighting for you out there. ${_triOther1} and ${_triOther2}. The whole tribe watched it happen. Did you ever actually care about both of them — or were you stringing one along?`,
          evidence: `Love triangle formed episode ${_triangle.formedEp}. ${_triResolved && _triangle.resolution?.type === 'chose' ? `Chose ${_triangle.resolution.chosen}, rejected ${_triangle.resolution.rejected}.` : `Resolved: ${_triangle.resolution?.type || 'ongoing'}.`} Jealousy level peaked at ${_triangle.jealousyLevel.toFixed(1)}.`,
          affected: [_triOther1, _triOther2].filter(p => [...gs.activePlayers, ...(gs.jury || [])].includes(p)),
          type: 'love-triangle', drama: _triDrama
        });
      } else if (_triRole === 'rejected') {
        _contradictions.push({
          setup: `You and ${_triangle.center}. Everyone saw how you looked at ${pronouns(_triangle.center).obj}. And then ${_triangle.center} chose ${_triangle.resolution?.chosen || 'someone else'}. Were you blindsided — or did you see it coming?`,
          evidence: `Rejected in episode ${_triangle.resolution?.ep || '?'}. Bond crashed by ${Math.abs(_triangle.resolution?.bondCrash || 0).toFixed(1)}. Severity: ${(_triangle.resolution?.severity || 0).toFixed(1)}.`,
          affected: [_triangle.center].filter(p => [...gs.activePlayers, ...(gs.jury || [])].includes(p)),
          type: 'love-triangle', drama: _triDrama
        });
      } else {
        _contradictions.push({
          setup: `You won the triangle — ${_triangle.center} chose you over ${_triangle.resolution?.rejected || 'someone else'}. But honestly... did you ever worry you were the backup plan?`,
          evidence: `Chosen in episode ${_triangle.resolution?.ep || '?'}. Triangle lasted ${_triangle.episodesActive} episodes.`,
          affected: [_triangle.center, _triangle.resolution?.rejected].filter(p => p && [...gs.activePlayers, ...(gs.jury || [])].includes(p)),
          type: 'love-triangle', drama: _triDrama
        });
      }
    }

    // Secret affair
    const _affair = (gs.affairs || []).find(af =>
      af.cheater === name || af.partner === name || af.secretPartner === name || (af.caughtBy === name && !af.caughtTold));
    if (_affair) {
      const _afRole = _affair.cheater === name ? 'cheater'
        : _affair.partner === name ? 'betrayed'
        : _affair.secretPartner === name ? 'secret'
        : 'catcher';
      const _afDrama = 9;
      if (_afRole === 'cheater') {
        _contradictions.push({
          setup: `You were in a showmance with ${_affair.partner}. You told ${pronouns(_affair.partner).obj} it was real. But the cameras caught you with ${_affair.secretPartner}. Every. Single. Night. So — truth or anvil. Was any of it real?`,
          evidence: `Secret affair started episode ${_affair.formedEp}. ${_affair.resolved ? `Exposed episode ${_affair.resolution?.ep || '?'}.` : 'Still hidden.'} ${_affair.complicit ? `${_affair.secretPartner} knew about the showmance.` : `${_affair.secretPartner} didn't know.`}`,
          affected: [_affair.partner, _affair.secretPartner].filter(p => [...gs.activePlayers, ...(gs.jury || [])].includes(p)),
          type: 'affair', drama: _afDrama
        });
      } else if (_afRole === 'betrayed') {
        _contradictions.push({
          setup: `You trusted ${_affair.cheater}. The whole tribe knew before you did. How does that feel to hear right now?`,
          evidence: `${_affair.cheater} had a secret affair with ${_affair.secretPartner} starting episode ${_affair.formedEp}.`,
          affected: [_affair.cheater].filter(p => [...gs.activePlayers, ...(gs.jury || [])].includes(p)),
          type: 'affair', drama: _afDrama
        });
      } else if (_afRole === 'secret') {
        const _secSetup = _affair.complicit
          ? `You knew ${_affair.cheater} was with ${_affair.partner}. You didn't care. Own it or deny it.`
          : `You got played too. ${_affair.cheater} told you ${pronouns(_affair.cheater).sub} ${pronouns(_affair.cheater).sub === 'they' ? 'were' : 'was'} single. Finding out on national TV — what went through your head?`;
        _contradictions.push({
          setup: _secSetup,
          evidence: `${_affair.complicit ? 'Knew about the showmance — complicit.' : 'Did not know — also a victim.'} Affair lasted ${_affair.episodesActive} episodes.`,
          affected: [_affair.cheater, _affair.partner].filter(p => [...gs.activePlayers, ...(gs.jury || [])].includes(p)),
          type: 'affair', drama: _afDrama
        });
      } else {
        _contradictions.push({
          setup: `You SAW ${_affair.cheater} with ${_affair.secretPartner}. You said nothing. ${_affair.partner} was right there. Why?`,
          evidence: `Caught the affair but kept silent. ${_affair.partner} didn't find out from ${name}.`,
          affected: [_affair.partner, _affair.cheater].filter(p => [...gs.activePlayers, ...(gs.jury || [])].includes(p)),
          type: 'affair', drama: 7
        });
      }
    }

    // TDD pact betrayal
    if (ep.tripleDogDare?.pacts?.length && ep.tripleDogDare?.betrayals?.length) {
      const _tddPactBetrayals = ep.tripleDogDare.betrayals.filter(b =>
        ep.tripleDogDare.pacts.some(p =>
          (p.initiator === b.player || p.partner === b.player) &&
          (p.initiator === b.target || p.partner === b.target)
        )
      );
      _tddPactBetrayals.forEach(b => {
        _contradictions.push({
          type: 'tdd-pact-betrayal',
          player: b.player,
          evidence: `Made a pact with ${b.target} during the dare challenge, then ${b.type === 'redirect' ? 'redirected a dare to them' : 'refused to share a freebie'}`,
          drama: 7
        });
      });
    }

    // Fallback: clean game
    if (!_contradictions.length) {
      _contradictions.push({
        setup: `I looked through every episode. Every vote. Every conversation. And honestly?`,
        evidence: `No contradictions found. ${name} played clean.`,
        affected: [],
        type: 'clean', drama: 1
      });
    }

    // Pick highest drama contradiction
    _contradictions.sort((a, b) => b.drama - a.drama);
    const chosen = _contradictions[0];

    // Clean game — no confrontation, just a quick acknowledgment
    if (chosen.type === 'clean') {
      const _cleanLines = [
        `"${name}. I went through everything. Every vote, every conversation, every confessional. And I've got nothing on you." ${_host} shrugs. "You played clean. The audience respects it — even if it doesn't make great TV."`,
        `"${name}, I tried to find something. Anything. A lie, a betrayal, a secret deal." ${_host} holds up empty hands. "Nothing. You actually played an honest game. How boring." The gallery laughs.`,
        `"I'll be honest, ${name} — there's no anvil here. You said what you meant and you did what you said." ${_host} pauses. "I almost respect it. Almost."`,
      ];
      const dialogue = [{ speaker: _host, text: _pick(_cleanLines) }];
      return { player: name, secretType: 'clean', toldTruth: true, dialogue, evidence: null, consequence: '', affectedPlayers: [] };
    }

    // Truth or lie: loyalty + temperament determine honesty
    const toldTruth = Math.random() < (s.loyalty * 0.08 + s.temperament * 0.03);

    // Build the confrontation dialogue
    const dialogue = [];
    // 1. Chris sets up what they claimed
    dialogue.push({ speaker: _host, text: `"${name}. Let's talk about something." ${_host} leans forward. "I have the receipts."` });
    dialogue.push({ speaker: _host, text: `"${chosen.setup}"` });
    // 2. Chris asks the question
    dialogue.push({ speaker: _host, text: `"Is that the truth? Or are you going to make me pull the tape?"` });
    // 3. Player responds
    if (toldTruth) {
      // They come clean — archetype flavors the delivery
      const _confessionTexts = s.boldness >= 7
        ? [`"Fine. You want the truth? Here it is. Yeah. I did that. And I'd do it again."`, `"I'm not going to sit here and lie about it. I did what I did."`, `"You got me. I owned it then, I'll own it now."`]
        : s.temperament >= 7
        ? [`"...yeah. That's what happened. I'm not proud of all of it, but I'm not going to pretend it didn't happen."`, `"Look, I'll tell you the truth. It's complicated, but yes — that's accurate."`, `"I owe people that honesty. So yeah. That happened."`]
        : s.temperament <= 3
        ? [`"OF COURSE that's what happened! What, you think I was going to play nice?! This is a GAME!"`, `"Yeah! And?! Everyone's out here lying! At least I'm honest about being dishonest!"`, `"You want me to feel bad about it? I don't. I played to WIN."`]
        : [`"...yeah. I mean, yeah. You already know the answer."`, `"I'm not going to lie to you. Not here. Not now."`, `"The truth is... yes. All of it."`];
      dialogue.push({ speaker: name, text: _pick(_confessionTexts) });
      dialogue.push({ speaker: _host, text: chosen.affected.length
        ? `"${chosen.affected[0]} has no idea you just said that. But when this airs — and it WILL air — that changes everything." The gallery murmurs.`
        : `"Respect. That took guts to admit on live television."` });
    } else {
      // They lied — Chris drops the anvil
      const _lieTexts = s.strategic >= 7
        ? [`"That's... not exactly how I remember it. There's more context to it than that."`, `"You're framing it in a way that makes me look worse than it was."`, `"I think 'truth' is subjective in this game. My truth is different from what you're implying."`]
        : s.social >= 7
        ? [`"What? No. That's not — I would never do that."`, `"I don't know where you're getting this. I played with integrity."`, `"That's just not true. Ask anyone. They'll tell you."`]
        : [`"I... don't remember it that way."`, `"That's not what happened."`, `"You've got it wrong."`];
      dialogue.push({ speaker: name, text: _pick(_lieTexts) });
      // ANVIL moment — Chris shows the evidence
      dialogue.push({ speaker: _host, text: `"Really?" ${_host} reaches behind the desk. "Because I have something that says otherwise."` });
      dialogue.push({ speaker: _host, text: `"ANVIL." The screen behind them lights up: ${chosen.evidence}`, isAnvil: true });
      // Gallery reaction
      const _galleryReact = chosen.affected.length
        ? (gs.activePlayers.includes(chosen.affected[0])
          ? `The gallery erupts. ${chosen.affected[0]} doesn't know yet — but this footage will make it back to camp. It always does.`
          : `The gallery erupts. ${chosen.affected[0]} is sitting right there in the gallery. ${pronouns(chosen.affected[0]).Sub} just saw everything.`)
        : `The gallery erupts. ${name} has nowhere to hide.`;
      dialogue.push({ speaker: _host, text: `${_galleryReact}` });
      // Player reacts to being caught
      const _caughtTexts = s.temperament <= 3
        ? [`"This is BULL — you can't just — that's taken out of CONTEXT!"`, `"Are you SERIOUS right now?! This show is RIGGED!"`, `"Whatever. WHATEVER. The game is the game."`]
        : s.boldness >= 7
        ? [`"...okay. You got me. What do you want me to say?"`, `"Fine. Play it. Play the whole thing. I stand by it."`, `"You think that scares me? I knew what I was doing."`]
        : [`"...I don't have anything to say to that."`, `${name} stares at the floor. The silence says everything.`, `"...can we move on?"`, `${name} opens ${pr.posAdj} mouth. Closes it. Looks at the ceiling.`];
      dialogue.push({ speaker: name, text: _pick(_caughtTexts) });
    }

    // Consequences: actual bond/heat effects for affected active players
    let consequence = '';
    if (chosen.affected.length && gs.activePlayers.includes(chosen.affected[0])) {
      const _aff = chosen.affected[0];
      addBond(_aff, name, toldTruth ? -0.3 : -1.0);
      consequence = toldTruth
        ? `Word gets back to ${_aff} next episode. Bond with ${name} drops (-0.3).`
        : `When this airs, ${_aff} will see everything. Bond with ${name} drops hard (-1.0).`;
    }

    return { player: name, secretType: chosen.type, toldTruth, dialogue, evidence: chosen.evidence, consequence, affectedPlayers: chosen.affected };
  });

  // ── BUILD UNSEEN FOOTAGE ──
  const unseenFootage = [];
  const _recentEps = gs.episodeHistory.filter(h => h.num > lastAftermath && h.num <= curEp);

  // Mole sabotage clips
  if (gs.moles?.length) {
    gs.moles.forEach(mole => {
      const recentActs = mole.sabotageLog.filter(s => s.ep > lastAftermath && s.ep <= curEp).slice(-2);
      recentActs.forEach(act => {
        const _labels = { bondSabotage: 'fabricated a conflict', challengeThrow: 'threw the challenge', challengeSabotage: 'sabotaged someone in the challenge', infoLeak: 'leaked intel', voteDisruption: 'disrupted the vote', advantageSabotage: 'sabotaged an advantage' };
        const detail = act.targets ? `between ${act.targets.join(' and ')}` : act.target ? `targeting ${act.target}` : act.leakedTo ? `to ${act.leakedTo}` : '';
        unseenFootage.push({ sourceEp: act.ep, type: 'mole', description: `In episode ${act.ep}, ${mole.player} ${_labels[act.type] || act.type} ${detail}. Nobody knew.`, players: [mole.player, ...(act.targets || []), act.target].filter(Boolean), classified: true, drama: 8 });
      });
    });
  }

  // Fake side deals
  const _recentDeals = (gs.sideDeals || []).filter(d => d.madeEp > lastAftermath && d.madeEp <= curEp && !d.genuine);
  _recentDeals.forEach(d => {
    const dp = pronouns(d.players[0]);
    unseenFootage.push({ sourceEp: d.madeEp, type: 'deal', description: `${d.players[0]} shook ${d.players[1]}'s hand on a ${d.type} deal in episode ${d.madeEp}. ${dp.Sub} never meant a word of it.`, players: [...d.players], classified: false, drama: 6 });
  });

  // Showmance moments — secret confessionals, jealousy, breakups
  (gs.showmances || []).forEach(sh => {
    if (sh.sparkEp > lastAftermath && sh.sparkEp <= curEp) {
      const [a, b] = sh.players;
      unseenFootage.push({ sourceEp: sh.sparkEp, type: 'showmance', description: `What the cameras caught that the tribe didn't — ${a} and ${b} by the fire, episode ${sh.sparkEp}. The conversation went long. The looks went longer. This wasn't strategy.`, players: [a, b], classified: false, drama: 5 });
    }
    if (sh.jealousPlayer && sh.phase !== 'broken') {
      const [a, b] = sh.players;
      const jp = sh.jealousPlayer;
      unseenFootage.push({ sourceEp: curEp, type: 'showmance-jealousy', description: `${jp} has been watching ${a} and ${b} get closer. The jealousy is quiet but visible — and it's starting to affect ${pronouns(jp).posAdj} game decisions.`, players: [jp, a, b], classified: false, drama: 5 });
    }
    if (sh.phase === 'broken') {
      const [a, b] = sh.players;
      const _breakEp = _recentEps.find(h => h.showmanceBreakup?.players?.includes(a));
      if (_breakEp) {
        unseenFootage.push({ sourceEp: _breakEp.num, type: 'showmance-breakup', description: `It's over. ${a} and ${b} — what started as a showmance ended in silence. The cameras caught the exact moment it fell apart. The tribe hasn't figured it out yet.`, players: [a, b], classified: false, drama: 7 });
      }
    }
  });

  // Perceived bond gaps — player thinks they're close to someone who's plotting against them
  if (gs.perceivedBonds) {
    Object.entries(gs.perceivedBonds).forEach(([key, data]) => {
      const [from, to] = key.split('→');
      if (!gs.activePlayers.includes(from) || !gs.activePlayers.includes(to)) return;
      const realBond = getBond(from, to);
      if (data.perceived >= 3 && realBond <= 0) {
        unseenFootage.push({ sourceEp: curEp, type: 'perception-gap', description: `${from} thinks ${to} is ${pronouns(from).posAdj} closest ally. The real bond tells a different story. ${to} has been pulling away for episodes — and ${from} has no idea.`, players: [from, to], classified: true, drama: 7 });
      }
    });
  }

  // Betrayal planning — someone voted against their alliance and nobody called it out
  _recentEps.forEach(h => {
    (h.defections || []).forEach(d => {
      if (!gs.activePlayers.includes(d.player)) return;
      const dp = pronouns(d.player);
      unseenFootage.push({ sourceEp: h.num, type: 'betrayal', description: `Episode ${h.num}. The alliance voted one way. ${d.player} voted another. ${dp.Sub} walked back to camp like nothing happened. The tribe still doesn't know.`, players: [d.player], classified: true, drama: 7 });
    });
  });

  // Challenge throws — someone threw a challenge and got away with it
  _recentEps.forEach(h => {
    (h.challengeThrows || []).forEach(ct => {
      if (!ct.detected && gs.activePlayers.includes(ct.player)) {
        const tp = pronouns(ct.player);
        unseenFootage.push({ sourceEp: h.num, type: 'challenge-throw', description: `${ct.player} threw the challenge in episode ${h.num}. Deliberately underperformed. The tribe blamed bad luck. It wasn't luck.`, players: [ct.player], classified: true, drama: 6 });
      }
    });
  });

  // Secret idol finds — someone found an idol and told nobody
  _recentEps.forEach(h => {
    (h.idolFinds || []).forEach(find => {
      if (!gs.activePlayers.includes(find.finder)) return;
      // Check if anyone else knows
      const isSecret = !gs.knownIdolHoldersPersistent?.has?.(find.finder) && !(gs.knownIdolHoldersThisEp instanceof Set && gs.knownIdolHoldersThisEp.has(find.finder));
      if (isSecret) {
        const fp = pronouns(find.finder);
        unseenFootage.push({ sourceEp: h.num, type: 'idol-find', description: `Episode ${h.num}. ${find.finder} found a Hidden Immunity Idol at ${find.location || 'camp'}. ${fp.Sub} told nobody. It's still in ${fp.posAdj} bag, waiting for the right moment.`, players: [find.finder], classified: true, drama: 6 });
      }
    });
  });

  // Alliance scheming — a dissolved alliance or one with betrayals
  (gs.namedAlliances || []).filter(a => !a.active && a.betrayals?.length).forEach(a => {
    const _betrayalEps = _recentEps.filter(h => a.betrayals.some(b => (h.defections || []).some(d => d.player === b)));
    if (_betrayalEps.length) {
      const betrayer = a.betrayals[0];
      if (gs.activePlayers.includes(betrayer)) {
        unseenFootage.push({ sourceEp: _betrayalEps[0].num, type: 'alliance-collapse', description: `${a.name} is dead. ${betrayer} killed it. The cameras caught the exact conversation where ${pronouns(betrayer).sub} decided to flip — the rest of the alliance was asleep.`, players: [betrayer, ...a.members.filter(m => m !== betrayer && gs.activePlayers.includes(m)).slice(0, 2)], classified: false, drama: 7 });
      }
    }
  });

  // Loyalty test resolution — someone planted false info and it spread (or didn't)
  (gs.loyaltyTests || []).filter(lt => lt.resolved && lt.plantedEp > lastAftermath && lt.plantedEp <= curEp).forEach(lt => {
    const spread = lt.result === 'spread';
    const tp = pronouns(lt.tester);
    unseenFootage.push({ sourceEp: lt.plantedEp, type: 'loyalty-test', description: spread
      ? `${lt.tester} planted false information with ${lt.target} in episode ${lt.plantedEp}. It spread. ${lt.target} failed the loyalty test — and doesn't even know ${tp.sub} ${tp.sub === 'they' ? 'were' : 'was'} being tested.`
      : `${lt.tester} planted false information with ${lt.target}. It stayed quiet. ${lt.target} passed the test — ${tp.sub} earned ${lt.tester}'s trust without knowing it.`,
      players: [lt.tester, lt.target], classified: true, drama: spread ? 6 : 4 });
  });

  // Love triangle footage
  (gs.loveTriangles || []).forEach(tri => {
    const triPr = pronouns(tri.center);
    unseenFootage.push({
      sourceEp: tri.formedEp,
      type: 'love-triangle',
      description: `What the cameras caught between the fire and the shelter... ${tri.center} pulled aside by ${tri.suitors[0]}, then found talking with ${tri.suitors[1]} an hour later. The triangle the tribe suspected — confirmed.`,
      players: [tri.suitors[0], tri.center, tri.suitors[1]],
      classified: true,
      drama: 7
    });
    if (tri.phase === 'escalation' || tri.phase === 'ultimatum' || tri.resolved) {
      unseenFootage.push({
        sourceEp: tri.resolution?.ep || tri.formedEp + tri.episodesActive,
        type: 'love-triangle',
        description: `The confrontation between ${tri.suitors[0]} and ${tri.suitors[1]} over ${tri.center}. Voices low but sharp. "${triPr.Sub} ${triPr.sub === 'they' ? 'were' : 'was'} mine first." The cameras caught every word.`,
        players: [tri.suitors[0], tri.suitors[1]],
        classified: true,
        drama: 6
      });
    }
  });

  // Affair footage
  (gs.affairs || []).forEach(af => {
    const afPr = pronouns(af.cheater);
    unseenFootage.push({
      sourceEp: af.formedEp,
      type: 'affair',
      description: `What the cameras caught after everyone fell asleep... ${af.cheater} and ${af.secretPartner} on the beach. The showmance with ${af.partner}? A lie. This is the real story.`,
      players: [af.cheater, af.secretPartner, af.partner],
      classified: true,
      drama: 9
    });
    if (af.caughtBy && !af.caughtTold) {
      unseenFootage.push({
        sourceEp: af.resolution?.ep || af.formedEp + af.episodesActive,
        type: 'affair',
        description: `${af.caughtBy} saw everything. Watched ${af.cheater} walk back to ${af.partner} like nothing happened. And said nothing.`,
        players: [af.caughtBy, af.cheater],
        classified: true,
        drama: 7
      });
    }
    if (af.resolved && af.resolution?.type === 'eliminated' && af.exposure === 'hidden') {
      unseenFootage.push({
        sourceEp: af.resolution.ep,
        type: 'affair',
        description: `${af.cheater} left the game with a secret ${afPr.sub} never told ${af.partner}. The affair with ${af.secretPartner} — hidden from start to finish. Until now.`,
        players: [af.cheater, af.secretPartner, af.partner],
        classified: true,
        drama: 8
      });
    }
  });

  // Triple Dog Dare betrayals
  if (ep.tripleDogDare?.betrayals?.length) {
    ep.tripleDogDare.betrayals.forEach(b => {
      unseenFootage.push({
        type: 'tdd-betrayal',
        drama: 7,
        text: b.type === 'redirect'
          ? `During the Triple Dog Dare, ${b.player} redirected a dare to their own ally ${b.target}. The cameras caught every second of it.`
          : `${b.player} had a freebie to spare. ${b.target} was running on empty. ${b.player} kept it. The cameras saw.`,
        players: [b.player, b.target]
      });
    });
  }

  // Sort by drama score and cap at 3 best clips
  unseenFootage.sort((a, b) => (b.drama || 0) - (a.drama || 0));
  unseenFootage.splice(3);

  // ── BUILD FAN CALL — game-data-driven mini-interview with 3 exchanges ──
  const _fanNames = ['Alex', 'Jordan', 'Riley', 'Casey', 'Morgan', 'Taylor', 'Drew', 'Pat', 'Quinn', 'Avery', 'Reese', 'Skyler'];
  const _fanTarget = interviews.sort((a, b) => Math.abs(b.pop) - Math.abs(a.pop))[0]?.player || interviewees[0];
  const _ftS = pStats(_fanTarget);
  const _ftPr = pronouns(_fanTarget);
  const _ftArch = _ftS.archetype || '';
  const _ftElimEp = gs.episodeHistory.find(h => h.eliminated === _fanTarget || h.firstEliminated === _fanTarget);
  const _ftVoters = (_ftElimEp?.votingLog || []).filter(v => v.voted === _fanTarget).map(v => v.voter);
  const _ftWorstEnemy = gs.activePlayers.filter(p => p !== _fanTarget).sort((a, b) => getBond(_fanTarget, a) - getBond(_fanTarget, b))[0];
  const _ftBestAlly = [...gs.activePlayers, ...allEliminated].filter(p => p !== _fanTarget).sort((a, b) => getBond(_fanTarget, b) - getBond(_fanTarget, a))[0];
  const _ftShowmance = gs.showmances?.find(sh => sh.players.includes(_fanTarget));
  const _ftBetrayals = gs.episodeHistory.filter(h => (h.defections || []).some(d => d.player === _fanTarget)).length;
  const _ftBetrayedBy = _ftElimEp ? (_ftElimEp.votingLog || []).find(v => v.voted === _fanTarget && getBond(_fanTarget, v.voter) >= 3) : null;
  const _ftChalWins = gs.chalRecord?.[_fanTarget]?.wins || 0;
  const _ftBigMoves = gs.playerStates?.[_fanTarget]?.bigMoves || 0;
  const _ftIdolPlayed = gs.episodeHistory.some(h => (h.idolPlays || []).some(ip => ip.player === _fanTarget));
  const _ftAlliances = (gs.namedAlliances || []).filter(a => a.members.includes(_fanTarget));
  const _ftSideDeals = (gs.sideDeals || []).filter(d => d.players.includes(_fanTarget));
  const _ftWasMole = gs.moles?.some(m => m.player === _fanTarget);
  const _ftVotedFor = _ftElimEp?.votingLog?.find(v => v.voter === _fanTarget);

  // Build a POOL of game-specific questions — each fan type draws from a different subset
  const _allQs = [];

  // Elimination-specific
  if (_ftBetrayedBy) {
    const _bPr = pronouns(_ftBetrayedBy.voter);
    _allQs.push({ cat: 'betrayal', q: `"${_ftBetrayedBy.voter} voted you out. Your bond was strong — you trusted ${_bPr.obj}. When did you find out?"`,
      a: _ftS.intuition >= 6 ? `"Part of me saw it coming. ${_ftBetrayedBy.voter} got quiet the day before. That's always a sign."` : `"I found out watching the show. I genuinely didn't know. That hurt more than losing."`,
      tone: ['superfan', 'drama'] });
  }
  if (_ftVoters.length >= 3) {
    _allQs.push({ cat: 'elimination', q: `"You got ${_ftVoters.length} votes in episode ${_ftElimEp?.num}. That's not a close call — that's a consensus. What went wrong?"`,
      a: _ftS.strategic >= 6 ? `"I misread the room. I thought I had the numbers and I was wrong. That's on me."` : `"I think people were scared. Easier to pile on one name than to make a real move."`,
      tone: ['hater', 'superfan'] });
  }
  if (_ftVotedFor && gs.activePlayers.includes(_ftVotedFor.voted)) {
    _allQs.push({ cat: 'vote', q: `"Your last vote was for ${_ftVotedFor.voted}. ${pronouns(_ftVotedFor.voted).Sub} ${pronouns(_ftVotedFor.voted).sub === 'they' ? 'are' : 'is'} still in the game. Do you regret that vote?"`,
      a: getBond(_fanTarget, _ftVotedFor.voted) <= -1 ? `"Not for a second. ${_ftVotedFor.voted} needed to go. The fact that ${pronouns(_ftVotedFor.voted).sub}'${pronouns(_ftVotedFor.voted).sub === 'they' ? 're' : 's'} still out there is the real problem."` : `"It was strategy, not personal. If I had to do it again... yeah, same vote."`,
      tone: ['superfan', 'hater'] });
  }

  // Relationship-specific
  if (_ftShowmance) {
    const _partner = _ftShowmance.players.find(p => p !== _fanTarget);
    _allQs.push({ cat: 'showmance', q: _ftShowmance.phase === 'broken' ? `"You and ${_partner}. It was the romance of the season — and then it ended. What happened?"` : `"You and ${_partner}. The whole fanbase is invested. Is it real or was it the island?"`,
      a: _ftShowmance.phase === 'broken' ? `"It was real while it lasted. The game got between us. That's the honest answer."` : `"[smiles] It's real. The island made it intense, but what we have... yeah. It's real."`,
      tone: ['drama', 'supporter'] });
  }
  if (_ftWorstEnemy && getBond(_fanTarget, _ftWorstEnemy) <= -3) {
    const _ePr = pronouns(_ftWorstEnemy);
    _allQs.push({ cat: 'rivalry', q: `"Your bond with ${_ftWorstEnemy} was ${getBond(_fanTarget, _ftWorstEnemy).toFixed(1)}. That's one of the lowest in the game. What did ${_ePr.sub} do to you?"`,
      a: _ftS.temperament <= 4 ? `"${_ftWorstEnemy} knows exactly what ${_ePr.sub} did. I don't need to explain it to the audience. ${_ePr.Sub}'ll get what's coming."` : `"We just clashed. Different play styles, different values. I tried to make it work and it didn't."`,
      tone: ['drama', 'hater'] });
  }
  if (_ftBestAlly && getBond(_fanTarget, _ftBestAlly) >= 4) {
    _allQs.push({ cat: 'ally', q: `"You and ${_ftBestAlly} — bond of ${getBond(_fanTarget, _ftBestAlly).toFixed(1)}. Strongest in your game. Was that always the plan?"`,
      a: `"${_ftBestAlly} was the one person I could trust out there. We didn't plan it — we just clicked from the start. ${pronouns(_ftBestAlly).Sub} ${pronouns(_ftBestAlly).sub === 'they' ? 'are' : 'is'} the real deal."`,
      tone: ['supporter', 'superfan'] });
  }

  // Game-move-specific
  if (_ftBetrayals >= 2) {
    _allQs.push({ cat: 'betrayal', q: `"You flipped on your alliance ${_ftBetrayals} times. At what point is that just who you are?"`,
      a: _ftS.loyalty <= 4 ? `"It's a game. Loyalty is a strategy, not a rule. I played to win, not to make friends."` : `"Every flip had a reason. I wasn't being disloyal — I was adapting. There's a difference."`,
      tone: ['hater', 'superfan'] });
  }
  if (_ftIdolPlayed) {
    const _idolEp = gs.episodeHistory.find(h => (h.idolPlays || []).some(ip => ip.player === _fanTarget));
    _allQs.push({ cat: 'idol', q: `"That idol play in episode ${_idolEp?.num || '?'}. Walk us through the decision — what made you play it?"`,
      a: _ftS.intuition >= 6 ? `"I felt the heat. Everyone was too friendly at camp. When people are nice to you before tribal, it means you're going home."` : `"Honestly, I was scared. I wasn't sure if I needed it, but I couldn't afford to be wrong."`,
      tone: ['superfan', 'supporter'] });
  }
  if (_ftChalWins >= 2) {
    _allQs.push({ cat: 'challenge', q: `"${_ftChalWins} challenge wins. You dominated out there. Did the challenge reputation help or hurt you?"`,
      a: _ftS.strategic >= 6 ? `"It hurt me. Every win put a bigger target on my back. I wish I'd thrown a few."` : `"It kept me alive. I needed those necklaces. Without them, I'd have gone home way earlier."`,
      tone: ['superfan', 'supporter'] });
  }
  if (_ftBigMoves === 0 && _ftElimEp && _ftElimEp.num >= 4) {
    _allQs.push({ cat: 'passive', q: `"You played for ${_ftElimEp.num} episodes without making a single big move. Was that the plan or did you just... not?"`,
      a: _ftS.strategic >= 6 ? `"My game was subtler than what shows on TV. Not every move has to be flashy."` : `"...I know. I waited too long. That's the lesson."`,
      tone: ['hater'] });
  }
  if (_ftAlliances.length >= 2) {
    _allQs.push({ cat: 'alliance', q: `"You were in ${_ftAlliances.length} alliances — ${_ftAlliances.map(a => a.name).join(', ')}. Which one was real?"`,
      a: _ftAlliances.some(a => a.active) ? `"${_ftAlliances.find(a => a.active)?.name || 'One of them'} was real. The rest were survival."` : `"At the time, all of them felt real. Looking back... probably none of them."`,
      tone: ['superfan', 'hater'] });
  }
  if (_ftWasMole) {
    _allQs.push({ cat: 'mole', q: `"So... you were The Mole. This whole time. How does it feel watching everyone find out?"`,
      a: `"[grins] This is the best part. Watching their faces when they realize it was me the whole time. Every 'accident,' every 'mistake' — that was all me."`,
      tone: ['drama', 'superfan'] });
  }
  if (_ftSideDeals.length >= 2) {
    const _dealNames = _ftSideDeals.map(d => d.players.find(p => p !== _fanTarget)).filter(Boolean);
    _allQs.push({ cat: 'deals', q: `"You had ${_ftSideDeals.length} side deals — with ${_dealNames.slice(0, 3).join(', ')}. Were any of them real?"`,
      a: _ftSideDeals.some(d => d.genuine) ? `"The one with ${_ftSideDeals.find(d => d.genuine)?.players.find(p => p !== _fanTarget) || 'someone'} was real. The rest were insurance."` : `"[laughs] I'll take the fifth on that one."`,
      tone: ['hater', 'drama'] });
  }

  // Archetype-specific
  if (_ftArch === 'villain' || _ftArch === 'schemer') {
    _allQs.push({ cat: 'archetype', q: `"The fans have been calling you the villain of this season. Own it or deny it?"`,
      a: `"I'll own it. This game rewards people who make moves. Heroes finish third."`, tone: ['drama', 'hater'] });
  }
  if (_ftArch === 'underdog') {
    _allQs.push({ cat: 'archetype', q: `"You were the underdog from day one. Overlooked, underestimated. How did that feel?"`,
      a: `"Honestly? It fueled me. Every person who looked past me gave me motivation. I just ran out of road."`, tone: ['supporter', 'drama'] });
  }

  // Love triangle questions
  const _ftTriangle = (gs.loveTriangles || []).find(t => t.center === _fanTarget || t.suitors.includes(_fanTarget));
  if (_ftTriangle) {
    const _ftTriRole = _ftTriangle.center === _fanTarget ? 'center'
      : (_ftTriangle.resolution?.rejected === _fanTarget ? 'rejected' : 'suitor');
    if (_ftTriRole === 'center') {
      _allQs.push({ cat: 'triangle', q: `"The love triangle was THE storyline this season. When did you first realize you were in the middle of it?"`,
        a: _ftS.strategic >= 6 ? `"I knew what was happening. I just didn't know how to stop it without losing both of them."` : `"Honestly? I didn't see it until it was too late. I thought I could keep everyone happy. I was wrong."`, tone: ['superfan', 'drama'] });
      _allQs.push({ cat: 'triangle', q: `"Be honest — did you enjoy having two people competing for your attention?"`,
        a: _ftS.social >= 6 ? `"It wasn't like that. These were real feelings. Real people. I hated every second of hurting someone."` : `"...Maybe at first. But it stopped being fun the moment I saw what it was doing to ${_ftTriangle.suitors[0]}."`, tone: ['drama', 'hater'] });
    } else if (_ftTriRole === 'rejected') {
      _allQs.push({ cat: 'triangle', q: `"The audience was rooting for you in that love triangle. How are you holding up?"`,
        a: _ftS.loyalty >= 6 ? `"I'm not going to lie — it gutted me. I thought what we had was real. Turns out I was the backup plan."` : `"I'm fine. Honestly. The game taught me something about myself. Not everyone who says they care actually does."`, tone: ['supporter', 'drama'] });
      _allQs.push({ cat: 'triangle', q: `"You got picked second. In love and in this game. How does that feel to hear out loud?"`,
        a: `"Terrible. Thanks for asking."`, tone: ['hater'] });
    } else {
      _allQs.push({ cat: 'triangle', q: `"You were part of the love triangle whether you wanted to be or not. Did you know what was happening?"`,
        a: _ftS.intuition >= 6 ? `"I could feel it. The tension between us was impossible to miss. I just didn't want to be the one to name it."` : `"Honestly? I had no idea until it blew up. I thought ${_ftTriangle.center} and I were just friends."`, tone: ['superfan', 'supporter'] });
    }
  }

  // Affair fan call questions
  const _ftAffair = (gs.affairs || []).find(af => af.cheater === _fanTarget || af.partner === _fanTarget || af.secretPartner === _fanTarget);
  if (_ftAffair) {
    const _ftAfRole = _ftAffair.cheater === _fanTarget ? 'cheater'
      : _ftAffair.partner === _fanTarget ? 'betrayed' : 'secret';
    if (_ftAfRole === 'cheater') {
      _allQs.push({ cat: 'affair', q: `"The secret affair was the biggest twist of the season — and it wasn't even planned by production. When did you decide to go behind ${_ftAffair.partner}'s back?"`,
        a: _ftS.strategic >= 6 ? `"It wasn't a decision. It was a series of moments that added up."` : `"I didn't decide. It just happened."`, tone: ['superfan', 'drama'] });
      _allQs.push({ cat: 'affair', q: `"You had someone who trusted you and you threw it away. Was the game worth it?"`,
        a: `"The game? This wasn't about the game. That's what makes it worse."`, tone: ['hater'] });
    } else if (_ftAfRole === 'betrayed') {
      _allQs.push({ cat: 'affair', q: `"The whole fanbase is behind you. You deserved better than what ${_ftAffair.cheater} did."`,
        a: `"Day by day. It's harder when you find out the same time as the whole country."`, tone: ['supporter', 'drama'] });
    } else {
      _allQs.push({ cat: 'affair', q: _ftAffair.complicit
        ? `"Homewrecker is a strong word. But if the shoe fits..."`
        : `"You got pulled into something you didn't ask for. How does it feel?"`,
        a: _ftAffair.complicit ? `"I own it. I'm not going to pretend I'm innocent."` : `"I was lied to. Same as ${_ftAffair.partner}."`, tone: ['hater', 'drama'] });
    }
  }

  // Showmance betrayal fan call
  const _ftShowmanceBetray = (gs.showmances || []).find(sh => sh.breakupVoter === _fanTarget);
  if (_ftShowmanceBetray) {
    _allQs.push({ cat: 'showmance', q: `"You voted out your showmance partner. The fanbase has one word for that and it's not 'strategic.'"`,
      a: _ftS.loyalty >= 6 ? `"It was the hardest thing I've ever done."` : `"Strategic IS the word."`, tone: ['hater', 'drama'] });
  }

  // Universal fallbacks (always available)
  _allQs.push({ cat: 'general', q: `"What's the one thing you know now that you wish you'd known on day one?"`,
    a: _ftS.strategic >= 6 ? `"Trust your read. I second-guessed myself at the worst possible time."` : `"This game moves faster than you think. By the time you realize you're in trouble, it's too late."`, tone: ['superfan', 'supporter'] });
  _allQs.push({ cat: 'general', q: `"If you went back out there tomorrow — different cast, same game — what would you do differently?"`,
    a: _ftBetrayals >= 1 ? `"I'd be more careful about who I betrayed. Some bridges aren't worth burning."` : _ftBigMoves === 0 ? `"Make a move. Any move. Sitting still is what got me eliminated."` : `"I'd build deeper relationships earlier. The social game matters more than I gave it credit for."`, tone: ['superfan', 'supporter'] });

  // Fan type determines which questions to pick from
  const _fanTypes = ['superfan', 'drama', 'hater', 'supporter'];
  const _fanType = _pick(_fanTypes);
  // Filter to questions that match this fan type, then fill with any remaining
  const _typeQs = _allQs.filter(q => q.tone.includes(_fanType));
  const _otherQs = _allQs.filter(q => !q.tone.includes(_fanType));
  const _pool = [..._typeQs, ..._otherQs];
  // Pick 3 unique questions by category (no two from same category)
  const _usedCats = new Set();
  const _fanExchanges = [];
  for (const q of _pool) {
    if (_fanExchanges.length >= 3) break;
    if (_usedCats.has(q.cat)) continue;
    _usedCats.add(q.cat);
    _fanExchanges.push({ q: q.q, a: q.a });
  }

  // Host reactions tailored to fan type
  const _hostReacts = {
    superfan: [`${_host}: "That's a deep cut. Respect."`, `${_host}: "The superfans always do their homework."`, `${_host}: "Moving on."`],
    drama: [`${_host}: "The fans want what the fans want."`, `${_host}: "I love this energy."`, `${_host}: "We might need security for this one."`],
    hater: [`${_host}: "Easy there — that's our guest."`, `${_host}: "Wow. The haters don't hold back."`, `${_host}: "I think that's enough."`],
    supporter: [`${_host}: "The fans love you."`, `${_host}: "That's the kind of question that makes people cry."`, `${_host}: "Beautiful."`],
  };

  const fanCall = { fanName: _pick(_fanNames), fanType: _fanType, target: _fanTarget, exchanges: _fanExchanges,
    hostReactions: [_pick(_hostReacts[_fanType] || ['']), _pick(_hostReacts[_fanType] || [''])] };

  // ── FAN VOTE (conditional) ──
  let fanVote = null;
  // Fan vote: fires ONCE after X total eliminations (config), OR from scheduled second-chance twist
  const _fvThreshold = parseInt(cfg.fanVoteFrequency) || 0;
  const _scTwistScheduled = (cfg.twistSchedule || []).some(t => t.type === 'second-chance' && Number(t.episode) >= curEp && Number(t.episode) <= curEp + 2);
  const _fanVoteAlreadyUsed = gs._fanVoteReturnUsed;
  // Count total eliminations this season
  const _totalElims = (gs.episodeHistory || []).filter(h => h.num <= curEp).reduce((c, h) => {
    let n = 0; if (h.eliminated) n++; if (h.firstEliminated) n++;
    if (h.tiedDestinies?.eliminatedPartner) n++; if (h.ambassadorData?.ambassadorEliminated && h.ambassadorData.ambassadorEliminated !== h.eliminated) n++;
    return c + n;
  }, 0);
  const _fanVoteShouldFire = (!_fanVoteAlreadyUsed && _fvThreshold && _totalElims >= _fvThreshold) || _scTwistScheduled;
  if (_fanVoteShouldFire && gs.eliminated.length && !isFinale) {
    const _scElim = gs.eliminated.filter(p => !gs.activePlayers.includes(p));
    if (_scElim.length) {
      const _scores = _scElim.map(n => ({ name: n, score: (gs.popularity?.[n] || 0) + Math.random() * 1.5, popularity: gs.popularity?.[n] || 0 })).sort((a, b) => b.score - a.score);
      const _total = _scores.reduce((s, r) => s + Math.max(0, r.score), 0) || 1;
      fanVote = { results: _scores.map(s => ({ name: s.name, pct: Math.round(s.score / _total * 100), popularity: s.popularity })), winner: _scores[0].name };
      gs.pendingFanVoteReturn = _scores[0].name;
      if (_fvThreshold && !_scTwistScheduled) gs._fanVoteReturnUsed = true; // config fan vote: once per season
    }
  }

  // ── REUNION DISCUSSION (finale only) — deep group conversations ──
  let reunionDiscussion = null;
  if (isReunion) {
    const _allPlayers = [...gs.activePlayers, ...allEliminated];
    const _topics = [];
    const _winner = ep.winner;
    const _wPr = _winner ? pronouns(_winner) : null;
    // Find the runner-up(s)
    const _runnerUp = gs.activePlayers.find(p => p !== _winner);
    const _ruPr = _runnerUp ? pronouns(_runnerUp) : null;

    // Find key alliances, rivalries, and moments for reference
    const _longestAlliance = (gs.namedAlliances || []).filter(a => a.formed).sort((a, b) => (b.active ? curEp : 0) - (a.active ? curEp : 0))[0];
    const _mostBetrayed = _allPlayers.map(p => ({ name: p, count: gs.episodeHistory.filter(h => (h.defections || []).some(d => d.player === p)).length })).sort((a, b) => b.count - a.count)[0];
    let _worstPair = null, _worstBond = 0;
    for (let i = 0; i < _allPlayers.length; i++) for (let j = i + 1; j < _allPlayers.length; j++) { const b = getBond(_allPlayers[i], _allPlayers[j]); if (b < _worstBond) { _worstBond = b; _worstPair = [_allPlayers[i], _allPlayers[j]]; } }

    // ── TOPIC 1: The Winner's Game ──
    if (_winner) {
      const _winAlliances = (gs.namedAlliances || []).filter(a => a.members.includes(_winner));
      const _winBetrayals = gs.episodeHistory.filter(h => (h.defections || []).some(d => d.player === _winner)).length;
      const _winChalWins = gs.chalRecord?.[_winner]?.wins || 0;
      const _winBigMoves = gs.playerStates?.[_winner]?.bigMoves || 0;
      const _lines = [];
      _lines.push({ speaker: _host, text: `"Let's start with the big one. ${_winner} won this season. ${_winAlliances.length} alliances. ${_winChalWins} challenge wins. ${_winBigMoves} big moves. ${_winBetrayals ? `And ${_winBetrayals} betrayal${_winBetrayals > 1 ? 's' : ''}.` : 'Clean record.'} Did ${_wPr.sub} play the best game — or just survive the longest?"` });

      // Winner responds
      _lines.push({ speaker: _winner, text: _winBetrayals >= 2 ? `"I made moves other people were afraid to make. Every betrayal had a reason — and every one of them got me closer to this seat. I'm not going to apologize for playing the game."` : _winChalWins >= 3 ? `"I earned my spot through challenges when I needed them and through relationships when I didn't. I played a complete game — physical, social, strategic. That's why I'm here."` : `"I read the room better than anyone out there. I knew when to push and when to pull back. The people who got voted out made mistakes. I didn't — or at least, I made fewer."` });

      // Strongest supporter
      const _bestAllyToWinner = _allPlayers.filter(p => p !== _winner).sort((a, b) => getBond(b, _winner) - getBond(a, _winner))[0];
      const _reunFF = seasonConfig.finaleFormat || 'traditional';
      const _reunJury = _reunFF === 'traditional' || _reunFF === 'jury-cut' || _reunFF === 'fire-making' || _reunFF === 'koh-lanta';
      const _reunDecider = _reunJury ? 'The jury got it right.' : _reunFF === 'fan-vote' ? 'The fans got it right.' : 'The result got it right.';
      if (_bestAllyToWinner) _lines.push({ speaker: _bestAllyToWinner, text: `"I played with ${_winner} every day. I saw the moves the cameras didn't catch — the conversations at 3 AM, the way ${_wPr.sub} ${_wPr.sub === 'they' ? 'read' : 'read'} people before they even opened their mouths. ${_wPr.Sub} earned this. ${_reunDecider}"` });

      // Strongest critic
      const _worstEnemyOfWinner = _allPlayers.filter(p => p !== _winner).sort((a, b) => getBond(a, _winner) - getBond(b, _winner))[0];
      if (_worstEnemyOfWinner && getBond(_worstEnemyOfWinner, _winner) <= -2) {
        _lines.push({ speaker: _worstEnemyOfWinner, text: `"I'm going to be honest — I don't think ${_winner} played the best game. I think the best player left before the finale. ${_winner} was in the right place at the right time, surrounded by the right people. That's not strategy — that's luck."` });
        _lines.push({ speaker: _winner, text: `"${_worstEnemyOfWinner} is entitled to ${pronouns(_worstEnemyOfWinner).posAdj} opinion. But ${pronouns(_worstEnemyOfWinner).sub} ${pronouns(_worstEnemyOfWinner).sub === 'they' ? 'are' : 'is'} sitting in that chair and I'm sitting in this one. The result speaks for itself."` });
        _lines.push({ speaker: _host, text: `"[turns to camera] And THAT is why we do reunions."` });
      }

      // Runner-up weighs in
      if (_runnerUp) {
        const _ruText = getBond(_runnerUp, _winner) >= 2
          ? `"I lost to ${_winner}. It hurts. But if I'm being honest — ${_wPr.sub} played a better game than I did in the moments that mattered. I can respect that even if I don't like it."`
          : _reunJury ? `"I stood next to ${_winner} at the finale and I thought I had it. ${_reunDecider.replace('.', '')} — but I'll be thinking about what I could've done differently for a long time."`
          : `"I was right there at the end with ${_winner}. I thought I had it. ${_reunDecider.replace('.', '')} — but it could've gone either way."`;
        _lines.push({ speaker: _runnerUp, text: _ruText });
      }
      _topics.push({ title: `${_winner}'s Winning Game`, lines: _lines });
    }

    // ── TOPIC 2: The Season's Biggest Rivalry ──
    if (_worstPair && _worstBond <= -5) {
      const [r1, r2] = _worstPair;
      const _r1Pr = pronouns(r1), _r2Pr = pronouns(r2);
      const _rivalryVotes = gs.episodeHistory.filter(h => (h.votingLog || []).some(v => (v.voter === r1 && v.voted === r2) || (v.voter === r2 && v.voted === r1)));
      const _rLines = [];
      _rLines.push({ speaker: _host, text: `"Alright. We need to talk about this. ${r1} and ${r2}. From the first week you two clashed — and it never stopped. ${_rivalryVotes.length ? `You voted against each other ${_rivalryVotes.length} time${_rivalryVotes.length > 1 ? 's' : ''}.` : ''} The audience watched it play out all season. So here's my question — what actually happened between you two?"` });
      _rLines.push({ speaker: r1, text: `"It started small. A disagreement at camp, a look across the fire. But by the time we hit the merge, it was personal. ${r2} made decisions that directly affected my game, and ${_r2Pr.sub} knew it. ${_r2Pr.Sub} didn't care. That's what I can't get past."` });
      _rLines.push({ speaker: r2, text: `"See, that's the thing — ${r1} acts like I was targeting ${_r1Pr.obj} personally. I was playing the GAME. ${r1} was a threat. I treated ${_r1Pr.obj} like a threat. If ${_r1Pr.sub} can't separate that from personal, that's on ${_r1Pr.obj}."` });
      _rLines.push({ speaker: r1, text: `"Don't give me that. You went out of your way to make my life miserable at camp. That wasn't strategy."` });

      // Observer weighs in
      const _obs = _allPlayers.filter(p => p !== r1 && p !== r2).find(p => Math.abs(getBond(p, r1)) >= 2 || Math.abs(getBond(p, r2)) >= 2);
      if (_obs) _rLines.push({ speaker: _obs, text: `"I lived with both of them. The tension was suffocating. Every camp event, every strategy talk — it always came back to the two of them. The rest of us were just trying to survive the crossfire."` });

      _rLines.push({ speaker: _host, text: `"So where do you stand now? Right now, in this studio. Is there any chance this gets resolved?"` });
      _rLines.push({ speaker: r2, text: _pick([`"I'm willing to move on. I'm not willing to pretend it didn't happen."`, `"We're never going to be friends. But I can stop actively disliking ${_r1Pr.obj}. That's the best I've got."`, `"Time will tell. Right now? No. Honestly, no."`]) });
      _rLines.push({ speaker: r1, text: _pick([`"...I respect the honesty. That's more than I got out there."`, `"We'll see. Ask me again in six months."`, `"I think this game ruined something that could've existed between us. And that's the part that's hard to let go of."`]) });
      _topics.push({ title: `${r1} vs ${r2}`, lines: _rLines });
    }

    // ── TOPIC 3: Biggest Blindside — reliving the moment ──
    const _blindsideEp = gs.episodeHistory.filter(h => h.eliminated && (h.defections?.length || 0) >= 2).sort((a, b) => (b.defections?.length || 0) - (a.defections?.length || 0))[0];
    if (_blindsideEp) {
      const _bsVictim = _blindsideEp.eliminated;
      const _bsVoters = (_blindsideEp.votingLog || []).filter(v => v.voted === _bsVictim).map(v => v.voter);
      const _bsFlippers = (_blindsideEp.defections || []).map(d => d.player).slice(0, 3);
      const _bsVPr = _bsVictim ? pronouns(_bsVictim) : null;
      const _bsLines = [];
      _bsLines.push({ speaker: _host, text: `"Episode ${_blindsideEp.num}. The vote that changed everything. ${_bsVictim} goes home with ${_bsVoters.length} votes. ${_bsFlippers.length ? `${_bsFlippers.join(', ')} — you flipped on your alliance. ` : ''}Let's go back to that night. ${_bsVictim}, take us through what you were feeling."` });
      if (_allPlayers.includes(_bsVictim)) {
        _bsLines.push({ speaker: _bsVictim, text: `"I walked into tribal that night thinking I was safe. I had done the math — I counted the votes — and I was wrong. When ${_host} read my name the second time, something inside me just... shut off. I couldn't process it. By the third vote I knew, and I just sat there. That's the moment that replays in my head."` });
      }
      // The main flipper explains
      if (_bsFlippers[0] && _allPlayers.includes(_bsFlippers[0])) {
        _bsLines.push({ speaker: _host, text: `"${_bsFlippers[0]}, you were the swing. The alliance trusted you. Why did you flip?"` });
        _bsLines.push({ speaker: _bsFlippers[0], text: `"Because if I didn't make that move, I was going to be sitting where ${_bsVictim} is right now — except two episodes later. I could see the path, and it didn't include me at the end. So I took the shot. It wasn't about ${_bsVictim}. It was about my game."` });
        if (_allPlayers.includes(_bsVictim)) {
          _bsLines.push({ speaker: _bsVictim, text: `"I hear that. I've heard it before. But you could have TOLD me. You could have given me a chance to fight. Instead you smiled at me at camp that morning and wrote my name down twelve hours later. That's what I can't forgive."` });
        }
      }
      // Another player adds context
      const _bsWitness = _allPlayers.find(p => p !== _bsVictim && !_bsFlippers.includes(p) && _bsVoters.includes(p));
      if (_bsWitness) _bsLines.push({ speaker: _bsWitness, text: `"What people don't understand is that vote wasn't planned days in advance. It came together in the last hour before tribal. By the time we sat down, half of us still weren't sure. But once the first name was written, it was over."` });
      _bsLines.push({ speaker: _host, text: `"That might be the defining moment of this season."` });
      _topics.push({ title: `The Blindside — Episode ${_blindsideEp.num}`, lines: _bsLines });
    }

    // ── TOPIC 4: The Mole — if applicable ──
    if (gs.moles?.length) {
      gs.moles.forEach(mole => {
        if (!mole.sabotageCount) return;
        const _mPr = pronouns(mole.player);
        const _sabTypes = [...new Set(mole.sabotageLog.map(s => s.type))];
        const _victims = [...new Set(mole.sabotageLog.flatMap(s => [...(s.targets || []), s.target].filter(Boolean)))].filter(v => _allPlayers.includes(v));
        const _mLines = [];
        _mLines.push({ speaker: _host, text: `"Now for the moment some of you have been waiting for — and some of you have been dreading. ${mole.player}. The Mole. ${mole.sabotageCount} acts of sabotage over the course of this season. ${mole.exposed ? `${mole.exposedBy} figured it out in episode ${mole.exposedEp}.` : 'And nobody. Ever. Figured it out.'} ${mole.player}, the floor is yours."` });
        _mLines.push({ speaker: mole.player, text: mole.exposed
          ? `"Look — I knew eventually someone would catch on. ${mole.exposedBy} was watching me too closely. But before that? I threw challenges, I fabricated fights between people, I leaked alliance plans to the other side. And every single one of you sat around the fire with me and had no idea. That's the part I'm proud of."`
          : `"I sat in that camp for the entire season and played two games at the same time. The game everyone saw — the alliances, the strategy, the votes. And the game nobody saw — the sabotage. I threw challenges. I turned people against each other. I leaked your plans. And not one of you ever looked at me and thought, 'maybe it's ${_mPr.obj}.'"` });
        // Victims react with specifics
        if (_victims[0]) {
          const _v1Sabs = mole.sabotageLog.filter(s => (s.targets || []).includes(_victims[0]) || s.target === _victims[0]);
          _mLines.push({ speaker: _victims[0], text: `"I had ${_v1Sabs.length} acts of sabotage against me and I didn't see ANY of them. ${mole.player}, do you know how many nights I lay awake wondering why my game kept falling apart? That was YOU?"` });
          _mLines.push({ speaker: mole.player, text: `"...Yeah. That was me. Sorry about that. Well — not that sorry."` });
        }
        if (_victims[1]) {
          _mLines.push({ speaker: _victims[1], text: `"I am genuinely angry right now. You FABRICATED things I said? You turned people against me with LIES?"` });
          _mLines.push({ speaker: mole.player, text: `"It's a twist. I was assigned a role and I played it."` });
          _mLines.push({ speaker: _victims[1], text: `"That doesn't make it okay."` });
        }
        if (mole.exposed && _allPlayers.includes(mole.exposedBy)) {
          _mLines.push({ speaker: _host, text: `"${mole.exposedBy}, you're the one who cracked it. How did you know?"` });
          _mLines.push({ speaker: mole.exposedBy, text: `"Patterns. Every time ${mole.player} was involved in a conversation, something went wrong the next day. I started tracking it — mentally, not on paper — and the math stopped being coincidence around episode ${Math.max(1, (mole.exposedEp || 10) - 3)}. By the time I confronted ${_mPr.obj}, I was sure."` });
        }
        _mLines.push({ speaker: _host, text: `"${mole.sabotageCount} acts of sabotage. One of the most chaotic forces this game has ever seen. ${mole.player}, ladies and gentlemen."` });
        _topics.push({ title: `The Mole — ${mole.player}`, lines: _mLines });
      });
    }

    // ── TOPIC 5: Open Floor — unfinished business ──
    const _ufPairs = [];
    for (let i = 0; i < _allPlayers.length && _ufPairs.length < 2; i++) {
      for (let j = i + 1; j < _allPlayers.length; j++) {
        if (getBond(_allPlayers[i], _allPlayers[j]) <= -4 && (!_worstPair || (_allPlayers[i] !== _worstPair[0] && _allPlayers[j] !== _worstPair[0] && _allPlayers[i] !== _worstPair[1] && _allPlayers[j] !== _worstPair[1]))) {
          _ufPairs.push([_allPlayers[i], _allPlayers[j]]);
          break;
        }
      }
    }
    const _ufLines = [];
    _ufLines.push({ speaker: _host, text: `"Before we go — open floor. This is the last time all of you will be in the same room. If there's something you need to say, now is the time. No strategy, no game. Just honesty."` });
    // Unfinished rivalries
    _ufPairs.forEach(([a, b]) => {
      const _aPr = pronouns(a), _bPr = pronouns(b);
      const _abVote = gs.episodeHistory.find(h => (h.votingLog || []).some(v => (v.voter === a && v.voted === b) || (v.voter === b && v.voted === a)));
      _ufLines.push({ speaker: a, text: _abVote ? `"${b}, I've wanted to say this since episode ${_abVote.num}. The way things ended between us wasn't right. I'm not saying I'd change my vote — but I wish we'd talked about it before it happened. You deserved that much."` : `"${b}. We never got to hash this out at camp. I need you to know — it wasn't personal. At least, it didn't start that way. By the end... yeah. It was personal. And I'm not proud of that."` });
      _ufLines.push({ speaker: b, text: _pick([`"I appreciate you saying that. I do. I'm not sure I'm ready to fully accept it yet — but the fact that you stood up and said it in front of everyone? That means something."`, `"...That's more than I expected to hear tonight. I came in here ready for a fight. I didn't expect accountability."`, `"Okay. I hear you. I need some time. But I hear you."`]) });
    });
    // Someone says something positive
    const _bestBondPair = _allPlayers.reduce((best, p, i) => { for (let j = i + 1; j < _allPlayers.length; j++) { const b = getBond(p, _allPlayers[j]); if (b > best.bond) return { a: p, b: _allPlayers[j], bond: b }; } return best; }, { a: null, b: null, bond: -99 });
    if (_bestBondPair.a && _bestBondPair.bond >= 5) {
      _ufLines.push({ speaker: _bestBondPair.a, text: `"I just want to say — ${_bestBondPair.b}, you were the best part of my experience out there. The game tried to pull us apart and it couldn't. That's real. That's not strategy. That's something I'm taking with me."` });
      _ufLines.push({ speaker: _bestBondPair.b, text: `"I feel the same way. Whatever happens after this — we're good. Always."` });
    }
    _ufLines.push({ speaker: _host, text: `"${_allPlayers.length} players. ${gs.episodeHistory.length} episodes. One winner. And a whole lot of unfinished business. That's a wrap on this season of Total Drama. Until next time — I'm ${_host}. Good night."` });
    if (_ufLines.length > 2) _topics.push({ title: 'Open Floor', lines: _ufLines });

    reunionDiscussion = _topics.length ? _topics : null;
  }

  // ── REUNION AWARDS (finale only) ──
  let awards = null, seasonRating = null;
  if (isReunion) {
    awards = [];
    // Best Blindside
    const _blindsides = gs.episodeHistory.filter(h => h.eliminated && h.votingLog?.length >= 3);
    if (_blindsides.length) {
      const _bestBS = _blindsides.sort((a, b) => {
        const aVotes = Object.values(a.votes || {}).sort((x, y) => y - x)[0] || 0;
        const bVotes = Object.values(b.votes || {}).sort((x, y) => y - x)[0] || 0;
        return bVotes - aVotes;
      })[0];
      awards.push({ id: 'bestBlindside', title: 'Best Blindside', winner: _bestBS.eliminated, description: `Blindsided in episode ${_bestBS.num}. Never saw it coming.`, sourceEp: _bestBS.num });
    }
    // Biggest Betrayal
    const _allBetrays = gs.episodeHistory.flatMap(h => (h.defections || []).map(d => ({ ...d, ep: h.num })));
    if (_allBetrays.length) {
      const _worstBetray = _allBetrays.sort((a, b) => { const bA = getBond(a.player, a.votedFor || ''); const bB = getBond(b.player, b.votedFor || ''); return bA - bB; })[0];
      awards.push({ id: 'biggestBetrayal', title: 'Biggest Betrayal', winner: _worstBetray.player, description: `Betrayed ${_worstBetray.alliance || 'their alliance'} in episode ${_worstBetray.ep}.`, sourceEp: _worstBetray.ep });
    }
    // Best Alliance
    const _bestAlliance = (gs.namedAlliances || []).filter(a => a.formed).sort((a, b) => {
      const aLen = a.active ? curEp - a.formed : 0;
      const bLen = b.active ? curEp - b.formed : 0;
      return bLen - aLen;
    })[0];
    if (_bestAlliance) awards.push({ id: 'bestAlliance', title: 'Best Alliance', winner: _bestAlliance.name, description: `Formed episode ${_bestAlliance.formed}. ${_bestAlliance.active ? 'Still standing.' : 'Dissolved, but left a mark.'}`, sourceEp: _bestAlliance.formed });
    // Fan Favorite
    const _fanFav = Object.entries(gs.popularity || {}).sort((a, b) => b[1] - a[1])[0];
    if (_fanFav) awards.push({ id: 'fanFavorite', title: 'Fan Favorite', winner: _fanFav[0], description: `${_fanFav[1]} popularity points. The fans have spoken.`, sourceEp: null });
    // Season Rating
    const _dramaCount = gs.episodeHistory.reduce((s, h) => s + (h.defections?.length || 0) + (h.paranoiaSpirals?.length || 0) + (h.moleExposure?.length || 0), 0);
    const _idolPlays = gs.episodeHistory.reduce((s, h) => s + (h.idolPlays?.length || 0), 0);
    const _rawRating = Math.min(10, 4 + _dramaCount * 0.3 + _idolPlays * 0.5 + (gs.moles?.length ? 1 : 0));
    const _rating = Math.round(_rawRating * 10) / 10;
    const _comment = _rating >= 9 ? 'Best season EVER.' : _rating >= 7 ? 'Solid. The fans will talk.' : _rating >= 5 ? 'Had its moments.' : 'We\'ll do better next time.';
    seasonRating = { score: _rating, comment: _comment };
  }

  // ── STORE ──
  ep.aftermath = {
    number: aftermathNum, isReunion,
    interviewees: [...interviewees], peanutGallery: [...peanutGallery],
    interviews, truthOrAnvil, unseenFootage, fanCall, fanVote, aftermathMoments: aftermathMoment, reunionDiscussion, awards, seasonRating
  };
  gs.lastAftermathEp = curEp;
  if (!gs.aftermathHistory) gs.aftermathHistory = [];
  gs.aftermathHistory.push({ ep: curEp, interviewees: [...interviewees] });
}

export function rpBuildAftermathOpening(ep) {
  const a = ep.aftermath;
  if (!a) return null;
  const host = seasonConfig.host || 'Chris';
  let html = `<div class="rp-page tod-studio">
    <div class="aftermath-live">LIVE</div>
    <div class="aftermath-title" style="font-size:32px;text-align:center;margin:16px 0 4px">${a.isReunion ? 'TOTAL DRAMA AFTERMATH: THE REUNION' : 'TOTAL DRAMA AFTERMATH'}</div>
    <div style="font-size:11px;color:#8b949e;text-align:center;letter-spacing:2px;margin-bottom:20px">LIVE FROM THE AFTERMATH STUDIO${a.isReunion ? '' : ` &mdash; AFTERMATH #${a.number}`}</div>`;

  // Host intro — specific to what actually happened
  const _recentEps = gs.episodeHistory.filter(h => h.num > (gs.lastAftermathEp || 0) && h.num <= ep.num);
  const _recentElims = _recentEps.filter(h => h.eliminated).map(h => h.eliminated);
  const _recentBlindsides = _recentEps.filter(h => h.defections?.length >= 2);
  const _recentIdolPlays = _recentEps.filter(h => h.idolPlays?.length);
  const _moleExposed = _recentEps.find(h => h.moleExposure?.length);
  const _dominantAlliance = (gs.namedAlliances || []).filter(al => al.active).sort((a, b) => b.members.length - a.members.length)[0];

  // Build specific intro line from what happened
  let _hostLine = `"Welcome back to the Aftermath. We're down to ${gs.activePlayers.length} players.`;
  if (_moleExposed) _hostLine += ` The Mole was EXPOSED. ${_moleExposed.moleExposure[0].mole} has been outed and the tribe is reeling.`;
  else if (_recentBlindsides.length >= 2) _hostLine += ` ${_recentBlindsides.length} blindsides since we last talked. The tribe is eating itself alive.`;
  else if (_dominantAlliance && _dominantAlliance.members.length >= 4) _hostLine += ` ${_dominantAlliance.name} is running the show with ${_dominantAlliance.members.length} members. The question is — for how long?`;
  else if (_recentIdolPlays.length) _hostLine += ` Idols have been flying. Nothing is safe out there.`;
  else _hostLine += ` Things are heating up.`;
  _hostLine += ` Tonight we hear from ${a.interviewees.filter(n => !gs.activePlayers.includes(n)).join(', ')}. And trust me — they have a LOT to say."`;

  html += `<div class="aftermath-card-gold" style="display:flex;align-items:center;gap:14px">
    <div style="font-size:40px">🎤</div>
    <div><div style="font-size:14px;color:#f59e0b;font-weight:700">${host}</div>
    <div style="font-size:13px;color:#f5f0e8;font-style:italic;line-height:1.5">${_hostLine}</div></div>
  </div>`;

  // Eliminated montage — all eliminated so far
  const allElim = gs.eliminated || [];
  if (allElim.length) {
    html += `<div style="font-size:9px;font-weight:700;letter-spacing:2px;color:#8b949e;text-align:center;margin:16px 0 8px">THE FALLEN</div>
      <div style="display:flex;flex-wrap:wrap;gap:4px;justify-content:center;margin-bottom:16px">`;
    allElim.forEach(n => {
      const isGuest = a.interviewees.includes(n);
      html += `<div style="text-align:center;opacity:${isGuest ? '1' : '0.5'}${isGuest ? ';border:2px solid #f59e0b;border-radius:8px;padding:2px' : ''}">
        ${window.rpPortrait(n, 'sm')}
      </div>`;
    });
    html += `</div>`;
  }

  // Guests or full cast (reunion)
  if (a.isReunion) {
    // Reunion: finalists featured, then full cast
    html += `<div style="font-size:9px;font-weight:700;letter-spacing:2px;color:#f59e0b;text-align:center;margin:16px 0 8px">THE FINALISTS</div>
      <div style="display:flex;justify-content:center;gap:24px;margin-bottom:12px">`;
    gs.activePlayers.forEach(n => {
      html += `<div style="text-align:center;animation:slideInLeft 0.5s both">
        ${window.rpPortrait(n, 'xl')}
        <div style="font-size:13px;color:#f59e0b;font-weight:700;margin-top:4px">${n}</div>
        <div style="font-size:10px;color:#8b949e">${window.vpArchLabel(n)}</div>
      </div>`;
    });
    html += `</div>`;
    html += `<div style="font-size:9px;font-weight:700;letter-spacing:2px;color:#8b949e;text-align:center;margin:12px 0 8px">THE FULL CAST</div>
      <div style="display:flex;justify-content:center;gap:6px;flex-wrap:wrap;margin-bottom:16px">`;
    allElim.forEach(n => { html += window.rpPortrait(n, 'sm'); });
    html += `</div>`;
  } else {
    html += `<div style="font-size:9px;font-weight:700;letter-spacing:2px;color:#f59e0b;text-align:center;margin:16px 0 8px">TONIGHT'S GUESTS</div>
      <div style="display:flex;justify-content:center;gap:16px;flex-wrap:wrap;margin-bottom:16px">`;
    a.interviewees.filter(n => !gs.activePlayers.includes(n)).forEach(n => {
      html += `<div style="text-align:center;animation:slideInLeft 0.5s both">
        ${window.rpPortrait(n, 'lg')}
        <div style="font-size:11px;color:#f5f0e8;font-weight:600;margin-top:4px">${n}</div>
        <div style="font-size:9px;color:#8b949e">${window.vpArchLabel(n)}</div>
      </div>`;
    });
    html += `</div>`;
  }

  // Peanut Gallery (not shown on Reunion — everyone is on stage)
  if (a.peanutGallery.length && !a.isReunion) {
    html += `<div style="font-size:9px;font-weight:700;letter-spacing:2px;color:#6366f1;text-align:center;margin:16px 0 8px">PEANUT GALLERY</div>
      <div class="aftermath-gallery">`;
    a.peanutGallery.forEach(n => {
      html += window.rpPortrait(n, 'xs');
    });
    html += `</div>`;
  }

  html += `</div>`;
  return html;
}

export function rpBuildAftermathInterview(ep, interview) {
  if (!interview) return null;
  const a = ep.aftermath;
  const iv = interview;
  const pr = pronouns(iv.player);
  const _host = seasonConfig.host || 'Chris';
  const _revealKey = `aftermath_iv_${ep.num}_${iv.player.replace(/\W/g, '')}`;

  let html = `<div class="rp-page tod-studio">
    <div class="aftermath-live">LIVE</div>
    <div style="font-size:9px;font-weight:700;letter-spacing:2px;color:#8b949e;text-align:center;margin-bottom:8px">AFTERMATH #${a.number}</div>`;

  // Entrance
  html += `<div style="text-align:center;margin-bottom:16px;animation:slideInLeft 0.5s both">
    ${window.rpPortrait(iv.player, 'xl')}
    <div style="font-family:var(--font-display);font-size:22px;color:#f5f0e8;margin-top:8px">${iv.player}</div>
    <div style="font-size:11px;color:#8b949e">${window.vpArchLabel(iv.player)}${iv.isActive ? '' : ` &mdash; Eliminated Episode ${iv.elimEpNum}`}</div>
  </div>`;

  // Crowd reaction
  const _crowdText = iv.crowdReaction === 'wild' ? 'The crowd goes WILD. Standing ovation.'
    : iv.crowdReaction === 'warm' ? 'Warm welcome from the studio.'
    : iv.crowdReaction === 'boos' ? 'Boos from the gallery. ' + iv.player + ' doesn\'t flinch.'
    : 'Polite applause. The energy says enough.';
  html += `<div class="aftermath-crowd-${iv.crowdReaction === 'wild' ? 'wild' : iv.crowdReaction === 'boos' ? 'boos' : 'warm'}" style="text-align:center;margin-bottom:12px">${_crowdText}</div>`;

  // Entrance quote
  html += `<div style="text-align:center;font-size:13px;color:#f5f0e8;font-style:italic;margin-bottom:20px;line-height:1.6">${iv.entranceQuote}</div>`;

  // Interview questions — click to reveal (unique per interview from randomized pool)
  let questions;
  if (iv.isActive && ep.winner) {
    const _isWinner = iv.player === ep.winner;
    const _ivS = pStats(iv.player);
    const _ivAlliances = (gs.namedAlliances || []).filter(al => al.members.includes(iv.player));
    const _ivBetrayals = gs.episodeHistory.filter(h => (h.defections || []).some(d => d.player === iv.player)).length;
    const _ivChalWins = gs.chalRecord?.[iv.player]?.wins || 0;
    const _ivBigMoves = gs.playerStates?.[iv.player]?.bigMoves || 0;
    const _ivShowmance = gs.showmances?.find(sh => sh.players.includes(iv.player));
    const _otherFinalist = gs.activePlayers.find(p => p !== iv.player);
    const _otherPr = _otherFinalist ? pronouns(_otherFinalist) : null;
    const _ivBondWithOther = _otherFinalist ? getBond(iv.player, _otherFinalist) : 0;
    // Key alliance — the one they were in longest
    const _keyAlliance = _ivAlliances.sort((a, b) => (a.formed || 99) - (b.formed || 99))[0];
    // Biggest move episode
    const _bigMoveEp = gs.episodeHistory.find(h => (h.defections || []).some(d => d.player === iv.player));
    // Finale format awareness — adjust language for non-jury finales
    const _ff = seasonConfig.finaleFormat || 'traditional';
    const _isJuryFinale = _ff === 'traditional' || _ff === 'jury-cut' || _ff === 'fire-making' || _ff === 'koh-lanta';
    const _isChalFinale = _ff === 'final-challenge' || _ff === 'olympic-relay';
    const _isFanFinale = _ff === 'fan-vote';
    const _deciderLabel = _isJuryFinale ? 'the jury' : _isFanFinale ? 'the fans' : 'the final challenge';
    const _finaleLabel = _isJuryFinale ? 'Final Tribal Council' : _isFanFinale ? 'the fan vote finale' : 'the final challenge';
    const _wonByLabel = _isChalFinale ? 'won the final challenge' : _isFanFinale ? 'won the fan vote' : 'won the jury vote';
    const _lostByLabel = _isChalFinale ? 'lost the final challenge' : _isFanFinale ? 'lost the fan vote' : 'lost the jury vote';

    if (_isWinner) {
      questions = [
        { q: `"${iv.player}, you won. ${_ivChalWins} challenge wins. ${_ivAlliances.length} alliances. ${_ivBetrayals ? `${_ivBetrayals} betrayal${_ivBetrayals > 1 ? 's' : ''}.` : 'No betrayals.'} Walk us through your game — when did you first feel like you could actually win this thing?"`,
          a: _ivBigMoves >= 2 ? `"Honestly? After my second big move. There was a point where I realized I wasn't just surviving — I was controlling the game. People were coming to ME with plans, not the other way around. That's when it shifted."` : _ivChalWins >= 3 ? `"After my third immunity win, I looked around and realized nobody could touch me. The challenges gave me the safety to play aggressively — and the results spoke for themselves."` : `"It crept up on me. I never had one 'I'm going to win' moment. I just kept making the next right decision, and eventually I looked up and I was in the finale. The game came to me — I didn't force it."` },
        { q: _keyAlliance ? `"${_keyAlliance.name} was your core alliance, formed episode ${_keyAlliance.formed}. How important was that to your win?"` : `"You played a lot of this game without a strong alliance. Was that by choice?"`,
          a: _keyAlliance ? `"${_keyAlliance.name} was everything. ${_keyAlliance.members.filter(m => m !== iv.player).join(', ')} — those people kept me safe when I needed it. We didn't always agree, but we had each other's backs. Without that foundation, I don't get to the end."` : `"I realized early that alliances were targets. The big groups painted themselves. I worked from the margins — small deals, one-on-one trust — and it kept me off the radar long enough to reach the finale."` },
        { q: _otherFinalist ? `"You and ${_otherFinalist} — both finalists. ${_ivBondWithOther >= 3 ? 'You were close all season.' : _ivBondWithOther <= -2 ? 'You two had real tension.' : 'The relationship was complicated.'} What was going through your head at the end?"` : `"At the finale — what was going through your head?"`,
          a: _otherFinalist && _ivBondWithOther >= 3 ? `"Standing across from ${_otherFinalist}... that was tough. ${_otherPr.Sub} ${_otherPr.sub === 'they' ? 'were' : 'was'} my ally. My friend. And only one of us was going to win. That moment was harder than any vote, any challenge, anything."` : _otherFinalist && _ivBondWithOther <= -2 ? `"I looked at ${_otherFinalist} and I knew — one of us was about to have the best night of ${_otherPr.posAdj} life, and the other was going to carry that loss forever. After everything between us? I was NOT losing to ${_otherPr.obj}."` : `"My hands were shaking. I'd played for this moment for ${gs.episodeHistory.length} episodes. Every decision, every vote, every sleepless night — it all came down to ${_finaleLabel}."` },
        { q: `"Last question — and be honest. Is there anything you regret? Any move you wish you could take back?"`,
          a: _ivBetrayals >= 1 && _bigMoveEp ? `"Episode ${_bigMoveEp.num}. I know it was the right move — it got me here. But the way it affected the people involved... I think about that. I'm not apologizing for the move. But I can acknowledge it cost something."` : `"Regrets? No. I wouldn't change a single thing. Every move, every conversation, every risk — it all led to this. If I change one thing, maybe the whole chain falls apart. So no. I own all of it."` },
      ];
    } else {
      // Runner-up questions — format-aware
      const _ruLossQ = _isChalFinale
        ? `"${iv.player}, you made it to the final challenge. You fought for it. And you came up short. How does that feel?"`
        : _isFanFinale
        ? `"${iv.player}, you made it to the end. The fans voted — and they didn't pick you. How does that feel?"`
        : `"${iv.player}, you made it to the end. You faced ${_deciderLabel}. And you lost. How does that feel — right now, sitting on this stage?"`;
      const _ruLossA = _isChalFinale
        ? `"It's brutal. You train for that moment, you push your body to the limit, and someone just... beats you. No strategy, no social game — just raw performance. ${ep.winner} was better in that moment. I have to live with that."`
        : _isFanFinale
        ? `"The fans saw something in ${ep.winner} that they didn't see in me. Maybe I didn't give them enough to root for. That's on me. But making it to the end? I'll never regret that."`
        : `"It's the worst feeling in the game. You did everything — survived every vote, made it through every tribal — and then ${_deciderLabel} says 'not enough.' I'm proud of what I did. But losing at the final step? That stays with you."`;

      const _ruBetterQ = _otherFinalist
        ? `"Do you think ${ep.winner} ${_wonByLabel} because ${pronouns(ep.winner).sub} played better? Or was it something else?"`
        : `"Do you think ${_deciderLabel} got it right?"`;
      const _ruBetterA = _isChalFinale
        ? `"${ep.winner} won the challenge. That's not debatable. But did ${pronouns(ep.winner).sub} play a better GAME? I think that's a different question — and one we'll never get to answer."`
        : _ivBondWithOther >= 2
        ? `"${ep.winner} played a great game. But different? Not better. We took different paths and ${_deciderLabel} chose ${pronouns(ep.winner).posAdj} path. On another day, maybe it goes my way."`
        : `"Did ${pronouns(ep.winner).sub} play BETTER? Or did ${pronouns(ep.winner).sub} play differently? ${ep.winner} made flashier moves. I made quieter ones. ${_isFanFinale ? 'Quiet doesn\'t win fan votes.' : 'Quiet doesn\'t always get the credit.'} Lesson learned."`;

      questions = [
        { q: _ruLossQ, a: _ruLossA },
        { q: _ruBetterQ, a: _ruBetterA },
        { q: `"If you could go back to one specific moment and change your decision — one vote, one conversation, one alliance — what would it be?"`,
          a: _bigMoveEp ? `"Episode ${_bigMoveEp.num}. I was standing at a crossroads and I went left. If I'd gone right... maybe I'm the one holding the title. Or maybe I'm out at seventh place. You never know if the other path was better. You just know you didn't take it."` : _isChalFinale ? `"The final challenge. I second-guessed myself at a critical moment. ${ep.winner} didn't. That's the difference."` : `"The finale. I focused on defending my game instead of selling it. ${ep.winner} sold ${pronouns(ep.winner).posAdj} game. I defended mine. That's the difference between winning and losing."` },
        { q: `"One last thing — if this show called you back for another season, would you play again?"`,
          a: _ivS.boldness >= 7 ? `"In a heartbeat. I have unfinished business. I know what I'd do differently. And next time? I'm not settling for second."` : `"[long pause] ...Yeah. Yeah, I would. Because I know I can win. I just didn't. This time."` },
      ];
    }
  } else {
    questions = iv.questions || [];
  }

  const _hostReactions = [
    `${_host}: "Interesting..."`, `${_host}: "The gallery is losing it."`, `${_host}: "I did NOT see that coming."`,
    `${_host}: "Okay, okay. Next question."`, `${_host}: "The fans are going to LOVE this."`,
    `${_host}: [turns to camera] "This is why we make this show."`, `${_host}: "Moving on before someone throws something."`,
  ];
  const _galleryReactions = [
    '👏 Applause from the gallery', '😤 Murmuring in the gallery', '😱 Gasps from the back row',
    '🤣 The gallery is laughing', '😢 Someone in the gallery is wiping their eyes',
    '🔥 The gallery is HEATED', '🤫 Dead silence. You could hear a pin drop.',
  ];

  questions.forEach((qa, i) => {
    const qId = `${_revealKey}_q${i}`;
    html += `<div class="aftermath-q" onclick="(function(){var a=document.getElementById('${qId}-a');a.style.display=a.style.display==='none'?'block':'none'})()">
      <div style="font-size:12px;color:#f59e0b;font-weight:600">${_host}</div>
      <div style="font-size:13px;color:#f5f0e8;margin-top:2px">${qa.q}</div>
      <div id="${qId}-a" style="display:none;margin-top:8px">
        <div style="padding:8px;background:rgba(99,102,241,0.06);border-radius:6px;margin-bottom:6px">
          <div style="font-size:12px;color:#f59e0b;font-weight:600">${iv.player}</div>
          <div style="font-size:13px;color:#f5f0e8;line-height:1.6">${qa.a}</div>
        </div>
        ${i < questions.length - 1 ? `<div style="font-size:10px;color:#8b949e;font-style:italic;padding:2px 8px">${_hostReactions[i % _hostReactions.length]}</div>` : ''}
        ${i % 2 === 1 ? `<div style="font-size:10px;color:#6366f1;font-style:italic;padding:2px 8px">${_galleryReactions[i % _galleryReactions.length]}</div>` : ''}
      </div>
    </div>`;
  });

  // Closing statement
  html += `<div style="margin-top:12px;padding:10px;border-top:1px solid rgba(245,158,11,0.15)">
    <div style="font-size:12px;color:#f59e0b;font-weight:600">${iv.player} — Final Words</div>
    <div style="font-size:14px;color:#f5f0e8;font-style:italic;line-height:1.6;margin-top:4px">${iv.lastWords}</div>
  </div>`;

  // Gallery reactions — multiple, based on bond relationships
  const _galleryReactors = a.peanutGallery.filter(g => Math.abs(getBond(g, iv.player)) >= 2).slice(0, 3);
  _galleryReactors.forEach(g => {
    const _gBond = getBond(g, iv.player);
    const _gPr = pronouns(g);
    const _gReact = _gBond >= 5
      ? [`"Miss you out there, ${iv.player}."`, `"${iv.player} deserved better."`, `[stands up and applauds]`]
      : _gBond >= 2
      ? [`"Respect."`, `"${iv.player} played a good game."`, `[nods quietly]`]
      : _gBond <= -5
      ? [`"Good RIDDANCE."`, `"The tribe got it right."`, `"Karma."`, `"Finally."`]
      : [`"Whatever."`, `"About time."`, `"[eye roll]"`];
    html += `<div class="aftermath-reaction" style="margin-top:4px">
      ${window.rpPortrait(g, 'xs')} <span style="color:#6366f1;font-weight:600">${g}:</span> ${_gReact[Math.floor(Math.random() * _gReact.length)]}
    </div>`;
  });
  if (!_galleryReactors.length && a.peanutGallery.length) {
    html += `<div class="aftermath-reaction" style="margin-top:4px">
      <span style="color:#8b949e">The gallery watches in silence.</span>
    </div>`;
  }

  html += `</div>`;
  return html;
}

export function rpBuildAftermathTruth(ep) {
  const a = ep.aftermath;
  if (!a?.truthOrAnvil?.length) return null;
  const _host = seasonConfig.host || 'Chris';
  let html = `<div class="rp-page tod-studio">
    <div class="aftermath-live">LIVE</div>
    <div class="aftermath-title" style="font-size:28px;text-align:center;margin:16px 0 20px">TRUTH... OR ANVIL</div>`;

  a.truthOrAnvil.forEach(toa => {
    html += `<div class="aftermath-card" style="margin-bottom:20px">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
        ${window.rpPortrait(toa.player, 'lg')}
        <div>
          <div style="font-size:15px;color:#f5f0e8;font-weight:700">${toa.player}</div>
          <div style="font-size:10px;color:#f59e0b;font-weight:600;letter-spacing:1px">${toa.secretType === 'clean' ? 'CLEAN GAME' : toa.secretType.toUpperCase().replace('-', ' ')}</div>
        </div>
      </div>`;

    // Dialogue lines
    if (toa.dialogue?.length) {
      toa.dialogue.forEach(line => {
        const _isHost = line.speaker === _host;
        const _isAnvil = line.isAnvil;
        if (_isAnvil) {
          // ANVIL moment — big dramatic reveal
          html += `<div style="text-align:center;margin:10px 0;padding:12px;background:rgba(239,68,68,0.1);border:2px solid rgba(239,68,68,0.4);border-radius:8px;animation:scrollDrop 0.4s var(--ease-broadcast) both">
            <div class="aftermath-anvil" style="margin-bottom:6px">ANVIL!</div>
            <div style="font-size:12px;color:#fca5a5;line-height:1.6">${line.text.replace('ANVIL.', '').replace('"ANVIL."', '').trim()}</div>
          </div>`;
        } else {
          const _bgCol = _isHost ? 'rgba(245,158,11,0.04)' : 'rgba(139,148,158,0.04)';
          const _borderCol = _isHost ? 'rgba(245,158,11,0.15)' : 'rgba(139,148,158,0.1)';
          const _nameCol = _isHost ? '#f59e0b' : '#e6edf3';
          html += `<div style="display:flex;align-items:flex-start;gap:8px;padding:8px;margin-bottom:4px;background:${_bgCol};border:1px solid ${_borderCol};border-radius:6px">
            ${_isHost ? '<div style="font-size:18px;width:32px;text-align:center">🎤</div>' : window.rpPortrait(line.speaker, 'xs')}
            <div style="flex:1">
              <div style="font-size:9px;color:${_nameCol};font-weight:700;letter-spacing:0.5px">${line.speaker}</div>
              <div style="font-size:12px;color:#f5f0e8;line-height:1.6">${line.text}</div>
            </div>
          </div>`;
        }
      });
    }

    // Verdict badge
    if (!toa.dialogue?.some(l => l.isAnvil)) {
      html += `<div class="aftermath-truth" style="text-align:center;margin:8px 0">TRUTH</div>`;
    }

    // Consequence
    if (toa.consequence) {
      html += `<div style="font-size:11px;color:#8b949e;text-align:center;margin-top:8px;padding:6px;background:rgba(0,0,0,0.15);border-radius:4px">${toa.consequence}</div>`;
    }

    html += `</div>`;
  });

  html += `</div>`;
  return html;
}

export function rpBuildAftermathFootage(ep) {
  const a = ep.aftermath;
  if (!a?.unseenFootage?.length) return null;
  let html = `<div class="rp-page tod-studio">
    <div style="font-size:9px;font-weight:700;letter-spacing:2px;color:#f59e0b;text-align:center;margin-bottom:4px">🎬 AFTERMATH</div>
    <div class="aftermath-title" style="font-size:24px;text-align:center;margin-bottom:6px">UNSEEN FOOTAGE</div>
    <div style="font-size:11px;color:#8b949e;text-align:center;margin-bottom:20px">What the tribe never saw...</div>`;

  a.unseenFootage.forEach(clip => {
    html += `<div class="aftermath-filmstrip" style="position:relative;margin-bottom:12px">
      ${clip.classified ? '<div style="position:absolute;top:8px;right:8px;background:rgba(239,68,68,0.9);color:white;padding:2px 8px;border-radius:3px;font-size:9px;font-weight:800;letter-spacing:2px;transform:rotate(5deg)">CLASSIFIED</div>' : ''}
      <div style="font-size:9px;color:#f59e0b;font-weight:700;letter-spacing:1px;margin-bottom:4px">EPISODE ${clip.sourceEp}</div>
      <div style="display:flex;gap:4px;margin-bottom:6px">${clip.players.map(p => window.rpPortrait(p, 'xs')).join('')}</div>
      <div style="font-size:12px;color:#f5f0e8;line-height:1.6">${clip.description}</div>
    </div>`;
  });

  html += `</div>`;
  return html;
}

export function rpBuildAftermathFanCall(ep) {
  const a = ep.aftermath;
  if (!a?.fanCall) return null;
  const fc = a.fanCall;
  const _host = seasonConfig.host || 'Chris';
  const _fanTypeLabels = { superfan: 'Superfan', drama: 'Drama Fan', hater: 'The Hater', supporter: 'Biggest Fan' };
  const _fanTypeColors = { superfan: '#6366f1', drama: '#ec4899', hater: '#ef4444', supporter: '#10b981' };

  let html = `<div class="rp-page tod-studio">
    <div style="font-size:9px;font-weight:700;letter-spacing:2px;color:#f59e0b;text-align:center;margin-bottom:4px">📱 AFTERMATH</div>
    <div class="aftermath-title" style="font-size:24px;text-align:center;margin-bottom:6px">FAN CALL</div>
    <div style="font-size:11px;color:#8b949e;text-align:center;margin-bottom:20px">${fc.target} takes a call from the fans</div>`;

  // Fan info + target
  html += `<div style="display:flex;gap:16px;align-items:center;justify-content:center;margin-bottom:16px">
    <div style="text-align:center;padding:12px;border:2px solid ${_fanTypeColors[fc.fanType] || '#6366f1'}40;border-radius:10px;background:${_fanTypeColors[fc.fanType] || '#6366f1'}08">
      <div style="font-size:28px;margin-bottom:4px">📹</div>
      <div style="font-size:13px;color:${_fanTypeColors[fc.fanType] || '#6366f1'};font-weight:700">${fc.fanName}</div>
      <div style="font-size:9px;color:#8b949e">${_fanTypeLabels[fc.fanType] || 'Video Guest'}</div>
      <div class="aftermath-live" style="margin-top:4px">LIVE</div>
    </div>
    <div style="font-size:20px;color:#8b949e">→</div>
    <div style="text-align:center">
      ${window.rpPortrait(fc.target, 'lg')}
      <div style="font-size:12px;color:#f5f0e8;font-weight:600;margin-top:4px">${fc.target}</div>
    </div>
  </div>`;

  // Chat exchanges — 3 rounds of Q&A
  const _exchanges = fc.exchanges || [];
  _exchanges.forEach((ex, i) => {
    // Fan question
    html += `<div style="padding:10px 14px;background:${_fanTypeColors[fc.fanType] || '#6366f1'}08;border:1px solid ${_fanTypeColors[fc.fanType] || '#6366f1'}25;border-radius:12px 12px 12px 2px;margin-bottom:6px;margin-right:40px">
      <div style="font-size:10px;color:${_fanTypeColors[fc.fanType] || '#6366f1'};font-weight:700;margin-bottom:2px">${fc.fanName}</div>
      <div style="font-size:13px;color:#f5f0e8;line-height:1.5">${ex.q}</div>
    </div>`;
    // Player answer
    html += `<div style="padding:10px 14px;background:rgba(245,158,11,0.06);border:1px solid rgba(245,158,11,0.2);border-radius:12px 12px 2px 12px;margin-bottom:8px;margin-left:40px">
      <div style="font-size:10px;color:#f59e0b;font-weight:700;margin-bottom:2px">${fc.target}</div>
      <div style="font-size:13px;color:#f5f0e8;line-height:1.5">${ex.a}</div>
    </div>`;
    // Host reaction between exchanges
    if (fc.hostReactions?.[i] && i < _exchanges.length - 1) {
      html += `<div style="font-size:10px;color:#8b949e;font-style:italic;padding:2px 8px;margin-bottom:8px">${fc.hostReactions[i]}</div>`;
    }
  });

  // Closing
  html += `<div style="font-size:10px;color:#8b949e;font-style:italic;text-align:center;margin-top:8px">${_host}: "Thanks for calling in, ${fc.fanName}. That's our fan segment for tonight."</div>`;

  html += `</div>`;
  return html;
}

export function rpBuildAftermathFanVote(ep) {
  const a = ep.aftermath;
  if (!a?.fanVote) return null;
  const fv = a.fanVote;
  const _key = `aftermath_fv_${ep.num}`;
  // Store reveal data globally (avoiding inline script tags)
  if (!window._aftermathFVData) window._aftermathFVData = {};
  const _reversed = [...fv.results].reverse();
  window._aftermathFVData[_key] = _reversed.map(r => ({ name: r.name, isWinner: r.name === fv.winner }));

  let html = `<div class="rp-page tod-studio">
    <div class="aftermath-title" style="font-size:28px;text-align:center;margin:16px 0 6px">THE FANS HAVE VOTED</div>
    <div style="font-size:11px;color:#8b949e;text-align:center;margin-bottom:20px">One eliminated player returns to the game.</div>
    <div id="${_key}" data-revealed="0">`;

  _reversed.forEach((r, i) => {
    const isWinner = r.name === fv.winner;
    html += `<div id="${_key}-slot-${i}" style="display:flex;align-items:center;gap:10px;padding:8px 12px;margin-bottom:4px;border:1px solid rgba(139,148,158,0.1);border-radius:8px;opacity:0.15">
      <div style="width:36px;height:36px;border-radius:50%;background:rgba(139,148,158,0.15)"></div>
      <span style="flex:1;font-size:12px;color:#484f58">???</span>
    </div>`;
    html += `<div id="${_key}-content-${i}" style="display:none">
      ${window.rpPortrait(r.name, 'sm')}
      <span style="flex:1;font-size:13px;color:#f5f0e8;font-weight:600">${r.name}</span>
      <span style="font-size:11px;color:#8b949e">${r.pct}%</span>
      ${isWinner ? '<span style="font-size:9px;font-weight:700;letter-spacing:1px;color:#f59e0b;background:rgba(245,158,11,0.15);padding:2px 8px;border-radius:4px">RETURNING</span>' : ''}
    </div>`;
  });

  // Store reveal data
  html += `</div>
    <div style="text-align:center;margin-top:12px;display:flex;gap:8px;justify-content:center">
      <button onclick="aftermathFVRevealNext('${_key}')" style="padding:8px 20px;background:#f59e0b;border:none;border-radius:6px;color:#0d1117;font-family:var(--font-display);font-size:13px;letter-spacing:1px;cursor:pointer;font-weight:700">REVEAL NEXT</button>
      <button onclick="aftermathFVRevealAll('${_key}')" style="padding:6px 12px;background:transparent;border:1px solid rgba(245,158,11,0.3);border-radius:6px;color:#8b949e;font-size:11px;cursor:pointer">Reveal All</button>
    </div>`;

  html += `</div>`;
  return html;
}

export function rpBuildAftermathAwards(ep) {
  const a = ep.aftermath;
  if (!a?.awards?.length) return null;
  const _key = `aftermath_awards_${ep.num}`;

  let html = `<div class="rp-page tod-studio">
    <div class="aftermath-title" style="font-size:28px;text-align:center;margin:16px 0 6px">SEASON AWARDS</div>
    <div style="font-size:11px;color:#8b949e;text-align:center;margin-bottom:20px">Presented by ${seasonConfig.host || 'Chris'}</div>`;

  a.awards.forEach((aw, i) => {
    const _awId = `${_key}_${i}`;
    html += `<div class="aftermath-award" id="${_awId}" onclick="(function(){var c=document.getElementById('${_awId}-c');c.style.display=c.style.display==='none'?'block':'none'})()" style="cursor:pointer">
      <div style="font-size:9px;font-weight:800;letter-spacing:2px;color:#f59e0b;margin-bottom:6px">${aw.title.toUpperCase()}</div>
      <div id="${_awId}-c" style="display:none">
        ${typeof aw.winner === 'string' && players.find(p => p.name === aw.winner) ? window.rpPortrait(aw.winner, 'lg') : ''}
        <div style="font-family:var(--font-display);font-size:18px;color:#f5f0e8;margin-top:6px">${aw.winner}</div>
        <div style="font-size:12px;color:#8b949e;margin-top:4px;line-height:1.5">${aw.description}</div>
      </div>
      <div style="font-size:11px;color:#6366f1;margin-top:4px">${document.getElementById?.(_awId + '-c')?.style.display === 'none' ? 'Click to reveal' : ''}</div>
    </div>`;
  });

  // Season Rating
  if (a.seasonRating) {
    html += `<div class="aftermath-card-gold" style="text-align:center;margin-top:20px">
      <div style="font-size:9px;font-weight:800;letter-spacing:2px;color:#f59e0b;margin-bottom:6px">${(seasonConfig.host || 'Chris').toUpperCase()}'S SEASON RATING</div>
      <div style="font-family:var(--font-display);font-size:48px;color:#f59e0b;text-shadow:0 0 20px rgba(245,158,11,0.4)">${a.seasonRating.score}</div>
      <div style="font-size:11px;color:#8b949e">out of 10</div>
      <div style="font-size:14px;color:#f5f0e8;font-style:italic;margin-top:8px">"${a.seasonRating.comment}"</div>
    </div>`;
  }

  html += `</div>`;
  return html;
}

// Fan vote reveal functions
export function aftermathFVRevealNext(key) {
  const el = document.getElementById(key);
  if (!el) return;
  const revealed = parseInt(el.dataset.revealed || '0');
  const data = window._aftermathFVData?.[key];
  if (!data || revealed >= data.length) return;
  const p = data[revealed];
  const slot = document.getElementById(key + '-slot-' + revealed);
  const content = document.getElementById(key + '-content-' + revealed);
  if (slot && content) {
    slot.innerHTML = content.innerHTML;
    slot.style.opacity = '1';
    slot.style.border = p.isWinner ? '1px solid rgba(245,158,11,0.4)' : '1px solid rgba(139,148,158,0.1)';
    slot.style.background = p.isWinner ? 'rgba(245,158,11,0.06)' : 'transparent';
    slot.style.animation = 'staggerIn 0.35s var(--ease-broadcast) both';
    if (p.isWinner) slot.style.boxShadow = '0 0 0 2px #f59e0b';
  }
  el.dataset.revealed = revealed + 1;
}
export function aftermathFVRevealAll(key) {
  const el = document.getElementById(key);
  if (!el) return;
  const data = window._aftermathFVData?.[key];
  if (!data) return;
  for (let r = parseInt(el.dataset.revealed || '0'); r < data.length; r++) aftermathFVRevealNext(key);
}

export function rpBuildAftermath(ep) {
  const snap        = ep.gsSnapshot || {};
  const active      = snap.activePlayers || [];
  const tribes      = snap.tribes || [];
  const namedAll    = snap.namedAlliances || [];
  const elim        = ep.eliminated;
  const firstElim   = ep.firstEliminated || null;
  const vlog        = ep.votingLog || [];
  const allElims    = [firstElim, elim].filter(Boolean);

  // ── Vote counts ──
  const _vCounts = {};
  vlog.filter(l => l.voter !== 'THE GAME').forEach(l => { if (l.voted) _vCounts[l.voted] = (_vCounts[l.voted]||0)+1; });
  const _votedFor = new Set(Object.keys(_vCounts));
  const _votedAgainst = new Set(vlog.filter(l => l.voter !== 'THE GAME').map(l => l.voter));
  const _closeCallNames = Object.entries(_vCounts)
    .filter(([n, c]) => !allElims.includes(n) && active.includes(n) && c >= 2)
    .sort(([,a],[,b]) => b-a).map(([n]) => n);

  // ── Who voted with majority vs against ──
  const _majorityTarget = Object.entries(_vCounts).sort(([,a],[,b]) => b-a)[0]?.[0];
  const _majorityVoters = vlog.filter(l => l.voted === _majorityTarget && l.voter !== 'THE GAME').map(l => l.voter);
  const _splinterVoters = vlog.filter(l => l.voted !== _majorityTarget && active.includes(l.voter) && l.voter !== 'THE GAME').map(l => l.voter);

  // ── Bond damage: voted against someone they liked ──
  const _damagedPairs = vlog
    .filter(l => l.voter !== 'THE GAME' && active.includes(l.voter) && active.includes(l.voted))
    .map(l => ({ voter: l.voter, voted: l.voted, bond: getBond(l.voter, l.voted) }))
    .filter(p => p.bond >= 0.8)
    .sort((a,b) => b.bond - a.bond)
    .slice(0, 3);

  // ── Solo players ──
  const _soloPlayers = active.filter(n => !namedAll.some(a => a.members.includes(n)));

  // ── Dominant alliance ──
  const _dom = namedAll.filter(a => a.members.every(m => active.includes(m))).sort((a,b) => b.members.length - a.members.length)[0];

  // ── Active advantages (live gs state, not snapshot — most current) ──
  const _activeAdvs = (gs.advantages || []).filter(a => active.includes(a.holder));

  // ── Advantage context helpers ──
  const _advEpAge = (adv) => {
    const foundEp = gs.episodeHistory.find(h => h.idolFinds?.some?.(f => f.player === adv.holder) || gs.episodeHistory.indexOf(h) + 1 === adv.foundEp);
    return adv.foundEp ? ep.num - adv.foundEp : null;
  };
  const _holderGotVotes = (name) => (_vCounts[name] || 0) >= 1;
  const _holderIsBottom = (name) => {
    const inAlliance = (ep.alliances || []).find(a => a.members.includes(name));
    if (!inAlliance) return true; // unallied
    const allianceSize = inAlliance.members.filter(m => active.includes(m)).length;
    const totalActive = active.length;
    return allianceSize < Math.ceil(totalActive / 2) && !_majorityVoters.includes(name);
  };
  const _holderControlsVote = (name) => _majorityVoters.includes(name) && (_dom?.members.includes(name) || false);

  // ── POWER SHIFTS: who gained / lost ground this episode ──
  const _gained = [];
  const _lost = [];
  const _seen = new Set();

  // Immunity winner gained ground
  if (ep.immunityWinner && active.includes(ep.immunityWinner)) {
    _gained.push({ name: ep.immunityWinner, reason: 'Won individual immunity — untouchable this episode.' });
    _seen.add(ep.immunityWinner);
  }

  // Dominant alliance members who voted with the majority gained ground
  if (_dom && _majorityVoters.length) {
    _dom.members.filter(m => active.includes(m) && _majorityVoters.includes(m) && !_seen.has(m)).forEach(m => {
      _gained.push({ name: m, reason: `${_dom.name} executed the vote cleanly — their grip on this game tightened.` });
      _seen.add(m);
    });
  }

  // Players whose main rival was just eliminated
  allElims.forEach(elimName => {
    active.filter(n => !_seen.has(n) && getBond(n, elimName) <= -3).forEach(n => {
      _gained.push({ name: n, reason: `Their biggest enemy just left. The table just got easier.` });
      _seen.add(n);
    });
  });

  // Close call survivors: lost ground
  _closeCallNames.forEach(n => {
    if (!_seen.has(n)) {
      const count = _vCounts[n];
      _lost.push({ name: n, reason: `Received ${count} votes tonight — survived, but their name is in the air now.` });
      _seen.add(n);
    }
  });

  // Isolated misread: sole vote on someone still alive — wasted and (in open vote) visible
  // Does NOT flag: voted for the boot target, or voted with at least one other person (coordinated bloc)
  _splinterVoters.filter(n => !_seen.has(n)).forEach(n => {
    const theirVote = vlog.find(l => l.voter === n)?.voted;
    if (!theirVote) return;
    if (allElims.includes(theirVote)) return; // voted for someone who went home — correct read
    if (!active.includes(theirVote)) return; // target already gone for other reason
    const sameVoteCount = vlog.filter(l => l.voted === theirVote && l.voter !== 'THE GAME').length;
    if (sameVoteCount > 1) return; // coordinated bloc — not a solo misread
    // Only flag if open vote (everyone saw) or they were genuinely the sole outlier
    if (ep.openVote || sameVoteCount === 1) {
      const visibility = ep.openVote ? 'The open vote made it visible to the whole tribe.' : 'Nobody else wrote that name — the read was theirs alone.';
      _lost.push({ name: n, reason: `Voted ${theirVote} — a name nobody else wrote. ${visibility}` });
      _seen.add(n);
    }
  });

  // Unallied players: lost ground (unless they voted with majority)
  _soloPlayers.filter(n => !_seen.has(n)).forEach(n => {
    _lost.push({ name: n, reason: `No alliance, no cover. Every tribal they survive alone is borrowed time.` });
    _seen.add(n);
  });

  // Bond damage: voter faces fallout
  _damagedPairs.forEach(({ voter, voted }) => {
    if (!_seen.has(voter)) {
      _lost.push({ name: voter, reason: `Voted against ${voted} — a player they were close to. That trust is now fractured.` });
      _seen.add(voter);
    }
  });

  // Players who lost a named-alliance ally
  allElims.forEach(elimName => {
    namedAll.forEach(a => {
      if (!a.members.includes(elimName)) return;
      a.members.filter(m => active.includes(m) && !_seen.has(m)).forEach(m => {
        _lost.push({ name: m, reason: `Lost ${elimName} from ${a.name} — the alliance just got smaller and more exposed.` });
        _seen.add(m);
      });
    });
  });

  // ── Build THREADS TO WATCH ──
  const _threads = [];

  if (ep.openVote) {
    _threads.push({ icon: '!', color: '#d29922', text: `The open vote format forced everyone to declare publicly. Grievances aired at tribal don't disappear the next morning — this camp is going to be tense.` });
  }
  if (_dom && _dom.members.length >= 3) {
    const _outsiders = active.filter(n => !_dom.members.includes(n));
    _threads.push({ icon: '▲', color: '#3fb950', text: `<strong>${_dom.name}</strong> (${_dom.members.join(', ')}) holds the numbers. ${_outsiders.length ? `The other ${_outsiders.length} — ${_outsiders.join(', ')} — need to move now or accept the order.` : 'No credible opposition remains.'}` });
  }
  if (ep.idolMisplays?.length) {
    ep.idolMisplays.forEach(m => {
      if (!active.includes(m.player)) return;
      _threads.push({ icon: '?', color: '#a371f7', text: `<strong>${m.player}</strong> survived with ${m.votesAgainst} vote${m.votesAgainst !== 1 ? 's' : ''} against them — and still holds an idol they never played. The clock is ticking.` });
    });
  }
  _damagedPairs.forEach(({ voter, voted, bond }) => {
    _threads.push({ icon: '↘', color: '#f85149', text: `<strong>${voter}</strong> voted for <strong>${voted}</strong> — a bond of ${bond.toFixed(1)} before tonight. That wound doesn't heal overnight.` });
  });
  // Context-sensitive advantage threads
  _activeAdvs.forEach(a => {
    const age = a.foundEp ? ep.num - a.foundEp : null;
    const gotVotes = _holderGotVotes(a.holder);
    const isBottom = _holderIsBottom(a.holder);
    const controlsVote = _holderControlsVote(a.holder);
    let advText = '';
    if (a.type === 'idol') {
      if (gotVotes) {
        advText = `<strong>${a.holder}</strong> survived tonight with their idol unplayed — and votes came their way. The window to use it correctly is narrowing.`;
      } else if (controlsVote) {
        advText = `<strong>${a.holder}</strong> just ran the vote AND holds a hidden idol. The safest player in the game still has an insurance policy.`;
      } else if (isBottom) {
        advText = `<strong>${a.holder}</strong> is not in the majority — and they're holding a hidden idol. Desperation and advantages are a volatile combination.`;
      } else if (age !== null && age >= 4) {
        advText = `<strong>${a.holder}</strong> has been sitting on their idol since Episode ${a.foundEp}. ${age} episodes later, the risk of waiting keeps compounding.`;
      } else {
        advText = `<strong>${a.holder}</strong> holds a hidden immunity idol. The question isn't whether they'll play it — it's whether they'll read the moment right.`;
      }
    } else if (a.type === 'extra-vote') {
      if (isBottom) {
        advText = `<strong>${a.holder}</strong> has an Extra Vote and is on the outside. One well-placed double vote could flip their position entirely.`;
      } else {
        advText = `<strong>${a.holder}</strong> holds an Extra Vote — a surgical tool. The longer they hold it, the more likely someone else finds out.`;
      }
    } else if (a.type === 'beware') {
      advText = `<strong>${a.holder}</strong> has the Beware Advantage${!a.activated ? ' — their vote is still restricted until activation' : ' (activated)'}. Advantage players get targeted at merge.`;
    } else {
      advText = `<strong>${a.holder}</strong> holds a ${a.type.replace(/-/g,' ')}. They haven't played it yet — and every episode that passes is a reason someone might come for them.`;
    }
    _threads.push({ icon: '◆', color: '#a371f7', text: advText });
  });
  // ── Additional threads from game state ──

  // Close vote — someone almost went home
  if (ep.votes) {
    const _voteSorted = Object.entries(ep.votes).sort(([,a],[,b]) => b - a);
    if (_voteSorted.length >= 2 && _voteSorted[0][1] - _voteSorted[1][1] <= 1 && _voteSorted[1][0] !== elim && active.includes(_voteSorted[1][0])) {
      _threads.push({ icon: '!', color: '#f0883e', text: `<strong>${_voteSorted[1][0]}</strong> was one vote away from going home. ${_voteSorted[1][1]} vote${_voteSorted[1][1]!==1?'s':''} against — that margin doesn't make anyone feel safe.` });
    }
  }

  // Betrayal — alliance member voted against their own
  const _betrayals = (ep.votingLog || []).filter(v => {
    if (v.voter === 'THE GAME' || v.voted === elim) return false;
    return (ep.alliances || []).some(a => a.members?.includes(v.voter) && a.members?.includes(v.voted));
  });
  if (_betrayals.length && !_threads.some(t => t.text.includes(_betrayals[0].voter))) {
    const b = _betrayals[0];
    _threads.push({ icon: '✕', color: '#f85149', text: `<strong>${b.voter}</strong> voted against <strong>${b.voted}</strong> — their own alliance member. That's not a misfire. That's a signal.` });
  }

  // Someone flipped — voted differently from their alliance majority
  const _flipVoters = (ep.votingLog || []).filter(v => {
    if (v.voter === 'THE GAME') return false;
    const voterAlliance = (ep.alliances || []).find(a => a.members?.includes(v.voter) && a.target);
    return voterAlliance && v.voted !== voterAlliance.target && active.includes(v.voter);
  });
  if (_flipVoters.length && !_threads.some(t => t.text.includes(_flipVoters[0].voter))) {
    _threads.push({ icon: '↔', color: '#d29922', text: `<strong>${_flipVoters[0].voter}</strong> didn't vote with their alliance tonight. Was it a mistake, a statement, or the start of something new?` });
  }

  // New alliance formed this episode
  const _newAlliances = (ep.allianceRecruits || []).filter(r => r.scenario !== 'blindside-swing');
  if (_newAlliances.length) {
    const first = _newAlliances[0];
    _threads.push({ icon: '★', color: '#3fb950', text: `<strong>${first.toAlliance}</strong> just formed. New alliances this late in the game don't happen unless someone feels unsafe.` });
  }

  // Alliance refusal
  if (ep.allianceRefusals?.length) {
    const ref = ep.allianceRefusals[0];
    _threads.push({ icon: '✕', color: '#8b949e', text: `<strong>${ref.player}</strong> turned down an offer from <strong>${ref.recruiter}</strong>. That rejection will be remembered.` });
  }

  // Emotional state — multiple paranoid/desperate players
  const _paranoidPlayers = active.filter(n => {
    const state = gs.playerStates?.[n]?.emotional;
    return state === 'paranoid' || state === 'desperate';
  });
  if (_paranoidPlayers.length >= 2) {
    _threads.push({ icon: '⚡', color: '#f85149', text: `${_paranoidPlayers.join(' and ')} are both on edge. When multiple players feel unsafe, the vote becomes unpredictable.` });
  }

  // Challenge streak
  const _winStreak = active.find(n => {
    const last3 = (gs.episodeHistory || []).slice(-3);
    return last3.length >= 2 && last3.filter(e => e.immunityWinner === n).length >= 2;
  });
  if (_winStreak) {
    _threads.push({ icon: '▲', color: '#e3b341', text: `<strong>${_winStreak}</strong> has won immunity in back-to-back episodes. The tribe can't touch them — and they know it.` });
  }

  // Solo player — no alliance, no strong bonds
  const _twSoloPlayers = active.filter(n => {
    const inAlliance = (gs.namedAlliances || []).some(a => a.active && a.members.includes(n) && a.members.filter(m => active.includes(m)).length >= 2);
    if (inAlliance) return false;
    const avgBond = active.filter(p => p !== n).reduce((s,p) => s + getBond(n,p), 0) / Math.max(1, active.length - 1);
    return avgBond < 0.5;
  });
  if (_twSoloPlayers.length === 1) {
    _threads.push({ icon: '◇', color: '#8b949e', text: `<strong>${_twSoloPlayers[0]}</strong> is playing alone. No alliance, no strong bonds. Either that's by choice — or nobody wants them.` });
  }

  if (!_threads.length) _threads.push({ icon: '→', color: '#8b949e', text: `The vote went cleanly. The tribe knows where it stands — for now.` });

  // ── Build HTML ──
  const _threadRow = t => `<div style="display:flex;gap:10px;margin-bottom:10px;padding:10px 12px;background:#161b22;border-left:3px solid ${t.color};border-radius:0 6px 6px 0">
    <div style="font-size:14px;color:${t.color};flex-shrink:0;width:16px;text-align:center">${t.icon}</div>
    <div style="font-size:12px;color:#cdd9e5;line-height:1.6">${t.text}</div>
  </div>`;

  let html = `<div class="rp-page tod-posttribal" style="padding-bottom:32px">
    <div style="font-size:9px;font-weight:800;letter-spacing:2px;color:#8b949e;margin-bottom:4px">Episode ${ep.num}</div>
    <div style="font-size:22px;font-weight:700;color:#e6edf3;margin-bottom:24px">Aftermath</div>`;

  // ── Comfort blindspot callout ──
  if (ep.comfortBlindspotPlayer && ep.comfortBlindspotPlayer === elim) {
    html += `<div class="vp-card fire" style="margin-bottom:16px">
      <div style="font-family:var(--font-body);font-size:11px;font-weight:800;letter-spacing:1px;color:var(--accent-fire);margin-bottom:4px">CHECKED OUT</div>
      <div style="font-size:13px;color:#cdd9e5;line-height:1.6">${elim} was seen checked out at camp before Tribal — the tribe noticed, and it sealed the vote.</div>
    </div>`;
  }

  // ── Section 1: Power Shifts ──
  if (_gained.length || _lost.length) {
    html += `<div style="margin-bottom:28px">
      <div style="font-size:9px;font-weight:800;letter-spacing:2px;color:#484f58;margin-bottom:14px">POWER SHIFTS</div>`;
    if (_gained.length) {
      html += `<div style="font-size:9px;font-weight:700;letter-spacing:1px;color:#3fb950;margin-bottom:8px">GAINED GROUND</div>`;
      _gained.slice(0, 4).forEach(({ name, reason }) => {
        html += `<div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:10px;padding:10px 12px;background:#0d1117;border:1px solid #21262d;border-left:3px solid #3fb950;border-radius:0 6px 6px 0">
          ${window.rpPortrait(name, 'sm')}
          <div>
            <div style="font-size:12px;font-weight:700;color:#e6edf3;margin-bottom:3px">${name}</div>
            <div style="font-size:11px;color:#8b949e;line-height:1.5">${reason}</div>
          </div>
        </div>`;
      });
    }
    if (_lost.length) {
      html += `<div style="font-size:9px;font-weight:700;letter-spacing:1px;color:#f85149;margin-top:${_gained.length ? 12 : 0}px;margin-bottom:8px">LOST GROUND</div>`;
      _lost.slice(0, 4).forEach(({ name, reason }) => {
        html += `<div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:10px;padding:10px 12px;background:#0d1117;border:1px solid #21262d;border-left:3px solid #f85149;border-radius:0 6px 6px 0">
          ${window.rpPortrait(name, 'sm')}
          <div>
            <div style="font-size:12px;font-weight:700;color:#e6edf3;margin-bottom:3px">${name}</div>
            <div style="font-size:11px;color:#8b949e;line-height:1.5">${reason}</div>
          </div>
        </div>`;
      });
    }
    html += `</div>`;
  }

  // ── Section 2: Alliance Moves (recruits + quits this episode) ──
  const _recruits = ep.allianceRecruits || [];
  const _quits    = ep.allianceQuits    || [];
  if (_recruits.length || _quits.length) {
    html += `<div style="margin-bottom:28px">
      <div style="font-size:9px;font-weight:800;letter-spacing:2px;color:#484f58;margin-bottom:14px">ALLIANCE MOVES</div>`;
    _recruits.forEach(({ player, toAlliance, fromAlliance, scenario }) => {
      const _scenLabel = scenario === 'swap-outsider' ? 'Needed a home after the swap.'
        : scenario === 'post-quit' ? 'Just cut loose from another group — landed here.'
        : scenario === 'blindside-swing' ? 'Voted with them tonight. Now it\'s official.'
        : '';
      const _fromNote = fromAlliance ? ` Left <strong>${fromAlliance}</strong>.` : '';
      html += `<div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:10px;padding:10px 12px;background:#0d1117;border:1px solid #21262d;border-left:3px solid #3fb950;border-radius:0 6px 6px 0">
        ${window.rpPortrait(player, 'sm')}
        <div>
          <div style="font-size:12px;font-weight:700;color:#e6edf3;margin-bottom:3px">${player} → <span style="color:#3fb950">${toAlliance}</span></div>
          <div style="font-size:11px;color:#8b949e;line-height:1.5">${_scenLabel}${_fromNote}</div>
        </div>
      </div>`;
    });
    _quits.forEach(({ player, alliance: qAlliance, reason }) => {
      html += `<div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:10px;padding:10px 12px;background:#0d1117;border:1px solid #21262d;border-left:3px solid #f85149;border-radius:0 6px 6px 0">
        ${window.rpPortrait(player, 'sm')}
        <div>
          <div style="font-size:12px;font-weight:700;color:#e6edf3;margin-bottom:3px">${player} ✕ <span style="color:#f85149">${qAlliance}</span></div>
          <div style="font-size:11px;color:#8b949e;line-height:1.5">${reason || 'Stepped away from the alliance.'}</div>
        </div>
      </div>`;
    });
    html += `</div>`;
  }

  // ── Section 3: Threads to Watch ──
  html += `<div style="margin-bottom:28px">
    <div style="font-size:9px;font-weight:800;letter-spacing:2px;color:#484f58;margin-bottom:14px">THREADS TO WATCH</div>
    ${_threads.map(_threadRow).join('')}
  </div>`;

  // ── Section 4: Next Episode ──
  const _qs = buildNextEpQs(ep);
  html += `<div>
    <div style="font-size:9px;font-weight:800;letter-spacing:2px;color:#484f58;margin-bottom:14px">NEXT EPISODE</div>
    <div style="display:flex;flex-direction:column;gap:8px">
      ${_qs.map((q,i) => `<div style="padding:12px 14px;background:#161b22;border:1px solid #21262d;border-radius:6px">
        <span style="font-size:9px;font-weight:800;letter-spacing:1px;color:#58a6ff;margin-right:8px">${i+1}</span>
        <span style="font-size:12px;color:#cdd9e5;line-height:1.5">${q}</span>
      </div>`).join('')}
    </div>
  </div>`;

  html += `</div>`; // rp-page
  return html;
}
