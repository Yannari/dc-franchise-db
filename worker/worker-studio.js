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
//   POST /api/roster           {slug,name,gender,sexuality,archetype,stats{},voice,
//                               age|birthdate,ethnicity,nationality,hometown,
//                               occupation,descriptor,backstory,personality,
//                               castingInterview}
//   POST /api/roster/delete    {slug, force?}  -> deletes if unplayed, else retires
//   POST /api/roster/unretire  {slug}
//   POST /api/roster/publish   -> regenerates franchise_roster.json + voice-profiles.json
//   POST /api/gallery/<slug>/meta {file, mood?, pinned?} -> photo facts (token)
//   POST /api/gallery/<slug>/post {file, id} -> archive a claimed photo (token)
//   GET  /api/gallery-pins      -> every character's pinned face (public)
//   GET  /api/life-events      -> the life log (public)
//   POST /api/life-events      {events:[...]}  -> replaces it (token required)
//
// Season data (requires the token):
//   POST /api/sync-seasons  -> rebuilds players/appearances/bonds/seasons/rankings
//                              from the JSON already committed in the repo.
//   POST /api/publish-season {seasonNumber, format, season, players, seasons, franchise, rankings}
//     format defaults to 'total-drama' and decides the season file's name —
//     without it two shows' season 1 write to the same path.
//                           -> commits those documents, THEN syncs. Removes the
//                              old manual "move the downloads into the repo" step.
//
// Avatar files (require the token; both are git commits):
//   POST /api/avatar           {slug, dataUri}  -> add/replace assets/avatars/<slug>.png
//   POST /api/avatar/delete    {slug, force?}   -> remove it (refuses if a character uses it)
//
// Config (wrangler.toml [vars]): GITHUB_REPO ("owner/repo"), GITHUB_BRANCH,
// ALLOWED_ORIGIN (your site origin, or "*").
// Secrets (wrangler secret put): GITHUB_TOKEN (fine-grained PAT, contents:write
// on this repo only), STUDIO_TOKEN (a long random string the frontend sends).
// Binding (wrangler.toml [[d1_databases]]): DB -> the "dc-franchise" D1 database.

import { SHOWS, formatPrefix, DEFAULT_FORMAT } from '../js/shows.js';
import { composeVoice, stripBioLead } from '../js/bio.js';
import { leaderboardQuery, castmatesQuery, bondsQuery,
         socialDeleteSeasonQuery, socialInsertQuery, socialSelectQuery } from './queries.js';

