import { beforeEach, describe, expect, it } from 'vitest';
import { gs } from '../js/core.js';
import { LOCATION_TEXTURE_EVENTS } from '../js/bb-events/location-texture.js';
import { HOUSE_EVENTS, assertUniqueEventIds } from '../js/bb-events/index.js';
import { createHouseEventApi } from '../js/bb/house-events.js';
import { seedGame } from './helpers/setup.js';

const CAST = [
  { name:'A', gender:'m', archetype:'wildcard', stats:{ physical:8, mental:7, social:8, temperament:7 } },
  { name:'B', gender:'f', archetype:'social-butterfly', stats:{ physical:4, mental:6, social:8, temperament:8 } },
  { name:'C', gender:'m', archetype:'hothead', stats:{ physical:6, mental:4, social:4, temperament:3 } },
  { name:'D', gender:'f', archetype:'schemer', stats:{ physical:5, mental:8, social:7, temperament:5 } },
  { name:'E', gender:'m', archetype:'hero', stats:{ physical:7, mental:5, social:7, temperament:8 } },
  { name:'F', gender:'f', archetype:'floater', stats:{ physical:3, mental:6, social:5, temperament:6 } },
];

describe('BB location texture catalog', () => {
  beforeEach(() => seedGame(CAST, { episode:0, eliminated:[], namedAlliances:[], popularity:{}, showmances:[], romanticSparks:[] }));

  it('registers one consequence-bearing event for every camera without duplicate ids', () => {
    expect(LOCATION_TEXTURE_EVENTS).toHaveLength(8);
    expect(new Set(LOCATION_TEXTURE_EVENTS.map(e => e.location))).toEqual(new Set([
      'kitchen','backyard','bedroom','washroom','living-room','pantry','diary-room','hoh-room',
    ]));
    expect(assertUniqueEventIds(HOUSE_EVENTS)).toBe(true);
  });

  it('renders every event with valid people, natural substitutions and a consequence', () => {
    const ctx = { act:'hoh', hoh:'A', nominees:[], vetoWinner:null, beat:2, week:{ num:1, hoh:'A' } };
    for (const event of LOCATION_TEXTURE_EVENTS) {
      const before = JSON.stringify({ bonds:gs.bonds, popularity:gs.popularity, intentions:gs.intentions, memories:gs.strategicMemories });
      const beat = event.fire([...gs.activePlayers], ctx, createHouseEventApi(ctx), () => .42);
      expect(beat.text, event.id).toBeTruthy();
      expect(beat.text, event.id).not.toMatch(/undefined|null|\bthey (?:is|was|wants|does)\b/i);
      expect(beat.players.length, event.id).toBeGreaterThan(0);
      expect(beat.badgeText, event.id).toBeTruthy();
      expect(beat.badgeClass, event.id).toBeTruthy();
      const after = JSON.stringify({ bonds:gs.bonds, popularity:gs.popularity, intentions:gs.intentions, memories:gs.strategicMemories });
      expect(after, `${event.id} was cosmetic`).not.toBe(before);
    }
  });
});
