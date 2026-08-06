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
export function grantPower(powerId, holder, { week = 1, visibility = 'public', source = 'unknown' } = {}) {
  const def = BB_POWER_DEFINITIONS[powerId];
  if (!def || !holder) return null;
  const instance = {
    powerId, holder, visibility, source,
    acquiredWeek: week,
    expiresAfterWeek: week + (def.windowWeeks || 1) - 1,
    used: false, usedWeek: null,
    disposed: false, disposedReason: null,
  };
  store().push(instance);
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
export function powerLedgerFor(week) {
  return store()
    .filter(p => p.usedWeek === week
      || (!p.disposed && p.acquiredWeek <= week && week <= p.expiresAfterWeek)
      || (p.disposed && p.acquiredWeek <= week && week <= p.expiresAfterWeek))
    .map(p => {
      const def = BB_POWER_DEFINITIONS[p.powerId] || {};
      return {
        powerId: p.powerId, name: def.name || p.powerId,
        holder: p.holder, visibility: p.visibility, source: p.source,
        acquiredWeek: p.acquiredWeek, expiresAfterWeek: p.expiresAfterWeek,
        weeksLeft: Math.max(0, p.expiresAfterWeek - week),
        used: !!p.used, usedWeek: p.usedWeek,
        firedThisWeek: p.usedWeek === week,
        disposed: !!p.disposed, disposedReason: p.disposedReason || null,
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
      p.disposed = true; p.disposedReason = 'holder-evicted';
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
      p.disposed = true; p.disposedReason = 'expired';
      disposed.push(p);
    }
  }
  return disposed;
}
