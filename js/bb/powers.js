// ══════════════════════════════════════════════════════════════════════
// bb/powers.js — the power inventory
// ══════════════════════════════════════════════════════════════════════
//
// A power is a RULE OBJECT with a lifecycle. It does not know or care how it
// was obtained: the Diamond Power of Veto is the same power whether the
// week's veto competition awarded it in front of everybody (the Care
// Package/OTT shape) or Pandora's Box slipped it to an HOH who then lied
// about a dollar (BB12, the canonical one). Distributors decide who gets a
// power and who knows; this file owns what a power IS and when it stops
// existing.
//
// Lifecycle fields per the catalog design's compatibility rule 8: holder,
// acquisition week, expiry, eligible timing, used/unused, visibility and
// disposal. Instances live on gs.bb.powers so they save, load and replay
// with the season.
import { gs } from '../core.js';
import { juryOpensAt } from './jury.js';
import { recordBBPower } from './knowledge.js';

/**
 * The definitions. Rules only — no acquisition, no narration.
 *
 *   useTiming   when the power may fire: 'veto-ceremony' | 'eviction-night'
 *   windowWeeks how many evictions the holder may sit on it (1 = this week)
 *   rules       the same shape the twist contract speaks
 *   survivesEviction  the holder walking out does NOT dispose it (see below)
 *   autoFiresAtExpiry the window closing SPENDS it rather than binning it
 *   blurb       what it does, in one sentence, for a viewer who has not
 *               memorised four powers with similar names
 *   catch       the limitation that makes it a decision rather than a gift.
 *               Every one of these is a rule somebody gets wrong from memory,
 *               which is exactly why it belongs on the screen.
 *   moment      when the viewer should expect to see it fire
 */
