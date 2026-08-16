// ══════════════════════════════════════════════════════════════════════
// bb-comps/hold-the-line.js — Hold the Line
// ══════════════════════════════════════════════════════════════════════
//
// A rope each, running out to a winch, and a chalk mark on the ground at your
// feet. The winch pulls. It pulls harder every few minutes, it never lets up
// and it never runs backwards, and if the mark goes past your feet you are
// finished. That is the competition.
//
// WHAT THIS REPLACES, AND WHY IT IS A DIFFERENT COMPETITION NOW. Hold the Line
// used to be houseguests hanging off grips on a wall face that tilts, shakes
// and sprays — which is The Wall (`bb-sig-the-wall`), already in the library,
// already with a screen of its own, separated from this only by whether you
// were on your hands or your feet. Two near-identical competitions can both be
// drawn in one season, and the pool had no way of knowing they were twins.
// `bb-grip-pole` sits on the other side of it, written explicitly as the one
// where "nothing tilts and nothing sprays, and the pole does not move".
//
// The name was the way out. This is a line under load, which nothing else in
// the library is, and it buys a mechanic nothing else in the library has:
//
//   GROUND YOU CAN GET BACK. Every other endurance competition here is a
//   drain — a body that gives out, a core that cools, an arm that fails, and
//   the only direction is down. Here the opposition is a MACHINE, and when it
//   eases off for a moment a houseguest who has been dragged halfway to the
//   line can haul every inch of it back. So the field moves both ways all
//   night, somebody who is visibly beaten at the halfway point can still win,
//   and being behind is a position rather than a verdict.
//
// The cost is what makes it a decision rather than a free move. Hauling back
// spends everything you have; the houseguest who takes their ground back in
// the third slack is often the one dragged over the line in the ninth, and the
// one who rests instead keeps a reserve and keeps their deficit. Nobody can do
// both, and which one somebody picks is a fact about them.
//
// CALLING THE LINE. The slack is not announced. Reading the winch — hearing it
// change note before it changes speed — is a real skill, and a houseguest who
// has it can call it out loud for the people they trust, who are then set and
// ready when it comes. It is also the only lie available out there, and it is
// a good one: call a slack that is not coming and everybody who believed you
// spends their reserve hauling against a machine at full power. Villain
// archetypes always have it in them, nice ones never do, and neutrals need the
// brains and the disloyalty both — the same rule social-manipulation.js uses,
// on the competition's own seeded rng so a season still replays.
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
const round1 = v => Math.round(v * 10) / 10;

/** How far past the mark a houseguest can be dragged before it is over. */
const LIMIT = 60;
const MAX_ROUNDS = 18;

/**
 * The winch, notch by notch.
 *
 * `pull` is what the machine is taking, against a hold of roughly 5 to 15
 * depending on the houseguest. It rises the whole way and never comes off —
 * the slack moments are separate beats between these, not a step backwards on
 * this ladder, because a winch that gave ground back would make the whole
 * competition survivable by waiting.
 */
const NOTCHES = [
  { label: 'FIRST NOTCH', pull: 4.4,
    line: 'The winch takes up the slack and the ropes go straight. Nothing else happens for a while. Everybody is holding a rope that is pulling about as hard as a large dog, and the whole field looks faintly embarrassed to be out here.' },
  { label: 'SECOND NOTCH', pull: 6.2,
    line: 'It steps up without warning and the whole line of them leans back an inch at the same moment. Somebody laughs. Nobody joins in.' },
  { label: 'THIRD NOTCH', pull: 8.1,
    line: 'The drum turns over and settles into a lower note. This is the point where holding the rope stops being a thing you do with your hands and starts being a thing you do with your back and your heels.' },
  { label: 'FOURTH NOTCH', pull: 10.0,
    line: 'The first chalk marks start disappearing under people. Nobody says anything about it. Everybody has looked down at least once.' },
  { label: 'FIFTH NOTCH', pull: 11.6,
    line: 'The ropes are singing now — a thin, unpleasant note off the cable that you can hear from the house — and the ground under the field is scuffed into a mess.' },
  { label: 'SIXTH NOTCH', pull: 13.4,
    line: 'Whoever is running the winch is not watching anybody in particular. It goes up on a timer, and the timer does not care that half of them are already past their marks.' },
  { label: 'SEVENTH NOTCH', pull: 15.2,
    line: 'Hands start going. Not letting go — going: the skin, the grip, the ability to close a fist at all. Two of them have the rope wrapped somewhere it should not be wrapped.' },
  { label: 'EIGHTH NOTCH', pull: 17.0,
    line: 'The load is past what any of them can simply hold now, and the competition quietly becomes about how slowly you can lose rather than whether you can stop it.' },
  { label: 'NINTH NOTCH', pull: 18.8,
    line: 'Boots are leaving furrows. The field is being walked backwards one inch at a time by a machine that does not know any of them are there.' },
  { label: 'TENTH NOTCH', pull: 20.6,
    line: 'It goes up again and somebody swears loudly enough that it will be bleeped. The rope does not care and the drum does not stop.' },
];
/**
 * Past the tenth notch, and past the point where two people are left.
 *
 * Both of these used to be ONE sentence each, printed once per round for as
 * long as the situation lasted. That was survivable while the field dropped in
 * stat order and the endgame was two or three rounds long; when the
 * competitions stopped being a stat sort the last two started holding out for
 * five and six notches and the screen printed the same paragraph six times.
 * Rounds past the ladder are rarer but fail exactly the same way.
 */
