// ══════════════════════════════════════════════════════════════════════
// disadvantage-vote.js — "The Disadvantage Vote" (DC4 twist)
//
// Before the immunity challenge, the field gathers at the elimination area and
// each player pleads their case — "why NOT me" / "who SHOULD get it" — then
// everyone votes to hand ONE player a disadvantage in that night's challenge.
// A player can drop a damaging reveal mid-campaign that swings the room. The
// most-voted player is handicapped (~35% performance hit), which can cost them
// immunity. Winner is re-derived from the challenge scores afterward.
//
//   simulateDisadvantageVote(ep)   — run the campaign + reveal + vote (pre-challenge)
//   applyDisadvantagePenalty(ep)   — dock the target's challenge score, re-derive winner
//   rpBuildDisadvantageTrial(ep)   — VP screen (+ disReveal handlers)
// ══════════════════════════════════════════════════════════════════════
import { gs, players, seasonConfig } from './core.js';
import { pStats, pronouns } from './players.js';
import { addBond, getBond, getPerceivedBond } from './bonds.js';

function archOf(n) { return players.find(p => p.name === n)?.archetype || 'floater'; }
// how threatening a player is to win the challenge + the endgame (self-contained)
function threatOf(n) { const s = pStats(n); return s.physical * 0.3 + s.strategic * 0.3 + s.mental * 0.2 + s.social * 0.2; }
function pick(a) { return a.length ? a[Math.floor(Math.random() * a.length)] : null; }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function noise(m) { return (Math.random() - 0.5) * 2 * m; }
function bumpPop(n, d) { if (!gs.popularity) gs.popularity = {}; gs.popularity[n] = (gs.popularity[n] || 0) + d; }
function hostName() { return seasonConfig?.host || 'Chris'; }
function canReveal(n) {
  const a = archOf(n), s = pStats(n);
  if (['villain', 'mastermind', 'schemer', 'perceptive-player'].includes(a)) return true;
  return s.strategic >= 6 || s.intuition >= 7;
}

let _usedTpl;
function draw(pool, ...ctx) {
  const built = pool.map(f => f(...ctx));
  const strip = (t) => (gs.activePlayers || []).reduce((s, n) => s.split(n).join('~'), t);
  const fresh = built.filter(t => !_usedTpl.has(strip(t)));
  const from = fresh.length ? fresh : built;
  const chosen = from[Math.floor(Math.random() * from.length)];
  _usedTpl.add(strip(chosen));
  return chosen;
}

// ── grounded facts, pulled from the ACTUAL simulation state ──
function _gatherFacts(active) {
  const AL = (gs.namedAlliances || []).filter(a => a && a.active !== false && Array.isArray(a.members) && a.members.filter(m => active.includes(m)).length >= 2);
  const recOf = (n) => gs.chalRecord?.[n] || { wins: 0, podiums: 0, bombs: 0 };
  const f = {};
  active.forEach(n => {
    const s = pStats(n), r = recOf(n);
    const myAls = AL.filter(a => a.members.includes(n));
    const allies = [...new Set([
      ...myAls.flatMap(a => a.members).filter(m => m !== n && active.includes(m)),
      ...active.filter(m => m !== n && getPerceivedBond(n, m) >= 5),
    ])];
    const sh = (gs.showmances || []).find(x => x.phase !== 'broken-up' && Array.isArray(x.players) && x.players.includes(n) && x.players.some(p => p !== n && active.includes(p)));
    const partner = sh ? sh.players.find(p => p !== n && active.includes(p)) : null;
    // betrayals BY n (n flipped on their own alliance) and AGAINST n (n was the one written up)
    const betrayedBy = [], betrayedAgainst = [];
    AL.forEach(a => (a.betrayals || []).forEach(b => {
      if (b.player === n && active.includes(b.votedFor)) betrayedBy.push({ victim: b.votedFor, ep: b.ep, alliance: a.name });
      if (b.votedFor === n && active.includes(b.player)) betrayedAgainst.push({ betrayer: b.player, ep: b.ep, alliance: a.name });
    }));
    const threat = s.physical * 0.26 + s.strategic * 0.28 + s.mental * 0.16 + s.social * 0.14
      + r.wins * 1.4 + r.podiums * 0.45 + allies.length * 0.5 + (gs.popularity?.[n] || 0) * 0.05 + noise(0.5);
    f[n] = { stats: s, rec: r, allies, partner, betrayedBy, betrayedAgainst, threat, alliances: myAls, showmance: !!partner };
  });
  return f;
}

