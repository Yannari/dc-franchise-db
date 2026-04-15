// js/players.js - Player stats, pronouns, threat scoring, challenge records
import { gs, players, STATS, THREAT_TIERS, ARCHETYPES, seasonConfig } from './core.js';

export function overall(stats) { return (STATS.reduce((t,s) => t+(stats[s.key]||0),0)/STATS.length).toFixed(1); }

export function threat(stats)  {
  // Cast builder: raw stat potential only (no game state). Scale 0-10.
  const chal = (stats.physical * 0.2 + stats.endurance * 0.15 + stats.mental * 0.1 + stats.intuition * 0.1) / 0.55;
  const soc = (stats.social * 0.3 + stats.temperament * 0.1) / 0.4;
  const strat = (stats.strategic * 0.25 + stats.boldness * 0.1 + stats.intuition * 0.1) / 0.45;
  return ((chal + soc + strat) / 3).toFixed(1);
}

export function threatTier(score) { return THREAT_TIERS.find(t => score <= t.max) || THREAT_TIERS[THREAT_TIERS.length-1]; }

export function tribeColor(tribe) {
  if (!tribe) return '#6366f1';
  const t = tribe.toLowerCase();
  if (t === 'merge' || t === 'merged') return '#e6edf3';
  // Check user-configured tribe colors first
  const configured = (seasonConfig.tribes || []).find(t => t.name.toLowerCase() === tribe.toLowerCase());
  if (configured) return configured.color;
  // Fallback: keyword match then hash palette
  if (t.includes('champion')) return '#f59e0b';
  if (t.includes('contender')) return '#ef4444';
  const pal = ['#6366f1','#3b82f6','#0ea5e9','#8b5cf6','#ec4899','#10b981'];
  let h = 0; for (let i=0;i<tribe.length;i++) h = tribe.charCodeAt(i)+((h<<5)-h);
  return pal[Math.abs(h)%pal.length];
}

export function romanticCompat(a, b) {
  const pa = typeof a === 'string' ? players.find(p => p.name === a) : a;
  const pb = typeof b === 'string' ? players.find(p => p.name === b) : b;
  const sa = pa?.sexuality || 'straight';
  const sb = pb?.sexuality || 'straight';
  const ga = pa?.gender || 'm';
  const gb = pb?.gender || 'm';
  function attracted(sex, myG, theirG) {
    if (sex === 'asexual') return false;
    if (sex === 'bi' || sex === 'queer' || sex === 'pan') return true;
    if (sex === 'gay')     return myG === 'm' && theirG === 'm';
    if (sex === 'lesbian') return myG === 'f' && theirG === 'f';
    return myG !== theirG; // straight
  }
  return attracted(sa, ga, gb) && attracted(sb, gb, ga);
}

export function pronouns(nameOrPlayer) {
  const p = typeof nameOrPlayer === 'string' ? players.find(x => x.name === nameOrPlayer) : nameOrPlayer;
  const g = p?.gender || 'nb';
  if (g === 'm')  return { sub:'he',   obj:'him',  pos:'his',    posAdj:'his',   ref:'himself',    Sub:'He',   Obj:'Him',  PosAdj:'His'   };
  if (g === 'f')  return { sub:'she',  obj:'her',  pos:'hers',   posAdj:'her',   ref:'herself',    Sub:'She',  Obj:'Her',  PosAdj:'Her'   };
  return              { sub:'they', obj:'them', pos:'theirs', posAdj:'their', ref:'themselves', Sub:'They', Obj:'Them', PosAdj:'Their' };
}

export function Pronouns(name) {
  const p = pronouns(name);
  return { Sub: p.sub[0].toUpperCase()+p.sub.slice(1), Obj: p.obj[0].toUpperCase()+p.obj.slice(1),
           Pos: p.pos[0].toUpperCase()+p.pos.slice(1), PosAdj: p.posAdj[0].toUpperCase()+p.posAdj.slice(1) };
}

export function setGender(g) {
  document.querySelectorAll('#f-gender-seg .gm-btn').forEach(b => b.classList.toggle('active', b.dataset.g === g));
}

export function getGender() {
  return document.querySelector('#f-gender-seg .gm-btn.active')?.dataset.g || 'nb';
}

