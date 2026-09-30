// ══════════════════════════════════════════════════════════════════════
// ci-photos-ui.js — the Photos tab of the Circle view (Plan 4b)
// ══════════════════════════════════════════════════════════════════════
//
// Mockup v3, approved 2026-09-30 (user: "less cluttered, a tab switcher,
// tech forward — and make sure we still know we're in The Circle"):
//   - the Circle's ring logo and name; the players' "Circle, …" commands; the
//     pink ALERT! when a batch lands; the profile card look;
//   - tabs for personas and players, a rail of rings that fill as photos are
//     added, ONE person's slots at a time, and a console that types the prompt.
// The rules (slots, fallbacks, prompts, file names, packs) are js/ci/photos.js.
// ci-cast-ui.js draws the tab and hands this module its context, so the two
// never import each other.
import { KINDS, KIND_LABEL, KIND_WHEN, slotsFor, photoFor, promptForSlot, parseDrop, packPhotos, unpackPhotos } from './ci/photos.js';
import { putPhoto, putPhotoWithId, photoURL, cachedPhoto, photoSrc, shrinkImage, backUpPhotos } from './ci/photo-store.js';
import { jobOf } from './ci/persona-data.js';

let ctx = null;
/** ci-cast-ui.js: { cfg, ownPool, poolNow, cast, dealt, avatar, done }. */
export function setPhotoContext(c) { ctx = c; }

const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const W = () => window;

function people() {
  return { personas: ctx.poolNow(), players: ctx.cast().map(p => p.name) };
}
function current() {
  const tab = W()._ciPhotoTab === 'players' ? 'players' : 'personas';
  const list = tab === 'players' ? ctx.cast().map(p => ({ key: p.name, name: p.name, player: p.name, age: p.age }))
    : ctx.poolNow().map(p => ({ key: p.id, name: p.handle, persona: p }));
  const who = list.find(x => x.key === W()._ciPhotoWho) || list[0] || null;
  return { tab, list, who };
}
const whoRef = w => (w.persona ? { persona: w.persona } : { player: w.player, age: w.age });
const slotsOf = w => slotsFor(whoRef(w), ctx.dealt());
/** A face id as something an <img> can show. */
function url(face) {
  if (!face) return '';
  if (face.startsWith('photo:')) return photoSrc(face) || '';
  if (face.startsWith('portrait:')) return ctx.avatar(face.slice(9)) || '';
  return '';
}
function counts() {
  const cfg = ctx.cfg();
  let own = 0, total = 0;
  for (const p of ctx.poolNow()) for (const k of slotsFor({ persona: p })) { total++; if (photoFor({ persona: p }, k, cfg).own) own++; }
  for (const p of ctx.cast()) for (const k of slotsFor({ player: p.name }, ctx.dealt())) { total++; if (photoFor({ player: p.name }, k, cfg).own) own++; }
  return { own, total };
}
function metaOf(w) {
  const d = ctx.dealt();
  if (w.persona) {
    const taker = Object.entries(d || {}).find(([, x]) => x.personaId === w.persona.id)?.[0];
    const job = w.persona.job || jobOf(w.persona)?.name?.toLowerCase() || '';
    return [w.persona.age, job, taker ? `taken by ${taker}` : d ? 'stock' : null].filter(Boolean).join(' · ');
  }
  const x = d?.[w.player];
  return x ? (x.mode === 'catfish' ? `plays as ${x.shown?.name}` : 'plays themselves') : 'not dealt yet';
}

const ring = (pct, img, letter, r = 30, size = 66) => {
  const c = 2 * Math.PI * r;
  return `<svg width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="rgba(255,255,255,.08)" stroke-width="3"/>
    <circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="none" stroke="url(#ciPhGrad)" stroke-width="3" stroke-linecap="round" stroke-dasharray="${c.toFixed(1)}" stroke-dashoffset="${(c * (1 - pct)).toFixed(1)}"/></svg>
    <div class="ci-ph-face"${img ? ` style="background-image:url('${esc(img)}')"` : ''}>${img ? '' : esc(letter)}</div>`;
};

