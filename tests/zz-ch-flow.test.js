// Scratch: every aired conversation of a few seasons, with the replies that don't follow the line before.
import { it } from 'vitest';
import { writeFileSync } from 'node:fs';
import { setPlayers } from '../js/core.js';
import { playChallengeSeason } from '../js/ch/season.js';
import { airSeason } from '../js/ch/story/director.js';
import { challengeCast } from './helpers/ch-cast.js';

const words = t => (t.toLowerCase().match(/[a-z']+/g) || []).filter(w => w.length > 2);
it('flow', () => {
  const flags = [], convs = [];
  for (const seed of (process.env.CH_SEEDS || '5,9,21,33').split(',').map(Number)) {
    const { cast, names, background } = challengeCast(24, seed); setPlayers(cast);
    const r = playChallengeSeason({ cast: names, background, seed }); airSeason(r.state);
    for (const e of [...r.episodes, r.state.finalEp]) for (const a of e.aired || []) {
      const parts = a.kind === 'ceremony' ? [] : [a.script?.lines || []];
      for (const lines of parts) {
        const says = lines.filter(l => l.kind === 'say');
        if (says.length >= 2) convs.push(`-- ${a.kind} [${a.script?.lineId || ''}] s${seed} e${e.ep}\n` + lines.map(l => (l.kind === 'beat' ? `  (${l.text})` : l.kind === 'conf' ? `  ${l.by} [conf]: ${l.text}` : `  ${l.by}: ${l.text}`)).join('\n'));
        for (let i = 1; i < lines.length; i++) {
          const p = lines[i - 1], c = lines[i];
          if (c.kind !== 'say' || p.kind !== 'say' || p.by === c.by) continue;
          const id = `${a.script?.lineId || a.kind}:${i}`;
          // an echo: "Welcome back? ..." throws back words the line before never said
          const m = c.text.match(/^([A-Za-z' ,]{3,40})\?(\s|$)/);
          if (m && !/^(what|who|why|how|where|when|wait|really|seriously|me|you|huh|excuse me|are you|is that|did you|do you|can you|so|and|okay|sorry)\b/i.test(m[1])) {
            const echo = words(m[1]).filter(w => !['the', 'and', 'you', 'that', 'this'].includes(w));
            const prev = new Set(words(p.text));
            if (echo.length && echo.some(w => !prev.has(w))) flags.push(`ECHO ${id}\n    ${p.by}: ${p.text}\n    ${c.by}: ${c.text}`);
          }
          // a yes or a no to a line that asked nothing
          if (/^(yes|yeah|yep|no|nope|nah)\b[.!,]/i.test(c.text) && !/\?/.test(p.text) && !/\b(right|deal|promise|swear)\b/i.test(p.text))
            flags.push(`YES/NO ${id}\n    ${p.by}: ${p.text}\n    ${c.by}: ${c.text}`);
        }
      }
    }
  }
  writeFileSync('transcripts/ch-flow-flags.txt', [...new Set(flags)].join('\n'));
  writeFileSync('transcripts/ch-flow-convs.txt', convs.join('\n'));
  console.log('flags', new Set(flags).size, 'conversations', convs.length);
});
