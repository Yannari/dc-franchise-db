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
import { pastOf, isReturnee } from '../past.js';
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

// ── what the ballot really is (booth3: lines/n-booth3.js) ──
// The engine's own reason, read for its case AND the names and details inside it (who warned them, who
// they are protecting, the stat that keeps losing, what kind of threat), plus what the alliances wanted
// tonight and who the voter is to the name they write. The user, 2026-10-10: "the vote reasoning is too
// vague, not voice flavoured, and doesn't represent the relationship, the episode, the alliance or the
// strategy". whyOf above keeps its seven words for the older pools.
const AREA = { physical: 'anything physical', endurance: 'anything that takes stamina', mental: 'the puzzles', social: 'anything that takes teamwork' };
export function truthOf(v, ep, { tribal = [], named = new Set() } = {}) {
  const raw = String(v.reason || ''), r = raw.toLowerCase();
  const inRoom = n => !!n && tribal.includes(n) && n !== v.voter && n !== v.voted;
  const bond = getBond(v.voter, v.voted);
  const mine = (gs.namedAlliances || []).find(al => al.active !== false && (al.members || []).includes(v.voter) && (al.members || []).includes(v.voted));
  // an alliance or a pact with somebody the voter has come to dislike is not a friendship: Spud wrote
  // Lorenzo at -4.3 and said "you're my friend"; the pact is still the story, said coldly (facts.band)
  const pact = !!v.planBreak?.pactBroken;
  // they found they share something (director.js kindredOf): writing that name is its own story
  const kin = gs.tdStory?.kindred?.[v.voter < v.voted ? `${v.voter}||${v.voted}` : `${v.voted}||${v.voter}`];
  const kindred = kin && !kin.broken ? kin.tone : null;
  const rel = pact ? 'pact' : mine && bond >= 0 ? 'ally' : bond >= 3 ? 'close' : bond <= -3 ? 'enemy' : bond < 0 ? 'cold' : 'plain';
  const d = { target: v.voted };
  if (mine) d.mine = mine.name;
  // tonight's named plans that had the voter in them
  const blocs = (ep.alliances || []).filter(al => (al.members || []).includes(v.voter) && al.target && named.has(al.label));
  const chosen = blocs.find(al => al.target === v.voted), broken = blocs.find(al => al.target !== v.voted);
  let kase = null;
  const warner = (raw.match(/\[PITCH EXPOSED\]\s*(.+?) warned /) || [])[1];
  const joined = (raw.match(/joined (.+?)'s (?:pitch|response)/) || [])[1];
  const locked = +((raw.match(/locking in (\d+) votes/) || [])[1] || 0);
  const alt = (raw.match(/shifted from (.+?) to |moved off (.+?) once|considered (.+?), but|weighed (.+?);|heard the case for (.+?), but|(.+?) remained an option/) || []).slice(1).find(Boolean);
  const WORD = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
  if (inRoom(warner)) { kase = 'strike'; d.warner = warner; }
  else if (/\[miscommunication\]/.test(r)) kase = 'mixup';
  else if (/\[overplaying\]|whispered too loudly/.test(r)) kase = 'overplay';
  else if (/organized the move|organizing|spearhead/.test(r) && !joined) { kase = 'organized'; if (WORD[locked]) d.locked = WORD[locked]; }
  else if (inRoom(joined)) { kase = 'joined'; d.pitcher = joined; }
  else if (/shifted from|moved off/.test(r) && inRoom(alt?.trim())) { kase = 'shifted'; d.alt = alt.trim(); }
  else if (/\[held commitment\]/.test(r) && inRoom(alt?.trim())) { kase = 'held'; d.alt = alt.trim(); }
  else if (/preemptive|being targeted|coming their way|organizing the vote against|self-defense|struck before|felt the heat|saw the move forming|identified the source/.test(r)) kase = 'coming';
  else if (chosen && broken) { kase = 'between'; d.group = chosen.label; d.other = broken.label; }
  else if (broken && !chosen && /broke own bloc|stated plan|bold move|negotiated flip|couldn't pull the trigger|refused to write/.test(r)) {
    kase = 'break'; d.other = broken.label; if (inRoom(broken.target)) d.wanted = broken.target;
  }
  if (!kase) {
    const keep = (raw.match(/protecting (.+?)(?: —| at )|(.+?) is untouchable|write (.+?)'s name|(.+?) is their person|keeping (.+?) safe|couldn't vote (.+?),|(.+?) stays safe|real target was (.+?) but/) || []).slice(1).find(Boolean);
    if (inRoom(keep?.trim())) { kase = 'shield'; d.keep = keep.trim(); }
  }
  let tkind = null;
  if (!kase && /dead weight|pulled their weight|weak in|weakest|liability|lost a .*challenge|can't afford to keep losing|injur|hurt —|no challenge value/.test(r)) {
    kase = 'weak';
    const st = (r.match(/(?:especially in|weak in) (physical|endurance|mental|social)/) || [])[1];
    if (st) d.area = AREA[st];
  }
  if (!kase && /jury|final tribal|ftc|wins the game|threat|dangerous|too smart|running the game|puppeteer|orchestrat|complete player|likeable|everyone's friend|playing all angles|playing well enough|keeps coming up|been a target|third time|amulet|legacy advantage|inherit/.test(r)) {
    kase = 'threat';
    tkind = /keeps coming up|been a target|third time/.test(r) ? 'overdue'
      : /likeable|everyone's friend|real bonds|social threat/.test(r) ? 'social'
      : /jury|final tribal|ftc|wins the game/.test(r) ? 'jury'
      : /running the game|puppeteer|orchestrat|too smart|playing all angles|strategic|complete player/.test(r) ? 'game'
      : /challenge|immunity|physical/.test(r) ? 'strong' : null;
  }
  if (!kase && /animosity|hostility|from day one|simmering|distrust|tension|rubs them|too much history|friction|grudge|personal|can't stand/.test(r)) kase = 'grudge';
  if (!kase && /gut feeling|reads people|feels calculated|can't shake|doesn't sit right|never gave them|feels off|can't fully commit|hasn't clicked/.test(r)) kase = 'gut';
  if (!kase) { kase = 'plan'; if (chosen) d.group = chosen.label; }
  return { case: kase, rel, d, tkind, kindred };
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
  // a pitch to turn on a friend that the friend heard about today (camp-events.js turnFriend, 'warned': the one asked went
  // and told): everybody knows, so the host asks the friend, and the one who pitched it is sitting right there
  // (the user, 2026-10-14: "the suspense, the shock at tribal")
  const turned = aired.find(it => /pitch\.turn/.test(it?.kind || '') && it.scene?.data?.ending === 'warned');
  if (turned) {
    const { a: pit, b: asked, c: friend } = turned.scene.who || {};
    if ([pit, asked, friend].every(x => x && tribal.includes(x)) && new Set([pit, asked, friend]).size === 3) add('turned', 9, { a: friend, b: pit, c: asked });
  }
  // a lie the cameras saw today, believed (talk.lie, plot.lie): the host asks where the trouble is, with the liar and the
  // one it was about at the same fire; nothing said exposes it (n-tqa5.js)
  const lie = aired.find(it => /^(long\.)?(talk|plot)\.lie/.test(it?.kind || '') && it.scene?.data?.target && ['about', 'believed'].includes(it.scene?.data?.ending));
  if (lie) {
    const liar = lie.scene.who?.a, told = lie.scene.who?.b, subj = lie.scene.data.target;
    if ([liar, told, subj].every(x => x && tribal.includes(x)) && new Set([liar, told, subj]).size === 3) add('lied', 8, { a: told, b: liar, c: subj });
  }
  // ── who is in danger tonight: everybody who is, not only the one going home ──
  // The user, 2026-10-12: "the structure spoiled who is eliminated, they always focus more on the person getting
  // the boot". Measured on 52 played tribals: the boot was one of the people asked 85% of the time against a fair
  // 64%, with 1.5 times everybody else's lines, because this asked the boot alone whether they felt safe. Now the
  // question goes to the people the night is really about, chosen without looking at who leaves: anybody a ballot
  // or a plan named, anybody scared (paranoid, desperate), anybody seen working camp to save themselves (the
  // engine's scramble, alliances.js). Each gets the same scene the boot used to get, so a decoy who survives looks
  // exactly like the one who doesn't. Two of them at most, in an order the outcome has no part in.
  const safe = new Set([].concat(ep.immunityWinner || [], ep.extraImmune || []));
  const votesOn = {};
  for (const v of ballots) if (v.voter !== v.voted) votesOn[v.voted] = (votesOn[v.voted] || 0) + 1;
  const planned = new Set((ep.alliances || []).map(al => al.target).filter(Boolean));
  const scared = x => ['paranoid', 'desperate'].includes(gs.playerStates?.[x]?.emotional);
  const working = new Set(Object.keys(ep._debugScramble || {}));
  const heard = x => (ep.pitchIntel || []).some(i => i.knower === x && i.target === x && i.believed !== false)
    || (ep.pitchCounterplay || []).some(c => c.actor === x) || working.has(x) || scared(x);
  const danger = tribal.filter(x => !safe.has(x) && (votesOn[x] || planned.has(x) || scared(x) || working.has(x)));
  const hashOf = x => { let h = 2166136261; for (const c of `${ep.num}|danger|${x}`) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };
  const order = [...danger].sort((p, q) => hashOf(p) - hashOf(q) || p.localeCompare(q));
  // only one name in danger: asked half the nights, so a quiet night does not mean a unanimous one
  const take = order.length >= 2 ? order.slice(0, 2) : order.length && hashOf(order[0]) % 2 ? order : [];
  take.forEach((x, k) => {
    const wrote = ballotOf(x);
    const onX = ballots.filter(v => v.voted === x && v.voter !== x).map(v => v.voter);
    const pri = 7 - k * 0.5;
    if (heard(x) && wrote && wrote !== x && tribal.includes(wrote)) add('scramble', pri, { a: x, b: wrote }, { target: wrote }, { onA: onX.length ? 'yes' : 'no' });
    else if (onX.length) {
      // b is writing a's name tonight, whoever a is: the one going home, or the one who survives it
      const shifty = [...onX].sort((p, q) => getBond(x, q) - getBond(x, p) || p.localeCompare(q))[0];
      add('confident', pri, { a: x, b: shifty }, {}, { close: getBond(x, shifty) >= 3 });
    } else {
      // scared for nothing (nobody writes them): somebody close talks them down, or doesn't
      const pal = tribal.filter(p => p !== x).sort((p, q) => getBond(x, q) - getBond(x, p) || p.localeCompare(q))[0];
      if (pal) add('nervous', pri, { a: x, b: pal }, {}, { close: getBond(x, pal) >= 3 });
    }
  });
  // ── the classic Tribal's moments (vp-screens.js rpBuildTribal), now said at the fire ──
  // caught working the room at the vote (episode.js [3] OVERPLAYING): votes flipped onto them for it
  const ovp = ep.overplayer;
  if (ovp?.player && tribal.includes(ovp.player)) {
    const flipped = (ovp.votersFlipped || []).find(x => tribal.includes(x));
    if (flipped) add('overplay', 9, { a: ovp.player, b: flipped }, {}, { two: (ovp.votersFlipped || []).length >= 2 });
  }
  // the hothead who blows up at the person organizing against them (episode.js TRIBAL DISRUPTION)
  const dis = ep.tribalDisruption;
  if (dis?.disruptor && dis.organizer && tribal.includes(dis.disruptor) && tribal.includes(dis.organizer))
    add('disrupt', 9.5, { a: dis.disruptor, b: dis.organizer }, {}, { helped: !!dis.helped });
  // seen checked out at camp (camp-events.js comfort blindspot): the host noticed too
  const out0 = ep.comfortBlindspotPlayer;
  if (out0 && tribal.includes(out0)) {
    const saw = tribal.filter(p => p !== out0).sort((p, q) => (pStatsOf(q)?.intuition || 0) - (pStatsOf(p)?.intuition || 0) || p.localeCompare(q))[0];
    if (saw) add('checkedout', 6, { a: out0, b: saw });
  }
  // the challenge
  if (ch?.sank && tribal.includes(ch.sank)) {
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
  if (imm) add('immune', 5, { a: imm, b: tribal.filter(x => x !== imm).sort((x, y) => hashOf(x) - hashOf(y))[0] || null });
  // the outsider: nobody here is close to them
  const lone = tribal.filter(x => best(x) <= 1).sort((x, y) => best(x) - best(y) || x.localeCompare(y))[0];
  if (lone) add('outsider', 5, { a: lone, b: tribal.filter(x => x !== lone).sort((x, y) => getBond(lone, y) - getBond(lone, x) || x.localeCompare(y))[0] });
  // a returnee: the host brings up what really happened to them last time (td/past.js, the ledger), and
  // somebody new cuts in. Sharpest early, while it is still the thing everybody knows about them.
  // ...once a returnee a season: the second time it's a rerun (read: Connor asked the same question twice)
  const vetAsked = ((gs.tdStory ||= {}).vetAsked ||= {});
  const vet = tribal.filter(x => pastOf(x) && !vetAsked[x]).sort((x, y) => (pastOf(y).kind === 'won') - (pastOf(x).kind === 'won') || x.localeCompare(y))[0];
  if (vet) {
    const nb = tribal.filter(x => x !== vet && !isReturnee(x)).sort((x, y) => strat(y) - strat(x) || x.localeCompare(y))[0];
    add('returnee', ep.num <= 4 ? 6 : 4, { a: vet, ...(nb ? { b: nb } : {}) });
  }
  // a suspected idol holder
  const has = (s, x) => !!s && (typeof s.has === 'function' ? s.has(x) : Array.isArray(s) && s.includes(x));
  const idolMan = tribal.find(x => has(gs.knownIdolHoldersPersistent, x) || has(gs.knownIdolHoldersThisEp, x));
  if (idolMan) add('idol', 7, { a: idolMan, b: tribal.filter(x => x !== idolMan).sort((x, y) => strat(y) - strat(x) || x.localeCompare(y))[0] });
  // the first merged vote: old lines or new ones
  if (ep.isMerge) {
    const old = ep.tribesAtStart || [];
    const tribeOf = x => old.find(t => (t.members || []).includes(x))?.name;
    const x = [...tribal].sort((p, q) => hashOf(p) - hashOf(q))[0], y = x ? tribal.find(p => tribeOf(p) && tribeOf(p) !== tribeOf(x)) : null;
    if (x && y) add('merge', 8, { a: x, b: y });
  }
  // the end of the game is close
  if ((ep.isMerge || gs.isMerged) && tribal.length <= 6) {
    const x = [...tribal].sort((p, q) => strat(q) - strat(p) || p.localeCompare(q))[0];
    if (x) add('endgame', 6, { a: x, b: tribal.filter(p => p !== x).sort((p, q) => getBond(x, q) - getBond(x, p) || p.localeCompare(q))[0] });
  }
  // a question to the room, when nothing else is sharp enough
  { const r = [...tribal].sort((p, q) => (pStatsOf(q)?.boldness || 0) - (pStatsOf(p)?.boldness || 0) || p.localeCompare(q));
    if (r.length >= 3) add('room', 2, { a: r[0], b: r[1], c: r[2] }); }
  // the opener: the host warms the room up on the day before the sharp questions (the user: "who
  // starts a tribal like this"): a lost challenge, or for the merged tribe how camp feels
  { const r = [...tribal].sort((p, q) => (pStatsOf(q)?.social || 0) - (pStatsOf(p)?.social || 0) || p.localeCompare(q));
    const openWho = { a: ch?.carried && tribal.includes(ch.carried) ? ch.carried : r[0], b: r.find(x => x !== (ch?.carried || r[0])) };
    if (openWho.a && openWho.b) {
      // what the day had in it, for the host to ask about: who won immunity, who went home last time
      const imm = [].concat(ep.immunityWinner || []).find(x => tribal.includes(x) && !Object.values(openWho).includes(x)) || null;
      const lastBoot = (gs.episodeHistory || []).find(h => h.num === ep.num - 1)?.eliminated || null;
      const facts = { ...factsFor({ who: openWho, data: {} }, { ep: ep.num, phase: 'tribal' }), ...base, register: registerOf(openWho.a), pair: true, sank: !!ch?.sank, imm: !!imm, lastBoot: !!lastBoot };
      // (fresh only: the opener is asked every night, and a recycled one is the most noticeable repeat at the fire, read
      // 2026-10-14; when this season has heard them all, the host goes straight to the sharp questions)
      const w = writeStory(`tqa.open.${(ep.isMerge || gs.isMerged) ? 'merged' : 'lost'}`, 'any', { ...openWho, h: host }, { ...(ch?.sank ? { sank: ch.sank } : {}), ...(imm ? { imm } : {}), ...(lastBoot ? { lastBoot } : {}) }, facts, ctx(nextN(), 'tribal', true));
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
    if (c.topic === 'returnee') (gs.tdStory.vetAsked ||= {})[c.who.a] = ep.num;
    out.push({ topic: c.topic, players: cast, lines: w.lines, id: w.lineId });
  }
  // whoever answered the opener isn't asked the very next question (read: Owen, twice in a row)
  const op = out.findIndex(x => x.topic === 'open');
  const near = x => x.players.some(p => out[op].players.includes(p));
  if (op >= 0 && out[op + 1] && near(out[op + 1])) {
    const j = out.findIndex((x, i) => i > op + 1 && !near(x));
    if (j > 0) out.splice(op + 1, 0, ...out.splice(j, 1));
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
    const target = p.target && tribal.includes(p.target) ? p.target : null;
    // an Extra Vote hits the one it's on hardest; a's closest friend may be who a told about it at camp (read 2026-10-14:
    // Richard, told "it's Ivy tonight, both of them", said "Of course Tristan has an Extra Vote" at Tribal)
    const c = wasted[0] || (p.type === 'soleVote' ? (p.silencedPlayers || []).find(x => tribal.includes(x)) : null)
      || (p.type === 'extraVote' && target && target !== a ? target : null) || friendOf(b || a);
    const who = { a, ...(b ? { b } : {}), ...(c ? { c } : {}), h: host };
    const facts = { ...factsFor({ who, data: {} }, { ep: ep.num, phase: 'tribal' }), ...base, register: registerOf(a), third: !!c, pair: !!b, target: !!target, cWasted: !!wasted[0] };
    const w = writeStory(pool, ending, who, target ? { target } : {}, facts, ctx(nextN(), 'tribal', 'soft'));
    if (w) out.push({ idx, player: a, lines: w.lines });
  });
  return out;
}

/**
 * One losing tribe's council on a Multi-Tribal night (episode.js: ep.multiTribalResults, each tribe voting on
 * its own) as an ordinary episode: its players, ballots, alliances, idol plays, tie-break and boot, and the
 * coach card records that are its own (the classic Votes screen's subEp does the same). The director writes
 * each council's booth and reading from it, and the stepped viewer plays each one as its own Tribal.
 */
// A double boot's two votes, each as its own night (the engine keeps the first on votingLog/votes/idolPlays1 and the
// second on votingLog2/votes2/idolPlays; vp-td-ep/steps.js tdDoubleTribalScreen splits them the same way). One script
// written from the whole episode put the first vote's booth and questions into the second round (read 2026-10-13: Gwen
// at the second vote, "I wrote Noah. We all said Noah. What just happened?", with Noah already gone).
const idolKey = p => `${p.player}:${p.type || 'idol'}:${p.stolenFrom || ''}`;
export function firstVoteView(ep) {
  return { ...ep, eliminated: ep.firstEliminated, firstEliminated: null, idolPlays: ep.idolPlays1 || [], votingLog2: null, votes2: null, alliances2: null,
    isTie: false, revoteLog: [], shotInDark: ep.shotInDark1 || null, tiebreakerResult: ep.tiebreakerResult1 || null, riChoice: ep.firstRIChoice || null, tribalStory: null };
}
export function secondVoteView(ep) {
  const once = new Set((ep.idolPlays1 || []).map(idolKey));
  // ...and what the day's pitching was about is the first vote's when it names the person that vote sent home (read
  // 2026-10-13: at the second vote, "If Courtney wants Geoff gone", Geoff already gone)
  const gone = ep.firstEliminated, clear = (list, ...keys) => (list || []).filter(x => !keys.some(k => x?.[k] === gone));
  return { ...ep, firstEliminated: null, votingLog: ep.votingLog2 || [], votes: ep.votes2 || {}, idolPlays: (ep.idolPlays || []).filter(p => !once.has(idolKey(p))),
    tribalPlayers: (ep.tribalPlayers || []).filter(n => n !== gone), alliances: ep.alliances2 || [], defections: [], votingLog2: null, votes2: null, tribalStory: null,
    votePitches: clear(ep.votePitches, 'pitcher', 'pitchTarget', 'originalTarget'), pitchIntel: clear(ep.pitchIntel, 'pitcher', 'target', 'knower', 'source'),
    pitchCounterplay: clear(ep.pitchCounterplay, 'actor', 'pitcher', 'target'), coverPlans: clear(ep.coverPlans, 'leader', 'real', 'cover') };
}
export const isTwoVoteNight = ep => !!(ep?.firstEliminated && (ep.votingLog2 || []).length);

export function multiTribalView(ep, r) {
  const mine = n => (r.tribalPlayers || []).includes(n);
  return { ...ep, tribalPlayers: [...(r.tribalPlayers || [])], tribalTribe: r.tribe, votingLog: r.log || [], votes: r.votes || {},
    alliances: r.alliances || [], eliminated: r.eliminated, isTie: !!r.isTie, tiedPlayers: r.tiedPlayers || [],
    idolPlays: r.idolPlays || [], shotInDark: r.shotInDark || null, tiebreakerResult: r.tiebreakerResult || null,
    revoteLog: r.revoteLog || [], revoteVotes: r.revoteVotes || null, revoteSilenced: r.revoteSilenced || null,
    isRockDraw: !!r.isRockDraw, sidFreshVote: !!r.sidFreshVote, fireMaking: r.fireMaking || null, isFireMaking: !!r.fireMaking,
    riChoice: (ep.multiTribalRIChoices || []).find(c => c.name === r.eliminated)?.choice || null,
    multiTribalResults: [], multiTribalElims: null, firstEliminated: null, votingLog2: null, votes2: null, alliances2: null,
    tribalStory: r.tribalStory || null,
    defections: (ep.defections || []).filter(d => mine(d.player)), coverPlans: (ep.coverPlans || []).filter(p => mine(p.leader)),
    tribalBlowup: ep.tribalBlowup && mine(ep.tribalBlowup.player) ? ep.tribalBlowup : null,
    coachCardCommits: (ep.coachCardCommits || []).filter(c => c.tribe === r.tribe), coachCardCalls: (ep.coachCardCalls || []).filter(c => c.tribe === r.tribe), coachSaves: (ep.coachSaves || []).filter(c => c.tribe === r.tribe),
    coachCardNotPlayed: (ep.coachCardNotPlayed || []).filter(c => c.tribe === r.tribe), coachSaveRefusals: (ep.coachSaveRefusals || []).filter(c => c.tribe === r.tribe),
    coachElimination: (ep.coachElimination || []).filter(c => mine(c.name || c.coach || c)) };
}

/** The words of the night (see the header). */
export function writeTribal(ep) {
  // a coach season's vote can send a coach home (eliminated is then null): the booth, the questions and the
  // room are written the same way; the coach's goodbye is the viewer's (vp-td-ep/coach-tribal.js)
  const coachesHere = (ep?.tribalTribe && ep.coachData?.[ep.tribalTribe]?.coaches) || [];
  // (the season's record has the coach by the time this is written; the episode's own copy may not yet)
  const elim = ep?.eliminated || (ep?.coachElimination || [])[0]?.coach || (gs.coachesEliminated || []).find(c => c.ep === ep?.num)?.coach || null;
  const tribal = ep?.tribalPlayers || [];
  if (!elim || !(tribal.includes(elim) || coachesHere.includes(elim))) return null;
  const ballots = (ep.votingLog || []).filter(v => v.voter && v.voted && tribal.includes(v.voter));
  if (ballots.length < 2) return null;
  const venue = ITEM[ep.campAccess?.setting] ? ep.campAccess.setting : 'hosted-camp';
  const count = !!VENUE_COUNT[venue];
  const merged = !!(ep.isMerge || gs.isMerged);
  const camp = ep.tribalTribe || null;
  const ch = camp && !merged ? challengeOf(ep, camp) : null;
  const base = { venue, count, merged, late: merged && tribal.length <= 6 };
  const ctx = (n, phase = 'tribal', unique = true) => ({ ep: ep.num, camp: camp || 'merge', phase, n, place: 'confessional', unique, noSetup: true });
  const data = { lastBoot: elim, item: ITEM[venue] || 'vote' };
  let n = 1000;

  // ── the booth: every voter, their reason, their voice ──
  const booth = [];
  // what each voter's day was, from the vote scenes that aired (director.js voteTalk): who ran a plan
  // and the case they made, who was in on it, who got pitched, who had doubts. The booth says that, so
  // the reason under each name is the one the viewer watched (the user, 2026-10-08: "the reasoning in
  // the voting booth doesn't represent the real reasoning; someone spearheading a vote should be more
  // confident"). A voter none of it touched falls back to the engine's own reason (whyOf).
  // (only scenes whose people are all at this vote: on a double boot's second vote, a plan the first vote's boot led, or
  // was the mark of, is not a reason anybody still here gives; read 2026-10-13, "If Courtney wants Geoff gone" at the
  // second vote, Geoff already gone. Those voters give their own ballot's reason)
  const atVote = x => !x || tribal.includes(x);
  const voteScenes = Object.values(ep.campStory || {}).flatMap(c => [...(c.pre || []), ...(c.post || [])]).filter(x => x?.storyType === 'vote' && x.scene
    && atVote(x.scene.who?.a) && atVote(x.scene.who?.b) && atVote(x.scene.data?.mark) && atVote(x.scene.data?.target));
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
    // given a cover name by their own leader (alliances.js planCoverVotes), and wrote it
    const cvr = (ep.coverPlans || []).find(p => (p.told || []).includes(v.voter) && v.voted === p.cover && p.real === ep.eliminated);
    if (cvr) return { role: 'misled', scene: { scene: { data: {} } }, leader: cvr.leader };
    const dt = voteScenes.find(x => x.step === 'doubt' && x.scene.who?.a === v.voter);
    if (dt) return { role: 'doubt', scene: dt, held: /holds$/.test(dt.kind || '') };
    return null;
  };
  const namedSet = new Set((gs.namedAlliances || []).map(al => al.name));
  const CASES = new Set(['coming', 'sank', 'idol', 'pair', 'group', 'grudge', 'threat', 'outsider', 'numbers', 'isolate', 'pledge']);
  for (const v of ballots) {
    const why = whyOf(v, ep);
    // a friend turned against them earlier (camp-events.js checkTurnFriendPitches, 'took'): the voter says
    // who talked them into it, so the pitch the viewer saw comes back at the urn
    const turned = v.voter !== elim && (gs.turnPitches || []).find(t => t.result === 'took' && t.b === v.voter && t.c === v.voted && t.ep <= ep.num && ep.num - t.ep <= 3);
    if (turned) {
      const tw = writeStory('booth', 'turned', { a: v.voter }, { target: v.voted, pitcher: turned.a },
        { ...factsFor({ who: { a: v.voter }, data: {} }, { ep: ep.num, phase: 'tribal' }), ...base, register: registerOf(v.voter) }, ctx(n++, 'tribal', 'soft'));
      if (tw) { booth.push({ voter: v.voter, voted: v.voted, why: 'turned', line: tw.lines.map(l => l.text).join(' ') }); continue; }
    }
    const r = v.voter === elim ? null : roleOf(v);
    // the truth of this ballot (truthOf), said in the voter's voice: when the voter is a friend, an
    // alliance-mate or a broken final-three promise, that IS the story and it goes first
    const t = truthOf(v, ep, { tribal, named: namedSet });
    const said3 = new Set(booth.map(b => b.line));
    const b3 = () => {
      const lead = r && r.leader && r.leader !== v.voter ? r.leader : null;
      const d = { ...t.d, ...(lead ? { leader: lead } : {}) };
      const facts = { ...factsFor({ who: { a: v.voter }, data: {} }, { ep: ep.num, phase: 'tribal' }), ...base, register: registerOf(v.voter),
        rel: t.rel, tkind: t.tkind || 'none', sankT: !!ch && ch.sank === v.voted, group: !!d.group, other: !!d.other, warner: !!d.warner,
        keep: !!d.keep, wanted: !!d.wanted, area: !!d.area, mine: !!d.mine, leader: !!lead, pitcher: !!d.pitcher, alt: !!d.alt, locked: !!d.locked,
        band: bandOf(v.voter, v.voted), kindred: !!t.kindred, kin: t.kindred || 'none',
        // "everybody's writing X" only when X really has at least half the ballots (it was said on split votes, and on a 5-5)
        most: ballots.filter(x => x.voted === v.voted).length * 2 > ballots.length };
      const fresh = x => (x && !said3.has(x.lines.map(l => l.text).join(' ')) ? x : null);
      const wr = (e, u) => writeStory('booth3', e, { a: v.voter }, d, facts, ctx(n++, 'tribal', u));
      return fresh(wr(t.case, true)) || fresh(wr('any', true)) || fresh(wr(t.case, 'soft')) || fresh(wr('any', 'soft'));
    };
    if (v.voter !== elim && (['pact', 'ally', 'close'].includes(t.rel) || t.kindred) && r?.role !== 'misled') {
      const w3 = b3();
      if (w3) { booth.push({ voter: v.voter, voted: v.voted, why: t.case, rel: t.rel, line: w3.lines.map(l => l.text).join(' ') }); continue; }
    }
    if (r && (r.role === 'misled' || whyOf(v, ep) !== 'flip')) {
      const sd = r.scene.scene.data || {};
      const cs = CASES.has(r.cs) ? r.cs : 'numbers';
      const who = { a: v.voter };
      const d = { target: v.voted, ...(r.leader && r.leader !== v.voter ? { leader: r.leader } : {}), ...(r.pitcher ? { pitcher: r.pitcher } : {}),
        ...(sd.partner ? { partner: sd.partner } : {}), ...(sd.theirs ? { theirs: sd.theirs } : {}), ...(sd.mark ? { mark: sd.mark } : {}), ...(sd.keep ? { keep: sd.keep } : {}), ...(sd.protects ? { protects: sd.protects } : {}) };
      const facts = { ...factsFor({ who, data: {} }, { ep: ep.num, phase: 'tribal' }), ...base, register: registerOf(v.voter), band: bandOf(v.voter, v.voted),
        sankT: !!ch && ch.sank === v.voted, leader: !!d.leader, mark: !!d.mark, markMe: d.mark === v.voter, markLeader: !!d.mark && d.mark === d.leader,
        ally: (gs.namedAlliances || []).some(al => (al.members || []).includes(v.voter) && (al.members || []).includes(v.voted)) };
      const pool = `booth2.${r.role}`;
      const ending = r.role === 'lead' || r.role === 'with' ? cs : r.role === 'doubt' ? (r.held ? 'holds' : 'breaks') : r.role === 'misled' ? 'any' : 'yes';
      // nobody in the booth says what the voter before them said: a fresh line first, then the case's least used, then .any
      const wr = (e, u) => writeStory(pool, e, who, d, facts, ctx(n++, 'tribal', u));
      const two = r.role === 'lead' || r.role === 'with';
      const said = new Set(booth.map(b => b.line));
      const fresh = x => (x && !said.has(x.lines.map(l => l.text).join(' ')) ? x : null);
      const w = fresh(wr(ending, true)) || (two ? fresh(wr('any', true)) : null) || fresh(wr(ending, 'soft')) || (two ? fresh(wr('any', 'soft')) : null);
      if (w) { booth.push({ voter: v.voter, voted: v.voted, why, role: r.role, line: w.lines.map(l => l.text).join(' ') }); continue; }
    }
    // no aired scene to say it: the ballot's own truth (booth3) before the older seven-word pools
    const w3 = b3();
    if (w3) { booth.push({ voter: v.voter, voted: v.voted, why: t.case, rel: t.rel, line: w3.lines.map(l => l.text).join(' ') }); continue; }
    // the voter's group by name, only when it is a real alliance (not tonight's 'Anti-X Bloc')
    const named = namedSet;
    const plan = (ep.alliances || []).find(al => (al.members || []).includes(v.voter) && al.target === v.voted && named.has(al.label));
    const who = { a: v.voter };
    const facts = { ...factsFor({ who, data: {} }, { ep: ep.num, phase: 'tribal' }), ...base, register: registerOf(v.voter),
      band: bandOf(v.voter, v.voted), group: !!plan?.label, sankT: !!ch && ch.sank === v.voted };
    const d = { target: v.voted, group: plan?.label || null };
    let w = writeStory('booth', why, who, d, facts, ctx(n++, 'tribal', false));
    if (!w && why !== 'plan') w = writeStory('booth', 'plan', who, d, facts, ctx(n++, 'tribal', false));
    booth.push({ voter: v.voter, voted: v.voted, why, line: w ? w.lines.map(l => l.text).join(' ') : `${v.voted}.` });
  }

  // ── a Save Card night (coach-episode.js maybeSaveCoach) ──
  // The votes said a coach, the card kept the coach, and the coach named who goes instead. Nobody voted this one
  // out, so none of the reading below fits it (read 2026-10-14: Dunia, named by Bowie with every vote on Bowie, "I
  // thought I had friends in there. I just think they had other friends too", then "I knew exactly who was voting for
  // me"). The pick and the first reaction are the viewer's (vp-td-ep/coach-tribal.js cardAfterRead); this writes the
  // walk out, about the coach's choice, and what the coach and the boot's friend say after.
  const cardSave = (ep.coachSaves || []).find(s => s.replacement === elim && s.coach);
  if (cardSave) {
    const coach = cardSave.coach;
    const rest = tribal.filter(x => x !== elim);
    const pal = [...rest].sort((x, y) => getBond(elim, y) - getBond(elim, x) || x.localeCompare(y)).find(x => getBond(elim, x) >= 2) || null;
    // did anybody write the boot's name; did the coach ever train them (the card names the one the coach is coldest with)
    const votedA = ballots.some(v => v.voted === elim && v.voter !== elim);
    const coachedA = [ep, ...(gs.episodeHistory || [])].some(h => Object.values(h?.coachData || {})
      .some(cd => (cd?.sessions || []).some(s => s.coach === coach && s.contestant === elim)));
    const d = { ...data, coach };
    const kind = pal ? 'friend' : 'alone';
    const fx = { ...factsFor({ who: { a: elim, ...(pal ? { b: pal } : {}) }, data: {} }, { ep: ep.num, phase: 'tribal' }), ...base,
      register: registerOf(elim), voted: votedA, coached: coachedA, pair: !!pal };
    const ex = writeStory('exit2.card', kind, { a: elim, ...(pal ? { b: pal } : {}), h: seasonConfig?.host || 'Chris' }, d, fx, ctx(n++, 'tribal', 'soft'));
    const after = [];
    const say = (k, who, f2) => {
      const f = { ...factsFor({ who: { a: who }, data: {} }, { ep: ep.num, phase: 'tribal' }), ...base, register: registerOf(who), lastBoot: true, ...f2 };
      const w = writeStory('after.card', k, { a: who }, d, f, ctx(n++, 'tribal', 'soft'));
      if (w) after.push(...w.lines);
    };
    // the coach, on why that name: never trained them, and they wrote the coach's name too
    say('coach', coach, { coached: coachedA, voted: ballots.some(v => v.voter === elim && v.voted === coach) });
    if (pal) say('friend', pal, {});
    const qa = tribalQA(ep, { tribal, ballots, elim, ch, camp: camp || gs.mergeName || 'merge', base, ctx, nextN: () => n++ });
    const plays = playReactions(ep, { tribal, ballots, base, ctx, nextN: () => n++ });
    return { qa, plays, booth, reveal: [], revealKind: 'card', exitBase: base, room: [], blindside: false, shocking: false,
      exit: ex?.lines || [], exitWith: pal, exitKind: kind, after, card: { coach } };
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
  // ...or they ran a plan of their own against the people they knew were coming for them (director.js 'coming')
  const ownComing = Object.values(ep.campStory || {}).flatMap(c => [...(c.pre || []), ...(c.post || [])])
    .find(x => x?.storyType === 'vote' && ['plan', 'other'].includes(x.step) && x.scene?.who?.a === elim && /\.coming$/.test(x.kind || '') && x.scene?.data?.mark === elim);
  const knewBoot = (ep.pitchIntel || []).some(i => i.knower === elim && i.target === elim && i.believed !== false) || (ep.pitchCounterplay || []).some(c => c.actor === elim) || !!ownComing;
  const revealKind = blindside ? 'blindside' : knewBoot ? 'expected' : 'surprised';
  const rv = rb ? (writeStory('reveal', revealKind, { a: ra, b: rb, c: rc }, data, revealFacts, ctx(n++)) || (revealKind === 'surprised' ? writeStory('reveal', 'expected', { a: ra, b: rb, c: rc }, data, revealFacts, ctx(n++)) : null)) : null;

  // ── last words: their person, or the person they blame ──
  const friend = closest.find(x => getBond(elim, x) >= 2) || null;
  const enemy = [...others].filter(x => forBoot.includes(x)).sort((x, y) => getBond(elim, x) - getBond(elim, y))[0];
  const shot = !friend && enemy && getBond(elim, enemy) <= -2 ? enemy : null;
  let exitKind = friend ? 'friend' : shot ? 'shot' : 'alone';
  let exitWith = friend || shot || null;
  const ownComing0 = Object.values(ep.campStory || {}).flatMap(c => [...(c.pre || []), ...(c.post || [])])
    .find(x => x?.storyType === 'vote' && ['plan', 'other'].includes(x.step) && x.scene?.who?.a === elim && /\.coming$/.test(x.kind || '') && x.scene?.data?.mark === elim);
  const knewBoot0 = (ep.pitchIntel || []).some(i => i.knower === elim && i.target === elim && i.believed !== false) || (ep.pitchCounterplay || []).some(c => c.actor === elim) || !!ownComing0;
  const revealKind0 = blindside ? 'blindside' : knewBoot0 ? 'expected' : 'surprised';
  // who they blame, when they knew: the person their own plan was on, because that side was coming for them
  const ex = writeExit(ep, { elim, kind: exitKind, b: exitWith, revealKind: revealKind0, base, data, n: n++, blame: ownComing0?.scene?.data?.target || null });

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
  // a cover plan that worked: the leader says what the plan really was, and the one who was lied to knows
  const cv0 = (ep.coverPlans || []).find(p => p.real === elim && tribal.includes(p.leader));
  const cv = cv0 ? { ...cv0, misled: (cv0.told || []).filter(m => ballots.find(v => v.voter === m)?.voted === cv0.cover) } : null;
  if (cv && !cv.misled.length) cv.misled = null;
  if (cv) {
    const f = { ...factsFor({ who: { a: cv.leader }, data: {} }, { ep: ep.num, phase: 'tribal' }), ...base, register: registerOf(cv.leader), lastBoot: true };
    const w = writeStory('after.cover', 'any', { a: cv.leader }, { ...data, cover: cv.cover, told: (cv.misled || cv.told).join(' and ') }, f, ctx(n++, 'tribal', 'soft'));
    if (w) after.push(...w.lines);
    const m = (cv.misled || []).find(x => tribal.includes(x));
    if (m) {
      const fm = { ...factsFor({ who: { a: m, b: cv.leader }, data: {} }, { ep: ep.num, phase: 'tribal' }), ...base, register: registerOf(m), lastBoot: true, pair: true };
      const w2 = writeStory('after.misled', 'any', { a: m, b: cv.leader }, { ...data, cover: cv.cover }, fm, ctx(n++, 'tribal', 'soft'));
      if (w2) after.push(...w2.lines);
    }
  }
  if ((blindside || !mourner) && !cv) conf('architect', architect);
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
  // ── the classic Votes screen's footnotes, as the room hears them (vp-screens.js vpWhyBullets) ──
  // a ballot written wrong (voting.js miscommunication): somebody on the same plan catches it at the reading
  for (const mc of (ep.voteMiscommunications || []).filter(m => tribal.includes(m.voter) && m.voter !== elim && m.actual && m.intended && m.actual !== m.intended).slice(0, 1)) {
    const al = (ep.alliances || []).find(x => x.label === mc.alliance);
    // (the one who catches it wrote the plan's name themselves: they know what it was)
    const mate = (al?.members || []).filter(x => x !== mc.voter && x !== elim && tribal.includes(x) && ballots.find(v => v.voter === x)?.voted === mc.intended)
      .sort((x, y) => getBond(mc.voter, y) - getBond(mc.voter, x) || x.localeCompare(y))[0];
    if (!mate) continue;
    const f = { ...factsFor({ who: { a: mc.voter, b: mate }, data: {} }, { ep: ep.num, phase: 'tribal' }), ...base, register: registerOf(mc.voter), lastBoot: true, pair: true };
    const w = writeStory('room.mixup', 'any', { a: mc.voter, b: mate }, { ...data, intended: mc.intended, actual: mc.actual }, f, ctx(n++, 'tribal', 'soft'));
    if (w) room.push(...w.lines);
  }
  // a plan that split its votes against an idol (alliances.js splitTarget): one of them says why, when it worked
  for (const sp of ep.splitVotePlans || []) {
    const idolled = (ep.idolPlays || []).some(p => !p.type && (p.player === sp.primary || p.playedFor === sp.primary) && (p.votesNegated || 0) > 0);
    const ending = idolled && sp.secondary === elim ? 'idol' : !idolled && sp.primary === elim ? 'plain' : null;
    const by = ending && [...(sp.secondaryVoters || []), ...(sp.primaryVoters || [])].find(x => tribal.includes(x) && x !== elim);
    if (!by) continue;
    const f = { ...factsFor({ who: { a: by }, data: {} }, { ep: ep.num, phase: 'tribal' }), ...base, register: registerOf(by), lastBoot: true };
    const w = writeStory(`after.split.${ending}`, 'any', { a: by }, { ...data, primary: sp.primary, secondary: sp.secondary }, f, ctx(n++, 'tribal', 'soft'));
    if (w) { after.unshift(...w.lines); break; }
  }
  // the host's questions, from what happened today
  const qa = tribalQA(ep, { tribal, ballots, elim, ch, camp: camp || gs.mergeName || 'merge', base, ctx, nextN: () => n++ });
  const plays = playReactions(ep, { tribal, ballots, base, ctx, nextN: () => n++ });
  return { qa, plays, booth, reveal: rv?.lines || [], revealKind, exitBase: base, room, blindside, shocking, exit: ex?.lines || [], exitWith, exitKind, after: after.slice(0, roomBlind ? 4 : 2) };
}

// ── the walk out (the user, 2026-10-08: "where's the story here, it's just empty") ──
// The goodbye carries the night: how the reading landed (revealKind: blindside / surprised /
// expected), whether the friend walking them down wrote their name (bVoted), who they blame when
// they have a reason to know ({blame}: the pitcher word reached them about, or the person their
// crashout named), and the crashout itself (crash). A whole scene first (exit2.<kind>), the old
// short goodbye when none fits.
//   exit2.friend.<revealKind>  b, a's person, walks a down
//   exit2.shot.any            b is who a blames, and a turns round for one more go (crash: they
//                             just had it out at the fire)
//   exit2.alone.<revealKind>  nobody comes; a and the host
export function writeExit(ep, { elim, kind, b, revealKind, base = {}, data = {}, n = 1900, blame = null, crash = false }) {
  const wrote = x => (ep.votingLog || []).find(v => v.voter === x)?.voted;
  const told = (ep.pitchIntel || []).find(i => i.knower === elim && i.target === elim && i.believed !== false && i.pitcher && i.pitcher !== b)?.pitcher || null;
  const who = { a: elim, ...(b ? { b } : {}), h: seasonConfig?.host || 'Chris' };
  const bl = blame && blame !== b ? blame : told;
  const facts = { ...factsFor({ who: { a: elim, ...(b ? { b } : {}) }, data: {} }, { ep: ep.num, phase: 'tribal' }), ...base, register: registerOf(elim),
    bVoted: b ? (wrote(b) === elim ? 'boot' : 'other') : 'none', blame: !!bl, crash: !!crash, pair: !!b };
  const d = { ...data, ...(bl ? { blame: bl } : {}) };
  const ctx0 = { ep: ep.num, camp: ep.tribalTribe || 'merge', phase: 'tribal', n, place: 'confessional', unique: 'soft' };
  // every exit pool with a walk this season hasn't heard first, and only then one that has (read 2026-10-14: Yul's walk
  // down with Julia and Bowie's with Duncan, the same seven lines, five episodes apart)
  const walk = c => (kind === 'shot' ? writeStory('exit2.shot', 'any', who, d, facts, c)
    : (crash && writeStory(`exit2.${kind}`, 'any', who, d, facts, c)) || writeStory(`exit2.${kind}`, revealKind, who, d, facts, c) || writeStory(`exit2.${kind}`, 'any', who, d, facts, c))
    || writeStory('exit', kind, { a: elim, ...(b ? { b } : {}) }, data, facts, c);
  // ...and when every one of them has been heard, the least-heard of the big general pool before the small night-shaped ones
  // (a three-version pool replayed one scene three times in a season)
  return walk({ ...ctx0, unique: true }) || (kind !== 'shot' && writeStory('exit', kind, { a: elim, ...(b ? { b } : {}) }, data, facts, ctx0)) || walk(ctx0);
}

// ── the crashout, answered (the user, 2026-10-08: "the crashout doesn't go anywhere: no escalation,
// no dispute, no shouting match"; "no reaction from the concerned and the people around") ──
// The engine's blowup or crashout (episode.js checkTribalBlowup, vp-screens.js buildCrashout) says
// its lines; each one gets answered by the people it names, in their own voice, and the room reacts:
//   crash.callout.<right|part|wrong>  a (going home) names b as the one behind it: right (b ran it),
//       part (b wrote the name but somebody else ran it: {real}), wrong (b didn't even write it;
//       {real}, when known, ran it); c someone watching
//   crash.alliance.any  a outs b's alliance; c is in it too; d is not, and is hearing it now
//   crash.idol.any      a says b has an advantage; c is watching b
//   crash.exit.any      a's parting shot at the room; b is a's closest, c anyone
// h is the host, who ends it. One scene per line of the crashout, two at most.
export function writeCrashReplies(ep, swing) {
  if (!swing?.reveals?.length) return null;
  const elim = swing.player || ep.eliminated;
  const tribal = (ep.tribalPlayers || []).filter(x => x !== elim);
  const host = seasonConfig?.host || 'Chris';
  // the people a line names, in the order it names them (a whole name: Al is not in Alec)
  const at = (t, x) => { const s = String(t || ''); let i = s.indexOf(x); while (i >= 0) { const pre = s[i - 1], post = s[i + x.length]; if (!/\w/.test(pre || '') && !/\w/.test(post || '')) return i; i = s.indexOf(x, i + 1); } return -1; };
  const named = t => tribal.filter(x => at(t, x) >= 0).sort((p, q) => at(t, p) - at(t, q));
  const wrote = x => (ep.votingLog || []).find(v => v.voter === x)?.voted;
  const pitcher = (ep.votePitches || []).find(p => p.pitchTarget === elim && tribal.includes(p.pitcher) && wrote(p.pitcher) === elim)?.pitcher || null;
  const planLeader = Object.values(ep.campStory || {}).flatMap(c => [...(c.pre || []), ...(c.post || [])])
    .find(x => x?.storyType === 'vote' && x.step === 'plan' && x.scene?.data?.target === elim)?.scene?.who?.a || null;
  const closest = x => [...tribal].filter(y => y !== x).sort((p, q) => getBond(x, q) - getBond(x, p) || p.localeCompare(q))[0] || null;
  const watcher = (...not) => [...tribal].filter(y => !not.includes(y)).sort((p, q) => (pStatsOf(q)?.boldness || 0) - (pStatsOf(p)?.boldness || 0) || p.localeCompare(q))[0] || null;
  const out = [];
  let n = 1700;
  swing.reveals.slice(0, 2).forEach((r, k) => {
    const names = named(r.text);
    let pool, ending = 'any', who = null, data = {}, extra = {};
    if (r.type === 'callout' && names[0]) {
      const b = names[0];
      const real = [pitcher, planLeader].find(x => x && x !== b && tribal.includes(x)) || null;
      // b only owns it when b really ran it (pitched the name, or led the plan scene the viewer saw);
      // somebody who just wrote the name says so, and points elsewhere
      const ran = b === pitcher || b === planLeader;
      ending = wrote(b) !== elim ? 'wrong' : ran ? 'right' : real ? 'part' : 'voted';
      pool = 'crash.callout';
      who = { a: elim, b, c: watcher(b, real) };
      if (real) data.real = real;
      extra = { real: !!real };
    } else if (r.type === 'alliance' && names.length >= 1) {
      pool = 'crash.alliance';
      const [b, c] = names;
      const d = tribal.find(x => !names.includes(x)) || null;
      who = { a: elim, b, ...(c ? { c } : {}), ...(d ? { d } : {}) };
    } else if (r.type === 'idol' && names[0]) {
      pool = 'crash.idol';
      who = { a: elim, b: names[0], c: watcher(names[0]) };
    } else {
      pool = 'crash.exit';
      const b = closest(elim);
      who = { a: elim, ...(b ? { b } : {}), c: watcher(b) };
    }
    who = Object.fromEntries(Object.entries(who).filter(([, v]) => v));
    if (!who.b) return;
    const facts = { ...factsFor({ who, data: {} }, { ep: ep.num, phase: 'tribal' }), third: !!who.c, fourth: !!who.d, bVoted: wrote(who.b) === elim ? 'boot' : 'other',
      bLikesA: getBond(who.b, elim) >= 2, bHatesA: getBond(who.b, elim) <= -2, ...extra };
    const w = writeStory(pool, ending, { ...who, h: host }, data, facts, { ep: ep.num, camp: ep.tribalTribe || 'merge', phase: 'tribal', n: n++, place: 'confessional', unique: 'soft' });
    if (w) out.push({ after: k, lines: w.lines, type: r.type, b: who.b });
  });
  // the host ends it once, after the last of it
  out.forEach((o, k) => { if (k < out.length - 1) o.lines = o.lines.filter(l => l.by !== host); });
  return out.length ? out : null;
}
