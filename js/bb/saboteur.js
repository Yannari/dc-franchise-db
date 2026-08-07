// ══════════════════════════════════════════════════════════════════════
// bb/saboteur.js — the first season-long twist
// ══════════════════════════════════════════════════════════════════════
//
// Every other twist in this house is scheduled: it arrives on a week, changes
// that week's rules, and leaves. The Saboteur is installed on night one and
// never leaves — it is a second game running underneath the first one, played
// by exactly one person, for money the game itself does not award.
//
// The shape, from BB12 — and from the wiki rather than from memory, because
// three details of it are the twist and none of them were obvious:
//
//   THE MISSIONS COME FROM THE AUDIENCE. "The Saboteur's mission will be to
//   carry out viewer suggestions on how best to disrupt the lives of fellow
//   players." So the audience is the employer, and the pay is the audience's
//   opinion of the job — BB26 made that explicit by letting America choose the
//   figure ($0 / $5,000 / $10,000 / $20,000) after watching the week. A
//   sabotage nobody enjoyed is worth nothing, however well it worked.
//
//   THEY BROADCAST. The Saboteur speaks to the house through the living-room
//   television, behind static, as a silhouette with an altered voice — and uses
//   it to THREATEN and to warn of sabotage coming. The house is not quietly
//   suffering accidents; it is being taunted on a schedule by somebody standing
//   in the room while it happens.
//
//   SUSPICION EVICTS. Annie went out 10-0 in week one having completed three
//   acts, and the wiki names the reason: "one of the main reasons for Annie's
//   eviction was because of suspicion of her being the Saboteur." Being
//   suspected has to cost you the game, not just a bond.
//
// Survive to the halfway point — five weeks, in the original — and the money is
// theirs, the house is told exactly who has been doing this to them, and they
// go back to being an ordinary houseguest with a target on their back who can
// still win the game.
//
// The reason this is worth building rather than being another power: it is the
// only mechanic in the house whose FAILURE mode is interesting. A power that
// nobody catches is a power that worked. A sabotage nobody catches is a house
// that becomes certain about the wrong person — and this house already models
// that. Every mission leaves a trace, whoever notices it names somebody, and
// the name they land on is chosen the way `_misattribute` chooses one: from who
// they already distrust, not from who did it.
//
// Nothing here scores a competition or writes a ballot. The engine states what
// the saboteur did and what the house believes about it; the week's own systems
// carry the consequences, because a second opinion about how a house thinks is
// how a season ends up with two of everything.
import { gs, players } from '../core.js';
import { pStats, pronouns } from '../players.js';
import { addBond, getBond } from '../bonds.js';
import { rememberStrategy } from '../strategy-memory.js';

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const round2 = v => Math.round(v * 100) / 100;
const stat = (name, key) => Number(pStats(name)?.[key]) || 0;
const P = name => { try { return pronouns(name); } catch { return { sub: 'they', obj: 'them', posAdj: 'their', Sub: 'They' }; } };

/** The saboteur's record, or null when the season is not running one. */
export function saboteurState() {
  return gs.bb?.saboteur || null;
}

/** Is this houseguest the one being paid to wreck it? */
export const isSaboteur = name => !!name && saboteurState()?.player === name;

// ── who gets the job ────────────────────────────────────────────────────
//
// Not at random, and not the best player. Production casts a saboteur to be
// WATCHABLE and to survive long enough to be worth watching: somebody with the
// nerve to do it, the social cover to explain themselves afterwards, and enough
// of a poker face that the first week does not end the twist. A challenge beast
// makes a poor saboteur — every eye in the house is already on them.
function castingScore(name) {
  const a = (players || []).find(p => p.name === name)?.archetype || '';
  let score = stat(name, 'boldness') * 0.30
    + stat(name, 'social') * 0.26
    + stat(name, 'strategic') * 0.22
    + stat(name, 'temperament') * 0.12
    + (10 - stat(name, 'physical')) * 0.10;
  if (['villain', 'mastermind', 'schemer', 'chaos-agent', 'wildcard'].includes(a)) score += 1.6;
  if (['hero', 'loyal-soldier'].includes(a)) score -= 1.4;
  if (a === 'challenge-beast') score -= 1.2;   // already watched by everybody
  return score;
}

/**
 * Install the twist. Called once, at the top of the season.
 *
 * @returns the state, or null when the house is too small to hide anybody in.
 */
