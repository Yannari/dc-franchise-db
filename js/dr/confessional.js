// ══════════════════════════════════════════════════════════════════════
// dr/confessional.js — who talks to the camera, and about what
// ══════════════════════════════════════════════════════════════════════
//
// The card already existed and was reached by accident. `sceneCard` in
// js/vp-dr/werk.js decided whether to draw the viewfinder by substring-
// matching the EVENT ID against /confess|shade-tree|talking/, so of 107 werk
// events exactly three were ever framed as a piece to camera — all three in
// `prep`, and two of the three `cast: 'pair'`, which is two queens talking to
// each other wearing a frame that says one queen talking to a lens. Nothing
// was wrong with the renderer. The feature had no author.
//
// This is the author. A confessional is a property a scene HAS, not a name it
// happens to be spelled with, and it is produced here.
//
// ── IT FOLLOWS SOMETHING ─────────────────────────────────────────────
//
// A confessional reacts to the scene before it. That is what makes it worth
// having: the room does the polite version and then one of them tells the
// camera what it actually was. So this module never invents a beat — it reads
// the slot's scenes, decides which ones earned a reaction, and appends one.
//
// ── WHO IS ALLOWED TO BE SHADY ───────────────────────────────────────
//
// The franchise rule, unchanged: nice archetypes never scheme, villains
// always may, neutrals need strategic >= 6 and loyalty <= 4. Drag's version
// of scheming is the read and the shade, so it governs here — but only over
// the two tiers that ARE shade. Being hurt is not scheming: a hero who was
// treated badly may say so to camera, and does.
//
// When nobody eligible is available the confessional is simply not emitted.
// There is no gentler fallback tier, because inventing one would put a line
// in her mouth that the pool was not written for.
import { CONFESSIONAL_TIERS, confessionalTier } from './data/confessional-lines.js';

/* THE TWO TIERS THAT ARE SHADE. `taken-cold` is not one of them — she is the
   one it was done to, and saying so is a feeling rather than a move. */
const SHADE = new Set(['did-cold', 'watched-cold']);
/* Every tier whose sign is negative. `taken-cold` is cold without being shade
   -- it was done TO her -- so it is rolled by neither branch. */
const COLD = new Set(['did-cold', 'watched-cold', 'taken-cold']);

const NEVER = new Set(['hero', 'loyal-soldier', 'social-butterfly', 'showmancer',
  'underdog', 'goat']);
const ALWAYS = new Set(['villain', 'mastermind', 'schemer']);

/**
 * How sharp she is, as a number rather than a door.
 *
 * `mayBeShady` below is the franchise scheming rule and it is a HARD GATE:
 * a hero could not give a cold confessional at all, ever, on any night, about
 * anybody. That rule is right for scheming and sabotage -- moves that cost
 * another queen something -- and wrong here. A confessional moves her EDIT
 * and never a bond (see the header of the lines file): nobody in the room
 * hears it and nothing happens to anyone. Locking a private opinion behind
 * the sabotage rule made a kind queen incapable of ever being unimpressed on
 * camera, which is not a personality, it is a missing one.
 *
 * So: a probability. A nice queen CAN say the sharp thing and rarely does; a
 * villain is nice less often than a schemer or a hothead is, without either
 * being incapable of it.
 *
 * WHAT MOVES IT:
 *   - the archetype, as a starting lean rather than a verdict
 *   - `strategic` up and `loyalty` down, the same two stats the franchise
 *     rule reads, but weighing on the number instead of opening a door
 *   - and WHO IT IS ABOUT. The sharpest queen alive is generous about her
 *     closest ally, and the gentlest one has somebody she cannot help
 *     herself about. That is the term that makes this a read of the room
 *     rather than a read of the cast sheet.
 */
