// ══════════════════════════════════════════════════════════════════════
// dr/chal/makeover.js — turn a stranger into your sister
// ══════════════════════════════════════════════════════════════════════
//
// The only challenge scored on a RELATIONSHIP rather than on a result. The
// winning look here is not the best look — it is the one where the two of them
// read as family, which is why `resemblance` is the heaviest term and why a
// queen who paints herself beautifully and leaves her partner behind takes a
// note for it. Out-dressing your own sister is a loss, not a flex.
//
// ── CHECKED AGAINST THE SHOW, AND IT WAS WRONG ───────────────────────
//
// This was built with a pit crew and a pool of relationship types — "her
// mother", "her brother" — drafted as if there were one mother in the world.
// The real challenge is not that. The queens give a drag makeover to INVITED
// GUESTS from a specific demographic, and the demographic changes every time
// it is booked: superfans, military veterans, seniors, athletes, the queens
// already sent home. Her job is to make a stranger read as her drag family.
//
// So a pool is a THEMED COHORT and which one it is comes from the season's
// booking rather than from the queen. "Loved ones" is the single case where
// the guest is already hers, which is why it alone is not drafted.
//
// The resemblance term was right and stays: a family resemblance across
// cohesive looks is what the panel actually judges here.
import { pickOrder, contestFor } from '../assign.js';
import { prepareRoom, walkthrough } from '../prep.js';
import { dragOf } from '../queen.js';
import { noise, riskFor } from '../perform.js';
import { canScheme, evt } from '../rules.js';
import { alumniPool } from '../../alumni.js';
import { SHOWS, DRAG_FORMAT } from '../../shows.js';
import { drawPartners, GUEST_POOLS } from '../data/partners.js';

const crew = (name, ease) => ({ id: name.toLowerCase().replace(/\W+/g, '-'), name, ease });

// `ease` is how well a partner takes to it: a dancer walks, a shy one has to
// be carried through every step of it.
/* ── THE AUTHORED COHORTS MOVED OUT ──
   They were six arrays of invented first names in this file, two of which were
   the same twelve people — see the header of js/dr/data/partners.js. They have
   faces now and they live with the rest of the show's authored data, which is
   also where the next person will look for them. */
export { PIT_CREW, GUEST_POOLS } from '../data/partners.js';

export const PARTNER_POOLS = {
  // The one cohort that is not a roster of people: her own person, so nothing
  // is drafted and two queens can both bring a sister.
  'loved-ones': [crew('her mother', 4), crew('her brother', 6), crew('her sister', 8),
    crew('her father', 3), crew('her cousin', 7), crew('her best friend', 9),
    crew('her aunt', 5), crew('her nephew', 6), crew('her uncle', 3),
    crew('her twin', 9), crew('her neighbour', 5), crew('her drag mother', 10)],
  // Built at run time from the queens already sent home.
  eliminated: null,
  // And from the franchise itself — see `alumniPartners` below.
  alumni: null,
};

/* ── THE CROSSOVER MAKEOVER ──
   The cohorts above are invented people with faces: superfans, service
   veterans, the pit crew. They are the show's own premise and they stay. This
   is the one that could only exist in a franchise — the guests walking through
   the door are people who actually played one of the other shows, and the
   audience has watched them lose something.

   THE SHOW IS NOT A LIST. js/shows.js is the only place that knows what shows
   exist, and docs/ADDING-A-SHOW.md §9 is emphatic that a second copy is how a
   fourth show ends up wearing the first one's name. So the eligible shows are
   DERIVED: every registered format that is not this one and that has enough
   people on the ledger to fill a room. A show with nobody in it yet is never
   offered, and the day it has a cast it starts appearing without anybody
   editing this file.

   DRAG RACE IS EXCLUDED, and not for a technical reason: a makeover is turning
   somebody who does not do drag into a drag sister, and another queen has no
   transformation in her. The exclusion reads `DRAG_FORMAT` from the registry,
   so it is still not a hardcoded slug. */
const ALUMNI_FLOOR = 8;

/** Which registered shows could supply a room of partners right now. */
export function makeoverShows(exclude = []) {
  const barred = new Set(exclude);
  return Object.keys(SHOWS)
    .filter(f => f !== DRAG_FORMAT)
    /* NATIVE ONLY. `alumniPool` widens to the whole franchise when a format has
       fewer than `minNative` people in it — right for a guest judge, where the
       question is "would anybody recognise her", and wrong here, where the whole
       point is that these people played THAT show. Unfiltered it reported 170
       available for the castle, which has never had a cast: the fallback had
       handed back the entire franchise wearing the castle's name. */
    .map(f => ({ format: f,
      people: alumniPool({ format: f, exclude: [...barred] }).filter(a => a?.native) }))
    .filter(x => x.people.length >= ALUMNI_FLOOR);
}

