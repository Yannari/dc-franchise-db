// ══════════════════════════════════════════════════════════════════════
// dr/chal/music-video.js — the call sheet, the studio day, and what the
// director tells the panel
// ══════════════════════════════════════════════════════════════════════
//
// ── WHY THIS FILE EXISTS ──────────────────────────────────────────────
//
// It ran on js/dr/chal/girl-group.js, along with the Rumix, so all three were
// literally the same challenge with different `blend` weights. See the header
// of js/dr/chal/rumix.js for the whole of that.
//
// The wiki's version is short and it is the design: the queens STAR IN A MUSIC
// VIDEO. It is taped, the host casts it, and the thing that decides it is the
// day on set — which is the part the engine had nothing for.
//
// ── THE THREE THINGS THAT MAKE IT ITSELF ──────────────────────────────
//
// 1. SHE DOES NOT CHOOSE. Every other challenge in this show hands the queen a
//    decision — a slot, a part, a character. Here the host reads the room and
//    casts it, and the screen shows a CALL SHEET rather than a draft. That is
//    not a missing feature: "you were given the lead and did nothing with it"
//    is a different critique from "you took the lead", and the format only
//    produces the first one.
//
// 2. THE STUDIO DAY IS THE CHALLENGE. She shoots with a director who is not on
//    the panel and does not score her — he forms an IMPRESSION, and he tells
//    the panel about it, which is exactly what happens on the show. So
//    flopping the prep costs her on the main stage, and this is the first
//    challenge in the engine where that is true rather than implied.
//
//    `impression` is bounded and reaches `judgeViews` as one small term beside
//    `form` and `resume` (js/dr/judging.js). It is COMPUTED HERE, in the
//    engine, and merely rendered later — the three-step rule in CLAUDE.md is
//    that prose renders what already happened and never decides it, and a
//    director whose opinion only existed in the narration would be a second
//    panel nobody could audit.
//
// 3. THE TAPE IS THE RESULT. She cannot fix it on stage; by the time the panel
//    watches it back, the day is over. `stage: 'pre'` is correct here and it
//    is the opposite of the Rumix, which is performed live.
//
// NO TEAMS. One cast, one video — see the note at the end of rumix.js about
// the WINNING TEAM tag that a single-team challenge used to hand everybody.
import { pickOrder } from '../assign.js';
import { prepareRoom, walkthrough } from '../prep.js';
import { dragOf } from '../queen.js';
import { noise, riskFor, blendScore, ROLE_RANGES } from '../perform.js';
import { evt } from '../rules.js';

/** What the host is casting, biggest part first. */
const PART_LADDER = ['lead', 'featured', 'featured', 'standard', 'standard',
  'ensemble', 'ensemble', 'ensemble', 'ensemble'];

/** How far the director's read can move the panel, in either direction. */
export const IMPRESSION_CAP = 1.2;

const num = (p, k) => {
  const v = Number(p?.stats?.[k]);
  return Number.isFinite(v) ? v : 5;
};

/**
 * The host casts it, and nobody gets a say.
 *
 * Mostly on fit — she gives the lead to whoever can carry a video — with one
 * deliberate exception, which is the interesting half: a queen who has been
 * SAFE for weeks gets handed something she has to either take or drop. The
 * show does this on purpose and says so out loud, and it is the only source of
 * story in a hand-out the queens cannot influence.
 */
