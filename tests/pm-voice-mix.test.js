// ══════════════════════════════════════════════════════════════════════
// pm-voice-mix.test.js — an islander speaks every tag they were written with
// ══════════════════════════════════════════════════════════════════════
//
// Perfect Match used to speak only an islander's strongest voice tag. Measured
// on the user's 27 islanders (2026-10-22): the second hashtag spoke 0 lines of
// 33,168 — Antwon "#flirty #proud" never once sounded proud, though nearly
// every line had a proud version written. The user: "most of my players have
// between 3-5 tags". A voice is now a mix (td/story/voice.js voiceWeights,
// pm/script.js voiceKey), and this holds it to one:
//   - the tags written count 4, 2.5, 1.5, then 1 each; archetype and stat
//     tags share 1; "#tag:n" sets a count outright;
//   - over a season the second tag is heard, and the first still leads;
//   - the mix is a hash, never a draw: a season replays word for word.
import { describe, expect, it } from 'vitest';
import { setPlayers } from '../js/core.js';
import { playPerfectMatchSeason } from '../js/pm/season.js';
import { readVoiceText } from '../js/td/story/voice-words.js';
import { voiceOf, voiceWeights } from '../js/td/story/voice.js';
import { makeIslanders, roleSetup } from './helpers/pm-cast.js';

// Voices as the user writes them: two to five hashtags. #emotional and #food
// are left out on purpose: the voice batches wrote 20 tags, not those two.
const VOICES = [
  '#flirty #proud', '#loud #goofy #warm', '#dry #quiet #calm #nerdy', '#schemer #flirty #cruel #blunt #theatrical',
  '#anxious #warm #earnest', '#competitive #proud #blunt', '#goofy #ditzy #warm #anxious', '#bossy #dry',
  '#earnest #warm #tough', '#chaotic #flirty #loud', '#calm #schemer', '#theatrical #flirty #bossy #dry',
];

function cast(seed) {
  return makeIslanders(22, seed).map((p, i) => ({ ...p, voice: `Talks the way they talk. ${VOICES[i % VOICES.length]}` }));
}

function spoken(rows) {
  const out = [];
  const seen = new Set();
  const walk = o => {
    if (!o || typeof o !== 'object' || seen.has(o)) return;
    seen.add(o);
    if (o.script && Array.isArray(o.script.lines)) out.push(...o.script.lines);
    for (const v of Array.isArray(o) ? o : Object.values(o)) walk(v);
  };
  walk(rows);
  return out;
}

function play(seed) {
  const players = cast(seed); setPlayers(players);
  const names = players.map(p => p.name);
  const { rows } = playPerfectMatchSeason({ cast: names, setup: roleSetup(names), seed });
  return { players, lines: spoken(rows).filter(l => names.includes(l.who)) };
}

describe('reading a weight off the voice', () => {
  it('"#tag:n" is a hashtag with a count', () => {
    const r = readVoiceText('Smug and flirty. #flirty #proud:3 #warm:0.5');
    expect(r.hash).toEqual(['flirty', 'proud', 'warm']);
    expect(r.weights).toEqual({ proud: 3, warm: 0.5 });
  });

  it('written tags count 4, 2.5, 1.5, then 1; archetype and stat tags share 1', () => {
    setPlayers([{ name: 'W', archetype: 'villain', stats: { temperament: 2, social: 9 },
      voice: '#flirty #proud #goofy #dry #quiet' }]);
    const w = Object.fromEntries(voiceWeights('W'));
    expect([w.flirty, w.proud, w.goofy, w.dry, w.quiet]).toEqual([4, 2.5, 1.5, 1, 1]);
    const added = voiceOf('W').filter(t => !['flirty', 'proud', 'goofy', 'dry', 'quiet'].includes(t) && w[t] != null);
    expect(added.length).toBeGreaterThan(0);   // the villain's cruel and schemer, at least
    expect(added.reduce((s, t) => s + w[t], 0)).toBeCloseTo(1);
  });

  it('a count written on a tag wins over its place', () => {
    setPlayers([{ name: 'X', archetype: 'floater', stats: {}, voice: '#flirty #proud:4' }]);
    const w = Object.fromEntries(voiceWeights('X'));
    expect(w.proud).toBe(4);
    expect(w.flirty).toBe(4);
  });
});

describe('a season in the mix', () => {
  const a = play(5);

  it('every islander\'s second hashtag is heard, and the first still leads', () => {
    // One register holds a whole scene, so an islander with 80 lines has ~25
    // picks, and the scene lean moves a flirt forward on every pull: one
    // islander's first can trail their second. Across the cast it leads.
    const short = [], firsts = [], seconds = [];
    for (const p of a.players) {
      const tags = readVoiceText(p.voice).hash;
      const mine = a.lines.filter(l => l.who === p.name && l.voice);
      if (tags.length < 2 || mine.length < 60) continue;
      const share = t => mine.filter(l => l.voice === t).length / mine.length;
      const [first, second] = tags.map(share);
      firsts.push(first); seconds.push(second);
      if (!(second >= 0.10 && first < 0.75)) {
        short.push(`${p.name} ${p.voice.split('. ')[1]}: ${tags[0]} ${(first * 100).toFixed(0)}%, ${tags[1]} ${(second * 100).toFixed(0)}% of ${mine.length}`);
      }
    }
    expect(short).toEqual([]);
    expect(firsts.length).toBeGreaterThan(8);
    const mean = xs => xs.reduce((s, x) => s + x, 0) / xs.length;
    expect(mean(firsts), `first ${mean(firsts).toFixed(2)} vs second ${mean(seconds).toFixed(2)}`).toBeGreaterThan(mean(seconds) + 0.1);
  });

  it('a scene keeps a speaker in one register', () => {
    // Most of a speaker's voiced lines inside one scene come out in one key.
    let scenes = 0, steady = 0;
    const seen = new Set();
    const walk = o => {
      if (!o || typeof o !== 'object' || seen.has(o)) return;
      seen.add(o);
      if (o.script && Array.isArray(o.script.lines)) {
        const by = {};
        for (const l of o.script.lines) if (l.voice) (by[l.who] ||= []).push(l.voice);
        for (const keys of Object.values(by)) if (keys.length >= 3) { scenes++; if (new Set(keys).size === 1) steady++; }
      }
      for (const v of Array.isArray(o) ? o : Object.values(o)) walk(v);
    };
    setPlayers(a.players);
    const names = a.players.map(p => p.name);
    walk(playPerfectMatchSeason({ cast: names, setup: roleSetup(names), seed: 5 }).rows);
    expect(scenes).toBeGreaterThan(20);
    expect(steady / scenes).toBeGreaterThan(0.6);
  });

  it('the same season replays word for word', () => {
    const b = play(5);
    expect(b.lines.map(l => `${l.who}: ${l.text}`)).toEqual(a.lines.map(l => `${l.who}: ${l.text}`));
  });
});