// real, specific reasons a player is a threat (never fabricated).
// Each string is a VERB PHRASE so callers can prepend a name cleanly:
// `${name} ${reason}` → "Bowie has already won 2 immunities".
function _threatReasons(n, f) {
  const F = f[n], out = [];
  if (F.rec.wins >= 1) out.push({ w: 1.5 + F.rec.wins * 0.9, s: `has already won ${F.rec.wins} immunit${F.rec.wins > 1 ? 'ies' : 'y'}`, tag: 'wins' });
  if (F.alliances.length && F.allies.length >= 2) out.push({ w: 2.6, s: `has ${F.alliances[0].name} voting as a bloc — ${F.allies.length + 1} strong`, tag: 'alliance' });
  else if (F.allies.length >= 2) out.push({ w: 2, s: `has a tight ${F.allies.length + 1}-person bloc nobody's cracked`, tag: 'bloc' });
  if (F.partner) out.push({ w: 2.3, s: `is one half of the ${F.partner} pact nobody's addressed`, tag: 'showmance' });
  if (F.stats.strategic >= 7) out.push({ w: 1.9, s: `has been steering the strategy all season`, tag: 'strategic' });
  if (F.stats.physical >= 7) out.push({ w: 1.9, s: `is a physical wrecking ball who wins these outright`, tag: 'physical' });
  if (F.stats.social >= 8) out.push({ w: 1.5, s: `has a friend in every corner of this jury`, tag: 'social' });
  if (F.rec.podiums >= 2 && F.rec.wins < 1) out.push({ w: 1.6, s: `keeps landing on the podium — a win's coming`, tag: 'podium' });
  if (!out.length) out.push({ w: 1, s: `is the most dangerous player left standing`, tag: 'general' });
  return out.sort((a, b) => b.w - a.w);
}
// grounded self-defense: a player's real case for why NOT them.
// Templates get (name, suggestName, suggestReason) — `s` is a bare NAME, `sr` a verb phrase.
function _defensePlea(n, f, active) {
  const F = f[n];
  const suggest = active.filter(m => m !== n && !F.allies.includes(m)).sort((a, b) => f[b].threat - f[a].threat)[0] || null;
  const sr = suggest ? _threatReasons(suggest, f)[0].s : '';
  const goat = F.rec.wins === 0 && F.allies.length < 2 && !F.partner;
  let pool;
  if (goat) pool = [
    (x, s) => `${x} keeps it simple. "Be honest — I'm the person every one of you would love to sit next to at the end. No wins, no numbers, no jury locked up. Handing ME the anchor is a gift to whoever I'd lose to.${s ? ` If it's got to be anyone, it's ${s}.` : ''}"`,
    (x, s) => `"What does slowing me down even buy you?" ${x} asks the circle. "I'm not the one anybody's scared to face at the vote. Spend the disadvantage where it actually changes the math.${s ? ` On ${s}.` : ''}"`,
    (x, s, r) => `${x} spreads their hands. "I'm the easy vote and we all know it — nobody in this game is losing sleep over me. Wasting the anchor here just protects the person who'd beat you.${s ? ` And that's ${s}, who ${r}.` : ''}"`,
    (x, s) => `"Give me the disadvantage and you've done the winners a favor," ${x} says flatly. "I've got nothing locked up — no bloc, no immunity run, nothing. I'm not the danger in this circle.${s ? ` ${s} is.` : ''}"`,
  ];
  else if (F.rec.wins === 0) pool = [
    (x, s) => `${x} makes the case plainly. "I haven't won a single immunity out here — not one. Disadvantage me and you've thrown it away, because I was never the one cruising to the end.${s ? ` ${s} was.` : ''}"`,
    (x, s, r) => `"Look at the record," ${x} says. "Zero immunity wins next to my name. If you're worried about who runs the table, it isn't me — it's ${s || 'someone else'}${s && r ? `, who ${r}` : ''}."`,
    (x, s) => `${x} shakes their head. "You want to spend the anchor on someone who hasn't won a challenge all season? Be my guest — but you're aiming at the wrong person.${s ? ` The right one is ${s}.` : ''}"`,
    (x, s) => `"Point at the wins," ${x} says. "I don't have any. That's the whole argument. Slowing me down changes nothing about who's actually built to take this.${s ? ` Look at ${s}.` : ''}"`,
  ];
  else pool = [
    (x, s) => `${x} doesn't pretend. "Sure, I've had a good run — but a 35% handicap doesn't stop me and deep down you know it. Waste it on me and you've solved nothing.${s ? ` The person you actually have to slow down is ${s}.` : ''}"`,
    (x, s) => `"Put my name up if you want," ${x} says evenly. "I'll grind through it anyway. If you want the disadvantage to decide something, it goes on ${s || 'the real threat'} — not the person who fights through it regardless."`,
    (x, s) => `${x} meets every eye in the circle. "I'm not going to insult you and say I'm harmless. But an anchor won't save you from me — it'll just waste a shot you could've used on ${s || 'a bigger problem'}."`,
    (x, s) => `"Fine, I'm a threat — I'll own it," ${x} says. "But so is ${s || 'half this circle'}, and a handicap on me is a handicap on the person hardest to actually stop. Aim smarter."`,
  ];
  return { suggest, text: draw(pool, n, suggest, sr) };
}

