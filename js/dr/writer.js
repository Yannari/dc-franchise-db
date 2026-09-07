// ══════════════════════════════════════════════════════════════════════
// js/dr/writer.js — the beat sheet the episode writer is given
// ══════════════════════════════════════════════════════════════════════
//
// THE FACTS, IN ORDER, AND NOTHING ELSE. The AI writer adds how a night felt;
// it must never be in a position to decide what happened. Everything a script
// could get wrong — who won, who was called safe, who lip synced, who went
// home — is read straight off the row here and handed over as a flat line of
// text, so the model has no gap to improvise into.
//
// The bug this shape exists for is documented on the worker's Big Brother
// override: an episode came back naming the wrong Head of Household and
// listing the veto winner as a nominee, because the prompt described a
// different show and the model reconciled the difference by inventing. The
// answer there was to state the mechanism outright. Same answer here, for a
// show whose mechanism is stranger still — there is no vote to get wrong,
// which is exactly why a writer trained on the other two will write one.

import { showWords, DRAG_FORMAT } from '../shows.js';
import { maxiById } from './data/challenges.js';

const W = () => showWords(DRAG_FORMAT);

/** Scene kinds whose prose is worth handing over verbatim. */
const VERBATIM = /^(werk:|untucked:|arrival:|stage:|chal:|maxi:|perform:)/;

const clean = s => String(s || '').replace(/\s+/g, ' ').trim();

/** One line per name list, or nothing at all — never "nobody" as a fact. */
function listLine(label, names) {
  const list = (names || []).filter(Boolean);
  return list.length ? `${label}: ${list.join(', ')}` : null;
}

/**
 * The episode as a numbered list of things that happened.
 *
 * `row` is one entry of `gs.episodeHistory` — the same object the viewing
 * party reads, so the script and the screens can never disagree about the
 * night. Returns `{ header, beats, voices }`.
 */
