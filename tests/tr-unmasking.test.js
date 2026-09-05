// ══════════════════════════════════════════════════════════════════════
// tr-unmasking.test.js — the finale turns the room over
// ══════════════════════════════════════════════════════════════════════
//
// The ending used to be a list of who got paid. The room agreed to stop, the
// money was announced, and the season's actual question — what were these
// people — was answered only by implication in that list. Nobody ever turned
// over, and the format's most famous scene did not exist on the screen.
//
// The real game (thetraitors.fandom.com/wiki/End_Game) plays the finale as
// "vote or end": every remaining player secretly picks END or BANISH AGAIN,
// one BANISH sends the whole room to another table, and — since 2024 — nobody
// banished in the endgame reveals their alignment. So the moment the room
// finally agrees to stop is the ONLY moment the truth becomes sayable, for the
// players and for the audience at once. That is what these beats are.
import { describe, it, expect } from 'vitest';
import { gs, setPlayers } from '../js/core.js';
import { playTraitorsSeason } from '../js/tr/headless.js';
import { TRAITORS_SCREENS } from '../js/vp-tr/screens.js';
import roster from '../franchise_roster.json';

const CAST = roster.players.slice(0, 16);
const SEEDS = [11, 23, 37, 41, 59, 101, 131, 151, 199];

function finale(seed) {
  setPlayers(CAST.map(p => ({ ...p })));
  playTraitorsSeason({ cast: CAST.map(p => p.name), traitorCount: 3, seed });
  const row = (gs.episodeHistory || []).filter(e => e.tr && e.tr.endgame).pop();
  return row || null;
}
const screenFor = row => {
  const s = TRAITORS_SCREENS.find(x => x.when(row) && /end/i.test(x.id));
  return s ? s.build(row, 'audience') : '';
};
const text = html => String(html || '').replace(/<[^>]+>/g, ' ')
  .replace(/&ldquo;|&rdquo;/g, '"').replace(/\s+/g, ' ').trim();
/** Just the unmasking cards, in order. */
const unmaskCards = html => String(html).split('<div class="lt-card"')
  .filter(c => /data-kind="unmask"/.test(c));

const RUNS = SEEDS.map(finale).filter(Boolean);

describe('the record carries the truth, rather than the screen inferring it', () => {
  it('every survivor is on the reveal list exactly once', () => {
    for (const row of RUNS) {
      const eg = row.tr.endgame;
      const named = eg.reveals.map(r => r.name);
      expect(new Set(named).size, 'somebody is revealed twice').toBe(named.length);
      expect([...named].sort()).toEqual([...eg.survivors].sort());
    }
  });

  it('the roles agree with who took the money', () => {
    // The takers ARE the pact when the pact survives. That inference is what
    // the screen used to have to make; the point of recording `reveals` is
    // that the two can never disagree, so this asserts they do not.
    for (const row of RUNS) {
      const eg = row.tr.endgame;
      const traitors = eg.reveals.filter(r => r.role === 'traitor').map(r => r.name);
      if (eg.winner === 'traitors') {
        expect(traitors.length, 'a Traitor win with no Traitor revealed').toBeGreaterThan(0);
        expect([...traitors].sort()).toEqual([...eg.takers].sort());
      } else {
        expect(traitors, 'a Faithful win with a Traitor still standing').toEqual([]);
      }
    }
  });

  it('reveals Faithfuls first and the pact last', () => {
    // Seating order would give the ending away halfway through.
    for (const row of RUNS) {
      const roles = row.tr.endgame.reveals.map(r => r.role);
      const firstTraitor = roles.indexOf('traitor');
      if (firstTraitor === -1) continue;
      expect(roles.slice(firstTraitor).every(r => r === 'traitor'),
        'a Faithful is revealed after a Traitor').toBe(true);
    }
  });

  it('records what the room banished blind', () => {
    for (const row of RUNS) {
      const eg = row.tr.endgame;
      const banished = (eg.tables || []).map(t => t.chosen).filter(Boolean);
      expect(eg.sentHome.map(x => x.name)).toEqual(banished);
      for (const x of eg.sentHome) expect(['traitor', 'faithful']).toContain(x.role);
    }
  });
});

