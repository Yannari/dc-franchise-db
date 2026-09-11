// ══════════════════════════════════════════════════════════════════════
// dr/werk.js — drawing the room's scenes
// ══════════════════════════════════════════════════════════════════════
//
// The pool is js/dr/data/werk-events.js; this decides which of it happens.
//
// Three things this file is careful about, each of them a bug the project has
// already shipped once in another show:
//
//  1. IT DRAWS FROM WHAT IS ELIGIBLE, and reports how much that was. A pool of
//     sixty that filters to three on a normal night reads worse than a pool of
//     twenty that all apply, and the only way to know which you have is to
//     count it — so `eligible` comes back on every draw.
//  2. IT DOES NOT REPEAT ITSELF within a season. An event that has already
//     happened is heavily discouraged rather than banned: banning it empties
//     the pool late in a long season, and a season that runs out of scenes
//     starts showing the same one anyway.
//  3. EVERY SCENE IT DRAWS HAS A CONSEQUENCE, applied through one function, so
//     "did this change anything" is answerable by reading one place.
//
// Arcs raise the weight rather than gating: a villain gets villain scenes more
// often, and a hero can still have a bad day. A gate would make every queen
// her own label and nothing else.
import { WERK_EVENTS } from './data/werk-events.js';
import { dragOf } from './queen.js';
import { canScheme } from './rules.js';
import { familyFacts } from './family.js';
/* THE FRANCHISE'S OWN ATTRACTION RULE, not a second copy. js/attraction.js
   takes plain player objects and imports nothing from the simulator, which is
   why the life resolver uses it too — a drag season running headless can ask
   the same question every other show asks. */
import { romanticallyCompatible } from '../attraction.js';
import { confessionalsFor } from './confessional.js';
import { streamFor } from './rng.js';

/** How much an arc match is worth. Multiplicative on the base weight. */
const ARC_BONUS = 2.5;
/** How much a scene already used this season is discouraged. Not banned. */
const REPEAT_PENALTY = 0.08;
/**
 * How hard the room pushes toward a queen nobody has seen tonight.
 *
 * MEASURED, and the reason this exists: drawing the subject at random gave 32%
 * of a fourteen-queen cast ZERO scenes in a given episode — four or five queens
 * silent every week — and fourteen queens across twenty seasons who never
 * appeared once all season. That is not an edit, it is a dice roll. A queen who
 * gets nothing should be the filler edit, chosen because nobody is watching
 * her, and star power decides that below rather than chance.
 */
const UNSEEN_BONUS = 6;

const stat = (p, k) => {
  const n = Number(p?.stats?.[k]);
  return Number.isFinite(n) ? n : 5;
};

/**
 * What the pool's eligibility tests are allowed to know.
 *
 * Assembled once per candidate pairing. Everything here is a fact about the
 * room right now — nothing is a decision, so an event can never reach in and
 * change the week from inside its own `when`.
 */
