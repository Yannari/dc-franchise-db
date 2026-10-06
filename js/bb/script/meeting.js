// ══════════════════════════════════════════════════════════════════════
// bb/script/meeting.js — a house meeting as one script in four parts
// ══════════════════════════════════════════════════════════════════════
//
// A meeting is decided by its event (who called it, about whom, why, and how
// it went); this writes it: the call, the case, the answer, the verdict, each
// from its own pool (lines/meeting.js) with the story's own dice, joined into
// one script. The meeting card draws one row per part, so the parts come back
// as `beats` too.
import { scriptBeat, joinScripts } from './inject.js';
import { transcript } from './write.js';

const CASE = { lie: 'lie', 'nothing-to-lose': 'desperate', power: 'power' };
const OUTCOME = { lands: 'lands', backfires: 'backfires', 'nobody talks': 'silent', fizzles: 'fizzles' };
// the call, the house gathering (who is coming, wondering why, the one it is about feeling it),
// then the case, the answer and how it ends
const PARTS = ['call', 'gather', 'case', 'answer', 'verdict'];

/** { text, lines, lineId, beats } — or null when any part has no words. */
export function writeMeeting({ caller, about, witness = null, outcome, cause }, ctx = {}) {
  if (!caller || !about) return null;
  const ending = OUTCOME[outcome];
  if (!ending) return null;
  const who = { a: caller, b: about, c: witness && witness !== caller && witness !== about ? witness : null };
  const endings = { call: 'scene', gather: 'scene', case: CASE[cause] || 'grudge', answer: ending, verdict: ending };
  const opts = { week: ctx.week, act: ctx.act || 'house', hoh: ctx.hoh || null, room: 'living-room' };
  const parts = PARTS.map(part => scriptBeat(`meeting.${part}`, who, { ending: endings[part] },
    { ...opts, salt: `meeting|${part}|${caller}` }));
  const script = joinScripts(...parts);
  if (!script) return null;
  const beats = parts.map((p, i) => ({
    kind: PARTS[i],
    who: p.lines.find(l => l.by)?.by || null,
    text: transcript(p.lines),
  }));
  return { ...script, beats };
}
