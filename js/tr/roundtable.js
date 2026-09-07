// ══════════════════════════════════════════════════════════════════════
// tr/roundtable.js — the debate, and the vote it produces
// ══════════════════════════════════════════════════════════════════════
//
// Two things here are not what the rest of the engine does.
//
// FIRST, an accusation is a BROADCAST. js/knowledge.js's propagate() models
// gossip: private hops between people who happen to talk, with most of the room
// never hearing it. A Round Table is the opposite — everyone hears everything,
// simultaneously, and the only variable is whether they believe it. That
// variable is trust in the ACCUSER, which is why the same true name lands when
// a liked player says it and dies when a distrusted one does.
//
// SECOND, we do not reuse simulateRevote(). Its shape is right — restrict the
// revote to the tied players, they do not vote — but it ranks compromise
// targets by Total Drama alliance and threat pressure, which is not why this
// room converges, and it calls Math.random(), which a season that must replay
// from a seed cannot afford.
import { gs } from '../core.js';
import { pStats, pronouns } from '../players.js';
import { getBond, addBond } from '../bonds.js';
import { resolveVotes } from '../voting.js';
import { learn, believes } from '../knowledge.js';
import { knowersOf } from './knowledge-flow.js';
import { alignmentAt } from './roles.js';
import { alignmentFactId, suspicionBoard, chooseBanishmentVote, recordRound, revealCascade,
  sceneDoubt } from './deduction.js';
import { exitSpeech } from './exit.js';
import { lineFor, _lineHash } from './castle/lines.js';
import { daggerWeights, daggerDrawnAt, DAGGER_VOTES } from './powers.js';

/**
 * One player names another in front of everybody.
 *
 * The claim is OFFERED to every listener in the room, but belief is filtered
 * per listener: each one runs their own read-skill check (inside learn), and
 * learn()'s accept gate goes negative below a credibility of 0.55 while a bare
 * accusation here only ever supplies ~0.3-0.45 — so roughly one in five actually
 * come to believe it, not the whole room at once. What scales the claim before
 * it gets there is the accuser: their `social` for how well it is put, and each
 * listener's own bond with them for whether it is worth hearing.
 */
export function broadcast(accuser, target, ep, rng = Math.random) {
  const room = (gs.activePlayers || []).filter(n => n !== accuser && n !== target);
  const pitch = 0.25 + (pStats(accuser).social || 5) / 20;   // 0.25 .. 0.75
  const heard = [];
  for (const listener of room) {
    const trust = 0.55 + Math.max(-0.35, Math.min(0.45, getBond(listener, accuser) / 22));
    const belief = learn(listener, alignmentFactId(target), {
      source: `${accuser} at the Round Table`,
      sourceType: 'rumor',
      confidence: Math.max(0.05, Math.min(0.6, pitch * trust)),
      ep, from: accuser, rng,
    });
    if (belief) heard.push(listener);
  }
  return heard;
}

// ══════════════════════════════════════════════════════════════════════
// CUTTING A BURNED FELLOW LOOSE
// ══════════════════════════════════════════════════════════════════════
//
// THE MOVE THE FORMAT RUNS ON AND THIS ENGINE COULD NOT MAKE. When the room
// has already convicted one Traitor, the others' best play is to help bury
// them: the name is leaving anyway, and being seen to drive out a Traitor is
// the cheapest cover in the game. Measured over 40 seasons before this
// existed: a banished Traitor had a mean of 3.38 public accusers on the night
// they went down, so the information was there, in public, every time -- and
// the number of times a fellow Traitor joined in was ZERO, because `debate()`
// filtered the pact out of a Traitor's pool outright.
//
// THAT FILTER WAS RIGHT AND IS KEPT. Reading a Traitor's board straight makes
// the faction stand up on night one and name each other, which is a
// confession rather than a debate -- their read on a fellow is a `public`
// turret belief and tops every board. So this is NOT a board read and does
// not touch the pool. The board still runs over non-pact names only, and the
// sacrifice is a SEPARATE, deliberate decision taken afterwards: the Traitor
// is not suspicious of their fellow, they are spending them.
//
// AND IT CANNOT FIRE ON NIGHT ONE, structurally rather than by a date check.
// `burn` is computed from the accusations made SO FAR TONIGHT, and `debate()`
// fills that list in speaking order -- so a Traitor can only join a pile-on
// that already exists. Nobody is burned before the room burns them.

/** How much of the room has publicly named `name` tonight, 0..1. */
function tableBurn(name, accusations, living) {
  const room = Math.max(1, (living || []).length - 1);
  let on = 0;
  for (const a of accusations) if (a.target === name) on++;
  return { on, share: on / room };
}
/** Below this nobody is burned enough to be worth spending. */
const SACRIFICE_MIN_ACCUSERS = 2;
const SACRIFICE_MIN_SHARE = 0.15;

/**
 * The fellow this Traitor could most plausibly throw to the room, or null.
 *
 * PUBLIC INFORMATION ONLY on the burn side -- who has been named out loud at
 * this table tonight. The pact membership is of course private, but a Traitor
 * knowing who their fellows are is the one thing they are allowed to know.
 */
function burnedFellow(speaker, ep, accusations, living) {
  let best = null;
  for (const n of living) {
    if (n === speaker || alignmentAt(n, ep) !== 'traitor') continue;
    const b = tableBurn(n, accusations, living);
    if (b.on < SACRIFICE_MIN_ACCUSERS || b.share < SACRIFICE_MIN_SHARE) continue;
    if (!best || b.share > best.share) best = { name: n, ...b };
  }
  return best;
}

/** Who speaks, and about whom. The loudest reads in the room get aired. */
function debate(ep, rng) {
  const living = gs.activePlayers || [];
  const accusations = [];
  for (const speaker of living) {
    // A Traitor's suspicion board is topped by the people they were TOLD about
    // in the turret, at a certainty no Faithful can ever reach. Reading it
    // straight makes the faction stand up on night one and name each other in
    // front of the room, which is not a debate, it is a confession. They speak
    // about the same pool they are willing to write down: everyone but the pact.
    const pool = alignmentAt(speaker, ep) === 'traitor'
      ? living.filter(n => alignmentAt(n, ep) !== 'traitor')
      : living;
    const board = suspicionBoard(speaker, ep, pool.length ? pool : living);
    const top = board[0];
    // Somebody with no read at all keeps quiet rather than inventing one.
    // Boldness decides who speaks anyway.
    const willSpeak = (top?.score || 0) > 0.12 || rng() < (pStats(speaker).boldness || 5) / 45;
    if (!willSpeak || !top) continue;
    // ── AND THEN THE OTHER DECISION, taken after the read and never by it.
    //
    // A draw is taken for EVERY Traitor who speaks, whether or not a burned
    // fellow exists, so the rng stream does not depend on the pact's exposure
    // -- a season where nobody is burned consumes the same numbers as one
    // where somebody is, and the two stay comparable.
    let target = top.name;
    let sacrifice = false;
    if (alignmentAt(speaker, ep) === 'traitor') {
      // THE DRAW IS TAKEN EVEN WHERE THE MOVE CANNOT BE MADE, so the endgame
      // consumes the same stream as it did before this feature existed.
      const roll = rng();
      // AND IT CANNOT BE MADE IN THE ENDGAME, which is a design point rather
      // than a tuning one. The entire payoff is `priceTheAccusers` crediting
      // somebody who named a player the reveal then confirms as a Traitor --
      // and the endgame has NO REVEAL (spec §8; `runRoundTable` is called with
      // `reveal: false` and the pricing is gated on it). There is no cover to
      // buy at a table where nobody is ever told who was right, so a Traitor
      // throwing a fellow there is pure loss.
      //
      // It also fired far too easily once the room was small: `burnedFellow`
      // wants two accusers and a 15% share, and in a room of four that is the
      // same two people. Six endgame liveness floors dropped ~28% before this
      // gate went in, which is how it was found.
      const inEndgame = gs.tr?.endgameFrom != null && ep >= gs.tr.endgameFrom;
      const doomed = inEndgame ? null : burnedFellow(speaker, ep, accusations, living);
      if (doomed) {
        // Nerve and calculation both. A bold strategist spends a doomed ally;
        // a loyal one goes down with them. Scaled by HOW burned they are, so
        // the move gets easier the more certain the outcome already is.
        const st = pStats(speaker);
        const appetite = ((st.strategic || 5) / 10) * 0.6 + ((st.boldness || 5) / 10) * 0.4;
        const chance = appetite * Math.min(1, doomed.share / 0.35)
          * (1 - (st.loyalty || 5) / 20);
        if (roll < chance) { target = doomed.name; sacrifice = true; }
      }
    }
    accusations.push({ accuser: speaker, target, ...(sacrifice ? { sacrifice: true } : {}) });
  }
  for (const a of accusations) broadcast(a.accuser, a.target, ep, rng);
  return accusations;
}

