// Every player gets an icon at merge time, from their time on their show
// (js/player-emoji.js). The user, 2026-10-31: "new players don't have emoji
// icons in the devotees page, can you tell the export to add it for them based
// on their time on their respective show, do that for all the shows".
import { describe, expect, it } from 'vitest';
import { fillCareerEmoji, HAND_EMOJI } from '../js/player-emoji.js';
import { mergePerfectMatchSeason, mergeDragSeason } from '../js/stats-export.js';

const detail = (seasonId, format, placement, status, extra = {}) =>
  ({ season: 1, seasonId, format, placement, status, ...extra });
const player = (name, ...seasonDetails) => ({ id: name.toLowerCase(), name, seasonDetails });

describe('career emoji', () => {
  it('gives every player an icon, and nobody in one cast shares one', () => {
    const cast = Array.from({ length: 24 }, (_, i) =>
      player(`Isl${i}`, detail('pm-1', 'perfect-match', i + 1, i ? 'Dumped' : 'Winner', { pm: { label: 'invisible' } })));
    const db = fillCareerEmoji({ players: cast });
    const icons = db.players.map(p => p.emoji);
    expect(icons.every(Boolean)).toBe(true);
    expect(new Set(icons).size).toBe(icons.length);
  });

  it('crowns a winner with the show’s own crown, and reads what they did on that show', () => {
    const db = fillCareerEmoji({ players: [
      player('Queen', detail('dr-1', 'drag-race', 1, 'Winner')),
      player('Twin', detail('dras-1', 'drag-race-all-stars', 1, 'Winner')),
      player('Fish', detail('ci-1', 'the-circle', 3, 'Finalist', { ci: { catfishSeasons: 1 } })),
      player('Snake', detail('tr-1', 'traitors', 1, 'Winner', { tr: { roundsAsTraitor: 4 } })),
      player('Thief', detail('pm-1', 'perfect-match', 9, 'Dumped', { pm: { timesStolen: 2 } })),
    ] });
    const by = Object.fromEntries(db.players.map(p => [p.name, p.emoji]));
    expect(by.Queen).toBe('👑');
    expect(by.Twin).toBe('👑');
    expect(by.Fish).toMatch(/🎭|🐟/);
    expect(by.Snake).toBe('🗡️');
    expect(by.Thief).toBe('💔');
  });

  it('keeps an icon the AI or a person chose, and the hand-picked originals', () => {
    const db = fillCareerEmoji({ players: [
      { ...player('Chosen', detail('bb-1', 'big-brother', 1, 'Winner')), emoji: '🦄' },
      player('Owen', detail('td-1', 'total-drama', 1, 'Winner')),
    ] });
    expect(db.players[0].emoji).toBe('🦄');
    expect(db.players[0].autoEmoji).toBeUndefined();
    expect(db.players[1].emoji).toBe(HAND_EMOJI.owen);
  });

  it('re-derives its own icon when the record changes: an early boot who comes back and wins', () => {
    const p = player('Comeback', detail('bb-1', 'big-brother', 16, 'Pre-Jury'));
    const db = fillCareerEmoji({ players: [p, ...Array.from({ length: 15 }, (_, i) => player(`H${i}`, detail('bb-1', 'big-brother', i + 1, 'Jury')))] });
    const early = db.players[0].emoji;
    db.players[0].seasonDetails.push(detail('bb-2', 'big-brother', 1, 'Winner'));
    fillCareerEmoji(db);
    expect(early).not.toBe('🔑');
    expect(db.players[0].emoji).toBe('🔑');
  });

  it('runs inside the merges, so a published season carries an icon for everybody', () => {
    const pm = mergePerfectMatchSeason({ players: [] }, { format: 'perfect-match', seasonNumber: 1, placements: [
      { name: 'Ana', placement: 1, status: 'Winner', pm: {} },
      { name: 'Ben', placement: 1, status: 'Winner', pm: {} },
      { name: 'Cal', placement: 3, status: 'Dumped', pm: { label: 'villain' } },
    ] });
    expect(pm.players.map(p => p.emoji)).toEqual(['💞', '💍', '😈']);
    const dr = mergeDragSeason({ players: [] }, { format: 'drag-race', seasonNumber: 1, placements: [
      { name: 'Ivy', placement: 1, status: 'Winner', dr: { wins: 3 } },
      { name: 'Jo', placement: 2, status: 'Runner-up', dr: {} },
    ] });
    expect(dr.players.map(p => p.emoji)).toEqual(['👑', '🥈']);
  });
});
