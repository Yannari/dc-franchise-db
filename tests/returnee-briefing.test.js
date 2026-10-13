// returnee-briefing.test.js — the AI episode writer's returnee history, built
// on its own (js/returnee-briefing.js) instead of Legacy's tab and a paste.
// The user, 2026-10-13: "remove returnee briefing ... the system already does
// it now no?" -- it does now, and these say what it sends.
import { describe, it, expect, vi, afterEach } from 'vitest';
import { pastSeasonsOf, briefingPayload, briefReturnees } from '../js/returnee-briefing.js';

const P = [
  { name: 'Miriam', seasonDetails: [{ season: 11, placement: 1, story: 'won S11' }, { season: 15, placement: 3, story: 'later' }] },
  { name: 'Quin', seasonDetails: [{ season: 1, format: 'drag-race', placement: 1, story: 'crowned' }] },
  { name: 'Newbie', seasonDetails: [] },
];

afterEach(() => vi.unstubAllGlobals());

describe('what a returnee brings into a season', () => {
  it('earlier seasons of this show and every season of another; never a later one', () => {
    expect(pastSeasonsOf(P[0], { format: 'total-drama', season: 14 }).map(d => d.season)).toEqual([11]);
    expect(pastSeasonsOf(P[1], { format: 'total-drama', season: 14 }).map(d => d.season)).toEqual([1]);
    expect(pastSeasonsOf(P[1], { format: 'drag-race', season: 1 })).toEqual([]);   // their own season is not their past
  });

  it('the payload carries only that past', () => {
    const [m] = briefingPayload(['Miriam'], { players: P, format: 'total-drama', season: 14 });
    expect(m.seasons.map(s => s.story)).toEqual(['won S11']);
    expect(m.wins).toBe(1);
  });
});

describe('the episode page builds it itself', () => {
  const stub = worker => vi.stubGlobal('fetch', vi.fn(async (url, opts) => {
    if (String(url).includes('players_database.json')) return new Response(JSON.stringify({ players: P }));
    if (String(url).includes('rankings')) return new Response('[]', { status: 404 });
    return worker(url, opts);
  }));

  it('a cast with no returnees costs no worker call', async () => {
    const worker = vi.fn();
    stub(worker);
    expect(await briefReturnees(['Newbie'], { format: 'total-drama', season: 15, workerUrl: 'https://w' })).toEqual([]);
    expect(worker).not.toHaveBeenCalled();
  });

  it('returnees get a history and Voice line from the worker', async () => {
    const worker = vi.fn(async (url, opts) => {
      const body = JSON.parse(opts.body);
      expect(body.mode).toBe('returnee-history');
      expect(body.players.map(p => p.name)).toEqual(['Miriam', 'Quin']);
      return new Response(JSON.stringify({ players: body.players.map(p => ({ name: p.name, label: 'returnee', history: 'has history.', voice: 'sharp.' })) }));
    });
    stub(worker);
    const lines = await briefReturnees(['Miriam', 'Quin', 'Newbie'], { format: 'total-drama', season: 15, workerUrl: 'https://w' });
    expect(lines.map(l => l.line)).toEqual(['- Miriam (returnee): has history. Voice: sharp.', '- Quin (returnee): has history. Voice: sharp.']);
  });
});
