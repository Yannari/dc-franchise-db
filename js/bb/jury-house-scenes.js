// ══════════════════════════════════════════════════════════════════════
// bb/jury-house-scenes.js — what a jury night is ABOUT, and how each juror sees it
// ══════════════════════════════════════════════════════════════════════
//
// The user, 2026-10-07: "they always keep the one with the most comp wins as the one winning?
// Always the same things, it's boring and not deep. I need an insight of their mind and
// personality. The jury house structure is always the same." Two things were wrong:
//
//   1. Every juror judged with one yardstick (competition wins). On the real show the jury is
//      the most personal part of the season: a strategist rewards control, a loyal juror the
//      word kept, a social player the relationships, a hothead cannot see past a grudge, a
//      perceptive player notices the quiet one. Each juror here has a LENS, from the value
//      profile the final vote already uses (finale.js juryValueProfile) and their archetype.
//   2. Every night ran the same acts in the same order. A night is now chosen from a menu of
//      scenes by what is actually live: a juror's confessional, the week's footage, two jurors
//      who belong together or cannot stand each other, an outing, the bitter-or-fair argument,
//      a straw poll. Two to four of them, never the same shape twice in a row.
//
// Words only. Every scene draws from its own dice (stableRng) and moves nothing: the reads, the
// bonds and the vote are exactly what they were. Facts are what a juror can know: competition
// wins, nominations, whose HOH week sent whom out, alliances and closeness the house saw, and
// what the newest juror brought in from the house.

import { gs, players } from '../core.js';
import { pStats, pronouns } from '../players.js';
import { getBond, getPerceivedBond } from '../bonds.js';
import { juryValueProfile } from '../finale.js';
import { stableRng } from './knowledge.js';
import { readOf } from './jury-sentiment.js';
import { pronounsOf } from '../pronouns-of.js';

const P = n => { try { return pronouns(n); } catch { return pronounsOf('nb'); } };
const W = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
const word = n => W[n] || String(n);
const Cap = t => String(t).charAt(0).toUpperCase() + String(t).slice(1);
const archOf = n => (players || []).find(p => p.name === n)?.archetype || 'floater';
const beat = (tag, who, text, extra = {}) => ({ tag, players: who.filter(Boolean), text, ...extra });
const dr = (who, text) => beat('DR', [who], text, { dr: true });

// ── what the house can see about somebody ──
const statsOf = n => gs.bb?.stats?.[n] || {};
export const winsOf = n => (statsOf(n).hohWins || 0) + (statsOf(n).vetoWins || 0) + (statsOf(n).blockBusterWins || 0);
const nomsOf = n => statsOf(n).timesNominated || 0;
const bootsOf = n => (gs.bb?.weeks || []).filter(w => w.hoh === n && w.evicted).map(w => w.evicted);
const alliancesOf = n => (gs.namedAlliances || []).filter(a => a.active !== false && (a.members || []).includes(n));
const keptOf = n => (gs.sideDeals || []).filter(d => d.honouredBy === n).length;
const brokeOf = n => (gs.sideDeals || []).filter(d => d.broken && d.brokenBy === n).length;
const liked = (n, pool) => { const o = pool.filter(x => x !== n); return o.length ? o.reduce((s, x) => s + getBond(x, n), 0) / o.length : 0; };
const hiddenOf = (n, pool) => pool.filter(x => x !== n).reduce((s, x) => s + Math.max(0, getBond(n, x) - getPerceivedBond(x, n)), 0);

