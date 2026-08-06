// The viewing party, tested by rendering it.
//
// tests/bb-act-coverage.test.js already asks whether every emitted act has a
// `case` in the VP switch — but it answers that by reading vp-screens.js as
// TEXT. A case that exists and draws nothing passes it: one that returns '',
// one whose builder throws into a try/catch, one that renders a title card and
// silently drops the beats underneath it. Source-shaped guards can only prove
// a case was typed, never that a viewer would see anything.
//
// This one renders. It plays every twist, calls buildVPScreens on the real
// episode, and asks whether the prose the engine wrote actually reaches the
// screen — the same question that caught eight twists dropping their narration
// out of the transcript, pointed at the other end of the pipeline.
import { describe, expect, it } from 'vitest';
import { gs, players, seasonConfig, relationships } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { simulateBBEpisode, BB_TWIST_IDS } from '../js/bb-run.js';
import { buildVPScreens, _tvState } from '../js/vp-screens.js';
import { seedGame } from './helpers/setup.js';
import { withSeededRandom } from './helpers/rng.js';

const STAT_KEYS = ['physical', 'endurance', 'mental', 'social', 'strategic',
  'loyalty', 'boldness', 'intuition', 'temperament'];
const spread = seed => Object.fromEntries(STAT_KEYS.map((k, i) => [k, 1 + ((seed * 7 + i * 3) % 10)]));
const NAMES = ['Bowie', 'Chase', 'Ripper', 'Scary', 'Nichelle', 'Axel', 'Zee', 'Brightly',
  'Hicks', 'Emmah', 'Millie', 'Caleb', 'Jo', 'Dawn'];
const ARCH = ['mastermind', 'social-butterfly', 'hero', 'showmancer', 'schemer', 'floater',
  'villain', 'loyal-soldier', 'underdog', 'goat', 'hothead', 'wildcard',
  'perceptive-player', 'chaos-agent'];
const CAST = NAMES.map((name, i) => ({
  name, gender: i % 2 ? 'm' : 'f', sexuality: 'straight',
  archetype: ARCH[i], stats: spread(i + 1),
}));

// Acts that deliberately have no scene of their own. Lifted from the act
// coverage guard, which documents a reason for each — they are folded into
// another screen's prose, or they are a note to the viewer rather than a
// moment in the house.
// Individual beats a screen deliberately does not reproduce verbatim. Each is
// a decision with a reason, and each is narrow — a badge, not a whole twist —
// so a screen that quietly stopped drawing everything else still fails.
const RETOLD = new Set([
  // The Whacktivity win is withheld on screen exactly as it is on the page:
  // the whole twist is that nobody is told who walked out holding what.
  'WON IN PRIVATE',
]);
// Acts whose screen re-tells some beats in bespoke markup rather than printing
// the engine's sentence. The Time Capsule builds its own briefing and its own
// challenge board out of the act's structured data, which is better than the
// prose and means the prose does not appear.
const RETOLD_BY_ACT = new Set(['time-capsule']);

const NO_SCENE = new Set([
  'house', 'power', 'target', 'safety', 'have-nots', 'generic-result',
  'tiebreaker', 'arena', 'roadkill-win', 'power-expired', 'temptation-curse',
]);

/** Strip markup and entities so a beat can be looked for in rendered HTML. */
const flat = v => String(v ?? '')
  .replace(/<[^>]*>/g, ' ')
  .replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ')
  .replace(/\s+/g, ' ')
  .trim();

function reset(twist) {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns,
    ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
  Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7,
    bbHaveNots: 'off', bbSafetyMode: 'off', romance: 'enabled' });
  seasonConfig.twistSchedule = Array.from({ length: 5 },
    (_, i) => ({ episode: i + 1, type: twist }));
}

/** Play every twist and render each episode's screens for real. */
function sweep(seeds = [11, 58]) {
  const out = [];
  for (const twist of [...BB_TWIST_IDS]) {
    for (const seed of seeds) {
      reset(twist);
      for (let w = 0; w < 5; w++) {
        let ep = null;
        try { ep = withSeededRandom(seed * 13 + w * 3, () => simulateBBEpisode()); } catch { break; }
        if (!ep) break;
        let screens = [];
        let threw = null;
        try {
          // Twist screens are click-to-reveal: `_init` starts every one at
          // idx -1, so a freshly built screen is a stack of "?" placeholders
          // and contains none of its prose. Building once populates _tvState;
          // winding every counter forward and building again gives the HTML a
          // viewer sees once they have clicked to the end, which is the thing
          // actually worth asserting about.
          screens = buildVPScreens(ep) || [];
          for (const k of Object.keys(_tvState)) {
            const st = _tvState[k];
            if (st && typeof st === 'object' && 'idx' in st) st.idx = 9999;
          }
          screens = buildVPScreens(ep) || [];
        } catch (e) { threw = String(e && e.message); }
        out.push({ twist, ep, screens, threw, html: flat(screens.map(s => s.html || '').join(' ')) });
      }
    }
  }
  return out;
}

describe('the Big Brother viewing party as a whole', () => {
  const runs = sweep();

  it('renders every twist without throwing', () => {
    expect(runs.length).toBeGreaterThan(40);
    const broke = runs.filter(r => r.threw).map(r => `${r.twist}: ${r.threw}`);
    expect(broke.slice(0, 5), 'buildVPScreens threw on these weeks').toEqual([]);
  });

  it('draws a screen for every act that has a scene', () => {
    const empty = new Map();
    for (const { twist, ep, screens } of runs) {
      for (const act of ep.acts || []) {
        if (NO_SCENE.has(act.type)) continue;
        if (!(act.beats || []).length) continue;
        // Some screen, somewhere, has to carry real markup for this week.
        const drawn = screens.some(s => (s.html || '').length > 200);
        if (!drawn && !empty.has(act.type)) empty.set(act.type, twist);
      }
    }
    expect([...empty.entries()].map(([t, w]) => `${t} (on ${w})`),
      'these acts produced beats and the viewing party drew nothing at all').toEqual([]);
  });

  // The real question, and the one the source-reading guard cannot ask: the
  // engine wrote this sentence — would a viewer ever see it?
  it('puts every act beat it wrote onto a screen', () => {
    const missing = new Map();
    let checked = 0;
    for (const { twist, ep, html } of runs) {
      for (const act of ep.acts || []) {
        if (NO_SCENE.has(act.type)) continue;
        if (RETOLD_BY_ACT.has(act.type)) continue;
        for (const b of act.beats || []) {
          if (!b || typeof b.text !== 'string' || b.text.length < 40) continue;
          if (RETOLD.has(b.badgeText)) continue;
          checked++;
          const probe = flat(b.text).slice(0, 45);
          if (!html.includes(probe) && !missing.has(act.type)) {
            missing.set(act.type, `${twist} — "${probe}"`);
          }
        }
      }
    }
    expect(checked, 'the sweep rendered no act beats to check').toBeGreaterThan(200);
    expect([...missing.entries()].map(([t, s]) => `${t}: ${s}`),
      'these acts narrated something no screen ever shows').toEqual([]);
  });

  it('never renders a stringified object onto a screen', () => {
    const bad = [];
    for (const { twist, screens } of runs) {
      for (const s of screens) {
        if (String(s.html || '').includes('[object Object]')) {
          bad.push(`${twist}/${s.id || s.label}`);
        }
      }
    }
    expect([...new Set(bad)].slice(0, 5)).toEqual([]);
  });
});
