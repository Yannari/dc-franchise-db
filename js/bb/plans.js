// ══════════════════════════════════════════════════════════════════════
// plans.js — what each houseguest is actually trying to do.
//
// Total Drama has carried a real planning layer for a long time: a shield you
// keep because they draw fire, a goat you want beside you at the end, targets,
// a core, the conditions under which you would betray your own alliance. The
// house was handed the same object with every field left empty and only
// `targets` ever written, so a mastermind on strategic 9 planned identically to
// a floater on strategic 2 — which is to say, not at all.
//
// This forms and revises the real thing. It is deliberately NOT a copy of
// formIntentions(): that one branches on gs.isMerged, and a house does not
// merge. The axis here is how far into the season the house has got, which in
// Big Brother is a function of how many people are left.
//
// Everything written here is meant to be read back out — by nominations, by
// the veto, by the vote, by the final cut, and by the screen. A plan nobody
// consults is decoration, and we have been caught by that before.
// ══════════════════════════════════════════════════════════════════════
import { gs, players } from '../core.js';
import { getBond } from '../bonds.js';
import { getRelationshipDimensions } from '../relationships.js';
import { evaluateEndgameBeatability } from '../intentions.js';
import { bbThreatProfile, bbHeat, knownPowersOf } from './shared-strategy.js';

const clamp01 = n => Math.max(0, Math.min(1, n));

function store() {
  if (!gs.intentions || typeof gs.intentions !== 'object') gs.intentions = {};
  return gs.intentions;
}

const statsOf = name => players.find(p => p.name === name)?.stats || {};
const recordOf = name => gs.bb?.stats?.[name] || {};
const houseNow = () => (gs.activePlayers || players.map(p => p.name)).filter(Boolean);

const trustOf = (a, b) => (getRelationshipDimensions(a, b).trust || 0) * 0.6 + getBond(a, b) * 0.4;
const respectOf = (a, b) => getRelationshipDimensions(a, b).strategicRespect || 0;
const resentOf = (a, b) => getRelationshipDimensions(a, b).resentment || 0;

/**
 * How well this person plans, at all.
 *
 * The same weighting Total Drama uses, because it is the same question. It
 * decides how much of a plan somebody even has: a reactive player carries a
 * target and little else, an architect carries the whole structure.
 */
export function planSkill(name) {
  const s = statsOf(name);
  return (s.strategic || 5) * 0.65 + (s.intuition || 5) * 0.2 + (s.social || 5) * 0.15;
}

const planStyleFor = skill => (skill >= 7.5 ? 'endgame-architect' : skill >= 5 ? 'structured' : 'reactive');

/**
 * How dangerous somebody looks from across the kitchen.
 *
 * Big Brother reads threat differently from Total Drama. A camp reads raw
 * physicality; a house reads the wall — who keeps winning, and who keeps
 * surviving the block. Competition record is the loudest signal in the room
 * because it is the one thing everybody has watched happen.
 */
export function houseThreat(name) {
  // The same observed model the nominations use, rather than a second opinion
  // built from the stat sheet.
  //
  // This was the real leak. bbThreatProfile was taught to weigh what the house
  // has actually WATCHED, but plans kept their own reading straight off
  // strategic/social/physical — and plans set targets, and targets pull hard on
  // nominations. So a houseguest with strategic 10 still sat on top of every
  // early target list; the knowledge had simply moved one layer back.
  try { return bbThreatProfile(name).total; } catch { /* fall through */ }
  const s = statsOf(name);
  const rec = recordOf(name);
  return (s.strategic || 5) * 0.34 + (s.social || 5) * 0.26
    + Math.max(s.physical || 5, s.endurance || 5) * 0.16 + (s.boldness || 5) * 0.08
    + (rec.hohWins || 0) * 1.15 + (rec.vetoWins || 0) * 0.85 + (rec.blockBusterWins || 0) * 0.9;
}

/**
 * How far along the season is, in the only unit a house measures it in.
 *
 * Plans do not mean the same thing in week two and week nine. Early on nobody
 * can see the end, so a plan is a core and a name. Once the jury is seated the
 * end is a real place people are steering toward, and once it is down to five
 * every conversation is about who is sitting next to whom.
 */