/** The Photos tab, drawn inside the Circle view. */
export function photosPanelHTML() {
  const cfg = ctx.cfg();
  const { tab, list, who } = current();
  const { own, total } = counts();
  const pct = total ? own / total : 0;
  const nP = ctx.poolNow().length, nC = ctx.cast().length;
  const tray = W()._ciTray || [];
  const kinds = who ? slotsOf(who) : [];
  let kind = W()._ciPhotoKind;
  if (!kinds.includes(kind)) kind = kinds.includes('earned') ? 'earned' : kinds[0];
  const cur = who && kind ? photoFor(whoRef(who), kind, cfg) : null;
  const main = who ? photoFor(whoRef(who), who.persona ? 'profile' : (kinds.includes('profile') ? 'profile' : 'real'), cfg) : null;
  const mine = who ? kinds.filter(k => photoFor(whoRef(who), k, cfg).own).length : 0;
  const full = who && kind ? promptForSlot(whoRef(who), kind) : '';
  return `<div class="ci-panel ci-photos">
    <svg width="0" height="0" style="position:absolute"><defs><linearGradient id="ciPhGrad"><stop offset="0" stop-color="#3fd8ff"/><stop offset="1" stop-color="#8b5cff"/></linearGradient>
      <linearGradient id="ciPhLogo" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#ff4fb4"/><stop offset=".5" stop-color="#8b5cff"/><stop offset="1" stop-color="#3fd8ff"/></linearGradient></defs></svg>
    <div class="ci-ph-top">
      <div class="ci-ph-logo"><svg viewBox="0 0 58 58"><circle cx="29" cy="29" r="23" fill="none" stroke="url(#ciPhLogo)" stroke-width="7"/><circle cx="29" cy="6" r="3.2" fill="#fff"/></svg></div>
      <div class="ci-ph-brand"><div class="ci-ph-show">THE CIRCLE</div><div class="ci-ph-title">PHOTOS</div></div>
      <div class="ci-ph-meter">${ring(pct, '', '', 24, 54).replace('<div class="ci-ph-face"></div>', '')}<div class="ci-ph-pct">${Math.round(pct * 100)}%</div></div>
      <div class="ci-ph-stat"><span class="ci-ph-count">${own} of ${total} are yours</span><br>the rest fall back
        <div class="ci-ph-cloud">${hasToken() ? '&#9729; New photos go to the cloud, like the character gallery' : '&#9679; Only in this browser until you back them up'}</div></div>
      <div class="ci-ph-acts"><button type="button" class="ci-btn" data-act="ph-backup">Circle, back up to the cloud</button>
        <button type="button" class="ci-btn" data-act="ph-export">Circle, export the pack</button>
        <label class="ci-btn">Circle, import a pack<input type="file" accept="application/json,.json" data-phimport hidden></label></div>
    </div>
    ${W()._ciAlert ? `<div class="ci-ph-alert"><b>ALERT!</b><span>${esc(W()._ciAlert)}</span></div>` : ''}
    <label class="ci-ph-drop">&#8682; <span>Drop a batch anywhere. <code>sienna-naughty.png</code> finds its own slot; anything else waits in a tray.</span>
      <input type="file" accept="image/*" multiple data-phbatch hidden></label>
    ${tray.length ? `<div class="ci-ph-tray"><span class="ci-k">The tray</span>${tray.map((t, i) =>
      `<button type="button" class="ci-ph-tr${W()._ciTraySel === i ? ' on' : ''}" data-act="ph-tray" data-v="${i}" title="${esc(t.name)}" style="background-image:url('${esc(photoSrc(`photo:${t.id}`) || '')}')"></button>`).join('')}
      <span class="ci-small">${W()._ciTraySel != null ? 'Now pick the slot it belongs in.' : 'Pick one, then pick its slot.'}</span></div>` : ''}
    <div class="ci-ph-tabs"><button type="button" data-act="ph-tab" data-v="personas" class="${tab === 'personas' ? 'on' : ''}">Personas<span>${nP}</span></button>
      <button type="button" data-act="ph-tab" data-v="players" class="${tab === 'players' ? 'on' : ''}">Players<span>${nC}</span></button><i class="ci-ph-ind ${tab}"></i></div>
    <div class="ci-ph-rail">${list.map(w => {
      const ks = slotsOf(w); const n = ks.filter(k => photoFor(whoRef(w), k, cfg).own).length;
      const face = photoFor(whoRef(w), w.persona ? 'profile' : (ks.includes('profile') ? 'profile' : 'real'), cfg).face;
      return `<button type="button" class="ci-ph-who${who && w.key === who.key ? ' on' : ''}" data-act="ph-who" data-v="${esc(w.key)}">
        <div class="ci-ph-ring">${ring(ks.length ? n / ks.length : 0, url(face), w.name[0])}</div><div class="ci-ph-wn">${esc(w.name)}</div><div class="ci-ph-wc">${n}/${ks.length}</div></button>`;
    }).join('') || '<div class="ci-small">Nobody here yet.</div>'}</div>
    ${who ? `<div class="ci-ph-stage">
      <div class="ci-ph-card"><span class="ci-ph-pill">${who.persona ? 'PERSONA' : 'PLAYER'}</span>
        <div class="ci-ph-pic ${who.persona ? 'pk' : 'cy'}"${url(main?.face) ? ` style="background-image:url('${esc(url(main.face))}')"` : ''}>${url(main?.face) ? '' : esc(who.name[0])}</div>
        <div class="ci-ph-nm">${esc(who.name)}</div><div class="ci-ph-mt">${esc(metaOf(who))}</div>
        <div class="ci-ph-cst">${mine} of ${kinds.length} photos are yours</div></div>
      <div class="ci-ph-grid">${kinds.map((k, i) => {
        const r = photoFor(whoRef(who), k, cfg); const img = url(r.face);
        const st = r.own ? 'mine' : img ? 'fb' : 'empty';
        return `<button type="button" class="ci-ph-slot ${st}${k === kind ? ' sel' : ''}" data-act="ph-slot" data-v="${k}" style="animation-delay:${i * 0.05}s${img ? `;background-image:url('${esc(img)}')` : ''}">
          <span class="ci-ph-st">${r.own ? 'YOURS' : img ? 'FALLS BACK' : 'EMPTY'}</span><span class="ci-ph-lb">${KIND_LABEL[k]}</span></button>`;
      }).join('')}
        <div class="ci-ph-console"><div class="ci-ph-h"><i></i>THE CIRCLE IS LISTENING · ${esc(who.name.toUpperCase())} · ${esc(KIND_LABEL[kind].toUpperCase())}</div>
          <div class="ci-ph-cmd"><em>Circle,</em> upload ${esc(who.name)}'s ${esc(KIND_LABEL[kind].toLowerCase())}…</div>
          <div class="ci-ph-when">${esc(KIND_WHEN[kind])}</div>
          <div class="ci-ph-txt" data-full="${esc(full)}"></div>
          <div class="ci-ph-row"><button type="button" class="ci-btn" data-act="ph-copy">Circle, copy the prompt</button>
            <label class="ci-btn">Circle, send it<input type="file" accept="image/*" data-phslot hidden></label>
            ${cur?.own ? '<button type="button" class="ci-btn ci-btn-pk" data-act="ph-del">Circle, delete it</button>' : ''}</div></div>
      </div></div>` : ''}
  </div>`;
}