// ══════════════════════════════════════════════════════════════════════
// CLASHES — the table is an argument, and it was a list
// ══════════════════════════════════════════════════════════════════════
//
// WHAT `debate()` ABOVE PRODUCES, and what it does not. Every living player
// contributes at most ONE accusation — their own top read, pointed at a name —
// and that is the entire debate record. Measured across 40 played seasons the
// castle's `confrontation` family runs at 9.6 scenes a season against
// suspicion's 66.8, and every one of those 9.6 happens somewhere ELSE: in a
// kitchen, on a road, in a corridor. The one hour of the format whose entire
// purpose is people accusing each other to their faces produced no
// confrontation at all — a list of names with defences attached, and no two
// of them ever touching.
//
// A CLASH IS TWO SEATED PLAYERS GOING AT EACH OTHER IN THE OPEN, and it is
// generated from what the season already holds rather than from a die:
//
//   counter        {b} is accused and names {a} straight back. The commonest
//                  and the one the format actually runs on.
//   old-grievance  a confrontation or suspicion thread these two have been
//                  carrying all week, brought to the table where it costs
//                  something. THIS is the wire the castle needed: an argument
//                  that started in a corridor on day three finishes here.
//   broken-word    {a} holds {b} to a trust story the record shows {b} broke.
//                  Gated on the thread's OUTCOME, not on a mood.
//   ganged-up      two or more accusers landed on the same target and the
//                  target says so out loud.
//   defended       {a} takes {b}'s side against the room, at a cost.
//
// EVERY CLASH HAS CONSEQUENCES, like every castle event: the bond moves, and
// where a thread already exists it is advanced rather than duplicated. A
// clash that changed nothing would be the decorative-event class the whole
// castle layer is written against.
//
// AND THEY ARE PUBLIC BY CONSTRUCTION. A clash reads accusations (said out
// loud at this table), bonds, and thread KINDS and OUTCOMES — never an
// alignment, never a belief's certainty. Nothing here can leak what a Faithful
// could not have watched happen.

// TEST-ONLY SEAM, and the reason it exists rather than a comment claiming an
// effect. Clashes are generated FROM suspicion threads and tonight's
// accusations, so the two people in one were ALREADY likely to write each
// other down: a raw "59.8% of clashers voted for the person they clashed
// with" is a correlation with a shared cause, not a measured influence. This
// runs the identical season with the vote-intent term removed and nothing
// else changed, so the two numbers can be subtracted.
let _noClashIntents = false;
export function _setClashIntents(on) {
  const prev = !_noClashIntents;
  _noClashIntents = !on;
  return () => { _noClashIntents = !prev; };
}

/** Live threads between two seated players, by kind. */
function _threadBetween(kind, a, b) {
  return (gs.tr?.threads || []).find(t => t.kind === kind
    && (t.parties || []).length === 2
    && t.parties.includes(a) && t.parties.includes(b));
}

const CLASH_LINES = {
  counter: [
    '{b} does not answer it. {b} asks {a}, in front of everybody, why {a} is so certain.',
    '“Before I answer that,” says {b} to {a}, “tell the table where you were.”',
    '{a} names {b} and {b} names {a} back inside ten seconds, and the room has two problems now.',
    '{b} turns it straight round: the same accusation, the same words, pointed at {a}.',
    '{b} says the interesting question is not about {b} at all, and then asks it about {a}.',
    'It stops being an accusation and becomes a fight, and the room lets it run.',
    '{b} answers {a} with a question and {a} does not have the answer ready.',
    '“You have been building to this all week,” {b} tells {a}. “Say the rest of it.”',
  ],
  // AGE-BANDED, because these assert how long something has been running and
  // the event now knows. `{d}` is the thread's real opening episode and is
  // safe in every band; the bands exist for the lines that say a duration in
  // words. See the note on `clashes` for the measurement.
  'old-grievance': [
    '{a} and {b} have been going back and forth since day {d}, and {a} brings it to the table.',
    '{a} lays out the whole argument against {b} and {b} has to sit through the list.',
    'Whatever happened between {a} and {b} on day {d} is now the room\u2019s business.',
    '{a} and {b} have been at this longer than some of the people watching.',
    '{a} has been holding back about {b} since day {d} and picks tonight to say it.',
    '\u201cWe have done this,\u201d says {b}. \u201cWe have never done it in front of them,\u201d says {a}.',
    '{a} does not raise anything new about {b}. {a} raises all of it at once.',
    '{a} and {b} have been circling each other since day {d} and stop circling tonight.',
  ],
  // ONE NIGHT OLD. Whatever this is, it started yesterday, and a card calling
  // that ancient is the defect this band exists to prevent.
  'grievance-fresh': [
    '{a} and {b} had this out yesterday and are having it again tonight, louder.',
    'The argument between {a} and {b} is one day old and has already reached the table.',
    'Whatever happened between {a} and {b} yesterday did not stay between them.',
    '{a} slept on the argument with {b}, decided not to let it go, and said so in front of everybody.',
    'Yesterday the disagreement between {a} and {b} was private. Tonight it is evidence.',
    '{b} clearly hoped {a} would drop it. {a} did not drop it.',
    'The row between {a} and {b} has had exactly one night to cool down and did not use it.',
    '{a} and {b} were arguing about this on the stairs last night. Now the room has it.',
  ],
  // FIVE EPISODES OR MORE, which is where a week is a fair thing to call it.
  'grievance-old': [
    'The room is watching two people finish something that started a week ago.',
    '{a} and {b} have been at this since day {d} and it has picked up weight every day since.',
    '{a} and {b} have been going at each other for most of the season and the room is tired of it.',
    '{a} and {b} started arguing on day {d} and it is still the thing between them.',
    'Half the castle has left since {a} first accused {b} and the argument is somehow still going.',
    'There is nothing new between {a} and {b}. There has not been anything new since day {d}.',
    '{a} has had a problem with {b} since day {d}, which is longer than some of them lasted.',
    'It is the oldest live argument in the building and tonight it costs somebody a vote.',
  ],

  'broken-word': [
    '{a} reminds {b} what {b} swore, and the room hears the sentence for the first time.',
    '“You gave me your word,” {a} says to {b}, and the table goes very quiet.',
    '{a} quotes a promise back at {b} in front of everybody, exactly.',
    'Whatever {b} said to {a} in private is public now, and it does not sound good out loud.',
    '{a} makes {b} account for it at the table rather than in a corridor, which is the point.',
    '{b} broke something with {a} this week and {a} has chosen the worst possible moment for it.',
    'The room did not know those two had a deal. It knows now, and it knows it broke.',
    '{a} says the words {b} used. {b} does not deny using them.',
  ],
  'ganged-up': [
    '{b} points out that three people have said the same name in ten minutes and asks who arranged that.',
    '“You have all decided,” says {b}. Nobody at that table says no.',
    '{b} counts the accusers on one hand — three people, the same name, the same night — and asks who talked first.',
    '{b} stops defending and counts how many people accused {b}, out loud, and the number speaks for itself.',
    '{b} says the accusation arrived ready-made and asks who put it together.',
    '{b} asks when they all talked, and two of them look at each other.',
    '{b} asks how many people it takes before a coordinated vote stops looking like an opinion.',
    '{b} would rather lose the vote than pretend that was a coincidence.',
  ],
  defended: [
    '{a} cuts across the room to say the case against {b} is nonsense, and wears the consequences.',
    'Nobody expected {a} to speak up for {b}, and {a} did, at length.',
    '{a} puts {a}’s own standing behind {b} at the table, in public, with a vote coming.',
    '“If you are writing that name,” {a} tells the room, “you are wrong, and I will say so after.”',
    '{a} defends {b} well enough that two people stop nodding.',
    'It costs {a} something to defend {b} here and {a} does it anyway.',
    '{a} spoke up for {b} and is now attached to {b} in the room’s head.',
    '{a} defends {b} and two of them turn to look at {a} instead.',
  ],
};

