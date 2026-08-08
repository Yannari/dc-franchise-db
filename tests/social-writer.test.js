// The gate between a model and the episode record.
//
// A free-writing model plus a validator that hunts for invented history is an
// arms race the model wins — it produces plausible weeks faster than anybody
// can enumerate rejections, and every one reads correctly. So fabrication is
// made impossible upstream instead: the packet carries a CLOSED SET of receipts
// with ids, a post must cite one, and this file checks the cheap decidable
// things — is that id real, does every name belong to somebody, is every week
// a week a receipt actually names.
//
// The other half is that none of it may ever block a season. Templates are not
// a degraded mode, they are the floor: no key, no network, a timeout, a refusal
// or a batch that fails validation all produce the feed the simulator produced
// yesterday.
import fs from 'node:fs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { gs, players, seasonConfig, relationships, setRelationships } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, getPerceivedBond, bKey, bondLabel } from '../js/bonds.js';
import { validatePost, acceptPosts } from '../js/social/validator.js';
import { buildPacket, requestPosts, writeCrowd, writerEndpoint } from '../js/social/writer.js';
import { withReceipts } from '../js/social/receipts.js';
import { seedGame } from './helpers/setup.js';

const STAT_KEYS = ['physical', 'endurance', 'mental', 'social', 'strategic',
  'loyalty', 'boldness', 'intuition', 'temperament'];
const spread = n => Object.fromEntries(STAT_KEYS.map((k, i) => [k, 1 + ((n * 7 + i * 3) % 10)]));
const NAMES = ['Logan', 'Anastasia', 'Jade', 'Spencer', 'Benji', 'Wayne',
  'Iris', 'Kit', 'Millie', 'Caleb', 'Axel', 'Zee'];
const CAST = NAMES.map((name, i) => ({ name, archetype: 'floater', gender: i % 2 ? 'f' : 'm',
  sexuality: 'straight', stats: spread(i + 1) }));

function house() {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns,
    ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
  globalThis.gs = gs; globalThis.players = players;
  Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3 });
  gs.bb = { weeks: [], stats: {} };
  gs.bondLean = {}; gs.sideDeals = [];
  setRelationships([]);
}

const PACKET = {
  event: { kind: 'nomination', subject: 'logan', actor: 'anastasia', season: 1, episode: 4 },
  receipts: [
    { id: 'deal-broken', text: 'Anastasia broke a deal with Logan', week: 2 },
    { id: 'kept-them', text: 'Logan kept Anastasia off the block in week 1', week: 1 },
  ],
  cast: NAMES,
  maxLength: 280,
  register: 'post',
  requireCite: true,
};

const ok = (text, extra = {}) => validatePost(text, PACKET, extra);

beforeEach(() => house());

describe('it cannot say something that did not happen', () => {
  it('takes a post that points at a real receipt', () => {
    const v = ok('not Anastasia doing that after she broke a deal with him', { cites: ['deal-broken'] });
    expect(v.reasons).toEqual([]);
    expect(v.ok).toBe(true);
  });

  it('lets a pure reaction through, because most of a timeline is one', () => {
    // Requiring EVERY post to cite was wrong, and a live batch proved it:
    // "logan did not deserve this im actually sick" cites nothing and is a
    // perfect post. Demanding a footnote for a scream returned a crowd of
    // nought.
    expect(ok('logan did not deserve this im actually sick', { cites: [] }).ok).toBe(true);
    // A room where somebody is making an ARGUMENT can still demand one.
    expect(validatePost('this has been coming since the start',
      { ...PACKET, strictCite: true }, { cites: [] }).reasons).toContain('cites-nothing');
  });

  it('refuses a receipt id that is not in the packet', () => {
    const v = ok('she owed him after all that', { cites: ['secret-alliance'] });
    expect(v.reasons).toContain('cites-unknown:secret-alliance');
  });

  it('refuses a houseguest who does not exist', () => {
    // The most convincing kind of fabrication: a name, in a real sentence.
    const v = ok('Anastasia and Marcus planned this together', { cites: ['deal-broken'] });
    expect(v.reasons).toContain('invented-name:Marcus');
    expect(ok('Anastasia and Jade planned this', { cites: ['deal-broken'] }).ok).toBe(true);
  });

  it('refuses a week nothing happened in', () => {
    // Inventing a date is the single most convincing way to invent a history.
    expect(ok('after what she did in week 6', { cites: ['deal-broken'] }).reasons)
      .toContain('invented-week:6');
    // The weeks the receipts name are fine.
    expect(ok('after what she did in week 2', { cites: ['deal-broken'] }).ok).toBe(true);
  });

  it('does not mistake shouting for a name', () => {
    // An all-caps post would otherwise read as a wall of invented houseguests.
    const v = ok('GET HIM ANASTASIA SHE BROKE THAT DEAL', { cites: ['deal-broken'] });
    expect(v.reasons.filter(r => r.startsWith('invented-name'))).toEqual([]);
  });
});

