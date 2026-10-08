// ══════════════════════════════════════════════════════════════════════
// td/story/lines/index.js — every Total Drama story pool, by key
// ══════════════════════════════════════════════════════════════════════
//
// Keys are '<pool>.<outcome>' (write.js falls back to '<pool>.any'). Entry ids
// are unique across files (tests/td-story.test.js). Written against
// docs/td-dialogue-style.md.
import firstday from './firstday.js';
import nMorning from './n-morning.js';
import nChal from './n-chal.js';
import nTribal from './n-tribal.js';
import nAlliance from './n-alliance.js';
import nVote from './n-vote.js';
import nVote2 from './n-vote2.js';
import nVote3 from './n-vote3.js';
import nDrama from './n-drama.js';
import nRomance from './n-romance.js';
import nTalk from './n-talk.js';
import nCamp from './n-camp.js';
import nGroup from './n-group.js';
import nGroup2 from './n-group2.js';
import nArrival from './n-arrival.js';
import nGroup3 from './n-group3.js';
import nGroup4 from './n-group4.js';
import nGroup5 from './n-group5.js';
import nArrival2 from './n-arrival2.js';
import nTwist from './n-twist.js';
import nTribal2 from './n-tribal2.js';
import nTwist2 from './n-twist2.js';
import nVote4 from './n-vote4.js';
import nVote5 from './n-vote5.js';
import nRoom from './n-room.js';
import nAuction from './n-auction.js';
import nExile from './n-exile.js';
import nFeast from './n-feast.js';
import nPlan from './n-plan.js';
import nPlan2 from './n-plan2.js';
import nFirstImp from './n-firstimp.js';
import nAucFloor from './n-aucfloor.js';
import nFirstImp2 from './n-firstimp2.js';
import nPublic from './n-public.js';
import nTqa from './n-tqa.js';
import nAdvPlay from './n-advplay.js';
import nTqa2 from './n-tqa2.js';
import nArc from './n-arc.js';
import nVp2 from './n-vp2.js';
import nVt2 from './n-vt2.js';
import nTqa3 from './n-tqa3.js';
import nMorning3 from './n-morning3.js';
import nVp3 from './n-vp3.js';
import nVt3 from './n-vt3.js';
import nPsy from './n-psy.js';
import nRun from './n-run.js';
import nThr from './n-thr.js';

const FILES = [firstday, nMorning, nChal, nTribal, nAlliance, nVote, nVote2, nVote3, nDrama, nRomance, nTalk, nCamp, nGroup, nGroup2, nArrival, nGroup3, nGroup4, nGroup5, nArrival2, nTwist, nTribal2, nTwist2, nVote4, nVote5, nRoom, nAuction, nExile, nFeast, nPlan, nPlan2, nFirstImp, nAucFloor, nFirstImp2, nPublic, nTqa, nAdvPlay, nTqa2, nArc, nVp2, nVt2, nTqa3, nMorning3, nVp3, nVt3, nPsy, nRun, nThr];

export const STORY_POOLS = {};
for (const f of FILES) for (const [k, v] of Object.entries(f)) STORY_POOLS[k] = STORY_POOLS[k] ? [...STORY_POOLS[k], ...v] : [...v];

// A scene that has a third person in it only plays when there is one: c's lines would be
// dropped and the rest would answer nobody ("Thanks, {c}."). An entry that reads fine without
// c says so with `cOptional: true`.
for (const pool of Object.values(STORY_POOLS)) {
  for (const e of pool) {
    const usesC = (e.turns || []).some(t => !t.opt && (t.by === 'c' || /\{c(\.\w+)?\}/.test([t.say, t.conf, t.beat, ...Object.values(t.v || {})].join(' '))));
    if (usesC && !e.cOptional && e.when?.third === undefined) e.when = { ...(e.when || {}), third: true };
    // ...and a fourth person the same way
    const usesD = (e.turns || []).some(t => !t.opt && (t.by === 'd' || /\{d(\.\w+)?\}/.test([t.say, t.conf, t.beat, ...Object.values(t.v || {})].join(' '))));
    if (usesD && e.when?.fourth === undefined) e.when = { ...(e.when || {}), fourth: true };
    // ...and a fifth and sixth, unless their lines are optional (`opt: true` on the turn): a group
    // scene can give them lines when they are there and play without them when they are not
    for (const [r, f] of [['e', 'fifth'], ['f', 'sixth']]) {
      const re = new RegExp(`\\{${r}(\\.\\w+)?\\}`);
      const needs = (e.turns || []).some(t => !t.opt && (t.by === r || re.test([t.say, t.conf, t.beat, ...Object.values(t.v || {})].join(' '))));
      if (needs && e.when?.[f] === undefined) e.when = { ...(e.when || {}), [f]: true };
    }
    // ...and a second: a scene a person plays alone (a confessional, a solo decision) never
    // pulls in a b who is not there
    const usesB = (e.turns || []).some(t => t.by === 'b' || /\{b(\.\w+)?\}/.test([t.say, t.conf, t.beat, ...Object.values(t.v || {})].join(' ')));
    if (usesB && e.when?.pair === undefined) e.when = { ...(e.when || {}), pair: true };
  }
}
