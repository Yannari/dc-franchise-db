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
  };
  return `<svg class="tdt-ic" viewBox="0 0 24 24" aria-hidden="true"><path d="${p[t] || ''}"/></svg>`;
}
const _statIcon = { pass: 'check', fail: 'x', skip: 'skip', now: 'target', wait: 'wait' };
const _statCls = { pass: 'st-pass', fail: 'st-fail', skip: 'st-skip', now: 'st-now', wait: 'st-wait' };

// Cumulative race state up to a reveal index (drives map + sidebar).
function _tdtStateAt(data, idx) {
  const teams = {}; (data.teams || []).forEach(t => teams[t.name] = { cart: 0, penalty: 0, color: t.color });
  const status = {}; let curPlayer = null, curTeam = null;
  const steps = data.steps || [];
  for (let i = 0; i <= idx && i < steps.length; i++) {
    const s = steps[i];
    if (s.stepType === 'turn') {
      if (teams[s.team]) { teams[s.team].cart++; if (s.verdict === 'fail') teams[s.team].penalty += 5; }
      status[s.player] = s.verdict; curPlayer = s.player; curTeam = s.team;
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
    const pct = Math.min((cart / total) * 100, 92);
    markers += `<div class="tdt-marker" style="left:${pct}%;top:${2 + i * 28}px;color:${t.color}">
      <span class="tdt-mtrain">${_tdtIcon('loco')}</span>
      <span class="tdt-mlbl" style="color:${t.color}">${t.name.toUpperCase()}</span>
      <span class="tdt-mcart">cart ${cart}/${total}</span></div>`;
  });
  return `<div class="tdt-carts">${carts}</div>
    <div class="tdt-loco-front">${_tdtIcon('loco')}</div><div class="tdt-front-lbl">FRONT ▶</div>${markers}`;
}

