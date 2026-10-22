// @vitest-environment jsdom
// SCRATCH: play a season with chosen twists and dump their conversations. Never commit; delete by exact name.
import { it } from 'vitest';
import fs from 'fs';
import { runOneSeason, seededRun, core } from './helpers/season-harness.js';
import { campFeed } from '../js/td/story/feed.js';
import { tdMiscTwistScreen } from '../js/vp-td-ep/twist-screens.js';
const fmt = ls => (ls || []).map(l => l.kind === 'beat' ? `   (${l.text})` : `   ${l.by}${l.kind === 'conf' ? ' [conf]' : ''}: ${l.text}`).join('\n');

const TW = (process.env.TW || '11:auction').split(',').map(x => { const [e, t] = x.split(':'); return { id: `p${e}${t}`, episode: Number(e), type: t }; });
const SEEDS = (process.env.SEEDS || '1,2').split(',').map(Number);

it('probe', async () => {
  const roster = JSON.parse(fs.readFileSync('franchise_roster.json', 'utf8')).players.filter(r => r.stats && r.archetype);
  const out = [];
  for (const seed of SEEDS) {
    let s = seed >>> 0; const r = () => ((s = (1664525 * s + 1013904223) >>> 0) / 0x100000000);
    const cast = [...roster].sort((a, b) => a.name.localeCompare(b.name)).map(p => [r(), p]).sort((a, b) => a[0] - b[0]).slice(0, 16).map((x, i) => ({ ...x[1], tribe: i % 2 ? 'Bass' : 'Gophers' }));
    seededRun(() => runOneSeason({ twistSchedule: TW }, 16, cast), seed);
    for (const ep of core.gs.episodeHistory) {
      if (!TW.some(t => t.episode === ep.num) && !ep.exileStory && !ep.exileDuelResult && !(core.gs.episodeHistory.find(h => h.num === ep.num - 1)?.exileDuelResult)) continue;
      if (ep.exileStory) out.push('EXILESTORY ' + JSON.stringify(Object.fromEntries(Object.entries(ep.exileStory).map(([k, v]) => [k, v.map(l => `${l.by || ''}${l.kind === 'conf' ? ' [conf]' : ''}: ${l.text}`)])), null, 1));
      out.push(`\n===== S${seed} EP ${ep.num} twists=${(ep.twists || []).map(t => t.type).join(',')} out=${ep.eliminated || ''}`);
      for (const r of ep.tdFirstImp || []) out.push(`--FI ${r.tribe} -> ${r.sentTo}: ${r.boot}\n${fmt(r.huddle)}\n` + r.booth.map(b => `   [${b.voter}->${b.voted}]\n${fmt(b.lines)}`).join('\n') + `\n${fmt(r.read)}\n${fmt(r.twist)}\n${fmt(r.welcome)}\n${fmt(r.after)}`);
      if (ep.tdAuction) out.push(`--AUCTION\n${fmt(ep.tdAuction.open)}\n` + ep.tdAuction.lots.map(l => `   [LOT ${l.order} ${l.title} -> ${l.winner} $${l.finalBid}]\n${fmt(l.lines)}`).join('\n') + `\n${fmt(ep.tdAuction.close)}`);
      if (ep.tdFirstImp && process.env.DBG) {
        const { writeStory } = await import('../js/td/story/write.js');
        const { factsFor } = await import('../js/td/script/facts.js');
        const r = ep.tdFirstImp[0];
        for (const [pool, who, data] of [['fi.twist', { a: r.boot, h: 'Chris' }, { tribe: r.tribe, theirs: r.sentTo }], ['fi.after', { a: r.booth[1].voter }, { target: r.boot, theirs: r.sentTo }]]) {
          const f = factsFor({ who, data: {} }, { ep: 1, phase: 'pre' });
          for (const u of [true, 'soft', false]) out.push(`DBG ${pool} unique=${u}: ` + JSON.stringify(writeStory(pool, 'any', who, data, f, { ep: 1, camp: 'dbg' + u, phase: 'pre', n: 9, place: 'secret', unique: u })?.lines?.length ?? null));
        }
      }
      for (const id of ['first-impressions', 'auction-title']) { const sc = tdMiscTwistScreen(ep, id, {}); if (sc && sc !== 'skip') out.push(`SCREEN ${id}: ${sc.steps.length} steps`); }
      if (ep.twistStory) out.push('TWISTSTORY ' + JSON.stringify(Object.fromEntries(Object.entries(ep.twistStory).map(([k, v]) => [k, v.map(sc => sc.lines.map(l => `${l.by || ''}${l.kind === 'conf' ? ' [conf]' : ''}: ${l.text}`))])), null, 1));
      for (const camp of Object.keys(ep.campEvents || {})) for (const ph of ['pre', 'post']) for (const e of campFeed(ep, camp, ph)) {
        if (!e.story || !/auction|exile|duel|twist/.test(e.kind || '')) continue;
        out.push(`[${camp}/${ph}] ${e.kind} {${(e.players || []).join(',')}} #${e.lineId}\n` + (e.lines || []).map(l => l.kind === 'beat' ? `   (${l.text})` : `   ${l.by}${l.kind === 'conf' ? ' [conf]' : ''}: ${l.text}`).join('\n'));
      }
    }
  }
  fs.writeFileSync('C:/Users/yanna/AppData/Local/Temp/tdtx/twist-probe.txt', out.join('\n'));
});
