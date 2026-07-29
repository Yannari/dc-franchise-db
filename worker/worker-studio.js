// Casting Studio backend — Cloudflare Worker (Path A: commit-to-Git storage).
//
// Mirrors the serve.py write endpoints, but instead of writing local files it
// commits them into your GitHub repo via the GitHub Contents API. GitHub Pages
// then redeploys, so a Save on the live site becomes a permanent repo change.
//
//   GET  /api/ping       -> {ok:true, roster:<count>}          (server detection)
//   GET  /api/avatars    -> {avatars:[<slug>, ...]}            (library picker)
//   POST /api/character   {roster:{...}, voice:{name,text}, avatar:{slug,dataUri}}
//        -> upserts franchise_roster.json + voice-profiles.json + assets/avatars/<slug>.png
//        (requires  Authorization: Bearer <STUDIO_TOKEN>)
//
// D1-backed read endpoints (PUBLIC — no token, read-only, safe to call from any page):
//   GET  /api/leaderboard?stat=wins&limit=20&minSeasons=1
//   GET  /api/relationships?player=<slug>
//   GET  /api/stats      -> {stats:[...]}  (which leaderboards exist; for menus)
//   GET  /api/roster?includeRetired=1 -> the character pool (source of truth)
//
// Roster writes (require Authorization: Bearer <STUDIO_TOKEN>):
//   POST /api/roster           {slug,name,gender,sexuality,archetype,stats{},voice}
//   POST /api/roster/delete    {slug, force?}  -> deletes if unplayed, else retires
//   POST /api/roster/unretire  {slug}
//   POST /api/roster/publish   -> regenerates franchise_roster.json + voice-profiles.json
//
// Config (wrangler.toml [vars]): GITHUB_REPO ("owner/repo"), GITHUB_BRANCH,
// ALLOWED_ORIGIN (your site origin, or "*").
// Secrets (wrangler secret put): GITHUB_TOKEN (fine-grained PAT, contents:write
// on this repo only), STUDIO_TOKEN (a long random string the frontend sends).
// Binding (wrangler.toml [[d1_databases]]): DB -> the "dc-franchise" D1 database.

const ROSTER_PATH = 'franchise_roster.json';
const VOICE_PATH = 'voice-profiles.json';
const AVATAR_DIR = 'assets/avatars';
const SLUG_RE = /^[a-z0-9][a-z0-9-]*$/;
const ROSTER_FIELDS = ['name', 'slug', 'gender', 'sexuality', 'archetype', 'stats'];

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const cors = corsHeaders(request, env);

    // The D1 read endpoints serve public data, so they are readable from ANY
    // origin (including localhost during development). The studio write
    // endpoint keeps the strict ALLOWED_ORIGIN check.
    const PUBLIC_READS = ['/api/leaderboard', '/api/relationships', '/api/stats', '/api/roster'];
    const isPublicRead = PUBLIC_READS.includes(url.pathname);
    const rcors = isPublicRead ? { ...cors, 'Access-Control-Allow-Origin': '*' } : cors;

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: rcors });

    try {
      if (request.method === 'GET' && url.pathname === '/api/ping') {
        const doc = await getJson(env, ROSTER_PATH, { players: [] });
        return json({ ok: true, roster: (doc.players || []).length }, 200, cors);
      }
      if (request.method === 'GET' && url.pathname === '/api/avatars') {
        return json({ avatars: await listAvatars(env) }, 200, cors);
      }
      // ── public D1 reads (no Authorization header required) ────────────────
      if (request.method === 'GET' && url.pathname === '/api/stats') {
        return json({ ok: true, stats: statCatalog() }, 200, rcors, 3600);
      }
      if (request.method === 'GET' && url.pathname === '/api/leaderboard') {
        return json(await leaderboard(env, url.searchParams), 200, rcors, 300);
      }
      if (request.method === 'GET' && url.pathname === '/api/relationships') {
        return json(await relationships(env, url.searchParams), 200, rcors, 300);
      }
      // ── roster (character pool) ───────────────────────────────────────────
      // GET is public; every write requires the studio token.
      if (request.method === 'GET' && url.pathname === '/api/roster') {
        return json(await rosterList(env, url.searchParams), 200, rcors, 60);
      }
      if (request.method === 'POST' && url.pathname.startsWith('/api/roster')) {
        const auth = (request.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
        if (env.STUDIO_TOKEN && auth !== env.STUDIO_TOKEN) {
          return json({ ok: false, error: 'unauthorized' }, 401, cors);
        }
        const body = await request.json().catch(() => ({}));
        if (url.pathname === '/api/roster')          return json(await rosterSave(env, body), 200, cors);
        if (url.pathname === '/api/roster/delete')   return json(await rosterDelete(env, body), 200, cors);
        if (url.pathname === '/api/roster/unretire') return json(await rosterUnretire(env, body), 200, cors);
        if (url.pathname === '/api/roster/publish')  return json(await rosterPublish(env), 200, cors);
        return json({ ok: false, error: 'unknown roster endpoint' }, 404, cors);
      }
      if (request.method === 'POST' && url.pathname === '/api/character') {
        const auth = (request.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
        if (env.STUDIO_TOKEN && auth !== env.STUDIO_TOKEN) {
          return json({ ok: false, error: 'unauthorized' }, 401, cors);
        }
        const payload = await request.json().catch(() => ({}));
        const result = await writeCharacter(env, payload);
        return json(result, 200, cors);
      }
      return json({ ok: false, error: 'unknown endpoint' }, 404, rcors);
    } catch (e) {
      const status = e && e.status ? e.status : (e instanceof ValidationError ? 400 : 500);
      // rcors so the browser can READ the error body (a CORS-blocked 400 just
      // looks like a network failure to fetch(), which hides the real message).
      return json({ ok: false, error: String(e && e.message || e) }, status, rcors);
    }
  },
};

