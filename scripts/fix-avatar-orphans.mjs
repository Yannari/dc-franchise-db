#!/usr/bin/env node
// Repair pass for the portrait codemod.
//
// The codemod substituted `assets/avatars/${sl}.png` with `${slAv}` on sight,
// including in files where the paired declaration had a shape it did not
// recognise — leaving a template referencing a variable nobody declares. That
// is a ReferenceError at render time, i.e. a blank screen, so it must not
// survive. This adds the missing declaration next to the slug it belongs to.
import fs from 'node:fs';

const NL = String.fromCharCode(10);

// How to read the player-name expression out of each declaration shape that
// actually occurs in this codebase.
const SHAPES = [
  [/^\s*const \w+ = \(?players\.find\([^)]*\.name\s*===\s*([^)]+)\)\)?\??\.slug/, 1],
  [/^\s*const \w+ = \(?cast\.find\([^)]*\.name\s*===\s*([^)]+)\)\)?\??\.slug/, 1],
  [/^\s*const \w+ = \w+\?\.slug\s*\|\|\s*(?:String\()?([\w.]+)\)?\.toLowerCase/, 1],
  [/^\s*const \w+ = [\w.]+\.slug\s*\|\|\s*([\w.]+)\.toLowerCase/, 1],
  [/^\s*const \w+ = \w+\s*\|\|\s*String\(([\w.]+)\)\.toLowerCase/, 1],
  [/^\s*const \w+ = ([\w.]+)\.toLowerCase\(\)\.replace/, 1],
];

let touched = 0;
for (const file of process.argv.slice(2)) {
  const raw = fs.readFileSync(file, 'utf8');
  const crlf = raw.includes('\r' + NL);
  const lines = raw.split('\r' + NL).join(NL).split(NL);
  const src = lines.join(NL);

  const used = new Set([...src.matchAll(/\$\{(\w+)Av\}/g)].map(m => m[1]));
  const declared = new Set([...src.matchAll(/const (\w+)Av\s*=/g)].map(m => m[1]));
  const orphans = [...used].filter(v => !declared.has(v));
  if (!orphans.length) { console.log('clean  ' + file); continue; }
  console.log('orphans in ' + file + ': ' + orphans.join(', '));

  const out = [];
  let added = 0;
  for (const line of lines) {
    out.push(line);
    const hit = orphans.find(v => line.trimStart().startsWith('const ' + v + ' ='));
    if (!hit) continue;
    let name = null;
    for (const [re, g] of SHAPES) {
      const m = line.match(re);
      if (m) { name = m[g].trim(); break; }
    }
    if (!name) { console.log('  ? no name expression: ' + line.trim().slice(0, 100)); continue; }
    out.push(line.match(/^\s*/)[0] + 'const ' + hit + 'Av = playerAvatarUrl(' + name + ');');
    added++;
  }
  if (added) {
    const text = out.join(NL);
    fs.writeFileSync(file, crlf ? text.split(NL).join('\r' + NL) : text);
    console.log('  fixed +' + added);
    touched++;
  }
}
console.log('files touched: ' + touched);
