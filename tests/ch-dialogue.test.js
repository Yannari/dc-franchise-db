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

  // Every line a pool can say: the turn's own and every voice's.
  const allTexts = key => Object.entries(POOLS).filter(([k]) => !key || key(k)).flatMap(([k, list]) => list.flatMap(e =>
    e.turns.flatMap(t => [t.say, t.conf, t.beat, ...Object.values(t.v || {}).flat()].filter(Boolean).map(text => ({ id: e.id, k, text })))));

  it('the vote is out loud: nobody writes a name, nothing is read out', () => {
    // Season 777's read: "Don't write my name", "I know what you wrote", "They find out when TJ reads it".
    const bad = allTexts().filter(({ text }) =>
      /\b(write|wrote|written|writing)\b[^.!?]*\bnames?\b|\bnames?\b[^.!?]*\b(wrote|written)\b|\bpen\b|TJ reads|reads? (it|the votes|the names)/i.test(text));
    expect(bad.map(b => `${b.id}: ${b.text}`), bad.map(b => `${b.id}: ${b.text}`).join('\n')).toEqual([]);
  });

  it('a new alliance has three or four members: its lines never count them', () => {
    // "Can I trust you two?" and "It's us three" aired in an alliance of four.
    const bad = allTexts(k => /^alliance-(form|grow)\./.test(k)).filter(({ text }) =>
      /\b(you two|us three|three of us|two of us|us two|you both|both of you|just you and me|party of two|two members)\b/i.test(text));
    expect(bad.map(b => `${b.id}: ${b.text}`), bad.map(b => `${b.id}: ${b.text}`).join('\n')).toEqual([]);
  });

  it('the vote is the day before the Arena: no vote line sends anybody in "tonight"', () => {
    const bad = allTexts(k => /^(cer-open|cer-result|daily)\./.test(k)).filter(({ text }) => /\b(Arena|in|untouchable|safe) tonight\b/i.test(text));
    expect(bad.map(b => `${b.id}: ${b.text}`), bad.map(b => `${b.id}: ${b.text}`).join('\n')).toEqual([]);
  });

  it('nobody says the same voiced line twice in a season', async () => {
    // "Wait, did I win? I won? I WON!" aired three times from one player in four episodes.
    const { voicedLine } = await import('../js/ch/script/write.js');
    const { voiceOf } = await import('../js/td/story/voice.js');
    const { challengeCast } = await import('./helpers/ch-cast.js');
    const { cast, names } = challengeCast(24, 3);
    setPlayers(cast);
    const who = names.find(n => voiceOf(n).length);
    const tags = voiceOf(who);
    const turn = { say: 'BASE', v: Object.fromEntries(tags.map(t => [t, [`only ${t}`]])) };
    const ledger = {};
    const said = [1, 2, 3, 4, 5].map(day => voicedLine(turn, who, { rng: () => 0, ledger, day }).text);
    const voiced = said.filter(x => x !== 'BASE');
    expect(new Set(voiced).size, said.join(' / ')).toBe(voiced.length);
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

  it('nobody plays both parts of an exchange', () => {
    // A morning-after with one relieved player had them say "I slept better" and answer "Don't say that out loud".
    for (const r of seasons) for (const e of r.episodes) for (const a of e.aired || []) {
      const ls = (a.script?.lines || []).filter(l => l.kind === 'say' && l.by && l.by !== 'TJ');
      for (let i = 1; i < ls.length; i++) {
        expect(ls[i].by === ls[i - 1].by && /^(oh no|don'?t|shh|maybe don'?t|probably keep|never say)/i.test(ls[i].text), `${a.kind} ep ${e.ep}: ${ls[i - 1].by} answers ${ls[i].by}`).toBe(false);
      }
    }
  });

  it('the call-out is said at the Arena, and nobody hears it the night before', () => {
    // The show's call-out: the voted-in player names their opponent at the Arena, in front of the house.
    for (const r of seasons) for (const e of r.episodes) {
      const scenes = r.state.scenes.filter(s => s.ep === e.ep);
      for (const co of scenes.filter(s => s.kind === 'callout')) {
        const arena = scenes.find(s => s.kind === 'arena' && s.who.includes(co.who[0]));
        if (!arena) continue;
        expect(co.day, `ep ${e.ep}: ${co.who[0]} calls out ${co.who[1]} on day ${co.day}, the Arena is day ${arena.day}`).toBe(arena.day);
        if (co.data.volunteer) continue;
        const told = scenes.filter(s => s.kind === 'arena-eve-pep' && s.who[1] === co.who[1]);
        expect(told.length, `ep ${e.ep}: ${co.who[1]} gets a pep talk before anybody called them out`).toBe(0);
      }
    }
  });

  it('the day\'s daily winner is never caught throwing it', () => {
    for (const r of seasons) for (const e of r.episodes) {
      const scenes = (e.aired || []).map(a => a.scene).filter(Boolean);
      const daily = scenes.find(s => s.kind === 'daily');
      if (!daily) continue;
      for (const s of scenes.filter(s => s.kind === 'throw-caught' || s.kind === 'throw')) {
        const thrower = s.kind === 'throw' ? s.who[0] : s.who[1];
        expect(daily.data.winners, `ep ${e.ep}: ${thrower} won and threw`).not.toContain(thrower);
      }
    }
  });

  it('never has somebody gone speak', () => {
    for (const r of seasons) {
      const goneDay = Object.fromEntries(r.state.gone.map(g => [g.name, g.day]));
      for (const l of linesOf(r)) if (l.by && goneDay[l.by] != null) expect(l.day <= goneDay[l.by], `${l.by} speaks on day ${l.day}, gone day ${goneDay[l.by]}`).toBe(true);
    }
  });
});
