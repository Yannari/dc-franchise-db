// The viewing party draws a HOUSE STATUS screen before the week starts and
// another after it ends. The transcript had neither, so a reader got
// everything that HAPPENED and almost nothing about where anybody STOOD — the
// record so far, what each houseguest is playing for, which relationships are
// driving decisions, how visible each alliance is to the people outside it.
//
// Rendered through the screen builder rather than rewritten beside it, because
// the opening screen withholds a great deal on purpose and a second
// implementation would eventually forget one of those omissions.
import { describe, expect, it, beforeAll } from 'vitest';
import { gs, players, seasonConfig, relationships } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { simulateBBEpisode } from '../js/bb-run.js';
import { generateSummaryText } from '../js/text-backlog.js';
import { seedGame } from './helpers/setup.js';
import { withSeededRandom } from './helpers/rng.js';

const NAMES = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel', 'Zee',
  'Brightly', 'Hicks', 'Emmah', 'Millie', 'Caleb', 'Jo', 'Dawn'];
const ARCH = ['mastermind', 'social-butterfly', 'hero', 'showmancer', 'schemer',
  'floater', 'villain', 'loyal-soldier', 'underdog', 'goat', 'hothead',
  'wildcard', 'chaos-agent', 'perceptive-player'];

const texts = [];

beforeAll(() => {
  seedGame(NAMES.map((name, i) => ({ name, gender: i % 2 ? 'm' : 'f',
    sexuality: 'straight', archetype: ARCH[i] })),
    { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats,
    pronouns, ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
  Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7,
    bbHaveNots: 'off', bbSafetyMode: 'off', seasonNumber: 1 });
  seasonConfig.twistSchedule = [];
  withSeededRandom(31, () => { for (let i = 0; i < 3; i++) simulateBBEpisode(); });
  for (const ep of gs.episodeHistory) texts.push({ ep, text: generateSummaryText(ep) || '' });
}, 900000);

const before = t => t.text.slice(t.text.indexOf('HOUSE STATUS — BEFORE'),
  t.text.indexOf('MOVE-IN DAY') > -1 ? t.text.indexOf('MOVE-IN DAY') : undefined);
const after = t => t.text.slice(t.text.indexOf('HOUSE STATUS — AFTER'));

describe('the house status reaches the transcript', () => {
  it('prints both screens every week', () => {
    expect(texts.length).toBeGreaterThan(1);
    for (const t of texts) {
      expect(t.text, `week ${t.ep.num} has no opening status`).toContain('HOUSE STATUS — BEFORE');
      expect(t.text, `week ${t.ep.num} has no closing status`).toContain('HOUSE STATUS — AFTER');
    }
  });

  it('carries the sections the screen carries', () => {
    const t = texts[texts.length - 1].text;
    for (const heading of ['WHERE EVERYBODY STANDS', 'WHAT EVERYBODY IS PLAYING FOR',
      'RELATIONSHIPS THAT MATTER', 'THE SEASON SO FAR']) {
      expect(t, `${heading} never reached the text`).toContain(heading);
    }
  });

  it('does not print the plan changes twice', () => {
    // HOW THE PLANS CHANGED is already a section of its own a few lines above
    // the closing screen, from the same field.
    for (const t of texts) {
      expect(after(t)).not.toContain('WHY PLANS CHANGED');
    }
  });
});

describe('the opening screen does not spoil its own week', () => {
  it('does not name this week\'s eviction before it happens', () => {
    for (const t of texts.filter(x => x.ep.evicted)) {
      const head = before(t);
      expect(head, `week ${t.ep.num} announces the eviction up front`)
        .not.toMatch(new RegExp(`${t.ep.evicted}[^\\n]{0,40}evicted`, 'i'));
    }
  });

  it('does not mark anybody nominated for a block that has not been set', () => {
    for (const t of texts.filter(x => (x.ep.finalNominees || []).length)) {
      const head = before(t);
      for (const nom of t.ep.finalNominees) {
        expect(head, `week ${t.ep.num} shows ${nom} on the block early`)
          .not.toMatch(new RegExp(`${nom} · NOM`));
      }
    }
  });

  it('reports the week that has already aired, not this one', () => {
    const wk2 = texts.find(t => t.ep.num === 2);
    if (!wk2) return;
    expect(before(wk2)).toContain('Last week — week 1');
  });
});

describe('the screen survives being flattened', () => {
  const sample = () => after(texts[texts.length - 1]);

  it('leaves no markup or raw entities behind', () => {
    expect(sample()).not.toMatch(/<[a-z/]/i);
    expect(sample()).not.toMatch(/&(amp|times|bull|middot|nbsp|#\d+);/);
  });

  it('keeps a hold score on the same line as the member it belongs to', () => {
    // The builders are template literals split across indented lines, so the
    // markup carries real newlines between cells. Splitting on those broke each
    // alliance row into a loose score, a loose name and a loose reason — and
    // the score then read as belonging to whoever was printed above it.
    const rows = sample().split('\n').filter(l => /^\s+\d+\.\d · /.test(l));
    expect(rows.length, 'no alliance hold rows survived at all').toBeGreaterThan(0);
    for (const row of rows) {
      expect(row, 'a hold score arrived without its member').toMatch(/^\s+\d+\.\d · [A-Z][a-z]+ · \S/);
    }
  });

  it('names the houseguest doing the hunting', () => {
    // "is coming for Emmah" draws the hunter as a portrait and never writes
    // their name, so dropping portraits deleted them from the sentence.
    const hunts = sample().split('\n').filter(l => l.includes('is coming for'));
    if (!hunts.length) return;
    // Two shapes reach here: the grid row, whose cells are separated, and the
    // alliance line, which is already a sentence. Both must open with a name.
    for (const row of hunts) {
      expect(row, 'a hunt row lost whoever was doing it')
        .toMatch(/^\s+[A-Z][a-z]+( ·)? is coming for/);
    }
  });

  it('does not say a name twice in one row', () => {
    for (const line of sample().split('\n')) {
      const cells = line.trim().split(' · ').filter(c => /^[A-Z][a-z]+$/.test(c));
      expect(new Set(cells).size, `repeated name in: ${line.trim()}`).toBe(cells.length);
    }
  });

  it('drops the portrait letters that used to double every name', () => {
    for (const line of sample().split('\n')) {
      expect(line.trim(), `a bare portrait letter survived: ${line}`).not.toMatch(/^[A-Za-z]$/);
    }
  });
});
