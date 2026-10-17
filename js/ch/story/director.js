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

const MUST = new Set(['arrival', 'villa-reveal', 'house-debate', 'after-vote', 'pick-talk', 'pick-guess', 'daily', 'callout', 'arena', 'quit', 'medical', 'disqualified', 'tj-house-meeting', 'outing', 'empty-threat', 'tribunal-room', 'tribunal-verdict', 'tribunal-pitch',
  'volunteer', 'return', 'showmance', 'breakup', 'alliance-betrayal', 'deal-broken', 'fight-physical', 'final-start',
  'instant-elimination', 'overnight-sabotage', 'overnight-quit', 'final-pact-help', 'final-pact-broken', 'champions',
  'rookie-uprising', 'final-cp', 'overnight-talk', 'final-podium', 'final-congrats', 'final-lastword', 'party', 'tj-double', 'party-slip', 'party-kiss', 'kiss-fallout', 'party-callout', 'expelled-goodbye', 'expelled-blame',
  // every alliance is seen being made: a drunk slip, a betrayal or an outing names it later (the user, 2026-10-16:
  // "there's no alliance called Riptide", named first at the bar after its forming scene was cut for room)
  'alliance-form',
  // the stakes (stakes.js, redemption.js)
  'bank-taken', 'injury', 'power-rankings', 'pass-earned', 'pass-cut', 'redemption-arrive', 'redemption-duel', 'redemption-return', 'redemption-closed',
  // the one-episode twists (ep-twists.js)
  'purge', 'return-arena', 'return-walkin',
  // a friend goes to the one who sent their friend home (fallout.js payback); the goodbye at the gate (goodbye.js)
  'payback', 'arena-goodbye',
  // the worst thing somebody was called in a daily, said to a face (daily/named.js)
  'named-fallout',
  // the mean ones being mean (cruel.js)
  'mock', 'gloat',
  // a quit as a moment: the signs, the friend, the house (quit.js)
  'wavering', 'quit-decide', 'quit-house',
  // a medevac as a moment (medevac.js)
  'medical-exam', 'medical-house',
  // the champions' last words (final.js)
  'champion-reflect',
  // who they would pick, and the one picked hearing it (wishlist.js)
  'arena-wishlist', 'wishlist-leak',
  // late arrivals (ep-twists.js)
  'late-arrival', 'late-sizeup']);
const DUE = new Set(['meeting', 'plea', 'leverage-threat', 'counter-pitch', 'spare-deal', 'recruit', 'alliance-merge', 'arena-eve-confront', 'arena-eve-pep',
  'arena-eve-alone', 'morning-after', 'fight', 'team-blame', 'partner-blame', 'throw-caught', 'jealousy', 'receipts',
  'old-show-grudge', 'overheard', 'kitchen-blowup', 'floater-callout', 'spark', 'party-deal', 'party-tears', 'expelled-victim',
  'injury-target', 'injury-care', 'home-gossip', 'home-guilt', 'ranking-beef', 'pass-panic', 'money-talk', 'bank-brag', 'redemption-watch', 'redemption-feud']);
const STORY = new Set(['gym-training', 'pool-games', 'house-dinner', 'beach-run', 'sunset-talk', 'bunk-whisper', 'deal', 'alliance-grow', 'alliance-switch', 'alliance-leave', 'alliance-end', 'apology', 'scheme-lie', 'loyalty-test',
  'ride-to-the-final', 'psyche', 'homesick', 'call-home', 'home-talk', 'gossip-backfire', 'ex-in-the-house', 'trash-talk',
  'vet-dismisses', 'vet-mentors-rookie', 'beach-date', 'hot-tub-truths', 'show-banter', 'rookie-hazing', 'throw', 'injury-healed', 'pass-flex']);
const WARM = new Set(['flirt', 'beach-date', 'spark', 'vet-mentors-rookie', 'apology', 'hot-tub-truths', 'arena-eve-pep']);
const ROW = new Set(['mock', 'gloat', 'payback', 'fight', 'fight-physical', 'kitchen-blowup', 'receipts', 'trash-talk', 'partner-blame', 'jealousy']);
const CAPS = { spark: 2, meeting: 2, recruit: 2, plea: 2, 'leverage-threat': 1, 'counter-pitch': 1, 'spare-deal': 1, 'arena-eve-pep': 2, 'arena-eve-alone': 1 };
const DAY_BUDGET = 7;   // non-must scenes per day, before the vote (or before the Arena)
const AFTER_BUDGET = 7; // ...and after it: the night after the vote, the night after the Arena
const ANCHOR = new Set(['voted-in', 'volunteer-in', 'arena']);

const baseTier = k => (MUST.has(k) ? 0 : DUE.has(k) ? 1 : STORY.has(k) ? 2 : 3);