export function miniAvatar(name, size = 28) {
  const p = players.find(x => x.name === name);
  const slug = p?.slug || name.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'');
  const init = (name||'?')[0].toUpperCase();
  return `<div title="${name}" style="display:inline-flex;align-items:center;justify-content:center;width:${size}px;height:${size}px;border-radius:50%;background:var(--surface2);border:2px solid var(--border);overflow:hidden;flex-shrink:0;position:relative;font-size:${Math.round(size*0.4)}px;font-weight:700;color:var(--muted)">
    <img src="assets/avatars/${slug}.png" style="position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;border-radius:50%" onerror="this.style.display='none';this.nextElementSibling.style.display='block'" />
    <span style="display:none">${init}</span>
  </div>`;
}

export function pStats(name) {
  const p = players.find(p=>p.name===name);
  return p?.stats ? { ...DEFAULT_STATS, ...p.stats } : { ...DEFAULT_STATS };
}

export function threatScore(name, detailed) {
  const s = pStats(name);
  const rec = gs.chalRecord?.[name] || { wins: 0, podiums: 0, bombs: 0 };

  // ── 1. CHALLENGE THREAT (what you've DONE in challenges) ──
  // Stats are early-game fallback, record takes over as episodes progress
  const chalStatBase = s.physical * 0.15 + s.endurance * 0.12 + s.mental * 0.08 + s.intuition * 0.08;
  const recordScore = rec.podiums * 1.0 + rec.wins * 2.0 - rec.bombs * 0.8;
  const episodesPlayed = Math.max(1, gs.episode || 1);
  const recordWeight = Math.min(0.7, episodesPlayed * 0.1);
  const challengeThreat = chalStatBase * (1 - recordWeight) + recordScore * recordWeight;

  // ── 2. SOCIAL THREAT (how liked/connected — observable data only) ──
  const _activePlayers = (gs.activePlayers || []).filter(p => p !== name);
  const avgBond = _activePlayers.length
    ? _activePlayers.reduce((sum, p) => sum + getBond(name, p), 0) / _activePlayers.length
    : 0;
  const highBondCount = _activePlayers.filter(p => getBond(name, p) >= 3).length;
  const hasShowmance = gs.showmances?.some(sh =>
    sh.phase !== 'broken-up' && sh.players.includes(name) && sh.players.every(p => (gs.activePlayers || []).includes(p))
  ) || false;
  const hasSpark = gs.romanticSparks?.some(sp => sp.players.includes(name) && !sp.fake) || false;
  const showmanceBonus = hasShowmance ? 0.5 : (hasSpark ? 0.2 : 0);
  const socialThreat = avgBond * 0.5 + highBondCount * 0.15 + showmanceBonus + s.social * 0.08;

  // ── 3. STRATEGIC THREAT (how much control — alliances, deals, advantages) ──
  const activeAlliances = (gs.namedAlliances || []).filter(a =>
    a.active && a.members.includes(name) && a.members.some(m => m !== name && (gs.activePlayers || []).includes(m))
  );
  const alliancePower = activeAlliances.reduce((sum, a) => {
    const activeMembers = a.members.filter(m => (gs.activePlayers || []).includes(m)).length;
    return sum + activeMembers * 0.2;
  }, 0);
  const activeSideDeals = (gs.sideDeals || []).filter(d =>
    d.active && d.players?.includes(name) && d.players.every(p => (gs.activePlayers || []).includes(p))
  ).length;
  const hasAdvantage = gs.advantages?.some(a => a.holder === name) ? 0.8 : 0;
  const strategicThreat = alliancePower + activeSideDeals * 0.15 + hasAdvantage + s.strategic * 0.08;

  // ── COMBINED: equal weight, floor each at 0 (can't have negative threat) ──
  const _chal = Math.max(0, challengeThreat);
  const _soc = Math.max(0, socialThreat);
  const _strat = Math.max(0, strategicThreat);
  const total = _chal * 0.33 + _soc * 0.33 + _strat * 0.33;
  if (detailed) return { total, challenge: _chal, social: _soc, strategic: _strat };
  return total;
}

