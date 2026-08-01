// How fast a relationship can move.
//
// A stretch of house life runs twenty to thirty beats, so a pair that keeps
// coming up can accumulate the entire scale in one morning. A measured week
// one had two strangers reach +10.0 — inseparable — before the first
// competition, on a screen headed "opening positions". No relationship moves
// at that pace, and it made the panel read as nonsense beside the events that
// supposedly caused it.
import { describe, expect, it } from 'vitest';
import { gs, players, seasonConfig } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond } from '../js/bonds.js';
import { simulateBBEpisode, houseIsAtFinale } from '../js/bb-run.js';
import { generateBBSummaryText } from '../js/text-backlog.js';
import { seedGame } from './helpers/setup.js';

const NAMES = ['Bowie','Chase','Ripper','Scary','Nichelle','Axel','Zee','Brightly','Hicks',
  'Emmah','Millie','Caleb','Wayne','Raj','Julia','Priya','MK','Damien'];
const CAST = NAMES.map((n, i) => ({ name: n, gender: i % 2 ? 'm' : 'f', sexuality: 'straight',
  archetype: ['mastermind','hero','floater','villain','schemer','goat','hothead'][i % 7] }));

function reset() {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, pStats, pronouns, ordinal, getBond, getPerceivedBond, romanticCompat });
  Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 9, twistSchedule: [],
    bbSafetyMode: 'off', bbHaveNots: 'every-week', bbDepartures: 'off', romance: 'enabled', setting: 'bb-house' });
  gs.bb = { outgoingHoh: null, weeks: [], stats: {}, house: null };
  gs.episodeHistory = []; gs.showmances = []; gs.romanticSparks = []; gs.sideDeals = [];
}

describe('relationships move at a plausible pace', () => {
  it('nobody becomes inseparable in a single stretch of week one', () => {
    reset();
    const ep = simulateBBEpisode();
    const opening = ep.openingState?.bonds || {};
    const firstStretch = (ep.acts || []).find(a => a.type === 'house')?.state?.bonds || {};
    for (const [key, value] of Object.entries(firstStretch)) {
      const jump = Math.abs((Number(value) || 0) - (Number(opening[key]) || 0));
      expect(jump, `${key.replace('||', ' & ')} moved ${jump.toFixed(1)} in one stretch`)
        .toBeLessThanOrEqual(2.6);
    }
  });

  it('still lets a real bond build across a season', () => {
    reset();
    let guard = 0;
    while (!houseIsAtFinale() && guard++ < 12) { if (!simulateBBEpisode()) break; }
    const top = Math.max(0, ...Object.values(gs.bonds || {}).map(v => Math.abs(Number(v) || 0)));
    // Capped per stretch, not per season: people should still end up close.
    expect(top, 'the cap flattened the whole season').toBeGreaterThan(5);
  }, 240000);   // a whole season; the 90s default is not enough under load
});

