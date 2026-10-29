// A Secret Story house life is the House of Secrets', not Big Brother's (the user, 2026-10-28: "this discussion makes
// no sense... god the writing is bad"; "they don't really talk about nominations when they should, it's a little bit
// of the strategy of this game"). Read on a played season: no Head of Household, block, veto, key, final two, have-nots
// or island; and the talk before the nominations agrees with the ballots the confessional got.
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { gs, players, seasonConfig, relationships } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { simulateBBEpisode } from '../js/bb-run.js';
import { bbWeekSteps } from '../js/vp-bb-ep/steps.js';
import { seedGame } from './helpers/setup.js';
import { withSeededRandom } from './helpers/rng.js';

const roster = JSON.parse(fs.readFileSync('franchise_roster.json', 'utf-8'));
const all = (Array.isArray(roster) ? roster : roster.players).filter(p => p.stats && p.archetype && !p.drag);
const CAST = all.filter(p => p.castingInterview).slice(0, 8).concat(all.filter(p => !p.castingInterview && p.occupation).slice(0, 6))
  .map(p => ({ ...p, sexuality: p.sexuality || 'straight' }));
const BB = /\b(HOH|head of household|comps?|veto|jury|the block|on the block|holds? the key|final twos?|whoever wins|houseguests?|evict\w*|have-?nots?|slop|lockdown)\b/i;

describe('a Secret Story house life', () => {
  it('speaks the House of Secrets, and its nomination talk keeps to the ballots', () => {
    seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
    Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns, ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
    Object.assign(seasonConfig, { format: 'secret-story', seasonNumber: 1, finaleSize: 3, jurySize: 0, theme: '', twistSchedule: [], themeArcStamped: '', bbSecretStory: undefined, ssSignature: 'none', ssSecretRoom: 'off' });
    withSeededRandom(11, () => { for (let i = 0; i < 4; i++) simulateBBEpisode(); });
    const bad = [];
    for (const row of gs.episodeHistory) {
      for (const s of bbWeekSteps(row, { host: 'Josh' })) {
        if (!(s.kind === 'houselife' || s.kind === 'scene')) continue;
        for (const st of s.steps || []) {
          if (typeof st.t === 'string' && BB.test(st.t)) bad.push(`w${row.num} ${s.id}: ${st.t}`);
          if (/\b(beach|bonfire|dock|lagoon|volcano)\b/i.test(String(st.scene?.room || ''))) bad.push(`w${row.num} ${s.id}: in ${st.scene.room}`);
        }
      }
    }
    expect(bad).toEqual([]);
    // the talk before the nominations: a promise is kept or is a lie, as the ballots say
    let talks = 0;
    for (const row of gs.episodeHistory) {
      const ballots = row.acts.find(a => a?.secretStory)?.secretStory?.ballots || [];
      const picks = v => ballots.find(b => b.voter === v)?.picks || [];
      for (const sc of row.acts.flatMap(a => a?.scenes || [])) {
        const [a, b, c] = sc.cast || [];
        if (sc.step === 'ss.noms.lie') { talks++; expect(picks(b), `${b} lies to ${a}`).toContain(a); }
        if (sc.step === 'ss.noms.fear') { talks++; expect(picks(b), `${b} is honest with ${a}`).not.toContain(a); }
        // (the one they name never speaks, so is not in the cast: the two share a name, or do not)
        void c;
        if (sc.step === 'ss.noms.plan') { talks++; expect(picks(a).some(n => picks(b).includes(n)), `${a} and ${b} share a name`).toBe(true); }
        if (sc.step === 'ss.noms.push') { talks++; expect(picks(a).some(n => !picks(b).includes(n)), `${b} does not follow ${a}`).toBe(true); }
      }
    }
    expect(talks).toBeGreaterThanOrEqual(2);
  }, 300_000);
});
