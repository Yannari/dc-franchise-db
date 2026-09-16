// ══════════════════════════════════════════════════════════════════════
// tests/dr-config-reach.test.js — every option the engine reads is passed
// ══════════════════════════════════════════════════════════════════════
//
// The Reunion and "Two winners allowed" had checkboxes, were saved, and did
// nothing: js/dr/season.js read `config.drReunion` / `config.drDoubleCrown`
// and `_config()` in js/dr-run.js never passed them. The Smackdown was the
// same bug once before. This reads both files and fails on the next one.
import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const engineKeys = () => {
  const keys = new Set();
  const walk = dir => {
    for (const f of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, f.name);
      if (f.isDirectory()) walk(p);
      else if (f.name.endsWith('.js')) {
        for (const m of readFileSync(p, 'utf8').matchAll(/\bconfig\.(dr[A-Za-z]+)/g)) keys.add(m[1]);
      }
    }
  };
  walk('js/dr');
  return [...keys];
};

describe('the played season', () => {
  it('passes every drX option the engine reads', () => {
    const run = readFileSync('js/dr-run.js', 'utf8');
    const start = run.indexOf('function _config()');
    const body = run.slice(start, run.indexOf('\nfunction ', start + 10));
    const missing = engineKeys().filter(k => !new RegExp(String.raw`\b${k}\s*:`).test(body));
    expect(missing, 'read by js/dr but never passed by _config() in js/dr-run.js').toEqual([]);
  });

  it('the reunion and two-winner checkboxes are among them', () => {
    const run = readFileSync('js/dr-run.js', 'utf8');
    expect(run).toMatch(/drReunion:\s*!!seasonConfig\.drReunion/);
    expect(run).toMatch(/drDoubleCrown:\s*!!seasonConfig\.drDoubleCrown/);
  });
});
