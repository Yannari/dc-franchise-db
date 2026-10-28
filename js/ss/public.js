// ══════════════════════════════════════════════════════════════════════
// ss/public.js — the public: who the country watches, loves, pities, and saves
// ══════════════════════════════════════════════════════════════════════
//
// The user, 2026-10-27: "popularity is the most important part of the game
// ... not too simple ... sometimes even a villain could be popular, more
// popular than someone nobody cares about ... popularity can come from
// multiple things, even pity ... analyze your source material and studies on
// reality shows, especially public-based ones".
//
// What the sources say, and what this file takes from each:
//
//   · SECRET STORY VOTES TO SAVE (research notes). Nobody votes against you;
//     people pick up the phone FOR somebody. So what counts is the size and
//     passion of your FAN BASE, not the country's average opinion. A villain
//     the country loves to hate has a devoted core and survives; a housemate
//     nobody noticed has no core at all and goes. (French reality TV calls
//     them "plantes vertes", house plants, and they go early.)
//   · YOU CANNOT LOVE WHO YOU NEVER SEE. Audience research on reality TV puts
//     emotional connection and parasocial attachment at the centre of why
//     viewers engage and vote; both need screen time (mere exposure). So
//     visibility is a gate in front of everything else here, and it fades if
//     a housemate goes quiet.
//   · THE UNDERDOG AND PITY. Viewers pull for the underdog and identify with a
//     contestant's struggles. The real show: in season 2 the public kept a
//     daughter with 85% the week her mother was disqualified. Being targeted,
//     buzzed, betrayed, tearful, homesick earns sympathy, which wears thin if
//     it is all a housemate has.
//   · ENTERTAINMENT OVER ACCURACY. Viewers rate entertainment above realism;
//     fights, bold buzzes, big characters, missions pulled off and dilemmas
//     answered greedily all make a character. That is where a villain's fans
//     come from, and why "fun" builds devotion, not just liking.
//   · AUTHENTICITY. Big Brother's audiences prized "real" moments; a
//     housemate caught lying to their friends loses some of the country, one
//     who owns it gets it back. Lying FOR the game (the secret, a mission) is
//     the show's premise and is forgiven; lying to hurt somebody is not.
//   · THE JOURNEY. Fake couples and fake siblings won seasons 2, 4 and 6: the
//     public votes for a story it has followed. A romance, a comeback from
//     the bottom, a secret that moved the country build an arc that does not
//     decay like the week's headlines.
//   · HEAT, AND ITS LIMIT. Cruelty, violence, picking on a favourite and
//     greed in front of everybody make the country cross. Some heat is fuel
//     (people tune in for it); too much, with nothing warm underneath, turns
//     the casual fans away, and violence is unforgivable.
//
// Every axis is a running number per housemate; the week's headlines decay,
// the arc stays. `support()` turns them into the size of a fan base, and the
// votes split by fan base.
//
// Pure: plain JSON on the season's Secret Story state.

export const AXES = ['seen', 'warmth', 'pity', 'fun', 'real', 'arc', 'heat'];
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

/** The public's file on one housemate, created on first touch. */
export function fileOf(state, n) {
  state.public ||= {};
  return (state.public[n] ||= { seen: 1, warmth: 0, pity: 0, fun: 0, real: 0, arc: 0, heat: 0, log: [] });
}

/**
 * The country notices something. `axis` one of AXES; `why` is kept (the last
 * few) so a screen can say what the public thinks and where it came from.
 */
export function notice(state, n, axis, d, why = '', week = 0) {
  if (!n || !AXES.includes(axis) || !Number.isFinite(d) || !d) return;
  const f = fileOf(state, n);
  f[axis] = Math.round((f[axis] + d) * 1000) / 1000;
  // anything the country notices, it has seen
  if (axis !== 'seen') f.seen = Math.round((f.seen + Math.abs(d) * 0.35) * 1000) / 1000;
  if (why) { f.log.push({ week, axis, d: Math.round(d * 100) / 100, why }); if (f.log.length > 24) f.log.shift(); }
}

