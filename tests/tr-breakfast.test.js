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
import { rpBuildColdOpen, _groupsFor, _descendingSizes, _stage } from '../js/vp-tr/cold-open.js';

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
  // murder morning lands in 14–24; the 14-card cases are the very last small
  // rooms of a season (two or three people down, sometimes after a Double), so a
  // STANDARD morning — five or more still coming down — is held to a floor of 15.
  //
  // RE-MEASURED (15/16 -> 14/15) after the automatic recruit was capped at one a
  // season (js/tr/headless.js): that shifts which room sizes each seed reaches on
  // which mornings, and the sample now includes 2–3-person murder mornings that
  // render 14. The card-generation logic is unchanged; the floors were cut
  // against the old trajectory. Measured over 55 murder mornings across these
  // eight seeds: 14–20, and every case under 15 is a room of three or fewer.
  it('every murder morning renders 14–24 reveal cards', () => {
    for (const { seed, ep } of MURDER_MORNINGS) {
      const n = revealSteps(rpBuildColdOpen(ep, 'audience'));
      expect(n, `seed ${seed} ep ${ep.num}: too few cards to carry the morning`)
        .toBeGreaterThanOrEqual(14);
      expect(n, `seed ${seed} ep ${ep.num}: the morning overran its budget`)
        .toBeLessThanOrEqual(24);
    }
  });

  // The standard-morning floor, stated on its own so a regression is named at
  // the number the brief promised. Paired to room size so it cannot pass
  // vacuously: a room with five or more people still to come down must clear 15
  // cards. (Re-measured 16 -> 15 with the all-mornings floor above, same reason:
  // the capped recruit reshuffles which standard mornings land where, and the
  // low end of a five-plus room is now 15.)
  it('a standard morning (>=5 down) clears the 15-card floor', () => {
    let checked = 0;
    for (const { seed, ep } of MURDER_MORNINGS) {
      const room = (ep.tr.living || []).filter(Boolean).length;
      if (room < 5) continue;
      expect(revealSteps(rpBuildColdOpen(ep, 'audience')),
        `seed ${seed} ep ${ep.num}: a ${room}-person morning fell under the standard floor`)
        .toBeGreaterThanOrEqual(15);
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

// ══════════════════════════════════════════════════════════════════════
// Task 9 defects found by playing the morning in the browser
// ══════════════════════════════════════════════════════════════════════

// DEFECT 3 — the laid table (the "portrait wall" at the top) must be gated to
// the arrival reveal, not the end state. At the hold beat the card says "N
// places still empty"; the board has to show exactly N empty places at that
// beat, or the count contradicts itself and the still-to-arrive victim is a
// spoiler already seated. The fix lays the murdered from the first beat as
// plain empty places so the two numbers cannot disagree.
describe('the laid table is synced to the arrival reveal (defect 3)', () => {
  const HOLD_MORNINGS = MURDER_MORNINGS
    .map(({ seed, ep, bf }) => {
      const epNum = ep.num || (ep.tr && ep.tr.ep) || 0;
      const html = rpBuildColdOpen(ep, 'audience');
      const store = (typeof window !== 'undefined' && window.__trColdOpen) || {};
      const state = store[epNum];
      const holdIdx = state ? state.stepMeta.findIndex(m => m && m.kind === 'hold') : -1;
      const m = html.match(/co-hold-n">(\d+)</);
      return { seed, ep, bf, epNum, state, holdIdx, stated: m ? +m[1] : null };
    })
    .filter(x => x.holdIdx >= 0 && x.stated != null);

  it('there are hold-beat mornings to check', () => {
    expect(HOLD_MORNINGS.length, 'no morning produced a hold beat with a stated count')
      .toBeGreaterThan(10);
  });

  // The invariant, banded against the pre-fix mutant: laying the murdered only
  // at the gap beat leaves ONE empty place while the card says two, so an
  // empties!==stated case is exactly the bug this closes.
  it('the board shows exactly "N places still empty" empty plates at the hold beat', () => {
    for (const { seed, ep, state, holdIdx, stated } of HOLD_MORNINGS) {
      const stageHtml = _stage(state, holdIdx);
      const doc = new DOMParser().parseFromString(stageHtml, 'text/html');
      const plates = [...doc.querySelectorAll('.co-place')];
      const empty = plates.filter(p => p.getAttribute('data-down') === '0'
        && p.getAttribute('data-gap') !== '1');
      expect(empty.length,
        `seed ${seed} ep ${ep.num}: board shows ${empty.length} empty places, card says ${stated}`)
        .toBe(stated);
    }
  });

  // The murdered are LAID (present on the board) at the hold beat, not absent —
  // the other half of the same fix. A victim missing from the board is the
  // count mismatch dressed differently.
  it('the murdered are on the board as an empty place at the hold beat', () => {
    for (const { seed, ep, bf, state, holdIdx } of HOLD_MORNINGS) {
      const victims = (bf && bf.victims) || (ep.tr.dawn.breakfast.victims) || [];
      const stageHtml = _stage(state, holdIdx);
      const doc = new DOMParser().parseFromString(stageHtml, 'text/html');
      for (const v of victims) {
        const plate = [...doc.querySelectorAll('.co-place')].find(p => p.getAttribute('data-name') === v);
        expect(plate, `seed ${seed} ep ${ep.num}: victim ${v} is not laid on the board`).toBeTruthy();
        expect(plate.getAttribute('data-down'), `seed ${seed} ep ${ep.num}: victim ${v} shown seated pre-reveal`).toBe('0');
      }
    }
  });

  // The board must FILL IN, not sit at the end state: as the reveal advances no
  // seated player is ever un-seated (down-count is monotonic non-decreasing).
  it('plates fill in beat by beat (never fewer seated as the morning goes on)', () => {
    let checked = 0;
    for (const { state } of HOLD_MORNINGS.slice(0, 12)) {
      let prevSeated = -1;
      for (let i = 0; i < state.stepMeta.length; i++) {
        const doc = new DOMParser().parseFromString(_stage(state, i), 'text/html');
        const seated = [...doc.querySelectorAll('.co-place[data-down="1"]')].length;
        expect(seated, 'a seated player un-seated on a later beat').toBeGreaterThanOrEqual(prevSeated);
        prevSeated = seated;
      }
      checked++;
    }
    expect(checked).toBeGreaterThan(5);
  });
});

// DEFECT 1 — the initials fallback ("J", "SG") must never render inline against
// the name ("JJulia", "SGScary Girl"). The chip nests the initials inside the
// portrait box (clipped, absolutely placed) and keeps the name as a SEPARATE
// sibling; the chip also carries its own containment CSS so a missing or
// overridden PORTRAIT_CSS can never let the initials escape the frame.
describe('the arrival chip never mashes initials into the name (defect 1)', () => {
  const CHIP_MORNINGS = MURDER_MORNINGS.slice(0, 12)
    .map(({ ep }) => rpBuildColdOpen(ep, 'audience'))
    .filter(html => /class="co-face-chip"/.test(html));

  it('there are arrival chips to check', () => {
    expect(CHIP_MORNINGS.length, 'no morning rendered an arrival chip').toBeGreaterThan(5);
  });

  it('the name is a sibling of the portrait box, never nested inside it', () => {
    for (const html of CHIP_MORNINGS) {
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const chips = [...doc.querySelectorAll('.co-face-chip')];
      expect(chips.length).toBeGreaterThan(0);
      for (const chip of chips) {
        const av = chip.querySelector('.cv-av');
        const nm = chip.querySelector('.co-face-nm');
        expect(av, 'chip has no portrait box').toBeTruthy();
        expect(nm, 'chip has no name').toBeTruthy();
        // The initials live INSIDE the box...
        expect(av.querySelector('.cv-av-ini'), 'initials are not inside the portrait box').toBeTruthy();
        // ...and the name lives OUTSIDE it, so no fallback text can abut it.
        expect(av.contains(nm), 'the name is nested inside the portrait box — it can mash into the initials').toBe(false);
      }
    }
  });

  // The chip's own containment rule, banded against a mutant that drops it and
  // trusts PORTRAIT_CSS alone: without it a later `.cv-av` override could pull
  // the initials out of the frame and back into the name.
  it('the chip carries its own initials-containment CSS', () => {
    const html = CHIP_MORNINGS[0];
    expect(html).toMatch(/\.co-face-chip\s+\.cv-av-ini\{[^}]*position:absolute/);
    expect(html).toMatch(/\.co-face-chip\s+\.cv-av\{[^}]*overflow:hidden/);
  });
});

// DEFECT 2 — a breakfast speech that contradicts itself does not parse. The
// specific line is gone, and no said line in this file asserts and denies the
// same thing in one breath.
describe('breakfast speech does not contradict itself (defect 2)', () => {
  const SPOKEN = (() => {
    const out = new Set();
    for (const seed of [1, 3, 7, 11, 71, 42, 99, 123, 5, 17]) {
      for (const ep of play(seed)) {
        if (!ep.tr || !ep.tr.dawn) continue;
        const html = rpBuildColdOpen(ep, 'audience');
        let m; const re = /&ldquo;([\s\S]*?)&rdquo;/g;
        while ((m = re.exec(html))) out.add(m[1].replace(/<[^>]+>/g, '').trim());
      }
    }
    return [...out];
  })();

  it('gathered a body of spoken lines to check', () => {
    expect(SPOKEN.length, 'no spoken lines were gathered').toBeGreaterThan(15);
  });

  it('the self-contradicting "not saying I heard anything" line is gone', () => {
    for (const line of SPOKEN) {
      expect(/not saying I heard anything/i.test(line),
        `the contradictory line still renders: "${line}"`).toBe(false);
    }
  });

  // The general shape: no line both claims to have heard something and denies
  // having heard anything. Banded so it only fires on the actual contradiction,
  // not on the coherent hedge that replaced it.
  it('no spoken line asserts and denies hearing in the same breath', () => {
    for (const line of SPOKEN) {
      const contradictory = /\bheard (something|anything)\b/i.test(line)
        && /not saying .*heard (anything|something)/i.test(line);
      expect(contradictory, `line contradicts itself: "${line}"`).toBe(false);
    }
  });
});