export const BB_POWER_DEFINITIONS = {
  'diamond-veto': {
    id: 'diamond-veto',
    name: 'The Diamond Power of Veto',
    rules: { replacementAuthority: 'veto-holder' },
    // Public grants fire at the ceremony they were announced for; a secret
    // grant is sat on and detonated at the live show, which is the entire
    // reason to keep it secret. The instance's visibility decides which.
    useTiming: { public: 'veto-ceremony', secret: 'eviction-night' },
    windowWeeks: 2,
    blurb: 'Takes a nominee off the block — and the holder, not the Head of Household, names who goes up in their place.',
    catch: 'It controls BOTH chairs, which an ordinary veto never does: the HOH can lose their whole week in one ceremony.',
    moment: 'The veto ceremony — or, if it is secret, the live show, with no warning at all.',
  },

  // BB11. The holder stands up at the veto ceremony and takes the week off the
  // Head of Household: up to two nominees come down and the holder names the
  // replacements. Timed to the veto ceremony rather than the nomination one
  // because the rule excludes the veto holder from being replaced INTO the
  // block, which only means anything once there is a veto holder.
  'coup-d-etat': {
    id: 'coup-d-etat',
    name: "The Coup d'État",
    rules: { ceremonyAuthority: 'power-holder', mayReplace: 2 },
    useTiming: 'veto-ceremony',
    // Sat on for a fortnight, which is the whole tension: the house spends two
    // weeks knowing it exists and not knowing who has it.
    windowWeeks: 2,
    blurb: 'Overrules the Head of Household outright: up to TWO nominees come off the block and the holder names the replacements.',
    catch: 'The Head of Household and the veto holder cannot be seated, so it rewrites the week without touching the two people already safe.',
    moment: 'The veto ceremony, standing up in front of everybody.',
  },

  // BB20. Preventative and narrow: it is spent BEFORE a ceremony is read out
  // and it covers that ceremony only. Using it on nomination day does not stop
  // the holder being named as a replacement at the veto ceremony, which is the
  // detail that makes it a decision rather than a week of immunity.
  // BB27, premiere night. The Mastermind stole the HOH relic, and whoever
  // recovered it chose WHICH FOUR HOUSEGUESTS were allowed to play for the
  // first Head of Household — with the option to put themselves in or leave
  // themselves out.
  //
  // It is on the shelf rather than welded into the premiere card because
  // nothing about it is specific to night one: "you decide who is eligible for
  // the next crown" is a legal, horrible power in any week, and putting it here
  // makes it reachable through every channel that hands powers out — Pandora,
  // the Whacktivity, the Secret Power Competition — for free.
  //
  // It is also the only power in this game that acts BEFORE a competition
  // rather than on a ceremony, which is why it reads as more frightening than
  // its numbers deserve: you cannot veto your way out of not being in the yard.
  'hoh-gatekeeper': {
    id: 'hoh-gatekeeper',
    name: 'The Relic',
    rules: { hohEligibility: 4 },
    useTiming: 'hoh-competition',
    windowWeeks: 1,
    blurb: 'The holder names the four houseguests eligible to play for the next Head of Household, and may include or exclude themselves.',
    catch: 'Everybody sees the four names, and everybody can count who is missing from them — this is the least deniable power in the game.',
    moment: 'The morning of the Head of Household competition, before anybody is in the yard.',
  },

  // The other half of the same night. Whoever found the host won $10,000 IN
  // PUBLIC — and privately learned they could spend it to get off the block.
  //
  // The shape is what makes it worth having: the house knows about the money
  // and not about the power, so the holder walks around visibly rich and
  // secretly safe. And the Head of Household cannot refuse it, which no other
  // save in this game can say — a veto is used on you, this is done TO the
  // person in charge, in front of everybody, and they have to name somebody
  // else on the spot with no time to think.
  'buy-off': {
    id: 'buy-off',
    name: 'The Buy-Off',
    rules: { buyOff: true },
    useTiming: 'veto-ceremony',
    // Pre-jury on the show. Four evictions is that, at the sizes this game
    // casts, without hard-coding a jury rule into a power.
    windowWeeks: 4,
    blurb: 'The holder pays the Head of Household to take themselves off the block. The HOH cannot refuse and must name a replacement on the spot.',
    catch: 'The money was won in public, so the moment it is spent the whole house knows exactly what that prize really was — and it only works once.',
    moment: 'The veto ceremony, after the veto has been used or not used.',
  },

  // BB21 Whacktivity, and the only thing in this game that can UNDO a ceremony
  // that has already happened. Everything else here changes what is about to
  // happen; this reaches backwards.
  //
  // The Head of Household keeps the pen and loses the page: the nominations are
  // void, everybody is woken up, and the same person has to name two DIFFERENT
  // houseguests on the spot with no time to plan. It is the only power that
  // makes somebody do their own job twice, in front of everybody, at three in
  // the morning.
  'nightmare-power': {
    id: 'nightmare-power',
    name: 'The Nightmare Power',
    rules: { voidNominations: true },
    useTiming: 'post-noms',
    // Canon: the first six nomination ceremonies.
    windowWeeks: 6,
    blurb: 'Voids a nomination ceremony that has already happened. The house is woken in the middle of the night and the Head of Household must name two new nominees on the spot.',
    catch: 'The two who came down cannot go back up the same night, so it cannot be aimed twice — and the Head of Household takes the blame for a block they were forced to write.',
    moment: 'The middle of the night, hours after the nomination ceremony everybody thought was over.',
  },
  'the-cloud': {
    id: 'the-cloud',
    name: 'The Cloud',
    rules: { unnominatable: 'one-ceremony' },
    useTiming: 'nominations',
    windowWeeks: 8,
    blurb: 'Declared privately before a nomination ceremony: the holder cannot be named at that ceremony.',
    catch: 'It covers ONE ceremony, not the week — the holder is still a legal replacement at the veto ceremony three days later.',
    moment: 'Nomination day, before the keys turn.',
  },

  // BB20. Not immunity — a CHANCE. The holder, or somebody they name, gets a
  // competition to come back with if they are evicted; losing it sends them
  // out for good. Good through the first four evictions.
  //
  // Two lifecycle flags no other power needs, and both are load-bearing:
  //
  //   survivesEviction   every other power dies with its holder. This one is
  //                      SPENT by its holder being evicted, so the ordinary
  //                      'holder-evicted' sweep would bin it at the exact
  //                      moment it exists to fire.
  //   autoFiresAtExpiry  Sam Bledsoe never used hers. The window ran out and
  //                      the power went off anyway on the fourth evictee,
  //                      whoever that turned out to be — so the fuse is a rule
  //                      of the power, not a decision the holder can dodge.
  'bonus-life': {
    id: 'bonus-life',
    name: 'Bonus Life',
    rules: { returnChance: true },
    useTiming: 'eviction-night',
    windowWeeks: 4,
    survivesEviction: true,
    autoFiresAtExpiry: true,
    blurb: 'Gives an evicted houseguest a CHANCE to come back: the holder names who gets it, and that person plays to return.',
    catch: 'It is not immunity. Lose the competition and you are gone for good — and if the window runs out unused it fires anyway, on whoever the next evictee happens to be.',
    moment: 'Eviction night, after the vote.',
  },

  // BB19, and the reason the Den of Temptation existed: Jessica took it and
  // used it on the eviction that was about to remove Cody. It cancels ONE of
  // the next four evictions outright — nobody goes home, the week's votes are
  // read out and then thrown away — and everything else about the week stands.
  //
  // The one rule people misremember is that it is not protection. It stops the
  // night, not the nomination: the same houseguest can be nominated again the
  // following week with nothing left to stop it.
  'halting-hex': {
    id: 'halting-hex',
    name: 'The Halting Hex',
    rules: { cancelEviction: true },
    useTiming: 'eviction-night',
    windowWeeks: 4,
    blurb: 'Cancels one eviction outright: the votes are read, and then nobody leaves.',
    catch: 'It stops the night, not the nomination — everybody on that block is a legal nominee again next week, with the Hex already spent.',
    moment: 'Eviction night, after the votes are counted.',
  },

  // BB16, week 11: a gold button in the have-not room with no label on it. They
  // pressed it, a timer appeared, and nobody knew what they had done until the
  // eviction stopped mid-vote and the entire week was rewound — nominees off
  // the block, the crown gone, and everybody who had just been on that block
  // free to play for the next Head of Household.
  //
  // The distinction from the Halting Hex, which also cancels an eviction, is
  // the whole reason both can exist: the Hex stops the NIGHT and leaves the
  // week standing. This erases the WEEK. The reign goes with it, so the person
  // who spent three days building that block plays for it again from the same
  // starting line as the two people they put up.
  //
  // And the votes are read first. That is not decoration — it is the price.
  // Every ballot in the room becomes public knowledge, including the holder's,
  // with every person who was betrayed still in the house and now eligible to
  // win. There is no quiet way to use this.
  'rewind-button': {
    id: 'rewind-button',
    name: 'The Rewind',
    rules: { rewindWeek: true },
    useTiming: 'eviction-night',
    windowWeeks: 3,
    blurb: 'Stops the eviction after the votes have been read and rewinds the whole week: nobody leaves, the block clears, and the Head of Household loses the reign entirely.',
    catch: 'The votes are read FIRST, so every ballot in that room becomes public — including the one belonging to whoever pressed it — and the deposed Head of Household is free to compete for it again.',
    moment: 'Eviction night, after the votes are read and before anybody stands up.',
  },

  // ── the two that edit the FIELD rather than the medallion ──
  //
  // These shipped first as schedulable week cards and that was wrong, for a
  // reason worth writing down: a redraw that production simply announces has
  // no agent in it. Nobody decides, so nobody can be blamed, so the narration
  // has to keep saying "nobody chose this" — which is a twist explaining why
  // it is not interesting. As POWERS they are the opposite. Somebody is
  // holding this, somebody decides whose afternoon of promises gets thrown
  // away, and the best use of one is the most self-serving: take a seat off
  // the person most likely to spend the veto against you, and sit in it
  // yourself.
  //
  // Both fire at the draw, which is a timing nothing else in the inventory
  // uses: after the chips are out and before a single thing is played.
  'veto-redraw': {
    id: 'veto-redraw',
    name: 'The Veto Redraw',
    rules: { vetoRedraw: true },
    useTiming: 'veto-draw',
    windowWeeks: 2,
    blurb: 'Voids every chip drawn for the veto competition and runs the draw again from scratch.',
    catch: 'It is a re-roll, not a choice — the holder cannot say who comes out or who goes in, and the bag can hand back the same three names.',
    moment: 'The veto draw, chips already on the table.',
  },
  'veto-replacement': {
    id: 'veto-replacement',
    name: 'The Veto Replacement',
    rules: { vetoReplace: 1 },
    useTiming: 'veto-draw',
    windowWeeks: 2,
    blurb: 'Takes one houseguest out of the veto competition and puts another in — the holder names both.',
    catch: 'The Head of Household and the nominees play by right and cannot be removed, so it can only ever move one of the three drawn seats.',
    moment: 'The veto draw, before anybody has played for anything.',
  },

  // BB21, and it belongs HERE rather than on the week-card shelf.
  //
  // It was FOUND — hidden in the house, not competed for — and it was good for
  // two weeks and three veto competitions, which is why the holder spent a
  // fortnight sitting in rooms where people talked about the block in front of
  // them. Offered as a schedulable one-week twist it became "somebody is
  // secretly given a veto tonight", which is a different twist wearing the
  // name: the secret is the HOLDING, and holding is the only part a one-week
  // card cannot express.
  //
  // The other rule people misremember: the USE is not secret. The holder
  // stands up at a ceremony that has already finished and everybody watches
  // them do it. What nobody knew was that it was in the building at all.
  'secret-veto': {
    id: 'secret-veto',
    name: 'The Secret Power of Veto',
    rules: { secretVeto: true },
    useTiming: 'veto-ceremony',
    // Three veto ceremonies, which is what "two weeks" bought on the show once
    // a double eviction is counted.
    windowWeeks: 3,
    blurb: 'A second, real veto that nobody knew was in the house: the holder can take a nominee off the block after the ceremony has already ended.',
    catch: 'Using it is completely public — the house does not learn it exists until the moment the holder stands up, and then they know exactly whose hand it was.',
    moment: 'A veto ceremony, after it has been adjourned.',
  },


  // ── BB27's secret power competition ──────────────────────────────────────
  //
  // Three powers hidden inside the week's Head of Household competition, and
  // every one of them dead the moment the jury opens. That expiry is the whole
  // reason they can be this strong: a power that rewrites an HOH is fine in
  // week three and would decide a season in week ten, so it is written to be
  // unusable by then rather than balanced down to nothing.
  //
  // `windowUntil: 'jury'` is a second expiry axis alongside `windowWeeks`. The
  // week count answers "how long may the holder sit on it"; this answers "and
  // never past here", and a power carrying both dies at whichever comes first.

  // The only power in the shelf that the person it is used against can TAKE
  // BACK. Everything else is a windfall; this is a bet.
  // The same theft, without the room to catch it in — and with somebody else's
  // name on the block.
  //
  // The Interrogation is anonymous, so the dethroning has nowhere to land: the
  // house knows the ceremony was taken and never who took it. The Deepfake is
  // the opposite failure. The wall reads the nominations out in the Head of
  // Household's own voice, so the house does not know a theft happened at all —
  // it thinks it watched somebody nominate two of their own allies, and every
  // grievance in the room goes to a person who chose nobody.
  'deepfake-hoh': {
    id: 'deepfake-hoh',
    name: 'The Deepfake',
    rules: { usurpHoh: true, contested: false, creditsDeposed: true },
    useTiming: 'post-hoh',
    windowWeeks: 4,
    windowUntil: 'jury',
    blurb: 'Takes the Head of Household away from whoever won it and names the block in '
      + 'their name. The house is never told the ceremony changed hands.',
    catch: 'There is no interrogation and nothing to confess to, because nobody is looking. '
      + 'The cost is paid by the Head of Household you took it from, who spends the week '
      + 'answering for a block they did not choose and cannot explain.',
    moment: 'After the Head of Household is crowned, before nominations.',
  },

  'hoh-interrogation': {
    id: 'hoh-interrogation',
    name: 'The Interrogation',
    rules: { usurpHoh: true, contested: 'interrogation' },
    useTiming: 'post-hoh',
    windowWeeks: 6,
    windowUntil: 'jury',
    blurb: 'Takes over somebody else\'s Head of Household — but the deposed HOH then questions the whole house, and if they name the person who did it, they keep their week and the power is spent for nothing.',
    catch: 'It is the only power that can be REFUSED. Using it puts the holder in a room with somebody who is looking for exactly them, and a bad liar loses the power and the alibi in the same afternoon.',
    moment: 'After the Head of Household is crowned, before nominations — and then a day of questions.',
  },

  // The alumni are already in this codebase: eligibleHosts() reads
  // players_database for everybody who has finished a season. The cameo is
  // drawn from there rather than invented, so the person who walks in is
  // somebody the franchise actually has.
  'mystery-competitor': {
    id: 'mystery-competitor',
    name: 'The Mystery Competitor',
    rules: { vetoProxy: true },
    useTiming: 'veto-draw',
    windowWeeks: 6,
    windowUntil: 'jury',
    blurb: 'Only usable on the block: a former houseguest walks back into this house and takes one of the drawn veto spots, and if they win it, the veto belongs to the holder.',
    catch: 'It buys a second body in the draw, not a win — the alumnus has to actually beat the room, and everybody watches a stranger arrive knowing somebody paid for it.',
    moment: 'The veto draw, when a name nobody expected comes out of the bag.',
  },

  // Distinct from `secret-veto`, which is a veto the holder already HAS. This
  // one is a competition the holder is granted, alone, after the real one is
  // over — so it can save a nominee the real veto did not, and it can also
  // simply be lost.
  'mystery-veto': {
    id: 'mystery-veto',
    name: 'The Mystery Veto',
    rules: { soloVetoComp: true },
    useTiming: 'post-veto',
    windowWeeks: 6,
    windowUntil: 'jury',
    blurb: 'Calls a second veto competition at the end of the week with exactly one player in it: the holder. Win it and there is a real veto to use after the ceremony everybody already watched.',
    catch: 'A competition is a competition. Nobody is standing in the way and it can still be lost, and the house finds out it existed either way.',
    moment: 'After the veto ceremony, when the week was supposed to be settled.',
  },
};

