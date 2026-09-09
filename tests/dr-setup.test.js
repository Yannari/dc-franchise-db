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

  /* ── THE CAST FORM, FIELD BY FIELD ─────────────────────────────────
     Three leaks were reported from this one form: the castle's Background
     select, the murder twists, and Total Drama's Coach tick. None of them
     could be caught by a rule about ids or labels, because "Coach" names no
     show and neither does `f-coach`.

     So this one is a CLASSIFICATION rather than a pattern: every control in
     the cast form is either universal or belongs to one show, somebody has to
     say which, and a field added later fails this test until they do. That is
     a list, which this project usually refuses — but the alternative here is
     no rule at all, and a list that FAILS ON ADDITION is not the same as one
     that goes stale silently. */
  const CAST_FORM = {
    'f-name': null, 'f-slug': null, 'f-gender-seg': null, 'f-sexuality': null,
    'f-archetype': null, 'f-returnee': null, 'f-portrait-picker': null,
    'f-portrait-status': null, 'f-background-preview': null,
    'f-tribe': 'total-drama',       // a house, a castle and a workroom have no tribes
    'f-coach': 'total-drama',       // a coach trains a tribe from the sideline
    'f-background': 'traitors',     // Alumni / Celebrity / Civilian is the castle's question
    'f-drag-style': 'drag-race',    // only this show's judges score a drag style
  };

  it('every cast-form field is classified, and none has appeared unclassified', () => {
    const ids = [...new Set([...html.matchAll(/id="(f-[\w-]+)"/g)].map(m => m[1]))];
    const unknown = ids.filter(id => !(id in CAST_FORM));
    expect(unknown,
      'a cast-form field nobody has classified — decide whether it is universal '
      + 'or belongs to one show, and add it to CAST_FORM above')
      .toEqual([]);
  });

  it('and each show-specific one is scoped to exactly its show', () => {
    for (const [id, fmt] of Object.entries(CAST_FORM)) {
      const shownOn = Object.keys(SHOWS).filter(f => {
        const sc = configScopeFor(f);
        return [...sc.fields, ...sc.sections, ...sc.accordions].includes(id);
      });
      if (fmt === null) {
        expect(shownOn, `${id} is universal but scoped to ${shownOn.join(', ')}`).toEqual([]);
      } else {
        expect(shownOn, `${id} belongs to ${fmt} but is drawn on ${shownOn.join(', ') || 'nothing'}`)
          .toEqual([fmt]);
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

// ══════════════════════════════════════════════════════════════════════
// The one twist this show schedules
// ══════════════════════════════════════════════════════════════════════
describe('the twists are in the catalogue', () => {
  /* THEY WERE CHECKBOXES AND TEXT BOXES IN MAIN STAGE OPTIONS, which is where
     a FORMAT choice belongs — how the finale is shaped, whether the host may
     keep both. A twist that happens on one named episode is not that, and
     every other show books its twists on `twistSchedule` through the
     designer. So does this one now. */
  it('offers this show its own twists and no other show twists', async () => {
    const { twistsForFormat } = await import('../js/core.js');
    const mine = twistsForFormat({ format: 'drag-race' });
    const ids = mine.map(t => t.id);
    expect(ids).toContain('dr-no-elimination');
    expect(ids).toContain('dr-double-elimination');
    /* NOT the smackdown. It spent a while in here on the reasoning that a
       reunion happening on one episode is a twist — and it is not, because no
       author picks the episode: it always sits directly before the crowning.
       That is a season SHAPE, so it went back to a MAIN STAGE OPTION beside
       the premiere and the finale. `cfg-dr-smackdown` / `drSmackdown`. */
    expect(ids, 'the smackdown is a config option, not a per-episode twist')
      .not.toContain('dr-smackdown');
    // Scoped: a drag season is never offered another show's twist.
    for (const t of mine) expect(t.format, `${t.id} is not scoped`).toBe('drag-race');
    for (const other of ['traitors', 'big-brother', 'total-drama']) {
      const theirs = twistsForFormat({ format: other }).map(t => t.id);
      for (const id of ids) expect(theirs, `${other} was offered ${id}`).not.toContain(id);
    }
  });

  it('every episode twist names the flag the engine reads', async () => {
    const { twistsForFormat } = await import('../js/core.js');
    for (const t of twistsForFormat({ format: 'drag-race' })) {
      // Either it is booked against an episode and says which flag it sets,
      // or it is season-wide. A twist that is neither cannot be applied.
      expect(!!t.episodeField || !!t.seasonWide,
        `${t.id} is neither an episode twist nor season-wide`).toBe(true);
      expect(t.desc.length, `${t.id} has no description`).toBeGreaterThan(80);
    }
  });

  it('the per-episode controls are gone, and so is their scoping', () => {
    /* These two ARE twists — an author picks the week a free one or a double
       lands on — so they belong in the designer and their old checkboxes had
       to go. The smackdown is not on this list any more: it went the other
       way, out of the catalogue and back to a main stage option, because
       nobody chooses its episode. */
    const html = readFileSync('simulator.html', 'utf8');
    for (const id of ['cfg-dr-noelim', 'cfg-dr-double-elim']) {
      expect(html, `${id} is still in the page`).not.toContain(id);
    }
    const qs = readFileSync('js/quick-setup.js', 'utf8');
    for (const id of ['cfg-dr-noelim', 'cfg-dr-double-elim']) {
      expect(qs, `${id} is scoped but does not exist`).not.toContain(id);
    }
    // And the one that came back is a real control, scoped to this show only.
    expect(html, 'the smackdown has no control').toContain('cfg-dr-smackdown');
    expect(qs, 'the smackdown control draws on every show').toContain('cfg-dr-smackdown');
  });
});

describe('the smackdown', () => {
  /* js/dr/season.js has read `config.drSmackdown` since it was written, and
     js/dr-run.js's _config() never passed it — so the whole reunion, engine
     and challenge module and all, was unreachable from a played season. There
     was no control for it either, so nothing pointed at the gap. This is the
     project's signature bug at its largest scale so far: a complete feature,
     tested in isolation, that the game could not reach. */
  it('is handed to the engine by the run loop', () => {
    const src = readFileSync('js/dr-run.js', 'utf8');
    const cfg = src.slice(src.indexOf('function _config'), src.indexOf('function _playWholeSeason'));
    expect(cfg, '_config drops drSmackdown again').toMatch(/drSmackdown/);
    // Every other option the engine reads has to survive the same trip.
    for (const key of ['drPremiere', 'drFinale', 'drSchedule', 'drDoubleShantay']) {
      expect(cfg, `_config drops ${key}`).toMatch(new RegExp(key));
    }
  });

  it('is a main stage option, and an old catalogue booking still plays', () => {
    /* It moved to the catalogue once, on the reasoning that a reunion
       happening on one episode is a twist and every other show books its
       twists through the designer. It moved back: no author picks the
       episode, because it always sits directly before the crowning. That is
       a season shape, which is what MAIN STAGE OPTIONS is for.
       Both readers stay, config first — a season saved during the catalogue
       spell still has the booking on its schedule and must still play. */
    const run = readFileSync('js/dr-run.js', 'utf8');
    expect(run, 'the config option is not read').toMatch(/seasonConfig\.drSmackdown/);
    expect(run, 'a season saved while it was a twist no longer plays')
      .toMatch(/_twistBooked\('dr-smackdown'\)/);
  });

  it('adds an episode before the finale and crowns nobody new', async () => {
    const { playDragSeason } = await import('../js/dr/season.js');
    const { rngFor } = await import('../js/dr/rng.js');
    const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic',
      'loyalty', 'boldness', 'intuition', 'temperament'];
    const mk = () => {
      const rng = rngFor(9); const r = () => 1 + Math.floor(rng() * 10);
      return Array.from({ length: 12 }, (_, i) => ({
        name: `Q${i + 1}`, slug: `q${i + 1}`, gender: 'm', sexuality: 'gay',
        archetype: 'hero', age: 22 + i,
        stats: Object.fromEntries(STATS.map(k => [k, r()])),
        drag: { acting: r(), comedy: r(), dance: r(), design: r(), runway: r(), lipsync: r(), singing: r() },
      }));
    };
    const base = playDragSeason({ cast: mk(), seed: 4 });
    const with_ = playDragSeason({ cast: mk(), seed: 4, config: { drSmackdown: true } });
    expect(with_.rows.length, 'the smackdown did not run').toBe(base.rows.length + 1);
    // It sits one episode before the crowning.
    const i = with_.rows.findIndex(r => r.dr.smackdown || r.dr.challenge?.id === 'lalaparuza');
    expect(i, 'no smackdown episode').toBeGreaterThan(-1);
    expect(with_.rows[i + 1]?.dr?.finale, 'it is not before the finale').toBeTruthy();
    // And it changes nothing about the competition.
    expect(with_.winner).toBe(base.winner);
    expect(with_.smackdownWinner, 'nobody won it').toBeTruthy();
    expect(with_.rows[i].exits.length, 'the smackdown eliminated somebody').toBe(0);
  });
});
