// The Ridonculous Race: write one played season as plain text, to read
// (npm run rr:transcript; RR_SEED picks the season, RR_TEAMS the size).
import { it } from 'vitest';
import { mkdirSync, writeFileSync } from 'node:fs';
import { seasonText } from '../js/rr/transcript.js';
import { playRaceSeason } from '../js/rr/season.js';
import { setPlayers } from '../js/core.js';
import { raceCast } from './helpers/rr-cast.js';

it('writes a season transcript', () => {
  const seed = Number(process.env.RR_SEED || 1);
  const n = Number(process.env.RR_TEAMS || 12);
  const { cast, teams } = raceCast(n, seed);
  setPlayers(cast);
  const result = playRaceSeason({ teams, seed });
  mkdirSync('transcripts', { recursive: true });
  const file = `transcripts/rr-season-${seed}.txt`;
  writeFileSync(file, seasonText(result));
  console.log(`wrote ${file}`);
});
