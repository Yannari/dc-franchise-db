// What the three secret powers actually DO.
//
// They were granted, tracked, expiring at the jury — and firing nowhere. A
// houseguest could trade the best week of their game for one and nothing would
// happen, which is the same "written and unreachable" fault the Halting Hex sat
// in for months.
//
// Each is a decision and not a windfall, and each is decided proportionally
// rather than on a threshold:
//
//   The Interrogation      take somebody's Head of Household — and then be
//                          hunted for it by the person you took it from. The
//                          only power in the shelf that can be REFUSED.
//   The Mystery Competitor an alumnus walks in and plays your veto for you.
//                          Buys a body in the draw, not a win.
//   The Mystery Veto       a second veto competition with one player in it.
//                          Nobody is standing in the way, and it can still be
//                          lost.
import { gs, seasonConfig } from '../core.js';
import { pStats, pronouns } from '../players.js';
import { addBond, getBond } from '../bonds.js';
import { BB_POWER_DEFINITIONS, usePower, spendPull } from './powers.js';
import { nominationScore } from './strategy.js';
import { allyStake } from './shared-strategy.js';
import { believesPowerHeld, learnBBPower } from './knowledge.js';

const beat = (text, players, badgeText, badgeClass) =>
  ({ text, players: [...(players || [])], badgeText, badgeClass });
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

/** Weighted pick, so the door opens on somebody worth opening it for. */
function weighted(items, weightOf, rng) {
  const list = (items || []).filter(Boolean);
  if (!list.length) return null;
  const ws = list.map(i => Math.max(0.01, weightOf(i)));
  const total = ws.reduce((a, b) => a + b, 0);
  let roll = rng() * total;
  for (const [i, item] of list.entries()) {
    roll -= ws[i];
    if (roll <= 0) return item;
  }
  return list[list.length - 1];
}

/** The one live instance of a power whose rule flag matches, or null. */
function livePower(rule, week) {
  for (const inst of gs.bb?.powers || []) {
    if (inst.used || inst.disposed) continue;
    if (week > inst.expiresAfterWeek) continue;
    if (BB_POWER_DEFINITIONS[inst.powerId]?.rules?.[rule]) return inst;
  }
  return null;
}

/**
 * The fields the shared power-played screen reads.
 *
 * Three plays, one screen. `rpBuildBBPowerPlayed` already draws "a secret power
 * fired, and here is what the house did and did not know" — writing three more
 * screens for three variations on that would be three places for the same
 * stamp to drift apart. What each play does differently lives in its BEATS,
 * which is where the difference actually is.
 */
function shown(inst, timing, detail) {
  return {
    powerId: inst.powerId,
    name: BB_POWER_DEFINITIONS[inst.powerId]?.name || inst.powerId,
    timing,
    secret: inst.visibility === 'secret',
    visibility: inst.visibility,
    detail,
  };
}

/**
 * The Interrogation.
 *
 * Fires after the crown and before nominations. The holder takes the week; the
 * deposed Head of Household then questions the house and, if they name the
 * person who did it, keeps their week and the power is spent for nothing.
 *
 * The guess is read off what the deposed HOH actually KNOWS — the knowledge
 * store — plus intuition, plus how obviously the usurper benefits. Somebody who
 * already suspected the holder is far more likely to land it, which is what
 * makes the secrecy worth keeping in the weeks before this.
 */
