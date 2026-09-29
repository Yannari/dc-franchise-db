// ══════════════════════════════════════════════════════════════════════
// ci/life.js — alone in the apartment, and a video from home (spec §13.5–6)
// ══════════════════════════════════════════════════════════════════════
//
// Between chats the real show watches players alone: a workout on the small
// treadmill, a long skincare routine, a kitchen disaster, talking to a stuffed
// animal (the host: "while Ed makes little steps in the gym"). Each profile
// has two habits drawn from who they are, and they recur, so the audience
// learns them. The loneliest are the ones we see.
//
// Videos from home (1×07: a best friend, a wife and a dog) are private to the
// apartment. They ease homesickness sharply; a catfish also hears the life
// the profile is hiding.
import { S, addScene } from './state.js';
import { feel, mood } from './mind.js';

export const HABITS = ['workout', 'skincare', 'cooking', 'reading', 'singing', 'plushie', 'praying', 'pacing'];
const WEIGHT = {
  workout: (st, h) => S(st, h, 'physical'),
  skincare: (st, h) => S(st, h, 'social'),
  cooking: () => 5,
  reading: (st, h) => S(st, h, 'mental'),
  singing: (st, h) => S(st, h, 'boldness'),
  plushie: (st, h) => 10 - S(st, h, 'social'),
  praying: (st, h) => S(st, h, 'loyalty') * 0.6,
  pacing: (st, h) => S(st, h, 'strategic') * 0.6,
};
export const LIFE_PER_DAY = 2;

/** A profile's two habits, drawn once (proportional to stats) and kept all season. */
export function habitsOf(state, rng, h) {
  const book = (state.habits ||= {});
  if (book[h]) return book[h];
  const picked = [];
  for (let k = 0; k < 2; k++) {
    const opts = HABITS.filter(x => !picked.includes(x)).map(x => [x, Math.max(0.1, WEIGHT[x](state, h))]);
    let r = rng() * opts.reduce((s, [, w]) => s + w, 0);
    picked.push((opts.find(([, w]) => (r -= w) <= 0) || opts.at(-1))[0]);
  }
  return (book[h] = picked);
}

/** Today's life scenes: the loneliest and most stressed, doing what they do. */
export function apartmentLife(state, rng) {
  for (const h of state.active) habitsOf(state, rng, h);
  const who = [...state.active]
    .map(h => [h, mood(state, h, 'loneliness') + mood(state, h, 'stress') + rng() * 2])
    .sort((a, b) => b[1] - a[1]).slice(0, LIFE_PER_DAY).map(([h]) => h);
  return who.map(h => {
    const habit = state.habits[h][Math.floor(rng() * state.habits[h].length)];
    const sc = addScene(state, 'life', [h], { habit }, [h]);
    if (habit === 'pacing') feel(state, h, 'paranoia', 0.5);
    else feel(state, h, 'loneliness', -0.8);
    return sc;
  });
}

/** A message from home, one per player, seen only in their apartment. */
export function videoFromHome(state, rng, handles) {
  const seen = (state.homeVideosSeen ||= []);
  return handles.filter(h => state.active.includes(h)).map(h => {
    const catfish = state.profiles[h]?.mode === 'catfish';
    const sc = addScene(state, 'home-video', [h], { catfish }, [h]);
    feel(state, h, 'homesick', -4);
    feel(state, h, 'loneliness', -3);
    feel(state, h, 'elation', 2);
    if (catfish) feel(state, h, 'guilt', 1.5);
    if (!seen.includes(h)) seen.push(h);
    return sc;
  });
}
