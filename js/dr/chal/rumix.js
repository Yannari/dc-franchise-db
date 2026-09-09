// ══════════════════════════════════════════════════════════════════════
// dr/chal/rumix.js — she writes the bar, the booth keeps it or kills it
// ══════════════════════════════════════════════════════════════════════
//
// ── WHY THIS FILE EXISTS ──────────────────────────────────────────────
//
// The Rumix used to BE the girl group challenge. `js/dr/maxi.js` mapped
// `rumix`, `music-video` and `girl-group` to one module, so all three ran the
// same assign, the same prep, the same perform and the same prose; the
// catalogue gave them different `blend` weights and nothing else. Reported as
// "the rumix and music video challenge are basically the same challenges" —
// which was not a resemblance, it was the same code.
//
// The wiki calls it the VERSE CHALLENGE, and that is the whole design: the
// queens WRITE and RECORD a verse to a track. It is not a group number with
// the word "remix" over it. Two things follow, and this file is both of them:
//
//   1. THE WRITE AND THE BOOTH ARE DIFFERENT SKILLS, scored separately. A
//      queen can write a bar nobody else in the room could have written and
//      then fail to get it on tape; another can write filler and sell it with
//      a voice. The panel hears the RECORDING, so the booth is what survives —
//      but a verse with nothing in it cannot be rescued by a good take, which
//      is why both are scored and neither is decorative.
//   2. THE ORDER IS THE DECISION. Closing the track is the hard slot and
//      opening it is the other one; the middle is where nothing much happens
//      to you either way. Contested exactly the way the roast's running order
//      is, because it is the same instinct — see js/dr/chal/roast.js.
//
// AND IT IS A MAIN STAGE CHALLENGE. It was `stage: 'pre'`, which files it with
// the taped challenges and put the maxi screen before the runway. She performs
// this live, to her own recorded vocal, with choreography — the recording is
// the prep, the stage is the challenge.
//
// NO TEAMS, ANYWHERE IN HERE. `format: 'cast'` means one room and one track,
// and the girl group module gave every queen `teamWon: ti === bestTeam` with
// `bestTeam` of a single team — so every queen on the screen wore a WINNING
// TEAM tag on a challenge that has no teams to win.
import { pickOrder, contestFor } from '../assign.js';
import { prepareRoom, walkthrough, rehearseNumber } from '../prep.js';
import { dragOf } from '../queen.js';
import { noise, riskFor } from '../perform.js';
import { canScheme, canHelp, evt } from '../rules.js';

/* A multiplier on the SPREAD, never a ceiling — the same shape the roast's
   slots use. The closer can win the night or lose it; the middle mostly does
   neither. Opening is hard for a different reason than closing: nobody knows
   what the track is yet, so an opener has to establish it. */
export const SLOT_DIFFICULTY = { first: 1.3, last: 1.4, middle: 1.0 };

/** How many bars each queen gets. Short enough that a dud one is visible. */
const BARS = 4;

/** A bar this low is filler — the count is what the panel refers to. */
const FILLER = 4;

/* ── THE TRACK, AND WHAT IT ASKS OF A VERSE ──
   Every Rumix ran on a nameless song. The girl group has had `GROUP_THEMES`
   since it was written — a named track, a described sound, group names that
   fall out of it — and this had nothing, so the challenge that is ABOUT
   writing to a specific piece of music never said what the music was. Twelve
   nights across a franchise, all of them "the track".

   `asks` is the part that earns its place: a verse over a ballad is a
   different job from a verse over a club record, and it is what the brief,
   the booth and the critique all need to be able to refer to. It is a fact
   about the song rather than a description of it. */