describe('it has to sound like a person', () => {
  it('refuses the openings of somebody who had nothing to say', () => {
    for (const dead of [
      'In a shocking turn of events, Anastasia has nominated him.',
      "Let's talk about what this means for the game.",
      "It's no secret that this house has a numbers problem.",
      'In tonight\'s episode we saw a nomination that changes everything.',
    ]) {
      expect(ok(dead, { cites: ['deal-broken'] }).reasons, dead).toContain('dead-opening');
    }
  });

  it('lets a fandom be unkind, because that is the register', () => {
    // "Spencer is so annoying" is not a failure. The prohibitions are narrow
    // on purpose and are about a person rather than a player.
    expect(ok('Anastasia is so annoying and she broke that deal', { cites: ['deal-broken'] }).ok).toBe(true);
    // A timeline talks ABOUT people, so the common form is the third person.
    for (const vile of [
      'Anastasia should kill herself',
      'she should just die honestly',
      'hope she dies',
      'someone find her home address',
      'her kids should be ashamed',
    ]) {
      expect(ok(vile, { cites: ['deal-broken'] }).reasons, vile).toContain('prohibited');
    }
  });

  it('holds a scream to a scream length', () => {
    const scream = { ...PACKET, register: 'scream', requireCite: false };
    expect(validatePost('GET HIM ANASTASIA', scream).ok).toBe(true);
    expect(validatePost(
      'I really do think that this particular nomination changes the whole shape of the week',
      scream).reasons).toContain('not-a-scream');
  });

  it('refuses a leaked slot and an overlong post', () => {
    expect(ok('not {subject} doing that', { cites: ['deal-broken'] }).reasons).toContain('leaked-slot');
    expect(ok(`${'a'.repeat(300)} deal`, { cites: ['deal-broken'] }).reasons).toContain('too-long');
  });
});

describe('a crowd is not one person', () => {
  it('refuses what somebody already said', () => {
    const line = 'not Anastasia doing that after the deal she broke';
    expect(validatePost(line, PACKET, { approved: [line], cites: ['deal-broken'] }).reasons)
      .toContain('duplicate');
  });

  it('refuses the same sentence with two words moved', () => {
    // A model handed the same packet twice rewrites rather than rethinks.
    const a = 'not Anastasia doing that to Logan after she broke their deal honestly';
    const b = 'honestly not Anastasia doing that to Logan after she broke their deal';
    expect(validatePost(b, PACKET, { approved: [a], cites: ['deal-broken'] }).reasons)
      .toContain('near-duplicate');
  });

  it('catches duplicates inside one batch, not just against the store', () => {
    const line = 'she broke that deal and now this';
    const { kept, rejected } = acceptPosts(
      [{ text: line, cites: ['deal-broken'] }, { text: line, cites: ['deal-broken'] }], PACKET);
    expect(kept.length).toBe(1);
    expect(rejected[0].reasons).toContain('duplicate');
  });
});

describe('the packet is the contract', () => {
  it('carries the receipts, the cast and nothing else', () => {
    gs.bb.weeks = [{
      num: 1, hoh: 'Anastasia', initialNominees: ['Logan'],
      allianceChanges: { betrayals: [{ voter: 'Anastasia', victim: 'Logan', known: false }] },
    }];
    const ev = withReceipts({ kind: 'nomination', subject: 'logan', actor: 'anastasia',
      season: 1, episode: 3, at: 0 }, { upTo: 3 });
    const packet = buildPacket(ev, { cast: NAMES, stream: 'timeline', count: 6 });
    expect(packet.cast).toEqual(NAMES);
    expect(packet.receipts.length).toBeGreaterThan(0);
    for (const r of packet.receipts) {
      expect(r).toHaveProperty('id');
      expect(r).toHaveProperty('text');
    }
    expect(packet.requireCite).toBe(true);
    expect(packet.maxLength).toBeGreaterThan(0);
    // A packet with no history does not demand a citation there is nothing to make.
    const bare = buildPacket({ kind: 'nomination', subject: 'logan', actor: 'zee' }, { cast: NAMES });
    expect(bare.requireCite).toBe(false);
  });
});

