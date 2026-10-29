// Give a published season its villain board when it has none (js/villain-score.js), from the document alone.
//
// The user, 2026-10-29: "retroactively fix the published seasons that dont have a villain to add one or more it would
// be useful when doing house of villains later". The board is computed from what the published record holds (each
// show's own fields: Drag Race's storylines, The Circle's blocks and catfish, the votes and betrayals); a season
// already carrying a villain (a written award or a board) is left alone unless --all says otherwise.
//
//   node tools/backfill-villain-boards.mjs            the seasons with no villain at all
//   node tools/backfill-villain-boards.mjs --all      every season without a board, awards or not
//   node tools/backfill-villain-boards.mjs --dry      say what it would write
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { villainBoard } from '../js/villain-score.js';

const DIR = 'data/seasons';
const all = process.argv.includes('--all');
const dry = process.argv.includes('--dry');

const hasVillain = doc => !!doc.villainBoard
  || (!all && doc.awards && typeof doc.awards === 'object' && (doc.awards.biggestVillain || doc.awards.villainOfSeason || doc.awards.bestVillain));

for (const f of readdirSync(DIR).filter(x => x.endsWith('-data.json')).sort()) {
  const path = join(DIR, f);
  const raw = readFileSync(path, 'utf8');
  const doc = JSON.parse(raw);
  if (hasVillain(doc)) continue;
  const { board, read, sources } = villainBoard(doc);
  if (!board.length) { console.log(`${f}: nothing on the record to rank`); continue; }
  console.log(`${f}: ${board.slice(0, 3).map(r => `${r.name} ${r.score}`).join(', ')}${dry ? ' (dry)' : ''}`);
  if (dry) continue;
  doc.villainBoard = { read, sources: [...sources, 'a backfill of the published record'], board };
  // the file's own shape: indentation and line endings as found
  const indent = raw.match(/\n( +)"/)?.[1]?.length ?? 2;
  const eol = raw.includes('\r\n') ? '\r\n' : '\n';
  writeFileSync(path, JSON.stringify(doc, null, indent).replace(/\n/g, eol) + (raw.endsWith('\n') ? eol : ''));
}