/** After drawing: type the prompt out (at once for anyone asking for less motion). */
export function afterPhotosRender(root) {
  const el = root.querySelector('.ci-ph-txt');
  if (!el) return;
  const full = el.dataset.full || '';
  clearInterval(W()._ciTyping);
  const still = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (still || typeof setInterval !== 'function') { el.textContent = full; return; }
  let i = 0; el.textContent = '';
  W()._ciTyping = setInterval(() => { el.textContent = full.slice(0, (i += 2)); if (i >= full.length) clearInterval(W()._ciTyping); }, 14);
  // images not loaded yet: draw again when they arrive
  const faces = [...ctx.poolNow().flatMap(p => [p.face, ...Object.values(p.photos || {})]),
    ...Object.values(ctx.cfg().ciPhotos || {}).flatMap(s => Object.values(s || {})), ...(W()._ciTray || []).map(t => `photo:${t.id}`)]
    .filter(f => String(f || '').startsWith('photo:') && !cachedPhoto(f));
  if (faces.length) Promise.all(faces.map(photoURL)).then(u => { if (u.some(Boolean)) ctx.done(false); });
}

// ── Changes ────────────────────────────────────────────────────────────
/** Put a kept image in a slot: a persona's in the pool, a player's in ciPhotos. */
export function ciSetSlotPhoto(who, kind, photoId) {
  const face = photoId ? `photo:${photoId}` : null;
  if (who.persona) {
    const p = ctx.ownPool().find(x => x.id === who.persona);
    if (!p) return;
    if (kind === 'profile') p.face = face;
    else { p.photos ||= {}; if (face) p.photos[kind] = face; else delete p.photos[kind]; }
  } else {
    const c = ctx.cfg();
    const set = ((c.ciPhotos ||= {})[who.player] ||= {});
    if (face) set[kind] = face; else delete set[kind];
  }
  ctx.done();
}
const refOf = w => (w.persona ? { persona: w.persona.id } : { player: w.player });

