// The news ticker: what it says, in which order, and when it says nothing.
import { describe, it, expect } from 'vitest';
import { tickerItems, tickerHtml } from '../js/ticker.js';
import { onAirModel, exitSentence, statText } from '../js/on-air.js';
import { picksForExit, exitInterviewHref } from '../js/kristal-exit.js';

const helpers = { exitSentence, statText, picksForExit: (f, n, x) => picksForExit(f, n, x, {}), exitInterviewHref };
const exits = { ok: true, seasons: [
  { format: 'big-brother', seasonNumber: 2, title: 'Big Brother 2', updatedAt: 'a',
    exitInterviews: [{ id: 'big-brother-w1-Sabrina', guest: 'Sabrina', week: 1, placement: 18, how: 'evicted', votes: { against: 15, total: 15 },
      prediction: 'Kyle', segments: ['who-next'], rivals: ['Angelica'], stillIn: ['Angelica', 'Kyle', 'Bo'] }] },
  { format: 'drag-race', seasonNumber: 3, title: 'Drag Race 3', updatedAt: 'b',
    exitInterviews: [{ guest: 'Mona', week: 2, placement: 12, how: 'sashayed away', votes: null }] },
] };
const live = (format, n) => ({ format, airing: true, seasonNumber: n, episode: 2, updatedAt: 'x',
  players: [{ name: 'Ana', slug: 'ana', status: 'in', stats: [{ label: 'HOH wins', value: 2 }] },
    { name: 'Bo', slug: 'bo', status: 'in' }] });

describe('tickerItems', () => {
  const models = [onAirModel(live('big-brother', 2), exits), onAirModel(live('drag-race', 3), exits)];
  const items = tickerItems(models, { 'big-brother': [{ text: 'LEAVE Kyle ALONE', likes: 9, handle: '@a' }, { text: 'meh', likes: 1 }] }, helpers);

  it("says each show's exit in that show's words", () => {
    expect(items.find(i => i.label === 'Big Brother 2' && i.kind === 'exit').text).toMatch(/^Sabrina was evicted 15–0/);
    const dr = items.find(i => i.label === 'Drag Race 3' && i.kind === 'exit').text;
    expect(dr).toMatch(/sashayed away/);
    expect(dr, 'a vote count on a show with no vote').not.toMatch(/\d+–\d+/);
  });

  it('alternates the shows instead of running one then the other', () => {
    expect(items.slice(0, 2).map(i => i.label)).toEqual(['Big Brother 2', 'Drag Race 3']);
  });

  it('carries the call, the leader and the loudest post, each linked', () => {
    // `prediction` is the WINNER pick; who goes next is the who-next segment's answer.
    const call = items.find(i => i.kind === 'call');
    expect(call.text).toBe('Sabrina names Angelica to go next.');
    // Never ?show=: that is the site's show switcher.
    expect(call.href).toBe('kristal.html?exit=big-brother-w1-Sabrina&in=bb-2');
    expect(items.find(i => i.kind === 'leader').text).toBe('Ana leads the season: 2 HOH wins.');
    const post = items.find(i => i.kind === 'post');
    expect(post.text).toBe('“LEAVE Kyle ALONE” @a');
    expect(post.href).toBe('social.html?show=big-brother&season=2');
    expect(items.every(i => i.href)).toBe(true);
  });

  it('is empty when nothing is on the air', () => {
    expect(tickerItems([], {}, helpers)).toEqual([]);
  });

  it('draws the row twice, the copy hidden from assistive tech', () => {
    const html = tickerHtml(items);
    expect(html.match(/class="bs-tk-row"/g).length).toBe(2);
    expect(html).toMatch(/class="bs-tk-row" aria-hidden="true" inert/);
  });
});

describe('collapsing the band', () => {
  it('has a toggle that names what it does and what is hidden', () => {
    const html = tickerHtml([{ kind: 'exit', label: 'Big Brother 2', accent: '#38BDF8', text: 'x', href: 'on-air.html' },
      { kind: 'post', label: 'Big Brother 2', accent: '#38BDF8', text: 'y', href: 'social.html' }]);
    expect(html).toMatch(/<button type="button" class="bs-tk-toggle" aria-controls="bs-tk-view" aria-expanded="true" aria-label="Hide the news">/);
    expect(html).toContain('<span class="bs-tk-more">2 stories</span>');
    expect(html).toContain('id="bs-tk-view"');
  });
});
