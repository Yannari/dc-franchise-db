// ══════════════════════════════════════════════════════════════════════
// bb-comps/cold-comfort.js — Cold Comfort
// ══════════════════════════════════════════════════════════════════════
//
// The overnight one. Everybody on a platform barely wider than their own feet,
// water and wind arriving on a timer, and nothing to do but stand there while
// the temperature does the work. Nobody is ever eliminated in this competition.
// People step off, which is a different thing, and it is the whole subject:
// every houseguest who loses this loses it by deciding they have had enough,
// in front of everybody, and then has to live in the house with that.
//
// WHAT THIS REPLACES. One `scoreField` roll, ranked, six beats. The stats were
// right and the shape was wrong: a competition about attrition over a long
// night resolved in a single instant, so there was no night, no order that
// meant anything, and no moment where anybody chose. The score already knew.
//
// So it runs the night. Every houseguest carries a core temperature that drains
// hour by hour against the conditions, and a resolve that drains as the cold
// takes hold. Both are read at the top of every hour and neither is destiny —
// stepping off is a CHOICE, weighted by how cold you are, how much you have
// left, and how much trouble you are in if you lose. Somebody who believes they
// are going home on Thursday will stand out there past the point of sense, and
// does, and sometimes wins the whole thing for it.
//
// THE OFFERS. Three, spread across the night, and they are why this competition
// exists rather than being Hold the Line in the rain. Each one is a real thing
// somebody can take, taken by name in front of a yard full of people who are
// still standing:
//
//   1. A BED. Cheap, early, and it costs you with everyone who was counting on
//      you. Anybody can take it. Almost nobody good does.
//   2. THE HOUSE EATS. Offered only on a night when there ARE have-nots — so
//      the veto version of this competition has a temptation the Head of
//      Household version cannot have, because have-nots are not chosen yet.
//      Ends the slop week for everybody. Buys real goodwill and no game.
//   3. TAKE SOMEBODY WITH YOU. Late, and cruel. Step off and one other
//      houseguest steps off with you, chosen by you. It is the only one that
//      changes who can still win, so it is gated hard: never when the yard is
//      down to three, never offered to whoever is leading, and only ever taken
//      by somebody with the nerve and the shortage of loyalty to do it.
//
// Every one of those pays out in the only currency this game has — bonds,
// popularity and what the house remembers — and #2 genuinely clears
// `gs.bb.haveNots` and the week's own list, because an offer the engine does
// not honour is a caption. Nothing here grants safety: see the note in
// slippery-slope.js, which is the same rule for the same reason.
//
// ON TEMPERAMENT. The library's standing correction is that temperament is
// volatility, not grit, and endurance competitions must not read a short fuse
// as an inability to stand there. `scoreField` expresses that as `swingBy` and
// deliberately adds no compensation, because in a single ranked roll a wide
// swing is already fair. This competition does not roll once — it eliminates,
// hour after hour — and _shared.js says plainly that in that shape a wide swing
// is a pure penalty and the competition has to pay for it itself. So it does:
// see `volLift` below. A hothead out here is unpredictable, not doomed.
//
// NOTE ON `breakdown`: one key per player — the Debug tab renders keys as rows.
// ══════════════════════════════════════════════════════════════════════

import { gs } from '../core.js';
import { pStats, pronouns } from '../players.js';
import { dangerLevel, TOO_DESPERATE_TO_STOP } from '../bb/strategy.js';
import { getBond } from '../bonds.js';
import { aptitude, beat, toResult, makePicker, throwRead, clamp, THROW_LINES, vb } from './_shared.js';

const NEUTRAL = { sub: 'they', obj: 'them', pos: 'theirs', posAdj: 'their', ref: 'themselves', Sub: 'They', Obj: 'Them', PosAdj: 'Their' };
const pron = name => { try { return pronouns(name) || NEUTRAL; } catch { return NEUTRAL; } };
const round1 = v => Math.round(v * 10) / 10;

/**
 * The night, hour by hour.
 *
 * `sev` is how hard that hour pulls heat out of a body. It is not monotonic on
 * purpose: first light is a genuine reprieve and every houseguest out there
 * feels it, which is exactly why the hour after it breaks people — they let
 * themselves believe it was nearly over.
 *
 * Past the end of the list the yard simply keeps going and gets worse, which
 * is what `MORE_SEV` is for. Nobody has ever needed more than about fourteen.
 */
