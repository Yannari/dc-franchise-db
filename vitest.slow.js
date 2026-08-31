// The tests that play whole seasons, listed once.
//
// ── WHY THIS FILE EXISTS ──
//
// On 2026-08-18 nothing deployed for an hour and a half. The cause was not the
// site, the build or the repository: `npm test` needs about TWO HOURS on a CI
// runner, it runs on every push, and one Studio save is three pushes. With no
// timeout on the workflow, the runs piled up holding runners for GitHub's
// six-hour default until every Pages build was queued behind them.
//
// Measured from the CI log of run 32106627205, which was cancelled after 101
// minutes with 218 of 325 files finished:
//
//     42 files over 60s   ->  103 min
//     the other 176       ->   16 min
//     141 files under 10s ->  1.7 min
//
// So a handful of files are the entire cost. They are slow because they PLAY
// SEASONS — the vitest config already explains why that is deliberate: it is
// the only thing that catches events which are written, registered and still
// unreachable, a bug class this project has hit repeatedly.
//
// They are not deleted and they are not trimmed. They move to their own command
// and a nightly run, exactly as the *-audit.test.js files already did for the
// same reason: they are worth running, and not worth running three times per
// character you create.
//
// ── KEEPING THIS LIST HONEST ──
//
// It is a snapshot of one measurement, so it rots. Two ways it goes wrong: a
// new season-playing test lands and slows the fast suite, or one of these gets
// cheaper and stays exiled. Re-derive it from a nightly log rather than
// guessing — the times print with `--reporter=verbose`:
//
//   gh run view <run-id> --log > ci.log
//   # then, per file:  tests/<name>.test.js (<n> tests) <ms>ms
//
// The fast workflow's timeout is the backstop: if something slow slips in, CI
// goes red at 30 minutes and names the file, rather than silently costing
// everybody twenty minutes a push.

/**
 * Files excluded from `npm test` and run by `npm run test:sim`.
 *
 * Times are from the run cited above, on a two-core CI runner. A developer
 * machine is roughly twice as fast.
 */
export const SLOW_TESTS = [
  // Re-measured from PR run 33417681177 after the first split. These files
  // timed out or dominated a shard because they simulate repeated weeks or
  // whole seasons; they belong beside the same sweeps below.
  'bb-americas-nominee-style.test.js',
  'bb-diamond-veto.test.js',
  'bb-safety-suite.test.js',
  'bb-showmance-rate.test.js',
  'events-big-brother-volume.test.js',
  'bb-love-triangle.test.js',
  'bb-plain-text.test.js',
  'bb-power-expiry.test.js',
  'bb-temptation.test.js',
  'bb-veto-protection.test.js',
  'competition-big-brother-library.test.js',
  'bb-act-coverage.test.js',
  'bb-care-package.test.js',
  'bb-coin-of-destiny.test.js',            // 87s local, 2026-08-31
  'bb-hacker.test.js',
  'bb-roadkill.test.js',
  'tr-calibration.test.js',
  'bb-power-shelf.test.js',               // 1014s (CI 2026-08-31)
  'bb-nomination-alliance.test.js',        // 493s  (CI 2026-08-31)
  'bb-saboteur.test.js',                   // 491s  (CI 2026-08-31)
  'coach-camp-presence.test.js',           // 344s  (CI 2026-08-31)
  'tr-powers.test.js',                     // 261s  (CI 2026-08-31)
  'bb-chain-of-safety.test.js',            // 225s  (CI 2026-08-31)
  'bb-high-rollers-room.test.js',          // 205s  (CI 2026-08-31)
  'tr-castle-reachability.test.js',        // 186s  (CI 2026-08-31)
  'bb-jury-house.test.js',                 // 185s  (CI 2026-08-31)
  'bb-twin-twist.test.js',                 // 176s  (CI 2026-08-31)
  'vp-big-brother-week.test.js',           //  79s  (CI 2026-08-31)
  'tr-channel-gate.test.js',               //  71s  (CI 2026-08-31)
  'bb-theme-high-rollers.test.js',         //  62s  (CI 2026-08-31)
  'tr-murder.test.js',                     //  62s  (CI 2026-08-31)
  'bb-knowledge.test.js',                  // 534s
  'bb-duos.test.js',                       // 502s
  'bb-broken-promise.test.js',             // 390s
  'bb-season-export.test.js',              // 278s
  'bb-team-america.test.js',               // 247s
  'bb-jury-bubble.test.js',                // 212s
  'bb-pandora-events.test.js',             // 205s
  'bb-no-self-scenes.test.js',             // 198s
  'bb-pandoras-box.test.js',               // 192s
  'bb-camp-comeback.test.js',              // 155s
  'house-bond-pace.test.js',               // 155s
  'bb-temptation-events.test.js',          // 153s
  'bb-veto-safety.test.js',                // 151s
  'bb-sanctum-week.test.js',               // 146s
  'bb-drinks-night.test.js',               // 142s
  'bb-theme-temptation.test.js',           // 138s
  'bb-battle-of-the-block.test.js',        // 136s
  'bb-live-comp-counts.test.js',           // 128s
  'bb-two-cycle-week.test.js',             // 125s
  'big-brother-finale.test.js',            // 120s
  'bb-theme-machine.test.js',              // 120s
  'bb-double-eviction-variants.test.js',   // 117s
  'social-finale.test.js',                 // 117s
  'bb-instant-eviction.test.js',           // 115s
  'bb-white-locust.test.js',               // 111s
  'bb-time-capsule.test.js',               // 110s
  'bb-reign.test.js',                      // 102s
  'house-eviction-night.test.js',          //  95s
  'house-alliance-depth.test.js',          //  88s
  'house-panels.test.js',                  //  81s
  'bb-americas-nominee.test.js',           //  80s
  'house-visibility.test.js',              //  76s
  'three-nominee-modes.test.js',           //  74s
  'bb-house-friction.test.js',             //  74s
  'bb-premiere-mystery.test.js',           //  74s
  'bb-veto-variants.test.js',              //  70s
  'bb-accusations.test.js',                //  66s
  'bb-halting-hex.test.js',                //  65s
  'bb-veto-derby.test.js',                 //  64s
  'bb-theme-primers.test.js',              //  63s
  'house-mechanics.test.js',               //  63s
  'bb-fallout.test.js',                    //  61s
];

/** Glob form, for a config's include/exclude. */
export const SLOW_GLOBS = SLOW_TESTS.map(f => `tests/${f}`);