describe('it never blocks a season', () => {
  const event = () => {
    gs.bb.weeks = [{ num: 1, hoh: 'Anastasia', initialNominees: ['Logan'],
      allianceChanges: { betrayals: [{ voter: 'Anastasia', victim: 'Logan', known: false }] } }];
    return withReceipts({ kind: 'nomination', subject: 'logan', actor: 'anastasia',
      season: 1, episode: 3, at: 0 }, { upTo: 3 });
  };

  it('uses templates when there is no endpoint at all', async () => {
    const out = await writeCrowd(event(), { count: 6, cast: NAMES, endpoint: null });
    expect(out.source).toBe('template');
    expect(out.posts.length).toBe(6);
    for (const p of out.posts) expect(p.text).toBeTruthy();
  });

  it('uses templates when the network is down', async () => {
    const boom = vi.fn().mockRejectedValue(new Error('offline'));
    const out = await writeCrowd(event(), { count: 6, cast: NAMES,
      endpoint: 'https://x.test', fetchImpl: boom });
    expect(out.source).toBe('template');
    expect(out.posts.length).toBe(6);
  });

  it('uses templates when the worker hangs instead of failing', async () => {
    // The likeliest real failure and the only one that can actually hurt: a
    // worker that never answers holds the request open rather than erroring,
    // so without the abort the feed would wait on it forever.
    const hang = vi.fn().mockImplementation((_url, init) => new Promise((_res, rej) => {
      init.signal?.addEventListener('abort', () => rej(new Error('aborted')));
    }));
    const out = await writeCrowd(event(), { count: 5, cast: NAMES,
      endpoint: 'https://x.test', fetchImpl: hang, timeoutMs: 40 });
    expect(out.source).toBe('template');
    expect(out.posts.length).toBe(5);
  });

  it('uses templates when the worker reports its own failure', async () => {
    // What a real worker returns when the API key is missing or Anthropic is
    // down: a 200 with an error field, never a status a caller has to parse.
    const f = vi.fn().mockResolvedValue({ ok: true,
      json: async () => ({ posts: [], error: 'no ANTHROPIC_API_KEY' }) });
    const out = await writeCrowd(event(), { count: 6, cast: NAMES,
      endpoint: 'https://x.test', fetchImpl: f });
    expect(out.source).toBe('template');
    expect(out.posts.length).toBe(6);
  });

  it('uses templates when the worker answers with rubbish', async () => {
    for (const body of [{ posts: 'nope' }, {}, { posts: [] }]) {
      const f = vi.fn().mockResolvedValue({ ok: true, json: async () => body });
      const out = await writeCrowd(event(), { count: 5, cast: NAMES,
        endpoint: 'https://x.test', fetchImpl: f });
      expect(out.source).toBe('template');
      expect(out.posts.length).toBe(5);
    }
  });

  it('uses templates when every written post fails validation', async () => {
    const f = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ posts: [
      { text: 'In a shocking turn of events, Marcus has done it again in week 9', cites: ['nope'] },
    ] }) });
    const out = await writeCrowd(event(), { count: 4, cast: NAMES,
      endpoint: 'https://x.test', fetchImpl: f });
    expect(out.source).toBe('template');
    expect(out.rejected.length).toBeGreaterThan(0);
    // And it says why, rather than failing silently.
    expect(out.rejected[0].reasons.length).toBeGreaterThan(0);
  });

  it('degrades post by post rather than all at once', async () => {
    const ev = event();
    const good = `honestly ${'not over this '.repeat(1)}she wrote his name down and he still does not know`;
    const f = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ posts: [
      { text: good, cites: [ev.receipts[0].id] },
      { text: 'In a shocking turn of events this changes everything', cites: [ev.receipts[0].id] },
    ] }) });
    const out = await writeCrowd(ev, { count: 5, cast: NAMES,
      endpoint: 'https://x.test', fetchImpl: f });
    expect(out.source).toBe('mixed');
    expect(out.posts.length).toBe(5);
    expect(out.posts.filter(p => p.written).length).toBe(1);
    // The rest are still the simulator's, with everything downstream intact.
    for (const p of out.posts) {
      expect(p.handle).toBeTruthy();
      expect(typeof p.likes).toBe('number');
    }
  });

  it('keeps the simulator in charge of everything except the words', async () => {
    const ev = event();
    const f = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ posts: [
      { text: 'she wrote his name down and he still has no idea', cites: [ev.receipts[0].id] },
    ] }) });
    const out = await writeCrowd(ev, { count: 3, cast: NAMES,
      endpoint: 'https://x.test', fetchImpl: f });
    const w = out.posts.find(p => p.written);
    expect(w.text).toBe('she wrote his name down and he still has no idea');
    // Who is holding the account, what the room did with it, and which topic it
    // came from are all still the simulator's answers.
    expect(w.handle).toBeTruthy();
    expect(w.topic).toBeTruthy();
    expect(typeof w.stance).toBe('number');
  });

  it('returns null rather than throwing on a bad status', async () => {
    const f = vi.fn().mockResolvedValue({ ok: false, status: 500, json: async () => ({}) });
    expect(await requestPosts({ event: {} }, { endpoint: 'https://x.test', fetchImpl: f })).toBeNull();
    expect(await requestPosts({ event: {} }, { endpoint: null })).toBeNull();
  });

  it('improves the words and changes nothing else about the feed', async () => {
    const { ensureFeeds, ensureFeedsWritten } = await import('../js/social/live.js');
    const { postsForEpisode } = await import('../js/social/store.js');
    const { simulateBBEpisode } = await import('../js/bb-run.js');

    // ONE season, built twice. Two separate plays are two different seasons —
    // different Heads of Household, different nominees — so the feeds would
    // differ for reasons that have nothing to do with the writer.
    house();
    Object.assign(seasonConfig, { jurySize: 7, bbHaveNots: 'off', bbSafetyMode: 'off' });
    seasonConfig.twistSchedule = [];
    for (let w = 0; w < 3; w++) if (!simulateBBEpisode()) break;

    ensureFeeds(gs, { format: 'big-brother', season: 1 });
    // Every episode, not just the first — week one has no weeks behind it, so
    // it has no receipts and nothing to rewrite. Asserting there measured the
    // one episode the writer is correct to leave alone.
    const { storeOf } = await import('../js/social/store.js');
    const plain = storeOf(gs).posts.map(p => ({ id: p.id, at: p.at, handle: p.handle,
      topic: p.topic, likes: p.likes, text: p.text }));

    const f = vi.fn().mockImplementation(async (_url, init) => {
      const packet = JSON.parse(init.body);
      const id = packet.receipts?.[0]?.id;
      return { ok: true, json: async () => ({ posts: id
        ? [{ text: 'she really did that to him and i am not ok about it', cites: [id] }] : [] }) };
    });
    const out = await ensureFeedsWritten(gs, { format: 'big-brother', season: 1,
      endpoint: 'https://x.test', fetchImpl: f, rebuild: true });
    const written = storeOf(gs).posts;

    expect(out.written, 'the worker was never asked, or nothing survived').toBeGreaterThan(0);
    // Same posts, same order, same accounts, same engagement — only words move.
    expect(written.length).toBe(plain.length);
    for (const [i, p] of written.entries()) {
      expect(p.id).toBe(plain[i].id);
      expect(p.at).toBe(plain[i].at);
      expect(p.handle).toBe(plain[i].handle);
      expect(p.topic).toBe(plain[i].topic);
      expect(p.likes).toBe(plain[i].likes);
    }
    expect(written.some(p => p.written)).toBe(true);
    // And a scream is never worth a round trip.
    expect(written.filter(p => p.topic === 'scream').every(p => !p.written)).toBe(true);
  }, 120000);

  it('redoes one episode and leaves the others exactly as they were', async () => {
    const { ensureFeeds } = await import('../js/social/live.js');
    const { rebuildEpisodeFeed } = await import('../js/social/session.js');
    const { postsForEpisode } = await import('../js/social/store.js');
    const { simulateBBEpisode } = await import('../js/bb-run.js');

    house();
    Object.assign(seasonConfig, { jurySize: 7, bbHaveNots: 'off', bbSafetyMode: 'off',
      seasonNumber: 1, format: 'big-brother' });
    seasonConfig.twistSchedule = [];
    for (let w = 0; w < 4; w++) if (!simulateBBEpisode()) break;
    ensureFeeds(gs, { format: 'big-brother', season: 1 });

    const before = {};
    for (const ep of [1, 2, 3]) before[ep] = postsForEpisode(gs, ep).map(p => p.text);
    expect(before[2].length).toBeGreaterThan(0);

    // Writer off, so this is the plain rebuild — the operation has to be
    // narrow whether or not a model is involved.
    delete seasonConfig.socialWriter;
    await rebuildEpisodeFeed(2);

    // The named night was made again...
    expect(postsForEpisode(gs, 2).length).toBeGreaterThan(0);
    // ...and its neighbours were not touched, which is the whole request.
    expect(postsForEpisode(gs, 1).map(p => p.text)).toEqual(before[1]);
    expect(postsForEpisode(gs, 3).map(p => p.text)).toEqual(before[3]);
    // Nor duplicated: the store replaces an episode rather than appending.
    const ids = postsForEpisode(gs, 2).map(p => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  }, 120000);

  it('refuses to redo a night that is not an episode', async () => {
    const { rebuildEpisodeFeed } = await import('../js/social/session.js');
    house();
    for (const bad of [0, -1, 'x', null, undefined]) {
      const res = await rebuildEpisodeFeed(bad);
      expect(res.error, `accepted ${bad}`).toBeTruthy();
    }
  });

  it('is byte-identical to the old feed when the writer is off', async () => {
    const { ensureFeeds, ensureFeedsWritten } = await import('../js/social/live.js');
    const { postsForEpisode } = await import('../js/social/store.js');
    const { simulateBBEpisode } = await import('../js/bb-run.js');
    house();
    Object.assign(seasonConfig, { jurySize: 7, bbHaveNots: 'off', bbSafetyMode: 'off' });
    seasonConfig.twistSchedule = [];
    for (let w = 0; w < 3; w++) if (!simulateBBEpisode()) break;
    ensureFeeds(gs, { format: 'big-brother', season: 1 });
    const a = postsForEpisode(gs, 1).map(p => p.text);
    // Rebuilt on the SAME season, so any difference is the writer's doing.
    const out = await ensureFeedsWritten(gs, { format: 'big-brother', season: 1,
      endpoint: null, rebuild: true });
    expect(out.written).toBe(0);
    expect(postsForEpisode(gs, 1).map(p => p.text)).toEqual(a);
  }, 120000);

  it('needs the season to ask AND a worker to exist', async () => {
    const { socialWriterOn, refreshSocialFeedWritten } = await import('../js/social/session.js');
    house();
    // Costing somebody money because a default changed under them is not a
    // thing a simulator should be able to do.
    delete seasonConfig.socialWriter;
    delete seasonConfig.socialWriterUrl;
    expect(socialWriterOn()).toBe(false);

    seasonConfig.socialWriter = true;
    expect(socialWriterOn(), 'the checkbox is the switch').toBe(true);

    seasonConfig.socialWriter = false;
    expect(socialWriterOn(), 'a URL alone should not switch it on').toBe(false);

    // And with it off, the written entry point is the synchronous one.
    const res = await refreshSocialFeedWritten({});
    expect(res).toBeTruthy();
    expect(res.written).toBeUndefined();
    delete seasonConfig.socialWriter;
    delete seasonConfig.socialWriterUrl;
  });

  it('points at the worker that actually has the social mode', () => {
    // Not the Season Builder: that is a different worker with a different
    // script, and pointing at it fell through to its default branch and
    // returned analytics — no error, no posts, and templates forever with
    // nothing to explain why.
    expect(writerEndpoint({})).toContain('dc-analytics');
    expect(writerEndpoint({ socialWriterUrl: 'https://x.test' })).toBe('https://x.test');
  });

  it('reuses the worker the Season Builder already talks to', async () => {
    // A fourth Cloudflare worker would be another hand-deploy and another
    // secret for a separation nothing needs: that one already holds
    // ANTHROPIC_API_KEY and already dispatches creative writing by mode.
    const f = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ posts: [] }) });
    await requestPosts({ event: { kind: 'nomination' } }, { endpoint: 'https://x.test', fetchImpl: f });
    const body = JSON.parse(f.mock.calls[0][1].body);
    expect(body.mode, 'the worker dispatches on mode and would fall through to analytics')
      .toBe('social');
    expect(body.event).toBeTruthy();
  });
});

