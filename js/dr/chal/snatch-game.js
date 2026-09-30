// ══════════════════════════════════════════════════════════════════════
// dr/chal/snatch-game.js — the taping
// ══════════════════════════════════════════════════════════════════════
//
// The one challenge where the assignment matters more than the performance.
// A queen who gets the character she prepared is playing a different game from
// the one who walked in last and took what was left, and the panel is six
// questions long, so there is nowhere to hide a bad choice.
//
// It is scored ROUND BY ROUND rather than once, because dying on the panel is
// not a low average — it is the specific, watchable thing of three answers in
// a row landing on silence. An average would smooth exactly the event the
// episode is about.
import { SNATCH_CHARACTERS, characterById } from '../data/snatch-characters.js';
import { pickOrder, contestFor } from '../assign.js';
import { prepareRoom, walkthrough } from '../prep.js';
import { dragOf } from '../queen.js';
import { noise, riskFor } from '../perform.js';
import { evt } from '../rules.js';
import { judgeById } from '../judges.js';
import { kitFor } from '../data/snatch-kits/index.js';
import {
  SNATCH_QUESTIONS, FLAT_SAYS, BOMB_SAYS, RU_REACTS, RU_ROPE, SHOW_OPEN, SHOW_CLOSE,
  ASK, REVEAL, PASSED_OVER, ASSIST, INTRO_FLAT, INTRO_DEAD, fillSnatch, quoteLine,
} from '../data/snatch-script.js';

const ROUNDS = 6;
/** Three answers landing on silence. Not an average — a run. */
const FLOP = 3;
const KILL = 8.5;


// ── THE HOST, WHO WAS NOT IN THIS AT ALL ──────────────────────────────
//
// Snatch Game was six rounds scored in isolation: every queen answered into a
// vacuum and nobody on the other side of the desk existed. That is not the
// segment. The host reads the question, and then he DECIDES what to do with
// what she gives him — feed a queen who is working, or let one who is dying
// hang there while he moves on.
//
// So each round he engages one queen, and which one is not random: he goes
// where the television is. A queen who is landing gets more of him, which
// compounds; a queen who is dying gets him too, because a struggling queen is
// also television, and that is the crueller half of the format.
const ENGAGE_PER_ROUND = 1;
/** What a setup is worth to somebody who can take it. */
const ROPE = 1.6;
/** And what being left to hang costs. */
const HANG = 1.2;

/**
 * Her shortlist, best first.
 *
 * A queen reaches for a character that suits her style and that she can carry.
 * The difficulty subtraction is why the funniest queen in the room can still
 * be found holding the Silent Film Star: everybody wants the good ones, and
 * only one of them gets it.
 */
/**
 * ── WHY SHE REACHES, OR DOES NOT ──
 *
 * The shortlist used to be one sum for everybody: style match, the stat the
 * character needs, minus its difficulty. Difficulty was a straight penalty,
 * so every queen in every season shortlisted the safest thing she could
 * carry and the hard characters came off the board only when the easy ones
 * had gone. Nobody ever CHOSE a tightrope.
 *
 * A queen picking a character is answering a question about her week, not
 * solving an optimisation. Three things decide how far she reaches:
 *
 *   NERVE       boldness. Some queens want the hard one because it is hard.
 *   STANDING    what her record looks like. A queen who has been safe four
 *               weeks running needs a moment more than she needs a floor;
 *               a queen who has been winning does not have to gamble.
 *   THE ROOM    how late she picks. Reaching is cheap when the board is full
 *               and expensive when it is nearly empty.
 *
 * `appetite` is the result, and it flips the sign on difficulty: at zero the
 * old behaviour, hard characters penalised; high, and difficulty becomes the
 * reason to take one. The variance in the taping does the rest — see the
 * swing in the round loop, where a hard character is both the best and the
 * worst thing that can happen to her.
 */
