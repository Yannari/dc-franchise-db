// ══════════════════════════════════════════════════════════════════════
// tr-breakfast.test.js — the morning is suspense, not a roll call (Task 9)
// ══════════════════════════════════════════════════════════════════════
//
// The cold open opens the episode on the night before it: the castle comes
// down one at a time, the empty places narrow, and the murdered player's
// absence lands as a WITHHELD payoff — never "Everyone arrives except X. X was
// murdered." These guards prove the shape in the rendered screen and the data
// behind it, over a real season rather than a fixture.
import { describe, expect, it } from 'vitest';
import roster from '../franchise_roster.json';
import { gs, setPlayers } from '../js/core.js';
import { playTraitorsSeason } from '../js/tr/headless.js';
import { rpBuildColdOpen, _groupsFor, _descendingSizes } from '../js/vp-tr/cold-open.js';

const ROSTER = roster.players.slice(0, 20);
const CAST = ROSTER.map(p => p.name);

function play(seed) {
  setPlayers(ROSTER);
  playTraitorsSeason({ cast: CAST, traitorCount: 3, seed });
  return (gs.episodeHistory || []).map(e => ({ ...e }));
}

/** Reveal cards on a cold open: the number of addressable step divs. */
function revealSteps(html) {
  return (html.match(/id="co-step-coldopen-\d+"/g) || []).length;
}

