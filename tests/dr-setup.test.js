// ══════════════════════════════════════════════════════════════════════
// dr-setup.test.js — the setup screen offers this show what it actually reads
// ══════════════════════════════════════════════════════════════════════
//
// The rule CONFIG_SCOPE encodes: a control is shown only if that format's
// engine reads the value. Every Total Drama mechanic sat on the screen for a
// Big Brother season silently doing nothing until that map existed, and a
// fourth show is a fourth chance to draw a tribe swap over a runway.
import { describe, expect, it } from 'vitest';
import { defaultConfig } from '../js/core.js';
import { configScopeFor, blueprintFor } from '../js/quick-setup.js';
import { readFileSync } from 'node:fs';
import { SHOWS } from '../js/shows.js';

describe('drag-race setup scope', () => {
  it('defaults every dr field', () => {
    const c = defaultConfig();
    expect(c.drPremiere).toBe('standard');
    expect(c.drFinale).toBe('top4');
    expect(c.drDoubleShantay).toBe(true);
    expect(c.drDoubleSashay).toBe(false);
    expect(c.drImmunity).toBe(false);
    expect(c.drTripleLipsync).toBe(false);
    expect(c.drSchedule).toEqual([]);
    expect(c.drJudgeWeights).toEqual({});
  });

  it('shows only what the engine reads', () => {
    const s = configScopeFor('drag-race');
    expect(s.sections).toContain('sec-dr-options');
    expect(s.fields).toEqual(expect.arrayContaining(['cfg-dr-premiere', 'cfg-dr-finale',
      'cfg-dr-double-shantay', 'cfg-dr-double-sashay', 'cfg-dr-immunity', 'cfg-dr-triple']));
    // No tribes to swap, no merge to reach, no theme to author, no castle pot.
    for (const gone of ['cfg-teams', 'cfg-merge', 'cfg-days', 'cfg-theme', 'cfg-tr-pot', 'f-tribe']) {
      expect(s.fields, `${gone} still shown on a runway`).not.toContain(gone);
    }
    for (const gone of ['idol', 'ri', 'mole', 'coaches', 'advantages', 'sid', 'exile']) {
      expect(s.accordions, `${gone} still shown on a runway`).not.toContain(gone);
    }
    // Popularity IS read: every scene writes the ledger.
    expect(s.accordions).toContain('popularity');
  });

  it('draws a blueprint for a stage, not a camp', () => {
    const segs = blueprintFor({ format: 'drag-race', drFinale: 'top4' }, 14);
    expect(segs.map(x => x.label)).toEqual(['14 queens', 'one werk room', 'finale at top 4']);
    expect(segs.every(x => x.ok)).toBe(true);
    // Too few queens is a real answer, not a crash.
    expect(blueprintFor({ format: 'drag-race' }, 5)[0].ok).toBe(false);
    // And a finale bigger than the cast is refused.
    expect(blueprintFor({ format: 'drag-race', drFinale: 'top4' }, 4)[2].ok).toBe(false);
  });

  it('leaves the other three shows\' blueprints alone', () => {
    expect(blueprintFor({ format: 'big-brother', jurySize: 9, finaleSize: 3 }, 16)[0].label)
      .toMatch(/houseguest/);
    expect(blueprintFor({ format: 'total-drama', teams: 2, mergeAt: 12, jurySize: 9, finaleSize: 3 }, 18)[0].label)
      .toMatch(/player/);
  });
});