// ══════════════════════════════════════════════════════════════════════
export function simulateDisadvantageVote(ep) {
  const active = gs.activePlayers.filter(p => p !== gs.exileDuelPlayer);
  if (active.length < 3) return;                       // needs a real room to vote
  _usedTpl = new Set();
  const H = hostName();
  const f = _gatherFacts(active);
  const ranked = active.slice().sort((a, b) => f[b].threat - f[a].threat);

  // pressure the debate applies toward each player getting the disadvantage
  const pressure = {}; active.forEach(n => pressure[n] = 0);
  const debate = [];
  const bump = (n, d) => pressure[n] = (pressure[n] || 0) + d;
  const usedReasonTags = new Set();
  const reasonOf = (T) => { const rs = _threatReasons(T, f); const fresh = rs.find(r => !usedReasonTags.has(r.tag)) || rs[0]; usedReasonTags.add(fresh.tag); return fresh.s; };

  // ── 1) SELF-DEFENSE PLEAS — each player argues why it shouldn't be THEM (grounded) ──
  ranked.forEach(n => {           // threats plead hardest, so they go first
    const plea = _defensePlea(n, f, active);
    debate.push({ type: 'plea', speaker: n, target: plea.suggest, text: plea.text });
    if (plea.suggest) bump(plea.suggest, 0.7);
  });

  // ── 2) THE CLASH — accusations, rebuttals, disputes, grounded reveals ──
  const usedInClash = new Set();
  const accuserFor = (T) => {
    const pool = active.filter(n => n !== T && !f[T].allies.includes(n) && !usedInClash.has(n));
    const src = pool.length ? pool : active.filter(n => n !== T);
    return src.slice().sort((a, b) => {
      const ga = f[a].betrayedAgainst.some(x => x.betrayer === T) ? 4 : 0;  // T betrayed a → a wants revenge
      const gb = f[b].betrayedAgainst.some(x => x.betrayer === T) ? 4 : 0;
      return (gb - getPerceivedBond(b, T)) - (ga - getPerceivedBond(a, T));
    })[0];
  };
  const focusN = active.length >= 7 ? 2 : 1;
  const focus = ranked.slice(0, focusN);
  focus.forEach(T => {
    const A = accuserFor(T); if (!A || A === T) return;
    usedInClash.add(A); usedInClash.add(T);
    const Agrudge = f[A].betrayedAgainst.find(x => x.betrayer === T);   // A was betrayed by T
    const rsn = reasonOf(T);

    // ACCUSE — A argues T should carry the disadvantage, citing REAL evidence
    debate.push({ type: 'accuse', speaker: A, target: T,
      text: Agrudge
        ? draw([
          (a, t, r, al) => `${a} doesn't wait to be called on. "${t} wrote my name at the ${al} vote — so forgive me if I don't hand ${t} a clean shot at the money too. And ${t} ${r}. It's ${t}."`,
          (a, t, r, al) => `"Let's be honest about who's dangerous," ${a} says, eyes on ${t}. "${t} already burned me at ${al}. And now ${t} ${r}. Slow ${t} down, or you're all getting played like I did."`,
        ], A, T, rsn, Agrudge.alliance)
        : draw([
          (a, t, r) => `${a} won't dance around it. "${t} ${r}. You don't hand the disadvantage to the person least likely to win — you hand it to the person most likely. That's ${t}."`,
          (a, t, r) => `"I'll say what everyone's thinking," ${a} presses. "${t} ${r}. If ${t} runs this clean, the rest of us are playing for second."`,
          (a, t, r) => `${a} points across the circle. "We're all doing the same math. ${t} ${r} — that's not a friend you protect, that's a problem you slow down."`,
        ], A, T, rsn) });
    bump(T, 2.4 + f[A].stats.social * 0.06);

    // REBUT / REVEAL — T defends themselves first, THEN counters with real dirt
    const counter = _counterTarget(T, A, f, active);
    debate.push({ type: counter.reveal ? 'reveal' : 'rebut', speaker: T, target: counter.name, text: counter.text });
    bump(counter.name, counter.reveal ? 2.6 : 1.6);
    bump(T, -0.9);
    if (counter.reveal && counter.expose) {
      const wronged = counter.expose.victim;
      if (wronged && wronged !== T) { addBond(wronged, counter.name, -2.5); bump(counter.name, 1); }
      addBond(T, counter.name, -1);
    }

    // DISPUTE / INTERJECT — a fresh third party weighs in
    const ally = f[T].allies.find(n => active.includes(n) && !usedInClash.has(n));
    const rivalOfA = active.find(n => n !== A && n !== T && !usedInClash.has(n) && getPerceivedBond(n, A) <= -1);
    if (ally && Math.random() < 0.55) {
      usedInClash.add(ally);
      debate.push({ type: 'interject', speaker: ally, target: A,
        text: draw([
          (p, t, a) => `${p} jumps in for ${t}. "You're really going to pretend YOU'RE not the danger here, ${a}? You pointed at ${t} the second the heat came your way. Nobody's buying it."`,
          (p, t, a) => `"Convenient," ${p} says, siding with ${t}. "${a} needs everyone staring at ${t} instead of at ${a}. Look closer at who's actually built to win this thing."`,
        ], ally, T, A) });
      bump(A, 1.1); bump(T, -0.4);
    } else if (rivalOfA) {
      usedInClash.add(rivalOfA);
      debate.push({ type: 'dispute', speaker: rivalOfA, target: A,
        text: draw([
          (r, a) => `${r} rounds on ${a}. "Don't play innocent. You've had blood on your hands all game, ${a} — you just talk pretty about it. If we're slowing down threats, your name belongs in that hat too."`,
          (r, a) => `"That's rich coming from you, ${a}," ${r} snaps. "We both know how you got this far. Point all you want — plenty of us would happily hand YOU the anchor instead."`,
        ], rivalOfA, A) });
      bump(A, 1.3);
    }
  });

  // ── THE VOTE — grounded, moved by the debate + real relationships ──
  const votes = {}, voteReasons = {};
  active.forEach(voter => {
    const cands = active.filter(n => n !== voter);
    const scored = cands.map(t => ({ t, w: _vw(voter, t) })).sort((a, b) => b.w - a.w);
    const voted = scored[0].t;
    votes[voter] = voted;
    voteReasons[voter] = _voteReason(voter, voted, f);
  });
  function _vw(voter, t) {
    const pb = getPerceivedBond(voter, t);
    const grudge = f[voter].betrayedAgainst.some(x => x.betrayer === t) ? 3.2 : 0;
    return f[t].threat * 0.5
      + (pressure[t] || 0) * 0.6            // the debate actually moved the room
      + Math.max(0, -pb) * 0.6
      - Math.max(0, pb) * 0.6               // spare a friend / jury ally
      + grudge
      + noise(1.1);
  }

  // tally + winner (ties → highest threat among the tied)
  const tally = {}; active.forEach(n => tally[n] = 0);
  Object.values(votes).forEach(v => tally[v] = (tally[v] || 0) + 1);
  const maxV = Math.max(...active.map(n => tally[n]));
  const tied = active.filter(n => tally[n] === maxV);
  const target = tied.slice().sort((a, b) => f[b].threat - f[a].threat)[0];

  Object.entries(votes).forEach(([voter, voted]) => { if (voted === target) addBond(target, voter, -1); });
  bumpPop(target, -0.3);
  gs._disadvantage = { target, factor: 0.65 };

  const tw = (ep.twists || []).find(t => t.type === 'disadvantage-vote');
  const trial = {
    host: H, target, tally, votes, voteReasons, debate,
    order: active.slice().sort((a, b) => tally[b] - tally[a]),
    margin: maxV, wasTie: tied.length > 1,
    flipped: null, penaltyBefore: null, penaltyAfter: null,
  };
  if (tw) tw.trial = trial; else ep._disadvantageTrial = trial;
  ep.disadvantageTrial = trial;
  return trial;

  // ── T defends themselves, THEN counters: expose a REAL betrayal A committed, or point at A's real threat ──
  function _counterTarget(T, A, facts, activeP) {
    const def = facts[T].rec.wins === 0 ? `I haven't won a thing out here` : `I'm as beatable as anyone in this circle`;
    const Def = def.charAt(0).toUpperCase() + def.slice(1);
    // does A have a real betrayal on record? (grounded reveal)
    const aBetrayal = facts[A].betrayedBy[0];
    if (aBetrayal && Math.random() < 0.85) {
      addBond(T, A, -0.5);
      return {
        name: A, reveal: true, expose: aBetrayal,
        text: draw([
          (t, a, vic, al, d) => `${t} doesn't flinch. "${d} — but let's talk about ${a}. ${a} sat in ${al} and wrote ${vic}'s name after swearing loyalty to ${vic}'s face. THAT'S who's lecturing you about threats. Want the anchor to matter? Put it on ${a}."`,
          (t, a, vic, al, d) => `"Funny ${a} brings up trust," ${t} shoots back. "${vic} trusted ${a} too — right up until ${a} flipped at ${al} and buried ${vic}. ${d}. ${a} is the most dangerous liar in this circle, not me."`,
          (t, a, vic, al, d) => `${t} turns to the group. "Before you write my name — ask ${a} about ${al}. Ask whose name ${a} wrote after promising the opposite. ${vic} knows. Now you all do. ${d}."`,
        ], T, A, aBetrayal.victim, aBetrayal.alliance, Def),
      };
    }
    // otherwise: defend, then counter with A's REAL threat profile
    const aRsn = _threatReasons(A, facts)[0].s;
    return {
      name: A, reveal: false, expose: null,
      text: draw([
        (t, a, r, d) => `${t} isn't taking it. "${d}. Look at ${a} — ${a} ${r}. You're pointing at me to keep the target off the person actually built to win. That's ${a}, not me."`,
        (t, a, r, d) => `"${d}," ${t} counters. "${a}, on the other hand? ${a} ${r}. If we're clipping threats, ${a} goes first."`,
        (t, a, r, d) => `${t} flips it back. "${d}, and everybody here knows it. But ${a} ${r}. Don't let the finger-pointing fool you about who the real danger is."`,
      ], T, A, aRsn, Def),
    };
  }

  // ── grounded, varied one-line reason for a vote ──
  function _voteReason(voter, voted, facts) {
    const F = facts[voted];
    if (facts[voter].betrayedAgainst.some(x => x.betrayer === voted)) return pick([`${voted} flipped on ${voter} earlier — this one's personal`, `settling up with ${voted} for that betrayal`, `${voter} never forgot what ${voted} did`]);
    if (F.rec.wins >= 1) return pick([`${voted} has already won ${F.rec.wins} — can't risk a clean run`, `not letting the ${F.rec.wins}-time winner off the hook`, `${voted}'s the proven threat — the anchor has to land there`]);
    if (F.partner) return pick([`breaking up the ${voted}-and-${F.partner} pair`, `${voted} and ${F.partner} run too deep to ignore`]);
    if (F.alliances.length && F.allies.length >= 2) return pick([`taking the air out of ${F.alliances[0].name}`, `${voted}'s got the numbers — slow the bloc down`]);
    if (getPerceivedBond(voter, voted) < 0) return pick([`no love lost — ${voter} was never protecting ${voted}`, `${voter} and ${voted} were never friends anyway`]);
    return pick([`${voted} is the most dangerous player left`, `when in doubt, clip the biggest threat`]);
  }
}