export const RUMIX_TRACKS = [
  { id: 'stomp', title: 'Werk The Floor',
    sound: 'a four-on-the-floor stomper with a chorus that never lets up',
    asks: 'a verse that can be shouted and still land every word' },
  { id: 'ballad', title: 'One More Look',
    sound: 'a slow-burn ballad that leaves acres of space between the lines',
    asks: 'a verse with somewhere real to go, because the space will expose filler' },
  { id: 'club', title: 'After Hours',
    sound: 'a late-night club record built on one relentless bassline',
    asks: 'a verse that rides the beat rather than fighting it for attention' },
  { id: 'disco', title: 'Mirrorball',
    sound: 'strings, hi-hats and a key change nobody asked for',
    asks: 'a verse glamorous enough to sit beside the strings without shrinking' },
  { id: 'trap', title: 'Cash & Contour',
    sound: 'a sparse trap beat with half the bar left empty on purpose',
    asks: 'a verse with a flow, because there is nowhere to hide in the gaps' },
  { id: 'rock', title: 'Heavy Rotation',
    sound: 'arena rock, guitars loud enough to bury a bad line',
    asks: 'a verse delivered with a chest voice and no apology' },
  { id: 'pop', title: 'Sugar High',
    sound: 'bubblegum pop engineered to lodge in the skull by the second chorus',
    asks: 'a verse as sticky as the hook it has to sit next to' },
  { id: 'house', title: 'Feel It',
    sound: 'a piano-led anthem with a drop the verse has to set up',
    asks: 'a verse that builds, because the drop will punish a flat one' },
  { id: 'rnb', title: 'Slow Burn',
    sound: 'slinky late-night R&B written for runs',
    asks: 'a verse that can be sung rather than spoken, which is a trap' },
  { id: 'camp', title: 'Tuck & Roll',
    sound: 'novelty camp played far too fast, more shouted than sung',
    asks: 'a verse that is funny on the page and still scans at that tempo' },
];

/** One track for the night. Pinnable, so an author can book the song. */
export function pickRumixTrack(rng, pinnedId) {
  return (pinnedId && RUMIX_TRACKS.find(t => t.id === pinnedId))
    || RUMIX_TRACKS[Math.floor(rng() * RUMIX_TRACKS.length)];
}

const slotKind = (i, n) => (i === 0 ? 'first' : i === n - 1 ? 'last' : 'middle');
const slotNo = name => Number(String(name || 'verse-99').split('-')[1]) || 99;

const num = (p, k) => {
  const v = Number(p?.stats?.[k]);
  return Number.isFinite(v) ? v : 5;
};

/**
 * Which verse she wants, best first.
 *
 * ── WHY THIS IS A POSITION AND NOT A RANKING ──
 *
 * The first version sorted slots by a rule with two outcomes: bold queens
 * wanted the closer then the opener, everybody else wanted the middle. Twelve
 * queens, two shortlists — so the first queen to pick took verse twelve and
 * ELEVEN OF TWELVE were recorded as having lost their pick, to the same queen,
 * on the same slot. The screen said "11 of 12 lost a pick" and printed "not
 * the position she wanted" eleven times. A draft where nobody gets what they
 * want is not a draft; it is a queue with hurt feelings.
 *
 * So she has an ideal PLACE on the track and ranks the slots by distance from
 * it. Boldness pushes it late — the closer is the swing and she wants it —
 * comedy pushes it later still, because a joke lands better once the room has
 * warmed up and dies stone cold in verse one. The jitter is not decoration:
 * two queens with the same stats are still two people, and without it the
 * twelve ideals collapse back into three or four and the same pile-up happens
 * at lower volume.
 */
function versePreference(slots, player, rng) {
  const last = Math.max(1, slots.length - 1);
  const d = dragOf(player);
  const bold = num(player, 'boldness');
  let ideal = last * 0.45                       // the middle-ish, by default
    + ((bold - 5) / 5) * last * 0.30            // nerve pulls her towards the end
    + ((d.comedy - 5) / 5) * last * 0.15        // so does having jokes to land
    + (rng() - 0.5) * last * 0.30;              // and she is a person
  ideal = Math.max(0, Math.min(last, ideal));
  return [...slots].sort((a, b) =>
    Math.abs((slotNo(a) - 1) - ideal) - Math.abs((slotNo(b) - 1) - ideal));
}

export function assign(ctx) {
  const { living, players, rng, miniWinner, mini, bond, cfg } = ctx;
  const order = pickOrder({ living, miniWinner, mini, rng });
  // `runMaxi` spreads whatever `assign` invents onto the assignment, so the
  // track reaches `prepare`, `perform` and every screen without this file
  // teaching the engine what a track is.
  const track = pickRumixTrack(rng, cfg?.rumixTrackId);
  const slots = order.map((_, i) => `verse-${i + 1}`);
  const choices = Object.fromEntries(order.map(n =>
    [n, versePreference(slots, players[n], rng)]));
  /* NO PREPARATION PENALTY, for the roast's reason: it is the same verse
     whichever slot it lands in, and the slot difficulty already prices the
     position. Charging her twice would make losing the contest the whole
     challenge. */
  const { picks, events } = contestFor({
    order, choices, players, rng, bond, penaltyScale: 0,
  });

  return {
    roles: Object.fromEntries(order.map(n => [n, 'standard'])),
    teams: [], order, picks, track, events,
    scenes: [{ step: 'choice', kind: 'verse-order', data: { picks, track } }],
  };
}