const EDGE = {
  villain: 0.86, schemer: 0.78, hothead: 0.74, 'chaos-agent': 0.7,
  mastermind: 0.68, wildcard: 0.52, 'perceptive-player': 0.48,
  floater: 0.44, 'challenge-beast': 0.42, showmancer: 0.36,
  underdog: 0.32, 'social-butterfly': 0.3, 'loyal-soldier': 0.24,
  goat: 0.22, hero: 0.18,
};
export function edgeFor(player, bondWithTarget = 0) {
  const num = (v, d = 5) => (Number.isFinite(Number(v)) ? Number(v) : d);
  const base = EDGE[player?.archetype || ''] ?? 0.45;
  const lean = (num(player?.stats?.strategic) - num(player?.stats?.loyalty)) / 10;
  // A bond runs -10..+10. Warmth pulls her generous, friction pulls her sharp.
  const feeling = -Math.max(-10, Math.min(10, Number(bondWithTarget) || 0)) / 10;
  const v = base + lean * 0.18 + feeling * 0.28;
  // Never certain and never impossible: the point of the whole change.
  return Math.max(0.04, Math.min(0.95, v));
}

/** May this queen say the shady version out loud? The franchise rule. */
export function mayBeShady(player) {
  const arch = player?.archetype || '';
  if (NEVER.has(arch)) return false;
  if (ALWAYS.has(arch)) return true;
  const s = Number(player?.stats?.strategic);
  const l = Number(player?.stats?.loyalty);
  return (Number.isFinite(s) ? s : 5) >= 6 && (Number.isFinite(l) ? l : 5) <= 4;
}

/**
 * What a confessional does to how the room feels about her.
 *
 * This was the tier's `sign` and nothing else: every shady read cost her one
 * point and every generous one gained her one, whoever she was. So a villain
 * with the comic timing to make a whole audience howl at a read paid exactly
 * what a humourless queen paid for being nasty — and on this show those are
 * opposite outcomes. One becomes the reason people watch; the other becomes
 * the one everybody is tired of by episode six.
 *
 * SHADE IS PAID FOR IN COMEDY. A read that lands is a gift to the audience; a
 * read that does not is just meanness with a camera on it. Her `comedy` is
 * most of the answer and her archetype is the rest -- a villain is EXPECTED
 * to be sharp and gets more rope for it, a hero doing the same thing reads as
 * out of character.
 *
 * A generous confessional stays generous. Being funny while kind is worth a
 * little more, not less.
 *
 * NOTE WHAT THIS DOES NOT TOUCH: `tv` in js/dr/state.js. The mean queen is
 * still the most watchable person in the room and keeps the star that comes
 * with it -- she is simply not liked. That split is the whole reason the two
 * ledgers exist.
 */
const SHARP = new Set(['villain', 'schemer', 'hothead', 'chaos-agent', 'mastermind']);
export function editSwing(player, tier) {
  const base = Number(tier?.sign) || 0;
  const comedy = Number(player?.drag?.comedy);
  const funny = (Number.isFinite(comedy) ? comedy : 5) / 10;
  if (base >= 0) return Math.round((base + funny * 0.5) * 100) / 100;
  /* Shade. `charm` runs 0..1: at the top the room is delighted and it swings
     positive, at the bottom it is what the tier always said it was. */
  const licence = SHARP.has(player?.archetype || '') ? 0.2 : 0;
  const charm = Math.max(0, Math.min(1, funny * 0.8 + licence));
  return Math.round((base + charm * 2) * 100) / 100;
}

/**
 * How likely she is to reach for a camera at all.
 *
 * Boldness talks; a queen who keeps her head down mostly does not. Kept
 * shallow on purpose — this decides WHO, and the pools decide what, and a
 * stat that reached into both would be the same term counted twice.
 */
export function talksToCamera(player) {
  const b = Number(player?.stats?.boldness);
  return 0.35 + ((Number.isFinite(b) ? b : 5) / 10) * 0.65;
}