/** A week passes: the headlines fade, the story stays. Quiet housemates fade fastest. */
export function weekPasses(state, names = []) {
  for (const n of names) {
    const f = fileOf(state, n);
    f.seen *= 0.8; f.warmth *= 0.88; f.pity *= 0.8; f.fun *= 0.82; f.heat *= 0.85; f.real *= 0.9;
    f.arc *= 0.97;
  }
}

/*
 * What the house did this week, as the country saw it (the aired house life:
 * BB's social beats). Every beat is screen time for the people in it; its
 * kind says how it played.
 */
const READS = [
  [/fight|clash|argu|feud|blow.?up|scream|shout|confront|row\b|snap/i, [['fun', 0.22], ['heat', 0.12]], 'a fight in the house'],
  [/comfort|hug|cheer up|apolog|make.?up|reconcil/i, [['warmth', 0.12]], 'looking after somebody'],
  [/cry|tears|alone|excluded|left.?out|homesick|bull(y|ied)|mock|picked on|isolat|lonely/i, [['pity', 0.22]], 'a hard day'],
  [/showmance|kiss|flirt|romance|crush|cuddl|date|spark/i, [['arc', 0.16], ['fun', 0.08]], 'a romance'],
  [/lie|lying|scheme|backstab|betray|manipul|two.?fac|fake/i, [['real', -0.12], ['fun', 0.1], ['heat', 0.06]], 'playing people'],
  [/joke|laugh|prank|dance|sing|party|funny|banter/i, [['fun', 0.14], ['warmth', 0.06]], 'making the house laugh'],
];

export function readHouseBeats(state, beats = [], week = 0) {
  for (const b of beats) {
    const who = (b?.players || []).filter(Boolean);
    if (!who.length) continue;
    // the one the beat is about gets the screen time; the others a little
    who.forEach((n, i) => fileOf(state, n).seen += i === 0 ? 0.3 : 0.12);
    const text = `${b.eventId || ''} ${b.badgeText || ''} ${b.text || ''}`;
    for (const [re, fx, why] of READS) if (re.test(text)) { for (const [ax, d] of fx) notice(state, who[0], ax, d, why, week); break; }
  }
}

/**
 * Popularity the rest of the engine already moved (BB's house events write
 * gs.popularity): the change since the last look, read as warmth when it rose
 * and heat when it fell, so no event the house plays is lost to the public.
 */
export function absorbPopularity(state, popularity = {}, names = [], week = 0) {
  state.publicSeenPop ||= {};
  for (const n of names) {
    const now = Number(popularity[n]) || 0;
    const was = Number(state.publicSeenPop[n]) || 0;
    const d = now - was;
    state.publicSeenPop[n] = now;
    if (Math.abs(d) < 0.01) continue;
    // a light touch: the house's own number moves for many reasons this file cannot see
    if (d > 0) notice(state, n, 'warmth', d * 0.15, '', week);
    else notice(state, n, 'heat', -d * 0.15, '', week);
  }
}

/**
 * The size of a housemate's fan base: the number a vote to SAVE reads.
 *
 *   recognition  can the country even place you? (seen, saturating)
 *   casual fans  warmth, pity and the arc, minus what heat drives away
 *   devoted core entertainment: the people who tune in FOR you, villain or not
 *   authenticity a multiplier, both ways
 */
export function support(state, n) {
  const f = fileOf(state, n);
  // recognition is RELATIVE: against how much the country sees of the house as a whole
  // (state.publicRoom, set each week), so a quiet housemate stays quiet in week nine too
  const room = (state.publicRoom || []).filter(x => state.public?.[x]);
  const meanSeen = room.length ? room.reduce((a, x) => a + Math.max(0, state.public[x].seen), 0) / room.length : 2.2;
  const recognition = 1 - Math.exp(-Math.max(0, f.seen) / Math.max(1, meanSeen * 0.7));
  // pity helps, then wears thin: a housemate who is only ever the victim
  const pity = f.pity / (1 + Math.max(0, f.pity) * 0.45);
  const love = Math.max(0, f.warmth) + Math.max(0, pity) * 0.9 + Math.max(0, f.arc) * 0.8;
  const casual = Math.max(0, love - Math.max(0, f.heat) * 0.55);
  // the love-to-hate core: entertainment, and some heat is fuel too
  const core = Math.max(0, f.fun) * 0.75 + Math.min(Math.max(0, f.heat), 1.5) * 0.25;
  // too much heat with nothing warm underneath turns even the core
  const turned = Math.max(0, f.heat - 2.5 - Math.max(0, f.warmth)) * 0.35;
  const real = clamp(1 + f.real * 0.12, 0.6, 1.35);
  return Math.max(0.05, recognition * (0.6 + casual + Math.max(0, core - turned)) * real);
}

