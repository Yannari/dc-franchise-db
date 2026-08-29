// Throwaway: dump a seeded Total Drama season's transcript + timeline markup,
// so base and head can be diffed as real output rather than as a green suite.
import { describe, it } from 'vitest';
import { writeFileSync } from 'node:fs';
import { gs as gsRef, setGs, setPlayers, players, seasonConfig, relationships,
  gsCheckpoints, repairGsSets, TWIST_CATALOG, defaultConfig } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { simulateEpisode, simulateFinale } from '../js/episode.js';
import { generateSummaryText } from '../js/text-backlog.js';
import { getEpisodeEliminations, renderEpisodeHistory } from '../js/run-ui.js';
import { initGameState } from '../js/savestate.js';
import roster from '../franchise_roster.json';

const OUT = process.env.DUMP_OUT || 'dump.txt';

function rng(seed) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

describe('dump', () => {
  it('plays and writes', () => {
    const real = Math.random;
    Math.random = rng(20260828);
    try {
      const cast = roster.players.slice(0, 18)
        .map((p, i) => ({ ...p, tribe: ['Red', 'Blue', 'Yellow'][i % 3] }));
      setPlayers(cast);
      Object.assign(seasonConfig, defaultConfig(), {
        format: 'total-drama', teams: 3, mergeAt: 10, name: 'Dump', romance: 'enabled',
        twistSchedule: [
          { episode: 3, type: 'walk-like-an-egyptian' },
          { episode: 4, type: 'broadway-baby' },
          { episode: 9, type: 'princess-pride' },
        ],
      });
      relationships.length = 0;
      Object.defineProperty(globalThis, 'gs', {
        configurable: true, get: () => gsRef, set: v => setGs(v),
      });
      Object.assign(globalThis, { players, seasonConfig, relationships, pStats, pronouns,
        ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat, TWIST_CATALOG,
        gsCheckpoints, repairGsSets, updatePopularity: () => {}, saveGameState: () => {},
        renderRunTab: () => {}, _idbDelete: () => {}, _idbPut: () => {},
        _autoRevealSpoiler: () => {}, viewingEpNum: null,
        isBigBrotherSeason: () => false, houseIsAtFinale: () => false,
        tribeColor: () => '#fff', generateSummaryText,
      });
      initGameState();
      const lines = [];
      for (let i = 0; i < 20 && gsRef.phase !== 'complete' && gsRef.activePlayers.length > 1; i++) {
        const ep = gsRef.phase === 'finale' ? simulateFinale() : simulateEpisode();
        if (!ep) break;
      }
      for (const ep of gsRef.episodeHistory) {
        lines.push('##### EP ' + ep.num + ' #####');
        lines.push('ELIMS: ' + JSON.stringify(getEpisodeEliminations(ep)));
        lines.push(generateSummaryText(ep));
      }
      document.body.innerHTML = '<div id="ep-history-grid"></div>';
      renderEpisodeHistory();
      lines.push('##### TIMELINE #####');
      lines.push(document.getElementById('ep-history-grid').innerHTML);
      writeFileSync(OUT, lines.join('\n'), 'utf8');
    } finally {
      Math.random = real;
    }
  });
});
