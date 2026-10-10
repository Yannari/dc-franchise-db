// ══════════════════════════════════════════════════════════════════════
// td/aftermath/hosts.js — who hosts this season's Aftermath
// ══════════════════════════════════════════════════════════════════════
// The show's Aftermath is never hosted by the main host: Geoff and Bridgette ran it, two famous
// players already out of the game. Here (the user, 2026-10-10): "pick 2 random famous alumni of
// total drama that are not in the season, try a girl and a boy or nb" — famous by the franchise's
// own fame system (js/fame.js through alumni.js, the stars the Drag Race guest judges are drawn by),
// never anyone in this cast. Drawn once a season and kept, so the same two host every Aftermath.
import { alumniPool } from '../../alumni.js';
import { DEFAULT_ROSTER } from '../../roster-data.js';

// fame stars a host needs: a "Household Name" first, a "Cult Following" when that runs out
const FAMOUS = [2.5, 1.5];
// the faces everyone knows, for a franchise with no fame record loaded (a headless run, a test):
// the first season's cast and the stars who came after it, never a nobody
const ICONS = ['Gwen', 'Owen', 'Heather', 'Duncan', 'Courtney', 'Izzy', 'Leshawna', 'Lindsay', 'Geoff', 'Bridgette', 'Cody', 'Noah', 'Trent', 'DJ', 'Harold',
  'Alejandro', 'Sierra', 'Beth', 'Eva', 'Katie', 'Sadie', 'Tyler', 'Justin', 'Ezekiel', 'Zoey', 'Mike', 'Scott', 'Jo', 'Lightning', 'Cameron', 'Dawn', 'Brick', 'Sky', 'Jasmine', 'Max', 'Scarlett'];

const rosterRow = name => ((typeof globalThis !== 'undefined' && Array.isArray(globalThis.FRANCHISE_ROSTER) && globalThis.FRANCHISE_ROSTER.find(r => r?.name === name)) || DEFAULT_ROSTER.find(r => r.name === name) || null);
const genderOf = name => rosterRow(name)?.gender || null;

// a stable draw for the season: the same season always gets the same two
function seeded(str) {
  let h = 2166136261;
  for (const c of String(str)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); }
  return () => { h = Math.imul(h ^ (h >>> 15), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); h ^= h >>> 16; return (h >>> 0) / 4294967296; };
}
function draw(pool, r) {
  // the more famous, the likelier, but every famous face has a chance
  const tot = pool.reduce((n, p) => n + p.w, 0);
  let x = r() * tot;
  for (const p of pool) { x -= p.w; if (x <= 0) return p; }
  return pool[pool.length - 1] || null;
}

/**
 * The two hosts: [{ name, gender, credit: { season, winner, finalist } | null }], the girl first.
 * cast: every name in this season (never a host). seed: the season's name.
 */
export function pickAftermathHosts(cast = [], seed = 'season') {
  const barred = new Set(cast);
  const r = seeded(`aftermath-hosts|${seed}`);
  let pool = [];
  try {
    const all = alumniPool({ exclude: [...barred] }).filter(a => a && !rosterRow(a.name)?.host);
    for (const min of FAMOUS) {
      pool = all.filter(a => Number(a.fameStars) >= min).map(a => ({ name: a.name, w: 1 + Number(a.fameStars), credit: a.bestSeasonName ? { season: a.bestSeasonName, winner: !!a.winner, finalist: !!a.finalist } : null }));
      if (pool.filter(p => genderOf(p.name) === 'f').length && pool.filter(p => genderOf(p.name) && genderOf(p.name) !== 'f').length) break;
    }
  } catch { pool = []; }
  if (!pool.length) pool = ICONS.filter(n => !barred.has(n) && rosterRow(n)).map((n, i) => ({ name: n, w: 3 - i / ICONS.length, credit: null }));
  const girls = pool.filter(p => genderOf(p.name) === 'f');
  const rest = pool.filter(p => genderOf(p.name) && genderOf(p.name) !== 'f');
  const a = draw(girls.length ? girls : pool, r);
  const b = draw((rest.length ? rest : pool).filter(p => p.name !== a?.name), r);
  return [a, b].filter(Boolean).map(p => ({ name: p.name, gender: genderOf(p.name), credit: p.credit }));
}
