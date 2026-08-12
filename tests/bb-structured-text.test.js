// The writer was handed a transcript in the simulator's shape and asked for a
// document in a completely different one, so most of what it spent its output
// on was RESTRUCTURING — and every move of a fact from one arrangement to
// another was a chance to move it wrong. That is where the wrong Head of
// Household came from, and the veto winner listed as a nominee.
//
// This emits the target document with the facts already in it and marks what
// needs writing. Cheaper, and much harder to get wrong: the model cannot name
// the wrong HOH when the line above already says who won.
import { describe, expect, it, beforeAll } from 'vitest';
import { gs, players, seasonConfig, relationships, setPlayers, setGs } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { initGameState } from '../js/savestate.js';
import { simulateBBEpisode } from '../js/bb-run.js';
import { generateSummaryText } from '../js/text-backlog.js';
import { generateBBStructuredText } from '../js/bb-structured.js';
import { withSeededRandom } from './helpers/rng.js';
import { readFileSync } from 'node:fs';

const NAMES = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel', 'Zee',
  'Brightly', 'Hicks', 'Emmah', 'Millie', 'Caleb', 'Jo', 'Dawn'];
const ARCH = ['mastermind', 'social-butterfly', 'hero', 'showmancer', 'schemer',
  'floater', 'villain', 'loyal-soldier', 'underdog', 'goat', 'hothead',
  'wildcard', 'chaos-agent', 'perceptive-player'];
const KEYS = ['physical', 'endurance', 'mental', 'social', 'strategic',
  'loyalty', 'boldness', 'intuition', 'temperament'];

let eps = [];

beforeAll(() => {
  setGs(null);
  setPlayers(NAMES.map((name, i) => ({ name, slug: name.toLowerCase(),
    gender: i % 2 ? 'm' : 'f', sexuality: 'straight', archetype: ARCH[i],
    stats: Object.fromEntries(KEYS.map((k, j) => [k, 1 + ((i * 7 + j * 3) % 10)])) })));
  Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats,
    pronouns, ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
  Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7,
    bbHaveNots: 'off', bbSafetyMode: 'on', seasonNumber: 1 });
  seasonConfig.twistSchedule = [];
  initGameState();
  globalThis.gs = gs;
  withSeededRandom(23, () => { for (let i = 0; i < 5; i++) simulateBBEpisode(); });
  eps = gs.episodeHistory;
}, 900000);

const last = () => eps[eps.length - 1];
const doc = () => generateBBStructuredText(last());

describe('nothing the week wrote is lost on the way through', () => {
  it('carries every beat verbatim', () => {
    // The beats are already prose and already the right voice. Asking a model
    // to re-word them costs tokens and loses detail, so they travel whole.
    const ep = last();
    const text = doc();
    const beats = (ep.acts || [])
      .flatMap(a => [...(a.beats || []), ...(a.socialBeats || [])])
      .map(b => b?.text).filter(Boolean);
    expect(beats.length, 'the week wrote no beats at all').toBeGreaterThan(20);
    const missing = beats.filter(t =>
      !text.includes(String(t).replace(/<[^>]*>/g, '').slice(0, 40)));
    expect(missing, missing.length + ' beats vanished').toHaveLength(0);
  });

  it('lands every act somewhere rather than dropping the unmapped ones', () => {
    // Bucketed by phase, because there are ~50 act types and the list grows
    // with every twist — a per-type map would be a new silent hole each time.
    const src = readFileSync('js/bb-structured.js', 'utf8');
    expect(src).toMatch(/function bucketFor/);
    expect(src).toMatch(/Unmapped: the stretch we are currently standing in/);
  });

  it('lists the whole original cast, not just the survivors', () => {
    // The parsers build the season's database off this block, so a short list
    // here quietly loses people everywhere downstream.
    const text = doc();
    const castBlock = text.slice(text.indexOf('=== CAST (ALL) ==='), text.indexOf('=== STILL IN'));
    for (const name of NAMES) expect(castBlock, name + ' missing from the cast').toContain(name);
  });

  it('separates who is left from who has gone', () => {
    const text = doc();
    expect(text).toContain('=== STILL IN THE HOUSE ===');
    expect(text).toContain('=== EVICTED ===');
    const evicted = text.slice(text.indexOf('=== EVICTED ==='), text.indexOf('=== SOURCE'));
    for (const name of gs.eliminated || []) expect(evicted).toContain(name);
  });
});

describe('the facts are stated, not left to be inferred', () => {
  it('names the Head of Household and the veto winner outright', () => {
    const ep = last();
    const text = doc();
    if (ep.hoh) expect(text).toContain(ep.hoh + ' wins Head of Household');
    if (ep.vetoWinner) expect(text).toContain(ep.vetoWinner + ' wins the Power of Veto');
  });

  it('states the veto decision from the record rather than the block', () => {
    expect(doc()).toMatch(/\*\*Veto used:\*\*|\*\*Veto not used\.\*\*/);
  });

  it('prints every ballot as a table', () => {
    const ep = last();
    const text = doc();
    if (!(ep.votingLog || []).length) return;
    expect(text).toContain('| Voter | Vote |');
    for (const b of ep.votingLog) expect(text).toContain('| ' + b.voter + ' | ' + b.voted + ' |');
  });
});

describe('what needs writing is marked, and only that', () => {
  it('leaves slots for the things nobody can derive', () => {
    const text = doc();
    for (const want of ['episode title', 'COMEDY BEATS', 'COLD OPEN HOOK',
      'NEXT EPISODE QUESTIONS', 'WHY THIS VOTE HAPPENED']) {
      expect(text).toContain(want);
    }
    expect(text.match(/\[AI: /g)?.length, 'no slots at all').toBeGreaterThan(6);
  });

  it('is meaningfully smaller than the transcript it replaces', () => {
    const raw = generateSummaryText(last()) || '';
    expect(doc().length).toBeLessThan(raw.length * 0.75);
  });
});

describe('the pipeline still calls the writer', () => {
  it('flags itself explicitly rather than being recognised by shape', () => {
    // Sniffing for narrative headers would read a pre-structured document as
    // finished, and the enhance step would silently never run.
    expect(doc()).toContain('=== SOURCE: SIMULATOR-STRUCTURED ===');
    const page = readFileSync('current-season.html', 'utf8');
    expect(page).toContain("if (text.includes('=== SOURCE: SIMULATOR-STRUCTURED ===')) return true;");
  });

  it('is told to fill the slots rather than rebuild the document', () => {
    const worker = readFileSync('worker/worker-episode-live.js', 'utf8');
    expect(worker).toMatch(/FILL IT IN, DO NOT REBUILD IT/);
    expect(worker).toMatch(/LEAVE THE FACTS EXACTLY AS THEY ARE/);
    expect(worker).toMatch(/KEEP THE HOUSE/);
  });

  it('is attached to every episode the engine builds', () => {
    const src = readFileSync('js/bb-run.js', 'utf8');
    expect((src.match(/generateBBStructuredText\(ep\)/g) || []).length).toBe(3);
    for (const ep of eps) expect(ep.structuredText, 'week ' + ep.num + ' has none').toBeTruthy();
  });

  it('is what the sync sends, with the transcript as the fallback', () => {
    const page = readFileSync('current-season.html', 'utf8');
    expect(page).toMatch(/ep\.structuredText \|\| ep\.summaryText/);
  });

  it('keeps the full transcript alongside it', () => {
    // The transcript is the complete retranscription the viewing party is
    // checked against, and a reading experience in its own right.
    for (const ep of eps) expect(ep.summaryText).toBeTruthy();
  });
});
