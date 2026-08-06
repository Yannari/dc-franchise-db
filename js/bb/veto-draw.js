// ══════════════════════════════════════════════════════════════════════
// bb/veto-draw.js — who is standing in the competition
// ══════════════════════════════════════════════════════════════════════
//
// veto-rules.js owns what the medallion IS. This owns who gets to play for it,
// which is the other half of the same week and a completely different hook: it
// fires between the draw and the competition, before anybody has won anything.
//
// Two shapes, and they are the same twist at two sizes:
//
//   REDRAW      every drawn chip goes back in the bag and the house draws
//               again. The Head of Household and the nominees keep their
//               seats — they play by right and no twist has ever taken that
//               away — so what is being re-rolled is exactly the part of the
//               field that was luck in the first place.
//
//   REPLACEMENT one seat, swapped. Somebody who drew a chip loses it and
//               somebody who drew nothing takes it.
//
// The reason this is worth building as its own thing: it is the only twist in
// the format that TAKES SOMETHING BACK. Every other one hands a power out. Here
// a houseguest who was already standing in the competition — who has spent two
// days being promised things by a nominee because they were standing in it —
// is put back in the crowd while everybody watches, and the person who takes
// their place did nothing to earn it. Nobody chose, which does not stop anybody
// blaming anybody.
//
// The seats the Hacker cannot touch are the seats this cannot touch either, and
// for the same reason (week.js does the same byRight filter): the HOH and the
// nominees are in that competition as a matter of rule, not of draw.
import { gs } from '../core.js';
import { pronouns } from '../players.js';
import { addBond } from '../bonds.js';
import { activePowerAt } from './powers.js';

/** What the week does to the field, from a contract rule or a held power. */
export function resolveVetoDrawRules(week) {
  const rules = week?.twistState?.rules || {};
  const out = { redraw: !!rules.vetoRedraw, replace: Number(rules.vetoReplace) || 0, holder: null };
  // Named instances, not "whatever is live at this timing". activePowerAt
  // without a powerId returns whichever instance happens to sit earliest in the
  // store, which is how a Bonus Life once silently ate a secret Diamond's
  // detonation — this hook is new, so it gets that right on the way in rather
  // than after the same bug. No power carries these rules yet; the channel is
  // here so one can, exactly as the Diamond arrives through veto-rules.
  const byRedraw = activePowerAt('veto-draw', week?.num, 'veto-redraw');
  const byReplace = activePowerAt('veto-draw', week?.num, 'veto-replacement');
  if (byRedraw) { out.redraw = true; out.holder = byRedraw.holder; }
  if (byReplace) { out.replace = Math.max(out.replace, 1); out.holder ||= byReplace.holder; }
  return out;
}

const _pop = (name, delta) => {
  if (!name) return;
  gs.popularity ||= {};
  gs.popularity[name] = (gs.popularity[name] || 0) + delta;
};

