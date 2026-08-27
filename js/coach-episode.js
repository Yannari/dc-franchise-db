// The per-episode coaching block: run the sessions, move the bonds, record
// what happened. This is the only file in the twist that writes to `gs`; the
// maths lives in coach-agenda.js and the store in coaches.js.
import { gs, players, seasonConfig } from './core.js';
import { pStats } from './players.js';
import { addBond, getBond } from './bonds.js';
import { activeCoaches, bankTraining, coachesOf, coachRecord, isCoach, removeCoach, revokeCoachTraining, sessionsFor } from './coaches.js';
import { pickSessionTargets, sessionGain, teachableStat, aweOf } from './coach-agenda.js';
import { showWords } from './shows.js';
import { giveAdvantage } from './advantages.js';
import { nonAggressionBars } from './coach-deals.js';

/** How close this coach is to being voted out, 0..1. Lifts their survive agenda. */
function vulnerabilityOf(coachName, tribe) {
  const bonds = tribe.members.map(m => getBond(coachName, m));
  if (!bonds.length) return 0.5;
  const avg = bonds.reduce((a, b) => a + b, 0) / bonds.length;
  return Math.max(0, Math.min(1, (5 - avg) / 15));
}

/**
 * Career fame gap between a coach and a contestant, in stars.
 *
 * `js/fame.js` derives real stars from `computeFame({ players, rankings,
 * seasons, franchise })` — a full walk of seasons_database.json /
 * players_database.json / the franchise records file. None of those
 * databases are loaded into the live simulator's `gs` (fame.js's own header
 * says as much: "the site uses it now and the simulator uses it later"), so
 * there is no continuous 0-5 score to feed `starsFromScore` from inside an
 * episode.
 *
 * This is a two-tier PROXY, not real fame: the coach's own `stars` (set on
 * `addCoach`, defaulting to 4.5 — coaches are winners/finalists by
 * definition) against a flat guess at the contestant's own standing, read
 * off `isReturnee` because that field IS reachable in-engine today
 * (`js/players.js` already reads it): a newbie is `0`, a returning vet is
 * `2.0`. It is deliberately coarse and should be replaced the day a season
 * builder plumbs real fame.js output into `gs`.
 *
 * Kept as a seam (not hardcoded inline) so a caller can pass real fame later
 * without touching `runCoachingBlock`, and so tests can inject a stand-in.
 */
export function defaultFameGapOf(coachName, contestantName, tribeCoaches) {
  const coach = (tribeCoaches || []).find(c => c.name === coachName);
  const coachStars = coach?.stars ?? 4.5;
  const contestant = players.find(p => p.name === contestantName);
  const contestantStars = contestant?.isReturnee ? 2.0 : 0;
  return coachStars - contestantStars;
}

export function runCoachingBlock(ep, tribe, roll = Math.random, fameGapOf = defaultFameGapOf) {
  const tribeName = tribe.name ?? tribe.tribeName;
  const coaches = coachesOf(tribeName);
  const sessions = [], passedOver = [];

  for (const coach of coaches) {
    const coachStats = pStats(coach.name);
    const archetype = players.find(p => p.name === coach.name)?.archetype;
    const budget = coach.sessionsPerEp || sessionsFor(tribe.members.length);
    const discipline = teachableStat(coachStats);

    // Coach Against Coach's non-aggression channel is enforced HERE, not just
    // narrated — a coach who agreed to stay out of a rival's corner never
    // even sees that rival's strong protégés in their own candidate pool.
    const candidates = tribe.members
      .filter(name => !nonAggressionBars(coach.name, name, tribe))
      .map(name => ({
        name, stats: pStats(name), bond: getBond(coach.name, name), atRisk: 0,
      }));

    const picked = pickSessionTargets({
      coach: { stats: coachStats, archetype, vulnerability: vulnerabilityOf(coach.name, tribe) },
      candidates, sessions: budget, roll,
    });

    for (const contestant of picked) {
      const gain = sessionGain(coachStats[discipline], getBond(coach.name, contestant), roll);
      const banked = bankTraining(coach.name, contestant, discipline, gain);

      // Awe accelerates attachment, never learning: it multiplies the BOND a
      // session builds, and never touches sessionGain (the training itself)
      // above. A negative awe (the strategic archetypes reading a famous
      // coach as a threat, not a hero) must not invert into a bond penalty
      // here — being coached is still attention, so the floor is 0, not the
      // raw negative awe.
      const contestantArchetype = players.find(p => p.name === contestant)?.archetype;
      const gap = fameGapOf(coach.name, contestant, coaches);
      const awe = aweOf({ gap, stats: pStats(contestant), archetype: contestantArchetype });
      const bondMult = 1 + Math.max(0, awe);

      // Attention builds attachment whether or not the teaching was any good.
      addBond(coach.name, contestant, 1 * bondMult);
      sessions.push({ coach: coach.name, contestant, stat: discipline, gain: banked });
    }

    for (const name of tribe.members) {
      if (picked.includes(name)) continue;
      // Resentment IS a bond, not a new stat.
      addBond(coach.name, name, -0.5);
      passedOver.push({ coach: coach.name, contestant: name });
    }
  }

  if (coaches.length) {
    if (!ep.coachData) ep.coachData = {};
    ep.coachData[tribeName] = { sessions, passedOver };
  }
  return { sessions, passedOver };
}

