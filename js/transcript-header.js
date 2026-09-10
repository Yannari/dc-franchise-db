// ══════════════════════════════════════════════════════════════════════
// transcript-header.js — the block every show's transcript opens with
// ══════════════════════════════════════════════════════════════════════
//
// current-season.html reads a transcript with three parsers, and all three
// look for `=== HEADER ===` blocks: parseCastFromSummary wants CAST (ALL) and
// the active-roster block, parseEliminated wants the eliminated block,
// parseEpisodeTitle wants the META line. Total Drama emits them from
// _textCast/_textMeta in js/text-backlog.js and Big Brother from
// js/bb-structured.js.
//
// The Traitors and Drag Race emitted NONE of it. Their transcripts opened
// straight into narration, so the Control Room learned no cast, no roster and
// no eliminations from either show -- the "player section" was simply absent.
//
// ONE EMITTER, FOUR SHOWS, so the next show cannot ship without it and the
// three parsers only ever have one shape to know about.
//
// THE ROSTER HEADER TAKES ITS WORDS FROM THE REGISTRY. Total Drama says
// TRIBES because it has tribes and Big Brother says STILL IN THE HOUSE
// because it has a house; printing either one over a castle or a werk room is
// the exact bug class docs/ADDING-A-SHOW.md exists for. Every show gets
// `STILL IN THE <its own word>`, built from `showWords(format).players`, and
// the parser in current-season.html matches that shape rather than a list of
// literal names.
import { gs, seasonConfig, players } from './core.js';
import { showWords, showName } from './shows.js';

/** The roster header this show uses, in its own vocabulary. */
export function rosterHeaderFor(format) {
  const w = showWords(format);
  // 'queens' -> STILL IN THE COMPETITION reads wrong; the word is the PLACE
  // the show keeps them, and only Total Drama's is a group of people.
  const place = { 'big-brother': 'HOUSE', traitors: 'CASTLE', 'drag-race': 'COMPETITION' }[format];
  return place ? `STILL IN THE ${place}` : `STILL IN (${String(w.players || 'players').toUpperCase()})`;
}

/**
 * The header block, as an array of lines.
 *
 * `active` and `eliminated` are passed in rather than read off `gs`, because a
 * transcript is written for ONE episode and a replayed or re-read row is not
 * necessarily the live state. Callers that have no better answer may hand over
 * the live lists; what they must not do is let this reach for them silently.
 */
export function transcriptHeaderLines(ep, {
  format,
  title = '',
  active = [],
  eliminated = [],
  cast = null,
  phase = null,
  extra = [],
} = {}) {
  const L = [];
  const ln = s => L.push(s);
  const sec = t => { ln(''); ln(`=== ${t} ===`); };
  const names = (cast && cast.length ? cast : (players || []).map(p => p?.name))
    .filter(Boolean);

  ln('=== META ===');
  ln(`SEASON: ${seasonConfig?.name || showName(format) || 'Unknown'}`);
  ln(`EPISODE ${ep?.num ?? ''}${title ? ` - "${title}"` : ''}`);
  ln(`Phase: ${phase || gs?.phase || 'unknown'} | ${
    String(showWords(format).players || 'players').replace(/^./, c => c.toUpperCase())
  } Remaining: ${active.length}`);
  for (const line of extra) ln(line);

  sec('CAST (ALL)');
  names.forEach(n => ln(n));

  sec(rosterHeaderFor(format));
  active.forEach(n => ln(n));

  sec('ELIMINATED (PERMANENT)');
  if (eliminated.length) eliminated.forEach(n => ln(n));
  else ln('None yet.');

  /* ── AND A LINE THAT CLOSES THE LAST BLOCK ────────────────────────
     parseBlock in current-season.html reads from its header until the next
     line beginning `===` and stops nowhere else -- there is a fallback list of
     terminators, and every name on it is a Total Drama section. Total Drama
     and Big Brother are bounded by accident: both go on to emit more `===`
     sections further down. The castle and the main stage do not; their
     narration is `LABEL` over a rule of dashes.
     Without this line the ELIMINATED block swallowed the entire episode --
     measured at 180 lines where three were expected -- and the Control Room
     would have filed every sentence of narration as the name of a departed
     player. */
  ln('');
  ln('=== EPISODE ===');
  return L;
}
