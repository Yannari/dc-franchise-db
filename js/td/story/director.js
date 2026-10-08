// ══════════════════════════════════════════════════════════════════════
// td/story/director.js — which camp scenes an episode airs, and in what order
// ══════════════════════════════════════════════════════════════════════
//
// Spec docs/superpowers/specs/2026-10-07-td-storylines-design.md §1b, §2. The real
// shows air 8–10 camp scenes an episode, a few of them long and connected; the sim
// had ~60 short unrelated ones. This runs once an episode, after it has been
// played (text-backlog generateSummaryText → scriptPendingScenes), touches no game
// state, and builds ep.campStory: per camp and phase, the scenes that air.
//
//   - the morning after a vote: the camp wakes up one person short (new scene);
//   - after a team challenge: the losing team's blame, the winners' relief (new scene);
//   - storyline steps: each camp event that is a chapter of a storyline (storylines.js)
//     is filed; the most dramatic, best-connected ones air as whole scenes written
//     from the story pools (write.js), or in their own words when no pool exists yet;
//   - quick cuts: a few short moments between the long ones, as the show cuts away;
//   - nobody forgotten: every living camper speaks at camp every episode (the user,
//     2026-10-07; the real shows let people vanish for ten episodes, this does not).
//
// ep.campStory[camp][phase] is a list of { ref: <index into that phase's events> }
// (a moment airing in its own words) or a written scene { story: true, lines, ... }.
// Everything the engine wrote stays in ep.campEvents, unchanged: consequences,
// badges and every other reader are untouched. Viewers read the list through
// feed.js campFeed().
import { gs } from '../../core.js';
import { getBond } from '../../bonds.js';
import { classify, file, prevAired } from './storylines.js';
import { writeStory as writeRaw, hasStoryPool } from './write.js';
import { lastTribalOf, challengeOf, lossStreak, bootsBefore } from './record.js';
import { numberWord } from '../script/write.js';
import { registerOf, factsFor } from '../script/facts.js';

// Where the season lives decides a few words ({quarters}, {bed}) and what campers can know:
// at a venue that reads the votes aloud (the Elimination Trial) everyone hears the count; at a
// marshmallow, Gilded Chris or barf bag ceremony nobody does (fact 'count').
const VENUE_WORDS = {
  'hosted-camp': { quarters: 'cabin', bed: 'bunk', count: false, item: 'marshmallow' },
  'film-lot': { quarters: 'trailer', bed: 'bunk', count: false, item: 'Gilded Chris' },
  'world-tour': { quarters: 'cabin', bed: 'seat', count: false, item: 'barf bag' },
  'survival-island': { quarters: 'shelter', bed: 'sleeping spot', count: true, item: 'vote' },
  carnival: { quarters: 'shelter', bed: 'sleeping bag', count: true, item: 'vote' },
};
let venueNow = 'hosted-camp';
let ctxAvoid = () => null;
function writeStory(pool, outcome, who, data, facts, ctx) {
  const v = VENUE_WORDS[venueNow] || VENUE_WORDS['hosted-camp'];
  return writeRaw(pool, outcome, who, { quarters: v.quarters, bed: v.bed, item: v.item, ...data }, { venue: venueNow, count: v.count, ...facts }, ctx);
}

// How much each step is worth on screen (narrative weighting only).
const DRAMA = {
  'alliance.formed': 7, 'alliance.recruit': 5, 'alliance.refused': 5, 'alliance.checkin': 4, 'alliance.crack': 7, 'alliance.end': 8,
  'alliance.betrayal': 9, 'alliance.deal': 6,
  'rivalry.friction': 5, 'rivalry.blowup': 8, 'rivalry.truce': 6, 'rivalry.cold': 4,
  'showmance.spark': 5, 'showmance.kiss': 7, 'showmance.official': 6, 'showmance.jealous': 7, 'showmance.breakup': 9, 'showmance.targeted': 6,
  'bottom.noticed': 4, 'bottom.scramble': 6, 'bottom.targeted': 6,
  'scheme.move': 7, 'scheme.caught': 9,
  'friendship.bond': 3, 'friendship.drift': 5,
  'underdog.rise': 4,
  'idol.found': 7, 'idol.shared': 6, 'idol.search': 3, 'idol.known': 6,
};
const dramaOf = (type, step) => DRAMA[`${type}.${step}`] ?? 3;