export function prepare(ctx) {
  const { living, players, rng, assignment, bond = () => 0 } = ctx;
  const r = prepareRoom(ctx);
  const w = walkthrough({ ...ctx, prep: r.prep });
  const events = [...r.events, ...w.events];

  const bars = {};
  const hooks = {};
  const booth = {};
  // One queen per side per night: a room where everybody helps everybody, or
  // everybody reads everybody, is a cartoon. Same rule js/dr/prep.js keeps.
  const helpedWith = new Set();

  for (const n of living) {
    const d = dragOf(players[n]);
    const p = players[n];

    /* ── THE WRITE ──
       Four bars, each scored on its own, so "she wrote one great line and
       three nothings" is a shape the panel can actually see. Comedy carries
       it, because a Rumix verse is written to be quotable rather than to be
       beautiful, and singing carries the rest — she has to write something
       she can actually deliver. `mental` is the discipline of making it scan. */
    /* THE CRAFT WEIGHTS SUM TO ONE, and that is load-bearing rather than
       tidy. Written as 0.5 comedy plus 0.3 singing, an average queen scores 4
       on a scale the rest of the engine centres on 5 — so the whole challenge
       sat below par and, worse, `booth` below was measured AGAINST this. Any
       blend compared with another blend has to be on the same scale. */
    bars[n] = Array.from({ length: BARS }, () => Math.round(
      (d.comedy * 0.55 + d.singing * 0.45 + (num(p, 'mental') - 5) * 0.15
        + (w.prep[n] || 0) + noise(rng, 2.4)) * 100) / 100);

    /* A HOOK IS NOT THE MEAN. It is one line better than the rest of the
       verse by enough that the room repeats it — a real property of a verse
       and not a rounding of its average, which is why it is measured as the
       GAP between her best bar and her own others rather than as a threshold
       on the total. A queen with four decent bars has no hook, correctly. */
    const best = Math.max(...bars[n]);
    const rest = bars[n].filter(b => b !== best);
    const restMean = rest.length ? rest.reduce((a, b) => a + b, 0) / rest.length : best;
    hooks[n] = best >= 7 && best - restMean >= 2.2;
  }

  /* ── THE BOOTH ──
     The panel hears the RECORDING, so this is the score that survives. It is
     mostly voice, and it is partly whether she can take a note from the coach
     under a red light — `intuition` to read what he is asking for and
     `temperament` to not fall apart when it takes eleven takes.
     Bounded relative to the write rather than replacing it: a good session
     lifts a weak verse and cannot invent one, and a bad session can lose a
     verse she genuinely wrote. */
  for (const n of living) {
    const d = dragOf(players[n]);
    const p = players[n];
    const written = bars[n].reduce((a, b) => a + b, 0) / BARS;
    /* ON THE SAME SCALE AS THE WRITE, because `lift` is the difference
       between them. At 0.55 singing this ran about two points under `written`
       for every queen in the room, so the booth almost always LOST the verse
       and "she got it on tape" could not happen — a mechanic that only ever
       fires one way is not a mechanic. Measured before the fix: the booth beat
       the write on 3 of 12 queens, and every one of those three was a queen
       whose verse was already bad. */
    const session = d.singing + (num(p, 'intuition') - 5) * 0.2
      + (num(p, 'temperament') - 5) * 0.15 + noise(rng, 2.0);
    const lift = Math.max(-2.2, Math.min(2.2, (session - written) * 0.45));
    booth[n] = Math.round((written + lift) * 100) / 100;

    if (lift >= 1.4) {
      events.push(evt('booth-rescue', {
        players: [n], pop: { [n]: 1 },
        data: { written: Math.round(written * 100) / 100, booth: booth[n] },
      }));
    } else if (lift <= -1.4) {
      events.push(evt('booth-lost-it', {
        players: [n], pop: { [n]: -2 },
        data: { written: Math.round(written * 100) / 100, booth: booth[n] },
      }));
    }
  }

  /* ── SOMEBODY TAKES A BAR THAT IS NOT HERS ──
     Drag's version of the roast's stolen bit, and the same rule: once a
     night, and only a queen the archetype rules allow to scheme. The mark is
     whoever is writing at the next station — the specificity is what makes it
     a scene rather than a modifier. It moves the WRITE, not the booth: she
     lifted a line, she did not lift a vocal. */
  const order = assignment?.order || living;
  for (let i = 1; i < order.length; i++) {
    const thief = order[i];
    const mark = order[i - 1];
    if (!canScheme(players[thief])) continue;
    const mine = bars[thief].reduce((a, b) => a + b, 0);
    const theirs = bars[mark].reduce((a, b) => a + b, 0);
    if (theirs - mine < 4) continue;
    if (rng() > 0.5) continue;
    bars[thief] = bars[thief].map(b => Math.round((b + 0.7) * 100) / 100);
    bars[mark] = bars[mark].map(b => Math.round((b - 0.5) * 100) / 100);
    booth[thief] = Math.round((booth[thief] + 0.7) * 100) / 100;
    booth[mark] = Math.round((booth[mark] - 0.5) * 100) / 100;
    events.push(evt('lifted-a-bar', {
      players: [thief, mark],
      bond: [[thief, mark, -2]],
      pop: { [thief]: -1 },
      data: { thief, mark },
    }));
    break;
  }

  /* ── WHAT HAPPENED IN THE BOOTH, PER QUEEN ──
     `booth` was a number and the only thing that reached a screen was the two
     extremes, so ten of twelve queens recorded a vocal that the episode never
     mentioned. The tier is decided HERE rather than in the renderer, for the
     same reason every other result is: the engine says what happened and the
     prose says it in words. */
  const sessions = living.map(n => {
    const written = (bars[n] || []).reduce((a, b) => a + b, 0) / BARS;
    const lift = (booth[n] ?? written) - written;
    return {
      name: n,
      written: Math.round(written * 100) / 100,
      booth: booth[n],
      lift: Math.round(lift * 100) / 100,
      tier: lift >= 1.4 ? 'got-it-on-tape'
        : lift <= -1.4 ? 'could-not-get-it'
          : lift >= 0 ? 'clean-session' : 'many-takes',
    };
  });

  /* ── THE WRITING ROOM IS A SOCIAL ROOM, AND THIS ONE HAD ALMOST NOTHING ──
     The girl group this was split out of moves bonds all night — the
     spotlight hog costs her whole team, somebody is visibly carried, a
     captain dumps a rival. Both replacements shipped with one bond-moving
     event between them, and the season noticed before any human did:
     `relationship:fallen-out` stopped firing across twenty seasons, because
     two of nineteen challenges had quietly stopped souring anybody.
     A challenge that cannot change how the room feels is a stat check with
     scenery, which is the rule CLAUDE.md states and this broke.

     WORKSHOPPED — a queen who can write sits down with one who cannot. Real
     help: it moves her bars, not just the bond. Nice archetypes do this and
     so does anybody else; `canHelp` is the shared predicate and it is
     permissive on purpose. */
  for (const n of living) {
    if (helpedWith.has(n) || !canHelp(players[n])) continue;
    const d = dragOf(players[n]);
    if (d.comedy < 7) continue;
    const friend = living.find(o => o !== n && !helpedWith.has(o)
      && dragOf(players[o]).comedy <= 4 && bond(n, o) >= 3);
    if (!friend) continue;
    helpedWith.add(n); helpedWith.add(friend);
    bars[friend] = bars[friend].map(b => Math.round((b + 0.6) * 100) / 100);
    booth[friend] = Math.round((booth[friend] + 0.4) * 100) / 100;
    events.push(evt('workshopped', {
      players: [n, friend], bond: [[n, friend, 1.5]], pop: { [n]: 2 },
      data: { helper: n, helped: friend },
    }));
    break;
  }

  /* AND READ — she hears a rival's verse through a wall and tells the room it
     is terrible. The damage is to the WRITER's nerve rather than to her
     writing, so it lands on the booth and not on the bars: she wrote what she
     wrote, and then she had to go and perform it knowing what was said. */
  for (const n of living) {
    if (!canScheme(players[n])) continue;
    const mark = living
      .filter(o => o !== n && !helpedWith.has(o) && bond(n, o) <= -2)
      .sort((x, y) => bond(n, x) - bond(n, y))[0];
    if (!mark) continue;
    if (rng() > 0.45) continue;
    booth[mark] = Math.round((booth[mark] - 0.7) * 100) / 100;
    events.push(evt('read-her-verse', {
      players: [n, mark], bond: [[n, mark, -2.5]], pop: { [n]: -2 },
      data: { reader: n, mark },
    }));
    break;
  }

  /* AND THE NUMBER ITSELF. She recorded the verse this morning; this
     afternoon a choreographer teaches her what to do with her body while it
     plays. It is the second half of a Rumix and it was not simulated at all. */
  const reh = rehearseNumber({ living, players, rng });
  events.push(...reh.events);

  return {
    prep: w.prep, events, bars, hooks, booth, sessions, choreo: reh.choreo,
    scenes: [...r.scenes, ...reh.scenes, {
      step: 'prep', kind: 'writing-booth',
      data: { bars, hooks, booth, sessions, track: assignment?.track || null },
    }],
  };
}