export function playInterrogation({ week, house = [], hoh, rng = Math.random } = {}) {
  const weekNum = Number(week?.num) || 0;
  const inst = livePower('usurpHoh', weekNum);
  if (!inst || !hoh || inst.holder === hoh || !house.includes(inst.holder)) return null;

  // ── is this week worth it ──
  //
  // "Is it good for my game to use this now, or should I wait" is the question
  // a real player asks, and the first version did not ask it: it rolled against
  // boldness and threw the biggest thing on the shelf at weeks the holder was
  // never in danger in.
  //
  // So it reads the actual board. `nominationScore` is what the nomination plan
  // itself uses to decide who this Head of Household goes after — asking it
  // about yourself IS "am I about to go up", answered with the same number that
  // will answer it for real half an hour later.
  const rivals = house.filter(n => n !== hoh && n !== inst.holder);
  const scoreOf = name => {
    try { return nominationScore(hoh, name, () => 0.5); } catch { return 0; }
  };
  const danger = scoreOf(inst.holder);
  const worse = rivals.filter(n => scoreOf(n) > danger).length;
  // Where on the board they sit, as a fraction rather than a count. `worse >= 2
  // means safe` was a step, and a step is wrong twice over: it read the same in
  // a house of twelve as at final five, where being third-likeliest means you
  // are up next week — and it collapsed the pull to 0.05, so the biggest power
  // on the shelf sat out 43% of the weeks its holder was actually nominated.
  const pct = rivals.length ? (rivals.length - worse) / rivals.length : 1;
  // Bent, because the block is two or three chairs and not a ranking: being
  // top of it is nearly all the need there is, and mid-pack is very little.
  const selfNeed = pct ** 2.6;

  // ── and the other reason to take somebody's week off them ──
  //
  // This asked "am I about to go up" and stopped there, so an alliance watching
  // its own strongest member walk toward the block had a power sitting in the
  // room that could take the whole ceremony away, and no reason in the code to
  // reach for it. Taking the crown is the one move that protects somebody who
  // is not you — the Cloud cannot, the veto is one chair, this is the ceremony.
  //
  // Discounted against saving yourself, because it is: you are spending your
  // own week and your own cover on somebody else's chair, and if the deposed
  // HOH names you it was spent for nothing.
  let allyNeed = 0;
  let protecting = null;
  for (const n of rivals) {
    const stake = (() => { try { return allyStake(inst.holder, n); } catch { return 0; } })();
    if (!stake) continue;
    const theirPct = rivals.length
      ? (rivals.length - rivals.filter(o => scoreOf(o) > scoreOf(n)).length) / rivals.length
      : 1;
    const worth = (theirPct ** 2.6) * stake * 0.85;
    if (worth > allyNeed) { allyNeed = worth; protecting = n; }
  }
  const need = Math.max(selfNeed, allyNeed);
  const forAlly = allyNeed > selfNeed && !!protecting;
  const s = pStats(inst.holder) || {};
  const pull = spendPull({ need,
    weeksLeft: Math.max(0, inst.expiresAfterWeek - weekNum),
    nerve: (s.boldness || 5) / 10 });
  if (rng() > pull) return null;

  usePower(inst, weekNum);

  // ── the scene ──
  //
  // The wiki's rule is that the deposed Head of Household interrogates EVERY
  // other houseguest, and the drama is in those rooms rather than in the
  // verdict. So everybody is asked, one at a time, and each gives a different
  // kind of answer for a different reason:
  //
  //   tells    believes the holder has it, and has no reason to protect them
  //   covers   believes it and DOES have a reason — a bond worth more than
  //            this Head of Household's week
  //   reads    no knowledge, good instincts, points at whoever benefits
  //   guesses  no knowledge, poor instincts, names somebody they dislike
  //   silent   will not hand anybody to a Head of Household who may be back in
  //            power in ten minutes
  //   denies   the person who actually did it, lying to their face
  //
  // The verdict is WEIGHED, not counted: a name from somebody trusted is worth
  // more than a name from somebody who has been wrong before.
  const beats = [beat(
    `${hoh} is not Head of Household any more. Somebody in this house has taken it, the wall will `
      + 'not say who, and every houseguest here is about to be asked the same question one at a time.',
    [hoh], 'DETHRONED', 'red')];
  if (forAlly) {
    // Said out loud, because a power spent on somebody else is the only version
    // of this that costs the holder anything, and it read as self-preservation
    // with no way to tell the difference.
    beats.push(beat(
      `${inst.holder} was never the one in trouble this week. ${protecting} was, and ${protecting} `
        + `does not know that ${inst.holder} has just spent a week of cover taking the ceremony away `
        + 'before it could be read out.',
      [inst.holder, protecting], 'NOT FOR THEMSELVES', 'gold'));
  }

  const interviews = [];
  const weights = new Map();
  const bond = (a, b) => { try { return getBond(a, b); } catch { return 0; } };
  for (const name of house) {
    if (name === hoh) continue;
    const st = pStats(name) || {};
    let knows = false;
    try { knows = believesPowerHeld(name, inst.holder, inst.powerId); } catch { knows = false; }
    const loyalToHolder = bond(name, inst.holder) >= 3;
    const trustsDeposed = bond(name, hoh) >= 2;

    let kind;
    let points = null;
    if (name === inst.holder) {
      kind = 'denies';
      points = (st.strategic || 5) >= 6 ? (rivals[0] || null) : null;
    } else if (knows && !loyalToHolder) {
      kind = 'tells';
      points = inst.holder;
    } else if (knows) {
      kind = 'covers';
      points = rivals.find(n => n !== inst.holder && n !== name) || null;
    } else if (rng() * 10 < (st.intuition || 5) - 3) {
      kind = 'reads';
      points = inst.holder;
    } else if (!trustsDeposed && rng() < 0.34) {
      kind = 'silent';
    } else {
      kind = 'guesses';
      const pool = rivals.filter(n => n !== name);
      points = pool.length ? pool[Math.floor(rng() * pool.length)] : null;
    }

    if (points && kind !== 'silent') {
      // Weighed by what the deposed HOH thinks of the source. A name from
      // somebody they trust lands; a name from somebody they do not is noise.
      const w = 1 + clamp(bond(hoh, name) / 4, -0.6, 1.4);
      weights.set(points, (weights.get(points) || 0) + w);
    }
    interviews.push({ name, kind, points });
  }

  // A handful of rooms, not eighteen. The screen shows a scene, not a
  // transcript, and the ones worth showing are the ones that said something.
  const shownRooms = interviews.filter(i => i.kind !== 'guesses' || rng() < 0.4).slice(0, 6);
  const BADGE = { tells: 'HANDED OVER', covers: 'COVERING', reads: 'A GOOD READ',
    guesses: 'A GUESS', silent: 'SAYS NOTHING', denies: 'TO THEIR FACE' };
  for (const i of shownRooms) {
    const p = pronouns(i.name);
    const are = p.sub === 'they' ? 'are' : 'is';
    const has = p.sub === 'they' ? 'have' : 'has';
    const say = p.sub === 'they' ? 'say' : 'says';
    let line;
    if (i.kind === 'tells') {
      line = `${i.name} does not hesitate. ${p.Sub} ${say} ${inst.holder}, ${p.sub} ${are} right, `
        + `and ${p.sub} ${has} just made an enemy for the rest of the season.`;
    } else if (i.kind === 'covers') {
      line = `${i.name} knows exactly who it was and hands ${hoh} a different name entirely. `
        + 'Whatever that friendship is worth, it is being spent right now.';
    } else if (i.kind === 'reads') {
      line = `${i.name} has no idea and says ${inst.holder} anyway, on nothing but the way `
        + `${inst.holder} has been standing since the competition ended.`;
    } else if (i.kind === 'guesses') {
      line = `${i.name} names ${i.points}, which is a guess in a confident voice. ${i.points} is `
        + 'going to hear about this by the end of the night.';
    } else if (i.kind === 'silent') {
      line = `${i.name} will not give a name. ${p.Sub} ${are} not handing anybody to a Head of `
        + 'Household who could be back in power in ten minutes.';
    } else {
      line = `${inst.holder} sits down opposite ${hoh} and lies about it`
        + (i.points ? `, then offers ${i.points} as a helpful suggestion.` : ', calmly, at length.');
    }
    beats.push(beat(line, [i.name], BADGE[i.kind],
      i.kind === 'tells' || i.kind === 'reads' ? 'red' : i.kind === 'denies' ? 'gold' : 'blue'));
  }

  // ── the name ──
  const ranked = [...weights.entries()].sort((a, b) => b[1] - a[1]);
  const d = pStats(hoh) || {};
  // The room's best answer, tempered by whether this Head of Household can read
  // one. A poor read talks themselves out of a correct room.
  const trust = clamp(0.3 + ((d.intuition || 5) / 10) * 0.55, 0.2, 0.9);
  const accused = (ranked.length && rng() < trust)
    ? ranked[0][0]
    : (rivals[Math.floor(rng() * Math.max(1, rivals.length))] || null);
  const caught = accused === inst.holder;

  beats.push(beat(
    `Everybody is called back in. ${hoh} has one name and the whole house watches ${hoh} say it: `
      + `${accused || 'nobody at all'}.`,
    [hoh, accused].filter(Boolean), 'THE NAME', 'gold'));

  if (caught) {
    beats.push(beat(
      `It is the right name. ${inst.holder} does not get to argue. ${hoh} keeps the week, the power `
        + `is spent for nothing, and every person here has just learned what ${inst.holder} is `
        + 'willing to do quietly.',
      [hoh, inst.holder], 'CAUGHT', 'red'));
    for (const n of house) {
      if (n === inst.holder) continue;
      try {
        learnBBPower(n, inst.holder, inst.powerId,
          { from: hoh, week: weekNum, confidence: 1, rng: () => 0 });
      } catch { /* belief store */ }
      addBond(n, inst.holder, -1.4);
    }
  } else {
    beats.push(beat(
      accused
        ? `It is the wrong name. ${accused} has to stand there while the whole house looks at them, `
          + `and ${inst.holder} is Head of Household with nobody in this building any the wiser.`
        : `${hoh} cannot make the call, and that is an answer too. ${inst.holder} is Head of `
          + 'Household and nobody knows it.',
      [hoh, accused].filter(Boolean), 'THE WRONG NAME', 'gold'));
    // Being named for something you did not do costs you anyway — the room
    // heard it, and rooms remember accusations better than corrections.
    if (accused) {
      for (const n of house) {
        if (n === accused) continue;
        addBond(n, accused, -0.5);
      }
    }
    addBond(hoh, inst.holder, -0.6);
  }

  return {
    type: 'interrogation', holder: inst.holder, deposed: hoh, caught,
    // Who it was actually for — null when the holder was saving themselves.
    protecting: forAlly ? protecting : null,
    hoh: caught ? hoh : inst.holder,
    accused, interviews,
    ...shown(inst, 'nominations', caught
      ? `${hoh} named ${inst.holder} and keeps the week.`
      : `${inst.holder} is Head of Household and nobody knows it.`),
    beats,
  };
}