/**
 * A room of partners drawn from one of the other shows.
 *
 * Returns `[]` when the franchise cannot fill one — no database loaded, or no
 * show with enough people — and the caller falls back to the invented cohorts,
 * which is the honest answer rather than a half-empty crossover.
 */
export function alumniPartners({ cast = [], rng = Math.random, format = null } = {}) {
  const castNames = cast.map(p => (p && p.name) || p).filter(Boolean);
  const shows = makeoverShows(castNames);
  if (!shows.length) return [];
  const chosen = (format && shows.find(s => s.format === format))
    || shows[Math.floor(rng() * shows.length)];

  const roster = (typeof globalThis !== 'undefined' && globalThis.FRANCHISE_ROSTER) || [];
  const rowOf = n => roster.find(r => r && r.name === n) || null;

  return chosen.people.map(a => {
    const st = (rowOf(a.name) || {}).stats || {};
    const num = k => (Number.isFinite(Number(st[k])) ? Number(st[k]) : 5);
    /* Willingness rather than talent: nobody here has done drag before, so what
       decides how the day goes is whether she will let somebody put her in a
       corset and laugh about it. Proportional, never a threshold. */
    const ease = Math.max(1, Math.min(10, Math.round(
      7 + (num('boldness') - 5) * 0.45 + (num('social') - 5) * 0.35
        + (num('temperament') - 5) * 0.2)));
    return {
      id: `alum-${(a.slug || a.name).toLowerCase().replace(/\W+/g, '-')}`,
      name: a.name,
      ease,
      fromShow: chosen.format,
      // Said the registry's way, so a screen never owns the show's name.
      fromShowName: SHOWS[chosen.format]?.name || chosen.format,
    };
  });
}

/* ══ HOW HARD A COHORT IS, MEASURED RATHER THAN TYPED ═══════════════════
   `ease` is how well a partner takes to being put in drag, and it is worth
   about a point of performance across a cohort's range — two thirds of what
   the queen's own runway is worth on the same night, measured over 3,200
   paired queens. So which cohort a season books is a real difficulty dial,
   and the picker offered eight names with nothing to choose between them.

   The number that matters is the RANGE, not the average. Superfans run 7 to
   9: booking them means no queen in the room can be handed somebody who
   sinks her, whatever the average says. Seniors run 3 to 8 and somebody is
   going to get the three.

   DERIVED FROM THE POOL, so a guest added or re-graded tomorrow moves the
   label without anybody remembering this function exists — the same rule the
   crossover show list follows. The two run-time cohorts have no fixed
   answer: `eliminated` is graded on the runway of whoever has gone home and
   `alumni` on how bold the other show's players are, and both are unknown
   until the season is played. */
export function cohortDifficulty(key) {
  const pool = key === 'loved-ones' ? PARTNER_POOLS['loved-ones'] : GUEST_POOLS[key];
  if (!pool || !pool.length) return null;
  const ease = pool.map(p => p.ease).filter(Number.isFinite);
  if (!ease.length) return null;
  const lo = Math.min(...ease);
  const hi = Math.max(...ease);
  const mean = ease.reduce((a, b) => a + b, 0) / ease.length;
  /* THE WORD IS THE AVERAGE AND THE NUMBERS ARE THE WORST DRAW, and it took
     printing them to see why it has to be that way round. Keyed on the worst
     draw alone, `loved-ones` came out "brutal" — one person in it is graded 3
     and another is graded 10, and calling the whole cohort brutal because of
     its one bad day is the same mistake as an average that hides the event it
     should show, upside down. The range beside it says who can still be
     handed somebody impossible.
     Thresholds are fine here: this is a label on a control, not a score. */
  const word = mean >= 7.5 ? 'gentle' : mean >= 6 ? 'fair'
    : mean >= 5 ? 'rough' : 'brutal';
  return { lo, hi, mean: Math.round(mean * 10) / 10, word, n: pool.length };
}

