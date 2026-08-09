// ══════════════════════════════════════════════════════════════════════
// bb/duos.js — Dynamic Duos: the Golden Key, and the other season
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
//   how many chairs there are; this one changes what a nomination IS.
//
//   A houseguest who is SAFE BUT INACTIVE. A key holder cannot be nominated
//   and cannot compete — but still votes, and can still win the whole thing.
//   Nothing else produces somebody with a ballot, no risk and no way to gain
//   power, and a bloc of them decides evictions from outside the game entirely.
//
// ── two modes, two different seasons ──
//
//   'on'     pairs and the Golden Key. The faithful BB13 shape: lose your
//            partner, get handed safety you cannot spend, and the season is
//            slowly eaten by a bloc of untouchable bystanders.
//
//   'pairs'  no key at all. Losing your partner leaves you ORPHANED, and an
//            orphan is the cheapest nomination in the house — the Head of
//            Household can put you up without dragging a second person along.
//            You stay that way until somebody else comes loose, and then Big
//            Brother chains the two of you together whether or not you had
//            anything to do with each other's evictions.
//
// The second mode is the one that never runs out. The pairing rule survives
// the whole season instead of decaying as duos break, and it manufactures
// forced alliances between people with every reason to hate each other.
//
// ── the design decision that keeps this cheap ──
//
// A key holder stays in `gs.activePlayers`. They are a houseguest in every
// sense — they vote, they are counted, they can reach the end. What changes is
// two filters at two seams in week.js: they join the sitting-out list for
// competitions, and they join `untouchable` at the nomination ceremony.
import { gs, players, seasonConfig, kinshipPairs, REL_KINSHIP } from '../core.js';
import { pStats, pronouns } from '../players.js';
import { addBond, getBond, getPerceivedBond } from '../bonds.js';

const beat = (text, players, badgeText, badgeClass = 'gold') =>
  ({ text, players: [...players].filter(Boolean), badgeText, badgeClass });

const pick = (arr, rng = Math.random) => arr[Math.floor(rng() * arr.length)];

const archetypeOf = name => players.find(p => p.name === name)?.archetype || '';

function bumpPop(name, delta) {
  if (!name) return;
  if (!gs.popularity) gs.popularity = {};
  gs.popularity[name] = (gs.popularity[name] || 0) + delta;
}

/** The house size at which the keys stop working. The show used ten. */
export const DEFAULT_KEY_AT = 10;

export function duoState() { return gs.bb?.duos || null; }

/** Are the duos still the shape of the game? */
export function duosActive() {
  const st = duoState();
  return !!st && !st.over;
}

/** Is this season handing out Golden Keys, or is it the other one? */
export function goldenKeysOn() {
  const st = duoState();
  return !!st && st.goldenKey !== false;
}

/** The pair somebody is in, or null once they are alone. */
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

/**
 * The partner the HOUSE can see, for the strategy layer.
 *
 * Deliberately does no threat maths of its own — `bbThreatProfile` reads this
 * and then does the reading, and a partner lookup that computed threat would
 * recurse straight back into the function asking the question.
 */
export function duoPartnerFor(name) {
  if (!duosActive()) return null;
  if (hasKey(name)) return null;   // a key holder cannot be dragged anywhere
  const partner = partnerOf(name);
  return partner && !hasKey(partner) ? partner : null;
}

/** Everybody holding a Golden Key right now. */
export function keyHolders() {
  const st = duoState();
  if (!st || st.keysExpired || st.goldenKey === false) return [];
  return Object.keys(st.keys || {});
}

export function hasKey(name) { return keyHolders().includes(name); }

/**
 * Houseguests whose partner is gone and who have not been re-paired.
 *
 * An orphan is the cheapest nomination in this house — the Head of Household
 * can put them up without dragging a second person along — which is what makes
 * being partnerless genuinely dangerous rather than a technicality.
 */
export function orphans(house = gs.activePlayers || []) {
  const st = duoState();
  if (!st) return [];
  return house.filter(n => !hasKey(n) && !partnerOf(n, house));
}

/** How two of them know each other, in the words the cast was built with. */
export function duoKin(a, b) {
  const st = duoState();
  if (!st) return 'none';
  return st.kinds?.[[a, b].sort().join('|')] || 'none';
}

