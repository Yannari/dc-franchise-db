// On Air: the visitor's page for the season airing now. Every word that differs
// by show must come from that show's registry entry (docs/ADDING-A-SHOW.md).
import { describe, it, expect } from 'vitest';
import { onAirModel, exitSentence, ordinal, agoLabel, showsInView, singular, statText, airingModels } from '../js/on-air.js';

const live = (over = {}) => ({
  ok: true, airing: true, seasonNumber: 2, title: null, episode: 3, totalPlayers: 4, stillIn: 3,
  updatedAt: '2026-10-24 07:11:55',
  players: [
    { name: 'Ana', slug: 'ana', status: 'in', challengeWins: 2, votesReceived: 1 },
    { name: 'Bo', slug: 'bo', status: 'in', challengeWins: 0, votesReceived: 4 },
    { name: 'Cy', slug: 'cy', status: 'in', challengeWins: 1, votesReceived: 0, avatarFile: 'cy-alt.png' },
    { name: 'Di', slug: 'di', status: 'out', exitEpisode: 2, challengeWins: 0, votesReceived: 6 },
  ],
  ...over,
});
const exits = (format, extra = {}) => ({ ok: true, seasons: [{
  format, seasonNumber: 2, title: `${format} two`, airYear: 2027, airSlot: 'summer',
  updatedAt: '2026-10-24 07:11:55',
  exitInterviews: [{ guest: 'Di', week: 2, placement: 4, how: extra.how, votes: { against: 5, total: 7 } }],
}] });

describe('onAirModel', () => {
  it('learns the show from the exit feed the same sync filed', () => {
    const m = onAirModel(live(), exits('big-brother', { how: 'evicted' }));
    expect(m.format).toBe('big-brother');
    expect(m.title).toBe('big-brother two');
    expect(m.window).toMatch(/Summer 2027/);
  });

  it('orders the cast by wins, and the most recent exit first', () => {
    const m = onAirModel(live(), exits('big-brother'));
    expect(m.stillIn.map(p => p.name)).toEqual(['Ana', 'Cy', 'Bo']);
    expect(m.out.map(p => p.name)).toEqual(['Di']);
    expect(m.stillIn[1].portrait).toBe('assets/avatars/cy-alt.png');
  });

  it('never counts votes on a show without a vote', () => {
    const m = onAirModel(live(), exits('drag-race', { how: 'sashayed away' }));
    expect(m.hasVotes).toBe(false);
    expect(m.out[0].votes).toBe(0);
    const line = exitSentence(m.latestExit, m);
    expect(line).not.toMatch(/\d+–\d+/);
    expect(line).toBe('Di was sashayed away in episode 2, finishing 4th.');
  });

  it("speaks each show's own words", () => {
    const bb = onAirModel(live(), exits('big-brother', { how: 'evicted' }));
    expect(exitSentence(bb.latestExit, bb)).toBe('Di was evicted 5–2 in week 2, finishing 4th.');
    const td = onAirModel(live(), exits('total-drama'));
    expect(exitSentence(td.latestExit, td)).toBe('Di was voted out 5–2 in episode 2, finishing 4th.');
    expect(td.words.players).toBe('contestants');
  });

  it('is off air with the latest finale when nothing is airing', () => {
    const seasons = [
      { seasonId: 'td-1', title: 'Old', status: 'Complete', airYear: 2020, airSlot: 'spring', winner: { name: 'X' } },
      { seasonId: 'ci-1', title: 'Newest', status: 'Complete', airYear: 2027, airSlot: 'spring', winner: { name: 'Lila' } },
    ];
    const m = onAirModel({ ok: true, airing: false, players: [] }, null, seasons);
    expect(m.airing).toBe(false);
    expect(m.last.title).toBe('Newest');
  });
});

describe('helpers', () => {
  it('ordinals', () => {
    expect([1, 2, 3, 4, 11, 12, 13, 21, 22, 101].map(ordinal))
      .toEqual(['1st', '2nd', '3rd', '4th', '11th', '12th', '13th', '21st', '22nd', '101st']);
  });
  it('reads the worker clock as UTC', () => {
    const now = Date.parse('2026-10-24T10:11:55Z');
    expect(agoLabel('2026-10-24 07:11:55', now)).toBe('3 hours ago');
    expect(agoLabel('garbage', now)).toBe('');
  });
});

