// The casting interview — the questionnaire a contestant fills in BEFORE they
// play, and the thing every reference character page opens with.
//
// On mhrp.fandom.com it is the whole of the "Personality" section: a
// collapsed table headed "<Name> Biography", four facts and eleven questions.
// Checked across four character pages before writing this, so the shape below
// is theirs and not a guess.
//
// ── WHY IT IS WRITTEN AT CASTING, NOT AFTER THE SEASON ──
//
// Read the questions. "Do you have a strategy for winning the game?" "Would you
// be in a showmance?" "What do you hope to get out of this experience?" Those
// are answered by somebody who has not played yet. Written afterwards — by a
// model that has read the season — the answers start leaking it: the winner
// sounds quietly certain, the first boot sounds doomed, and the tape stops
// being a tape. Nothing in this file may ever read season data.
//
// That also makes it AUTHORED data, alongside voice and backstory: it belongs
// to the person, not to a season, so it lives on the roster row, it is written
// in the Studio, and somebody who has never played can have one.
//
// ── ONE SOURCE OF TRUTH ──
//
// Three places need this list — the Studio's form, the article's box, and the
// generator's prompt. docs/ADDING-A-SHOW.md §13 exists because eight files in
// this project each kept their own copy of the show list; this is the same
// shape of mistake waiting to happen, so the list lives here and those three
// import it.

/**
 * The questions, in the order they are asked and rendered.
 *
 * `key` is what an answer is stored under and MUST NOT CHANGE — it is the only
 * thing tying a written answer to its question once the wording is edited.
 * Adding a question is free; renaming a key orphans every answer already given.
 */
export const INTERVIEW_QUESTIONS = [
  { key: 'adjectives', q: 'Three adjectives that describe you:', short: true },
  { key: 'picked', q: 'Why do you think you got picked for the show?' },
  { key: 'hardest', q: 'What do you think will be the most difficult part of living in the house?' },
  { key: 'strategy', q: 'Do you have a strategy for winning the game?' },
  { key: 'knownHidden', q: 'What is one thing that you want the other contestants to know about you, and one thing that you want to hide? Why?' },
  { key: 'threeThings', q: 'What are three things you would take into the house with you, and why?' },
  { key: 'activities', q: 'What are some of your favorite activities?' },
  { key: 'drama', q: 'What do you think of drama?' },
  { key: 'showmance', q: 'Would you be in a showmance?' },
  { key: 'motto', q: 'Finish this sentence: My life’s motto is…' },
  { key: 'hopeToGet', q: 'What do you hope to get out of this experience?' },
];

const KEYS = new Set(INTERVIEW_QUESTIONS.map(x => x.key));

/**
 * Read a stored interview into `[{ key, q, a }]`, newest wording winning.
 *
 * STORED WITH ITS QUESTION, not as a bare map of answers. A wiki article has to
 * render an interview that was written a year ago; if only the answers were
 * kept, editing a question's wording here would silently re-label every answer
 * already given, and the page would show a new question over an old reply.
 *
 * So the stored question text is what gets rendered, and the canonical list
 * above is only used to fill in the ones that have no answer yet and to fix the
 * order. Accepts the older bare-map shape too, since that is one round of
 * hand-editing away from existing.
 */
export function parseInterview(raw) {
  if (!raw) return [];
  let doc = raw;
  if (typeof raw === 'string') {
    const text = raw.trim();
    if (!text) return [];
    try { doc = JSON.parse(text); } catch { return []; }
  }
  const rows = Array.isArray(doc) ? doc : (Array.isArray(doc?.answers) ? doc.answers : null);
  if (!rows) {
    // Bare map: { strategy: '…', drama: '…' }.
    if (doc && typeof doc === 'object') {
      return INTERVIEW_QUESTIONS
        .filter(x => String(doc[x.key] ?? '').trim())
        .map(x => ({ key: x.key, q: x.q, a: String(doc[x.key]).trim() }));
    }
    return [];
  }
  const seen = new Set();
  const out = [];
  for (const r of rows) {
    const key = String(r?.key || '').trim();
    const a = String(r?.a ?? '').trim();
    if (!key || !a || seen.has(key)) continue;
    seen.add(key);
    // An answer to a question that no longer exists is kept and rendered from
    // its own stored text — deleting somebody's written answer because the
    // question list moved on would be the wrong way round.
    out.push({ key, q: String(r.q || '').trim() || labelFor(key), a });
  }
  // Canonical order first, then anything unrecognised, so a reordering here
  // reorders every existing interview without touching the stored rows.
  const rank = k => {
    const i = INTERVIEW_QUESTIONS.findIndex(x => x.key === k);
    return i === -1 ? INTERVIEW_QUESTIONS.length : i;
  };
  return out.sort((x, y) => rank(x.key) - rank(y.key));
}

/** The canonical wording for a key, or the key itself if it is unknown. */
export function labelFor(key) {
  return INTERVIEW_QUESTIONS.find(x => x.key === key)?.q || String(key);
}

/**
 * `[{key, a}]` or `{key: a}` to the stored string — or '' when nothing was
 * answered, so an untouched interview stores NULL rather than an empty
 * structure that reads as "written, and blank".
 */
export function serializeInterview(input) {
  const map = Array.isArray(input)
    ? Object.fromEntries(input.map(r => [r.key, r.a]))
    : (input || {});
  const rows = INTERVIEW_QUESTIONS
    .map(x => ({ key: x.key, q: x.q, a: String(map[x.key] ?? '').trim() }))
    .filter(r => r.a);
  return rows.length ? JSON.stringify(rows) : '';
}

/** Whether there is anything worth rendering. */
export function hasInterview(raw) {
  return parseInterview(raw).length > 0;
}