// ── the lens ──
/** How this juror judges a game: 'control' 'challenge' 'loyalty' 'social' 'honesty' 'hidden' 'grudge'. */
export function lensOf(juror) {
  const arch = archOf(juror);
  if (arch === 'perceptive-player') return 'hidden';
  const s = pStats(juror);
  // a short fuse with a grudge to nurse sees the grudge first
  if ((arch === 'hothead' || arch === 'chaos-agent') && (s.temperament || 5) <= 5) return 'grudge';
  const v = juryValueProfile(juror);
  return Object.entries(v).sort((a, b) => b[1] - a[1])[0][0];
}
const SCORE = {
  challenge: (n) => winsOf(n) * 2 + nomsOf(n) * 0.2,
  control: (n) => bootsOf(n).length * 1.5 + Math.max(0, ...alliancesOf(n).map(a => (a.members || []).length)) * 0.4 + winsOf(n) * 0.3,
  social: (n, pool) => liked(n, pool),
  loyalty: (n) => keptOf(n) * 2 - brokeOf(n) * 2,
  honesty: (n) => -brokeOf(n) * 2 + keptOf(n),
  hidden: (n, pool) => hiddenOf(n, pool) - winsOf(n) * 0.8,
};
/** Who this juror thinks is really running the game, and the plain reason, by their lens. */
export function leaderFor(juror, alive) {
  const lens = lensOf(juror);
  if (!alive.length) return null;
  if (lens === 'grudge') {
    const n = alive.slice().sort((a, b) => getBond(juror, a) - getBond(juror, b))[0];
    return { lens, name: n };
  }
  // a lens with nothing to go on (nobody has kept or broken a deal) does not pick somebody at random and invent
  // a reason for them: it falls back on what everyone can see, the wins and the evictions
  const score = SCORE[lens] || SCORE.challenge;
  const flat = new Set(alive.map(n => score(n, alive))).size <= 1;
  const use = flat ? (alive.some(n => bootsOf(n).length) ? SCORE.control : SCORE.challenge) : score;
  const seen = n => winsOf(n) * 10 + liked(n, alive);
  const n = alive.slice().sort((a, b) => use(b, alive) - use(a, alive) || seen(b) - seen(a))[0];
  return { lens, name: n };
}
const listOf = xs => xs.length > 1 ? `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}` : xs[0] || '';
// What a juror can say about somebody, true of them: a reason is one of these, never a claim the record does not
// hold (the user, 2026-10-30: Nina said "Ben has never stabbed anyone in the back. Not once." and then, voting,
// the same sentence about Dominic; and "they talk like bots"). Spoken, short, in the order a lens reaches for them.
function factsAbout(n, alive, speaker = null) {
  const p = P(n), w = winsOf(n), boots = bootsOf(n), al = alliancesOf(n)[0], noms = nomsOf(n);
  const kept = keptOf(n), broke = brokeOf(n), like = liked(n, alive), hid = hiddenOf(n, alive);
  return {
    challenge: w >= 2 ? `${n}'s won ${word(w)} competitions. When ${p.sub} ${p.sub === 'they' ? 'need' : 'needs'} a win, ${p.sub} ${p.sub === 'they' ? 'get' : 'gets'} one.` : w === 1 ? `${n} won a competition when it mattered.` : null,
    // the speaker sent home by them says so in the first person (Brightly said "Hicks was HOH when Brightly went home")
    control: boots.includes(speaker) ? `${n} was HOH the week I went home, and ${p.sub} made it happen.` : boots.length ? `${n} was HOH when ${listOf(boots.slice(0, 2))} went home.` : al && (al.members || []).length >= 3 ? `${n}'s at the centre of ${al.name}, and that group decides the votes.` : null,
    loyalty: kept ? `${n} kept every deal ${p.sub} made. That's rare in there.` : null,
    honesty: kept && !broke ? `${n} never broke a deal with anybody.` : null,
    social: like > 1.5 ? `Everybody in that house likes ${n}.${noms === 0 ? ` Nobody's ever put ${p.obj} up.` : ''}` : null,
    hidden: hid > 3 ? `${n}'s closer to people than anybody realises, and nobody's watching ${p.obj}.` : null,
    survived: noms >= 2 ? `${n}'s been on the block ${word(noms)} times and ${p.sub}'s still there.` : noms === 0 ? `${n} hasn't been nominated once.` : null,
  };
}
const FALLBACK = ['control', 'challenge', 'survived', 'social', 'loyalty', 'hidden'];
/** The reason, as somebody with this lens would give it: a true sentence about `n`. */
function reasonFor(lens, n, alive, speaker = null) {
  return reasonsFor(lens, n, alive, speaker)[0];
}
/** Every true reason about `n`, the lens's own first: a caller that rotates them picks the least said. */
export function reasonsFor(lens, n, alive, speaker = null) {
  const f = factsAbout(n, alive, speaker);
  const all = [...new Set([f[lens], ...FALLBACK.map(k => f[k])].filter(Boolean))];
  return all.length ? all : [`I just think ${n}'s playing the best game in there.`];
}
/** Why `juror` thinks `n` deserves it, in their own lens: a sentence. */
export function reasonLine(juror, n) {
  const lens = lensOf(juror);
  const alive = gs.activePlayers || [];
  if (lens === 'grudge') return `${n}'s the only one in there I don't have a problem with.`;
  return Cap(reasonFor(lens, n, alive, juror));
}
const pickBy = (rng, list) => list[Math.floor(rng() * list.length) % list.length];