/**
 * The Mystery Competitor.
 *
 * Only usable on the block, per the show. A former houseguest takes one of the
 * drawn veto spots and plays on the holder's behalf; if the alumnus wins, the
 * veto belongs to the holder.
 *
 * `alumni` is passed in rather than read here, because who is eligible to walk
 * back through that door is a franchise question (js/social/hosts.js reads the
 * player database for everybody who has finished a season) and this module
 * should not learn it.
 */
/** One line out of a pool, so the same arrival is not written twice a season. */
const pickFrom = (pool, rng) => pool[Math.floor(rng() * pool.length)];

/** Where they played, when the caller knows — some rosters carry no seasons. */
const seasonOf = pick => (pick && typeof pick === 'object' && pick.seasonName) || null;

const ANNOUNCE = [
  (g, h, sn) => 'The house is called to the living room without being told why, which by now they '
    + `know means something. "Houseguests. In a moment, this door is going to open, and the person `
    + `walking through it does not live here."${sn ? ` Somebody in that room has already worked out that a season just got named.` : ''}`,
  (g, h) => 'They are told to sit down and not to touch anything, and then they are left there for '
    + 'four minutes with nothing to look at but the door. By minute three somebody has said the '
    + `word "returnee" out loud and the room has stopped being able to sit still.`,
  (g, h, sn) => `"There is one spot in this week's veto competition that has not been drawn yet." `
    + 'That is the entire announcement. Nobody says who, nobody says how, and every person on that '
    + `sofa starts counting the people who are missing from it.`,
  (g, h) => 'The screen in the living room comes on and stays black. It does that for long enough '
    + 'that two of them start laughing at it, and then the front door lock goes, which is a sound '
    + 'this house has not heard since move-in.',
];

