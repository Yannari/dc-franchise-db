// SCRATCH (delete by exact name): the ids the ping-pong ratchet still counts
import { it } from 'vitest';
import { writeFileSync } from 'fs';
import { STORY_POOLS } from '../js/bb/story/lines/index.js';
import { POOLS } from '../js/bb/script/lines/index.js';
import { pingPong } from './bb-voice-variants.test.js';
it('lists', () => {
  const ALL = { ...STORY_POOLS, ...POOLS };
  const ids = Object.entries(ALL).flatMap(([k, l]) => (Array.isArray(l) ? l : []).filter(pingPong).map(e => k + ' ' + e.id));
  writeFileSync(process.env.LIST, JSON.stringify(ids));
});
