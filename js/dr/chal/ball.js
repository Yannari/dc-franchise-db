// ══════════════════════════════════════════════════════════════════════
// dr/chal/ball.js — three looks, and only one of them is hers to build
// ══════════════════════════════════════════════════════════════════════
//
// The Ball is the one night the runway IS the challenge, which is why it is
// the only design challenge that walks (the user's rule: three runways a
// season, two themed and one design, and a design challenge does not add a
// fourth). So `perform` hands the week a `runwayOverride` — three walks
// instead of one — rather than scoring a look nobody sees.
//
// Two of the three looks she brought in a suitcase. The third she cut and
// sewed this morning, and it counts DOUBLE, because it is the only one that
// tells the panel something they did not already know about her.
import { prepareRoom, walkthrough } from '../prep.js';
import { dragOf } from '../queen.js';
import { noise } from '../perform.js';
import { evt } from '../rules.js';

// Twelve sets of three. Exactly one category per set is built in the werk
// room, and it is always the conceptual one — you pull a gown, you do not pull
// a storm.
export const BALL_THEMES = [
  { id: 'night-of-a-thousand', name: 'Night of a Thousand Somethings', categories: [
    { label: 'Opening number realness', styles: ['broadway', 'glamour'], sewn: false },
    { label: 'Street couture', styles: ['fashion', 'club-kid'], sewn: false },
    { label: 'Built from the archive', styles: ['art', 'fashion'], sewn: true }] },
  { id: 'monster-ball', name: 'The Monster Ball', categories: [
    { label: 'Beautiful nightmare', styles: ['spooky', 'art'], sewn: false },
    { label: 'Creature of the deep', styles: ['art', 'camp'], sewn: false },
    { label: 'Homemade horror', styles: ['spooky', 'camp'], sewn: true }] },
  { id: 'pageant-ball', name: 'The Pageant Ball', categories: [
    { label: 'Swimwear', styles: ['pageant', 'glamour'], sewn: false },
    { label: 'Evening gown', styles: ['pageant', 'glamour'], sewn: false },
    { label: 'Costume of your hometown', styles: ['pageant', 'camp'], sewn: true }] },
  { id: 'metals-ball', name: 'The Precious Metals Ball', categories: [
    { label: 'Solid gold', styles: ['glamour', 'fashion'], sewn: false },
    { label: 'Silver screen', styles: ['glamour', 'broadway'], sewn: false },
    { label: 'Scrap metal couture', styles: ['art', 'club-kid'], sewn: true }] },
  { id: 'travel-ball', name: 'The Departures Ball', categories: [
    { label: 'Airport arrivals', styles: ['fashion', 'glamour'], sewn: false },
    { label: 'Holiday of a lifetime', styles: ['camp', 'club-kid'], sewn: false },
    { label: 'Built from the duty free', styles: ['art', 'camp'], sewn: true }] },
  { id: 'flora-ball', name: 'The Flora and Fauna Ball', categories: [
    { label: 'Garden party', styles: ['glamour', 'pageant'], sewn: false },
    { label: 'Bird of paradise', styles: ['art', 'club-kid'], sewn: false },
    { label: 'Grown, not bought', styles: ['art', 'fashion'], sewn: true }] },
  { id: 'decades-ball', name: 'The Decades Ball', categories: [
    { label: 'Silver screen siren', styles: ['glamour', 'broadway'], sewn: false },
    { label: 'Disco inferno', styles: ['dancer', 'club-kid'], sewn: false },
    { label: 'The future, as we imagined it', styles: ['art', 'fashion'], sewn: true }] },
  { id: 'royal-ball', name: 'The Royal Ball', categories: [
    { label: 'Coronation', styles: ['pageant', 'glamour'], sewn: false },
    { label: 'Scandal at court', styles: ['camp', 'spooky'], sewn: false },
    { label: 'Crown jewels, self-made', styles: ['art', 'fashion'], sewn: true }] },
  { id: 'sport-ball', name: 'The Sport Ball', categories: [
    { label: 'Opening ceremony', styles: ['dancer', 'pageant'], sewn: false },
    { label: 'Locker room', styles: ['club-kid', 'camp'], sewn: false },
    { label: 'Trophy, built', styles: ['art', 'camp'], sewn: true }] },
  { id: 'paper-ball', name: 'The Paper Ball', categories: [
    { label: 'Newsprint', styles: ['fashion', 'art'], sewn: false },
    { label: 'Wrapping paper', styles: ['camp', 'club-kid'], sewn: false },
    { label: 'Origami couture', styles: ['art', 'fashion'], sewn: true }] },
  { id: 'weather-ball', name: 'The Elements Ball', categories: [
    { label: 'Fire', styles: ['club-kid', 'dancer'], sewn: false },
    { label: 'Water', styles: ['art', 'glamour'], sewn: false },
    { label: 'Storm, constructed', styles: ['art', 'spooky'], sewn: true }] },
  { id: 'hometown-ball', name: 'The Hometown Ball', categories: [
    { label: 'Where you are from', styles: ['pageant', 'camp'], sewn: false },
    { label: 'Where you are going', styles: ['fashion', 'glamour'], sewn: false },
    { label: 'Made at home', styles: ['art', 'broadway'], sewn: true }] },
];