const ARRIVAL = [
  (g, house, sn) => `${g} walks in${sn ? ` — ${sn}, and half this room grew up watching it` : ''}. `
    + 'The screaming is genuine. Somebody is crying who has not cried all season, and for about '
    + 'ninety seconds nobody in that living room is playing this game at all.',
  (g, house, sn) => `${g} comes through the door with a bag, which is the detail that lands: a bag `
    + `means staying. It is explained that it does not, ${g} is here for one afternoon and one `
    + 'competition, and the disappointment goes round that room like weather.',
  (g) => `${g} does not say anything at first. ${g} walks the length of the living room, looks at `
    + 'the memory wall, finds the frames of people who are already gone, and only then turns round '
    + 'to a house that has gone completely silent.',
  (g, house) => `${g} is hugged by every single person in that room, including three who have `
    + `spent the last week trying to evict each other. ${house.length > 6 ? 'It is the friendliest this house has been in a fortnight' : 'It is the friendliest this house has been all season'}, and it lasts until somebody `
    + 'thinks to ask the obvious question, which is why now.',
];

const HANDOFF = [
  (g, h, comp) => `${h} gets ${g} alone by the storage door for ninety seconds. It is not a `
    + `strategy meeting — there is no time — it is ${h} saying who is dangerous and ${g} listening `
    + `to a house ${g} has never lived in, and then it is ${comp} and no more talking.`,
  (g, h) => `${g} finds ${h} before anybody else does, because ${g} has been told whose afternoon `
    + `this is. "So you're the one." ${h} does not answer that where people can hear it, and the `
    + 'two of them go outside.',
  (g, h, comp) => `They get one conversation and ${h} spends it apologising, which ${g} waves off. `
    + `"I've been sitting at home for a year. You think I'm not going to play ${comp}?"`,
  (g, h) => `${h} tries to explain the block, the votes, who is lying to whom, and gets about a `
    + `third of the way through before ${g} cuts in. "I don't need the `
    + `house. I need the comp." That is the whole meeting.`,
];

