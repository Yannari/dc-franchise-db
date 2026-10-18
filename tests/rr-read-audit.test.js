// The Ridonculous Race: write one aired season as an episode-by-episode read
// (npm run rr:read; RR_SEED picks the season, RR_TEAMS the size). Manual §19.3 step 1.
import { it } from 'vitest';
import { mkdirSync, writeFileSync } from 'node:fs';
import { airSeason, episodeText } from '../js/rr/episode.js';
import { playRaceSeason } from '../js/rr/season.js';
import { setPlayers } from '../js/core.js';
import { raceCast } from './helpers/rr-cast.js';

it('writes an aired season to read', () => {
  const seed = Number(process.env.RR_SEED || 1);
  const n = Number(process.env.RR_TEAMS || 12);
  const { cast, teams } = raceCast(n, seed);
  setPlayers(cast);
  const res = playRaceSeason({ teams, seed });
  const eps = airSeason(res);
  mkdirSync('transcripts', { recursive: true });
  const file = `transcripts/rr-read-${seed}.txt`;
  writeFileSync(file, eps.map((ep, i) => episodeText(res.state, res.legs[i], ep)).join('\n\n'));
  console.log(`wrote ${file}`);
});
