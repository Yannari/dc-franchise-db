// ══════════════════════════════════════════════════════════════════════
// td/story/previously.js — "Previously on..." as the show cuts it: the story, and why it ended that way
// ══════════════════════════════════════════════════════════════════════
//
// Every Disventure Camp episode opens with the host recapping the last one, and that recap is what
// makes a season feel like one story. ep.tdPreviously = lines, written once the episode has played
// (director.js), from the PREVIOUS episode's record.
//
// The user, 2026-10-10: "really repetitive and too structurally restrictive; it doesn't even take
// double elimination into account; we need drama, comedy, and most importantly a real hindsight of
// the players' minds: why did X get targeted, was there a blindside, who spearheaded it, what did a
// clash cause, what are the storylines exactly?" So the recap is built from what mattered, not from a
// fixed list of beats:
//
//   the challenge (who carried it, who sank it) · the storylines that moved, each with its history
//   (a feud "since episode two", an alliance cracking, a showmance, a scheme, an idol) · then, for
//   EVERY elimination of the night (a double, a tied destiny, a medevac): who wanted them gone and
//   why, the other side's plan, who flipped, the count, whether it was a blindside, and how the boot
//   took it · then the tease, and how many are left.
//
// The players speak for themselves in it: a clip of the line that mattered (a jab in a fight, the
// spearhead at the urn, the boot's reaction, the smug confessional after) plays inside its own
// throwback, the way the show cuts a recap. How many beats run depends on how much happened. Every
// host line comes in several versions and a slot never repeats one in a season (gs.tdRecapMem).
// Words only: everything here is read off the record (votingLog, alliances, tribalStory, the
// storylines on gs.tdStory); nothing is decided.
import { gs, seasonConfig, formatName, TWIST_CATALOG } from '../../core.js';
import { pStats, pronouns } from '../../players.js';
import { whyOf } from './tribal.js';

const hash = s => { let h = 2166136261; for (const c of String(s)) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };
const W = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'];
const num = n => W[n] || String(n);
const Cap = t => t.charAt(0).toUpperCase() + t.slice(1);
const list = a => (a.length <= 1 ? a.join('') : `${a.slice(0, -1).join(', ')} and ${a[a.length - 1]}`);

// how much each kind of storyline moment is worth in a recap
const DRAMA = {
  'rivalry:blowup': 9, 'rivalry:friction': 6, 'rivalry:truce': 6, 'rivalry:cold': 4,
  'alliance:betrayal': 9, 'alliance:end': 8, 'alliance:exposed': 8, 'alliance:crack': 7, 'alliance:formed': 6, 'alliance:deal': 6, 'alliance:recruit': 4, 'alliance:refused': 4, 'alliance:checkin': 2,
  'showmance:breakup': 9, 'showmance:kiss': 7, 'showmance:jealous': 7, 'showmance:official': 6, 'showmance:spark': 5, 'showmance:targeted': 6,
  'scheme:caught': 9, 'scheme:move': 7, 'idol:found': 8, 'idol:shared': 6, 'idol:known': 6, 'idol:search': 3,
  'bottom:targeted': 6, 'bottom:scramble': 5, 'bottom:noticed': 3, 'underdog:rise': 4, 'friendship:drift': 5, 'friendship:bond': 3,
};