describe('several shows on the air', () => {
  const bb = onAirModel({ ...live(), format: 'big-brother' }, exits('big-brother'));
  const pm = onAirModel({ ...live(), format: 'perfect-match', seasonNumber: 1 }, null);
  it("takes the entry's own format over the exit feed", () => {
    expect(pm.format).toBe('perfect-match');
    expect(pm.words.players).toBe('islanders');
  });
  it('shows one show when the switcher picked one, and every show on "all"', () => {
    expect(showsInView([bb, pm], 'perfect-match').map(m => m.format)).toEqual(['perfect-match']);
    expect(showsInView([bb, pm], 'drag-race')).toEqual([]);
    expect(showsInView([bb, pm], 'all')).toHaveLength(2);
  });
});

describe('the board, grouped the way the show groups it', () => {
  const base = live({
    board: { merged: false, teams: [{ name: 'Gophers', color: '#38bdf8' }, { name: 'Bass', color: '#f97316' }], island: 'Redemption Island' },
    players: [
      { name: 'Ana', status: 'in', team: 'Gophers', stats: [{ label: 'immunity wins', value: 2 }] },
      { name: 'Bo', status: 'in', team: 'Bass', stats: [{ label: 'immunity wins', value: 0 }] },
      { name: 'Cy', status: 'in', island: true },
      { name: 'Di', status: 'jury', exitEpisode: 6 },
      { name: 'Ed', status: 'out', exitEpisode: 2 },
    ],
  });
  const m = onAirModel({ ...base, format: 'total-drama' }, null);
  it('splits the cast still in by tribe before the merge', () => {
    expect(m.groups.map(g => `${g.name}:${g.players.map(p => p.name)}`)).toEqual(['Gophers:Ana', 'Bass:Bo']);
  });
  it('keeps the island, the jury and the pre-jury apart', () => {
    expect(m.island.map(p => p.name)).toEqual(['Cy']);
    expect(m.islandName).toBe('Redemption Island');
    expect(m.jury.map(p => p.name)).toEqual(['Di']);
    expect(m.out.map(p => p.name)).toEqual(['Ed']);
  });
  it('is one group after the merge, under the merged name', () => {
    const merged = onAirModel({ ...base, format: 'total-drama', board: { merged: true, mergeName: 'Kinosaki' } }, null);
    expect(merged.groups.map(g => g.name)).toEqual(['Kinosaki']);
  });
  it('names a win', () => {
    expect(statText({ label: 'HOH wins', value: 1 })).toBe('1 HOH win');
    expect(statText({ label: 'vetoes won', value: 1 })).toBe('1 veto won');
    expect(statText({ label: 'vetoes won', value: 2 })).toBe('2 vetoes won');
    expect(singular('maxi challenges won')).toBe('maxi challenge won');
    expect(m.leaders[0]).toMatchObject({ label: 'immunity wins', value: 2 });
  });
});