/**
 * THE ARGUMENTS THIS TABLE HAS. Reads the accusation list the debate just
 * produced, plus the season's stored threads and bonds, and returns the
 * exchanges worth showing — with their consequences already applied.
 *
 * Capped at four: a table where everybody rows with everybody is a brawl
 * rather than a Round Table, and the format's tension is that most of it is
 * polite.
 */
function clashes(ep, rng, accusations) {
  const living = gs.activePlayers || [];
  const out = [];
  const used = new Set();
  const pairKey = (a, b) => [a, b].sort().join('|');

  // Who was named, and by whom.
  const namedBy = new Map();
  for (const a of accusations) {
    if (!namedBy.has(a.target)) namedBy.set(a.target, []);
    namedBy.get(a.target).push(a.accuser);
  }

  // WHAT THE ARGUMENT IS ACTUALLY ABOUT. A thread stores the sentence that
  // opened it; quoting that is the difference between "this started days ago"
  // and telling the viewer what started. Trimmed rather than paraphrased —
  // the words are the ones the castle screen already printed on the day.
  const openingOf = (threadId) => {
    const t = (gs.tr?.threads || []).find(x => x.id === threadId);
    const first = (t?.beats || [])[0];
    const note = String(first?.note || '').trim();
    return note && note.length <= 190 ? note : null;
  };

  const push = (kind, a, b, extra = {}) => {
    const k = pairKey(a, b);
    if (used.has(k) || out.length >= 4) return false;
    used.add(k);
    const seed = `clash|${kind}|${ep}|${a}|${b}`;
    const line = lineFor(CLASH_LINES[kind], seed, { a, b })
      .replace(/\{d\}/g, String(extra.day ?? ep));
    out.push({ kind, a, b, line, since: openingOf(extra.threadId), ...extra });
    return true;
  };

  // ── 1. OLD GRIEVANCE. The wire the castle needed: a confrontation the two
  //    of them have been having all week, brought to the one room where it
  //    changes a vote. Highest priority because it is the only kind that pays
  //    off work the season has already done.
  for (const t of (gs.tr?.threads || [])) {
    if (out.length >= 4) break;
    if (t.state !== 'open') continue;
    if (t.kind !== 'confrontation' && t.kind !== 'suspicion') continue;
    const [x, y] = t.parties || [];
    if (!x || !y || !living.includes(x) || !living.includes(y)) continue;
    // AT MOST TWO PER TABLE. Measured without this cap: 3.78 clashes a table
    // of which 2.76 were this kind, because it is checked first and fills the
    // cap of four. A table whose arguments are three-quarters the same SHAPE
    // reads as one argument repeated, which is the variety failure the castle
    // pools are all written against.
    if (out.filter(c => String(c.kind).startsWith('grievance')
      || c.kind === 'old-grievance').length >= 2) break;
    // AND IT HAS TO ACTUALLY BE OLD. A thread opened TONIGHT is not a
    // grievance, it is the argument currently happening, and 10.5% of these
    // were exactly that before this line existed — "this started days ago"
    // printed over a row from that morning. The band below then decides which
    // pool may speak, so no card claims a duration the record does not hold.
    const day = t.openedEp || ep;
    const age = ep - day;
    if (age < 1) continue;
    const kind = age >= 5 ? 'grievance-old' : age === 1 ? 'grievance-fresh' : 'old-grievance';
    // It only reaches the table if it is actually hot, or one of them has
    // just been named by the other.
    const named = (namedBy.get(y) || []).includes(x) || (namedBy.get(x) || []).includes(y);
    if (!named && rng() > 0.35) continue;
    push(kind, x, y, { day, age, threadId: t.id });
  }

  // ── 2. BROKEN WORD, off the OUTCOME the record already carries.
  for (const t of (gs.tr?.threads || [])) {
    if (out.length >= 4) break;
    if (t.kind !== 'trust') continue;
    if (t.outcome !== 'turned-back' && t.outcome !== 'exposed') continue;
    const [x, y] = t.parties || [];
    if (!x || !y || !living.includes(x) || !living.includes(y)) continue;
    push('broken-word', x, y, { threadId: t.id });
  }

  // ── 3. GANGED UP. Three or more names on one person, said out loud.
  for (const [target, accusers] of namedBy) {
    if (out.length >= 4) break;
    if (accusers.length < 3 || !living.includes(target)) continue;
    push('ganged-up', accusers[0], target, { accusers: [...accusers] });
  }

  // ── 4. COUNTER. The commonest exchange in the format: {b} is accused and
  //    names {a} straight back. Boldness decides who does it.
  for (const a of accusations) {
    if (out.length >= 4) break;
    if (!living.includes(a.target)) continue;
    const nerve = (pStats(a.target).boldness || 5) / 10;
    if (rng() > nerve * 0.55) continue;
    push('counter', a.accuser, a.target);
  }

  // ── 5. DEFENDED. Somebody takes a side against the room, at a cost.
  for (const [target, accusers] of namedBy) {
    if (out.length >= 4) break;
    if (!living.includes(target)) continue;
    const friend = living.find(n => n !== target && !accusers.includes(n)
      && getBond(n, target) >= 3);
    if (!friend) continue;
    push('defended', friend, target);
  }

  // ── THE CONSEQUENCES ─────────────────────────────────────────────────
  //
  // A clash moves three things, and until this was written it moved one and a
  // half. The bond and the thread's heat carry into TOMORROW; the vote intent
  // is what makes the argument matter TONIGHT, at the table it happened at.
  // `chooseBanishmentVote` reads intents as one term beside suspicion and
  // noise, so a row can move a ballot and can never own one — a player with a
  // strong read still writes the name they came in with, which is what makes
  // a clash that fails to change anybody's mind a real outcome rather than an
  // impossible one.
  for (const c of out) {
    const delta = c.kind === 'defended' ? 2
      : c.kind === 'broken-word' ? -2.5
        : c.kind === 'ganged-up' ? -1.5 : -2;   // all three grievance bands: -2
    addBond(c.a, c.b, delta);
    c.bondDelta = delta;
    // A grievance aired in the open is the same story continuing, so it
    // advances the thread it came from rather than starting a rival one.
    if (c.threadId) {
      const t = (gs.tr?.threads || []).find(x => x.id === c.threadId);
      // ONLY WHILE IT IS STILL OPEN. `broken-word` deliberately selects a
      // thread that has ALREADY RESOLVED (that is its whole gate), and moving
      // a resolved thread's `lastEp` forward rewrites when it closed — which
      // is the timeline three unrelated events read to decide whether they
      // may recap an outcome. tr-castle-reachability's prior-outcome rule
      // caught it as 36 firings "recapping something that has not happened",
      // named on events that had nothing to do with this change.
      if (t && t.state === 'open') {
        t.lastEp = ep; t.heat = Math.min(10, (t.heat || 0) + 2);
      }
    }
    // AND THE BALLOT. Being publicly gone at by somebody makes you likelier to
    // write their name, and `defended` runs the other way: {a} has just tied
    // themselves to {b} in front of the room, so {a} is likelier to write
    // whoever the room is pushing at {b} — modelled as {a} NOT writing {b},
    // which is the honest half of that we can state without inventing a
    // third name.
    if (_noClashIntents) continue;
    const intents = (gs.tr.voteIntents ||= []);
    const setIntent = (voter, target, strength) => {
      const prev = intents.find(x => x.voter === voter && x.ep === ep);
      const rec = { voter, target, strength, ep, sceneId: `clash:${c.kind}`,
        source: `${voter} and ${target} went at each other at the table` };
      if (prev) { if ((prev.strength || 0) < strength) Object.assign(prev, rec); }
      else intents.push(rec);
    };
    if (c.kind === 'defended') {
      // No name to point at, so no intent: the consequence of defending is
      // the bond and the room's attention, both already applied.
    } else if (c.kind === 'ganged-up') {
      // The target now has a specific reason to write the loudest accuser.
      setIntent(c.b, c.a, 0.45);
    } else {
      setIntent(c.a, c.b, 0.4);
      setIntent(c.b, c.a, 0.4);
    }
  }
  return out;
}

