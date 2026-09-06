// ══════════════════════════════════════════════════════════════════════
// dr/judges.js — who is on the panel tonight, and how each of them sees
// ══════════════════════════════════════════════════════════════════════
//
// Two permanents, one rotating judge chosen per episode in the timeline, and a
// guest drawn from the franchise's own roster — this universe has no
// celebrities outside its reality shows, so a guest judge is somebody who
// played one of them.
//
// A guest's taste is DERIVED rather than authored, and it has to be: there are
// 194 people in the roster and none of them was written with a judging
// philosophy in mind. Their nine stats already say enough — somebody sharp is
// hard on technique, somebody bold rewards a risk, somebody warm says fewer
// cruel things — and deriving it means every future character can sit on the
// panel the day they are cast, with no second authoring pass.
import { JUDGES } from './data/judges.js';

export function judgeById(id) {
  return JUDGES.find(j => j.id === id) || null;
}

const norm = t => {
  const s = Object.values(t).reduce((a, b) => a + b, 0) || 1;
  return Object.fromEntries(Object.entries(t).map(([k, v]) => [k, v / s]));
};

// What an archetype forgives. A villain enjoys a mess and has no patience for
// a pageant queen; a hero is generous about polish. Small numbers: a guest is
// one seat of four and should tilt a night, never decide it.
const ARCH_BIAS = {
  villain: { comedy: 0.3, spooky: 0.2, pageant: -0.2 },
  mastermind: { art: 0.2, fashion: 0.2 },
  schemer: { comedy: 0.2, spooky: 0.1 },
  hothead: { 'club-kid': 0.2, comedy: 0.2 },
  'challenge-beast': { dancer: 0.3, 'club-kid': 0.1 },
  'social-butterfly': { camp: 0.2, comedy: 0.2 },
  'loyal-soldier': { pageant: 0.2, glamour: 0.1 },
  wildcard: { camp: 0.3, art: 0.2 },
  'chaos-agent': { 'club-kid': 0.3, camp: 0.2, pageant: -0.2 },
  floater: {},
  underdog: { underdogFriendly: 0 },
  hero: { pageant: 0.2, glamour: 0.2 },
  goat: { comedy: 0.2 },
  'perceptive-player': { art: 0.2, fashion: 0.1 },
  showmancer: { glamour: 0.3, pageant: 0.1 },
};

const slugOf = name => String(name || '')
  .trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

/**
 * A franchise alumnus as a guest judge, with taste read off their stats.
 *
 *   strategic → watches the game, so weighs what she actually did
 *   mental    → weighs polish and technique
 *   boldness  → rewards a risk
 *   social    → warmth, which the critique voice uses to soften a pan
 */
export function guestTaste(player) {
  const s = (player && player.stats) || {};
  const n = k => (Number.isFinite(Number(s[k])) ? Number(s[k]) : 5) / 10;   // 0.1..1

  const taste = norm({
    challenge: 0.30 + n('strategic') * 0.20,
    runway:    0.20 + (1 - n('mental')) * 0.10,
    risk:      0.05 + n('boldness') * 0.30,
    polish:    0.05 + n('mental') * 0.30,
  });

  return {
    id: `guest:${player.slug || slugOf(player.name)}`,
    name: player.name,
    permanent: false,
    guest: true,
    // A guest has no portrait ON THE PANEL: their roster portrait is resolved
    // through js/avatar-registry.js at render time, because that is the only
    // thing allowed to turn a player plus a show into a picture.
    portrait: null,
    playerSlug: player.slug || slugOf(player.name),
    taste,
    styleBias: ARCH_BIAS[player.archetype] || {},
    // How much this judge softens. 1 is almost no negative lines.
    warmth: n('social'),
    voiceHint: player.voice || '',
  };
}

/**
 * Tonight's panel, in seating order.
 *
 * `weights` are the setup screen's per-judge overrides, keyed by judge id, and
 * renormalised after merging so a half-filled override cannot quietly make one
 * judge count for more than another.
 */
export function panelFor({ rotatingId = 'carson', guest = null, weights = {} } = {}) {
  const seat = j => {
    const w = weights && weights[j.id];
    return w ? { ...j, taste: norm({ ...j.taste, ...w }) } : j;
  };

  const out = [seat(judgeById('rupaul')), seat(judgeById('michelle'))];

  // A permanent judge asked to rotate in is already sitting down. Nothing
  // stops the timeline offering one, so this refuses rather than duplicating.
  const rot = judgeById(rotatingId);
  if (rot && !rot.permanent) out.push(seat(rot));

  if (guest) out.push(seat(guestTaste(guest)));
  return out;
}