export function installBBSaboteur(house = [], { bankWeek = 5, rng = Math.random, pick = null } = {}) {
  const cast = house.filter(Boolean);
  if (cast.length < 6) return null;

  // A named choice wins outright. The Mole has let a user cast it by hand since
  // it shipped, and a season twist you cannot point at a specific houseguest is
  // a twist you cannot tell a story with.
  if (pick && cast.includes(pick)) return seat(pick, bankWeek);

  // Weighted rather than ranked: the same cast should not always produce the
  // same saboteur, and the second-best candidate taking the job is frequently
  // the better season.
  const weights = cast.map(n => ({ name: n, w: Math.max(0.4, castingScore(n)) }));
  const total = weights.reduce((s, x) => s + x.w, 0);
  let roll = rng() * total;
  let picked = weights[0].name;
  for (const entry of weights) { roll -= entry.w; if (roll <= 0) { picked = entry.name; break; } }

  return seat(picked, bankWeek);
}

function seat(picked, bankWeek) {
  gs.bb ||= {};
  gs.bb.saboteur = {
    player: picked,
    bankWeek: Math.max(2, Number(bankWeek) || 5),
    banked: 0,
    prize: 50000,
    missions: [],
    // suspicion[suspect][observer] — who believes what about whom. A saboteur
    // who is never suspected and an innocent who is convicted both live here.
    suspicion: {},
    revealed: false,
    caught: false,
    survived: false,
    installedWeek: (gs.bb.weeks?.length || 0) + 1,
    // What the audience thinks of the job so far. This, not the running total,
    // is what the money is actually paid against — see `audiencePayout`.
    applause: 0,
  };
  return gs.bb.saboteur;
}

// ── the missions ────────────────────────────────────────────────────────
//
// Written by the audience, which is the twist's own rule and also the reason
// they have to be ENTERTAINING rather than merely effective. Each one states
// what the week must contain before it can be offered, how hard it is to bring
// off, how loud it is, and what it is worth in applause — because the pay is
// the audience's opinion of the job, not the damage done.
//
// `noise` is the risk model: a lie told in a storage room is nearly invisible,
// and a competition rigged in front of everybody is not. `spice` is what the
// audience thought of it, which is a different axis entirely — the quietest
// missions are frequently the least fun to watch, and the twist should not pay
// the same for both.