export function buildDragBeatSheet(row, { players = {} } = {}) {
  const dr = row?.dr || {};
  const w = W();
  const ep = row?.num || dr.ep || 0;
  const beats = [];
  const push = line => { if (line) beats.push(clean(line)); };

  /* THE MECHANISM, STATED FIRST AND EVERY TIME. A model that has written the
     other two shows in this franchise arrives expecting a ballot, and if the
     sheet does not say there is none it will write one — a queen "campaigning
     for votes", a panel "casting their vote". The panel RANKS and the host
     DECIDES; nobody in this room votes for anything, ever. */
  push('THE MECHANISM: the panel ranks the queens on their performance and '
    + `their runway. ${w.host} makes the final call. There is no ballot of any `
    + 'kind — nobody is voted for, nobody campaigns for support, and the '
    + 'queens have no say in who leaves. The bottom two lip sync, and the '
    + 'host alone decides which of them stays.');

  if (dr.challenge?.name) {
    /* THE DESCRIPTION, LOOKED UP. The row stores the challenge by id and name
       only; the `desc` is the one place anybody is told what the queens
       physically DO, and without it a writer given "Snatch Game" invents the
       rules. It is worth the lookup. */
    const desc = maxiById(dr.challenge.id)?.desc;
    push(`THE ${String(w.challenge).toUpperCase()}: ${dr.challenge.name}`
      + (desc ? ` — ${desc}` : ''));
  }
  if (dr.mini?.name) {
    push(`MINI CHALLENGE: ${dr.mini.name}`
      + (dr.mini.winner ? `, won by ${dr.mini.winner}` : ''));
  }
  if (dr.guest) push(`GUEST ON THE PANEL: ${dr.guest.name || dr.guest}`);
  if (dr.runway?.category) push(`RUNWAY CATEGORY: ${dr.runway.category}`);

  /* Who was in the room AT THE TOP OF THE NIGHT — which is not `dr.living`.
     `living` is the roster after the elimination, so on its own it lists eight
     queens on an episode where nine competed, and the writer quietly drops
     tonight's eliminated queen from the entire script: she has no entrance, no
     werk room, no lip sync, and then goes home. The room tonight is the
     survivors plus whoever left at the end of it. */
  const wentHome = (row?.exits || [])
    .map(x => (typeof x === 'string' ? x : x?.name)).filter(Boolean);
  const roomTonight = [...(dr.living || [])];
  for (const n of wentHome) if (!roomTonight.includes(n)) roomTonight.push(n);
  push(listLine('IN THE WERK ROOM TONIGHT', roomTonight));

  // The assignment: who took what part, and who chose it.
  for (const [name, perf] of Object.entries(dr.performances || {})) {
    const bits = [];
    if (perf?.detail?.character) bits.push(`played ${perf.detail.character}`);
    else if (perf?.role && perf.role !== 'standard') bits.push(`took the ${perf.role} part`);
    if (perf?.team) bits.push(`on ${perf.team}`);
    if (perf?.moment) bits.push('had the standout moment of the challenge');
    if (bits.length) push(`${name} ${bits.join(', ')}.`);
  }

  /* The scenes, verbatim. The prose is already written and already in this
     show's voice; handing over a paraphrase would be handing over a second
     draft to rewrite, and every paraphrase is a chance to drop a fact. */
  for (const scene of dr.scenes || []) {
    if (!VERBATIM.test(scene.kind || '') || !scene.text) continue;
    push(scene.text);
  }

  /* The critiques, attributed — who said it is half of what was said. The
     JUDGEMENT lives here (tone, and what it was about); the LINE is a separate
     `stage:critique` scene already handed over verbatim above. Both are
     needed: the line without the tone reads as an opinion nobody held. */
  for (const c of dr.critiques || []) {
    const who = c.judgeName || c.judge || 'the panel';
    const about = (c.reasons || []).length ? ` about her ${(c.reasons || []).join(' and ')}` : '';
    push(`CRITIQUE — ${who} ${c.tone === 'praise' ? 'praised' : c.tone === 'mixed' ? 'was mixed on' : 'criticised'} ${c.queen}${about}.`);
  }

  // THE CALL. Six named groups, and the two bottom ones are different things:
  // BTM means named in the bottom and then saved before the lip sync, BTM2
  // means lip synced. A writer told only "in the bottom" writes a lip sync
  // that never happened.
  const call = dr.call || {};
  push(listLine('WON THE NIGHT', call.win));
  push(listLine('CALLED HIGH', call.high));
  push(listLine('SAFE', call.safe));
  push(listLine('CALLED LOW, safe but critiqued', call.low));
  push(listLine('NAMED IN THE BOTTOM AND THEN SAVED — did NOT lip sync', call.atRisk));
  push(listLine('THE BOTTOM TWO — these two lip synced', call.bottom));

  const ls = dr.lipsync;
  if (ls) {
    const song = ls.song ? `"${ls.song}"${ls.artist ? ` by ${ls.artist}` : ''}` : 'the song';
    push(`THE LIP SYNC: ${(ls.queens || []).join(' against ')} to ${song}.`);
    if (ls.call === 'double-shantay') {
      push('BOTH STAYED. The host sent nobody home tonight.');
    } else if (ls.winner) {
      push(`${ls.winner} stayed. ${ls.loser ? `${ls.loser} did not.` : ''}`);
    }
  }

  push(wentHome.length
    ? `WENT HOME: ${wentHome.join(', ')} — ${w.exit}.`
    : 'NOBODY WENT HOME TONIGHT.');

  if (dr.finale) {
    push(`THE FINALE. ${dr.finale.winner} was crowned. `
      + `${dr.finale.runnerUp ? `${dr.finale.runnerUp} came second. ` : ''}`
      + `Final order: ${(dr.finale.placements || []).join(', ')}.`);
    if (dr.congeniality) push(`${dr.congeniality} was named ${w.audienceAward}.`);
  }

  /* EACH QUEEN'S OWN VOICE, for whoever speaks tonight. Authored on the
     player, never generated: a voice the writer invents is a character the
     rest of the franchise has never met. Queens with nothing authored are
     absent from the map rather than given a blank string, so the prompt can
     tell "no voice on file" from "her voice is empty". */
  const voices = {};
  for (const name of roomTonight) {
    const v = players?.[name]?.drag?.voice;
    if (typeof v === 'string' && v.trim()) voices[name] = v.trim();
  }

  return {
    header: `${w.show} — Episode ${ep}${dr.challenge?.name ? `: ${dr.challenge.name}` : ''}`,
    format: DRAG_FORMAT,
    episode: ep,
    beats,
    voices,
  };
}

/** The beat sheet as the flat text the worker is actually sent. */
export function dragBeatSheetText(row, opts = {}) {
  const sheet = buildDragBeatSheet(row, opts);
  const voiceLines = Object.entries(sheet.voices)
    .map(([n, v]) => `  ${n}: ${v}`).join('\n');
  return [
    sheet.header,
    '',
    ...sheet.beats.map((b, i) => `${i + 1}. ${b}`),
    voiceLines ? `\nVOICES (use these, do not invent one):\n${voiceLines}` : '',
  ].join('\n');
}
