// The casting interview: the questionnaire written BEFORE somebody plays.
//
// Modelled on the reference character pages, checked through the MediaWiki API
// across four of them rather than from a screenshot. On those it IS the
// Personality section — a collapsed table headed "<Name> Biography".
//
// Two design decisions carry all the risk, and both are guarded here:
//
//   1. It is stored WITH its question text. A wiki renders answers written long
//      before the current wording of the list; keeping only the answers means
//      editing a question silently re-labels every answer already given, and
//      the page shows a new question over an old reply.
//
//   2. It never reads season data. "Do you have a strategy for winning" is
//      answered by somebody who has not played. Generated afterwards it leaks
//      the ending — the winner sounds certain, the first boot sounds doomed.
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  INTERVIEW_QUESTIONS, parseInterview, serializeInterview, hasInterview, labelFor,
} from '../js/casting-interview.js';

const read = f => readFileSync(resolve(process.cwd(), f), 'utf8');

describe('the question list', () => {
  it('has a unique, stable key for every question', () => {
    const keys = INTERVIEW_QUESTIONS.map(x => x.key);
    expect(new Set(keys).size, 'two questions share a key — one would overwrite the other')
      .toBe(keys.length);
    for (const k of keys) expect(k).toMatch(/^[a-zA-Z][a-zA-Z0-9]*$/);
  });

  it('asks every question the reference pages ask', () => {
    // Taken from mhrp.fandom.com, four pages, identical on all of them.
    for (const frag of ['adjectives', 'picked', 'hardest', 'strategy', 'knownHidden',
      'threeThings', 'activities', 'drama', 'showmance', 'motto', 'hopeToGet']) {
      expect(INTERVIEW_QUESTIONS.some(x => x.key === frag), `no ${frag} question`).toBe(true);
    }
  });

  it('names no show', () => {
    // Their wording is "living in The Mad House". Ours runs two shows and a
    // house is not a camp, so the questions ask about "the house" generically
    // — and the day a question needs to differ per show it must come from the
    // registry, not be hardcoded to whichever show was written first.
    for (const x of INTERVIEW_QUESTIONS) {
      expect(x.q, `"${x.q}" names a show`).not.toMatch(/Total Drama|Big Brother/i);
    }
  });
});

describe('reading a stored interview', () => {
  const stored = JSON.stringify([
    { key: 'drama', q: 'What do you think of drama?', a: 'It is noise.' },
    { key: 'adjectives', q: 'Three adjectives that describe you:', a: 'Quiet. Deliberate.' },
  ]);

  it('returns the answers in the canonical order, not the stored order', () => {
    // So reordering the list above reorders every existing interview without
    // rewriting a single stored row.
    const rows = parseInterview(stored);
    expect(rows.map(r => r.key)).toEqual(['adjectives', 'drama']);
  });

  it('renders the question that was stored, not the one that is current', () => {
    const old = JSON.stringify([{ key: 'drama', q: 'How do you feel about drama?', a: 'Noise.' }]);
    expect(parseInterview(old)[0].q, 'the stored wording was replaced by the current one')
      .toBe('How do you feel about drama?');
  });

  it('keeps an answer whose question no longer exists', () => {
    // Deleting somebody's written answer because the list moved on is the wrong
    // way round. It renders from its own stored text, after the known ones.
    const rows = parseInterview(JSON.stringify([
      { key: 'retired', q: 'A question we removed', a: 'An answer somebody wrote.' },
      { key: 'drama', q: 'What do you think of drama?', a: 'Noise.' },
    ]));
    expect(rows.map(r => r.key)).toEqual(['drama', 'retired']);
    expect(rows[1].q).toBe('A question we removed');
  });

  it('drops blanks, duplicates and rows with no key', () => {
    const rows = parseInterview(JSON.stringify([
      { key: 'drama', q: 'Q', a: 'first' },
      { key: 'drama', q: 'Q', a: 'second' },
      { key: 'motto', q: 'Q', a: '   ' },
      { key: '', q: 'Q', a: 'orphan' },
    ]));
    expect(rows).toHaveLength(1);
    expect(rows[0].a).toBe('first');
  });

  it('survives anything that is not an interview', () => {
    for (const bad of ['', null, undefined, 'not json', '{', '[]', '{}', 42, []]) {
      expect(parseInterview(bad), `${JSON.stringify(bad)} threw or returned junk`).toEqual([]);
    }
  });

  it('reads the bare-map shape too', () => {
    // One round of hand-editing away from existing, and cheap to accept.
    const rows = parseInterview({ drama: 'Noise.', motto: '' });
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ key: 'drama', a: 'Noise.' });
    expect(rows[0].q).toBe(labelFor('drama'));
  });
});

