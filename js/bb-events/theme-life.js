// ══════════════════════════════════════════════════════════════════════
// bb-events/theme-life.js — the season's theme, as something that happens to the house
// ══════════════════════════════════════════════════════════════════════
//
// The user, 2026-10-15: the dialogue did not change with the theme. bb/story/theme-texture.js puts the theme in
// the house's lines; these are the theme's own scenes, and every one of them moves something (CLAUDE.md: camp
// events must have consequences): AINSLEY singles somebody out, or plays back what somebody said at three in the
// morning; somebody is seen by the Den's door; a new door in the hotel and an accusation; chips counted in
// public; an activity that pairs two people who would never have chosen each other; a caption read out over the
// intercom. One a week per event at most, and only in its own theme (and mood, where the turn changes it).
//
// The theme and its mood are the week's record (week.themeId, week.themeMood), not today's state.

import { pStats, band, firedThisWeek } from './_read.js';
import { getBond } from '../bonds.js';
import { makeScene } from '../bb/script/scene.js';

const _reactable = ctx => ctx?.act === 'house' || ctx?.act === 'campaign';
const themeIs = (ctx, id) => ctx?.week?.themeId === id;
const hostile = ctx => ctx?.week?.themeMood === 'hostile';
const weekNum = ctx => Number(ctx?.week?.num) || 0;
const others = (house, ...ex) => house.filter(n => n && !ex.includes(n));
// the pair who like each other least, and the pair closest to neutral (for a forced activity)
// ...one of the three coldest, by the week, so the same two are not tied together every week
function coldestPair(house, week = 0) {
  const pairs = [];
  for (let i = 0; i < house.length; i++) for (let j = i + 1; j < house.length; j++) pairs.push([house[i], house[j], getBond(house[i], house[j])]);
  pairs.sort((x, y) => x[2] - y[2]);
  return pairs.length ? pairs[week % Math.min(3, pairs.length)] : null;
}
// one of the three people who fit best, by the week (the sharpest watcher every week reads as the same scene)
const rotate = (list, week) => list[week % Math.max(1, Math.min(3, list.length))];
const pick = (list, salt) => list[[...String(salt)].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7) % list.length];

// ── Machine: AINSLEY singles somebody out ─────────────────────────────────
const coraPraises = {
  id: 'theme-cora-praises',
  category: 'house-life',
  weight(house, ctx) {
    if (!_reactable(ctx) || !themeIs(ctx, 'machine-summer') || house.length < 4) return 0;
    if (firedThisWeek('theme-cora-praises', weekNum(ctx))) return 0;
    return band(12);
  },
  fire(house, ctx, api) {
    // the one AINSLEY praises: the most social (she likes the people who talk to her); the one it grates on: who
    // likes them least
    const b = [...house].sort((x, y) => pStats(y).social - pStats(x).social)[weekNum(ctx) % 2];
    const a = others(house, b, ctx.hoh).sort((x, y) => getBond(x, b) - getBond(y, b))[0];
    if (!a || !b) return null;
    const scene = makeScene('theme.cora.praise', { a, b }, { ending: hostile(ctx) ? 'hostile' : 'neutral' }, house, 'living-room');
    api.addBond(a, b, -0.6);
    api.suspicion(a, b, 0.5);
    api.popDelta(b, hostile(ctx) ? -1 : 1);
    return { scene, players: [b, a], badgeText: "AINSLEY'S FAVOURITE", badgeClass: 'grey' };
  },
};

// ── Machine, after the turn: AINSLEY plays back what somebody said ────────
const coraReplays = {
  id: 'theme-cora-replays',
  category: 'social',
  weight(house, ctx) {
    if (!_reactable(ctx) || !themeIs(ctx, 'machine-summer') || !hostile(ctx) || house.length < 4) return 0;
    if (firedThisWeek('theme-cora-replays', weekNum(ctx))) return 0;
    return band(13);
  },
  fire(house, ctx, api) {
    const pair = coldestPair(house, weekNum(ctx));
    if (!pair) return null;
    const [a, b] = pair;
    const scene = makeScene('theme.cora.replay', { a, b }, { ending: 'scene' }, house, 'living-room');
    // b now knows exactly what a said, word for word, with a timestamp
    api.addBond(b, a, -1.6);
    api.remember(b, a, 'grudge', 2, { about: 'AINSLEY played back what they said about me' });
    api.popDelta(a, -1);
    return { scene, players: [a, b], badgeText: 'PLAYED BACK', badgeClass: 'red' };
  },
};