/** Files dropped or picked for a batch: `{ name, dataUrl }` each. */
export async function ciDropFiles(files) {
  let placed = 0;
  for (const f of files) {
    const id = await putPhoto(f.dataUrl);
    const to = parseDrop(f.name, people());
    if (to) {
      const w = to.persona ? { persona: to.persona } : { player: to.player };
      silently(() => ciSetSlotPhoto(w, to.kind, id));
      placed++;
    } else (W()._ciTray ||= []).push({ id, name: f.name });
  }
  const left = (W()._ciTray || []).length;
  W()._ciAlert = `${placed} photo${placed === 1 ? '' : 's'} found ${placed === 1 ? 'its slot' : 'their slots'}.${left ? ` ${left} ${left === 1 ? 'is' : 'are'} waiting in the tray.` : ''}`;
  ctx.done();
}
function silently(fn) { const d = ctx.done; ctx.done = () => {}; try { fn(); } finally { ctx.done = d; } }

export async function ciExportPack() {
  // Only images this browser holds go in the file; one it has only in the
  // cloud is read from there by whoever imports the pack.
  const pack = await packPhotos(ctx.cfg(), async id => { const u = await photoURL(`photo:${id}`); return u?.startsWith('data:') ? u : null; });
  try {
    if (typeof URL?.createObjectURL === 'function') {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([JSON.stringify(pack)], { type: 'application/json' }));
      a.download = `circle-photos-${(ctx.cfg().name || 'season').replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.json`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    }
  } catch { /* the pack is still returned */ }
  return pack;
}

export async function ciImportPack(raw) {
  const got = await unpackPhotos(raw);
  for (const [id, dataUrl] of Object.entries(got.images)) await putPhotoWithId(id, dataUrl);
  const c = ctx.cfg();
  if (got.ciPool) c.ciPool = got.ciPool;
  c.ciPhotos = { ...(c.ciPhotos || {}), ...got.ciPhotos };
  const n = Object.keys(got.images).length;
  W()._ciAlert = `The pack is in: ${n} photo${n === 1 ? '' : 's'}.`;
  ctx.done();
}

