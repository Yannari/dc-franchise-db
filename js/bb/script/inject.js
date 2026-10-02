// ══════════════════════════════════════════════════════════════════════
// bb/script/inject.js — words for a beat the week engine builds itself
// ══════════════════════════════════════════════════════════════════════
//
// Most house beats come from an event that fires through house-events.js,
// which writes the scene. A few are built inside the week engine itself — an
// alliance forming, a recruit, a betrayal and its fallout — and pushed onto an
// act directly. This writes those the same way: a decided scene, the shared
// picker, and the words' own dice (stableRng), so the season does not move.
//
// Returns { text, lines, lineId } to spread over the beat, or null when the
// pools have nothing — the caller keeps its plain sentence then, so a beat is
// never left empty.
import { gs } from '../../core.js';
import { stableRng } from '../knowledge.js';
import { makeScene } from './scene.js';
import { writeScene } from './write.js';

export function scriptBeat(kind, who, data, { week, act = 'house', hoh = null, nominees = [], room = null, seenBy = [] } = {}) {
  try {
    const scene = makeScene(kind, who, data, seenBy, room);
    const rng = stableRng(gs.bb?.seasonSalt || 0, week?.num || 0, act, kind, Object.values(who).filter(Boolean).join('|'));
    const written = writeScene(scene, { week, act, hoh, nominees }, rng);
    return { text: written.text, lines: written.lines, lineId: written.lineId };
  } catch { return null; }
}
