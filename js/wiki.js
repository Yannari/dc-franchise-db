// A character's page, in the shape a fandom wiki uses.
//
// Everything here already existed and was shown nowhere. The player page was a
// stat sheet: bars, chips, placements. Meanwhile players_database carries a
// per-season narrative for 150 of 152 people, every season detail carries
// keyMoments and notes, voice-profiles.json describes how each of them talks,
// and js/records.js knows what they hold. None of it appeared on their page.
//
// So this assembles a DOSSIER — who they are, what they did in each show, who
// they were close to, what records they hold, what people remember — and the
// page renders it. The assembly is here rather than in the page because the
// per-character social profiles will want the same thing, and two versions of
// "who is this person" would disagree within a season.
//
// WHAT IT WILL NOT DO IS FILL GAPS WITH PROSE. A section with no data is
// omitted, not padded: 16 of 152 players have recorded bonds, and no published
// season carries showmances yet because the export only started recording them.
// A relationships section that invented something for everybody would be the
// most-read part of the page and the least true.
//
// Pure: documents in, a dossier out. No fetch, no DOM.
import { parseBio } from './bio.js';

const DEFAULT_FORMAT = 'total-drama';
const SHOW_NAMES = { 'total-drama': 'Total Drama', 'big-brother': 'Big Brother' };
const showName = f => SHOW_NAMES[f] || f;
const fmtOf = d => d?.format || DEFAULT_FORMAT;

/**
 * The story, split back into the seasons it was written about.
 *
 * `player.story` is one long string with "SEASON 4 — Title" headers in it, and
 * the headers repeat — the generator emitted each one twice. Rendered raw it is
 * a wall with duplicated titles; split, it becomes a section per season that can
 * sit beside that season's placement.
 */
export function splitStory(story) {
  const text = String(story || '').trim();
  if (!text) return [];
  const parts = [];
  const re = /^SEASON\s+(\d+)\s*[—–-]\s*(.+)$/gim;
  const heads = [...text.matchAll(re)];
  if (!heads.length) return [{ season: null, title: null, text }];

  for (const [i, m] of heads.entries()) {
    const start = m.index + m[0].length;
    const end = i + 1 < heads.length ? heads[i + 1].index : text.length;
    const body = text.slice(start, end).trim();
    if (!body) continue;                     // a repeated header with no prose
    const season = Number(m[1]);
    const last = parts[parts.length - 1];
    // The duplicate header case: same season, and the previous entry already
    // holds this prose.
    if (last && last.season === season && last.text === body) continue;
    parts.push({ season, title: m[2].trim(), text: body });
  }
  return parts;
}

/** Their personality, without the bio sentence the Studio prepends to it. */
export function personalityOf(name, voices = {}) {
  const raw = voices[name];
  if (!raw) return '';
  return parseBio(raw).prose;
}

/**
 * Who they were close to, and who they were not.
 *
 * Bonds come from `unbreakableBonds` on each season detail — the only
 * relationship the published databases have ever carried. Showmances, alliances
 * and rivalries come from the SEASON DOCUMENTS, which only started recording
 * them; a season published before that contributes nothing rather than an empty
 * couple.
 */
export function relationshipsOf(player, { seasonDocs = [] } = {}) {
  const name = player.name;
  const bonds = new Map();
  for (const d of player.seasonDetails || []) {
    for (const other of d.unbreakableBonds || []) {
      const e = bonds.get(other) || { name: other, seasons: [] };
      e.seasons.push({ season: d.season, format: fmtOf(d), seasonId: d.seasonId });
      bonds.set(other, e);
    }
  }

  const showmances = [];
  const alliances = [];
  const rivalries = [];
  for (const doc of seasonDocs) {
    if (!doc) continue;
    const label = { season: doc.seasonNumber, format: doc.format || DEFAULT_FORMAT, seasonId: doc.seasonId };
    for (const sh of doc.showmances || []) {
      if (!(sh.players || []).includes(name)) continue;
      showmances.push({ ...sh, ...label, partner: sh.players.find(n => n !== name) || null });
    }
    for (const a of doc.alliances || []) {
      if (!(a.members || []).includes(name)) continue;
      alliances.push({ ...a, ...label });
    }
    for (const r of doc.rivalries || []) {
      if (!(r.players || []).includes(name)) continue;
      rivalries.push({ ...r, ...label, rival: r.players.find(n => n !== name) || null });
    }
  }

  return {
    bonds: [...bonds.values()].sort((a, b) => b.seasons.length - a.seasons.length),
    showmances,
    alliances,
    rivalries,
    // What the page needs to decide whether to draw the section at all.
    any: bonds.size > 0 || showmances.length > 0 || alliances.length > 0 || rivalries.length > 0,
  };
}

/** Are they with somebody as of the last season they played? */
export function coupleStatus(relationships) {
  const live = (relationships.showmances || []).filter(sh => sh.phase !== 'broken');
  if (live.length) {
    const latest = live.reduce((a, b) => ((b.season || 0) > (a.season || 0) ? b : a));
    return { together: true, partner: latest.partner, since: latest.season };
  }
  const broken = (relationships.showmances || []).filter(sh => sh.phase === 'broken');
  if (broken.length) {
    const latest = broken.reduce((a, b) => ((b.season || 0) > (a.season || 0) ? b : a));
    return { together: false, partner: latest.partner, endedBy: latest.endedBy, season: latest.season };
  }
  return null;
}

