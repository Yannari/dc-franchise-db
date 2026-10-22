// The user, 2026-10-21: Create Character should "import a sort of txt or json so i can fill these out quicker
// rather than typing 1 case by case", with Import and Export beside Save. js/character-file.js reads the file.
import { describe, expect, it } from 'vitest';
import { parseCharacterText, normalizeCharacter, characterToFile } from '../js/character-file.js';

const STATS = ['physical', 'endurance', 'mental', 'social', 'strategic', 'loyalty', 'boldness', 'intuition', 'temperament'];
const vocab = {
  archetypes: ['mastermind', 'schemer', 'hothead', 'challenge-beast', 'social-butterfly', 'loyal-soldier', 'wildcard', 'chaos-agent', 'floater', 'underdog', 'hero', 'villain', 'goat', 'perceptive-player', 'showmancer'],
  sexes: ['straight', 'gay', 'bi', 'lesbian', 'queer', 'asexual'],
  statKeys: STATS,
  dragKeys: ['acting', 'comedy', 'dance', 'design', 'runway', 'lipsync', 'singing'],
  dragStyles: ['pageant', 'comedy', 'camp'],
  dragTraits: ['padded', 'wit', 'face'],
  interviewKeys: ['why', 'fear'],
};
const read = text => normalizeCharacter(parseCharacterText(text).raw, vocab);

describe('a hand-written .txt', () => {
  const txt = `Name: Jade Lin
Age: 24
Pronouns: she/her
Orientation: Bisexual
Archetype: Social Butterfly
Hometown: Vancouver, BC
Job: Barista
Stats: physical 6, mental 8, social 9
Boldness: 7
Backstory:
Youngest of three sisters.
Note: she never lost an argument at dinner.
Personality: Warm until crossed.`;

  it('fills every labelled field, in the editor\'s own values', () => {
    const got = read(txt);
    expect(got.fields).toMatchObject({ name: 'Jade Lin', age: '24', gender: 'f', sexuality: 'bi', archetype: 'social-butterfly', hometown: 'Vancouver, BC', occupation: 'Barista', personality: 'Warm until crossed.' });
    expect(got.stats).toEqual({ physical: 6, mental: 8, social: 9, boldness: 7 });
    expect(got.skipped).toEqual([]);
  });
  it('a label it does not know inside prose stays prose: the backstory runs on to the next known label', () => {
    expect(read(txt).fields.backstory).toBe('Youngest of three sisters.\nNote: she never lost an argument at dinner.');
  });
});

describe('what it refuses', () => {
  it('a stat or an archetype the game does not have is reported, not kept', () => {
    const got = read('Name: X\nCharisma: 9\nArchetype: brainiac\nPhysical: 14');
    expect(got.stats).toEqual({ physical: 10 });
    expect(got.fields.archetype).toBeUndefined();
    expect(got.skipped.join(' | ')).toMatch(/charisma: not a stat/);
    expect(got.skipped.join(' | ')).toMatch(/brainiac/);
  });
  it('broken JSON says so', () => {
    expect(parseCharacterText('{ "name": ').error).toMatch(/JSON/);
  });
});

describe('JSON both ways', () => {
  it('an exported sheet reads back to the same sheet', () => {
    const d = { name: 'Rook', slug: 'rook', age: '30', birthdate: '', gender: 'm', sexuality: 'gay', archetype: 'villain',
      ethnicity: 'Black', nationality: 'British', descriptor: '', hometown: 'Leeds', occupation: 'Chef', voice: 'Clipped.',
      backstory: 'Ran a kitchen at 22.', personality: '', speakingVoice: '', continuityNote: '',
      stats: Object.fromEntries(STATS.map((k, i) => [k, (i % 9) + 1])),
      ties: [{ name: 'Jade Lin', kin: 'siblings' }], interview: { why: 'To win.' } };
    const file = characterToFile(d, { statKeys: STATS, interviewKeys: vocab.interviewKeys, dragOut: { lipsync: 9, style: 'camp', traits: ['wit'] } });
    const got = normalizeCharacter(parseCharacterText(JSON.stringify(file)).raw, vocab);
    expect(got.fields).toMatchObject({ name: 'Rook', slug: 'rook', age: '30', gender: 'm', sexuality: 'gay', archetype: 'villain', hometown: 'Leeds', backstory: 'Ran a kitchen at 22.' });
    expect(got.stats).toEqual(d.stats);
    expect(got.ties).toEqual(d.ties);
    expect(got.interview).toEqual({ why: 'To win.' });
    expect(got.drag).toMatchObject({ lipsync: 9, style: 'camp', traits: ['wit'] });
    expect(got.skipped).toEqual([]);
  });
  it('an exported blank sheet is a template with every field in it', () => {
    const file = characterToFile({}, { statKeys: STATS, interviewKeys: vocab.interviewKeys });
    expect(Object.keys(file)).toEqual(expect.arrayContaining(['name', 'age', 'gender', 'archetype', 'backstory', 'stats', 'ties', 'interview']));
    expect(Object.keys(file.stats)).toEqual(STATS);
  });
  it('a roster file gives its first player, and says how many it had', () => {
    const p = parseCharacterText(JSON.stringify({ players: [{ name: 'A', archetype: 'hero' }, { name: 'B' }] }));
    expect(p.raw.name).toBe('A');
    expect(p.extra).toBe(1);
  });
});