describe('the writer is told what happened', () => {
  // Two producers write facts and they do not agree on a shape. `withReceipts`
  // builds `event.receipts` from bond and ballot history; the moment readers —
  // key moments, advantages, awards — set the flat `event.receipt`, because
  // that is the slot the phrasings interpolate.
  //
  // `buildPacket` only ever read the first, so the writer was handed nothing
  // for exactly the events worth writing about: an idol played, a rescue, the
  // season's biggest betrayal. It got "kind: domination, subject: anastasia"
  // and was asked to be specific about it.
  it('cites a flat receipt as well as a built one', async () => {
    const { citableFacts } = await import('../js/social/writer.js');
    expect(citableFacts({ receipt: 'Anastasia played an idol for Zaid, wiping 4 votes' }))
      .toEqual([{ id: 'moment', text: 'Anastasia played an idol for Zaid, wiping 4 votes', week: null }]);
    // And still reads the built ones.
    const both = citableFacts({
      receipt: 'a moment',
      receipts: [{ id: 'r1', text: 'a ballot fact', week: 3 }],
    });
    expect(both.map(r => r.id)).toEqual(['r1', 'moment']);
  });

  it('does not offer the same fact twice under two ids', async () => {
    const { citableFacts } = await import('../js/social/writer.js');
    expect(citableFacts({
      receipt: 'same words', receipts: [{ id: 'r1', text: 'same words' }],
    })).toHaveLength(1);
  });

  it('drops a fact with no id or no words', async () => {
    const { citableFacts } = await import('../js/social/writer.js');
    expect(citableFacts({ receipts: [{ id: 'r1' }, { text: 'orphan' }] })).toEqual([]);
    expect(citableFacts({})).toEqual([]);
  });

  it('asks for a citation exactly when there is something to cite', async () => {
    const { buildPacket } = await import('../js/social/writer.js');
    expect(buildPacket({ kind: 'domination', subject: 'x' }).requireCite).toBe(false);
    expect(buildPacket({ kind: 'domination', subject: 'x', receipt: 'did a thing' })
      .requireCite).toBe(true);
  });

  it('reaches a real episode\'s events', async () => {
    const { buildPacket } = await import('../js/social/writer.js');
    const { archiveEpisode } = await import('../js/social/archive.js');
    const doc = JSON.parse(fs.readFileSync('data/seasons/season14-data.json', 'utf8'));
    const { events } = archiveEpisode(doc, 'total-drama', 14, 14);
    const facts = events.filter(e => e.receipt);
    expect(facts.length, 'the night has no facts to write from').toBeGreaterThan(3);
    for (const e of facts) {
      expect(buildPacket(e, { cast: [] }).receipts.length,
        `"${e.receipt}" reached the writer as nothing`).toBeGreaterThan(0);
    }
  });
});