const HOURS = [
  { clock: '11:41 PM', name: 'THE FIRST HOUR', sev: 0.52,
    line: 'Nobody is cold yet. Everybody is standing straight, everybody is talking, and one of them makes a joke about how this is the easiest competition they have ever played. It is, for another forty minutes.' },
  { clock: '12:34 AM', name: 'THE WIND STARTS', sev: 0.78,
    line: 'The fans come on at the far end of the yard. Not hard — just enough that the standing stops being free, and the talking thins out to whoever still wants to be heard over it.' },
  { clock: '1:19 AM', name: 'FIRST WAVE', sev: 1.02,
    line: 'The water arrives for the first time, all at once, from the side nobody was watching. Every single person on a platform makes the same noise, and then the yard is very quiet.' },
  { clock: '2:03 AM', name: 'THE MISTERS', sev: 1.18,
    line: 'The misters come on and stay on. It is not a wave and it is not a soaking — it is a fine, constant, patient wet that gets into the parts of a person a wave never reaches.' },
  { clock: '2:52 AM', name: 'SLEET', sev: 1.34,
    line: 'Whatever they are putting through those pipes now has ice in it. It lands, and it stays landed, and the platforms start to look like something out of a different competition entirely.' },
  { clock: '3:38 AM', name: 'THE DEAD HOUR', sev: 1.46,
    line: 'Nothing new happens for an hour. That is the point of it. The wind holds, the water holds, the clock holds, and the only thing that changes out there is what people are willing to keep doing.' },
  { clock: '4:26 AM', name: 'WIND AND WATER TOGETHER', sev: 1.62,
    line: 'They stop alternating. The fans and the water run at the same time now, and the difference is immediate — the wet stops being wet and starts being a temperature.' },
  { clock: '5:14 AM', name: 'FIRST LIGHT', sev: 1.30,
    line: 'The sky over the far wall goes from black to a bad grey, and everybody still standing looks at it, and everybody still standing thinks the same wrong thing: that it is nearly over.' },
  { clock: '6:02 AM', name: 'MORNING', sev: 1.74,
    line: 'It is not nearly over. Whoever is running the yard waited for the light and then turned everything up, and this is where the night starts collecting the people it has been waiting on.' },
  { clock: '7:00 AM', name: 'THE SECOND MORNING HOUR', sev: 1.88,
    line: 'Somewhere in the house a coffee machine is running, which everybody out here can hear, which is not an accident.' },
];
const MORE_SEV = 2.0;
const MAX_HOURS = 14;

const hourAt = i => HOURS[i] || {
  clock: `${8 + (i - HOURS.length)}:00 AM`,
  name: 'STILL OUT THERE',
  sev: MORE_SEV + (i - HOURS.length) * 0.14,
  line: 'The competition has now run longer than anybody planned for, including the people who built it.',
};

// ── narration pools ───────────────────────────────────────────────────

const OPEN_LINES = [
  'They walk out to the platforms in the dark. It is not a hard competition and every one of them knows it, which is the part that gets them: there is no skill to hide behind out here and no way to be beaten. There is only how long you are willing to stand in it.',
  'Twelve inches of platform each and a whole night in front of them. Nobody wins this competition. Somebody is just the last one who has not decided to stop.',
  'The yard is lit like a car park and just as warm. They step up, they find their footing, and the count starts, and after that the only thing that will happen for several hours is time.',
  'It looks like nothing from the outside. A row of people standing still. That is the competition, and by four in the morning it will have taken more out of this house than anything with an obstacle in it ever has.',
];

/** Stepping off early, while it is still only uncomfortable. */
const EARLY_STEP = [
  (n, p) => `${n} steps down before the yard has properly turned on ${p.obj}, and does not pretend otherwise. "I'm not doing this all night," ${p.sub} ${vb(p, 'says', 'say')}, to nobody who was arguing.`,
  (n, p) => `${n} lasts one wave. ${p.Sub} ${vb(p, 'is', 'are')} off the platform before the water has finished draining and inside before anybody has finished reacting.`,
  n => `${n} gets down carefully, like somebody who has decided this in advance and is only now getting around to it.`,
  (n, p) => `${n} looks along the row at everybody else still up, works out how long this is actually going to go, and takes ${p.ref} out of it.`,
  n => `${n} is the first name off, and the yard is quiet about it in the specific way a house is quiet when it has learned something.`,
];

/** Stepping off in the middle of the night, cold and beaten but upright. */
const MID_STEP = [
  (n, p) => `${n} has been shaking for an hour and holding on anyway. It ends the way it always ends — not a fall, just a moment where ${p.sub} ${vb(p, 'stops', 'stop')} arguing with ${p.ref} — and ${p.sub} ${vb(p, 'is', 'are')} down.`,
  (n, p) => `${n} steps off and cannot feel ${p.posAdj} feet enough to land well. Somebody catches ${p.obj} by the arm. Neither of them says anything about it.`,
  n => `${n} takes the water full in the face, waits for it to finish, and then gets down without a word. There is nothing dramatic about it at all, which is somehow worse to watch.`,
  (n, p) => `${n} makes it through the wave and not through the wind after it. ${p.Sub} ${vb(p, 'is', 'are')} apologising before ${p.posAdj} feet are on the ground, which nobody asked ${p.obj} to do.`,
  (n, p) => `${n} says "one more" out loud three times, and after the third one ${p.sub} ${vb(p, 'is', 'are')} off the platform.`,
  n => `Somebody inside the house is watching this on the monitor and says ${n} has been done for twenty minutes. They are right. ${n} gets down.`,
];

/** Stepping off at the end, when it has cost something real to get this far. */
const LATE_STEP = [
  (n, p) => `${n} has been out here nearly all night and it ends in about four seconds. ${p.Sub} ${vb(p, 'looks', 'look')} at the sky, ${vb(p, 'says', 'say')} something nobody catches, and ${vb(p, 'steps', 'step')} down.`,
  (n, p) => `${n} does not so much step off as stop being able to stay on. ${p.PosAdj} legs have made the decision and the rest of ${p.obj} is informed of it afterwards.`,
  (n, p) => `${n} gets down, and then stands next to the platform for a while looking at it, because after that long the ground is not obviously better.`,
  n => `${n} goes, and the two still up there watch ${n} go, and now it is a different competition.`,
  (n, p) => `${n} is furious about it, which at this hour takes energy ${p.sub} ${vb(p, 'does', 'do')} not have. The anger lasts about as far as the door.`,
];

