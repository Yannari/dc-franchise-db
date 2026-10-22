import { it } from 'vitest';
import { writeFileSync, mkdirSync } from 'node:fs';
import { gs, setPlayers, seasonConfig } from '../js/core.js';
import { playTraitorsSeason } from '../js/tr/headless.js';
import { generateTraitorsSummaryText } from '../js/text-backlog.js';
import roster from '../franchise_roster.json';
it('read', () => {
  const R = roster.players.slice(20, 40);
  setPlayers(R); seasonConfig.trShieldSource = 'mission';
  playTraitorsSeason({ cast: R.map(p => p.name), traitorCount: 3, seed: 5 });
  const D = 'C:/Users/yanna/AppData/Local/Temp/claude/C--Users-yanna-OneDrive-Documents-GitHub-dc-franchise-db/f27dcafb-b64a-4f94-aff3-d131e05858cd/scratchpad/read2/';
  mkdirSync(D, { recursive: true });
  gs.episodeHistory.forEach(ep => writeFileSync(D + 'ep' + String(ep.num).padStart(2, '0') + '.txt', generateTraitorsSummaryText(ep, 'audience')));
});