/** The picker's label for a cohort: its name, how hard it is, and its range. */
export function cohortLabel(key) {
  const name = key.replace(/-/g, ' ');
  const d = cohortDifficulty(key);
  // Graded when the season runs, so there is no honest number to print.
  if (!d) return `${name} · varies`;
  return `${name} · ${d.word} (${d.lo}–${d.hi})`;
}

/** Which cohorts a season can book. */
export const PARTNER_COHORTS = ['superfans', 'veterans', 'seniors', 'athletes',
  'pit-crew', 'loved-ones', 'eliminated', 'alumni'];

/** Everybody competes for a shared guest; loved ones are already hers. */
const CONTESTED = new Set(['superfans', 'veterans', 'seniors', 'athletes',
  'pit-crew', 'eliminated', 'alumni']);

function poolFor(cfg, state, players, ctx) {
  if (cfg?.makeoverPool === 'alumni') {
    /* Falls through to the invented cohorts when the franchise cannot fill a
       room — an early-life franchise, or a headless tool with no database
       loaded, both of which are ordinary rather than an error. */
    return alumniPartners({
      cast: Object.values(players || {}),
      rng: ctx?.rng, format: cfg?.makeoverShow || null,
    });
  }
  /* THE FOUR AUTHORED COHORTS PLUS THE CREW, drawn rather than handed back in
     written order — see `drawPartners`. `loved-ones` is not here because it is
     relationships rather than people and every queen gets her own. */
  if (GUEST_POOLS[cfg?.makeoverPool]) {
    return drawPartners(cfg.makeoverPool, ctx?.rng);
  }
  if (cfg?.makeoverPool === 'eliminated') {
    return (state?.out || []).map(n => ({
      id: n.toLowerCase(), name: n,
      ease: players[n] ? dragOf(players[n]).runway : 7,
      isQueen: true,
    }));
  }
  /* THE FALLBACK IS DRAWN TOO. It used to be `PARTNER_POOLS.superfans`, a
     fixed array that no longer lives in this file — an unbooked cohort would
     have fallen back to `undefined` and paired every queen with nobody. */
  return PARTNER_POOLS[cfg?.makeoverPool] || drawPartners('superfans', ctx?.rng);
}