function store() {
  gs.bb ||= {};
  gs.bb.powers ||= [];
  return gs.bb.powers;
}

/**
 * Hand a power to somebody. Returns the instance.
 *
 * `visibility`: 'public' (house knows power and holder), 'holder-secret'
 * (house knows it exists, not who holds it), 'secret' (nobody knows until it
 * fires). `source` is the distributor's id — provenance for the Debug panel
 * and the aftermath, never consulted by the rules.
 */
/**
 * The last week a power may fire.
 *
 * `windowWeeks` answers "how long may the holder sit on it". `windowUntil` is a
 * second axis answering "and never past HERE", and a power carrying both dies
 * at whichever comes first.
 *
 * Only one value so far: `'jury'`. BB27's secret powers all expired the moment
 * the jury opened, and that expiry is the reason they were allowed to be that
 * strong — a power that rewrites a Head of Household is a fun week in week
 * three and decides a season in week ten. Written to be unusable by then rather
 * than balanced down to nothing.
 *
 * Counted in HOUSE SIZE rather than in weeks, because that is what the jury
 * rule is: `juryOpensAt` returns the number still playing when the first juror
 * is seated, and a double eviction gets there a week early.
 */
export function expiryFor(def, week) {
  const byWeeks = week + (def.windowWeeks || 1) - 1;
  if (def.windowUntil !== 'jury') return byWeeks;
  let opensAt = 0;
  try { opensAt = juryOpensAt(); } catch { opensAt = 0; }
  const house = (gs.activePlayers || []).length;
  // No jury configured, or the season is already past the line: the week count
  // is all there is, and a power granted after the jury opened is already dead.
  if (!opensAt || !house) return byWeeks;
  // How many evictions between now and the jury opening, one a week — the
  // projection is deliberately simple, and a double eviction inside the window
  // only ever makes the real expiry EARLIER than promised, never later.
  const weeksLeft = Math.max(0, house - opensAt);
  return Math.min(byWeeks, week + weeksLeft - 1);
}

