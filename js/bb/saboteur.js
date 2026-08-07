// ══════════════════════════════════════════════════════════════════════
// bb/saboteur.js — the first season-long twist
// ══════════════════════════════════════════════════════════════════════
//
// Every other twist in this house is scheduled: it arrives on a week, changes
// that week's rules, and leaves. The Saboteur is installed on night one and
// never leaves — it is a second game running underneath the first one, played
// by exactly one person, for money the game itself does not award.
//
// The shape, from BB12:
//
//   The house is told, on the wall, that one of them is being paid to wreck
//   this season. It is never told who. One houseguest is told, in the Diary
//   Room, that it is them. Each week they are offered a mission; completing it
//   banks money and risks being seen. Survive to the bank date and the money is
//   theirs — and the house is told, at that point, exactly who has been doing
//   this to them for six weeks. From there they are an ordinary houseguest with
//   a target on their back, who can still win the game.
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
export function installBBSaboteur(house = [], { bankWeek = 5, rng = Math.random } = {}) {
  const cast = house.filter(Boolean);
  if (cast.length < 6) return null;

  // Weighted rather than ranked: the same cast should not always produce the
  // same saboteur, and the second-best candidate taking the job is frequently
  // the better season.
  const weights = cast.map(n => ({ name: n, w: Math.max(0.4, castingScore(n)) }));
  const total = weights.reduce((s, x) => s + x.w, 0);
  let roll = rng() * total;
  let picked = weights[0].name;
  for (const entry of weights) { roll -= entry.w; if (roll <= 0) { picked = entry.name; break; } }

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
  };
  return gs.bb.saboteur;
}

// ── the missions ────────────────────────────────────────────────────────
//
// Each one states what the week must contain before it can be offered, what it
// costs the house, and how loud it is. `noise` is the whole risk model: a
// mission that touches one person in a storage room is nearly invisible, and
// one that empties the fridge is noticed by everybody who opens it.

const MISSIONS = [
  {
    id: 'plant',
    name: 'Plant a name',
    brief: 'Make somebody believe a lie about somebody else, and let the house do the rest.',
    pay: 5000,
    noise: 0.28,
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
      };
    },
  },
  {
    id: 'comfort',
    name: 'Wreck the week',
    brief: 'The food, the hot water, the one room anybody actually wants to be in.',
    pay: 4000,
    noise: 0.62,
    can: ctx => ctx.others.length >= 3,
    run(ctx, rng) {
      const target = ctx.hoh && ctx.hoh !== ctx.sab ? ctx.hoh : ctx.others[0];
      const flavour = [
        `${ctx.sab} empties most of a week's food into a bin bag at four in the morning and puts the bag outside.`,
        `The hot water goes off. It goes off because ${ctx.sab} turned it off, and it stays off for two days.`,
        `Every alarm in the house goes at twenty-minute intervals through the night. ${ctx.sab} sleeps through it beautifully.`,
        `${ctx.sab} takes the batteries out of every microphone pack ${P(ctx.sab).sub} can reach and buries them in the garden.`,
      ];
      for (const n of ctx.others) { try { addBond(n, target, -0.4); } catch { /* nobody to blame yet */ } }
      return {
        touched: [...ctx.others],
        text: flavour[Math.floor(rng() * flavour.length)],
        houseText: `The house spends the morning working out who did it. ${target} gets most of the looks, `
          + `for no better reason than having the room with the door that locks.`,
      };
    },
  },
  {
    id: 'rattle',
    name: 'Break a campaign',
    brief: "Take the legs out of whoever is campaigning to stay, on the day they need them.",
    pay: 6000,
    noise: 0.4,
    can: ctx => ctx.nominees.filter(n => n !== ctx.sab).length >= 1,
    run(ctx, rng) {
      const target = ctx.nominees.filter(n => n !== ctx.sab)
        .sort((a, b) => (ctx.reads[b] ?? 0) - (ctx.reads[a] ?? 0))[0];
      if (!target) return null;
      const p = P(target);
      // Their campaign is a series of conversations. The saboteur makes sure
      // the wrong version of each one arrives first.
      for (const n of ctx.others.filter(x => x !== target)) {
        try { addBond(n, target, -0.8); } catch { /* nothing to lose */ }
      }
      return {
        target, touched: [target],
        text: `${target} spends the day campaigning. ${ctx.sab} spends it arriving in each room `
          + `about ninety seconds beforehand, and by the time ${p.sub} ${p.sub === 'they' ? 'get' : 'gets'} there `
          + `the answer has already been decided in the doorway.`,
        houseText: `${target} cannot work out why every conversation feels like it has already finished.`,
      };
    },
  },
  {
    id: 'burn',
    name: 'Burn a secret',
    brief: 'Somebody in this house is holding something. Tell everybody.',
    pay: 7000,
    noise: 0.55,
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
      };
    },
  },
  {
    id: 'throw',
    name: 'Lose on purpose',
    brief: 'A competition they were in the middle of, dropped where nobody could prove it.',
    pay: 5000,
    noise: 0.34,
    can: ctx => ctx.competed && !ctx.wonSomething,
    run(ctx) {
      return {
        touched: [ctx.sab],
        text: `${ctx.sab} is not out of that competition because ${P(ctx.sab).sub} could not do it. `
          + `${P(ctx.sab).Sub} stopped, at a point where stopping looks exactly like failing.`,
        houseText: `Nobody thinks anything of it. That is the point of it.`,
      };
    },
  },
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
 * One week of the second game.
 *
 * Called once per week, after the veto has settled and before the vote — the
 * point where the week's shape is known and nothing has been decided by it yet.
 * Returns the act, or null when the twist is not running.
 */
