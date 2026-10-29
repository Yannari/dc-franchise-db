// ══════════════════════════════════════════════════════════════════════
// ss/missions.js — the Voice's secret missions: a ranked catalog
// ══════════════════════════════════════════════════════════════════════
//
// Part 2 design §7, and the user, 2026-10-27: "we need a ton of missions
// ranked by importance to avoid repetitions … and with missions come different
// gameplay, so different dialogue". So:
//
//   · A CATALOG drawn from the missions the 14 real seasons actually ran
//     (docs/research/secret-story-france.md; the season pages), ranked:
//       tier 1  BIG missions: multi-week, season-shaping, at most one a season
//               (a fake couple held for weeks, the alibi of a real couple, the
//               Voice's infiltrator, a fake pregnancy, fake siblings);
//       tier 2  WEEKLY missions that change that week's game (get somebody
//               nominated, a seduction, a fake feud, bait a buzz onto a lie);
//       tier 3  SMALL missions that colour a week (a forfeit, a hug, a dare).
//   · FEW MECHANICS, MANY MISSIONS. Each entry is judged one of five ways —
//     what the house BELIEVES, a BOND that moves, an EVENT that happens, a
//     BAITED buzz on a fake, ENDURANCE — and played through the week by its
//     family's hook. A new mission is data plus its own lines.
//   · NO REPEATS: a mission is never handed twice in one season; across
//     seasons the twist randomizer's sameness score counts the mission mix.
//   · Each entry has a SCENE KEY (`id`) for part 3's dialogue; the short lines
//     here (`say`) keep the screens from going blank until then.
//
// Archetypes (franchise rules, and the user's 2026-10-23 loosening for the
// house): nice archetypes may fake a couple, lie for fun and keep a straight
// face; they never take a mission marked `sabotage`. Neutrals take one only
// with strategic >= 6 and loyalty <= 4.
//
// Pure: state + the hunt's context `{ stat, bond, rng, week, archetype }`.

import { mint } from './kitty.js';
import { secretOf, showClue, addEvidence } from './hunt.js';

const clamp = (v, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));
const st = (ctx, n, k) => { const v = Number(ctx?.stat?.(n, k)); return Number.isFinite(v) ? v : 5; };
const VILLAIN = ['villain', 'mastermind', 'schemer'];
const NICE = ['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat'];
export const canSabotage = (ctx, n) => {
  const a = ctx.archetype?.(n);
  if (VILLAIN.includes(a)) return true;
  if (NICE.includes(a)) return false;
  return st(ctx, n, 'strategic') >= 6 && st(ctx, n, 'loyalty') <= 4;
};

/*
 * One entry:
 *   id       the scene key (part 3 writes `lines/missions/<id>`)
 *   tier     1 big · 2 weekly · 3 small
 *   judged   'belief' | 'bond' | 'event' | 'bait' | 'endurance'
 *   roles    'one' | 'pair' | 'one+target' | 'pair+target'
 *   weeks    how long it runs (tier 1 runs several)
 *   reward   [min, max] dollars, each holder
 *   fail     'clue' (a clue on the holder's own secret) | 'none' | 'd-office'
 *   belief   for 'belief' and 'bait': the lie the house must swallow
 *   bond     for 'bond': +1 = the target must warm to the holder, -1 = must turn on them
 *   event    for 'event': what must happen
 *   fit      the stats that make somebody good at it
 *   sabotage true = never for a nice archetype
 *   from     the season it comes from
 *   text     the Voice's instruction
 *   say      { give, won, lost } one line each, the holder's (part 3 replaces)
 */
