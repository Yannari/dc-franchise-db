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
import nPrev from './n-prev.js';
import nLong2 from './n-long2.js';
import nLong3 from './n-long3.js';
import nChm from './n-chm.js';
import nBlame from './n-blame.js';
import nRecall from './n-recall.js';
import nChm2 from './n-chm2.js';
import nReveal from './n-reveal.js';
import nBooth2 from './n-booth2.js';
import nCrash from './n-crash.js';
import nExit2 from './n-exit2.js';
import nThr2 from './n-thr2.js';
import nLong4 from './n-long4.js';
import nCover from './n-cover.js';
import nRel from './n-rel.js';
import nVp4 from './n-vp4.js';
import nLong5 from './n-long5.js';
import nLong6 from './n-long6.js';
import nTeach from './n-teach.js';
import nHandoff from './n-handoff.js';
import nFinal from './n-final.js';
import nDeep from './n-deep.js';
import nNote from './n-note.js';
import nFinds from './n-finds.js';
import nSolo2 from './n-solo2.js';
import nChm3 from './n-chm3.js';
import nAlliance4 from './n-alliance4.js';
import nReturnee from './n-returnee.js';
import nVpSpecific from './n-vp-specific.js';
import nMentor from './n-mentor.js';
import VOICES from './voices/index.js';

const FILES = [firstday, nMorning, nChal, nTribal, nAlliance, nVote, nVote2, nVote3, nDrama, nRomance, nTalk, nCamp, nGroup, nGroup2, nArrival, nGroup3, nGroup4, nGroup5, nArrival2, nTwist, nTribal2, nTwist2, nVote4, nVote5, nRoom, nAuction, nExile, nFeast, nPlan, nPlan2, nFirstImp, nAucFloor, nFirstImp2, nPublic, nTqa, nAdvPlay, nTqa2, nArc, nVp2, nVt2, nTqa3, nMorning3, nVp3, nVt3, nPsy, nRun, nThr, nPrev, nLong2, nLong3, nChm, nBlame, nRecall, nChm2, nReveal, nBooth2, nCrash, nExit2, nThr2, nLong4, nCover, nRel, nVp4, nLong5, nLong6, nTeach, nHandoff, nFinal, nDeep, nNote, nFinds, nSolo2, nChm3, nAlliance4, nReturnee, nVpSpecific, nMentor];

export const STORY_POOLS = {};
for (const f of FILES) for (const [k, v] of Object.entries(f)) STORY_POOLS[k] = STORY_POOLS[k] ? [...STORY_POOLS[k], ...v] : [...v];

// The voice overlay (lines/voices/*.js): extra variants for existing lines, by entry id and turn index,
// for the voice tags the pools had written least for (the user, 2026-10-09: 'we need another big
// overhaul to add those variations'). A line's own variants win over the overlay's.
for (const pool of Object.values(STORY_POOLS)) for (const e of pool) {
  const ov = VOICES[e.id];
  if (!ov) continue;
  for (const [i, extra] of Object.entries(ov)) { const t = e.turns?.[+i]; if (t && (t.say || t.conf)) t.v = { ...extra, ...(t.v || {}) }; }
}

// A first-timer's scene: the speaker is new to all of it ("why'd you sign up", "I don't know anybody
// here", "I wanted to find out if I could"). A returnee who came second last time saying it reads as
// a stranger to their own season (read 2026-10-09: Minnie Skurr, runner-up, "I've given up halfway on
// so many things"). Each entry names the parts that must be new: 'a', 'b' or both (write.js sets
// `returnee`/`returneeB` from the cast). Found by scanning every pool for the phrases; re-run that
// scan (the regex is in the commit that added this) when a pool is added.
const FIRST_TIMER = {
  'fd.k1': ['a'], 'fp.c1': ['a', 'b'], 'fp.c3': ['a'], 'na.p4': ['a'], 'ny.b2': ['a', 'b'],
  'nl6.x1': ['a'], 'np.hu2': ['a'], 'nx.h15': ['a'], 'np.na1': ['a'], 'np.ce1': ['a'],
};
for (const pool of Object.values(STORY_POOLS)) for (const e of pool) {
  const parts = FIRST_TIMER[e.id];
  if (!parts) continue;
  e.when = { ...(e.when || {}), ...(parts.includes('a') ? { returnee: false } : {}), ...(parts.includes('b') ? { returneeB: false } : {}) };
}

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
