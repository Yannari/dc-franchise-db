// ══════════════════════════════════════════════════════════════════════
// legacy-canon.js — the published seasons are what Legacy says happened
// ══════════════════════════════════════════════════════════════════════
//
// The user, 2026-10-13: "miriam won s11 not sterling, quin won drag race 1 not
// paige". Both seasons were published, then replayed, and each replay's finale
// recorded over the published result. Now every page load reads the published
// list (seasons_database.json) and each season's own document, tells the ledger
// which seasons are published (so a replay is refused -- franchise-meta.js
// _refuseRecord), and puts back any record that does not match its document.
// A record that does match is never touched, so a chronicle-enriched season
// keeps everything it knows beyond placements.

import { SHOWS, DEFAULT_FORMAT, seasonId } from './shows.js';
import { setPublishedSeasons, applyPublishedSeason, dropMislabeledRecords, foldShowFranchises } from './franchise-meta.js';
import { persistFranchiseLedger } from './savestate.js';

/** The season document's path, by the site's one naming rule (wiki-fill-run.js seasonFile). */
function _seasonDoc(format, num) {
  return format === DEFAULT_FORMAT ? `data/seasons/season${num}-data.json` : `data/seasons/${seasonId(format, num)}-data.json`;
}

const _json = url => fetch(url, { cache: 'no-cache' }).then(r => (r.ok ? r.json() : null)).catch(() => null);

/**
 * Returns how many ledger records it changed. Never throws: Legacy without the
 * published list is the ledger as it was, which is what it always showed.
 */
export async function syncPublishedSeasons() {
  // One franchise per show was how shows were kept apart before the tabs.
  const folded = foldShowFranchises();
  if (folded) await persistFranchiseLedger();
  const idx = await _json('seasons_database.json');
  const list = (idx?.seasons || [])
    .filter(s => s && Number(s.seasonNumber) && (!s.status || /complete/i.test(s.status)))
    .map(s => ({ format: SHOWS[s.format] ? s.format : DEFAULT_FORMAT, num: Number(s.seasonNumber) }));
  if (!list.length) return 0;
  setPublishedSeasons(list);
  const docs = await Promise.all(list.map(s => _json(_seasonDoc(s.format, s.num))));
  let changed = 0;
  list.forEach((s, i) => { if (docs[i] && applyPublishedSeason(docs[i], s.format, s.num)) changed++; });
  changed += dropMislabeledRecords();
  if (changed) await persistFranchiseLedger();
  return changed;
}
