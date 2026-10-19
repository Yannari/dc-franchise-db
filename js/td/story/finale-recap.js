// ══════════════════════════════════════════════════════════════════════
// td/story/finale-recap.js — the finale's cold open: the whole season, and how each finalist got here
// ══════════════════════════════════════════════════════════════════════
//
// The user, 2026-10-19: "the total drama finale in stepped viewer is kinda underwhelming in general". Every
// other episode opens on the host's recap of the last one (previously.js); the finale opened on a classic
// page. A finale recap is a different cut: not last week, the season. How many came, the night the teams
// merged, the blindsides people still talk about, and then each finalist's road, one at a time: what they
// won, the night they nearly went, the people they took out, the alliance they ran or broke, the one they
// fell for, and a clip of them in their own words. The coaches' season gets its own beat (coachStory).
//
// Same line shape as previously.js (ep.tdPreviously, played by vp-td-ep tdPreviouslyScreen): { kind: 'say',
// by, text, shot?, clip? }, a shot being { players, spot, camp, tribal, ep } (a throwback), { board } or
// { boot }. Words only: everything is read off the season's record.
import { gs, seasonConfig, formatName } from '../../core.js';
import { pronouns } from '../../players.js';
import { coachStory } from '../../coaches.js';

const hash = s => { let h = 2166136261; for (const c of String(s)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };
const W = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty', 'twenty-one', 'twenty-two', 'twenty-three', 'twenty-four'];
const num = n => W[n] || String(n);
const Cap = t => t.charAt(0).toUpperCase() + t.slice(1);
const list = a => (a.length <= 1 ? a.join('') : `${a.slice(0, -1).join(', ')} and ${a[a.length - 1]}`);
const EP = n => `episode ${num(n)}`;

export function writeFinaleRecap(ep, { finalists = null } = {}) {
  const hist = (gs.episodeHistory || []).filter(h => h.num < ep.num);
  if (hist.length < 2) return null;
  const host = seasonConfig?.host || 'Chris';
  const show = formatName() || 'Total Drama';
  const fin = (finalists || ep.finaleEntrants || ep.finaleFinalists || gs.activePlayers || []).slice();
  if (fin.length < 2) return null;
  const pr = n => pronouns(n);
  const used = new Set();
  const pick = (opts, slot) => { const free = opts.filter(o => !used.has(o)); const x = (free.length ? free : opts)[hash(`${ep.num}|fr|${slot}`) % (free.length || opts.length)]; used.add(x); return x; };
  const out = [];
  const H = (text, shot = null, extra = {}) => { if (text) out.push({ kind: 'say', by: host, text, ...(shot ? { shot } : {}), ...extra }); };
  const Q = (by, text, shot = null) => { if (by && text) out.push({ kind: 'say', by, text, clip: true, ...(shot ? { shot } : {}) }); };

  // ── the season, counted ──
  const first = hist.find(h => (h.tribesAtStart || []).length);
  const started = first ? new Set(first.tribesAtStart.flatMap(t => t.members || [])).size : (gs.activePlayers || []).length + (gs.eliminated || []).length;
  const log = h => (h.votingLog || []).filter(v => v.voter && v.voter !== 'THE GAME' && v.voted);
  const votesOn = n => hist.reduce((t, h) => t + log(h).filter(v => v.voted === n).length, 0);
  const wins = n => hist.filter(h => [].concat(h.immunityWinner || []).includes(n) && (h.isMerge || h.gsSnapshot?.isMerged || h.challengeType === 'individual')).length;
  const boots = n => hist.filter(h => h.eliminated && log(h).some(v => v.voter === n && v.voted === h.eliminated)).map(h => h.eliminated);
  const scare = n => hist.map(h => ({ h, c: log(h).filter(v => v.voted === n).length })).filter(x => x.c >= 3 && x.h.eliminated !== n).sort((a, b) => b.c - a.c || b.h.num - a.h.num)[0] || null;
  const merge = hist.find(h => h.isMerge);
  const blinds = hist.filter(h => h.eliminated && (h.tribalStory?.shocking || h.tribalStory?.blindside)).slice(-2);
  // the best thing they said all season: a confessional with some bite, short enough to play as a clip
  const clipOf = n => {
    const ls = hist.flatMap(h => Object.entries(h.campStory || {}).flatMap(([camp, c]) => [...(c.pre || []), ...(c.post || [])].flatMap(x => (x?.lines || [])
      .filter(l => l.by === n && (l.kind === 'conf' || l.kind === 'say') && l.text && l.text.length >= 24 && l.text.length <= 140)
      .map(l => ({ l, ep: h.num, spot: x.scene?.spot?.id || null, camp, players: x.players || [] })))));
    const bite = x => (x.l.kind === 'conf' ? 3 : 0) + (/!|\?/.test(x.l.text) ? 1 : 0) + (/win|end|trust|promise|game|vote|alliance|million|never|always/i.test(x.l.text) ? 2 : 0)
      - (/^(Okay|So|And|But|Yeah|Yes|No|Fine|Oh|Well|Wait|What|Sure|Right|Hey)\b/.test(x.l.text) ? 4 : 0);
    return ls.sort((a, b) => bite(b) - bite(a) || b.ep - a.ep || hash(a.l.text) - hash(b.l.text))[0] || null;
  };
  const alliances = n => (gs.namedAlliances || []).filter(a => (a.members || []).includes(n));
  const betrayed = n => (gs.namedAlliances || []).flatMap(a => (a.betrayals || []).filter(b => b.player === n).map(b => ({ ...b, alliance: a.name })));
  const showmance = n => (gs.showmances || []).find(s => (s.players || []).includes(n));
  const coaches = (() => { try { return coachStory(); } catch { return []; } })();

  // ═══ THE OPEN ═══
  H(pick([`This is it. The finale of ${show}!`, `Tonight, it all comes down to this. The finale of ${show}!`, `${num(started)[0].toUpperCase()}${num(started).slice(1)} campers. ${Cap(num(hist.length))} episodes. And tonight, one winner. This is the finale of ${show}!`], 'open'), { board: true });
  H(pick([`${Cap(num(started))} people started this season. Let's look at how we got down to ${num(fin.length)}.`, `It started with ${num(started)} of them. Here's how it ended up being these ${num(fin.length)}.`], 'count'));
  if (merge) H(pick([`In ${EP(merge.num)}, the teams were gone. From then on it was every camper for themselves.`, `${Cap(EP(merge.num))}: the merge. Friends turned into votes, and votes turned into enemies.`], 'merge'), { players: (merge.gsSnapshot?.activePlayers || []).slice(0, 4), spot: null, ep: merge.num });
  for (const h of blinds) H(pick([`And who could forget ${EP(h.num)}? ${h.eliminated} walked into the vote sure of a different name.`, `${Cap(EP(h.num))}, ${h.eliminated} was blindsided. Never saw it coming.`, `The blindside of ${EP(h.num)}: ${h.eliminated}, gone, and stunned about it.`], `blind${h.num}`), { boot: h.eliminated });

  // ═══ EACH FINALIST'S ROAD ═══
  H(pick([`And now, the ${num(fin.length)} who are left.`, `Which brings us to our final ${num(fin.length)}.`], 'now'), { board: true });
  fin.forEach((f, i) => {
    const p = pr(f), w = wins(f), v = votesOn(f), b = boots(f), sc = scare(f), al = alliances(f)[0], bt = betrayed(f)[0], sh = showmance(f);
    const shot = { players: [f], spot: null, ep: null };
    // what kind of game: a competitor, a strategist, a survivor
    const lead = w >= 3 ? `${f} won ${num(w)} immunities. When ${p.sub} needed a win, ${p.sub} went and got one.`
      : b.length >= Math.max(4, hist.length / 2) ? `${f} voted with the majority ${num(b.length)} times. ${b.slice(-2).length === 2 ? `${b[b.length - 2]} and ${b[b.length - 1]}` : b[b.length - 1]}? That was ${f}.`
        : v >= 5 ? `${f} had ${num(v)} votes cast against ${p.obj} this season, and ${p.sub} ${p.sub === 'they' ? 'are' : 'is'} still here.`
          : v === 0 ? `${f} never had a single vote cast against ${p.obj}. Not one, all season.`
            : `${f} got here quietly. ${Cap(num(v))} vote${v === 1 ? '' : 's'} against ${p.obj} all season, and ${p.sub} survived every one.`;
    H(i === 0 ? pick([`First, ${f}.`, `Let's start with ${f}.`], 'f0') + ' ' + lead : lead, shot);
    if (sc && w < 3) H(pick([`The closest call? ${Cap(EP(sc.h.num))}. ${Cap(num(sc.c))} votes on ${f}, and ${p.sub} still walked out of there.`, `${Cap(EP(sc.h.num))} nearly ended it: ${num(sc.c)} votes with ${f}'s name on them.`], `sc${i}`), { players: [f], tribal: true, ep: sc.h.num });
    if (bt) H(pick([`And ${f} isn't sorry about ${bt.alliance}. ${p.Sub} turned on ${bt.votedFor} in ${EP(bt.ep)}.`, `${bt.votedFor} trusted ${f} in ${bt.alliance}. In ${EP(bt.ep)}, that was a mistake.`], `bt${i}`), { players: [f, bt.votedFor], ep: bt.ep });
    else if (al) H(pick([`${f} built ${al.name} with ${list(al.members.filter(m => m !== f).slice(0, 2))}.`, `${al.name} has had ${f}'s back since ${EP(al.formed || 1)}.`], `al${i}`), { players: al.members.slice(0, 3), ep: al.formed || null });
    if (sh) { const o = sh.players.find(x => x !== f); if (o) H(pick([`And then there's ${o}. ${f} and ${o} never really hid it.`, `${f} even found time for romance. ${o}.`], `sh${i}`), { players: [f, o] }); }
    const coach = coaches.find(c => c.trained[0] === f && c.name !== f);
    if (coach) H(pick([`${coach.name} spent the whole start of the season coaching ${f}. You could see it.`, `Some of that is ${coach.name}'s doing. ${f} was ${coach.name}'s project from day one.`], `co${i}`), { players: [f, coach.name] });
    const c = clipOf(f);
    if (c) Q(f, c.l.text, { players: [...new Set([f, ...c.players])].slice(0, 3), spot: c.spot, camp: c.camp, ep: c.ep });
  });

  // ═══ THE COACHES ═══
  const fired = coaches.filter(c => c.firedEp), promoted = coaches.filter(c => c.promotedEp);
  if (fired.length) H(pick([`And the coaches? ${list(fired.map(c => c.name))} never made it to the merge. ${fired.length === 1 ? 'Their own team voted them out.' : 'Their own teams voted them out.'} They're here tonight, and they're watching.`,
    `Let's not forget the coaches. ${list(fired.map(c => `${c.name}, fired in ${EP(c.firedEp)}`))}. Tonight they get the best seats in the house.`], 'fired'), { players: fired.map(c => c.name).slice(0, 4) });
  for (const c of promoted) H(fin.includes(c.name) ? pick([`${c.name} started this season as a coach. Tonight, ${pr(c.name).sub} ${pr(c.name).sub === 'they' ? 'are' : 'is'} in the finale.`, `Coach, then player, now finalist. ${c.name} has done it all.`], `pro${c.name}`)
    : pick([`${c.name} went from coach to player at the merge, and made it to ${c.playerOutEp ? EP(c.playerOutEp) : 'the jury'}.`, `${c.name} traded the whistle for a vote at the merge. ${c.playerOutEp ? `${Cap(EP(c.playerOutEp))} was the end of it.` : ''}`], `pro${c.name}`), { players: [c.name] });

  // ═══ TONIGHT ═══
  const F = seasonConfig?.finaleFormat || 'traditional';
  const tonight = F === 'final-challenge' || F === 'olympic-relay' || F === 'rescue-mission' ? `Tonight, everybody they voted out picks a side, and it all comes down to one last challenge.`
    : F === 'fan-vote' ? `Tonight, there's no jury. You, at home, decide who wins.`
      : F === 'fire-making' ? `Tonight, one last challenge, a fire, and a jury that remembers everything.`
        : F === 'koh-lanta' ? `Tonight, one last test, one last choice, and then the jury decides.`
          : `Tonight, one last challenge, one last vote, and a jury that's been waiting weeks for this.`;
  H(tonight, { board: true });
  H(pick([`Who takes it all? Find out right now, on the finale of ${show}!`, `${Cap(num(fin.length))} campers. One winner. This is the finale of ${show}!`], 'close'), { board: true });
  return out;
}
