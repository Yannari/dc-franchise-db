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
import { pStats, band, perceived, firedThisWeek } from './_read.js';
import { makeScene } from '../bb/script/scene.js';

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
    const asker = _others(house, director, ...cd.banished)
      .sort((a, b) => pStats(b).boldness - pStats(a).boldness)[0];
    if (!asker) return null;
    const st = pStats(director);
    // Social carries the defence; a low-social Director makes it worse.
    const smooth = st.social >= 5.5;
    if (smooth) {
      const scene = makeScene('director.needled', { a: director, b: asker }, { ending: 'smooth' }, [], 'kitchen');
      api.popDelta(director, 0.5);
      api.remember(asker, director, 'answers-too-well', 1, { twist: 'camp-director' });
      return { scene, players: [director, asker], badgeText: 'ASKED ABOUT THE LIST', badgeClass: 'blue' };
    }
    const scene = makeScene('director.needled', { a: director, b: asker }, { ending: 'flustered' }, [], 'kitchen');
    api.popDelta(director, -1);
    api.addBond(asker, director, -0.5);
    return { scene, players: [director, asker], badgeText: 'THE LIST COMES UP', badgeClass: 'red' };
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
    // Temperament forgives; the rest keep the receipt.
    const squashes = st.temperament >= 5.5;
    if (squashes) {
      const scene = makeScene('director.survivor', { a: who, b: director }, { ending: 'settled' }, [], 'kitchen');
      api.addBond(who, director, 1.2);
      api.popDelta(who, 0.5);
      return { scene, players: [who, director], badgeText: 'SETTLED IT', badgeClass: 'gold' };
    }
    const listener = _others(house, who, director)
      .sort((a, b) => perceived(who, b) - perceived(who, a))[0];
    const scene = makeScene('director.survivor', { a: who, b: listener || null }, { ending: 'grudge', intent: listener ? 'told' : 'alone', target: director }, [], 'backyard');
    if (listener) {
      api.remember(listener, director, 'marked-by-a-survivor', 1, { twist: 'camp-director' });
    }
    api.remember(who, director, 'the-receipt', 1.5, { twist: 'camp-director' });
    return { scene, players: [who, listener].filter(Boolean),
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
    const scene = makeScene('director.chair', { a: speaker, b: director }, { ending: 'scene', gone: cd.evicted }, [], 'kitchen');
    api.popDelta(director, -0.5);
    api.remember(speaker, director, 'the-first-name', 1, { twist: 'camp-director' });
    return { scene, players: [speaker, director], badgeText: 'ONE PLACE TOO MANY', badgeClass: 'grey' };
  },
};

export const CAMP_DIRECTOR_EVENTS = [needled, survivorSettles, emptyChair];
