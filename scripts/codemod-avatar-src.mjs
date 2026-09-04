#!/usr/bin/env node
// Rewrites `assets/avatars/${X}.png` into a resolved URL wherever X came from a
// name-to-slug helper. Handles the shapes that cover the bulk of the call
// sites; anything left is printed for a human to look at.
//
//   node scripts/codemod-avatar-src.mjs js/chal/houston.js
//   node scripts/codemod-avatar-src.mjs --all js/chal
//
// A slug says WHO somebody is. It has never known which of their looks a season
// chose — it only appeared to, because the returnee variant was smuggled into
// the slug itself. So the identity locals are left exactly as they are (they
// are correct now that nothing mutates p.slug, and DOM ids downstream still
// want them) and a URL local is added beside them.
import fs from 'node:fs';
import path from 'node:path';

const LOCALS = '(sl|s|slug|sg|av)';
const NL = String.fromCharCode(10);

function transform(src, rel) {
  let out = src;
  const notes = [];
  // Idempotence. Steps 2 and 3 append a sibling declaration to a line they
  // match, and they still match it afterwards — so a second run over the same
  // file emits a duplicate `const slAv`, which is a redeclaration error rather
  // than a no-op. Never let the tool run twice over its own output.
  const already = new RegExp('const ' + LOCALS + 'Av = playerAvatarUrl\\(');

  // 1. `assets/avatars/${slug(EXPR)}.png` — the direct call
  out = out.replace(/assets\/avatars\/\$\{\s*(?:slug|slugOf|_slug)\(([^{}]*?)\)\s*\}\.png/g,
    (_m, expr) => '${playerAvatarUrl(' + expr.trim() + ')}');

  // 2. `const sl = slug(NAME);`
  if (!already.test(out)) out = out.replace(new RegExp('(\\n(\\s*))const\\s+' + LOCALS + '\\s*=\\s*(?:slug|slugOf|_slug)\\(([^;\\n]*?)\\);', 'g'),
    (m, ws, indent, v, expr) => m + ws + 'const ' + v + 'Av = playerAvatarUrl(' + expr.trim() + ');');

  // 3. the inlined one-liner: `const sl = players.find(...)?.slug || <fallback>;`
  if (!already.test(src)) out = out.replace(new RegExp('(\\n(\\s*))const\\s+' + LOCALS + '\\s*=\\s*\\(?players\\.find\\([^;\\n]*?\\)\\??\\.slug\\s*\\|\\|[^;\\n]*?;', 'g'),
    (m, ws, indent, v) => {
      const arg = m.match(/\.name\s*===\s*([^)]+)\)/);
      if (!arg) { notes.push(rel + ': could not read the name expression from ' + m.trim().slice(0, 80)); return m; }
      return m + ws + 'const ' + v + 'Av = playerAvatarUrl(' + arg[1].trim() + ');';
    });

  // Every producer of a slug local now also produces a URL local, so point the
  // image paths at the URL.
  out = out.replace(new RegExp('assets/avatars/\\$\\{\\s*' + LOCALS + '\\s*\\}\\.png', 'g'),
    (_m, v) => '${' + v + 'Av}');

  // A URL local nobody ended up using means that slug was for something else.
  const lines = out.split(NL);
  out = lines.filter(line => {
    const m = line.match(new RegExp('^\\s*const ' + LOCALS + 'Av = playerAvatarUrl\\('));
    if (!m) return true;
    return (out.match(new RegExp('\\b' + m[1] + 'Av\\b', 'g')) || []).length > 1;
  }).join(NL);

  // Anything still concatenating is a shape this tool does not know.
  out.split(NL).forEach((line, i) => {
    if (/assets\/avatars\/[^"'`]*\$\{/.test(line)) notes.push(rel + ':' + (i + 1) + ': MANUAL - ' + line.trim().slice(0, 110));
  });
  return { out, notes };
}

function ensureImport(src, rel) {
  const needs = ['playerAvatarUrl', 'portraitSlug'].filter(n => new RegExp('\\b' + n + '\\(').test(src));
  if (!needs.length) return src;
  const m = src.match(/import \{([^}]*)\} from ('\.{1,2}\/players\.js')/);
  if (m) {
    const list = m[1].split(',').map(s => s.trim()).filter(Boolean);
    for (const n of needs) if (!list.includes(n)) list.push(n);
    return src.replace(m[0], 'import { ' + list.join(', ') + ' } from ' + m[2]);
  }
  const depth = rel.includes('/chal/') || rel.includes('/vp-bb-sig/') ? '../' : './';
  return 'import { ' + needs.join(', ') + " } from '" + depth + "players.js';" + NL + src;
}

function run(file) {
  const rel = path.relative(process.cwd(), file).replace(/\\/g, '/');
  const raw = fs.readFileSync(file, 'utf8');
  if (!raw.includes('assets/avatars/')) return [];
  const crlf = raw.includes('\r' + NL);
  const src = raw.split('\r' + NL).join(NL);
  const { out, notes } = transform(src, rel);
  if (out !== src) {
    const final = ensureImport(out, rel);
    fs.writeFileSync(file, crlf ? final.split(NL).join('\r' + NL) : final);
    console.log('rewrote ' + rel);
  }
  return notes;
}

const args = process.argv.slice(2);
const targets = args[0] === '--all'
  ? fs.readdirSync(args[1]).filter(f => f.endsWith('.js')).map(f => path.join(args[1], f))
  : args;
const allNotes = targets.flatMap(run);
if (allNotes.length) {
  console.log(NL + '- needs a human (' + allNotes.length + ') -');
  allNotes.forEach(n => console.log('  ' + n));
}