// ══ D1 read endpoints ══════════════════════════════════════════════════════
//
// SAFETY NOTE: every value that comes from the URL is passed with .bind(?),
// never glued into the SQL string. That is what makes SQL injection impossible.
// Column/expression names CANNOT be bound with ? — so anything that picks a
// column (the ?stat= parameter) is looked up in the whitelist below instead.

const LEADERBOARD_STATS = {
  wins:          { label: 'Season wins',        expr: 'SUM(CASE WHEN a.placement = 1 THEN 1 ELSE 0 END)', dir: 'DESC' },
  finals:        { label: 'Finals appearances', expr: 'SUM(CASE WHEN a.placement <= 2 THEN 1 ELSE 0 END)', dir: 'DESC' },
  seasons:       { label: 'Seasons played',     expr: 'COUNT(*)',                        dir: 'DESC' },
  challenges:    { label: 'Challenge wins',     expr: 'SUM(COALESCE(a.challenge_wins,0))', dir: 'DESC' },
  immunities:    { label: 'Immunity wins',      expr: 'SUM(COALESCE(a.immunity_wins,0))',  dir: 'DESC' },
  rewards:       { label: 'Reward wins',        expr: 'SUM(COALESCE(a.reward_wins,0))',    dir: 'DESC' },
  idols:         { label: 'Idols found',        expr: 'SUM(COALESCE(a.idols_found,0))',    dir: 'DESC' },
  juryVotes:     { label: 'Jury votes',         expr: 'SUM(COALESCE(a.jury_votes,0))',     dir: 'DESC' },
  votesAgainst:  { label: 'Votes against',      expr: 'SUM(COALESCE(a.votes_received,0))', dir: 'DESC' },
  avgPlacement:  { label: 'Best avg placement', expr: 'ROUND(AVG(a.placement), 2)',        dir: 'ASC'  },
};

function statCatalog() {
  return Object.entries(LEADERBOARD_STATS).map(([key, v]) => ({
    key, label: v.label, better: v.dir === 'ASC' ? 'lower' : 'higher',
  }));
}

function db(env) {
  if (!env.DB) throw httpErr('D1 binding "DB" is not configured on this Worker', 503);
  return env.DB;
}

function clampInt(raw, dflt, min, max) {
  const n = parseInt(raw, 10);
  if (!Number.isFinite(n)) return dflt;
  return Math.min(max, Math.max(min, n));
}

