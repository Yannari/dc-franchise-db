// @vitest-environment jsdom
// SCRATCH (TD viewer brainstorm): dump one real-roster season's camp events and tribal text.
import { it } from 'vitest';
import fs from 'fs';
import { runOneSeason, seededRun, core } from './helpers/season-harness.js';

it('dumps a TD season', () => {
  const roster = JSON.parse(fs.readFileSync('franchise_roster.json', 'utf8')).players;
  const names = ['Alejandro','Heather','Gwen','Duncan','Courtney','Owen','Izzy','Cody','Sierra','Lindsay','Harold','Leshawna','Noah','Bridgette','Geoff','Trent'];
  const cast = names.map((n, i) => {
    const p = roster.find(r => r.name === n);
    return { ...p, tribe: i % 2 ? 'Bass' : 'Gophers' };
  });
  const out = [];
  seededRun(() => runOneSeason({ romance: 'enabled' }, 16, cast), 4242);
  const hist = core.gs.episodeHistory;
  for (const ep of hist) {
    out.push(`\n===== EP ${ep.num} ${ep.isMerge ? 'MERGE' : ''} ${ep.isFinale ? 'FINALE' : ''} boot=${ep.eliminated || ''}`);
    const ce = ep.campEvents || {};
    for (const [camp, ph] of Object.entries(ce)) {
      for (const phase of ['pre', 'post']) {
        for (const e of (ph?.[phase] || [])) out.push(`[${camp}/${phase}] ${e.type} {${(e.players||[]).join(',')}} ${e.badgeText||''}\n   ${String(e.text||'').replace(/\n/g,' / ')}`);
      }
    }
    out.push('\n--- SUMMARY TEXT ---\n' + (ep.summaryText || ''));
  }
  fs.writeFileSync(process.env.OUT || 'C:/Users/yanna/AppData/Local/Temp/claude/C--Users-yanna-OneDrive-Documents-GitHub-dc-franchise-db/f7f29f73-9327-4226-ae09-e814093d722a/scratchpad/td-read.txt', out.join('\n'));
}, 300000);
