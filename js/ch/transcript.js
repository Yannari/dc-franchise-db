// ══════════════════════════════════════════════════════════════════════
// ch/transcript.js — an aired Challenge episode, as rows and as text
// ══════════════════════════════════════════════════════════════════════
//
// `airedOf` turns what the director aired for one episode into the compact,
// JSON-safe list a run-tab row carries (a scene's kind, day, place, people and
// its written lines). `episodeScenes` and `episodeText` read that list back:
// the readout screens (js/vp-ch/screens.js) and the text backlog print the
// same lines, so the two can never say different things. The stepped viewer
// (js/vp-ch-ep/, sub-project 5) replaces the readout, not this.

import { cpLines, podiumLines } from './script/final-cp.js';
import { rankLines } from './script/rankings.js';
const SPOT = { airstrip: 'The airstrip', villa: 'The villa', kitchen: 'The kitchen', gym: 'The gym', 'hot-tub': 'The hot tub', bedroom: 'The bedroom',
  beach: 'The beach', pool: 'The pool deck', confessional: 'Confessional', arena: 'The Arena', final: 'The final',
  party: 'Night out', private: 'Somewhere quiet', public: 'The villa', challenge: 'The daily', deliberation: 'Deliberation' };

// A scene's title, in the show's words. A title is on the screen list BEFORE
// the scene is watched, so it never says how the scene ends: no "Quit", no
// "Breakup", no "Champions" (manual §18: nothing before its step).
const TITLE = {
  previously: 'Previously on The Challenge', arrival: 'The arrival', 'villa-reveal': 'The villa', 'house-debate': 'The house talks', 'after-vote': 'After the vote', 'pick-talk': 'The pick', 'pick-guess': 'Who goes in', 'gym-training': 'Training', 'pool-games': 'Chicken fight', 'house-dinner': 'Dinner', 'beach-run': 'The run', 'sunset-talk': 'Sunset', 'bunk-whisper': 'Lights out', ceremony: 'The house vote', callout: 'The call-out', volunteer: 'A volunteer',
  meeting: 'A meeting', 'meeting-spotted': 'Somebody noticed', recruit: 'Asking for a vote', plea: 'A plea', deal: 'A deal',
  'deal-broken': 'A deal', outing: 'Out loud', 'leverage-threat': 'A warning', 'counter-pitch': 'Not me, them', 'tribunal-pitch': 'Before the Tribunal', 'tribunal-room': 'The Tribunal', 'tribunal-verdict': 'The verdict', 'spare-deal': 'A quiet offer', 'empty-threat': 'An empty threat', 'ride-to-the-final': 'All the way',
  daily: 'The daily challenge', 'daily-clutch': 'After the daily', 'daily-choke': 'After the daily', 'partner-draw': 'Partners',
  'partner-pick': 'Partners', 'partner-blame': 'After the daily', 'partner-carried': 'After the daily', 'team-blame': 'After the daily',
  'picked-last': 'Picking teams', throw: 'The daily', 'throw-caught': 'Suspicion', 'gym-flex': 'The gym',
  'arena-eve-pep': 'The night before the Arena', 'arena-eve-alone': 'The night before the Arena', 'arena-eve-confront': 'The night before the Arena',
  arena: 'The Arena', return: 'Back in the villa', 'morning-after': 'The morning after', 'instant-elimination': 'A surprise',
  party: 'Night out', fight: 'Night out', spark: 'A spark', flirt: 'A spark', showmance: 'Something real', pda: 'Something real',
  'beach-date': 'The beach', 'hot-tub-truths': 'The hot tub', jealousy: 'Jealousy', breakup: 'A hard talk',
  homesick: 'Missing home', 'call-home': 'A call home', psyche: 'Confessional', 'kitchen-blowup': 'The kitchen',
  'kitchen-disaster': 'The kitchen', 'bunk-war': 'The bedroom', prank: 'A prank', 'trash-talk': 'Trash talk',
  'show-banter': 'Old shows', 'rookie-hazing': 'Rookies', 'vet-dismisses': 'Vets and rookies', 'vet-mentors-rookie': 'Vets and rookies',
  'floater-callout': 'Who has done what', receipts: 'Receipts', 'scheme-lie': 'A word in your ear', 'gossip-backfire': 'Gossip',
  overheard: 'Overheard', 'loyalty-test': 'A test', 'alliance-form': 'A new alliance', 'alliance-grow': 'The alliance',
  'alliance-leave': 'The alliance', 'alliance-end': 'The alliance', 'alliance-betrayal': 'The fallout',
  'tj-at-breakfast': 'TJ at breakfast', 'run-name': 'TJ and the names', 'run-snacks': 'The stash',
  'arc-payback': 'Old scores', 'arc-showdown': 'Old scores', 'arc-beast': 'The beast', 'arc-beast-feared': 'The beast',
  'arc-giant-falls': 'After the Arena', 'arc-underdog': 'The underdog',
  quit: 'A decision', medical: 'The medic', disqualified: 'TJ arrives',
  'final-start': 'The final', overnight: 'The overnight', 'overnight-sabotage': 'The overnight', 'overnight-quit': 'The overnight',
  'final-pact-help': 'The final', 'final-pact-broken': 'The final', champions: 'The finish line',
  'power-rankings': "TJ's power rankings",
  injury: 'Hurt', 'injury-healed': 'Back to full strength', 'injury-care': 'Ice and tape', 'injury-target': 'A weakness',
  'bank-taken': 'The bank', 'bank-brag': 'The bank', 'money-talk': 'The bank', 'ranking-beef': "TJ's list",
  'pass-earned': 'The skull', 'pass-cut': 'Before the final', 'pass-panic': 'No skull yet', 'pass-flex': 'The skull',
  'redemption-arrive': 'Redemption House', 'redemption-watch': 'Redemption House', 'redemption-feud': 'Redemption House', 'redemption-duel': 'Redemption',
  'redemption-return': 'Back from Redemption', 'redemption-closed': 'Redemption House',
  wavering: 'Struggling', 'quit-decide': 'A decision', 'quit-house': 'Leaving', mock: 'After the daily', gloat: 'After the vote', payback: 'Payback', 'named-fallout': 'After the daily', 'arena-goodbye': 'The goodbye', purge: 'The Purge', 'return-arena': 'The Return', 'return-walkin': 'Back in the villa',
  'party-slip': 'Night out', 'party-deal': 'Night out', 'party-callout': 'Night out', 'party-tears': 'Night out', 'fight-physical': 'Night out',
  'expelled-goodbye': 'Goodbye', 'expelled-blame': 'The fallout', 'expelled-victim': 'The fallout', 'final-cp': 'A checkpoint', 'overnight-talk': 'At the fire', 'final-podium': 'The totals', 'final-congrats': 'Congratulations', 'final-lastword': 'Last words',
};
const titleOf = kind => TITLE[kind] || 'In the villa';

