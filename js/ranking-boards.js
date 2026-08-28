// ══════════════════════════════════════════════════════════════════════
// ranking-boards.js — a ranking board per show
// ══════════════════════════════════════════════════════════════════════
//
// A RANKING IS A POSITION ON A BOARD, AND A BOARD RANKS ONE SHOW.
//
// Big Brother 1's seventeen players were applied into rankings_database.json,
// which declares `metadata.format: "total-drama"`, because the updater had no
// concept of a per-show board. They sat interleaved through Total Drama's
// ranks — a houseguest thirteenth among contestants — scored on a different
// rubric, with every Total Drama player below them pushed down a place. Every
// reader that gates on the board's format then correctly refused to show them,
// which is why the site said "No Big Brother rankings yet" about players that
// were sitting in the file.
//
// The scores are not comparable across shows and are not meant to be: js/
// rankings-update.js weights a veto differently from an immunity because the
// two shows are not the same game. Two boards, each ranked 1..N from its own
// top, is the only arrangement in which a rank means anything.
//
// Readers already expected this: rankings.html renders an ARRAY of boards and
// heads each with its show, fame.js matches a player's format against
// `metadata.format`, and player.html refuses a board belonging to another show.
// The array was just never filled with more than one thing.

import { SHOWS, DEFAULT_FORMAT } from './shows.js';

/**
 * Where each show's board lives.
 *
 * Total Drama keeps the bare name it has always had — the same rule the rest of
 * the storage layer follows, where an unprefixed key is Total Drama and every
 * other show is prefixed. A show with no finished season has no board and no
 * entry here; that is not an error, it is a show that has not been ranked yet.
 */
export const BOARD_FILES = {
  'total-drama': 'rankings_database.json',
  'big-brother': 'rankings_bb.json',
  // The Traitors. NOT rankings_database.json — that file says
  // `metadata.format: "total-drama"` about itself, and the last time a second
  // show was applied into it the houseguests landed at ranks 13, 26 and 28
  // among contestants while every correct reader refused to draw them. The
  // scores are not comparable: js/rankings-update.js prices a Shield against a
  // murder ballot, which is not a sentence about either other show.
  traitors: 'rankings_tr.json',
};

/** The board file for a show, or null if that show does not have one. */
export function boardFile(format) {
  return BOARD_FILES[format] || null;
}

/**
 * What show a board ranks.
 *
 * An untagged board is Total Drama's: the file predates the second show and
 * every reader in the repo already makes that assumption, so making it here
 * once keeps them agreeing.
 */
export function boardFormat(board) {
  return board?.metadata?.format || DEFAULT_FORMAT;
}

/**
 * Every board the site has, in the registry's order.
 *
 * A MISSING FILE IS NOT A FAILURE. Boards appear one show at a time, as each
 * show finishes its first season, so a 404 here means "not ranked yet" and the
 * pages that call this must keep working without it — the alternative is that
 * adding a third show breaks every page until somebody finishes a season of it.
 *
 * `root` is for pages served from a subdirectory; it defaults to the page's own
 * directory, which is how every existing caller fetches.
 */
export async function loadRankingBoards(root = '') {
  const base = root ? root.replace(/\/+$/, '') + '/' : '';
  const formats = Object.keys(SHOWS).filter(f => BOARD_FILES[f]);
  const boards = await Promise.all(formats.map(async format => {
    try {
      const resp = await fetch(base + BOARD_FILES[format], { cache: 'no-store' });
      if (!resp.ok) return null;
      const board = await resp.json();
      if (!board || !Array.isArray(board.rankings)) return null;
      // Stamp the format when the file forgot to. The Total Drama board is the
      // one that predates the tag, and a board that cannot say what it ranks
      // gets filtered out of every show-scoped view.
      board.metadata = { ...(board.metadata || {}), format: board.metadata?.format || format };
      return board;
    } catch {
      return null;
    }
  }));
  return boards.filter(Boolean);
}

/**
 * This player's standing, from the board belonging to the show being viewed.
 *
 * `format` is the show in view. Pass null (or the switcher's "all") to search
 * every board — a player who has played two shows has a standing on each, and
 * the first one found is the one whose board was listed first.
 */
export function findRankEntry(boards, { id, name, format = null } = {}) {
  for (const board of boards || []) {
    if (format && boardFormat(board) !== format) continue;
    const row = (board.rankings || []).find(r =>
      (id && r.playerId === id) || (name && r.name === name));
    if (row) return { entry: row, board, format: boardFormat(board) };
  }
  return null;
}