function factsFor({ a, b, players, state, storylines, ctx, rest = [] }) {
  const arcsOf = n => storylines
    .filter(s => s.alive && s.players.includes(n))
    .map(s => s.arc);
  const rec = n => state.record?.[n] || [];
  const pa = players[a] || null;
  const pb = b ? players[b] || null : null;
  return {
    a: pa,
    b: pb,
    nameA: a,
    nameB: b || null,
    // The rest of the group, if this is a group scene. `groupSize` counts
    // everybody in it, so a `when` can ask for a real crowd.
    /* WHO THEY WERE BEFORE THEY GOT HERE. A family is a pre-alliance: it
       buys a warm bond, the benefit of the doubt and somebody to sit with,
       and an event can ask for it — a drag daughter being coached by her
       mother is not the same scene as one stranger helping another.
       Empty on a season with no families, so every existing event is
       unaffected. */
    ...familyFacts(state.dragFamilies, a, b),
    nameC: rest[0] || null,
    nameD: rest[1] || null,
    groupSize: 1 + (b ? 1 : 0) + rest.length,
    bond: b ? ctx.bond(a, b) : 0,
    canScheme: canScheme(pa),
    // NOT SUPPLIED, deliberately: the room is drawn before the challenge hands
    // out its teams, so no werk room event may gate on team membership. An
    // event that did was drawn zero times in thirty seasons.
    sameTeam: false,
    lastCall: rec(a)[rec(a).length - 1] || null,
    lastCallB: b ? rec(b)[rec(b).length - 1] || null : null,
    winsA: rec(a).filter(r => r === 'WIN').length,
    winsB: b ? rec(b).filter(r => r === 'WIN').length : 0,
    safesA: rec(a).filter(r => r === 'SAFE').length,
    /* WHAT THE SEASON HAS BEEN DOING TO HER, which the room can see as
       plainly as the chart can. Being the frontrunner, being permanently
       safe, and living in the bottom are the three states this competition
       puts a queen in, and each one should cost her something socially —
       until these facts existed, only six of sixty-two werk room events read
       the record at all, and they fired about four times a season between
       them.
       BOTH BOTTOM CALLS COUNT. BTM2 is a lip sync survived, BTM is being
       named and then saved before the song — different nights, the same
       target on your back the next morning. */
    bottomsA: rec(a).filter(r => r === 'BTM' || r === 'BTM2').length,
    bottomsB: b ? rec(b).filter(r => r === 'BTM' || r === 'BTM2').length : 0,
    lipSyncedA: rec(a).filter(r => r === 'BTM2').length,
    // Episodes since her last good night. A frontrunner cooling off and a
    // queen who has never been called at all are different problems.
    sinceTopA: (() => {
      const r = rec(a);
      const i = r.map((x, k) => (x === 'WIN' || x === 'HIGH' ? k : -1)).filter(k => k >= 0).pop();
      return i === undefined ? r.length : r.length - 1 - i;
    })(),
    neverTopA: !rec(a).some(r => r === 'WIN' || r === 'HIGH'),
    neverBottomA: rec(a).length >= 3 && !rec(a).some(r => r === 'BTM' || r === 'BTM2'),
    phase: ctx.phase ?? 0,
    episode: ctx.episode ?? 1,
    roomSize: (state.living || []).length,
    someoneLeft: !!ctx.someoneLeft,
    lostAFriend: !!(ctx.gone || []).some(g => ctx.bond(a, g) >= 4),
    lostAnEnemy: !!(ctx.gone || []).some(g => ctx.bond(a, g) <= -4),
    arcsA: arcsOf(a),
    arcsB: b ? arcsOf(b) : [],
    /* ROMANCE IS PRESENT AND IT IS NOT THE POINT. This show is about the
       work, so there is no showmance pipeline here the way Total Drama has
       one — what there is, is the ordinary fact that people in a room for two
       months sometimes fall for each other. Gated on the franchise's own
       compatibility rule so drag never pairs people the rest of the franchise
       would not, and capped per season so it stays a thread rather than a
       storyline. */
    compatible: !!(pa && pb && romanticallyCompatible(pa, pb)),
    /* COUNTED WITHIN THIS PASS TOO, not only across weeks. `state.romances`
       is written by the caller AFTER this whole run returns, so inside one
       pass the list never grows — and every scene in the pass read the same
       stale count. That was harmless while a room got four scenes and stopped
       binding the moment the rooms were sized to the cast: three romances
       started in a single werk room, all of them believing they were the
       second, because the caller only wrote the list once the whole run
       had returned. It is written at the point the pairing happens now. */
    romanceOpen: (state.romances || []).length < 2,
    alreadyPaired: (state.romances || []).some(r => r.includes(a) || (b && r.includes(b))),
  };
}

/**
 * Fill {a} and {b}. A line with no variants written yet renders as null.
 *
 * `used` makes the draw WITHOUT REPLACEMENT across one week, for the same
 * reason the stage does it: an event that fires twice in a night would
 * otherwise be able to print the identical sentence twice.
 */
/** Put the names in. One place, so a field cannot be added and forgotten. */
function fillNames(text, facts) {
  return String(text == null ? '' : text)
    .replace(/\{a\}/g, facts.nameA || '')
    .replace(/\{b\}/g, facts.nameB || '')
    .replace(/\{c\}/g, facts.nameC || '')
    .replace(/\{d\}/g, facts.nameD || '');
}

function render(event, facts, rng, used = null) {
  if (!event.lines || !event.lines.length) return null;
  const fresh = used
    ? event.lines.filter(l => !used.has(event.id + '\u0000' + l)) : event.lines;
  const pool = fresh.length ? fresh : event.lines;
  const line = pool[Math.floor(rng() * pool.length)];
  if (used) used.add(event.id + '\u0000' + line);
  return fillNames(line, facts);
}

/**
 * One werk room scene.
 *
 * Returns `null` when the slot has nothing eligible, which is a real outcome
 * rather than an error: a quiet morning is allowed. The caller decides whether
 * to try again for a second scene.
 */