// ══════════════════════════════════════════════════════════════════════
// Applied AFTER the challenge scores are known: dock the target ~35% of their
// margin above the field, then re-derive the immunity winner if it flips.
export function applyDisadvantagePenalty(ep) {
  const tw = (ep.twists || []).find(t => t.type === 'disadvantage-vote');
  const trial = tw?.trial || ep.disadvantageTrial;
  const target = trial?.target;
  if (!target || !ep.chalMemberScores) return;
  const names = Object.keys(ep.chalMemberScores);
  if (names.length < 2 || ep.chalMemberScores[target] == null) return;

  const scoreOf = (n) => ep.chalMemberScores[n];
  const preRank = names.slice().sort((a, b) => scoreOf(b) - scoreOf(a));
  const oldWinner = ep.immunityWinner;
  // Only safe to re-derive a single winner for a standard single-winner challenge
  const standard = oldWinner && preRank[0] === oldWinner && !(ep.extraImmune && ep.extraImmune.length);

  const min = Math.min(...names.map(scoreOf));
  const before = scoreOf(target);
  const after = Math.round((min + (before - min) * (trial.factor || 0.65)) * 10) / 10;
  ep.chalMemberScores[target] = after;
  trial.penaltyBefore = Math.round(before * 10) / 10;
  trial.penaltyAfter = after;

  const postRank = names.slice().sort((a, b) => scoreOf(b) - scoreOf(a));
  ep.chalPlacements = postRank;
  if (standard) {
    const newWinner = postRank[0];
    if (newWinner !== oldWinner) {
      ep.immunityWinner = newWinner;
      trial.flipped = { from: oldWinner, to: newWinner };
    }
  }
  return trial;
}

