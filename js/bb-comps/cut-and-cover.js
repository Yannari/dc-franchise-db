// ══════════════════════════════════════════════════════════════════════
// bb-comps/cut-and-cover.js — Cut and Cover
// ══════════════════════════════════════════════════════════════════════
//
// Identical boards, a crate of irregular pieces each, and one image to build.
// The boards are set close enough together that everybody can see how far
// everybody else has got, and that is not set dressing — it is the whole
// competition, and it is the thing this one owns.
//
// WHAT THIS REPLACES. One `scoreField` roll and four beats, of which the good
// one ("somebody leads and loses it") was picked at random from the top three
// finishers rather than emerging from anything. The trap named in the rules —
// that a frame which went together easily early has to come apart at the end —
// was never simulated at all. It was the most interesting sentence in the comp
// and it was a caption.
//
// It is now the mechanic, and it is a DEBT. A piece that nearly fits goes in
// like any other and looks exactly like progress; the board fills, the count
// climbs, and nobody watching — including the houseguest — can tell the sound
// placements from the ones that will have to come out. When it finally jams,
// the teardown is proportional to how much was forced, so the houseguest who
// looked fastest for eight minutes is the one pulling a third of their board
// apart at the end. Pace is therefore a real decision made continuously:
// pushing places more pieces per pass and forces more of them.
//
// THE SIGHTLINE, which is what makes this competition social rather than a
// race run side by side. Every board is public, so information is the currency
// out there, and there are exactly three things to do with it:
//
//   COPY  — look at somebody who is ahead and clean, and take their approach.
//           A real transfer: it lowers your own misfit rate for the rest of the
//           night. Self-interested, available to anybody with the sense to do
//           it, and it costs the person copied nothing they can prove.
//   BLOCK — stand over your own board, turn it, put your back in the way. The
//           houseguest who was reading you wastes the pass. Villain archetypes
//           always have it in them, nice ones never, neutrals need the brains
//           and the disloyalty both.
//   WARN  — tell an ally their corner is wrong before it costs them a teardown.
//           Only a nice archetype does this, it is worth a great deal to the
//           person warned, and it is one of the few genuinely kind acts a
//           competition in this house can contain.
//
// DELIBERATELY DIFFERENT FROM THE RUN. The final's part two also has a rebuild
// — a section done in the wrong order comes apart with the clock running — and
// two competitions with the same trap is how a library ends up with twins. The
// separation is the audience: The Run is explicitly solo, "with nobody watching
// the other one go", so it has no sightline and never can. This one is nothing
// but sightlines. See also hold-the-line.js, which had to be rebuilt for
// exactly this reason.
//
// NOTE ON `breakdown`: one key per player — the Debug tab renders keys as rows.
// ══════════════════════════════════════════════════════════════════════

import { players } from '../core.js';
import { pStats, pronouns } from '../players.js';
import { dangerLevel } from '../bb/strategy.js';
import { getBond } from '../bonds.js';
import { aptitude, beat, toResult, makePicker, throwRead, clamp, THROW_LINES, vb } from './_shared.js';

const NEUTRAL = { sub: 'they', obj: 'them', pos: 'theirs', posAdj: 'their', ref: 'themselves', Sub: 'They', Obj: 'Them', PosAdj: 'Their' };
const pron = name => { try { return pronouns(name) || NEUTRAL; } catch { return NEUTRAL; } };

/** Pieces in the image, and how many passes the yard gets before the horn. */
const TILES = 30;
const MAX_PASSES = 16;

/**
 * The tuning for what a houseguest DOES, as named weights.
 *
 * Kept apart from the stat profile deliberately — `stats` is what the board is
 * scored on and is read through `aptitude()` exactly once. These decide who
 * copies, who blocks and who warns, which is character rather than skill, and
 * writing them as bare `stat * 0.4` arithmetic makes a decision model
 * indistinguishable from a hand-copied second profile.
 */
