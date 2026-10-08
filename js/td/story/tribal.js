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
  const strat = x => pStatsOf(x)?.strategic || 0;
  const best = x => Math.max(-10, ...tribal.filter(y => y !== x).map(y => getBond(x, y)));
  // every question that fits tonight: [topic, priority, who, data, facts]
  const cand = [];
  const add = (topic, pri, who, data = {}, extra = {}) => cand.push({ topic, pri, who, data, extra });
  // a public blowup today (the story layer aired it)
  const story = ep.campStory?.[camp] || {};
  const aired = [...(story.pre || []), ...(story.post || [])];
  const fight = aired.find(it => /^long\.(drama\.(bomb|fight|dispute|clash|explode|meltdown|dig)|blame\.loss)/.test(it?.kind || '')
    && it.scene?.who?.a && it.scene?.who?.b && tribal.includes(it.scene.who.a) && tribal.includes(it.scene.who.b));
  if (fight) add('fight', 9, { a: fight.scene.who.a, b: fight.scene.who.b }, {}, { aVoted: ballotOf(fight.scene.who.a) === fight.scene.who.b ? 'b' : 'other' });
  // the one going home
  const mine = ballotOf(elim);
  const knows = (ep.pitchIntel || []).some(i => i.knower === elim && i.target === elim && i.believed !== false)
    || (ep.pitchCounterplay || []).some(c => c.actor === elim);
  if (knows && mine && mine !== elim && tribal.includes(mine)) add('scramble', 8, { a: elim, b: mine }, { target: mine });
  else if (forBoot.length) {
    const shifty = [...forBoot].sort((x, y) => getBond(elim, y) - getBond(elim, x) || x.localeCompare(y))[0];
    add('confident', 6, { a: elim, b: shifty }, {}, { close: getBond(elim, shifty) >= 3 });
  }
  // the challenge
  if (ch?.sank && tribal.includes(ch.sank) && ch.sank !== elim) {
    const side = tribal.filter(x => x !== ch.sank).sort((x, y) => Math.abs(getBond(ch.sank, y)) - Math.abs(getBond(ch.sank, x)) || x.localeCompare(y))[0];
    if (side) add('sank', 7, { a: ch.sank, b: side }, {}, { defends: getBond(ch.sank, side) >= 1 });
  }
  // who is running tonight
  const pitch = (ep.votePitches || []).find(p => p.pitchTarget === elim && forBoot.includes(p.pitcher));
  const leader = pitch?.pitcher || [...forBoot].sort((x, y) => strat(y) - strat(x) || x.localeCompare(y))[0];
  const loser = tribal.find(x => x !== elim && x !== leader && ballotOf(x) && ballotOf(x) !== elim);
  if (leader && loser) add('leader', 5, { a: leader, b: loser });
  // burned last time
  const last = [...(gs.episodeHistory || [])].reverse().find(h => h.num < ep.num && h.eliminated && (h.votingLog || []).some(v => tribal.includes(v.voter)));
  const burned = last ? tribal.find(x => { const v = (last.votingLog || []).find(b => b.voter === x)?.voted; return !!v && v !== last.eliminated; }) : null;
  if (burned) add('burned', 5, { a: burned }, { lastBoot: last.eliminated }, { lastBoot: true });
  // a pair
  const pairs = [];
  for (const x of tribal) for (const y of tribal) if (x < y && getBond(x, y) >= 6) pairs.push([x, y]);
  if (pairs.length) add('pair', 4, { a: pairs[0][0], b: pairs[0][1] });
  // immunity
  const imm = [ep.immunityWinner, ...(ep.extraImmune || [])].find(x => x && tribal.includes(x));
  if (imm) add('immune', 5, { a: imm, b: tribal.find(x => x !== imm && x !== elim) || null });
  // the outsider: nobody here is close to them
  const lone = tribal.filter(x => x !== elim && best(x) <= 1).sort((x, y) => best(x) - best(y) || x.localeCompare(y))[0];
  if (lone) add('outsider', 5, { a: lone, b: tribal.filter(x => x !== lone).sort((x, y) => getBond(lone, y) - getBond(lone, x) || x.localeCompare(y))[0] });
  // a suspected idol holder
  const has = (s, x) => !!s && (typeof s.has === 'function' ? s.has(x) : Array.isArray(s) && s.includes(x));
  const idolMan = tribal.find(x => has(gs.knownIdolHoldersPersistent, x) || has(gs.knownIdolHoldersThisEp, x));
  if (idolMan) add('idol', 7, { a: idolMan, b: tribal.filter(x => x !== idolMan).sort((x, y) => strat(y) - strat(x) || x.localeCompare(y))[0] });
  // the first merged vote: old lines or new ones
  if (ep.isMerge) {
    const old = ep.tribesAtStart || [];
    const tribeOf = x => old.find(t => (t.members || []).includes(x))?.name;
    const x = tribal.find(p => p !== elim), y = x ? tribal.find(p => p !== elim && tribeOf(p) && tribeOf(p) !== tribeOf(x)) : null;
    if (x && y) add('merge', 8, { a: x, b: y });
  }
  // the end of the game is close
  if ((ep.isMerge || gs.isMerged) && tribal.length <= 6) {
    const x = [...tribal].filter(p => p !== elim).sort((p, q) => strat(q) - strat(p) || p.localeCompare(q))[0];
    if (x) add('endgame', 6, { a: x, b: tribal.filter(p => p !== x && p !== elim).sort((p, q) => getBond(x, q) - getBond(x, p) || p.localeCompare(q))[0] });
  }
  // a question to the room, when nothing else is sharp enough
  { const r = [...tribal].filter(p => p !== elim).sort((p, q) => (pStatsOf(q)?.boldness || 0) - (pStatsOf(p)?.boldness || 0) || p.localeCompare(q));
    if (r.length >= 3) add('room', 2, { a: r[0], b: r[1], c: r[2] }); }
  // the opener: the host warms the room up on the day before the sharp questions (the user: "who
  // starts a tribal like this"): a lost challenge, or for the merged tribe how camp feels
  { const r = [...tribal].filter(p => p !== elim).sort((p, q) => (pStatsOf(q)?.social || 0) - (pStatsOf(p)?.social || 0) || p.localeCompare(q));
    const openWho = { a: ch?.carried && tribal.includes(ch.carried) && ch.carried !== elim ? ch.carried : r[0], b: r.find(x => x !== (ch?.carried || r[0])) };
    if (openWho.a && openWho.b) {
      // what the day had in it, for the host to ask about: who won immunity, who went home last time
      const imm = [].concat(ep.immunityWinner || []).find(x => tribal.includes(x) && !Object.values(openWho).includes(x)) || null;
      const lastBoot = (gs.episodeHistory || []).find(h => h.num === ep.num - 1)?.eliminated || null;
      const facts = { ...factsFor({ who: openWho, data: {} }, { ep: ep.num, phase: 'tribal' }), ...base, register: registerOf(openWho.a), pair: true, sank: !!ch?.sank, imm: !!imm, lastBoot: !!lastBoot };
      const w = writeStory(`tqa.open.${ch && !(ep.isMerge || gs.isMerged) ? 'lost' : 'merged'}`, 'any', { ...openWho, h: host }, { ...(ch?.sank ? { sank: ch.sank } : {}), ...(imm ? { imm } : {}), ...(lastBoot ? { lastBoot } : {}) }, facts, ctx(nextN(), 'tribal', 'soft'));
      if (w) out.push({ topic: 'open', players: Object.values(openWho), lines: w.lines });
    }
  }
  // rotation: a question the host asked at the last two votes waits its turn
  const mem = ((gs.tdStory ||= {}).qaUse ||= {});
  const score = c => c.pri - ((ep.num - (mem[c.topic] ?? -99)) <= 2 ? 4 : 0) + ((ep.num * 7 + c.topic.length * 3) % 5) * 0.2;
  cand.sort((x, y) => score(y) - score(x) || x.topic.localeCompare(y.topic));
  for (const c of cand) {
    if (out.filter(x => x.topic !== 'open').length >= 3) break;
    const cast = Object.values(c.who).filter(Boolean);
    if (cast.some(p => used.has(p))) continue;
    const facts = { ...factsFor({ who: c.who, data: {} }, { ep: ep.num, phase: 'tribal' }), ...base, register: registerOf(c.who.a), third: !!c.who.c, pair: !!c.who.b, ...c.extra };
    const w = writeStory(`tqa.${c.topic}`, 'any', { ...c.who, h: host }, c.data, facts, ctx(nextN(), 'tribal', 'soft'));
    if (!w) continue;
    cast.forEach(p => used.add(p));
    mem[c.topic] = ep.num;
    out.push({ topic: c.topic, players: cast, lines: w.lines });
  }
  return out;
}

