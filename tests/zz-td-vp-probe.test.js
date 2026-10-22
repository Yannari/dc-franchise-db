// @vitest-environment jsdom
// SCRATCH (TD viewer build): dump the shape of a played episode record. Never commit; delete by exact name.
import { it } from 'vitest';
import fs from 'fs';
import { runOneSeason, seededRun, core } from './helpers/season-harness.js';

it('probe', () => {
  const roster = JSON.parse(fs.readFileSync('franchise_roster.json', 'utf8')).players;
  const names = ['Alejandro','Heather','Gwen','Duncan','Courtney','Owen','Izzy','Cody','Sierra','Lindsay','Harold','Leshawna','Noah','Bridgette','Geoff','Trent'];
  const cast = names.map((n, i) => ({ ...roster.find(r => r.name === n), tribe: i % 2 ? 'Bass' : 'Gophers' }));
  seededRun(() => runOneSeason({ romance: 'enabled' }, 16, cast), 4242);
  const hist = core.gs.episodeHistory;
  const ep = hist[2];
  const pick = e => ({ type: e.type, players: e.players, badgeText: e.badgeText, keys: Object.keys(e), scene: e.scene, lines: e.lines, access: e.access, text: e.text });
  const camp = {};
  for (const [k, v] of Object.entries(ep.campEvents || {})) camp[k] = { pre: (v.pre || []).slice(0, 5).map(pick), post: (v.post || []).slice(0, 5).map(pick), nPre: (v.pre||[]).length, nPost: (v.post||[]).length };
  const out = {
    keys: Object.keys(ep), campAccess: ep.campAccess, camp,
    tribal: { tribalTribe: ep.tribalTribe, tribalPlayers: ep.tribalPlayers, votes: ep.votes, votingLog: ep.votingLog, idolPlays: ep.idolPlays, eliminated: ep.eliminated, isTie: ep.isTie, revoteLog: ep.revoteLog, isRockDraw: ep.isRockDraw, immunityWinner: ep.immunityWinner, winner: ep.winner, loser: ep.loser, multi: ep.multiTribalResults, openVote: ep.openVote },
    settingsAll: hist.map(e => ({ n: e.num, merge: e.isMerge, tribal: e.tribalTribe, elim: e.eliminated, tie: e.isTie, rocks: e.isRockDraw, idols: (e.idolPlays||[]).length, multi: !!(e.multiTribalResults||[]).length, ri: e.riChoice, open: e.openVote, flags: Object.keys(e).filter(k => /^is[A-Z]/.test(k) && e[k] === true) })),
  };
  fs.writeFileSync('C:/Users/yanna/AppData/Local/Temp/claude/C--Users-yanna-OneDrive-Documents-GitHub-dc-franchise-db/f7f29f73-9327-4226-ae09-e814093d722a/scratchpad/probe.json', JSON.stringify(out, null, 1));
}, 300000);
