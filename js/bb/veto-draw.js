// ══════════════════════════════════════════════════════════════════════
// bb/veto-draw.js — somebody rewrites who is playing for the veto
// ══════════════════════════════════════════════════════════════════════
//
// veto-rules.js owns what the medallion IS. This owns who gets to play for it,
// which is a different hook in a different half of the week: it fires after the
// chips come out of the bag and before a single thing has been played.
//
// Both of these are POWERS, and that matters more than it looks. They shipped
// first as schedulable week cards — production announces a redraw, the field
// changes, nobody decided it — and the narration ended up repeating that there
// was nobody to blame, which is a twist arguing for its own dullness. With a
// holder there is a decision, and the decision is nasty:
//
//   THE REPLACEMENT  the holder names one houseguest to take OUT of the
//                    competition and one to put IN. The obvious best use is
//                    entirely self-serving — remove whoever is most likely to
//                    spend the veto against you, and sit down in their seat
//                    yourself.
//
//   THE REDRAW       a re-roll, not a choice. Every drawn chip goes back and
//                    the bag decides again. A holder uses it when the field is
//                    bad for them and gambles that a random one is better,
//                    which it very often is not.
//
// The seats that cannot be touched are the ones the Hacker cannot touch: the
// Head of Household and the nominees play by right. Nothing in the format's
// history has ever taken that away.
import { gs } from '../core.js';
import { pronouns, pStats } from '../players.js';
import { addBond, getPerceivedBond } from '../bonds.js';
import { activePowerAt, usePower } from './powers.js';
import { allyStake } from './shared-strategy.js';

/** What the week does to the field, and who is holding it. */
export function resolveVetoDrawRules(week) {
  const rules = week?.twistState?.rules || {};
  const out = { redraw: !!rules.vetoRedraw, replace: Number(rules.vetoReplace) || 0,
    holder: null, instance: null, visibility: 'public' };
  // Named instances, not "whatever is live at this timing". activePowerAt
  // without a powerId returns whichever instance happens to sit earliest in the
  // store, which is how a Bonus Life once silently ate a secret Diamond's
  // detonation.
  const byRedraw = activePowerAt('veto-draw', week?.num, 'veto-redraw');
  const byReplace = activePowerAt('veto-draw', week?.num, 'veto-replacement');
  // The replacement is the stronger of the two and wins if somebody somehow
  // holds both: a re-roll on top of a chosen seat would throw the choice away.
  if (byRedraw) Object.assign(out, { redraw: true, holder: byRedraw.holder, instance: byRedraw, visibility: byRedraw.visibility });
  if (byReplace) Object.assign(out, { replace: Math.max(out.replace, 1), holder: byReplace.holder, instance: byReplace, visibility: byReplace.visibility });
  return out;
}

const _pop = (name, delta) => {
  if (!name) return;
  gs.popularity ||= {};
  gs.popularity[name] = (gs.popularity[name] || 0) + delta;
};

/**
 * How dangerous a houseguest in this competition is TO THE HOLDER.
 *
 * Not "how good are they" — how much damage does their winning do. Somebody
 * close to a nominee will take that nominee off the block; somebody close to
 * the holder will not use it against them. This is the number the whole
 * replacement decision turns on.
 */
function _threatToHolder(name, { holder, nominees, hoh }) {
  if (name === holder) return -99;
  // What they are worth to the holder — the alliance included. On a raw bond
  // alone the redraw seated whoever the holder LIKED, which is not the same
  // question: the person you are sworn to is the person you want holding a
  // veto, and being sworn to them counted for nothing here.
  const bondToMe = getPerceivedBond(holder, name) + allyStake(holder, name) * 8;
  const bondToBlock = Math.max(0, ...nominees.map(n => getPerceivedBond(name, n)), 0);
  const bondToHoh = hoh ? Math.max(0, getPerceivedBond(name, hoh)) : 0;
  const st = pStats(name);
  // Physical people win vetoes; that is only a problem if they would use it
  // somewhere the holder does not want it used.
  const canWin = ((st.physical || 5) + (st.mental || 5) + (st.endurance || 5)) / 30;
  return (bondToBlock * 1.3 + bondToHoh * 0.5 - bondToMe * 1.1) * (0.6 + canWin);
}

/**
 * Rewrite the veto field.
 *
 * @returns {{players: string[], act: object}|null} null when there is nothing
 *          the power could legally change, or when its holder looks at the
 *          field and decides it is already fine. Both are real outcomes: the
 *          instance stays live for the rest of its window.
 */
