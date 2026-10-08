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
  const aired = Object.values(prev.campStory || {}).flatMap(c => [...(c.pre || []), ...(c.post || [])]).filter(x => x && x.kind);
  const find = re => aired.find(x => re.test(x.kind));
  const out = [];
  let n = 900;
  const say = (beat, data = {}, facts = {}) => {
    const w = writeStory(`prev.${beat}`, 'any', { h: host }, { show, ...data }, { ...facts }, { ep: ep.num, camp: 'prev', phase: 'pre', n: n++, place: 'confessional', unique: 'soft' });
    if (w) out.push(...w.lines);
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
    say('chal', { chal, win, lose, x: star || win, y: sank || lose }, { sank: !!sank, carried: !!star });
  } else if (chal && prev.immunityWinner) say('chalInd', { chal, x: prev.immunityWinner });
  // what moved the game last time, four beats at most, then how it ended
  const beats = [];
  const pair = re => { const x = find(re); return x?.players?.length >= 2 ? x.players : null; };
  const blame = pair(/story.chal.lost|crowd.lost|blame./);
  if (blame) beats.push(['blame', { x: blame[0], y: blame[1] }]);
  const spark = pair(/romance|spark|showmance|flirt/);
  if (spark) beats.push(['spark', { x: spark[0], y: spark[1] }]);
  const fight = pair(/clash|fight|feud|confront|grudge|caught/);
  if (fight && !(blame && fight.slice(0, 2).every(p => blame.includes(p)))) beats.push(['fight', { x: fight[0], y: fight[1] }]);
  const flip = find(/vote\.doubt\.breaks/);
  if (flip) beats.push(['flip', { x: flip.players?.[0] }]);
  const warn = find(/arc\.warn\.told/);
  if (warn) beats.push(['warn', { x: warn.scene?.who?.a, y: warn.scene?.who?.b, pitcher: warn.scene?.data?.pitcher }]);
  const ally = find(/arc\.ally\.formed|alliance\.form/);
  if (ally && ally.scene?.data?.group) beats.push(['ally', { group: ally.scene.data.group }]);
  const adv = (prev.idolPlays || [])[0];
  if (adv?.player) beats.push(['adv', { x: adv.player }]);
  const run = find(/^run\./);
  if (run) beats.push(['runner', { x: run.players?.[0] }]);
  // the game beats outrank the camp ones when there are too many; they still air in story order
  const RANK = ['flip', 'adv', 'warn', 'blame', 'ally', 'spark', 'fight', 'runner'];
  const keep = new Set(beats.filter(([, d]) => Object.values(d).every(Boolean)).sort((p, q) => RANK.indexOf(p[0]) - RANK.indexOf(q[0])).slice(0, 4));
  for (const b of beats) if (keep.has(b)) say(b[0], b[1]);
  if (prev.eliminated) {
    const blind = !!prev.tribalStory?.blindside;
    say(blind ? 'blindside' : 'boot', { boot: prev.eliminated });
  }
  // the tease: the kind of night, never the result
  const merge = !!ep.isMerge;
  const playsTonight = (ep.idolPlays || []).length > 0;
  const blindTonight = !!ep.tribalStory?.blindside;
  say('tease', {}, { tease: merge ? 'merge' : playsTonight ? 'power' : blindTonight ? 'trust' : 'any' });
  say('close');
  return out.length ? out : null;
}
