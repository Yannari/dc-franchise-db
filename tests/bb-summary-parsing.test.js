// Nobody is eliminated in Big Brother. They are evicted, and once the
// episode writer was taught to say so, the roster parser stopped recognising
// its own output: === EVICTED === matched nothing, so every houseguest who
// had already left the house stayed lit up as still playing.
//
// These run the real functions out of current-season.html rather than
// grepping for the regex, because the regex being present is not the claim —
// the claim is that a Big Brother meta block greys the right people.
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const page = readFileSync('current-season.html', 'utf8');

/** Lift a function out of the page by name and hand back a callable. */
function lift(...names) {
  let src = '';
  for (const name of names) {
    const start = page.indexOf('function ' + name + '(');
    expect(start, name + ' is missing from current-season.html').toBeGreaterThan(-1);
    // Walk braces from the first { after the signature.
    let i = page.indexOf('{', start), depth = 0;
    for (; i < page.length; i++) {
      if (page[i] === '{') depth++;
      else if (page[i] === '}' && --depth === 0) { i++; break; }
    }
    src += page.slice(start, i) + '\n';
  }
  return new Function(src + 'return {' + names.join(',') + '};')();
}

const { parseEliminated } = lift('parseEliminated', 'cleanNameLine', 'isProbablyName');
const { parseCastFromSummary } = lift('parseCastFromSummary', 'parseBlock', 'cleanNameLine', 'isProbablyName');

const BB_WEEK = `=== META ===
SEASON: Big Brother
WEEK 4 - "The Interrogation"

=== CAST (ALL) ===
Aaron
Ireland
Joel
Nico
Stella
Tobias

=== STILL IN THE HOUSE ===
Aaron
Ireland
Nico
Tobias

=== EVICTED ===
Stella
Joel

=== JURY ===
Joel

---

## HEAD OF HOUSEHOLD
Nico wins.
`;

const TD_EPISODE = `=== META ===
SEASON: Total Drama

=== CAST (ALL) ===
Bowie
Chase
Ripper

=== TRIBES (ACTIVE) ===
# Yellow
Bowie
Chase

=== ELIMINATED (PERMANENT) ===
Ripper

---
`;

describe('a Big Brother meta block', () => {
  it('greys the evicted', () => {
    const out = parseEliminated(BB_WEEK);
    expect(out).toContain('Stella');
    expect(out).toContain('Joel');
  });

  it('greys jurors too, and only names each of them once', () => {
    // Joel is under both EVICTED and JURY. He is one person and he is out.
    const out = parseEliminated(BB_WEEK);
    expect(out.filter(n => n === 'Joel')).toHaveLength(1);
  });

  it('leaves the house alone', () => {
    const out = parseEliminated(BB_WEEK).map(n => n.toLowerCase());
    for (const still of ['Aaron', 'Ireland', 'Nico', 'Tobias']) {
      expect(out).not.toContain(still.toLowerCase());
    }
  });

  it('reads the house as the active roster even with no tribe headers', () => {
    const cast = parseCastFromSummary(BB_WEEK);
    for (const name of ['Aaron', 'Ireland', 'Joel', 'Nico', 'Stella', 'Tobias']) {
      expect(cast).toContain(name);
    }
  });

  it('does not stop at the first block that closes', () => {
    // The old loop broke out at the next === header, so whichever of EVICTED
    // and JURY came second was never read at all.
    const juryFirst = BB_WEEK
      .replace('=== EVICTED ===\nStella\nJoel', '=== JURY ===\nJoel')
      .replace('=== JURY ===\nJoel\n\n---', '=== EVICTED ===\nStella\nJoel\n\n---');
    const out = parseEliminated(juryFirst);
    expect(out).toContain('Stella');
    expect(out).toContain('Joel');
  });
});

describe('Total Drama still parses exactly as before', () => {
  it('reads ELIMINATED (PERMANENT)', () => {
    expect(parseEliminated(TD_EPISODE)).toEqual(['Ripper']);
  });

  it('reads tribes with # headers', () => {
    const cast = parseCastFromSummary(TD_EPISODE);
    expect(cast).toContain('Bowie');
    expect(cast).toContain('Chase');
    expect(cast).toContain('Ripper');
    expect(cast).not.toContain('Yellow');
  });

  it('does not treat a WHY X WAS ELIMINATED heading as a roster block', () => {
    const withHeading = TD_EPISODE + '\n=== WHY RIPPER WAS ELIMINATED ===\nChase\nBowie\n';
    expect(parseEliminated(withHeading)).toEqual(['Ripper']);
  });
});