export function applyVetoDrawTwist({
  week, players = [], house = [], hoh = null, nominees = [], rng = Math.random,
} = {}) {
  const spec = resolveVetoDrawRules(week);
  if (!spec.redraw && spec.replace < 1) return null;

  const byRight = [hoh, ...nominees].filter(Boolean);
  const drawn = players.filter(n => !byRight.includes(n));
  const bench = house.filter(n => !players.includes(n));
  if (!drawn.length || !bench.length) return null;

  const anonymous = spec.visibility === 'secret' || spec.visibility === 'holder-secret';
  const holder = spec.holder && house.includes(spec.holder) ? spec.holder : null;
  const ctx = { holder: holder || hoh, nominees, hoh };

  if (spec.replace >= 1) {
    // ── the choice ──
    //
    // Out goes whoever is worst for the holder. In comes the holder themselves
    // if they are not already playing — there is no better use of this and a
    // houseguest would see that instantly — otherwise their safest ally.
    const out = [...drawn].sort((a, b) => _threatToHolder(b, ctx) - _threatToHolder(a, ctx))[0];
    const selfSeat = holder && bench.includes(holder);
    const into = selfSeat ? holder
      : [...bench].sort((a, b) => _threatToHolder(a, ctx) - _threatToHolder(b, ctx))[0];
    if (!out || !into) return null;

    if (spec.instance) { try { usePower(spec.instance, week.num); } catch { /* ledger */ } }
    _pop(out, 1.5);
    _pop(into, 0.5);
    // Somebody did this, and unless it was done in secret the person it was
    // done to knows exactly who.
    if (holder && !anonymous && holder !== out) addBond(out, holder, -2.2);
    else if (holder !== out) addBond(out, into, -1.1);

    return {
      players: players.map(n => (n === out ? into : n)),
      act: _act({
        kind: 'replace', week, hoh, nominees, holder, anonymous, selfSeat,
        before: [...drawn], after: drawn.map(n => (n === out ? into : n)),
        lost: [out], gained: [into], kept: drawn.filter(n => n !== out), changed: true,
      }),
    };
  }

  // ── the gamble ──
  //
  // No choice to make, so the only decision is WHETHER. A holder re-rolls when
  // the field as drawn is working against them; a field they are happy with is
  // left alone and the power keeps its window.
  const worst = Math.max(...drawn.map(n => _threatToHolder(n, ctx)));
  if (holder && worst < 1.2) return null;

  const pool = house.filter(n => !byRight.includes(n));
  const bag = [...pool];
  const fresh = [];
  for (let i = 0; i < drawn.length && bag.length; i++) {
    fresh.push(bag.splice(Math.floor(rng() * bag.length), 1)[0]);
  }
  const kept = fresh.filter(n => drawn.includes(n));
  const lost = drawn.filter(n => !fresh.includes(n));
  const gained = fresh.filter(n => !drawn.includes(n));
  const changed = lost.length > 0;

  if (spec.instance) { try { usePower(spec.instance, week.num); } catch { /* ledger */ } }
  for (const name of lost) {
    _pop(name, 1.5);
    if (holder && !anonymous) addBond(name, holder, -1.6);
  }
  for (const name of gained) _pop(name, 0.5);

  return {
    players: [...byRight, ...fresh],
    act: _act({
      kind: 'redraw', week, hoh, nominees, holder, anonymous, selfSeat: false,
      before: [...drawn], after: [...fresh], lost, gained, kept, changed,
      // Did the gamble pay? Measured against the same number that made them
      // spend it, so the screen can say whether it was worth doing.
      better: changed && Math.max(...fresh.map(n => _threatToHolder(n, ctx))) < worst,
    }),
  };
}

/**
 * The scene, written where the facts are.
 *
 * Rewritten once already. The first draft opened on "the field as it stood",
 * which is a phrase that means nothing to somebody who has not read the code:
 * a reader needs telling, in the first sentence, that six people play for the
 * veto and which three of them were luck.
 */
