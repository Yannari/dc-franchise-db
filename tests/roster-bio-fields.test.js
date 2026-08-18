// The bio: authored facts about who a character IS.
//
// Three natures of data live in this project and they must not be confused:
//   authored  — who exists (roster / franchise_roster.json)
//   derived   — what happened in a season (players_database.json)
//   accrued   — what happened to their life afterwards (not built yet)
//
// This covers the first: occupation, hometown, birthdate and backstory, added
// beside the age/ethnicity/nationality/descriptor fields that were already
// there.
//
// The bug this file exists for, found while adding them: `entry` in _save()
// carried six fields — name, slug, gender, sexuality, archetype, stats — and
// `entry` is BOTH what goes into the local pool and what _rosterPush sends to
// D1. Everything biographical went to the IndexedDB `rich` record instead,
// which never leaves the browser. So editing somebody's age in the Studio
// looked like it worked, survived a reload, and never reached the database or
// any published roster. The 27 published characters that do carry those fields
// got them from the original seed parsing the voice lead-in; nothing typed
// since had ever landed.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = f => readFileSync(resolve(process.cwd(), f), 'utf8');

const BIO_FIELDS = ['age', 'birthdate', 'ethnicity', 'nationality',
  'hometown', 'occupation', 'descriptor', 'backstory', 'personality'];
// The four that are new here; the other four predate this and are only being
// carried correctly for the first time.
const NEW_FIELDS = ['birthdate', 'hometown', 'occupation', 'backstory'];

describe('the schema describes the table that actually exists', () => {
  const schema = read('worker/roster_schema.sql');
  const migration = read('worker/roster_migration_bio.sql');

  it('declares every bio column on a fresh database', () => {
    for (const f of BIO_FIELDS) {
      expect(schema, `roster_schema.sql does not declare ${f} — a fresh database `
        + 'would be missing a column the Worker writes').toMatch(new RegExp(`^\\s*${f}\\s`, 'm'));
    }
  });

  it('migrates an existing database for exactly the columns it is missing', () => {
    // Only the four NEW ones. The live table already had age / ethnicity /
    // nationality / descriptor, added out of band before the schema knew about
    // them — and D1 runs a file as ONE BATCH and rolls back on the first error,
    // so an ALTER for a column that already exists does not "fail harmlessly
    // and let the rest through", it discards the whole migration. The first
    // version of this file listed all eight and added nothing.
    for (const f of NEW_FIELDS) {
      expect(migration, `no ALTER for ${f}`).toMatch(new RegExp(`ADD COLUMN\\s+${f}\\b`));
    }
    for (const f of ['age', 'ethnicity', 'nationality', 'descriptor']) {
      expect(migration, `${f} already exists on the live table — an ALTER for it `
        + 'aborts the whole batch and the four new columns never land')
        .not.toMatch(new RegExp(`ADD COLUMN\\s+${f}\\b`));
    }
  });

  it('keeps the ALTERs out of the re-runnable file', () => {
    // roster_schema.sql promises at the top that it is safe to re-run, and
    // SQLite has no ADD COLUMN IF NOT EXISTS — one ALTER in there aborts the
    // whole file on the second run and takes the tombstone table with it.
    expect(schema, 'an ALTER crept into the re-runnable schema')
      .not.toMatch(/ALTER\s+TABLE/i);
  });
});

describe('the Worker reads, writes and publishes the bio', () => {
  const worker = read('worker/worker-studio.js');

  it('persists every bio field on save', () => {
    for (const f of BIO_FIELDS) {
      expect(worker, `${f} is never written by rosterSave`)
        .toMatch(new RegExp(`${f}=excluded\\.${f}`));
    }
  });

  it('publishes them into franchise_roster.json', () => {
    for (const f of NEW_FIELDS) {
      expect(worker, `${f} is stored but never published — the site cannot read it`)
        .toMatch(new RegExp(`out\\.${f}\\s*=`));
    }
  });

  it('rejects a birthdate that is not a real date', () => {
    // Stored as a date, never coerced. A half-parsed date becomes a wrong age
    // on every page that renders it, and the wrongness is invisible because it
    // still looks like a number.
    expect(worker).toMatch(/birthdate must be YYYY-MM-DD/);
    expect(worker).toMatch(/is not a real date/);
  });

  it('never publishes a computed age', () => {
    // franchise_roster.json is regenerated only on Publish, so an age baked
    // into it is wrong from the character's next birthday until someone
    // remembers to press the button.
    const row = worker.slice(worker.indexOf('function rosterRowToJson'),
      worker.indexOf('async function rosterList'));
    expect(row, 'the publisher is computing an age instead of emitting the date')
      .not.toMatch(/getFullYear|Date\.now|new Date\(\)/);
  });
});

