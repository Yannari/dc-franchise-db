// ══════════════════════════════════════════════════════════════════════
// bb/duos.js — Dynamic Duos, and the Golden Key
// ══════════════════════════════════════════════════════════════════════
//
// Big Brother 13, and the wiki states both halves plainly:
//
//   "houseguests being paired up in duos and nominated as duos"
//   "when one member of the duo was evicted, the other member received a
//    'Golden Key' and was safe from nomination and eviction until the final
//    10. Holders of a Golden Key did not compete in competitions, though they
//    did get to cast votes to evict and have a spot to win the whole game."
//
// TWO SHAPES THIS ENGINE HAS NEVER HAD, which is the reason to build it rather
// than another power on the shelf:
//
//   A nomination that names a PAIR. Every other twist changes who is safe or
//   how many chairs there are; this one changes what a nomination IS. The HOH
//   does not pick two people, they pick two people who came in together.
//
//   A houseguest who is SAFE BUT INACTIVE. A key holder cannot be nominated
//   and cannot compete — but still votes, and can still win the whole thing.
//   Nothing else in the game produces somebody with a ballot, no risk and no
//   way to gain power, and a bloc of them decides evictions from outside the
//   game entirely. That is the strategic weight, and it is genuinely new.
//
// ── the design decision that keeps this cheap ──
//
// A key holder stays in `gs.activePlayers`. They are a houseguest in every
// sense — they vote, they are counted, they can reach the end. What changes is
// two filters at two seams in week.js: they join the sitting-out list for
// competitions, and they join `untouchable` at the nomination ceremony. The
// same two seams the Rivals twist already uses, for the same reason.
import { gs } from '../core.js';
import { pStats, pronouns } from '../players.js';
import { getPerceivedBond } from '../bonds.js';

const beat = (text, players, badgeText, badgeClass = 'gold') =>
  ({ text, players: [...players].filter(Boolean), badgeText, badgeClass });

/** The house size at which the keys stop working. The show used ten. */
export const DEFAULT_KEY_AT = 10;

export function duoState() { return gs.bb?.duos || null; }

/** Are the duos still the shape of the game? */
export function duosActive() {
  const st = duoState();
  return !!st && !st.over;
}

/** The pair somebody came in with, or null once they are alone. */
export function duoOf(name) {
  const st = duoState();
  if (!st) return null;
  return (st.pairs || []).find(p => p.includes(name)) || null;
}

/** Their partner, if that partner is still playing. */
export function partnerOf(name, house = gs.activePlayers || []) {
  const pair = duoOf(name);
  if (!pair) return null;
  const other = pair.find(n => n !== name);
  return other && house.includes(other) ? other : null;
}

/** Everybody holding a Golden Key right now. */
export function keyHolders() {
  const st = duoState();
  if (!st || st.keysExpired) return [];
  return Object.keys(st.keys || {});
}

export function hasKey(name) { return keyHolders().includes(name); }

/**
 * Pair the house up.
 *
 * Paired by who already knows whom: the strongest existing bond first, so the
 * duos read as people who arrived together rather than a shuffle. An odd house
 * leaves one person unpaired — they play alone, and they can never earn a key,
 * which is exactly the trade the show's solo players had.
 */
export function installDuos(house = [], { keyAt = DEFAULT_KEY_AT, rng = Math.random } = {}) {
  const names = [...house].filter(Boolean);
  if (names.length < 4) return null;

  const pool = [...names];
  const pairs = [];
  while (pool.length >= 2) {
    const a = pool.shift();
    // Closest first, with a nudge of noise so a season is not deterministic.
    let best = null, bestScore = -Infinity;
    for (const b of pool) {
      const score = getPerceivedBond(a, b) + (rng() * 2 - 1);
      if (score > bestScore) { bestScore = score; best = b; }
    }
    pool.splice(pool.indexOf(best), 1);
    pairs.push([a, best]);
  }
  const solo = pool[0] || null;

  gs.bb ||= {};
  gs.bb.duos = {
    pairs,
    solo,
    // name -> { week } for everybody whose partner has gone
    keys: {},
    keysExpired: false,
    keyAt: Math.max(2, Number(keyAt) || DEFAULT_KEY_AT),
    installedWeek: (gs.bb.weeks?.length || 0) + 1,
    over: false,
    announced: false,
  };
  return gs.bb.duos;
}

const OPEN_LINES = [
  'Nobody walks into this house alone. You came in twos, and until further notice you are nominated in twos.',
  'Look at the person beside you. For the next few weeks, whatever happens to them happens to you.',
  'Two chairs at the ceremony, and they are never going to be two strangers.',
];

