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

const P = n => { try { return pronouns(n); } catch { return { sub: 'they', obj: 'them', posAdj: 'their', Sub: 'They', Obj: 'Them' }; } };
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
  const score = SCORE[lens] || SCORE.challenge;
  const n = alive.slice().sort((a, b) => score(b, alive) - score(a, alive))[0];
  return { lens, name: n };
}
/** The reason, in the voice of somebody with this lens, as the words after the name. */
function reasonFor(lens, n, alive) {
  const p = P(n);
  const boots = bootsOf(n), al = alliancesOf(n)[0];
  switch (lens) {
    case 'control': return boots.length
      ? `${n} sent ${boots.slice(0, 2).join(' and ')} home and never got blood on ${p.posAdj} hands. Watch who ${p.sub} talks to before every vote.`
      : al ? `${n} is in the middle of ${al.name}, and every vote goes the way that group wants.` : `every vote goes the way ${n} wants. ${p.Sub} just never says it out loud.`;
    case 'challenge': return winsOf(n) ? `${n} has won ${word(winsOf(n))} competition${winsOf(n) === 1 ? '' : 's'}. When ${p.sub} needs a win, ${p.sub} gets one.` : `nobody's won much, honestly. It's anybody's game.`;
    case 'social': return `everybody in that house likes ${n}. Nobody ever wants to put ${p.obj} up, and that's the whole game.`;
    case 'loyalty': return keptOf(n) ? `${n} keeps ${p.posAdj} word. Every deal ${p.sub} made, ${p.sub} stuck to. That's rare in there.` : `${n} has never stabbed anyone in the back. Not once.`;
    case 'honesty': return `${n} is the only one in there who hasn't lied to anybody's face.`;
    case 'hidden': return `${n}. Nobody's watching ${p.obj}, and that's exactly why ${p.sub}'s dangerous. ${p.Sub}'s closer to everyone than people realise.`;
    default: return `${n} is playing the best game in there, whatever anybody says.`;
  }
}
/** Why `juror` thinks `n` deserves it, in their own lens: a sentence. */
export function reasonLine(juror, n) {
  const lens = lensOf(juror);
  const alive = gs.activePlayers || [];
  if (lens === 'grudge') return `${n} is the only one in there I don't have a problem with. That's my reason.`;
  return Cap(reasonFor(lens, n, alive));
}
const pickBy = (rng, list) => list[Math.floor(rng() * list.length) % list.length];

// ── the entrance: who the newcomer is, walking in ──
const MOODS = {
  angry: ['hothead', 'chaos-agent', 'villain'],
  analytic: ['mastermind', 'schemer', 'perceptive-player'],
  emotional: ['underdog', 'showmancer', 'social-butterfly', 'hero'],
  easy: ['floater', 'goat', 'wildcard', 'loyal-soldier', 'challenge-beast'],
};
export function entranceOf(newcomer, rng) {
  const arch = archOf(newcomer);
  const mood = Object.keys(MOODS).find(k => MOODS[k].includes(arch)) || 'easy';
  const p = P(newcomer);
  return pickBy(rng, {
    angry: [
      `${newcomer} throws ${p.posAdj} bag on the floor before saying hello. "Don't. Don't ask me if I'm okay. I'm not okay."`,
      `${newcomer} walks in already talking. "I want everyone to know I saw it coming, and nobody listened to me. Nobody."`,
      `${newcomer} slams the door harder than ${p.sub} means to. "Sorry. Actually, no. I'm not sorry. I'm furious."`,
    ],
    analytic: [
      `${newcomer} walks in, sits down at the table and asks for a pen. "Before anybody says anything, let me walk you through exactly how that vote happened."`,
      `${newcomer} is calm, almost too calm. "I know who did it, I know why, and honestly, it was a good move. I'd have done the same."`,
      `${newcomer} takes a long look around the room. "Okay. So this is the jury. Let's talk about what you all don't know yet."`,
    ],
    emotional: [
      `${newcomer} makes it two steps inside and starts crying. "Sorry. I held it together all the way here. I just can't any more."`,
      `${newcomer} hugs every single person in the room, one by one, before saying a word.`,
      `${newcomer} stands in the doorway with ${p.posAdj} hand over ${p.posAdj} mouth. "I really thought I was going to make it."`,
    ],
    easy: [
      `${newcomer} wanders in, drops onto the couch and puts ${p.posAdj} feet up. "Well. That happened."`,
      `${newcomer} shrugs as ${p.sub} comes through the door. "Honestly? I'm a bit relieved. That house was exhausting."`,
      `${newcomer} grins at the room. "Did you miss me? Don't answer that."`,
    ],
  }[mood]);
}