const BEYOND_LINES = [
  'The winch has gone past every setting anybody expected it to use, and it is still going up.',
  'There are no more marked notches. The drum keeps turning anyway and nobody out here can do anything about that.',
  'Somebody in the control booth is now improvising, and everybody holding a rope has worked that out.',
  'The load goes up again into a range the machine has no label for. The ropes make a sound they have not made yet.',
  'It climbs once more. At this point the only question the competition is still asking is which of them lets go first.',
];
const LAST_TWO_LINES = [
  'The winch stops climbing. It does not come off — it simply holds, at a load neither of them can carry for much longer, and now it is only a question of which of the two of them stops being able to first.',
  'The load does not move. Two people, one constant weight, and a yard that has gone completely silent for it.',
  'Neither of them has said anything in some minutes. The drum holds where it is and lets the two of them work it out.',
  'The machine has stopped doing anything at all. It is just there, pulling exactly as hard as it was, waiting.',
  'Still nothing from the winch. Both of them have found a position and both of them know what it is costing.',
  'The load holds. One of them adjusts a grip and immediately regrets having moved.',
];
const notchAt = (i, beyondSay = null) => NOTCHES[i] || {
  label: `NOTCH ${i + 1}`,
  pull: NOTCHES[NOTCHES.length - 1].pull + (i - NOTCHES.length + 1) * 2.4,
  line: beyondSay ? beyondSay(BEYOND_LINES) : BEYOND_LINES[0],
};

// ── narration ─────────────────────────────────────────────────────────

const OPEN_LINES = [
  'A rope each, a chalk mark at each pair of feet, and a winch at the far end of the yard that has one job. Nobody has to do anything clever out here. They only have to be standing on their own mark whenever the machine decides to test it.',
  'Ten ropes running out to one drum. The rules take about nine seconds to explain: hold your line, and if your mark ends up behind you, you are done. Then the drum starts turning and the nine seconds of explanation turn out to have covered everything.',
  'The winch is the opponent tonight, which makes this the only competition in the house nobody can talk their way out of. It does not get tired, it does not make deals, and it goes up on a timer.',
  'They take the ropes. Somebody asks how heavy it gets. Nobody answers, because the honest answer is that it gets heavier than all of them.',
];

const SLIP_LINES = [
  (n, p, d) => `${n} gives up ${d} inches in one go — not a slip so much as a decision ${p.posAdj} feet made without consulting ${p.obj}.`,
  (n, p, d) => `The rope walks ${n} back ${d} inches. ${p.Sub} ${vb(p, 'gets', 'get')} it stopped, eventually, well past where ${p.sub} wanted to.`,
  (n, p, d) => `${n} loses ${d} inches trying to change grip, which is the exact trade everybody out here is being asked to make.`,
  (n, p, d) => `${d} inches gone for ${n}, all at once, on a heel that found something slick.`,
];

const HOLD_LINES = [
  n => `${n} has not moved an inch in two notches. Whatever that is costing is not showing anywhere a camera can find it.`,
  (n, p) => `${n} is dead level with ${p.posAdj} mark and has been for a long time. It is the least interesting thing happening in the yard and the most impressive.`,
  n => `${n} has the rope over one shoulder and both heels dug in, which is not how anybody was told to do it and is working.`,
  (n, p) => `${n} is talking to the winch now. ${p.Sub} ${vb(p, 'knows', 'know')} it cannot hear ${p.obj}. It is not for the winch.`,
];