// The screen list's sections: an episode is three days (ch/season.js), the
// final its own.
export function sectionOf(row, scene) {
  if (scene.kind === 'previously') return 'previously';
  if (row?.ch?.final) return 'final';
  const d = Number(scene.day) - Number(row?.day ?? scene.day);
  return d <= 0 ? 'daily' : d === 1 ? 'vote' : 'arena';
}

const compact = lines => (lines || []).map(l => ({ kind: l.kind, by: l.by || null, text: l.text,
  ...(l.shot ? { shot: plain(l.shot) } : {}), ...(l.clip ? { clip: true } : {}), ...(l.roster ? { roster: true } : {}) }));
// A scene's facts, JSON-safe, for the stepped viewer (js/vp-ch-ep): who won, what the call-out was for.
const plain = d => { try { return d ? JSON.parse(JSON.stringify(d)) : null; } catch { return null; } };

/** One episode's aired scenes, as a row carries them. */
export function airedOf(epRec) {
  const out = [];
  for (const a of epRec?.aired || []) {
    if (a.kind === 'ceremony') {
      // `cer`: the ceremony in its parts (TJ's open, each ballot with its own lines, the result), so the
      // stepped viewer can stand each voter up as they speak. `lines` is the same words, flat.
      const cer = (a.ceremony || []).map(c => ({ kind: c.kind, voter: c.voter || null, target: c.target || null, why: c.why || null, lines: compact(c.script?.lines) }));
      out.push({ kind: 'ceremony', day: a.day, spot: 'deliberation', who: [], data: plain(a.scene?.data),
        votedIn: a.scene?.who?.[0] || null, cer, lines: cer.flatMap(c => c.lines) });
      continue;
    }
    if (!a.script) continue;
    out.push({ kind: a.kind, day: a.day, spot: a.script?.at || a.scene?.spot || null, who: [...(a.scene?.who || [])], data: plain(a.scene?.data), snap: plain(a.scene?.snap),
      lines: compact(a.script.lines) });
  }
  return out;
}

