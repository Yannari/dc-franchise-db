// ══════════════════════════════════════════════════════════════════════
// bb-events/pandora.js — the box, and the story about the box
// ══════════════════════════════════════════════════════════════════════
//
// Pandora's Box already had the mechanic: an HOH gambles privately, the house
// pays publicly, and the prize is a secret the Debug panel owns. What it did
// not have was an AFTERMATH. The lockdown happened, two readers rolled their
// eyes on the night, and then the week carried on as though a houseguest had
// not just been caught holding a story nobody believes.
//
// These are the days after. Somebody's laundry is locked outside; the claim
// gets tested in front of an audience; two sharp players compare notes; the
// room argues about what it would have done, which says more about the room
// than about the box; and one houseguest quietly decides that whatever was in
// there is real and starts waiting for it to show up.
//
// Two rules for this family.
//
// The PRIZE is never named, guessed at by name, or hinted at specifically —
// not in text, not in a badge. The house does not know a power exists; it
// knows a backyard got locked and a story does not add up. Suspicion is
// allowed to point at the HOH. Nothing here may point at a Diamond Veto.
//
// And nothing fires on a sealed week. If the HOH is invisible, the box has no
// public owner to resent, and naming one would out them — the reach-around
// gotcha that has bitten this format twice.
import { gs } from '../core.js';
import { pronouns } from '../players.js';
import { pStats, band, perceived, closestTo, furthestFrom, isVillainous } from './_read.js';

function _variant(list, ctx, ...salt) {
  const key = `${ctx?.week?.num || 0}|${ctx?.beat || 0}|${ctx?.act || ''}|${salt.join('|')}`;
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return list[hash % list.length];
}
const _others = (house, ...exclude) => house.filter(n => n && !exclude.includes(n));

/** The box, but only when it has a public owner to talk about. */
const _box = ctx => {
  const box = ctx?.week?.pandorasBox;
  if (!box || !box.hoh || ctx?.week?.hohSecret) return null;
  return box;
};
const _opened = ctx => { const b = _box(ctx); return b && b.opened ? b : null; };
const _closed = ctx => { const b = _box(ctx); return b && !b.opened ? b : null; };

/** Last week's box, for the resentment that outlives the lockdown. */
function _lastBox(ctx) {
  const weeks = gs?.bb?.weeks || [];
  const now = ctx?.week?.num || 0;
  for (let i = weeks.length - 1; i >= 0; i--) {
    const w = weeks[i];
    if (w && w.num < now && now - w.num <= 1
      && w.pandorasBox?.opened && !w.hohSecret) return w;
  }
  return null;
}

