// Print a TD dialogue pool family as plain scripts, for reading and rewriting.
//   node tools/td-pool-dump.mjs <keyPrefix> [more prefixes...]
// Each entry with its key, id and gate (when), then its turns as "a: ..." / "(beat)" / "a [conf]: ...".
import { STORY_POOLS } from '../js/td/story/lines/index.js';
import { POOLS } from '../js/td/script/lines/index.js';

const prefixes = process.argv.slice(2);
for (const [src, pools] of [['story', STORY_POOLS], ['script', POOLS]]) for (const [key, list] of Object.entries(pools || {})) {
  if (!prefixes.some(p => key.startsWith(p))) continue;
  for (const e of list || []) {
    console.log(`\n### ${src} ${key} ${e.id || '?'}${e.when ? '  when ' + JSON.stringify(e.when) : ''}`);
    for (const t of e.turns || []) {
      if (t.beat) console.log(`  (${t.beat})`);
      else console.log(`  ${t.by}${t.conf ? ' [conf]' : ''}: ${t.say || t.conf || (t.move ? '<move ' + t.move + '>' : '')}${t.when ? '   when ' + JSON.stringify(t.when) : ''}`);
    }
  }
}