const OUT_LINES = [
  (n, p) => `The mark goes past ${n}'s feet and that is that. ${p.Sub} ${vb(p, 'holds', 'hold')} the rope for another second out of pure objection, then lets it go.`,
  (n, p) => `${n} is walked over the line backwards, still holding on, still arguing, and it makes no difference at all — the chalk is in front of ${p.obj} now and everybody can see it.`,
  n => `${n} goes. The rope snaps forward the moment ${n} releases it, which is the yard's way of saying how much was being held.`,
  (n, p) => `${n} looks down, sees the mark behind ${p.posAdj} heels, and does not make anybody come and tell ${p.obj}.`,
  (n, p) => `That is ${n} over the line. ${p.Sub} ${vb(p, 'walks', 'walk')} off shaking out both hands and does not say a word to anybody for an hour.`,
];

const HAUL_LINES = [
  (n, p, d) => `The winch eases and ${n} goes after it — hauls ${d} inches of ground back hand over hand before the load returns, and ${vb(p, 'is', 'are')} standing on ${p.posAdj} own mark again like the last twenty minutes did not happen.`,
  (n, p, d) => `${n} spends everything in the slack and takes back ${d} inches. It is the best thing anybody has done out here and it will be paid for later.`,
  (n, p, d) => `${d} inches back for ${n}, taken in about four seconds of an effort that clearly cost more than four seconds' worth.`,
  (n, p, d) => `${n} is the only one who moves when the load drops. ${d} inches, reclaimed, in front of a yard full of people who were resting.`,
];

const REST_LINES = [
  n => `${n} feels the load come off and does nothing with it at all except breathe, which is a strategy and might be the right one.`,
  (n, p) => `${n} uses the slack to get ${p.posAdj} hands back — opens them, closes them, checks they still work. The ground stays where it is.`,
  n => `${n} could go for ground here and does not. There is a whole game after tonight and hands are needed for all of it.`,
];

const BURN_LINES = [
  (n, p) => `The rope goes through ${n}'s hands and takes some of ${p.obj} with it. ${p.Sub} ${vb(p, 'catches', 'catch')} it again, a long way back.`,
  n => `${n}'s hands finally lose the argument. The rope runs, and by the time it stops running there is a lot of chalk in the wrong place.`,
];

const CALL_TRUE = [
  (n, p) => `${n} hears it before anybody else does — the drum changes note about two seconds before it changes speed — and calls the slack out loud across the yard.`,
  (n, p) => `"It's coming off, it's coming off —" ${n} has the winch read cold and does not keep it to ${p.ref}.`,
  (n, p) => `${n} has been listening to that drum all night instead of talking, and it pays: ${p.sub} ${vb(p, 'calls', 'call')} the slack before it arrives.`,
];

const CALL_FALSE = [
  (n, p) => `${n} calls the slack. There is no slack. ${p.Sub} ${vb(p, 'says', 'say')} it clearly, twice, to make sure the right people hear it.`,
  n => `"Now — go now!" It is a lie, and ${n} knows it is a lie, and it is delivered beautifully.`,
  (n, p) => `${n} calls a slack that is not coming, and does not look at anybody while ${p.sub} ${vb(p, 'does', 'do')} it.`,
];

/**
 * The slack arriving. Fires several times a night, so it cannot be one
 * sentence — it was, and a competition that dropped the drum four times said
 * the same forty words four times.
 */
const SLACK_LINES = [
  'The drum drops. For about six seconds the ropes have give in them, and every person out here has to decide in that six seconds whether to spend what is left taking ground back or keep it and stay where they are.',
  'The winch eases. It is not much and it is not long, and it is the only chance anybody out here gets to move forwards instead of backwards.',
  'The load comes off — not all of it, and not for long. Six seconds of choice, and everybody spends them differently.',
  'The note of the drum changes and the ropes go soft in eight pairs of hands at once. Whatever anybody does now, they cannot do it twice.',
  'Slack. The machine breathes out, briefly, and hands the whole field the same question at the same moment.',
  'The pull drops away and the rope suddenly weighs nothing. Every houseguest out here has about six seconds to decide whether that is an opportunity or a trap.',
];

const BURNED_BY_CALL = [
  (n, p, liar) => `${n} goes for it on ${liar}'s word and hauls against a machine at full power. ${p.Sub} ${vb(p, 'loses', 'lose')} ground and most of what ${p.sub} had left, and ${vb(p, 'knows', 'know')} exactly whose fault it is.`,
  (n, p, liar) => `${n} trusted the call. There was nothing to haul into, and the rope takes back everything ${p.sub} spent and more. ${p.Sub} ${vb(p, 'looks', 'look')} down the line at ${liar} for a long moment.`,
];

const GROUND_CREW = [
  (n, t) => `${n}, out an hour ago and wrapped in a towel on the grass, starts counting ${t}'s inches out loud. It is not encouragement.`,
  (n, t) => `${n} yells something at ${t} from the sidelines that is either support or sabotage depending on how ${t} takes it.`,
  (n, t) => `From the grass, ${n} tells ${t} to stop looking at the winch. It is genuinely good advice and it is taken.`,
];