// ══════════════════════════════════════════════════════════════════════
// VP — "The Disadvantage Trial" (elimination-area, neon scales of justice)
// ══════════════════════════════════════════════════════════════════════
function slugOf(name) { return players.find(p => p.name === name)?.slug || name.toLowerCase().replace(/\s+/g, '-'); }
function av(name, size = 24) {
  return `<img src="assets/avatars/${slugOf(name)}.png" alt="${name}" style="width:${size}px;height:${size}px;border-radius:50%;object-fit:cover;flex-shrink:0;border:2px solid #f0c674;background:#1a130a" onerror="this.style.visibility='hidden'">`;
}
function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

function _css() {
  return `<style>
  @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@600;800&family=Chakra+Petch:wght@400;600;700&display=swap');
  .dvt-wrap{--gold:#f0c674;--gold2:#b8892f;--ink:#0b0a12;--panel:rgba(22,16,30,.86);--flame:#ff8c2d;--pink:#ff2d95;--blue:#2de2ff;--txt:#efe6d8;--dim:#b6a894;
    max-width:1080px;margin:0 auto;font-family:'Chakra Petch',system-ui,sans-serif;color:var(--txt);position:relative;overflow:visible;min-height:520px;border-radius:10px;
    background:radial-gradient(700px 320px at 50% -6%,#2a1748,#160d24 55%,#0b0a12 100%)}
  .dvt-wrap *{box-sizing:border-box}
  .dvt-inner{padding:16px 0 130px;position:relative;z-index:2}
  .dvt-embers{position:absolute;inset:0;z-index:0;pointer-events:none;overflow:hidden;border-radius:10px}
  .dvt-ember{position:absolute;bottom:-10px;width:4px;height:4px;border-radius:50%;background:var(--flame);box-shadow:0 0 8px var(--flame);opacity:.6;animation:dvtRise 7s linear infinite}
  @keyframes dvtRise{to{transform:translateY(-560px) translateX(20px);opacity:0}}

  .dvt-title{text-align:center;padding:14px 18px 6px;position:relative;z-index:2}
  .dvt-kick{font-family:'Chakra Petch';letter-spacing:4px;font-size:11px;color:var(--dim);text-transform:uppercase}
  .dvt-scales{width:74px;height:74px;margin:6px auto 2px;filter:drop-shadow(0 0 14px rgba(240,198,116,.4))}
  .dvt-big{font-family:'Cinzel';font-weight:800;font-size:clamp(26px,5.4vw,46px);letter-spacing:1px;margin:2px 0;color:var(--gold);
    text-shadow:0 2px 0 #000,0 0 26px rgba(240,198,116,.35)}
  .dvt-sub{font-size:13px;color:var(--txt);max-width:600px;margin:6px auto 0;line-height:1.5;opacity:.92}
  .dvt-host{margin:12px auto 0;display:block;width:fit-content;font-family:'Chakra Petch';font-size:12.5px;color:var(--gold);
    border:1px dashed rgba(240,198,116,.5);border-radius:8px;padding:9px 15px;background:rgba(240,198,116,.06);max-width:680px;line-height:1.55}

  .dvt-grid{display:grid;grid-template-columns:1fr 290px;gap:16px;padding:12px 18px}
  @media(max-width:820px){.dvt-grid{grid-template-columns:1fr}}
  .dvt-card{border:1px solid rgba(240,198,116,.16);border-left:4px solid var(--gold2);border-radius:9px;padding:10px 12px;margin:9px 0;background:var(--panel);box-shadow:0 4px 14px rgba(0,0,0,.4);animation:dvtRise2 .34s both}
  @keyframes dvtRise2{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}
  .dvt-card .row{display:flex;align-items:center;gap:8px;margin-bottom:6px;flex-wrap:wrap}
  .dvt-b{font-family:'Chakra Petch';font-size:9.5px;font-weight:700;letter-spacing:1px;text-transform:uppercase;padding:2px 8px;border-radius:5px;border:1px solid}
  .dvt-b.plea{background:rgba(240,198,116,.1);color:var(--gold);border-color:rgba(240,198,116,.35)}
  .dvt-card.plea{border-left-color:var(--gold2)}
  .dvt-b.accuse{background:rgba(255,140,45,.15);color:var(--flame);border-color:#ff8c2d66}
  .dvt-b.rebut{background:rgba(45,226,255,.12);color:var(--blue);border-color:#2de2ff55}
  .dvt-b.interject{background:rgba(125,255,77,.12);color:#7dff4d;border-color:#7dff4d55}
  .dvt-b.dispute{background:rgba(255,45,149,.14);color:var(--pink);border-color:#ff2d9566}
  .dvt-b.reveal{background:rgba(255,45,149,.2);color:#ff5aa8;border-color:#ff2d9588}
  .dvt-b.vote{background:rgba(240,198,116,.14);color:var(--gold);border-color:rgba(240,198,116,.4)}
  .dvt-card.accuse{border-left-color:var(--flame)}
  .dvt-card.rebut{border-left-color:var(--blue)}
  .dvt-card.interject{border-left-color:#7dff4d}
  .dvt-card.dispute{border-left-color:var(--pink);box-shadow:0 0 14px rgba(255,45,149,.12)}
  .dvt-card.reveal{border-left-color:var(--pink);box-shadow:0 0 20px rgba(255,45,149,.22);animation:dvtShake .5s both}
  @keyframes dvtShake{0%{opacity:0;transform:translateX(-14px)}30%{transform:translateX(8px)}55%{transform:translateX(-5px)}100%{opacity:1;transform:none}}
  .dvt-card.vote{border-left-color:var(--gold)}
  .dvt-vr{font-size:11px;color:var(--dim);font-style:italic;margin-top:3px}
  .dvt-card .txt{font-size:13px;line-height:1.5;color:#ece2d2}
  .dvt-card .txt b{color:#fff}
  .dvt-verdict{text-align:center;font-family:'Cinzel';font-weight:800;font-size:clamp(20px,4.4vw,34px);color:#0b0a12;letter-spacing:1px;margin:14px 0 6px;
    background:linear-gradient(180deg,var(--gold),var(--gold2));border-radius:10px;padding:12px;box-shadow:0 6px 0 rgba(0,0,0,.4),0 0 30px rgba(240,198,116,.4)}
  .dvt-effect{text-align:center;font-size:13px;color:var(--flame);font-weight:700;margin-top:8px;letter-spacing:.5px}
  .dvt-effect .flip{color:var(--pink)}

  .dvt-side{position:sticky;top:12px;align-self:start;border:1px solid rgba(240,198,116,.2);border-radius:14px;overflow:hidden;background:linear-gradient(180deg,rgba(28,18,44,.94),rgba(12,10,22,.94));box-shadow:0 6px 20px rgba(0,0,0,.5)}
  .dvt-sh{font-family:'Cinzel';font-weight:800;letter-spacing:1px;font-size:15px;color:var(--gold);text-align:center;padding:10px 8px 5px;background:linear-gradient(180deg,rgba(240,198,116,.15),transparent)}
  .dvt-sgoal{text-align:center;font-size:9.5px;letter-spacing:2px;color:var(--dim);text-transform:uppercase;margin-bottom:6px}
  .dvt-tl{padding:2px 12px 12px}
  .dvt-trow{display:flex;align-items:center;gap:8px;margin:8px 0}
  .dvt-trow .nm{flex:1;font-weight:700;font-size:12.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .dvt-trow.hit .nm{color:var(--flame)}
  .dvt-pips{display:flex;gap:3px}
  .dvt-pip{width:9px;height:14px;border-radius:2px;background:#2a2036;border:1px solid #43324f}
  .dvt-pip.on{background:linear-gradient(180deg,var(--flame),#c85a10);border-color:var(--flame);box-shadow:0 0 6px rgba(255,140,45,.5)}
  .dvt-tct{font-family:'Cinzel';font-weight:800;font-size:14px;color:var(--gold);min-width:16px;text-align:right}

  .dvt-ctrl{position:fixed;left:50%;transform:translateX(-50%);bottom:16px;z-index:40;display:flex;gap:10px;align-items:center;background:#160d24;border:2px solid var(--gold2);border-radius:30px;padding:7px 14px;box-shadow:0 6px 18px rgba(0,0,0,.6)}
  .dvt-btn{background:linear-gradient(180deg,var(--gold),#a8781f);color:#160d24;border:none;font-weight:700;font-family:'Chakra Petch';padding:8px 16px;border-radius:20px;cursor:pointer;font-size:12px;letter-spacing:.5px}
  .dvt-btn.ghost{background:transparent;color:var(--gold);border:1px solid rgba(240,198,116,.5)}
  .dvt-cnt{font-family:'Chakra Petch';font-size:12px;color:var(--dim);min-width:56px;text-align:center}
  .dvt-done{display:none;text-align:center;font-size:12px;color:var(--gold);margin-top:10px;font-family:'Chakra Petch'}
  @media(prefers-reduced-motion:reduce){.dvt-ember,.dvt-card{animation:none!important}}
  </style>`;
}