export const MISSIONS = [
  // ── tier 1: big missions, one a season at most ──
  { id: 'long-fake-couple', tier: 1, judged: 'belief', roles: 'pair', weeks: 3, reward: [15000, 30000], fail: 'clue', belief: 'We are a couple', fit: ['social', 'boldness'], from: 'S2, S6, S11',
    text: (a, b) => `${a} and ${b}: for the next three weeks you are a couple. The whole house must believe it.`,
    say: { give: 'Three weeks of being in love on command. I hope I like them.', won: 'Three weeks. We fooled every single one of them.', lost: 'They saw through us. Or through me.' } },
  { id: 'couple-alibi', tier: 1, judged: 'belief', roles: 'one+target', weeks: 2, reward: [10000, 20000], fail: 'clue', belief: 'I am with somebody in this house', fit: ['social', 'strategic'], from: 'S10 (Bastien, the alibi of Julien and Sophia)',
    text: (a, _b, t) => `${a}, a real couple hides in this house. Get close to ${t} so the house never suspects who ${t} is really with.`,
    say: { give: 'So I am the decoy. Fine. I am a very good decoy.', won: 'Nobody ever looked at the real couple. Nobody.', lost: 'They worked it out anyway. I tried.' } },
  { id: 'infiltrator', tier: 1, judged: 'endurance', roles: 'one', weeks: 3, reward: [8000, 15000], fail: 'd-office', fit: ['strategic', 'temperament'], from: 'S1 (the Voice\'s accomplice), S5 (the infiltrator)',
    text: a => `${a}, you are the Voice's eyes and ears. Report on the house in the confessional, and never be caught.`,
    say: { give: 'A spy. For the Voice. This is the best day of my life.', won: 'Three weeks of reporting on everybody and not one of them suspected.', lost: 'Caught. Of course I got caught.' } },
  { id: 'fake-pregnancy', tier: 1, judged: 'belief', roles: 'pair', weeks: 2, reward: [10000, 20000], fail: 'clue', belief: 'We are having a baby', fit: ['social', 'boldness'], from: 'S4 (Anne-Krystel and Bastien)',
    text: (a, b) => `${a} and ${b}: make the house believe ${a} is expecting a baby, and ${b} is the father.`,
    say: { give: 'A baby. In here. Okay. Okay okay okay.', won: 'Somebody knitted something. I feel terrible. We won.', lost: 'Nobody bought it. Honestly, fair.' } },
  { id: 'fake-siblings', tier: 1, judged: 'belief', roles: 'pair', weeks: 3, reward: [10000, 25000], fail: 'clue', belief: 'We are brother and sister', fit: ['social', 'loyalty'], from: 'S6 (Nadège and Thomas, who won)',
    text: (a, b) => `${a} and ${b}: you are brother and sister now. Share everything, and let nobody doubt it.`,
    say: { give: 'Hi. I guess I have a sibling now.', won: 'Family is who you fool together.', lost: 'Turns out we look nothing alike.' } },
  { id: 'fake-engagement', tier: 1, judged: 'belief', roles: 'pair', weeks: 2, reward: [10000, 20000], fail: 'clue', belief: 'We are getting married', fit: ['social', 'boldness'], from: 'S4 (the wedding), S6, S11 (the proposal)',
    text: (a, b) => `${a} and ${b}: announce your engagement and plan the wedding. The house must believe every word.`,
    say: { give: 'Engaged. To them. In a week. Sure.', won: 'They cried at the proposal. Real tears.', lost: 'The ring was too much. I knew the ring was too much.' } },
  // ── tier 2: weekly missions that change the game ──
  { id: 'fake-couple', tier: 2, judged: 'belief', roles: 'pair', weeks: 1, reward: [5000, 10000], fail: 'clue', belief: 'We are a couple', fit: ['social', 'boldness'], from: 'S5, S6, S11',
    text: (a, b) => `${a} and ${b}: make the whole house believe you are falling for each other this week.`,
    say: { give: 'A week of pretending. With them. Sure, why not.', won: 'We had them. We had ALL of them.', lost: 'We could not keep a straight face for one week.' } },
  { id: 'fake-exes', tier: 2, judged: 'bait', roles: 'pair', weeks: 1, reward: [7500, 10000], fail: 'none', belief: 'We used to be together', fit: ['strategic', 'social'], from: 'S10 (Julien and Bastien), S11 (Alain and Laura)',
    text: (a, b) => `${a} and ${b}: get somebody to buzz you on "we used to be together". It is not your secret.`,
    say: { give: 'We have a history now. A fake one. Let us make it juicy.', won: 'They buzzed it! They actually buzzed it!', lost: 'Nobody bit. Rude.' } },
  { id: 'best-enemies', tier: 2, judged: 'belief', roles: 'pair', weeks: 1, reward: [3000, 6000], fail: 'none', belief: 'We hate each other', fit: ['boldness', 'strategic'], from: 'S10, S11 ("meilleures ennemies")',
    text: (a, b) => `${a} and ${b}: you are best enemies. Make the house believe you cannot stand each other.`,
    say: { give: "We have to look like we can't stand each other. The truth is, I like working with the enemy.", won: 'The house picked sides in a fight that never happened.', lost: 'We kept laughing mid-argument.' } },
  { id: 'bait-a-buzz', tier: 2, judged: 'bait', roles: 'one', weeks: 1, reward: [5000, 8000], fail: 'none', belief: 'I was wrongly accused of something', fit: ['strategic', 'boldness'], from: 'S10 (Sarah: "I was wrongly accused")',
    text: a => `${a}, plant a fake secret about yourself and get somebody to buzz it.`,
    say: { give: 'A fake secret. Dropped just carefully enough.', won: 'Five thousand dollars, and theirs on top. Thank you very much.', lost: 'I dropped hints all week and nobody picked them up. Rude.' } },
  { id: 'get-nominated', tier: 2, judged: 'event', event: 'target-nominated', roles: 'one+target', weeks: 1, reward: [3000, 6000], fail: 'clue', sabotage: true, fit: ['strategic', 'social'], from: 'classic seasons',
    text: (a, _b, t) => `${a}, get ${t} nominated this week. Nobody may know you were asked.`,
    say: { give: 'Nothing personal. It is just a job.', won: 'Done. And nobody knows it was me.', lost: 'They survived the nominations. My fault.' } },
  { id: 'get-yourself-nominated', tier: 2, judged: 'event', event: 'self-nominated', roles: 'one', weeks: 1, reward: [4000, 8000], fail: 'none', fit: ['boldness'], from: 'S10 (Sarah and Thomas)',
    text: a => `${a}, make the house nominate you this week. If they do, you will be safe, and you will choose who takes your place.`,
    say: { give: 'I have to make them want me gone. Easy. I am very annoying.', won: 'They nominated me. Now watch what I do with it.', lost: 'Turns out they like me. Who knew.' } },
  { id: 'seduction', tier: 2, judged: 'bond', bond: 1, roles: 'one+target', weeks: 1, reward: [3000, 8000], fail: 'none', fit: ['social', 'boldness'], from: 'S5, S10, S11',
    text: (a, _b, t) => `${a}, make ${t} fall for you this week, without ${t} knowing why.`,
    say: { give: 'Seduce them. In a week. No pressure.', won: 'Did they fall for me? A little. Maybe a lot.', lost: 'They are immune to me. Which is fair.' } },
  { id: 'jealousy-test', tier: 2, judged: 'bond', bond: 1, roles: 'one+target', weeks: 1, reward: [5000, 10000], fail: 'none', fit: ['social', 'boldness'], from: 'S5 (Daniel and Morgane), S10 (Julien, Marvin, Darko)',
    text: (a, _b, t) => `${a}, get close to ${t} this week and see who in this house gets jealous.`,
    say: { give: 'I get to flirt and somebody gets hurt. Great.', won: 'It worked. Somebody is very, very upset.', lost: 'I stopped. I could see it was hurting somebody I care about.' } },
  { id: 'new-best-friend', tier: 2, judged: 'bond', bond: 1, roles: 'one+target', weeks: 1, reward: [5000, 10000], fail: 'none', fit: ['social', 'loyalty'], from: 'S10 (Julien and Sarah, $10,000)',
    text: (a, _b, t) => `${a}, become ${t}'s best friend in this house by the prime.`,
    say: { give: 'Make a new best friend in five days. I can do that.', won: 'They trust me with everything now. Everything.', lost: 'They are polite to me. That is not the same.' } },
  { id: 'nightmare-week', tier: 2, judged: 'bond', bond: -1, roles: 'one+target', weeks: 1, reward: [4000, 8000], fail: 'none', sabotage: true, fit: ['boldness', 'strategic'], from: 'S10 (the "diablotin" mission)',
    text: (a, _b, t) => `${a}, make ${t}'s week a nightmare, without ${t} ever suspecting it was you.`,
    say: { give: 'Little pranks. All week. They will never know.', won: 'They have no idea it was me. None.', lost: 'They caught me with the salt in the sugar bowl.' } },
  { id: 'sow-chaos', tier: 2, judged: 'event', event: 'feud', roles: 'pair', weeks: 1, reward: [4000, 8000], fail: 'none', sabotage: true, fit: ['strategic', 'boldness'], from: 'S11 (Noré and Kamila: "semer la zizanie")',
    text: (a, b) => `${a} and ${b}: sow chaos in the house this week. A real fight between two others counts.`,
    say: { give: 'Just a few words in the right ears.', won: 'Look at them go. We did that.', lost: 'This house is too nice. Unbelievable.' } },
  { id: 'find-a-secret', tier: 2, judged: 'event', event: 'right-buzz', roles: 'one', weeks: 1, reward: [3000, 5000], fail: 'clue', fit: ['intuition', 'mental'], from: 'S10 (Darko), S11 (Laura and Makao)',
    text: a => `${a}, find somebody's secret this week. Fail, and a clue about yours goes on the table.`,
    say: { give: 'Find a secret or lose a clue. Fantastic.', won: 'Found one. My secret stays mine.', lost: 'Nothing. And now everybody gets a clue about me.' } },
  { id: 'fake-immunity-card', tier: 2, judged: 'event', event: 'card-given', roles: 'one', weeks: 1, reward: [3000, 6000], fail: 'none', sabotage: true, fit: ['strategic', 'social'], from: 'S8, S10, S11',
    text: a => `${a}, give one housemate this card and tell them it is an immunity. It is a nomination.`,
    say: { give: 'A gift. A poisoned gift.', won: 'They thanked me. They actually thanked me.', lost: 'I could not do it to them.' } },
  { id: 'outside-contact', tier: 2, judged: 'belief', roles: 'one', weeks: 1, reward: [3000, 7000], fail: 'clue', belief: 'I have a contact on the outside', fit: ['strategic', 'boldness'], from: 'S4 (Bastien and the black phone)',
    text: a => `${a}, make the house believe you have a secret contact on the outside who tells you things.`,
    say: { give: 'I am going to be so mysterious.', won: 'Half the house asked me for news from home.', lost: 'Nobody believed I knew anything. Insulting.' } },
  { id: 'fake-reconciliation', tier: 2, judged: 'belief', roles: 'pair', weeks: 1, reward: [5000, 10000], fail: 'none', belief: 'We are back together', fit: ['social'], from: 'S6 (Capucine and Yoann)',
    text: (a, b) => `${a} and ${b}: make the house believe you are getting back together.`,
    say: { give: 'Back together. For the cameras. Right.', won: 'The house threw us a party. We are terrible people.', lost: 'Nobody believed us for a second.' } },
  // ── tier 3: small missions that colour a week ──
  { id: 'servant-week', tier: 3, judged: 'endurance', roles: 'one', weeks: 1, reward: [1000, 3000], fail: 'none', fit: ['temperament', 'endurance'], from: 'S11 (Tanya and the bell)',
    text: a => `${a}, until the prime you serve the house: breakfast in bed, every morning, with a smile.`,
    say: { give: 'Breakfast. For everyone. Every morning. With a smile. Fine.', won: 'Done. My cooking is famous now.', lost: 'Day three I threw the toast at somebody.' } },
  { id: 'costume-week', tier: 3, judged: 'endurance', roles: 'one', weeks: 1, reward: [1000, 3000], fail: 'none', fit: ['boldness', 'temperament'], from: 'the Voice\'s forfeits',
    text: a => `${a}, wear the Voice's costume until the prime, day and night, without a word of explanation.`,
    say: { give: 'Nobody asks, I do not tell. I look incredible.', won: 'A week in that thing. I deserve every cent.', lost: 'It itched. I am only human.' } },
  { id: 'hug-a-nominee', tier: 3, judged: 'endurance', roles: 'one', weeks: 1, reward: [1000, 1000], fail: 'none', fit: ['social'], from: 'S10 (the viewers\' mission, $1,000)',
    text: a => `${a}, the viewers want you to hug one of this week's nominees for a full minute.`,
    say: { give: 'A long hug. I can do long hugs.', won: 'A full minute. They held on even longer.', lost: 'Forty seconds and they wriggled away.' } },
  { id: 'secret-kiss', tier: 3, judged: 'endurance', roles: 'pair', weeks: 1, reward: [1000, 3000], fail: 'clue', fit: ['boldness', 'social'], from: 'S11 (Charlène and Benoît, the kiss on the cross)',
    text: (a, b) => `${a} and ${b}: once a day, kiss on the spot the Voice marks, without anybody seeing. Get caught, and a clue goes out.`,
    say: { give: 'A secret kiss a day. In this house. With cameras everywhere. Sure.', won: 'Five days, five kisses, zero witnesses.', lost: 'Somebody walked in. Of course somebody walked in.' } },
  { id: 'rhyme-week', tier: 3, judged: 'endurance', roles: 'one', weeks: 1, reward: [1000, 2500], fail: 'none', fit: ['mental', 'boldness'], from: 'the Voice\'s dares',
    text: a => `${a}, until the prime, every sentence you say must rhyme.`,
    say: { give: 'Every line must rhyme. Oh what a crime.', won: 'Five days of rhymes, a dozen good times.', lost: 'Day two I forgot. I said "pass the salt". No rhyme.' } },
  { id: 'cry-once-a-day', tier: 3, judged: 'endurance', roles: 'one', weeks: 1, reward: [1000, 3000], fail: 'none', fit: ['social', 'boldness'], from: 'the Voice\'s dares',
    text: a => `${a}, cry in front of the house once a day, about something you invent.`,
    say: { give: 'Fake tears on demand. I was born for this.', won: 'Five days. Five breakdowns. Not one real.', lost: 'I laughed in the middle of one. Ruined it.' } },
  { id: 'compliment-everyone', tier: 3, judged: 'endurance', roles: 'one', weeks: 1, reward: [1000, 2000], fail: 'none', fit: ['social'], from: 'the Voice\'s dares',
    text: a => `${a}, pay every housemate a sincere compliment every day.`,
    say: { give: 'Compliments. All day. Even to the ones I cannot stand.', won: 'Everybody likes me now. Suspicious, but nice.', lost: 'There is one person I just could not.' } },
];

