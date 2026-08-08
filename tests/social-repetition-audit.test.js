// Not a guard. An audit — npm run audit:social —: how much does the feed actually
// repeat itself, across a whole season, in the output rather than in the pools.
import { it } from 'vitest';

import { PHRASINGS } from '../js/social/phrasings.js';
import { archiveEpisode } from '../js/social/archive.js';
import { buildChatMessages } from '../js/social/chat.js';
import { episodeSpeakers, seasonPanel } from '../js/social/hosts.js';

const EPS = 26;
const doc = {
  seasonNumber: 14, episodeCount: EPS, winner: { name: 'Anastasia' },
  votingHistory: Array.from({ length: EPS - 2 }, (_, i) => ({
    episode: i + 1,
    eliminated: ['jade', 'logan', 'benji', 'spencer', 'zee', 'nico'][i % 6],
    immunityWinner: ['anastasia', 'ted', 'julia'][i % 3],
    votes: [
      { voter: 'anastasia', target: ['jade', 'logan', 'benji', 'spencer', 'zee', 'nico'][i % 6] },
      { voter: 'ted', target: ['jade', 'logan', 'benji', 'spencer', 'zee', 'nico'][i % 6] },
      { voter: 'julia', target: ['jade', 'logan', 'benji', 'spencer', 'zee', 'nico'][i % 6] },
      { voter: ['jade', 'logan', 'benji', 'spencer', 'zee', 'nico'][i % 6], target: 'ted' },
    ],
  })),
};

/** The shape of a sentence, with the specifics removed. */
const skeleton = t => String(t).toLowerCase()
  .replace(/[a-z]+/g, w => (w.length > 3 ? '_' : w))
  .replace(/\s+/g, ' ').trim();

const report = (label, lines) => {
  const uniq = new Set(lines);
  const counts = new Map();
  for (const l of lines) counts.set(l, (counts.get(l) || 0) + 1);
  const worst = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
  const shapes = new Set(lines.map(skeleton));
  console.log(`\n── ${label} ──`);
  console.log(`  ${lines.length} lines, ${uniq.size} distinct (${
    Math.round(uniq.size / lines.length * 100)}% unique)`);
  console.log(`  ${shapes.size} distinct sentence SHAPES (${
    Math.round(shapes.size / lines.length * 100)}%)`);
  console.log('  most repeated:');
  for (const [text, n] of worst) console.log(`    ${n}x  ${text.slice(0, 78)}`);
};

it('measures', () => {
  // ── pools ──
  let pools = 0; let thin = 0; let strings = 0; const sizes = [];
  for (const topic of Object.values(PHRASINGS)) {
    for (const shape of Object.values(topic)) {
      for (const list of Object.values(shape)) {
        if (!Array.isArray(list)) continue;
        pools++; strings += list.length; sizes.push(list.length);
        if (list.length < 8) thin++;
      }
    }
  }
  sizes.sort((a, b) => a - b);
  console.log(`\n── pools ──\n  ${strings} strings across ${pools} pools`);
  console.log(`  ${thin} pools under 8 (${Math.round(thin / pools * 100)}%)`);
  console.log(`  median ${sizes[Math.floor(sizes.length / 2)]}, `
    + `smallest ${sizes[0]}, ${sizes.filter(n => n <= 2).length} pools of 1-2`);

  // ── realised output, whole season ──
  const timeline = []; const chat = []; const perEp = [];
  const panel = seasonPanel([
    { slug: 'a', name: 'Nadia', expertise: ['strategy'], influence: 900, fameScore: 900 },
    { slug: 'b', name: 'Omar', expertise: ['social'], influence: 850, fameScore: 850 },
    { slug: 'c', name: 'Rue', expertise: ['comps'], influence: 800, fameScore: 800 },
    { slug: 'd', name: 'Sol', expertise: ['edit'], influence: 750, fameScore: 750 },
    { slug: 'e', name: 'Ines', expertise: ['strategy'], influence: 700, fameScore: 700 },
    { slug: 'f', name: 'Kai', expertise: ['social'], influence: 650, fameScore: 650 },
  ], { format: 'total-drama' });

  for (let ep = 1; ep <= EPS; ep++) {
    const { events, posts } = archiveEpisode(doc, 'total-drama', 14, ep);
    const t = posts.filter(p => p.stream === 'timeline').map(p => p.text);
    const speakers = episodeSpeakers(panel, events, {});
    const c = buildChatMessages(events, speakers, {
      format: 'total-drama', season: 14, episode: ep, seed: 14 * 977 + ep,
    }).map(m => m.text);
    timeline.push(...t); chat.push(...c);
    perEp.push({ ep, t: t.length, tu: new Set(t).size, c: c.length, cu: new Set(c).size });
  }

  report('Birdie — whole season', timeline);
  report('ChatAlumni — whole season', chat);

  const worstNight = perEp.sort((a, b) => (a.tu / a.t) - (b.tu / b.t))[0];
  console.log(`\n  worst single night on Birdie: ep ${worstNight.ep}, `
    + `${worstNight.tu}/${worstNight.t} unique`);
  const worstChat = perEp.sort((a, b) => (a.cu / a.c) - (b.cu / b.c))[0];
  console.log(`  worst single night in the room: ep ${worstChat.ep}, `
    + `${worstChat.cu}/${worstChat.c} unique\n`);

});