/**
 * A coach is voted out.
 *
 * The mechanical cost is revocation — everything they banked leaves with them,
 * immediately and visibly, which is what makes a coach who did his job
 * expensive to cut. The rest is the twist's largest emotional beat and must
 * not be silent.
 */
export function eliminateCoach(ep, coachName) {
  const record = coachRecord(coachName);
  const tribe = record?.tribe;
  const lost = revokeCoachTraining(coachName);

  // Reactions are scoped to the departing coach's own tribe — pre-merge,
  // the other tribe has never met him, and manufacturing a reaction for
  // every contestant in `gs.activePlayers` puts an "unsettled" line on
  // strangers who have no idea he existed.
  const tribeObj = (gs.tribes || []).find(t => (t.name ?? t.tribeName) === tribe);
  const reactionPool = tribeObj ? tribeObj.members : (gs.activePlayers || []);

  const reactions = [];
  for (const name of reactionPool) {
    const bond = getBond(coachName, name);
    // Thresholds are allowed here: this chooses narrative text, not gameplay.
    const kind = bond >= 5 ? 'grief' : bond <= -3 ? 'relief' : 'unsettled';
    reactions.push({ contestant: name, kind, bond });
  }

  removeCoach(coachName);
  if (!ep.coachElimination) ep.coachElimination = [];
  ep.coachElimination.push({ coach: coachName, tribe, lost, reactions });
  return { lost, reactions };
}

/**
 * One card per coach, playable only if every contestant on the tribe agrees.
 *
 * Unanimity is the twist's difficulty dial. A tribe that cannot agree argues
 * and loses its coach anyway, which is also a scene.
 *
 * A never-interacted bond defaults to 0. Silence is not consent — a tribe
 * that has barely met its coach must not be able to save him by default, so
 * every contestant must sit STRICTLY ABOVE zero, not merely non-negative.
 */
export function offerSaveCard(ep, coachName, tribe) {
  const record = coachRecord(coachName);
  if (!record) return { played: false, replacement: null, reason: 'not-a-coach', votes: [] };
  if (record.saveCard !== 'unused') return { played: false, replacement: null, reason: 'already-used', votes: [] };

  // THE CARD IS BETWEEN THE COACHES OF ONE TEAM. Contestants have nothing to
  // say about it — they already had their say, at the vote. Every other coach
  // on this tribe has to agree, which makes a single rival enough to end a
  // colleague, and makes refusing the cheapest kill in the game: you never
  // need the numbers at tribal, you need one peer who would rather not.
  // Tribe size decides how much of a net exists at all — a lone coach has
  // none, and on a two-coach tribe one rival holds the other's life.
  const peers = coachesOf(record.tribe).filter(c => c.name !== coachName);
  // No peers, no consensus to reach. The last coach standing has no net, and
  // that is the rule, not an oversight — a card you can play alone is not a
  // consensus card.
  if (!peers.length) return { played: false, replacement: null, reason: 'no-peers', votes: [] };

  const votes = peers.map(p => ({ coach: p.name, ...saveCardVerdict(p.name, coachName) }));
  const refuser = votes.find(v => !v.consents);
  if (refuser) {
    if (!ep.coachSaveRefusals) ep.coachSaveRefusals = [];
    ep.coachSaveRefusals.push({ coach: coachName, refusedBy: refuser.coach, reason: refuser.reason, votes });
    return { played: false, replacement: null, reason: `refused:${refuser.coach}`, votes };
  }

  // Unanimous. The card removes a contestant, never another coach — the
  // filter guards against a caller seeding the tribe roster incorrectly.
  const replacement = (tribe?.members || [])
    .filter(m => !isCoach(m))
    .slice()
    .sort((a, b) => getBond(coachName, a) - getBond(coachName, b))[0] || null;
  if (!replacement) return { played: false, replacement: null, reason: 'no-replacement', votes };

  record.saveCard = 'used';
  if (!ep.coachSaves) ep.coachSaves = [];
  ep.coachSaves.push({ coach: coachName, tribe: tribe?.name ?? tribe?.tribeName, replacement, votes });
  return { played: true, replacement, reason: 'unanimous', votes };
}

