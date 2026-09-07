// ══════════════════════════════════════════════════════════════════════
// tools/dr-publish-season.mjs — play a season and write it to the repo
// ══════════════════════════════════════════════════════════════════════
//
// The headless half of the manual's step 6. It plays a season from REAL
// roster players, builds the season document, runs both database merges and
// writes all three files exactly where a publish would put them:
//
//   data/seasons/dr-<n>-data.json
//   seasons_database.json
//   players_database.json
//
// The point is not the files. It is that every page on the site then has a
// real drag season to draw, so the page-by-page read has something to read —
// and this project's entire defect history says that read is where the bugs
// are, not in the assertions.
//
//   node tools/dr-publish-season.mjs [seed] [castSize]
//
// NOTE THE jsdom BOOT. js/stats-export.js reaches js/core.js and the whole
// Total Drama challenge tree, and those modules read `localStorage` and assign
// reveal handlers onto `window` and `document` at module scope. Hand-stubbing
// them is a losing game — the first three stubs bought three more errors — so
// this boots the same jsdom the test suite runs under. It is not a workaround
// for a bug: these are browser modules and this is the browser API they
// legitimately expect.
const { JSDOM } = await import('jsdom');
const dom = new JSDOM('<!doctype html><html><body></body></html>', {
  url: 'http://localhost/',
});
for (const k of ['window', 'document', 'localStorage', 'navigator', 'HTMLElement',
  'Node', 'Element', 'CustomEvent', 'getComputedStyle']) {
  if (!globalThis[k]) globalThis[k] = dom.window[k];
}

const { readFileSync, writeFileSync } = await import('node:fs');
const { playDragSeason } = await import('../js/dr/season.js');
const { buildDragSeasonDocument, seasonFilePath } = await import('../js/dr/export.js');
const { mergeDragSeason, mergeDragSeasonsDatabase } = await import('../js/stats-export.js');
const { rngFor } = await import('../js/dr/rng.js');

const SEED = Number(process.argv[2]) || 7;
const CAST_SIZE = Number(process.argv[3]) || 13;
const SEASON_NUM = 1;

const roster = JSON.parse(readFileSync('franchise_roster.json', 'utf8'));
const players = Array.isArray(roster) ? roster : (roster.players || []);

// Thirteen real people, drawn with the season's own seed so the cast is
// reproducible. Craft comes off the roster where it exists — see
// tools/dr-flat-roster.mjs for what happens when it does not.
const rng = rngFor(SEED * 7919 + 13);
const pool = [...players];
const cast = [];
while (cast.length < CAST_SIZE && pool.length) {
  cast.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]);
}

// A real bond layer. playDragSeason falls back to `bond: () => 0` with an
// addBond that remembers nothing, and a season played on that default has no
// relationships at all — every event gated on a bond silently cannot fire.
const bonds = {};
const key = (a, b) => [a, b].sort().join('|');
const { rows } = playDragSeason({
  cast,
  seed: SEED,
  bond: (a, b) => bonds[key(a, b)] || 0,
  addBond: (a, b, d) => {
    const k = key(a, b);
    bonds[k] = Math.max(-10, Math.min(10, (bonds[k] || 0) + d));
  },
});

const doc = buildDragSeasonDocument(rows, { seasonNumber: SEASON_NUM, twists: [] });

const readJSON = (path, fallback) => {
  try { return JSON.parse(readFileSync(path, 'utf8')); } catch { return fallback; }
};
const playersDb = mergeDragSeason(
  readJSON('players_database.json', { franchise: {}, players: [] }), doc);
const seasonsDb = mergeDragSeasonsDatabase(
  readJSON('seasons_database.json', { franchise: {}, seasons: [] }), doc);
seasonsDb.franchise = seasonsDb.franchise || {};
seasonsDb.franchise.totalPlayers = playersDb.players.length;

const write = (path, data) =>
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`, 'utf8');

write(seasonFilePath(SEASON_NUM), doc);
write('players_database.json', playersDb);
write('seasons_database.json', seasonsDb);

console.log(`wrote ${seasonFilePath(SEASON_NUM)}`);
console.log(`  ${doc.castSize} queens, ${doc.episodeCount} episodes, winner ${doc.winner.name}`);
console.log(`  cast: ${doc.placements.map(p => p.name).join(', ')}`);
console.log(`players_database.json: ${playersDb.players.length} players`);
console.log(`seasons_database.json: ${seasonsDb.seasons.length} seasons `
  + `(${seasonsDb.seasons.filter(s => s.format === 'drag-race').length} drag)`);
