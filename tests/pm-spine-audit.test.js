// The episode's spine, in numbers (2026-11-03; the user: "boring and
// repetitive … no real storyline … too cut … the continuity is bad, the logic
// is lacking"). Read against a real Love Island hour (USA S8E12): about 15-20
// long scenes, ONE main story seen from every side, a second that builds to a
// fight, a light one for the laughs, and an ending nobody has answered.
//
//     npm run audit:pm-spine            seeds 7, 12, 21, 41
//     PM_SEEDS=3,4 npm run audit:pm-spine
//
// What it prints, per season (villa episodes, aired scenes only):
//   scenes, lines, lines a scene   how cut up an episode is
//   focus                          share of lines in the episode's own stories
//   directions                     islanders flirting with 2+ people besides their partner, an episode
//   unset crush                    a crush acted on with nothing on screen before it
//   split-then-warm                a couple warm with each other after they ended it that day
//   echo                           the same line twice in one episode
//   light                          scenes there for the laugh
import { it } from 'vitest';
import { playReadSeason, eventLines } from './helpers/pm-read.js';
import { phasesOf } from '../js/pm/transcript.js';

const SEEDS = (process.env.PM_SEEDS || '7,12,21,41').split(',').map(Number);
const NOT_VILLA = new Set(['first-coupling', 'final', 'reunion']);
const mean = a => (a.length ? Math.round(10 * a.reduce((x, y) => x + y, 0) / a.length) / 10 : 0);
const pct = (n, d) => (d ? `${Math.round(100 * n / d)}%` : '-');

// A scene where one islander shows interest in another (players[0] -> players[1]).
const FLIRT = e => /^(pull|graft-eyes|graft-turn|triangle-case|loyalty|chal-spark|bed-share|torch)$/.test(e.kind)
  || (e.kind === 'game-kiss' && ['crush', 'stir'].includes(e.extra?.of))
  || (e.kind === 'blow-dare' && e.extra?.of === 'kiss-other');
// A scene of a couple being warm together.
const WARM = e => /^(kiss|bed-chat|chat|vote-worry|deep-chat|close-off|love-said|hideaway)$/.test(e.kind)
  || (e.kind === 'game-kiss' && e.extra?.of === 'partner') || (e.kind === 'where-head' && e.extra?.of === 'reassure')
  || (e.kind === 'bed-chat' && e.extra?.of === 'warm');
// A couple ending it, mid-day.
const SPLIT = e => (e.kind === 'doubt-end' && e.extra?.of !== 'recommit') || e.kind === 'open-back-up'
  || (e.kind === 'told-confront' && e.extra?.verdict === 'done');
// The side stories (js/pm/events.js SIDE_STORY).
const SIDE = /^(triangle|rival|crush|camp|feud|betray|redeem|grass|parents|exw|enemy)-|^ex-(awkward|jealous)$|^game-(plan|latch|two-faced|suspect|called|fallout|end)$|^(code-call|mugged-low|found-love|villa-happy|torch|blowup|pile-in|villa-divided|cold-shoulder|clear-the-air|double-standard)$/;
// A crush said to be old, in words (pm/script.js CLAIM_RE).
const CLAIM = /for days|since (?:I|you) walked in|since day one|since the first day|all week|been wanting to|for ages|can't stop thinking about|haven't stopped thinking|everyone in this villa knows|(?:wanted|liked|fancied) (?:you|to kiss)[^.?!]{0,25}(?:for (?:days|ages|a while)|since)/i;
const LIGHT = e => /^(comedy|banter|hideaway-morning|villa-bit)/.test(e.kind);

