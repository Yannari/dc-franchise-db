// ══════════════════════════════════════════════════════════════════════
// pm-voice-mix.test.js — an islander speaks every tag they were written with
// ══════════════════════════════════════════════════════════════════════
//
// The user: "most of my players have between 3-5 tags". A voice is a mix
// (td/story/voice.js voiceWeights): the tags written count 4, 2.5, 1.5, then 1
// each; archetype and stat tags share 1; "#tag:n" sets a count outright. Since
// the 2026-10-22 rebuild the mix picks a REGISTER for each speaker in each
// scene (pm/story/director.js registerOf: soft · sharp · big · dry · flirty ·
// nervy), and the register picks which whole movement they get:
//   - over a season the second tag's register is heard, and the first leads;
//   - the mix is a hash, never a draw: a season replays word for word.
import { describe, expect, it } from 'vitest';
import { setPlayers } from '../js/core.js';
import { playPerfectMatchSeason } from '../js/pm/season.js';
import { readVoiceText } from '../js/td/story/voice-words.js';
import { voiceOf, voiceWeights } from '../js/td/story/voice.js';
import { REGISTERS, registerOf } from '../js/pm/story/director.js';
import { scriptText } from '../js/pm/script.js';
import { makeIslanders, roleSetup } from './helpers/pm-cast.js';

// Voices as the user writes them: two to five hashtags. #emotional is in (batches
// 145-168 wrote it); #food is left out on purpose: no line has a food version yet.
const VOICES = [
  '#flirty #proud', '#loud #goofy #warm', '#dry #quiet #calm #nerdy', '#schemer #flirty #cruel #blunt #theatrical',
  '#anxious #warm #earnest', '#competitive #proud #blunt', '#goofy #ditzy #warm #anxious', '#earnest #emotional',
  '#earnest #warm #tough', '#chaotic #flirty #loud', '#calm #schemer', '#theatrical #flirty #bossy #dry',
];

function cast(seed) {
  return makeIslanders(22, seed).map((p, i) => ({ ...p, voice: `Talks the way they talk. ${VOICES[i % VOICES.length]}` }));
}

function play(seed) {
  const players = cast(seed); setPlayers(players);
  const names = players.map(p => p.name);
  const { rows } = playPerfectMatchSeason({ cast: names, setup: roleSetup(names), seed });
  return { players, rows };
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
  const regOf = tag => Object.entries(REGISTERS).find(([, tags]) => tags.includes(tag))?.[0];

  it("every islander's second register is heard, and the first still leads", () => {
    setPlayers(a.players);   // an earlier test set its own roster
    const short = [], firsts = [], seconds = [];
    for (const p of a.players) {
      const regs = [...new Set(readVoiceText(p.voice).hash.map(regOf).filter(Boolean))];
      if (regs.length < 2) continue;
      const scenes = a.rows.flatMap(r => r.pm.events).filter(e => e.tier && e.players.includes(p.name));
      if (scenes.length < 40) continue;
      const got = scenes.map(e => registerOf({ seed: 5 }, e, p.name));
      const share = r => got.filter(x => x === r).length / got.length;
      const [first, second] = regs.map(share);
      firsts.push(first); seconds.push(second);
      if (!(second >= 0.10 && first < 0.85)) short.push(`${p.name} ${regs.join('/')}: ${(first * 100).toFixed(0)}% / ${(second * 100).toFixed(0)}% of ${got.length}`);
    }
    expect(short).toEqual([]);
    expect(firsts.length).toBeGreaterThan(8);
    const mean = xs => xs.reduce((s, x) => s + x, 0) / xs.length;
    expect(mean(firsts), `first ${mean(firsts).toFixed(2)} vs second ${mean(seconds).toFixed(2)}`).toBeGreaterThan(mean(seconds) + 0.1);
  });

  it('the same season replays word for word', () => {
    const text = rows => rows.flatMap(r => r.pm.events).map(e => scriptText(e.script)).join(' / ');
    expect(text(play(5).rows)).toBe(text(a.rows));
  });
});