const LOOK = {
  // How often somebody lifts their head at all.
  base: 0.3, curious: 0.34, behindPull: 0.3,
  // Turning a look into a copied approach rather than a panic.
  senseToCopy: 0.62, copyGain: 0.055, copyCap: 0.26,
  // Panic costs pace, which costs accuracy later.
  panicPace: 0.14,
};
const BLOCKING = { nerve: 0.5, cold: 0.6, floor: 0.42 };

// ── narration ─────────────────────────────────────────────────────────

const OPEN_LINES = [
  'Identical boards, identical crates, one image, and no partition between any of them. Everybody can see everybody. That turns out to matter more than the puzzle does.',
  'The crates go over and the pieces come out in a heap. There is no edge to start from and no picture on the box, and for about ninety seconds the yard is completely silent.',
  'Six boards in a row, close enough to touch, and the same image in every crate. The first thing every single one of them does is look at what everybody else is doing.',
  'It is a jigsaw, which sounds like the easiest thing this house has ever been asked to do, right up until the moment somebody realises a piece they put in four minutes ago is in the wrong place.',
];

/** "1 pieces of correct" made it to a screenshot. */
const pcs = c => (c === 1 ? '1 piece' : `${c} pieces`);

const PROGRESS = [
  (n, p, c) => `${n} has ${pcs(c)} down and a rhythm going, working out from the middle rather than the edges, which is either clever or about to be a problem.`,
  (n, p, c) => `${c} down for ${n}. ${p.Sub} ${vb(p, 'has', 'have')} stopped looking at the crate and started looking at the gaps, which is when people get quick.`,
  (n, p, c) => `${n} is sorting before placing — colour, then edge, then shape — and it is slow and it is ${pcs(c)} of correct.`,
  (n, p, c) => `${n} gets a whole corner in one run and sits back with ${c} placed, allowing ${p.ref} exactly one second of being pleased about it.`,
  (n, p, c) => `${pcs(c)} for ${n}, most of them in the last two minutes. Nobody out here is going slowly on purpose any more.`,
  // A ten-board yard draws on this pool ten-plus times a night and the picker
  // can only defer a repeat for as long as the pool lasts.
  (n, p, c) => `${n} builds the edge first, all the way round, and only then starts filling it — ${pcs(c)} in and not one of them guessed at.`,
  (n, p, c) => `${n} has ${pcs(c)} placed and has not spoken to anybody since the crates went over.`,
  (n, p, c) => `Two pieces in the same second for ${n}, then a third. ${c} down, and ${p.sub} ${vb(p, 'is', 'are')} suddenly the one to watch.`,
  (n, p, c) => `${n} clears the whole bottom row and sits at ${c}, holding the next piece up to the light like that will help.`,
  (n, p, c) => `${pcs(c)} for ${n}, placed slowly, checked twice each, which is the least exciting way to be winning a competition.`,
];

const FORCED = [
  (n, p) => `${n} turns a piece over twice, decides it is close enough, and presses it in. It is close enough. It is not right.`,
  (n, p) => `A piece goes in under ${n}'s thumb with slightly more force than a piece that fits needs.`,
  n => `${n} places one that nearly matches on three sides. Three sides is a lot. Three is not four.`,
  (n, p) => `${n} knows that one is wrong the moment ${p.sub} ${vb(p, 'lets', 'let')} go of it, and leaves it there anyway, because taking it out means admitting the two either side of it are wrong too.`,
];

const TEARDOWN = [
  (n, p, k) => `It jams. ${n} has nowhere to put the piece in ${p.posAdj} hand, and the reason is about nine minutes old — ${k} pieces come out of the board, and the sound of it turns every head in the yard.`,
  (n, p, k) => `${n} pulls ${k} pieces out in one sweep of the forearm, which is faster than taking them out one at a time and looks exactly as bad as it is.`,
  (n, p, k) => `The whole right-hand section is wrong. ${n} takes ${k} pieces off the board and starts it again from the frame, and does not say anything while ${p.sub} ${vb(p, 'does', 'do')} it.`,
  (n, p, k) => `${k} pieces. That is what the shortcut cost ${n}, collected all at once, at the worst possible moment.`,
];