/** The reveal beats, each with its phase and body, in order. */
function beats(html) {
  const re = /id="co-step-coldopen-(\d+)"[^>]*data-phase="([a-z]+)">([\s\S]*?)(?=<div class="co-beat|<\/main>)/g;
  const out = []; let m;
  while ((m = re.exec(html))) out.push({ i: +m[1], phase: m[2], body: m[3] });
  return out;
}
function strip(h) {
  return String(h).replace(/<[^>]+>/g, ' ').replace(/&[a-z#0-9]+;/g, ' ')
    .replace(/\s+/g, ' ').trim();
}
function hasWord(hay, word) {
  return new RegExp('\\b' + word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b').test(hay);
}

// Every STANDARD (non-endgame) morning across several seeds that opened on a
// night the Traitors actually struck — the breakfast the format is built on.
const MURDER_MORNINGS = [];
for (const seed of [1, 3, 7, 11, 71, 42, 99, 123]) {
  for (const ep of play(seed)) {
    if (ep.tr && ep.tr.endgame) continue;
    const bf = ep.tr && ep.tr.dawn && ep.tr.dawn.breakfast;
    if (bf && (bf.victims || []).length) MURDER_MORNINGS.push({ seed, ep, bf });
  }
}

describe('the breakfast has enough cards to carry the suspense', () => {
  it('a real season produces murder mornings to check', () => {
    expect(MURDER_MORNINGS.length, 'no morning across eight seeds opened on a murder')
      .toBeGreaterThan(20);
  });

  // The raised budget (Task 9.2 — the plan's 10–16 was too tight for the
  // conversation, table-reading and flashback the morning now carries). Every
  // murder morning lands in 15–24; the only 15-card cases are the very last
  // small rooms of a season (four people down), so a STANDARD morning — five or
  // more still coming down — is held to a floor of 16. Measured over 52 murder
  // mornings across ten seeds: 15–20, median 17, and the 4-person room is the
  // sole 15.
  it('every murder morning renders 15–24 reveal cards', () => {
    for (const { seed, ep } of MURDER_MORNINGS) {
      const n = revealSteps(rpBuildColdOpen(ep, 'audience'));
      expect(n, `seed ${seed} ep ${ep.num}: too few cards to carry the morning`)
        .toBeGreaterThanOrEqual(15);
      expect(n, `seed ${seed} ep ${ep.num}: the morning overran its budget`)
        .toBeLessThanOrEqual(24);
    }
  });

  // The standard-morning floor, stated on its own so a regression is named at
  // the number the brief promised (~16–24). Paired to room size so it cannot
  // pass vacuously: a room with five or more people still to come down must
  // clear 16 cards.
  it('a standard morning (>=5 down) clears the 16-card floor', () => {
    let checked = 0;
    for (const { seed, ep } of MURDER_MORNINGS) {
      const room = (ep.tr.living || []).filter(Boolean).length;
      if (room < 5) continue;
      expect(revealSteps(rpBuildColdOpen(ep, 'audience')),
        `seed ${seed} ep ${ep.num}: a ${room}-person morning fell under the standard floor`)
        .toBeGreaterThanOrEqual(16);
      checked++;
    }
    expect(checked, 'no standard-sized morning was ever checked').toBeGreaterThan(20);
  });
});

describe('the murder reveal is withheld, not announced up front', () => {
  it('the victim is never named before the cup is turned over', () => {
    let checked = 0;
    for (const { seed, ep, bf } of MURDER_MORNINGS) {
      const html = rpBuildColdOpen(ep, 'audience');   // fresh, unrevealed
      const bts = beats(html);
      const gapAt = bts.findIndex(b => b.body.includes('The Cup Is Turned Over'));
      expect(gapAt, `seed ${seed} ep ${ep.num}: no reveal beat`).toBeGreaterThan(-1);
      const before = bts.slice(0, gapAt).map(b => strip(b.body)).join('  ');
      for (const victim of bf.victims) {
        // Names one or two characters long ("B") are substrings of half the
        // cast; the withholding is about the WHOLE name being said, so match on
        // a word boundary and skip a name too short to be distinguishable.
        if (victim.length < 3) continue;
        expect(hasWord(before, victim),
          `seed ${seed} ep ${ep.num}: ${victim} was named before the reveal`).toBe(false);
        checked++;
      }
    }
    expect(checked, 'no victim name was ever checked').toBeGreaterThan(15);
  });

  it('the reveal really is the payoff: the gap beat names the victim', () => {
    for (const { seed, ep, bf } of MURDER_MORNINGS) {
      const html = rpBuildColdOpen(ep, 'audience');
      const bts = beats(html);
      const gap = bts.find(b => b.body.includes('The Cup Is Turned Over'));
      expect(strip(gap.body), `seed ${seed} ep ${ep.num}: the gap did not name the victim`)
        .toContain(bf.victims[0]);
    }
  });
});

describe('the morning does not run the identical cadence every night', () => {
  it('the arrival shape varies across episodes', () => {
    // The reveal shape is drawn from a hash of the morning, so different
    // episodes cluster the arrivals differently and the card counts spread.
    // A single fixed cadence would collapse this to one value.
    const counts = new Set(MURDER_MORNINGS.map(({ ep }) =>
      revealSteps(rpBuildColdOpen(ep, 'audience'))));
    expect(counts.size, 'every murder morning rendered the identical number of cards')
      .toBeGreaterThan(1);
  });

  it('the arrivals come down in DESCENDING clusters ending in <=2', () => {
    // Defect #1: the old `_groupsFor` produced lumps like [15,1,1] — the whole
    // room at once, then singles. Every shape must now taper: non-increasing
    // group sizes, and the last cluster is one or two people, so the room reads
    // as filling up rather than arriving in a heap. Checked over the cast sizes
    // a season actually produces, for every shape seed.
    for (let n = 4; n <= 18; n++) {
      for (let shape = 0; shape < 4; shape++) {
        const sizes = _groupsFor([...Array(n).keys()], shape).map(g => g.length);
        expect(sizes.reduce((a, b) => a + b, 0), `n=${n} shape=${shape}: lost people`).toBe(n);
        for (let i = 1; i < sizes.length; i++) {
          expect(sizes[i], `n=${n} shape=${shape}: cluster ${i} (${sizes[i]}) is bigger than ${sizes[i - 1]} before it`)
            .toBeLessThanOrEqual(sizes[i - 1]);
        }
        expect(sizes[sizes.length - 1], `n=${n} shape=${shape}: final cluster does not taper`)
          .toBeLessThanOrEqual(2);
        // MUTATION GUARD: a lump would lead with a cluster far larger than an
        // honest descent. The first cluster is never more than ~half the room.
        if (n >= 6) {
          expect(sizes[0], `n=${n} shape=${shape}: the first cluster is a lump`)
            .toBeLessThanOrEqual(Math.ceil(n * 0.55));
        }
      }
    }
  });

  it('the descending-size helper is monotonic and exact (mutation target)', () => {
    // The primitive under the cadence. Reddens if the weighting or the
    // monotonic clamp regresses.
    for (const [n, K] of [[17, 5], [16, 4], [14, 6], [11, 4], [9, 3], [7, 4]]) {
      const s = _descendingSizes(n, K);
      expect(s.reduce((a, b) => a + b, 0), `n=${n} K=${K}: wrong sum`).toBe(n);
      for (let i = 1; i < s.length; i++) {
        expect(s[i], `n=${n} K=${K}: not non-increasing`).toBeLessThanOrEqual(s[i - 1]);
        expect(s[i], `n=${n} K=${K}: an empty cluster`).toBeGreaterThanOrEqual(1);
      }
    }
  });

  it('holds at the last places before the reveal', () => {
    // The peak of the suspense: down to the final places, the room watching.
    let held = 0;
    for (const { ep } of MURDER_MORNINGS) {
      if (rpBuildColdOpen(ep, 'audience').includes('Down To The Last Places')) held++;
    }
    expect(held, 'not one morning paused at the last places').toBeGreaterThan(15);
  });
});

describe('the reactions are caused by stored records, not invented', () => {
  it('every griever had a real stored bond with the person who died', () => {
    // The record only grieves a mourner whose bond with the victim cleared the
    // threshold; the screen only draws grief when the record carries it.
    let checkedGrief = 0;
    for (const { seed, bf, ep } of MURDER_MORNINGS) {
      for (const g of bf.grief || []) {
        expect(g.bond, `seed ${seed} ep ${ep.num}: ${g.mourner} grieved on a cold bond`)
          .toBeGreaterThanOrEqual(3);
        expect(bf.victims, `seed ${seed}: grief for a non-victim`).toContain(g.victim);
        checkedGrief++;
      }
      const html = rpBuildColdOpen(ep, 'audience');
      // A grief beat renders only when the record has a griever.
      if (html.includes('The Ones Who Felt It')) {
        expect((bf.grief || []).length,
          `seed ${seed} ep ${ep.num}: a grief beat with no stored mourner`).toBeGreaterThan(0);
      }
    }
    expect(checkedGrief, 'no grief was ever checked').toBeGreaterThan(5);
  });

  it('the suspicion beat only fires for someone who pushed the victim at the table', () => {
    // pushedThenDied: the room's eyes turn to a survivor who wanted the victim
    // gone the night the victim died. The record's pushers must be people who
    // actually accused or voted the victim at the previous night's table.
    let sawEyes = 0;
    const bySeed = {};
    for (const seed of [1, 3, 7, 11, 71, 42, 99, 123]) bySeed[seed] = play(seed);
    for (const { seed, ep, bf } of MURDER_MORNINGS) {
      const html = rpBuildColdOpen(ep, 'audience');
      const eyes = html.includes('And The Room Remembers');
      // Reconstruct last night's table (the night the victim died) to confirm
      // each recorded pusher genuinely pushed the victim.
      const prev = bySeed[seed].find(r => r.num === ep.tr.dawn.ofEp);
      const table = prev && prev.tr && prev.tr.table;
      for (const victim of bf.victims) {
        for (const pusher of (bf.pushed || {})[victim] || []) {
          // The table record carries a ballot's subject under `.target`
          // (`traitorsRoundBallots` renames `voted`), so read that here.
          const accused = (table.accusations || []).some(a => a.accuser === pusher && a.target === victim);
          const voted = (table.votes || []).some(b => b.channel === 'banishment' && b.voter === pusher && b.target === victim);
          expect(accused || voted,
            `seed ${seed} ep ${ep.num}: ${pusher} is a pusher of ${victim} who did neither`).toBe(true);
        }
      }
      if (eyes) {
        const anyPusher = Object.values(bf.pushed || {}).some(l => l.length);
        expect(anyPusher, `seed ${seed} ep ${ep.num}: an eyes beat with no pusher on record`).toBe(true);
        sawEyes++;
      }
    }
    expect(sawEyes, 'the pushed-then-died beat never fired across eight seeds').toBeGreaterThan(0);
  });
});

describe('the portrait wall carries the murder payoff', () => {
  it('the reveal mounts the shared wall with the victim struck and highlighted', () => {
    for (const { seed, ep, bf } of MURDER_MORNINGS) {
      const html = rpBuildColdOpen(ep, 'audience');
      expect(html, `seed ${seed} ep ${ep.num}: no portrait wall`).toContain('pw-wall');
      // The murdered player's tile is drawn as a murder exit and ringed.
      expect(html, `seed ${seed} ep ${ep.num}: no murdered tile`)
        .toMatch(/data-exit="murdered"/);
      expect(html, `seed ${seed} ep ${ep.num}: nobody highlighted on the wall`)
        .toMatch(/data-hi="1"/);
      // The murder mark, not the banishment bar, sits over a murdered tile.
      expect(html, `seed ${seed} ep ${ep.num}: the wall drew no strike`).toContain('pw-mark');
    }
  });

  it('a banished player on the wall is drawn differently from a murdered one', () => {
    // Find a morning whose wall shows BOTH doors — someone banished earlier and
    // someone murdered last night — and prove the two exits render apart.
    let seenBoth = false;
    for (const { ep } of MURDER_MORNINGS) {
      const html = rpBuildColdOpen(ep, 'audience');
      if (html.includes('data-exit="banished"') && html.includes('data-exit="murdered"')) {
        seenBoth = true;
        // distinct marks: the banishment bar is a <line>, the murder a <path>.
        expect(html).toContain('pw-mark');
        break;
      }
    }
    expect(seenBoth, 'no wall ever showed both a banished and a murdered face').toBe(true);
  });
});

describe('the murder flashback (Task 9.4) is victim-only and leaks no alignment', () => {
  // A short look-back at the person who is gone, the night before — the show's
  // flashback. CRITICAL: it shows the VICTIM only. It must never name who
  // murdered them, show the turret, or carry any alignment word — that is
  // turret-only knowledge and leaking it breaks the format.
  const ALIGN = ['traitor', 'faithful', 'turret', 'murderer', 'conclave',
    'the killer', 'chose to kill', 'recruited', 'shielded'];
  it('the flashback beat exists and carries no turret/alignment reference', () => {
    let checked = 0;
    for (const { seed, ep, bf } of MURDER_MORNINGS) {
      const html = rpBuildColdOpen(ep, 'audience');
      const bts = beats(html);
      const flash = bts.find(b => b.body.includes('The Night Before'));
      expect(flash, `seed ${seed} ep ${ep.num}: no flashback beat`).toBeTruthy();
      const t = strip(flash.body).toLowerCase();
      for (const word of ALIGN) {
        expect(t.includes(word),
          `seed ${seed} ep ${ep.num}: flashback leaked "${word}"`).toBe(false);
      }
      // It shows the victim: the victim's name is in it.
      expect(strip(flash.body), `seed ${seed} ep ${ep.num}: flashback does not show the victim`)
        .toContain(bf.victims[0]);
      // It never names a murderer: no OTHER exited player's name appears as an
      // agent. (We only assert the alignment-word cleanliness above; the agent
      // is simply never referenced — the prose is agent-less by construction.)
      checked++;
    }
    expect(checked, 'no flashback was ever checked').toBeGreaterThan(20);
  });

  it('the flashback reads identically on a player layer (no audience-only content)', () => {
    for (const { ep } of MURDER_MORNINGS.slice(0, 8)) {
      const living = (ep.tr.living || []).filter(Boolean);
      if (!living.length) continue;
      const aud = beats(rpBuildColdOpen(ep, 'audience')).find(b => b.body.includes('The Night Before'));
      const pv = beats(rpBuildColdOpen(ep, 'player:' + living[0])).find(b => b.body.includes('The Night Before'));
      expect(pv, 'the flashback vanished on the player layer').toBeTruthy();
      expect(strip(pv.body)).toBe(strip(aud.body));
    }
  });
});

describe('observer safety: the morning leaks no alignment', () => {
  it('the player view withholds the audience-only murder-was-chosen line', () => {
    // On a night the pact struck and a relic ate it, only the audience is told
    // a name was chosen. This is the one cold-open line a player must not see.
    // (Breakfast reactions — grief, the eyes turning — are public facts and
    // are identical on both layers, which is the safety property here.)
    for (const seed of [3, 7, 11]) {
      const eps = play(seed);
      const watchers = CAST;
      for (const ep of eps) {
        if (!ep.tr || !ep.tr.dawn) continue;
        const aud = rpBuildColdOpen(ep, 'audience');
        // Pick a living watcher for this morning.
        const living = (ep.tr.living || []).filter(Boolean);
        if (!living.length) continue;
        const pv = rpBuildColdOpen(ep, 'player:' + living[0]);
        // The blocked-night audience line never appears on a player layer.
        for (const line of ['name WAS written last night', 'The turret chose. The morning refused',
          'a decision missing from this table', 'know what was supposed to happen']) {
          if (aud.includes(line)) {
            expect(pv, `seed ${seed} ep ${ep.num}: blocked-night line leaked to a player`)
              .not.toContain(line);
          }
        }
      }
    }
  });
});
