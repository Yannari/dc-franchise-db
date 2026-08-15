// ══════════════════════════════════════════════════════════════════════
// bb/high-rollers-room.js — the room where the money goes
// ══════════════════════════════════════════════════════════════════════
//
// `bb-bucks.js` shipped a currency that nothing could spend. That is a
// scoreboard, not an economy: a balance only means something once there is a
// door it opens, and a week where opening it was the wrong call.
//
// This is that door, and the one rule it is built around is the one the show
// got right and every simulation of it gets wrong:
//
//   PAYING IS NOT WINNING.
//
// The money leaves on the way IN. A houseguest hands over a hundred and
// twenty-five, plays, loses, and walks back out into a house that watched them
// walk in — poorer, no safer, and now visibly desperate. That is not a failure
// mode to be smoothed away. It is the entire reason a casino is dramatic and a
// vending machine is not, and the engine below charges the price before it
// knows the result specifically so no future edit can quietly make the room a
// purchase.
//
// ── WHAT IS PUBLIC AND WHAT IS NOT ──────────────────────────────────────
//
// Entry is PUBLIC: the house sees who got up and walked through that door, and
// a nominee going in on eviction week is a sentence everybody in the kitchen
// can finish. Balances stay PRIVATE, per the same canon `bb-bucks.js` follows —
// a houseguest knows their own money and nobody holds a ledger of anybody
// else's. So a beat here may say what a GAME COST (a fixed, announced price) or
// what somebody was PAID that week (an announced tier). It may never say what
// anybody has. The house is left doing arithmetic, which is the good part.
//
// ── ONE SEAT PER GAME PER SEASON ────────────────────────────────────────
//
// "The competitions can only be played once." That is canon and it is also
// what stops the richest houseguest simply buying the same safety every week
// until the finale. `gs.bb.roomPlays` is the record, and it records a LOSS
// exactly as firmly as a win: paying and losing burns the seat forever, which
// is the sharpest tooth this format has.
//
// ── SCOPE ───────────────────────────────────────────────────────────────
//
// This module owns the DOOR — who walks in, what it costs them, and what the
// house saw. It deliberately does not own the game. `openRoom` takes an
// injected `play` function; with nothing injected it looks the game up in
// `GAME_ENGINES` below, and with nothing there either it falls back to a plain
// stat-and-noise draw so the door can be tested without a wheel behind it.
//
// ── THE RESOLVER SEAM, WIDENED ──────────────────────────────────────────
//
// The seam originally returned a bare boolean: won, or did not. That was enough
// for a fallback draw and is not enough for a real game. The Chopping Block
// Roulette produces a WIN plus two names — who came down and who the wheel put
// up — and both have to reach the nomination ceremony intact.
//
// So a resolver may now return either a boolean or an object `{won, removed,
// replacement, beats}`. Booleans are normalised up, so the fallback and any
// older injected resolver still work unchanged. The names ride out on the
// entry (`entry.removed` / `entry.replacement`, always a string or null, never
// undefined) and the game's own beats are folded into the act's beats in the
// order they happened. Task 3 reads the entries; nothing in here interprets
// them, because the door still does not own the game.
//
// ── AND THEN WIDENED AGAIN: FIELD GAMES ─────────────────────────────────
//
// A resolver may also carry `resolvesField = true`, which means "I am a
// COMPETITION, do not call me once per entrant — call me once with all of
// them". It is handed `entrants` and returns `{results: {name: outcome}, beats}`.
//
// The Chopping Block Roulette is one of these and it has to be: at most one
// person wins it, the highest score above the standard, and no amount of
// stitching per-entrant results together afterwards can express that. The Veto
// Derby (a later plan) is a field game too and pays out to its top six, which
// is why this is a general contract and not a Roulette-shaped hole.
//
// The consequence for the room is that the door is now a separate PASS from the
// game: everybody who is getting in gets in and pays, THEN the game runs, then
// the verdicts are narrated. The money still leaves on the way in.

import { gs } from '../core.js';
import { pStats, pronouns } from '../players.js';
import { getBond } from '../bonds.js';
import { balance, canAfford, spend } from './bb-bucks.js';
import { spendPull } from './powers.js';
import { stableRng } from './knowledge.js';
import { rouletteResolver } from './chopping-block-roulette.js';

