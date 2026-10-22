// scratch: a Teams season through the stepped viewer's builder, as text (CH_SEED=n)
import { it } from 'vitest';
import { writeFileSync, mkdirSync } from 'node:fs';
import { setPlayers } from '../js/core.js';
import { playChallengeSeason } from '../js/ch/season.js';
import { airSeason } from '../js/ch/story/director.js';
import { challengeRows } from '../js/ch-run.js';
import { chStepScreens, chStepText } from '../js/vp-ch-ep/steps.js';
import { challengeCast } from './helpers/ch-cast.js';

it('builds every screen of a Teams season', () => {
  const seed = Number(process.env.CH_SEED) || 3;
  const { cast, names, background } = challengeCast(24, seed);
  setPlayers(cast);
  const r = playChallengeSeason({ cast: names, background, seed, options: { teams: { teaming: 'vets', count: 2, end: 'breakup' } } });
  airSeason(r.state);
  const out = [];
  for (const row of challengeRows(r)) {
    const screens = chStepScreens(row);
    out.push(`\n######## EPISODE ${row.num} — ${screens.length} screens: ${screens.map(s => s.label).join(' | ')}`);
    out.push(chStepText(row));
  }
  mkdirSync('transcripts', { recursive: true });
  writeFileSync(`transcripts/ch-teams-steps-${seed}.txt`, out.join('\n'));
}, 600000);
