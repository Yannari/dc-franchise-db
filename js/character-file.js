// ═════════════════════════════════════════════════════════════════════
// character-file.js — a character sheet as a file, both ways
// ═════════════════════════════════════════════════════════════════════
//
// The user, 2026-10-21: "make it possible to import a sort of txt or json so
// i can fill these out quicker rather than typing 1 case by case".
//
// Create Character (js/studio.js) has an Import and an Export beside Save:
//
//   EXPORT writes the sheet as JSON — every field the editor holds, under the
//   editor's own names. Exporting an empty sheet is the template.
//
//   IMPORT reads that JSON back, a roster row (franchise_roster.json shape), or
//   a plain .txt written by hand:
//
//       Name: Jade Lin
//       Age: 24
//       Pronouns: she/her
//       Archetype: schemer
//       Physical: 6        (or one line — Stats: physical 6, mental 8)
//       Backstory:
//       Youngest of three, and ...   (runs on until the next known label)
//
// A line opens a field only when its label is one this file knows. Anything
// else continues the field above it, so a backstory with "Note: ..." in the
// middle of it stays one backstory.
//
// The file FILLS the sheet; it does not save it. Fields the file does not
// mention keep what the sheet had, and nothing is kept that the editor could
// not have typed itself: an archetype or a stat outside the game's lists is
// reported and skipped (CLAUDE.md: the nine stats and fifteen archetypes are
// the only ones that exist).
//
// Pure: the editor passes its own vocabulary in, so the lists live in one place.

export const FILE_FORMAT = 'dc-character/1';

const TEXT_FIELDS = ['name', 'slug', 'ethnicity', 'nationality', 'descriptor', 'hometown', 'occupation',
  'backstory', 'personality', 'voice', 'speakingVoice', 'continuityNote'];

// Labels a hand-written file may use, lower-cased with spaces and dashes squeezed out.
const ALIASES = {
  name: 'name', fullname: 'name', character: 'name',
  slug: 'slug', id: 'slug',
  age: 'age',
  birthdate: 'birthdate', birthday: 'birthdate', dob: 'birthdate', born: 'birthdate', dateofbirth: 'birthdate',
  gender: 'gender', pronouns: 'gender', pronoun: 'gender',
  sexuality: 'sexuality', orientation: 'sexuality',
  archetype: 'archetype', type: 'archetype',
  ethnicity: 'ethnicity', race: 'ethnicity',
  nationality: 'nationality', country: 'nationality',
  descriptor: 'descriptor', label: 'descriptor', tagline: 'descriptor',
  hometown: 'hometown', from: 'hometown', city: 'hometown',
  occupation: 'occupation', job: 'occupation', work: 'occupation', career: 'occupation',
  backstory: 'backstory', background: 'backstory', history: 'backstory', bio: 'backstory',
  personality: 'personality',
  voice: 'voice', voiceprofile: 'voice', howtheytalk: 'voice',
  speakingvoice: 'speakingVoice', soundslike: 'speakingVoice', tts: 'speakingVoice',
  continuity: 'continuityNote', continuityread: 'continuityNote', continuitynote: 'continuityNote',
  stats: 'stats',
  dragstyle: 'drag.style', style: 'drag.style',
  dragtraits: 'drag.traits', traits: 'drag.traits', signaturetraits: 'drag.traits',
  personavoice: 'drag.voice', dragvoice: 'drag.voice',
};