// ══════════════════════════════════════════════════════════════════════
// SPEECHES — a claim, the evidence behind it, and who it moved
// ══════════════════════════════════════════════════════════════════════
//
// The debate above produces ACCUSATIONS — a name pointed at a name. A SPEECH
// is the same act with its provenance attached: what the speaker actually
// knows that makes the claim sayable, and which listeners the claim moved.
//
// THE OBSERVER-SAFETY LOAD IS HERE. A speech's `sources` are derived from the
// speaker's OWN stored belief about the target, so by construction a speaker
// can only cite a record they hold — a Faithful cannot cite Traitor-only
// knowledge because a Faithful never holds a Traitor-only belief. Two rules
// are applied on top, both of which make a mutant bite:
//
//   1. A `public`-tier alignment belief is NEVER a table source. `public` is
//      the closed set of things a player KNOWS rather than suspects — the
//      turret seeding, the banishment reveal, a recruit shown the turret. None
//      of those is a fresh accusation; airing one would put certain-alignment
//      knowledge into the debate record, which is the exact leak spec §8 and
//      the deduction ceiling exist to prevent. The debate never routes a
//      Traitor to accuse a fellow, so a turret source cannot reach here on the
//      live path — but the filter is what proves that, not the routing.
//   2. A belief the speaker has themselves marked FALSE (the intuition prior
//      that clears an innocent) or that has gone STALE is not a source: the
//      speaker no longer believes it, so citing it would be putting words in
//      their mouth.
//
// A speaker with no knowable, non-public, live suspicion of their top read
// gets NO speech — the show would rather say nothing than invent a reason. So
// `speeches` is a subset of `accusations`, never larger.

/**
 * Does `speaker` actually hold `source` as of `ep`? True when they carry the
 * belief the source is drawn from, or are a recorded knower of its fact.
 *
 * EXPORTED because it is the test's gate on every speech (spec: a Faithful may
 * never cite Traitor-only information) and the one function that answers "may
 * this speaker say this" without the caller reaching into the belief store.
 */
export function knows(speaker, source, ep) {
  if (!speaker || !source || !source.factId) return false;
  if (believes(speaker, source.factId, ep)) return true;
  return knowersOf(source.factId, ep).includes(speaker);
}

// A belief whose only provenance is another player's accusation at the table
// is not a REASON the speaker can cite — it is "somebody else said so". The
// broadcast writes its source as `${accuser} at the Round Table` (see
// `broadcast` above), so a speech built on one would cite the rumour rather
// than any evidence. A speaker with nothing but this gets no speech; the room
// suspecting a name it cannot justify is a real thing the format does, and it
// belongs in the bare-accusation path, not dressed up as a cited claim.
const _BROADCAST_SOURCE = / at the Round Table$/;

// ══════════════════════════════════════════════════════════════════════
// A REASON CAN STOP BEING ONE
// ══════════════════════════════════════════════════════════════════════
//
// `ballotEvidence` mints "never once voted against X" for a pair who shared
// many rounds and never named each other — the PAIR SILENCE signal, on the
// theory that two Traitors protect each other. It is 29.3% of everything the
// debate cites, the second most common reason in the game.
//
// Its whole inferential force is "you are covering for somebody who might be a
// Traitor". So the night X is revealed, that force resolves — in one of two
// directions, and the engine noticed neither:
//
//   X WAS A FAITHFUL   the premise is dead. Not weaker: DEAD. Never having
//                      voted for a Faithful is what a Faithful does, and it is
//                      also what everybody does — one ballot a night across a
//                      room of fifteen. Measured 49 times over 60 seasons,
//                      stated with a straight face as though it still meant
//                      something.
//   X WAS A TRAITOR    the premise is PROVEN, and the line is the best one
//                      available at any table in this format: you never once
//                      voted for a man we now know was a Traitor. Measured 56
//                      times, delivered as boilerplate.
//
// FIXED AT CITATION TIME, NOT AT MINT TIME, because at mint time nobody knows.
// The reveal is public, so this reads exactly what everybody at the table
// watched happen and nothing else — and `speechesFrom` writes no belief and
// takes no draw, so this changes what is SAID and never what is decided. What
// the belief is WORTH is a separate question, noted below.
const _PAIR_SILENCE = /^never once voted against (.+)$/;

/** What the room publicly knows about a banished player, or null. */
function _revealedAs(name) {
  for (const r of (gs.tr?.rounds || [])) {
    if (r.banished === name) return r.banishedWasTraitor ? 'traitor' : 'faithful';
  }
  return null;
}