export function houseStage(size = houseNow().length) {
  if (size <= 5) return 'endgame';
  if (size <= 9) return 'jury';
  return 'early';
}

const emptyOrigins = () => ({ preferredCore: {}, backupAllies: {}, targets: {}, revenge: {}, finalThree: {}, goat: {}, shield: {} });

function liveDeals(name) {
  return (gs.sideDeals || []).filter(d => d.active !== false && d.genuine !== false && (d.players || []).includes(name));
}

function dealPartners(name, pool) {
  return [...new Set(liveDeals(name).flatMap(d => d.players || []).filter(n => n !== name && pool.includes(n)))];
}

/**
 * The person you keep in the house precisely because they are bigger than you.
 *
 * The most Big Brother idea there is, and the one the old stub never had a
 * field for that anybody filled. A shield has to be a genuinely LARGER threat
 * than the planner — keeping somebody smaller around is not a shield, it is a
 * goat, and they are opposite jobs. It also has to be somebody you can stand to
 * work with; you cannot hide behind a person who wants you gone.
 */
function readShield(name, pool, skill) {
  if (skill < 5.5) return null;
  // Ranked on EARNED standing rather than raw threat.
  //
  // Once threat started counting isolation and suspicion — which is right for
  // deciding who is easy to nominate — the biggest number in the room began
  // belonging to whoever the house had turned on. Plans then picked that person
  // as a shield, which is exactly backwards: they go first, and the houseguest
  // hiding behind them is standing in the open the following week.
  const standingOf = n => { try { return bbThreatProfile(n).standing; } catch { return houseThreat(n); } };
  const mine = standingOf(name);

  // You cannot hide behind the person you would nominate first.
  //
  // The same contradiction as holding somebody as shield and target at once,
  // one step earlier: if this houseguest is already the top of your own heat
  // list, calling them a shield does not stop you putting them up — it just
  // means your plan disagrees with itself, and the plan loses. Excluded at
  // selection so the shield is somebody you would actually protect.
  const heatOf = n => { try { return bbHeat(name, n).total; } catch { return 0; } };
  const hottest = pool.slice().sort((a, b) => heatOf(b) - heatOf(a))[0] || null;

  const options = pool
    .filter(n => n !== hottest
      && standingOf(n) > mine + 0.6 && trustOf(name, n) > -2 && resentOf(name, n) < 4)
    .sort((a, b) => standingOf(b) - standingOf(a));
  const pick = options[0];
  if (!pick) return null;
  const rec = recordOf(pick);
  const comps = (rec.hohWins || 0) + (rec.vetoWins || 0);
  const why = comps > 0
    ? `${comps} competition win${comps === 1 ? '' : 's'} — the house is aiming at them, not at us`
    : 'reads as a bigger threat than we do and draws the room\'s attention';
  return { name: pick, why };
}

/**
 * Who they think they beat at the end.
 *
 * The read itself is Total Drama's — it runs on an FTC résumé, and a résumé is
 * a résumé in either show. Big Brother's own competition record is mirrored
 * into the shared record first so a comp beast correctly reads as a terrible
 * person to sit beside.
 */
function mirrorCompRecord() {
  gs.chalRecord ||= {};
  for (const [name, rec] of Object.entries(gs.bb?.stats || {})) {
    const wins = (rec.hohWins || 0) + (rec.vetoWins || 0);
    gs.chalRecord[name] = { ...(gs.chalRecord[name] || {}), wins, individualWins: wins };
  }
}

