// Every player gets an icon at merge time (js/player-emoji.js). The user,
// 2026-10-31: "new players don't have emoji icons in the devotees page, can you
// tell the export to add it for them based on their time on their respective
// show, do that for all the shows" — then: "the emoji is always based on their
// personality from the wiki and the show combined".
import { afterEach, describe, expect, it } from 'vitest';
import { fillCareerEmoji, setEmojiRoster, HAND_EMOJI } from '../js/player-emoji.js';
import { mergePerfectMatchSeason, mergeDragSeason } from '../js/stats-export.js';

const detail = (seasonId, format, placement, status, extra = {}) =>
  ({ season: Number(seasonId.split('-')[1]) || 1, seasonId, format, placement, status, ...extra });
const player = (name, ...seasonDetails) => ({ id: name.toLowerCase(), name, seasonDetails });
const iconOf = (db, name) => db.players.find(p => p.name === name).emoji;

afterEach(() => setEmojiRoster([]));

describe('career emoji', () => {
  it('gives every player an icon, and nobody in one cast shares one', () => {
    const cast = Array.from({ length: 24 }, (_, i) =>
      player(`Isl${i}`, detail('pm-1', 'perfect-match', i + 1, i ? 'Dumped' : 'Winner', { pm: { label: 'invisible' } })));
    const db = fillCareerEmoji({ players: cast });
    const icons = db.players.map(p => p.emoji);
    expect(icons.every(Boolean)).toBe(true);
    expect(new Set(icons).size).toBe(icons.length);
  });

  it('reads who the character is from the wiki', () => {
    setEmojiRoster([
      { name: 'Dunia', archetype: 'perceptive-player', descriptor: 'The Tarot Reader', occupation: 'Witch / tarot reader' },
      { name: 'Baxter', archetype: 'wildcard', descriptor: 'The Artist', personality: 'He sees the house the way he sees a painting.' },
      { name: 'Riza', archetype: 'showmancer', descriptor: 'The Mixer', personality: 'A romantic who falls faster than he admits, and a flirt.' },
    ]);
    const db = fillCareerEmoji({ players: [
      player('Dunia', detail('td-15', 'total-drama', 19, 'Pre-Merge')),
      player('Baxter', detail('bb-2', 'big-brother', 1, 'Winner')),
      player('Riza', detail('pm-1', 'perfect-match', 2, 'Runner-up', { showmance: 'Zara' })),
    ] });
    expect(['🔮', '🌙', '🃏']).toContain(iconOf(db, 'Dunia'));
    expect(['🎨', '🖌️', '🖼️']).toContain(iconOf(db, 'Baxter'));
    expect(['💘', '💋', '🌹', '💌']).toContain(iconOf(db, 'Riza'));
  });

  it('combines the wiki with the show: the same friendly character reads differently as a Traitor', () => {
    const bio = { archetype: 'social-butterfly', descriptor: 'The Charmer', personality: 'Friendly, chatty and easy to like.' };
    setEmojiRoster([{ name: 'Faithful', ...bio }, { name: 'Recruited', ...bio }]);
    const db = fillCareerEmoji({ players: [
      player('Faithful', detail('tr-1', 'traitors', 3, 'Banished', { tr: {} })),
      player('Recruited', detail('tr-1', 'traitors', 4, 'Banished', { tr: { roundsAsTraitor: 5, timesRecruited: 1 } })),
    ] });
    expect(['🐍', '🦊', '🕷️', '🗡️']).not.toContain(iconOf(db, 'Faithful'));
    expect(['🐍', '🦊', '🕷️', '🗡️']).toContain(iconOf(db, 'Recruited'));
  });

  it('reads what the wiki wrote about the season being merged', () => {
    const db = fillCareerEmoji({ players: [player('Quiet', detail('ci-1', 'the-circle', 7, 'Blocked'))] },
      { format: 'the-circle', seasonNumber: 1, placements: [
        { name: 'Quiet', personality: 'She cooked for the whole building and talked about food in every chat.' }] });
    expect(['🍳', '🍔', '🧁']).toContain(iconOf(db, 'Quiet'));
  });

  it('keeps an icon the AI or a person chose, and the originals’ hand-picked ones, for the originals only', () => {
    const db = fillCareerEmoji({ players: [
      { ...player('Chosen', detail('bb-1', 'big-brother', 1, 'Winner')), emoji: '🦄' },
      player('Owen', detail('td-1', 'total-drama', 1, 'Winner')),
      player('Jo', detail('dr-1', 'drag-race', 2, 'Runner-up', { dr: {} })),
    ] });
    expect(iconOf(db, 'Chosen')).toBe('🦄');
    expect(db.players[0].autoEmoji).toBeUndefined();
    expect(iconOf(db, 'Owen')).toBe(HAND_EMOJI.owen);
    expect(iconOf(db, 'Jo')).not.toBe(HAND_EMOJI.jo);
  });

  it('keeps a derived icon across other seasons’ exports, and re-reads it when the record changes', () => {
    setEmojiRoster([{ name: 'Comeback', archetype: 'underdog', descriptor: 'The Quiet Competitor' }]);
    const db = fillCareerEmoji({ players: [player('Comeback', detail('bb-1', 'big-brother', 16, 'Pre-Jury'))] });
    const first = iconOf(db, 'Comeback');
    db.players[0].emoji === first && fillCareerEmoji(db, { format: 'drag-race', seasonNumber: 1, placements: [] });
    expect(iconOf(db, 'Comeback')).toBe(first);
    db.players[0].seasonDetails.push(detail('bb-2', 'big-brother', 1, 'Winner', { bb: { hohWins: 4, vetoWins: 3 } }));
    fillCareerEmoji(db);
    expect(db.players[0].autoEmojiFrom).toMatch(/^bb-2:Winner/);
  });

  it('runs inside the merges, so a published season carries an icon for everybody', () => {
    const pm = mergePerfectMatchSeason({ players: [] }, { format: 'perfect-match', seasonNumber: 1, placements: [
      { name: 'Ana', placement: 1, status: 'Winner', pm: {} },
      { name: 'Ben', placement: 1, status: 'Winner', pm: {} },
      { name: 'Cal', placement: 3, status: 'Dumped', pm: { label: 'villain' } },
    ] });
    expect(pm.players.every(p => p.emoji)).toBe(true);
    expect(['🐍', '🦊', '🕷️', '🗡️']).toContain(pm.players[2].emoji);
    const dr = mergeDragSeason({ players: [] }, { format: 'drag-race', seasonNumber: 1, placements: [
      { name: 'Ivy', placement: 1, status: 'Winner', dr: { wins: 3 } },
      { name: 'Jo', placement: 2, status: 'Runner-up', dr: { lipsyncWins: 3 } },
    ] });
    expect(dr.players.every(p => p.emoji)).toBe(true);
    expect(['💃', '🩰', '🕺']).toContain(dr.players[1].emoji);
  });
});