const MISSIONS = [
  {
    id: 'plant',
    name: 'Plant a name',
    brief: 'Make somebody believe a lie about somebody else, and let the house do the rest.',
    pay: 5000, noise: 0.26, spice: 0.6, difficulty: 0.28,
    can: ctx => ctx.others.length >= 3,
    run(ctx, rng) {
      // The victim is somebody with something to lose, and the accused is
      // whoever the victim is already half-ready to believe it of. The lie only
      // has to be plausible; the house supplies the conviction.
      const victim = [...ctx.others].sort((a, b) =>
        (ctx.reads[b] ?? 0) - (ctx.reads[a] ?? 0))[Math.floor(rng() * 2)] || ctx.others[0];
      const accused = ctx.others.filter(n => n !== victim)
        .sort((a, b) => getBond(victim, a) - getBond(victim, b))[0];
      if (!accused) return null;
      try { addBond(victim, accused, -2.6); } catch { /* nothing to poison */ }
      try {
        rememberStrategy(victim, accused, 'went-behind-my-back', ctx.week, 2,
          { format: 'big-brother', twist: 'bb-saboteur', planted: true });
      } catch { /* the grudge stands without the memory */ }
      return {
        victim, accused, touched: [victim, accused],
        text: `${ctx.sab} tells ${victim}, quietly and with the right amount of reluctance, that ${accused} `
          + `has been saying ${victim}'s name in the other room. None of it happened. ${victim} believes all of it.`,
        houseText: `${victim} stops speaking to ${accused} and will not say why.`,
        botched: `${ctx.sab} gets three sentences into it before ${victim} says "who told you that?" — `
          + `and the answer to that question is the one thing ${P(ctx.sab).sub} cannot give.`,
      };
    },
  },
  {
    id: 'comfort',
    name: 'Wreck the week',
    brief: 'The food, the hot water, the one room anybody actually wants to be in.',
    pay: 4000, noise: 0.62, spice: 0.85, difficulty: 0.2,
    can: ctx => ctx.others.length >= 3,
    run(ctx, rng) {
      const target = ctx.hoh && ctx.hoh !== ctx.sab ? ctx.hoh : ctx.others[0];
      const flavour = [
        `${ctx.sab} empties most of a week's food into a bin bag at four in the morning and puts the bag outside.`,
        `The hot water goes off. It goes off because ${ctx.sab} turned it off, and it stays off for two days.`,
        `Every alarm in the house goes at twenty-minute intervals through the night. ${ctx.sab} sleeps through it beautifully.`,
        `${ctx.sab} takes the batteries out of every microphone pack ${P(ctx.sab).sub} can reach and buries them in the garden.`,
        `The lights go out at nine and stay out. Somewhere in the dark ${ctx.sab} is standing perfectly still, enjoying it.`,
        `Every photograph on the memory wall is turned to face the wrong way. It takes the house an hour to notice and a day to stop talking about it.`,
      ];
      for (const n of ctx.others) { try { addBond(n, target, -0.4); } catch { /* nobody to blame yet */ } }
      return {
        touched: [...ctx.others],
        text: flavour[Math.floor(rng() * flavour.length)],
        houseText: `The house spends the morning working out who did it. ${target} gets most of the looks, `
          + `for no better reason than having the room with the door that locks.`,
        botched: `${ctx.sab} is halfway through it when somebody comes down for water, and has to spend `
          + `ten minutes being extremely normal in a kitchen at four in the morning.`,
      };
    },
  },
  {
    id: 'rig',
    name: 'Rig the competition',
    brief: "Somebody else's Head of Household. Make sure the wrong person wins it.",
    pay: 8000, noise: 0.5, spice: 1, difficulty: 0.42,
    // Never a competition the saboteur is trying to WIN, and never the Block
    // Buster — a houseguest playing to save themselves from the block is playing
    // the real game, and asking them to lose it on purpose is asking them to
    // hand over the season for eight thousand dollars.
    can: ctx => !!ctx.rigTarget,
    run(ctx, rng) {
      const mark = ctx.rigTarget;
      const beneficiary = ctx.others.filter(n => n !== mark)
        .sort((a, b) => getBond(ctx.sab, b) - getBond(ctx.sab, a))[0] || ctx.others[0];
      const how = [
        `${ctx.sab} gets to the yard first and moves one marker about four inches. ${mark} spends the whole competition measuring from the wrong place.`,
        `${ctx.sab} loosens the thing ${mark} is about to put ${P(mark).posAdj} whole weight on, and then watches ${P(mark).obj} put ${P(mark).posAdj} whole weight on it.`,
        `${ctx.sab} feeds ${mark} the wrong number in the ninety seconds before it starts, kindly, as a friend.`,
        `${ctx.sab} counts out loud for ${mark} and counts wrong once, at the exact point where being counted for is the only thing keeping ${P(mark).obj} in it.`,
      ];
      try { addBond(mark, beneficiary, -1.2); } catch { /* no bond to burn */ }
      return {
        target: mark, beneficiary, touched: [mark],
        text: how[Math.floor(rng() * how.length)],
        houseText: `${mark} loses a competition ${P(mark).sub} should have won and cannot explain how, `
          + `which is the worst version of losing one.`,
        botched: `${mark} catches ${ctx.sab}'s hand on it. Nothing is said, in the way that nothing being said `
          + `is much worse than something being said.`,
      };
    },
  },
  {
    id: 'rattle',
    name: 'Break a campaign',
    brief: 'Take the legs out of whoever is campaigning to stay, on the day they need them.',
    pay: 6000, noise: 0.4, spice: 0.65, difficulty: 0.34,
    can: ctx => ctx.nominees.filter(n => n !== ctx.sab).length >= 1,
    run(ctx, rng) {
      const target = ctx.nominees.filter(n => n !== ctx.sab)
        .sort((a, b) => (ctx.reads[b] ?? 0) - (ctx.reads[a] ?? 0))[0];
      if (!target) return null;
      const p = P(target);
      for (const n of ctx.others.filter(x => x !== target)) {
        try { addBond(n, target, -0.8); } catch { /* nothing to lose */ }
      }
      return {
        target, touched: [target],
        text: `${target} spends the day campaigning. ${ctx.sab} spends it arriving in each room `
          + `about ninety seconds beforehand, and by the time ${p.sub} ${p.sub === 'they' ? 'get' : 'gets'} there `
          + `the answer has already been decided in the doorway.`,
        houseText: `${target} cannot work out why every conversation feels like it has already finished.`,
        botched: `${target} walks in on the end of one of them and hears exactly enough to know what it was.`,
      };
    },
  },
  {
    id: 'burn',
    name: 'Burn a secret',
    brief: 'Somebody in this house is holding something. Tell everybody.',
    pay: 7000, noise: 0.55, spice: 0.8, difficulty: 0.38,
    can: ctx => ctx.secretHolders.length > 0,
    run(ctx, rng) {
      const holder = ctx.secretHolders[Math.floor(rng() * ctx.secretHolders.length)];
      if (!holder || holder === ctx.sab) return null;
      const p = P(holder);
      for (const n of ctx.others.filter(x => x !== holder)) {
        try { addBond(n, holder, -1.1); } catch { /* no bond to spend */ }
      }
      return {
        target: holder, touched: [holder],
        text: `${ctx.sab} makes sure the house finds out that ${holder} has been sitting on something, `
          + `and does it without ever being the person who said it out loud.`,
        houseText: `${holder} spends the rest of the week explaining a secret ${p.sub} had every intention of keeping.`,
        botched: `The story gets one room further than ${ctx.sab} meant it to and comes back with `
          + `${ctx.sab}'s name attached to it.`,
      };
    },
  },
  {
    id: 'throw',
    name: 'Lose on purpose',
    brief: 'A competition they were in the middle of, dropped where nobody could prove it.',
    pay: 5000, noise: 0.3, spice: 0.35, difficulty: 0.12,
    // Only where losing costs them nothing they were going to keep. Never a
    // Block Buster: that one is played to get off the block.
    can: ctx => ctx.competed && !ctx.wonSomething && !ctx.onTheBlock,
    run(ctx) {
      return {
        touched: [ctx.sab],
        text: `${ctx.sab} is not out of that competition because ${P(ctx.sab).sub} could not do it. `
          + `${P(ctx.sab).Sub} stopped, at a point where stopping looks exactly like failing.`,
        houseText: `Nobody thinks anything of it. That is the point of it.`,
        botched: `${ctx.sab} makes it look a little too easy on the way out, and one person in that yard `
          + `files it away without knowing why.`,
      };
    },
  },
];