/**
 * Who this scene is about.
 *
 * Weighted toward whoever has not been on screen tonight, then by how much the
 * camera wants her. The unseen bonus is much the larger term, so the room
 * covers itself before it plays favourites — but a low-star queen benefits from
 * it less, which is how a filler edit happens on purpose rather than by
 * accident.
 */
function pickSubject(pool, seen, state, rng) {
  const weights = pool.map(n => {
    const times = seen[n] || 0;
    const unseen = times === 0 ? UNSEEN_BONUS : 1 / (1 + times);
    const star = 0.6 + ((state.star?.[n] ?? 5) / 10) * 0.8;
    return { n, w: unseen * star };
  });
  const total = weights.reduce((t, x) => t + x.w, 0);
  let roll = rng() * total;
  return (weights.find(x => (roll -= x.w) <= 0) || weights[0]).n;
}

export function drawWerkScene({
  slot, living, players, state, storylines, rng, ctx, used = new Set(), seen = {},
  usedLines = null, blend = null,
}) {
  if (!living || living.length < 1) return null;

  const candidates = [];
  for (const ev of WERK_EVENTS) {
    if (ev.slot !== slot) continue;
    if (ev.needs && blend && !blend[ev.needs]) continue;

    // A pair event needs somebody to be with. Rather than testing every pair
    // in the room, which would make one well-connected queen dominate, each
    // event gets one shot at a subject and a partner — both drawn toward
    // whoever has not been seen yet tonight.
    const a = pickSubject(living, seen, state, rng);
    const others = living.filter(n => n !== a);
    const pairing = ev.cast === 'pair' || ev.cast === 'group';
    const b = pairing
      ? (others.length ? pickSubject(others, seen, state, rng) : null)
      : null;
    if (pairing && !b) continue;

    /* ── A GROUP IS THREE OR FOUR, AND THE THIRD IS OFTEN JUST THERE ──
       The werk room only knew how to do one queen or two, which is why a room
       of thirteen read as a series of private conversations. Most of what
       happens in that room happens in front of people: a fight has an
       audience, a joke has a table, and being the queen who watched two
       others go at it is its own scene.
       `{c}` and `{d}` are the rest of the group, drawn the same way as the
       first two — toward whoever has not been seen tonight — so a group scene
       spreads screen time rather than concentrating it. */
    const rest = [];
    if (ev.cast === 'group') {
      const pool = others.filter(n => n !== b);
      const want = Math.min(pool.length, 1 + Math.floor(rng() * 2));   // 1 or 2 more
      const taken = new Set();
      for (let g = 0; g < want; g++) {
        const left = pool.filter(n => !taken.has(n));
        if (!left.length) break;
        const pickd = pickSubject(left, seen, state, rng);
        taken.add(pickd);
        rest.push(pickd);
      }
      if (!rest.length) continue;
    }

    const facts = factsFor({ a, b, players, state, storylines, ctx, rest });
    let ok = false;
    try { ok = !!ev.when(facts); } catch { ok = false; }
    if (!ok) continue;

    // The arc bonus, from either queen in the pair: a scene typical of the
    // villain fires more often when a villain is actually in it.
    const inPlay = new Set([...facts.arcsA, ...facts.arcsB]);
    const matches = (ev.arcs || []).some(x => inPlay.has(x));
    const weight = (ev.weight || 1)
      * (matches ? ARC_BONUS : 1)
      * (used.has(ev.id) ? REPEAT_PENALTY : 1);

    candidates.push({ ev, facts, weight });
  }

  if (!candidates.length) return null;

  const total = candidates.reduce((t, c) => t + c.weight, 0);
  let roll = rng() * total;
  const picked = candidates.find(c => (roll -= c.weight) <= 0) || candidates[0];

  return {
    id: picked.ev.id,
    slot,
    players: [picked.facts.nameA, picked.facts.nameB, picked.facts.nameC,
      picked.facts.nameD].filter(Boolean),
    text: render(picked.ev, picked.facts, rng, usedLines),
    /* THE NOTE TAKES NAMES TOO, and did not. It was handed through raw while
       the line beside it was filled, so a badge on the werk screen read
       "...she helps Quin and {c} and loses two hours of her own day" -- the
       placeholder, on screen, in the show. Reported from a played episode.
       Both go through `fillNames` now; adding a field and forgetting to
       substitute it is no longer possible in two places. */
    note: fillNames(picked.ev.note, picked.facts),
    effects: picked.ev.effects,
    // How much choice there actually was. This is the number that decides
    // whether a season repeats itself, and it is worth carrying rather than
    // recomputing later.
    eligible: candidates.length,
  };
}

