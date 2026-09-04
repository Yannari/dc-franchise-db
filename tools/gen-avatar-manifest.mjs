#!/usr/bin/env node
// Portrait catalog maintenance.
//
//   node tools/gen-avatar-manifest.mjs --check        validate the catalog
//   node tools/gen-avatar-manifest.mjs --write-files  regenerate available-files.json
//
// This tool NEVER invents catalog entries from filenames: a stable id and a
// human label cannot be guessed from `bowie-returnee.png`. Unregistered files
// are reported as informational candidates and nothing more.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const AVATAR_DIR = path.join(ROOT, 'assets/avatars');
const CATALOG = path.join(AVATAR_DIR, 'portrait-catalog.json');
const FILES_JSON = path.join(AVATAR_DIR, 'available-files.json');
const IMAGE_RE = /\.(png|webp|jpe?g|gif)$/i;

// The show list is read out of js/shows.js so this tool can never drift from it.
export function showKeys() {
  const src = fs.readFileSync(path.join(ROOT, 'js/shows.js'), 'utf8');
  const start = src.indexOf('export const SHOWS');
  const block = src.slice(start);
  const keys = [...block.matchAll(/^ {2}'?([a-z0-9-]+)'?:\s*\{/gm)].map(m => m[1]);
  if (!keys.length) throw new Error('could not read show keys from js/shows.js');
  return keys;
}

function unsafe(file) {
  return typeof file !== 'string' || !file
    || /[\\/]/.test(file) || file.includes('..') || file.includes(':')
    || file.startsWith('.') || !IMAGE_RE.test(file);
}

/**
 * @param {object} catalog
 * @param {Set<string>} availableFiles basenames present on disk
 * @param {Array<{playerSlug:string, avatarId:string, source:string}>} historicalRefs
 * @returns {Array<{code:string, player?:string, id?:string, message:string}>}
 */
export function validateCatalog(catalog, availableFiles, historicalRefs = [], shows = showKeys()) {
  const problems = [];
  const add = (code, message, extra = {}) => problems.push({ code, message, ...extra });
  const valid = new Set(['global', ...shows]);

  if (!catalog || typeof catalog !== 'object') { add('bad-catalog', 'catalog is not an object'); return problems; }
  if (catalog.schemaVersion !== 1) add('bad-schema-version', `schemaVersion must be 1, got ${catalog.schemaVersion}`);
  const players = catalog.players;
  if (!players || typeof players !== 'object') { add('bad-catalog', 'catalog.players missing'); return problems; }

  for (const [slug, entry] of Object.entries(players)) {
    const seen = new Set();
    const byId = new Map();
    const portraits = Array.isArray(entry?.portraits) ? entry.portraits : [];
    if (!portraits.length) add('no-portraits', `${slug} has no portraits`, { player: slug });

    for (const p of portraits) {
      if (!p || typeof p.id !== 'string' || !p.id) { add('bad-id', `${slug} has a portrait with no id`, { player: slug }); continue; }
      if (seen.has(p.id)) add('duplicate-id', `${slug} reuses portrait id "${p.id}"`, { player: slug, id: p.id });
      seen.add(p.id); byId.set(p.id, p);
      if (!valid.has(p.show)) add('unknown-show', `${slug}/${p.id} has unknown show "${p.show}"`, { player: slug, id: p.id });
      if (typeof p.label !== 'string' || !p.label.trim()) add('bad-label', `${slug}/${p.id} has no label`, { player: slug, id: p.id });
      if (unsafe(p.file)) add('unsafe-file', `${slug}/${p.id} has unsafe file "${p.file}"`, { player: slug, id: p.id });
      else if (!availableFiles.has(p.file)) add('missing-file', `${slug}/${p.id} points at missing file "${p.file}"`, { player: slug, id: p.id });
      else if (!/\.png$/i.test(p.file)) add('non-png', `${slug}/${p.id} uses ${p.file} — supported, but phase 1 ships png`, { player: slug, id: p.id });
    }

    const defaults = entry?.defaults || {};
    const g = byId.get(defaults.global);
    if (!g || g.show !== 'global') add('bad-global-default', `${slug} has no valid global default (got "${defaults.global}")`, { player: slug });
    for (const [key, id] of Object.entries(defaults)) {
      if (key === 'global') continue;
      if (!valid.has(key)) { add('unknown-show', `${slug} has a default for unknown show "${key}"`, { player: slug }); continue; }
      const d = byId.get(id);
      if (!d || (d.show !== key && d.show !== 'global')) {
        add('bad-show-default', `${slug} default for ${key} is "${id}", which is not a ${key} or global portrait`, { player: slug, id });
      }
    }
  }

  for (const ref of historicalRefs) {
    const entry = players[ref.playerSlug];
    const has = entry?.portraits?.some(p => p.id === ref.avatarId) || !!entry?.aliases?.[ref.avatarId];
    if (!has) add('deleted-historical-id', `${ref.source} references ${ref.playerSlug}/${ref.avatarId}, which the catalog no longer defines`, { player: ref.playerSlug, id: ref.avatarId });
  }
  return problems;
}

/** Every avatarId a saved season already committed to, so validation can protect it. */
export function collectHistoricalRefs(seasonsDir = path.join(ROOT, 'data/seasons')) {
  const refs = [];
  if (!fs.existsSync(seasonsDir)) return refs;
  for (const f of fs.readdirSync(seasonsDir).filter(n => n.endsWith('.json'))) {
    const src = path.join(seasonsDir, f);
    let doc; try { doc = JSON.parse(fs.readFileSync(src, 'utf8')); } catch { continue; }
    const seen = new Set();
    const walk = node => {
      if (Array.isArray(node)) return node.forEach(walk);
      if (!node || typeof node !== 'object') return;
      if (node.avatarId && (node.playerSlug || node.slug)) {
        const key = `${node.playerSlug || node.slug}/${node.avatarId}`;
        if (!seen.has(key)) { seen.add(key); refs.push({ playerSlug: node.playerSlug || node.slug, avatarId: node.avatarId, source: `data/seasons/${f}` }); }
      }
      Object.values(node).forEach(walk);
    };
    walk(doc);
  }
  return refs;
}

export function listAvailableFiles() {
  return fs.readdirSync(AVATAR_DIR).filter(f => IMAGE_RE.test(f)).sort();
}

function main() {
  const args = process.argv.slice(2);
  const files = listAvailableFiles();

  if (args.includes('--write-files')) {
    fs.writeFileSync(FILES_JSON, JSON.stringify({ generatedAt: new Date().toISOString(), files }, null, 2) + '\n');
    console.log(`wrote ${path.relative(ROOT, FILES_JSON)} (${files.length} files)`);
  }

  if (args.includes('--check') || args.length === 0) {
    const catalog = JSON.parse(fs.readFileSync(CATALOG, 'utf8'));
    const problems = validateCatalog(catalog, new Set(files), collectHistoricalRefs());
    const registered = new Set(Object.values(catalog.players).flatMap(e => (e.portraits || []).map(p => p.file)));
    const candidates = files.filter(f => !registered.has(f));
    if (candidates.length) console.log(`i ${candidates.length} unregistered file(s): ${candidates.slice(0, 10).join(', ')}${candidates.length > 10 ? ' ...' : ''}`);
    const errors = problems.filter(p => p.code !== 'non-png');
    problems.filter(p => p.code === 'non-png').forEach(p => console.log(`i ${p.message}`));
    if (errors.length) { errors.forEach(p => console.error(`x [${p.code}] ${p.message}`)); process.exit(1); }
    console.log(`ok portrait catalog valid - ${Object.keys(catalog.players).length} players, ${registered.size} portraits`);
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) main();