const eventsOf = (ep, camp, phase) => {
  const block = ep.campEvents?.[camp];
  return phase === 'pre' ? (Array.isArray(block) ? block : (block?.pre || [])) : (Array.isArray(block) ? [] : (block?.post || []));
};
const saysIn = ev => [...new Set((ev?.lines || []).filter(l => l.kind === 'say' && l.by).map(l => l.by))];
const speaksIn = ev => [...new Set((ev?.lines || []).filter(l => (l.kind === 'say' || l.kind === 'conf') && l.by).map(l => l.by))];

function membersOf(ep, camp) {
  const t = (ep.tribesAtStart || []).find(x => x.name === camp);
  if (t) return [...t.members];
  // the merged camp: everybody who started the episode
  const all = (ep.tribesAtStart || []).flatMap(x => x.members || []);
  return all.length ? [...new Set(all)] : [...new Set([...(ep.tribalPlayers || []), ...eventsOf(ep, camp, 'pre').flatMap(e => e.players || [])])];
}

// the scene's facts: what the event knew when it fired, plus what the story knows
function storyFacts(ev, extra) {
  const base = { ...(ev?.scene?.facts || {}) };
  return { ...base, ...extra };
}

function recordSlots(ep, a, b, camp, phase) {
  const data = {}, facts = {};
  const lt = a ? lastTribalOf(a, ep.num) : null;
  if (lt && lt.gap === 1) {
    data.lastBoot = lt.boot;
    facts.lastBoot = true;
    facts.voted = lt.myVote ? (lt.votedBoot ? 'boot' : 'other') : 'none';
    if (lt.myVote && !lt.votedBoot && lt.myVote !== a) { data.myVote = lt.myVote; facts.myVote = true; }
    facts.blindside = !!lt.blindside;
    facts.gotVotes = lt.against > 0;
    data.bootVotes = numberWord(lt.bootVotes);
  }
  // b's own ballot is b's secret: a line may only rely on it when b says it (b's own words)
  const ltB = b ? lastTribalOf(b, ep.num) : null;
  if (ltB && ltB.gap === 1) facts.votedB = ltB.myVote ? (ltB.votedBoot ? 'boot' : 'other') : 'none';
  if (phase === 'post' && !ep.isMerge && !gs.isMerged) {
    const ch = challengeOf(ep, camp);
    if (ch) {
      facts.lost = ch.lost; facts.won = ch.won;
      if (ch.sank && ch.sank !== a && ch.sank !== b) { data.sank = ch.sank; facts.sank = true; }
      if (ch.carried && ch.carried !== a && ch.carried !== b) { data.carried = ch.carried; facts.carried = true; }
      facts.sankA = ch.sank === a; facts.carriedA = ch.carried === a;
      facts.sankB = !!b && ch.sank === b; facts.carriedB = !!b && ch.carried === b;
      const streak = ch.lost ? lossStreak(camp, ep.num, ep) : 0;
      facts.streak = streak >= 3 ? 'many' : streak === 2 ? 'two' : streak === 1 ? 'one' : 'none';
      data.streak = numberWord(streak);
    }
  }
  return { data, facts };
}

// How big the alliance in the scene is, and whether a or b is in another one: a line that says
// "three votes" needs three members, one that says "my first alliance" needs it to be.
function allianceFacts(ev, who, data) {
  const name = data.group || ev.alliance || data.alliance || null;
  const al = name ? (gs.namedAlliances || []).find(x => x.name === name) : null;
  const size = (ev.members || al?.members || []).length;
  const others = n => (gs.namedAlliances || []).some(x => x.active !== false && x.name !== name && (x.members || []).includes(n));
  return { members: size >= 4 ? 'many' : size || null, aOther: !!who.a && others(who.a), bOther: !!who.b && others(who.b) };
}