export const missionById = id => MISSIONS.find(m => m.id === id) || null;
const pick = (arr, rng) => arr[Math.floor(rng() * arr.length)];
const fitOf = (ctx, n, entry) => entry.fit.reduce((s, k) => s + st(ctx, n, k), 0);
const TIER_W = { 1: 0.07, 2: 0.66, 3: 0.27 };

export function missionsOf(state) { state.missions ||= []; state.missionsUsed ||= []; return state.missions; }

/** Draw a mission nobody has had this season, by tier, that suits somebody free. */
function drawMission(state, ctx, free, rng) {
  const used = new Set(state.missionsUsed);
  const hadBig = state.missions.some(m => missionById(m.missionId)?.tier === 1);
  let r = rng() * (TIER_W[1] + TIER_W[2] + TIER_W[3]);
  let tier = r < TIER_W[1] ? 1 : r < TIER_W[1] + TIER_W[2] ? 2 : 3;
  if (tier === 1 && (hadBig || (ctx.week ?? 0) > 6)) tier = 2;
  const pool = MISSIONS.filter(e => e.tier === tier && !used.has(e.id) && (!e.roles.startsWith('pair') || free.length >= 2));
  const any = pool.length ? pool : MISSIONS.filter(e => e.tier !== 1 && !used.has(e.id));
  return any.length ? pick(any, rng) : null;
}