/** A click inside the Photos tab. Returns true if it was ours. */
export function onPhotosClick(b) {
  const act = b.dataset.act, v = b.dataset.v;
  if (!act?.startsWith('ph-')) return false;
  const { who } = current();
  if (act === 'ph-tab') { W()._ciPhotoTab = v; W()._ciPhotoWho = null; }
  else if (act === 'ph-who') W()._ciPhotoWho = v;
  else if (act === 'ph-tray') W()._ciTraySel = W()._ciTraySel === Number(v) ? null : Number(v);
  else if (act === 'ph-slot') {
    W()._ciPhotoKind = v;
    const sel = W()._ciTraySel;
    if (sel != null && who && W()._ciTray?.[sel]) {
      const [t] = W()._ciTray.splice(sel, 1);
      W()._ciTraySel = null;
      ciSetSlotPhoto(refOf(who), v, t.id);
      return true;
    }
  } else if (act === 'ph-del' && who) { ciSetSlotPhoto(refOf(who), W()._ciPhotoKind || 'earned', null); return true; }
  else if (act === 'ph-copy' && who) {
    const txt = document.querySelector('.ci-ph-txt')?.dataset.full;
    try { navigator.clipboard?.writeText(txt); } catch { /* no clipboard */ }
    return true;
  } else if (act === 'ph-export') { ciExportPack(); return true; }
  else if (act === 'ph-backup') { ciBackUpPhotos(); return true; }
  ctx.done(false);
  return true;
}

const readFile = file => shrinkImage(file, 512, true).then(dataUrl => ({ name: file.name, dataUrl }));

/** A change inside the Photos tab (the file inputs). Returns true if ours. */
export function onPhotosChange(el) {
  if (el.dataset.phbatch != null) { Promise.all([...el.files].map(readFile)).then(ciDropFiles); return true; }
  if (el.dataset.phslot != null) {
    const { who } = current(); const kind = W()._ciPhotoKind || (who ? slotsOf(who)[0] : null);
    const file = el.files?.[0];
    if (file && who) readFile(file).then(f => putPhoto(f.dataUrl)).then(id => ciSetSlotPhoto(refOf(who), kind, id));
    return true;
  }
  if (el.dataset.phimport != null) {
    const file = el.files?.[0];
    if (file) file.text().then(t => ciImportPack(JSON.parse(t))).catch(e => { W()._ciAlert = e.message || 'That file could not be read.'; ctx.done(false); });
    return true;
  }
  return false;
}

/** A batch dropped anywhere on the Photos tab. */
export function onPhotosDrop(files) {
  const imgs = [...files].filter(f => /^image\//.test(f.type) || /\.(png|jpe?g|webp|gif)$/i.test(f.name));
  if (imgs.length) Promise.all(imgs.map(readFile)).then(ciDropFiles);
}

const hasToken = () => { try { return !!localStorage.getItem('studio_api_token'); } catch { return false; } };
/** Every photo the season names: the pool's and the players'. */
function allFaces() {
  const c = ctx.cfg();
  return [...ctx.poolNow().flatMap(p => [p.face, ...Object.values(p.photos || {})]),
    ...Object.values(c.ciPhotos || {}).flatMap(s => Object.values(s || {}))].filter(Boolean);
}
/** Back up to the cloud, asking for the studio token the way the character
 *  gallery does (player.html) and remembering it on this device. */
export async function ciBackUpPhotos() {
  let token = '';
  try { token = localStorage.getItem('studio_api_token') || ''; } catch { /* private mode */ }
  if (!token && typeof prompt === 'function') {
    token = (prompt('Paste your studio token to back up the catfish photos. It is the same token the gallery and the Casting Studio use, and it is remembered on this device.') || '').trim();
    if (token) { try { localStorage.setItem('studio_api_token', token); } catch { /* this session only */ } }
  }
  if (!token) return;
  try {
    const r = await backUpPhotos(allFaces(), token);
    W()._ciAlert = `${r.uploaded} photo${r.uploaded === 1 ? '' : 's'} backed up to the cloud${r.already ? `, ${r.already} already there` : ''}.${r.failed ? ` ${r.failed} could not be sent: this browser does not have ${r.failed === 1 ? 'it' : 'them'}.` : ''}`;
  } catch (e) { W()._ciAlert = `The cloud said no: ${e.message}`; }
  ctx.done(false);
}

if (typeof window !== 'undefined') Object.assign(window, { ciSetSlotPhoto, ciDropFiles, ciExportPack, ciImportPack, ciBackUpPhotos });
export { KINDS };