describe('a show only the exit feed knows is on', () => {
  // The old worker kept one standings slot: publishing Big Brother 2 wrote over
  // Perfect Match 1, which aired the same summer and vanished from On Air.
  const feed = { ok: true, seasons: [
    { format: 'big-brother', seasonNumber: 2, title: 'Big Brother 2', updatedAt: '2026-10-24 07:11:55',
      exitInterviews: [{ guest: 'Di', week: 2, placement: 4, how: 'evicted' }] },
    { format: 'perfect-match', seasonNumber: 1, title: 'Perfect Match 1', airYear: 2027, airSlot: 'summer',
      updatedAt: '2026-10-24 07:11:45', exitInterviews: [
        { guest: 'Skye', week: 4, placement: 13, how: 'dumped', stillIn: ['Arjun', 'Mei', 'Theo'] },
        { guest: 'Blair', week: 4, placement: 12, how: 'dumped', stillIn: ['Arjun', 'Mei', 'Theo'] },
        { guest: 'Jo', week: 2, placement: 14, how: 'dumped', stillIn: ['Arjun', 'Mei', 'Theo', 'Skye', 'Blair'] },
      ] },
  ] };

  it('puts both shows on the air, the second rebuilt from its exits', () => {
    const ms = airingModels([live()], feed, []);
    expect(ms.map(m => m.format)).toEqual(['big-brother', 'perfect-match']);
    const pm = ms[1];
    expect(pm.episode).toBe(4);
    expect(pm.stillIn.map(p => p.name)).toEqual(['Arjun', 'Mei', 'Theo']);
    expect(pm.out.map(p => p.name).sort()).toEqual(['Blair', 'Jo', 'Skye']);
    expect(pm.total).toBe(6);
    expect(pm.stillInCount).toBe(3);
  });

  it('leaves a finished season off the air', () => {
    const ms = airingModels([], feed, [{ seasonId: 'pm-1', format: 'perfect-match', status: 'Complete' }]);
    expect(ms.map(m => m.format)).toEqual(['big-brother']);
  });

  it('puts a returnee back in, and a guest out twice in once', () => {
    // Angelica was interviewed on her way out, won the Battle Back, and was drawn evicted while she played
    // (the user, 2026-10-29). Kai came back and went out again: one card, the later exit.
    const back = { ok: true, seasons: [{ format: 'big-brother', seasonNumber: 3, title: 'Big Brother 3', updatedAt: 'x', exitInterviews: [
      { guest: 'Angelica', week: 2, placement: 9, how: 'evicted', stillIn: ['Bo', 'Cy', 'Di', 'Kai', 'Ed'] },
      { guest: 'Kai', week: 3, placement: 8, how: 'evicted', stillIn: ['Bo', 'Cy', 'Di', 'Ed'] },
      { guest: 'Kai', week: 5, placement: 6, how: 'evicted', stillIn: ['Angelica', 'Bo', 'Cy', 'Di'] },
      { guest: 'Ed', week: 6, placement: 5, how: 'evicted', stillIn: ['Angelica', 'Bo', 'Cy', 'Di'] },
    ] }] };
    const [m] = airingModels([], back, []);
    expect(m.stillIn.map(p => p.name).sort()).toEqual(['Angelica', 'Bo', 'Cy', 'Di']);
    expect(m.out.map(p => p.name).sort()).toEqual(['Ed', 'Kai']);
    expect(m.out.find(p => p.name === 'Kai').exitEpisode).toBe(5);
  });

  it('keeps a double eviction\'s first guest out, though the second one\'s house still lists them', () => {
    const dbl = { ok: true, seasons: [{ format: 'big-brother', seasonNumber: 4, title: 'Big Brother 4', updatedAt: 'x', exitInterviews: [
      { guest: 'Fay', week: 4, placement: 8, how: 'evicted', stillIn: ['Bo', 'Cy', 'Gus'] },
      { guest: 'Gus', week: 4, placement: 7, how: 'evicted', stillIn: ['Bo', 'Cy', 'Fay'] },
    ] }] };
    const [m] = airingModels([], dbl, []);
    expect(m.stillIn.map(p => p.name).sort()).toEqual(['Bo', 'Cy']);
  });
});

describe('quoting the exit interview', () => {
  // `prediction` on the record is who the guest says WINS. The page printed it
  // as "called Kyle as the next to go" while Sabrina had said Angelica.
  it('quotes the same two names the interview itself says', async () => {
    const { composeExit, exitEpisodeKey, picksForExit } = await import('../js/kristal-exit.js');
    const { seasonId } = await import('../js/shows.js');
    const rec = { id: 'big-brother-w1-Sabrina', guest: 'Sabrina', week: 1, kind: 'first-boot', mood: 'denial',
      prediction: 'Kyle', segments: ['who-next'], rivals: [], stillIn: ['Angelica', 'Kyle', 'Bo', 'Ivy'] };
    const sid = seasonId('big-brother', 2);
    for (const salt of ['', '3']) {
      const t = composeExit({ id: exitEpisodeKey(sid, rec), record: rec, season: { format: 'big-brother' } }, { salt });
      const said = topic => t.exchanges.find(e => e.topic === topic)?.who;
      const picks = picksForExit('big-brother', 2, rec, salt ? { [`${sid}:live`]: salt } : {});
      expect(picks.next).toBe(said('who-next'));
      expect(picks.winner).toBe(said('the-prediction'));
      expect(picks.winner).toBe('Kyle');
    }
  });
});