const ROSTER_PATH = 'franchise_roster.json';
const VOICE_PATH = 'voice-profiles.json';
// Accrued data: what happened to characters between seasons. Written by the
// inbox on life.html and read by the wiki and Dramagram.
const LIFE_PATH = 'life_events.json';
const AVATAR_DIR = 'assets/avatars';
const SLUG_RE = /^[a-z0-9][a-z0-9-]*$/;
const ROSTER_FIELDS = ['name', 'slug', 'gender', 'sexuality', 'archetype', 'stats', 'voice', 'profileSources', 'continuityNote', 'drag'];

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const cors = corsHeaders(request, env);

    // The D1 read endpoints serve public data, so they are readable from ANY
    // origin (including localhost during development). The studio write
    // endpoint keeps the strict ALLOWED_ORIGIN check.
    const PUBLIC_READS = ['/api/leaderboard', '/api/relationships', '/api/stats',
                          '/api/roster', '/api/roster/status', '/api/live-season',
                          '/api/social', '/api/life-events'];
    // The gallery listing is per-slug, so it is a prefix rather than a fixed
    // path — but it is the same kind of thing as the rest of this list: public
    // data the player page reads from whatever origin it happens to be on.
    const isPublicRead = PUBLIC_READS.includes(url.pathname)
      || url.pathname.startsWith('/api/gallery/');
    const rcors = isPublicRead ? { ...cors, 'Access-Control-Allow-Origin': '*' } : cors;

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: rcors });

    try {
      // ── the gallery, out of R2 ──
      //
      // 592 MB of it, and it is why GitHub Pages stopped deploying at all: the
      // published site reached 778 MB against a 1 GB limit, and 28 of 30 builds
      // timed out. Pages serves the app; the pictures come from here.
      //
      // Public and cached hard. These are content-addressed by path and never
      // change in place — a new pose is a new file — so a year is safe and the
      // browser stops asking.
      if ((request.method === 'GET' || request.method === 'HEAD')
          && url.pathname.startsWith('/gallery/')) {
        const key = decodeURIComponent(url.pathname.slice('/gallery/'.length));
        if (!key || key.includes('..')) return new Response('Not found', { status: 404 });
        const obj = await env.GALLERY.get(key);
        if (!obj) return new Response('Not found', { status: 404, headers: { 'Access-Control-Allow-Origin': '*' } });
        const h = new Headers({
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, max-age=31536000, immutable',
          'Content-Type': obj.httpMetadata?.contentType || 'application/octet-stream',
        });
        if (obj.httpEtag) h.set('ETag', obj.httpEtag);
        // A HEAD with no Content-Length reports every image as zero bytes,
        // which is exactly how a verification pass reads "the upload failed".
        if (typeof obj.size === 'number') h.set('Content-Length', String(obj.size));
        return new Response(request.method === 'HEAD' ? null : obj.body, { headers: h });
      }

      // ── what is in one character's gallery ────────────────────────────
      //
      // The player page used to discover art by requesting 1.png, 1.jpg,
      // 1.webp, 1.gif, 2.png … up to twelve slots: as many as 48 requests per
      // profile, every one of the misses a 404 the browser logs in red. One
      // listing answers the same question, and the upload panel needs it for a
      // second reason — it has to know which index is free before it can put
      // anything anywhere.
      if (request.method === 'GET' && url.pathname.startsWith('/api/gallery/')) {
        const slug = decodeURIComponent(url.pathname.slice('/api/gallery/'.length));
        if (!SLUG_RE.test(slug)) return json({ ok: false, error: 'bad slug' }, 400, rcors);
        const images = [];
        const posted = [];
        // A character has a dozen images, not a thousand, so one page is the
        // whole answer — but `truncated` is honoured rather than assumed away.
        //
        // customMetadata rides along because THE PHOTOGRAPH IS WHERE ITS FACTS
        // LIVE: the mood somebody gave it and whether it is the profile
        // picture. The first version kept the pin in localStorage, which made
        // it a per-browser opinion — pinned here, unpinned on your phone.
        let cursor;
        do {
          const page = await env.GALLERY.list({
            prefix: slug + '/', cursor, include: ['customMetadata'],
          });
          for (const o of page.objects || []) {
            const file = o.key.slice(slug.length + 1);
            const meta = o.customMetadata || {};
            const row = { file, size: o.size };
            if (meta.mood) row.mood = meta.mood;
            if (meta.pinned) row.pinned = true;
            // posted/ is the archive: photographs a post has claimed. They left
            // the numbered queue so a new dump has room, but they are still
            // this character's art and still served.
            if (file.startsWith('posted/')) posted.push(row);
            else if (!file.includes('/')) images.push(row);
          }
          cursor = page.truncated ? page.cursor : null;
        } while (cursor);
        images.sort((a, b) => (parseInt(a.file, 10) || 0) - (parseInt(b.file, 10) || 0));
        posted.sort((a, b) => a.file.localeCompare(b.file));
        return json({ ok: true, slug, images, posted }, 200, rcors, 30);
      }

      // ── fetching a wiki image on the page's behalf ────────────────────
      //
      // Fandom hotlink-protects its image host. The same URL that returns
      // 264 KB to curl returns a 404 placeholder to a browser, because the
      // browser sends a Referer — and it returns it AS AN IMAGE, so nothing
      // errors: the page decoded the placeholder, re-encoded it, and uploaded
      // five identical 550-byte grey squares into a gallery.
      //
      // A Worker has no Referer, so it gets the real file. The bytes come back
      // here, the page still does the resizing and the WebP encoding, and the
      // upload path is unchanged.
      //
      // Locked to the wiki image host and behind the token, because "fetch any
      // URL you like and hand me the bytes" is an open proxy.
      if (request.method === 'GET' && url.pathname === '/api/wiki-image') {
        const auth = (request.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
        if (env.STUDIO_TOKEN && auth !== env.STUDIO_TOKEN) {
          return json({ ok: false, error: 'unauthorized' }, 401, cors);
        }
        const target = url.searchParams.get('url') || '';
        let host = '';
        try { host = new URL(target).hostname; } catch { host = ''; }
        if (host !== 'static.wikia.nocookie.net') {
          return json({ ok: false, error: 'only static.wikia.nocookie.net' }, 400, cors);
        }
        const res = await fetch(target, { headers: { 'User-Agent': 'dc-franchise-gallery/1.0' } });
        if (!res.ok) return json({ ok: false, error: `wiki said ${res.status}` }, 502, cors);
        const type = res.headers.get('Content-Type') || '';
        if (!type.startsWith('image/')) return json({ ok: false, error: 'not an image' }, 502, cors);
        return new Response(res.body, {
          headers: { ...cors, 'Content-Type': type, 'Cache-Control': 'no-store' },
        });
      }

      // ── a photograph's facts: its mood, and whether it is the face ────
      //
      // R2 cannot edit metadata in place, so the object is read and rewritten
      // with the merged metadata. These are sub-megabyte images; the copy is
      // cheap and it keeps one home per fact.
      if (request.method === 'POST' && /^\/api\/gallery\/[a-z0-9-]+\/meta$/.test(url.pathname)) {
        const auth = (request.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
        if (env.STUDIO_TOKEN && auth !== env.STUDIO_TOKEN) {
          return json({ ok: false, error: 'unauthorized' }, 401, cors);
        }
        const slug = url.pathname.split('/')[3];
        const body = await request.json().catch(() => ({}));
        const file = String(body.file || '');
        if (!/^(posted\/[a-z0-9][a-z0-9-]{0,60}|\d{1,3})\.(png|jpe?g|webp|gif)$/.test(file)) {
          return json({ ok: false, error: 'bad file' }, 400, cors);
        }
        const MOODS = ['flex', 'flirty', 'soft', 'low', 'sharp', 'chaos', 'nostalgic'];
        if (body.mood !== undefined && body.mood !== null && body.mood !== ''
            && !MOODS.includes(body.mood)) {
          return json({ ok: false, error: 'unknown mood' }, 400, cors);
        }
        const rewrite = async (key, mutate) => {
          const obj = await env.GALLERY.get(key);
          if (!obj) return false;
          const meta = { ...(obj.customMetadata || {}) };
          mutate(meta);
          for (const k of Object.keys(meta)) if (!meta[k]) delete meta[k];
          await env.GALLERY.put(key, await obj.arrayBuffer(), {
            httpMetadata: obj.httpMetadata, customMetadata: meta,
          });
          return true;
        };
        // ONE pin per character. Pinning clears the previous holder first, so
        // two objects can never both claim to be the face.
        if (body.pinned === true) {
          let cursor;
          do {
            const page = await env.GALLERY.list({
              prefix: slug + '/', cursor, include: ['customMetadata'],
            });
            for (const o of page.objects || []) {
              if (o.customMetadata?.pinned && o.key !== slug + '/' + file) {
                await rewrite(o.key, m => { delete m.pinned; });
              }
            }
            cursor = page.truncated ? page.cursor : null;
          } while (cursor);
        }
        const found = await rewrite(slug + '/' + file, m => {
          if (body.mood !== undefined) { if (body.mood) m.mood = body.mood; else delete m.mood; }
          if (body.pinned !== undefined) { if (body.pinned) m.pinned = '1'; else delete m.pinned; }
        });
        if (!found) return json({ ok: false, error: 'no such image' }, 404, cors);
        return json({ ok: true, slug, file }, 200, cors);
      }

      // ── a post claims a photograph ────────────────────────────────────
      //
      // The numbered slots are the QUEUE — what curation shows, what a dump
      // refills. When a post takes a picture it moves to posted/<id>.<ext>,
      // named for the post that claimed it: the key itself records which photo
      // belongs to which post, so there is no second file to keep in step. The
      // slot frees up, the image survives, and the wiki gallery still shows it.
      if (request.method === 'POST' && /^\/api\/gallery\/[a-z0-9-]+\/post$/.test(url.pathname)) {
        const auth = (request.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
        if (env.STUDIO_TOKEN && auth !== env.STUDIO_TOKEN) {
          return json({ ok: false, error: 'unauthorized' }, 401, cors);
        }
        const slug = url.pathname.split('/')[3];
        const body = await request.json().catch(() => ({}));
        const m = /^(\d{1,3})\.(png|jpe?g|webp|gif)$/.exec(String(body.file || ''));
        const id = String(body.id || '');
        if (!m) return json({ ok: false, error: 'bad file' }, 400, cors);
        if (!/^[a-z0-9][a-z0-9-]{0,60}$/.test(id)) return json({ ok: false, error: 'bad id' }, 400, cors);
        const from = slug + '/' + body.file;
        const to = slug + '/posted/' + id + '.' + m[2];
        const obj = await env.GALLERY.get(from);
        if (!obj) return json({ ok: false, error: 'no such image' }, 404, cors);
        // Refuse rather than overwrite: two posts claiming one id is a caller
        // bug, and silently replacing the first photo would hide it.
        if (await env.GALLERY.head(to)) return json({ ok: false, error: 'id already has a photo' }, 409, cors);
        await env.GALLERY.put(to, await obj.arrayBuffer(), {
          httpMetadata: obj.httpMetadata, customMetadata: obj.customMetadata,
        });
        await env.GALLERY.delete(from);
        return json({ ok: true, from, to: 'posted/' + id + '.' + m[2] }, 200, cors);
      }

      // ── everyone's profile picture, in one request ────────────────────
      //
      // The directory draws 152 tiles; asking each slug's listing would be 152
      // requests for one page. One walk over the bucket answers it, and the
      // walk is over metadata, not bytes.
      if (request.method === 'GET' && url.pathname === '/api/gallery-pins') {
        const pins = {};
        let cursor;
        do {
          const page = await env.GALLERY.list({ cursor, include: ['customMetadata'] });
          for (const o of page.objects || []) {
            if (!o.customMetadata?.pinned) continue;
            const i = o.key.indexOf('/');
            if (i > 0) pins[o.key.slice(0, i)] = o.key.slice(i + 1);
          }
          cursor = page.truncated ? page.cursor : null;
        } while (cursor);
        return json({ ok: true, pins }, 200,
          { ...cors, 'Access-Control-Allow-Origin': '*' }, 60);
      }

      // ── adding to and removing from the gallery ───────────────────────
      //
      // assets/gallery/ is git-ignored and 592 MB, so the working copy is
      // disposable and the bucket is the original. That leaves no way to add a
      // picture except a script run against a folder you may not have, which is
      // why this exists: the player page uploads straight to R2.
      //
      // Not a GitHub commit like the avatar route. Avatars are small, few, and
      // genuinely part of the repo; gallery art is none of those things, and
      // putting it back in git is the exact thing that stopped the site
      // deploying.
      if ((request.method === 'PUT' || request.method === 'DELETE')
          && url.pathname.startsWith('/gallery/')) {
        const auth = (request.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
        if (env.STUDIO_TOKEN && auth !== env.STUDIO_TOKEN) {
          return json({ ok: false, error: 'unauthorized' }, 401, cors);
        }
        const key = decodeURIComponent(url.pathname.slice('/gallery/'.length));
        // Whitelisted rather than sanitised: the shape of a legal key is known
        // exactly — one slug, one number, one known extension — so anything
        // else is refused rather than repaired. `..` never has to be special
        // cased because a dot is not in the alphabet.
        // Numbered queue keys, and — for DELETE only — the posted archive,
        // so a claimed photo can still be removed outright if it must be.
        const legalPut = /^[a-z0-9][a-z0-9-]*\/\d{1,3}\.(png|jpe?g|webp|gif)$/.test(key);
        const legalDel = legalPut
          || /^[a-z0-9][a-z0-9-]*\/posted\/[a-z0-9][a-z0-9-]{0,60}\.(png|jpe?g|webp|gif)$/.test(key);
        if (request.method === 'PUT' ? !legalPut : !legalDel) {
          return json({ ok: false, error: 'bad key' }, 400, cors);
        }
        if (request.method === 'DELETE') {
          await env.GALLERY.delete(key);
          return json({ ok: true, deleted: key }, 200, cors);
        }
        const body = await request.arrayBuffer();
        if (!body.byteLength) return json({ ok: false, error: 'empty body' }, 400, cors);
        if (body.byteLength > 12 * 1024 * 1024) {
          return json({ ok: false, error: 'too large (12 MB limit)' }, 413, cors);
        }
        await env.GALLERY.put(key, body, {
          httpMetadata: { contentType: request.headers.get('Content-Type') || 'image/webp' },
        });
        return json({ ok: true, key, size: body.byteLength }, 200, cors);
      }

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
      // The life log. Public to READ — the site renders it on every player
      // page — and token-gated to write, like the roster.
      if (request.method === 'GET' && url.pathname === '/api/life-events') {
        const doc = await getJson(env, LIFE_PATH, { events: [] });
        // rcors, not cors: this is read from the simulator and from a local
        // checkout as well as from the published site, and the strict origin
        // header turned every one of those reads into a CORS failure that fell
        // back to whatever stale copy of the file was on disk.
        return json({ ok: true, events: doc.events || [] }, 200,
          { ...rcors, 'Cache-Control': 'public, max-age=30' });
      }

      if (request.method === 'GET' && url.pathname === '/api/roster') {
        return json(await rosterList(env, url.searchParams), 200, rcors, 60);
      }
      // "did my publish land?" — derived, so it can be re-checked any time.
      if (request.method === 'GET' && url.pathname === '/api/roster/status') {
        return json(await rosterStatus(env), 200, rcors, 0);
      }
      if (request.method === 'POST' && url.pathname === '/api/life-events') {
        const auth = (request.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
        if (env.STUDIO_TOKEN && auth !== env.STUDIO_TOKEN) {
          return json({ ok: false, error: 'unauthorized' }, 401, cors);
        }
        const body = await request.json().catch(() => ({}));
        return json(await lifeEventsSave(env, body), 200, cors);
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
        if (url.pathname === '/api/roster/publish')  return json(await rosterPublish(env, body), 200, cors);
        return json({ ok: false, error: 'unknown roster endpoint' }, 404, cors);
      }
      // ── refresh the derived tables from the repo JSON (token-guarded) ─────
      // ── live season overlay ───────────────────────────────────────────────
      if (request.method === 'GET' && url.pathname === '/api/live-season') {
        // Short cache: this changes only when you press sync, but a popular
        // page shouldn't hit D1 on every visit.
        return json(await liveSeasonGet(env), 200, rcors, 30);
      }
      if (request.method === 'GET' && url.pathname === '/api/social') {
        // The feed page polls this while a season airs, so it is cached for the
        // same short window as the standings it accompanies.
        return json(await socialGet(env, url), 200, rcors, 30);
      }
      if (request.method === 'POST' && url.pathname.startsWith('/api/live-season')) {
        const auth = (request.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
        if (env.STUDIO_TOKEN && auth !== env.STUDIO_TOKEN) {
          return json({ ok: false, error: 'unauthorized' }, 401, cors);
        }
        if (url.pathname === '/api/live-season/clear') return json(await liveSeasonClear(env), 200, cors);
        const body = await request.json().catch(() => ({}));
        return json(await liveSeasonPut(env, body), 200, cors);
      }
      if (request.method === 'POST' && (url.pathname === '/api/sync-seasons' || url.pathname === '/api/publish-season')) {
        const auth = (request.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
        if (env.STUDIO_TOKEN && auth !== env.STUDIO_TOKEN) {
          return json({ ok: false, error: 'unauthorized' }, 401, cors);
        }
        if (url.pathname === '/api/sync-seasons') return json(await syncSeasons(env), 200, cors);
        const body = await request.json().catch(() => ({}));
        return json(await publishSeason(env, body), 200, cors);
      }
      // ── standalone avatar add / delete (token-guarded) ────────────────────
      if (request.method === 'POST' && url.pathname.startsWith('/api/avatar')) {
        const auth = (request.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
        if (env.STUDIO_TOKEN && auth !== env.STUDIO_TOKEN) {
          return json({ ok: false, error: 'unauthorized' }, 401, cors);
        }
        const body = await request.json().catch(() => ({}));
        if (url.pathname === '/api/avatar')        return json(await avatarSave(env, body), 200, cors);
        if (url.pathname === '/api/avatar/delete') return json(await avatarDelete(env, body), 200, cors);
        return json({ ok: false, error: 'unknown avatar endpoint' }, 404, cors);
      }
      if (request.method === 'POST' && url.pathname === '/api/season-fill') {
        const auth = (request.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
        if (env.STUDIO_TOKEN && auth !== env.STUDIO_TOKEN) {
          return json({ ok: false, error: 'unauthorized' }, 401, cors);
        }
        const body = await request.json().catch(() => ({}));
        return json(await seasonFill(env, body), 200, cors);
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
  // The four Total Drama stats live in td_appearances now. They read the
  // LEFT-JOINed alias `td`, so a Big Brother appearance contributes 0 instead
  // of dropping the player off the board entirely.
  challenges:    { label: 'Challenge wins',     expr: 'SUM(COALESCE(td.challenge_wins,0))', dir: 'DESC' },
  immunities:    { label: 'Immunity wins',      expr: 'SUM(COALESCE(td.immunity_wins,0))',  dir: 'DESC' },
  rewards:       { label: 'Reward wins',        expr: 'SUM(COALESCE(td.reward_wins,0))',    dir: 'DESC' },
  idols:         { label: 'Idols found',        expr: 'SUM(COALESCE(td.idols_found,0))',    dir: 'DESC' },
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

  // Which show's appearances to count. The DEFAULT IS EVERY SHOW, deliberately:
  // sub-project A's constraint is that a Big Brother appearance must never drop
  // a player off a Total Drama board, and changing the default would do exactly
  // that to every existing caller.
  const formatParam = params.get('format') || '';
  const format = SHOWS[formatParam] ? formatParam : null;
  if (formatParam && !format) {
    throw new ValidationError(
      `unknown format "${formatParam}" — valid: ${Object.keys(SHOWS).join(', ')}`);
  }

  // stat.expr / stat.dir come from our own whitelist above, never from the user.
  const sql = leaderboardQuery({ expr: stat.expr, dir: stat.dir, format });
  const binds = format ? [format, minSeasons, limit] : [minSeasons, limit];
  const { results } = await db(env).prepare(sql).bind(...binds).all();

  // Competition ranking: ties share a rank (1,2,2,4) so the page can show medals.
  let lastValue = null, lastRank = 0;
  const rows = (results || []).map((r, i) => {
    const rank = r.value === lastValue ? lastRank : i + 1;
    lastValue = r.value; lastRank = rank;
    return { rank, ...r };
  });
  return {
    ok: true,
    stat: statKey,
    format: format || 'all',
    label: stat.label,
    better: stat.dir === 'ASC' ? 'lower' : 'higher',
    minSeasons,
    count: rows.length,
    rows,
  };
}

async function relationships(env, params) {
  const slug = String(params.get('player') || '').trim().toLowerCase();
  if (!SLUG_RE.test(slug)) throw new ValidationError('player must be a slug, e.g. ?player=alejandro');
  const d = db(env);

  // One batch = one round trip to D1 instead of four.
  const [who, runs, mates, bonds] = await d.batch([
    d.prepare('SELECT id, name, tier, total_seasons AS totalSeasons, wins, best_placement AS bestPlacement, avg_placement AS avgPlacement FROM players WHERE id = ?').bind(slug),

    // A season is now identified by (format, season_number), so BOTH joins carry
    // the format. The Total Drama-only columns come from td_appearances; for a
    // Big Brother row they come back NULL rather than matching the wrong season.
    d.prepare(`SELECT a.season_number AS season, a.format AS format, s.title AS seasonTitle,
                      a.placement, a.status,
                      td.tribe, td.challenge_wins AS challengeWins, td.immunity_wins AS immunityWins,
                      td.idols_found AS idolsFound, a.votes_received AS votesReceived,
                      a.jury_votes AS juryVotes, a.final_vote AS finalVote
               FROM appearances a
               LEFT JOIN seasons s ON s.season_number = a.season_number AND s.format = a.format
               LEFT JOIN td_appearances td ON td.player_id = a.player_id
                                          AND td.season_number = a.season_number
                                          AND a.format = 'total-drama'
               WHERE a.player_id = ?
               ORDER BY a.format, a.season_number`).bind(slug),

    d.prepare(castmatesQuery()).bind(slug),

    d.prepare(bondsQuery()).bind(slug),
  ]);

  const player = (who.results || [])[0];
  if (!player) throw httpErr(`no player with id "${slug}"`, 404);

  return {
    ok: true,
    player,
    seasons: runs.results || [],
    castmates: (mates.results || []).map(m => ({
      ...m,
      // "total-drama-9,big-brother-1" — a season is a (format, number) pair now,
      // and "1,1" could not tell two shows apart.
      seasons: String(m.seasons || '').split(',').filter(Boolean),
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

// ── the Drag Race craft block ──────────────────────────────────────────
//
// Stored as ONE JSON column rather than seven more INTEGER ones. The nine
// stats are columns because "most strategic characters" is a real SQL
// question; nothing sorts a leaderboard by lipsync, the block is read as a
// unit by the judging pipeline, and it carries a style string and a trait
// list that would not fit the numeric shape anyway.
const DRAG_KEYS = ['acting', 'comedy', 'dance', 'design', 'runway', 'lipsync', 'singing'];
const DRAG_STYLES = new Set(['pageant', 'comedy', 'fashion', 'camp', 'club-kid', 'spooky',
  'broadway', 'dancer', 'glamour', 'art']);

/**
 * Validate and serialise the craft block, or return null.
 *
 * Same rule as the stats above: only known keys survive, so a typo like
 * "improv" — a stat this show deliberately folded into acting — can never
 * become a field of garbage that later reads as a real number.
 */
function dragToJson(raw) {
  if (raw == null) return null;
  if (typeof raw !== 'object' || Array.isArray(raw)) {
    throw new ValidationError('drag must be an object');
  }
  const clean = {};
  for (const k of DRAG_KEYS) {
    const n = Number(raw[k]);
    if (Number.isFinite(n)) clean[k] = Math.max(1, Math.min(10, Math.round(n)));
  }
  if (typeof raw.style === 'string' && DRAG_STYLES.has(raw.style)) clean.style = raw.style;
  if (Array.isArray(raw.traits)) {
    clean.traits = raw.traits.filter(t => typeof t === 'string' && t).slice(0, 3);
  }
  if (typeof raw.voice === 'string' && raw.voice.trim()) clean.voice = raw.voice.trim();
  return Object.keys(clean).length ? JSON.stringify(clean) : null;
}

function rosterRowToJson(r) {
  const stats = {};
  for (const k of STAT_KEYS) if (r[k] != null) stats[k] = r[k];
  const out = { name: r.name, slug: r.slug };
  if (r.gender) out.gender = r.gender;
  if (r.archetype) out.archetype = r.archetype;
  if (Object.keys(stats).length) out.stats = stats;
  if (r.sexuality) out.sexuality = r.sexuality;
  if (r.voice) out.voice = r.voice;
  if (r.profile_sources) {
    try {
      const sources = JSON.parse(r.profile_sources);
      if (sources && typeof sources === 'object' && !Array.isArray(sources)) out.profileSources = sources;
    } catch { /* malformed legacy provenance is omitted from the snapshot */ }
  }
  // The continuity read — what their seasons MEAN, as opposed to what the
  // archive already records that they did. Authored (or drafted and then
  // edited), so it lives here and not in a derivation: js/continuity.js can
  // rebuild the chronology from the season documents any time, and cannot
  // rebuild a judgement about it.
  //
  // It has to travel through D1 or it does not survive. Publish regenerates
  // franchise_roster.json wholesale FROM this table, so a field the database
  // never hears about is deleted the next time somebody presses the button.
  if (r.continuity_note) out.continuityNote = r.continuity_note;
  // The craft block, for the show that scores it. Same reasoning as the
  // continuity note directly above: publish rebuilds the roster file FROM this
  // table, so a field read back here is a field that survives the button.
  if (r.drag) {
    try {
      const drag = JSON.parse(r.drag);
      if (drag && typeof drag === 'object' && !Array.isArray(drag)) out.drag = drag;
    } catch { /* malformed legacy block is omitted rather than published broken */ }
  }
  // The bio, as fields. Published alongside the rest so the static site can ask
  // demographic questions without reaching for D1 — and so the answer on the
  // site is the same one the database would give.
  if (r.age != null) out.age = r.age;
  // Birthdate is published as the DATE, never as an age computed here. An age
  // baked into a static file is wrong the moment the year turns, and this file
  // is regenerated only when somebody presses Publish.
  if (r.birthdate) out.birthdate = r.birthdate;
  if (r.ethnicity) out.ethnicity = r.ethnicity;
  if (r.nationality) out.nationality = r.nationality;
  if (r.hometown) out.hometown = r.hometown;
  if (r.occupation) out.occupation = r.occupation;
  if (r.descriptor) out.descriptor = r.descriptor;
  if (r.backstory) out.backstory = r.backstory;
  if (r.personality) out.personality = r.personality;
  // Emitted as the stored JSON STRING, not re-parsed here: the Worker has no
  // business knowing the interview's shape, and js/casting-interview.js owns it.
  if (r.casting_interview) out.castingInterview = r.casting_interview;
  if (r.is_returnee) out.isReturnee = true;
  return out;
}

async function rosterList(env, params) {
  const includeRetired = params.get('includeRetired') === '1';
  // seasonCount lets the Studio show who has never actually played — a
  // question the flat JSON couldn't answer without cross-referencing by hand.
  const sql = `
    SELECT r.*,
           (SELECT COUNT(*) FROM appearances a WHERE a.player_id = r.slug) AS season_count
    FROM roster r
    ${includeRetired ? '' : 'WHERE r.retired = 0'}
    ORDER BY r.rowid`;
  const { results } = await db(env).prepare(sql).all();
  return {
    ok: true,
    count: (results || []).length,
    players: (results || []).map(r => ({
      ...rosterRowToJson(r),
      retired: !!r.retired,
      seasonCount: r.season_count || 0,
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

  // Age is a number or nothing. A blank box must clear the field rather than
  // storing "" — an empty string sorts as a value and would put a character with
  // no recorded age at the front of "youngest ever".
  const ageNum = Number(payload.age);
  const age = Number.isFinite(ageNum) && ageNum > 0 ? Math.round(ageNum) : null;
  const text = v => (v == null || String(v).trim() === '') ? null : String(v).trim();

  // A birthdate is stored as a date and nothing else. Anything that is not
  // YYYY-MM-DD is rejected rather than coerced: a half-parsed date silently
  // becomes a wrong age on every page that renders it, and the wrongness is
  // invisible because it still looks like a number.
  const rawBirth = text(payload.birthdate);
  if (rawBirth && !/^\d{4}-\d{2}-\d{2}$/.test(rawBirth)) {
    throw new ValidationError('birthdate must be YYYY-MM-DD');
  }
  if (rawBirth && Number.isNaN(Date.parse(`${rawBirth}T00:00:00Z`))) {
    throw new ValidationError(`birthdate "${rawBirth}" is not a real date`);
  }
  const birthdate = rawBirth;
  let profileSources = null;
  if (payload.profileSources != null) {
    if (typeof payload.profileSources !== 'object' || Array.isArray(payload.profileSources)) {
      throw new ValidationError('profileSources must be a field-keyed object');
    }
    profileSources = JSON.stringify(payload.profileSources);
  }

  const drag = dragToJson(payload.drag);

  const d = db(env);
  const existing = await d.prepare('SELECT slug FROM roster WHERE slug = ?').bind(slug).first();

  await d.prepare(
    `INSERT INTO roster (slug,name,gender,sexuality,archetype,${STAT_KEYS.join(',')},
                         voice,profile_sources,continuity_note,age,birthdate,ethnicity,nationality,
                         hometown,occupation,descriptor,backstory,personality,
                         casting_interview,drag,
                         is_returnee,retired,updated_at)
     VALUES (?,?,?,?,?,${STAT_KEYS.map(() => '?').join(',')},?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,datetime('now'))
     ON CONFLICT(slug) DO UPDATE SET
       name=excluded.name, gender=excluded.gender, sexuality=excluded.sexuality,
       archetype=excluded.archetype,
       ${STAT_KEYS.map(k => `${k}=excluded.${k}`).join(', ')},
       voice=excluded.voice, profile_sources=excluded.profile_sources,
       continuity_note=excluded.continuity_note,
       age=excluded.age, birthdate=excluded.birthdate,
       ethnicity=excluded.ethnicity, nationality=excluded.nationality,
       hometown=excluded.hometown, occupation=excluded.occupation,
       descriptor=excluded.descriptor, backstory=excluded.backstory,
       personality=excluded.personality,
       casting_interview=excluded.casting_interview,
       drag=excluded.drag,
       is_returnee=excluded.is_returnee,
       retired=excluded.retired, updated_at=datetime('now')`
  ).bind(
    slug, name,
    payload.gender || null, payload.sexuality || null, archetype,
    ...statVals,
    payload.voice ? String(payload.voice) : null, profileSources,
    text(payload.continuityNote),
    age, birthdate, text(payload.ethnicity), text(payload.nationality),
    text(payload.hometown), text(payload.occupation),
    text(payload.descriptor), text(payload.backstory), text(payload.personality),
    text(payload.castingInterview),
    drag,
    payload.isReturnee ? 1 : 0,
    payload.retired ? 1 : 0,
  ).run();

  // Re-creating a previously deleted slug clears its tombstone, otherwise
  // publish would still treat their absence as intentional.
  await d.prepare('DELETE FROM roster_deleted WHERE slug = ?').bind(slug).run();

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
  // Tombstone it so publish knows this removal was intentional.
  await d.prepare(
    `INSERT INTO roster_deleted (slug, name, deleted_at) VALUES (?, ?, datetime('now'))
     ON CONFLICT(slug) DO UPDATE SET name=excluded.name, deleted_at=excluded.deleted_at`
  ).bind(slug, row.name).run();
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
 * Is the site actually up to date?
 *
 * Compares what a publish WOULD write against what franchise_roster.json
 * currently holds, so the answer is derived rather than remembered. A toast can
 * be missed and a failed publish leaves no trace; this can be re-checked at any
 * time, from any device.
 */
async function rosterStatus(env) {
  const { results } = await db(env).prepare(
    'SELECT * FROM roster WHERE retired = 0 ORDER BY rowid').all();
  const live = (results || []).map(rosterRowToJson);

  const file = await getFile(env, ROSTER_PATH);
  const published = file ? (decodeJson(file.content).players || []) : [];

  const liveBy = new Map(live.map(p => [p.slug, JSON.stringify(p)]));
  const pubBy = new Map(published.map(p => [p.slug, JSON.stringify(p)]));

  const added = [...liveBy.keys()].filter(s => !pubBy.has(s));
  const removed = [...pubBy.keys()].filter(s => !liveBy.has(s));
  const changed = [...liveBy.keys()].filter(s => pubBy.has(s) && pubBy.get(s) !== liveBy.get(s));

  const pending = added.length + removed.length + changed.length;
  return {
    ok: true,
    inSync: pending === 0,
    pending,
    liveCount: live.length,
    publishedCount: published.length,
    added: added.slice(0, 20),
    removed: removed.slice(0, 20),
    changed: changed.slice(0, 20),
  };
}

/**
 * Publish: regenerate franchise_roster.json + voice-profiles.json from D1 and
 * commit both to GitHub. Retired characters are excluded from the published
 * roster (that is what retiring means) but remain in D1.
 */
async function rosterPublish(env, payload = {}) {
  const d = db(env);
  const { results } = await d.prepare(
    'SELECT * FROM roster WHERE retired = 0 ORDER BY rowid').all();
  const rows = results || [];
  if (!rows.length) throw new ValidationError('roster is empty — refusing to publish an empty file');

  const wrote = [];
  const rosterFile = await getFile(env, ROSTER_PATH);

  // SAFETY: publishing overwrites franchise_roster.json wholesale. If someone
  // is in the published file but NOT in D1 — because a save half-failed, or
  // another tool wrote the JSON directly — a blind publish would delete them.
  // Refuse unless the removal was intentional (they're retired) or forced.
  if (rosterFile && !payload.force) {
    const currentDoc = decodeJson(rosterFile.content);
    const live = new Set(rows.map(r => r.slug));
    const retiredRows = await d.prepare('SELECT slug FROM roster WHERE retired = 1').all();
    const retired = new Set((retiredRows.results || []).map(r => r.slug));
    const goneRows = await d.prepare('SELECT slug FROM roster_deleted').all();
    const deleted = new Set((goneRows.results || []).map(r => r.slug));

    // Removing someone is fine if you retired or deleted them on purpose.
    // Anything else means the database never heard about them.
    const wouldRemove = (currentDoc.players || [])
      .map(p => p.slug)
      .filter(s => s && !live.has(s) && !retired.has(s) && !deleted.has(s));

    if (wouldRemove.length) {
      return {
        ok: true, action: 'blocked', wouldRemove,
        message: `Publishing would remove ${wouldRemove.length} character(s) that are in the published roster but not in the database: ${wouldRemove.join(', ')}. They were probably added while a database write was failing.`,
      };
    }
  }

  const rosterDoc = { players: rows.map(rosterRowToJson) };
  await putFile(env, ROSTER_PATH, encodeJson(rosterDoc),
    `studio: publish roster (${rows.length} characters)`, rosterFile && rosterFile.sha);
  wrote.push(ROSTER_PATH);

  const withVoice = rows.filter(r => r.voice && String(r.voice).trim());
  if (withVoice.length) {
    const voiceFile = await getFile(env, VOICE_PATH);
    const voiceDoc = voiceFile ? decodeJson(voiceFile.content) : { profiles: {} };
    if (!voiceDoc.profiles || typeof voiceDoc.profiles !== 'object') voiceDoc.profiles = {};
    for (const r of withVoice) voiceDoc.profiles[r.name] = composeVoice(r, stripBioLead(r.voice));
    await putFile(env, VOICE_PATH, encodeJson(voiceDoc),
      `studio: publish voices (${withVoice.length} profiles)`, voiceFile && voiceFile.sha);
    wrote.push(VOICE_PATH);
  }

  return { ok: true, published: rows.length, voices: withVoice.length, wrote };
}

// ══ season data sync: repo JSON -> D1 ══════════════════════════════════════
//
// players/appearances/bonds/seasons/rankings are DERIVED — the simulator makes
// them and the export writes the JSON. D1 is a queryable mirror, so it goes
// stale after every season unless it's refreshed. This endpoint rebuilds those
// tables straight from the repo, which is why the export never had to change.

const SEASON_DIR       = 'data/seasons';   // per-season episode logs live here
const PLAYERS_DB_PATH  = 'players_database.json';
const SEASONS_DB_PATH  = 'seasons_database.json';
const RANKINGS_DB_PATH = 'rankings_database.json';

/**
 * A RANKING BOARD PER SHOW, named the way the season files beside it are.
 *
 * This endpoint committed every board it was given to rankings_database.json,
 * which declares itself Total Drama's, so applying Big Brother 1 wrote
 * seventeen houseguests into the camp's board. Mirrors js/ranking-boards.js --
 * change one and change the other.
 */
function rankingsPathFor(format) {
  return !format || format === DEFAULT_FORMAT
    ? RANKINGS_DB_PATH
    : `rankings_${formatPrefix(format)}.json`;
}

/** Read a repo JSON file. Falls back to download_url for files over 1MB,
 *  where the GitHub contents API stops inlining content. */
async function getRepoJson(env, path, required = true) {
  const f = await getFile(env, path);
  if (!f) {
    if (required) throw httpErr(`${path} not found in the repo`, 404);
    return null;
  }
  if (f.content) return decodeJson(f.content);
  if (f.download_url) {
    const r = await fetch(f.download_url);
    if (r.ok) return r.json();
  }
  throw httpErr(`could not read ${path}`, 500);
}

const asInt = v => {
  if (typeof v === 'number' && Number.isFinite(v)) return Math.round(v);
  if (typeof v === 'string' && /^-?\d+$/.test(v.trim())) return parseInt(v, 10);
  return null;   // "High" and friends are prose, not ranks
};

/**
 * A portrait filename, or null.
 *
 * The client sends this and the site renders it into an <img src>, so it is a
 * filename here in the same way a slug is a filename in the avatar endpoint —
 * validated rather than trusted. Basename only: no path, no scheme, no
 * traversal, and an extension we actually serve.
 */
const safePortraitFile = v => {
  const f = typeof v === 'string' ? v.trim() : '';
  return /^[A-Za-z0-9][A-Za-z0-9._-]*\.(png|webp|jpe?g|gif)$/i.test(f)
    && !f.includes('..') ? f : null;
};
const asNum = v => (typeof v === 'number' && Number.isFinite(v) ? v : null);

// Chunking means you never have to think about batch size — the sync splits
// whatever it's given. The ceiling below is a different guard: past it we'd be
// at risk of running out of Worker time PART WAY THROUGH, which is the bad
// case, because the tables are emptied before they're refilled. Refusing up
// front leaves the old data intact.
const MAX_SYNC_STATEMENTS = 20000;
const SYNC_CHUNK = 60;

/** D1 caps how much one batch can carry, so run in chunks. */
async function runChunked(d, statements, size = SYNC_CHUNK) {
  for (let i = 0; i < statements.length; i += size) {
    try {
      await d.batch(statements.slice(i, i + size));
    } catch (e) {
      // Say plainly where it stopped and that re-running is safe: the sync
      // rebuilds from scratch every time, so a retry always converges.
      throw httpErr(
        `sync failed on rows ${i + 1}-${Math.min(i + size, statements.length)} of ` +
        `${statements.length} (${e.message}). The tables are mid-rebuild — press ` +
        `Sync again to finish; it rebuilds from scratch, so retrying is safe.`, 500);
    }
  }
}

async function syncSeasons(env) {
  const d = db(env);
  const [pdb, sdb, rdb] = await Promise.all([
    getRepoJson(env, PLAYERS_DB_PATH),
    getRepoJson(env, SEASONS_DB_PATH),
    getRepoJson(env, RANKINGS_DB_PATH, false),
  ]);

  const players = (pdb && pdb.players) || [];
  const seasons = (sdb && sdb.seasons) || [];
  const rankings = (rdb && rdb.rankings) || [];
  if (!players.length) throw new ValidationError('players_database.json has no players — refusing to wipe the tables');
  if (!seasons.length) throw new ValidationError('seasons_database.json has no seasons — refusing to wipe the tables');

  // A season is identified by (format, number) now, not by number alone — two
  // shows can both have a season 5. Anything without a format tag is Total
  // Drama: every season that exists today predates the second show.
  // Any registered show keeps its own format; anything unknown is Total Drama,
  // because every season that predates the second show carries no format tag.
  const fmtOf = v => (SHOWS[v] ? v : DEFAULT_FORMAT);
  const validSeasons = new Set(
    seasons.filter(s => s.seasonNumber != null).map(s => `${fmtOf(s.format)}|${s.seasonNumber}`));
  const validSlugs = new Set(players.map(p => p.id).filter(Boolean));
  // unbreakableBonds records display NAMES, so map them back to slugs
  const nameToSlug = new Map();
  for (const p of players) if (p.name && p.id) nameToSlug.set(String(p.name).trim().toLowerCase(), p.id);

  const stmts = [];
  const counts = { players: 0, seasons: 0, appearances: 0, tdAppearances: 0,
                   bbAppearances: 0, bonds: 0, rankings: 0, skipped: 0 };

  for (const p of players) {
    if (!p.id) { counts.skipped++; continue; }
    counts.players++;
    // The four Total Drama career totals are NOT written: they are derived by
    // SUMming td_appearances on read, and a stored copy is a second source of
    // truth that drifts the first time a season is re-imported.
    stmts.push(d.prepare(
      `INSERT INTO players (id,name,total_seasons,best_placement,wins,
        total_votes_against,total_jury_votes,tier,avg_placement) VALUES (?,?,?,?,?,?,?,?,?)`
    ).bind(p.id, p.name || p.id, asInt(p.totalSeasons), asInt(p.bestPlacement), asInt(p.wins),
      asInt(p.totalVotesAgainst), asInt(p.totalJuryVotes), p.tier || null, asNum(p.avgPlacement)));
  }

  for (const s of seasons) {
    if (s.seasonNumber == null) continue;
    counts.seasons++;
    const w = s.winner || {};
    // A season with no format is Total Drama — every season predates Big Brother.
    const format = fmtOf(s.format);
    stmts.push(d.prepare(
      `INSERT INTO seasons (season_number,title,subtitle,cast_size,episode_count,winner_slug,theme,status,format)
       VALUES (?,?,?,?,?,?,?,?,?)`
    ).bind(s.seasonNumber, s.title || null, s.subtitle || null, asInt(s.castSize),
      asInt(s.episodeCount), w.playerSlug || null, s.theme || null, s.status || null, format));
  }

  const seenApp = new Set(), seenBond = new Set();
  for (const p of players) {
    if (!p.id) continue;
    for (const det of (p.seasonDetails || [])) {
      const sn = det.season;
      // Which show this season belongs to. An explicit tag wins. With no tag,
      // a detail carrying BB numbers is Big Brother — the same rule the schema
      // migration used to derive `format` for existing rows, so the two agree.
      // Everything else is Total Drama, because every season detail written so
      // far predates the second show.
      const fmt = det.format ? fmtOf(det.format) : (det.bb ? 'big-brother' : 'total-drama');
      if (!validSeasons.has(`${fmt}|${sn}`)) { counts.skipped++; continue; }
      // The key must carry the format, or one player's Total Drama season 5 and
      // their Big Brother season 5 look like the same appearance and the second
      // is silently dropped — the exact case this whole schema exists for.
      const key = `${p.id}|${fmt}|${sn}`;
      if (seenApp.has(key)) continue;
      seenApp.add(key);
      counts.appearances++;
      stmts.push(d.prepare(
        `INSERT INTO appearances (player_id,format,season_number,placement,status,
          votes_received,jury_votes,final_vote) VALUES (?,?,?,?,?,?,?,?)`
      ).bind(p.id, fmt, sn, asInt(det.placement), det.status || null,
        asInt(det.votesReceived), asInt(det.juryVotes), det.finalVote || null));

      // The Total Drama half of an appearance, in its own table. Driven off the
      // FORMAT, so a Big Brother season never writes a tribe. Every Total Drama
      // appearance gets a row: the read path LEFT JOINs this table, so a
      // missing row reads as zero challenge wins with no error anywhere.
      if (fmt === 'total-drama') {
        counts.tdAppearances++;
        stmts.push(d.prepare(
          `INSERT INTO td_appearances (player_id,season_number,tribe,challenge_wins,
            immunity_wins,reward_wins,idols_found,strategic_rank) VALUES (?,?,?,?,?,?,?,?)`
        ).bind(p.id, sn, det.tribe || null, asInt(det.challengeWins), asInt(det.immunityWins),
          asInt(det.rewardWins), asInt(det.idolsFound), asInt(det.strategicRank)));
      }

      // Big Brother seasons additionally carry HOH/veto/block counts. They live
      // in their own table rather than as columns on `appearances`, which would
      // be null for every Total Drama row — that is, for nearly every row.
      // Driven off det.bb, not det.format, so a season detail that carries the
      // numbers still records them even if the format tag was missed.
      if (det.bb) {
        counts.bbAppearances++;
        stmts.push(d.prepare(
          `INSERT INTO bb_appearances (player_id,season_number,hoh_wins,veto_wins,
            times_nominated,times_on_block,times_saved) VALUES (?,?,?,?,?,?,?)`
        ).bind(p.id, sn, asInt(det.bb.hohWins), asInt(det.bb.vetoWins),
          asInt(det.bb.timesNominated), asInt(det.bb.timesOnBlock), asInt(det.bb.timesSaved)));
      }

      for (const ally of (det.unbreakableBonds || [])) {
        const allySlug = nameToSlug.get(String(ally).trim().toLowerCase());
        if (!allySlug || !validSlugs.has(allySlug) || allySlug === p.id) continue;
        // Format in the key too: the same pair can be allies in two shows'
        // season 1, and `bonds` is keyed (player_id, ally_id, format, season).
        const bkey = `${p.id}|${allySlug}|${fmt}|${sn}`;
        if (seenBond.has(bkey)) continue;
        seenBond.add(bkey);
        counts.bonds++;
        stmts.push(d.prepare('INSERT INTO bonds (player_id,ally_id,format,season_number) VALUES (?,?,?,?)')
          .bind(p.id, allySlug, fmt, sn));
      }
    }
  }

  for (const r of rankings) {
    if (!r.playerId) continue;
    counts.rankings++;
    stmts.push(d.prepare(
      `INSERT INTO rankings (player_id,name,rank,tier,score,title,emoji,status,avg_placement,
        win_rate,wins,seasons_played,challenge_wins,votes_against,jury_votes,idols_found,
        placement_percentile,win_percentile,challenge_percentile,social_percentile,
        strategic_percentile,reasoning,strengths,weaknesses)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`
    ).bind(r.playerId, r.name || null, asInt(r.rank), r.tier || null, asNum(r.score),
      r.title || null, r.emoji || null, r.status || null, asNum(r.avgPlacement),
      asNum(r.winRate), asInt(r.wins), asInt(r.seasonsPlayed), asInt(r.challengeWins),
      asInt(r.votesAgainst), asInt(r.juryVotes), asInt(r.idolsFound),
      asNum(r.placementPercentile), asNum(r.winPercentile), asNum(r.challengePercentile),
      asNum(r.socialPercentile), asNum(r.strategicPercentile),
      r.reasoning || null,
      Array.isArray(r.strengths) ? JSON.stringify(r.strengths) : null,
      Array.isArray(r.weaknesses) ? JSON.stringify(r.weaknesses) : null));
  }

  // Check the size BEFORE deleting anything. If this is ever too big to finish
  // safely, the old data is still there and nothing has been lost.
  if (stmts.length > MAX_SYNC_STATEMENTS) {
    throw new ValidationError(
      `this sync would run ${stmts.length} statements, over the ${MAX_SYNC_STATEMENTS} ` +
      `safety limit (${counts.players} players, ${counts.appearances} appearances, ` +
      `${counts.bonds} bonds, ${counts.tdAppearances} Total Drama rows, ` +
      `${counts.bbAppearances} Big Brother rows, ` +
      `${counts.rankings} rankings). Nothing was changed. ` +
      `The franchise has outgrown a single-request sync — it needs to be split ` +
      `into batches per season.`);
  }

  // Clear in dependency order, then refill. The roster table is untouched —
  // it is authored data and has nothing to do with this.
  await runChunked(d, [
    d.prepare('DELETE FROM bonds'),
    d.prepare('DELETE FROM bb_appearances'),
    // NOT ms_legacy_td_columns — that is the migration's re-run guard, not data.
    d.prepare('DELETE FROM td_appearances'),
    d.prepare('DELETE FROM appearances'),
    d.prepare('DELETE FROM rankings'),
    d.prepare('DELETE FROM seasons'),
    d.prepare('DELETE FROM players'),
  ]);
  await runChunked(d, stmts);

  return {
    ok: true,
    synced: counts,
    statements: stmts.length,
    headroom: `${stmts.length}/${MAX_SYNC_STATEMENTS} of the safety limit`,
    note: 'roster table untouched (authored data)',
  };
}

// ══ live season: the season currently airing ═══════════════════════════════
// Written after any episode you're happy with. No commit, no rebuild — the
// site reads it as an overlay on top of the finished-season JSON.

async function liveSeasonGet(env) {
  const d = db(env);
  const [metaRes, rowsRes] = await d.batch([
    d.prepare('SELECT * FROM live_meta WHERE id = 1'),
    d.prepare('SELECT * FROM live_season ORDER BY status, player_name'),
  ]);
  const meta = (metaRes.results || [])[0];
  if (!meta || meta.season_number == null) return { ok: true, airing: false, players: [] };
  return {
    ok: true,
    airing: true,
    seasonNumber: meta.season_number,
    title: meta.title,
    episode: meta.episode,
    totalPlayers: meta.total_players,
    stillIn: meta.still_in,
    updatedAt: meta.updated_at,
    players: (rowsRes.results || []).map(r => ({
      name: r.player_name,
      slug: r.player_id,
      status: r.status,
      exitEpisode: r.exit_episode,
      immunityWins: r.immunity_wins,
      rewardWins: r.reward_wins,
      challengeWins: r.challenge_wins,
      votesReceived: r.votes_received,
      // Absent rather than null on a database without the migration, so a
      // reader can tell "no portrait recorded" from "this season chose the
      // default" without guessing.
      ...(r.avatar_file ? { avatarFile: r.avatar_file } : {}),
      ...(r.avatar_id ? { avatarId: r.avatar_id } : {}),
    })),
  };
}

async function liveSeasonPut(env, payload = {}) {
  const season = asInt(payload.seasonNumber);
  const players = Array.isArray(payload.players) ? payload.players : [];
  if (!season) throw new ValidationError('seasonNumber is required');
  if (!players.length) throw new ValidationError('no players in the snapshot — refusing to publish an empty season');

  const d = db(env);

  /* A FINISHED SEASON CANNOT BE AIRING.
     The live overlay exists for a season that is not yet in the permanent
     history. Total Drama 14 has been published for weeks and kept coming back
     to the site announcing "airing — episode 26, 2 of 18 still in", because
     pressing Sync with that season still loaded in the simulator re-published
     the overlay every time. Clearing it by hand fixed the symptom for exactly
     as long as it took to press the button again.

     Refused rather than warned, because the two facts contradict each other and
     the site can only show one. `force` is there for the real case this blocks:
     replaying a season you intend to publish over. */
  // Inlined rather than borrowing the helper further down: that one is a local
  // inside another function, and reaching for it here would be a scope bug that
  // only fires on this path.
  const fmt = SHOWS[payload.format] ? payload.format : DEFAULT_FORMAT;
  if (!payload.force) {
    const done = await d.prepare(
      'SELECT title FROM seasons WHERE format = ? AND season_number = ?'
    ).bind(fmt, season).first().catch(() => null);
    if (done) {
      throw new ValidationError(
        `${SHOWS[fmt]?.name || fmt} ${season} is already published as a finished season`
        + (done.title ? ` ("${done.title}")` : '')
        + '. A finished season cannot also be airing — the site would show it both ways. '
        + 'If you are replaying it, sync again with force to overlay it anyway.');
    }
  }

  const stmts = [
    d.prepare('DELETE FROM live_season'),
    d.prepare(
      `INSERT INTO live_meta (id,season_number,title,episode,total_players,still_in,updated_at)
       VALUES (1,?,?,?,?,?,datetime('now'))
       ON CONFLICT(id) DO UPDATE SET season_number=excluded.season_number, title=excluded.title,
         episode=excluded.episode, total_players=excluded.total_players,
         still_in=excluded.still_in, updated_at=excluded.updated_at`
    ).bind(season, payload.title || null, asInt(payload.episode),
      asInt(payload.totalPlayers) || players.length,
      asInt(payload.stillIn) ?? players.filter(p => p.status === 'in').length),
  ];

  // ── THE PORTRAIT, IF THE DATABASE HAS SOMEWHERE TO PUT IT ──────────
  //
  // live_season_migration_portrait.sql adds the two columns. A database that
  // has not had it applied answers the INSERT with "no such column", and the
  // STANDINGS — the thing sync exists to do — would go down with them. Same
  // rule as the feed below: the portraits are worth having and not worth
  // taking the sync with them, so the write is attempted with the columns and
  // retried without.
  const rowStmts = withPortraits => players.filter(p => p && p.name).map(p => (withPortraits
    ? d.prepare(
      `INSERT INTO live_season (season_number,player_name,player_id,status,exit_episode,
        immunity_wins,reward_wins,challenge_wins,votes_received,avatar_id,avatar_file)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`
    ).bind(season, String(p.name), p.slug || null, p.status || 'in', asInt(p.exitEpisode),
      asInt(p.immunityWins) || 0, asInt(p.rewardWins) || 0,
      asInt(p.challengeWins) || 0, asInt(p.votesReceived) || 0,
      p.avatarId || null, safePortraitFile(p.avatarFile))
    : d.prepare(
      `INSERT INTO live_season (season_number,player_name,player_id,status,exit_episode,
        immunity_wins,reward_wins,challenge_wins,votes_received) VALUES (?,?,?,?,?,?,?,?,?)`
    ).bind(season, String(p.name), p.slug || null, p.status || 'in', asInt(p.exitEpisode),
      asInt(p.immunityWins) || 0, asInt(p.rewardWins) || 0,
      asInt(p.challengeWins) || 0, asInt(p.votesReceived) || 0)));

  let portraitError = null;
  try {
    await runChunked(d, [...stmts, ...rowStmts(true)]);
  } catch (e) {
    if (!/no such column/i.test(e.message || '')) throw e;
    portraitError = 'live_season has no portrait columns — apply '
      + 'worker/live_season_migration_portrait.sql';
    await runChunked(d, [...stmts, ...rowStmts(false)]);
  }

  // The feed rides along with the standings so one press of sync puts the whole
  // night on the site — but it is written SEPARATELY and afterwards, and its
  // failure is reported rather than thrown.
  //
  // In the same batch it would be a shared fate: a database where
  // social_schema.sql has not been applied yet answers the first INSERT with
  // "no such table: social_posts", and the standings — the thing sync exists to
  // do, and which worked perfectly the day before — would go down with a
  // feature the user may not even have noticed shipping.
  let posts = 0, socialError = null;
  const social = socialStatements(d, payload.social);
  if (social.length) {
    try {
      await runChunked(d, social);
      posts = social.length - 1;                    // less the DELETE
    } catch (e) {
      socialError = e.message || String(e);
    }
  }

  return {
    ok: true, seasonNumber: season, episode: asInt(payload.episode),
    players: players.length, posts,
    ...(socialError ? { socialError } : {}),
    ...(portraitError ? { portraitError } : {}),
  };
}

/**
 * Take the airing season off the site.
 *
 * `keepFeed` is the difference between the two callers, and it matters:
 *
 *   the button      you are abandoning or restarting a run, so the feed of the
 *                   run that did not happen goes with it
 *   publishing      the season FINISHED. Its posts carry engagement that
 *                   accumulated while it aired, and /api/social is keyed by
 *                   (format, season), so keeping them means an archived season
 *                   shows the feed it really had rather than one regenerated
 *                   from its own records.
 */
async function liveSeasonClear(env, { keepFeed = false } = {}) {
  const d = db(env);
  const stmts = [
    d.prepare('DELETE FROM live_season'),
    d.prepare('DELETE FROM live_meta'),
  ];
  if (!keepFeed) stmts.push(d.prepare('DELETE FROM social_posts'));
  await d.batch(stmts);
  return { ok: true, cleared: true, keptFeed: keepFeed };
}

/**
 * The airing season's social feed, replaced whole.
 *
 * Written as delete-then-insert for the season rather than upserted row by row:
 * the simulator rebuilds an episode's posts when it is replayed, so a merge
 * would leave the reactions to the night that was replaced sitting alongside the
 * new ones. Same reason the store in the simulator replaces rather than appends.
 *
 * Engagement counters come from the simulator, which owns them — a post ratioed
 * in the simulator arrives here already ratioed.
 */
function socialStatements(d, payload) {
  const posts = Array.isArray(payload?.posts) ? payload.posts : [];
  if (!posts.length) return [];

  const format = String(payload.format || 'total-drama');
  const season = asInt(payload.season);
  const stmts = [d.prepare(socialDeleteSeasonQuery()).bind(format, season)];

  for (const p of posts) {
    if (!p || !p.id || !p.text) continue;
    stmts.push(d.prepare(socialInsertQuery()
    ).bind(String(p.id), format, season, asInt(p.episode), String(p.stream || 'timeline'),
      p.handle || null, p.name || null, p.topic || null, p.kind || null, p.subject || null,
      String(p.text), asInt(p.at) || 0, p.replyTo || null,
      asInt(p.likes) || 0, asInt(p.tomatoes) || 0));
  }
  return stmts;
}

/**
 * The feed for one episode, or for the whole airing season.
 *
 * Ordered by arrival, because that is how the page replays it: a reaction to the
 * vote must not appear before the vote.
 */
async function socialGet(env, url) {
  const d = db(env);
  const format = url.searchParams.get('format') || 'total-drama';
  const season = asInt(url.searchParams.get('season'));
  const episode = asInt(url.searchParams.get('episode'));
  if (!season) throw new ValidationError('season is required');

  const sql = socialSelectQuery({ episode: !!episode });
  const bindings = episode ? [format, season, episode] : [format, season];
  const res = await d.prepare(sql).bind(...bindings).all();

  return {
    ok: true, format, season, episode: episode || null,
    posts: (res.results || []).map(r => ({
      id: r.id, episode: r.episode, stream: r.stream, handle: r.handle, name: r.author,
      topic: r.topic, kind: r.kind, subject: r.subject, text: r.body,
      at: r.at_ms, replyTo: r.reply_to, likes: r.likes, tomatoes: r.tomatoes,
    })),
  };
}

/**
 * Commit the JSON the season export just produced, then refresh D1 from it.
 * This is the step that used to be manual: the export could only download
 * files, so they had to be moved into the repo by hand before syncing.
 *
 * Body: { seasonNumber, season, players, seasons, franchise, rankings }
 * Every document is optional except that at least one must be present.
 */
// ── SEASON FILL: commit what the wiki fills produced ──────────────────
//
// The two wiki fills each read the season document, added their own fields
// and downloaded the result under the same filename. Running both meant two
// files called season14-data.json, each missing the other's work, merged by
// hand and uploaded — a download, a wait, an upload, a sync, twice.
//
// So the fills post their OUTPUT here and the merge happens server-side,
// against the file as it is in the repo right now. That is the important
// part: the browser never sends a whole season document, so a second fill
// cannot overwrite the first, and a tab left open since yesterday cannot
// commit a stale season over a finished one.
//
// Deliberately NOT publishSeason(): that one ends a season's run, clears the
// live overlay and rebuilds the derived tables, none of which a prose edit
// should do. This writes one file and stops.
/**
 * Carry a season's AUTHORED fields across a re-export.
 *
 * A season document holds two kinds of thing, and only one of them can be
 * rebuilt. The DERIVED half — placements, votes, competition records, twists —
 * comes out of the simulator every time the season is exported. The AUTHORED
 * half is written once by the wiki fill from the episode screenplays:
 * personality, quotes and trivia per player, and the game history in prose.
 *
 * The export template does not contain the authored fields, because the export
 * has never known about them. So publishing a re-export over a filled season
 * would silently delete every one of them, and the only copy — the screenplays
 * are in one browser's IndexedDB — would have to be paid for again.
 *
 * They are carried forward here, at the single point every publish passes
 * through. An incoming value always wins: a fresh fill is meant to replace an
 * old one. This only fills the silences.
 */
function carryAuthoredFields(incoming, existing) {
  if (!incoming || !existing) return incoming;

  const byName = new Map((existing.placements || []).map(p => [p.name, p]));
  const bySlug = new Map((existing.placements || [])
    .filter(p => p.playerSlug).map(p => [p.playerSlug, p]));

  for (const row of (incoming.placements || [])) {
    const old = byName.get(row.name) || bySlug.get(row.playerSlug);
    if (!old) continue;                       // a cast that changed is not our business
    if (!row.lead && old.lead) row.lead = old.lead;
    if (!row.personality && old.personality) row.personality = old.personality;
    if (!(row.quotes || []).length && (old.quotes || []).length) row.quotes = old.quotes;
    if (!(row.trivia || []).length && (old.trivia || []).length) row.trivia = old.trivia;
  }
  if (!(incoming.gameHistory || []).length && (existing.gameHistory || []).length) {
    incoming.gameHistory = existing.gameHistory;
  }
  // Twists ARE derived now, but a season exported before that carried none —
  // so an incoming list wins and an absent one does not erase what is there.
  if (!(incoming.twists || []).length && (existing.twists || []).length) {
    incoming.twists = existing.twists;
  }
  return incoming;
}

async function seasonFill(env, payload = {}) {
  const n = asInt(payload.seasonNumber);
  if (!n) throw new ValidationError('seasonNumber is required');
  const format = payload.format || DEFAULT_FORMAT;
  if (!SHOWS[format]) {
    throw new ValidationError(
      `unknown season format "${format}" — add it to SHOWS in js/shows.js first `
      + `(known: ${Object.keys(SHOWS).join(', ')})`);
  }
  const players = Array.isArray(payload.players) ? payload.players : [];
  const gameHistory = Array.isArray(payload.gameHistory) ? payload.gameHistory : null;
  if (!players.length && !gameHistory) {
    throw new ValidationError('nothing to fill — send players and/or gameHistory');
  }

  const file = format === DEFAULT_FORMAT
    ? `season${n}-data.json`
    : `${formatPrefix(format)}-${n}-data.json`;
  const path = `${SEASON_DIR}/${file}`;

  const existing = await getFile(env, path);
  if (!existing) {
    throw new ValidationError(`no season document at ${path} — export the season before filling it`);
  }
  const doc = decodeJson(existing.content);
  if (!Array.isArray(doc.placements)) {
    throw new ValidationError(`${path} has no placements — it is not a season document`);
  }

  // Merge by NAME. A name the season does not have is reported rather than
  // added: a fill that invented a houseguest is a bug worth seeing, and
  // appending them would put somebody in the cast who never played.
  const wrote = { players: [], unknown: [], rounds: 0 };
  for (const p of players) {
    const row = doc.placements.find(x => x.name === p.name);
    if (!row) { wrote.unknown.push(p.name); continue; }
    if (p.lead) row.lead = p.lead;
    if (p.personality) row.personality = p.personality;
    if (Array.isArray(p.quotes) && p.quotes.length) row.quotes = p.quotes;
    if (Array.isArray(p.trivia) && p.trivia.length) row.trivia = p.trivia;
    wrote.players.push(p.name);
  }
  if (gameHistory) {
    // Only rounds with prose. An empty entry would replace a written round
    // with a blank one when somebody re-runs the fill on a season whose
    // later episodes are not written yet.
    const kept = gameHistory.filter(r => r && r.prose);
    const byN = new Map((Array.isArray(doc.gameHistory) ? doc.gameHistory : []).map(r => [Number(r.n), r]));
    for (const r of kept) byN.set(Number(r.n), r);
    doc.gameHistory = [...byN.values()].sort((a, b) => Number(a.n) - Number(b.n));
    wrote.rounds = kept.length;
  }

  await putFile(env, path, encodeJson(doc),
    `season ${n}: wiki fill (${wrote.players.length} players, ${wrote.rounds} rounds)`,
    existing.sha);

  return { ok: true, path, ...wrote };
}

async function publishSeason(env, payload = {}) {
  const wrote = [];
  const docs = [];

  const n = asInt(payload.seasonNumber);
  if (payload.season) {
    if (!n) throw new ValidationError('seasonNumber is required when publishing season data');
    // The season number alone stopped identifying a season when a second show
    // arrived: `seasons` is keyed (format, season_number), so Total Drama 1 and
    // Big Brother 1 both exist and both used to resolve to season1-data.json.
    // Publishing the Big Brother season would have committed straight over the
    // Total Drama one — a silent overwrite of a finished season's episode log.
    //
    // Total Drama keeps the bare filename because fourteen of these are already
    // in the repo and several readers match on it by name; every other show is
    // namespaced. The name is the season's `seasonId` — the same "bb-1" string
    // seasons_database.json already carries — so a reader holding a season
    // record can derive its episode log without a second lookup table.
    // A format the registry does not know cannot be given a filename: formatPrefix
    // falls back to the DEFAULT show's prefix, so two unregistered shows would both
    // write td-N-data.json and overwrite each other. Refuse instead of guessing —
    // adding a show is a one-line registry edit, and this is the error that says so.
    const format = payload.format || DEFAULT_FORMAT;
    if (!SHOWS[format]) {
      throw new ValidationError(
        `unknown season format "${format}" — add it to SHOWS in js/shows.js first `
        + `(known: ${Object.keys(SHOWS).join(', ')})`);
    }
    const file = format === DEFAULT_FORMAT
      ? `season${n}-data.json`
      : `${formatPrefix(format)}-${n}-data.json`;
    docs.push([`${SEASON_DIR}/${file}`, payload.season]);
  }
  if (payload.players)   docs.push([PLAYERS_DB_PATH, payload.players]);
  if (payload.seasons)   docs.push([SEASONS_DB_PATH, payload.seasons]);
  if (payload.franchise) docs.push(['franchise_database.json', payload.franchise]);
  // The board belonging to the show whose season is being published. `format`
  // is resolved above for the season document; the board follows it.
  if (payload.rankings)  docs.push([rankingsPathFor(payload.format), payload.rankings]);
  if (!docs.length) throw new ValidationError('nothing to publish — no documents in the request');

  // Refuse obviously truncated payloads rather than committing them over good
  // data. An export that produced an empty players list is a bug, not a season.
  for (const [path, doc] of docs) {
    if (path === PLAYERS_DB_PATH && !(doc.players || []).length) {
      throw new ValidationError('players_database.json payload has no players — refusing to overwrite the repo copy');
    }
    if (path === SEASONS_DB_PATH && !(doc.seasons || []).length) {
      throw new ValidationError('seasons_database.json payload has no seasons — refusing to overwrite the repo copy');
    }
  }

  for (const [path, doc] of docs) {
    const existing = await getFile(env, path);
    // A re-export must not delete prose it does not know about. Only the season
    // document has authored fields; the databases are derived end to end.
    const body = (path.startsWith(`${SEASON_DIR}/`) && existing)
      ? carryAuthoredFields(doc, decodeJson(existing.content))
      : doc;
    await putFile(env, path, encodeJson(body),
      n ? `season ${n}: publish ${path}` : `studio: publish ${path}`, existing && existing.sha);
    wrote.push(path);
  }

  // The season is finished and now part of the permanent history, so the live
  // overlay would only duplicate it. Clear it.
  try { await liveSeasonClear(env); } catch { /* overlay is best-effort */ }

  // Now that the repo is current, rebuild the derived tables from it.
  let synced = null;
  try {
    synced = (await syncSeasons(env)).synced;
  } catch (e) {
    return { ok: true, wrote, synced: null,
             warning: `Files committed, but the database sync failed: ${e.message}. Press "Sync season data" to retry.` };
  }

  // PUBLISHING A SEASON ENDS ITS RUN.
  //
  // The live overlay exists for a season that is NOT yet in the permanent
  // history — it is what the site shows while one is airing. Publishing puts it
  // in that history, so the overlay is describing the same season twice, once
  // as finished and once as still going.
  //
  // Nothing used to clear it, so Total Drama 14 sat on the site announcing
  // "airing — episode 26, 2 of 18 still in" for a fortnight after its finale.
  // Asking somebody to remember a second button is how that happens.
  //
  // Cleared only when the live row IS this season: a Big Brother publish must
  // not take an airing Total Drama season off the site.
  let endedRun = null;
  try {
    const live = await db(env).prepare('SELECT season_number FROM live_meta WHERE id = 1').first();
    if (live && n && asInt(live.season_number) === n) {
      await liveSeasonClear(env, { keepFeed: true });
      endedRun = n;
    }
  } catch { /* the season is published either way; this is tidying */ }

  // The feed is deliberately NOT cleared. Its posts carry engagement that
  // accumulated while the season aired, and /api/social is keyed by
  // (format, season) — so an archived season keeps the feed it actually had
  // rather than falling back to one regenerated from its own records.
  return { ok: true, wrote, synced, endedRun };
}

// ══ standalone avatar management ═══════════════════════════════════════════
// Upload or remove an avatar PNG without creating a character. Avatars are real
// files in the repo (assets/avatars/<slug>.png), so both operations are git
// commits — there is nowhere else for an image to live.

async function avatarSave(env, payload) {
  const slug = String(payload.slug || '').trim().toLowerCase();
  if (!SLUG_RE.test(slug)) throw new ValidationError('slug must be lowercase letters, digits, and dashes');
  const dataUri = String(payload.dataUri || '');
  if (!dataUri.startsWith('data:image') || !dataUri.includes(',')) {
    throw new ValidationError('dataUri must be a data:image/... payload');
  }
  const b64 = dataUri.slice(dataUri.indexOf(',') + 1);
  const path = `${AVATAR_DIR}/${slug}.png`;
  const existing = await getFile(env, path);
  await putFile(env, path, b64,
    `studio: ${existing ? 'replace' : 'add'} avatar ${slug}`, existing && existing.sha);
  return { ok: true, slug, path, replaced: !!existing };
}

/**
 * Delete an avatar PNG from the repo. If a character in the roster uses that
 * slug we refuse unless force:true, so you can't silently break a portrait.
 */
async function avatarDelete(env, payload) {
  const slug = String(payload.slug || '').trim().toLowerCase();
  if (!SLUG_RE.test(slug)) throw new ValidationError('slug is required');

  const path = `${AVATAR_DIR}/${slug}.png`;
  const file = await getFile(env, path);
  if (!file) throw httpErr(`no avatar file for "${slug}"`, 404);

  if (!payload.force && env.DB) {
    const owner = await env.DB.prepare('SELECT name FROM roster WHERE slug = ?').bind(slug).first();
    if (owner) {
      return { ok: true, action: 'blocked', slug, usedBy: owner.name,
               message: `${owner.name} uses this avatar. Deleting it leaves them with no portrait.` };
    }
  }

  await deleteFile(env, path, `studio: delete avatar ${slug}`, file.sha);
  return { ok: true, action: 'deleted', slug, path };
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
    // ── THE SLUG THE CALLER ASKED FOR ──
    //
    // This wrote `<roster slug>.png` and ignored `avatar.slug` completely.
    // Harmless while a character had exactly one image, and destructive the
    // moment anything uploads a VARIANT: the returnee slot posts
    // `jules-returnee` and this saved it straight over jules.png, replacing the
    // character's real portrait with their returnee art — twice, because the
    // first restore was undone by the next upload through this endpoint.
    //
    // Validated rather than trusted: the slug becomes a path in a git commit.
    const want = String(avatar.slug || '').trim().toLowerCase();
    const target = /^[a-z0-9][a-z0-9-]*$/.test(want) ? want : slug;
    const path = `${AVATAR_DIR}/${target}.png`;
    const existing = await getFile(env, path);
    await putFile(env, path, b64, `studio: avatar for ${name}`, existing && existing.sha);
    result.wrote.push(path);
    // A returnee variant is only ever USED if the manifest lists it, and the
    // manifest is a committed file — so writing the art without it leaves the
    // image in the repo and invisible everywhere.
    if (target.endsWith('-returnee')) {
      try { await rewriteReturneeManifest(env); result.wrote.push(RETURNEE_MANIFEST); }
      catch (e) { /* the art landed; the manifest can be regenerated */ }
    }
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

async function deleteFile(env, path, message, sha) {
  const r = await fetch(`${ghBase(env)}/${encodeURI(path)}`, {
    method: 'DELETE', headers: { ...ghHeaders(env), 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, sha, branch: branch(env) }),
  });
  if (!r.ok) throw httpErr(`GitHub DELETE ${path} failed (${r.status}): ${await r.text()}`, r.status);
  return r.json();
}

/**
 * Replace life_events.json with the inbox's decisions.
 *
 * THE WHOLE LOG IS SENT AND THE WHOLE FILE IS REWRITTEN, rather than patching
 * rows. The inbox is the only thing that edits this file and always holds every
 * row, so a partial write is how two writers end up disagreeing about which
 * events are canon. serve.py's local endpoint works the same way for the same
 * reason; the two must not diverge.
 *
 * Validated before it lands. A row with no player, or a status nothing renders,
 * is a bug in the caller — writing it would put something on disk that no page
 * can draw and no inbox can approve.
 */
async function lifeEventsSave(env, payload = {}) {
  const events = payload.events;
  if (!Array.isArray(events)) throw new ValidationError('events must be a list');
  const STATUSES = ['approved', 'proposed', 'rejected'];
  events.forEach((e, i) => {
    if (!e || typeof e !== 'object') throw new ValidationError(`event ${i} is not an object`);
    if (!String(e.player || '').trim()) throw new ValidationError(`event ${i} has no player`);
    if (!String(e.kind || '').trim()) throw new ValidationError(`event ${i} has no kind`);
    if (!STATUSES.includes(e.status)) {
      throw new ValidationError(`event ${i} has status ${JSON.stringify(e.status)}`);
    }
  });

  const existing = await getFile(env, LIFE_PATH);
  const doc = existing ? decodeJson(existing.content) : {};
  doc.events = events;

  const counts = {};
  for (const e of events) counts[e.status] = (counts[e.status] || 0) + 1;

  await putFile(env, LIFE_PATH, encodeJson(doc),
    `life: ${counts.approved || 0} canon, ${counts.rejected || 0} rejected`,
    existing && existing.sha);
  return { ok: true, wrote: [LIFE_PATH], counts };
}

async function getJson(env, path, fallback) {
  const f = await getFile(env, path);
  return f ? decodeJson(f.content) : fallback;
}

const RETURNEE_MANIFEST = `${AVATAR_DIR}/returnee-manifest.json`;

/**
 * Regenerate returnee-manifest.json from what is actually in the directory.
 *
 * refreshReturneeAvatars() treats this file as authoritative — it asks
 * `manifest.has(base)` and never looks for the image once the manifest has
 * loaded — so returnee art that is not listed here exists and is never drawn.
 * Derived from the listing every time, so it cannot disagree with the files.
 */
async function rewriteReturneeManifest(env) {
  const slugs = (await listAvatars(env))
    .filter(s => s.endsWith('-returnee'))
    .map(s => s.slice(0, -'-returnee'.length))
    .sort();
  const body = `${JSON.stringify(slugs)}
`;
  const existing = await getFile(env, RETURNEE_MANIFEST);
  await putFile(env, RETURNEE_MANIFEST, bytesToB64(new TextEncoder().encode(body)),
    'studio: returnee manifest', existing && existing.sha);
  return slugs;
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
    // Any localhost origin is the user's own machine, whatever port their
    // server picked today. The list pinned :8080 while the checkout serves on
    // :4222, and every token-gated write from a local page — pin a photo, set
    // a mood — died at the browser's preflight, before the Worker was ever
    // asked. The token is the real gate; the origin check is for strangers.
    const local = /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
    allow = (list.includes(origin) || local) ? origin : list[0];
  }
  return {
    'Access-Control-Allow-Origin': allow,
    // PUT and DELETE are the gallery's, and they only reach R2 with a token.
    // Missing here, the browser's preflight refuses the upload before the
    // Worker is ever asked — and the failure surfaces as a bare CORS error
    // with nothing about methods in it.
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
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