function readGoat(name, pool, skill, stage) {
  // Wondering who you would rather sit beside is not an elite skill in this
  // house — it is what everybody talks about from the moment the jury starts.
  // The gate was set at 5.5, which is roughly the median planner, so half the
  // cast was structurally incapable of having an endgame read at all.
  if (stage === 'early' || skill < 4.5) return null;
  mirrorCompRecord();
  // Deliberately NOT filtered on `usable`.
  //
  // Total Drama requires a goat you can actually drag to the end — you need
  // them to keep choosing you, so a hostile one is no use. Big Brother does not
  // work that way. The final Head of Household picks, alone, and the person
  // they pick has no say in it whatsoever, so somebody who cannot stand you is
  // every bit as takeable as somebody who adores you. Requiring a warm
  // relationship was importing the wrong show's constraint, and it left most of
  // the house with no endgame read at all by the time it mattered most.
  const reads = pool
    .map(n => { try { return evaluateEndgameBeatability(name, n); } catch { return null; } })
    .filter(r => r && r.confidence >= 0.26)
    .sort((a, b) => b.beatability - a.beatability || b.confidence - a.confidence);
  const best = reads[0];
  // Beatability is a RELATIVE scale: evaluateEndgameBeatability centres it on 5,
  // where 5 means the two résumés are even. Demanding 5.5+ was demanding a
  // clear win, which almost nobody has against the people who made it this far,
  // so measured seasons reached the final six with no goat reads at all. What a
  // goat actually is, is the person you think you have the better case against.
  if (!best || best.beatability < 5.15) return null;
  return {
    name: best.candidate,
    assessment: best,
    why: `${best.beatability.toFixed(1)}/10 read at ${Math.round(best.confidence * 100)}% confidence: `
      + best.reasons.slice(0, 2).join('; '),
  };
}

// ── formation ────────────────────────────────────────────────────────

/**
 * Build somebody a plan from where they are standing right now.
 *
 * Called once per houseguest, the first week they need one. After that the
 * plan persists and is revised — nobody rebuilds their whole game from nothing
 * every Thursday, and a plan that resets weekly is indistinguishable from no
 * plan at all.
 */
export function formHousePlan(name, { house = houseNow(), week = null } = {}) {
  const pool = house.filter(n => n && n !== name);
  if (!pool.length) return null;

  const round = Number(week?.num || (gs.episode || 0) + 1);
  const skill = planSkill(name);
  const style = planStyleFor(skill);
  const stage = houseStage(house.length);

  const byTrust = [...pool].sort((a, b) => trustOf(name, b) - trustOf(name, a));
  const byThreat = [...pool].sort((a, b) => houseThreat(b) - houseThreat(a));

  // A deal is a promise somebody actually made. A preference is not.
  const partners = dealPartners(name, pool);
  const coreSize = stage === 'early' ? 1 : skill >= 6 ? 2 : 1;
  const preferredCore = byTrust.filter(n => trustOf(name, n) > 0 && !partners.includes(n)).slice(0, coreSize);
  const finalThree = [name, ...partners.slice(0, 2)];

  const shield = readShield(name, pool, skill);
  const goat = readGoat(name, pool, skill, stage);

  // The people you would like gone: dangerous, and not on your side. A shield
  // is explicitly exempt — the whole point of one is that you are not aiming
  // at them even though they are the biggest thing in the room.
  const targetCount = stage === 'early' ? 1 : skill >= 7 ? 2 : 1;
  const targets = byThreat
    .filter(n => trustOf(name, n) <= 0.5 && n !== shield?.name && n !== goat?.name)
    .slice(0, targetCount);

  const revenge = pool.filter(n => resentOf(name, n) >= 3);
  const backupAllies = byTrust
    .filter(n => !preferredCore.includes(n) && !partners.includes(n) && !targets.includes(n))
    .slice(0, skill >= 7 ? 3 : 2);

  // Who you are counting on to vote for you, once there is a jury to count.
  const juryPlan = stage === 'early' || skill < 6 ? []
    : byTrust.filter(n => trustOf(name, n) > 1).slice(0, 3);

  // The conditions under which you would turn on your own. An architect knows
  // them in advance; a reactive player finds out in the moment.
  const betrayalConditions = skill < 6 ? [] : finalThree.slice(1)
    .filter(n => respectOf(name, n) >= 2 && trustOf(name, n) < 3)
    .map(ally => ({ ally, condition: 'if the numbers turn or they move on me first' }));

  const origins = emptyOrigins();
  preferredCore.forEach(n => { origins.preferredCore[n] = 'closest thing to trust they have in this house'; });
  backupAllies.forEach(n => { origins.backupAllies[n] = 'fallback if the core does not hold'; });
  targets.forEach(n => { origins.targets[n] = 'dangerous, and not on their side'; });
  // ── and the specific reason, when there is one everybody can see ──
  //
  // A publicly held power already moves the threat model, so a holder is more
  // likely to be a target than they were. The REASON was still the generic one,
  // which meant a houseguest went up for holding a Coup d'Etat and the plan
  // recorded it as "dangerous, and not on their side" — the right nomination
  // with the wrong story attached to it, and the story is what the transcripts
  // and the screens read back.
  //
  // Secret powers deliberately do not appear here. The house cannot cite a
  // reason it was never given.
  const planWeek = (gs.episode || 0) + 1;
  targets.forEach(n => {
    const held = knownPowersOf(n, planWeek);
    if (!held.length) return;
    const first = held[0];
    origins.targets[n] = held.length > 1
      ? `holding ${held.length} powers this house has been told about`
      : first.weeksLeft > 0
        ? `holding ${first.name}, and it does not expire for ${first.weeksLeft === 1
          ? 'another week' : `${first.weeksLeft} more weeks`}`
        : `holding ${first.name}, and this is the last week it can go off`;
  });
  revenge.forEach(n => { origins.revenge[n] = 'resentment crossed the line into a grudge'; });
  partners.slice(0, 2).forEach(n => { origins.finalThree[n] = 'confirmed by a deal they actually shook on'; });
  if (shield) origins.shield[shield.name] = shield.why;
  if (goat) origins.goat[goat.name] = goat.why;

  const plan = {
    owner: name, stage, planStyle: style, format: 'big-brother',
    confidence: Math.max(0.2, Math.min(0.95, skill / 10)),
    finalThree, preferredCore, backupAllies, targets, revenge, juryPlan,
    shield: shield?.name || null,
    goat: goat?.name || null,
    goatAssessment: goat?.assessment || null,
    advantagePlan: null, betrayalConditions, revengeSince: {},
    formedEp: round, lastRevisedEp: round, lastTickEp: null,
    origins, history: [],
  };
  revenge.forEach(n => { plan.revengeSince[n] = round; });
  store()[name] = plan;
  return plan;
}

