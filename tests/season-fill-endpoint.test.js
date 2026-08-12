// Committing a wiki fill straight to the season document.
//
// The workflow this replaces: run the character fill, get season14-data.json;
// run the game history fill, get a second season14-data.json with none of the
// first one's work; merge them by hand; upload; wait for the sync. Twice.
//
// The fix is that the browser sends only what the fill PRODUCED and the merge
// happens against the repo file. So the property that matters here is that two
// fills in either order both survive — which is exactly what hand-merging was
// compensating for.
import { beforeEach, describe, expect, it, vi } from 'vitest';

// The worker imports the show registry for real; everything that touches
// GitHub is faked, because what is under test is the merge.
const SEASON = {
  seasonNumber: 14,
  title: 'Total Drama: Carnival of Chaos',
  placements: [
    { placement: 1, name: 'Jade', story: 'do not touch' },
    { placement: 2, name: 'Benji' },
  ],
  votingHistory: [{ episode: 2, eliminated: 'Amelie' }],
};

let repo;          // the "repo": path -> parsed document
let commits;       // every commit message, in order

vi.mock('../js/shows.js', async (orig) => await orig());

async function loadWorker() {
  // The worker is an ES module with a default export; its GitHub helpers read
  // env, so a fake env with a fetch stub is enough to exercise the route.
  const mod = await import('../worker/worker-studio.js');
  return mod.default;
}

/** A fetch that answers only the GitHub contents API, from `repo`. */
function githubStub() {
  return vi.fn(async (url, opts = {}) => {
    const u = String(url);
    const m = u.match(/\/contents\/([^?]+)/);
    const path = m ? decodeURIComponent(m[1]) : '';
    const method = (opts.method || 'GET').toUpperCase();

    if (method === 'GET') {
      if (!(path in repo)) return new Response('{}', { status: 404 });
      const content = Buffer.from(JSON.stringify(repo[path], null, 2) + '\n').toString('base64');
      return new Response(JSON.stringify({ content, sha: 'sha-' + path }), { status: 200 });
    }
    if (method === 'PUT') {
      const body = JSON.parse(opts.body);
      commits.push(body.message);
      repo[path] = JSON.parse(Buffer.from(body.content, 'base64').toString('utf8'));
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    }
    return new Response('{}', { status: 500 });
  });
}

const ENV = { GITHUB_TOKEN: 'x', GITHUB_REPO: 'Yannari/dc-franchise-db' };