/** A final checkpoint's lines: the race as told (script/final-cp.js), then the reactions after it. */
const ranksTold = (row, s) => [...rankLines(s.data.rows, { seed: `ranks|${row.num}` }).map(l => ({ kind: 'say', by: l.by, text: l.text })), ...(s.lines || [])];
const podiumTold = s => [...(s.lines || []), ...podiumLines(s.data?.podium || {}, s.data?.totals || {}).map(l => ({ kind: l.kind === 'beat' ? 'beat' : 'say', by: l.by, text: l.text }))];
const cpTold = (row, s) => [...cpLines(s.data.rec, { seed: `final|${row.num}`, prev: s.data.prev })
  .map(l => ({ kind: l.kind === 'beat' ? 'beat' : 'say', by: l.by, text: l.text })), ...(s.lines || [])];

/** The row's scenes for the screens: title, place, day, lines. */
export function episodeScenes(row) {
  return (row?.ch?.aired || []).map((s, i) => ({
    id: `${sectionOf(row, s)}-${i}`, section: sectionOf(row, s), kind: s.kind, day: s.day, title: s.kind === 'final-cp' ? (s.data?.name || titleOf(s.kind)) : titleOf(s.kind),
    place: s.kind === 'previously' ? null : (SPOT[s.spot] || null), who: s.who || [], lines: s.kind === 'final-cp' && s.data?.rec ? cpTold(row, s) : s.kind === 'final-podium' ? podiumTold(s) : s.kind === 'power-rankings' && s.data?.rows ? ranksTold(row, s) : (s.lines || []),
  }));
}

const lineText = l => (l.kind === 'beat' ? `(${l.text})` : l.kind === 'conf' ? `${l.by} [confessional]: ${l.text}` : `${l.by}: ${l.text}`);

/** The episode as the text backlog prints it: the same lines the screens draw. */
export function episodeText(row) {
  if (!row?.ch) return '';
  const head = row.ch.final ? `EPISODE ${row.num} — THE FINAL`
    : `EPISODE ${row.num}${row.ch.division ? ` — ${row.ch.division === 'm' ? "men's" : row.ch.division === 'f' ? "women's" : 'open'} week` : ''}`;
  const out = [head];
  let day = null;
  for (const s of episodeScenes(row)) {
    if (s.day !== day) { day = s.day; out.push('', `— Day ${day} —`); }
    out.push('', `${s.title}${s.place ? ` [${s.place}]` : ''}`);
    for (const l of s.lines) out.push(lineText(l));
  }
  if (row.ch.final?.champions?.length) out.push('', `CHAMPIONS: ${row.ch.final.champions.join(' & ')}`);
  return out.join('\n');
}
