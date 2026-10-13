// ══════════════════════════════════════════════════════════════════════
// returnee-briefing.js — what a returning player walks in with, for the AI
// episode writer
// ══════════════════════════════════════════════════════════════════════
//
// This was Legacy's "Returnee Briefing" tab: tick the returning cast, press
// Generate, copy the result, paste it into Episode 1's franchise context on
// the episode page. Nothing read the stored copy, so a season whose briefing
// nobody pasted reached the writer with every returnee as a stranger. The
// simulator itself has carried history on its own for a long time (bonds,
// grudges, returnee dialogue); the writer was the one place still waiting on
// a paste. The user, 2026-10-13: "remove returnee briefing ... the system
// already does it now no?" -- now it does: current-season.html builds this
// once per season, when it assembles the writer's context, and the tab is gone.
//
// The history is the published record (players_database.json) plus the
// rankings boards; the Season Builder Worker's `returnee-history` mode turns
// each into a history line and a Voice line.

import { loadRankingBoards } from './ranking-boards.js';
import { DEFAULT_FORMAT } from './shows.js';

export const BRIEF_NOTE = `NOTE: Each character below has a "Voice:" line that defines exactly how they talk — their register, verbal tics, and how they sound winning vs. cornered. This is the definitive guide to their dialogue; use it and never let a character drift into a generic archetype. The rest of each line is their franchise history (use it for arcs, grudges, and callbacks).`;

/**
 * The published seasons a player brings into THIS one. Earlier seasons of the
 * same show only -- a later one has not happened yet -- and every season of
 * another show (there is no shared calendar to order them by).
 */
export function pastSeasonsOf(player, { format = DEFAULT_FORMAT, season = 0 } = {}) {
  return (player?.seasonDetails || []).filter(d => {
    const f = d.format || DEFAULT_FORMAT;
    return f !== format || Number(d.season) < Number(season);
  });
}

/** What the worker is sent for each returnee. */
export function briefingPayload(names, { players = [], rankings = [], format, season, careerOf = () => null, archetypeOf = () => null } = {}) {
  const rmap = Object.fromEntries(rankings.map(r => [r.name, r]));
  return names.map(name => {
    const p = players.find(x => x.name === name) || {};
    const r = rmap[name] || {};
    const career = careerOf(name);
    const past = format != null ? pastSeasonsOf(p, { format, season }) : (p.seasonDetails || []);
    return {
      name,
      archetype: (career && career.archetype) || archetypeOf(name) || null,
      wins: past.filter(d => Number(d.placement) === 1).length,
      seasons: past.map(d => ({
        season: d.season, placement: d.placement, status: d.status,
        story: d.story || null, keyMoments: d.keyMoments || [],
        alliances: d.alliances || [], rivalries: d.rivalries || [],
        challengeWins: d.challengeWins || 0, idolsFound: d.idolsFound || 0,
        votesReceived: d.votesReceived || 0, juryVotes: d.juryVotes || 0,
      })),
      rankings: r.title ? { title: r.title, tier: r.tier, reasoning: r.reasoning, strengths: r.strengths, weaknesses: r.weaknesses } : null,
      ledger: career ? {
        allies: Object.keys(career.allies || {}).slice(0, 6),
        rivals: Object.keys(career.rivals || {}).slice(0, 6),
        betrayed: Object.keys(career.betrayed || {}).slice(0, 6),
        betrayedBy: Object.keys(career.betrayedBy || {}).slice(0, 6),
      } : null,
    };
  });
}

/** One "- Name (label): history Voice: voice" line per returnee, from the worker. */
export async function writeReturneeBriefing(workerUrl, payload) {
  const resp = await fetch(workerUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode: 'returnee-history', players: payload }),
  });
  if (!resp.ok) throw new Error(`Worker failed (${resp.status}): ${await resp.text()}`);
  const data = await resp.json();
  if (data.error) throw new Error(data.error);
  return (data.players || []).map(e => ({ name: e.name, line: `- ${e.name} (${e.label}): ${e.history} Voice: ${e.voice}` }));
}

/**
 * Everything the episode page needs: who in this cast is a returnee, and
 * their briefing lines. Returns [] when nobody has played before, so a
 * first-time cast costs no worker call.
 */
export async function briefReturnees(castNames, { format, season, workerUrl, careerOf, archetypeOf } = {}) {
  const [db, boards] = await Promise.all([
    fetch('players_database.json').then(r => (r.ok ? r.json() : null)).catch(() => null),
    loadRankingBoards().catch(() => []),
  ]);
  const players = (db && db.players) || [];
  const returnees = castNames.filter(n => pastSeasonsOf(players.find(p => p.name === n), { format, season }).length);
  if (!returnees.length || !workerUrl) return [];
  const payload = briefingPayload(returnees, { players, rankings: boards.flatMap(b => b.rankings || []), format, season, careerOf, archetypeOf });
  return writeReturneeBriefing(workerUrl, payload);
}
