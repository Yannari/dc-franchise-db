// ══════════════════════════════════════════════════════════════════════
// ci/topics.js — what a profile's life is about, for small talk
// ══════════════════════════════════════════════════════════════════════
//
// Circle chats bond over specifics: the night shift, the classroom, the
// dog, the hometown. A persona's topics are its job's and its details'
// (ci/persona-data.js). A real player's come only from what is canon: the
// job they wrote in Create Character, read for keywords, and their hometown.
// Nothing is invented (no dog nobody gave them).
import { jobOf, DETAILS } from './persona-data.js';

const KEYWORDS = [
  [/nurse|hospital|doctor|medic|paramedic|surgeon/, ['hospital', 'night-shifts']],
  [/teacher|teaching|professor|tutor/, ['school']],
  [/student|college|university|grad school/, ['campus']],
  [/lawyer|attorney|law\b|legal|paralegal/, ['law']],
  [/firefighter|fire ?fighter|firehouse/, ['firehouse', 'night-shifts']],
  [/realtor|real estate/, ['real-estate']],
  [/mechanic|auto shop|garage/, ['garage']],
  [/\bmodel/, ['modeling']],
  [/danc/, ['music', 'gym']],
  [/\bdj\b|music|singer|rapper|musician|band\b/, ['music']],
  [/trainer|fitness|gym|bodybuild|coach/, ['gym']],
  [/bartend|nightclub|\bbar\b/, ['bar', 'night-shifts']],
  [/stream|gamer|gaming|esports/, ['gaming']],
  [/pastor|church|minister|worship/, ['church']],
  [/nanny|childcare|daycare|babysit/, ['childcare']],
  [/football|basketball|soccer|baseball|volleyball|athlete/, ['college-sports', 'gym']],
];

// A nationality in the hometown field is not a place to ask about ("you're from Swiss?").
const DEMONYM = /^(swiss|british|english|french|german|spanish|italian|canadian|american|mexican|brazilian|korean|japanese|chinese|filipino|polish|irish|scottish|dutch|greek)$/i;
/** The town as a person would say it: the first part ("Toronto", not "Toronto, Ontario"). */
export function townOf(hometown) {
  const t = String(hometown || '').split(',')[0].trim();
  return t && !DEMONYM.test(t) ? t : null;
}

/** The topics a profile can be asked about, in a stable order. */
export function topicsOf(state, h) {
  const p = state.profiles[h];
  if (!p) return [];
  const persona = p.mode === 'catfish' && p.personaId ? (state.pool || []).find(x => x.id === p.personaId) : null;
  const out = [];
  if (persona) {
    out.push(...(jobOf(persona)?.topics || []));
    for (const d of persona.details || []) out.push(...(DETAILS.find(x => x.id === d)?.topics || []));
  } else {
    const job = String(p.shown?.job || '').toLowerCase();
    for (const [re, ts] of KEYWORDS) if (re.test(job)) out.push(...ts);
  }
  if (townOf(p.shown?.hometown)) out.push('hometown');
  // What everybody's profile shows, and the life everybody is living in here.
  const status = String(p.shown?.status || '').toLowerCase();
  if (/single/.test(status)) out.push('single');
  else if (/taken|married|engaged/.test(status)) out.push('taken');
  else if (/complicated/.test(status)) out.push('complicated');
  out.push('circle-life');
  return [...new Set(out)];
}

/** A topic about a job: the one kind a catfish has to wing. */
export const JOB_TOPIC = t => !['kids', 'dog', 'church', 'hometown', 'single', 'taken', 'complicated', 'circle-life'].includes(t);

/** Would answering about this topic be winging a life they don't have? */
export function wingsIt(state, h) {
  const p = state.profiles[h];
  return !!p && (p.mode === 'catfish' || (p.mode === 'edited' && (p.edits || []).includes('job')));
}