export function writePreviously(ep) {
  if (!ep || ep.num <= 1) return null;
  const hist = gs.episodeHistory || [];
  const prev = hist.find(h => h.num === ep.num - 1);
  if (!prev) return null;
  const host = seasonConfig?.host || 'Chris';
  // the show's own name (shows.js), never the series this camp borrowed its look from
  const show = formatName() || 'Total Drama';
  const key = `recap|${ep.num}`;
  const pr = n => pronouns(n);
  const strat = n => { try { return pStats(n)?.strategic || 0; } catch { return 0; } };

  // ── the season's memory: a slot never gives the same line twice until it has given them all ──
  const mem = new Set(gs.tdRecapMem || []);
  const last = gs.tdRecapLast || (gs.tdRecapLast = {});
  const pick = (opts, slot) => {
    const n = opts.length, s = hash(`${key}|${slot}`) % n;
    let free = [...Array(n).keys()].filter(j => !mem.has(`${slot}#${j}`));
    if (!free.length) { for (let j = 0; j < n; j++) mem.delete(`${slot}#${j}`); free = [...Array(n).keys()].filter(j => n === 1 || j !== last[slot]); }
    const j = free.includes(s) ? s : free[s % free.length];
    mem.add(`${slot}#${j}`); last[slot] = j;
    return opts[j];
  };
  const roll = (slot, p) => (hash(`${key}|roll|${slot}`) % 100) < p * 100;

  const out = [];
  const H = (text, shot = null, extra = {}) => { if (text) out.push({ kind: 'say', by: host, text, ...(shot ? { shot } : {}), ...extra }); };
  // a clip: a player's own line, inside the throwback of where they said it
  const Q = (by, text, shot = null) => { if (by && text) out.push({ kind: 'say', by, text, clip: true, ...(shot ? { shot: { ...shot, players: [...new Set([by, ...(shot.players || [])])].slice(0, 4) } } : {}) }); };
  // the host's aside after a big moment, now and then
  const aside = (slot, p = .35) => (roll(slot, p) ? ` ${pick(['Brutal.', 'Classic.', 'I love this game.', 'Ouch.', 'Television gold.', 'Honestly? Beautiful.', 'I could watch that all day.', 'And that is why I love my job.'], 'aside')}` : '');

  // what aired last time, with the camp it aired at (a throwback shot is that place, those people)
  const aired = Object.entries(prev.campStory || {}).flatMap(([camp, c]) => [...(c.pre || []), ...(c.post || [])].map(x => (x && x.kind ? { ...x, camp } : null))).filter(Boolean);
  const shotOf = (x, who = null) => (x ? { players: (who || x.players || []).filter(Boolean).slice(0, 4), spot: x.scene?.spot?.id || null, camp: x.camp || null } : null);
  // the best line in a scene, from the people it is about: short, said (or confessed), and with some bite
  const quoteOf = (x, people) => {
    const ls = (x?.lines || []).filter(l => (l.kind === 'say' || l.kind === 'conf') && people.includes(l.by) && l.text && l.text.length >= 18 && l.text.length <= 130);
    if (!ls.length) return null;
    const bite = l => (/!|\?/.test(l.text) ? 2 : 0) + (l.kind === 'conf' ? 1 : 0) + (/never|always|nobody|everybody|fault|liar|trust|promise|hate|done/i.test(l.text) ? 2 : 0);
    return [...ls].sort((p, q) => bite(q) - bite(p) || hash(p.text) - hash(q.text))[0];
  };
  let quotes = 0;
  const QUOTES = 5;

  // ═══ THE OPEN ═══
  H(pick([`Previously on ${show}!`, `Last time on ${show}...`, `Previously on ${show}! Let's catch you up, because a lot went down.`, `Last time on ${show}, things got messy. Even messier than usual.`,
    `Previously on ${show}...`, `Last time on ${show}, nobody slept, nobody trusted anybody, and I loved every second of it.`, `Previously, on the most dramatic show on television, ${show}!`], 'open'));

  // ═══ THE CHALLENGE ═══
  const tw = (prev.twists || []).find(x => TWIST_CATALOG.some(c => c.id === (x.catalogId || x.type) && c.chalStyle));
  const chal = (tw && TWIST_CATALOG.find(c => c.id === (tw.catalogId || tw.type))?.name) || prev.challengeLabel || null;
  const scores = prev.chalMemberScores || {};
  const ranked = Object.keys(scores).sort((p, q) => (scores[q] || 0) - (scores[p] || 0));
  const win = prev.winner?.name, lose = prev.loser?.name;
  let sankName = null;
  if (chal && win && lose) {
    const loseM = new Set(prev.loser.members || []);
    const sank = [...ranked].reverse().find(p => loseM.has(p));
    const star = ranked.find(p => (prev.winner.members || []).includes(p));
    sankName = sank || null;
    H(sank && star ? pick([`At ${chal}, ${star} carried ${win} to the win, while ${lose} fell apart, mostly thanks to ${sank}.`, `${star} single-handedly dragged ${win} through ${chal}. ${lose}? Not so much. Right, ${sank}?`, `${chal} went great for ${win}, thanks to ${star}, and terribly for ${lose}, thanks to ${sank}.`, `${win} won ${chal} on the back of ${star}. ${lose} lost it on the back of ${sank}.`], 'chal2')
      : sank ? pick([`${lose} lost ${chal}, and ${sank} heard about it the whole way back to camp.`, `${chal} was a disaster for ${lose}, and everybody knew exactly who to blame. Hi, ${sank}.`, `${lose} lost ${chal}, and all eyes turned to ${sank}.`], 'chal1')
      : pick([`${chal} was brutal, and while ${win} somehow made it through, ${lose} really did not.`, `${win} took ${chal}. ${lose} took the walk of shame.`, `${lose} lost ${chal}, and that meant somebody was going home.`], 'chal0'), { chal: true, players: [star, sank].filter(Boolean) });
  } else if (chal && prev.immunityWinner) {
    const iw = prev.immunityWinner;
    H(pick([`${iw} won ${chal}, and a night of safety, so everybody else went straight back to scheming.`, `At ${chal}, ${iw} grabbed immunity, which sent a lot of people scrambling for a new name.`, `${iw} won immunity at ${chal}. Somewhere, a plan fell apart.`, `${chal} went to ${iw}, which meant the one name everybody wanted was off the table.`], 'chalInd'), { chal: true, players: [iw] });
  }

  // ═══ THE STORYLINES THAT MOVED ═══
  const lines = gs.tdStory?.lines || [];
  const NAMES = new Set([...(gs.activePlayers || []), ...(gs.eliminated || []), ...hist.flatMap(h => [h.eliminated, h.firstEliminated]).filter(Boolean), ...Object.keys(gs.popularity || {}), ...(gs.namedAlliances || []).map(x => x.name).filter(Boolean)]);
  const boots = [prev.eliminated, prev.firstEliminated, prev.tiedDestinies?.eliminatedPartner, prev.ambassadorData?.ambassadorEliminated, prev.medevac?.name].filter(Boolean);
  const cand = [];
  const seenLine = new Set();
  aired.forEach((x, order) => {
    if (!x.storyType || !x.storyline || seenLine.has(x.storyline)) return;
    const base = DRAMA[`${x.storyType}:${x.step}`];
    if (!base) return;
    const line = lines.find(l => l.id === x.storyline);
    const before = (line?.steps || []).filter(s => s.ep < prev.num);
    const a = x.scene?.who?.a || x.players?.[0], b = x.scene?.who?.b || x.players?.[1];
    if (!a) return;
    const tiedToBoot = boots.some(n => n === a || n === b);
    seenLine.add(x.storyline);
    cand.push({ x, order, a, b, type: x.storyType, step: x.step, since: before.length ? (line.since || before[0].ep) : null, steps: before.length, alliance: x.scene?.data?.alliance || x.scene?.data?.group || x.alliance || null, score: base + (tiedToBoot ? 3 : 0) + Math.min(before.length, 3) * .7 });
  });
  // how many storylines the recap has room for: as many as mattered, never a fixed count
  const strong = cand.filter(c => c.score >= 7).length;
  const room = Math.max(1, Math.min(4, strong + (cand.length > 3 ? 1 : 0)));
  const chosen = [...cand].sort((p, q) => q.score - p.score).slice(0, room).sort((p, q) => p.order - q.order);
  const sinceOf = c => (c.since && c.since < prev.num ? pick([` (and that's been going on since episode ${num(c.since)})`, `, ${c.steps >= 2 ? 'again' : 'and not for the first time'}`, `, which has been building since episode ${num(c.since)}`], `since-${c.type}`) : '');
  chosen.forEach((c, i) => {
    const { a, b } = c;
    const g = c.alliance;
    const lead = i === 0 ? '' : pick(['Meanwhile, ', 'Back at camp, ', 'And then ', 'Elsewhere, ', '', 'Oh, and ', 'Over at camp, '], `lead${i}`);
    // (a sentence that opens on a name keeps its capital after "Meanwhile, ")
    const T = (t) => (!lead ? t : [...NAMES].some(n => t.startsWith(n)) || /^I/.test(t) ? lead + t : lead + t.charAt(0).toLowerCase() + t.slice(1));
    const kb = `${c.type}:${c.step}`;
    const say = {
      'rivalry:blowup': [`${a} and ${b} finally exploded at each other${sinceOf(c)}, and the whole camp had front-row seats.`, `${a} and ${b} had it out in front of everyone${sinceOf(c)}. It was loud. It was ugly. It was great.`, `${a} lost it at ${b}${sinceOf(c)}, and there was no taking it back.`],
      'rivalry:friction': [`${a} took a shot at ${b}${sinceOf(c)}, and ${b} did not let it go.`, `${a} and ${b} kept needling each other${sinceOf(c)}.`, `${a} made sure ${b} knew exactly what ${pr(a).sub} thought of ${pr(b).obj}${sinceOf(c)}.`],
      'rivalry:truce': [`${a} and ${b} tried to bury the hatchet. Key word: tried.`, `${a} reached out to ${b} to make peace. How sweet. How temporary.`, `${a} and ${b} called a truce. I give it a week.`],
      'rivalry:cold': [`${a} and ${b} stopped speaking altogether. Somehow, that was worse.`, `${a} decided ${b} was dead to ${pr(a).obj}. Very healthy.`, `${a} and ${b} went cold on each other.`],
      'alliance:betrayal': [`${a} turned on ${g || b}, and the fallout was immediate.`, `${a} stabbed ${g || b} in the back${g ? `, and the rest of ${g} noticed` : ''}.`, `${a} picked a side, and it wasn't ${g || b}'s.`],
      'alliance:end': [`${g || `${a} and ${b}'s alliance`} fell apart for good.`, `${g || `The alliance between ${a} and ${b}`}? Done. Over. Finished.`, `And ${g || `${a} and ${b}'s alliance`} officially died.`],
      'alliance:exposed': [`Somebody overheard ${a} making a deal, and suddenly everybody knew about ${g || 'it'}.`, `${a}'s secret deal got out. Oops.`, `${g || `${a}'s alliance`} got exposed, in public, at the worst possible time.`],
      'alliance:crack': [`${g ? `Cracks started showing in ${g}` : `${a} and ${b}'s alliance started to wobble`}, and ${a} was the first to say it out loud.`, `${a} started doubting ${g || b}. Out loud. To the wrong people.`, `${g || 'The alliance'} was supposed to be rock solid, but ${a} wasn't so sure anymore.`],
      'alliance:formed': [`A brand-new alliance was born${g ? `, and they call themselves ${g}` : ` between ${a} and ${b}`}. Adorable.`, `${a} and ${b} shook on a deal${g ? ` and called it ${g}` : ''}. We'll see how long that lasts.`, `${a} pulled ${b} into ${g || 'an alliance'}, and swore it would go all the way.`],
      'alliance:deal': [`${a} cut a side deal with ${b}. Then possibly another one. With someone else.`, `${a} and ${b} made a deal, and only one of them meant it.`, `${a} promised ${b} the world. Allegedly.`],
      'alliance:recruit': [`${a} tried to recruit ${b}.`, `${a} went shopping for votes, and ${b} was first on the list.`, `${a} made ${b} an offer.`],
      'alliance:refused': [`${a} asked ${b} to join up, and ${b} said no. Awkward.`, `${b} turned down ${a}'s offer. Bold.`, `${a} got rejected by ${b}. Ouch.`],
      'showmance:breakup': [`${a} and ${b} broke up${sinceOf(c)}. In public. With witnesses.`, `It's over between ${a} and ${b}. The camp is still recovering.`, `${a} ended things with ${b}, and nobody handled it well.`],
      'showmance:kiss': [`${a} and ${b} kissed. Yes, really. On camera.`, `${a} and ${b} finally made it official with a kiss, and the whole camp lost it.`, `${a} kissed ${b}, and things got very complicated, very fast.`],
      'showmance:jealous': [`${a} did not love how close ${b} was getting to somebody else.`, `Jealousy reared its ugly head, and ${a} was not hiding it.`, `${a} caught ${b} getting cozy with somebody else, and fumed.`],
      'showmance:official': [`${a} and ${b} became the camp's newest couple. Everybody else threw up a little.`, `${a} and ${b}? Official. Gross. Great for ratings.`, `${a} and ${b} are a thing now. Try to act surprised.`],
      'showmance:spark': [`Sparks flew between ${a} and ${b}, which is gross, but honestly great for ratings.`, `Is something going on between ${a} and ${b}? Everybody thinks so, except maybe ${a} and ${b}.`, `${a} and ${b} got a little closer than teammates usually do.`],
      'showmance:targeted': [`Somebody decided ${a} and ${b} were a little too cozy, and that had to stop.`, `${a} and ${b}'s little romance put a target on both of them.`, `Being a couple out here is a liability, and ${a} and ${b} found that out.`],
      'scheme:caught': [`${a} got caught red-handed${b ? ` by ${b}` : ''}. Whoops.`, `${a}'s little scheme blew up in ${pr(a).posAdj} face.`, `${a} got caught. Everybody saw. Nobody forgot.`],
      'scheme:move': [`${a} started pulling strings${b ? `, and ${b} was the puppet` : ''}.`, `${a} quietly went to work on ${b || 'the rest of camp'}.`, `${a} stirred the pot, and the pot stirred back.`],
      'idol:found': [`${a} found something hidden, and kept it very, very quiet.`, `${a} went digging, and came back with something shiny.`, `${a} got ${pr(a).posAdj} hands on an advantage. Sneaky.`],
      'idol:shared': [`${a} let ${b || 'someone'} in on a secret. A shiny, game-changing secret.`, `${a} told ${b || 'an ally'} about the idol. Trusting. Maybe too trusting.`, `${a} shared a secret with ${b || 'a friend'}. What could go wrong?`],
      'idol:known': [`Word got around that somebody had an idol, and ${a} had a pretty good guess who.`, `${a} figured out who's been hiding something.`, `${a} started asking very specific questions about very specific idols.`],
      'idol:search': [`${a} went idol hunting. Again.`, `${a} spent the whole afternoon digging in the dirt. Hopefully for an idol.`, `${a} searched every inch of camp.`],
      'bottom:targeted': [`${a}'s name started coming up${b ? `, and ${b} was the one saying it` : ''}.`, `${a} was on the bottom, and didn't know it.`, `The target landed on ${a}${b ? `, courtesy of ${b}` : ''}.`],
      'bottom:scramble': [`${a} could feel it coming, and scrambled${b ? `, starting with ${b}` : ''}.`, `${a} went into full panic mode${b ? ` and begged ${b} for help` : ''}.`, `${a} knew ${pr(a).sub} ${pr(a).sub === 'they' ? 'were' : 'was'} in trouble, and started making calls.`],
      'bottom:noticed': [`${a} started to feel left out. Spoiler: ${pr(a).sub} ${pr(a).sub === 'they' ? 'were' : 'was'}.`, `${a} noticed the conversations stopping whenever ${pr(a).sub} walked up.`, `${a} was feeling paranoid. Justifiably.`],
      'underdog:rise': [`And ${a} surprised everybody, including ${pr(a).ref || 'themselves'}.`, `${a} finally had a moment. Good for ${pr(a).obj}.`, `${a} proved ${pr(a).sub} ${pr(a).sub === 'they' ? 'are' : 'is'} not as useless as everyone thought.`],
      'friendship:drift': [`${a} and ${b} started drifting apart.`, `${a} and ${b}, best friends, suddenly weren't.`, `Things got weird between ${a} and ${b}.`],
      'friendship:bond': [`${a} and ${b} got closer. Aw.`, `${a} and ${b} had a real moment. I almost cared.`, `${a} and ${b} became inseparable.`],
    }[kb];
    if (!say) return;
    const shot = shotOf(c.x, [a, b].filter(Boolean));
    H(T(pick(say, `sl-${kb}`)) + (c.score >= 9 ? aside(`sl${i}`) : ''), shot);
    // the line that mattered, from the people in it
    if (quotes < QUOTES && (c.score >= 7 || roll(`q${i}`, .5))) { const q = quoteOf(c.x, [a, b].filter(Boolean)); if (q) { Q(q.by, q.text, shot); quotes++; } }
  });

  // ═══ EVERY ELIMINATION: why, who, and how it went down ═══
  const ts = prev.tribalStory || {};
  const plays = prev.idolPlays || [];
  // which ballot belongs to which boot: on a double tribal, the second vote has its own log
  const votesFor = (log, n) => (log || []).filter(v => v.voted === n && v.voter !== n);
  const logOf = n => (votesFor(prev.votingLog2, n).length > votesFor(prev.votingLog, n).length ? { log: prev.votingLog2, votes: prev.votes2, alliances: prev.alliances2 || prev.alliances, second: true } : { log: prev.votingLog, votes: prev.votes, alliances: prev.alliances, second: false });
  const tribalShot = players => ({ tribal: true, players: players.filter(Boolean).slice(0, 4) });
  const voteStory = (boot, idx, total) => {
    const { log, votes, alliances, second } = logOf(boot);
    // an announced double boot: one vote, and the two highest both go
    const topTwo = idx > 0 && !second && !!prev.announcedDoubleElim;
    const voters = votesFor(log, boot).map(v => v.voter);
    if (!voters.length) return false;
    const fake = { eliminated: boot };
    const whys = votesFor(log, boot).map(v => whyOf(v, fake));
    const count = k => whys.filter(w => w === k).length;
    const reason = ['strike', 'threat', 'weak', 'grudge', 'flip'].sort((p, q) => count(q) - count(p))[0];
    const booth = second ? [] : (ts.booth || []);
    const plan = (alliances || []).find(al => al.target === boot && (al.members || []).some(m => voters.includes(m)));
    const lead = booth.find(b => b.role === 'lead' && b.voted === boot)?.voter
      || (prev.votePitches || []).find(p => p.pitchTarget === boot && voters.includes(p.pitcher))?.pitcher
      || [...voters].sort((p, q) => strat(q) - strat(p))[0];
    // the other side: the name the rest of them wrote
    const tally = {};
    (log || []).filter(v => v.voted !== boot).forEach(v => { tally[v.voted] = (tally[v.voted] || 0) + 1; });
    const [other, otherN] = Object.entries(tally).sort((p, q) => q[1] - p[1])[0] || [null, 0];
    const otherLead = other ? (booth.find(b => b.role === 'lead' && b.voted === other)?.voter || (log || []).filter(v => v.voted === other).map(v => v.voter).sort((p, q) => strat(q) - strat(p))[0]) : null;
    const otherPlan = other ? (alliances || []).find(al => al.target === other) : null;
    const flips = votesFor(log, boot).filter(v => whyOf(v, fake) === 'flip').map(v => v.voter);
    const strikers = votesFor(log, boot).filter(v => whyOf(v, fake) === 'strike').map(v => v.voter);
    const bootVote = (log || []).find(v => v.voter === boot)?.voted || null;
    const blind = idx === 0 && !second ? !!ts.blindside : (bootVote && bootVote !== boot && !voters.some(v => (prev.pitchIntel || []).some(i => i.knower === boot && i.target === boot)));
    // a feud that fed it: a rivalry with someone who wrote the name
    const feud = lines.find(l => l.type === 'rivalry' && l.people.includes(boot) && l.people.some(p => voters.includes(p)) && l.steps.length >= 2);
    const feudWith = feud ? feud.people.find(p => p !== boot && voters.includes(p)) : null;
    const g = plan?.label && !/bloc$/i.test(plan.label) ? plan.label : null;
    const opener = total > 1 ? (idx === 0 ? (prev.announcedDoubleElim ? pick([`And then I dropped a bomb: a double elimination. One vote, and the top two were going home.`, `Then came the twist: the two people with the most votes were both going home.`, `And it was a double elimination, so the top two vote-getters were both done.`], 'dblA') : pick(['And then came the vote. Or should I say, the votes.', `And then, a double elimination. Two of them were going home.`, `And the night wasn't done with them, because two people were going home.`], 'dbl')) : '') : '';
    if (opener) H(opener, tribalShot([boot]));
    const lp = pr(lead);
    const why = {
      threat: [`${lead} decided ${boot} was too dangerous to keep around`, `${lead} looked at ${boot} and saw a threat`, `${lead} figured ${boot} would win if nobody stopped ${pr(boot).obj}`],
      weak: [`${lead} wanted the weakest link gone, and ${lp.sub} decided that was ${boot}`, `${lead} decided ${boot} was dead weight${sankName === boot ? ` after that challenge` : ''}`, `${lead} needed a team that wins, and ${boot} wasn't helping`],
      grudge: [`${lead} wanted ${boot} gone, and honestly? It was personal`, `${lead} had been waiting for a chance to get rid of ${boot}`, `${lead} just could not stand ${boot} anymore`],
      strike: [`${lead} found out ${boot} was coming for ${lp.obj}, and struck first`, `${lead} heard ${boot} had ${lp.posAdj} name, and decided to write ${boot}'s down first`, `${lead} caught wind of ${boot}'s plan, and turned it right back around`],
      flip: [`${lead} switched sides at the last second, and took ${boot} out`, `${lead} broke ranks, and ${boot} paid for it`, `${lead} flipped, and nobody saw it coming, least of all ${boot}`],
    }[reason] || [`${lead} put ${boot}'s name out there, and it stuck`, `${lead} needed a name, and ${boot}'s was the easiest to say`, `${lead} went to work on getting ${boot} out`];
    const plural = voters.length > 1;
    H(`${idx ? (topTwo ? pick(['And the runner-up? ', 'As for the other one, ', 'And right behind them? '], 'second2') : pick(['And the second one? ', 'As for the other one, ', 'Then, round two. '], 'second')) : pick(['', 'At the vote, ', 'When it came time to vote, ', 'So here\'s what really happened. '], 'vlead')}${Cap(pick(why, `why-${reason}`))}${g && !['flip', 'strike'].includes(reason) ? `, and ${g} fell in line` : plural && voters.length >= 3 ? pick([`, and ${num(voters.length - 1)} others went along with it`, `, and got the numbers`, `, and rounded up the votes`], 'numbers') : ''}.${feudWith && feudWith !== lead ? ` ${pick([`And ${boot}'s feud with ${feudWith}? That didn't help.`, `It didn't help that ${feudWith} had been feuding with ${boot} for weeks.`, `And ${feudWith}, still stewing over that feud with ${boot}, was happy to help.`], 'feud')}` : ''}`, tribalShot([lead, boot]));
    // the spearhead, at the urn, in their own words
    const lb = booth.find(b => b.voter === lead && b.voted === boot);
    if (lb?.line && quotes < QUOTES) { Q(lead, lb.line, tribalShot([lead])); quotes++; }
    // the other side's plan
    if (!topTwo && other && otherN >= 2 && otherLead === boot) H(pick([`${boot} had a target of ${pr(boot).posAdj} own, ${other}, and only got ${num(otherN)} votes on it.`, `${boot}'s own plan? Get rid of ${other}. It came up short.`, `${boot} was busy plotting against ${other}. Wrong target.`], 'otherSelf'), tribalShot([boot, other]));
    else if (!topTwo && other && otherN >= 2 && otherLead) H(pick([`But ${otherLead} had other plans, and ${otherPlan?.label && !/bloc$/i.test(otherPlan.label) ? otherPlan.label : `${pr(otherLead).posAdj} side`} went after ${other} instead.`, `Meanwhile, ${otherLead} was rounding up votes against ${other}.`, `${otherLead}, though, was gunning for ${other}.`], 'other'), tribalShot([otherLead, other]));
    // the flips that decided it
    const turned = topTwo ? [] : [...new Set([...flips, ...strikers])].filter(n => n !== lead);
    if (turned.length) H(pick([`And then ${list(turned)} switched, and that was that.`, `The swing vote${turned.length > 1 ? 's' : ''}? ${list(turned)}.`, `${list(turned)} decided it. Quietly. At the last second.`], 'flip'), tribalShot(turned.slice(0, 2)));
    // the idol that changed the math
    const play = plays.find(p => p.player && (p.target === boot || p.player === boot || p.votesNegated));
    if (play && idx === 0) H(pick([`And then ${play.player} pulled out an idol, and the whole room did the math again.`, `${play.player} played an idol, and every plan in the room changed in a second.`], 'idol'), tribalShot([play.player]));
    // the result
    const n = voters.length, m = otherN || 0;
    const score = topTwo ? `${num(n)} ${n === 1 ? 'vote' : 'votes'}, the second-most` : m ? `${num(n)} votes to ${num(m)}` : n === 1 ? 'one vote' : `${num(n)} votes`;
    const sent = prev.riChoice && idx === 0 && !second ? ` and sent to ${/RESCUE/i.test(prev.riChoice) ? 'Rescue Island' : 'Redemption Island'}` : '';
    const card = { boot };   // the boot's card: their portrait, crossed out
    if (prev.isRockDraw && idx === 0) H(pick([`It came down to a rock draw, and ${boot}'s luck ran out${sent}.`, `A tie, a deadlock, and a bag of rocks. ${boot} drew the wrong one${sent}.`], 'rocks'), card);
    else if (prev.isTie && idx === 0) H(pick([`It was a tie. Then a revote. And then ${boot} was gone${sent}.`, `The first vote tied, the revote didn't, and ${boot} went home${sent}.`], 'tie'), card);
    else if (blind) H(pick([`${Cap(score)}, and ${boot} never saw it coming. Total blindside!${sent ? ` Off to ${/RESCUE/i.test(prev.riChoice) ? 'Rescue' : 'Redemption'} Island with you.` : ''}`, `${boot} walked in sure of a different name, and walked out of the game${sent}. ${Cap(score)}. Blindside!`, `Nobody told ${boot}. And I mean nobody. ${Cap(score)}${sent}.`, `${boot} voted for ${bootVote || 'someone else'}, smiled, and then heard ${pr(boot).posAdj} own name. ${Cap(score)}${sent}.`], 'blind') + aside('blind', .5), card);
    else H(pick([`${Cap(score)}, and ${boot} was out${sent}.`, `When the votes were read, it was ${boot}, ${score}${sent}.`, `${boot} saw it coming. Didn't matter. ${Cap(score)}${sent}.`, `And just like that, ${boot} was gone${sent}. ${Cap(score)}.`], 'boot'), card);
    // how they took it
    if (idx === 0 && !second && quotes < QUOTES + 1) {
      const rq = (ts.reveal || []).find(l => l.by === boot && l.kind === 'say' && l.text.length >= 14 && l.text.length <= 130) || (ts.exit || []).find(l => l.by === boot && l.kind === 'conf' && l.text.length >= 14 && l.text.length <= 140);
      if (rq) { Q(boot, rq.text, tribalShot([boot])); quotes++; }
      // and the one who's proud of it
      const smug = (ts.after || []).find(l => l.kind === 'conf' && voters.includes(l.by) && /made it happen|my plan|my idea|I did|I made|told you|easy/i.test(l.text) && l.text.length <= 140);
      if (smug && quotes < QUOTES + 1) { H(pick([`Not everybody was sorry about it.`, `And somebody was very pleased with ${pr(smug.by).ref || 'themselves'}.`, `Some people took it harder than others.`], 'smug'), tribalShot([smug.by])); Q(smug.by, smug.text, tribalShot([smug.by])); quotes++; }
    }
    return true;
  };

  const elimOrder = [prev.firstEliminated, prev.eliminated].filter(Boolean);
  const unique = [...new Set(elimOrder)];
  unique.forEach((b, i) => { if (!voteStory(b, i, unique.length)) H(pick([`And in the end, ${b} was the one who went home.`, `In the end, it was ${b} who had to leave.`], 'bootOnly'), { boot: b }); });
  // the ones who left without a vote of their own
  const partner = prev.tiedDestinies?.eliminatedPartner;
  if (partner && !unique.includes(partner)) H(pick([`And thanks to Tied Destinies, ${partner} went with ${prev.eliminated}. Without a single vote. Brutal.`, `And because their destinies were tied, ${partner} had to pack up too. Zero votes, still gone.`], 'tied'), { boot: partner });
  const amb = prev.ambassadorData?.ambassadorEliminated;
  if (amb && !unique.includes(amb)) H(pick([`At the ambassadors' meeting, ${amb} was sent home before the vote even started.`, `And ${amb} lost the ambassadors' deal, and went home on the spot.`], 'amb'), { boot: amb });
  if (prev.medevac?.name && !unique.includes(prev.medevac.name)) H(pick([`And ${prev.medevac.name} had to be pulled from the game for medical reasons. Rough.`, `${prev.medevac.name} got medically evacuated. The game doesn't care how you go.`], 'medevac'), { boot: prev.medevac.name });

  // ═══ THE TEASE, AND HOW MANY ARE LEFT ═══
  const merge = !!ep.isMerge;
  const playsTonight = (ep.idolPlays || []).length > 0;
  const blindTonight = !!ep.tribalStory?.blindside;
  const doubleTonight = !!(ep.announcedDoubleElim || ep.firstEliminated);
  const left = (prev.gsSnapshot?.activePlayers || gs.activePlayers || []).length;
  const tease = doubleTonight ? pick([`And tonight? Two of them are going home.`, `This time, one elimination isn't enough.`, `Tonight, the stakes double. Literally.`], 'tdouble')
    : merge ? pick([`This time, the teams are gone, it's every camper for themselves, and nobody is ready.`, `This time: the merge. Friends become enemies, enemies become slightly worse enemies.`], 'tmerge')
    : playsTonight ? pick([`This time, somebody's been keeping a secret, and it's about to come out.`, `This time, somebody's pocket is a lot heavier than it looks.`], 'tpower')
    : blindTonight ? pick([`This time, somebody trusts the wrong person, and it costs them.`, `This time, a promise gets made by the fire and broken by midnight.`, `This time, somebody gets very, very comfortable. Big mistake.`, `This time, somebody's going to find out who their real friends are. The hard way.`, `This time, everybody's smiling. Never a good sign.`, `This time, somebody thinks they're safe. Adorable.`], 'ttrust')
    : pick([`This time, the pressure's on, and somebody is going to crack.`, `This time, the alliances get tested, and not everybody passes.`, `This time, nobody's safe. Well, somebody's safe. But not you.`, `This time, things get ugly. Uglier.`], 'tany');
  H(tease, { board: true });
  const lw = num(left);
  if (left) H(unique.length + (partner ? 1 : 0) > 1 ? pick([`Two gone in one night, and now ${lw} are left. Who's next? Find out right now, on ${show}!`, `${Cap(lw)} are left after a double boot. Who will be voted out tonight?`], 'leftdbl')
    : pick([`${Cap(lw)} are left! Who will be voted out tonight?`, `${Cap(lw)} are left, and by the end of tonight, there'll be one fewer.`, `${Cap(lw)} are still standing. Who's next? Find out right now, on ${show}!`, `${Cap(lw)} campers. One winner. Who goes tonight? Stay tuned!`], 'left'), { board: true });
  else H(pick([`Who's going home next? Find out right now, on ${show}!`, `Who stays, who goes, and who completely loses it? Right here, right now, on ${show}!`], 'close'), { board: true });

  gs.tdRecapMem = [...mem];
  return out.length ? out : null;
}