async function leaderboard(env, params) {
  const statKey = String(params.get('stat') || 'wins');
  const stat = LEADERBOARD_STATS[statKey];
  if (!stat) {
    throw new ValidationError(`unknown stat "${statKey}" — valid: ${Object.keys(LEADERBOARD_STATS).join(', ')}`);
  }
  const limit = clampInt(params.get('limit'), 20, 1, 200);
  const minSeasons = clampInt(params.get('minSeasons'), 1, 1, 20);

  // stat.expr / stat.dir come from our own whitelist above, never from the user.
  const sql = `
    SELECT p.id, p.name, p.tier,
           ${stat.expr} AS value,
           COUNT(*)     AS seasonsPlayed
    FROM appearances a
    JOIN players p ON p.id = a.player_id
    GROUP BY p.id, p.name, p.tier
    HAVING COUNT(*) >= ?
    ORDER BY value ${stat.dir}, seasonsPlayed DESC, p.name ASC
    LIMIT ?`;
  const { results } = await db(env).prepare(sql).bind(minSeasons, limit).all();

  // Competition ranking: ties share a rank (1,2,2,4) so the page can show medals.
  let lastValue = null, lastRank = 0;
  const rows = (results || []).map((r, i) => {
    const rank = r.value === lastValue ? lastRank : i + 1;
    lastValue = r.value; lastRank = rank;
    return { rank, ...r };
  });
  return { ok: true, stat: statKey, label: stat.label, better: stat.dir === 'ASC' ? 'lower' : 'higher', minSeasons, count: rows.length, rows };
}

async function relationships(env, params) {
  const slug = String(params.get('player') || '').trim().toLowerCase();
  if (!SLUG_RE.test(slug)) throw new ValidationError('player must be a slug, e.g. ?player=alejandro');
  const d = db(env);

  // One batch = one round trip to D1 instead of four.
  const [who, runs, mates, bonds] = await d.batch([
    d.prepare('SELECT id, name, tier, total_seasons AS totalSeasons, wins, best_placement AS bestPlacement, avg_placement AS avgPlacement FROM players WHERE id = ?').bind(slug),

    d.prepare(`SELECT a.season_number AS season, s.title AS seasonTitle, a.placement, a.status,
                      a.tribe, a.challenge_wins AS challengeWins, a.immunity_wins AS immunityWins,
                      a.idols_found AS idolsFound, a.votes_received AS votesReceived,
                      a.jury_votes AS juryVotes, a.final_vote AS finalVote
               FROM appearances a
               LEFT JOIN seasons s ON s.season_number = a.season_number
               WHERE a.player_id = ?
               ORDER BY a.season_number`).bind(slug),

    // The self-join: same season, different person. This is the query the
    // static JSON cannot answer without downloading and looping over everyone.
    d.prepare(`SELECT p.id, p.name, p.tier,
                      COUNT(*) AS sharedSeasons,
                      GROUP_CONCAT(them.season_number) AS seasons
               FROM appearances me
               JOIN appearances them ON them.season_number = me.season_number
                                    AND them.player_id <> me.player_id
               JOIN players p ON p.id = them.player_id
               WHERE me.player_id = ?
               GROUP BY p.id, p.name, p.tier
               ORDER BY sharedSeasons DESC, p.name ASC
               LIMIT 100`).bind(slug),

    // Bonds are stored per-record, so look both ways. Many pairs are recorded
    // from BOTH sides (a->b and b->a), hence DISTINCT or allies show up twice.
    d.prepare(`SELECT DISTINCT
                      CASE WHEN b.player_id = ?1 THEN b.ally_id ELSE b.player_id END AS id,
                      p.name, b.season_number AS season
               FROM bonds b
               JOIN players p ON p.id = CASE WHEN b.player_id = ?1 THEN b.ally_id ELSE b.player_id END
               WHERE b.player_id = ?1 OR b.ally_id = ?1
               ORDER BY b.season_number`).bind(slug),
  ]);

  const player = (who.results || [])[0];
  if (!player) throw httpErr(`no player with id "${slug}"`, 404);

  return {
    ok: true,
    player,
    seasons: runs.results || [],
    castmates: (mates.results || []).map(m => ({
      ...m,
      seasons: String(m.seasons || '').split(',').filter(Boolean).map(Number).sort((a, b) => a - b),
    })),
    bonds: bonds.results || [],
  };
}

// ══ roster: the character pool, source of truth in D1 ══════════════════════
//
// Authored data (unlike players/appearances/bonds, which are derived from sim
// results). The Casting Studio reads and writes this live; franchise_roster.json
// becomes a published snapshot, refreshed by /api/roster/publish.

const STAT_KEYS = ['physical', 'endurance', 'mental', 'social', 'strategic',
                   'loyalty', 'boldness', 'intuition', 'temperament'];