/** That relation, said the way a screen should say it. */
export function duoKinLabel(a, b) {
  const kin = duoKin(a, b);
  if (kin === 'chained') return 'Chained by Big Brother';
  return REL_KINSHIP[kin]?.label || 'Came in together';
}

/** How many duos this cast could actually field. */
export function declaredDuos(house = gs.activePlayers || []) {
  const seen = new Set();
  const out = [];
  for (const pair of kinshipPairs()) {
    if (!house.includes(pair.a) || !house.includes(pair.b)) continue;
    if (seen.has(pair.a) || seen.has(pair.b)) continue;   // one duo each
    seen.add(pair.a); seen.add(pair.b);
    out.push(pair);
  }
  return out;
}

/**
 * Pair the house up — out of the cast, not out of the bond table.
 *
 * A DUO IS A DECLARED RELATION. That is the whole premise: nobody walked into
 * this house alone, and the reason two people are chained together is that they
 * are siblings, or exes, or married, or worked together — something the cast
 * was built with and the audience is told on night one. Pairing by whoever
 * happened to have the strongest bond produced duos that meant nothing, could
 * not be announced ("these two get on quite well"), and changed depending on
 * which week the twist was installed.
 *
 * So this reads the kinship axis (js/core.js) and nothing else, and it REFUSES
 * to run on a cast that has not been built for it. A season with no declared
 * relations cannot play Dynamic Duos, the same way one with no declared twins
 * cannot play the Twin Twist — the answer is to go and build the cast, not to
 * invent relationships nobody wrote.
 *
 * Anybody left over came in ALONE. They are not a solo curiosity: they cannot
 * be nominated as half of anything, which makes them the cheapest name on the
 * wall, and in key mode they can never earn one because there is nobody to
 * lose.
 */