function appetiteFor(player, record = [], slot = 0, field = 1) {
  const st = player?.stats || {};
  const bold = Number.isFinite(Number(st.boldness)) ? Number(st.boldness) : 5;

  /* WHAT SHE HAS TO SHOW FOR HERSELF. Wins and highs are a floor she can
     stand on; a stack of safes is the thing that makes a queen reach. Reading
     the record rather than a stat because it is the season talking, not the
     roster: the same queen wants different things in week two and week six. */
  const wins = record.filter(r => r === 'WIN').length;
  const highs = record.filter(r => r === 'HIGH').length;
  const trouble = record.filter(r => r === 'BTM' || r === 'BTM2' || r === 'BTM3' || r === 'LOW').length;
  const invisible = record.filter(r => r === 'SAFE').length;

  let a = (bold - 5) / 5;                    // nerve, -1 to 1
  a += Math.min(0.7, invisible * 0.18);      // safe for weeks: she needs a moment
  a += Math.min(0.5, trouble * 0.22);        // in trouble: nothing left to protect
  a -= Math.min(0.8, (wins * 0.5 + highs * 0.2)); // already proved it: no need
  // Late in the order the board is thin and a reach is a luxury.
  a -= (slot / Math.max(1, field)) * 0.35;
  return Math.max(-1, Math.min(1.4, a));
}

/**
 * Her shortlist, best first.
 *
 * A queen reaches for a character that suits her style and that she can carry
 * — and how far past "can carry" she is willing to go is `appetite`.
 */
function wantsFor(player, appetite = 0, rng = Math.random) {
  const d = dragOf(player);
  return [...SNATCH_CHARACTERS]
    .map(c => {
      /* BIG ENOUGH TO OUTRANK TASTE, deliberately. The two tests pulling on
         this term want opposite things — a spooky queen must reach for a
         spooky character, and a room of numerically identical queens must not
         all reach for the SAME one — and a single mid-sized term cannot do
         both. So the scales are separated: style is the coarse sort and taste
         is the fine one, wide enough to shuffle a whole style block and still
         narrow enough to lose to a match. */
      const styleFit = c.style === d.style ? 5 : 0;
      /* HALF A PENALTY, because difficulty is no longer a quality gap — it
         is a choice about how wide the night is. Subtracting it in full made
         the five easiest characters lead every shortlist by more than taste
         could overcome, so a room of identical queens still converged on the
         same handful and one of them took six others' first choice. */
      const canCarry = d[c.needs] - c.difficulty * 0.5;
      /* THE REACH. Positive appetite pays for difficulty instead of charging
         for it, so a bold queen with nothing to lose shortlists the Silent
         Film Star on purpose rather than inheriting it. */
      /* AND IN SCALE WITH THE OTHER TERMS, which is what it was not. At 0.9
         this ran to +/-6.3 against a style match worth 3 and a craft range of
         about 2.5, so appetite was not one consideration among three — it was
         the shortlist, and every queen with the same nerve reached for the
         same hardest character. Measured on an identical cast: six of twelve
         queens lost their first choice to one queen. */
      const reach = appetite * c.difficulty * 0.6;
      /* ── AND WHO SHE HAPPENS TO DO ──
         Craft says which characters she COULD carry; it does not say which one
         she has been doing in her kitchen since she was fourteen, and that is
         most of why a queen picks somebody. Without it two queens with the
         same numbers want the same person in the same order, and a roster
         player who arrives with no drag stats gets every stat defaulted to 5
         — so a whole cast of them produced ONE shortlist, thirteen times.
         That is the bug this fixes and it is worth stating plainly: every
         queen wanted Richard Simmons, the queen picking first took him,
         twelve of thirteen were recorded as having lost their pick to her,
         and the shared top eight ran out so four queens got nothing at all. */
      /* SMALL ENOUGH TO LOSE TO CRAFT. At ±3.5 it beat the +3 a style match
         is worth, so a spooky queen stopped reaching for spooky characters —
         taste has to break ties, not overrule the two things the shortlist is
         actually about. */
      const personal = (rng() - 0.5) * 6;
      return { c, score: styleFit + canCarry + reach + personal + (d.comedy - 5) * 0.2 };
    })
    .sort((a, b) => b.score - a.score)
    /* LONG ENOUGH THAT THE BOARD CANNOT EMPTY. Eight was shorter than the
       cast, so a room that agreed with itself ran out of characters. */
    .slice(0, 20)
    .map(x => x.c.id);
}