/** Still up, and being seen to be still up. */
const HOLD_LINES = [
  n => `${n} has not moved or spoken in twenty minutes. Whatever is being spent up there is not being spent on looking comfortable.`,
  (n, p) => `${n} has ${p.posAdj} eyes closed. ${p.Sub} ${vb(p, 'is', 'are')} not asleep — this is what ${p.sub} ${vb(p, 'does', 'do')} instead of watching the water come.`,
  n => `${n} is talking steadily to nobody at all now. Nobody out there tells ${n} to stop, because everybody out there understands exactly what it is for.`,
  (n, p) => `Somebody offers ${n} a way down from the ground. ${p.Sub} ${vb(p, 'does', 'do')} not answer, which is an answer.`,
  n => `${n} adjusts once, badly, and every person watching decides that was the moment. ${n} is still there an hour later.`,
  (n, p) => `${n} has stopped shivering, which ${p.sub} ${vb(p, 'thinks', 'think')} is a good sign. It is not one.`,
];

/** The refusals. Somebody is offered the way out and says no, out loud. */
const REFUSE_LINES = [
  (n, p, what) => `${n} is offered ${what} and does not even take the time to think about it. "${p.Sub === 'They' ? 'We' : 'I'}'ll take the cold," ${p.sub} ${vb(p, 'says', 'say')}.`,
  (n, p, what) => `${n} listens to the whole offer of ${what}, all the way to the end, out of politeness. Then ${p.sub} ${vb(p, 'says', 'say')} no.`,
  (n, p, what) => `${n} laughs at ${what}. It is not a good laugh — ${p.sub} ${vb(p, 'is', 'are')} too cold for a good laugh — but it is a no.`,
  (n, p, what) => `The offer of ${what} goes out and ${n} shakes ${p.posAdj} head before it has finished being described.`,
];

const NUMB_LINES = [
  (n, p) => `${n} cannot work the zip on ${p.posAdj} own jacket any more and has stopped trying.`,
  n => `${n} is answering the host on a delay now, about two seconds behind every question.`,
  n => `${n} has gone a colour nobody in that house has seen on a person before.`,
  n => `A medic walks the row and stops in front of ${n} for longer than in front of anybody else. ${n} waves them off.`,
];

// ── the offers ────────────────────────────────────────────────────────

/**
 * `pull` is how attractive the offer is BEFORE the person is considered, on a
 * scale where 1 is "a warm bed at three in the morning". `sense` is how much
 * strategic sense it takes to see through it: an offer with high `sense` is one
 * that a smart player refuses and a bad one takes, which is characterisation
 * rather than a coin flip. The house-eats offer inverts that — a socially
 * minded player takes it ON PURPOSE, so its appeal rises with social.
 */
/**
 * `airs` is the chance the yard runs this offer AT ALL on a given night, and it
 * is the difference between a mechanic and a fixture. Every offer firing every
 * week made all three of them furniture: the house learned the schedule, the
 * screen printed the same three brass plates every time, and the cruel one
 * stopped being a shock by about week three. Rolled once, at the top of the
 * night, before anybody is cold.
 *
 * `bite` is how readily somebody who wants it actually takes it, tuned against
 * a 300-night sample rather than guessed. Together they set how often each of
 * these is a story: roughly a fifth of nights for the bed, a third of slop
 * weeks for the food, and about one night a season for the ugly one.
 */
/**
 * What makes each offer look good, as named weights rather than loose numbers.
 *
 * These are NOT a second copy of the competition's stat profile — that lives in
 * `stats` and is read through `aptitude()`, once. This is the separate question
 * of who WANTS the thing being offered, which is a matter of character and not
 * of how well somebody stands in the cold. Naming the coefficients keeps the two
 * models visibly distinct and keeps the profile-drift guard able to tell them
 * apart, which it cannot do when a decision model is written as bare
 * `stat * 0.75` arithmetic that looks exactly like a hand-copied profile.
 */
const APPEAL = {
  // Comfort. Wanting it is timidity; refusing it is knowing what it costs.
  bed: { base: 0.30, timid: 0.50, senseCut: 0.75 },
  // Generosity, and it reads as generosity because it buys nothing else.
  // Somebody living on slop themselves feels the offer twice over.
  feed: { base: 0.28, sociable: 0.72, onSlop: 0.30, loyal: 0.25 },
  // Nerve, and a shortage of loyalty. The floor is what stops anybody with an
  // ordinary amount of either from ever considering it.
  drag: { nerve: 0.85, disloyal: 0.75, floor: 0.55, cap: 1.4 },
};

