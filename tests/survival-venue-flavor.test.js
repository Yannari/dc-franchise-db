import { describe, it, expect } from 'vitest';
import { seasonConfig } from '../js/core.js';
import { SETTING_SURVIVAL, SETTING_LIST, survivalFlavor, fillVocab, currentSetting } from '../js/settings.js';

// Every survival event type used by episode.js generateSurvivalEvents.
const EVENT_TYPES = [
  'providerFood', 'providerPraised', 'slackerCalledOut', 'slackerConfrontation',
  'slackerBonding', 'foodConflict', 'foodHoarding', 'starvationBond',
  'foodRationing', 'foodCrisis', 'survivalCollapse', 'medevac', 'providerVotedOut',
];

// Venue-native nouns that must NOT leak into the wrong setting. Keyed by the
// setting that OWNS them; any OTHER setting containing them is a leak.
// Only UNAMBIGUOUS venue-signature nouns. Words shared across venues (e.g.
// "cabin" = camp cabins AND the plane cabin; "fire"; generic "cart"/"take") are
// deliberately excluded — flagging them would be a false positive, not a leak.
const FOREIGN_VOCAB = {
  'survival-island': /(coconut|jungle|makeshift spear|fishing|\bfish\b|the well|the surf|treeline|sleeping mat)/i,
  'carnival': /(carnival|midway|funnel[- ]?cake|corn dog|candy apple|ferris wheel|carousel|funhouse|snack stand|ticket booth|deep-fryer|bumper cars)/i,
  'film-lot': /(craft[- ]services|sound stage|trailer|caterers?|catering|donut|apple box|film lot|call sheet)/i,
  'world-tour': /(economy|galley|foil tray|first class|the aisle|flight attendant|altitude|seat-back|drink cart|drink service)/i,
  'hosted-camp': /(mess hall|\bchef\b|bunk|washroom|campfire|kitchen duty)/i,
};

const fill = (tpl) => fillVocab(String(tpl).replace(/\{a\}/g,'Alice').replace(/\{b\}/g,'Bob').replace(/\{p\}/g,'Alice').replace(/\{po\}/g,'their'));

describe('survival flavor pools — coverage', () => {
  it('every venue defines every survival event type with >=2 variants', () => {
    for (const setting of SETTING_LIST) {
      for (const type of EVENT_TYPES) {
        const pool = SETTING_SURVIVAL[setting]?.[type];
        expect(pool, `${setting}/${type}`).toBeDefined();
        expect(pool.length, `${setting}/${type} variant count`).toBeGreaterThanOrEqual(2);
      }
    }
  });
});

describe('survival flavor pools — zero foreign-venue leaks', () => {
  it('no venue pool contains another venue\'s signature nouns', () => {
    const leaks = [];
    for (const setting of SETTING_LIST) {
      for (const type of EVENT_TYPES) {
        const pool = SETTING_SURVIVAL[setting][type] || [];
        for (const tpl of pool) {
          const text = fill(tpl);
          for (const [owner, rx] of Object.entries(FOREIGN_VOCAB)) {
            if (owner === setting) continue;
            const m = text.match(rx);
            if (m) leaks.push(`[${setting}/${type}] leaks ${owner} vocab "${m[0]}": ${text}`);
          }
        }
      }
    }
    expect(leaks, leaks.join('\n')).toEqual([]);
  });
});

describe('survivalFlavor() picker respects the active setting', () => {
  it('returns setting-native text for each venue across many draws', () => {
    for (const setting of SETTING_LIST) {
      seasonConfig.setting = setting;
      expect(currentSetting()).toBe(setting);
      const ownRx = FOREIGN_VOCAB[setting];
      let sawOwnVocab = false;
      for (let i = 0; i < 400; i++) {
        for (const type of EVENT_TYPES) {
          const text = fill(survivalFlavor(type));
          expect(text.length, `${setting}/${type} empty`).toBeGreaterThan(0);
          // must never contain another venue's signature nouns
          for (const [owner, rx] of Object.entries(FOREIGN_VOCAB)) {
            if (owner === setting) continue;
            expect(rx.test(text), `${setting} drew ${owner} vocab: ${text}`).toBe(false);
          }
          if (ownRx && ownRx.test(text)) sawOwnVocab = true;
        }
      }
      // sanity: the venue's own signature vocab does appear somewhere
      expect(sawOwnVocab, `${setting} never produced its own vocab`).toBe(true);
    }
    seasonConfig.setting = 'hosted-camp';
  });
});