const ARCHETYPES = new Set(['mastermind', 'schemer', 'hothead', 'challenge-beast',
  'social-butterfly', 'loyal-soldier', 'wildcard', 'chaos-agent', 'floater',
  'underdog', 'hero', 'villain', 'goat', 'perceptive-player', 'showmancer']);

function rosterRowToJson(r) {
  const stats = {};
  for (const k of STAT_KEYS) if (r[k] != null) stats[k] = r[k];
  const out = { name: r.name, slug: r.slug };
  if (r.gender) out.gender = r.gender;
  if (r.archetype) out.archetype = r.archetype;
  if (Object.keys(stats).length) out.stats = stats;
  if (r.sexuality) out.sexuality = r.sexuality;
  if (r.is_returnee) out.isReturnee = true;
  return out;
}

async function rosterList(env, params) {
  const includeRetired = params.get('includeRetired') === '1';
  const sql = `SELECT * FROM roster ${includeRetired ? '' : 'WHERE retired = 0'} ORDER BY rowid`;
  const { results } = await db(env).prepare(sql).all();
  return {
    ok: true,
    count: (results || []).length,
    players: (results || []).map(r => ({
      ...rosterRowToJson(r),
      voice: r.voice || '',
      retired: !!r.retired,
      updatedAt: r.updated_at,
    })),
  };
}

/** Validate + upsert one character. Returns {created:bool}. */
async function rosterSave(env, payload) {
  const slug = String(payload.slug || '').trim().toLowerCase();
  const name = String(payload.name || '').trim();
  if (!name) throw new ValidationError('character name is required');
  if (!SLUG_RE.test(slug)) throw new ValidationError('slug must be lowercase letters, digits, and dashes');

  const archetype = payload.archetype ? String(payload.archetype).trim() : null;
  if (archetype && !ARCHETYPES.has(archetype)) {
    throw new ValidationError(`unknown archetype "${archetype}"`);
  }

  // Only the 9 real stats are accepted; anything else is silently dropped so a
  // typo like "charisma" can never become a column of garbage.
  const stats = payload.stats || {};
  const statVals = STAT_KEYS.map(k => {
    const n = Number(stats[k]);
    return Number.isFinite(n) ? Math.max(0, Math.min(10, Math.round(n))) : null;
  });

  const d = db(env);
  const existing = await d.prepare('SELECT slug FROM roster WHERE slug = ?').bind(slug).first();

  await d.prepare(
    `INSERT INTO roster (slug,name,gender,sexuality,archetype,${STAT_KEYS.join(',')},
                         voice,is_returnee,retired,updated_at)
     VALUES (?,?,?,?,?,${STAT_KEYS.map(() => '?').join(',')},?,?,?,datetime('now'))
     ON CONFLICT(slug) DO UPDATE SET
       name=excluded.name, gender=excluded.gender, sexuality=excluded.sexuality,
       archetype=excluded.archetype,
       ${STAT_KEYS.map(k => `${k}=excluded.${k}`).join(', ')},
       voice=excluded.voice, is_returnee=excluded.is_returnee,
       retired=excluded.retired, updated_at=datetime('now')`
  ).bind(
    slug, name,
    payload.gender || null, payload.sexuality || null, archetype,
    ...statVals,
    payload.voice ? String(payload.voice) : null,
    payload.isReturnee ? 1 : 0,
    payload.retired ? 1 : 0,
  ).run();

  return { ok: true, slug, name, created: !existing };
}

/**
 * Smart delete. A character who has never played is removed outright; one with
 * season history is RETIRED instead, so their appearances/bonds rows are never
 * orphaned. Pass force:true to retire-vs-delete anyway.
 */
async function rosterDelete(env, payload) {
  const slug = String(payload.slug || '').trim().toLowerCase();
  if (!SLUG_RE.test(slug)) throw new ValidationError('slug is required');
  const d = db(env);

  const row = await d.prepare('SELECT slug, name, retired FROM roster WHERE slug = ?').bind(slug).first();
  if (!row) throw httpErr(`no character with slug "${slug}"`, 404);

  const played = await d.prepare('SELECT COUNT(*) AS n FROM appearances WHERE player_id = ?').bind(slug).first();
  const seasons = (played && played.n) || 0;

  if (seasons > 0 && !payload.force) {
    await d.prepare("UPDATE roster SET retired = 1, updated_at = datetime('now') WHERE slug = ?").bind(slug).run();
    return { ok: true, action: 'retired', slug, name: row.name, seasons,
             message: `${row.name} has ${seasons} season(s) of history and was retired instead of deleted.` };
  }

  await d.prepare('DELETE FROM roster WHERE slug = ?').bind(slug).run();
  return { ok: true, action: 'deleted', slug, name: row.name, seasons };
}