// Casting is shared between weight() and fire(): the scheduler treats a
// positive weight as a promise that a beat WILL be produced, and a null return
// after being picked throws.
const _priceCast = (house, ctx) => {
  const box = _opened(ctx);
  if (!box || !house.includes(box.hoh)) return null;
  // Whoever takes it worst: the shortest fuse in the house that is not the
  // person who caused it.
  const sore = _others(house, box.hoh).sort((a, b) => pStats(a).temperament - pStats(b).temperament)[0];
  return sore ? { box, sore } : null;
};
const _testCast = (house, ctx) => {
  const box = _opened(ctx);
  if (!box || !house.includes(box.hoh)) return null;
  const tester = _others(house, box.hoh).sort((a, b) => pStats(b).intuition - pStats(a).intuition)[0];
  const audience = _others(house, box.hoh, tester)[0] || null;
  return tester ? { box, tester, audience } : null;
};
const _compareCast = (house, ctx) => {
  const box = _opened(ctx);
  if (!box || !house.includes(box.hoh)) return null;
  const readers = _others(house, box.hoh)
    .sort((a, b) => pStats(b).intuition - pStats(a).intuition).slice(0, 2);
  return readers.length === 2 ? { box, a: readers[0], b: readers[1] } : null;
};
const _debateCast = (house, ctx) => {
  const box = _box(ctx);
  if (!box || !house.includes(box.hoh)) return null;
  const pool = _others(house, box.hoh);
  if (pool.length < 2) return null;
  const bold = [...pool].sort((a, b) => pStats(b).boldness - pStats(a).boldness)[0];
  const careful = [...pool].sort((a, b) => pStats(a).boldness - pStats(b).boldness)[0];
  return bold && careful && bold !== careful ? { box, bold, careful } : null;
};
const _watcherCast = (house, ctx) => {
  const box = _opened(ctx);
  if (!box || !house.includes(box.hoh)) return null;
  const watcher = _others(house, box.hoh)
    .sort((a, b) => (pStats(b).strategic + pStats(b).intuition) - (pStats(a).strategic + pStats(a).intuition))[0];
  return watcher ? { box, watcher } : null;
};
const _oversellCast = (house, ctx) => {
  const box = _opened(ctx);
  if (!box || !house.includes(box.hoh) || pStats(box.hoh).strategic > 6) return null;
  const mark = furthestFrom(box.hoh, _others(house, box.hoh));
  return mark ? { box, mark } : null;
};
const _closedCast = (house, ctx) => {
  const box = _closed(ctx);
  if (!box || !house.includes(box.hoh)) return null;
  const confidant = closestTo(box.hoh, _others(house, box.hoh));
  return confidant ? { box, confidant } : null;
};
const _stillPayingCast = (house, ctx) => {
  const last = _lastBox(ctx);
  const hoh = last?.pandorasBox?.hoh;
  if (!hoh || !house.includes(hoh)) return null;
  const sore = _others(house, hoh).sort((a, b) => pStats(a).temperament - pStats(b).temperament)[0];
  return sore ? { last, hoh, sore, claim: last.pandorasBox.publicClaim } : null;
};

// ── the price, taken personally ───────────────────────────────────────
const thePrice = {
  id: 'pandora-price-resented',
  category: 'house-life',
  weight(house, ctx) {
    if (ctx.act !== 'house') return 0;
    return _priceCast(house, ctx) ? band(10, 14) : 0;
  },
  fire(house, ctx, api) {
    const cast = _priceCast(house, ctx);
    if (!cast) return null;
    const { box, sore } = cast;
    const p = pronouns(sore);
    const text = _variant([
      `${sore}'s entire week of laundry is on the line on the wrong side of a locked door, and ${box.hoh} is inside explaining about ${box.publicClaim}. ${p.Sub} ${p.sub === 'they' ? 'do' : 'does'} the arithmetic on that trade out loud, at length.`,
      `"We are locked out of the yard. For ${box.publicClaim}." ${sore} repeats the trade whenever somebody defends it, and it sounds worse each time.`,
      `The doors lock, and ${sore} looks at ${box.hoh} the way you look at somebody who has spent your money. Nothing gets said directly. It does not need to be.`,
      `${sore} has been counting the hours of lockdown against the value of ${box.publicClaim} and has arrived at a number ${p.sub} ${p.sub === 'they' ? 'want' : 'wants'} the whole house to hear.`,
    ], ctx, sore, box.hoh);
    api.addBond(sore, box.hoh, -0.6);
    api.suspicion(sore, box.hoh, 0.5);
    api.popDelta(sore, 0.5);
    try { api.remember(sore, box.hoh, 'cost-the-house', 1, { twist: 'bb-pandoras-box' }); } catch { /* texture */ }
    return { text, players: [sore, box.hoh], badgeText: 'THE HOUSE PAYS', badgeClass: 'red' };
  },
};

