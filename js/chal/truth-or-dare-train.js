// ══════════════════════════════════════════════════════════════════════
// truth-or-dare-train.js — "Truth or Dare Train" (pre-merge team race)
// Teams race cart-to-cart to the front of a moving train, taking hot seats in
// ROUND-ROBIN order (one team, then the next, then back around) so the lead
// swings back and forth. Each hot seat resolves on a THREE-TIER clock:
//   • go straight for it (confident) → fast, barely any time lost
//   • hesitate (nervous but does it)  → completes, but bleeds time
//   • refuse                          → full 5-minute penalty
// LOWEST TOTAL TIME wins immunity — so the race resolves cleanly even when
// nobody flat-out refuses. Personality-driven: bold players attack the clock,
// cautious players stall, and a prompt that hits a personal WEAK SPOT (vanity,
// loyalty, a secret, a fear) makes even a bold player hesitate or balk.
// Rich social events fire BETWEEN every hot seat.
// ══════════════════════════════════════════════════════════════════════
import { gs, players, seasonConfig } from '../core.js';
import { pStats, pronouns, updateChalRecord } from '../players.js';
import { addBond, getBond } from '../bonds.js';
import { _challengeRomanceSpark, _checkShowmanceChalMoment } from '../romance.js';
import { romanticCompat } from '../players.js';

// ── deterministic-ish helpers (still surprising via noise) ──────────────
function _noise(mag) { return (Math.random() - 0.5) * 2 * mag; }
function _pick(arr, seed) {
  if (!arr.length) return '';
  const h = [...String(seed)].reduce((a, c) => a + c.charCodeAt(0), 0);
  return arr[h % arr.length];
}
function _archOf(name) { return players.find(p => p.name === name)?.archetype || ''; }
function _pron(name) { return pronouns(name); }

// A player's WEAK SPOTS — which kinds of prompt make them likely to refuse.
// Derived from archetype + stats, so different casts balk at different things.
function _weakSpots(name) {
  const s = pStats(name);
  const arch = _archOf(name);
  const w = new Set();
  if (s.social >= 7 || arch === 'social-butterfly' || arch === 'showmancer') w.add('vanity');   // appearance dares
  if (s.loyalty >= 7 || arch === 'loyal-soldier' || arch === 'hero') w.add('loyalty');           // "betray the team" truths
  if (s.temperament <= 4 || arch === 'hothead') w.add('temper');                                 // humiliation dares
  if (s.strategic >= 7 || arch === 'mastermind' || arch === 'schemer') w.add('secret');          // exposing-truth
  if (s.boldness <= 3 || arch === 'floater' || arch === 'underdog') w.add('fear');               // scary/gross dares
  return w;
}

// ── PROMPT POOLS (4+ variants; each tagged with the weak spot it targets) ──
const DARES = [
  { text: 'shave off %r eyebrows on camera', weak: 'vanity' },
  { text: 'shave %r head bald', weak: 'vanity' },
  { text: 'read %r worst one-star reviews out loud', weak: 'vanity' },
  { text: 'let the crowd redo %r hair and makeup', weak: 'vanity' },
  { text: 'eat a fistful of live worms', weak: 'fear' },
  { text: 'take an ice-water bath for a full minute', weak: 'fear' },
  { text: 'pet a snarling, possibly-rabid dog', weak: 'fear' },
  { text: 'do push-ups over a field of loaded mousetraps', weak: 'fear' },
  { text: 'fight a bad-tempered chicken named Freckles Jr.', weak: 'fear' },
  { text: 'let a teammate punch %o square in the chest', weak: 'temper' },
  { text: 'wear the clown suit for the rest of the challenge', weak: 'temper' },
  { text: 'do an interpretive dance for the whole train', weak: 'temper' },
];
// targeted dares pull ANOTHER player in — must have consequences
const TARGET_DARES = [
  { text: 'pick a camper and punch them', kind: 'punch' },
  { text: 'kiss a stranger the host drags in', kind: 'kiss' },
];
const TRUTHS = [
  { text: 'rank %r teammates most to least valuable', weak: 'loyalty' },
  { text: 'name the teammate %s trusts the least', weak: 'loyalty' },
  { text: 'admit who %s would cut first at the merge', weak: 'loyalty' },
  { text: 'reveal the secret %s came here hiding', weak: 'secret' },
  { text: 'describe the worst thing %s has ever done for money', weak: 'secret' },
  { text: 'confess the most embarrassing thing in %r past', weak: 'secret' },
  { text: 'explain what really brought %o to this game', weak: 'secret' },
];
function _fill(t, name) {
  const p = _pron(name);
  return t.replace(/%r/g, p.posAdj).replace(/%o/g, p.obj).replace(/%s/g, p.sub);
}