/**
 * Drop a clue whose premise the season has since killed, and sharpen one it
 * has proved. Returns null to refuse the clue entirely.
 */
function _resolveClue(text) {
  const m = _PAIR_SILENCE.exec(text || '');
  if (!m) return text;
  const verdict = _revealedAs(m[1]);
  if (verdict === 'faithful') return null;
  if (verdict === 'traitor') {
    return `never once voted against ${m[1]}, and ${m[1]} was a Traitor`;
  }
  return text;
}


/**
 * WHY `speaker` IS NAMING `target`, in the speaker's own terms.
 *
 * This used to return an array and an EMPTY array meant "no speech" -- the
 * accusation was dropped on the floor and the screen printed the name with
 * nothing under it. Measured across 40 seasons that happened to 381 of 1409
 * accusations, 27%: better than a quarter of the debate was somebody standing
 * up, saying a name, and offering the room no reason of any kind.
 *
 * The fix is NOT to invent evidence. A speaker who cannot cite a record still
 * has a reason -- it is just a worse one, and saying which worse one it is is
 * both honest and better television than silence. So every accusation now
 * comes back with a `kind`, and only one of the five carries sources:
 *
 *   cited      a record the speaker holds and may say out loud
 *   hearsay    the only thing under it is another player's accusation at this
 *              same table. `from` is who said it first. THIS IS THE ROOM'S
 *              ECHO and the format runs on it -- printing it as a bare name
 *              hid the single most interesting thing about the claim.
 *   public     a fact the whole room already has, so it is nobody's read and
 *              persuades nobody
 *   gone-cold  they held something and it has gone false or stale under them
 *   feeling    no belief at all: a bond, a manner, a week of small things
 *
 * Unchanged: what may be CITED. `public` and `hearsay` are still barred from
 * the citation path for exactly the reasons they always were -- a turret-tier
 * fact is not a personal read, and "somebody else said so" is a rumour rather
 * than evidence. They are now NAMED instead of silently dropped.
 */
function _reasonFor(speaker, target, ep) {
  // ── WHY THIS READS THE CLUE LIST AND NOT JUST `source` ──────────────
  //
  // `learn` overwrites `belief.source` with whichever clue was STRONGEST, so a
  // read built out of a whole season of small things could only ever be quoted
  // as one of them. Measured: 1769 citations across 40 seasons came in 18
  // shapes and 1378 of them were the SAME TWO ballot phrases, because the
  // ballot record is the loudest thing the model has and nothing else ever
  // won the slot. A new channel added the same week ("campaigned to get X
  // out, and X was a Faithful") reached the screen 5 times in 1769 -- 0.3% --
  // not because it was rare but because it was quiet.
  //
  // `knowledge.js` already keeps the fix and says so in its own comment:
  // `_recordClue` holds the strongest few DISTINCT reasons per belief,
  // explicitly so a screen can say "the wrong bell count, AND the
  // contradiction later, AND defending a revealed Traitor -- a reasoned case
  // rather than one fact". Nothing in this engine had ever read it.
  //
  // DISPLAY ONLY, and that is what makes it safe: `speechesFrom` takes no rng
  // draw and writes no belief (a season is bit-identical with or without it),
  // so quoting a quieter clue changes what the card SAYS and never what the
  // room DOES. The decision still runs off the belief's confidence alone.
  //
  // THE SAME GATE APPLIES TO EVERY CLUE, not just to the winning one. A clue
  // whose provenance is somebody's accusation at the table is hearsay however
  // it got into the list, so `_BROADCAST_SOURCE` filters the whole list rather
  // than just `b.source` -- otherwise this would launder exactly the thing the
  // citation path exists to refuse.
  const cite = (b) => {
    const seen = new Set();
    const out = [];
    for (const c of [{ source: b.source, sourceType: b.sourceType },
      ...(Array.isArray(b.clues) ? b.clues : [])]) {
      const raw = c && c.source;
      if (typeof raw !== 'string' || !raw.trim()) continue;
      if (_BROADCAST_SOURCE.test(raw)) continue;
      // A reason whose premise the season has since killed is not sayable, and
      // one it has proved should say so. See `_resolveClue`.
      const text = _resolveClue(raw);
      if (!text || seen.has(text)) continue;
      seen.add(text);
      out.push({ factId: alignmentFactId(target), subject: target,
        kind: c.sourceType || b.sourceType, text });
      if (out.length >= 3) break;
    }
    return out.length ? out
      : [{ factId: alignmentFactId(target), subject: target, kind: b.sourceType,
        text: 'a read they could not fully place' }];
  };
  const b = believes(speaker, alignmentFactId(target), ep);
  if (!b) return { kind: 'feeling', sources: [] };
  if (b.valence === 'false' || b.valence === 'stale') return { kind: 'gone-cold', sources: [] };
  if (b.sourceType === 'public') return { kind: 'public', sources: [] };
  if ((b.effectiveConfidence || 0) <= 0) return { kind: 'feeling', sources: [] };
  if (typeof b.source === 'string' && _BROADCAST_SOURCE.test(b.source)) {
    // `broadcast` writes the source as `${accuser} at the Round Table`, so the
    // name in front of that suffix is who the room caught it from.
    const from = String(b.source).replace(_BROADCAST_SOURCE, '').trim();
    return { kind: 'hearsay', sources: [], from: from || null };
  }
  return { kind: 'cited', sources: cite(b) };
}

/**
 * Turn the round's accusations into speeches, dropping any the speaker cannot
 * back with a record they hold. Reads only — the debate already broadcast, so
 * this takes no rng draw and writes no belief; a season is bit-identical with
 * or without it being called.
 *
 * `swayed` is every listener whose belief about the target now carries this
 * speaker as its source — the broadcast reached them and they accepted it.
 * `mindChanges` narrows that to the listeners the speech moved to the TOP of
 * their board: people who would now write this name, and did so because of
 * something that was said, not because the writer needed a flip.
 */
export function speechesFrom(accusations, ep) {
  const living = gs.activePlayers || [];
  const speeches = [];
  for (const a of accusations) {
    // EVERY accusation gets a record now, cited or not -- see `_reasonFor`.
    // `sources` stays an array and stays empty on the four uncitable kinds, so
    // every existing reader of `speech.sources` behaves exactly as before and
    // only a reader that asks for `reasonKind` sees the difference.
    const reason = _reasonFor(a.accuser, a.target, ep);
    const sources = reason.sources;
    const room = living.filter(n => n !== a.accuser && n !== a.target);
    const swayed = room.filter(l => {
      const lb = believes(l, alignmentFactId(a.target), ep);
      return lb && typeof lb.source === 'string' && lb.source.indexOf(a.accuser) >= 0
        && lb.valence !== 'false' && (lb.effectiveConfidence || 0) > 0;
    });
    const mindChanges = swayed.filter(l => {
      const board = suspicionBoard(l, ep, living);
      return board[0] && board[0].name === a.target && board[0].score > 0;
    });
    speeches.push({ speaker: a.accuser, target: a.target, sources, swayed, mindChanges,
      reasonKind: reason.kind, hearsayFrom: reason.from || null });
  }
  return speeches;
}