// ── how the newcomer takes it: by who they are ──
const MOODS = {
  angry: ['hothead', 'chaos-agent', 'villain'],
  analytic: ['mastermind', 'schemer', 'perceptive-player'],
  emotional: ['underdog', 'showmancer', 'social-butterfly', 'hero'],
  easy: ['floater', 'goat', 'wildcard', 'loyal-soldier', 'challenge-beast'],
};
/** 'angry' | 'analytic' | 'emotional' | 'easy' */
export const moodOf = n => Object.keys(MOODS).find(k => MOODS[k].includes(archOf(n))) || 'easy';
/** What the house news is, in this juror's eyes: the person they would name, and the true reason. */
export function newsOf(newcomer, alive) {
  const lead = leaderFor(newcomer, alive);
  if (!lead) return null;
  const n = lead.name;
  return { name: n, lens: lead.lens, whys: lead.lens === 'grudge' ? [`${n} has everybody fooled, and I can't stand it.`] : reasonsFor(lead.lens, n, alive, newcomer).map(Cap) };
}

// ══════════════ the scenes a night can be built from ══════════════

/** A juror alone with the camera: what they feel, and why, in their own lens. */
function confessional(juror, alive, newcomer, rng) {
  const lens = lensOf(juror);
  const fav = alive.slice().sort((a, b) => readOf(juror, b) - readOf(juror, a))[0];
  const least = alive.slice().sort((a, b) => readOf(juror, a) - readOf(juror, b))[0];
  if (!fav) return null;
  const lines = {
    control: [`I respect a player who takes control. Right now that's ${fav}. ${least === fav ? '' : `${least} just goes wherever the votes go, and I can't reward that.`}`,
      `I'm watching who actually makes decisions. ${fav} does. Everyone else in that house is reacting to ${P(fav).obj}.`],
    challenge: [`I came into this game to compete, and I'll vote for whoever competed hardest. Right now that's ${fav}.`,
      `You want my vote, win something. ${fav} has. ${least} hasn't, and that matters to me.`],
    loyalty: [`All I care about is whether people kept their word. ${fav} did. ${least === fav ? '' : `${least} didn't, and I'll never forget that.`}`,
      `I was loyal in that house, and it got me sent here. I'm going to reward the one person who was loyal back. That's ${fav}.`],
    social: [`This game is about people. ${fav} understood that better than anyone. That's who I want to win.`,
      `I don't care who won what. I care who people actually wanted to be around. That's ${fav}.`],
    honesty: [`I want to vote for somebody I can trust. Out of everyone left, that's ${fav}. ${least === fav ? '' : `${least} lied to me, and I can't get past it.`}`,
      `I know lying is part of the game. I just can't reward the people who did it to my face. ${fav} never did.`],
    hidden: [`Everybody's looking at the loud players. I'm looking at ${fav}. Quiet, everywhere, never in trouble. That's the best game in the house.`,
      `People underestimate ${fav}. I don't. I see exactly what ${P(fav).sub}'s doing, and it's working.`],
    grudge: [`Everyone keeps telling me to vote for the best player. I can't even think about that until I stop being angry at ${least}.`,
      `I know I should be fair. But every time I hear ${least}'s name, I remember how I got here.`],
  }[lens] || [`I keep going back and forth. Right now, it's ${fav}.`];
  return [dr(juror, pickBy(rng, lines).trim())];
}