/**
 * One coach deciding whether to save another — proportional, never a table.
 *
 * Easy when they get on and run together, hard when they don't and the other
 * one plays the game for a living. Archetype sets the starting lean, the
 * relationship moves it, and a coach whose protégés are being out-trained has
 * a reason to let a colleague go that has nothing to do with liking them.
 */
export function saveCardVerdict(voterCoach, endangered) {
  const st = pStats(voterCoach);
  const arche = players.find(p => p.name === voterCoach)?.archetype;
  const bond = getBond(voterCoach, endangered);
  const allied = (gs.namedAlliances || []).some(a =>
    a.active && a.members.includes(voterCoach) && a.members.includes(endangered));

  // Nice archetypes lean toward saving; the strategic and villainous lean
  // away. Everyone else sits near the middle and lets the relationship decide.
  const NICE = ['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat'];
  const COLD = ['villain', 'mastermind', 'schemer'];
  const lean = NICE.includes(arche) ? 0.75 : COLD.includes(arche) ? 0.2 : 0.45;

  // Loyalty pulls toward yes, strategic play pulls toward no — proportional
  // to the stat, never a threshold.
  let p = lean + (st.loyalty / 10) * 0.3 - (st.strategic / 10) * 0.3;
  p += Math.max(-10, Math.min(10, bond)) * 0.045;   // the relationship
  if (allied) p += 0.2;                              // running together

  // The rival read: a coach whose colleague has more of the tribe invested in
  // them is looking at the person most likely to outlast them.
  const mine = Object.keys(gs.coachTraining?.[voterCoach] || {}).length;
  const theirs = Object.keys(gs.coachTraining?.[endangered] || {}).length;
  p -= Math.max(0, theirs - mine) * 0.06;

  const consents = p >= 0.5;
  const reason = !consents
    ? (bond < 0 ? 'bad-blood' : theirs > mine ? 'rival-outbuilding' : COLD.includes(arche) ? 'strategic' : 'unconvinced')
    : (allied ? 'allied' : bond > 2 ? 'friendship' : 'decency');
  return { consents, reason, score: Math.round(p * 100) / 100 };
}

/**
 * Every surviving coach becomes a full player.
 *
 * One push into gs.activePlayers, after which 135 modules begin treating them
 * as contestants without being told. They arrive with their bonds, their
 * banked advantages, and NO training on themselves — a real weakness, since
 * they spent the whole pre-merge improving other people.
 *
 * The stake is the one exception: a coach whose protégés are still standing
 * arrives sharper, so coaching well is not merely a way to stay alive.
 */
export function promoteCoaches(ep) {
  const promoted = [];
  for (const coach of activeCoaches()) {
    const built = gs.coachTraining?.[coach.name] || {};
    const surviving = Object.keys(built).filter(n => (gs.activePlayers || []).includes(n));
    const stake = Math.min(1.5, surviving.length * 0.5);

    coach.promoted = true;
    if (!gs.activePlayers.includes(coach.name)) gs.activePlayers.push(coach.name);
    if (stake > 0) bankTraining(coach.name, coach.name, 'strategic', stake);

    promoted.push({ name: coach.name, stake, surviving });
  }
  if (promoted.length) ep.coachPromotions = promoted;
  return promoted;
}

/**
 * Offer the departing coach's save card BEFORE `applyCoachElimination` reads
 * `result.eliminated` — a saved coach must never reach revocation.
 *
 * Looks the coach's own tribe up from `gs.tribes` via their stored `.tribe`
 * (never from whatever `tribalPlayers` the caller happened to build — a
 * double-tribal night merges several tribes' rosters into one ballot, and
 * the save card's unanimity check is scoped to the coach's OWN tribe only).
 *
 * If the tribe is unanimous, the coach survives and `result.eliminated` is
 * rewritten to the replacement they named — the normal contestant-elimination
 * path then runs against that name, so placements and jury stay correct.
 * Returns true if the card fired.
 */
