// ══════════════════════════════════════════════════════════════════════
// vp-screens.js — VP screen builders, helpers, and the main buildVPScreens controller
// ══════════════════════════════════════════════════════════════════════

import { rpBuildHideAndBeSneaky } from './chal/hide-and-be-sneaky.js';
import { rpBuildOffTheChain } from './chal/off-the-chain.js';
import { rpBuildWawanakwaGoneWild } from './chal/wawanakwa-gone-wild.js';

// ══════════════════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════════════
// VISUAL EPISODE PLAYER
// ══════════════════════════════════════════════════════════════════════

export let vpCurrentScreen = 0;
export let vpScreens = [];
export let vpEpNum = 0;
export function setVpCurrentScreen(v) { vpCurrentScreen = v; }
export function setVpScreens(v) { vpScreens = v; }
export function setVpEpNum(v) { vpEpNum = v; }

// ── parseSummaryText: split summary string into named sections ──
export function parseSummaryText(text) {
  const sections = {};
  const lines = (text || '').split('\n');
  let key = null;
  for (const line of lines) {
    const m = line.match(/^=== (.+?) ===$/);
    if (m) { key = m[1].trim(); sections[key] = []; }
    else if (key) sections[key].push(line);
  }
  return sections;
}

// ── Portrait helper (BrantSteele-style square image + name) ──
export function rpPortrait(name, cls='', badge='') {
  if (!name) return `<div class="rp-portrait ${cls}"><div class="rp-portrait-img"><span>?</span></div><div class="rp-portrait-name">?</div></div>`;
  const p = players.find(x => x.name === name);
  const slug = p?.slug || name.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'');
  const init = (name||'?')[0].toUpperCase();
  return `<div class="rp-portrait ${cls}">
    <div class="rp-portrait-img">
      <img src="assets/avatars/${slug}.png"
           onerror="this.style.display='none';this.nextElementSibling.style.display='block'" />
      <span style="display:none">${init}</span>
    </div>
    <div class="rp-portrait-name">${name}</div>
    ${badge ? `<div class="rp-portrait-badge">${badge}</div>` : ''}
  </div>`;
}

export function rpDuoImg(nameA, nameB) {
  const slugA = (players.find(x=>x.name===nameA)?.slug) || nameA.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'');
  const slugB = (players.find(x=>x.name===nameB)?.slug) || nameB.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'');
  const ia = nameA[0].toUpperCase(), ib = nameB[0].toUpperCase();
  return `<div class="rp-rel-duo">
    <div class="rp-portrait-img" style="width:64px;height:64px;font-size:20px">
      <img src="assets/avatars/${slugA}.png" onerror="this.style.display='none';this.nextElementSibling.style.display='block'" />
      <span style="display:none">${ia}</span>
    </div>
    <div class="rp-portrait-img" style="width:64px;height:64px;font-size:20px;margin-left:-14px;border-color:#0d1117">
      <img src="assets/avatars/${slugB}.png" onerror="this.style.display='none';this.nextElementSibling.style.display='block'" />
      <span style="display:none">${ib}</span>
    </div>
  </div>`;
}

export function vpArchLabel(name) {
  const p = players.find(x => x.name === name);
  return ARCHETYPE_NAMES[p?.archetype] || p?.archetype || '';
}

export function vpConfessionalMood(name, ep, role) {
  const s = pStats(name);
  if (role === 'immunity') return 'confident';
  if (role === 'target') return s.boldness >= 7 ? 'strategic' : 'worried';
  if (role === 'spearheader') return 'strategic';
  if (role === 'swing') return 'bitter';
  if (s.strategic >= 8) return 'strategic';
  if (ep?.immunityWinner === name) return 'confident';
  return 'neutral';
}

export function vpGenerateQuote(name, ep, role) {
  const s = pStats(name);
  const arch = players.find(x => x.name === name)?.archetype || '';
  const elim = ep?.eliminated;
  const quotes = {
    immunity: [
      `Winning individual immunity feels incredible. I was definitely a target, but now I'm safe for at least one more round.`,
      `I proved I can win when it matters. This should earn me some respect from the others.`,
      `Safety feels good, but now I need to think about the next vote. Who goes home when it's not me?`,
      `This immunity couldn't have come at a better time. Now I can orchestrate some moves without worrying about my own neck.`,
    ],
    spearheader: [
      `I know exactly what needs to happen tonight. I've lined up the votes. Now I just need everyone to hold.`,
      `Tonight is about making a move that the jury will remember. Calculated. Not emotional.`,
      `I've been working on this for days. If my alliance stays together, it's going to be clean. If not — chaos.`,
      `Everyone trusts me right now. That's exactly where I want to be. Tonight I put that trust to work.`,
      s.strategic >= 8 ? `The game is chess. I've been thinking six moves ahead since day one. Tonight is just the next move.` : `This is my shot to take control. I'm not letting it slip.`,
    ],
    target: [
      `I know my name is being thrown around. But I've survived worse. I'm not going anywhere without a fight.`,
      `They think I don't see what's happening. I see everything. The question is whether I can do anything about it.`,
      `I'm a potential target tonight. Emphasis on 'potential.' I still have time to get out of this.`,
      `If they write my name down tonight, they'll regret it eventually. But hopefully it doesn't come to that.`,
      `I'm not panicking. Not yet. But I'm watching every conversation very carefully.`,
    ],
    swing: [
      `My alliance wants one name. My gut wants another. Whatever I do tonight, someone's going to be upset with me.`,
      `I'm being pulled in two directions and I don't know which one I trust more. This is the hardest vote yet.`,
      s.loyalty <= 4 ? `Loyalty only goes so far. I have to play for myself eventually. Maybe tonight is that night.` : `I want to stay loyal but the numbers aren't adding up. Something has to give.`,
      `Both sides have made their case. I just have to decide which future I want to be part of.`,
    ],
    wrong_side: [
      `I was on the wrong side of the numbers tonight. Now I have to figure out how to get back.`,
      `My vote didn't matter in the end. I have to fix that before the next tribal.`,
      `I read this wrong. I won't read it wrong twice.`,
    ],
    eliminated: [
      // Archetype / stat-driven exit speech — priority pick at index 0
      (arch === 'mastermind' || arch === 'schemer')
        ? `I had the best read in this game. Someone just had a better one tonight. That's hard to sit with.`
        : (arch === 'hothead' || s.temperament <= 3)
        ? `I burned too loud. I know that now. But I'd rather go out playing loud than survive playing quiet.`
        : (arch === 'social-butterfly' || s.social >= 8)
        ? `I came here to build real connections and I did. They voted me out anyway. That's this game — the connections were still real.`
        : (arch === 'loyal-soldier' || s.loyalty >= 8)
        ? `I was loyal to the end. Maybe too loyal. That's a lesson I'll carry out of here.`
        : `I played the game I came here to play. It just ended sooner than I planned.`,
      // Secondary — stat-driven
      (s.strategic >= 8)
        ? `I saw almost everything coming in this game. Just not this one. That's the move that gets you.`
        : (s.boldness >= 8)
        ? `I took shots. Some landed. This one didn't. That's the game.`
        : (s.social >= 7)
        ? `I built trust out here. Someone used it against me tonight. I can respect the move — it still stings.`
        : `I'm walking out with my head up. Whatever happened tonight, I played my game.`,
      // Emotional context
      (gs.playerStates?.[name]?.emotional === 'comfortable')
        ? `I didn't see it coming. I was comfortable. That's on me — and that's this game.`
        : (gs.playerStates?.[name]?.emotional === 'content')
        ? `I thought I was in a decent spot. Apparently I read that wrong.`
        : (gs.playerStates?.[name]?.emotional === 'uneasy')
        ? `I felt it coming. Something was off all day. I just couldn't figure out what to do about it.`
        : (gs.playerStates?.[name]?.emotional === 'calculating')
        ? `I had a plan going into tonight. Someone else had a better one. I can respect that.`
        : (gs.playerStates?.[name]?.emotional === 'paranoid' || gs.playerStates?.[name]?.emotional === 'desperate')
        ? `I knew it was coming and still couldn't stop it. That's the most frustrating way to go out.`
        : `This game will eat you alive if you let it. Apparently it got to me a little early.`,
      // Fallback
      `It hurts. But I watched people play safe and small and go home anyway. At least I actually played.`,
    ],
    juryEliminated: (() => {
      // Context-aware jury elimination quotes — pull in juror names and bond data
      const _jeTw = (ep?.twists||[]).find(t => t.type === 'jury-elimination' && t.juryBooted === name);
      const _jeLog = _jeTw?.elimLog || [];
      const _jeVotedMe = _jeLog.filter(e => e.votedOut === name).map(e => e.juror);
      const _jeVotedOther = _jeLog.filter(e => e.votedOut !== name).map(e => e.juror);
      const _jeBitter = _jeVotedMe.find(j => getBond(j, name) <= -2);
      const _jeBetrayedAlly = _jeVotedMe.find(j => getBond(j, name) >= 2);
      const _jeDefender = _jeVotedOther.length ? _jeVotedOther[0] : null;
      const pool = [];

      // Archetype-driven jury reactions
      if (arch === 'mastermind' || arch === 'schemer')
        pool.push(`I ran circles around every person still in this game. And the people I already beat? They're the ones who took me out. That's not strategy \u2014 that's revenge.`);
      else if (arch === 'challenge-beast')
        pool.push(`I won immunity tonight. They couldn't touch me in the challenge. So instead they used people who aren't even playing anymore to get rid of me. That's what this game does to you.`);
      else if (arch === 'social-butterfly' || s.social >= 8)
        pool.push(`I spent every day out here building trust. Real trust. And the jury just proved that none of it mattered. The people who left the game decided my fate, not the people I was playing with.`);
      else if (arch === 'hothead' || s.temperament <= 3)
        pool.push(`The jury? Seriously? People I already outplayed get to vote me out from the bench? I burned some bridges, fine \u2014 but they should have stayed burned. Not come back to set fire to my game.`);
      else if (arch === 'loyal-soldier' || s.loyalty >= 8)
        pool.push(`I was loyal to my people every single day. The jury saw that and punished me for it. Loyalty makes you predictable, and predictable makes you a target \u2014 even from people who aren't in the game anymore.`);
      else if (arch === 'underdog')
        pool.push(`I fought from the bottom the entire game. Survived every vote. And then the jury \u2014 people who couldn't survive their own votes \u2014 got to end mine. That's a hard way to go.`);
      else
        pool.push(`I didn't lose to anyone still in this game. I lost to the people sitting on the sidelines. That's going to take a while to process.`);

      // Bitter juror reaction
      if (_jeBitter)
        pool.push(`${_jeBitter} never forgave me. I saw it in their eyes every time they walked into tribal. And tonight they finally got to do something about it. From the jury bench. That's the kind of grudge that follows you out of this game.`);

      // Betrayed ally reaction
      if (_jeBetrayedAlly)
        pool.push(`${_jeBetrayedAlly} voted against me. We were supposed to be close. But the jury bench changes people \u2014 you sit there watching, replaying every decision, and trust turns into resentment. I get it. I just wish I didn't have to.`);

      // Defender acknowledgment
      if (_jeDefender)
        pool.push(`${_jeDefender} fought for me in that jury room. I could see it. Not everyone wanted me gone \u2014 but enough did. And that's all it takes.`);

      // Strategic awareness quotes
      if (s.strategic >= 7)
        pool.push(`I prepared for every scenario in this game. Idol plays, alliance flips, tiebreakers \u2014 all of it. But you can't prepare for the eliminated players coming back with a vote. That's not a move I could counter.`);

      // Bond-driven context
      if (_jeVotedMe.length >= 3)
        pool.push(`${_jeVotedMe.length} jurors wrote my name down. That many people wanting you gone \u2014 that's not a vote, that's a verdict. I played too hard, too visibly, and the jury made me pay for it.`);

      // Emotional state reactions
      if (gs.playerStates?.[name]?.emotional === 'comfortable' || gs.playerStates?.[name]?.emotional === 'content')
        pool.push(`I was focused on the people still playing. I wasn't thinking about the jury. I should have been. The threats you forget about are the ones that end your game.`);
      else if (gs.playerStates?.[name]?.emotional === 'paranoid' || gs.playerStates?.[name]?.emotional === 'desperate')
        pool.push(`I felt the walls closing in all day. I just thought the threat was coming from inside the game. Turns out it was coming from the jury bench. I couldn't play defense against something I couldn't see.`);

      // Universal jury elimination fallbacks
      pool.push(`I didn't get outplayed by anyone in this game. I got eliminated by people who already lost. That's the twist \u2014 and it's the cruelest one they could have thrown at me.`);
      pool.push(`The jury got to play god tonight. They sat in that room, weighed every grudge and every alliance, and decided I was the one who had to go. I respect the power. I just wish I'd had a chance to fight back.`);

      return pool;
    })(),
    general: [
      s.strategic >= 8 ? `Every vote is information. I'm cataloguing everything.` : `This game is exhausting. But I'm still here, and that's what matters.`,
      s.social >= 8 ? `I just need to keep the relationships strong. Everything else follows from that.` : `Surviving another round. That's the goal. One vote at a time.`,
      s.boldness >= 8 ? `Some people are playing not to lose. I'm playing to win. Big difference.` : `I don't want to rock the boat right now. Quiet is safe.`,
      `I'm not going to panic. I'm going to trust the process and see what happens at tribal.`,
    ],
  };
  const pool = quotes[role] || quotes.general;
  // Use player name as seed for deterministic but varied picks
  const idx = (name.charCodeAt(0) + (ep?.num || 0)) % pool.length;
  return pool[idx];
}

export function vpGetConfessionalRole(name, ep) {
  if (!ep) return 'general';
  if (ep.immunityWinner === name) return 'immunity';
  if (ep.eliminated === name) return 'target';
  const isSpear = ep.alliances?.some(a => a.members?.[0] === name && a.members.length >= 2 && a.target);
  if (isSpear) return 'spearheader';
  const s = pStats(name);
  const onWrongSide = ep.votingLog?.some(v => v.voter === name && v.voted !== ep.eliminated);
  if (onWrongSide) return 'wrong_side';
  if (s.loyalty <= 5) return 'swing';
  return 'general';
}

// ══════════════════════════════════════════════════════════════════════
// VISUAL PLAYER — BrantSteele-inspired rebuild
// ══════════════════════════════════════════════════════════════════════

// ── Screen 0a: Dock Arrival — Episode 1 replacement for Cold Open ──
export function _rpBuildDockArrival(ep) {
  const arrivals = ep.dockArrivals;
  const host = seasonConfig.host || 'Chris';
  const seasonName = seasonConfig.name || 'Total Drama';
  const stateKey = `dock_arrivals_${ep.num}`;
  if (!_tvState[stateKey]) _tvState[stateKey] = { idx: -1 };
  const state = _tvState[stateKey];

  const allRevealed = state.idx >= arrivals.length - 1;
  const _daReveal = (targetIdx) => `if(!_tvState['${stateKey}'])_tvState['${stateKey}']={idx:-1};_tvState['${stateKey}'].idx=${targetIdx};const ep=gs.episodeHistory.find(e=>e.num===${ep.num});if(ep){buildVPScreens(ep);renderVPScreen();}`;

  const returneeCount = arrivals.filter(a => a.isReturnee).length;
  const newbieCount = arrivals.length - returneeCount;
  const isAllReturnees = newbieCount === 0;
  const isMixed = returneeCount > 0 && newbieCount > 0;

  const hostMonologue = isAllReturnees
    ? `"They've played before. They've won, they've lost, they've been blindsided and betrayed. And they all came back for more. I'm ${host}, and this is ${seasonName} — All Stars. ${arrivals.length} returning players. One winner. Let's see who learned from their mistakes... and who's about to make new ones."`
    : isMixed
    ? `"Tonight, ${returneeCount} returning player${returneeCount>1?'s':''} face${returneeCount===1?'s':''} off against ${newbieCount} brand new competitor${newbieCount>1?'s':''}. The veterans think they know this game. The rookies think they can beat it. I'm ${host}, and this is ${seasonName}. Let's find out who's right."`
    : `"Yo! We're coming at you live from Camp Wawanakwa! I'm your host, ${host}. ${arrivals.length} players have signed up to spend eight weeks at this crummy old summer camp. They'll compete in challenges, vote each other out at tribal council, and the last one standing wins the prize. Every moment will be caught on camera. Who will crumble? Who will rise? Find out right here on... ${seasonName}!"`;

  let html = `<div class="rp-page tod-dawn">
    <div class="rp-co-eyebrow">${seasonName}</div>
    <div style="font-family:var(--font-display);font-size:32px;letter-spacing:3px;text-align:center;color:var(--accent-gold);text-shadow:0 0 20px var(--accent-gold);margin:10px 0 6px;animation:scrollDrop 0.5s var(--ease-broadcast) both">THE ARRIVAL</div>
    <div style="text-align:center;font-size:12px;color:#8b949e;margin-bottom:20px">${arrivals.length} players. One island. No idea what they signed up for.</div>
    <div style="padding:14px;background:rgba(227,179,65,0.06);border:1px solid rgba(227,179,65,0.15);border-radius:10px;text-align:center;margin-bottom:20px">
      <div style="font-size:10px;color:#f0a500;font-weight:700;letter-spacing:1px;margin-bottom:4px">${host.toUpperCase()}</div>
      <div style="font-size:13px;color:#e6edf3;line-height:1.7;font-style:italic">${hostMonologue}</div>
    </div>`;

  arrivals.forEach((a, i) => {
    const isVisible = i <= state.idx;
    if (!isVisible) {
      html += `<div id="dock-arr-${i}" style="padding:10px;margin-bottom:6px;border:1px solid var(--border);border-radius:8px;opacity:0.12;text-align:center;font-size:11px;color:var(--muted)">Arrival #${i + 1} — ?</div>`;
      return;
    }
    const returnBadge = a.isReturnee ? `<span style="font-size:9px;font-weight:700;letter-spacing:1px;color:#f59e0b;background:rgba(245,158,11,0.12);padding:2px 6px;border-radius:3px;margin-left:6px">RETURNING</span>` : '';
    html += `<div id="dock-arr-${i}" class="vp-card" style="border-color:rgba(227,179,65,0.12);margin-bottom:8px;animation:scrollDrop 0.3s var(--ease-broadcast) both">
      <div style="display:flex;align-items:flex-start;gap:12px">
        ${rpPortrait(a.name, 'md')}
        <div style="flex:1">
          <div style="font-family:var(--font-display);font-size:15px;color:#e6edf3;margin-bottom:2px">${a.name}${returnBadge}</div>
          <div style="font-size:10px;color:#8b949e;margin-bottom:6px">${ARCHETYPE_NAMES[a.archetype] || a.archetype}</div>
          <div style="font-size:11px;color:#f0a500;font-style:italic;margin-bottom:4px">${host}: ${a.hostLine}</div>
          <div style="font-size:13px;color:#e6edf3;line-height:1.6">${a.name}: ${a.playerLine}</div>
          ${a.dockReaction ? `<div style="font-size:12px;color:#8b949e;font-style:italic;margin-top:6px;padding-top:6px;border-top:1px solid rgba(255,255,255,0.04)">${a.dockReaction.text}</div>` : ''}
        </div>
      </div>
    </div>`;
  });

  if (!allRevealed) {
    html += `<div style="text-align:center;margin-top:16px">
      <button class="rp-btn" onclick="${_daReveal(state.idx + 1)}">NEXT ARRIVAL (${state.idx + 2}/${arrivals.length})</button>
      <button class="rp-btn" style="margin-left:8px;opacity:0.6" onclick="${_daReveal(arrivals.length - 1)}">Reveal All</button>
    </div>`;
  } else {
    html += `<div style="text-align:center;margin-top:20px;padding:16px;border:1px solid rgba(227,179,65,0.15);border-radius:10px;background:rgba(227,179,65,0.04)">
      <div style="font-size:9px;font-weight:700;letter-spacing:2px;color:#f0a500;margin-bottom:10px">GROUP PHOTO</div>
      <div style="font-size:12px;color:#8b949e;font-style:italic;margin-bottom:12px">"Everybody on the dock! ...try not to break it this time."</div>
      <div style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center">${arrivals.map(a => rpPortrait(a.name, 'sm')).join('')}</div>
    </div>`;

    const tribes = ep.tribesAtStart || gs.tribes || [];
    if (tribes.length >= 2) {
      html += `<div style="margin-top:16px;padding-top:16px;border-top:1px solid rgba(255,255,255,0.06)">
        <div style="font-family:var(--font-display);font-size:18px;letter-spacing:2px;text-align:center;color:#e6edf3;margin-bottom:12px">THE TEAMS</div>`;
      tribes.forEach(t => {
        const tc = tribeColor(t.name);
        html += `<div style="margin-bottom:12px">
          <div style="font-size:14px;font-weight:700;color:${tc};text-align:center;margin-bottom:6px">${t.name}</div>
          <div style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center">${(t.members||[]).map(m => rpPortrait(m, 'sm')).join('')}</div>
        </div>`;
      });
      html += `</div>`;
    }
  }

  html += `</div>`;
  return html;
}

// ── Screen 0: Cold Open — full cast status grid ──
export function rpBuildColdOpen(ep) {
  // ── Episode 1: Dock Arrival Sequence ──
  if (ep.num === 1 && ep.dockArrivals?.length) {
    return _rpBuildDockArrival(ep);
  }
  // Use the PREVIOUS episode's snapshot for eliminated/RI status — the current
  // ep.gsSnapshot is taken after this episode ran, so it already includes this boot.
  const prevEp   = (gs.episodeHistory || []).filter(h => h.num < ep.num).slice(-1)[0];
  const prevSnap = prevEp?.gsSnapshot || {};

  // Use tribes at start of this episode for grouping active players
  const tribesAtStart = ep.tribesAtStart?.length
    ? ep.tribesAtStart
    : (prevSnap.phase === 'pre-merge' && prevSnap.tribes?.length ? prevSnap.tribes : null);

  // All players who started the season, in roster order
  const allPlayers = players.map(p => p.name);

  // Status at the START of this episode (before this ep's elimination)
  const elimAtStart = new Set(prevSnap.eliminated || []);
  const riAtStart   = new Set(prevSnap.riPlayers  || []);
  const exilePlayer = prevSnap.exileDuelPlayer || null;
  const activeAtStart = tribesAtStart
    ? new Set(tribesAtStart.flatMap(t => t.members))
    : new Set(allPlayers.filter(n => !elimAtStart.has(n) && !riAtStart.has(n)));

  const countActive = activeAtStart.size;
  const phaseLabel  = ep.isMerge ? 'Merge Episode'
    : ep.isRIReentry ? 'RI Re-entry Episode'
    : (prevSnap.phase === 'post-merge' ? 'Post-Merge' : 'Pre-Merge');

  let html = `<div class="rp-page rp-cold-open tod-dawn">
    <div class="rp-co-eyebrow">${seasonConfig.name || 'Season'}</div>
    <div class="rp-co-epnum">Episode ${ep.num}</div>
    <div class="rp-co-phase">${phaseLabel} &mdash; ${countActive} of ${allPlayers.length} players remain</div>
    <div class="rp-co-divider"></div>`;

  // ── Active players grouped by tribe ──
  if (tribesAtStart) {
    tribesAtStart.forEach(tribe => {
      const tc = tribeColor(tribe.name);
      html += `<div class="rp-tribe">
        <div class="rp-tribe-head" style="color:${tc};border-color:${tc}">
          ${tribe.name}
          <span class="rp-tribe-count">${tribe.members.length} left</span>
        </div>
        <div class="rp-portrait-row">
          ${tribe.members.map(name => {
            const badge = name === exilePlayer ? 'Exile' : '';
            const cls   = name === exilePlayer ? 'sitd' : '';
            return rpPortrait(name, cls, badge);
          }).join('')}
        </div>
      </div>`;
    });
  } else {
    // Post-merge or no tribe data — one grid
    html += `<div class="rp-portrait-row" style="margin-bottom:32px">
      ${[...activeAtStart].map(name => rpPortrait(name)).join('')}
    </div>`;
  }

  // ── Eliminated players ──
  const elimList = allPlayers.filter(n => elimAtStart.has(n) || riAtStart.has(n));
  if (elimList.length) {
    html += `<div class="rp-co-divider"></div>
    <div class="rp-co-elim-head">Out of the game</div>
    <div class="rp-portrait-row">
      ${elimList.map(name => {
        const isRI  = riAtStart.has(name);
        const badge = isRI ? 'RI' : 'Out';
        return rpPortrait(name, 'elim', badge);
      }).join('')}
    </div>`;
  }

  // ── Tribe History: colored dots under player portraits showing tribe journey ──
  if (ep.num > 1) {
    const _thId = `tribe-history-${ep.num}`;
    // Build tribe journey per player from episode history
    // Check tribesAtStart first, fall back to gsSnapshot.tribes
    const _tribeJourneys = {};
    (gs.episodeHistory || []).filter(h => h.num <= ep.num).forEach(h => {
      const tribes = h.tribesAtStart?.length ? h.tribesAtStart
        : h.gsSnapshot?.tribes?.length ? h.gsSnapshot.tribes : null;
      if (!tribes) return;
      tribes.forEach(tribe => {
        if (!tribe?.name || !tribe?.members) return;
        tribe.members.forEach(name => {
          if (!_tribeJourneys[name]) _tribeJourneys[name] = [];
          const last = _tribeJourneys[name][_tribeJourneys[name].length - 1];
          if (!last || last.tribe !== tribe.name) {
            _tribeJourneys[name].push({ tribe: tribe.name, ep: h.num });
          }
        });
      });
    });
    // Only show if there's been at least one tribe change (swap/merge)
    const _hasSwap = Object.values(_tribeJourneys).some(j => j.length >= 2);
    if (_hasSwap) {
      html += `<div class="rp-co-divider"></div>
        <button class="rp-camp-toggle-btn" style="border-color:#484f58;color:#8b949e;font-size:10px;margin-bottom:8px" onclick="vpToggleSection('${_thId}')">
          TRIBE HISTORY <span class="rp-toggle-arrow">\u25bc</span>
        </button>
        <div id="${_thId}" style="display:none"><div style="display:flex;flex-wrap:wrap;gap:14px;justify-content:center;padding:8px 0">`;
      [...activeAtStart].forEach(name => {
        const journey = _tribeJourneys[name] || [];
        if (!journey.length) return;
        // Colored dots: one per tribe they've been on, in order
        const dots = journey.map(j => {
          const tc = tribeColor(j.tribe);
          return `<span title="${j.tribe} (ep ${j.ep})" style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${tc};flex-shrink:0"></span>`;
        }).join('');
        html += `<div style="text-align:center;width:52px">
          ${rpPortrait(name, 'sm')}
          <div style="display:flex;gap:3px;justify-content:center;margin-top:3px">${dots}</div>
        </div>`;
      });
      html += `</div></div>`;
    }
  }

  // ── "Coming in from last episode" narrative hook ──
  if (prevEp && ep.num > 1) {
    const _pSnap = prevEp.gsSnapshot || {};
    const _pAlliances = _pSnap.namedAlliances || [];
    const _recruits = prevEp.allianceRecruits || [];
    const _quits    = prevEp.allianceQuits    || [];

    const _topAlliance = [..._pAlliances].sort((a,b) => b.members.length - a.members.length)[0];
    // Use snapshot active players, not live gs — so viewing old episodes shows correct data
    const _activePlayers = _pSnap.activePlayers || [...activeAtStart];
    const _snapBonds = _pSnap.bonds || null;
    // Bond lookup: use snapshot bonds if available, fallback to live getBond
    const _getBondSnap = (a, b) => {
      if (_snapBonds) {
        const key1 = `${a}|${b}`, key2 = `${b}|${a}`;
        return _snapBonds[key1] ?? _snapBonds[key2] ?? 0;
      }
      return getBond(a, b);
    };
    const _avgBond = n => {
      const others = _activePlayers.filter(p => p !== n);
      if (!others.length) return 0;
      return others.reduce((s, p) => s + _getBondSnap(n, p), 0) / others.length;
    };
    const _bottomTwo = [..._activePlayers].sort((a,b) => _avgBond(a) - _avgBond(b)).slice(0, 2);

    html += `<div class="rp-co-divider"></div>
      <div class="vp-section-header">Previously on…</div>`;

    // ── [1] LAST TRIBAL RECAP — who went home, blindside, idol plays ──
    if (prevEp.eliminated) {
      const _elimName = prevEp.eliminated;
      const _pr = pronouns(_elimName);
      // Blindside detection: eliminated player voted for someone else (didn't see it coming)
      const _elimVote = (prevEp.votingLog || []).find(v => v.voter === _elimName);
      const _isBlindside = _elimVote && _elimVote.voted !== _elimName;
      // Idol plays
      const _idolPlays = (prevEp.idolPlays || []).filter(ip => ip.type === 'idol' || ip.type === 'superIdol' || ip.type === 'kip' || ip.type === 'legacy');
      const _comfortBlind = prevEp.comfortBlindspotPlayer === _elimName;
      let _elimDesc = `${_elimName} was voted out`;
      if (_comfortBlind) _elimDesc += ` — blindsided after checking out at camp`;
      else if (_isBlindside) _elimDesc += ` — didn't see it coming`;
      html += `<div class="vp-card" style="margin-bottom:10px;border-color:#6e7681">
        <div style="font-family:var(--font-body);font-size:11px;font-weight:800;letter-spacing:1px;color:#8b949e;margin-bottom:6px">LAST TRIBAL</div>
        <div style="font-size:12px">${_elimDesc}</div>
        ${_isBlindside ? '<span style="font-size:9px;font-weight:700;letter-spacing:1px;color:#da3633;margin-right:8px">BLINDSIDE</span>' : ''}
        ${_comfortBlind ? '<span style="font-size:9px;font-weight:700;letter-spacing:1px;color:#f0883e;margin-right:8px">COMFORT BLINDSPOT</span>' : ''}
        ${_idolPlays.map(ip => `<span style="font-size:9px;font-weight:700;letter-spacing:1px;color:#e3b341;margin-right:8px">${ip.player} PLAYED ${ip.type === 'superIdol' ? 'SUPER IDOL' : ip.type === 'kip' ? 'KIP' : ip.type === 'legacy' ? 'LEGACY' : 'IDOL'}${ip.playedFor && ip.playedFor !== ip.player ? ` FOR ${ip.playedFor}` : ''}${ip.misplay ? ' (MISPLAY)' : ''}</span>`).join('')}
      </div>`;
    }

    // ── [1b] TRIPLE DOG DARE RECAP — if prev episode was TDD ──
    if (prevEp.isTripleDogDare && prevEp.tripleDogDare) {
      const _tddData = prevEp.tripleDogDare;
      html += `<div class="vp-card fire" style="margin-bottom:10px">
        <div style="font-family:var(--font-body);font-size:11px;font-weight:800;letter-spacing:1px;color:var(--accent-fire);margin-bottom:6px">TRIPLE DOG DARE</div>
        <div style="font-size:12px;margin-bottom:4px">${_tddData.eliminated} couldn't take the dare — eliminated in round ${_tddData.eliminatedRound}</div>
        ${_tddData.mostDares ? `<div style="font-size:11px;color:var(--accent-gold);margin-bottom:4px">\u2b50 ${_tddData.mostDares} — Daredevil (${_tddData.completions?.[_tddData.mostDares] || 0} dares)</div>` : ''}
        ${_tddData.betrayals?.length ? `<div style="font-size:11px;color:#da3633">${_tddData.betrayals.length} betrayal${_tddData.betrayals.length > 1 ? 's' : ''} during the challenge</div>` : ''}
        ${_tddData.pacts?.length ? `<div style="font-size:11px;color:var(--muted)">${_tddData.pacts.length} temporary deal${_tddData.pacts.length > 1 ? 's' : ''} formed</div>` : ''}
      </div>`;
    }

    // ── [1c] SAY UNCLE RECAP ──
    if (prevEp.isSayUncle && prevEp.sayUncle) {
      const _suData = prevEp.sayUncle;
      const _suPhaseCount = _suData.phases?.length || '?';
      html += `<div style="background:rgba(232,160,53,0.06);border:1px solid rgba(232,160,53,0.15);border-radius:8px;padding:10px 14px;margin-bottom:10px">
        <div style="font-family:var(--font-body);font-size:11px;font-weight:800;letter-spacing:1px;color:#e8a035;margin-bottom:6px">THE DUNGEON OF MISFORTUNE</div>
        <div style="font-size:12px;color:#cdd6f4;margin-bottom:4px">${_suData.immunityWinner} survived ${_suPhaseCount} phases and ${_suData.rounds.length} rounds \u2014 last one standing</div>
        ${_suData.backfires?.length ? `<div style="font-size:11px;color:#da3633">${_suData.backfires.length} backfire${_suData.backfires.length > 1 ? 's' : ''} \u2014 picks that sent their owners to the pillory</div>` : ''}
        ${_suData.pillory?.length ? `<div style="font-size:11px;color:#8b6914">${_suData.pillory.length} player${_suData.pillory.length > 1 ? 's' : ''} in the pillory</div>` : ''}
      </div>`;
    }
    if (prevEp.isBrunchOfDisgustingness && prevEp.brunch) {
      const _brData = prevEp.brunch;
      const _brVomits = (_brData.courses || []).filter(c => c.chainVomit?.trigger).length;
      html += `<div style="background:rgba(74,222,128,0.06);border:1px solid rgba(74,222,128,0.15);border-radius:8px;padding:10px 14px;margin-bottom:10px">
        <div style="font-family:var(--font-body);font-size:11px;font-weight:800;letter-spacing:1px;color:#4ade80;margin-bottom:6px">BRUNCH OF DISGUSTINGNESS</div>
        <div style="font-size:12px;color:#d4d4c8;margin-bottom:4px">${(_brData.winningTeam || 'boys') === 'boys' ? 'Boys' : 'Girls'} won ${_brData.score.boys}-${_brData.score.girls}${_brData.mvpEater ? ` \u2014 ${_brData.mvpEater} was MVP` : ''}</div>
        ${_brData.eatOff ? `<div style="font-size:11px;color:#facc15">Eat-off tiebreaker: ${_brData.eatOff.contestants?.[_brData.eatOff.winner] || _brData.eatOff.winner} won the cockroach smoothie shots</div>` : ''}
        ${_brVomits ? `<div style="font-size:11px;color:#84cc16">${_brVomits} chain vomit${_brVomits > 1 ? 's' : ''}</div>` : ''}
      </div>`;
    }

    // ── [1d] PHOBIA FACTOR RECAP ──
    if (prevEp.isCliffDive && prevEp.cliffDive) {
      const _cd = prevEp.cliffDive;
      const _cdChickens = _cd.tribes.flatMap(t => t.chickens);
      if (_cdChickens.length) {
        html += `<div class="vp-card" style="border-color:rgba(244,112,103,0.15);margin-bottom:8px">
          <div style="font-size:9px;font-weight:700;letter-spacing:1px;color:#f47067;margin-bottom:4px">CLIFF DIVE</div>
          <div style="font-size:12px;color:#8b949e">${_cdChickens.length} player${_cdChickens.length>1?'s':''} chickened out: ${_cdChickens.join(', ')}. ${_cd.winner} won immunity.</div>
        </div>`;
      }
    }
    if (prevEp.isAwakeAThon && prevEp.awakeAThon) {
      const _aat = prevEp.awakeAThon;
      html += `<div class="vp-card" style="border-color:rgba(139,92,246,0.15);margin-bottom:8px">
        <div style="font-size:9px;font-weight:700;letter-spacing:1px;color:#8b5cf6;margin-bottom:4px">AWAKE-A-THON</div>
        <div style="font-size:12px;color:#8b949e">${_aat.lastAwake ? `${_aat.lastAwake} was the last one standing.` : ''} ${_aat.winner} won immunity.${_aat.firstOut ? ` ${_aat.firstOut.name} was first to fall asleep.` : ''}</div>
      </div>`;
    }
    if (prevEp.isDodgebrawl && prevEp.dodgebrawl) {
      const _db = prevEp.dodgebrawl;
      const _dbScore = Object.entries(_db.finalScore).map(([t, w]) => `${t} ${w}`).join('–');
      html += `<div class="vp-card" style="border-color:rgba(224,96,48,0.15);margin-bottom:8px">
        <div style="font-size:9px;font-weight:700;letter-spacing:1px;color:#e06030;margin-bottom:4px">DODGEBRAWL</div>
        <div style="font-size:12px;color:#8b949e">${_db.winner} won immunity (${_dbScore}).${_db.mvp ? ` MVP: ${_db.mvp}.` : ''}${_db.refusers?.length ? ` ${_db.refusers[0].name} refused to play.` : ''}</div>
      </div>`;
    }
    if (prevEp.isTalentShow && prevEp.talentShow) {
      const _ts = prevEp.talentShow;
      const _tsScore = Object.entries(_ts.tribeScores).map(([t, s]) => `${t} ${s}`).join('–');
      html += `<div class="vp-card" style="border-color:rgba(139,92,246,0.15);margin-bottom:8px">
        <div style="font-size:9px;font-weight:700;letter-spacing:1px;color:#8b5cf6;margin-bottom:4px">TALENT SHOW</div>
        <div style="font-size:12px;color:#8b949e">${_ts.winner} won (${_tsScore}).${_ts.mvp ? ` MVP: ${_ts.mvp}.` : ''}${_ts.sabotage ? ` ${_ts.sabotage.saboteur} sabotaged ${_ts.sabotage.target}.` : ''}</div>
      </div>`;
    }
    if (prevEp.isSuckyOutdoors && prevEp.suckyOutdoors) {
      const _so = prevEp.suckyOutdoors;
      html += `<div class="vp-card" style="border-color:rgba(63,185,80,0.15);margin-bottom:8px">
        <div style="font-size:9px;font-weight:700;letter-spacing:1px;color:#3fb950;margin-bottom:4px">THE SUCKY OUTDOORS</div>
        <div style="font-size:12px;color:#8b949e">${_so.winner} survived the night and returned first.${_so.lostPlayers?.length ? ` ${_so.lostPlayers.map(lp => lp.name).join(' & ')} got lost.` : ''}</div>
      </div>`;
    }
    if (prevEp.isUpTheCreek && prevEp.upTheCreek) {
      const _utc = prevEp.upTheCreek;
      html += `<div class="vp-card" style="border-color:rgba(88,166,255,0.15);margin-bottom:8px">
        <div style="font-size:9px;font-weight:700;letter-spacing:1px;color:#58a6ff;margin-bottom:4px">UP THE CREEK</div>
        <div style="font-size:12px;color:#8b949e">${_utc.winner} won the canoe race.${_utc.swimmerHero ? ` ${_utc.swimmerHero} swam the tribe home.` : ''}${Object.values(_utc.paddlesBurned || {}).some(v => v) ? ' Someone burned the paddles.' : ''}</div>
      </div>`;
    }
    if (prevEp.isPaintballHunt && prevEp.paintballHunt) {
      const _pb = prevEp.paintballHunt;
      html += `<div class="vp-card" style="border-color:rgba(63,185,80,0.15);margin-bottom:8px">
        <div style="font-size:9px;font-weight:700;letter-spacing:1px;color:#3fb950;margin-bottom:4px">PAINTBALL DEER HUNTER</div>
        <div style="font-size:12px;color:#8b949e">${_pb.winner} won the hunt.${_pb.mvp ? ` MVP: ${_pb.mvp}.` : ''}${_pb.bearMauled?.length ? ` ${_pb.bearMauled[0]} was mauled by a bear.` : ''}${_pb.paintballWar?.length ? ' A paintball war broke out.' : ''}</div>
      </div>`;
    }
    if (prevEp.isHellsKitchen && prevEp.hellsKitchen) {
      const _hk = prevEp.hellsKitchen;
      const _hkTotal = tribe => ['appetizer','main','dessert'].reduce((s,c) => s + (_hk.courseScores?.[tribe]?.[c]?.rating || 0), 0);
      html += `<div class="vp-card" style="border-color:rgba(249,115,22,0.15);margin-bottom:8px">
        <div style="font-size:9px;font-weight:700;letter-spacing:1px;color:#f97316;margin-bottom:4px">HELL'S KITCHEN</div>
        <div style="font-size:12px;color:#8b949e">${_hk.winner} won ${_hkTotal(_hk.winner)}-${_hkTotal(_hk.loser)}.${_hk.mvp ? ` MVP: ${_hk.mvp}.` : ''}${_hk.fridgeLock ? ` ${_hk.fridgeLock.victim} was locked in the fridge!` : ''}</div>
      </div>`;
    }
    if (prevEp.isTrustChallenge && prevEp.trustChallenge) {
      const _tc = prevEp.trustChallenge;
      const _sabCount = _tc.sabotage?.length || 0;
      html += `<div class="vp-card" style="border-color:rgba(56,189,248,0.15);margin-bottom:8px">
        <div style="font-size:9px;font-weight:700;letter-spacing:1px;color:#38bdf8;margin-bottom:4px">WHO CAN YOU TRUST?</div>
        <div style="font-size:12px;color:#8b949e">${_tc.winner} won immunity (${['round1','round2','round3'].filter(r => _tc.rounds?.[r]?.winner === _tc.winner).length}/3 rounds).${_tc.mvp ? ` MVP: ${_tc.mvp}.` : ''}${_sabCount ? ` ${_sabCount} sabotage${_sabCount > 1 ? 's' : ''} this episode.` : ''}${_tc.redemption ? ` Hidden moment: ${_tc.redemption.player}.` : ''}</div>
      </div>`;
    }
    if (prevEp.isPhobiaFactor && prevEp.phobiaFactor) {
      const _pfData = prevEp.phobiaFactor;
      const _pfWinPct = Math.round((_pfData.tribeScores[_pfData.winningTribe]?.percentage || 0) * 100);
      html += `<div class="vp-card gold" style="margin-bottom:10px">
        <div style="font-family:var(--font-body);font-size:11px;font-weight:800;letter-spacing:1px;color:var(--accent-gold);margin-bottom:6px">PHOBIA FACTOR</div>
        <div style="font-size:12px;margin-bottom:4px">${_pfData.winningTribe} won immunity (${_pfWinPct}% conquered their fears)</div>
        ${_pfData.clutch ? `<div style="font-size:11px;color:${_pfData.clutch.result === 'pass' ? 'var(--accent-gold)' : '#da3633'}">${_pfData.clutch.player} ${_pfData.clutch.result === 'pass' ? 'hit the clutch triple points!' : 'choked on triple points'}</div>` : ''}
      </div>`;
    }
    if (prevEp.isWawanakwaGoneWild && prevEp.wawanakwaGoneWild) {
      const _ww = prevEp.wawanakwaGoneWild;
      const captureCount = Object.values(_ww.huntResults || {}).filter(r => r.captured).length;
      const hasTranq = _ww.timeline?.some(e => e.type === 'tranqChaos');
      html += `<div class="vp-card" style="border-color:rgba(212,160,23,0.15);margin-bottom:8px">
        <div style="font-size:9px;font-weight:700;letter-spacing:1px;color:#d4a017;margin-bottom:4px">WAWANAKWA GONE WILD!</div>
        <div style="font-size:12px;color:#8b949e">${_ww.immunityWinner} won immunity + a feast. ${captureCount} animals captured.${_ww.punishmentTarget ? ` ${_ww.punishmentTarget} is on bathroom duty.` : ''}${hasTranq ? ' Someone used the tranq gun.' : ''}</div>
      </div>`;
    }

    if (prevEp.emissaryPick) {
      html += `<div class="vp-card" style="border-color:rgba(240,165,0,0.15);margin-bottom:8px">
        <div style="font-size:9px;font-weight:700;letter-spacing:1px;color:#f0a500;margin-bottom:4px">EMISSARY VOTE</div>
        <div style="font-size:12px;color:#8b949e">${prevEp.emissary?.name} eliminated ${prevEp.emissaryPick.name} — ${prevEp.emissaryPick.reason}</div>
      </div>`;
    }

    // ── TRIBE DISSOLUTION announcement ──
    if (prevEp.tribeDissolutions?.length) {
      prevEp.tribeDissolutions.forEach(td => {
        const destinations = td.members.map(m => `${m.player} → ${m.toTribe}`).join(', ');
        html += `<div class="vp-card" style="border-color:rgba(248,81,73,0.3);margin-bottom:8px;background:rgba(248,81,73,0.05)">
          <div style="font-size:9px;font-weight:700;letter-spacing:1px;color:#f85149;margin-bottom:4px">💥 TRIBE DISSOLVED</div>
          <div style="font-size:13px;color:#e6edf3;font-weight:600;margin-bottom:4px">${td.tribe} is no more.</div>
          <div style="font-size:11px;color:#8b949e">${destinations}</div>
        </div>`;
      });
    }

    // ── [2] CLOSE VOTE — survived by 1 vote ──
    if (prevEp.votes && prevEp.eliminated) {
      const _sortedVotes = Object.entries(prevEp.votes).sort(([,a],[,b]) => b - a);
      if (_sortedVotes.length >= 2 && _sortedVotes[0][1] - _sortedVotes[1][1] <= 1) {
        const _survivor = _sortedVotes[1][0];
        if (_activePlayers.includes(_survivor)) {
          html += `<div class="vp-card fire" style="margin-bottom:10px">
            <div style="font-family:var(--font-body);font-size:11px;font-weight:800;letter-spacing:1px;color:var(--accent-fire);margin-bottom:6px">CLOSE CALL</div>
            <div style="font-size:12px">${_survivor} survived by ${_sortedVotes[0][1] - _sortedVotes[1][1] === 0 ? 'a tiebreaker' : '1 vote'}</div>
          </div>`;
        }
      }
    }

    // ── [3] ALLIANCE BETRAYALS — from last episode ──
    const _prevAlliances = _pSnap.namedAlliances || [];
    const _recentBetrayals = [];
    _prevAlliances.forEach(a => {
      (a.betrayals || []).forEach(b => {
        if (b.ep === prevEp.num) _recentBetrayals.push({ ...b, alliance: a.name });
      });
    });
    // Also check dissolved alliances
    const _prevDissolved = _pSnap.dissolvedAlliances || [];
    _prevDissolved.forEach(a => {
      (a.betrayals || []).forEach(b => {
        if (b.ep === prevEp.num) _recentBetrayals.push({ ...b, alliance: a.name });
      });
    });
    if (_recentBetrayals.length) {
      html += `<div class="vp-card fire" style="margin-bottom:10px">
        <div style="font-family:var(--font-body);font-size:11px;font-weight:800;letter-spacing:1px;color:var(--accent-fire);margin-bottom:6px">BETRAYAL</div>
        ${_recentBetrayals.map(b => `<div style="font-size:12px;margin-bottom:2px">${b.player} turned on <span style="font-weight:600">${b.alliance}</span> — voted ${b.votedFor} instead of ${b.consensusWas}</div>`).join('')}
      </div>`;
    }

    // ── [4] SHOWMANCE / ROMANCE ──
    const _prevShowmances = _pSnap.showmances || [];
    const _activeShowmances = _prevShowmances.filter(sh => !sh.breakupEp && sh.phase !== 'broken-up' && sh.phase !== 'faded');
    const _breakups = _prevShowmances.filter(sh => sh.breakupEp === prevEp.num);
    const _prevTriangles = (_pSnap.loveTriangles || []).filter(t => !t.resolved);
    const _prevAffairs = (_pSnap.affairs || []).filter(af => !af.resolved);
    const _hasRomance = _activeShowmances.length || _breakups.length || _prevTriangles.length || _prevAffairs.length;
    if (_hasRomance) {
      html += `<div class="vp-card" style="margin-bottom:10px;border-color:#db61a2">
        <div style="font-family:var(--font-body);font-size:11px;font-weight:800;letter-spacing:1px;color:#db61a2;margin-bottom:6px">ROMANCE</div>`;
      _activeShowmances.forEach(sh => {
        const _phaseLabel = { spark:'Just sparked', honeymoon:'Honeymoon phase', target:'Being targeted', 'ride-or-die':'Ride or die' }[sh.phase] || sh.phase;
        html += `<div style="font-size:12px;margin-bottom:4px">💕 ${sh.players[0]} & ${sh.players[1]} — <span style="color:#db61a2">${_phaseLabel}</span></div>`;
      });
      _breakups.forEach(sh => {
        html += `<div style="font-size:12px;margin-bottom:4px">💔 ${sh.players[0]} & ${sh.players[1]} — <span style="color:#da3633">Broken up</span>${sh.breakupType ? ` (${sh.breakupType})` : ''}</div>`;
      });
      _prevTriangles.forEach(t => {
        const _tPhase = { tension:'Tension building', escalation:'Escalating', ultimatum:'Ultimatum looming' }[t.phase] || t.phase;
        html += `<div style="font-size:12px;margin-bottom:4px">🔺 ${t.center} caught between ${t.suitors[0]} & ${t.suitors[1]} — <span style="color:#f0883e">${_tPhase}</span></div>`;
      });
      _prevAffairs.forEach(af => {
        const _expLabel = { hidden:'Hidden', rumors:'Rumors spreading', caught:'Caught', exposed:'Fully exposed' }[af.exposure] || af.exposure;
        const _expColor = { hidden:'#8b949e', rumors:'#f0883e', caught:'#da3633', exposed:'#da3633' }[af.exposure] || '#8b949e';
        html += `<div style="font-size:12px;margin-bottom:4px">🤫 ${af.cheater} has a secret affair with ${af.secretPartner} — <span style="color:${_expColor}">${_expLabel}</span></div>`;
      });
      html += `</div>`;
    }

    // ── [5] MOLE ACTIVITY ──
    const _prevMoles = _pSnap.moles || [];
    const _activeSet2 = new Set(_activePlayers);
    const _activeMoles = _prevMoles.filter(m => !m.exposed && _activeSet2.has(m.player));
    const _exposedMoles = _prevMoles.filter(m => m.exposed && m.exposedEp === prevEp.num);
    if (_activeMoles.length || _exposedMoles.length) {
      html += `<div class="vp-card" style="margin-bottom:10px;border-color:#da3633">
        <div style="font-family:var(--font-body);font-size:11px;font-weight:800;letter-spacing:1px;color:#da3633;margin-bottom:6px">THE MOLE</div>`;
      _exposedMoles.forEach(m => {
        html += `<div style="font-size:12px;margin-bottom:4px;color:#da3633;font-weight:600">🚨 ${m.player} was EXPOSED as the Mole by ${m.exposedBy} — ${m.sabotageCount} acts of sabotage</div>`;
      });
      _activeMoles.forEach(m => {
        // Show highest suspicion without revealing who the mole is
        const _suspEntries = Object.entries(m.suspicion || {});
        const _topSusp = _suspEntries.sort(([,a],[,b]) => b - a)[0];
        const _suspLevel = _topSusp ? _topSusp[1] : 0;
        if (m.sabotageCount > 0) {
          html += `<div style="font-size:12px;margin-bottom:4px">Someone is sabotaging the game — ${m.sabotageCount} incident${m.sabotageCount > 1 ? 's' : ''} so far</div>`;
        }
        if (_suspLevel >= 2.0 && _topSusp) {
          html += `<div style="font-size:12px;margin-bottom:4px;color:#f0883e">${_topSusp[0]} is growing suspicious…</div>`;
        }
      });
      html += `</div>`;
    }

    // ── [6] SIDE DEALS — active F2/F3 pacts ──
    const _prevDeals = (_pSnap.sideDeals || []).filter(d => d.active);
    const _brokenDeals = (_pSnap.sideDeals || []).filter(d => !d.active && d.brokenEp === prevEp.num);
    if (_prevDeals.length || _brokenDeals.length) {
      html += `<div class="vp-card" style="margin-bottom:10px;border-color:#484f58">
        <div style="font-family:var(--font-body);font-size:11px;font-weight:800;letter-spacing:1px;color:#8b949e;margin-bottom:6px">DEALS IN PLAY</div>`;
      _prevDeals.forEach(d => {
        const _dtype = d.type === 'F2' ? 'F2' : 'F3';
        const _genuine = d.genuine === false ? ' <span style="color:#f0883e;font-size:9px;font-weight:700">(FAKE)</span>' : '';
        html += `<div style="font-size:12px;margin-bottom:4px">${_dtype} deal: ${d.players.join(' & ')}${_genuine}</div>`;
      });
      _brokenDeals.forEach(d => {
        html += `<div style="font-size:12px;margin-bottom:4px;color:#da3633">💥 ${d.type} deal broken: ${d.players.join(' & ')}</div>`;
      });
      html += `</div>`;
    }

    // ── [7] FIGHTS / MELTDOWNS / PARANOIA ──
    const _prevSpirals = prevEp.paranoiaSpirals || [];
    const _prevStolen = prevEp.stolenCreditEvents || [];
    if (_prevSpirals.length || _prevStolen.length) {
      html += `<div class="vp-card" style="margin-bottom:10px;border-color:#da3633">
        <div style="font-family:var(--font-body);font-size:11px;font-weight:800;letter-spacing:1px;color:#da3633;margin-bottom:6px">CAMP DRAMA</div>`;
      _prevSpirals.forEach(sp => {
        const _spName = sp.player || sp.name;
        if (_spName) html += `<div style="font-size:12px;margin-bottom:4px">😤 ${_spName} had a paranoia spiral — trust is fractured</div>`;
      });
      _prevStolen.forEach(sc => {
        if (sc.thief && sc.victim) html += `<div style="font-size:12px;margin-bottom:4px">⚡ ${sc.thief} stole credit from ${sc.victim} — confrontation at camp</div>`;
      });
      html += `</div>`;
    }

    // ── [8] CHALLENGE THROWS ──
    const _prevThrows = prevEp.challengeThrows || [];
    if (_prevThrows.length) {
      html += `<div class="vp-card" style="margin-bottom:10px;border-color:#484f58">
        <div style="font-family:var(--font-body);font-size:11px;font-weight:800;letter-spacing:1px;color:#8b949e;margin-bottom:6px">CHALLENGE THROW</div>`;
      _prevThrows.forEach(ct => {
        if (ct.caught) {
          html += `<div style="font-size:12px;margin-bottom:4px;color:#da3633">🎭 ${ct.thrower} threw the challenge — <span style="font-weight:600">CAUGHT</span> by ${(ct.detectedBy || []).join(', ')}</div>`;
        } else {
          html += `<div style="font-size:12px;margin-bottom:4px">🎭 ${ct.thrower} threw the challenge — nobody noticed</div>`;
        }
      });
      html += `</div>`;
    }

    // ── EXISTING: Top alliance + bottom two + recruits/quits ──
    if (_topAlliance) {
      const _activeSet = new Set(_activePlayers);
      const _members = _topAlliance.members.filter(n => _activeSet.has(n));
      if (_members.length) {
        html += `<div class="vp-card" style="margin-bottom:10px">
          <div style="font-family:var(--font-display);font-size:13px;letter-spacing:1px;margin-bottom:6px">${_topAlliance.name}</div>
          <div style="font-size:12px;color:var(--muted)">${_members.join(', ')} — ${_members.length} strong going in</div>
        </div>`;
      }
    }

    if (_bottomTwo.length) {
      html += `<div class="vp-card fire" style="margin-bottom:10px">
        <div style="font-family:var(--font-body);font-size:11px;font-weight:800;letter-spacing:1px;color:var(--accent-fire);margin-bottom:6px">On the bottom</div>
        <div style="font-size:12px">${_bottomTwo.join(' and ')}</div>
      </div>`;
    }

    _recruits.forEach(r => {
      html += `<div style="font-size:12px;color:var(--muted);margin-bottom:4px">
        ${r.player} joined ${r.toAlliance} last episode${r.fromAlliance ? ` (left ${r.fromAlliance})` : ''}.
      </div>`;
    });
    _quits.forEach(q => {
      html += `<div style="font-size:12px;color:var(--muted);margin-bottom:4px">
        ${q.player} left ${q.alliance} last episode.
      </div>`;
    });
  }

  // ── Fan Pulse — scores BEFORE this episode (use previous ep snapshot) ──
  if (seasonConfig.popularityEnabled !== false && !seasonConfig.hidePopularity) {
    const _popSnap = prevEp?.popularitySnapshot || {};
    // For finale: use finaleFinalists (activeAtStart may miss players due to tribesAtStart being unset)
    const _popPool = ep.isFinale && ep.finaleFinalists?.length ? new Set(ep.finaleFinalists) : activeAtStart;
    const _allRanked = [..._popPool].sort((a, b) => (_popSnap[b] || 0) - (_popSnap[a] || 0));
    const _n = _allRanked.length;
    const _icSz = _n >= 16 ? 20 : _n >= 12 ? 24 : _n >= 8 ? 30 : _n >= 5 ? 36 : 44;
    const _icFs = Math.round(_icSz * 0.4);
    const _pulBadge = s => s >= 12 ? ['LOVED','#e3b341'] : s >= 7 ? ['FAN FAV','#3fb950'] : s >= 3 ? ['RISING','#58a6ff'] : s === 0 ? ['INVISIBLE','#484f58'] : s <= -10 ? ['HATED','#da3633'] : s <= -5 ? ['UNPOPULAR','#f0883e'] : s < 0 ? ['FADING','#8b949e'] : null;
    html += `<div class="rp-co-divider"></div>
      <div class="vp-section-header gold" style="margin-bottom:8px">Fan Pulse</div>
      <div style="display:flex;flex-direction:column;gap:2px">
        ${_allRanked.map((name, i) => {
          const score = _popSnap[name] || 0;
          const scoreColor = score >= 10 ? '#e3b341' : score > 0 ? '#c09030' : score < 0 ? '#e05c5c' : 'var(--vp-text-dim)';
          const _badge = _pulBadge(score);
          const _p = players.find(x => x.name === name);
          const _slug = _p?.slug || name.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'');
          const _init = (name||'?')[0].toUpperCase();
          return `<div style="display:flex;align-items:center;gap:6px;padding:1px 0">
            <span style="font-size:9px;font-weight:700;color:var(--vp-text-dim);font-family:var(--font-mono);width:14px;text-align:right;flex-shrink:0">${i+1}</span>
            <div style="width:${_icSz}px;height:${_icSz}px;border-radius:3px;overflow:hidden;flex-shrink:0;background:#21262d;display:flex;align-items:center;justify-content:center;font-size:${_icFs}px;font-weight:700;color:#6e7681">
              <img src="assets/avatars/${_slug}.png" style="width:100%;height:100%;object-fit:cover" onerror="this.style.display='none';this.nextElementSibling.style.display='block'">
              <span style="display:none">${_init}</span>
            </div>
            <span style="font-size:${Math.max(10, Math.round(_icSz * 0.45))}px;color:var(--vp-text);flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${name}</span>
            ${_badge ? `<span style="font-size:8px;font-weight:700;letter-spacing:0.5px;color:${_badge[1]};flex-shrink:0;opacity:0.9">${_badge[0]}</span>` : ''}
            <span style="font-size:${Math.max(10, Math.round(_icSz * 0.45))}px;font-weight:700;color:${scoreColor};font-family:var(--font-mono);flex-shrink:0">${score}</span>
          </div>`;
        }).join('')}
      </div>`;
  }

  html += `</div>`;
  return html;
}

// ── Screen 2: Tribe Status ──
export function rpBuildTribes(ep) {
  const snap = ep.gsSnapshot || {};
  const prevEp   = (gs.episodeHistory || []).filter(h => h.num < ep.num).slice(-1)[0];
  const prevSnap = prevEp?.gsSnapshot || {};

  // Resolve tribe groupings without spoiling this episode's elimination:
  // Priority: saved tribesAtStart → prevSnap.tribes → derive from players[].tribe → merged fallback
  const isMerged = ep.isMerge || prevSnap.phase === 'post-merge' || snap.phase === 'post-merge';

  function deriveTribeGroups() {
    // ep.tribesAtStart saved in history (ep 2+ from main push)
    if (ep.tribesAtStart?.length) return ep.tribesAtStart;
    // Previous episode end-state = this episode start-state (ep 2+)
    if (!isMerged && prevSnap.tribes?.length) return prevSnap.tribes;
    // Episode 1: no prevSnap — derive from players[].tribe assignment
    if (!isMerged) {
      const map = {};
      players.forEach(p => {
        if (p.tribe) { if (!map[p.tribe]) map[p.tribe] = []; map[p.tribe].push(p.name); }
      });
      const derived = Object.entries(map).map(([name, members]) => ({ name, members }));
      if (derived.length) return derived;
    }
    // Post-merge / no tribe data
    return [{ name: snap.mergeName || gs.mergeName || 'Merged', members: snap.activePlayers || gs.activePlayers }];
  }

  const tribeGroups = deriveTribeGroups();

  // Toggle: tribe history strips (colored vertical bars showing past tribes)
  const _swapTypes = ['tribe-swap','tribe-expansion','abduction','kidnapping','mutiny','tribe-dissolve'];
  const _hadSwap = (gs.episodeHistory || []).some(h =>
    (h.twist?.type && _swapTypes.includes(h.twist.type)) ||
    (h.twists || []).some(t => _swapTypes.includes(t.type))
  );
  const _showHistory = _hadSwap && localStorage.getItem('vp_showTribeHistory') !== 'false';

  // Build tribe stint history per player (deduplicated consecutive tribe changes)
  // Returns [{name, color}] oldest→newest, only when player changed tribes at least once
  function playerTribeStints(name) {
    const stints = [];
    const sorted = (gs.episodeHistory || [])
      .filter(e => e.num <= ep.num && e.tribesAtStart?.length)
      .sort((a,b) => a.num - b.num);
    for (const rec of sorted) {
      const t = rec.tribesAtStart.find(t => t.members?.includes(name));
      if (!t) continue;
      const last = stints[stints.length - 1];
      if (!last || last.name !== t.name) stints.push({ name: t.name, color: tribeColor(t.name) });
    }
    return stints.length > 1 ? stints : []; // only return if they actually changed tribes
  }

  // Advantages at the start of this episode (from prevSnap, same logic as Cold Open)
  const advList = prevSnap.advantages || snap.advantages || gs.advantages || [];
  const activeAlliances = prevSnap.namedAlliances || snap.namedAlliances || [];

  const countActive = tribeGroups.reduce((s, t) => s + t.members.length, 0);

  // Build a quick lookup: playerName → tribeName
  const playerTribeMap = {};
  tribeGroups.forEach(t => t.members.forEach(m => { playerTribeMap[m] = t.name; }));

  let html = `<div class="rp-page tod-morning">
    <div class="rp-eyebrow">Episode ${ep.num}</div>
    <div class="rp-title">Tribe Status</div>
    <div class="rp-subtitle">${countActive} players remain.</div>
    ${_hadSwap ? `<div style="text-align:right;margin-bottom:12px">
      <button onclick="(function(){const n=localStorage.getItem('vp_showTribeHistory')!=='false';localStorage.setItem('vp_showTribeHistory',n?'false':'true');const ep=gs.episodeHistory.find(e=>e.num===vpEpNum);if(ep){buildVPScreens(ep);renderVPScreen();}})()"
        style="font-size:10px;padding:4px 10px;border:1px solid var(--border);border-radius:4px;background:transparent;color:var(--muted);cursor:pointer">
        Tribe History: ${_showHistory ? 'ON' : 'OFF'}
      </button>
    </div>` : ''}`;

  tribeGroups.forEach(tribe => {
    const tc = tribeColor(tribe.name);
    const tribeSet = new Set(tribe.members);

    // Alliances with at least 1 member in this tribe
    const tribeAlliances = activeAlliances.filter(a =>
      a.members.some(m => tribeSet.has(m))
    );

    html += `<div class="rp-tribe">
      <div class="rp-tribe-head" style="color:${tc};border-color:${tc}">
        ${tribe.name}
        <span class="rp-tribe-count">${tribe.members.length} players</span>
      </div>
      <div class="rp-portrait-row">
        ${tribe.members.map(name => {
          if (name === ep.immunityWinner && isMerged) {
            const stints = _showHistory ? playerTribeStints(name) : [];
            const strips = stints.length ? `<div style="display:flex;flex-direction:column;gap:3px;padding-top:6px;align-self:flex-start">${stints.map(s=>`<div style="width:5px;height:16px;border-radius:2px;background:${s.color}" title="${s.name}"></div>`).join('')}</div>` : '';
            return strips ? `<div style="display:flex;align-items:flex-start;gap:3px">${strips}${rpPortrait(name,'immune','Immune')}</div>` : rpPortrait(name,'immune','Immune');
          }
          const adv = advList.filter(a => a.holder === name);
          const badges = adv.map(a => {
            if (a.type === 'idol' && a.superIdol) return 'Super Idol';
            if (a.type === 'idol') return 'Idol';
            if (a.type === 'beware')      return 'Beware';
            if (a.type === 'extra-vote')  return 'Extra Vote';
            if (a.type === 'vote-steal')  return 'Vote Steal';
            if (a.type === 'legacy')      return 'Legacy';
            if (a.type === 'amulet')      return 'Amulet';
            return null;
          }).filter(Boolean);
          const badge = badges[0] || '';
          const cls   = badge === 'Idol' || badge === 'Beware' ? 'sitd' : '';
          const stints = _showHistory ? playerTribeStints(name) : [];
          if (!stints.length) return rpPortrait(name, cls, badge);
          const strips = `<div style="display:flex;flex-direction:column;gap:3px;padding-top:6px;align-self:flex-start">${stints.map(s=>`<div style="width:5px;height:16px;border-radius:2px;background:${s.color}" title="${s.name}"></div>`).join('')}</div>`;
          return `<div style="display:flex;align-items:flex-start;gap:3px">${strips}${rpPortrait(name, cls, badge)}</div>`;
        }).join('')}
      </div>`;

    if (tribeAlliances.length) {
      html += `<div style="margin-top:14px;border-top:1px solid #21262d;padding-top:12px">
        <div style="font-size:9px;font-weight:800;letter-spacing:2px;color:#484f58;margin-bottom:10px">ACTIVE ALLIANCES</div>`;

      tribeAlliances.forEach(alliance => {
        const crossTribe = alliance.members.some(m => !tribeSet.has(m));
        html += `<div style="margin-bottom:12px">
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px">
            <span style="font-size:11px;font-weight:700;color:#e6edf3">${alliance.name}</span>
            ${crossTribe ? `<span style="font-size:8px;font-weight:800;letter-spacing:1px;background:rgba(139,92,246,0.12);color:#a78bfa;padding:2px 6px;border-radius:3px">SPLIT</span>` : ''}
          </div>
          <div style="display:flex;gap:8px;flex-wrap:wrap">`;

        alliance.members.forEach(name => {
          const inTribe = tribeSet.has(name);
          const otherTribe = inTribe ? '' : (playerTribeMap[name] || '');
          const slug = (players.find(p=>p.name===name)?.slug) || name.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'');
          const init = (name||'?')[0].toUpperCase();
          html += `<div style="display:flex;flex-direction:column;align-items:center;gap:3px;${inTribe ? '' : 'opacity:0.35;filter:grayscale(1)'}">
            <div style="width:36px;height:36px;border-radius:5px;overflow:hidden;background:#161b22;border:1px solid ${inTribe ? tc : '#30363d'};flex-shrink:0">
              <img src="assets/avatars/${slug}.png" style="width:100%;height:100%;object-fit:cover"
                   onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" />
              <span style="display:none;width:100%;height:100%;align-items:center;justify-content:center;font-size:13px;font-weight:700;color:#8b949e">${init}</span>
            </div>
            <span style="font-size:9px;color:${inTribe ? '#8b949e' : '#484f58'};white-space:nowrap;max-width:44px;overflow:hidden;text-overflow:ellipsis">${name}</span>
            ${otherTribe ? `<span style="font-size:8px;color:#484f58">${otherTribe}</span>` : ''}
          </div>`;
        });

        html += `</div></div>`;
      });

      html += `</div>`;
    }

    html += `</div>`;
  });

  html += `</div>`;
  return html;
}

// ── Twist helpers ──
export function getTwistPlayers(tw) {
  const names = [];
  switch (tw.type) {
    case 'exile-island':      if (tw.exiled) names.push(tw.exiled); break;
    case 'mutiny':            (tw.mutineers||[]).forEach(m => names.push(m.name||m)); break;
    case 'hero-duel':         (tw.duelParticipants||[]).forEach(n => names.push(n)); break;
    case 'guardian-angel':    if (tw.guardianAngel) names.push(tw.guardianAngel); break;
    case 'kidnapping':          if (tw.kidnapped) names.push(tw.kidnapped); break;
    case 'penalty-vote':
    case 'fan-vote-boot':     if (tw.fanVoteSaved) names.push(tw.fanVoteSaved); break;
    case 'legacy-awakens':    if (tw.legacyActivated) names.push(tw.legacyActivated); break;
    case 'amulet-activate':   if (tw.amuletActivated) names.push(tw.amuletActivated); break;
    case 'idol-wager':        names.push(tw.idolWagerWinner || tw.idolWagerLoser); break;
    case 'spirit-island':     if (tw.spiritVisitor) names.push(tw.spiritVisitor); break;
    case 'second-chance':     if (tw.returnee) names.push(tw.returnee); break;
    case 'returning-player':  if (tw.returnees?.length) tw.returnees.forEach(r => names.push(r.name)); else if (tw.returnee) names.push(tw.returnee); break;
    case 'three-gifts':       (tw.giftResults||[]).forEach(r => names.push(r.player)); break;
    case 'banishment':        if (tw.banished) names.push(tw.banished); break;
  }
  return names.filter(n => n && players.find(p => p.name === n));
}

export function buildTwistDesc(tw) {
  const L = [];
  switch (tw.type) {
    case 'double-tribal':      L.push('Both tribes attend Tribal Council tonight. Two players voted out.'); break;
    case 'mutiny':             (tw.mutineers?.length ? tw.mutineers.map(m=>`${m.name||m} left ${m.from} to join ${m.to}.`) : ['No players switched tribes.']).forEach(l=>L.push(l)); break;
    case 'exile-island':       if (tw.exiled) L.push(`${tw.exiled} sent to Exile Island — misses tribal council.`); break;
    case 'hero-duel':          if (tw.duelParticipants) L.push(`${tw.duelParticipants.join(' vs ')} compete head-to-head for immunity. Result revealed after the challenge.`); break;
    case 'shared-immunity':    L.push('The immunity winner may share the necklace with one other player. Result after the challenge.'); break;
    case 'double-safety':      L.push('The immunity winner grants safety to one additional player. Result after the challenge.'); break;
    case 'fire-making':        L.push('The person voted out picks an opponent for a random duel. Loser is eliminated.'); break;
    case 'guardian-angel':     if (tw.guardianAngel) L.push(`${tw.guardianAngel} earned automatic immunity through the strength of their bonds.`); break;
    case 'sudden-death':       L.push('Sudden Death. No tribal council tonight. Last place in the challenge is auto-eliminated on the spot. No vote. No strategy. Pure performance.'); break;
    case 'slasher-night':      L.push('A slasher is loose. Survive the night. Last standing wins immunity. Lowest scorer is eliminated.'); break;
    case 'cultural-reset':     L.push('All active alliances publicly revealed.'); if (tw.revealedAlliances?.length) L.push(`Exposed: ${tw.revealedAlliances.join(', ')}.`); break;
    case 'spirit-island':      if (tw.spiritVisitor) L.push(`Jury member ${tw.spiritVisitor} returns to camp for one day.`); break;
    case 'loved-ones':         L.push('Players\' loved ones visit camp. Tribal council still runs tonight.'); break;
    case 'reward-challenge':   L.push('A reward challenge runs before immunity.'); if (tw.rewardWinner) L.push(`${tw.rewardWinner} won the reward.`); break;
    case 'fan-vote-boot':      if (tw.fanVoteSaved) { const _r = tw.fanVoteIsPreMerge ? 'tribal immunity' : 'an Extra Vote'; L.push(`Fan Vote: ${tw.fanVoteSaved} (score ${tw.fanVoteScore || 0}) receives ${_r}.`); } break;
    case 'jury-elimination':   L.push('Eliminated players voted to remove one active player from the game. Result after the vote.'); break;
    case 'tiebreaker-challenge': L.push('If the vote ties, tied players compete in a head-to-head challenge. No revote, no rocks.'); break;
    case 'penalty-vote':       if (tw.penaltyTarget) L.push(`${tw.penaltyTarget} starts tribal council with 1 pre-cast vote against them.`); break;
    case 'rock-draw':          L.push('If the vote ties, there is NO re-vote — non-immune players draw rocks immediately.'); break;
    case 'open-vote':          L.push(`Open Vote \u2014 votes are public, cast one by one.${tw.openVoteOrderedBy || ep?.openVoteOrderedBy ? ` Order chosen by ${tw.openVoteOrderedBy || ep?.openVoteOrderedBy}.` : ''}`); break;
    case 'kidnapping':           if (tw.kidnapped) L.push(`${tw.toTribe} kidnapped ${tw.kidnapped} from ${tw.fromTribe}. Skips tribal, returns next episode.`); break;
    case 'legacy-awakens':     if (tw.legacyActivated) L.push(`${tw.legacyActivated}'s Legacy Advantage fires — immune this tribal.`); break;
    case 'amulet-activate':    if (tw.amuletActivated) L.push(`${tw.amuletActivated}'s Amulet grants immunity this episode.`); break;
    case 'idol-wager':         if (tw.idolWagerWinner) L.push(`${tw.idolWagerWinner} wagered their idol and won — it's now a Super Idol.`); else if (tw.idolWagerLoser) L.push(`${tw.idolWagerLoser} wagered their idol and lost — it was destroyed.`); break;
    case 'second-chance':      if (tw.returnee) L.push(`The fans voted. ${tw.returnee} returns to the game.`); else if (tw.blocked) L.push('Second Chance Vote cancelled — Redemption Island active.'); else L.push('No eligible players could return.'); break;
    case 'returning-player': {
      const _rpReasonLabel = { 'unfinished-business':'unfinished business', 'entertainment':'entertainment value', 'strategic-threat':'strategic threat', 'underdog':'underdog grit', 'random':'sheer will' };
      if (tw.returnees?.length) tw.returnees.forEach(r => L.push(`${r.name} fought back into the game (${_rpReasonLabel[r.reason] || 'sheer will'}).`));
      else if (tw.returnee) L.push(`${tw.returnee} fought their way back into the game.`);
      else L.push('No eligible players could return this episode.');
      break;
    }
    case 'the-feast':
    case 'merge-reward':       L.push('All players shared a meal. Cross-tribal bonds strengthened.'); break;
    case 'auction':            L.push('Players received $500 each to bid on items.'); (tw.auctionResults||[]).forEach(r => L.push(`${r.winner}: ${r.label} — $${r.bid}`)); break;
    case 'three-gifts':        (tw.giftResults||[]).forEach(({player,tribe,gift}) => { const g={1:'Survival Kit',2:'Idol Clue',3:'Immunity Totem'}[gift]||`Gift ${gift}`; L.push(`${player} (${tribe}): ${g}.`); }); break;
  }
  return L;
}

// ── Shared scene renderer for twist screens ──
export function _renderTwistScene(scene) {
  if (scene.faceOff && scene.players?.length === 2) {
    return `<div style="display:flex;justify-content:center;align-items:flex-start;gap:32px;margin:16px 0">
      <div style="text-align:center">${rpPortrait(scene.players[0],'xl')}<div style="font-family:var(--font-display);font-size:12px;margin-top:6px">${scene.players[0]}</div></div>
      <div style="font-family:var(--font-display);font-size:28px;color:var(--accent-fire);align-self:center">VS</div>
      <div style="text-align:center">${rpPortrait(scene.players[1],'xl')}<div style="font-family:var(--font-display);font-size:12px;margin-top:6px">${scene.players[1]}</div></div>
    </div>`;
  }
  if (scene.juryHeader) {
    return `<div style="text-align:center;margin-bottom:16px">
      <div style="font-size:10px;letter-spacing:2px;color:var(--muted);font-family:var(--font-body);font-weight:800;margin-bottom:8px">THE JURY</div>
      <div class="rp-portrait-row" style="justify-content:center">${scene.players.map(n=>rpPortrait(n)).join('')}</div>
    </div>`;
  }
  if (scene.exileIsolated) {
    return `<div style="text-align:center;padding:24px 0">
      ${rpPortrait(scene.players[0],'xl')}
      <div style="font-family:var(--font-mono);font-style:italic;color:var(--muted);margin-top:12px;font-size:13px">${scene.text}</div>
    </div>`;
  }
  let h = `<div class="rp-scene">`;
  if (scene.text) h += `<div class="rp-scene-text">${scene.text}</div>`;
  if (scene.tribeLabel) {
    const tc = tribeColor(scene.tribeLabel);
    h += `<div class="rp-twist-tribe">
      <div class="rp-twist-tribe-head" style="color:${tc};border-color:${tc}">${scene.tribeLabel}<span style="font-size:10px;opacity:.5;margin-left:8px;font-weight:600;text-transform:none;letter-spacing:0">${scene.players.length} players</span></div>
      <div class="rp-portrait-row" style="justify-content:center">${scene.players.map(n=>rpPortrait(n)).join('')}</div>
    </div>`;
  } else if (scene.players?.length) {
    h += `<div class="rp-portrait-row" style="justify-content:center">${scene.players.map(n=>rpPortrait(n)).join('')}</div>`;
  }
  if (scene.badge) h += `<div><span class="rp-scene-badge ${scene.badgeClass||''}">${scene.badge}</span></div>`;
  h += `</div>`;
  return h;
}

// ── Emissary Vote Screen ──
// ── EMISSARY SCOUTING: shown BEFORE tribal (emissary visits camp, hears pitches) ──
export function rpBuildEmissaryScouting(ep) {
  if (!ep.emissary) return '';
  const emissary = ep.emissary.name;
  const scoutEvents = ep.emissaryScoutEvents || [];

  const stateKey = `ev_scout_${ep.num}`;
  if (!_tvState[stateKey]) _tvState[stateKey] = { idx: -1 };
  const state = _tvState[stateKey];
  const allRevealed = state.idx >= scoutEvents.length - 1;

  const _evReveal = (targetIdx) => `if(!_tvState['${stateKey}'])_tvState['${stateKey}']={idx:-1};_tvState['${stateKey}'].idx=${targetIdx};const ep=gs.episodeHistory.find(e=>e.num===${ep.num});if(ep){const m=document.querySelector('.rp-main');const st=m?m.scrollTop:0;buildVPScreens(ep);renderVPScreen();if(m)m.scrollTop=st;}`;

  const emTC = tribeColor(ep.emissary.tribe);
  const loseTC = tribeColor(ep.emissary.targetTribe);

  let html = `<div class="rp-page tod-dusk">
    <div class="rp-eyebrow">Episode ${ep.num}</div>
    <div style="font-family:var(--font-display);font-size:28px;letter-spacing:2px;text-align:center;color:#f0a500;text-shadow:0 0 20px rgba(240,165,0,0.3);margin-bottom:6px">🕵️ THE EMISSARY</div>
    <div style="text-align:center;font-size:12px;color:#8b949e;margin-bottom:20px">${ep.emissary.tribe} sends an emissary to ${ep.emissary.targetTribe}'s tribal council.</div>`;

  // ── Emissary Selection (always visible) ──
  html += `<div style="margin-bottom:16px;padding:14px;border-radius:10px;border:1px solid ${emTC}44;background:${emTC}0a">
    <div style="font-family:var(--font-display);font-size:14px;letter-spacing:1px;color:${emTC};margin-bottom:10px">EMISSARY SELECTED</div>
    <div style="display:flex;align-items:center;gap:12px">
      ${rpPortrait(emissary, 'md')}
      <div>
        <div style="font-weight:700;font-size:14px">${emissary}</div>
        <div style="font-size:11px;color:#8b949e">from ${ep.emissary.tribe} — visiting ${ep.emissary.targetTribe}</div>
      </div>
    </div>`;
  const volEvt = Object.values(ep.campEvents || {}).flatMap(c => [...(c.pre||[]), ...(c.post||[])]).find(e => e.type === 'emissaryVolunteer');
  if (volEvt?.text) html += `<div style="font-style:italic;color:#8b949e;margin-top:8px;font-size:12px">"${volEvt.text.replace(/^[^"]*"/, '').replace(/"[^"]*$/, '')}"</div>`;
  html += `</div>`;

  // ── Scouting Period (click-to-reveal) ──
  if (scoutEvents.length) {
    html += `<div style="margin-bottom:16px">
      <div style="font-family:var(--font-display);font-size:14px;letter-spacing:1px;color:${loseTC};margin-bottom:10px">SCOUTING — ${ep.emissary.targetTribe.toUpperCase()}</div>`;

    scoutEvents.forEach((evt, i) => {
      const isVisible = i <= state.idx;
      if (!isVisible) {
        html += `<div style="padding:10px;margin-bottom:4px;border:1px solid var(--border);border-radius:6px;opacity:0.12;font-size:11px;text-align:center;color:var(--muted)">?</div>`;
      } else {
        const badgeColor = evt.type === 'emissaryPitch' ? '#f0a500' : evt.type === 'emissaryDeal' ? '#3fb950' : '#58a6ff';
        const badgeLabel = evt.badgeText || (evt.type === 'emissaryPitch' ? 'PITCH' : evt.type === 'emissaryDeal' ? 'CROSS-TRIBE DEAL' : 'OBSERVATION');
        html += `<div style="padding:12px;margin-bottom:6px;border-radius:8px;border-left:3px solid ${badgeColor};background:${badgeColor}08;animation:scrollDrop 0.3s var(--ease-broadcast) both">
          <span style="font-size:9px;font-weight:700;letter-spacing:1px;color:${badgeColor};background:${badgeColor}18;padding:2px 6px;border-radius:3px">${badgeLabel}</span>
          <div style="display:flex;gap:8px;margin:8px 0">
            ${(evt.players || []).map(p => rpPortrait(p, 'sm')).join('')}
          </div>
          <div style="font-size:12px">${evt.text}</div>`;
        if (evt.consequences) html += `<div style="font-size:10px;color:#8b949e;margin-top:4px">${evt.consequences}</div>`;
        html += `</div>`;
      }
    });
    html += `</div>`;

    html += `<div style="text-align:center;font-size:12px;color:#8b949e;font-style:italic;margin-bottom:8px">${emissary} will attend ${ep.emissary.targetTribe}'s tribal council and choose someone to eliminate.</div>`;

    if (!allRevealed) {
      html += `<div style="position:sticky;bottom:0;padding:12px 0;text-align:center;background:linear-gradient(transparent,var(--bg-primary) 30%)">
        <button class="rp-btn" onclick="${_evReveal(state.idx + 1)}">NEXT</button>
        <button class="rp-btn rp-btn-secondary" onclick="${_evReveal(scoutEvents.length - 1)}" style="margin-left:8px">REVEAL ALL</button>
      </div>`;
    }
  }

  html += `</div>`;
  return html;
}

// ── EMISSARY'S CHOICE: shown AFTER votes (emissary picks second elimination) ──
export function rpBuildEmissaryChoice(ep) {
  if (!ep.emissary || !ep.emissaryPick) return '';
  const emissary = ep.emissary.name;
  const pick = ep.emissaryPick;
  const bondShifts = ep.emissaryBondShifts || [];

  let html = `<div class="rp-page tod-deepnight">
    <div class="rp-eyebrow">Episode ${ep.num}</div>
    <div style="font-family:var(--font-display);font-size:28px;letter-spacing:2px;text-align:center;color:#f85149;text-shadow:0 0 20px rgba(248,81,73,0.3);margin-bottom:20px">🎯 THE EMISSARY'S CHOICE</div>`;

  html += `<div style="padding:16px;margin-bottom:6px;border-radius:10px;border:2px solid #f85149;background:linear-gradient(135deg,rgba(248,81,73,0.12) 0%,rgba(248,81,73,0.04) 100%);box-shadow:0 0 20px rgba(248,81,73,0.15)">
    <div style="text-align:center;font-size:12px;color:#8b949e;margin-bottom:12px">${emissary} has watched the vote. Now it's ${pronouns(emissary).pos} turn.</div>
    <div style="display:flex;align-items:center;justify-content:center;gap:16px;margin-bottom:12px">
      ${rpPortrait(emissary, 'md')}
      <div style="font-size:24px;color:#f85149">→</div>
      ${rpPortrait(pick.name, 'md')}
    </div>
    <div style="text-align:center;font-size:16px;font-weight:700;margin-bottom:6px">${pick.name} is eliminated by the emissary.</div>
    <div style="text-align:center;font-style:italic;color:#8b949e;font-size:13px;margin-bottom:12px">${pick.reason}</div>`;

  // Bond fallout summary
  if (bondShifts.length) {
    const grudges = bondShifts.filter(s => s.reason === 'ally-grudge');
    const grateful = bondShifts.filter(s => s.reason === 'gratitude');
    html += `<div style="margin-top:12px;padding-top:8px;border-top:1px solid rgba(255,255,255,0.06);font-size:11px">`;
    if (grudges.length) html += `<div style="color:#f85149">😤 ${grudges.map(s => s.from).join(', ')} — grudge against ${emissary}</div>`;
    if (grateful.length) html += `<div style="color:#3fb950">🤝 ${grateful.map(s => s.from).join(', ')} — grateful</div>`;
    html += `</div>`;
  }
  html += `</div>`;

  // ── Tribe Dissolution (if losing tribe wiped to 1 member) ──
  if (ep.emissaryDissolve) {
    const d = ep.emissaryDissolve;
    const dPr = pronouns(d.player);
    html += `<div style="padding:14px;margin-top:12px;border-radius:10px;border:1px solid rgba(248,81,73,0.3);background:rgba(248,81,73,0.06)">
      <div style="font-family:var(--font-display);font-size:12px;letter-spacing:1px;color:#f85149;margin-bottom:8px">TRIBE DISSOLVED</div>
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
        ${rpPortrait(d.player, 'sm')}
        <div style="font-size:12px"><strong>${d.fromTribe}</strong> has been wiped out. <strong>${d.player}</strong> — the last one standing — joins <strong>${d.toTribe}</strong>.</div>
      </div>
      <div style="font-size:11px;color:#8b949e;font-style:italic">${d.player} ${dPr.sub === 'they' ? 'have' : 'has'} to start over with strangers.</div>
    </div>`;
  }

  html += `</div>`;
  return html;
}

// ── Ambassadors Screen (pre-merge twist) ──
export function rpBuildAmbassadors(ep) {
  const data = ep.ambassadorData;
  if (!data?.ambassadorMeeting) return null;
  const meeting = data.ambassadorMeeting;
  const selections = data.ambassadorSelections || [];
  const epNum = ep.num || 0;

  let html = `<div class="rp-page" style="background:linear-gradient(180deg,rgba(99,102,241,0.06) 0%,transparent 40%)">
    <div class="rp-eyebrow">Episode ${epNum}</div>
    <div style="font-family:var(--font-display);font-size:28px;letter-spacing:2px;text-align:center;margin-bottom:4px;color:#818cf8;text-shadow:0 0 20px rgba(99,102,241,0.2)">THE AMBASSADORS</div>
    <div style="width:60px;height:2px;background:#818cf8;margin:8px auto 20px"></div>`;

  // ── SELECTION ──
  html += `<div style="font-size:9px;font-weight:700;letter-spacing:2px;color:#8b949e;margin-bottom:10px">TRIBAL SELECTIONS</div>`;
  html += `<div style="display:flex;gap:16px;margin-bottom:20px;flex-wrap:wrap">`;
  selections.forEach(sel => {
    const tc = tribeColor(sel.tribe);
    const typeObj = meeting.types?.find(t => t.name === sel.ambassador);
    const typeLabel = typeObj?.type === 'manipulator' ? 'The Manipulator' : typeObj?.type === 'villain' ? 'The Villain' : typeObj?.type === 'dealmaker' ? 'The Dealmaker' : typeObj?.type === 'loyal-shield' ? 'The Loyal Shield' : 'The Emotional Pitch';
    html += `<div style="flex:1;min-width:140px;padding:12px;border:1px solid ${tc};border-radius:10px;background:rgba(0,0,0,0.2)">
      <div style="font-size:10px;font-weight:700;color:${tc};letter-spacing:1px;margin-bottom:8px">${sel.tribe.toUpperCase()}</div>
      <div style="text-align:center">
        ${rpPortrait(sel.ambassador, 'lg')}
        <div style="font-size:14px;font-weight:700;color:#e6edf3;margin-top:6px">${sel.ambassador}</div>
        <div style="font-size:10px;color:#818cf8;margin-top:2px">${typeLabel}</div>
      </div>
      ${sel.runnerUp ? `<div style="display:flex;align-items:center;gap:6px;margin-top:8px;opacity:0.5">
        ${rpPortrait(sel.runnerUp, 'xs')}
        <span style="font-size:10px;color:#8b949e">${sel.runnerUp} — runner-up</span>
      </div>` : ''}
    </div>`;
  });
  html += `</div>`;

  // ── MEETING NARRATIVE — interactive click-to-advance ──
  const _ambNarId = `amb-nar-${epNum}`;
  const _ambBeats = meeting.narrative || [];
  const _ambTotalBeats = _ambBeats.length;
  html += `<div style="font-size:9px;font-weight:700;letter-spacing:2px;color:#8b949e;margin-bottom:10px">THE MEETING</div>`;
  html += `<div id="${_ambNarId}" data-step="0" data-total="${_ambTotalBeats}">`;
  _ambBeats.forEach((beat, i) => {
    html += `<div id="${_ambNarId}-beat-${i}" style="display:none;opacity:0;transition:opacity 0.5s;padding:10px 14px;margin-bottom:8px;background:rgba(99,102,241,0.04);border:1px solid rgba(99,102,241,0.12);border-radius:8px;font-size:12px;color:#c9d1d9;line-height:1.6;font-style:italic">${beat}</div>`;
  });
  html += `</div>`;
  html += `<div style="display:flex;gap:12px;margin-bottom:16px">
    <button onclick="ambNarAdvance('${_ambNarId}')" id="${_ambNarId}-btn" style="padding:8px 20px;background:#818cf8;border:none;border-radius:6px;color:#0d1117;font-family:var(--font-display);font-size:13px;letter-spacing:1px;cursor:pointer;font-weight:700">BEGIN</button>
    <button onclick="ambNarRevealAll('${_ambNarId}')" style="padding:6px 12px;background:transparent;border:1px solid var(--border);border-radius:6px;color:var(--muted);font-size:11px;cursor:pointer">See all</button>
  </div>`;

  // ── OUTCOME + RETURN + EXIT — hidden until narrative fully revealed ──
  html += `<div id="${_ambNarId}-outcome" style="display:none">`;
  if (meeting.agreed && meeting.target) {
    html += `<div style="text-align:center;margin-top:16px;padding:16px;border:2px solid rgba(218,54,51,0.3);border-radius:12px;background:rgba(218,54,51,0.04)">
      ${rpPortrait(meeting.target, 'xl')}
      <div style="font-family:var(--font-display);font-size:18px;color:#f85149;margin-top:10px">${meeting.target}</div>
      <div style="font-size:10px;font-weight:700;letter-spacing:2px;color:#f85149;margin-top:4px">ELIMINATED BY AMBASSADORS</div>
      <div style="font-size:11px;color:#8b949e;margin-top:8px;max-width:350px;margin-left:auto;margin-right:auto">${meeting.targetReason}</div>
    </div>`;
  } else if (meeting.rockDrawLoser) {
    html += `<div style="text-align:center;margin-top:16px;padding:16px;border:2px solid rgba(218,54,51,0.3);border-radius:12px;background:rgba(218,54,51,0.04)">
      ${rpPortrait(meeting.rockDrawLoser, 'xl')}
      <div style="font-family:var(--font-display);font-size:18px;color:#f85149;margin-top:10px">${meeting.rockDrawLoser}</div>
      <div style="font-size:10px;font-weight:700;letter-spacing:2px;color:#f85149;margin-top:4px">ELIMINATED BY ROCK DRAW</div>
      <div style="font-size:11px;color:#8b949e;margin-top:8px">The ambassadors couldn't agree. The rocks decided.</div>
    </div>`;
  }

  // ── RETURN EVENTS — show each beat separately ──
  if (meeting.returnEvents?.length) {
    html += `<div style="font-size:9px;font-weight:700;letter-spacing:2px;color:#8b949e;margin-top:20px;margin-bottom:10px">THE RETURN</div>`;
    meeting.returnEvents.forEach(re => {
      const borderColor = re.type === 'safe' ? 'rgba(63,185,80,0.2)' : re.type === 'ambassador-eliminated' ? 'rgba(218,54,51,0.25)' : 'rgba(218,54,51,0.2)';
      const bg = re.type === 'safe' ? 'rgba(63,185,80,0.03)' : 'rgba(218,54,51,0.03)';
      const badge = re.type === 'safe' ? '<span style="font-size:9px;font-weight:700;color:#3fb950;letter-spacing:1px">SAFE</span>'
        : re.type === 'ambassador-eliminated' ? '<span style="font-size:9px;font-weight:700;color:#f85149;letter-spacing:1px">AMBASSADOR LOST</span>'
        : '<span style="font-size:9px;font-weight:700;color:#f85149;letter-spacing:1px">TRIBEMATE ELIMINATED</span>';
      const tc = tribeColor(re.tribe);
      html += `<div style="padding:12px;margin-bottom:8px;border:1px solid ${borderColor};border-radius:8px;background:${bg}">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
          <span style="font-size:11px;font-weight:700;color:${tc};letter-spacing:0.5px">${re.tribe.toUpperCase()}</span>
          ${badge}
        </div>`;
      // Show beats individually if available
      const beats = re.beats || [re.text];
      beats.forEach(beat => {
        html += `<div style="font-size:12px;color:#c9d1d9;line-height:1.7;font-style:italic;margin-bottom:6px;padding-left:8px;border-left:2px solid ${borderColor}">${beat}</div>`;
      });
      html += `</div>`;
    });
  }

  // ── EXIT QUOTE ──
  if (meeting.eliminated) {
    const _exitPick = (arr) => arr[([...meeting.eliminated].reduce((a,c)=>a+c.charCodeAt(0),0)+(epNum||0)*5)%arr.length];
    const _elimS = pStats(meeting.eliminated);
    const _elimPr = pronouns(meeting.eliminated);
    const exitQuote = meeting.eliminatedByRocks
      ? _elimS.boldness >= 7
        ? _exitPick([`"I'd do it again. I'd volunteer again. At least I went down swinging."`, `"A rock? That's how I go out? Fine. At least I didn't go out on my knees."`])
        : _elimS.loyalty >= 7
        ? _exitPick([`"Tell them I tried. Tell them I didn't give anyone up. The rock took me — not the game."`, `"I stayed loyal. The rock didn't care about that. But I did."`])
        : _elimS.strategic >= 7
        ? _exitPick([`"Bad luck. That's all this is. I played it right and the rock said no."`, `"I calculated every angle. You can't calculate a rock draw. That's the one variable I couldn't control."`])
        : _exitPick([`"I don't even know what to say. A rock. That's how this ends for me."`, `"I didn't see this coming. Not like this."`])
      : _elimS.boldness >= 7
        ? _exitPick([`"Two people I never got to face decided my fate. That's not the game — that's a backroom deal. And I would have blown it up if I'd been in that room."`, `"You want to take me out? Say it to my face. Don't send ambassadors to do your dirty work."`])
        : _elimS.temperament <= 4
        ? _exitPick([`"This is garbage. I didn't even get a vote. I didn't get to fight. Someone in a room I wasn't in wrote my name and that's it? That's not Survivor."`, `"I'm angry. I'm not gonna pretend I'm not. They took the coward's way out and I'm the one who pays for it."`])
        : _elimS.strategic >= 7
        ? _exitPick([`"I respect the move. I don't respect that I never got to counter it. The game happened in a room I wasn't in."`, `"Strategically, it makes sense. I would have done the same thing. That doesn't make it easier to walk away."`])
        : _elimS.social >= 7
        ? _exitPick([`"I thought the bonds I built would protect me. They didn't. The game happened in a room I wasn't in."`, `"I connected with everyone on my tribe. None of that mattered when two strangers sat down and decided my fate."`])
        : _elimS.loyalty >= 7
        ? _exitPick([`"I would have fought for my tribe. I would have stood in that room and refused. But I never got the chance."`, `"I stayed loyal to the end. And the end came from somewhere I never expected."`])
        : _exitPick([`"I didn't get to play my game today. Someone else played it for me."`, `"I keep replaying it. What could I have done? Nothing. That's the worst part."`]);
    html += `<div style="margin-top:16px;padding:12px;background:rgba(139,148,158,0.04);border:1px solid rgba(139,148,158,0.08);border-radius:8px">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
        ${rpPortrait(meeting.eliminated, 'sm')}
        <div>
          <div style="font-size:13px;font-weight:700;color:#e6edf3">${meeting.eliminated}</div>
          <div style="font-size:10px;color:#8b949e">${vpArchLabel(meeting.eliminated)}</div>
        </div>
      </div>
      <div style="font-size:12px;color:#8b949e;font-style:italic;line-height:1.6">${exitQuote}</div>
    </div>`;
  }

  html += `</div>`; // close outcome hidden div

  html += `</div>`;
  return html;
}

// ── Merge Announcement Screen (NEW — inserted on isMerge episodes) ──
export function rpBuildMergeAnnouncement(ep) {
  const snap = ep.gsSnapshot || {};
  const mergedTribe = snap.tribes?.[0] || { name: gs.mergeName || 'Merged', members: snap.activePlayers || [] };
  const tc = tribeColor(mergedTribe.name);
  const alliances = snap.namedAlliances || [];
  // Reconstruct merge participants: snapshot active + anyone eliminated at tribal THIS episode
  // (they were part of the merge but got voted out the same night)
  // Do NOT include ambassador-eliminated players (they were eliminated BEFORE the merge)
  const _tribalElim = [ep.eliminated, ep.firstEliminated].filter(Boolean);
  const _ambElim = ep.ambassadorData?.ambassadorEliminated || null;
  const _mergeParticipants = [...new Set([
    ...(snap.activePlayers || gs.activePlayers),
    ..._tribalElim.filter(e => e !== _ambElim), // tribal eliminees were part of the merge
  ])];

  const topAlliances = [...alliances].sort((a,b) => b.members.length - a.members.length).slice(0, 2);

  const alliedSet = new Set(alliances.flatMap(a => a.members));
  const unallied = _mergeParticipants.filter(n => !alliedSet.has(n));
  const avgBond = n => {
    const others = _mergeParticipants.filter(p => p !== n);
    return others.length ? others.reduce((s,p) => s + getBond(n,p), 0) / others.length : 0;
  };
  const onBottom = [...unallied].sort((a,b) => avgBond(a) - avgBond(b)).slice(0, 3);

  let html = `<div class="rp-page tod-merge-am">
    <div class="rp-eyebrow">Episode ${ep.num}</div>
    <div style="font-family:var(--font-display);font-size:48px;letter-spacing:2px;text-align:center;color:${tc};margin-bottom:8px;animation:bannerUnfurl 0.6s var(--ease-broadcast) both;transform-origin:center">${mergedTribe.name.toUpperCase()}</div>
    <div style="text-align:center;font-size:13px;color:var(--muted);margin-bottom:24px">The merge. ${_mergeParticipants.length} players enter the individual game.</div>
    <div class="rp-portrait-row" style="flex-wrap:wrap;justify-content:center;margin-bottom:28px">
      ${_mergeParticipants.map((n, i) => `<div style="animation:staggerIn 0.4s var(--ease-broadcast) ${i * 80}ms both">${rpPortrait(n)}</div>`).join('')}
    </div>`;

  if (topAlliances.length) {
    html += `<div class="vp-section-header gold">Alliance threats going in</div>`;
    topAlliances.forEach(a => {
      const members = a.members.filter(n => _mergeParticipants.includes(n));
      html += `<div class="vp-card gold" style="margin-bottom:10px">
        <div style="font-family:var(--font-display);font-size:14px;letter-spacing:1px;margin-bottom:6px">${a.name}</div>
        <div style="font-size:12px;color:var(--muted)">${members.join(', ')}</div>
      </div>`;
    });
  }

  if (onBottom.length) {
    html += `<div class="vp-section-header fire">On the bottom</div>`;
    html += `<div class="vp-card fire">
      <div style="font-size:13px">${onBottom.join(', ')}</div>
      <div style="font-size:11px;color:var(--muted);margin-top:4px">Unallied going into the merge</div>
    </div>`;
  }

  html += `</div>`;
  return html;
}

// ── Debug VP Screen — hidden engine data for testing ──
// ── THE MOLE EXPOSED — dedicated VP screen ──
// ── TIED DESTINIES — VP announcement screen ──
export function rpBuildTiedDestinies(ep) {
  const td = (ep.twists || []).find(t => t.tiedDestinies);
  if (!td?.pairs?.length) return null;
  const reactions = td.reactions || {};

  let html = `<div class="rp-page tod-dusk">
    <div class="rp-eyebrow">Episode ${ep.num}</div>
    <div style="font-family:var(--font-display);font-size:28px;color:#818cf8;text-align:center;letter-spacing:2px;text-shadow:0 0 16px rgba(129,140,248,0.4);margin-bottom:6px">TIED DESTINIES</div>
    <div style="font-size:12px;color:#8b949e;text-align:center;margin-bottom:24px;line-height:1.5">Your fates are linked. If one of you is voted out tonight, you both go home.</div>`;

  // Pairs revealed with reaction text
  const _reactTexts = {
    relieved: [
      (a, b) => `${a} exhales. Of everyone here, ${b} is someone ${pronouns(a).sub} can work with. This could have been so much worse.`,
      (a, b) => `${a} and ${b} lock eyes and nod. They're in this together — and they're both okay with that.`,
      (a, b) => `${a} smiles when ${b}'s name is called. "I'll take it." The relief is visible.`,
    ],
    cautious: [
      (a, b) => `${a} looks at ${b}. Not the worst draw. Not the best. ${pronouns(a).Sub} ${pronouns(a).sub === 'they' ? 'keep' : 'keeps'} ${pronouns(a).posAdj} face neutral.`,
      (a, b) => `${a} processes the pairing with ${b}. Could be worse. Could be better. The game just got more complicated.`,
      (a, b) => `${a} nods slowly. ${b}. Okay. ${pronouns(a).Sub} can work with this — probably.`,
    ],
    dread: [
      (a, b) => `${a}'s face drops. ${b}. Of all people. ${pronouns(a).Sub} ${pronouns(a).sub === 'they' ? 'try' : 'tries'} to hide the reaction. ${pronouns(a).Sub} ${pronouns(a).sub === 'they' ? 'fail' : 'fails'}.`,
      (a, b) => `${a} stares at ${b}. The hostility between them is well-documented. Now their fates are linked. This is a nightmare.`,
      (a, b) => `"You're kidding." ${a} looks at the host, then at ${b}. The dread is immediate.`,
    ],
    fury: [
      (a, b) => `${a} doesn't even try to hide it. Paired with ${b} — the person ${pronouns(a).sub} trust${pronouns(a).sub === 'they' ? '' : 's'} least in this game. "This is a death sentence."`,
      (a, b) => `${a} and ${b}. The tribe winces. Everyone knows the history. This pairing is a bomb with a lit fuse.`,
      (a, b) => `${a} laughs — the kind that means nothing is funny. ${b}. The universe has a sick sense of humor.`,
    ],
  };
  const _pick = arr => arr[Math.floor(Math.random() * arr.length)];

  td.pairs.forEach((pair, i) => {
    const reactA = reactions[pair.a] || 'cautious';
    const reactB = reactions[pair.b] || 'cautious';
    const _reactColors = { relieved: '#3fb950', cautious: '#e3b341', dread: '#f0883e', fury: '#f85149' };
    // Pick the more dramatic reaction for the pair's text
    const _dramOrder = ['fury', 'dread', 'cautious', 'relieved'];
    const _mainReact = _dramOrder.indexOf(reactA) < _dramOrder.indexOf(reactB) ? reactA : reactB;
    const _mainPlayer = _dramOrder.indexOf(reactA) <= _dramOrder.indexOf(reactB) ? pair.a : pair.b;
    const _otherPlayer = _mainPlayer === pair.a ? pair.b : pair.a;
    const _reactionText = _pick(_reactTexts[_mainReact])(_mainPlayer, _otherPlayer);

    html += `<div style="padding:14px;margin-bottom:12px;background:rgba(129,140,248,0.04);border:1px solid rgba(129,140,248,0.15);border-radius:10px">
      <div style="display:flex;align-items:center;justify-content:center;gap:20px;margin-bottom:8px">
        ${rpPortrait(pair.a, 'lg')}
        <div style="text-align:center">
          <div style="font-size:24px;color:#818cf8">🔗</div>
          <div style="font-size:10px;color:#8b949e;margin-top:4px">${bondLabel(getBond(pair.a, pair.b))}</div>
        </div>
        ${rpPortrait(pair.b, 'lg')}
      </div>
      <div style="font-size:12px;color:#c9d1d9;line-height:1.6;font-style:italic;padding:6px 8px;background:rgba(139,148,158,0.04);border-radius:6px">${_reactionText}</div>
    </div>`;
  });

  html += `</div>`;
  return html;
}

export function rpBuildSchoolyardPick(ep) {
  const sp = ep.schoolyardPick;
  if (!sp?.picks?.length) return null;
  const stateKey = String(ep.num) + '_syp';
  if (!_tvState[stateKey]) _tvState[stateKey] = { idx: 0 };
  const state = _tvState[stateKey];
  // Deterministic pick: hash name to index so reactions stay stable across VP rebuilds
  const _seedPick = (arr, name) => arr[([...name].reduce((s,c) => s + c.charCodeAt(0), 0) + ep.num) % arr.length];

  // Build reveal steps: captain announce → each pick → last picked/exile → tribes
  const steps = [];
  steps.push({ type: 'captains' });
  sp.picks.forEach((p, i) => {
    steps.push({ type: 'pick', captain: p.captain, picked: p.picked, pickNumber: p.pickNumber, idx: i });
  });
  if (sp.exiled) steps.push({ type: 'exile', player: sp.exiled });
  steps.push({ type: 'tribes' });

  const visibleSteps = steps.slice(0, state.idx + 1);
  const allRevealed = state.idx >= steps.length - 1;
  const totalPicks = sp.picks.length;

  const _sypReveal = (targetIdx) => `if(!_tvState['${stateKey}'])_tvState['${stateKey}']={idx:0};_tvState['${stateKey}'].idx=${targetIdx};const ep=gs.episodeHistory.find(e=>e.num===${ep.num});if(ep){buildVPScreens(ep);renderVPScreen();}`;

  // ── Per-pick reaction generator ──
  // Reactions based on: pick position (early/mid/late/last), archetype, stats, bond with captain
  function _pickReaction(picked, captain, pickNum) {
    const ps = pStats(picked);
    const pr = pronouns(picked);
    const bond = getBond(picked, captain);
    const arch = ps.archetype || '';
    const isEarly = pickNum <= 2;
    const isMid = pickNum > 2 && pickNum <= Math.ceil(totalPicks * 0.6);
    const isLate = pickNum > Math.ceil(totalPicks * 0.6) && picked !== sp.lastPicked;
    const isLast = picked === sp.lastPicked;

    if (isEarly) {
      // First picks — valued, confident
      if (arch === 'challenge-beast') return _seedPick([
        `${picked} nods. First round. Exactly where ${pr.sub} expected to be.`,
        `No surprise there. ${picked} is the kind of player you build a team around.`,
        `${captain} didn't hesitate. ${picked} is ${pr.posAdj} foundation.`,
      ], picked);
      if (arch === 'hero') return _seedPick([
        `${picked} walks over with quiet confidence. ${pr.Sub} earned this.`,
        `${picked} smiles — not smug, just relieved. ${pr.Sub} ${pr.sub==='they'?'know':'knows'} ${pr.posAdj} value.`,
      ], picked);
      if (arch === 'villain' || arch === 'schemer') return _seedPick([
        `${picked} smirks. First pick. ${captain} knows what ${pr.sub}'${pr.sub==='they'?'re':'s'} worth — even if ${pr.sub} ${pr.sub==='they'?'don\'t':'doesn\'t'} trust ${pr.obj}.`,
        `"Smart choice." ${picked} joins ${captain}'s side with a look that says ${pr.sub} ${pr.sub==='they'?'were':'was'} always going to be first.`,
      ], picked);
      if (bond >= 3) return _seedPick([
        `${picked} and ${captain} lock eyes. No hesitation. This was always the pick.`,
        `${captain} calls ${picked} first. The bond between them made it obvious.`,
      ], picked);
      return _seedPick([
        `${picked} steps forward — first round pick. A statement of value.`,
        `${captain} doesn't think twice. ${picked} is the one ${pr.sub} want${pr.sub==='they'?'':'s'}.`,
        `First pick. ${picked} carries that with ${pr.obj} for the rest of the game.`,
      ], picked);
    }

    if (isMid) {
      // Middle picks — solid, not dramatic
      if (arch === 'social-butterfly') return _seedPick([
        `${picked} joins the group and immediately starts chatting. ${pr.Sub}'ll fit in anywhere.`,
        `${picked} nods and slides in. ${pr.Sub} ${pr.sub==='they'?'make':'makes'} it look easy.`,
      ], picked);
      if (arch === 'floater') return _seedPick([
        `${picked} walks over quietly. Middle of the draft, middle of the pack. The way ${pr.sub} like${pr.sub==='they'?'':'s'} it.`,
        `${picked} joins without fanfare. Nobody's watching too closely. Perfect.`,
      ], picked);
      if (ps.strategic >= 7) return _seedPick([
        `${picked} takes note of every pick before ${pr.obj}. The order matters — and ${pr.sub}'ll remember it.`,
        `${picked} files this away. Pick #${pickNum}. Not first, not last. ${pr.Sub}'ll use that.`,
      ], picked);
      if (ps.boldness >= 7) return _seedPick([
        `${picked} shrugs as ${pr.sub} walk${pr.sub==='they'?'':'s'} over. "Took you long enough."`,
        `"Middle of the pack?" ${picked} scoffs. ${pr.Sub}'ll prove that wrong.`,
      ], picked);
      return _seedPick([
        `${picked} joins ${captain}'s team. No drama. Solid pick.`,
        `${picked} nods and heads over. Pick #${pickNum} — could be worse.`,
        `${captain} calls ${picked}. A practical choice. ${picked} accepts it.`,
      ], picked);
    }

    if (isLate && !isLast) {
      // Late picks — tension, discomfort
      if (arch === 'hothead' || arch === 'chaos-agent') return _seedPick([
        `${picked} doesn't hide the frustration. Pick #${pickNum}. The disrespect is real.`,
        `${picked}'s face hardens. This late? ${pr.Sub}'ll remember who waited.`,
      ], picked);
      if (arch === 'underdog') return _seedPick([
        `${picked} swallows hard but walks over. Always overlooked. But that's where underdogs start.`,
        `Pick #${pickNum}. ${picked} adds it to the list of things that fuel ${pr.obj}.`,
      ], picked);
      if (ps.temperament <= 4) return _seedPick([
        `${picked}'s jaw clenches. Pick #${pickNum}. The anger is barely contained.`,
        `"Fine." ${picked}'s tone says more than any speech. Late pick. Message received.`,
      ], picked);
      if (ps.social >= 7) return _seedPick([
        `${picked} forces a smile, but the late pick stings. Everyone saw the order.`,
        `${picked} hides the disappointment well. Almost. The eyes give it away.`,
      ], picked);
      return _seedPick([
        `${picked} walks over slowly. The wait was uncomfortable, and everyone noticed.`,
        `Pick #${pickNum}. ${picked} tries not to read into it. But ${pr.sub} ${pr.sub==='they'?'do':'does'}.`,
        `${picked} joins, but the late pick leaves a mark. These things get remembered.`,
      ], picked);
    }

    // Last pick — strongest reactions
    if (isLast) {
      if (arch === 'villain' || arch === 'schemer') return _seedPick([
        `Last pick. ${picked}'s smile doesn't reach ${pr.posAdj} eyes. Someone just made an enemy.`,
        `${picked} is the last name called. ${pr.Sub} ${pr.sub==='they'?'don\'t':'doesn\'t'} react. That's how you know it's dangerous.`,
        `"Interesting." ${picked} files this away. The captains just told ${pr.obj} exactly where ${pr.sub} stand${pr.sub==='they'?'':'s'}. That's useful information.`,
      ], picked);
      if (arch === 'challenge-beast') return _seedPick([
        `Last pick? ${picked}? The entire tribe just made a mistake they'll feel in every challenge.`,
        `${picked} looks at both teams. Last picked. Fine. ${pr.Sub}'ll carry this anger straight into the next challenge.`,
      ], picked);
      if (arch === 'hothead' || arch === 'chaos-agent') return _seedPick([
        `${picked} is furious. ${pr.Sub} didn't come here to be the last one standing. Someone's going to pay for this.`,
        `"Are you serious?" ${picked}'s face says it all. The disrespect is noted — and it won't be forgotten.`,
      ], picked);
      if (arch === 'underdog') return _seedPick([
        `Last picked. Again. ${picked} knows this feeling too well. But this time, ${pr.sub}'ll make them regret it.`,
        `${picked} doesn't say anything. Just burns this moment into memory. Fuel for later.`,
      ], picked);
      if (ps.boldness >= 7) return _seedPick([
        `${picked}'s jaw sets. Last pick. Fine. Now ${pr.sub} ${pr.sub==='they'?'have':'has'} something to prove — and ${pr.sub}'ll make them regret it.`,
        `"Remember this." ${picked} looks at both teams. The fire in ${pr.posAdj} eyes is unmistakable.`,
      ], picked);
      if (ps.temperament >= 7) return _seedPick([
        `${picked} nods slowly. Last pick. ${pr.Sub} ${pr.sub==='they'?'get':'gets'} it. The hurt is there, but ${pr.sub} swallow${pr.sub==='they'?'':'s'} it.`,
        `${picked} looks at the ground. Being picked last is the confirmation of what ${pr.sub} always feared.`,
      ], picked);
      return _seedPick([
        `${picked} stares daggers at both captains. ${pr.Sub} ${pr.sub==='they'?'don\'t':'doesn\'t'} say anything. ${pr.Sub} ${pr.sub==='they'?'don\'t':'doesn\'t'} need to.`,
        `The silence when ${picked} is the last name called says everything. Everyone saw the order.`,
        `Last picked. ${picked} absorbs it in silence. Then ${pr.sub} start${pr.sub==='they'?'':'s'} planning.`,
      ], picked);
    }

    return `${picked} joins the team.`;
  }

  // Captain source labels
  const _capSourceLabel = sp.captainSource === 'challenge'
    ? 'Selected as captains for their challenge performance.'
    : 'Randomly chosen as captains.';

  let html = `<div class="rp-page tod-dusk">
    <div class="rp-eyebrow">Episode ${ep.num}</div>
    <div style="font-family:var(--font-display);font-size:28px;letter-spacing:2px;text-align:center;color:var(--accent-gold);text-shadow:0 0 20px var(--accent-gold);margin-bottom:6px;animation:scrollDrop 0.5s var(--ease-broadcast) both">SCHOOLYARD PICK</div>
    <div style="font-size:12px;color:#8b949e;text-align:center;margin-bottom:24px;line-height:1.5">Two captains. One draft. Every pick creates a pecking order.</div>`;

  visibleSteps.forEach(step => {
    if (step.type === 'captains') {
      html += `<div style="padding:14px;margin-bottom:16px;background:rgba(227,179,65,0.06);border:1px solid rgba(227,179,65,0.2);border-radius:10px;animation:scrollDrop 0.4s var(--ease-broadcast) both">
        <div style="font-size:11px;font-weight:700;letter-spacing:1.5px;color:var(--accent-gold);text-align:center;margin-bottom:10px">CAPTAINS</div>
        <div style="display:flex;align-items:center;justify-content:center;gap:24px;margin-bottom:8px">
          <div style="text-align:center">${rpPortrait(sp.captains[0], 'lg')}<div style="font-size:13px;color:#e6edf3;margin-top:4px;font-weight:700">${sp.captains[0]}</div></div>
          <div style="font-size:18px;color:var(--accent-gold)">vs</div>
          <div style="text-align:center">${rpPortrait(sp.captains[1], 'lg')}<div style="font-size:13px;color:#e6edf3;margin-top:4px;font-weight:700">${sp.captains[1]}</div></div>
        </div>
        <div style="font-size:11px;color:#8b949e;text-align:center">${_capSourceLabel}</div>
      </div>`;
    } else if (step.type === 'pick') {
      const isLastPick = step.picked === sp.lastPicked && !sp.exiled;
      const _pickColor = step.pickNumber <= 2 ? '#3fb950' : step.pickNumber <= 4 ? '#58a6ff' : isLastPick ? '#f85149' : step.pickNumber > Math.ceil(totalPicks * 0.6) ? '#f0883e' : '#cdd9e5';
      const _borderColor = isLastPick ? 'rgba(248,81,73,0.3)' : step.pickNumber <= 2 ? 'rgba(63,185,80,0.2)' : 'rgba(139,148,158,0.1)';
      const reaction = _pickReaction(step.picked, step.captain, step.pickNumber);

      html += `<div class="vp-card" style="border-color:${_borderColor};margin-bottom:8px;animation:scrollDrop 0.3s var(--ease-broadcast) both">
        <div style="display:flex;align-items:center;gap:10px">
          <div style="font-size:16px;font-weight:700;color:${_pickColor};min-width:28px;text-align:center">#${step.pickNumber}</div>
          ${rpPortrait(step.picked, 'sm')}
          <div style="flex:1">
            <div style="font-size:13px;color:#e6edf3;font-weight:600">${step.picked}</div>
            <div style="font-size:10px;color:#8b949e">picked by <strong>${step.captain}</strong></div>
          </div>
          ${isLastPick ? `<span style="font-size:9px;font-weight:700;letter-spacing:1px;color:#f85149;border:1px solid rgba(248,81,73,0.3);padding:2px 6px;border-radius:4px">LAST PICKED</span>` : ''}
        </div>
        <div style="font-size:11px;color:#9198a1;line-height:1.5;font-style:italic;margin-top:6px;padding-left:38px">${reaction}</div>
      </div>`;
    } else if (step.type === 'exile') {
      const ps = pStats(step.player);
      const pr = pronouns(step.player);
      const arch = ps.archetype || '';
      const _exileReactions = {
        'villain': [`Last one standing. ${step.player}'s smile doesn't reach ${pr.posAdj} eyes. The captains just made a mistake.`, `Not picked. ${step.player} absorbs it. Then starts planning revenge.`],
        'schemer': [`${step.player} watches both teams walk away. ${pr.Sub} ${pr.sub==='they'?'weren\'t':'wasn\'t'} chosen. Fine. Exile gives ${pr.obj} time to think — and scheme.`],
        'hothead': [`${step.player} is livid. Not picked. Not wanted. ${pr.Sub} kick${pr.sub==='they'?'':'s'} the dirt and storm${pr.sub==='they'?'':'s'} off. This isn't over.`],
        'chaos-agent': [`${step.player} laughs — the kind that makes people nervous. "Exile? Perfect. You just let me loose."`, `Not chosen. ${step.player} doesn't look hurt. ${pr.Sub} look${pr.sub==='they'?'':'s'} unhinged.`],
        'challenge-beast': [`${step.player} stands alone. The strongest player in the game, and nobody picked ${pr.obj}. That's a mistake they'll feel in every challenge.`],
        'underdog': [`Not picked. ${step.player} has been here before — overlooked, underestimated. This is where the comeback story starts.`, `${step.player} watches everyone walk away. Last one left. ${pr.Sub} ${pr.sub==='they'?'don\'t':'doesn\'t'} cry. ${pr.Sub} plan${pr.sub==='they'?'':'s'}.`],
        'hero': [`${step.player} stands alone with quiet dignity. Not chosen. It hurts — but ${pr.sub}'ll come back from this. ${pr.Sub} always ${pr.sub==='they'?'do':'does'}.`],
        'floater': [`${step.player} watches both tribes leave. Not noticed enough to pick, not threatening enough to target. Just... forgotten.`],
        'social-butterfly': [`${step.player}'s face crumbles. ${pr.Sub} ${pr.sub==='they'?'know':'knows'} everyone. ${pr.Sub} like${pr.sub==='they'?'':'s'} everyone. And nobody picked ${pr.obj}. That hurts differently.`],
      };
      const _defaultExileReactions = [
        `${step.player} is the last one standing. Not picked. Sent to exile. The rejection hits hard.`,
        `Both captains looked right past ${step.player}. Now ${pr.sub} walk${pr.sub==='they'?'':'s'} to exile alone, carrying nothing but a grudge.`,
        `Not chosen. ${step.player} stares at the empty space where both tribes stood. Then turns and walks toward exile.`,
      ];
      const _exileText = _seedPick(_exileReactions[arch] || _defaultExileReactions, step.player);

      html += `<div style="text-align:center;margin:14px 0;padding:16px;background:rgba(248,81,73,0.08);border:1px solid rgba(248,81,73,0.25);border-radius:10px;animation:scrollDrop 0.5s var(--ease-broadcast) both">
        ${rpPortrait(step.player, 'lg')}
        <div style="font-family:var(--font-display);font-size:16px;color:#f85149;margin-top:8px">${step.player}</div>
        <span style="font-size:10px;font-weight:700;letter-spacing:1.5px;color:#f85149;border:1px solid rgba(248,81,73,0.3);padding:3px 8px;border-radius:4px;display:inline-block;margin-top:6px">SENT TO EXILE</span>
        <div style="font-size:12px;color:#c9d1d9;line-height:1.6;font-style:italic;margin-top:10px;padding:6px 8px;background:rgba(139,148,158,0.04);border-radius:6px">${_exileText}</div>
        <div style="font-size:10px;color:#8b949e;margin-top:8px">${step.player} is headed to Exile Island.</div>
      </div>`;
    } else if (step.type === 'tribes') {
      html += `<div style="margin-top:16px;border-top:1px solid rgba(255,255,255,0.06);padding-top:14px;animation:scrollDrop 0.4s var(--ease-broadcast) both">
        <div style="font-size:11px;font-weight:700;letter-spacing:1.5px;color:#8b949e;text-align:center;margin-bottom:12px">NEW TRIBES</div>`;
      (sp.newTribes || []).forEach(t => {
        html += `<div style="margin-bottom:12px">
          <div style="font-size:14px;font-weight:700;color:#e6edf3;text-align:center;margin-bottom:6px">${t.name}</div>
          <div style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center">${t.members.map(m => rpPortrait(m, 'sm')).join('')}</div>
        </div>`;
      });
      html += `</div>`;
    }
  });

  // Reveal controls
  if (!allRevealed) {
    html += `<div style="text-align:center;margin-top:16px">
      <button class="rp-btn" onclick="${_sypReveal(state.idx + 1)}">Reveal Next</button>
      <button class="rp-btn" style="margin-left:8px;opacity:0.6" onclick="${_sypReveal(steps.length - 1)}">Reveal All</button>
    </div>`;
  }

  html += `</div>`;
  return html;
}

export function rpBuildMoleExposed(ep) {
  if (!ep.moleExposure?.length) return null;
  const exp = ep.moleExposure[0]; // first exposure this episode
  const mole = exp.mole;
  const detective = exp.exposedBy;
  const sabCount = exp.sabotageCount;
  const mp = pronouns(mole), dp = pronouns(detective);

  // Get sabotage log from snapshot
  const _moleData = (ep.gsSnapshot?.moles || gs.moles || []).find(m => m.player === mole);
  const sabLog = _moleData?.sabotageLog || [];

  // Group sabotage types for the flashback
  const _typeCounts = {};
  sabLog.forEach(s => { _typeCounts[s.type] = (_typeCounts[s.type] || 0) + 1; });
  const _typeLabels = {
    bondSabotage: 'Fabricated conflicts', challengeThrow: 'Threw challenges', challengeSabotage: 'Sabotaged challenges',
    infoLeak: 'Leaked intel', voteDisruption: 'Disrupted votes', advantageSabotage: 'Sabotaged advantages'
  };

  // Affected players — who got sabotaged most
  const _targetCounts = {};
  sabLog.forEach(s => {
    (s.targets || []).forEach(t => { _targetCounts[t] = (_targetCounts[t] || 0) + 1; });
    if (s.target) _targetCounts[s.target] = (_targetCounts[s.target] || 0) + 1;
    if (s.leakedTo) _targetCounts[s.leakedTo] = (_targetCounts[s.leakedTo] || 0) + 1;
  });
  const _topTargets = Object.entries(_targetCounts).sort((a, b) => b[1] - a[1]).slice(0, 4);

  let html = `<div class="rp-page tod-dusk">
    <div class="rp-eyebrow">Episode ${ep.num}</div>
    <div style="font-family:var(--font-display);font-size:28px;color:#f85149;text-align:center;letter-spacing:2px;text-shadow:0 0 20px rgba(248,81,73,0.4);margin-bottom:6px">THE MOLE — EXPOSED</div>
    <div style="font-size:12px;color:#8b949e;text-align:center;margin-bottom:24px">The truth comes out.</div>`;

  // ── The Confrontation ──
  html += `<div style="display:flex;justify-content:center;gap:24px;align-items:center;margin-bottom:24px">
    <div style="text-align:center">
      ${rpPortrait(detective, 'xl')}
      <div style="font-size:11px;color:#3fb950;font-weight:700;margin-top:4px;letter-spacing:1px">DETECTIVE</div>
      <div style="font-size:13px;color:#e6edf3;font-weight:600">${detective}</div>
    </div>
    <div style="font-size:32px;color:#f85149">⚡</div>
    <div style="text-align:center">
      ${rpPortrait(mole, 'xl')}
      <div style="font-size:11px;color:#f85149;font-weight:700;margin-top:4px;letter-spacing:1px">THE MOLE</div>
      <div style="font-size:13px;color:#e6edf3;font-weight:600">${mole}</div>
    </div>
  </div>`;

  // ── The Moment ──
  const _confrontTexts = [
    `${detective} has been watching for weeks. The patterns were too clear — the whispers, the convenient conflicts, the too-good-to-be-true loyalty. ${dp.Sub} ${dp.sub === 'they' ? 'pull' : 'pulls'} the tribe together. "I've been keeping track. ${mole} has been sabotaging us from the inside."`,
    `It clicks for ${detective}. Every time something went wrong at camp, ${mole} was nearby. Every leaked plan, every fabricated quote — it all traces back to one person. ${dp.Sub} ${dp.sub === 'they' ? 'don\'t' : 'doesn\'t'} wait for tribal. "${mole} is The Mole."`,
    `${detective} lays it all out. The challenge throws. The leaked intel. The fabricated conflicts. Every sabotage act ${mole} thought was invisible — ${detective} was watching. The tribe goes silent. ${mole} has nowhere to hide.`,
  ];
  html += `<div style="padding:16px;background:rgba(248,81,73,0.04);border:1px solid rgba(248,81,73,0.2);border-radius:10px;margin-bottom:20px">
    <div style="font-size:13px;color:#e6edf3;line-height:1.7;font-style:italic">"${_confrontTexts[Math.floor(Math.random() * _confrontTexts.length)]}"</div>
  </div>`;

  // ── The Evidence — Sabotage Flashback ──
  html += `<div style="margin-bottom:20px">
    <div style="font-size:10px;font-weight:800;letter-spacing:2px;color:#f0883e;margin-bottom:10px;text-align:center">WHAT ${mole.toUpperCase()} DID — ${sabCount} ACTS OF SABOTAGE</div>
    <div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-bottom:12px">`;
  Object.entries(_typeCounts).forEach(([type, count]) => {
    const label = _typeLabels[type] || type;
    html += `<div style="padding:6px 12px;background:rgba(248,81,73,0.08);border:1px solid rgba(248,81,73,0.2);border-radius:6px;text-align:center">
      <div style="font-size:16px;font-weight:700;color:#f85149">${count}</div>
      <div style="font-size:9px;color:#8b949e;letter-spacing:0.5px">${label}</div>
    </div>`;
  });
  html += `</div>`;

  // Most affected players
  if (_topTargets.length) {
    html += `<div style="font-size:9px;font-weight:700;letter-spacing:1.5px;color:#8b949e;text-align:center;margin-bottom:6px">MOST AFFECTED</div>
      <div style="display:flex;justify-content:center;gap:12px;flex-wrap:wrap">`;
    _topTargets.forEach(([name, count]) => {
      html += `<div style="display:flex;align-items:center;gap:4px">
        ${rpPortrait(name, 'sm')}
        <div style="font-size:11px;color:#e6edf3">${name} <span style="color:#f85149">(${count}x)</span></div>
      </div>`;
    });
    html += `</div>`;
  }
  html += `</div>`;

  // ── Sabotage Timeline — key moments ──
  const _keyMoments = sabLog.slice(-6); // last 6 acts
  if (_keyMoments.length) {
    html += `<div style="margin-bottom:20px">
      <div style="font-size:10px;font-weight:800;letter-spacing:2px;color:#f0883e;margin-bottom:8px;text-align:center">SABOTAGE TIMELINE</div>`;
    _keyMoments.forEach(s => {
      const _label = _typeLabels[s.type] || s.type;
      const _detail = s.targets ? `${s.targets.join(' vs ')}` : s.target ? `→ ${s.target}` : s.leakedTo ? `leaked to ${s.leakedTo}` : '';
      html += `<div style="display:flex;align-items:center;gap:8px;padding:4px 8px;border-bottom:1px solid rgba(255,255,255,0.04)">
        <span style="font-size:10px;color:#484f58;width:36px">Ep ${s.ep}</span>
        <span style="font-size:10px;color:#f85149;font-weight:600;flex:1">${_label}</span>
        <span style="font-size:10px;color:#8b949e">${_detail}</span>
      </div>`;
    });
    html += `</div>`;
  }

  // ── The Tribe Reacts ──
  html += `<div style="padding:14px;background:rgba(139,148,158,0.04);border:1px solid rgba(139,148,158,0.1);border-radius:10px;margin-bottom:20px">
    <div style="font-size:10px;font-weight:800;letter-spacing:2px;color:#d29922;margin-bottom:8px;text-align:center">CONSEQUENCES</div>
    <div style="display:flex;flex-wrap:wrap;gap:10px;justify-content:center">
      <div style="padding:6px 12px;background:rgba(248,81,73,0.08);border-radius:6px;text-align:center">
        <div style="font-size:9px;color:#f85149;font-weight:700;letter-spacing:1px">TRUST SHATTERED</div>
        <div style="font-size:11px;color:#e6edf3">-1.5 bond with everyone</div>
      </div>
      <div style="padding:6px 12px;background:rgba(248,81,73,0.08);border-radius:6px;text-align:center">
        <div style="font-size:9px;color:#f85149;font-weight:700;letter-spacing:1px">MASSIVE TARGET</div>
        <div style="font-size:11px;color:#e6edf3">+3.0 heat for 2 episodes</div>
      </div>
      <div style="padding:6px 12px;background:rgba(240,136,62,0.08);border-radius:6px;text-align:center">
        <div style="font-size:9px;color:#f0883e;font-weight:700;letter-spacing:1px">ADVANTAGES REVEALED</div>
        <div style="font-size:11px;color:#e6edf3">Everyone knows what ${mp.sub} ${mp.sub === 'they' ? 'have' : 'has'}</div>
      </div>
      <div style="padding:6px 12px;background:rgba(139,148,158,0.08);border-radius:6px;text-align:center">
        <div style="font-size:9px;color:#8b949e;font-weight:700;letter-spacing:1px">STEALTH GONE</div>
        <div style="font-size:11px;color:#e6edf3">No more sabotage powers</div>
      </div>
    </div>
  </div>`;

  // ── The Mole's Response ──
  const _responseTexts = [
    `${mole} doesn't deny it. ${mp.Sub} ${mp.sub === 'they' ? 'sit' : 'sits'} there and ${mp.sub === 'they' ? 'take' : 'takes'} it. When ${mp.sub} finally ${mp.sub === 'they' ? 'speak' : 'speaks'}, it's just one sentence: "I played my game."`,
    `${mole} tries to explain. The tribe isn't listening. The damage is done — and everyone at camp is doing the math on how many times they were played.`,
    `The silence after ${detective}'s accusation is the loudest thing that's happened all season. ${mole} looks around the camp. Nobody will meet ${mp.posAdj} eyes.`,
    `${mole} laughs. Not because it's funny — because it's over. "You got me," ${mp.sub} ${mp.sub === 'they' ? 'say' : 'says'}. "Now what?"`,
  ];
  html += `<div style="padding:12px;background:rgba(139,148,158,0.03);border-radius:8px;text-align:center">
    <div style="font-size:12px;color:#e6edf3;line-height:1.6;font-style:italic">${_responseTexts[Math.floor(Math.random() * _responseTexts.length)]}</div>
  </div>`;

  html += `</div>`;
  return html;
}

// ══════════════════════════════════════════════════════════════════════════════
// AFTERMATH SHOW — VP Screens
// ══════════════════════════════════════════════════════════════════════════════
export function rpBuildFanVoteReturn(ep) {
  if (!ep.fanVoteReturnee) return null;
  const returnee = ep.fanVoteReturnee;
  const rPr = pronouns(returnee);
  const rS = pStats(returnee);
  const arch = rS.archetype || '';
  // Find which episode they were eliminated
  const _elimEp = gs.episodeHistory?.find(h => h.eliminated === returnee || h.firstEliminated === returnee || h.ambassadorData?.ambassadorEliminated === returnee);
  const _elimEpNum = _elimEp?.num || '?';
  const _daysOut = ep.num - _elimEpNum;

  let html = `<div class="rp-page tod-studio">
    <div class="aftermath-live">LIVE</div>
    <div class="aftermath-title" style="font-size:28px;text-align:center;margin:20px 0 8px">THE FANS HAVE SPOKEN</div>
    <div style="font-size:12px;color:#8b949e;text-align:center;margin-bottom:24px">A player returns to the game.</div>`;

  // Dramatic build-up
  html += `<div class="aftermath-card-gold" style="text-align:center;margin-bottom:16px">
    <div style="font-size:13px;color:#f5f0e8;line-height:1.6;font-style:italic;margin-bottom:12px">
      "Last night, the fans voted. Millions of votes were cast. One eliminated player earned the right to return to this game."
    </div>
    <div style="font-size:11px;color:#8b949e">${seasonConfig.host || 'Chris'} pauses. The tribe holds its breath.</div>
  </div>`;

  // The reveal
  html += `<div style="text-align:center;margin:24px 0;animation:slideInLeft 0.6s both">
    ${rpPortrait(returnee, 'xl')}
    <div style="font-family:var(--font-display);font-size:26px;color:#f59e0b;margin-top:10px;text-shadow:0 0 16px rgba(245,158,11,0.4)">${returnee}</div>
    <div style="font-size:12px;color:#8b949e;margin-top:4px">${vpArchLabel(returnee)} — Eliminated Episode ${_elimEpNum}</div>
    <div style="margin-top:8px"><span style="font-size:11px;font-weight:700;letter-spacing:2px;color:#0d1117;background:#f59e0b;padding:4px 14px;border-radius:4px">RETURNS TO THE GAME</span></div>
  </div>`;

  // Returnee quote
  const _returnQuote = arch === 'villain' || arch === 'schemer'
    ? `"They thought they got rid of me. ${_daysOut} days later, I'm back. And I remember every name that wrote mine down."`
    : arch === 'hero'
    ? `"The fans believed in me. That means more than any immunity necklace. I'm back — and this time, I'm playing for them."`
    : arch === 'hothead'
    ? `"I've been sitting at home watching these people make mistake after mistake. Now I get to do something about it. Let's GO."`
    : arch === 'challenge-beast'
    ? `"${_daysOut} days away from this game and I'm hungrier than ever. I've been training. They're not ready for what I'm bringing back."`
    : `"Unfinished business. That's what this is. I left things out there that I need to finish. The fans gave me that chance — I'm not wasting it."`;

  html += `<div style="padding:14px;background:rgba(245,158,11,0.04);border:1px solid rgba(245,158,11,0.2);border-radius:10px;text-align:center;margin-top:16px">
    <div style="font-size:10px;color:#f59e0b;font-weight:700;margin-bottom:4px">${returnee}</div>
    <div style="font-size:14px;color:#f5f0e8;line-height:1.7;font-style:italic">${_returnQuote}</div>
  </div>`;

  // Tribe reaction
  const _bestAlly = gs.activePlayers.filter(p => p !== returnee).sort((a, b) => getBond(returnee, b) - getBond(returnee, a))[0];
  const _worstEnemy = gs.activePlayers.filter(p => p !== returnee).sort((a, b) => getBond(returnee, a) - getBond(returnee, b))[0];
  html += `<div style="margin-top:16px">
    <div style="font-size:9px;font-weight:700;letter-spacing:2px;color:#8b949e;text-align:center;margin-bottom:8px">TRIBE REACTS</div>`;
  if (_bestAlly && getBond(returnee, _bestAlly) >= 2) {
    html += `<div style="display:flex;align-items:center;gap:8px;padding:8px;margin-bottom:4px;background:rgba(16,185,129,0.04);border:1px solid rgba(16,185,129,0.15);border-radius:6px">
      ${rpPortrait(_bestAlly, 'sm')}
      <div><div style="font-size:10px;color:#10b981;font-weight:700">${_bestAlly}</div>
      <div style="font-size:12px;color:#f5f0e8">"${returnee} is back. I've never been happier to see someone walk into camp."</div></div>
    </div>`;
  }
  if (_worstEnemy && getBond(returnee, _worstEnemy) <= -2) {
    html += `<div style="display:flex;align-items:center;gap:8px;padding:8px;margin-bottom:4px;background:rgba(239,68,68,0.04);border:1px solid rgba(239,68,68,0.15);border-radius:6px">
      ${rpPortrait(_worstEnemy, 'sm')}
      <div><div style="font-size:10px;color:#ef4444;font-weight:700">${_worstEnemy}</div>
      <div style="font-size:12px;color:#f5f0e8">"You're kidding me. ${returnee}? Of all people? This changes everything — and not in a good way."</div></div>
    </div>`;
  }
  html += `</div>`;

  html += `</div>`;
  return html;
}


export function rpBuildDebug(ep) {
  const snap = ep.gsSnapshot || {};
  const activePlayers = snap.activePlayers || gs.activePlayers || [];
  const _pb = snap.perceivedBonds || gs.perceivedBonds || {};
  const _chalRec = gs.chalRecord || {};
  const allEps = gs.episodeHistory || [];
  const _viewEps = allEps.filter(e => e.num <= ep.num);

  // Tab state
  const _dbTab = localStorage.getItem('vp_debug_tab') || 'episode';
  const _tabBtn = (id, label) => `<button onclick="localStorage.setItem('vp_debug_tab','${id}');const ep=gs.episodeHistory.find(e=>e.num===${ep.num});if(ep){buildVPScreens(ep);renderVPScreen();}" style="padding:4px 12px;font-size:11px;font-weight:600;border:1px solid ${_dbTab===id ? '#f0883e' : 'rgba(255,255,255,0.1)'};border-radius:4px;background:${_dbTab===id ? 'rgba(240,136,62,0.15)' : 'transparent'};color:${_dbTab===id ? '#f0883e' : '#8b949e'};cursor:pointer">${label}</button>`;

  // Episode nav helper — always jump to the debug screen after rebuild
  const _dbEpNav = (targetEp) => `const ep=gs.episodeHistory.find(e=>e.num===${targetEp});if(ep){buildVPScreens(ep);const di=vpScreens.findIndex(s=>s.id==='debug');if(di>=0)vpCurrentScreen=di;renderVPScreen();}`;
  const _maxEp = allEps.length ? allEps[allEps.length - 1].num : ep.num;

  let html = `<div class="rp-page tod-morning" style="font-size:12px">
    <div class="rp-eyebrow">Episode ${ep.num}</div>
    <div style="font-family:var(--font-display);font-size:22px;color:#f0883e;text-align:center;margin-bottom:8px">DEBUG DATA</div>
    <div style="display:flex;align-items:center;justify-content:center;gap:8px;margin-bottom:12px">
      <button onclick="${_dbEpNav(Math.max(1, ep.num - 1))}" style="padding:3px 10px;font-size:11px;border:1px solid rgba(255,255,255,0.1);border-radius:4px;background:transparent;color:${ep.num <= 1 ? '#484f58' : '#8b949e'};cursor:pointer" ${ep.num <= 1 ? 'disabled' : ''}>\u25C0 Ep ${Math.max(1, ep.num - 1)}</button>
      <div style="display:flex;gap:3px;flex-wrap:wrap;justify-content:center">${allEps.map(e => `<button onclick="${_dbEpNav(e.num)}" style="width:24px;height:24px;font-size:10px;border:1px solid ${e.num === ep.num ? '#f0883e' : 'rgba(255,255,255,0.08)'};border-radius:4px;background:${e.num === ep.num ? 'rgba(240,136,62,0.2)' : 'transparent'};color:${e.num === ep.num ? '#f0883e' : '#6e7681'};cursor:pointer">${e.num}</button>`).join('')}</div>
      <button onclick="${_dbEpNav(Math.min(_maxEp, ep.num + 1))}" style="padding:3px 10px;font-size:11px;border:1px solid rgba(255,255,255,0.1);border-radius:4px;background:transparent;color:${ep.num >= _maxEp ? '#484f58' : '#8b949e'};cursor:pointer" ${ep.num >= _maxEp ? 'disabled' : ''}>Ep ${Math.min(_maxEp, ep.num + 1)} \u25B6</button>
    </div>
    <div style="display:flex;gap:6px;justify-content:center;flex-wrap:wrap;margin-bottom:16px">
      ${_tabBtn('episode', 'This Episode')}
      ${_tabBtn('threats', 'Threats & Heat')}
      ${_tabBtn('stats', 'Player Stats')}
      ${_tabBtn('bonds', 'Perceived Bonds')}
      ${_tabBtn('history', 'Hidden Moves')}
      ${gs.moles?.length ? _tabBtn('mole', 'The Mole') : ''}
      ${(gs.showmances?.length || gs.loveTriangles?.length || gs.affairs?.length) ? _tabBtn('romance', 'Romance') : ''}
      ${(ep.chalMemberScores || ep.isDodgebrawl || ep.isCliffDive || ep.isAwakeAThon || ep.isPhobiaFactor || ep.isSayUncle || ep.isTripleDogDare || ep.isTalentShow || ep.isSuckyOutdoors || ep.isUpTheCreek || ep.isPaintballHunt || ep.isHellsKitchen || ep.isTrustChallenge || ep.isBasicStraining || ep.isXtremeTorture || ep.isLuckyHunt || ep.isHideAndBeSneaky || ep.isOffTheChain || ep.isWawanakwaGoneWild) ? _tabBtn('challenge', 'Challenge') : ''}
    </div>`;

  // ════════════════════════════════════════════════
  // TAB: THIS EPISODE
  // ════════════════════════════════════════════════
  if (_dbTab === 'episode') {
    // Eliminated
    const _eliminated = ep.eliminated || ep.eliminatedPlayers || null;
    if (_eliminated) {
      const _elimNames = Array.isArray(_eliminated) ? _eliminated : [_eliminated];
      html += `<div style="margin-bottom:16px;padding:10px;background:rgba(244,112,103,0.08);border:1px solid rgba(244,112,103,0.2);border-radius:8px">
        <div style="font-size:11px;font-weight:800;letter-spacing:1.5px;color:#f47067;margin-bottom:6px">ELIMINATED</div>`;
      _elimNames.filter(n => n && n !== 'No elimination').forEach(name => {
        const ts = threatScore(name);
        const votes = ep.votes?.[name] || 0;
        html += `<div style="display:flex;align-items:center;gap:8px;padding:4px 0">
          ${rpPortrait(name, 'sm')}
          <div style="flex:1;color:#e6edf3;font-weight:600">${name}</div>
          <div style="color:#f47067;font-size:11px">${votes} votes</div>
          <div style="color:#f0883e;font-size:11px">threat ${ts.toFixed(1)}</div>
          <div style="color:#8b949e;font-size:10px">${players.find(p => p.name === name)?.archetype || ''}</div>
        </div>`;
      });
      html += `</div>`;
    }
    // Advantages
    const advs = snap.advantages || gs.advantages || [];
    const activeAdvs = advs.filter(a => activePlayers.includes(a.holder));
    if (activeAdvs.length) {
      html += `<div style="margin-bottom:16px">
        <div style="font-size:11px;font-weight:800;letter-spacing:1.5px;color:#8b949e;margin-bottom:8px">ADVANTAGES</div>`;
      activeAdvs.forEach(a => {
        html += `<div style="display:flex;align-items:center;gap:8px;padding:4px 8px;border-bottom:1px solid rgba(255,255,255,0.04)">
          ${rpPortrait(a.holder, 'sm')}
          <div style="flex:1;color:#e6edf3">${a.holder}</div>
          <div style="color:#d29922;font-size:11px;font-weight:600">${a.type}${a.superIdol ? ' (Super)' : ''}${a.fake ? ' (FAKE)' : ''}</div>
          <div style="color:#6e7681;font-size:10px">ep.${a.foundEp || '?'}</div>
        </div>`;
      });
      html += `</div>`;
    }
    // Trigger Log
    const _trigLog = ep._pbTriggerLog || [];
    if (_trigLog.length) {
      html += `<div style="margin-bottom:16px;padding:10px;background:rgba(227,179,65,0.06);border:1px solid rgba(227,179,65,0.15);border-radius:8px">
        <div style="font-size:11px;font-weight:800;letter-spacing:1.5px;color:#d29922;margin-bottom:6px">TRIGGER LOG (${_trigLog.length})</div>`;
      _trigLog.forEach(log => { html += `<div style="font-size:10px;color:#8b949e;padding:2px 0">${log}</div>`; });
      html += `</div>`;
    }
    // Politics Log
    const _polLog = ep._politicsLog || [];
    if (_polLog.length) {
      html += `<div style="margin-bottom:16px;padding:10px;background:rgba(99,102,241,0.06);border:1px solid rgba(99,102,241,0.15);border-radius:8px">
        <div style="font-size:11px;font-weight:800;letter-spacing:1.5px;color:#6366f1;margin-bottom:6px">SOCIAL POLITICS (${_polLog.length})</div>`;
      _polLog.forEach(log => { html += `<div style="font-size:10px;color:#8b949e;padding:2px 0">${log}</div>`; });
      html += `</div>`;
    }
    // Active Side Deals
    const _activeDeals = (gs.sideDeals || []).filter(d => d.active);
    if (_activeDeals.length) {
      html += `<div style="margin-bottom:16px">
        <div style="font-size:11px;font-weight:800;letter-spacing:1.5px;color:#8b949e;margin-bottom:6px">ACTIVE SIDE DEALS (${_activeDeals.length})</div>`;
      _activeDeals.forEach(d => {
        html += `<div style="padding:3px 8px;font-size:11px;border-bottom:1px solid rgba(255,255,255,0.04)">
          <span style="color:#e6edf3;font-weight:600">${d.players.join(' + ')}</span>
          <span style="color:#8b949e">${d.type.toUpperCase()} · ep ${d.madeEp}</span>
          <span style="color:${d.genuine ? '#3fb950' : '#f47067'}">${d.genuine ? 'genuine' : 'fake'}</span>
        </div>`;
      });
      html += `</div>`;
    }
    // Active False Info Plants
    const _falsePlants = (gs._falseInfoPlanted || []).filter(p => gs.activePlayers.includes(p.liar) && gs.activePlayers.includes(p.victim));
    if (_falsePlants.length) {
      html += `<div style="margin-bottom:16px">
        <div style="font-size:11px;font-weight:800;letter-spacing:1.5px;color:#f47067;margin-bottom:6px">ACTIVE FALSE INFO (${_falsePlants.length})</div>`;
      _falsePlants.forEach(p => {
        html += `<div style="padding:3px 8px;font-size:11px;border-bottom:1px solid rgba(255,255,255,0.04)">
          <span style="color:#f47067;font-weight:600">${p.liar}</span>
          <span style="color:#8b949e">told</span>
          <span style="color:#e6edf3">${p.victim}</span>
          <span style="color:#8b949e">that</span>
          <span style="color:#d29922">${p.fakeHolder}</span>
          <span style="color:#8b949e">has an idol (FALSE · ep ${p.plantedEp})</span>
        </div>`;
      });
      html += `</div>`;
    }
    // Pending Loyalty Tests
    const _pendingTests = (gs.loyaltyTests || []).filter(t => !t.resolved && gs.activePlayers.includes(t.tester) && gs.activePlayers.includes(t.target));
    if (_pendingTests.length) {
      html += `<div style="margin-bottom:16px">
        <div style="font-size:11px;font-weight:800;letter-spacing:1.5px;color:#d29922;margin-bottom:6px">PENDING LOYALTY TESTS (${_pendingTests.length})</div>`;
      _pendingTests.forEach(t => {
        const epsWaiting = ((gs.episode || 0) + 1) - t.plantedEp;
        html += `<div style="padding:3px 8px;font-size:11px;border-bottom:1px solid rgba(255,255,255,0.04)">
          <span style="color:#e6edf3;font-weight:600">${t.tester}</span>
          <span style="color:#8b949e">testing</span>
          <span style="color:#d29922">${t.target}</span>
          <span style="color:#8b949e">· planted ep ${t.plantedEp} · waiting ${epsWaiting} ep${epsWaiting !== 1 ? 's' : ''}</span>
        </div>`;
      });
      html += `</div>`;
    }
  }

  // ════════════════════════════════════════════════
  // TAB: THREATS & HEAT
  // ════════════════════════════════════════════════
  if (_dbTab === 'threats') {
    // Use the episode's snapshot so threat/heat reflects THAT episode, not current state
    const _savedGs = gs;
    const _snap = ep.gsSnapshot;
    if (_snap) { gs = _snap; if (typeof repairGsSets === 'function') repairGsSets(gs); }

    // Include eliminated player for this episode
    const _elimName = ep.eliminated && ep.eliminated !== 'No elimination' ? (Array.isArray(ep.eliminated) ? ep.eliminated : [ep.eliminated]) : [];
    const _snapActive = _snap?.activePlayers || activePlayers;
    const _allPlayers = [..._snapActive, ..._elimName.filter(n => n && !_snapActive.includes(n))];

    // Threat scores — from snapshot state
    html += `<div style="margin-bottom:20px">
      <div style="font-size:11px;font-weight:800;letter-spacing:1.5px;color:#8b949e;margin-bottom:8px">THREAT SCORES (Episode ${ep.num})</div>`;
    const _igThreatTier = (s) => s <= 1.0 ? { label: 'Low', color: '#10b981' } : s <= 2.0 ? { label: 'Medium', color: '#f59e0b' } : s <= 3.0 ? { label: 'High', color: '#f97316' } : { label: 'Extreme', color: '#ef4444' };
    const _snapChalRec = _snap?.chalRecord || _chalRec || {};
    _allPlayers.map(name => {
      const td = threatScore(name, true);
      const rec = _snapChalRec[name] || { wins: 0, podiums: 0, bombs: 0 };
      const isElim = _elimName.includes(name);
      return { name, td, rec, tier: _igThreatTier(td.total), isElim };
    }).sort((a, b) => b.td.total - a.td.total).forEach(({ name, td, rec, tier, isElim }) => {
      html += `<div style="display:flex;align-items:center;gap:6px;padding:4px 8px;border-bottom:1px solid rgba(255,255,255,0.04);${isElim ? 'opacity:0.5;background:rgba(244,112,103,0.06)' : ''}">
        ${rpPortrait(name, 'sm')}
        <div style="flex:1;font-weight:600;color:#e6edf3">${name}${isElim ? ' <span style="color:#f47067;font-size:9px">ELIMINATED</span>' : ''}</div>
        <div style="width:50px;text-align:right"><span style="color:${tier.color};font-weight:700">${td.total.toFixed(1)}</span></div>
        <div style="width:65px;text-align:right;color:#8b949e;font-size:10px">${tier.label}</div>
        <div style="width:145px;text-align:right;font-size:9px">
          <span style="color:#f97316;cursor:help" title="Challenge Threat: podiums, wins, bombs + physical/endurance/mental/intuition stats (fades as record grows)">⚔${td.challenge.toFixed(1)}</span>
          <span style="color:#38bdf8;cursor:help" title="Social Threat: avg bond with all players, friends (bond≥3), showmance/spark + social stat">♥${td.social.toFixed(1)}</span>
          <span style="color:#a78bfa;cursor:help" title="Strategic Threat: alliance sizes, side deals, idol/advantage held + strategic stat">★${td.strategic.toFixed(1)}</span>
        </div>
        <div style="width:100px;text-align:right;color:#6e7681;font-size:9px">${rec.wins}W · ${rec.podiums}P · ${rec.bombs}B</div>
      </div>`;
    });
    html += `</div>`;
    // Heat — from snapshot state
    html += `<div style="margin-bottom:20px">
      <div style="font-size:11px;font-weight:800;letter-spacing:1.5px;color:#8b949e;margin-bottom:8px">ESTIMATED HEAT (Episode ${ep.num})</div>`;
    const _pfBlame = ep.phobiaFactor ? Object.fromEntries(
      Object.entries(ep.phobiaFactor.results || {}).filter(([, r]) => r === 'fail')
        .filter(([p]) => ep.phobiaFactor.losingTribe && (ep.tribesAtStart || gs.tribes || []).find(t => t.name === ep.phobiaFactor.losingTribe)?.members?.includes(p))
        .map(([p]) => [p, 2.0 / Object.entries(ep.phobiaFactor.results).filter(([pp, r]) => r === 'fail' && (ep.tribesAtStart || gs.tribes || []).find(t => t.name === ep.phobiaFactor.losingTribe)?.members?.includes(pp)).length])
    ) : {};
    _allPlayers.map(name => {
      const isElim = _elimName.includes(name);
      const heat = computeHeat(name, _allPlayers, (gs.namedAlliances || []));
      const blame = _pfBlame[name] || 0;
      return { name, heat, isElim, blame };
    }).sort((a, b) => b.heat - a.heat).forEach(({ name, heat, isElim, blame }) => {
      const pct = Math.min(100, Math.max(0, heat * 10));
      const col = heat >= 5 ? '#f47067' : heat >= 3 ? '#f0883e' : heat >= 1 ? '#d29922' : '#3fb950';
      const blameTag = blame > 0 ? ` <span style="color:#f47067;font-size:9px;font-weight:700">+${blame.toFixed(1)} BLAME</span>` : '';
      html += `<div style="display:flex;align-items:center;gap:8px;padding:4px 8px;border-bottom:1px solid rgba(255,255,255,0.04);${isElim ? 'opacity:0.5;background:rgba(244,112,103,0.06)' : ''}">
        ${rpPortrait(name, 'sm')}
        <div style="flex:1;font-weight:600;color:#e6edf3">${name}${isElim ? ' <span style="color:#f47067;font-size:9px">ELIM</span>' : ''}${blameTag}</div>
        <div style="width:120px;background:rgba(255,255,255,0.05);border-radius:4px;height:8px;overflow:hidden">
          <div style="width:${pct}%;height:100%;background:${col};border-radius:4px"></div>
        </div>
        <div style="width:40px;text-align:right;color:${col};font-weight:700;font-size:11px">${heat.toFixed(1)}</div>
      </div>`;
      });
      html += `</div>`;
    // Restore gs after snapshot-based computation
    if (_snap) gs = _savedGs;
  }

  // ════════════════════════════════════════════════
  // TAB: PLAYER STATS
  // ════════════════════════════════════════════════
  if (_dbTab === 'stats') {
    // Use snapshot for threat column so it reflects this episode
    const _statsSavedGs = gs;
    const _statsSnap = ep.gsSnapshot;
    if (_statsSnap) { gs = _statsSnap; if (typeof repairGsSets === 'function') repairGsSets(gs); }

    html += `<div style="overflow-x:auto">
    <table style="width:100%;border-collapse:collapse;font-size:10px;color:#8b949e">
      <tr style="border-bottom:1px solid rgba(255,255,255,0.08)">
        <th style="text-align:left;padding:4px;color:#e6edf3">Player</th>
        <th style="padding:4px">PHY</th><th style="padding:4px">END</th><th style="padding:4px">MNT</th>
        <th style="padding:4px">SOC</th><th style="padding:4px">STR</th><th style="padding:4px">LOY</th>
        <th style="padding:4px">BLD</th><th style="padding:4px">INT</th><th style="padding:4px">TMP</th>
        <th style="padding:4px;color:#f0883e">Threat</th>
        <th style="padding:4px">State</th>
      </tr>`;
    activePlayers.forEach(name => {
      const s = pStats(name);
      const ts = threatScore(name);
      const state = snap.playerStates?.[name]?.emotional || gs.playerStates?.[name]?.emotional || 'content';
      const stateCol = state === 'desperate' ? '#f47067' : state === 'paranoid' ? '#f0883e' : state === 'uneasy' ? '#d29922' : '#8b949e';
      const sc = v => v >= 8 ? '#3fb950' : v >= 6 ? '#e6edf3' : v <= 3 ? '#f47067' : '#8b949e';
      html += `<tr style="border-bottom:1px solid rgba(255,255,255,0.04)">
        <td style="padding:4px;color:#e6edf3;font-weight:600">${name}</td>
        <td style="padding:4px;text-align:center;color:${sc(s.physical)}">${s.physical}</td>
        <td style="padding:4px;text-align:center;color:${sc(s.endurance)}">${s.endurance}</td>
        <td style="padding:4px;text-align:center;color:${sc(s.mental)}">${s.mental}</td>
        <td style="padding:4px;text-align:center;color:${sc(s.social)}">${s.social}</td>
        <td style="padding:4px;text-align:center;color:${sc(s.strategic)}">${s.strategic}</td>
        <td style="padding:4px;text-align:center;color:${sc(s.loyalty)}">${s.loyalty}</td>
        <td style="padding:4px;text-align:center;color:${sc(s.boldness)}">${s.boldness}</td>
        <td style="padding:4px;text-align:center;color:${sc(s.intuition)}">${s.intuition}</td>
        <td style="padding:4px;text-align:center;color:${sc(s.temperament)}">${s.temperament}</td>
        <td style="padding:4px;text-align:center;color:#f0883e;font-weight:700">${ts.toFixed(1)}</td>
        <td style="padding:4px;text-align:center;color:${stateCol};font-size:9px">${state}</td>
      </tr>`;
    });
    html += `</table></div>`;
    if (_statsSnap) gs = _statsSavedGs;
  }

  // ════════════════════════════════════════════════
  // TAB: PERCEIVED BONDS
  // ════════════════════════════════════════════════
  if (_dbTab === 'bonds') {
    // Current gaps
    const pbEntries = Object.entries(_pb);
    html += `<div style="margin-bottom:20px">
      <div style="font-size:11px;font-weight:800;letter-spacing:1.5px;color:#8b949e;margin-bottom:8px">ACTIVE GAPS (${pbEntries.length})</div>`;
    if (pbEntries.length) {
      pbEntries.forEach(([key, entry]) => {
        const [from, to] = key.split('\u2192');
        const realBond = getBond(from, to);
        const gap = entry.perceived - realBond;
        const gapCol = gap > 0 ? '#3fb950' : '#f47067';
        html += `<div style="display:flex;align-items:center;gap:8px;padding:4px 8px;border-bottom:1px solid rgba(255,255,255,0.04)">
          <div style="flex:1;color:#e6edf3;font-size:11px"><strong>${from}</strong> \u2192 ${to}</div>
          <div style="color:#8b949e;font-size:10px">${entry.reason}</div>
          <div style="font-size:11px"><span style="color:#8b949e">real:</span> <span style="color:#e6edf3">${realBond.toFixed(1)}</span></div>
          <div style="font-size:11px"><span style="color:#8b949e">thinks:</span> <span style="color:${gapCol}">${entry.perceived.toFixed(1)}</span></div>
          <div style="font-size:10px;color:${gapCol}">${gap > 0 ? '+' : ''}${gap.toFixed(1)}</div>
        </div>`;
      });
    } else {
      html += `<div style="color:#484f58;font-size:11px">No gaps active this episode.</div>`;
    }
    html += `</div>`;
    // Season history
    const _allPBGaps = _viewEps.flatMap(e => {
      const pb = e.gsSnapshot?.perceivedBonds || {};
      return Object.entries(pb).map(([key, data]) => ({ ep: e.num, key, ...data }));
    });
    if (_allPBGaps.length) {
      html += `<div style="margin-bottom:20px">
        <div style="font-size:11px;font-weight:800;letter-spacing:1.5px;color:#d29922;margin-bottom:8px">BOND HISTORY (${_allPBGaps.length} total across season)</div>`;
      const _byKey = {};
      _allPBGaps.forEach(g => { if (!_byKey[g.key]) _byKey[g.key] = []; _byKey[g.key].push(g); });
      Object.entries(_byKey).forEach(([key, entries]) => {
        const latest = entries[entries.length - 1];
        const [from, to] = key.split('\u2192');
        const epRange = entries.length === 1 ? `Ep ${entries[0].ep}` : `Ep ${entries[0].ep}\u2013${entries[entries.length-1].ep}`;
        html += `<div style="padding:3px 8px;font-size:11px;border-bottom:1px solid rgba(255,255,255,0.04)">
          <span style="color:#8b949e">${epRange}:</span>
          <span style="color:#e6edf3;font-weight:600">${from}</span>\u2192${to}
          <span style="color:#d29922">${latest.reason}</span>
          <span style="color:#8b949e">perceived: ${latest.perceived?.toFixed(1) || '?'}</span>
        </div>`;
      });
      html += `</div>`;
    }
  }

  // ════════════════════════════════════════════════
  // TAB: HIDDEN MOVES (per-episode throws/scramble/shield)
  // ════════════════════════════════════════════════
  if (_dbTab === 'history') {
    // Challenge Throws — this episode only
    const _epThrows = ep.challengeThrows || [];
    html += `<div style="margin-bottom:20px">
      <div style="font-size:11px;font-weight:800;letter-spacing:1.5px;color:#f47067;margin-bottom:8px">CHALLENGE THROWS</div>`;
    if (_epThrows.length) {
      _epThrows.forEach(ct => {
        html += `<div style="padding:3px 8px;font-size:11px;border-bottom:1px solid rgba(255,255,255,0.04)">
          <span style="color:#e6edf3;font-weight:600">${ct.thrower}</span>
          <span style="color:${ct.caught ? '#f47067' : '#3fb950'}">${ct.caught ? 'CAUGHT by ' + (ct.detectedBy||[]).join(', ') : 'undetected'}</span>
        </div>`;
      });
    } else { html += `<div style="color:#484f58;font-size:11px">No throws this episode.</div>`; }
    html += `</div>`;

    // Scramble — this episode only
    const _epScr = ep._debugScramble || gs._scrambleActivations || null;
    html += `<div style="margin-bottom:20px">
      <div style="font-size:11px;font-weight:800;letter-spacing:1.5px;color:#d29922;margin-bottom:8px">SCRAMBLE</div>`;
    if (_epScr && Object.keys(_epScr).length) {
      Object.entries(_epScr).forEach(([name, power]) => {
        html += `<div style="padding:3px 8px;font-size:11px;border-bottom:1px solid rgba(255,255,255,0.04)">
          <span style="color:#e6edf3;font-weight:600">${name}</span>
          <span style="color:#d29922">\u2212${(typeof power === 'number' ? power : 0).toFixed(2)} heat</span>
        </div>`;
      });
    } else { html += `<div style="color:#484f58;font-size:11px">No scrambles this episode.</div>`; }
    html += `</div>`;

    // Vote Pitches — this episode
    const _epPitches = ep.votePitches || [];
    html += `<div style="margin-bottom:20px">
      <div style="font-size:11px;font-weight:800;letter-spacing:1.5px;color:#6366f1;margin-bottom:8px">VOTE PITCHES</div>`;
    if (_epPitches.length) {
      _epPitches.forEach(p => {
        const col = p.success ? '#3fb950' : '#f47067';
        html += `<div style="padding:3px 8px;font-size:11px;border-bottom:1px solid rgba(255,255,255,0.04)">
          <span style="color:#e6edf3;font-weight:600">${p.pitcher}</span>
          pitched <span style="color:#8b949e">${p.pitchTarget}</span>
          (was: ${p.originalTarget || 'none'})
          <span style="color:${col}">${p.success ? 'flipped ' + p.flipped.join(', ') : 'failed'}</span>
        </div>`;
      });
    } else { html += `<div style="color:#484f58;font-size:11px">No vote pitches this episode.</div>`; }
    html += `</div>`;

    // Social Politics — this episode
    const _epPol = ep._politicsLog || [];
    if (_epPol.length) {
      html += `<div style="margin-bottom:20px">
        <div style="font-size:11px;font-weight:800;letter-spacing:1.5px;color:#6366f1;margin-bottom:8px">SOCIAL POLITICS</div>`;
      _epPol.forEach(log => {
        html += `<div style="padding:3px 8px;font-size:10px;color:#8b949e;border-bottom:1px solid rgba(255,255,255,0.04)">${log}</div>`;
      });
      html += `</div>`;
    }

    // Volunteer Exile Duel
    if (ep.volunteerDuel) {
      const vd = ep.volunteerDuel;
      const _resultText = vd.duelResult === 'won' ? 'WON — returned with grudge bonus' : vd.duelResult === 'lost' ? 'LOST — permanently eliminated' : vd.granted ? 'Voted out — duel pending' : 'Tribe rejected the request';
      const _resultCol = vd.duelResult === 'won' ? '#3fb950' : vd.duelResult === 'lost' ? '#f47067' : vd.granted ? '#f0883e' : '#8b949e';
      const _boostText = `Heat +${vd.heatBoost || 8} | Target +${vd.targetBoost || 5}`;
      html += `<div style="margin-bottom:20px">
        <div style="font-size:11px;font-weight:800;letter-spacing:1.5px;color:#818cf8;margin-bottom:8px">VOLUNTEER EXILE DUEL</div>
        <div style="padding:8px;border:1px solid rgba(129,140,248,0.2);border-radius:8px;background:rgba(129,140,248,0.04)">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
            ${rpPortrait(vd.volunteer, 'sm')}
            <span style="color:#e6edf3;font-weight:600">${vd.volunteer}</span>
            <span style="color:#818cf8">wants to face</span>
            ${rpPortrait(vd.rival, 'sm')}
            <span style="color:#e6edf3;font-weight:600">${vd.rival}</span>
          </div>
          <div style="font-size:11px;color:${_resultCol};font-weight:700">${_resultText}</div>
          <div style="font-size:10px;color:#6e7681;margin-top:2px">${_boostText} (applied during tribal vote)</div>
        </div>
      </div>`;
    }
    if (ep.volunteerDuelReturn) {
      const vdr = ep.volunteerDuelReturn;
      html += `<div style="margin-bottom:20px">
        <div style="font-size:11px;font-weight:800;letter-spacing:1.5px;color:#818cf8;margin-bottom:8px">VOLUNTEER DUEL RESULT</div>
        <div style="padding:8px;border:1px solid rgba(129,140,248,0.2);border-radius:8px">
          <div style="font-size:11px;color:${vdr.result === 'won' ? '#3fb950' : '#f47067'};font-weight:700">
            ${vdr.volunteer} ${vdr.result === 'won' ? 'WON the duel — returned with grudge bonus (-2 heat, -2 bond with rival, +5 popularity)' : 'LOST the duel — permanently eliminated'}
          </div>
        </div>
      </div>`;
    }
  }

  // ════════════════════════════════════════════════
  // TAB: THE MOLE
  // ════════════════════════════════════════════════
  if (_dbTab === 'mole' && gs.moles?.length) {
    const _moleSnap = snap.moles || gs.moles || [];
    _moleSnap.forEach((mole, mi) => {
      const _isActive = activePlayers.includes(mole.player);
      const _statusCol = mole.exposed ? '#f47067' : _isActive ? '#3fb950' : (mole.sabotageCount > 0 ? '#f0883e' : '#484f58');
      const _statusLabel = mole.exposed ? `EXPOSED (Ep ${mole.exposedEp} by ${mole.exposedBy})` : _isActive ? 'ACTIVE — HIDDEN' : (mole.sabotageCount > 0 ? 'ELIMINATED — UNDISCOVERED' : 'ELIMINATED — NO SABOTAGE');

      html += `<div style="margin-bottom:20px;padding:12px;background:rgba(139,148,158,0.04);border:1px solid rgba(139,148,158,0.1);border-radius:8px">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
          ${rpPortrait(mole.player, 'sm')}
          <div>
            <div style="color:#e6edf3;font-weight:700;font-size:13px">${mole.player}</div>
            <div style="font-size:10px;color:${_statusCol};font-weight:700;letter-spacing:1px">${_statusLabel}</div>
          </div>
          <div style="margin-left:auto;text-align:right">
            <div style="font-size:10px;color:#8b949e">Resistance</div>
            <div style="font-size:13px;font-weight:700;color:${mole.resistance > 0.3 ? '#3fb950' : mole.resistance > 0.15 ? '#e3b341' : '#f47067'}">${(mole.resistance * 100).toFixed(0)}%</div>
          </div>
        </div>`;

      // Sabotage count + breakdown
      html += `<div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:10px">
        <div style="padding:4px 10px;background:rgba(248,81,73,0.08);border:1px solid rgba(248,81,73,0.2);border-radius:6px">
          <div style="font-size:9px;color:#f47067;font-weight:700;letter-spacing:1px">SABOTAGE ACTS</div>
          <div style="font-size:18px;font-weight:700;color:#f47067">${mole.sabotageCount}</div>
        </div>
        <div style="padding:4px 10px;background:rgba(63,185,80,0.08);border:1px solid rgba(63,185,80,0.2);border-radius:6px">
          <div style="font-size:9px;color:#3fb950;font-weight:700;letter-spacing:1px">LAYING LOW</div>
          <div style="font-size:18px;font-weight:700;color:#3fb950">${mole.layingLow ? 'YES' : 'NO'}</div>
        </div>
      </div>`;

      // Sabotage log
      if (mole.sabotageLog?.length) {
        html += `<div style="margin-bottom:10px">
          <div style="font-size:10px;font-weight:700;letter-spacing:1px;color:#f0883e;margin-bottom:4px">SABOTAGE LOG</div>`;
        mole.sabotageLog.forEach(s => {
          const _typeLabel = s.type === 'bondSabotage' ? 'Bond Sabotage' : s.type === 'challengeThrow' ? `Immunity Throw (self)` : s.type === 'challengeSabotage' ? `${s.reward ? 'Reward' : 'Immunity'} Sabotage` : s.type === 'infoLeak' ? 'Info Leak' : s.type === 'voteDisruption' ? 'Vote Disruption' : s.type === 'advantageSabotage' ? 'Advantage Sabotage' : s.type;
          const _detail = s.targets ? `→ ${s.targets.join(' vs ')}` : s.target ? `→ ${s.target}` : s.leakedTo ? `→ leaked to ${s.leakedTo}` : s.action ? `(${s.action})` : '';
          html += `<div style="padding:2px 8px;font-size:10px;border-bottom:1px solid rgba(255,255,255,0.04)">
            <span style="color:#8b949e">Ep ${s.ep}</span>
            <span style="color:#f0883e;font-weight:600;margin-left:6px">${_typeLabel}</span>
            <span style="color:#6e7681;margin-left:4px">${_detail}</span>
          </div>`;
        });
        html += `</div>`;
      }

      // Suspicion levels
      const _suspEntries = Object.entries(mole.suspicion || {}).filter(([n, v]) => v > 0).sort((a, b) => b[1] - a[1]);
      if (_suspEntries.length) {
        html += `<div style="margin-bottom:10px">
          <div style="font-size:10px;font-weight:700;letter-spacing:1px;color:#d29922;margin-bottom:4px">SUSPICION LEVELS <span style="font-weight:400;color:#6e7681">(threshold: 3.0)</span></div>`;
        _suspEntries.forEach(([name, susp]) => {
          const _pct = Math.min(100, (susp / 3.0) * 100);
          const _col = susp >= 2.5 ? '#f47067' : susp >= 1.5 ? '#e3b341' : '#3fb950';
          html += `<div style="display:flex;align-items:center;gap:6px;padding:2px 8px;font-size:10px;border-bottom:1px solid rgba(255,255,255,0.04)">
            ${rpPortrait(name, 'xs')}
            <span style="color:#e6edf3;font-weight:600;width:80px">${name}</span>
            <div style="flex:1;height:6px;background:rgba(139,148,158,0.15);border-radius:3px;overflow:hidden">
              <div style="height:100%;width:${_pct}%;background:${_col};border-radius:3px"></div>
            </div>
            <span style="color:${_col};font-weight:700;font-family:var(--font-mono);width:32px;text-align:right">${susp.toFixed(1)}</span>
          </div>`;
        });
        html += `</div>`;
      } else {
        html += `<div style="font-size:10px;color:#484f58;margin-bottom:10px">No suspicion accumulated yet.</div>`;
      }

      // Leaks
      if (mole.leaks?.length) {
        html += `<div style="margin-bottom:10px">
          <div style="font-size:10px;font-weight:700;letter-spacing:1px;color:#6366f1;margin-bottom:4px">INFO LEAKS</div>`;
        mole.leaks.forEach(l => {
          html += `<div style="padding:2px 8px;font-size:10px;border-bottom:1px solid rgba(255,255,255,0.04)">
            <span style="color:#8b949e">Ep ${l.ep}</span>
            <span style="color:#6366f1;margin-left:6px">→ ${l.leakedTo}</span>
            <span style="color:#6e7681;margin-left:4px">${l.info}</span>
          </div>`;
        });
        html += `</div>`;
      }

      html += `</div>`;
    });

    // Coordination mode
    if (gs.moles.length === 2) {
      html += `<div style="text-align:center;font-size:10px;color:#8b949e;margin-top:8px">
        Mode: <span style="color:#f0883e;font-weight:700">${seasonConfig.moleCoordination === 'coordinated' ? 'COORDINATED' : 'INDEPENDENT'}</span>
      </div>`;
    }
  }

  // ════════════════════════════════════════════════
  // TAB: ROMANCE (Showmances + Love Triangles)
  // ════════════════════════════════════════════════
  if (_dbTab === 'romance') {
    const _showmances = snap.showmances || gs.showmances || [];
    const _triangles = snap.loveTriangles || gs.loveTriangles || [];

    // Romantic Sparks (slow burn)
    const _sparks = snap.romanticSparks || gs.romanticSparks || [];
    if (_sparks.length) {
      html += `<div style="margin-bottom:16px">
        <div style="font-size:11px;font-weight:800;letter-spacing:1.5px;color:#f0a500;margin-bottom:8px">ROMANTIC SPARKS (${_sparks.length})</div>`;
      _sparks.forEach(sp => {
        const [a, b] = sp.players;
        const bond = getBond(a, b);
        const fakeTag = sp.fake ? '<span style="color:#f85149;font-weight:700"> FAKE (sabotage)</span>' : '';
        const intensityPct = Math.min(100, Math.round(sp.intensity * 100));
        const intensityColor = sp.intensity >= 0.8 ? '#3fb950' : sp.intensity >= 0.5 ? '#f0a500' : '#8b949e';
        html += `<div style="display:flex;align-items:center;gap:8px;padding:6px 8px;margin-bottom:4px;border:1px solid rgba(240,165,0,0.15);border-radius:6px;background:rgba(240,165,0,0.03)">
          ${rpPortrait(a, 'xs')} <span style="color:#e6edf3;font-size:10px">${a}</span>
          <span style="color:#f0a500">✦</span>
          <span style="color:#e6edf3;font-size:10px">${b}</span> ${rpPortrait(b, 'xs')}
          <div style="margin-left:auto;text-align:right">
            <div style="font-size:9px;color:${intensityColor};font-weight:700">Intensity: ${sp.intensity.toFixed(2)} (${intensityPct}%)${fakeTag}</div>
            <div style="font-size:8px;color:#6e7681">Spark Ep ${sp.sparkEp} | Bond: ${bond.toFixed(1)} | ${sp.context}${sp.saboteur ? ' | by ' + sp.saboteur : ''}</div>
            <div style="height:3px;width:60px;border-radius:2px;background:rgba(255,255,255,0.06);margin-top:2px">
              <div style="height:3px;border-radius:2px;background:${intensityColor};width:${intensityPct}%"></div>
            </div>
          </div>
        </div>`;
      });
      html += `</div>`;
    }

    // Showmances
    html += `<div style="margin-bottom:16px">
      <div style="font-size:11px;font-weight:800;letter-spacing:1.5px;color:#d29922;margin-bottom:8px">SHOWMANCES (${_showmances.length})</div>`;
    if (_showmances.length) {
      _showmances.forEach(sh => {
        const [a, b] = sh.players;
        const bond = getBond(a, b);
        const _isSeparated = sh.phase === 'broken-up' && sh.breakupType === 'separated';
        const phaseCol = sh.phase === 'broken-up' ? (_isSeparated ? '#d29922' : '#f47067') : sh.phase === 'ride-or-die' ? '#3fb950' : sh.phase === 'target' ? '#f0883e' : '#d29922';
        html += `<div style="display:flex;align-items:center;gap:8px;padding:6px 8px;margin-bottom:4px;border:1px solid rgba(255,255,255,0.06);border-radius:6px;background:rgba(139,148,158,0.03)">
          ${rpPortrait(a, 'sm')}
          <span style="color:#e6edf3;font-weight:600">${a}</span>
          <span style="color:#6e7681">♥</span>
          <span style="color:#e6edf3;font-weight:600">${b}</span>
          ${rpPortrait(b, 'sm')}
          <div style="margin-left:auto;text-align:right">
            <div style="font-size:10px;color:${phaseCol};font-weight:700;text-transform:uppercase">${_isSeparated ? 'SEPARATED' : sh.phase === 'broken-up' ? 'BROKEN-UP' : sh.phase}${sh.phase === 'broken-up' && sh.breakupVoter ? ' (betrayal by ' + sh.breakupVoter + ')' : ''}${sh.phase === 'broken-up' && sh.breakupType === 'faded' ? ' (faded)' : ''}${sh.phase === 'broken-up' && sh.breakupType === 'sabotaged' ? ' (sabotaged)' : ''}</div>
            <div style="font-size:9px;color:#6e7681">Bond: ${bond.toFixed(1)} | Ep ${sh.sparkEp}${sh.firstMoveEp ? ' → move Ep ' + sh.firstMoveEp : ''}${sh.breakupEp ? ' → end Ep ' + sh.breakupEp : ''} | ${sh.episodesActive} eps${sh.firstMoveBy ? ' | 1st move: ' + sh.firstMoveBy : ''}${sh.jealousPlayer ? ' | 3rd: ' + sh.jealousPlayer : ''}</div>
            ${sh.origin || sh.sparkContext ? `<div style="font-size:8px;color:#484f58">${sh.origin ? '<span style="color:#8b5cf6;font-weight:600">Type: ' + sh.origin.toUpperCase() + '</span>' : ''}${sh.sparkContext ? ' <span style="color:#6e7681">| Sparked from: ' + sh.sparkContext + '</span>' : ''}</div>` : ''}
          </div>
        </div>`;
      });
    } else {
      html += `<div style="font-size:10px;color:#484f58">No showmances this season.</div>`;
    }
    html += `</div>`;

    // Love Triangles
    html += `<div style="margin-bottom:16px">
      <div style="font-size:11px;font-weight:800;letter-spacing:1.5px;color:#f0883e;margin-bottom:8px">LOVE TRIANGLES (${_triangles.length})</div>`;
    if (_triangles.length) {
      _triangles.forEach(tri => {
        const phaseCol = tri.resolved ? '#6e7681' : tri.phase === 'ultimatum' ? '#f47067' : tri.phase === 'escalation' ? '#f0883e' : '#d29922';
        const resText = tri.resolution
          ? (tri.resolution.type === 'chose' ? `Chose ${tri.resolution.chosen}, rejected ${tri.resolution.rejected} (severity ${(tri.resolution.severity || 0).toFixed(1)}, crash ${(tri.resolution.bondCrash || 0).toFixed(1)})`
            : tri.resolution.type === 'eliminated' ? `${tri.resolution.who} eliminated`
            : tri.resolution.type === 'organic' ? `Organic — survived bond: ${tri.resolution.survivingBond}`
            : tri.resolution.type)
          : 'Ongoing';
        html += `<div style="padding:8px;margin-bottom:6px;border:1px solid rgba(240,136,62,0.2);border-radius:6px;background:rgba(240,136,62,0.04)">
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
            ${rpPortrait(tri.suitors[0], 'sm')}
            <span style="color:#8b949e;font-size:10px">←</span>
            ${rpPortrait(tri.center, 'sm')}
            <span style="color:#e6edf3;font-weight:700">${tri.center}</span>
            <span style="color:#8b949e;font-size:10px">→</span>
            ${rpPortrait(tri.suitors[1], 'sm')}
            <div style="margin-left:auto">
              <span style="font-size:10px;color:${phaseCol};font-weight:700;text-transform:uppercase">${tri.phase}</span>
            </div>
          </div>
          <div style="font-size:9px;color:#6e7681;padding-left:4px">
            ${tri.suitors[0]} ♥ <strong style="color:#e6edf3">${tri.center}</strong> ♥ ${tri.suitors[1]}
            | Type: ${tri.sourceType} | Ep ${tri.formedEp} | ${tri.episodesActive} eps
            | Jealousy: <span style="color:${tri.jealousyLevel >= 7 ? '#f47067' : tri.jealousyLevel >= 4 ? '#f0883e' : '#d29922'};font-weight:600">${tri.jealousyLevel.toFixed(1)}/10</span>
          </div>
          <div style="font-size:9px;color:#8b949e;padding-left:4px;margin-top:2px">
            Resolution: ${resText}
          </div>
        </div>`;
      });
    } else {
      html += `<div style="font-size:10px;color:#484f58">No love triangles this season.</div>`;
    }
    html += `</div>`;

    // Secret Affairs
    const _affairs = snap.affairs || gs.affairs || [];
    html += `<div style="margin-bottom:16px">
      <div style="font-size:11px;font-weight:800;letter-spacing:1.5px;color:#f47067;margin-bottom:8px">SECRET AFFAIRS (${_affairs.length})</div>`;
    if (_affairs.length) {
      _affairs.forEach(af => {
        const expCol = af.exposure === 'exposed' ? '#f47067' : af.exposure === 'caught' ? '#f0883e' : af.exposure === 'rumors' ? '#d29922' : '#3fb950';
        const resText = af.resolution
          ? (af.resolution.type === 'exposed' ? `${af.resolution.staysWithPartner ? 'Stayed with ' + af.resolution.chose : 'Left for ' + af.resolution.leftFor}` : `${af.resolution.who} eliminated`)
          : 'Ongoing';
        html += `<div style="padding:8px;margin-bottom:6px;border:1px solid rgba(244,112,103,0.2);border-radius:6px;background:rgba(244,112,103,0.04)">
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
            ${rpPortrait(af.cheater, 'sm')}
            <span style="color:#e6edf3;font-weight:700">${af.cheater}</span>
            <span style="color:#f47067;font-size:10px">🤫→</span>
            ${rpPortrait(af.secretPartner, 'sm')}
            <span style="color:#e6edf3;font-weight:600">${af.secretPartner}</span>
            <span style="color:#6e7681;font-size:10px">(hiding from</span>
            ${rpPortrait(af.partner, 'xs')}
            <span style="color:#6e7681;font-size:10px">${af.partner})</span>
            <div style="margin-left:auto">
              <span style="font-size:10px;color:${expCol};font-weight:700;text-transform:uppercase">${af.exposure}</span>
            </div>
          </div>
          <div style="font-size:9px;color:#6e7681;padding-left:4px">
            Ep ${af.formedEp} | ${af.episodesActive} eps | Complicit: ${af.complicit ? 'YES' : 'NO'}
            ${af.rumorSources.length ? ' | Rumors: ' + af.rumorSources.join(', ') : ''}
            ${af.caughtBy ? ' | Caught by: ' + af.caughtBy + (af.caughtTold ? ' (TOLD)' : ' (silent)') : ''}
          </div>
          <div style="font-size:9px;color:#8b949e;padding-left:4px;margin-top:2px">
            Resolution: ${resText}
          </div>
        </div>`;
      });
    } else {
      html += `<div style="font-size:10px;color:#484f58">No secret affairs this season.</div>`;
    }
    html += `</div>`;

    // Romance Events Log — full timeline of all romance events
    const _romEvents = [];
    gs.episodeHistory.filter(h => h.num <= ep.num).forEach(h => {
      // Spark formations (from camp events)
      const _allCampEvts = h.campEvents ? Object.values(h.campEvents).flatMap(c => [...(c.pre||[]), ...(c.post||[])]) : [];
      _allCampEvts.filter(e => e.type === 'soShowmance' && e.badge === 'ROMANCE SPARK').forEach(e => {
        _romEvents.push({ ep: h.num, type: 'SPARK', col: '#f0a500', detail: `${e.players[0]} ✦ ${e.players[1]} — ${e.text?.substring(0, 60) || 'romantic spark'}...` });
      });
      // First move events
      _allCampEvts.filter(e => e.type === 'firstMove').forEach(e => {
        _romEvents.push({ ep: h.num, type: 'FIRST MOVE', col: '#d29922', detail: `${e.players[0]} → ${e.players[1]} — ${e.text?.substring(0, 60) || 'made the first move'}...` });
      });
      // Showmance sabotage
      _allCampEvts.filter(e => e.type === 'showmanceSabotage').forEach(e => {
        _romEvents.push({ ep: h.num, type: 'SABOTAGE', col: '#f85149', detail: `${e.players[0]} kissed ${e.players[1]} to hurt ${e.players[2]}` });
      });
      // Challenge romance moments
      // Friendship jealousy
      _allCampEvts.filter(e => e.type === 'friendshipJealousy').forEach(e => {
        _romEvents.push({ ep: h.num, type: 'FRIENDSHIP JEALOUSY', col: '#f0883e', detail: `${e.players[0]} sidelined by ${e.players[1]} + ${e.players[2]}` });
      });
      _allCampEvts.filter(e => ['showmanceProtective','showmanceJealousy','showmanceSacrifice','showmancePDA'].includes(e.type)).forEach(e => {
        const label = e.type === 'showmanceProtective' ? 'PROTECTIVE' : e.type === 'showmanceJealousy' ? 'JEALOUSY' : e.type === 'showmanceSacrifice' ? 'SACRIFICE' : 'PDA';
        _romEvents.push({ ep: h.num, type: label, col: e.type === 'showmanceJealousy' ? '#f85149' : '#d29922', detail: `${e.players.join(' & ')}` });
      });
      // Phobia comfort/support — only show if a spark ALSO fired in the same episode for the same pair
      _allCampEvts.filter(e => e.type === 'phobiaComfort' || e.type === 'phobiaSupport').forEach(e => {
        const hasSpark = _allCampEvts.some(s => s.badge === 'ROMANCE SPARK' && s.players?.includes(e.players[0]) && s.players?.includes(e.players[1]));
        if (hasSpark) {
          _romEvents.push({ ep: h.num, type: e.type === 'phobiaComfort' ? 'COMFORT → SPARK' : 'SUPPORT → SPARK', col: '#3fb950', detail: `${e.players[0]} → ${e.players[1]}` });
        }
      });
      // New showmance formed (from episode data)
      if (h.newShowmances?.length) {
        h.newShowmances.forEach(ns => {
          _romEvents.push({ ep: h.num, type: 'SHOWMANCE FORMED', col: '#d29922', detail: `${ns.a} ♥ ${ns.b}` });
        });
      }
      if (h.showmanceBreakup) _romEvents.push({ ep: h.num, type: 'BETRAYAL', col: '#f47067', detail: `${h.showmanceBreakup.voter} voted out partner ${h.showmanceBreakup.eliminated} (bond: ${(h.showmanceBreakup.bond || 0).toFixed(1)})` });
      if (h.showmanceSeparation) _romEvents.push({ ep: h.num, type: 'SEPARATED', col: '#d29922', detail: `${h.showmanceSeparation.survivor} lost partner ${h.showmanceSeparation.eliminated} (bond: ${(h.showmanceSeparation.bond || 0).toFixed(1)})` });
      if (h.showmanceEvents?.length) {
        h.showmanceEvents.filter(e => e.type === 'showmanceRekindle').forEach(e => {
          _romEvents.push({ ep: h.num, type: 'REKINDLED', col: '#3fb950', detail: `${e.players[0]} & ${e.players[1]} back together` });
        });
        h.showmanceEvents.filter(e => e.type === 'showmanceBreakup' && e.phase === 'faded').forEach(e => {
          _romEvents.push({ ep: h.num, type: 'FADED', col: '#f0883e', detail: `${e.players[0]} & ${e.players[1]} — bond decayed, showmance died` });
        });
      }
      if (h.triangleResolution) {
        const tr = h.triangleResolution;
        _romEvents.push({ ep: h.num, type: 'TRIANGLE RESOLVED', col: '#f0883e', detail: `${tr.center} chose ${tr.chosen}, rejected ${tr.rejected} (severity: ${(tr.severity || 0).toFixed(1)}, bond crash: ${(tr.bondCrash || 0).toFixed(1)}, heat: ${tr.heatBoost >= 0 ? '+' : ''}${(tr.heatBoost || 0).toFixed(1)})` });
      }
      if (h.triangleEvents?.length) h.triangleEvents.filter(e => e.type === 'formed').forEach(e => {
        _romEvents.push({ ep: h.num, type: 'TRIANGLE FORMED', col: '#d29922', detail: `${e.center} between ${e.suitors[0]} & ${e.suitors[1]} (${e.sourceType})` });
      });
      // Affair events
      if (h.affairEvents?.length) h.affairEvents.forEach(e => {
        if (e.type === 'formed') _romEvents.push({ ep: h.num, type: 'AFFAIR FORMED', col: '#f47067', detail: `${e.cheater} cheating on ${e.partner} with ${e.secretPartner}${e.complicit ? ' (complicit)' : ''}` });
        if (e.type === 'affairRumor') _romEvents.push({ ep: h.num, type: 'AFFAIR RUMORS', col: '#d29922', detail: `${e.cheater} + ${e.secretPartner} — rumors spreading` });
        if (e.type === 'affairCaught') _romEvents.push({ ep: h.num, type: 'AFFAIR CAUGHT', col: '#f0883e', detail: `${e.cheater} + ${e.secretPartner} caught` });
      });
      if (h.affairExposure) {
        const ae = h.affairExposure;
        _romEvents.push({ ep: h.num, type: 'AFFAIR EXPOSED', col: '#f47067', detail: `${ae.cheater} ${ae.staysWithPartner ? 'stayed with ' + ae.partner : 'left ' + ae.partner + ' for ' + ae.secretPartner}${ae.complicit ? ' (both complicit)' : ''}` });
      }
    });
    if (_romEvents.length) {
      html += `<div style="margin-bottom:16px">
        <div style="font-size:11px;font-weight:800;letter-spacing:1.5px;color:#f47067;margin-bottom:8px">ROMANCE EVENT LOG (${_romEvents.length})</div>`;
      _romEvents.forEach(e => {
        html += `<div style="padding:3px 8px;font-size:10px;border-bottom:1px solid rgba(255,255,255,0.04)">
          <span style="color:#8b949e">Ep ${e.ep}</span>
          <span style="color:${e.col};font-weight:700;margin-left:6px">${e.type}</span>
          <span style="color:#6e7681;margin-left:4px">${e.detail}</span>
        </div>`;
      });
      html += `</div>`;
    }
  }

  // ════════════════════════════════════════════════
  // TAB: CHALLENGE (per-player scores + ranking for challenge twist episodes)
  // ════════════════════════════════════════════════
  if (_dbTab === 'challenge') {
    let _chalScores = ep.chalMemberScores || {};
    if (!Object.keys(_chalScores).length && ep.dodgebrawl?.rounds?.length) {
      ep.dodgebrawl.rounds.forEach(r => {
        Object.entries(r.scores || {}).forEach(([tribe, ps]) => {
          Object.entries(ps).forEach(([name, score]) => {
            _chalScores[name] = (_chalScores[name] || 0) + score;
          });
        });
      });
    }
    const _chalLabel = ep.challengeLabel || 'Challenge';
    const _chalType = ep.isDodgebrawl ? 'Dodgebrawl' : ep.isCliffDive ? 'Cliff Dive' : ep.isAwakeAThon ? 'Awake-A-Thon' : ep.isPhobiaFactor ? 'Phobia Factor' : ep.isSayUncle ? 'Say Uncle' : ep.isTalentShow ? 'Talent Show' : ep.isSuckyOutdoors ? 'Sucky Outdoors' : ep.isUpTheCreek ? 'Up the Creek' : ep.isPaintballHunt ? 'Paintball Hunt' : ep.isHellsKitchen ? "Hell's Kitchen" : ep.isTrustChallenge ? 'Trust Challenge' : ep.isBasicStraining ? 'Basic Straining' : ep.isXtremeTorture ? 'X-Treme Torture' : ep.isLuckyHunt ? 'Lucky Hunt' : ep.isHideAndBeSneaky ? 'Hide and Be Sneaky' : ep.isOffTheChain ? "That's Off the Chain!" : ep.isWawanakwaGoneWild ? 'Wawanakwa Gone Wild!' : _chalLabel;

    html += `<div style="margin-bottom:12px">
      <div style="font-family:var(--font-display);font-size:14px;color:#f0883e;margin-bottom:8px">${_chalType} — Player Rankings</div>`;

    const _ranked = Object.entries(_chalScores).sort(([,a], [,b]) => b - a);
    const _maxScore = _ranked[0]?.[1] || 1;

    if (_ranked.length) {
      html += `<table style="width:100%;border-collapse:collapse;font-size:11px">
        <tr style="color:#8b949e;border-bottom:1px solid rgba(255,255,255,0.08)">
          <th style="text-align:left;padding:4px 6px;width:30px">#</th>
          <th style="text-align:left;padding:4px 6px">Player</th>
          <th style="text-align:left;padding:4px 6px">Tribe</th>
          <th style="text-align:right;padding:4px 6px">Score</th>
          <th style="text-align:left;padding:4px 6px;width:40%">Bar</th>
        </tr>`;
      const _isMergedEp = ep.isMerge || ep.gsSnapshot?.isMerged || false;
      const _podiumCount = _isMergedEp ? 2 : 3;
      const _bombCount = _isMergedEp ? 2 : 3;
      _ranked.forEach(([name, score], idx) => {
        const tribe = (ep.tribesAtStart || []).find(t => t.members?.includes(name))?.name || '?';
        const tc = tribeColor(tribe);
        const pct = Math.max(2, (score / _maxScore) * 100);
        const isPodium = idx < _podiumCount;
        const isBomb = idx >= _ranked.length - _bombCount;
        const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : '';
        const bombIcon = isBomb ? '💣' : '';
        const rowBg = isPodium ? 'rgba(63,185,80,0.04)' : isBomb ? 'rgba(248,81,73,0.04)' : 'transparent';
        html += `<tr style="border-bottom:1px solid rgba(255,255,255,0.04);background:${rowBg}">
          <td style="padding:4px 6px;color:#8b949e;font-weight:700">${idx + 1} ${medal}${bombIcon}</td>
          <td style="padding:4px 6px;display:flex;align-items:center;gap:4px">${rpPortrait(name, 'xs')} <span style="color:#e6edf3">${name}</span></td>
          <td style="padding:4px 6px;color:${tc}">${tribe}</td>
          <td style="padding:4px 6px;text-align:right;font-weight:600;color:${isPodium ? '#3fb950' : isBomb ? '#f85149' : '#e6edf3'}">${score.toFixed(1)}</td>
          <td style="padding:4px 6px"><div style="height:8px;border-radius:4px;background:${isPodium ? '#3fb950' : isBomb ? '#f85149' : tc};width:${pct}%;opacity:0.6"></div></td>
        </tr>`;
      });
      html += `</table>`;
      html += `<div style="margin-top:8px;font-size:10px;color:#8b949e">🥇🥈🥉 = Podium (top ${_podiumCount}) &nbsp; 💣 = Bomb (bottom ${_bombCount})</div>`;
    } else {
      html += `<div style="color:#8b949e">No challenge scores this episode.</div>`;
    }

    // Per-round breakdown for dodgebrawl
    if (ep.dodgebrawl?.rounds?.length) {
      html += `<div style="font-family:var(--font-display);font-size:13px;color:#f0883e;margin:16px 0 8px">Per-Round Breakdown</div>`;
      ep.dodgebrawl.rounds.forEach(r => {
        html += `<div style="margin-bottom:10px;padding:8px;border-radius:6px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.05)">
          <div style="font-size:11px;font-weight:700;margin-bottom:4px">Round ${r.num} — <span style="color:${tribeColor(r.winner)}">${r.winner} wins</span></div>`;
        const _rScores = Object.entries(r.scores || {}).flatMap(([tribe, ps]) => Object.entries(ps).map(([p, s]) => ({ name: p, score: s, tribe })));
        _rScores.sort((a, b) => b.score - a.score).forEach((p, i) => {
          const tc = tribeColor(p.tribe);
          html += `<div style="display:flex;align-items:center;gap:6px;padding:2px 0;font-size:10px">
            <span style="width:16px;color:#8b949e;text-align:right">${i + 1}.</span>
            <span style="color:${tc}">${p.name}</span>
            <span style="color:#8b949e;margin-left:auto">${p.score.toFixed(1)}</span>
          </div>`;
        });
        html += `</div>`;
      });
    }

    if (ep.awakeAThon?.rounds?.length) {
      html += `<div style="font-family:var(--font-display);font-size:13px;color:#f0883e;margin:16px 0 8px">Dropout Order</div>`;
      ep.awakeAThon.rounds.forEach((r, i) => {
        if (r.dropped) {
          html += `<div style="font-size:10px;padding:2px 0;color:#8b949e">${i + 1}. ${r.dropped} drops out (${r.dropped_tribe || '?'})</div>`;
        }
      });
    }

    if (ep.cliffDive?.tribes?.length) {
      html += `<div style="font-family:var(--font-display);font-size:13px;color:#f0883e;margin:16px 0 8px">Cliff Dive — Per Tribe</div>`;
      ep.cliffDive.tribes.forEach(t => {
        const tc = tribeColor(t.name);
        html += `<div style="font-size:10px;padding:2px 0"><span style="color:${tc};font-weight:700">${t.name}</span> — Jumpers: ${t.jumpCount}/${t.reactions.length}, Haul: ${(t.haulScore||0).toFixed(1)}, Build: ${(t.buildScore||0).toFixed(1)}${t.standout ? ', Standout: '+t.standout : ''}${t.buildLeader ? ', Build Capt: '+t.buildLeader : ''}</div>`;
        t.members.forEach(m => {
          const jumped = t.jumpers.includes(m);
          const hScore = (t.haulIndiv?.[m] || 0).toFixed(1);
          const bScore = (t.buildIndiv?.[m] || 0).toFixed(1);
          const total = ep.chalMemberScores?.[m] || 0;
          html += `<div style="font-size:9px;padding:1px 0 1px 12px;color:#6e7681">${m}: ${jumped ? 'JUMPED' : 'CHICKEN'} · Haul:${hScore} · Build:${bScore} · Total:${total}</div>`;
        });
      });
      if (ep.cliffDive.wagonWinner) {
        html += `<div style="font-size:9px;color:#3fb950;padding:2px 0">Wagon advantage: ${ep.cliffDive.wagonWinner}</div>`;
      }
    }

    // Talent show breakdown
    if (ep.talentShow?.performances?.length) {
      html += `<div style="font-family:var(--font-display);font-size:13px;color:#f0883e;margin:16px 0 8px">Talent Show — Performances</div>`;
      ep.talentShow.performances.forEach((p, i) => {
        const tc = tribeColor(p.tribe);
        const tag = p.outcome === 'disaster' ? ' DISASTER' : p.outcome === 'clutch' ? ' CLUTCH' : p.outcome === 'sabotaged' ? ' SABOTAGED' : '';
        html += `<div style="display:flex;align-items:center;gap:6px;padding:3px 0;font-size:10px">
          <span style="width:16px;color:#8b949e;text-align:right">${i + 1}.</span>
          <span style="color:${tc}">${p.name}</span>
          <span style="color:#8b949e">${p.talent}</span>
          <span style="font-weight:700;color:${p.chefScore >= 7 ? '#3fb950' : p.chefScore <= 3 ? '#f85149' : '#e6edf3'};margin-left:auto">Chef: ${p.chefScore}/9${tag}</span>
        </div>`;
      });
      if (ep.talentShow.sabotage) {
        const sab = ep.talentShow.sabotage;
        html += `<div style="margin-top:6px;padding:4px 8px;border-radius:4px;background:rgba(218,54,51,0.08);font-size:10px;color:#da3633">Sabotage: ${sab.saboteur} → ${sab.target} (${sab.type})</div>`;
      }
    }

    // Sucky Outdoors breakdown
    if (ep.suckyOutdoors?.phases) {
      html += `<div style="font-family:var(--font-display);font-size:13px;color:#f0883e;margin:16px 0 8px">Sucky Outdoors — Full Breakdown</div>`;
      const so = ep.suckyOutdoors;

      // Tribe summary
      Object.entries(so.survivalScores || {}).forEach(([tribe, score]) => {
        const tc = tribeColor(tribe);
        const food = so.tribeFood?.[tribe] ?? '?';
        const foodLabel = food === 0 ? 'STARVING' : food >= 3 ? 'WELL FED' : 'HUNGRY';
        const quality = (so.campQuality?.[tribe] || 0).toFixed(1);
        const nav = so.navigators?.[tribe] || '?';
        const isWinner = tribe === so.winner;
        const isLoser = tribe === so.loser;
        html += `<div style="font-size:10px;padding:3px 0"><span style="color:${tc};font-weight:700">${tribe}</span>: Score ${score.toFixed(1)}${isWinner ? ' ★ WINNER' : ''}${isLoser ? ' ✗ LOSER' : ''} · Nav: ${nav} · Camp: ${quality} · Food: ${food} (${foodLabel})</div>`;
      });

      // Per-player scores
      html += `<div style="font-size:9px;font-weight:700;color:#8b949e;margin-top:6px">Per-Player Scores</div>`;
      const allPlayers = Object.entries(ep.chalMemberScores || {}).sort((a, b) => b[1] - a[1]);
      allPlayers.forEach(([name, score]) => {
        const injured = ep._soInjured?.[name] ? ' INJURED' : '';
        const lost = so.lostPlayers?.some(lp => lp.name === name) ? ' LOST' : '';
        html += `<div style="font-size:9px;padding:1px 0 1px 12px;color:#6e7681">${name}: ${typeof score === 'number' ? score.toFixed(1) : score}${injured}${lost}</div>`;
      });

      // Phase events (keep existing pattern)
      Object.entries(so.phases).forEach(([phase, events]) => {
        const labels = { announcement: 'Hike', setupCamp: 'Camp Setup', nightfall: 'Nightfall', theNight: 'The Night', morningRace: 'Morning Race' };
        html += `<div style="font-size:10px;font-weight:700;color:#8b949e;margin-top:6px">${labels[phase] || phase} (${events.length} events)</div>`;
        events.forEach(evt => {
          const scores = Object.entries(evt.personalScores || {}).map(([n, d]) => `${n}:${d > 0 ? '+' : ''}${d.toFixed(1)}`).join(', ');
          html += `<div style="font-size:9px;padding:1px 0;color:#6e7681">[${evt.badge || evt.type}] ${evt.text.substring(0, 80)}${evt.text.length > 80 ? '...' : ''}${scores ? ` <span style="color:#8b949e">(${scores})</span>` : ''}</div>`;
        });
      });

      // Lost players
      if (so.lostPlayers?.length) {
        html += `<div style="margin-top:6px;padding:4px 8px;border-radius:4px;background:rgba(248,81,73,0.08);font-size:10px;color:#f85149">Lost: ${so.lostPlayers.map(lp => `${lp.name} (${lp.tribe})`).join(', ')}</div>`;
      }
    }

    // Up the Creek breakdown
    if (ep.upTheCreek?.phases) {
      html += `<div style="font-family:var(--font-display);font-size:13px;color:#f0883e;margin:16px 0 8px">Up the Creek — Summary</div>`;
      const utc = ep.upTheCreek;
      if (utc.canoePairs) {
        Object.entries(utc.canoePairs).forEach(([tribe, pairs]) => {
          const tc = tribeColor(tribe);
          html += `<div style="font-size:10px;font-weight:700;color:${tc};margin-top:6px">${tribe} Pairs</div>`;
          pairs.forEach(p => html += `<div style="font-size:9px;color:#6e7681">${p.a} + ${p.b} (${p.scenario}${p.chemistry ? ', chem: ' + p.chemistry.toFixed(1) : ''})</div>`);
          if (utc.soloCanoe?.[tribe]) html += `<div style="font-size:9px;color:#f85149">${utc.soloCanoe[tribe]} — solo</div>`;
        });
      }
      ['paddleOut', 'portage', 'buildFire', 'paddleBack'].forEach(phase => {
        const events = utc.phases?.[phase] || [];
        const labels = { paddleOut: 'Paddle Out', portage: 'Portage', buildFire: 'Build Fire', paddleBack: 'Paddle Back' };
        html += `<div style="font-size:10px;font-weight:700;color:#8b949e;margin-top:6px">${labels[phase]} (${events.length} events)</div>`;
        events.forEach(evt => {
          const scores = Object.entries(evt.personalScores || {}).map(([n, d]) => `${n}:${d > 0 ? '+' : ''}${d.toFixed(1)}`).join(', ');
          html += `<div style="font-size:9px;padding:1px 0;color:#6e7681">[${evt.badge || evt.type}] ${evt.text.substring(0, 80)}${evt.text.length > 80 ? '...' : ''}${scores ? ` <span style="color:#8b949e">(${scores})</span>` : ''}</div>`;
        });
      });
      if (utc.fireScores) {
        html += `<div style="font-size:10px;font-weight:700;color:#8b949e;margin-top:6px">Fire Scores</div>`;
        Object.entries(utc.fireScores).forEach(([tribe, score]) => {
          const tc = tribeColor(tribe);
          html += `<div style="font-size:9px;color:${tc}">${tribe}: ${score.toFixed(1)}${utc.paddlesBurned?.[tribe] ? ' (PADDLES BURNED)' : ''}</div>`;
        });
      }
    }

    if (ep.paintballHunt?.rounds) {
      html += `<div style="font-family:var(--font-display);font-size:13px;color:#3fb950;margin:16px 0 8px">Paintball Hunt — Summary</div>`;
      const pb = ep.paintballHunt;
      Object.entries(pb.roles || {}).forEach(([tribe, roles]) => {
        const tc = tribeColor(tribe);
        html += `<div style="font-size:10px;color:${tc};font-weight:700;margin-top:4px">${tribe}</div>`;
        html += `<div style="font-size:9px;color:#6e7681">Hunters: ${roles.hunters.join(', ')} | Deer: ${roles.deer.join(', ')}</div>`;
      });
      pb.rounds.forEach(r => {
        html += `<div style="font-size:10px;font-weight:700;color:#8b949e;margin-top:6px">Round ${r.round} — ${r.name || ''} (${(r.matchups||[]).length} matchups)</div>`;
        (r.matchups||[]).forEach(m => {
          const col = (m.result === 'hit' || m.result === 'ambush' || m.result === 'sneak' || m.result === 'double-hit' || m.result === 'friendly-fire') ? '#3fb950' : m.result === 'miss' || m.result === 'double-miss' ? '#f85149' : '#6e7681';
          html += `<div style="font-size:9px;color:${col}">${m.result === 'nothing' ? m.hunter + ' found nothing' : m.hunter + ' → ' + (m.target||'?') + ' ' + m.result.toUpperCase()}</div>`;
        });
        (r.events||[]).forEach(evt => {
          html += `<div style="font-size:9px;color:#484f58">[${evt.badge||evt.badgeText||evt.type}] ${(evt.text||'').substring(0,80)}</div>`;
        });
      });
      if (pb.bearMauled?.length) html += `<div style="font-size:9px;color:#f85149;margin-top:4px">Bear mauled: ${pb.bearMauled.join(', ')}</div>`;
      html += `<div style="font-size:9px;color:#8b949e;margin-top:4px">Winner: ${pb.winner} | Loser: ${pb.loser}${pb.mvp ? ' | MVP: ' + pb.mvp : ''}</div>`;
    }

    if (ep.hellsKitchen) {
      html += `<div style="font-family:var(--font-display);font-size:13px;color:#f97316;margin:16px 0 8px">Hell's Kitchen — Summary</div>`;
      const hk = ep.hellsKitchen;
      Object.entries(hk.chefs || {}).forEach(([tribe, chef]) => {
        const tc = tribeColor(tribe);
        html += `<div style="font-size:10px;color:${tc};font-weight:700;margin-top:4px">${tribe} Chef: ${chef.name} (${chef.style})</div>`;
      });
      ['appetizer', 'main', 'dessert'].forEach(course => {
        html += `<div style="font-size:10px;font-weight:700;color:#8b949e;margin-top:6px">${course.toUpperCase()}</div>`;
        Object.entries(hk.courseScores || {}).forEach(([tribe, scores]) => {
          const s = scores[course];
          const col = (s?.rating || 0) >= 7 ? '#3fb950' : (s?.rating || 0) >= 4 ? '#f0a500' : '#f85149';
          html += `<div style="font-size:9px;color:${col}">${tribe}: ${hk.dishes?.[tribe]?.[course] || '?'} → ${s?.rating || '?'}/10 (raw: ${(s?.raw || 0).toFixed(3)})</div>`;
        });
      });
      (hk.events || []).forEach(evt => {
        html += `<div style="font-size:9px;color:#484f58">[${evt.badge||evt.badgeText||evt.type}] ${(evt.text||'').substring(0,80)}</div>`;
      });
      html += `<div style="font-size:9px;color:#8b949e;margin-top:4px">Winner: ${hk.winner} | Loser: ${hk.loser}${hk.mvp ? ' | MVP: ' + hk.mvp : ''}</div>`;
    }

    if (ep.trustChallenge) {
      html += `<div style="font-family:var(--font-display);font-size:13px;color:#38bdf8;margin:16px 0 8px">Who Can You Trust? — Summary</div>`;
      const _tc = ep.trustChallenge;
      const ROUND_LABELS = { round1: 'Rock Climb', round2: 'Fugu', round3: 'Blind Challenges' };
      ['round1','round2','round3'].forEach(rk => {
        const rnd = _tc.rounds?.[rk];
        if (!rnd) return;
        html += `<div style="font-size:10px;font-weight:700;color:#8b949e;margin-top:6px">${ROUND_LABELS[rk]} — Winner: <span style="color:#38bdf8">${rnd.winner || '?'}</span></div>`;
        Object.entries(rnd.pairs || {}).forEach(([tribe, pair]) => {
          if (!pair) return;
          const tcol = tribeColor(tribe);
          const roles = rnd.roles?.[tribe];
          const score = rnd.scores?.[tribe];
          if (rk === 'round3') {
            // Sub-rounds
            ['round3a','round3b','round3c'].forEach(sub => {
              const subPair = pair?.[sub];
              const subScore = score?.[sub];
              if (!subPair) return;
              const scoreTxt = subScore !== undefined && subScore > -900 ? subScore.toFixed(3) : subScore !== undefined ? 'AUTO-LOSS' : '?';
              html += `<div style="font-size:9px;color:${tcol}">${tribe} (${sub}): ${subPair.join(' + ')} → ${scoreTxt}</div>`;
            });
          } else {
            const roleStr = roles ? Object.entries(roles).map(([r, p]) => `${p}=${r}`).join(', ') : (pair?.join(' + ') || '?');
            const scoreTxt = score !== undefined && score > -900 ? score.toFixed(3) : score !== undefined ? 'AUTO-LOSS' : '?';
            html += `<div style="font-size:9px;color:${tcol}">${tribe}: ${roleStr} → ${scoreTxt}</div>`;
          }
        });
      });
      if (_tc.sabotage?.length) {
        html += `<div style="font-size:10px;font-weight:700;color:#f85149;margin-top:6px">Sabotage</div>`;
        _tc.sabotage.forEach(s => {
          html += `<div style="font-size:9px;color:#f85149">${s.type}: ${s.saboteur} → ${s.victim || '?'} (${s.tribe})</div>`;
        });
      }
      if (_tc.ruleBreak) {
        html += `<div style="font-size:9px;color:#f85149;margin-top:2px">DQ: ${_tc.ruleBreak.driver} (${_tc.ruleBreak.sub}, ${_tc.ruleBreak.tribe})</div>`;
      }
      (_tc.events || []).forEach(evt => {
        html += `<div style="font-size:9px;color:#484f58">[${evt.type}] ${(evt.text||'').substring(0,80)}</div>`;
      });
      html += `<div style="font-size:9px;color:#8b949e;margin-top:4px">Winner: ${_tc.winner} | Loser: ${_tc.loser}${_tc.mvp ? ' | MVP: ' + _tc.mvp : ''}</div>`;
    }

    if (ep.wawanakwaGoneWild?.huntResults) {
      html += `<div style="font-family:var(--font-display);font-size:13px;color:#d4a017;margin:16px 0 8px">Wawanakwa Gone Wild! — Per Player</div>`;
      Object.entries(ep.wawanakwaGoneWild.huntResults).forEach(([name, r]) => {
        const statusBadge = r.captured ? '<span style="color:#3fb950">CAUGHT</span>' : '<span style="color:#f85149">FAILED</span>';
        const mods = [r.helpedBy ? `helped:${r.helpedBy}` : '', r.sabotagedBy ? `sab:${r.sabotagedBy}` : '', r.tranqDarted ? "TRANQ'D" : ''].filter(Boolean).join(' ');
        html += `<div style="font-size:9px;padding:1px 0;color:#6e7681">${name}: ${r.animal} (${r.animalTier}) · ${r.gear} · ${statusBadge} · R${(r.captureRound ?? '?') + 1} · Attempts: ${r.attemptsMade} · Score: ${(r.personalScore || 0).toFixed(1)}${mods ? ' · ' + mods : ''}</div>`;
      });
      html += `<div style="font-size:9px;color:#d4a017;padding:2px 0;margin-top:4px">Immunity: ${ep.wawanakwaGoneWild.immunityWinner || 'None'} · Punishment: ${ep.wawanakwaGoneWild.punishmentTarget || 'None'}</div>`;
      html += `<div style="font-size:9px;color:#6e7681">Timeline events: ${ep.wawanakwaGoneWild.timeline?.length || 0}</div>`;
    }

    html += `</div>`;
  }

  html += `</div>`;
  return html;
}

// ── First Impressions VP Screen — click-by-click vote reveal per tribe, twist card, swap announcement ──
export function rpBuildFirstImpressions(ep, twistObj) {
  const fi = twistObj.firstImpressions;
  if (!fi?.length) return null;
  const stateKey = String(ep.num) + '_fi';
  if (!_tvState[stateKey]) _tvState[stateKey] = { idx: 0 };
  const state = _tvState[stateKey];

  // Build all reveal steps: per-tribe votes (one by one), target reveal, twist card, then swap
  const steps = [];
  fi.forEach((tribe, tIdx) => {
    // Tribe header step
    steps.push({ type: 'tribe-header', tribe: tribe.tribe, tribeIdx: tIdx });
    // Individual vote cards
    (tribe.log || []).forEach((v, vIdx) => {
      steps.push({ type: 'vote', tribe: tribe.tribe, tribeIdx: tIdx, voter: v.voter, voted: v.voted, reason: v.reason, voteIdx: vIdx });
    });
    // Target revealed
    steps.push({ type: 'target', tribe: tribe.tribe, tribeIdx: tIdx, votedOut: tribe.votedOut, votes: tribe.votes });
    // Twist card
    steps.push({ type: 'twist-reveal', tribe: tribe.tribe, tribeIdx: tIdx, votedOut: tribe.votedOut });
  });
  // Final swap announcement
  steps.push({ type: 'swap-announce', tribes: fi });

  const visibleSteps = steps.slice(0, state.idx + 1);
  const allRevealed = state.idx >= steps.length - 1;

  // Safe onclick helper — ensures state exists before incrementing
  const _fiReveal = (targetIdx) => `if(!_tvState['${stateKey}'])_tvState['${stateKey}']={idx:0};_tvState['${stateKey}'].idx=${targetIdx};const ep=gs.episodeHistory.find(e=>e.num===${ep.num});if(ep){buildVPScreens(ep);renderVPScreen();}`;

  let html = `<div class="rp-page tod-deepnight">
    <div class="rp-eyebrow">Episode ${ep.num}</div>
    <div style="font-family:var(--font-display);font-size:28px;letter-spacing:2px;text-align:center;color:var(--accent-gold);text-shadow:0 0 20px var(--accent-gold);margin-bottom:20px;animation:scrollDrop 0.5s var(--ease-broadcast) both">FIRST IMPRESSIONS</div>
    <div style="text-align:center;font-size:13px;color:#8b949e;margin-bottom:8px">No camp. No alliances. No strategy. Just gut feeling.</div>
    <div style="text-align:center;font-size:12px;color:#6e7681;margin-bottom:20px">Each tribe must vote one person out immediately. But this is not what it seems.</div>`;

  visibleSteps.forEach(step => {
    if (step.type === 'tribe-header') {
      html += `<div style="font-family:var(--font-display);font-size:18px;color:#e6edf3;text-align:center;margin:20px 0 10px;letter-spacing:1px;border-top:1px solid rgba(255,255,255,0.06);padding-top:16px">${step.tribe}</div>`;
    } else if (step.type === 'vote') {
      html += `<div class="vp-card" style="border-color:rgba(129,140,248,0.15);margin-bottom:6px;animation:scrollDrop 0.3s var(--ease-broadcast) both">
        <div style="display:flex;align-items:center;gap:10px">
          ${rpPortrait(step.voter, 'sm')}
          <div style="flex:1">
            <div style="font-size:12px;color:#cdd9e5"><strong>${step.voter}</strong> voted for <strong style="color:#f47067">${step.voted}</strong></div>
            ${step.reason ? `<div style="font-size:10px;color:#8b949e;margin-top:2px">${step.reason}</div>` : ''}
          </div>
        </div>
      </div>`;
    } else if (step.type === 'target') {
      const sortedVotes = Object.entries(step.votes).sort(([,a],[,b]) => b - a);
      html += `<div style="text-align:center;margin:14px 0;padding:12px;background:rgba(244,112,103,0.08);border:1px solid rgba(244,112,103,0.2);border-radius:8px;animation:scrollDrop 0.4s var(--ease-broadcast) both">
        ${rpPortrait(step.votedOut, 'md')}
        <div style="font-family:var(--font-display);font-size:16px;color:#f47067;margin-top:8px">${step.votedOut}</div>
        <div style="font-size:11px;color:#8b949e;margin-top:4px">${sortedVotes.map(([n,c]) => `${n}: ${c}`).join(' \u00b7 ')}</div>
        <div style="font-size:13px;color:#e6edf3;margin-top:8px">The tribe has spoken. ${step.votedOut}, bring me your torch.</div>
      </div>`;
    } else if (step.type === 'twist-reveal') {
      const pr = pronouns(step.votedOut);
      html += `<div style="text-align:center;margin:14px 0;padding:16px;background:rgba(227,179,65,0.08);border:1px solid rgba(227,179,65,0.25);border-radius:8px;animation:scrollDrop 0.5s var(--ease-broadcast) both">
        <div style="font-family:var(--font-display);font-size:20px;color:var(--accent-gold);letter-spacing:2px;text-shadow:0 0 15px var(--accent-gold)">TWIST</div>
        <div style="font-size:14px;color:#e6edf3;margin-top:10px">${step.votedOut} is <strong>not</strong> going home.</div>
        <div style="font-size:12px;color:#8b949e;margin-top:6px">${pr.Sub} ${pr.sub==='they'?'don\'t':'doesn\'t'} know it yet — but ${pr.pos} game just changed completely.</div>
      </div>`;
    } else if (step.type === 'swap-announce') {
      html += `<div style="text-align:center;margin:20px 0 10px;padding-top:16px;border-top:1px solid rgba(255,255,255,0.06)">
        <div style="font-family:var(--font-display);font-size:18px;color:var(--accent-gold);letter-spacing:2px;margin-bottom:6px">THE SWAP</div>
        <div style="font-size:12px;color:#8b949e;margin-bottom:14px">The voted-out players aren't eliminated — they're switching tribes.</div>`;
      step.tribes.forEach(t => {
        html += `<div style="display:flex;align-items:center;justify-content:center;gap:12px;margin-bottom:12px;animation:scrollDrop 0.4s var(--ease-broadcast) both">
          ${rpPortrait(t.votedOut, 'md')}
          <div style="text-align:left">
            <div style="font-size:14px;color:#e6edf3"><strong>${t.votedOut}</strong></div>
            <div style="font-size:12px;color:#8b949e">${t.tribe} <span style="color:var(--accent-gold)">\u2192</span> ${t.sentTo}</div>
          </div>
        </div>`;
      });
      // New tribe compositions
      html += `<div style="margin-top:16px;border-top:1px solid rgba(255,255,255,0.06);padding-top:14px">
        <div style="font-size:11px;font-weight:700;letter-spacing:1.5px;color:#8b949e;margin-bottom:10px">NEW TRIBE COMPOSITIONS</div>`;
      (twistObj.newTribes || []).forEach(t => {
        html += `<div style="margin-bottom:10px">
          <div style="font-size:13px;font-weight:700;color:#e6edf3;margin-bottom:6px">${t.name}</div>
          <div style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center">${t.members.map(m => rpPortrait(m, 'sm')).join('')}</div>
        </div>`;
      });
      html += `</div></div>`;
    }
  });

  // Reveal controls
  if (!allRevealed) {
    html += `<div style="text-align:center;margin-top:16px">
      <button class="rp-btn" onclick="${_fiReveal(state.idx + 1)}">Reveal Next</button>
      <button class="rp-btn" style="margin-left:8px;opacity:0.6" onclick="${_fiReveal(steps.length - 1)}">Reveal All</button>
    </div>`;
  }

  html += `</div>`;
  return html;
}

// ── Screen 3: Pre-challenge twists (tribe swap, three gifts, journey, exile-island, etc.) ──
export function rpBuildPreTwist(ep) {
  const _rawTwistData = (ep.twistScenes?.length ? ep.twistScenes : generateTwistScenes(ep))
    .filter(t => t.type !== 'exile-island' && t.type !== 'jury-elimination' && t.type !== 'kidnapping' && t.type !== 'first-impressions' && t.type !== 'tied-destinies' && t.type !== 'aftermath' && t.type !== 'fan-vote-return' && t.type !== 'schoolyard-pick' && t.type !== 'triple-dog-dare' && t.type !== 'say-uncle' && t.type !== 'phobia-factor' && t.type !== 'cliff-dive' && t.type !== 'awake-a-thon' && t.type !== 'emissary-vote' && t.type !== 'dodgebrawl' && t.type !== 'talent-show' && t.type !== 'sucky-outdoors' && t.type !== 'up-the-creek' && t.type !== 'paintball-hunt' && t.type !== 'hells-kitchen' && t.type !== 'trust-challenge' && t.type !== 'hide-and-be-sneaky' && t.type !== 'off-the-chain'); // shown in dedicated screens
  // Deduplicate: only show one scene per twist type (prevents double display if twist is in ep.twists twice)
  const _seenTypes = new Set();
  const twistData = _rawTwistData.filter(t => { if (_seenTypes.has(t.type)) return false; _seenTypes.add(t.type); return true; });
  if (!twistData.length) {
    // Text-only fallback for older saves — exclude exile island lines (shown in its own screen)
    const parsed = parseSummaryText(ep.summaryText || '');
    const _noPostVote = l => !l.includes('Exile Island') && !l.startsWith('EXILE ISLAND')
                          && !l.startsWith('ELIMINATION SWAP') && !l.startsWith('EXILE DUEL')
                          && !l.startsWith('JURY ELIMINATION') && !l.includes('eliminated by the jury')
                          && !l.startsWith('SPIRIT ISLAND')
                          && !(ep.swapResult && l.includes(' in exchange'))
                          && !(ep.swapResult && l.startsWith('New ') && l.includes('member:'))
                          && !l.startsWith('Next episode:')
                          && !(ep.swapResult && l.includes('chose') && l.includes('to go back'))
                          && !l.startsWith('FIRE MAKING');
    const hasTwistText = (parsed['TWIST']||[]).some(l=>l.trim() && _noPostVote(l))
                      || (parsed['JOURNEY']||[]).some(l=>l.trim());
    if (!hasTwistText) return null;
    const lines = [...(parsed['TWIST']||[]).filter(_noPostVote), ...(parsed['JOURNEY']||[])].filter(l=>l.trim());
    if (!lines.length) return null;
    return `<div class="rp-page rp-twist-page tod-dusk">
      <div class="rp-eyebrow">Episode ${ep.num}</div>
      <div class="rp-twist-title">Twists &amp; Events</div>
      <div class="rp-scene"><div class="rp-scene-text">${lines.join('<br>')}</div></div>
    </div>`;
  }
  const _swapTypes = ['tribe-swap','tribe-dissolve','tribe-expansion','abduction','kidnapping','mutiny'];
  const _hasSwap = (ep.twists||[]).some(t => _swapTypes.includes(t.type)) || _swapTypes.includes(ep.twist?.type);
  let html = `<div class="rp-page rp-twist-page tod-dusk"><div class="rp-eyebrow">Episode ${ep.num}</div>`;
  if (_hasSwap) {
    html += `<div style="font-family:var(--font-display);font-size:28px;letter-spacing:2px;text-align:center;color:var(--accent-gold);text-shadow:0 0 20px var(--accent-gold);margin-bottom:20px;animation:scrollDrop 0.5s var(--ease-broadcast) both">EVERYTHING JUST CHANGED</div>`;
  }
  twistData.forEach((twObj, idx) => {
    if (idx > 0) html += `<hr class="rp-twist-divider">`;
    html += `<div class="rp-twist-title">${twObj.label}</div>`;
    twObj.scenes.forEach(s => { html += _renderTwistScene(s); });
  });
  html += `</div>`;
  return html;
}

// ── After The Votes: post-elimination consequences (exile, swap, fire-making, jury-elimination) ──
export function rpBuildPostElimTwist(ep) {
  const blocks = _buildPostTwistBlocks(ep);
  if (!blocks.length) return null;
  let html = `<div class="rp-page rp-twist-page tod-deepnight"><div class="rp-eyebrow">Episode ${ep.num}</div>`;
  blocks.forEach((block, idx) => {
    if (idx > 0) html += `<hr class="rp-twist-divider">`;
    if (block.darkCeremony) html += `<div style="background:#030507;margin:-16px;padding:16px;border-radius:8px">`;
    html += `<div class="rp-twist-title">${block.label}</div>`;
    block.scenes.forEach(s => { html += _renderTwistScene(s); });
    if (block.darkCeremony) html += `</div>`;
  });
  // ── Exile duel loser elimination card (shown here, after the duel result scenes) ──
  if (ep.exileDuelResult) {
    const _dr = ep.exileDuelResult;
    const _place = (ep.gsSnapshot?.activePlayers ?? gs.activePlayers).length + 1;
    const _elimQ = vpGenerateQuote(_dr.loser, ep, 'eliminated');
    html += `<hr class="rp-twist-divider"><div class="rp-elim">
      <div class="rp-elim-eyebrow">${ordinal(_place)} player eliminated</div>
      ${rpPortrait(_dr.loser, 'xl elim')}
      <div class="rp-elim-name">${_dr.loser}</div>
      <div class="rp-elim-arch">${vpArchLabel(_dr.loser)}</div>
      <div class="rp-elim-quote">"${_elimQ}"</div>
      <div class="rp-elim-place">Eliminated via Duel — Episode ${ep.num}</div>
    </div>`;
  }
  // ── Second Life (fire-making) loser elimination card + WHY ──
  if (ep.fireMaking) {
    const _fm = ep.fireMaking;
    const _fmLoser = _fm.loser;
    const _fmWinner = _fm.winner;
    const _fmVotedOut = _fm.player;
    const _place = (ep.gsSnapshot?.activePlayers ?? gs.activePlayers).length + 1;
    const _fmElimQ = vpGenerateQuote(_fmLoser, ep, 'eliminated');
    // Elimination card
    html += `<hr class="rp-twist-divider"><div class="rp-elim">
      <div class="rp-elim-eyebrow">${ordinal(_place)} player eliminated</div>
      ${rpPortrait(_fmLoser, 'xl elim')}
      <div class="rp-elim-name">${_fmLoser}</div>
      <div class="rp-elim-arch">${vpArchLabel(_fmLoser)}</div>
      <div class="rp-elim-quote">"${_fmElimQ}"</div>
      <div class="rp-elim-place">Eliminated in Second Life — Episode ${ep.num}</div>
    </div>`;
    // Torch snuff for the fire-making loser
    html += `<div id="torch-snuff-sl-${ep.num}" style="text-align:center;margin-top:24px">
      <div class="torch-snuffed">${rpPortrait(_fmLoser, 'xl')}</div>
      <div style="font-family:var(--font-display);font-size:24px;color:var(--accent-fire);margin-top:16px;text-shadow:0 0 12px var(--accent-fire)">The tribe has spoken.</div>
    </div>`;
    // Crashout — the eliminated player's last words (if applicable)
    const _fmCrashout = buildCrashout({ ...ep, eliminated: _fmLoser });
    const _fmBlowup = ep.tribalBlowup?.player === _fmLoser ? ep.tribalBlowup : null;
    if (_fmBlowup) {
      html += `<div class="tc-crashout" style="margin-top:20px">
        <div class="tc-crashout-header">${rpPortrait(_fmLoser, 'sm')}<div>
          <div class="tc-crashout-badge" style="background:rgba(248,81,73,0.15);color:#f85149">TRIBAL BLOWUP</div>
          <div class="tc-crashout-title">${_fmLoser} — Goes Out Swinging</div>
        </div></div>
        <div class="tc-crashout-reveal">${_fmBlowup.reveals.map(({text,consequence}) => `<div class="tc-crashout-item"><div class="tc-crashout-quote">"${text}"</div><div class="tc-crashout-consequence">↳ ${consequence}</div></div>`).join('')}</div></div>`;
    } else if (_fmCrashout) {
      html += `<div class="tc-crashout" style="margin-top:20px">
        <div class="tc-crashout-header">${rpPortrait(_fmCrashout.player, 'sm')}<div>
          <div class="tc-crashout-badge">CRASHOUT</div>
          <div class="tc-crashout-title">${_fmCrashout.player} — Last Words</div>
        </div></div>
        <div class="tc-crashout-reveal">${_fmCrashout.reveals.map(({text,consequence}) => `<div class="tc-crashout-item"><div class="tc-crashout-quote">"${text}"</div><div class="tc-crashout-consequence">↳ ${consequence}</div></div>`).join('')}</div></div>`;
    }
    // WHY card for the Second Life loser — uses same vpWhyCard style as the votes page
    const _fmDuelLabel = _fm.duelName || 'Fire-Making';
    const _fmWhyBullets = [];
    if (_fmLoser !== _fmVotedOut) {
      _fmWhyBullets.push(`${_fmVotedOut} was voted out and activated Second Life — picked ${_fmLoser} for the ${_fmDuelLabel} duel.`);
      _fmWhyBullets.push(`Lost the ${_fmDuelLabel} duel to ${_fmWinner}.`);
    } else {
      _fmWhyBullets.push(`Voted out at tribal council, then lost the Second Life ${_fmDuelLabel} duel to ${_fmWinner}.`);
    }
    html += `<div style="margin-top:28px;border-top:1px solid #21262d;padding-top:20px;max-width:600px;margin-left:auto;margin-right:auto">
      <div style="font-size:9px;font-weight:800;letter-spacing:2px;color:#484f58;margin-bottom:14px">=== WHY ${_fmLoser.toUpperCase()} WAS ELIMINATED ===</div>
      ${vpWhyCard(_fmLoser, _fmWhyBullets, `${_fmLoser} — Eliminated in Second Life`)}
    </div>`;
  }
  html += `</div>`;
  return html;
}

// ── RI Duel Screen ──
export function rpBuildRIDuel(ep) {
  const duel = ep.riDuel;
  if (!duel) return null;
  const { winner, loser, challengeLabel, challengeDesc, challengeType, isThreeWay, duelists, survivors } = duel;
  const prW = pronouns(winner);
  const prL = pronouns(loser);

  // Pre-duel tension events (from riLifeEvents)
  const preDuelEvts = (ep.riLifeEvents || []).filter(e =>
    ['sizing-up','history','enemy-arrives','ally-arrives','trash-talk'].includes(e.type));
  const postDuelEvts = (ep.riLifeEvents || []).filter(e =>
    ['winner-relief','winner-hardened','loser-graceful','loser-bitter','loser-emotional'].includes(e.type));

  // Suspense narration by challenge type — adapted for 2-way vs 3-way
  const _allNames = duelists || [winner, loser];
  const _riNarration2 = {
    'fire-making': [
      `Both players strike their flint. Sparks fly. Nothing catches.`,
      `${winner}'s flame flickers to life \u2014 then dies. ${loser} blows gently on a tiny ember.`,
      `${winner}'s fire grows. The flag burns through. It's over.`,
    ],
    'speed-puzzle': [
      `The pieces scatter across the table. Both players scramble.`,
      `${loser} jams a piece into place. Wrong fit. ${winner} slides one in smoothly.`,
      `${winner} slots the final piece. Done.`,
    ],
    'endurance-hold': [
      `Both players lock in. Arms trembling. Neither blinks.`,
      `Fifteen minutes in. ${loser}'s legs are shaking. ${winner} stares straight ahead.`,
      `${loser} drops. ${winner} exhales. Still standing.`,
    ],
    'precision-toss': [
      `First ring. Both miss. Second ring. ${winner} lands one.`,
      `${loser} adjusts ${prL.pos} grip. Close \u2014 but off the post.`,
      `${winner} lands the final ring. Clean.`,
    ],
    'balance-beam': [
      `Both players step onto the beam. The blocks sway.`,
      `${loser}'s stack wobbles. ${prL.Sub} steady${prL.sub==='they'?'':'s'} it \u2014 barely.`,
      `${winner} reaches the end. Blocks intact. ${loser}'s stack falls.`,
    ],
    'memory': [
      `The sequence flashes. Six symbols. Both players study.`,
      `${loser} hesitates at the fourth symbol. ${winner} moves without pause.`,
      `${winner} recreates the full sequence. Perfect.`,
    ],
  };
  const _riNarration3 = {
    'fire-making': [
      `Three flints strike. Three sets of sparks. The beach is quiet except for the scraping.`,
      `${winner} gets a flame first. ${loser} is still struggling. The pressure is visible.`,
      `${winner}'s fire catches the flag. ${loser} never got close.`,
    ],
    'speed-puzzle': [
      `Three puzzle stations. Three players scrambling. The race is on.`,
      `${winner} finds a rhythm. ${loser} is falling behind \u2014 pieces aren't fitting.`,
      `${winner} slams the last piece into place. ${loser} stares at an unfinished board.`,
    ],
    'endurance-hold': [
      `Three players locked in. Nobody moves. Nobody speaks.`,
      `${loser} shifts weight. Tries to recover. It's slipping.`,
      `${loser} drops. The other two exhale \u2014 but only one of them looked comfortable.`,
    ],
    'precision-toss': [
      `Three players. Three sets of rings. First round \u2014 everyone misses.`,
      `${winner} lands two in a row. ${loser} can't find the range.`,
      `${winner} hits the final post. ${loser} walks away from the platform.`,
    ],
    'balance-beam': [
      `Three players step onto the beams. Blocks stacked. The wind picks up.`,
      `${loser}'s stack lists sideways. ${prL.Sub} grab${prL.sub==='they'?'':'s'} for it \u2014 too late.`,
      `${winner} crosses clean. ${loser} watches from the sand.`,
    ],
    'memory': [
      `The sequence flashes. Eight symbols this time. Three players study.`,
      `${winner} moves fast and sure. ${loser} second-guesses the fourth symbol.`,
      `${winner} finishes first. ${loser}'s board doesn't match.`,
    ],
  };
  const narration = isThreeWay
    ? (_riNarration3[challengeType] || _riNarration3['fire-making'])
    : (_riNarration2[challengeType] || _riNarration2['fire-making']);

  const _duelTitle = isThreeWay ? 'THREE-WAY DUEL' : 'REDEMPTION ISLAND DUEL';

  let html = `<div class="rp-page tod-arena">
    <div class="rp-eyebrow">Episode ${ep.num} \u2014 Redemption Island</div>
    <div style="font-family:var(--font-display);font-size:32px;letter-spacing:2px;text-align:center;margin-bottom:8px">${_duelTitle}</div>`;

  // Challenge type badge
  if (challengeLabel) {
    html += `<div style="text-align:center;margin-bottom:20px">
      <span class="rp-chal-type" style="display:inline-block;background:rgba(227,179,65,0.15);color:#e3b341;padding:4px 14px;border-radius:12px;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase">${challengeLabel}</span>
      ${challengeDesc ? `<div style="font-size:12px;color:#8b949e;margin-top:6px">${challengeDesc}</div>` : ''}
    </div>`;
  }

  // Face-off layout — 2-way or 3-way
  if (isThreeWay && _allNames.length >= 3) {
    html += `<div style="display:flex;justify-content:center;align-items:flex-start;gap:20px;margin-bottom:24px;flex-wrap:wrap">`;
    _allNames.forEach((name, i) => {
      const isLoser = name === loser;
      const isWinner = name === winner;
      const opacity = isLoser ? 'opacity:0.6;' : '';
      html += `<div style="text-align:center;${opacity}">
        ${rpPortrait(name, 'lg')}
        <div style="font-family:var(--font-display);font-size:13px;margin-top:8px">${name}</div>
        <div style="font-size:10px;color:#8b949e">${vpArchLabel(name)}</div>
      </div>`;
      if (i < _allNames.length - 1) {
        html += `<div style="font-family:var(--font-display);font-size:24px;color:var(--accent-fire);align-self:center;text-shadow:0 0 8px rgba(218,54,51,0.3)">VS</div>`;
      }
    });
    html += `</div>`;
  } else {
    html += `<div style="display:flex;justify-content:center;align-items:flex-start;gap:32px;margin-bottom:24px">
      <div style="text-align:center">
        ${rpPortrait(winner, 'xl')}
        <div style="font-family:var(--font-display);font-size:14px;margin-top:8px">${winner}</div>
        <div style="font-size:10px;color:#8b949e">${vpArchLabel(winner)}</div>
      </div>
      <div style="font-family:var(--font-display);font-size:36px;color:var(--accent-fire);align-self:center;text-shadow:0 0 12px rgba(218,54,51,0.4)">VS</div>
      <div style="text-align:center">
        ${rpPortrait(loser, 'xl')}
        <div style="font-family:var(--font-display);font-size:14px;margin-top:8px">${loser}</div>
        <div style="font-size:10px;color:#8b949e">${vpArchLabel(loser)}</div>
      </div>
    </div>`;
  }

  // Pre-duel tension
  if (preDuelEvts.length) {
    preDuelEvts.forEach(evt => {
      html += `<div class="vp-card" style="border-color:rgba(139,148,158,0.2);margin-bottom:8px">
        <div style="font-size:12px;color:#cdd9e5;line-height:1.6;font-style:italic">${evt.text}</div>
      </div>`;
    });
  }

  // Suspense narration
  html += `<div style="margin:16px 0;padding:12px 16px;border-left:3px solid var(--accent-fire);background:rgba(218,54,51,0.05);border-radius:0 8px 8px 0">`;
  narration.forEach((line, i) => {
    html += `<div style="font-size:12px;color:#cdd9e5;line-height:1.8;${i > 0 ? 'margin-top:8px;' : ''}">${line}</div>`;
  });
  html += `</div>`;

  // Result badges — survivors stay, loser eliminated
  const _survivors = survivors || [winner];
  html += `<div style="display:flex;justify-content:center;gap:20px;margin:20px 0;flex-wrap:wrap">`;
  _survivors.forEach(s => {
    html += `<div class="vp-card" style="border-color:rgba(63,185,80,0.3);background:rgba(63,185,80,0.05);display:flex;flex-direction:column;align-items:center;padding:16px 20px;min-width:120px">
        ${rpPortrait(s, 'md')}
        <span class="rp-brant-badge green" style="margin-top:8px;display:inline-block">STAYS</span>
    </div>`;
  });
  html += `<div class="vp-card" style="border-color:rgba(218,54,51,0.3);background:rgba(218,54,51,0.05);display:flex;flex-direction:column;align-items:center;padding:16px 20px;min-width:120px">
        ${rpPortrait(loser, 'md')}
        <span class="rp-brant-badge red" style="margin-top:8px;display:inline-block">ELIMINATED</span>
    </div>`;
  html += `</div>`;

  // Post-duel reaction
  if (postDuelEvts.length) {
    postDuelEvts.forEach(evt => {
      html += `<div class="vp-card" style="border-color:rgba(139,148,158,0.15);margin-bottom:8px">
        <div style="font-size:12px;color:#cdd9e5;line-height:1.6">${evt.text}</div>
      </div>`;
    });
  }

  // Torch snuff for loser
  const _stayText = _survivors.length > 1
    ? `${_survivors.join(' and ')} remain on Redemption Island.`
    : `${winner} remains on Redemption Island.`;
  html += `<div style="text-align:center;margin-top:20px">
    <div class="torch-snuffed">${rpPortrait(loser, 'xl')}</div>
    <div style="font-family:var(--font-display);font-size:20px;color:var(--accent-fire);margin-top:12px;text-shadow:0 0 12px var(--accent-fire)">The duel has spoken.</div>
    <div style="font-size:12px;color:#8b949e;margin-top:6px">${_stayText} ${loser} has been permanently eliminated.</div>
  </div>`;

  html += `</div>`;
  return html;
}

export function rpBuildRILife(ep) {
  const lifeEvts = ep.riLifeEvents || [];
  // Only show solo/pre-duel life events (post-duel events are shown on the duel screen)
  const evts = lifeEvts.filter(e =>
    ['processing','training','reflection','motivation','sizing-up','history','enemy-arrives','ally-arrives','trash-talk'].includes(e.type));
  if (!evts.length) return null;

  // Use pre-duel snapshot so portraits don't spoil who wins the duel
  const riPlayers = ep.riPlayersPreDuel || ep.gsSnapshot?.riPlayers || [];
  const epNum = ep.num || 0;

  const _badgeForType = t => {
    if (t === 'processing') return { text: 'Processing', cls: '' };
    if (t === 'training') return { text: 'Training', cls: 'win' };
    if (t === 'reflection') return { text: 'Reflection', cls: '' };
    if (t === 'motivation') return { text: 'Motivation', cls: 'gold' };
    if (t === 'sizing-up') return { text: 'Sizing Up', cls: 'bad' };
    if (t === 'history') return { text: 'Shared History', cls: '' };
    if (t === 'enemy-arrives') return { text: 'Rivals', cls: 'bad' };
    if (t === 'ally-arrives') return { text: 'Old Friends', cls: 'win' };
    if (t === 'trash-talk') return { text: 'Trash Talk', cls: 'bad' };
    return { text: 'RI Life', cls: '' };
  };

  let html = `<div class="rp-page tod-deepnight">
    <div class="rp-eyebrow">Episode ${epNum} \u2014 Redemption Island</div>
    <div style="font-family:var(--font-display);font-size:28px;letter-spacing:2px;text-align:center;margin-bottom:8px;color:#e3b341">REDEMPTION ISLAND</div>
    <div style="text-align:center;font-size:12px;color:#8b949e;margin-bottom:20px">Life on the edge of the game</div>`;

  // Show resident portraits
  if (riPlayers.length) {
    html += `<div style="display:flex;justify-content:center;gap:16px;margin-bottom:20px">`;
    riPlayers.forEach(name => {
      const daysOnRI = (gs.riLifeEvents?.[name] || []).filter(e => e.ep <= epNum).length;
      html += `<div style="text-align:center">
        ${rpPortrait(name, 'lg')}
        <div style="font-family:var(--font-display);font-size:13px;margin-top:6px">${name}</div>
        <div style="font-size:10px;color:#8b949e">${daysOnRI > 0 ? `Day ${daysOnRI} on RI` : 'Just arrived'}</div>
      </div>`;
    });
    html += `</div>`;
  }

  // Life event cards
  evts.forEach(evt => {
    const badge = _badgeForType(evt.type);
    html += `<div class="vp-card" style="border-color:rgba(227,179,65,0.15);margin-bottom:10px">
      <div style="display:flex;align-items:flex-start;gap:10px">
        ${evt.player ? rpPortrait(evt.player, 'sm') : ''}
        ${evt.player2 ? rpPortrait(evt.player2, 'sm') : ''}
        <div style="flex:1">
          <div style="font-size:12px;color:#cdd9e5;line-height:1.6">${evt.text}</div>
          ${badge.text ? `<span class="rp-brant-badge ${badge.cls}" style="margin-top:6px;font-size:9px">${badge.text}</span>` : ''}
        </div>
      </div>
    </div>`;
  });

  html += `</div>`;
  return html;
}

// ── Rescue Island Life VP Screen ──
export function rpBuildRIReturn(ep) {
  const ri = ep.riReentry;
  if (!ri?.winner) return null;
  const winner = ri.winner;
  const losers = ri.losers || [];
  const isRescue = seasonConfig.riFormat === 'rescue';
  const _wp = pronouns(winner);

  let html = `<div class="rp-page tod-golden">
    <div class="rp-eyebrow">Episode ${ep.num}</div>
    <div style="font-family:var(--font-display);font-size:28px;letter-spacing:2px;text-align:center;margin-bottom:8px;color:#e3b341">
      ${isRescue ? 'RETURN FROM RESCUE ISLAND' : 'RETURN FROM REDEMPTION ISLAND'}
    </div>
    <div style="text-align:center;font-size:14px;color:#8b949e;margin-bottom:24px">
      ${isRescue ? `${losers.length + 1} players competed. One returns.` : `The last player standing on Redemption Island re-enters the game.`}
    </div>`;

  // Winner reveal
  html += `<div style="display:flex;justify-content:center;margin-bottom:24px">
    <div style="text-align:center;border:3px solid var(--accent-gold);border-radius:16px;padding:20px 32px;background:rgba(227,179,65,0.06);box-shadow:0 0 40px rgba(227,179,65,0.15)">
      <div style="display:flex;justify-content:center">${rpPortrait(winner, 'xl')}</div>
      <div style="font-family:var(--font-display);font-size:22px;letter-spacing:2px;color:var(--accent-gold);margin-top:12px">${winner}</div>
      <div style="font-size:11px;color:var(--muted);margin-top:4px">${vpArchLabel(winner)}</div>
      <span class="rp-brant-badge gold" style="margin-top:8px;display:inline-block">RETURNS TO THE GAME</span>
    </div>
  </div>`;

  // Challenge info
  if (ri.challengeLabel) {
    html += `<div style="text-align:center;font-size:13px;color:#8b949e;margin-bottom:16px">
      Return challenge: <strong style="color:#e6edf3">${ri.challengeLabel}</strong>
    </div>`;
  }

  // Winner quote
  const _quote = vpGenerateQuote(winner, ep, 'returning');
  html += `<div style="background:rgba(227,179,65,0.05);border:1px solid rgba(227,179,65,0.15);border-radius:10px;padding:14px;margin-bottom:20px;max-width:480px;margin-left:auto;margin-right:auto">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
      ${rpPortrait(winner, 'sm')}
      <div style="font-size:9px;font-weight:700;letter-spacing:1px;color:var(--accent-gold)">RETURNING CONFESSIONAL</div>
    </div>
    <div style="font-size:13px;color:#c9d1d9;line-height:1.7;font-style:italic">"They voted me out. I fought my way back. And now every single person who wrote my name is going to have to look me in the eye."</div>
  </div>`;

  // Losers
  if (losers.length) {
    html += `<div style="font-size:9px;font-weight:700;letter-spacing:2px;color:var(--muted);text-transform:uppercase;margin-bottom:10px;text-align:center">
      ${isRescue ? 'Join the Jury' : 'Eliminated'}
    </div>
    <div style="display:flex;flex-wrap:wrap;justify-content:center;gap:12px;margin-bottom:16px">
      ${losers.map(l => `<div style="text-align:center;opacity:0.6">
        ${rpPortrait(l, 'sm elim')}
        <div style="font-size:10px;color:#8b949e;margin-top:4px">${l}</div>
      </div>`).join('')}
    </div>`;
  }

  html += `</div>`;
  return html;
}

export function rpBuildRescueIslandLife(ep) {
  const evts = ep.rescueIslandEvents || [];
  if (!evts.length) return null;

  const riPlayers = ep.gsSnapshot?.riPlayers || [];
  const epNum = ep.num || 0;
  const riArrivalEp = ep.gsSnapshot?.riArrivalEp || gs.riArrivalEp || {};

  const _badgeForType = t => {
    if (t === 'processing') return { text: 'PROCESSING', cls: '' };
    if (t === 'bonding') return { text: 'BONDING', cls: 'win' };
    if (t === 'rivalry') return { text: 'RIVALRY', cls: 'bad' };
    if (t === 'game-talk') return { text: 'GAME TALK', cls: 'gold' };
    if (t === 'struggling') return { text: 'STRUGGLING', cls: 'bad' };
    if (t === 'thriving') return { text: 'THRIVING', cls: 'win' };
    if (t === 'quit-temptation') return { text: 'WAVERING', cls: '' };
    if (t === 'quit') return { text: 'QUIT', cls: 'bad' };
    return { text: 'RESCUE ISLAND', cls: '' };
  };

  let html = `<div class="rp-page tod-deepnight">
    <div class="rp-eyebrow">Episode ${epNum} — Rescue Island</div>
    <div style="font-family:var(--font-display);font-size:28px;letter-spacing:2px;text-align:center;margin-bottom:8px;color:#e3b341">RESCUE ISLAND</div>
    <div style="text-align:center;font-size:12px;color:#8b949e;margin-bottom:20px">${riPlayers.length} resident${riPlayers.length !== 1 ? 's' : ''} — fighting for one more chance</div>`;

  // Show resident portraits with day counter
  if (riPlayers.length) {
    html += `<div style="display:flex;flex-wrap:wrap;justify-content:center;gap:16px;margin-bottom:20px">`;
    riPlayers.forEach(name => {
      const arrEp = riArrivalEp[name] || epNum;
      const daysOn = Math.max(1, epNum - arrEp + 1);
      html += `<div style="text-align:center">
        ${rpPortrait(name, 'lg')}
        <div style="font-family:var(--font-display);font-size:13px;margin-top:6px">${name}</div>
        <div style="font-size:10px;color:#8b949e">Day ${daysOn}</div>
      </div>`;
    });
    html += `</div>`;
  }

  // Event cards
  evts.forEach(evt => {
    const badge = _badgeForType(evt.type);
    const isQuit = evt.type === 'quit';
    const borderColor = isQuit ? 'rgba(239,68,68,0.4)' : 'rgba(227,179,65,0.15)';
    html += `<div class="vp-card" style="border-color:${borderColor};margin-bottom:10px${isQuit ? ';background:rgba(239,68,68,0.05)' : ''}">
      <div style="display:flex;align-items:flex-start;gap:10px">
        ${evt.player ? rpPortrait(evt.player, 'sm') : ''}
        ${evt.player2 ? rpPortrait(evt.player2, 'sm') : ''}
        <div style="flex:1">
          <div style="font-size:12px;color:#cdd9e5;line-height:1.6">${evt.text}</div>
          ${badge.text ? `<span class="rp-brant-badge ${badge.cls}" style="margin-top:6px;font-size:9px">${badge.text}</span>` : ''}
        </div>
      </div>
    </div>`;
  });

  html += `</div>`;
  return html;
}

// ── Rescue Island Return Challenge VP Screen ──
export function rpBuildRescueReturnChallenge(ep) {
  const rc = ep.rescueReturnChallenge;
  if (!rc) return null;

  const epNum = ep.num || 0;
  const winner = rc.winner;
  const losers = rc.losers || [];
  const allCompetitors = [winner, ...losers];

  let html = `<div class="rp-page tod-deepnight">
    <div class="rp-eyebrow">Episode ${epNum} — Return Challenge</div>
    <div style="font-family:var(--font-display);font-size:28px;letter-spacing:2px;text-align:center;margin-bottom:8px;color:#e3b341">THE RETURN</div>
    <div style="text-align:center;font-size:14px;color:#cdd9e5;margin-bottom:6px">From Rescue Island... ${allCompetitors.length} player${allCompetitors.length !== 1 ? 's' : ''} compete for one spot back in the game.</div>
    <div style="text-align:center;font-size:12px;color:#8b949e;margin-bottom:20px">Challenge: ${rc.challengeLabel || 'Unknown'}</div>`;

  // All competitor portraits
  html += `<div style="display:flex;flex-wrap:wrap;justify-content:center;gap:16px;margin-bottom:24px">`;
  allCompetitors.forEach(name => {
    const isWinner = name === winner;
    const borderStyle = isWinner ? 'border:3px solid #e3b341;box-shadow:0 0 12px rgba(227,179,65,0.4)' : 'border:2px solid #30363d;opacity:0.7';
    html += `<div style="text-align:center">
      <div style="border-radius:50%;overflow:hidden;${borderStyle};display:inline-block">
        ${rpPortrait(name, 'lg')}
      </div>
      <div style="font-family:var(--font-display);font-size:13px;margin-top:6px">${name}</div>
      <span class="rp-brant-badge ${isWinner ? 'gold' : ''}" style="margin-top:4px;font-size:9px${!isWinner ? ';opacity:0.6' : ''}">${isWinner ? 'RETURNS TO THE GAME' : 'JOINS THE JURY'}</span>
    </div>`;
  });
  html += `</div>`;

  // Winner spotlight
  const wPr = pronouns(winner);
  html += `<div class="vp-card" style="border-color:rgba(227,179,65,0.3);margin-bottom:10px">
    <div style="display:flex;align-items:flex-start;gap:10px">
      ${rpPortrait(winner, 'md')}
      <div style="flex:1">
        <div style="font-family:var(--font-display);font-size:15px;color:#e3b341;margin-bottom:4px">${winner}</div>
        <div style="font-size:12px;color:#cdd9e5;line-height:1.6;font-style:italic">"They said I was done. They were wrong. I fought my way back and I'm not leaving again."</div>
        <span class="rp-brant-badge gold" style="margin-top:6px;font-size:9px">BACK IN THE GAME</span>
      </div>
    </div>
  </div>`;

  // Losers summary
  if (losers.length) {
    html += `<div style="text-align:center;font-size:12px;color:#8b949e;margin-top:12px;margin-bottom:8px">${losers.length} player${losers.length !== 1 ? 's' : ''} join the jury</div>`;
    html += `<div style="display:flex;flex-wrap:wrap;justify-content:center;gap:8px">`;
    losers.forEach(name => {
      html += `<div style="text-align:center;opacity:0.6">
        ${rpPortrait(name, 'sm')}
        <div style="font-size:10px;color:#8b949e;margin-top:2px">${name}</div>
      </div>`;
    });
    html += `</div>`;
  }

  html += `</div>`;
  return html;
}

// ── Spirit Island VP Screen ──
export function rpBuildSpiritIsland(ep) {
  const evts = ep.spiritIslandEvents;
  if (!evts?.length) return null;
  const epNum = ep.num || 0;
  const _tw = (ep.twists || []).find(t => t.type === 'spirit-island' || t.catalogId === 'spirit-island');
  const visitor = _tw?.spiritVisitor;
  if (!visitor) return null;
  const _vPr = pronouns(visitor);
  const closest = _tw?.spiritClosest;
  const intel = _tw?.spiritIntel;
  const confrontation = _tw?.spiritConfrontation;

  const _badgeFor = t => {
    if (t === 'spirit-arrival') return { text: 'Arrival', cls: 'gold' };
    if (t === 'spirit-reunion') return { text: 'Reunion', cls: 'green' };
    if (t === 'spirit-tension') return { text: 'Tension', cls: 'red' };
    if (t === 'spirit-confrontation') return { text: confrontation?.type === 'explosive' ? 'Confrontation' : confrontation?.type === 'quiet' ? 'Quiet Warning' : 'Unfinished Business', cls: confrontation?.type === 'explosive' ? 'red' : confrontation?.type === 'quiet' ? 'gold' : '' };
    if (t === 'spirit-intel') return { text: 'Jury Intel', cls: 'gold' };
    if (t === 'spirit-departure') return { text: 'Departure', cls: '' };
    return { text: '', cls: '' };
  };

  let html = `<div class="rp-page tod-deepnight">
    <div class="rp-eyebrow">Episode ${epNum}</div>
    <div style="font-family:var(--font-display);font-size:32px;letter-spacing:2px;text-align:center;margin-bottom:4px;color:#818cf8;text-shadow:0 0 20px rgba(129,140,248,0.3)">SPIRIT ISLAND</div>
    <div style="text-align:center;font-size:12px;color:#8b949e;margin-bottom:24px">A jury member returns to camp for one day.</div>`;

  // Visitor portrait — large, centered
  html += `<div style="text-align:center;margin-bottom:24px">
    ${rpPortrait(visitor, 'xl')}
    <div style="font-family:var(--font-display);font-size:16px;margin-top:8px;color:#e6edf3">${visitor}</div>
    <div style="font-size:11px;color:#818cf8;font-weight:700;letter-spacing:1px;margin-top:4px">RETURNS FROM THE JURY</div>
  </div>`;

  // Event cards
  evts.forEach(evt => {
    const badge = evt.badgeText ? { text: evt.badgeText, cls: evt.badgeClass || '' } : _badgeFor(evt.type);
    const mentioned = evt.players || [];
    html += `<div class="vp-card" style="border-color:rgba(129,140,248,0.15);margin-bottom:10px">
      <div style="display:flex;align-items:flex-start;gap:10px">
        ${mentioned.length >= 2 ? mentioned.map(n => rpPortrait(n, 'sm')).join('') : mentioned.length === 1 ? rpPortrait(mentioned[0], 'sm') : ''}
        <div style="flex:1">
          <div style="font-size:12px;color:#cdd9e5;line-height:1.7">${evt.text}</div>
          ${badge.text ? `<span class="rp-brant-badge ${badge.cls}" style="margin-top:6px">${badge.text}</span>` : ''}
        </div>
      </div>
    </div>`;
  });

  // Summary footer
  html += `<div style="text-align:center;margin-top:20px;padding-top:16px;border-top:1px solid rgba(129,140,248,0.1)">
    <div style="font-size:12px;color:#8b949e;line-height:1.7">
      ${closest ? `${visitor} spent most of ${_vPr.posAdj} time with <strong style="color:#e6edf3">${closest}</strong>.` : ''}
      ${confrontation ? ` ${confrontation.type === 'explosive' ? 'The confrontation with ' + confrontation.betrayer + ' won\'t be forgotten.' : confrontation.type === 'quiet' ? 'A private warning was delivered.' : 'Some things went unsaid.'}` : ''}
      ${intel?.type === 'jury-respects' ? ` The jury has a favorite: <strong style="color:#e3b341">${intel.target}</strong>.` : intel?.type === 'jury-resents' ? ` The jury has a goat: <strong style="color:#f85149">${intel.target}</strong>.` : intel?.type === 'jury-split' ? ' The jury is wide open.' : ''}
    </div>
    <div style="font-size:11px;color:#484f58;margin-top:8px">The visitor returns to the jury. Tribal council proceeds as normal.</div>
  </div>`;

  html += `</div>`;
  return html;
}

// ── Post-elimination consequence blocks ──
// ── Second Chance Vote VP Screen ──
// ── Feast VP Screen ──
// ── Fan Vote Save VP Screen ──
export function rpBuildFanVote(ep) {
  const _tw = (ep.twists || []).find(t => t.type === 'fan-vote-boot' || t.catalogId === 'fan-vote-boot');
  if (!_tw?.fanVoteSaved) return null;
  const winner = _tw.fanVoteSaved;
  const results = _tw.fanVoteResults || [];
  const epNum = ep.num || 0;
  const _wPr = pronouns(winner);
  const _reward = _tw.fanVoteIsPreMerge ? 'Tribal Immunity' : 'Extra Vote';

  let html = `<div class="rp-page tod-golden">
    <div class="rp-eyebrow">Episode ${epNum}</div>
    <div style="font-family:var(--font-display);font-size:32px;letter-spacing:2px;text-align:center;margin-bottom:4px;color:#6366f1;text-shadow:0 0 20px rgba(99,102,241,0.3)">FAN VOTE</div>
    <div style="text-align:center;font-size:12px;color:#8b949e;margin-bottom:24px">The fans have voted. The most popular player receives a reward.</div>`;

  // Ranking — show all players with percentages
  if (results.length) {
    html += `<div style="margin-bottom:20px">`;
    results.forEach((r, i) => {
      const isWinner = r.name === winner;
      const barPct = Math.max(3, r.pct);
      html += `<div style="display:flex;align-items:center;gap:10px;padding:6px 0;${isWinner ? 'background:rgba(99,102,241,0.06);border-radius:6px;padding:8px' : ''}">
        <span style="font-family:var(--font-mono);font-size:10px;color:var(--muted);width:20px">${i+1}</span>
        ${rpPortrait(r.name)}
        <div style="flex:1">
          <div style="font-size:12px;color:${isWinner ? '#6366f1' : '#c9d1d9'};font-weight:${isWinner ? '700' : '400'}">${r.name}</div>
          <div style="height:4px;background:var(--surface2);border-radius:2px;margin-top:3px;overflow:hidden">
            <div style="height:100%;width:${barPct}%;background:${isWinner ? '#6366f1' : '#484f58'};border-radius:2px"></div>
          </div>
        </div>
        <span style="font-size:10px;color:${isWinner ? '#6366f1' : 'var(--muted)'};font-weight:${isWinner ? '700' : '400'}">${r.pct}%</span>
        ${isWinner ? '<span class="rp-brant-badge gold">FAN FAVORITE</span>' : ''}
      </div>`;
    });
    html += `</div>`;
  }

  // Winner announcement
  html += `<div style="text-align:center;padding:16px;border:1px solid rgba(99,102,241,0.3);border-radius:12px;background:rgba(99,102,241,0.04)">
    ${rpPortrait(winner, 'xl')}
    <div style="font-family:var(--font-display);font-size:18px;margin-top:10px;color:#6366f1">${winner}</div>
    <div style="font-size:11px;color:#e3b341;font-weight:700;letter-spacing:1px;margin-top:4px">${_reward}</div>
    <div style="font-size:12px;color:#8b949e;margin-top:10px;font-style:italic;max-width:400px;margin-left:auto;margin-right:auto;line-height:1.6">
      The fans see something the tribe might not. ${winner} is the most popular player in the game — and that comes with a target.
    </div>
  </div>`;

  html += `</div>`;
  return html;
}

export function rpBuildFeast(ep) {
  const evts = ep.feastEvents;
  if (!evts?.length) return null;
  const epNum = ep.num || 0;
  const _tw = (ep.twists || []).find(t => t.type === 'the-feast' || t.type === 'merge-reward' || t.catalogId === 'the-feast' || t.catalogId === 'merge-reward');
  const isMerge = _tw?.type === 'merge-reward' || _tw?.catalogId === 'merge-reward';
  const _title = isMerge ? 'THE MERGE FEAST' : 'THE FEAST';
  const _subtitle = isMerge ? 'The tribes are one. The game begins anew.' : 'All tribes. One table. No rules.';

  let html = `<div class="rp-page tod-golden">
    <div class="rp-eyebrow">Episode ${epNum}</div>
    <div style="font-family:var(--font-display);font-size:32px;letter-spacing:2px;text-align:center;margin-bottom:4px;color:#e3b341;text-shadow:0 0 20px rgba(227,179,65,0.3)">${_title}</div>
    <div style="text-align:center;font-size:12px;color:#8b949e;margin-bottom:24px">${_subtitle}</div>`;

  evts.forEach(evt => {
    const badge = evt.badgeText ? { text: evt.badgeText, cls: evt.badgeClass || '' } : { text: '', cls: '' };
    const mentioned = evt.players || [];
    html += `<div class="vp-card" style="border-color:rgba(227,179,65,0.15);margin-bottom:10px">
      <div style="display:flex;align-items:flex-start;gap:10px">
        ${mentioned.length >= 2 ? mentioned.map(n => rpPortrait(n, 'sm')).join('') : mentioned.length === 1 ? rpPortrait(mentioned[0], 'sm') : ''}
        <div style="flex:1">
          <div style="font-size:12px;color:#cdd9e5;line-height:1.7">${evt.text}</div>
          ${badge.text ? `<span class="rp-brant-badge ${badge.cls}" style="margin-top:6px">${badge.text}</span>` : ''}
        </div>
      </div>
    </div>`;
  });

  html += `</div>`;
  return html;
}

export function rpBuildSecondChanceVote(ep) {
  const _tw = (ep.twists || []).find(t => t.type === 'second-chance' || t.catalogId === 'second-chance' || (t.type === 'returning-player' && t.catalogId === 'second-chance'));
  if (!_tw?.returnee) return null;
  const returnee = _tw.returnee;
  const results = _tw.fanVoteResults || [];
  const epNum = ep.num || 0;
  const _rPr = pronouns(returnee);
  const _rS = pStats(returnee);

  // Reveal order: last-to-first (loser first, winner last for suspense)
  const revealOrder = results.length ? [...results].reverse() : [];
  const revealId = `scv-reveal-${epNum}`;

  let html = `<div class="rp-page tod-deepnight">
    <div class="rp-eyebrow">Episode ${epNum}</div>
    <div style="font-family:var(--font-display);font-size:32px;letter-spacing:2px;text-align:center;margin-bottom:4px;color:#e3b341;text-shadow:0 0 20px rgba(227,179,65,0.3)">SECOND CHANCE VOTE</div>
    <div style="text-align:center;font-size:12px;color:#8b949e;margin-bottom:24px">The fans have voted. One eliminated player returns to the game.</div>`;

  if (revealOrder.length) {
    // All candidates — interactive reveal
    html += `<div id="${revealId}" data-total="${revealOrder.length}" data-revealed="0">`;
    revealOrder.forEach((r, i) => {
      html += `<div class="scv-slot" id="${revealId}-slot-${i}" style="display:flex;align-items:center;gap:12px;padding:10px;margin-bottom:4px;border-radius:8px;border:1px solid var(--border);opacity:0.15;transition:all 0.4s">
        <span style="font-family:var(--font-mono);font-size:11px;color:var(--muted);width:24px">${results.length - i}</span>
        <span style="color:var(--muted)">?</span>
      </div>`;
    });
    html += `</div>`;

    // Reveal buttons
    html += `<div style="display:flex;gap:12px;margin-top:16px;align-items:center" id="scv-btn-wrap-${epNum}">
      <button onclick="scvRevealNext('${revealId}')" style="padding:8px 20px;background:var(--accent-gold);border:none;border-radius:6px;color:#0d1117;font-family:var(--font-display);font-size:13px;letter-spacing:1px;cursor:pointer;font-weight:700" id="scv-btn-${epNum}">REVEAL (0/${revealOrder.length})</button>
      <button onclick="scvRevealAll('${revealId}')" style="padding:6px 12px;background:transparent;border:1px solid var(--border);border-radius:6px;color:var(--muted);font-size:11px;cursor:pointer">See all results</button>
    </div>`;

    // Winner section — hidden until all revealed
    html += `<div id="scv-winner-${revealId}" style="display:none">`;
  } else {
    // No vote data (old save) — show winner directly
    html += `<div>`;
  }

  // Winner display
  html += `<div style="text-align:center;margin-top:24px;padding:20px;border:1px solid rgba(227,179,65,0.3);border-radius:12px;background:rgba(227,179,65,0.04)">
    ${rpPortrait(returnee, 'xl')}
    <div style="font-family:var(--font-display);font-size:20px;margin-top:12px;color:#e3b341">${returnee}</div>
    <div style="font-size:11px;color:#e3b341;font-weight:700;letter-spacing:1px;margin-top:6px">RETURNS TO THE GAME</div>
    <div style="font-size:12px;color:#8b949e;margin-top:12px;font-style:italic;max-width:400px;margin-left:auto;margin-right:auto;line-height:1.6">${
      _rS.boldness >= 7 ? `"They thought they got rid of me. They were wrong. I'm back and I'm not playing nice this time."`
      : _rS.strategic >= 7 ? `"I've had time to think. I know exactly who did what and why. This time I play with perfect information."`
      : `"I never stopped believing I belonged here. The fans saw it. Now the tribe will see it too."`
    }</div>
  </div>`;
  html += `</div>`;

  html += `</div>`;
  return html;
}

// Interactive reveal functions for Second Chance Vote
if (typeof window !== 'undefined') {
  window.scvRevealNext = function(revealId) {
    const container = document.getElementById(revealId);
    if (!container) return;
    const total = parseInt(container.dataset.total);
    let revealed = parseInt(container.dataset.revealed);
    if (revealed >= total) return;
    const slot = document.getElementById(`${revealId}-slot-${revealed}`);
    if (!slot) return;
    // Get the data from the VP screen's twist data
    const ep = gs.episodeHistory.find(h => {
      const tw = (h.twists||[]).find(t => t.type === 'second-chance' || t.catalogId === 'second-chance');
      return tw?.fanVoteResults?.length;
    });
    const tw = ep ? (ep.twists||[]).find(t => t.type === 'second-chance' || t.catalogId === 'second-chance') : null;
    if (!tw?.fanVoteResults) return;
    const results = [...tw.fanVoteResults].reverse();
    const r = results[revealed];
    const isWinner = r.name === tw.returnee;
    slot.style.opacity = '1';
    slot.style.borderColor = isWinner ? 'rgba(227,179,65,0.4)' : 'rgba(139,148,158,0.2)';
    if (isWinner) slot.style.background = 'rgba(227,179,65,0.06)';
    slot.innerHTML = `
      <span style="font-family:var(--font-mono);font-size:11px;color:var(--muted);width:24px">${total - revealed}</span>
      ${rpPortrait(r.name)}
      <div style="flex:1;font-size:12px;color:${isWinner ? '#e3b341' : '#c9d1d9'};font-weight:${isWinner ? '700' : '400'}">${r.name}</div>
      ${isWinner ? '<span class="rp-brant-badge gold">RETURNS</span>' : `<span style="font-size:10px;color:var(--muted)">${r.pct}%</span>`}
    `;
    revealed++;
    container.dataset.revealed = revealed;
    const btn = document.querySelector(`#scv-btn-${revealId.split('-').pop()}`);
    if (btn) btn.textContent = revealed >= total ? 'All Revealed' : `REVEAL (${revealed}/${total})`;
    if (revealed >= total) {
      const winnerDiv = document.getElementById(`scv-winner-${revealId}`);
      if (winnerDiv) winnerDiv.style.display = 'block';
    }
  };
  window.scvRevealAll = function(revealId) {
    const container = document.getElementById(revealId);
    if (!container) return;
    const total = parseInt(container.dataset.total);
    while (parseInt(container.dataset.revealed) < total) {
      window.scvRevealNext(revealId);
    }
  };
  window.fanCampaignAdvance = function(key, totalPhases) {
    const container = document.getElementById(key);
    if (!container) return;
    const step = parseInt(container.dataset.step) || 0;
    if (step >= totalPhases) return;

    const phaseIdx = Math.floor(step / 3);
    const subPhase = step % 3;
    const baseId = `${key}-p${phaseIdx}`;

    // Dim previous finalist's section
    if (phaseIdx > 0 && subPhase === 0) {
      const prevBase = `${key}-p${phaseIdx - 1}`;
      ['spotlight', 'speech', 'jury'].forEach(s => {
        const el = document.getElementById(`${prevBase}-${s}`);
        if (el) el.style.opacity = '0.4';
      });
    }

    if (subPhase === 0) {
      // Show spotlight
      const el = document.getElementById(`${baseId}-spotlight`);
      if (el) { el.style.display = 'block'; setTimeout(() => el.style.opacity = '1', 50); }
    } else if (subPhase === 1) {
      // Show speech + animate pulse bars + pop fan pills
      const el = document.getElementById(`${baseId}-speech`);
      if (el) {
        el.style.display = 'block';
        setTimeout(() => {
          el.style.opacity = '1';
          // Animate bars
          for (let i = 0; i < 7; i++) {
            const bar = document.getElementById(`${baseId}-bar-${i}`);
            if (bar) bar.style.height = bar.dataset.targetHeight;
          }
          // Pop pills
          for (let i = 0; i < 5; i++) {
            const pill = document.getElementById(`${baseId}-pill-${i}`);
            if (pill) pill.style.opacity = '1';
          }
        }, 50);
      }
    } else if (subPhase === 2) {
      // Show jury reaction — auto-skip if no reaction for this finalist
      const el = document.getElementById(`${baseId}-jury`);
      if (el) { el.style.display = 'block'; setTimeout(() => el.style.opacity = '1', 50); }
      else { container.dataset.step = String(step + 1); fanCampaignAdvance(key, totalPhases); return; }
    }

    container.dataset.step = String(step + 1);
    const btn = document.getElementById(`${key}-btn`);
    if (btn) {
      if (step + 1 >= totalPhases) btn.textContent = 'BROADCAST COMPLETE';
      else {
        const labels = ['SHOW SPEECH', 'JURY REACTS', 'NEXT FINALIST'];
        const nextSub = (step + 1) % 3;
        btn.textContent = step + 1 >= totalPhases - 1 ? 'JURY REACTS' : labels[nextSub] || 'CONTINUE';
      }
    }
  };
  window.fanCampaignRevealAll = function(key, totalPhases) {
    const container = document.getElementById(key);
    if (!container) return;
    while ((parseInt(container.dataset.step) || 0) < totalPhases) {
      fanCampaignAdvance(key, totalPhases);
    }
    // Undim everything
    document.querySelectorAll(`[id^="${key}-p"]`).forEach(el => {
      if (el.style.opacity === '0.4') el.style.opacity = '1';
    });
  };

  window.fanVoteRevealNext = function(key) {
    const container = document.getElementById(key);
    if (!container) return;
    let step = parseInt(container.dataset.step);
    const total = parseInt(container.dataset.total);
    if (step >= total) return;
    step++;
    container.dataset.step = step;

    const pcts = container.dataset.pcts.split(',').map(Number);
    const names = container.dataset.names.split(',');
    const progress = step / total; // 0.0 to 1.0
    const isF2 = names.length === 2;

    if (isF2) {
      const revA = Math.round(pcts[0] * progress);
      const revB = Math.round(pcts[1] * progress);
      document.getElementById(`${key}-pct-a`).textContent = revA + '%';
      document.getElementById(`${key}-pct-b`).textContent = revB + '%';
      document.getElementById(`${key}-bar-a`).style.width = revA + '%';
      document.getElementById(`${key}-bar-b`).style.width = revB + '%';
    } else {
      names.forEach((name, i) => {
        const revPct = Math.round(pcts[i] * progress);
        const pctEl = document.getElementById(`${key}-vpct-${i}`);
        const barEl = document.getElementById(`${key}-vbar-${i}`);
        if (pctEl) pctEl.textContent = revPct + '%';
        if (barEl) barEl.style.height = Math.max(2, revPct * 1.5) + '%';
      });
    }

    // Update button
    const btn = document.getElementById(`${key}-btn`);
    if (btn) btn.textContent = step >= total ? 'All Revealed' : `REVEAL (${step}/${total})`;

    // Show winner on final step
    if (step >= total) {
      const winnerEl = document.getElementById(`${key}-winner`);
      if (winnerEl) winnerEl.style.display = 'block';

      // Highlight winner portrait
      if (isF2) {
        const winIdx = names.indexOf(container.dataset.winner);
        const sideId = winIdx === 0 ? `${key}-left` : `${key}-right`;
        const loseId = winIdx === 0 ? `${key}-right` : `${key}-left`;
        const winSide = document.getElementById(sideId);
        const loseSide = document.getElementById(loseId);
        if (winSide) winSide.style.filter = 'drop-shadow(0 0 20px rgba(227,179,65,0.5))';
        if (loseSide) loseSide.style.opacity = '0.5';
      }
    }
  };
  window.fanVoteRevealAll = function(key) {
    const container = document.getElementById(key);
    if (!container) return;
    const total = parseInt(container.dataset.total);
    container.dataset.step = '0';
    for (let i = 0; i < total; i++) fanVoteRevealNext(key);
  };
}

export function _buildPostTwistBlocks(ep) {
  const blocks = [];

  // ── Elimination Swap ──
  if (ep.swapResult) {
    const sr = ep.swapResult;
    const sc = [];
    sc.push({ text: `The vote is in. But ${sr.swapper} is not going home.`, players: [sr.swapper] });
    sc.push({ text: `${sr.swapper} received the most votes — but the Elimination Swap twist fires. No one is eliminated tonight.`, players: [sr.swapper], badge: 'Saved by the Twist', badgeClass: 'win' });
    sc.push({ text: `${sr.swapper} leaves ${sr.fromTribe} and joins ${sr.toTribe}. In exchange, ${sr.pickedPlayer} goes back to ${sr.fromTribe}.`, players: [sr.swapper, sr.pickedPlayer] });
    const postTribes = ep.gsSnapshot?.tribes || [];
    postTribes.filter(t => t.name === sr.fromTribe || t.name === sr.toTribe).forEach(t => {
      sc.push({ text: `New ${t.name} lineup:`, players: t.members, tribeLabel: t.name });
    });
    // Bitterness: swapper knows who voted against them
    const _swapVoters = (ep.votingLog||[]).filter(e => e.voted === sr.swapper).map(e => e.voter).slice(0, 3);
    if (_swapVoters.length) {
      sc.push({ text: `${sr.swapper} sits in the new camp and replays the vote. ${_swapVoters.join(', ')} — every name registered. The swap changes the outcome. It doesn't change the fact.`, players: [sr.swapper, ..._swapVoters] });
    }
    sc.push({ text: `${sr.swapper} arrives at ${sr.toTribe} as a stranger. New tribemates, no history, no trust built. Everything starts from zero.`, players: [sr.swapper] });
    sc.push({ text: `${sr.pickedPlayer} makes the same journey in reverse. The game they knew is gone.`, players: [sr.pickedPlayer] });
    blocks.push({ label: 'Elimination Swap', scenes: sc });
  }

  // ── Exile Duel: player sent to exile this episode ──
  if (ep.exilePlayer && !ep.exileDuelResult) {
    const sc = [];
    sc.unshift({ text: 'Waiting.', players: [ep.exilePlayer], exileIsolated: true });
    sc.push({ text: `The votes are read. The game is not over for ${ep.exilePlayer}.`, players: [ep.exilePlayer] });
    sc.push({ text: `${ep.exilePlayer} is being sent to 2nd Chance Isle instead of going home.`, players: [ep.exilePlayer], badge: 'Sent to Exile', badgeClass: 'bad' });
    sc.push({ text: `On 2nd Chance Isle, ${ep.exilePlayer} waits alone — no tribe, no challenges, no vote — until the next player is eliminated.`, players: [ep.exilePlayer] });
    sc.push({ text: `When that moment comes, the two will duel head-to-head. Win, and ${ep.exilePlayer} re-enters the game. Lose, and the journey ends here for good.`, players: [ep.exilePlayer] });
    // Bitterness: exile player knows who voted for them
    const _exVoters = (ep.votingLog||[]).filter(e => e.voted === ep.exilePlayer).map(e => e.voter).slice(0, 3);
    if (_exVoters.length) {
      sc.push({ text: `${ep.exilePlayer} knows who sent them there: ${_exVoters.join(', ')}. On 2nd Chance Isle, alone with that knowledge, there's nothing to do but train.`, players: [ep.exilePlayer, ..._exVoters] });
    }
    sc.push({ text: `Back at camp, the tribe continues without them. Some breathe easier. Others wonder if they'll regret it.`, players: [] });
    blocks.push({ label: '2nd Chance Isle', scenes: sc });
  }

  // ── Exile Duel: duel resolved this episode ──
  if (ep.exileDuelResult) {
    const dr = ep.exileDuelResult;
    const sc = [];
    const _eS = pStats(dr.exilePlayer); const _nS = pStats(dr.newBoot);
    const _cat = dr.challengeCategory || 'mixed';
    const _edgeStat = _cat === 'endurance' ? s => s.endurance
                    : _cat === 'physical'  ? s => s.physical
                    : _cat === 'puzzle'    ? s => s.mental
                    : _cat === 'social'    ? s => s.social
                    : s => s.physical * 0.5 + s.endurance * 0.5; // mixed / default
    const _eEdge = _edgeStat(_eS) > _edgeStat(_nS);
    sc.unshift({ text: '', players: [dr.exilePlayer, dr.newBoot], faceOff: true });
    sc.push({ text: `${dr.exilePlayer} has been waiting on 2nd Chance Isle. Tonight's vote produced a challenger: ${dr.newBoot}.`, players: [dr.exilePlayer, dr.newBoot] });
    sc.push({ text: `One re-enters the game. One goes home for good.`, players: [dr.exilePlayer, dr.newBoot] });
    if (dr.challengeLabel) sc.push({ text: `The duel: ${dr.challengeLabel}.${dr.challengeDesc ? ' ' + dr.challengeDesc : ''}`, players: [dr.exilePlayer, dr.newBoot] });
    // Suspense build-up — text varies by challenge type
    if (_cat === 'endurance') {
      if (_eEdge) {
        sc.push({ text: `${dr.exilePlayer} settles into a locked position early. The isolation hardened them — this is the kind of suffering they've already been living.`, players: [dr.exilePlayer] });
        sc.push({ text: `${dr.newBoot} holds, but the cracks are there. Fatigue is a slow thing, and it's already working.`, players: [dr.newBoot] });
      } else {
        sc.push({ text: `${dr.newBoot} looks comfortable out of the gate. Camp life kept them active; ${dr.exilePlayer} has been still for too long.`, players: [dr.newBoot] });
        sc.push({ text: `${dr.exilePlayer} grits through it. Every second they stay in is a second they're still alive.`, players: [dr.exilePlayer] });
      }
    } else if (_cat === 'puzzle') {
      if (_eEdge) {
        sc.push({ text: `${dr.exilePlayer} moves through the puzzle methodically. Alone on exile, there was nothing to do but think — and it shows.`, players: [dr.exilePlayer] });
        sc.push({ text: `${dr.newBoot} rushes and backtracks. The pressure of one shot, one chance, is getting inside their head.`, players: [dr.newBoot] });
      } else {
        sc.push({ text: `${dr.newBoot} locks in immediately. Their mind is sharp and they're not overthinking it.`, players: [dr.newBoot] });
        sc.push({ text: `${dr.exilePlayer} stalls. The silence of exile didn't sharpen them — it made them second-guess everything.`, players: [dr.exilePlayer] });
      }
    } else if (_cat === 'physical') {
      if (_eEdge) {
        sc.push({ text: `${dr.exilePlayer} hits hard and fast. Whatever was waiting on 2nd Chance Isle, they used every second of it.`, players: [dr.exilePlayer] });
        sc.push({ text: `${dr.newBoot} is strong — but ${dr.exilePlayer} is playing with nothing left to lose.`, players: [dr.newBoot] });
      } else {
        sc.push({ text: `${dr.newBoot} explodes out of the start. They're faster, fresher, and they know it.`, players: [dr.newBoot] });
        sc.push({ text: `${dr.exilePlayer} digs into a reserve they weren't sure they had.`, players: [dr.exilePlayer] });
      }
    } else {
      // mixed / default
      if (_eEdge) {
        sc.push({ text: `${dr.exilePlayer} finds their rhythm early. The time in exile didn't dull them — they've been locked in, waiting for exactly this moment.`, players: [dr.exilePlayer] });
        sc.push({ text: `${dr.newBoot} pushes back hard. They came straight from camp with fresh energy and they're not going quietly.`, players: [dr.newBoot] });
      } else {
        sc.push({ text: `${dr.newBoot} sets the pace early, riding the energy of having just come from camp.`, players: [dr.newBoot] });
        sc.push({ text: `${dr.exilePlayer} digs in. The isolation was supposed to be a disadvantage. It looks more like fuel.`, players: [dr.exilePlayer] });
      }
    }
    sc.push({ text: `The challenge hangs in the balance. Then the tipping point.`, players: [dr.exilePlayer, dr.newBoot] });
    sc.push({ text: `${dr.winner} pulls ahead and doesn't look back.`, players: [dr.winner], badge: dr.winner === dr.exilePlayer ? 'Returns to the Game' : 'Stays in the Game', badgeClass: 'win' });
    sc.push({ text: `${dr.loser} is permanently eliminated.`, players: [dr.loser], badge: 'Eliminated', badgeClass: 'bad' });
    // Aftermath — return or survivor
    if (dr.winner === dr.exilePlayer) {
      sc.push({ text: `${dr.winner} re-enters the game. The people who voted them out are still here. This is no longer just a game for them.`, players: [dr.winner] });
    } else {
      // newBoot survived — may be bitter toward the people who voted them out
      const _nbVoters = (ep.votingLog||[]).filter(e => e.voted === dr.newBoot).map(e => e.voter).slice(0, 3);
      const _nbS = pStats(dr.winner);
      const _isBitter = _nbS.boldness >= 7 || _nbS.loyalty <= 4;
      if (_isBitter && _nbVoters.length) {
        sc.push({ text: `${dr.winner} walks back to camp. The vote was supposed to end their game — ${_nbVoters.join(', ')} made sure of that. The duel changed the outcome. It didn't change the memory.`, players: [dr.winner, ..._nbVoters] });
      } else if (_nbVoters.length) {
        sc.push({ text: `${dr.winner} returns to camp quieter than expected. They survived. But they remember who wrote their name.`, players: [dr.winner] });
      } else {
        sc.push({ text: `${dr.winner} survives the duel and returns to camp. The exile chapter is closed.`, players: [dr.winner] });
      }
    }
    blocks.push({ label: '2nd Chance Duel', scenes: sc });
  }

  // ── Second Life (duel) ──
  if (ep.fireMaking) {
    const fm = ep.fireMaking;
    const sc = [];
    const _dt = fm.duelType || 'fire';
    const _dn = fm.duelName || 'Fire-Making';
    const _dd = fm.duelDesc || 'First to build a sustainable fire wins.';
    const _pS = pStats(fm.player), _oS = pStats(fm.opponent);
    const _pPr = pronouns(fm.player), _oPr = pronouns(fm.opponent);

    if (fm.fromAmulet && fm.allyPlayer) {
      const _apPr = pronouns(fm.allyPlayer);
      sc.push({ text: `The vote is cast. But ${fm.allyPlayer} stands up. ${_apPr.Sub} reach${_apPr.sub==='they'?'':'es'} into ${_apPr.posAdj} bag and pull${_apPr.sub==='they'?'':'s'} out the Second Life Amulet — playing it for ${fm.player}.`, players: [fm.allyPlayer, fm.player], badge: 'SECOND LIFE AMULET — ALLY PLAY', badgeClass: 'win' });
    } else if (fm.fromAmulet) {
      sc.push({ text: `The vote is cast. But ${fm.player} reaches into ${_pPr.pos} bag — the Second Life Amulet. ${_pPr.Sub} ${_pPr.sub==='they'?'are':'is'} not done yet.`, players: [fm.player], badge: 'SECOND LIFE AMULET', badgeClass: 'win' });
    } else {
      sc.push({ text: `The vote is cast. But ${fm.player} is not going home — not yet. Second Life is in play.`, players: [fm.player, fm.opponent].filter(Boolean) });
    }
    if (fm.reason) sc.push({ text: fm.reason, players: [fm.player, fm.opponent] });
    sc.push({ text: `The duel: ${_dn}. ${_dd}`, players: [fm.player, fm.opponent] });

    // Duel-type-specific suspense narration
    if (_dt === 'fire') {
      const _edge = (_pS.endurance + _pS.physical) > (_oS.endurance + _oS.physical);
      if (_edge) {
        sc.push({ text: `${fm.player} gets smoke first. It's thin, but it's real.`, players: [fm.player] });
        sc.push({ text: `${fm.opponent} rushes and loses ground. The challenge is slipping away from ${_oPr.obj}.`, players: [fm.opponent] });
      } else {
        sc.push({ text: `${fm.opponent} builds faster out of the gate. ${fm.player} is falling behind.`, players: [fm.player, fm.opponent] });
        sc.push({ text: `${fm.player} slows down and resets. Every second counts. The smoke finally comes.`, players: [fm.player] });
      }
    } else if (_dt === 'puzzle') {
      const _edge = _pS.mental > _oS.mental;
      if (_edge) {
        sc.push({ text: `${fm.player} scans the pieces and starts placing immediately. There's a system — ${_pPr.sub} found it fast.`, players: [fm.player] });
        sc.push({ text: `${fm.opponent} stalls halfway through. The pattern isn't clicking. Panic sets in.`, players: [fm.opponent] });
      } else {
        sc.push({ text: `${fm.opponent}'s hands move with certainty. Piece after piece snaps into place.`, players: [fm.opponent] });
        sc.push({ text: `${fm.player} is working, but the tempo is wrong. ${_pPr.Sub} ${_pPr.sub==='they'?'keep':'keeps'} second-guessing.`, players: [fm.player] });
      }
    } else if (_dt === 'endurance') {
      const _edge = _pS.endurance > _oS.endurance;
      if (_edge) {
        sc.push({ text: `${fm.player} locks in early. Still as stone. This is ${_pPr.pos} kind of suffering.`, players: [fm.player] });
        sc.push({ text: `${fm.opponent}'s legs are shaking. The beam is barely wide enough and every second stretches longer.`, players: [fm.opponent] });
      } else {
        sc.push({ text: `${fm.opponent} settles into position with a calm that's almost eerie.`, players: [fm.opponent] });
        sc.push({ text: `${fm.player} holds, but the strain is visible. ${_pPr.Sub} ${_pPr.sub==='they'?'are':'is'} fighting the beam, not standing on it.`, players: [fm.player] });
      }
    } else if (_dt === 'balance') {
      const _edge = (_pS.temperament + _pS.mental) > (_oS.temperament + _oS.mental);
      if (_edge) {
        sc.push({ text: `${fm.player} places each block with surgical patience. The tower sways but holds.`, players: [fm.player] });
        sc.push({ text: `${fm.opponent} rushes the placement. A block catches the edge — the whole structure wobbles.`, players: [fm.opponent] });
      } else {
        sc.push({ text: `${fm.opponent}'s hands are steady. Block by block, the tower rises clean.`, players: [fm.opponent] });
        sc.push({ text: `${fm.player} overcorrects on the third level. The platform tilts. Everything slows down.`, players: [fm.player] });
      }
    } else if (_dt === 'precision') {
      const _edge = (_pS.physical + _pS.temperament) > (_oS.physical + _oS.temperament);
      if (_edge) {
        sc.push({ text: `${fm.player} takes a breath. The first toss lands close. The second lands closer.`, players: [fm.player] });
        sc.push({ text: `${fm.opponent}'s first throw sails wide. ${_oPr.Sub} ${_oPr.sub==='they'?'adjust':'adjusts'}, but the pressure is building.`, players: [fm.opponent] });
      } else {
        sc.push({ text: `${fm.opponent} steps up and throws with a quiet confidence. Dead center.`, players: [fm.opponent] });
        sc.push({ text: `${fm.player} lines up the shot. Close — but not close enough.`, players: [fm.player] });
      }
    }

    // Result
    if (fm.winner === fm.player) {
      sc.push({ text: `${fm.player} wins the duel.`, players: [fm.player], badge: 'SECOND LIFE', badgeClass: 'win' });
      sc.push({ text: `${fm.loser} is eliminated.`, players: [fm.loser], badge: 'Eliminated', badgeClass: 'bad' });
      sc.push({ text: `${fm.player} walks back to camp. ${_pPr.Sub} fought ${_pPr.pos} way off the chopping block.`, players: [fm.player] });
    } else {
      sc.push({ text: `${fm.opponent} wins the duel.`, players: [fm.opponent], badge: 'Wins Duel', badgeClass: 'win' });
      sc.push({ text: `${fm.loser} is eliminated.`, players: [fm.loser], badge: 'Eliminated', badgeClass: 'bad' });
    }
    blocks.push({ label: 'Second Life', scenes: sc });
  }

  // Reorder: Second Life before 2nd Chance Duel (Second Life fires during tribal, exile duel after)
  const _slIdx = blocks.findIndex(b => b.label === 'Second Life');
  const _edIdx = blocks.findIndex(b => b.label === '2nd Chance Duel');
  if (_slIdx > _edIdx && _edIdx >= 0 && _slIdx >= 0) {
    const _slBlock = blocks.splice(_slIdx, 1)[0];
    blocks.splice(_edIdx, 0, _slBlock);
  }

  // ── Jury Elimination — handled by dedicated rpBuildJuryConvenes/rpBuildJuryVotes; skip here ──
  const _juryElimTw = null && (ep.twists||[]).find(t => t.type === 'jury-elimination' && t.juryBooted);
  if (_juryElimTw) {
    const _jBooted = _juryElimTw.juryBooted;
    const _jLog    = _juryElimTw.elimLog   || [];
    const _jVotes  = _juryElimTw.elimVotes || {};
    const _jJury   = ep.gsSnapshot?.jury || [];
    const _jFor    = _jLog.filter(e => e.votedOut === _jBooted).map(e => e.juror);
    const _jAgainst= _jLog.filter(e => e.votedOut !== _jBooted).map(e => e.juror);
    const sc = [];
    // Jury portrait header
    if (_jJury.length) {
      sc.unshift({ text: '', players: _jJury.slice(0, 6), juryHeader: true });
    }
    // Deliberation
    if (_jJury.length) {
      sc.push({ text: `The jury met privately. They had watched everything — every deal, every betrayal, every vote. Now they had power to act on it.`, players: _jJury.slice(0, 5) });
    } else {
      sc.push({ text: `The jury deliberated privately. The question on the table: who doesn't deserve to still be here?`, players: [] });
    }
    if (_jFor.length >= 2) {
      sc.push({ text: `${_jFor.slice(0, 2).join(' and ')} led the case against ${_jBooted}. The argument was direct — some things in this game are hard to forgive.`, players: _jFor.slice(0, 2) });
    } else if (_jFor.length === 1) {
      sc.push({ text: `${_jFor[0]} made the case against ${_jBooted} and the room listened.`, players: [_jFor[0]] });
    }
    if (_jAgainst.length >= 1) {
      sc.push({ text: `Not everyone was convinced. ${_jAgainst[0]} pushed back — they had seen different things in this game.`, players: [_jAgainst[0]] });
      if (_jAgainst.length >= 2) {
        sc.push({ text: `${_jAgainst[1]} sided with them. The deliberation went longer than expected.`, players: [_jAgainst[1]] });
      }
    }
    // Result
    if (Object.keys(_jVotes).length) {
      const sorted = Object.entries(_jVotes).sort(([,a],[,b]) => b-a);
      const voteStr = sorted.map(([n,v]) => `${n} (${v})`).join(', ');
      sc.push({ text: `The vote was called. Tally: ${voteStr}. ${_jBooted} had the most votes against.`, players: sorted.map(([n]) => n).slice(0, 5) });
    }
    sc.push({ text: `${_jBooted} is removed from the game by the jury. No tribal council tonight.`, players: [_jBooted], badge: 'Jury Voted Out', badgeClass: 'bad' });
    blocks.push({ label: 'Jury Elimination', scenes: sc, darkCeremony: true });
  }

  return blocks;
}

// ── Signal card helper for rpBuildCampTribe ──
export function buildSignalCards(ep, tribePlayers) {
  const cards = [];
  const playerSet = new Set(tribePlayers);
  // Build per-player mention tracking (precise — avoids false positives from string search)
  const existingLines = Object.values(ep.campEvents || {})
    .flatMap(e => [...(e.pre||[]), ...(e.post||[])]).map(e => e.text || '');
  const mentionedPairs = new Set();
  const mentionedSolo  = new Set();
  existingLines.forEach(txt => {
    const named = tribePlayers.filter(n => txt.includes(n));
    if (named.length >= 2) {
      for (let i = 0; i < named.length; i++)
        for (let j = i+1; j < named.length; j++)
          mentionedPairs.add([named[i], named[j]].sort().join('|'));
    } else if (named.length === 1) {
      mentionedSolo.add(named[0]);
    }
  });
  const alreadyMentioned = (a, b) =>
    b ? mentionedPairs.has([a,b].sort().join('|'))
      : mentionedSolo.has(a);

  // Bond rupture (delta < -1.5, both in tribe)
  (ep.bondChanges || [])
    .filter(c => c.delta < -1.5 && playerSet.has(c.a) && playerSet.has(c.b) && !alreadyMentioned(c.a, c.b))
    .forEach(c => cards.push({ weight: 3, type: 'bondRupture', players: [c.a, c.b],
      text: `Something cracked between ${c.a} and ${c.b} this episode. The numbers on the surface look the same — but the dynamic isn't.`,
      badge: '− Bond broken', badgeClass: 'red' }));

  // Betrayal aftermath
  (ep.gsSnapshot?.namedAlliances || []).forEach(a => {
    (a.betrayals || []).filter(b => b.ep === ep.num && playerSet.has(b.player)).forEach(b => {
      if (!alreadyMentioned(b.player)) {
        cards.push({ weight: 3, type: 'betrayal', players: [b.player],
          text: `${b.player} voted against the alliance. Everyone noticed.`,
          badge: 'Betrayal', badgeClass: 'red' });
      }
    });
  });

  // Close vote survivor (received votes but not eliminated)
  const _votes = ep.votes || {};
  const _votesAgainst = {};
  Object.values(_votes).forEach(v => { _votesAgainst[v] = (_votesAgainst[v] || 0) + 1; });
  Object.entries(_votesAgainst)
    .filter(([p, n]) => n > 0 && p !== ep.eliminated && playerSet.has(p))
    .forEach(([p]) => {
      if (!alreadyMentioned(p)) {
        cards.push({ weight: 2, type: 'closeVote', players: [p],
          text: `${p} had their name written down tonight. They're still here — but they know it now.`,
          badge: 'Close call', badgeClass: 'gold' });
      }
    });

  // Idol play aftermath
  (ep.idolPlays || [])
    .filter(ip => playerSet.has(ip.player) && !alreadyMentioned(ip.player))
    .forEach(ip => cards.push({ weight: 2, type: 'idolPlay', players: [ip.player],
      text: `${ip.player} played an idol tonight. Camp tomorrow will not be the same.`,
      badge: 'Idol played', badgeClass: 'gold' }));

  // Alliance shift — show even if player was later eliminated (recruitment happened before the vote)
  const _quitSet = new Set((ep.allianceQuits || []).map(q => `${q.player}:${q.alliance}`));
  (ep.allianceRecruits || [])
    .forEach(r => {
      const _wasReRecruit = _quitSet.has(`${r.player}:${r.toAlliance}`);
      cards.push({ weight: 2, type: 'allianceShift', players: [r.player],
        text: _wasReRecruit
          ? `${r.player} left ${r.toAlliance} — then got pulled back in. The alliance is shaky, but holding.`
          : `${r.player} just got absorbed into ${r.toAlliance}. The alliance map just got redrawn.`,
        badge: _wasReRecruit ? 'Alliance — shaky' : 'Alliance shift', badgeClass: 'gold' });
    });

  // Bond spike (delta > 2, both in tribe)
  (ep.bondChanges || [])
    .filter(c => c.delta > 2 && playerSet.has(c.a) && playerSet.has(c.b) && !alreadyMentioned(c.a, c.b))
    .forEach(c => cards.push({ weight: 1, type: 'bondSpike', players: [c.a, c.b],
      text: `${c.a} and ${c.b} got closer this episode. On a tribe this small, that matters.`,
      badge: '+ Bond', badgeClass: 'green' }));

  return cards.sort((a,b) => b.weight - a.weight).slice(0, 5);
}

// ── Screen: Relationships / Alliance State ──
export function rpBuildRelationships(ep) {
  const alliances = (ep.alliancesPreTribal || ep.gsSnapshot?.namedAlliances || []).filter(a => a.active !== false);
  const active = ep.gsSnapshot?.activePlayers || gs.activePlayers;
  const bondChanges = ep.bondChanges || [];
  const recruits = ep.allianceRecruits || [];
  const quits = ep.allianceQuits || [];
  // Use pre-tribal advantages so eliminated player's advantages don't spoil the vote
  const advList = ep.advantagesPreTribal || ep.gsSnapshot?.advantages || gs.advantages || [];

  const betrayalsThisEp = alliances.flatMap(a =>
    (a.betrayals || []).filter(b => b.ep === ep.num).map(b => ({ ...b, allianceName: a.name }))
  );

  // Emotional state colour map (matches _moodColor in tally section)
  const _moodColor = { content:'#6ee7b7', comfortable:'#10b981', confident:'var(--accent-ice)',
    calculating:'#a78bfa', uneasy:'#fbbf24', paranoid:'var(--accent-fire)', desperate:'#c0392b' };

  const _emotional = name => {
    const state = (ep.gsSnapshot?.playerStates || gs.playerStates || {})[name];
    return state?.emotional || 'content';
  };

  // Nothing worth showing → return null
  const hasAdvantages = advList.some(a => active.includes(a.holder));
  if (!alliances.length && !hasAdvantages && !bondChanges.length && !betrayalsThisEp.length) return null;

  let html = `<div class="rp-page tod-golden">
    <div class="rp-eyebrow">Episode ${ep.num}</div>
    <div class="rp-title">Camp Overview</div>`;

  // ── Alliances ──
  if (alliances.length) {
    alliances.forEach((a, i) => {
      const members = a.members.filter(n => active.includes(n));
      if (!members.length) return;
      const aRecruits = recruits.filter(r => r.toAlliance === a.name).map(r => r.player);
      const aQuits    = quits.filter(q => q.alliance === a.name).map(q => q.player);
      const epsSinceFormed = ep.num - (a.formed || ep.num);
      const stability = a.members.filter(m => active.includes(m)).length >= a.members.length * 0.75 ? 'Holding' : 'Fractured';
      html += `<div class="vp-card ice" style="animation:slideInLeft 0.4s var(--ease-broadcast) ${i * 80}ms both;margin-bottom:12px">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
          <span style="font-family:var(--font-display);font-size:14px;letter-spacing:1px">${a.name}</span>
          <span style="font-size:9px;font-weight:700;letter-spacing:1px;color:#484f58;margin-left:auto">${members.length} members · Ep ${a.formed || '?'}</span>
        </div>
        <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:8px">
          ${members.map(n => {
            const mood = _emotional(n);
            const moodCol = _moodColor[mood] || '#6ee7b7';
            const _heldAdv = advList.find(adv => adv.holder === n && adv.type === 'idol');
            const hasIdol = !!_heldAdv;
            const _idolLabel = _heldAdv?.superIdol ? 'Super Idol' : 'Idol';
            return `<div style="display:flex;flex-direction:column;align-items:center;gap:3px">
              ${rpPortrait(n, hasIdol ? 'sitd' : '', hasIdol ? _idolLabel : '')}
              <span style="font-size:8px;font-weight:700;color:${moodCol};text-transform:uppercase;letter-spacing:0.5px">${mood}</span>
            </div>`;
          }).join('')}
        </div>`;
      if (aRecruits.length) html += `<div style="font-size:11px;color:var(--accent-ice);margin-top:4px">+ Joined this episode: ${aRecruits.join(', ')}</div>`;
      if (aQuits.length)    html += `<div style="font-size:11px;color:var(--accent-fire);margin-top:2px">− Left this episode: ${aQuits.join(', ')}</div>`;
      html += `</div>`;
    });
  }

  // ── Alliances dissolved this episode ──
  // Compare: alliances in current snapshot's dissolvedAlliances that were active in previous snapshot
  const _curDissolved = ep.gsSnapshot?.dissolvedAlliances || [];
  const _prevActive = (gs.episodeHistory?.find(h => h.num === ep.num - 1)?.gsSnapshot?.namedAlliances || []).map(a => a.name);
  const _dissolvedThisEp = _curDissolved.filter(a => _prevActive.includes(a.name));
  if (_dissolvedThisEp.length) {
    html += `<div class="vp-section-header" style="color:var(--accent-fire);margin-top:12px">Dissolved This Episode</div>`;
    _dissolvedThisEp.forEach(a => {
      const _betrayals = (a.betrayals || []).filter(b => b.ep === ep.num);
      const _betrayers = _betrayals.map(b => b.player);
      // Determine reason: betrayal, elimination, or bonds collapsed
      const _eliminatedMembers = a.members.filter(m => !active.includes(m) && (ep.gsSnapshot?.eliminated || []).includes(m));
      const _activeMembers = a.members.filter(m => active.includes(m));
      let _reason;
      if (_activeMembers.length <= 1 && _eliminatedMembers.length) {
        const _gone = _eliminatedMembers.join(' and ');
        _reason = _activeMembers.length === 1
          ? `${_gone} was eliminated. ${_activeMembers[0]} is the last one standing — the alliance is over.`
          : `${_gone} ${_eliminatedMembers.length > 1 ? 'were' : 'was'} eliminated. Nobody is left.`;
      } else if (_betrayals.length >= 2) {
        _reason = `Too many broken promises — ${_betrayers.join(', ')} broke rank.`;
      } else if (_betrayals.length === 1) {
        _reason = `${_betrayers[0]} broke rank — the alliance couldn't survive it.`;
      } else {
        _reason = 'The bonds collapsed. Nobody was willing to hold it together.';
      }
      html += `<div class="vp-card" style="border-color:rgba(248,81,73,0.3);background:rgba(248,81,73,0.03);margin-bottom:8px;padding:10px 14px">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
          <span style="font-family:var(--font-display);font-size:13px;letter-spacing:1px;color:#f85149;text-decoration:line-through">${a.name}</span>
          <span class="rp-brant-badge red" style="font-size:8px">DISSOLVED</span>
        </div>
        <div style="font-size:11px;color:#8b949e;line-height:1.5">${_reason}</div>
        <div style="display:flex;gap:6px;margin-top:6px;flex-wrap:wrap">${a.members.map(n => `<div style="text-align:center;opacity:${active.includes(n) ? 1 : 0.4}">${rpPortrait(n)}</div>`).join('')}</div>
      </div>`;
    });
  }

  // ── Advantages in play ──
  const activeAdvs = advList.filter(a => active.includes(a.holder));
  if (activeAdvs.length) {
    html += `<div class="vp-section-header gold" style="margin-top:4px">Advantages in Play</div>`;
    activeAdvs.forEach(adv => {
      const _amuPowerLabel = { extraVote:'Extra Vote', voteSteal:'Vote Steal', idol:'Idol' };
      const label = (adv.type === 'idol' && adv.superIdol) ? '⚡ Super Idol (plays after votes read)'
                  : adv.type === 'idol' ? 'Hidden Immunity Idol'
                  : adv.type === 'extra-vote' ? 'Extra Vote'
                  : adv.type === 'vote-steal' ? 'Vote Steal'
                  : adv.type === 'legacy'     ? `Legacy Advantage (${(adv.activatesAt||[]).map(n=>'F'+n).join('/')})`
                  : adv.type === 'amulet'     ? `Amulet \u2014 ${_amuPowerLabel[adv.amuletPower] || adv.amuletPower || '?'}`
                  : adv.type === 'beware'     ? 'Beware Advantage'
                  : adv.type;
      html += `<div style="display:flex;align-items:center;gap:10px;padding:6px 0;border-bottom:1px solid var(--border)">
        ${rpPortrait(adv.holder, 'sitd')}
        <div>
          <div style="font-size:12px;font-weight:700;color:#e6edf3">${adv.holder}</div>
          <div style="font-size:10px;color:#e3b341;font-weight:700;letter-spacing:0.5px">${label}</div>
          ${adv.foundEp ? `<div style="font-size:10px;color:#484f58">Found Episode ${adv.foundEp}</div>` : ''}
        </div>
      </div>`;
    });
  }

  // ── Bond shifts (notable only — magnitude ≥ 1) ──
  const notableShifts = [...bondChanges].filter(c => Math.abs(c.delta) >= 1)
    .sort((a,b) => Math.abs(b.delta) - Math.abs(a.delta)).slice(0, 4);
  if (notableShifts.length) {
    html += `<div class="vp-section-header" style="margin-top:8px">Bond Shifts</div>`;
    notableShifts.forEach(c => {
      const col  = c.delta > 0 ? 'var(--accent-ice)' : 'var(--accent-fire)';
      const sign = c.delta > 0 ? '+' : '';
      const icon = c.delta > 0 ? '▲' : '▼';
      html += `<div style="display:flex;justify-content:space-between;align-items:center;padding:5px 0;border-bottom:1px solid var(--border);font-size:12px">
        <span style="color:#cdd9e5">${c.a} &amp; ${c.b}</span>
        <span style="color:${col};font-family:var(--font-mono);font-size:11px">${icon} ${sign}${c.delta.toFixed(1)}</span>
      </div>`;
    });
  }

  // ── Betrayals ──
  if (betrayalsThisEp.length) {
    html += `<div class="vp-section-header fire" style="margin-top:8px">Betrayals</div>`;
    betrayalsThisEp.forEach(b => {
      html += `<div class="vp-card fire" style="margin-bottom:8px">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px">
          ${rpPortrait(b.player)}
          <div>
            <div style="font-size:13px;font-weight:700">${b.player}</div>
            <div style="font-size:11px;color:var(--muted)">Voted against <strong>${b.allianceName}</strong> — wrote ${b.votedFor}'s name</div>
          </div>
        </div>
      </div>`;
    });
  }

  // ── Fan Pulse — scores AFTER this episode ──
  if (seasonConfig.popularityEnabled !== false && !seasonConfig.hidePopularity) {
    const _popSnap = ep.popularitySnapshot || {};
    const _allRanked = [...active].sort((a, b) => (_popSnap[b] || 0) - (_popSnap[a] || 0));
    const _n = _allRanked.length;
    const _icSz = _n >= 16 ? 20 : _n >= 12 ? 24 : _n >= 8 ? 30 : _n >= 5 ? 36 : 44;
    const _icFs = Math.round(_icSz * 0.4);
    const _pulBadge = s => s >= 12 ? ['LOVED','#e3b341'] : s >= 7 ? ['FAN FAV','#3fb950'] : s >= 3 ? ['RISING','#58a6ff'] : s === 0 ? ['INVISIBLE','#484f58'] : s <= -10 ? ['HATED','#da3633'] : s <= -5 ? ['UNPOPULAR','#f0883e'] : s < 0 ? ['FADING','#8b949e'] : null;
    html += `<div class="vp-section-header gold" style="margin-top:10px;margin-bottom:6px">Fan Pulse</div>
      <div style="display:flex;flex-direction:column;gap:2px">
        ${_allRanked.map((name, i) => {
          const score = _popSnap[name] || 0;
          const scoreColor = score >= 10 ? '#e3b341' : score > 0 ? '#c09030' : score < 0 ? '#e05c5c' : 'var(--muted)';
          const _badge = _pulBadge(score);
          const _p = players.find(x => x.name === name);
          const _slug = _p?.slug || name.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'');
          const _init = (name||'?')[0].toUpperCase();
          return `<div style="display:flex;align-items:center;gap:6px;padding:1px 0">
            <span style="font-size:9px;font-weight:700;color:var(--muted);font-family:var(--font-mono);width:14px;text-align:right;flex-shrink:0">${i+1}</span>
            <div style="width:${_icSz}px;height:${_icSz}px;border-radius:3px;overflow:hidden;flex-shrink:0;background:#21262d;display:flex;align-items:center;justify-content:center;font-size:${_icFs}px;font-weight:700;color:#6e7681">
              <img src="assets/avatars/${_slug}.png" style="width:100%;height:100%;object-fit:cover" onerror="this.style.display='none';this.nextElementSibling.style.display='block'">
              <span style="display:none">${_init}</span>
            </div>
            <span style="font-size:${Math.max(10, Math.round(_icSz * 0.45))}px;color:var(--vp-text);flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${name}</span>
            ${_badge ? `<span style="font-size:8px;font-weight:700;letter-spacing:0.5px;color:${_badge[1]};flex-shrink:0;opacity:0.9">${_badge[0]}</span>` : ''}
            <span style="font-size:${Math.max(10, Math.round(_icSz * 0.45))}px;font-weight:700;color:${scoreColor};font-family:var(--font-mono);flex-shrink:0">${score}</span>
          </div>`;
        }).join('')}
      </div>`;
  }

  html += `</div>`;
  return html;
}

// ── Screen 4: Per-tribe camp life screen (pre or post challenge) ──
export function rpBuildCampTribe(ep, tribeName, members, phase) {
  const tc = tribeColor(tribeName);
  const phaseData = ep.campEvents?.[tribeName];
  const baseEvents = phase === 'pre'
    ? (Array.isArray(phaseData) ? phaseData : (phaseData?.pre || []))
    : (phaseData?.post || []);

  // Inject tip-off event into post-challenge phase
  const events = [...baseEvents];
  if (phase === 'post' && ep.tipOffCampEvents?.[tribeName]) {
    events.push(ep.tipOffCampEvents[tribeName]);
  }

  const phaseLabel = phase === 'pre' ? 'Pre-Challenge' : 'After The Challenge';
  const isMerge = tribeName === 'merge' || tribeName === (gs.mergeName || 'merged');
  const displayName = isMerge ? (gs.mergeName || 'Merged Tribe') : tribeName;
  const safeId = tribeName.replace(/\W/g, '') + phase + ep.num;
  const portraitMembers = members.filter(n => n);
  // Extended search pool: union of episode-snapshot tribe members (end-of-ep state)
  // so players who swapped INTO this tribe this episode can still get icons matched.
  const snapTribeMembers = (ep.gsSnapshot?.tribes || []).find(t => t.name === tribeName)?.members
    || (ep.gsSnapshot?.phase === 'post-merge' ? (ep.gsSnapshot?.activePlayers || []) : []);
  const matchPool = [...new Set([...portraitMembers, ...snapTribeMembers])];
  const todClass = phase === 'pre' ? 'tod-midday' : 'tod-afternoon';

  let html = `<div class="rp-page ${todClass}">
    <div class="rp-eyebrow">Episode ${ep.num} \u2014 ${phaseLabel}</div>
    <div class="rp-title" style="color:${tc}">${displayName.toUpperCase()} CAMP</div>`;

  // Full tribe portrait row
  if (portraitMembers.length) {
    html += `<div class="rp-portrait-row" style="justify-content:center;margin-bottom:28px;flex-wrap:wrap">
      ${portraitMembers.map(n => rpPortrait(n)).join('')}
    </div>`;
  }

  // ── SECRET ADVANTAGES ──
  // Both pre and post camps use advantagesPreTribal if available — it captures
  // state after journey + idol finds but before tribal (so played advantages still show).
  // Fallback: pre uses prev-ep snapshot, post uses current-ep snapshot.
  const _advSnapFallback = phase === 'post'
    ? ep.gsSnapshot
    : gs.episodeHistory?.find(h => h.num === ep.num - 1)?.gsSnapshot;
  const _snapAdvantages = ep.advantagesPreTribal || (_advSnapFallback?.advantages || null);
  const _snapMembers = _advSnapFallback
    ? (isMerge ? (_advSnapFallback.activePlayers || null) : (_advSnapFallback.tribes?.find(t => t.name === tribeName)?.members || null))
    : null;
  // Use portrait members (who's actually at camp) for both phases
  const _advMembers = portraitMembers.length ? portraitMembers : _snapMembers;
  const advLines = getTribeAdvantageStatus(tribeName, isMerge, _snapAdvantages, _advMembers);
  html += `<div class="rp-camp-toggle-section">
    <button class="rp-camp-toggle-btn" style="border-color:${tc};color:${tc}" onclick="vpToggleSection('adv-${safeId}')">
      SECRET ADVANTAGES <span class="rp-toggle-arrow">\u25b2</span>
    </button>
    <div id="adv-${safeId}" class="rp-camp-toggle-body">`;
  if (advLines.length) {
    advLines.forEach(line => {
      const mentioned = matchPool.find(n => line.includes(n)) || matchPool.find(n => line.includes(n.split(' ')[0]));
      html += `<div class="rp-brant-entry">`;
      if (mentioned) html += `<div class="rp-brant-portraits">${rpPortrait(mentioned)}</div>`;
      html += `<div class="rp-brant-text">${line}</div>
        <span class="rp-brant-badge gold">ADVANTAGE</span>
      </div>`;
    });
  } else {
    html += `<div style="font-size:12px;color:#484f58;text-align:center;padding:12px 0">No active advantages at ${displayName} camp.</div>`;
  }
  html += `</div></div>`;

  // ── Survival: Tribe Food Bar ──
  if (seasonConfig.foodWater === 'enabled') {
    const _tf = ep.tribeFoodSnapshot?.[tribeName] ?? gs.tribeFood?.[tribeName] ?? 60;
    const _tfLabel = _tf >= 80 ? 'Well-Fed' : _tf >= 60 ? 'Comfortable' : _tf >= 40 ? 'Hungry' : _tf >= 20 ? 'Starving' : 'Critical';
    const _tfColor = _tf >= 80 ? '#3fb950' : _tf >= 60 ? '#58a6ff' : _tf >= 40 ? '#e3b341' : _tf >= 20 ? '#f0883e' : '#da3633';
    html += `<div style="margin-bottom:12px;padding:8px 12px;background:rgba(139,148,158,0.04);border:1px solid rgba(139,148,158,0.08);border-radius:8px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
        <span style="font-size:9px;font-weight:700;letter-spacing:1px;color:#8b949e">TRIBE FOOD</span>
        <span style="font-size:10px;font-weight:700;color:${_tfColor}">${_tfLabel}</span>
      </div>
      <div style="height:6px;background:rgba(139,148,158,0.15);border-radius:3px;overflow:hidden">
        <div style="height:100%;width:${Math.round(_tf)}%;background:${_tfColor};border-radius:3px;transition:width 0.4s"></div>
      </div>
    </div>`;
  }

  // ── Survival: Member status indicators ──
  if (seasonConfig.foodWater === 'enabled' && ep.survivalSnapshot) {
    const _surv = ep.survivalSnapshot;
    const _memberSurvival = members.filter(m => _surv[m] !== undefined).sort((a, b) => (_surv[a] || 0) - (_surv[b] || 0));
    if (_memberSurvival.length) {
      html += `<div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:10px">`;
      _memberSurvival.forEach(m => {
        const sv = Math.round(_surv[m] || 0);
        const svColor = sv >= 70 ? '#3fb950' : sv >= 50 ? '#58a6ff' : sv >= 35 ? '#e3b341' : sv >= 20 ? '#f0883e' : '#da3633';
        const isProvider = ep.providerSlackerData?.providers?.includes(m);
        const isSlacker = ep.providerSlackerData?.slackers?.includes(m);
        const roleIcon = isProvider ? '\u{1F41F}' : isSlacker ? '\u{1F4A4}' : '';
        html += `<div style="display:flex;align-items:center;gap:4px;padding:2px 6px;background:rgba(139,148,158,0.04);border-radius:4px;border:1px solid rgba(139,148,158,0.08)" title="Survival: ${sv}/100${isProvider ? ' (Provider)' : isSlacker ? ' (Slacker)' : ''}">
          ${rpPortrait(m, 'xs')}
          <span style="font-size:9px;color:${svColor};font-weight:700;font-family:var(--font-mono)">${sv}</span>
          ${roleIcon ? `<span style="font-size:8px">${roleIcon}</span>` : ''}
        </div>`;
      });
      html += `</div>`;
    }
  }

  // ── CAMP EVENTS ──
  html += `<div class="rp-camp-toggle-section">
    <button class="rp-camp-toggle-btn" style="border-color:${tc};color:${tc}" onclick="vpToggleSection('evt-${safeId}')">
      CAMP EVENTS <span class="rp-toggle-arrow">\u25b2</span>
    </button>
    <div id="evt-${safeId}" class="rp-camp-toggle-body">`;
  // renderEvt: closure appender — writes one event card to html
  const renderEvt = evt => {
    const words = evt.text.split(/\s+/);
    // Use explicit player list when present (allianceForm/allianceCrack etc.)
    // Fallback to text matching for older events or event types without explicit players.
    const _explicitPlayers = (evt.members || evt.players || []).filter(n => matchPool.includes(n));
    const mentioned = _explicitPlayers.length
      ? _explicitPlayers.slice(0, 5)
      : matchPool
          .filter(n => {
            if (evt.text.includes(n)) return true;
            const first = n.split(' ')[0];
            return words.some(w => w.replace(/'s$/i,'').replace(/[^a-zA-Z]/g,'') === first);
          })
          .slice(0, 5);
    // Two-player events that should get duo portrait treatment
    const isRelEvt = ['bond','fight','dispute','tdBond','flirtation','intimidation',
                      'sideDeal','strategicTalk','comfort','rumor','watchingYou','goatOblivious',
                      'idolConfession','idolBetrayal','idolShare','showmancerMoment',
                      'paranoiaSpiral','brokerWhisper','brokerManipulate','brokerExposed',
                      'showmanceSpark','showmanceHoneymoon','showmanceNoticed','showmanceTarget','showmanceJealousy','showmanceRideOrDie',
                      'socialBombReaction','chalThreatReaction',
                      'goatObserver','ftcThreatStrategist'].includes(evt.type);
    const isTipOff      = evt.type === 'eavesdrop';
    const isIdolConf    = evt.type === 'idolConfession';
    const isIdolShare   = evt.type === 'idolShare';
    const isShowmance   = evt.type === 'showmancerMoment' || evt.type?.startsWith('showmance');
    const isTriangle    = evt.type?.startsWith('triangle');
    const isTriangleNeg = evt.type === 'triangleConfrontation' || evt.type === 'trianglePublicFight' || evt.type === 'triangleUltimatum';
    const isTriangleGold= evt.type === 'triangleTension' || evt.type === 'triangleEscalation';
    const isTriangleRes = evt.type === 'triangleResolved' || evt.type === 'triangleLonely';
    const isAffair      = evt.type?.startsWith('affair');
    const isAffairNeg   = evt.type === 'affairExposed' || evt.type === 'affairCaught';
    const isAffairGold  = evt.type === 'affairSecret' || evt.type === 'affairRumor' || evt.type === 'affairSilent';
    const isAffairChoice= evt.type === 'affairChoice';
    const isAlliance    = evt.type === 'allianceForm' || evt.type === 'allianceRecruit';
    const isAllianceRef   = evt.type === 'allianceRefusal';
    const isAllianceCrk   = evt.type === 'allianceCrack';
    const isSocialBomb    = evt.type === 'socialBomb';
    const isSocialReact   = evt.type === 'socialBombReaction';
    const isChalThreat    = evt.type === 'chalThreat';
    const isChalReact     = evt.type === 'chalThreatReaction';
    const isGoatId        = evt.type === 'goatIdentified';
    const isGoatObs       = evt.type === 'goatObserver';
    const isFtcThreat     = evt.type === 'ftcThreatAlert';
    const isFtcStrat      = evt.type === 'ftcThreatStrategist';
    const isComfortBS     = evt.type === 'comfortBlindspot';
    const isExileSelect   = evt.type === 'exile-selection';
    const isClockingIt    = evt.type === 'clockingIt';
    const isTdStrategy    = evt.type === 'tdStrategy';
    const isSchemer       = evt.type === 'schemerManipulates';
    const isMoleSabotage  = evt.type === 'moleBondSabotage' || evt.type === 'moleChallengeThrow' || evt.type === 'moleInfoLeak' || evt.type === 'moleAdvSabotage' || evt.type === 'moleVoteDisruption';
    const isMoleLayLow    = evt.type === 'moleLayingLow';
    const isMoleExposed   = evt.type === 'moleExposed' || evt.type === 'moleExposedSurvival';
    const isMoleSuspicion = evt.type === 'moleSuspicionTalk' || evt.type === 'moleSuspicionConfront';
    const isMoleReveal    = evt.type === 'moleUndiscoveredReveal' || evt.type === 'moleExitConfessional';
    const isDareComplete  = evt.type === 'dareCompleted';
    const isDareMVP       = evt.type === 'dareMVP';
    const isDareGift      = evt.type === 'freebieGift';
    const isDarePact      = evt.type === 'darePact';
    const isDarePactBetray= evt.type === 'darePactBetrayal';
    const isDareAllyBetray= evt.type === 'allianceRedirectBetrayal';
    const isDareRefusal   = evt.type === 'freebieRefusal';
    const isDareElim      = evt.type === 'dareElimination';
    const isSayUncleWin   = evt.type === 'sayUncleWinner';
    const isSayUncleDom   = evt.type === 'sayUncleDominated';
    const isSayUncleBack  = evt.type === 'sayUncleBackfire';
    const isSayUncleCalled= evt.type === 'sayUncleCalledIt';
    const isSayUncleFail  = evt.type === 'sayUncleFailed';
    const isSayUncleEndure= evt.type === 'sayUncleEndured';
    const isPhobiaConf    = evt.type === 'phobiaConfession';
    const isPhobiaConq    = evt.type === 'phobiaConquered';
    const isPhobiaFail    = evt.type === 'phobiaFailed';
    const isPhobiaClutchP = evt.type === 'phobiaClutchPass';
    const isPhobiaClutchF = evt.type === 'phobiaClutchFail';
    const isPhobiaShared  = evt.type === 'phobiaSharedFear';
    const isPhobiaBlame   = evt.type === 'phobiaBlame';
    const isCRExposure    = evt.type === 'culturalResetExposure';
    const isCRSurvived    = evt.type === 'culturalResetSurvived';
    const isCRCracked     = evt.type === 'culturalResetCracked';
    const isCRDissolved   = evt.type === 'culturalResetDissolved';
    const isCRVindicated  = evt.type === 'culturalResetVindicated';
    const isCRPivot       = evt.type === 'culturalResetPivot';
    const isCRBlowup      = evt.type === 'culturalResetBlowup';
    const isAmuletConf    = evt.type === 'amuletConfession';
    const isAmuletLeak    = evt.type === 'amuletLeak';
    const isAmuletSec     = evt.type === 'amuletFalseSecurity';
    const isAmuletDilemma = evt.type === 'amuletDilemma';
    const isAmuletWeight  = evt.type === 'amuletWeight';
    const isAmuletSnoop   = evt.type === 'amuletSnoop';
    // idolFound: solo = found quietly, 2+ = witnessed
    const isIdolFind = evt.type === 'idolFound' && mentioned.length === 1;
    const isIdolSpot = evt.type === 'idolFound' && mentioned.length >= 2;
    const isHothead     = evt.type === 'hotheadExplosion';
    const isLie         = evt.type === 'lie';
    const isPrankGood   = evt.type === 'prank' && evt.goesWell;
    const isPrankBad    = evt.type === 'prank' && !evt.goesWell;
    const isMastermind  = evt.type === 'mastermindOrchestrates';
    const isScramble    = evt.type === 'scramble';
    const isBeastD      = evt.type === 'beastDrills';
    const isInjury      = evt.type === 'injury';
    const isPos = ['bond','tdBond','flirtation','sideDeal','strategicTalk','comfort','allianceForm',
                   'hardWork','unexpectedCompetence','goatOblivious','underdogMoment',
                   'confessional','socialBoost','soldierCheckin',
                   'groupLaugh','sharedStruggle','rivalThaw',
                   'teachingMoment','vulnerability','insideJoke','loyaltyProof'].includes(evt.type);
    const isNeg = ['fight','intimidation','dispute','doubt','meltdown','allianceCrack',
                   'overplay','foodConflict','leadershipClash','watchingYou','loneWolf','rumor',
                   'chaosAgentStirsUp','idolBetrayal','socialBomb','socialBombReaction',
                   'showboat','overconfidence','floaterInvisible',
                   'jealousy','exclusion','blame','passiveAggressive','trustCrack',
                   'triangleConfrontation','trianglePublicFight',
                   'affairExposed','affairCaught'].includes(evt.type);
    const isPersonal = isRelEvt && mentioned.length === 2;
    const badgeText  = isHothead      ? '💥 \u2212 Bond damage'
                     : isLie         ? '\u2212 Info planted'
                     : isPrankGood   ? '+ Tribe moment'
                     : isPrankBad    ? '\u2212 Backfired'
                     : isMastermind  ? '\u2605 Orchestrating'
                     : isScramble    ? '\u26a0 Scrambling'
                     : isBeastD      ? '\u26a0 Challenge threat'
                     : isInjury      ? '\u2212 Liability'
                     : isExileSelect  ? '🏝 SENT TO EXILE'
                     : isTipOff      ? 'PRE-TRIBAL WHISPER'
                     : isIdolShare   ? 'IDOL SHARED'
                     : isIdolConf    ? 'IDOL CONFESSED'
                     : isIdolFind    ? (evt.advType && evt.advType !== 'idol' ? 'ADVANTAGE FOUND' : 'IDOL FOUND')
                     : isIdolSpot    ? (evt.advType && evt.advType !== 'idol' ? 'ADVANTAGE FOUND \u2014 SPOTTED' : 'IDOL FOUND \u2014 SPOTTED')
                     : isTriangleNeg  ? (evt.type === 'triangleUltimatum' ? '💔 Choose One' : evt.type === 'trianglePublicFight' ? '💥 Triangle Meltdown' : '💔 Confrontation')
                     : isTriangleGold ? (evt.type === 'triangleTension' ? '⚠ Love Triangle' : '🎯 Pick a Side')
                     : isTriangleRes  ? (evt.type === 'triangleLonely' ? '💔 Alone' : '💔 Triangle Over')
                     : isAffairNeg    ? (evt.type === 'affairExposed' ? '💔 EXPOSED' : '😳 Caught')
                     : isAffairGold   ? (evt.type === 'affairSecret' ? '🤫 Secret Meeting' : evt.type === 'affairRumor' ? '👀 Rumors' : '🤐 Keeping Quiet')
                     : isAffairChoice ? '💔 Chose'
                     : evt.type === 'showmanceRekindle' ? '💕 Rekindled'
                     : evt.type === 'showmanceBreakup' ? '💔 It\'s Over'
                     : isShowmance   ? 'SHOWMANCE'
                     : isAlliance    ? (evt.type === 'allianceRecruit' ? 'RECRUITED' : 'ALLIANCE FORMED')
                     : isAllianceRef ? 'REJECTED'
                     : isAllianceCrk ? 'ALLIANCE CRACKING'
                     : isSocialBomb  ? '\u2212 SOCIAL BOMB'
                     : isSocialReact ? '\u2212 Fallout'
                     : isChalThreat  ? '\u26a0 CHALLENGE THREAT'
                     : isChalReact   ? '\u26a0 Threat noted'
                     : isGoatId      ? 'GOAT IDENTIFIED'
                     : isGoatObs     ? 'Drag-along target'
                     : isFtcThreat   ? '\u26a0 FTC THREAT'
                     : isFtcStrat    ? '\u26a0 Reassessing'
                     : isComfortBS   ? '\u2b50 CHECKED OUT'
                     : isClockingIt  ? 'Clocking it'
                     : isTdStrategy  ? '\u2605 Strategy session'
                     : isSchemer     ? '\u26a0 Manipulation'
                     : isAmuletConf ? 'AMULET CONFESSED'
                     : isAmuletLeak ? '\u2212 AMULET LEAKED'
                     : isAmuletSec  ? '\u26a0 False security'
                     : isAmuletDilemma ? '\u26a0 Eyeing a target'
                     : isAmuletWeight ? 'The weight'
                     : isAmuletSnoop ? '\u26a0 AMULET SPOTTED'
                     : evt.type === 'teamSwapFound'        ? 'ADVANTAGE FOUND'
                     : evt.type === 'voteBlockFound'       ? 'ADVANTAGE FOUND'
                     : evt.type === 'voteStealFound'       ? 'ADVANTAGE FOUND'
                     : evt.type === 'teamSwapConfession'   ? 'CONFESSION'
                     : evt.type === 'teamSwapSnooped'      ? '\u26a0 SNOOPED'
                     : evt.type === 'voteBlockSnooped'     ? '\u26a0 SNOOPED'
                     : evt.type === 'voteStealSnooped'     ? '\u26a0 SNOOPED'
                     : evt.type === 'safetyNoPowerFound'       ? 'ADVANTAGE FOUND'
                     : evt.type === 'safetyNoPowerConfession'  ? 'CONFESSION'
                     : evt.type === 'safetyNoPowerSnooped'     ? '\u26a0 SNOOPED'
                     : evt.type === 'safetyNoPowerAftermath'   ? 'ABANDONED TRIBAL'
                     : evt.type === 'safetyNoPowerEscaped'     ? 'ESCAPED'
                     : evt.type === 'soleVoteFound'         ? 'ADVANTAGE FOUND'
                     : evt.type === 'soleVoteConfession'    ? 'CONFESSION'
                     : evt.type === 'soleVoteSnooped'       ? '\u26a0 SNOOPED'
                     : evt.type === 'soleVoteFallout'       ? 'DICTATOR\'S FALLOUT'
                     : evt.type === 'soleVoteWasted'        ? 'WASTED POWER'
                     : evt.type === 'soleVoteAccomplice'    ? 'ACCOMPLICE?'
                     : evt.type === 'miscommunicationFallout' ? (evt.badgeText || 'MISFIRE')
                     : evt.type === 'hardWork'             ? '+ Earned respect'
                     : evt.type === 'readingRoom'          ? '👁 Reading the Room'
                     : evt.type === 'idolSearch'           ? '🔍 Searching'
                     : evt.type === 'paranoia'             ? '⚠ Spiraling'
                     : evt.type === 'strategicApproach'    ? '⚡ Making Moves'
                     : evt.type === 'unexpectedCompetence' ? '+ Surprised the tribe'
                     : evt.type === 'underdogMoment'       ? '+ Underdog rising'
                     : evt.type === 'socialBoost'          ? '+ Lifted the mood'
                     : evt.type === 'soldierCheckin'       ? '+ Loyalty confirmed'
                     : evt.type === 'goatOblivious'        ? '+ Goat secured'
                     : evt.type === 'fight'               ? '💥 Fight'
                     : evt.type === 'bond'                ? '+ Bonding'
                     : evt.type === 'meltdown'            ? '💥 Meltdown'
                     : evt.type === 'strategicTalk'       ? '⚡ Strategy talk'
                     : evt.type === 'dispute'             ? '− Dispute'
                     : evt.type === 'rumor'               ? '👀 Rumor'
                     : evt.type === 'comfort'             ? '+ Comfort'
                     : evt.type === 'tdBond'              ? '+ Bonding'
                     : evt.type === 'flirtation'          ? '💕 Flirting'
                     : evt.type === 'homesick'            ? '😔 Homesick'
                     : evt.type === 'leadershipClash'     ? '− Clash'
                     : evt.type === 'showboat'            ? '− Showing off'
                     : evt.type === 'intimidation'        ? '− Intimidation'
                     : evt.type === 'doubt'               ? '⚠ Doubt'
                     : evt.type === 'weirdMoment'         ? '😅 Weird moment'
                     : evt.type === 'wildcardPivot'       ? '⚡ Wildcard move'
                     : evt.type === 'chaosAgentStirsUp'   ? '💥 Stirring the pot'
                     : evt.type === 'floaterInvisible'    ? '👻 Flying under radar'
                     : evt.type === 'loneWolf'            ? '🐺 Lone wolf'
                     : evt.type === 'tribeMood'           ? '🏕 Tribe mood'
                     : evt.type === 'watchingYou'         ? '👁 Watching'
                     : evt.type === 'perceptiveReads'     ? '👁 Read the room'
                     : evt.type === 'overplay'            ? '⚠ Overplaying'
                     : evt.type === 'overconfidence'      ? '⚠ Overconfident'
                     : evt.type === 'bigMoveThoughts'     ? '⚡ Plotting'
                     : evt.type === 'mastermindOrchestrates' ? '⚡ Orchestrating'
                     : isCRExposure   ? 'EXPOSED'
                     : isCRSurvived   ? 'ALLIANCE SURVIVED'
                     : isCRCracked    ? 'ALLIANCE CRACKED'
                     : isCRDissolved  ? 'DISSOLVED'
                     : isCRVindicated ? 'VINDICATED'
                     : isCRPivot      ? 'PIVOTING'
                     : isCRBlowup     ? 'EXPLODES'
                     : evt.type === 'fanVoteWinner'           ? (evt.badgeText || 'Fan Favorite')
                     : evt.type === 'fanVoteJealousy'         ? (evt.badgeText || 'Jealousy')
                     : evt.type === 'villainIntimidate'       ? (evt.badgeText || 'Intimidation')
                     : evt.type === 'villainPower'            ? (evt.badgeText || 'Power Play')
                     : evt.type === 'villainGloat'            ? (evt.badgeText || 'Gloating')
                     : evt.type === 'villainLoyalty'          ? (evt.badgeText || 'Inner Circle')
                     : evt.type === 'heroConfront'            ? (evt.badgeText || 'Hero vs Villain')
                     : evt.type === 'heroProtect'             ? (evt.badgeText || 'Protecting')
                     : evt.type === 'heroSacrifice'           ? (evt.badgeText || 'Sacrifice')
                     : evt.type === 'heroWeight'              ? (evt.badgeText || 'The Weight')
                     : evt.type === 'socialIntel'             ? (evt.badgeText || 'Social Intel')
                     : evt.type === 'allianceDissolved'      ? (evt.badgeText || 'Alliance Dissolved')
                     : evt.type === 'kipAftermath'          ? (evt.badgeText || 'KiP Aftermath')
                     : evt.type === 'amuletReunion'         ? (evt.badgeText || 'Amulet Holders')
                     : evt.type === 'amuletBetrayal'        ? (evt.badgeText || 'Temptation')
                     : evt.type === 'amuletRivalry'         ? (evt.badgeText || 'Amulet Rivalry')
                     : evt.type === 'amuletUpgrade'         ? (evt.badgeText || 'Amulet Upgraded')
                     : evt.type === 'legacyInheritance'     ? (evt.badgeText || 'Legacy Inherited')
                     : evt.type === 'legacyConfession'      ? (evt.badgeText || 'Legacy Confessed')
                     : evt.type === 'legacyLeak'            ? (evt.badgeText || 'Legacy Leaked')
                     : evt.type === 'legacyScheme'          ? (evt.badgeText || 'Heir Scheming')
                     : evt.type === 'legacyWeight'          ? (evt.badgeText || 'Legacy Weight')
                     : evt.type === 'legacyHeirWatch'       ? (evt.badgeText || 'Watching the Heir')
                     : evt.type === 'brokerWhisper'        ? 'Double Agent'
                     : evt.type === 'brokerManipulate'     ? 'Double Agent'
                     : evt.type === 'brokerConfidence'     ? 'Double Agent'
                     : evt.type === 'brokerClose'          ? 'Double Agent'
                     : evt.type === 'brokerExposed'        ? 'EXPOSED'
                     : evt.type === 'brokerFallout'        ? 'Trust Shattered'
                     : evt.type === 'brokerDefense'        ? 'Defense'
                     : evt.type === 'blackVoteGuess'             ? (evt.badgeText || 'BLACK VOTE')
                     : evt.type === 'fakeIdolCaught'             ? (evt.badgeText || 'FAKE IDOL EXPOSED')
                     : evt.type === 'fakeIdolFound'              ? (evt.badgeText || 'IDOL FOUND')
                     : evt.type === 'fakeIdolPlanted'            ? (evt.badgeText || 'FAKE IDOL PLANTED')
                     : evt.type === 'fakeIdolConfrontation'      ? (evt.badgeText || 'FAKE IDOL')
                     : evt.type === 'medevacReplacement'         ? (evt.badgeText || 'REPLACEMENT')
                     : evt.type === 'challengeThrowCaught'      ? (evt.badgeText || 'THREW THE CHALLENGE')
                     : evt.type === 'stolenCredit'              ? (evt.badgeText || 'STOLEN CREDIT')
                     : evt.type === 'stolenCreditConfrontation' ? (evt.badgeText || 'CONFRONTATION')
                     : evt.type === 'providerFishing'           ? (evt.badgeText || 'PROVIDER')
                     : evt.type === 'providerForaging'          ? (evt.badgeText || 'FORAGING')
                     : evt.type === 'providerPraised'           ? (evt.badgeText || 'PRAISED')
                     : evt.type === 'slackerCalledOut'          ? (evt.badgeText || 'CALLED OUT')
                     : evt.type === 'slackerConfrontation'      ? (evt.badgeText || 'CONFRONTATION')
                     : evt.type === 'slackerBonding'            ? (evt.badgeText || 'LAZY ALLIANCE')
                     : evt.type === 'foodConflict'              ? (evt.badgeText || 'FOOD FIGHT')
                     : evt.type === 'foodHoarding'              ? (evt.badgeText || 'HOARDING')
                     : evt.type === 'starvationBond'            ? (evt.badgeText || 'SHARED SUFFERING')
                     : evt.type === 'foodRationing'             ? (evt.badgeText || 'RATIONING')
                     : evt.type === 'foodCrisis'                ? (evt.badgeText || 'FOOD CRISIS')
                     : evt.type === 'survivalCollapse'          ? (evt.badgeText || 'COLLAPSE')
                     : evt.type === 'medevac'                   ? (evt.badgeText || 'MEDEVAC')
                     : evt.type === 'providerVotedOut'          ? (evt.badgeText || 'FOOD CRISIS')
                     : evt.type === 'cliffDiveChicken'         ? (evt.badgeText || 'CHICKEN')
                     : evt.type === 'cliffDiveStandout'        ? (evt.badgeText || 'FIRST TO JUMP')
                     : evt.type === 'cliffDiveBuildLeader'     ? (evt.badgeText || 'BUILD CAPTAIN')
                     : evt.type === 'cliffDiveForced'          ? (evt.badgeText || 'THROWN')
                     : evt.type === 'cliffDiveConvinced'       ? (evt.badgeText || 'CONVINCED')
                     : evt.type === 'awakeAThonBond'           ? (evt.badgeText || 'STAYING AWAKE TOGETHER')
                     : evt.type === 'awakeAThonDeal'           ? (evt.badgeText || 'LATE NIGHT DEAL')
                     : evt.type === 'awakeAThonRomance'        ? (evt.badgeText || 'SLEEPLESS ROMANCE')
                     : evt.type === 'awakeAThonCheat'          ? (evt.badgeText || 'CAUGHT CHEATING')
                     : evt.type === 'awakeAThonScheme'         ? (evt.badgeText || 'SABOTAGE')
                     : evt.type === 'awakeAThonIronWill'       ? (evt.badgeText || 'IRON WILL')
                     : evt.type === 'awakeAThonFirstOut'       ? (evt.badgeText || 'FIRST OUT')
                     : evt.type === 'dodgebrawlTeamPlayer'    ? (evt.badgeText || 'TEAM PLAYER')
                     : evt.type === 'dodgebrawlHero'          ? (evt.badgeText || 'DODGEBALL HERO')
                     : evt.type === 'dodgebrawlRedemption'    ? (evt.badgeText || 'REDEMPTION')
                     : evt.type === 'dodgebrawlRefusal'       ? (evt.badgeText || 'REFUSED TO PLAY')
                     : evt.type === 'dodgebrawlChoke'         ? (evt.badgeText || 'CHOKED')
                     : evt.type === 'dodgebrawlLiability'     ? (evt.badgeText || 'LIABILITY')
                     : evt.type === 'talentShowStandingOvation' ? (evt.badgeText || 'STANDING OVATION')
                     : evt.type === 'talentShowUnlikelyHero'    ? (evt.badgeText || 'UNLIKELY HERO')
                     : evt.type === 'talentShowTeamSupport'     ? (evt.badgeText || 'TEAM SUPPORT')
                     : evt.type === 'talentShowSabotageFallout' ? (evt.badgeText || 'SABOTAGE')
                     : evt.type === 'talentShowDisaster'        ? (evt.badgeText || 'STAGE DISASTER')
                     : evt.type === 'talentShowBitterReject'    ? (evt.badgeText || 'BITTER REJECTION')
                     : evt.type === 'spyMission'              ? (evt.badgeText || evt.badge || 'SPY MISSION')
                     : evt.type === 'sabotageSetup'            ? (evt.badgeText || evt.badge || 'SABOTAGE SETUP')
                     : evt.type === 'pepTalk'                  ? (evt.badgeText || evt.badge || 'PEP TALK')
                     : evt.type === 'rivalryConfrontation'     ? (evt.badgeText || evt.badge || 'RIVALRY')
                     : evt.type === 'accidentInjury'           ? (evt.badgeText || evt.badge || 'ACCIDENT')
                     : evt.type === 'accidentSubstitution'     ? (evt.badgeText || evt.badge || 'SUBSTITUTION')
                     : evt.type === 'secretRehearsalSubIn'     ? (evt.badgeText || evt.badge || 'SECRET REHEARSAL')
                     : evt.type === 'secretRehearsalAlone'     ? (evt.badgeText || evt.badge || 'SECRET REHEARSAL')
                     : evt.type === 'stageFright'              ? (evt.badgeText || evt.badge || 'STAGE FRIGHT')
                     : evt.type === 'trashTalk'                ? (evt.badgeText || evt.badge || 'TRASH TALK')
                     : evt.type === 'allianceHuddle'           ? (evt.badgeText || evt.badge || 'ALLIANCE HUDDLE')
                     : evt.type === 'preShowJitters'           ? (evt.badgeText || evt.badge || 'PRE-SHOW')
                     : evt.type === 'soNavigator'              ? (evt.badgeText || evt.badge || 'NAVIGATOR')
                     : evt.type === 'soShelter'                ? (evt.badgeText || evt.badge || 'SHELTER BUILT')
                     : evt.type === 'soFire'                   ? (evt.badgeText || evt.badge || 'FIRE STARTED')
                     : evt.type === 'soProvider'               ? (evt.badgeText || evt.badge || 'PROVIDER')
                     : evt.type === 'soGhostStory'             ? (evt.badgeText || evt.badge || 'GHOST STORY')
                     : evt.type === 'soFireside'               ? (evt.badgeText || evt.badge || 'FIRESIDE')
                     : evt.type === 'soPrank'                  ? (evt.badgeText || evt.badge || 'PRANK')
                     : evt.type === 'soBear'                   ? (evt.badgeText || evt.badge || 'BEAR ENCOUNTER')
                     : evt.type === 'soBearHero'               ? (evt.badgeText || evt.badge || 'BEAR HERO')
                     : evt.type === 'soBearPanic'              ? (evt.badgeText || evt.badge || 'BEAR PANIC')
                     : evt.type === 'soForage'                 ? (evt.badgeText || evt.badge || 'FORAGER')
                     : evt.type === 'soReinforce'              ? (evt.badgeText || evt.badge || 'CAMP REINFORCED')
                     : evt.type === 'forgeNote'                ? (evt.badgeText || 'FORGED NOTE')
                     : evt.type === 'spreadLies'               ? (evt.badgeText || 'LIED TO')
                     : evt.type === 'kissTrap'                 ? (evt.badgeText || 'KISS TRAP')
                     : evt.type === 'whisperCampaign'          ? (evt.badgeText || 'WHISPERS')
                     : evt.type === 'campaignRally'            ? (evt.badgeText || 'CAMPAIGNED')
                     : evt.type === 'exposeSchemer'            ? (evt.badgeText || 'EXPOSED')
                     : evt.type === 'luckyHuntHelped'          ? (evt.badgeText || 'HELPED')
                     : evt.type === 'luckyHuntSaboteur'        ? (evt.badgeText || 'SABOTEUR')
                     : evt.type === 'luckyHuntStolen'          ? (evt.badgeText || 'KEY STOLEN')
                     : evt.type === 'luckyHuntShowoff'         ? (evt.badgeText || 'SHOWBOATING')
                     : evt.type === 'luckyHuntPanic'           ? (evt.badgeText || 'FROZE UP')
                     : evt.type === 'luckyHuntDiscovery'       ? (evt.badgeText || 'FOUND SOMETHING')
                     : evt.type === 'luckyHuntBoobyTrap'       ? (evt.badgeText || 'BOOBY TRAP')
                     : evt.type === 'luckyHuntDud'             ? (evt.badgeText || 'DUD KEY')
                     : evt.type === 'luckyHuntShared'          ? (evt.badgeText || 'SHARED REWARD')
                     : evt.type === 'luckyHuntAlliance'        ? (evt.badgeText || 'ALLIANCE')
                     : evt.type === 'luckyHuntRivalry'         ? (evt.badgeText || 'TENSION')
                     : evt.type === 'luckyHuntAmbush'          ? (evt.badgeText || 'AMBUSHED')
                     : evt.type === 'luckyHuntTaunt'           ? (evt.badgeText || 'TAUNTED')
                     : evt.type === 'luckyHuntEncouragement'   ? (evt.badgeText || 'ENCOURAGED')
                     : evt.type === 'luckyHuntGuard'           ? (evt.badgeText || 'STANDING GUARD')
                     : evt.type === 'luckyHuntBonding'         ? (evt.badgeText || 'MOMENT')
                     : evt.type === 'comfortVictim'            ? (evt.badgeText || 'COMFORTED')
                     : evt.type === 'soLeaderClash'            ? (evt.badgeText || evt.badge || 'POWER STRUGGLE')
                     : evt.type === 'soInjury'                 ? (evt.badgeText || evt.badge || 'INJURED')
                     : evt.type === 'soFoodHoard'              ? (evt.badgeText || evt.badge || 'FOOD HOARD')
                     : evt.type === 'soFoodShare'              ? (evt.badgeText || evt.badge || 'SHARED FOOD')
                     : evt.type === 'soHunger'                 ? (evt.badgeText || evt.badge || 'STARVING')
                     : evt.type === 'soWellFed'                ? (evt.badgeText || evt.badge || 'WELL FED')
                     : evt.type === 'soAllianceWhisper'        ? (evt.badgeText || evt.badge || 'WHISPERS')
                     : evt.type === 'soStumble'                ? (evt.badgeText || evt.badge || 'STUMBLE')
                     : evt.type === 'soCarry'                  ? (evt.badgeText || evt.badge || 'CARRIED TEAMMATE')
                     : evt.type === 'soRally'                  ? (evt.badgeText || evt.badge || 'RALLIED THE TRIBE')
                     : evt.type === 'soLost'                   ? (evt.badgeText || evt.badge || 'LOST')
                     : evt.type === 'soCostTribe'              ? (evt.badgeText || evt.badge || 'COST THE TRIBE')
                     : evt.type === 'soShortcut'               ? (evt.badgeText || evt.badge || 'SHORTCUT')
                     : evt.type === 'soCarried'                ? (evt.badgeText || evt.badge || 'CARRIED')
                     : evt.type === 'soSlacker'                ? (evt.badgeText || evt.badge || 'SLACKER')
                     : evt.type === 'soWanderedOff'            ? (evt.badgeText || evt.badge || 'WANDERED OFF')
                     : evt.type === 'soRainstorm'              ? (evt.badgeText || evt.badge || 'RAINSTORM')
                     : evt.type === 'soTentFire'               ? (evt.badgeText || evt.badge || 'TENT FIRE')
                     : evt.type === 'soStargazing'             ? (evt.badgeText || evt.badge || 'STARGAZING')
                     : evt.type === 'soCuddling'               ? (evt.badgeText || evt.badge || 'CUDDLING')
                     : evt.type === 'soScheme'                 ? (evt.badgeText || evt.badge || 'SCHEMING')
                     : evt.type === 'soLagger'                 ? (evt.badgeText || evt.badge || 'LAGGING')
                     : evt.type === 'soFoodSpotted'            ? (evt.badgeText || evt.badge || 'FOOD SPOTTED')
                     : evt.type === 'soArgument'               ? (evt.badgeText || evt.badge || 'ARGUMENT')
                     : evt.type === 'soBonding'                ? (evt.badgeText || evt.badge || 'BONDING')
                     : evt.type === 'soScaryNoise'             ? (evt.badgeText || evt.badge || 'SCARY NOISE')
                     : evt.type === 'soNightmare'              ? (evt.badgeText || evt.badge || 'NIGHTMARE')
                     : evt.type === 'soSneakOff'               ? (evt.badgeText || evt.badge || 'SNUCK OFF')
                     : evt.type === 'soShelterCollapse'        ? (evt.badgeText || evt.badge || 'COLLAPSED')
                     : evt.type === 'soShowmance'              ? (evt.badgeText || evt.badge || 'SHOWMANCE')
                     : evt.type === 'soRaceLeader'             ? (evt.badgeText || evt.badge || 'FRONT RUNNER')
                     : evt.type === 'soCantSleep'              ? (evt.badgeText || evt.badge || 'CAN\'T SLEEP')
                     : evt.type === 'soBearPrank'              ? (evt.badgeText || evt.badge || 'BEAR PRANK')
                     : evt.type === 'utcPartnerPick'           ? (evt.badgeText || evt.badge || 'PARTNER PICK')
                     : evt.type === 'utcRejected'              ? (evt.badgeText || evt.badge || 'REJECTED')
                     : evt.type === 'utcSoloPaddler'           ? (evt.badgeText || evt.badge || 'SOLO CANOE')
                     : evt.type === 'utcFastPair'              ? (evt.badgeText || evt.badge || 'FAST PAIR')
                     : evt.type === 'utcSlowPair'              ? (evt.badgeText || evt.badge || 'SLOW PAIR')
                     : evt.type === 'utcCapsized'              ? (evt.badgeText || evt.badge || 'CAPSIZED')
                     : evt.type === 'utcWildlife'              ? (evt.badgeText || evt.badge || 'WILDLIFE')
                     : evt.type === 'utcQuicksand'             ? (evt.badgeText || evt.badge || 'QUICKSAND')
                     : evt.type === 'utcInjury'                ? (evt.badgeText || evt.badge || 'INJURY')
                     : evt.type === 'utcShortcut'              ? (evt.badgeText || evt.badge || 'SHORTCUT')
                     : evt.type === 'utcDroppedCanoe'          ? (evt.badgeText || evt.badge || 'DROPPED')
                     : evt.type === 'utcLighter'               ? (evt.badgeText || evt.badge || 'LIGHTER')
                     : evt.type === 'utcFireStarter'           ? (evt.badgeText || evt.badge || 'FIRE STARTER')
                     : evt.type === 'utcPaddleBurn'            ? (evt.badgeText || evt.badge || 'PADDLES BURNED')
                     : evt.type === 'utcAdviceGiver'           ? (evt.badgeText || evt.badge || 'HELPED THE ENEMY')
                     : evt.type === 'utcSwimmerHero'           ? (evt.badgeText || evt.badge || 'SWIMMER HERO')
                     : evt.type === 'utcSprintFinish'          ? (evt.badgeText || evt.badge || 'SPRINT FINISH')
                     : evt.type === 'utcPhotoFinish'           ? (evt.badgeText || evt.badge || 'PHOTO FINISH')
                     : evt.type === 'utcCheating'              ? (evt.badgeText || evt.badge || 'CHEATING')
                     : evt.type === 'utcMotivational'          ? (evt.badgeText || evt.badge || 'RALLY CRY')
                     : evt.type === 'utcCanoeRomance'         ? (evt.badgeText || evt.badge || 'CANOE MOMENT')
                     : evt.type === 'utcCursedIdol'           ? (evt.badgeText || evt.badge || 'CURSED IDOL')
                     : evt.type === 'utcBoneyMist'            ? (evt.badgeText || evt.badge || 'BONEY MIST')
                     : evt.type === 'utcSkeletonFind'         ? (evt.badgeText || evt.badge || 'BONES')
                     : evt.type === 'utcMVP'                  ? (evt.badgeText || 'MVP PADDLER')
                     : evt.type === 'utcHeroMoment'           ? (evt.badgeText || 'HERO MOMENT')
                     : evt.type === 'utcWeakLink'             ? (evt.badgeText || 'WEAK LINK')
                     : evt.type === 'pbHit'                  ? (evt.badgeText || 'PAINTED OUT')
                     : evt.type === 'pbMiss'                 ? (evt.badgeText || 'DODGED')
                     : evt.type === 'pbNotFound'             ? (evt.badgeText || 'LOST IN WOODS')
                     : evt.type === 'pbDeerStampede'         ? (evt.badgeText || 'STAMPEDE')
                     : evt.type === 'pbCamouflage'           ? (evt.badgeText || 'CAMO')
                     : evt.type === 'pbTreeClimb'            ? (evt.badgeText || 'TREE CLIMB')
                     : evt.type === 'pbMudSlide'             ? (evt.badgeText || 'MUD SLIDE')
                     : evt.type === 'pbBearEncounter'        ? (evt.badgeText || 'BEAR MAULED')
                     : evt.type === 'pbAntlersLocked'        ? (evt.badgeText || 'ANTLERS LOCKED')
                     : evt.type === 'pbRebellion'            ? (evt.badgeText || 'REBELLION')
                     : evt.type === 'pbMisfire'              ? (evt.badgeText || 'MISFIRE')
                     : evt.type === 'pbAllianceRebellion'    ? (evt.badgeText || 'REBELLION')
                     : evt.type === 'pbDeerBonding'          ? (evt.badgeText || 'BOND')
                     : evt.type === 'pbCrossTribeEncounter'  ? (evt.badgeText || 'ENCOUNTER')
                     : evt.type === 'pbDeerPact'             ? (evt.badgeText || 'PACT')
                     : evt.type === 'pbHunterScheme'         ? (evt.badgeText || 'SCHEMING')
                     : evt.type === 'pbCrossRoleWhisper'     ? (evt.badgeText || 'WHISPER')
                     : evt.type === 'pbAllianceMeeting'      ? (evt.badgeText || 'PLOTTING')
                     : evt.type === 'pbHunterProtects'       ? (evt.badgeText || 'PROTECTION')
                     : evt.type === 'pbAmbush'               ? (evt.badgeText || 'AMBUSH')
                     : evt.type === 'pbSneakAttack'          ? (evt.badgeText || 'SNEAK ATTACK')
                     : evt.type === 'pbDecoy'                ? (evt.badgeText || 'DECOY')
                     : evt.type === 'pbTaunt'                ? (evt.badgeText || 'TAUNT')
                     : evt.type === 'pbEpicChase'            ? (evt.badgeText || 'EPIC CHASE')
                     : evt.type === 'pbObsessiveChase'       ? (evt.badgeText || 'OBSESSED')
                     : evt.type === 'pbDoublefind'           ? (evt.badgeText || 'DOUBLE FIND')
                     : evt.type === 'pbSympathyShot'         ? (evt.badgeText || 'PILING ON')
                     : evt.type === 'pbHunterRivalry'        ? (evt.badgeText || 'RIVALRY')
                     : evt.type === 'pbFriendlyFireAccident' ? (evt.badgeText || 'FRIENDLY FIRE')
                     : evt.type === 'pbFriendlyFireDeliberate'? (evt.badgeText || 'BETRAYAL')
                     : evt.type === 'pbRetaliation'          ? (evt.badgeText || 'RETALIATION')
                     : evt.type === 'pbWarEscalation'        ? (evt.badgeText || 'PAINTBALL WAR')
                     : evt.type === 'pbWarFreeShot'          ? (evt.badgeText || 'FREE SHOT')
                     : evt.type === 'pbMVPHunter'            ? (evt.badgeText || 'TOP HUNTER')
                     : evt.type === 'pbLastDeer'             ? (evt.badgeText || 'LAST DEER')
                     : evt.type === 'pbRebellionHero'        ? (evt.badgeText || 'REBELLION HERO')
                     : evt.type === 'pbFriendlyFireCulprit'  ? (evt.badgeText || 'FRIENDLY FIRE')
                     : evt.type === 'pbFirstPainted'         ? (evt.badgeText || 'FIRST PAINTED')
                     : evt.type === 'pbWarInstigator'        ? (evt.badgeText || 'WAR STARTER')
                     : evt.type === 'pbBearMauled'           ? (evt.badgeText || 'BEAR MAULED')
                     : evt.type === 'pbConfessional'          ? (evt.badgeText || 'CONFESSIONAL')
                     : evt.type === 'pbHunterTrashTalk'       ? (evt.badgeText || 'TRASH TALK')
                     : evt.type === 'pbCloseCall'             ? (evt.badgeText || 'CLOSE CALL')
                     : evt.type === 'pbWaterDive'             ? (evt.badgeText || 'WATER ESCAPE')
                     : evt.type === 'pbDecoyTrail'            ? (evt.badgeText || 'FALSE TRAIL')
                     : evt.type === 'pbSprintBurst'           ? (evt.badgeText || 'SPRINT')
                     : evt.type === 'pbScentTrack'            ? (evt.badgeText || 'TRACKING')
                     : evt.type === 'pbHighGround'            ? (evt.badgeText || 'HIGH GROUND')
                     : evt.type === 'pbBaitTrap'              ? (evt.badgeText || 'BAIT TRAP')
                     : evt.type === 'pbGrossOut'              ? (evt.badgeText || 'GROSS OUT')
                     : evt.type === 'pbPatience'              ? (evt.badgeText || 'PATIENCE')
                     : evt.type === 'trustSabotageHumiliation' ? (evt.badgeText || 'SABOTAGE')
                     : evt.type === 'trustSabotageRopeDrop'   ? (evt.badgeText || 'SABOTAGE')
                     : evt.type === 'trustBelayerDistracted'  ? (evt.badgeText || 'DISTRUST')
                     : evt.type === 'trustDeliberatePoisoning'? (evt.badgeText || 'POISONED')
                     : evt.type === 'trustPoisoning'          ? (evt.badgeText || 'POISONED')
                     : evt.type === 'trustBravery'            ? (evt.badgeText || 'BRAVE')
                     : evt.type === 'trustWildShooter'        ? (evt.badgeText || 'WILD SHOOTER')
                     : evt.type === 'trustCatcherSabotage'    ? (evt.badgeText || 'SABOTAGE')
                     : evt.type === 'trustFrozenRefuse'       ? (evt.badgeText || 'FROZEN')
                     : evt.type === 'trustJellyfishFall'      ? (evt.badgeText || 'JELLYFISH')
                     : evt.type === 'trustRuleBreak'          ? (evt.badgeText || 'DQ')
                     : evt.type === 'trustPostArgument'       ? (evt.badgeText || 'FIGHT')
                     : evt.type === 'trustGrudgingRespect'    ? (evt.badgeText || 'RESPECT')
                     : evt.type === 'trustPerfectDish'        ? (evt.badgeText || 'CHEF')
                     : evt.type === 'trustRedemptionWitness'  ? (evt.badgeText || 'WITNESS')
                     : evt.type === 'chef-showdown'           ? (evt.badgeText || 'CHEF SHOWDOWN')
                     : evt.type === 'tyrannical-chef'         ? (evt.badgeText || 'KITCHEN TYRANT')
                     : evt.type === 'tyrant-singles-out'      ? (evt.badgeText || 'SINGLED OUT')
                     : evt.type === 'tyrant-errand'           ? (evt.badgeText || 'ERRAND RUN')
                     : evt.type === 'tyrant-snapback'         ? (evt.badgeText || 'SNAP BACK')
                     : evt.type === 'tyrant-conspiracy'       ? (evt.badgeText || 'CONSPIRACY')
                     : evt.type === 'tyrant-pressure'         ? (evt.badgeText || 'PRESSURE')
                     : evt.type === 'fridge-lock'             ? (evt.badgeText || 'FRIDGE LOCK')
                     : evt.type === 'motivational-chef'       ? (evt.badgeText || 'TEAM CAPTAIN')
                     : evt.type === 'chef-delegation'         ? (evt.badgeText || 'MASTER DELEGATOR')
                     : evt.type === 'chaos-chef'              ? (evt.badgeText || 'CHAOS KITCHEN')
                     : evt.type === 'hype-chef'               ? (evt.badgeText || 'HYPE CHEF')
                     : evt.type === 'improviser-chef'         ? (evt.badgeText || 'IMPROV KITCHEN')
                     : evt.type === 'micromanager'            ? (evt.badgeText || 'MICROMANAGER')
                     : evt.type === 'chef-ego-success'        ? (evt.badgeText || 'CHEF EGO WIN')
                     : evt.type === 'chef-ego-fail'           ? (evt.badgeText || 'CHEF EGO FAIL')
                     : evt.type === 'chef-meltdown'           ? (evt.badgeText || 'CHEF MELTDOWN')
                     : evt.type === 'motivator-desperate'     ? (evt.badgeText || 'DESPERATION')
                     : evt.type === 'motivator-meltdown'      ? (evt.badgeText || 'MELTDOWN')
                     : evt.type === 'delegator-doubt'         ? (evt.badgeText || 'SELF-DOUBT')
                     : evt.type === 'delegator-micromanage'   ? (evt.badgeText || 'LOST CONTROL')
                     : evt.type === 'chaos-spiral'            ? (evt.badgeText || 'SPIRAL')
                     : evt.type === 'chaos-momentum'          ? (evt.badgeText || 'MOMENTUM')
                     : evt.type === 'chaos-takeover'          ? (evt.badgeText || 'TAKEOVER')
                     : evt.type === 'hype-unfocused'          ? (evt.badgeText || 'UNFOCUSED')
                     : evt.type === 'hype-reality-check'      ? (evt.badgeText || 'REALITY CHECK')
                     : evt.type === 'improviser-bold'         ? (evt.badgeText || 'GOING BOLDER')
                     : evt.type === 'improviser-panic'        ? (evt.badgeText || 'BACK TO BASICS')
                     : evt.type === 'improviser-risky'        ? (evt.badgeText || 'WILD CARD')
                     : evt.type === 'flambe-explosion'        ? (evt.badgeText || 'FLAMBE FAIL')
                     : evt.type === 'showmance-fire-reaction' ? (evt.badgeText || 'PROTECTIVE INSTINCT')
                     : evt.type === 'food-gobbler-confess'    ? (evt.badgeText || 'FOOD THIEF (CONFESSED)')
                     : evt.type === 'food-gobbler-hide'       ? (evt.badgeText || 'FOOD THIEF (HIDDEN)')
                     : evt.type === 'ingredient-drop-save'    ? (evt.badgeText || 'IMPROV SAVE')
                     : evt.type === 'ingredient-drop'         ? (evt.badgeText || 'INGREDIENT DROP')
                     : evt.type === 'kitchen-fire'            ? (evt.badgeText || 'KITCHEN FIRE')
                     : evt.type === 'team-rally'              ? (evt.badgeText || 'TEAM RALLY')
                     : evt.type === 'knife-slip-hero'         ? (evt.badgeText || 'COOKING THROUGH PAIN')
                     : evt.type === 'knife-slip-out'          ? (evt.badgeText || 'KNIFE INJURY')
                     : evt.type === 'allergic-reaction'       ? (evt.badgeText || 'ALLERGIC REACTION')
                     : evt.type === 'spill-disaster'          ? (evt.badgeText || 'SPILL DISASTER')
                     : evt.type === 'wrong-recipe'            ? (evt.badgeText || 'WRONG RECIPE')
                     : evt.type === 'raw-food-scare'          ? (evt.badgeText || 'RAW FOOD')
                     : evt.type === 'oven-malfunction-share'  ? (evt.badgeText || 'OVEN MALFUNCTION')
                     : evt.type === 'oven-malfunction'        ? (evt.badgeText || 'OVEN DOWN')
                     : evt.type === 'food-fight-flirt'        ? (evt.badgeText || 'FOOD FIGHT FLIRT')
                     : evt.type === 'food-fight'              ? (evt.badgeText || 'FOOD FIGHT')
                     : evt.type === 'taste-war'               ? (evt.badgeText || 'TASTE WAR')
                     : evt.type === 'perfect-pairing'         ? (evt.badgeText || 'PERFECT PAIRING')
                     : evt.type === 'cooking-spark'           ? (evt.badgeText || 'COOKING SPARK')
                     : evt.type === 'dish-stealing'           ? (evt.badgeText || 'CREDIT THIEF')
                     : evt.type === 'chopping-competition'    ? (evt.badgeText || 'CHOP-OFF')
                     : evt.type === 'kitchen-dance'           ? (evt.badgeText || 'KITCHEN DANCE')
                     : evt.type === 'comfort-cooking-success' ? (evt.badgeText || 'COMFORT FOOD')
                     : evt.type === 'comfort-cooking-fail'    ? (evt.badgeText || 'OFF-SCRIPT FAIL')
                     : evt.type === 'mentor-moment'           ? (evt.badgeText || 'MENTOR')
                     : evt.type === 'encouragement'           ? (evt.badgeText || 'ENCOURAGEMENT')
                     : evt.type === 'natural-talent'          ? (evt.badgeText || 'NATURAL TALENT')
                     : evt.type === 'plating-artist'          ? (evt.badgeText || 'PLATING ARTIST')
                     : evt.type === 'taste-tester-hero'       ? (evt.badgeText || 'TASTE TESTER HERO')
                     : evt.type === 'crowd-pleaser'           ? (evt.badgeText || 'CROWD PLEASER')
                     : evt.type === 'flavor-breakthrough'     ? (evt.badgeText || 'FLAVOR BREAKTHROUGH')
                     : evt.type === 'garnish-save'            ? (evt.badgeText || 'GARNISH SAVE')
                     : evt.type === 'efficient-prep'          ? (evt.badgeText || 'SPEED PREP')
                     : evt.type === 'clean-station'           ? (evt.badgeText || 'CLEAN STATION')
                     : evt.type === 'presentation-disaster'   ? (evt.badgeText || 'UGLY DISH')
                     : evt.type === 'sous-chef-clutch'        ? (evt.badgeText || 'SOUS CHEF HERO')
                     : evt.type === 'underdog-cook'           ? (evt.badgeText || 'UNDERDOG COOK')
                     : evt.type === 'ingredient-theft-caught' ? (evt.badgeText || 'SABOTEUR CAUGHT')
                     : evt.type === 'ingredient-theft-success'? (evt.badgeText || 'INGREDIENT THIEF')
                     : evt.type === 'spice-bomb-caught'       ? (evt.badgeText || 'SPICE BOMB FAIL')
                     : evt.type === 'spice-bomb-success'      ? (evt.badgeText || 'SPICE BOMB')
                     : evt.type === 'distraction-play'        ? (evt.badgeText || 'DISTRACTION')
                     : evt.type === 'trash-talk'              ? (evt.badgeText || 'TRASH TALK')
                     : evt.type === 'copycat-accusation'      ? (evt.badgeText || 'COPYCAT ACCUSATION')
                     : evt.type === 'kitchen-spy'             ? (evt.badgeText || 'KITCHEN SPY')
                     : evt.type === 'teamwork-montage'        ? (evt.badgeText || 'TEAMWORK MONTAGE')
                     : evt.type === 'mvp-chef'                ? (evt.badgeText || 'MVP CHEF')
                     : evt.type === 'sous-chef-hero'          ? (evt.badgeText || 'SOUS CHEF HERO')
                     : evt.type === 'underdog-cook-camp'      ? (evt.badgeText || 'HIDDEN CHEF')
                     : evt.type === 'kitchen-couple'          ? (evt.badgeText || 'KITCHEN COUPLE')
                     : evt.type === 'disaster-culprit'        ? (evt.badgeText || 'KITCHEN DISASTER')
                     : evt.type === 'fridge-lock-drama'       ? (evt.badgeText || 'FRIDGE LOCK')
                     : evt.type === 'saboteur-exposed'        ? (evt.badgeText || 'SABOTEUR')
                     : evt.type === 'food-gobbler-shame'      ? (evt.badgeText || 'FOOD THIEF SUSPECT')
                     : evt.type === 'tyrant-backlash'         ? (evt.badgeText || 'TYRANT BACKLASH')
                     : evt.type === 'quiet-leader'            ? (evt.badgeText || 'QUIET LEADER')
                     : evt.type === 'group-shame'             ? (evt.badgeText || 'KITCHEN DISASTER')
                     : evt.type === 'soMorale'                 ? (evt.badgeText || evt.badge || 'MORALE BOOST')
                     : evt.type === 'soFireConfession'         ? (evt.badgeText || evt.badge || 'CONFESSION')
                     : evt.type === 'soSurvivor'               ? (evt.badgeText || evt.badge || 'SURVIVOR')
                     : evt.type === 'soCampBuilder'            ? (evt.badgeText || evt.badge || 'CAMP BUILDER')
                     : evt.type === 'soBrave'                  ? (evt.badgeText || evt.badge || 'BRAVE')
                     : evt.type === 'soPeacemaker'             ? (evt.badgeText || evt.badge || 'PEACEMAKER')
                     : evt.type === 'soDeadWeight'             ? (evt.badgeText || evt.badge || 'DEAD WEIGHT')
                     : evt.type === 'soTroublemaker'           ? (evt.badgeText || evt.badge || 'TROUBLEMAKER')
                     : evt.type === 'soQuitter'                ? (evt.badgeText || evt.badge || 'QUITTER')
                     : evt.type === 'rewardBackfireAlliance'   ? (evt.badgeText || 'BACKFIRE')
                     : evt.type === 'rewardBackfireBloc'       ? (evt.badgeText || 'LEFT BEHIND')
                     : evt.type === 'emissaryVolunteer'       ? (evt.badgeText || 'EMISSARY')
                     : evt.type === 'emissaryPitch'           ? (evt.badgeText || 'PITCH')
                     : evt.type === 'emissaryObservation'     ? (evt.badgeText || 'EMISSARY')
                     : evt.type === 'emissaryDeal'            ? (evt.badgeText || 'CROSS-TRIBE DEAL')
                     : evt.type === 'sideDeal'                  ? (evt.badgeText || 'SIDE DEAL')
                     : evt.type === 'infoTrade'                 ? (evt.badgeText || 'INFO TRADE')
                     : evt.type === 'loyaltyTest'               ? (evt.badgeText || 'LOYALTY TEST')
                     : evt.type === 'loyaltyTestFailed'         ? (evt.badgeText || 'FAILED TEST')
                     : evt.type === 'loyaltyTestPassed'         ? (evt.badgeText || 'TRUST EARNED')
                     : evt.type === 'votePitch'                 ? (evt.badgeText || 'VOTE PITCH')
                     : evt.type === 'apology'                   ? (evt.badgeText || 'MAKING AMENDS')
                     : evt.type === 'votePitchFailed'           ? (evt.badgeText || 'FAILED PITCH')
                     : evt.type === 'falseInfoBlowup'           ? (evt.badgeText || 'LIE EXPOSED')
                     : evt.type === 'loyaltyTestCaught'         ? (evt.badgeText || 'TEST CAUGHT')
                     : evt.type === 'conflictingDeals'          ? (evt.badgeText || 'DOUBLE DEALER')
                     : evt.type === 'perceptionRealization'     ? (evt.badgeText || 'WAKE-UP CALL')
                     : evt.type === 'villainManipulation'       ? (evt.badgeText || 'ONE-SIDED')
                     : evt.type === 'goatKeeping'               ? (evt.badgeText || 'ONE-SIDED')
                     : evt.type === 'swapLoyaltyAssumption'     ? (evt.badgeText || 'ONE-SIDED')
                     : evt.type === 'providerEntitlement'       ? (evt.badgeText || 'ONE-SIDED')
                     : evt.type === 'showmanceBlindspot'        ? (evt.badgeText || 'ONE-SIDED')
                     : evt.type === 'allianceBlindspot'         ? (evt.badgeText || 'ONE-SIDED')
                     : evt.type === 'betrayalDenial'            ? (evt.badgeText || 'ONE-SIDED')
                     : evt.type === 'firstImpressionsSwap'      ? (evt.badgeText || 'SWAPPED')
                     : evt.type === 'paranoiaSpiral'       ? '⚠ Paranoia Spiral'
                     : evt.type === 'firstMove'            ? (evt.badgeText || 'FIRST MOVE')
                     : evt.type === 'showmanceProtective'  ? (evt.badgeText || 'PROTECTIVE')
                     : evt.type === 'showmanceJealousy' && evt.badgeText ? evt.badgeText
                     : evt.type === 'showmanceSacrifice'   ? (evt.badgeText || 'SACRIFICE')
                     : evt.type === 'showmancePDA'         ? (evt.badgeText || 'PDA')
                     : evt.type === 'phobiaComfort'         ? (evt.badgeText || 'COMFORT')
                     : evt.type === 'phobiaSupport'         ? (evt.badgeText || 'SUPPORT')
                     : evt.type === 'friendshipJealousy'    ? (evt.badgeText || 'FEELING LEFT OUT')
                     : evt.type === 'showmanceSabotage'    ? (evt.badgeText || 'SHOWMANCE SABOTAGE')
                     : evt.type === 'showmanceSpark'       ? '💕 Showmance'
                     : evt.type === 'showmanceHoneymoon'   ? '💕 Honeymoon'
                     : evt.type === 'showmanceNoticed'     ? '⚠ Power Couple'
                     : evt.type === 'showmanceTarget'      ? '🎯 Split Them Up'
                     : evt.type === 'showmanceJealousy'    ? 'Third Wheel'
                     : evt.type === 'showmanceRideOrDie'   ? '💕 Ride or Die'
                     : evt.type === 'allianceExpelled'      ? 'EXPELLED'
                     : evt.type === 'journeyLoss'          ? 'NO VOTE'
                     : evt.type === 'pureHatred'           ? 'PURE HATRED'
                     : evt.type === 'nemesis'              ? 'NEMESIS'
                     : evt.type === 'unbreakableBond'      ? 'UNBREAKABLE'
                     : evt.type === 'rideOrDie'            ? 'RIDE OR DIE'
                     : evt.type === 'rekindle'             ? 'REKINDLE'
                     : evt.type === 'breakup'              ? 'BREAKUP'
                     : evt.type === 'confessional'         ? 'Confessional'
                     : evt.type === 'groupLaugh'           ? '+ Tribe lightens up'
                     : evt.type === 'sharedStruggle'       ? '+ Bonded through it'
                     : evt.type === 'rivalThaw'            ? '+ Tension easing'
                     : evt.type === 'teachingMoment'       ? '+ Mentor'
                     : evt.type === 'vulnerability'        ? '+ Opened up'
                     : evt.type === 'insideJoke'           ? '+ Inside joke'
                     : evt.type === 'loyaltyProof'         ? '+ Defended'
                     : evt.type === 'jealousy'             ? '\u2212 Jealousy'
                     : evt.type === 'exclusion'            ? '\u2212 Left out'
                     : evt.type === 'blame'                ? '\u2212 Blamed'
                     : evt.type === 'passiveAggressive'    ? '\u2212 Passive-aggressive'
                     : evt.type === 'trustCrack'           ? '\u2212 Trust cracked'
                     : isMoleSabotage    ? (evt.badgeText || 'MOLE')
                     : isMoleLayLow      ? (evt.badgeText || 'LAYING LOW')
                     : isMoleExposed     ? (evt.badgeText || 'MOLE EXPOSED')
                     : isMoleSuspicion   ? (evt.badgeText || 'SUSPICION')
                     : isMoleReveal      ? (evt.badgeText || 'THE MOLE')
                     : isDareComplete   ? (evt.badgeText || 'DARE COMPLETED')
                     : isDareMVP        ? (evt.badgeText || 'DAREDEVIL')
                     : isDareGift       ? (evt.badgeText || 'FREEBIE SHARED')
                     : isDarePact       ? (evt.badgeText || 'DEAL STRUCK')
                     : isDarePactBetray ? (evt.badgeText || 'PACT BROKEN')
                     : isDareAllyBetray ? (evt.badgeText || 'BETRAYED')
                     : isDareRefusal    ? (evt.badgeText || 'LEFT HANGING')
                     : isDareElim       ? (evt.badgeText || 'COULDN\'T TAKE IT')
                     : isSayUncleWin    ? (evt.badgeText || 'LAST ONE STANDING')
                     : isSayUncleDom    ? (evt.badgeText || 'DIDN\'T FLINCH')
                     : isSayUncleBack   ? (evt.badgeText || 'BACKFIRE')
                     : isSayUncleCalled ? (evt.badgeText || 'CALLED IT')
                     : isSayUncleFail   ? (evt.badgeText || 'SAID UNCLE')
                     : isSayUncleEndure ? (evt.badgeText || 'ENDURED')
                     : isPhobiaConf    ? (evt.badgeText || 'CONFESSION')
                     : isPhobiaConq    ? (evt.badgeText || 'CONQUERED')
                     : isPhobiaFail    ? (evt.badgeText || 'COULDN\'T DO IT')
                     : isPhobiaClutchP ? (evt.badgeText || 'CLUTCH')
                     : isPhobiaClutchF ? (evt.badgeText || 'CHOKED')
                     : isPhobiaShared  ? (evt.badgeText || 'SHARED FEAR')
                     : isPhobiaBlame   ? (evt.badgeText || 'COST THE TRIBE')
                     : isPos && isPersonal  ? '+ Bond formed'
                     : isPos                ? '+ Bond boost'
                     : isNeg && isPersonal  ? '\u2212 Personal tension'
                     : isNeg                ? '\u2212 Camp tension' : '';
    const badgeClass = isHothead || isLie || isPrankBad || isScramble || isInjury ? 'red'
                     : isPrankGood ? 'green'
                     : isMastermind || isBeastD ? 'gold'
                     : isExileSelect ? 'red'
                     : isTipOff || isIdolShare || isIdolConf || isIdolFind || isIdolSpot || isShowmance ? 'gold'
                     : isAlliance ? 'gold' : isAllianceRef ? 'red' : isAllianceCrk ? 'red'
                     : isSocialBomb || isSocialReact ? 'red'
                     : isChalThreat || isChalReact ? 'gold'
                     : isGoatId || isGoatObs ? 'gold'
                     : isFtcThreat || isFtcStrat ? 'red'
                     : isComfortBS || isClockingIt ? 'gold'
                     : isTdStrategy ? 'gold'
                     : isAmuletConf || isAmuletWeight || isAmuletDilemma ? 'gold'
                     : isAmuletLeak || isAmuletSnoop ? 'red'
                     : evt.type === 'teamSwapFound' || evt.type === 'voteBlockFound' || evt.type === 'voteStealFound' ? 'gold'
                     : evt.type === 'teamSwapConfession' ? 'gold'
                     : evt.type === 'teamSwapSnooped' || evt.type === 'voteBlockSnooped' || evt.type === 'voteStealSnooped' ? 'red'
                     : evt.type === 'safetyNoPowerFound' || evt.type === 'safetyNoPowerConfession' || evt.type === 'safetyNoPowerEscaped' ? 'gold'
                     : evt.type === 'safetyNoPowerSnooped' || evt.type === 'safetyNoPowerAftermath' ? 'red'
                     : evt.type === 'soleVoteFound' || evt.type === 'soleVoteConfession' ? 'gold'
                     : evt.type === 'soleVoteSnooped' || evt.type === 'soleVoteFallout' || evt.type === 'soleVoteWasted' || evt.type === 'soleVoteAccomplice' ? 'red'
                     : evt.type === 'miscommunicationFallout' ? 'red'
                     : isAmuletSec ? 'gold'
                     : isCRExposure || isCRDissolved || isCRBlowup ? 'red'
                     : isCRSurvived || isCRVindicated ? 'green'
                     : isCRCracked || isCRPivot ? 'gold'
                     : evt.type === 'fanVoteWinner' ? 'gold'
                     : evt.type === 'fanVoteJealousy' ? 'red'
                     : evt.type === 'villainIntimidate' ? 'red'
                     : evt.type === 'villainPower' ? 'red'
                     : evt.type === 'villainGloat' ? 'red'
                     : evt.type === 'villainLoyalty' ? 'gold'
                     : evt.type === 'heroConfront' ? 'gold'
                     : evt.type === 'heroProtect' ? 'green'
                     : evt.type === 'heroSacrifice' ? 'green'
                     : evt.type === 'heroWeight' ? ''
                     : evt.type === 'socialIntel' ? (evt.badgeClass || 'gold')
                     : evt.type === 'allianceDissolved' ? 'red'
                     : evt.type === 'kipAftermath' ? (evt.badgeClass || 'red')
                     : evt.type === 'amuletReunion' ? (evt.badgeClass || 'gold')
                     : evt.type === 'amuletBetrayal' ? (evt.badgeClass || 'gold')
                     : evt.type === 'amuletRivalry' ? 'red'
                     : evt.type === 'amuletUpgrade' ? (evt.badgeClass || 'gold')
                     : evt.type === 'legacyInheritance' ? (evt.badgeClass || 'gold')
                     : evt.type === 'legacyConfession' ? 'gold'
                     : evt.type === 'legacyLeak' ? 'red'
                     : evt.type === 'legacyScheme' ? 'red'
                     : evt.type === 'legacyWeight' ? ''
                     : evt.type === 'legacyHeirWatch' ? 'gold'
                     : evt.type === 'brokerWhisper' || evt.type === 'brokerManipulate' || evt.type === 'brokerConfidence' || evt.type === 'brokerClose' ? 'gold'
                     : evt.type === 'brokerExposed' || evt.type === 'brokerFallout' ? 'red'
                     : evt.type === 'brokerDefense' ? (pStats(evt.players?.[0])?.boldness >= 6 ? 'gold' : 'red')
                     : evt.type === 'blackVoteGuess' ? (evt.badgeClass || 'gold')
                     : evt.type === 'fakeIdolCaught' || evt.type === 'fakeIdolPlanted' || evt.type === 'fakeIdolConfrontation' ? 'red'
                     : evt.type === 'fakeIdolFound' ? (evt.badgeClass || 'gold')
                     : evt.type === 'medevacReplacement' ? 'gold'
                     : evt.type === 'challengeThrowCaught' ? 'red'
                     : evt.type === 'stolenCredit' ? 'gold'
                     : evt.type === 'stolenCreditConfrontation' ? (evt.badgeClass || 'red')
                     : evt.type === 'providerFishing' || evt.type === 'providerForaging' || evt.type === 'providerPraised' || evt.type === 'foodRationing' ? 'gold'
                     : evt.type === 'slackerBonding' || evt.type === 'starvationBond' ? 'green'
                     : evt.type === 'slackerCalledOut' || evt.type === 'slackerConfrontation' || evt.type === 'foodConflict' || evt.type === 'foodHoarding' || evt.type === 'foodCrisis' || evt.type === 'survivalCollapse' || evt.type === 'medevac' || evt.type === 'providerVotedOut' ? 'red'
                     : evt.type === 'sideDeal' || evt.type === 'infoTrade' || evt.type === 'loyaltyTest' || evt.type === 'votePitch' || evt.type === 'strategicApproach' || evt.type === 'readingRoom' ? 'gold'
                     : evt.type === 'idolSearch' ? 'gold'
                     : evt.type === 'paranoia' ? 'red'
                     : evt.type === 'apology' ? 'green'
                     : evt.type === 'votePitchFailed' ? 'red'
                     : evt.type === 'loyaltyTestPassed' ? 'green'
                     : evt.type === 'loyaltyTestFailed' || evt.type === 'loyaltyTestCaught' || evt.type === 'conflictingDeals' || evt.type === 'perceptionRealization' || evt.type === 'falseInfoBlowup' || evt.type === 'votePitchFailed' ? 'red'
                     : evt.type === 'villainManipulation' || evt.type === 'goatKeeping' || evt.type === 'swapLoyaltyAssumption' || evt.type === 'providerEntitlement' || evt.type === 'showmanceBlindspot' || evt.type === 'allianceBlindspot' || evt.type === 'betrayalDenial' || evt.type === 'firstImpressionsSwap' ? 'gold'
                     : evt.type === 'paranoiaSpiral' ? 'red'
                     : isTriangleNeg ? 'red'
                     : isTriangleGold ? 'gold'
                     : isTriangleRes ? (evt.type === 'triangleLonely' ? 'red' : 'gold')
                     : isAffairNeg || isAffairChoice ? 'red'
                     : isAffairGold ? 'gold'
                     : evt.type === 'firstMove' ? 'gold'
                     : evt.type === 'showmanceProtective' || evt.type === 'showmanceSacrifice' || evt.type === 'showmancePDA' || evt.type === 'phobiaComfort' || evt.type === 'phobiaSupport' ? 'gold'
                     : evt.type === 'showmanceSabotage' ? 'red'
                     : evt.type === 'showmanceSpark' || evt.type === 'showmanceHoneymoon' || evt.type === 'showmanceRideOrDie' || evt.type === 'showmanceRekindle' ? 'green'
                     : evt.type === 'showmanceNoticed' || evt.type === 'showmanceTarget' ? 'gold'
                     : evt.type === 'showmanceJealousy' || evt.type === 'showmanceBreakup' || evt.type === 'friendshipJealousy' ? 'red'
                     : evt.type === 'allianceExpelled' ? 'red'
                     : evt.type === 'journeyLoss' ? 'red'
                     : evt.type === 'pureHatred' || evt.type === 'nemesis' || evt.type === 'breakup' ? 'red'
                     : evt.type === 'unbreakableBond' || evt.type === 'rideOrDie' || evt.type === 'rekindle' ? 'green'
                     : isSchemer ? 'red'
                     : isMoleSabotage ? 'red'
                     : isMoleLayLow ? ''
                     : isMoleExposed ? 'red'
                     : isMoleSuspicion ? 'gold'
                     : evt.type === 'volunteerExileDuel' ? 'gold'
                     : evt.type === 'emissaryVolunteer' || evt.type === 'emissaryPitch' || evt.type === 'emissaryDeal' ? 'gold'
                     : evt.type === 'emissaryObservation' ? ''
                     : evt.type === 'dodgebrawlTeamPlayer' || evt.type === 'dodgebrawlHero' || evt.type === 'dodgebrawlRedemption' ? 'gold'
                     : evt.type === 'dodgebrawlRefusal' || evt.type === 'dodgebrawlChoke' || evt.type === 'dodgebrawlLiability' ? 'red'
                     : evt.type === 'talentShowStandingOvation' || evt.type === 'talentShowUnlikelyHero' || evt.type === 'talentShowTeamSupport' ? 'gold'
                     : evt.type === 'talentShowSabotageFallout' || evt.type === 'talentShowDisaster' || evt.type === 'talentShowBitterReject' ? 'red'
                     : evt.type === 'spyMission' || evt.type === 'pepTalk' || evt.type === 'accidentSubstitution' || evt.type === 'secretRehearsalSubIn' || evt.type === 'secretRehearsalAlone' ? 'gold'
                     : evt.type === 'sabotageSetup' || evt.type === 'rivalryConfrontation' || evt.type === 'accidentInjury' || evt.type === 'stageFright' || evt.type === 'trashTalk' ? 'red'
                     : evt.type === 'allianceHuddle' || evt.type === 'preShowJitters' ? 'gold'
                     : evt.type === 'soNavigator' || evt.type === 'soShelter' || evt.type === 'soFire' || evt.type === 'soProvider' || evt.type === 'soFireside' || evt.type === 'soShortcut' || evt.type === 'soCarried' || evt.type === 'soStargazing' || evt.type === 'soBonding' || evt.type === 'soFoodSpotted' || evt.type === 'soShowmance' || evt.type === 'soRaceLeader' || evt.type === 'soMorale' || evt.type === 'soFireConfession' || evt.type === 'soSurvivor' || evt.type === 'soCampBuilder' || evt.type === 'soBrave' || evt.type === 'soPeacemaker' ? 'gold'
                     : evt.type === 'soLost' || evt.type === 'soCostTribe' || evt.type === 'soSlacker' || evt.type === 'soPrank' || evt.type === 'soTentFire' || evt.type === 'soRainstorm' || evt.type === 'soWanderedOff' || evt.type === 'soArgument' || evt.type === 'soShelterCollapse' || evt.type === 'soBearPrank' || evt.type === 'soDeadWeight' || evt.type === 'soTroublemaker' || evt.type === 'soQuitter' ? 'red'
                     : evt.type === 'soGhostStory' || evt.type === 'soBear' || evt.type === 'soCuddling' || evt.type === 'soScheme' || evt.type === 'soScaryNoise' || evt.type === 'soNightmare' || evt.type === 'soCantSleep' || evt.type === 'soSneakOff' || evt.type === 'soLagger' ? ''
                     : evt.type === 'utcPartnerPick' || evt.type === 'utcFastPair' || evt.type === 'utcShortcut' || evt.type === 'utcLighter' || evt.type === 'utcFireStarter' || evt.type === 'utcSwimmerHero' || evt.type === 'utcSprintFinish' || evt.type === 'utcMotivational' || evt.type === 'utcSoloPaddler' || evt.type === 'utcCanoeRomance' ? 'gold'
                     : evt.type === 'utcRejected' || evt.type === 'utcSlowPair' || evt.type === 'utcCapsized' || evt.type === 'utcDroppedCanoe' || evt.type === 'utcPaddleBurn' || evt.type === 'utcAdviceGiver' || evt.type === 'utcCheating' || evt.type === 'utcInjury' ? 'red'
                     : evt.type === 'utcWildlife' || evt.type === 'utcQuicksand' || evt.type === 'utcPhotoFinish' || evt.type === 'utcBoneyMist' || evt.type === 'utcSkeletonFind' ? ''
                     : evt.type === 'utcCursedIdol' || evt.type === 'utcWeakLink' ? 'red'
                     : evt.type === 'utcMVP' || evt.type === 'utcHeroMoment' ? 'gold'
                     : evt.type === 'pbAmbush' || evt.type === 'pbSneakAttack' || evt.type === 'pbMVPHunter' || evt.type === 'pbLastDeer' || evt.type === 'pbRebellionHero' || evt.type === 'pbDoublefind' || evt.type === 'pbWarFreeShot' || evt.type === 'pbDeerStampede' || evt.type === 'pbCamouflage' || evt.type === 'pbRebellion' || evt.type === 'pbDecoy' || evt.type === 'pbDeerBonding' || evt.type === 'pbDeerPact' || evt.type === 'pbTreeClimb' || evt.type === 'pbEpicChase' || evt.type === 'pbHunterProtects' || evt.type === 'pbWaterDive' || evt.type === 'pbDecoyTrail' || evt.type === 'pbScentTrack' || evt.type === 'pbHighGround' || evt.type === 'pbBaitTrap' ? 'gold'
                     : evt.type === 'pbBearEncounter' || evt.type === 'pbFriendlyFireAccident' || evt.type === 'pbFriendlyFireDeliberate' || evt.type === 'pbRetaliation' || evt.type === 'pbWarEscalation' || evt.type === 'pbSympathyShot' || evt.type === 'pbBearMauled' || evt.type === 'pbFriendlyFireCulprit' || evt.type === 'pbWarInstigator' || evt.type === 'pbFirstPainted' || evt.type === 'pbMudSlide' || evt.type === 'pbMisfire' || evt.type === 'pbHunterRivalry' || evt.type === 'pbAllianceRebellion' ? 'red'
                     : evt.type === 'pbMiss' || evt.type === 'pbNotFound' || evt.type === 'pbAntlersLocked' || evt.type === 'pbObsessiveChase' || evt.type === 'pbAllianceStandoff' || evt.type === 'pbTaunt' || evt.type === 'pbCrossTribeEncounter' || evt.type === 'pbHunterScheme' || evt.type === 'pbCrossRoleWhisper' || evt.type === 'pbAllianceMeeting' || evt.type === 'pbHit' || evt.type === 'pbConfessional' || evt.type === 'pbHunterTrashTalk' || evt.type === 'pbCloseCall' || evt.type === 'pbSprintBurst' || evt.type === 'pbGrossOut' || evt.type === 'pbPatience' ? ''
                     : evt.type === 'chef-showdown' || evt.type === 'motivational-chef' || evt.type === 'chef-delegation' || evt.type === 'hype-chef' || evt.type === 'chef-ego-success' || evt.type === 'showmance-fire-reaction' || evt.type === 'ingredient-drop-save' || evt.type === 'team-rally' || evt.type === 'knife-slip-hero' || evt.type === 'perfect-pairing' || evt.type === 'cooking-spark' || evt.type === 'kitchen-dance' || evt.type === 'comfort-cooking-success' || evt.type === 'mentor-moment' || evt.type === 'encouragement' || evt.type === 'natural-talent' || evt.type === 'plating-artist' || evt.type === 'taste-tester-hero' || evt.type === 'crowd-pleaser' || evt.type === 'flavor-breakthrough' || evt.type === 'garnish-save' || evt.type === 'efficient-prep' || evt.type === 'clean-station' || evt.type === 'sous-chef-clutch' || evt.type === 'underdog-cook' || evt.type === 'teamwork-montage' || evt.type === 'mvp-chef' || evt.type === 'sous-chef-hero' || evt.type === 'underdog-cook-camp' || evt.type === 'kitchen-couple' || evt.type === 'quiet-leader' ? 'gold'
                     : evt.type === 'tyrannical-chef' || evt.type === 'fridge-lock' || evt.type === 'chef-ego-fail' || evt.type === 'chef-meltdown' || evt.type === 'flambe-explosion' || evt.type === 'food-gobbler-hide' || evt.type === 'ingredient-drop' || evt.type === 'kitchen-fire' || evt.type === 'knife-slip-out' || evt.type === 'allergic-reaction' || evt.type === 'spill-disaster' || evt.type === 'wrong-recipe' || evt.type === 'raw-food-scare' || evt.type === 'oven-malfunction' || evt.type === 'dish-stealing' || evt.type === 'presentation-disaster' || evt.type === 'ingredient-theft-caught' || evt.type === 'spice-bomb-caught' || evt.type === 'disaster-culprit' || evt.type === 'fridge-lock-drama' || evt.type === 'saboteur-exposed' || evt.type === 'food-gobbler-shame' || evt.type === 'tyrant-backlash' || evt.type === 'group-shame' || evt.type === 'tyrant-singles-out' || evt.type === 'tyrant-errand' || evt.type === 'tyrant-pressure' || evt.type === 'motivator-meltdown' || evt.type === 'delegator-micromanage' || evt.type === 'chaos-spiral' ? 'red'
                     : evt.type === 'chaos-chef' || evt.type === 'improviser-chef' || evt.type === 'micromanager' || evt.type === 'food-gobbler-confess' || evt.type === 'oven-malfunction-share' || evt.type === 'food-fight' || evt.type === 'food-fight-flirt' || evt.type === 'taste-war' || evt.type === 'chopping-competition' || evt.type === 'comfort-cooking-fail' || evt.type === 'ingredient-theft-success' || evt.type === 'spice-bomb-success' || evt.type === 'distraction-play' || evt.type === 'trash-talk' || evt.type === 'copycat-accusation' || evt.type === 'kitchen-spy' || evt.type === 'tyrant-snapback' || evt.type === 'tyrant-conspiracy' || evt.type === 'motivator-desperate' || evt.type === 'delegator-doubt' || evt.type === 'hype-unfocused' || evt.type === 'improviser-panic' || evt.type === 'improviser-risky' || evt.type === 'hype-reality-check' ? ''
                     : evt.type === 'chaos-momentum' || evt.type === 'chaos-takeover' || evt.type === 'improviser-bold' ? 'gold'
                     : evt.type === 'trustGrudgingRespect' || evt.type === 'trustBravery' || evt.type === 'trustPerfectDish' || evt.type === 'trustRedemptionWitness' ? 'gold'
                     : evt.type === 'trustSabotageHumiliation' || evt.type === 'trustSabotageRopeDrop' || evt.type === 'trustDeliberatePoisoning' || evt.type === 'trustCatcherSabotage' || evt.type === 'trustRuleBreak' || evt.type === 'trustPostArgument' ? 'red'
                     : evt.type === 'trustBelayerDistracted' || evt.type === 'trustPoisoning' || evt.type === 'trustWildShooter' || evt.type === 'trustFrozenRefuse' || evt.type === 'trustJellyfishFall' ? 'red'
                     : isMoleReveal ? 'gold'
                     : isDareComplete || isDareMVP || isDareGift || isDarePact ? 'gold'
                     : isDarePactBetray || isDareAllyBetray || isDareRefusal || isDareElim ? 'red'
                     : isSayUncleWin || isSayUncleDom || isSayUncleEndure ? 'gold'
                     : isSayUncleBack || isSayUncleFail || isSayUncleCalled ? 'red'
                     : isPhobiaConf || isPhobiaConq || isPhobiaClutchP || isPhobiaShared ? 'gold'
                     : isPhobiaFail || isPhobiaClutchF || isPhobiaBlame ? 'red'
                     : evt.type === 'fight' || evt.type === 'meltdown' || evt.type === 'dispute' || evt.type === 'leadershipClash' || evt.type === 'intimidation' ? 'red'
                     : evt.type === 'bond' || evt.type === 'tdBond' || evt.type === 'comfort' || evt.type === 'flirtation' ? 'green'
                     : evt.type === 'strategicTalk' || evt.type === 'bigMoveThoughts' || evt.type === 'mastermindOrchestrates' || evt.type === 'wildcardPivot' || evt.type === 'chaosAgentStirsUp' ? 'gold'
                     : evt.type === 'rumor' || evt.type === 'watchingYou' || evt.type === 'perceptiveReads' || evt.type === 'doubt' || evt.type === 'overplay' || evt.type === 'overconfidence' ? 'gold'
                     : evt.type === 'homesick' || evt.type === 'showboat' || evt.type === 'loneWolf' ? ''
                     : evt.type === 'floaterInvisible' || evt.type === 'tribeMood' || evt.type === 'weirdMoment' ? ''
                     : isPos ? 'green' : isNeg ? 'red' : '';

    html += `<div class="rp-brant-entry">`;
    if (mentioned.length >= 3) {
      html += `<div class="rp-brant-portraits">${mentioned.map(n => rpPortrait(n)).join('')}</div>`;
    } else if (mentioned.length === 2 && isRelEvt) {
      html += `<div class="rp-brant-portraits">${rpDuoImg(mentioned[0], mentioned[1])}</div>`;
    } else if (mentioned.length === 2) {
      html += `<div class="rp-brant-portraits">${mentioned.map(n => rpPortrait(n)).join('')}</div>`;
    } else if (mentioned.length === 1) {
      html += `<div class="rp-brant-portraits">${rpPortrait(mentioned[0])}</div>`;
    }
    html += `<div class="rp-brant-text" style="${isTipOff ? 'color:#e3b341' : ''}">${evt.text}</div>`;
    if (badgeText) html += `<span class="rp-brant-badge ${badgeClass}">${badgeText}</span>`;
    html += `</div>`;
  };

  if (events.length) {
    // Group events into Strategy / Social / Spotlight for all camps (pre-merge and post-merge)
    const stratTypes = new Set(['allianceForm','allianceCrack','sideDeal','strategicTalk',
      'eavesdrop','chalThreat','chalThreatReaction','idolConfession','idolShare','idolFound',
      'idolBetrayal','ftcThreatAlert','ftcThreatStrategist','comfortBlindspot','clockingIt',
      'watchingYou','goatIdentified','goatObserver','goatOblivious','scramble','lie',
      'overconfidence','bigMoveThoughts','schemerManipulates','mastermindOrchestrates','kipAftermath',
      'allianceDissolved','socialIntel','fanVoteWinner','fanVoteJealousy',
      'villainIntimidate','villainPower','villainGloat','villainLoyalty',
      'heroConfront','heroProtect','heroSacrifice','heroWeight',
      'amuletReunion','amuletUpgrade','amuletBetrayal','amuletRivalry','legacyInheritance',
      'legacyConfession','legacyLeak','legacyScheme','legacyWeight','legacyHeirWatch']);
    const spotTypes = new Set(['socialBomb','socialBombReaction','paranoiaSpiral','challengeThrowCaught','medevacReplacement','blackVoteGuess','fakeIdolCaught','fakeIdolFound','fakeIdolPlanted','fakeIdolConfrontation','stolenCredit','stolenCreditConfrontation',
      'brokerWhisper','brokerManipulate','brokerConfidence','brokerClose','brokerExposed','brokerFallout','brokerDefense',
      'showmancerMoment',
      'showmanceSpark','showmanceHoneymoon','showmanceNoticed','showmanceTarget','showmanceJealousy','showmanceRideOrDie',
      'unexpectedCompetence','underdogMoment','loneWolf','meltdown','leadershipClash',
      'showboat','pureHatred','nemesis','unbreakableBond','rideOrDie','rekindle','breakup',
      'hotheadExplosion','beastDrills','chaosAgentStirsUp','wildcardPivot',
      'providerFishing','providerForaging','providerPraised','slackerCalledOut','slackerConfrontation','slackerBonding','foodConflict','foodHoarding','starvationBond','foodRationing','foodCrisis','survivalCollapse','medevac','providerVotedOut']);
    const stratEvts = events.filter(e => stratTypes.has(e.type));
    const spotEvts  = events.filter(e => spotTypes.has(e.type));
    const socialEvts = events.filter(e => !stratTypes.has(e.type) && !spotTypes.has(e.type));

    const renderGroup = (label, evts, color) => {
      if (!evts.length) return;
      html += `<div style="margin-bottom:6px;padding:4px 0 4px 0;border-bottom:1px solid rgba(255,255,255,0.06)">
        <span style="font-size:10px;font-weight:700;letter-spacing:1.2px;color:${color};text-transform:uppercase">${label}</span>
      </div>`;
      evts.forEach(e => renderEvt(e));
    };

    renderGroup('Strategy', stratEvts, 'var(--accent-gold)');
    renderGroup('Social', socialEvts, 'var(--accent-ice)');
    renderGroup('Spotlight', spotEvts, 'var(--accent-fire)');
  } else {
    html += `<div style="font-size:12px;color:#484f58;text-align:center;padding:12px 0">No notable events at ${displayName} camp.</div>`;
  }

  // Signal cards: distilled story beats (capped at 5, injected after events list)
  const _signals = buildSignalCards(ep, portraitMembers);
  if (_signals.length) {
    html += `<div style="margin-top:16px;display:flex;flex-direction:column;gap:8px">
      <div style="font-size:10px;font-weight:700;letter-spacing:1.2px;color:#8b949e;text-transform:uppercase;margin-bottom:2px">KEY STORY BEATS</div>`;
    _signals.forEach(s => {
      const _sc = s.badgeClass === 'red' ? '#f85149' : s.badgeClass === 'green' ? '#3fb950' : '#e3b341';
      html += `<div style="display:flex;align-items:flex-start;gap:10px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-left:3px solid ${_sc};border-radius:4px;padding:8px 10px">
        ${(s.players||[]).length ? `<div style="display:flex;gap:4px;flex-shrink:0">${s.players.slice(0,2).map(n => rpPortrait(n)).join('')}</div>` : ''}
        <div>
          <div style="font-size:11px;font-weight:700;letter-spacing:0.8px;color:${_sc};text-transform:uppercase;margin-bottom:2px">${s.badge}</div>
          <div style="font-size:12px;color:#c9d1d9;line-height:1.4">${s.text}</div>
        </div>
      </div>`;
    });
    html += `</div>`;
  }

  html += `</div></div>`;

  // ── ALLIANCES ──
  // Use pre-tribal alliance snapshot (captures mid-episode state: after recruitment, before dissolution)
  // Falls back to post-episode snapshot if pre-tribal snapshot not available
  const _snapAlliances = (ep.alliancesPreTribal || ep.gsSnapshot?.namedAlliances || gs.namedAlliances || [])
    .filter(a => a.active !== false);
  const _tribeSet = new Set(portraitMembers);
  // Both pre- and post-challenge camp screens are before tribal council — the player
  // eliminated this episode is still in the game at this point in the story.
  // Always add them back so they show normally in their alliance.
  const _thisEpElimSet = new Set([
    ep.eliminated, ep.firstEliminated,
    ...(ep.multiTribalResults || []).map(r => r.eliminated),
    ...(ep.doubleTribalElims || []),
  ].filter(Boolean));
  const _activePlayerSet = new Set([
    ...(ep.gsSnapshot?.activePlayers || gs.activePlayers),
    ..._thisEpElimSet,
  ]);
  const _campAlliances = _snapAlliances.filter(a => a.members.some(m => _tribeSet.has(m)));
  if (_campAlliances.length) {
    html += `<div class="rp-camp-toggle-section">
      <button class="rp-camp-toggle-btn" style="border-color:${tc};color:${tc}" onclick="vpToggleSection('al-${safeId}')">
        ALLIANCES <span class="rp-toggle-arrow">\u25b2</span>
      </button>
      <div id="al-${safeId}" class="rp-camp-toggle-body">`;
    // Collect quits this episode, keyed by alliance name
    const _allianceQuitMap = {};
    (ep.allianceQuits || []).forEach(q => {
      if (!_allianceQuitMap[q.alliance]) _allianceQuitMap[q.alliance] = [];
      _allianceQuitMap[q.alliance].push(q.player);
    });

    _campAlliances.forEach(alliance => {
      const crossTribe = alliance.members.some(m => _activePlayerSet.has(m) && !_tribeSet.has(m));
      const quittersThisEp = _allianceQuitMap[alliance.name] || [];
      html += `<div class="rp-brant-entry" style="flex-direction:column;align-items:flex-start;gap:10px">
        <div style="display:flex;align-items:center;gap:8px;width:100%;flex-wrap:wrap">
          <span style="font-size:12px;font-weight:700;color:#e6edf3">${alliance.name}</span>
          ${alliance.formed === ep.num ? `<span class="rp-brant-badge gold">NEW THIS EP</span>` : crossTribe ? `<span class="rp-brant-badge" style="background:rgba(139,92,246,0.12);color:#a78bfa;border-color:rgba(139,92,246,0.3)">SPLIT</span>` : `<span class="rp-brant-badge gold">ACTIVE</span>`}
          ${quittersThisEp.length ? `<span class="rp-brant-badge red">${quittersThisEp.length} left</span>` : ''}
        </div>
        <div style="display:flex;gap:12px;flex-wrap:wrap">`;
      alliance.members.forEach(name => {
        if (!_activePlayerSet.has(name)) return;
        const inTribe = _tribeSet.has(name);
        const otherTribeName = inTribe ? '' : (() => {
          const t = (ep.tribesAtStart || ep.gsSnapshot?.tribes || []).find(t => t.members?.includes(name));
          return t?.name || '';
        })();
        // Alliance loyalty score: loyalty stat + avg bond with other alliance members
        const s = pStats(name);
        const allyPeers = alliance.members.filter(m => m !== name && _activePlayerSet.has(m));
        const avgBond = allyPeers.length
          ? allyPeers.reduce((sum, m) => sum + getBond(name, m), 0) / allyPeers.length
          : 0;
        const hasBetrayed = (alliance.betrayals || []).includes(name);
        // Bond-weighted: a high loyalty stat means nothing if you hate your allies
        const loyScore = Math.min(10, Math.max(1, Math.round(s.loyalty * 0.5 + avgBond * 0.8 + (hasBetrayed ? -2 : 0))));
        const loyColor = loyScore >= 8 ? '#3fb950' : loyScore >= 6 ? '#e3b341' : loyScore >= 4 ? '#f0a500' : '#f85149';
        const slug = (players.find(p=>p.name===name)?.slug) || name.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'');
        const init = (name||'?')[0].toUpperCase();
        html += `<div style="display:flex;flex-direction:column;align-items:center;gap:4px;${inTribe?'':'opacity:0.35;filter:grayscale(1)'}">
          <div style="width:56px;height:56px;border-radius:7px;overflow:hidden;background:#161b22;border:2px solid ${inTribe?tc:'#30363d'}">
            <img src="assets/avatars/${slug}.png" style="width:100%;height:100%;object-fit:cover"
                 onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" />
            <span style="display:none;width:100%;height:100%;align-items:center;justify-content:center;font-size:16px;font-weight:700;color:#8b949e">${init}</span>
          </div>
          <span style="font-size:10px;color:${inTribe?'#c9d1d9':'#484f58'};white-space:nowrap;max-width:58px;overflow:hidden;text-overflow:ellipsis;font-weight:500">${name}</span>
          <span style="font-size:11px;font-weight:800;color:${loyColor}">${loyScore}</span>
          ${otherTribeName ? `<span style="font-size:8px;color:#484f58">${otherTribeName}</span>` : ''}
        </div>`;
      });
      // Quits — players who left this alliance this episode (happens pre-tribal, safe to show)
      // Skip if they were re-recruited back into the same alliance (quit + return = show as member, not quitter)
      const _reRecruits = new Set((ep.allianceRecruits || []).filter(r => r.toAlliance === alliance.name).map(r => r.player));
      quittersThisEp.filter(name => !_reRecruits.has(name)).forEach(name => {
        if (!_activePlayerSet.has(name)) return;
        const slug = (players.find(p=>p.name===name)?.slug) || name.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'');
        const init = (name||'?')[0].toUpperCase();
        html += `<div style="display:flex;flex-direction:column;align-items:center;gap:4px;opacity:0.4;filter:grayscale(1)">
          <div style="width:56px;height:56px;border-radius:7px;overflow:hidden;background:#161b22;border:2px solid #30363d">
            <img src="assets/avatars/${slug}.png" style="width:100%;height:100%;object-fit:cover"
                 onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" />
            <span style="display:none;width:100%;height:100%;align-items:center;justify-content:center;font-size:16px;font-weight:700;color:#8b949e">${init}</span>
          </div>
          <span style="font-size:10px;color:#484f58;white-space:nowrap;max-width:58px;overflow:hidden;text-overflow:ellipsis;font-weight:500">${name}</span>
          <span style="font-size:8px;font-weight:700;letter-spacing:0.5px;color:#f85149">LEFT</span>
        </div>`;
      });
      html += `</div></div>`;
    });
    html += `</div></div>`;
  }

  // ── RELATIONSHIP HIGHLIGHTS (use episode snapshot, not live gs) ──
  const relPairs = getTribeRelationshipHighlights(portraitMembers, ep.gsSnapshot);
  html += `<div class="rp-camp-toggle-section">
    <button class="rp-camp-toggle-btn" style="border-color:${tc};color:${tc}" onclick="vpToggleSection('rel-${safeId}')">
      RELATIONSHIP HIGHLIGHTS <span class="rp-toggle-arrow">\u25b2</span>
    </button>
    <div id="rel-${safeId}" class="rp-camp-toggle-body">`;
  if (relPairs.length) {
    relPairs.forEach(p => {
      const v = p.val;
      // Check for perception gaps — only significant ones where the tier label differs
      const _snapPB = ep.gsSnapshot?.perceivedBonds || gs.perceivedBonds || {};
      const _gapAB = _snapPB[p.a + '→' + p.b];
      const _gapBA = _snapPB[p.b + '→' + p.a];
      const _aPerceived = _gapAB ? _gapAB.perceived : v;
      const _bPerceived = _gapBA ? _gapBA.perceived : v;
      // Only ONE-SIDED if the two sides would show different tier labels
      const _hasGap = (_gapAB || _gapBA) && bondLabel(_aPerceived) !== bondLabel(_bPerceived);
      // Use the higher of real or perceived values for badge and sort priority
      const _displayVal = Math.max(Math.abs(v), Math.abs(_aPerceived), Math.abs(_bPerceived));
      let badgeText = '', badgeClass = '';
      if (_hasGap) {
        badgeText = 'ONE-SIDED'; badgeClass = 'gold';
      } else if (v >= 9)   { badgeText = 'UNBREAKABLE';  badgeClass = 'green'; }
      else if (v >= 7)   { badgeText = 'RIDE OR DIE';  badgeClass = 'green'; }
      else if (v >= 5)   { badgeText = 'STRONG BOND';  badgeClass = 'green'; }
      else if (v >= 3)   { badgeText = 'SOLID BOND';   badgeClass = 'green'; }
      else if (v >= 1)   { badgeText = 'BOND';         badgeClass = 'green'; }
      else if (v <= -9)  { badgeText = 'PURE HATRED';  badgeClass = 'red'; }
      else if (v <= -7)  { badgeText = 'NEMESIS';      badgeClass = 'red'; }
      else if (v <= -5)  { badgeText = 'HOSTILE';      badgeClass = 'red'; }
      else if (v <= -3)  { badgeText = 'CONFLICT';     badgeClass = 'red'; }
      else if (v <= -1)  { badgeText = 'TENSION';      badgeClass = 'red'; }
      const preRel = relationships.find(r => [r.a,r.b].sort().join('|') === [p.a,p.b].sort().join('|'));
      const note = preRel?.note ? ` (${preRel.note})` : '';
      // Split display for perception gaps
      let feelingText;
      if (_hasGap) {
        const _aLabel = bondLabel(_aPerceived);
        const _bLabel = bondLabel(_bPerceived);
        feelingText = `${p.a} feels ${_aLabel}. ${p.b} feels ${_bLabel}`;
      } else {
        feelingText = bondFeeling(p.val);
      }
      // Check for active side deal — use snapshot if available
      const _snapDeals = ep.gsSnapshot?.sideDeals || gs.sideDeals || [];
      const _hasDeal = _snapDeals.some(d => d.active && d.players.includes(p.a) && d.players.includes(p.b));
      const _dealType = _hasDeal ? (_snapDeals.find(d => d.active && d.players.includes(p.a) && d.players.includes(p.b))?.type || 'f2') : null;
      html += `<div class="rp-brant-entry">
        <div class="rp-brant-portraits">${rpDuoImg(p.a, p.b)}</div>
        <div class="rp-brant-text">${p.a} & ${p.b} \u2014 ${feelingText}${note}.</div>
        ${_hasDeal ? `<span class="rp-brant-badge gold">${_dealType === 'f3' ? 'F3 DEAL' : 'F2 DEAL'}</span>` : ''}
        ${badgeText ? `<span class="rp-brant-badge ${badgeClass}">${badgeText}</span>` : ''}
      </div>`;
    });
  } else {
    html += `<div style="font-size:12px;color:#484f58;text-align:center;padding:12px 0">No notable bonds established yet.</div>`;
  }
  html += `</div></div>`;

  html += `</div>`;
  return html;
}

// ── Screen 3: Immunity Challenge ──
export function rpBuildChallenge(ep) {
  const winner   = ep.immunityWinner;
  const loser    = ep.loser?.name;
  const isTribe  = ep.challengeType === 'tribe';
  const chalName = ep.challengeLabel || 'Immunity Challenge';
  const chalDesc = ep.challengeDesc  || '';
  const chalCat  = ep.challengeCategory || 'mixed';

  // ── Post-merge: interactive individual placement reveal ──
  if ((ep.isMerge || ep.gsSnapshot?.isMerged) && ep.chalPlacements?.length) {
    // chalPlacements is best-first ([0]=winner). Reverse so [0]=last place for the reveal
    // (suspense builds from worst to winner, winner revealed last at the bottom slot).
    const placements = [...ep.chalPlacements].reverse();
    const totalPlayers = placements.length;
    const revealId = `chal-reveal-${ep.num}`;

    const threatened = (ep.tribalPlayers || gs.activePlayers)
      .filter(n => n !== winner)
      .sort((a,b) => threatScore(b) - threatScore(a))
      .slice(0, 3);

    let html = `<div class="rp-page tod-dusk">
      <div class="rp-eyebrow">Episode ${ep.num} \u2014 Individual Immunity</div>
      <div class="rp-title">${chalName}</div>
      <div style="text-align:center"><span class="rp-chal-type ${chalCat}">${chalCat}</span></div>`;
    if (chalDesc) html += `<p style="font-size:13px;color:#8b949e;line-height:1.65;margin:0 auto 16px;text-align:center;max-width:440px">${chalDesc}</p>`;
    // Tied Destinies: paired reveal replaces individual reveal
    if (ep.tiedDestinies?.pairScores?.length) {
      const _tdPairs = ep.tiedDestinies.pairScores;
      const _tdReversed = [..._tdPairs].reverse(); // worst first, winner last
      const _tdKey = `td_chal_${ep.num}`;
      // Store reveal data globally for the reveal functions
      if (!window._tdRevealData) window._tdRevealData = {};
      window._tdRevealData[_tdKey] = _tdReversed.map((ps, i) => ({
        a: ps.pair.a, b: ps.pair.b, rank: _tdPairs.length - i, isWinner: i === _tdReversed.length - 1
      }));

      html += `<div style="margin-bottom:16px">
        <div style="font-size:9px;font-weight:800;letter-spacing:2px;color:#818cf8;text-align:center;margin-bottom:8px">PAIRED RESULTS</div>
        <div id="${_tdKey}" data-revealed="0">`;
      _tdReversed.forEach((ps, i) => {
        const rank = _tdPairs.length - i;
        const isWinner = i === _tdReversed.length - 1;
        // Pre-render the revealed content as a hidden element
        const borderCol = isWinner ? 'rgba(63,185,80,0.3)' : 'rgba(139,148,158,0.1)';
        const bgCol = isWinner ? 'rgba(63,185,80,0.04)' : 'transparent';
        const rankCol = isWinner ? '#3fb950' : '#484f58';
        html += `<div id="${_tdKey}-slot-${i}" style="display:flex;align-items:center;gap:10px;padding:8px 12px;margin-bottom:4px;border:1px solid rgba(139,148,158,0.1);border-radius:8px;opacity:0.15">
          <span style="font-size:12px;font-weight:700;color:#484f58;width:20px">#${rank}</span>
          <div style="width:36px;height:36px;border-radius:50%;background:rgba(139,148,158,0.15)"></div>
          <div style="width:36px;height:36px;border-radius:50%;background:rgba(139,148,158,0.15)"></div>
          <span style="flex:1;font-size:12px;color:#484f58">???</span>
        </div>`;
        // Hidden pre-rendered content
        html += `<div id="${_tdKey}-content-${i}" style="display:none">
          <span style="font-size:12px;font-weight:700;color:${rankCol};width:20px">#${rank}</span>
          ${rpPortrait(ps.pair.a, 'sm')} ${rpPortrait(ps.pair.b, 'sm')}
          <span style="flex:1;font-size:12px;color:#e6edf3">${ps.pair.a} &amp; ${ps.pair.b}</span>
          ${isWinner ? '<span style="font-size:9px;font-weight:700;letter-spacing:1px;color:#3fb950;background:rgba(63,185,80,0.1);padding:2px 8px;border-radius:4px">IMMUNE</span>' : ''}
        </div>`;
      });
      html += `</div>
        <div style="text-align:center;margin-top:12px;display:flex;gap:8px;justify-content:center">
          <button onclick="tdRevealNext('${_tdKey}')" style="padding:8px 20px;background:var(--accent-gold);border:none;border-radius:6px;color:#0d1117;font-family:var(--font-display);font-size:13px;letter-spacing:1px;cursor:pointer;font-weight:700">REVEAL NEXT</button>
          <button onclick="tdRevealAll('${_tdKey}')" style="padding:6px 12px;background:transparent;border:1px solid var(--border);border-radius:6px;color:var(--muted);font-size:11px;cursor:pointer">Reveal All</button>
        </div></div>`;
      // Skip normal individual reveal for tied destinies
      html += `</div>`;
      return html;
    }
    // "Needed this" section removed — spoils who's in danger before reveal
    html += `<div class="vp-section-header">Finishing order</div>
      <div id="${revealId}" data-placements='${JSON.stringify(placements)}' data-revealed="0" data-winner="${winner}" data-throwers='${JSON.stringify((ep.challengeThrows || []).filter(t => t.thrower).map(t => t.thrower))}'>
        ${placements.map((_,i) => `<div class="chal-slot" id="${revealId}-slot-${i}" style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--border);opacity:0.15">
          <span style="font-family:var(--font-mono);font-size:11px;color:var(--muted);width:24px">${totalPlayers - i}</span>
          <span style="color:var(--muted)">?</span>
        </div>`).join('')}
      </div>
      <div style="display:flex;gap:12px;margin-top:16px;align-items:center">
        <button onclick="vpRevealNextPlacement('${revealId}')" style="padding:8px 20px;background:var(--accent-fire);border:none;border-radius:6px;color:#fff;font-family:var(--font-display);font-size:13px;letter-spacing:1px;cursor:pointer">REVEAL</button>
        <button onclick="vpRevealAllPlacements('${revealId}')" style="padding:6px 12px;background:transparent;border:1px solid var(--border);border-radius:6px;color:var(--muted);font-size:11px;cursor:pointer">See all results</button>
      </div>`;

    // Suspense cards — hidden until all placements revealed to avoid spoilers
    const _activePl = ep.tribalPlayers || gs.activePlayers;
    const _suspenseId = `chal-suspense-${ep.num}`;
    const _suspenseCards = [];

    // Winner card — varied based on context
    const _winnerAvgBond = _activePl.filter(p=>p!==winner).reduce((s,p)=>s+getBond(winner,p),0) / Math.max(1,_activePl.length-1);
    const _winS = pStats(winner);
    const _winP = pronouns(winner);
    const _wcPick = (arr) => arr[([...winner].reduce((a,c)=>a+c.charCodeAt(0),0)+ep.num*3)%arr.length];
    if (_winnerAvgBond < 0) {
      _suspenseCards.push({ player: winner, text: _wcPick([
        `${winner} is safe tonight. But the camp won't be happy about it. The target doesn't go away \u2014 it just waits.`,
        `Immunity buys ${winner} one more round. But ${_winP.sub} can feel it \u2014 the tribe wanted ${_winP.obj} gone tonight.`,
      ]), type: 'ice' });
    } else if (_winS.physical >= 8 || _winS.endurance >= 8) {
      _suspenseCards.push({ player: winner, text: _wcPick([
        `${winner} wins again. The challenge dominance is becoming a problem \u2014 for everyone else.`,
        `Another necklace for ${winner}. At some point, the tribe has to find a way to beat ${_winP.obj} \u2014 or vote around ${_winP.obj}.`,
      ]), type: 'gold' });
    }

    // Vulnerable players — no names before reveal, just after
    _activePl.forEach(n => {
      if (n === winner) return;
      const ts = threatScore(n);
      const avgBond = _activePl.filter(p=>p!==n).reduce((s,p)=>s+getBond(n,p),0) / Math.max(1,_activePl.length-1);
      if (ts > 6 && avgBond < 1) {
        const _vPick = (arr) => arr[([...n].reduce((a,c)=>a+c.charCodeAt(0),0)+ep.num*5)%arr.length];
        _suspenseCards.push({ player: n, text: _vPick([
          `${n} needed that necklace. Without it, the target is fully exposed.`,
          `No immunity for ${n}. The alliances have been circling \u2014 tonight might be the night.`,
          `${n} is vulnerable. And ${n} knows it. The scramble starts now.`,
        ]), type: 'fire' });
      }
    });

    if (_suspenseCards.length) {
      html += `<div id="${_suspenseId}" style="margin-top:12px;display:none">`;
      _suspenseCards.slice(0,3).forEach(s => {
        html += `<div class="vp-card ${s.type}" style="display:flex;align-items:center;gap:12px;margin-bottom:8px">
          ${rpPortrait(s.player)}<span style="font-size:13px">${s.text}</span>
        </div>`;
      });
      html += `</div>`;
    }

    html += `</div>`;
    return html;
  }

  // ── Pre-merge: interactive tribe reveal ──
  if (!winner && ep.challengePlacements?.length) {
    const tribePlacements = ep.challengePlacements;
    const sitOuts = ep.chalSitOuts || {};
    const memberScores = ep.chalMemberScores || {};
    const revealId = `tribe-chal-reveal-${ep.num}`;
    const orderedByResult = [...tribePlacements].reverse(); // index 0 = loser, last = winner

    // Build result badge per tribe name (not by display position)
    const _isMultiOrDouble = ep.challengeType === 'multi-tribal' || ep.challengeType === 'double-tribal';
    const _tribeResultBadge = {};
    orderedByResult.forEach((tribe, i) => {
      const isWinner = i === orderedByResult.length - 1;
      const isLoser  = i === 0;
      // Multi/double tribal: ALL non-winners go to tribal. Normal: only last place loses.
      _tribeResultBadge[tribe.name] = isWinner
        ? '<span class="rp-brant-badge gold">WIN</span>'
        : (_isMultiOrDouble || isLoser)
        ? '<span class="rp-brant-badge red">TRIBAL</span>'
        : '<span class="rp-brant-badge" style="color:#8b949e;background:rgba(139,148,158,0.1);border-color:rgba(139,148,158,0.25)">SAFE</span>';
    });

    // Shuffle display order so position doesn't spoil the result
    const displayOrder = [...orderedByResult].sort(() => Math.random() - 0.5);

    let html = `<div class="rp-page tod-afternoon">
      <div class="rp-eyebrow">Episode ${ep.num} \u2014 Tribe Immunity</div>
      <div class="rp-title">${chalName}</div>
      <div style="text-align:center"><span class="rp-chal-type ${chalCat}">${chalCat}</span></div>`;
    if (chalDesc) html += `<p style="font-size:13px;color:#8b949e;line-height:1.65;margin:0 auto 16px;text-align:center;max-width:440px">${chalDesc}</p>`;

    displayOrder.forEach((tribe, i) => {
      const tName = tribe.name;
      const tMembers = tribe.members || [];
      const sos = sitOuts[tName] || [];
      const competitors = tMembers.filter(n => !sos.includes(n));
      const rankedCompetitors = [...competitors].sort((a,b) => (memberScores[b]||0) - (memberScores[a]||0));
      const slotId = `${revealId}-tribe-${i}`;
      const resultBadge = _tribeResultBadge[tName];

      html += `<div class="vp-card" style="margin-bottom:12px">
        <div id="${slotId}-header" style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
          <span id="${slotId}-name" style="font-family:var(--font-display);font-size:16px;color:var(--muted)">Tribe ?</span>
          <span id="${slotId}-badge" style="display:none">${resultBadge}</span>
          <button onclick="vpRevealTribe('${slotId}','${tName}')" style="margin-left:auto;padding:4px 12px;background:var(--accent-fire);border:none;border-radius:4px;color:#fff;font-size:11px;cursor:pointer">REVEAL</button>
        </div>
        <div class="rp-portrait-row" style="margin-bottom:8px">
          ${rankedCompetitors.map((n,ri) => {
            const _isTop = ri === 0;
            const _isBot = ri === rankedCompetitors.length - 1 && rankedCompetitors.length > 1;
            const _rankBadge = _isTop
              ? `<div style="font-size:9px;font-weight:800;letter-spacing:1px;background:rgba(63,185,80,0.12);color:#3fb950;padding:2px 5px;border-radius:3px;margin-top:3px">STANDOUT</div>`
              : _isBot
              ? `<div style="font-size:9px;font-weight:800;letter-spacing:1px;background:rgba(218,54,51,0.10);color:#f85149;padding:2px 5px;border-radius:3px;margin-top:3px">WEAK LINK</div>`
              : `<div style="font-size:9px;color:var(--muted);margin-top:2px">#${ri+1}</div>`;
            return `<div style="text-align:center">${rpPortrait(n)}${_rankBadge}</div>`;
          }).join('')}
        </div>
        ${sos.length ? `<div style="font-size:11px;color:var(--muted);margin-top:4px">Sit-outs: ${sos.map(n=>`<strong>${n}</strong>`).join(', ')}</div>` : ''}
      </div>`;
    });

    const _allSlotsData = displayOrder.map((t,i) => `${revealId}-tribe-${i}:${t.name}`).join('|');
    html += `<button onclick="vpRevealAllTribesFromData(this)" data-slots="${_allSlotsData}"
      style="padding:6px 12px;background:transparent;border:1px solid var(--border);border-radius:6px;color:var(--muted);font-size:11px;cursor:pointer;margin-top:8px">See all results</button>`;
    html += `</div>`;
    return html;
  }

  let html = `<div class="rp-page">
    <div class="rp-eyebrow">Episode ${ep.num} \u2014 ${isTribe ? 'Tribe' : 'Individual'} Immunity Challenge</div>
    <div class="rp-title">${chalName}</div>
    <div style="text-align:center"><span class="rp-chal-type ${chalCat}">${chalCat}</span></div>`;

  if (chalDesc) {
    html += `<p style="font-size:13px;color:#8b949e;line-height:1.65;margin:0 auto 28px;text-align:center;max-width:440px">${chalDesc}</p>`;
  }

  if (isTribe && ep.challengePlacements?.length) {
    const total = ep.challengePlacements.length;
    const scores = ep.chalMemberScores || {};
    ep.challengePlacements.forEach((tribe, i) => {
      const isW = i === 0, isL = i === total - 1;
      const tc = tribeColor(tribe.name);
      const tribeCls = isW ? 'chal-win' : isL ? 'chal-lose' : '';
      const resultText = isW ? `${tribe.name} wins immunity!` : isL ? `${tribe.name} goes to Tribal Council.` : `${tribe.name} is safe.`;
      const resultCls = isW ? 'win' : isL ? 'lose' : 'safe';
      // Rank competing members (exclude sit-outs) by their individual score
      const tribeSitOuts = ep.chalSitOuts?.[tribe.name] || [];
      const competitors = (tribe.members||[]).filter(m => !tribeSitOuts.includes(m));
      const ranked = [...competitors].sort((a,b) => (scores[b]||0)-(scores[a]||0));
      html += `<div class="rp-chal-tribe ${tribeCls}">
        <div class="rp-tribe-head" style="color:${tc};border-color:${tc}">${tribe.name}</div>
        <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:10px">`;
      ranked.forEach((name, rank) => {
        const isTop = rank === 0, isBot = rank === ranked.length - 1 && ranked.length > 1;
        const badge = isTop ? `<span style="font-size:9px;font-weight:800;letter-spacing:1px;background:rgba(63,185,80,0.12);color:#3fb950;padding:2px 7px;border-radius:3px">STANDOUT</span>`
                    : isBot ? `<span style="font-size:9px;font-weight:800;letter-spacing:1px;background:rgba(218,54,51,0.10);color:#f85149;padding:2px 7px;border-radius:3px">WEAK LINK</span>`
                    : '';
        html += `<div style="display:flex;align-items:center;gap:10px">
          <span style="font-size:10px;font-weight:700;color:#484f58;min-width:16px;text-align:right">${rank+1}</span>
          ${rpPortrait(name)}
          <span style="font-size:12px;color:#e6edf3">${name}</span>
          ${badge}
        </div>`;
      });
      if (tribeSitOuts.length) {
        html += `<div style="margin-top:6px;padding-top:6px;border-top:1px solid rgba(255,255,255,0.06);display:flex;align-items:center;gap:8px;flex-wrap:wrap">
          <span style="font-size:9px;font-weight:700;letter-spacing:1px;color:#484f58;text-transform:uppercase">Sat out</span>`;
        tribeSitOuts.forEach(name => {
          html += `<div style="display:flex;align-items:center;gap:6px;opacity:0.55">
            ${rpPortrait(name)}
            <span style="font-size:11px;color:#8b949e">${name}</span>
          </div>`;
        });
        html += `</div>`;
      }
      html += `</div><div><span class="rp-chal-result ${resultCls}">${resultText}</span></div></div>`;
    });
  } else if (winner) {
    // Individual challenge — full placement ranking
    const placements = ep.chalPlacements?.length ? ep.chalPlacements : [winner];
    html += `<div style="display:flex;flex-direction:column;gap:8px;margin-bottom:24px">`;
    placements.forEach((name, rank) => {
      const isFirst = rank === 0;
      const isLast  = rank === placements.length - 1 && placements.length > 1;
      const numColor = isFirst ? '#3fb950' : isLast ? '#f85149' : '#484f58';
      const badge = isFirst
        ? `<span style="font-size:9px;font-weight:800;letter-spacing:1px;background:rgba(63,185,80,0.12);color:#3fb950;padding:2px 7px;border-radius:3px">IMMUNITY</span>`
        : isLast
        ? `<span style="font-size:9px;font-weight:800;letter-spacing:1px;background:rgba(218,54,51,0.10);color:#f85149;padding:2px 7px;border-radius:3px">LAST</span>`
        : '';
      html += `<div style="display:flex;align-items:center;gap:10px">
        <span style="font-size:${isFirst?'15':'11'}px;font-weight:800;color:${numColor};min-width:20px;text-align:right">${rank+1}</span>
        ${rpPortrait(name, isFirst ? 'lg' : '')}
        <span style="font-size:${isFirst?'14':'12'}px;font-weight:${isFirst?'700':'400'};color:${isFirst?'#e6edf3':'#8b949e'}">${name}</span>
        ${badge}
      </div>`;
    });
    html += `</div>`;
  }

  // ── Challenge notes (photo finish, dominant, carried by one, etc.) ──
  const _cnPlacements = isTribe ? ep.challengePlacements : ep.chalPlacements;
  const _cnScores     = ep.chalMemberScores || {};
  const _chalNotes    = generateChallengeNotes(_cnPlacements, _cnScores, 2);
  if (_chalNotes.length) {
    html += `<div style="margin-top:18px;display:flex;flex-direction:column;gap:8px">`;
    _chalNotes.forEach(note => {
      const text = note.replace(/^NOTE:\s*/, '');
      html += `<div style="background:rgba(99,102,241,0.08);border:1px solid rgba(99,102,241,0.2);border-radius:6px;padding:10px 14px;font-size:12px;color:#8b949e;line-height:1.55">${text}</div>`;
    });
    html += `</div>`;
  }

  // ── Penalty vote reveal — assigned to last-place finisher ──
  const _penTw = (ep.twists||[]).find(t => t.type === 'penalty-vote');
  if (_penTw?.penaltyTarget) {
    html += `<div style="margin-top:24px;background:rgba(248,81,73,0.06);border:1px solid rgba(248,81,73,0.2);border-radius:8px;padding:14px 16px;display:flex;align-items:center;gap:14px">
      ${rpPortrait(_penTw.penaltyTarget)}
      <div>
        <div style="font-size:9px;font-weight:800;letter-spacing:2px;color:#f85149;margin-bottom:4px">PENALTY VOTE</div>
        <div style="font-size:13px;font-weight:600;color:#e6edf3">${_penTw.penaltyTarget} finished last.</div>
        <div style="font-size:11px;color:#8b949e;margin-top:3px">They enter Tribal Council with one pre-cast vote already against them.</div>
      </div>
      <span style="font-size:11px;font-weight:800;padding:3px 10px;border-radius:4px;background:rgba(248,81,73,0.12);color:#f85149;white-space:nowrap;margin-left:auto">+1 Vote</span>
    </div>`;
  }

  html += `</div>`;
  return html;
}

// ── Reward Challenge screen ──
export function rpBuildRewardChallenge(ep) {
  const rc = ep.rewardChalData;
  if (!rc) return '';
  const chalCat = rc.category || 'mixed';
  const isTribe = rc.winnerType === 'tribe';
  let html = `<div class="rp-page">
    <div class="rp-eyebrow">Episode ${ep.num} \u2014 ${isTribe ? 'Tribe' : 'Individual'} Reward Challenge</div>
    <div class="rp-title">${rc.label}</div>
    <div style="text-align:center"><span class="rp-chal-type ${chalCat}">${chalCat}</span></div>`;
  if (rc.desc) {
    html += `<p style="font-size:13px;color:#8b949e;line-height:1.65;margin:0 auto 16px;text-align:center;max-width:440px">${rc.desc}</p>`;
  }

  if (rc.rewardItemLabel) {
    html += `<div style="text-align:center;margin-bottom:24px">
      <div style="display:inline-block;background:rgba(240,165,0,0.08);border:1px solid rgba(240,165,0,0.3);border-radius:8px;padding:10px 18px;max-width:380px">
        <div style="font-size:9px;font-weight:800;letter-spacing:2px;color:#f0a500;margin-bottom:4px">PLAYING FOR</div>
        <div style="font-size:14px;font-weight:700;color:#e6edf3">${rc.rewardItemLabel}</div>
        ${rc.rewardItemDesc ? `<div style="font-size:11px;color:#8b949e;margin-top:4px;line-height:1.5">${rc.rewardItemDesc}</div>` : ''}
      </div>
    </div>`;
  }

  if (isTribe && rc.placements?.length) {
    // rc.placements[0] = winner tribe
    const rcRevealId = `rc-reveal-${ep.num}`;
    const _rcResultBadge = {};
    rc.placements.forEach((tribe, i) => {
      _rcResultBadge[tribe.name] = i === 0
        ? '<span class="rp-brant-badge gold">WIN</span>'
        : '<span class="rp-brant-badge" style="color:#8b949e;background:rgba(139,148,158,0.1);border-color:rgba(139,148,158,0.25)">NO REWARD</span>';
    });
    // Shuffle so position doesn't spoil result
    const rcDisplayOrder = [...rc.placements].sort(() => Math.random() - 0.5);
    rcDisplayOrder.forEach((tribe, i) => {
      const tName = tribe.name;
      const scores = tribe.memberScores || {};
      const ranked = [...(tribe.members||[])].sort((a,b) => (scores[b]||0)-(scores[a]||0));
      const slotId = `${rcRevealId}-tribe-${i}`;
      html += `<div class="vp-card" style="margin-bottom:12px">
        <div id="${slotId}-header" style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
          <span id="${slotId}-name" style="font-family:var(--font-display);font-size:16px;color:var(--muted)">Tribe ?</span>
          <span id="${slotId}-badge" style="display:none">${_rcResultBadge[tName]}</span>
          <button onclick="vpRevealTribe('${slotId}','${tName}');var _c=this.closest('.rp-page');if(_c){var _bs=_c.querySelectorAll('[id$=-badge]');var _all=[..._bs].every(b=>b.style.display!=='none');if(_all){var _sh=document.getElementById('rc-share-${ep.num}');if(_sh)_sh.style.display=''}}" style="margin-left:auto;padding:4px 12px;background:var(--accent-fire);border:none;border-radius:4px;color:#fff;font-size:11px;cursor:pointer">REVEAL</button>
        </div>
        <div class="rp-portrait-row" style="margin-bottom:8px">
          ${ranked.map((n,ri) => {
            const _isTop = ri === 0;
            const _isBot = ri === ranked.length - 1 && ranked.length > 1;
            const _rb = _isTop
              ? `<div style="font-size:9px;font-weight:800;letter-spacing:1px;background:rgba(63,185,80,0.12);color:#3fb950;padding:2px 5px;border-radius:3px;margin-top:3px">STANDOUT</div>`
              : _isBot
              ? `<div style="font-size:9px;font-weight:800;letter-spacing:1px;background:rgba(218,54,51,0.10);color:#f85149;padding:2px 5px;border-radius:3px;margin-top:3px">WEAK LINK</div>`
              : `<div style="font-size:9px;color:var(--muted);margin-top:2px">#${ri+1}</div>`;
            return `<div style="text-align:center">${rpPortrait(n)}${_rb}</div>`;
          }).join('')}
        </div>
      </div>`;
    });
    const _rcShareId = `rc-share-${ep.num}`;
    const _rcAllSlotsData = rcDisplayOrder.map((t,i) => `${rcRevealId}-tribe-${i}:${t.name}`).join('|');
    html += `<button onclick="vpRevealAllTribesFromData(this);var _sh=document.getElementById('${_rcShareId}');if(_sh)_sh.style.display=''" data-slots="${_rcAllSlotsData}"
      style="padding:6px 12px;background:transparent;border:1px solid var(--border);border-radius:6px;color:var(--muted);font-size:11px;cursor:pointer;margin-top:4px">See all results</button>`;

    // ── Reward share invite (pre-merge: winning tribe invites one from losing tribe) ──
    if (rc.rewardShareInvite) {
      const _rsi = rc.rewardShareInvite;
      const _rsiTc = tribeColor(_rsi.invitedBy);
      html += `<div id="${_rcShareId}" style="display:none;margin-top:14px;padding:12px;border:1px solid rgba(240,165,0,0.2);border-radius:8px;background:rgba(240,165,0,0.04)">
        <div style="font-size:9px;font-weight:700;letter-spacing:2px;color:#f0a500;margin-bottom:8px">REWARD SHARED</div>
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
          ${rpPortrait(_rsi.invited, 'sm')}
          <div>
            <div style="font-size:13px;font-weight:600;color:#e6edf3">${_rsi.invited}</div>
            <div style="font-size:11px;color:#f0a500">Invited by <span style="color:${_rsiTc}">${_rsi.invitedBy}</span></div>
          </div>
        </div>
        <div style="font-size:11px;color:#8b949e;line-height:1.5;font-style:italic">${_rsi.reasonText}</div>
      </div>`;
    }

  } else {
    // Individual mode — interactive reveal (last-to-first like immunity)
    const placements = rc.placements?.length ? rc.placements : (rc.winner ? [rc.winner] : []);
    const rcIndRevealId = `rc-ind-reveal-${ep.num}`;
    const companions = rc.rewardCompanions || [];

    html += `<div id="${rcIndRevealId}" data-total="${placements.length}" data-revealed="0" data-placements='${JSON.stringify(placements)}' data-winner="${rc.winner || ''}" data-companions='${JSON.stringify(companions)}'>`;
    // Slots — hidden initially, revealed last-to-first
    [...placements].reverse().forEach((name, i) => {
      const rank = placements.length - 1 - i;
      html += `<div class="rc-ind-slot" id="${rcIndRevealId}-slot-${i}" style="display:flex;align-items:center;gap:10px;padding:8px;margin-bottom:4px;border-radius:8px;border:1px solid var(--border);opacity:0.15;transition:all 0.4s">
        <span style="font-size:11px;font-weight:800;color:var(--muted);min-width:20px;text-align:right;font-family:var(--font-mono)">${rank + 1}</span>
        <span style="color:var(--muted)">?</span>
      </div>`;
    });
    html += `</div>`;

    // Reveal buttons
    html += `<div style="display:flex;gap:12px;margin-top:12px;align-items:center">
      <button onclick="rcIndRevealNext('${rcIndRevealId}')" id="${rcIndRevealId}-btn" style="padding:8px 20px;background:var(--accent-fire);border:none;border-radius:6px;color:#fff;font-family:var(--font-display);font-size:13px;letter-spacing:1px;cursor:pointer;font-weight:700">REVEAL (0/${placements.length})</button>
      <button onclick="rcIndRevealAll('${rcIndRevealId}')" style="padding:6px 12px;background:transparent;border:1px solid var(--border);border-radius:6px;color:var(--muted);font-size:11px;cursor:pointer">See all results</button>
    </div>`;

    // Winner + companions section — hidden until fully revealed
    const pickReasons = rc.rewardPickReasons || [];
    const pickStrategy = rc.rewardPickStrategy || 'heart';
    const snubs = rc.rewardSnubs || [];
    const _wPrRc = pronouns(rc.winner || '');

    html += `<div id="${rcIndRevealId}-winner" style="display:none;margin-top:16px">`;

    // Winner announcement
    html += `<div style="padding:14px;background:rgba(240,165,0,0.06);border:1px solid rgba(240,165,0,0.2);border-radius:10px;text-align:center;margin-bottom:10px">
      ${rpPortrait(rc.winner || '', 'lg')}
      <div style="font-size:14px;font-weight:700;color:#f0a500;margin-top:8px">${rc.winner} wins the reward!</div>
      <div style="font-size:10px;color:#8b949e;margin-top:4px;letter-spacing:1px">${pickStrategy === 'brain' ? 'STRATEGIC PICK' : 'HEART PICK'}</div>
    </div>`;

    // Companion picks with reasoning
    if (companions.length) {
      html += `<div style="padding:12px;background:rgba(139,148,158,0.04);border:1px solid rgba(139,148,158,0.08);border-radius:8px;margin-bottom:10px">
        <div style="font-size:9px;font-weight:700;letter-spacing:2px;color:#8b949e;margin-bottom:8px">${_wPrRc.Sub.toUpperCase()} ${companions.length > 1 ? 'PICKS' : 'PICKS'}</div>`;
      pickReasons.forEach(pr => {
        const _prBond = pr.bond;
        const _bondColor = _prBond >= 5 ? '#3fb950' : _prBond >= 2 ? '#58a6ff' : _prBond >= 0 ? '#8b949e' : '#f85149';
        const _reasonText = pr.reason === 'heart-closest' ? `Closest bond — no hesitation`
          : pr.reason === 'heart-ally' ? `Trusted ally — reward together`
          : pr.reason === 'heart-connection' ? `Genuine connection — wants to share this`
          : pr.reason === 'strategic-court' ? `Strategic pick — courting a new relationship`
          : pr.reason === 'strategic-strengthen' ? `Alliance move — strengthening an existing deal`
          : pr.reason === 'strategic-read' ? `Reading the room — strategic positioning`
          : `Chose to share the reward`;
        html += `<div style="display:flex;align-items:center;gap:10px;margin-bottom:6px">
          ${rpPortrait(pr.name, 'sm')}
          <div style="flex:1">
            <div style="font-size:13px;font-weight:600;color:#e6edf3">${pr.name}</div>
            <div style="font-size:11px;color:#8b949e;margin-top:2px">${_reasonText}</div>
          </div>
          <span style="font-size:10px;font-weight:700;color:${_bondColor};font-family:var(--font-mono)">Bond: ${_prBond >= 0 ? '+' : ''}${Math.round(_prBond * 10) / 10}</span>
        </div>`;
      });
      html += `</div>`;
    }

    // Snubs — significant alienation
    if (snubs.length) {
      html += `<div style="padding:10px;background:rgba(218,54,51,0.04);border:1px solid rgba(218,54,51,0.12);border-radius:8px;margin-bottom:10px">
        <div style="font-size:9px;font-weight:700;letter-spacing:2px;color:#f85149;margin-bottom:6px">LEFT BEHIND</div>`;
      snubs.forEach(s => {
        html += `<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
          ${rpPortrait(s.player, 'sm')}
          <div style="flex:1">
            <div style="font-size:12px;color:#e6edf3">${s.player}</div>
            <div style="font-size:10px;color:#f85149">Bond ${s.bond >= 0 ? '+' : ''}${Math.round(s.bond * 10) / 10} → took it personally (${s.damage} hit)</div>
          </div>
        </div>`;
      });
      html += `</div>`;
    }

    // Alliance outcome
    if (rc.rewardAllianceFormed) {
      html += `<div style="padding:10px 12px;background:rgba(63,185,80,0.06);border:1px solid rgba(63,185,80,0.2);border-radius:6px;margin-bottom:8px">
        <div style="font-size:9px;font-weight:700;letter-spacing:2px;color:#3fb950;margin-bottom:4px">ALLIANCE FORMED</div>
        <div style="font-size:12px;color:#e6edf3"><strong>${rc.rewardAllianceFormed}</strong> — born over a shared reward, away from camp. ${rc.winner} made the pitch. Nobody else heard it.</div>
        <div style="display:flex;gap:4px;margin-top:6px">${(rc.rewardAllianceMembers || []).map(m => rpPortrait(m, 'sm')).join('')}</div>
      </div>`;
    } else if (rc.rewardAllianceFailed) {
      html += `<div style="padding:10px 12px;background:rgba(218,54,51,0.04);border:1px solid rgba(218,54,51,0.12);border-radius:6px;margin-bottom:8px">
        <div style="font-size:9px;font-weight:700;letter-spacing:2px;color:#f85149;margin-bottom:4px">PITCH FAILED</div>
        <div style="font-size:12px;color:#8b949e">${rc.winner} tried to form an alliance during the reward. ${
          (rc.rewardFailedPairs || []).length === 1 && rc.rewardFailedPairs[0].a !== rc.winner && rc.rewardFailedPairs[0].b !== rc.winner
            ? `The problem wasn't ${rc.winner} — it was ${rc.rewardFailedPairs[0].a} and ${rc.rewardFailedPairs[0].b}. They can't stand each other. No alliance survives that.`
            : (rc.rewardFailedPairs || []).some(fp => fp.a === rc.winner || fp.b === rc.winner)
            ? `The bonds between ${rc.winner} and ${(rc.rewardFailedPairs || []).find(fp => fp.a === rc.winner || fp.b === rc.winner)?.a === rc.winner ? (rc.rewardFailedPairs || [])[0]?.b : (rc.rewardFailedPairs || [])[0]?.a} aren't strong enough. The pitch fell flat.`
            : `The conversation went nowhere — the bonds aren't there. Awkward silence on the ride back.`
        }</div>
        ${(rc.rewardFailedPairs || []).map(fp => `<div style="display:flex;align-items:center;gap:6px;margin-top:6px;font-size:11px;color:#f85149">
          ${rpPortrait(fp.a, 'xs')} ${rpPortrait(fp.b, 'xs')} <span>Bond ${fp.bond >= 0 ? '+' : ''}${Math.round(fp.bond * 10) / 10} → too cold (${fp.damage} hit)</span>
        </div>`).join('')}
      </div>`;
      if (rc.rewardPitchLeaks?.length) {
        html += `<div style="padding:8px 12px;background:rgba(218,54,51,0.03);border:1px solid rgba(218,54,51,0.08);border-radius:6px;margin-bottom:8px">
          <div style="font-size:9px;font-weight:700;letter-spacing:2px;color:#f0883e;margin-bottom:4px">LEAKED</div>`;
        rc.rewardPitchLeaks.forEach(leak => {
          html += `<div style="display:flex;align-items:center;gap:6px;font-size:11px;color:#8b949e;margin-bottom:4px">
            ${rpPortrait(leak.leaker, 'xs')} <span style="color:#f0883e">${leak.leaker}</span> told
            ${rpPortrait(leak.toldTo, 'xs')} <span>${leak.toldTo}</span> about ${rc.winner}'s failed pitch
          </div>`;
        });
        html += `</div>`;
      }
    } else if (rc.rewardAllianceStrengthened) {
      html += `<div style="padding:8px 12px;background:rgba(227,179,65,0.06);border:1px solid rgba(227,179,65,0.15);border-radius:6px;margin-bottom:8px;font-size:11px;color:#e3b341">
        <strong>ALLIANCE STRENGTHENED</strong> — ${rc.rewardAllianceStrengthened} used the reward to solidify their deal. Private time, no distractions.
      </div>`;
    }
    // ── Reward Backfire card ──
    if (rc.rewardBackfire?.fired) {
      const _bf = rc.rewardBackfire;
      if (_bf.path === 'alliance') {
        html += `<div style="padding:10px 12px;background:rgba(248,81,73,0.06);border:1px solid rgba(248,81,73,0.2);border-radius:6px;margin-bottom:8px">
          <div style="font-size:9px;font-weight:700;letter-spacing:2px;color:#f0883e;margin-bottom:4px">BACKFIRE</div>
          <div style="font-size:12px;color:#e6edf3">While <strong>${_bf.heatTarget}</strong> feasted, the camp organized. <strong>${_bf.allianceName}</strong> was born from resentment.</div>
          <div style="display:flex;gap:4px;margin-top:6px">${(_bf.allianceMembers || []).map(m => rpPortrait(m, 'sm')).join('')}</div>
          <div style="font-size:10px;color:#f0883e;margin-top:6px">+1.5 heat on ${_bf.heatTarget}${_bf.heatCompanions?.length ? `, +0.8 on ${_bf.heatCompanions.join(', ')}` : ''}</div>
        </div>`;
      } else {
        html += `<div style="padding:10px 12px;background:rgba(248,81,73,0.04);border:1px solid rgba(248,81,73,0.12);border-radius:6px;margin-bottom:8px">
          <div style="font-size:9px;font-weight:700;letter-spacing:2px;color:#f85149;margin-bottom:4px">LEFT BEHIND</div>
          <div style="font-size:12px;color:#8b949e">The ones left behind found common ground.${_bf.blocPair ? ` ${_bf.blocPair[0]} and ${_bf.blocPair[1]} made an F2 deal.` : ''}</div>
          <div style="display:flex;gap:4px;margin-top:6px">${(_bf.snubbedPlayers || []).map(m => rpPortrait(m, 'sm')).join('')}</div>
          <div style="font-size:10px;color:#f85149;margin-top:6px">+1.0 heat on ${_bf.heatTarget}</div>
        </div>`;
      }
    }

    html += `</div>`;
  }

  html += `</div>`;
  return html;
}

// ── Screen: Voting Plans (pre-vote strategy — who's targeting who) ──
export function rpBuildVotingPlans(ep) {
  // Voting plans are pre-tribal — do NOT include SitD info here (it's a tribal reveal, showing it spoils)
  // This screen is ALLIANCE-FIRST: shows what alliances PLAN to do, not what actually happened.
  // NO vote outcomes, NO checkmarks, NO "voted X". Pure pre-tribal setup.
  const votingLog = (ep.votingLog || []);
  if (!votingLog.length) return null;

  // Tribe name — use saved tribalTribe, then alliance tribe, then merged/fallback
  const tribalTribeName = ep.tribalTribe
    || ep.alliances?.find(a => a.tribe)?.tribe
    || (gs.isMerged ? (gs.mergeName||'Merged') : '');
  const tc = tribeColor(tribalTribeName);
  const immunity = ep.immunityWinner || null;

  // ─── helpers ───────────────────────────────────────────────────────────────

  const targetCategory = name => {
    const s = pStats(name); const arch = s.archetype || '';
    const _isMerged = gs.isMerged || (ep.gsSnapshot?.isMerged);
    const _epNum = ep.num || 1;

    // ── CHALLENGE PERFORMANCE: cumulative record — not just one episode's result ──
    const _cw = challengeWeakness(name);
    const _rec = gs.chalRecord?.[name] || { wins: 0, podiums: 0, bombs: 0 };
    // Don't label someone weak if their podiums outweigh their bombs (they're objectively not weak)
    const _hasStrongRecord = _rec.podiums > _rec.bombs;
    if (_cw >= 5.5 && !_isMerged && !_hasStrongRecord) return { label: 'Challenge Liability', color: '#f85149' };
    if (_cw >= 4.0 && !_isMerged && !_hasStrongRecord) return { label: 'Challenge Weakness', color: '#e3b341' };

    // ── RELATIONSHIPS: the real driver for most votes, especially pre-merge ──
    const _tribal = ep.tribalPlayers || gs.activePlayers;
    const _avgBond = _tribal.filter(p => p !== name)
      .reduce((sum, p) => sum + getBond(name, p), 0) / Math.max(1, _tribal.length - 1);
    const _hostileCount = _tribal.filter(p => p !== name && getBond(name, p) <= -1.5).length;
    if (!_isMerged) {
      // Pre-merge: outsider = nobody on your tribe likes you. Common and decisive.
      if (_avgBond <= -1.0 || _hostileCount >= 2) return { label: 'Outsider', color: '#f85149' };
      if (_avgBond <= 0) return { label: 'On the Outs', color: '#e3b341' };
    } else {
      // Post-merge: everyone has enemies. "Outsider" only for extreme isolation.
      // Most players = nobody, only truly hated players with 4+ hostile bonds or avg <= -2
      if (_avgBond <= -2.0 || _hostileCount >= 4) return { label: 'Pariah', color: '#f85149' };
    }

    // ── HEAT: pressure from multiple sources (idols, blowups, social bombs, etc.) ──
    const _heat = computeHeat(name, _tribal, ep.alliances || []);
    if (_heat >= 5) return { label: 'Under Fire', color: '#f85149' };

    // ── ARCHETYPES ──
    if (arch === 'villain') return { label: 'Villain', color: '#f85149' };
    if (arch === 'goat' || threatScore(name) <= 2) return { label: 'Easy Vote', color: '#484f58' };

    // ── STAT-BASED THREATS: post-merge these matter more, pre-merge they're secondary ──
    if (_isMerged || _epNum >= 5) {
      // Post-merge / late pre-merge: stat threats become primary targeting reasons
      if (arch === 'challenge-beast' || s.physical >= 8) return { label: 'Physical Threat', color: '#f85149' };
      if (s.strategic >= 8 || arch === 'mastermind' || arch === 'schemer') return { label: 'Strategic Threat', color: '#f85149' };
      if (s.social >= 8 || arch === 'social-butterfly') return { label: 'Social Threat', color: '#e3b341' };
      if (arch === 'hero') return { label: 'Jury Threat', color: '#e3b341' };
    } else {
      // Early pre-merge: stat-based labels are softer — the tribe hasn't seen enough to call someone a "threat"
      if (s.strategic >= 8 || arch === 'mastermind' || arch === 'schemer') return { label: 'Strategic Threat', color: '#f85149' };
      if (s.social >= 8 || arch === 'social-butterfly') return { label: 'Well-Connected', color: '#e3b341' };
      if (arch === 'hero') return { label: 'Likeable', color: '#e3b341' };
      // Physical Threat only shows pre-merge if they have a strong challenge record — otherwise being strong is good
      if ((arch === 'challenge-beast' || s.physical >= 8) && _rec.podiums >= 2) return { label: 'Physical Threat', color: '#f85149' };
    }

    // ── REMAINING ──
    if (s.loyalty <= 3) return { label: 'Wildcard', color: '#e3b341' };
    if (threatScore(name) >= 2.5) return { label: 'Emerging Threat', color: '#e3b341' };
    if (_heat >= 3) return { label: 'Target on Their Back', color: '#e3b341' };
    if (_avgBond <= 0.5 && _epNum <= 4) return { label: 'On the Outs', color: '#e3b341' };
    return { label: 'Active Player', color: '#484f58' };
  };

  // ─── target reasoning (shared by alliance plans + independent votes) ─────
  const _vpTargetReason = (target, voter, cat) => {
    if (!target) return 'No clear target.';
    const _ts = pStats(target);
    const _bond = voter ? getBond(voter, target) : 0;
    const _cw = challengeWeakness(target);
    const _h = [...(voter || ''), ...(target || '')].reduce((s, c) => s + c.charCodeAt(0), 0) || 1;
    const _pick = arr => arr[_h % arr.length];
    // Priority order: challenge weakness > personal friction > threat category > social position > generic
    if (_cw >= 5.5 && !gs.isMerged) {
      const _chalCat = ep.challengeCategory || '';
      const _catLabel = _chalCat === 'physical' ? 'physical challenges' : _chalCat === 'endurance' ? 'endurance'
        : _chalCat === 'puzzle' ? 'puzzles' : _chalCat === 'social' ? 'social challenges'
        : _chalCat === 'balance' ? 'balance' : 'challenges';
      return _pick([
        `Challenge liability — ${target} can't keep up in ${_catLabel} and the tribe can't carry that.`,
        `The tribe needs strength right now. ${target} isn't providing it in ${_catLabel}. That's enough.`,
        `When the tribe keeps losing, the weakest link becomes the clearest vote. ${target} is that link.`,
      ]);
    }
    if (_bond <= -2) return _pick([
      `Bad blood with ${target}. When the relationship is this far gone, the vote is personal.`,
      `The friction with ${target} has been building. Tonight it becomes a ballot.`,
      `This isn't strategy — it's honesty. ${target} and I don't work.`,
    ]);
    if (cat.label === 'Physical Threat') {
      const _chalRec = gs.chalRecord?.[target];
      // Pre-merge: "wins" = standout performances (best on tribe). Post-merge: actual individual wins.
      const _hasRecord = _chalRec?.wins >= 1 || _chalRec?.podiums >= 2;
      return _hasRecord ? _pick([
        `${target} keeps winning challenges. Post-merge that becomes untouchable. Move now.`,
        `Every challenge ${target} wins is a vote the tribe can't take. The window is closing.`,
        `${target} has been dominating. The tribe can see what's coming if nobody acts.`,
      ]) : _pick([
        `Look at ${target}. Built for challenges. Once immunity is individual, nobody catches that.`,
        `${target} is the strongest person out here. That's a shield now — but it becomes a weapon at merge.`,
        `The tribe sees ${target}'s physical game. Nobody is saying it out loud yet, but everyone is thinking the same thing.`,
      ]);
    }
    if (cat.label === 'Strategic Threat') return _pick([
      `${target} is running things quietly. The longer they stay, the harder they are to remove.`,
      `${target} has fingerprints on every decision. That kind of control doesn't get easier to stop.`,
      `${target} reads the game better than most. That's the kind of player who ends up at the end.`,
    ]);
    if (cat.label === 'Social Threat' || cat.label === 'Jury Threat') return _pick([
      `${target} is too well-liked. That's a jury winner if nobody does something about it.`,
      `When someone has no enemies at this stage, the odds are they win. ${target} has no enemies.`,
      `${target}'s social game is the real threat. Challenges end — relationships last.`,
    ]);
    if (cat.label === 'Well-Connected') return _pick([
      `${target} gets along with everyone. Pre-merge that's fine — but it's also a sign of someone building a path to the end.`,
      `${target} is tight with too many people. That kind of social capital becomes a weapon later.`,
      `Everyone likes ${target}. That's not a compliment in this game — it's a reason to be nervous.`,
    ]);
    if (cat.label === 'Likeable') return _pick([
      `${target} is the kind of player people root for. That makes them dangerous at final tribal.`,
      `${target}'s likeability is a weapon they don't even have to use on purpose. The tribe sees it.`,
    ]);
    if (cat.label === 'Challenge Weakness') return _pick([
      `${target} hasn't been strong in challenges. The tribe needs every advantage it can get.`,
      `Challenges are tight right now. ${target} isn't carrying enough weight to justify keeping.`,
      `${target}'s challenge performance is a liability. The tribe can't afford passengers.`,
    ]);
    if (cat.label === 'Pariah') return _pick([
      `Nobody in this game is willing to defend ${target}. When you've burned that many bridges, the vote writes itself.`,
      `${target} is alone out here — not by choice, but by consequence. The relationships are gone and so is the protection.`,
      `The tribe doesn't just want ${target} gone. They need ${target} gone. That kind of animosity doesn't wait.`,
    ]);
    if (cat.label === 'Outsider' || cat.label === 'On the Outs') {
      // Build specific reasoning from actual relationship data
      const _tribal = ep.tribalPlayers || gs.activePlayers;
      const _enemies = _tribal.filter(p => p !== target && getBond(target, p) <= -1);
      const _allies = _tribal.filter(p => p !== target && getBond(target, p) >= 2);
      const _inAlliance = (gs.namedAlliances || []).some(a => a.active !== false && a.members.includes(target));
      const _socialBombed = ep.socialBombs?.includes(target);
      const _isStandout = (() => {
        const pl = ep.chalPlacements || [];
        return pl.length >= 3 && pl[0] === target;
      })();
      const _tPr = pronouns(target);

      // Pick the most specific reason available
      if (_enemies.length >= 2 && !_inAlliance) return _pick([
        `${target} has friction with ${_enemies.slice(0, 2).join(' and ')} — and no alliance to shield ${_tPr.obj}. When the votes need a name, the person with enemies and no friends is the obvious choice.`,
        `${_enemies.length} people on this tribe actively dislike ${target}. With no alliance backing, that's a death sentence at tribal.`,
      ]);
      if (_socialBombed) return _pick([
        `${target}'s outburst at camp sealed it. The tribe was already lukewarm — the social bomb turned lukewarm into consensus.`,
        `After what happened at camp, ${target} gave the tribe permission to write ${_tPr.pos} name. Nobody needed a second reason.`,
      ]);
      if (_isStandout && _allies.length === 0) return _pick([
        `${target} was the best performer in the challenge — but that doesn't matter when nobody at camp is willing to protect you. No alliance, no safety net.`,
        `Strong in challenges, isolated at camp. ${target} has the skills but not the relationships. The tribe votes out the person nobody will miss, no matter how well they perform.`,
      ]);
      if (!_inAlliance && _allies.length === 0) return _pick([
        `${target} has no alliance and no close bonds on this tribe. When a vote needs to happen, the unprotected player is the path of least resistance.`,
        `No alliance. No tight bonds. ${target} is the vote that doesn't break anything — and in a game where relationships are currency, having none is fatal.`,
        `The tribe looked around for a name that wouldn't cause a war. ${target} — no alliance, no defenders — was that name.`,
      ]);
      if (_enemies.length >= 1) return _pick([
        `The tension with ${_enemies[0]} gave the tribe a direction. ${target} doesn't have enough allies to survive when someone is actively pushing against ${_tPr.obj}.`,
        `${target} and ${_enemies[0]} don't get along — and ${_enemies[0]} has more connections. When relationships collide, the person with fewer friends loses.`,
      ]);
      return _pick([
        `${target}'s connections are thin. Not hated — just not needed. The person with the fewest defenders is the easiest vote.`,
        `${target} hasn't built the relationships to survive a tribal where names are needed. It's not personal — it's math.`,
        `Nobody is going to war for ${target}. In a game of alliances, the unaligned player is always the first casualty.`,
      ]);
    }
    if (cat.label === 'Challenge Liability') return _pick([
      `The tribe can't afford to keep losing. ${target} is the reason they are.`,
      `Challenges matter. ${target} isn't pulling their weight. The tribe noticed.`,
    ]);
    if (threatScore(target) >= 2.5) return _pick([
      `Threat level is climbing. ${target} is getting harder to vote out with every episode.`,
      `${target}'s game is getting louder. The people paying attention are moving before it's too late.`,
    ]);
    if (cat.label === 'Under Fire') return _pick([
      `Multiple people want ${target} gone. The pressure has been building from every direction.`,
      `${target} has a target on their back from alliances, grudges, and game position. Tonight it all converges.`,
      `The heat on ${target} isn't from one source — it's from everywhere. That's when votes become inevitable.`,
    ]);
    if (cat.label === 'Target on Their Back') return _pick([
      `${target}'s name keeps coming up. Not from one person — from several. That kind of consensus is hard to survive.`,
      `There's quiet agreement forming around ${target}. Not loud, not dramatic — just steady and growing.`,
      `${target} can feel the pressure building. Whether they react to it or not defines tonight.`,
    ]);
    return _pick([
      `${target}'s name came up and nobody pushed back. Sometimes that's all it takes.`,
      `No strong reason to keep ${target} safe. When a name has no defenders, it sticks.`,
      `The vote needs to land somewhere. ${target} is the path of least resistance tonight.`,
      `${target} didn't do anything wrong — they just didn't do enough right. That's how votes happen early.`,
    ]);
  };

  // ─── reason → first-person confessional ──────────────────────────────────
  const reasonToConf = reason => {
    if (!reason) return null;
    const r = reason
      .replace(/\s*—\s*broke own bloc\s*$/i, '')
      .replace(/\s*—\s*bloc defection\s*$/i, '')
      .trim();
    if (!r) return null;
    const sub = (pat, fn) => { const m = r.match(pat); return m ? fn(...m.slice(1)) : null; };
    const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
    return (
      sub(/^loyal to (.+?) — not breaking ranks$/i,                    g  => `Loyal to ${g}. I'm not breaking ranks.`) ||
      sub(/^(.+?) made the call and they(?:'re| are) committed$/i,     g  => `${g} made the call. I'm committed.`) ||
      sub(/^trust is everything out here — following (.+)$/i,          g  => `Trust is everything. I'm following ${g}.`) ||
      sub(/^this is what (.+?) decided — they don't second-guess that$/i, g => `This is what ${g} decided. I don't second-guess it.`) ||
      sub(/^(.+?) has been solid — staying put$/i,                     g  => `${g} has been solid. I'm staying put.`) ||
      sub(/^following (.+?) — it's the right call for now$/i,          g  => `I'm with ${g}. It's the right call for now.`) ||
      sub(/^following (.+?) — (.+)$/i,                                 (g, rest) => `I'm following ${g}. ${cap(rest)}.`) ||
      sub(/^following (.+)$/i,                                         g  => `I'm following ${g}.`) ||
      sub(/^(.+?) has the numbers and they're making it visible$/i,    g  => `${g} has the numbers. I'm not hiding which side I'm on.`) ||
      sub(/^no reason to hide it — fully aligned with (.+?) this vote$/i, g => `Fully aligned with ${g} tonight.`) ||
      sub(/^public commitment — standing with (.+)$/i,                 g  => `Standing with ${g}. No hesitation.`) ||
      sub(/^(.+?) get(?:s)? the vote this round — convenient alignment$/i, g => `${g} gets the vote. Convenient alignment for now.`) ||
      sub(/^goes? with (.+?)'s read — no reason to deviate$/i,         g  => `I'm going with ${g}'s read. No reason to deviate.`) ||
      sub(/^(.+?) agreed on this name — going along with it$/i,        g  => `${g} agreed on this name. I'm going along with it.`) ||
      sub(/^the group followed the plan; .+ didn't(?:\s*—\s*(.+))?$/i, base => base ? `The group went where I pointed them. I had a different plan. ${cap(base)}.` : `The group went where I pointed them. I had a different plan.`) ||
      sub(/^went to tribal with a plan, left it at the urn — voted (.+?) instead(?:\s*—\s*(.+))?$/i, (t, base) => base ? `I went to tribal with a plan. I left it at the urn. ${cap(base)}.` : `I went to tribal with a plan. I left it at the urn. ${t} was the real move.`) ||
      sub(/^broke from their own bloc at the last moment — (.+)$/i,    rest => { const core = rest.replace(/\s*—\s*broke own bloc\s*$/i,'').trim(); return `I broke from the group at the last moment. ${cap(core)}.`; }) ||
      sub(/^told (.+?) to vote (.+?) — cast a completely different ballot — (.+)$/i, (g,t,base) => `I told ${g} to vote ${t}. Then I cast a completely different ballot. ${cap(base)}.`) ||
      sub(/^publicly committed to (.+?), privately chose .+ — (.+)$/i, (t, base) => `I publicly committed to ${t}. Privately, I had a different plan. ${cap(base)}.`) ||
      sub(/^stated plan was .+, actual vote was .+ — (.+)$/i,          base => `The stated plan was a cover. ${cap(base)}.`) ||
      sub(/^ran the plan, then used the cover to quietly eliminate (.+?) — (.+)$/i, (t,base) => `I ran the plan. Then I used the cover to take out ${t}. ${cap(base)}.`) ||
      sub(/^split — (.+?) made a more compelling case$/i,              g  => `I was split. ${g} made a more compelling case.`) ||
      sub(/^two alliances, one vote — went with (.+)$/i,               g  => `Two alliances wanted my vote. I went with ${g}.`) ||
      sub(/^(.+?) lost this one — (.+?) offered a better deal$/i,      (a,b) => `${a} lost this one. ${b} offered a better deal.`) ||
      sub(/^couldn't fully commit to (.+?) this round — sided with (.+)$/i, (a,b) => `I couldn't fully commit to ${a}. I sided with ${b}.`) ||
      sub(/^chose (.+?) over (.+?) — loyalty has a limit$/i,           (a,b) => `I chose ${a} over ${b}. Loyalty has a limit.`) ||
      sub(/^preemptive strike — sensed they were being targeted and hit first$/i, () => `Preemptive strike. I sensed it was coming and I hit first.`) ||
      sub(/^struck before being struck — calculated, not reactive$/i,  () => `I struck before being struck. Calculated, not reactive.`) ||
      sub(/^read the room — the vote was coming their way, they redirected it$/i, () => `I read the room. The vote was coming my way. I redirected it.`) ||
      sub(/^felt the heat building and chose to act instead of waiting$/i, () => `I felt the heat building. I chose to act.`) ||
      sub(/^redirected — couldn't vote (.+?), landed on (.+)$/i,       (a,b) => `I couldn't vote ${a}. ${b} was the redirect.`) ||
      sub(/^protecting (.+?) at (.+?)'s expense$/i,                    (a,b) => `I'm protecting ${a}. ${b} absorbs the vote.`) ||
      sub(/^protecting (.+?) — the bond runs too deep to go against$/i, a  => `${a} is safe. The bond runs too deep to go against.`) ||
      sub(/^(.+?) is untouchable to them — (.+?) absorbs the vote instead$/i, (a,b) => `${a} is untouchable. ${b} absorbs the vote.`) ||
      sub(/^deep personal animosity/i,                                  () => `This has been building since before the game started.`) ||
      sub(/^pure hostility/i,                                           () => `The name was never going to be anyone else.`) ||
      sub(/^can't work with (.+?) — the distrust has gotten too personal$/i, t => `I can't work with ${t}. The distrust has gotten too personal.`) ||
      sub(/^gut feeling — (.+?) doesn't sit right with them$/i,        t  => `Gut feeling. ${t} doesn't sit right with me.`) ||
      sub(/^reads people well — and (.+?) is not what they're presenting$/i, t => `I read people. ${t} is not what they're presenting.`) ||
      sub(/^can't afford to keep losing — (.+?) is the answer to that problem$/i, t => `We can't afford to keep losing. ${t} is the answer to that problem.`) ||
      sub(/^tribe comes first — (.+?) is the weakest link and everyone knows it$/i, t => `Tribe comes first. ${t} is the weakest link. Everyone knows it.`) ||
      sub(/^dead weight in challenges — (.+?) has been costing the tribe(.*)$/i, (t,ctx) => `${t} is dead weight in challenges. We can't keep losing${ctx ? ctx.replace(/—.*$/,'').trim() : ''}.`) ||
      sub(/^(.+?) hasn't pulled their weight(.*)$/i,                   (t,ctx) => `${t} hasn't pulled their weight${ctx || ''}.`) ||
      sub(/^most dangerous person left/i,                               () => `The most dangerous person left. Has to go now or it's too late.`) ||
      sub(/^strategic threat — the longer they stay/i,                  () => `Strategic threat. The longer they stay, the more locked-in their position becomes.`) ||
      sub(/^(.+?)'s name keeps coming up/i,                            t  => `${t}'s name keeps coming up. Eventually you vote the name everyone writes.`) ||
      sub(/^been a target for a while/i,                                () => `They've been a target for a while. The stars finally aligned.`) ||
      sub(/^complete player/i,                                          () => `Complete player — controls votes and has the jury in their pocket. Has to go.`) ||
      sub(/^running the game and building the jury at the same time/i,  () => `Running the game and building the jury at the same time. Cut now or lose.`) ||
      (cap(r) + (r.endsWith('.') ? '' : '.'))
    );
  };

  const shortReason = reason => {
    if (!reason) return null;
    const clean = reason
      .replace(/\s*—\s*broke own bloc\s*$/i, '')
      .replace(/\s*—\s*bloc defection\s*$/i, '')
      .trim();
    return clean.split(' — ')[0] || null;
  };

  const isGenericLoyal = reason => {
    if (!reason) return true;
    return /^(loyal to |following |.{1,60} agreed on this name|.{1,60} has been solid|.{1,60} has the numbers|public commitment|no reason to hide|trust is everything|goes? with .+?'s read|.{1,60} made the call|this is what .{1,60} decided|.{1,60} gets? the vote|convenient alignment)/i.test(reason);
  };

  // Deterministic pick — varies by voter+target pair without randomness across renders
  const _nh = (a, b) => [...(a + b)].reduce((s, c) => s + c.charCodeAt(0), 0);
  const _hp = (arr, a, b) => arr[_nh(a, b) % arr.length];

  const _phase = ep.gsSnapshot?.phase || gs.phase;
  const _isMerged = _phase !== 'pre-merge';

  // Derive a meaningful WHY phrase from the target's actual stats + voter-target bond
  const targetWhyPhrase = (targetName, voterName) => {
    const ts = pStats(targetName);
    const bond = getBond(voterName, targetName);
    const arch = ts.archetype || '';
    const priorVotes = (gs.episodeHistory || []).reduce((n, h) =>
      n + (h.votingLog || []).filter(v => v.voted === targetName).length, 0);

    if (bond <= -2) return _isMerged ? _hp([
      `The friction between us never went away — it just went underground. When the game gives you an opening on someone you genuinely don't trust, you take it.`,
      `${targetName} and I have never worked out here. That's not bitterness — it's just the truth. And the truth pointed my vote in one direction tonight.`,
      `The relationship was already broken before tonight. This vote didn't damage anything. It just made something official that's been true for a while.`,
      `There's no version of this game where ${targetName} and I end up on the same side at the end. Might as well be honest about that while the numbers back it up.`,
      `You can smile at someone every morning and still know they're a problem. I've known it. Tonight the vote says it out loud.`,
    ], voterName, targetName) : _hp([
      `Never fully trusted ${targetName} — the friction has been there since the start. This isn't a strategic vote. It's an honest one.`,
      `Something about ${targetName} has always felt off. Hard to name exactly, but it's been there. This is the moment to act on it.`,
      `${targetName} and I don't work out here. There's no version of this game where that changes. Voting ${targetName} is the most straightforward decision I've made.`,
      `The relationship with ${targetName} never recovered. Whatever goodwill existed is gone. When the numbers allow it, you clean up loose ends.`,
      `It's not personal and it's not strategic. It's just honest. Some people in this tribe I'd fight for. ${targetName} isn't one of them.`,
    ], voterName, targetName);

    if (bond <= 0) return _isMerged ? _hp([
      `When the game gets small, everyone without a real connection becomes a number. ${targetName} and I never built one. That made tonight easy.`,
      `I don't have a relationship with ${targetName} worth protecting. That's not a grudge — it's just where we landed. And where we landed made this vote available.`,
      `Post-merge, weak bonds become votes. ${targetName} and I were never close. When a name came up that I felt nothing about defending, I let it happen.`,
      `There's no alliance, no trust, no real conversation between me and ${targetName}. In this game, that absence becomes a vote eventually. Tonight was eventually.`,
      `I've watched ${targetName} build relationships with everyone except me. When you're not in someone's circle, you're in their threat column. I got there first.`,
    ], voterName, targetName) : _hp([
      `No real bond with ${targetName} — never built anything worth protecting. When the numbers point here and there's no relationship to defend, the vote is easy.`,
      `${targetName} and I never clicked. Not enemies — just nothing there. That gap becomes a vote eventually. This is that moment.`,
      `There's no alliance, no trust, no conversation that would make me cover for ${targetName}. When a name comes up and I feel nothing about it, I let it happen.`,
      `${targetName} never made an effort here and neither did I. That's not bitterness — it's arithmetic. No bond means no protection when the vote lands here.`,
      `This tribe has people I'd go to the end with. ${targetName} isn't one of them — not because of bad blood, just because we never built anything. That void is a vote.`,
    ], voterName, targetName);

    if (ts.strategic >= 8 || arch === 'mastermind' || arch === 'schemer') return _isMerged ? _hp([
      `${targetName} is running the board and pretending to just react. Everyone in this game feels it. The reads, the moves, the timing — you don't leave that kind of player in the game.`,
      `Every big decision in this game has ${targetName}'s fingerprints on it somewhere. That's not coincidence. That's control. You don't let that reach a jury.`,
      `${targetName} already has a final three in their head and we're probably not in it. The longer we wait, the harder it is to undo. Tonight is the window.`,
      `The dangerous thing about ${targetName} is that they make you feel included while they're building around you. I'm not included. The vote is my answer to that.`,
      `${targetName} is playing four moves ahead of everyone visible in this game. You can either follow that plan to the end — or you vote it out while you still have the numbers.`,
      `I've sat across from ${targetName} at camp and watched them work. Every conversation is a transaction. That's not judgment — that's a threat assessment. My vote is the result.`,
    ], voterName, targetName) : _hp([
      `${targetName} is running the board and acting like they're not. Everyone feels it, most people won't say it. The reads, the positioning, the timing — that's not luck. Clock is ticking.`,
      `Too calculating to leave in the game much longer. ${targetName} already has a path to the end mapped out. There's a real chance we're not on it.`,
      `${targetName} already has a final three locked in and we're probably not in it. Every day that passes is a day the plan gets harder to undo.`,
      `The reads, the timing, the positioning — ${targetName} is playing ahead of everyone in this game. You don't let that get to the end. You move before the window closes.`,
      `Strategic players are quiet right up until they're not. ${targetName} has been patient. This vote is about interrupting that patience before it becomes the game's final chapter.`,
      `${targetName} doesn't make mistakes. That's the problem. You can't wait for them to slip — you take the shot when the shot is there.`,
    ], voterName, targetName);

    if (ts.physical >= 8 || arch === 'challenge-beast') return _isMerged ? _hp([
      `${targetName} wins every time they enter a challenge. Post-merge, that's not admirable — it's a problem. Challenge beasts don't need good games; they just need to keep winning.`,
      `You can't vote out ${targetName} if they keep winning immunity. The window is now, while they're touchable. That window won't stay open.`,
      `Physical threats get exponentially harder to remove as the game gets smaller. The alliance that moves on ${targetName} now does something the people who wait can't.`,
      `${targetName} doesn't need alliances when the game gets small. They can just win. Sitting on this vote and hoping for a slip is wishful thinking, not strategy.`,
      `Every challenge ${targetName} wins is a vote we can't take. Right now they're touchable. That changes the moment the numbers thin out.`,
      `At merge, the players who can win challenges are the players you can't get rid of. ${targetName} can win challenges. That makes tonight necessary.`,
    ], voterName, targetName) : _hp([
      `Look at ${targetName}. Built for this. Once individual immunity starts, nobody's catching that. The time to move is now, while we still vote as a tribe.`,
      `${targetName} is the strongest person out here. That's useful right up until it isn't. Pre-merge is when you take the shot — post-merge the window closes.`,
      `Physical threats are easiest to remove in a tribe setting, when you have the cover of numbers. Post-merge that goes away. This is the cleanest shot we get.`,
      `${targetName} is dominant in the challenges that matter. Taking that ability out of the game before individual immunity kicks in is the right call.`,
    ], voterName, targetName);

    if (ts.social >= 8 || arch === 'social-butterfly') return _isMerged ? _hp([
      `${targetName} has built something real with every person on this tribe. That's not an ally — that's a jury winner. You don't beat that at final tribal. You vote it out before then.`,
      `I've watched ${targetName} work this camp. Every conversation lands, every relationship deepens. That's not luck — that's a masterclass in the social game. And it wins.`,
      `${targetName} doesn't need to win challenges or find idols. They've already won the room. A social game that strong doesn't get beaten — it gets removed.`,
      `When someone has no enemies at this stage of the game, the odds are they win. ${targetName} has no enemies. That's not a compliment — that's a threat.`,
      `The jury is watching everything. ${targetName} has been building their case in every conversation they've had out here. That story doesn't have a bad ending — unless we write one.`,
      `${targetName} could stand up at final tribal and lose every strategic argument and still win. That's how good their social game is. That's exactly why this vote exists.`,
    ], voterName, targetName) : _hp([
      `${targetName} is friends with everybody out here. That's a jury résumé, not loyalty. You can't beat that at final tribal — you remove it before it gets there.`,
      `Every conversation ${targetName} has ends with someone liking them more. That's dangerous in a way that's almost impossible to counter. The only answer is a vote while you still have the numbers.`,
      `${targetName} doesn't need an idol. They've already won the room. A social game that strong doesn't get beaten — it gets voted out before it reaches the end.`,
      `Social game that strong is impossible to beat at final tribal. ${targetName} has built something with everyone on this tribe. Letting that reach a jury is handing them the win.`,
      `The most dangerous players out here aren't the loud ones — they're the ones everyone genuinely likes. ${targetName} is that person. This vote is an acknowledgment of it.`,
    ], voterName, targetName);

    if (!_isMerged && (ts.physical + ts.endurance) / 2 <= 4) return _hp([
      `${targetName} has been the weak link in challenges and the tribe has been eating those losses. At some point the performance becomes the deciding factor. We're there.`,
      `The tribe has been covering for ${targetName} long enough. Performance doesn't lie. The numbers are what they are and somebody has to answer for it.`,
      `Challenge liability is challenge liability. ${targetName} hasn't been pulling their weight and everyone on this tribe knows it. The vote is the tribe saying it out loud.`,
      `The challenge record speaks for itself. ${targetName} has cost this tribe real ground. At some point loyalty to a tribemate has to weigh against loyalty to the tribe's survival.`,
      `Keeping a weak challenge player on the wrong side of the merge is how you hand the other tribe free wins. The vote is the tribe correcting that.`,
      `Every loss that traces back to the same person eventually stops feeling like bad luck. The tribe made the math, and the math said ${targetName}. This isn't personal — it's a correction.`,
    ], voterName, targetName);

    if (ts.loyalty <= 3) return _isMerged ? _hp([
      `${targetName} doesn't have a real side in this game — they have whoever is most useful right now. That changes. I'm voting before it changes on me.`,
      `I've watched ${targetName} float between groups and I know what that means. When the math shifts, so does their vote. The safest call is to remove that variable before it costs someone.`,
      `You can't build a path to the end around someone who's willing to pivot at any moment. ${targetName} is a wildcard in a game where unpredictability is dangerous.`,
      `${targetName} has been friendly to every alliance in this game. At some point that stops being diplomatic and starts being a threat. I stopped giving them the benefit of the doubt.`,
      `A player with no real loyalties is the most dangerous kind — they're available to whoever needs them. I'm not letting that availability work against me.`,
    ], voterName, targetName) : _hp([
      `${targetName} will flip the moment a better deal shows up. No question. You can't build anything solid with someone that loose at the core — and you definitely can't take them to the end.`,
      `${targetName}'s loyalty goes to whoever benefits them most right now. That changes. The safest move is to vote them out before the math shifts and they use that flexibility against us.`,
      `Can't build anything solid with someone that loose at the core. ${targetName} isn't an ally — they're a liability waiting for the right offer. Better to make the move before they do.`,
      `Pre-merge, a flighty tribemate is fine — until they're not. ${targetName} has never been fully committed and we've been gambling on that. The gamble stops tonight.`,
    ], voterName, targetName);

    if (ts.boldness >= 8) return _isMerged ? _hp([
      `${targetName} plays loud and everyone can see it. That kind of visibility is a magnet for chaos at this stage of the game. Bold players don't become safer — they become bigger threats.`,
      `One wrong call from ${targetName} and everything blows up. That's not a player you manage — that's a player you remove before the damage becomes your damage.`,
      `${targetName} makes moves for the story, not the outcome. That's entertaining until it derails your game. I'm not letting their boldness become my problem.`,
      `Bold players are fine when they're pointed in the right direction. ${targetName} isn't pointed at anything reliable. When you can't predict someone, you remove the variable.`,
      `${targetName} has been making noise this game. Loud games attract attention. Attention in the post-merge isn't glory — it's a target. I'm helping that process along.`,
    ], voterName, targetName) : _hp([
      `${targetName} plays loud — that kind of visibility brings heat on everyone nearby. One big move from blowing the whole thing up. Some people you manage; some people you remove.`,
      `Too bold, too visible. ${targetName} is one bad tribal from becoming completely uncontrollable. Bold players don't stay predictable. The vote is a pre-empt before that becomes a problem.`,
      `${targetName} is one bad tribal from becoming completely uncontrollable. The boldness that makes them fun to watch also makes them impossible to trust with real information.`,
      `Pre-merge, you can absorb a wildcard. Post-merge you can't. ${targetName} needs to go now, before the game stakes get high enough to make their boldness truly dangerous.`,
    ], voterName, targetName);

    if (priorVotes >= 2) return _isMerged ? _hp([
      `${targetName}'s name has come up before — more than once. The tribe has been circling this vote for a while. Tonight we close it.`,
      `When a name keeps coming back, it's because the instinct behind it is right. The timing just wasn't there before. It's there now.`,
      `The tribe has already had this conversation multiple times. ${targetName} survived — but the read on them hasn't changed. Eventually the vote that keeps almost happening just happens.`,
      `${targetName} is still here because we couldn't get the numbers before. The numbers are there now. This isn't a new decision — it's a delayed one.`,
    ], voterName, targetName) : _hp([
      `${targetName} has been on the block before. The tribe has already had this conversation — the vote just didn't land. This time we close it out.`,
      `This has been building since the first time ${targetName}'s name came up. It didn't happen then. It's happening now. The tribe's read on ${targetName} hasn't changed.`,
      `${targetName} survived once. The votes came back for a reason. When a name keeps circling it means the instinct is right — just the timing wasn't. Tonight the timing is right.`,
      `The tribe has been wanting to make this move and waiting for the right moment. The moment is here. Some votes aren't new ideas — they're overdue corrections.`,
    ], voterName, targetName);

    return _isMerged ? _hp([
      `The numbers converged on ${targetName} and nobody had a strong enough argument to move them. That kind of consensus is rare — you don't ignore it.`,
      `${targetName} wasn't the first name, but they became the one everyone could live with. In a game where half the tribe needs to agree, that matters more than being the obvious choice.`,
      `When the dust settles and everyone's doing the same math, you go with it. ${targetName} is the answer everyone kept arriving at. That means something.`,
      `At some point in every tribal, a name floats to the top and stays there. ${targetName} was that name tonight. Nobody had a better option. The vote followed.`,
      `I ran through the scenarios. Every version of this game where I'm still here in two tribals, ${targetName} is not. The vote is just me catching up to that logic.`,
    ], voterName, targetName) : _hp([
      `Numbers pointed here and nobody pushed back hard enough to move them. ${targetName} wasn't the only name, but became the one everyone could live with. That consensus has weight.`,
      `${targetName} wasn't the first name but became the one everyone could agree on. In this game, the vote that sticks is the one where nobody flinches at the last second. Nobody flinched.`,
      `When the dust settled, ${targetName} was the vote everyone could live with. Sometimes that's how it goes — not the loudest target, just the most available one with the least protection.`,
      `Pre-merge votes are about tribe function. ${targetName} didn't fit the picture of what this tribe needs going into the merge. The vote reflects that read.`,
    ], voterName, targetName);
  };

  // ─── data sourcing ─────────────────────────────────────────────────────────
  // Source plan data from ep.alliances (alliance objects from formAlliances), NOT votingLog
  const allAlliances = (ep.alliances || []);
  const namedAlliances = allAlliances.filter(a => (a.type === 'alliance' || a.type === 'consensus') && a.label && a.members.length >= 2);
  const soloAlliances = allAlliances.filter(a => a.type === 'solo' || (a.members && a.members.length === 1));
  const tribalPlayers = ep.tribalPlayers || [];

  // Penalty votes (voter === 'THE GAME')
  const _penaltyVotes = votingLog.filter(e => e.voter === 'THE GAME');

  // Spearheader: highest social + strategic in alliance
  const allianceSpear = members => members.slice().sort((a, b) =>
    (pStats(b).social + pStats(b).strategic) - (pStats(a).social + pStats(a).strategic)
  )[0];

  // Players in named alliances or consensus groups (for detecting independents)
  const allAllianceMembers = new Set(namedAlliances.flatMap(a => a.members));

  // Independent players: at tribal, not in any named alliance
  const independentPlayers = tribalPlayers.filter(p =>
    !allAllianceMembers.has(p)
  );

  // Conflicted players: in 2+ alliances with different targets, OR alliance target has bond >= 3 with voter
  const generateConflictReasoning = (player, playerAlliances, tribalPlayersList) => {
    return playerAlliances.map(a => {
      const target = a.target;
      const tCat = targetCategory(target);
      const bond = getBond(player, target);
      const allyCount = a.members.filter(m => tribalPlayersList.includes(m)).length;

      // Why vote
      let whyVote = allyCount >= 3
        ? `Alliance consensus. ${allyCount} members committed.`
        : `${a.label} wants this. Clean strategic move.`;
      if (tCat.label.includes('Physical')) whyVote += ` ${target} is a physical threat everyone agrees on.`;
      else if (tCat.label.includes('Strategic')) whyVote += ` ${target} is running the game from behind — too smart to keep.`;
      else if (tCat.label.includes('Social')) whyVote += ` ${target} is too well-liked. Every vote they survive gets harder.`;

      // Why not — specific reasons a player might hesitate
      let whyNot = '';
      const _sharedAlliance = (gs.namedAlliances || []).find(al => al.active !== false && al.members.includes(player) && al.members.includes(target));
      const _showmance = gs.showmances?.find(sm => sm.players.includes(player) && sm.players.includes(target) && sm.phase !== 'broken-up');
      if (_showmance) whyNot = `${player} and ${target} are in a showmance. This vote would destroy something real.`;
      else if (bond >= 5) whyNot = `${player} and ${target} are extremely close — this would be a betrayal neither forgets.`;
      else if (bond >= 3 && _sharedAlliance) whyNot = `${player} and ${target} are allies in ${_sharedAlliance.name}. Voting ${target} out breaks that trust.`;
      else if (bond >= 3) whyNot = `The bond with ${target} is strong. Writing that name means betraying a real relationship.`;
      else if (_sharedAlliance) whyNot = `${player} and ${target} are in ${_sharedAlliance.name} together. Following through means breaking ranks.`;
      else if (bond >= 2) whyNot = `${player} has a genuine connection with ${target}. This isn't a clean vote — it's personal.`;
      else if (allyCount <= 2) whyNot = `Only ${allyCount} votes behind this. Needs help from outside. High risk if nobody else follows.`;
      else if (bond >= 1) whyNot = `There's enough of a connection with ${target} to create doubt — not a clean vote.`;
      else if (threatScore(target) <= 3) whyNot = `${target} isn't a real threat. Spending a vote here feels wasteful.`;
      else if (tribalPlayers.length <= 6) whyNot = `At this stage, every vote matters. Targeting ${target} might not be the smartest use of numbers.`;
      else whyNot = `No strong reason to hesitate — but no strong reason to commit either. ${player} could flip.`;

      return { alliance: a.label, target, tCat, whyVote, whyNot, bond, allyCount };
    });
  };

  // Identify conflicted players
  const conflictedPlayers = [];
  const _seenConflicted = new Set();
  tribalPlayers.forEach(player => {
    if (_seenConflicted.has(player)) return;
    const myAlliances = namedAlliances.filter(a => a.members.includes(player));
    if (myAlliances.length < 1) return;

    // Multi-alliance with different targets
    if (myAlliances.length >= 2) {
      const targets = [...new Set(myAlliances.map(a => a.target))];
      if (targets.length >= 2) {
        _seenConflicted.add(player);
        conflictedPlayers.push({ player, reason: 'multi-alliance', alliances: myAlliances });
        return;
      }
    }

    // Tied Destinies: player can't vote for their TD partner — show as TD conflict instead of bond conflict
    const _tdPairs = ep.tiedDestinies?.pairs || gs._tiedDestiniesActive || [];
    const _tdPair = _tdPairs.find(p => p.a === player || p.b === player);
    const _tdPartner = _tdPair ? (_tdPair.a === player ? _tdPair.b : _tdPair.a) : null;
    if (_tdPartner) {
      const _tdTargetAlliance = myAlliances.find(a => a.target === _tdPartner);
      if (_tdTargetAlliance) {
        _seenConflicted.add(player);
        conflictedPlayers.push({ player, reason: 'td-blocked', alliances: myAlliances, tdPartner: _tdPartner });
        return;
      }
    }

    // Bond conflict: voter has a meaningful positive bond with the alliance's target
    // Threshold scales with game stage — EP1-3 bonds are 0-2, so lower bar. Late game needs stronger bond.
    const _bondConflictThreshold = ep.num <= 3 ? 1.0 : ep.num <= 6 ? 1.5 : 2.5;
    const conflictAlliance = myAlliances.find(a => getBond(player, a.target) >= _bondConflictThreshold);
    if (conflictAlliance) {
      _seenConflicted.add(player);
      conflictedPlayers.push({ player, reason: 'bond-conflict', alliances: myAlliances });
    }
  });

  // ─── HTML ───────────────────────────────────────────────────────────────────
  const _vpTribeLabel = tribalTribeName ? ` \u00b7 ${tribalTribeName}` : '';
  let html = `<div class="rp-page tod-dusk">
    <div class="rp-eyebrow">Episode ${ep.num} \u2014 Before the Vote${_vpTribeLabel}</div>
    <div class="rp-title" style="color:${tc}">Voting Plans</div>
    <div class="rp-vp-subtitle">As ${tribalTribeName || 'the tribe'} approaches tribal, alliances converge and targets emerge\u2026</div>
    ${ep.firstEliminated && (ep.twists||[]).some(t => t.catalogId === 'double-elim') ? `<div style="background:rgba(210,153,34,0.06);border:1px solid rgba(210,153,34,0.2);border-radius:6px;padding:10px 14px;margin-bottom:4px;font-size:12px;color:#d29922">&#x26A1; <strong>Double Elimination</strong> &mdash; Jeff announced it before tribal. Two players are going home tonight. One vote — the top two vote-getters both go.</div>` : ''}
    ${ep.volunteerDuel ? `<div style="background:rgba(129,140,248,0.06);border:1px solid rgba(129,140,248,0.2);border-radius:6px;padding:10px 14px;margin-bottom:4px;font-size:12px;color:#818cf8;display:flex;align-items:center;gap:8px">
      ${rpPortrait(ep.volunteerDuel.volunteer, 'sm')}
      <div><strong>${ep.volunteerDuel.volunteer}</strong> volunteered to be voted out to face <strong>${ep.volunteerDuel.rival}</strong> at the exile duel. ${ep.volunteerDuel.granted ? 'The tribe granted the request.' : 'The tribe had other priorities.'}</div>
    </div>` : ''}`;

  // ── Immune banners ──
  const _allImmuneVP = [...new Set([immunity, ep.sharedImmunity, ep.secondImmune, ...(ep.extraImmune || [])].filter(Boolean))];
  if (_allImmuneVP.length) {
    html += `<div style="display:flex;flex-direction:column;gap:6px;margin-bottom:8px">`;
    _allImmuneVP.forEach(name => {
      const _heroDuelTw = (ep.twists||[]).find(t => t.type === 'hero-duel' && t.duelWinner === name);
      const _gaTw2 = (ep.twists||[]).find(t => t.type === 'guardian-angel' && t.guardianAngel === name);
      const _auctionImmune = (ep.twists||[]).some(t => t.type === 'auction' && t.auctionResults?.some(r => r.effect === 'immunity' && r.winnerName === name));
      const label = name === immunity ? `${name} \u2014 immune tonight`
                  : name === ep.sharedImmunity ? `${name} \u2014 shared immunity`
                  : name === ep.secondImmune ? `${name} \u2014 safe (runner-up)`
                  : _heroDuelTw ? `${name} \u2014 safe (hero duel winner)`
                  : _gaTw2 ? `${name} \u2014 safe (guardian angel)`
                  : _auctionImmune ? `${name} \u2014 safe (auction immunity)`
                  : `${name} \u2014 safe`;
      html += `<div class="rp-vp-immunity-row">
        ${rpPortrait(name, 'immune', 'Safe')}
        <span class="rp-vp-immunity-label">\u{1F6E1}\uFE0F ${label}</span>
      </div>`;
    });
    html += `</div>`;
  }

  // ── Lost vote banner ──
  const _snap = ep.gsSnapshot || {};
  const _bewareLosers = new Set(ep.bewareLostVotes || []);
  const _journeyLosers = new Set((ep.journey?.results || []).filter(r => r.result === 'lostVote').map(r => r.name));
  const _prevSnap2 = gs.episodeHistory?.find(h => h.num === ep.num - 1)?.gsSnapshot;
  const _carriedJourney = new Set((_prevSnap2?.journeyLostVotes || []).filter(n => tribalPlayers.includes(n)));
  // Sole Vote silenced players should NOT appear as "No Vote" — that spoils the Sole Vote reveal
  const _soleVoteSilenced = new Set((ep.idolPlays || []).find(p => p.type === 'soleVote')?.silencedPlayers || []);
  const _snapLostVotes = new Set((_snap.lostVotes || []).filter(n => tribalPlayers.includes(n) && !_soleVoteSilenced.has(n)));
  const _vpLostVotes = tribalPlayers.filter(name => {
    if (_allImmuneVP.includes(name)) return false;
    if (_soleVoteSilenced.has(name)) return false;
    return _bewareLosers.has(name) || _journeyLosers.has(name) || _carriedJourney.has(name) || _snapLostVotes.has(name);
  });
  const _vpLostVoteSet = new Set(_vpLostVotes);
  if (_vpLostVotes.length) {
    html += `<div style="display:flex;flex-direction:column;gap:6px;margin-bottom:8px">`;
    _vpLostVotes.forEach(name => {
      const _bewAdv = _bewareLosers.has(name);
      const _isJourney = _journeyLosers.has(name) || _carriedJourney.has(name);
      const reason = _bewAdv ? `Beware Advantage — lost vote until all tribes find theirs`
                   : _isJourney ? `Journey — lost the game and cannot vote`
                   : `Lost vote — cannot vote tonight`;
      html += `<div style="display:flex;align-items:center;gap:12px;padding:8px 14px;background:rgba(218,54,51,0.06);border:1px solid rgba(218,54,51,0.15);border-radius:8px">
        <div style="opacity:0.5">${rpPortrait(name)}</div>
        <div>
          <div style="font-size:13px;font-weight:600;color:#f85149">${name} — No Vote</div>
          <div style="font-size:11px;color:#8b949e;margin-top:2px">${reason}</div>
        </div>
      </div>`;
    });
    html += `</div>`;
  }

  // ── ALLIANCE PLANS ──────────────────────────────────────────────────────────
  if (namedAlliances.length) {
    html += `<div class="rp-vp-section-label">ALLIANCE PLANS</div>
      <div class="rp-vp-plans-row">`;
    namedAlliances.forEach((a, aIdx) => {
      const spear = allianceSpear(a.members);
      const membersAtTribal = a.members.filter(m => tribalPlayers.includes(m));
      const canVote = membersAtTribal.filter(m => !_vpLostVoteSet.has(m) && !_allImmuneVP.includes(m));
      const cat = a.target ? targetCategory(a.target) : { label: 'No Target', color: '#484f58' };
      const splitPlan = (ep.splitVotePlans || []).find(sp => sp.alliance === a.label);

      let ph = `<div class="rp-vp-plan" style="border:1px solid rgba(99,102,241,0.25);background:rgba(99,102,241,0.04);animation:slideInLeft 0.4s ease ${aIdx * 0.1}s both">`;

      // Header: alliance name + type badge + member counts
      // Only show "Alliance" if the name matches an actual gs.namedAlliance — otherwise it's a voting bloc
      const _snapAlliances = ep.gsSnapshot?.namedAlliances || gs.namedAlliances || [];
      const _isRealAlliance = a.type === 'alliance' && _snapAlliances.some(na => na.active !== false && na.name === a.label);
      const _typeLabel = _isRealAlliance ? 'Alliance' : 'Voting Bloc';
      const _typeBg = _isRealAlliance ? 'rgba(99,102,241,0.15)' : 'rgba(139,148,158,0.15)';
      const _typeCol = _isRealAlliance ? '#818cf8' : '#8b949e';
      const _typeBorder = _isRealAlliance ? 'rgba(99,102,241,0.3)' : 'rgba(139,148,158,0.3)';
      ph += `<div class="rp-vp-plan-header">
        <span class="rp-vp-plan-label">${a.label}</span>
        <span class="rp-vp-plan-type" style="background:${_typeBg};color:${_typeCol};border:1px solid ${_typeBorder}">${_typeLabel}</span>
        <span class="rp-vp-plan-votes">${membersAtTribal.length} member${membersAtTribal.length !== 1 ? 's' : ''} \u00b7 ${canVote.length} can vote</span>
      </div>`;

      // TARGET box + reasoning
      if (a.target) {
        const _isCheckedOut = ep.comfortBlindspotPlayer === a.target;
        const _targetReason = _vpTargetReason(a.target, spear, cat);
        ph += `<div class="rp-vp-section-mini">\u2694\uFE0F TARGET</div>
          <div class="rp-vp-target-row" style="background:rgba(248,81,73,0.06);border-radius:8px;padding:8px 10px">
            ${rpPortrait(a.target)}
            <div class="rp-vp-target-info">
              <div class="rp-vp-target-name">${a.target}</div>
              <div class="rp-vp-target-cat" style="color:${cat.color}">${cat.label}</div>
              ${_isCheckedOut ? `<span class="rp-brant-badge gold">\u2b50 CHECKED OUT</span>` : ''}
              <div style="font-size:11px;color:#8b949e;margin-top:4px;line-height:1.4;font-style:italic">${_targetReason}</div>
            </div>
          </div>`;
      } else {
        ph += `<div class="rp-vp-section-mini">\u2694\uFE0F TARGET</div>
          <div style="padding:10px;background:rgba(139,148,158,0.04);border-radius:8px;border:1px solid rgba(139,148,158,0.08)">
            <div style="font-size:12px;color:#8b949e;font-style:italic">No clear target — the alliance is scrambling. With this few people left, every option is personal.</div>
          </div>`;
      }

      // Split vote indicator
      if (a.splitTarget || splitPlan) {
        const splitTarget = a.splitTarget || splitPlan?.secondary;
        const splitCat = targetCategory(splitTarget);
        ph += `<div style="display:flex;align-items:center;gap:8px;margin-top:6px;padding:6px 10px;background:rgba(210,153,34,0.06);border:1px solid rgba(210,153,34,0.15);border-radius:6px">
          <span style="font-size:12px">\u{1F5E1}\uFE0F</span>
          <div>
            <div style="font-size:11px;font-weight:700;color:#d29922">SPLIT VOTE</div>
            <div style="font-size:10px;color:#8b949e">Some votes going to <strong style="color:#e6edf3">${splitTarget}</strong> <span style="color:${splitCat.color}">(${splitCat.label})</span> as insurance</div>
          </div>
        </div>`;
      }

      // Member list
      ph += `<div class="rp-vp-section-mini">MEMBERS</div><div class="rp-vp-members">`;
      membersAtTribal.forEach(member => {
        const isSpear = member === spear;
        const isConflicted = _seenConflicted.has(member);
        const isNoVote = _vpLostVoteSet.has(member);
        const opacity = isNoVote ? 'opacity:0.4;' : '';
        ph += `<div class="rp-vp-member-row" style="${opacity}">
          ${rpPortrait(member, isNoVote ? '' : 'sm')}
          <div class="rp-vp-member-info">
            <div class="rp-vp-member-name">${member}${isSpear ? ` <span class="rp-vp-spear-badge">Spearheader</span>` : ''}${isConflicted ? ` <span style="font-size:11px;color:#d29922">\u26A0</span>` : ''}${isNoVote ? ` <span style="font-size:9px;color:#f85149;font-weight:600">NO VOTE</span>` : ''}</div>
          </div>
        </div>`;
      });
      ph += `</div>`;

      ph += `</div>`;
      html += ph;
    });
    html += `</div>`;
  }

  // ── CONFLICTED PLAYERS ──────────────────────────────────────────────────────
  if (conflictedPlayers.length) {
    html += `<div class="rp-vp-section-label">\u26A0 CONFLICTED PLAYERS</div><div class="rp-vp-swings">`;
    conflictedPlayers.forEach(({ player, reason: conflictType, alliances: playerAlliances }) => {
      const reasoning = generateConflictReasoning(player, playerAlliances, tribalPlayers);
      let ch = `<div style="background:rgba(210,153,34,0.06);border:1px solid rgba(210,153,34,0.25);border-radius:10px;padding:12px 14px;margin-bottom:8px;animation:slideInLeft 0.4s ease">`;
      ch += `<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
        ${rpPortrait(player)}
        <div>
          <div style="font-size:14px;font-weight:700;color:#e6edf3">${player}</div>
          <div style="font-size:10px;color:#d29922;font-weight:600;letter-spacing:0.5px">${conflictType === 'multi-alliance' ? 'PULLED IN MULTIPLE DIRECTIONS' : conflictType === 'td-blocked' ? '🔗 TIED DESTINIES — CAN\'T VOTE PARTNER' : 'BOND CONFLICT'}</div>
        </div>
      </div>`;

      reasoning.forEach(r => {
        ch += `<div style="padding:8px 10px;background:rgba(99,102,241,0.04);border:1px solid rgba(99,102,241,0.12);border-radius:6px;margin-bottom:6px">
          <div style="font-size:11px;font-weight:700;color:#818cf8;margin-bottom:4px">${r.alliance} \u2192 <span style="color:${r.tCat.color}">${r.target}</span></div>
          <div style="font-size:11px;color:#3fb950;margin-bottom:2px"><strong>Why vote:</strong> ${r.whyVote}</div>
          <div style="font-size:11px;color:#f85149"><strong>Why not:</strong> ${r.whyNot}</div>
        </div>`;
      });

      ch += `<div style="font-size:11px;color:#d29922;font-style:italic;text-align:center;margin-top:4px">\u2753 Wild card \u2192 ???</div>`;
      ch += `</div>`;
      html += ch;
    });
    html += `</div>`;
  }

  // ── INDEPENDENT VOTES ───────────────────────────────────────────────────────
  const trueIndependents = independentPlayers.filter(p => !_seenConflicted.has(p));
  if (trueIndependents.length) {
    html += `<div class="rp-vp-section-label">INDEPENDENT VOTES</div><div class="rp-vp-swings">`;
    trueIndependents.forEach(player => {
      const isNoVote = _vpLostVoteSet.has(player);
      const isImmune = _allImmuneVP.includes(player);
      // Brief context from their solo alliance target if available
      const soloA = soloAlliances.find(a => a.members.includes(player));
      const soloTarget = soloA?.target || null;
      const soloTCat = soloTarget ? targetCategory(soloTarget) : null;
      if (isNoVote) {
        html += `<div class="rp-vp-swing" style="animation:slideInLeft 0.4s ease;opacity:0.4">
          <div style="display:flex;align-items:center;gap:10px">
            ${rpPortrait(player)}
            <div>
              <div style="font-size:14px;font-weight:700;color:#484f58">${player}</div>
              <div style="font-size:10px;color:#f85149;font-weight:600">Cannot vote tonight</div>
            </div>
          </div>
        </div>`;
      } else if (soloTarget) {
        const _stCat = soloTCat;
        const _indReason = _vpTargetReason(soloTarget, player, _stCat || { label: 'Active Player', color: '#484f58' });
        html += `<div class="rp-vp-swing" style="animation:slideInLeft 0.4s ease">
          <div style="display:flex;align-items:center;gap:12px">
            ${rpPortrait(player, 'sm')}
            <div style="font-size:14px;font-weight:700;color:#e6edf3;flex:1">${player}</div>
            <div style="display:flex;align-items:center;gap:8px;padding:6px 10px;background:rgba(248,81,73,0.04);border:1px solid rgba(248,81,73,0.1);border-radius:6px">
              <span style="font-size:8px;font-weight:800;letter-spacing:1.5px;color:#f85149">TARGET</span>
              ${rpPortrait(soloTarget, 'sm')}
              <div>
                <div style="font-size:12px;font-weight:700;color:#e6edf3">${soloTarget}</div>
                <div style="font-size:9px;color:${_stCat?.color || '#484f58'}">${_stCat?.label || 'Target'}</div>
              </div>
            </div>
          </div>
          <div style="font-size:11px;color:#8b949e;line-height:1.5;font-style:italic;margin-top:6px">${_indReason}</div>
        </div>`;
      } else {
        // No solo alliance target — try to find a likely target from vote log (show name but not outcome)
        const _logEntry = votingLog.find(l => l.voter === player);
        const _likelyTarget = _logEntry?.voted || null;
        const _ltCat = _likelyTarget ? targetCategory(_likelyTarget) : null;
        if (_likelyTarget && !isImmune) {
          const _fbReason = _vpTargetReason(_likelyTarget, player, _ltCat || { label: 'Active Player', color: '#484f58' });
          html += `<div class="rp-vp-swing" style="animation:slideInLeft 0.4s ease">
            <div style="display:flex;align-items:center;gap:12px">
              ${rpPortrait(player, 'sm')}
              <div style="font-size:14px;font-weight:700;color:#e6edf3;flex:1">${player}</div>
              <div style="display:flex;align-items:center;gap:8px;padding:6px 10px;background:rgba(248,81,73,0.04);border:1px solid rgba(248,81,73,0.1);border-radius:6px">
                <span style="font-size:8px;font-weight:800;letter-spacing:1.5px;color:#f85149">TARGET</span>
                ${rpPortrait(_likelyTarget, 'sm')}
                <div>
                  <div style="font-size:12px;font-weight:700;color:#e6edf3">${_likelyTarget}</div>
                  <div style="font-size:9px;color:${_ltCat?.color || '#484f58'}">${_ltCat?.label || 'Target'}</div>
                </div>
              </div>
            </div>
            <div style="font-size:11px;color:#8b949e;line-height:1.5;font-style:italic;margin-top:6px">${_fbReason}</div>
          </div>`;
        } else {
          html += `<div class="rp-vp-swing" style="animation:slideInLeft 0.4s ease">
            <div style="display:flex;align-items:center;gap:10px">
              ${rpPortrait(player)}
              <div>
                <div style="font-size:14px;font-weight:700;color:#e6edf3">${player}</div>
                <div style="font-size:11px;color:#484f58;margin-top:2px">${isImmune ? 'Safe tonight — voting freely' : 'Reading the room'}</div>
              </div>
            </div>
          </div>`;
        }
      }
    });
    html += `</div>`;
  }

  // ── GOING INTO TRIBAL ───────────────────────────────────────────────────────
  // Determine primary and counter targets from alliance plans
  const _targetVoteCounts = {};
  namedAlliances.forEach(a => {
    if (!a.target) return; // skip alliances with no valid target
    const votingMembers = a.members.filter(m => tribalPlayers.includes(m) && !_vpLostVoteSet.has(m));
    if (a.splitTarget) {
      const primaryCount = (a.splitPrimary || []).filter(m => votingMembers.includes(m)).length;
      const secondaryCount = (a.splitSecondary || []).filter(m => votingMembers.includes(m)).length;
      _targetVoteCounts[a.target] = (_targetVoteCounts[a.target] || 0) + (primaryCount || Math.ceil(votingMembers.length * 0.6));
      _targetVoteCounts[a.splitTarget] = (_targetVoteCounts[a.splitTarget] || 0) + (secondaryCount || Math.floor(votingMembers.length * 0.4));
    } else {
      _targetVoteCounts[a.target] = (_targetVoteCounts[a.target] || 0) + votingMembers.length;
    }
  });
  // Solo alliances contribute too
  soloAlliances.forEach(a => {
    const member = a.members[0];
    if (member && tribalPlayers.includes(member) && !_vpLostVoteSet.has(member) && a.target && a.target !== 'null') {
      _targetVoteCounts[a.target] = (_targetVoteCounts[a.target] || 0) + 1;
    }
  });
  const _sortedTargets = Object.entries(_targetVoteCounts).filter(([name]) => name && name !== 'null' && name !== 'undefined').sort(([,a],[,b]) => b - a);
  if (_sortedTargets.length) {
    const primaryTarget = _sortedTargets[0];
    const counterTarget = _sortedTargets[1] || null;
    const totalPlannedVotes = _sortedTargets.reduce((s, [,c]) => s + c, 0);

    const _heatLabel = (n, total) => {
      const frac = total > 0 ? n / total : 0;
      if (n === 1)     return 'A name in the mix';
      if (frac >= 0.7) return 'Strong numbers behind this';
      if (frac >= 0.5) return 'Majority momentum';
      if (frac >= 0.35) return 'Real support going in';
      return 'Support building';
    };

    html += `<div class="rp-vp-section-label">GOING INTO TRIBAL</div>
      <div class="rp-vp-final-row">`;

    const primaryCat = targetCategory(primaryTarget[0]);
    html += `<div class="rp-vp-final-card" style="border-color:${primaryCat.color}">
      <div class="rp-vp-final-label" style="color:${primaryCat.color}">Primary Target</div>
      ${rpPortrait(primaryTarget[0])}
      <div class="rp-vp-final-name">${primaryTarget[0]}</div>
      <div class="rp-vp-final-cat" style="color:${primaryCat.color}">${primaryCat.label}</div>
      <div class="rp-vp-final-votes">${_heatLabel(primaryTarget[1], totalPlannedVotes)}</div>
    </div>`;

    if (counterTarget && counterTarget[0] !== primaryTarget[0]) {
      const counterCat = targetCategory(counterTarget[0]);
      html += `<div class="rp-vp-final-card" style="border-color:#30363d66">
        <div class="rp-vp-final-label" style="color:#484f58">${counterTarget[1] === 1 ? 'Lone Vote' : 'Counter Target'}</div>
        ${rpPortrait(counterTarget[0])}
        <div class="rp-vp-final-name">${counterTarget[0]}</div>
        <div class="rp-vp-final-cat" style="color:${counterCat.color}">${counterCat.label}</div>
        <div class="rp-vp-final-votes">${_heatLabel(counterTarget[1], totalPlannedVotes)}</div>
      </div>`;
    }
    html += `</div>`;

    // Tension summary
    if (counterTarget && counterTarget[1] >= 2 && primaryTarget[1] - counterTarget[1] <= 2) {
      html += `<div style="text-align:center;font-size:11px;color:#d29922;margin-top:4px;font-style:italic">The margin is razor-thin. One flip changes everything tonight.</div>`;
    } else if (conflictedPlayers.length) {
      html += `<div style="text-align:center;font-size:11px;color:#8b949e;margin-top:4px;font-style:italic">${conflictedPlayers.length} conflicted player${conflictedPlayers.length !== 1 ? 's' : ''} could reshape the outcome.</div>`;
    }
  } else if (votingLog.length) {
    // No alliance plans produced valid targets — fall back to vote log
    // This happens at F5/F4 when alliances have dissolved and everyone is a free agent
    const _fallbackCounts = {};
    votingLog.forEach(v => { if (v.voted) _fallbackCounts[v.voted] = (_fallbackCounts[v.voted] || 0) + 1; });
    const _fbSorted = Object.entries(_fallbackCounts).filter(([n]) => n && n !== 'null').sort(([,a],[,b]) => b - a);
    if (_fbSorted.length) {
      html += `<div class="rp-vp-section-label">GOING INTO TRIBAL</div>
        <div style="text-align:center;font-size:11px;color:#8b949e;margin-bottom:8px;font-style:italic">No clear consensus — everyone is playing for themselves.</div>
        <div class="rp-vp-final-row">`;
      _fbSorted.slice(0, 2).forEach(([name, count], i) => {
        const _fbCat = targetCategory(name);
        html += `<div class="rp-vp-final-card" style="border-color:${i === 0 ? _fbCat.color : '#30363d66'}">
          <div class="rp-vp-final-label" style="color:${i === 0 ? _fbCat.color : '#484f58'}">${i === 0 ? 'Most Likely Target' : count === 1 ? 'Lone Vote' : 'Also Targeted'}</div>
          ${rpPortrait(name)}
          <div class="rp-vp-final-name">${name}</div>
          <div class="rp-vp-final-cat" style="color:${_fbCat.color}">${_fbCat.label}</div>
          <div class="rp-vp-final-votes">${count} vote${count !== 1 ? 's' : ''} going in</div>
        </div>`;
      });
      html += `</div>`;
    }
  }

  // ── ADVANTAGES IN PLAY ──────────────────────────────────────────────────────
  const snapAdvantages = ep.advantagesPreTribal || ep.gsSnapshot?.advantages || [];
  const tribalSet = new Set(tribalPlayers);
  const relevantAdvantages = snapAdvantages.filter(a => tribalSet.has(a.holder) && a.holder !== immunity);
  const idolHolders = relevantAdvantages
    .filter(a => ['idol','beware'].includes(a.type))
    .map(a => a.holder);
  const otherAdvantages = relevantAdvantages.filter(a => !['idol','beware'].includes(a.type));

  if (idolHolders.length || otherAdvantages.length) {
    html += `<div class="rp-vp-section-label">ADVANTAGES IN PLAY</div>`;
    if (idolHolders.length) {
      html += `<div class="rp-vp-idol-warn">
        <span class="rp-vp-idol-badge">Idol in Play</span>
        ${idolHolders.map(h => rpPortrait(h)).join('')}
        <span>${idolHolders.join(', ')} hold${idolHolders.length === 1 ? 's' : ''} a Hidden Immunity Idol. An idol play tonight could change everything.</span>
      </div>`;
    }
    otherAdvantages.forEach(adv => {
      const typeLabels = { extraVote: 'Extra Vote', voteSteal: 'Vote Steal', legacy: 'Legacy Advantage', amulet: 'Amulet', kip: 'Knowledge is Power', secondLife: 'Second Life', teamSwap: 'Team Swap', voteBlock: 'Vote Block', safetyNoPower: 'Safety Without Power', soleVote: 'Sole Vote' };
      const advLabel = typeLabels[adv.type] || adv.type;
      html += `<div style="display:flex;align-items:center;gap:10px;padding:8px 12px;background:rgba(130,80,223,0.06);border:1px solid rgba(130,80,223,0.15);border-radius:8px;margin-bottom:4px">
        ${rpPortrait(adv.holder, 'sm')}
        <div>
          <div style="font-size:12px;font-weight:600;color:#a78bfa">${adv.holder} \u2014 ${advLabel}</div>
          <div style="font-size:10px;color:#8b949e">Could be played tonight</div>
        </div>
      </div>`;
    });
  }

  // ── KEY CONFESSIONALS ───────────────────────────────────────────────────────
  // Source from alliance spearheaders + conflicted players + independents with solo targets
  const confCast = [];
  // Spearheaders from each named alliance
  namedAlliances.forEach(a => {
    const spear = allianceSpear(a.members);
    if (spear) confCast.push({ name: spear, role: 'spearheader', target: a.target });
  });
  // Conflicted players
  conflictedPlayers.forEach(({ player }) => {
    confCast.push({ name: player, role: 'conflicted', target: null });
  });
  // Independent players with a target
  trueIndependents.forEach(player => {
    const soloA = soloAlliances.find(a => a.members.includes(player));
    if (soloA?.target) confCast.push({ name: player, role: 'independent', target: soloA.target });
  });
  // Dedupe
  const _confSeen = new Set();
  const confCastUnique = confCast.filter(c => {
    if (_confSeen.has(c.name)) return false;
    _confSeen.add(c.name);
    return true;
  });

  if (confCastUnique.length) {
    html += `<div class="rp-vp-section-label">KEY CONFESSIONALS</div><div class="rp-vp-confs">`;
    confCastUnique.forEach(({ name, role, target }) => {
      let line = null;
      if (role === 'spearheader' && target) {
        line = targetWhyPhrase(target, name);
      } else if (role === 'conflicted') {
        const myAlliances = namedAlliances.filter(a => a.members.includes(name));
        if (myAlliances.length >= 2) {
          const _aNames = myAlliances.map(a => a.label).join(', ');
          const _aTargets = myAlliances.map(a => a.target);
          line = _hp([
            `${_aNames} — both want my vote tonight. One is going to be disappointed. I have to make sure it's the one I can recover from.`,
            `${myAlliances[0].label} says ${_aTargets[0]}. ${myAlliances[1].label} says ${_aTargets[1]}. One vote. Neither answer is free.`,
            `Everyone thinks they have me. The truth is, nobody does. Not fully. Tonight I pick a side and live with it.`,
            `I'm in the middle and I know it. The question isn't who I vote for — it's who I can afford to disappoint.`,
            `${_aTargets[0]} or ${_aTargets[1]}. That's the real decision tonight. Everything else is noise.`,
            `Two plans. Two promises. I can only keep one. The person I betray tonight is someone I'll face tomorrow.`,
            `${myAlliances[0].label} built something with me. So did ${myAlliances[1].label}. One of them is about to find out which one I believed in.`,
            `I've been told ${_aTargets[0]}, I've been told ${_aTargets[1]}. Nobody asked what I think. That's the vote that matters.`,
          ], name, _aNames);
        } else {
          const bondTarget = myAlliances[0]?.target;
          const _alLabel = myAlliances[0]?.label || 'the alliance';
          line = bondTarget ? _hp([
            `${_alLabel} says ${bondTarget}. My gut says something different. Writing that name isn't as easy as it should be.`,
            `I know the plan. I know what's smart. But there's a version of this where I can't write ${bondTarget}'s name.`,
            `${bondTarget} and I have something real. ${_alLabel} doesn't care about that. I have to decide if I do.`,
            `The plan is ${bondTarget}. The relationship says otherwise. One wins tonight — I'm not sure which.`,
          ], name, bondTarget) : null;
        }
      } else if (role === 'independent' && target) {
        line = targetWhyPhrase(target, name);
      }
      if (!line) {
        // Try votingLog reason as fallback
        const logEntry = votingLog.find(l => l.voter === name);
        if (logEntry?.reason) line = reasonToConf(logEntry.reason);
      }
      if (!line) return;

      const roleLabel = role === 'spearheader'
        ? `<span class="rp-vp-conf-role">Spearheader</span>`
        : role === 'conflicted'
          ? `<span class="rp-vp-conf-role swing">Conflicted</span>`
          : `<span class="rp-vp-conf-role" style="color:#388bfd">Independent</span>`;
      html += `<div class="rp-vp-conf-entry">
        ${rpPortrait(name)}
        <div class="rp-vp-conf-body">
          <div class="rp-vp-conf-name">${name} ${roleLabel}</div>
          <div class="rp-vp-conf-text">\u201c${line}\u201d</div>
        </div>
      </div>`;
    });
    html += `</div>`;
  }

  // ── Penalty vote note ──
  if (_penaltyVotes.length) {
    _penaltyVotes.forEach(pv => {
      html += `<div style="font-size:11px;color:#8b949e;text-align:center;margin:8px 0 0;padding:8px 12px;border:1px solid #30363d;border-radius:6px;background:rgba(48,54,61,0.3)">
        <span style="font-weight:700;color:#d29922;letter-spacing:0.5px">PENALTY VOTE</span>&ensp;A pre-cast vote against <strong style="color:#cdd9e5">${pv.voted}</strong> is locked in before tribal begins.
      </div>`;
    });
  }

  html += `</div>`;
  return html;
}

// ── Tribal Council helpers ──
export function _tcnh(a, b) {
  return [...(String(a)+String(b))].reduce((s,c) => s + c.charCodeAt(0), 0);
}

export function buildTribalQA(ep, tribal) {
  const hostName = seasonConfig.host || 'Chris';
  const vlog = ep.votingLog || [];
  const alliances = ep.alliances || [];
  const voteCounts = {};
  vlog.forEach(v => { if (v.voted) voteCounts[v.voted] = (voteCounts[v.voted]||0)+1; });
  const topTarget = Object.entries(voteCounts).sort(([,a],[,b])=>b-a)[0]?.[0];
  const secondTarget = Object.entries(voteCounts).sort(([,a],[,b])=>b-a)[1]?.[0];

  const mainBloc = alliances
    .filter(a => a.type !== 'solo' && a.members?.length >= 2)
    .sort((a,b) => (b.members?.length||0) - (a.members?.length||0))[0];
  const spear = mainBloc?.members?.find(m => m !== topTarget && tribal.includes(m));

  const swingVoter = vlog.find(v => {
    const s = pStats(v.voter);
    return v.voter !== topTarget && v.voter !== spear && (s.loyalty <= 4 || s.boldness >= 8);
  })?.voter;

  // Immunity winner at this tribal (post-merge individual)
  const immune = ep.immunityWinner && tribal.includes(ep.immunityWinner) ? ep.immunityWinner : null;

  // Showmance pair at tribal
  const showmancePair = (gs.showmances || []).find(sh =>
    sh.phase !== 'broken-up' && sh.players.every(p => tribal.includes(p))
  );

  const qa = [];

  // ── Exchange 1: To the top target ──────────────────────────────────────
  if (topTarget && tribal.includes(topTarget)) {
    const s = pStats(topTarget);
    const arch = players.find(p=>p.name===topTarget)?.archetype||'';
    const h = _tcnh(topTarget, ep.num);
    const questions = s.strategic >= 8
      ? [`${hostName} studies the group, then settles on ${topTarget}. "You've been in the middle of every conversation this week. Does that help you or hurt you tonight?"`,
         `${hostName} looks at ${topTarget}. "You're not the type to sit still out here. Is all that movement a liability right now?"`]
      : s.social >= 7
      ? [`${hostName} nods at ${topTarget}. "You've made connections with almost everyone here. Does that make you safe — or does it make you a threat?"`,
         `${hostName} turns to ${topTarget}. "You've played this game with your heart. Is that going to be enough tonight?"`]
      : [`${hostName} leans forward toward ${topTarget}. "I want to ask you directly — how are you feeling right now?"`,
         `${hostName} watches ${topTarget} for a beat. "You've been in a tough spot more than once. How is tonight different?"`];
    const q = questions[h % questions.length];
    let ans, consequence, consequenceType;
    if (arch === 'mastermind' || arch === 'schemer' || s.strategic >= 8) {
      ans = [`I feel exactly where I need to be. I've played clean, kept my commitments, and I'm ready for whatever comes.`,
             `Honestly? I'm not nervous. I know where the votes are. The only thing that changes tonight is whether people do what they said.`][h % 2];
      consequence = `${topTarget} gives nothing away. The composure either reassures allies or sets off alarm bells in everyone who didn't plan with them.`;
      consequenceType = 'suspicion';
    } else if (s.boldness >= 8) {
      ans = [`I'll be real — I know some people are gunning for me. I think that's the wrong call. But I'm not gonna beg.`,
             `Yeah, I think I might be in trouble. But if people want me out for playing hard, then fine. At least I played.`][h % 2];
      consequence = `The bluntness catches people off guard. ${topTarget} made their case and now they wait.`;
      consequenceType = 'read';
    } else {
      ans = [`I'm nervous, yeah. I've put in the work here. I've been loyal. I just hope that's worth something tonight.`,
             `I'm trying not to read too much into things. I think I know what's happening — I just hope I'm right.`][h % 2];
      consequence = `${topTarget} shows their hand. The vulnerability is visible — allies feel pressure to follow through, or freedom to bail.`;
      consequenceType = 'vulnerability';
    }
    qa.push({ type:'solo', player: topTarget, question: q, answer: ans, consequence, consequenceType });
  }

  // ── Exchange 2: To the spearhead ──────────────────────────────────────
  if (spear && tribal.includes(spear)) {
    const s = pStats(spear);
    const arch = players.find(p=>p.name===spear)?.archetype||'';
    const h = _tcnh(spear, ep.num + 1);
    const qs = [
      `${hostName} turns to ${spear}. "There's a lot of strategy happening here. Are you driving the bus tonight, or just a passenger?"`,
      `${hostName} looks at ${spear}. "You've been one of the more vocal voices about the direction of this game. Is tonight going the way you planned?"`,
      `${hostName} asks ${spear} point blank: "If tonight's vote goes sideways — and it might — how much of that lands on you?"`,
    ];
    const question = qs[h % qs.length];
    let ans, consequence;
    if (arch === 'mastermind' || arch === 'schemer' || s.strategic >= 8) {
      ans = [`I've made my moves. I'm not in the driver's seat — I'm just someone who actually talks to people.`,
             `Plans change. What matters is whether you've done the work before tonight. I have.`][h % 2];
      consequence = `${spear} deflects cleanly. But the tribe just named them the chess player — and everyone heard it.`;
    } else if (arch === 'hothead' || s.boldness >= 8) {
      ans = [`I'm not going to pretend I haven't had influence. Yeah, I know what's happening. And I'll tell you — it's the right call.`,
             `Look, I pushed for this vote. I think it's the move. If I'm wrong, I'll own it.`][h % 2];
      consequence = `${spear} says more than they needed to. Their target now knows exactly who pulled the trigger.`;
    } else {
      ans = [`I feel good about where I stand. I've had honest conversations and I'm trusting that.`,
             `Tonight feels right. I don't want to overthink it.`][h % 2];
      consequence = `Careful and unmemorable. But everyone in this tribe knows who's aligned with who.`;
    }
    qa.push({ type:'solo', player: spear, question, answer: ans, consequence, consequenceType: 'control' });
  }

  // ── Exchange 3: Swing voter / wildcard ───────────────────────────────
  if (swingVoter && tribal.includes(swingVoter)) {
    const s = pStats(swingVoter);
    const h = _tcnh(swingVoter, ep.num + 2);
    const isSwing = vlog.some(v => v.voter === swingVoter && v.voted === topTarget)
      && alliances.some(a => a.members?.includes(swingVoter) && a.target !== topTarget);
    const qs = isSwing
      ? [`${hostName} focuses on ${swingVoter}. "You've been described as unpredictable this week. Is that fair?"`,
         `${hostName} pauses on ${swingVoter}. "If I'm reading the room right, you've been pulled in a couple directions. Where do you actually land tonight?"`]
      : [`${hostName} asks ${swingVoter} directly: "Does tonight feel like a game move to you, or does it feel personal?"`,
         `${hostName} checks in with ${swingVoter}. "How has this week changed your read on this tribe?"`];
    const question = qs[h % qs.length];
    let ans, consequence;
    if (isSwing) {
      ans = s.strategic >= 7
        ? [`I know what I'm doing. People read hesitation as confusion. It's not.`,
           `I've made my decision. And I'll stand behind it.`][h % 2]
        : [`There's been a lot of noise this week. I'm just trying to make the vote I can live with.`,
           `It's harder than it looks on paper. But I know where I'm going.`][h % 2];
      consequence = s.strategic < 7
        ? `The uncertainty is visible. Both sides still think they have ${swingVoter}. One of them is wrong.`
        : `${swingVoter} keeps their cards close. Protection — or exactly what people are afraid of.`;
    } else {
      ans = s.temperament <= 4
        ? [`Both. I'm not going to pretend everything is purely strategic out here. Some things stick with you.`,
           `Game, mostly. But I'd be lying if I said some of this isn't personal.`][h % 2]
        : [`Game, always. I've tried to keep the emotion out of it. Tonight is no different.`,
           `It's strategy. If it feels personal to someone, that's on them.`][h % 2];
      consequence = s.temperament <= 4
        ? `The personal admission lands. Motive is no longer ambiguous.`
        : `${swingVoter} plays it clean. A little too clean — somebody here doesn't buy it.`;
    }
    qa.push({ type:'solo', player: swingVoter, question, answer: ans, consequence, consequenceType: isSwing ? 'uncertainty' : 'motive' });
  }

  // ── Exchange 4: Immunity winner (post-merge only) ────────────────────
  if (immune && immune !== topTarget && immune !== spear) {
    const s = pStats(immune);
    const h = _tcnh(immune, ep.num + 3);
    const qs = [
      `${hostName} glances at the immunity necklace around ${immune}'s neck. "You're safe tonight. Does that change how you approach this vote?"`,
      `${hostName} turns to ${immune}. "You don't have to worry about your own torch right now. What are you thinking about instead?"`,
      `${hostName} looks at ${immune}. "Winning immunity takes the pressure off. But does it also take you out of control of what happens?"`,
    ];
    const question = qs[h % qs.length];
    let ans, consequence;
    if (s.strategic >= 8) {
      ans = [`Being safe means I can play this vote exactly how I want to. And I know exactly how I want to play it.`,
             `It changes things. When you're not fighting for your life, you can focus on the bigger picture.`][h % 2];
      consequence = `${immune} signals they have influence tonight. Everyone in danger starts wondering who they're aligned with.`;
    } else if (s.social >= 8) {
      ans = [`Honestly, I feel more stressed. Everyone's going to come to me wanting something, and I care about everyone here.`,
             `I feel for whoever's in trouble tonight. I've been there. I just want to make sure the right thing happens.`][h % 2];
      consequence = `${immune}'s empathy is real — and several people will be reading it for hints about the vote.`;
    } else {
      ans = [`I'm just relieved. I'm going to stay out of the way and let tonight play out.`,
             `It's a good feeling. I'll sit on it and try not to mess anything up.`][h % 2];
      consequence = `A low-key answer from someone holding real power. The tribe takes it at face value — or doesn't.`;
    }
    qa.push({ type:'solo', player: immune, question, answer: ans, consequence, consequenceType: 'control' });
  }

  // ── Exchange 5: Group confrontation between target and spear ─────────
  if (topTarget && spear && tribal.includes(topTarget) && tribal.includes(spear)) {
    const sT = pStats(topTarget);
    const sS = pStats(spear);
    // Only fire if target is bold enough to push back, and we haven't maxed out exchanges
    if ((sT.boldness >= 7 || sS.boldness >= 8) && qa.length < 5) {
      const h = _tcnh(topTarget + spear, ep.num + 4);
      const qs = [
        `${hostName} leans back, scanning the fire. "There's clearly something unspoken between some of you. Anyone want to put it on the table?"`,
        `${hostName} studies the group for a long moment. "${topTarget}, ${spear} — there's tension there. Are you two actually okay?"`,
        `${hostName} smiles. "Every tribal has one moment where the real game shows up. I feel like we're about to have that moment. ${topTarget}?"`,
      ];
      const question = qs[h % qs.length];
      // Target speaks first
      const targetLines = sT.boldness >= 8
        ? [`I think some people in this tribe have been playing a game with me that I didn't agree to. And they know who they are.`,
           `Look, I'll be direct — ${spear} has been running this vote. I'm not going to pretend otherwise.`,
           `The people I trusted made a decision without me. I hope it works out for them.`]
        : [`I think the tribe has a clear idea of what the right move is. Whether they make it is a different question.`,
           `I'm going to trust the relationships I've built. Either they hold or they don't.`];
      const targetLine = targetLines[h % targetLines.length];
      // Spear reacts
      const spearLines = sS.boldness >= 8 || sS.strategic >= 8
        ? [`That's the thing about ${topTarget} — always making it about personalities when it's really just strategy.`,
           `I think ${topTarget} is a smart player. That's exactly why we're having this conversation.`,
           `I respect ${topTarget}'s game. I just respect the game more.`]
        : [`I don't have anything to say to that. Tonight will speak for itself.`,
           `We're all here to compete. Whatever ${topTarget} thinks, the vote will be honest.`];
      const spearLine = spearLines[h % spearLines.length];
      const consequence = `The confrontation is out. The tribe absorbs it — some shifting, some very still. The air has changed.`;
      qa.push({
        type: 'group',
        question,
        exchanges: [
          { player: topTarget, line: targetLine },
          { player: spear, line: spearLine },
        ],
        consequence,
        consequenceType: 'confrontation',
      });
    }
  }

  // ── Exchange 6: Showmance pair ────────────────────────────────────────
  if (showmancePair && qa.length < 5) {
    const [pA, pB] = showmancePair.players;
    const h = _tcnh(pA + pB, ep.num + 5);
    const question = [
      `${hostName} looks between ${pA} and ${pB}. "You two have been close out here. Does that protect you both — or make you both a target?"`,
      `${hostName} addresses the tribe. "${pA} and ${pB} — you've been attached at the hip. How does that dynamic factor into tonight?"`,
    ][h % 2];
    const sA = pStats(pA);
    const lineA = sA.strategic >= 7
      ? [`We're individuals. We care about each other, but tonight's vote is separate from that.`,
         `I won't deny there's a bond there. But I'm here to play. So is ${pB}.`][h % 2]
      : [`I trust ${pB} completely. And I think that trust is real — on both sides.`,
         `We're in this together. I don't see that as a weakness.`][h % 2];
    const sB = pStats(pB);
    const lineB = sB.boldness >= 7
      ? [`People have been trying to use us against each other since day one. It hasn't worked.`,
         `Let them think it's a liability. I know what it actually is.`][h % 2]
      : [`${pA} and I are close. That's not going to change.`,
         `There's real trust between us. I'm proud of that.`][h % 2];
    const consequence = `The pair holds their ground. But the tribe just had the thought out loud — and it won't leave.`;
    qa.push({
      type: 'group',
      question,
      exchanges: [
        { player: pA, line: lineA },
        { player: pB, line: lineB },
      ],
      consequence,
      consequenceType: 'suspicion',
    });
  }

  // ── Exchange 7: "Open floor" moment — anyone with boldness >= 9 speaks up ──
  const loudmouth = tribal.find(n =>
    n !== topTarget && n !== spear && pStats(n).boldness >= 9 &&
    !qa.some(q => q.player === n || q.exchanges?.some(e => e.player === n))
  );
  if (loudmouth && qa.length < 5) {
    const s = pStats(loudmouth);
    const arch = players.find(p=>p.name===loudmouth)?.archetype||'';
    const h = _tcnh(loudmouth, ep.num + 6);
    const question = `${hostName} opens the floor. "Before we vote — anyone have something they want to say?"`;
    const lines = arch === 'hothead' || arch === 'chaos-agent'
      ? [`Yeah. I'll say what nobody else will. This tribe has been too passive. Tonight should be a wake-up call.`,
         `I just want to go on record — the safe play tonight is NOT the right play. Someone's going to regret this.`,
         `I don't care who hears it. The people running this game right now? They won't let anyone else get to the end.`]
      : arch === 'schemer' || arch === 'mastermind'
      ? [`I'll just say — not everything tonight is what it appears to be. People should think carefully.`,
         `The votes are going somewhere. I just want everyone to be honest about whether they actually believe in the plan.`]
      : [`I do. I want everyone here to know I came to play, I've given this everything, and I'm not done yet.`,
         `Just that I'm grateful for the people I've connected with out here. Whatever happens tonight — it's been real.`];
    const line = lines[h % lines.length];
    const consequence = s.boldness >= 9
      ? `${loudmouth} puts something in the air that wasn't there before. A few people adjust their grip on the vote.`
      : `The declaration lands. The tribe listens, but nobody flinches.`;
    qa.push({ type:'solo', player: loudmouth, question, answer: line, consequence, consequenceType: 'read' });
  }

  return qa;
}

export function buildCrashout(ep) {
  const elim = ep.eliminated;
  if (!elim || elim === 'No elimination') return null;
  const p = players.find(x => x.name === elim);
  if (!p) return null;
  const s = pStats(elim);
  if (s.boldness < 7) return null;
  const roll = ([...elim].reduce((a,c) => a+c.charCodeAt(0), 0) + ep.num * 17) % 100;
  const threshold = s.boldness >= 9 ? 50 : s.boldness >= 8 ? 38 : 25;
  if (roll >= threshold) return null;

  const reveals = [];
  const alliances = ep.alliances || [];

  const againstBloc = alliances.find(a => a.target === elim && a.type !== 'solo' && a.members?.length);
  if (againstBloc) {
    const spearheader = againstBloc.members[0];
    const h = ([...(spearheader+elim)].reduce((a,c) => a+c.charCodeAt(0), 0)) % 3;
    const quotes = [
      `${spearheader}, you built this vote and smiled in my face every single day. I want the jury to remember that.`,
      `You wanna know who's actually running this game? Look at ${spearheader}. ${againstBloc.label ? againstBloc.label + ' did this' : 'That alliance did this'}, and they'll do it to whoever's next.`,
      `${spearheader} — you orchestrated this. Fine. But when you're sitting at that fire at the end, the jury is going to ask when you started lying. We both know the answer.`,
    ];
    reveals.push({
      type: 'callout',
      text: quotes[h],
      consequence: `${spearheader}'s strategic role now undeniably public — the jury heard it from someone with nothing left to lose.`,
    });
  }

  const theirAlliance = alliances.find(a => a.members?.includes(elim) && a.type !== 'solo' && a.members.length > 1);
  if (theirAlliance && reveals.length < 2) {
    const others = theirAlliance.members.filter(m => m !== elim && gs.activePlayers.includes(m));
    if (others.length) {
      const h = ([...(elim + ep.num)].reduce((a,c) => a+c.charCodeAt(0), 0)) % 2;
      const quotes = [
        `${others.join(', ')} — you're on your own now. I hope it was worth it.`,
        `You want to know what ${theirAlliance.label || 'that alliance'} actually is? It's ${others.join(', ')}. Write that down.`,
      ];
      reveals.push({
        type: 'alliance',
        text: quotes[h],
        consequence: `${theirAlliance.label || 'Alliance'} composition now public. Those members will feel the pressure next episode.`,
      });
    }
  }

  if (ep.idolPlays?.length && reveals.length < 2) {
    const idolPlayer = ep.idolPlays[0].player;
    if (idolPlayer !== elim) {
      const h = ([...elim].reduce((a,c) => a+c.charCodeAt(0), 0) + 3) % 2;
      const quotes = [
        `Oh — and ${idolPlayer}? They've been sitting on an advantage for weeks. Ask them about it.`,
        `Everyone's so focused on who's leaving — nobody's asking why ${idolPlayer} is still here and what they're carrying.`,
      ];
      reveals.push({
        type: 'idol',
        text: quotes[h],
        consequence: `${idolPlayer}'s advantage history flagged publicly. Their target level increases next episode.`,
      });
    }
  }

  if (!reveals.length) {
    const h = ([...elim].reduce((a,c) => a+c.charCodeAt(0), 0) + ep.num) % 3;
    const generic = [
      `I hope everyone out here is proud of the game they're playing. Because some of you should be embarrassed.`,
      `You'll all regret this. Not tonight — but at some point out here, you'll wish you'd made a different call.`,
      `Good luck to everyone who deserves it. And you know who that is.`,
    ];
    reveals.push({ type: 'exit', text: generic[h], consequence: `Parting words. The jury is watching.` });
  }

  return { player: elim, boldness: s.boldness, reveals: reveals.slice(0, 2) };
}

// ── Screen 4: Tribal Council ──
export function rpBuildTribal(ep) {
  const tribalTribeName = ep.tribalTribe || (gs.tribes.length === 1 ? gs.tribes[0]?.name : 'Merged');
  // tribalPlayers: use saved value, or reconstruct from tribesAtStart snapshot (for old history entries),
  // or fall back to all active players (post-merge or edge case)
  const tribal = ep.tribalPlayers
    || (ep.tribalTribe && ep.tribesAtStart?.find(t => t.name === ep.tribalTribe)?.members)
    || (ep.tribalTribe ? null : gs.activePlayers)
    || gs.activePlayers;
  const tc = tribeColor(tribalTribeName);
  const vlog = ep.votingLog || [];

  // Vote counts for danger board
  const voteCounts = {};
  vlog.forEach(({ voted }) => { if (voted) voteCounts[voted] = (voteCounts[voted]||0)+1; });
  const dangerSorted = Object.entries(voteCounts)
    .filter(([n]) => tribal.includes(n))
    .sort(([,a],[,b]) => b-a)
    .slice(0, 3);

  const dangerRankLabels = ['#1 TARGET', '#2 TARGET', '#3 WATCH'];
  const dangerColors = ['#f85149', '#d29922', '#8b949e'];

  const seatPlayers = tribal;
  let html = `<div class="rp-page tod-night" style="position:relative;overflow:hidden">`;
  html += `<div style="position:absolute;inset:0;background:radial-gradient(ellipse at 50% 100%, rgba(232,135,58,0.15), transparent 70%);pointer-events:none;animation:torchFlicker 3.5s ease-in-out infinite alternate"></div>`;
  html += `<div class="rp-eyebrow">Episode ${ep.num}</div>`;
  html += `<div style="font-family:var(--font-display);font-size:48px;letter-spacing:2px;text-align:center;text-shadow:0 0 24px #e8873a,0 0 8px rgba(232,135,58,0.5);margin-bottom:8px">TRIBAL COUNCIL</div>`;
  html += `<div class="rp-tribe">
      <div class="rp-tribe-head" style="color:${tc};border-color:${tc}">${tribalTribeName}</div>
      <div class="rp-portrait-row" style="justify-content:center;${seatPlayers.length >= 8 ? 'gap:6px;' : ''}">
        ${seatPlayers.map((n, i) => {
          const isOuter = i === 0 || i === 1 || i === seatPlayers.length - 1 || i === seatPlayers.length - 2;
          const arcOffset = isOuter ? 'transform:translateY(6px)' : '';
          return `<div class="vp-stump-wrap" style="${arcOffset};animation:staggerIn 0.4s var(--ease-broadcast) ${i * 60}ms both">
            ${rpPortrait(n)}
            <div class="vp-stump"></div>
          </div>`;
        }).join('')}
      </div>
    </div>`;
  // Mood indicators
  const _moodColor = {
    content:     '#6ee7b7', // soft mint — genuinely fine
    comfortable: '#10b981', // green — complacent blind spot
    confident:   'var(--accent-ice)',
    calculating: '#a78bfa', // purple — scheming
    uneasy:      '#fbbf24', // amber — something's off
    paranoid:    'var(--accent-fire)',
    desperate:   '#c0392b',
  };
  html += `<div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin:12px 0">`;
  seatPlayers.forEach(n => {
    const _state = ep.gsSnapshot?.playerStates?.[n]?.emotional || 'content';
    html += `<span style="font-size:10px;padding:2px 8px;border-radius:10px;border:1px solid ${_moodColor[_state]||'var(--border)'};color:${_moodColor[_state]||'var(--muted)'}">${n}: ${_state}</span>`;
  });
  html += `</div>`;

  // Advantages in play teaser
  const idolHolders = (ep.idolPlays||[]).map(i => i.player);
  const sitdUser = ep.shotInDark?.player;
  if (idolHolders.length || sitdUser) {
    const lines = [];
    if (idolHolders.length) lines.push(`${idolHolders.join(' and ')} entered tribal with ${idolHolders.length > 1 ? 'idols' : 'an idol'} in their pocket.`);
    if (sitdUser) lines.push(`${sitdUser} is weighing whether to play a Shot in the Dark.`);
    html += `<div class="tc-adv-teaser">
      <div class="tc-adv-badge">ADVANTAGES</div>
      <div class="tc-adv-text">${lines.join(' ')}</div>
    </div>`;
  }

  // Danger board
  if (dangerSorted.length) {
    // Vague reason pool — used when the board deliberately obscures the real read
    const _vagueReasons = [
      "Something shifted at camp today. The tribe went quiet.",
      "Nobody said the name out loud. They didn't have to.",
      "The tribe has a feeling going in. Those tend to be right.",
      "Hard to explain. It just feels like tonight.",
      "Camp dynamics have been building to this for a while.",
      "There's a read on this person. Whether it holds is another question.",
      "The numbers had somewhere to go. They may land here.",
      "The tribe isn't saying much. That's usually a sign.",
    ];
    // Vote heat labels — less explicit than raw counts
    const _heatLabel = (count) => {
      if (count >= 5) return 'Heavy heat going in';
      if (count >= 4) return 'The writing is on the wall';
      if (count >= 3) return 'Numbers are pointing here';
      if (count >= 2) return 'The tribe is watching';
      return 'Floated as a possibility';
    };
    html += `<div class="rp-vp-section-label">WORD AT CAMP</div>
    <div class="tc-danger-board">`;
    dangerSorted.forEach(([name, count], i) => {
      const col = dangerColors[i] || '#8b949e';
      const lbl = dangerRankLabels[i] || '#3 WATCH';
      const s = pStats(name);
      const arch = players.find(p => p.name === name)?.archetype || '';
      // Real reason based on stats/alliances
      let realReason = '';
      if (s.strategic >= 8) realReason = 'Strategic threat — hard to beat at FTC.';
      else if ((s.physical + s.endurance) / 2 >= 8) realReason = 'Challenge dominance — can\'t let them run.';
      else if (s.social >= 8) realReason = 'Too well-liked. Every vote they survive gets harder.';
      else if (s.loyalty <= 3) realReason = 'A known flipper. No one trusts the vote will hold.';
      else if (arch === 'goat') realReason = 'Easy vote. Numbers aligned with little debate.';
      else {
        const bloc = (ep.alliances||[]).find(a => a.target === name && a.type !== 'solo');
        realReason = bloc ? `${bloc.label} made the call.` : 'Threat assessment and numbers converged here.';
      }
      // Vague chance by rank: #1=25%, #2=45%, #3=65% — deterministic per player+episode
      const _h = ([...name].reduce((a,c)=>a+c.charCodeAt(0),0) + ep.num * 17 + i * 7) % 100;
      const _vagueThreshold = i === 0 ? 25 : i === 1 ? 45 : 65;
      const reason = _h < _vagueThreshold
        ? _vagueReasons[_h % _vagueReasons.length]
        : realReason;
      html += `<div class="tc-danger-card" style="border-color:${col}22;background:linear-gradient(145deg,${col}09 0%,transparent 65%)">
        <div class="tc-danger-rank" style="color:${col}">${lbl}</div>
        ${rpPortrait(name, 'xl')}
        <div class="tc-danger-name">${name}</div>
        <div class="tc-danger-reason">${reason}</div>
        <div class="tc-danger-votes" style="color:${col}">${_heatLabel(count)}</div>
      </div>`;
    });
    html += `</div>`;
  }

  // Q&A at tribal
  const qa = buildTribalQA(ep, tribal);
  if (qa.length) {
    const cColors = {
      suspicion: '#e3b341', uncertainty: '#e3b341', confrontation: '#f85149',
      control: '#388bfd', read: '#8b949e', vulnerability: '#8b949e', motive: '#8b949e',
    };
    // Tribal disruption event (hothead blowup that shifts the vote)
    if (ep.tribalDisruption) {
      const _td = ep.tribalDisruption;
      const _tdPr = pronouns(_td.disruptor);
      html += `<div style="margin:12px 0;padding:12px 16px;border-left:3px solid ${_td.helped ? 'var(--accent-gold)' : 'var(--accent-fire)'};background:${_td.helped ? 'rgba(227,179,65,0.05)' : 'rgba(218,54,51,0.05)'};border-radius:0 8px 8px 0">
        <div style="font-size:9px;font-weight:800;letter-spacing:1.5px;color:${_td.helped ? '#e3b341' : '#f85149'};margin-bottom:6px">${_td.helped ? 'TRIBAL DISRUPTION — BACKFIRED ON THE TRIBE' : 'TRIBAL DISRUPTION — BACKFIRED ON THE DISRUPTOR'}</div>
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
          ${rpPortrait(_td.disruptor, 'sm')}
          ${rpPortrait(_td.organizer, 'sm')}
        </div>
        <div style="font-size:12px;color:#cdd9e5;line-height:1.6">${_td.helped
          ? `${_td.disruptor} erupted at tribal, calling out ${_td.organizer} in front of everyone. The outburst was raw — but it made the tribe reconsider. ${_td.organizer}'s plan is exposed.`
          : `${_td.disruptor} lost ${_tdPr.posAdj} composure at tribal, confronting ${_td.organizer} publicly. The explosion confirmed what people suspected — ${_td.disruptor} is too volatile to keep around.`
        }</div>
      </div>`;
    }
    html += `<div class="rp-vp-section-label">AT TRIBAL COUNCIL</div>
    <div class="tc-qa-section">`;
    qa.forEach(item => {
      const cCol = cColors[item.consequenceType] || '#484f58';
      if (item.type === 'group') {
        html += `<div class="tc-qa-exchange">
          <div class="tc-qa-q">${item.question}</div>
          ${item.exchanges.map(({ player, line }) => `
          <div class="tc-qa-player">
            ${rpPortrait(player, 'sm')}
            <div class="tc-qa-answer">"${line}"</div>
          </div>`).join('')}
          <div class="tc-qa-consequence" style="background:${cCol}0f;color:${cCol}cc">↳ ${item.consequence}</div>
        </div>`;
      } else {
        html += `<div class="tc-qa-exchange">
          <div class="tc-qa-q">${item.question}</div>
          <div class="tc-qa-player">
            ${rpPortrait(item.player, 'sm')}
            <div class="tc-qa-answer">"${item.answer}"</div>
          </div>
          <div class="tc-qa-consequence" style="background:${cCol}0f;color:${cCol}cc">↳ ${item.consequence}</div>
        </div>`;
      }
    });
    html += `</div>`;
  }

  // Overplaying notice
  if (ep.overplayer) {
    const ovp = ep.overplayer;
    const _ovpFlippedStr = ovp.votersFlipped.join(' and ');
    const _ovpDescIdx = ([...ovp.player].reduce((a,c)=>a+c.charCodeAt(0),0) + ep.num * 11) % 3;
    const _ovpDesc = [
      `${ovp.player} was seen pulling ${_ovpFlippedStr} aside moments before the vote — side deals, last-second promises, working every angle. The whole camp clocked the scramble. ${_ovpFlippedStr} had enough and switched.`,
      `${ovp.player} couldn't stop working the room. Whispers to ${_ovpFlippedStr}, a pitch to anyone who'd listen, too many promises made too loudly. ${_ovpFlippedStr} noticed and flipped. Sometimes the move that's supposed to save you is the one that sinks you.`,
      `Everyone watched ${ovp.player} go from person to person at tribal — cornered ${_ovpFlippedStr}, tried to flip the vote at the last second, got loud about it. ${_ovpFlippedStr} looked at each other and changed their vote.`
    ][_ovpDescIdx];
    html += `<div style="background:rgba(248,81,73,0.05);border:1px solid rgba(248,81,73,0.18);border-radius:10px;padding:14px 16px;margin-bottom:16px">
      <div style="font-size:9px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:#f85149;margin-bottom:8px">OVERPLAYING</div>
      <div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:8px">
        ${rpPortrait(ovp.player, 'sm')}
        <div style="font-size:12px;color:#e6edf3;line-height:1.5">${_ovpDesc}</div>
      </div>
      <div style="font-size:11px;color:#f85149cc">↳ ${ovp.votesRedirected} vote${ovp.votesRedirected !== 1 ? 's' : ''} flipped from ${ovp.originalTarget} onto ${ovp.player}.</div>
    </div>`;
  }

  // Comfort blindside flag: player was spotted checked out earlier this episode, didn't see it coming
  if (ep.comfortBlindspotPlayer && ep.comfortBlindspotPlayer === ep.eliminated) {
    const _cbP = pronouns(ep.comfortBlindspotPlayer);
    const _cbS = _cbP.sub === 'they';
    html += `<div style="background:rgba(227,179,65,0.06);border:1px solid rgba(227,179,65,0.25);border-radius:10px;padding:14px 16px;margin-bottom:16px">
      <div style="font-size:9px;font-weight:800;letter-spacing:2px;text-transform:uppercase;color:#e3b341;margin-bottom:8px">\u2b50 COMFORT BLINDSIDE</div>
      <div style="display:flex;align-items:flex-start;gap:10px">
        ${rpPortrait(ep.comfortBlindspotPlayer, 'sm')}
        <div style="font-size:12px;color:#e6edf3;line-height:1.5">${ep.comfortBlindspotPlayer} ${_cbS ? 'were' : 'was'} flagged as checked out earlier in the episode — someone noticed ${_cbP.sub} ${_cbS ? "weren't" : "wasn't"} paying attention. The signal was there. ${_cbP.Sub} didn't see it coming.</div>
      </div>
    </div>`;
  }

  // Comfort blindspot — player not eliminated but was seen checked out (elimination case handled above)
  if (ep.comfortBlindspotPlayer && ep.comfortBlindspotPlayer !== ep.eliminated) {
    html += `<div class="vp-card fire" style="font-size:13px;margin-top:12px">
      <strong>${ep.comfortBlindspotPlayer}</strong> was seen checked out at camp before Tribal \u2014 the tribe noticed.
    </div>`;
  }

  // ── Black Vote announcement (before the vote) ──
  if (ep.blackVoteApplied) {
    const _bva = ep.blackVoteApplied;
    html += `<div class="vp-card" style="border-color:rgba(99,102,241,0.3);background:rgba(99,102,241,0.04);margin:16px 0;padding:14px">
      <div style="font-size:9px;font-weight:700;letter-spacing:2px;color:#818cf8;margin-bottom:8px">BLACK VOTE</div>
      <div style="font-size:13px;color:#c9d1d9;line-height:1.6">"Before we vote — ${_bva.from} left a message." Chris holds up a parchment. "This is a Black Vote. ${_bva.from} has cast a vote against <strong style="color:#f85149">${_bva.target}</strong>. This vote counts tonight."</div>
      <div style="display:flex;align-items:center;gap:10px;margin-top:10px">
        ${rpPortrait(_bva.from, 'sm')}
        <span style="font-size:16px;color:#818cf8">\u2192</span>
        ${rpPortrait(_bva.target, 'sm')}
        <span style="font-size:11px;color:#8b949e;font-style:italic">${_bva.reason || ''}</span>
      </div>
    </div>`;
  }

  // Urn divider
  html += `<div class="vp-card" style="text-align:center;font-family:var(--font-mono);font-style:italic;border-color:var(--accent-fire);color:var(--muted);margin:20px 0;font-size:14px">
    \u201cThe votes have been cast.\u201d
  </div>`;

  html += `<div class="tc-continue">It's time to vote.</div>
  </div>`;
  return html;
}

// ── Shared WHY helpers (used by rpBuildVotes and rpBuildVotes2) ──
export function vpWhyBullets(name, votelog, alliances, ep) {
  if (!name) return [];
  const bullets = [];
  const es = pStats(name);
  const majVoters = (votelog||[]).filter(l => l.voted === name && l.voter !== 'THE GAME').map(l => l.voter);
  const hadAlly = (alliances||[]).find(a => a.members.includes(name) && a.type !== 'solo');
  const betrayed = hadAlly && majVoters.some(v => hadAlly.members.includes(v));
  // Did the eliminated player actually follow their alliance's plan? If they defected, don't say the alliance "stood by them"
  const _elimVote = (votelog||[]).find(l => l.voter === name)?.voted;
  const _elimFollowedPlan = hadAlly && (_elimVote === hadAlly.target || (hadAlly.splitTarget && _elimVote === hadAlly.splitTarget));
  const priorVotes = (gs.episodeHistory||[]).filter(h => h.num < ep.num)
    .reduce((n,h) => n + (h.votingLog||[]).filter(v => v.voted === name).length, 0);
  const misplay = ep.idolMisplays?.find(m => m.player === name);
  const chalWeak = challengeWeakness(name);
  const th = (es.physical + es.strategic + es.social) / 3;
  const phase = ep.gsSnapshot?.phase || gs.phase;
  const logReasons = majVoters.map(v => (votelog||[]).find(l => l.voter === v && l.voted === name)?.reason).filter(Boolean);
  const rTypes = { personal:0, challenge:0, threat:0, loyalty:0, advantage:0 };
  logReasons.forEach(r => {
    if (/amulet|legacy|inherit|upgrade|holder/i.test(r)) rTypes.advantage++;
    else if (/personal|distrust|animosity|hostility|friction|tension|dislike|rubs/i.test(r)) rTypes.personal++;
    else if (/challenge|weakest link|liability|costing/i.test(r)) rTypes.challenge++;
    else if (/threat|dangerous|puppeteer|strategic|jury|runs the game/i.test(r)) rTypes.threat++;
    else if (/loyal|committed|follows|aligned|alliance/i.test(r)) rTypes.loyalty++;
  });
  const domType = Object.entries(rTypes).sort(([,a],[,b]) => b-a)[0][0];
  // Deterministic hash for variety selection (no randomness across re-renders)
  const _wh = ([...name].reduce((a,c)=>a+c.charCodeAt(0),0) + ep.num * 31) % 100;
  const _pick = (arr) => arr[_wh % arr.length];

  if (phase === 'pre-merge' && chalWeak >= 5.5) bullets.push(`Challenge liability — ${name} was the weakest link and the tribe ran out of reasons to keep covering for it`);
  else if (phase === 'pre-merge' && domType === 'personal') bullets.push(_pick([
    `Personal tension drove this vote — bonds broke down and the tribe acted on it`,
    `This wasn't about challenges or threats. The relationships around ${name} collapsed, and the votes followed`,
    `${name} was on the wrong side of the social dynamics. The people who had issues with ${pronouns(name).obj} had the numbers`,
  ]));
  else if (phase !== 'pre-merge' && th >= 7.5) bullets.push(_pick([
    `Threat level too high to ignore (${th.toFixed(1)}/10) — someone this capable doesn't get easier to vote out later`,
    `A ${th.toFixed(1)}/10 threat at this stage of the game is a problem that compounds. The group moved while the window was still open`,
    `${name}'s game was too strong to let run to the end. Threat score doesn't lie — and the players who can read it acted on it`,
  ]));
  else if (phase !== 'pre-merge' && th >= 6 && domType === 'threat') bullets.push(_pick([
    `Identified as a long-term jury threat (${th.toFixed(1)}/10) — the group decided the window was now`,
    `Not the loudest name, but the most dangerous one to leave in the game. The group read that and acted`,
    `${name} was playing a quiet game with a loud ceiling. The people who noticed it moved before it became everyone's problem`,
  ]));
  else if (th <= 3.5 && domType === 'challenge') bullets.push(`Seen as the weakest player at this stage — no challenge value and no strategic protection`);
  else if (domType === 'personal') bullets.push(_pick([
    `Personal tension — the vote was driven by distrust and friction, not just game position`,
    `The animosity was real and predated this tribal. The game gave someone an opportunity to act on it, and they did`,
    `This wasn't purely strategic. Relationships had eroded in ways that made ${name} unavailable as an ally — and available as a target`,
  ]));
  else if (priorVotes >= 2) bullets.push(`The name had already come up before — eventually the consensus vote becomes inevitable`);
  else bullets.push(_pick([
    `Became the consensus name — the path of least resistance when the tribe needed to move someone`,
    `No single person drove this vote — the group arrived at ${name} independently and nobody pushed back hard enough to change it`,
    `${name} wasn't the most obvious target, but became the one everyone could live with. That kind of agreement is hard to stop`,
    `The vote wasn't a calculated move — it was convergence. Different people arrived at the same name for different reasons. That's enough`,
    `When a name sits at the center of a tribal with no one willing to defend it, the vote is already decided. ${name} had no real defenders tonight`,
  ]));
  if (priorVotes >= 2 && domType !== 'personal') bullets.push(`Name had been written down ${priorVotes} time${priorVotes > 1 ? 's' : ''} before — a recurring target that finally ran out of luck`);
  if (es.boldness >= 8 && es.loyalty <= 4) bullets.push(_pick([
    `Unpredictable and hard to control — bold players with no loyalty are dangerous past a certain point`,
    `${name} was a wildcard the game could no longer absorb. Bold, loose, and visible — a combination that accelerates exits`,
    `Playing loud in a game this small draws votes. ${name} knew that and kept playing loud anyway`,
  ]));
  if (es.strategic >= 8 && phase !== 'pre-merge') bullets.push(_pick([
    `Strategic read: ${name} was running things and the window to stop that was closing fast`,
    `Too many people had fingerprints on this vote that traced back to ${name}. When the puppeteer becomes visible, they become the target`,
    `${name} had been setting the agenda all game. Someone finally decided to put that on the ballot`,
  ]));
  if (es.social >= 8 && phase !== 'pre-merge') bullets.push(_pick([
    `Jury threat: built genuine relationships that would translate directly into votes at Final Tribal`,
    `The social game ${name} ran out here doesn't lose at Final Tribal. The people who recognized that moved before it was too late`,
    `Liked by everyone. That's not a compliment at this stage — it's a reason to vote someone out`,
  ]));

  // Idol play by another player this tribal (not the eliminated player) — only actual idols, not vote steals/extra votes
  const _idolPlaysThisTribal = (ep.idolPlays || []).filter(p =>
    p.player !== name && !p.type && !p.misplay // no type = regular idol play (vote steals have type:'voteSteal')
  );
  _idolPlaysThisTribal.forEach(play => {
    const _vn = play.votesNegated || 0;
    if (_vn === 0) return; // idol wasted (0 votes negated) — don't claim it "changed everything"
    const _idolTarget = play.playedFor || play.player; // who was saved (could be self or ally)
    const _playedBySelf = _idolTarget === play.player;
    bullets.push(_pick([
      `${play.player} played a Hidden Immunity Idol${_playedBySelf ? '' : ` for ${_idolTarget}`} at Tribal — ${_vn} vote${_vn !== 1 ? 's' : ''} were cancelled, and the remaining tally fell on ${name}`,
      `The idol changed everything. ${play.player} negated ${_vn} vote${_vn !== 1 ? 's' : ''} against ${_idolTarget}, redirecting the outcome entirely. ${name} had the next-highest count`,
      `${_vn} vote${_vn !== 1 ? 's' : ''} for ${_idolTarget} were wiped out by ${play.player}'s idol. ${name}'s ${majVoters.length} vote${majVoters.length !== 1 ? 's' : ''} became the plurality — and the boot`,
    ]));
  });
  // Vote miscommunication impact: someone voted the wrong name and it may have changed the result
  (ep.voteMiscommunications || []).forEach(mc => {
    if (mc.actual === name) {
      bullets.push(`${mc.voter} tried to follow ${mc.alliance}'s plan to vote ${mc.intended} — but wrote the wrong name. That misfire landed on ${name}.`);
    } else if (mc.intended === name) {
      bullets.push(`${mc.voter} was supposed to vote ${name} but miscommunicated and voted ${mc.actual} instead. One fewer vote on ${name} — the margin mattered.`);
    }
  });
  // Split vote impact: if eliminated was the secondary target and idol caught the primary
  (ep.splitVotePlans || []).forEach(sp => {
    if (sp.secondary === name) {
      const idolCaughtPrimary = (ep.idolPlays || []).some(p => (p.player === sp.primary || p.playedFor === sp.primary) && (p.votesNegated || 0) > 0);
      if (idolCaughtPrimary) {
        bullets.push(`The alliance split their votes between ${sp.primary} and ${name}. ${sp.primary} played an idol — the split worked. ${name} was the backup target and it held.`);
      } else {
        bullets.push(`The alliance split their votes — ${name} was the secondary target as insurance against an idol play on ${sp.primary}.`);
      }
    }
  });
  // Vote steal impact
  const _voteStealPlaysWhy = (ep.idolPlays || []).filter(p => p.type === 'voteSteal' && p.player !== name);
  _voteStealPlaysWhy.forEach(play => {
    bullets.push(`${play.player} stole ${play.stolenFrom}'s vote and redirected it against ${play.target || 'their target'}. The numbers shifted.`);
  });

  // Use pre-tribal advantages for accurate WHY analysis (not post-elimination state)
  const _whyAdvs = ep.advantagesPreTribal || ep.gsSnapshot?.advantages || gs.advantages || [];
  // Amulet holder eliminated — the upgrade changes the game
  const _whyAmulet = _whyAdvs.find(a => a.type === 'amulet' && a.holder === name);
  if (_whyAmulet) {
    const _remainAfter = _whyAdvs.filter(a => a.type === 'amulet' && a.holder !== name).length;
    const _nextPow = _remainAfter === 2 ? 'Vote Steal' : _remainAfter === 1 ? 'Hidden Immunity Idol' : null;
    if (_nextPow) {
      const _otherHolders = _whyAdvs.filter(a => a.type === 'amulet' && a.holder !== name).map(a => a.holder);
      bullets.push(_pick([
        `${name} was an amulet holder (${_whyAmulet.amuletPower === 'extraVote' ? 'Extra Vote' : _whyAmulet.amuletPower === 'voteSteal' ? 'Vote Steal' : _whyAmulet.amuletPower || '?'} power). With ${name} gone, the remaining holder${_remainAfter > 1 ? 's' : ''} (${_otherHolders.join(', ')}) now ${_remainAfter > 1 ? 'hold' : 'holds'} a ${_nextPow}`,
        `Eliminating an amulet holder was the move. ${_otherHolders.join(' and ')} just got more powerful — the amulet upgraded from ${_whyAmulet.amuletPower === 'extraVote' ? 'Extra Vote' : 'Vote Steal'} to ${_nextPow}`,
      ]));
    }
  }
  // Amulet holder voted out BY another holder — the betrayal
  const _whyAmuletBetrayer = majVoters.find(v => _whyAdvs.some(a => a.type === 'amulet' && a.holder === v));
  if (_whyAmulet && _whyAmuletBetrayer) {
    bullets.push(`${_whyAmuletBetrayer} — a fellow amulet holder — voted ${name} out. The shared advantage became a shared target. ${_whyAmuletBetrayer}'s amulet just got stronger`);
  }
  // Legacy holder eliminated — the inheritance
  const _whyLegacy = _whyAdvs.find(a => a.type === 'legacy' && a.holder === name);
  if (_whyLegacy) {
    const _heir = gs.legacyConfessedTo?.[name] || (ep.gsSnapshot?.activePlayers || gs.activePlayers).filter(p => p !== name).sort((a, b) => getBond(name, b) - getBond(name, a))[0];
    if (_heir) {
      bullets.push(_pick([
        `${name} held the Legacy Advantage. It will be willed to ${_heir} — the game's power structure just shifted`,
        `The Legacy Advantage transfers on elimination. ${_heir} inherits what ${name} couldn't use in time`,
      ]));
      if (gs.legacyConfessedTo?.[name] === _heir && majVoters.includes(_heir)) {
        bullets.push(`${_heir} knew about the Legacy Advantage — and voted ${name} out to inherit it. The ultimate betrayal of trust`);
      }
    }
  }
  // KiP steal impact
  const _whyKip = (ep.idolPlays || []).filter(p => p.type === 'kip');
  _whyKip.forEach(play => {
    if (play.failed) {
      bullets.push(`${play.player} used Knowledge is Power on ${play.stolenFrom} — but ${play.stolenFrom} had nothing. The advantage was wasted`);
    } else {
      bullets.push(`${play.player} used Knowledge is Power to steal ${play.stolenFrom}'s ${play.stolenType === 'idol' ? 'idol' : play.stolenType}. The balance of power shifted at tribal`);
    }
  });

  // Sole Vote: only the holder's vote counted — override the "votes that counted" line
  const _whySoleVote = (ep.idolPlays || []).find(p => p.type === 'soleVote');
  if (_whySoleVote) {
    bullets.push(`${_whySoleVote.player}'s Sole Vote was the only vote that mattered — every other voice at tribal was silenced`);
  } else if (majVoters.length) {
    bullets.push(_pick([
      `The votes that counted: ${majVoters.join(', ')}`,
      `${majVoters.length === 1 ? `${majVoters[0]} cast the deciding vote` : `${majVoters.slice(0,-1).join(', ')} and ${majVoters.at(-1)} wrote the name that stuck`}`,
      `${majVoters.join(', ')} — that's who put ${name} on the jury`,
    ]));
  }
  if (betrayed) {
    majVoters.filter(v => hadAlly.members.includes(v)).forEach(traitor => {
      const bv = getBond(traitor, name);
      const ts = pStats(traitor);
      const bc = bv <= -1.5 ? `personal — the relationship had fractured long before this vote`
               : ts.strategic >= 8 ? `cold calculation — decided ${name} was more dangerous as an ally than a target`
               : ts.loyalty <= 3 ? `was never fully committed — the flip was always a matter of when`
               : `weighed the numbers over the alliance`;
      bullets.push(`Betrayed by ${traitor} (${hadAlly.label}) — ${bc}`);
    });
  } else if (hadAlly) {
    if (_elimFollowedPlan) {
      // Eliminated player was loyal to the alliance — the alliance tried but failed
      bullets.push(_pick([
        `${hadAlly.label} voted with ${name} — but was outnumbered`,
        `${hadAlly.label} and ${name} were on the same side, but the numbers weren't there. Voting together only works if you have the majority`,
        `${hadAlly.label} voted together and still fell short. The other side had more votes`,
        `${hadAlly.label} held the line — but the opposing bloc was bigger. Being on the right side doesn't matter if the numbers aren't there`,
      ]));
    } else {
      // Eliminated player defected from their own alliance — they went rogue and paid for it
      bullets.push(_pick([
        `${name} broke from ${hadAlly.label}'s plan — went their own way instead of following the group. The numbers weren't there for a solo play`,
        `${hadAlly.label} had a plan. ${name} didn't follow it. Without the alliance's protection, the vote landed somewhere ${name} didn't expect`,
        `${name} left ${hadAlly.label}'s plan behind and paid the price. Going rogue only works if the numbers are already there`,
      ]));
    }
  }

  // Ally votes for a different target — collapse into one grouped bullet per alliance+target pair
  const _allyVotes = (votelog||[]).filter(l => {
    if (l.voted === name || l.voter === 'THE GAME') return false;
    // Voter must have a connection to the eliminated player (shared alliance OR bond)
    const sa = (alliances||[]).find(a => a.members.includes(l.voter) && a.members.includes(name));
    if (sa && sa.members.includes(l.voted)) return false;
    return sa || getBond(l.voter, name) >= 1.5;
  });
  // Group by (voterAllianceLabel, votedTarget) — use the VOTER's alliance, not shared alliance with eliminated
  const _allyGroups = {};
  _allyVotes.forEach(l => {
    const voterAlliance = (alliances||[]).find(a => a.members.includes(l.voter));
    // Only label with alliance if eliminated player is ALSO a member (truly shared alliance)
    const sharedAlliance = voterAlliance?.members.includes(name) ? voterAlliance : null;
    const key = `${sharedAlliance?.label||''}|${l.voted}`;
    if (!_allyGroups[key]) _allyGroups[key] = { voters: [], voted: l.voted, alliance: sharedAlliance };
    _allyGroups[key].voters.push(l.voter);
  });
  Object.values(_allyGroups).forEach(({ voters, voted, alliance }) => {
    const voterStr = voters.length === 1 ? voters[0]
      : voters.length === 2 ? `${voters[0]} and ${voters[1]}`
      : `${voters.slice(0,-1).join(', ')} and ${voters.at(-1)}`;
    if (alliance) {
      bullets.push(_pick([
        `${voterStr} voted ${voted} to protect the ${alliance.label} bloc — the numbers still weren't there`,
        `${alliance.label} split their effort: ${voterStr} voted ${voted}, trying to keep the alliance intact. It wasn't enough`,
        `${voterStr} (${alliance.label}) held the line on ${voted} — loyal to the plan, but outrun by the numbers`,
      ]));
    } else {
      bullets.push(`${voterStr} voted ${voted} — tried to pull numbers a different way`);
    }
  });
  if (misplay) {
    bullets.push(`Held a Hidden Immunity Idol — and never played it (${misplay.votesAgainst} vote${misplay.votesAgainst !== 1 ? 's' : ''} against, idol stayed in pocket)`);
    if (misplay.tipOffAlly) {
      const tipS = pStats(misplay.tipOffAlly);
      const _tipperRivalAlliance = (ep.gsSnapshot?.namedAlliances || []).find(a =>
        a.members.includes(misplay.tipOffAlly) && !a.members.includes(name)
      );
      if (_tipperRivalAlliance) {
        bullets.push(`${misplay.tipOffAlly} (intuition ${tipS.intuition}/10) could have warned them — but was in rival alliance ${_tipperRivalAlliance.name}. The tip-off never crossed alliance lines.`);
      } else {
        bullets.push(`${misplay.tipOffAlly} (intuition ${tipS.intuition}/10) was at Tribal and could have read the room — the warning never came.`);
      }
    }
  }
  return bullets;
}

export function vpWhyCard(name, bullets, subtitle) {
  return `<div style="display:flex;align-items:flex-start;gap:16px;margin-bottom:14px">
    ${rpPortrait(name, 'elim')}
    <div style="flex:1">
      <div style="font-size:14px;font-weight:700;color:#e6edf3;margin-bottom:8px">${subtitle}</div>
      ${bullets.map(b => `<div style="font-size:12px;color:#cdd9e5;line-height:1.7;margin-bottom:5px;display:flex;gap:8px;align-items:flex-start"><span style="color:#484f58;flex-shrink:0;margin-top:1px">&#x2014;</span><span>${b}</span></div>`).join('')}
    </div>
  </div>`;
}

// ── Screen 5: The Votes (interactive reveal) ──
export function rpBuildVotes(ep) {
  const vlog = ep.votingLog || [];
  const votes = ep.votes || {};
  const totalVotes = Object.values(votes).reduce((a,b) => a+b, 0);
  // When exile duel fires, ep.eliminated is the duel loser — use the voted-out player for the vote screen
  const rawElim = ep.exileDuelVotedOut || ep.eliminated;
  const elim = (rawElim && rawElim !== 'No elimination' && players.find(p => p.name === rawElim)) ? rawElim : null;
  const sortedVotes = Object.entries(votes).sort(([,a],[,b]) => b-a);
  // Blindside: the eliminated player didn't see it coming
  // Requires: (1) they felt safe (confident/comfortable/content) OR voted for someone else (thought target was elsewhere)
  // AND (2) they weren't the obvious consensus target (< 70% of votes, or they had low heat)
  const isBlindside = (() => {
    if (!elim) return false;
    const _elimState = gs.playerStates?.[elim]?.emotional || 'content';
    const _feltSafe = ['confident', 'comfortable', 'content'].includes(_elimState);
    const _vLog = ep.votingLog || [];
    const _votedElsewhere = _vLog.some(v => v.voter === elim && v.voted && v.voted !== elim);
    const _elimVotes = sortedVotes.find(([n]) => n === elim)?.[1] || 0;
    // Only count voters who actually cast a valid vote (exclude SITD, no-vote, blocked, THE GAME)
    const _totalVoters = _vLog.filter(v => v.voter !== 'THE GAME' && v.voted && !v.voteBlocked && !v.teamSwapped).length;
    const _wasObviousTarget = _totalVoters > 0 && _elimVotes / _totalVoters >= 0.6;
    // Blindside = they didn't expect it AND it wasn't a foregone conclusion
    return (_feltSafe || _votedElsewhere) && !_wasObviousTarget;
  })();
  const swap = ep.swapResult || null;
  const epNum = ep.num;
  const revoteLog = ep.revoteLog || [];

  const _voteTribeLabel = ep.tribalTribe ? ` \u00b7 ${ep.tribalTribe}` : '';
  let html = `<div class="rp-page tod-deepnight">
    <div class="rp-eyebrow">Episode ${epNum} — Tribal Council${_voteTribeLabel}</div>
    <div class="rp-title">The Votes</div>`;

  // ── Open Vote header banner ──
  if (ep.openVote && ep.openVoteOrder?.length) {
    html += `<div style="text-align:center;margin-bottom:16px;padding:10px;background:rgba(99,102,241,0.06);border:1px solid rgba(99,102,241,0.2);border-radius:8px">
      <div style="font-size:9px;font-weight:800;letter-spacing:2px;color:#6366f1;margin-bottom:6px">OPEN VOTE</div>
      <div style="font-size:12px;color:#8b949e">Voting order chosen by <strong style="color:#e6edf3">${ep.openVoteOrderedBy || '?'}</strong>. Votes are public.</div>
    </div>`;
  }

  // ── Advantage plays — always visible before votes are read ──
  // Use idolPlays1 if available (double boot: vote-1 plays saved separately)
  // Super Idol plays AFTER votes are read — exclude from pre-vote section
  const _voteIdolPlays = (ep.idolPlays1 || ep.idolPlays || []).filter(p => !p.superIdol);
  let _advHtml = '';
  _voteIdolPlays.forEach((play) => {
    const { player, votesNegated, type, playedFor, target, stolenFrom } = play;
    if (type === 'legacy') {
      _advHtml += `<div class="tv-advantage-play" style="border-color:rgba(227,179,65,0.3)">
        <div class="tv-advantage-play-left">
          ${rpPortrait(player, 'sm sitd')}
        </div>
        <div class="tv-advantage-play-body">
          <div class="tv-advantage-play-badge" style="color:#e3b341;background:rgba(227,179,65,0.12);border-color:rgba(227,179,65,0.25)">LEGACY ADVANTAGE</div>
          <div class="tv-advantage-play-title">${player}'s Legacy Advantage activates</div>
          <div class="tv-advantage-play-desc">The time has come. ${player} is immune at tonight's Tribal Council.</div>
          ${votesNegated ? `<div class="tv-advantage-play-result">${votesNegated} vote${votesNegated !== 1 ? 's' : ''} cancelled.</div>` : ''}
        </div>
      </div>`;
      return;
    }
    if (type === 'kip') {
      const _kipVictim = stolenFrom;
      const _kipPr = _kipVictim ? pronouns(_kipVictim) : null;
      const _kipFailed = !!play.failed;
      const _kipTypeLabel = play.stolenType === 'extraVote' ? 'Extra Vote' : play.stolenType === 'voteSteal' ? 'Vote Steal' : 'Hidden Immunity Idol';
      const _kipBadgeColor = _kipFailed
        ? 'color:#f85149;background:rgba(248,81,73,0.12);border-color:rgba(248,81,73,0.25)'
        : 'color:#818cf8;background:rgba(99,102,241,0.12);border-color:rgba(99,102,241,0.25)';
      const _kipBadgeLabel = _kipFailed ? 'KNOWLEDGE IS POWER \u2014 FAILED' : 'KNOWLEDGE IS POWER';
      _advHtml += `<div class="tv-advantage-play" style="border-color:${_kipFailed ? 'rgba(248,81,73,0.3)' : 'rgba(99,102,241,0.3)'}">
        <div class="tv-advantage-play-left">
          ${rpPortrait(player, 'sm sitd')}
          ${_kipVictim ? rpPortrait(_kipVictim, 'sm') : ''}
        </div>
        <div class="tv-advantage-play-body">
          <div class="tv-advantage-play-badge" style="${_kipBadgeColor}">${_kipBadgeLabel}</div>
          <div class="tv-advantage-play-title">${player} uses Knowledge is Power on ${_kipVictim || 'a player'}</div>
          <div class="tv-advantage-play-desc">${_kipFailed
            ? `"Do you have a Hidden Immunity Idol?" ${_kipVictim} looks ${player} dead in the eye. "No." ${_kipVictim} is telling the truth. The advantage is wasted.`
            : `"Do you have a ${_kipTypeLabel}?"${_kipVictim ? ` ${_kipVictim} must hand it over. ${_kipPr.Sub} ${_kipPr.sub==='they'?'have':'has'} no choice.` : ''}`
          }</div>
          ${_kipFailed
            ? `<div class="tv-advantage-play-result" style="color:#f85149">Knowledge is Power is gone. ${player} asked the wrong person.</div>`
            : `<div class="tv-advantage-play-result" style="color:#818cf8">${player} now controls ${_kipVictim ? `${_kipVictim}'s` : 'a'} ${_kipTypeLabel}.</div>`
          }
        </div>
      </div>`;
      return;
    }
    if (type === 'extraVote') {
      const _evForAlly = play.forAlly || null;
      _advHtml += `<div class="tv-advantage-play">
        <div class="tv-advantage-play-left">
          ${rpPortrait(player, 'sm sitd')}
          ${_evForAlly ? rpPortrait(_evForAlly, 'sm') : ''}
        </div>
        <div class="tv-advantage-play-body">
          <div class="tv-advantage-play-badge" style="color:#e3b341;background:rgba(227,179,65,0.12);border-color:rgba(227,179,65,0.25)">${_evForAlly ? 'EXTRA VOTE \u2014 ALLY PLAY' : 'EXTRA VOTE'}</div>
          <div class="tv-advantage-play-title">${_evForAlly ? `${player} plays an Extra Vote for ${_evForAlly}` : `${player} plays an Extra Vote`}</div>
          <div class="tv-advantage-play-desc">${_evForAlly ? `${player} steps in to protect ${_evForAlly}. A second vote is coming.` : `${player} casts a second vote. It will be read with the others.`}</div>
        </div>
      </div>`;
      return;
    }
    if (type === 'voteSteal') {
      _advHtml += `<div class="tv-advantage-play">
        <div class="tv-advantage-play-left">
          ${rpPortrait(player, 'sm sitd')}
          ${stolenFrom ? rpPortrait(stolenFrom, 'sm') : ''}
        </div>
        <div class="tv-advantage-play-body">
          <div class="tv-advantage-play-badge" style="color:#f0a500;background:rgba(240,165,0,0.12);border-color:rgba(240,165,0,0.25)">VOTE STEAL</div>
          <div class="tv-advantage-play-title">${player} steals ${stolenFrom ? `${stolenFrom}'s vote` : 'a vote'}</div>
          <div class="tv-advantage-play-desc">${stolenFrom ? `${stolenFrom} loses their vote.` : 'A vote is stolen.'} The redirect will be read with the others.</div>
        </div>
      </div>`;
      return;
    }
    if (type === 'voteBlock') {
      const _blocked = play.blockedPlayer;
      _advHtml += `<div class="tv-advantage-play">
        <div class="tv-advantage-play-left">${rpPortrait(player, 'sm sitd')}</div>
        <div class="tv-advantage-play-body">
          <div class="tv-advantage-play-badge" style="color:#f85149;background:rgba(248,81,73,0.12);border-color:rgba(248,81,73,0.25)">VOTE BLOCK</div>
          <div class="tv-advantage-play-title">${player} blocks ${_blocked}'s vote</div>
          <div class="tv-advantage-play-desc">${_blocked} cannot vote tonight. Their voice has been silenced.</div>
        </div>
      </div>`;
      return;
    }
    if (type === 'teamSwap') {
      const _tsIsAlly = !!play.playedFor;
      const _tsSaved = play.playedFor || player;
      _advHtml += `<div class="tv-advantage-play">
        <div class="tv-advantage-play-left">
          ${rpPortrait(player, 'sm sitd')}
          ${_tsIsAlly ? rpPortrait(play.playedFor, 'sm') : ''}
        </div>
        <div class="tv-advantage-play-body">
          <div class="tv-advantage-play-badge" style="color:#818cf8;background:rgba(129,140,248,0.12);border-color:rgba(129,140,248,0.25)">TEAM SWAP</div>
          <div class="tv-advantage-play-title">${_tsIsAlly ? `${player} plays Team Swap for ${play.playedFor}` : `${player} plays Team Swap`}</div>
          <div class="tv-advantage-play-desc">${_tsIsAlly ? `Instead of going home, ${play.playedFor} will swap to another tribe. ${player} burned the advantage to save ${pronouns(play.playedFor).obj}.` : `Instead of going home, ${player} will swap to another tribe. No one is eliminated tonight.`}</div>
        </div>
      </div>`;
      return;
    }
    if (type === 'soleVote') {
      _advHtml += `<div class="tv-advantage-play">
        <div class="tv-advantage-play-left">${rpPortrait(player, 'sm sitd')}</div>
        <div class="tv-advantage-play-body">
          <div class="tv-advantage-play-badge" style="color:#f0a500;background:rgba(240,165,0,0.12);border-color:rgba(240,165,0,0.25)">SOLE VOTE</div>
          <div class="tv-advantage-play-title">${player} plays the Sole Vote</div>
          <div class="tv-advantage-play-desc">All other votes are void. ${player}'s vote is the only one that counts tonight.</div>
        </div>
      </div>`;
      return;
    }
    if (type === 'safetyNoPower') {
      _advHtml += `<div class="tv-advantage-play">
        <div class="tv-advantage-play-left">${rpPortrait(player, 'sm sitd')}</div>
        <div class="tv-advantage-play-body">
          <div class="tv-advantage-play-badge" style="color:#818cf8;background:rgba(129,140,248,0.12);border-color:rgba(129,140,248,0.25)">SAFETY WITHOUT POWER</div>
          <div class="tv-advantage-play-title">${player} leaves Tribal Council</div>
          <div class="tv-advantage-play-desc">${player} is safe tonight — but cannot vote.${play.warned ? ` ${player} warned ${play.warned} before leaving.` : ' Nobody saw it coming.'}</div>
        </div>
      </div>`;
      return;
    }
    const _isAllyPlay = !!playedFor;
    const _idolTarget = _isAllyPlay ? playedFor : player;
    const _isMisplay = !!play.misplay;
    const _badgeColor = _isMisplay ? 'color:#d29922;background:rgba(210,153,34,0.12);border-color:rgba(210,153,34,0.25)' : 'color:#3fb950;background:rgba(63,185,80,0.12);border-color:rgba(63,185,80,0.25)';
    const _badgeLabel = _isMisplay ? 'HIDDEN IMMUNITY IDOL \u2014 WASTED' : 'HIDDEN IMMUNITY IDOL';
    const _mpPr = pronouns(player);
    const _playDesc = _isMisplay
      ? `${player} played the idol \u2014 but ${_mpPr.sub} ${_mpPr.sub==='they'?'weren\'t':'wasn\'t'} the target. ${votesNegated || 0} vote${(votesNegated||0) !== 1 ? 's' : ''} cancelled.`
      + (play.misplayReason ? `<div style="font-size:11px;color:#8b949e;margin-top:4px;font-style:italic">${play.misplayReason}</div>` : '')
      : `All votes cast against ${_idolTarget} do not count.`;
    _advHtml += `<div class="tv-advantage-play">
      <div class="tv-advantage-play-left">
        ${rpPortrait(player, 'sm sitd')}
        ${_isAllyPlay ? rpPortrait(playedFor, 'sm') : ''}
      </div>
      <div class="tv-advantage-play-body">
        <div class="tv-advantage-play-badge" style="${_badgeColor}">${_badgeLabel}</div>
        <div class="tv-advantage-play-title">${_isAllyPlay ? `${player} plays an idol for ${playedFor}` : `${player} plays an idol`}</div>
        <div class="tv-advantage-play-desc">${_playDesc}</div>
        ${!_isMisplay && votesNegated ? `<div class="tv-advantage-play-result">${votesNegated} vote${votesNegated !== 1 ? 's' : ''} cancelled.</div>` : ''}
      </div>
    </div>`;
  });
  if (ep.shotInDark?.player) {
    const { player, safe, votesNegated } = ep.shotInDark;
    const sidColor = safe ? '#3fb950' : '#f85149';
    const sidBg    = safe ? 'rgba(63,185,80,0.12)' : 'rgba(248,81,73,0.12)';
    const sidBorder= safe ? 'rgba(63,185,80,0.25)'  : 'rgba(248,81,73,0.25)';
    _advHtml += `<div class="tv-advantage-play">
      <div class="tv-advantage-play-left">
        ${rpPortrait(player, 'sm sitd')}
      </div>
      <div class="tv-advantage-play-body">
        <div class="tv-advantage-play-badge" style="color:${sidColor};background:${sidBg};border-color:${sidBorder}">SHOT IN THE DARK</div>
        <div class="tv-advantage-play-title">${player} rolls the dice</div>
        <div class="tv-advantage-play-desc">${safe
          ? `It worked. ${player} is safe — all votes against them are cancelled.`
          : `It failed. ${player} sacrificed their vote for nothing.`
        }</div>
        ${safe && votesNegated ? `<div class="tv-advantage-play-result">${votesNegated} vote${votesNegated !== 1 ? 's' : ''} cancelled.</div>` : ''}
      </div>
    </div>`;
  }
  // Idol shares — show who passed an idol to an ally before the vote
  if (ep.idolShares?.length) {
    ep.idolShares.forEach(share => {
      const _shPr = pronouns(share.from);
      _advHtml += `<div class="tv-advantage-play" style="border-color:rgba(227,179,65,0.3)">
        <div class="tv-advantage-play-left">
          ${rpPortrait(share.from, 'sm sitd')}
          ${rpPortrait(share.to, 'sm')}
        </div>
        <div class="tv-advantage-play-body">
          <div class="tv-advantage-play-badge" style="color:#e3b341;background:rgba(227,179,65,0.12);border-color:rgba(227,179,65,0.25)">IDOL SHARED</div>
          <div class="tv-advantage-play-title">${share.from} gives ${_shPr.posAdj} idol to ${share.to}</div>
          <div class="tv-advantage-play-desc">${share.veryClose
            ? `"I trust you with my life in this game." ${share.from} hands ${share.to} the idol without hesitation.`
            : `"Hold onto this. I trust you more than I trust luck tonight." ${share.to} takes it without a word.`
          }</div>
        </div>
      </div>`;
    });
  }
  // Journey + beware lost votes — show who can't vote this tribal
  const _tribal = ep.tribalPlayers
    || (ep.tribalTribe && ep.tribesAtStart?.find(t => t.name === ep.tribalTribe)?.members)
    || ep.gsSnapshot?.activePlayers
    || [...new Set([...vlog.map(v => v.voter), ...vlog.map(v => v.voted)])];
  // Journey losers from this episode
  const _journeyLosers = (ep.journey?.results || [])
    .filter(r => r.result === 'lostVote' && _tribal.includes(r.name))
    .map(r => r.name);
  // Carried-over journey lost votes from previous episodes
  const _prevSnap = gs.episodeHistory?.find(h => h.num === epNum - 1)?.gsSnapshot;
  const _carriedLosers = (_prevSnap?.journeyLostVotes || [])
    .filter(n => _tribal.includes(n) && !_journeyLosers.includes(n));
  // Beware lost votes
  const _bewareLosers = (ep.bewareLostVotes || []).filter(n => _tribal.includes(n));
  // Combine all lost-vote players (dedup)
  const _allLostVoters = [...new Set([..._journeyLosers, ..._carriedLosers, ..._bewareLosers])];
  _allLostVoters.forEach(name => {
    const p = pronouns(name);
    const isBeware = _bewareLosers.includes(name);
    const lostEp = isBeware ? null : (gs.episodeHistory || []).find(h => h.journey?.results?.some(r => r.name === name && r.result === 'lostVote'))?.num || '?';
    _advHtml += `<div class="tv-advantage-play">
      <div class="tv-advantage-play-left">
        ${rpPortrait(name, 'sm')}
      </div>
      <div class="tv-advantage-play-body">
        <div class="tv-advantage-play-badge" style="color:#f0883e;background:rgba(240,136,62,0.12);border-color:rgba(240,136,62,0.25)">NO VOTE</div>
        <div class="tv-advantage-play-title">${name} cannot vote tonight</div>
        <div class="tv-advantage-play-desc">${isBeware
          ? `${name}'s Beware Advantage restricts ${p.posAdj} vote until all tribes find theirs. ${p.Sub} must sit this tribal out without a voice.`
          : `${name} lost ${p.posAdj} vote on the Journey (Episode ${lostEp}). ${p.Sub} must sit this tribal out without a voice.`
        }</div>
      </div>
    </div>`;
  });
  if (_advHtml) html += _advHtml;

  // ── Threshold banner slot (above the two-panel layout) ──
  html += `<div id="tv-threshold-${epNum}" style="display:none"></div>`;
  // ── Two-panel layout: vote cards left, live tally right ──
  const tallyNames = [...new Set(vlog.map(v => v.voted))].sort((a,b) => (votes[b]||0) - (votes[a]||0));
  const _eligibleVoters = vlog.filter(v => v.voter !== 'THE GAME' && v.voted && !v.voteBlocked && !v.teamSwapped && !v.sitdSacrificed).length;
  const _majorityThreshold = Math.ceil(_eligibleVoters / 2);
  html += `<div class="tv-wrap">
    <div class="tv-reveal-panel" id="tv-cards-${epNum}">`;

  // Open vote helpers — declaration and reaction per player
  const _ovDecl = ep.openVote ? (voter, voted) => {
    const vs = pStats(voter); const bond = getBond(voter, voted);
    const _pick = arr => arr[([...voter+voted].reduce((a,c)=>a+c.charCodeAt(0),0)+epNum*7)%arr.length];
    if (bond >= 3) return _pick([`"This is hard for me. I'm voting ${voted}."`, `"I respect ${voted}, but tonight it has to be ${voted}."`]);
    if (bond <= -2) return _pick([`"Easy. ${voted}."`, `"No hesitation. ${voted}."`]);
    if (vs.boldness >= 8) return _pick([`"I'm voting ${voted}. No apology."`, `"${voted}. I'll say it to their face."`]);
    return _pick([`"My vote is for ${voted}."`, `"Tonight I'm writing ${voted}'s name."`]);
  } : null;
  const _ovReact = ep.openVote ? (voter, voted) => {
    const ts = pStats(voted); const bond = getBond(voter, voted);
    const _pick = arr => arr[([...voted+voter].reduce((a,c)=>a+c.charCodeAt(0),0)+epNum*13)%arr.length];
    if (bond >= 3) return _pick([`"After everything, ${voter}? I'll remember that."`, `"Really, ${voter}? Okay. I won't forget this."`]);
    if (bond <= -2) return _pick([`"Expected it."`, `"No surprise there."`]);
    if (ts.boldness >= 8) return _pick([`"Brave. Let's see how that plays out."`, `"Okay. Game on."`]);
    if (ts.temperament <= 3) return _pick([`"You just made an enemy."`, `"That was a mistake."`]);
    return _pick([`"Noted."`, `"Okay. Fine."`]);
  } : null;

  const _extraVotePlays = (ep.idolPlays || []).filter(p => p.type === 'extraVote');

  const _voteStealPlays = _voteIdolPlays.filter(p => p.type === 'voteSteal');
  const _stolenVoters = new Set(_voteStealPlays.map(p => p.stolenFrom));
  // Open vote lookups for badges
  const _ovReactions = ep.openVoteReactions || [];
  const _ovCascades = ep.cascadeSwitches || [];
  const _ovOrder = ep.openVoteOrder || [];
  const _ovFirstVoter = _ovOrder.length ? _ovOrder[0] : null;
  const _ovLastVoter = _ovOrder.length ? _ovOrder[_ovOrder.length - 1] : null;
  const _ovLastPiledOn = ep._openLastVoterPiledOn ?? false;

  vlog.filter(e => !e.sitdSacrificed).forEach((entry, idx) => {
    const { voter, voted, reason } = entry;
    const isStolen = entry.voteStolen || _stolenVoters.has(voter);
    const isBlackVote = entry.isBlackVote || false;
    const r = reason ? reason.trim() : '';
    const slugV = String(voted).replace(/[^a-zA-Z0-9]/g, '');
    const _decl = _ovDecl ? _ovDecl(voter, voted) : null;
    const _react = _ovReact ? _ovReact(voter, voted) : null;
    const _stolenStyle = isStolen ? 'opacity:0.4;border-color:rgba(240,165,0,0.3);background:rgba(240,165,0,0.03)' : '';
    const _blackVoteStyle = isBlackVote ? 'border-color:rgba(99,102,241,0.4);background:rgba(99,102,241,0.06)' : '';

    // Open vote: per-card badges and cascade info
    let _ovBadgeHtml = '';
    let _ovReactionHtml = '';
    let _ovCascadeHtml = '';
    if (ep.openVote && !isStolen) {
      // First voter badge
      if (voter === _ovFirstVoter) {
        _ovBadgeHtml += `<span style="display:inline-block;font-size:9px;font-weight:800;letter-spacing:1px;color:#e3b341;background:rgba(227,179,65,0.12);border:1px solid rgba(227,179,65,0.25);border-radius:4px;padding:1px 6px;margin-right:4px">SETS THE TONE</span>`;
      }
      // Last voter badge
      if (voter === _ovLastVoter) {
        const _lvColor = _ovLastPiledOn ? '#8b949e' : '#e3b341';
        const _lvBg = _ovLastPiledOn ? 'rgba(139,148,158,0.12)' : 'rgba(227,179,65,0.12)';
        const _lvBorder = _ovLastPiledOn ? 'rgba(139,148,158,0.25)' : 'rgba(227,179,65,0.25)';
        _ovBadgeHtml += `<span style="display:inline-block;font-size:9px;font-weight:800;letter-spacing:1px;color:${_lvColor};background:${_lvBg};border:1px solid ${_lvBorder};border-radius:4px;padding:1px 6px;margin-right:4px">FINAL WORD</span>`;
      }
      // Cascade switch badge
      const _cascade = _ovCascades.find(c => c.voter === voter);
      if (_cascade || entry.cascadeSwitched) {
        const _origTarget = _cascade?.originalTarget || entry.originalTarget || '?';
        _ovBadgeHtml += `<span style="display:inline-block;font-size:9px;font-weight:800;letter-spacing:1px;color:#f0883e;background:rgba(240,136,62,0.12);border:1px solid rgba(240,136,62,0.25);border-radius:4px;padding:1px 6px;margin-right:4px">SWITCHED</span>`;
        _ovCascadeHtml = `<div class="tv-vote-reason" style="color:#f0883e;font-size:10px;font-style:italic;margin-top:2px">Originally planned ${_origTarget} \u2014 switched under pressure</div>`;
      }
      // Reaction from target (from engine data)
      const _ovR = _ovReactions.find(r => r.voter === voter);
      if (_ovR?.reaction) {
        _ovReactionHtml = `<div class="tv-vote-reason" style="color:#8b949e;font-size:10px;margin-top:3px;font-style:italic">${_ovR.reaction}</div>`;
      }
    }

    html += `<div class="tv-vote-card" data-voted="${isStolen ? '' : voted}" data-voter="${voter}" data-index="${idx}" ${isStolen ? `style="${_stolenStyle}"` : isBlackVote ? `style="${_blackVoteStyle}"` : ''}>
      ${isBlackVote ? `<div style="font-size:8px;font-weight:800;letter-spacing:1.5px;color:#818cf8;margin-bottom:4px">BLACK VOTE</div>` : ''}
      <div class="tv-vote-voter-wrap">
        ${rpPortrait(voter, 'sm')}
        <div class="tv-vote-voter"${isBlackVote ? ' style="color:#818cf8"' : ''}>${voter}${isBlackVote ? ' (eliminated)' : ''}</div>
      </div>
      <div class="tv-vote-arrow"${isStolen ? ' style="color:#f0a500"' : isBlackVote ? ' style="color:#818cf8"' : ''}>\u2192</div>
      <div class="tv-vote-right">
        ${_ovBadgeHtml ? `<div style="margin-bottom:3px">${_ovBadgeHtml}</div>` : ''}
        <div class="tv-vote-target">${voted}</div>
        ${isStolen ? `<div class="tv-vote-reason" style="color:#f0a500;font-weight:700;font-size:10px;letter-spacing:0.5px">VOTE STOLEN \u2014 this vote does not count</div>` : ''}
        ${!isStolen && _decl ? `<div class="tv-vote-reason" style="color:#cdd9e5;font-style:italic">${_decl}</div>` : (!isStolen && r ? `<div class="tv-vote-reason">${r}</div>` : '')}
        ${_ovCascadeHtml}
        ${!isStolen && _react && !_ovReactionHtml ? `<div class="tv-vote-reason" style="color:#8b949e;font-size:10px;margin-top:3px">${voted}: ${_react}</div>` : ''}
        ${_ovReactionHtml}
      </div>
    </div>`;
  });

  // Extra Vote cards — a second card per extra-vote play, revealed in sequence after regular votes
  if (_extraVotePlays.length) {
    html += `<div style="font-size:9px;font-weight:800;letter-spacing:2.5px;text-transform:uppercase;color:#e3b341;text-align:center;padding:8px 0 4px;border-top:1px solid #2d2504;margin-top:4px">\u2295 EXTRA VOTE</div>`;
    _extraVotePlays.forEach((evp, i) => {
      const { player, target, forAlly } = evp;
      html += `<div class="tv-vote-card" data-voted="${target}" data-voter="${player}" data-index="${vlog.length + i}" style="border-color:rgba(227,179,65,0.4);background:rgba(227,179,65,0.04)">
        <div class="tv-vote-voter-wrap">
          ${rpPortrait(player, 'sm')}
          ${forAlly ? rpPortrait(forAlly, 'sm') : ''}
          <div class="tv-vote-voter">${player}</div>
        </div>
        <div class="tv-vote-arrow" style="color:#e3b341">\u2192</div>
        <div class="tv-vote-right">
          <div class="tv-vote-target">${target}</div>
          <div class="tv-vote-reason" style="color:#e3b341;font-weight:700;font-size:10px;letter-spacing:0.5px">\u2295 second vote \u00b7 Extra Vote${forAlly ? ` \u2014 for ${forAlly}` : ''}</div>
        </div>
      </div>`;
    });
  }

  // Vote Steal redirect cards — shows the stolen vote being cast by the stealer
  if (_voteStealPlays.length) {
    html += `<div style="font-size:9px;font-weight:800;letter-spacing:2.5px;text-transform:uppercase;color:#f0a500;text-align:center;padding:8px 0 4px;border-top:1px solid #2d2504;margin-top:4px">STOLEN VOTE</div>`;
    _voteStealPlays.forEach((vsp, i) => {
      html += `<div class="tv-vote-card" data-voted="${vsp.target}" data-voter="${vsp.player}" data-index="${vlog.length + _extraVotePlays.length + i}" style="border-color:rgba(240,165,0,0.4);background:rgba(240,165,0,0.04)">
        <div class="tv-vote-voter-wrap">
          ${rpPortrait(vsp.player, 'sm')}
          ${rpPortrait(vsp.stolenFrom, 'sm')}
          <div class="tv-vote-voter">${vsp.player}</div>
        </div>
        <div class="tv-vote-arrow" style="color:#f0a500">\u2192</div>
        <div class="tv-vote-right">
          <div class="tv-vote-target">${vsp.target}</div>
          <div class="tv-vote-reason" style="color:#f0a500;font-weight:700;font-size:10px;letter-spacing:0.5px">stolen vote from ${vsp.stolenFrom} \u00b7 Vote Steal</div>
        </div>
      </div>`;
    });
  }

  // Revote vote cards — styled distinctly so they're clearly a second round
  if (revoteLog.length && !ep.sidFreshVote) {
    const _rvTied = ep.tiedPlayers || [];
    const _rvTiedLabel = _rvTied.length ? _rvTied.join(' and ') : 'the tied players';
    html += `<div style="font-size:9px;font-weight:800;letter-spacing:2.5px;text-transform:uppercase;color:#d29922;text-align:center;padding:8px 0 4px;border-top:1px solid #2d2504;margin-top:4px">REVOTE — ${_rvTiedLabel.toUpperCase()} ONLY</div>`;
    if (_rvTied.length) {
      html += `<div style="font-size:10px;color:#484f58;text-align:center;margin-bottom:6px;font-style:italic">${_rvTiedLabel} cannot vote. Everyone else must choose between them.</div>`;
    }
    revoteLog.forEach(({ voter, voted, reason }, idx) => {
      html += `<div class="tv-vote-card" data-voted="${voted}" data-voter="${voter}" data-revote="1" data-index="${vlog.length + _extraVotePlays.length + idx}" style="border-color:rgba(210,153,34,0.3);background:rgba(210,153,34,0.03)">
        <div class="tv-vote-voter-wrap">
          ${rpPortrait(voter, 'sm')}
          <div class="tv-vote-voter">${voter}</div>
        </div>
        <div class="tv-vote-arrow" style="color:#d29922">\u2192</div>
        <div class="tv-vote-right">
          <div class="tv-vote-target">${voted}</div>
          <div class="tv-vote-reason" style="color:#d29922;font-size:10px">${reason || 'Revote'}</div>
        </div>
      </div>`;
    });
  }

  html += `</div>`; // end tv-reveal-panel (cards)

  // Live tally panel (sticky sidebar)
  html += `<div class="tv-tally-panel" id="tv-tally-${epNum}" data-majority="${_majorityThreshold}" data-eligible="${_eligibleVoters}">
    <div class="tv-tally-header">The Votes</div>`;
  tallyNames.forEach(name => {
    const slug = name.replace(/[^a-zA-Z0-9]/g, '');
    html += `<div class="tv-tally-row" data-name="${name}">
      <div class="tv-tally-row-top">
        <div class="tv-tally-torch"><div class="tv-tally-torch-flame" id="tv-tf-${epNum}-${slug}"></div></div>
        ${rpPortrait(name, 'sm')}
        <div class="tv-tally-pname">${name}</div>
      </div>
      <div class="tv-tally-row-bar">
        <div class="tv-tally-bar-bg"><div class="tv-tally-bar" id="tv-tb-${epNum}-${slug}" style="width:0%"></div></div>
        <div class="tv-tally-count" id="tv-tc-${epNum}-${slug}" data-count="0">\u2014</div>
      </div>
    </div>`;
  });
  html += `</div>`;

  // Second Live Tally for revote — hidden until revote cards start revealing
  if (revoteLog.length && !ep.sidFreshVote) {
    const rvTallyNames = [...new Set(revoteLog.map(v => v.voted))].sort((a,b) => {
      const rv = ep.revoteVotes || {};
      return (rv[b]||0) - (rv[a]||0);
    });
    html += `<div class="tv-tally-panel" id="tv-tally-rv-${epNum}" style="display:none;border-color:rgba(210,153,34,0.3)">
      <div class="tv-tally-header" style="color:#d29922">Revote</div>`;
    rvTallyNames.forEach(name => {
      const slug = name.replace(/[^a-zA-Z0-9]/g, '');
      html += `<div class="tv-tally-row" data-name="${name}">
        <div class="tv-tally-row-top">
          <div class="tv-tally-torch"><div class="tv-tally-torch-flame" id="tv-tf-rv-${epNum}-${slug}"></div></div>
          ${rpPortrait(name, 'sm')}
          <div class="tv-tally-pname">${name}</div>
        </div>
        <div class="tv-tally-row-bar">
          <div class="tv-tally-bar-bg"><div class="tv-tally-bar" id="tv-tb-rv-${epNum}-${slug}" style="width:0%;background:#d29922"></div></div>
          <div class="tv-tally-count" id="tv-tc-rv-${epNum}-${slug}" data-count="0">\u2014</div>
        </div>
      </div>`;
    });
    html += `</div>`;
  }

  html += `</div>`; // end tv-wrap

  const totalCards = vlog.length + _extraVotePlays.length + (revoteLog.length && !ep.sidFreshVote ? revoteLog.length : 0);
  html += `<div id="tv-btn-wrap-${epNum}">
    <button class="tv-reveal-btn" id="tv-btn-${epNum}" onclick="tvRevealNext(${epNum})">Read the Vote (0/${totalCards})</button>
    <div style="text-align:right;margin:-12px 0 14px">
      <button onclick="tvRevealAll(${epNum})" style="background:none;border:none;font-size:11px;color:#484f58;cursor:pointer;padding:2px 0;letter-spacing:0.3px">Skip to results ›</button>
    </div>
  </div>`;

  // ── Results section (hidden until all votes revealed) ──
  html += `<div id="tv-results-${epNum}" style="display:none">`;

  // ── Helper: render tiebreaker challenge card + elim card ──
  const _renderTiebreakerCard = (tr, epTiedPlayers) => {
    const _allTied = epTiedPlayers || tr.participants;
    const _excluded = _allTied.filter(p => !tr.participants.includes(p));
    const _tieNote = _excluded.length
      ? `The votes tied between ${_allTied.join(', ')}. ${_excluded.join(' and ')} held immunity — only ${tr.participants.join(' and ')} competed.`
      : `The votes tied between ${_allTied.join(', ')}. No revote. No rocks.`;
    const [_tb0, _tb1] = tr.participants;
    const _tbS0 = pStats(_tb0); const _tbS1 = pStats(_tb1);
    const _tbCat = tr.challengeCategory || 'mixed';
    const _tbEdgeFn = _tbCat === 'endurance' ? s => s.endurance
                    : _tbCat === 'physical'  ? s => s.physical
                    : _tbCat === 'puzzle'    ? s => s.mental
                    : s => s.physical * 0.5 + s.endurance * 0.5;
    const _tb0Edge = _tbEdgeFn(_tbS0) >= _tbEdgeFn(_tbS1);
    const _tbFav = _tb0Edge ? _tb0 : _tb1; const _tbUnder = _tb0Edge ? _tb1 : _tb0;
    let _tbLine1, _tbLine2;
    if (_tbCat === 'endurance') {
      _tbLine1 = `${_tbFav} locks in early — the endurance edge is visible within the first minute. ${_tbUnder} grits through it, but the clock is working against them.`;
      _tbLine2 = `Neither player breaks. Then one of them does.`;
    } else if (_tbCat === 'puzzle') {
      _tbLine1 = `${_tbFav} moves through the puzzle methodically. ${_tbUnder} is faster but keeps second-guessing their placements.`;
      _tbLine2 = `One wrong move and the game is over. One right move and it all snaps into place.`;
    } else if (_tbCat === 'physical') {
      _tbLine1 = `${_tbFav} explodes out of the start — raw speed, no hesitation. ${_tbUnder} is right behind them, refusing to let the gap open.`;
      _tbLine2 = `It's close. Then it isn't.`;
    } else {
      _tbLine1 = `${_tbFav} finds a rhythm early. ${_tbUnder} is fighting to keep pace, running on adrenaline alone.`;
      _tbLine2 = `One of them has something to prove. It shows.`;
    }
    let _out = `<div class="rp-elim" style="background:radial-gradient(ellipse at 50% 30%,rgba(210,153,34,0.08) 0%,transparent 60%);border-color:rgba(210,153,34,0.2)">
      <div class="rp-elim-eyebrow" style="color:#d29922">Challenge Tiebreaker — ${tr.challengeLabel}</div>
      <div style="font-size:12px;color:#8b949e;text-align:center;margin-bottom:18px;line-height:1.5">${_tieNote}</div>
      <div style="font-size:13px;color:#cdd9e5;line-height:1.6;text-align:center;margin:0 0 10px">${_tbLine1}</div>
      <div style="font-size:13px;color:#cdd9e5;line-height:1.6;text-align:center;margin:0 0 16px">${_tbLine2}</div>
      <div style="font-size:11px;color:#8b949e;text-align:center;margin-bottom:18px;letter-spacing:0.5px">— the result —</div>
      <div style="display:flex;justify-content:center;align-items:flex-start;gap:20px;flex-wrap:wrap;margin:0 0 18px">
        ${tr.participants.map(p => `<div style="text-align:center">
          ${rpPortrait(p,'xl')}
          <div style="font-size:10px;font-weight:800;margin-top:6px;letter-spacing:1px;color:${p===tr.loser?'#f85149':'#3fb950'}">${p===tr.loser?'ELIMINATED':'SAFE'}</div>
        </div>`).join(`<div style="align-self:center;font-size:28px;color:#30363d">⚡</div>`)}
      </div>
    </div>`;
    if (tr.loser) {
      const _elimNum = (gs.episodeHistory || []).filter(h => h.eliminated && h.num < ep.num).length + 1 + (ep.firstEliminated ? 1 : 0);
      const _eq = vpGenerateQuote(tr.loser, ep, 'eliminated');
      _out += `<div class="rp-elim"><div class="rp-elim-eyebrow">${ordinal(_elimNum)} player voted out</div>
        ${rpPortrait(tr.loser,'xl elim')}<div class="rp-elim-name">${tr.loser}</div>
        <div class="rp-elim-arch">${vpArchLabel(tr.loser)}</div>
        <div class="rp-elim-quote">"${_eq}"</div>
        <div class="rp-elim-place">Voted Out — Episode ${ep.num}</div></div>`;
    }
    return _out;
  };

  // ── Helper: render a clean elimination card ──
  const _renderElimCard = (name, isBs, placeOffset) => {
    // Chronological elimination number (1st voted out, 2nd voted out, etc.)
    const _elimNumber = (gs.episodeHistory || []).filter(h => h.eliminated && h.num < ep.num).length + 1 + (placeOffset || 0);
    const _eq = vpGenerateQuote(name, ep, 'eliminated');
    return `<div class="rp-elim">
      <div class="rp-elim-eyebrow">${isBs ? 'BLINDSIDE — ' : ''}${ordinal(_elimNumber)} player voted out</div>
      ${rpPortrait(name,'xl elim')}<div class="rp-elim-name">${name}</div>
      <div class="rp-elim-arch">${vpArchLabel(name)}</div>
      <div class="rp-elim-quote">"${_eq}"</div>
      <div class="rp-elim-place">Voted Out — Episode ${ep.num}</div></div>`;
  };

  // ── Vote 1 final tally ──
  // Fresh vote: original votes were wiped — don't mark anyone eliminated in this tally.
  // Announced double elim: mark top 2 in the same tally.
  // Surprise double boot: mark vote-1 eliminated (ep.firstEliminated).
  // Tiebreaker: winner/loser resolved by challenge — tally shows TIE for both, elim card handles the outcome
  // Fire-making (Second Life): mark the voted-out player, not the fire loser — Aftermath handles the duel
  // Super Idol: show pre-cancellation votes so viewer sees who was going home before the play
  const _hasTiebreaker = !ep.firstEliminated && !!ep.tiebreakerResult;
  const _hasFireMaking = !!ep.fireMaking;
  const _hasSuperIdol = !!ep.superIdolPlayed;
  // Revote tie: first vote was a tie → went to revote (or rocks). Don't mark anyone eliminated in first-vote tally.
  const _hasRevoteTie = !ep.firstEliminated && ep.isTie && !!ep.revoteVotes && !_hasTiebreaker;
  const _tallyVotes = _hasSuperIdol && ep.votesBeforeSuperIdol ? ep.votesBeforeSuperIdol : votes;
  const _tallySorted = Object.entries(_tallyVotes).sort(([,a],[,b]) => b-a);
  const _tallyTotal = Object.values(_tallyVotes).reduce((a,b) => a+b, 0);
  // When super idol fires, the original target (before negation) is the one marked
  const _superIdolTarget = ep.superIdolPlayed?.savedPlayer || null;
  const _v1Elim = ep.sidFreshVote ? null : _hasFireMaking ? ep.fireMaking.player : _hasSuperIdol ? null : _hasRevoteTie ? null : (ep.firstEliminated || (_hasTiebreaker ? null : elim));
  const _v1IsBlindside = !_hasTiebreaker && !_hasFireMaking && _v1Elim && pStats(_v1Elim).strategic >= 7;
  const _v1Elim2 = ep.announcedDoubleElim ? elim : null; // second eliminated in announced double elim
  const _v1Elim2Bs = _v1Elim2 && pStats(_v1Elim2).strategic >= 7;
  if (_tallySorted.length) {
    let _tallyHeader = 'Final Tally';
    if (ep.sidFreshVote) _tallyHeader = 'Original Votes — Wiped';
    else if (ep.announcedDoubleElim) _tallyHeader = 'Final Tally — Double Elimination';
    else if (ep.firstEliminated) _tallyHeader = 'Vote 1 — Final Tally';
    else if (_hasSuperIdol) _tallyHeader = 'Final Tally — Before Super Idol';
    else if (_hasRevoteTie) _tallyHeader = 'Final Tally — Tied';
    else if (_hasTiebreaker) _tallyHeader = 'Final Tally — Tied';
    html += `<div class="tv-final-tally">
      <div class="tv-ft-header">${_tallyHeader}</div>`;
    _tallySorted.forEach(([name, v]) => {
      const pct = Math.round((v / Math.max(1, _tallyTotal)) * 100);
      const isDuel = !!(ep.exileDuelResult) && name === ep.exileDuelResult.newBoot;
      const isTied = (_hasTiebreaker || _hasRevoteTie) && (ep.tiedPlayers||[]).includes(name);
      const isE  = !ep.exileDuelResult && !isTied && name === _v1Elim;
      const isE2 = !ep.exileDuelResult && !isTied && name === _v1Elim2;
      const isS  = !_v1Elim && !_v1Elim2 && !_hasTiebreaker && !_hasSuperIdol && swap && name === _tallySorted[0][0];
      const isSuperIdolTarget = name === _superIdolTarget;
      const barColor = isSuperIdolTarget ? '#e3b341' : ((isE && !_hasFireMaking) || isE2) ? '#da3633' : ((isE && _hasFireMaking) || isTied || isDuel || isS) ? '#d29922' : '#30363d';
      html += `<div class="tv-ft-row ${((isE && !_hasFireMaking) || isE2) ? 'tv-ft-elim' : ''}">
        ${rpPortrait(name)}
        <div class="tv-ft-name">${name}</div>
        <div class="tv-ft-bar-bg"><div class="tv-ft-bar" style="width:${pct}%;background:${barColor}"></div></div>
        <span class="vp-tally-num" data-target="${v}">0</span>
        ${isSuperIdolTarget ? `<span style="font-size:9px;font-weight:800;letter-spacing:1px;padding:2px 8px;border-radius:4px;background:rgba(227,179,65,0.15);color:#e3b341">⚡ SUPER IDOL</span>` : ''}
        ${isTied ? `<span style="font-size:9px;font-weight:800;letter-spacing:1px;padding:2px 8px;border-radius:4px;background:rgba(210,153,34,0.1);color:#d29922">TIE</span>` : ''}
        ${isE  ? `<span style="font-size:9px;font-weight:800;letter-spacing:1px;padding:2px 8px;border-radius:4px;background:${_hasFireMaking ? 'rgba(210,153,34,0.1)' : 'rgba(218,54,51,0.1)'};color:${_hasFireMaking ? '#d29922' : '#da3633'}">${_hasFireMaking ? 'SECOND LIFE' : _v1IsBlindside  ? 'BLINDSIDE' : 'ELIMINATED'}</span>` : ''}
        ${isE2 ? `<span style="font-size:9px;font-weight:800;letter-spacing:1px;padding:2px 8px;border-radius:4px;background:rgba(218,54,51,0.1);color:#da3633">${_v1Elim2Bs ? 'BLINDSIDE' : 'ELIMINATED'}</span>` : ''}
        ${isDuel ? `<span style="font-size:9px;font-weight:800;letter-spacing:1px;padding:2px 8px;border-radius:4px;background:rgba(210,153,34,0.1);color:#d29922">DUEL</span>` : ''}
        ${isS ? `<span style="font-size:9px;font-weight:800;letter-spacing:1px;padding:2px 8px;border-radius:4px;background:rgba(210,153,34,0.1);color:#d29922">SWAP</span>` : ''}
      </div>`;
    });
    html += `</div>`;
  }

  // ── SUPER IDOL play banner — appears AFTER votes are read ──
  if (ep.superIdolPlayed) {
    const _sip = ep.superIdolPlayed;
    const _sipPr = pronouns(_sip.holder);
    const _sipIsAlly = _sip.holder !== _sip.savedPlayer;
    const _sipSavedPr = _sipIsAlly ? pronouns(_sip.savedPlayer) : _sipPr;
    html += `<div style="text-align:center;margin:20px 0;padding:16px 20px;background:radial-gradient(ellipse at 50% 30%,rgba(227,179,65,0.12) 0%,rgba(227,179,65,0.02) 70%);border:2px solid rgba(227,179,65,0.4);border-radius:12px">
      <div style="font-size:10px;font-weight:800;letter-spacing:3px;color:#e3b341;margin-bottom:8px">⚡ SUPER IDOL</div>
      <div style="display:flex;justify-content:center;align-items:center;gap:12px;margin-bottom:10px">
        ${rpPortrait(_sip.holder, 'sitd')}
        ${_sipIsAlly ? rpPortrait(_sip.savedPlayer, '') : ''}
      </div>
      <div style="font-size:14px;font-weight:700;color:#e6edf3;margin-bottom:6px">${_sipIsAlly
        ? `${_sip.holder} plays the Super Idol for ${_sip.savedPlayer}`
        : `${_sip.holder} plays the Super Idol`
      }</div>
      <div style="font-size:12px;color:#8b949e;line-height:1.5;max-width:400px;margin:0 auto">${_sipIsAlly
        ? `The votes are read. ${_sip.savedPlayer} is going home — until ${_sip.holder} stands up. "Not tonight." The Super Idol negates all ${_sip.votesNegated} vote${_sip.votesNegated !== 1 ? 's' : ''}.`
        : `The votes are read. ${_sip.holder}'s name comes up ${_sip.votesNegated} time${_sip.votesNegated !== 1 ? 's' : ''}. ${_sipPr.Sub} ${_sipPr.sub==='they'?'reach':'reaches'} into ${_sipPr.posAdj} pocket. "I have something." The Super Idol. All votes negated.`
      }</div>
      <div style="font-size:11px;color:#e3b341;font-weight:700;margin-top:8px">${_sip.votesNegated} vote${_sip.votesNegated !== 1 ? 's' : ''} cancelled — played after the votes were read</div>
    </div>`;
  }

  // Revote tally (regular tie-revote only)
  if (ep.revoteVotes && Object.keys(ep.revoteVotes).length && !ep.sidFreshVote && !ep.firstEliminated) {
    const rvSorted = Object.entries(ep.revoteVotes).sort(([,a],[,b]) => b-a);
    const _rvTied = ep.tiedPlayers || [];
    const _rvStillTied = rvSorted.length >= 2 && rvSorted[0][1] === rvSorted[1][1];
    html += `<div style="margin:16px 0 20px;padding:14px 16px;background:rgba(210,153,34,0.04);border:1px solid rgba(210,153,34,0.15);border-radius:10px">
      <div style="font-size:10px;font-weight:800;letter-spacing:2px;color:#d29922;text-align:center;margin-bottom:8px">FINAL TALLY #2${_rvTied.length ? ` — ${_rvTied.join(' & ').toUpperCase()} ONLY` : ''}</div>
      ${_rvTied.length ? `<div style="font-size:10px;color:#484f58;text-align:center;margin-bottom:10px">${_rvTied.join(' and ')} cannot vote. Everyone else votes for one of them.</div>` : ''}
      <div style="display:flex;justify-content:center;gap:20px;flex-wrap:wrap">
        ${rvSorted.map(([n, v]) => {
          const pct = Math.round((v / Math.max(1, Object.values(ep.revoteVotes).reduce((a,b)=>a+b,0))) * 100);
          return `<div style="text-align:center;min-width:80px">
            ${rpPortrait(n)}
            <div style="font-size:12px;font-weight:700;color:#e6edf3;margin-top:4px">${n}</div>
            <div style="font-size:18px;font-weight:800;color:${_rvStillTied ? '#d29922' : '#e6edf3'}">${v}</div>
            <div style="font-size:9px;color:#484f58">${v} vote${v!==1?'s':''}</div>
          </div>`;
        }).join(`<div style="align-self:center;font-size:18px;color:#30363d;font-weight:800">vs</div>`)}
      </div>
      ${_rvStillTied ? `<div style="font-size:11px;font-weight:700;color:#d29922;text-align:center;margin-top:10px;letter-spacing:0.5px">DEADLOCKED — DRAWING ROCKS</div>` : ''}
    </div>`;
  }

  // ── Vote 1 elimination card (not shown for fresh vote — elim card is inside fresh vote section) ──
  if (ep.tiebreakerResult1) {
    html += _renderTiebreakerCard(ep.tiebreakerResult1, ep.tiedPlayers);
  } else if (ep.tiebreakerResult && !ep.firstEliminated) {
    // Single-tribal tiebreaker — show the challenge card + elim
    html += _renderTiebreakerCard(ep.tiebreakerResult, ep.tiedPlayers);
  } else if (ep.isRockDraw && !ep.firstEliminated && elim) {
    const _rdTied = ep.tiedPlayers || [];
    const _rdSafe = _rdTied.filter(p => p !== elim);
    const _rdPlace = (ep.gsSnapshot?.activePlayers ?? gs.activePlayers).length + 1;
    const _rdQuote = vpGenerateQuote(elim, ep, 'eliminated');
    const _rdQuotes = [
      `The vote deadlocked${_rdTied.length ? ` between ${_rdTied.join(' and ')}` : ''}. Nobody changed their vote. The tribe drew rocks.`,
      `Neither side blinked. It went to rocks.`,
    ];
    html += `<div class="rp-elim" style="background:radial-gradient(ellipse at 50% 30%,rgba(210,153,34,0.08) 0%,transparent 60%);border-color:rgba(210,153,34,0.2)">
      <div class="rp-elim-eyebrow" style="color:#d29922">ROCK DRAW</div>
      <div style="font-size:13px;color:#8b949e;text-align:center;margin-bottom:14px;line-height:1.5">${_rdQuotes[Math.floor(Math.random() * _rdQuotes.length)]}</div>
      ${_rdSafe.length ? `<div style="display:flex;justify-content:center;gap:16px;margin-bottom:16px">
        ${_rdSafe.map(p => `<div style="text-align:center">${rpPortrait(p)}<div style="font-size:9px;font-weight:800;color:#3fb950;margin-top:4px;letter-spacing:1px">SAFE (TIED)</div></div>`).join('')}
      </div>` : ''}
      <div style="text-align:center;font-size:10px;color:#484f58;margin-bottom:12px;letter-spacing:0.5px">Non-tied, non-immune players draw rocks. One is wrong.</div>
      ${rpPortrait(elim,'xl elim')}<div class="rp-elim-name">${elim}</div>
      <div class="rp-elim-arch">${vpArchLabel(elim)}</div>
      <div class="rp-elim-quote">"${_rdQuote}"</div>
      <div class="rp-elim-place">Eliminated by Rock Draw — Episode ${epNum}</div>
    </div>`;
  } else if (ep.firstEliminated && !ep.sidFreshVote) {
    // Vote 1 clean elimination card (surprise double boot, no fresh vote)
    html += _renderElimCard(ep.firstEliminated, _v1IsBlindside, 1);
  } else if (elim && ep.tiebreakerResult && !ep.sidFreshVote) {
    // Tiebreaker challenge — show tie, then duel, then elimination
    const _tbr = ep.tiebreakerResult;
    html += `<div style="text-align:center;margin:16px 0;padding:14px;border:2px solid rgba(210,153,34,0.3);border-radius:10px;background:rgba(210,153,34,0.04)">
      <div style="font-size:9px;font-weight:800;letter-spacing:2px;color:#d29922;margin-bottom:8px">TIE — ${(ep.tiedPlayers || _tbr.participants).join(' vs ')}</div>
      <div style="font-size:13px;color:#c9d1d9;margin-bottom:10px">The vote is tied. Under challenge tiebreaker rules, the tied players compete head-to-head.</div>
      <div style="font-size:11px;color:#f59e0b;font-weight:700;letter-spacing:1px;margin-bottom:8px">${_tbr.challengeLabel || 'Tiebreaker Challenge'}</div>
      <div style="display:flex;justify-content:center;gap:16px;margin-bottom:10px">
        ${_tbr.participants.map(p => `<div style="text-align:center">${rpPortrait(p, 'lg')}<div style="font-size:11px;color:${p === _tbr.winner ? '#3fb950' : '#f47067'};font-weight:700;margin-top:4px">${p === _tbr.winner ? 'WINS' : 'LOSES'}</div></div>`).join('')}
      </div>
      <div style="font-size:12px;color:#c9d1d9">${_tbr.winner} survives. ${_tbr.loser} is eliminated.</div>
    </div>`;
    html += _renderElimCard(elim, false, 0);
  } else if (elim && !ep.exileDuelResult && !ep.sidFreshVote && !_hasFireMaking) {
    html += _renderElimCard(elim, isBlindside, 0);
  } else if (swap) {
    html += `<div class="rp-elim" style="background:radial-gradient(ellipse at 50% 30%,rgba(210,153,34,0.08) 0%,transparent 60%);border-color:rgba(210,153,34,0.2)">
      <div class="rp-elim-eyebrow" style="color:#d29922">Twist — Elimination Swap</div>
      <div style="display:flex;justify-content:center;align-items:center;gap:32px;margin:24px 0 18px">
        <div style="text-align:center">${rpPortrait(swap.swapper,'xl')}<div style="font-size:11px;color:#d29922;font-weight:700;margin-top:6px">${swap.swapper}</div><div style="font-size:10px;color:#8b949e">${swap.fromTribe} → ${swap.toTribe}</div></div>
        <div style="font-size:28px;color:#30363d">⇄</div>
        <div style="text-align:center">${rpPortrait(swap.pickedPlayer,'xl')}<div style="font-size:11px;color:#d29922;font-weight:700;margin-top:6px">${swap.pickedPlayer}</div><div style="font-size:10px;color:#8b949e">${swap.toTribe} → ${swap.fromTribe}</div></div>
      </div>
      <div class="rp-elim-quote" style="color:#8b949e">"Nobody goes home tonight — but everything just changed."</div>
    </div>`;
  }

  // ── Fresh vote (SitD wiped all valid votes) — separate interactive reveal ──
  if (ep.sidFreshVote && revoteLog.length) {
    const _fvId = String(epNum) + '_fv';
    const _fvVotes = ep.revoteVotes || {};
    const _fvSorted = Object.entries(_fvVotes).sort(([,a],[,b]) => b-a);
    // Derive eliminated from revoteVotes (most votes) — ep.eliminated may reflect a different path
    const _fvElimFromVotes = _fvSorted.length ? _fvSorted[0][0] : null;
    const _fvElim = (elim && _fvVotes[elim]) ? elim : _fvElimFromVotes;
    const _fvIsBs = _fvElim && pStats(_fvElim).strategic >= 7;

    // Announcement banner
    html += `<div style="margin:28px 0 20px;padding:14px 16px;background:rgba(218,54,51,0.07);border:1px solid rgba(218,54,51,0.25);border-radius:10px;text-align:center">
      <div style="font-size:9px;font-weight:800;letter-spacing:2px;color:#da3633;margin-bottom:6px">ALL VALID VOTES WERE WIPED</div>
      <div style="font-size:12px;color:#8b949e;line-height:1.5">Advantage plays cancelled every valid vote. A fresh vote will now be held — all players eligible.</div>
    </div>`;

    // Fresh vote threshold + two-panel layout
    const _fvTallyNames2 = [...new Set(revoteLog.map(v => v.voted))].sort((a,b) => (_fvVotes[b]||0) - (_fvVotes[a]||0));
    const _fvEligible = revoteLog.filter(v => v.voter !== 'THE GAME' && v.voted).length;
    const _fvMajority = Math.ceil(_fvEligible / 2);
    html += `<div id="tv-threshold-${_fvId}" style="display:none"></div>`;
    html += `<div class="tv-wrap">`;
    // Fresh vote reveal panel
    html += `<div class="tv-reveal-panel" id="tv-cards-${_fvId}">`;
    revoteLog.forEach(({ voter, voted, reason }, idx) => {
      const r = reason ? reason.trim() : '';
      html += `<div class="tv-vote-card" data-voted="${voted}" data-voter="${voter}" data-index="${idx}">
        <div class="tv-vote-voter-wrap">
          ${rpPortrait(voter, 'sm')}
          <div class="tv-vote-voter">${voter}</div>
        </div>
        <div class="tv-vote-divider"></div>
        <div class="tv-vote-for-wrap">
          ${rpPortrait(voted, 'sm')}
          <div class="tv-vote-for">${voted}</div>
        </div>
        ${r ? `<div class="tv-vote-reason">${r}</div>` : ''}
      </div>`;
    });
    html += `</div>`; // end tv-reveal-panel (fresh vote cards)
    // Fresh vote tally sidebar
    html += `<div class="tv-tally-panel" id="tv-tally-${_fvId}" data-majority="${_fvMajority}" data-eligible="${_fvEligible}">
      <div class="tv-tally-header">Fresh Vote</div>`;
    _fvTallyNames2.forEach(name => {
      const _fvSlug = name.replace(/[^a-zA-Z0-9]/g, '');
      html += `<div class="tv-tally-row" data-name="${name}">
        <div class="tv-tally-row-top">
          <div class="tv-tally-torch"><div class="tv-tally-torch-flame" id="tv-tf-${_fvId}-${_fvSlug}"></div></div>
          ${rpPortrait(name, 'sm')}
          <div class="tv-tally-pname">${name}</div>
        </div>
        <div class="tv-tally-row-bar">
          <div class="tv-tally-bar-bg"><div class="tv-tally-bar" id="tv-tb-${_fvId}-${_fvSlug}" style="width:0%"></div></div>
          <div class="tv-tally-count" id="tv-tc-${_fvId}-${_fvSlug}" data-count="0">\u2014</div>
        </div>
      </div>`;
    });
    html += `</div>`;
    html += `</div>`; // end tv-wrap

    html += `<div id="tv-btn-wrap-${_fvId}">
      <button class="tv-reveal-btn" id="tv-btn-${_fvId}" onclick="tvRevealNext('${_fvId}')">Read Fresh Vote (0/${revoteLog.length})</button>
      <div style="text-align:right;margin:-12px 0 14px">
        <button onclick="tvRevealAll('${_fvId}')" style="background:none;border:none;font-size:11px;color:#484f58;cursor:pointer;padding:2px 0;letter-spacing:0.3px">Skip to results ›</button>
      </div>
    </div>`;

    // Fresh vote results section
    html += `<div id="tv-results-${_fvId}" style="display:none">`;

    // Fresh vote final tally
    if (_fvSorted.length) {
      const _fvTotal = Object.values(_fvVotes).reduce((a,b) => a+b, 0);
      html += `<div class="tv-final-tally">
        <div class="tv-ft-header">Fresh Vote — Final Tally</div>`;
      _fvSorted.forEach(([name, count]) => {
        const _isOut = name === _fvElim;
        const _fvPct = Math.round((count / Math.max(1, _fvTotal)) * 100);
        html += `<div class="tv-ft-row ${_isOut ? 'tv-ft-elim' : ''}">
          ${rpPortrait(name)}
          <div class="tv-ft-name">${name}</div>
          <div class="tv-ft-bar-bg"><div class="tv-ft-bar" style="width:${_fvPct}%;background:${_isOut ? '#da3633' : '#30363d'}"></div></div>
          <div class="tv-ft-num">${count}</div>
          ${_isOut ? `<span style="font-size:9px;font-weight:800;letter-spacing:1px;padding:2px 8px;border-radius:4px;background:rgba(218,54,51,0.1);color:#da3633">${_fvIsBs ? 'BLINDSIDE' : 'ELIMINATED'}</span>` : ''}
        </div>`;
      });
      html += `</div>`;
    }

    // Fresh vote elimination card
    if (_fvElim) {
      html += _renderElimCard(_fvElim, _fvIsBs, ep.firstEliminated ? 1 : 0);
    }

    // Fresh vote WHY section
    if (_fvElim) {
      const _fvBullets = vpWhyBullets(_fvElim, revoteLog, ep.alliances, ep);
      if (_fvBullets.length) {
        html += `<div style="margin-top:28px;padding-top:18px;border-top:1px solid #21262d">
          <div style="font-size:9px;font-weight:800;letter-spacing:2px;color:#484f58;text-align:center;margin-bottom:18px">=== WHY THIS VOTE HAPPENED ===</div>
          ${vpWhyCard(_fvElim, _fvBullets, `${_fvElim} was voted out on the fresh vote because:`)}
        </div>`;
      }
    }

    html += `</div>`; // end tv-results-${_fvId}
  }

  // ── Announced double elim: second elimination card (from the same vote) ──
  if (ep.announcedDoubleElim && elim) {
    const _elim2Bs = pStats(elim).strategic >= 7;
    html += `<div style="margin:24px 0 16px;padding:10px 0;border-top:2px solid #30363d;text-align:center">
      <div style="font-size:9px;font-weight:800;letter-spacing:2px;color:#da3633">TWO PLAYERS ELIMINATED</div>
    </div>`;
    html += _renderElimCard(elim, _elim2Bs, 0);
  }

  // ── Exile duel pending: cliffhanger card (result revealed in Post-Elimination Twists screen) ──
  if (ep.exileDuelResult) {
    const _dr = ep.exileDuelResult;
    html += `<div class="rp-elim" style="background:radial-gradient(ellipse at 50% 30%,rgba(210,153,34,0.08) 0%,transparent 60%);border-color:rgba(210,153,34,0.2)">
      <div class="rp-elim-eyebrow" style="color:#d29922">2nd Chance Duel</div>
      <div style="display:flex;justify-content:center;align-items:flex-start;gap:28px;flex-wrap:wrap;margin:20px 0 18px">
        <div style="text-align:center">${rpPortrait(_dr.exilePlayer,'xl')}<div style="font-size:10px;color:#8b949e;margin-top:6px;font-weight:700;letter-spacing:0.5px">On Exile</div></div>
        <div style="align-self:center;font-size:28px;color:#30363d">vs</div>
        <div style="text-align:center">${rpPortrait(_dr.newBoot,'xl')}<div style="font-size:10px;color:#8b949e;margin-top:6px;font-weight:700;letter-spacing:0.5px">Just Voted Out</div></div>
      </div>
      <div style="font-size:13px;color:#cdd9e5;line-height:1.6;text-align:center;margin:0 0 8px">${_dr.exilePlayer} has been waiting. ${_dr.newBoot} just joined them.</div>
      <div style="font-size:12px;color:#8b949e;text-align:center">One challenge. One goes home for good. Continue to find out who.</div>
    </div>`;
  }

  // Blowup / Crashout — only show if the eliminated player is from THIS vote (not vote 2 in a double boot)
  // Skip entirely when fire-making (Second Life) is active — the actual elimination happens on the post-twist screen
  const _v1Target = ep.firstEliminated || elim;
  const _crashoutPlayer = ep.eliminated;
  const _showCrashout = !_hasFireMaking && (!ep.firstEliminated || _crashoutPlayer === _v1Target);
  const blowup = _showCrashout ? (ep.tribalBlowup || null) : null;
  const crashout = blowup ? null : (_showCrashout ? buildCrashout(ep) : null);
  if (blowup) {
    const _blowupSubtitle = blowup.trigger === 'temperament'
      ? `${blowup.player} — Couldn't Hold It In`
      : `${blowup.player} — Goes Out Swinging`;
    html += `<div class="tc-crashout">
      <div class="tc-crashout-header">
        ${rpPortrait(blowup.player, 'sm')}
        <div>
          <div class="tc-crashout-badge" style="background:rgba(248,81,73,0.15);color:#f85149">TRIBAL BLOWUP</div>
          <div class="tc-crashout-title">${_blowupSubtitle}</div>
        </div>
      </div>
      <div class="tc-crashout-reveal">`;
    blowup.reveals.forEach(({ text, consequence }) => {
      html += `<div class="tc-crashout-item">
        <div class="tc-crashout-quote">"${text}"</div>
        <div class="tc-crashout-consequence">↳ ${consequence}</div>
      </div>`;
    });
    html += `</div></div>`;
  } else if (crashout) {
    html += `<div class="tc-crashout">
      <div class="tc-crashout-header">
        ${rpPortrait(crashout.player, 'sm')}
        <div>
          <div class="tc-crashout-badge">CRASHOUT</div>
          <div class="tc-crashout-title">${crashout.player} — Last Words</div>
        </div>
      </div>
      <div class="tc-crashout-reveal">`;
    crashout.reveals.forEach(({ text, consequence }) => {
      html += `<div class="tc-crashout-item">
        <div class="tc-crashout-quote">"${text}"</div>
        <div class="tc-crashout-consequence">↳ ${consequence}</div>
      </div>`;
    });
    html += `</div></div>`;
  }

  // ── Alliance fallout: betrayals + quits that happened this episode ──
  const _allSnapAlliances = ep.gsSnapshot?.namedAlliances || [];
  const _epQuitMap = {};
  (ep.allianceQuits || []).forEach(q => {
    if (!_epQuitMap[q.alliance]) _epQuitMap[q.alliance] = [];
    _epQuitMap[q.alliance].push(q);
  });
  const _tribalSet = new Set(ep.tribalPlayers || []);
  const _alliancesWithFallout = _allSnapAlliances.filter(a => {
    // Only show fallout for betrayals/quits by players who were at THIS tribal
    const hasBetrayal = (a.betrayals || []).some(b => b.ep === ep.num && (_tribalSet.size === 0 || _tribalSet.has(b.player)));
    const hasQuit     = (_epQuitMap[a.name] || []).some(q => _tribalSet.size === 0 || _tribalSet.has(q.player));
    return hasBetrayal || hasQuit;
  });
  // Helper: distil a votingLog reason string into a short "why they didn't vote consensus" note
  const _betrayWhy = (reason, consensusWas) => {
    if (!reason) return null;
    const r = reason.toLowerCase();
    if (r.includes('preemptive') || r.includes('sensed they were being targeted'))
      return `made a preemptive strike instead — felt the vote coming their way`;
    if ((r.includes('protecting') || r.includes('protect')) && (r.includes('bond') || r.includes('expense') || r.includes('untouchable')))
      return `had too strong a bond to write ${consensusWas}'s name`;
    if (r.includes('two alliances') || r.includes('split') || r.includes('conflict') || r.includes('chose') && r.includes('over'))
      return `was pulled by a competing alliance`;
    if (r.includes('broke from their own bloc') || r.includes('cast a completely different ballot') || r.includes('stated plan was') || r.includes('went to tribal with a plan') || r.includes('the group followed the plan'))
      return `ran the plan publicly, privately voted elsewhere`;
    if (r.includes('personal animosity') || r.includes('pure hostility') || r.includes("can't work with"))
      return `personal conflict took priority over the plan`;
    if (r.includes('threat') || r.includes('winning too much'))
      return `saw a bigger threat that had to be addressed first`;
    if (r.includes('no other options'))
      return null;
    // Fallback: take the first clause if it's short enough
    const firstClause = reason.split(' — ')[0];
    return firstClause.length <= 70 ? firstClause : null;
  };

  if (_alliancesWithFallout.length) {
    html += `<div style="margin-top:20px">
      <div style="font-size:9px;font-weight:800;letter-spacing:2px;color:#484f58;margin-bottom:12px">ALLIANCE FALLOUT</div>`;
    _alliancesWithFallout.forEach(alliance => {
      const _tribalMembers = new Set(ep.tribalPlayers || []);
      const betrayalsThisEp = (alliance.betrayals || []).filter(b => b.ep === ep.num && (_tribalMembers.size === 0 || _tribalMembers.has(b.player)));
      const quitsThisEp     = (_epQuitMap[alliance.name] || []).filter(q => _tribalMembers.size === 0 || _tribalMembers.has(q.player));
      html += `<div style="background:#161b22;border:1px solid #21262d;border-radius:8px;padding:12px 14px;margin-bottom:10px">
        <div style="font-size:11px;font-weight:700;color:#e6edf3;margin-bottom:8px">${alliance.name}</div>`;
      betrayalsThisEp.forEach(b => {
        const slug = (players.find(p=>p.name===b.player)?.slug) || b.player.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'');
        const votedAnAlly = alliance.members.includes(b.votedFor);
        const allyNote    = votedAnAlly ? ` — targeted their own ally` : '';
        const newNote     = b.formedThisEp ? ` Brand new alliance; the bonds never had time to hold.` : '';
        const btLogEntry  = (ep.votingLog || []).find(l => l.voter === b.player);
        const btWhy       = _betrayWhy(btLogEntry?.reason || b.reason, b.consensusWas);
        const whyNote     = btWhy ? ` Didn't vote ${b.consensusWas}: ${btWhy}.` : '';
        html += `<div style="display:flex;align-items:center;gap:10px;margin-bottom:6px">
          ${rpPortrait(b.player, 'sm')}
          <div>
            <span style="font-size:9px;font-weight:800;letter-spacing:1px;color:#f97316;margin-right:6px">BROKE RANK</span>
            <span style="font-size:11px;color:#8b949e">voted <strong style="color:#c9d1d9">${b.votedFor}</strong> instead of <strong style="color:#c9d1d9">${b.consensusWas}</strong>${allyNote}.${newNote}${whyNote}</span>
          </div>
        </div>`;
      });
      quitsThisEp.forEach(q => {
        const slug = (players.find(p=>p.name===q.player)?.slug) || q.player.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'');
        const reasonNote = q.reason ? ` (${q.reason})` : '';
        html += `<div style="display:flex;align-items:center;gap:10px;margin-bottom:6px">
          ${rpPortrait(q.player, 'sm')}
          <div>
            <span style="font-size:9px;font-weight:800;letter-spacing:1px;color:#f85149;margin-right:6px">LEFT</span>
            <span style="font-size:11px;color:#8b949e">departed the alliance${reasonNote}.</span>
          </div>
        </div>`;
      });
      html += `</div>`;
    });
    html += `</div>`;
  }

  // ── WHY THIS VOTE HAPPENED ──
  // Helper: build standard vote-analysis bullets for a named player
  // _whyBullets / _whyCard are global — use aliases that bind ep automatically
  const _whyBullets = (name, votelog, alliances) => vpWhyBullets(name, votelog, alliances, ep);
  const _whyCard = vpWhyCard;

  const _whyElim = ep.exileDuelVotedOut || ep.eliminated; // exile duel: WHY is about who was voted out, not who lost the duel
  if (_whyElim) {
    let _whyInner = '';

    if (ep.firstEliminated && ep.announcedDoubleElim) {
      // Announced double elim — both eliminated in same vote, show both WHY cards here
      const _de1Bullets = _whyBullets(ep.firstEliminated, ep.votingLog, ep.alliances);
      _whyInner += _whyCard(ep.firstEliminated, _de1Bullets, `${ep.firstEliminated} — Most Votes (Double Elim)`);
      _whyInner += `<div style="border-top:1px solid #21262d;margin:14px 0"></div>`;
      const _de2Bullets = _whyBullets(_whyElim, ep.votingLog, ep.alliances);
      _whyInner += _whyCard(_whyElim, _de2Bullets, `${_whyElim} — Second Most Votes (Double Elim)`);

    } else if (ep.firstEliminated && !ep.announcedDoubleElim && !ep.sidFreshVote) {
      // Surprise double boot (no fresh vote) — only vote 1 WHY here; vote 2 WHY is on the Vote 2 screen
      const _de1TBR = ep.tiebreakerResult1;
      let _de1Bullets;
      if (_de1TBR) {
        _de1Bullets = [`Tied with ${_de1TBR.participants.filter(p=>p!==ep.firstEliminated).join(', ')} — went to a head-to-head ${_de1TBR.challengeLabel} tiebreaker.`, `Lost the challenge. ${_de1TBR.winner} is safe. ${ep.firstEliminated} is out.`];
      } else {
        _de1Bullets = _whyBullets(ep.firstEliminated, ep.votingLog, ep.alliances);
      }
      _whyInner = _whyCard(ep.firstEliminated, _de1Bullets, `${ep.firstEliminated} — Voted Out`);

    } else if (ep.isRockDraw) {
      // Rock draw — pure chance, no vote cast against them
      const _rdBullets = [];
      const _rdTied = ep.tiedPlayers || [];
      const _rdOther = _rdTied.filter(p => p !== _whyElim);
      if (ep.isFullDeadlock) {
        _rdBullets.push(`Not a vote — everyone drew rocks after a complete deadlock. Every player received exactly one vote and no majority could be reached on the revote.`);
        _rdBullets.push(`The entire non-immune tribe was at risk. ${_whyElim} drew the wrong rock. Pure chance eliminated them.`);
      } else {
        _rdBullets.push(`Not eliminated by vote — ${_whyElim} never had a single ballot cast against them.`);
        _rdBullets.push(`The vote tied ${ep.isTie ? `between ${_rdTied.join(' and ')}` : ''}. Non-tied, non-immune players drew rocks. ${_whyElim} drew the wrong one.`);
        _rdBullets.push(`No strategic read here — they were collateral damage in someone else's stalemate.`);
      }
      // Still show who was in the original tie
      if (_rdOther.length) _rdBullets.push(`Original tie participants: ${_rdTied.join(', ')} — neither went home.`);
      _whyInner = _whyCard(_whyElim, _rdBullets, `${_whyElim} — Eliminated by Rock Draw`);

    } else if (ep.fireMaking) {
      const fm = ep.fireMaking;
      const _fmVotedOut = fm.player; // person voted out at tribal
      // WHY card on the vote screen is always about the VOTE — why did the tribe target this person?
      const _fmVoteBullets = _whyBullets(_fmVotedOut, ep.votingLog, ep.alliances);
      _fmVoteBullets.push(`${_fmVotedOut} activated Second Life — the duel result is below.`);
      _whyInner = _whyCard(_fmVotedOut, _fmVoteBullets, `${_fmVotedOut} — Voted Out (Second Life)`);

    } else if (ep.tiebreakerResult && ep.tiebreakerResult.loser === _whyElim) {
      // Tiebreaker challenge
      const tr = ep.tiebreakerResult;
      const _tbBullets = _whyBullets(_whyElim, ep.votingLog, ep.alliances);
      _tbBullets.push(`The vote tied ${ep.isTie ? `between ${(ep.tiedPlayers||[]).join(' and ')}` : 'at tribal'} — no revote, straight to a head-to-head ${tr.challengeLabel} challenge.`);
      _tbBullets.push(`${_whyElim} lost the tiebreaker to ${tr.winner}. ${tr.winner} is safe. ${_whyElim} is out.`);
      _whyInner = _whyCard(_whyElim, _tbBullets, `${_whyElim} — Eliminated in Tiebreaker`);

    } else if (ep.isTie && ep.revoteLog && !ep.isRockDraw && !ep.sidFreshVote && ep.tiedPlayers?.includes(_whyElim)) {
      // Revote
      const _rvOther = ep.tiedPlayers.find(p => p !== _whyElim);
      const _rvBullets = [];
      const _rvInitFor = (ep.votingLog||[]).filter(l => l.voted === _whyElim).map(l => l.voter);
      const _rvInitOther = _rvOther ? (ep.votingLog||[]).filter(l => l.voted === _rvOther).map(l => l.voter) : [];
      _rvBullets.push(`Initial vote tied ${_rvInitFor.length}-${_rvInitOther.length} with ${_rvOther || 'another player'}: ${_rvInitFor.join(', ')} vs ${_rvInitOther.join(', ')}.`);
      const held = ep.revoteLog.filter(r => { const orig = (ep.votingLog||[]).find(l => l.voter === r.voter)?.voted; return r.voted === orig; });
      const flipped = ep.revoteLog.filter(r => { const orig = (ep.votingLog||[]).find(l => l.voter === r.voter)?.voted; return r.voted !== orig; });
      if (held.length) _rvBullets.push(`Held firm on ${_whyElim}: ${held.filter(r=>r.voted===_whyElim).map(r=>r.voter).join(', ') || 'nobody'}.`);
      if (flipped.length) {
        const flippedTo = flipped.filter(r => r.voted === _whyElim);
        const flippedAway = flipped.filter(r => r.voted !== _whyElim);
        if (flippedTo.length) _rvBullets.push(`Flipped to ${_whyElim} on the revote: ${flippedTo.map(r=>r.voter).join(', ')}.`);
        if (flippedAway.length) _rvBullets.push(`Flipped away from ${_whyElim}: ${flippedAway.map(r=>r.voter).join(', ')}.`);
      }
      _rvBullets.push(..._whyBullets(_whyElim, ep.votingLog, ep.alliances).filter((_,i) => i === 0)); // just the primary reason for why they were targeted
      _whyInner = _whyCard(_whyElim, _rvBullets, `${_whyElim} — Eliminated on Revote`);

    } else if (!ep.sidFreshVote) {
      // Standard elimination (fresh vote WHY is inside the fresh vote interactive section above)
      _whyInner = _whyCard(_whyElim, _whyBullets(_whyElim, ep.votingLog, ep.alliances), `${_whyElim} was voted out because:`);
    }

    // Volunteer Exile Duel context in WHY
    if (ep.volunteerDuel && _whyInner) {
      const vd = ep.volunteerDuel;
      if (vd.granted && _whyElim === vd.volunteer) {
        _whyInner += `<div style="margin-top:12px;padding:10px;border:1px solid rgba(129,140,248,0.2);border-radius:8px;background:rgba(129,140,248,0.04)">
          <div style="font-size:10px;color:#818cf8;font-weight:700;letter-spacing:1px;margin-bottom:4px">VOLUNTEER EXILE DUEL</div>
          <div style="font-size:12px;color:#c9d1d9">${vd.volunteer} volunteered to be voted out — asked the tribe to send ${pronouns(vd.volunteer).obj} to face ${vd.rival} at the duel. The tribe agreed.</div>
        </div>`;
      } else if (!vd.granted) {
        _whyInner += `<div style="margin-top:12px;padding:10px;border:1px solid rgba(139,148,158,0.15);border-radius:8px;background:rgba(139,148,158,0.03)">
          <div style="font-size:10px;color:#8b949e;font-weight:700;letter-spacing:1px;margin-bottom:4px">VOLUNTEER REJECTED</div>
          <div style="font-size:12px;color:#8b949e">${vd.volunteer} volunteered for the duel against ${vd.rival}, but the tribe had other priorities tonight.</div>
        </div>`;
      }
    }

    if (_whyInner) {
      html += `<div style="margin-top:28px;border-top:1px solid #21262d;padding-top:20px">
        <div style="font-size:9px;font-weight:800;letter-spacing:2px;color:#484f58;margin-bottom:14px">=== WHY THIS VOTE HAPPENED ===</div>
        ${_whyInner}
      </div>`;
    }
  }

  // Mole exposure now has its own dedicated VP screen — no inline card here

  // ── THE MOLE: vote disruption reveal (viewer-only — shows how the Mole influenced the vote) ──
  if (ep.moleVoteDisruptions?.length) {
    html += `<div style="margin-top:20px;padding:14px;border:2px solid rgba(248,81,73,0.3);border-radius:10px;background:rgba(248,81,73,0.03)">
      <div style="font-size:9px;font-weight:800;letter-spacing:2px;color:#f85149;margin-bottom:10px;text-align:center">MOLE DISRUPTION</div>`;
    ep.moleVoteDisruptions.forEach(vd => {
      if (vd.type === 'rogue') {
        const mp = pronouns(vd.voter);
        html += `<div style="display:flex;align-items:center;gap:10px;padding:8px;margin-bottom:6px;background:rgba(248,81,73,0.05);border-radius:6px">
          ${rpPortrait(vd.voter, 'sm')}
          <div style="flex:1">
            <div style="font-size:12px;color:#e6edf3"><strong>${vd.voter}</strong> went rogue — voted <strong style="color:#f85149">${vd.rogueTarget}</strong> instead of the plan (${vd.originalTarget}).</div>
            <div style="font-size:10px;color:#8b949e;margin-top:2px">${mp.Sub} broke from the alliance to create chaos. The tribe doesn't know why.</div>
          </div>
          <span class="rp-brant-badge red" style="font-size:9px">MOLE</span>
        </div>`;
      } else if (vd.type === 'pitch') {
        html += `<div style="display:flex;align-items:center;gap:10px;padding:8px;margin-bottom:6px;background:rgba(248,81,73,0.05);border-radius:6px">
          ${rpPortrait(vd.pitcher, 'sm')}
          <div style="flex:1">
            <div style="font-size:12px;color:#e6edf3"><strong>${vd.pitcher}</strong> whispered to <strong>${vd.swayed}</strong> before the vote — redirecting ${pronouns(vd.swayed).posAdj} vote to <strong style="color:#f85149">${vd.newTarget}</strong>.</div>
            <div style="font-size:10px;color:#8b949e;margin-top:2px">A quiet word at the right moment. ${vd.swayed} changed ${pronouns(vd.swayed).posAdj} vote without realizing who was pulling the strings.</div>
          </div>
          <span class="rp-brant-badge red" style="font-size:9px">MOLE</span>
        </div>`;
      }
    });
    html += `</div>`;
  }

  // Torch-snuff: use firstEliminated for vote-1 in double boot, else use elim
  // Skip when fire-making (Second Life) — duel result shown in Aftermath, torch here would spoil it
  const _torchElim = ep.firstEliminated || (_hasFireMaking ? null : elim);
  if (_torchElim) {
    html += `<div id="torch-snuff-${ep.num}" style="text-align:center;margin-top:24px">
      <div class="torch-snuffed">${rpPortrait(_torchElim, 'xl')}</div>
      <div style="font-family:var(--font-display);font-size:24px;color:var(--accent-fire);margin-top:16px;text-shadow:0 0 12px var(--accent-fire)">The tribe has spoken.</div>
    </div>`;
    // Black Vote: eliminated player casts their parting shot
    // Match the correct black vote to the eliminated player shown
    const _bvc = [ep.blackVote1, ep.blackVote, ep.blackVote2].find(bv => bv && bv.from === _torchElim) || ep.blackVote;
    if (_bvc) {
      html += `<div style="margin-top:16px;padding:12px;border:1px solid rgba(99,102,241,0.25);border-radius:8px;background:rgba(99,102,241,0.04);text-align:center">
        <div style="font-size:9px;font-weight:700;letter-spacing:2px;color:#818cf8;margin-bottom:6px">BLACK VOTE CAST</div>
        <div style="font-size:12px;color:#c9d1d9;line-height:1.5">${
          _bvc.type === 'classic'
            ? `Before leaving, ${_bvc.from} casts a Black Vote against <strong style="color:#f85149">${_bvc.target}</strong>. This vote will count at the next tribal council.`
            : `Before leaving, ${_bvc.from} gifts an Extra Vote to <strong style="color:#3fb950">${_bvc.recipient}</strong>. "${pronouns(_bvc.from).Sub} earned it," ${_bvc.from} says.`
        }</div>
        <div style="display:flex;justify-content:center;gap:8px;margin-top:8px">
          ${rpPortrait(_bvc.from, 'sm')}
          <span style="font-size:16px;color:#818cf8;align-self:center">\u2192</span>
          ${rpPortrait(_bvc.type === 'classic' ? _bvc.target : _bvc.recipient, 'sm')}
        </div>
        <div style="font-size:10px;color:#8b949e;margin-top:6px;font-style:italic">${_bvc.reason || ''}</div>
      </div>`;
    }
  }

  // ── THE MOLE: undiscovered reveal — shows after torch snuff ──
  if (elim && gs.moles?.length) {
    const _moleSnap = ep.gsSnapshot?.moles || gs.moles;
    const _elimMole = _moleSnap.find(m => m.player === elim && !m.exposed);
    if (_elimMole && _elimMole.sabotageCount > 0) {
      const mp = pronouns(elim);
      const _sabTypes = [...new Set(_elimMole.sabotageLog.map(s => s.type))];
      const _sabDesc = _sabTypes.map(t => t === 'bondSabotage' ? 'fabricated conflicts' : t === 'infoLeak' ? 'leaked intel' : t === 'voteDisruption' ? 'disrupted votes' : t === 'challengeThrow' ? 'threw challenges' : t === 'advantageSabotage' ? 'sabotaged advantages' : t).join(', ');
      html += `<div style="margin-top:24px;padding:16px;border:2px solid rgba(248,81,73,0.4);border-radius:10px;background:rgba(248,81,73,0.04);text-align:center">
        <div style="font-size:9px;font-weight:800;letter-spacing:3px;color:#f85149;margin-bottom:10px">WHAT THE TRIBE NEVER KNEW</div>
        ${rpPortrait(elim, 'lg')}
        <div style="font-family:var(--font-display);font-size:18px;color:#f85149;margin-top:8px;letter-spacing:1px">THE MOLE</div>
        <div style="font-size:12px;color:#c9d1d9;margin-top:8px;line-height:1.6">
          ${elim} was The Mole. <strong>${_elimMole.sabotageCount}</strong> acts of sabotage — ${_sabDesc} — and nobody figured it out.
          ${mp.Sub} ${mp.sub === 'they' ? 'leave' : 'leaves'} with ${mp.posAdj} secret intact.
        </div>
        <div style="margin-top:12px;padding:10px;background:rgba(139,148,158,0.06);border-radius:6px;font-style:italic;font-size:11px;color:#8b949e;line-height:1.5">
          "${mp.Sub === 'They' ? 'They' : mp.Sub} never figured it out. Every fight, every broken alliance — that was me. And they voted me out for the wrong reasons."
        </div>
      </div>`;
    }
  }

  // ── TIED DESTINIES: partner elimination card + partner WHY ──
  if (ep.tiedDestinies?.eliminatedPartner && elim) {
    const _tdPartner = ep.tiedDestinies.eliminatedPartner;
    const _tdTarget = ep.tiedDestinies.eliminatedTarget;
    const _tdPr = pronouns(_tdPartner);
    const _place2 = (ep.gsSnapshot?.activePlayers ?? gs.activePlayers).length; // partner is one after
    const _tdExitQuotes = [
      `"I didn't get voted out. I got tied to the wrong person."`,
      `"They weren't coming for me. But here I am."`,
      `"I played a good game. I just got paired with the wrong person at the wrong time."`,
      `"That's the cruelest twist this game has ever thrown. I was safe until they drew my name next to theirs."`,
      `"${_tdTarget} took me down with ${pronouns(_tdTarget).obj}. I'll never forgive this game for that."`,
    ];
    html += `<div style="margin-top:28px;border-top:2px solid rgba(129,140,248,0.3);padding-top:20px">
      <div style="font-size:9px;font-weight:800;letter-spacing:3px;color:#818cf8;text-align:center;margin-bottom:12px">TIED DESTINIES — COLLATERAL</div>
      <div class="rp-elim">
        <div class="rp-elim-eyebrow">${ordinal(_place2)} player eliminated</div>
        ${rpPortrait(_tdPartner, 'xl elim')}
        <div class="rp-elim-name">${_tdPartner}</div>
        <div class="rp-elim-arch">${vpArchLabel(_tdPartner)}</div>
        <div class="rp-elim-quote">${_tdExitQuotes[Math.floor(Math.random() * _tdExitQuotes.length)]}</div>
        <div class="rp-elim-place">Eliminated by Tied Destinies — Episode ${ep.num}</div>
      </div>
      <div id="torch-snuff-td-${ep.num}" style="text-align:center;margin-top:16px">
        <div class="torch-snuffed">${rpPortrait(_tdPartner, 'xl')}</div>
        <div style="font-family:var(--font-display);font-size:20px;color:#818cf8;margin-top:12px;text-shadow:0 0 12px rgba(129,140,248,0.4)">Tied Destinies has spoken.</div>
      </div>`;
    // Partner WHY
    html += `<div style="margin-top:20px;border-top:1px solid #21262d;padding-top:16px">
      <div style="font-size:9px;font-weight:800;letter-spacing:2px;color:#484f58;margin-bottom:10px">=== WHY ${_tdPartner.toUpperCase()} WAS ELIMINATED ===</div>
      <div style="padding:10px;background:rgba(129,140,248,0.04);border:1px solid rgba(129,140,248,0.15);border-radius:8px">
        ${rpPortrait(_tdPartner, 'sm')}
        <div style="font-size:12px;color:#c9d1d9;margin-top:8px;line-height:1.6">
          ${_tdPartner} wasn't the target. ${_tdPr.Sub} ${_tdPr.sub === 'they' ? 'were' : 'was'} tied to ${_tdTarget} by the Tied Destinies twist.
          When the tribe voted ${_tdTarget} out, ${_tdPartner} went with ${pronouns(_tdTarget).obj}.
          ${threatScore(_tdTarget) > threatScore(_tdPartner)
            ? `The vote was about removing ${_tdTarget} — ${_tdPartner} was collateral damage.`
            : `Some votes may have targeted ${_tdTarget} specifically to take ${_tdPartner} out — the affordable path to a double elimination.`}
        </div>
      </div>
    </div>`;
    html += `</div>`;
  }

  html += `</div></div>`; // end tv-results + rp-page
  return html;
}

// ── Interactive vote reveal ──
export const _tvState = {};

// Tied Destinies paired challenge reveal
export function tdRevealNext(key) {
  const el = document.getElementById(key);
  if (!el) return;
  const revealed = parseInt(el.dataset.revealed || '0');
  const data = window._tdRevealData?.[key];
  if (!data || revealed >= data.length) return;
  const p = data[revealed];
  const slot = document.getElementById(key + '-slot-' + revealed);
  const content = document.getElementById(key + '-content-' + revealed);
  if (slot && content) {
    slot.innerHTML = content.innerHTML;
    slot.style.opacity = '1';
    slot.style.border = p.isWinner ? '1px solid rgba(63,185,80,0.3)' : '1px solid rgba(139,148,158,0.1)';
    slot.style.background = p.isWinner ? 'rgba(63,185,80,0.04)' : 'transparent';
    slot.style.animation = 'staggerIn 0.35s var(--ease-broadcast) both';
    if (p.isWinner) slot.style.boxShadow = '0 0 0 1px var(--accent-gold)';
  }
  el.dataset.revealed = revealed + 1;
}
export function tdRevealAll(key) {
  const el = document.getElementById(key);
  if (!el) return;
  const data = window._tdRevealData?.[key];
  if (!data) return;
  for (let r = parseInt(el.dataset.revealed || '0'); r < data.length; r++) {
    const p = data[r];
    const slot = document.getElementById(key + '-slot-' + r);
    const content = document.getElementById(key + '-content-' + r);
    if (slot && content) {
      slot.innerHTML = content.innerHTML;
      slot.style.opacity = '1';
      slot.style.border = p.isWinner ? '1px solid rgba(63,185,80,0.3)' : '1px solid rgba(139,148,158,0.1)';
      slot.style.background = p.isWinner ? 'rgba(63,185,80,0.04)' : 'transparent';
      slot.style.animation = 'staggerIn 0.35s var(--ease-broadcast) both';
      if (p.isWinner) slot.style.boxShadow = '0 0 0 1px var(--accent-gold)';
    }
  }
  el.dataset.revealed = data.length;
}

export function tvRevealNext(epNum) {
  if (!_tvState[epNum]) _tvState[epNum] = { revealed: 0, tallyCounts: {}, revoteCounts: {} };
  const state = _tvState[epNum];
  if (state.flipping) return;
  const cards = document.querySelectorAll(`#tv-cards-${epNum} .tv-vote-card`);
  if (!cards.length) return;
  cards.forEach(c => c.classList.remove('tv-latest'));
  if (state.revealed >= cards.length) return;

  const card = cards[state.revealed];
  const isRevote = card.dataset.revote === '1';
  state.flipping = true;

  // ── Beat 1: Spotlight (0→200ms) ──
  cards.forEach(c => { if (c !== card) c.classList.add('tv-spotlight-dim'); });
  const tallyPanel = document.getElementById(`tv-tally-${epNum}`);
  if (tallyPanel) tallyPanel.classList.add('tv-spotlight-dim');
  card.classList.add('tv-spotlight-active');

  // ── Beat 2: Flip (200→700ms) ──
  setTimeout(() => {
    card.classList.add('tv-flipping');
    setTimeout(() => {
      card.classList.add('tv-revealed', 'tv-latest');
      const voted = card.dataset.voted;

      // ── Beat 3: Vote Flies (700→1100ms) ──
      if (voted) {
        _tvFireVoteFly(card, epNum, voted, isRevote);
        if (isRevote) {
          const rvPanel = document.getElementById(`tv-tally-rv-${epNum}`);
          if (rvPanel && rvPanel.style.display === 'none') rvPanel.style.display = '';
          state.revoteCounts[voted] = (state.revoteCounts[voted] || 0) + 1;
        } else {
          state.tallyCounts[voted] = (state.tallyCounts[voted] || 0) + 1;
        }
      }
    }, 250); // midpoint of flip

    // ── Beat 4: Tally Reacts (1100→1500ms from start = 400ms after vote fly starts) ──
    setTimeout(() => {
      card.classList.remove('tv-flipping');
      const voted = card.dataset.voted;
      if (voted) {
        if (isRevote) {
          _tvUpdateRevoteTally(epNum, state);
        } else {
          _tvUpdateTally(epNum, state);
          _tvCheckThresholds(epNum, state);
        }
      }
      // Restore spotlight
      cards.forEach(c => c.classList.remove('tv-spotlight-dim'));
      if (tallyPanel) tallyPanel.classList.remove('tv-spotlight-dim');
      card.classList.remove('tv-spotlight-active');
      state.flipping = false;
    }, 800); // 200ms beat1 + 500ms flip + 100ms settle
  }, 200); // beat 1 duration

  state.revealed++;
  const btn = document.getElementById(`tv-btn-${epNum}`);
  if (state.revealed >= cards.length) {
    if (btn) { btn.textContent = 'See Results \u25bc'; btn.onclick = () => tvShowResults(epNum); }
  } else {
    if (btn) btn.textContent = `Read the Vote (${state.revealed}/${cards.length})`;
  }
}

export function _tvFireVoteFly(cardEl, epNum, voted, isRevote) {
  const slug = voted.replace(/[^a-zA-Z0-9]/g, '');
  const tallyId = isRevote ? `tv-tally-rv-${epNum}` : `tv-tally-${epNum}`;
  const targetRow = document.querySelector(`#${tallyId} .tv-tally-row[data-name="${voted}"]`);
  if (!targetRow) return;

  const sourceEl = cardEl.querySelector('.tv-vote-target') || cardEl;
  const srcRect = sourceEl.getBoundingClientRect();
  const dstRect = targetRow.getBoundingClientRect();

  const fly = document.createElement('div');
  fly.className = 'tv-vote-fly';
  fly.textContent = voted;
  fly.style.left = srcRect.left + 'px';
  fly.style.top = srcRect.top + 'px';
  document.body.appendChild(fly);

  const dx = dstRect.left - srcRect.left;
  const dy = dstRect.top - srcRect.top;
  const duration = 400;
  const start = performance.now();

  function animate(now) {
    const t = Math.min((now - start) / duration, 1);
    const ease = 1 - Math.pow(1 - t, 3);
    fly.style.left = (srcRect.left + dx * ease) + 'px';
    fly.style.top = (srcRect.top + dy * ease) + 'px';
    fly.style.opacity = String(0.6 * (1 - t * 0.5));
    fly.style.filter = `blur(${t * 2}px)`;
    if (t < 1) {
      requestAnimationFrame(animate);
    } else {
      fly.remove();
    }
  }
  requestAnimationFrame(animate);
}

export function tvShowResults(epNum) {
  const btn = document.getElementById(`tv-btn-${epNum}`);
  if (btn) btn.style.display = 'none';
  const res = document.getElementById(`tv-results-${epNum}`);
  if (res) { res.style.display = 'block'; res.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
  // Fire torch snuff flame effect
  const snuffEl = document.querySelector(`#torch-snuff-${epNum} .torch-snuffed`);
  if (snuffEl) torchSnuffFx(snuffEl);
}

// ── Torch Snuff: flame → burst → desaturate ──
export function torchSnuffFx(el) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const c = document.createElement('canvas');
  c.className = 'torch-snuff-canvas';
  c.width = 200; c.height = 120;
  el.appendChild(c);
  const ctx = c.getContext('2d');
  const colors = ['#e8873a','#f0c040','#c45a1a','#ff6b2b','#ffdb70'];
  const particles = [];
  const cx = 100, cy = 105; // flame origin: bottom-center of canvas
  let frame = 0;
  const FLAME_END = 90;   // ~1.5s at 60fps
  const BURST_AT = 90;
  const TOTAL = 180;      // ~3s total

  function spawn(type) {
    return {
      x: cx + (Math.random()-0.5) * 8,
      y: cy,
      vx: type === 'burst' ? (Math.random()-0.5) * 6 : (Math.random()-0.5) * 0.8,
      vy: type === 'burst' ? -Math.random() * 6 - 2 : -Math.random() * 1.5 - 0.5,
      sz: type === 'burst' ? 2 + Math.random() * 3.5 : 1.5 + Math.random() * 2.5,
      color: colors[Math.floor(Math.random() * colors.length)],
      life: 0, maxLife: type === 'burst' ? 40 + Math.random() * 40 : 15 + Math.random() * 25,
      type,
    };
  }

  function tick() {
    ctx.clearRect(0, 0, 200, 120);
    frame++;
    // Phase 1: flame particles (shrinking over time)
    if (frame < FLAME_END) {
      const intensity = 1 - (frame / FLAME_END);
      const count = Math.floor(3 * intensity) + 1;
      for (let i = 0; i < count; i++) particles.push(spawn('flame'));
    }
    // Phase 2: burst
    if (frame === BURST_AT) {
      for (let i = 0; i < 45; i++) particles.push(spawn('burst'));
    }

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life++;
      p.x += p.vx;
      p.y += p.vy;
      if (p.type === 'burst') p.vy += 0.08; // gravity
      const r = p.life / p.maxLife;
      let a = r < 0.15 ? r / 0.15 : (1 - r) / 0.85;
      if (p.type === 'flame') {
        const shrink = 1 - (frame / FLAME_END);
        a *= Math.max(shrink, 0);
      }
      if (p.life >= p.maxLife) { particles.splice(i, 1); continue; }
      ctx.globalAlpha = a * 0.8;
      ctx.shadowBlur = p.sz * 3;
      ctx.shadowColor = p.color;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.sz * (1 - r * 0.5), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
    if (frame < TOTAL && (particles.length > 0 || frame < BURST_AT + 10)) {
      requestAnimationFrame(tick);
    } else {
      c.remove();
    }
  }
  requestAnimationFrame(tick);
}

export function tvRevealAll(epNum) {
  if (!_tvState[epNum]) _tvState[epNum] = { revealed: 0, tallyCounts: {}, revoteCounts: {} };
  const state = _tvState[epNum];
  state.flipping = false;
  const cards = document.querySelectorAll(`#tv-cards-${epNum} .tv-vote-card`);
  // Clean up any lingering spotlight/animation classes
  cards.forEach(c => c.classList.remove('tv-spotlight-dim', 'tv-spotlight-active', 'tv-flipping'));
  const tallyPanel = document.getElementById(`tv-tally-${epNum}`);
  if (tallyPanel) tallyPanel.classList.remove('tv-spotlight-dim');

  cards.forEach(card => {
    card.classList.add('tv-revealed');
    card.classList.remove('tv-latest');
    const voted = card.dataset.voted;
    const isRevote = card.dataset.revote === '1';
    if (voted) {
      if (isRevote) {
        state.revoteCounts[voted] = (state.revoteCounts[voted] || 0) + 1;
      } else {
        state.tallyCounts[voted] = (state.tallyCounts[voted] || 0) + 1;
      }
    }
  });
  state.revealed = cards.length;
  _tvUpdateTally(epNum, state);
  _tvCheckThresholds(epNum, state);
  // Show + update revote tally if any revote cards exist
  if (Object.keys(state.revoteCounts).length) {
    const rvPanel = document.getElementById(`tv-tally-rv-${epNum}`);
    if (rvPanel) rvPanel.style.display = '';
    _tvUpdateRevoteTally(epNum, state);
  }
  const btn = document.getElementById(`tv-btn-${epNum}`);
  if (btn) btn.style.display = 'none';
  btn?.parentElement?.querySelectorAll('button').forEach(b => b.style.display = 'none');
  // Clear threshold banner before showing results
  const thresholdSlot = document.getElementById(`tv-threshold-${epNum}`);
  if (thresholdSlot) { thresholdSlot.style.display = 'none'; thresholdSlot.innerHTML = ''; }
  tvShowResults(epNum);
}

export function _tvUpdateTally(epNum, state) {
  const maxCount = Math.max(...Object.values(state.tallyCounts), 1);
  const leadCount = maxCount;
  const leaders = Object.entries(state.tallyCounts).filter(([,c]) => c === leadCount && c > 0);
  const isTied = leaders.length > 1;

  Object.entries(state.tallyCounts).forEach(([name, count]) => {
    const slug = name.replace(/[^a-zA-Z0-9]/g, '');
    const countEl = document.getElementById(`tv-tc-${epNum}-${slug}`);
    const barEl = document.getElementById(`tv-tb-${epNum}-${slug}`);
    const flameEl = document.getElementById(`tv-tf-${epNum}-${slug}`);
    const rowEl = document.querySelector(`#tv-tally-${epNum} .tv-tally-row[data-name="${name}"]`);
    if (countEl) {
      countEl.textContent = count;
      countEl.classList.remove('tv-count-bounce');
      void countEl.offsetWidth;
      countEl.classList.add('tv-count-bounce');
    }
    if (barEl) barEl.style.width = `${Math.round((count / maxCount) * 100)}%`;
    if (rowEl) {
      if (!rowEl.classList.contains('tv-tally-visible')) rowEl.classList.add('tv-tally-visible');
      const isLeading = count === leadCount && count > 0;
      rowEl.classList.toggle('tv-tally-leading', isLeading);
      rowEl.classList.toggle('tv-tally-tied', isLeading && isTied);
    }
    if (flameEl) {
      flameEl.className = 'tv-tally-torch-flame';
      const isLeading = count === leadCount && count > 0;
      if (count === 0) { /* unlit */ }
      else if (isLeading && count >= 3) flameEl.classList.add('tv-flame-max');
      else if (isLeading) flameEl.classList.add('tv-flame-high');
      else flameEl.classList.add('tv-flame-low');
    }
  });
  // Clear leading/tied from names with 0 count
  const tally = document.getElementById(`tv-tally-${epNum}`);
  if (tally) {
    tally.querySelectorAll('.tv-tally-row').forEach(row => {
      const rName = row.dataset.name;
      if (!state.tallyCounts[rName]) {
        row.classList.remove('tv-tally-leading', 'tv-tally-tied');
      }
    });
    // Tied badge
    let badge = tally.querySelector('.tv-tally-tied-badge');
    if (isTied) {
      if (!badge) {
        badge = document.createElement('div');
        badge.className = 'tv-tally-tied-badge';
        const lastLeader = [...tally.querySelectorAll('.tv-tally-leading')].pop();
        if (lastLeader) lastLeader.after(badge);
      }
      badge.textContent = 'TIED';
      badge.style.display = '';
    } else if (badge) {
      badge.style.display = 'none';
    }
  }
}

export function _tvUpdateRevoteTally(epNum, state) {
  const maxCount = Math.max(...Object.values(state.revoteCounts), 1);
  const leaders = Object.entries(state.revoteCounts).filter(([,c]) => c === maxCount && c > 0);
  const isTied = leaders.length > 1;
  Object.entries(state.revoteCounts).forEach(([name, count]) => {
    const slug = name.replace(/[^a-zA-Z0-9]/g, '');
    const countEl = document.getElementById(`tv-tc-rv-${epNum}-${slug}`);
    const barEl = document.getElementById(`tv-tb-rv-${epNum}-${slug}`);
    const flameEl = document.getElementById(`tv-tf-rv-${epNum}-${slug}`);
    const rowEl = document.querySelector(`#tv-tally-rv-${epNum} .tv-tally-row[data-name="${name}"]`);
    if (countEl) {
      countEl.textContent = count;
      countEl.classList.remove('tv-count-bounce');
      void countEl.offsetWidth;
      countEl.classList.add('tv-count-bounce');
    }
    if (barEl) barEl.style.width = `${Math.round((count / maxCount) * 100)}%`;
    if (rowEl) {
      if (!rowEl.classList.contains('tv-tally-visible')) rowEl.classList.add('tv-tally-visible');
      const isLeading = count === maxCount && count > 0;
      rowEl.classList.toggle('tv-tally-leading', isLeading);
      rowEl.classList.toggle('tv-tally-tied', isLeading && isTied);
    }
    if (flameEl) {
      flameEl.className = 'tv-tally-torch-flame';
      const isLeading = count === maxCount && count > 0;
      if (count === 0) { /* unlit */ }
      else if (isLeading && count >= 3) flameEl.classList.add('tv-flame-max');
      else if (isLeading) flameEl.classList.add('tv-flame-high');
      else flameEl.classList.add('tv-flame-low');
    }
  });
}

export function _tvCheckThresholds(epNum, state) {
  const tallyPanel = document.getElementById(`tv-tally-${epNum}`);
  if (!tallyPanel) return;
  const majority = parseInt(tallyPanel.dataset.majority) || 999;
  const thresholdSlot = document.getElementById(`tv-threshold-${epNum}`);

  const sorted = Object.entries(state.tallyCounts).sort(([,a],[,b]) => b - a);
  if (!sorted.length) return;
  const [topName, topCount] = sorted[0];

  // ── Majority reached ──
  if (topCount >= majority) {
    // Full-screen flash
    const flash = document.createElement('div');
    flash.className = 'tv-majority-flash';
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 200);

    // Grey out losing rows, snuff their torches
    tallyPanel.querySelectorAll('.tv-tally-row').forEach(row => {
      if (row.dataset.name !== topName) {
        row.classList.add('tv-tally-eliminated');
        row.classList.remove('tv-tally-leading', 'tv-tally-tied');
        const flame = row.querySelector('.tv-tally-torch-flame');
        if (flame) { flame.className = 'tv-tally-torch-flame tv-flame-out'; }
      }
    });
    // Winner torch goes max
    const winSlug = topName.replace(/[^a-zA-Z0-9]/g, '');
    const winFlame = document.getElementById(`tv-tf-${epNum}-${winSlug}`);
    if (winFlame) winFlame.className = 'tv-tally-torch-flame tv-flame-max';

    // Clear threshold banner
    if (thresholdSlot) { thresholdSlot.style.display = 'none'; thresholdSlot.innerHTML = ''; }

    // Change button text to elimination reveal
    const btn = document.getElementById(`tv-btn-${epNum}`);
    const cards = document.querySelectorAll(`#tv-cards-${epNum} .tv-vote-card`);
    if (btn && state.revealed >= cards.length) {
      const elimNum = _tvGetElimOrdinal(epNum);
      btn.textContent = `The ${elimNum} person voted out...`;
      btn.onclick = () => tvShowResults(epNum);
    }

    // Remove tied badge
    const badge = tallyPanel.querySelector('.tv-tally-tied-badge');
    if (badge) badge.style.display = 'none';

    return;
  }

  // ── One vote away (majority - 1) ──
  if (topCount === majority - 1 && !state._shownOneAway) {
    state._shownOneAway = true;
    if (thresholdSlot) {
      thresholdSlot.innerHTML = '<div class="tv-threshold-banner">ONE VOTE AWAY</div>';
      thresholdSlot.style.display = '';
    }
    const slug = topName.replace(/[^a-zA-Z0-9]/g, '');
    const flame = document.getElementById(`tv-tf-${epNum}-${slug}`);
    if (flame) flame.className = 'tv-tally-torch-flame tv-flame-max';
    return;
  }

  // ── Clear banner if lead changed away from one-away ──
  if (state._shownOneAway && topCount < majority - 1) {
    state._shownOneAway = false;
    if (thresholdSlot) { thresholdSlot.style.display = 'none'; thresholdSlot.innerHTML = ''; }
  }
}

export function _tvGetElimOrdinal(epNum) {
  const history = gs.episodeHistory || [];
  const priorElims = history.filter(h => h.eliminated && h.num < epNum).length;
  return ordinal(priorElims + 1);
}


// ── Surprise double boot: announcement screen ──
export function rpBuildSurprise(ep) {
  const first = ep.firstEliminated;
  const epNum = ep.num;
  let html = `<div class="rp-page">
    <div class="rp-eyebrow">Episode ${epNum} — Surprise</div>
    <div class="rp-title">It's Not Over</div>
    <div class="rp-elim" style="background:radial-gradient(ellipse at 50% 30%,rgba(248,81,73,0.07) 0%,transparent 60%);border-color:rgba(248,81,73,0.18)">
      <div class="rp-elim-eyebrow" style="color:#f85149">Double Boot — Surprise</div>
      ${first ? `${rpPortrait(first,'xl elim')}<div class="rp-elim-name">${first}</div>
      <div style="font-size:12px;color:#8b949e;text-align:center;margin:10px 0 18px;line-height:1.5">${first} was just voted out — but Jeff doesn't dismiss the tribe. He reaches into his bag and pulls out a second vote.</div>` : ''}
      <div style="font-size:14px;color:#cdd9e5;text-align:center;font-weight:600;margin-bottom:8px">"One more vote tonight."</div>
      <div style="font-size:12px;color:#8b949e;text-align:center;line-height:1.5">Nobody was expecting this. The tribe scrambles to regroup — fast.</div>
    </div>
  </div>`;
  return html;
}

// ── Surprise double boot: vote 2 voting plans ──
export function rpBuildVotingPlans2(ep) {
  if (!ep.votingLog2?.length) return null;
  // Reuse rpBuildVotingPlans with vote 2 data swapped in
  return rpBuildVotingPlans({ ...ep,
    votingLog: ep.votingLog2,
    alliances: ep.alliances2 || [],
    immunityWinner: ep.immunityWinner, // still immune in vote 2
    shotInDark: null,
    firstEliminated: null, // suppress double-elim banner
    announcedDoubleElim: false,
  });
}

// ── Surprise double boot: vote 2 reveal screen ──
export function rpBuildVotes2(ep) {
  if (!ep.votingLog2?.length) return '<div class="rp-page"><div class="rp-title">Vote 2</div></div>';
  const vlog2   = ep.votingLog2 || [];
  const votes2  = ep.votes2 || {};
  const v2Total = Object.values(votes2).reduce((a,b) => a+b, 0);
  const v2Sorted = Object.entries(votes2).sort(([,a],[,b]) => b-a);
  const v2Elim  = ep.eliminated;
  const v2IsBs  = v2Elim && pStats(v2Elim).strategic >= 7;
  // Use a unique ID space so it doesn't collide with vote 1's reveal state
  const epId = String(ep.num) + '_v2';
  const _voteTribeLabel = ep.tribalTribe ? ` · ${ep.tribalTribe}` : '';

  let html = `<div class="rp-page">
    <div class="rp-eyebrow">Episode ${ep.num} — Tribal Council${_voteTribeLabel}</div>
    <div class="rp-title">Vote 2 of 2</div>`;

  // ── Advantage plays for vote 2 only ──
  // ep.idolPlays1 has vote 1's plays. ep.idolPlays has vote 2's plays (or combined in history).
  // Filter out vote 1 plays by matching player+type+stolenFrom to avoid duplicates.
  const _v1Set = new Set((ep.idolPlays1 || []).map(p => `${p.player}:${p.type||'idol'}:${p.stolenFrom||''}`));
  const _v2Plays = ep.idolPlays1
    ? (ep.idolPlays || []).filter(p => !_v1Set.has(`${p.player}:${p.type||'idol'}:${p.stolenFrom||''}`))
    : []; // no idolPlays1 = not a double boot, vote 2 shouldn't show any plays
  if (_v2Plays.length) {
    _v2Plays.forEach(play => {
      const { player, votesNegated, type, playedFor, stolenFrom } = play;
      if (type === 'legacy') {
        html += `<div class="tv-advantage-play" style="border-color:rgba(227,179,65,0.3)"><div class="tv-advantage-play-left">${rpPortrait(player, 'sm sitd')}</div><div class="tv-advantage-play-body"><div class="tv-advantage-play-badge" style="color:#e3b341;background:rgba(227,179,65,0.12);border-color:rgba(227,179,65,0.25)">LEGACY ADVANTAGE</div><div class="tv-advantage-play-title">${player}'s Legacy Advantage activates</div><div class="tv-advantage-play-desc">The time has come. ${player} is immune at tonight's Tribal Council.</div>${votesNegated ? `<div class="tv-advantage-play-result">${votesNegated} vote${votesNegated !== 1 ? 's' : ''} cancelled.</div>` : ''}</div></div>`;
      } else if (type === 'kip') {
        const _kipPr = stolenFrom ? pronouns(stolenFrom) : null;
        const _kipFailed = !!play.failed;
        const _kipTypeLabel = play.stolenType === 'extraVote' ? 'Extra Vote' : play.stolenType === 'voteSteal' ? 'Vote Steal' : 'Hidden Immunity Idol';
        html += `<div class="tv-advantage-play" style="border-color:${_kipFailed ? 'rgba(248,81,73,0.3)' : 'rgba(99,102,241,0.3)'}"><div class="tv-advantage-play-left">${rpPortrait(player, 'sm sitd')}${stolenFrom ? rpPortrait(stolenFrom, 'sm') : ''}</div><div class="tv-advantage-play-body"><div class="tv-advantage-play-badge" style="color:${_kipFailed ? '#f85149' : '#818cf8'};background:${_kipFailed ? 'rgba(248,81,73,0.12)' : 'rgba(99,102,241,0.12)'};border-color:${_kipFailed ? 'rgba(248,81,73,0.25)' : 'rgba(99,102,241,0.25)'}">${_kipFailed ? 'KNOWLEDGE IS POWER \u2014 FAILED' : 'KNOWLEDGE IS POWER'}</div><div class="tv-advantage-play-title">${player} uses Knowledge is Power on ${stolenFrom || 'a player'}</div><div class="tv-advantage-play-desc">${_kipFailed ? `"Do you have a Hidden Immunity Idol?" ${stolenFrom} looks ${player} dead in the eye. "No." The advantage is wasted.` : `"Do you have a ${_kipTypeLabel}?"${stolenFrom && _kipPr ? ` ${stolenFrom} must hand it over. ${_kipPr.Sub} ${_kipPr.sub==='they'?'have':'has'} no choice.` : ''}`}</div></div></div>`;
      } else if (type === 'extraVote') {
        html += `<div class="tv-advantage-play"><div class="tv-advantage-play-left">${rpPortrait(player, 'sm sitd')}</div><div class="tv-advantage-play-body"><div class="tv-advantage-play-badge" style="color:#e3b341;background:rgba(227,179,65,0.12);border-color:rgba(227,179,65,0.25)">EXTRA VOTE</div><div class="tv-advantage-play-title">${player} plays an Extra Vote</div><div class="tv-advantage-play-desc">${player} casts a second vote. It will be read with the others.</div></div></div>`;
      } else if (type === 'voteSteal') {
        html += `<div class="tv-advantage-play"><div class="tv-advantage-play-left">${rpPortrait(player, 'sm sitd')}${stolenFrom ? rpPortrait(stolenFrom, 'sm') : ''}</div><div class="tv-advantage-play-body"><div class="tv-advantage-play-badge" style="color:#f0a500;background:rgba(240,165,0,0.12);border-color:rgba(240,165,0,0.25)">VOTE STEAL</div><div class="tv-advantage-play-title">${player} steals ${stolenFrom ? `${stolenFrom}'s vote` : 'a vote'}</div><div class="tv-advantage-play-desc">${stolenFrom ? `${stolenFrom} loses their vote.` : 'A vote is stolen.'} The redirect will be read with the others.</div></div></div>`;
      } else if (type === 'voteBlock') {
        const _blocked = play.blockedPlayer;
        html += `<div class="tv-advantage-play"><div class="tv-advantage-play-left">${rpPortrait(player, 'sm sitd')}${_blocked ? rpPortrait(_blocked, 'sm') : ''}</div><div class="tv-advantage-play-body"><div class="tv-advantage-play-badge" style="color:#f85149;background:rgba(248,81,73,0.12);border-color:rgba(248,81,73,0.25)">VOTE BLOCK</div><div class="tv-advantage-play-title">${player} blocks ${_blocked || 'a player'}'s vote</div><div class="tv-advantage-play-desc">${_blocked || 'A player'} cannot vote tonight. Their voice has been silenced.</div></div></div>`;
      } else if (type === 'soleVote') {
        html += `<div class="tv-advantage-play"><div class="tv-advantage-play-left">${rpPortrait(player, 'sm sitd')}</div><div class="tv-advantage-play-body"><div class="tv-advantage-play-badge" style="color:#f0a500;background:rgba(240,165,0,0.12);border-color:rgba(240,165,0,0.25)">SOLE VOTE</div><div class="tv-advantage-play-title">${player} plays the Sole Vote</div><div class="tv-advantage-play-desc">All other votes are void. ${player}'s vote is the only one that counts.</div></div></div>`;
      } else if (type === 'safetyNoPower') {
        const _snpWarned = play.warned;
        html += `<div class="tv-advantage-play">
          <div class="tv-advantage-play-left">${rpPortrait(player, 'sm sitd')}</div>
          <div class="tv-advantage-play-body">
            <div class="tv-advantage-play-badge" style="color:#818cf8;background:rgba(129,140,248,0.12);border-color:rgba(129,140,248,0.25)">SAFETY WITHOUT POWER</div>
            <div class="tv-advantage-play-title">${player} leaves Tribal Council</div>
            <div class="tv-advantage-play-desc">${player} is safe tonight — but cannot vote.${_snpWarned ? ` ${player} warned ${_snpWarned} before leaving.` : ' Nobody saw it coming.'}</div>
          </div>
        </div>`;
      } else if (type === 'teamSwap') {
        const _ts = play;
        html += `<div class="tv-advantage-play"><div class="tv-advantage-play-left">${rpPortrait(_ts.swappedPlayer || player, 'sm sitd')}</div><div class="tv-advantage-play-body"><div class="tv-advantage-play-badge" style="color:#818cf8;background:rgba(99,102,241,0.12);border-color:rgba(99,102,241,0.25)">TEAM SWAP</div><div class="tv-advantage-play-title">${_ts.selfSwap ? `${player} swaps to ${_ts.toTribe}` : `${player} sends ${_ts.swappedPlayer} to ${_ts.toTribe}`}</div><div class="tv-advantage-play-desc">${_ts.selfSwap ? `${player} plays the Team Swap to escape. ${pronouns(player).Sub} ${pronouns(player).sub==='they'?'leave':'leaves'} ${_ts.fromTribe} and ${pronouns(player).sub==='they'?'join':'joins'} ${_ts.toTribe}.` : `${player} plays the Team Swap to save ${_ts.swappedPlayer}. ${_ts.swappedPlayer} moves from ${_ts.fromTribe} to ${_ts.toTribe}.`}</div></div></div>`;
      } else if (type === 'fake-idol') {
        html += `<div class="tv-advantage-play"><div class="tv-advantage-play-left">${rpPortrait(player, 'sm sitd')}</div><div class="tv-advantage-play-body"><div class="tv-advantage-play-badge" style="color:#f85149;background:rgba(248,81,73,0.12);border-color:rgba(248,81,73,0.25)">FAKE IDOL</div><div class="tv-advantage-play-title">${player} plays a fake idol</div><div class="tv-advantage-play-desc">The host examines it. "This... is not a Hidden Immunity Idol." ${player}'s face drops. The votes count.${play.plantedBy ? ` Planted by ${play.plantedBy}.` : ''}</div></div></div>`;
      } else if (!type || type === 'idol') {
        // Regular idol play
        const _isAlly = !!playedFor;
        const _isMisplay = !!play.misplay;
        const _badgeColor = _isMisplay ? 'color:#d29922;background:rgba(210,153,34,0.12);border-color:rgba(210,153,34,0.25)' : 'color:#3fb950;background:rgba(63,185,80,0.12);border-color:rgba(63,185,80,0.25)';
        const _badgeLabel = _isMisplay ? 'HIDDEN IMMUNITY IDOL \u2014 WASTED' : 'HIDDEN IMMUNITY IDOL';
        html += `<div class="tv-advantage-play"><div class="tv-advantage-play-left">${rpPortrait(player, 'sm sitd')}${_isAlly ? rpPortrait(playedFor, 'sm') : ''}</div><div class="tv-advantage-play-body"><div class="tv-advantage-play-badge" style="${_badgeColor}">${_badgeLabel}</div><div class="tv-advantage-play-title">${_isAlly ? `${player} plays an idol for ${playedFor}` : `${player} plays an idol`}</div><div class="tv-advantage-play-desc">${_isMisplay ? `${player} played the idol but wasn't the target. ${votesNegated || 0} votes cancelled.` : `All votes cast against ${_isAlly ? playedFor : player} do not count.`}</div>${!_isMisplay && votesNegated ? `<div class="tv-advantage-play-result">${votesNegated} vote${votesNegated !== 1 ? 's' : ''} cancelled.</div>` : ''}</div></div>`;
      }
    });
    // Shot in the Dark for vote 2
    if (ep.shotInDark?.player && !ep.shotInDark1) {
      const { player, safe, votesNegated } = ep.shotInDark;
      const sidColor = safe ? '#3fb950' : '#f85149';
      html += `<div class="tv-advantage-play"><div class="tv-advantage-play-left">${rpPortrait(player, 'sm sitd')}</div><div class="tv-advantage-play-body"><div class="tv-advantage-play-badge" style="color:${sidColor};background:${safe ? 'rgba(63,185,80,0.12)' : 'rgba(248,81,73,0.12)'};border-color:${safe ? 'rgba(63,185,80,0.25)' : 'rgba(248,81,73,0.25)'}">SHOT IN THE DARK</div><div class="tv-advantage-play-title">${player} rolls the dice</div><div class="tv-advantage-play-desc">${safe ? `It worked. ${player} is safe — all votes cancelled.` : `It failed. ${player} sacrificed their vote for nothing.`}</div></div></div>`;
    }
  }

  // ── Threshold banner slot ──
  const tallyNames2 = [...new Set(vlog2.map(v => v.voted))].sort((a,b) => (votes2[b]||0) - (votes2[a]||0));
  const _v2Eligible = vlog2.filter(v => v.voter !== 'THE GAME' && v.voted && !v.voteBlocked && !v.teamSwapped).length;
  const _v2Majority = Math.ceil(_v2Eligible / 2);
  html += `<div id="tv-threshold-${epId}" style="display:none"></div>`;
  // ── Two-panel layout: vote cards left, live tally right ──
  html += `<div class="tv-wrap">
    <div class="tv-reveal-panel" id="tv-cards-${epId}">`;

  vlog2.forEach(({ voter, voted, reason }, idx) => {
    html += `<div class="tv-vote-card" data-voted="${voted}" data-voter="${voter}" data-index="${idx}">
      <div class="tv-vote-voter-wrap">${rpPortrait(voter,'sm')}<div class="tv-vote-voter">${voter}</div></div>
      <div class="tv-vote-arrow">→</div>
      <div class="tv-vote-right">
        <div class="tv-vote-target">${voted}</div>
        ${reason ? `<div class="tv-vote-reason">${reason}</div>` : ''}
      </div>
    </div>`;
  });

  html += `</div>`; // end tv-reveal-panel (cards)

  // Live tally panel (sticky sidebar)
  html += `<div class="tv-tally-panel" id="tv-tally-${epId}" data-majority="${_v2Majority}" data-eligible="${_v2Eligible}">
    <div class="tv-tally-header">The Votes</div>`;
  tallyNames2.forEach(name => {
    const slug = name.replace(/[^a-zA-Z0-9]/g, '');
    html += `<div class="tv-tally-row" data-name="${name}">
      <div class="tv-tally-row-top">
        <div class="tv-tally-torch"><div class="tv-tally-torch-flame" id="tv-tf-${epId}-${slug}"></div></div>
        ${rpPortrait(name, 'sm')}
        <div class="tv-tally-pname">${name}</div>
      </div>
      <div class="tv-tally-row-bar">
        <div class="tv-tally-bar-bg"><div class="tv-tally-bar" id="tv-tb-${epId}-${slug}" style="width:0%"></div></div>
        <div class="tv-tally-count" id="tv-tc-${epId}-${slug}" data-count="0">\u2014</div>
      </div>
    </div>`;
  });
  html += `</div>`;

  html += `</div>`; // end tv-wrap

  html += `<div id="tv-btn-wrap-${epId}">
    <button class="tv-reveal-btn" id="tv-btn-${epId}" onclick="tvRevealNext('${epId}')">Read the Vote (0/${vlog2.length})</button>
    <div style="text-align:right;margin:-12px 0 14px">
      <button onclick="tvRevealAll('${epId}')" style="background:none;border:none;font-size:11px;color:#484f58;cursor:pointer;padding:2px 0;letter-spacing:0.3px">Skip to results ›</button>
    </div>
  </div>`;

  html += `<div id="tv-results-${epId}" style="display:none">`;

  // Final tally
  if (v2Sorted.length) {
    html += `<div class="tv-final-tally"><div class="tv-ft-header">Vote 2 — Final Tally</div>`;
    v2Sorted.forEach(([name, v]) => {
      const pct = Math.round((v / Math.max(1, v2Total)) * 100);
      const isE2 = name === v2Elim && !ep.tiebreakerResult;
      const isTBd = ep.tiebreakerResult && ep.isTie && (ep.tiedPlayers||[]).includes(name);
      const barColor = isE2 ? '#da3633' : isTBd ? '#d29922' : '#30363d';
      html += `<div class="tv-ft-row ${isE2 ? 'tv-ft-elim' : ''}">
        ${rpPortrait(name)}
        <div class="tv-ft-name">${name}</div>
        <div class="tv-ft-bar-bg"><div class="tv-ft-bar" style="width:${pct}%;background:${barColor}"></div></div>
        <div class="tv-ft-num">${v}</div>
        ${isE2  ? `<span style="font-size:9px;font-weight:800;letter-spacing:1px;padding:2px 8px;border-radius:4px;background:rgba(218,54,51,0.1);color:#da3633">${v2IsBs ? 'BLINDSIDE' : 'ELIMINATED'}</span>` : ''}
        ${isTBd ? `<span style="font-size:9px;font-weight:800;letter-spacing:1px;padding:2px 8px;border-radius:4px;background:rgba(210,153,34,0.1);color:#d29922">TIEBREAKER</span>` : ''}
      </div>`;
    });
    html += `</div>`;
  }

  // Elimination card
  if (ep.tiebreakerResult) {
    // Inline tiebreaker card for vote 2
    const tr = ep.tiebreakerResult;
    const [tb0, tb1] = tr.participants;
    html += `<div class="rp-elim" style="background:radial-gradient(ellipse at 50% 30%,rgba(210,153,34,0.08) 0%,transparent 60%);border-color:rgba(210,153,34,0.2)">
      <div class="rp-elim-eyebrow" style="color:#d29922">Challenge Tiebreaker — ${tr.challengeLabel}</div>
      <div style="display:flex;justify-content:center;align-items:flex-start;gap:20px;flex-wrap:wrap;margin:0 0 18px">
        ${tr.participants.map(p => `<div style="text-align:center">
          ${rpPortrait(p,'xl')}
          <div style="font-size:10px;font-weight:800;margin-top:6px;letter-spacing:1px;color:${p===tr.loser?'#f85149':'#3fb950'}">${p===tr.loser?'ELIMINATED':'SAFE'}</div>
        </div>`).join(`<div style="align-self:center;font-size:28px;color:#30363d">⚡</div>`)}
      </div>
    </div>`;
    if (tr.loser) {
      const _place = (ep.gsSnapshot?.activePlayers ?? gs.activePlayers).length + 1;
      const _eq = vpGenerateQuote(tr.loser, ep, 'eliminated');
      html += `<div class="rp-elim"><div class="rp-elim-eyebrow">Voted Out — Episode ${ep.num}</div>
        ${rpPortrait(tr.loser,'xl elim')}<div class="rp-elim-name">${tr.loser}</div>
        <div class="rp-elim-arch">${vpArchLabel(tr.loser)}</div>
        <div class="rp-elim-quote">"${_eq}"</div></div>`;
    }
  } else if (v2Elim) {
    const _place = (ep.gsSnapshot?.activePlayers ?? gs.activePlayers).length + 1;
    const _eq = vpGenerateQuote(v2Elim, ep, 'eliminated');
    html += `<div class="rp-elim">
      <div class="rp-elim-eyebrow">${v2IsBs ? 'BLINDSIDE — ' : ''}Voted Out — Episode ${ep.num}</div>
      ${rpPortrait(v2Elim,'xl elim')}<div class="rp-elim-name">${v2Elim}</div>
      <div class="rp-elim-arch">${vpArchLabel(v2Elim)}</div>
      <div class="rp-elim-quote">"${_eq}"</div>
      <div class="rp-elim-place">Voted Out — Episode ${ep.num}</div></div>`;
  }

  // WHY THIS VOTE HAPPENED — vote 2
  const _v2WhyElim = ep.tiebreakerResult ? ep.tiebreakerResult.loser : v2Elim;
  if (_v2WhyElim) {
    const _v2WhyBullets = vpWhyBullets(_v2WhyElim, vlog2, ep.alliances2 || [], ep);
    html += `<div style="margin-top:28px;border-top:1px solid #21262d;padding-top:20px">
      <div style="font-size:9px;font-weight:800;letter-spacing:2px;color:#484f58;margin-bottom:14px">=== WHY THIS VOTE HAPPENED ===</div>
      ${vpWhyCard(_v2WhyElim, _v2WhyBullets, `${_v2WhyElim} was voted out because:`)}
    </div>`;
  }

  // Blowup / Crashout for the vote-2 eliminated player
  const _v2Blowup = ep.tribalBlowup?.player === v2Elim ? ep.tribalBlowup : null;
  const _v2Crashout = _v2Blowup ? null : buildCrashout(ep);
  if (_v2Blowup) {
    const _bSubt = _v2Blowup.trigger === 'temperament' ? `${_v2Blowup.player} — Couldn't Hold It In` : `${_v2Blowup.player} — Goes Out Swinging`;
    html += `<div class="tc-crashout"><div class="tc-crashout-header">${rpPortrait(_v2Blowup.player,'sm')}<div><div class="tc-crashout-badge">CRASHOUT</div><div class="tc-crashout-title">${_bSubt}</div></div></div><div class="tc-crashout-reveal">`;
    (_v2Blowup.reveals || []).forEach(({ text, consequence }) => { html += `<div class="tc-crashout-item"><div class="tc-crashout-quote">"${text}"</div><div class="tc-crashout-consequence">↳ ${consequence}</div></div>`; });
    html += `</div></div>`;
  } else if (_v2Crashout) {
    html += `<div class="tc-crashout"><div class="tc-crashout-header">${rpPortrait(_v2Crashout.player,'sm')}<div><div class="tc-crashout-badge">CRASHOUT</div><div class="tc-crashout-title">${_v2Crashout.player} — Last Words</div></div></div><div class="tc-crashout-reveal">`;
    _v2Crashout.reveals.forEach(({ text, consequence }) => { html += `<div class="tc-crashout-item"><div class="tc-crashout-quote">"${text}"</div><div class="tc-crashout-consequence">↳ ${consequence}</div></div>`; });
    html += `</div></div>`;
  }

  // Torch-snuff for vote-2 eliminated
  if (v2Elim) {
    html += `<div id="torch-snuff-${ep.num}-v2" style="text-align:center;margin-top:24px">
      <div class="torch-snuffed">${rpPortrait(v2Elim, 'xl')}</div>
      <div style="font-family:var(--font-display);font-size:24px;color:var(--accent-fire);margin-top:16px;text-shadow:0 0 12px var(--accent-fire)">The tribe has spoken.</div>
    </div>`;
    // Black Vote: vote 2 eliminated player casts their parting shot
    const _bvc2 = [ep.blackVote2, ep.blackVote].find(bv => bv && bv.from === v2Elim);
    if (_bvc2) {
      html += `<div style="margin-top:16px;padding:12px;border:1px solid rgba(99,102,241,0.25);border-radius:8px;background:rgba(99,102,241,0.04);text-align:center">
        <div style="font-size:9px;font-weight:700;letter-spacing:2px;color:#818cf8;margin-bottom:6px">BLACK VOTE CAST</div>
        <div style="font-size:12px;color:#c9d1d9;line-height:1.5">${
          _bvc2.type === 'classic'
            ? `Before leaving, ${_bvc2.from} casts a Black Vote against <strong style="color:#f85149">${_bvc2.target}</strong>. This vote will count at the next tribal council.`
            : `Before leaving, ${_bvc2.from} gifts an Extra Vote to <strong style="color:#3fb950">${_bvc2.recipient}</strong>. "${pronouns(_bvc2.from).Sub} earned it," ${_bvc2.from} says.`
        }</div>
        <div style="display:flex;justify-content:center;gap:8px;margin-top:8px">
          ${rpPortrait(_bvc2.from, 'sm')}
          <span style="font-size:16px;color:#818cf8;align-self:center">\u2192</span>
          ${rpPortrait(_bvc2.type === 'classic' ? _bvc2.target : _bvc2.recipient, 'sm')}
        </div>
        <div style="font-size:10px;color:#8b949e;margin-top:6px;font-style:italic">${_bvc2.reason || ''}</div>
      </div>`;
    }
  }

  // ── THE MOLE: undiscovered reveal for double-boot ──
  const _v2Elims = [ep.firstEliminated, ep.eliminated].filter(Boolean);
  _v2Elims.forEach(_v2e => {
    if (!_v2e || !gs.moles?.length) return;
    const _moleSnap2 = ep.gsSnapshot?.moles || gs.moles;
    const _elimMole2 = _moleSnap2.find(m => m.player === _v2e && !m.exposed);
    if (_elimMole2 && _elimMole2.sabotageCount > 0) {
      const mp = pronouns(_v2e);
      const _sabTypes2 = [...new Set(_elimMole2.sabotageLog.map(s => s.type))];
      const _sabDesc2 = _sabTypes2.map(t => t === 'bondSabotage' ? 'fabricated conflicts' : t === 'infoLeak' ? 'leaked intel' : t === 'voteDisruption' ? 'disrupted votes' : t === 'challengeThrow' ? 'threw challenges' : t === 'advantageSabotage' ? 'sabotaged advantages' : t).join(', ');
      html += `<div style="margin-top:24px;padding:16px;border:2px solid rgba(248,81,73,0.4);border-radius:10px;background:rgba(248,81,73,0.04);text-align:center">
        <div style="font-size:9px;font-weight:800;letter-spacing:3px;color:#f85149;margin-bottom:10px">WHAT THE TRIBE NEVER KNEW</div>
        ${rpPortrait(_v2e, 'lg')}
        <div style="font-family:var(--font-display);font-size:18px;color:#f85149;margin-top:8px;letter-spacing:1px">THE MOLE</div>
        <div style="font-size:12px;color:#c9d1d9;margin-top:8px;line-height:1.6">
          ${_v2e} was The Mole. <strong>${_elimMole2.sabotageCount}</strong> acts of sabotage — ${_sabDesc2} — and nobody figured it out.
          ${mp.Sub} ${mp.sub === 'they' ? 'leave' : 'leaves'} with ${mp.posAdj} secret intact.
        </div>
        <div style="margin-top:12px;padding:10px;background:rgba(139,148,158,0.06);border-radius:6px;font-style:italic;font-size:11px;color:#8b949e;line-height:1.5">
          "${mp.Sub === 'They' ? 'They' : mp.Sub} never figured it out. Every fight, every broken alliance — that was me. And they voted me out for the wrong reasons."
        </div>
      </div>`;
    }
  });

  html += `</div>`; // tv-results
  html += `</div>`; // rp-page
  return html;
}

// ─────────────────────────────────────────────────────────────────
// FINALE VP SCREENS
// ─────────────────────────────────────────────────────────────────

// ── Finale Camp Life: finalists reminisce, reflect on the season ──
export function buildVPScreens(epRecord) {
  vpScreens = [];
  vpEpNum = epRecord.num || 0;
  // Reset vote reveal state — HTML is rebuilt fresh, old state would skip all reveals
  delete _tvState[vpEpNum];
  delete _tvState[String(vpEpNum) + '_v2']; // vote-2 reveal state (surprise double boot)
  delete _tvState[String(vpEpNum) + '_fv']; // fresh vote reveal state
  delete _tvState[String(vpEpNum) + '_je']; // jury elimination reveal state
  delete _tvState[String(vpEpNum) + '_bench'];
  delete _tvState[String(vpEpNum) + '_slasher']; // slasher night round reveal state
  delete _reunionRevealed[String(vpEpNum) + '_reunion'];
  delete _gcRevealed[String(vpEpNum) + '_gc'];
  const ep = epRecord;

  const hasTribal = ep.alliances?.some(a => a.target) || ep.votingLog?.length;
  const _isJuryElim = !!(ep.twists||[]).find(t => t.type === 'jury-elimination' && t.juryBooted);

  const hasRelEvents = ep.campEvents && Object.values(ep.campEvents).some(phaseData => {
    const evs = Array.isArray(phaseData) ? phaseData : [...(phaseData?.pre||[]), ...(phaseData?.post||[])];
    return evs.some(e => ['bond','fight','dispute','strategicTalk','idolFound','idolSearch','hardWork','meltdown','injury'].includes(e.type));
  });

  // ── 1. Cold Open (always) ──
  vpScreens.push({ id:'cold-open', label:'Cold Open', html: rpBuildColdOpen(ep) });

  // ── 1b. Phobia Factor Confessions — campfire scene, right after cold open ──
  if (ep.isPhobiaFactor && ep.phobiaFactor) {
    vpScreens.push({ id:'pf-confessions', label:'Confessions', html: rpBuildPhobiaConfessions(ep) });
  }

  // ── First Impressions — mock vote + tribe swap (episode 1 twist) ──
  const _fiTw = (ep.twists || []).find(t => t.type === 'first-impressions' && t.firstImpressions?.length);
  if (_fiTw) {
    // Don't delete _tvState — the reveal must persist across rebuilds
    const _fiHtml = rpBuildFirstImpressions(ep, _fiTw);
    if (_fiHtml) vpScreens.push({ id:'first-impressions', label:'First Impressions', html: _fiHtml });
  }

  // ── Second Chance Vote — always right after Cold Open ──
  const _scvTw = (ep.twists || []).find(t => (t.type === 'second-chance' || t.catalogId === 'second-chance' || (t.type === 'returning-player' && t.catalogId === 'second-chance')) && t.returnee);
  if (_scvTw) {
    const _scvHtml = rpBuildSecondChanceVote(ep);
    if (_scvHtml) vpScreens.push({ id:'second-chance', label:'Second Chance Vote', html: _scvHtml });
  }

  // ── RI/Rescue Return (fires at start of episode — returnee participates in everything after) ──
  // Only show the screen matching the active format — not both
  if (ep.rescueReturnChallenge?.winner && seasonConfig.riFormat === 'rescue') {
    const _earlyRescRet = rpBuildRescueReturnChallenge(ep);
    if (_earlyRescRet) vpScreens.push({ id:'rescue-return', label:'Rescue Return', html: _earlyRescRet });
  } else if (ep.riReentry?.winner) {
    const _earlyRiRet = rpBuildRIReturn(ep);
    if (_earlyRiRet) vpScreens.push({ id:'ri-return', label:'RI Return', html: _earlyRiRet });
  }

  // Tribe Status removed — tribe composition is shown on camp screens; advantages move to Alliance Overview

  // ── Ambassador twist screen (before merge) ──
  if (ep.ambassadorData?.ambassadorMeeting) {
    const _ambHtml = rpBuildAmbassadors(ep);
    if (_ambHtml) vpScreens.push({ id:'ambassadors', label:'The Ambassadors', html: _ambHtml });
  }

  // ── Merge Announcement (isMerge episodes only) ──
  if (ep.isMerge) {
    vpScreens.push({ id:'merge', label:'The Merge', html: rpBuildMergeAnnouncement(ep) });
  }

  // ── Finale Camp Life (always for finale episodes) ──
  if (ep.isFinale) {
    const _campLifeHtml = rpBuildFinaleCampLife(ep);
    if (_campLifeHtml) vpScreens.push({ id:'finale-camp', label:'The Last Morning', html: _campLifeHtml });
  }

  // ── 3. Pre-Challenge Twist (tribe swap, three gifts, journey, exile-island, etc.) ──
  const _preTwistHtml = rpBuildPreTwist(ep);
  if (_preTwistHtml) vpScreens.push({ id:'twist', label:'Twists', html: _preTwistHtml });

  // ── 3c. Schoolyard Pick (dedicated click-to-reveal draft screen) ──
  if (ep.schoolyardPick?.picks?.length) {
    const _sypHtml = rpBuildSchoolyardPick(ep);
    if (_sypHtml) vpScreens.push({ id:'schoolyard-pick', label:'Schoolyard Pick', html: _sypHtml });
  }

  // ── Helper: derive tribe groups at start of episode ──
  const vpTribeGroups = (() => {
    // Post-merge: gs.tribes = [] so tribesAtStart is empty. Detect via snapshot isMerged or ep.isMerge.
    // Use ep.gsSnapshot.isMerged (not live gs.isMerged) so pre-merge episodes don't render as merged
    // when viewed after the season has already merged.
    // The campEvents key is gs.mergeName (e.g. "Land of Powers"), NOT the literal 'merge'.
    if (ep.isMerge || ep.gsSnapshot?.isMerged) {
      // Find the actual campEvents key for the merged tribe camp.
      const _mergeKey = ep.campEvents
        ? (['merge', gs.mergeName].find(k => k && ep.campEvents[k])
          || Object.keys(ep.campEvents)[0])
        : (gs.mergeName || 'merge');
      // Reconstruct start-of-episode membership: snapshot (post-elim) + whoever was eliminated.
      // For finale: use finaleEntrants (all players BEFORE koh-lanta/fire-making eliminations)
      if (ep.isFinale && ep.finaleEntrants?.length) {
        return [{ name: _mergeKey, members: [...ep.finaleEntrants] }];
      }
      const snapActive = ep.gsSnapshot?.activePlayers || [];
      const eliminated = [ep.eliminated, ep.firstEliminated, ep.tiedDestinies?.eliminatedPartner].filter(Boolean);
      const _exilePlayer = ep.exileDuelPlayerAtStart || ep.exilePlayer || ep.gsSnapshot?.exileDuelPlayer || gs.exileDuelPlayer;
      const members = (snapActive.length
        ? [...new Set([...snapActive, ...eliminated])]
        : [...gs.activePlayers]).filter(p => p !== _exilePlayer);
      return [{ name: _mergeKey, members }];
    }
    if (ep.tribesAtStart?.length) return ep.tribesAtStart;
    const snap = gs.episodeHistory?.filter(h => h.num < ep.num).slice(-1)[0]?.gsSnapshot;
    if (snap?.tribes?.length) return snap.tribes;
    if (gs.phase === 'pre-merge' && gs.tribes?.length) return gs.tribes;
    return [{ name: gs.mergeName || 'merged', members: [...gs.activePlayers] }];
  })();

  // ── 3a. Fan Vote Return (player returns at start of episode) ──
  const _fvReturnHtml = rpBuildFanVoteReturn(ep);
  if (_fvReturnHtml) vpScreens.push({ id: 'fan-vote-return', label: 'Fan Vote Return', html: _fvReturnHtml });

  // ── 3b. Tied Destinies announcement (before camp — pairing is revealed at episode start) ──
  const _tdAnnounceHtml = rpBuildTiedDestinies(ep);
  if (_tdAnnounceHtml) vpScreens.push({ id:'tied-destinies', label:'Tied Destinies', html: _tdAnnounceHtml });

  // ── 4. Pre-Challenge Camp — one screen per tribe ──
  vpTribeGroups.forEach(tribe => {
    const phaseData = ep.campEvents?.[tribe.name];
    const preEvs = Array.isArray(phaseData) ? phaseData : (phaseData?.pre || []);
    if (!preEvs.length) return;
    const _tcPre = tribeColor(tribe.name);
    const _dotPre = `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${_tcPre};margin-right:6px;flex-shrink:0"></span>`;
    const _isMergeCampPre = tribe.name === 'merge' || tribe.name === (gs.mergeName||'merged');
    vpScreens.push({
      id: `camp-pre-${tribe.name}`,
      label: `${_dotPre}${_isMergeCampPre ? 'Camp Life' : `${tribe.name} Camp`}`,
      html: rpBuildCampTribe(ep, tribe.name, tribe.members, 'pre'),
    });
  });

  // ── 4b. Reward Challenge (if one ran this episode) ──
  if (ep.rewardChalData) {
    vpScreens.push({ id:'reward-challenge', label:'Reward Challenge', html: rpBuildRewardChallenge(ep) });
  }

  // ── 5. Challenge ──
  if (ep.isFinale && ep.challengeType && ep.immunityWinner && (seasonConfig.finaleSize >= 3 || seasonConfig.firemaking) && seasonConfig.finaleFormat !== 'final-challenge' && seasonConfig.finaleFormat !== 'koh-lanta') {
    // Finale immunity: use the same detailed challenge screen as regular episodes (koh-lanta has its own orienteering/perch screens)
    vpScreens.push({ id:'finale-challenge', label:'Final Immunity', html: rpBuildChallenge(ep) });
  // ── Phobia Factor — replaces tribe challenge ──
  } else if (ep.isCliffDive && ep.cliffDive) {
    vpScreens.push({ id:'cliff-dive', label:'Cliff Dive', html: rpBuildCliffDive(ep) });
  } else if (ep.isAwakeAThon && ep.awakeAThon) {
    vpScreens.push({ id:'awake-a-thon', label:'Awake-A-Thon', html: rpBuildAwakeAThon(ep) });
  } else if (ep.isTalentShow && ep.talentShow) {
    vpScreens.push({ id:'talent-auditions', label:'Auditions', html: rpBuildTalentAuditions(ep) });
    const _bsHtml = rpBuildTalentBackstage(ep);
    if (_bsHtml) vpScreens.push({ id:'talent-backstage', label:'Backstage', html: _bsHtml });
    const _tsShowHtml = rpBuildTalentShowStage(ep);
    if (_tsShowHtml) vpScreens.push({ id:'talent-show', label:'The Show', html: _tsShowHtml });
  } else if (ep.isSuckyOutdoors && ep.suckyOutdoors) {
    vpScreens.push({ id:'sucky-outdoors', label:'The Sucky Outdoors', html: rpBuildSuckyOutdoors(ep) });
  } else if (ep.isUpTheCreek && ep.upTheCreek) {
    vpScreens.push({ id:'up-the-creek', label:'Up the Creek', html: rpBuildUpTheCreek(ep) });
  } else if (ep.isPaintballHunt && ep.paintballHunt) {
    vpScreens.push({ id:'paintball-hunt', label:'Paintball Hunt', html: rpBuildPaintballHunt(ep) });
  } else if (ep.isHellsKitchen && ep.hellsKitchen) {
    vpScreens.push({ id:'hells-kitchen', label:"Hell's Kitchen", html: rpBuildHellsKitchen(ep) });
  } else if (ep.isTrustChallenge && ep.trustChallenge) {
    vpScreens.push({ id:'trust-challenge', label:"Who Can You Trust?", html: rpBuildTrustChallenge(ep) });
  } else if (ep.isDodgebrawl && ep.dodgebrawl) {
    vpScreens.push({ id:'dodgebrawl', label:'Dodgebrawl', html: rpBuildDodgebrawl(ep) });
  } else if (ep.isPhobiaFactor && ep.phobiaFactor) {
    // Confessions already registered after Cold Open (section 1b)
    vpScreens.push({ id:'pf-announce', label:'Phobia Factor', html: rpBuildPhobiaAnnouncement(ep) });
    vpScreens.push({ id:'pf-challenge', label:'The Challenge', html: rpBuildPhobiaChallenge(ep) });
    if (ep.phobiaFactor.clutch) {
      vpScreens.push({ id:'pf-clutch', label:'Triple Points', html: rpBuildPhobiaClutch(ep) });
    }
    vpScreens.push({ id:'pf-results', label:'Results', html: rpBuildPhobiaResults(ep) });
  } else if (ep.isLuckyHunt && ep.luckyHunt) {
    vpScreens.push({ id:'lucky-hunt', label:'Lucky Hunt', html: rpBuildLuckyHunt(ep) });
  } else if (ep.isBasicStraining && ep.basicStraining) {
    vpScreens.push({ id:'bs-bootcamp', label:'Basic Straining', html: rpBuildBasicStraining(ep) });
  } else if (ep.isXtremeTorture && ep.xtremeTorture) {
    vpScreens.push({ id:'xtreme-torture', label:'X-Treme Torture', html: rpBuildXtremeTorture(ep) });
  } else if (ep.isSayUncle && ep.sayUncle) {
    // Say Uncle replaces the normal challenge screen
    vpScreens.push({ id:'su-announce', label:'Say Uncle', html: rpBuildSayUncleAnnouncement(ep) });
    vpScreens.push({ id:'su-rounds', label:'The Torture', html: rpBuildSayUncleRounds(ep) });
    vpScreens.push({ id:'su-immunity', label:'Immunity', html: rpBuildSayUncleImmunity(ep) });
  } else if (ep.isBrunchOfDisgustingness && ep.brunch) {
    vpScreens.push({ id:'br-split', label:'The Split', html: rpBuildBrunchSplit(ep) });
    vpScreens.push({ id:'br-cabins', label:'Cabins', html: rpBuildBrunchCabins(ep) });
    vpScreens.push({ id:'br-courses', label:'The Brunch', html: rpBuildBrunchCourses(ep) });
    vpScreens.push({ id:'br-results', label:'Results', html: rpBuildBrunchResults(ep) });
  } else if (ep.isHideAndBeSneaky && ep.hideAndBeSneaky) {
    vpScreens.push({ id:'hide-seek', label:'Hide and Be Sneaky', html: rpBuildHideAndBeSneaky(ep) });
  } else if (ep.isOffTheChain && ep.bikeRace) {
    vpScreens.push({ id:'off-the-chain', label:"Off the Chain!", html: rpBuildOffTheChain(ep) });
  } else if (ep.isWawanakwaGoneWild && ep.wawanakwaGoneWild) {
    vpScreens.push({ id:'wawanakwa-gone-wild', label:'Wawanakwa Gone Wild!', html: rpBuildWawanakwaGoneWild(ep) });
  } else if (ep.challengeType && !ep.isFinale && !ep.isSlasherNight && !ep.isTripleDogDare && !ep.isPhobiaFactor && !ep.isHideAndBeSneaky && !ep.isOffTheChain && !ep.isWawanakwaGoneWild) {
    vpScreens.push({ id:'challenge', label:'Immunity Challenge', html: rpBuildChallenge(ep) });
  }

  // ── 5b. Exile Island (post-challenge — shown AFTER challenge to avoid spoiling winner) ──
  const _exileTwVP = (ep.twists || []).find(t => t.type === 'exile-island' && t.exiled);
  if (_exileTwVP) {
    const _tw = _exileTwVP;
    const _tc = tribeColor(_tw.exileChooserTribe || '');
    let _exHtml = `<div class="rp-page rp-twist-page tod-dusk">
      <div class="rp-eyebrow">Episode ${ep.num}</div>
      <div class="rp-twist-title">Exile Island</div>`;

    const _exPr = pronouns(_tw.exiled);
    if (_tw.schoolyardExile) {
      // Schoolyard Pick exile — not chosen by either captain
      _exHtml += `<div style="text-align:center;margin-bottom:14px">
        <div style="font-size:11px;font-weight:700;letter-spacing:1px;color:#f85149;text-transform:uppercase;margin-bottom:8px">NOT CHOSEN</div>
        <div style="font-size:13px;color:#8b949e;line-height:1.5">Neither captain picked ${_tw.exiled}. ${_exPr.Sub} ${_exPr.sub==='they'?'are':'is'} sent to Exile Island alone.</div>
      </div>`;
    } else if (_tw.exileChooserMembers?.length) {
      // Pre-merge: whole winning tribe decided — show portraits + tribe colour + reasoning
      const _dot = `<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${_tc};margin-right:6px;vertical-align:middle"></span>`;
      const _exTargetS = pStats(_tw.exiled);
      const _exReason = _exTargetS.intuition >= 7 ? `${_tw.exiled} is perceptive — sending ${_exPr.obj} to exile keeps ${_exPr.obj} away from camp politics.`
        : _exTargetS.strategic >= 7 ? `${_tw.exiled} is a strategic player — isolating ${_exPr.obj} before tribal disrupts ${_exPr.posAdj} plans.`
        : _exTargetS.physical >= 7 ? `${_tw.exiled} is a physical threat — exile can't weaken ${_exPr.obj}, but it can isolate ${_exPr.obj}.`
        : _exTargetS.social >= 7 ? `${_tw.exiled} is well-connected — sending ${_exPr.obj} away strips ${_exPr.obj} of ${_exPr.posAdj} influence before the vote.`
        : `${_tw.exiled} drew the short straw. The tribe didn't overthink it.`;
      _exHtml += `<div style="text-align:center;margin-bottom:14px">
        <div style="font-size:11px;font-weight:700;letter-spacing:1px;color:${_tc};text-transform:uppercase;margin-bottom:8px">${_dot}${_tw.exileChooserTribe} — tribe decision</div>
        <div style="display:flex;flex-wrap:wrap;justify-content:center;gap:6px;margin-bottom:10px">
          ${_tw.exileChooserMembers.map(m => rpPortrait(m)).join('')}
        </div>
        <div style="font-size:13px;color:#8b949e;line-height:1.5">After the challenge, <span style="color:${_tc};font-weight:600">${_tw.exileChooserTribe}</span> gathered and made their choice.<br><span style="font-size:12px;font-style:italic;color:#6b7280">${_exReason}</span></div>
      </div>`;
    } else if (_tw.exileChooser) {
      // Post-merge: immunity winner's personal call + reasoning
      const _exChBond = getBond(_tw.exileChooser, _tw.exiled);
      const _exChReason = _exChBond <= -1 ? `There's bad blood between them. This was personal.`
        : threatScore(_tw.exiled) >= 2.5 ? `${_tw.exiled} is too dangerous to leave at camp unchecked.`
        : `${_tw.exileChooser} wants ${_tw.exiled} isolated before the vote.`;
      _exHtml += _renderTwistScene({ text: `${_tw.exileChooser} won immunity — and used that power to send ${_tw.exiled} to Exile Island. ${_exChReason}`, players: [_tw.exileChooser, _tw.exiled] });
    }

    _exHtml += _renderTwistScene({ text: _tw.schoolyardExile
      ? `${_tw.exiled} is sent to Exile Island. ${_exPr.Sub} will skip this episode's challenge and tribal — and return to the tribe that loses a member.`
      : `${_tw.exiled} is sent to Exile Island and will miss Tribal Council tonight.`,
      players: [_tw.exiled], badge: 'Sent to Exile', badgeClass: 'bad' });

    // What did the exiled player find?
    const _exFound = _tw.exileFound;
    if (_exFound?.type === 'idol') {
      _exHtml += _renderTwistScene({ text: `${_tw.exiled} searched the island — and found a Hidden Immunity Idol.`, players: [_tw.exiled], badge: 'Idol Found', badgeClass: 'win' });
    } else if (_exFound?.type === 'secondLife') {
      _exHtml += _renderTwistScene({ text: `${_tw.exiled} searched the island — and found the Second Life Amulet buried under a rock. If ${pronouns(_tw.exiled).sub} ${pronouns(_tw.exiled).sub==='they'?'get':'gets'} voted out, ${pronouns(_tw.exiled).sub} can fight to stay.`, players: [_tw.exiled], badge: 'Second Life Amulet', badgeClass: 'win' });
    } else if (_exFound?.type === 'extraVote') {
      _exHtml += _renderTwistScene({ text: `${_tw.exiled} searched the island — and found an Extra Vote hidden in the shelter.`, players: [_tw.exiled], badge: 'Extra Vote', badgeClass: 'win' });
    } else if (_tw.exileFound?.type === 'safetyNoPower') {
      _exHtml += _renderTwistScene({ text: `${_tw.exiled} searched the island — and found a Safety Without Power. An escape hatch from tribal — but it costs ${pronouns(_tw.exiled).obj} ${pronouns(_tw.exiled).posAdj} vote.`, players: [_tw.exiled], badge: 'Safety Without Power', badgeClass: 'win' });
    } else if (_tw.exileFound?.type === 'soleVote') {
      _exHtml += _renderTwistScene({ text: `${_tw.exiled} searched the island — and found a Sole Vote. When played, ${pronouns(_tw.exiled).sub} cast${pronouns(_tw.exiled).sub==='they'?'':'s'} the only vote. Everyone else is silenced.`, players: [_tw.exiled], badge: 'Sole Vote', badgeClass: 'win' });
    } else if (_exFound?.type === 'clue') {
      _exHtml += _renderTwistScene({ text: `${_tw.exiled} searched the island — and found a clue to a Hidden Immunity Idol back at camp.`, players: [_tw.exiled], badge: 'Idol Clue', badgeClass: 'win' });
    } else {
      _exHtml += _renderTwistScene({ text: `${_tw.exiled} searched the island thoroughly — but came up empty.`, players: [_tw.exiled] });
    }

    _exHtml += `</div>`;
    vpScreens.push({ id: 'exile-island', label: 'Exile Island', html: _exHtml });
  }

  // ── Exile Format: automatic exile (same visual format as exile-island twist) ──
  if (ep.exileFormatData?.exiled) {
    const _exfData = ep.exileFormatData;
    const _exfPr = pronouns(_exfData.exiled);
    const _exfTc = tribeColor(_exfData.chooserTribe || '');
    let _exfHtml = `<div class="rp-page rp-twist-page tod-dusk">
      <div class="rp-eyebrow">Episode ${ep.num}</div>
      <div class="rp-twist-title">Exile Island</div>`;

    if (_exfData.chooserMembers?.length) {
      // Pre-merge: whole winning tribe decided — show portraits + tribe colour + reasoning
      const _exfDot = `<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${_exfTc};margin-right:6px;vertical-align:middle"></span>`;
      // Reasoning for why this player was chosen
      const _exfTarget = _exfData.exiled;
      const _exfTargetS = pStats(_exfTarget);
      const _exfReason = _exfTargetS.intuition >= 7 ? `${_exfTarget} is perceptive — sending ${_exfPr.obj} to exile keeps ${_exfPr.obj} away from camp politics.`
        : _exfTargetS.strategic >= 7 ? `${_exfTarget} is a strategic player — isolating ${_exfPr.obj} before tribal disrupts ${_exfPr.posAdj} plans.`
        : _exfTargetS.physical >= 7 ? `${_exfTarget} is a physical threat — exile can't weaken ${_exfPr.obj}, but it can isolate ${_exfPr.obj}.`
        : _exfTargetS.social >= 7 ? `${_exfTarget} is well-connected — sending ${_exfPr.obj} away strips ${_exfPr.obj} of ${_exfPr.posAdj} influence before the vote.`
        : `${_exfTarget} drew the short straw. The tribe didn't overthink it.`;
      _exfHtml += `<div style="text-align:center;margin-bottom:14px">
        <div style="font-size:11px;font-weight:700;letter-spacing:1px;color:${_exfTc};text-transform:uppercase;margin-bottom:8px">${_exfDot}${_exfData.chooserTribe} — tribe decision</div>
        <div style="display:flex;flex-wrap:wrap;justify-content:center;gap:6px;margin-bottom:10px">
          ${_exfData.chooserMembers.map(m => rpPortrait(m)).join('')}
        </div>
        <div style="font-size:13px;color:#8b949e;line-height:1.5">After the challenge, <span style="color:${_exfTc};font-weight:600">${_exfData.chooserTribe}</span> gathered and made their choice.<br><span style="font-size:12px;font-style:italic;color:#6b7280">${_exfReason}</span></div>
      </div>`;
    } else if (_exfData.chooser) {
      // Post-merge: immunity winner's personal call
      const _exfTarget = _exfData.exiled;
      const _exfChBond = getBond(_exfData.chooser, _exfTarget);
      const _exfChReason = _exfChBond <= -1 ? `There's bad blood between them. This was personal.`
        : threatScore(_exfTarget) >= 2.5 ? `${_exfTarget} is too dangerous to leave at camp unchecked.`
        : `${_exfData.chooser} wants ${_exfTarget} isolated before the vote.`;
      _exfHtml += _renderTwistScene({ text: `${_exfData.chooser} won immunity — and used that power to send ${_exfTarget} to Exile Island. ${_exfChReason}`, players: [_exfData.chooser, _exfTarget] });
    }

    _exfHtml += _renderTwistScene({ text: `${_exfData.exiled} is sent to Exile Island. ${_exfPr.Sub} will search for advantages — but ${_exfPr.sub} ${_exfPr.sub === 'they' ? 'are' : 'is'} not safe. ${_exfPr.Sub} will return for Tribal Council.`, players: [_exfData.exiled], badge: 'Sent to Exile', badgeClass: 'bad' });

    // What did the exiled player find?
    const _exfFound = _exfData.exileFound;
    if (_exfFound?.type === 'idol') {
      _exfHtml += _renderTwistScene({ text: `${_exfData.exiled} searched the island — and found a Hidden Immunity Idol.`, players: [_exfData.exiled], badge: 'Idol Found', badgeClass: 'win' });
    } else if (_exfFound?.type === 'secondLife') {
      _exfHtml += _renderTwistScene({ text: `${_exfData.exiled} searched the island — and found the Second Life Amulet buried under a rock. If ${_exfPr.sub} ${_exfPr.sub==='they'?'get':'gets'} voted out, ${_exfPr.sub} can fight to stay.`, players: [_exfData.exiled], badge: 'Second Life Amulet', badgeClass: 'win' });
    } else if (_exfFound?.type === 'extraVote') {
      _exfHtml += _renderTwistScene({ text: `${_exfData.exiled} searched the island — and found an Extra Vote hidden in the shelter.`, players: [_exfData.exiled], badge: 'Extra Vote', badgeClass: 'win' });
    } else if (_exfFound?.type === 'safetyNoPower') {
      _exfHtml += _renderTwistScene({ text: `${_exfData.exiled} searched the island — and found a Safety Without Power. An escape hatch from tribal — but it costs ${_exfPr.obj} ${_exfPr.posAdj} vote.`, players: [_exfData.exiled], badge: 'Safety Without Power', badgeClass: 'win' });
    } else if (_exfFound?.type === 'soleVote') {
      _exfHtml += _renderTwistScene({ text: `${_exfData.exiled} searched the island — and found a Sole Vote. When played, ${_exfPr.sub} cast${_exfPr.sub==='they'?'':'s'} the only vote. Everyone else is silenced.`, players: [_exfData.exiled], badge: 'Sole Vote', badgeClass: 'win' });
    } else if (_exfFound?.type === 'clue') {
      _exfHtml += _renderTwistScene({ text: `${_exfData.exiled} searched the island — and found a clue to a Hidden Immunity Idol back at camp.`, players: [_exfData.exiled], badge: 'Idol Clue', badgeClass: 'win' });
    } else {
      _exfHtml += _renderTwistScene({ text: `${_exfData.exiled} searched the island thoroughly — but came up empty.`, players: [_exfData.exiled] });
    }

    _exfHtml += `</div>`;
    vpScreens.push({ id: 'exile-format', label: 'Exile Island', html: _exfHtml });
  }

  // ── 5c. Kidnapping (post-challenge — shown AFTER challenge) ──
  const _kidTwVP = (ep.twists || []).find(t => t.type === 'kidnapping' && t.kidnapped);
  if (_kidTwVP) {
    const _scenes = generateTwistScenes(ep).find(s => s.type === 'kidnapping');
    if (_scenes?.scenes?.length) {
      let _kidHtml = `<div class="rp-page rp-twist-page tod-dusk"><div class="rp-eyebrow">Episode ${ep.num}</div>`;
      _kidHtml += `<div class="rp-twist-title">Kidnapping</div>`;
      _scenes.scenes.forEach(s => { _kidHtml += _renderTwistScene(s); });
      _kidHtml += `</div>`;
      vpScreens.push({ id: 'kidnapping', label: 'Kidnapping', html: _kidHtml });
    }
  }

  // ── 5d. Shared Immunity result (post-challenge) ──
  const _sharedTwVP = (ep.twists || []).find(t => t.type === 'shared-immunity' && t.sharedWith);
  if (_sharedTwVP && ep.immunityWinner) {
    let _siHtml = `<div class="rp-page rp-twist-page tod-dusk"><div class="rp-eyebrow">Episode ${ep.num}</div>`;
    _siHtml += `<div class="rp-twist-title">Shared Immunity</div>`;
    _siHtml += _renderTwistScene({ text: `${ep.immunityWinner} won individual immunity — and with it, a decision to make.`, players: [ep.immunityWinner] });
    _siHtml += _renderTwistScene({ text: `${ep.immunityWinner} shares the necklace with ${_sharedTwVP.sharedWith}. Both are safe tonight.`, players: [ep.immunityWinner, _sharedTwVP.sharedWith], badge: 'SHARED IMMUNITY', badgeClass: 'win' });
    if (_sharedTwVP.reason) _siHtml += _renderTwistScene({ text: _sharedTwVP.reason, players: [ep.immunityWinner, _sharedTwVP.sharedWith] });
    if (_sharedTwVP.snubbed) _siHtml += _renderTwistScene({ text: `${_sharedTwVP.snubbed} expected to be picked. The necklace went to someone else. That silence says everything.`, players: [_sharedTwVP.snubbed], badge: 'SNUBBED', badgeClass: 'bad' });
    _siHtml += `</div>`;
    vpScreens.push({ id: 'shared-immunity', label: 'Shared Immunity', html: _siHtml });
  }

  // ── 5e. Double Safety result (post-challenge) ──
  const _dblSafeTwVP = (ep.twists || []).find(t => t.type === 'double-safety' && t.secondImmune);
  if (_dblSafeTwVP && ep.immunityWinner) {
    let _dsHtml = `<div class="rp-page rp-twist-page tod-dusk"><div class="rp-eyebrow">Episode ${ep.num}</div>`;
    _dsHtml += `<div class="rp-twist-title">Double Safety</div>`;
    _dsHtml += _renderTwistScene({ text: `${ep.immunityWinner} wins immunity.`, players: [ep.immunityWinner], badge: 'IMMUNE', badgeClass: 'win' });
    _dsHtml += _renderTwistScene({ text: `${_dblSafeTwVP.secondImmune} finishes second — also safe tonight.`, players: [_dblSafeTwVP.secondImmune], badge: 'SAFE', badgeClass: 'win' });
    if (_dblSafeTwVP.reason) _dsHtml += _renderTwistScene({ text: _dblSafeTwVP.reason, players: [_dblSafeTwVP.secondImmune] });
    _dsHtml += `</div>`;
    vpScreens.push({ id: 'double-safety', label: 'Double Safety', html: _dsHtml });
  }

  // ── 5f. Hero Duel result (post-challenge) ──
  const _heroDuelTwVP = (ep.twists || []).find(t => t.type === 'hero-duel' && t.duelWinner);
  if (_heroDuelTwVP) {
    const _hd = _heroDuelTwVP;
    let _hdHtml = `<div class="rp-page rp-twist-page tod-arena"><div class="rp-eyebrow">Episode ${ep.num}</div>`;
    _hdHtml += `<div class="rp-twist-title">Hero Duel</div>`;
    if (_hd.duelReason) _hdHtml += _renderTwistScene({ text: _hd.duelReason, players: _hd.duelParticipants || [] });
    _hdHtml += _renderTwistScene({ text: `${_hd.duelParticipants[0]} vs ${_hd.duelParticipants[1]}. Head-to-head. One walks away safe.`, players: _hd.duelParticipants || [] });
    _hdHtml += _renderTwistScene({ text: `${_hd.duelWinner} wins the Hero Duel.`, players: [_hd.duelWinner], badge: _hd.duelType === 'immunity' ? 'IMMUNE' : 'SAFE', badgeClass: 'win' });
    _hdHtml += _renderTwistScene({ text: `${_hd.duelLoser} loses. ${pronouns(_hd.duelLoser).Sub} ${pronouns(_hd.duelLoser).sub==='they'?'are':'is'} vulnerable tonight.`, players: [_hd.duelLoser], badge: 'VULNERABLE', badgeClass: 'bad' });
    _hdHtml += `</div>`;
    vpScreens.push({ id: 'hero-duel', label: 'Hero Duel', html: _hdHtml });
  }

  // ── 5g. Guardian Angel result (post-challenge) ──
  const _gaTwVP = (ep.twists || []).find(t => t.type === 'guardian-angel' && t.guardianAngel);
  if (_gaTwVP) {
    let _gaHtml = `<div class="rp-page rp-twist-page tod-golden"><div class="rp-eyebrow">Episode ${ep.num}</div>`;
    _gaHtml += `<div class="rp-twist-title">Guardian Angel</div>`;
    _gaHtml += _renderTwistScene({ text: `${_gaTwVP.guardianAngel} is the most liked player in the game right now.`, players: [_gaTwVP.guardianAngel], badge: 'GUARDIAN ANGEL', badgeClass: 'win' });
    if (_gaTwVP.gaReason) _gaHtml += _renderTwistScene({ text: _gaTwVP.gaReason, players: [_gaTwVP.guardianAngel] });
    _gaHtml += _renderTwistScene({ text: `${_gaTwVP.guardianAngel} is safe tonight.`, players: [_gaTwVP.guardianAngel], badge: 'Immune', badgeClass: 'win' });
    if (_gaTwVP.gaRunnerUp) _gaHtml += _renderTwistScene({ text: `${_gaTwVP.gaRunnerUp} was the closest to earning the Guardian Angel. So close — but not enough.`, players: [_gaTwVP.gaRunnerUp] });
    _gaHtml += `</div>`;
    vpScreens.push({ id: 'guardian-angel', label: 'Guardian Angel', html: _gaHtml });
  }

  // ── 6. Post-Challenge Camp — one screen per tribe with post events ──
  vpTribeGroups.forEach(tribe => {
    const phaseData = ep.campEvents?.[tribe.name];
    const postEvs = Array.isArray(phaseData) ? [] : (phaseData?.post || []);
    const hasTipOff = !!ep.tipOffCampEvents?.[tribe.name];
    if (!postEvs.length && !hasTipOff) return;
    // Post-challenge camp (pre-tribal): use start-of-episode members, adjusted for kidnapping.
    // Kidnapped player moves to winner tribe's camp for this episode only.
    let postMembers = tribe.members.length
      ? [...tribe.members]
      : [...(ep.gsSnapshot?.activePlayers || gs.activePlayers)];
    const _kidTwPost = (ep.twists||[]).find(t => t.type === 'kidnapping' && t.kidnapped);
    if (_kidTwPost) {
      if (tribe.name === _kidTwPost.fromTribe) postMembers = postMembers.filter(m => m !== _kidTwPost.kidnapped);
      if (tribe.name === _kidTwPost.toTribe && !postMembers.includes(_kidTwPost.kidnapped)) postMembers.push(_kidTwPost.kidnapped);
    }
    const _tcPost = tribeColor(tribe.name);
    const _dotPost = `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${_tcPost};margin-right:6px;flex-shrink:0"></span>`;
    const _isMergeCampPost = tribe.name === 'merge' || tribe.name === (gs.mergeName||'merged');
    vpScreens.push({
      id: `camp-post-${tribe.name}`,
      label: `${_dotPost}${_isMergeCampPost ? 'Camp — After TC' : `${tribe.name} — After TC`}`,
      html: rpBuildCampTribe(ep, tribe.name, postMembers, 'post'),
    });
  });

  // ── Triple Dog Dare — replaces challenge + tribal + votes ──
  if (ep.isTripleDogDare && ep.tripleDogDare) {
    vpScreens.push({ id:'tdd-announce', label:'Triple Dog Dare', html: rpBuildTripleDogDareAnnouncement(ep) });
    vpScreens.push({ id:'tdd-rounds', label:'The Dares', html: rpBuildTripleDogDareRounds(ep) });
    vpScreens.push({ id:'tdd-elimination', label:'Eliminated', html: rpBuildTripleDogDareElimination(ep) });
    // RI/Rescue screens
    if (ep.riLifeEvents?.length || ep.riDuel) {
      const _tddRiLife = rpBuildRILife(ep);
      if (_tddRiLife) vpScreens.push({ id:'ri-life', label:'RI Life', html: _tddRiLife });
      const _tddRiDuel = rpBuildRIDuel(ep);
      if (_tddRiDuel) vpScreens.push({ id:'ri-duel', label:'RI Duel', html: _tddRiDuel });
    }
    if (ep.rescueIslandEvents?.length) {
      const _tddRescLife = rpBuildRescueIslandLife(ep);
      if (_tddRescLife) vpScreens.push({ id:'rescue-life', label:'Rescue Island', html: _tddRescLife });
    }
  }

  // ── Slasher Night — replaces challenge + tribal + votes ──
  if (ep.isSlasherNight && ep.slasherNight) {
    vpScreens.push({ id:'slasher-announce', label:'Slasher Night', html: rpBuildSlasherAnnouncement(ep) });
    vpScreens.push({ id:'slasher-rounds', label:'The Hunt', html: rpBuildSlasherRounds(ep) });
    vpScreens.push({ id:'slasher-showdown', label:'Final Showdown', html: rpBuildSlasherShowdown(ep) });
    vpScreens.push({ id:'slasher-immunity', label:'Immunity', html: rpBuildSlasherImmunity(ep) });
    vpScreens.push({ id:'slasher-elimination', label:'Eliminated', html: rpBuildSlasherElimination(ep) });
    vpScreens.push({ id:'slasher-leaderboard', label:'Leaderboard', html: rpBuildSlasherLeaderboard(ep) });
    // RI/Rescue Island screens
    if (ep.riLifeEvents?.length || ep.riDuel) {
      const _slRiLife = rpBuildRILife(ep);
      if (_slRiLife) vpScreens.push({ id:'ri-life', label:'Redemption Island', html: _slRiLife });
    }
    if (ep.riDuel) {
      const _slRiDuel = rpBuildRIDuel(ep);
      if (_slRiDuel) vpScreens.push({ id:'ri-duel', label:'RI Duel', html: _slRiDuel });
    }
    if (ep.rescueIslandEvents?.length) {
      const _slRescLife = rpBuildRescueIslandLife(ep);
      if (_slRescLife) vpScreens.push({ id:'rescue-life', label:'Rescue Island', html: _slRescLife });
    }
    // Camp Overview + Aftermath flow normally after
    const _slRelHtml = rpBuildRelationships(ep);
    if (_slRelHtml) vpScreens.push({ id:'relationships', label:'Camp Overview', html: _slRelHtml });
    vpScreens.push({ id:'aftermath', label:'Aftermath', html: rpBuildAftermath(ep) });
    return;
  }

  // ── Sudden Death — challenge + auto-elimination, no tribal ──
  if (ep.isSuddenDeath && ep.suddenDeathEliminated) {
    // Challenge screen already added above (it's a regular individual challenge)
    // Add a sudden death elimination card
    const _sdElim = ep.suddenDeathEliminated;
    const _sdPr = pronouns(_sdElim);
    const _sdS = pStats(_sdElim);
    const _sdPick = arr => arr[([..._sdElim].reduce((a,c)=>a+c.charCodeAt(0),0)+(ep.num||0)*7)%arr.length];
    let _sdHtml = `<div class="rp-page tod-deepnight">
      <div class="rp-eyebrow">Episode ${ep.num}</div>
      <div style="font-family:var(--font-display);font-size:28px;letter-spacing:2px;text-align:center;color:#f85149;margin-bottom:4px;text-shadow:0 0 20px rgba(248,81,73,0.3)">SUDDEN DEATH</div>
      <div style="width:60px;height:2px;background:#f85149;margin:8px auto 20px"></div>
      <div style="text-align:center;font-size:13px;color:#8b949e;margin-bottom:24px">Last place in the challenge. No vote. No tribal. No second chance.</div>
      <div style="text-align:center;margin-bottom:20px">
        ${rpPortrait(_sdElim, 'xl')}
        <div style="font-family:var(--font-display);font-size:20px;color:#f85149;margin-top:10px">${_sdElim}</div>
        <div style="font-size:10px;font-weight:700;letter-spacing:2px;color:#f85149;margin-top:4px">AUTO-ELIMINATED</div>
        <div style="font-size:11px;color:#8b949e;margin-top:6px">${vpArchLabel(_sdElim)}</div>
      </div>
      <div style="padding:12px;background:rgba(139,148,158,0.04);border:1px solid rgba(139,148,158,0.08);border-radius:8px;text-align:center">
        <div style="font-size:12px;color:#8b949e;font-style:italic;line-height:1.6">${_sdPick([
          `"I didn't get voted out. I didn't get blindsided. I just... lost. That's the hardest way to go — knowing it was on me."`,
          `"No tribal. No speech. No chance to fight for my life. One bad challenge and it's over. That's Sudden Death."`,
          `"I gave everything I had in that challenge. It wasn't enough. There's no one to blame but myself."`,
          `"The worst part isn't losing. It's knowing that if this had been a regular episode, I might have survived tribal. But there was no tribal. Just the challenge. And I was last."`,
        ])}</div>
      </div>`;
    // Black Vote display
    const _sdBvc = ep.blackVote;
    if (_sdBvc) {
      _sdHtml += `<div style="margin-top:16px;padding:12px;border:1px solid rgba(99,102,241,0.25);border-radius:8px;background:rgba(99,102,241,0.04);text-align:center">
        <div style="font-size:9px;font-weight:700;letter-spacing:2px;color:#818cf8;margin-bottom:6px">BLACK VOTE CAST</div>
        <div style="font-size:12px;color:#c9d1d9;line-height:1.5">${
          _sdBvc.type === 'classic'
            ? `Before leaving, ${_sdBvc.from} casts a Black Vote against <strong style="color:#f85149">${_sdBvc.target}</strong>.`
            : `Before leaving, ${_sdBvc.from} gifts an Extra Vote to <strong style="color:#3fb950">${_sdBvc.recipient}</strong>.`
        }</div>
        <div style="display:flex;justify-content:center;gap:8px;margin-top:8px">
          ${rpPortrait(_sdBvc.from, 'sm')}
          <span style="font-size:16px;color:#818cf8;align-self:center">\u2192</span>
          ${rpPortrait(_sdBvc.type === 'classic' ? _sdBvc.target : _sdBvc.recipient, 'sm')}
        </div>
      </div>`;
    }
    _sdHtml += `</div>`;
    vpScreens.push({ id:'sudden-death', label:'Sudden Death', html: _sdHtml });

    // Camp Overview + Aftermath
    const _sdRelHtml = rpBuildRelationships(ep);
    if (_sdRelHtml) vpScreens.push({ id:'relationships', label:'Camp Overview', html: _sdRelHtml });
    vpScreens.push({ id:'aftermath', label:'Aftermath', html: rpBuildAftermath(ep) });
    return;
  }

  // ── Spirit Island — shows after challenge, before voting plans/tribal ──
  if (ep.spiritIslandEvents?.length) {
    const _siHtml = rpBuildSpiritIsland(ep);
    if (_siHtml) vpScreens.push({ id:'spirit-island', label:'Spirit Island', html: _siHtml });
  }

  // ── Fan Vote screen ──
  const _fvTw = (ep.twists || []).find(t => (t.type === 'fan-vote-boot' || t.catalogId === 'fan-vote-boot') && t.fanVoteSaved);
  if (_fvTw) {
    const _fvHtml = rpBuildFanVote(ep);
    if (_fvHtml) vpScreens.push({ id:'fan-vote', label:'Fan Vote', html: _fvHtml });
  }

  // ── Feast screen (after twists, before camp) ──
  if (ep.feastEvents?.length) {
    const _feastHtml = rpBuildFeast(ep);
    if (_feastHtml) vpScreens.push({ id:'feast', label:'The Feast', html: _feastHtml });
  }

  // ── No Tribal Council — show announcement screen instead of voting/tribal ──
  if (ep.noTribal) {
    const _ntActive = ep.gsSnapshot?.activePlayers || gs.activePlayers;
    const _ntHtml = `<div class="rp-page tod-dusk">
      <div class="rp-eyebrow">Episode ${ep.num}</div>
      <div class="rp-title">No Tribal Council</div>
      <div style="text-align:center;margin:40px 0 30px">
        <div style="font-size:48px;margin-bottom:16px">🚫</div>
        <div style="font-size:18px;color:#e6edf3;font-weight:700;margin-bottom:12px">No one is going home tonight.</div>
        <div style="font-size:13px;color:#8b949e;max-width:400px;margin:0 auto;line-height:1.7">
          The tribe gets a reprieve. No votes, no blindsides, no torches snuffed. Everyone is safe — for now.
        </div>
      </div>
      <div style="display:flex;flex-wrap:wrap;justify-content:center;gap:12px;margin-top:30px">
        ${_ntActive.map(n => `<div style="text-align:center">${rpPortrait(n)}<div style="font-size:10px;color:#8b949e;margin-top:4px">Safe</div></div>`).join('')}
      </div>
    </div>`;
    vpScreens.push({ id:'no-tribal', label:'No Tribal Council', html: _ntHtml });
    // RI/Rescue Island screens
    if (ep.riLifeEvents?.length || ep.riDuel) {
      const _ntRiLife = rpBuildRILife(ep);
      if (_ntRiLife) vpScreens.push({ id:'ri-life', label:'Redemption Island', html: _ntRiLife });
    }
    if (ep.riDuel) {
      const _ntRiDuel = rpBuildRIDuel(ep);
      if (_ntRiDuel) vpScreens.push({ id:'ri-duel', label:'RI Duel', html: _ntRiDuel });
    }
    if (ep.rescueIslandEvents?.length) {
      const _ntRescLife = rpBuildRescueIslandLife(ep);
      if (_ntRescLife) vpScreens.push({ id:'rescue-life', label:'Rescue Island', html: _ntRescLife });
    }
    // Camp Overview + Aftermath
    const _ntRelHtml = rpBuildRelationships(ep);
    if (_ntRelHtml) vpScreens.push({ id:'relationships', label:'Camp Overview', html: _ntRelHtml });
    vpScreens.push({ id:'aftermath', label:'Aftermath', html: rpBuildAftermath(ep) });
    // Debug screen — don't skip it just because there's no tribal
    if (localStorage.getItem('vp_debug') === 'true') {
      const _debugHtml = rpBuildDebug(ep);
      if (_debugHtml) vpScreens.push({ id:'debug', label:'Debug', html: _debugHtml });
    }
    return;
  }

  // ── 8. Voting Plans (pre-vote strategy breakdown) ──
  if (ep.multiTribalResults?.length) {
    // Multi-tribal: one Voting Plans + Tribal + Votes per losing tribe
    ep.multiTribalResults.forEach((r, i) => {
      const _mtVpEp = { ...ep, tribalPlayers: r.tribalPlayers, tribalTribe: r.tribe,
        votingLog: r.log, alliances: r.alliances, immunityWinner: null };
      const _mtVpHtml = rpBuildVotingPlans(_mtVpEp);
      if (_mtVpHtml) vpScreens.push({ id:`voting-plans-${r.tribe}`, label:`${r.tribe} Plans`, html: _mtVpHtml });
    });
  } else if (hasTribal && !_isJuryElim) {
    const _vpHtml = rpBuildVotingPlans(ep);
    if (_vpHtml) vpScreens.push({ id:'voting-plans', label:'Voting Plans', html: _vpHtml });
  }

  // ── 9–10. Tribal screens ──
  if (ep.multiTribalResults?.length) {
    // Multi-tribal: one Tribal + Votes screen per losing tribe
    ep.multiTribalResults.forEach((r, i) => {
      const subEp = { ...ep, tribalPlayers: r.tribalPlayers, tribalTribe: r.tribe,
        votes: r.votes, votingLog: r.log, alliances: r.alliances || ep.alliances,
        eliminated: r.eliminated, isTie: r.isTie, tiedPlayers: r.tiedPlayers,
        idolPlays: r.idolPlays || [], shotInDark: r.shotInDark || null,
        fireMaking: r.fireMaking || null,
        revoteLog: r.revoteLog || null, revoteVotes: r.revoteVotes || null,
        tiebreakerResult: r.tiebreakerResult || null,
        isRockDraw: r.isRockDraw || false,
        sidFreshVote: r.sidFreshVote || false,
        // Clear fields from other tribes so they don't bleed
        firstEliminated: null, votes2: null, votingLog2: null, alliances2: null };
      vpScreens.push({ id:`tribal-${r.tribe}`, label:`${r.tribe} Tribal`, html: rpBuildTribal(subEp) });
      vpScreens.push({ id:`votes-${r.tribe}`,  label:`${r.tribe} Votes`,  html: rpBuildVotes(subEp) });
    });
    // RI/Rescue screens after all multi-tribal votes
    if (ep.riLifeEvents?.length || ep.riDuel) {
      const _mtRiLife = rpBuildRILife(ep);
      if (_mtRiLife) vpScreens.push({ id:'ri-life', label:'Redemption Island', html: _mtRiLife });
    }
    if (ep.riDuel) {
      const _mtRiDuel = rpBuildRIDuel(ep);
      if (_mtRiDuel) vpScreens.push({ id:'ri-duel', label:'RI Duel', html: _mtRiDuel });
    }
    if (ep.rescueIslandEvents?.length) {
      const _mtRescLife = rpBuildRescueIslandLife(ep);
      if (_mtRescLife) vpScreens.push({ id:'rescue-life', label:'Rescue Island', html: _mtRescLife });
    }
  } else if (hasTribal && !_isJuryElim) {
    // The Mole: exposure screen fires right before tribal — the confrontation happens at camp
    const _moleExpHtml = rpBuildMoleExposed(ep);
    if (_moleExpHtml) vpScreens.push({ id:'mole-exposed', label:'The Mole Exposed', html: _moleExpHtml });
    // Tied Destinies announcement screen — inserted earlier in VP flow (before camp life)
    // ── Emissary Scouting screen (BEFORE tribal — emissary visits camp, hears pitches) ──
    if (ep.emissary) {
      const _evScoutHtml = rpBuildEmissaryScouting(ep);
      if (_evScoutHtml) vpScreens.push({ id:'emissary-scouting', label:'The Emissary', html: _evScoutHtml });
    }
    vpScreens.push({ id:'tribal', label:'Tribal Council', html: rpBuildTribal(ep) });
    vpScreens.push({ id:'votes',  label:'The Votes',      html: rpBuildVotes(ep) });

    // ── Emissary's Choice screen (AFTER votes — emissary picks second elimination) ──
    if (ep.emissaryPick) {
      const _evChoiceHtml = rpBuildEmissaryChoice(ep);
      if (_evChoiceHtml) vpScreens.push({ id:'emissary-choice', label:'Emissary\'s Choice', html: _evChoiceHtml });
    }

    // ── Surprise double boot: announcement + vote 2 plans + vote 2 reveal ──
    // Must come BEFORE RI screens — RI shows the eliminated player arriving, which spoils the vote
    if (ep.firstEliminated && !ep.announcedDoubleElim && ep.votingLog2?.length) {
      vpScreens.push({ id:'surprise', label:'Surprise', html: rpBuildSurprise(ep) });
      const _vp2Html = rpBuildVotingPlans2(ep);
      if (_vp2Html) vpScreens.push({ id:'voting-plans-2', label:'Voting Plans 2', html: _vp2Html });
      vpScreens.push({ id:'votes-2', label:'Vote 2', html: rpBuildVotes2(ep) });
    }

    // ── RI Life (after ALL vote reveals) — Redemption format ──
    if (ep.riLifeEvents?.length || ep.riDuel) {
      const _riLifeHtml = rpBuildRILife(ep);
      if (_riLifeHtml) vpScreens.push({ id:'ri-life', label:'Redemption Island', html: _riLifeHtml });
    }

    // ── RI Duel (after RI life) — Redemption format ──
    if (ep.riDuel) {
      const _riHtml = rpBuildRIDuel(ep);
      if (_riHtml) vpScreens.push({ id:'ri-duel', label:'RI Duel', html: _riHtml });
    }

    // ── RI Return (when a player re-enters the game) ──
    // RI Return shown early (after Cold Open) — not here

    // ── Rescue Island Life (after vote reveal) — Rescue format ──
    if (ep.rescueIslandEvents?.length) {
      const _rescLifeHtml = rpBuildRescueIslandLife(ep);
      if (_rescLifeHtml) vpScreens.push({ id:'rescue-life', label:'Rescue Island', html: _rescLifeHtml });
    }

    // Rescue Island Return Challenge shown early (after Cold Open) — not here
  }

  if (ep.isFinale) {
    // ── FINALE-SPECIFIC SCREENS ──

    // Koh-Lanta: orienteering → perch → camp lobbying → choice
    if (ep.klOrienteering) {
      vpScreens.push({ id:'kl-orienteering', label:'Orienteering Race', html: rpBuildKLOrienteering(ep) });
    }
    if (ep.klPerch) {
      vpScreens.push({ id:'kl-perch', label:'The Perch', html: rpBuildKLPerch(ep) });
    }
    if (ep.klChoice) {
      const _klCampHtml = rpBuildKLCampLife(ep);
      if (_klCampHtml) vpScreens.push({ id:'kl-camp', label:'After the Perch', html: _klCampHtml });
      vpScreens.push({ id:'kl-choice', label:'The Choice', html: rpBuildKLChoice(ep) });
    }

    // Fire-Making: camp lobbying → decision → fire duel
    if (ep.firemakingDecision) {
      const _fmCampHtml = rpBuildFiremakingCampLife(ep);
      if (_fmCampHtml) vpScreens.push({ id:'firemaking-camp', label:'After Immunity', html: _fmCampHtml });
      vpScreens.push({ id:'firemaking-decision', label:'The Decision', html: rpBuildFiremakingDecision(ep) });
    }
    if (ep.firemakingResult) {
      vpScreens.push({ id:'firemaking-duel', label:'Fire-Making', html: rpBuildFiremakingDuel(ep) });
    }

    // Fan Vote: lobbying scene before the Decision
    if (ep.finalCut && seasonConfig.finaleFormat === 'fan-vote' && ep.immunityWinner) {
      const _fvCampHtml = rpBuildFanVoteCampLife(ep);
      if (_fvCampHtml) vpScreens.push({ id:'fanvote-camp', label:'After Immunity', html: _fvCampHtml });
    }

    // Final Cut: immunity winner's decision (or jury-cut) — shown after challenge (non-firemaking)
    if (ep.finalCut && !ep.firemaking && !ep.klChoice) {
      vpScreens.push({ id:'final-cut', label:'The Decision', html: rpBuildFinalCut(ep) });
    }

    // The Benches: eliminated players choose sides (when there's a challenge)
    if (ep.benchAssignments) {
      const _benchHtml = rpBuildBenches(ep);
      if (_benchHtml) vpScreens.push({ id:'benches', label:'The Benches', html: _benchHtml });
    }

    // Jury Elimination twist — jury life + announcement + interactive vote reveal
    if (_isJuryElim) {
      const _jeLife = rpBuildJuryLife(ep);
      if (_jeLife) vpScreens.push({ id:'jury-life', label:'Jury Life', html: _jeLife });
      const _jeA = rpBuildJuryConvenes(ep);
      if (_jeA) vpScreens.push({ id:'jury-convenes', label:'Jury Convenes', html: _jeA });
      const _jeV = rpBuildJuryVotes(ep);
      if (_jeV) vpScreens.push({ id:'jury-votes', label:'Jury Votes', html: _jeV });
    }

    // Grand Challenge (final-challenge format only)
    if (ep.finaleChallengeStages?.length) {
      const _gcHtml = rpBuildFinaleGrandChallenge(ep);
      if (_gcHtml) vpScreens.push({ id:'grand-challenge', label:'The Final Challenge', html: _gcHtml });
    }

    // Fan Vote Finale — campaign + vote reveal (replaces FTC)
    if (ep.fanCampaign) {
      const _fcHtml = rpBuildFanCampaign(ep);
      if (_fcHtml) vpScreens.push({ id:'fan-campaign', label:'Fan Campaign', html: _fcHtml });
    }
    if (ep.fanVoteResult) {
      const _fvrHtml = rpBuildFanVoteReveal(ep);
      if (_fvrHtml) vpScreens.push({ id:'fan-vote-reveal', label:'The Fan Vote', html: _fvrHtml });
    }

    // Final Tribal Council (jury-based games only)
    if (ep.juryResult) {
      const _ftcHtml = rpBuildFTC(ep);
      if (_ftcHtml) vpScreens.push({ id:'ftc', label:'Final Tribal', html: _ftcHtml });

      // Jury vote reveal — sequential cards
      const _jvHtml = rpBuildJuryVoteReveal(ep);
      if (_jvHtml) vpScreens.push({ id:'jury-vote', label:'Jury Vote', html: _jvHtml });
    }

    // Winner Ceremony (replaces old rpBuildWinner)
    if (ep.winner) {
      const _wcHtml = rpBuildWinnerCeremony(ep);
      if (_wcHtml) vpScreens.push({ id:'winner-ceremony', label:'Winner', html: _wcHtml });
    }

    // Reunion Show (interactive awards, season recap)
    const _reunionHtml = rpBuildReunion(ep);
    if (_reunionHtml) vpScreens.push({ id:'reunion', label:'Reunion Show', html: _reunionHtml });

    // Season Statistics (full stats + Copy JSON)
    const _statsHtml = rpBuildSeasonStats(ep);
    if (_statsHtml) vpScreens.push({ id:'season-stats', label:'Statistics', html: _statsHtml });

  } else {
    // ── REGULAR EPISODE POST-VOTE ──

    // Jury Elimination — jury life + announcement + interactive vote reveal
    if (_isJuryElim) {
      const _jeLife2 = rpBuildJuryLife(ep);
      if (_jeLife2) vpScreens.push({ id:'jury-life', label:'Jury Life', html: _jeLife2 });
      const _jeA2 = rpBuildJuryConvenes(ep);
      if (_jeA2) vpScreens.push({ id:'jury-convenes', label:'Jury Convenes', html: _jeA2 });
      const _jeV2 = rpBuildJuryVotes(ep);
      if (_jeV2) vpScreens.push({ id:'jury-votes', label:'Jury Votes', html: _jeV2 });
    }

    // Post-elimination twists (fire-making, exile duel, etc.)
    const _postElimHtml = rpBuildPostElimTwist(ep);
    if (_postElimHtml) vpScreens.push({ id:'post-twist', label:'Post-Vote Twist', html: _postElimHtml });

    // RI Life + Duel (for non-tribal episodes OR jury elimination)
    if ((!hasTribal || _isJuryElim) && (ep.riLifeEvents?.length || ep.riDuel)) {
      const _riLife2 = rpBuildRILife(ep);
      if (_riLife2) vpScreens.push({ id:'ri-life', label:'Redemption Island', html: _riLife2 });
      if (ep.riDuel) {
        const _riDuel2 = rpBuildRIDuel(ep);
        if (_riDuel2) vpScreens.push({ id:'ri-duel', label:'RI Duel', html: _riDuel2 });
      }
    }
    // RI Return shown early (after Cold Open) — not here
    if (false) {
    }

    // Rescue Island Life + Return (for non-tribal or jury elimination episodes)
    if ((!hasTribal || _isJuryElim) && ep.rescueIslandEvents?.length) {
      const _rescLife2 = rpBuildRescueIslandLife(ep);
      if (_rescLife2) vpScreens.push({ id:'rescue-life', label:'Rescue Island', html: _rescLife2 });
    }
    // Rescue Island Return Challenge shown early (after Cold Open) — not here

    // Camp Overview (alliances + advantages + betrayals) — after votes so it reflects post-tribal state
    const _relHtml = rpBuildRelationships(ep);
    if (_relHtml) vpScreens.push({ id:'relationships', label:'Camp Overview', html: _relHtml });

    // Aftermath
    vpScreens.push({ id:'aftermath', label:'Aftermath', html: rpBuildAftermath(ep) });
  }

  // ── Aftermath Show screens ──
  if (ep.aftermath) {
    const _am = ep.aftermath;
    const _amDot = `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#6366f1;margin-right:6px;flex-shrink:0"></span>`;
    // Opening
    const _amOpen = rpBuildAftermathOpening(ep);
    if (_amOpen) vpScreens.push({ id: 'aftermath-opening', label: `${_amDot}${_am.isReunion ? 'The Reunion' : 'Aftermath Opening'}`, html: _amOpen });
    // Interviews
    _am.interviews.filter(iv => !iv.isActive).forEach((iv, i) => {
      const _amIv = rpBuildAftermathInterview(ep, iv);
      if (_amIv) vpScreens.push({ id: `aftermath-iv-${i}`, label: `${_amDot}Interview — ${iv.player}`, html: _amIv });
    });
    // Truth or Anvil
    const _amTruth = rpBuildAftermathTruth(ep);
    // Aftermath Moments (MULTIPLE) — dialogue-driven
    const _momLabels = { confrontation: 'Confrontation', gallery_eruption: 'Gallery Eruption', emotional: 'Emotional Moment', standing_ovation: 'Standing Ovation', host_roast: 'Host Roast' };
    const _momColors = { confrontation: '#ef4444', gallery_eruption: '#ec4899', emotional: '#8b949e', standing_ovation: '#10b981', host_roast: '#f59e0b' };
    (_am.aftermathMoments || []).forEach((_mom, mi) => {
      const _momCol = _momColors[_mom.type] || '#f59e0b';
      let _momHtml = `<div class="rp-page tod-studio">
        <div class="aftermath-live">LIVE</div>
        <div class="aftermath-title" style="font-size:22px;text-align:center;margin:16px 0 16px;color:${_momCol}">${_momLabels[_mom.type] || 'AFTERMATH MOMENT'}</div>`;

      // Portraits
      if (_mom.type !== 'host_roast' && _mom.players?.length) {
        _momHtml += `<div style="display:flex;justify-content:center;gap:16px;margin-bottom:16px">${_mom.players.map(p => `<div style="text-align:center">${rpPortrait(p, 'lg')}<div style="font-size:11px;color:#f5f0e8;font-weight:600;margin-top:4px">${p}</div></div>`).join('')}</div>`;
      }

      // Dialogue lines (confrontation, gallery eruption)
      if (_mom.dialogue?.length) {
        const _hostName = seasonConfig.host || 'Chris';
        _mom.dialogue.forEach(line => {
          const _isHost = line.speaker === _hostName;
          const _speakerCol = _isHost ? '#f59e0b' : _momCol;
          const _bgCol = _isHost ? 'rgba(245,158,11,0.04)' : `${_momCol}08`;
          const _borderCol = _isHost ? 'rgba(245,158,11,0.15)' : `${_momCol}20`;
          _momHtml += `<div style="display:flex;align-items:flex-start;gap:8px;padding:10px;margin-bottom:6px;background:${_bgCol};border:1px solid ${_borderCol};border-radius:8px">
            ${!_isHost ? rpPortrait(line.speaker, 'sm') : '<div style="font-size:20px;width:36px;text-align:center">🎤</div>'}
            <div style="flex:1">
              <div style="font-size:10px;color:${_speakerCol};font-weight:700">${line.speaker}</div>
              <div style="font-size:13px;color:#f5f0e8;line-height:1.6">${line.text}</div>
            </div>
          </div>`;
        });
      }

      // Text fallback (emotional, standing ovation) — not host_roast, which renders its own intro
      if (_mom.text && !_mom.dialogue?.length && _mom.type !== 'host_roast') {
        _momHtml += `<div class="aftermath-card-gold" style="text-align:center">
          <div style="font-size:14px;color:#f5f0e8;line-height:1.7;font-style:italic">${_mom.text}</div>
        </div>`;
      }

      // Host roast cards
      if (_mom.type === 'host_roast' && _mom.roasts?.length) {
        _momHtml += `<div style="font-size:13px;color:#f5f0e8;font-style:italic;text-align:center;margin-bottom:12px">${_mom.text}</div>`;
        _mom.roasts.forEach((roast, ri) => {
          _momHtml += `<div style="display:flex;align-items:center;gap:10px;padding:10px;margin-bottom:6px;background:rgba(245,158,11,0.03);border:1px solid rgba(245,158,11,0.12);border-radius:8px;animation:slideInLeft ${0.3 + ri * 0.15}s both">
            ${rpPortrait(_mom.players[ri], 'sm')}
            <div style="flex:1">
              <div style="font-size:10px;color:#f59e0b;font-weight:700">${seasonConfig.host || 'Chris'}</div>
              <div style="font-size:13px;color:#f5f0e8;line-height:1.5">${roast}</div>
            </div>
          </div>`;
        });
      }

      _momHtml += `</div>`;
      vpScreens.push({ id: `aftermath-moment-${mi}`, label: `${_amDot}${_momLabels[_mom.type] || 'Moment'}`, html: _momHtml });
    });
    if (_amTruth) vpScreens.push({ id: 'aftermath-truth', label: `${_amDot}Truth or Anvil`, html: _amTruth });
    // Unseen Footage
    const _amFootage = rpBuildAftermathFootage(ep);
    if (_amFootage) vpScreens.push({ id: 'aftermath-footage', label: `${_amDot}Unseen Footage`, html: _amFootage });
    // Fan Call
    const _amFanCall = rpBuildAftermathFanCall(ep);
    if (_amFanCall) vpScreens.push({ id: 'aftermath-fancall', label: `${_amDot}Fan Call`, html: _amFanCall });
    // Fan Vote
    const _amFanVote = rpBuildAftermathFanVote(ep);
    if (_amFanVote) vpScreens.push({ id: 'aftermath-fanvote', label: `${_amDot}Fan Vote`, html: _amFanVote });
    // Reunion: Winner Interview + Awards
    if (_am.isReunion) {
      // All finalists get interviews — winner + runner(s) up
      const _finalistIvs = _am.interviews.filter(iv => iv.isActive);
      _finalistIvs.forEach((fiv, fi) => {
        const _isWinner = fiv.player === ep.winner;
        const _fLabel = _isWinner ? 'Winner Interview' : `Runner-Up — ${fiv.player}`;
        const _fivHtml = rpBuildAftermathInterview(ep, fiv);
        if (_fivHtml) vpScreens.push({ id: `aftermath-finalist-${fi}`, label: `${_amDot}${_fLabel}`, html: _fivHtml });
      });
      // Reunion Discussion — group topics with dialogue
      if (_am.reunionDiscussion?.length) {
        _am.reunionDiscussion.forEach((topic, ti) => {
          let _tdHtml = `<div class="rp-page tod-studio">
            <div class="aftermath-live">LIVE</div>
            <div style="font-size:9px;font-weight:700;letter-spacing:2px;color:#f59e0b;text-align:center;margin-bottom:4px">THE REUNION</div>
            <div class="aftermath-title" style="font-size:20px;text-align:center;margin-bottom:16px">${topic.title}</div>`;
          topic.lines.forEach(line => {
            const _isHost = line.speaker === (seasonConfig.host || 'Chris');
            const _spCol = _isHost ? '#f59e0b' : '#ec4899';
            _tdHtml += `<div style="display:flex;align-items:flex-start;gap:8px;padding:10px;margin-bottom:6px;background:${_isHost ? 'rgba(245,158,11,0.04)' : 'rgba(236,72,153,0.04)'};border:1px solid ${_isHost ? 'rgba(245,158,11,0.15)' : 'rgba(236,72,153,0.12)'};border-radius:8px">
              ${!_isHost && players.find(p => p.name === line.speaker) ? rpPortrait(line.speaker, 'sm') : '<div style="font-size:20px;width:36px;text-align:center">🎤</div>'}
              <div style="flex:1">
                <div style="font-size:10px;color:${_spCol};font-weight:700">${line.speaker}</div>
                <div style="font-size:13px;color:#f5f0e8;line-height:1.6">${line.text}</div>
              </div>
            </div>`;
          });
          _tdHtml += `</div>`;
          vpScreens.push({ id: `aftermath-discussion-${ti}`, label: `${_amDot}${topic.title}`, html: _tdHtml });
        });
      }
      const _amAwards = rpBuildAftermathAwards(ep);
      if (_amAwards) vpScreens.push({ id: 'aftermath-awards', label: `${_amDot}Season Awards`, html: _amAwards });
    }
  }

  // ── Debug screen (toggleable) ──
  if (localStorage.getItem('vp_debug') === 'true') {
    const _debugHtml = rpBuildDebug(ep);
    if (_debugHtml) vpScreens.push({ id:'debug', label:'Debug', html: _debugHtml });
  }
}
export function getTribeRelationshipHighlights(members, snapshot) {
  const _bonds = snapshot?.bonds || gs.bonds || {};
  const _percBonds = snapshot?.perceivedBonds || gs.perceivedBonds || {};
  const pairs = [], seen = new Set();
  members.forEach(a => {
    members.forEach(b => {
      if (a === b) return;
      const k = bKey(a, b);
      if (seen.has(k)) return;
      seen.add(k);
      const val = _bonds[k] || 0;
      // Check for perceived bond gap — these pairs are always notable
      const _hasGap = _percBonds[a + '→' + b] || _percBonds[b + '→' + a];
      pairs.push({ a, b, val, hasGap: !!_hasGap });
    });
  });
  // Sort by strongest relationship first — gaps use highest perceived/real value
  // Neutral bonds without gaps sink to bottom
  pairs.sort((x, y) => {
    // For gap pairs, use the max of real + perceived values for sort priority
    const xMax = x.hasGap ? Math.max(Math.abs(x.val), ...Object.entries(_percBonds)
      .filter(([k]) => k === x.a + '→' + x.b || k === x.b + '→' + x.a)
      .map(([, e]) => Math.abs(e.perceived))) : Math.abs(x.val);
    const yMax = y.hasGap ? Math.max(Math.abs(y.val), ...Object.entries(_percBonds)
      .filter(([k]) => k === y.a + '→' + y.b || k === y.b + '→' + y.a)
      .map(([, e]) => Math.abs(e.perceived))) : Math.abs(y.val);
    return yMax - xMax;
  });
  // Show all pairs for small groups, cap at 25 for large merged groups
  // Gap pairs and non-neutral bonds are already sorted to the top — neutrals get cut first
  const cap = members.length <= 8 ? pairs.length : 25;
  return pairs.slice(0, cap);
}

export function getTribeAdvantageStatus(tribeName, isMerge, snapAdvantages, snapMembers) {
  const lines = [];
  const typeLabel = { idol:'Hidden Immunity Idol', voteSteal:'Vote Steal', extraVote:'Extra Vote', kip:'Knowledge is Power', legacy:'Legacy Advantage', amulet:'Amulet Advantage', secondLife:'Second Life Amulet', teamSwap:'Team Swap', voteBlock:'Vote Block', safetyNoPower:'Safety Without Power', soleVote:'Sole Vote' };
  const members = snapMembers || (isMerge ? gs.activePlayers : (gs.tribes.find(t => t.name === tribeName)?.members || []));
  const _colorTribe = name => `<span style="color:${tribeColor(name)};font-weight:700">${name}</span>`;

  if (seasonConfig.advantages?.idol?.enabled) {
    if (isMerge) {
      const _mergeSlots = typeof gs.mergeIdolHidden === 'number' ? gs.mergeIdolHidden : (gs.mergeIdolHidden ? 1 : 0);
      if (_mergeSlots === 1) lines.push('The Merge Hidden Immunity Idol is currently hidden.');
      else if (_mergeSlots >= 2) lines.push(`${_mergeSlots} Merge Hidden Immunity Idols are currently hidden.`);
      // If 0 slots and no one holds one — not in play
      else if (_mergeSlots === 0 && !gs.advantages.some(a => a.type === 'idol' && !a.fromBeware && gs.activePlayers.includes(a.holder))) {
        lines.push('The Merge Hidden Immunity Idol is not currently in play.');
      }
    } else {
      const _tribeSlots = typeof gs.idolSlots?.[tribeName] === 'number' ? gs.idolSlots[tribeName] : (gs.idolSlots?.[tribeName] ? 1 : 0);
      if (_tribeSlots === 1) {
        lines.push(`The ${_colorTribe(tribeName)} Hidden Immunity Idol is currently hidden.`);
      } else if (_tribeSlots >= 2) {
        lines.push(`${_tribeSlots} ${_colorTribe(tribeName)} Hidden Immunity Idols are currently hidden.`);
      } else if (_tribeSlots === 0 && !gs.advantages.some(a => a.type === 'idol' && !a.fromBeware && !a.fromTotem && members.includes(a.holder))) {
        lines.push(`The ${_colorTribe(tribeName)} Hidden Immunity Idol is not currently in play.`);
      }
    }
  }
  // Beware Advantage — follow the holder across tribe swaps
  if (seasonConfig.advantages?.beware?.enabled && gs.bewares && !isMerge) {
    // Show "still hidden" only for THIS tribe's own slot (the holder hasn't been found yet)
    if (gs.bewares[tribeName]?.hidden) {
      lines.push(`The ${_colorTribe(tribeName)} Beware Advantage is still hidden.`);
    }
    Object.entries(gs.bewares).forEach(([origTribe, slot]) => {
      if (!slot || slot.hidden || !slot.holder) return;
      if (!members.includes(slot.holder)) return;
      const fromNote = origTribe !== tribeName ? ` (found at ${_colorTribe(origTribe)})` : '';
      if (!slot.activated) {
        lines.push(`${slot.holder} holds the Beware Advantage${fromNote} — VOTE RESTRICTED until all tribes find theirs.`);
      } else {
        lines.push(`${slot.holder} holds the Beware Advantage${fromNote} (activated — idol live, vote restored).`);
      }
    });
  }
  const advantagesToShow = snapAdvantages || gs.advantages;
  const _shown = new Set(); // prevent duplicate lines for same holder+type
  advantagesToShow.forEach(adv => {
    if (members.includes(adv.holder)) {
      const key = `${adv.holder}:${adv.type}:${adv.foundEp||''}`;
      if (_shown.has(key)) return;
      _shown.add(key);
      // Figure out where it was found
      const _origTribe = adv.foundTribe
        || (gs.episodeHistory || []).flatMap(h => h.idolFinds || []).find(f => f.finder === adv.holder && f.type === adv.type)?.tribe
        || null;
      const _hasTribeName = _origTribe && _origTribe !== 'camp' && _origTribe !== 'auction' && _origTribe !== 'merge';
      // For idols: always prefix with tribe name ("the Red Hidden Immunity Idol")
      // For other advantages: only mention tribe if holder swapped away from where they found it
      let label;
      if (adv.superIdol) {
        label = '<span style="color:#e3b341;font-weight:700">Super Idol</span> (can play after votes are read)';
      } else if (adv.type === 'idol' && !adv.fromBeware && !adv.fromTotem && _hasTribeName) {
        const _crossTribe = _origTribe !== tribeName;
        label = `${_colorTribe(_origTribe)} Hidden Immunity Idol${_crossTribe ? ' (brought from swap)' : ''}`;
      } else if (adv.fromBeware) {
        label = 'Hidden Immunity Idol (from Beware)';
      } else if (adv.fromTotem) {
        label = 'Immunity Totem';
      } else if (adv.fromAuction) {
        label = `${typeLabel[adv.type] || adv.type} (from Auction)`;
      } else if (adv.type === 'amulet') {
        const _powerLabels = { extraVote: 'Extra Vote', voteSteal: 'Vote Steal', idol: 'Hidden Immunity Idol', pending: '' };
        const _amuPower = _powerLabels[adv.amuletPower] || '';
        const _crossTribe = _hasTribeName && _origTribe !== tribeName;
        label = `Amulet Advantage${_amuPower ? ` \u2014 ${_amuPower}` : ''}${_crossTribe ? ` (found at ${_colorTribe(_origTribe)})` : ''}`;
      } else if (adv.type === 'legacy') {
        const _activatesLabel = (adv.activatesAt || []).map(n => `F${n}`).join('/');
        label = `Legacy Advantage${_activatesLabel ? ` (activates at ${_activatesLabel})` : ''}`;
      } else {
        const _baseLabel = typeLabel[adv.type] || adv.type;
        const _crossTribe = _hasTribeName && _origTribe !== tribeName;
        label = _crossTribe ? `${_baseLabel} (found at ${_colorTribe(_origTribe)})` : _baseLabel;
      }
      lines.push(`${adv.holder} has the ${label} (found ep.${adv.foundEp}).`);
    }
  });
  return lines;
}

export function deriveTargetReason(voter, target, phase, allianceMembers, challengeLabel) {
  const group = allianceMembers || [voter];
  const avgBond = group.reduce((sum, a) => sum + getBond(a, target), 0) / group.length;
  const personalBond = getBond(voter, target);
  const ts = pStats(target);
  const cw = challengeWeakness(target, challengeLabel);
  const th = threatScore(target);

  // 1. Pre-game relationship — most narrative-specific
  const preRel = relationships.find(r =>
    [r.a, r.b].sort().join('|') === [voter, target].sort().join('|')
  );
  if (preRel?.type === 'enemy') return `enemy — ${preRel.note || 'deep hostility from past seasons'}`;
  if (preRel?.type === 'rival') return `rivalry — ${preRel.note || 'unresolved tension from before the game'}`;

  // 2. Personal negative bond
  if (personalBond <= -4) return `deeply distrusts ${target} — won't work with them`;
  if (personalBond <= -2) return `dislikes ${target} personally`;

  // 3. Socially isolated from the group
  if (avgBond <= -1.5) return `${target} is socially isolated — poor bonds with this alliance`;
  if (avgBond <= -0.5) return `${target} doesn't fit the group — no real loyalty to anyone here`;

  // 4. Camp event heat — what happened this episode that shifted the read
  if (gs.scramblingThisEp?.has(target)) return `${target} was visibly scrambling at camp — the whole tribe clocked it`;
  if (gs.injuredThisEp?.has(target)) return `${target} is dealing with an injury — a liability in challenges and unpredictable to carry`;
  if (gs.beastDrillsThisEp?.has(target)) return `${target} is the most dangerous physical player here — can't let them reach the end`;
  if (gs.lieTargetsThisEp?.has(target) && Math.random() < 0.5) return `${target}'s name has been floating around camp — heard enough to act on it`;

  // 5. Phase-aware tactical read
  if (phase === 'pre-merge') {
    if (cw >= 5.5) {
      const weakStat = challengeLabel && challengeLabel !== 'Mixed'
        ? challengeLabel.toLowerCase() === 'strength' ? 'physical'
          : challengeLabel.toLowerCase() === 'puzzle' ? 'mental'
          : 'endurance'
        : null;
      const weakLabel = weakStat
        ? `weak in ${weakStat[0].toUpperCase()+weakStat.slice(1)} (lost a ${challengeLabel} challenge)`
        : (() => { const ws = ['physical','endurance','mental'].filter(k => ts[k] <= 5); return ws.length ? `weak in ${ws.map(s=>s[0].toUpperCase()+s.slice(1)).join('/')}` : 'weakest overall in challenges'; })();
      return `challenge liability — ${weakLabel}`;
    }
    if (ts.boldness >= 8 && ts.loyalty <= 4) return `too volatile — bold and disloyal, a ticking time bomb`;
    // Check prior votes received
    const priorVotesAgainst = (gs.episodeHistory || []).reduce((count, h) => {
      return count + (h.votingLog || []).filter(v => v.voted === target).length;
    }, 0);
    if (priorVotesAgainst >= 3) return `${target}'s name has come up before — it's the vote everyone can agree on`;
    if (priorVotesAgainst >= 1) return `${target} already had their name written down — the easy consensus`;
    // Advantage suspicion
    const hasAdvantage = (gs.advantages || []).some(a => a.holder === target);
    if (hasAdvantage) return `suspected of having a hidden advantage — dangerous to leave in the game`;
    // Strategic/social positioning threat
    if (ts.strategic >= 8) return `${target} is already playing too hard — needs to go before the merge`;
    if (ts.social >= 8 && ts.strategic >= 6) return `${target} is building connections across the tribe — a quiet long-term threat`;
    if (ts.boldness >= 7 && ts.loyalty <= 5) return `${target} is unpredictable — does what they want, not what the group needs`;
    if (ts.loyalty <= 3) return `${target} hasn't given anyone a reason to trust them — too early to carry a liability`;
    if (avgBond >= -0.5 && avgBond < 0.5) return `${target} sits on the outside of every group — no one will miss them`;
    if (ts.social <= 4 && ts.strategic <= 4) return `${target} hasn't connected with anyone — can't build trust, can't be trusted`;
    return `${target} hasn't done enough to earn protection — expendable when the vote needs a name`;
  } else {
    if (th >= 7.5) return `biggest threat in the game — must leave now`;
    if (ts.strategic >= 8 && ts.social >= 7) return `complete player — wins the jury vote if they reach the end`;
    if (ts.strategic >= 8) return `most dangerous strategic mind remaining`;
    if (ts.social >= 8) return `jury favorite — everyone likes them`;
    if (th >= 6) return `jury threat — wins if they reach the end`;
    return `long-term threat that has to go before the finale`;
  }
}

export function getIndividualTargets(tribalPlayers, immuneName, alliances, challengeLabel) {
  const targets = [];
  tribalPlayers.forEach(voter => {
    if (voter === immuneName) return;
    const s = pStats(voter);
    const myAlliance = alliances.find(a => a.type === 'alliance' && a.members.includes(voter))
                   || alliances.find(a => a.members.includes(voter));
    const allianceTarget = myAlliance?.target;
    const cLabel = challengeLabel || myAlliance?.challengeLabel || null;

    // Personal enemy: scales with hatred — deeper bond = more likely to override alliance target
    const _enemies = tribalPlayers
      .filter(p => p !== voter && p !== immuneName && getBond(voter, p) <= -2)
      .sort((a,b) => getBond(voter, a) - getBond(voter, b));
    const personalEnemy = _enemies[0] || null;
    const _enemyBond = personalEnemy ? Math.abs(getBond(voter, personalEnemy)) : 0;

    let target, reason;
    if (personalEnemy && Math.random() < Math.min(0.65, _enemyBond * 0.07 + (10 - s.loyalty) * 0.02)) {
      target = personalEnemy;
      reason = deriveTargetReason(voter, personalEnemy, gs.phase, [voter], cLabel);
    } else if (allianceTarget && allianceTarget !== voter && allianceTarget !== immuneName) {
      target = allianceTarget;
      reason = deriveTargetReason(voter, allianceTarget, gs.phase, myAlliance?.members || [voter], cLabel);
    } else {
      const candidates = tribalPlayers.filter(p => p !== voter && p !== immuneName);
      if (!candidates.length) return;
      target = wRandom(candidates, t => Math.max(0.1, challengeWeakness(t, cLabel) * 0.4 + (-getBond(voter, t)) * 0.3 + 1));
      reason = deriveTargetReason(voter, target, gs.phase, [voter], cLabel);
    }
    if (target) targets.push({ voter, target, reason });
  });
  return targets;
}

// ══════════════════════════════════════════════════════════════════════
// ENGINE: OUTPUT GENERATION
// ══════════════════════════════════════════════════════════════════════

// ── generateTwistScenes: convert twist data into VP story beats ──────────
// Returns an array of { label, type, scenes[] } objects.
// Each scene: { text, players[], tribeLabel?, badge?, badgeClass? }
// Saved to episodeHistory so portraits survive reload.

// Returns up to maxNotes narrative lines about how a challenge unfolded.
// placements: [{name, members}] for tribe, or [name,...] for individual
// memberScores: { playerName: score }
export function generateChallengeNotes(placements, memberScores, maxNotes) {
  const notes = [];
  if (!placements?.length || !memberScores) return notes;
  const _pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const isTribe = placements.length && typeof placements[0] === 'object';

  if (isTribe) {
    const ts = placements.map(t => {
      // Only include members who actually competed (sit-outs have no score entry)
      const members = (t.members || []).filter(m => memberScores[m] !== undefined);
      const sc = members.map(m => memberScores[m]);
      const avg = sc.reduce((s,v)=>s+v,0) / (sc.length||1);
      const maxSc = sc.length ? Math.max(...sc) : 0;
      const minSc = sc.length ? Math.min(...sc) : 0;
      return { name: t.name, members, avg, maxSc, minSc,
               maxMember: members[sc.indexOf(maxSc)],
               minMember: members[sc.indexOf(minSc)] };
    });

    // Photo finish: tribe averages converge when averaged over many members — 0.25 is realistic
    if (ts.length >= 2 && Math.abs(ts[0].avg - ts[1].avg) < 0.25) {
      notes.push(_pick([
        `NOTE: ${ts[0].name} and ${ts[1].name} were separated by almost nothing — it could have gone either way.`,
        `NOTE: ${ts[0].name} edged ${ts[1].name} by the narrowest of margins. One stumble and the result flips.`,
      ]));
    }
    // Dominant: 1.2+ gap between tribe averages is a clear stat advantage
    if (ts.length >= 2 && ts[0].avg - ts[1].avg >= 1.2) {
      notes.push(_pick([
        `NOTE: ${ts[0].name} dominated from start to finish — the other tribes were never close.`,
        `NOTE: ${ts[0].name} built an early lead and it was never in doubt.`,
      ]));
    }
    // Carried by one: one member 2.0+ above tribe avg (genuine outlier)
    if (ts[0].maxSc - ts[0].avg >= 2.0) {
      notes.push(_pick([
        `NOTE: ${ts[0].name}'s win was carried almost entirely by ${ts[0].maxMember} — the rest of the tribe was mid-pack.`,
        `NOTE: ${ts[0].maxMember} did the heavy lifting for ${ts[0].name}. Without that performance it's a different result.`,
      ]));
    }
    // Weak link cost the loser: loser min 2.0+ below tribe avg
    const loser = ts[ts.length - 1];
    if (loser.avg - loser.minSc >= 2.0) {
      notes.push(_pick([
        `NOTE: ${loser.minMember} struggled badly — ${loser.name}'s result was heavily affected by that performance.`,
        `NOTE: ${loser.name}'s loss came down to ${loser.minMember}'s showing. The rest of the tribe couldn't compensate.`,
      ]));
    }

  } else {
    // Individual
    const sc = placements.map(n => memberScores[n] ?? 0);

    // Photo finish: individual scores have more variance, 0.6 is a genuine near-tie
    if (sc.length >= 2 && Math.abs(sc[0] - sc[1]) < 0.6) {
      notes.push(_pick([
        `NOTE: ${placements[0]} and ${placements[1]} were neck and neck — the margin at the finish was razor thin.`,
        `NOTE: ${placements[0]} barely held off ${placements[1]}. A fraction of a second separated them.`,
      ]));
    }
    // Dominant: 1st ahead of 2nd by 2.5+ (clear gap in individual scoring)
    if (sc.length >= 2 && sc[0] - sc[1] >= 2.5) {
      notes.push(_pick([
        `NOTE: ${placements[0]} was never challenged — they dominated wire to wire.`,
        `NOTE: ${placements[0]} built an insurmountable lead early and coasted to the win.`,
      ]));
    }
    // Collapse: last-place player dropped 2.0+ below 2nd-to-last
    if (sc.length >= 3 && sc[sc.length-2] - sc[sc.length-1] >= 2.0) {
      notes.push(_pick([
        `NOTE: ${placements[placements.length-1]} fell apart late in the challenge — their result was well below what their tribemates expected.`,
        `NOTE: ${placements[placements.length-1]} dropped off sharply toward the end and finished well behind the field.`,
      ]));
    }
  }

  return notes.slice(0, maxNotes ?? 2);
}



