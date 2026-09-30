// ci-persona-data.test.js — a persona is PICKED, not typed (Plan 4 Task 7,
// user: "shouldn't we have dropdowns or categories"). Every field the engine
// reads comes from a list; the bio and the photo prompt are written from the
// picks; the topics a persona can be caught on reach the chats as real slips.
import { describe, expect, it } from 'vitest';
import { JOBS, DETAILS, TOPICS, STATUSES, PHOTO, jobOf, tellsOf, bioFor, promptFor } from '../js/ci/persona-data.js';
import { DEFAULT_POOL } from '../js/ci/default-pool.js';
import { personaStyle } from '../js/ci/cover.js';
import { REGISTERS } from '../js/ci/register.js';
import { POOLS } from '../js/ci/lines/index.js';
import { setPlayers } from '../js/core.js';
import { playCircleSeason } from '../js/ci/season.js';
import { makePlayers, circleSetup } from './helpers/ci-cast.js';

describe('the lists', () => {
  it('every job types one of the six ways and names only real topics', () => {
    expect(JOBS.length).toBeGreaterThanOrEqual(15);
    expect(new Set(JOBS.map(j => j.id)).size).toBe(JOBS.length);
    for (const j of JOBS) {
      expect(REGISTERS, j.id).toContain(j.register);
      expect(j.group, j.id).toBeTruthy();
      expect(j.smarts, j.id).toBeGreaterThan(0);
      for (const t of j.topics) expect(Object.keys(TOPICS), `${j.id}:${t}`).toContain(t);
    }
    for (const r of REGISTERS) expect(JOBS.some(j => j.register === r), r).toBe(true);
  });

  it('every life detail names a real topic', () => {
    for (const d of DETAILS) for (const t of d.topics) expect(Object.keys(TOPICS), `${d.id}:${t}`).toContain(t);
  });

  it('every topic has its own slips: three noticed, three missed', () => {
    for (const t of Object.keys(TOPICS)) {
      expect(POOLS[`slip.topic.${t}.noticed`]?.length, t).toBeGreaterThanOrEqual(3);
      expect(POOLS[`slip.topic.${t}.missed`]?.length, t).toBeGreaterThanOrEqual(3);
    }
  });
});

describe('what the engine reads off the picks', () => {
  it('the job decides how the persona types, and the author may change it', () => {
    expect(personaStyle({ jobId: 'bartender', age: 25 }).register).toBe('flirty');
    expect(personaStyle({ jobId: 'lawyer', age: 30 }).register).toBe('formal');
    expect(personaStyle({ jobId: 'bartender', register: 'dry', age: 25 }).register).toBe('dry');
    // a hand-written job with no pick still reads (older saved pools)
    expect(personaStyle({ job: 'nurse', age: 30 }).register).toBe('warm');
  });

  it('what a persona can be caught on is its job and its life, together', () => {
    const t = tellsOf({ jobId: 'pediatric-nurse', details: ['dog', 'church'] });
    expect(t).toEqual(expect.arrayContaining(['hospital', 'night-shifts', 'dog', 'church']));
    expect(new Set(t).size).toBe(t.length);
  });
});

describe('written from the picks', () => {
  const p = { handle: 'Grace', age: 34, gender: 'f', jobId: 'pediatric-nurse', status: 'Single', details: ['dog'],
    photo: { hair: 'wavy-auburn', style: 'casual', setting: 'home' } };
  it('the bio names the job, is plain, and is the same every time', () => {
    const bio = bioFor(p);
    expect(bio).toMatch(/nurse/i);
    expect(bio).not.toMatch(/undefined|null|\{/);
    expect(bioFor(p)).toBe(bio);
    expect(bioFor({ ...p, handle: 'Other' })).not.toBe('');
  });
  it('the photo prompt says who, how old, and what the picks chose', () => {
    const s = promptFor(p);
    expect(s).toMatch(/^Grace, 34/);
    expect(s).toContain(PHOTO.hair.find(h => h.id === 'wavy-auburn').words);
    expect(s).not.toMatch(/undefined/);
  });
  it('statuses are the real show\'s', () => {
    expect(STATUSES).toEqual(expect.arrayContaining(['Single', 'Taken', 'Married', "It's complicated", 'Very single']));
  });
});

describe('the default pool is picked too', () => {
  it('every persona has a real job, real details and a photo pick', () => {
    for (const p of DEFAULT_POOL) {
      expect(jobOf(p), p.id).toBeTruthy();
      for (const d of p.details) expect(DETAILS.map(x => x.id), `${p.id}:${d}`).toContain(d);
      expect(STATUSES, p.id).toContain(p.status);
      for (const k of ['hair', 'style', 'setting']) expect(PHOTO[k].map(x => x.id), `${p.id}.${k}`).toContain(p.photo[k]);
    }
  });
});

describe('a catch-out topic reaches the chat', () => {
  it('knowledge slips by a persona name the topic, and are written from its pool', () => {
    let topical = 0, written = 0;
    for (let s = 1; s <= 12; s++) {
      const cast = makePlayers(13, s); setPlayers(cast);
      const names = cast.map(p => p.name);
      const { state } = playCircleSeason({ cast: names, setup: circleSetup(names), pool: DEFAULT_POOL, seed: s });
      for (const sc of state.scenes) for (const sl of sc.data?.slips || []) {
        if (!sl.topic) continue;
        topical++;
        expect(state.profiles[sl.by].tells, sl.topic).toContain(sl.topic);
        if ((sc.script?.blocks || []).some(b => [b.key, ...(b.woven || [])].some(k => k?.startsWith(`slip.topic.${sl.topic}.`)))) written++;
      }
    }
    expect(topical).toBeGreaterThan(0);
    expect(written).toBeGreaterThan(0);
  }, 300000);
});