/**
 * Write what a scene did.
 *
 * The one place werk room consequences land, on the same principle as
 * `applyEvents` in the maxi engine: a scene that changes nothing throws here
 * rather than being quietly dropped.
 */
export function applyWerkScene(scene, ctx) {
  if (!scene) return null;
  const e = scene.effects || {};
  const changes = (e.bond ? 1 : 0) + Object.keys(e.pop || {}).length + (e.state ? 1 : 0);
  if (!changes) {
    throw new Error(
      `drag-race: werk room scene "${scene.id}" has no consequence — every scene `
      + 'must move a bond, a popularity number or a state flag');
  }
  const [a, b] = scene.players;
  if (e.bond && b) ctx.addBond(a, b, e.bond);
  for (const [who, delta] of Object.entries(e.pop || {})) {
    const name = who === 'a' ? a : b;
    if (name) ctx.popDelta(name, delta);
  }
  return { applied: changes, state: e.state || null };
}

/**
 * Every werk room scene for one week, in slot order.
 *
 * THE SCENE COUNT FOLLOWS THE ROOM. A fixed two per slot gave eight scenes to
 * cover fourteen queens, and a third of the cast was silent every episode.
 *
 * Checked against a real episode rather than guessed: Wikipedia's summary of
 * "Draggle Rock" lists five distinct werk room blocks — the return after an
 * elimination, the mini challenge, picking teams and building characters, the
 * host's walkthrough, and elimination-day preparation — and each block holds
 * several separate conversations. So the honest target is roughly one scene
 * per queen, which for a full cast is a dozen or more beats spread across the
 * four slots, not eight.
 */
