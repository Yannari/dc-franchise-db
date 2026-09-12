// ══════════════════════════════════════════════════════════════════════
// dr/mini.js — the mini challenge, and who it is aimed at
// ══════════════════════════════════════════════════════════════════════
//
// A mini used to be three lines inside week.js: score everybody on a blend,
// add noise, highest wins. That is fine for a photoshoot and wrong for the
// two that carry the segment, because Reading Is Fundamental and Puppet
// Parody are not solo events — they are one queen doing a bit ABOUT another
// queen, to her face, in front of the room. Resolving those as a private stat
// roll threw away the only thing that made them worth filming.
//
// So a mini declares an INTERACTION and this decides what that means:
//
//   solo     everybody performs for the room. A stat roll, which is correct.
//   targets  she picks somebody and does a bit about them. Lands or does not,
//            and either way the two of them feel it.
//   pairs    the room is split in two and each queen's result depends partly
//            on what her partner did for her.
//
// Nobody goes home for losing a mini and it never touches the week's
// placement — what it buys is POWER over the maxi. What this file adds is that
// it can now also cost you a friend.
import { dragOf } from './queen.js';
import { blendScore, noise } from './perform.js';
import { evt } from './rules.js';
import { SPILL_QUESTIONS, spillRounds } from './data/spill.js';
import { GUESS_ITEMS, guessRounds } from './data/guess.js';

/** A read that lands. Below this it did not. */
const LANDED = 6.5;
/** A read so sharp the room remembers it. */
const BRUTAL = 9;

const stat = (p, k) => {
  const n = Number(p?.stats?.[k]);
  return Number.isFinite(n) ? n : 5;
};

/**
 * Who she aims at.
 *
 * Boldness decides how high she reaches. A fearless queen goes after the
 * biggest personality in the room; a cautious one picks somebody safe, which
 * usually means somebody she likes — and a read of a friend lands softer,
 * which is the trade she is making without knowing it.
 */
function targetFor(n, living, players, bond, star, rng) {
  const others = living.filter(o => o !== n);
  if (!others.length) return null;
  const bold = stat(players[n], 'boldness') / 10;
  const weights = others.map(o => {
    const presence = (star?.[o] ?? 5) / 10;
    const closeness = Math.max(0, bond(n, o)) / 10;
    // Bold: go for the big target. Cautious: go for the comfortable one.
    const w = bold * (0.4 + presence) + (1 - bold) * (0.4 + closeness) + rng() * 0.3;
    return { o, w };
  });
  const total = weights.reduce((t, x) => t + x.w, 0);
  let roll = rng() * total;
  return (weights.find(x => (roll -= x.w) <= 0) || weights[0]).o;
}

/* ── SPILL THE T ──────────────────────────────────────────────────────
   The host asks a superlative about the room and everybody votes. The
   queens who vote WITH THE MAJORITY take the round, which is the real
   show's rule and the reason this mini is not like any other one here: it
   scores whether you know what everybody else thinks, not whether you are
   good at something.

   Her vote is a READ, built from what she can actually see — a record, a
   room, a bond — with `intuition` deciding how much noise sits on top. So a
   queen who misreads the room misreads it for a reason, and a perceptive
   queen is genuinely better at this without ever being certain.

   And then it is read out, which is the whole point. A queen finds out in
   front of everybody, before she has done anything that week, that six of
   her sisters think she is the next one going. `sting` prices that per
   question: being voted the most sensible with the prize money costs
   nothing at all. */