/**
 * Monday: the Voice hands out this week's missions (1–2). Returns the acts.
 * Nobody holds two at once; partners in a shared secret are never paired.
 */
export function handOutMissions(state, ctx, { house = [], count = null } = {}) {
  const rng = ctx.rng || Math.random;
  const week = ctx.week ?? 0;
  const list = missionsOf(state);
  const busy = new Set(list.filter(m => m.status === 'active').flatMap(m => m.holders));
  const free = house.filter(n => !busy.has(n));
  const n = count ?? (rng() < 0.45 ? 2 : 1);
  const acts = [];
  for (let i = 0; i < n && free.length >= 1; i++) {
    const e = drawMission(state, ctx, free, rng);
    if (!e) break;
    const able = free.filter(x => !e.sabotage || canSabotage(ctx, x)).sort((a, b) => fitOf(ctx, b, e) - fitOf(ctx, a, e));
    if (!able.length) { state.missionsUsed.push(e.id); continue; }
    const a = able[Math.floor(rng() * Math.min(3, able.length))];
    const others = free.filter(x => x !== a && !(secretOf(state, a)?.holders || []).includes(x));
    const b = e.roles.startsWith('pair') ? others.sort((x, y) => fitOf(ctx, y, e) - fitOf(ctx, x, e))[0] : null;
    if (e.roles.startsWith('pair') && !b) continue;
    const target = e.roles.endsWith('target') ? pick(house.filter(x => x !== a && x !== b), rng) : null;
    const holders = [a, b].filter(Boolean);
    const reward = e.reward[0] + Math.round(rng() * ((e.reward[1] - e.reward[0]) / 500)) * 500;
    const m = { id: `m${week}-${list.length}`, missionId: e.id, tier: e.tier, week, holders, target, text: e.text(a, b, target), reward,
      status: 'active', deadlineWeek: week + e.weeks - 1 };
    list.push(m);
    state.missionsUsed.push(e.id);
    for (const h of holders) { const k = free.indexOf(h); if (k >= 0) free.splice(k, 1); }
    acts.push({ type: 'ss-mission', week, mission: { ...m, say: e.say.give, from: e.from },
      beats: [{ text: `The Voice gives ${holders.join(' and ')} a secret mission.`, players: holders, badgeText: e.tier === 1 ? 'BIG MISSION' : 'MISSION', badgeClass: 'gold', part: 'mission' }] });
  }
  return acts;
}