export function assign(ctx) {
  const { living, players, maxi, rng, miniWinner, mini, state } = ctx;
  const order = pickOrder({ living, miniWinner, mini, rng });
  const events = [];

  const fit = Object.fromEntries(order.map(n =>
    [n, blendScore(dragOf(players[n]), maxi.blend) + noise(rng, 1.6)]));

  /* THE QUEEN WHO HAS NOT BEEN SEEN. A run of SAFEs is the record of somebody
     the edit has nothing on, and the host casting her forward is the show
     handing her a week. Once per shoot.

     THREE SAFES IN THE LAST FIVE, NOT FIVE OUT OF FIVE. Written as
     `rec.every(...)` over the last five it needed an unbroken run, and a
     single HIGH anywhere in five weeks reset it — so on a challenge that
     happens at most once a season this never fired at all: measured as
     "written and unreachable over 12 seasons" by tests/dr-event-reach.test.js,
     which is the bug class docs/ADDING-A-SHOW.md §11.5 A exists for.
     Three of the last five is what "we have not seen her" actually means, and
     it is still a record and not a coin. */
  const coasting = order
    .filter(n => {
      const rec = (state?.record?.[n] || []).slice(-5);
      return rec.length >= 3 && rec.filter(x => x === 'SAFE').length >= 3;
    })
    .sort((a, b) => fit[a] - fit[b])[0];

  const ranked = [...order].sort((a, b) => fit[b] - fit[a]);
  // Not somebody who was getting a big part anyway — casting the front-runner
  // forward is not a decision, it is the ranking.
  if (coasting && ranked.indexOf(coasting) > 1 && rng() < 0.7) {
    ranked.splice(ranked.indexOf(coasting), 1);
    ranked.unshift(coasting);
    events.push(evt('cast-forward', {
      players: [coasting], pop: { [coasting]: 1 },
      data: { part: 'lead', why: 'coasting' },
    }));
  }

  const roles = {};
  ranked.forEach((n, i) => { roles[n] = PART_LADDER[i] || 'ensemble'; });

  /* `picks` IS KEYED BY QUEEN EVERYWHERE, whatever produced it — a draft
     records what she took, a contest what it cost her, and this records that
     she was GIVEN it and had no say. A critique that wants to say "you were
     handed the lead" reads `chosen: false` rather than knowing what kind of
     night it was. */
  const picks = Object.fromEntries(ranked.map(n =>
    [n, { name: n, role: roles[n], chosen: false, ducked: false }]));

  /* `contested: false` IS WHAT STOPS THE DRAFT PROSE. js/dr/stage.js reads it
     to choose the division beat, and without it a challenge where the host
     casts every part was announced with "You will be picking in order" and
     narrated with a card per queen saying she GRABBED the part with the jokes
     — over a hand-out she had no say in. Exactly the bug the split was for,
     one screen earlier. */
  return {
    roles, teams: [], order: ranked, picks, contested: false, events,
    scenes: [{ step: 'choice', kind: 'call-sheet', data: { order: ranked, roles } }],
  };
}

/**
 * The day on set.
 *
 * `prepareRoom` and `walkthrough` still run — the werk room happens, the host
 * still walks it — and then the shoot, which is this challenge's own beat.
 */
export function prepare(ctx) {
  const { living, players, rng, assignment } = ctx;
  const r = prepareRoom(ctx);
  const w = walkthrough({ ...ctx, prep: r.prep });
  const events = [...r.events, ...w.events];

  const impression = {};
  const notes = [];

  for (const n of living) {
    const d = dragOf(players[n]);
    const p = players[n];
    const role = assignment?.roles?.[n] || 'standard';

    /* ── HOW THE DAY WENT, IN THREE PARTS ──
       Reading the note (`intuition`), being able to do the thing he asked for
       (her craft), and not coming apart when he asks for it a ninth time
       (`temperament`). Charm is real and it is small: a director likes being
       liked, and it does not save a queen who cannot hit the mark.

       ALL PROPORTIONAL. Nothing here is a threshold on a stat — a queen with
       temperament 3 has a harder day than one with 7 and is not doomed to a
       bad one, which is the difference between a trait and a sentence. */
    const read = (num(p, 'intuition') - 5) * 0.09;
    const able = (d.acting * 0.5 + d.dance * 0.5 - 5) * 0.10;
    const steady = (num(p, 'temperament') - 5) * 0.10;
    const charm = (num(p, 'social') - 5) * 0.05;
    /* A BIG PART IS A LONGER DAY. The lead is in every set-up and every
       set-up is another chance to impress him or to run out of patience, so
       the role widens the swing exactly the way it widens a performance —
       the ensemble is mostly not there long enough to make an impression
       either way, which is its own quiet problem for her. */
    const range = ROLE_RANGES[role] ?? 1;
    const raw = (read + able + steady + charm + noise(rng, 0.55)) * range;
    impression[n] = Math.round(
      Math.max(-IMPRESSION_CAP, Math.min(IMPRESSION_CAP, raw)) * 100) / 100;

    /* WHAT ACTUALLY HAPPENED AT THE MONITOR, so the screen has a scene and
       not a number. `argued` is the failure that is about her rather than
       about her craft: she was asked for something and told him no. */
    const argued = impression[n] < -0.3 && num(p, 'temperament') <= 5
      && rng() < 0.45;
    notes.push({
      name: n, role, argued,
      impression: impression[n],
      took: impression[n] > 0.15,
    });
  }

  /* THE TWO HE WILL MENTION. A director who reports on thirteen queens is
     reporting on nobody, and the panel only ever hears about the one who made
     the day and the one who cost it. Ranked and sliced rather than
     thresholded, so there is exactly one of each however the numbers fell —
     the same fix js/dr/prep.js made to `featured`, for the same reason. */
  const byImpression = [...notes].sort((a, b) =>
    b.impression - a.impression || a.name.localeCompare(b.name));
  const best = byImpression[0];
  const worst = byImpression[byImpression.length - 1];

  if (best && best.impression >= 0.45) {
    events.push(evt('director-loved-her', {
      players: [best.name], pop: { [best.name]: 3 },
      state: { videoDirectorPick: best.name },
      data: { role: best.role, impression: best.impression },
    }));
  }
  if (worst && worst.impression <= -0.45 && worst.name !== best?.name) {
    events.push(evt('director-wrote-her-off', {
      players: [worst.name], pop: { [worst.name]: -3 },
      data: { role: worst.role, impression: worst.impression, argued: worst.argued },
    }));
  }

  return {
    prep: w.prep, events, impression, notes,
    scenes: [...r.scenes, {
      step: 'prep', kind: 'studio-day',
      data: { notes, best: best?.name || null, worst: worst?.name || null },
    }],
  };
}