/**
 * Do they spend it tonight?
 *
 * Every gate on the shelf was answering this question on its own, with its own
 * hand-tuned constants, and they had all drifted the same way: timid. Measured
 * over sixty seeded weeks with the power granted to somebody who was ACTUALLY
 * in trouble that week, the Cloud fired 80% of the time and the Interrogation
 * 57% — so one in five holders walked onto the block still holding the thing
 * that would have stopped it, and nearly half of the biggest power in the game
 * sat in a pocket through the exact week it was written for.
 *
 * Two rules, and they are the whole model:
 *
 *   1. NEED IS THE ANSWER. A holder who is the likeliest name on the board
 *      plays it. Patience is something you can only afford when it is not you,
 *      which is why patience here is scaled by `1 - need` — at full need it is
 *      exactly zero, and no amount of remaining window makes somebody sit on a
 *      power through their own eviction.
 *   2. THE LAST WEEK IS NOT A NUDGE. An unspent power at the end of its window
 *      is worth nothing at all, so the final week ignores patience entirely and
 *      a marginal use beats binning it. It was a +0.18 bonus on the Diamond and
 *      a +0.22 on the Hex, which is a rounding error against a decision.
 *
 * `nerve` (boldness) tilts it either way by a few points. It is a tilt and not
 * a gate on purpose: a timid houseguest hesitates, they do not hold a veto
 * while being evicted with it.
 *
 * @param need 0..1, how badly this week wants it — proportional, never a step
 * @param weeksLeft evictions left in the window; 0 means tonight or never
 * @param nerve 0..1, usually boldness/10
 */