// ── the news, through the newcomer's lens ──
export function newsByLens(newcomer, asker, alive, rng) {
  const lead = leaderFor(newcomer, alive);
  if (!lead) return [];
  const n = lead.name;
  const why = lead.lens === 'grudge' ? `${n} has everybody fooled, and it makes me sick.` : Cap(reasonFor(lead.lens, n, alive));
  // they lead with what THEY care about: a strategist with who runs it, a loyal juror with who
  // can be trusted, a hothead with who they cannot stand
  const lead1 = {
    control: [`It's ${n}'s house now.`, `${n} is running it. Everybody else just hasn't noticed yet.`],
    challenge: [`${n} keeps winning. That's the story of the house.`, `It's all about ${n}. Every competition, every week.`],
    social: [`If you want the real power in that house, it's not the competitions.`, `Forget the competitions.`],
    loyalty: [`Can I tell you who I respect in there?`, `I'll tell you who I still trust.`],
    honesty: [`Let me tell you who I'd believe in there.`, `Honestly, there's one person I'd take at their word.`],
    hidden: [`Watch ${n}. Nobody else is.`, `Everyone's looking at the wrong person. It's ${n}.`],
    grudge: [`All I can think about is ${n}.`, `Honestly? ${n}. I can't even talk about anyone else.`],
  }[lead.lens] || [`It's ${n}.`];
  const open = pickBy(rng, lead1);
  const out = [beat('THE NEWS', [asker || newcomer, newcomer, n], asker
    ? pickBy(rng, [
      `${asker} pulls a chair close. "Okay. Tell us everything. What's it like in there now?" ${newcomer} takes a second. "${open} ${why}"`,
      `${asker} can't wait any longer. "We've had no news for a week. Talk." ${newcomer} leans back. "${open} ${why}"`,
      `${asker} hands ${newcomer} a drink. "Start with the house. Who matters in there now?" ${newcomer} doesn't hesitate. "${open} ${why}"`,
    ])
    : `${newcomer} says it to the empty room. "${open} ${why}"`)];
  // somebody with a different lens hears the same house and names somebody else; never the same
  // disagreement twice in a season
  const askerLead = asker ? leaderFor(asker, alive) : null;
  const said = gs.bb ? (gs.bb.juryNewsSaid ||= {}) : {};
  const key = asker && askerLead ? `${asker}|${askerLead.name}` : null;
  if (key && askerLead.name !== n && askerLead.lens !== lead.lens && !said[key]) {
    said[key] = true;
    const theirs = askerLead.lens === 'grudge' ? `I still can't stand ${askerLead.name}, and that's not going to change.` : Cap(reasonFor(askerLead.lens, askerLead.name, alive));
    out.push(beat('ANOTHER VIEW', [asker, askerLead.name], pickBy(rng, [
      `${asker} isn't convinced. "Really? I'd have said ${askerLead.name}. ${theirs}"`,
      `${asker} frowns. "That's not how it looked from where I was sitting. ${theirs}"`,
      `${asker} shakes ${P(asker).posAdj} head. "We're going to disagree on that one. ${theirs}"`,
    ])));
  }
  return out;
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