// ── the broadcast ───────────────────────────────────────────────────────
//
// From the wiki: the Saboteur speaks to the house through the living-room
// television, behind static, as a silhouette with an altered voice — and uses
// it to threaten, and to warn of sabotage coming. It is the difference between
// a house suffering accidents and a house being told, on a schedule, that
// somebody standing in the room is doing this to them.

const BROADCASTS = [
  () => `"Good evening. One of the people sitting on that sofa with you is not playing this game. `
    + `You have been very kind to them this week." The screen goes back to static.`,
  () => `"Something in this house is going to go wrong in the next three days. I could tell you what. `
    + `I would rather watch you all be careful about the wrong thing."`,
  n => `"You have all been talking about who it is. Two of you have said a name out loud. `
    + `Both of you were wrong, and one of you was very unkind about it."`,
  () => `"I want to thank whoever did the shopping list this week. It made my job considerably easier."`,
  () => `"There is no point looking at each other. I am extremely good at this, and you are extremely tired."`,
  () => `"Enjoy the competition tomorrow. One of you is going to lose it for a reason you will never be told."`,
];

// ── the trace ───────────────────────────────────────────────────────────

/**
 * Who noticed, and who they decided it was.
 *
 * The second half is the interesting one. A houseguest who senses a sabotage
 * does not therefore know who did it — they reach for whoever they already
 * distrust, exactly as `_misattribute` does after an uncaught flip. So a loud
 * mission can end with the whole house certain, and certain about the wrong
 * person, which is the outcome this twist exists to produce.
 */
function traceMission({ sab, mission, result, house, week, rng }) {
  const state = saboteurState();
  const notices = [];
  // How well this saboteur hides, 0..0.28. Measured, not guessed: the first
  // cut multiplied raw 0-10 stats by 0.06, which put a mid-social houseguest's
  // cover at 0.45 and clamped every identification roll to the floor — over
  // sixty runs the house named the right person nine times out of seventy and
  // the twist could not be caught at all.
  const cover = (stat(sab, 'social') / 10) * 0.18 + (stat(sab, 'temperament') / 10) * 0.10;
  for (const observer of house) {
    if (observer === sab) continue;
    const near = (result.touched || []).includes(observer);
    const chance = clamp(mission.noise * (near ? 1.5 : 0.7)
      + stat(observer, 'intuition') * 0.03 - cover * 0.5, 0.02, 0.85);
    if (rng() >= chance) continue;

    // They know SOMETHING happened. Whether they land on the right person is a
    // separate roll, and a much harder one — most of the time a house that
    // senses a sabotage convicts whoever it already disliked.
    const readsIt = rng() < clamp(0.12 + stat(observer, 'intuition') * 0.05
      + (near ? 0.12 : 0) - cover * 0.5, 0.03, 0.7);
    const wrong = house.filter(n => n !== observer && n !== sab)
      .sort((a, b) => getBond(observer, a) - getBond(observer, b))[0];
    const named = readsIt ? sab : (wrong || sab);
    const weight = readsIt ? 1 : 0.7;

    (state.suspicion[named] ||= {});
    state.suspicion[named][observer] = round2((state.suspicion[named][observer] || 0) + weight);
    if (named !== sab) {
      try { addBond(observer, named, -1.3); } catch { /* they were not close anyway */ }
    }
    notices.push({ observer, named, correct: named === sab, week });
  }
  return notices;
}

/** How exposed the saboteur is right now, 0..1 — their own read of the room. */
export function saboteurExposure() {
  const state = saboteurState();
  if (!state) return 0;
  const onThem = state.suspicion[state.player] || {};
  const total = Object.values(onThem).reduce((s, v) => s + v, 0);
  return clamp(total / 6, 0, 1);
}