// ── the story, tested in front of an audience ─────────────────────────
const storyTested = {
  id: 'pandora-story-tested',
  category: 'social',
  weight(house, ctx) {
    if (ctx.act !== 'house') return 0;
    return _testCast(house, ctx) ? band(9, 13) : 0;
  },
  fire(house, ctx, api) {
    const cast = _testCast(house, ctx);
    if (!cast) return null;
    const { box, tester, audience } = cast;
    // Selling it is a social stat. Selling it badly makes the lie the story.
    const st = pStats(box.hoh);
    const holds = st.social * 0.6 + st.strategic * 0.4 >= 6;
    const p = pronouns(box.hoh);
    const text = holds ? _variant([
      `${tester} asks ${box.hoh} to describe the box again — the door, the room, what was actually sitting in it. ${box.hoh} tells it the same way twice, bored, with the same small details. ${tester} runs out of questions before ${box.hoh} runs out of answers.`,
      `"So it was just ${box.publicClaim}." ${box.hoh} shrugs. "It was just ${box.publicClaim}." ${p.Sub} ${p.sub === 'they' ? 'do' : 'does'} not embellish, which is the single hardest part and the reason ${tester} lets it go.`,
      `${tester} sets a small trap in the retelling and ${box.hoh} walks around it without appearing to notice it was there${audience ? `. ${audience} notices, and does not say so` : ''}.`,
    ], ctx, box.hoh, tester) : _variant([
      `${tester} asks one question too many and ${box.hoh} answers it with two details nobody asked for. ${audience ? `${audience} has stopped listening to the words and started listening to the number of them.` : 'The extra details are the whole confession.'}`,
      `${box.hoh} explains about ${box.publicClaim} again, unprompted, to a room that had moved on. ${tester} lets ${p.obj} finish and then says nothing at all, which is worse than any follow-up.`,
      `"Show me it, then." ${tester} says it lightly, like a joke. ${box.hoh} laughs. ${box.hoh} does not show ${p.obj} it.`,
    ], ctx, box.hoh, tester);
    api.suspicion(tester, box.hoh, holds ? 0.4 : 1.5);
    if (!holds) {
      api.addBond(tester, box.hoh, -0.5);
      if (audience) api.suspicion(audience, box.hoh, 0.7);
      try { api.remember(tester, box.hoh, 'told-the-house-a-story', 1, { twist: 'bb-pandoras-box' }); } catch { /* texture */ }
    }
    return { text, players: [box.hoh, tester, audience].filter(Boolean),
      badgeText: holds ? 'THE STORY HOLDS' : 'THE STORY DOES NOT HOLD',
      badgeClass: holds ? 'grey' : 'red' };
  },
};

// ── two readers compare notes ─────────────────────────────────────────
const doubtersCompare = {
  id: 'pandora-doubters-compare',
  category: 'social',
  weight(house, ctx) {
    if (ctx.act !== 'house') return 0;
    return _compareCast(house, ctx) ? band(8, 12) : 0;
  },
  fire(house, ctx, api) {
    const cast = _compareCast(house, ctx);
    if (!cast) return null;
    const { box, a, b } = cast;
    const text = _variant([
      `${a} and ${b} arrive at the same sentence from opposite ends of the house: nobody locks a backyard over ${box.publicClaim}. Neither of them knows what it WAS. Both of them now know it was something.`,
      `"You believe that?" "Do you?" ${a} and ${b} establish in about nine words that neither of them believes ${box.hoh}, and that they are now the two people in this house who have said so out loud.`,
      `${a} lays out the timings — how long ${box.hoh} was in there, how fast the doors locked — and ${b} adds the part ${a} was missing. The conclusion is not evidence. It is close enough for two people to act on.`,
      `${b} says the quiet version: "Whatever ${box.hoh} came out of that room with, it was not ${box.publicClaim}." ${a} does not argue, and a small alliance of suspicion gets made without anybody proposing one.`,
    ], ctx, a, b);
    api.suspicion(a, box.hoh, 0.9);
    api.suspicion(b, box.hoh, 0.9);
    api.addBond(a, b, 0.5);
    return { text, players: [a, b, box.hoh], badgeText: 'COMPARING NOTES', badgeClass: 'blue' };
  },
};