export function housePlan(name) { return store()[name] || null; }

export function ensureHousePlan(name, context = {}) {
  return store()[name] || formHousePlan(name, context);
}

// ── revision ─────────────────────────────────────────────────────────

function logChange(plan, round, field, from, to, reason) {
  plan.history.push({ ep: round, field, from, to, reason });
  if (plan.history.length > 24) plan.history.splice(0, plan.history.length - 24);
  plan.lastRevisedEp = round;
  return { field, from, to, reason, owner: plan.owner };
}

const nameOf = v => (Array.isArray(v) ? v.join(', ') || 'nobody' : v || 'nobody');

/**
 * Nobody is both the wall you hide behind and the person you are coming for.
 *
 * Formation keeps these apart, but revision did not: the trigger that falls in
 * behind a new Head of Household's target, and the one that turns on a veto
 * winner, both push a name onto `targets` without checking it is not the
 * shield. A plan holding somebody as both cancels itself out — the +3.4 for a
 * top target very nearly wipes the -7 for a shield — and the houseguest ends up
 * nominating the person their whole game depends on keeping.
 *
 * Deciding to come for somebody is the stronger statement, so the target wins
 * and the shield is dropped.
 */
function _resolveShieldTargetClash(plan, changes, round) {
  if (!plan.shield) return;
  if (!(plan.targets || []).includes(plan.shield)) return;
  const was = plan.shield;
  plan.shield = null;
  if (changes) {
    changes.push(logChange(plan, round, 'shield', was, null,
      `stopped hiding behind ${was} — you cannot shelter behind somebody you are coming for`));
  }
}

/**
 * Push everybody's plan through what just happened.
 *
 * The triggers are the four moments in a week that actually change what people
 * want: somebody takes power, the nominations land, the veto moves them, and
 * somebody leaves. Every change returns a record with a reason, because the
 * user has to be able to find out why a plan moved without reading the code.
 */