/** Night one: the house is told what it has been handed. */
export function announceDuos(week) {
  const st = duoState();
  if (!st || st.announced) return null;
  st.announced = true;
  const weekNum = Number(week?.num) || 1;

  return {
    type: 'duos-open', week: weekNum, secret: false,
    name: 'Dynamic Duos',
    pairs: st.pairs.map(p => [...p]),
    solo: st.solo,
    keyAt: st.keyAt,
    rules: [
      'You are playing in pairs, and the Head of Household nominates a PAIR. '
        + 'Not two houseguests — two houseguests who came in together.',
      `If your partner is evicted, you are handed a Golden Key. A key is safety: `
        + `you cannot be nominated and you cannot be evicted until ${st.keyAt} of you are left.`,
      'A key holder does not compete. No Head of Household, no veto, nothing. '
        + 'You still vote, and you can still win this game.',
    ],
    beats: [
      beat(OPEN_LINES[Math.floor(rngSafe() * OPEN_LINES.length)], [], 'DYNAMIC DUOS', 'gold'),
      ...st.pairs.map(([a, b]) => beat(`${a} and ${b}.`, [a, b], 'A PAIR', 'blue')),
      ...(st.solo ? [beat(`${st.solo} is on their own, and will be all the way through. `
        + `There is no partner to lose, which means there is no key to win.`, [st.solo], 'ALONE', 'red')] : []),
    ],
  };
}

function rngSafe() { return Math.random(); }

/**
 * The nomination, as a pair.
 *
 * Given whoever the Head of Household actually wants gone, this returns the
 * duo they belong to — because naming one of a pair names both. Falls back to
 * the plan's own second name when the target is the solo player or their
 * partner has already gone, which is what the show did once the duos started
 * breaking.
 */
export function duoNominees(target, house = gs.activePlayers || [], fallback = null) {
  if (!duosActive() || !target) return null;
  const partner = partnerOf(target, house);
  if (!partner) return null;                    // solo, or already broken
  if (hasKey(partner) || hasKey(target)) return null;
  return [target, partner];
}

const KEY_LINES = [
  (n, p) => `${n} watches ${p} walk out of the door and is handed a key on the way back to the sofa. `
    + `Safe, and out of the game at the same time.`,
  (n, p) => `The vote takes ${p}. What it leaves behind is ${n}, a Golden Key, and a houseguest who `
    + `cannot be touched and cannot do anything either.`,
  (n, p) => `${p} is gone. ${n} is safe until the final ${'{keyAt}'} — and will not compete for anything between now and then.`,
];

/**
 * One of a pair is gone, so the other one gets the key.
 *
 * Called AFTER the eviction is real, exactly like Camp Comeback: the evictee is
 * out of the roster, out of the vote and out of the nominations before this
 * runs. All this does is hand the survivor a status.
 */
export function grantGoldenKey({ week, evicted, house = gs.activePlayers || [] } = {}) {
  const st = duoState();
  if (!st || st.over || st.keysExpired || !evicted) return null;

  const pair = duoOf(evicted);
  if (!pair) return null;
  const survivor = pair.find(n => n !== evicted);
  if (!survivor || !house.includes(survivor) || st.keys[survivor]) return null;

  const weekNum = Number(week?.num) || (gs.bb?.weeks?.length || 0) + 1;
  st.keys[survivor] = { week: weekNum, partner: evicted };

  const p = pronouns(survivor);
  const line = KEY_LINES[Math.floor(Math.random() * KEY_LINES.length)](survivor, evicted)
    .replace('{keyAt}', String(st.keyAt));

  return {
    type: 'duos-key', week: weekNum, secret: false,
    holder: survivor, partner: evicted, keyAt: st.keyAt,
    holders: keyHolders(),
    beats: [
      beat(line, [survivor], 'GOLDEN KEY', 'gold'),
      beat(`${p.Sub} ${p.sub === 'they' ? 'keep' : 'keeps'} a vote and ${p.sub === 'they' ? 'lose' : 'loses'} `
        + `everything else: no competitions, no nominations, no way to move the game. `
        + `And a seat at the end if ${p.sub} last that long.`, [survivor], 'SAFE, AND SIDELINED', 'blue'),
    ],
  };
}

/**
 * The keys stop working.
 *
 * At the house size the twist named, everybody holding one rejoins the game at
 * once — which is the moment a season of untouchable bystanders becomes a house
 * full of people who have not competed for weeks and are all suddenly
 * nominatable together.
 */
export function expireKeys({ week, house = gs.activePlayers || [] } = {}) {
  const st = duoState();
  if (!st || st.keysExpired) return null;
  if (house.length > st.keyAt) return null;

  const held = keyHolders().filter(n => house.includes(n));
  st.keysExpired = true;
  st.over = true;
  if (!held.length) return null;

  const weekNum = Number(week?.num) || (gs.bb?.weeks?.length || 0) + 1;
  return {
    type: 'duos-keys-expire', week: weekNum, secret: false,
    holders: held, keyAt: st.keyAt,
    beats: [
      beat(`There are ${house.length} of you left, and the keys are done. `
        + `${held.join(', ')} ${held.length === 1 ? 'is' : 'are'} back in the game — nominatable, `
        + `and competing for the first time in weeks.`, held, 'KEYS EXPIRE', 'red'),
      beat(`Everybody who has been carried this far now has to play, against people who have been `
        + `playing the whole time.`, [], 'BACK IN IT', 'blue'),
    ],
  };
}

/** Who sits out of this week's competitions because of a key. */
export function duosSittingOut() {
  return keyHolders();
}