/**
 * The menu, frozen.
 *
 * One game this plan. The Veto Derby and the Coin of Destiny are later plans
 * and are deliberately absent rather than stubbed: a priced entry on this list
 * with no engine behind it is a week where somebody spends a hundred BB Bucks
 * and nothing happens to them.
 *
 * `powerId` is null because the Roulette's outcome is resolved by the
 * nomination ceremony itself rather than by an instance on the power shelf —
 * there is no object to hold and nothing to sit on. The Derby and the Coin do
 * grant real powers and will fill this in.
 */
export const ROOM_GAMES = Object.freeze([
  Object.freeze({
    id: 'chopping-block-roulette',
    name: 'The Chopping Block Roulette',
    price: 125,
    powerId: null,
    blurb: 'Spin for safety. The wheel can take you off the block — or take the money and leave you exactly where you were standing.',
  }),
]);

// ── THERE IS NO SEAT CAP, AND THAT IS THE POINT ─────────────────────────
//
// An earlier draft of this module rationed the room to three seats a week. It
// was papering over a broken economy: the tiers were paying $100/$75/$50 from
// week one, so by the time the room opened everybody in the house could afford
// everything on the menu and the only thing left to limit the door was an
// invented queue.
//
// The tiers were rescaled instead (see `PAYOUT_TIERS`), and with a real economy
// behind it the cap is not just unnecessary but wrong. Canon has no seat limit —
// in BB23 week 7 Alyssa was the ONLY houseguest to play the Chopping Block
// Roulette, and what kept everybody else out was that they could not afford it.
// MONEY is the limiter, plus one entry per game per season. Those two together
// do the whole job, and they do it as a consequence of decisions people made in
// week three rather than as a rule about furniture.

/** The record of who has burned which seat. Created on first touch, like the ledger. */
function plays() {
  if (!gs.bb) gs.bb = {};
  // Plain object of plain arrays. It goes through JSON.stringify with the save
  // every week, so no Sets live here no matter how much a membership test wants
  // one — a Set serialises to `{}` and silently forgets the whole season.
  if (!gs.bb.roomPlays) gs.bb.roomPlays = {};
  return gs.bb.roomPlays;
}

/** Have they already burned their one seat at this game? */
export function hasPlayed(name, gameId) {
  return (plays()[name] || []).includes(gameId);
}

function recordPlay(name, gameId) {
  const p = plays();
  if (!p[name]) p[name] = [];
  if (!p[name].includes(gameId)) p[name].push(gameId);
}

const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

/**
 * How badly this week wants the room, 0..1.
 *
 * Proportional throughout — there is no threshold anywhere in here, because a
 * step function would produce a house of houseguests who are all identically
 * desperate or all identically comfortable.
 *
 *   on the block   1.0, and nothing else needs saying. The thing being sold is
 *                  a way off the block; the people on it are the market.
 *   holding safety a veto in the pocket is the week already bought, so the
 *                  price buys nothing and the need is zero.
 *   everybody else scaled by EXPOSURE — how few people in that house would
 *                  spend anything to keep them. Somebody with warm bonds all
 *                  round is not the name that comes up when a plan fails;
 *                  somebody with none is, and they know it.
 *
 * The exposed ceiling is deliberately well under a nominee's: being unpopular
 * in week five is a worry, and being in the chair is a countdown.
 */
function entryNeed(name, { house = [], nominees = [], vetoHolder = null } = {}) {
  if (nominees.includes(name)) return 1;
  if (vetoHolder === name) return 0;
  const others = house.filter(o => o && o !== name);
  const warmth = others.length
    ? others.reduce((sum, o) => {
      let b = 0;
      try { b = getBond(name, o); } catch { b = 0; }
      return sum + Math.max(0, b);
    }, 0) / others.length
    : 0;
  // Five is a genuinely warm average across a whole house, so warmth at or
  // above it reads as somebody nobody is coming for.
  const exposure = clamp(1 - warmth / 5, 0, 1);
  return exposure * 0.55;
}

