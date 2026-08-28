// ══════════════════════════════════════════════════════════════════════
// vp-tr/conclave.js — the signature screen, and the language for the rest
// ══════════════════════════════════════════════════════════════════════
//
// This reproduces `mockup-tr-conclave.html`, which is the approved visual
// target and is kept in the repo for exactly that reason. Grid, fonts,
// portrait treatment, icon set, sidebar, card physics and ambient effects all
// come from there; if this stops matching it, this is what is wrong.
//
// FOUR THINGS IT IS DELIBERATE ABOUT, carried over from the mockup:
//
//   0. IT IS A CHAPTER CARD, NOT A PAGE HEADER. Three lit planes with aerial
//      perspective, a vignette that bites, volumetric light with dust in it,
//      film grain over the frame. The material work is SVG filters —
//      feTurbulence, feDisplacementMap, feGaussianBlur — which nothing else in
//      this repo uses, and that is what stops the conclave reading as a
//      recolour of get-a-clue, houston or super-hero-ld.
//   1. PEOPLE ARE FACES, OBJECTS ARE ICONS. `_av()` renders a portrait,
//      `_icon()` is for things only. A missing portrait falls back to initials
//      in the same arched niche: the roster is incomplete, so that is the
//      normal path and not the error path.
//   2. THE HOST IS A VARIABLE. Not one narration string in this file contains
//      a host's name. Every line she speaks and the face she wears resolve
//      from `_host()`, which reads `seasonConfig.host` against
//      HOSTS_BY_FORMAT['traitors'] (js/quick-setup.js). Hardcoding a host name
//      into copy is this project's central bug class.
//   3. NO EMOJI. Every icon is a hand-drawn inline SVG.
//
// ── THE OBSERVER CONTRACT (spec §9.1), AND WHY IT IS THE FIRST THING ──
//
// Every builder here takes `rpBuild*(ep, observer)`. Three layers have to be
// renderable: what a given player knows, what the Faithfuls collectively
// believe, and what is true. `observer` is `'audience'` today and
// `'player:<Name>'` tomorrow, and this is the screen where the difference is
// not cosmetic: THE CONCLAVE IS THE SHOW'S CENTRAL SECRET. The audience is
// shown it. A player is shown it only if they were standing in the room.
//
// The conclave's ballots ride on the same `votes[]` as the Round Table's,
// distinguished only by `channel` — js/shows.js declares the format's private
// channel — and Plan 7 found js/social/archive.js iterating them unfiltered
// and publishing five nights of the turret as public "Accusation" events. So
// the withheld render below is a DIFFERENT BRANCH that never touches the
// meeting at all, rather than the same branch with the names blanked out. A
// blanking pass is one edit away from leaking; a branch that never receives
// the data cannot leak whatever anybody does to it later.
//
// ── AND NOTHING HERE WRITES AN EXIT VERB AS A LITERAL ──
//
// This show has TWO ways of leaving and both come from the registry through
// `exitVerbs()`. Printing one over the other — or printing either as a literal
// a registry change cannot reach — is the bug tests/show-vocabulary.test.js
// exists for, one clause further in.
import { seasonConfig, players } from '../core.js';
import { pronouns } from '../players.js';
import { exitVerbs } from '../shows.js';
import { HOSTS_BY_FORMAT } from '../quick-setup.js';
import { CONCLAVE_CSS } from './style.js';
import { _noiseTile, _filterBank, _buildFar, _buildMid, _buildFore,
  _buildHeroScene, _doorway } from './scenery.js';

/** The show's own words for a departure. Never written out below. */
function _verbs() {
  const [banish, murder] = exitVerbs('traitors');
  return { banish: banish || 'out', murder: murder || banish || 'out' };
}
const _cap = s => String(s || '').charAt(0).toUpperCase() + String(s || '').slice(1);

