// ══════════════════════════════════════════════════════════════════════
// td/story/previously.js — "Previously on..." from what last episode actually aired
// ══════════════════════════════════════════════════════════════════════
//
// Every Disventure Camp episode opens with the hosts recapping the last one, and that recap is what
// makes a season feel like one story. ep.tdPreviously = lines (the host's), written once the
// episode has played (director.js), from the PREVIOUS episode's record: its boot (or blindside),
// the flip, the warning, the new alliance, the advantage, a running gag; then a tease that knows
// only what kind of night is coming, never who goes. prev.<beat>: h is the host.
import { gs, seasonConfig, formatName, TWIST_CATALOG } from '../../core.js';
import { writeStory } from './write.js';

export function writePreviously(ep) {
  if (!ep || ep.num <= 1) return null;
  const prev = (gs.episodeHistory || []).find(h => h.num === ep.num - 1);
  if (!prev) return null;
  const host = seasonConfig?.host || 'Chris';
  // the show's own name (shows.js), never the series this camp borrowed its look from
  const show = formatName() || 'Total Drama';
  // what aired last time, with the camp it aired at (a throwback shot is that place, those people)
  const aired = Object.entries(prev.campStory || {}).flatMap(([camp, c]) => [...(c.pre || []), ...(c.post || [])].map(x => (x && x.kind ? { ...x, camp } : null))).filter(Boolean);
  const shotOf = x => (x ? { players: (x.players || []).filter(Boolean).slice(0, 4), spot: x.scene?.spot?.id || null, camp: x.camp || null } : null);
  const find = re => aired.find(x => re.test(x.kind));
  const out = [];
  let n = 900;
  // each line carries what the screen shows under it (vp-td-ep twist-screens tdPreviouslyScreen): a
  // throwback of the moment (its place, its people), the boot's card, or the board of who is left
  const say = (beat, data = {}, facts = {}, shot = null) => {
    const w = writeStory(`prev.${beat}`, 'any', { h: host }, { show, ...data }, { ...facts }, { ep: ep.num, camp: 'prev', phase: 'pre', n: n++, place: 'confessional', unique: 'soft' });
    if (w) out.push(...w.lines.map(l => (shot ? { ...l, shot } : l)));
    return !!w;
  };
  say('open');
  // the challenge first: who won it, who carried it, who sank it
  const tw = (prev.twists || []).find(x => TWIST_CATALOG.some(c => c.id === (x.catalogId || x.type) && c.chalStyle));
  const chal = (tw && TWIST_CATALOG.find(c => c.id === (tw.catalogId || tw.type))?.name) || prev.challengeLabel || null;
  const scores = prev.chalMemberScores || {};
  const ranked = Object.keys(scores).sort((p, q) => (scores[q] || 0) - (scores[p] || 0));
  const win = prev.winner?.name, lose = prev.loser?.name;
  if (chal && win && lose) {
    const loseM = new Set(prev.loser.members || []);
    const sank = [...ranked].reverse().find(p => loseM.has(p));
    const star = ranked.find(p => (prev.winner.members || []).includes(p));
    say('chal', { chal, win, lose, x: star || win, y: sank || lose }, { sank: !!sank, carried: !!star }, { chal: true, players: [star, sank].filter(Boolean) });
  } else if (chal && prev.immunityWinner) say('chalInd', { chal, x: prev.immunityWinner }, {}, { chal: true, players: [prev.immunityWinner] });
  // what moved the game last time, four beats at most, then how it ended
  const beats = [];
  const pairEv = re => { const x = find(re); return x?.players?.length >= 2 ? x : null; };
  const blame = pairEv(/story.chal.lost|crowd.lost|blame./);
  if (blame) beats.push(['blame', { x: blame.players[0], y: blame.players[1] }, shotOf(blame)]);
  const spark = pairEv(/romance|spark|showmance|flirt/);
  if (spark) beats.push(['spark', { x: spark.players[0], y: spark.players[1] }, shotOf(spark)]);
  const fight = pairEv(/clash|fight|feud|confront|grudge|caught/);
  if (fight && !(blame && fight.players.slice(0, 2).every(p => blame.players.includes(p)))) beats.push(['fight', { x: fight.players[0], y: fight.players[1] }, shotOf(fight)]);
  const flip = find(/vote\.doubt\.breaks/);
  if (flip) beats.push(['flip', { x: flip.players?.[0] }, shotOf(flip)]);
  const warn = find(/arc\.warn\.told/);
  if (warn) beats.push(['warn', { x: warn.scene?.who?.a, y: warn.scene?.who?.b, pitcher: warn.scene?.data?.pitcher }, shotOf(warn)]);
  const ally = find(/arc\.ally\.formed|alliance\.form/);
  if (ally && ally.scene?.data?.group) beats.push(['ally', { group: ally.scene.data.group }, shotOf(ally)]);
  const adv = (prev.idolPlays || [])[0];
  if (adv?.player) beats.push(['adv', { x: adv.player }, { tribal: true, players: [adv.player] }]);
  const run = find(/^run\./);
  if (run) beats.push(['runner', { x: run.players?.[0] }, shotOf(run)]);
  // the game beats outrank the camp ones when there are too many; they still air in story order
  // (the show's recaps run six or seven beats, one sentence each)
  const RANK = ['flip', 'adv', 'warn', 'blame', 'ally', 'spark', 'fight', 'runner'];
  const keep = new Set(beats.filter(([, d]) => Object.values(d).every(Boolean)).sort((p, q) => RANK.indexOf(p[0]) - RANK.indexOf(q[0])).slice(0, 6));
  for (const b of beats) if (keep.has(b)) say(b[0], b[1], {}, b[2]);
  if (prev.eliminated) {
    const blind = !!prev.tribalStory?.blindside;
    say(blind ? 'blindside' : 'boot', { boot: prev.eliminated }, {}, { boot: prev.eliminated });
  }
  // the tease: the kind of night, never the result
  const merge = !!ep.isMerge;
  const playsTonight = (ep.idolPlays || []).length > 0;
  const blindTonight = !!ep.tribalStory?.blindside;
  // how many are left, over the board of who is still in (the show: "10 are left!")
  const left = (prev.gsSnapshot?.activePlayers || gs.activePlayers || []).length;
  const W = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'];
  say('tease', {}, { tease: merge ? 'merge' : playsTonight ? 'power' : blindTonight ? 'trust' : 'any' }, { board: true });
  const lw = W[left] || String(left);
  if (left) say('left', { left: lw, Left: lw.charAt(0).toUpperCase() + lw.slice(1) }, {}, { board: true });
  else say('close', {}, {}, { board: true });
  return out.length ? out : null;
}