async function rosterUnretire(env, payload) {
  const slug = String(payload.slug || '').trim().toLowerCase();
  if (!SLUG_RE.test(slug)) throw new ValidationError('slug is required');
  const r = await db(env).prepare(
    "UPDATE roster SET retired = 0, updated_at = datetime('now') WHERE slug = ?").bind(slug).run();
  if (!r.meta || !r.meta.changes) throw httpErr(`no character with slug "${slug}"`, 404);
  return { ok: true, action: 'unretired', slug };
}

/**
 * Publish: regenerate franchise_roster.json + voice-profiles.json from D1 and
 * commit both to GitHub. Retired characters are excluded from the published
 * roster (that is what retiring means) but remain in D1.
 */
async function rosterPublish(env) {
  const { results } = await db(env).prepare(
    'SELECT * FROM roster WHERE retired = 0 ORDER BY rowid').all();
  const rows = results || [];
  if (!rows.length) throw new ValidationError('roster is empty — refusing to publish an empty file');

  const wrote = [];

  const rosterDoc = { players: rows.map(rosterRowToJson) };
  const rosterFile = await getFile(env, ROSTER_PATH);
  await putFile(env, ROSTER_PATH, encodeJson(rosterDoc),
    `studio: publish roster (${rows.length} characters)`, rosterFile && rosterFile.sha);
  wrote.push(ROSTER_PATH);

  const withVoice = rows.filter(r => r.voice && String(r.voice).trim());
  if (withVoice.length) {
    const voiceFile = await getFile(env, VOICE_PATH);
    const voiceDoc = voiceFile ? decodeJson(voiceFile.content) : { profiles: {} };
    if (!voiceDoc.profiles || typeof voiceDoc.profiles !== 'object') voiceDoc.profiles = {};
    for (const r of withVoice) voiceDoc.profiles[r.name] = r.voice;
    await putFile(env, VOICE_PATH, encodeJson(voiceDoc),
      `studio: publish voices (${withVoice.length} profiles)`, voiceFile && voiceFile.sha);
    wrote.push(VOICE_PATH);
  }

  return { ok: true, published: rows.length, voices: withVoice.length, wrote };
}

// ── core write logic (mirrors serve.py write_character) ────────────────────
class ValidationError extends Error {}

async function writeCharacter(env, payload) {
  const result = { ok: true, wrote: [] };
  const rosterIn = payload.roster || {};
  const slug = String(rosterIn.slug || '').trim().toLowerCase();
  const name = String(rosterIn.name || '').trim();
  if (!name) throw new ValidationError('character name is required');
  if (!SLUG_RE.test(slug)) throw new ValidationError('slug must be lowercase letters, digits, and dashes');

  // 1) franchise_roster.json
  const rosterFile = await getFile(env, ROSTER_PATH);
  const rosterDoc = rosterFile ? decodeJson(rosterFile.content) : { players: [] };
  if (!Array.isArray(rosterDoc.players)) rosterDoc.players = [];
  const entry = cleanRosterEntry(rosterIn);
  const idx = rosterDoc.players.findIndex(p => p.slug === slug || p.name === name);
  if (idx >= 0) rosterDoc.players[idx] = { ...rosterDoc.players[idx], ...entry };
  else rosterDoc.players.push(entry);
  await putFile(env, ROSTER_PATH, encodeJson(rosterDoc), `studio: upsert ${name} (roster)`, rosterFile && rosterFile.sha);
  result.wrote.push(ROSTER_PATH);
  result.rosterCount = rosterDoc.players.length;
  result.updated = idx >= 0;

  // 2) voice-profiles.json (optional)
  const voice = payload.voice || {};
  const vtext = String(voice.text || '').trim();
  const vname = String(voice.name || name).trim();
  if (vtext) {
    const voiceFile = await getFile(env, VOICE_PATH);
    const voiceDoc = voiceFile ? decodeJson(voiceFile.content) : { profiles: {} };
    if (!voiceDoc.profiles || typeof voiceDoc.profiles !== 'object') voiceDoc.profiles = {};
    voiceDoc.profiles[vname] = vtext;
    await putFile(env, VOICE_PATH, encodeJson(voiceDoc), `studio: voice for ${vname}`, voiceFile && voiceFile.sha);
    result.wrote.push(VOICE_PATH);
  }

  // 3) avatar PNG (optional) — dataUri already carries base64 after the comma
  const avatar = payload.avatar || {};
  const dataUri = avatar.dataUri || '';
  if (dataUri.startsWith('data:image') && dataUri.includes(',')) {
    const b64 = dataUri.slice(dataUri.indexOf(',') + 1);
    const path = `${AVATAR_DIR}/${slug}.png`;
    const existing = await getFile(env, path);
    await putFile(env, path, b64, `studio: avatar for ${name}`, existing && existing.sha);
    result.wrote.push(path);
  }

  return result;
}