export function reviseHousePlans({ house = houseNow(), week = null, trigger = 'week',
  hoh = null, nominees = [], vetoWinner = null, saved = null, evicted = null } = {}) {
  const round = Number(week?.num || (gs.episode || 0) + 1);
  const changes = [];

  for (const name of house) {
    const plan = ensureHousePlan(name, { house, week });
    if (!plan) continue;
    const pool = house.filter(n => n !== name);
    if (!pool.length) continue;

    // Anybody who has left stops being part of anybody's plan.
    for (const field of ['finalThree', 'preferredCore', 'backupAllies', 'targets', 'revenge', 'juryPlan']) {
      const before = plan[field] || [];
      const after = before.filter(n => n === name || house.includes(n));
      if (after.length !== before.length) {
        plan[field] = after;
        if (evicted && before.includes(evicted)) {
          changes.push(logChange(plan, round, field, before, after,
            field === 'targets' ? `${evicted} is gone — that plan is finished`
              : `${evicted} was evicted`));
        } else plan[field] = after;
      }
    }
    if (plan.shield && !house.includes(plan.shield)) {
      changes.push(logChange(plan, round, 'shield', plan.shield, null,
        `${plan.shield} was their shield and is out of the house — they are the target now`));
      plan.shield = null;
    }
    if (plan.goat && !house.includes(plan.goat)) {
      changes.push(logChange(plan, round, 'goat', plan.goat, null, `${plan.goat} was evicted`));
      plan.goat = null; plan.goatAssessment = null;
    }
    plan.betrayalConditions = (plan.betrayalConditions || []).filter(c => house.includes(c.ally));

    const skill = planSkill(name);
    const stage = houseStage(house.length);
    if (stage !== plan.stage) {
      const from = plan.stage;
      plan.stage = stage;
      changes.push(logChange(plan, round, 'stage', from, stage, stage === 'jury'
        ? 'the jury is seated — the end is a real place now'
        : stage === 'endgame' ? 'down to the last few — it is about who they sit beside'
        : 'the house changed shape'));
    }

    // ── somebody took power ──
    //
    // The single most disruptive thing that happens in a week. The new Head of
    // Household is the only person in the house who cannot be evicted, which
    // means for seven days everybody else's plan bends around theirs.
    if (trigger === 'hoh' && hoh && hoh !== name) {
      const theirs = housePlan(hoh);
      const hohTarget = theirs?.targets?.[0];
      // If the person in power is coming for someone you were protecting, you
      // have a problem. If they are coming for someone you wanted gone anyway,
      // this is the free week you have been waiting for.
      if (hohTarget && hohTarget !== name && !plan.targets.includes(hohTarget)
        && trustOf(name, hohTarget) < 1 && skill >= 5) {
        const before = [...plan.targets];
        plan.targets = [hohTarget, ...plan.targets].slice(0, 3);
        plan.origins.targets[hohTarget] = `${hoh} has the power and wants them gone — cheapest week to agree`;
        changes.push(logChange(plan, round, 'targets', before, [...plan.targets],
          `fell in behind ${hoh}'s target rather than spend a week fighting the house`));
      }
      // Power is also the loudest possible advert for a shield.
      const better = readShield(name, pool, skill);
      if (better && better.name !== plan.shield && better.name === hoh) {
        const before = plan.shield;
        plan.shield = hoh;
        plan.origins.shield[hoh] = better.why;
        changes.push(logChange(plan, round, 'shield', before, hoh,
          `${hoh} just won power — better to stand behind them than in front`));
      }
    }

    // ── the nominations landed ──
    if (trigger === 'noms' && nominees.length) {
      if (nominees.includes(name)) {
        // Being put up is personal, whatever the person in power says about it.
        if (hoh && hoh !== name) {
          const before = [...plan.targets];
          if (!plan.targets.includes(hoh)) {
            plan.targets = [hoh, ...plan.targets].slice(0, 3);
            plan.origins.targets[hoh] = 'put them on the block';
            changes.push(logChange(plan, round, 'targets', before, [...plan.targets],
              `${hoh} nominated them — that is now the whole plan`));
          }
          if (resentOf(name, hoh) >= 3 && !plan.revenge.includes(hoh)) {
            plan.revenge.push(hoh);
            plan.revengeSince[hoh] = round;
            plan.origins.revenge[hoh] = 'sat them down and put them on the block';
          }
        }
      } else if (plan.preferredCore.some(n => nominees.includes(n)) && skill >= 5) {
        // Your people are on the block and you are not. Either the alliance is
        // not what you thought it was, or somebody outside it is running things.
        const exposed = plan.preferredCore.filter(n => nominees.includes(n));
        changes.push(logChange(plan, round, 'preferredCore', [...plan.preferredCore], [...plan.preferredCore],
          `${nameOf(exposed)} went up and they did not — the core is not protecting anybody`));
      }
    }

    // ── the veto moved somebody ──
    if (trigger === 'veto' && vetoWinner) {
      if (saved && saved !== name && plan.targets.includes(saved) && skill >= 5) {
        changes.push(logChange(plan, round, 'targets', [...plan.targets], [...plan.targets],
          `${saved} came off the block — the shot they wanted is gone for this week`));
      }
      if (vetoWinner !== name && houseThreat(vetoWinner) > houseThreat(name) + 0.6
        && skill >= 6 && !plan.targets.includes(vetoWinner) && trustOf(name, vetoWinner) <= 0) {
        const before = [...plan.targets];
        plan.targets = [vetoWinner, ...plan.targets].slice(0, 3);
        plan.origins.targets[vetoWinner] = 'keeps winning when it counts';
        changes.push(logChange(plan, round, 'targets', before, [...plan.targets],
          `${vetoWinner} pulled out the veto when they needed it — that is a problem worth solving`));
      }
    }

    // ── the room re-reads itself ──
    //
    // Shields and goats are not decided once. The shield you picked in week two
    // may have stopped winning anything, and the person you thought you beat
    // may have built a résumé while you were not looking.
    if (trigger === 'eviction' || trigger === 'week') {
      const shield = readShield(name, pool, skill);
      if (shield && shield.name !== plan.shield) {
        const before = plan.shield;
        // Only switch for a meaningfully bigger shield — plans that churn every
        // week are noise, not strategy.
        if (!before || !house.includes(before) || houseThreat(shield.name) > houseThreat(before) + 1.2) {
          plan.shield = shield.name;
          plan.origins.shield[shield.name] = shield.why;
          changes.push(logChange(plan, round, 'shield', before, shield.name, before
            ? `${shield.name} is a bigger wall to stand behind than ${before}`
            : shield.why));
        }
      }
      const goat = readGoat(name, pool, skill, stage);
      if (goat && goat.name !== plan.goat) {
        const before = plan.goat;
        const beforeRead = before && house.includes(before)
          ? (() => { try { return evaluateEndgameBeatability(name, before); } catch { return null; } })() : null;
        if (!beforeRead || goat.assessment.beatability > beforeRead.beatability + 0.8) {
          plan.goat = goat.name;
          plan.goatAssessment = goat.assessment;
          plan.origins.goat[goat.name] = goat.why;
          changes.push(logChange(plan, round, 'goat', before, goat.name, before
            ? `${goat.name} is a safer person to sit beside than ${before}`
            : goat.why));
        }
      }
      // Who they are actually close to now.
      //
      // The core was read once, in week one, when nobody in the house trusted
      // anybody yet — so it formed empty and stayed empty for the whole season.
      // Relationships are the one thing that definitely changes every week, and
      // the plan has to keep up with them.
      const byTrust = [...pool].sort((a, b) => trustOf(name, b) - trustOf(name, a));
      const partners = dealPartners(name, pool);
      const coreSize = stage === 'early' ? 1 : skill >= 6 ? 2 : 1;
      const core = byTrust.filter(n => trustOf(name, n) > 0.5 && !partners.includes(n)).slice(0, coreSize);
      const joined = core.filter(n => !plan.preferredCore.includes(n));
      const left = plan.preferredCore.filter(n => !core.includes(n));
      if (joined.length || left.length) {
        const before = [...plan.preferredCore];
        plan.preferredCore = core;
        core.forEach(n => { plan.origins.preferredCore[n] = 'closest thing to trust they have in this house'; });
        if (joined.length) {
          changes.push(logChange(plan, round, 'preferredCore', before, core,
            `${nameOf(joined)} became somebody they actually rely on`));
        } else if (left.length) {
          changes.push(logChange(plan, round, 'preferredCore', before, core,
            `whatever they had with ${nameOf(left)} has cooled off`));
        }
      }
      plan.backupAllies = byTrust
        .filter(n => !plan.preferredCore.includes(n) && !partners.includes(n) && !plan.targets.includes(n))
        .slice(0, skill >= 7 ? 3 : 2);
      // Once there is a jury, who they are counting on to vote for them.
      if (stage !== 'early' && skill >= 6) {
        plan.juryPlan = byTrust.filter(n => trustOf(name, n) > 1).slice(0, 3);
      }
      // And the terms on which they would turn on their own people.
      //
      // Gated at skill 6 with respect 2 this never once fired in a measured
      // season: by the time anybody has endgame partners the surviving planners
      // are mostly "structured" rather than architects, and strategic respect
      // that high between two people who are still working together is rare.
      // Knowing the circumstances under which you would cut your own partner is
      // not an architect's luxury in this house — it is the ordinary condition
      // of being in a final two with somebody who might beat you.
      if (skill >= 5) {
        plan.betrayalConditions = (plan.finalThree || []).slice(1)
          .filter(n => pool.includes(n))
          .map(ally => {
            if (houseThreat(ally) > houseThreat(name) + 0.8) {
              return { ally, condition: 'if it gets close to the end and they still look like the winner' };
            }
            if (trustOf(name, ally) < 1) return { ally, condition: 'the moment they give me a reason' };
            if (respectOf(name, ally) >= 2) return { ally, condition: 'if the numbers turn or they move on me first' };
            return null;
          })
          .filter(Boolean);
      }

      // New grudges.
      for (const other of pool) {
        if (resentOf(name, other) >= 3 && !plan.revenge.includes(other)) {
          plan.revenge.push(other);
          plan.revengeSince[other] = round;
          plan.origins.revenge[other] = 'resentment crossed the line into a grudge';
          changes.push(logChange(plan, round, 'revenge', null, other,
            `whatever ${other} did, they have not let it go`));
        }
      }
      // And a target, if they somehow have none.
      if (!plan.targets.length) {
        const pick = [...pool].sort((a, b) => houseThreat(b) - houseThreat(a))
          .find(n => n !== plan.shield && n !== plan.goat && trustOf(name, n) <= 1);
        if (pick) {
          plan.targets = [pick];
          plan.origins.targets[pick] = 'biggest thing left in the house they are not hiding behind';
          changes.push(logChange(plan, round, 'targets', [], [pick],
            `settled on ${pick} for want of a better idea`));
        }
      }
    }

    _resolveShieldTargetClash(plan, changes, round);

    plan.confidence = clamp01(Math.max(0.2, Math.min(0.95,
      skill / 10 + (plan.targets.length ? 0.05 : -0.1) + (plan.shield ? 0.05 : 0))));
  }

  return changes;
}