// ── the cause, said plainly ──────────────────────────────────────────
// When a chapter's cause never aired, the scene opens by saying it. Each
// line names the people of the CAUSE, the right way round ({0} did it to {1}).
const RECAP = {
  'kitchen-blowup': 'Ever since the row in the kitchen, {0} and {1} have barely looked at each other.',
  'bunk-war': 'Since the fight over the bunk room, {0} and {1} have been sleeping with one eye open.',
  'trash-talk': '{0} and {1} have been needling each other every chance they get.',
  prank: 'The prank war between {0} and {1} is still going.',
  receipts: '{0} still hasn\'t let go of {1} saying {0.posAdj} name at the vote.',
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
  'alliance-leave': '{0} is out of the alliance {1} is in.',
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
      // (the Return is two people the Arena already sent home, fighting their way back: ep-twists.js)
      if (s.kind !== 'return-arena' && s.who.some(n => gone.has(n))) return false;
      // An alliance being spotted is news once; after that the house knows.
      if (s.kind === 'meeting-spotted' && filed[s.id]?.line.steps.some(x => x.step === 'spotted' && x.aired)) return false;
      const k = [...s.who].slice(0, 2).sort().join('|');
      // (never for a scene that must air: the Arena itself was dropped for a pair who had already had three)
      if (tier > 0 && s.who.length === 2 && (pairs[k] || 0) >= 3) return false;
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
    const firstAnchor = Math.min(...pool.filter(s => ANCHOR.has(s.kind)).map(s => s.id), Infinity);
    const half = s => (s.id > firstAnchor ? 1 : 0);
    const budget = [DAY_BUDGET, AFTER_BUDGET];
    for (const tier of [0, 1, 2, 3]) {
      // inside a tier: the stories already running first, then in time order
      const cands = pool.filter(s => !picked.has(s.id) && tierOf(s) === tier)
        .sort((x, y) => chapters(y) - chapters(x) || x.id - y.id);
      for (const s of cands) {
        if (tier > 0 && budget[half(s)] <= 0) continue;
        if (!ok(s, tier)) continue;
        take(s);
        if (tier > 0) budget[half(s)]--;
      }
    }
    const dayArcs = arcs.filter(a => a.day === day && a.who.every(n => !gone.has(n)));
    const pushArc = arc => {
      const sc = arcScene(state, arc, epRec.ep);
      const script = writeScene(state, sc);
      if (script) aired.push({ day, kind: arc.kind, scene: sc, script });
    };
    const heldArcs = {};
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
            // an alliance ending is told in the past: it opened on "has been meeting behind closed doors" (read 2026-10-16)
            const ending = ['alliance-end', 'alliance-leave'].includes(s.kind) && cs?.kind === 'meeting';
            const text = cs && (ending ? `${cs.who[0]}'s alliance used to meet behind closed doors.` : recapLine(state, cs));
            if (text) script = { ...script, lines: [{ kind: 'beat', by: null, text, recap: true }, ...script.lines],
              text: `(${text})\n${script.text}` };
          }
          f.step.aired = true;
        }
        aired.push({ day, kind: s.kind, scene: s, script });
      }
      // the arcs that follow this scene (the beast, the giant falling, the underdog, a running gag); after an
      // Arena, they wait for its goodbye, which belongs right after the duel (goodbye.js)
      const follow = dayArcs.filter(a => a.after === s.id);
      if (s.kind === 'arena' && pool.some(x => x.kind === 'arena-goodbye' && x.data?.loser === s.data?.loser)) heldArcs[s.data.loser] = follow;
      else for (const arc of follow) pushArc(arc);
      if (s.kind === 'arena-goodbye') for (const arc of heldArcs[s.data?.loser] || []) pushArc(arc);
    }
  }
  epRec.aired = eveningAfterTheDaily(keepWithTheDaily(morningFirst(aired)));
  return epRec.aired;
}