describe('the setup screen shows one show at a time', () => {
  /* ── FOUND BY READING THE SCREEN, NOT BY A TEST ────────────────────
     Each show's options block opens with fixed rows stating the rules it does
     not offer a choice about — how a tie breaks, how the endgame works. They
     were plain divs with no id, so CONFIG_SCOPE could not reach them and every
     show's rows were drawn at once: a Drag Race season was told a tie is
     "broken by the Head of Household, live" AND that "the room stops
     banishing", one above the other.

     The section labels above them were scoped correctly, which is why nothing
     caught it — the heading said CASTLE OPTIONS and was hidden, and the two
     sentences under it stayed. */
  const html = readFileSync('simulator.html', 'utf8');

  it('every fixed explainer row carries an id', () => {
    const rows = html.match(/<div class="bbopt-fixed"[^>]*>/g) || [];
    expect(rows.length, 'no explainer rows found — did the markup change?').toBeGreaterThan(0);
    for (const r of rows) {
      expect(r, `an explainer row has no id: ${r}`).toMatch(/id="/);
    }
  });

  it('and every one of them is scoped to exactly one show', () => {
    const ids = [...html.matchAll(/<div class="bbopt-fixed" id="([^"]+)"/g)].map(m => m[1]);
    for (const id of ids) {
      const shows = Object.entries(SHOWS)
        .filter(([fmt]) => configScopeFor(fmt).sections.includes(id))
        .map(([fmt]) => fmt);
      expect(shows.length, `${id} is shown on ${shows.length} shows, not 1`).toBe(1);
    }
  });


  /* ── AND THE RULE BEHIND BOTH LEAKS ────────────────────────────────
     Two separate reports, one cause: an element that names a show in its id
     but is missing from CONFIG_SCOPE is drawn on EVERY show. First the fixed
     explainer rows, then five castle controls — the murder shapes the castle
     may spring unasked, the scene density, and three shield settings — so a
     runway was being asked which murder twists it would allow.

     Fixing the seven cases would leave the eighth to be reported. This is the
     rule: if an id names a show, some format must claim it, and exactly one. */
  it('every show-specific control in the markup is scoped', () => {
    const ids = [...html.matchAll(/id="((?:cfg|sec)-(?:tr|bb|dr)-[\w-]+)"/g)].map(m => m[1]);
    expect(ids.length, 'no show-specific ids found — did the markup change?').toBeGreaterThan(20);
    const scoped = new Set();
    for (const fmt of Object.keys(SHOWS)) {
      const sc = configScopeFor(fmt);
      for (const id of [...sc.fields, ...sc.sections, ...sc.accordions]) scoped.add(id);
    }
    const missing = [...new Set(ids)].filter(id => !scoped.has(id));
    expect(missing,
      'these name a show but no format claims them, so they draw on ALL shows')
      .toEqual([]);
  });

  it('and each is claimed by exactly the show its name says', () => {
    const owner = { tr: 'traitors', bb: 'big-brother', dr: 'drag-race' };
    for (const [, id, prefix] of html.matchAll(/id="((?:cfg|sec)-(tr|bb|dr)-[\w-]+)"/g)) {
      const owners = Object.keys(SHOWS).filter(fmt => {
        const sc = configScopeFor(fmt);
        return [...sc.fields, ...sc.sections, ...sc.accordions].includes(id);
      });
      expect(owners, `${id} is claimed by ${owners.join(', ') || 'nobody'}`).toEqual([owner[prefix]]);
    }
  });

  /* ── AND THE SHAPE THE PREFIX RULE ABOVE CANNOT SEE ────────────────
     `f-background` is the cast form's castle-only field. Its id names no show
     — the prefix rule looks for cfg-/sec- ids — but its LABEL does, in so many
     words: "Background (The Traitors)". It was unscoped, so a Drag Race queen
     was being cast as a Civilian.

     A label that names one show is the same declaration an id prefix is, so it
     gets the same rule. */
  it('a control whose label names one show is scoped to that show', () => {
    const SHOW_NAMES = { 'The Traitors': 'traitors', 'Big Brother': 'big-brother', 'Drag Race': 'drag-race' };
    // The Show picker itself names every show on purpose; it is the control
    // you change formats WITH, so it belongs to all of them.
    const ALLOWED = new Set(['cfg-format']);
    const re = /<label class="form-label"[^>]*>([^<]*(?:<span[^>]*>[^<]*<\/span>)?[^<]*)<\/label>\s*<(?:select|input)[^>]*id="([\w-]+)"/g;
    for (const [, labelText, id] of html.matchAll(re)) {
      if (ALLOWED.has(id)) continue;
      const named = Object.entries(SHOW_NAMES).filter(([n]) => labelText.includes(n));
      if (named.length !== 1) continue;
      const [, fmt] = named[0];
      const sc = configScopeFor(fmt);
      const claimed = [...sc.fields, ...sc.sections, ...sc.accordions].includes(id);
      expect(claimed, `${id}'s label says ${named[0][0]} but it is not scoped to ${fmt}`).toBe(true);
      // And it must NOT be shown on the other shows.
      for (const other of Object.keys(SHOWS).filter(f => f !== fmt)) {
        const so = configScopeFor(other);
        expect([...so.fields, ...so.sections, ...so.accordions].includes(id),
          `${id} says ${named[0][0]} but is drawn on ${other}`).toBe(false);
      }
    }
  });

  it('so no show is told another show\'s rules', () => {
    // The concrete case: a drag season must not be offered a Head of Household
    // or a Round Table, and a castle must not be offered a lip sync verdict.
    const drag = configScopeFor('drag-race').sections;
    expect(drag).toContain('sec-dr-fixed-verdict');
    expect(drag).not.toContain('sec-tr-fixed-ties');
    expect(drag).not.toContain('sec-bb-fixed-endgame');
    expect(configScopeFor('traitors').sections).not.toContain('sec-dr-fixed-verdict');
    expect(configScopeFor('big-brother').sections).not.toContain('sec-tr-fixed-ties');
  });
});