export function maybeSaveCoach(ep, result) {
  if (!result?.eliminated || !isCoach(result.eliminated)) return false;
  const record = coachRecord(result.eliminated);
  if (!record) return false;
  const tribeObj = (gs.tribes || []).find(t => (t.name ?? t.tribeName) === record.tribe);
  if (!tribeObj) return false;

  const outcome = offerSaveCard(ep, result.eliminated, tribeObj);
  if (outcome.played && outcome.replacement) {
    result.eliminated = outcome.replacement;
    return true;
  }
  return false;
}

/**
 * Call this immediately after ANY vote-resolution result that might have
 * eliminated a coach — before that result's `.eliminated` is read by
 * contestant-only elimination machinery (double-elim, exile duel, RI/jury
 * routing, advantage inheritance, the `gs.activePlayers` filter).
 *
 * A coach is never in `gs.activePlayers`, so every one of those systems is a
 * SILENT NO-OP against a coach's name: `removeCoach` never runs,
 * `revokeCoachTraining` never runs, and the coach quietly keeps coaching with
 * their training intact — the worst failure shape this twist has, because it
 * looks like the vote worked. This is the one gate every `runTribal(...)`
 * result must pass through before its `.eliminated` field is trusted.
 *
 * Mutates `result.eliminated` to null (a coach boot costs the tribe its
 * coach, not a contestant's game) and returns true if it fired, so a caller
 * can skip whatever elimination branch it was about to take.
 */
export function applyCoachElimination(ep, result) {
  if (!result?.eliminated || !isCoach(result.eliminated)) return false;
  eliminateCoach(ep, result.eliminated);
  result.eliminated = null;
  return true;
}

/**
 * What one episode's coaching block COST or EARNED, told as camp events.
 *
 * `runCoachingBlock` already banked the training and moved the bonds; the
 * Coaches' Board (js/vp-coaches.js) already shows, session by session, who
 * got called on and who was left off. Neither of those is a camp event, and
 * this function must not become a third rendering of the same list — its job
 * is what the tribe DOES with what the board showed: a drill spilling out
 * into how someone carries themselves, a name kept off the board long enough
 * that its owner starts keeping their own tally, two protégés measuring
 * themselves against each other, a coach's own advice landing wrong in front
 * of witnesses. Every event lays its own consequence on top of whatever
 * `runCoachingBlock` already applied.
 */