/**
 * Whether they are the sort of person who sits down at a wheel, 0..1.
 *
 * Boldness is most of it. Temperament is the rest, INVERTED: a steady head
 * walks past a table and a volatile one pulls out a chair, which is the same
 * reading this codebase already uses for every impulsive decision. It is a tilt
 * and not a gate — a calm houseguest on the block still plays.
 */
function nerveFor(name) {
  const st = pStats(name) || {};
  const bold = st.boldness ?? 5;
  const temp = st.temperament ?? 5;
  return clamp((bold * 0.7 + (10 - temp) * 0.3) / 10, 0, 1);
}

/**
 * The fallback game, used only when Task 2's Roulette is not injected.
 *
 * A modest edge to the player who reads a room and a large edge to the house,
 * because that is what a roulette is. Deliberately unkind: if this ever drifts
 * up towards a coin flip the format quietly becomes "the rich buy safety", and
 * the whole point of the room is that most people who pay walk back out with
 * nothing.
 */
function defaultPlay({ name, rng }) {
  const st = pStats(name) || {};
  const read = ((st.mental ?? 5) + (st.intuition ?? 5)) / 20;   // 0..1
  const chance = clamp(0.16 + read * 0.16 + (rng() - 0.5) * 0.08, 0.08, 0.45);
  return rng() < chance;
}

/**
 * Which engine actually runs which game on the menu.
 *
 * Keyed by the menu id, so a priced entry with no engine behind it resolves to
 * the fallback draw rather than to nothing at all — a week where somebody spent
 * a hundred and twenty-five and no code ran is the one outcome this room must
 * never produce.
 */
const GAME_ENGINES = {
  'chopping-block-roulette': rouletteResolver,
};

/**
 * Normalise whatever a resolver handed back into the one shape the room stores.
 *
 * Booleans in, object out. `removed` and `replacement` are coerced to a name or
 * null — never undefined, because these travel to the nomination ceremony and
 * `gs.bb.stats[undefined]` is a dead season.
 */
function normaliseOutcome(result) {
  if (typeof result === 'boolean' || result == null) {
    return { won: !!result, removed: null, replacement: null, beats: [] };
  }
  return {
    won: !!result.won,
    removed: result.removed ?? null,
    replacement: result.replacement ?? null,
    beats: Array.isArray(result.beats) ? result.beats : [],
  };
}

// ── narration ──────────────────────────────────────────────────────────
//
// Four variants minimum per category, this project's standard, and not one of
// them states a balance. What a beat may name is the PRICE, which is painted on
// the door and which everybody in that house already knows.

const WALKED_IN = [
  (n, p, price) => `${n} gets up in the middle of a conversation and goes through the door of the High Roller's Room. It costs ${price} to sit down in there and every person left at that table knows it.`,
  (n, p, price) => `The room takes ${n}. ${p.Sub} does not announce it and does not have to — the door is in the hallway, the price is ${price}, and four people watched ${p.obj} walk to it.`,
  (n, p, price) => `${n} pays the ${price} and takes a seat. Whatever ${p.sub} had been saving it for, this was the week ${p.sub} decided this was it.`,
  (n, p, price) => `${n} walks in. There is no discreet way to do it: the room is a door in a house with cameras on it, and the ${price} is gone before ${p.sub} has sat down.`,
  (n, p, price) => `${n} goes in. ${p.Sub} has been doing sums all afternoon and the sums came out at ${price} and a shrug.`,
];

const WON = [
  (n, p) => `${n} comes back out of that room with something, and does an entirely unconvincing job of pretending otherwise.`,
  (n, p) => `It goes ${n}'s way. ${p.Sub} spends the walk back to the kitchen arranging ${p.posAdj} face and arrives with the wrong one on.`,
  (n) => `${n} wins it. The house does not know what, yet, and has all night to imagine.`,
  (n, p) => `The room pays ${n} out. ${p.Sub} sits back down where ${p.sub} was sitting and the conversation does not resume.`,
];

