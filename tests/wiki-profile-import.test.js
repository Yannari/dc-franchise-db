// The wiki import is allowed to invent. It is not allowed to invent and then
// claim the article said so — that is the difference between a suggestion and
// a forged citation, and a forged one survives into the roster and reads as
// researched forever after.
//
// The design document banned live scraping outright. Reversing that was a
// deliberate call, and this file is the condition it was reversed on.
import { describe, expect, it } from 'vitest';
import { buildVerifiedProfile, profileRelevantExcerpt, wikitextToProse } from '../worker/worker-episode-live.js';

const SOURCE = { url: 'https://totaldrama.fandom.com/wiki/Leshawna', label: 'Total Drama Wiki', title: 'Leshawna' };

const ARTICLE = `Leshawna is a loud and proud sister from the wrong side of the tracks.
She works as a hair stylist and is fiercely protective of her friends.
Leshawna grew up in a large family and never backs down from a confrontation.`;

const kindOf = (sources, key) => sources[key][0].kind;

describe('a quote is checked against the page that was actually fetched', () => {
  it('keeps a canon claim whose quote really is in the article', () => {
    const { fields, profileSources, demoted } = buildVerifiedProfile({
      fields: {
        occupation: { value: 'Hair stylist', kind: 'source-canon', quote: 'She works as a hair stylist' },
      },
    }, ARTICLE, SOURCE);

    expect(fields.occupation).toBe('Hair stylist');
    expect(kindOf(profileSources, 'occupation')).toBe('source-canon');
    expect(profileSources.occupation[0].url).toBe(SOURCE.url);
    expect(demoted).toEqual([]);
  });

  it('demotes a canon claim whose quote is nowhere on the page', () => {
    const { fields, profileSources, demoted } = buildVerifiedProfile({
      fields: {
        hometown: { value: 'Toronto, Ontario', kind: 'source-canon',
          quote: 'Leshawna was born and raised in Toronto' },
      },
    }, ARTICLE, SOURCE);

    // Kept — an invented hometown is often what you want.
    expect(fields.hometown).toBe('Toronto, Ontario');
    // But no longer wearing a citation.
    expect(kindOf(profileSources, 'hometown')).toBe('interpretation');
    expect(profileSources.hometown[0].url).toBeUndefined();
    expect(demoted).toContain('hometown');
  });

  it('refuses a quote too short to mean anything', () => {
    // "She works" appears verbatim, and would launder any guess into a
    // citation if length were not floored.
    const { profileSources, demoted } = buildVerifiedProfile({
      fields: { occupation: { value: 'Chef', kind: 'source-canon', quote: 'She works' } },
    }, ARTICLE, SOURCE);
    expect(kindOf(profileSources, 'occupation')).toBe('interpretation');
    expect(demoted).toContain('occupation');
  });

  it('demotes a canon claim carrying no quote at all', () => {
    const { profileSources, demoted } = buildVerifiedProfile({
      fields: { ethnicity: { value: 'Black Canadian', kind: 'source-canon' } },
    }, ARTICLE, SOURCE);
    expect(kindOf(profileSources, 'ethnicity')).toBe('interpretation');
    expect(demoted).toContain('ethnicity');
  });

  it('matches through curly quotes and dashes', () => {
    // The same sentence renders with different punctuation in different
    // places; that must not read as a fabricated quote.
    const article = 'She is a loud‐and‐proud sister who doesn’t suffer fools.';
    const { profileSources } = buildVerifiedProfile({
      fields: { descriptor: { value: 'Sister with attitude', kind: 'source-canon',
        quote: "loud-and-proud sister who doesn't suffer fools" } },
    }, article, SOURCE);
    expect(kindOf(profileSources, 'descriptor')).toBe('source-canon');
  });
});