/** Villain intent, on the competition's own rng. Mirrors social-manipulation.js. */
const VILLAIN_ARCHETYPES = new Set(['villain', 'mastermind', 'schemer']);
const NICE_ARCHETYPES = new Set(['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat']);
function willLie(name, rng) {
  const arch = players.find(p => p.name === name)?.archetype || '';
  if (VILLAIN_ARCHETYPES.has(arch)) return true;
  if (NICE_ARCHETYPES.has(arch)) return false;
  const st = pStats(name);
  return rng() < (st.strategic / 10) * ((10 - st.loyalty) / 10);
}

/**
 * What the slack decision weighs. Named, not loose, so the profile-drift guard
 * can tell a decision model from a second copy of the stat profile — and so
 * the tuning is legible.
 */
const HAUL = { behind: 0.85, nerve: 0.45, reserve: 0.5, floor: 0.18 };

export const holdTheLine = {
  // Unchanged: seasons and histories resolve this id, and the variant tag
  // stays 'wall' so a season saved before the rewrite still resolves a screen.
  id: 'bb-endurance-wall',
  name: 'Hold the Line',
  category: 'endurance',
  types: ['hoh', 'veto'],
  desc: 'Every houseguest takes hold of a rope running out to a winch, with a chalk mark on the ground at their feet. The winch pulls, and every few minutes it pulls harder — it never eases off for long and it never runs backwards, so the load only ever goes one way. Let your mark end up behind your heels and your night is over on the spot. The one way back is the slack: when the drum drops for a moment, anybody who has been dragged off their mark can haul the ground back hand over hand, at a cost in strength they do not get returned. The last houseguest still standing on their own line wins.',
  // Reading the machine is genuinely part of it — the slack is not announced —
  // which is what intuition is doing here and why it is small but real.
  stats: { endurance: 0.38, physical: 0.32, boldness: 0.18, intuition: 0.12 },
  // Volatility widens the spread rather than lowering the hold. See the note
  // in _shared.js: a competition that eliminates round after round pays for
  // its own swing, which this one does through `volLift`.
  spreadStat: 'temperament',
  weight: () => 1.1,

  simulate(participants, context, api, rng) {
    const beats = [];
    const steps = [];
    const breakdown = {};
    const slipSay = makePicker(rng);
    const holdSay = makePicker(rng);
    const outSay = makePicker(rng);
    const haulSay = makePicker(rng);
    const restSay = makePicker(rng);
    const burnSay = makePicker(rng);
    const crewSay = makePicker(rng);
    const threwSay = makePicker(rng);
    const beyondSay = makePicker(rng);
    const lastTwoSay = makePicker(rng);
    const slackSay = makePicker(rng);
    const trueSay = makePicker(rng);
    const falseSay = makePicker(rng);

    const state = participants.map(name => {
      const s = pStats(name);
      const t = throwRead(name, context, rng);
      const anchor = aptitude(name, holdTheLine.stats) / 10;
      const vol = clamp((10 - s.temperament) / 10, 0, 1);
      return {
        name, anchor, vol,
        // Everything is measured in inches of ground off the chalk mark. Zero
        // is standing on your own line; LIMIT is over it and gone.
        ground: 0, best: 0, worst: 0,
        // What is left to spend. Hauling costs it; resting returns a little.
        reserve: 55 + anchor * 55,
        fatigue: 0, burn: 0,
        base: Math.round(aptitude(name, holdTheLine.stats) * 100) / 100,
        ear: clamp(s.intuition / 10, 0, 1),          // hears the drum change
        nerve: clamp(s.boldness / 10, 0, 1),
        threw: t.threw, threwChance: t.chance,
        haveNot: (context.haveNots || []).includes(name),
        danger: dangerLevel(name, context),
        hauls: 0, rests: 0, luck: 0, hnCost: 0, log: [],
        out: false, outRound: 0, outVia: null,
      };
    });

    const standing = () => state.filter(p => !p.out);
    const gone = () => state.filter(p => p.out);

    beats.push(beat(OPEN_LINES[Math.floor(rng() * OPEN_LINES.length)],
      participants.slice(0, 3), 'THE ROPES'));
    steps.push({ kind: 'open', round: 0, notch: '', pull: 0, standing: state.length, ground: {} });

    // The step's own fields go FIRST and the per-player map last, so nothing a
    // caller passes can shadow it. Written the other way round, the win step —
    // which carries a scalar `ground` for the winner — replaced the whole
    // track with a single number, and the screen drew the final card of the
    // competition using the previous card's positions. Nothing looked wrong;
    // the markers were simply one beat behind on the beat that mattered most.
    const say = (text, who, badgeText, badgeClass, step) => {
      beats.push(beat(text, who, badgeText, badgeClass));
      steps.push({
        ...step,
        standing: standing().length,
        ground: Object.fromEntries(state.map(p => [p.name, Math.round(p.ground)])),
      });
    };

    let round = 0;
    let lastCall = null;      // { by, honest } — a call standing over this slack

    let duelFrom = null;      // the load the last two were left holding

    while (standing().length > 1 && round < MAX_ROUNDS) {
      const live = standing();
      // ── the last two ──
      //
      // Once it is down to two the machine stops climbing and simply holds.
      // Dramatically it is the right shape — two people and a constant, awful
      // load, for as long as it takes — and mechanically it is what stops the
      // competition ending in a dead heat every other week. At full ladder
      // speed the last pair were both losing ten to fifteen inches a notch, so
      // any gap smaller than that put them over the line together and the
      // night was settled by which of them was marginally less far past it:
      // 52% of all nights finished that way. Held at a constant load they
      // separate on their own holding power, which is what the competition is
      // supposed to be measuring.
      if (live.length === 2 && duelFrom == null) duelFrom = notchAt(round, beyondSay).pull;
      const notch = duelFrom != null
        ? { ...notchAt(round, beyondSay), pull: round1(duelFrom * 0.92), label: 'THE LAST TWO',
          line: lastTwoSay(LAST_TWO_LINES) }
        : notchAt(round, beyondSay);

      say(notch.line, live.slice(0, 4).map(p => p.name), notch.label, 'challenge',
        { kind: 'notch', round: round + 1, notch: notch.label, pull: round1(notch.pull) });

      // ── the pull ──
      for (const p of live) {
        const noise = (rng() - 0.5) * (3.4 + p.vol * 4.0);
        p.luck -= noise;
        // What they can hold right now. Fatigue is the only thing that lowers
        // it, which is why the slack decision is the whole competition.
        // Deliberately a narrow gradient — roughly 7 to 14 across the whole
        // cast rather than 5 to 15. At the steep end of the ladder every unit
        // of holding power compounds into inches every single notch, and a 3x
        // spread handed the two strongest houseguests in the house 79% of the
        // wins between them. Strength should decide who is FAVOURED, not who
        // has already won.
        const hold = (6 + p.anchor * 9) * clamp(1 - p.fatigue * 0.055, 0.3, 1);
        let net = notch.pull - hold + noise;
        if (p.haveNot) { const before = net; net += 0.55; p.hnCost += net - before; }
        if (p.threw) net += 5.5;

        if (net > 0) {
          p.ground += net * 1.45;
          p.fatigue += 0.5 + net * 0.06;
        } else {
          // Holding costs less than losing, and a strong houseguest creeps
          // back onto the mark on their own. Never past it — the winch does
          // not give ground away, it only ever fails to take it.
          p.ground = Math.max(0, p.ground + net * 0.22);
          p.fatigue += 0.34;
        }
        // Hands are what actually beat this field, and they are the one
        // thing raw holding power makes WORSE rather than better: the
        // houseguest strong enough to still be out there at the eighth notch
        // is the houseguest who has had the most rope through their palms for
        // the longest. Burn therefore accrues off the LOAD being carried, not
        // off ground lost — which is what keeps the strongest anchor in the
        // yard from simply winning, and it is the honest reason too.
        p.burn += notch.pull * 0.075 + Math.max(0, net) * 0.34;
        p.ground = Math.max(0, p.ground);
        p.worst = Math.max(p.worst, p.ground);
        p.log.push({ round: round + 1, pull: round1(notch.pull), net: round1(net), ground: Math.round(p.ground) });

        // Hands go. The upset: a big instant loss that no amount of holding
        // power prevents, so the strongest houseguest in the yard can still
        // have the night taken off them by their own skin.
        if (p.burn > 22 && rng() < 0.12) {
          const lost = 9 + rng() * 13;
          p.ground += lost;
          p.burn *= 0.45;
          say(burnSay(BURN_LINES)(p.name, pron(p.name)), [p.name], 'ROPE BURN', 'red',
            { kind: 'burn', round: round + 1, who: p.name, lost: Math.round(lost) });
        } else if (net > 5.5 && rng() < 0.15) {
          say(slipSay(SLIP_LINES)(p.name, pron(p.name), Math.round(net * 1.45)),
            [p.name], 'LOSES GROUND', 'challenge',
            { kind: 'slip', round: round + 1, who: p.name, lost: Math.round(net * 1.45) });
        }
      }

      // ── over the line ──
      //
      // Furthest over goes first, which matters on the notch that takes the
      // last two together: the survivor is then the one who gave up the least
      // ground rather than whoever the array happened to hold last. Before
      // this, a winner could finish eighty-one inches past a sixty-inch line
      // while the screen drew them beyond their own red mark and the narration
      // called them the last one standing on it.
      for (const p of [...standing()].sort((a, b) => b.ground - a.ground)) {
        if (standing().length <= 1) break;
        if (p.ground < LIMIT) continue;
        p.out = true; p.outRound = round + 1; p.outVia = p.threw ? 'threw' : 'over';
        if (p.threw) {
          say(threwSay(THROW_LINES)(p.name), [p.name], 'THREW IT', 'grey',
            { kind: 'threw', round: round + 1, who: p.name });
        } else {
          const badge = gone().filter(x => x.outVia === 'over').length === 1 ? 'FIRST OVER' : 'OVER THE LINE';
          say(outSay(OUT_LINES)(p.name, pron(p.name)), [p.name], badge, 'challenge',
            { kind: 'out', round: round + 1, who: p.name, at: round + 1 });
          if (round >= 5) api.popDelta(p.name, 1);
        }
      }
      if (standing().length <= 1) { round++; break; }

      // ── the slack ──
      //
      // Every third notch the drum drops for a few seconds. It is the only
      // way anybody gets ground back, and it is not announced.
      // Every third notch early, every other notch once the machine is
      // straining. A houseguest can only be saved by a slack they live long
      // enough to reach, and at the steep end of the ladder a three-notch gap
      // is longer than anybody deep enough to need one has left.
      const slackNow = round >= 6 ? (round + 1) % 2 === 0 : (round + 1) % 3 === 0;
      if (round >= 1 && slackNow) {
        lastCall = null;
        const live2 = standing();

        // Somebody may hear it coming and say so — honestly or otherwise.
        const callers = live2.filter(p => p.ear > 0.55).sort((a, b) => b.ear - a.ear);
        const caller = callers[0];
        if (caller && rng() < caller.ear * 0.7) {
          const lying = willLie(caller.name, rng) && rng() < 0.55;
          lastCall = { by: caller.name, honest: !lying };
          const cp = pron(caller.name);
          // Through the pickers, not a bare index: the same houseguest can call
          // the slack on three different notches, and a flat random draw from
          // three lines repeats on them.
          say(lying ? falseSay(CALL_FALSE)(caller.name, cp) : trueSay(CALL_TRUE)(caller.name, cp),
          [caller.name], lying ? 'CALLS IT' : 'CALLS THE SLACK', lying ? 'red' : 'green',
          { kind: 'call', round: round + 1, who: caller.name, honest: !lying });
        }

        say(slackSay(SLACK_LINES),
          live2.map(p => p.name).slice(0, 5), 'SLACK', 'gold',
          { kind: 'slack', round: round + 1 });

        // A false call is only heard by people who would listen to that
        // person — which is what makes it a betrayal rather than a broadcast.
        const believers = new Set();
        if (lastCall && !lastCall.honest) {
          for (const p of live2) {
            if (p.name === lastCall.by) continue;
            let b = 0;
            try { b = getBond(lastCall.by, p.name); } catch { b = 0; }
            if (b >= 2 && rng() < 0.75) believers.add(p.name);
          }
        }

        for (const p of live2) {
          const behind = clamp(p.ground / LIMIT, 0, 1);
          const reserveLeft = clamp(p.reserve / 110, 0, 1);
          const want = behind * HAUL.behind + p.nerve * HAUL.nerve
            + reserveLeft * HAUL.reserve + p.danger * 0.4 + HAUL.floor;
          const goes = believers.has(p.name) || rng() < want * 0.3;
          if (!goes || p.ground < 9) {
            p.rests++;
            p.fatigue = Math.max(0, p.fatigue - 1.5);
            p.reserve += 5;
            if (p.ground >= 9 && rng() < 0.1) {
              say(restSay(REST_LINES)(p.name, pron(p.name)), [p.name], 'HOLDS STATION', 'grey',
                { kind: 'rest', round: round + 1, who: p.name });
            }
            continue;
          }

          if (believers.has(p.name)) {
            // Hauling against a machine at full power. Everything spent, no
            // ground, and the rope takes a little more on the way.
            const cost = 14 + rng() * 10;
            p.reserve -= cost;
            p.fatigue += 4.5;
            p.ground += 3 + rng() * 6;
            p.burn += 4;
            say(BURNED_BY_CALL[Math.floor(rng() * BURNED_BY_CALL.length)](p.name, pron(p.name), lastCall.by),
              [p.name, lastCall.by], 'BURNED', 'red',
              { kind: 'burned', round: round + 1, who: p.name, by: lastCall.by });
            api.addBond(lastCall.by, p.name, -2.2);
            api.record(p.name, 'line-false-call-victim', { by: lastCall.by, round: round + 1 });
            continue;
          }

          // A real haul. How much comes back is strength and what is left, and
          // an honest call means being set and ready when it arrives.
          const heard = lastCall?.honest && lastCall.by !== p.name;
          // A PROPORTION of the deficit, not a flat number of inches, and
          // this is the difference between the mechanic existing and not.
          // Measured with a flat haul, the comeback win — the entire reason
          // this competition is a line and not another wall — happened zero
          // times in three hundred nights: by the time anybody was deep enough
          // to need it, the late notches were taking more ground per notch
          // than a haul could return. Proportional, it self-scales. Somebody
          // four inches down gets almost nothing back and would be wasting
          // their reserve; somebody fifty inches down and one notch from gone
          // can take half of it back in six seconds, which is worth everything
          // they have and is the best thing that happens in the competition.
          const rate = clamp(0.30 + p.anchor * 0.28 + reserveLeft * 0.22, 0.25, 0.78);
          const back = p.ground * rate * (heard ? 1.15 : 1);
          p.ground -= back;
          p.hauls++;
          p.reserve -= 12 + rng() * 9;
          p.fatigue += 3.4;
          p.best = Math.max(p.best, back);
          say(haulSay(HAUL_LINES)(p.name, pron(p.name), Math.round(back)), [p.name], 'HAULS IT BACK', 'green',
            { kind: 'haul', round: round + 1, who: p.name, back: Math.round(back) });
          api.popDelta(p.name, 1);
          if (heard) {
            api.addBond(lastCall.by, p.name, 0.7);
            api.record(p.name, 'line-heard-the-call', { from: lastCall.by, round: round + 1, inches: Math.round(back) });
          }
        }

        if (lastCall && !lastCall.honest && believers.size) {
          api.popDelta(lastCall.by, -2);
          api.record(lastCall.by, 'line-called-a-false-slack',
            { victims: [...believers], round: round + 1 });
        }
      }

      // ── the yard ──
      const still = standing();
      if (still.length > 1 && round >= 2 && rng() < 0.22) {
        const shown = still[Math.floor(rng() * still.length)];
        say(holdSay(HOLD_LINES)(shown.name, pron(shown.name)), [shown.name], 'ON THE MARK', 'challenge',
          { kind: 'hold', round: round + 1, who: shown.name });
      }
      // The people already out do not go inside. They sit on the grass and
      // they have opinions, and being shouted at from the grass is part of it.
      const crew = gone().filter(p => p.outVia === 'over');
      if (crew.length && still.length > 1 && rng() < 0.15) {
        const heckler = crew[Math.floor(rng() * crew.length)];
        const target = still[Math.floor(rng() * still.length)];
        say(crewSay(GROUND_CREW)(heckler.name, target.name), [heckler.name, target.name],
          'FROM THE GRASS', 'grey',
          { kind: 'crew', round: round + 1, who: heckler.name, at: target.name });
        let b = 0;
        try { b = getBond(heckler.name, target.name); } catch { b = 0; }
        // Shouting at somebody for an hour is either a bond or an incident,
        // and which one depends entirely on where the two of them started.
        api.addBond(heckler.name, target.name, b >= 1 ? 0.5 : -0.5);
      }

      round++;
    }

    // ── how it ended ──
    let champ;
    let onGround = false;
    const left = standing();
    if (left.length === 1) {
      champ = left[0];
    } else {
      // The winch ran out of notches before it ran out of people. Whoever is
      // closest to their own mark has held the most line, which is the thing
      // the competition was measuring all along.
      onGround = true;
      const sorted = [...left].sort((a, b) => a.ground - b.ground);
      champ = sorted[0];
      sorted.slice(1).forEach(p => { p.out = true; p.outRound = round; p.outVia = 'measured'; });
      say(`The winch is stopped with ${sorted.length} of them still on their feet, and it is measured off the chalk instead. ${champ.name} has given up less ground than anybody else in the yard.`,
        sorted.map(p => p.name).slice(0, 5), 'MEASURED OFF', 'gold',
        { kind: 'measured', round, who: champ.name });
    }

    // The winch does not stop for the winner. On the notch that takes the last
    // two together, whoever is left is over their own line as well — they were
    // simply less far over — and saying "still standing on their own line"
    // about somebody the screen is drawing past their red mark is the kind of
    // small lie a viewer catches immediately.
    const atTheLine = !onGround && champ.ground >= LIMIT;
    // How close the last two actually were. By the last notch the load is past
    // what anybody can hold, so the winner being over their own mark is the
    // normal end of this competition rather than a photo finish — it is only a
    // tape finish when the margin is genuinely nothing, and calling every one
    // of them a tape finish would spend the phrase on half the season.
    const lastOut = state.filter(p => p !== champ && (p.outVia === 'over' || p.outVia === 'measured'))
      .sort((a, b) => (b.outRound - a.outRound) || (a.ground - b.ground))[0];
    const margin = lastOut ? Math.abs(Math.round(lastOut.ground - champ.ground)) : 99;
    const tape = atTheLine && margin <= 4;

    const cp = pron(champ.name);
    const winBadge = context.type === 'veto' ? 'VETO' : 'HOH';
    // Written as a chain rather than a nested ternary on purpose: there are
    // five ways this competition can end and a five-deep ternary is how one of
    // them quietly gets welded to the wrong condition.
    let winLine;
    if (tape) {
      winLine = `The last two go over within a second of each other and it comes down to the tape — ${margin} inch${margin === 1 ? '' : 'es'} in it, measured on the ground, after a night that ran to ${round} notches. ${champ.name} takes it by less than the length of ${cp.posAdj} own boot.`;
    } else if (champ.hauls > 0 && champ.worst > LIMIT * 0.62) {
      winLine = `${champ.name} wins Hold the Line, which nobody watching at the halfway point would have put money on — ${cp.sub} ${vb(cp, 'was', 'were')} ${Math.round(champ.worst)} inches off ${cp.posAdj} mark and hauled ${cp.posAdj} way back out of it.`;
    } else if (atTheLine) {
      winLine = `${champ.name} is past ${cp.posAdj} mark by the end. Everybody is, by the end — the load goes somewhere none of them can hold and the competition stops being about stopping it — but ${cp.sub} gave up less ground than anybody else out there, and that is the whole competition.`;
    } else if (onGround) {
      winLine = `${champ.name} takes it on the chalk, ${Math.round(champ.ground)} inches off the mark when the drum stopped.`;
    } else {
      winLine = `${champ.name} is the last one standing on ${cp.posAdj} own line. The winch is switched off and the rope goes slack in ${cp.posAdj} hands, and it takes ${cp.obj} a moment to let go of it.`;
    }
    say(winLine, [champ.name], winBadge, 'gold',
      { kind: 'win', round, who: champ.name, atTheLine, tape, margin,
        finalGround: Math.round(champ.ground), worst: Math.round(champ.worst) });

    api.popDelta(champ.name, 2);
    api.record(champ.name, 'endurance-win',
      { comp: 'hold-the-line', rounds: round, hauls: champ.hauls, worst: Math.round(champ.worst) });

    // Placements: last standing, then by how long they lasted, then by how
    // much line they were still holding when they went.
    const others = state.filter(p => p !== champ)
      .sort((a, b) => (b.outRound - a.outRound) || (a.worst - b.worst));
    const ordered = [champ, ...others];

    ordered.forEach((p, i) => {
      breakdown[p.name] = {
        base: p.base, roll: Math.round(p.luck * 100) / 100,
        rounds: p.outRound || round, ground: Math.round(p.ground), worst: Math.round(p.worst),
        anchor: Math.round(p.anchor * 100) / 100,
        volatility: Math.round(p.vol * 100) / 100,
        hauls: p.hauls, rests: p.rests, inchesBack: Math.round(p.best),
        burn: Math.round(p.burn), out: p.outVia,
        threw: p.threw, threwChance: p.threwChance,
        haveNot: p.haveNot, haveNotPenalty: round1(p.hnCost),
        danger: Math.round(p.danger * 100) / 100,
        log: p.log,
        score: (p.outRound || round) * 10 + (LIMIT - Math.round(p.ground)) + (ordered.length - i) * 0.01,
      };
    });

    const entries = ordered.map((p, i) => ({
      name: p.name,
      score: (p.outRound || round) * 10 + (LIMIT - Math.round(p.ground)) + (ordered.length - i) * 0.01,
      threw: p.threw,
    }));

    return toResult(entries, {
      beats, breakdown, variant: 'wall',
      detail: {
        steps, rounds: round, limit: LIMIT,
        finished: onGround ? 'measured' : tape ? 'tape' : atTheLine ? 'at-the-line' : 'last-standing',
        hauls: state.reduce((n, p) => n + p.hauls, 0),
        falseCall: steps.some(s => s.kind === 'call' && s.honest === false),
      },
      text: `${champ.name} wins Hold the Line${onGround ? ', measured off the chalk' : ''} after ${round} notches.`,
    });
  },
};

export default holdTheLine;
