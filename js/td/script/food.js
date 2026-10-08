// ══════════════════════════════════════════════════════════════════════
// td/script/food.js — how a venue eats, so a line about food fits the camp it is in
// ══════════════════════════════════════════════════════════════════════
//
// The user, 2026-10-08: "why are they accusing each other of cooking when they all eat at the
// kitchen?" Each venue feeds its campers one way (js/settings.js, foodSource):
//   hosted-camp      Chef cooks; everybody eats in the mess hall
//   film-lot         craft services (Chef runs it); no mess hall
//   world-tour       Chef and the drink cart on the jet; no mess hall
//   survival-island  the cast forages, fishes and cooks its own rice; nobody serves them
//   carnival         the carnival's snack stand; nobody cooks, nobody serves a hot meal
// A food line is only written where it is true: rationing and cooking for yourselves only on
// the survival island; Chef and his slop only where Chef cooks; the mess hall only at Wawanakwa.
// Words only: nothing here touches the game.

const SELF = /\b(rice|rations?|cook(ing|ed|s)? (extra|dinner|breakfast|the|for)|breakfast duty|stirring a pot|the pot|boil(ing|ed)?|forag(e|ing))\b/i;
const CHEF = /\b(chef|slop|ladle|meatloaf|trays?|pudding|dessert)\b/i;
const MESS = /\bmess hall\b/i;
const CHEF_VENUES = new Set(['hosted-camp', 'film-lot', 'world-tour']);

/** Whether a line's food fits the venue. */
export function foodOk(venue, text) {
  const v = venue || 'hosted-camp';
  if (SELF.test(text) && v !== 'survival-island') return false;
  if (CHEF.test(text) && !CHEF_VENUES.has(v)) return false;
  if (MESS.test(text) && v !== 'hosted-camp') return false;
  return true;
}

/** The text of a pool entry, for checking. */
export const entryText = e => (e.turns || []).map(t => t.beat || t.say || t.conf || '').join(' ');

/** Camp moments that are a meal: they happen at mealtime, where the camp eats. */
export const MEAL_KIND = /^(crowd\.(meal|dinner)|drama\.(food|mess)|hosted\.slop|friend\.meal|long\.crowd\.(meal|dinner)|long\.(drama\.(food|mess)|hosted\.slop|friend\.meal))/;
export const MEAL_TYPE = /^(foodConflict|messHallDrama|chefSlop|sharedMeal)$/;