describe('the Studio actually sends the bio', () => {
  const studio = read('js/studio.js');

  it('puts every bio field on the entry that reaches D1', () => {
    // The regression that motivated this file: the fields existed in the draft
    // and in the editor, and `entry` did not carry them.
    const save = studio.slice(studio.indexOf('async function _save()'),
      studio.indexOf('// 2) rich record'));
    for (const f of BIO_FIELDS) {
      expect(save, `${f} is edited in the Studio but never sent to the database`)
        .toContain(`'${f}'`);
    }
  });

  it('offers an input for each new field, and stores what is typed', () => {
    for (const f of NEW_FIELDS) {
      expect(studio, `no input for ${f}`).toMatch(new RegExp(`id="st-f-${f}"`));
      expect(studio, `${f} input is not wired to the draft`)
        .toMatch(new RegExp(`#st-f-${f}'\\)\\.addEventListener`));
    }
  });

  it('keeps voice and backstory as separate fields', () => {
    // They overlap in flavour and must not be merged. Voice ships inside every
    // episode prompt — padding it with biography is paid for on every episode
    // of every season — and backstory is read by a human on a wiki page.
    expect(studio).toMatch(/id="st-f-voice"/);
    expect(studio).toMatch(/id="st-f-backstory"/);
  });
});

describe('the player page renders it without inventing anything', () => {
  const page = read('player.html');

  it('computes age from the birthdate rather than trusting a stored one', () => {
    const box = page.slice(page.indexOf('// ── THE BIO'), page.indexOf('// ── WHY TIER'));
    expect(box.length, 'the bio block is missing from player.html').toBeGreaterThan(200);
    expect(box, 'age is not derived from birthdate').toMatch(/getUTCFullYear/);
    expect(box, 'the stored age is not used as a fallback').toMatch(/rp\.age/);
  });

  it('escapes the authored text', () => {
    const box = page.slice(page.indexOf('// ── THE BIO'), page.indexOf('// ── WHY TIER'));
    expect(box, 'authored prose is interpolated unescaped').toMatch(/esc\(rp\.backstory\)/);
  });

  it('renders nothing for a character with no bio', () => {
    const box = page.slice(page.indexOf('// ── THE BIO'), page.indexOf('// ── WHY TIER'));
    expect(box, 'a character with no bio would get an empty panel')
      .toMatch(/if \(!rows\.length && !rp\.backstory\) return '';/);
  });
});

describe('the published roster stays readable by the simulator', () => {
  it('carries only known keys', () => {
    const roster = JSON.parse(read('franchise_roster.json'));
    const players = Array.isArray(roster) ? roster : (roster.players || []);
    expect(players.length).toBeGreaterThan(100);
    const allowed = new Set(['name', 'slug', 'gender', 'sexuality', 'archetype', 'stats',
      // The casting interview travels as one JSON string; js/casting-interview.js
      // owns its shape and nothing between here and the page unpacks it.
      'isReturnee', 'castingInterview', ...BIO_FIELDS]);
    const strays = new Set();
    for (const p of players) for (const k of Object.keys(p)) if (!allowed.has(k)) strays.add(k);
    expect([...strays], 'an unexpected key reached the published roster').toEqual([]);
  });
});