// ── deterministic picking ─────────────────────────────────────────────
//
// A screen must redraw identically every time it is opened — it is rebuilt on
// every paint and on every reveal — so nothing here draws from Math.random. A
// hash over the facts of the beat picks the variant instead: the same night
// says the same sentence, a different night says a different one.
function _hash(s) {
  let h = 2166136261;
  const str = String(s);
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function _pick(pool, key) {
  if (!pool || !pool.length) return '';
  return pool[_hash(key) % pool.length];
}
const _esc = s => String(s == null ? '' : s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** `{t}`/`{T}` target, `{a}` arguer, `{sub}`/`{obj}`/`{pos}` the target's. */
function _fill(tpl, subs) {
  return String(tpl || '').replace(/\{(\w+)\}/g, (m, k) =>
    (subs && subs[k] != null) ? subs[k] : m);
}

// ── the host ──────────────────────────────────────────────────────────
function _host() {
  const list = HOSTS_BY_FORMAT.traitors || [];
  const want = seasonConfig && seasonConfig.host;
  const hit = list.find(h => h.value === want) || list[0]
    || { value: 'host', label: 'Your host' };
  return { name: hit.label, slug: String(hit.value).toLowerCase().replace(/[^a-z0-9]+/g, '-') };
}

// ── portraits ─────────────────────────────────────────────────────────
function _slugOf(name) {
  const p = (players || []).find(x => x && x.name === name);
  return (p && p.slug) || String(name || '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}
function _initials(name) {
  return String(name || '?').split(/\s+/).map(w => w.charAt(0)).join('').slice(0, 2).toUpperCase();
}
/**
 * THE NEUTRAL PORTRAIT. No atmosphere baked in.
 *
 * The niche, the picture, and the initials in the same niche when the file is
 * missing. That is all. The lantern's rim-light, the shadow side and the hood
 * shading are `cv-lit`, which is the CONCLAVE'S treatment and belongs to the
 * screen rather than to the helper: the Round Table, the cold open, house
 * status, the mission, recruitment and the endgame are not a dark room lit by
 * one lamp, and a portrait that arrived pre-darkened would look broken on all
 * six of them. Tasks 2-5 call this and light it their own way, or not at all.
 *
 * `opts.lit` asks for the turret treatment; `opts.tone` ('dim' | 'hot') grades
 * it, and only means anything alongside it.
 */
export function _portrait(slug, name, size, opts) {
  const s = size || 40;
  const o = opts || {};
  return '<span class="cv-av' + (o.lit ? ' cv-lit' : '') + '"'
    + ' style="width:' + s + 'px;height:' + s + 'px"'
    + (o.lit && o.tone ? ' data-lit="' + o.tone + '"' : '') + '>'
    + '<span class="cv-av-ini" style="font-size:' + Math.max(9, Math.round(s * 0.34)) + 'px">'
    + _esc(_initials(name)) + '</span>'
    + '<img src="assets/avatars/' + _esc(slug) + '.png" alt="" onerror="this.remove()">'
    + '</span>';
}

// Everything on THIS screen is standing in the turret, so this screen's own
// two wrappers ask for the lamp. Nothing else has to.
function _av(name, size, tone) {
  return _portrait(_slugOf(name), name, size, { lit: true, tone: tone || null });
}
function _hostAv(size) {
  const h = _host();
  return _portrait(h.slug, h.name, size || 46, { lit: true });
}

// ══════════════════════════════════════════════════════════════════════
// ICONS — objects only, hand-drawn SVG, no emoji
// ══════════════════════════════════════════════════════════════════════
//
// The `seal` is the show's sigil and is meant to be reused on every later
// screen: an open eye pressed into wax, drawn as a lit dome with a specular
// highlight, a bevel where it squeezed out under the matrix, and the eye cut
// in below the surface rather than sitting on top of it.
let _uidN = 0;
export function _icon(type, size, colour) {
  const s = size || 16, c = colour || 'currentColor';
  const u = 'x' + (++_uidN);
  const open = '<svg class="cv-ic" width="' + s + '" height="' + s
    + '" viewBox="0 0 24 24" fill="none" aria-hidden="true">';
  const m = {
    cloak: '<path d="M12 2.4c-4.1 0-6.5 3.1-6.5 6.9 0 2 .7 3.5 1.4 4.5L3.4 21.8h17.2L17.1 13.8c.7-1 1.4-2.5 1.4-4.5 0-3.8-2.4-6.9-6.5-6.9z" fill="' + c + '" opacity=".92"/>'
      + '<ellipse cx="12" cy="9.3" rx="3" ry="3.9" fill="#05060a"/>'
      + '<path d="M8.6 21.8 12 14l3.4 7.8" stroke="#05060a" stroke-width=".9" opacity=".5"/>',
    lantern: '<path d="M8.4 5.6c0-2.6 7.2-2.6 7.2 0" stroke="' + c + '" stroke-width="1.2"/>'
      + '<rect x="5.6" y="5.4" width="12.8" height="1.8" fill="' + c + '"/>'
      + '<path d="M6.8 7.2h10.4v11.4H6.8z" stroke="' + c + '" stroke-width="1.2" fill="rgba(255,219,149,.16)"/>'
      + '<rect x="5.6" y="18.4" width="12.8" height="1.8" fill="' + c + '"/>'
      + '<path class="cv-flame" d="M12 9.6c1.7 1.9 2.6 3 2.6 4.4a2.6 2.6 0 0 1-5.2 0c0-1.4.9-2.5 2.6-4.4z" fill="#ffdb95"/>',
    flame: '<path class="cv-flame" d="M12 2.6c3.4 3.9 5.3 6.2 5.3 9.2a5.3 5.3 0 0 1-10.6 0c0-3 1.9-5.3 5.3-9.2z" fill="' + c + '"/>'
      + '<path d="M12 11c1.4 1.7 2.2 2.6 2.2 3.9a2.2 2.2 0 0 1-4.4 0c0-1.3.8-2.2 2.2-3.9z" fill="#07080b" opacity=".45"/>',
    seal: '<defs>'
      + '<radialGradient id="sd' + u + '" cx="34%" cy="26%" r="82%">'
      + '<stop offset="0%" stop-color="#e2515f"/><stop offset="26%" stop-color="#b32633"/>'
      + '<stop offset="72%" stop-color="#75121e"/><stop offset="100%" stop-color="#3d0710"/>'
      + '</radialGradient>'
      + '<radialGradient id="sp' + u + '" cx="50%" cy="50%" r="50%">'
      + '<stop offset="0%" stop-color="#ffd9c8" stop-opacity=".9"/>'
      + '<stop offset="100%" stop-color="#ff9c8a" stop-opacity="0"/>'
      + '</radialGradient></defs>'
      + '<path d="M12 .9c2.4 0 3.6 1.7 5.5 2.5 2 .8 4.1.4 5 2.3.9 1.8-.3 3.5-.3 5.8s1.2 4 .3 5.8c-.9 1.9-3 1.5-5 2.3-1.9.8-3.1 2.5-5.5 2.5s-3.6-1.7-5.5-2.5c-2-.8-4.1-.4-5-2.3-.9-1.8.3-3.5.3-5.8S1.1 7.5.2 5.7c.9-1.9 3-1.5 5-2.3C7.1 2.6 8.3.9 12 .9z" fill="#4a0a13" opacity=".85"/>'
      + '<path d="M12 1.6c2.2 0 3.3 1.5 5 2.2 1.8.7 3.7.4 4.5 2 .8 1.7-.3 3.2-.3 5.3s1.1 3.6.3 5.3c-.8 1.6-2.7 1.3-4.5 2-1.7.7-2.8 2.2-5 2.2s-3.3-1.5-5-2.2c-1.8-.7-3.7-.4-4.5-2-.8-1.7.3-3.2.3-5.3S1.7 5.5 2.5 3.8c.8-1.6 2.7-1.3 4.5-2C8.7 3.1 9.8 1.6 12 1.6z" fill="url(#sd' + u + ')"/>'
      + '<path d="M5.5 11.2c3-3.5 10-3.5 13 0-3 3.5-10 3.5-13 0z" fill="#2c0409" opacity=".95"/>'
      + '<path d="M5.5 11.2c3 3.5 10 3.5 13 0" fill="none" stroke="rgba(255,180,160,.45)" stroke-width=".5"/>'
      + '<circle cx="12" cy="11.2" r="2.3" fill="#180205"/>'
      + '<circle cx="11.3" cy="10.4" r=".62" fill="rgba(255,214,196,.55)"/>'
      + '<ellipse cx="9" cy="5.6" rx="4.1" ry="2.6" fill="url(#sp' + u + ')"/>',
    quill: '<path d="M20.6 2.6c-8.6 1-13.4 5.7-14.3 12.4l-1.9 4.7 4.8-1.9c6.7-.9 11.4-5.7 12.4-14.3z" fill="' + c + '" opacity=".9"/>'
      + '<path d="M4.4 19.7 11.6 12" stroke="#05060a" stroke-width="1.1"/>',
    dagger: '<path d="M12 1.6 15 9.6 12 17.6 9 9.6z" fill="' + c + '"/>'
      + '<rect x="5.8" y="9.6" width="12.4" height="1.8" fill="' + c + '"/>'
      + '<rect x="11.1" y="11.4" width="1.8" height="7.2" fill="' + c + '"/>'
      + '<circle cx="12" cy="20.2" r="1.9" fill="' + c + '"/>',
    chair: '<path d="M6.6 2.6h10.8v10.2H6.6z" stroke="' + c + '" stroke-width="1.3"/>'
      + '<rect x="4.6" y="12.8" width="14.8" height="2" fill="' + c + '"/>'
      + '<path d="M6.4 14.8v6.6M17.6 14.8v6.6" stroke="' + c + '" stroke-width="1.3"/>',
    hourglass: '<path d="M6 2.6h12M6 21.4h12" stroke="' + c + '" stroke-width="1.4"/>'
      + '<path d="M7.4 2.6c0 5 4.6 5.8 4.6 9.4s-4.6 4.4-4.6 9.4M16.6 2.6c0 5-4.6 5.8-4.6 9.4s4.6 4.4 4.6 9.4" stroke="' + c + '" stroke-width="1.4"/>'
      + '<path d="M9.4 17.4c0-1.9 5.2-1.9 5.2 0l.7 2.6H8.7z" fill="' + c + '" opacity=".8"/>',
    cards: '<rect x="2.6" y="6" width="9.6" height="13.4" rx="1.2" transform="rotate(-12 7.4 12.7)" stroke="' + c + '" stroke-width="1.3" fill="rgba(255,219,149,.1)"/>'
      + '<rect x="11.4" y="4.8" width="9.6" height="13.4" rx="1.2" transform="rotate(9 16.2 11.5)" stroke="' + c + '" stroke-width="1.3" fill="rgba(255,219,149,.1)"/>'
      + '<path d="M16.2 8.6c1.7 1.6 2.6 2.4 2.6 3.5a2.6 2.6 0 0 1-5.2 0c0-1.1.9-1.9 2.6-3.5z" fill="' + c + '"/>',
    door: '<path d="M4.4 21.4V10a7.6 7.6 0 0 1 15.2 0v11.4z" stroke="' + c + '" stroke-width="1.4" fill="rgba(255,219,149,.06)"/>'
      + '<circle cx="16" cy="13.6" r="1.1" fill="' + c + '"/>'
      + '<path d="M12 2.4v19" stroke="' + c + '" stroke-width=".9" opacity=".5"/>',
    letter: '<rect x="2.6" y="5.4" width="18.8" height="13.2" stroke="' + c + '" stroke-width="1.3" fill="rgba(230,219,191,.1)"/>'
      + '<path d="m2.6 5.4 9.4 7.4 9.4-7.4" stroke="' + c + '" stroke-width="1.3"/>'
      + '<circle cx="12" cy="16.4" r="2.4" fill="#a8202c"/>',
    eye: '<path d="M1.6 12C4.8 7.4 8.2 5.2 12 5.2S19.2 7.4 22.4 12c-3.2 4.6-6.6 6.8-10.4 6.8S4.8 16.6 1.6 12z" stroke="' + c + '" stroke-width="1.3"/>'
      + '<circle cx="12" cy="12" r="3.1" fill="' + c + '"/>',
    arch: '<path d="M3.4 21V11a8.6 8.6 0 0 1 17.2 0v10" stroke="' + c + '" stroke-width="1.3"/>'
      + '<path d="M3.4 21h17.2" stroke="' + c + '" stroke-width="1.3"/>',
    coffer: '<path d="M3 9.4 12 4.6l9 4.8v9.2c0 .7-.6 1.2-1.3 1.2H4.3c-.7 0-1.3-.5-1.3-1.2z" stroke="' + c + '" stroke-width="1.3"/>'
      + '<path d="M3 9.4h18" stroke="' + c + '" stroke-width="1.3"/>'
      + '<rect x="10.4" y="12" width="3.2" height="4.4" fill="' + c + '"/>',
    shield: '<path d="M12 2.4 20.2 5.4v6c0 4.9-3.5 8.3-8.2 10.2C7.3 19.7 3.8 16.3 3.8 11.4v-6z" stroke="' + c + '" stroke-width="1.4" fill="rgba(224,160,73,.07)"/>'
      + '<path d="M8.4 11.8 11 14.4l4.8-4.8" stroke="' + c + '" stroke-width="1.5" stroke-linecap="round"/>',
    aperture: '<circle cx="12" cy="12" r="9.2" stroke="' + c + '" stroke-width="1.3"/>'
      + '<path d="M12 2.8 12 12l8 4.6M12 12 4 16.6" stroke="' + c + '" stroke-width="1.1"/>'
      + '<circle cx="12" cy="12" r="2.4" fill="' + c + '"/>',
    chevron: '<path d="M9 5.4 16 12l-7 6.6" stroke="' + c + '" stroke-width="1.8" stroke-linecap="round"/>',
  };
  return open + (m[type] || '') + '</svg>';
}

/** A cloak with the player's face in the hood — the one place on the screen a
 *  portrait and an SVG figure are composited together. */
function _cloakFigure(tone, name) {
  const body = tone === 'nervy' ? '#453b4d' : (tone === 'cold' ? '#26303e' : '#352b33');
  const id = 'cvClk' + (++_uidN);
  const svg = '<svg width="86" height="104" viewBox="0 0 86 104" fill="none" aria-hidden="true">'
    + '<defs><linearGradient id="' + id + '" x1="0.1" y1="0" x2="0.9" y2="1">'
    + '<stop offset="0%" stop-color="' + body + '"/><stop offset="38%" stop-color="' + body + '" stop-opacity=".82"/>'
    + '<stop offset="100%" stop-color="#05070c"/></linearGradient>'
    + '<linearGradient id="' + id + 'R" x1="0" y1="0" x2="1" y2="0">'
    + '<stop offset="0%" stop-color="rgba(255,219,149,.55)"/><stop offset="100%" stop-color="rgba(255,219,149,0)"/>'
    + '</linearGradient></defs>'
    + '<path d="M43 6c-15 0-23.5 11.2-23.5 25 0 7.2 2.6 12.6 5 16.2L6 100h74L62.5 47.2c2.4-3.6 5-9 5-16.2C67.5 17.2 58 6 43 6z" fill="url(#' + id + ')"/>'
    + '<ellipse cx="43" cy="30" rx="18" ry="20.5" fill="#03050a"/>'
    + '<path d="M43 46 31 100M43 46l12 54M36 52 22 100M50 52l14 48" stroke="#03050a" stroke-width="1.4" opacity=".5"/>'
    + '<path d="M25 33c1.6-9.6 8-16.4 18-16.4" stroke="url(#' + id + 'R)" stroke-width="2.2" fill="none"/>'
    + '<path d="M19.5 33 6.5 99" stroke="url(#' + id + 'R)" stroke-width="1.8" fill="none" opacity=".7"/>'
    + '</svg>';
  return '<span class="cv-cloak-fig">' + svg
    + '<span class="cv-cloak-face">' + _av(name, 34, 'dim') + '</span></span>';
}

// ══════════════════════════════════════════════════════════════════════
// NARRATION
// ══════════════════════════════════════════════════════════════════════
//
// Four variants minimum per category, and every one of them is keyed to a
// reason the ENGINE actually recorded: `formPreference` labels the term that
// carried the pick (`beloved`, `onto-me`, `wasted-decoy`, `convenient`, and
// `forced` for the night the pact is made to name one of its own). The screen
// is not inventing a motive and dressing it — it is saying, in words, the term
// that carried the number.

const CLIMB = [
  'The candles in the long room are still lit when they find reasons to leave it. A cup carried to the kitchen and never brought back. A window that wanted shutting. A goodnight said too early, and one said too late so it would not sound like a pair.',
  'They go up separately and by different routes, which is not caution any more so much as habit. The last one out stops to bank the fire, because leaving it burning would be the kind of small wrong thing somebody remembers in the morning.',
  'It takes eleven minutes for the room downstairs to empty of them, and nobody in it notices, because nobody in it is counting. That is the whole of the trick and it never stops working.',
  'One of them says goodnight loudly. One says nothing at all. Another is already on the stair and has been for a minute, listening to the rest of them not arrive together.',
];
const STAIR = [
  'The west stair is forty-one steps and none of them are even. At the top there is a door with no lock, and it does not need one, because nobody in the castle has ever had a reason to open it.',
  'The stair turns twice and the second turn is where the noise from below stops. After that it is only their own feet, and the wind through a window nobody has bothered to glaze in two hundred years.',
  'There is a lantern kept on the fourth landing and it is always exactly where they left it, which tells them what they need to know about who else uses this staircase.',
  'Cold comes up the stair the wrong way, out of the stone rather than down from the roof. By the top they can see their own breath, and it makes them look, briefly, like people who have been running.',
];
const GREET = [
  'They do not greet each other. There is a way of standing in this room that stands in for it.',
  'Nobody says hello. Hello is for downstairs, and it costs something up here to be reminded of downstairs.',
  'They arrange themselves around the table the same way they did the first night, which nobody has ever mentioned and all of them have noticed.',
  'The door is pushed to rather than shut. It has to be able to be left through quickly, and every one of them knows that without any of them having said it.',
];

/** How a Traitor argues, by the term that actually drove the pick. */
const REASON_LINES = {
  beloved: [
    'Everybody in that castle likes {t}. Affection is the only thing in this place that outvotes suspicion, and by the end of the week it will be pointed at whoever {sub} points at.',
    'Nobody will ever put {t} up. That is not a compliment, it is a problem: a person the room cannot bring itself to touch is a person we have to touch ourselves.',
    'The room carried {t} back across the lawn this afternoon. Ask yourself what that looks like on Friday, and then ask whether we would rather have the answer now or find it out later.',
    'I have nothing against {t}. I have something against being liked that much, this early, by that many of them.',
  ],
  'onto-me': [
    '{T} said my name at that table. Once is a guess. {Sub} did not sound like {sub} was guessing.',
    '{T} has been asking who goes up the west stair after ten. Nobody asks a question twice unless they already have half the answer.',
    'I have been in three conversations this week where {t} was watching me instead of listening to me. That is not paranoia, that is a habit, and habits get written down.',
    '{T} is two questions away. I am not going to sit here and wait to find out which two.',
  ],
  'wasted-decoy': [
    'Half that room already thinks {t} is one of us. I would rather settle it tonight than let it run and turn into something we cannot steer.',
    'The heat is on {t} anyway. Taking {obj} now looks like exactly what the room already believes, and the room believing something is the closest thing to safety we get.',
    '{T} is where all the suspicion in this castle currently lives. I say we spend it while it is still worth something.',
    'Everyone is already pointing at {t}. Let them be right about the wrong person once, and see what it does to their confidence afterwards.',
  ],
  convenient: [
    '{T} is nobody&rsquo;s favourite and nobody&rsquo;s problem. Nobody will look up from breakfast.',
    'There is no argument for {t} and no argument against {obj}, and that is precisely why {sub} costs us the least of anyone at that table.',
    'Pick the name the room has no feeling about. A castle that feels nothing on Tuesday reasons badly on Wednesday.',
    'I am not going to pretend this is clever. {T} is the quiet answer, and a quiet answer buys us another quiet week.',
  ],
  forced: [
    'It is not a choice and we are all going to behave as though it were one. That is the part I mind.',
    'They want a name out of this room and they are going to get one. I would rather it came from me than out of an argument between us.',
    'One of us signs for it. I have decided it is going to be me, so that nobody else has to spend the rest of the season pretending they did not.',
    'There is nothing to argue about here. There is only somebody to sign for it, and it may as well be the person the rest of you will find easiest to resent.',
  ],
};

/** What the audience gets and the room never does: the motive underneath. */
const UNSAID = [
  '{T} has been watching {a} for two days. {A} wants {obj} gone before {sub} says {a}&rsquo;s name out loud, and that reason will never go on a slip.',
  'The argument {a} just made is a good one. It is not the real one. The real one is that {t} was standing close enough last night to hear something {a} thought had been said quietly.',
  '{A} is not frightened of what {t} knows. {A} is frightened of what {t} is about to work out, and that is not a thing you can say to people who are judging you on your nerve.',
  'Everything {a} said about {t} is true. None of it is why. {A} needs this name to be the one that goes, and needs the others never to ask why it came out so fast.',
];

const DIVIDE = [
  'Nobody raises a voice. That is the thing about this room: it is a negotiation between people who cannot afford to be seen leaving it angry.',
  'The argument runs about four minutes and is conducted almost entirely in the pauses.',
  'It is not really a vote. It is a moment where somebody stops talking and somebody else does not, and the room decides it has agreed.',
  'They talk over the lantern rather than across it, which keeps every face half-lit and makes the whole thing look far more civil than it is.',
];
const OVERRULE_TEXT = [
  'It is not a vote so much as a moment when the rest of them stop talking and one does not. {T} stays at the table. {T} stays alive. {L} takes {pos} hand off the slip and does not put it anywhere in particular.',
  '{L} loses it in the space of about nine seconds and does not argue afterwards, which is worse than arguing. {T} will never learn how close this came.',
  'The room moves without anybody declaring that it has. {L} is still speaking when it becomes clear that {pos} name is not the one going on the letter.',
  '{W} does not win the argument so much as outlast it. {L} stops, looks at the slip, and lets go of it &mdash; and {t}, who is asleep, goes on being asleep.',
];
const OVERRULE_KEPT = [
  'The argument is not withdrawn. That is the thing about this room &mdash; nothing said in it can be taken back, and everything said in it is remembered by the other people who will need it later.',
  'Losing an argument up here is not like losing one downstairs. Downstairs it is forgotten by breakfast. Up here it is filed.',
  'Nobody says the word "overruled". Nobody has to. All of them will be able to date this evening from memory in a fortnight.',
  'It costs nothing tonight, which is exactly the kind of debt this castle specialises in.',
];
const LEDGER_LOSS = [
  '{L} has now been overruled by {w} and is keeping the count. {W} knows {sub2} is keeping the count, and has decided that is a problem for a later night.',
  '{L} will do what was decided, and do it well, and will never again offer {w} anything that has not been asked for directly.',
  'Two nights ago they were among the only people in this castle who could speak plainly to one another. Tonight they are two people in a room who agree.',
  '{W} got the name. {L} got a reason, and a reason is the thing still standing at the end, when the names have all run out.',
];
const LEDGER_QUIET = [
  'Nobody was overruled, which sounds like the good outcome and is the one that leaves the fewest handholds. They agreed, and none of them learned anything about the others.',
  'A unanimous room is a room with no story in it, and this pact has now had one of those. They will not get many.',
  'They agree, and the agreeing takes under a minute, and every one of them notices how easy it is becoming.',
  'There is nothing to remember about tonight, which is its own kind of problem: the next disagreement will have no practice behind it.',
];
const NAME_TEXT = [
  'Nobody says the word. Nobody has said the word once in this room all season, and that is not squeamishness, it is craft: a name is a thing you can write down.',
  'The slip goes into the middle of the table and stays there a moment longer than it needs to, because none of them wants to be the one who reaches first.',
  'What is decided is decided in about the time it takes to put a cup down. That is the part the castle would not believe.',
  'It is written in a hand none of them will admit to afterwards, which is a precaution, and a very small confession.',
];
const SEAL_TEXT = [
  'The wax takes about four seconds to soften and less than one to set. Whoever holds the seal presses it harder than is required.',
  'The quill is passed rather than offered. It is not a ceremony; it has simply stopped being possible to do this casually.',
  'Their hand is steady. They are quietly appalled at how steady their hand is.',
  'A drop of wax lands off the paper and onto the table, where it will still be tomorrow, going unremarked by the whole castle.',
];
const PLAIN_SIGHT_TEXT = [
  'There is no climb tonight and no meeting. One of them decided this over other people&rsquo;s conversation, at a table with the plates still on it, and nobody in the room felt the moment pass.',
  'No stair, no lantern, no argument. Just a decision taken in company, held behind an ordinary face for the length of a dinner.',
  'The turret stays empty. What happens instead happens in the middle of everybody, which is the version of this the castle finds hardest to forgive afterwards.',
  'Nobody is overruled tonight because nobody is consulted. It costs the pact nothing, and that is exactly what is wrong with it.',
];

/** Her register: studio authority with a private, arch self-regard. Composed,
 *  precise, plainly delighted by how good this footage is, and never once
 *  unprofessional about it. NOT ONE OF THESE STRINGS NAMES HER. */
const HOST_LINES = {
  open: [
    'The castle is asleep, or believes it is, which for our purposes is the same thing. Some of its guests have found reasons to be elsewhere. I would not dream of interrupting them.',
    'Everybody downstairs has gone up to bed pleased with how the evening went. I do so enjoy the ones who go up smiling.',
    'There is a room at the top of this castle that appears on no plan of it. Three floors below, somebody is banking a fire and thinking about tomorrow.',
    'You will notice how quietly this is done. That is not fear. That is competence, and competence is what makes the rest of it so difficult to watch.',
  ],
  shortlist: [
    'Names go up tonight and only some of them will still be arguable in the morning. Do watch how beautifully polite they are about getting there.',
    'What follows is a negotiation. I would remind you that everybody being negotiated over is currently asleep and has no representation in the matter.',
    'They will each make an excellent case. Only one of those cases is actually about the person it names.',
    'Listen to the reasons rather than the names. The reasons are the only honest thing anybody says in this room.',
  ],
  overrule: [
    'Somebody has just been told no by the only people in the world who could tell them so. They will remember that. The others are relying on them not to.',
    'A losing argument in that room is not a losing argument. It is a receipt, and it is kept.',
    'There it is. Nothing has changed, everything has changed, and not one of them will mention it at breakfast.',
    'I have seen pacts end over less than that, and rather later than they should have.',
  ],
  meanwhile: [
    'Downstairs, somebody spent the whole evening being kind to a person who is upstairs writing their name. That is the programme. I did tell you at the start what it would be, and you watched anyway.',
    'Two rooms, one castle, and only you have been in both of them tonight. Do try to enjoy the advantage.',
    'The castle will find out at first light and will be entirely wrong about who did it. It usually is, for a while.',
    'Somewhere below this, a very pleasant evening is finishing. It is the last one of those for somebody.',
  ],
};

// ══════════════════════════════════════════════════════════════════════
// CARD PRIMITIVES
// ══════════════════════════════════════════════════════════════════════

function _card(title, label, ic, inner) {
  return '<div class="cv-card">'
    + '<div class="cv-card-label">' + _icon(ic, 14) + _esc(label) + '</div>'
    + '<h3 class="cv-card-title">' + _esc(title) + '</h3>'
    + inner + '</div>';
}
function _said(who, line) {
  return '<div class="cv-said">' + _av(who, 46)
    + '<div><div class="cv-said-txt">&ldquo;' + line + '&rdquo;</div>'
    + '<cite>' + _esc(who) + '</cite></div></div>';
}
function _slipBody(s) {
  return '<div class="cv-slip-head">'
    + _av(s.target, 48)
    + '<span class="cv-slip-target">' + _esc(String(s.target).toUpperCase()) + '</span>'
    + '<span class="cv-slip-by">argued by ' + _esc(s.by) + ' ' + _av(s.by, 28) + '</span></div>'
    + '<div class="cv-slip-reason">&ldquo;' + s.reason + '&rdquo;</div>';
}
function _slip(s) {
  return '<div class="cv-slip">' + _slipBody(s)
    + (s.unsaid ? '<div class="cv-unsaid"><b>What they did not say</b>' + s.unsaid + '</div>' : '')
    + '</div>';
}
function _struckSlip(s) {
  return '<div class="cv-slip" data-struck="1">' + _slipBody(s)
    + '<svg class="cv-strike" viewBox="0 0 600 150" preserveAspectRatio="none">'
    + '<line x1="14" y1="18" x2="586" y2="132"/></svg>'
    + '<div class="cv-overruled-stamp">OVERRULED</div></div>';
}
function _tallyRow(name, by, state, txt) {
  const cls = state === 'chosen' ? 'cv-st-chosen' : (state === 'struck' ? 'cv-st-struck' : 'cv-st-open');
  return '<div class="cv-tally-row">' + _av(name, 28)
    + '<span class="cv-tally-name">' + _esc(name)
    + ' <span style="opacity:.4;font-size:11px">&mdash; ' + _esc(by) + '</span></span>'
    + '<span class="cv-tally-state ' + cls + '">' + _esc(txt) + '</span></div>';
}
/** The host band. The ONLY place a host name is written, and it comes from
 *  `_host()`, which resolves the season's configured host. */
function _hostBand(line) {
  return '<div class="cv-host">' + _hostAv(54)
    + '<div><div class="cv-host-name">' + _icon('aperture', 12) + _esc(_host().name) + '</div>'
    + '<div class="cv-host-line">&ldquo;' + line + '&rdquo;</div></div></div>';
}

/** A Traitor's bearing tonight, read off how hard they pushed their own name. */
function _tone(conviction) {
  if (conviction >= 0.6) return 'cold';
  if (conviction <= 0.3) return 'nervy';
  return 'plain';
}
const TONE_NOTE = {
  cold: ['Came up the stair with the name already decided.',
    'Has not once looked uncertain in this room.',
    'Wants this settled before anybody sits down.',
    'Arrived first, and has been standing where the light is.'],
  plain: ['Has an answer, and is prepared to be talked out of it.',
    'Waiting to hear the others before committing to anything.',
    'Reasonable, which up here is a strategy rather than a temperament.',
    'Watching the room more carefully than the argument.'],
  nervy: ['Still flinches at the door.',
    'Checked twice that it had been shut properly.',
    'Has a name, and does not want to be the one who says it first.',
    'Keeps looking at the stair as if the stair might answer.'],
};

/** The target's pronouns, in the keys the pools use. NO `Pos` property. */
function _pr(name) {
  const p = pronouns(name) || {};
  return { sub: p.sub || 'they', Sub: p.Sub || 'They', obj: p.obj || 'them',
    pos: p.posAdj || 'their' };
}

// ══════════════════════════════════════════════════════════════════════
// THE BEATS
// ══════════════════════════════════════════════════════════════════════

/**
 * Everything the screen draws, assembled from the episode record.
 *
 * One beat per element of the stream. `phase` drives the room's temperature
 * and the card's physics; `margin` is the irony gutter, which is the best idea
 * on this screen and most of the reason it was worth building.
 */
function _buildBeats(rec, ep) {
  const beats = [];
  const key = 'tr|' + (rec.ep || 0) + '|' + (rec.target || '');
  const down = (ep && ep.tr && ep.tr.downstairs) || [];
  const argued = rec.argued || [];
  const overruled = rec.overruled || [];
  const plain = rec.variant === 'plain-sight';
  const forced = rec.variant === 'name-your-own';
  // `slot` is the beat's ROLE, and it is what the sidebar gates on. Derived
  // here rather than pattern-matched out of the markup later: a sidebar that
  // greps its own HTML for a Roman numeral goes wrong the first time a title
  // is edited, silently, in the direction of spoiling the ending.
  const push = (phase, html, hostSlot, slot) =>
    beats.push({ phase, html, hostSlot: hostSlot || null, slot: slot || null });

  // ── I. the climb ──
  push('gather', _card(plain ? 'No Climb Tonight' : 'The Climb', 'I. The turret', 'door',
    plain
      ? '<p>' + _pick(PLAIN_SIGHT_TEXT, key + '|plain') + '</p>'
        + (rec.line ? '<p>' + _esc(rec.line) + '</p>' : '')
      : '<p>' + _pick(CLIMB, key + '|climb') + '</p><p>' + _pick(STAIR, key + '|stair') + '</p>'),
  'open', 'climb');

  // ── II. who is up there ──
  const cloaks = (rec.turret || []).map(name => {
    const mine = argued.find(a => a.traitor === name);
    const tone = _tone(mine ? mine.conviction : 0.45);
    return '<div class="cv-cloak" data-state="' + tone + '">' + _cloakFigure(tone, name)
      + '<div class="cv-cloak-name">' + _esc(String(name).toUpperCase()) + '</div>'
      + '<div class="cv-cloak-note">' + _esc(_pick(TONE_NOTE[tone], key + '|tone|' + name))
      + '</div></div>';
  }).join('');
  const chips = '<div class="cv-cost">'
    + '<span class="cv-chip" data-tone="cold">' + _icon('hourglass', 13)
    + (rec.turret || []).length + ' in the cloak</span>'
    + '<span class="cv-chip">' + _icon('shield', 13)
    + (rec.shield
      ? (rec.shield.pactAware ? 'A shield they watched be won' : 'A shield they did not see')
      : 'No shield in play') + '</span></div>';
  push('gather', _card(plain ? 'The Pact, Apart' : 'In the Turret Tonight',
    'II. The cloaks', 'cloak',
    '<p>' + (plain
      ? 'They are in different rooms tonight, and only one of them is deciding anything.'
      : _pick(GREET, key + '|greet')) + '</p>'
    + '<div class="cv-cloaks">' + cloaks + '</div>' + chips), null, 'cloaks');

  // ── III. the arguments, one beat each ──
  argued.forEach((a, i) => {
    const subs = Object.assign({ t: a.target, T: a.target, a: a.traitor, A: a.traitor },
      _pr(a.target));
    const reason = _fill(_pick(REASON_LINES[a.reason] || REASON_LINES.convenient,
      key + '|why|' + a.traitor + '|' + a.target), subs);
    // The unsaid fires on `onto-me` and only there: that is the one label the
    // engine records where the stated argument and the real motive are
    // genuinely different things, and it is the audience's whole privilege.
    const unsaid = a.reason === 'onto-me'
      ? _fill(_pick(UNSAID, key + '|unsaid|' + a.traitor), subs) : null;
    push('argue', _card(
      i === 0 ? 'The Shortlist Opens' : a.traitor + ' Answers',
      'III. The argument', 'quill',
      '<p>' + (i === 0
        ? 'The lantern goes in the middle of the table because it has to go somewhere and nobody wants to be the one holding it.'
        : 'They wait until the last one has finished, which is not the same as agreeing with them.')
      + '</p>' + _slip({ target: a.target, by: a.traitor, reason, unsaid })),
    i === 0 ? 'shortlist' : null, 'argue');
  });

  if (!argued.length) {
    // `name-your-own` argues nothing: one Traitor is handed the choice and the
    // others are made to live with it. That is a different beat, not a missing
    // one, and the screen has to say so rather than skip to the wax.
    push('argue', _card(forced ? 'The Sentence' : 'The Choice', 'III. No argument', 'dagger',
      '<p>' + (rec.line ? _esc(rec.line)
        : 'There is nothing to argue about. There is only somebody to sign for it.') + '</p>'
      + _said(rec.decidedBy || (rec.turret || [])[0] || '',
        _fill(_pick(REASON_LINES.forced, key + '|forced'),
          Object.assign({ t: rec.target, T: rec.target }, _pr(rec.target))))),
    'shortlist', 'argue');
  }

  // ── IV. the room divides ──
  if (argued.length > 1) {
    push('argue', _card('The Table Divides', 'IV. The clash', 'arch',
      '<p>' + _pick(DIVIDE, key + '|divide') + '</p>'
      + '<div class="cv-tally">'
      + argued.map(a => _tallyRow(a.target, a.traitor, 'open',
        a.target === rec.target ? 'On the table' : 'Also named')).join('')
      + '</div>'), null, 'divide');
  }

  // ── V. somebody loses ──
  if (overruled.length) {
    const o = overruled[0];
    const kept = overruled.map(x => x.theirTarget).filter(Boolean)[0] || '';
    push('overrule', _card('The Overrule', 'V. Somebody loses', 'dagger',
      '<p>' + _fill(_pick(OVERRULE_TEXT, key + '|over'), {
        t: kept, T: kept, L: o.loser, W: o.winner, l: o.loser, w: o.winner,
        pos: _pr(o.loser).pos, sub: _pr(kept).sub,
      }) + '</p>'
      + overruled.filter(x => x.theirTarget).map(x => {
        const lost = x.theirTarget;
        const theirReason = (argued.find(a => a.traitor === x.loser) || {}).reason;
        return _struckSlip({
          target: lost, by: x.loser,
          reason: _fill(_pick(REASON_LINES[theirReason] || REASON_LINES.convenient,
            key + '|why|' + x.loser + '|' + lost),
          Object.assign({ t: lost, T: lost, a: x.loser, A: x.loser }, _pr(lost))),
        });
      }).join('')
      + '<p>' + _pick(OVERRULE_KEPT, key + '|kept') + '</p>'),
    'overrule', 'overrule');
  }

  // ── VI. what it cost — prose, never a stat readout ──
  const costLines = [];
  if (overruled.length) {
    const o = overruled[0];
    costLines.push(_fill(_pick(LEDGER_LOSS, key + '|ledger'), {
      l: o.loser, L: o.loser, w: o.winner, W: o.winner, sub2: _pr(o.winner).sub,
    }));
  } else {
    costLines.push(_pick(LEDGER_QUIET, key + '|quiet'));
  }
  if (rec.cost && rec.cost.kind === 'decoy-destroyed') {
    costLines.push('The room was already spending itself on this name. By morning it '
      + 'will have its votes back and will have to start hunting properly, which is the '
      + 'last thing anybody up here wanted.');
  } else if (rec.cost && rec.cost.kind === 'clash-traced' && (rec.cost.blames || []).length) {
    costLines.push('At breakfast the castle will reach first for '
      + _esc(rec.cost.blames.slice(0, 2).join(' and '))
      + ', who made no secret of the bad blood. Whether that reach lands anywhere near '
      + 'the truth is a separate question, and not one the room is equipped to ask.');
  }
  push(overruled.length ? 'overrule' : 'seal',
    _card('What It Cost', 'VI. The price', 'hourglass',
      '<div class="cv-ledger"><span class="cv-ledger-h">What it cost</span>'
      + costLines.map(l => '<p>' + l + '</p>').join('') + '</div>'), null, 'cost');

  // ── VII. the name ──
  push('seal', _card('The Name', 'VII. The decision', 'letter',
    '<div class="cv-tally">'
    + (argued.length
      ? argued.map(a => _tallyRow(a.target, a.traitor,
        a.target === rec.target ? 'chosen' : 'struck',
        a.target === rec.target ? 'Chosen' : 'Overruled')).join('')
      : _tallyRow(rec.target, rec.decidedBy || '', 'chosen', 'Chosen'))
    + '</div>'
    + '<p style="margin-top:16px">' + _pick(NAME_TEXT, key + '|name') + '</p>'), null, 'name');

  // ── VIII. the wax ──
  push('seal', '<div class="cv-card">'
    + '<div class="cv-card-label">' + _icon('seal', 14) + 'VIII. The wax</div>'
    + '<h3 class="cv-card-title">Sealed</h3>'
    + '<p>' + _pick(SEAL_TEXT, key + '|wax') + '</p>'
    + '<div class="cv-letter"><div class="cv-letter-sheet">'
    + '<div class="cv-letter-hand" style="font-size:17px;opacity:.8">Tonight the castle loses</div>'
    + '<div style="margin:14px 0 2px">' + _av(rec.target, 78) + '</div>'
    + '<div class="cv-letter-name">' + _esc(String(rec.target || '').toUpperCase()) + '</div>'
    + '<div class="cv-letter-hand" style="font-size:16px;opacity:.72">&mdash; and will be told so at first light</div>'
    + '</div>'
    + '<span class="cv-shock" aria-hidden="true"></span>'
    + '<div class="cv-seal-slot">' + _icon('seal', 92, '#8f1a26') + '</div>'
    + '</div>'
    + '<div class="cv-cost" style="justify-content:center;margin-top:54px">'
    + '<span class="cv-chip" data-tone="bad">' + _icon('letter', 13)
    + 'One name, ' + (rec.ballots || []).length + ' of '
    + Math.max(1, (rec.turret || []).length) + ' signed</span>'
    + '<span class="cv-chip" data-tone="cold">' + _icon('eye', 13)
    + 'The castle knows nothing</span>'
    + '</div></div>', null, 'seal');

  // ── IX. the other room ──
  const scene = down.find(d => d.note && (d.parties || []).length >= 2) || down[0];
  if (scene) {
    const pair = (scene.parties || []).slice(0, 2);
    push('meanwhile', '<div class="cv-meanwhile"><div class="cv-meanwhile-frame">'
      + '<div class="cv-meanwhile-door" aria-hidden="true">' + _doorway() + '</div>'
      + '<div class="cv-pair">'
      + pair.map((n, i) => (i ? _icon('cards', 34, 'rgba(255,219,149,.75)') : '')
        + '<div>' + _av(n, 74) + '<div class="cv-pair-nm">' + _esc(n) + '</div></div>').join('')
      + '</div>'
      + '<div class="cv-meanwhile-txt">' + _esc(scene.note) + '</div>'
      + (pair.includes(rec.target)
        ? '<div class="cv-meanwhile-txt" style="font-size:17px;opacity:.72">Twenty minutes '
          + 'later, three floors above that conversation, the name in it went onto a letter '
          + 'and the wax was pressed over it.</div>'
        : '<div class="cv-meanwhile-txt" style="font-size:17px;opacity:.72">None of them '
          + 'will hear a thing until first light, and one chair at that breakfast is already '
          + 'spoken for.</div>')
      + '<div class="cv-meanwhile-cold">You are the only one who saw both rooms</div>'
      + '</div></div>', 'meanwhile', 'meanwhile');
  }

  // ── the irony gutter: the castle's minute, beside the turret's ──
  //
  // THE POINT OF IT. A beat in the turret carries, in the left margin, the face
  // of somebody who was downstairs and what they were doing at that minute.
  // `_downstairs` (js/tr/headless.js) has already excluded any scene one of the
  // three was standing in, so a gutter line is never accidentally an alibi.
  //
  // SPARSE, NEVER CYCLED. The first version wrapped — `down[i % down.length]` —
  // so a quiet round printed its one castle scene against half the cards, and
  // two beats four minutes apart said the same sentence. Repetition is the
  // worse failure of the two: it reads as a bug, and this project has spent
  // seven plans on exactly that.
  //
  // So each scene is spent once and the gaps are left standing. An empty gutter
  // minute is honest — the castle WAS quiet — and a gutter that thins out while
  // the turret argues says something true about the night. One scene and eleven
  // beats is one line in the margin, and that is the correct output.
  //
  // The note text is deduped as well as the slot. Two castle threads can put
  // the same line into the same evening, and a repeat is a repeat wherever it
  // came from.
  const ICONS = ['cards', 'flame', 'chair', 'door', 'lantern'];
  const seen = new Set();
  const scenes = down.filter(d => {
    const n = String((d && d.note) || '');
    if (!n || seen.has(n)) return false;
    seen.add(n);
    return true;
  });
  beats.forEach((b, i) => {
    const d = scenes[i] || null;
    const mins = 40 + i * 4;
    b.margin = d ? {
      t: (mins >= 60 ? '23:' : '22:') + String(mins % 60).padStart(2, '0'),
      ic: ICONS[i % ICONS.length],
      who: (d.parties || [])[0] || null,
      m: _esc(d.note),
    } : null;
  });
  return beats;
}

// ══════════════════════════════════════════════════════════════════════
// SIDEBAR — rebuilt by innerHTML replacement on every reveal, gated by idx
// ══════════════════════════════════════════════════════════════════════
//
// It never spoils ahead: every panel asks `idx` what has already been shown
// before it says anything. Its data lives on `window.__trConclave` because a
// <script> tag inside innerHTML does not execute, so the build function is the
// only thing that can put it there.

function _sidebar(state, idx) {
  const rec = state.rec, ep = state.ep, meta = state.meta;
  const V = _verbs();
  const h = _host();
  const sealedAt = meta.sealAt;
  const argueAt = meta.argueAt || [];
  const overAt = meta.overAt;
  let out = '';

  out += '<div class="cv-side-block"><div class="cv-side-h">' + _icon('hourglass', 12)
    + 'Night ' + (rec.ep || ep.num || 1) + '</div>';
  out += '<div class="cv-side-state">'
    + (idx >= sealedAt ? 'LETTER SEALED'
      : idx >= (argueAt.length ? argueAt[0] : 2) ? 'IN SESSION' : 'CONVENING')
    + '</div>';
  out += '<div class="cv-side-host">' + _hostAv(40)
    + '<div><div class="cv-side-host-nm">' + _esc(h.name) + '</div>'
    + '<div class="cv-side-host-rl">Your host, and the only other person awake</div>'
    + '</div></div></div>';

  // who is in the turret
  out += '<div class="cv-side-block"><div class="cv-side-h">' + _icon('cloak', 12)
    + 'In the turret</div>';
  if (idx < 1) {
    out += '<div class="cv-side-pend">They are still on the stairs.</div>';
  } else {
    const loser = (rec.overruled || [])[0];
    for (const n of rec.turret || []) {
      let tag = '';
      if (loser && overAt != null && idx >= overAt && n === loser.loser) tag = 'Overruled';
      else if (n === rec.decidedBy && idx >= sealedAt) tag = 'Carried it';
      out += '<div class="cv-side-row">' + _av(n, 30)
        + '<span class="cv-side-name">' + _esc(n) + '</span>'
        + '<span class="cv-side-tag">' + tag + '</span>'
        + (tag === 'Overruled' ? '<span class="cv-side-note">They are counting.</span>' : '')
        + '</div>';
    }
  }
  out += '</div>';

  // the shortlist, name by name as each is argued
  out += '<div class="cv-side-block"><div class="cv-side-h">' + _icon('quill', 12)
    + 'The shortlist</div>';
  const shown = (rec.argued || []).filter((a, i) =>
    idx >= (argueAt.length > i ? argueAt[i] : 99));
  if (!shown.length) {
    out += '<div class="cv-side-pend">No name has been said aloud.</div>';
  } else {
    for (const a of shown) {
      const chosen = a.target === rec.target;
      const settled = idx >= sealedAt;
      const cls = settled ? (chosen ? 'cv-st-chosen' : 'cv-st-struck') : 'cv-st-open';
      const txt = settled ? (chosen ? 'Chosen' : 'Overruled') : 'Argued';
      out += '<div class="cv-side-row">' + _av(a.target, 30)
        + '<span class="cv-side-name">' + _esc(a.target) + '</span>'
        + '<span class="cv-tally-state ' + cls + '">' + txt + '</span>'
        + '<span class="cv-side-note">' + _esc(a.traitor) + '</span></div>';
    }
  }
  out += '</div>';

  // the pot and the shield, both off the record the engine wrote
  out += '<div class="cv-side-block"><div class="cv-side-h">' + _icon('coffer', 12)
    + 'The pot</div>';
  out += '<div class="cv-pot">&pound;' + Number(rec.pot || 0).toLocaleString('en-GB') + '</div>';
  out += '<div class="cv-pot-sub">Everything the missions have put in it so far, '
    + 'and none of it theirs yet.</div>';
  out += '<div class="cv-side-row" style="margin-top:14px;border-bottom:none">'
    + _icon('shield', 20, 'rgba(224,160,73,.6)')
    + '<span class="cv-side-name">Shield</span>'
    + '<span class="cv-side-tag">' + (rec.shield ? 'Held' : 'None') + '</span>'
    + '<span class="cv-side-note">' + (rec.shield
      ? (rec.shield.pactAware
        ? 'One of them watched it be won, and the room will steer around it.'
        : 'Won where none of them saw it. They may spend the night on a wall.')
      : 'Nobody at that table is out of reach tonight.') + '</span></div>';
  out += '</div>';

  // earlier this evening — the public half of the same night, in the show's
  // own word for it
  if (ep && ep.eliminated) {
    out += '<div class="cv-side-block"><div class="cv-side-h">' + _icon('chair', 12)
      + 'Earlier this evening</div>'
      + '<div class="cv-side-target">' + _av(ep.eliminated, 46)
      + '<div><div class="cv-side-name">' + _esc(ep.eliminated) + '</div>'
      + '<div class="cv-side-host-rl">' + _esc(_cap(V.banish))
      + ' at the table, in front of everybody</div></div></div></div>';
  }

  // the letter
  out += '<div class="cv-side-block"><div class="cv-side-h">' + _icon('letter', 12)
    + 'The letter</div>';
  if (idx >= sealedAt) {
    out += '<div class="cv-side-seal">' + _icon('seal', 52, '#8f1a26')
      + '<div class="cv-side-seal-cap">Sealed</div></div>'
      + '<div class="cv-side-target">' + _av(rec.target, 46)
      + '<div><div class="cv-side-name">' + _esc(rec.target) + '</div>'
      + '<div class="cv-side-host-rl">'
      + (rec.blocked
        ? 'The name did not take. Nobody up here knows that yet.'
        : _esc(_cap(V.murder)) + ' before first light')
      + '</div></div></div>';
  } else {
    out += '<div class="cv-side-pend">The wax is not lit.</div>';
  }
  out += '</div>';
  return out;
}

// ══════════════════════════════════════════════════════════════════════
// REVEAL MACHINERY — DOM-only, never a rebuild
// ══════════════════════════════════════════════════════════════════════
//
// `_reapplyVisibility` loops 0 -> idx on every click, which is what patches a
// stale DOM after a screen switch. Scroll position is saved and restored
// around it: `.rp-main` is the scroller, and a pass over the class list must
// not throw the reader back to the top.

const _tvState = {};
function _key(epNum) { return 'conclave-' + (epNum || 0); }
function _state(epNum, total) {
  const k = _key(epNum);
  if (!_tvState[k]) _tvState[k] = { idx: 0, total };
  _tvState[k].total = total;
  return _tvState[k];
}

function _reapplyVisibility(suffix, upToIdx, total) {
  const scroller = document.querySelector('.rp-main');
  const top = scroller ? scroller.scrollTop : 0;
  for (let i = 0; i < total; i++) {
    const el = document.getElementById('cv-step-' + suffix + '-' + i);
    if (!el) continue;
    if (i <= upToIdx) el.classList.add('cv-vis'); else el.classList.remove('cv-vis');
  }
  const counter = document.getElementById('cv-counter-' + suffix);
  if (counter) counter.textContent = Math.min(upToIdx + 1, total) + ' / ' + total;
  const controls = document.getElementById('cv-controls-' + suffix);
  if (controls) {
    const done = upToIdx >= total - 1;
    controls.querySelectorAll('.cv-btn').forEach(b => b.classList.toggle('cv-dim', done));
  }
  // the room's temperature follows the last revealed beat
  const shell = document.getElementById('cv-shell-' + suffix);
  const last = document.getElementById('cv-step-' + suffix + '-'
    + Math.max(0, Math.min(upToIdx, total - 1)));
  if (shell && last) shell.setAttribute('data-phase', last.getAttribute('data-phase') || 'argue');
  if (scroller) scroller.scrollTop = top;
}

function _updateSidebar(epNum, idx) {
  const el = document.getElementById('cv-sidebar-inner');
  const store = (typeof window !== 'undefined' && window.__trConclave) || {};
  const state = store[epNum];
  if (!el || !state) return;
  el.innerHTML = _sidebar(state, idx);
}

export function trConclaveRevealNext(suffix, total, epNum) {
  const st = _state(epNum, total);
  if (st.idx >= total - 1) return;
  st.idx++;
  _reapplyVisibility(suffix, st.idx, total);
  const el = document.getElementById('cv-step-' + suffix + '-' + st.idx);
  if (el && el.scrollIntoView) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  // The overrule is struck and the wax is PRESSED. Both land on the whole room.
  const phase = el && el.getAttribute('data-phase');
  if (phase === 'seal' || phase === 'overrule') {
    const shell = document.getElementById('cv-shell-' + suffix);
    if (shell) {
      shell.classList.remove('cv-shake');
      void shell.offsetWidth;
      shell.classList.add('cv-shake');
    }
  }
  _updateSidebar(epNum, st.idx);
}

export function trConclaveRevealAll(suffix, total, epNum) {
  const st = _state(epNum, total);
  st.idx = total - 1;
  _reapplyVisibility(suffix, st.idx, total);
  _updateSidebar(epNum, st.idx);
}

// ══════════════════════════════════════════════════════════════════════
// THE OBSERVER CONTRACT
// ══════════════════════════════════════════════════════════════════════

/**
 * Was this observer in the room?
 *
 * `'audience'` always was — that is what the audience is for, and the dramatic
 * irony the whole format runs on depends on it. `'player:<Name>'` was, if and
 * only if that name is on the turret roster for THIS night. Deliberately not
 * "is a Traitor": recruitment means alignment has eras, and somebody recruited
 * tomorrow was not standing in the room tonight.
 *
 * Anything else — an unrecognised observer string — is refused. A screen that
 * defaults to showing the secret when it does not understand the question is
 * the wrong way round.
 */
export function conclaveVisibleTo(rec, observer) {
  const obs = observer == null ? 'audience' : String(observer);
  if (obs === 'audience') return true;
  if (obs.indexOf('player:') !== 0) return false;
  const who = obs.slice('player:'.length);
  return !!(rec && (rec.turret || []).indexOf(who) >= 0);
}

/**
 * What somebody who was not up there is shown.
 *
 * A DIFFERENT BRANCH, not the turret with the names removed. It is handed the
 * observer and NOTHING from the conclave record, so no future edit to this
 * markup can leak a ballot: there is no ballot in scope to leak.
 */
function _shutDoor(observer, css) {
  const who = String(observer || '').slice('player:'.length);
  const h = _host();
  return '<div class="cv-root" data-ambient="tense">' + css
    + '<div class="cv-shell" data-phase="gather">'
    + '<div class="cv-scenery" aria-hidden="true">'
    + '<div class="cv-fore">' + _buildFore() + '</div>'
    + '<div class="cv-vig"></div>'
    + '</div>'
    + '<div class="cv-body">'
    + '<header class="cv-head"><div class="cv-observer">' + _icon('eye', 13)
    + 'Observer: ' + _esc(who || 'a player')
    + ' <em>&mdash; you are being shown only what this player could know</em></div></header>'
    + '<div class="cv-shut">'
    + '<div class="cv-shut-door">' + _icon('door', 104, 'rgba(224,160,73,.42)') + '</div>'
    + '<h2 class="cv-shut-h">The Stair Is Dark</h2>'
    + '<p class="cv-shut-p">There is a door at the top of the west stair, and '
    + _esc(who || 'this player') + ' has never had a reason to open it. Somewhere above '
    + 'this ceiling a decision is being taken that will be a complete surprise in the morning.</p>'
    + '<p class="cv-shut-p">Nothing said in that room reaches this one. Not the names, '
    + 'not the argument, not who lost it.</p>'
    + '<div style="margin-top:26px">' + _hostAv(46) + '</div>'
    + '<div class="cv-shut-cold">' + _esc(h.name) + ' is not going to tell you either</div>'
    + '</div></div></div></div>';
}

// ══════════════════════════════════════════════════════════════════════
// THE SCREEN
// ══════════════════════════════════════════════════════════════════════

/**
 * `rpBuildConclave(ep, observer)` — the signature screen.
 *
 * `ep` is an `episodeHistory` row carrying `tr.conclave`, written by
 * `_recordEpisode` in js/tr/headless.js. `observer` is `'audience'` or
 * `'player:<Name>'`; see `conclaveVisibleTo`.
 */
export function rpBuildConclave(ep, observer = 'audience') {
  const rec = ep && ep.tr && ep.tr.conclave;
  const suffix = 'conclave';
  // The noise tiles are rendered once per build and handed to CSS as custom
  // properties: a live turbulence over the whole shell costs frames on every
  // paint, and a tile costs nothing after the first.
  const vars = '--cv-grain-src:' + _noiseTile('0.9', 4, 11, 0.42, 220) + ';'
    + '--cv-rock-src:' + _noiseTile('0.035 0.09', 5, 5, 0.5, 300) + ';'
    + '--cv-fibre-src:' + _noiseTile('0.7 0.06', 4, 23, 0.32, 180) + ';';
  const css = '<style>' + CONCLAVE_CSS + '</style>';

  // THE WITHHELD BRANCH COMES FIRST, before the record is ever read into a
  // beat. Order is the guard: nothing below this line can leak to an observer
  // who was not in the room, because nothing below this line runs for them.
  if (rec && !conclaveVisibleTo(rec, observer)) return _shutDoor(observer, css);

  const cssOnce = css + _filterBank();

  if (!rec) {
    return '<div class="cv-root" style="' + vars + '" data-ambient="tense">' + cssOnce
      + '<div class="cv-shell" data-phase="gather"><div class="cv-body"><div class="cv-shut">'
      + '<div class="cv-shut-door">' + _icon('lantern', 92, 'rgba(224,160,73,.4)') + '</div>'
      + '<h2 class="cv-shut-h">No Conclave Tonight</h2>'
      + '<p class="cv-shut-p">Nobody climbed the west stair. A night spent making an offer '
      + 'is a night nobody is chosen, whatever the answer turns out to be.</p>'
      + '</div></div></div></div>';
  }

  const beats = _buildBeats(rec, ep);
  const total = beats.length;
  const epNum = ep.num || rec.ep || 0;
  const st = _state(epNum, total);
  if (st.idx > total - 1) st.idx = total - 1;

  // Which beat is which, so the sidebar can gate on it without re-deriving the
  // stream. Built from the beats themselves rather than from a second copy of
  // the ordering rules, which is how two lists start disagreeing.
  const meta = { argueAt: [], overAt: null, sealAt: total - 1 };
  beats.forEach((b, i) => {
    if (b.slot === 'argue') meta.argueAt.push(i);
    if (b.slot === 'overrule') meta.overAt = i;
    if (b.slot === 'seal') meta.sealAt = i;
  });
  const state = { rec, ep, meta };
  // The sidebar's data has to reach the reveal handlers, and a <script> tag in
  // innerHTML does not run — so the build function is the only place that can
  // put it on `window`. Keyed by episode, so two episodes never share a store.
  if (typeof window !== 'undefined') {
    window.__trConclave = window.__trConclave || {};
    window.__trConclave[epNum] = state;
  }

  const observerBadge = '<div class="cv-observer">' + _icon('eye', 13)
    + 'Observer: ' + (observer === 'audience' ? 'audience' : _esc(String(observer).slice(7)))
    + ' <em>&mdash; you are being shown what the castle is not</em></div>';

  // THE FIRST PAINT ALREADY SHOWS WHAT HAS BEEN REVEALED.
  //
  // `.cv-beat` is `height:0` until `.cv-vis` is on it, and `.cv-vis` is only
  // ever added by `_reapplyVisibility`, which only ever runs from a click. A
  // builder emitting the bare class therefore handed back a screen whose entire
  // stream was collapsed until the reader pressed Continue — with the counter
  // beneath it already claiming "1 / 11" — and handed back the same blank page
  // on every later paint to a reader who had already revealed nine beats. The
  // class is baked in here from the state the handlers keep; they still own it
  // from the first click onwards. The Round Table does the same thing and this
  // is the pattern for the screens still to come.
  const stream = beats.map((b, i) =>
    '<div class="cv-beat' + (i <= st.idx ? ' cv-vis' : '')
    + '" id="cv-step-' + suffix + '-' + i + '" data-phase="' + b.phase + '">'
    + (b.hostSlot ? _hostBand(_pick(HOST_LINES[b.hostSlot],
      'tr|host|' + b.hostSlot + '|' + epNum + '|' + rec.target)) : '')
    // A beat with no castle scene of its own gets an EMPTY gutter cell, not a
    // recycled one. The column's rule carries on down the page; the minute is
    // simply blank, because nothing happened in it worth watching.
    + (b.margin
      ? '<div class="cv-margin">'
        + '<span class="cv-margin-ic">' + _icon(b.margin.ic, 14, 'rgba(143,166,194,.55)') + '</span>'
        + '<span class="cv-margin-time">' + b.margin.t + '</span>'
        + (b.margin.who ? '<div class="cv-margin-av">' + _av(b.margin.who, 34, 'dim') + '</div>' : '')
        + '<span class="cv-margin-txt">' + b.margin.m + '</span>'
        + '</div>'
      : '<div class="cv-margin cv-margin-quiet"></div>')
    + '<div>' + b.html + '</div></div>').join('');

  // Inline handlers BAKE their targets — `renderVPScreen` wipes reveal state on
  // every paint and there is no closure to hold them.
  const call = fn => fn + "('" + suffix + "'," + total + ',' + epNum + ')';

  return '<div class="cv-root" style="' + vars + '" data-ambient="tense">' + cssOnce
    + '<div class="cv-shell" id="cv-shell-' + suffix + '" data-phase="' + beats[0].phase + '">'
    // Every plane, the light cone and the dust inside it, and the grain, all
    // inside ONE layer that carries the clip. The shell used to carry it, and
    // a shell with `overflow:hidden` is a scroll container, which silently
    // kills the sticky sidebar it also contains.
    + '<div class="cv-scenery" aria-hidden="true">'
    + '<div class="cv-far">' + _buildFar() + '</div>'
    + '<div class="cv-mid">' + _buildMid(epNum + '|' + rec.target) + '</div>'
    + '<div class="cv-fore">' + _buildFore() + '</div>'
    + '<div class="cv-veil"></div>'
    + '<div class="cv-vig"></div>'
    + '<div class="cv-grain"></div>'
    + '</div>'
    + '<div class="cv-body">'
    + '<div class="cv-hero">' + _buildHeroScene((rec.turret || []).length)
    + '<div class="cv-hero-lock">'
    // TASK 7, WHEN YOU WIRE THE EPISODE HISTORY: this reads "Night 3" rather
    // than the mockup's "Season I  Night III" because the episode record
    // carries no season number, and inventing one would be a fact the screen
    // does not have. If Task 7's `gs.episodeHistory.push` can carry the season
    // (it is writing every other Traitors field there already), put it on the
    // record and this line can say it. Until then it stays a night.
    + '<div class="cv-eyebrow">The Traitors &middot; Night ' + (rec.ep || epNum) + '</div>'
    + '<h1 class="cv-title">THE CONCLAVE</h1>'
    + '<div class="cv-title-rule"><i></i>' + _icon('seal', 44, '#8f1a26') + '<i></i></div>'
    + '<p class="cv-sub">They climb to the turret while the castle sleeps below, and decide, '
    + 'calmly, which of the people they had supper with will not come down to breakfast.</p>'
    + '</div></div>'
    + '<header class="cv-head">' + observerBadge + '</header>'
    + '<div class="cv-grid">'
    + '<main class="cv-main">' + stream + '</main>'
    + '<aside class="cv-side"><div id="cv-sidebar-inner">' + _sidebar(state, st.idx) + '</div></aside>'
    + '</div></div></div>'
    + '<div class="cv-controls" id="cv-controls-' + suffix + '">'
    + '<button class="cv-btn" onclick="' + call('trConclaveRevealNext') + '">'
    + _icon('chevron', 12) + 'Continue</button>'
    + '<span class="cv-counter" id="cv-counter-' + suffix + '">'
    + (st.idx + 1) + ' / ' + total + '</span>'
    + '<button class="cv-btn" onclick="' + call('trConclaveRevealAll') + '">Reveal all</button>'
    + '</div></div>';
}
