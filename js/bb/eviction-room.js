// ══════════════════════════════════════════════════════════════════════
// bb/eviction-room.js — the room, in the second after the name is read
// ══════════════════════════════════════════════════════════════════════
//
// The user, 2026-10-29: "we need more reactions at the elimination not just from the evictee also from the others
// especially if its a blindside and people got blindsided not just the nominees and i mean real blindside i dont want
// it to feel repetitive".
//
// A REAL BLINDSIDE IS A FACT, NOT A FEELING. Every ballot records what its voter told the house (`stated`) beside
// what they wrote (`evict`). Count the names the house was TOLD: if that count said the other nominee was going and
// this one went, the room was lied to, and the people it was lied to are the ones the camera finds. A vote that went
// the way everybody said it would is not a blindside however close it was, and gets the quieter reactions: a friend
// in tears, the other nominee breathing out.
//
// Who is blindsided, and only them:
//   the evictee, who was told they were staying;
//   their friends who voted to keep them, counting on the numbers they had been given;
//   the Head of Household whose target was the one who stayed;
//   the other nominee, who walked in expecting to leave.
// And the other side of it: one of the people who flipped, keeping a straight face.
//
// Decided here, in the engine, from the week as it happened, and stored on the eviction act like the parting shot
// (last-words.js): the screen and both transcripts read it, never the live house. A season-long ledger picks the
// least-heard line of each kind so a season of evictions does not say the same sentence twice.

import { gs, seasonConfig } from '../core.js';
import { pStats, pronouns } from '../players.js';
import { getBond, addBond } from '../bonds.js';
import { stableRng } from './knowledge.js';

const pick = (rng, kind, pool) => {
  const book = gs.bb ? (gs.bb.roomLines ||= {}) : {};
  const least = Math.min(...pool.map((_, i) => book[`${kind}|${i}`] || 0));
  const fresh = pool.map((line, i) => ({ line, i })).filter(x => (book[`${kind}|${x.i}`] || 0) === least);
  const got = fresh[Math.floor(rng() * fresh.length)];
  book[`${kind}|${got.i}`] = (book[`${kind}|${got.i}`] || 0) + 1;
  return got.line;
};

const LINES = {
  stunned: [
    (e, p) => `${e} doesn't move. ${p.Sub} ${p.sub === 'they' ? 'were' : 'was'} told all week that the votes were there.`,
    (e, p) => `${e} looks straight at the people ${p.sub} counted on, one at a time, and none of them look back.`,
    (e) => `${e} laughs once, like it's a joke, and then sees nobody else is laughing.`,
    (e, p) => `For a second ${e} just sits there. Then ${p.sub} ${p.sub === 'they' ? 'say' : 'says'}, very quietly, "Who?"`,
    (e) => `${e}'s mouth opens and nothing comes out. The house can see the count going on behind ${e}'s eyes.`,
  ],
  ally: [
    (a, e) => [`${a}`, `No. No, that's wrong. That's not how the votes were going.`],
    (a, e) => [`${a}`, `${e}? Somebody lied to me. Somebody in this room lied to my face.`],
    (a, e) => ['beat', `${a} has both hands over ${pronouns(a).posAdj} mouth. ${a} was sure.`],
    (a, e) => [`${a}`, `I counted. I counted it three times.`],
    (a, e) => ['beat', `${a} turns round on the sofa to look at the rest of the house, and the house finds something else to look at.`],
    (a, e) => [`${a}`, `Wait. Wait, how is it ${e}?`],
  ],
  hoh: [
    (h, s) => ['beat', `${h} stares at ${s}, who is still sitting there. That was not the week ${h} built.`],
    (h, s) => [`${h}`, `That's not what I was told.`],
    (h, s) => ['beat', `${h}'s face goes completely still. The person ${h} wanted out is the one still in the chair.`],
    (h, s) => [`${h} DR`, `I put ${s} on that block to send ${s} home. ${s} is still here. Somebody in this house played me.`],
  ],
  survivor: [
    (s) => ['beat', `${s} was already halfway out of the seat, ready to say goodbye. ${s} sits back down slowly.`],
    (s) => [`${s}`, `Me? I'm staying?`],
    (s) => ['beat', `${s} had a bag packed by the door. ${s} stares at the host like the name was read wrong.`],
    (s) => [`${s} DR`, `I walked in tonight sure it was me. I'd said goodbye in my head. I'm still here, and I don't know who to thank.`],
  ],
  flipper: [
    (f) => ['beat', `${f} keeps ${pronouns(f).posAdj} eyes on the floor and ${pronouns(f).posAdj} face perfectly still.`],
    (f) => [`${f} DR`, `I'm not going to look surprised. I'm not going to look anything. Nobody needs to know where my vote went.`],
    (f) => ['beat', `${f} is the first to stand up and hug the evictee, which is exactly what somebody who flipped would do.`],
    (f) => [`${f} DR`, `Everybody's looking for who did it. I'm looking for them too, very convincingly.`],
  ],
  // the vote went the way everybody said it would
  tears: [
    (a, e) => ['beat', `${a} is crying before ${e} is even out of the chair.`],
    (a, e) => [`${a}`, `I'm sorry. I'm so sorry. I tried.`],
    (a, e) => ['beat', `${a} holds on to ${e} for so long that the host has to say ${e}'s name twice.`],
    (a, e) => [`${a} DR`, `We all knew it was going to be ${e}. Knowing doesn't make it hurt any less.`],
    (a, e) => [`${a}`, `${e}, I'll see you on the outside. I promise.`],
    (a, e) => ['beat', `${a} walks ${e} all the way to the door and doesn't let go of ${pronouns(e).posAdj} hand until the last second.`],
    (a, e) => [`${a} DR`, `${e} was my person in here. Tomorrow I wake up and ${e} isn't in the next bed.`],
    (a, e) => ['beat', `${a} can't stay in the living room. ${a} is in the bathroom before the front door has even closed.`],
  ],
  relief: [
    (s) => ['beat', `${s} lets out a breath the whole room can hear, and then feels guilty for it.`],
    (s, e) => [`${s} DR`, `I was the one people kept saying could go. I'm still here, and ${e} isn't. I'll feel bad about how much I'm smiling later.`],
    (s, e) => ['beat', `${s} closes ${pronouns(s).posAdj} eyes for a second, then gets up to hug ${e}.`],
    (s, e) => [`${s}`, `${e}, I'm sorry. I really am.`],
    (s) => ['beat', `${s} grips the edge of the chair and doesn't let go until the host has finished speaking.`],
    (s, e) => [`${s} DR`, `It was close. I could feel how close it was. I'm going to spend the whole week making sure it's never that close again.`],
  ],
};