describe('choosing which moments are worth writing', () => {
  // `rewriteEpisode` ranked events by `e.receipts` — the array — which is only
  // ONE of the two ways a fact arrives. The moment readers set the flat
  // `e.receipt`, so an idol played, a rescue and the season's biggest betrayal
  // all scored zero, the list came out empty, and the loop never ran.
  //
  // The writer then reported "returned nothing usable" WITHOUT HAVING MADE A
  // SINGLE CALL, which is the worst version of this bug: a message pointing at
  // the network for a fault in a filter.
  const doc = () => JSON.parse(fs.readFileSync('data/seasons/season14-data.json', 'utf8'));

  it('sends the events that carry a fact', async () => {
    const { rewriteEpisode } = await import('../js/social/writer.js');
    const { archiveEpisode } = await import('../js/social/archive.js');
    const { events, posts } = archiveEpisode(doc(), 'total-drama', 14, 14);

    let calls = 0;
    const fetchImpl = async () => {
      calls += 1;
      return {
        ok: true,
        // Distinct per call: identical text is correctly rejected as a
        // duplicate, and a fake that repeats itself measures the de-duplicator
        // rather than the thing under test.
        json: async () => ({ posts: [{ text: `a written reaction number ${calls}`, cites: [] }] }),
      };
    };
    const res = await rewriteEpisode(posts, events, {
      cast: ['jade', 'zaid', 'marissa'], endpoint: 'http://worker', fetchImpl,
    });
    expect(calls, 'the writer made no calls at all').toBeGreaterThan(0);
    expect(res.written, 'nothing was written despite the worker answering')
      .toBeGreaterThan(0);
  });

  it('ranks by how much there is to say', async () => {
    const { rewriteEpisode } = await import('../js/social/writer.js');
    const seen = [];
    const fetchImpl = async (url, opts) => {
      seen.push(JSON.parse(opts.body).event.subject);
      return { ok: true, json: async () => ({ posts: [{ text: `x${seen.length}`, cites: [] }] }) };
    };
    const events = [
      { kind: 'twist', subject: 'quiet', season: 1, episode: 1 },
      { kind: 'domination', subject: 'loud', season: 1, episode: 1, receipt: 'played an idol' },
    ];
    const posts = events.map(e => ({ kind: e.kind, subject: e.subject, stream: 'timeline', text: 't' }));
    await rewriteEpisode(posts, events, { endpoint: 'http://w', fetchImpl, maxEvents: 1 });
    expect(seen, 'the event with a fact was not the one sent').toEqual(['loud']);
  });

  it('still spends nothing on an episode with nothing to say', async () => {
    const { rewriteEpisode } = await import('../js/social/writer.js');
    let calls = 0;
    const fetchImpl = async () => { calls += 1; return { ok: true, json: async () => ({ posts: [] }) }; };
    const events = [{ kind: 'episode-aired', subject: null, season: 1, episode: 1 }];
    const posts = [{ kind: 'episode-aired', subject: null, stream: 'timeline', text: 't' }];
    const res = await rewriteEpisode(posts, events, { endpoint: 'http://w', fetchImpl });
    expect(calls, 'a nothing night still cost an API call').toBe(0);
    expect(res.written).toBe(0);
  });
});