export function spendPull({ need = 0, weeksLeft = 0, nerve = 0.5, exposes = true } = {}) {
  const cl = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
  const n = cl(need, 0, 1);
  const b = cl(nerve, 0, 1);
  // ── THE LAST WEEK IT EXISTS ──
  //
  // Not forced, on purpose. A power carried for a month and never spent is a
  // real Big Brother outcome and one of the memorable ones — the careful
  // player waiting for a perfect week that never arrived — and the transcript
  // already has a screen for exactly that. Forcing it deletes the story and
  // replaces it with a move nobody chose.
  //
  // What decides the floor is what spending COSTS. A secret power reveals
  // nothing when it is played, so sitting on it until it dies buys its holder
  // nothing at all: they should nearly always spend. A public one is different
  // — burning it with no target tells the house you had it and gets you
  // nothing back, and letting that expire is the correct play rather than a
  // failure of nerve.
  //
  // And nerve finally matters here, which it did not before: this branch
  // computed boldness and then ignored it, so the bold holder and the timid one
  // behaved identically in the one week where character should decide it.
  // A real need still overrides everything and takes both to the ceiling.
  if (weeksLeft <= 0) {
    const floor = exposes ? 0.20 + b * 0.25 : 0.60 + b * 0.25;
    return cl(floor + n * (0.97 - floor), 0, 0.97);
  }
  const base = n * (1.02 + (b - 0.5) * 0.14);
  const patience = Math.min(1, weeksLeft / 3) * (1 - b) * 0.45 * (1 - n);
  return cl(base - patience, 0.02, 0.97);
}

