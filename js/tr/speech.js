// ══════════════════════════════════════════════════════════════════════
// tr/speech.js — a castle scene is a SCRIPT, and people say their lines in
// their own voice
// ══════════════════════════════════════════════════════════════════════
//
// WHY THIS EXISTS. A castle scene used to be one sentence of narration about
// a conversation — "Geoff has learned not to spend first in here, and Ella did
// not hold it against him" — and a season read end to end was hundreds of
// those, most of them riddles. The user's direction (2026-09-28): real
// conversation mixed with narration, fluent spoken English the way people on
// the real show talk, and many variants that change with the character's
// personality.
//
// A SCENE NOTE IS NOW A SCRIPT: lines joined by "\n".
//
//   narration           plain text. The FIRST line is always narration, and
//                       it is the line everything else quotes (citations,
//                       "How it started", the conclave's margin).
//   Name: "words"       somebody says something out loud.
//   Name (to camera): "words"
//                       a confessional. The only honest form a scene with one
//                       person in it can take, and the show's own.
//
// AND A LINE CAN ASK FOR A VOICE instead of spelling the words:
//
//   {b}: {say:ask-where}              filled from BANK['ask-where'] in {b}'s
//   {a} (to camera): {cam:grief}      register (blunt / sharp / warm /
//   {a}: {say:suspect:{c}}            guarded, js/tr/castle/voice.js), with an
//                                     optional argument that fills {x}.
//
// Banks may carry a `traitor` register as well. A Traitor's OWN lines are
// the one place the castle may know what somebody is — they know what they
// are — and a Faithful line such as "I think it's one of us at this table"
// is false in a Traitor's mouth. Only the speaker's own alignment is read,
// never anybody else's, which is why this file lives in js/tr/ rather than
// js/tr/castle/ (whose belief gate forbids alignment reads outright).
//
// NO RNG. The pick is a hash of the scene and the speaker, walked past the
// lines this (purpose, register) has already spent this season — the same
// draw rule `lineFor` uses — so replays reproduce and no firing table moves.
import { gs } from '../core.js';
import { voiceOf } from './castle/voice.js';
import { BANK } from './speech-bank.js';

function _hash(s) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  return h >>> 0;
}

/** Is this person a Traitor right now? Their OWN alignment only. */
function _isTraitor(name) {
  const eras = gs?.tr?.alignment?.[name];
  const last = Array.isArray(eras) && eras.length ? eras[eras.length - 1] : null;
  // `truth` is a boolean on the era (js/tr/roles.js recordAlignment).
  return !!(last && (last.truth === true || last.truth === 'traitor'));
}

function _usedStore() {
  const tr = gs && gs.tr;
  if (!tr) return null;
  if (!tr._speechUsed) tr._speechUsed = {};
  return tr._speechUsed;
}

/** The lines this speaker may draw for `purpose`, most specific first. */
export function bankFor(purpose, speaker) {
  const b = BANK[purpose];
  if (!b) return null;
  const voice = voiceOf(speaker);
  if (_isTraitor(speaker) && b.traitor) {
    const t = Array.isArray(b.traitor) ? b.traitor : (b.traitor[voice] || b.traitor.any);
    if (t && t.length) return { lines: t, bucket: purpose + '|traitor|' + voice };
  }
  const lines = [...(b[voice] || []), ...(b.any || [])];
  return lines.length ? { lines, bucket: purpose + '|' + voice } : null;
}

function _pick(purpose, speaker, key) {
  const got = bankFor(purpose, speaker);
  if (!got) return null;
  const { lines, bucket } = got;
  const n = lines.length;
  let idx = _hash(key + '|' + speaker + '|' + purpose) % n;
  const store = _usedStore();
  if (store && n > 1 && n <= 31) {
    let mask = store[bucket] || 0;
    let step = 0;
    while (step < n && (mask & (1 << ((idx + step) % n)))) step++;
    if (step >= n) { mask = 0; step = 0; }
    idx = (idx + step) % n;
    store[bucket] = mask | (1 << idx);
  }
  return lines[idx];
}

// `Name: {say:purpose}` or `Name (to camera): {cam:purpose:arg}`, with the
// argument optional and anything after the brace kept (a citation can land on
// the end of the last line).
const SLOT_LINE = /^(.+?)( \(to camera\))?: \{(say|cam):([\w-]+)(?::([^}]*))?\}(.*)$/;

/**
 * Fill every voiced slot in a script. `others` fills `{you}` — the other
 * speaker in the script — so a bank line can address the person it is said
 * to without the frame spelling their name.
 */
export function speakScript(text, { key = '' } = {}) {
  const s = String(text == null ? '' : text);
  if (s.indexOf('{say:') < 0 && s.indexOf('{cam:') < 0) return s;
  const lines = s.split('\n');
  const speakers = lines.map(l => {
    const m = /^([^:\n]{1,40}?)(?: \(to camera\))?: /.exec(l);
    return m ? m[1] : null;
  }).filter(Boolean);
  return lines.map((line, i) => {
    const m = SLOT_LINE.exec(line);
    if (!m) return line;
    const [, who, cam, kind, purpose, arg, rest] = m;
    const you = speakers.find(n => n !== who) || '';
    // `{cam:grief}` reads BANK['cam-grief']; `{say:x}` reads BANK['x'].
    const bank = kind === 'cam' && BANK['cam-' + purpose] ? 'cam-' + purpose : purpose;
    const said0 = _pick(bank, who, key + '|' + i);
    // A spoken line starts with a capital, whatever filled its first slot.
    const said = said0 == null ? null
      : said0.split('{x}').join(arg || '').replace(/^./, c => c.toUpperCase());
    if (said == null) return line;
    // Typographic apostrophes, to match the scripts the banks sit inside.
    const filled = said.split('{you}').join(you).replace(/'/g, '’');
    return who + (cam || '') + ': “' + filled + '”' + rest;
  }).join('\n');
}

/** The first line of a script: the narration everything else quotes. */
export function scriptHead(text) {
  return String(text == null ? '' : text).split('\n')[0];
}
