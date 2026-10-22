// sw.js, the smart cache: a new deploy's copy must hold every module the new
// deploy's pages import, not only the files this browser loaded before.
//
// Found 2026-10-22 on the Cloudflare site: the copy being served had an old
// franchise-calendar.js, and air-watch.js (a newer file the copy never held)
// came from the live deploy and imported `projectedRun`, which the old file
// does not export. The simulator never started.
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const SCOPE = 'https://site.test/';
const SRC = readFileSync(join(process.cwd(), 'sw.js'), 'utf8');

function fakeCaches() {
  const store = new Map();
  const open = async name => {
    if (!store.has(name)) store.set(name, new Map());
    const m = store.get(name);
    const key = r => (typeof r === 'string' ? r : r.url);
    return {
      put: async (r, res) => { m.set(key(r), res); },
      match: async r => m.get(key(r)),
      keys: async () => [...m.keys()].map(url => ({ url })),
    };
  };
  return { store, api: { open, keys: async () => [...store.keys()], delete: async n => store.delete(n) } };
}

const basic = (body, status = 200) => {
  const res = new Response(status === 404 ? null : body, { status });
  Object.defineProperty(res, 'type', { value: 'basic' });
  return res;
};

/** The worker's own functions, run against a fake site. */
function boot(site) {
  const { store, api } = fakeCaches();
  const fetch = async u => {
    const url = new URL(typeof u === 'string' ? u : u.url ?? String(u));
    if (url.pathname === '/deploy.json') return basic(JSON.stringify({ sha: site.stamp() }));
    const body = site.files[url.pathname.slice(1)];
    return body == null ? basic('', 404) : basic(body);
  };
  const self = { location: new URL(SCOPE + 'sw.js'), registration: { scope: SCOPE }, addEventListener() {}, clients: { matchAll: async () => [] } };
  const fns = new Function('self', 'caches', 'fetch', `${SRC}\nreturn { downloadDeploy, markComplete };`)(self, api, fetch);
  return { ...fns, store, api };
}

async function seed(w, name, files) {
  const c = await w.api.open(name);
  for (const [path, body] of Object.entries(files)) await c.put(SCOPE + path, basic(body));
  await w.markComplete(name);
}

const text = async (w, name, path) => {
  const r = await w.store.get(name)?.get(SCOPE + path);
  return r ? r.clone().text() : null;
};

describe('a new deploy downloads behind the page', () => {
  it('fetches the files the new deploy imports, though the old copy never held them', async () => {
    const files = {
      'simulator.html': '<script type="module" src="js/main.js"></script><link rel="stylesheet" href="css/site.css">',
      'js/main.js': "import { a } from './air-watch.js';\nimport './side.js';\nconst lazy = () => import('./lazy/view.js');\nimport { x } from 'https://cdn.test/x.js';",
      'js/air-watch.js': "import { projectedRun } from './franchise-calendar.js';\nexport { projectedRun as a } from '../js/shared/util.js';",
      'js/franchise-calendar.js': 'export function projectedRun() {}',
      'js/side.js': '',
      'js/lazy/view.js': "import { b } from '../air-watch.js';",
      'js/shared/util.js': '',
      'css/site.css': 'body{}',
    };
    const w = boot({ files, stamp: () => 'abc1234' });
    // What this browser loaded the last time: the page and two scripts.
    await seed(w, 'dc-site-old', { 'simulator.html': 'old', 'js/main.js': 'old', 'js/franchise-calendar.js': 'old' });

    expect(await w.downloadDeploy('abc1234', 'dc-site-old')).toBe(true);
    for (const path of Object.keys(files)) expect(await text(w, 'dc-site-abc1234', path), path).toBe(files[path]);
    // Never another origin, and never a bare specifier read as a path.
    expect([...w.store.get('dc-site-abc1234').keys()].every(u => u.startsWith(SCOPE))).toBe(true);
  });

  it('a deploy that lands during the download leaves the copy incomplete', async () => {
    let stamp = 'abc1234';
    const files = { 'simulator.html': '<script type="module" src="js/main.js"></script>', 'js/main.js': '' };
    const w = boot({ files, stamp: () => stamp });
    await seed(w, 'dc-site-old', { 'simulator.html': 'old' });
    const job = w.downloadDeploy('abc1234', 'dc-site-old');
    stamp = 'def5678';
    expect(await job).toBe(false);
    expect(w.store.has('dc-site-abc1234')).toBe(false);
  });
});
