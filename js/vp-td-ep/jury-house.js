// ══════════════════════════════════════════════════════════════════════
// vp-td-ep/jury-house.js — the Jury House interlude on the stepped stage
// ══════════════════════════════════════════════════════════════════════
//
// PURE, like twists.js: an episode record in, a screen of steps out. The engine wrote the week
// (rescue-island.js generateInterludeLife → ep.interlude: the acts and their beats, the jury's
// roundtable with a backer and a doubter for each finalist). This screen stages it on the motel's
// sets (tools/td-camp/venues/zz_zzgallery.py, the islands' jury-* spots), modelled on Disventure
// Camp's "Panel of Peers": the host checking in on the motel, the residents' days at the pool, the
// buffet, the bar and the bingo table, confessionals on the motel bench, and at night the jury
// roundtable under the pavilion, hosted by one of the jurors, going through the finalists one by one.
//
// Every beat is the engine's own sentence, its quoted speech said by the person in it. The
// roundtable's extra voices (the juror a finalist voted out, a close friend, the "you're only saying
// that because" back-and-forth) come from the season's record — who wrote whose name, the bonds, the
// immunity wins — never from a roll here, so the same episode always plays the same way.
import { placeScene, plateKey, cleanText } from './steps.js';

const ISL = 'islands';
const hash = s => { let h = 2166136261; for (const c of String(s)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };
const pickBy = (arr, ...k) => arr[hash(k.join('|')) % arr.length];
const AT = (x, y, o = {}) => ({ u: x / 1600, v: y / 900, ...o });

// the pavilion (jh-roundtable): seven stumps around the fire, two tiki thrones behind it
const STUMPS = [[308, 696], [420, 704], [532, 688], [648, 668], [1032, 676], [1168, 704], [1328, 712]].map(([x, y]) => AT(x, y, { s: .14, sit: true, h: 13 }));
const THRONE_L = AT(592, 556, { s: .13, sit: true, h: 13 });
const THRONE_R = AT(1008, 556, { s: .13, sit: true, h: 13 });
const STANDING = [AT(176, 680, { s: .16, h: 15 }), AT(1424, 690, { s: .16, h: 15 })];

// which of the motel's sets a beat belongs to, by what its sentence says happened
const SET_RULES = [
  [/onto the pool deck|in the pool/i, 'jury-pool'],
  [/hot tub/i, 'jury-hottub'],
  [/\bbingo\b|deck of cards|card game|card trick|\bcards\b/i, 'jury-bingo'],
  [/\bbottle\b|\btoast\b|\bdrinks?\b|\bthe bar\b|mini-fridge/i, 'jury-bar'],
  [/kitchen|dishes|\bmeals?\b|\bplate\b|\beat(s|ing)?\b|\bfood\b|coffee|breakfast/i, 'jury-buffet'],
  [/\bpool\b|\bswim|\blaps\b|aerobics/i, 'jury-pool'],
  [/feeds|\bTV\b|lounge|lobby/i, 'jury-loungers'],
  [/off the boat|door shuts|trudges in|arrive/i, 'jury-resort'],
];
// what the residents in the background are doing on each set
const BUSY = { 'jury-pool': 'stretch', 'jury-buffet': 'eat', 'jury-bar': 'eat', 'jury-loungers': 'nap', 'jury-bingo': 'read', 'jury-resort': 'nap', 'jury-playa': 'nap', 'jury-hottub': 'nap' };
const NAME = { 'jury-resort': 'The Motel', 'jury-pool': 'The Pool Deck', 'jury-buffet': 'The Buffet', 'jury-bar': 'The Swim-Up Bar', 'jury-loungers': 'The Loungers',
  'jury-bingo': 'Bingo Night', 'jury-hottub': 'The Hot Tub', 'jury-playa': 'The Beach', 'jury-roundtable': 'The Jury Roundtable' };
// sets with no night frame, and where their night scenes go instead
const NIGHT_FOR = { 'jury-hottub': 'jury-pool', 'jury-loungers': 'jury-playa', 'jury-bingo': 'jury-bar', 'jury-resort': 'jury-resort' };
const DAY_FOR = { 'jury-playa': 'jury-loungers' };

export function isJuryHouse(ep) { const J = ep?.interlude || ep?.juryHouse; return ep?.interludeMode === 'jury-house' && J?.venue === 'jury' && (J.acts || []).length > 0; }

export function tdJuryHouseScreen(ep, o = {}) {
  if (!isJuryHouse(ep)) return null;
  const J = ep.interlude || ep.juryHouse;
  const host = o.host || 'Chris';
  const residents = [...(J.residents || [])];
  const P = n => { try { return o.pronouns?.(n) || null; } catch { return null; } } ;
  const pr = n => P(n) || { sub: 'they', obj: 'them', posAdj: 'their', Sub: 'They' };
  const stat = (n, k) => { try { return +(o.stats?.(n)?.[k] ?? 5); } catch { return 5; } };
  const arch = n => (o.players || globalThis.players || []).find(p => p.name === n)?.archetype || '';
  // the bonds as they stood after this episode (its snapshot), or the caller's
  const histAll = o.history || globalThis.gs?.episodeHistory || [];
  const snapBonds = ep.gsSnapshot?.bonds || histAll.find(e => e.num === ep.num)?.gsSnapshot?.bonds || null;
  const bond = o.bond || ((a, b) => (snapBonds ? (snapBonds[a <= b ? `${a}||${b}` : `${b}||${a}`] ?? 0) : 0));
  const hist = histAll.filter(e => !ep.num || e.num < ep.num || (e.num === ep.num && e !== ep));
  // who wrote whose name: each resident's own vote-out
  const outOf = n => { const e = hist.find(h => h.eliminated === n || h.firstEliminated === n); return e ? { num: e.num, voters: (e.votingLog || []).filter(v => v.voted === n && v.voter !== 'THE GAME').map(v => v.voter) } : null; };
  const wins = f => hist.filter(e => e.immunityWinner === f).length;
  const steps = [];
  const plate = (spot, tod) => plateKey(ISL, spot, tod);

  // ── a set: the spot, the hour, who is in it and who is around ─────────
  const setFor = (b, night) => {
    let spot = (SET_RULES.find(([re]) => re.test(b.text || '')) || [])[1] || null;
    if (!spot) spot = night ? pickBy(['jury-playa', 'jury-pool', 'jury-bar'], b.text) : pickBy(['jury-loungers', 'jury-pool', 'jury-buffet', 'jury-bar'], b.text);
    if (night && !plate(spot, 'night')) spot = NIGHT_FOR[spot] || 'jury-pool';
    if (!night && !plate(spot, 'day')) spot = DAY_FOR[spot] || 'jury-pool';
    return spot;
  };
  let cur = null;
  const scene = (spot, tod, focus, time, extra = {}) => {
    const key = plate(spot, tod) || plate(spot, tod === 'night' ? 'day' : 'night');
    if (!key) return false;
    const others = residents.filter(n => !focus.includes(n));
    const bgN = spot === 'jury-roundtable' ? [] : [0, 1].map(i => others[(hash(`${spot}|${focus.join()}`) + i * 7) % Math.max(others.length, 1)]).filter((n, i, a) => n && a.indexOf(n) === i);
    const places = extra.places || placeScene(key, focus, bgN);
    const bg = bgN.filter(n => places[n]).map(n => ({ n, act: BUSY[spot] || null }));
    const fresh = !cur || cur.spot !== spot || cur.tod !== tod;
    steps.push({ k: 'scene', spot, tod, plate: key, place: NAME[spot] || 'The Motel', time, card: fresh, cut: !fresh, focus, bg, places, ...extra });
    cur = { spot, tod };
    return true;
  };

  // ── a beat as the engine wrote it: its stage directions staged, its quotes said ──
  const play = (b, night, time) => {
    const who = (b.players || [b.player, b.player2]).filter(n => n && residents.includes(n));
    const raw = String(b.text || '');
    const badge = b.badge ? { text: String(b.badge).toUpperCase(), cls: b.cls || 'iron' } : null;
    const side = [{ tab: 'log', text: `${b.badge || 'The motel'}: ${who.join(', ')}` }];
    // a confessional, on the motel bench
    const cm = raw.match(/^<b>([^<]+?),\s*confessional:<\/b>\s*([\s\S]+)$/i);
    if (cm) {
      const by = cm[1].trim();
      const key = plate('jury-conf', night ? 'night' : 'day') || plate('jury-conf', 'day');
      const t = cleanText(cm[2].trim().replace(/^"([\s\S]*)"$/, '$1'));
      if (t) steps.push({ k: 'conf', by, text: t, plate: key, side });
      return;
    }
    if (!who.length) return;
    const spot = setFor(b, night);
    if (!scene(spot, night ? 'night' : 'day', who, time)) return;
    const parts = [...raw.matchAll(/"([^"]+)"|([^"]+)/g)].map(m => (m[1] != null ? { q: m[1] } : { n: m[2] }));
    let last = who[0], prevQ = null, first = true;
    for (const pt of parts) {
      if (pt.n != null) {
        const t = cleanText(pt.n.trim());
        // the speaker is the last person in the beat named before the line
        let at = -1;
        for (const n of who) { const i = pt.n.lastIndexOf(n); if (i > at) { at = i; last = n; } }
        if (!t || /^[\s.,;:—-]+$/.test(t)) continue;
        // a short connector between two lines ("They laugh.") is not a new speaker cue
        if (prevQ && at < 0 && t.split(/\s+/).length <= 4 && who.length > 1) last = who.find(n => n !== prevQ) || last;
        steps.push({ k: 'beat', text: t, focus: who, ...(first ? { badge, side } : {}) });
        first = false;
        if (at >= 0) prevQ = null;
        continue;
      }
      const q = cleanText(pt.q.trim());
      // a quoted word or two inside a sentence ("set herself aflame") stays part of the sentence
      if (!q || q.split(/\s+/).length < 3) continue;
      const by = prevQ && who.length > 1 && prevQ === last ? (who.find(n => n !== prevQ) || last) : last;
      steps.push({ k: 'say', by, text: q, focus: who, loud: /!/.test(q) && q.length < 70, ...(first ? { badge, side } : {}) });
      first = false;
      prevQ = by;
    }
  };

  // ── the opening: the host checks in on the motel ───────────────────
  const active = ep.gsSnapshot?.activePlayers || histAll.find(e => e.num === ep.num)?.gsSnapshot?.activePlayers || o.active || [];
  const openKey = plate('jury-resort', 'day');
  if (openKey) {
    const bgN = residents.slice(0, 3);
    const places = placeScene(openKey, [], bgN);
    steps.push({ k: 'scene', spot: 'jury-resort', tod: 'day', plate: openKey, place: 'The Jury Motel', time: 'Morning', card: true, focus: [], bg: bgN.filter(n => places[n]).map(n => ({ n, act: 'nap' })), places, wide: true,
      side: residents.map(n => { const x = outOf(n); return { tab: 'residents', text: `${n}${x ? ` · voted out in episode ${x.num}${x.voters.length ? ` by ${x.voters.join(', ')}` : ''}` : ''}` }; }) });
    cur = { spot: 'jury-resort', tod: 'day' };
    const left = active.length;
    steps.push({ k: 'say', by: host, host: true, text: left
      ? `${left} players are still in the game. Today we're giving them a break, and checking in on the ${residents.length} who aren't.`
      : `Today we're checking in on the ${residents.length} people this game already sent home.` });
    steps.push({ k: 'say', by: host, host: true, text: `Welcome to the motel. Nobody here can win anymore. A lot of them still get a vote.` });
    steps.push({ k: 'title', kicker: 'The Jury House', name: 'Life at the Motel', faces: residents.slice(0, 10) });
  }

  // ── the acts: the days, the roundtable, the last night ─────────────
  const TIME = { 'Checking In': ['day', 'Morning'], 'The Long Days': ['day', 'Afternoon'], 'Before the Finale': ['night', 'The last night'] };
  for (const act of J.acts) {
    if (act.roundtable) { roundtable(act.roundtable); continue; }
    const [tod, time] = TIME[act.title] || ['day', act.title];
    for (const b of act.beats || []) play(b, tod === 'night', time);
  }
  if (!J.acts.some(a => a.roundtable) && J.roundtable?.lines?.length) roundtable(J.roundtable);

  // the last word of the week: the host's word about the finale (the engine's teaser)
  if (J.teaser && plate('jury-resort', 'night')) {
    scene('jury-resort', 'night', residents.slice(0, 3), 'Lights out', { wide: true });
    for (const m of String(J.teaser).matchAll(/"([^"]+)"|([^"]+)/g)) {
      const t = cleanText((m[1] ?? m[2]).trim());
      if (!t || /^[\s.,;:—-]+$/.test(t)) continue;
      steps.push(m[1] != null ? { k: 'say', by: host, host: true, text: t } : { k: 'beat', text: t, focus: [] });
    }
  }
  // what comes next: the finale, and the jury's vote in it
  if (active.length) steps.push({ k: 'title', kicker: 'Next', name: 'The Finale', faces: active.slice(0, 6) });
  if (!steps.some(s => s.k === 'scene')) return null;
  return { id: 'jury-house', kind: 'jury', venue: ISL, ep: ep.num, label: 'The Jury House', host, steps,
    people: [{ name: 'The motel', members: residents }, ...(active.length ? [{ name: 'Still playing', members: active }] : [])] };

  // ══════════════════════════════════════════════════════════════════
  // THE JURY ROUNDTABLE — one juror hosts, the finalists one at a time
  // ══════════════════════════════════════════════════════════════════
  function roundtable(rt) {
    const key = plate('jury-roundtable', 'night');
    if (!key || !(rt.lines || []).length) return;
    const fins = rt.lines.map(l => l.finalist);
    // the juror who hosts: the loudest, most social person at the motel (Ivy, in Panel of Peers)
    const mod = [...residents].sort((a, b) => (stat(b, 'social') + stat(b, 'boldness')) - (stat(a, 'social') + stat(a, 'boldness')) || hash(a) - hash(b))[0];
    const quote = t => { const m = String(t || '').match(/"([^"]+)"/); return cleanText(m ? m[1] : String(t || '')); };
    // who the record gives a reason to speak, for each finalist
    const reasonUsed = new Set();
    const plan = rt.lines.map(l => {
      const f = l.finalist;
      const cut = residents.filter(j => outOf(j)?.voters.includes(f));
      const spoke = new Set([l.backer, l.doubter, mod]);
      // the one with the most reason not to want them to win: the latest of the jurors they voted out
      const reason = cut.filter(j => !spoke.has(j) && !reasonUsed.has(j)).sort((a, b) => (outOf(b)?.num || 0) - (outOf(a)?.num || 0))[0] || null;
      if (reason) { spoke.add(reason); reasonUsed.add(reason); }
      const friend = residents.filter(j => !spoke.has(j) && bond(j, f) >= 5).sort((a, b) => bond(b, f) - bond(a, f))[0] || null;
      if (friend) spoke.add(friend);
      const jab = wins(f) === 0 ? residents.filter(j => !spoke.has(j) && bond(j, f) <= -1).sort((a, b) => bond(a, f) - bond(b, f))[0] || null : null;
      return { ...l, f, cut, reason, friend, jab, outByF: cut.includes(l.doubter) };
    });
    // the table: the host juror on a throne, everyone with something to say on a stump, the rest around
    const speakers = [...new Set(plan.flatMap(p => [p.backer, p.doubter, p.reason, p.friend, p.jab]).filter(n => n && n !== mod))];
    const rest = residents.filter(n => n !== mod && !speakers.includes(n));
    const order = [...speakers, ...rest];
    const places = { [mod]: THRONE_L };
    const seats = [...STUMPS, THRONE_R, ...STANDING];
    order.slice(0, seats.length).forEach((n, i) => { places[n] = seats[i]; });
    const at = Object.keys(places);
    steps.push({ k: 'scene', spot: 'jury-roundtable', tod: 'night', plate: key, place: 'The Jury Roundtable', time: 'That night', card: true, focus: at, bg: [], places, wide: true, rt: true });
    cur = { spot: 'jury-roundtable', tod: 'night' };
    // where each juror leans tonight, for the Intel drawer: the record's bonds, not a vote
    const lean = at.flatMap(j => {
      const r = fins.map(f => ({ f, b: bond(j, f) })).sort((a, b) => b.b - a.b);
      const out = [];
      if (r[0] && r[0].b >= 2) out.push({ tab: 'lean', juror: j, target: r[0].f, word: 'leans to', text: `Bond ${r[0].b > 0 ? '+' : ''}${(+r[0].b).toFixed(1)}` });
      const lo = r[r.length - 1];
      if (lo && lo.b <= -2 && lo.f !== r[0]?.f) out.push({ tab: 'lean', juror: j, target: lo.f, word: 'against', text: `Bond ${(+lo.b).toFixed(1)}${outOf(j)?.voters.includes(lo.f) ? ` · ${lo.f} voted ${pr(j).obj} out` : ''}` });
      return out;
    });
    const say = (by, text, extra = {}) => { const t = cleanText(text); if (t && at.includes(by)) steps.push({ k: 'say', by, text: t, focus: [by], rt: true, ...extra }); };
    steps.push({ k: 'title', kicker: 'The Jury Roundtable', name: `${fins.length} left in the game`, faces: fins, side: lean, rt: true });
    say(mod, pickBy([
      `Hello, everyone, and welcome to the jury roundtable, where we go through everyone still in the game, one at a time. Hosted by me.`,
      `Okay, everybody. Jury roundtable. We talk about every one of them still in there, and we're honest. That's the only rule.`,
      `Welcome to the jury roundtable. ${fins.length} people left, and every one of them wants our votes. Let's talk about them.`,
    ], 'rt-open', ep.num, mod));
    let heated = null;
    plan.forEach((p, i) => {
      const { f } = p, w = wins(f), cutHere = p.cut.filter(j => at.includes(j)).length, a = arch(f), F = pr(f);
      const lead = i === 0 ? `Let's start with` : i === plan.length - 1 ? `And to wrap this up,` : `Next, we have`;
      const desc = w >= 2 ? `the one who keeps winning immunity, ${w} times and counting: ${f}!`
        : cutHere >= 2 ? `the person who voted out ${cutHere} of the people sitting here: ${f}!`
        : /villain|schemer|mastermind/.test(a) ? `the one with a plan for everybody: ${f}!`
        : /floater|goat|underdog/.test(a) ? `the one who's still in there, and nobody's quite sure how: ${f}!`
        : /social-butterfly|showmancer/.test(a) ? `the one everybody in there still seems to like: ${f}!`
        : /hero|loyal-soldier/.test(a) ? `the nicest person left in the game, supposedly: ${f}!`
        : `${f}!`;
      steps.push({ k: 'say', by: mod, text: `${lead} ${desc}`, focus: [mod], rt: true, side: [{ tab: 'log', text: `On ${f}: ${p.backer} for, ${p.doubter} against` }] });
      say(p.backer, quote(p.backText));
      say(p.doubter, quote(p.doubtText), { loud: true });
      // the doubter's reason may be their own vote-out, and somebody says so
      if (p.outByF && p.backer !== p.doubter) {
        say(p.backer, pickBy([`${f}'s the one who got you out, ${p.doubter}. Let's not pretend that isn't what this is.`, `You're only saying that because ${f} voted you out.`], 'rt-out', f, p.doubter));
        say(p.doubter, stat(p.doubter, 'temperament') <= 4 ? pickBy([`So? It's still true.`, `And? That doesn't make it wrong.`], 'rt-outr', p.doubter) : pickBy([`Maybe. It doesn't make me wrong.`, `Fair. I'm still allowed to have an opinion.`], 'rt-outr', p.doubter));
        heated = heated || p.doubter;
      }
      if (p.reason && at.includes(p.reason)) {
        const r = p.reason, b = bond(r, f);
        say(mod, `Let's hear from the person with the most reason not to want ${f} to win. ${r}?`);
        if (b >= 1) {
          say(r, pickBy([`${f} beat me. I can respect that.`, `${f} voted me out, and it was the right call. I'd have done the same.`, `Honestly? Good move. I was a threat, and ${f} saw it first.`], 'rt-why', r, f));
          say(mod, pickBy([`Huh. Not the fireworks I was expecting.`, `Well. That was civil.`], 'rt-civil', f));
        } else if (b <= -2) {
          say(r, pickBy([`${f} smiled at me the morning of my vote. I haven't forgotten that.`, `${f} wrote my name down. That's all I need to know.`, `I'm trying to be fair. It's not easy when ${f} is the reason I'm sitting here.`], 'rt-why', r, f), { loud: true });
          heated = heated || r;
        } else say(r, pickBy([`${f} got me out. I'm not voting on that alone. But I'm not forgetting it either.`, `I'll be fair to ${f}. It's just harder when ${F.sub === 'they' ? "they're" : F.sub + "'s"} the reason I'm in this motel.`, `${f} did what ${F.sub} had to. I'd still like to hear ${F.obj} own it.`], 'rt-why0', r, f));
      }
      if (p.friend) say(p.friend, pickBy([`${f} was the first person out there who made me feel like I belonged. That's why I'm rooting for ${F.obj}.`, `I'm biased. ${f}'s my friend. But ${F.sub} played, too.`, `Say what you want. I'd trust ${f} with anything.`], 'rt-fr', p.friend, f));
      if (p.jab) {
        say(p.jab, pickBy([`Zero immunity wins. Just saying.`, `Not one immunity win. I'm just putting that out there.`], 'rt-jab', p.jab, f));
        if (p.backer !== p.jab) say(p.backer, `Immunity isn't the only way to stay in this game.`);
      }
    });
    say(mod, pickBy([`And that's all the time we have! You've given each other a lot to think about. Now we wait for the finale.`, `Okay. I think we've all said enough. See you at the finale.`], 'rt-close', ep.num));
    // after: the host juror checks on whoever it got hot for
    if (heated && heated !== mod) {
      say(mod, `You okay? That got kind of heated.`, { focus: [mod, heated] });
      say(heated, stat(heated, 'temperament') <= 4 ? `I'm fine. I meant every word.` : `Yeah. I just don't love who I was back there.`, { focus: [mod, heated] });
    }
  }
}