// ── Temptation: seen by the Den's door ─────────────────────────────────
const denDoor = {
  id: 'theme-den-door',
  category: 'social',
  weight(house, ctx) {
    if (!_reactable(ctx) || !themeIs(ctx, 'summer-of-temptation') || house.length < 3) return 0;
    if (firedThisWeek('theme-den-door', weekNum(ctx))) return 0;
    return band(12);
  },
  fire(house, ctx, api) {
    const b = pick(others(house, ctx.hoh), `den|${weekNum(ctx)}`);
    const a = rotate(others(house, b).sort((x, y) => pStats(y).intuition - pStats(x).intuition), weekNum(ctx));
    if (!a || !b) return null;
    // whether the one who saw it makes something of it is the watcher's nerve, not a coin
    const caught = pStats(a).boldness >= pStats(b).temperament;
    const scene = makeScene('theme.den.seen', { a, b }, { ending: caught ? 'caught' : 'shrug' }, [a, b], 'living-room');
    api.suspicion(a, b, caught ? 1.1 : 0.5);
    if (caught) api.addBond(b, a, -0.5);
    return { scene, players: [a, b], badgeText: caught ? 'BY THE DEN' : 'SEEN', badgeClass: caught ? 'red' : 'grey' };
  },
};

// ── Mystery: a door that was not there yesterday ───────────────────────
const hotelDoor = {
  id: 'theme-hotel-door',
  category: 'social',
  weight(house, ctx) {
    if (!_reactable(ctx) || !themeIs(ctx, 'summer-of-mystery') || house.length < 3) return 0;
    if (firedThisWeek('theme-hotel-door', weekNum(ctx))) return 0;
    return band(12);
  },
  fire(house, ctx, api) {
    const pair = coldestPair(others(house, ctx.hoh), weekNum(ctx));
    if (!pair) return null;
    const [a, b] = pair;
    const scene = makeScene('theme.hotel.door', { a, b }, { ending: hostile(ctx) ? 'hostile' : 'neutral' }, [a, b], 'living-room');
    // a decides b knows more about this hotel than b is saying: the accomplice, maybe
    api.suspicion(a, b, 0.9);
    api.addBond(a, b, -0.4);
    return { scene, players: [a, b], badgeText: 'THE ACCOMPLICE?', badgeClass: 'grey' };
  },
};

// ── High Roller's: chips counted where people can see ──────────────────
const chipCount = {
  id: 'theme-chip-count',
  category: 'social',
  weight(house, ctx) {
    if (!_reactable(ctx) || !themeIs(ctx, 'high-rollers') || house.length < 3) return 0;
    if (firedThisWeek('theme-chip-count', weekNum(ctx))) return 0;
    return band(12);
  },
  fire(house, ctx, api) {
    const b = [...house].sort((x, y) => pStats(y).strategic - pStats(x).strategic)[weekNum(ctx) % 2];
    const a = rotate(others(house, b).sort((x, y) => pStats(y).intuition - pStats(x).intuition), weekNum(ctx));
    if (!a || !b) return null;
    // the privacy rule: what anybody holds is never said, only that they were seen counting
    const scene = makeScene('theme.floor.chips', { a, b }, { ending: hostile(ctx) ? 'hostile' : 'neutral' }, [a, b], 'kitchen');
    api.suspicion(a, b, 0.7);
    api.remember(a, b, 'saving-for-something', 1, { twist: 'high-rollers' });
    return { scene, players: [a, b], badgeText: 'COUNTING', badgeClass: 'grey' };
  },
};

