// Re-measure the delivery marker counts in js/social/voices.js and write them
// back.
//
// The counts are rarity weights — traitRanking takes the RAREST marker a
// profile matches, so a stale one misranks that trait for everybody, and
// tests/social-voices.test.js fails when they drift. That guard is right to
// exist. What was wrong was the maintenance: the numbers drifted four times in
// a single session, every time because somebody edited a VOICE in the Studio,
// and each fix was a hand-edited integer. A chore that mechanical should not
// be done by hand, because the hand eventually just edits the guard.
//
//   npm run fix:social-counts
//
// Prints what moved, writes nothing if nothing did.
import fs from 'node:fs';
import { DELIVERY } from '../js/social/voices.js';

const SRC = 'js/social/voices.js';
const profiles = Object.values(JSON.parse(fs.readFileSync('voice-profiles.json', 'utf8')).profiles);
let source = fs.readFileSync(SRC, 'utf8');
const moved = [];

for (const [trait, [re, claimed]] of Object.entries(DELIVERY)) {
  const actual = profiles.filter(d => re.test(String(d).toLowerCase())).length;
  if (actual === claimed) continue;

  // Anchored on the trait name and its closing "], " so a number that happens
  // to appear inside a pattern cannot be rewritten by accident.
  const line = new RegExp(`(^\\s*${trait}:\\s*\\[/.*/,\\s*)${claimed}(\\])`, 'm');
  if (!line.test(source)) {
    console.error(`could not find the ${trait} line — left alone`);
    continue;
  }
  source = source.replace(line, `$1${actual}$2`);
  moved.push(`${trait} ${claimed} -> ${actual}`);
}

if (!moved.length) {
  console.log('marker counts are current — nothing to write.');
} else {
  fs.writeFileSync(SRC, source);
  console.log(`re-measured ${moved.length}:`);
  for (const m of moved) console.log('  ' + m);
}