describe('the writer names its own failure', () => {
  // One sentence covered four situations and blamed the network for all of
  // them, which sent somebody to check a worker that was answering fine, twice.
  const run = async (events, posts, fetchImpl, opts = {}) => {
    const { rewriteEpisode } = await import('../js/social/writer.js');
    return rewriteEpisode(posts, events, { endpoint: 'http://w', fetchImpl, ...opts });
  };
  const ev = (over = {}) => ({ kind: 'twist', subject: 'jade', season: 1, episode: 1, ...over });
  const po = (over = {}) => ({ kind: 'twist', subject: 'jade', stream: 'timeline', text: 't', ...over });

  it('says when no call was worth making', async () => {
    const res = await run([ev()], [po()], async () => { throw new Error('should not be called'); });
    expect(res.reason).toBe('no-facts');
    expect(res.asked).toBe(0);
  });

  it('says when the worker did not answer', async () => {
    const res = await run([ev({ receipt: 'did a thing' })], [po()],
      async () => ({ ok: false, status: 500, json: async () => ({}) }));
    expect(res.reason).toBe('no-answer');
    expect(res.asked).toBe(1);
    expect(res.answered).toBe(0);
  });

  it('says when everything came back invented', async () => {
    // Two things this test got wrong before it passed, both worth keeping.
    //
    // The cast has to be PASSED for an invented name to be invented — an empty
    // list refutes nothing, which is a fair description of the validator rather
    // than a flaw in it.
    //
    // And the name has to be mid-sentence. `claimedNames` skips index 0,
    // because a capitalised first word is usually sentence case, so a post
    // OPENING with an invented name passes. That is a real gap and it is not
    // closed here: NOT_A_NAME holds about sixty words, so checking position
    // zero would flag "Everybody", "Honestly" and "Somebody" and throw away
    // good posts to catch a rare bad one. Closing it properly needs a word
    // list, not a rule change.
    const res = await run([ev({ receipt: 'did a thing' })], [po()],
      async () => ({ ok: true, json: async () => ({ posts: [{ text: 'no because Somebodywhoisnotreal was robbed', cites: [] }] }) }),
      { cast: ['jade', 'zaid'] });
    expect(res.reason).toBe('all-rejected');
    expect(res.answered).toBe(1);
    expect(res.rejected.length).toBeGreaterThan(0);
  });

  it('says nothing at all when it worked', async () => {
    const res = await run([ev({ receipt: 'did a thing' })], [po()],
      async () => ({ ok: true, json: async () => ({ posts: [{ text: 'jade really did that huh', cites: [] }] }) }));
    expect(res.written).toBe(1);
    expect(res.reason).toBe(null);
  });
});