export const ballThemeById = id => BALL_THEMES.find(t => t.id === id) || null;

export function assign(ctx) {
  const { living, rng, cfg } = ctx;
  const theme = ballThemeById(cfg?.ballTheme)
    || BALL_THEMES[Math.floor(rng() * BALL_THEMES.length)];
  const roles = Object.fromEntries(living.map(n => [n, 'standard']));
  return {
    roles, teams: [], order: [...living], picks: {}, events: [], theme,
    scenes: [{ step: 'maxi-announce', kind: 'ball-theme', data: { theme } }],
  };
}

export function prepare(ctx) {
  const { living, players, rng } = ctx;
  const r = prepareRoom(ctx);
  const w = walkthrough({ ...ctx, prep: r.prep });
  const events = [...r.events, ...w.events];
  const build = {};

  for (const n of living) {
    const d = dragOf(players[n]);
    // Prep weighs more here than anywhere else in the show. A day at the
    // sewing machine IS the challenge, so helping somebody through theirs is
    // what makes their garment close — and sabotage is what stops it.
    const q = d.design * 0.7 + (w.prep[n] || 0) * 1.2 + noise(rng, 2);
    build[n] = Math.round(q * 100) / 100;
    if (q < 3.5) {
      events.push(evt('wardrobe-malfunction', {
        players: [n], pop: { [n]: -2 },
        state: { [`malfunction:${n}`]: true },
        data: { quality: build[n] },
      }));
    } else if (q > 8) {
      events.push(evt('showstopper', {
        players: [n], pop: { [n]: 3 },
        state: { [`showstopper:${n}`]: true },
        data: { quality: build[n] },
      }));
    }
  }

  return {
    prep: w.prep, events, buildQuality: build,
    scenes: [...r.scenes, { step: 'prep', kind: 'ball-build', data: { build } }],
  };
}

export function perform(ctx) {
  const { living, players, assignment, prep, rng, buildQuality } = ctx;
  const theme = assignment.theme || BALL_THEMES[0];
  const performances = {};

  for (const n of living) {
    const d = dragOf(players[n]);
    const looks = theme.categories.map(c => {
      // The sewn look is scored on what she can MAKE and on how the making
      // actually went; the two pulled looks on how she wears them.
      const craft = c.sewn ? d.design : d.runway;
      const fit = c.styles.includes(d.style) ? 1.5 : 0;
      const built = c.sewn ? ((buildQuality?.[n] ?? 5) - 5) * 0.5 : 0;
      const s = craft * 0.8 + fit + built + (prep[n] || 0) + noise(rng, 1.8);
      return { label: c.label, sewn: !!c.sewn, score: Math.round(s * 100) / 100, fit: fit > 0 };
    });

    const weights = looks.map(l => (l.sewn ? 2 : 1));
    const perf = looks.reduce((s, l, i) => s + l.score * weights[i], 0)
      / weights.reduce((a, b) => a + b, 0);

    performances[n] = {
      perf: Math.round(perf * 100) / 100,
      moment: looks.some(l => l.score > 9.5),
      risk: (Number(players[n]?.stats?.boldness) || 5) / 10,
      role: 'standard', team: null,
      parts: { prep: prep[n] || 0, build: buildQuality?.[n] ?? null },
      detail: { theme: theme.name, themeId: theme.id, looks },
    };
  }

  return {
    performances,
    events: [],
    runwayOverride: {
      theme: theme.name,
      walks: theme.categories.map(c => ({
        category: c.label, sewn: !!c.sewn, categoryStyles: c.styles,
      })),
    },
    scenes: [{ step: 'maxi-main', kind: 'ball-walks', data: { theme: theme.name } }],
  };
}