const OFFERS = {
  bed: {
    key: 'bed', label: 'A BED', from: 2, airs: 0.72, bite: 0.9,
    what: 'a hot shower and a real bed',
    call: 'There is a hot shower running inside and a bed with a blanket on it, and the first person off a platform gets both. The offer stands for one hour.',
  },
  feed: {
    key: 'feed', label: 'THE HOUSE EATS', from: 4, airs: 0.66, bite: 0.24,
    what: 'the end of the slop week for the whole house',
    call: 'The offer is the slop. One person steps off, and the have-not week is over for everybody in that house tonight — real food, hot water, beds. One person, and the rest of them eat.',
  },
  drag: {
    key: 'drag', label: 'TAKE SOMEBODY WITH YOU', from: 6, airs: 0.42, bite: 0.16,
    what: 'the chance to take one other houseguest off with you',
    call: 'The last offer of the night is the ugly one. Anybody who steps off from here can name one houseguest still standing, and that houseguest steps off too. No appeal, no vote, no reason required.',
  },
};

const BED_TAKE = [
  (n, p) => `${n} takes the bed. ${p.Sub} ${vb(p, 'is', 'are')} off the platform inside ten seconds of the offer being made, which tells the yard that ${p.sub} ${vb(p, 'has', 'have')} been waiting for a reason.`,
  (n, p) => `${n} takes it. "It's a bed," ${p.sub} ${vb(p, 'says', 'say')}, to a row of people standing in ice water, and walks past every one of them.`,
  n => `${n} takes the shower and the bed and does not look down the row on the way out. Everybody down the row notices that ${n} did not look.`,
];

const FEED_TAKE = [
  (n, p) => `${n} steps off and feeds the house. ${p.Sub} ${vb(p, 'does', 'do')} it fast, before ${p.sub} can talk ${p.ref} out of it, which is the only way anybody ever does something like that.`,
  n => `${n} takes it, and the noise from inside the house is loud enough to hear over the fans. ${n} has just given up a competition to end a week of slop for people who would not have done it back.`,
  (n, p) => `${n} asks the host to say the offer one more time. Then ${p.sub} ${vb(p, 'steps', 'step')} down and ends the slop week, and the yard watches ${p.obj} go with something that is not quite respect and is not far off it.`,
];

const DRAG_TAKE = [
  (n, p, t) => `${n} steps off, and then says the name. "${t}." ${p.Sub} ${vb(p, 'does', 'do')} not explain it and is not asked to.`,
  (n, p, t) => `${n} is finished and everybody can see it. What nobody sees coming is ${p.obj} taking the offer and naming ${t}, who has done nothing all night except be better at this than ${n} was.`,
  (n, p, t) => `${n} gets down, waits until ${p.sub} ${vb(p, 'has', 'have')} the whole yard, and picks ${t}. It is the loudest thing that happens all night and it is said quite quietly.`,
];

const DRAGGED = [
  (n, p) => `${n} does not move at first. ${p.Sub} ${vb(p, 'has', 'have')} to be told twice, and then ${p.sub} ${vb(p, 'gets', 'get')} down off a platform ${p.sub} could have stood on for another three hours, and ${p.sub} ${vb(p, 'says', 'say')} nothing to anybody.`,
  (n, p) => `${n} steps down because the rule says so. On the way past, ${p.sub} ${vb(p, 'says', 'say')} one sentence that the cameras get and the room does not, and it is not forgiven this season.`,
  n => `${n} is out, and had been winning, and everybody out there knows both of those things at once.`,
];