const DIARY = [
  (g, h, comp) => `${g}, in the diary room chair, in the same chair as a season ago: "I got a `
    + `phone call four days ago. That's it. That's all the warning I had." A beat. "And now I'm `
    + `playing ${comp} for somebody I have never met, because somebody bought me. I'd be insulted `
    + `if it wasn't so flattering."`,
  (g, h) => `${g}: "Do I want ${h} to win this game? I have no idea who ${h} is. But somebody in `
    + 'there spent something real to get me through that door, and I have never in my life been '
    + 'the thing somebody spent a power on."',
  (g, h, comp) => `${g}: "The weird part is the smell. You forget that. Then you walk in and it's `
    + `${comp} in twenty minutes and you're back like you never left, except everyone's a stranger `
    + 'and you go home tonight either way."',
  (g, h) => `${g}: "They told me the rules on the drive in. I play, I win, I hand it to ${h}, I `
    + `leave. I don't get a vote, I don't get a bed, I don't get a say." ${g} laughs at the ceiling. `
    + '"Best day I have had in a year."',
];

export function playMysteryCompetitor({ week, nominees = [], players = [], alumni = [],
  library = [], hoh = null, house = [], rng = Math.random } = {}) {
  const weekNum = Number(week?.num) || 0;
  const inst = livePower('vetoProxy', weekNum);
  if (!inst) return null;
  // On the block, or it does nothing — the one restriction the show put on it.
  if (!nominees.includes(inst.holder)) return null;
  if (!players.length || !alumni.length) return null;

  usePower(inst, weekNum);

  // The competition is drawn FIRST, because the guest is chosen to suit it —
  // you do not summon a wall-sitter to a puzzle.
  const eligible = (library || []).filter(c => c?.stats && (c.types || []).includes('veto'));
  const comp0 = eligible.length
    ? eligible[Math.floor(rng() * eligible.length)]
    : { id: 'proxy-veto', name: 'the yard', stats: { physical: .4, mental: .3, endurance: .3 } };

  // ── who walks through the door ──
  //
  // `alumni` are people from FINISHED seasons, handed in by the caller. The
  // first version filtered the current cast for anybody not in the house, which
  // is not an alumnus — it is somebody this season evicted three weeks ago, who
  // is sitting in the jury and cannot walk back in for an afternoon.
  //
  // Weighted toward the ones worth putting on television: a winner is a bigger
  // moment than a mid-placer, and the door opening on somebody who went out
  // ninth in season four is not the same scene.
  // Chosen for THIS competition, not for fame. `pStats` returns flat defaults
  // for anybody outside the current cast, so the only honest signal about an
  // alumnus is their record — and `chalWins` is a competition record, which is
  // exactly the question being asked. Somebody who won five is a better call
  // for a veto than somebody who won a season on social game.
  //
  // Weighted rather than a hard best-pick: the house is summoning who it wants,
  // and the best available player is not always the one somebody thinks of.
  const statsOf = a => (a && typeof a === 'object' && a.stats) || pStats(a?.name) || {};
  const fitOf = a => Object.entries(comp0.stats || {})
    .reduce((sum, [stat, w]) => sum + (statsOf(a)[stat] || 0) * w, 0);
  // ── YOU CALL SOMEBODY WHO CAN WIN THIS ONE ──
  //
  // A soft weight across a hundred and fifty alumni barely concentrates at all,
  // which is how a competitor got summoned into a veto and finished LAST in it.
  // Nobody spends the biggest thing in their pocket on a name they like the
  // sound of: they pick for the competition that is standing in the yard.
  //
  // So the field is cut to the people who are actually good at THIS one, and
  // the draw happens inside that shortlist — still a draw, because the best
  // available player is not always the one somebody thinks of, but a draw from
  // twelve contenders rather than from everybody who has ever played.
  const shortlist = [...alumni].sort((a, b) => fitOf(b) - fitOf(a)).slice(0, 12);
  const pick = weighted(shortlist, a => {
    // Real stats when the caller has them — the roster fallback carries the
    // whole cast sheet — and `pStats` otherwise, which returns flat defaults
    // for anybody outside the current cast and makes `fit` a constant. That is
    // why the roster is worth passing: without it this weight was fame alone
    // dressed up as a competition read.
    return 1 + Math.max(0, (a.chalWins || 0)) * 0.5 + (a.winner ? 0.8 : 0)
      + (a.finalist ? 0.4 : 0) + Math.max(0, fitOf(a) - 4) * 1.2;
  }, rng);
  const guest = pick?.name || String(pick || alumni[0]?.name || alumni[0]);

  // ── one of the randomly drawn spots ──
  //
  // The wiki is specific: the guest takes "one of the two randomly selected
  // Veto spots". So the person bumped is a DRAWN player — never the Head of
  // Household and never a nominee, who are in that yard by right and cannot be
  // sent out of it by somebody else's power.
  const drawn = players.filter(n => n !== inst.holder && n !== hoh && !nominees.includes(n));
  const displaced = drawn.length ? drawn[Math.floor(rng() * drawn.length)] : null;

  const compName = comp0?.name || 'the veto';
  // A crossover is not a returning houseguest, and saying so is the difference
  // between a cameo and a lie. Somebody out of the other show has never played
  // THIS game, and the narration used to call them a veteran of it.
  const visiting = pick && pick.native === false;
  const beats = [beat(
    'The veto draw stops. There is a name in the bag that does not belong to anybody in this '
      + `house, and the door opens for ${visiting
        ? 'somebody this house has only ever watched on television'
        : 'somebody who has played this game before'}: ${guest}`
      + `${pick?.seasonName ? `, out of ${pick.seasonName}` : ''}`
      + `${visiting ? ' — a different show, a different set of rules, and not one night spent in here' : ''}`
      + `${pick?.winner ? ', who won it' : pick?.finalist ? ', who sat at the end of it' : ''}.`,
    [guest, inst.holder], visiting ? 'NOT EVEN FROM THIS SHOW' : 'A NAME NOBODY EXPECTED', 'gold')];
  // ── THEY ARE A PERSON, NOT A DIE ROLL ──
  //
  // The whole scene was: a name comes out of the bag, somebody is bumped, a
  // number is posted. A former houseguest walking back through that door is one
  // of the biggest things this format can do and it was over in three lines,
  // with the guest never speaking, never being greeted, and never once being in
  // a room with the person who paid to summon them.
  beats.push(beat(
    pickFrom(ANNOUNCE, rng)(guest, inst.holder, seasonOf(pick)),
    [guest, inst.holder], 'HOUSEGUESTS, TO THE LIVING ROOM', 'blue'));
  beats.push(beat(
    pickFrom(ARRIVAL, rng)(guest, house, seasonOf(pick)),
    [guest, inst.holder], 'THE DOOR OPENS', 'gold'));
  if (displaced) {
    beats.push(beat(
      `${displaced} is out of the draw and did nothing to deserve it, which is the part nobody `
        + 'will be able to explain to them.',
      [displaced, guest], 'BUMPED', 'red'));
  }
  // The room they are put in together, which is the only place the transaction
  // is visible: one of them bought this and both of them know it.
  beats.push(beat(
    pickFrom(HANDOFF, rng)(guest, inst.holder, compName),
    [guest, inst.holder], 'A QUIET WORD', 'blue'));
  beats.push(beat(
    pickFrom(DIARY, rng)(guest, inst.holder, compName),
    [guest, inst.holder], 'DIARY ROOM', 'grey'));

  return {
    type: 'mystery-competitor', holder: inst.holder, guest, displaced,
    visiting: !!visiting, guestShows: pick?.shows || [],
    // Filled in by `mysteryCompetitorResult` once the REAL competition has run.
    competition: null, won: null, vetoTo: null,
    ...shown(inst, 'veto-ceremony',
      `${guest} walked back into the house and took a veto spot on ${inst.holder}'s behalf.`),
    beats,
  };
}

