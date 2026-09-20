// ══════════════════════════════════════════════════════════════════════
// coach-card-multi-tribal.test.js — the card on a night two tribes vote
// ══════════════════════════════════════════════════════════════════════
//
// Reported, after the save card's odds were fixed and still nothing fired:
// "i think it doesnt work in multi tribal maybe". It didn't.
//
// runTribal takes (tribalPlayers, immuneName, allianceSet, coachTargets) and
// reads the tribe's name from an enclosing `tribeLabel` — which is NULL on the
// two paths that call it directly, multi-tribal and double-tribal. Both already
// have to hand their coaches in as vote targets for the same reason, and both
// comments say so. The save card was sealed with `commitSaveCards(ep, null)`,
// which finds no staff, so nothing ever committed: maybeSaveCoach then found
// nothing to resolve and the coach went home with a live card.
//
// A double-tribal council has a second version of the same fault. It is
// labelled "Bass + Gophers", coachesOf() knows no such tribe, so no bloc could
// name a coach on the one night two tribes vote together — while the coaches
// were still reachable as vote targets. A coach could be voted out at a council
// where nobody was recorded as aiming at them, which is exactly what the card
// reads to decide.
//
// Measured over three seeds each, expansion to three tribes then the twist:
// commits on those nights went 0/0/0 (both twists) to 1-2.
import { describe, expect, it } from 'vitest';
import { runHeadlessSeason } from './helpers/coach-season.js';
import { seededRandom } from './helpers/rng.js';

/** Coaches every episode, an expansion to three tribes, then the twist on three nights. */
function schedule(kind) {
  const out = [];
  for (let e = 1; e <= 40; e++) out.push({ episode: e, type: 'coaches', id: `coaches-${e}` });
  out.push({ episode: 2, type: 'tribe-expansion', id: 'tribe-expansion-2' });
  for (const e of [4, 6, 8]) out.push({ episode: e, type: kind, id: `${kind}-${e}` });
  return out;
}

async function season(kind, seed) {
  const real = Math.random;
  Math.random = seededRandom(seed);
  try {
    return await runHeadlessSeason({
      twist: 'coaches', coachesPerTribe: 1, castSize: 18, mergeAt: 8,
      config: { twistSchedule: schedule(kind) },
    });
  } finally { Math.random = real; }
}

describe('the save card on a multi-tribal night', () => {
  it('seals for the tribe that is actually voting', async () => {
    let nights = 0, commits = 0;
    for (const seed of [1, 3]) {
      for (const e of (await season('multi-tribal', seed)).episodes) {
        const ep = e.ep || {};
        if (!ep.isMultiTribal) continue;
        nights++;
        commits += (ep.coachCardCommits || []).length;
      }
    }
    expect(nights, 'the twist never ran — the season did not reach three tribes').toBeGreaterThan(0);
    expect(commits, 'no card was sealed on any multi-tribal night').toBeGreaterThan(0);
  }, 300000);

  it('seals across a double-tribal council, where the label is not a tribe', async () => {
    let nights = 0, commits = 0, aimedAtCoach = 0;
    for (const seed of [1, 3]) {
      const s = await season('double-tribal', seed);
      const coaches = new Set(s.coachNames);
      for (const e of s.episodes) {
        const ep = e.ep || {};
        if (!ep.isDoubleTribal) continue;
        nights++;
        commits += (ep.coachCardCommits || []).length;
        aimedAtCoach += (ep.alliances || ep.allianceSet || []).filter(a => coaches.has(a.target)).length;
      }
    }
    expect(nights, 'the twist never ran').toBeGreaterThan(0);
    // the council is labelled "Bass + Gophers": the coaches have to be found by
    // their members, or no bloc can name one and the card has nothing to read
    expect(aimedAtCoach, 'no bloc could even name a coach at the combined council').toBeGreaterThan(0);
    expect(commits, 'no card was sealed at a double-tribal council').toBeGreaterThan(0);
  }, 300000);
});
