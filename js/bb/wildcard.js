// ══════════════════════════════════════════════════════════════════════
// bb/wildcard.js — three names out of a hat, and safety with a bill on it
// ══════════════════════════════════════════════════════════════════════
//
// BB23's other season-long twist, and the one that fills the early weeks this
// theme would otherwise leave empty. The Safety Suite is its nearest neighbour
// and it is NOT the same game, in the two ways that matter:
//
//   · you do not choose to play. Three names are DRAWN. Being eligible is not
//     a decision anybody made, which is what stops this being a second suite.
//   · winning is not the end of it. The winner is offered safety at a PRICE,
//     and the price is a punishment — sometimes theirs, sometimes the whole
//     house's. Taking it is public. Refusing it is public.
//
// So the competition is the setup and the OFFER is the twist. A houseguest who
// wins and declines has told the room they do not need saving, which is a claim
// the room will test on Thursday. A houseguest who wins and accepts a
// house-wide punishment has bought a week of safety with everybody else's
// comfort, and there is no version of that the house does not notice.
//
// ── THE ADAPTATION, WRITTEN DOWN AS ONE ────────────────────────────────
//
// Canon drew one player from each of four assigned TEAMS. This engine has no
// assigned teams: `js/bb/blocs.js` derives blocs from alliances and showmances
// (`_buildBlocs` reads `gs.namedAlliances` and `gs.showmances`), so they are
// emergent, they change every week, and a houseguest can be in none of them.
// Drawing "one per team" against that would silently draw one per ACCIDENT.
//
// Building real assigned teams is a separate slice — the one the Cliques and
// Coaches formats would also need — so the draw is flat: three houseguests, at
// random, the Head of Household excluded. The mechanic canon actually turns on
// (drawn, not chosen; safety, at a price; in public) is kept whole. If assigned
// teams ever land, the draw is the only function here that has to change.
import { gs } from '../core.js';
import { pStats } from '../players.js';
import { getPerceivedBond, addBond } from '../bonds.js';
import { aptitude, clamp } from '../bb-comps/_shared.js';
import { stableRng } from './knowledge.js';
import { drawPunishment, applyPunishment, BB_PUNISHMENTS } from './punishments.js';

// Beats are plain facts with a `part`; the words are written by
// bb/script/ceremony.js from lines/wildact.js.
const beat = (text, players, badgeText, badgeClass = 'gold', part = null, extra = {}) =>
  ({ text, players: [...players].filter(Boolean), badgeText, badgeClass, ...(part ? { part } : {}), ...extra });

/** How many names come out of the hat. */
export const WILDCARD_DRAW = 3;

/**
 * What the Wildcard asks for.
 *
 * Deliberately NOT the Safety Suite's mix. That one is a scramble against a
 * clock and leans physical; this is a puzzle nobody had time to prepare for,
 * so it reads intuition and nerve. Two safety comps keyed off the same stats
 * would hand the same houseguest both of them all season.
 */
const WILDCARD_MIX = { mental: 0.32, intuition: 0.28, temperament: 0.22, physical: 0.18 };

/**
 * How often the price is billed to the WHOLE HOUSE rather than the winner.
 *
 * The house-wide version is the better card and it is deliberately the rarer
 * one. Every time it fires, one person's safety is paid for by everybody in the
 * building, in public, and the resentment is real and lands in the bonds below.
 * At a higher rate it would stop being an outrage and start being the weather.
 */
const HOUSE_PRICE_RATE = 0.35;

/** Who has already been drawn this season, so the hat does not repeat itself. */
function drawn() {
  if (!gs.bb) gs.bb = {};
  // Plain array. It rides the save through JSON.stringify every week, so no Set
  // lives here however much a membership test wants one.
  if (!Array.isArray(gs.bb.wildcardDrawn)) gs.bb.wildcardDrawn = [];
  return gs.bb.wildcardDrawn;
}

/**
 * Whether the winner takes the offer.
 *
 * Three things decide it and they genuinely pull against each other:
 *
 *   EXPOSURE. Somebody the Head of Household has no warmth for is a nomination
 *   waiting to happen, and a punishment is cheaper than a week on the block.
 *   This is most of the decision and it should be.
 *
 *   WHO PAYS. A price billed to the house is much harder to accept, because it
 *   is not a cost you serve — it is a debt you take out against everybody
 *   else's goodwill, and it comes due at a vote. A loyal houseguest will refuse
 *   a house-wide bill they would have taken alone.
 *
 *   NERVE. Boldness takes the deal, a steady temperament declines it, and it
 *   tilts rather than decides — a calm houseguest who can see the block coming
 *   still says yes.
 */
