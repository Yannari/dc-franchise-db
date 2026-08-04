// A competition must simulate the profile it declares.
//
// Every competition carries a `stats` object. It is not decoration: the
// competition screen draws it as weight bars, the Debug tab computes aptitude
// from it, and a reader deciding whether a houseguest is built for a
// competition is reading that and nothing else.
//
// The trap is writing the weights TWICE — once in `stats` for the surfaces and
// once inline in `simulate` for the maths. Two of them had already drifted:
//
//   Morph 'O' Matic declared mental .38 / intuition .26 / temperament .20 /
//   social .16 and simulated exactly that — until the profile was retuned, at
//   which point the screen said one thing and the engine did another.
//
//   Majority Rules declared 36/28/20/16 and had been simulating 40/30/18/12
//   for some time. Nothing failed, because nothing was comparing them.
//
// The fix in both cases is `aptitude(name, comp.stats)`, which reads the one
// declaration. This guards it at the source, because it is not observable from
// the outside: a competition running the wrong weights still produces a valid
// ranked result, and every other test in the suite passes.
import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const DIR = join(process.cwd(), 'js', 'bb-comps');

// A stat name multiplied by a decimal — `s.mental * 0.38` — which is what a
// second, hand-written copy of a profile looks like.
const INLINE_MIX = /\b[a-zA-Z_$][\w$]*\.(physical|endurance|mental|social|strategic|loyalty|boldness|intuition|temperament)\s*\*\s*0?\.\d+/g;

// Competitions whose phases genuinely need their own mixes, and why.
//
// Knockout is two different tests inside one competition: a buzzer race and a
// recall round, and a houseguest can be excellent at one and poor at the
// other. Collapsing both onto the headline profile would delete the thing that
// makes the duel interesting. The headline `stats` is an honest summary of the
// two, and the Debug tab reports it.
const PHASE_MIXES = new Set(['knockout.js']);

describe('a competition simulates the profile it declares', () => {
  const files = readdirSync(DIR).filter(f => f.endsWith('.js') && !f.startsWith('_') && f !== 'index.js');

  it('finds the competition sources', () => {
    expect(files.length).toBeGreaterThan(5);
  });

  for (const file of files) {
    it(`${file} does not hand-write a second stat mix`, () => {
      const src = readFileSync(join(DIR, file), 'utf8');
      // Comments explain profiles constantly; only code counts.
      const code = src
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .split('\n').filter(l => !l.trim().startsWith('//')).join('\n');
      const found = [...code.matchAll(INLINE_MIX)].map(m => m[0]);
      if (PHASE_MIXES.has(file)) {
        expect(found.length, `${file} is exempted but no longer has phase mixes`).toBeGreaterThan(0);
        return;
      }
      expect(found, `${file} restates stat weights inline — use aptitude(name, comp.stats)`).toEqual([]);
    });
  }
});