/**
 * Which way the scene went, from its own consequences.
 *
 * The bond is the honest answer where there is one. Where there is not — a
 * solo scene, or a pair scene that moved only an edit — the popularity delta
 * stands in, because a scene that cost somebody the room is a cold scene
 * whether or not two queens fell out over it.
 */
export function heatOf(scene) {
  const e = scene?.effects || {};
  const bond = Number(e.bond) || 0;
  if (bond > 0) return 'warm';
  if (bond < 0) return 'cold';
  const pops = Object.values(e.pop || {}).map(Number).filter(Number.isFinite);
  const sum = pops.reduce((t, v) => t + v, 0);
  if (sum > 0) return 'warm';
  if (sum < 0) return 'cold';
  return null;
}

/* BEING IN THE SCENE IS ITSELF A STAKE. A witness with a real tie to one of
   them can outbid a participant, and often should — the queen whose closest
   ally just got read has more to say than the one who did the reading. But
   she starts from behind, because most confessionals on this show come from
   the people it happened to. */
const IN_SCENE = 3;

/**
 * Everybody who could speak about this scene, with the tier each of them
 * would be speaking from and how much they have riding on it.
 *
 * `players[0]` is the actor everywhere in the werk room — `applyWerkScene`
 * reads it as the `a` of both the bond and the pop map — so she is the one
 * who DID it and `players[1]` is the one it was done to.
 *
 * ── STAKE IS WHY A PARTICULAR QUEEN IS THE ONE TALKING ──
 *
 * A witness used to be drawn flat out of the room, so a queen with no
 * relationship to either of them was exactly as likely to speak as the one
 * with everything to say about it — and which of the two she talked about was
 * a coin flip. Both are backwards. `bond` decides both now: how loudly she
 * wants the camera, and which of them she wants it about.
 *
 * The magnitude and not the sign, deliberately. A queen who cannot stand
 * somebody is as motivated as one who loves her; which of those it is belongs
 * to the tier, and the tier is already chosen by what the scene did.
 */
export function candidatesFor(scene, room, bond = () => 0) {
  const who = scene?.players || [];
  const heat = heatOf(scene);
  const tie = (x, y) => Math.abs(Number(bond(x, y)) || 0);
  if (!who.length || !heat) return [];
  if (who.length === 1) {
    return [{ name: who[0], tier: 'alone', about: null, stake: IN_SCENE }];
  }
  const [a, b] = who;
  const between = tie(a, b);
  const out = [
    { name: a, tier: `did-${heat}`, about: b, stake: IN_SCENE + between },
    { name: b, tier: `taken-${heat}`, about: a, stake: IN_SCENE + between },
  ];
  for (const n of room) {
    if (n === a || n === b) continue;
    const da = tie(n, a);
    const db = tie(n, b);
    out.push({
      name: n,
      tier: `watched-${heat}`,
      // Whichever of them she actually has feelings about; a coin flip only
      // when she has no more reason to name one than the other.
      about: rng => (da === db ? (rng() < 0.5 ? a : b) : (da > db ? a : b)),
      stake: Math.max(da, db),
    });
  }
  return out;
}

const pickFrom = (rng, list) => list[Math.floor(rng() * list.length)];

/** Weighted by stake, so the queen with something at issue usually gets it. */
function pickByStake(rng, list) {
  const total = list.reduce((t, c) => t + 1 + (c.stake || 0), 0);
  let roll = rng() * total;
  return list.find(c => (roll -= 1 + (c.stake || 0)) <= 0) || list[list.length - 1];
}

/**
 * The confessionals a slot earned, as werk-room scenes ready to be applied.
 *
 * Returns `{ index, scene }` rows — the index of the scene each one reacts
 * to — so the caller splices rather than this module guessing at the shape of
 * the caller's list.
 *
 * `spoken` is carried across slots by the caller: one confessional per queen
 * per episode, because the same face in the booth twice reads as an edit with
 * a favourite rather than a room with eleven people in it.
 */