export function perform(ctx) {
  const { living, players, assignment, prep, rng, bars, hooks, booth, choreo } = ctx;
  const performances = {};
  const events = [];
  const order = [...living].sort((a, b) =>
    slotNo(assignment.picks[a]?.choice) - slotNo(assignment.picks[b]?.choice));

  order.forEach((n, i) => {
    const kind = slotKind(i, order.length);
    const range = SLOT_DIFFICULTY[kind];
    const d = dragOf(players[n]);
    const myBars = bars?.[n] || [5, 5, 5, 5];
    const recorded = booth?.[n] ?? 5;

    /* ── THE STAGE, WHICH IS NOT THE RECORDING ──
       She performs live to her own vocal. The verse is already on tape and
       cannot be improved here — what is decided tonight is whether she can
       stand inside it: the choreography, and the nerve to sell a line she
       wrote alone in a room three days ago to four judges and a live crowd.
       So `recorded` is the material and `live` is the delivery, and a queen
       can lose a verse she nailed in the booth. */
    // Weights to one, for the reason in `prepare`: this is averaged with
    // `recorded`, so the two have to mean the same thing.
    const live = d.dance * 0.55 + d.lipsync * 0.45
      + (num(players[n], 'boldness') - 5) * 0.25 + noise(rng, 2.0);
    const perf = ((recorded * 0.62 + live * 0.38) - 5) * range + 5
      // What the afternoon in the rehearsal room bought her, or cost her.
      + (choreo?.[n] || 0)
      - (assignment.picks[n]?.penalty || 0) + noise(rng, 1.1 * range);

    if (myBars.every(b => b < FILLER)) {
      events.push(evt('no-verse', {
        players: [n], pop: { [n]: -3 },
        state: { [`noVerse:${n}`]: true }, data: { slot: i + 1 },
      }));
    }
    /* THE BAR THE SEASON QUOTES BACK. A hook that also GOT THERE — written
       well and delivered well — is the clip, and it is worth more to her
       reputation than the placement is. Both halves are required: a hook
       fluffed on stage is not a moment, it is a shame. */
    if (hooks?.[n] && perf > 8) {
      events.push(evt('quotable-bar', {
        players: [n], pop: { [n]: 4 },
        state: { rumixBar: n }, data: { slot: i + 1 },
      }));
    }

    performances[n] = {
      perf: Math.round(perf * 100) / 100,
      moment: perf > 10,
      risk: riskFor(players[n], rng),
      role: 'standard', team: null,
      parts: {
        prep: prep[n] || 0,
        booth: Math.round(recorded * 100) / 100,
        live: Math.round(live * 100) / 100,
        choreo: choreo?.[n] || 0,
      },
      detail: {
        slot: i + 1, slotKind: kind, bars: myBars,
        hook: !!hooks?.[n],
        booth: Math.round(recorded * 100) / 100,
        live: Math.round(live * 100) / 100,
        filler: myBars.filter(b => b < FILLER).length,
      },
    };
  });

  return {
    performances, runwayOverride: null, events,
    // Main stage: she does this live, after the runway, not on tape before it.
    scenes: [{ step: 'maxi-main', kind: 'verse-order-run',
      data: { order, track: assignment?.track || null } }],
  };
}
