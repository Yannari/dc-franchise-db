// The setup screen shows only what the show being designed actually uses.
//
// A house has no tribes to swap, no idols to hide, no merge to reach and no
// Shot in the Dark to play, and its ties are broken by the Head of Household
// because that is what the format is. Every one of those controls was on the
// page for a Big Brother season, silently doing nothing.
//
// The rule these lock in is evidence-based: a control is shown only if that
// format's engine reads the value.
import { describe, expect, it } from 'vitest';
import { seasonConfig } from '../js/core.js';
import { configScopeFor, validateQuickSetup, blueprintFor } from '../js/quick-setup.js';
import { castWarnings } from '../js/cast-room.js';
import {
  SEASON_SETTINGS, SETTINGS_BY_FORMAT, settingsForFormat, houseSetting, houseProfile,
} from '../js/settings.js';
import { HOUSE_EVENTS, HOUSE_EVENTS_BY_CATEGORY } from '../js/bb-events/index.js';
import { VENUE_EVENTS } from '../js/bb-events/venue.js';

describe('format-scoped setup screen', () => {
  it('hides every Total Drama mechanic from a house', () => {
    const bb = configScopeFor('big-brother');
    // Popularity is NOT in this list: a house has an audience too, and it is
    // now wired — the switch turns tracking off rather than being decoration.
    for (const gone of ['tiebreaker', 'ri', 'sid', 'blackvote', 'aftermathshow', 'journey',
                        'exile', 'fan', 'idol', 'advantages', 'qem',
                        'survival', 'mole']) {
      expect(bb.accordions, `${gone} still shown in a house`).not.toContain(gone);
    }
    for (const gone of ['cfg-days', 'cfg-teams', 'cfg-merge', 'cfg-finale-format', 'cfg-finale-assistants']) {
      expect(bb.fields, `${gone} still shown in a house`).not.toContain(gone);
    }
    expect(bb.sections).not.toContain('sec-season-options');
    // Tribes: neither the per-player field nor the builder belongs in a house.
    expect(bb.fields).not.toContain('f-tribe');
    expect(bb.sections).not.toContain('sec-tribes');
  });

  it('never asks a house about tribes or a merge', () => {
    const bb = { format: 'big-brother', teams: 2, mergeAt: 12, jurySize: 7, finaleSize: 3 };
    const cast = Array.from({ length: 12 }, (_, i) => ({ name: `P${i}`, stats: {} }));
    const rows = validateQuickSetup(bb, cast);
    expect(rows.map(r => r.key)).not.toContain('tribes');
    expect(rows.map(r => r.key)).not.toContain('merge');
    // And the blueprint describes a house rather than a tribe split.
    const segs = blueprintFor(bb, 12).map(s => s.label);
    expect(segs.join(' ')).toContain('houseguests');
    expect(segs.join(' ')).toContain('one house');
    expect(segs.join(' ')).not.toContain('tribes');
    expect(segs.join(' ')).not.toContain('merge');
    // Total Drama is untouched.
    const td = { format: 'total-drama', teams: 2, mergeAt: 8, jurySize: 7, finaleSize: 3 };
    expect(validateQuickSetup(td, cast).map(r => r.key)).toContain('tribes');
    expect(blueprintFor(td, 12).map(s => s.label).join(' ')).toContain('tribes');
  });

  it('drops tribe-shaped casting warnings in a house', () => {
    const cast = [
      { name: 'A', tribe: 'Alpha', stats: {} }, { name: 'B', tribe: 'Alpha', stats: {} },
      { name: 'C', tribe: 'Beta', stats: {} }, { name: 'D', stats: {} },
    ];
    const td = castWarnings(cast, [], ['Alpha', 'Beta', 'Ghost']).map(w => w.text).join(' ');
    expect(td).toMatch(/tribe/i);
    const bb = castWarnings(cast, [], ['Alpha', 'Beta', 'Ghost'], { format: 'big-brother' })
      .map(w => w.text).join(' ');
    expect(bb).not.toMatch(/tribe/i);
  });

  // Romance runs in both shows, so it is relocated into House Options rather
  // than duplicated — one control, one source of truth. It is deliberately not
  // in the scope table, because the table hides things and this one never hides.
  it('never hides romance from either show', () => {
    for (const fmt of ['big-brother', 'total-drama']) {
      expect(configScopeFor(fmt).accordions).not.toContain('romance');
    }
  });

  it('drops the whole Total Drama twist stack from a house', () => {
    const bb = configScopeFor('big-brother');
    expect(bb.sections).not.toContain('sec-formats-twists');
    expect(bb.sections).not.toContain('sec-formats-twists-divider');
    expect(configScopeFor('total-drama').sections).toContain('sec-formats-twists');
  });

  it('gives the house its own options and keeps them out of Total Drama', () => {
    const bb = configScopeFor('big-brother');
    const td = configScopeFor('total-drama');
    for (const own of ['cfg-bb-interview', 'cfg-bb-host', 'cfg-bb-host-style', 'cfg-bb-havenots']) {
      expect(bb.fields).toContain(own);
      expect(td.fields).not.toContain(own);
    }
    expect(bb.sections).toContain('sec-bb-options');
    expect(td.sections).not.toContain('sec-bb-options');
    // The whole container, not just the heading: the fixed-rule lines inside
    // it are plain divs and would otherwise stay visible in Total Drama.
    expect(bb.sections).toContain('bb-options-body');
    expect(td.sections).not.toContain('bb-options-body');
  });

  it('leaves the Total Drama machinery alone', () => {
    const td = configScopeFor('total-drama');
    for (const kept of ['tiebreaker', 'ri', 'sid', 'idol', 'mole', 'survival']) {
      expect(td.accordions).toContain(kept);
    }
    expect(td.fields).toContain('cfg-teams');
    expect(td.sections).toContain('sec-season-options');
  });
});