/**
 * During the week, every active mission is PLAYED by its family:
 *   belief  the act reads as real to the unperceptive (and may bait a buzz)
 *   bait    the holders drop hints toward the fake
 *   bond    the holder works on the target; the bond moves with their skill
 *   others  nothing to do until the prime
 * Returns the bond changes so the engine can apply them.
 */
export function playMissions(state, ctx, { house = [] } = {}) {
  const rng = ctx.rng || Math.random;
  const bonds = [];
  for (const m of missionsOf(state).filter(x => x.status === 'active')) {
    const e = missionById(m.missionId);
    if (!e) continue;
    if (e.judged === 'belief' || e.judged === 'bait') {
      const perf = m.holders.reduce((s, h) => s + st(ctx, h, 'social') + st(ctx, h, 'strategic'), 0) / (m.holders.length * 20);
      m.belief ||= {};
      for (const v of house.filter(x => !m.holders.includes(x))) {
        const fooled = clamp(perf * 0.9 - st(ctx, v, 'intuition') / 10 * 0.45 + 0.25 + (rng() - 0.5) * 0.1);
        m.belief[v] = Math.round(Math.max(m.belief[v] || 0, fooled) * 100) / 100;
        const strength = e.judged === 'bait' ? 0.2 : 0.12;
        if (fooled > 0.5 && m.holders[0] && e.belief) addEvidence(state, ctx, v, m.holders[0], { strength, how: 'mission', toward: e.belief });
      }
    } else if (e.judged === 'bond' && m.target) {
      const skill = fitOf(ctx, m.holders[0], e) / (e.fit.length * 10);
      const delta = Math.round(e.bond * (0.4 + skill * 1.2 + (rng() - 0.5) * 0.6) * 10) / 10;
      bonds.push([m.target, m.holders[0], delta]);
    }
  }
  return bonds;
}

