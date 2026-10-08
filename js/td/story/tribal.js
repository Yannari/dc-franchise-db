// ══════════════════════════════════════════════════════════════════════
// td/story/tribal.js — the elimination as the shows air it
// ══════════════════════════════════════════════════════════════════════
//
// The user, 2026-10-07: "nothing interesting is said in the voting booth, no last words,
// no reaction after elimination from anybody — it's just bland"; and "we need to see all
// the votes, not just 2 or 3 — the classic version has hindsight and data; the goal wasn't
// to lose it but to add even more". Measured on DC and TDI (spec §1b): every voter at the
// urn with a reason, a confrontation at the reading when it's a blindside, last words with
// the boot's person (or a parting shot), then a confessional or two.
//
// Words only, written once the episode has been played (director.js airTdEpisode). The
// steps (vp-td-ep/steps.js tdTribalScreen) play them; the ballots, the tally and each
// ballot's engine reason in the side panel stay exactly as they were.
import { gs, seasonConfig } from '../../core.js';
import { getBond } from '../../bonds.js';
import { pStats as pStatsOf } from '../../players.js';
import { registerOf, factsFor } from '../script/facts.js';
import { writeStory } from './write.js';
import { challengeOf } from './record.js';

// Why a ballot was cast, from the engine's own reason (voting.js). Narrative reading only.
export function whyOf(v, ep) {
  const r = String(v.reason || '').toLowerCase();
  if (v.voter === ep.eliminated) return 'self';
  if (/organizing against|struck back|warned .* was/.test(r)) return 'strike';
  // a flip is breaking from the group (the reason says so) or from a final-three pact; a
  // planBreak alone only means the name was in the voter's private endgame plan (intentions.js)
  if (/negotiated flip|broke own bloc|stated plan was|bold move|stepped aside/.test(r) || v.planBreak?.pactBroken) return 'flip';
  if (/protecting|stays safe|absorbs the vote|shield/.test(r)) return 'shield';
  if (/weakest|pulled their weight|liability|lost a .*challenge|dead weight|slow/.test(r)) return 'weak';
  if (/threat|too smart|running the game|complete player|jury|too many friends|everyone's friend|winning|dangerous|strong/.test(r)) return 'threat';
  if (/rubs them|hostility|feels off|calculated|consequence|helped eliminate|grudge|can't stand|never liked|personal/.test(r)) return 'grudge';
  return 'plan';
}

const VENUE_COUNT = { 'survival-island': true, carnival: true };
const ITEM = { 'hosted-camp': 'marshmallow', 'film-lot': 'Gilded Chris', 'world-tour': 'barf bag', 'survival-island': 'vote', carnival: 'vote' };
const bandOf = (a, b) => { const x = getBond(a, b); return x <= -3 ? 'enemies' : x < 0 ? 'cold' : x < 3 ? 'neutral' : 'friends'; };

/** The words of the night: { booth, reveal, exit, exitWith, after } or null. */
// ── the questions: the host asks about what happened, not a script ──────────────────────────
// The user, 2026-10-08: "the elimination trial is generic and not human, robotic and repetitive".
// The host knows what the cameras saw today, so the questions come from that, three at most, in
// the order a host would go for them:
//   fight      a public blowup at camp today: the one who started it answers, the other cuts in
//   scramble   the one going home knows it: they plead, or go after the name they want instead
//   confident  the one going home doesn't know: sure of themselves; a voter of theirs can't look up
//   sank       they cost the team the challenge (pre-merge): a defender or a critic cuts in
//   leader     the one running tonight's plan is asked who's running things, and deflects; someone
//              on the losing side says it out loud
//   burned     their plan failed at the last vote: are they on the right side this time?
//   pair       two people who always vote together: is it a bloc?
// Each topic is a short exchange (tqa.<topic>.any): h is the host, a the one asked, b who cuts in.
function tribalQA(ep, { tribal, ballots, elim, ch, camp, base, ctx, nextN }) {
  const out = [];
  const used = new Set();
  const ballotOf = x => ballots.find(v => v.voter === x)?.voted || null;
  const forBoot = ballots.filter(v => v.voted === elim && v.voter !== elim).map(v => v.voter);
  const host = seasonConfig?.host || 'Chris';
  const ask = (topic, who, data = {}, extra = {}) => {
    if (out.length >= 3) return;
    const cast = Object.values(who).filter(Boolean);
    if (cast.some(p => used.has(p))) return;
    const facts = { ...factsFor({ who, data: {} }, { ep: ep.num, phase: 'tribal' }), ...base, register: registerOf(who.a), third: !!who.c, ...extra };
    const w = writeStory(`tqa.${topic}`, 'any', { ...who, h: host }, data, facts, ctx(nextN(), 'tribal', 'soft'));
    if (!w) return;
    cast.forEach(p => used.add(p));
    out.push({ topic, players: cast, lines: w.lines });
  };
  // a public blowup today (the story layer aired it)
  const story = ep.campStory?.[camp] || ep.campStory?.[gs.mergeName || 'merge'] || {};
  const aired = [...(story.pre || []), ...(story.post || [])];
  const fight = aired.find(it => /^long\.(drama\.(bomb|fight|dispute|clash|explode|meltdown|dig)|blame\.loss)/.test(it?.kind || '')
    && it.scene?.who?.a && it.scene?.who?.b && tribal.includes(it.scene.who.a) && tribal.includes(it.scene.who.b));
  if (fight) ask('fight', { a: fight.scene.who.a, b: fight.scene.who.b }, {}, { aVoted: ballotOf(fight.scene.who.a) === fight.scene.who.b ? 'b' : 'other' });
  // the one going home
  const mine = ballotOf(elim);
  const knows = (ep.pitchIntel || []).some(i => i.knower === elim && i.target === elim && i.believed !== false)
    || (ep.pitchCounterplay || []).some(c => c.actor === elim);
  if (knows && mine && mine !== elim && tribal.includes(mine)) ask('scramble', { a: elim, b: mine }, { target: mine });
  else if (forBoot.length) {
    const shifty = [...forBoot].sort((x, y) => getBond(elim, y) - getBond(elim, x) || x.localeCompare(y))[0];
    ask('confident', { a: elim, b: shifty }, {}, { close: getBond(elim, shifty) >= 3 });
  }
  // the challenge
  if (ch?.sank && tribal.includes(ch.sank) && ch.sank !== elim) {
    const side = tribal.filter(x => x !== ch.sank).sort((x, y) => Math.abs(getBond(ch.sank, y)) - Math.abs(getBond(ch.sank, x)) || x.localeCompare(y))[0];
    if (side) ask('sank', { a: ch.sank, b: side }, {}, { defends: getBond(ch.sank, side) >= 1 });
  }
  // who is running tonight
  const pitch = (ep.votePitches || []).find(p => p.pitchTarget === elim && forBoot.includes(p.pitcher));
  const strat = x => pStatsOf(x)?.strategic || 0;
  const leader = pitch?.pitcher || [...forBoot].sort((x, y) => strat(y) - strat(x) || x.localeCompare(y))[0];
  const loser = tribal.find(x => x !== elim && x !== leader && ballotOf(x) && ballotOf(x) !== elim);
  if (leader && loser) ask('leader', { a: leader, b: loser });
  // burned last time: their ballot at the last vote did not go on the one who left
  const last = [...(gs.episodeHistory || [])].reverse().find(h => h.num < ep.num && h.eliminated && (h.votingLog || []).some(v => tribal.includes(v.voter)));
  const burned = last ? tribal.find(x => { const v = (last.votingLog || []).find(b => b.voter === x)?.voted; return !!v && v !== last.eliminated; }) : null;
  if (burned) ask('burned', { a: burned }, { lastBoot: last.eliminated }, { lastBoot: true });
  // a pair
  const pairs = [];
  for (const x of tribal) for (const y of tribal) if (x < y && getBond(x, y) >= 6) pairs.push([x, y]);
  if (pairs.length) ask('pair', { a: pairs[0][0], b: pairs[0][1] });
  return out;
}

/** The words of the night (see the header). */
export function writeTribal(ep) {
  const elim = ep?.eliminated;
  const tribal = ep?.tribalPlayers || [];
  if (!elim || !tribal.includes(elim)) return null;
  const ballots = (ep.votingLog || []).filter(v => v.voter && v.voted && tribal.includes(v.voter));
  if (ballots.length < 2) return null;
  const venue = ITEM[ep.campAccess?.setting] ? ep.campAccess.setting : 'hosted-camp';
  const count = !!VENUE_COUNT[venue];
  const merged = !!(ep.isMerge || gs.isMerged);
  const camp = ep.tribalTribe || null;
  const ch = camp && !merged ? challengeOf(ep, camp) : null;
  const base = { venue, count, merged, late: merged && tribal.length <= 6 };
  const ctx = (n, phase = 'tribal', unique = true) => ({ ep: ep.num, camp: camp || 'merge', phase, n, place: 'confessional', unique });
  const data = { lastBoot: elim, item: ITEM[venue] || 'vote' };
  let n = 1000;

  // ── the booth: every voter, their reason, their voice ──
  const booth = [];
  for (const v of ballots) {
    const why = whyOf(v, ep);
    // the voter's group by name, only when it is a real alliance (not tonight's 'Anti-X Bloc')
    const named = new Set((gs.namedAlliances || []).map(al => al.name));
    const plan = (ep.alliances || []).find(al => (al.members || []).includes(v.voter) && al.target === v.voted && named.has(al.label));
    const who = { a: v.voter };
    const facts = { ...factsFor({ who, data: {} }, { ep: ep.num, phase: 'tribal' }), ...base, register: registerOf(v.voter),
      band: bandOf(v.voter, v.voted), group: !!plan?.label, sankT: !!ch && ch.sank === v.voted };
    const d = { target: v.voted, group: plan?.label || null };
    let w = writeStory('booth', why, who, d, facts, ctx(n++, 'tribal', false));
    if (!w && why !== 'plan') w = writeStory('booth', 'plan', who, d, facts, ctx(n++, 'tribal', false));
    booth.push({ voter: v.voter, voted: v.voted, why, line: w ? w.lines.map(l => l.text).join(' ') : `${v.voted}.` });
  }

  // ── the reading: how the one going home takes it ──
  const forBoot = ballots.filter(v => v.voted === elim && v.voter !== elim).map(v => v.voter);
  const others = tribal.filter(x => x !== elim);
  const closest = [...others].sort((x, y) => getBond(elim, y) - getBond(elim, x) || x.localeCompare(y));
  const bootVote = ballots.find(v => v.voter === elim)?.voted || null;
  const betrayer = closest.find(x => forBoot.includes(x) && getBond(elim, x) >= 1);
  const blindside = !!bootVote && bootVote !== elim && !!betrayer;
  const ra = elim, rb = blindside ? betrayer : closest[0];
  const rc = others.find(x => x !== rb) || null;
  const revealFacts = { ...factsFor({ who: { a: ra, b: rb }, data: {} }, { ep: ep.num, phase: 'tribal' }), ...base, register: registerOf(ra), third: !!rc };
  const rv = rb ? writeStory('reveal', blindside ? 'blindside' : 'expected', { a: ra, b: rb, c: rc }, data, revealFacts, ctx(n++)) : null;

  // ── last words: their person, or the person they blame ──
  const friend = closest.find(x => getBond(elim, x) >= 2) || null;
  const enemy = [...others].filter(x => forBoot.includes(x)).sort((x, y) => getBond(elim, x) - getBond(elim, y))[0];
  const shot = !friend && enemy && getBond(elim, enemy) <= -2 ? enemy : null;
  const exitKind = friend ? 'friend' : shot ? 'shot' : 'alone';
  const exitWith = friend || shot || null;
  const exFacts = { ...factsFor({ who: { a: elim, b: exitWith }, data: {} }, { ep: ep.num, phase: 'tribal' }), ...base, register: registerOf(elim),
    bVoted: exitWith ? (forBoot.includes(exitWith) ? 'boot' : 'other') : 'none' };
  const ex = writeStory('exit', exitKind, { a: elim, b: exitWith }, data, exFacts, ctx(n++));

  // ── after: who did it, and who lost their person ──
  const after = [];
  const plans = (ep.alliances || []).filter(al => al.target === elim);
  const architect = forBoot.filter(x => plans.some(al => (al.members || []).includes(x)))
    .sort((x, y) => getBond(elim, x) - getBond(elim, y) || x.localeCompare(y))[0] || forBoot[0];
  const guilty = forBoot.find(x => getBond(elim, x) >= 3 && x !== architect);
  const mourner = closest.find(x => !forBoot.includes(x) && getBond(elim, x) >= 3);
  const conf = (kind, who) => {
    if (!who) return;
    const f = { ...factsFor({ who: { a: who }, data: {} }, { ep: ep.num, phase: 'tribal' }), ...base, register: registerOf(who), lastBoot: true };
    const w = writeStory('after', kind, { a: who }, data, f, ctx(n++));
    if (w) after.push(...w.lines);
  };
  if (blindside || !mourner) conf('architect', architect);
  if (mourner) conf('friend', mourner);
  else if (guilty) conf('guilty', guilty);
  // the shock card is for a real one: somebody close to the boot wrote the name
  const shocking = blindside && getBond(elim, betrayer) >= 3;

  // ── the room: a blindside lands on everybody it touches, not only the one leaving (the user) ──
  // A plan that did not happen means somebody walked in sure of another name. Who reacts, and how,
  // is what they did: 'hurt' wrote another name and just lost their person; 'burned' was on a plan
  // that failed (their name for it is {target}); 'relieved' was that plan's target and is still here;
  // 'pleased' made it happen. One line each, at the reading, then the burned and the relieved to camera.
  const ballotOf = x => ballots.find(v => v.voter === x)?.voted || null;
  const failed = (ep.alliances || []).filter(al => al.target && al.target !== elim && tribal.includes(al.target)
    && (al.members || []).some(m => m !== elim && tribal.includes(m) && ballotOf(m) === al.target));
  const room = [];
  const roomBlind = blindside || failed.length > 0;
  let burned = null, relieved = null;
  if (roomBlind) {
    const used = new Set([ra, rb].filter(Boolean));
    const react = (kind, x, d = {}) => {
      if (!x || used.has(x)) return false;
      const f = { ...factsFor({ who: { a: x, b: elim }, data: {} }, { ep: ep.num, phase: 'tribal' }), ...base, register: registerOf(x), lastBoot: true };
      const w = writeStory('room', kind, { a: x, b: elim }, { ...data, ...d }, f, ctx(n++, 'tribal', 'soft'));
      if (!w) return false;
      used.add(x); room.push(...w.lines);
      return true;
    };
    const hurt = others.filter(x => ballotOf(x) && ballotOf(x) !== elim && getBond(x, elim) >= 2)
      .sort((x, y) => getBond(elim, y) - getBond(elim, x) || x.localeCompare(y))[0] || null;
    const plan = failed.sort((x, y) => (y.members || []).length - (x.members || []).length)[0] || null;
    const onPlan = plan ? (plan.members || []).filter(m => others.includes(m) && ballotOf(m) === plan.target && m !== hurt)
      .sort((x, y) => (pStatsOf(y)?.strategic || 0) - (pStatsOf(x)?.strategic || 0) || x.localeCompare(y)) : [];
    relieved = plan && others.includes(plan.target) ? plan.target : null;
    react('hurt', hurt);
    if (react('burned', onPlan[0], { target: plan?.target })) burned = onPlan[0];
    if (!react('relieved', relieved)) relieved = null;
    react('pleased', architect);
    const camConf = (kind, who, d = {}) => {
      if (!who) return;
      const f = { ...factsFor({ who: { a: who }, data: {} }, { ep: ep.num, phase: 'tribal' }), ...base, register: registerOf(who), lastBoot: true };
      const w = writeStory('after', kind, { a: who }, { ...data, ...d }, f, ctx(n++, 'tribal', 'soft'));
      if (w) after.push(...w.lines);
    };
    camConf('burned', burned, { target: plan?.target });
    if (relieved !== architect) camConf('relieved', relieved);
  }
  // the host's questions, from what happened today
  const qa = tribalQA(ep, { tribal, ballots, elim, ch, camp: camp || gs.mergeName || 'merge', base, ctx, nextN: () => n++ });
  return { qa, booth, reveal: rv?.lines || [], room, blindside, shocking, exit: ex?.lines || [], exitWith, exitKind, after: after.slice(0, roomBlind ? 4 : 2) };
}