export function grantPower(powerId, holder, { week = 1, visibility = 'public', source = 'unknown' } = {}) {
  const def = BB_POWER_DEFINITIONS[powerId];
  if (!def || !holder) return null;
  const instance = {
    powerId, holder, visibility, source,
    acquiredWeek: week,
    expiresAfterWeek: expiryFor(def, week),
    used: false, usedWeek: null,
    disposed: false, disposedReason: null,
  };
  store().push(instance);

  // ── who knows, recorded HERE because every distributor comes through here ──
  //
  // This is not the first twist to hand out a power in secret — the Whacktivity,
  // Pandora's Box, the Den of Temptation and Something In This House have all
  // been doing it — and none of them recorded who knew. So "who has the power"
  // was not a fact the house could hold, be wrong about, or find out. It was
  // nowhere at all.
  //
  // Put on `grantPower` rather than in any one module for the obvious reason:
  // five callers granting secretly is five places to forget, and the sixth
  // would have forgotten too.
  //
  // `visibility` already says who should know, and it is the instance's own
  // field, so nothing needs to be passed:
  //
  //   public         the house watched it happen
  //   holder-secret  the house knows the power EXISTS, not who has it — so the
  //                  holder fact stays with the holder
  //   secret         nobody
  const witnesses = visibility === 'public' ? (gs.activePlayers || []) : [];
  try { recordBBPower(holder, powerId, { week, knownTo: witnesses }); } catch { /* knowledge is not load-bearing for the grant */ }

  return instance;
}

