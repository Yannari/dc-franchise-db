// ══════════════════════════════════════════════════════════════════════
// script/pick.js — which written exchange a decided scene gets (shared)
// ══════════════════════════════════════════════════════════════════════
//
// Lifted out of js/ci/script.js (The Circle) so a second show gets the
// picker's hard-won repetition rules rather than a copy without them
// (ADDING-A-SHOW §11.5 Q). Show-blind: the caller hands over its own usage
// LEDGER (a plain object it keeps on its season, so it survives a save), its
// POOLS, and its CLOCK — whatever "the same day" means in that show (The
// Circle: the day; Big Brother: the act of the week).
//
// An entry is { id, when?, turns: [{ by, say | send | react | video | dr | beat }] }.
// `when` filters on facts; the caller validates its keys against its own
// whitelist.

// A line already used today (by anyone) is off the table while anything else
// fits: two players posting the same status on the same morning reads as a
// copy, not a coincidence. (At 0.1 it still lost to entries worn down by
// earlier days — seed 19, day 7 aired one status twice.)
export const SAME_DAY = 0;
export const SAID_AGAIN = 0.05;
// Each earlier use of a line this season: its weight times this. Steep, so a
// fresh line wins until the pool is used up; at 0.5 a register line (five
// times the weight) used once still beat a fresh plain one, and came back
// (measured: 19% of a season's blocks were repeats).
export const USED_DECAY = 0.12;
// A line among its pool's last picks (half the pool) is held back while
// anything else fits. The decay alone forgets order: in a six-line pool
// where every line has aired once they are all equal again, and two visits
// on back-to-back nights played the same exchange word for word (user,
// 2026-10-01; 7 adjacent pairs in 60 seasons shared four lines or more). By
// days it was not enough: visits are days apart.
export const RECENT = 0.01;

export function matches(when = {}, facts) {
  return Object.entries(when).every(([k, v]) => (Array.isArray(v) ? v.includes(facts[k]) : facts[k] === v));
}

/** A fresh ledger. Plain data: it serialises with the season. */
export const newLedger = () => ({ uses: {}, pairs: {}, day: {} });

const poolKey = key => (Array.isArray(key) ? key.join('+') : key);
// The same sentence written into two pools ("Please don't be me. Please don't
// be me." is in three): the same-day rule goes by the words too, not only by
// the entry, so a day never hears it twice.
// Line by line: two exchanges can share one line ("Thank-you note: you're the best").
export const wordsOf = e => (e.turns || []).flatMap(t => [t.say, t.react, t.send, t.video, t.dr]).filter(x => x && x.length > 12);

/**
 * Pick an entry from `pools[key]` (or the merge of several keys) whose `when`
 * fits `facts`, by the repetition rules above, and note its use.
 */
export function pickEntry(ledger, pools, key, facts, pairKey, rng, speaker = null, clock = 0) {
  // A list of keys merges pools: a game's own lines (weighted up) with its
  // family's, so a game never runs out and repeats itself.
  const pool = Array.isArray(key) ? key.flatMap(k => pools[k] || []) : pools[key];
  if (!pool?.length) return null;
  const u = ledger;
  const fits = pool.filter(e => matches(e.when, facts));
  const recent = (u.recent ||= {})[poolKey(key)] || [];
  const speakers = [].concat(speaker || []);
  const scored = fits.map(e => {
    // A line written for the speaker's register is how they sound: it wins clearly.
    const spec = Object.keys(e.when || {}).reduce((n, k) => n + (k === 'register' ? 4 : 1), 0) + (e.id.startsWith('g.') ? 1 : 0);
    const uses = u.uses[e.id] || 0;
    const samePair = (u.pairs[e.id] || []).includes(pairKey);
    const today = (u.day || {})[e.id] === clock || wordsOf(e).some(w => (u.words || {})[w] === clock) ? SAME_DAY
      : recent.includes(e.id) ? RECENT : 1;
    // One person saying the same sentence twice in a season reads as a bug,
    // whoever they say it to (a register's lines win often, so this matters).
    // Both sides of an exchange: the reply ("Absolutely not.") repeats as surely as the line.
    const said = speakers.some(sp => (u.by?.[e.id] || []).includes(sp)) ? SAID_AGAIN : 1;
    return [e, samePair ? 0 : (1 + spec) * Math.pow(USED_DECAY, uses) * today * said];
  });
  // Held back means held back: a worn pool's decay is as steep as RECENT, so
  // while a fresh-enough line has any weight, the recent ones get none.
  if (scored.some(([e, w]) => w > 0 && !recent.includes(e.id))) for (const x of scored) if (recent.includes(x[0].id)) x[1] = 0;
  // ...and a line one of these speakers has already said is out while anything they have not said fits
  // (SAID_AGAIN alone lost to a small pool: a resident said the same notes scene twice on Rescue Island)
  const saidBy = e => speakers.some(sp => (u.by?.[e.id] || []).includes(sp));
  if (scored.some(([e, w]) => w > 0 && !saidBy(e))) for (const x of scored) if (saidBy(x[0])) x[1] = 0;
  let total = scored.reduce((s, [, w]) => s + w, 0);
  // Everything that fits has been used on this pair: take the least-used fit.
  if (!total) {
    // ...not heard today first (by its words too), then the least used.
    const heardToday = x => ((u.day || {})[x.id] === clock || wordsOf(x).some(w => (u.words || {})[w] === clock)) ? 1 : 0;
    const said = x => (speakers.some(sp => (u.by?.[x.id] || []).includes(sp)) ? 1 : 0);
    const e = fits.sort((x, y) => said(x) - said(y) || heardToday(x) - heardToday(y) || (u.uses[x.id] || 0) - (u.uses[y.id] || 0))[0] || pool.find(p => !p.when);
    return note(u, e, pairKey, speaker, key, pool.length, clock);
  }
  let r = rng() * total;
  for (const [e, w] of scored) { if ((r -= w) <= 0) return note(u, e, pairKey, speaker, key, pool.length, clock); }
  return note(u, scored.at(-1)[0], pairKey, speaker, key, pool.length, clock);
}

function note(u, e, pairKey, speaker, key = null, size = 0, clock = 0) {
  if (!e) return null;
  if (key != null) {
    const r = ((u.recent ||= {})[poolKey(key)] ||= []);
    r.push(e.id);
    r.splice(0, Math.max(0, r.length - Math.max(1, size >> 1)));
  }
  for (const sp of [].concat(speaker || [])) ((u.by ||= {})[e.id] ||= []).push(sp);
  u.uses[e.id] = (u.uses[e.id] || 0) + 1;
  (u.day ||= {})[e.id] = clock;
  for (const w of wordsOf(e)) (u.words ||= {})[w] = clock;
  (u.pairs[e.id] ||= []).push(pairKey);
  return e;
}
