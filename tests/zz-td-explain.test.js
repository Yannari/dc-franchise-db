// @vitest-environment jsdom
// SCRATCH: does the viewer see WHY each big moment happens? Plays seasons and, per moment type,
// counts how often its cause aired before it. Never commit; delete by exact name.
import { it } from 'vitest';
import fs from 'fs';
import { runOneSeason, seededRun, core } from './helpers/season-harness.js';
import { campFeed } from '../js/td/story/feed.js';

const SEEDS = (process.env.SEEDS || '1,2,3,4,5').split(',').map(Number);
const TW = (process.env.TW || '').split(',').filter(Boolean).map(x => { const [e, t] = x.split(':'); return { id: `x${e}${t}`, episode: Number(e), type: t }; });

it('explain', () => {
  const roster = JSON.parse(fs.readFileSync('franchise_roster.json', 'utf8')).players.filter(r => r.stats && r.archetype);
  const tally = {};
  const misses = [];
  const hit = (k, ok, why) => { const t = (tally[k] ||= [0, 0]); t[1]++; if (ok) t[0]++; else if (misses.filter(m => m.startsWith(k)).length < 6) misses.push(`${k}: ${why}`); };
  for (const seed of SEEDS) {
    let s = seed >>> 0; const r = () => ((s = (1664525 * s + 1013904223) >>> 0) / 0x100000000);
    const cast = [...roster].sort((a, b) => a.name.localeCompare(b.name)).map(p => [r(), p]).sort((a, b) => a[0] - b[0]).slice(0, 16).map((x, i) => ({ ...x[1], tribe: i % 2 ? 'Bass' : 'Gophers' }));
    seededRun(() => runOneSeason({ romance: 'enabled', ...(TW.length ? { twistSchedule: TW } : {}) }, 16, cast), seed);
    const H = core.gs.episodeHistory.filter(e => !e.isFinale);
    // every aired scene, per episode: { kind, players, text, phase }
    const aired = new Map();
    for (const ep of H) {
      const list = [];
      for (const camp of Object.keys(ep.campEvents || {})) for (const ph of ['pre', 'post']) for (const e of campFeed(ep, camp, ph))
        list.push({ kind: e.kind || e.type || '', type: e.type || '', players: e.players || [], text: (e.lines || []).map(l => l.text).join(' ') || e.text || '', phase: ph });
      aired.set(ep.num, list);
    }
    const before = (n, pred) => H.filter(e => e.num < n).some(e => aired.get(e.num).some(pred));
    for (const ep of H) {
      const A = aired.get(ep.num);
      const tribal = ep.tribalPlayers || [];
      const ballots = (ep.votingLog || []).filter(v => v.voter && v.voted && tribal.includes(v.voter));
      // 1. advantage plays: the find aired (now or earlier), and its use is set up before the vote
      for (const p of ep.idolPlays || []) {
        if (!tribal.includes(p.player)) continue;
        const t = p.type || 'idol';
        const advTalk = x => x.players.includes(p.player) && /idol|adv|power|vote ?steal|extra vote|block|amulet|clue/i.test(x.kind + ' ' + x.type + ' ' + x.text);
        hit(`adv.found:${t}`, before(ep.num + 1, advTalk), `S${seed} E${ep.num} ${p.player} plays ${t}, never seen with it`);
        hit(`adv.why:${t}`, A.some(x => x.phase === 'post' && advTalk(x)), `S${seed} E${ep.num} ${p.player} plays ${t}, no scene that day says why`);
      }
      // 2. flips: a member of a plan who wrote another name
      for (const al of ep.alliances || []) for (const m of al.members || []) {
        const v = ballots.find(b => b.voter === m)?.voted;
        if (!v || !al.target || v === al.target || m === al.target || !tribal.includes(al.target)) continue;
        hit('flip', A.some(x => x.players.includes(m) && /vote\.(doubt|swing|plan|other)/.test(x.kind)), `S${seed} E${ep.num} ${m} broke from ${al.target} to ${v}`);
      }
      // 3. the boot: their plan aired
      if (ep.eliminated && tribal.includes(ep.eliminated))
        hit('boot.plan', A.some(x => /vote\.plan/.test(x.kind) && x.text.includes(ep.eliminated)), `S${seed} E${ep.num} ${ep.eliminated} voted out, no plan aired`);
      // 4. a friend wrote the boot's name (betrayal): that friend is seen in the plan or in doubt
      if (ep.eliminated) for (const b of ballots.filter(b => b.voted === ep.eliminated)) {
        if (b.voter === ep.eliminated) continue;
        const bond = core.gs.bondHistory ? 0 : 0; void bond;
        if (!(ep.gsSnapshot?.bonds)) continue;
      }
      // 5. new alliances: shown forming
      for (const al of (core.gs.namedAlliances || []).filter(x => x.formed === ep.num))
        hit('alliance.formed', A.some(x => /alliance|ally|recruit|pact|deal/i.test(x.kind) && (al.members || []).filter(m => x.players.includes(m)).length >= 2), `S${seed} E${ep.num} ${al.name} formed (${(al.members || []).join(', ')}), never seen`);
    }
  }
  const out = Object.entries(tally).sort().map(([k, [ok, n]]) => `${k.padEnd(26)} ${ok}/${n}  ${(100 * ok / n).toFixed(0)}%`);
  fs.writeFileSync('C:/Users/yanna/AppData/Local/Temp/tdtx/explain.txt', [...out, '', ...misses].join('\n'));
});