/** The jury watches the week's footage, and each reacts in their own way. */
function footage(week, residents, alive, newcomer, rng) {
  const nom = (week.acts || []).find(a => a?.type === 'nominations');
  const hoh = week.hoh, veto = week.vetoWinner, gone = week.evicted;
  if (!hoh) return null;
  const watchers = residents.filter(j => j !== newcomer).slice(0, 3);
  if (!watchers.length) return null;
  const out = [beat('FOOTAGE', watchers, pickBy(rng, [
    `The jury gets their weekly tape. Everyone grabs a seat in front of the television.`,
    `A package arrives with this week's footage. The jurors crowd around the screen.`,
    `It's tape night. The lights go down, and the week starts playing.`,
  ]))];
  for (const j of watchers) {
    const lens = lensOf(j);
    const said = lens === 'challenge' ? `${j} leans forward when ${hoh} wins HOH. "Look at that. ${hoh} wanted it more than anyone. You can see it."`
      : lens === 'control' ? `${j} pauses the tape on the nomination ceremony. "${nom?.nominees?.length ? `${nom.nominees.join(' and ')}. ` : ''}That's not ${hoh}'s plan. Somebody told ${P(hoh).obj} to do that."`
        : lens === 'loyalty' ? `${j} goes quiet watching ${gone || 'the eviction'}. "${gone ? `${gone} trusted those people.` : 'People trusted each other in there.'} Watch who looks away when the votes are read."`
          : lens === 'social' ? `${j} is watching the kitchen footage instead of the competitions. "Look how everybody goes to ${alive.slice().sort((a, b) => liked(b, alive) - liked(a, alive))[0]} after the ceremony. That's power too."`
            : lens === 'hidden' ? `${j} points at somebody in the background of a shot. "Nobody's talking about ${alive.slice().sort((a, b) => hiddenOf(b, alive) - hiddenOf(a, alive))[0]}. Look. Every conversation, ${P(alive.slice().sort((a, b) => hiddenOf(b, alive) - hiddenOf(a, alive))[0]).sub}'s there."`
              : lens === 'grudge' ? `${j} throws a cushion at the screen when ${alive.slice().sort((a, b) => getBond(j, a) - getBond(j, b))[0]} comes on. "Every single week. Look at that face."`
                : `${j} shakes ${P(j).posAdj} head at the screen. "${veto ? `And ${veto} wins the veto.` : 'Same house, different week.'} Somebody in there has to do something soon."`;
    out.push(beat('FOOTAGE', [j], said));
  }
  return out;
}

/** Two jurors with history, alone: allies building a bloc, enemies stuck together, a couple. */
function sideTalk(residents, alive, rng) {
  const pairs = [];
  for (const a of residents) for (const b of residents) if (a < b) pairs.push([a, b, getBond(a, b)]);
  if (!pairs.length) return null;
  const couple = pairs.find(([a, b]) => (gs.showmances || []).some(sh => (sh.players || []).includes(a) && (sh.players || []).includes(b)));
  if (couple) {
    const [a, b] = couple;
    return [beat('COUPLE', [a, b], pickBy(rng, [
      `${a} and ${b} sit on the porch swing, finally with nobody watching. "I thought about you every day after you left," ${a} admits. "Same," ${b} says. "Every single day."`,
      `${b} finds ${a} in the kitchen and doesn't say anything at first, just holds on. "We made it out together," ${b} says eventually. "Sort of."`,
    ])), dr(a, `Being in here with ${b} is the best part of losing. I'm not going to pretend it isn't.`)];
  }
  const [x, y, bond] = pairs.slice().sort((p, q) => Math.abs(q[2]) - Math.abs(p[2]))[0];
  if (bond >= 4) {
    const fav = alive.slice().sort((a, b) => (readOf(x, b) + readOf(y, b)) - (readOf(x, a) + readOf(y, a)))[0];
    return [beat('THE BLOC', [x, y, fav], pickBy(rng, [
      `${x} and ${y} go for a walk, away from the others. "Can we just agree now?" ${x} asks. "We vote together at the end." ${y} nods. "${fav}, then?" ${x} doesn't hesitate. "${fav}."`,
      `${x} pulls ${y} aside on the porch. "If we stick together, we decide this. Two votes is a lot out here." ${y} thinks about it. "Then let's make them count. I'm leaning ${fav}."`,
    ])), dr(y, `${x} and I were close in the house, and we're close out here. If we vote as a pair, nobody can ignore us.`)];
  }
  if (bond <= -3) return [beat('ENEMIES', [x, y], pickBy(rng, [
    `${x} and ${y} are the only two awake at midnight, stuck in the same kitchen. "We don't have to like each other," ${y} says eventually. "No," ${x} agrees. "We just have to live here." They manage almost ten minutes before it turns into an argument about week ${word(Math.max(1, (gs.bb?.weeks || []).findIndex(w => w.evicted === x || w.evicted === y) + 1))}.`,
    `${x} sits down on the couch, sees ${y} at the other end, and stays anyway. "I'm not moving," ${x} says. "Neither am I," ${y} says. They watch the whole film without speaking.`,
  ])), dr(x, `${y} is the reason I'm not in that house any more. Sharing a bathroom with ${P(y).obj} is my punishment for losing.`)];
  return null;
}

