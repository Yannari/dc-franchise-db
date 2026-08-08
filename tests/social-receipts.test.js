// Why THIS one matters.
//
// An event was four fields — `{ kind:'nomination', subject:'logan',
// actor:'anastasia' }` — so everything written from it was about A nomination
// rather than THIS nomination. Grammatical, and detachable from the episode,
// because nothing in the packet only fitted one night.
//
// Every fact needed was already in `gs` and none of it reached the feed. This
// asserts the layer that carries it: that receipts are REAL (drawn from the
// season, not invented), that they are SCOPED (a week-eight betrayal cannot
// appear in the week-three feed), and that they reach the posts.
//
// The closed set with ids is deliberate and this file pins it, because the
// packet is built to be handed to a model later: a post must cite a receipt by
// id rather than free-write history, so fabrication is not something to detect
// but something the format does not permit.
import { beforeEach, describe, expect, it } from 'vitest';
import { gs, players, seasonConfig, relationships, setRelationships } from '../js/core.js';
import { pStats, pronouns, ordinal, romanticCompat } from '../js/players.js';
import { getBond, setBond, getPerceivedBond, bKey, bondLabel, setLean } from '../js/bonds.js';
import { simulateBBEpisode } from '../js/bb-run.js';
import { receiptsFor, packetFor, withReceipts } from '../js/social/receipts.js';
import { extractEvents } from '../js/social/events.js';
import { episodeRecords, ensureFeeds } from '../js/social/live.js';
import { postsForEpisode } from '../js/social/store.js';
import { samplePosts, SLOT_NAMES } from '../js/social/sampler.js';
import { TOPICS } from '../js/social/topics.js';
import { seedGame } from './helpers/setup.js';

const STAT_KEYS = ['physical', 'endurance', 'mental', 'social', 'strategic',
  'loyalty', 'boldness', 'intuition', 'temperament'];
const spread = n => Object.fromEntries(STAT_KEYS.map((k, i) => [k, 1 + ((n * 7 + i * 3) % 10)]));
const NAMES = ['Logan', 'Anastasia', 'Jade', 'Spencer', 'Benji', 'Wayne',
  'Iris', 'Kit', 'Millie', 'Caleb', 'Axel', 'Zee'];
const CAST = NAMES.map((name, i) => ({ name, archetype: 'floater', gender: i % 2 ? 'f' : 'm',
  sexuality: 'straight', stats: spread(i + 1) }));

function house(rels = []) {
  seedGame(CAST, { episode: 0, eliminated: [], namedAlliances: [] });
  Object.assign(globalThis, { gs, players, seasonConfig, relationships, pStats, pronouns,
    ordinal, getBond, getPerceivedBond, bKey, bondLabel, romanticCompat });
  globalThis.gs = gs; globalThis.players = players;
  Object.assign(seasonConfig, { format: 'big-brother', finaleSize: 3, jurySize: 7,
    bbHaveNots: 'off', bbSafetyMode: 'off', romance: 'enabled' });
  seasonConfig.twistSchedule = [];
  gs.bb = { weeks: [], stats: {} };
  gs.bondLean = {}; gs.sideDeals = [];
  setRelationships(rels.map(r => ({ ...r })));
  globalThis.relationships = relationships;
}

beforeEach(() => house());

