// ══════════════════════════════════════════════════════════════════════
// ch/story/director.js — what an episode airs, in what order
// ══════════════════════════════════════════════════════════════════════
//
// Total Drama's director (td/story/director.js), for a three-day Challenge
// episode. Runs after the episode has been played and touches no game state:
// it reads the episode's scenes in the order they happened, decides which air,
// and writes them. A dropped candidate costs nothing (its line is never spent).
//
// TIERS (manual §19.2 step 4):
//   must    the spine and anything that changes the game in public: the daily,
//           the call-out, the Arena, exits, an outing, a volunteer, a betrayal,
//           a showmance or a breakup, a fight that gets somebody sent home
//   due     what explains the vote: the meetings, a plea, a threat, recruiting,
//           the night before, the morning after, a public row
//   story   the threads: deals, apologies, lies, tests, pacts, homesickness
//   colour  the texture: pranks, flirts, the kitchen, the gym
//
// BUDGET: the real show airs about a dozen house scenes an episode around its
// set pieces; each day gets a share, and colour fills what is left.
//
// GUARDS, once per day over the whole day (manual §19.2):
//   - two people are alone together at most three times a day;
//   - no warm scene for two people who fought earlier that day;
//   - one blow-up per person per day;
//   - nobody who has left the game is in a scene (the engine already keeps
//     them out; checked again here because a story scene is the place it
//     would slip).
import { writeScene } from '../script/write.js';
import { writeVote } from '../script/ceremony.js';

const MUST = new Set(['arrival', 'daily', 'callout', 'arena', 'quit', 'medical', 'disqualified', 'tj-house-meeting', 'outing',
  'volunteer', 'return', 'showmance', 'breakup', 'alliance-betrayal', 'deal-broken', 'fight-physical', 'final-start',
  'instant-elimination', 'overnight-sabotage', 'overnight-quit', 'final-pact-help', 'final-pact-broken', 'champions',
  'rookie-uprising']);
const DUE = new Set(['meeting', 'plea', 'leverage-threat', 'recruit', 'alliance-form', 'arena-eve-confront', 'arena-eve-pep',
  'arena-eve-alone', 'morning-after', 'fight', 'team-blame', 'partner-blame', 'throw-caught', 'jealousy', 'receipts',
  'old-show-grudge', 'overheard', 'kitchen-blowup', 'floater-callout']);
const STORY = new Set(['deal', 'alliance-grow', 'alliance-leave', 'alliance-end', 'apology', 'scheme-lie', 'loyalty-test',
  'ride-to-the-final', 'psyche', 'homesick', 'call-home', 'gossip-backfire', 'ex-in-the-house', 'trash-talk',
  'vet-dismisses', 'vet-mentors-rookie', 'beach-date', 'hot-tub-truths', 'show-banter', 'rookie-hazing', 'throw']);
const WARM = new Set(['flirt', 'beach-date', 'spark', 'vet-mentors-rookie', 'apology', 'hot-tub-truths', 'arena-eve-pep']);
const ROW = new Set(['fight', 'fight-physical', 'kitchen-blowup', 'receipts', 'trash-talk', 'partner-blame', 'jealousy']);

const tierOf = k => (MUST.has(k) ? 0 : DUE.has(k) ? 1 : STORY.has(k) ? 2 : 3);
const CAPS = { meeting: 2, recruit: 2, 'alliance-form': 2, plea: 1, 'leverage-threat': 1, 'arena-eve-pep': 2, 'arena-eve-alone': 1 };
const DAY_BUDGET = 7;   // non-must scenes per day

export function airEpisode(state, epRec) {
  const scenes = state.scenes.filter(s => s.ep === epRec.ep);
  const goneBefore = day => new Set(state.gone.filter(g => g.day < day).map(g => g.name));
  const byDay = {};
  for (const s of scenes) (byDay[s.day] ||= []).push(s);
  const aired = [];
  for (const day of Object.keys(byDay).map(Number).sort((a, b) => a - b)) {
    const pool = byDay[day];
    const gone = goneBefore(day);
    const picked = new Set();
    const counts = {};
    const pairs = {};
    const rowed = new Set();
    const blewUp = new Set();
    const ok = (s, tier) => {
      if (s.who.some(n => gone.has(n))) return false;
      const k = [...s.who].slice(0, 2).sort().join('|');
      if (s.who.length === 2 && (pairs[k] || 0) >= 3) return false;
      if (WARM.has(s.kind) && rowed.has(k)) return false;
      if (ROW.has(s.kind) && tier > 0 && blewUp.has(s.who[0])) return false;
      if (CAPS[s.kind] && (counts[s.kind] || 0) >= CAPS[s.kind]) return false;
      return true;
    };
    const take = s => {
      picked.add(s.id);
      counts[s.kind] = (counts[s.kind] || 0) + 1;
      const k = [...s.who].slice(0, 2).sort().join('|');
      if (s.who.length === 2) pairs[k] = (pairs[k] || 0) + 1;
      if (ROW.has(s.kind)) { rowed.add(k); blewUp.add(s.who[0]); }
    };
    // In time order, the must-airs first, then by tier while the budget lasts.
    let budget = DAY_BUDGET;
    for (const tier of [0, 1, 2, 3]) {
      for (const s of pool) {
        if (picked.has(s.id) || tierOf(s.kind) !== tier) continue;
        if (tier > 0 && budget <= 0) break;
        if (!ok(s, tier)) continue;
        take(s);
        if (tier > 0) budget--;
      }
    }
    for (const s of pool) {
      if (!picked.has(s.id)) continue;
      // The vote ceremony airs where the vote happened: just before its result.
      if (s.kind === 'voted-in') {
        const k = epRec.votedIn.indexOf(s.who[0]);
        const vote = epRec.votes.find(v => v.votedIn === s.who[0]);
        if (vote) aired.push({ day, kind: 'ceremony', scene: s, ceremony: writeVote(state, epRec, vote, day), order: k });
        continue;
      }
      aired.push({ day, kind: s.kind, scene: s, script: writeScene(state, s) });
    }
    // voted-in scenes are not in a tier: put the ceremony in by hand.
    for (const s of pool.filter(x => x.kind === 'voted-in' && !picked.has(x.id))) {
      const vote = epRec.votes.find(v => v.votedIn === s.who[0]);
      if (!vote) continue;
      const at = aired.findIndex(a => a.scene.id > s.id && a.day === day);
      const block = { day, kind: 'ceremony', scene: s, ceremony: writeVote(state, epRec, vote, day) };
      if (at < 0) aired.push(block); else aired.splice(at, 0, block);
    }
  }
  epRec.aired = aired;
  return aired;
}

export function airSeason(state) {
  for (const e of state.episodes) airEpisode(state, e);
  if (state.finalEp) airEpisode(state, state.finalEp);
}