/** The room's reaction to the eviction, stored on the act. Null when there is nobody to react. */
export function checkEvictionRoom(week) {
  const evictee = week?.evicted;
  if (!evictee) return null;
  const act = [...(week.acts || [])].reverse().find(a => a?.type === 'eviction' && a.evicted === evictee);
  if (!act || act.roomReactions) return act?.roomReactions || null;
  const ballots = (week.ballots || []).filter(b => b && b.voter);
  const house = (gs.activePlayers || []).filter(n => n && n !== evictee);
  if (!ballots.length || !house.length) return null;
  const rng = stableRng('eviction-room', evictee, week.num || 0);
  const survivor = (week.finalNominees || []).find(n => n !== evictee && house.includes(n)) || null;

  // ── what the house was told ──
  const told = {};
  for (const b of ballots) { const n = b.stated || b.evict; if (n) told[n] = (told[n] || 0) + 1; }
  const expected = Object.entries(told).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
  const flips = ballots.filter(b => b.stated && b.stated !== b.evict && b.evict === evictee);
  const blindside = !!expected && expected !== evictee && flips.length > 0;
  const lines = [];
  const add = (kind, who, fn) => {
    const r = pick(rng, kind, LINES[kind]);
    const got = fn(r);
    if (typeof got === 'string') lines.push({ k: 'beat', t: got, about: who });
    else {
      const [by, t] = got;
      if (by === 'beat') lines.push({ k: 'beat', t, about: who });
      else if (by.endsWith(' DR')) lines.push({ k: 'dr', by: by.slice(0, -3), t });
      else lines.push({ k: 'say', by, t });
    }
  };
  const shocked = [];
  if (blindside) {
    add('stunned', evictee, f => f(evictee, pronouns(evictee)));
    // friends who voted to keep them, closest first, and only people who really were close
    const kept = ballots.filter(b => b.evict !== evictee && house.includes(b.voter)).map(b => b.voter);
    const friends = kept.filter(n => getBond(n, evictee) >= 4).sort((a, b) => getBond(b, evictee) - getBond(a, evictee)).slice(0, 2);
    for (const f of friends) { add('ally', f, fn => fn(f, evictee)); shocked.push(f); }
    const hoh = week.hoh && house.includes(week.hoh) ? week.hoh : null;
    const target = week.plan?.backdoorTarget || week.plan?.target || null;
    if (hoh && survivor && target === survivor) { add('hoh', hoh, fn => fn(hoh, survivor)); shocked.push(hoh); }
    if (survivor && expected === survivor) add('survivor', survivor, fn => fn(survivor));
    const flipper = flips.map(b => b.voter).filter(n => house.includes(n)).sort((a, b) => getBond(b, evictee) - getBond(a, evictee))[0];
    if (flipper) add('flipper', flipper, fn => fn(flipper));
  } else {
    const friend = house.filter(n => n !== survivor && getBond(n, evictee) >= 5).sort((a, b) => getBond(b, evictee) - getBond(a, evictee))[0];
    if (friend) add('tears', friend, fn => fn(friend, evictee));
    // relief is for a nominee who was really in danger: votes against them, or the target of the week
    const against = ballots.filter(b => b.evict === survivor).length;
    if (survivor && (against >= 2 || week.plan?.target === survivor)) add('relief', survivor, fn => fn(survivor, evictee));
  }
  if (!lines.length) return null;

  // ── what it costs ──
  // The audience is with the one who did not see it coming, and a friend who was lied to looks at the nominee who
  // stayed and knows that person is part of the reason.
  if (seasonConfig.popularityEnabled !== false && blindside) {
    gs.popularity ||= {};
    gs.popularity[evictee] = (gs.popularity[evictee] || 0) + 0.6;
  }
  if (survivor) for (const n of shocked) if (n !== survivor) addBond(n, survivor, -0.4);

  const record = { blindside, expected, out: evictee, flips: flips.map(b => b.voter), shocked, lines };
  act.roomReactions = record;
  week.roomReactions = record;
  return record;
}

/** The room, for both transcripts. */
export function evictionRoomLines(record, line) {
  if (!record?.lines?.length) return;
  line(record.blindside ? '  The room was told a different name.' : '');
  for (const l of record.lines) {
    if (l.k === 'beat') line(`    ${l.t}`);
    else if (l.k === 'dr') line(`    ${l.by}, in the Diary Room: "${l.t}"`);
    else line(`    ${l.by}: "${l.t}"`);
  }
}
