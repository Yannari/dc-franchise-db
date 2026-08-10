// Every screen the viewing party draws has to reach a reader.
//
// `bb-transcript-completeness.test.js` guards the beats — narration stored on
// an act as `beats`/`socialBeats`. It cannot see the other half of what a
// viewer watches, because a screen builder is free to compose prose itself out
// of the act's DATA: nomination speeches, ballot scenes, ceremony lines, the
// chips coming out of the veto bag. None of that is a beat, so none of it was
// covered, and two whole screens turned out to reach no reader at all — move-in
// day, which is a season's entire set of first impressions, and the veto draw,
// of which only the twist half was ever written down.
//
// What this asserts is deliberately weaker than parity, because parity is the
// wrong goal: the transcript re-frames constantly and should. The screen writes
// "H sits down in front of the wall. \"This is the nomination ceremony...\"" and
// the page writes "H: \"This is the nomination ceremony...\"" — same content,
// different frame, and forcing them to match would turn the transcript into a
// copy of the markup.
//
// So: EVERY SCREEN MUST REPRODUCE AT LEAST ONE BLOCK OF ITS OWN PROSE VERBATIM,
// unless it is on the list below of screens the page deliberately re-words. A
// screen that reaches the page in some other wording keeps its entry and a
// note; a screen that reaches it not at all fails, which is the case that
// actually shipped twice.
import { describe, expect, it } from 'vitest';
import { gs, players, seasonConfig, relationships } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { simulateBBEpisode } from '../js/bb-run.js';
import { generateSummaryText } from '../js/text-backlog.js';
import { buildVPScreens, _tvState } from '../js/vp-screens.js';
import { seedGame } from './helpers/setup.js';
import { withSeededRandom } from './helpers/rng.js';

const STAT_KEYS = ['physical', 'endurance', 'mental', 'social', 'strategic',
  'loyalty', 'boldness', 'intuition', 'temperament'];
const spread = s => Object.fromEntries(STAT_KEYS.map((k, i) => [k, 1 + ((s * 7 + i * 3) % 10)]));
const CAST = [
  ['A', 'mastermind', 'm'], ['B', 'social-butterfly', 'f'], ['C', 'challenge-beast', 'm'],
  ['D', 'schemer', 'f'], ['E', 'hero', 'm'], ['F', 'floater', 'f'],
  ['G', 'villain', 'm'], ['H', 'loyal-soldier', 'f'], ['I', 'underdog', 'm'],
  ['J', 'goat', 'f'], ['K', 'hothead', 'm'], ['L', 'perceptive-player', 'f'],
  ['M', 'wildcard', 'm'], ['N', 'chaos-agent', 'f'],
].map(([name, archetype, gender], i) =>
  ({ name, archetype, gender, sexuality: 'straight', stats: spread(i + 1) }));

/**
 * Screens whose content the page carries in its own words.
 *
 * Every entry is a claim that has been checked by hand, and the note says where
 * the same information lives. Adding to this list is allowed; adding to it
 * without reading the transcript is how a hole gets legalised.
 */
const REWORDED = new Map([
  ['bb-vdraw', 'THE DRAW, inside POWER OF VETO — "reaches into the bag and pulls"'],
  ['bb-vdraw-2', 'as bb-vdraw, second cycle'],
  ['bb-appstore', 'THE APP STORE — the shelf and the count, with the recipients withheld on purpose'],
  ['bb-americasnominee', "AMERICA'S NOMINEE — the third key on the wall"],
  ['bb-double', 'DOUBLE EVICTION — THE SECOND CYCLE, LIVE'],
  ['bb-otherside', 'THE HOUSE IS SPLIT — "the two halves cannot see or speak to each other"'],
  // Both overview screens used to be here, exempted on the grounds that the
  // transcript said roughly the same thing in prose. It did not: the alliance
  // board and the plan changes are two of the screen's five sections, and the
  // record so far, what everybody is playing for and which relationships are
  // driving decisions reached no reader at all. They are rendered from the
  // builder now, so the page and the transcript cannot drift apart.
]);