function _scalesSVG() {
  return `<svg class="dvt-scales" viewBox="0 0 100 100" aria-label="scales of justice">
    <line x1="50" y1="14" x2="50" y2="70" stroke="#f0c674" stroke-width="3"/>
    <line x1="22" y1="26" x2="78" y2="26" stroke="#f0c674" stroke-width="3"/>
    <circle cx="50" cy="12" r="5" fill="#f0c674"/>
    <path d="M22 26 L12 46 L32 46 Z" fill="none" stroke="#f0c674" stroke-width="2.5"/>
    <path d="M78 26 L68 46 L88 46 Z" fill="none" stroke="#f0c674" stroke-width="2.5"/>
    <line x1="22" y1="26" x2="22" y2="20" stroke="#f0c674" stroke-width="2"/>
    <line x1="78" y1="26" x2="78" y2="20" stroke="#f0c674" stroke-width="2"/>
    <rect x="38" y="70" width="24" height="6" rx="2" fill="#f0c674"/>
    <rect x="30" y="78" width="40" height="6" rx="2" fill="#b8892f"/>
  </svg>`;
}

function _shell(inner) {
  const embers = Array.from({ length: 14 }).map((_, i) =>
    `<div class="dvt-ember" style="left:${(i * 7 + 3) % 100}%;animation-delay:${(i * 0.5).toFixed(1)}s"></div>`).join('');
  return `${_css()}<div class="dvt-wrap"><div class="dvt-embers">${embers}</div><div class="dvt-inner">${inner}</div></div>`;
}

