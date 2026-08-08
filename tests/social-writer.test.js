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

  it('refuses a post that points at nothing', () => {
    // The whole design in one assertion: a post that free-writes history is
    // making a claim nobody can check.
    expect(ok('this has been coming since the first week', { cites: [] }).reasons)
      .toContain('cites-nothing');
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
    const plain = postsForEpisode(gs, 1).map(p => ({ id: p.id, at: p.at, handle: p.handle,
      topic: p.topic, likes: p.likes, text: p.text }));

    const f = vi.fn().mockImplementation(async (_url, init) => {
      const packet = JSON.parse(init.body);
      const id = packet.receipts?.[0]?.id;
      return { ok: true, json: async () => ({ posts: id
        ? [{ text: 'she really did that to him and i am not ok about it', cites: [id] }] : [] }) };
    });
    const out = await ensureFeedsWritten(gs, { format: 'big-brother', season: 1,
      endpoint: 'https://x.test', fetchImpl: f, rebuild: true });
    const written = postsForEpisode(gs, 1);

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

  it('is off unless somebody turns it on', () => {
    expect(writerEndpoint({})).toBeNull();
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