export function updateChalRecord(ep) {
  if (!gs.chalRecord) gs.chalRecord = {};

  // Collect all player scores for this episode's challenge
  const scores = ep.chalMemberScores || {};
  const players = Object.keys(scores);
  if (!players.length) return;

  // Sort by score descending to get placement ranking
  const ranked = [...players].sort((a, b) => scores[b] - scores[a]);
  const n = ranked.length;

  // Init records for any new players
  players.forEach(p => {
    if (!gs.chalRecord[p]) gs.chalRecord[p] = { wins: 0, podiums: 0, bombs: 0 };
  });

  // Snapshot old values to detect threshold crossings
  const oldRec = {};
  players.forEach(p => { oldRec[p] = { ...gs.chalRecord[p] }; });

  // Post-merge individual: immunity winner counts as a win
  const immWinner = ep.immunityWinner;
  if (immWinner && gs.chalRecord[immWinner]) {
    gs.chalRecord[immWinner].wins++;
  }

  // Pre-merge: top-3 podium, bottom-3 bomb (larger tribes, more spread)
  // Post-merge: top-2 podium, bottom-2 bomb (smaller field, tighter competition)
  const _podiumCount = gs.isMerged ? 2 : 3;
  const _bombCount = gs.isMerged ? 2 : 3;
  if (n >= _podiumCount) {
    ranked.slice(0, _podiumCount).forEach(p => { gs.chalRecord[p].podiums++; });
    ranked.slice(Math.max(0, n - _bombCount)).forEach(p => { gs.chalRecord[p].bombs++; });
  }

  // Inject chalThreat event for any player who just crossed a visible threshold
  const thresholds = [
    { key: 'wins',    val: 2, label: (p, w) => `${p} has won ${w} individual challenges now. The tribe is watching.` },
    { key: 'wins',    val: 3, label: (p, w) => `${p} has ${w} challenge wins. That number is starting to mean something.` },
    { key: 'podiums', val: 3, label: (p, _) => `${p} keeps placing at the top of challenges. Not a fluke anymore.` },
  ];

  players.forEach(name => {
    const rec = gs.chalRecord[name];
    const old = oldRec[name];
    const crossed = thresholds.find(t => old[t.key] < t.val && rec[t.key] >= t.val);
    if (!crossed) return;

    // Find the camp key for this player
    const campKey = gs.isMerged ? Object.keys(ep.campEvents)[0]
      : gs.tribes.find(t => t.members.includes(name))?.name;
    if (!campKey || !ep.campEvents[campKey]) return;

    // Pick a strategic tribemate to voice the concern
    const group = gs.isMerged ? gs.activePlayers : (gs.tribes.find(t => t.name === campKey)?.members || []);
    const notifiers = group.filter(p => p !== name && gs.activePlayers.includes(p));
    if (!notifiers.length) return;
    const notifier = notifiers.reduce((best, p) => pStats(p).strategic > pStats(best).strategic ? p : best, notifiers[0]);

    const prn = pronouns(name);
    const s3 = prn.sub === 'they';
    const nPrn = pronouns(notifier);
    const ns3 = nPrn.sub === 'they';

    const isWinStreak = crossed.key === 'wins';
    const mainLines = isWinStreak ? [
      `${name} keep${s3 ? '' : 's'} winning challenges. At some point the tribe stops calling it luck and starts calling it a problem.`,
      `${name} win${s3 ? '' : 's'} again. The reaction around camp is quiet — but it's there. ${prn.Sub} ${s3 ? 'are' : 'is'} becoming a name people say in whispers.`,
      `Every time there's a challenge, ${name} is near the top. The tribe is starting to notice the pattern even if no one's said it out loud yet.`,
      `${name} doesn't lose challenges. That's not a compliment anymore — it's a threat assessment.`,
      `Another strong challenge from ${name}. The mood around camp after isn't celebration. It's calculation.`,
      `${prn.Sub} ${s3 ? 'keep' : 'keeps'} performing. Every win ${name} gets is another reason someone adds ${prn.obj} to their shortlist.`,
    ] : [
      `${name} keeps finishing near the top. It's becoming a pattern. The tribe sees it.`,
      `${name} is quietly building a challenge résumé. No one's panicking yet — but the number is getting hard to ignore.`,
      `Three top finishes for ${name}. Not dominant enough to scare people today. Consistent enough to terrify them later.`,
      `${name}'s challenge record is starting to write a story. The tribe hasn't finished reading it yet — but they're paying attention.`,
      `${name} doesn't stand out loudly. ${prn.Sub} just ${s3 ? 'keep' : 'keeps'} placing. And that consistency is its own kind of danger.`,
      `Every episode ${name} finishes near the top is another data point. The tribe is collecting them.`,
    ];

    const reactLines = [
      `${notifier} clock${ns3 ? '' : 's'} it and say${ns3 ? '' : 's'} nothing out loud. But ${nPrn.posAdj} wheels are turning.`,
      `${notifier} ha${ns3 ? 've' : 's'} been watching ${name}'s challenge record quietly. ${nPrn.Sub} ${ns3 ? 'are' : 'is'} not the only one.`,
      `${notifier} file${ns3 ? '' : 's'} it away. ${name} is becoming someone you deal with before you can't anymore.`,
      `${notifier} bring${ns3 ? '' : 's'} it up — carefully, just to one person, like it's a casual observation. It isn't.`,
    ];

    const hashBase = [...name].reduce((a, c) => a + c.charCodeAt(0), 0);
    const seed = ep.num * 23;
    const mainText = mainLines[(hashBase + seed) % mainLines.length];
    const reactText = reactLines[(hashBase + seed * 5) % reactLines.length];

    const arr = ep.campEvents[campKey].post;
    arr.push({ type: 'chalThreat', text: mainText, players: [name] });
    arr.push({ type: 'chalThreatReaction', text: reactText, players: [notifier, name] });

    if (!ep.chalThreatEvents) ep.chalThreatEvents = [];
    ep.chalThreatEvents.push({ player: name, notifier, threshold: `${crossed.key}>=${crossed.val}` });
  });
}