function _sideTally(trial, upto) {
  // reveal votes progressively: only the first `upto` cast votes count
  const voters = Object.keys(trial.votes);
  const shown = voters.slice(0, upto);
  const tally = {}; trial.order.forEach(n => tally[n] = 0);
  shown.forEach(v => { const t = trial.votes[v]; tally[t] = (tally[t] || 0) + 1; });
  const maxPips = Math.max(2, ...Object.values(trial.votes).length ? [Object.values(tally).length] : [2]);
  const rows = trial.order.map(n => {
    const c = tally[n] || 0;
    const isTarget = upto >= voters.length && n === trial.target;
    const pips = Array.from({ length: Math.max(3, trial.order.length - 1) }).map((_, i) =>
      `<span class="dvt-pip ${i < c ? 'on' : ''}"></span>`).join('');
    return `<div class="dvt-trow ${isTarget ? 'hit' : ''}">${av(n, 22)}<span class="nm">${esc(n)}</span><span class="dvt-pips">${pips}</span><span class="dvt-tct">${c}</span></div>`;
  }).join('');
  return `<div class="dvt-sh">THE VOTE</div><div class="dvt-sgoal">most votes = disadvantage</div><div class="dvt-tl">${rows}</div>`;
}

// reveal-stream
function _stream(intro, steps, sideSnaps) {
  if (!window._dvtSide) window._dvtSide = {};
  window._dvtSide.trial = sideSnaps;
  const total = steps.length;
  const stepHtml = steps.map((s, i) => `<div id="dvt-step-${i}" style="display:${i === 0 ? '' : 'none'}">${s}</div>`).join('');
  const main = `${intro}${stepHtml}
    <div class="dvt-done" id="dvt-done">— verdict rendered —</div>
    <div class="dvt-ctrl" id="dvt-ctrl">
      <button class="dvt-btn" onclick="disReveal(${total})">Reveal ▸</button>
      <span class="dvt-cnt" id="dvt-cnt">1 / ${total}</span>
      <button class="dvt-btn ghost" onclick="disRevealAll(${total})">Skip ⤏</button>
    </div>`;
  const side = `<aside class="dvt-side"><div id="dvt-side-inner">${sideSnaps[0] || ''}</div></aside>`;
  if (window._tvState && window._tvState['dvt']) window._tvState['dvt'].idx = 0;
  return `<div class="dvt-grid"><div>${main}</div>${side}</div>`;
}