async function post(worker, body) {
  const req = new Request('https://dc-studio.test/api/season-fill', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const res = await worker.fetch(req, ENV, {});
  return { status: res.status, json: await res.json() };
}

describe('committing a wiki fill', () => {
  let worker;
  beforeEach(async () => {
    repo = { 'data/seasons/season14-data.json': JSON.parse(JSON.stringify(SEASON)) };
    commits = [];
    global.fetch = githubStub();
    worker = await loadWorker();
  });

  it('writes personality, quotes and trivia onto the right player', async () => {
    const { status, json } = await post(worker, { seasonNumber: 14, format: 'total-drama',
      players: [{ name: 'Jade', personality: 'Watchful.',
        quotes: [{ text: 'A clown attacked me.', context: 'confessional' }],
        trivia: ['Tested Benji with fake information.'] }] });
    expect(status).toBe(200);
    expect(json.players).toEqual(['Jade']);
    const jade = repo['data/seasons/season14-data.json'].placements.find(p => p.name === 'Jade');
    expect(jade.personality).toBe('Watchful.');
    expect(jade.quotes[0].text).toBe('A clown attacked me.');
    // Everything the fill does not own is left exactly as it was.
    expect(jade.story).toBe('do not touch');
  });

  // THE BUG THIS ENDPOINT EXISTS FOR.
  it('keeps both fills when they run one after the other', async () => {
    await post(worker, { seasonNumber: 14, format: 'total-drama',
      players: [{ name: 'Jade', personality: 'Watchful.' }] });
    await post(worker, { seasonNumber: 14, format: 'total-drama',
      gameHistory: [{ n: 2, word: 'Episode', title: 'Amelie Spiraled', prose: 'Red struggled.' }] });

    const doc = repo['data/seasons/season14-data.json'];
    expect(doc.placements.find(p => p.name === 'Jade').personality).toBe('Watchful.');
    expect(doc.gameHistory[0].title).toBe('Amelie Spiraled');
  });

  it('keeps both fills in the other order too', async () => {
    await post(worker, { seasonNumber: 14, format: 'total-drama',
      gameHistory: [{ n: 2, prose: 'Red struggled.' }] });
    await post(worker, { seasonNumber: 14, format: 'total-drama',
      players: [{ name: 'Jade', personality: 'Watchful.' }] });

    const doc = repo['data/seasons/season14-data.json'];
    expect(doc.placements.find(p => p.name === 'Jade').personality).toBe('Watchful.');
    expect(doc.gameHistory[0].prose).toBe('Red struggled.');
  });

  it('merges rounds by number and never blanks a written one', async () => {
    await post(worker, { seasonNumber: 14, format: 'total-drama',
      gameHistory: [{ n: 2, prose: 'First pass.' }, { n: 3, prose: 'Also first pass.' }] });
    // A later run where episode 3 was never written: an empty entry must not
    // replace the prose that is already there.
    await post(worker, { seasonNumber: 14, format: 'total-drama',
      gameHistory: [{ n: 2, prose: 'Second pass.' }, { n: 3, prose: '' }] });

    const rounds = repo['data/seasons/season14-data.json'].gameHistory;
    expect(rounds.map(r => r.n)).toEqual([2, 3]);
    expect(rounds.find(r => r.n === 2).prose).toBe('Second pass.');
    expect(rounds.find(r => r.n === 3).prose).toBe('Also first pass.');
  });

  it('reports a name the season does not have instead of adding them', async () => {
    const { json } = await post(worker, { seasonNumber: 14, format: 'total-drama',
      players: [{ name: 'Nobody', personality: 'Invented.' }] });
    expect(json.unknown).toEqual(['Nobody']);
    expect(repo['data/seasons/season14-data.json'].placements.length).toBe(2);
  });

  it('refuses a season that was never exported rather than creating one', async () => {
    const { status, json } = await post(worker, { seasonNumber: 99, format: 'total-drama',
      players: [{ name: 'Jade', personality: 'x' }] });
    expect(status).toBe(400);
    expect(json.error).toMatch(/no season document/);
    expect(commits.length).toBe(0);
  });

  it('refuses a show the registry does not know, rather than guessing a filename', async () => {
    const { status, json } = await post(worker, { seasonNumber: 1, format: 'not-a-show',
      players: [{ name: 'Jade', personality: 'x' }] });
    expect(status).toBe(400);
    expect(json.error).toMatch(/unknown season format/);
  });

  it('namespaces a Big Brother season instead of writing over Total Drama', async () => {
    repo['data/seasons/bb-1-data.json'] = { placements: [{ placement: 1, name: 'Wayne' }] };
    const { json } = await post(worker, { seasonNumber: 1, format: 'big-brother',
      players: [{ name: 'Wayne', personality: 'Quiet.' }] });
    expect(json.path).toBe('data/seasons/bb-1-data.json');
    expect(repo['data/seasons/season14-data.json'].placements[0].personality).toBeUndefined();
  });

  it('says what it did in the commit message', async () => {
    await post(worker, { seasonNumber: 14, format: 'total-drama',
      players: [{ name: 'Jade', personality: 'x' }, { name: 'Benji', personality: 'y' }] });
    expect(commits[0]).toMatch(/season 14: wiki fill \(2 players, 0 rounds\)/);
  });

  it('rejects an empty request', async () => {
    const { status, json } = await post(worker, { seasonNumber: 14, format: 'total-drama' });
    expect(status).toBe(400);
    expect(json.error).toMatch(/nothing to fill/);
  });
});

// ── A RE-EXPORT MUST NOT DELETE THE PROSE ───────────────────────────────
//
// A season document holds two kinds of thing. The derived half comes out of the
// simulator on every export. The authored half is written once by the wiki fill
// from the episode screenplays, which live in one browser's IndexedDB — so if a
// publish overwrites it, the only copy is gone and has to be paid for again.
//
// The export template contains none of the authored fields, because the export
// has never known about them. Publishing a re-export over a filled season would
// therefore have wiped every one of them.
describe('publishing over a filled season', () => {
  let worker;
  const FILLED = {
    seasonNumber: 14,
    placements: [
      { placement: 1, name: 'Jade', playerSlug: 'jade',
        personality: 'Watchful.', quotes: [{ text: 'A clown attacked me.', context: 'x' }],
        trivia: ['Tested Benji.'] },
      { placement: 2, name: 'Benji', playerSlug: 'benji', personality: 'Leaks.' },
    ],
    gameHistory: [{ n: 2, prose: 'Red struggled.' }],
    twists: [{ id: 'rescue-island', name: 'Rescue Island', episodes: [2] }],
  };
  /** What an export produces: the same season, none of the authored fields. */
  const FRESH = {
    seasonNumber: 14,
    placements: [
      { placement: 1, name: 'Jade', playerSlug: 'jade', challengeWins: 3 },
      { placement: 2, name: 'Benji', playerSlug: 'benji', challengeWins: 1 },
    ],
  };

  beforeEach(async () => {
    repo = { 'data/seasons/season14-data.json': JSON.parse(JSON.stringify(FILLED)) };
    commits = [];
    global.fetch = githubStub();
    worker = await loadWorker();
  });

  async function publish(season) {
    const req = new Request('https://dc-studio.test/api/publish-season', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ seasonNumber: 14, format: 'total-drama', season }),
    });
    const res = await worker.fetch(req, ENV, {});
    return { status: res.status, json: await res.json().catch(() => null) };
  }

  it('keeps personality, quotes, trivia, game history and twists', async () => {
    await publish(JSON.parse(JSON.stringify(FRESH)));
    const doc = repo['data/seasons/season14-data.json'];
    const jade = doc.placements.find(p => p.name === 'Jade');
    expect(jade.personality).toBe('Watchful.');
    expect(jade.quotes[0].text).toBe('A clown attacked me.');
    expect(jade.trivia[0]).toBe('Tested Benji.');
    expect(doc.gameHistory[0].prose).toBe('Red struggled.');
    expect(doc.twists[0].name).toBe('Rescue Island');
    // And the export's own half did land.
    expect(jade.challengeWins).toBe(3);
  });

  it('lets a fresh value win, because a new fill is meant to replace an old one', async () => {
    const fresh = JSON.parse(JSON.stringify(FRESH));
    fresh.placements[0].personality = 'Rewritten.';
    fresh.gameHistory = [{ n: 2, prose: 'Rewritten prose.' }];
    fresh.twists = [{ id: 'double', name: 'Double Elimination', episodes: [9] }];
    await publish(fresh);
    const doc = repo['data/seasons/season14-data.json'];
    expect(doc.placements[0].personality).toBe('Rewritten.');
    expect(doc.gameHistory[0].prose).toBe('Rewritten prose.');
    expect(doc.twists[0].name).toBe('Double Elimination');
  });

  it('carries nothing for somebody who was not in the old cast', async () => {
    const fresh = JSON.parse(JSON.stringify(FRESH));
    fresh.placements.push({ placement: 3, name: 'Newcomer', playerSlug: 'newcomer' });
    await publish(fresh);
    const row = repo['data/seasons/season14-data.json'].placements.find(p => p.name === 'Newcomer');
    expect(row.personality).toBeUndefined();
  });

  it('publishes a season that was never filled without inventing fields', async () => {
    repo['data/seasons/season14-data.json'] = { seasonNumber: 14, placements: [{ placement: 1, name: 'Jade' }] };
    await publish(JSON.parse(JSON.stringify(FRESH)));
    const doc = repo['data/seasons/season14-data.json'];
    expect(doc.gameHistory).toBeUndefined();
    expect(doc.placements[0].personality).toBeUndefined();
  });
});
