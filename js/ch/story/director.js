// ══════════════════════════════════════════════════════════════════════
// ch/story/director.js — what an episode airs, in what order, as stories
// ══════════════════════════════════════════════════════════════════════
//
// Total Drama's and Big Brother's directors (td/story/director.js,
// bb/story/director.js) for a three-day Challenge episode. Runs after the
// episode has been played and touches no game state: it reads the episode's
// scenes in the order they happened, decides which air, and writes them. A
// dropped candidate costs nothing (its line is never spent).
//
// STORIES, not snippets (the user, 2026-10-14: "storyline, drama, comedy,
// romance"). Every scene is filed as a chapter of a storyline
// (storylines.js). The director:
//   - prefers the next chapter of a story the viewer is already following,
//     and lifts a story with two aired chapters into the episode's spine;
//   - never airs a chapter whose cause the viewer has not seen without saying
//     the cause plainly at the top of the scene (a recap beat);
//   - adds the arcs that run across episodes (arcs.js: payback, the beast,
//     the giant falling, the underdog, the running gags), next to the scene
//     they answer;
//   - opens each episode after the first with TJ's "previously on"
//     (previously.js), from what actually aired last time.
//
// TIERS (manual §19.2 step 4): must · due · story · colour, against a day
// budget. GUARDS, once per day: two people alone together at most three
// times; no warm scene for two people who fought earlier that day; one
// blow-up per person per day; nobody who has left the game.
import { writeScene } from '../script/write.js';
import { pronouns } from '../../players.js';
import { writeVote } from '../script/ceremony.js';
import { file, causeOf, book } from './storylines.js';
import { arcsFor } from './arcs.js';
import { previouslyFor } from './previously.js';

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
const CAPS = { meeting: 2, recruit: 2, 'alliance-form': 2, plea: 1, 'leverage-threat': 1, 'arena-eve-pep': 2, 'arena-eve-alone': 1 };
const DAY_BUDGET = 7;   // non-must scenes per day

const baseTier = k => (MUST.has(k) ? 0 : DUE.has(k) ? 1 : STORY.has(k) ? 2 : 3);

// ── the cause, said plainly ──────────────────────────────────────────
// When a chapter's cause never aired, the scene opens by saying it. Each
// line names the people of the CAUSE, the right way round ({0} did it to {1}).
const RECAP = {
  'kitchen-blowup': 'Ever since the row in the kitchen, {0} and {1} have barely looked at each other.',
  'bunk-war': 'Since the fight over the bunk room, {0} and {1} have been sleeping with one eye open.',
  'trash-talk': '{0} and {1} have been needling each other every chance they get.',
  prank: 'The prank war between {0} and {1} is still going.',
  receipts: '{0} still hasn\'t let go of {1} saying that name at the vote.',
  'old-show-grudge': '{0} and {1} brought their history from their old show in here with them.',
  'floater-callout': '{1} hasn\'t forgotten {0} calling {1.obj} a free ride in front of the whole house.',
  'partner-blame': '{1} is still stinging from {0} blaming {1.obj} for losing the daily.',
  'team-blame': '{1} is still stinging from {0} blaming {1.obj} for the team\'s loss.',
  fight: '{0} and {1} have barely spoken since their fight at the bar.',
  'fight-physical': 'Nobody has forgotten what happened between {0} and {1} at the bar.',
  'gossip-backfire': '{1} found out what {0} had been saying about {1.obj}, and hasn\'t let it go.',
  'arena-eve-confront': 'The night before the Arena, {0} went after {1}, and it hasn\'t cooled down since.',
  'show-banter': '{0} and {1} have been arguing about whose old show was harder.',
  'rookie-hazing': '{1} hasn\'t forgotten the way {0} treated the rookies.',
  spark: 'There\'s been something between {0} and {1}.',
  flirt: '{0} and {1} have been flirting.',
  showmance: '{0} and {1} are a couple now.',
  'beach-date': '{0} and {1} have been inseparable.',
  'alliance-form': '{0} has an alliance, and {1} is in it.',
  'alliance-grow': '{1} was brought into {0}\'s alliance.',
  meeting: '{0}\'s alliance has been meeting behind closed doors.',
  recruit: '{1} agreed to vote with {0}\'s group.',
};
function recapLine(state, causeScene) {
  const t = RECAP[causeScene.kind];
  if (!t) return null;
  const who = causeScene.who.slice(0, 2);
  return t.replace(/\{([01])(?:\.(\w+))?\}/g, (m, i, part) => {
    const n = who[Number(i)] || '';
    return part ? (pronouns(n)?.[part] ?? n) : n;
  });
}

// ── synthetic scenes for the arcs ────────────────────────────────────
function arcScene(state, arc, ep) {
  return { id: `arc:${ep}:${arc.kind}:${arc.who.join('>')}`, ep, day: arc.day, kind: arc.kind, who: arc.who,
    data: { ...arc.data, stage: arc.stage }, seenBy: arc.who, spot: 'villa', snap: { house: state.active.length } };
}

