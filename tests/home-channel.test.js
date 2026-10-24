// The front page read as a channel: the guide and the corner bug.
import { describe, it, expect } from 'vitest';
import { guideHtml, bugHtml, homeModel } from '../js/home.js';
import { onAirModel } from '../js/on-air.js';

const live = { format: 'perfect-match', airing: true, seasonNumber: 1, episode: 4, updatedAt: 'u',
  players: [{ name: 'Arjun', slug: 'arjun', status: 'in' }, { name: 'Skye', slug: 'skye', status: 'out', exitEpisode: 4 }] };
const seasons = [{ seasonId: 'ci-1', format: 'the-circle', title: 'The Circle 1', status: 'Complete',
  winner: { name: 'Lila', playerSlug: 'lila' } }];

describe('guideHtml', () => {
  const model = homeModel([], seasons);
  const html = guideHtml([onAirModel(live, null, seasons)], model);
  const col = n => html.split('hm-guide-col').slice(1)[n];

  it('puts the airing season on now and its next round up next', () => {
    expect(col(0)).toContain('Perfect Match 1');
    expect(col(0)).toContain('Episode 4');
    expect(col(1)).toContain('Episode 5');
  });
  it('never lists a show on the air as in production', () => {
    expect(col(2)).not.toContain('Perfect Match');
    expect(col(2)).toContain('In production');
  });
  it('offers the latest finale on demand, with its winner', () => {
    expect(col(3)).toContain('The Circle 1');
    expect(col(3)).toContain('won by Lila');
  });
});

describe('bugHtml', () => {
  it('says live only when something is', () => {
    expect(bugHtml(true)).toMatch(/is-live">Live</);
    expect(bugHtml(false)).toMatch(/>Replay</);
  });
});