/** An outing: the jury trip, and the game coming up anyway. */
function outing(residents, alive, rng) {
  if (residents.length < 2) return null;
  const [a, b] = residents.slice().sort((x, y) => getBond(y, residents[0]) - getBond(x, residents[0]));
  const where = pickBy(rng, [
    ['a hike up to the lookout', 'At the top, out of breath,'],
    ['a cooking class in town', 'Halfway through burning the sauce,'],
    ['a day at the lake', 'Floating on the water,'],
    ['wine tasting at a vineyard', 'By the third glass,'],
    ['a long dinner out', 'Over dessert,'],
  ]);
  const favOf = j => alive.slice().sort((x, y) => readOf(j, y) - readOf(j, x))[0];
  const fa = { name: favOf(a), lens: lensOf(a) }, fb = { name: favOf(b), lens: lensOf(b) };
  const out = [beat('OUTING', residents.slice(0, 4), `The jury gets a day out: ${where[0]}. For a few hours nobody talks about the game.`),
    beat('OUTING', [a, b], `${where[1]} ${a} can't help it. "Okay. Be honest. Who's your winner right now?" ${b} laughs. "I knew you'd ask. ${fb.name}. ${reasonLine(b, fb.name)}"`)];
  if (fa && fb && fa.name !== fb.name) out.push(beat('OUTING', [a], `${a} shakes ${P(a).posAdj} head. "See, I'd say ${fa.name}. ${reasonLine(a, fa.name)}"`));
  return out;
}

/** Reward the game, or the person who hurt you? The argument every jury has. */
function bitterDebate(residents, alive, rng) {
  const bitter = residents.map(j => [j, Math.min(...alive.map(n => readOf(j, n)))]).sort((x, y) => x[1] - y[1])[0];
  const fair = residents.find(j => j !== bitter?.[0] && ['control', 'challenge', 'hidden'].includes(lensOf(j)));
  if (!bitter || !fair || bitter[1] > -0.4) return null;
  const [b] = bitter;
  const target = alive.slice().sort((x, y) => readOf(b, x) - readOf(b, y))[0];
  return [beat('BITTER JURY', [fair, b, target], pickBy(rng, [
    `${fair} finally says it at dinner. "${b}, you can't vote against ${target} just because ${P(target).sub} got you out. That's not a jury, that's revenge." ${b} puts down ${P(b).posAdj} fork. "It's not revenge. It's remembering how ${P(target).sub} played."`,
    `${fair} and ${b} end up shouting across the living room. "Reward the best game!" "${target}'s game was lying to me!" "That IS the game!" Nobody else says a word.`,
  ])), dr(b, `People keep saying I'm bitter. Maybe I am. But I'm allowed to judge how somebody plays, and ${target} played dirty.`)];
}

/** "If we voted tonight?" — the count, and what it does to the room. */
function strawPoll(residents, alive, rng) {
  if (residents.length < 3 || alive.length < 2) return null;
  const tally = {};
  for (const j of residents) { const f = alive.slice().sort((a, b) => readOf(j, b) - readOf(j, a))[0]; tally[f] = (tally[f] || 0) + 1; }
  const order = Object.entries(tally).sort((a, b) => b[1] - a[1]);
  const [lead, n] = order[0];
  const asker = residents[Math.floor(rng() * residents.length) % residents.length];
  const out = [beat('STRAW POLL', [asker], `${asker} grabs a notepad. "Quick one. No speeches. If we voted tonight, who gets your vote?" One by one, the jurors answer.`)];
  out.push(beat('STRAW POLL', [asker, lead], `${asker} counts it up. "${lead}, ${word(n)}.${order.slice(1).map(([k, v]) => ` ${k}, ${word(v)}.`).join('')}" The room goes quiet for a second.`));
  const loser = residents.find(j => alive.slice().sort((a, b) => readOf(j, b) - readOf(j, a))[0] !== lead);
  if (loser) out.push(beat('STRAW POLL', [loser, lead], `${loser} isn't happy. "${lead}? Seriously? Half of you are voting for ${lead} and you can't even tell me why."`));
  return out;
}

/**
 * The night: which scenes, in what order. `taken` is the set of scene kinds the last night aired,
 * so two weeks running never have the same shape. Returns { acts: [{ title, beats }], kinds }.
 */