// ── the week ────────────────────────────────────────────────────────────

const REFUSALS = [
  (n, p) => `${n} reads the mission twice and puts the card face down. Too many people are already looking at ${p.obj} to be seen doing anything at all this week.`,
  (n, p) => `${n} says no. Not out of nerves — out of arithmetic. A week spent being ordinary is worth more than the money on that card.`,
  (n, p) => `The card offers ${p.obj} a job. ${p.Sub} thinks about the two people who have started watching ${p.obj} eat, and declines it.`,
];

const ACCEPTS = [
  n => `${n} takes the card, reads it once, and hands it back without a word. It is agreed.`,
  (n, p) => `${n} does not hesitate. Whatever ${p.sub} came in here to do, ${p.sub} has decided it is this.`,
  (n, p) => `${n} asks one question about the money, gets no answer, and takes the job anyway.`,
];

/**
 * THE BRIEFING — the mission for the week.
 *
 * Runs at the top of the week, before anything has happened, because the whole
 * point of a mission is that it is a job you are given and then have to bring
 * off. It used to be offered and completed in the same breath, which meant
 * there was never a moment where the audience knew what was coming and the
 * house did not — and that moment is the twist.
 *
 * Returns the briefing act, and hangs the accepted job on the week for the
 * debrief to resolve.
 */
export function offerSaboteurMission(week, { rng = Math.random } = {}) {
  const state = saboteurState();
  if (!state || state.survived || state.caught) return null;
  const sab = state.player;
  const house = (week?.houseAtStart || gs.activePlayers || []).filter(Boolean);
  if (!house.includes(sab)) return null;

  const weekNum = Number(week?.num) || (gs.bb?.weeks?.length || 0) + 1;
  const others = house.filter(n => n !== sab);
  const p = P(sab);

  // What this week can actually be sabotaged in. A mission the week cannot
  // support is not offered, rather than offered and fudged.
  //
  // `rigTarget` is the one that needed care: a competition can only be rigged
  // against somebody ELSE, it must not be the Block Buster (which is played to
  // get off the block, and asking somebody to lose that is asking them to hand
  // over their season), and there has to be a competition coming at all.
  const onTheBlock = (week?.nominees || []).includes(sab);
  const ctx = {
    sab, week: weekNum, house, others, onTheBlock,
    hoh: week?.hoh || null,
    nominees: (week?.finalNominees || week?.nominees || []).filter(Boolean),
    competed: !!(week?.vetoPlayers || []).includes(sab) || week?.hoh === sab
      || (week?.veto?.participants || []).includes(sab),
    wonSomething: week?.hoh === sab || week?.vetoWinner === sab,
    secretHolders: (gs.bb?.powers || []).filter(pw => pw && !pw.used && pw.holder && pw.holder !== sab)
      .map(pw => pw.holder),
    reads: Object.fromEntries(others.map(n => [n, getBond(sab, n)])),
  };
  // Somebody else's competition, and a real one.
  //
  // Not gated on the saboteur PLAYING it. The wiki's actual acts were tampering
  // rather than competing — a timer set going, the Head of Household relic made
  // to disappear — and requiring them to be in the yard made the job land twice
  // in sixty weeks, which is not a mechanic, it is a rumour. The mark is
  // whoever they like least among the people who actually competed.
  ctx.rigTarget = others.filter(n => (week?.vetoPlayers || []).includes(n) || week?.hoh === n)
    .sort((a, b) => getBond(sab, a) - getBond(sab, b))[0] || null;

  const eligible = MISSIONS.filter(m => {
    try { return m.can(ctx); } catch { return false; }
  });
  if (!eligible.length) return null;
  // Never the same job two weeks running. Production is writing television, and
  // a saboteur who plants the same lie every Thursday is not a twist, it is a
  // habit — the house would have worked it out by the third one.
  const last = state.missions.at(-1)?.mission;
  const pool = eligible.filter(m => m.id !== last);
  const from = pool.length ? pool : eligible;
  const mission = from[Math.floor(rng() * from.length)];

  // Lines do not repeat across a season. A saboteur who turns down three
  // missions was printing the same sentence three times, and the one place a
  // reader is watching for a tell is exactly the place that cannot be boilerplate.
  const fresh = (list, key) => {
    state.said ||= {};
    const used = state.said[key] || [];
    const open = list.map((_, i) => i).filter(i => !used.includes(i));
    const at = (open.length ? open : list.map((_, i) => i))[
      Math.floor(rng() * (open.length || list.length))];
    state.said[key] = [...(open.length ? used : []), at];
    return list[at];
  };

  // ── do they take it? ──
  //
  // Nerve against exposure. Somebody the house has already started watching
  // turns down work that somebody invisible would take without thinking.
  const exposure = saboteurExposure();
  const nerve = (stat(sab, 'boldness') * 0.55 + stat(sab, 'strategic') * 0.45) / 10;
  const appetite = clamp(0.34 + nerve * 0.55 - exposure * 0.75 - mission.noise * 0.25, 0.05, 0.95);
  // The first job is always taken. Nobody signs up for this, gets handed the
  // card on night one and passes — and a twist whose opening episode is the
  // saboteur declining to do anything is a twist that has not started.
  const accepted = !state.missions.length || rng() < appetite;

  const beats = [];
  // The broadcast happens whether or not the job is taken — the house is being
  // taunted by somebody standing in the room, and that is a weekly fixture
  // rather than a consequence of the mission.
  const taunt = fresh(BROADCASTS, 'broadcast')(sab);
  beats.push({
    text: `The living-room television cuts to static, and then to a silhouette. `
      + `The voice is not anybody's. ${taunt}`,
    players: [], badgeText: 'ON THE HOUSE TELEVISION', badgeClass: 'red',
  });
  beats.push(accepted
    ? { text: fresh(ACCEPTS, 'accept')(sab, p), players: [sab], badgeText: 'TAKES THE JOB', badgeClass: 'red' }
    : { text: fresh(REFUSALS, 'refuse')(sab, p), players: [sab], badgeText: 'PASSES', badgeClass: 'grey' });

  if (!accepted) {
    state.missions.push({ week: weekNum, mission: mission.id, accepted: false, paid: 0, applause: 0 });
  } else {
    week._saboteurJob = { mission, ctx };
  }

  return {
    type: 'saboteur-brief', secret: true, week: weekNum, saboteur: sab,
    mission: { id: mission.id, name: mission.name, brief: mission.brief, pay: mission.pay },
    accepted, taunt, banked: state.banked, prize: state.prize,
    applause: state.applause, bankWeek: state.bankWeek,
    exposure: round2(exposure), beats,
  };
}