describe('writing one', () => {
  it('stores nothing at all when nothing was answered', () => {
    // An untouched interview must be NULL in the column, not an empty structure
    // that every reader has to interpret as "written, and blank".
    expect(serializeInterview({})).toBe('');
    expect(serializeInterview({ drama: '   ' })).toBe('');
    expect(hasInterview(serializeInterview({}))).toBe(false);
  });

  it('round-trips', () => {
    const written = { drama: 'Noise.', motto: 'it is old, and it still cuts.' };
    const rows = parseInterview(serializeInterview(written));
    expect(Object.fromEntries(rows.map(r => [r.key, r.a]))).toEqual(written);
    for (const r of rows) expect(r.q, `${r.key} was stored without its question`).toBeTruthy();
  });

  it('keeps the line breaks in a list answer', () => {
    // "What are three things you would take into the house" is answered as a
    // list on every reference page; flattened, it reads as one run-on sentence.
    const a = '- A whetstone.\n- A glove.\n- Boots that fit.';
    expect(parseInterview(serializeInterview({ threeThings: a }))[0].a).toBe(a);
  });
});

describe('one source of truth', () => {
  it('is imported everywhere it is used, never copied', () => {
    // docs/ADDING-A-SHOW.md exists because eight files each kept their own copy
    // of the show list. Three places need this list — the Studio's form, the
    // article's box, and the generator's prompt — and a second copy of eleven
    // questions would drift on the first edit.
    for (const f of ['js/studio.js', 'js/wiki-view.js']) {
      expect(read(f), `${f} does not import the question list`)
        .toMatch(/from '\.\/casting-interview\.js'/);
    }
    for (const f of ['js/studio.js', 'js/wiki-view.js', 'worker/worker-studio.js']) {
      expect(read(f), `${f} has its own copy of a question`)
        .not.toMatch(/Three adjectives that describe you/);
    }
  });

  it('is never built from a played season', () => {
    const src = read('js/casting-interview.js');
    for (const leak of ['episodeHistory', 'placement', 'seasonDetails', 'players_database']) {
      expect(src, `the interview reads ${leak} — it is written before they play`)
        .not.toContain(leak);
    }
  });
});

describe('the column that holds it', () => {
  it('is declared, migrated, stored and published', () => {
    expect(read('worker/roster_schema.sql'), 'not declared on a fresh database')
      .toMatch(/^\s*casting_interview\s/m);
    expect(read('worker/roster_migration_casting_interview.sql'))
      .toMatch(/ADD COLUMN\s+casting_interview\b/);
    const w = read('worker/worker-studio.js');
    expect(w, 'never written').toMatch(/casting_interview=excluded\.casting_interview/);
    expect(w, 'stored but never published').toMatch(/out\.castingInterview\s*=/);
  });

  it('has its own migration file, altering nothing that already exists', () => {
    // roster_migration_bio.sql and roster_migration_personality.sql have both
    // run against the live database. D1 executes a file as ONE BATCH and rolls
    // back on the first error, so appending to either would fail on a duplicate
    // column and land nothing.
    const mig = read('worker/roster_migration_casting_interview.sql');
    for (const f of ['birthdate', 'hometown', 'occupation', 'backstory', 'personality']) {
      expect(mig, `${f} already exists — an ALTER for it aborts the whole batch`)
        .not.toMatch(new RegExp(`ADD COLUMN\\s+${f}\\b`));
    }
  });
});

describe('the article renders it the way the reference does', () => {
  const view = read('js/wiki-view.js');

  it('collapsed, headed "<Name> Biography", inside Personality', () => {
    expect(view).toMatch(/<details class="wk-iv">/);
    expect(view, 'the box is not headed with their name').toMatch(/\$\{esc\(dossier\.name\)\} Biography/);
    const sec = view.slice(view.indexOf('── PERSONALITY'));
    expect(sec.slice(0, sec.indexOf("section('personality'") + 40),
      'the interview is rendered outside the Personality section').toContain('wk-iv');
  });

  it('does not repeat the infobox facts', () => {
    // Their box opens with Age / Hometown / Occupation, which on our page are
    // infobox rows two inches to the right. A hand-edited wiki can afford a
    // duplicate; we would have to keep it in sync.
    const box = view.slice(view.indexOf('const rows = parseInterview'));
    expect(box.slice(0, box.indexOf('</details>')))
      .not.toMatch(/bio\.hometown|bio\.occupation|bio\.age/);
  });

  it('keeps the line breaks a list answer was written with', () => {
    expect(view, 'a multi-line answer would render as one run-on line')
      .toMatch(/\.wk-iv-body dd\{[^}]*white-space:pre-line/);
  });
});

