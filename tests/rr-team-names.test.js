// The Ridonculous Race: a team is "the Church Choir" (or "Nico and Jules") when it's talked about, and its two names
// when it's spoken to ("Natalia and Dunia, you're team number two!"). Never "Church Choir" bare, never "Nico & Jules".
import { describe, it, expect, beforeAll } from 'vitest';
import { fill } from '../js/rr/script/write.js';
import { rolesOf } from '../js/rr/script/roles.js';
import { SCENES } from '../js/rr/scenes.js';
import { airSeason, episodeText } from '../js/rr/episode.js';
import { playRaceSeason } from '../js/rr/season.js';
import { setPlayers } from '../js/core.js';
import { raceCast } from './helpers/rr-cast.js';

const slots = { team: 'the Church Choir', teamVoc: 'Natalia and Dunia', teamB: 'Nico and Jules', teamBVoc: 'Nico and Jules',
  number: 'two', placing: 'second' };

describe('rr team names in lines', () => {
  it('talked about: the team, capitalised at the start of a sentence', () => {
    expect(fill('We helped {team}.', {}, slots)).toBe('We helped the Church Choir.');
    expect(fill('{team} are right behind us.', {}, slots)).toBe('The Church Choir are right behind us.');
    expect(fill("And here's {team}, in {placing} place.", {}, slots)).toBe("And here's the Church Choir, in second place.");
  });

  it('spoken to: the two of them by name', () => {
    expect(fill("{team}, you're team number {number}!", {}, slots)).toBe("Natalia and Dunia, you're team number two!");
    expect(fill('Welcome to the Chill Zone, {team}. You made it.', {}, slots)).toBe('Welcome to the Chill Zone, Natalia and Dunia. You made it.');
    expect(fill('Mm. {team}. {placing}.', {}, slots)).toBe('Mm. Natalia and Dunia. Second.');
  });

  it('the winners named with their two names close the aside before a verb', () => {
    const w = { winners: 'the Skateboarders, Riya and Chef Hatchet' };
    expect(fill('Here we go! {winners} grab the first tip.', {}, w)).toBe('Here we go! The Skateboarders, Riya and Chef Hatchet, grab the first tip.');
    expect(fill('First out: {winners}.', {}, w)).toBe('First out: the Skateboarders, Riya and Chef Hatchet.');
    expect(fill('{winners} go first.', {}, { winners: 'best friends Carrie and Devin' })).toBe('Best friends Carrie and Devin go first.');
  });

  it("a plural name takes a bare apostrophe", () => {
    expect(fill("I'd take {team}'s case.", {}, slots)).toBe("I'd take the Church Choir's case.");
    expect(fill("I'd take {team}'s case.", {}, { team: 'the Lawyers' })).toBe("I'd take the Lawyers' case.");
  });
});

describe('rr team names in an aired season', () => {
  let res, text;
  beforeAll(() => {
    const { cast, teams } = raceCast(12, 8);
    setPlayers(cast);
    res = playRaceSeason({ teams, seed: 8 });
    text = airSeason(res).map((ep, i) => episodeText(res.state, res.legs[i], ep)).join('\n');
  });

  it('a scene gets the team talked-about and spoken-to', () => {
    const st = res.state;
    const sc = st.scenes.find(s => SCENES[s.kind] && s.data?.team && st.teams[s.data.team].identity);
    const t = st.teams[sc.data.team];
    const { slots: s } = rolesOf(sc, st);
    expect(s.team).toBe(`the ${t.name}`);
    expect(s.teamVoc).toBe(`${t.a} and ${t.b}`);
  });

  it('no spoken line says "team number second" or "Nico & Jules"', () => {
    const lines = text.split('\n').filter(l => /^\s+\S[^:]*: /.test(l) && !/^\s+(MAT|OUT): /.test(l));
    expect(lines.filter(l => /team number (first|second|third|[a-z]+th)\b/.test(l))).toEqual([]);
    expect(lines.filter(l => / & /.test(l.split(': ').slice(1).join(': ')))).toEqual([]);
  });
});