export function runSaboteurWeek(week, { rng = Math.random } = {}) {
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
  const ctx = {
    sab, week: weekNum, house, others,
    hoh: week?.hoh || null,
    nominees: (week?.finalNominees || week?.nominees || []).filter(Boolean),
    competed: !!(week?.vetoPlayers || []).includes(sab) || week?.hoh === sab
      || (week?.veto?.participants || []).includes(sab),
    wonSomething: week?.hoh === sab || week?.vetoWinner === sab,
    secretHolders: (gs.bb?.powers || []).filter(pw => pw && !pw.used && pw.holder && pw.holder !== sab)
      .map(pw => pw.holder),
    // How the saboteur reads the room, for choosing a victim worth the money.
    reads: Object.fromEntries(others.map(n => [n, getBond(sab, n)])),
  };

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

  // ── do they take it? ──
  //
  // Nerve against exposure. Somebody the house has already started watching
  // turns down work that somebody invisible would take without thinking.
  const exposure = saboteurExposure();
  const nerve = (stat(sab, 'boldness') * 0.55 + stat(sab, 'strategic') * 0.45) / 10;
  const appetite = clamp(0.34 + nerve * 0.55 - exposure * 0.75 - mission.noise * 0.25, 0.05, 0.95);
  const accepted = rng() < appetite;

  // Lines do not repeat across a season. A saboteur who turns down three
  // missions was printing the same sentence three times, and the one place a
  // reader is watching for a tell is exactly the place that cannot be boilerplate.
  const fresh = (pool, key) => {
    state.said ||= {};
    const used = state.said[key] || [];
    const open = pool.map((_, i) => i).filter(i => !used.includes(i));
    const at = (open.length ? open : pool.map((_, i) => i))[
      Math.floor(rng() * (open.length || pool.length))];
    state.said[key] = [...(open.length ? used : []), at];
    return pool[at];
  };

  const beats = [];
  if (!accepted) {
    const line = fresh(REFUSALS, 'refuse');
    beats.push({ text: line(sab, p), players: [sab], badgeText: 'PASSES', badgeClass: 'grey' });
    state.missions.push({ week: weekNum, mission: mission.id, accepted: false, paid: 0 });
    return {
      type: 'saboteur', secret: true, week: weekNum, saboteur: sab,
      mission: { id: mission.id, name: mission.name, brief: mission.brief, pay: mission.pay },
      accepted: false, banked: state.banked, prize: state.prize,
      bankWeek: state.bankWeek, exposure: round2(exposure), notices: [], beats,
    };
  }

  let result = null;
  try { result = mission.run(ctx, rng); } catch { result = null; }
  if (!result) return null;

  state.banked += mission.pay;
  const notices = traceMission({ sab, mission, result, house, week: weekNum, rng });
  const caughtBy = notices.filter(n => n.correct);
  const framed = notices.filter(n => !n.correct);

  beats.push({ text: fresh(ACCEPTS, 'accept')(sab, p),
    players: [sab], badgeText: 'TAKES THE JOB', badgeClass: 'red' });
  beats.push({ text: result.text, players: result.touched || [sab],
    badgeText: mission.name.toUpperCase(), badgeClass: 'red' });
  if (result.houseText) {
    beats.push({ text: result.houseText, players: result.touched || [],
      badgeText: 'THE HOUSE', badgeClass: 'grey' });
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
  for (const n of caughtBy.slice(0, 2)) {
    beats.push({
      text: `${n.observer} watches ${sab} through the whole of it and says nothing. `
        + `Whatever ${P(n.observer).sub} ${P(n.observer).sub === 'they' ? 'have' : 'has'} worked out, `
        + `${P(n.observer).sub} ${P(n.observer).sub === 'they' ? 'are' : 'is'} keeping it.`,
      players: [n.observer, sab], badgeText: 'SOMEBODY SAW', badgeClass: 'gold',
    });
  }

  state.missions.push({ week: weekNum, mission: mission.id, accepted: true, paid: mission.pay,
    caught: caughtBy.length, framed: framed.map(n => n.named) });

  return {
    type: 'saboteur', secret: true, week: weekNum, saboteur: sab,
    mission: { id: mission.id, name: mission.name, brief: mission.brief, pay: mission.pay },
    accepted: true, result, banked: state.banked, prize: state.prize,
    bankWeek: state.bankWeek, exposure: round2(saboteurExposure()),
    notices, beats,
  };
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
  const beats = [{
    text: `The wall tells the house that the saboteur has done the job and been paid for it, `
      + `and then it tells them the name. ${sab} does not get to look surprised.`,
    players: [sab], badgeText: 'IT WAS THEM', badgeClass: 'red',
  }, {
    text: `$${state.banked.toLocaleString()} of somebody else's money, for ${
      state.missions.filter(m => m.accepted).length} job${
      state.missions.filter(m => m.accepted).length === 1 ? '' : 's'} nobody could pin on ${p.obj}. `
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
    banked: state.banked, missions: state.missions.filter(m => m.accepted).length,
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