// ── Summer Camp: an activity nobody chose their partner for ────────────
const campActivity = {
  id: 'theme-camp-activity',
  category: 'house-life',
  weight(house, ctx) {
    if (!_reactable(ctx) || !themeIs(ctx, 'summer-camp') || hostile(ctx) || house.length < 4) return 0;
    if (firedThisWeek('theme-camp-activity', weekNum(ctx))) return 0;
    return band(12);
  },
  fire(house, ctx, api) {
    const pair = coldestPair(house, weekNum(ctx));
    if (!pair) return null;
    const [a, b, bond] = pair;
    // a three-legged race either breaks the ice or proves the point; temperament decides which
    const bonded = bond > -4 && pStats(a).temperament + pStats(b).temperament >= 10;
    const scene = makeScene('theme.camp.activity', { a, b }, { ending: bonded ? 'bonded' : 'bickered' }, house, 'backyard');
    api.addBond(a, b, bonded ? 0.9 : -0.6);
    return { scene, players: [a, b], badgeText: bonded ? 'TIED TOGETHER' : 'THREE-LEGGED', badgeClass: bonded ? 'green' : 'red' };
  },
};

// ── Summer Camp, after the turn: nobody in charge ──────────────────────
// The announcements have stopped; somebody tries to run the camp's chore board, and the house either follows or
// makes a point of not following.
const campSilence = {
  id: 'theme-camp-silence',
  category: 'house-life',
  weight(house, ctx) {
    if (!_reactable(ctx) || !themeIs(ctx, 'summer-camp') || !hostile(ctx) || house.length < 3) return 0;
    if (firedThisWeek('theme-camp-silence', weekNum(ctx))) return 0;
    return band(12);
  },
  fire(house, ctx, api) {
    const a = rotate([...house].sort((x, y) => pStats(y).boldness - pStats(x).boldness), weekNum(ctx));
    const b = others(house, a).sort((x, y) => getBond(x, a) - getBond(y, a))[0];
    if (!a || !b) return null;
    const followed = getBond(a, b) >= 0 || pStats(b).loyalty >= 6;
    const scene = makeScene('theme.camp.silence', { a, b }, { ending: followed ? 'followed' : 'refused' }, house, 'kitchen');
    if (followed) { api.addBond(a, b, 0.5); api.popDelta(a, 1); } else { api.addBond(a, b, -0.7); api.addBond(b, a, -0.5); }
    return { scene, players: [a, b], badgeText: followed ? 'IN CHARGE NOW' : 'NOT YOUR CAMP', badgeClass: followed ? 'green' : 'red' };
  },
};

// ── Summer School: a caption read out over the intercom ────────────────
const yearbookCaption = {
  id: 'theme-yearbook-caption',
  category: 'social',
  weight(house, ctx) {
    if (!_reactable(ctx) || !themeIs(ctx, 'summer-school') || hostile(ctx) || house.length < 3) return 0;
    if (firedThisWeek('theme-yearbook-caption', weekNum(ctx))) return 0;
    return band(12);
  },
  fire(house, ctx, api) {
    const b = [...house].sort((x, y) => pStats(y).strategic - pStats(x).strategic)[weekNum(ctx) % 3] || house[0];
    const a = others(house, b).sort((x, y) => getBond(x, b) - getBond(y, b))[0];
    if (!a || !b) return null;
    const stung = pStats(b).temperament <= 5;
    const scene = makeScene('theme.yearbook.caption', { a, b }, { ending: stung ? 'stung' : 'laughs' }, house, 'living-room');
    // the caption says what half the house was already thinking about b
    api.suspicion(a, b, 0.6);
    if (stung) api.addBond(b, a, -0.5);
    return { scene, players: [b, a], badgeText: 'CAPTIONED', badgeClass: 'grey' };
  },
};

export const THEME_LIFE_EVENTS = [coraPraises, coraReplays, denDoor, hotelDoor, chipCount, campActivity, campSilence, yearbookCaption];