export function assign(ctx) {
  const { living, players, rng, miniWinner, mini, bond, state } = ctx;
  const order = pickOrder({ living, miniWinner, mini, rng });
  /* HER APPETITE IS HERS, and it depends on where she is picking and what her
     season looks like so far — so it is computed per queen, in order, rather
     than once for the room. */
  const appetite = {};
  const choices = {};
  order.forEach((n, i) => {
    appetite[n] = appetiteFor(players[n], state?.record?.[n] || [], i, order.length);
    choices[n] = wantsFor(players[n], appetite[n], rng);
  });
  const { picks, events } = contestFor({ order, choices, players, rng, bond });
  const roles = Object.fromEntries(order.map(n => [n, 'standard']));
  /* WHAT SHE WAS DOING WHEN SHE PICKED, on the pick itself — so the screen
     can say she reached rather than leaving the viewer to infer it from a
     difficulty number nobody is shown. */
  for (const n of order) {
    const c = characterById(picks[n]?.choice);
    if (!c) continue;
    picks[n].difficulty = c.difficulty;
    picks[n].reached = appetite[n] > 0.25 && c.difficulty >= 4;
    picks[n].played = appetite[n] < -0.1 && c.difficulty <= 2;
  }
  return {
    roles, teams: [], order, picks, events, appetite,
    scenes: [{ step: 'choice', kind: 'snatch-picks', data: { order, picks, appetite } }],
  };
}

export function prepare(ctx) {
  const r = prepareRoom(ctx);
  const w = walkthrough({ ...ctx, prep: r.prep });
  return {
    prep: w.prep,
    events: [...r.events, ...w.events],
    scenes: [...r.scenes, { step: 'prep', kind: 'walkthrough', data: { notes: w.notes } }],
  };
}

// ── THE TAPING, AS THE SHOW PLAYS IT ──────────────────────────────────
//
// The host reads a card to one of two celebrity contestants, goes down the
// panel to a few of the queens, and each one answers AS HER CELEBRITY. Then
// the contestant turns over what she wrote, and a queen who wrote the same
// thing scores her a point. See js/dr/data/snatch-script.js for the format
// and js/dr/data/snatch-kits for what each celebrity says.
//
// THE NUMBERS STILL DECIDE EVERYTHING. Every round, every queen gets a score
// (the model below is unchanged); the words are chosen FROM that score and
// never the other way round. A queen scoring a laugh or better gets her
// celebrity's real answer to that card; a queen who is flat reaches for the
// obvious answer in the voice; a queen who is dying loses the voice too.
// The screen renders what is picked here and chooses nothing.

/** The laugh-o-meter's words, and where each starts. */
const TIERS = [[KILL, 'kill'], [6, 'laugh'], [FLOP, 'flat'], [-99, 'bomb']];
const tierOf = s => TIERS.find(([min]) => s >= min)[1];
const laughOf = s => Math.round(Math.max(0, Math.min(10, s)) * 10) / 10;

/** Who taunts on a panel: the franchise rule, unchanged. */
const NICE = new Set(['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat']);
const VILLAIN = new Set(['villain', 'mastermind', 'schemer']);
function mayHeckle(p) {
  const a = p?.archetype || '';
  if (NICE.has(a)) return false;
  if (VILLAIN.has(a)) return true;
  const st = p?.stats || {};
  return (Number(st.strategic) || 5) >= 6 && (Number(st.loyalty) || 5) <= 4;
}

/** The two contestants at the desk: Michelle, and tonight's other judge. */
function contestantsFor(cfg = {}) {
  const other = cfg.guest?.name
    ? { id: `guest:${cfg.guest.slug || String(cfg.guest.name).toLowerCase().replace(/\s+/g, '-')}`, name: cfg.guest.name, slug: cfg.guest.slug || null }
    : (() => { const j = judgeById(cfg.rotatingId || 'carson'); return j ? { id: j.id, name: j.name } : { id: 'ross', name: 'Ross Mathews' }; })();
  return [{ id: 'michelle', name: 'Michelle Visage' }, other];
}