/**
 * THE DEBRIEF — whether it came off, and what it cost.
 *
 * Runs after the veto has settled and before the vote, so a mission that breaks
 * somebody's campaign breaks it while campaigning still matters. Accepting used
 * to guarantee the job worked, which is why there was nothing to say at the end
 * of a week: a sabotage that cannot fail is a cutscene.
 */
export function resolveSaboteurMission(week, { rng = Math.random } = {}) {
  const state = saboteurState();
  const job = week?._saboteurJob;
  if (!state || !job || state.survived || state.caught) return null;
  delete week._saboteurJob;
  const { mission, ctx } = job;
  const sab = state.player;
  const house = ctx.house;
  const weekNum = ctx.week;

  // Does it come off? Nerve and wit against how hard the job is, and against a
  // house that is already watching them — the more suspected they are, the
  // fewer places there are to do it unobserved.
  const craft = (stat(sab, 'strategic') * 0.4 + stat(sab, 'social') * 0.3
    + stat(sab, 'boldness') * 0.3) / 10;
  const chance = clamp(0.30 + craft * 0.62 - mission.difficulty * 0.55
    - saboteurExposure() * 0.25, 0.08, 0.94);
  const worked = rng() < chance;

  let result = null;
  try { result = mission.run(ctx, rng); } catch { result = null; }
  if (!result) return null;

  const beats = [];
  if (worked) {
    beats.push({ text: result.text, players: result.touched || [sab],
      badgeText: mission.name.toUpperCase(), badgeClass: 'red' });
    if (result.houseText) {
      beats.push({ text: result.houseText, players: result.touched || [],
        badgeText: 'THE HOUSE', badgeClass: 'grey' });
    }
  } else {
    beats.push({ text: result.botched || `It does not come off. ${sab} gets most of the way there and stops.`,
      players: result.touched || [sab], badgeText: 'IT DOES NOT COME OFF', badgeClass: 'grey' });
  }

  // A botched job is LOUDER than a clean one — being nearly caught is how
  // people get caught — and worth nothing at the bank.
  const noise = worked ? mission.noise : Math.min(0.9, mission.noise * 1.45);
  const notices = traceMission({ sab, mission: { ...mission, noise }, result, house, week: weekNum, rng });
  const caughtBy = notices.filter(n => n.correct);
  const framed = notices.filter(n => !n.correct);

  // ── the pay ──
  //
  // The audience is the employer, so the audience is who this is banked
  // against. A job that worked and was fun to watch pays; a job that worked and
  // bored everybody pays a fraction; a botched one pays nothing but is often
  // the most entertaining thing in the episode, so it still earns applause.
  const applause = round2((worked ? mission.spice : mission.spice * 0.45)
    + (framed.length ? 0.25 : 0) + (caughtBy.length ? -0.15 : 0));
  state.applause = round2(state.applause + applause);
  const paid = worked ? mission.pay : 0;
  state.banked += paid;

  // The other currency, and the one that matters inside the game: the audience
  // has been watching this person do the most watchable thing in the house.
  if (applause > 0) {
    gs.popularity ||= {};
    gs.popularity[sab] = round2((gs.popularity[sab] || 0) + applause * 1.6);
  }

  // Four ways to convict an innocent, because three identical sentences in a
  // row is the screen admitting it only knows one.
  const WRONG_DOORS = [
    (o, n) => `${o} knows something is wrong with this week and decides it is ${n}. `
      + `It is not ${n}, and ${n} will never be told ${P(n).sub} ${P(n).sub === 'they' ? 'were' : 'was'} tried for it.`,
    (o, n) => `${o} has been quietly building a case all week, and tonight ${P(o).sub} `
      + `${P(o).sub === 'they' ? 'finish' : 'finishes'} it. The case is beautifully argued and it is about ${n}, `
      + `who did nothing.`,
    (o, n) => `"It's ${n}." ${o} says it to two people in a bathroom, which in this house is the same as `
      + `saying it to everybody. ${P(n).Sub} ${P(n).sub === 'they' ? 'have' : 'has'} no idea it has started.`,
    (o, n) => `${o} works backwards from who ${P(o).sub} already ${P(o).sub === 'they' ? "don't" : "doesn't"} trust `
      + `and arrives, inevitably, at ${n}. The method is sound. The answer is wrong.`,
  ];
  framed.slice(0, 3).forEach((n, i) => {
    beats.push({
      text: WRONG_DOORS[(i + Math.floor(rng() * WRONG_DOORS.length)) % WRONG_DOORS.length](n.observer, n.named),
      players: [n.observer, n.named], badgeText: 'THE WRONG DOOR', badgeClass: 'red',
    });
  });
  // Three ways to be right about it and say nothing, for the same reason as
  // above: two identical sentences one card apart is a screen with one idea.
  const SAW = [
    (o, x) => `${o} watches ${x} through the whole of it and says nothing. `
      + `Whatever ${P(o).sub} ${P(o).sub === 'they' ? 'have' : 'has'} worked out, `
      + `${P(o).sub} ${P(o).sub === 'they' ? 'are' : 'is'} keeping it.`,
    (o, x) => `${o} does not say a word about it, and starts sitting somewhere ${P(o).sub} can see `
      + `${x} without turning ${P(o).posAdj} head.`,
    (o, x) => `Something in ${o}'s face changes while ${x} is talking, and does not change back. `
      + `${P(o).Sub} will not act on it for another two weeks.`,
    (o, x) => `${o} has it. ${P(o).Sub} also has nothing to prove it with, and one accusation in this `
      + `house is worth exactly one attempt.`,
  ];
  caughtBy.slice(0, 2).forEach((n, i) => {
    beats.push({
      text: SAW[(i + Math.floor(rng() * SAW.length)) % SAW.length](n.observer, sab),
      players: [n.observer, sab], badgeText: 'SOMEBODY SAW', badgeClass: 'gold',
    });
  });

  state.missions.push({ week: weekNum, mission: mission.id, accepted: true, worked,
    paid, applause, caught: caughtBy.length, framed: framed.map(n => n.named) });

  return {
    type: 'saboteur-debrief', secret: true, week: weekNum, saboteur: sab,
    mission: { id: mission.id, name: mission.name, brief: mission.brief, pay: mission.pay },
    worked, chance: round2(chance), result,
    paid, applause, applauseTotal: state.applause,
    banked: state.banked, prize: state.prize, bankWeek: state.bankWeek,
    exposure: round2(saboteurExposure()), notices, beats,
  };
}

