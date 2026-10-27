// Two words the type checker (npm run typecheck:bb) cannot see, checked in the source instead.
//
// A viewer step's kind: `k: 'beat'` widens to a plain string the moment the
// step sits in a variable, so types/bb.d.ts types `k` as a string and this
// reads every `k:` the viewer writes against the six kinds screens.js draws.
//
// An archetype: the cast comes from `players` in core.js, which is untyped, so
// `arch === 'brainiac'` compiles. This reads every comparison against something
// named like an archetype, and every list that is mostly archetypes, against the
// fifteen that exist (CLAUDE.md, "Valid Archetypes").
import { describe, it, expect } from 'vitest';
import ts from 'typescript';
import fs from 'node:fs';
import path from 'node:path';

const STEP_KINDS = new Set(['beat', 'bb', 'host', 'say', 'dr', 'voice']);
const ARCHETYPES = new Set(['mastermind', 'schemer', 'hothead', 'challenge-beast', 'social-butterfly',
  'loyal-soldier', 'wildcard', 'chaos-agent', 'floater', 'underdog', 'hero', 'villain', 'goat',
  'perceptive-player', 'showmancer']);

const filesUnder = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(e =>
  e.isDirectory() ? filesUnder(path.join(dir, e.name)) : e.name.endsWith('.js') ? [path.join(dir, e.name)] : []);

function walk(file, visit) {
  const sf = ts.createSourceFile(file, fs.readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true);
  const at = n => `${file.split(path.sep).join('/')}:${sf.getLineAndCharacterOfPosition(n.getStart(sf)).line + 1}`;
  const go = n => { visit(n, at); ts.forEachChild(n, go); };
  go(sf);
}

const str = n => n && (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n)) ? n.text : null;

export function stepKindsIn(files) {
  const bad = [];
  for (const f of files) walk(f, (n, at) => {
    if (!ts.isObjectLiteralExpression(n)) return;
    const k = n.properties.find(p => ts.isPropertyAssignment(p) && p.name && ts.isIdentifier(p.name) && p.name.text === 'k');
    const hasText = n.properties.some(p => p.name && ts.isIdentifier(p.name) && p.name.text === 't');
    const v = k && str(k.initializer);
    if (v != null && hasText && !STEP_KINDS.has(v)) bad.push(`${at(n)} k: '${v}'`);
  });
  return bad;
}

export function archetypesIn(files) {
  const bad = [];
  const archish = n => /arch/i.test(n.getText());
  for (const f of files) walk(f, (n, at) => {
    if (ts.isBinaryExpression(n) && [ts.SyntaxKind.EqualsEqualsEqualsToken, ts.SyntaxKind.ExclamationEqualsEqualsToken,
      ts.SyntaxKind.EqualsEqualsToken, ts.SyntaxKind.ExclamationEqualsToken].includes(n.operatorToken.kind)) {
      for (const [side, other] of [[n.left, n.right], [n.right, n.left]]) {
        const v = str(other);
        if (v && !ts.isStringLiteral(side) && archish(side) && !ARCHETYPES.has(v)) bad.push(`${at(n)} ${n.getText()}`);
      }
    }
    if (ts.isArrayLiteralExpression(n) && n.elements.length >= 2) {
      const words = n.elements.map(str);
      if (words.some(w => w == null)) return;
      const known = words.filter(w => ARCHETYPES.has(w)).length;
      // two real archetypes at least: a register list ('cool', 'schemer') shares one word with them
      if (known >= 2 && known * 2 >= words.length) for (const w of words) if (!ARCHETYPES.has(w)) bad.push(`${at(n)} '${w}' in [${words.join(', ')}]`);
    }
  });
  return bad;
}

const BB = ['js/bb', 'js/bb-events', 'js/vp-bb-ep'].flatMap(filesUnder);

describe('words the type checker cannot see', () => {
  it('every viewer step is one of the six kinds the viewer draws', () => {
    expect(stepKindsIn(filesUnder('js/vp-bb-ep'))).toEqual([]);
  });

  it('every archetype the Big Brother code compares against exists', () => {
    expect(archetypesIn(BB)).toEqual([]);
  });

  it('would catch both (a guard that cannot fail is not one)', () => {
    const dir = fs.mkdtempSync(path.join(process.env.TMPDIR || process.env.TEMP || '.', 'bb-lit-'));
    const f = path.join(dir, 'x.js');
    fs.writeFileSync(f, [
      "const a = { k: 'sya', t: 'hello' };",
      "const b = arch === 'brainiac';",
      "const c = ['villain', 'mastermind', 'protector'].includes(arch);",
      "const ok = { k: 'say', t: 'hi' }, ok2 = arch === 'hero', ok3 = ['comp', 'veto', 'hero'];",
    ].join('\n'));
    try {
      expect(stepKindsIn([f])).toHaveLength(1);
      expect(archetypesIn([f])).toHaveLength(2);
    } finally { fs.rmSync(dir, { recursive: true, force: true }); }
  });
});
