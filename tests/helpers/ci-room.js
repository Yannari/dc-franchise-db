// A small Circle room for engine tests: n honest profiles, flat stats.
import { setGs } from '../../js/core.js';
import { newState } from '../../js/ci/state.js';
import { initMind } from '../../js/ci/mind.js';

const STATS = { physical: 5, endurance: 5, mental: 5, social: 5, strategic: 5, loyalty: 5, boldness: 5, intuition: 5, temperament: 5 };
export function room(n = 8, seed = 3) {
  setGs({ bonds: {}, relationshipDimensions: {}, episodeHistory: [] });
  const s = newState(seed);
  s.day = 1;
  for (let i = 0; i < n; i++) {
    const name = `Q${i}`, handle = `@q${i}`;
    // A neutral register (warm changes no text), so tests can read exact wording.
    s.people[name] = { name, gender: i % 2 ? 'm' : 'f', sexuality: 'straight', archetype: 'floater', stats: { ...STATS }, age: 25,
      chatVoice: { register: 'warm' } };
    s.profiles[handle] = { handle, players: [name], mode: 'honest', gap: 0,
      shown: { name: `Q${i}`, gender: i % 2 ? 'm' : 'f', age: 25 }, voice: { emoji: 0.5, hashtags: 0.5, caps: 0 } };
    s.handleOf[name] = handle; s.active.push(handle); initMind(s, handle);
  }
  return s;
}