const COPY_LINES = [
  (n, p, t) => `${n} spends a long moment looking at ${t}'s board instead of ${p.posAdj} own, and comes back doing it ${t}'s way — sorting by shape first. It works immediately.`,
  (n, p, t) => `Whatever ${t} has worked out about the sky section, ${n} works it out too, from four feet away, without asking.`,
  (n, p, t) => `${n} watches ${t}'s hands rather than ${t}'s board, which is the smarter thing to watch, and starts placing faster within a minute.`,
  (n, p, t) => `${t} has the approach and ${n} takes it. There is no rule against it and everybody out there would do the same, and ${t} still looks up like something has been stolen.`,
];

const PANIC_LINES = [
  (n, p, t) => `${n} looks up, sees how far ${t} has got, and starts moving faster than ${p.sub} can actually check. That is the whole trap and ${p.sub} ${vb(p, 'walks', 'walk')} straight into it.`,
  (n, p, t) => `One glance at ${t}'s board is enough to change how ${n} is working, and not for the better.`,
  (n, p) => `${n} stops sorting. From here ${p.sub} ${vb(p, 'is', 'are')} just putting pieces where they nearly go, and everybody can see it from the outside except ${p.obj}.`,
];

const BLOCK_LINES = [
  (n, p, t) => `${n} turns ${p.posAdj} board a few degrees away from ${t} and leans in over it. It is not subtle and it is not against the rules.`,
  (n, p, t) => `${t} looks over and gets ${n}'s back. Deliberately. For a full minute.`,
  (n, p, t) => `${n} works out that ${t} has been reading ${p.posAdj} board and simply stops letting ${p.obj} — elbows out, shoulders round, the whole thing hidden.`,
];

const BLOCKED_LINES = [
  (n, p, t) => `${n} looks up for the answer and finds ${t} standing in the way of it. The pass is wasted and ${p.sub} ${vb(p, 'goes', 'go')} back to ${p.posAdj} own board with nothing.`,
  (n, p, t) => `There is nothing to see: ${t} has the board covered. ${n} loses the better part of a minute finding that out.`,
];

const WARN_LINES = [
  (n, p, t) => `${n} sees it from two boards away — the corner ${t} has built is wrong — and says so out loud, which costs ${p.obj} the lead and saves ${t} about four minutes.`,
  (n, p, t) => `"Your top left. Check your top left." ${n} does not have to say it. ${t} takes three pieces out and finds the fourth one was the problem.`,
  (n, p, t) => `${n} stops working entirely to tell ${t} that the section ${t} is proudest of has to come out. ${t} argues for ten seconds and then sees it.`,
];

const STRUGGLE = [
  (n, p) => `${n} has been holding the same piece for a while now, turning it, and it has not fitted anywhere yet.`,
  n => `${n} is doing the thing where you try the same piece in the same gap three times in case it changed.`,
  (n, p) => `${n} has stopped looking at anybody else's board, which at this point is less a strategy than an unwillingness to know.`,
];

const WIN_LINES = [
  (n, p) => `${n} puts the last piece in, checks it once because ${p.sub} ${vb(p, 'does', 'do')} not quite believe it, and hits the buzzer.`,
  (n, p, k) => `The last piece goes in clean and ${n} hits the buzzer at ${k} passes. Nobody else is inside five pieces of ${p.obj}.`,
  n => `${n} finishes it. The buzzer goes and the rest of the yard keeps working for a second out of pure momentum before it registers.`,
  (n, p) => `${n} slots the last one and does not celebrate at all — just puts both palms flat on the board and breathes out.`,
];

/** Villain intent, on the competition's own rng. Mirrors social-manipulation.js. */
const VILLAIN_ARCHETYPES = new Set(['villain', 'mastermind', 'schemer']);
const NICE_ARCHETYPES = new Set(['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat']);
const archOf = name => players.find(p => p.name === name)?.archetype || '';
function canBlock(name, rng) {
  const arch = archOf(name);
  if (VILLAIN_ARCHETYPES.has(arch)) return true;
  if (NICE_ARCHETYPES.has(arch)) return false;
  const st = pStats(name);
  return rng() < (st.strategic / 10) * ((10 - st.loyalty) / 10);
}
const canWarn = name => NICE_ARCHETYPES.has(archOf(name));

