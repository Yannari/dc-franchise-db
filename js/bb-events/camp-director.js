// ══════════════════════════════════════════════════════════════════════
// bb-events/camp-director.js — the week after the four names
// ══════════════════════════════════════════════════════════════════════
//
// The Camp Director act writes real grudges at fire time — each banished
// houseguest takes a bond hit against the Director, the survivors bond, the
// Director loses popularity. What it never did was come up AGAIN: the whole
// house watched one person read out four names on night one, somebody went
// home over it, and then week one's house life carried on as if it were an
// ordinary Sunday. This family is the rest of that week.
//
// Same rule as every aftermath family: THEY COULD TAKE IT WELL OR LESS WELL,
// REALLY DEPENDS. The Director defends the four names smoothly or badly; a
// survivor squashes it or keeps the receipt. Stats decide, proportionally.
//
// Week one only by construction — everything gates on `week.campDirector`,
// which only the first week ever carries.
import { pronouns } from '../players.js';
import { pStats, band, perceived, firedThisWeek } from './_read.js';

function _variant(list, ctx, ...salt) {
  const key = `${ctx?.week?.num || 0}|${ctx?.beat || 0}|${ctx?.act || ''}|${salt.join('|')}`;
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return list[hash % list.length];
}
const _others = (house, ...exclude) => house.filter(n => n && !exclude.includes(n));
const _reactable = ctx => ctx?.act === 'house' || ctx?.act === 'campaign';

const _camp = (ctx, house) => {
  const cd = ctx?.week?.campDirector;
  if (!cd?.director || !house.includes(cd.director)) return null;
  return cd;
};

// ── the Director, asked about the list ────────────────────────────────
const needled = {
  id: 'camp-director-needled',
  category: 'social',
  weight(house, ctx) {
    if (!_reactable(ctx)) return 0;
    // ONE SCENE PER WEEK. These are loud, rare-state events — the same
    // conversation happening twice in one week reads as a stuck record,
    // and a real season showed it: ASKED ABOUT THE LIST fired twice in
    // week one, same asker, same answer.
    if (firedThisWeek('camp-director-needled', Number(ctx?.week?.num) || 0)) return 0;
    return _camp(ctx, house) ? band(11, 14) : 0;
  },
  fire(house, ctx, api) {
    const cd = _camp(ctx, house);
    const director = cd.director;
    const p = pronouns(director);
    const asker = _others(house, director, ...cd.banished)
      .sort((a, b) => pStats(b).boldness - pStats(a).boldness)[0];
    if (!asker) return null;
    const st = pStats(director);
    // Social carries the defence; a low-social Director makes it worse.
    const smooth = st.social >= 5.5;
    if (smooth) {
      const text = _variant([
        `${asker} brings up the four names at dinner, casually, like a knife left on the table. ${director} picks it up and hands it back: "Somebody had to write a list. Would you rather it had been yours?" The table decides to laugh.`,
        `${director} has the answer ready by now — the job made ${p.obj} do it, the job everybody voted ${p.obj} into. It is a good answer. ${asker} notes how POLISHED it has become.`,
        `${asker} pokes at it; ${director} takes it with a grace that costs nothing and buys a lot. Half the room admires the composure. The other half remembers that composure is a skill.`,
      ], ctx, director, asker);
      api.popDelta(director, 0.5);
      api.remember(asker, director, 'answers-too-well', 1, { twist: 'camp-director' });
      return { text, players: [director, asker], badgeText: 'ASKED ABOUT THE LIST', badgeClass: 'blue' };
    }
    const text = _variant([
      `${asker} asks about the four names and ${director} over-explains — the reasons multiply, contradict, and by the third one the kitchen has stopped believing any of them.`,
      `${director} snaps that ${p.sub} did not ASK for the job, which is true and lands like a confession. ${asker} lets the silence do the rest.`,
      `${director} tries "it was basically random" on ${asker}, who was standing right there when it was not. The room files the lie next to the list.`,
    ], ctx, director, asker);
    api.popDelta(director, -1);
    api.addBond(asker, director, -0.5);
    return { text, players: [director, asker], badgeText: 'THE LIST COMES UP', badgeClass: 'red' };
  },
};