export function runWerkRoom({ slots, living, players, state, storylines, rng, ctx, perSlot = null, blend = null }) {
  const scenes = [];
  const seen = {};
  const usedLines = new Set();
  const used = state._drWerkUsed instanceof Set
    ? state._drWerkUsed
    : (state._drWerkUsed = new Set(state._drWerkUsedList || []));

  /* ONE SCENE PER QUEEN WAS THE TARGET AND IT WAS THE WRONG ONE. The old
     floor of two, combined with the break below, spent the week's whole
     budget in the first slot: once every queen had appeared ANYWHERE, every
     later slot stopped at two. Measured in a browser across a season, that
     produced the werk room at three cards, prep at two and elimination day
     at two — four screens carrying a couple of paragraphs each while the
     maxi carried nine.
     The floor is four and the break now wants everybody seen TWICE, so a
     slot is only cut short when the room genuinely has nothing left to say.
     Each of the four werk screens gets a night's worth rather than a
     leftover. */
  /* HOW MANY SCENES A ROOM GETS, and it is not four everywhere.
     This was `max(4, ceil((living + 2) / slots))`, which on a thirteen-queen
     premiere is four — four scenes to cover thirteen women in a room they
     spend the whole day in, against thirteen walkthrough cards on the same
     screen. Read the prep screen and it is the host's notes with a couple of
     werk-room moments buried in them, which is the opposite of what the
     werk room is for.
     THE ROOMS ARE NOT THE SAME SIZE. The cold open is a few minutes and
     elimination day is the last hour; the morning and prep are where the
     season's bonds, fights and breakdowns actually happen, and they scale
     with how many people are in the room. */
  // Pairings begun during THIS run, so the season cap binds inside one pass
  // as well as across weeks. Keyed "a\u0000b", sorted.

  const BIG = new Set(['werk-morning', 'prep']);
  const sizeFor = slot => (perSlot != null ? perSlot
    : BIG.has(slot) ? Math.max(6, living.length)
      : Math.max(4, Math.ceil(living.length / 2.5)));

  for (const slot of slots) {
    const perSlotN = sizeFor(slot);
    for (let i = 0; i < perSlotN; i++) {
      // Once every queen has had two scenes, stop padding this slot.
      if (i >= 3 && living.every(n => (seen[n] || 0) >= 2)) break;

      /* A DUPLICATE RETRIES RATHER THAN SPENDING THE SLOT. The draw is
         weighted, not exclusive — an event already used this season is
         penalised but can still come up — so late in a season the same id
         is offered repeatedly, and `continue` burned one of the slot's few
         iterations every time it did. The room got quieter as the season
         went on, which is exactly backwards: that is when the queens have
         the most to say to each other.
         Three attempts, then give the slot up. */
      let scene = null;
      for (let tries = 0; tries < 3 && !scene; tries++) {
        const s2 = drawWerkScene({
          slot, living, players, state, storylines, rng, ctx, used, seen, usedLines, blend,
        });
        if (!s2) break;
        // A slot never runs the same scene twice in one night, whatever the
        // weighting says.
        if (!scenes.some(x => x.id === s2.id)) scene = s2;
      }
      if (!scene) break;
      scenes.push(scene);
      used.add(scene.id);
      /* A PAIRING IS RECORDED THE MOMENT IT HAPPENS, not after the run.
         `romanceOpen` and `alreadyPaired` read `state.romances`, and the
         caller only wrote that list once this whole pass had returned — so
         every scene in a pass saw the same stale count. Harmless while a room
         drew four scenes and not harmless once the rooms were sized to the
         cast: three pairings started inside one werk room, each of them
         correctly believing it was the second.
         The caller still writes the same list and its push is now a
         de-duplicating no-op, which is the right shape: one owner, written
         at the point the fact becomes true. */
      if (scene.effects && scene.effects.state === 'romance' && scene.players.length === 2) {
        const pair = [...scene.players].sort();
        state.romances ||= [];
        if (!state.romances.some(r => r[0] === pair[0] && r[1] === pair[1])) {
          state.romances.push(pair);
        }
      }
      for (const n of scene.players) seen[n] = (seen[n] || 0) + 1;
    }
  }

  // A Set does not survive JSON, and this goes into the save. The list is the
  // stored form and the Set is rebuilt from it — the same repair the rest of
  // the project does with `prepGsForSave`.
  state._drWerkUsedList = [...used];

  /* ── AND THEN SOMEBODY TELLS THE CAMERA WHAT THAT ACTUALLY WAS ──
     Confessionals are appended once the room's scenes exist, because a
     confessional reacts to one and cannot be drawn alongside them. Per
     SLOT, so the cap is a cap on a screen rather than on an episode: two
     cutaways in the werk room and two more on elimination day is a show,
     and four in one column is a different programme.
     `spoken` crosses the slots deliberately — one confessional per queen per
     episode, or the edit grows a favourite. See js/dr/confessional.js. */
  /* ── AND IT DRAWS ITS OWN DICE, WHICH IS NOT FUSSINESS ──
     Taking numbers off the week's generator was measured and it is a
     regression: the confessional pass ran before the mini, the maxi and the
     judging, so every draw it took shifted every decision after it, and the
     season stopped producing events it used to. `roasted-the-panel` went
     from firing to unreachable over the reach suite's seasons — a written
     event that no longer happens, caused by an unrelated feature spending
     random numbers upstream of it.
     The stream is derived from what the slot already contains rather than
     from a seed threaded down here: same room, same scenes, same
     confessionals, and zero draws taken from the week. */
  const spoken = new Set();
  const bySlot = new Map();
  for (const sc of scenes) {
    const k = sc.slot || '';
    if (!bySlot.has(k)) bySlot.set(k, []);
    bySlot.get(k).push(sc);
  }
  const episode = Number(ctx?.episode) || 0;
  let out = scenes;
  for (const [k, list] of bySlot) {
    const rows = confessionalsFor({
      scenes: list, room: living, players, spoken, slot: k,
      /* WHO HAS SOMETHING RIDING ON IT. Without this a witness was drawn
         flat out of the room, so the queen with no relationship to either
         of them spoke as often as the one whose closest ally had just been
         read. See `candidatesFor`. */
      bond: ctx?.bond || (() => 0),
      rng: streamFor(episode + 1, `confessional|${k}|${list.map(x => x.id).join(',')}`),
    });
    if (!rows.length) continue;
    // Splice against the FULL list, not the slot's, so the confessional lands
    // immediately after the scene it is about wherever that scene sits.
    const after = new Map(rows.map(r => [list[r.index], r.scene]));
    const next = [];
    for (const sc of out) {
      next.push(sc);
      const c = after.get(sc);
      if (c) next.push(c);
    }
    out = next;
  }
  return out;
}

/** Facts about how well the pool is holding up, for the audit. */
export function werkCoverage(scenes) {
  const ids = scenes.map(s => s.id);
  const eligible = scenes.map(s => s.eligible);
  return {
    drawn: ids.length,
    distinct: new Set(ids).size,
    written: scenes.filter(s => s.text).length,
    minEligible: eligible.length ? Math.min(...eligible) : 0,
    meanEligible: eligible.length
      ? Math.round((eligible.reduce((a, b) => a + b, 0) / eligible.length) * 10) / 10 : 0,
  };
}

export { dragOf, stat };