// ── the new scenes ─────────────────────────────────────────────────────

// The morning after a vote: whoever was closest to the person who left, and somebody who wrote
// their name down. Only a camp that was AT that vote wakes up to it.
function morningAfter(ep, camp, members, n) {
  const present = members;
  const lts = present.map(m => [m, lastTribalOf(m, ep.num)]).filter(([, lt]) => lt && lt.gap === 1);
  if (lts.length < 2) return null;
  const boot = lts[0][1].boot;
  if (!boot || present.includes(boot)) return null;
  // a = the one who feels it most (closest to the boot); b = someone who did it
  const byBond = [...lts].sort((x, y) => getBond(y[0], boot) - getBond(x[0], boot) || x[0].localeCompare(y[0]));
  const [a, ltA] = byBond[0];
  const voters = lts.filter(([m, lt]) => m !== a && lt.votedBoot);
  const b = (voters.find(([, lt]) => lt.planTarget === boot) || voters[0] || byBond[1])?.[0];
  if (!b) return null;
  const others = present.filter(m => m !== a && m !== b && m !== boot);
  const c = others.sort((x, y) => getBond(a, y) - getBond(a, x) || x.localeCompare(y))[0] || null;
  const bondBoot = getBond(a, boot);
  const outcome = bondBoot <= -2 ? 'relief' : bondBoot < 2 ? 'nobody' : ltA.votedBoot ? 'agreed' : 'blindside';
  const who = { a, b, c };
  const data = { lastBoot: boot, bootVotes: numberWord(ltA.bootVotes), target: boot };
  const facts = { ...factsFor({ who, data: {} }, { ep: ep.num, phase: 'pre' }), outcome, lastBoot: true,
    voted: ltA.votedBoot ? 'boot' : 'other', unanimous: !!ltA.unanimous, bVoted: lts.find(([m]) => m === b)?.[1]?.votedBoot ? 'boot' : 'other', third: !!c };
  const w = writeStory('story.morning', outcome, who, data, facts, { ep: ep.num, camp, phase: 'pre', n, place: 'sleep', avoid: ctxAvoid('morning') });
  return w ? { story: true, kind: 'story.morning', storyType: 'morning', step: outcome, players: [a, b, c].filter(Boolean), lines: w.lines, text: w.text, lineId: w.lineId,
    scene: { kind: 'story.morning', who, data, spot: w.spot ? { ...w.spot, window: 'morning' } : null }, badgeText: 'The Morning After', badgeClass: outcome === 'blindside' ? 'red' : '', why: [`${boot} went home last night, ${data.bootVotes} votes.`] } : null;
}