export function airEpisode(state, epRec, prevRec = null) {
  const scenes = state.scenes.filter(s => s.ep === epRec.ep);
  // File the whole episode first, in the order it happened, so a chapter can see its cause.
  for (const s of scenes) file(state, s);
  const filed = book(state).filed;
  const goneBefore = day => new Set(state.gone.filter(g => g.day < day).map(g => g.name));
  const arcs = arcsFor(state, epRec);
  const byDay = {};
  for (const s of scenes) (byDay[s.day] ||= []).push(s);
  const aired = [];
  // TJ's "previously on"
  if (prevRec) {
    const p = previouslyFor(state, prevRec);
    if (p) aired.push({ day: scenes[0]?.day ?? 0, kind: 'previously', script: { lines: p.lines, text: p.lines.map(l => `${l.by}: ${l.text}`).join('\n') } });
  }
  for (const day of Object.keys(byDay).map(Number).sort((a, b) => a - b)) {
    const pool = byDay[day];
    const gone = goneBefore(day);
    const picked = new Set();
    const counts = {}, pairs = {};
    const rowed = new Set(), blewUp = new Set();
    // A story the viewer is following: its next chapter is due, and a story
    // with two aired chapters is part of this episode's spine.
    const chapters = s => filed[s.id]?.line?.steps.filter(x => x.aired).length || 0;
    const tierOf = s => {
      const t = baseTier(s.kind);
      const f = filed[s.id];
      if (!f || f.line.type === 'life' || f.line.type === 'spine') return t;
      const n = chapters(s);
      return n >= 2 ? Math.min(t, 1) : n >= 1 ? Math.min(t, 2) : t;
    };
    const ok = (s, tier) => {
      if (s.who.some(n => gone.has(n))) return false;
      // An alliance being spotted is news once; after that the house knows.
      if (s.kind === 'meeting-spotted' && filed[s.id]?.line.steps.some(x => x.step === 'spotted' && x.aired)) return false;
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
    let budget = DAY_BUDGET;
    for (const tier of [0, 1, 2, 3]) {
      // inside a tier: the stories already running first, then in time order
      const cands = pool.filter(s => !picked.has(s.id) && tierOf(s) === tier)
        .sort((x, y) => chapters(y) - chapters(x) || x.id - y.id);
      for (const s of cands) {
        if (tier > 0 && budget <= 0) break;
        if (!ok(s, tier)) continue;
        take(s);
        if (tier > 0) budget--;
      }
    }
    const dayArcs = arcs.filter(a => a.day === day && a.who.every(n => !gone.has(n)));
    const pushArc = arc => {
      const sc = arcScene(state, arc, epRec.ep);
      const script = writeScene(state, sc);
      if (script) aired.push({ day, kind: arc.kind, scene: sc, script });
    };
    for (const s of pool) {
      // the arcs that open before this scene (payback, before a call-out)
      for (const arc of dayArcs.filter(a => a.before === s.id)) pushArc(arc);
      // A feud the viewer has followed for two chapters or more, ending in a
      // call-out: the showdown, opened by where it started.
      if (s.kind === 'callout' && picked.has(s.id)) {
        const key = [...s.who].slice(0, 2).sort().join('|');
        const feud = book(state).lines.find(l => l.type === 'feud' && l.key === key && l.status === 'live');
        const ch = feud?.steps.filter(x => x.aired) || [];
        if (ch.length >= 2) {
          const first = state.scenes.find(x => x.id === ch[0].scene);
          const sc = arcScene(state, { kind: 'arc-showdown', who: s.who.slice(0, 2), data: {}, day }, epRec.ep);
          const script = writeScene(state, sc);
          const opener = first && recapLine(state, first);
          if (script) aired.push({ day, kind: 'arc-showdown', scene: sc,
            script: opener ? { ...script, lines: [{ kind: 'beat', by: null, text: opener, recap: true }, ...script.lines], text: `(${opener})\n${script.text}` } : script });
          feud.status = 'closed';
        }
      }
      if (s.kind === 'voted-in') {
        const vote = epRec.votes.find(v => v.votedIn === s.who[0]);
        if (vote) aired.push({ day, kind: 'ceremony', scene: s, ceremony: writeVote(state, epRec, vote, day) });
        continue;
      }
      if (picked.has(s.id)) {
        const f = filed[s.id];
        let script = writeScene(state, s);
        // A chapter whose cause the viewer never saw opens by saying it.
        if (f && script) {
          const cause = causeOf(f.line, f.step);
          if (cause && !cause.aired) {
            const cs = state.scenes.find(x => x.id === cause.scene);
            const text = cs && recapLine(state, cs);
            if (text) script = { ...script, lines: [{ kind: 'beat', by: null, text, recap: true }, ...script.lines],
              text: `(${text})\n${script.text}` };
          }
          f.step.aired = true;
        }
        aired.push({ day, kind: s.kind, scene: s, script });
      }
      // the arcs that follow this scene (the beast, the giant falling, the underdog, a running gag)
      for (const arc of dayArcs.filter(a => a.after === s.id)) pushArc(arc);
    }
  }
  epRec.aired = aired;
  return aired;
}

export function airSeason(state) {
  let prev = null;
  for (const e of state.episodes) { airEpisode(state, e, prev); prev = e; }
  if (state.finalEp) airEpisode(state, state.finalEp, prev);
}