function _tdtSidebarInner(data, idx) {
  const st = _tdtStateAt(data, idx);
  let html = '';
  (data.teams || []).forEach(t => {
    const pen = st.teams[t.name]?.penalty || 0;
    let rows = '';
    (t.members || []).forEach(m => {
      let s = st.status[m] || 'wait';
      if (m === st.curPlayer) s = 'now';
      const cls = _statCls[s], icid = _statIcon[s];
      const nameCls = s === 'now' ? '' : (s === 'wait' ? 'wait' : 'done');
      rows += `<div class="tdt-row ${s === 'now' ? 'now' : ''}"><div class="tdt-ava" style="background:${t.color}">${(m.slice(0, 2)).toUpperCase()}</div><span class="tdt-rname ${nameCls}">${m}</span><span class="tdt-rstat ${cls}">${_tdtIcon(icid)}</span></div>`;
    });
    html += `<div class="tdt-team-block">
      <div class="tdt-team-bar" style="background:linear-gradient(90deg,${t.color}33,${t.color}11);color:${t.color};border:1px solid ${t.color}44">
        <span class="tdt-tname">${_tdtIcon('loco')} ${t.name.toUpperCase()}</span>
        <span class="tdt-clock">+${String(Math.floor(pen)).padStart(2, '0')}:00<small> pen.</small></span>
      </div>${rows}</div>`;
  });
  html += `<div class="tdt-legend">
    <span><span class="st-pass">${_tdtIcon('check')}</span>passed</span>
    <span><span class="st-fail">${_tdtIcon('x')}</span>refused +5m</span>
    <span><span class="st-skip">${_tdtIcon('skip')}</span>skip</span>
    <span><span class="st-now">${_tdtIcon('target')}</span>hot seat</span>
    <span><span class="st-wait">${_tdtIcon('wait')}</span>waiting</span></div>`;
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
  .tdt-stage-steps{display:flex;flex-direction:column;gap:12px}
  .tdt-step{opacity:0;transform:translateY(20px);transition:opacity .5s,transform .5s}
  .tdt-step.tdt-visible{opacity:1;transform:none}
  @media(prefers-reduced-motion:reduce){.tdt-step{transition:opacity .2s}.tdt-marker{transition:none}}
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
  .tdt-verdict.fail{background:#f8514922;color:#a52016;border:1px solid #f8514955}
  .tdt-verdict.skip{background:#a371f722;color:#6b3fb9;border:1px solid #a371f755}
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
  .st-pass{color:var(--pass)}.st-fail{color:var(--fail)}.st-skip{color:var(--skip)}.st-now{color:var(--now)}.st-wait{color:var(--wait)}
  .tdt-legend{font-size:10px;color:#9c8db0;display:flex;flex-wrap:wrap;gap:6px 10px;margin-top:4px;padding-top:8px;border-top:1px solid #2a1e33}
  .tdt-legend span{display:flex;align-items:center;gap:3px}
  .tdt-controls{display:flex;gap:10px;justify-content:center;align-items:center;padding:14px 0 4px}
  .tdt-btn{background:linear-gradient(135deg,var(--brass),var(--brass2));color:#231204;border:none;padding:10px 20px;border-radius:10px;font-weight:800;cursor:pointer;font-size:13px;box-shadow:0 4px 14px rgba(224,169,74,.35);display:flex;align-items:center;gap:6px}
  .tdt-btn.ghost{background:linear-gradient(135deg,#6b7280,#4b5563);color:#fff}
  .tdt-counter{font-size:12px;color:#c9a86a;font-weight:700}
  .tdt-results-row{display:flex;align-items:center;gap:12px;padding:10px 14px;border-radius:10px;margin-bottom:8px;border-left:4px solid}
  .tdt-rank{font-family:'Bungee';font-size:18px;width:30px;text-align:center}
  </style>`;
}

function _shell(content, ep) {
  const data = ep.truthOrDareTrain || {};
  return `${_tdtCSS()}<div class="tdt-shell">
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

// ── SCREEN 1: title card ──
export function rpBuildTDTTitleCard(ep) {
  const data = ep.truthOrDareTrain; if (!data) return '';
  const teamsHtml = (data.teams || []).map(t =>
    `<div class="tdt-cartcard" style="padding:12px 14px">
      <div class="tdt-cart-team" style="background:${t.color}22;color:${t.color};border:1px solid ${t.color}55;margin-bottom:8px">${_tdtIcon('loco')} ${t.name.toUpperCase()}</div>
      <div style="font-size:12px;color:#c9b48f;line-height:1.6">${(t.members || []).join(' · ')}</div></div>`).join('');
  return _shell(`<div class="tdt-body"><div><div class="tdt-cartcard" style="padding:16px">
      <div style="font-family:'Bungee';color:var(--brass);font-size:15px;margin-bottom:8px">ALL ABOARD</div>
      <div style="font-size:13px;color:#e8d6b4;line-height:1.6">The train pulls out of the station. ${(data.teams||[]).length} teams, one gauntlet of carts, and a Truth or Dare waiting in every one. Bold players will dare. Cautious players will pick truth. And the moment a prompt hits a nerve — vanity, loyalty, a secret — even the toughest camper might just… refuse.</div>
    </div><div style="height:12px"></div>${teamsHtml}</div>
    <div class="tdt-side"><div class="tdt-side-h">Live status — by team</div><div id="tdt-sidebar-inner">${_tdtSidebarInner(data, -1)}</div></div></div>`, ep);
}

// ── SCREEN 2: the race (main reveal) ──
export function rpBuildTDTRace(ep) {
  const data = ep.truthOrDareTrain; if (!data) return '';
  const steps = data.steps || [];
  const suffix = 'race';
  const stepCards = steps.map((s, i) => {
    if (s.stepType === 'turn') {
      const vcls = s.verdict === 'fail' ? 'fail' : (s.verdict === 'skip' ? 'skip' : 'pass');
      const vic = s.verdict === 'fail' ? 'x' : (s.verdict === 'skip' ? 'skip' : 'check');
      const vtxt = s.verdict === 'fail' ? `REFUSED${s.quote ? ` — “${s.quote}”` : ''}`
        : s.verdict === 'skip' ? 'SKIP PASS — waved through the cart'
        : `DONE${s.quote ? ` — “${s.quote}”` : ''}`;
      const beat = s.hitsWeakSpot && s.verdict === 'fail'
        ? `<b>${s.player}</b> won't do it — <b>weak spot hit</b>. ${s.team} takes a <b>+5:00 penalty</b>.`
        : s.verdict === 'pass' && s.hitsWeakSpot ? `<b>${s.player}</b> grits through the one thing ${_pron(s.player).sub} swore ${_pron(s.player).sub} never would. The cart erupts.`
        : s.verdict === 'skip' ? `The skip pass saves <b>${s.player}</b> — ${s.team} rolls on with no risk.`
        : `<b>${s.player}</b> clears the cart. ${s.team} advances.`;
      return `<div class="tdt-step" id="tdt-step-${suffix}-${i}"><div class="tdt-cartcard">
        <div class="tdt-cart-head"><span class="tdt-cart-no">CART ${s.cart} — HOT SEAT</span>
          <span class="tdt-cart-team" style="background:${s.color}22;color:${s.color};border:1px solid ${s.color}55">${_tdtIcon('loco')} ${s.team.toUpperCase()}</span></div>
        <div class="tdt-window"><div class="tdt-streak"></div><div class="tdt-streak" style="animation-delay:.4s;background:radial-gradient(ellipse,rgba(120,200,255,.8),transparent 70%)"></div><div class="tdt-streak" style="animation-delay:.75s;background:radial-gradient(ellipse,rgba(255,120,180,.8),transparent 70%)"></div></div>
        <div class="tdt-duel"><div class="tdt-hotseat"><div class="tdt-portrait" style="background:${s.color}">${s.player.slice(0,2).toUpperCase()}</div><div class="tdt-hs-name">${s.player}</div><div class="tdt-hs-tag">${s.team}</div></div>
          <div class="tdt-card"><div class="tdt-kind ${s.kind}">${_tdtIcon(s.kind === 'dare' ? 'dare' : 'truth')} ${s.kind.toUpperCase()}</div>
            <div class="tdt-prompt">${s.player} is asked to ${s.prompt}.</div>
            <span class="tdt-verdict ${vcls}">${_tdtIcon(vic)} ${vtxt}</span></div></div>
        <div class="tdt-beat">${beat}</div></div></div>`;
    }
    // social event card
    const avas = (s.players || []).slice(0, 2).map(p => `<div class="tdt-social-ava" style="background:${s.color || '#a371f7'}">${p.slice(0,2).toUpperCase()}</div>`).join('');
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
  const ranked = (data.teams || []).slice().sort((a, b) => a.totalTime - b.totalTime);
  const rows = ranked.map((t, i) => {
    const isWin = t.name === data.winner, isLose = t.name === data.loser;
    const tag = isWin ? 'WINS IMMUNITY' : isLose ? 'GOES TO TRIBAL' : 'SAFE';
    const tagCol = isWin ? 'var(--pass)' : isLose ? 'var(--fail)' : '#c9b48f';
    return `<div class="tdt-results-row" style="border-color:${t.color};background:${t.color}14">
      <span class="tdt-rank" style="color:${t.color}">${i + 1}</span>
      <div style="flex:1"><div style="font-weight:800;font-size:14px;color:${t.color};display:flex;align-items:center;gap:6px">${_tdtIcon('loco')} ${t.name.toUpperCase()}</div>
        <div style="font-size:11px;color:#c9b48f;margin-top:2px">${t.penalties} min in penalties · total time ${t.totalTime} min${t.skipUsed ? ' · used skip pass' : ''}</div></div>
      <span style="font-weight:800;font-size:11px;letter-spacing:1px;color:${tagCol}">${tag}</span></div>`;
  }).join('');
  return _shell(`<div class="tdt-body"><div><div class="tdt-cartcard" style="padding:16px">
      <div style="font-family:'Bungee';color:var(--brass);font-size:15px;margin-bottom:10px">FRONT OF THE TRAIN</div>${rows}
      <div style="font-size:12px;color:#c9b48f;margin-top:8px;line-height:1.5">Fastest team to the front — fewest refusals — takes immunity. The slowest team heads to tribal council.</div>
    </div></div>
    <div class="tdt-side"><div class="tdt-side-h">Final status — by team</div><div id="tdt-sidebar-inner">${_tdtSidebarInner(data, (data.steps || []).length - 1)}</div></div></div>`, ep);
}
