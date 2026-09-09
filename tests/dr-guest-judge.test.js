// ══════════════════════════════════════════════════════════════════════
// dr-guest-judge.test.js — the seat that did not exist
// ══════════════════════════════════════════════════════════════════════
//
// `guest` was `pin.guest || null` and nothing ever pinned one, so no season
// ever played with a guest judge — while guestTaste, ARCH_BIAS, panelFor, the
// exporter and eight lines of prose all sat there waiting for one.
//
// WHY THIS FILE EXISTS SEPARATELY FROM THE VP SWEEP. The sweep builds its cast
// by hand and never loads the alumni database, so `alumniPool` returns [] and
// its seasons have no guests in them — it rendered every screen of every
// episode and could not have caught the crash below. A guard for a feature
// that needs a franchise has to bring the franchise with it.
import { describe, expect, it, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { setAlumniDatabase, setFameContext } from '../js/alumni.js';
import { playDragSeason } from '../js/dr/season.js';
import { guestTaste } from '../js/dr/judges.js';
import { dragScreens } from '../js/vp-dr/screens.js';

// Anchored to this file: a bare relative path opens the MAIN checkout when the
// suite runs from a worktree. See docs/ADDING-A-SHOW.md 11.5 L.
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = rel => JSON.parse(readFileSync(join(ROOT, rel), 'utf8'));

setAlumniDatabase(read('players_database.json'));
/* Fame needs the seasons index and the ranking boards as well as the record.
   Without them `alumniPool` reports `fameStars: null` — "we cannot say" — and
   the guest pool is empty, which is the honest answer for a franchise with no
   history and the wrong one for a guard about guests. */
setFameContext({
  seasons: read('seasons_database.json'),
  rankings: {
    'total-drama': read('rankings_database.json'),
    'big-brother': read('rankings_bb.json'),
  },
});
const rosterDoc = read('franchise_roster.json');
const ROSTER = Array.isArray(rosterDoc) ? rosterDoc : (rosterDoc.players || []);
globalThis.FRANCHISE_ROSTER = ROSTER;

const NAMES = ['Bowie', 'Chris McLean', 'Jo', 'Eureka', 'Alejandro', 'Duncan',
  'Cameron', 'Gwen', 'Heather', 'Owen', 'Noah', 'Izzy', 'Leshawna'];
const cast = NAMES.map(n => ROSTER.find(p => p.name === n)).filter(Boolean)
  .map(p => ({ ...p, drag: undefined }));
const { rows } = playDragSeason({ cast, seed: 3, bond: () => 0, addBond: () => {} });
const withGuest = rows.filter(r => r.dr && r.dr.guest);

beforeEach(() => { window._tvState = {}; window._drSidebar = {}; window._drSeasonRows = rows; });

describe('the guest judge', () => {
  it('actually turns up', () => {
    expect(withGuest.length, 'no guest in a whole season — the seat is empty again')
      .toBeGreaterThan(0);
  });

  it('EVERY SCREEN RENDERS ON A NIGHT SHE IS THERE', () => {
    /* The first season that ever had one took the visual player down:

         Uncaught Error: _judgePortrait: no such judge "guest:zoey"

       `dr.judges` is every id on the panel and a guest's is invented at run
       time from her slug, so she can never be in the JUDGES table the portrait
       helper looks her up in. The throw is right for a permanent seat and
       wrong for her. Rendering is the only way to see it — the season builds
       fine, the data is correct, and the screen is what breaks. */
    let screens = 0;
    for (const row of rows) {
      for (const s of dragScreens(row)) {
        expect(typeof s.html, `ep${row.num} ${s.id}`).toBe('string');
        screens++;
      }
    }
    expect(screens).toBeGreaterThan(50);
  });

  it('is famous, is not in the cast, and is not a queen competing this season', () => {
    const castNames = new Set(cast.map(p => p.name));
    for (const r of withGuest) {
      expect(castNames.has(r.dr.guest.name), `${r.dr.guest.name} is judging her own season`)
        .toBe(false);
      /* Fame, not a ranking tier: a tier grades how WELL she played, which is
         right for a leaderboard and wrong for "would anybody recognise her".
         1.5 is `Cult Following`, the first rating whose name says an audience. */
      expect(Number(r.dr.guest.fameStars),
        `${r.dr.guest.name} is not famous enough to judge`).toBeGreaterThanOrEqual(1.5);
    }
  });

  it('brings the archetype and stats her taste is derived from', () => {
    /* `guestTaste` reads `player.archetype` for ARCH_BIAS and `player.stats`
       for the four taste weights and her warmth. Hand it a bare alumni row and
       every guest is the same neutral seat with no style bias at all — a guest
       judge in name only, which is indistinguishable on screen from working. */
    for (const r of withGuest) {
      expect(r.dr.guest.archetype, `${r.dr.guest.name} has no archetype`).toBeTruthy();
      /* Her STATS are not copied onto the row — the biggest field on a roster
         row, once per episode, for a taste that is already derived. What has
         to be true is that the derivation CAN happen: her archetype is one
         ARCH_BIAS knows, and her roster row has the stats the four taste
         weights come from. A guest missing either is the same neutral seat
         every week, which is indistinguishable on screen from working. */
      const row = ROSTER.find(p => p.name === r.dr.guest.name);
      expect(row && row.stats, `${r.dr.guest.name} has no roster stats`).toBeTruthy();
      const t = guestTaste({ ...row, archetype: r.dr.guest.archetype });
      expect(Object.keys(t.styleBias).length,
        `${r.dr.guest.name} is a ${r.dr.guest.archetype} and gets no style bias at all`)
        .toBeGreaterThan(0);
      expect(new Set(Object.values(t.taste).map(v => Math.round(v * 1000))).size,
        `${r.dr.guest.name}'s four taste weights are identical — her stats never arrived`)
        .toBeGreaterThan(1);
    }
  });

  it('reaches for a face it has not used before', () => {
    /* The bag stops anybody appearing twice in ONE season. This is the other
       half: across seasons, a queen who has judged before is weighted down, so
       the show does not hand the same favour to the same person every year.
       Never zero — a favourite can come back, she just has to win the draw
       against fresher faces. */
    const db = read('players_database.json');
    const veterans = ['duncan', 'alejandro', 'cameron'];
    for (const p of db.players) {
      if (veterans.includes(p.id)) {
        p.judged = Array.from({ length: 5 },
          (_, i) => ({ format: 'drag-race', season: i + 1, episodes: 8 }));
      }
    }
    setAlumniDatabase(db);
    try {
      const seen = {};
      for (let seed = 1; seed <= 30; seed++) {
        const out = playDragSeason({ cast, seed, bond: () => 0, addBond: () => {} });
        for (const row of out.rows) {
          const g = row.dr && row.dr.guest;
          if (g) seen[g.slug] = (seen[g.slug] || 0) + 1;
        }
      }
      const total = Object.values(seen).reduce((a, b) => a + b, 0);
      const vetShare = veterans.reduce((t, v) => t + (seen[v] || 0), 0) / total;
      const fresh = Object.entries(seen)
        .filter(([id]) => !veterans.includes(id))
        .sort((a, b) => b[1] - a[1])[0];
      expect(total, 'no guests were booked at all').toBeGreaterThan(20);
      expect(vetShare, 'a queen who has judged five times is booked as often as a new face')
        .toBeLessThan((fresh[1] / total) * 3);
    } finally {
      setAlumniDatabase(read('players_database.json'));   // leave the pool as we found it
    }
  });

  it('is introduced with a credit the ledger can prove', () => {
    /* The credit is the ONE claim the host may make about her past, so it has
       to name the season the placement actually happened in. The first version
       paired `winner` (best placement ever) with the LAST appearance and put
       two different alumni on screen as the winner of Total Drama 13. */
    const db = read('players_database.json');
    const players = Array.isArray(db) ? db : db.players;
    for (const r of withGuest) {
      const credit = r.dr.guest.credit;
      if (!credit) continue;
      const m = credit.match(/the winner of (.+)$/);
      if (!m) continue;
      const season = Number(m[1].match(/(\d+)\s*$/)?.[1]);
      const p = players.find(x => x.name === r.dr.guest.name);
      const won = (p?.seasonDetails || [])
        .some(d => Number(d.placement) === 1 && Number(d.season) === season);
      expect(won, `${r.dr.guest.name} is introduced as "${credit}" and did not win it`)
        .toBe(true);
    }
  });
});
