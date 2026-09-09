// ══════════════════════════════════════════════════════════════════════
// tools/dr-lipsync-power.mjs — what actually decides a lip sync
// ══════════════════════════════════════════════════════════════════════
//
// Written to answer one question off a played season: a queen won five lip
// syncs in a row, so is the lip sync too powerful and the track record inert?
// The answer turned out to be neither, and the numbers are the only way to
// see that — both mechanisms are invisible in the transcript, which says
// "shantay, you stay" whichever one decided it.
//
// THREE THINGS ARE MEASURED, because three separate things move a lip sync:
//
//   confidence      js/dr/lipsync.js — +0.4 per past lip sync win, capped at
//                   +1.2. A snowball: winning makes you better at winning.
//                   Ablate it by zeroing the term and re-running.
//   trackProtection js/dr/week.js — (PPE - 3.0) * 6.0 added to her score,
//                   where PPE weights her record WIN 5 / HIGH 4 / SAFE 3 /
//                   LOW 2 / BTM 1. Uncapped.
//   the contract    js/dr/lipsync.js says of the bend: "It can decide a close
//                   one and cannot rescue a blowout." That is a testable
//                   claim and this counts how often it is false.
//
// Run against a FLAT-CRAFT cast on purpose — that is what the roster holds,
// and with craft flat every queen's lip sync `core` is identical, so whatever
// separates them is one of the terms above rather than talent.
//
//   node tools/dr-lipsync-power.mjs [seasons]
const _s = new Map();
globalThis.localStorage = {
  getItem: k => (_s.has(k) ? _s.get(k) : null),
  setItem: (k, v) => _s.set(k, String(v)),
  removeItem: k => _s.delete(k),
  clear: () => _s.clear(),
};

const fs = await import('fs');
const { playDragSeason } = await import('../js/dr/season.js');

const N = Number(process.argv[2]) || 300;
const NAMES = ['Bowie', 'Chris McLean', 'Jo', 'Eureka', 'Alejandro', 'Duncan',
  'Cameron', 'Gwen', 'Heather', 'Owen', 'Noah', 'Izzy', 'Leshawna'];

const roster = JSON.parse(fs.readFileSync('franchise_roster.json', 'utf8'));
const all = (Array.isArray(roster) ? roster : (roster.players || roster.roster || []))
  .filter(p => p.stats && p.archetype);
const cast = NAMES.map(n => all.find(x => x.name === n)).filter(Boolean)
  .map(p => ({ ...p, drag: undefined }));

// The same weights js/dr/week.js uses, so this measures the shipped rule.
const PPE = { WIN: 5, HIGH: 4, SAFE: 3, LOW: 2, BTM: 1, BTM2: 1 };
const protectionOf = rec => {
  if (!rec.length) return 0;
  const ppe = rec.reduce((s, r) => s + (PPE[r] ?? 0), 0) / rec.length;
  return Math.max(0, (ppe - 3.0) * 6.0);
};

let duels = 0, bothZero = 0, sumMax = 0, flips = 0, near = 0, blowouts = 0;
let higherWon = 0, differed = 0;
const hist = {};
const streakBySeason = {};

for (let s = 1; s <= N; s++) {
  const out = playDragSeason({ cast, seed: s, bond: () => 0, addBond: () => {} });
  const rec = {};
  const runs = {};
  let bestStreak = 0;

  for (const row of out.rows) {
    const ls = row.dr?.lipsync;
    if (ls && ls.queens && ls.winner) {
      for (const q of ls.queens) {
        if (q === ls.winner) { runs[q] = (runs[q] || 0) + 1; bestStreak = Math.max(bestStreak, runs[q]); }
        else runs[q] = 0;
      }
    }
    if (ls && ls.queens && ls.queens.length === 2 && ls.winner) {
      const [a, b] = ls.queens;
      const pa = protectionOf(rec[a] || []);
      const pb = protectionOf(rec[b] || []);
      duels++;
      if (pa === 0 && pb === 0) bothZero++;
      const mx = Math.max(pa, pb);
      sumMax += mx;
      const bucket = Math.min(6, Math.floor(mx));
      hist[bucket] = (hist[bucket] || 0) + 1;
      if (pa !== pb) { differed++; if ((pa > pb ? a : b) === ls.winner) higherWon++; }
      // Did the bend overturn the better performance, and by how much?
      const raw = (ls.scores?.[a] ?? 0) - (ls.scores?.[b] ?? 0);
      if ((raw >= 0 ? a : b) !== ls.winner) {
        flips++;
        const g = Math.abs(raw);
        if (g >= 2) near++;
        if (g >= 3) blowouts++;
      }
    }
    // Records update after the night, so a queen's protection is what she
    // walked ON stage with rather than what the night gave her.
    for (const [q, arr] of Object.entries(row.dr?.record || {})) rec[q] = arr.slice();
  }
  streakBySeason[bestStreak] = (streakBySeason[bestStreak] || 0) + 1;
}

const say = (...a) => console.log(...a); // eslint-disable-line no-console
const pc = x => (100 * x / duels).toFixed(1) + '%';

say(`${N} seasons, ${duels} head-to-head lip syncs, craft flat at 5.\n`);

say('── THE TRACK RECORD ──');
say('  both queens get NOTHING:      ' + bothZero + '  (' + pc(bothZero) + ')');
say('  mean of the larger bend:      ' + (sumMax / duels).toFixed(2)
  + '   (the noise on a score is +/-2.5)');
say('  when the two differ, the higher-PPE queen survives: '
  + (100 * higherWon / (differed || 1)).toFixed(1) + '%  (' + differed + ' cases)');
say('  larger-bend distribution:');
for (const k of Object.keys(hist).sort((a, b) => a - b)) {
  say('    ' + k + '-' + (+k + 1) + ':'.padEnd(2) + String(hist[k]).padStart(6) + '  ' + pc(hist[k]));
}

say('\n── THE DOCUMENTED CONTRACT ──');
say('  "It can decide a close one and cannot rescue a blowout." Measured:');
say('  the bend reversed the better performance: ' + flips + ' (' + pc(flips) + ')');
say('    the loser was ahead by 2+ raw points:   ' + near + ' (' + pc(near) + ')');
say('    ...by 3+, which is a blowout:           ' + blowouts + ' (' + pc(blowouts) + ')');

say('\n── STREAKS ──  (longest run of lip sync wins by any one queen)');
for (const k of Object.keys(streakBySeason).sort((a, b) => a - b)) {
  say('  ' + k + ' in a row: ' + String(streakBySeason[k]).padStart(4)
    + ' seasons (' + (100 * streakBySeason[k] / N).toFixed(1) + '%)');
}