/**
 * How it went — read off the competition everybody else played.
 *
 * The guest used to post a number against a PAR, in a private simulation
 * alongside the real thing. The draw screen listed six players and the
 * competition screen showed five, because the sixth was never in it: a name in
 * the yard with no run, no score, and no place on the shelf at the end.
 *
 * They are a participant now. `pStats` falls back to the franchise roster, so
 * an alumnus has the stat sheet the franchise says they have and is scored by
 * exactly the same engine as the houseguests. Winning hands the medallion to
 * the person who paid for them — which is the power — and losing is a real
 * loss to a real room.
 */
export function mysteryCompetitorResult({ act, competition, winner } = {}) {
  if (!act?.guest) return null;
  const { guest, holder } = act;
  const scores = competition?.scores || {};
  const mine = Number(scores[guest]);
  const best = Math.max(...Object.entries(scores)
    .filter(([n]) => n !== guest).map(([, v]) => Number(v) || 0), 0);
  const won = winner === guest;
  const name = competition?.name || 'the competition';
  const score = Number.isFinite(mine) ? mine.toFixed(1) : '—';
  const bar = best ? best.toFixed(1) : '—';

  act.competition = { id: competition?.id || null, name, posted: Number.isFinite(mine) ? mine : null,
    bar: best || null };
  act.won = won;
  act.vetoTo = won ? holder : null;
  // NOT act.detail — that is the arrival card's subtitle, and it was printing
  // "won the veto on Bowie's behalf" at the top of the screen that exists to
  // show them walking through the door.
  act.resultDetail = won
    ? `${guest} won the veto on ${holder}'s behalf, ${score} against ${bar}.`
    : `${guest} played for ${holder} and lost it, ${score} against ${bar}.`;

  // ── AND IT DOES NOT GO ON THE ARRIVAL SCREEN ──
  //
  // These used to be appended to the Mystery Competitor act, which is drawn at
  // the veto ceremony — so the twist's own screen opened by announcing the
  // result of a competition the viewer had not watched yet. The arrival is the
  // arrival. What happened in the yard belongs to the yard, and the goodbye
  // belongs there too, because that is where they actually leave from.
  const beats = [beat(
    `${guest} plays ${name} against the whole room, and is scored like anybody else out there.`,
    [guest, holder], 'A STRANGER IN THE YARD', 'blue')];
  beats.push(won
    ? beat(`${score}. ${guest} wins it and hands it straight to ${holder}, who has been on the `
      + 'block all week and is now not going anywhere. Somebody paid for that, weeks ago, in private.',
    [guest, holder], `${score} v ${bar}`, 'gold')
    : beat(`${score}, against ${bar}. ${guest} loses, and ${holder} has bought a body in the draw `
      + 'and nothing else.',
    [guest, holder], `${score} v ${bar}`, 'red'));
  beats.push(beat(pickFrom(GOODBYE, () => (Number.isFinite(mine) ? Math.abs(mine % 1) : 0.5))(guest, holder, won),
    [guest, holder], 'AND THEN THEY GO', 'grey'));
  act.resultBeats = beats;
  return act;
}

