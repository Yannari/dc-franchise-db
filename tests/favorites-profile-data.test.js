import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { composeVoice, stripBioLead } from '../js/bio.js';

const expected = ['bowie','mike','millie','thom','grett','gabby','james','lake','yul','natalia','julia','dj'];
const validStats = ['physical','endurance','mental','social','strategic','loyalty','boldness','intuition','temperament'];
const kinds = new Set(['source-canon','simulator-continuity','interpretation','authored']);
const roster = JSON.parse(readFileSync('franchise_roster.json','utf8')).players;
const voices = JSON.parse(readFileSync('voice-profiles.json','utf8')).profiles;

describe('Favorites source profiles', () => {
  for (const slug of expected) it(`${slug} is complete and provenance-safe`, () => {
    const p = roster.find(x => x.slug === slug);
    expect(p, slug).toBeTruthy();
    expect(p.voice.length, `${slug} voice`).toBeGreaterThan(80);
    expect(p.personality.length, `${slug} personality`).toBeGreaterThan(180);
    expect(p.backstory.length, `${slug} backstory`).toBeGreaterThan(120);
    expect(p.profileSources.personality.length, `${slug} personality sources`).toBeGreaterThan(0);
    expect(p.profileSources.voice.length, `${slug} voice sources`).toBeGreaterThan(0);
    expect(Object.keys(p.stats).sort()).toEqual([...validStats].sort());
    for (const sources of Object.values(p.profileSources)) for (const source of sources) expect(kinds.has(source.kind)).toBe(true);
    expect(voices[p.name]).toBe(composeVoice(p, stripBioLead(p.voice)));
  });

  it('publishes only verified birthdays', () => {
    const dated = Object.fromEntries(expected.map(slug => [slug, roster.find(p => p.slug === slug).birthdate || '']));
    expect(dated).toEqual({ bowie:'', mike:'', millie:'', thom:'1993-06-12', grett:'1999-10-25', gabby:'', james:'1998-05-29', lake:'', yul:'2001-07-24', natalia:'1996-08-03', julia:'', dj:'' });
  });
});