function runSpill({ living, players, rng, bond, record }) {
  const rounds = [];
  const matches = Object.fromEntries(living.map(n => [n, 0]));
  const pool = [...SPILL_QUESTIONS].sort(() => rng() - 0.5)
    .slice(0, spillRounds(living.length));

  for (const q of pool) {
    const votes = {};
    for (const voter of living) {
      const others = living.filter(o => o !== voter);
      if (!others.length) continue;
      /* How sharp her read is. A queen with no intuition is close to
         guessing; one with all of it still does not KNOW, because the room
         is other people. */
      const blur = 2.6 - (Number(players[voter]?.stats?.intuition) || 5) * 0.18;
      const ctx = { record, players, bond, living, voter };
      const seen = others.map(o => ({
        o, v: q.reads(o, ctx) + noise(rng, blur),
      })).sort((a, b) => b.v - a.v);
      votes[voter] = seen[0].o;
    }

    const tally = {};
    for (const target of Object.values(votes)) tally[target] = (tally[target] || 0) + 1;
    /* The name the room landed on. Ties break by the name so a replay of the
       same seed reads out the same answer. */
    const named = Object.entries(tally)
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0];
    if (!named) continue;
    for (const [voter, target] of Object.entries(votes)) {
      if (target === named[0]) matches[voter] += 1;
    }
    rounds.push({
      question: q.id, prompt: q.prompt, sting: q.sting,
      votes, tally, named: named[0], count: named[1],
    });
  }
  return { rounds, matches };
}

/* ── GUESS WHO ────────────────────────────────────────────────────────
   Something belongs to one of them — a wig, a scent, a baby photo — and the
   room has to work out whose. It looks like the vote above and it is the
   opposite of it: there IS a right answer here, so agreeing with everybody
   else wins nothing. Eight queens confidently wrong together is a result the
   consensus game cannot produce and this one produces constantly.

   What a queen has to go on is real and is only three things: how well she
   knows the owner (the BOND — this is the only mini on the list that pays a
   queen for the room she has built), how loud the owner is on that
   particular axis (the item's TELL), and how much noise her intuition leaves
   on top. An `intimate` item — a perfume, a padding, a station an hour
   before the runway — is knowable ONLY from living with somebody, so the
   bond carries nearly all of it and the craft carries almost none.

   Which means the queen nobody can place is the queen nobody talks to, and
   the episode gets to say that without anybody having to say it. */
function runGuess({ living, players, rng, bond }) {
  const rounds = [];
  const right = Object.fromEntries(living.map(n => [n, 0]));
  const asked = Object.fromEntries(living.map(n => [n, 0]));
  const items = [...GUESS_ITEMS].sort(() => rng() - 0.5);
  /* A DIFFERENT QUEEN EVERY ROUND. Four items all belonging to the same
     woman is one queen's segment and three queens with nothing to do; it
     also makes the second round guessable from the first. */
  const owners = [...living].sort(() => rng() - 0.5)
    .slice(0, Math.min(guessRounds(living.length), living.length));

  for (const [k, owner] of owners.entries()) {
    const item = items[k % items.length];
    const votes = {};
    for (const voter of living) {
      if (voter === owner) continue;          // she knows her own bag
      const others = living.filter(o => o !== voter);
      if (!others.length) continue;
      const blur = 2.1 - (Number(players[voter]?.stats?.intuition) || 5) * 0.15;
      /* WHAT SHE HAS ON EACH CANDIDATE: how well she knows her, and whether
         she looks like the answer. The bond counts double on an intimate
         item, which is the whole difference between recognising a perfume
         and recognising a wig — and on the perfume there is no axis at all,
         so knowing her is the only thing in the sum. */
      const weight = item.intimate ? 2 : 1;
      const at = item.axis ? item.axis(players[owner]) : null;
      const near = o => (at === null ? 0
        : Math.max(0, 3.4 - Math.abs(item.axis(players[o]) - at) * 0.85));
      const seen = others.map(o => ({
        o, v: bond(voter, o) * weight + near(o) + noise(rng, blur),
      })).sort((a, b) => b.v - a.v);
      votes[voter] = seen[0].o;
      asked[voter] += 1;
      if (seen[0].o === owner) right[voter] += 1;
    }

    const tally = {};
    for (const guess of Object.values(votes)) tally[guess] = (tally[guess] || 0) + 1;
    const knew = Object.keys(votes).filter(v => votes[v] === owner);
    rounds.push({
      item: item.id, prompt: item.prompt, intimate: !!item.intimate,
      craft: item.craft || null,
      owner, votes, tally, knew, count: knew.length, of: Object.keys(votes).length,
    });
  }
  return { rounds, right, asked };
}

