// ══════════════════════════════════════════════════════════════════════
// vp-tr/sfx.js — the sound of each Traitors moment
// ══════════════════════════════════════════════════════════════════════
//
// Every castle screen reveals one beat at a time. When a beat appears, this
// looks at what it IS — a slate, a turned cup, the chair, the card turning
// over, the wax — and plays that moment's sound (the voices are synthesised
// in js/audio.js, `tr-*`). Reading the beat's own markup and phase rather than
// keeping a second list of beats means a beat can never play the wrong sound
// for what is on the screen. Only on a click: Reveal all and a fresh paint are
// silent, the same rule every other screen's stings follow.
//
// The music beds are a separate job (files, when the user has them).

function audio() {
  return typeof window !== 'undefined' && window.audio && typeof window.audio.sfx === 'function'
    ? window.audio : null;
}
/** Plays one cue now, or after `ms`. Never throws. */
export function trPlay(name, ms = 0) {
  const a = audio();
  if (!a) return;
  const go = () => { try { a.sfx(name); } catch (e) { /* sound must never break a screen */ } };
  if (ms > 0) setTimeout(go, ms); else go();
}
/** One chalk stroke per letter, in time with the letters appearing. */
export function trChalk(letters, startMs, perMs) {
  for (let i = 0; i < letters; i++) trPlay('tr-chalk', startMs + i * perMs);
}

// What each screen's beats sound like, read off the revealed element.
const RULES = {
  // THE ROUND TABLE
  rt(el, phase) {
    const slate = el.querySelector('.rt-slate');
    if (slate) {
      trPlay('tr-slate');
      trChalk(el.querySelectorAll('.rt-slate-name span').length, 550, 130);
      return;
    }
    const reveal = el.querySelector('.rt-reveal-face');
    if (reveal) {
      trPlay(reveal.getAttribute('data-side') === 'traitor' ? 'tr-traitor' : 'tr-faithful', 420);
      return;
    }
    if (el.querySelector('.rt-verdict')) { trPlay('tr-chair'); return; }
    if (el.querySelector('.rt-tally')) { trPlay('tr-drum'); return; }
    if (phase === 'tie') trPlay('tr-heartbeat');
  },
  // BREAKFAST
  co(el, phase) {
    if (el.querySelector('.co-gap')) { trPlay('tr-cup'); return; }
    if (el.querySelector('.co-frame')) { trPlay('tr-frame-drop', 250); return; }
    if (el.querySelector('.co-hold')) { trPlay('tr-heartbeat'); return; }
    if (phase === 'down' || el.querySelector('.co-row')) trPlay('tr-footsteps');
  },
  // THE CONCLAVE
  cv(el, phase, idx) {
    // The first beat is on screen before any click, so the door opens on the
    // first one a click reveals: the pact coming in.
    if (idx === 1 && phase === 'gather') { trPlay('tr-door'); return; }
    if (el.querySelector('.cv-letter')) { trPlay('tr-quill'); trPlay('tr-wax', 1300); return; }
    if (phase === 'overrule') { trPlay('tr-strike'); return; }
    if (el.querySelector('.cv-tally')) trPlay('tr-quill');
  },
  // THE MISSION
  mi(el, phase) {
    if (phase === 'count') trPlay('tr-coins');
  },
  // THE SELECTION
  tp(el, phase) {
    if (phase === 'blindfold') trPlay('tr-hush');
    else if (phase === 'walk') trPlay('tr-tap');
    else if (phase === 'turret') trPlay('tr-door');
    else if (phase === 'unmask') trPlay('tr-traitor');
  },
  // THE ARRIVAL
  ar(el, phase) {
    if (phase === 'drive') trPlay('tr-gravel');
    else if (phase === 'line') trPlay('tr-footsteps');
  },
  // THE ENDGAME
  lt(el, phase) {
    if (phase === 'open') trPlay('tr-toll');
    else if (phase === 'vote') trPlay('tr-heartbeat');
    else if (phase === 'count') trPlay('tr-drum');
    else if (phase === 'unmask') trPlay('tr-chair');
    else if (phase === 'money') trPlay('tr-coins');
  },
  // THE OFFER
  nt(el, phase) {
    if (phase === 'approach') trPlay('tr-footsteps');
    else if (phase === 'ask') trPlay('tr-letter');
    else if (phase === 'answer') trPlay('tr-wax');
  },
  // THE ARMOURY
  am(el, phase, idx) {
    if (idx === 1) trPlay('tr-clang');
  },
};

/**
 * Called by a screen's RevealNext with its prefix ('rt', 'co', …), the
 * suffix its step ids carry, and the index just revealed.
 */
export function trSfxReveal(prefix, suffix, idx) {
  if (typeof document === 'undefined' || !audio()) return;
  const rule = RULES[prefix];
  if (!rule) return;
  const el = document.getElementById(prefix + '-step-' + suffix + '-' + idx);
  if (!el) return;
  try { rule(el, el.getAttribute('data-phase') || '', idx); } catch (e) { /* never break a reveal */ }
}
