// scratch: a Pairs season through the stepped viewer's builder, as text (CH_PAIRS=rivals CH_SEED=n)
import { it } from 'vitest';
import { writeFileSync, mkdirSync } from 'node:fs';
import { setPlayers } from '../js/core.js';
import { playChallengeSeason } from '../js/ch/season.js';
import { airSeason } from '../js/ch/story/director.js';
import { challengeRows } from '../js/ch-run.js';
import { chStepScreens, chStepText } from '../js/vp-ch-ep/steps.js';
import { challengeCast } from './helpers/ch-cast.js';

it('builds every screen of a Pairs season', () => {
  const pairing = process.env.CH_PAIRS || 'rivals', seed = Number(process.env.CH_SEED) || 3;
  const { cast, names, background } = challengeCast(24, seed);
  if (pairing === 'fresh-meat') {
    const m = names.filter(n => background[n].gender === 'm'), f = names.filter(n => background[n].gender === 'f');
    for (const [i, n] of m.entries()) background[n].rookie = i < 6;
    for (const [i, n] of f.entries()) background[n].rookie = i >= 6;
  }
  setPlayers(cast);
  const r = playChallengeSeason({ cast: names, background, seed, options: { pairs: { pairing } } });
  airSeason(r.state);
  const rows = challengeRows(r);
  const out = [];
  for (const row of rows) {
    const screens = chStepScreens(row);
    out.push(`\n######## EPISODE ${row.num} — ${screens.length} screens: ${screens.map(s => s.label).join(' | ')}`);
    out.push(chStepText(row));
  }
  mkdirSync('transcripts', { recursive: true });
  writeFileSync(`transcripts/ch-pairs-steps-${pairing}-${seed}.txt`, out.join('\n'));
  writeFileSync('tools/ch-art/cuts/rows-pairs.json', JSON.stringify(rows));
}, 300000);