/* ── WHAT THE READ IS ABOUT ────────────────────────────────────────────
   A real read is specific. "You remind me of my favourite films — your
   fashion is one of them and your smile is the other" only works because it
   is about THAT queen; the same sentence about anybody else is noise. Our
   pool could not be specific, because a line written with `{b}` in it has to
   be true of whoever `{b}` turns out to be — so every read was general, and
   a general read is the one thing a library cannot survive.

   `angle` fixes that by choosing the read's SUBJECT from what is actually
   true of the target tonight, and letting the pool hold a set of lines per
   subject. Every one of them is checked against her before it is offered,
   so "you have never won anything" is only ever said to a queen who has not.

   Ordered most specific first: a queen who has never placed and also dresses
   in one silhouette gets read for the record, because the record is the
   sharper fact. `generic` is the floor and is what the pool already held.

   NOT a difficulty setting and not a score. Which angle she takes does not
   change how well the read goes — that is her comedy, her boldness and the
   bond, all decided above. It changes what the joke is ABOUT. */
const READ_ANGLES = [
  // Her record, which is the material the real show reaches for first.
  { id: 'the-frontrunner', when: r => r.wins >= 2 },
  { id: 'been-in-the-bottom', when: r => r.bottoms >= 2 },
  { id: 'never-won', when: r => r.weeks >= 3 && !r.wins && !r.highs },
  { id: 'always-safe', when: r => r.weeks >= 4 && r.safes >= r.weeks - 1 },
  // Then what the room can see her fail at.
  { id: 'weak-craft', when: (r, d) => d.worst !== null, as: d => `weak-${d.worst}` },
  // Early on there is no record to read, and that IS the read.
  { id: 'brand-new', when: r => r.weeks <= 1 },
  { id: 'generic', when: () => true },
];
/* `one-note-look` was here and came out: it fired on any queen with an
   authored `drag.style`, which is not a fault and not a fact — it is a field
   being set. Measured at 73% of every read, which is what a badly-chosen
   angle looks like: one joke, told about everybody, which is the exact
   failure this whole mechanism exists to fix. A read about how she dresses
   needs "the same silhouette every week", and nothing here knows that yet. */

/** Her record so far, as the four counts a read can be built on. */
function recordOf(name, record = {}) {
  const past = record[name] || [];
  return {
    weeks: past.length,
    wins: past.filter(x => x === 'WIN').length,
    highs: past.filter(x => x === 'HIGH').length,
    safes: past.filter(x => x === 'SAFE').length,
    bottoms: past.filter(x => x === 'BTM2' || x === 'LOW').length,
  };
}

/** The craft she is visibly worst at, or null when nothing stands out. */
function weakestCraft(player) {
  const d = dragOf(player) || {};
  const CRAFTS = ['design', 'dance', 'singing', 'comedy', 'acting', 'runway'];
  const vals = CRAFTS.map(k => ({ k, v: Number(d[k]) })).filter(x => Number.isFinite(x.v));
  if (vals.length < 2) return null;
  vals.sort((a, b) => a.v - b.v);
  // Only when it is genuinely a weakness and genuinely her worst.
  return (vals[0].v <= 4 && vals[1].v - vals[0].v >= 1) ? vals[0].k : null;
}

/** Which of her facts this read is about. */
export function readAngleFor(target, players, record) {
  const r = recordOf(target, record);
  const d = {
    style: dragOf(players[target])?.style || null,
    worst: weakestCraft(players[target]),
  };
  const hit = READ_ANGLES.find(a => a.when(r, d));
  /* `weak-craft` names WHICH craft. "You cannot sew" and "you cannot dance"
     are different jokes, and an angle that cannot tell them apart would hand
     the writer one tier for six reads. */
  return { angle: hit.as ? hit.as(d) : hit.id, about: { ...r, ...d } };
}