// ── what the room would have done ─────────────────────────────────────
//
// The only event in the family that fires whether or not the box was opened,
// because the hypothetical is the interesting half: a houseguest telling the
// room what they would have done is telling the room who they are.
const wouldYouOpen = {
  id: 'pandora-would-you-open',
  category: 'social',
  weight(house, ctx) {
    if (ctx.act !== 'house') return 0;
    return _debateCast(house, ctx) ? band(8, 12) : 0;
  },
  fire(house, ctx, api) {
    const cast = _debateCast(house, ctx);
    if (!cast) return null;
    const { box, bold, careful } = cast;
    const text = _variant([
      `"I'd have opened it in about four seconds." ${bold} says it like a virtue. ${careful} says ${careful === bold ? '' : 'the opposite'}, at length, and the room quietly files both of them under something.`,
      `The sofas run the hypothetical for an hour: would you open it. ${bold} would, immediately, for anything. ${careful} would not, for anything, and is a little smug about it. Everybody in the room now knows which of them is easier to bait.`,
      `${careful} explains that a mystery door with a question mark on it is a trap by definition. ${bold} points out that ${box.hoh} ${box.opened ? 'opened it and is fine' : 'left it closed and got nothing'}, which is not the argument ${careful} was having.`,
      `${bold} and ${careful} disagree about the box loudly enough that it stops being about the box. Neither of them notices they have just told the whole house how they play.`,
    ], ctx, bold, careful);
    // Saying it out loud is information the house keeps.
    api.suspicion(careful, bold, 0.4);
    api.addBond(bold, careful, -0.2);
    api.popDelta(bold, 0.5);
    return { text, players: [bold, careful], badgeText: 'WOULD YOU OPEN IT', badgeClass: 'grey' };
  },
};

// ── somebody starts waiting for it ────────────────────────────────────
const watchingForIt = {
  id: 'pandora-watching-for-it',
  category: 'social',
  weight(house, ctx) {
    if (ctx.act !== 'house') return 0;
    return _watcherCast(house, ctx) ? band(9, 13) : 0;
  },
  fire(house, ctx, api) {
    const cast = _watcherCast(house, ctx);
    if (!cast) return null;
    const { box, watcher } = cast;
    const p = pronouns(watcher);
    const text = _variant([
      `${watcher} stops trying to work out what was in the box and starts watching ${box.hoh} for the moment ${box.hoh} needs it. That is a different kind of attention and it does not switch off.`,
      `${watcher} has decided the interesting question is not WHAT ${box.hoh} came out with. It is when ${box.hoh} will have to use it, and what the week will look like on either side of that.`,
      `"Whatever it is, it has a shelf life." ${watcher} says it to nobody, filing ${p.posAdj} own theory away, and spends the rest of the week watching ${box.hoh} being careful.`,
      `${watcher} counts the days since the door opened, out loud, once, and then stops mentioning it — which is the point at which ${p.sub} ${p.sub === 'they' ? 'become' : 'becomes'} genuinely dangerous to ${box.hoh}.`,
    ], ctx, watcher, box.hoh);
    api.suspicion(watcher, box.hoh, 1.3);
    try { api.remember(watcher, box.hoh, 'holding-something', 1, { twist: 'bb-pandoras-box' }); } catch { /* texture */ }
    return { text, players: [watcher, box.hoh], badgeText: 'WAITING FOR IT', badgeClass: 'gold' };
  },
};

// ── overselling it ────────────────────────────────────────────────────
const oversell = {
  id: 'pandora-oversells',
  category: 'social',
  weight(house, ctx) {
    if (ctx.act !== 'house') return 0;
    return _oversellCast(house, ctx) ? band(6, 10) : 0;
  },
  fire(house, ctx, api) {
    const cast = _oversellCast(house, ctx);
    if (!cast) return null;
    const { box, mark } = cast;
    const p = pronouns(box.hoh);
    const text = _variant([
      `${box.hoh} brings up ${box.publicClaim} a fourth time, to ${mark}, who had not asked and was not thinking about it. Nobody mentions a thing that unimportant that often.`,
      `${box.hoh} has started making jokes about ${box.publicClaim}. ${mark} laughs in the right places and privately moves ${box.hoh} up a list.`,
      `"Honestly, ${box.publicClaim}, I was gutted." ${box.hoh} performs the disappointment slightly too well, and ${mark} — who was not suspicious an hour ago — is now.`,
      `${box.hoh} keeps offering ${mark} details about the box that ${mark} never requested. ${p.Sub} ${p.sub === 'they' ? 'are' : 'is'} arguing with a case nobody has made.`,
    ], ctx, box.hoh, mark);
    api.suspicion(mark, box.hoh, 1.1);
    api.popDelta(box.hoh, -0.5);
    return { text, players: [box.hoh, mark], badgeText: 'PROTESTING TOO MUCH', badgeClass: 'red' };
  },
};