// ── the debut player ──
//
// players_database.json holds FINISHED seasons, so somebody playing their first
// season is not in it. player.html read that absence as "player not found": a
// RETURNING player got a live card on their existing profile and a DEBUT player
// got an error page, for the same eight weeks of television.
//
// Fixed as a fallback, not by writing provisional rows into the derived
// database — its finished-seasons-only rule is load-bearing, since tier,
// avgPlacement, badges and the rankings board all assume a completed run.
describe('somebody with no finished season still has a page', () => {
  const page = read('player.html');

  it('falls back instead of erroring when the database has never heard of them', () => {
    expect(page, 'the not-found path still goes straight to the error page')
      .toMatch(/if \(!player\) \{[\s\S]{0,900}?renderDebutProfile\(playerId\);/);
  });

  it('builds the page from the roster and the live snapshot', () => {
    const fn = page.slice(page.indexOf('async function renderDebutProfile'),
      page.indexOf('async function loadRankingsDatabase'));
    expect(fn.length, 'renderDebutProfile is missing').toBeGreaterThan(400);
    expect(fn, 'the authored bio is not read').toMatch(/franchise_roster\.json/);
    expect(fn, 'the live season is not read').toMatch(/loadLiveSeason\(\)/);
  });

  it('still errors for a genuinely unknown player', () => {
    const fn = page.slice(page.indexOf('async function renderDebutProfile'),
      page.indexOf('async function loadRankingsDatabase'));
    expect(fn, 'an unknown slug would render an empty profile')
      .toMatch(/if \(!rp && !lp\) return fail\(\);/);
  });

  it('invents no tier, rank or score', () => {
    const fn = page.slice(page.indexOf('async function renderDebutProfile'),
      page.indexOf('async function loadRankingsDatabase'));
    // Borrowing a tier would put a colour on the page that means something.
    expect(fn, 'a tier is being guessed for somebody with no record')
      .toMatch(/getTierInfo\(null\)/);
    expect(fn, 'a score ring was drawn for a player with no score')
      .not.toMatch(/pp-ring-fill|pp-score-num/);
  });

  it('shares one stylesheet with the ordinary profile', () => {
    // The debut page emitted .pp-hero markup with no .pp-hero rules behind it
    // and rendered as a full-bleed avatar, because the CSS lived inside
    // renderPlayerProfile. Both callers now ask the same function for it.
    expect(page).toMatch(/function _profileStyles\(tc\)/);
    expect((page.match(/_profileStyles\(/g) || []).length,
      'only one caller uses the shared stylesheet').toBeGreaterThanOrEqual(3);
    expect(page, 'a second copy of the profile CSS was reintroduced')
      .not.toMatch(/let html = `<style>/);
  });
});

// ── personality, and the section that had nowhere to go ──
//
// The wiki article opened at PERSONALITY. It had no Biography section at all,
// which is why it read so much worse than the encyclopedia pages it is modelled
// on: every authored fact about who somebody IS — born, hometown, occupation,
// the backstory paragraphs — was being written into the roster and then
// rendered nowhere. The infobox on player.html showed them; the one tab whose
// whole job is to read like an article did not.
//
// `personality` is the long form of `voice`. They are the same truth at two
// lengths and only one of them is written by hand: voice is the short
// imperative that ships inside EVERY episode prompt, so padding it with
// biography is paid for on every episode of every season, and personality is
// the paragraph a reader gets. Voice stays authored (182 are tuned); the
// personality falls back to it when nobody has written one.
describe('the long-form personality', () => {
  const schema = read('worker/roster_schema.sql');
  const migration = read('worker/roster_migration_personality.sql');
  const worker = read('worker/worker-studio.js');
  const studio = read('js/studio.js');

  it('has its own migration, adding only itself', () => {
    // Its own file, not appended to roster_migration_bio.sql: that one has
    // already been run against the live database, and D1 executes a file as ONE
    // BATCH and rolls back on the first error — so a re-run would fail on
    // `birthdate` and this column would never land.
    expect(migration).toMatch(/ADD COLUMN\s+personality\b/);
    for (const f of BIO_FIELDS.filter(x => x !== 'personality')) {
      expect(migration, `${f} already exists — an ALTER for it aborts the batch`)
        .not.toMatch(new RegExp(`ADD COLUMN\s+${f}\b`));
    }
  });

  it('is declared, stored, published and editable', () => {
    expect(schema).toMatch(/^\s*personality\s/m);
    expect(worker, 'never written').toMatch(/personality=excluded\.personality/);
    expect(worker, 'stored but never published').toMatch(/out\.personality\s*=/);
    expect(studio).toMatch(/id="st-f-personality"/);
    expect(studio).toMatch(/#st-f-personality'\)\.addEventListener/);
  });

  it('keeps the short voice as the authored one', () => {
    // If personality ever became the source and voice were generated from it,
    // every episode prompt would carry a paragraph where it needs a line.
    expect(studio, 'the tuned voice profile was removed').toMatch(/id="st-f-voice"/);
  });
});

describe('the wiki article reads the authored bio', () => {
  const wiki = read('js/wiki.js');
  const view = read('js/wiki-view.js');

  it('puts the new fields on the dossier', () => {
    const fn = wiki.slice(wiki.indexOf('export function buildDossier'));
    for (const f of ['birthdate', 'hometown', 'occupation', 'descriptor']) {
      expect(fn, `${f} never reaches the article`)
        .toMatch(new RegExp(`rosterRow\.${f}`));
    }
    expect(fn, 'backstory is not returned').toMatch(/backstory,/);
  });

  it('derives the age from the birthdate', () => {
    // A stored age is wrong from the character's next birthday until somebody
    // remembers to press Publish.
    expect(wiki).toMatch(/export function _ageFrom/);
    expect(wiki).toMatch(/_ageFrom\(rosterRow\.birthdate\) \?\? rosterRow\.age/);
  });

  it('prefers an authored personality over the parsed voice', () => {
    const fn = wiki.slice(wiki.indexOf('export function personalityOf'),
      wiki.indexOf('export function', wiki.indexOf('export function personalityOf') + 10));
    expect(fn, 'personalityOf ignores the roster row').toMatch(/rosterRow/);
    expect(fn, 'the voice fallback was dropped').toMatch(/voices\[name\]/);
  });

  it('renders a Biography section, above Personality', () => {
    expect(view, 'the article still has no Biography section')
      .toMatch(/section\('biography', 'Biography'/);
    expect(view.indexOf("section('biography'"), 'Biography renders after Personality')
      .toBeLessThan(view.indexOf("'personality', 'Personality'"));
  });

  it('shows nothing rather than an empty heading', () => {
    // 155 of the roster have no bio written yet; they must get the article they
    // already had, not a hollow section.
    const bio = view.slice(view.indexOf('// ── BIOGRAPHY'));
    expect(bio.slice(0, bio.indexOf('── PERSONALITY')),
      'the Biography section renders unconditionally')
      .toMatch(/if \(dossier\.backstory\)/);
  });

  it('keeps the facts in the infobox, not in the body', () => {
    // Born / Hometown / Occupation were briefly a definition list at the top of
    // the Biography section. That put a labelled fact block in the body and
    // left the panel beside it holding four rows — the reference pages do the
    // opposite: the panel under the portrait IS the fact sheet, the body is
    // prose. A reader skims a panel for a fact; they read a body for a story.
    const box = view.slice(view.indexOf('function infobox('), view.indexOf('const careerPairs'));
    for (const f of ['Born', 'Hometown', 'Occupation']) {
      expect(box, `${f} is not a row in the infobox`).toContain(`['${f}',`);
    }
    expect(view, 'the definition list is still being rendered in the body')
      .not.toMatch(/wk-facts/);
  });

  it('never states the age twice', () => {
    // Born already carries "(age 23)". A separate Age row beside it is the same
    // fact printed twice, and they drift the moment one is derived and the
    // other stored.
    const box = view.slice(view.indexOf('function infobox('), view.indexOf('const careerPairs'));
    expect(box).toMatch(/\['Age', !born && bio\.age/);
  });

  it('keeps the paragraph breaks in authored prose', () => {
    expect(view, 'multi-paragraph backstory would render as one block')
      .toContain('.map(par => `<p>${esc(par.trim())}</p>`)');
  });
});

// ── the debut player's WIKI tab ──
//
// The debut page had a Profile tab and nothing else, so everything authored
// about somebody in their first season could only be read as an infobox — the
// article, the one view built to read like an encyclopedia entry, was reachable
// only for people who had already finished a season.
//
// renderArticle stood in the way: it bailed to "has never played X, so there is
// nothing to write" whenever the career held no season of that show, which is
// every show for a debut. That answer is right for a Total Drama veteran's Big
// Brother page and wrong for somebody whose record simply has not started.
describe('somebody in their first season gets the article too', () => {
  const page = read('player.html');
  const view = read('js/wiki-view.js');
  const debut = page.slice(page.indexOf('async function renderDebutProfile'),
    page.indexOf('async function loadRankingsDatabase'));

  it('renders the tab strip and wires it', () => {
    expect(debut, 'no Wiki tab on the debut page').toMatch(/id="pv-wiki"/);
    expect(debut, 'the tab is drawn but never wired').toMatch(/_wireViewTabs\(/);
    expect(debut, 'no host for the article').toMatch(/id="pp-view-wiki"/);
  });

  it('hands the article an empty career rather than inventing one', () => {
    expect(debut, 'the synthesised player is not empty')
      .toMatch(/seasonDetails: \[\]/);
    // Anything else would put a placement or a season on a page whose whole
    // point is that there is not one yet.
    expect(debut, 'a season was fabricated for the article')
      .not.toMatch(/seasonDetails: \[\s*\{/);
  });

  it('opens on the show they are actually playing', () => {
    // Without this the article defaults to Total Drama, so a debut HOUSEGUEST
    // reads as a Total Drama contestant.
    expect(debut).toMatch(/live\.format\).*?_wikiShow = live\.format|_wikiShow = live\.format/s);
  });

  it('keeps the honest empty page for a veteran who skipped a show', () => {
    // `debut` is "no career on ANY show", not "none on this one" — otherwise
    // every veteran's unplayed show would turn into a stub article.
    expect(view).toMatch(/const debut = !\(dossier\.career \|\| \[\]\)\.length;/);
    expect(view, 'the empty page was removed entirely')
      .toMatch(/if \(!hasSeasons && !\(debut && authored\)\) \{/);
  });

  it('still shows nothing for a debut with nothing written', () => {
    // The relaxation is gated on there being authored prose or bio facts to
    // show. An empty roster row earns the empty page, not a hollow stub.
    expect(view).toMatch(/const authored = !!\(dossier\.backstory \|\| dossier\.personality/);
  });
});

// ── claims a page with no record cannot make ──
//
// Every one of these was printed as a fact by a page that had no way of
// knowing it, which is the same failure in three places.
describe('an article with no season claims no show and no count', () => {
  const view = read('js/wiki-view.js');
  const page = read('player.html');

  it('does not name a show in the lead', () => {
    // `format` for somebody with no career is whatever the page defaulted to.
    // The first draft read "Natasha is a law student from California, and a
    // contestant on Total Drama" over a backstory calling her a HOUSEGUEST.
    const from = view.indexOf('function lead(');
    const noSeason = view.slice(view.indexOf('if (!seasons.length)', from),
      view.indexOf('if (seasons.length === 1)', from));
    expect(noSeason.length, 'the no-season branch is missing').toBeGreaterThan(200);
    expect(noSeason, 'the lead names a show it cannot know').not.toMatch(/m\.name/);
  });

  it('does not head the infobox with a show', () => {
    expect(view, 'the infobox still says "TD Profile" for a player with no season')
      .toMatch(/\$\{show\.count\s*\n?\s*\?\s*`\$\{m\.icon\}/);
  });

  it('drops the Seasons row rather than printing 0', () => {
    expect(view).toMatch(/\['Seasons', show\.count \? `\$\{show\.count\} \(\$\{m\.name\}\)` : ''\]/);
  });

  it('says "in the house" only for a house', () => {
    const debut = page.slice(page.indexOf('async function renderDebutProfile'),
      page.indexOf('async function loadRankingsDatabase'));
    expect(debut, 'the live status line is hardcoded to one show')
      .toMatch(/live\?\.format === 'big-brother' \? 'Still in the house'/);
  });
});

// ── a contents entry that points at nothing ──
//
// The contents box is built from the section tree before the pictures are
// fetched, so a gallery that comes back empty removed its section and left
// "3 Gallery" behind, linking to an anchor that no longer existed.
describe('the contents box matches the sections that survived', () => {
  const view = read('js/wiki-view.js');

  it('removes the contents line with the section', () => {
    expect(view).toMatch(/function dropSection\(host, box\)/);
    expect(view, 'the contents link is left behind')
      .toMatch(/\.wk-contents a\[href="#\$\{id\}"\]/);
  });

  it('uses it on both failure paths', () => {
    // Empty listing AND a failed fetch; the second was the one that still
    // called .remove() directly.
    expect((view.match(/dropSection\(host, box\);/g) || []).length).toBe(2);
  });
});