export function assign(ctx) {
  const { living, players, rng, miniWinner, mini, cfg, state, bond } = ctx;
  const poolKey = cfg?.makeoverPool || 'superfans';
  let pool = poolFor(cfg, state, players, ctx);
  /* ── A SHORT ROOM IS THE COMMON CASE, NOT AN EMPTY ONE ──
     This only caught a pool with NOTHING in it, and the pool that needed it is
     never quite empty: `eliminated` holds however many queens have gone home,
     which on episode four is three of them. Nine queens, three partners, and
     six cards reading "with a stranger" — which is what the fallback existed
     to prevent and did not, because three is not zero.
     The season scheduler keeps `eliminated` out of the draw before episode
     five for this reason, but an author can pin it anywhere, and a control
     that produces six strangers when used early is a trap rather than a
     choice. Topped up from the superfans, which is what a production would
     do. */
  if (pool.length < living.length) {
    const short = living.length - pool.length;
    const taken = new Set(pool.map(p => p.id));
    pool = [...pool, ...drawPartners('superfans', rng, short + 4)
      .filter(p => !taken.has(p.id)).slice(0, short)];
  }

  const order = pickOrder({ living, miniWinner, mini, rng });
  const events = [];
  let picks;

  /* ── SOMEBODY PAIRS THE ROOM. NOBODY FIGHTS OVER IT. ──
     This ran a CONTEST: every queen ranked the partners and the draft handed
     them out in pick order. Two things were wrong with it, one mechanical and
     one about the show.

     THE MECHANICAL ONE. A queen's ranking was `ease + bond * 0.5 + rng()`, and
     `ease` spans one to ten while the jitter spans one — so every queen in the
     room ranked the partners in almost exactly the same order, wanted the same
     man, and lost him. The board read "7 of 8 lost a pick" and seven cards in
     a row said "not her first choice", which is not a draft, it is a queue.
     It is the same defect the Rumix verse order had and it is worth naming:
     a preference built out of a shared number is not a preference.

     AND THE ONE ABOUT THE SHOW. There is no scramble for a makeover partner.
     Somebody hands them out — the mini winner, as her prize — and that is a
     better mechanic than the contest ever was, because it gives one queen real
     power over everybody's week and makes what she does with it the story.
     She can keep the best for herself. She can hand her rival the hardest man
     in the room, in front of everybody, and be smiling while she does it.

     WITH NO MINI WINNER the room simply draws. Not a contest: nobody chose,
     so nobody lost, and no card should say she missed out on anything. */
  if (CONTESTED.has(poolKey) && pool.length) {
    const bag = [...pool];
    /** Take the partner this test picks out, or the first one left. */
    const take = (fn) => {
      const i = bag.findIndex(fn);
      return bag.splice(i < 0 ? 0 : i, 1)[0];
    };
    const easiest = () => take(p => p.ease === Math.max(...bag.map(x => x.ease)));
    const hardest = () => take(p => p.ease === Math.min(...bag.map(x => x.ease)));
    const assigner = miniWinner && living.includes(miniWinner) ? miniWinner : null;
    picks = {};

    /* HER OWN FIRST, and she does not pretend otherwise. The best partner in
       the room by how well he takes to it — that is what winning the mini
       bought her. */
    if (assigner) {
      const mine = easiest();
      /* `paired: true` is the flag the SCREEN reads, and it is on every pick
         this challenge makes. See the block below `rest` for why it is not
         `assignedBy`. Her own is `kept-the-best`: she did not draft him, she
         took him, which is a different card from getting your first choice. */
      picks[assigner] = { name: assigner, choice: mine.name, partner: mine,
        assignedBy: null, chosen: true, paired: true, pairing: 'kept-the-best',
        penalty: 0, lostTo: null };
    }

    /* THEN EVERYBODY ELSE. A queen the archetype rules let scheme gives her
       worst enemy the hardest man left and keeps the room watching; a queen
       who cannot scheme pairs people as well as she can, which is its own kind
       of power and reads as one. Neutral hands are neutral: she works down the
       room and does not think about it much.
       ONE POINTED PAIRING A NIGHT. A queen who dumps on everybody is a
       cartoon — the same rule the werk room and the roast both keep. */
    const rest = order.filter(n => n !== assigner);
    /* ONE OF EACH A NIGHT. `pointed` used to gate the generous pairing too, so
       a warm assigner handed out perfect partners until she happened to have
       an enemy — two and three of them a season, which turns a favour into a
       policy. They are separate flags: one pointed pairing and one kindness,
       and everybody else is just the next name on the list. */
    let pointed = false;
    let generous = false;
    for (const n of rest) {
      if (!bag.length) break;
      let partner;
      let meant = 'next-name';
      if (assigner && !pointed && canScheme(players[assigner]) && bond(assigner, n) <= -3) {
        partner = hardest();
        pointed = true;
        meant = 'dumped-on';
        events.push(evt('handed-the-hardest', {
          players: [assigner, n], bond: [[assigner, n, -2]], pop: { [assigner]: -2 },
          data: { partner: partner.name, ease: partner.ease },
        }));
      } else if (assigner && bond(assigner, n) >= 4 && !generous) {
        partner = easiest();
        generous = true;
        meant = 'looked-after';
        events.push(evt('paired-them-well', {
          players: [assigner, n], bond: [[assigner, n, 1]], pop: { [assigner]: 1 },
          data: { partner: partner.name },
        }));
      } else {
        partner = bag.splice(Math.floor(rng() * bag.length), 1)[0];
      }
      /* ── A MAKEOVER PICK SAYS SO ON ITS FACE ──
         The renderer used to tell a makeover from a music video by asking
         whether `assignedBy` was set: paired by a QUEEN got the pairing beat,
         cast by the HOST got the call sheet. Which works right up until there
         is NO mini winner — an episode with no mini booked, which the season
         is free to do — and then `assigner` is null, every pick reads
         `{ chosen: false, assignedBy: null }`, and the whole room draws the
         music video's call sheet over a night about a wig. Reported on an
         episode eleven makeover: six queens, six call sheets, "the role
         exists in the video" printed six times.
         So the flag is about what this challenge IS rather than about who
         happened to do the handing out. `assignedBy` still answers "who", and
         it is allowed to be nobody. */
      picks[n] = { name: n, choice: partner.name, partner,
        pairing: assigner ? meant : 'drawn',
        assignedBy: assigner, chosen: false, paired: true,
        penalty: 0, lostTo: null };
    }
  } else {
    // Nobody competes for their own family. Each queen draws one, and the same
    // relationship can turn up twice, because it can.
    picks = Object.fromEntries(order.map(n => {
      const p = pool[Math.floor(rng() * pool.length)];
      /* Paired, like the rest of this file — nobody drafted anybody. Without
         the flag these fell through to the DRAFT cards instead, and "she
         grabs the one everybody knew had the material" is not a sentence
         about a queen's own sister. */
      return [n, { name: n, choice: p.name, partner: p, paired: true,
        pairing: 'own-family', assignedBy: null, chosen: false,
        penalty: 0, lostTo: null }];
    }));
  }

  for (const n of order) {
    const partner = picks[n]?.choice;
    const rec = pool.find(p => p.name === partner);
    if (rec?.isQueen && bond(n, partner) >= 4) {
      events.push(evt('reunion', {
        players: [n, partner],
        bond: [[n, partner, 1.5]],
        pop: { [n]: 2, [partner]: 2 },
        data: { partner },
      }));
    }
  }

  return {
    roles: Object.fromEntries(order.map(n => [n, 'standard'])),
    /* Not a draft and not a call sheet — see the `paired` tier on
       `the-division`. This was set ONLY when somebody handed the room out,
       and the fallback for everything else is `draft`: an episode with no
       mini therefore opened its makeover with "the pick order is announced
       and the room becomes a maths class" over a night where nobody picked
       or counted anything. A makeover is never a draft, so it always answers
       this, and the answer says which kind of makeover it was. */
    division: Object.values(picks).some(p => p?.assignedBy) ? 'paired'
      : Object.values(picks).some(p => p?.pairing === 'own-family') ? 'own-family'
        : 'drawn',
    teams: [], order, picks, events, pool, poolKey,
    scenes: [{ step: 'choice', kind: 'makeover-pairs', data: { pool: poolKey, picks } }],
  };
}