const LOST = [
  (n, p, price) => `${n} comes back out with nothing. The ${price} is gone, the week is exactly where ${p.sub} left it, and everybody saw ${p.obj} go in.`,
  (n, p, price) => `Nothing for ${n}. ${p.Sub} paid ${price} in front of a house that now knows precisely how frightened ${p.sub} is, and bought nothing with it at all.`,
  (n, p, price) => `The room keeps ${n}'s ${price}. That is what the room is for.`,
  (n, p) => `${n} loses. ${p.Sub} comes back to the kitchen and says it was fine, and nobody in there believes ${p.obj}, and ${p.sub} cannot play that game again as long as ${p.sub} is in this house.`,
];

const SHORT = [
  (n, p, price) => `${n} gets as far as the door and does the arithmetic one last time. It is ${price} and ${p.sub} does not have it, and ${p.sub} turns around before anybody notices ${p.sub} stopped.`,
  (n, p) => `${n} wanted in and could not pay for it, which is a thing ${p.sub} will be thinking about on Thursday.`,
  (n, p, price) => `The price is ${price}. ${n} counts, comes up short, and goes back to the sofa.`,
  (n, p) => `${n} is short. ${p.Sub} has been paid every week of this season and spent the ones that mattered on nothing ${p.sub} can name.`,
];

// The night the door opened onto nobody. Names the PRICE, which is painted on
// the door, and a COUNT of who turned around, which the house watched happen —
// never a balance, which is nobody's business but the person holding it.
const ROOM_EMPTY = [
  (price) => `The High Roller's Room is open all night and not one person sits down in it. The price is ${price} and this house does not have it, which is a thing everybody now knows about everybody.`,
  (price, n) => `${n === 1 ? 'One houseguest walks' : `${n} houseguests walk`} up to that door tonight and ${n === 1 ? 'walks' : 'walk'} away from it again. The room takes ${price} to enter and the room stays empty.`,
  // No amount is spelled out here on purpose: prose that names a tier is a
  // silent second copy of `PAYOUT_TIERS`, and this line already said "tens"
  // through one rescale that had stopped paying tens.
  (price) => `Nobody plays. The door is open, the ${price} is the ${price}, and a house that has spent the season being paid in small change is standing on the wrong side of it.`,
  (price) => `The room opens onto an empty floor. Everybody who wanted in tonight counted what they had, came up short of ${price}, and went back to pretending they were never interested.`,
];

const pick = (pool, rng) => pool[Math.floor(rng() * pool.length) % pool.length];
const beat = (text, who, badgeText, badgeClass = 'twist') =>
  ({ type: 'high-rollers-room', text, players: [...who].filter(Boolean), badgeText, badgeClass });

/**
 * Open the room for a week.
 *
 * @param week      the week object; `week.num` seeds the fallback rng
 * @param house     everybody still playing
 * @param hoh       excluded from the door — see below
 * @param nominees  the market
 * @param game      which entry on the menu; defaults to the only one there is
 * @param protectedNames everybody the week has already made safe — passed
 *                  straight through to the game, which needs it to know who
 *                  cannot be seated in a replacement chair.
 * @param play      injected game resolver. Per-entrant form:
 *                  `({name, game, week, house, nominees, hoh, protectedNames, rng})`
 *                  returning a boolean or `{won, removed, replacement, beats}`.
 *                  Field form (`resolver.resolvesField === true`): called once
 *                  with `{entrants, ...board, rng}` and returning
 *                  `{results: {name: outcome}, beats}`. Without it the menu id
 *                  picks the engine.
 * @param rng       the entry dice. Defaults to the week's seeded generator,
 *                  never Math.random — an unseeded draw anywhere in a season
 *                  means the same seed stops producing the same house, which
 *                  the replay guards catch.
 * @returns {object|null} the act, or null on a night nobody went near the door
 */