describe('house venues', () => {
  it('offers several houses, each a complete profile', () => {
    const ids = settingsForFormat('big-brother');
    expect(ids.length).toBeGreaterThanOrEqual(4);
    for (const id of ids) {
      const p = SEASON_SETTINGS[id];
      expect(p, `${id} has no profile`).toBeTruthy();
      expect(p.label).toBeTruthy();
      expect(p.blurb).toBeTruthy();
      expect(p.arrival?.headline, `${id} has no arrival`).toBeTruthy();
      expect(p.atmosphere?.length, `${id} has no atmosphere`).toBeGreaterThanOrEqual(4);
      // The vocabulary is what house events read; a missing token prints a token.
      for (const token of ['place', 'shelter', 'gather', 'water', 'sleep', 'downtime', 'foodSource']) {
        expect(p.vocab?.[token], `${id} is missing vocab.${token}`).toBeTruthy();
      }
    }
    // No venue is shared between the two shows.
    const td = new Set(SETTINGS_BY_FORMAT['total-drama']);
    for (const id of ids) expect(td.has(id)).toBe(false);
  });

  it('never describes a house season as a summer camp', () => {
    seasonConfig.setting = 'hosted-camp';   // carried over from a Total Drama season
    expect(houseSetting()).toBe('bb-house');
    expect(houseProfile().vocab.place).toBe('the house');
    seasonConfig.setting = 'bb-manor';
    expect(houseSetting()).toBe('bb-manor');
    expect(houseProfile().vocab.gather).toBe('the drawing room');
  });

  it('makes the venue matter: house events read it', () => {
    // Registered, or the whole layer is unreachable — which is how the setting
    // dropdown came to change nothing in the first place.
    for (const ev of VENUE_EVENTS) {
      expect(HOUSE_EVENTS, `${ev.id} not registered`).toContain(ev);
      expect(typeof ev.weight).toBe('function');
      expect(typeof ev.fire).toBe('function');
    }
    expect(HOUSE_EVENTS_BY_CATEGORY['house-life']).toEqual(
      expect.arrayContaining(VENUE_EVENTS.filter(e => e.category === 'house-life')));
  });
});
