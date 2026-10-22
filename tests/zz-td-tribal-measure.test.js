// @vitest-environment jsdom
// SCRATCH: measure the stepped elimination (spoiler + repeats) and the camp strategy coverage. Delete by exact name.
import { it } from 'vitest';
import fs from 'fs';
import { runOneSeason, seededRun, core } from './helpers/season-harness.js';
import { tdTribalScreen, tdStepTranscript } from '../js/vp-td-ep/steps.js';

const SEEDS = (process.env.TDM_SEEDS || '4242:hosted-camp,777:survival-island,31337:film-lot,9001:hosted-camp').split(',').map(s => s.split(':'));
const word = (t, n) => new RegExp(`(^|[^A-Za-z])${n}([^A-Za-z]|$)`).test(t || '');

it('tribal + strategy measure', () => {
  const out = [];
  const m = { tribals: 0, bootAsked: 0, chance: 0, bootLines: 0, otherLines: 0, otherN: 0, qaIds: [], perSeasonIds: [],
    block: 0, blockNoAbout: 0, blockOtherNoAbout: 0, blockMissing: 0, blockOtherMissing: 0, blockOther: 0, voteScenes: 0, events: { overplayer: 0, tribalDisruption: 0, comfort: 0, split: 0, misc: 0 } };
  for (const [seedS, setting] of SEEDS) {
    const seed = +seedS;
    const roster = JSON.parse(fs.readFileSync('franchise_roster.json', 'utf8')).players.filter(r => r.stats && r.archetype);
    let q = seed >>> 0; const rr = () => ((q = (1664525 * q + 1013904223) >>> 0) / 0x100000000);
    const cast = [...roster].sort((a, b) => a.name.localeCompare(b.name)).map(p => [rr(), p]).sort((a, b) => a[0] - b[0]).slice(0, +(process.env.TDM_N || 16)).map(([, p], i) => ({ ...p, tribe: i % 2 ? 'Bass' : 'Gophers' }));
    seededRun(() => runOneSeason({ romance: 'enabled', setting, ...JSON.parse(process.env.TDM_CFG || '{}') }, 16, cast), seed);
    const ids = new Set();
    for (const ep of core.gs.episodeHistory) {
      const elim = ep.eliminated;
      const tribal = ep.tribalPlayers || [];
      if (!elim || !tribal.includes(elim) || !ep.tribalStory) continue;
      if (ep.overplayer) m.events.overplayer++;
      if (ep.tribalDisruption) m.events.tribalDisruption++;
      if (ep.comfortBlindspotPlayer) m.events.comfort++;
      if (ep.splitVotePlans?.length) m.events.split++;
      if (ep.voteMiscommunications?.length) m.events.misc++;
      m.tribals++;
      // the questions (not the opener): is the boot one of the people asked, and how many of the lines are theirs
      const qa = (ep.tribalStory.qa || []).filter(x => x.topic !== 'open');
      const asked = new Set(qa.flatMap(x => x.players || []));
      if (asked.has(elim)) m.bootAsked++;
      m.chance += Math.min(1, asked.size / Math.max(1, tribal.length));
      // fair test: among the people in danger (a vote on them, or a plan's target), is the boot asked more often?
      const dv = {}; (ep.votingLog || []).forEach(v => { if (v.voter !== v.voted) dv[v.voted] = 1; });
      (ep.alliances || []).forEach(al => { if (al.target) dv[al.target] = 1; });
      const D = tribal.filter(x => dv[x] && ![].concat(ep.immunityWinner || []).includes(x));
      (m.dz ||= { bootN: 0, bootA: 0, othN: 0, othA: 0, bootL: 0, othL: 0 });
      const lineN = x => qa.flatMap(q => q.lines || []).filter(l => l.by === x && l.kind !== 'beat').length;
      for (const x of D) { if (x === elim) { m.dz.bootN++; if (asked.has(x)) m.dz.bootA++; m.dz.bootL += lineN(x); } else { m.dz.othN++; if (asked.has(x)) m.dz.othA++; m.dz.othL += lineN(x); } }
      const lines = qa.flatMap(x => x.lines || []).filter(l => l.by && l.kind !== 'beat');
      m.bootLines += lines.filter(l => l.by === elim).length;
      const others = tribal.filter(x => x !== elim);
      m.otherLines += lines.filter(l => others.includes(l.by)).length; m.otherN += others.length;
      (m.topics ||= {}); qa.forEach(x => { m.topics[x.topic] = (m.topics[x.topic] || 0) + 1; }); qa.forEach(x => { if (x.id) { m.qaIds.push(x.id); ids.add(x.id); } });
      // the chopping block: every name that drew two votes or more, or a named plan's target
      const tally = {};
      (ep.votingLog || []).forEach(v => { if (tribal.includes(v.voter) && tribal.includes(v.voted)) tally[v.voted] = (tally[v.voted] || 0) + 1; });
      const block = Object.keys(tally).filter(x => tally[x] >= 2);
      const camp = ep.tribalTribe || null;
      const story = camp ? ep.campStory?.[camp] : Object.values(ep.campStory || {})[0];
      const items = [...(story?.pre || []), ...(story?.post || [])];
      const strat = items.filter(x => x?.storyType === 'vote');
      m.voteScenes += strat.length;
      // camp tell: the 'on the block' scenes (target/decoy) before tribal, and whether the boot is the only one
      const onBlock = strat.filter(x => ['target', 'decoy'].includes(x.step)).map(x => x.scene?.who?.a);
      (m.camp ||= { any: 0, bootOnly: 0 });
      if (onBlock.length) { m.camp.any++; if (onBlock.every(x => x === elim)) m.camp.bootOnly++; }
      const talkOf = n => items.filter(x => (x.lines || []).some(l => word(l.text, n) && l.by !== n) || x.scene?.data?.target === n).length;
      // strict: a vote scene ABOUT them (the plan's name, the decoy or the scrambling target)
      const aboutOf = n => strat.filter(x => x.scene?.data?.target === n || (['decoy', 'target'].includes(x.step) && x.scene?.who?.a === n)).length;
      const rows = [];
      for (const n of block) {
        m.block++;
        const c = talkOf(n);
        if (!c) m.blockMissing++;
        if (n !== elim) { m.blockOther++; if (!c) m.blockOtherMissing++; }
        const a = aboutOf(n);
        if (!a) { m.blockNoAbout++; if (n !== elim) m.blockOtherNoAbout++; }
        rows.push(`${n}${n === elim ? '*' : ''}=${tally[n]}v/${c}sc/${a}ab`);
      }
      out.push(`${setting} ep${ep.num} boot=${elim} asked=[${[...asked].join(',')}] block: ${rows.join(' ')} | voteScenes=${strat.map(x => x.step).join(',')}`);
    }
    m.perSeasonIds.push(ids);
  }
  // repeats: a question entry already used in an earlier season
  let rep = 0, tot = 0;
  for (let i = 1; i < m.perSeasonIds.length; i++) for (const id of m.perSeasonIds[i]) { tot++; if (m.perSeasonIds.slice(0, i).some(s => s.has(id))) rep++; }
  const pct = (a, b) => b ? (100 * a / b).toFixed(0) + '%' : '-';
  out.unshift(`tribals=${m.tribals}`,
    `boot asked a question: ${pct(m.bootAsked, m.tribals)} (chance ${pct(m.chance, m.tribals)})`,
    `QA lines per person: boot ${(m.bootLines / m.tribals).toFixed(2)} vs others ${(m.otherLines / m.otherN).toFixed(2)}`,
    `question entries reused from an earlier season: ${rep}/${tot} (${pct(rep, tot)})`,
    `chopping block names with no camp scene: ${m.blockMissing}/${m.block} (${pct(m.blockMissing, m.block)}); non-boot: ${m.blockOtherMissing}/${m.blockOther} (${pct(m.blockOtherMissing, m.blockOther)})`,
    `chopping block names with no strategy scene ABOUT them: ${m.blockNoAbout}/${m.block} (${pct(m.blockNoAbout, m.block)}); non-boot: ${m.blockOtherNoAbout}/${m.blockOther} (${pct(m.blockOtherNoAbout, m.blockOther)})`,
    `vote scenes per tribal: ${(m.voteScenes / m.tribals).toFixed(2)}`,
    `in danger: boot asked ${pct(m.dz.bootA, m.dz.bootN)} (${(m.dz.bootL / m.dz.bootN).toFixed(2)} lines) vs other danger names asked ${pct(m.dz.othA, m.dz.othN)} (${(m.dz.othL / m.dz.othN).toFixed(2)} lines)`,
    `camp 'on the block' scenes: boot the only one at ${m.camp.bootOnly}/${m.camp.any} tribals (${pct(m.camp.bootOnly, m.camp.any)})`,
    `topics: ${JSON.stringify(m.topics)}`, `engine tribal events: ${JSON.stringify(m.events)}`, '');
  fs.mkdirSync('C:/Users/yanna/AppData/Local/Temp/tdtx', { recursive: true });
  fs.writeFileSync('C:/Users/yanna/AppData/Local/Temp/tdtx/tribal-measure.txt', out.join('\n'));
  console.log(out.slice(0, 12).join('\n'));
}, 1200000);