export function prepare(ctx) {
  const { living, players, assignment, rng } = ctx;
  const pool = assignment.pool || drawPartners('superfans', rng);
  const r = prepareRoom(ctx);
  const w = walkthrough({ ...ctx, prep: r.prep });
  const events = [...r.events, ...w.events];
  const looks = {};

  /* ── HE COULD LOWER HER SCORE. HE COULD NOT RUIN HER DAY. ──
     `ease` was a flat handicap and nothing else: a partner graded three cost
     his queen the same fraction of a point every single time, quietly, with
     no day behind it. Measured over 3,200 paired queens it is worth about a
     point across a cohort's range, which is real — two thirds of what her own
     runway is worth — but a point of arithmetic is not a partner who will not
     put the heels on.
     So the grade now buys a CHANCE as well as a constant. He can fight it on
     the day, and he can turn out to be better than his grade, and both are
     rolled against the same number from opposite ends. Proportional, never a
     threshold: a nine can still have a bad morning and a three can still
     surprise everybody, they are simply much less likely to.
     TWO A NIGHT, AT MOST. The same rule the pointed pairing and the roast
     keep — a room where half the partners are a disaster is not a harder
     challenge, it is a different show. */
  let trouble = 0;
  const TROUBLE_CAP = 2;

  for (const n of living) {
    const d = dragOf(players[n]);
    const st = players[n]?.stats || {};
    const num = k => (Number.isFinite(Number(st[k])) ? Number(st[k]) : 5);
    const partner = pool.find(p => p.name === assignment.picks[n]?.choice)
      || { name: 'a stranger', ease: 5 };

    /* WHAT HE DOES WITH THE DAY. A ten never fights it and a one nearly
       always does; everybody in between is a coin weighted by his grade. */
    const resist = Math.max(0, (10 - partner.ease) / 10) * 0.32;
    const eager = Math.max(0, (partner.ease - 4) / 10) * 0.20;
    let fought = trouble < TROUBLE_CAP && rng() < resist;
    const took = !fought && rng() < eager;
    if (fought) trouble++;

    /* AND WHAT SHE DOES ABOUT IT. Talking somebody round is the whole job on
       this night, so her social carries the day — proportionally, and never
       all of it. The best queen in the room still loses something to a man
       who will not sit still. */
    const won = fought ? Math.min(0.62, (num('social') / 10) * 0.62) : 0;
    const swing = fought ? -(1.5 + rng() * 1.1) * (1 - won) : took ? 1.1 + rng() * 0.7 : 0;

    // Her own look is how she wears drag. Her partner's is how she MAKES it,
    // on a body that is not hers, helped or hindered by how willing he is.
    const own = d.runway * 0.8 + (w.prep[n] || 0) + noise(rng, 1.5);
    const theirs = d.design * 0.5 + partner.ease * 0.3 + (w.prep[n] || 0)
      + swing + noise(rng, 1.8);

    if (fought) {
      events.push(evt('partner-fought-it', {
        players: [n],
        /* THE AUDIENCE DOES NOT SCORE THE PARTNER, IT SCORES HOW SHE TOOK HIM.
           Nobody is blamed for the man they were handed — what the room reads
           is the morning after it: a queen who talks him round in front of
           everybody wins something the panel never sees, and a queen who
           spends the day losing that argument is watched losing it. Which of
           the two happened is already decided above, by her social, so this
           reports it rather than re-rolling it. */
        pop: { [n]: won > 0.4 ? 1 : -1 },
        data: { partner: partner.name, ease: partner.ease,
          cost: Math.round(-swing * 100) / 100, talkedRound: won > 0.4 },
      }));
    } else if (took) {
      events.push(evt('partner-took-to-it', {
        players: [n], pop: { [n]: 1 },
        data: { partner: partner.name, ease: partner.ease,
          gain: Math.round(swing * 100) / 100 },
      }));
    }

    looks[n] = {
      // WHAT HAPPENED TO HER, carried to the screen rather than re-derived
      // there. A card that guessed from the numbers would sometimes disagree
      // with the event, and the engine is the one that knows.
      fought, took,
      cost: Math.round(Math.abs(swing) * 100) / 100,
      own: Math.round(own * 100) / 100,
      partner: Math.round(theirs * 100) / 100,
      partnerName: partner.name,
      /* HIS FACE, WHICH THE SCREEN HAD NO WAY TO ASK FOR. The partners are
         authored people with portraits now (js/dr/data/partners.js), and a
         makeover card that names him without showing him is the one card in
         the show where the second person is the whole point. Null for a loved
         one and for an eliminated queen — a queen already has a portrait the
         registry resolves, and "her aunt" is a relationship rather than a
         face. */
      partnerPortrait: partner.portrait || null,
      partnerNote: partner.note || null,
      ease: partner.ease,
    };
    /* ── AND NOT WHEN HE IS THE REASON ──
       This asks whether her own look is far ahead of her partner's, and it
       reads that gap as selfishness: "she put her best work on herself and
       her second-best work on her partner". True, until a partner could fight
       her. Caught by printing an episode — seed 21, Queen1 — where the card
       said "he fought it − 1.5" and then accused her of the gap he had just
       made, and cost her two popularity for it.
       The morning already has an explanation. A screen does not get to offer
       a second one that contradicts it. */
    if (own - theirs > 3 && !fought) {
      events.push(evt('dressed-herself-better', {
        players: [n], pop: { [n]: -2 },
        data: { own: looks[n].own, partner: looks[n].partner },
      }));
    }
  }

  return {
    prep: w.prep, events, looks,
    scenes: [...r.scenes, { step: 'prep', kind: 'makeover-build', data: { looks } }],
  };
}