// What happened at the daily airs with the daily: a "that was the best I've ever done" confessional aired hours
// later at the villa, with nothing around it (the user, 2026-10-15: "this conversation makes no sense"). TJ's
// name gag is his line to somebody at the daily, so it goes there too.
const AT_THE_DAILY = new Set(['daily-clutch', 'daily-choke', 'partner-blame', 'partner-carried', 'team-blame', 'throw', 'throw-caught', 'run-name']);
// A scene whose words put it in the morning (breakfast, "good morning") airs at the start of its day, after the
// morning's fixtures (the user, 2026-10-16: "good morning to u too when its 7:20" in the evening): the clock
// spreads a day's scenes between its fixed times in airing order, so a breakfast aired late got an evening hour.
const MORNING_WORDS = /\b(good morning|breakfast|this morning|woke up|wakes up)\b|(?<!until |till )\bmorning\./i;   // "until morning." is a night
const NEXT_MORNING = new Set(['morning-after', 'arc-giant-falls', 'tj-at-breakfast']);   // vp-ch-ep/steps.js clockOf
const MORNING_FIXTURES = new Set(['previously', 'power-rankings', 'return-arena', 'return-walkin', 'redemption-return', 'arrival', 'villa-reveal', 'injury-healed']);
const MOVABLE = a => a.kind !== 'ceremony' && !ANCHOR.has(a.kind) && !MUST_ORDER.has(a.kind);
const MUST_ORDER = new Set(['daily', 'callout', 'arena', 'arena-goodbye', 'return', 'morning-after', 'purge', 'named-fallout', 'mock', 'gloat',
  // the final is told in the order it ran: TJ's "you stay out here until morning" opened the final before its start line
  'final-start', 'final-cp', 'instant-elimination', 'final-lastword', 'overnight', 'overnight-sabotage', 'overnight-talk', 'overnight-quit',
  'final-pact-help', 'final-pact-broken', 'final-podium', 'final-congrats', 'champions', 'champion-reflect']);
function morningFirst(aired) {
  const out = [];
  for (const day of [...new Set(aired.map(a => a.day))]) {
    const items = aired.filter(a => a.day === day);
    // a night out is never the morning, whatever its lines remember ("why didn't you say any of this this morning?"
    // put the club ahead of the daily, read 2026-10-16: "why is night out ... right after morning at the villa")
    const atNight = a => a.scene?.spot === 'party' || a.kind.startsWith('party');
    const isMorning = a => MOVABLE(a) && !atNight(a) && (a.script?.lines || []).some(l => MORNING_WORDS.test(l.text || ''));
    const head = [];
    while (items.length && MORNING_FIXTURES.has(items[0].kind)) head.push(items.shift());
    // the morning after an Arena is tomorrow (the viewer's clock moves it to the next day): it airs after the
    // Arena night, not in the middle of it, or the night that follows was clocked into the next morning too
    const arenaAt = items.findIndex(x => x.kind === 'arena');
    const tomorrow = x => arenaAt >= 0 && NEXT_MORNING.has(x.kind) && items.indexOf(x) > arenaAt;
    const today = items.filter(x => !tomorrow(x));
    out.push(...head, ...today.filter(isMorning), ...today.filter(a => !isMorning(a)), ...items.filter(tomorrow));
  }
  return out;
}

function keepWithTheDaily(aired) {
  const out = [];
  const days = new Set(aired.filter(a => a.kind === 'daily').map(a => a.day));
  const held = aired.filter(a => AT_THE_DAILY.has(a.kind) && days.has(a.day));
  for (const a of aired) {
    if (held.includes(a)) continue;
    out.push(a);
    if (a.kind === 'daily') out.push(...held.filter(h => h.day === a.day));
  }
  return out;
}

// The evening comes after the day (the user, 2026-10-16, of a talk at sunset and the night out airing before that
// day's daily): on a day with a daily, a scene set at sunset moves to just after the daily and what happened at it,
// before the night's party. A scene that must keep its place (MUST_ORDER, the ceremony) never moves.
const EVENING_WORDS = /\b(sunset|sun goes down|sun go down|the sun is going down|sundown)\b/i;
const isEvening = a => a.kind === 'sunset-talk' || (a.script?.lines || []).some(l => l.kind === 'beat' && EVENING_WORDS.test(l.text || ''));
function eveningAfterTheDaily(aired) {
  const out = [...aired];
  for (const day of new Set(out.filter(a => a.kind === 'daily').map(a => a.day))) {
    const at = out.findIndex(a => a.kind === 'daily' && a.day === day);
    const early = out.filter((a, i) => i < at && a.day === day && MOVABLE(a) && isEvening(a));
    if (!early.length) continue;
    for (const a of early) out.splice(out.indexOf(a), 1);
    const d = out.findIndex(a => a.kind === 'daily' && a.day === day);
    let k = d + 1;
    while (k < out.length && out[k].day === day && AT_THE_DAILY.has(out[k].kind)) k++;
    // and before the night: the first party scene of that day, if it comes sooner
    const party = out.findIndex((a, i) => i >= k && a.day === day && (a.scene?.spot === 'party' || a.kind.startsWith('party')));
    out.splice(party >= 0 ? party : k, 0, ...early);
  }
  return out;
}

export function airSeason(state) {
  let prev = null;
  for (const e of state.episodes) { airEpisode(state, e, prev); prev = e; }
  if (state.finalEp) airEpisode(state, state.finalEp, prev);
}

