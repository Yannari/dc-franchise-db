// Who a character is, as fields rather than prose.
//
// The Casting Studio has collected age and origin since it was built, and folded
// them into a sentence at the front of the voice profile because that is the one
// field the episode writer reads. This is the parser that turns those sentences
// back into columns — so the answer to "who is the youngest winner" stops being
// a question you cannot ask.
//
// The tests that matter most are the ones about NOT GUESSING. A database that
// invents demographics about people is worse than one with empty fields.
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseBio, composeBioLead, composeVoice, joinOrigin, stripBioLead, splitOrigin } from '../js/bio.js';

const profiles = JSON.parse(
  readFileSync(join(process.cwd(), 'voice-profiles.json'), 'utf8')).profiles;

describe('reading a bio out of a voice profile', () => {
  it('reads the real ones', () => {
    // Jane's profile, verbatim from the shipped file.
    const jane = parseBio(profiles.Jane);
    expect(jane.age).toBe(21);
    expect(jane.ethnicity).toBe('Asian');
    expect(jane.nationality).toBe('Canadian');
    expect(jane.sexuality).toBe('lesbian');
    expect(jane.prose).toMatch(/^Twin Sister of Harriett/);
  });

  it('leaves a profile with no lead-in completely alone', () => {
    // Most of the roster predates the age box. Their prose must come back
    // untouched rather than half-eaten by a parser looking for a lead-in.
    //
    // Asserted across everybody rather than on one named character. It used to
    // pin Alejandro, who has since been given a bio in the Studio — so the
    // guard failed on somebody doing exactly the thing the app is for, which
    // teaches you to edit the guard.
    const bare = Object.entries(profiles).filter(([, text]) => parseBio(text).age == null);
    expect(bare.length, 'nobody is without a bio, so this proves nothing').toBeGreaterThan(20);
    for (const [name, text] of bare) {
      expect(parseBio(text).prose, `${name}'s prose was chewed`).toBe(text.trim());
    }
  });

  it('ships nobody with a doubled lead-in', () => {
    // Avani used to ship as "22. 22, straight. Soft, unhurried…" — two
    // lead-ins, from an older save that prepended one in front of another. A
    // Publish has since regenerated the file and she reads correctly, so this
    // no longer pins HER; it pins the property, across everybody, which is
    // what actually needed guarding. Reading only the first lead leaves
    // "22, straight." at the front of the prose, where the episode writer
    // takes it for character rather than metadata.
    const doubled = Object.entries(profiles)
      .filter(([, text]) => parseBio(text).prose !== stripBioLead(text))
      .map(([name]) => name);
    expect(doubled, `these still carry a second lead-in: ${doubled.join(', ')}`).toEqual([]);
  });

  it('parses every bio in the shipped file without losing anybody', () => {
    const withBio = Object.values(profiles).filter(t => parseBio(t).age != null);
    // Not pinned to a number. It was 28 and is now 31 because ages keep being
    // authored in the Studio — a count that fails on real work teaches you to
    // edit the guard. What matters is that every bio present parses whole.
    expect(withBio.length, 'nobody has a parseable bio at all').toBeGreaterThan(20);
    for (const text of withBio) {
      const bio = parseBio(text);
      expect(bio.age).toBeGreaterThan(0);
      // A character created in the Studio before their voice is written has a
      // lead and nothing behind it — "23, Latino Peruvian American, The
      // Superfan." There is no prose there for the parser to eat, so this
      // checks the parser, not whether somebody has finished writing.
      if (!bio.prose.trim()) continue;
      expect(bio.prose.length, 'the personality prose was eaten').toBeGreaterThan(10);
    }
  });
});

describe('what it refuses to guess', () => {
  it('does not decide somebody\'s ethnicity from their nationality', () => {
    // Obi is "25, Nigerian, gay." Nigerian is where he is from. Filling in an
    // ethnicity from that is the software inventing a fact about a person, and
    // the empty field is the honest answer.
    const obi = parseBio(profiles.Obi);
    expect(obi.nationality).toBe('Nigerian');
    expect(obi.ethnicity).toBe('');
  });

  it('keeps what it cannot classify instead of dropping it', () => {
    // Doug is "21, Scouse, straight." Scouse is neither an ethnicity nor a
    // nationality, and it is still worth knowing.
    const doug = parseBio(profiles.Doug);
    expect(doug.descriptor).toBe('Scouse');
    expect(doug.ethnicity).toBe('');
    expect(doug.nationality).toBe('');
  });

  it('splits a phrase that genuinely holds both', () => {
    expect(splitOrigin('Asian Canadian')).toMatchObject({ ethnicity: 'Asian', nationality: 'Canadian' });
    expect(splitOrigin('Latino')).toMatchObject({ ethnicity: 'Latino', nationality: '' });
    expect(splitOrigin('Japanese')).toMatchObject({ ethnicity: '', nationality: 'Japanese' });
    expect(splitOrigin('')).toMatchObject({ ethnicity: '', nationality: '', descriptor: '' });
  });

  it('prefers the longer match, so "south asian" is not "asian"', () => {
    expect(splitOrigin('South Asian').ethnicity).toBe('South Asian');
  });
});

