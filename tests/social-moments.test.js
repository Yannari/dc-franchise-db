// The feed was vague because it had nothing to be specific about.
//
// A Total Drama archive night produced six event kinds — aired, comp win, votes
// taken, elimination, blindside, finale — so nobody could mention an idol, an
// alliance, a meltdown or a rescue, because none of those had ever been
// extracted. The audience was reacting to a ballot and a challenge result and
// being asked to sound like it had watched an episode.
//
// Every published season has carried the answer the whole time. `keyMoments`
// on each placement are EPISODE-TAGGED PROSE:
//
//   "Episode 6: Found the Red Team idol and quietly became the best-protected
//    player on her tribe."
//
// Read, dated, classified by their own words, and handed through as `receipt` —
// the slot the phrasings already use for the one fact that makes an event THIS
// event rather than one of its kind.
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { archiveEpisode, awardEvents, momentEvents, momentKind } from '../js/social/archive.js';

const doc = JSON.parse(fs.readFileSync('data/seasons/season14-data.json', 'utf8'));

describe('reading the season\'s own account of a night', () => {
  it('finds the moments that belong to this episode and no others', () => {
    const six = momentEvents(doc, 'total-drama', 14, 6);
    expect(six.length).toBeGreaterThan(0);
    for (const e of six) expect(e.episode).toBe(6);
    // A different night is a different set.
    const fourteen = momentEvents(doc, 'total-drama', 14, 14);
    expect(fourteen.map(e => e.receipt).join())
      .not.toBe(six.map(e => e.receipt).join());
  });

  it('carries the sentence itself, not a summary of it', () => {
    const six = momentEvents(doc, 'total-drama', 14, 6);
    const idol = six.find(e => /idol/i.test(e.receipt || ''));
    expect(idol, 'the idol that was found on episode 6 is not in the feed').toBeTruthy();
    expect(idol.receipt).toMatch(/Red Team idol/);
  });

  it('gives the receipt its subject back', () => {
    // The document writes these with the player implied — "Found the Red Team
    // idol" — and a receipt lands MID-SENTENCE, so as-is it produced "I say
    // that knowing nearly drowned in the treasure dive". A dangling verb.
    for (const e of momentEvents(doc, 'total-drama', 14, 14)) {
      expect(e.receipt, `"${e.receipt}" starts with a verb and nobody doing it`)
        .toMatch(/^[A-Z][a-z]+ /);
    }
  });

  it('does not repeat the name when the sentence already has it', () => {
    expect(momentEvents(doc, 'total-drama', 14, 14)
      .every(e => !/^(\w+) \1\b/i.test(e.receipt))).toBe(true);
  });

  it('reads the kind out of the words', () => {
    expect(momentKind('Found the Red Team idol and kept it secret')).toBe('twist');
    expect(momentKind('Played her idol and negated four votes')).toBe('domination');
    expect(momentKind('Abandoned a winning path to rescue Zaid from drowning')).toBe('kindness');
    expect(momentKind('Flipped off Spencer after his overplay')).toBe('betrayal');
    expect(momentKind('Helped form The Triumvirate with Natalia')).toBe('alliance-formed');
    expect(momentKind('Melted down in the kitchen')).toBe('argument');
  });

  it('guesses vaguely rather than confidently wrong', () => {
    // A confidently wrong label reads worse than a true vague one: a rescue
    // filed as a betrayal produces a room attacking somebody for saving a life.
    expect(momentKind('Something happened that nobody wrote down clearly')).toBe('twist');
  });
});

describe('the season\'s own verdicts', () => {
  it('puts a dated award on the night it happened', () => {
    const ep = Number(doc.awards?.biggestBetrayal?.episode);
    expect(ep, 'this fixture has no dated betrayal to test with').toBeGreaterThan(0);
    const on = awardEvents(doc, 'total-drama', 14, ep);
    expect(on.some(e => e.kind === 'betrayal')).toBe(true);
    // And nowhere else.
    expect(awardEvents(doc, 'total-drama', 14, ep === 1 ? 2 : 1)
      .some(e => e.kind === 'betrayal')).toBe(false);
  });

  it('saves the season verdicts for the last night', () => {
    const fav = doc.awards?.fanFavorite;
    expect(fav, 'no fan favourite in this fixture').toBeTruthy();
    const finale = awardEvents(doc, 'total-drama', 14, 26, { isFinale: true });
    expect(finale.some(e => e.subject === (fav.playerSlug || ''))).toBe(true);
    expect(awardEvents(doc, 'total-drama', 14, 26, { isFinale: false }).length)
      .toBeLessThan(finale.length);
  });
});

