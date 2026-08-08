// tests/social-personas.test.js
// The recurring fans. A named cast that comes back every season and remembers is
// what makes a feed feel alive rather than generated — you learn a handle, and
// then you notice when they change their mind.
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { PERSONAS, ARCHETYPES, feelingsToward, loyaltiesOf, grudgesOf, personaByHandle }
  from '../js/social/personas.js';

// process.cwd(), not import.meta.url — vitest rewrites module URLs and a relative
// URL lands at the drive root. tests/multishow-json.test.js says the same.
const roster = JSON.parse(readFileSync(join(process.cwd(), 'players_database.json'), 'utf8'));
const SLUGS = new Set(roster.players.map(p => p.id));

describe('the cast', () => {
  it('has enough regulars to feel like a crowd', () => {
    expect(PERSONAS.length).toBeGreaterThanOrEqual(12);
  });

  it('gives every persona a unique handle', () => {
    const handles = PERSONAS.map(p => p.handle);
    expect(new Set(handles).size, 'two personas share a handle').toBe(handles.length);
    for (const h of handles) expect(h, `${h} is not a handle`).toMatch(/^@[a-z0-9_]+$/);
  });

  it('describes every persona completely', () => {
    for (const p of PERSONAS) {
      expect(ARCHETYPES, `${p.handle} has an unknown archetype`).toContain(p.archetype);
      expect(typeof p.name, `${p.handle} has no display name`).toBe('string');
      expect(p.since, `${p.handle} started watching in an impossible season`).toBeGreaterThan(0);
      expect(p.platforms.length, `${p.handle} posts nowhere`).toBeGreaterThan(0);
      for (const plat of p.platforms) expect(['timeline', 'chat']).toContain(plat);
      for (const k of ['caps', 'emoji']) {
        expect(p.voice[k], `${p.handle}.voice.${k} out of range`).toBeGreaterThanOrEqual(0);
        expect(p.voice[k]).toBeLessThanOrEqual(1);
      }
      expect(p.volatility).toBeGreaterThanOrEqual(0);
      expect(p.volatility).toBeLessThanOrEqual(1);
    }
  });

  it('only has feelings about players who exist', () => {
    // A grudge against a misspelled slug is a history that silently never fires.
    // players_database.json keys on SLUG (anne-maria); voice-profiles.json keys on
    // display name (Anne Maria). Personas use slugs.
    for (const p of PERSONAS) {
      for (const slug of Object.keys(p.feelings || {})) {
        expect(SLUGS.has(slug), `${p.handle} has feelings about "${slug}", who is not on the roster`).toBe(true);
      }
    }
  });

  it('covers every archetype at least once', () => {
    // An archetype nobody has is a word in a list, not a voice in the feed.
    for (const a of ARCHETYPES) {
      expect(PERSONAS.some(p => p.archetype === a), `no persona is a ${a}`).toBe(true);
    }
  });
});

describe('two opinions, not one', () => {
  it('separates liking somebody from rating their game', () => {
    // The axis this fandom runs on: "I adore her and she is playing the worst
    // game I have ever seen" is not expressible with a single number.
    const p = { feelings: { heather: { affection: 0.8, gameRespect: -0.4 } } };
    expect(feelingsToward(p, 'heather')).toEqual({ affection: 0.8, gameRespect: -0.4 });
  });

  it('is neutral about somebody it has never heard of', () => {
    expect(feelingsToward({ feelings: {} }, 'nobody')).toEqual({ affection: 0, gameRespect: 0 });
    expect(feelingsToward({}, 'nobody')).toEqual({ affection: 0, gameRespect: 0 });
  });

  it('derives loyalties and grudges from affection rather than storing them twice', () => {
    const p = { feelings: {
      heather: { affection: 0.8, gameRespect: -0.4 },   // loved
      scott:   { affection: -0.7, gameRespect: 0.9 },   // hated, respected
      beth:    { affection: 0.1, gameRespect: 0.1 },    // neither
    }};
    expect(loyaltiesOf(p)).toEqual(['heather']);
    expect(grudgesOf(p)).toEqual(['scott']);
    // Respecting somebody's game is NOT liking them, and must not create a loyalty.
    expect(loyaltiesOf(p)).not.toContain('scott');
  });

  it('finds a persona by handle, and says so when there is none', () => {
    expect(personaByHandle(PERSONAS[0].handle).handle).toBe(PERSONAS[0].handle);
    expect(personaByHandle('@nobody')).toBe(null);
  });
});
