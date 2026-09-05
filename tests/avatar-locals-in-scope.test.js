// ══════════════════════════════════════════════════════════════════════
// avatar-locals-in-scope.test.js — the codemod's locals are actually declared
// ══════════════════════════════════════════════════════════════════════
//
// Reported from the published site:
//
//     Uncaught ReferenceError: slAv is not defined
//         _nmShell  js/chal/night-at-museum.js:2537
//         rpBuildNMTitleCard
//         buildVPScreens
//
// The portrait codemod rewrote `assets/avatars/${sl}.png` into `${slAv}` and
// added `const slAv = playerAvatarUrl(...)` beside the slug it replaced. Where
// the slug came from a shape it did not recognise — here a ternary,
// `const sl = pName ? slug(pName) : ''` — it substituted the usage anyway and
// declared nothing.
//
// I checked for exactly that and the check was wrong: it asked whether the
// FILE declared the name, not whether the enclosing FUNCTION did.
// night-at-museum.js declares `slAv` in four other functions, so the file-wide
// question answered yes while the code threw. A guard that asks an easier
// question than the bug is the failure mode this repo already has a name for.
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const NL = String.fromCharCode(10);

function jsFiles(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) jsFiles(p, out);
    else if (e.name.endsWith('.js')) out.push(p);
  }
  return out;
}

/**
 * Block depth at the start of each line, from a scanner rather than a regex.
 *
 * A per-line regex cannot see a TEMPLATE LITERAL that spans lines, and this
 * codebase is full of them — one SVG puppet in hung-out-to-dry.js runs forty.
 * Its backtick never closed, the `${...}` braces inside were counted as
 * blocks, and it reported a local that was perfectly in scope. A guard that
 * cries wolf gets deleted, so this one scans: strings, template literals, the
 * `${}` expressions nested in them, and both kinds of comment.
 */
function depthByLine(src) {
  const depths = [0];
  let depth = 0;
  // A stack, because a `${}` inside a template can hold another template.
  const stack = [];                       // tpl | str | sq | line | block | expr
  const top = () => stack[stack.length - 1] || null;
  for (let i = 0; i < src.length; i++) {
    const c = src[i], n = src[i + 1];
    if (c === NL) {
      depths.push(depth);
      if (top() === 'line') stack.pop();
      continue;
    }
    const st = top();
    if (st === 'line') continue;
    if (st === 'block') { if (c === '*' && n === '/') { stack.pop(); i++; } continue; }
    if (st === 'str' || st === 'sq') {
      if (c === '\\') { i++; continue; }
      if ((st === 'str' && c === '"') || (st === 'sq' && c === "'")) stack.pop();
      continue;
    }
    if (st === 'tpl') {
      if (c === '\\') { i++; continue; }
      if (c === '`') { stack.pop(); continue; }
      if (c === '$' && n === '{') { stack.push('expr'); i++; }
      continue;
    }
    // Code — including inside a `${}`, which is code.
    if (c === '/' && n === '/') { stack.push('line'); i++; continue; }
    if (c === '/' && n === '*') { stack.push('block'); i++; continue; }
    if (c === '"') { stack.push('str'); continue; }
    if (c === "'") { stack.push('sq'); continue; }
    if (c === '`') { stack.push('tpl'); continue; }
    if (c === '{') { depth++; continue; }
    if (c === '}') {
      if (st === 'expr') { stack.pop(); continue; }   // closes ${...}, not a block
      depth--;
    }
  }
  return depths;
}

/**
 * Every `${nameAv}` use whose declaration is not in an enclosing block.
 *
 * A declaration governs a use when it appears earlier and its block has not
 * closed before the use is reached — which is what walking back while
 * tracking the lowest depth seen answers.
 */
function outOfScopeUses(src) {
  const lines = src.split(NL);
  const depths = depthByLine(src);
  const bad = [];
  lines.forEach((line, i) => {
    // EVERY local an <img src> interpolates, not only the `*Av` ones the
    // codemod named. The hand-finished sites got their own names — srcA,
    // winSrc, diverSrc — and the same scope mistake was available in each.
    for (const m of line.matchAll(/src="\$\{\s*(?:_?\w*[eE]sc\()?\s*(\w+)\s*\)?\s*\}"/g)) {
      const name = m[1];
      let floor = depths[i] ?? 0;
      let found = false;
      for (let j = i; j >= 0 && !found; j--) {
        floor = Math.min(floor, depths[j] ?? 0);
        if ((depths[j] ?? 0) > floor) continue;
        // A COMMA LIST DECLARES BOTH. `const srcA = f(a), srcB = f(b);` is one
        // statement and two declarations, and asking for `const srcB` finds
        // neither — which reported two perfectly good lines as crashes.
        if (/\b(?:const|let|var)\b/.test(lines[j])
          && new RegExp('\\b' + name + '\\s*=').test(lines[j])) found = true;
      }
      if (!found) bad.push((i + 1) + ': ' + line.trim().slice(0, 100));
    }
  });
  return bad;
}

describe('every avatar local the codemod introduced is declared where it is used', () => {
  it('has no out-of-scope uses anywhere in js/', () => {
    const offenders = [];
    for (const abs of jsFiles(path.join(ROOT, 'js'))) {
      const rel = path.relative(ROOT, abs).replace(/\\/g, '/');
      for (const hit of outOfScopeUses(fs.readFileSync(abs, 'utf8'))) {
        offenders.push(rel + ':' + hit);
      }
    }
    expect(offenders, 'these throw ReferenceError the moment the screen renders')
      .toEqual([]);
  });

  it('catches the bug that shipped, when it is put back', () => {
    // THE GUARD IS GUARDED. The first version asked whether the FILE declared
    // the name and passed against the live crash, so this proves the new one
    // actually fails on the shape that reached the published site.
    const src = [
      'function other() {',
      "  const slAv = playerAvatarUrl('x');",
      '  return `<img src="${slAv}">`;',
      '}',
      'function broken(pName) {',
      "  const sl = pName ? slug(pName) : '';",
      '  return `<img src="${slAv}" alt="${sl}">`;',
      '}',
    ].join(NL);
    const bad = outOfScopeUses(src);
    expect(bad.length, 'the scope-aware check did not catch the shipped bug').toBe(1);
    expect(bad[0]).toContain('7:');
  });

  it('does not flag a local declared in an enclosing block', () => {
    const src = [
      'function fine(name) {',
      '  const slAv = playerAvatarUrl(name);',
      '  if (name) {',
      '    return `<img src="${slAv}">`;',
      '  }',
      '  return `<b>${slAv}</b>`;',
      '}',
    ].join(NL);
    expect(outOfScopeUses(src)).toEqual([]);
  });

  it('is not fooled by a template literal that spans lines', () => {
    // The false positive that made the first scanner useless: forty lines of
    // SVG between the declaration and the use, with `${}` braces throughout.
    const src = [
      'function puppet(name, ropes) {',
      '  const slAv = playerAvatarUrl(name);',
      '  return `',
      '    <svg><path d="M48 82 Q64 76 80 82 Z"/></svg>',
      '    ${ropes ? `<i class="a"></i>` : \'\'}',
      '    <img src="${slAv}">',
      '  `;',
      '}',
    ].join(NL);
    expect(outOfScopeUses(src)).toEqual([]);
  });
});
