// ══════════════════════════════════════════════════════════════════════
// td/story/previously.js — "Previously on..." from what last episode actually aired
// ══════════════════════════════════════════════════════════════════════
//
// Every Disventure Camp episode opens with the hosts recapping the last one, and that recap is what
// makes a season feel like one story. ep.tdPreviously = lines (the host's), written once the
// episode has played (director.js), from the PREVIOUS episode's record: its boot (or blindside),
// the flip, the warning, the new alliance, the advantage, a running gag; then a tease that knows
// only what kind of night is coming, never who goes. prev.<beat>: h is the host.
import { gs, seasonConfig } from '../../core.js';
import { writeStory } from './write.js';

const SHOW = { 'survival-island': 'Disventure Camp', carnival: 'Disventure Camp' };

export function writePreviously(ep) {
  if (!ep || ep.num <= 1) return null;
  const prev = (gs.episodeHistory || []).find(h => h.num === ep.num - 1);
  if (!prev) return null;
  const host = seasonConfig?.host || 'Chris';
  const show = SHOW[prev.campAccess?.setting || seasonConfig?.setting] || 'Total Drama';
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
  // what moved the game last time, two beats at most, then how it ended
  const beats = [];
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
  for (const [beat, d] of beats.slice(0, 2)) if (Object.values(d).every(Boolean)) say(beat, d);
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
