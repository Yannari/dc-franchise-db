// @vitest-environment jsdom
// SCRATCH: which non-challenge twists still play on the classic screens. Delete by exact name.
import { it } from 'vitest';
import fs from 'fs';
import { runOneSeason, seededRun, core } from './helpers/season-harness.js';
import * as fin from '../js/vp-finale.js';
import * as vps from '../js/vp-screens.js';
import * as M from '../js/vp-td-ep/twists-more.js';
import { tdStepTranscript, tdTribalScreen } from '../js/vp-td-ep/steps.js';
Object.assign(globalThis, fin, vps);

const TWISTS = { pre: ['emissary-vote', 'late-arrival'], post: ['jury-elimination', 'spirit-island', 'fan-vote-boot'], any: ['open-vote', 'ambassadors'] };
// screens that are still classic on purpose (challenges, the season record pages)
const KEEP = /^(challenge|relationships|ratings|debug|aftermath-(minigame|mayhem)|cold-open$)|chal-|^ch-/;

it('audit', () => {
  const F = process.env.TEMP + '/twist-audit.txt';
  
  const out = { push: l => fs.appendFileSync(F, `${l}\n`) };
  for (const [phase, ids] of Object.entries(TWISTS)) for (const id of ids) {
    const at = phase === 'post' ? 11 : 4;
    let line = `${id}: `;
    try {
      seededRun(() => runOneSeason({ ri: /second-chance|returning/.test(id), popularityEnabled: true, twistSchedule: [{ episode: at, type: id }] }, 16), 777);
      const ep = core.gs.episodeHistory.find(e => e.num === at) || core.gs.episodeHistory[at - 1];
      if (!ep) { out.push(line + 'no episode'); continue; }
      const fired = (ep.twists || []).map(t => t.type || t.catalogId).filter(Boolean);
      globalThis._reunionRevealed = {}; globalThis._tvState = {}; globalThis._gcRevealed = {}; globalThis.vpEpNum = ep.num;
      const scr = vps.buildVPScreens(ep);
      const classic = scr.filter(s => !/class="tdx/.test(s.html || '') && !s.stepped && !KEEP.test(s.id || ''));
      line += `fired[${fired.join(',')}] classic[${classic.map(s => s.id).join(' ')}]`;
      const o = { setting: core.seasonConfig.setting };
      const T = { 'late-arrival': M.tdLateArrivalScreen, 'jury-elimination': M.tdJuryEliminationScreen, 'spirit-island': M.tdSpiritIslandScreen, 'fan-vote-boot': M.tdFanVoteScreen, ambassadors: M.tdAmbassadorsScreen }[id];
      const t = T ? T(ep, o) : id === 'open-vote' ? M.openVoteTribal(tdTribalScreen(ep, o), ep) : null;
      if (t) fs.appendFileSync(process.env.TEMP + '/twist-read.txt', [``, `=== ${id}`, ...tdStepTranscript(t)].join(String.fromCharCode(10)));
    } catch (e) { line += 'ERR ' + e.message; }
    out.push(line);
  }
}, 1800000);