/**
 * Count the ballots. One name each, and one of them may be worth two.
 *
 * THE DAGGER LIVES HERE AND NOWHERE ELSE, and the reason is the single most
 * load-bearing fact about this file. A ballot is a PUBLIC fact — it is read
 * out loud at the table, `ballotEvidence` and `shieldEvidence` both read the
 * array below, and they are the only `public`-credibility facts the deduction
 * model has. Doubling a vote by pushing a second ballot would put a name into
 * that record that nobody said, and every belief formed downstream of it would
 * be reasoning about a sentence the room never heard.
 *
 * So the ballots are untouched — one voter, one name, said once — and the
 * WEIGHT is applied while counting. `weights` is a plain `{ voter: n }` map and
 * is absent on every table that has no Dagger drawn at it, which is nearly all
 * of them; `|| 1` is the whole of the default and the shape is deliberately
 * open so the endgame can hand it something else without touching this.
 */
function tally(ballots, weights) {
  const t = {};
  for (const b of ballots) if (b.voted) t[b.voted] = (t[b.voted] || 0) + (weights?.[b.voter] || 1);
  return t;
}

// WHAT A TRAITOR NAMING A TRAITOR SOUNDS LIKE, and why this pool exists at all.
//
// Plan 6 Task 6 made the pact a price rather than a bar, so a Traitor CAN write
// a fellow's name down — and the season then said nothing about it. No event, no
// thread beat, no exit line: the single most dramatic thing the format does
// produced not one sentence anywhere. Task 7 is where the format's betrayals
// mostly happen, so it is where the silence gets closed.
//
// Two rules bind these lines. They are chosen by `lineFor` and take NO rng draw,
// so adding to the pool cannot reroute a season (see tr/castle/lines.js). And
// every one of them may only assert what the record itself guarantees: that
// `voter` and `target` were both in the pact on this night and that the voter
// wrote the other's name down. Nothing here may claim the vote landed, that the
// room noticed, or that anybody was cleared — Task 3 measured that this
// knowledge model cannot exonerate anyone, so a betrayal's fallout is shock and
// suspicion and never innocence.
//
// THE FIRST LINE USED TO NAME NOBODY BUT THE BETRAYER, TWICE OVER: "{voter}
// writes down the name of somebody {voter} shared the turret with." It was the
// most-fired template in the pool (89 occurrences in a 1,200-season sweep), it
// repeated the actor, and it never once said WHO — which is the only dramatic
// content a betrayal line has. `pronouns()` carries the repetition now and the
// target is on the slate where it belongs.
const BETRAYAL_LINES = [
  '{voter} writes down the name of somebody {sub} shared the turret with: {target}.',
  'The pact is worth less to {voter} tonight than what is left on the table: {target}, in {posAdj} own hand.',
  '{voter} names {target} — and only the two of them know what that ballot really is.',
  // "Whatever the two of them swore upstairs" was the first draft of this line
  // and it was caught by dumping seasons and reading them: with the actor moved
  // out of the opening clause there is nothing for "the two of them" to refer
  // BACK to, and the sentence opens on a pronoun with no antecedent. The
  // passive keeps both names to one mention each and points at nobody until
  // the clause that names them.
  'Whatever was sworn upstairs, {voter} has just put {target} on a slate.',
];

/**
 * Every ballot at this table that one Traitor cast against another.
 *
 * A RECORD, not a mechanism: nothing in the engine reads it, exactly like
 * `banishedWasTraitor` and `aliveAtVote`. It reads ground truth because it is a
 * record of what happened rather than of what anybody believed, and it is the
 * only place the season can say a betrayal occurred at all.
 *
 * IT TAKES THE WHOLE TABLE, NOT THE FIRST ROUND OF IT (whole-plan review, F4).
 * This used to be handed `ballots` alone and to filter on
 * `channel === 'banishment'`, so a Traitor who named a fellow in the REVOTE was
 * recorded nowhere and narrated nothing — and Task 6 deliberately made a fellow
 * eligible to be among the tied, which is what puts them on a revote slate in
 * the first place. Measured at 1,200 seasons: 438 such ballots, 27.5% of every
 * betrayal the format produces, silent. The channel filter that hid them was
 * itself the awareness: `banishment-revote` is a different string, and nothing
 * ever came back to it.
 *
 * ONE RECORD PER PAIR PER TABLE. A voter who names the same fellow in the first
 * round and again in the revote has not betrayed them twice; they have been
 * held to it. Two records would print two sentences about one act, which is the
 * repetition defect F5 is about. `channel` says where it was first cast, so a
 * reader can still tell a revote-only turn from one that opened the evening.
 *
 * EXPORTED FOR ONE REASON: a turn cast ONLY in a revote happens 41 times in
 * 1,200 seasons (3.4% of all turns), so a guard that waits for one to come
 * round in a sampled population is the unfalsifiable-by-rarity shape Task 4's
 * mutation survived. tests/tr-endgame.test.js builds the table instead and
 * calls this directly. Nothing in the show may call it but `runRoundTable`.
 */
export function betrayals(round, ep) {
  const turns = [];
  const seen = new Set();
  const everyBallot = [
    ...(round.ballots || []),
    ...(round.revotes || []).flatMap(rv => rv.ballots || []),
  ];
  for (const b of everyBallot) {
    if (!b.voted) continue;
    if (alignmentAt(b.voter, ep) !== 'traitor') continue;
    if (alignmentAt(b.voted, ep) !== 'traitor') continue;
    const pair = `${b.voter} ${b.voted}`;
    if (seen.has(pair)) continue;
    seen.add(pair);
    turns.push({ voter: b.voter, target: b.voted, channel: b.channel });
  }
  if (!turns.length) return [];

  return turns.map((t, k) => ({ ...t, line: _betrayalLine(t, k, turns, ep) }));
}

/**
 * One sentence for one turn, and never the same one twice at a table.
 *
 * THE KEY USED TO BE `tr-betrayal|${ep}` ALONE, so every betrayer at one table
 * hashed identically and 65.7% of multi-betrayal tables printed the same
 * template twice with the names swapped: "Whatever Brightly and Brody swore
 * upstairs, Brightly has just put it on a slate." / "Whatever Brody and
 * Brightly swore upstairs, Brody has just put it on a slate." Every other key
 * in this plan carries the actor; this one did not. `lineFor` folds the subs
 * values into its hash, but the subs are the same two names in both
 * directions, so they could never separate the pair on their own.
 *
 * PUTTING THE ACTOR IN THE KEY IS NOT ENOUGH EITHER, and this is the part that
 * had to be measured rather than reasoned about: two independent hashes into a
 * four-line pool collide one time in four however they are keyed, and three of
 * them collide about six times in ten. Rotating the pool per betrayer after
 * hashing does not help — two independent draws are still two independent
 * draws, and the first draft of this fix went red on exactly that.
 *
 * So the pool is WALKED. ONE hash, taken over the whole table, decides where
 * the walk starts; the ordinal decides how far along it each betrayer sits.
 * Distinct by construction for as many betrayers as there are templates, which
 * is this project's `_pickUnique` rule. A fifth at one table would have to
 * reuse one, and with three Traitors there is never a fifth. The start hash
 * takes every name that turned, so two tables do not read alike, and it costs
 * no rng draw — `_lineHash` is the same free hash `lineFor` uses.
 */
function _betrayalLine(turn, k, turns, ep) {
  const start = _lineHash(`tr-betrayal|${ep}|`
    + turns.map(t => `${t.voter}>${t.target}`).join('|'));
  const idx = (start + k) % BETRAYAL_LINES.length;
  return lineFor([BETRAYAL_LINES[idx]], `tr-betrayal|${ep}|${turn.voter}`,
    { voter: turn.voter, target: turn.target,
      sub: pronouns(turn.voter).sub, posAdj: pronouns(turn.voter).posAdj });
}

