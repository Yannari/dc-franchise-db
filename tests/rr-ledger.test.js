// The Ridonculous Race: what a season leaves the franchise (engine plan, Task 20).
import { describe, it, expect, beforeAll } from 'vitest';
import { rrLedgerRecord } from '../js/rr/ledger-record.js';
import { playRaceSeason } from '../js/rr/season.js';
import { setPlayers, players } from '../js/core.js';
import { getBond } from '../js/bonds.js';
import { raceCast } from './helpers/rr-cast.js';

describe('rr franchise record', () => {
  let season, rec;
  beforeAll(() => {
    const { cast, teams } = raceCast(10, 4);
    setPlayers(cast);
    season = playRaceSeason({ teams, seed: 4 });
    rec = rrLedgerRecord(season.state, season, { seasonName: 'Ridonculous 1',
      archetypeOf: n => players.find(p => p.name === n)?.archetype || null, popularity: { [cast[0].name]: 3 } });
  });

  it('is the franchise shape, in this show\'s format', () => {
    expect(rec.format).toBe('ridonculous-race');
    expect(rec.seasonName).toBe('Ridonculous 1');
    expect(rec.fanFavorite).toBeNull();
    expect(Object.keys(rec.players)).toHaveLength(20);
  });

  it('every racer has a record with the team\'s placement; the winners are first', () => {
    const st = season.state;
    for (const id of st.order) {
      const t = st.teams[id];
      for (const n of [t.a, t.b]) {
        const p = rec.players[n];
        expect(p.placement).toBe(season.placements[id]);
        expect(p.rr.team).toBe(t.name);
        expect(p.rr.partner).toBe(n === t.a ? t.b : t.a);
        expect(p.rr.rel).toBe(t.rel);
        expect(p.winner).toBe(id === season.winner);
        expect(p.chalWins).toBe(st.rec[id].legWins);
        expect(p.episodesLasted).toBeGreaterThan(0);
      }
    }
    const w = st.teams[season.winner];
    expect(rec.players[w.a].placement).toBe(1);
    expect(rec.players[w.a].finalist).toBe(true);
  });

  it('partners are each other\'s allies unless they ended the season below bond -3', () => {
    for (const id of season.state.order) {
      const t = season.state.teams[id];
      const ally = rec.players[t.a].allies.includes(t.b);
      expect(ally).toBe(getBond(t.a, t.b) >= -3);
    }
  });

  it('a caught saboteur has betrayed the team it hit', () => {
    const st = season.state;
    for (const sc of st.scenes.filter(x => x.data.facts?.caught)) {
      expect(rec.players[sc.who[0]].betrayed).toContain(st.teams[sc.data.other].a);
    }
  });
});