// ── the door that stayed shut ─────────────────────────────────────────
const leftClosed = {
  id: 'pandora-left-closed',
  category: 'social',
  weight(house, ctx) {
    if (ctx.act !== 'house') return 0;
    return _closedCast(house, ctx) ? band(8, 12) : 0;
  },
  fire(house, ctx, api) {
    const cast = _closedCast(house, ctx);
    if (!cast) return null;
    const { box, confidant } = cast;
    const p = pronouns(box.hoh);
    const villainish = isVillainous(confidant);
    const text = _variant([
      `${box.hoh} tells ${confidant} about the door with the question mark on it, and about deciding not to. ${confidant} ${villainish ? 'says that was very sensible, and thinks it was very soft' : 'says that was the right call, and mostly means it'}.`,
      `"There was a whole thing in there. I didn't touch it." ${box.hoh} says it lightly. ${confidant} can hear ${p.obj} still turning it over.`,
      `${box.hoh} spends the evening not thinking about the box, which ${confidant} can tell because ${p.sub} ${p.sub === 'they' ? 'mention' : 'mentions'} not thinking about it twice.`,
      `${box.hoh} admits to ${confidant} that ${p.sub} ${p.sub === 'they' ? 'have' : 'has'} no idea what was behind that door and will not for the rest of ${p.posAdj} life. ${confidant} points out that nobody else knows either, which helps for about a minute.`,
    ], ctx, box.hoh, confidant);
    api.addBond(box.hoh, confidant, 0.5);
    if (villainish) api.suspicion(confidant, box.hoh, 0.3);
    return { text, players: [box.hoh, confidant], badgeText: 'THE DOOR STAYED SHUT', badgeClass: 'grey' };
  },
};

// ── still paying for it a week later ──────────────────────────────────
const stillPaying = {
  id: 'pandora-still-paying',
  category: 'house-life',
  weight(house, ctx) {
    if (ctx.act !== 'house') return 0;
    return _stillPayingCast(house, ctx) ? band(7, 11) : 0;
  },
  fire(house, ctx, api) {
    const cast = _stillPayingCast(house, ctx);
    if (!cast) return null;
    const { hoh, sore, claim } = cast;
    const text = _variant([
      `Somebody mentions the lockdown in passing and ${sore} is immediately back in it, a week later, still doing the sum: a locked yard, for ${claim}.`,
      `${sore} has turned the box into a bit. Every inconvenience in this house is now "well, at least it's not ${claim}", and ${hoh} laughs along a beat late every time.`,
      `The story about ${claim} has become the thing this house says when it means "we do not entirely trust ${hoh}", and nobody had to decide that out loud.`,
      `${hoh} thought the box was last week's problem. ${sore} brings it up in front of four people, cheerfully, and it is not last week's problem.`,
    ], ctx, hoh, sore);
    api.suspicion(sore, hoh, 0.6);
    api.addBond(sore, hoh, -0.3);
    return { text, players: [sore, hoh], badgeText: 'STILL PAYING FOR IT', badgeClass: 'grey' };
  },
};

export const PANDORA_EVENTS = [
  thePrice, storyTested, doubtersCompare, wouldYouOpen,
  watchingForIt, oversell, leftClosed, stillPaying,
];