export function installDuos(house = [], { keyAt = DEFAULT_KEY_AT, goldenKey = true, rng = Math.random } = {}) {
  const names = [...house].filter(Boolean);
  if (names.length < 4) return null;

  const declared = declaredDuos(names);
  // Two duos is the floor: with one, a single nomination ends the twist and
  // every other week of the season is an ordinary week wearing its name.
  if (declared.length < 2) return null;

  const pairs = declared.map(d => [d.a, d.b]);
  const kinds = {};
  for (const d of declared) kinds[[d.a, d.b].sort().join('|')] = d.kin;
  const taken = new Set(pairs.flat());
  const singles = names.filter(n => !taken.has(n));

  gs.bb ||= {};
  gs.bb.duos = {
    pairs,
    kinds,
    // Everybody who walked in on their own. Plural, because a cast is built
    // with as many duos as it is built with, and the rest came alone.
    singles,
    goldenKey: !!goldenKey,
    // name -> { week } for everybody whose partner has gone
    keys: {},
    keysExpired: false,
    keyAt: Math.max(2, Number(keyAt) || DEFAULT_KEY_AT),
    installedWeek: (gs.bb.weeks?.length || 0) + 1,
    over: false,
    announced: false,
    // Everything the season accumulates.
    repairs: [],   // [{ week, pair }] — orphans chained together
    splits: [],    // duos who have said out loud that they are done
    power: [],     // duos the house has decided are running the season
    seen: {},      // event kind -> week last fired, so the arc does not repeat
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

  const rules = [
    'You are playing in pairs, and the Head of Household nominates a PAIR. '
      + 'Not two houseguests — two houseguests who came in together.',
  ];
  if (st.goldenKey) {
    rules.push(`If your partner is evicted, you are handed a Golden Key. A key is safety: `
      + `you cannot be nominated and you cannot be evicted until ${st.keyAt} of you are left.`);
    rules.push('A key holder does not compete. No Head of Household, no veto, nothing. '
      + 'You still vote, and you can still win this game.');
  } else {
    rules.push('There are no Golden Keys in this house. If your partner is evicted you are on your '
      + 'own — and a houseguest on their own can be put on that block by themselves, which makes '
      + 'you the easiest nomination in this building.');
    rules.push('You will not be on your own for long. The moment somebody else loses their partner, '
      + 'Big Brother will chain the two of you together. You do not get to choose who.');
  }

  return {
    type: 'duos-open', week: weekNum, secret: false,
    name: 'Dynamic Duos',
    goldenKey: !!st.goldenKey,
    pairs: st.pairs.map(p => [...p]),
    kin: st.pairs.map(([a, b]) => duoKinLabel(a, b)),
    singles: [...(st.singles || [])],
    keyAt: st.keyAt,
    rules,
    beats: [
      beat(pick(OPEN_LINES), [], 'DYNAMIC DUOS', 'gold'),
      ...st.pairs.map(([a, b]) => beat(`${a} and ${b}.`, [a, b], 'A PAIR', 'blue')),
      ...(st.singles || []).map(n => beat(`${n} walked in alone. `
      + (st.goldenKey
        ? `There is no partner to lose, which means there is no key to win.`
        : `There is nobody to be nominated beside, which means ${pronouns(n).sub} can be put on that `
          + `block alone from the first week — and that costs a Head of Household nobody.`),
    [n], 'CAME IN ALONE', 'red')),
    ],
  };
}

/**
 * The nomination, as a pair.
 *
 * Given whoever the Head of Household actually wants gone, this returns the
 * duo they belong to — because naming one of a pair names both. Falls back to
 * the plan's own second name when the target is the solo player or an orphan,
 * which is the whole reason being orphaned is dangerous: an orphan can go up by
 * themselves and cost the house nobody else.
 */
export function duoNominees(target, house = gs.activePlayers || [], fallback = null) {
  if (!duosActive() || !target) return null;
  const partner = partnerOf(target, house);
  if (!partner) return null;                    // solo, orphaned, or already broken
  if (hasKey(partner) || hasKey(target)) return null;
  return [target, partner];
}

const KEY_LINES = [
  (n, p) => `${n} watches ${p} walk out of the door and is handed a key on the way back to the sofa. `
    + `Safe, and out of the game at the same time.`,
  (n, p) => `The vote takes ${p}. What it leaves behind is ${n}, a Golden Key, and a houseguest who `
    + `cannot be touched and cannot do anything either.`,
  (n, p) => `${p} is gone. ${n} is safe until the final {keyAt} — and will not compete for anything `
    + `between now and then.`,
];

/**
 * One of a pair is gone, so the other one gets the key.
 *
 * Called AFTER the eviction is real, exactly like Camp Comeback: the evictee is
 * out of the roster, out of the vote and out of the nominations before this
 * runs. All this does is hand the survivor a status. In pairs mode it does
 * nothing at all — see `repairOrphans` for what happens instead.
 */
export function grantGoldenKey({ week, evicted, house = gs.activePlayers || [] } = {}) {
  const st = duoState();
  if (!st || st.over || st.keysExpired || !evicted) return null;
  if (st.goldenKey === false) return null;

  const pair = duoOf(evicted);
  if (!pair) return null;
  const survivor = pair.find(n => n !== evicted);
  if (!survivor || !house.includes(survivor) || st.keys[survivor]) return null;

  const weekNum = Number(week?.num) || (gs.bb?.weeks?.length || 0) + 1;
  st.keys[survivor] = { week: weekNum, partner: evicted };

  const p = pronouns(survivor);
  const line = pick(KEY_LINES)(survivor, evicted).replace('{keyAt}', String(st.keyAt));

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
  if (!st || st.keysExpired || st.goldenKey === false) return null;
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

// ══ the other season: orphans, and being chained to one ════════════════

const REPAIR_LINES = [
  (a, b) => `${a} and ${b} are both here because somebody else is not. Big Brother does not care `
    + `which of them wanted it: from tonight they are a duo, and from tonight they go up together.`,
  (a, b) => `Two people who lost a partner this season are handed each other. ${a} takes it better `
    + `than ${b} does, and neither of them takes it well.`,
  (a, b) => `The house is told at once, the way it is told everything: ${a} and ${b} are now a pair. `
    + `Nobody asked either of them.`,
];

/**
 * Chain the loose ends together.
 *
 * The other mode's engine. When two houseguests are running around with no
 * partner, they become each other's — closest first, so the re-pairing has some
 * logic to it, but nobody gets a say. An odd orphan waits for the next
 * eviction, and while they wait they are the easiest name on the wall.
 */
export function repairOrphans({ week, house = gs.activePlayers || [], rng = Math.random } = {}) {
  const st = duoState();
  if (!st || st.over || st.goldenKey !== false) return null;

  const loose = orphans(house);
  if (loose.length < 2) return null;

  const pool = [...loose];
  const made = [];
  while (pool.length >= 2) {
    const a = pool.shift();
    let best = null, bestScore = -Infinity;
    for (const b of pool) {
      const score = getPerceivedBond(a, b) + (rng() * 2 - 1);
      if (score > bestScore) { bestScore = score; best = b; }
    }
    pool.splice(pool.indexOf(best), 1);
    // The old pairs stay in the record; the new one is what the game reads,
    // so it goes on the front where `duoOf` finds it first.
    st.pairs = [[a, best], ...st.pairs.filter(p => !p.includes(a) && !p.includes(best))];
    // Nobody declared this one. Big Brother did, which is its own label.
    st.kinds[[a, best].sort().join('|')] = 'chained';
    made.push([a, best]);
    // Being handed to each other is not nothing. It is not friendship either.
    addBond(a, best, 1);
  }
  if (!made.length) return null;

  const weekNum = Number(week?.num) || (gs.bb?.weeks?.length || 0) + 1;
  st.repairs.push(...made.map(pair => ({ week: weekNum, pair: [...pair] })));
  const waiting = pool[0] || null;

  return {
    type: 'duos-repair', week: weekNum, secret: false,
    pairs: made.map(p => [...p]), waiting,
    beats: [
      ...made.map(([a, b]) => beat(pick(REPAIR_LINES)(a, b), [a, b], 'RE-PAIRED', 'gold')),
      ...(waiting ? [beat(`${waiting} is still on ${pronouns(waiting).posAdj} own, and everybody in `
        + `this house knows what that means: ${pronouns(waiting).sub} can go up on that block alone, `
        + `and it costs the Head of Household nobody.`, [waiting], 'STILL ALONE', 'red')] : []),
    ],
  };
}

// ══ the arc ════════════════════════════════════════════════════════════
//
// A season twist that only fires at nominations is a rule. What makes this a
// SEASON is that being chained to somebody changes for eleven weeks: pairs
// harden into the thing the house is frightened of, decay into two people who
// cannot stand each other and are nominated together anyway, or quietly become
// one player carrying another. All of it moves bonds and popularity.

function ev(kind, text, playersIn, badgeText, badgeClass) {
  return { kind, text, players: [...playersIn].filter(Boolean), badgeText, badgeClass };
}

/** The pair the house has decided is running the season. */
function powerCouple(pair, rng) {
  const [a, b] = pair;
  addBond(a, b, 1);
  bumpPop(a, -1); bumpPop(b, -1);
  return ev('power', pick([
    `Somebody counts it out at the kitchen table and says it in front of everybody: ${a} and ${b} `
      + `have not been on that block once, and there are two of them. It stops being a compliment `
      + `about halfway through the sentence.`,
    `${a} and ${b} are the pair everybody else is measuring themselves against, and being measured `
      + `against is the last thing either of them wanted.`,
    `The house has worked out that beating ${a} means beating ${b} as well, and has started `
      + `talking about them as one word.`,
  ], rng), pair, 'THE PAIR TO BEAT', 'red');
}

/** Two people who are done, and cannot do anything about it. */
function publicSplit(pair, rng) {
  const [a, b] = pair;
  addBond(a, b, -2);
  bumpPop(a, 1); bumpPop(b, 1);
  return ev('split', pick([
    `${a} says it out loud in the lounge, to the room rather than to ${b}: they are not working `
      + `together any more. It changes nothing at all. They are still nominated together and both `
      + `of them know it.`,
    `${a} and ${b} announce that they are done, which the house receives as entertainment rather `
      + `than information. The rule does not care whether they are speaking.`,
    `Whatever ${a} and ${b} had is over by Wednesday. The pairing outlives it, which is the part `
      + `neither of them has found a way to say.`,
  ], rng), pair, 'THE SPLIT', 'red');
}

/** One of them is doing all of it. */
function carrying(pair, rng) {
  const [strong, weak] = [...pair].sort((x, y) =>
    ((pStats(y)?.strategic || 0) + (pStats(y)?.physical || 0) + (pStats(y)?.social || 0))
    - ((pStats(x)?.strategic || 0) + (pStats(x)?.physical || 0) + (pStats(x)?.social || 0)));
  bumpPop(weak, -1);
  return ev('carrying', pick([
    `Somebody points out that ${weak} has not won anything, has not run anything, and is still here. `
      + `The reason is standing next to ${pronouns(weak).obj} and is called ${strong}.`,
    `"${weak}'s not playing this game, ${strong} is playing it for both of them" is a sentence that `
      + `gets said once and then repeated in four separate rooms.`,
    `${strong} does the work and ${weak} gets the safety, and the house has started to resent exactly `
      + `one of them for it.`,
  ], rng), [weak, strong], 'CARRIED', 'blue');
}

/** Chained to somebody you were never going to choose. */
function forcedThaw(pair, rng) {
  const [a, b] = pair;
  addBond(a, b, 2);
  return ev('thaw', pick([
    `${a} and ${b} did not pick each other and have stopped mentioning it. Somewhere in the last `
      + `week they became the thing they were pretending to be.`,
    `Nothing builds an alliance like having no alternative. ${a} and ${b} are closer than either of `
      + `them would admit to a camera.`,
  ], rng), pair, 'THE THAW', 'green');
}

/** The orphan, and what everybody else can see about them. */
function orphanWeek(name, rng) {
  bumpPop(name, 1);
  return ev('orphan', pick([
    `${name} has nobody, and in this house that is not loneliness — it is arithmetic. Any Head of `
      + `Household can put ${pronouns(name).obj} up without paying for it, and ${pronouns(name).sub} `
      + `${pronouns(name).sub === 'they' ? 'spend' : 'spends'} the week trying to be worth more than that.`,
    `Everybody is very kind to ${name} this week, in the specific way people are kind to somebody `
      + `they have already decided about.`,
    `${name} is the only houseguest here who costs one vote instead of two, and ${pronouns(name).sub} `
      + `${pronouns(name).sub === 'they' ? 'have' : 'has'} started saying so first, before anybody else can.`,
  ], rng), [name], 'ORPHANED', 'red');
}

/** A key holder, watching. */
function keyWeek(name, rng) {
  return ev('key', pick([
    `${name} is not in the competition, is not on the block, and is not going anywhere. What ${pronouns(name).sub} `
      + `${pronouns(name).sub === 'they' ? 'have' : 'has'} instead is a vote and an enormous amount of time, `
      + `and the people still playing have noticed both.`,
    `Three separate houseguests make a point of sitting down with ${name} this week. Not one of them `
      + `is doing it out of affection: ${pronouns(name).sub} ${pronouns(name).sub === 'they' ? 'cannot' : 'cannot'} `
      + `be nominated and ${pronouns(name).sub} still ${pronouns(name).sub === 'they' ? 'vote' : 'votes'}.`,
    `Safety with nothing to do turns out to be its own kind of pressure. ${name} watches a `
      + `competition ${pronouns(name).sub} would have won.`,
  ], rng), [name], 'A KEY AND A BALLOT', 'gold');
}

/** A week where nothing broke, which is still a week spent in twos. */
function steadyWeek(live, weekNum) {
  const closest = [...live].sort((x, y) => getBond(y[0], y[1]) - getBond(x[0], x[1]))[0];
  const worst = [...live].sort((x, y) => getBond(x[0], x[1]) - getBond(y[0], y[1]))[0];
  const LINES = [
    () => `Nobody in this house can make a plan for one person. Every conversation this week ends with `
      + `somebody counting in twos and getting a number they did not like.`,
    () => closest
      ? `${closest[0]} and ${closest[1]} are the pair everybody checks against before they say anything, `
        + `and the checking is starting to look like a habit.`
      : `The pairs hold, which is its own kind of news.`,
    () => worst
      ? `${worst[0]} and ${worst[1]} are not close and are not going anywhere. The house has stopped `
        + `expecting them to sort it out and started planning around it.`
      : `Nothing came apart this week, which nobody trusts.`,
    () => `A quiet week in a house where nobody is a single vote. The arithmetic does not go away just `
      + `because nothing happened.`,
  ];
  return ev('steady', LINES[Math.abs(weekNum) % LINES.length](),
    closest || [], 'STILL IN TWOS', 'blue');
}

/**
 * The week in a Duos season.
 *
 * One act per week, from whatever the pairs are actually doing. Guaranteed to
 * produce something whenever there is anybody to produce it about — a season
 * twist the audience never sees between the announcement and the eviction is a
 * twist that reads as doing nothing, which is how the Twin Twist shipped.
 */
export function duosWeekLife(week, { house = gs.activePlayers || [], rng = Math.random } = {}) {
  const st = duoState();
  if (!st || st.over) return null;
  const weekNum = Number(week?.num) || (gs.bb?.weeks?.length || 0) + 1;
  // Nothing to say on the night the pairs are read out — the announcement is
  // the week's duo screen.
  if (weekNum <= st.installedWeek) return null;

  const live = st.pairs.filter(p => p.every(n => house.includes(n)));
  const events = [];
  const fired = new Set();
  const once = (kind, gap = 3) => {
    if (fired.has(kind)) return false;
    if ((st.seen[kind] || -99) > weekNum - gap) return false;
    fired.add(kind); st.seen[kind] = weekNum;
    return true;
  };

  for (const pair of live) {
    const bond = getBond(pair[0], pair[1]);
    const record = pair.map(n => gs.bb?.stats?.[n] || {});
    const wins = record.reduce((s, r) => s + (r.hohWins || 0) + (r.vetoWins || 0), 0);
    const blocked = record.reduce((s, r) => s + (r.timesOnTheBlock || 0), 0);

    // The pair the house is frightened of: winning, and never up.
    if (wins >= 2 && blocked === 0 && bond >= 3 && once('power', 4)) {
      events.push(powerCouple(pair, rng));
      if (!st.power.some(p => p[0] === pair[0])) st.power.push([...pair]);
      continue;
    }
    // Two people who are finished and cannot get away from each other. Not on
    // a dice roll: a duo publicly coming apart is the loudest thing this twist
    // produces, and it happens once per pair, so gating it behind a 70% left
    // seasons where the house's worst pairing was never mentioned.
    if (bond <= -3 && !st.splits.some(s => s.includes(pair[0]) && s.includes(pair[1]))) {
      events.push(publicSplit(pair, rng));
      st.splits.push([...pair]);
      continue;
    }
    // One name doing all the work for two.
    const gap = Math.abs(
      ((pStats(pair[0])?.strategic || 0) + (pStats(pair[0])?.physical || 0) + (pStats(pair[0])?.social || 0))
      - ((pStats(pair[1])?.strategic || 0) + (pStats(pair[1])?.physical || 0) + (pStats(pair[1])?.social || 0)));
    if (gap >= 6 && once('carrying', 3) && rng() < 0.75) { events.push(carrying(pair, rng)); continue; }
    // Strangers becoming something, which is mostly what a re-pairing does.
    if (bond >= 0 && bond <= 3 && once('thaw', 4) && rng() < 0.45) {
      events.push(forcedThaw(pair, rng));
    }
  }

  // The people the pairing has left behind, in whichever mode.
  for (const name of orphans(house)) {
    if (once(`orphan:${name}`, 3)) events.push(orphanWeek(name, rng));
  }
  for (const name of keyHolders().filter(n => house.includes(n))) {
    if (once(`key:${name}`, 3)) events.push(keyWeek(name, rng));
  }

  /* THE WEEK IS NEVER SILENT.
     Everything above is conditional — a season where no pair is winning, no
     pair is failing and nobody is orphaned rolled nothing at all, and a season
     twist with nothing on screen between the announcement and the eviction is
     a twist the audience decides is doing nothing. So the quiet weeks say the
     quiet thing: the pairing is still the fact everybody is playing around. */
  if (!events.length) events.push(steadyWeek(live, weekNum));

  return {
    type: 'duos-week', week: weekNum, secret: false,
    goldenKey: !!st.goldenKey,
    events,
    pairs: live.map(p => [...p]),
    keys: keyHolders().filter(n => house.includes(n)),
    orphaned: orphans(house),
    beats: events.map(e => beat(e.text, e.players, e.badgeText, e.badgeClass)),
  };
}

/** Who sits out of this week's competitions because of a key. */
export function duosSittingOut() {
  return keyHolders();
}