// ── the advantages played tonight: the room reacts (the user: "there's no reaction when someone
// plays an advantage") ──────────────────────────────────────────────────────────────────────
// One exchange per play, right after it lands (vp-td-ep/steps.js plays it after the play's card).
// a plays it. b is who it's on (the one it protects, the stolen or blocked voter, the vote's target);
// c is somebody in the room it hits hardest: a voter whose votes it cancels, or b's closest friend.
//   adv.idol.<saved|nothing>   a plays an idol for a.self; saved: votes on a will be cancelled
//   adv.idolfor.<saved|nothing> a plays it for b
//   adv.misplay / adv.fake    it does nothing; fake: it was never real
//   adv.extra   a casts a second vote (on {target} when known)
//   adv.steal   a takes b's vote
//   adv.block   a blocks b's vote
//   adv.sole    a is the only vote tonight
//   adv.safety  a walks out, safe, without voting
//   adv.kip     a steals b's advantage
// ep.tribalStory.plays = [{ idx (into ep.idolPlays), player, lines }].
function playReactions(ep, { tribal, ballots, base, ctx, nextN }) {
  const host = seasonConfig?.host || 'Chris';
  const out = [];
  (ep.idolPlays || []).forEach((p, idx) => {
    if (!tribal.includes(p.player)) return;
    const a = p.player;
    const on = p.playedFor || p.stolenFrom || p.blockedPlayer || null;
    const protects = !p.type || p.type === 'legacy' ? (p.playedFor || a) : null;
    // c: a voter who wrote the protected name (their vote just died), else b's (or a's) closest friend
    const wasted = protects ? ballots.filter(v => v.voted === protects && v.voter !== a && v.voter !== protects).map(v => v.voter) : [];
    const friendOf = x => tribal.filter(y => y !== a && y !== on && y !== x).sort((m, n) => getBond(x, n) - getBond(x, m) || m.localeCompare(n))[0] || null;
    let pool, ending = 'any';
    if (!p.type || p.type === 'legacy') {
      if (p.fake) pool = 'adv.fake';
      else if (p.misplay) pool = 'adv.misplay';
      else pool = p.playedFor && p.playedFor !== a ? 'adv.idolfor' : 'adv.idol';
      if (!p.fake && !p.misplay) ending = (p.votesNegated || 0) > 0 ? 'saved' : 'nothing';
    } else pool = { extraVote: 'adv.extra', voteSteal: 'adv.steal', voteBlock: 'adv.block', soleVote: 'adv.sole', safetyNoPower: 'adv.safety', kip: 'adv.kip' }[p.type];
    if (!pool) return;
    const b = on && tribal.includes(on) && on !== a ? on : null;
    const c = wasted[0] || (p.type === 'soleVote' ? (p.silencedPlayers || []).find(x => tribal.includes(x)) : null) || friendOf(b || a);
    const target = p.target && tribal.includes(p.target) ? p.target : null;
    const who = { a, ...(b ? { b } : {}), ...(c ? { c } : {}), h: host };
    const facts = { ...factsFor({ who, data: {} }, { ep: ep.num, phase: 'tribal' }), ...base, register: registerOf(a), third: !!c, pair: !!b, target: !!target, cWasted: !!wasted[0] };
    const w = writeStory(pool, ending, who, target ? { target } : {}, facts, ctx(nextN(), 'tribal', 'soft'));
    if (w) out.push({ idx, player: a, lines: w.lines });
  });
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
  // what each voter's day was, from the vote scenes that aired (director.js voteTalk): who ran a plan
  // and the case they made, who was in on it, who got pitched, who had doubts. The booth says that, so
  // the reason under each name is the one the viewer watched (the user, 2026-10-08: "the reasoning in
  // the voting booth doesn't represent the real reasoning; someone spearheading a vote should be more
  // confident"). A voter none of it touched falls back to the engine's own reason (whyOf).
  const voteScenes = Object.values(ep.campStory || {}).flatMap(c => [...(c.pre || []), ...(c.post || [])]).filter(x => x?.storyType === 'vote' && x.scene);
  const CASE = { weak: 'sank', plan: 'numbers' };
  const caseOfKind = k => { const c = String(k || '').split('.').pop(); return CASE[c] || c; };
  const roleOf = v => {
    const plans = voteScenes.filter(x => ['plan', 'other'].includes(x.step) && x.scene.data?.target === v.voted);
    const led = plans.find(x => x.scene.who?.a === v.voter);
    if (led) return { role: 'lead', scene: led, cs: caseOfKind(led.kind) };
    const sat = plans.find(x => (x.players || []).includes(v.voter));
    if (sat) return { role: 'with', scene: sat, cs: caseOfKind(sat.kind), leader: sat.scene.who?.a };
    const sw = voteScenes.find(x => x.step === 'swing' && x.scene.who?.b === v.voter && x.scene.data?.target === v.voted);
    if (sw) return { role: 'swing', scene: sw, pitcher: sw.scene.who?.a };
    const dt = voteScenes.find(x => x.step === 'doubt' && x.scene.who?.a === v.voter);
    if (dt) return { role: 'doubt', scene: dt, held: /holds$/.test(dt.kind || '') };
    return null;
  };
  const CASES = new Set(['coming', 'sank', 'idol', 'pair', 'group', 'grudge', 'threat', 'outsider', 'numbers']);
  for (const v of ballots) {
    const why = whyOf(v, ep);
    const r = v.voter === elim ? null : roleOf(v);
    if (r && whyOf(v, ep) !== 'flip') {
      const sd = r.scene.scene.data || {};
      const cs = CASES.has(r.cs) ? r.cs : 'numbers';
      const who = { a: v.voter };
      const d = { target: v.voted, ...(r.leader && r.leader !== v.voter ? { leader: r.leader } : {}), ...(r.pitcher ? { pitcher: r.pitcher } : {}),
        ...(sd.partner ? { partner: sd.partner } : {}), ...(sd.theirs ? { theirs: sd.theirs } : {}), ...(sd.mark ? { mark: sd.mark } : {}) };
      const facts = { ...factsFor({ who, data: {} }, { ep: ep.num, phase: 'tribal' }), ...base, register: registerOf(v.voter), band: bandOf(v.voter, v.voted),
        sankT: !!ch && ch.sank === v.voted, leader: !!d.leader, mark: !!d.mark, markMe: d.mark === v.voter, markLeader: !!d.mark && d.mark === d.leader,
        ally: (gs.namedAlliances || []).some(al => (al.members || []).includes(v.voter) && (al.members || []).includes(v.voted)) };
      const pool = `booth2.${r.role}`;
      const ending = r.role === 'lead' || r.role === 'with' ? cs : r.role === 'doubt' ? (r.held ? 'holds' : 'breaks') : 'yes';
      // nobody in the booth says what the voter before them said: a fresh line first, then the case's least used, then .any
      const wr = (e, u) => writeStory(pool, e, who, d, facts, ctx(n++, 'tribal', u));
      const two = r.role === 'lead' || r.role === 'with';
      const said = new Set(booth.map(b => b.line));
      const fresh = x => (x && !said.has(x.lines.map(l => l.text).join(' ')) ? x : null);
      const w = fresh(wr(ending, true)) || (two ? fresh(wr('any', true)) : null) || fresh(wr(ending, 'soft')) || (two ? fresh(wr('any', 'soft')) : null);
      if (w) { booth.push({ voter: v.voter, voted: v.voted, why, role: r.role, line: w.lines.map(l => l.text).join(' ') }); continue; }
    }
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
  // b only says sorry for a vote b cast (the user: Owen apologising for a vote he never wrote)
  const revealFacts = { ...factsFor({ who: { a: ra, b: rb }, data: {} }, { ep: ep.num, phase: 'tribal' }), ...base, register: registerOf(ra), third: !!rc, bVoted: forBoot.includes(rb) ? 'boot' : 'other' };
  // a boot who was never warned (no word reached them, no counter-move of their own) did not see it
  // coming: 'surprised', unless a friend's vote makes it a blindside
  const knewBoot = (ep.pitchIntel || []).some(i => i.knower === elim && i.target === elim && i.believed !== false) || (ep.pitchCounterplay || []).some(c => c.actor === elim);
  const revealKind = blindside ? 'blindside' : knewBoot ? 'expected' : 'surprised';
  const rv = rb ? (writeStory('reveal', revealKind, { a: ra, b: rb, c: rc }, data, revealFacts, ctx(n++)) || (revealKind === 'surprised' ? writeStory('reveal', 'expected', { a: ra, b: rb, c: rc }, data, revealFacts, ctx(n++)) : null)) : null;

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
  const plays = playReactions(ep, { tribal, ballots, base, ctx, nextN: () => n++ });
  return { qa, plays, booth, reveal: rv?.lines || [], revealKind, room, blindside, shocking, exit: ex?.lines || [], exitWith, exitKind, after: after.slice(0, roomBlind ? 4 : 2) };
}