/** Every live instance a houseguest holds, optionally filtered by power id. */
export function heldPowers(holder, powerId = null) {
  return store().filter(p => p.holder === holder && !p.used && !p.disposed
    && (!powerId || p.powerId === powerId));
}

/**
 * Every live instance that may fire at this timing, this week.
 *
 * More than one CAN be live at once — a house running both Pandora's Box and
 * the App Store can easily have a secret Diamond and a Bonus Life sitting on
 * the same eviction night, and they are different powers that fire at
 * different moments of it. Callers should name the power they came for.
 */
export function activePowersAt(timing, week, powerId = null) {
  return store().filter(p => {
    if (p.used || p.disposed) return false;
    if (week > p.expiresAfterWeek) return false;
    if (powerId && p.powerId !== powerId) return false;
    const def = BB_POWER_DEFINITIONS[p.powerId];
    if (!def) return false;
    const t = typeof def.useTiming === 'string' ? def.useTiming
      : def.useTiming[p.visibility === 'public' ? 'public' : 'secret'];
    return t === timing;
  });
}

/**
 * The live instance that may fire at this timing, this week — or null.
 *
 * `powerId` is optional but callers should pass it: without it this returns
 * whichever instance happens to sit earliest in the store, which meant a
 * Bonus Life granted before a secret Diamond silently ate the Diamond's
 * detonation. Every timing in this engine can now hold more than one power.
 */
export function activePowerAt(timing, week, powerId = null) {
  return activePowersAt(timing, week, powerId)[0] || null;
}

/**
 * What was in somebody's pocket this week, for the screen.
 *
 * The store is a running ledger across the whole season, and a replayed week
 * needs the state as it was THEN — so this is snapshotted per week rather than
 * read live. An instance belongs to the week if its window covers it or if it
 * fired in it, and it carries the definition's plain-language rules along with
 * it: four powers with similar names and different limitations are not
 * something a viewer should be expected to hold in their head.
 */
