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
// Config (wrangler.toml [vars]): GITHUB_REPO ("owner/repo"), GITHUB_BRANCH,
// ALLOWED_ORIGIN (your site origin, or "*").
// Secrets (wrangler secret put): GITHUB_TOKEN (fine-grained PAT, contents:write
// on this repo only), STUDIO_TOKEN (a long random string the frontend sends).

const ROSTER_PATH = 'franchise_roster.json';
const VOICE_PATH = 'voice-profiles.json';
const AVATAR_DIR = 'assets/avatars';
const SLUG_RE = /^[a-z0-9][a-z0-9-]*$/;
const ROSTER_FIELDS = ['name', 'slug', 'gender', 'sexuality', 'archetype', 'stats'];

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const cors = corsHeaders(request, env);

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });

    try {
      if (request.method === 'GET' && url.pathname === '/api/ping') {
        const doc = await getJson(env, ROSTER_PATH, { players: [] });
        return json({ ok: true, roster: (doc.players || []).length }, 200, cors);
      }
      if (request.method === 'GET' && url.pathname === '/api/avatars') {
        return json({ avatars: await listAvatars(env) }, 200, cors);
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
      return json({ ok: false, error: 'unknown endpoint' }, 404, cors);
    } catch (e) {
      const status = e && e.status ? e.status : (e instanceof ValidationError ? 400 : 500);
      return json({ ok: false, error: String(e && e.message || e) }, status, cors);
    }
  },
};

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
function json(obj, status, cors) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...cors },
  });
}