describe('a receipt is a real thing that happened', () => {
  it('reads a vote out of the season rather than inventing one', () => {
    gs.bb.weeks = [{
      num: 1, hoh: 'Anastasia', initialNominees: ['Jade', 'Kit'], finalNominees: ['Jade', 'Kit'],
      ballots: [{ voter: 'Logan', evict: 'Kit' }],
    }];
    const r = receiptsFor('Logan', 'Kit', { upTo: 4 });
    const voted = r.find(x => x.id === 'voted-against');
    expect(voted, 'a vote in the ledger produced no receipt').toBeTruthy();
    expect(voted.text).toContain('Logan');
    expect(voted.text).toContain('Kit');
    expect(voted.week).toBe(1);
    // Reachable from either side, because a nomination names the NOMINEE as
    // its subject and the facts about the nominator are the half that matters.
    const flipped = receiptsFor('Kit', 'Logan', { upTo: 4 });
    expect(flipped.some(x => x.text === voted.text)).toBe(true);
  });

  it('remembers who kept whom off the block', () => {
    gs.bb.weeks = [{
      num: 2, hoh: 'Wayne', initialNominees: ['Kit', 'Iris'], finalNominees: ['Kit', 'Iris'],
      ballots: [{ voter: 'Logan', evict: 'Iris' }],
    }];
    const r = receiptsFor('Logan', 'Kit', { upTo: 5 });
    expect(r.some(x => x.id === 'kept-them')).toBe(true);
  });

  it('carries a flip the victim never learned, and says so', () => {
    gs.bb.weeks = [{
      num: 3, hoh: 'Kit', initialNominees: ['Jade', 'Iris'],
      allianceChanges: { betrayals: [{ voter: 'Anastasia', victim: 'Logan', known: false }] },
    }];
    const r = receiptsFor('Anastasia', 'Logan', { upTo: 6 });
    const flip = r.find(x => x.id === 'flip-hidden');
    expect(flip).toBeTruthy();
    expect(flip.text).toMatch(/still does not know/);
    // The loudest fact available, so it leads.
    expect(r[0].id).toBe('flip-hidden');
  });

  it('reads the relationship axes, including the one-sided one', () => {
    house([{ id: 'r1', a: 'Spencer', b: 'Benji', type: 'rival', bond: -3, kin: 'exes' }]);
    setBond('Spencer', 'Benji', -3);
    setLean('Spencer', 'Benji', 8);
    const r = receiptsFor('Spencer', 'Benji');
    expect(r.some(x => x.id === 'kinship')).toBe(true);
    // The receipt a single shared number could never produce.
    const oneSided = r.find(x => x.id === 'one-sided');
    expect(oneSided, 'the lean produced no receipt').toBeTruthy();
    expect(oneSided.text).toContain('Spencer');
  });

  it('says nothing about two people with no history', () => {
    expect(receiptsFor('Logan', 'Zee')).toEqual([]);
    expect(receiptsFor('Logan', 'Logan')).toEqual([]);
    expect(receiptsFor('Logan', null)).toEqual([]);
  });
});

describe('a receipt cannot come from the future', () => {
  it('leaves later weeks out of an earlier episode', () => {
    // A feed reacting to week three with week eight's betrayal is the loudest
    // possible way to say the whole thing was generated afterwards.
    gs.bb.weeks = [
      { num: 2, ballots: [{ voter: 'Logan', evict: 'Kit' }] },
      { num: 8, ballots: [{ voter: 'Logan', evict: 'Kit' }],
        allianceChanges: { betrayals: [{ voter: 'Logan', victim: 'Kit', known: false }] } },
    ];
    const early = receiptsFor('Logan', 'Kit', { upTo: 3 });
    expect(early.some(x => x.week === 8)).toBe(false);
    expect(early.some(x => x.id === 'flip-hidden')).toBe(false);
    expect(early.some(x => x.week === 2)).toBe(true);
    // By week nine it is fair game.
    expect(receiptsFor('Logan', 'Kit', { upTo: 9 }).some(x => x.id === 'flip-hidden')).toBe(true);
  });

  it('keeps one of each kind, most damning first', () => {
    gs.bb.weeks = [1, 2, 3, 4].map(num => ({
      num, hoh: 'Anastasia', initialNominees: ['Logan', 'Kit'],
      ballots: [{ voter: 'Anastasia', evict: 'Logan' }],
    }));
    const r = receiptsFor('Anastasia', 'Logan', { upTo: 9 });
    // Four separate "voted against" receipts is one fact with four dates on
    // it. Two is the cap, because the same id in the other direction is a
    // genuinely different fact.
    expect(r.filter(x => x.id === 'voted-against').length).toBeLessThan(3);
    expect(new Set(r.map(x => x.text)).size).toBe(r.length);
    const weights = r.map(x => x.weight);
    expect(weights).toEqual([...weights].sort((a, b) => b - a));
  });
});