export const cutAndCover = {
  id: 'bb-mental-puzzle',
  name: 'Cut and Cover',
  category: 'puzzle',
  types: ['hoh', 'veto', 'arena', 'tiebreaker'],
  desc: 'Houseguests race to build one complete image out of a crate of irregular pieces, working on identical boards set close enough together that everybody can see exactly how far everybody else has got — and how they are going about it. The pieces only look interchangeable: one forced in because it nearly fits sits there looking like progress until the board jams, and then that whole section has to come out with the clock running. Anybody can copy the approach of somebody ahead of them, stand in the way of somebody reading their board, or warn a friend that the corner they are proudest of is wrong. The first houseguest to place every piece and hit their buzzer wins.',
  // Temperament is out of the weights and into the spread. Steadiness is not
  // the skill here — seeing the picture is — and a hothead can be a very fast
  // and very erratic puzzler. See the note in _shared.js.
  stats: { mental: 0.50, intuition: 0.28, strategic: 0.22 },
  spreadStat: 'temperament',
  // What decides who copies, who blocks and who warns, drawn apart from the
  // weights because none of it makes anybody better at the puzzle.
  effectStats: { label: 'what a houseguest does when they look up', strategic: 0.40, loyalty: 0.35, boldness: 0.25 },

  simulate(participants, context, api, rng) {
    const beats = [];
    const steps = [];
    const breakdown = {};
    const progSay = makePicker(rng);
    const forcedSay = makePicker(rng);
    const tearSay = makePicker(rng);
    const copySay = makePicker(rng);
    const panicSay = makePicker(rng);
    const blockSay = makePicker(rng);
    const blockedSay = makePicker(rng);
    const warnSay = makePicker(rng);
    const struggleSay = makePicker(rng);
    const threwSay = makePicker(rng);

    const state = participants.map(name => {
      const s = pStats(name);
      const t = throwRead(name, context, rng);
      const skill = aptitude(name, cutAndCover.stats) / 10;
      return {
        name, skill,
        vol: clamp((10 - s.temperament) / 10, 0, 1),
        // How reliably a placement is a sound one. Copying raises it.
        read: 0.34 + skill * 0.48,
        copied: 0,
        // Pushing places more pieces and forces more of them.
        pace: 1,
        placed: 0, bad: 0, teardowns: 0, lost: 0, forced: 0,
        base: Math.round(aptitude(name, cutAndCover.stats) * 100) / 100,
        sense: clamp(s.strategic / 10, 0, 1),
        loyalty: clamp(s.loyalty / 10, 0, 1),
        nerve: clamp(s.boldness / 10, 0, 1),
        curiosity: clamp(s.intuition / 10, 0, 1),
        threw: t.threw, threwChance: t.chance,
        haveNot: (context.haveNots || []).includes(name),
        danger: dangerLevel(name, context),
        luck: 0, hnCost: 0, log: [], blocking: false, warned: false,
        done: false, donePass: 0,
      };
    });

    const live = () => state.filter(p => !p.done);

    beats.push(beat(OPEN_LINES[Math.floor(rng() * OPEN_LINES.length)],
      participants.slice(0, 3), 'THE BOARDS'));
    steps.push({ kind: 'open', pass: 0, placed: {}, bad: {} });

    // The step's own fields go FIRST and the per-player maps last, so nothing a
    // caller passes can shadow them. Written the other way round, the win step
    // — which carried a scalar `placed` for the winner — quietly replaced the
    // whole board map with a single number, and the screen drew the last card
    // of the competition using the second-to-last card's boards. It looked
    // completely plausible: the winner's board just sat three pieces short of
    // the buzzer they had visibly hit.
    const say = (text, who, badgeText, badgeClass, step) => {
      beats.push(beat(text, who, badgeText, badgeClass));
      steps.push({
        ...step,
        placed: Object.fromEntries(state.map(p => [p.name, p.placed])),
        // The debt is recorded for the debug tab. It is never shown on a board.
        bad: Object.fromEntries(state.map(p => [p.name, p.bad])),
      });
    };

    let pass = 0;
    let champ = null;
    let warnedTonight = false;

    while (!champ && pass < MAX_PASSES && live().length) {
      pass++;
      state.forEach(p => { p.blocking = false; });

      // ── who is hiding their board this pass ──
      //
      // Decided before anybody looks up, because a block has to be in place
      // before the look happens rather than being a reaction to it.
      const ahead = [...live()].sort((a, b) => b.placed - a.placed);
      for (const p of live()) {
        if (p.placed < 6 || p !== ahead[0]) continue;
        const want = p.nerve * BLOCKING.nerve + (1 - p.loyalty) * BLOCKING.cold - BLOCKING.floor;
        if (want > 0 && canBlock(p.name, rng) && rng() < want) p.blocking = true;
      }

      // ── the pass ──
      for (const p of live()) {
        const noise = (rng() - 0.5) * (0.14 + p.vol * 0.2);
        p.luck += noise;
        let n = Math.max(1, Math.round((1.5 + p.skill * 2.4) * p.pace + noise * 6));
        if (p.haveNot) { const before = n; n = Math.max(1, n - (rng() < 0.4 ? 1 : 0)); p.hnCost += before - n; }
        if (p.threw) n = Math.max(1, Math.round(n * 0.45));

        // Every placement is sound or forced, and from the outside — including
        // from the houseguest's own side of the board — they look identical.
        let forcedNow = 0;
        for (let i = 0; i < n; i++) {
          const miss = clamp(0.34 - p.read * 0.3 + (p.pace - 1) * 0.3 + noise, 0.02, 0.62);
          if (rng() < miss) forcedNow++;
        }
        p.placed = Math.min(TILES, p.placed + n);
        p.bad += forcedNow;
        p.forced += forcedNow;
        p.log.push({ pass, placed: p.placed, bad: p.bad, forced: forcedNow, pace: Math.round(p.pace * 100) / 100 });

        if (forcedNow >= 2 && rng() < 0.4) {
          say(forcedSay(FORCED)(p.name, pron(p.name)), [p.name], 'FORCES ONE', 'grey',
            { kind: 'forced', pass, who: p.name });
        } else if (p.placed >= 4 && rng() < 0.26) {
          say(progSay(PROGRESS)(p.name, pron(p.name), p.placed), [p.name], `${p.placed} PLACED`, 'challenge',
            { kind: 'progress', pass, who: p.name, count: p.placed });
        }

        // ── the board jams ──
        if (p.bad >= 4 && rng() < clamp(p.bad * 0.055, 0, 0.45)) {
          const lose = Math.min(p.placed, Math.round(p.bad * 1.6 + 1 + rng() * 3));
          p.placed = Math.max(0, p.placed - lose);
          p.lost += lose;
          p.teardowns++;
          p.bad = 0;
          // A teardown is a lesson. Nobody makes the same mistake twice in one
          // night, and the pace comes off with it.
          p.read = Math.min(0.92, p.read + 0.05);
          p.pace = Math.max(0.85, p.pace - 0.1);
          say(tearSay(TEARDOWN)(p.name, pron(p.name), lose), [p.name], `${lose} PIECES OUT`, 'red',
            { kind: 'teardown', pass, who: p.name, lost: lose });
          api.popDelta(p.name, -1);
        }

        if (p.placed >= TILES) {
          p.done = true; p.donePass = pass;
          champ = p;
          break;
        }
      }
      if (champ) break;

      // ── the sightline ──
      const field = live();
      if (field.length > 1) {
        const best = [...field].sort((a, b) => b.placed - a.placed)[0];
        for (const p of field) {
          if (p === best || p.threw) continue;
          const behind = clamp((best.placed - p.placed) / TILES, 0, 1);
          const looks = LOOK.base + p.curiosity * LOOK.curious + behind * LOOK.behindPull;
          if (rng() > looks * 0.28) continue;

          if (best.blocking) {
            p.pace = Math.min(1.5, p.pace + LOOK.panicPace);
            say(blockedSay(BLOCKED_LINES)(p.name, pron(p.name), best.name), [p.name, best.name],
              'NOTHING TO SEE', 'grey',
              { kind: 'blocked', pass, who: p.name, by: best.name });
            continue;
          }
          if (best.placed - p.placed < 6) continue;

          // Sense turns a look into an approach. Without it, the only thing
          // somebody takes from a rival's board is the fright.
          if (p.sense > LOOK.senseToCopy && p.copied < 3) {
            p.copied++;
            p.read = Math.min(0.93, p.read + LOOK.copyGain * (1 + p.sense));
            say(copySay(COPY_LINES)(p.name, pron(p.name), best.name), [p.name, best.name],
              'TAKES THE METHOD', 'challenge',
              { kind: 'copy', pass, who: p.name, from: best.name });
            api.record(p.name, 'puzzle-copied-approach', { from: best.name, pass });
            // Being read is not an injury, but nobody enjoys it.
            try { if (getBond(p.name, best.name) < 3) api.addBond(p.name, best.name, -0.3); } catch { /* no bond */ }
          } else {
            p.pace = Math.min(1.55, p.pace + LOOK.panicPace);
            // The pace always moves; the card is occasional. Narrating every
            // nervous glance in an eight-person field printed three of these a
            // pass and made the yard read as one long panic attack.
            if (rng() < 0.6) {
              say(panicSay(PANIC_LINES)(p.name, pron(p.name), best.name), [p.name, best.name],
                'RUSHES IT', 'grey',
                { kind: 'panic', pass, who: p.name, at: best.name });
            }
          }
        }

        // ── the warning ──
        //
        // The only genuinely generous act available out here, and it costs the
        // person who does it the lead. Nice archetypes only.
        for (const p of field) {
          // One warning a night, from anybody, full stop. It is the single
          // generous act in the competition and a yard where four different
          // people call out four different corners is not generous, it is a
          // working group.
          if (warnedTonight || p.warned || !canWarn(p.name) || p.placed < 8) continue;
          const friend = field.find(o => {
            if (o === p || o.bad < 5) return false;
            try { return getBond(p.name, o.name) >= 3; } catch { return false; }
          });
          if (!friend || rng() > 0.3) continue;
          p.warned = true;
          warnedTonight = true;
          const saved = Math.max(0, friend.bad - 1);
          friend.bad = 1;
          friend.read = Math.min(0.93, friend.read + 0.04);
          // Stopping to tell somebody costs a placement of your own.
          p.placed = Math.max(0, p.placed - 1);
          say(warnSay(WARN_LINES)(p.name, pron(p.name), friend.name), [p.name, friend.name],
            'CALLS IT OUT', 'green',
            { kind: 'warn', pass, who: p.name, to: friend.name, saved });
          api.addBond(p.name, friend.name, 1.4);
          api.popDelta(p.name, 2);
          api.record(friend.name, 'puzzle-warned-by', { by: p.name, pass, saved });
          api.record(p.name, 'puzzle-warned-an-ally', { ally: friend.name, pass });
          break;
        }

        if (best.blocking && rng() < 0.6) {
          const victim = field.find(o => o !== best);
          if (victim) {
            say(blockSay(BLOCK_LINES)(best.name, pron(best.name), victim.name), [best.name, victim.name],
              'COVERS THE BOARD', 'red',
              { kind: 'block', pass, who: best.name, at: victim.name });
            api.popDelta(best.name, -1);
            try { api.addBond(best.name, victim.name, -0.7); } catch { /* no bond */ }
            api.record(victim.name, 'puzzle-board-blocked', { by: best.name, pass });
          }
        }

        const stuck = field.filter(p => !p.done && p.placed < TILES * 0.4);
        if (stuck.length && pass >= 3 && rng() < 0.24) {
          const s = stuck[Math.floor(rng() * stuck.length)];
          say(struggleSay(STRUGGLE)(s.name, pron(s.name)), [s.name], 'STILL SORTING', 'grey',
            { kind: 'struggle', pass, who: s.name });
        }
      }

      // Throwing shows up as a board that never moves.
      for (const p of live()) {
        if (!p.threw || p.log.length < 3 || p.log.some(l => l.threwNarrated)) continue;
        p.log[p.log.length - 1].threwNarrated = true;
        say(threwSay(THROW_LINES)(p.name), [p.name], 'THREW IT', 'grey',
          { kind: 'threw', pass, who: p.name });
      }
    }

    // ── how it ended ──
    let onHorn = false;
    if (!champ) {
      onHorn = true;
      champ = [...state].sort((a, b) => b.placed - a.placed)[0];
      say(`The horn goes with nobody finished. It is counted off the boards instead, and ${champ.name} has ${champ.placed} of ${TILES} placed — more than anybody else out there.`,
        [champ.name], 'ON THE COUNT', 'gold',
        { kind: 'horn', pass, who: champ.name, count: champ.placed });
    }

    const cp = pron(champ.name);
    const winBadge = context.type === 'veto' ? 'VETO' : context.type === 'arena' ? 'WINS THE ARENA' : 'HOH';
    if (!onHorn) {
      const runnerUp = state.filter(p => p !== champ).sort((a, b) => b.placed - a.placed)[0];
      const gap = runnerUp ? champ.placed - runnerUp.placed : TILES;
      say(champ.teardowns > 0
        ? `${champ.name} wins Cut and Cover having pulled ${champ.lost} pieces back out of that board along the way, which is the part nobody will remember by Thursday.`
        : gap <= 3
          ? WIN_LINES[1](champ.name, cp, pass)
          : WIN_LINES[Math.floor(rng() * WIN_LINES.length)](champ.name, cp, pass),
      [champ.name], winBadge, 'gold',
      { kind: 'win', pass, who: champ.name, finalPlaced: champ.placed, teardowns: champ.teardowns });
    } else {
      say(`${champ.name} takes it on the count.`, [champ.name], winBadge, 'gold',
        { kind: 'win', pass, who: champ.name, finalPlaced: champ.placed, teardowns: champ.teardowns });
    }

    api.popDelta(champ.name, 2);
    api.record(champ.name, 'puzzle-win',
      { comp: 'cut-and-cover', passes: pass, teardowns: champ.teardowns, forced: champ.forced });

    // Placements: whoever buzzed, then by pieces on the board, then by how
    // little had to come off it.
    const others = state.filter(p => p !== champ)
      .sort((a, b) => (b.placed - a.placed) || (a.lost - b.lost));
    const ordered = [champ, ...others];

    ordered.forEach((p, i) => {
      breakdown[p.name] = {
        base: p.base, roll: Math.round(p.luck * 100) / 100,
        placed: p.placed, forced: p.forced, teardowns: p.teardowns, piecesLost: p.lost,
        read: Math.round(p.read * 100) / 100,
        pace: Math.round(p.pace * 100) / 100,
        copied: p.copied, warnedAnAlly: p.warned,
        threw: p.threw, threwChance: p.threwChance,
        haveNot: p.haveNot, haveNotPenalty: p.hnCost,
        volatility: Math.round(p.vol * 100) / 100,
        danger: Math.round(p.danger * 100) / 100,
        log: p.log,
        score: p.placed * 10 + (p.done ? 500 : 0) - p.lost + (ordered.length - i) * 0.01,
      };
    });

    const entries = ordered.map((p, i) => ({
      name: p.name,
      score: p.placed * 10 + (p.done ? 500 : 0) - p.lost + (ordered.length - i) * 0.01,
      threw: p.threw,
    }));

    return toResult(entries, {
      beats, breakdown, variant: 'puzzle',
      detail: {
        steps, passes: pass, tiles: TILES,
        finished: onHorn ? 'on-the-count' : 'buzzed',
        teardowns: state.reduce((n, p) => n + p.teardowns, 0),
        copies: state.reduce((n, p) => n + p.copied, 0),
      },
      text: `${champ.name} ${onHorn ? 'has the most of Cut and Cover on the boards when the horn goes' : 'solves Cut and Cover first'}.`,
    });
  },
};

export default cutAndCover;