export function openRoom({ week, house = [], hoh = null, nominees = [], vetoHolder = null,
  protectedNames = [], game = ROOM_GAMES[0], play = null,
  rng = stableRng('high-rollers-room', gs?.bb?.seasonSalt || 0, week?.num || 0) } = {}) {
  const room = house.filter(Boolean);
  if (!game) return null;

  // ── the Head of Household does not buy a week they already own ──
  //
  // Not a balance rule and not a modelled decision that happens to come out at
  // zero — a hard exclusion, because the only thing on this menu is a way off a
  // block the HOH cannot be put on. There is nothing here for them to buy, and
  // an HOH wandering in to spend a hundred and twenty-five on immunity they
  // already hold is the single most obviously wrong sentence this module could
  // generate.
  const candidates = room.filter(n => n !== hoh && !hasPlayed(n, game.id));

  // ── who walks to the door, and only then whether they can pay ──
  //
  // Willingness is decided BEFORE money, which is the order that matters: a
  // houseguest who wants in and cannot afford it is a real, visible thing that
  // happened in that house, and filtering on the ledger first would delete it
  // and leave a silent night instead. It also means the act exists — a room
  // that opened to people who could not pay for it is not the same event as a
  // room nobody approached.
  //
  // `exposes: true` always — walking through that door is the loudest thing
  // anybody does all week.
  //
  // ── weeksLeft, and why it is not a countdown like everywhere else ──
  //
  // Every other `spendPull` caller derives this from a real expiry:
  // `expiresAfterWeek - week.num`, the fuse burning on a power somebody is
  // holding. The room has no expiry. It does not run out, it is not held, and
  // there is nothing on it to count down.
  //
  // What DOES run out is the season, so house size stands in for it: three is
  // the finale, so `room.length - 3` is roughly how many more times this door
  // can open before there is no game left to buy safety in. That makes
  // `spendPull`'s patience term mean here what it means everywhere else — a
  // houseguest can hold out for a better week until there are no better weeks —
  // and it makes the endgame urgent, which is right for a room that shuts when
  // the season does.
  //
  // It is a stand-in and not a measurement. Written down because it is invented,
  // and an invented mapping that nobody flagged is how a heuristic becomes a
  // rule nobody can find.
  const weeksLeft = Math.max(0, room.length - 3);
  const approached = [];
  for (const name of candidates) {
    const need = entryNeed(name, { house: room, nominees, vetoHolder });
    const pull = spendPull({ need, weeksLeft, nerve: nerveFor(name), exposes: true });
    if (rng() < pull) approached.push({ name, need });
  }
  if (!approached.length) return null;

  // Whoever wants it most gets to the door first. With no seat cap this decides
  // only the ORDER of the night rather than who gets in, and it is still worth
  // doing: the transcript should open on the nominee who could not wait, not on
  // a floater who wandered in out of curiosity.
  approached.sort((a, b) => b.need - a.need);

  const entries = [];
  const declined = [];
  const beats = [];

  const seated = [];

  // ── PASS ONE: THE DOOR ──
  //
  // Everybody who is getting in gets in, and pays, before any game runs. This
  // pass is the whole of what the room owns, and separating it from the result
  // is what lets a game be a COMPETITION: the Roulette cannot know who won
  // until it knows who is in the room, so the room has to fill the room first.
  for (const { name } of approached) {
    const p = pronouns(name);
    if (!canAfford(name, game.price)) {
      declined.push({ name, gameId: game.id, reason: 'short' });
      beats.push(beat(pick(SHORT, rng)(name, p, game.price), [name], 'CANNOT PAY', 'grey'));
      continue;
    }

    // ── THE MONEY LEAVES HERE ──
    //
    // Before the game runs, and never refunded. `spend` returning false is the
    // ledger's own last word on affordability and is honoured as a closed door
    // rather than trusted away, so no path in this module can ever put a
    // balance below zero.
    if (!spend(name, game.price)) {
      declined.push({ name, gameId: game.id, reason: 'short' });
      beats.push(beat(pick(SHORT, rng)(name, p, game.price), [name], 'CANNOT PAY', 'grey'));
      continue;
    }
    // The seat is burned by ENTERING, not by winning. This is recorded before
    // the result exists so that losing costs the play for the whole season,
    // which is the tooth in the rule.
    recordPlay(name, game.id);
    beats.push(beat(pick(WALKED_IN, rng)(name, p, game.price), [name], 'WALKED IN', 'twist'));
    seated.push(name);
  }

  // ── PASS TWO: THE GAME ──
  //
  // The board, handed over whole. The door does not decide any of it — it only
  // knows it, and a game that needs to know who is already safe should not have
  // to go and read the week for itself. The game's dice are its own, seeded but
  // separate from the entry sequence, so a caller steering who walks in does
  // not thereby steer who wins.
  const resolver = play || GAME_ENGINES[game.id] || defaultPlay;
  const board = { game, week, house: room, hoh, nominees, protectedNames };
  const outcomes = {};   // name -> normalised outcome
  const gameBeats = [];

  if (seated.length && resolver.resolvesField) {
    // A FIELD GAME. One call, all the entrants, one set of results. The
    // Roulette is one: at most one person wins it, and it cannot know which
    // until it has seen every score. Per-entrant resolution could not express
    // that no matter how the results were stitched together afterwards.
    const fieldRng = stableRng('high-rollers-game', gs?.bb?.seasonSalt || 0, week?.num || 0, game.id, 'field');
    const field = resolver({ ...board, entrants: [...seated], rng: fieldRng }) || {};
    for (const name of seated) outcomes[name] = normaliseOutcome(field.results?.[name]);
    for (const b of (Array.isArray(field.beats) ? field.beats : [])) gameBeats.push(b);
  } else {
    // A PER-ENTRANT GAME, the original contract. Each seat resolves alone on
    // its own dice, and a boolean is still a perfectly good answer.
    for (const name of seated) {
      const gameRng = stableRng('high-rollers-game', gs?.bb?.seasonSalt || 0, week?.num || 0, game.id, name);
      const outcome = normaliseOutcome(resolver({ ...board, name, rng: gameRng }));
      outcomes[name] = outcome;
      for (const b of outcome.beats) gameBeats.push(b);
    }
  }

  // ── PASS THREE: WHAT THE HOUSE SAW ──
  //
  // `removed` and `replacement` ride out on the entry as plain strings or null.
  // In a field game exactly ONE entry can carry them, because exactly one
  // person won; every other entry that week is a loss. Task 3 wires the names
  // into the nomination ceremony; nothing in this module reads them, because
  // the door still does not own the game.
  for (const name of seated) {
    const outcome = outcomes[name] || normaliseOutcome(false);
    const p = pronouns(name);
    entries.push({ name, gameId: game.id, price: game.price, won: outcome.won,
      removed: outcome.removed, replacement: outcome.replacement });
    beats.push(outcome.won
      ? beat(pick(WON, rng)(name, p), [name], 'PAID AND WON', 'gold')
      : beat(pick(LOST, rng)(name, p, game.price), [name], 'PAID AND LOST', 'bad'));
  }
  // The game's own beats come after the room's verdicts — the house sees who
  // came out of that room before it hears what happened inside it.
  for (const b of gameBeats) beats.push(b);

  // ── THE DOOR OPENED AND NOBODY COULD PAY ────────────────────────────
  //
  // A real outcome of the rescaled economy, and worth a sentence. In a short
  // season the house may never bank the 125, so people can want the room all
  // week, walk to it, and every one of them turn around at the price. Without
  // this the transcript carries a handful of individual "cannot pay" beats and
  // no line saying what the night actually was: a room that opened onto
  // nobody. That is the format's own joke about itself and it should be told.
  if (!entries.length && declined.length) {
    beats.push(beat(pick(ROOM_EMPTY, rng)(game.price, declined.length),
      declined.map(d => d.name), 'ROOM STAYS EMPTY', 'grey'));
  }

  return {
    type: 'high-rollers-room',
    week: week?.num || 0,
    // Entry is public. The house did not learn anybody's balance and never
    // will, but it watched every one of these people stand up.
    secret: false,
    gameId: game.id,
    gameName: game.name,
    price: game.price,
    entries, declined, beats,
  };
}

/**
 * Who could still buy their way into what, for a screen.
 *
 * Reads the private ledger, so this is a PRODUCTION view — the Debug panel and
 * the viewer. It must never be rendered to the house.
 */
export function roomLedgerFor(house = gs.activePlayers || []) {
  return house.filter(Boolean).map(name => ({
    name,
    balance: balance(name),
    available: ROOM_GAMES.filter(g => !hasPlayed(name, g.id) && canAfford(name, g.price)).map(g => g.id),
    played: [...(plays()[name] || [])],
  }));
}