/**
 * Rewrite the veto field.
 *
 * @returns {{players: string[], act: object}|null} null when there is nothing
 *          the twist could legally change — which is a real outcome and not a
 *          failure. A house with exactly enough eligible people to fill the
 *          drawn seats cannot be redrawn into a different field, and pretending
 *          otherwise would put a ceremony on screen that changed nothing.
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

  const pick = list => list[Math.floor(rng() * list.length)];

  if (spec.redraw) {
    // Back in the bag: every drawn seat at once. The pool is everybody who is
    // not playing by right, INCLUDING the people who were just holding those
    // seats — a redraw they can win back is what makes it a draw rather than
    // an eviction from the competition.
    const pool = house.filter(n => !byRight.includes(n));
    const seats = drawn.length;
    const bag = [...pool];
    const fresh = [];
    for (let i = 0; i < seats && bag.length; i++) {
      fresh.push(bag.splice(Math.floor(rng() * bag.length), 1)[0]);
    }
    const kept = fresh.filter(n => drawn.includes(n));
    const lost = drawn.filter(n => !fresh.includes(n));
    const gained = fresh.filter(n => !drawn.includes(n));
    // The bag handed back the same names. Legal, and a scene — but it is not a
    // changed field, so nothing downstream should be told it was one.
    const changed = lost.length > 0;

    for (const name of lost) {
      _pop(name, 1.5);
      for (const taker of gained) {
        // Nobody decided this. That has never once stopped anybody.
        addBond(name, taker, -1.2);
      }
    }
    for (const name of gained) _pop(name, 0.5);

    return {
      players: [...byRight, ...fresh],
      act: _act({
        kind: 'redraw', week, hoh, nominees, holder: spec.holder,
        before: [...drawn], after: [...fresh], lost, gained, kept, changed,
      }),
    };
  }

  // ── one seat ──
  const out = pick(drawn);
  const into = pick(bench);
  if (!out || !into) return null;
  _pop(out, 1.5);
  _pop(into, 0.5);
  addBond(out, into, -1.4);
  return {
    players: players.map(n => (n === out ? into : n)),
    act: _act({
      kind: 'replace', week, hoh, nominees, holder: spec.holder,
      before: [...drawn], after: drawn.map(n => (n === out ? into : n)),
      lost: [out], gained: [into], kept: drawn.filter(n => n !== out), changed: true,
    }),
  };
}

/** The scene, written where the facts are. */
function _act({ kind, week, hoh, nominees, holder, before, after, lost, gained, kept, changed }) {
  const beats = [];
  const nom = nominees.filter(Boolean);
  if (kind === 'redraw') {
    beats.push({
      text: `The chips go back in one at a time, which takes longer than anybody expects and gives `
        + `${before.length === 1 ? before[0] : 'everybody'} time to work out what it means. `
        + `${hoh} watches a competition ${pronouns(hoh).sub} had already worked out how to survive `
        + `stop existing.`,
      // The HOH is named in the line, so the HOH is on the card. `before` never
      // contains them — they play by right and are not a drawn chip — so this
      // cannot double-cast anybody.
      players: [...new Set([...before, hoh].filter(Boolean))],
      badgeText: 'BACK IN THE BAG', badgeClass: 'twist',
    });
    if (!changed) {
      beats.push({
        text: `The bag gives back every name it was given. ${after.join(', ')} — the same field, drawn `
          + `twice, which somehow feels less like luck the second time. Nothing has changed and `
          + `everybody in the room now knows it could have.`,
        players: [...after], badgeText: 'THE SAME NAMES', badgeClass: 'grey',
      });
    } else {
      // One person or several, and the sentence has to work either way. The
      // first draft reached for pronouns(lost[0]) throughout, so two people
      // going out of the competition were referred to, in the same breath, as
      // "they" and then as "him".
      const one = lost.length === 1;
      const p = pronouns(lost[0]);
      const sub = one ? p.sub : 'they';
      const obj = one ? p.obj : 'them';
      const were = one ? (p.sub === 'they' ? 'were' : 'was') : 'were';
      const are = one ? (p.sub === 'they' ? 'are' : 'is') : 'are';
      beats.push({
        text: `${lost.join(' and ')} ${one ? 'does' : 'do'} not come back out of it. ${sub[0].toUpperCase()}`
          + `${sub.slice(1)} ${were} playing for the veto ten minutes ago and ${sub} ${are} not now, and `
          + `nobody did it to ${obj} — which is somehow the part that is hardest to be reasonable about.`,
        players: [...lost], badgeText: 'OUT OF THE COMPETITION', badgeClass: 'red',
      });
      beats.push({
        text: `${gained.join(' and ')} ${gained.length === 1 ? 'is' : 'are'} in, having done nothing `
          + `whatsoever to be. ${nom.length ? `${nom.join(' and ')} ${nom.length === 1 ? 'has' : 'have'} `
            + `a whole afternoon of promises to make again, to different people, faster.`
            : 'The block has to start its negotiating over.'}`,
        players: [...gained, ...nom].filter((n, i, a) => a.indexOf(n) === i),
        badgeText: 'IN, FOR NO REASON', badgeClass: 'gold',
      });
      if (kept.length) {
        beats.push({
          text: `${kept.join(' and ')} draws back in and ${kept.length === 1 ? 'is' : 'are'} careful not `
            + `to look pleased about it, which is a thing everybody notices people being careful about.`,
          players: [...kept], badgeText: 'DREW AGAIN', badgeClass: 'blue',
        });
      }
    }
  } else {
    const p = pronouns(lost[0]);
    beats.push({
      text: `One seat, and it is ${lost[0]}'s. ${p.Sub} drew a chip in front of everybody, spent the `
        + `afternoon being spoken to very kindly by people who needed something, and now ${p.sub} `
        + `${p.sub === 'they' ? 'are' : 'is'} watching from the sofa.`,
      players: [lost[0]], badgeText: 'THE SEAT IS TAKEN', badgeClass: 'red',
    });
    beats.push({
      text: `${gained[0]} takes it. No competition, no chip, no reason — the name simply came out, and `
        + `${gained[0]} is now playing for a medallion ${pronouns(gained[0]).sub} had already stopped `
        + `thinking about this week.`,
      players: [gained[0]], badgeText: 'IN, FOR NO REASON', badgeClass: 'gold',
    });
    if (nom.length) {
      beats.push({
        text: `${nom.join(' and ')} ${nom.length === 1 ? 'watches' : 'watch'} the one person `
          + `${nom.length === 1 ? 'they had' : 'they had'} worked out how to talk to walk away from the `
          + `field, and ${nom.length === 1 ? 'has' : 'have'} until the competition to work out the `
          + `next one.`,
        players: [...nom], badgeText: 'START AGAIN', badgeClass: 'blue',
      });
    }
  }
  return {
    type: 'veto-draw-twist', kind, holder: holder || null,
    before: [...before], after: [...after],
    lost: [...lost], gained: [...gained], kept: [...kept], changed: !!changed,
    hoh, nominees: [...nom], num: week?.num || 0, beats,
  };
}
