// The transcript, tested as a transcript.
//
// The per-twist files check that their own act reaches the page. This checks
// the property that only exists across all of them at once: that narration
// which was WRITTEN and SCREENED actually gets written down.
//
// It exists because that property failed silently for eight twists at once.
// `beats(act)` rendered `socialBeats` and nothing else, while an act's own
// prose lives in `act.beats` — so Prizes and Punishments, the Coin of Destiny,
// Battle Back, Camp Comeback, the Halting Hex, the camp door, the Safety Suite
// and the Time Capsule rendered every line as a card in the viewing party and
// dropped all of it on the way to text. Nobody noticed for the same reason it
// is hard to notice now: each case summarises the act's STRUCTURE — who bought
// in, the pick order, who won — so the page reads like a deliberate style
// rather than a hole.
//
// A guard shaped as an allowlist ("these twists must transcribe") would not
// have caught it, because every one of those cases WAS in the list and did
// call the helper. So this walks whatever acts the season actually produced.
import { describe, expect, it } from 'vitest';
import { gs, players, seasonConfig, relationships } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { simulateBBEpisode, BB_TWIST_IDS } from '../js/bb-run.js';
import { generateSummaryText } from '../js/text-backlog.js';
import { seedGame } from './helpers/setup.js';
import { withSeededRandom } from './helpers/rng.js';

const STAT_KEYS = ['physical', 'endurance', 'mental', 'social', 'strategic',
  'loyalty', 'boldness', 'intuition', 'temperament'];
const spread = seed => Object.fromEntries(STAT_KEYS.map((k, i) => [k, 1 + ((seed * 7 + i * 3) % 10)]));
const CAST = [
  ['A', 'mastermind', 'm'], ['B', 'social-butterfly', 'f'], ['C', 'challenge-beast', 'm'],
  ['D', 'schemer', 'f'], ['E', 'hero', 'm'], ['F', 'floater', 'f'],
  ['G', 'villain', 'm'], ['H', 'loyal-soldier', 'f'], ['I', 'underdog', 'm'],
  ['J', 'goat', 'f'], ['K', 'hothead', 'm'], ['L', 'perceptive-player', 'f'],
  ['M', 'wildcard', 'm'], ['N', 'chaos-agent', 'f'],
].map(([name, archetype, gender], i) =>
  ({ name, archetype, gender, sexuality: 'straight', stats: spread(i + 1) }));

// Beats the page withholds ON PURPOSE. A hidden power, a Whacktivity win and a
// temptation are secret by design — the twist IS that the house is not told,
// so the transcript prints a line explaining the omission instead of the beat.
// Keyed by badge rather than by twist, because it is the specific reveal that
// is secret and not the act around it.
const WITHHELD_BADGES = new Set(['FOUND IT', 'WON IN PRIVATE', 'TOOK IT', 'REFUSED IT']);

// The transcript strips the markup the viewing party needs — a beat reading
// "<strong>B</strong> votes to evict" reaches the page as "B votes to evict" —
// so the probe has to be flattened the same way before it can be looked for.
const flat = v => String(v ?? '')
  .replace(/<[^>]*>/g, '')
  .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ');

function reset(twist) {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns,
    ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
  Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7,
    bbHaveNots: 'off', bbSafetyMode: 'off', romance: 'enabled' });
  seasonConfig.twistSchedule = Array.from({ length: 6 },
    (_, i) => ({ episode: i + 1, type: twist }));
}

/** Play every twist and hand back each episode beside its transcript. */
function sweep(seeds = [11, 58]) {
  const out = [];
  for (const twist of [...BB_TWIST_IDS]) {
    for (const seed of seeds) {
      reset(twist);
      for (let w = 0; w < 6; w++) {
        let ep = null;
        try { ep = withSeededRandom(seed * 13 + w * 3, () => simulateBBEpisode()); } catch { break; }
        if (!ep) break;
        let text = '';
        try { text = generateSummaryText(ep) || ''; } catch { text = ''; }
        out.push({ twist, ep, text });
      }
    }
  }
  return out;
}

describe('the Big Brother transcript as a whole', () => {
  const runs = sweep();

  it('plays every twist', () => {
    expect(runs.length).toBeGreaterThan(50);
  });

  it('writes down every act beat it renders in the viewing party', () => {
    const missing = new Map();   // actType -> sample
    let checked = 0;
    for (const { ep, text } of runs) {
      for (const act of ep.acts || []) {
        for (const b of act.beats || []) {
          if (!b || typeof b.text !== 'string' || b.text.length < 30) continue;
          if (WITHHELD_BADGES.has(b.badgeText)) continue;
          checked++;
          // A distinctive slice — full-string matching trips on wrapping.
          const probe = flat(b.text).slice(0, 45);
          if (!text.includes(probe) && !missing.has(act.type)) {
            missing.set(act.type, probe);
          }
        }
      }
    }
    expect(checked, 'the sweep produced no act beats to check').toBeGreaterThan(200);
    expect([...missing.entries()].map(([t, s]) => `${t}: "${s}"`),
      'these acts narrated something the transcript never wrote down').toEqual([]);
  });

  it('writes down every social beat too', () => {
    const missing = new Map();
    for (const { ep, text } of runs) {
      for (const act of ep.acts || []) {
        for (const b of act.socialBeats || []) {
          if (!b || typeof b.text !== 'string' || b.text.length < 30) continue;
          const probe = flat(b.text).slice(0, 45);
          if (!text.includes(probe) && !missing.has(act.type)) missing.set(act.type, probe);
        }
      }
    }
    expect([...missing.entries()].map(([t, s]) => `${t}: "${s}"`),
      'these acts had house reactions the transcript never wrote down').toEqual([]);
  });

  // Whacktivity's variant arrays are called as fn(name, pronouns, powerName),
  // and two variants declared (n, power) — so the pronouns OBJECT bound to
  // `power` and the house was told somebody "wins [object Object]". Cheap to
  // check for across every twist, and it catches the whole bug class.
  it('never narrates a stringified object or a stray undefined', () => {
    const bad = [];
    for (const { twist, ep } of runs) {
      for (const act of ep.acts || []) {
        for (const b of [...(act.beats || []), ...(act.socialBeats || [])]) {
          const t = String(b?.text || '');
          if (t.includes('[object Object]') || /\bundefined\b/.test(t)) {
            bad.push(`${twist}/${act.type}: ${t.slice(0, 70)}`);
          }
        }
      }
    }
    expect(bad.slice(0, 5)).toEqual([]);
  });
});