export function perform(ctx) {
  const { living, players, assignment, prep, rng, impression } = ctx;
  const performances = {};
  const events = [];

  for (const n of living) {
    const d = dragOf(players[n]);
    const p = players[n];
    const role = assignment.roles[n] || 'standard';
    const range = ROLE_RANGES[role] ?? 1;

    /* ── WHAT IS ON THE TAPE ──
       A video is danced and acted in front of a camera that does not care how
       hard it was. The day's impression is NOT added in here: the director's
       read is what the PANEL is told, not what the footage shows, and adding
       it twice would let one afternoon score her twice over. */
    const base = d.dance * 0.4 + d.acting * 0.3 + d.singing * 0.2 + d.runway * 0.1;
    const perf = (base - 5) * range + 5 + (prep[n] || 0) + noise(rng, 2.2 * range);

    /* HOW MANY TIMES THEY WENT AGAIN. Not a score — a fact about her day that
       the screen can print and the critiques can refer to. Low craft and a bad
       impression both cost takes, which is the one place the day and the tape
       legitimately meet: he kept going until he had it or gave up. */
    const takes = Math.max(1, Math.round(
      6 - base * 0.35 - (impression?.[n] || 0) * 1.2 + noise(rng, 0.8)));

    /* BEING FINDABLE, which is the whole risk of a small part. The desc says
       it outright — "being impossible to find behind the featured queen" —
       and until now nothing modelled it. It is boldness and presence rather
       than craft: knowing where the camera is and putting yourself in it. */
    const findable = role === 'lead' || role === 'featured'
      || (d.runway * 0.5 + num(p, 'boldness') * 0.5 + noise(rng, 1.8)) > 5.4;
    if (!findable) {
      events.push(evt('lost-in-the-background', {
        players: [n], pop: { [n]: -1 }, data: { role },
      }));
    }

    performances[n] = {
      perf: Math.round(perf * 100) / 100,
      moment: perf > 10,
      risk: riskFor(players[n], rng),
      role, team: null,
      /* THE DIRECTOR'S READ, ON ITS WAY TO THE PANEL. js/dr/week.js puts it on
         the judging entry and js/dr/judging.js adds it beside `form`; every
         other challenge leaves it undefined and the term is zero. */
      impression: impression?.[n] || 0,
      parts: { prep: prep[n] || 0, impression: impression?.[n] || 0 },
      detail: {
        part: role,
        takes,
        findable,
        impression: impression?.[n] || 0,
      },
    };
  }

  return {
    performances, runwayOverride: null, events,
    // Taped, and played back to the panel on the night — before the runway.
    scenes: [{ step: 'maxi-pre', kind: 'video-playback', data: {} }],
  };
}
