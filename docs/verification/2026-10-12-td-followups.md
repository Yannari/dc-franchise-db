# TD grounded follow-ups — verification

Date: 2026-10-12.

Final focused verification passed: **22 files, 180 tests** (all `tests/td-*.test.js` plus `tests/imports-are-committed.test.js`, Vitest with four workers). This includes all 16 new dialogue variants across five venues, both follow-up families appearing in three real-cast seasons, exact source-speech checks, same-camp witness eligibility, bond effects, VP/text parity, save/load, and historical replay safety. `git diff --check` passed.

The repository-wide default suite was attempted with `node node_modules/vitest/vitest.mjs run --maxWorkers=8 --reporter=verbose`, then **stopped after failures were observed outside the changed scope**. This was not a complete run and is not evidence of a clean repository-wide suite. A baseline suite was not run.

The tracked-import guard initially failed because the two new modules were untracked; staging them resolved it, and both import checks passed in the final focused run. The other observed failed cases are listed below without changing their guards or the unrelated source/data they cover.

- tests/show-list-duplication.test.js > js/shows.js is the only show list > no source file in the tree holds a control character
- tests/show-list-duplication.test.js > js/shows.js is the only show list > no file grows a new comparison against a show slug
- tests/show-list-duplication.test.js > js/shows.js is the only show list > nobody reads a show out of a season id by hand
- tests/show-list-duplication.test.js > js/shows.js is the only show list > no file grows a new two-show ternary
- tests/unrun-assertions.test.js > assertions excluded from the default suite must have a named runner > every excluded file that asserts is named by a runner
- tests/life-consistency.test.js > the log that ships > has nothing impossible left in it
- tests/records.test.js > scoping to one show > counts only the seasons that show has played
- tests/records.test.js > the whole view the page draws > adds up: the two shows account for every appearance
- tests/avatar-locals-in-scope.test.js > every avatar local the codemod introduced is declared where it is used > has no out-of-scope uses anywhere in js/
- tests/timeline-live-only-traitors.test.js > the live timeline refresh > is gated to the show whose rows it can read
- tests/timeline-live-only-traitors.test.js > buildEpisodeMap reads real rows for exactly one format > has a castle branch that reads the season, and no other
- tests/social-voices.test.js > the markers stay honest > records how many profiles each one matches
- tests/fame-calibration.test.js > fame across the real franchise > puts a real share of the roster in the middle
- tests/season-cast-photo.test.js > the cast photo > the photo this season claims to have is actually there
- tests/house-schemes.test.js > the scheme bridge > never says tribe in a house
- tests/house-schemes.test.js > the scheme bridge > always returns something renderable, even when the cast falls through
- tests/bb-power-knowledge.test.js > power knowledge as leverage > gives the house something to actually do about it
- tests/bb-talk.test.js > every intent airs as a script > fires each converted event as a written exchange
- tests/tr-audience.test.js > the measurement §10.4 exists for > separates the accrued total from the standing, against final placement
