// ══════════════════════════════════════════════════════════════════════
// truth-or-dare-train.js — "Truth or Dare Train" (pre-merge team race)
// Both teams race cart-to-cart to the front of a moving train. Each camper
// takes ONE hot seat (Truth or Dare). Completing advances the team; REFUSING
// costs the team a 5-minute penalty. Lowest total time wins tribe immunity.
// Personality-driven: bold players dare, cautious players pick truth, and a
// prompt that hits a personal WEAK SPOT (vanity, loyalty, a secret) can make
// even a bold player refuse. Rich social events fire BETWEEN every hot seat.
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

// ── the per-camper hot-seat resolution ─────────────────────────────────
// Returns { kind, prompt, weak, verdict, quote, targetPlayer, score }.
function _resolveTurn(name, team, skipAvailable) {
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

  // completion chance: grit (boldness+temperament) vs the sting of a weak-spot hit
  let complete = s.boldness * 0.5 + s.temperament * 0.35 + 1.0 + _noise(2.5);
  if (hitsWeakSpot) complete -= 5.5;              // the thing that makes them balk
  if (kind === 'truth') complete += 0.8;          // truths are usually easier to survive
  // one team skip pass can save a likely refusal
  let verdict, usedSkip = false;
  if (complete < 0 && skipAvailable && (hitsWeakSpot || s.boldness <= 4)) {
    verdict = 'skip'; usedSkip = true;
  } else {
    verdict = complete >= 0 ? 'pass' : 'fail';
  }

  // in-character quote
  const quote = _quoteFor(name, kind, verdict, promptObj.weak);

  // per-player score: nailing a hard (weak-spot) dare scores big; refusing hurts
  let score = 0;
  if (verdict === 'pass') score = (hitsWeakSpot ? 8 : 5) + (kind === 'dare' ? 2 : 0) + Math.round(s.boldness * 0.2);
  else if (verdict === 'skip') score = 2;
  else score = -3; // refusal — cost the team time

  return { kind, prompt, weak: promptObj.weak, hitsWeakSpot, verdict, quote, targetPlayer, targetKind: promptObj.targetKind || null, usedSkip, score };
}

function _quoteFor(name, kind, verdict, weak) {
  const p = _pron(name);
  if (verdict === 'fail') {
    const pool = {
      vanity: [`I'm not touching my face for a game. Looks are everything.`, `Absolutely not. Do you know what I do for a living?`, `No. I've worked too hard on this look.`, `I'll take the penalty. My image is not up for debate.`],
      loyalty: [`I can't put a divide on this team. It's not worth the time.`, `No — I'm not ranking the people I'm fighting beside.`, `Ask me anything else. I won't turn on them.`, `Forget it. I'd rather eat the penalty than sell out my team.`],
      secret: [`That stays with me. I'll take the five minutes.`, `Some things I brought here for a reason. Pass.`, `No. That's not going on camera.`, `Nice try. That door stays shut.`],
      fear: [`Nope. Nope. I can't — I physically can't.`, `That is a hard no from me.`, `I'd rather lose than do THAT.`, `You've got the wrong person for this one.`],
      temper: [`This is humiliating and I won't do it.`, `Absolutely not, find someone else.`, `No. I have some dignity left.`, `I'm out. Take the penalty.`],
    };
    return _pick(pool[weak] || pool.temper, name + 'fail');
  }
  if (verdict === 'skip') return _pick([`Saved by the pass — I'm walking through this one.`, `Thank god for the skip. I owe the team.`, `Not today. I'm taking the free pass.`, `Emily, you're a lifesaver.`], name + 'skip');
  // pass
  const pool = kind === 'dare'
    ? [`Ugh — fine. Let's get it over with.`, `You think this scares me? Watch.`, `For the team. Deep breath. Go.`, `Okay, that was actually kind of fun.`]
    : [`It's one question. How hard can it be?`, `Fine — you want the truth? Here it is.`, `I've got nothing to hide. Ask away.`, `Honestly? Yeah. I'll say it.`];
  return _pick(pool, name + 'pass');
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

  // 2) REACTION to the hot player's verdict
  if (ctx.verdict === 'fail') {
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

  // 3) PASS reactions — cheer / respect / bonding-over-misery / trash-talk across teams
  if (ctx.verdict === 'pass') {
    if (ctx.hitsWeakSpot && roll < 0.6) {
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
  const teamData = [];
  const allTurns = [];   // flat, in reveal order: {stepType:'turn'|'event', ...}
  ep.campEvents = ep.campEvents || {};

  tribes.forEach(tribe => {
    const key = tribe.name;
    ep.campEvents[key] = ep.campEvents[key] || { pre: [], post: [] };
    const members = tribe.members.filter(m => active.includes(m));
    // hot-seat order: bold first tends to draw fire; shuffle-ish by name hash
    const order = members.slice().sort((a, b) => pStats(b).boldness - pStats(a).boldness);
    let skipAvailable = true; // one skip-the-hot-seat pass per team
    let penalties = 0;
    let cart = 0;
    const turns = [];

    order.forEach((name, i) => {
      const r = _resolveTurn(name, tribe, skipAvailable);
      if (r.usedSkip) skipAvailable = false;
      if (r.verdict === 'fail') penalties += 5;
      cart += 1;
      personalScores[name] = r.score;
      const turn = { team: tribe.name, color: tribe.color, player: name, cart, ...r };
      turns.push(turn);
      allTurns.push({ stepType: 'turn', ...turn });

      // guaranteed social event after each hot seat (density)
      const evt = _socialEvent(tribe, name, r, ep, key);
      if (evt) {
        ep.campEvents[key].post.push(evt);
        allTurns.push({ stepType: 'event', team: tribe.name, color: tribe.color, ...evt });
      }
    });

    const baseTime = members.length * 2;           // base minutes to clear the carts
    const totalTime = baseTime + penalties;         // lower = better
    const avgScore = members.length ? members.reduce((s, m) => s + (personalScores[m] || 0), 0) / members.length : 0;
    teamData.push({ tribe, name: tribe.name, color: tribe.color, members: order, cart, penalties, totalTime, avgScore, skipUsed: !skipAvailable, turns });
  });

  // showmance moment if a showmance pair is racing (pass tribe objects, null phases)
  try { _checkShowmanceChalMoment(ep, null, null, personalScores, 'danger', tribes); } catch (e) {}

  // ── RANK TEAMS: fastest (lowest total time) wins; break ties by avg score ──
  teamData.sort((a, b) => (a.totalTime - b.totalTime) || (b.avgScore - a.avgScore));
  const winner = teamData[0].tribe;
  const loser = teamData[teamData.length - 1].tribe;
  const safeTribes = teamData.slice(1, -1).map(t => t.tribe);

  // ── FINALIZE (pre-merge: NO ep.immunityWinner; losing tribe → tribal) ──
  ep.truthOrDareTrain = {
    teams: teamData.map(t => ({ name: t.name, color: t.color, members: t.members, cart: t.cart, penalties: t.penalties, totalTime: t.totalTime, avgScore: Math.round(t.avgScore * 10) / 10, skipUsed: t.skipUsed })),
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