/**
 * What the audience decides it was worth.
 *
 * BB26's rule rather than BB12's: America watched the week and picked the
 * figure. Banking the full amount for turning up is the version where the money
 * is a counter rather than a verdict — this one can pay nothing.
 */
export function audiencePayout(state) {
  const done = state.missions.filter(m => m.accepted && m.worked).length;
  const applause = state.applause;
  if (!done) return 0;
  if (applause >= 3.2) return state.prize;
  if (applause >= 2.0) return Math.round(state.prize * 0.4);
  if (applause >= 1.0) return Math.round(state.prize * 0.2);
  return 0;
}


/**
 * The bank date, and the reveal that comes with it.
 *
 * Called at the top of a week. Once they have survived to it the money is
 * theirs and the house is told who has been doing this to them — which is the
 * loudest thing that happens all season, and leaves an ordinary houseguest with
 * a target on their back who can still win.
 */
export function checkSaboteurBank(week) {
  const state = saboteurState();
  if (!state || state.survived || state.caught) return null;
  const weekNum = Number(week?.num) || (gs.bb?.weeks?.length || 0) + 1;
  if (weekNum < state.bankWeek) return null;
  const house = (week?.houseAtStart || gs.activePlayers || []).filter(Boolean);
  if (!house.includes(state.player)) return null;

  state.survived = true;
  state.revealed = true;
  const sab = state.player;
  const p = P(sab);
  // The audience decides the figure, having watched the whole thing. A season
  // of technically-successful, deeply boring sabotage is worth nothing, which
  // is BB26's rule and the only one that makes the money mean anything.
  const verdict = audiencePayout(state);
  const earned = state.banked;
  state.banked = verdict;
  // And the real currency: five weeks of being the most watchable person in
  // that house, whoever they turn out to be.
  if (state.applause > 0) {
    gs.popularity ||= {};
    gs.popularity[sab] = round2((gs.popularity[sab] || 0) + state.applause * 2.2);
  }
  const beats = [{
    text: `The wall tells the house that the saboteur has done the job and been paid for it, `
      + `and then it tells them the name. ${sab} does not get to look surprised.`,
    players: [sab], badgeText: 'IT WAS THEM', badgeClass: 'red',
  }, {
    text: verdict >= state.prize
      ? `The audience was asked what it was worth and gave ${p.obj} all of it: $${verdict.toLocaleString()}, `
        + `for ${state.missions.filter(m => m.worked).length} jobs nobody could pin on ${p.obj}. `
      : verdict > 0
        ? `The audience was asked what it was worth and settled on $${verdict.toLocaleString()} — `
          + `less than the ${earned ? `$${earned.toLocaleString()} ` : ''}on the card, because half of it was `
          + `technically sabotage and none of it was much fun. `
        : `The audience was asked what it was worth and gave ${p.obj} nothing. `
          + `Every job was completed. Not one of them was worth watching. `
      + `From here ${p.sub} ${p.sub === 'they' ? 'are' : 'is'} an ordinary houseguest, in a house that now knows.`,
    players: [sab], badgeText: 'BANKED', badgeClass: 'gold',
  }];

  // Everybody who wore the blame gets it back, and everybody who was right gets
  // to have been right — both of which move real bonds.
  const wronglyBlamed = new Set();
  for (const [name, byWho] of Object.entries(state.suspicion)) {
    if (name === sab) continue;
    for (const observer of Object.keys(byWho)) {
      wronglyBlamed.add(`${observer}|${name}`);
    }
  }
  for (const pair of wronglyBlamed) {
    const [observer, name] = pair.split('|');
    try { addBond(observer, name, 1.8); } catch { /* nothing to repair */ }
  }
  for (const n of house.filter(x => x !== sab)) {
    try { addBond(n, sab, -1.6); } catch { /* they can hate him without a number */ }
    try {
      rememberStrategy(n, sab, 'was-the-saboteur', weekNum, 2,
        { format: 'big-brother', twist: 'bb-saboteur' });
    } catch { /* the reveal stands without the memory */ }
  }
  if (wronglyBlamed.size) {
    beats.push({
      text: `Three separate people spend the next hour apologising to somebody they had convicted `
        + `of it weeks ago, which is the part ${sab} enjoys least.`,
      players: [sab], badgeText: 'THE WRONG DOORS OPEN', badgeClass: 'blue',
    });
  }

  return {
    type: 'saboteur-reveal', week: weekNum, saboteur: sab,
    banked: verdict, earned, applause: state.applause,
    missions: state.missions.filter(m => m.worked).length,
    wronglyBlamed: [...wronglyBlamed].map(x => x.split('|')[1]),
    beats,
  };
}

/**
 * The twist's other ending: they were evicted before the bank date.
 *
 * The money is gone, and the house finds out at the door what it had.
 */
export function saboteurEvicted(name, week) {
  const state = saboteurState();
  if (!state || state.player !== name || state.survived || state.caught) return null;
  state.caught = true;
  state.revealed = true;
  const lost = state.banked;
  state.banked = 0;
  const p = P(name);
  return {
    type: 'saboteur-reveal', week: Number(week?.num) || 0, saboteur: name,
    banked: 0, lost, evicted: true,
    missions: state.missions.filter(m => m.accepted).length,
    beats: [{
      text: `${name} is out of the door before the wall tells the house what ${p.sub} `
        + `${p.sub === 'they' ? 'were' : 'was'} — and that the money ${p.sub} spent six weeks earning `
        + `walked out with ${p.obj}, unpaid.`,
      players: [name], badgeText: 'THE SABOTEUR IS GONE', badgeClass: 'red',
    }, {
      text: `$${lost.toLocaleString()}, banked and lost in the same sentence. `
        + `Every argument this house has had about who was doing it turns out to have been about ${name}.`,
      players: [name], badgeText: 'NOTHING BANKED', badgeClass: 'grey',
    }],
  };
}
