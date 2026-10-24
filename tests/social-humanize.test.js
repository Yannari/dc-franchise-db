// The feed has to read like people typed it (user, 2026-10-24: "the
// conversations are not great and don't sound human"). Each rule below is a
// tell found reading a night of Birdie and ChatAlumni.
import { describe, it, expect } from 'vitest';
import { contract, emphasize, placeWords } from '../js/social/humanize.js';
import { buildEpisodeFeed } from '../js/social/feed.js';

describe('contract', () => {
  it('types the way people type', () => {
    expect(contract('I am not sure that is true.')).toBe('I’m not sure that’s true.');
    expect(contract('Do not let them. It is not over.')).toBe('Don’t let them. It isn’t over.');
    expect(contract('Will not happen. Cannot happen.')).toBe('Won’t happen. Can’t happen.');
    expect(contract('We will see, and they are going to hear it.')).toBe('We’ll see, and they’re going to hear it.');
  });
  it('leaves the verb whole where English does', () => {
    expect(contract('That is who it is.')).toBe('That’s who it is.');
    expect(contract('I know what I am')).toBe('I know what I am');
    expect(contract('the worst person out there is also the best player')).toBe('the worst person out there is also the best player');
    expect(contract('there is a reason')).toBe('there’s a reason');
  });
});

describe('emphasize', () => {
  const rng = () => 0;
  it('shouts the one word the sentence leans on', () => {
    expect(emphasize('stop giving the same four people the whole episode', rng)).toBe('stop giving the SAME four people the whole episode');
  });
  it('never shouts a name, a function word, or a sentence with nothing to lean on', () => {
    expect(emphasize('four seasons of this account and one favourite', rng)).toBe('four seasons of this account and one favourite');
    expect(emphasize('Zella is never wrong', rng)).toBe('Zella is NEVER wrong');
  });
});

describe('placeWords', () => {
  it("puts each show's own setting into the shared lines", () => {
    expect(placeWords('nobody in that house told them', 'camp')).toBe('nobody in that camp told them');
    expect(placeWords('enjoy the jury house', 'villa')).toBe('enjoy the jury');
    expect(placeWords('the nicest person on that beach', 'house')).toBe('the nicest person in that house');
    expect(placeWords('nobody in that house told them', 'house')).toBe('nobody in that house told them');
  });
});

describe('a night of the feed', () => {
  const base = { format: 'big-brother', season: 2, episode: 1 };
  const ev = (kind, at, subject, actor) => ({ ...base, kind, at: at * 60000, subject, actor });
  const posts = buildEpisodeFeed([ev('episode-aired', 1), ev('twist', 5), ev('comp-win', 9, 'angelica'),
    ev('nomination', 15, 'kyle', 'angelica'), ev('kindness', 20, 'paisley'), ev('eviction', 38, 'sabrina')], { seed: 11 });
  const norm = s => s.toLowerCase().replace(/[^a-z ]/g, '').replace(/\s+/g, ' ').trim();

  it('says no line twice in one episode', () => {
    const seen = new Map();
    for (const p of posts) seen.set(norm(p.text), (seen.get(norm(p.text)) || 0) + 1);
    expect([...seen].filter(([, n]) => n > 1)).toEqual([]);
    expect(posts.length).toBeGreaterThan(40);
  });

  it('does not claim a month or "episode four" on the first night', () => {
    const bad = posts.filter(p => /\ba month\b|episode (four|4)\b|three weeks|nothing has happened|stopped being/i.test(p.text));
    expect(bad.map(p => p.text)).toEqual([]);
  });

  it('keeps the old stamps off: no fragment openers, no random runs of capitals, no "?!" on a statement', () => {
    expect(posts.filter(p => /^(no because|i'm sorry but|hold on\.) /i.test(p.text))).toEqual([]);
    // Two or more shouted words in a row inside a sentence that is not all shouting.
    const runs = posts.filter(p => p.text !== p.text.toUpperCase() && /\b[A-Z]{2,}\b \b[A-Z]{2,}\b/.test(p.text.replace(/\b(I|HOH|OK)\b/g, '')));
    expect(runs.map(p => p.text)).toEqual([]);
    const statements = posts.filter(p => /\?!$/.test(p.text.replace(/\s*\p{Extended_Pictographic}.*$/u, ''))
      && !/^(who|what|why|how|where|when|is|are|was|did|does|do|can|could|would|explain)\b/i.test(p.text));
    expect(statements.map(p => p.text)).toEqual([]);
  });
});