describe('what it will and will not carry through', () => {
  it('marks an honest interpretation as one without complaint', () => {
    const { fields, profileSources, demoted } = buildVerifiedProfile({
      fields: { voice: { value: 'Loud, warm, blunt.', kind: 'interpretation' } },
    }, ARTICLE, SOURCE);
    expect(fields.voice).toBe('Loud, warm, blunt.');
    expect(kindOf(profileSources, 'voice')).toBe('interpretation');
    // Not a demotion — it never claimed otherwise.
    expect(demoted).toEqual([]);
  });

  it('drops a birthdate that is not a real ISO date', () => {
    // The Studio's validator rejects the whole profile over a malformed date,
    // so this one is dropped rather than demoted.
    const { fields } = buildVerifiedProfile({
      fields: { birthdate: { value: 'circa 1991', kind: 'interpretation' } },
    }, ARTICLE, SOURCE);
    expect(fields.birthdate).toBeUndefined();
  });

  it('drops a short field that came back as a sentence', () => {
    // Both of these are real output from a live fetch. They are defensible as
    // prose and ruinous in the one-line bio lead these fields are printed in,
    // so they are dropped rather than truncated — a value cut off mid-clause
    // looks authored, and a blank beats a bad fill.
    const { fields, overlong } = buildVerifiedProfile({
      fields: {
        occupation: { value: 'Volunteer focused on helping disadvantaged teenagers; she hopes to open a community center someday.', kind: 'interpretation' },
        sexuality: { value: 'Appears straight or primarily attracted to men, based on her romantic interest in Harold.', kind: 'interpretation' },
      },
    }, ARTICLE, SOURCE);

    expect(fields.occupation).toBeUndefined();
    expect(fields.sexuality).toBeUndefined();
    expect(overlong).toEqual(['occupation', 'sexuality']);
  });

  it('keeps a short field that is actually short', () => {
    const { fields, overlong } = buildVerifiedProfile({
      fields: {
        occupation: { value: 'Hair stylist', kind: 'interpretation' },
        sexuality: { value: 'pansexual', kind: 'interpretation' },
        hometown: { value: 'Toronto, Ontario', kind: 'interpretation' },
      },
    }, ARTICLE, SOURCE);
    expect(fields).toMatchObject({ occupation: 'Hair stylist', sexuality: 'pansexual', hometown: 'Toronto, Ontario' });
    expect(overlong).toEqual([]);
  });

  it('does not cap the fields that are meant to be prose', () => {
    const long = 'She is warm and blunt in equal measure. Under pressure she pushes back rather than folding, and she remembers who was kind to her.';
    const { fields } = buildVerifiedProfile({
      fields: { personality: { value: long, kind: 'interpretation' } },
    }, ARTICLE, SOURCE);
    expect(fields.personality, 'personality, voice and backstory are paragraphs by design').toBe(long);
  });

  it('ignores blanks and fields it was never asked for', () => {
    const { fields } = buildVerifiedProfile({
      fields: {
        occupation: { value: '   ', kind: 'interpretation' },
        placement: { value: '3rd', kind: 'source-canon', quote: 'She works as a hair stylist' },
      },
    }, ARTICLE, SOURCE);
    expect(fields.occupation).toBeUndefined();
    expect(fields.placement, 'a placement is not a profile field').toBeUndefined();
  });

  it('survives a malformed answer without throwing', () => {
    for (const junk of [null, undefined, {}, { fields: null }, { fields: { voice: 'a string' } }]) {
      expect(() => buildVerifiedProfile(junk, ARTICLE, SOURCE)).not.toThrow();
    }
  });
});

describe('wikitext becomes quotable prose', () => {
  it('unwraps links, bold and headings but keeps the sentence', () => {
    const out = wikitextToProse(
      "==Personality==\n'''Leshawna''' is a [[Total Drama|loud]] and proud sister.<ref>x</ref>");
    expect(out).toContain('Leshawna is a loud and proud sister.');
    expect(out).not.toContain('[[');
    expect(out).not.toContain("'''");
    expect(out).not.toContain('<ref>');
  });

  it('keeps the infobox instead of deleting it', () => {
    // Found by running a real article through this, not by an assertion: the
    // infobox closes "...]]}}" with no newline before the braces, a pattern
    // looking for one matched nothing, and the generic template pass then ate
    // the densest profile block on the page.
    const out = wikitextToProse([
      '{{Character',
      '|image = Leshawna.png',
      '|label = The Sister with Tude',
      '|family = Mother, Leshaniqua (cousin)',
      '|enemies = Alejandro, Courtney',
      '|tdi team = ',
      '|voice = [[Novie Edwards|Novie Edwards]]}}',
      "'''Leshawna''' was a camper.",
    ].join('\n'));

    expect(out).toContain('label: The Sister with Tude');
    expect(out).toContain('family: Mother, Leshaniqua (cousin)');
    expect(out).toContain('enemies: Alejandro, Courtney');
    // An empty field is not a fact, and the image/voice credits are not the
    // character.
    expect(out).not.toContain('tdi team');
    expect(out).not.toMatch(/image|Leshawna\.png/);
    // The article still follows it.
    expect(out).toContain('Leshawna was a camper.');
  });

  it('keeps the readable half of a parameterised template', () => {
    // {{S|1}} and {{teamicon|gophers}} deleted whole left "was a camper on ,
    // where she was a member of the ." — and a sentence with holes cannot be
    // quoted, so every fact drawn from it would fail its citation check.
    const out = wikitextToProse("She was a camper on {{S|1}}, a member of the {{teamicon|gophers}}.");
    expect(out).toMatch(/camper on 1/);
    expect(out).toMatch(/member of the gophers/);
  });

  it('leaves sentences intact enough to quote from', () => {
    // The whole verification depends on this: if stripping mangled the prose,
    // every honest quote would fail its check and every field would silently
    // become an interpretation.
    const prose = wikitextToProse("{{Infobox|a=b}}\n'''She''' works as a [[hair stylist]].");
    expect(prose).toContain('She works as a hair stylist.');
  });
});