describe('the screen plays it as a scene', () => {
  it('opens on a host speech, which is the thing it did not have', () => {
    for (const row of RUNS) {
      const cards = unmaskCards(screenFor(row));
      expect(cards.length, 'no unmasking at all').toBeGreaterThan(0);
      expect(text(cards[0])).toContain('The Last Question');
      expect(cards[0], 'the reveal is not framed by the host').toContain('lt-host');
    }
  });

  it('turns each person over on their own card, with the word said out loud', () => {
    for (const row of RUNS) {
      const eg = row.tr.endgame;
      const cards = unmaskCards(screenFor(row));
      const turns = cards.filter(c => /class="lt-turn"/.test(c));
      expect(turns.length, 'not one card per survivor').toBe(eg.reveals.length);
      eg.reveals.forEach((r, i) => {
        const t = turns[i];
        expect(t, `no card for ${r.name}`).toBeTruthy();
        expect(t).toContain('data-role="' + r.role + '"');
        expect(text(t)).toContain(r.name);
        expect(text(t)).toContain(r.role === 'traitor' ? 'Traitor' : 'Faithful');
      });
    }
  });

  it('spends the room\'s reaction on the cloaks, not on the honest', () => {
    for (const row of RUNS) {
      const eg = row.tr.endgame;
      const turns = unmaskCards(screenFor(row)).filter(c => /class="lt-turn"/.test(c));
      eg.reveals.forEach((r, i) => {
        const hasReact = /lt-react/.test(turns[i]);
        if (r.role === 'faithful') {
          expect(hasReact, `${r.name} is Faithful and the room gasped`).toBe(false);
        }
      });
      // And a Traitor among two or more DOES get one — otherwise the beat the
      // whole ending is for lands silently.
      const t = eg.reveals.findIndex(r => r.role === 'traitor');
      if (t > -1 && eg.reveals.length > 1) {
        expect(/lt-react/.test(turns[t]), 'a cloak turned over and nobody reacted').toBe(true);
      }
    }
  });

  it('says the blind banishments out loud, and counts them', () => {
    for (const row of RUNS) {
      const eg = row.tr.endgame;
      const cards = unmaskCards(screenFor(row));
      const sent = cards.find(c => /lt-sent/.test(c));
      if (!eg.sentHome.length) {
        expect(sent, 'a sent-home card with nobody sent home').toBeFalsy();
        continue;
      }
      expect(sent, 'the room banished blind and was never told what it did').toBeTruthy();
      for (const x of eg.sentHome) expect(text(sent)).toContain(x.name);
      const right = eg.sentHome.filter(x => x.role === 'traitor').length;
      expect(text(sent)).toContain('Cloaks found blind ' + right);
    }
  });

  it('never says the same sentence twice in one unmasking', () => {
    // Eight variants and five people turning over is a coin flip that two
    // collide, and a dumped finale had exactly that.
    for (const row of RUNS) {
      const lines = unmaskCards(screenFor(row))
        .filter(c => /class="lt-turn"/.test(c))
        .map(c => text(c.slice(c.indexOf('lt-turn-tx'))));
      const dupes = lines.filter((l, i) => lines.indexOf(l) !== i);
      expect(dupes, 'two people turned over in the same words').toEqual([]);
    }
  });

  it('turns the room over BEFORE it opens the box', () => {
    // The reveal explains the money; the money does not explain the reveal.
    for (const row of RUNS) {
      const html = screenFor(row);
      // The MARKUP, not the class name: the stylesheet is inlined above the
      // beats and names every class in it long before any card exists.
      const firstTurn = html.indexOf('<div class="lt-turn" data-role=');
      const box = html.indexOf('<div class="lt-verdict" data-side=');
      if (firstTurn === -1 || box === -1) continue;
      expect(firstTurn, 'the box is opened before anybody turns over').toBeLessThan(box);
    }
  });

  it('leaves no template hole in the new prose', () => {
    for (const row of RUNS) {
      for (const c of unmaskCards(screenFor(row))) {
        expect(c, 'a raw placeholder reached the finale').not.toMatch(/\{\w+\}/);
      }
    }
  });
});