export function challengeWeakness(name, challengeCategory) {
  const s = pStats(name);
  const _rec = gs?.chalRecord?.[name] || { wins: 0, podiums: 0, bombs: 0 };
  // Total challenges seen: by vote time, this episode's challenge already happened
  // gs.episode is 0-indexed, +1 = current episode number = challenges seen
  const _totalChallenges = Math.max(_rec.wins + _rec.podiums + _rec.bombs, (gs?.episode || 0) + 1);

  // ── STAT BASE: overall challenge ability (what the tribe EXPECTS) ──
  // Always use GENERIC average for targeting — future challenges could be any type
  // Category-specific is only used for the actual challenge simulation, not perception
  let statBase;
  if (challengeCategory === 'physical')       statBase = 10 - s.physical;
  else if (challengeCategory === 'endurance') statBase = 10 - s.endurance;
  else if (challengeCategory === 'balance')   statBase = 10 - (s.endurance*0.6 + s.physical*0.4);
  else if (challengeCategory === 'puzzle')    statBase = 10 - s.mental;
  else if (challengeCategory === 'social')    statBase = 10 - (s.social*0.5 + s.mental*0.3 + s.boldness*0.2);
  else statBase = 10 - (s.physical + s.endurance + s.mental) / 3;

  // For TARGETING (no category passed), use the generic average — the tribe evaluates overall ability
  const genericBase = 10 - (s.physical + s.endurance + s.mental + s.social * 0.5) / 3.5;

  // ── PERFORMANCE: what the tribe has SEEN (accumulates over episodes) ──
  // Each bomb/podium shifts perception. More data = more trust in the track record.
  let perfMod = 0;
  if (_rec.bombs >= 1) perfMod += _rec.bombs * 0.6;   // each bomb: +0.6 (1=0.6, 2=1.2, 3=1.8, 5=3.0)
  if (_rec.podiums >= 1) perfMod -= _rec.podiums * 0.35; // each podium: -0.35 (2=-0.7, 4=-1.4)
  if (_rec.wins >= 1) perfMod -= _rec.wins * 0.5;      // wins are strong proof: -0.5 each

  // ── BLEND: stats vs performance ──
  // Early game (0-1 challenges): almost pure stats (tribe hasn't seen enough)
  // Mid game (3-4 challenges): 50/50 blend
  // Late pre-merge (6+ challenges): performance dominates — the tribe trusts what they've seen
  const _perfWeight = Math.min(0.85, _totalChallenges * 0.08); // 1=8%, 3=24%, 5=40%, 8=64%, 10=80%, 11+=85%
  const _useBase = challengeCategory ? statBase : genericBase;
  const blended = _useBase + perfMod * (0.4 + _perfWeight); // perfMod always matters, but scales up

  // ── INJURY: lingering injury makes you a bigger liability ──
  const _inj = gs?.lingeringInjuries?.[name];
  const injMod = (_inj && (gs.episode + 1 - _inj.ep) < _inj.duration) ? 1.5 : 0;

  return blended + injMod;
}

export function getPlayerState(name) {
  return gs.playerStates?.[name] || { emotional: 'content', votesReceived: 0, lastVotedEp: null, bigMoves: 0 };
}

export function isAllianceBottom(name, allianceMembers) {
  const active = allianceMembers.filter(m => gs.activePlayers.includes(m));
  if (active.length < 3) return false;
  const avgBondFor = m => {
    const others = active.filter(o => o !== m);
    return others.reduce((sum, o) => sum + getBond(m, o), 0) / (others.length || 1);
  };
  const myAvg = avgBondFor(name);
  const sorted = active.map(avgBondFor).sort((a, b) => a - b);
  return myAvg <= sorted[Math.floor(sorted.length * 0.4)];
}

