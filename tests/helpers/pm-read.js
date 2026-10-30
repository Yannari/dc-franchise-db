// A played Perfect Match season with readable names, and its lines as the
// transcript prints them — for the season-read audits and tests (the same
// cast as tests/pm-transcript-audit.test.js, so seed 7 here is the seed 7
// the user read).
import { setPlayers } from '../../js/core.js';
import { playPerfectMatchSeason } from '../../js/pm/season.js';
import { phasesOf } from '../../js/pm/transcript.js';
import { makeIslanders, roleSetup } from './pm-cast.js';

const F = ['Priya', 'Amber', 'Chloe', 'Jess', 'Mia', 'Tasha', 'Ellie', 'Nadia', 'Sophie', 'Leah', 'Keisha', 'Gemma', 'Ruby', 'Faye', 'Lana', 'Zara', 'Cara', 'Olivia', 'Molly', 'Tanya'];
const M = ['Theo', 'Jordan', 'Callum', 'Ryan', 'Marcus', 'Josh', 'Kai', 'Liam', 'Dan', 'Reece', 'Elliot', 'Sammy', 'Luca', 'Jake', 'Tom', 'Finn', 'Adam', 'Ovie', 'Shaq', 'Will'];
const HOME = ['uk', 'us', 'scot', 'au', 'ie', 'essex', 'ca', 'geordie', 'nz', 'za', 'uk', 'us', 'uk', 'au', 'scot', 'uk'];
const ABROAD = ['es', 'it', 'fr', 'br', 'de', 'es'];

export function playReadSeason(seed = 7, size = 22) {
  const cast = makeIslanders(size, seed).map((p, i) => ({ ...p, name: (i % 2 === 0 ? F : M)[Math.floor(i / 2)] }));
  setPlayers(cast);
  const names = cast.map(p => p.name);
  const setup = roleSetup(names);
  names.forEach((n, i) => { setup[n].dialect = setup[n].role === 'casa' ? ABROAD[i % ABROAD.length] : HOME[i % HOME.length]; });
  const { rows, state } = playPerfectMatchSeason({ cast: names, setup, seed });
  return { rows, state, names, cast };
}

/** One event's lines, as the transcript prints them. */
export function eventLines(e) {
  const out = [];
  if (e.narrator?.before) out.push(...e.narrator.lines.map(l => ({ who: 'NARRATOR', text: l.text })));
  if (e.script?.stage) out.push({ who: null, text: e.script.stage, stage: true });
  for (const l of e.script?.lines || []) out.push(l.action ? { who: null, text: l.text, stage: true } : { who: l.who, text: l.text });
  if (e.script?.beat) out.push({ who: null, text: e.script.beat, stage: true });
  if (e.narrator && !e.narrator.before) out.push(...e.narrator.lines.map(l => ({ who: 'NARRATOR', text: l.text })));
  for (const l of e.hut?.script?.lines || []) out.push({ who: e.hut.who, text: l.text, hut: true });
  return out;
}

/** [label, events, lines] for each phase of an episode, aired events only. */
export function phaseLines(row) {
  return phasesOf(row).map(([ph, evs, label]) => {
    const aired = evs.filter(e => e.aired);
    return { ph, label, events: aired, lines: aired.flatMap(eventLines) };
  });
}

export const VILLA_MOMENTS = new Set(['villa', 'recoupling', 'bombshell', 'public-vote', 'villa-vote', 'photos', 'movie-night']);