function cleanRosterEntry(entry) {
  const out = {};
  for (const k of ROSTER_FIELDS) {
    if (k in entry && entry[k] !== null && entry[k] !== '') out[k] = entry[k];
  }
  return out;
}

// ── GitHub Contents API helpers ────────────────────────────────────────────
function ghHeaders(env) {
  return {
    'Authorization': `Bearer ${env.GITHUB_TOKEN}`,
    'Accept': 'application/vnd.github+json',
    'User-Agent': 'dc-studio-worker',
    'X-GitHub-Api-Version': '2022-11-28',
  };
}
function ghBase(env) {
  return `https://api.github.com/repos/${env.GITHUB_REPO}/contents`;
}
function branch(env) { return env.GITHUB_BRANCH || 'main'; }

async function getFile(env, path) {
  const r = await fetch(`${ghBase(env)}/${encodeURI(path)}?ref=${encodeURIComponent(branch(env))}`, { headers: ghHeaders(env) });
  if (r.status === 404) return null;
  if (!r.ok) throw httpErr(`GitHub GET ${path} failed (${r.status})`, r.status);
  return r.json(); // {content, sha, ...}
}

async function putFile(env, path, contentB64, message, sha) {
  const body = { message, content: contentB64, branch: branch(env) };
  if (sha) body.sha = sha;
  const r = await fetch(`${ghBase(env)}/${encodeURI(path)}`, {
    method: 'PUT', headers: { ...ghHeaders(env), 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw httpErr(`GitHub PUT ${path} failed (${r.status}): ${await r.text()}`, r.status);
  return r.json();
}

async function getJson(env, path, fallback) {
  const f = await getFile(env, path);
  return f ? decodeJson(f.content) : fallback;
}

async function listAvatars(env) {
  const r = await fetch(`${ghBase(env)}/${AVATAR_DIR}?ref=${encodeURIComponent(branch(env))}`, { headers: ghHeaders(env) });
  if (!r.ok) return [];
  const items = await r.json();
  if (!Array.isArray(items)) return [];
  return items
    .filter(f => f.type === 'file' && /\.png$/i.test(f.name))
    .map(f => f.name.slice(0, -4))
    .sort();
}

function httpErr(msg, status) { const e = new Error(msg); e.status = status; return e; }

// ── encoding (base64 <-> UTF-8, chunk-safe) ────────────────────────────────
function bytesToB64(bytes) {
  let bin = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  return btoa(bin);
}
function b64ToBytes(b64) {
  const bin = atob(String(b64).replace(/\s/g, ''));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
function encodeJson(obj) { return bytesToB64(new TextEncoder().encode(JSON.stringify(obj, null, 2) + '\n')); }
function decodeJson(contentB64) { return JSON.parse(new TextDecoder().decode(b64ToBytes(contentB64))); }

// ── CORS + JSON response ───────────────────────────────────────────────────
function corsHeaders(request, env) {
  const allowed = env.ALLOWED_ORIGIN || '*';
  const origin = request.headers.get('Origin') || '';
  let allow = allowed;
  if (allowed !== '*') {
    const list = allowed.split(',').map(s => s.trim());
    allow = list.includes(origin) ? origin : list[0];
  }
  return {
    'Access-Control-Allow-Origin': allow,
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  };
}
// cacheSeconds > 0 lets Cloudflare's edge + the browser reuse the answer, so a
// popular leaderboard doesn't hit D1 on every visitor. Writes stay 'no-store'.
function json(obj, status, cors, cacheSeconds) {
  const cache = (cacheSeconds && status === 200) ? `public, max-age=${cacheSeconds}` : 'no-store';
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': cache, ...cors },
  });
}
