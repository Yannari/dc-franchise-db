// ══════════════════════════════════════════════════════════════════════
// tools/dr-domination.mjs — how set in stone is a drag season?
// ══════════════════════════════════════════════════════════════════════
//
// One number, measured two ways, because the show has two populations and
// they fail differently:
//
//   AUTHORED  queens with real craft. The documented-hot case — the top queen
//             takes ~50% of maxi wins against the real show's ~30%.
//   FLAT      queens nobody authored, so dragOf() defaults all seven craft
//             stats to 5. Craft then contributes EXACTLY ZERO to every score
//             and the panel decides on the tie-breakers alone.
//
// The flat case is not hypothetical: franchise_roster.json has never held a
// craft block for anybody, so every season played from the roster is this one.
//
// WHY THE STAT-ABLATION COLUMNS. A share on its own says a season is
// concentrated; it does not say what concentrated it. Re-running with one stat
// flattened across the cast says how much of the concentration that stat was
// carrying — which is the only way to tell a term that is doing its job from a
// term that is doing everybody else's.
//
//   node tools/dr-domination.mjs            both populations, 120 seasons
//   node tools/dr-domination.mjs 300        more seasons, tighter numbers
//
// Even split across 13 queens is 7.7%. Chance is the floor, not the target:
// the real show sits near 30% because good queens really do win more.
const _s = new Map();
globalThis.localStorage = {
  getItem: k => (_s.has(k) ? _s.get(k) : null),
  setItem: (k, v) => _s.set(k, String(v)),
  removeItem: k => _s.delete(k),
  clear: () => _s.clear(),
};

const fs = await import('fs');
const { playDragSeason } = await import('../js/dr/season.js');
const { rngFor } = await import('../js/dr/rng.js');

const N = Number(process.argv[2]) || 120;

const NAMES = ['Bowie', 'Chris McLean', 'Jo', 'Eureka', 'Alejandro', 'Duncan',
  'Cameron', 'Gwen', 'Heather', 'Owen', 'Noah', 'Izzy', 'Leshawna'];
const DRAG_KEYS = ['acting', 'comedy', 'dance', 'design', 'runway', 'lipsync', 'singing'];

const roster = JSON.parse(fs.readFileSync('franchise_roster.json', 'utf8'));
const all = (Array.isArray(roster) ? roster : (roster.players || roster.roster || []))
  .filter(p => p.stats && p.archetype);

// FLAT: craft deliberately absent, which is what the roster actually holds.
const flat = NAMES.map(n => all.find(x => x.name === n)).filter(Boolean)
  .map(p => ({ ...p, drag: undefined }));

// AUTHORED: the same queens given craft, from a seed unrelated to the season
// rng so the two populations differ in craft alone.
//
// LEVEL PLUS DEVIATION, NOT UNIFORM 1-10. An author does not roll seven
// independent numbers: she decides roughly how strong a queen is and then
// gives her strengths and weaknesses around that. Uniform rolls produce a
// queen who is 9 at everything, which is not a cast, and measuring against
// one overstates how concentrated the format really is.
const cr = rngFor(20260908);
const spread = (r, amt) => (r() + r() + r() - 1.5) * amt;   // ~normal, mean 0
const authored = flat.map(p => {
  const level = 5.5 + spread(cr, 1.1);
  return {
    ...p,
    drag: Object.fromEntries(DRAG_KEYS.map(k =>
      [k, Math.max(1, Math.min(10, Math.round(level + spread(cr, 1.9))))])),
  };
});

/** Maxi wins per queen over N seasons. */
function wins(cast) {
  const w = {};
  for (const c of cast) w[c.name] = 0;
  for (let s = 1; s <= N; s++) {
    const out = playDragSeason({ cast, seed: s, bond: () => 0, addBond: () => {} });
    for (const row of out.rows) {
      const n = row.dr?.call?.win?.[0];
      if (n && w[n] !== undefined) w[n]++;
    }
  }
  return Object.entries(w).sort((a, b) => b[1] - a[1]);
}

const share = rows => {
  const tot = rows.reduce((t, r) => t + r[1], 0) || 1;
  return {
    top: 100 * rows[0][1] / tot,
    top3: 100 * (rows[0][1] + rows[1][1] + rows[2][1]) / tot,
    zeros: rows.filter(r => r[1] === 0).length,
    lead: rows[0][0],
  };
};

const say = (...a) => console.log(...a); // eslint-disable-line no-console
const line = (label, s) => say(
  label.padEnd(30),
  ('top ' + s.top.toFixed(1) + '%').padEnd(12),
  ('top3 ' + s.top3.toFixed(1) + '%').padEnd(13),
  ('never won ' + s.zeros + '/13').padEnd(16),
  s.lead);

const flatten = (cast, keys) => cast.map(p => ({
  ...p, stats: { ...p.stats, ...Object.fromEntries(keys.map(k => [k, 5])) },
}));

say(`${N} seasons per row. 13 queens, so an even split is 7.7%.`);
say('The real show sits near 30% — chance is the floor, not the goal.\n');

for (const [label, cast] of [['AUTHORED CRAFT', authored], ['FLAT CRAFT', flat]]) {
  say(`── ${label} ──`);
  line('as-is', share(wins(cast)));
  line('  boldness flattened', share(wins(flatten(cast, ['boldness']))));
  line('  mental flattened', share(wins(flatten(cast, ['mental']))));
  line('  both flattened', share(wins(flatten(cast, ['boldness', 'mental']))));
  line('  all shared stats flattened', share(wins(flatten(cast,
    Object.keys(flat[0].stats)))));
  say('');
}
