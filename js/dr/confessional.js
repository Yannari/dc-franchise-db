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

const NEVER = new Set(['hero', 'loyal-soldier', 'social-butterfly', 'showmancer',
  'underdog', 'goat']);
const ALWAYS = new Set(['villain', 'mastermind', 'schemer']);

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

/**
 * Everybody who could speak about this scene, with the tier each of them
 * would be speaking from.
 *
 * `players[0]` is the actor everywhere in the werk room — `applyWerkScene`
 * reads it as the `a` of both the bond and the pop map — so she is the one
 * who DID it and `players[1]` is the one it was done to.
 */
export function candidatesFor(scene, room) {
  const who = scene?.players || [];
  const heat = heatOf(scene);
  if (!who.length || !heat) return [];
  if (who.length === 1) return [{ name: who[0], tier: 'alone', about: null }];
  const [a, b] = who;
  const out = [
    { name: a, tier: `did-${heat}`, about: b },
    { name: b, tier: `taken-${heat}`, about: a },
  ];
  for (const n of room) {
    if (n === a || n === b) continue;
    out.push({ name: n, tier: `watched-${heat}`, about: rng => (rng() < 0.5 ? a : b) });
  }
  return out;
}

const pickFrom = (rng, list) => list[Math.floor(rng() * list.length)];

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
  scenes = [], room = [], players = {}, rng = Math.random,
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

    const eligible = candidatesFor(sc, room).filter(c => {
      if (spoken.has(c.name)) return false;
      const t = confessionalTier(c.tier);
      if (!t || !t.lines.length) return false;   // unwritten emits nothing
      if (SHADE.has(c.tier) && !mayBeShady(P(c.name))) return false;
      return rng() < talksToCamera(P(c.name));
    });
    if (!eligible.length) continue;

    const cand = pickFrom(rng, eligible);
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
        effects: { pop: { a: t.sign } },
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