// ── a survivor, deciding what to do with it ───────────────────────────
const survivorSettles = {
  id: 'camp-director-survivor',
  category: 'social',
  weight(house, ctx) {
    if (!_reactable(ctx)) return 0;
    // ONE SCENE PER WEEK. These are loud, rare-state events — the same
    // conversation happening twice in one week reads as a stuck record,
    // and a real season showed it: ASKED ABOUT THE LIST fired twice in
    // week one, same asker, same answer.
    if (firedThisWeek('camp-director-survivor', Number(ctx?.week?.num) || 0)) return 0;
    const cd = _camp(ctx, house);
    return cd && (cd.survivors || []).some(n => house.includes(n)) ? band(11, 14) : 0;
  },
  fire(house, ctx, api) {
    const cd = _camp(ctx, house);
    const who = (cd.survivors || []).find(n => house.includes(n));
    if (!who) return null;
    const director = cd.director;
    const st = pStats(who);
    const p = pronouns(who);
    // Temperament forgives; the rest keep the receipt.
    const squashes = st.temperament >= 5.5;
    if (squashes) {
      const text = _variant([
        `${who} finds ${director} alone and squashes it in one sentence: "You did what the job made you do, and I ran fast enough. We're fine." ${director} exhales for the first time all day.`,
        `${who} makes a point of sitting next to ${director} at breakfast where everybody can see it. The message is for the room as much as for ${director}: this one is settled.`,
        `"If I'd won that vote I'd have named four people too." ${who} says it plainly, and ${director} could kiss ${p.obj}.`,
      ], ctx, who);
      api.addBond(who, director, 1.2);
      api.popDelta(who, 0.5);
      return { text, players: [who, director], badgeText: 'SETTLED IT', badgeClass: 'gold' };
    }
    const listener = _others(house, who, director)
      .sort((a, b) => perceived(who, b) - perceived(who, a))[0];
    const text = _variant([
      `${who} is perfectly pleasant to ${director} all day, and tells ${listener || 'the garden'} the truth at dusk: "${p.Sub === 'They' ? 'They don’t' : p.Sub + ' doesn’t'} get to pick me for the backyard and then get my vote. Ever."`,
      `${who} has forgiven nothing. ${p.Sub} ${p.sub === 'they' ? 'are' : 'is'} simply waiting for a week when the grudge is affordable, and ${listener || 'somebody'} now knows it.`,
      `${who} keeps the receipt where it is useful — folded, quiet, and dated night one. ${listener || 'A listener'} is told exactly once, which is how you tell somebody a plan.`,
    ], ctx, who);
    if (listener) {
      api.remember(listener, director, 'marked-by-a-survivor', 1, { twist: 'camp-director' });
    }
    api.remember(who, director, 'the-receipt', 1.5, { twist: 'camp-director' });
    return { text, players: [who, listener].filter(Boolean),
      badgeText: 'KEEPS THE RECEIPT', badgeClass: 'grey' };
  },
};

// ── one place too many at the table ──
//
// (Badge renamed from THE EMPTY CHAIR: a pre-existing veto event already
// uses that label for the empty REPLACEMENT chair, and a transcript where
// one badge means two different things is a transcript nobody can skim.)
//
// Somebody went home before the game had rules, and the house knows exactly
// whose handwriting started it.
const emptyChair = {
  id: 'camp-director-empty-chair',
  category: 'social',
  weight(house, ctx) {
    if (!_reactable(ctx)) return 0;
    // ONE SCENE PER WEEK. These are loud, rare-state events — the same
    // conversation happening twice in one week reads as a stuck record,
    // and a real season showed it: ASKED ABOUT THE LIST fired twice in
    // week one, same asker, same answer.
    if (firedThisWeek('camp-director-empty-chair', Number(ctx?.week?.num) || 0)) return 0;
    const cd = _camp(ctx, house);
    return cd?.evicted ? band(10, 13) : 0;
  },
  fire(house, ctx, api) {
    const cd = _camp(ctx, house);
    const director = cd.director;
    const speaker = _others(house, director)
      .sort((a, b) => pStats(b).social - pStats(a).social)[0];
    if (!speaker) return null;
    const text = _variant([
      `Somebody sets one place too many at dinner, out of habit, and the table goes quiet around the gap where ${cd.evicted} would be. ${speaker} says the name once, gently, and everybody looks anywhere but at ${director}.`,
      `${speaker} raises a glass of squash "to ${cd.evicted}, who never even got a week." It is kind, and it is also aimed, and ${director} drinks to it because refusing would be worse.`,
      `The first story anybody tells about ${cd.evicted} gets a laugh, and then the laugh runs out, because the person in the story has been gone since before the game had rules — and everyone at the table can trace the line back to one list.`,
    ], ctx, cd.evicted);
    api.popDelta(director, -0.5);
    api.remember(speaker, director, 'the-first-name', 1, { twist: 'camp-director' });
    return { text, players: [speaker, director], badgeText: 'ONE PLACE TOO MANY', badgeClass: 'grey' };
  },
};

export const CAMP_DIRECTOR_EVENTS = [needled, survivorSettles, emptyChair];