// After a team challenge: the losers find someone to blame; the winners exhale.
function afterChallenge(ep, camp, members, n) {
  if (ep.isMerge || gs.isMerged) return null;
  const ch = challengeOf(ep, camp);
  if (!ch || (!ch.lost && !ch.won)) return null;
  if (ch.lost) {
    const b = ch.sank;
    // the blamer: whoever talks loudest about it — a fiery or scheming teammate, else the one who carried
    const loud = members.filter(m => m !== b && ['fiery', 'schemer'].includes(registerOf(m)))
      .sort((x, y) => getBond(x, b) - getBond(y, b) || x.localeCompare(y))[0];
    const a = loud || (ch.carried !== b ? ch.carried : ch.order[0]);
    if (!a || a === b) return null;
    const c = members.filter(m => m !== a && m !== b).sort((x, y) => getBond(b, y) - getBond(b, x) || x.localeCompare(y))[0] || null;
    const who = { a, b, c };
    const streak = lossStreak(camp, ep.num, ep);
    const data = { sank: b, carried: ch.carried !== a ? ch.carried : null, streak: numberWord(streak), tribe: camp };
    if (!data.carried) delete data.carried;
    const facts = { ...factsFor({ who, data: {} }, { ep: ep.num, phase: 'post' }), outcome: 'blame', third: !!c, carriedA: ch.carried === a,
      carried: !!data.carried, streak: streak >= 3 ? 'many' : streak === 2 ? 'two' : 'one', registerB: registerOf(b) };
    const w = writeStory('story.chal', 'lost', who, data, facts, { ep: ep.num, camp, phase: 'post', n, place: 'public', avoid: ctxAvoid('return') });
    return w ? { story: true, kind: 'story.chal.lost', storyType: 'chal', step: 'lost', players: [a, b, c].filter(Boolean), lines: w.lines, text: w.text, lineId: w.lineId,
      scene: { kind: 'story.chal', who, data, spot: w.spot ? { ...w.spot, window: 'return' } : null }, badgeText: 'Who Lost It', badgeClass: 'red',
      why: [`${camp} lost${streak > 1 ? ` (${numberWord(streak)} in a row)` : ''}. ${b} had the team's lowest score; ${ch.carried} the highest.`] } : null;
  }
  const a = ch.carried;
  const b = members.filter(m => m !== a).sort((x, y) => getBond(a, y) - getBond(a, x) || x.localeCompare(y))[0];
  if (!a || !b) return null;
  const who = { a, b, c: ch.sank !== a && ch.sank !== b ? ch.sank : null };
  const data = { carried: a, tribe: camp };
  const facts = { ...factsFor({ who, data: {} }, { ep: ep.num, phase: 'post' }), outcome: 'won', third: !!who.c };
  const w = writeStory('story.chal', 'won', who, data, facts, { ep: ep.num, camp, phase: 'post', n, place: 'public', avoid: ctxAvoid('return') });
  return w ? { story: true, kind: 'story.chal.won', storyType: 'chal', step: 'won', players: [a, b, who.c].filter(Boolean), lines: w.lines, text: w.text, lineId: w.lineId,
    scene: { kind: 'story.chal', who, data, spot: w.spot ? { ...w.spot, window: 'return' } : null }, badgeText: 'Safe Tonight', badgeClass: 'green', why: [`${camp} won. ${a} had the team's best score.`] } : null;
}

// Somebody the episode has not heard from: a confessional about where they stand.
function coverScene(ep, camp, phase, name, n) {
  const lt = lastTribalOf(name, ep.num);
  const lines = (gs.tdStory?.lines || []).filter(l => l.people.includes(name) && l.steps.some(s => s.aired));
  const state = lt && lt.gap === 1 && lt.against > 0 ? 'votes' : lines.some(l => l.type === 'alliance') ? 'allied' : lines.length ? 'thread' : 'quiet';
  const who = { a: name };
  const data = lt && lt.gap === 1 ? { lastBoot: lt.boot } : {};
  const facts = { ...factsFor({ who, data: {} }, { ep: ep.num, phase }), outcome: state, lastBoot: !!data.lastBoot, phase };
  const w = writeStory('story.cover', state, who, data, facts, { ep: ep.num, camp, phase, n, place: 'confessional' });
  return w ? { story: true, kind: 'story.cover', storyType: 'cover', step: state, players: [name], lines: w.lines, text: w.text, lineId: w.lineId,
    scene: { kind: 'story.cover', who, data, spot: { id: 'confessional' } }, badgeText: '', badgeClass: '' } : null;
}

// ── the director ───────────────────────────────────────────────────────