/** Where a housemate stands with the country against the rest of the house: about -1..+1. */
export function standing(state, n, names = []) {
  const all = names.length ? names : Object.keys(state.public || {});
  if (!all.length) return 0;
  const vals = all.map(x => support(state, x));
  const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
  const sd = Math.sqrt(vals.reduce((a, b) => a + (b - mean) ** 2, 0) / vals.length) || 1;
  return clamp((support(state, n) - mean) / sd / 2, -1.5, 1.5);
}

/**
 * The vote: shares of a night's phone lines among `names`. Fan bases decide;
 * the night adds its own noise (who was watching, a last-minute campaign).
 */
export function voteShares(state, names = [], rng = Math.random, noise = 0.18) {
  const raw = Object.fromEntries(names.map(n => [n, Math.pow(support(state, n), 1.35) * Math.exp((rng() - 0.5) * 2 * noise)]));
  const total = Object.values(raw).reduce((a, b) => a + b, 0) || 1;
  // nobody who made it this far gets nothing
  const pct = Object.fromEntries(names.map(n => [n, Math.max(1.5, (raw[n] / total) * 100)]));
  const sum = Object.values(pct).reduce((a, b) => a + b, 0);
  return Object.fromEntries(names.map(n => [n, Math.round((pct[n] / sum) * 1000) / 10]));
}

/** What the country thinks of somebody, in one phrase, and the axis behind it. */
export function publicRead(state, n) {
  const f = fileOf(state, n);
  const pity = f.pity / (1 + Math.max(0, f.pity) * 0.45);
  const parts = { warmth: f.warmth, pity: pity * 0.9, fun: f.fun * 0.9, arc: f.arc * 0.8, heat: f.heat * 0.7 };
  const room = (state.publicRoom || []).filter(x => state.public?.[x]);
  const meanSeen = room.length ? room.reduce((a, x) => a + Math.max(0, state.public[x].seen), 0) / room.length : 2;
  if (f.seen < Math.max(1.2, meanSeen * 0.45)) return { key: 'unseen', label: 'barely seen' };
  const [top] = Object.entries(parts).sort((a, b) => b[1] - a[1]);
  if (!top || top[1] < 0.35) return { key: 'unseen', label: 'barely seen' };
  // the villain: real heat, more of it than warmth, and entertaining with it
  if ((top[0] === 'heat' || top[0] === 'fun') && f.heat >= 0.8 && f.heat > Math.max(0, f.warmth) && f.fun > f.heat * 0.6) return { key: 'villain', label: 'the one they love to hate' };
  return { warmth: { key: 'sweetheart', label: 'the sweetheart' }, pity: { key: 'underdog', label: 'the underdog' },
    fun: { key: 'character', label: 'the big character' }, arc: { key: 'story', label: 'the story everybody follows' },
    heat: { key: 'hated', label: 'the one the country is cross with' } }[top[0]];
}

/**
 * How aware a housemate is of the public: low early, sharper as the weeks go
 * and for the socially sharp. A decision weighs how it will LOOK by this much.
 */
export function awareness(ctx, n) {
  const s = Number(ctx?.stat?.(n, 'social')) || 5;
  const t = Number(ctx?.stat?.(n, 'strategic')) || 5;
  return clamp(((ctx?.week ?? 0) / 8) * (0.4 + (s + t) / 20 * 0.8), 0, 1.2);
}
