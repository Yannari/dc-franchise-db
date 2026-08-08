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
