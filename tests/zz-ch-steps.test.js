// Scratch: build the stepped viewer's screens for a season and print them.
import { it } from 'vitest';
import { writeFileSync } from 'node:fs';
import { setPlayers } from '../js/core.js';
import { playChallengeSeason } from '../js/ch/season.js';
import { airSeason } from '../js/ch/story/director.js';
import { challengeRows } from '../js/ch-run.js';
import { chStepScreens, chStepText } from '../js/vp-ch-ep/steps.js';
import { challengeCast } from './helpers/ch-cast.js';
it('steps', () => {
  const seed = Number(process.env.CH_SEED) || 5;
  const { cast, names, background } = challengeCast(24, seed); setPlayers(cast);
  const r = playChallengeSeason({ cast: names, background, seed }); airSeason(r.state);
  const rows = challengeRows(r);
  const out = [];
  for (const row of rows) {
    const scr = chStepScreens(row);
    out.push(`######## EPISODE ${row.num}: ${scr.map(s => `${s.label}(${s.steps.length})`).join(' · ')}`);
    out.push(chStepText(row));
  }
  writeFileSync('transcripts/ch-steps.txt', out.join('\n'));
  writeFileSync('tools/ch-art/cuts/rows.json', JSON.stringify(rows));
});