/**
 * Somebody has left. Take them out of the plans and forget theirs.
 */
export function dropFromHousePlans(name) {
  const s = store();
  delete s[name];
  for (const plan of Object.values(s)) {
    if (!plan || typeof plan !== 'object') continue;
    for (const field of ['finalThree', 'preferredCore', 'backupAllies', 'targets', 'revenge', 'juryPlan']) {
      if (Array.isArray(plan[field])) plan[field] = plan[field].filter(n => n !== name);
    }
    if (plan.shield === name) plan.shield = null;
    if (plan.goat === name) { plan.goat = null; plan.goatAssessment = null; }
    plan.betrayalConditions = (plan.betrayalConditions || []).filter(c => c.ally !== name);
  }
}

/**
 * The plan in one sentence, for the screen and the transcript.
 */
export function describeHousePlan(name) {
  const plan = housePlan(name);
  if (!plan) return '';
  const bits = [];
  if (plan.targets?.length) bits.push(`wants ${nameOf(plan.targets)} out`);
  if (plan.shield) bits.push(`hiding behind ${plan.shield}`);
  if (plan.goat) bits.push(`wants to sit beside ${plan.goat}`);
  const partners = (plan.finalThree || []).filter(n => n !== name);
  if (partners.length) bits.push(`shook on the end with ${nameOf(partners)}`);
  if (!bits.length) bits.push('playing week to week');
  return bits.join('; ');
}