/**
 * Run one Round Table end to end. Returns the round record, already stored.
 *
 * `reveal` is the endgame's one change to this file (spec §8, Plan 6 Task 7).
 * A player banished in the finale does not say what they were, so the reveal
 * cascade — the mechanism that converts a round of meaningless ballots into
 * evidence, and the reason late tables are sharper than early ones — is
 * switched OFF there. It also suppresses the RECORD of the exit speech, which
 * is the other place a certain alignment escaped — see the long note at the
 * bottom of this function. Everything else runs exactly as it always does: the
 * debate, the ballots, the tie rule, and the speech itself is still generated
 * so the rng stream is untouched. The round record still carries
 * `banishedWasTraitor` because that is the export shape and the audience is
 * not the room.
 */
// ══════════════════════════════════════════════════════════════════════
// BEING RIGHT PAYS, AND BEING WRONG COSTS
// ══════════════════════════════════════════════════════════════════════
//
// Until this existed the table's verdict priced ONE of the four cases.
// `revealCascade` indicts the people who KEPT a revealed Traitor in (0.5), and
// stops -- `if (!wasTraitor) return []`, on the grounds that a revealed
// Faithful tells you the room was wrong rather than who is guilty. True about
// the room. Not true about the person who DROVE IT, who has just spent the
// evening being confidently wrong in public, and paid nothing for it.
//
//   named the banished, and they were a Traitor    -> the room doubts them less
//   named the banished, and they were a Faithful   -> a small mark against them
//   kept the banished in, and they were a Traitor  -> revealCascade, unchanged
//   kept the banished in, and they were a Faithful -> nothing, correctly
//
// AND THIS IS WHY THE SACRIFICE ABOVE PAYS FOR ITSELF, with no special case
// anywhere: a Traitor who buries a burned fellow gets the first line's credit,
// because the name they gave the room really was a Traitor. The cover is
// bought by the same rule that punishes being wrong, which is the whole
// argument for writing it as a rule instead of as a Traitor power.
//
// ── THE MAGNITUDES ARE SMALL ON PURPOSE ───────────────────────────────
//
// This is a NEW CHANNEL into the deduction model and the calibrated curve
// wants near-chance early and sharpening late, so a generous version of this
// would let the room solve itself by week two off nothing but who shouted.
// The note on MURDER_WEIGHTS in deduction.js is the standing warning: an
// earlier channel there priced at 0.48 on a 1.21x lift that a CONTENTLESS
// control also scored 1.20x. So both numbers here are deliberately under the
// 0.5 keeper indictment, and the arm that matters is the control, not the
// headline.
//
// A CORRECT CALL IS WORTH MORE THAN A WRONG ONE COSTS, and the asymmetry is
// the format's rather than a thumb on the scale: driving out a Traitor is rare
// and hard, and being wrong about a Faithful is what most of the room does
// most nights. Pricing them the same would make the average accuser steadily
// more suspicious every week, which is a drift, not a signal.
// ── AND THE CREDIT IS NARROW AS WELL AS SMALL ─────────────────────────
//
// The first version paid every accuser of a revealed Traitor, and `sceneDoubt`
// lowers a belief in EVERY observer -- so one correct banishment fired credit
// across the whole room, times every person who had joined the pile-on. Over a
// season that is broad, systematic downward pressure on the entire board, and
// it showed up where nothing was looking: endgame asks that forced another
// table fell from over 100 in 200 seasons to 72, because rooms were arriving
// at the endgame with too little suspicion left to want anybody gone. A
// channel that quietly deflates the model is worse than one that inflates it,
// because the symptom is the room getting NICER rather than sharper and no
// band is watching for that.
//
// So only the person who actually drove it is paid. Being one of eight people
// who named the right man is not the same as being the reason he went, and
// pricing them the same was both wrong about the format and the thing that
// broke the phase.
const CALLED_IT_CREDIT = 0.12;
const WRONGLY_DROVE_OUT = 0.16;

/**
 * Price everybody who publicly named the person the room has just banished.
 *
 * PUBLIC ON EVERY LAYER. It reads tonight's accusations (said out loud, at
 * this table) and the reveal (said out loud, at that door), and nothing else.
 * The observer set is the living room, so the accuser is not told what the
 * room now thinks of them -- which is the point of the mechanic.
 */
function priceTheAccusers(banished, wasTraitor, accusations, ep, rng) {
  const living = (gs.activePlayers || []).filter(n => n !== banished);
  const named = [...new Set(accusations.filter(a => a.target === banished)
    .map(a => a.accuser))].filter(n => living.includes(n));
  // WHO DROVE IT: the first person to put that name up tonight. `accusations`
  // is in speaking order, so this is the one who said it before the room
  // agreed rather than after.
  const drove = (accusations.find(a => a.target === banished
    && living.includes(a.accuser)) || {}).accuser || null;
  const priced = [];
  for (const accuser of named) {
    // The credit is the lead accuser's alone (see the note on the constants);
    // the MARK is everybody's, because everybody who named a Faithful was
    // wrong about that Faithful, whoever started it.
    if (wasTraitor && accuser !== drove) continue;
    for (const observer of living) {
      if (observer === accuser) continue;
      if (wasTraitor) {
        // THEY CALLED IT. `sceneDoubt` lowers an existing read and refuses
        // when there is none to lower, which is the correct shape here: this
        // buys the accuser cover with people who already doubted them and
        // does not make them a suspect in the eyes of somebody who never had
        // a thought about them.
        sceneDoubt(observer, accuser, CALLED_IT_CREDIT,
          { source: `called ${banished} on the night ${banished} was revealed`, ep });
      } else {
        // TWO WORDINGS FOR ONE PRICE. Driving a banishment and joining one
        // are not the same act and the room can see the difference, so the
        // reason a later speech quotes says which it was. The CONFIDENCE is
        // deliberately identical: splitting it would be a second calibration
        // question, and this is a wording fix.
        learn(observer, alignmentFactId(accuser), {
          source: accuser === drove
            ? `campaigned to get ${banished} out, and ${banished} was a Faithful`
            : `helped put ${banished} out, and ${banished} was a Faithful`,
          sourceType: 'deduced', confidence: WRONGLY_DROVE_OUT, ep, rng,
        });
      }
    }
    priced.push(accuser);
  }
  return priced;
}