export function rpBuildDisadvantageTrial(ep) {
  const tw = (ep.twists || []).find(t => t.type === 'disadvantage-vote');
  const trial = tw?.trial || ep.disadvantageTrial; if (!trial) return '';
  const steps = [], sideSnaps = [];
  const push = (html, upto) => { steps.push(html); sideSnaps.push(_sideTally(trial, upto)); };

  const intro = `<div class="dvt-title">
    <div class="dvt-kick">Carnival of Chaos · Elimination Area</div>
    ${_scalesSVG()}
    <div class="dvt-big">THE DISADVANTAGE TRIAL</div>
    <div class="dvt-sub">Before the immunity challenge, the field must vote to hand <b>one player</b> a disadvantage. They argue it out — accusations, rebuttals, old grudges dragged into the light — then the room decides.</div>
    <div class="dvt-host">⚖️ ${esc(trial.host)}: "Make your case — why it shouldn't be you, or who it should be. Say what you have to say. Then you vote."</div>
  </div>`;

  const BADGE = { plea: 'Defense', accuse: 'Accusation', rebut: 'Rebuttal', interject: 'Interjection', dispute: 'Dispute', reveal: 'Reveal' };
  // the debate — accusation / rebuttal / interjection / dispute / grounded reveal
  (trial.debate || []).forEach(b => {
    const avs = av(b.speaker, 22) + (b.target && b.target !== b.speaker ? av(b.target, 22) : '');
    push(`<div class="dvt-card ${b.type}"><div class="row">${avs}<span class="dvt-b ${b.type}">${BADGE[b.type] || 'Argument'} · ${esc(b.speaker)}</span></div><div class="txt">${esc(b.text)}</div></div>`, 0);
  });
  // the vote is cast — one step per voter, revealing the tally live, with a grounded reason
  const voters = Object.keys(trial.votes);
  voters.forEach((v, i) => push(
    `<div class="dvt-card vote"><div class="row">${av(v, 22)}<span class="dvt-b vote">Vote · ${esc(v)}</span></div><div class="txt"><b>${esc(v)}</b> writes down <b>${esc(trial.votes[v])}</b>.<div class="dvt-vr">— ${esc((trial.voteReasons && trial.voteReasons[v]) || `${trial.votes[v]} is the play`)}</div></div></div>`, i + 1));

  // verdict
  const flipTxt = trial.flipped
    ? `<div class="dvt-effect">The handicap flipped the challenge — <span class="flip">${esc(trial.flipped.from)}</span> lost immunity to <b>${esc(trial.flipped.to)}</b>.</div>`
    : (trial.penaltyAfter != null ? `<div class="dvt-effect">${esc(trial.target)} ran the challenge with a ~35% handicap${trial.flipped === null ? ' — and still had to overcome it.' : '.'}</div>` : '');
  const _counts = trial.order.map(n => trial.tally[n] || 0).sort((a, b) => b - a);
  const _split = _counts.length >= 2 && _counts[1] > 0 ? ` · ${_counts[0]}–${_counts[1]}` : ` · ${trial.margin} vote${trial.margin === 1 ? '' : 's'}`;
  push(`<div class="dvt-verdict">${esc(trial.target)} GETS THE DISADVANTAGE${trial.wasTie ? ' (tiebreak)' : ''}${_split}</div>${flipTxt}
    <div class="dvt-host" style="margin-top:12px;color:var(--flame);border-color:rgba(255,140,45,.5)">⚖️ ${esc(trial.host)}: "${esc(trial.target)}, you'll carry the disadvantage into the immunity challenge. Everyone else — good luck. You'll need it."</div>`, voters.length);

  return _shell(_stream(intro, steps, sideSnaps));
}

// ── reveal handlers (DOM-only) ──
function _setSide(idx) {
  const snaps = (window._dvtSide || {}).trial; if (!snaps) return;
  const el = document.getElementById('dvt-side-inner');
  if (el) el.innerHTML = snaps[Math.min(idx, snaps.length - 1)] || '';
}
export function disReveal(total) {
  if (!window._tvState) window._tvState = {};
  if (!window._tvState['dvt']) window._tvState['dvt'] = { idx: 0 };
  const s = window._tvState['dvt'];
  if (s.idx >= total - 1) return;
  s.idx++;
  const el = document.getElementById(`dvt-step-${s.idx}`);
  if (el) { el.style.display = ''; el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
  const cnt = document.getElementById('dvt-cnt'); if (cnt) cnt.textContent = `${s.idx + 1} / ${total}`;
  try { _setSide(s.idx); } catch (e) {}
  if (s.idx >= total - 1) {
    const c = document.getElementById('dvt-ctrl'); if (c) c.style.display = 'none';
    const dn = document.getElementById('dvt-done'); if (dn) dn.style.display = '';
  }
}
export function disRevealAll(total) {
  if (!window._tvState) window._tvState = {};
  if (!window._tvState['dvt']) window._tvState['dvt'] = { idx: 0 };
  const s = window._tvState['dvt'];
  for (let i = s.idx + 1; i < total; i++) { const el = document.getElementById(`dvt-step-${i}`); if (el) el.style.display = ''; }
  s.idx = total - 1;
  const cnt = document.getElementById('dvt-cnt'); if (cnt) cnt.textContent = `${total} / ${total}`;
  const c = document.getElementById('dvt-ctrl'); if (c) c.style.display = 'none';
  const dn = document.getElementById('dvt-done'); if (dn) dn.style.display = '';
  try { _setSide(s.idx); } catch (e) {}
}
