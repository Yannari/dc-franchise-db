// @vitest-environment jsdom
// Nobody on the dock talks to somebody who hasn't arrived yet. The user, 2026-10-10: contestant 1, Will,
// greeted Jake, a returnee: the arrivals were written in one order (twists.js) and played in another (the
// viewer sends the island's returnees in their own helicopter last, and the carnival's teams one per
// helicopter). Checked in the order the viewer plays them.
import { it, expect } from 'vitest';
import { runOneSeason, seededRun, core, makeCast } from './helpers/season-harness.js';

// the viewer's order (vp-td-ep/arrival.js): by team at the carnival, returnees last on the island
const viewerOrder = (ep, venue) => {
  const teamOf = n => (ep.tribesAtStart || []).find(t => (t.members || []).includes(n))?.name || null;
  const order = [...ep.dockArrivals];
  if (venue === 'carnival') order.sort((x, y) => String(teamOf(x.name)).localeCompare(String(teamOf(y.name))) || x.order - y.order);
  else if (venue === 'survival-island') order.sort((x, y) => (x.isReturnee ? 1 : 0) - (y.isReturnee ? 1 : 0) || x.order - y.order);
  return order;
};

for (const venue of ['survival-island', 'carnival', 'hosted-camp']) {
  it(`${venue}: every arrival speaks only to people already there`, () => {
    const cast = makeCast(14).map((p, i) => ({ ...p, isReturnee: i % 4 === 0 }));
    seededRun(() => runOneSeason({ setting: venue, romance: 'enabled' }, 14, cast), 4242);
    const ep = core.gs.episodeHistory.find(e => e.num === 1);
    const order = viewerOrder(ep, venue);
    const bad = [];
    order.forEach((a, i) => {
      const before = new Set(order.slice(0, i).map(x => x.name));
      const others = [...new Set((a.lines || []).map(l => l.by).filter(n => n && n !== a.name && n !== (core.seasonConfig.host || 'Chris')))];
      for (const n of others) if (!before.has(n)) bad.push(`${a.name} (#${i + 1}) with ${n}, who arrives later`);
    });
    expect(bad).toEqual([]);
  }, 300000);
}