const squeeze = s => String(s || '').toLowerCase().replace(/[\s_\-.'’]+/g, '');

const GENDER_WORDS = {
  m: ['m', 'male', 'man', 'boy', 'he', 'him', 'hehim', 'he/him', 'masc'],
  f: ['f', 'female', 'woman', 'girl', 'she', 'her', 'sheher', 'she/her', 'fem'],
  nb: ['nb', 'nonbinary', 'non-binary', 'enby', 'they', 'them', 'theythem', 'they/them'],
};
function genderOf(v) {
  const s = String(v || '').toLowerCase().trim();
  const sq = squeeze(s).replace(/\//g, '');
  for (const [g, words] of Object.entries(GENDER_WORDS)) if (words.some(w => w === s || squeeze(w).replace(/\//g, '') === sq)) return g;
  return null;
}

const SEX_WORDS = { bisexual: 'bi', homosexual: 'gay', ace: 'asexual', hetero: 'straight', heterosexual: 'straight', pan: 'queer', pansexual: 'queer' };

/** Read a file's text: JSON when it is JSON, the labelled-lines format otherwise. */
export function parseCharacterText(text) {
  const src = String(text ?? '').replace(/^﻿/, '').trim();
  if (!src) return { raw: {}, kind: 'empty' };
  if (src[0] === '{' || src[0] === '[') {
    let data;
    try { data = JSON.parse(src); } catch (e) { return { raw: {}, kind: 'json', error: `That JSON doesn't read: ${e.message}` }; }
    if (Array.isArray(data)) return { raw: data[0] || {}, kind: 'json', extra: data.length - 1 };
    // A roster file ({ players: [...] }) or one exported from here.
    if (Array.isArray(data?.players)) return { raw: data.players[0] || {}, kind: 'json', extra: data.players.length - 1 };
    return { raw: data && typeof data === 'object' ? data : {}, kind: 'json' };
  }
  return { raw: parseLabelledLines(src), kind: 'text' };
}

/** "Label: value" lines into { field: value }; unknown labels continue the field above. */
export function parseLabelledLines(src, statKeys = [], dragKeys = []) {
  const out = {};
  let cur = null;
  const known = label => {
    const k = squeeze(label);
    if (ALIASES[k]) return ALIASES[k];
    // a stat or a craft stat on a line of its own ("Physical: 7"): any word, checked later
    if (/^[a-z]+$/.test(k) && k.length <= 12) return 'stat:' + k;
    return null;
  };
  for (const line of src.split(/\r?\n/)) {
    const m = /^\s*([A-Za-z][A-Za-z _\-/'’.]{0,30}?)\s*[:=]\s*(.*)$/.exec(line);
    const field = m ? known(m[1]) : null;
    // A lone word with a colon in the middle of prose ("Note: ...") is a stat
    // label only if the value is a number; otherwise the line is prose.
    if (field && !(field.startsWith('stat:') && !/^\s*-?\d+(\.\d+)?\s*(\/\s*10)?\s*$/.test(m[2]))) {
      cur = field;
      out[cur] = m[2].trim();
      continue;
    }
    if (cur && !cur.startsWith('stat:')) out[cur] = out[cur] ? `${out[cur]}\n${line.trim()}` : line.trim();
  }
  for (const k of Object.keys(out)) if (typeof out[k] === 'string') out[k] = out[k].replace(/\n+$/, '').trim();
  return out;
}

const num = v => { const n = Number(String(v ?? '').replace(/\/\s*10\s*$/, '').trim()); return Number.isFinite(n) ? n : null; };
const clampStat = n => Math.max(1, Math.min(10, Math.round(n)));

/**
 * What a parsed file says, in the editor's terms: { fields, stats, drag, ties,
 * interview, kit, avatarDataUri } — only what the file gave and the game
 * accepts — plus `filled` (the labels it set) and `skipped` (what it could not use, and why).
 */
export function normalizeCharacter(raw, vocab) {
  const { archetypes = [], sexes = [], statKeys = [], dragKeys = [], dragStyles = [], dragTraits = [], interviewKeys = [] } = vocab || {};
  const out = { fields: {}, stats: {}, drag: {}, filled: [], skipped: [] };
  const r = raw || {};
  const get = (...keys) => { for (const k of keys) if (r[k] !== undefined && r[k] !== null && r[k] !== '') return r[k]; return undefined; };

  for (const f of TEXT_FIELDS) {
    const v = get(f, f === 'voice' ? 'voiceProfile' : null, f === 'continuityNote' ? 'continuity' : null);
    if (v === undefined) continue;
    if (typeof v !== 'string' && typeof v !== 'number') { out.skipped.push(`${f}: not text`); continue; }
    out.fields[f] = String(v);
    out.filled.push(f);
  }
  if (out.fields.slug !== undefined) out.fields.slug = String(out.fields.slug).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

  const age = get('age');
  if (age !== undefined) {
    const n = num(age);
    if (n != null && n >= 1 && n <= 120) { out.fields.age = String(Math.round(n)); out.filled.push('age'); }
    else out.skipped.push(`age: "${age}" is not an age`);
  }
  const bd = get('birthdate', 'birthday', 'dob');
  if (bd !== undefined) {
    const s = String(bd).trim();
    const iso = /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : (() => { const d = new Date(s); return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10); })();
    if (iso) { out.fields.birthdate = iso; out.filled.push('birthdate'); }
    else out.skipped.push(`birthdate: "${s}" is not a date (use 2001-05-14)`);
  }
  const g = get('gender', 'pronouns');
  if (g !== undefined) {
    const v = genderOf(g);
    if (v) { out.fields.gender = v; out.filled.push('gender'); } else out.skipped.push(`gender: "${g}" (use he/him, she/her or they/them)`);
  }
  const sx = get('sexuality', 'orientation');
  if (sx !== undefined) {
    const s = String(sx).toLowerCase().trim();
    const v = sexes.includes(s) ? s : SEX_WORDS[s];
    if (v) { out.fields.sexuality = v; out.filled.push('sexuality'); } else out.skipped.push(`orientation: "${sx}" (one of ${sexes.join(', ')})`);
  }
  const a = get('archetype');
  if (a !== undefined) {
    const s = String(a).toLowerCase().trim().replace(/[\s_]+/g, '-');
    if (archetypes.includes(s)) { out.fields.archetype = s; out.filled.push('archetype'); }
    else out.skipped.push(`archetype: "${a}" isn't one of the fifteen`);
  }

  // Stats: an object, a "physical 6, mental 8" line, or one label each.
  const statSrc = {};
  const st = get('stats');
  if (st && typeof st === 'object') Object.assign(statSrc, st);
  else if (typeof st === 'string') for (const m of st.matchAll(/([A-Za-z]+)\s*[:=]?\s*(\d+(?:\.\d+)?)/g)) statSrc[m[1].toLowerCase()] = m[2];
  for (const [k, v] of Object.entries(r)) if (k.startsWith('stat:')) statSrc[k.slice(5)] = v;
  for (const k of statKeys) if (r[k] !== undefined && typeof r[k] !== 'object') statSrc[k] = r[k];
  const dragSrc = { ...(r.drag && typeof r.drag === 'object' ? r.drag : {}) };
  for (const [k, v] of Object.entries(statSrc)) {
    const key = k.toLowerCase();
    const n = num(v);
    if (statKeys.includes(key)) {
      if (n == null) out.skipped.push(`${key}: "${v}" is not a number`);
      else { out.stats[key] = clampStat(n); }
    } else if (dragKeys.includes(key) || (key === 'lipsync' && dragKeys.includes('lipsync'))) {
      dragSrc[key] = v;
    } else out.skipped.push(`${k}: not a stat (the nine are ${statKeys.join(', ')})`);
  }
  if (Object.keys(out.stats).length) out.filled.push(`${Object.keys(out.stats).length} stats`);

  // Drag Race craft block.
  for (const k of dragKeys) {
    if (dragSrc[k] === undefined) continue;
    const n = num(dragSrc[k]);
    if (n == null) out.skipped.push(`${k}: "${dragSrc[k]}" is not a number`); else out.drag[k] = clampStat(n);
  }
  const dStyle = dragSrc.style ?? r['drag.style'];
  if (dStyle !== undefined && dStyle !== '') {
    const s = String(dStyle).toLowerCase().trim().replace(/\s+/g, '-');
    if (dragStyles.includes(s)) out.drag.style = s; else out.skipped.push(`drag style: "${dStyle}"`);
  }
  const dTraits = dragSrc.traits ?? r['drag.traits'];
  if (dTraits !== undefined && dTraits !== '') {
    const list = (Array.isArray(dTraits) ? dTraits : String(dTraits).split(/[,\n]/)).map(t => String(t).toLowerCase().trim().replace(/\s+/g, '-')).filter(Boolean);
    const ok = list.filter(t => dragTraits.includes(t));
    for (const t of list) if (!dragTraits.includes(t)) out.skipped.push(`drag trait: "${t}"`);
    if (ok.length) out.drag.traits = ok.slice(0, 3);
  }
  const dVoice = dragSrc.voice ?? r['drag.voice'];
  if (dVoice) out.drag.voice = String(dVoice);
  if (Array.isArray(dragSrc.family)) out.drag.family = dragSrc.family.filter(l => l && l.name && l.rel).map(l => ({ name: String(l.name), rel: String(l.rel) }));
  if (Object.keys(out.drag).length) out.filled.push('drag');

  // Family & ties: [{ name, kin, role? }], as the editor writes them; a partner outside the franchise is
  // { name?, kin, outside: true } (js/ties.js outsidePartner), the name optional.
  if (Array.isArray(r.ties)) {
    out.ties = r.ties.filter(t => t && t.kin && (t.name || t.outside === true)).map(t => (t.outside === true
      ? { name: String(t.name || ''), kin: String(t.kin), outside: true }
      : { name: String(t.name), kin: String(t.kin), ...(t.role ? { role: String(t.role) } : {}) }));
    if (out.ties.length) out.filled.push(`${out.ties.length} ties`);
  }

  // Casting interview: { key: answer } (an export) — or [{ key, a }] / the roster's string, which the caller parses.
  const iv = get('interview', 'castingInterview');
  if (iv && typeof iv === 'object' && !Array.isArray(iv)) {
    out.interview = Object.fromEntries(Object.entries(iv).filter(([k, v]) => interviewKeys.includes(k) && String(v || '').trim()).map(([k, v]) => [k, String(v)]));
    if (Object.keys(out.interview).length) out.filled.push('interview'); else delete out.interview;
  } else if (typeof iv === 'string' && iv.trim()) out.interviewText = iv;

  if (r.kit && typeof r.kit === 'object') { out.kit = r.kit; out.filled.push('camp kit'); }
  const av = get('avatarDataUri');
  if (typeof av === 'string' && av.startsWith('data:image/')) { out.avatarDataUri = av; out.filled.push('avatar'); }
  return out;
}

/** The sheet as a file. Empty fields stay in, so an exported blank sheet is the template. */
export function characterToFile(d, { statKeys = [], dragOut = null, kitOut = null, interviewKeys = [] } = {}) {
  const file = { $format: FILE_FORMAT };
  for (const f of ['name', 'slug', 'age', 'birthdate', 'gender', 'sexuality', 'archetype', 'ethnicity', 'nationality', 'descriptor',
    'hometown', 'occupation', 'voice', 'backstory', 'personality', 'speakingVoice', 'continuityNote']) file[f] = d?.[f] ?? '';
  file.stats = Object.fromEntries(statKeys.map(k => [k, Number(d?.stats?.[k]) || 5]));
  file.ties = (d?.ties || []).map(t => ({ ...t }));
  file.interview = Object.fromEntries(interviewKeys.map(k => [k, d?.interview?.[k] || '']));
  if (dragOut) file.drag = dragOut;
  if (kitOut) file.kit = kitOut;
  if (d?.avatarDataUri) file.avatarDataUri = d.avatarDataUri;
  return file;
}