const GOODBYE = [
  (g, h, won) => `${g} is walked back out through the same door, an hour and a half after coming `
    + `through it. ${won ? `Whatever happens to ${h} now, ${g} will read about it.` : 'No goodbyes '
      + 'from anybody who was not already awake, and the house is quieter for the rest of the night.'}`,
  (g, h, won) => `${g} hands the microphone back, says "good luck, seriously" to a room that is `
    + `already arguing about something else, and is gone. ${won ? 'The medallion stays.' : 'Nothing stays.'}`,
  (g, h, won) => `The front door goes for the second time today and does not open again. ${g} does `
    + `not live here${won ? ', and left something behind anyway' : ' and did not manage to change that'}.`,
  (g, h) => `${g} is out of the house before the yard lights are off. Two houseguests will spend `
    + `the next week arguing about whether ${g} was ever really there, which is what happens when `
    + 'somebody arrives and leaves inside one afternoon.',
];

/**
 * The Mystery Veto.
 *
 * A second veto competition at the end of the veto ceremony with exactly one
 * player in it. Usable whether or not the holder is a nominee, per the show —
 * which is what makes it more than a self-save: it can take somebody else off
 * a block that was already settled.
 */
export function playMysteryVeto({ week, nominees = [], house = [], library = [],
  rng = Math.random } = {}) {
  const weekNum = Number(week?.num) || 0;
  const inst = livePower('soloVetoComp', weekNum);
  if (!inst || !house.includes(inst.holder)) return null;

  // ── who it would even be for ──
  //
  // `saves` was `nominees[0]` — whoever happened to be listed first. So a
  // holder who was not on the block took somebody off it at random, for no
  // reason, and the week rearranged itself around a choice nobody made. It is
  // a CHOICE now: yourself if you are sitting there, otherwise the nominee you
  // actually want to keep.
  const onBlock = nominees.includes(inst.holder);
  const others = nominees.filter(n => n !== inst.holder);
  // Not a raw bond. Being sworn to somebody in a named alliance is worth more
  // than liking them, and it was worth nothing here: six people with a name on
  // their group and the veto still came down to who the holder happened to like
  // two points more.
  const ally = others
    .map(n => ({ name: n, b: (() => { try { return allyStake(inst.holder, n); } catch { return 0; } })() }))
    .sort((a, b) => b.b - a.b)[0] || null;
  // Spent when it is worth spending. Not on the block and with nobody on it
  // worth saving, this is a power looking for a use — and using it there is how
  // you end up having spent the biggest thing you had on a stranger. Sitting on
  // the block yourself is not a dilemma, so it is very nearly one.
  const need = onBlock ? 0.98 : Math.min(0.78, (ally?.b || 0) * 0.92);
  const st = pStats(inst.holder) || {};
  const pull = spendPull({ need,
    weeksLeft: Math.max(0, inst.expiresAfterWeek - weekNum),
    nerve: (st.boldness || 5) / 10 });
  if (rng() > pull) return null;
  // Nobody to use it on at all: it stays in the pocket rather than being spent
  // on whoever was standing nearest.
  if (!onBlock && !ally) return null;

  usePower(inst, weekNum);

  // ── an actual competition ──
  //
  // It said "beats it alone" and there was no competition anywhere: no name, no
  // score, nothing to beat. The house was told somebody won something and the
  // audience was asked to take it on faith.
  //
  // So a real one is drawn from the library the week is already using, and the
  // holder plays it the way anybody plays it — their own stats against its own
  // weights. What they are playing against is a PAR: what this house would
  // typically have posted on it. Alone is not unopposed; it is a number to beat
  // that nobody is standing in front of.
  const eligible = (library || []).filter(c => c?.stats && (c.types || []).includes('veto'));
  const comp = eligible.length
    ? eligible[Math.floor(rng() * eligible.length)]
    : { id: 'solo-veto', name: 'a course in the dark', stats: { physical: .4, mental: .3, endurance: .3 } };

  const score = name => {
    const st = pStats(name) || {};
    return Object.entries(comp.stats || {})
      .reduce((sum, [stat, weight]) => sum + (st[stat] || 0) * weight, 0);
  };
  const field = house.filter(n => n !== inst.holder);
  const avg = field.length
    ? field.reduce((sum, n) => sum + score(n), 0) / field.length
    : 5;
  // The bar is what the room would have done, minus a little — nobody is
  // pushing them, and that cuts both ways.
  const par = Math.round((avg * 0.94) * 10) / 10;
  const posted = Math.round((score(inst.holder) + (rng() * 3 - 1.2)) * 10) / 10;
  const won = posted >= par;

  const beats = [beat(
    'The veto ceremony is over and this week was supposed to be settled. It is not. There is a '
      + `second competition in the yard tonight — ${comp.name} — and exactly one houseguest is `
      + 'allowed to play in it.',
    [inst.holder], 'A SECOND VETO', 'gold')];
  beats.push(beat(
    `${inst.holder} plays it alone against the clock. The number to beat is ${par.toFixed(1)}: what `
      + 'this house would have posted between them, which is the only opponent out there tonight.',
    [inst.holder], 'ALONE, AGAINST A NUMBER', 'blue'));
  const forWhom = onBlock ? 'themselves'
    : `${ally?.name}, the one person on that block ${inst.holder} actually wants to keep`;
  beats.push(won
    ? beat(`${posted.toFixed(1)}. ${inst.holder} beats it, and walks back inside holding a real `
      + `veto for ${forWhom} on a block everybody had already stopped thinking about.`,
    [inst.holder], `${posted.toFixed(1)} v ${par.toFixed(1)}`, 'gold')
    : beat(`${posted.toFixed(1)}, against ${par.toFixed(1)}. Nobody was standing in the way and it `
      + 'was still lost, and the house now knows the power existed and did nothing.',
    [inst.holder], `${posted.toFixed(1)} v ${par.toFixed(1)}`, 'red'));

  return {
    type: 'mystery-veto', holder: inst.holder, won,
    competition: { id: comp.id, name: comp.name, posted, par },
    saves: won ? (onBlock ? inst.holder : ally?.name || null) : null,
    ...shown(inst, 'veto-ceremony', won
      ? `${inst.holder} beat ${comp.name} alone, ${posted.toFixed(1)} against a par of ${par.toFixed(1)}.`
      : `${inst.holder} played ${comp.name} alone and lost it, ${posted.toFixed(1)} against ${par.toFixed(1)}.`),
    beats,
  };
}