export function confessionalsFor({
  scenes = [], room = [], players = {}, rng = Math.random, bond = () => 0,
  spoken = new Set(), max = 2, chance = 0.25, slot = null,
} = {}) {
  const out = [];
  const P = n => players[n] || {};
  let lastWasOne = false;

  for (const [i, sc] of scenes.entries()) {
    if (out.length >= max) break;
    /* NEVER TWICE IN A ROW. Two camera frames stacked stop being a cutaway
       and become the room, which is the opposite of what the shot is for. */
    if (lastWasOne) { lastWasOne = false; continue; }
    if (rng() >= chance) continue;

    const eligible = candidatesFor(sc, room, bond).filter(c => {
      if (spoken.has(c.name)) return false;
      const t = confessionalTier(c.tier);
      if (!t || !t.lines.length) return false;   // unwritten emits nothing
      /* SHADE IS ROLLED, NOT PERMITTED. See edgeFor. `c.about` is who the
         line is about, so a queen is measured against the queen she would be
         talking about rather than against the room in general. */
      if (SHADE.has(c.tier)) {
        const target = typeof c.about === 'string' ? c.about : null;
        if (rng() >= edgeFor(P(c.name), target ? bond(c.name, target) : 0)) return false;
      } else if (COLD.has(c.tier) === false && c.tier !== 'alone') {
        /* AND SO IS WARMTH. A villain is not incapable of a generous read,
           she just gives fewer of them than a hero does -- which is the same
           statement from the other end and was not modelled at all. */
        const target = typeof c.about === 'string' ? c.about : null;
        const edge = edgeFor(P(c.name), target ? bond(c.name, target) : 0);
        if (rng() < (edge - 0.5) * 0.6) return false;
      }
      return rng() < talksToCamera(P(c.name));
    });
    if (!eligible.length) continue;

    const cand = pickByStake(rng, eligible);
    const t = confessionalTier(cand.tier);
    const about = typeof cand.about === 'function' ? cand.about(rng) : cand.about;
    /* ── A LINE THAT NAMES SOMEBODY WHO IS NOT THERE IS NOT USABLE ──
       `alone` follows a scene with nobody else in it, so `{b}` has nothing to
       be. Substituting the empty string produced "Q9 looks at the camera
       about ." — a sentence with a hole in it, on the screen, in her voice.
       Filtered rather than thrown: a writer putting {b} in the wrong pool
       should cost that line and not the episode. */
    const usable = about ? t.lines : t.lines.filter(l => !/\{b\}/.test(String(l)));
    if (!usable.length) continue;
    const line = pickFrom(rng, usable);

    out.push({
      index: i,
      scene: {
        id: `confessional-${cand.tier}`,
        slot: slot || sc.slot || null,
        confessional: true,
        /* ONE NAME ON THE CARD. She is alone in the shot, so the card must
           draw one portrait — `about` is who she is TALKING about and rides
           in the data rather than in `players`, or the screen grows a second
           face into a confessional and it stops being one. */
        players: [cand.name],
        about,
        tier: cand.tier,
        reactsTo: sc.id || null,
        note: t.note,
        // What it costs her depends on WHO GAVE IT. See editSwing.
        effects: { pop: { a: editSwing(P(cand.name), t) } },
        text: String(line)
          .replace(/\{a\}/g, cand.name)
          .replace(/\{b\}/g, about || ''),
      },
    });
    spoken.add(cand.name);
    lastWasOne = true;
  }
  return out;
}

/** Splice the rows from `confessionalsFor` into the list they came from. */
export function withConfessionals(scenes, rows) {
  if (!rows || !rows.length) return scenes;
  const byIndex = new Map(rows.map(r => [r.index, r.scene]));
  const out = [];
  for (const [i, sc] of scenes.entries()) {
    out.push(sc);
    const c = byIndex.get(i);
    if (c) out.push(c);
  }
  return out;
}

void CONFESSIONAL_TIERS;