function acceptPull(name, { hoh, house, houseWide }) {
  const st = pStats(name) || {};
  const bond = (a, b) => { try { return getPerceivedBond(a, b); } catch { return 0; } };
  const exposure = clamp(0.5 - bond(hoh, name) * 0.06, 0, 1);
  // How much this houseguest cares about spending the room's goodwill. Loyalty
  // is the honest read for that, and it only matters when the house is paying.
  const conscience = houseWide ? ((st.loyalty ?? 5) / 10) * 0.38 : 0;
  const nerve = ((st.boldness ?? 5) * 0.7 + (10 - (st.temperament ?? 5)) * 0.3) / 10;
  const late = house.length <= 8 ? 0.12 : 0;    // late in a season, safety is worth more
  // ── THE BASE WAS MEASURED, AND THE FIRST GUESS WAS WRONG BY A LOT ──
  //
  // Shipped at 0.24 with a 0.55 conscience term and measured over real seasons:
  // 17 refusals to 5 solo acceptances to 2 house-wide ones. The twist's whole
  // headline — somebody buys a week and somebody pays for it — was firing in 8%
  // of the weeks it ran, and the card mostly produced nothing happening.
  //
  // Refusing has to stay a live option, because it is the more interesting of
  // the two outcomes and it is the one that makes a claim. It must not be the
  // DEFAULT. 0.40 with conscience at 0.38 lands the accept rate near two in
  // three, with the house-wide bill still the rarer half of it.
  return clamp(0.40 + exposure * 0.5 + nerve * 0.2 + late - conscience, 0.05, 0.95);
}

/**
 * Run the Wildcard.
 *
 * @returns {object|null} the act, or null when there is nobody to draw
 */