/** Every record this player is the holder of, from the shared engine. */
export function recordsHeldBy(playerId, milestonesByShow = {}) {
  const held = [];
  for (const [format, rows] of Object.entries(milestonesByShow)) {
    for (const m of rows || []) {
      if (m.playerSlug === playerId) held.push({ ...m, show: showName(format) });
    }
  }
  return held;
}

/**
 * Their career, one entry per show.
 *
 * Deliberately grouped rather than listed flat: two Total Drama seasons and one
 * Big Brother season is two careers, and a single chronological list says the
 * opposite.
 */
export function careerOf(player, { seasonTitles = new Map() } = {}) {
  const byShow = new Map();
  const story = splitStory(player.story);

  for (const d of player.seasonDetails || []) {
    const f = fmtOf(d);
    if (!byShow.has(f)) byShow.set(f, { format: f, show: showName(f), seasons: [] });
    // The story is split by season NUMBER, which is unambiguous inside one show.
    const chapter = story.find(x => x.season === Number(d.season));
    byShow.get(f).seasons.push({
      season: d.season,
      seasonId: d.seasonId,
      title: seasonTitles.get(d.seasonId) || seasonTitles.get(d.season) || chapter?.title || null,
      placement: d.placement,
      status: d.status,
      tribe: d.tribe,
      keyMoments: d.keyMoments || [],
      notes: d.notes || [],
      story: chapter?.text || '',
    });
  }

  for (const entry of byShow.values()) {
    entry.seasons.sort((a, b) => a.season - b.season);
    entry.count = entry.seasons.length;
    entry.wins = entry.seasons.filter(s => Number(s.placement) === 1).length;
    entry.best = Math.min(...entry.seasons.map(s => Number(s.placement) || 99));
  }
  return [...byShow.values()].sort((a, b) => b.count - a.count);
}

/**
 * The dossier, reduced to FACTS for a writer.
 *
 * The character page's prose should be WRITTEN rather than assembled — a bio is
 * not a personality profile plus a list of placements, and the difference shows
 * immediately. But a model must be handed facts rather than left to remember:
 * it gets what happened and writes about it, and anything it states that is not
 * in here is an invention. Same contract the social feed's featured posts use.
 *
 * Deliberately flat and small. A prompt carrying the whole database costs money
 * and buys confusion.
 */
export function dossierFacts(dossier) {
  if (!dossier) return null;
  return {
    name: dossier.name,
    bio: dossier.bio,
    personality: dossier.personality,
    shows: dossier.career.map(c => ({
      show: c.show,
      wins: c.wins,
      best: c.best,
      seasons: c.seasons.map(s => ({
        season: s.season, title: s.title, placement: s.placement,
        status: s.status, moments: s.keyMoments,
      })),
    })),
    closestTo: dossier.relationships.bonds.map(b => b.name),
    couple: dossier.couple,
    alliances: dossier.relationships.alliances.map(a => a.name),
    rivalries: dossier.relationships.rivalries.map(r => r.rival),
    records: dossier.records.map(r => `${r.category}: ${r.stat}`),
  };
}

/**
 * A fingerprint of everything a written bio depends on.
 *
 * THE POINT IS NOT TO REWRITE. A character's page is read far more often than
 * their career changes, and paying a model on every view would be absurd. Store
 * the prose against this hash and regenerate only when it moves — which happens
 * when a season is published, a record changes hands or a showmance is
 * recorded. Everything else leaves it alone.
 */
export function dossierHash(dossier) {
  const facts = dossierFacts(dossier);
  if (!facts) return '';
  const text = JSON.stringify(facts);
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(36);
}

/**
 * The whole dossier.
 *
 * `seasonDocs` is optional — pass the published season documents and the
 * relationships section gains showmances, alliances and rivalries. Without them
 * it still has bonds, which is what every season published so far carries.
 */
export function buildDossier(player, {
  voices = {}, roster = [], seasonDocs = [], seasonTitles = new Map(),
  milestonesByShow = {},
} = {}) {
  if (!player) return null;
  const rosterRow = (roster.players || roster || []).find(r => r.slug === player.id) || {};
  const parsed = parseBio(voices[player.name] || '');

  const bio = {
    age: rosterRow.age ?? parsed.age ?? null,
    ethnicity: rosterRow.ethnicity || parsed.ethnicity || '',
    nationality: rosterRow.nationality || parsed.nationality || '',
    sexuality: rosterRow.sexuality || parsed.sexuality || '',
    gender: rosterRow.gender || '',
    archetype: rosterRow.archetype || '',
  };
  const relationships = relationshipsOf(player, { seasonDocs });

  return {
    id: player.id,
    name: player.name,
    bio,
    // Stated only when something is actually known, so the page can skip the
    // line rather than printing an empty one.
    bioLine: [
      bio.age ? `${bio.age}` : '',
      [bio.ethnicity, bio.nationality].filter(Boolean).join(' '),
      bio.sexuality && bio.sexuality !== 'straight' ? bio.sexuality : '',
      bio.archetype,
    ].filter(Boolean).join(' · '),
    personality: personalityOf(player.name, voices),
    career: careerOf(player, { seasonTitles }),
    relationships,
    couple: coupleStatus(relationships),
    records: recordsHeldBy(player.id, milestonesByShow),
    moments: (player.seasonDetails || []).flatMap(d =>
      (d.keyMoments || []).map(text => ({
        text, season: d.season, format: fmtOf(d), seasonId: d.seasonId,
      }))),
  };
}