export function coachFallout(ep, tribe, blockResult, roll = Math.random) {
  const W = showWords(seasonConfig.format);
  const events = [];
  const sessions = Array.isArray(blockResult?.sessions) ? blockResult.sessions : [];
  const passedOver = Array.isArray(blockResult?.passedOver) ? blockResult.passedOver : [];
  const members = tribe?.members || [];

  const archetypeOf = name => players.find(p => p.name === name)?.archetype;
  const pick = arr => arr[Math.min(arr.length - 1, Math.floor(roll() * arr.length))];

  if (!gs.popularity) gs.popularity = {};
  if (!gs._coachPassStreak) gs._coachPassStreak = {};

  // ── POSITIVE: a breakthrough spills out of the session and into camp ──
  // Guaranteed per successful session — the board only shows the drill ran;
  // this is the contestant actually walking around changed by it.
  for (const s of sessions) {
    const gain = Number(s.gain) || 0;
    if (gain <= 0) continue;
    const arche = archetypeOf(s.contestant);
    const pool = {
      villain: [
        `${s.contestant} runs the ${s.stat} trick ${s.coach} gave them the very next chance and makes sure two other ${W.players} watch it land.`,
        `${s.contestant} won't shut up about the ${s.stat} edge ${s.coach} handed over — not gratitude, just an inventory of a new weapon.`,
        `${s.contestant} tries the move once, files it away, and starts calculating who it's most useful against.`,
        `${s.contestant} corners a tribemate to demonstrate the ${s.stat} fix before anyone can ask how the session actually went.`,
      ],
      hero: [
        `${s.contestant} practices the ${s.stat} adjustment quietly, then goes and shows the same trick to whoever else is struggling with it.`,
        `${s.contestant} thanks ${s.coach} twice, then spends the rest of the afternoon teaching it forward instead of hoarding it.`,
        `${s.contestant} keeps at the drill until it clicks, visibly relieved it wasn't a fluke.`,
        `${s.contestant} credits ${s.coach} out loud, in front of the whole camp, for something most people would have kept to themselves.`,
      ],
      goat: [
        `${s.contestant} runs the ${s.stat} drill alone by the fire, half-convinced it'll stop working if anyone's watching.`,
        `${s.contestant} keeps turning over the one thing ${s.coach} said, like it might be an accident if examined too hard.`,
        `${s.contestant} tests the fix twice more before daring to believe it, and still won't say so out loud.`,
        `${s.contestant} looks almost surprised the session helped at all.`,
      ],
      default: [
        `${s.contestant} keeps testing the ${s.stat} adjustment ${s.coach} gave, and it keeps holding up.`,
        `${s.contestant} walks around camp a little taller — something ${s.coach} said actually stuck.`,
        `${s.contestant} tries explaining the ${s.stat} fix to a tribemate and only half succeeds, but the attempt is the tell.`,
        `${s.contestant} catches ${s.coach}'s eye across camp and gives a small nod — the drill worked, and both of them know it.`,
      ],
    };
    addBond(s.coach, s.contestant, 0.4);
    gs.popularity[s.contestant] = (gs.popularity[s.contestant] || 0) + 0.5;
    events.push({
      type: 'coachBreakthrough', players: [s.coach, s.contestant],
      badgeText: 'BREAKTHROUGH', badgeClass: 'green',
      text: pick(pool[arche] || pool.default),
    });
  }

  // ── POSITIVE: a protégé defends their coach, unprompted ──
  const coachNames = [...new Set([...sessions.map(s => s.coach), ...passedOver.map(p => p.coach)])];
  for (const coachName of coachNames) {
    const defender = members
      .filter(m => m !== coachName && getBond(coachName, m) >= 3)
      .sort((a, b) => getBond(coachName, b) - getBond(coachName, a))[0];
    const skeptic = members.find(m => m !== defender && m !== coachName);
    if (!defender || !skeptic || roll() >= 0.4) continue;
    const arche = archetypeOf(defender);
    const pool = {
      hero: [
        `${defender} won't let ${skeptic} write ${coachName} off, and it's not a strategic move — it just isn't true, as far as ${defender} is concerned.`,
        `${defender} steps in front of a joke at ${coachName}'s expense and shuts it down flat.`,
        `${defender} corrects ${skeptic} on the spot, calm and certain, like it's simply a fact that needed fixing.`,
        `${defender} refuses to let ${coachName}'s name get dragged through the mud on ${defender}'s watch.`,
      ],
      'loyal-soldier': [
        `${defender} tells ${skeptic}, unprompted, that ${coachName} has more than earned the benefit of the doubt.`,
        `${defender} defends ${coachName}'s picks to ${skeptic} like it's a personal matter, not a game one.`,
        `${defender} reminds ${skeptic} exactly what ${coachName} has done for the tribe, unasked.`,
        `${defender} won't let ${skeptic}'s grumbling about ${coachName} go unanswered, loyalty first.`,
      ],
      default: [
        `${defender} pushes back on ${skeptic}'s grumbling about ${coachName} — nobody asked ${defender} to.`,
        `${defender} finds a reason to bring ${coachName} up favourably while talking to ${skeptic}, apropos of nothing.`,
        `${defender} tells ${skeptic} flatly that ${coachName} knows what they're doing, and leaves it there.`,
        `${defender} takes ${skeptic}'s dig at ${coachName} more personally than the moment called for.`,
      ],
    };
    addBond(defender, coachName, 0.5);
    events.push({
      type: 'coachDefended', players: [defender, coachName, skeptic],
      badgeText: 'DEFENDED THE COACH', badgeClass: 'green',
      text: pick(pool[arche] || pool.default),
    });
  }

  // ── POSITIVE: a bond forms between two protégés comparing what they got ──
  const trainedNames = [...new Set(sessions.map(s => s.contestant))];
  if (trainedNames.length >= 2 && roll() < 0.45) {
    const a = pick(trainedNames);
    const b = pick(trainedNames.filter(n => n !== a));
    if (b) {
      addBond(a, b, 0.4);
      const pool = [
        `${a} and ${b} compare notes on what they were each taught and end up trading tips of their own.`,
        `${a} and ${b} realize they're both being built up for the same fight and decide that's a reason to team up, not compete.`,
        `${a} walks ${b} through the drill they just got, and ${b} returns the favour — the coaching spreads faster than the coach intended.`,
        `${a} and ${b} spend the rest of the evening running each other's new tricks, laughing every time one of them fumbles it.`,
      ];
      events.push({
        type: 'coachProtegeBond', players: [a, b],
        // NOT 'BONDING' — camp-events.js emits that badge for ordinary `bond`
        // and `tdBond` events too, so coach fallout was indistinguishable from
        // two contestants getting along, in the VP and in every ordering check.
        badgeText: 'PROTEGES COMPARE', badgeClass: 'green',
        text: pick(pool),
      });
    }
  }

  // ── NEGATIVE: the passed-over contestant noticing — guaranteed, and it escalates ──
  // GROUPED BY CONTESTANT, not by (coach, contestant) pair. Two things broke
  // when this looped over pairs: the camp filled with one near-identical
  // notice per coach per contestant per episode (124 of 598 coach events in a
  // 16-cast audit season), and the streak counter — which is keyed by
  // contestant — incremented once PER COACH, so a single skipped episode read
  // as "the 2nd round running" on a two-coach tribe. Being passed over by
  // every coach on the tribe is worse than by one, so that becomes louder
  // wording, not a second event.
  const _passedByContestant = new Map();
  for (const p of passedOver) {
    if (!_passedByContestant.has(p.contestant)) _passedByContestant.set(p.contestant, []);
    _passedByContestant.get(p.contestant).push(p.coach);
  }
  const _coachCount = new Set(passedOver.map(p => p.coach)).size;
  for (const [_contestant, _coaches] of _passedByContestant) {
    const p = { contestant: _contestant, coach: _coaches[0] };
    const unanimous = _coachCount > 1 && _coaches.length >= _coachCount;
    gs._coachPassStreak[p.contestant] = (gs._coachPassStreak[p.contestant] || 0) + 1;
    const streak = gs._coachPassStreak[p.contestant];
    // Being skipped once is a Tuesday; a pattern is a story. Rising odds keep
    // the escalation the design wants without narrating every single miss.
    // Unanimous raises the odds rather than bypassing them: on a small tribe
    // with a two-session budget, getting nothing from anybody is the ORDINARY
    // week, and narrating it every time is how the board filled with neglect
    // and nothing else. A standing pattern (streak 3+) is always worth saying.
    let _odds = streak >= 3 ? 1 : streak === 2 ? 0.55 : 0.25;
    if (unanimous) _odds = Math.min(1, _odds * 1.8);
    if (roll() >= _odds) continue;
    const arche = archetypeOf(p.contestant);
    const early = {
      villain: [
        `${p.contestant} clocks getting skipped again and quietly starts a list of who ${p.coach} does call on.`,
        `${p.contestant} says nothing to ${p.coach}'s face, and files the snub away for later.`,
        `${p.contestant} watches ${p.coach} pick someone else and starts thinking about leverage, not feelings.`,
        `${p.contestant} smiles through getting passed over again, already planning what it'll cost ${p.coach} later.`,
      ],
      hothead: [
        `${p.contestant} doesn't hide being annoyed at getting passed over — ${p.coach} hears about it within the hour.`,
        `${p.contestant} vents loudly about ${p.coach}'s picks to anyone still listening.`,
        `${p.contestant} snaps at the next person who mentions ${p.coach}'s name, no explanation needed.`,
        `${p.contestant} makes a point of being visibly annoyed where ${p.coach} can't miss it.`,
      ],
      goat: [
        `${p.contestant} assumes there's a good reason ${p.coach} skipped them and tries not to dwell on it.`,
        `${p.contestant} shrugs off getting left out again, or does a decent job pretending to.`,
        `${p.contestant} tells themselves it'll be their turn next time, without much conviction.`,
        `${p.contestant} keeps busy so nobody notices they weren't called on again.`,
      ],
      default: [
        `${p.contestant} notices being left off the board again and says nothing about it.`,
        `${p.contestant} watches someone else get pulled aside and keeps their face carefully neutral.`,
        `${p.contestant} clocks the pattern quietly and keeps it to themselves for now.`,
        `${p.contestant} goes about the rest of the day like getting skipped again didn't land, and it clearly did.`,
      ],
    };
    const escalated = [
      `${p.contestant} has stopped pretending it's a coincidence — this is the ${streak === 3 ? 'third' : `${streak}th`} ${W.round.toLowerCase()} running ${p.coach} has passed them over.`,
      `${p.contestant} is openly keeping count now: ${streak} straight ${W.round.toLowerCase()}s without a single session from ${p.coach}.`,
      `${p.contestant} brings up the streak unprompted to a tribemate — ${streak} ${W.round.toLowerCase()}s of being skipped is no longer nothing.`,
      `${p.contestant} has quietly decided ${p.coach}'s neglect is a pattern, not an accident, after ${streak} ${W.round.toLowerCase()}s of it.`,
    ];
    // Nobody at all called on them — a different, worse fact than one coach
    // choosing somebody else, so it gets its own words rather than two rows.
    const _names = _coaches.length === 2
      ? `${_coaches[0]} or ${_coaches[1]}`
      : _coaches.slice(0, -1).join(', ') + ` or ${_coaches[_coaches.length - 1]}`;
    const unanimousPool = [
      `Not one session, from anyone — ${p.contestant} got no call from ${_names}, and spends the day working out what that means.`,
      `Every coach on the tribe skipped ${p.contestant} tonight. ${p.contestant} noticed, and so did everyone watching who got picked instead.`,
      `${p.contestant} waits to be pulled aside by ${_names}. Neither comes. ${p.contestant} stops waiting.`,
      `${p.contestant} is the only one nobody wanted to train today, and there is no version of that ${p.contestant} can read as an accident.`,
    ];
    // A standing pattern outranks a single unanimous night — "this is not an
    // accident" is what turns neglect into a vote, and on a two-coach tribe
    // almost every skip is unanimous, so checking unanimous first buried the
    // escalation entirely. Worst case (a pattern AND nobody at all) gets its
    // own strongest wording rather than falling back to naming one coach.
    const unanimousStreak = [
      `${p.contestant} has been passed over by every coach on this tribe ${streak} ${W.round.toLowerCase()}s running now, and has stopped calling it bad luck.`,
      `${streak} ${W.round.toLowerCase()}s, ${_coaches.length} coaches, not one session. ${p.contestant} has done that arithmetic more than once.`,
      `${p.contestant} says it out loud to a tribemate: nobody has trained them in ${streak} ${W.round.toLowerCase()}s. Not ${_names}. Nobody.`,
      `Whatever ${_names} are building, ${p.contestant} is ${streak} ${W.round.toLowerCase()}s into knowing they are not part of it.`,
    ];
    const pool = streak >= 3 && unanimous ? unanimousStreak
      : streak >= 3 ? escalated
      : unanimous ? unanimousPool
      : (early[arche] || early.default);
    // Every coach who skipped them still pays the resentment, exactly as the
    // per-pair loop used to — grouping changed the narration, not the cost.
    for (const c of _coaches) addBond(c, p.contestant, -0.2 * Math.min(streak, 3));
    events.push({
      type: 'coachPassedOverNotices', players: [p.contestant, ..._coaches],
      badgeText: unanimous ? 'NOBODY CALLED ON THEM' : streak >= 3 ? 'PATTERN NOTICED' : 'LEFT OFF AGAIN',
      badgeClass: 'red',
      text: pick(pool),
    });
  }

  // Reset the streak for anyone who actually got a session this ep.
  for (const s of sessions) gs._coachPassStreak[s.contestant] = 0;

  // ── NEGATIVE: two protégés compare notes, and it turns sour ──
  if (trainedNames.length && passedOver.length && roll() < 0.5) {
    const trained = pick(trainedNames);
    const stillOut = passedOver.filter(p => p.contestant !== trained);
    const skipped = stillOut.length ? pick(stillOut).contestant : null;
    if (skipped) {
      addBond(trained, skipped, -0.3);
      const pool = [
        `${skipped} asks ${trained} what the session was like, and the answer only confirms who ${_coachOf(passedOver, skipped)} actually prioritizes.`,
        `${trained} tries to downplay getting a session in front of ${skipped}, which somehow makes it worse.`,
        `${skipped} watches ${trained} talk through the new drill and can't quite keep the resentment off their face.`,
        `${trained} and ${skipped} compare who got called on this ${W.round.toLowerCase()} and end the conversation further apart than they started it.`,
      ];
      events.push({
        type: 'coachCompareNotes', players: [trained, skipped],
        badgeText: 'COMPARING NOTES', badgeClass: 'red',
        text: pick(pool),
      });
    }
  }

  // ── NEGATIVE: a protégé caught between two coaches ──
  const _tribeName = tribe?.name ?? tribe?.tribeName;
  const tribeCoaches = _tribeName ? coachesOf(_tribeName) : [];
  if (tribeCoaches.length >= 2) {
    for (const s of sessions) {
      const other = tribeCoaches.find(c => c.name !== s.coach);
      if (!other) continue;
      const otherBond = getBond(other.name, s.contestant);
      if (otherBond < 2 || roll() >= 0.4) continue;
      addBond(s.contestant, other.name, -0.3);
      addBond(s.contestant, s.coach, 0.2);
      const pool = [
        `${s.contestant} gets pulled aside by ${other.name} right after training with ${s.coach}, and now has two coaches expecting loyalty.`,
        `${s.contestant} tries to keep both ${s.coach} and ${other.name} happy and manages neither.`,
        `${s.contestant} lets slip to ${other.name} what ${s.coach} just taught them, and immediately regrets it.`,
        `${s.contestant} is starting to feel poached — ${other.name} wants the same attention ${s.coach} just got.`,
      ];
      events.push({
        type: 'coachPoachedProtege', players: [s.contestant, s.coach, other.name],
        badgeText: 'CAUGHT BETWEEN COACHES', badgeClass: 'red',
        text: pick(pool),
      });
      break;
    }
  }

  // ── NEGATIVE: bad advice detonates in front of everybody ──
  for (const s of sessions) {
    const gain = Number(s.gain) || 0;
    if (gain >= 0 || roll() >= 0.6) continue;
    gs.popularity[s.contestant] = (gs.popularity[s.contestant] || 0) - 0.5;
    addBond(s.coach, s.contestant, -0.4);
    const pool = [
      `${s.contestant} tries out what ${s.coach} taught them at the worst possible moment and it falls apart in front of the whole tribe.`,
      `${s.contestant} follows ${s.coach}'s advice to the letter and it backfires so badly that other ${W.players} start openly questioning the coaching.`,
      `${s.contestant} publicly credits ${s.coach} for a ${s.stat} tip that turns out to be exactly wrong.`,
      `${s.contestant} eats the blame for a bad ${s.stat} call that was really ${s.coach}'s, and everyone at camp watches it happen.`,
    ];
    events.push({
      type: 'coachBadAdvice', players: [s.contestant, s.coach],
      badgeText: 'BAD ADVICE', badgeClass: 'red',
      text: pick(pool),
    });
  }

  // ── RARE: a coach hands a found advantage to a protégé in danger ──
  // `giveAdvantage` already enforces the cost (the save card), so this is
  // just the decision to make the trade — gated tight and archetype-driven,
  // per the project's rule that social decisions scale off stats rather than
  // a flat coin flip. Support archetypes give to protect a favourite; Control
  // archetypes give to arm a loyalist. Everyone else barely reaches for it.
  for (const c of (_tribeName ? coachesOf(_tribeName) : [])) {
    const record = coachRecord(c.name);
    if (!record || record.saveCard !== 'unused') continue;
    const held = (gs.advantages || []).find(a => a.holder === c.name && !a.givenBy);
    if (!held) continue;

    const cStats = pStats(c.name);
    const cArche = archetypeOf(c.name);
    const supportLean = ['hero', 'loyal-soldier', 'social-butterfly', 'showmancer'].includes(cArche) ? 1
      : ['mastermind', 'schemer', 'villain'].includes(cArche) ? 0.6 : 0.2;
    const chance = supportLean * (cStats.loyalty / 10) * 0.12;
    if (roll() >= chance) continue;

    // Who it goes to: a favourite (strong bond with the coach) who is the
    // most exposed to the rest of the tribe (weakest average standing with
    // everyone else) — the protégé actually in danger, not just the closest one.
    const favourites = members.filter(m => m !== c.name && getBond(c.name, m) >= 3);
    if (!favourites.length) continue;
    const riskOf = m => {
      const others = members.filter(o => o !== m && o !== c.name);
      if (!others.length) return 0;
      return -others.reduce((sum, o) => sum + getBond(m, o), 0) / others.length;
    };
    const protege = favourites.sort((a, b) => riskOf(b) - riskOf(a))[0];
    if (!giveAdvantage(c.name, protege, held)) continue;

    addBond(c.name, protege, 1.0);
    gs.popularity[protege] = (gs.popularity[protege] || 0) + 0.5;
    const label = held.type === 'idol' ? 'idol' : held.type === 'legacy' ? 'Legacy Advantage'
      : held.type === 'amulet' ? 'amulet' : held.type;
    const pool = [
      `${c.name} presses the ${label} into ${protege}'s hand before anyone else can see, and just like that, the save card is gone with it.`,
      `${c.name} decides ${protege} needs the ${label} more than a coach ever will and hands it over — no strings, no card left to play.`,
      `${c.name} makes the trade nobody saw coming: ${protege} walks away with the ${label}, and ${c.name} walks away with no protection left.`,
      `${c.name} gives up the one thing keeping a coach safe, all so ${protege} can carry the ${label} into the next vote.`,
    ];
    events.push({
      type: 'coachGivesAdvantage', players: [c.name, protege],
      badgeText: 'ADVANTAGE HANDED OVER', badgeClass: 'purple',
      text: pick(pool),
    });
  }

  return events;
}

/** Which coach passed over this contestant — used only inside coachFallout's compare-notes text. */
function _coachOf(passedOverList, name) {
  return passedOverList.find(p => p.contestant === name)?.coach || 'their coach';
}