/** Build ep.campStory. Idempotent: an episode that already has one is left alone. */
export function airTdEpisode(ep) {
  if (!ep || ep.campStory || !ep.campEvents || !Object.keys(ep.campEvents).length) return;
  if (gs.bb || ep.isFinale) return;
  venueNow = VENUE_WORDS[ep.campAccess?.setting] ? ep.campAccess.setting : 'hosted-camp';
  const seasonAired = ((gs.tdStory ||= {}).aired ||= {});
  const story = {};
  let n = 0;
  for (const camp of Object.keys(ep.campEvents)) {
    const members = membersOf(ep, camp);
    const tribalTonight = !!(ep.tribalPlayers || []).some(p => members.includes(p)) && (ep.isMerge || gs.isMerged || ep.tribalTribe === camp || ep.loser?.name === camp);
    const spoke = new Set();
    const out = { pre: [], post: [] };
    for (const phase of ['pre', 'post']) {
      const events = eventsOf(ep, camp, phase);
      // file every moment of the phase into its storyline
      const filed = [];
      events.forEach((ev, i) => {
        if (!ev || ev.aired != null) return;
        const c = classify(ev);
        if (!c) return;
        const { line, step } = file(c, { ep: ep.num, phase, camp, order: i });
        filed.push({ ev, i, line, step });
      });
      const list = [];
      // the spots taken in each stretch of the day, so two talks are never staged on top of each other
      const taken = {};
      const avoidIn = win => (taken[win || 'any'] ||= new Set());
      ctxAvoid = avoidIn;
      // the opener
      const opener = phase === 'pre' ? (ep.num > 1 ? morningAfter(ep, camp, members, n++) : null) : afterChallenge(ep, camp, members, n++);
      if (opener) list.push({ at: -1, item: opener });
      // the storyline steps worth a scene
      const merged = ep.isMerge || gs.isMerged;
      const cap = phase === 'pre' ? (merged ? 4 : 3) : tribalTonight ? (merged ? 5 : 4) : 2;
      const onScreen = {};
      opener?.players.forEach(p => { onScreen[p] = (onScreen[p] || 0) + 1; });
      const score = f => dramaOf(f.line.type, f.step.step)
        + (f.line.steps.some(s => s.aired) ? 3 : 0)
        + (phase === 'post' && tribalTonight && ['bottom', 'alliance', 'scheme'].includes(f.line.type) ? 2 : 0)
        - 0.6 * (seasonAired[`${f.line.type}.${f.step.step}`] || 0)
        + (f.ev.scene?.kind && hasStoryPool(`long.${f.ev.scene.kind}`) ? 1.5 : 0);
      const ranked = filed.slice().sort((x, y) => score(y) - score(x) || x.i - y.i);
      const usedLines = new Set();
      const chosen = [];
      for (const f of ranked) {
        if (chosen.length >= cap) break;
        if (usedLines.has(f.line)) continue;
        const cast = [f.step.roles.a, f.step.roles.b, f.step.roles.c].filter(Boolean);
        if (cast.some(p => (onScreen[p] || 0) >= 2)) continue;
        chosen.push(f);
        usedLines.add(f.line);
        cast.forEach(p => { onScreen[p] = (onScreen[p] || 0) + 1; });
      }
      for (const f of chosen) {
        const { ev, i, line, step } = f;
        const prev = prevAired(line, step);
        // The long scene is a fuller version of the engine's OWN moment: its kind and ending say
        // exactly what happened (lines/*.js headers in td/script), so the long pool is keyed on
        // them, and it plays the same people in the same parts. The storyline adds what came before.
        const kind = ev.scene?.kind || '';
        const ending = ev.scene?.data?.ending || 'any';
        const who = { ...(ev.scene?.who || { a: step.roles.a, b: step.roles.b, c: step.roles.c }) };
        const rec = recordSlots(ep, who.a, who.b, camp, phase);
        const data = { ...rec.data, ...(ev.scene?.data || {}) };
        const facts = { ...factsFor({ who, data: {} }, { ep: ep.num, phase, tribal: tribalTonight }), ...(ev.scene?.facts || {}), ...rec.facts,
          ...Object.fromEntries(['ending', 'result', 'intent', 'reason', 'again', 'size'].filter(k => ev.scene?.data?.[k] != null).map(k => [k, ev.scene.data[k]])),
          ...Object.fromEntries(['rival', 'friend', 'threat', 'weak', 'group', 'plan', 'boot', 'wrote', 'fallen', 'more', 'betrayer', 'holder', 'wins', 'other', 'target'].map(k => [k, !!data[k]])),
          story: line.type, step: step.step, prev: prev ? prev.step : 'none', chapter: Math.min(3, line.steps.filter(s => s.aired).length + 1),
          prevGap: prev ? (ep.num - prev.ep >= 3 ? 'long' : ep.num === prev.ep ? 'same' : 'recent') : 'none',
          tribal: tribalTonight, phase, third: !!who.c, known: !!data.target && !Object.values(who).includes(data.target),
          ...allianceFacts(ev, who, data) };
        const pool = kind ? `long.${kind}` : null;
        const w = pool && hasStoryPool(pool) ? writeStory(pool, ending, who, data, facts, { ep: ep.num, camp, phase, n: n++, place: 'aside', spotId: ev.scene?.spot?.id || ev.access?.locationId || null, avoid: ctxAvoid(ev.scene?.spot?.window || ev.access?.windowId) }) : null;
        step.aired = true;
        ev.aired = true;
        seasonAired[`${line.type}.${step.step}`] = (seasonAired[`${line.type}.${step.step}`] || 0) + 1;
        if (w) {
          list.push({ at: i, item: { story: true, kind: pool, storyType: line.type, step: step.step, storyline: line.id, ref: i, type: ev.type,
            players: [...new Set([...Object.values(who).filter(Boolean), ...(ev.players || [])])],
            lines: w.lines, text: w.text, lineId: w.lineId, scene: { kind, who, data, spot: w.spot ? { ...w.spot, window: ev.scene?.spot?.window || ev.access?.windowId || null } : (ev.scene?.spot || null) }, access: ev.access || null,
            alliance: ev.alliance, members: ev.members, advType: ev.advType,
            badgeText: ev.badgeText || '', badgeClass: ev.badgeClass || '' } });
        } else list.push({ at: i, item: { ref: i, storyline: line.id } });
      }
      // quick cuts: short moments between the long scenes, new faces first
      const shown = new Set(list.flatMap(x => x.item.players || speaksIn(events[x.item.ref])));
      const cuts = events.map((ev, i) => ({ ev, i })).filter(({ ev }) => ev && !ev.aired && saysIn(ev).length && (ev.lines || []).length <= 7)
        .sort((x, y) => saysIn(y.ev).filter(p => !shown.has(p)).length - saysIn(x.ev).filter(p => !shown.has(p)).length || x.i - y.i);
      const cutCap = phase === 'pre' ? 3 : 2;
      for (const { ev, i } of cuts) {
        if (list.filter(x => !x.item.story && !x.item.storyline).length >= cutCap) break;
        if (!saysIn(ev).some(p => !shown.has(p))) continue;
        ev.aired = true;
        saysIn(ev).forEach(p => shown.add(p));
        list.push({ at: i, item: { ref: i } });
      }
      list.sort((x, y) => x.at - y.at);
      for (const x of list) {
        const ev = x.item.lines ? x.item : events[x.item.ref];
        speaksIn(ev).forEach(p => spoke.add(p));
      }
      out[phase] = list.map(x => x.item);
    }
    // nobody forgotten: a camper this camp has not heard from all episode gets a moment of their own
    const alive = members;
    for (const name of alive) {
      if (spoke.has(name)) continue;
      // their own moment, if the engine gave them one
      let placed = false;
      for (const phase of ['post', 'pre']) {
        const events = eventsOf(ep, camp, phase);
        const i = events.findIndex(ev => ev && !ev.aired && speaksIn(ev).includes(name) && (ev.lines || []).length <= 8);
        if (i >= 0) {
          events[i].aired = true;
          out[phase].push({ ref: i });
          speaksIn(events[i]).forEach(p => spoke.add(p));
          placed = true;
          break;
        }
      }
      if (placed) continue;
      const phase = out.post.length ? 'post' : 'pre';
      const sc = coverScene(ep, camp, phase, name, n++);
      if (sc) { out[phase].push(sc); spoke.add(name); }
    }
    // the refs that were added late go back into the camp's own order
    for (const phase of ['pre', 'post']) {
      const at = it => (it.ref != null ? it.ref : it.kind === 'story.morning' || it.kind?.startsWith('story.chal') ? -1 : 1e6);
      out[phase].sort((x, y) => at(x) - at(y));
    }
    story[camp] = out;
  }
  ep.campStory = story;
}