export const coldComfort = {
  // Unchanged: a season saved before the rewrite still resolves this id, and
  // the finale's forced-competition config names it.
  id: 'bb-endurance-soak',
  name: 'Cold Comfort',
  category: 'endurance',
  types: ['hoh', 'veto', 'arena'],
  desc: 'Houseguests stand on platforms barely wider than their own feet while cold water and wind hit them in timed waves, hour after hour, through the night. Nothing about it is difficult and nothing about it stops, which turns out to be worse. Stepping off a platform ends a run, and because nobody can be eliminated, every houseguest who loses this loses it by choosing to — in front of the whole yard. As the night wears on the house is offered things to step down for, taken by name and standing up, and the last houseguest still on a platform wins.',
  // Standing power. Temperament is NOT in here: see the header.
  stats: { endurance: 0.48, physical: 0.22, boldness: 0.18, temperament: 0.12 },
  // Drawn separately by the screen — a stat that widens the spread does not
  // make somebody better at this, it makes them harder to call.
  spreadStat: 'temperament',
  roles: {
    insulation: { endurance: 0.56, physical: 0.27, boldness: 0.17 },
    resolve: { endurance: 0.42, boldness: 0.38, loyalty: 0.20 },
  },

  simulate(participants, context, api, rng) {
    const beats = [];
    const steps = [];
    const breakdown = {};
    const early = makePicker(rng);
    const mid = makePicker(rng);
    const late = makePicker(rng);
    const hold = makePicker(rng);
    const numb = makePicker(rng);
    const refuse = makePicker(rng);
    const threwSay = makePicker(rng);

    const haveNots = (context.haveNots || []).filter(n => participants.includes(n));
    // What the yard is running tonight, decided before anybody steps up.
    //
    // The middle offer only exists on a night that HAS a slop week to end. A
    // Head of Household competition never does — have-nots are chosen after it
    // — so that one is a genuine difference between the two versions rather
    // than a roll. The other two are rolls, and some nights carry none of them
    // at all, which is what makes the nights that do carry one land.
    const tonight = {
      bed: rng() < OFFERS.bed.airs,
      feed: haveNots.length > 0 && rng() < OFFERS.feed.airs,
      // The ugly one needs a crowd to be survivable: it takes TWO people off
      // the yard at once, so a small field cannot afford it at any odds.
      drag: participants.length >= 6 && rng() < OFFERS.drag.airs,
    };

    /** One record per houseguest, resolved once. dangerLevel is not cheap. */
    const state = participants.map(name => {
      const s = pStats(name);
      const t = throwRead(name, context, rng);
      const insul = aptitude(name, coldComfort.roles.insulation) / 10;
      // Volatility, and the lift that pays for it. In an elimination loop a
      // wide swing is a pure penalty — every hour is another chance to come up
      // short — so the mean has to rise with the spread or this competition
      // would be quietly saying that hotheads cannot stand in the cold.
      const vol = clamp((10 - s.temperament) / 10, 0, 1);
      const volLift = vol * 0.09;
      return {
        name, insul, vol,
        heat: 100,
        resolve: 40 + aptitude(name, coldComfort.roles.resolve) * 5.5 + volLift * 40,
        base: Math.round(aptitude(name, coldComfort.stats) * 100) / 100,
        threw: t.threw, threwChance: t.chance,
        haveNot: (context.haveNots || []).includes(name),
        danger: dangerLevel(name, context),
        strategic: clamp(s.strategic / 10, 0, 1),
        social: clamp(s.social / 10, 0, 1),
        loyalty: clamp(s.loyalty / 10, 0, 1),
        boldness: clamp(s.boldness / 10, 0, 1),
        hours: 0, luck: 0, hnCost: 0, log: [], numbed: false,
        out: false, outHour: 0, outVia: null, tookOffer: null, dragged: false,
      };
    });

    const standing = () => state.filter(p => !p.out);

    beats.push(beat(OPEN_LINES[Math.floor(rng() * OPEN_LINES.length)],
      participants.slice(0, 3), 'THE PLATFORMS'));
    steps.push({ kind: 'open', clock: HOURS[0].clock, hour: 0, standing: state.length, heats: {} });

    /** Push a beat and its instrument row together so the two never drift. */
    const say = (text, players, badgeText, badgeClass, step) => {
      beats.push(beat(text, players, badgeText, badgeClass));
      steps.push({
        clock: step.clock, hour: step.hour, kind: step.kind,
        standing: standing().length,
        heats: Object.fromEntries(state.map(p => [p.name, Math.round(p.heat)])),
        ...step,
      });
    };

    const stepOff = (p, atHour, via) => {
      p.out = true;
      p.outHour = atHour + 1;
      p.outVia = via;
    };

    const offered = { bed: false, feed: false, drag: false };
    let hour = 0;
    /** Set the moment two allies agree one of them comes down. */
    let dealt = null;

    while (standing().length > 1 && hour < MAX_HOURS) {
      const h = hourAt(hour);
      const live = standing();

      say(h.line, live.slice(0, 4).map(p => p.name), h.name, 'challenge',
        { kind: 'hour', clock: h.clock, hour: hour + 1, condition: h.name, sev: h.sev });

      // ── the hour itself ──
      for (const p of live) {
        p.hours = hour + 1;
        // How much the hour takes. Insulation is the whole defence; the noise
        // is wide for a volatile houseguest and narrow for a steady one, which
        // is temperament doing the job it should have been doing all along.
        const noise = (rng() - 0.5) * (2.4 + p.vol * 5.2);
        p.luck -= noise;
        let drain = h.sev * (9.2 - p.insul * 5.4) + noise;
        // A week of cold showers and slop, arriving where it hurts most.
        if (p.haveNot) { const before = drain; drain *= 1.22; p.hnCost += drain - before; }
        if (p.threw) drain *= 2.4;
        drain = Math.max(0.6, drain);
        p.heat = clamp(p.heat - drain, 0, 100);
        // Resolve goes with the heat, and faster once the body is in trouble.
        p.resolve -= drain * (0.55 + (p.heat < 42 ? 0.5 : 0));
        p.log.push({ hour: hour + 1, clock: h.clock, heat: Math.round(p.heat), drain: round1(drain) });

        if (!p.numbed && p.heat < 38 && rng() < 0.45) {
          p.numbed = true;
          say(numb(NUMB_LINES)(p.name, pron(p.name)), [p.name], 'NOT GOOD', 'grey',
            { kind: 'numb', clock: h.clock, hour: hour + 1, who: p.name });
        }
      }

      // ── the offers ──
      //
      // Made to the yard, taken by one person, in front of everybody. Each is
      // offered once; the hour it is offered is the hour it can be taken.
      const takeOffer = (offer) => {
        offered[offer.key] = true;
        say(offer.call, standing().map(p => p.name), `OFFER — ${offer.label}`, 'gold',
          { kind: 'offer', clock: h.clock, hour: hour + 1, offer: offer.key, label: offer.label });

        const pool = standing().filter(p => !p.threw);
        if (!pool.length) return;
        const lead = Math.max(...pool.map(p => p.heat));
        let took = null;

        for (const p of pool) {
          if (p === took) continue;
          const strain = clamp((100 - p.heat) / 100, 0, 1);
          const behind = clamp((lead - p.heat) / 60, 0, 1);
          const spent = clamp(1 - p.resolve / 90, 0, 1);
          // Somebody who thinks they are going home on Thursday does not walk
          // off a competition that could save them. This is the dominant term
          // in all three offers, squared, exactly as the slope prices it.
          const fear = (1 - p.danger) * (1 - p.danger);
          let appeal;
          if (offer.key === 'bed') {
            // A pure comfort prize. Strategic sense sees it for what it is.
            const a = APPEAL.bed;
            appeal = (a.base + (1 - p.boldness) * a.timid) * (1 - p.strategic * a.senseCut);
          } else if (offer.key === 'feed') {
            // The opposite: a social player takes this ON PURPOSE and knows
            // exactly what it buys.
            const a = APPEAL.feed;
            appeal = a.base + p.social * a.sociable + (p.haveNot ? a.onSlop : 0) + p.loyalty * a.loyal;
          } else {
            // Nerve and a shortage of loyalty. Nothing else takes this one.
            const a = APPEAL.drag;
            appeal = clamp(p.boldness * a.nerve + (1 - p.loyalty) * a.disloyal - a.floor, 0, a.cap);
          }
          const want = (strain * 0.5 + behind * 0.35 + spent * 0.4 + 0.05) * fear * appeal;
          if (appeal <= 0.02) continue;
          if (offer.key === 'drag' && p.heat >= lead - 4) continue;   // never the leader
          if (p.danger >= TOO_DESPERATE_TO_STOP) continue;
          if (rng() < want * offer.bite) { took = p; break; }
        }

        if (!took) {
          // Somebody says no out loud. It is worth as much screen time as a
          // yes and the yard reads it the same way.
          const loud = pool.sort((a, b) => b.danger - a.danger)[0];
          const lp = pron(loud.name);
          say(refuse(REFUSE_LINES)(loud.name, lp, offer.what), [loud.name], 'TURNS IT DOWN', 'green',
            { kind: 'refuse', clock: h.clock, hour: hour + 1, offer: offer.key, who: loud.name });
          api.popDelta(loud.name, 1);
          return;
        }

        const tp = pron(took.name);
        took.tookOffer = offer.key;
        stepOff(took, hour, offer.key);

        if (offer.key === 'bed') {
          say(BED_TAKE[Math.floor(rng() * BED_TAKE.length)](took.name, tp),
            [took.name], 'TAKES THE BED', 'grey',
            { kind: 'take', clock: h.clock, hour: hour + 1, offer: 'bed', who: took.name });
          api.popDelta(took.name, -2);
          // The people who were counting on this person feel it properly.
          for (const other of standing()) {
            try { if (getBond(took.name, other.name) >= 3) api.addBond(took.name, other.name, -0.8); } catch { /* no bond, no fallout */ }
          }
          api.record(took.name, 'cold-took-comfort', { offer: 'bed', hour: hour + 1, heat: Math.round(took.heat) });

        } else if (offer.key === 'feed') {
          say(FEED_TAKE[Math.floor(rng() * FEED_TAKE.length)](took.name, tp),
            [took.name], 'FEEDS THE HOUSE', 'green',
            { kind: 'take', clock: h.clock, hour: hour + 1, offer: 'feed', who: took.name });
          // Honoured, not narrated. Both the week's own list and the global one
          // — later competitions read `week.haveNots`, house events read
          // `gs.bb.haveNots`, and an offer only one of them believes is worse
          // than no offer at all.
          const fed = [...haveNots];
          if (context.week) context.week.haveNots = [];
          if (context.haveNots) context.haveNots.length = 0;
          try { if (gs.bb) gs.bb.haveNots = []; } catch { /* no season state in a bare harness */ }
          api.popDelta(took.name, 3);
          for (const name of fed) {
            if (name === took.name) continue;
            api.addBond(took.name, name, 1.5);
          }
          say(`The slop week is over. ${fed.filter(n => n !== took.name).length || 'No'} ${fed.filter(n => n !== took.name).length === 1 ? 'houseguest eats' : 'houseguests eat'} tonight because ${took.name} stopped, and every one of them knows the exact price of it.`,
            [took.name, ...fed.filter(n => n !== took.name)].slice(0, 6), 'SLOP WEEK ENDED', 'green',
            { kind: 'fed', clock: h.clock, hour: hour + 1, who: took.name, fed });
          api.record(took.name, 'cold-fed-the-house', { hour: hour + 1, fed, heat: Math.round(took.heat) });

        } else {
          // Who goes with them. The worst relationship they can still reach,
          // and failing that the person most likely to have won.
          const targets = standing().filter(p => p !== took);
          if (!targets.length) return;
          const scored = targets.map(p => {
            let b = 0;
            try { b = getBond(took.name, p.name); } catch { b = 0; }
            return { p, want: (5 - b) + (p.heat / 40) };
          }).sort((a, b) => b.want - a.want);
          const victim = scored[0].p;
          const vp = pron(victim.name);

          say(DRAG_TAKE[Math.floor(rng() * DRAG_TAKE.length)](took.name, tp, victim.name),
            [took.name, victim.name], 'TAKES SOMEBODY WITH', 'red',
            { kind: 'take', clock: h.clock, hour: hour + 1, offer: 'drag', who: took.name, victim: victim.name });

          victim.dragged = true;
          stepOff(victim, hour, 'dragged');
          say(DRAGGED[Math.floor(rng() * DRAGGED.length)](victim.name, vp),
            [victim.name], 'TAKEN OFF', 'red',
            { kind: 'dragged', clock: h.clock, hour: hour + 1, who: victim.name, by: took.name });

          api.addBond(took.name, victim.name, -3);
          api.popDelta(took.name, -3);
          api.popDelta(victim.name, 2);
          // Everybody watching learns something about the person who did it.
          for (const other of standing()) {
            try { api.addBond(took.name, other.name, -0.4); } catch { /* no bond */ }
          }
          api.record(took.name, 'cold-dragged-somebody-off', { victim: victim.name, hour: hour + 1 });
          api.record(victim.name, 'cold-dragged-off-by', { by: took.name, hour: hour + 1, heat: Math.round(victim.heat) });
        }
      };

      if (tonight.bed && !offered.bed && hour + 1 >= OFFERS.bed.from && standing().length > 2) takeOffer(OFFERS.bed);
      else if (tonight.feed && !offered.feed && hour + 1 >= OFFERS.feed.from && standing().length > 2) takeOffer(OFFERS.feed);
      // Never with three or fewer left: it would decide the competition rather
      // than complicate it, and it takes TWO people off the yard at once.
      else if (tonight.drag && !offered.drag && hour + 1 >= OFFERS.drag.from && standing().length > 3) takeOffer(OFFERS.drag);

      // ── who has had enough ──
      for (const p of standing()) {
        if (standing().length <= 1) break;
        const strain = clamp((100 - p.heat) / 100, 0, 1);
        const left = clamp(p.resolve / 90, 0, 1);
        // Somebody in trouble stands out there past the point of sense.
        const chance = clamp((strain * 1.35 - left * 0.95) * (1 - p.danger * 0.7), 0, 0.82);
        const quits = p.threw ? rng() < 0.7 : rng() < chance;
        if (!quits && p.heat > 2) continue;

        stepOff(p, hour, p.threw ? 'threw' : 'stepped');
        const pp = pron(p.name);
        if (p.threw) {
          say(threwSay(THROW_LINES)(p.name), [p.name], 'THREW IT', 'grey',
            { kind: 'threw', clock: h.clock, hour: hour + 1, who: p.name });
        } else {
          const pool = hour < 2 ? early(EARLY_STEP) : hour < 6 ? mid(MID_STEP) : late(LATE_STEP);
          const badge = state.filter(x => x.out && !x.dragged && x.outVia !== 'threw').length === 1
            ? 'FIRST DOWN' : 'STEPS DOWN';
          say(pool(p.name, pp), [p.name], badge, 'challenge',
            { kind: 'step', clock: h.clock, hour: hour + 1, who: p.name, heat: Math.round(p.heat) });
          // Every hour past the sixth costs the body and buys nothing but the
          // house's respect, which in this game is not nothing.
          if (hour >= 5) api.popDelta(p.name, 1);
        }
      }

      // ── the deal, at the moment the yard gets down to two ──
      //
      // Checked HERE, inside the night, and not after it. Written as an
      // end-of-competition branch it never once fired in two hundred nights
      // with an all-allies cast, because the hour loop always drains the yard
      // to exactly one before it exits — the only way to reach the last two
      // still standing was for the clock to run out, which almost never
      // happens. Two allies do not stand in ice water for three more hours to
      // find out which of them wants it more. They talk, and one gets down.
      const pair = standing();
      if (!dealt && pair.length === 2) {
        const [ahead, behind] = [...pair].sort((x, y) => y.heat - x.heat);
        let close = 0;
        try { close = getBond(ahead.name, behind.name); } catch { close = 0; }
        // Not automatic even between allies: somebody has to be willing to be
        // the one who gets down, and the further behind they are the easier
        // that is to agree to.
        const gap = clamp((ahead.heat - behind.heat) / 40, 0, 1);
        if (close >= 3 && rng() < 0.45 + gap * 0.4) {
          dealt = behind;
          stepOff(behind, hour, 'deal');
          say(`${behind.name} and ${ahead.name} are the only two left, and they are on the same side. It takes about ninety seconds of very quiet conversation, both of them shaking too hard to be subtle about it, and then ${behind.name} gets down.`,
            [ahead.name, behind.name], 'DEAL STRUCK', 'green',
            { kind: 'deal', clock: h.clock, hour: hour + 1, who: behind.name, ally: ahead.name });
          api.addBond(ahead.name, behind.name, 0.9);
          api.record(behind.name, 'stepped-down-for-ally', { ally: ahead.name });
          api.record(ahead.name, 'won-on-a-deal', { ally: behind.name });
          hour++;
          break;
        }
      }

      // Somebody still up, being seen to be still up.
      const still = standing();
      if (still.length > 1 && hour >= 1 && rng() < 0.72) {
        const shown = still[Math.floor(rng() * still.length)];
        say(hold(HOLD_LINES)(shown.name, pron(shown.name)), [shown.name], 'STILL UP', 'challenge',
          { kind: 'hold', clock: h.clock, hour: hour + 1, who: shown.name });
      }

      hour++;
    }

    // ── how it ended ──
    let champ;
    const left = standing();
    let onCount = false;

    if (left.length === 1) {
      champ = left[0];
    } else if (left.length === 2) {
      // The clock beat them both. Neither will get down and neither can carry
      // on, so the yard's own instruments settle it.
      const [a, b] = [...left].sort((x, y) => y.heat - x.heat);
      const hEnd = hourAt(Math.max(0, hour - 1));
      champ = a;
      onCount = true;
      stepOff(b, hour, 'count');
      say(`Neither of them will get down and neither of them can carry on, so it goes to the count: core temperature, read off the yard's own instruments, and ${a.name}'s is the higher one by a margin you could not see from the ground.`,
        [a.name, b.name], 'ON THE COUNT',
        'gold', { kind: 'count', clock: hEnd.clock, hour, who: a.name, other: b.name });
    } else {
      // Ran out of night with a crowd still up: the coldest go first.
      onCount = true;
      const sorted = [...left].sort((x, y) => y.heat - x.heat);
      champ = sorted[0];
      const hEnd = hourAt(Math.max(0, hour - 1));
      sorted.slice(1).forEach(p => stepOff(p, hour, 'count'));
      say(`The competition is stopped with ${sorted.length} houseguests still standing, and it is decided on the instruments. ${champ.name} is the warmest person in that yard, which after a night like this is the only measure of anything.`,
        sorted.map(p => p.name).slice(0, 5), 'ON THE COUNT', 'gold',
        { kind: 'count', clock: hEnd.clock, hour, who: champ.name });
    }

    const cp = pron(champ.name);
    const hoursOut = Math.max(1, champ.hours);
    const winBadge = context.type === 'veto' ? 'VETO' : context.type === 'arena' ? 'WINS THE ARENA' : 'HOH';
    say(dealt
      ? `${champ.name} wins Cold Comfort after ${hoursOut} hours out there, and does not celebrate it, because the person ${cp.sub} ${vb(cp, 'beat', 'beat')} is standing next to ${cp.obj} wrapped in the same towel.`
      : onCount
        ? `${champ.name} takes it on the count. ${cp.Sub} ${vb(cp, 'has', 'have')} been on that platform for ${hoursOut} hours and ${vb(cp, 'is', 'are')} the last one warm enough to still be arguing about it.`
        : `${champ.name} is still on ${cp.posAdj} platform when the last opponent steps off. ${hoursOut} hours, one night, and the whole house watched every one of them.`,
      [champ.name], winBadge, 'gold',
      { kind: 'win', clock: hourAt(Math.max(0, hour - 1)).clock, hour, who: champ.name, hours: hoursOut });

    api.popDelta(champ.name, 2);
    api.record(champ.name, 'endurance-win', { comp: 'cold-comfort', hours: hoursOut, heat: Math.round(champ.heat) });
    // Standing in ice water all night in front of the house is a reputation.
    if (hoursOut >= 7) api.popDelta(champ.name, 1);

    // ── placements ──
    //
    // Last one standing, then everybody by how long they lasted, then by how
    // much they had left when they stopped. Taking an offer is stepping off,
    // and it places exactly where it happened — there is no extra punishment,
    // because the bonds and the popularity already charged for it.
    const others = state.filter(p => p !== champ)
      .sort((a, b) => (b.outHour - a.outHour) || (b.heat - a.heat));
    const ordered = [champ, ...others];

    ordered.forEach((p, i) => {
      breakdown[p.name] = {
        base: p.base,
        roll: Math.round(p.luck * 100) / 100,
        hours: p.hours, heatLeft: Math.round(p.heat),
        insulation: Math.round(p.insul * 100) / 100,
        volatility: Math.round(p.vol * 100) / 100,
        danger: Math.round(p.danger * 100) / 100,
        out: p.outVia, tookOffer: p.tookOffer, dragged: p.dragged,
        threw: p.threw, threwChance: p.threwChance,
        haveNot: p.haveNot, haveNotPenalty: round1(p.hnCost),
        log: p.log,
        score: p.hours * 10 + Math.round(p.heat) + (ordered.length - i) * 0.01,
      };
    });

    const entries = ordered.map((p, i) => ({
      name: p.name,
      score: p.hours * 10 + Math.round(p.heat) + (ordered.length - i) * 0.01,
      threw: p.threw,
    }));

    return toResult(entries, {
      beats, breakdown, variant: 'soak',
      detail: {
        steps,
        hours: hour,
        offers: Object.entries(offered).filter(([, v]) => v).map(([k]) => k),
        haveNotsFed: offered.feed && state.some(p => p.tookOffer === 'feed') ? haveNots : [],
        finished: onCount ? 'count' : dealt ? 'deal' : 'last-standing',
      },
      text: `${champ.name} outlasts the house in Cold Comfort${onCount ? ', on the count' : ''} after ${hoursOut} hours.`,
    });
  },
};

/** The old export name, kept because the library and the tests both use it. */
export const coldSoak = coldComfort;

export default coldComfort;