// ── the generator ──
//
// Lives on the analytics worker, which already holds the key and already
// dispatches creative writing by mode. It is a pure text endpoint: it writes
// answers and returns them. It does not touch the database, because the answers
// are a first draft in somebody else's voice and must be read before they land.
describe('writing one with the model', () => {
  const worker = read('worker/worker-episode-live.js');
  const studio = read('js/studio.js');
  const fn = worker.slice(worker.indexOf('async function generateCastingInterview'),
    worker.indexOf('async function socialViaOpenAI'));

  it('is reachable as its own mode', () => {
    expect(fn.length, 'generateCastingInterview is missing').toBeGreaterThan(500);
    expect(worker).toMatch(/mode === "casting-interview"/);
  });

  it('CANNOT be handed a season', () => {
    // The guard the whole feature rests on. Every other mode in that worker
    // takes episode text and writes about what happened; this one is the
    // opposite. If a placement can reach the prompt, the winner starts writing
    // like a winner and every page spoils its own season.
    //
    // Guarded on what it READS off the request, not on words in the prompt —
    // the prompt says "never mention a season, a placement, a competition you
    // won", and a naive scan for those words flags the prohibition itself.
    const reads = new Set([...fn.matchAll(/body\.(\w+)/g)].map(m => m[1]));
    expect([...reads].sort(), 'the handler reads something other than the person')
      .toEqual(['person', 'questions']);
    // And nothing season-shaped is threaded in under another name.
    for (const leak of ['summaryText', 'episodeText', 'previousEpisodes',
      'episodeHistory', 'seasonDetails', 'ledger', 'storyBible']) {
      expect(fn, `the casting interview prompt can see ${leak}`).not.toContain(leak);
    }
    // And it is told so in as many words, because the prompt is the guard.
    expect(fn).toMatch(/has not happened/);
  });

  it('takes the question list from the caller instead of keeping one', () => {
    expect(fn, 'the worker keeps its own copy of the questions')
      .toMatch(/body\.questions/);
    expect(fn).toMatch(/no questions — the caller owns the list/);
  });

  it('returns only answers to questions that were asked', () => {
    // A model that invents a twelfth question must not be able to write a row
    // nothing renders.
    expect(fn).toMatch(/for \(const q of questions\)/);
  });

  it('never writes to the database from the Studio button', () => {
    const btn = studio.slice(studio.indexOf("ed.querySelector('#st-iv-write')"),
      studio.indexOf("ed.querySelectorAll('#st-f-gender button')"));
    expect(btn.length, 'the generate handler is missing').toBeGreaterThan(400);
    expect(btn, 'the button saves behind your back — these are a first draft')
      .not.toMatch(/_save\(|_rosterPush|\/api\/roster/);
    expect(btn, 'existing answers are overwritten without asking').toMatch(/confirm\(/);
    expect(btn, 'a failure would be silent').toMatch(/could not write it/);
  });

  it('resolves the worker URL instead of hardcoding a second one', () => {
    // Pointing at the Season Builder by mistake falls through to its default
    // branch and returns analytics — no error, no answers, nothing to explain.
    expect(studio).toMatch(/import \{ writerEndpoint \}/);
    expect(studio).not.toMatch(/dc-analytics\.[a-z0-9]+\.workers\.dev/);
  });
});

// ── the payload carries what the questions actually need ──
//
// Found by running it: the model answered "would you be in a showmance" with
// "I am asexual, and I am not going to fake something intimate for television"
// — correct, and reached by luck. It read that off the voice profile's bio
// lead-in, and the Studio sends `d.voice`, which is the prose with that lead-in
// STRIPPED. The first test only passed because it was handed the raw profile by
// hand. One of the eleven questions asks about romance outright, so the field
// travels on its own rather than riding along inside prose.
describe('the person sent to the model', () => {
  const studio = read('js/studio.js');
  const worker = read('worker/worker-episode-live.js');
  const btn = studio.slice(studio.indexOf("ed.querySelector('#st-iv-write')"),
    studio.indexOf("ed.querySelectorAll('#st-f-gender button')"));

  it('includes sexuality, which one question asks about directly', () => {
    expect(btn, 'sexuality is not sent, so the showmance answer is a guess')
      .toMatch(/sexuality: d\.sexuality/);
    expect(worker, 'the prompt never states it').toMatch(/p\.sexuality/);
  });

  it('states it only when it is worth stating', () => {
    // Spelling out "Sexuality: straight" for three quarters of the roster is
    // noise in a prompt, and invites an answer about it that nobody asked for.
    expect(worker).toMatch(/p\.sexuality !== "straight"/);
  });

  it('sends the voice, which is what makes it sound like them', () => {
    expect(btn).toMatch(/voice: d\.voice/);
    expect(btn).toMatch(/backstory: d\.backstory/);
  });
});
