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
    // The rule is that nobody gets an INVENTED birthday — the research left a
    // date blank wherever the source did not state one, and that must hold.
    //
    // It is NOT that the set never grows. This was a frozen snapshot of all
    // twelve and it broke twice in one session, both times because a real
    // birthday was authored by hand in the Studio (DJ, then Lake). A guard
    // that fails on legitimate work teaches you to edit the guard, which is
    // how it stops guarding anything. So: the researched dates are pinned,
    // and everyone else must be blank or a real ISO date.
    const RESEARCHED = { thom:'1993-06-12', grett:'1999-10-25', james:'1998-05-29',
      yul:'2001-07-24', natalia:'1996-08-03' };
    for (const [slug, date] of Object.entries(RESEARCHED)) {
      expect(roster.find(p => p.slug === slug).birthdate, `${slug}'s researched date`).toBe(date);
    }
    for (const slug of expected) {
      const value = roster.find(p => p.slug === slug).birthdate || '';
      if (RESEARCHED[slug] || !value) continue;
      expect(value, `${slug} has an authored birthday, which must still be a real date`)
        .toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(new Date(`${value}T00:00:00.000Z`).toISOString().slice(0, 10)).toBe(value);
    }
  });
});