export function perform(ctx) {
  const { living, players, prep, rng, looks } = ctx;
  const performances = {};

  for (const n of living) {
    const L = looks?.[n] || { own: 5, partner: 5, partnerName: 'a stranger', ease: 5 };
    // The gap between the two looks IS the score. A pair that matches at seven
    // beats a queen at ten standing next to a partner at four.
    const resemblance = 10 - Math.abs(L.own - L.partner) - (10 - L.ease) * 0.3 + noise(rng, 1.2);
    const perf = resemblance * 0.4 + L.partner * 0.35 + L.own * 0.25;
    performances[n] = {
      perf: Math.round(perf * 100) / 100,
      moment: resemblance > 9 && perf > 9,
      risk: riskFor(players[n], rng),
      role: 'standard', team: null,
      parts: { prep: prep[n] || 0 },
      detail: {
        partner: L.partnerName,
        partnerPortrait: L.partnerPortrait || null,
        partnerNote: L.partnerNote || null,
        // How his day went, so the card can say so without prose. An empty
        // pool renders no scene, and this must be visible before one exists.
        partnerFought: !!L.fought, partnerTook: !!L.took,
        partnerCost: L.cost || 0,
        resemblance: Math.round(resemblance * 100) / 100,
        ownLook: L.own, partnerLook: L.partner,
      },
    };
  }

  return {
    performances, events: [],
    runwayOverride: { walks: [{ category: 'the pair', sewn: false, categoryStyles: [] }] },
    scenes: [{ step: 'maxi-main', kind: 'makeover-reveal', data: {} }],
  };
}