describe('writing the sentence back', () => {
  it('renders the fields the way the writer has always seen them', () => {
    expect(composeBioLead({ age: 21, ethnicity: 'Asian', nationality: 'Canadian', sexuality: 'lesbian' }))
      .toBe('21, Asian Canadian, lesbian.');
  });

  it('leaves out what the writer would assume anyway', () => {
    // `straight` has never appeared in a lead-in and should not start now.
    // Yul is ethnicity "Korean" and nationality "Korean", and a plain join
    // published him as "Korean Korean." The pair is ONE description of a
    // person, so it says the word once.
    expect(composeBioLead({ ethnicity: 'Korean', nationality: 'Korean' })).toBe('Korean.');
    // Same when one already opens with the other — the longer one wins.
    expect(composeBioLead({ ethnicity: 'Korean', nationality: 'Korean American' }))
      .toBe('Korean American.');
    // And two genuinely different words still join.
    expect(composeBioLead({ ethnicity: 'Asian', nationality: 'Canadian' })).toBe('Asian Canadian.');
    expect(composeBioLead({ age: 24, sexuality: 'straight' })).toBe('24.');
    expect(composeBioLead({})).toBe('');
  });

  it('survives a round trip', () => {
    for (const name of ['Jane', 'Obi', 'Doug', 'Zella', 'Hina']) {
      const bio = parseBio(profiles[name]);
      const rebuilt = composeVoice(bio, bio.prose);
      const again = parseBio(rebuilt);
      expect(again.age, name).toBe(bio.age);
      expect(again.ethnicity, name).toBe(bio.ethnicity);
      expect(again.nationality, name).toBe(bio.nationality);
      expect(again.prose, name).toBe(bio.prose);
    }
  });

  it('never stacks a second lead in front of the first', () => {
    // This has happened: editing a character whose Studio draft was missing
    // loaded their voice back out of the published file, which already had a
    // lead-in, and saving prepended another. Every edit added one more.
    const doubled = '24, Canadian. 21, Asian Canadian, lesbian. Quiet and anxious.';
    expect(stripBioLead(doubled)).toBe('Quiet and anxious.');
    const once = composeVoice({ age: 21 }, stripBioLead(doubled));
    expect(once).toBe('21. Quiet and anxious.');
    expect(stripBioLead(once)).toBe('Quiet and anxious.');
  });
});

describe('the backfill this makes possible', () => {
  it('turns the shipped profiles into rows nobody has to retype', () => {
    // What the generated SQL will contain. Asserted here so a parser change that
    // silently stops filling a column is visible in a test rather than in a
    // database three weeks later.
    const rows = Object.entries(profiles)
      .map(([name, text]) => ({ name, ...parseBio(text) }))
      .filter(r => r.age != null);

    // Same reason as above: the set grows as bios are authored, so this
    // checks the backfill is substantial rather than pinning a number that
    // real work moves.
    expect(rows.length).toBeGreaterThan(20);
    expect(rows.filter(r => r.ethnicity).length).toBeGreaterThan(3);
    expect(rows.filter(r => r.nationality).length).toBeGreaterThan(8);
    expect(rows.filter(r => r.sexuality).length).toBeGreaterThan(10);
    // A range, not the exact extremes — the extremes move whenever somebody is
    // given an age in the Studio, and this pinned 65 until a 73-year-old
    // existed. What it is really checking is that the parser is reading ages
    // and not, say, a year out of a sentence.
    expect(Math.min(...rows.map(r => r.age))).toBeGreaterThanOrEqual(14);
    expect(Math.max(...rows.map(r => r.age))).toBeLessThan(100);
  });
});

// The same join lived in FOUR places — the bio lead, the wiki infobox, the
// wiki bio line, and the casting-interview prompt — and fixing only the first
// left Yul reading "Korean Korean" on his own article. One rule, one home,
// and a test that says so.
describe('ethnicity and nationality are one description', () => {
  it('says the word once when they are the same word', () => {
    expect(joinOrigin('Korean', 'Korean')).toBe('Korean');
    expect(joinOrigin('korean', 'Korean')).toBe('korean');
  });

  it('keeps the longer one when it already contains the other', () => {
    expect(joinOrigin('Korean', 'Korean American')).toBe('Korean American');
    expect(joinOrigin('Puerto Rican American', 'Puerto Rican')).toBe('Puerto Rican American');
  });

  it('joins two genuinely different words', () => {
    expect(joinOrigin('Asian', 'Canadian')).toBe('Asian Canadian');
  });

  it('handles one side being missing', () => {
    expect(joinOrigin('Black', '')).toBe('Black');
    expect(joinOrigin('', 'Brazilian')).toBe('Brazilian');
    expect(joinOrigin('', '')).toBe('');
  });

  it('is the only implementation left', async () => {
    // A duplicated join is how this survived a fix. Any new copy fails here.
    const fs = await import('node:fs');
    const files = ['js/wiki-view.js', 'js/wiki.js', 'worker/worker-episode-live.js', 'js/bio.js'];
    for (const f of files) {
      const src = fs.readFileSync(f, 'utf8');
      expect(src, `${f} has its own ethnicity+nationality join again`)
        .not.toMatch(/\[\s*\w*\.?ethnicity,\s*\w*\.?nationality\s*\]\s*\.filter\(Boolean\)\.join/);
    }
  });
});