export function runWildcard({ week, house, hoh, nominees = [],
  rng = stableRng('bb-wildcard', gs?.bb?.seasonSalt || 0, week?.num || 0) } = {}) {
  const room = (house || []).filter(Boolean);
  if (room.length < 5) return null;
  const say = () => rng();   // each beat's wording used to be one draw here; the draw stays
  const beats = [];

  // ── the draw ──
  //
  // The Head of Household is excluded for the same reason every safety twist
  // excludes them: they already have the week. Everybody else is in the hat,
  // including the people who were drawn last time — with one preference, not a
  // rule: a houseguest who has never been drawn goes in ahead of one who has.
  // A hard exclusion would make the last week of the run deterministic on a
  // small house, and a flat hat lets the same person be drawn three times and
  // the twist stop being about the house.
  const pool = room.filter(n => n !== hoh);
  if (pool.length < 2) return null;
  const seen = drawn();
  const fresh = pool.filter(n => !seen.includes(n));
  const repeats = pool.filter(n => seen.includes(n));
  const hat = [...shuffle(fresh, rng), ...shuffle(repeats, rng)];
  const players = hat.slice(0, Math.min(WILDCARD_DRAW, hat.length));
  if (!players.length) return null;
  for (const name of players) if (!seen.includes(name)) seen.push(name);

  players.forEach((name, i) => {
    say();
    beats.push(beat(`${name} is drawn${i === 0 ? ' first' : ''}.`, [name], i === 0 ? 'FIRST OUT' : 'DRAWN', 'blue', 'drawn', { first: i === 0 }));
  });
  const missed = pool.filter(n => !players.includes(n));
  if (missed.length) {
    const who = missed[Math.floor(rng() * missed.length)] || missed[0];
    say();
    beats.push(beat(`${who} is not drawn.`, [who], 'NOT DRAWN', 'grey', 'missed'));
  }

  // ── the competition ──
  const scores = players.map(name => ({
    name,
    score: aptitude(name, WILDCARD_MIX) + (rng() - 0.5) * 5.2,
  })).sort((a, b) => b.score - a.score);
  scores.forEach((s, i) => {
    say();
    beats.push(beat(`${s.name} scores ${s.score.toFixed(1)}.`, [s.name], 'PLAYED IT', 'blue', 'played',
      { score: +s.score.toFixed(1), place: i + 1 }));
  });
  const winner = scores[0].name;

  // ── the offer, and who the bill goes to ──
  const houseWide = rng() < HOUSE_PRICE_RATE;
  // Costumes only when the house is paying: a house-wide week on slop is a
  // different twist (it is the Have-Nots) and would quietly overwrite a system
  // that already owns that week.
  const punishmentId = drawPunishment(rng, p => (houseWide ? !p.slop && !p.tether : !p.tether));
  const def = BB_PUNISHMENTS[punishmentId] || null;
  const label = def ? def.name : 'a punishment';

  const act = {
    type: 'wildcard', week: week?.num || 0, secret: false,
    players: [...players], scores: scores.map(s => ({ name: s.name, score: +s.score.toFixed(1) })),
    winner, houseWide, punishment: punishmentId, punishmentLabel: label,
    punishmentBlurb: def?.blurb || '', accepted: false, safe: [],
    served: [], hoh: hoh || null, beats,
  };

  if (rng() < acceptPull(winner, { hoh, house: room, houseWide })) {
    act.accepted = true;
    act.safe = [winner];
    say();
    beats.push(beat(houseWide ? `${winner} takes safety, and the house serves ${label}.` : `${winner} takes safety, and serves ${label}.`,
      [winner], houseWide ? 'THE HOUSE PAYS' : 'SAFE, AND PAYING FOR IT',
      houseWide ? 'red' : 'gold', 'took', { houseWide }));

    if (houseWide) {
      // ── AND IT COSTS THEM SOMETHING REAL ──
      //
      // Everybody but the winner serves it, `socialDrag` reads it for the rest
      // of the week, and the goodwill goes with it. A card that made one person
      // safe and everybody else merely inconvenienced would be a cosmetic
      // outrage; this one is a debt with a due date at the vote.
      for (const name of room) {
        if (name === winner) continue;
        applyPunishment(name, punishmentId, { week: week?.num || 1 });
        act.served.push(name);
        try { addBond(name, winner, -1.1); } catch { /* no bond, no grievance */ }
      }
      if (!gs.popularity) gs.popularity = {};
      gs.popularity[winner] = (gs.popularity[winner] || 0) - 1;
      const angriest = act.served
        .sort((a, b) => (pStats(a).temperament ?? 5) - (pStats(b).temperament ?? 5))[0];
      if (angriest) {
        beats.push(beat(`${angriest} is angry that ${act.served.length} people pay for ${winner}'s safety.`,
          [angriest, winner], 'THE BILL IS NOTED', 'red', 'bill', { count: act.served.length }));
      }
    } else {
      applyPunishment(winner, punishmentId, { week: week?.num || 1 });
      act.served = [winner];
      // Buying safety in public and wearing the receipt is, on balance, a good
      // look — it is the least threatening thing a houseguest can do.
      if (!gs.popularity) gs.popularity = {};
      gs.popularity[winner] = (gs.popularity[winner] || 0) + 1;
    }
  } else {
    say();
    beats.push(beat(`${winner} turns down safety.`, [winner], 'TURNED IT DOWN', 'grey', 'refused'));
    // ── REFUSING IS A CLAIM, AND CLAIMS MOVE THE ROOM ──
    //
    // Turning down safety in front of the house reads as somebody who knows
    // they have the votes. Whether that is true is Thursday's business; the
    // read lands either way, and the people already close to them believe it
    // hardest.
    if (!gs.popularity) gs.popularity = {};
    gs.popularity[winner] = (gs.popularity[winner] || 0) + 2;
    for (const name of room) {
      if (name === winner) continue;
      let b = 0;
      try { b = getPerceivedBond(name, winner); } catch { b = 0; }
      if (b > 0) { try { addBond(name, winner, 0.4); } catch { /* texture */ } }
    }
    if (nominees.includes(winner)) {
      beats.push(beat(`${winner} is on the block and turned down safety.`, [winner], 'ON THE BLOCK, AND SAID NO', 'red', 'blocked'));
    }
  }
  return act;
}

/** Fisher-Yates on a copy, so the caller's array is left alone. */
function shuffle(list, rng) {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Who the Wildcard protects this week. Empty unless the offer was taken. */
export const wildcardSafe = act => (act?.accepted ? (act.safe || []).filter(Boolean) : []);
