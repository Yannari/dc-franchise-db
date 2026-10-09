// ══════════════════════════════════════════════════════════════════════
// td/story/captions.js — the confessional as the show shoots it
// ══════════════════════════════════════════════════════════════════════
//
// The user, 2026-10-08, from a Disventure Camp episode: "(in pajamas)", "(holding a martini glass,
// bottom text labeled as 'Clinically Guarded')", "(voice-over)", "(sitting next to a weeping
// Sarah)". Each confessional line gets:
//   cap    the caption under them, one per person per episode, from where they really are this
//          episode: lied to by their own side, running tonight's plan, their running gag, the thread
//          they're carrying, a showmance, their inner need, and last their archetype. Never from how
//          tonight's vote ends (that would spoil the reading).
//   stage  how it's shot: (voice-over) when it plays over the scene, else now and then what's true of
//          the moment: in pajamas at night, still muddy after a physical challenge, eating at a meal,
//          sitting next to the friend they were just comforting.
// Words only. dressConfessionals(ep) runs once the episode's words are written (director.js).
import { gs, players, TWIST_CATALOG } from '../../core.js';
import { getBond } from '../../bonds.js';
import { needOf } from './psyche.js';
import { voiceOf } from './voice.js';

const NEED_CAP = { belong: ['Looking For Their People', 'Wants A Friend'], control: ['Always Watching', 'Needs A Plan'], temper: ['Counting To Ten', 'Short Fuse'],
  prove: ['Out To Prove It', 'Nobody Picked Me First'], protect: ['The Protector', 'Looking After Everyone'], redemption: ['Here For A Second Chance', 'Not The Same Player'],
  home: ['Missing Home', 'Old Enough To Know Better'] };
const RUN_CAP = { food: 'Snack Smuggler', pet: 'Proud Crab Parent', nickname: 'The Nickname Machine', fitness: 'Club President, Club Of One', drama: 'Narrating Their Own Life',
  secret: 'Cannot Keep A Secret', job: 'Talks About Work A Lot' };
const THREAD_CAP = { rivals: 'Not Over It', wronged: 'Holding A Grudge', rescue: 'Owes Somebody One', grievance: 'Remembers The Vote', misled: 'Lied To By Their Own Side', debt: 'Owes Somebody One' };
const ARCH_CAP = { villain: 'Unapologetic', mastermind: 'The Architect', schemer: 'Three Moves Ahead', hero: 'Doing The Right Thing', underdog: 'Still Here',
  floater: 'Under The Radar', wildcard: 'Nobody Knows What\'s Next', 'challenge-beast': 'Built Different', 'social-butterfly': 'Everybody\'s Friend',
  'loyal-soldier': 'Loyal To A Fault', goat: 'Just Happy To Be Here', hothead: 'Short Fuse', 'chaos-agent': 'Here For The Chaos', 'perceptive-player': 'Reading The Room',
  showmancer: 'Heart On Their Sleeve' };

const hash = s => { let h = 0; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; };

/** The caption for `name` this episode (and remembers it, so the next episode tries another). */
function captionFor(name, ep, ctx) {
  const book = ((gs.tdStory ||= {}).caps ||= {});
  const cands = [];
  const cv = (ep.coverPlans || []);
  if (cv.some(p => p.real === ep.eliminated && (p.told || []).includes(name) && (ep.votingLog || []).find(v => v.voter === name)?.voted === p.cover)) cands.push('Lied To By Their Own Side');
  if (cv.some(p => p.leader === name)) cands.push('Need To Know');
  if (ctx.leaders.has(name)) {
    const L = voiceOf(name).some(t => ['schemer', 'calm', 'dry'].includes(t)) ? ['Three Moves Ahead', 'Counting Every Vote', 'Always Has A Plan'] : ['Pulling The Strings', 'Calling The Shots', 'Rounding Up Votes'];
    cands.push(L[hash(name + ep.num) % L.length]);
  }
  const run = gs.tdStory?.runners?.[name];
  if (run && run.stage >= 1 && RUN_CAP[run.kind]) cands.push(RUN_CAP[run.kind]);
  for (const t of (gs.tdStory?.threads || []).filter(t => !t.done && t.a === name && t.ep < ep.num)) if (THREAD_CAP[t.kind]) cands.push(THREAD_CAP[t.kind]);
  if ((gs.showmances || []).some(s => s.phase !== 'broken-up' && (s.players || []).includes(name))) cands.push('Head Over Heels');
  const need = NEED_CAP[needOf(name)];
  if (need) cands.push(need[hash(name + ep.num) % need.length]);
  const arch = (players || []).find(p => p.name === name)?.archetype;
  if (ARCH_CAP[arch]) cands.push(ARCH_CAP[arch]);
  const fresh = cands.find(c => c !== book[name]) || cands[0] || null;
  if (fresh) book[name] = fresh;
  return fresh;
}

const MEAL = /meal|food|mess|dinner|breakfast/;
const COMFORT = /comfort|mourn|psy\.|friend\.(mentor|lift|struggle)|nl4\.p|thr\..*mend/;

/** Staging and captions on every confessional line of the episode. */
export function dressConfessionals(ep) {
  if (!ep || ep._dressed) return;
  Object.defineProperty(ep, '_dressed', { value: true, enumerable: false, configurable: true });
  const story = Object.values(ep.campStory || {}).flatMap(c => [...(c.pre || []).map(it => [it, 'pre']), ...(c.post || []).map(it => [it, 'post'])]);
  const leaders = new Set(story.map(([it]) => it).filter(it => it?.storyType === 'vote' && ['plan', 'other'].includes(it.step)).map(it => it.scene?.who?.a).filter(Boolean));
  const caps = {};
  const cap = name => (name in caps ? caps[name] : (caps[name] = captionFor(name, ep, { leaders })));
  const tw = (ep.twists || []).find(x => TWIST_CATALOG.some(c => c.id === (x.catalogId || x.type) && c.chalStyle));
  const style = tw && TWIST_CATALOG.find(c => c.id === (tw.catalogId || tw.type))?.chalStyle;
  const muddy = ['physical', 'endurance', 'adventure', 'chaos'].includes(style);
  const dress = (lines, item, phase) => {
    if (!Array.isArray(lines)) return;
    const said = lines.some(l => l.kind === 'say');
    lines.forEach((l, i) => {
      if (l.kind !== 'conf' || !l.by || l.cap) return;
      l.cap = cap(l.by);
      if (l.stage) return;   // staged already (the last confessional, on the way out)
      const rest = lines.slice(i + 1).some(x => x.kind === 'say');
      if (said && rest) { l.stage = 'voice-over'; return; }
      const h = hash(`${ep.num}|${l.by}|${i}|${item?.kind || ''}`);
      const win = item?.scene?.spot?.window || '';
      const kind = item?.kind || '';
      const other = item?.scene?.who && Object.values(item.scene.who).find(x => x && x !== l.by && getBond(l.by, x) >= 3);
      if (COMFORT.test(kind) && other && h % 2 === 0) l.stage = `sitting next to ${other}`;
      else if (MEAL.test(kind) && h % 3 === 0) l.stage = 'still eating';
      else if ((win === 'before-tribal' || phase === 'night') && h % 3 === 0) l.stage = 'in pajamas';
      else if (phase === 'post' && muddy && h % 4 === 0) l.stage = 'still muddy from the challenge';
    });
  };
  for (const [it, phase] of story) dress(it?.lines, it, phase);
  const ts = ep.tribalStory;
  if (ts) for (const k of ['after', 'exit', 'reveal', 'room']) dress(ts[k], { kind: `tribal.${k}`, scene: {} }, 'night');
}