describe('the transcript carries the week', () => {
  it('writes every beat the episode produced', () => {
    reset();
    const ep = simulateBBEpisode();
    const beats = (ep.acts || []).reduce((n, a) => n + (a.socialBeats || []).length, 0);
    const text = generateBBSummaryText(ep);
    const written = (text.match(/^\s+\[[A-Z]/gm) || []).length;
    expect(beats).toBeGreaterThan(40);
    // Allow a small margin for beats whose badge is not upper-case.
    expect(written, `${beats} beats produced, ${written} written`).toBeGreaterThanOrEqual(beats - 5);
  });

  it('explains the vote as well as reporting it', () => {
    reset();
    let ep = null;
    for (let i = 0; i < 2; i++) ep = simulateBBEpisode();
    const text = generateBBSummaryText(ep);
    expect(text).toMatch(/The numbers: \d+ of \d+ decides it\./);
    expect(text).toContain('EVICTION NIGHT');
    // The screen and the transcript should not be two different accounts.
    expect(text).toMatch(/How the plans changed:|promised .* and cast it|went with .* onto/);
  });
});

// Screen time.
//
// One well-connected houseguest was carrying the feed: 142 beats of a week
// against another's 35. Some of that is legitimate — the Head of Household is
// in a dozen power events by definition and the week is genuinely about them —
// but nine beats out of a hundred and ten is not a small part, it is an
// absence.
describe('everybody gets to be in the show', () => {
  it('keeps the quietest houseguest from disappearing', () => {
    reset();
    const ep = simulateBBEpisode();
    const seen = {};
    (ep.houseAtStart || []).forEach(n => { seen[n] = 0; });
    for (const act of ep.acts || []) {
      for (const b of act.socialBeats || []) {
        for (const n of b.players || []) if (n in seen) seen[n]++;
      }
    }
    const counts = Object.values(seen);
    const total = counts.reduce((a, b) => a + b, 0);
    const mean = total / counts.length;
    const quietest = Math.min(...counts);

    // Nobody sits out the week entirely.
    expect(quietest, 'somebody was in no beats at all').toBeGreaterThan(0);
    // And the quietest is within reach of the average rather than a rounding
    // error against it.
    expect(quietest / mean, 'the quietest houseguest was barely in the week')
      .toBeGreaterThan(0.4);
  });

  it('still lets the week be about the people it should be about', () => {
    reset();
    const ep = simulateBBEpisode();
    const seen = {};
    for (const act of ep.acts || []) {
      for (const b of act.socialBeats || []) {
        for (const n of b.players || []) seen[n] = (seen[n] || 0) + 1;
      }
    }
    // The fairness pass must not flatten the feed into everybody getting an
    // identical share — the HOH and the nominees drive the week.
    const counts = Object.values(seen).sort((a, b) => b - a);
    expect(counts[0] / (counts.at(-1) || 1), 'the feed was flattened into a rota')
      .toBeGreaterThan(1.5);
  });
});

// The transcript is the other way somebody reads a week.
//
// It had drifted from the screen in three ways at once: it still printed the
// "HOH's intent — target / pawn / backdoor" line that was removed from the
// visual player for spoiling the ceremony, it summarised the nomination
// ceremony as one line of names rather than transcribing it, and it carried
// raw <strong> tags into what is supposed to be plain text.
describe('the transcript carries the whole week', () => {
  it('is plain text', () => {
    reset();
    let ep = null;
    for (let i = 0; i < 3; i++) ep = simulateBBEpisode();
    const text = generateBBSummaryText(ep);
    const tagged = text.split('\n').filter(l => /<[a-z/][^>]*>/i.test(l));
    expect(tagged.length, `markup in the backlog: ${tagged[0] || ''}`).toBe(0);
    expect(text, 'an HTML entity survived into plain text').not.toMatch(/&(amp|quot|lt|gt|#39);/);
  }, 240000);

  it('does not spoil the ceremony it is about to transcribe', () => {
    reset();
    const ep = simulateBBEpisode();
    const text = generateBBSummaryText(ep);
    expect(text, 'the transcript announces the private plan').not.toContain("HOH's intent");
    const plan = ep.plan || {};
    if (plan.backdoorTarget) {
      const nomIdx = text.indexOf('NOMINATION CEREMONY');
      const head = text.slice(0, nomIdx);
      expect(head, 'the backdoor is given away before the ceremony').not.toContain('backdoor:');
    }
  }, 240000);

  it('transcribes the ceremony rather than summarising it', () => {
    reset();
    const ep = simulateBBEpisode();
    const act = (ep.acts || []).find(a => a.type === 'nominations');
    const text = generateBBSummaryText(ep);
    // The same script the screen runs.
    expect(text).toContain('This is the nomination ceremony');
    expect(text).toContain('their faces will appear on the memory wall');
    expect(text).toContain('Nominations are complete');
    for (const n of act.nominees || []) {
      expect(text, `${n}'s key is never turned in the transcript`)
        .toContain(`key. ${n}'s photograph turns on the memory wall`);
    }
  }, 240000);
});