function _act({ kind, week, hoh, nominees, holder, anonymous, selfSeat,
  before, after, lost, gained, kept, changed, better }) {
  const beats = [];
  const nom = nominees.filter(Boolean);
  const who = anonymous ? 'Somebody in this house' : holder;
  const blockLine = nom.length === 2 ? `${nom[0]} and ${nom[1]}` : nom.join(' and ');

  if (kind === 'replace') {
    beats.push({
      text: `Six houseguests play for the Power of Veto: ${hoh} as Head of Household, ${blockLine} `
        + `as the nominees, and three more drawn out of a bag — this week ${before.join(', ')}. `
        + `${who} is holding a power that can change one of those three.`,
      players: [...new Set([...before, holder].filter(Boolean))],
      badgeText: 'SIX PLAY FOR IT', badgeClass: 'twist',
    });
    const pl = pronouns(lost[0]);
    beats.push({
      text: `${lost[0]} is taken out of the competition. ${pl.Sub} drew a chip in front of everybody, `
        + `spent the afternoon being spoken to very kindly by people who needed something, and `
        + `${pl.sub === 'they' ? 'are' : 'is'} now watching from the sofa.`,
      players: [...new Set([lost[0], holder].filter(Boolean))],
      badgeText: 'TAKEN OUT', badgeClass: 'red',
    });
    beats.push({
      text: selfSeat
        ? `${gained[0]} takes the empty seat — which is to say ${anonymous ? 'whoever did this put '
          + 'themselves in' : `${holder} put ${pronouns(holder).obj}self in`}. The person holding the `
          + `power is now playing for the veto, which is the entire reason to hold it.`
        : `${gained[0]} goes in instead, having drawn nothing and asked for nothing. `
          + `${anonymous ? 'Nobody is told whose hand chose that name.' : `${holder} chose it, in front of everybody.`}`,
      players: [...new Set([gained[0], holder].filter(Boolean))],
      badgeText: selfSeat ? 'AND SITS DOWN IN IT' : 'PUT IN', badgeClass: 'gold',
    });
    if (nom.length) {
      beats.push({
        text: `${blockLine} spent two days working out which of those three might take them off the `
          + `block, and one of the names they settled on is no longer in the room. They have until the `
          + `competition starts to find another.`,
        players: [...nom], badgeText: 'START AGAIN', badgeClass: 'blue',
      });
    }
    return _pack({ kind, week, hoh, nom, holder, anonymous, selfSeat, before, after, lost, gained, kept, changed, beats });
  }

  beats.push({
    text: `Six houseguests play for the Power of Veto: ${hoh} as Head of Household, ${blockLine} as the `
      + `nominees, and three drawn out of a bag — ${before.join(', ')}. ${who} does not like those three, `
      + `and is holding something that can send all of them back.`,
    players: [...new Set([...before, holder].filter(Boolean))],
    badgeText: 'SIX PLAY FOR IT', badgeClass: 'twist',
  });
  beats.push({
    text: `The chips go back in and come out again. ${anonymous ? 'The house is not told who caused it'
      : `${holder} does not get to choose the new names any more than the old ones`} — this is a `
      + `re-roll, not a pick, and the bag does not care whose week it is.`,
    players: [...new Set([...before, holder].filter(Boolean))],
    badgeText: 'BACK IN THE BAG', badgeClass: 'twist',
  });
  if (!changed) {
    beats.push({
      text: `The bag returns all three names: ${after.join(', ')}. The competition is exactly the `
        + `competition it was five minutes ago, ${who === holder && !anonymous ? `${holder} has spent a `
          + 'power on nothing' : 'somebody has spent a power on nothing'}, and everybody standing there `
        + `has just watched how easily it could have gone the other way.`,
      players: [...new Set([...after, holder].filter(Boolean))],
      badgeText: 'THE SAME THREE NAMES', badgeClass: 'grey',
    });
  } else {
    const one = lost.length === 1;
    const p = pronouns(lost[0]);
    const sub = one ? p.sub : 'they';
    const were = one ? (p.sub === 'they' ? 'were' : 'was') : 'were';
    beats.push({
      text: `${lost.join(' and ')} ${one ? 'does' : 'do'} not come back out of the bag. `
        + `${sub[0].toUpperCase()}${sub.slice(1)} ${were} playing for the veto ten minutes ago and `
        + `${one ? 'is' : 'are'} not now.`,
      players: [...lost], badgeText: 'OUT OF THE COMPETITION', badgeClass: 'red',
    });
    beats.push({
      text: `${gained.join(' and ')} ${gained.length === 1 ? 'is' : 'are'} drawn in instead. `
        + `${better ? `${anonymous ? 'Whoever spent that power' : holder} has gambled and won: this field `
          + 'is friendlier than the one it replaced.'
        : `${anonymous ? 'Whoever spent that power' : holder} has gambled and lost — the new three are no `
          + 'better than the old three, and the power is gone either way.'}`,
      players: [...new Set([...gained, holder].filter(Boolean))],
      badgeText: better ? 'THE GAMBLE PAYS' : 'IT DID NOT HELP', badgeClass: better ? 'gold' : 'red',
    });
    if (kept.length) {
      beats.push({
        text: `${kept.join(' and ')} ${kept.length === 1 ? 'draws' : 'draw'} straight back in and `
          + `${kept.length === 1 ? 'is' : 'are'} careful not to look pleased about it, which is a thing `
          + `everybody notices people being careful about.`,
        players: [...kept], badgeText: 'DREW AGAIN', badgeClass: 'blue',
      });
    }
  }
  return _pack({ kind, week, hoh, nom, holder, anonymous, selfSeat, before, after, lost, gained, kept, changed, beats, better });
}

function _pack({ kind, week, hoh, nom, holder, anonymous, selfSeat, before, after,
  lost, gained, kept, changed, beats, better }) {
  return {
    type: 'veto-draw-twist', kind, holder: holder || null, anonymous: !!anonymous,
    selfSeat: !!selfSeat, better: !!better,
    before: [...before], after: [...after],
    lost: [...lost], gained: [...gained], kept: [...kept], changed: !!changed,
    hoh, nominees: [...nom], num: week?.num || 0, beats,
  };
}