/**
 * One mini, end to end.
 *
 * Returns the winner and the scores as before, plus the beats and the events
 * the interaction produced. A caller that ignores `events` gets exactly the
 * old behaviour, which is what makes this safe to drop in.
 */
/** Under this and she has nothing to say, which is its own result. */
const PASSES = 2.2;

export function runMini({ living, mini, players, rng, bond = () => 0, star = {},
  record = {} }) {
  const scores = {};
  const events = [];
  const detail = {};

  const interaction = mini.interaction || 'solo';
  const pairs = [];

  /* ── A TARGETING MINI IS TAKEN IN TURNS, AND THE TURN IS THE FORMAT ──
     The library is not thirteen simultaneous reads; it is one queen at a
     time, announced by the host, standing up in front of everybody. Who goes
     first and who goes last is the shape of the whole segment — the last read
     of the night is the one the room has been waiting for — and none of that
     existed: `living` order was used as if it were nothing.
     Shuffled once here so the order is a real draw and so the same seed
     replays the same library. */
  const turnOrder = interaction === 'targets'
    ? [...living].sort(() => rng() - 0.5) : [...living];

  /* The vote runs before anybody is scored, because on this mini the vote IS
     the score: she is not performing, she is guessing what the room thinks. */
  const spill = interaction === 'vote'
    ? runSpill({ living, players, rng, bond, record }) : null;
  const guess = interaction === 'guess'
    ? runGuess({ living, players, rng, bond }) : null;

  if (interaction === 'pairs') {
    // Split the room. An odd queen out works alone, which is its own result.
    const order = [...living].sort(() => rng() - 0.5);
    for (let i = 0; i + 1 < order.length; i += 2) pairs.push([order[i], order[i + 1]]);
    if (order.length % 2) pairs.push([order[order.length - 1], null]);
  }

  for (const n of living) {
    const d = dragOf(players[n]);
    let s = blendScore(d, mini.blend) + noise(rng, 3);

    if (interaction === 'vote') {
      /* HOW OFTEN SHE MATCHED THE ROOM, and almost nothing else. A craft
         score would be answering a question this mini does not ask — there
         is no performance here, only a read. The small blend term is kept as
         a tiebreak so two queens on the same number are not settled by name
         alone. */
      const hit = spill?.matches?.[n] || 0;
      const of = Math.max(1, spill?.rounds?.length || 1);
      s = (hit / of) * 10 + s * 0.06;
      detail[n] = { matched: hit, of, rounds: spill?.rounds?.length || 0 };
    } else if (interaction === 'guess') {
      /* HOW MANY SHE GOT RIGHT, over how many she was asked — the owner does
         not guess on her own item, so the denominators differ by one and a
         raw count would quietly punish whoever came up least often. The
         blend stays a tiebreak, as above. */
      const hit = guess?.right?.[n] || 0;
      const of = Math.max(1, guess?.asked?.[n] || 1);
      s = (hit / of) * 10 + s * 0.06;
      detail[n] = { right: hit, of, rounds: guess?.rounds?.length || 0 };
    } else if (interaction === 'targets') {
      const target = targetFor(n, living, players, bond, star, rng);
      const at = turnOrder.indexOf(n);
      detail[n] = {
        target,
        // Where in the running order she stands, and what the host calls it:
        // the first queen up, one of the middle, or the last one — which the
        // host announces as such and the room hears as such.
        turn: at,
        position: at === 0 ? 'first'
          : at === turnOrder.length - 1 ? 'last' : 'next',
      };
      if (target) {
        // A read of somebody you like lands softer — you pull it, and the room
        // can tell. A read of somebody you cannot stand has teeth.
        const b = bond(n, target);
        s += b >= 4 ? -0.6 : b <= -4 ? 0.8 : 0;
        detail[n].pulled = b >= 4;
        // And WHAT the read is about, chosen from what is true of her.
        const a = readAngleFor(target, players, record);
        detail[n].angle = a.angle;
        detail[n].about = a.about;
      }
    } else if (interaction === 'pairs') {
      const pair = pairs.find(p => p.includes(n));
      const partner = pair ? pair.find(o => o && o !== n) : null;
      detail[n] = { partner };
      if (partner) {
        // She wears what her partner made her. Their skill is half her result.
        s = s * 0.6 + (blendScore(dragOf(players[partner]), mini.blend) + noise(rng, 2)) * 0.4;
      }
    }

    scores[n] = Math.round(s * 100) / 100;

    /* SHE HAS NOTHING. The worst thing that happens in a library is not a
       bad read, it is a queen who stands up, opens her mouth and passes —
       and that was unreachable, because the floor of the pool was "a read
       that did not land". Proportional to how far under she is rather than a
       flat cut, so it is rare and it is earned. */
    if (interaction === 'targets' && detail[n]) {
      detail[n].passed = scores[n] < PASSES;
    }
  }

  /* ── A TURN IS SEVERAL READS, WHICH IS THE FORMAT ──────────────────
     The library is not one joke each. She puts the glasses on, takes the
     room apart, and sits down — the wiki's own description is that the
     queens "read each other", plural, and the winner is whoever was
     funniest across her turn. One read each made every queen a single
     punchline and made the segment a list.

     HOW MANY she gets through is a result, not a roll. A queen who is
     killing it is asked for more and keeps going; a queen who is dying does
     one and sits down; a queen who has nothing does not get a second. That
     is the shape the real segment has and it costs nothing to model,
     because the ranking already knows who is which.

     And her FIRST read is her best. She leads with the one she prepared, so
     each later read carries a small penalty — pushing her luck is what the
     third one is. The penalty is applied where the tier is decided
     (js/dr/stage.js) rather than here, so there is still one place that
     turns a rank into a tier. */
  if (interaction === 'targets') {
    const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]).map(e => e[0]);
    const size = Math.max(1, ranked.length - 1);
    for (const [i, n] of ranked.entries()) {
      const d = detail[n];
      if (!d || !d.target) continue;
      const frac = i / size;
      const count = d.passed ? 1 : frac <= 0.30 ? 3 : frac <= 0.70 ? 2 : 1;
      const taken = new Set([n]);
      const reads = [];
      /* ── AND SHE DOES NOT DO THE SAME JOKE THREE TIMES ──
         The angle is a property of the TARGET — her weakest craft, her
         record — so a queen whose three draws all happened to be the worst
         sewers in the room got `weak-craft:design` three times, and the pool
         is keyed by angle: three cards in one turn reading "I have seen
         better sewing on a pillow from a hotel room", with only the name
         changed. Measured on a real season, once per turn of three.
         A pool with one line for that angle is the reason it repeats, and
         widening pools is not the fix — a comic doing the same premise about
         three people in a row is bad on its own. So a later read prefers a
         target the turn has not already made this joke about, and falls back
         to the drawn one when the room offers nothing else. The first read is
         never re-chosen: that is the one she prepared. */
      const angles = new Set();
      for (let k = 0; k < count; k++) {
        let target;
        let a;
        if (k === 0) {
          target = d.target;
        } else {
          const open = living.filter(o => !taken.has(o));
          target = targetFor(n, open, players, bond, star, rng);
          if (target && angles.has(readAngleFor(target, players, record).angle)) {
            /* Drawn the same premise again. Look for one the turn has not
               used, in the order the room offers them, and keep the draw if
               there is none — every remaining queen can be weak at the same
               thing. */
            const fresh = open.find(o => o !== target
              && !angles.has(readAngleFor(o, players, record).angle));
            if (fresh) target = fresh;
          }
        }
        if (!target) break;
        taken.add(target);
        a = readAngleFor(target, players, record);
        angles.add(a.angle);
        reads.push({ target, angle: a.angle, about: a.about, swing: k * 0.12 });
      }
      d.reads = reads;
    }
  }

  // ── what the interaction did to the room ──
  /* ── AND THE ANSWERS ARE READ OUT ──────────────────────────────────
     Which is the entire reason this mini exists. A vote nobody hears is a
     survey; a vote read back to the room in front of the queen it names is
     the drama. `sting` prices the question — being voted the most sensible
     with the prize money costs her nothing, being voted the next one going
     costs her the afternoon.

     TWO THINGS HAPPEN, and they are different. The room's verdict lands on
     HER: a queen told before she has done anything that six sisters expect
     her to go home carries that into the challenge. And the vote lands
     between HER AND THE QUEENS WHO CAST IT, because she watched them do it.
     A read in the library is a joke; this is on the record.

     Only a stinging question moves anything. A compliment read out is a
     nice moment and nice moments are not consequences. */
  if (interaction === 'vote' && spill) {
    for (const r of spill.rounds) {
      if (r.sting < 0.5) continue;
      const share = r.count / Math.max(1, living.length - 1);
      const accusers = Object.keys(r.votes)
        .filter(v => r.votes[v] === r.named && v !== r.named);
      /* EVERY QUEEN WHO SAID IT PAYS FOR IT, on one event rather than one
         each. She watched every hand go up, so the bond cost is per accuser
         — it scales with the sting and NOT with the count, because being one
         of six does not make it less personal to the one who cast it — but
         six cards saying the same thing about the same round is the beat
         printed six times, which is how a segment stops being drama and
         starts being a list. */
      events.push(evt('named-by-the-room', {
        players: [r.named, ...accusers],
        pop: { [r.named]: -Math.round(r.sting * (1 + share * 2)) },
        bond: accusers.map(v => [v, r.named, -Math.round(r.sting * 2 * 10) / 10]),
        data: { question: r.question, prompt: r.prompt, count: r.count, share },
      }));
      /* AND THE ONE IT ACTUALLY COSTS SOMETHING. The room naming her is the
         room; a queen she is close to naming her is a different event and
         the only one worth its own card. Nothing fires when the closest
         accuser is not actually close — a stranger saying it is already
         covered above. */
      const friend = accusers
        .map(v => ({ v, b: bond(v, r.named) }))
        .sort((a, b) => b.b - a.b || a.v.localeCompare(b.v))[0];
      if (friend && friend.b >= 3) {
        events.push(evt('named-her-to-her-face', {
          players: [friend.v, r.named],
          bond: [[friend.v, r.named, -Math.round(r.sting * 2 * 10) / 10]],
          data: { question: r.question, prompt: r.prompt, was: friend.b },
        }));
      }
    }
    /* AND A QUEEN NOBODY NAMED ALL GAME. Four questions about the room and
       her name did not come up once, which is its own verdict and the
       quietest bad news in the episode. */
    const everNamed = new Set(spill.rounds.flatMap(r => Object.values(r.votes)));
    for (const n of living) {
      if (everNamed.has(n) || spill.rounds.length < 3) continue;
      events.push(evt('nobody-said-her-name', {
        players: [n], pop: { [n]: -1 }, data: { rounds: spill.rounds.length },
      }));
    }
  }

  /* ── AND BEING KNOWN, OR NOT, IS THE RESULT ──────────────────────────
     Guess Who scores the guessers and the interesting number belongs to the
     queen whose thing it was. Nobody got it: she has been in that room for
     weeks and not one of them could pick her out. Everybody got it: her
     brand is loud enough to be identified by a shoe.

     And the one that costs something — a queen she is genuinely close to,
     guessing somebody else. That is not an insult and nobody meant it,
     which is why it lands. */
  if (interaction === 'guess' && guess) {
    for (const r of guess.rounds) {
      if (!r.of) continue;
      const share = r.count / r.of;
      if (r.count === 0) {
        events.push(evt('nobody-knew-it-was-hers', {
          players: [r.owner], pop: { [r.owner]: -1 },
          data: { item: r.item, prompt: r.prompt, of: r.of },
        }));
      } else if (share >= 0.45) {
        /* NEARLY HALF, not all of them. At 0.6 this fired on 3% of rounds
           measured over forty seasons — written prose nobody would ever see,
           which is the same defect as an event with no screen. At 0.45 it is
           14%, and half a room of twelve picking her out of a line-up is
           genuinely the thing the event is about. */
        events.push(evt('the-room-knew-her-instantly', {
          players: [r.owner], pop: { [r.owner]: 1 },
          data: { item: r.item, prompt: r.prompt, count: r.count, of: r.of, share },
        }));
      }
      /* The closest queen who got it wrong, and only if she was actually
         close. One card per round: eight wrong guesses is a tally, not a
         scene. */
      const missed = Object.keys(r.votes)
        .filter(v => r.votes[v] !== r.owner)
        .map(v => ({ v, b: bond(v, r.owner) }))
        .sort((a, b) => b.b - a.b || a.v.localeCompare(b.v))[0];
      if (missed && missed.b >= 4) {
        events.push(evt('her-own-girl-missed-it', {
          players: [missed.v, r.owner],
          bond: [[missed.v, r.owner, -0.8]],
          data: { item: r.item, prompt: r.prompt, said: r.votes[missed.v], was: missed.b },
        }));
      }
    }
  }

  if (interaction === 'targets') {
    for (const n of living) {
      const target = detail[n]?.target;
      if (!target) continue;
      const s = scores[n];
      if (s >= BRUTAL) {
        // It landed hard. The room loves her; the target less so.
        events.push(evt('read-landed', {
          players: [n, target],
          bond: [[n, target, -0.5]],
          pop: { [n]: 2 },
          data: { mini: mini.id, score: s },
        }));
      } else if (s < LANDED) {
        // She went for somebody and missed, which is worse than not going.
        events.push(evt('read-missed', {
          players: [n, target],
          bond: [[n, target, -1]],
          pop: { [n]: -1 },
          data: { mini: mini.id, score: s },
        }));
      } else if (detail[n].pulled) {
        // She had it and would not use it on a friend. The friend notices.
        events.push(evt('pulled-the-punch', {
          players: [n, target],
          bond: [[n, target, 1]],
          pop: { [n]: 1 },
          data: { mini: mini.id },
        }));
      }
    }
  } else if (interaction === 'pairs') {
    for (const [a, b] of pairs) {
      if (!b) continue;
      const both = (scores[a] + scores[b]) / 2;
      if (both >= LANDED + 1) {
        events.push(evt('did-her-proud', {
          players: [a, b], bond: [[a, b, 1.5]], pop: { [a]: 1, [b]: 1 },
          data: { mini: mini.id },
        }));
      } else if (both < LANDED - 1) {
        events.push(evt('did-her-dirty', {
          players: [a, b], bond: [[a, b, -1.5]], pop: { [a]: -1, [b]: -1 },
          data: { mini: mini.id },
        }));
      }
    }
  }

  const order = Object.entries(scores).sort((x, y) => y[1] - x[1]);
  return {
    winner: order.length ? order[0][0] : null,
    scores,
    detail,
    turnOrder,
    pairs,
    events,
    interaction,
    // The rounds, so the screen can read the vote back the way the room heard it.
    spill: spill ? spill.rounds : null,
    // The same, for the game with an answer in it.
    guess: guess ? guess.rounds : null,
  };
}

/** Write what the mini did. Refuses a cosmetic event, like everything else. */
export function applyMiniEvents(events, ctx) {
  let applied = 0;
  for (const e of events || []) {
    const changes = (e.bond?.length || 0) + Object.keys(e.pop || {}).length
      + Object.keys(e.state || {}).length;
    if (!changes) {
      throw new Error(`drag-race: mini event "${e.type}" has no consequence`);
    }
    for (const [a, b, d] of e.bond || []) ctx.addBond(a, b, d);
    for (const [n, d] of Object.entries(e.pop || {})) ctx.popDelta(n, d);
    applied += changes;
  }
  return applied;
}