// ── time model (seconds) — lower total time wins ────────────────────────
const T_CONFIDENT = 45;   // "went straight for it" — barely a stumble
const T_HESITANT = 110;   // did it, but froze up and bled the clock
const T_REFUSE = 300;     // full 5-minute penalty
function _fmtTime(sec) {
  sec = Math.max(0, Math.round(sec));
  const m = Math.floor(sec / 60), s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

// ── the per-camper hot-seat resolution ─────────────────────────────────
// Returns { kind, prompt, weak, outcome, timeCost, quote, targetPlayer, score }.
// outcome ∈ 'confident' | 'hesitant' | 'refused'.
function _resolveTurn(name, team) {
  const s = pStats(name);
  const weak = _weakSpots(name);
  // choose lane: boldness/archetype leans dare; caution/mental leans truth
  const arch = _archOf(name);
  let dareLean = s.boldness * 0.6 + (['hothead', 'challenge-beast', 'villain', 'wildcard', 'chaos-agent'].includes(arch) ? 3 : 0) - s.mental * 0.15 + _noise(2.5);
  const chooseDare = dareLean >= 4;

  // draw a prompt (small chance of a targeted dare that pulls another player in)
  let kind, promptObj, targetPlayer = null;
  if (chooseDare && Math.random() < 0.22) {
    kind = 'dare';
    const td = _pick(TARGET_DARES, name + team.name + 't');
    promptObj = { text: td.text, weak: 'temper', targetKind: td.kind };
    // pick a target: for punch, a rival or a bold volunteer; for kiss, a compatible player
    const pool = team.members.filter(m => m !== name);
    if (td.kind === 'kiss') {
      targetPlayer = pool.find(m => romanticCompat(name, m)) || pool[0];
    } else {
      targetPlayer = pool.slice().sort((a, b) => getBond(name, a) - getBond(name, b))[0]; // lowest bond = rival
    }
  } else {
    kind = chooseDare ? 'dare' : 'truth';
    promptObj = _pick(kind === 'dare' ? DARES : TRUTHS, name + team.name + kind);
  }

  const prompt = _fill(promptObj.text, name);
  const hitsWeakSpot = promptObj.weak && weak.has(promptObj.weak);

  // GRIT: nerve to attack the clock. Higher = faster; a weak-spot hit tanks it.
  let grit = s.boldness * 0.5 + s.temperament * 0.35 + 1.0 + _noise(2.5);
  if (hitsWeakSpot) grit -= 5.5;          // the thing that makes them freeze or balk
  if (kind === 'truth') grit += 0.8;      // truths are a little easier to blurt out

  // three tiers on the clock
  let outcome, timeCost;
  if (grit >= 4) { outcome = 'confident'; timeCost = T_CONFIDENT + _noise(18); }
  else if (grit >= -0.5) { outcome = 'hesitant'; timeCost = T_HESITANT + _noise(30); }
  else { outcome = 'refused'; timeCost = T_REFUSE; }
  timeCost = Math.max(20, Math.round(timeCost));

  const quote = _quoteFor(name, kind, outcome, promptObj.weak);

  // per-player score (MVP / chalMemberScores): fast + hard = best; refusing hurts
  let score;
  if (outcome === 'confident') score = (hitsWeakSpot ? 9 : 6) + (kind === 'dare' ? 2 : 0) + Math.round(s.boldness * 0.2);
  else if (outcome === 'hesitant') score = (hitsWeakSpot ? 6 : 4) + (kind === 'dare' ? 1 : 0);
  else score = -3;

  return { kind, prompt, weak: promptObj.weak, hitsWeakSpot, outcome, timeCost, quote, targetPlayer, targetKind: promptObj.targetKind || null, score };
}

function _quoteFor(name, kind, outcome, weak) {
  if (outcome === 'refused') {
    const pool = {
      vanity: [`I'm not touching my face for a game. Looks are everything.`, `Absolutely not. Do you know what I do for a living?`, `No. I've worked too hard on this look.`, `I'll take the penalty. My image is not up for debate.`],
      loyalty: [`I can't put a divide on this team. It's not worth the time.`, `No — I'm not ranking the people I'm fighting beside.`, `Ask me anything else. I won't turn on them.`, `Forget it. I'd rather eat the penalty than sell out my team.`],
      secret: [`That stays with me. I'll take the five minutes.`, `Some things I brought here for a reason. Pass.`, `No. That's not going on camera.`, `Nice try. That door stays shut.`],
      fear: [`Nope. Nope. I can't — I physically can't.`, `That is a hard no from me.`, `I'd rather lose than do THAT.`, `You've got the wrong person for this one.`],
      temper: [`This is humiliating and I won't do it.`, `Absolutely not, find someone else.`, `No. I have some dignity left.`, `I'm out. Take the penalty.`],
    };
    return _pick(pool[weak] || pool.temper, name + 'refuse');
  }
  if (outcome === 'hesitant') {
    // did it, but froze / stalled / talked themselves into it — burned the clock
    const pool = kind === 'dare'
      ? [`Oh god — okay — okay, give me a second... fine. FINE.`, `I hate this. I really hate this... ugh, going, I'm going.`, `Don't watch me. Don't — ...okay, doing it, doing it.`, `My hands are shaking. Just... one, two — there. Done. Barely.`]
      : [`...Do I have to? ...Fine. But you didn't hear it from me.`, `That's... a lot to admit. Give me a sec... okay.`, `Ugh. You're really making me say it out loud?`, `I— ...yeah. Okay. There. Can we move on now?`];
    return _pick(pool, name + 'hesit');
  }
  // confident — attacked it, no hesitation
  const pool = kind === 'dare'
    ? [`You think this scares me? Watch.`, `For the team. Deep breath. Go.`, `Easy. Next cart.`, `Okay, that was actually kind of fun.`]
    : [`It's one question. How hard can it be?`, `You want the truth? Here it is. No hesitation.`, `I've got nothing to hide. Ask away.`, `Honestly? Yeah. Said it. Moving on.`];
  return _pick(pool, name + 'conf');
}

// ── SOCIAL EVENTS between hot seats (guaranteed density, real consequences) ──
function _socialEvent(team, hotName, ctx, ep, key) {
  const mates = team.members.filter(m => m !== hotName);
  if (!mates.length) return null;
  const s = pStats(hotName);
  const roll = Math.random();
  const _p = _pron(hotName);

  // 1) TARGETED-DARE fallout (punch/kiss/rank) — highest priority, real consequence
  if (ctx.targetPlayer) {
    const tgt = ctx.targetPlayer; const tp = _pron(tgt);
    if (ctx.targetKind === 'kiss') {
      // romance hook — spark a showmance if compatible & allowed
      if (seasonConfig.romance === 'enabled' && romanticCompat(hotName, tgt)) {
        try { _challengeRomanceSpark(hotName, tgt, ep, null, null); } catch (e) {}
      }
      addBond(hotName, tgt, 1.2);
      return { type: 'tdtKiss', players: [hotName, tgt],
        text: _pick([`${hotName} has to kiss ${tgt} for the crowd — and neither of them is quite the same after.`, `The dare pairs ${hotName} with ${tgt}. The kiss lands, the train roars, and something shifts.`, `${hotName} kisses ${tgt}. Awkward laughter, red faces — and a spark nobody planned on.`, `${hotName} and ${tgt} share the dare kiss. The moment lingers a beat too long.`], hotName + tgt + 'kiss'),
        badgeText: 'SPARK', badgeClass: 'gold', consequences: `+1.2 bond ${hotName}/${tgt}; possible showmance.` };
    }
    // punch
    addBond(hotName, tgt, -1.2);
    if (!gs.popularity) gs.popularity = {};
    gs.popularity[hotName] = (gs.popularity[hotName] || 0) - 1;
    return { type: 'tdtPunch', players: [hotName, tgt],
      text: _pick([`${hotName} is dared to hit a teammate — ${tgt} volunteers, and instantly regrets it.`, `${hotName} winds up and clocks ${tgt}. It was "just a dare," but ${tp.sub} won't forget it.`, `The punch dare lands on ${tgt}. ${hotName} apologizes; the bruise stays anyway.`, `${hotName} decks ${tgt} for the dare. The team laughs. ${tgt} doesn't.`], hotName + tgt + 'punch'),
      badgeText: 'THAT HURT', badgeClass: 'red', consequences: `-1.2 bond ${hotName}/${tgt}; ${hotName} -1 popularity.` };
  }

  // 2) REACTION to the hot player's outcome
  if (ctx.outcome === 'refused') {
    // a schemer/rival needles them (sabotage), OR a loyal mate comforts
    const rival = mates.slice().sort((a, b) => getBond(hotName, a) - getBond(hotName, b))[0];
    const friend = mates.slice().sort((a, b) => getBond(hotName, b) - getBond(hotName, a))[0];
    if (roll < 0.5 && getBond(hotName, rival) <= 0) {
      addBond(rival, hotName, -0.6);
      if (!gs.popularity) gs.popularity = {};
      gs.popularity[hotName] = (gs.popularity[hotName] || 0) - 0.5;
      return { type: 'tdtBlame', players: [rival, hotName],
        text: _pick([`${rival} rounds on ${hotName}: "That penalty is on YOU." The cart goes cold.`, `${rival} doesn't hide it — ${hotName}'s refusal cost them, and ${rival} makes sure everyone knows.`, `"We could've been a cart ahead." ${rival} stares at ${hotName}. The blame sticks.`, `${rival} throws up ${_pron(rival).posAdj} hands at ${hotName}. The refusal just made an enemy.`], rival + hotName + 'blame'),
        badgeText: 'BLAME', badgeClass: 'red', consequences: `-0.6 bond; ${hotName} -0.5 popularity.` };
    }
    addBond(friend, hotName, 0.7);
    return { type: 'tdtComfort', players: [friend, hotName],
      text: _pick([`${friend} pulls ${hotName} aside: "You didn't owe them that. We'll make it up." The bond tightens.`, `${friend} has ${hotName}'s back — "some things aren't worth it" — and means it.`, `${friend} sits with ${hotName} after the refusal. No judgment. Just loyalty.`, `"You did the right thing." ${friend} squeezes ${hotName}'s shoulder. Penalty or not.`], friend + hotName + 'comfort'),
      badgeText: 'HAD YOUR BACK', badgeClass: 'green', consequences: `+0.7 bond ${friend}/${hotName}.` };
  }

  // 3) COMPLETED reactions — cheer / respect / bonding-over-misery
  if (ctx.outcome === 'confident' || ctx.outcome === 'hesitant') {
    // only a CONFIDENT weak-spot clear earns awed respect; a shaky one gets a hug
    if (ctx.hitsWeakSpot && ctx.outcome === 'confident' && roll < 0.6) {
      const admirer = mates[Math.floor(Math.random() * mates.length)];
      addBond(admirer, hotName, 0.6);
      if (!gs.popularity) gs.popularity = {};
      gs.popularity[hotName] = (gs.popularity[hotName] || 0) + 1;
      return { type: 'tdtRespect', players: [admirer, hotName],
        text: _pick([`${hotName} did the ONE thing ${_p.sub} swore ${_p.sub} never would — and the whole cart erupts. ${admirer} is floored.`, `Nobody thought ${hotName} would go through with it. ${admirer}: "Okay, respect."`, `${hotName} grits through the worst possible dare. ${admirer} can't believe it — and won't forget it.`, `The crowd loses it for ${hotName}. ${admirer} leads the chant.`], admirer + hotName + 'resp'),
        badgeText: 'RESPECT', badgeClass: 'gold', consequences: `+0.6 bond; ${hotName} +1 popularity.` };
    }
    const cheer = mates[Math.floor(Math.random() * mates.length)];
    addBond(cheer, hotName, 0.4);
    return { type: 'tdtCheer', players: [cheer, hotName],
      text: _pick([`${cheer} hypes ${hotName} through it — "you GOT this" — and the cart moves on together.`, `${cheer} and ${hotName} bond over the shared misery of it. A little closer now.`, `${cheer} cheers ${hotName} across the line. Small moment, real one.`, `${cheer} reassures a nervous ${hotName} before the dare — and it works.`], cheer + hotName + 'cheer'),
      badgeText: 'HYPED UP', badgeClass: 'green', consequences: `+0.4 bond ${cheer}/${hotName}.` };
  }
  return null;
}

// ══════════════════════════════════════════════════════════════════════
export function simulateTruthOrDareTrain(ep) {
  const active = gs.activePlayers.filter(p => p !== gs.exileDuelPlayer);
  const tribes = (gs.tribes || []).filter(t => t.members.some(m => active.includes(m)));
  if (tribes.length < 2) return; // needs teams

  const personalScores = {};
  const allTurns = [];   // flat, in reveal order: {stepType:'turn'|'event', ...}
  ep.campEvents = ep.campEvents || {};

  // ── set up each team's hot-seat queue (bold-first tends to draw fire) ──
  const teamData = tribes.map(tribe => {
    const key = tribe.name;
    ep.campEvents[key] = ep.campEvents[key] || { pre: [], post: [] };
    const members = tribe.members.filter(m => active.includes(m));
    const order = members.slice().sort((a, b) => pStats(b).boldness - pStats(a).boldness);
    return { tribe, key, name: tribe.name, color: tribe.color, members: order,
      cart: 0, timeSec: 0, refusals: 0, turns: [] };
  });

  // ── ROUND-ROBIN: one hot seat per team per round, alternating team to team ──
  const maxLen = Math.max(...teamData.map(t => t.members.length));
  for (let round = 0; round < maxLen; round++) {
    teamData.forEach(t => {
      const name = t.members[round];
      if (!name) return;                    // this team is shorter — skip its slot
      const r = _resolveTurn(name, t.tribe);
      t.cart += 1;
      t.timeSec += r.timeCost;
      if (r.outcome === 'refused') t.refusals += 1;
      personalScores[name] = r.score;
      const turn = { team: t.name, color: t.color, player: name, cart: t.cart, ...r };
      t.turns.push(turn);
      allTurns.push({ stepType: 'turn', ...turn });

      // guaranteed social event after each hot seat (density)
      const evt = _socialEvent(t.tribe, name, r, ep, t.key);
      if (evt) {
        ep.campEvents[t.key].post.push(evt);
        allTurns.push({ stepType: 'event', team: t.name, color: t.color, ...evt });
      }
    });
  }

  teamData.forEach(t => {
    t.penalties = t.refusals * 5;   // minutes of penalty (for display)
    t.totalTime = t.timeSec;        // seconds — lower wins
    t.avgScore = t.members.length ? t.members.reduce((s, m) => s + (personalScores[m] || 0), 0) / t.members.length : 0;
  });

  // showmance moment if a showmance pair is racing (pass tribe objects, null phases)
  try { _checkShowmanceChalMoment(ep, null, null, personalScores, 'danger', tribes); } catch (e) {}

  // ── RANK TEAMS: fastest (lowest total time) wins; break ties by avg score ──
  teamData.sort((a, b) => (a.timeSec - b.timeSec) || (b.avgScore - a.avgScore));
  const winner = teamData[0].tribe;
  const loser = teamData[teamData.length - 1].tribe;
  const safeTribes = teamData.slice(1, -1).map(t => t.tribe);

  // ── FINALIZE (pre-merge: NO ep.immunityWinner; losing tribe → tribal) ──
  ep.truthOrDareTrain = {
    teams: teamData.map(t => ({ name: t.name, color: t.color, members: t.members, cart: t.cart,
      penalties: t.penalties, refusals: t.refusals, timeSec: Math.round(t.timeSec),
      timeLabel: _fmtTime(t.timeSec), avgScore: Math.round(t.avgScore * 10) / 10 })),
    turns: teamData.flatMap(t => t.turns),
    steps: allTurns,
    winner: winner.name, loser: loser.name,
    cartsTotal: Math.max(...teamData.map(t => t.members.length)),
  };
  ep.winner = winner;
  ep.loser = loser;
  ep.safeTribes = safeTribes;
  ep.tribalPlayers = [...loser.members];
  ep.challengeType = 'truth-or-dare-train';
  ep.challengeLabel = 'Truth or Dare Train';
  ep.challengeCategory = 'social';
  ep.chalMemberScores = personalScores;
  ep.chalPlacements = Object.entries(personalScores).sort((a, b) => b[1] - a[1]).map(([n]) => n);
  ep.isTruthOrDareTrain = true;

  updateChalRecord(ep);
}

// ══════════════════════════════════════════════════════════════════════
//  VP SCREENS — reproduces the approved mockup: live sticky train MAP,
//  team-grouped live SIDEBAR, Truth/Dare ticket cards, SVG icons.
//  Reveal architecture mirrors crazy-fun-time (_tvState / _reapplyVisibility).
// ══════════════════════════════════════════════════════════════════════
const _tdtState = {};
function _tdtEnsure(key, total) { if (!_tdtState[key]) _tdtState[key] = { idx: -1, total }; return _tdtState[key]; }
function _slug(s) { return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-'); }

function _tdtIcon(t) {
  const p = {
    loco: 'M4 4h9a5 5 0 0 1 5 5v4h2a2 2 0 0 1 2 2v3H2v-6a8 8 0 0 1 2-8Zm2 3v4h5V7Zm-2 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm14 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z',
    check: 'M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z',
    x: 'M18.3 5.7 12 12l6.3 6.3-1.4 1.4L10.6 13.4 4.3 19.7 2.9 18.3 9.2 12 2.9 5.7 4.3 4.3 10.6 10.6 16.9 4.3z',
    skip: 'M4 5v14l8-7zm9 0v14l8-7z',
    target: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 4a6 6 0 1 1 0 12 6 6 0 0 1 0-12Zm0 3a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z',
    wait: 'M6 2h12v6l-4 4 4 4v6H6v-6l4-4-4-4zm2 2v3l4 4 4-4V4zm0 16h8v-3l-4-4-4 4z',
    dare: 'M13 2 4 14h6l-1 8 9-12h-6z',
    truth: 'M4 3h16a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H9l-5 4V5a2 2 0 0 1 2-2Zm7 3v6h2V6zm0 8v2h2v-2z',
    dot: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z',
  };
  return `<svg class="tdt-ic" viewBox="0 0 24 24" aria-hidden="true"><path d="${p[t] || ''}"/></svg>`;
}
// status keys: confident/hesitant/refused (outcomes) + now/wait (live cursor)
const _statIcon = { confident: 'check', hesitant: 'wait', refused: 'x', now: 'target', wait: 'dot' };
const _statCls = { confident: 'st-pass', hesitant: 'st-slow', refused: 'st-fail', now: 'st-now', wait: 'st-wait' };

// Real player portrait (assets/avatars/{slug}.png) with an initials fallback.
function _tdtPortrait(name, color, cls) {
  const p = players.find(x => x.name === name);
  const slug = p?.slug || String(name).toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const init = String(name).slice(0, 2).toUpperCase();
  return `<span class="tdt-pf ${cls}" style="background:${color}"><img src="assets/avatars/${slug}.png" alt="${name}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"/><b>${init}</b></span>`;
}

// Cumulative race state up to a reveal index (drives map + sidebar).
function _tdtStateAt(data, idx) {
  const teams = {}; (data.teams || []).forEach(t => teams[t.name] = { cart: 0, timeSec: 0, refusals: 0, color: t.color });
  const status = {}; let curPlayer = null, curTeam = null;
  const steps = data.steps || [];
  for (let i = 0; i <= idx && i < steps.length; i++) {
    const s = steps[i];
    if (s.stepType === 'turn') {
      if (teams[s.team]) { teams[s.team].cart++; teams[s.team].timeSec += (s.timeCost || 0); if (s.outcome === 'refused') teams[s.team].refusals++; }
      status[s.player] = s.outcome; curPlayer = s.player; curTeam = s.team;
    }
  }
  return { teams, status, curPlayer, curTeam };
}

function _tdtMapInner(data, idx) {
  const st = _tdtStateAt(data, idx);
  const total = data.cartsTotal || Math.max(1, ...(data.teams || []).map(t => (t.members || []).length));
  let carts = '';
  for (let c = 0; c < total; c++) carts += `<div class="tdt-cart"><div class="tdt-cart-win"></div><div class="tdt-cnum">${c + 1}</div></div>`;
  let markers = '';
  (data.teams || []).forEach((t, i) => {
    const cart = st.teams[t.name]?.cart || 0;
    const tsec = st.teams[t.name]?.timeSec || 0;
    const pct = Math.min((cart / total) * 100, 92);
    markers += `<div class="tdt-marker" id="tdt-marker-${_slug(t.name)}" style="left:${pct}%;top:${2 + i * 28}px;color:${t.color}">
      <span class="tdt-mtrain">${_tdtIcon('loco')}</span>
      <span class="tdt-mlbl" style="color:${t.color}">${t.name.toUpperCase()}</span>
      <span class="tdt-mcart">cart ${cart}/${total} · ${_fmtTime(tsec)}</span></div>`;
  });
  return `<div class="tdt-carts">${carts}</div>
    <div class="tdt-loco-front">${_tdtIcon('loco')}</div><div class="tdt-front-lbl">FRONT ▶</div>${markers}`;
}

function _tdtSidebarInner(data, idx) {
  const st = _tdtStateAt(data, idx);
  // rank teams by current elapsed time so the leader floats to the top
  const teams = (data.teams || []).slice().sort((a, b) => (st.teams[a.name]?.timeSec || 0) - (st.teams[b.name]?.timeSec || 0));
  let html = '';
  teams.forEach((t, ti) => {
    const tsec = st.teams[t.name]?.timeSec || 0;
    const refs = st.teams[t.name]?.refusals || 0;
    let rows = '';
    (t.members || []).forEach(m => {
      let s = st.status[m] || 'wait';
      if (m === st.curPlayer) s = 'now';
      const cls = _statCls[s], icid = _statIcon[s];
      const nameCls = s === 'now' ? '' : (s === 'wait' ? 'wait' : 'done');
      rows += `<div class="tdt-row ${s === 'now' ? 'now' : ''}">${_tdtPortrait(m, t.color, 'sm')}<span class="tdt-rname ${nameCls}">${m}</span><span class="tdt-rstat ${cls}">${_tdtIcon(icid)}</span></div>`;
    });
    const lead = ti === 0 && idx >= 0 ? '<span class="tdt-lead">◀ LEAD</span>' : '';
    html += `<div class="tdt-team-block">
      <div class="tdt-team-bar" style="background:linear-gradient(90deg,${t.color}33,${t.color}11);color:${t.color};border:1px solid ${t.color}44">
        <span class="tdt-tname">${_tdtIcon('loco')} ${t.name.toUpperCase()}${lead}</span>
        <span class="tdt-clock">${_fmtTime(tsec)}${refs ? `<small> ${refs}✕ refused</small>` : '<small> elapsed</small>'}</span>
      </div>${rows}</div>`;
  });
  html += `<div class="tdt-legend">
    <span><span class="st-pass">${_tdtIcon('check')}</span>straight for it</span>
    <span><span class="st-slow">${_tdtIcon('wait')}</span>hesitated +time</span>
    <span><span class="st-fail">${_tdtIcon('x')}</span>refused +5m</span>
    <span><span class="st-now">${_tdtIcon('target')}</span>hot seat</span>
    <span><span class="st-wait">${_tdtIcon('dot')}</span>waiting</span></div>`;
  return html;
}

function _reapplyVisibility(suffix, upToIdx, total) {
  for (let i = 0; i <= upToIdx; i++) {
    const el = document.getElementById(`tdt-step-${suffix}-${i}`);
    if (el) el.classList.add('tdt-visible');
  }
  const counter = document.getElementById(`tdt-counter-${suffix}`);
  if (counter) counter.textContent = `${Math.min(upToIdx + 1, total)} / ${total}`;
  if (upToIdx >= total - 1) {
    const controls = document.getElementById(`tdt-controls-${suffix}`);
    if (controls) controls.querySelectorAll('.tdt-btn').forEach(b => b.style.opacity = '0.4');
  }
}
function _tdtData() { const ep = gs.episodeHistory?.[window.vpEpNum - 1]; return ep?.truthOrDareTrain || null; }
function _tdtLiveUpdate(idx) {
  const data = _tdtData(); if (!data) return;
  const mapEl = document.getElementById('tdt-map-inner'); if (mapEl) mapEl.innerHTML = _tdtMapInner(data, idx);
  const sideEl = document.getElementById('tdt-sidebar-inner'); if (sideEl) sideEl.innerHTML = _tdtSidebarInner(data, idx);
}
export function truthOrDareTrainRevealNext(screenKey, total) {
  const s = _tdtEnsure(screenKey, total); if (s.idx >= s.total - 1) return; s.idx++;
  const suffix = screenKey.replace('tdt-', '');
  _reapplyVisibility(suffix, s.idx, s.total);
  const el = document.getElementById(`tdt-step-${suffix}-${s.idx}`);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  _tdtLiveUpdate(s.idx);
}
export function truthOrDareTrainRevealAll(screenKey, total) {
  const s = _tdtEnsure(screenKey, total); s.idx = s.total - 1;
  _reapplyVisibility(screenKey.replace('tdt-', ''), s.idx, s.total);
  _tdtLiveUpdate(s.idx);
}

function _tdtCSS() {
  return `<style>
  @import url('https://fonts.googleapis.com/css2?family=Bungee&family=Nunito:wght@400;600;700;800&display=swap');
  .tdt-shell{--brass:#e0a94a;--brass2:#b9822f;--pass:#3fb950;--fail:#f85149;--skip:#a371f7;--now:#f0b429;--wait:#5a4c66;
    max-width:1100px;margin:0 auto;font-family:'Nunito',system-ui,sans-serif;color:#f5ead6;position:relative;padding-bottom:20px}
  .tdt-ic{width:1em;height:1em;fill:currentColor;vertical-align:-.12em}
  .tdt-hero{text-align:center;padding:8px 0 12px}
  .tdt-eyebrow{font-size:11px;letter-spacing:3px;color:var(--brass);text-transform:uppercase}
  .tdt-title{font-family:'Bungee','Bungee',cursive;font-weight:900;font-size:30px;line-height:1;letter-spacing:1px;
    background:linear-gradient(180deg,#ffe6a7,#e0a94a 55%,#b9822f);-webkit-background-clip:text;background-clip:text;color:transparent;text-shadow:0 2px 0 rgba(0,0,0,.35)}
  .tdt-sub{font-size:12px;color:#c9b48f;margin-top:4px}
  .tdt-map{background:linear-gradient(180deg,#20131b,#160c14);border:1px solid rgba(224,169,74,.28);border-radius:14px;
    padding:12px 16px 14px;margin-bottom:14px;position:sticky;top:50px;z-index:4;box-shadow:0 6px 22px rgba(0,0,0,.4)}
  .tdt-map-h{font-size:9px;letter-spacing:2px;color:#8a6f4a;text-transform:uppercase;margin-bottom:12px;display:flex;align-items:center;gap:6px}
  .tdt-map-inner{position:relative;height:96px}
  .tdt-carts{position:absolute;left:0;right:60px;top:34px;display:flex;gap:4px}
  .tdt-cart{flex:1;height:26px;border-radius:4px;background:linear-gradient(180deg,#4a2f1c,#2e1a0f);border:1px solid #5a4021;position:relative}
  .tdt-cart-win{position:absolute;top:5px;left:5px;right:5px;height:3px;border-radius:2px;background:#5a4021}
  .tdt-cnum{position:absolute;bottom:-14px;left:0;right:0;text-align:center;font-size:8px;color:#7a6144}
  .tdt-loco-front{position:absolute;right:0;top:26px;color:var(--brass);font-size:40px;filter:drop-shadow(0 0 8px rgba(224,169,74,.5))}
  .tdt-front-lbl{position:absolute;right:2px;top:2px;font-size:8px;letter-spacing:1px;color:var(--brass);font-weight:800}
  .tdt-marker{position:absolute;display:flex;align-items:center;gap:4px;transition:left .55s cubic-bezier(.5,0,.3,1);z-index:3}
  .tdt-mtrain{font-size:22px;filter:drop-shadow(0 0 6px currentColor)}
  .tdt-mlbl{font-size:9px;font-weight:800;letter-spacing:1px;background:#000a;padding:1px 6px;border-radius:4px;white-space:nowrap}
  .tdt-mcart{font-size:8px;opacity:.75}
  .tdt-body{display:grid;grid-template-columns:1fr 288px;gap:16px}
  @media(max-width:820px){.tdt-body{grid-template-columns:1fr}}
  .tdt-stage-steps{display:flex;flex-direction:column}
  /* hidden steps COLLAPSE (max-height:0) so they don't take space and bury the controls */
  .tdt-step{max-height:0;overflow:hidden;opacity:0;transform:translateY(16px);transition:max-height .5s ease,opacity .5s,transform .5s}
  .tdt-step.tdt-visible{max-height:1600px;opacity:1;transform:none;margin-bottom:12px}
  @media(prefers-reduced-motion:reduce){.tdt-step{transition:max-height .2s,opacity .2s}.tdt-marker{transition:none}}
  /* full-bleed themed background so the challenge never looks bare */
  .tdt-bgfx{position:fixed;inset:0;z-index:-1;pointer-events:none;background:radial-gradient(ellipse at 50% -10%,#2a1c34 0%,#140b1c 55%,#0a0610 100%)}
  /* avatar portraits (real assets/avatars images, initials fallback) */
  .tdt-pf{display:inline-flex;align-items:center;justify-content:center;border-radius:50%;overflow:hidden;position:relative;flex-shrink:0;vertical-align:middle}
  .tdt-pf img{width:100%;height:100%;object-fit:cover;display:block}
  .tdt-pf b{display:none;width:100%;height:100%;align-items:center;justify-content:center;color:#fff;font-family:'Bungee';font-weight:400;letter-spacing:0}
  .tdt-pf.sm{width:24px;height:24px;font-size:9px;border:1.5px solid #443}
  .tdt-pf.md{width:30px;height:30px;font-size:10px;border:2px solid #1a0f10}
  .tdt-pf.lg{width:66px;height:66px;font-size:22px;border:3px solid var(--now);box-shadow:0 0 16px rgba(240,180,41,.5)}
  .tdt-pf.stack{margin-left:-8px;border:2px solid #170d18}
  .tdt-cartcard{background:linear-gradient(180deg,#3a2418,#241309);border:1px solid var(--brass2);border-radius:14px;overflow:hidden;box-shadow:inset 0 0 40px rgba(0,0,0,.5)}
  .tdt-cart-head{display:flex;align-items:center;justify-content:space-between;padding:9px 14px;background:linear-gradient(90deg,#4a2f1c,#2e1a0f);border-bottom:2px solid var(--brass2)}
  .tdt-cart-no{font-family:'Bungee';font-size:13px;color:var(--brass);letter-spacing:1px}
  .tdt-cart-team{font-size:11px;font-weight:800;letter-spacing:1px;padding:3px 10px;border-radius:18px;display:flex;align-items:center;gap:5px}
  .tdt-window{height:64px;margin:12px 14px 2px;border-radius:9px;overflow:hidden;position:relative;background:linear-gradient(180deg,#0a0812,#160a1e);border:3px solid #1a0f10;box-shadow:inset 0 0 24px #000}
  .tdt-streak{position:absolute;top:0;bottom:0;width:50px;border-radius:40%;background:radial-gradient(ellipse,rgba(255,180,80,.9),transparent 70%);animation:tdtStreak 1.1s linear infinite}
  @keyframes tdtStreak{from{left:110%}to{left:-20%}}
  @media(prefers-reduced-motion:reduce){.tdt-streak{animation:none}}
  .tdt-duel{display:flex;align-items:center;gap:14px;padding:10px 16px 14px}
  .tdt-hotseat{text-align:center;flex-shrink:0;width:84px}
  .tdt-portrait{width:64px;height:64px;border-radius:50%;border:3px solid var(--now);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:22px;font-family:'Bungee';box-shadow:0 0 16px rgba(240,180,41,.5);margin:0 auto;color:#fff}
  .tdt-hs-name{font-weight:800;font-size:13px;margin-top:5px}
  .tdt-hs-tag{font-size:10px;color:#c9a86a}
  .tdt-card{flex:1;background:linear-gradient(160deg,#fff7e6,#f3dfae);color:#3a2012;border-radius:11px;padding:12px 15px;position:relative;box-shadow:0 8px 20px rgba(0,0,0,.5);border:2px dashed var(--brass2)}
  .tdt-card::before,.tdt-card::after{content:'';position:absolute;top:50%;width:14px;height:14px;background:#241309;border-radius:50%;transform:translateY(-50%)}
  .tdt-card::before{left:-8px}.tdt-card::after{right:-8px}
  .tdt-kind{font-family:'Bungee';font-size:15px;letter-spacing:2px;display:flex;align-items:center;gap:6px}
  .tdt-kind.dare{color:#c0392b}.tdt-kind.truth{color:#2874a6}
  .tdt-prompt{font-size:13.5px;font-weight:700;margin-top:4px;line-height:1.35}
  .tdt-verdict{margin-top:9px;display:inline-flex;align-items:center;gap:6px;font-weight:800;font-size:12px;padding:4px 11px;border-radius:6px}
  .tdt-verdict.pass{background:#3fb95022;color:#1e7a32;border:1px solid #3fb95055}
  .tdt-verdict.slow{background:#e0a94a22;color:#8a5a12;border:1px solid #e0a94a66}
  .tdt-verdict.fail{background:#f8514922;color:#a52016;border:1px solid #f8514955}
  .tdt-beat{margin:0 14px 12px;padding:9px 13px;background:#0006;border-left:3px solid var(--brass2);border-radius:0 8px 8px 0;font-size:12px;line-height:1.5;color:#e8d6b4;font-style:italic}
  .tdt-beat b{color:var(--brass);font-style:normal}
  /* social event card (distinct: dashed border, side-tint) */
  .tdt-social{display:flex;align-items:flex-start;gap:11px;padding:11px 14px;background:linear-gradient(180deg,#231524,#170d18);border:1px dashed rgba(163,113,247,.4);border-radius:12px}
  .tdt-social-badge{font-size:8px;font-weight:800;letter-spacing:1px;padding:2px 7px;border-radius:4px;margin-bottom:4px;display:inline-block}
  .badge-gold{background:#e0a94a22;color:#e0a94a}.badge-green{background:#3fb95022;color:#3fb950}.badge-red{background:#f8514922;color:#f85149}
  .tdt-social-text{font-size:12.5px;line-height:1.5;color:#e0d3ea}
  .tdt-social-avas{display:flex;flex-shrink:0}
  .tdt-social-ava{width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800;color:#fff;font-family:'Bungee';border:2px solid #170d18;margin-left:-6px}
  /* sidebar */
  .tdt-side{background:linear-gradient(180deg,#1c1220,#120a16);border:1px solid rgba(224,169,74,.22);border-radius:14px;padding:12px;align-self:start;position:sticky;top:160px}
  .tdt-side-h{font-size:9px;letter-spacing:2px;color:#8a6f4a;text-transform:uppercase;margin-bottom:8px}
  .tdt-team-block{margin-bottom:12px}
  .tdt-team-bar{display:flex;align-items:center;justify-content:space-between;padding:6px 10px;border-radius:8px;margin-bottom:6px;font-weight:800;font-size:12px}
  .tdt-tname{display:flex;align-items:center;gap:6px}
  .tdt-clock{font-family:'Bungee';font-size:12px}.tdt-clock small{font-family:'Nunito';font-size:8px;opacity:.7;font-weight:600}
  .tdt-row{display:flex;align-items:center;gap:8px;padding:4px 7px;border-radius:7px;margin-bottom:2px;font-size:12px;transition:background .2s}
  .tdt-row.now{background:rgba(240,180,41,.14);box-shadow:inset 0 0 0 1px rgba(240,180,41,.5)}
  .tdt-ava{width:23px;height:23px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:800;flex-shrink:0;color:#fff;font-family:'Bungee'}
  .tdt-rname{flex:1;font-weight:600}.tdt-rname.done{opacity:.85}.tdt-rname.wait{opacity:.45}
  .tdt-rstat{width:18px;text-align:center;font-size:14px}
  .st-pass{color:var(--pass)}.st-slow{color:var(--brass)}.st-fail{color:var(--fail)}.st-skip{color:var(--skip)}.st-now{color:var(--now)}.st-wait{color:var(--wait)}
  .tdt-lead{font-size:8px;font-weight:800;letter-spacing:1px;color:var(--pass);margin-left:6px;animation:tdtLeadPulse 1.4s ease-in-out infinite}
  @keyframes tdtLeadPulse{0%,100%{opacity:.5}50%{opacity:1}}
  @media(prefers-reduced-motion:reduce){.tdt-lead{animation:none}}
  .tdt-legend{font-size:10px;color:#9c8db0;display:flex;flex-wrap:wrap;gap:6px 10px;margin-top:4px;padding-top:8px;border-top:1px solid #2a1e33}
  .tdt-legend span{display:flex;align-items:center;gap:3px}
  .tdt-controls{display:flex;gap:10px;justify-content:center;align-items:center;padding:12px;margin-top:14px;position:sticky;bottom:10px;z-index:6;background:rgba(20,11,20,.9);backdrop-filter:blur(6px);border:1px solid rgba(224,169,74,.25);border-radius:12px;box-shadow:0 6px 20px rgba(0,0,0,.5)}
  .tdt-btn{background:linear-gradient(135deg,var(--brass),var(--brass2));color:#231204;border:none;padding:10px 20px;border-radius:10px;font-weight:800;cursor:pointer;font-size:13px;box-shadow:0 4px 14px rgba(224,169,74,.35);display:flex;align-items:center;gap:6px}
  .tdt-btn.ghost{background:linear-gradient(135deg,#6b7280,#4b5563);color:#fff}
  .tdt-counter{font-size:12px;color:#c9a86a;font-weight:700}
  .tdt-results-row{display:flex;align-items:center;gap:12px;padding:10px 14px;border-radius:10px;margin-bottom:8px;border-left:4px solid}
  .tdt-rank{font-family:'Bungee';font-size:18px;width:30px;text-align:center}
  /* ── COLD OPEN (grandiose animated intro) ── */
  .tdt-coldopen{padding:18px 10px 44px;text-align:center;position:relative;overflow:hidden;min-height:520px}
  .tdt-co-lights{position:absolute;inset:0;pointer-events:none;overflow:hidden;z-index:0}
  .tdt-co-lights::before,.tdt-co-lights::after{content:'';position:absolute;top:0;bottom:0;left:0;width:200%;
    background-image:radial-gradient(circle,rgba(255,200,90,.5) 2px,transparent 3px);background-size:58px 58px;animation:tdtLights 2.4s linear infinite;opacity:.22}
  .tdt-co-lights::after{background-image:radial-gradient(circle,rgba(120,200,255,.5) 2px,transparent 3px);background-size:74px 74px;animation-duration:1.6s;opacity:.16}
  @keyframes tdtLights{from{transform:translateX(0)}to{transform:translateX(-74px)}}
  .tdt-co-title{font-family:'Bungee';font-size:clamp(30px,6vw,52px);line-height:1;letter-spacing:2px;margin-top:6px;position:relative;z-index:2;
    background:linear-gradient(180deg,#fff0c4,#e0a94a 50%,#b9822f);-webkit-background-clip:text;background-clip:text;color:transparent;
    text-shadow:0 3px 0 rgba(0,0,0,.4),0 0 44px rgba(224,169,74,.45);animation:tdtTitlePulse 2.6s ease-in-out infinite}
  @keyframes tdtTitlePulse{0%,100%{filter:drop-shadow(0 0 0 transparent)}50%{filter:drop-shadow(0 0 16px rgba(240,180,41,.4))}}
  .tdt-co-scene{position:relative;margin-top:40px;z-index:2}
  .tdt-co-train{display:inline-flex;align-items:flex-end;gap:8px;animation:tdtChug 1.3s ease-in-out infinite}
  @keyframes tdtChug{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
  .tdt-co-loco{position:relative;color:var(--brass);font-size:66px;line-height:.9;filter:drop-shadow(0 0 12px rgba(224,169,74,.6))}
  .tdt-co-steam{position:absolute;top:-6px;left:16px}
  .tdt-co-steam span{position:absolute;width:14px;height:14px;border-radius:50%;background:rgba(255,255,255,.28);animation:tdtSteam 1.7s ease-out infinite}
  @keyframes tdtSteam{0%{transform:translate(0,0) scale(.4);opacity:.7}100%{transform:translate(-34px,-46px) scale(1.7);opacity:0}}
  .tdt-co-car{background:linear-gradient(180deg,#4a2f1c,#2e1a0f);border:2px solid var(--brass2);border-radius:8px 8px 4px 4px;padding:8px 10px 10px;position:relative;box-shadow:0 6px 18px rgba(0,0,0,.5)}
  .tdt-co-car-roof{height:6px;background:linear-gradient(90deg,#6a4a2a,#3a2414);border-radius:7px 7px 0 0;margin:-8px -10px 8px}
  .tdt-co-car-lbl{font-size:9px;font-weight:800;letter-spacing:1px;padding:1px 9px;border-radius:10px;margin-bottom:8px;display:inline-block}
  .tdt-co-windows{display:flex;gap:5px;flex-wrap:wrap;max-width:210px;justify-content:center}
  .tdt-co-win{width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:'Bungee';font-size:10px;color:#fff;border:2px solid #1a0f10;box-shadow:inset 0 0 6px rgba(0,0,0,.5)}
  .tdt-co-wheels{display:flex;gap:16px;justify-content:center;margin-top:8px}
  .tdt-co-wheel{width:12px;height:12px;border-radius:50%;background:#1a0f10;border:2px solid var(--brass2);position:relative;animation:tdtWheel .5s linear infinite}
  .tdt-co-wheel::after{content:'';position:absolute;top:1px;left:50%;width:2px;height:4px;background:var(--brass2);transform:translateX(-50%)}
  @keyframes tdtWheel{to{transform:rotate(360deg)}}
  .tdt-co-rail{height:5px;background:repeating-linear-gradient(90deg,#5a4021 0 16px,#2a1c10 16px 24px);margin-top:3px;border-radius:2px;animation:tdtRail .35s linear infinite}
  @keyframes tdtRail{to{background-position:-24px 0}}
  .tdt-co-cta{margin-top:30px;font-size:13px;color:#c9b48f;z-index:2;position:relative;font-weight:700}
  @media(prefers-reduced-motion:reduce){.tdt-co-train,.tdt-co-lights::before,.tdt-co-lights::after,.tdt-co-steam span,.tdt-co-wheel,.tdt-co-rail,.tdt-co-title{animation:none}}
  </style>`;
}

function _shell(content, ep) {
  const data = ep.truthOrDareTrain || {};
  return `${_tdtCSS()}<div class="tdt-shell"><div class="tdt-bgfx"></div>
    <div class="tdt-hero">
      <div class="tdt-eyebrow">Carnival of Chaos</div>
      <div class="tdt-title">TRUTH OR DARE TRAIN</div>
      <div class="tdt-sub">Race to the front of the train. Every camper takes one hot seat. Refuse — your team eats a 5-minute penalty.</div>
    </div>
    <div class="tdt-map"><div class="tdt-map-h">${_tdtIcon('loco')} THE RACE — each team's position on the train · front ▶</div>
      <div class="tdt-map-inner" id="tdt-map-inner">${_tdtMapInner(data, -1)}</div></div>
    ${content}
  </div>`;
}

// ── SCREEN 1: grandiose animated cold open ──
export function rpBuildTDTTitleCard(ep) {
  const data = ep.truthOrDareTrain; if (!data) return '';
  const cars = (data.teams || []).map(t => `
    <div class="tdt-co-car">
      <div class="tdt-co-car-roof"></div>
      <div class="tdt-co-car-lbl" style="background:${t.color}22;color:${t.color};border:1px solid ${t.color}55">${t.name.toUpperCase()}</div>
      <div class="tdt-co-windows">${(t.members || []).map(m => _tdtPortrait(m, t.color, 'md')).join('')}</div>
      <div class="tdt-co-wheels"><div class="tdt-co-wheel"></div><div class="tdt-co-wheel"></div></div>
    </div>`).join('');
  return `${_tdtCSS()}<div class="tdt-shell tdt-coldopen"><div class="tdt-bgfx"></div>
    <div class="tdt-co-lights"></div>
    <div class="tdt-eyebrow" style="position:relative;z-index:2">Carnival of Chaos · Immunity Challenge</div>
    <div class="tdt-co-title">TRUTH OR DARE TRAIN</div>
    <div class="tdt-sub" style="position:relative;z-index:2;max-width:660px;margin:6px auto 0">Reach the front of the train. Every camper takes one hot seat — Truth or Dare. Complete it to roll on; refuse, and your team eats a 5-minute penalty.</div>
    <div class="tdt-co-scene">
      <div class="tdt-co-train">
        <div class="tdt-co-loco">${_tdtIcon('loco')}<div class="tdt-co-steam"><span style="animation-delay:0s"></span><span style="animation-delay:.55s;left:9px"></span><span style="animation-delay:1.1s;left:-5px"></span></div></div>
        ${cars}
      </div>
      <div class="tdt-co-rail"></div>
    </div>
    <div class="tdt-co-cta">▶ All aboard — the race to the front begins.</div>
  </div>`;
}

// ── SCREEN 2: the race (main reveal) ──
export function rpBuildTDTRace(ep) {
  const data = ep.truthOrDareTrain; if (!data) return '';
  const steps = data.steps || [];
  const suffix = 'race';
  const stepCards = steps.map((s, i) => {
    if (s.stepType === 'turn') {
      const o = s.outcome;
      const vcls = o === 'refused' ? 'fail' : (o === 'hesitant' ? 'slow' : 'pass');
      const vic = o === 'refused' ? 'x' : (o === 'hesitant' ? 'wait' : 'check');
      const tlabel = _fmtTime(s.timeCost);
      const vtxt = o === 'refused' ? `REFUSED · +5:00${s.quote ? ` — “${s.quote}”` : ''}`
        : o === 'hesitant' ? `DONE (shaky) · +${tlabel}${s.quote ? ` — “${s.quote}”` : ''}`
        : `DONE · +${tlabel}${s.quote ? ` — “${s.quote}”` : ''}`;
      const pr = _pron(s.player);
      const beat = o === 'refused'
        ? (s.hitsWeakSpot
            ? _pick([`<b>${s.player}</b> won't do it — <b>weak spot hit</b>. ${s.team} eats a <b>+5:00 penalty</b>.`, `It's the one thing <b>${s.player}</b> won't touch. Flat refusal — <b>+5:00</b> onto ${s.team}'s clock.`, `<b>${s.player}</b> freezes on ${pr.posAdj} weak spot and walks. <b>+5:00</b>, and ${s.team} bleeds.`], s.player + 'brf')
            : _pick([`<b>${s.player}</b> flat-out refuses. ${s.team} swallows a <b>+5:00 penalty</b>.`, `No chance. <b>${s.player}</b> passes on principle — <b>+5:00</b> onto ${s.team}.`, `<b>${s.player}</b> shakes ${pr.posAdj} head and sits. That's <b>+5:00</b> for ${s.team}.`], s.player + 'brf'))
        : o === 'hesitant'
          ? (s.hitsWeakSpot
              ? _pick([`<b>${s.player}</b> nearly balks on ${pr.posAdj} weak spot — then forces it through. But the clock bled <b>+${tlabel}</b>.`, `Agony. <b>${s.player}</b> stares it down, hates it, does it anyway. <b>+${tlabel}</b> gone.`, `<b>${s.player}</b> almost walks, then grits it out shaking. Costly — <b>+${tlabel}</b>.`], s.player + 'bh')
              : _pick([`<b>${s.player}</b> freezes up, second-guesses, finally goes. <b>+${tlabel}</b> off the pace.`, `<b>${s.player}</b> fumbles it, stalls, gets there in the end — <b>+${tlabel}</b>.`, `Shaky hands, long pause. <b>${s.player}</b> clears it but loses <b>+${tlabel}</b>.`], s.player + 'bh'))
          : (s.hitsWeakSpot
              ? _pick([`<b>${s.player}</b> attacks the one thing ${pr.sub} swore ${pr.sub}'d never do — and the cart erupts. Only <b>+${tlabel}</b>.`, `No flinch. <b>${s.player}</b> nails ${pr.posAdj} own weak spot cold — <b>+${tlabel}</b>. ${s.team} surges.`, `Everyone braced for a refusal. <b>${s.player}</b> just... did it. <b>+${tlabel}</b>.`], s.player + 'bc')
              : _pick([`<b>${s.player}</b> goes straight for it — clean, <b>+${tlabel}</b>. ${s.team} surges up the train.`, `No hesitation. <b>${s.player}</b> clears the cart in <b>+${tlabel}</b>.`, `<b>${s.player}</b> doesn't blink — <b>+${tlabel}</b> and gone. ${s.team} rolls on.`], s.player + 'bc'));
      return `<div class="tdt-step" id="tdt-step-${suffix}-${i}"><div class="tdt-cartcard">
        <div class="tdt-cart-head"><span class="tdt-cart-no">CART ${s.cart} — HOT SEAT</span>
          <span class="tdt-cart-team" style="background:${s.color}22;color:${s.color};border:1px solid ${s.color}55">${_tdtIcon('loco')} ${s.team.toUpperCase()}</span></div>
        <div class="tdt-window"><div class="tdt-streak"></div><div class="tdt-streak" style="animation-delay:.4s;background:radial-gradient(ellipse,rgba(120,200,255,.8),transparent 70%)"></div><div class="tdt-streak" style="animation-delay:.75s;background:radial-gradient(ellipse,rgba(255,120,180,.8),transparent 70%)"></div></div>
        <div class="tdt-duel"><div class="tdt-hotseat">${_tdtPortrait(s.player, s.color, 'lg')}<div class="tdt-hs-name">${s.player}</div><div class="tdt-hs-tag">${s.team}</div></div>
          <div class="tdt-card"><div class="tdt-kind ${s.kind}">${_tdtIcon(s.kind === 'dare' ? 'dare' : 'truth')} ${s.kind.toUpperCase()}</div>
            <div class="tdt-prompt">${s.player} is asked to ${s.prompt}.</div>
            <span class="tdt-verdict ${vcls}">${_tdtIcon(vic)} ${vtxt}</span></div></div>
        <div class="tdt-beat">${beat}</div></div></div>`;
    }
    // social event card
    const avas = (s.players || []).slice(0, 2).map((p, ai) => _tdtPortrait(p, s.color || '#a371f7', ai === 0 ? 'md' : 'md stack')).join('');
    const badgeCls = s.badgeClass === 'gold' ? 'badge-gold' : s.badgeClass === 'red' ? 'badge-red' : 'badge-green';
    return `<div class="tdt-step" id="tdt-step-${suffix}-${i}"><div class="tdt-social">
      <div class="tdt-social-avas">${avas}</div>
      <div><span class="tdt-social-badge ${badgeCls}">${s.badgeText || 'MOMENT'}</span>
        <div class="tdt-social-text">${s.text || ''}</div></div></div></div>`;
  }).join('');

  return _shell(`<div class="tdt-body">
    <div><div class="tdt-stage-steps">${stepCards}</div>
      <div class="tdt-controls" id="tdt-controls-${suffix}">
        <button class="tdt-btn" onclick="truthOrDareTrainRevealNext('tdt-${suffix}',${steps.length})">${_tdtIcon('target')} Next Hot Seat</button>
        <span class="tdt-counter" id="tdt-counter-${suffix}">0 / ${steps.length}</span>
        <button class="tdt-btn ghost" onclick="truthOrDareTrainRevealAll('tdt-${suffix}',${steps.length})">${_tdtIcon('skip')} Skip to result</button>
      </div></div>
    <div class="tdt-side"><div class="tdt-side-h">Live status — by team</div><div id="tdt-sidebar-inner">${_tdtSidebarInner(data, -1)}</div></div>
  </div>`, ep);
}

// ── SCREEN 3: results ──
export function rpBuildTDTResults(ep) {
  const data = ep.truthOrDareTrain; if (!data) return '';
  const ranked = (data.teams || []).slice().sort((a, b) => (a.timeSec || 0) - (b.timeSec || 0));
  const rows = ranked.map((t, i) => {
    const isWin = t.name === data.winner, isLose = t.name === data.loser;
    const tag = isWin ? 'WINS IMMUNITY' : isLose ? 'GOES TO TRIBAL' : 'SAFE';
    const tagCol = isWin ? 'var(--pass)' : isLose ? 'var(--fail)' : '#c9b48f';
    const refTxt = t.refusals ? `${t.refusals} refusal${t.refusals > 1 ? 's' : ''} (+${t.penalties}:00)` : 'no refusals';
    return `<div class="tdt-results-row" style="border-color:${t.color};background:${t.color}14">
      <span class="tdt-rank" style="color:${t.color}">${i + 1}</span>
      <div style="flex:1"><div style="font-weight:800;font-size:14px;color:${t.color};display:flex;align-items:center;gap:6px">${_tdtIcon('loco')} ${t.name.toUpperCase()}</div>
        <div style="font-size:11px;color:#c9b48f;margin-top:2px">final time <b style="color:#f5ead6">${t.timeLabel || _fmtTime(t.timeSec)}</b> · ${refTxt}</div></div>
      <span style="font-weight:800;font-size:11px;letter-spacing:1px;color:${tagCol}">${tag}</span></div>`;
  }).join('');
  return _shell(`<div class="tdt-body"><div><div class="tdt-cartcard" style="padding:16px">
      <div style="font-family:'Bungee';color:var(--brass);font-size:15px;margin-bottom:10px">FRONT OF THE TRAIN</div>${rows}
      <div style="font-size:12px;color:#c9b48f;margin-top:8px;line-height:1.5">Lowest total time to the front takes immunity — every hesitation and refusal added to the clock. The slowest team heads to tribal council.</div>
    </div></div>
    <div class="tdt-side"><div class="tdt-side-h">Final status — by team</div><div id="tdt-sidebar-inner">${_tdtSidebarInner(data, (data.steps || []).length - 1)}</div></div></div>`, ep);
}