const BLOCK = /<\/(div|p|li|td|th|tr|h[1-6]|article|section|blockquote|figcaption|aside)>|<br\s*\/?>/gi;
const flatten = h => String(h || '')
  .replace(/<style[\s\S]*?<\/style>/gi, ' ')
  .replace(/<script[\s\S]*?<\/script>/gi, ' ')
  .replace(BLOCK, '\n')
  .replace(/<[^>]*>/g, ' ')
  .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ')
  .replace(/&middot;/g, '·').replace(/&rarr;/g, '→')
  .split('\n').map(l => l.replace(/\s+/g, ' ').trim()).filter(Boolean);

const CHROME = /^(next|reveal|play|read|open|let them|both of them|all of them|pin the|whole board|just tell me|the next|cameras|live|week \d|feed \d|auto)/i;

/** Blocks that are prose rather than a row of a dashboard. */
const prose = html => flatten(html).filter(l => l.length >= 45
  && /[.!?"”]$/.test(l)
  && (l.match(/\b[a-z]{3,}\b/g) || []).length >= 6
  && !CHROME.test(l));

const norm = s => String(s || '').replace(/\s+/g, ' ').trim();

function reset(twist) {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns,
    ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
  globalThis.gs = gs; globalThis.players = players;
  Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7,
    bbHaveNots: 'off', bbSafetyMode: 'off', romance: 'enabled' });
  seasonConfig.twistSchedule = Array.from({ length: 4 },
    (_, i) => ({ episode: i + 1, type: twist }));
}

// A spread wide enough to draw most screens without playing the whole catalogue
// twice: a plain week, a week with a draw twist on it, the split, the double,
// and the two audience twists that hold their own screens.
const TWISTS = ['none', 'bb-roadkill', 'split-house', 'double-eviction', 'app-store', 'americas-nominee'];

describe('the viewing party and the transcript', () => {
  const covered = new Map();   // screenId -> best coverage seen

  for (const twist of TWISTS) {
    reset(twist);
    for (let w = 0; w < 3; w++) {
      let ep = null;
      try { ep = withSeededRandom(41 * 13 + w * 3, () => simulateBBEpisode()); } catch { break; }
      if (!ep) break;
      let text = '';
      try { text = norm(generateSummaryText(ep) || ''); } catch { text = ''; }
      let screens = [];
      try {
        buildVPScreens(ep);
        Object.keys(_tvState).forEach(k => { if (_tvState[k]) _tvState[k].idx = 99; });
        screens = buildVPScreens(ep) || [];
      } catch { screens = []; }
      for (const sc of screens) {
        const blocks = prose(sc.html);
        if (!blocks.length) continue;
        const hits = blocks.filter(b => {
          const flat = norm(b);
          const mid = Math.max(0, Math.floor(flat.length / 2) - 20);
          return [flat.slice(0, 45), flat.slice(mid, mid + 45), flat.slice(-45)]
            .filter(x => x.length >= 30).some(x => text.includes(x));
        }).length;
        const pct = hits / blocks.length;
        covered.set(sc.id, Math.max(covered.get(sc.id) ?? 0, pct));
      }
    }
  }

  it('draws enough of the show to be worth checking', () => {
    expect(covered.size, 'the sweep produced almost no screens').toBeGreaterThan(12);
  });

  it('never draws a screen the transcript is silent about', () => {
    const silent = [...covered.entries()]
      .filter(([id, pct]) => pct === 0 && !REWORDED.has(id))
      .map(([id]) => id);
    expect(silent,
      'these screens narrated something no reader of the transcript will ever see').toEqual([]);
  });

  it('keeps the re-worded list honest', () => {
    // An entry that starts reproducing its screen verbatim should leave the
    // list, or the list stops describing anything.
    const stale = [...REWORDED.keys()].filter(id => (covered.get(id) ?? 0) > 0.5);
    expect(stale, 'these screens now match the page and no longer need an exemption').toEqual([]);
  });
});