export function chooseNight({ week, residents, newcomer, full, lastKinds = [], grudgeBeats = [] }) {
  const alive = (gs.activePlayers || []).slice();
  if (!residents.length || !alive.length) return { acts: [], kinds: [] };
  const rng = stableRng('jhnight', week?.num || 0, residents.join('|'));
  const others = residents.filter(n => n !== newcomer);
  /** @type {[string, number, () => any][]} */
  const pool = [
    ['confessional', 3, () => { const js = residents.slice().sort(() => rng() - 0.5).slice(0, residents.length >= 4 ? 2 : 1); return js.flatMap(j => confessional(j, alive, newcomer, rng) || []); }],
    ['footage', residents.length >= 2 ? 2.5 : 0, () => footage(week, residents, alive, newcomer, rng)],
    ['side', residents.length >= 3 ? 2.5 : 0, () => sideTalk(others.length >= 2 ? others : residents, alive, rng)],
    ['outing', residents.length >= 3 ? 1.8 : 0, () => outing(residents, alive, rng)],
    ['bitter', residents.length >= 3 ? 2 : 0, () => bitterDebate(residents, alive, rng)],
    ['poll', residents.length >= 4 ? 1.6 : 0, () => strawPoll(residents, alive, rng)],
    ['grudges', grudgeBeats.length ? 1.5 : 0, () => grudgeBeats],
  ];
  const TITLE = { confessional: 'In Their Own Words', footage: 'Tape Night', side: 'Off to the Side', outing: 'A Day Out', bitter: 'Bitter or Fair?', poll: 'If We Voted Tonight', grudges: 'Old Scores' };
  const want = Math.min(residents.length >= 4 ? (full ? 4 : 3) : 2, pool.filter(x => x[1] > 0).length);
  const acts = [], kinds = [];
  const avail = pool.filter(x => x[1] > 0);
  while (kinds.length < want && avail.length) {
    // a scene the last night had is a lot less likely tonight
    const w = avail.map(([k, wt]) => wt * (lastKinds.includes(k) ? 0.25 : 1));
    const tot = w.reduce((a, b) => a + b, 0);
    let r = rng() * tot, i = 0;
    while (i < w.length - 1 && (r -= w[i]) > 0) i++;
    const [k, , make] = avail.splice(i, 1)[0];
    const beats = make();
    if (beats && beats.length) { acts.push({ title: TITLE[k], beats }); kinds.push(k); }
  }
  return { acts, kinds };
}

/** The roundtable's case for and against, chosen by what the speaker values. */
export function lensCase(speaker, player, side) {
  const lens = lensOf(speaker);
  const p = P(player);
  if (side === 'for') return {
    control: bootsOf(player).length ? `${player} sent ${bootsOf(player)[0]} home on ${p.posAdj} own terms. That's control. That's what I'm voting for.` : null,
    challenge: winsOf(player) ? `${player} has won ${word(winsOf(player))} competition${winsOf(player) === 1 ? '' : 's'}. When it mattered, ${p.sub} delivered.` : null,
    loyalty: keptOf(player) ? `${player} kept every promise ${p.sub} made. In that house? That's the most impressive thing anyone did.` : brokeOf(player) === 0 ? `${player} never broke a deal. Not one. I respect that more than any competition.` : null,
    social: liked(player, gs.activePlayers || []) > 1 ? `Everybody in that house wants ${player} around. You can't fake that for this long.` : null,
    honesty: brokeOf(player) === 0 ? `${player} never lied to me. Not once. That's my vote.` : null,
    hidden: `Nobody here gives ${player} enough credit. ${p.Sub} was in every important conversation and never once took the blame.`,
    grudge: null,
  }[lens] || null;
  return {
    control: bootsOf(player).length === 0 ? `Name one move ${player} made. One decision that was ${p.posAdj} idea. I'll wait.` : null,
    challenge: winsOf(player) === 0 ? `${player} hasn't won anything. I can't hand somebody the money for never winning.` : null,
    loyalty: brokeOf(player) ? `${player} broke ${brokeOf(player) === 1 ? 'a deal' : 'deals'}. I watched people trust ${p.obj} and get burned.` : null,
    social: liked(player, gs.activePlayers || []) < -0.5 ? `Half that house can't stand ${player}. That's not a social game. That's a problem.` : null,
    honesty: brokeOf(player) ? `${player} lied. To people's faces. I don't care how good the game was.` : null,
    hidden: winsOf(player) >= 3 ? `${player} is the obvious answer, and the obvious answer is usually wrong. Look at who ${p.sub} was protecting.` : null,
    grudge: `I'm not voting for ${player}. You all know why. I don't need to explain myself.`,
  }[lens] || null;
}