describe('and the feed says something', () => {
  it('has more to talk about than a ballot', () => {
    const before = ['episode-aired', 'comp-win', 'eviction', 'blindside', 'nomination'];
    const { events } = archiveEpisode(doc, 'total-drama', 14, 14);
    const beyond = events.filter(e => !before.includes(e.kind));
    expect(beyond.length, 'the night is still only a vote and a challenge')
      .toBeGreaterThan(0);
  });

  it('quotes the night in the posts themselves', () => {
    const { posts } = archiveEpisode(doc, 'total-drama', 14, 14);
    const specific = posts.filter(p => /idol|advantage|alliance|rescue|drown/i.test(p.text));
    expect(specific.length, 'not one post mentions anything that happened')
      .toBeGreaterThan(5);
  });

  it('reaches both rooms, not just the timeline', () => {
    const { posts } = archiveEpisode(doc, 'total-drama', 14, 14);
    const spec = posts.filter(p => /idol|advantage|alliance|rescue|drown/i.test(p.text));
    expect(new Set(spec.map(p => p.stream)).size).toBe(2);
  });
});

describe('the played path knows the same things', () => {
  // A season being PLAYED and a season being READ went through different code:
  // `ensureFeeds` called `extractEvents` and nothing else, while the archive
  // path also read ballots, moments and awards. So the feed was at its vaguest
  // on the night you actually played it, and "redo this episode" rebuilt it
  // with FEWER events than the site would have generated for the same night.
  it('reads what the advantages did', async () => {
    const { extractEvents } = await import('../js/social/events.js');
    const ep = {
      num: 4, immunityWinner: 'Ted', eliminated: 'Jade',
      idolFinds: [{ finder: 'Anastasia', type: 'idol', tribe: 'Blue' }],
      idolPlays: [{ player: 'Anastasia', playedFor: 'Zaid', type: 'idol', votesNegated: 4 }],
    };
    const events = extractEvents(ep, { format: 'total-drama', season: 14, episode: 4 });
    const find = events.find(e => /found/i.test(e.receipt || ''));
    const play = events.find(e => /played/i.test(e.receipt || ''));
    expect(find, 'an idol was found and nobody mentioned it').toBeTruthy();
    expect(find.subject).toBe('anastasia');
    expect(play, 'an idol was played and nobody mentioned it').toBeTruthy();
    expect(play.receipt).toMatch(/wiping 4 votes/);
    expect(play.kind).toBe('domination');
  });

  it('tells a misplay from a play', () => {
    // One is control. The other is the season's best comedy, and filing them as
    // the same event gets the room's reaction exactly backwards.
    return import('../js/social/events.js').then(({ extractEvents }) => {
      const ev = extractEvents({
        num: 5, eliminated: 'Jade',
        idolPlays: [{ player: 'Logan', type: 'idol', votesNegated: 0, misplay: true }],
      }, { format: 'total-drama', season: 14, episode: 5 });
      const flop = ev.find(e => /did nothing at all/.test(e.receipt || ''));
      expect(flop).toBeTruthy();
      expect(flop.kind).toBe('argument');
    });
  });

  it('reads a ballot in either shape', async () => {
    const { ballotEvents } = await import('../js/social/events.js');
    const meta = { format: 'total-drama', season: 14, episode: 3 };
    // The played record: an object of voter -> target.
    const played = ballotEvents({
      eliminated: 'jade',
      votes: { logan: 'jade', benji: 'jade', anastasia: 'jade', jade: 'logan' },
    }, meta);
    // The published document: a list of pairs. Same night, same verdict.
    const doc2 = ballotEvents({
      eliminated: 'jade',
      votes: [{ voter: 'logan', target: 'jade' }, { voter: 'benji', target: 'jade' },
        { voter: 'anastasia', target: 'jade' }, { voter: 'jade', target: 'logan' }],
    }, meta);
    expect(played.map(e => e.kind)).toEqual(['blindside']);
    expect(doc2.map(e => e.kind)).toEqual(played.map(e => e.kind));
  });

  it('does not report the same fact twice', async () => {
    // The ballot says Ted was eliminated; the document's moment says Ted was
    // eliminated 5-3 after identifying the wrong threat. Both true, both an
    // eviction about Ted, and the feed reacted to it twice — once with the
    // detail and once without, which reads as the audience stuttering.
    // The invariant is one event per (kind, PERSON) — not one per kind. Two
    // eliminations in a night is a double elimination, which episode 8 has and
    // which the first draft of this test called a bug.
    const { archiveEpisode } = await import('../js/social/archive.js');
    for (let ep = 1; ep <= 26; ep++) {
      const { events } = archiveEpisode(doc, 'total-drama', 14, ep);
      const seen = new Map();
      for (const e of events) {
        // Two DETAILED events about one person are two things that happened;
        // the rule is only that a bare one may not shadow a detailed one.
        if (e.receipt) continue;
        const key = `${e.kind}|${e.subject}`;
        seen.set(key, (seen.get(key) || 0) + 1);
        expect(seen.get(key), `episode ${ep} repeats ${key} with no detail`)
          .toBeLessThanOrEqual(1);
        expect(events.some(o => o !== e && o.receipt && `${o.kind}|${o.subject}` === key),
          `episode ${ep}: a bare ${key} survived next to a detailed one`).toBe(false);
      }
    }
  });
});