it('episode spine audit', () => {
  const out = [];
  for (const seed of SEEDS) {
    const { rows } = playReadSeason(seed);
    const m = { stories: [], life: [], lifeScenes: [], claim: 0, claimEg: [], eps: 0, scenes: [], lines: [], perScene: [], focus: [0, 0], dirs: [], crush: [0, 0], warm: [], echo: [], light: [], hooks: {} };
    const seen = new Set();          // a->b interest shown on screen so far this season
    const ex = [];
    for (const r of rows) {
      const evs = phasesOf(r).flatMap(([, es]) => es).filter(e => e.aired);
      if (!NOT_VILLA.has(r.moment)) {
        m.eps++;
        const lines = evs.map(e => eventLines(e).filter(l => l.who).length);
        const spoken = lines.reduce((x, y) => x + y, 0);
        m.scenes.push(evs.length); m.lines.push(spoken); m.perScene.push(spoken / Math.max(1, evs.length));
        const story = r.pm.story || {};
        const cast = ['a', 'b'].map(k => story[k]?.cast || []);
        evs.forEach((e, i) => {
          const ours = e.extra?.thread || e.extra?.stretch || cast.some(c => e.players.filter(n => c.includes(n)).length >= 2);
          if (ours) m.focus[0] += lines[i];
          m.focus[1] += lines[i];
        });
        const partner = n => (r.pm.couplesBefore || []).find(c => c.includes(n))?.find(x => x !== n) || null;
        const dir = {};
        for (const e of evs.filter(FLIRT)) {
          const [a, b] = e.kind === 'loyalty' ? [e.players[1], e.players[0]] : e.players;
          if (!a || !b || partner(a) === b) continue;
          (dir[a] ||= new Set()).add(b);
        }
        m.dirs.push(Object.values(dir).filter(s => s.size >= 2).length);
        const warmAfter = [];
        evs.forEach((e, i) => {
          if (!SPLIT(e)) return;
          const [a, b] = e.players;
          for (const w of evs.slice(i + 1)) if (WARM(w) && w.players.slice(0, 2).includes(a) && w.players.slice(0, 2).includes(b)) warmAfter.push(`ep${r.num} ${a}/${b}: ${e.kind} then ${w.kind}`);
        });
        m.warm.push(warmAfter.length);
        ex.push(...warmAfter.slice(0, 2));
        const said = new Map();
        // (Not a replay: Movie Night's clips and the final's film quote scenes on purpose.)
        for (const e of evs.filter(x => !/clip|replay|film/.test(x.kind))) for (const l of eventLines(e)) if (l.who && l.text.length >= 25) said.set(l.text, (said.get(l.text) || 0) + 1);
        m.echo.push([...said.values()].filter(v => v > 1).length);
        for (const [t, v] of said) if (v > 1) (m.echoes ||= {})[t] = ((m.echoes || {})[t] || 0) + 1;
        m.light.push(evs.filter(LIGHT).length);
        // How many stories the villa's day followed: threads, plus the side stories' families.
        const life = evs.filter(e => ['morning', 'day', 'evening', 'night'].includes(e.phase));
        const ids = new Set(life.map(e => e.extra?.thread?.id).filter(Boolean));
        for (const e of life) if (SIDE.test(e.kind)) ids.add(`side:${e.kind.split('-')[0]}:${e.players.slice(0, 2).sort().join('+')}`);
        m.stories.push(ids.size);
        const lifeLines = life.map(e => eventLines(e).filter(l => l.who).length);
        m.life.push(lifeLines.reduce((x, y) => x + y, 0)); m.lifeScenes.push(life.length);
      }
      for (const e of evs) {
        if (!FLIRT(e)) continue;
        const [a, b] = e.players;
        if (!a || !b) continue;
        const crush = (e.kind === 'game-kiss' && e.extra?.of === 'crush') || e.kind === 'pull';
        if (crush) {
          m.crush[1]++;
          if (!seen.has(`${a}>${b}`)) {
            m.crush[0]++;
            const own = eventLines(e).filter(l => l.who === a).map(l => l.text).join(' ');
            if (CLAIM.test(own)) { m.claim++; if (m.claimEg.length < 3) m.claimEg.push(`ep${r.num} ${a}>${b}: ${own.match(CLAIM)[0]}`); }
          }
        }
        seen.add(`${a}>${b}`);
      }
      for (const e of evs.filter(e => e.phase === 'hook')) m.hooks[e.extra?.of || '?'] = (m.hooks[e.extra?.of || '?'] || 0) + 1;
    }
    out.push(`seed ${seed}: ${m.eps} villa eps · scenes ${mean(m.scenes)} · lines ${mean(m.lines)} · lines/scene ${mean(m.perScene)}`
      + ` · focus ${pct(...m.focus)} · 2+ directions ${mean(m.dirs)}/ep · unset crush ${pct(...m.crush)} (said to be old: ${m.claim})`
      + ` · split-then-warm ${m.warm.reduce((x, y) => x + y, 0)} · echo ${mean(m.echo)}/ep · light ${mean(m.light)}/ep`
      + `\n    villa life: ${mean(m.lifeScenes)} scenes, ${mean(m.life)} lines, ${mean(m.stories)} stories an episode`
      + (process.env.PM_ECHO ? `\n    echoes: ${Object.entries(m.echoes || {}).sort((a, b) => b[1] - a[1]).slice(0, 12).map(([t, v]) => `${v}x "${t.slice(0, 70)}"`).join('\n            ')}` : '')
      + `\n    hooks ${JSON.stringify(m.hooks)}${ex.length ? '\n    e.g. ' + ex.slice(0, 4).join(' | ') : ''}${m.claimEg.length ? '\n    old-crush lines: ' + m.claimEg.join(' | ') : ''}`);
  }
  process.stdout.write('\n' + out.join('\n') + '\n\n');
}, 600_000);