/** What the engine tells the judge about the week (nominees, buzzes, feuds). */
function happened(state, ctx, m, e, { nominees = [], feuds = 0, week }) {
  switch (e.event) {
    case 'target-nominated': return nominees.includes(m.target);
    case 'self-nominated': return nominees.includes(m.holders[0]);
    case 'right-buzz': return (state.buzzes || []).some(b => b.week === week && b.by === m.holders[0] && b.outcome === 'right');
    case 'card-given': return (ctx.rng || Math.random)() < clamp(0.4 + st(ctx, m.holders[0], 'strategic') / 20);
    case 'feud': return feuds > 0;
    default: return false;
  }
}

/**
 * The prime: every mission that reaches its deadline is judged and revealed.
 * A failure may cost a clue on the holder's own secret, or (an exposed
 * infiltrator) a nomination d'office the next week.
 */
export function settleMissions(state, ctx, { house = [], nominees = [], feuds = 0 } = {}) {
  const rng = ctx.rng || Math.random;
  const week = ctx.week ?? 0;
  const acts = [];
  for (const m of missionsOf(state).filter(x => x.status === 'active' && x.deadlineWeek <= week)) {
    const e = missionById(m.missionId);
    if (!e) { m.status = 'failed'; continue; }
    let won;
    if (e.judged === 'belief') {
      const vals = Object.values(m.belief || {});
      won = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length >= 0.5 : false;
    } else if (e.judged === 'bait') {
      won = (state.buzzes || []).some(b => b.week >= m.week && m.holders.includes(b.target) && b.guess === e.belief);
    } else if (e.judged === 'bond') {
      const b = ctx.bond?.(m.target, m.holders[0]) ?? 0;
      won = e.bond > 0 ? b >= 2.5 : b <= -1.5;
    } else if (e.judged === 'event') {
      won = happened(state, ctx, m, e, { nominees, feuds, week });
    } else {
      won = rng() < clamp(0.35 + fitOf(ctx, m.holders[0], e) / (e.fit.length * 20));
    }
    m.status = won ? 'won' : 'failed';
    let clue = null;
    if (won) for (const h of m.holders) mint(state, h, m.reward, `mission: ${e.id}`, week);
    else if (e.fail === 'clue' && m.holders[0] && secretOf(state, m.holders[0]) && !secretOf(state, m.holders[0]).found) {
      clue = showClue(state, ctx, { holder: m.holders[0], how: 'mission', house });
    } else if (e.fail === 'd-office') {
      state.rules ||= { log: [], dOffice: {}, extraVotes: {}, house: {} };
      (state.rules.dOffice[week + 1] ||= []).push(m.holders[0]);
    }
    acts.push({ type: 'ss-mission-result', week, mission: { ...m, from: e.from }, won, clue: clue?.clue || null, say: won ? e.say.won : e.say.lost,
      beats: [{ text: won ? `${m.holders.join(' and ')} pulled off the Voice's mission and win $${m.reward.toLocaleString('en-US')}${m.holders.length > 1 ? ' each' : ''}.`
        : `${m.holders.join(' and ')} failed the Voice's mission.${clue ? ' A clue about their secret goes on the table.' : ''}`,
      players: m.holders, badgeText: won ? 'MISSION ACCOMPLISHED' : 'MISSION FAILED', badgeClass: won ? 'gold' : 'red', part: 'mission' }] });
  }
  return acts;
}
