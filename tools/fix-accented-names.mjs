// Rewrites accented player names to their ASCII form in any file (a simulator
// save JSON, an exported transcript, a pasted episode summary, etc.).
// Usage:  node tools/fix-accented-names.mjs <path-to-file> [...more files]
// Writes the result back in place. Add entries to NAME_FIXES as needed.
import { readFileSync, writeFileSync } from 'node:fs';

const NAME_FIXES = {
  'Rosa-María': 'Rosa-Maria',
  'Rosa María': 'Rosa Maria',
};

const files = process.argv.slice(2);
if (!files.length) {
  console.error('Usage: node tools/fix-accented-names.mjs <file> [...]');
  process.exit(1);
}

for (const f of files) {
  let s = readFileSync(f, 'utf8');
  let total = 0;
  for (const [from, to] of Object.entries(NAME_FIXES)) {
    const n = s.split(from).length - 1;
    if (n) { s = s.split(from).join(to); total += n; }
  }
  writeFileSync(f, s);
  console.log(`${f}: ${total} replacement(s)`);
}
