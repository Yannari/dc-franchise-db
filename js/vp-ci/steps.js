// ══════════════════════════════════════════════════════════════════════
// vp-ci/steps.js — a Circle day as screens of clicks (Plan 5)
// ══════════════════════════════════════════════════════════════════════
//
// PURE: a played row in, plain data out, no DOM. The stage and the script
// under it read the same list (ADDING-A-SHOW §6.5), so they never drift.
//
// ONE CLICK IS ONE LINE (spec 18.3): said aloud, sent to the Circle, a
// reaction, a post, a video, the host, or a stage direction. A screen is one
// aired scene.
//
// WHERE THE CAMERA IS: a private chat, a date, a plea, apartment life and a
// video from home play IN THE APARTMENTS (the dictation, the send beam, the
// TV); the group chats, the Newsfeed, the ratings, games and parties play on
// THE CIRCLE ITSELF, full screen; an alert SLAMS IN. New stages (ratings,
// blocked, the Hangout, the visit, the goodbye video, the finale) come next
// and take their kinds from this map.
import { TITLES } from '../ci/transcript.js';
import { GAMES } from '../ci/games-data.js';

const APT = new Set(['chat', 'date', 'plead', 'joker-chat', 'life', 'home-video', 'report', 'recognise', 'lurk', 'hack-undone', 'after-party']);
const ALERT = new Set(['alert', 'power-reveal', 'disrupter', 'hack', 'no-block', 'mission']);
export const stageOf = kind => (APT.has(kind) ? 'apt' : ALERT.has(kind) ? 'alert' : 'ui');

/** A face for a profile: what the room sees (`profile`), or who is really in
 *  the apartment (`cam`: the first player behind it, on the apartment camera). */
export function faceOf(row, h, as = 'profile') {
  const p = row?.ci?.profiles?.[h];
  if (!p) return null;
  if (as === 'cam') return p.people?.[0] ? `portrait:${p.people[0]}` : null;
  return p.face ?? null;
}

export function circleScreens(row) {
  return (row?.ci?.aired || []).filter(s => s.script?.blocks?.length).map((s, si) => {
    const g = s.kind === 'game' ? GAMES.find(x => x.id === s.game) : null;
    const steps = [];
    for (const b of s.script.blocks) {
      for (const l of b.lines || []) {
        steps.push({ who: l.who && l.who !== 'host' ? l.who : null, host: l.who === 'host' || l.kind === 'host',
          part: l.kind, text: l.text, ...(l.spoken ? { spoken: l.spoken } : {}) });
      }
      if (b.beat) steps.push({ who: null, part: 'stage', text: b.beat });
    }
    const cast = [...new Set([...(s.who || []), ...steps.map(x => x.who).filter(Boolean)])].filter(h => row.ci.profiles?.[h]);
    return { id: s.id || `s${si}`, kind: s.kind, stage: stageOf(s.kind),
      title: g ? `A game: ${g.name}` : TITLES[s.kind] || s.kind, cast, steps };
  });
}