export function runRoundTable(ep, rng = Math.random, { reveal = true } = {}) {
  const living = [...(gs.activePlayers || [])];
  const accusations = debate(ep, rng);

  // THE DAGGER IS DECLARED BEFORE A NAME IS READ, and the call takes NO rng
  // draw: whether tonight is the night was decided when the thing was won
  // (js/tr/powers.js), so a table with a Dagger at it draws exactly as many
  // numbers as a table without one and the two seasons remain comparable.
  // THE ARGUMENTS HAPPEN BEFORE THE CHALK, which is both how the format runs
  // and the only ordering under which they can matter. This call used to sit
  // in the `round` literal at the bottom of this function — after the ballots
  // were cast — so every clash was decoration by construction. See `clashes`.
  const tableClashes = clashes(ep, rng, accusations);

  // WHAT THE BALLOT IS ALLOWED TO SEE OF THE ARGUMENT. `chooseBanishmentVote`
  // prices a fellow Traitor by how burned they are (`tonightsBurn` in
  // deduction.js) and has no other way to reach tonight's table. Set before
  // the ballots and cleared after them, so nothing outside this table -- a
  // later round, a murder, a castle scene -- can read a stale argument.
  if (gs.tr) gs.tr._tableAccusations = accusations;

  const weights = daggerWeights(ep, living);
  const daggerHolder = weights ? Object.keys(weights)[0] : null;

  const ballots = living.map(voter => ({
    voter,
    voted: chooseBanishmentVote(voter, living, ep, rng),
    channel: 'banishment',
  }));

  let result = resolveVotes(tally(ballots, weights));
  const revotes = [];
  // The format's tie rule: only the tied are eligible, and they do not vote.
  // Capped, because a tiny room can deadlock indefinitely; the last resort is a
  // seeded draw, which the real show also does (it hands them boxes to open).
  let guard = 0;
  while (result.isTie && guard++ < 3) {
    const tied = result.tiedPlayers || [];
    const voters = living.filter(n => !tied.includes(n));
    const rvBallots = voters.map(voter => ({
      voter, voted: chooseBanishmentVote(voter, tied, ep, rng), channel: 'banishment-revote',
    }));
    revotes.push({ tied, ballots: rvBallots });
    // The Dagger carries into the revote it failed to prevent — it is drawn
    // for a BANISHMENT, and a revote is the same banishment still being
    // decided rather than a new one. It does nothing when its holder is one of
    // the tied, since the tied do not vote.
    result = resolveVotes(tally(rvBallots, weights));
    if (result.isTie && !voters.length) break;
  }
  // The last-resort draw, and the reason it is written this defensively.
  //
  // When every living player draws exactly one vote, `tiedPlayers` is the whole
  // room, the revote has no eligible voters, and `resolveVotes({})` hands back an
  // EMPTY `tiedPlayers`. `|| living` does not rescue that: `[]` is truthy, so the
  // fallback never fires and `[][NaN]` is `undefined`. A round then banishes
  // nobody — the season silently skips a banishment, the round drops out of
  // `ballotEvidence` forever, and `revealCascade(undefined, ...)` teaches every
  // living player a `public`-certainty alignment about a person who does not
  // exist. Fall back on EMPTINESS, never on presence.
  const drawPool = (result.tiedPlayers && result.tiedPlayers.length)
    ? result.tiedPlayers
    : living;
  const banished = result.eliminated
    || (drawPool.length ? drawPool[Math.floor(rng() * drawPool.length)] : null);
  if (!banished) return null;   // an empty castle has nobody to banish

  const wasTraitor = alignmentAt(banished, ep) === 'traitor';
  const round = { ep, banished, banishedWasTraitor: wasTraitor, murdered: null,
    // THE WHOLE TABLE, revotes included — see the note on `betrayals`. By this
    // line the tie loop has finished, so `revotes` is complete.
    ballots, revotes, accusations, betrayals: betrayals({ ballots, revotes }, ep),
    // The accusations with their provenance and reach attached. A pure read of
    // beliefs the debate already formed — see `speechesFrom`. Every speech
    // cites a source the speaker holds; the VP renders claim/response/
    // mind-change beats off it.
    speeches: speechesFrom(accusations, ep),
    // THE ARGUMENTS, as opposed to the list of names. See `clashes` above:
    // the one hour of this format whose whole purpose is people accusing each
    // other to their faces produced no confrontation at all until this
    // existed. Generated from the accusations just made plus the season's own
    // open threads, so a row that started in a corridor on day three finishes
    // here, where it costs a vote.
    clashes: tableClashes };
  if (daggerHolder) {
    // Recorded on the round, because the room watched it happen: the draw is
    // public even though the win was not. `votes` is read off the exported
    // constant rather than written as a literal 2, so the record and the tally
    // cannot come to disagree about how much a Dagger is worth.
    const drawn = daggerDrawnAt(ep);
    round.dagger = { holder: daggerHolder, votes: DAGGER_VOTES,
      line: drawn?.drawLine || null };
    if (drawn) {
      drawn.target = ballots.find(b => b.voter === daggerHolder)?.voted || null;
      drawn.banished = banished;
    }
  }
  if (gs.tr) gs.tr._tableAccusations = null;
  recordRound(round);
  gs.activePlayers = living.filter(n => n !== banished);
  if (reveal) {
    revealCascade(banished, wasTraitor, ep, rng);
    // AFTER the cascade, and only when there was a reveal: the room cannot
    // price who was right until it has been told who was right. Suppressed at
    // the finale for the same reason the cascade is (spec §8) -- the endgame
    // has no reveals and the survivors go on nerve alone.
    round.accusersPriced = priceTheAccusers(banished, wasTraitor, accusations, ep, rng);
  }
  // THE SPEECH, on the round record where the export shape and the VP can read
  // it. Generated from what the LEAVER believes, so it must run after the
  // removal — a banished player names somebody still in the castle.
  //
  // It deliberately forms NO belief in anybody. A burn is one person shouting
  // on their way out of a door, and how much of it sticks is residue: threads,
  // cooldowns and the castle event pool, which Plan 4 owns. Wiring the
  // consequence here would build that mechanism twice, in the wrong file and
  // without the decay Plan 4 needs. Generation and record are wired now, so
  // nothing rebuilds the speech itself. Measured inert: suppressing this call
  // moves early lift by under 1pp across five 200-season blocks, which is the
  // rng stream shifting and nothing else.
  //
  // ── AND IT IS THE SECOND REVEAL IN THIS FUNCTION (spec §8) ──────────
  //
  // `reveal: false` suppresses `revealCascade` one line above and stopped
  // there, but a Traitor's exit speech is drawn from GROUND TRUTH: exit.js
  // picks the target out of the living Traitors and stamps `conviction: 1`.
  // So a finale banishment shipped a certain, correct alignment on
  // `endgame.rounds[].exitSpeech`, where spec §8 says there are no reveals
  // and the survivors go on nerve alone. Measured 189 of 1,680 endgame
  // rounds over 1,200 seasons (11.3%) — e.g. seed 3, "Brightly names Brody
  // on the way out", both Traitors. Invisible only because nothing reads the
  // field yet; Plan 8 builds the reader.
  //
  // SUPPRESSED FOR EVERYBODY, NOT JUST FOR TRAITORS. A Faithful's speech
  // leaks nothing — it comes off a suspicion board — so laundering only the
  // Traitor branch was the obvious smaller fix and it is wrong: if Traitors
  // are the only people who leave the finale in silence, the silence IS the
  // reveal. The rule has to be blind to alignment to be a rule at all.
  //
  // THE CALL STILL HAPPENS AND ITS RESULT IS DROPPED, deliberately.
  // `exitSpeech` draws from `rng` (the target when there is no board, and the
  // burn roll), and the endgame runs table after table off this same stream.
  // Skipping the call would shift every draw after it and re-roll the phase,
  // so Task 7's endgame measurements would no longer describe head. Consuming
  // the draws and discarding the record keeps the finale bit-identical and
  // costs one dead object per banishment. Do not "optimise" this away.
  const speech = exitSpeech(banished, ep, rng);
  round.exitSpeech = reveal ? speech : null;
  return { ...round, wasTraitor, tally: tally(ballots, weights) };
}