// A character article is mostly episode recap, and recap is both the bulk of
// the cost and the one content that must not reach a biography. Measured on a
// real 34,481-character page: the two sections this job reads from were the
// first 2,825, and a flat 24,000-character slice paid for eight times what it
// used.
describe('only the parts of an article that describe a person', () => {
  const ARTICLE = [
    'Character details:\nfamily: Mother, a cousin',
    'Personality:\nShe is loud and warm.',
    'Total Drama Island:\nIn episode one she arrived. In episode two she was voted out.',
    'Big Brother 3:\nShe was evicted in week four.',
    'Trivia:\nShe was born in Toronto.',
    'Gallery:\nLeshawna.png|Her promo picture.',
    'References:\nSome citation.',
  ].join('\n\n');

  it('keeps who they are and drops what they did', () => {
    const out = profileRelevantExcerpt(ARTICLE);
    expect(out).toContain('family: Mother');
    expect(out).toContain('She is loud and warm.');
    // Trivia is where a wiki states what the infobox has no row for.
    expect(out).toContain('She was born in Toronto.');

    expect(out, 'per-season recap is the bulk of the cost').not.toContain('voted out');
    expect(out, 'and of the other show too').not.toContain('evicted in week four');
    expect(out, 'a gallery is filenames').not.toContain('Leshawna.png');
    expect(out).not.toContain('Some citation');
  });

  it('sends the whole article rather than nothing when it recognises no headings', () => {
    const plain = 'She is a hair stylist who grew up in a large family and never backs down.';
    expect(profileRelevantExcerpt(plain)).toContain('hair stylist');
  });

  it('keeps what a bullet says and drops only the bullet', () => {
    // Deleting whole list lines emptied Trivia, which is entirely bulleted —
    // so the sentences stating a birthday or a hometown were thrown away
    // before the model ever saw them, and those fields came back blank.
    const out = wikitextToProse('==Trivia==\n*She was born in Toronto.\n*She has one cousin.');
    expect(out).toContain('She was born in Toronto.');
    expect(out).toContain('She has one cousin.');
    expect(out).not.toMatch(/^\s*\*/m);
  });
});

// Output is the only half of this call that can shrink — the article still has
// to be sent to answer anything. Measured on a real page, voice, personality
// and backstory are 79% of the reply between them, so not asking for prose
// somebody has already written is where the saving is.
describe('not paying to be told what you already wrote', () => {
  const ANSWER = {
    fields: {
      occupation: { value: 'Hair stylist', kind: 'interpretation' },
      personality: { value: 'Warm and blunt.', kind: 'interpretation' },
      backstory: { value: 'Grew up in a large family.', kind: 'interpretation' },
    },
  };

  it('takes only the fields it was asked for', () => {
    const { fields } = buildVerifiedProfile(ANSWER, ARTICLE, { ...SOURCE, only: ['occupation'] });
    expect(fields.occupation).toBe('Hair stylist');
    // Answered anyway, and discarded — the caller already has these.
    expect(fields.personality).toBeUndefined();
    expect(fields.backstory).toBeUndefined();
  });

  it('falls back to every field when no list is given', () => {
    const { fields } = buildVerifiedProfile(ANSWER, ARTICLE, SOURCE);
    expect(Object.keys(fields).sort()).toEqual(['backstory', 'occupation', 'personality']);
  });

  it('asks for nothing when the list is empty', () => {
    const { fields } = buildVerifiedProfile(ANSWER, ARTICLE, { ...SOURCE, only: [] });
    expect(fields).toEqual({});
  });
});