export function powerLedgerFor(week, house = gs.activePlayers || []) {
  return store()
    .filter(p => {
      if (p.acquiredWeek > week) return false;
      // ── SPENT IS NOT STILL OUT THERE ──
      //
      // There was no `used` check here at all. The three clauses this replaces
      // were `usedWeek === week` and then two window tests that differed only in
      // `disposed` versus `!disposed` — which between them cover every value of
      // the flag, so the disposal half was doing nothing whatsoever and the
      // window half kept a SPENT power on the wall for the rest of its would-be
      // life. A Diamond detonated in week three with a window through week four
      // came back the following week reading "LAST WEEK IT EXISTS", under a
      // heading that says STILL OUT THERE, after the audience had watched it go
      // off. It belongs on the week it fired and on no week after it.
      if (p.used) return p.usedWeek === week;
      // Same for one that left: the night it went, and not a week longer. With
      // no record of WHEN it was disposed there was nothing to compare against,
      // so a power lost with an evicted holder sat there being lost again every
      // week until its original window ran out.
      if (p.disposed) return (p.disposedWeek ?? p.expiresAfterWeek) === week;
      return week <= p.expiresAfterWeek;
    })
    .map(p => {
      const def = BB_POWER_DEFINITIONS[p.powerId] || {};
      // The holder walking out the door is what disposes a power, and that
      // sweep runs at the END of the week — after this snapshot, deliberately,
      // so that a power expiring tonight still shows as live for the week it
      // was live in. The side effect was that the person who had just been
      // evicted was still listed as carrying something, on the screen for the
      // night they left. Expiry needs the delay; an eviction does not.
      const holderGone = !p.used && !p.disposed
        && !(house || []).includes(p.holder) && !def.survivesEviction;
      return {
        powerId: p.powerId, name: def.name || p.powerId,
        holder: p.holder, visibility: p.visibility, source: p.source,
        acquiredWeek: p.acquiredWeek, expiresAfterWeek: p.expiresAfterWeek,
        weeksLeft: Math.max(0, p.expiresAfterWeek - week),
        used: !!p.used, usedWeek: p.usedWeek,
        firedThisWeek: p.usedWeek === week,
        disposed: !!p.disposed || holderGone,
        disposedReason: p.disposedReason || (holderGone ? 'holder-evicted' : null),
        blurb: def.blurb || '', catch: def.catch || '', moment: def.moment || '',
      };
    });
}

/** Fire it. The instance stays in the store as the record of what happened. */
export function usePower(instance, week) {
  if (!instance) return null;
  instance.used = true;
  instance.usedWeek = week;
  return instance;
}

/**
 * End-of-week sweep: expiry, and holders who left the house. A power whose
 * holder walked out the door is disposed, not inherited — the show has never
 * let one change hands on the way out.
 */
export function expirePowers(week, house = gs.activePlayers || []) {
  // Returns what it just disposed, so a caller can tell the VIEWER about a
  // power that was carried for weeks and never spent. The house is told
  // nothing — it never knew the thing existed — but a power quietly vanishing
  // out of the game with nobody ever mentioning it is a story the audience is
  // owed, and it was happening invisibly.
  const disposed = [];
  for (const p of store()) {
    if (p.used || p.disposed) continue;
    const def = BB_POWER_DEFINITIONS[p.powerId] || {};
    // A Bonus Life is not lost when its holder is: being evicted is the
    // trigger, not the end. It stays live for whoever has to resolve it.
    if (!house.includes(p.holder) && !def.survivesEviction) {
      // WHEN, not just that. Without a week on it the screen had no way to
      // tell "this left tonight" from "this left a fortnight ago".
      p.disposed = true; p.disposedReason = 'holder-evicted'; p.disposedWeek = week;
      disposed.push(p); continue;
    }
    // `expiresAfterWeek` is the LAST week the thing can be played — every use
    // site treats it that way (`week <= expiresAfterWeek` is live, `week >=`
    // is last chance). This sweep runs at the very end of that week, after all
    // of them, so the window has genuinely closed and the viewer should be
    // told tonight. It used to wait for `>`, which left a dead week where the
    // power was unusable but not yet disposed and pushed the audience's note
    // about it a full episode late.
    if (week >= p.expiresAfterWeek) {
      p.disposed = true; p.disposedReason = 'expired'; p.disposedWeek = week;
      disposed.push(p);
    }
  }
  return disposed;
}
