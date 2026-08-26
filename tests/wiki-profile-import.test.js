// The wiki import is allowed to invent. It is not allowed to invent and then
// claim the article said so — that is the difference between a suggestion and
// a forged citation, and a forged one survives into the roster and reads as
// researched forever after.
//
// The design document banned live scraping outright. Reversing that was a
// deliberate call, and this file is the condition it was reversed on.
import { describe, expect, it } from 'vitest';
import { buildVerifiedProfile, wikitextToProse } from '../worker/worker-episode-live.js';

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