describe('the packet reaches the writer', () => {
  it('hangs receipts on a nomination event', () => {
    gs.bb.weeks = [{
      num: 1, hoh: 'Anastasia', initialNominees: ['Logan', 'Kit'], finalNominees: ['Logan', 'Kit'],
      ballots: [{ voter: 'Logan', evict: 'Kit' }],
    }];
    const evs = extractEvents(gs.bb.weeks[0], { format: 'big-brother', season: 1, episode: 1 });
    const nom = evs.find(e => e.kind === 'nomination');
    expect(nom).toBeTruthy();
    expect(Array.isArray(nom.receipts)).toBe(true);
    // The flat field is what `poolFor` checks; without it every template that
    // spends a receipt is silently dropped and the topic can never fire.
    if (nom.receipts.length) {
      expect(nom.receipt).toBeTruthy();
      expect(nom.receipt).toBe(nom.headline.text.replace(/\.$/, ''));
    }
  });

  it('is a slot the sampler knows about', () => {
    expect(SLOT_NAMES).toContain('receipt');
    const topic = TOPICS.find(t => t.id === 'receipts-out');
    expect(topic, 'no topic spends the receipt').toBeTruthy();
    expect(topic.triggers).toContain('nomination');
  });

  it('cannot fire on an event with no history', () => {
    // The correct outcome, not a gap: a nomination between two people who have
    // never interacted has nothing to bring up.
    const bare = { kind: 'nomination', subject: 'logan', actor: 'zee', season: 1, episode: 1, at: 0 };
    const posts = samplePosts(bare, { count: 12, stream: 'timeline', rng: Math.random });
    expect(posts.every(p => p.topic !== 'receipts-out')).toBe(true);
  });

  it('puts the fact in the post when there is one', () => {
    gs.bb.weeks = [{
      num: 1, hoh: 'Anastasia', initialNominees: ['Logan'], finalNominees: ['Logan'],
      allianceChanges: { betrayals: [{ voter: 'Anastasia', victim: 'Logan', known: false }] },
    }];
    const ev = withReceipts({ kind: 'nomination', subject: 'logan', actor: 'anastasia',
      season: 1, episode: 3, at: 0 }, { upTo: 3 });
    expect(ev.receipt).toBeTruthy();
    const posts = samplePosts(ev, { count: 25, stream: 'timeline', rng: Math.random })
      .filter(p => p.topic === 'receipts-out');
    expect(posts.length, 'the topic never fired on an event with history').toBeGreaterThan(0);
    for (const p of posts) {
      expect(p.text).not.toMatch(/\{|\}|undefined|NaN/);
      // Every line under this topic spends the receipt — that is its contract.
      const bits = ev.receipt.split(' ').filter(w => w.length > 3).slice(0, 2);
      expect(bits.some(b => p.text.toLowerCase().includes(b.toLowerCase())),
        `a receipts-out post that cites nothing: ${p.text}`).toBe(true);
    }
  });
});

describe('a crowd is not one person posting nine times', () => {
  it('does not hand the same template to the whole room', () => {
    // Every post drew independently, so a five-template pool sampled nine times
    // repeated by construction — and it read as one account, not a room.
    gs.bb.weeks = [{ num: 1, allianceChanges: { betrayals: [{ voter: 'Anastasia', victim: 'Logan', known: false }] } }];
    const ev = withReceipts({ kind: 'nomination', subject: 'logan', actor: 'anastasia',
      season: 1, episode: 3, at: 0 }, { upTo: 3 });
    for (let run = 0; run < 5; run++) {
      const posts = samplePosts(ev, { count: 14, stream: 'timeline', rng: Math.random });
      const texts = posts.map(p => p.text);
      const worst = Math.max(...Object.values(texts.reduce((m, t) => {
        m[t] = (m[t] || 0) + 1; return m;
      }, {})));
      expect(worst, `the same post ${worst} times in one crowd`).toBeLessThan(4);
    }
  });
});

describe('a real season', () => {
  it('gives nominations something to talk about', () => {
    house([
      { id: 'r1', a: 'Logan', b: 'Jade', type: 'ally', bond: 6, kin: 'old-friends' },
      { id: 'r2', a: 'Spencer', b: 'Benji', type: 'rival', bond: -4, kin: 'exes', leanA: 8 },
    ]);
    for (let w = 0; w < 6; w++) if (!simulateBBEpisode()) break;

    let withHistory = 0, total = 0;
    for (const { record, episode } of episodeRecords(gs, 'big-brother')) {
      for (const e of extractEvents(record, { format: 'big-brother', season: 1, episode })) {
        if (e.kind !== 'nomination') continue;
        total++;
        if ((e.receipts || []).length) withHistory++;
        // Nothing from a week that has not aired.
        for (const r of e.receipts || []) {
          if (r.week != null) expect(r.week).toBeLessThan(episode);
        }
      }
    }
    expect(total, 'no nominations at all').toBeGreaterThan(4);
    expect(withHistory, 'not one nomination knew anything about itself').toBeGreaterThan(2);

    ensureFeeds(gs, { format: 'big-brother', season: 1 });
    const all = episodeRecords(gs, 'big-brother')
      .flatMap(r => postsForEpisode(gs, r.episode));
    expect(all.some(p => p.topic === 'receipts-out'),
      'a whole season and nobody cited anything').toBe(true);
    for (const p of all) expect(p.text).not.toMatch(/\{receipt\}|undefined/);
  }, 200000);
});