export function perform(ctx) {
  const { living, players, assignment, prep, rng, bond, cfg } = ctx;
  const performances = {};
  const events = [];
  const hostBeats = [];
  const charOf = n => characterById(assignment.picks[n]?.choice);
  const seat = (assignment.order || []).filter(n => living.includes(n));
  for (const n of living) if (!seat.includes(n)) seat.push(n);

  // Lines are picked here, once, and never twice in one taping.
  const used = new Set();
  const pick = (pool, key = '') => {
    const list = pool || [];
    if (!list.length) return '';
    const fresh = list.filter(l => !used.has(key + l));
    const from = fresh.length ? fresh : list;
    const l = from[Math.floor(rng() * from.length)];
    used.add(key + l);
    return l;
  };

  /* ── DIFFICULTY BUYS VARIANCE, AND IT HAS TO BE DRAWN ONCE ──
     Whether the character WORKS is one fact about the night, not six
     independent ones, so it is drawn once and carried into every round: an
     easy character lands near her craft almost every time, a hard one is
     either the best thing on that desk or the thing that ends her week. The
     upside is worth more than the downside is cheap (measured: symmetric,
     hard characters bombed 40% and shone 7%), and it stays smaller than
     craft, or a gamble on the character becomes the whole night. */
  const nightOf = {};
  for (const n of living) {
    const c = charOf(n);
    const diff = c ? c.difficulty : 3;
    const swing = noise(rng, 0.08 + diff * 0.2);
    nightOf[n] = swing > 0 ? swing * (1 + diff * 0.5) : swing;
  }

  /* One score for one moment on the panel. `needs` carries the impression:
     a part she has to INHABIT leans on acting, a loud quotable one on
     comedy, and the total weight is the same either way. */
  const scoreOf = n => {
    const d = dragOf(players[n]);
    const c = charOf(n);
    const fit = c
      ? (c.style === d.style ? 1.2 : 0) - Math.max(0, c.difficulty - d[c.needs] / 2) * 0.22
      : -1;
    const wComedy = c?.needs === 'acting' ? 0.34 : 0.62;
    const wActing = 0.9 - wComedy;
    const s = d.comedy * wComedy + d.acting * wActing + fit + (prep[n] || 0)
      - (assignment.picks[n]?.penalty || 0) + (nightOf[n] || 0) + noise(rng, 1.5);
    return Math.round(s * 100) / 100;
  };

  const contestants = contestantsFor(cfg);
  // Ru calls them by first name at the desk; the full name is for the intro.
  const first = c => String(c.name).split(' ')[0];
  const openLine = fillSnatch(pick(SHOW_OPEN), { x: contestants[0].name, y: contestants[1].name });

  // ── THE PANEL IS INTRODUCED ──
  const intros = seat.map(n => {
    const c = charOf(n);
    const kit = kitFor(c?.id);
    const s = scoreOf(n);
    const tier = tierOf(s);
    /* A good intro is her celebrity's own line. A dying one is the name and
       the catchphrase and a silence. */
    const text = (tier === 'kill' || tier === 'laugh') && kit?.intro?.length
      ? quoteLine(pick(kit.intro, `intro:${n}:`))
      : fillSnatch(pick(tier === 'bomb' ? INTRO_DEAD : INTRO_FLAT, 'intro:'), { c: c?.name || 'somebody', catch: kit?.catch || '' });
    return { name: n, character: c?.name || null, characterId: c?.id || null, text, tier, laugh: laughOf(s) };
  });

  const perRound = Object.fromEntries(living.map(n => [n, []]));
  const asked = Object.fromEntries(living.map(n => [n, 0]));
  const bombs = Object.fromEntries(living.map(n => [n, 0]));
  const passedOver = new Set();
  const engaged = {};
  const points = [0, 0];
  const deck = [...SNATCH_QUESTIONS];
  const rounds = [];
  const perAsk = living.length >= 9 ? 4 : 3;

  for (let r = 0; r < ROUNDS; r++) {
    // Every queen plays every round; the edit shows a few of them.
    const beat = living.map(n => ({ name: n, score: scoreOf(n) }));
    for (const b of beat) perRound[b.name].push(b.score);
    const scoreNow = n => perRound[n][perRound[n].length - 1];

    const q = deck.splice(Math.floor(rng() * deck.length), 1)[0] || SNATCH_QUESTIONS[r % SNATCH_QUESTIONS.length];
    const asker = r % 2;
    const x = contestants[asker];
    const contestantCard = q.obvious[Math.floor(rng() * q.obvious.length)];

    /* ── WHO HE GOES TO ──
       The queens he has asked least, in the order they sit, so everybody is
       heard across the taping and nobody's turn gives the round away. A queen
       who has died twice is not asked again — which is the cruellest thing the
       real host does, and he does it without comment. */
    const newlyPassed = [];
    for (const n of living) {
      if (bombs[n] >= 2 && !passedOver.has(n)) { passedOver.add(n); newlyPassed.push(n); }
    }
    const pool = seat.filter(n => !passedOver.has(n));
    const chosen = [...pool].sort((a, b) => (asked[a] - asked[b]) || (rng() - 0.5)).slice(0, Math.min(perAsk, pool.length));
    const featured = seat.filter(n => chosen.includes(n));

    // ── THE HOST DOES SOMETHING WITH ONE OF THEM ──
    // The best answer or the worst: the middle is not television.
    // Her number before the host touched it, so a reader can see why he chose her.
    const pre = Object.fromEntries(featured.map(n => [n, scoreNow(n)]));
    const byScore = [...featured].sort((a, b) => pre[b] - pre[a]);
    const ends = [byScore[0], byScore[byScore.length - 1]].filter(n => n && (engaged[n] || 0) < 2);
    let rope = null;
    if (ends.length && ENGAGE_PER_ROUND) {
      const n = ends[rng() < 0.5 ? 0 : ends.length - 1];
      engaged[n] = (engaged[n] || 0) + 1;
      const d = dragOf(players[n]);
      const takes = (d.comedy + (Number(players[n]?.stats?.boldness) || 5)) / 2;
      const worked = rng() < 0.25 + takes / 20;
      const delta = worked ? ROPE : -HANG;
      perRound[n][perRound[n].length - 1] = Math.round((scoreNow(n) + delta) * 100) / 100;
      hostBeats.push({ round: r + 1, name: n, worked, delta });
      const good = pre[n] >= 6;
      const after = laughOf(scoreNow(n));
      /* A rescue that helped without landing is its own line: "this time she
         gets the laugh" cannot sit over a meter reading a chuckle. */
      const kind = worked ? (good ? 'push' : after >= 6 ? 'rescue' : 'partial') : (good ? 'push' : 'rescue');
      rope = { name: n, worked, laugh: after,
        text: pick((worked ? RU_ROPE.worked : RU_ROPE.failed)[kind], 'rope:') };
      events.push(worked
        ? evt('host-played-along', { players: [n], pop: { [n]: 2 }, data: { round: r + 1, character: charOf(n)?.name || null } })
        : evt('left-to-hang', { players: [n], pop: { [n]: -1 }, data: { round: r + 1, character: charOf(n)?.name || null } }));
    }

    const answers = featured.map(n => {
      // Her answer is her first attempt; the host's follow-up comes after it.
      const s = pre[n];
      const tier = tierOf(s);
      const c = charOf(n);
      const kit = kitFor(c?.id);
      asked[n] += 1;
      if (tier === 'bomb') bombs[n] += 1;
      let card; let say;
      const own = kit?.a?.[q.id];
      if ((tier === 'kill' || tier === 'laugh') && own) {
        [card, say] = own;
        say = quoteLine(say);
      } else {
        /* THE OBVIOUS ANSWER, which is the one the contestant is most likely
           to have written — so the queen with nothing is the queen who
           matches. */
        card = rng() < 0.3 ? contestantCard : q.obvious[Math.floor(rng() * q.obvious.length)];
        say = fillSnatch(pick(tier === 'bomb' ? BOMB_SAYS : FLAT_SAYS, `say:${tier}:`),
          { card, catch: kit?.catch || '', c: c?.name || 'her celebrity' });
      }
      const ru = pick(RU_REACTS[tier], `ru:${tier}:`);
      return {
        name: n, character: c?.name || null, characterId: c?.id || null,
        card, say, tier, laugh: laughOf(s), score: pre[n], ru,
        rope: rope && rope.name === n ? { worked: rope.worked, text: rope.text, laugh: rope.laugh } : null,
      };
    });

    // ── THE CROSS-TALK ──
    // The funniest queen on this card turns on somebody else's answer. A
    // queen allowed to taunt heckles; a nice one builds on the bit instead.
    let cross = null;
    const top = [...answers].sort((a, b) => b.laugh - a.laugh)[0];
    const targets = answers.filter(a => a.name !== top?.name);
    if (top && targets.length && top.laugh >= 6 && rng() < 0.45) {
      const t = targets[Math.floor(rng() * targets.length)];
      const kit = kitFor(top.characterId);
      if (mayHeckle(players[top.name]) && kit?.heckle?.length) {
        const landed = top.laugh >= 6;
        cross = { kind: 'heckle', from: top.name, to: t.name, laugh: top.laugh,
          text: quoteLine(fillSnatch(pick(kit.heckle, `heckle:${top.name}:`), { b: t.character || t.name })) };
        events.push(evt('snatch-heckle', {
          players: [top.name, t.name], bond: [[top.name, t.name, -1]],
          pop: { [top.name]: landed ? 1 : -1, [t.name]: landed ? -0.5 : 0 },
          data: { round: r + 1, from: top.character, to: t.character },
        }));
      } else {
        cross = { kind: 'assist', from: top.name, to: t.name, laugh: Math.max(top.laugh, t.laugh),
          text: fillSnatch(pick(ASSIST[t.laugh >= 6 ? 'build' : 'rescue'], 'assist:'), { c: top.character || top.name, t: t.character || t.name }) };
        events.push(evt('snatch-assist', {
          players: [top.name, t.name], bond: [[top.name, t.name, 1]],
          pop: { [top.name]: 1, [t.name]: 1 },
          data: { round: r + 1, from: top.character, to: t.character },
        }));
      }
    }

    // ── THE CARD, TURNED OVER ──
    const matches = answers.filter(a => a.card === contestantCard).map(a => a.name);
    if (matches.length) points[asker] += 1;
    const m = matches.map(n => answers.find(a => a.name === n)?.character || n).join(' and ');
    const reveal = {
      card: contestantCard, matches,
      text: fillSnatch(pick(matches.length ? REVEAL.match : REVEAL.miss, 'reveal:'), { x: first(x), card: contestantCard, m }),
    };

    rounds.push({
      round: r + 1, qid: q.id, question: q.text, asker,
      ask: fillSnatch(pick(ASK, 'ask:'), { x: first(x), q: q.text.replace('___', 'blank') }),
      answers, cross, reveal,
      passed: newlyPassed.map(n => ({ name: n, character: charOf(n)?.name || null,
        text: fillSnatch(pick(PASSED_OVER, 'passed:'), { c: charOf(n)?.name || n }) })),
      // Every queen's number for the round, for readers who want the whole taping.
      scores: beat.map(b => ({ name: b.name, score: scoreNow(b.name) })),
    });
  }

  // Two queens sitting next to each other who like each other build a bit
  // together, and the whole taping lifts for both. Snatch Game is the one
  // challenge where being liked is worth points rather than votes.
  for (let i = 1; i < seat.length; i++) {
    const a = seat[i - 1];
    const b = seat[i];
    if (!perRound[a] || !perRound[b]) continue;
    if (bond(a, b) >= 2 && rng() < 0.4) {
      perRound[a] = perRound[a].map(s => Math.round((s + 0.8) * 100) / 100);
      perRound[b] = perRound[b].map(s => Math.round((s + 0.8) * 100) / 100);
      events.push(evt('double-act', {
        players: [a, b], bond: [[a, b, 1]], pop: { [a]: 2, [b]: 2 },
        data: { characters: [charOf(a)?.name || null, charOf(b)?.name || null] },
      }));
    }
  }

  for (const n of living) {
    const scores = perRound[n];
    const perf = scores.reduce((s, x) => s + x, 0) / scores.length;
    const flops = scores.filter(s => s < FLOP).length;
    const kills = scores.filter(s => s > KILL).length;
    /* DYING IS WHAT THE VIEWER SAW: the host stopped going to her after two
       dead answers on camera. Counting flops over rounds nobody was shown
       called a queen dead whose every aired answer got a laugh. */
    if (passedOver.has(n)) {
      events.push(evt('dying', {
        players: [n], pop: { [n]: -3 }, state: { snatchDied: n },
        data: { character: charOf(n)?.name || null, flops },
      }));
    }
    performances[n] = {
      perf: Math.round(perf * 100) / 100,
      moment: kills >= 2,
      risk: riskFor(players[n], rng),
      role: 'standard',
      team: null,
      parts: { base: perf, prep: prep[n] || 0 },
      detail: {
        character: charOf(n)?.name || null,
        characterId: assignment.picks[n]?.choice || null,
        rounds: scores, flops, kills,
        hostBeats: hostBeats.filter(h => h.name === n),
      },
    };
  }

  return {
    performances,
    runwayOverride: null,
    events,
    scenes: [{
      step: 'maxi-pre', kind: 'snatch-taping',
      data: {
        contestants, open: openLine, intros, rounds, points, hostBeats,
        close: pick(SHOW_CLOSE, 'close:'),
      },
    }],
  };
}
