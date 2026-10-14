// The Challenge's dialogue: the rules every pool and every aired day keep.
import { describe, expect, it, beforeAll } from 'vitest';
import { setPlayers } from '../js/core.js';
import { playChallengeSeason } from '../js/ch/season.js';
import { airSeason } from '../js/ch/story/director.js';
import { POOLS } from '../js/ch/script/lines/index.js';
import { CH_FACT_KEYS } from '../js/ch/script/facts.js';
import { VOICE_TAGS } from '../js/td/story/voice.js';
import { challengeCast } from './helpers/ch-cast.js';

const FAMILIES = ['sharp', 'dry', 'loud', 'soft', 'odd'];
const SLOTS = new Set(['a', 'b', 'c', 'd', 'tj', 'target', 'alliance', 'game', 'gone', 'show_a', 'show_b', 'count', 'need', 'reason']);

describe('The Challenge pools', () => {
  it('gate only on known facts, key variants only on real voices, and name only real slots', () => {
    const ids = new Set();
    for (const [key, list] of Object.entries(POOLS)) {
      for (const e of list) {
        expect(ids.has(e.id), `duplicate id ${e.id}`).toBe(false);
        ids.add(e.id);
        for (const k of Object.keys(e.when || {})) expect(CH_FACT_KEYS, `${e.id} gates on ${k}`).toContain(k);
        for (const t of e.turns) {
          for (const k of Object.keys(t.when || {})) expect(CH_FACT_KEYS, `${e.id} turn gates on ${k}`).toContain(k);
          for (const tag of Object.keys(t.v || {})) expect([...VOICE_TAGS, ...FAMILIES], `${e.id} variant ${tag}`).toContain(tag);
          const texts = [t.say, t.conf, t.beat, ...Object.values(t.v || {}).flat()].filter(Boolean);
          for (const text of texts) for (const m of text.matchAll(/\{(\w+)(?:\.\w+)?\}/g)) expect(SLOTS, `${e.id}: {${m[1]}} in ${key}`).toContain(m[1]);
        }
      }
    }
  });

  it('a turn whose reply picks up its word keeps that word in every voice (keep)', () => {
    // "Your best lost us the daily" cannot follow a variant that never said "best".
    const bad = [];
    for (const list of Object.values(POOLS)) for (const e of list) e.turns.forEach((t, i) => {
      for (const word of t.keep || []) {
        for (const text of [t.say || t.conf, ...Object.values(t.v || {}).flat()]) {
          if (!text.toLowerCase().includes(word)) bad.push(`${e.id}:${i} drops "${word}": ${text}`);
        }
      }
    });
    expect(bad, bad.join('\n')).toEqual([]);
  });

  it('voice overlays land only on spoken turns that exist (an overlay keyed by index drifts when a scene is rewritten)', async () => {
    const { default: VOICES } = await import('../js/ch/script/lines/voices/index.js');
    const byId = {};
    for (const list of Object.values(POOLS)) for (const e of list) byId[e.id] = e;
    const bad = [];
    for (const [id, turns] of Object.entries(VOICES)) {
      for (const i of Object.keys(turns)) {
        const t = byId[id]?.turns[Number(i)];
        if (!t) bad.push(`${id}:${i} has no such turn`);
        else if (t.beat || t.by === 'tj') bad.push(`${id}:${i} is a ${t.beat ? 'beat' : 'TJ line'}`);
      }
    }
    expect(bad, bad.join('\n')).toEqual([]);
  });
});

describe('The Challenge, as aired', () => {
  let seasons;
  beforeAll(() => {
    seasons = [7, 8, 9].map(seed => {
      const { cast, names, background } = challengeCast(24, seed);
      setPlayers(cast);
      const r = playChallengeSeason({ cast: names, background, seed });
      airSeason(r.state);
      return r;
    });
  });

  const linesOf = r => {
    const out = [];
    for (const e of [...r.episodes, r.state.finalEp]) for (const a of e.aired || []) {
      for (const l of a.script?.lines || []) out.push({ day: a.day, ...l });
      for (const c of a.ceremony || []) for (const l of c.script?.lines || []) out.push({ day: a.day, ...l });
    }
    return out;
  };

  it('never says the same sentence twice in one day', () => {
    for (const r of seasons) {
      const seen = {};
      const dupes = [];
      for (const l of linesOf(r)) {
        if (l.kind === 'beat' || l.by === 'TJ' || l.text.length < 16) continue;
        const k = `${l.day}|${l.text}`;
        if (seen[k]) dupes.push(`day ${l.day}: "${l.text}" (${seen[k]} and ${l.by})`);
        seen[k] = l.by;
      }
      expect(dupes, dupes.slice(0, 5).join('\n')).toEqual([]);
    }
  });

  it('never prints an unfilled slot', () => {
    for (const r of seasons) for (const l of linesOf(r)) expect(l.text, l.text).not.toMatch(/\{\w+(\.\w+)?\}/);
  });

  it('a payback airs only when the one called out really voted the caller in, in an earlier episode', () => {
    for (const r of seasons) {
      for (const e of r.episodes) for (const a of e.aired || []) {
        if (a.kind !== 'arc-payback') continue;
        const [caller, opp] = a.scene.who;
        const real = r.episodes.some(p => p.ep < e.ep && p.votes.some(v => v.votedIn === caller && v.ballots.some(b => b.voter === opp && b.target === caller)));
        expect(real, `payback ${caller} > ${opp} in ep ${e.ep}`).toBe(true);
      }
    }
  });

  it('every chapter that answers an earlier one has its cause on screen, or says it', async () => {
    const { causeOf } = await import('../js/ch/story/storylines.js');
    for (const r of seasons) {
      const lines = r.state.story.lines;
      for (const e of r.episodes) for (const a of e.aired || []) {
        if (!a.scene || !a.script) continue;
        const line = lines.find(l => l.steps.some(s => s.scene === a.scene.id));
        if (!line) continue;
        const step = line.steps.find(s => s.scene === a.scene.id);
        const cause = causeOf(line, step);
        if (!cause) continue;
        const recapped = a.script.lines.some(l => l.recap);
        expect(cause.aired || recapped, `${a.kind} in ep ${e.ep} (${line.id}) airs without its cause`).toBe(true);
      }
    }
  });

  it('tells stories across episodes: every season has feuds or romances that run three chapters over two episodes', () => {
    for (const r of seasons) {
      const long = r.state.story.lines.filter(l => ['feud', 'showmance'].includes(l.type)).filter(l => {
        const aired = l.steps.filter(s => s.aired);
        return aired.length >= 3 && new Set(aired.map(s => s.ep)).size >= 2;
      });
      expect(long.length, `seed ${r.state.seed}`).toBeGreaterThanOrEqual(2);
    }
  });

  it('never has somebody gone speak', () => {
    for (const r of seasons) {
      const goneDay = Object.fromEntries(r.state.gone.map(g => [g.name, g.day]));
      for (const l of linesOf(r)) if (l.by && goneDay[l.by] != null) expect(l.day <= goneDay[l.by], `${l.by} speaks on day ${l.day}, gone day ${goneDay[l.by]}`).toBe(true);
    }
  });
});
