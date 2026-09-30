// ══════════════════════════════════════════════════════════════════════
// ci-cast-ui.js — the Circle view in the Casting Room (Plan 4 Tasks 6-7)
// ══════════════════════════════════════════════════════════════════════
//
// Mockup v3, approved 2026-09-30. Two panels:
//
//   THE PROFILE PLAN — a row per player: every field optional, each one a pin
//   the engine reads (seasonConfig.ciSetup[name]; ci/profiles.js truthOf).
//   Blank is decided when the season is dealt; once it is, the row shows what
//   the draw gave (gs.ci.dealt). No preview — the villa's way (user: "do what
//   the other simulators are doing").
//
//   THE CATFISH POOL — a card per persona, and an editor where every field
//   the simulator reads is PICKED (ci/persona-data.js; user: "shouldn't we
//   have dropdowns or categories"). The image is the author's own
//   (ci/photo-store.js). Until the author changes anything, the default pool
//   plays; the first edit makes a copy of it the author's.
//
// One delegated listener per event type, data attributes on every control,
// so a player's name never goes into an inline handler.
import { DEFAULT_POOL } from './ci/default-pool.js';
import { JOBS, JOB_GROUPS, DETAILS, TOPICS, STATUSES, PHOTO, jobOf, tellsOf, bioFor, promptFor } from './ci/persona-data.js';
import { personaStyle } from './ci/cover.js';
import { circleRoles, rosterFactsOf, circleKnownAs } from './ci-run.js';
import { ageFrom } from './ci/profiles.js';
import { fameTerm } from './fame.js';
import { putPhoto, photoURL, cachedPhoto, photoSrc, shrinkImage } from './ci/photo-store.js';
import { playerAvatarUrl } from './players.js';
import { setPhotoContext, photosPanelHTML, afterPhotosRender, onPhotosClick, onPhotosChange, onPhotosDrop } from './ci-photos-ui.js';

const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const cfg = () => window.seasonConfig || {};
const cast = () => (window.players || []).filter(p => p && p.name);
// Reading never writes: drawing the panel must not leave an empty entry per player.
const setupOf = name => cfg().ciSetup?.[name] || {};
const setupFor = name => ((cfg().ciSetup ||= {})[name] ||= {});
const dealt = () => window.gs?.ci?.dealt || null;
const REASONS = ['strategic', 'protective', 'family', 'experimental'];
// Create Character's age, when only a birthdate was given: the engine's own reading.
// Why a player takes a persona, in the words the real players used (spec 4.2).
const REASON_WORDS = {
  strategic: 'Strategic: a different face will get further in this room.',
  protective: 'Protective: so nobody judges them for who they really are.',
  family: 'Family: playing someone from their own life.',
  experimental: 'Experimental: to see how the room treats somebody else.',
};
// A sample message in each register, so the author hears the job they picked.
const SAMPLE = {
  warm: "Hiii everyone!! 🥰 How is everybody's night going? Sending hugs to every apartment 💕",
  hype: "LET'S GOOO 🔥🔥 who's ready for today?? I'm feeling UNSTOPPABLE",
  flirty: "Well hello there 😏 somebody tell me who's been hiding the cute ones",
  formal: "Good morning, everyone. I hope you all slept well. I'm looking forward to getting to know each of you.",
  blunt: "Ok I'll just say it. Somebody in here isn't who they say they are.",
  dry: "cool so we're all just gonna pretend yesterday didn't happen. love that for us",
};

/** The pool the season will play: the author's, or the default. */
const poolNow = () => (Array.isArray(cfg().ciPool) ? cfg().ciPool : DEFAULT_POOL);
/** The author's own pool, copied from the default the first time it changes. */
function ownPool() {
  const c = cfg();
  if (!Array.isArray(c.ciPool)) c.ciPool = DEFAULT_POOL.map(p => JSON.parse(JSON.stringify(p)));
  return c.ciPool;
}
const save = () => { try { window.saveConfig?.(); } catch { /* the page may not have it */ } };

function seg(act, current, options, extra = '') {
  return `<div class="ci-seg">${options.map(([v, label]) =>
    `<button type="button" data-act="${act}" data-v="${esc(v)}" ${extra} class="${String(current ?? '') === String(v) ? 'on' : ''}">${esc(label)}</button>`).join('')}</div>`;
}
function face(url, letter, ring = '') {
  return `<div class="ci-av"${ring ? ` style="--ring:${ring}"` : ''}>${url ? `<img src="${esc(url)}" alt="" loading="lazy" onerror="this.remove()">` : ''}<span>${esc(letter)}</span></div>`;
}

// ── The Profile Plan ───────────────────────────────────────────────────
function drawResult(name) {
  const d = dealt()?.[name];
  if (!d) return `<div class="ci-draw ci-wait"><div class="ci-dk">Waiting for episode 1</div><div class="ci-why">Who plays as someone else is decided when you press Simulate. Anything you set on the left is kept.</div></div>`;
  const s = d.shown || {};
  const line = [s.job, s.hometown].filter(Boolean).join(' · ');
  if (d.mode === 'catfish') {
    const persona = poolNow().find(p => p.id === d.personaId);
    const pinned = setupOf(name).catfish === d.personaId;
    return `<div class="ci-draw ci-cat">${face(photoSrc(persona?.face), (s.name || '?')[0], 'var(--ci-pk)')}<div>
      <div class="ci-dk">Plays as${pinned ? ' <span class="ci-pin">Pinned</span>' : ''}</div><div class="ci-dn">${esc(s.name)}, ${esc(s.age)}</div>
      <div class="ci-dm">${esc(line)}</div><div class="ci-why">${esc(REASON_WORDS[d.reason] || '')}</div></div></div>`;
  }
  const label = { edited: 'Edited', polished: 'Polished', honest: 'Themselves', shared: 'Shares a profile' }[d.mode] || d.mode;
  const why = d.mode === 'edited' ? `Keeps the face, changes: ${d.edits.join(', ')}.`
    : d.mode === 'shared' ? `With ${d.with.join(', ')}.`
      : d.mode === 'polished' ? 'Plays as themselves, on their best behavior.' : 'Plays as themselves, as they are.';
  return `<div class="ci-draw ci-self">${face(safeAvatar(name), name[0])}<div><div class="ci-dk">${esc(label)}</div>
    <div class="ci-dn">${esc(s.name)}, ${esc(s.age)}</div><div class="ci-dm">${esc(line)}</div><div class="ci-why">${esc(why)}</div></div></div>`;
}
function safeAvatar(name) {
  try { return playerAvatarUrl(cast().find(p => p.name === name) || name); } catch { return ''; }
}

const REP_WORDS = { none: 'nobody has seen them before', known: 'known from TV', threat: 'a big threat', villain: 'known as a villain', celebrity: 'a celebrity' };
const REP_LABEL = { none: 'Nobody', known: 'Known', threat: 'A big threat', villain: 'A villain', celebrity: 'A celebrity' };
// Stars as the rest of the site draws them: whole stars, a half, then a name.
const starsText = n => (n > 0 ? `${'★'.repeat(Math.floor(n))}${n % 1 ? '½' : ''} ${fameTerm(n)}` : '');
function planRow(p, autoRole, auto = { rep: 'none', stars: null }) {
  const autoRep = auto?.rep || 'none';
  const s = setupOf(p.name);
  // Plays as someone else: Decide / Yes / No. An older saved pin named a
  // persona in `catfish`; it reads as Yes with that persona.
  const legacy = s.catfish && !['never', 'always'].includes(s.catfish) ? s.catfish : null;
  const cf = legacy ? 'always' : s.catfish || '';
  const pick = s.persona ?? legacy ?? '';
  // Create Character's facts: on the roster, not on the cast copy.
  const rf = { ...rosterFactsOf(p), ...Object.fromEntries(['age', 'birthdate', 'occupation', 'hometown'].filter(k => p[k] != null && p[k] !== '').map(k => [k, p[k]])) };
  const personas = poolNow();
  const others = cast().filter(x => x.name !== p.name);
  return `<div class="ci-row" data-name="${esc(p.name)}">
    <div class="ci-who">${face(safeAvatar(p), p.name[0])}<div>
      <div class="ci-nm">${esc(p.name)}</div><div class="ci-meta">${esc(p.archetype || '')}${p.age ? ` · ${esc(p.age)}` : ''}</div>
      ${seg('role', s.role || '', [['starter', 'Day 1'], ['newcomer', 'Newcomer'], ['', `Decide (${autoRole === 'starter' ? 'Day 1' : 'later'})`]])}</div></div>
    <div class="ci-mid">
      <div class="ci-grp">Who they play</div>
      <label class="ci-fld"><span class="ci-k">Plays as someone else</span>
        ${seg('catfish', cf, [['', 'Decide'], ['always', 'Yes'], ['never', 'No']])}
        ${cf === 'never' ? '' : `<select class="ci-in" data-field="persona" title="${cf === 'always' ? 'Who they play' : 'If they do, who they play'}"><option value="">${cf === 'always' ? 'Whichever fits best' : 'If they do: whichever fits best'}</option>${personas.map(x =>
          `<option value="${esc(x.id)}"${pick === x.id ? ' selected' : ''}>As ${esc(x.handle)}, ${esc(x.age)}</option>`).join('')}</select>`}</label>
      <label class="ci-fld"><span class="ci-k">If they play themselves</span>
        ${seg('mode', s.mode || '', [['', 'Decide'], ['honest', 'Honest'], ['polished', 'Polished'], ['edited', 'Edited']])}</label>
      <div class="ci-grp">Their real life <em>grey = from Create Character</em></div>
      <label class="ci-fld"><span class="ci-k">Age · job</span><div class="ci-pair">
        <input class="ci-in ci-age" data-field="age" type="number" min="18" max="90" placeholder="${esc(rf.age ?? ageFrom(rf.birthdate) ?? '')}" value="${esc(s.age ?? '')}" title="From Create Character unless you type one">
        <input class="ci-in" data-field="job" placeholder="${esc(rf.occupation || 'their real job')}" value="${esc(s.job ?? '')}" title="From Create Character unless you type one"></div></label>
      <label class="ci-fld"><span class="ci-k">The job would cost them here</span>
        ${seg('jobCost', s.jobCost ?? 0, [[0, 'No'], [0.5, 'A little'], [1, 'A lot']])}</label>
      <label class="ci-fld"><span class="ci-k">Status · hometown</span><div class="ci-pair">
        <select class="ci-in" data-field="status">${STATUSES.map(x => `<option${(s.status || 'Single') === x ? ' selected' : ''}>${esc(x)}</option>`).join('')}</select>
        <input class="ci-in" data-field="hometown" placeholder="${esc(rf.hometown || 'hometown')}" value="${esc(s.hometown ?? '')}" title="From Create Character unless you type one"></div></label>
      <div class="ci-grp">Fame &amp; company</div>
      <label class="ci-fld ci-wide"><span class="ci-k">Already famous?</span>
        ${seg('rep', s.rep || '', [['', 'Auto'], ...Object.entries(REP_LABEL)])}
        <span class="ci-small ci-rep-auto">${s.rep ? 'How the room might already know them. The more famous, the more reason to hide behind a persona.'
          : autoRep === 'none' ? 'Auto: a first-timer, so nobody has seen them before. The more famous, the more reason to hide behind a persona.'
            : `Auto: ${REP_WORDS[autoRep]}${auto?.stars > 0 ? ` (${starsText(auto.stars)})` : ''}, from their fame and past seasons. The more famous, the more reason to hide behind a persona.`}</span></label>
      <label class="ci-fld"><span class="ci-k">Shares an apartment with</span>
        <select class="ci-in" data-field="partner"><option value="">nobody</option>${others.map(o =>
          `<option value="${esc(o.name)}"${s.partner === o.name ? ' selected' : ''}>${esc(o.name)}</option>`).join('')}</select></label>
    </div>
    ${drawResult(p.name)}
  </div>`;
}

// ── One player at a time (user: "a tab switcher in the Profile Plan too") ──
// Tabs for everyone / Day 1 / newcomers, a row of faces whose badges say the
// state at a glance (what is pinned; after the deal, what they got), one
// player's card, and "Everyone at a glance" for the whole cast in a table.
const PIN_KEYS = ['role', 'catfish', 'persona', 'mode', 'age', 'job', 'jobCost', 'status', 'hometown', 'rep', 'partner'];
const pinsOf = name => PIN_KEYS.filter(k => { const v = setupOf(name)[k]; return v != null && v !== '' && !(k === 'jobCost' && !v); }).length;
function badgeOf(name) {
  const d = dealt()?.[name];
  if (d) return d.mode === 'catfish' ? ['cat', `as ${d.shown?.name}`] : d.mode === 'edited' ? ['edit', 'edited'] : ['self', 'themselves'];
  const n = pinsOf(name);
  return n ? ['pin', `${n} pinned`] : ['auto', 'Auto'];
}
const CAT_WORD = { '': 'Decide', always: 'Yes', never: 'No' };
function overviewHTML(list, roleOf, known) {
  return `<table class="ci-ov"><thead><tr><th>Player</th><th>Arrives</th><th>Plays as someone else</th><th>If themselves</th><th>Already famous?</th><th>Result</th></tr></thead><tbody>${list.map(p => {
    const s = setupOf(p.name);
    const legacy = s.catfish && !['never', 'always'].includes(s.catfish) ? s.catfish : null;
    const persona = poolNow().find(x => x.id === (s.persona ?? legacy));
    const [cls, word] = badgeOf(p.name);
    return `<tr data-act="plan-who" data-v="${esc(p.name)}"><td>${face(safeAvatar(p), p.name[0])}<b>${esc(p.name)}</b></td>
      <td>${roleOf(p) === 'starter' ? 'Day 1' : 'Later'}${s.role ? '' : ' <i>auto</i>'}</td>
      <td>${esc(legacy ? 'Yes' : CAT_WORD[s.catfish || ''])}${persona ? ` · as ${esc(persona.handle)}` : ''}</td>
      <td>${esc(s.mode ? s.mode[0].toUpperCase() + s.mode.slice(1) : 'Decide')}</td>
      <td>${esc(s.rep ? REP_LABEL[s.rep] : `Auto · ${REP_LABEL[known[p.name]?.rep || 'none']}${known[p.name]?.stars > 0 ? ` · ${starsText(known[p.name].stars)}` : ''}`)}</td>
      <td><span class="ci-badge ${cls}">${esc(word)}</span></td></tr>`;
  }).join('')}</tbody></table>`;
}
function planPanel(players, roles, known) {
  if (!players.length) return '<div class="ci-small">Add players to the cast first.</div>';
  const roleOf = p => setupOf(p.name).role || roles[players.indexOf(p)];
  const tab = ['starter', 'newcomer'].includes(window._ciPlanTab) ? window._ciPlanTab : 'all';
  const list = players.filter(p => tab === 'all' || roleOf(p) === tab);
  const counts = { all: players.length, starter: players.filter(p => roleOf(p) === 'starter').length };
  counts.newcomer = players.length - counts.starter;
  const who = list.find(p => p.name === window._ciPlanWho) || list[0];
  const over = !!window._ciPlanOverview;
  return `<div class="ci-plan-bar">
      <div class="ci-ph-tabs ci-tabs3">${[['all', 'Everyone'], ['starter', 'Day 1'], ['newcomer', 'Newcomers']].map(([k, l]) =>
        `<button type="button" data-act="plan-tab" data-v="${k}" class="${k === tab ? 'on' : ''}">${l}<span>${counts[k]}</span></button>`).join('')}<i class="ci-ph-ind ${tab}"></i></div>
      <button type="button" class="ci-btn${over ? ' on' : ''}" data-act="plan-overview">${over ? 'Back to one at a time' : 'Everyone at a glance'}</button></div>
    ${over ? overviewHTML(list, roleOf, known) : `<div class="ci-ph-rail">${list.map(p => {
      const [cls, word] = badgeOf(p.name);
      return `<button type="button" class="ci-ph-who${who && p.name === who.name ? ' on' : ''}" data-act="plan-who" data-v="${esc(p.name)}">
        <div class="ci-ph-ring ci-ring-${cls}"><div class="ci-ph-face"${safeAvatar(p) ? ` style="background-image:url('${esc(safeAvatar(p))}')"` : ''}>${safeAvatar(p) ? '' : esc(p.name[0])}</div></div>
        <div class="ci-ph-wn">${esc(p.name)}</div><div class="ci-badge ${cls}">${esc(word)}</div></button>`;
    }).join('') || '<div class="ci-small">Nobody here.</div>'}</div>
    ${who ? `<div class="ci-rows ci-one">${planRow(who, roles[players.indexOf(who)], known[who.name])}</div>` : ''}`}`;
}

// ── The Catfish Pool ───────────────────────────────────────────────────
function takenBy() {
  const out = {};
  for (const [name, d] of Object.entries(dealt() || {})) if (d.personaId) out[d.personaId] = name;
  return out;
}
function slot(persona) {
  const url = photoSrc(persona.face);
  return `<label class="ci-slot${url ? ' has' : ''}"${url ? ` style="background-image:url('${esc(url)}')"` : ''}>
    <input type="file" accept="image/*" data-photo="${esc(persona.id)}" hidden>${url ? '' : 'Drop your image<br>or click'}</label>`;
}
function poolCard(p, taken) {
  const t = taken[p.id];
  const job = jobOf(p);
  return `<div class="ci-pc" data-id="${esc(p.id)}">
    <span class="ci-tag ${t ? 'taken' : dealt() ? 'stock' : 'wait'}">${esc(t || (dealt() ? 'STOCK' : ''))}</span>
    ${slot(p)}
    <div class="ci-handle">${esc(p.handle)}</div>
    <div class="ci-hm">${esc(p.age)} · ${esc(p.job || job?.name?.toLowerCase() || '')} · ${esc(p.status || '')}</div>
    <div class="ci-bio">${esc(p.bio || bioFor(p))}</div>
    <div class="ci-chips">${REASONS.map(r => `<span class="ci-chip${(p.reasons || []).includes(r) ? ' on' : ''}">${r}</span>`).join('')}</div>
    <div class="ci-tells">Gets caught on: <b>${esc(tellsOf(p).map(t2 => TOPICS[t2]?.label || t2).join(', ') || 'nothing yet')}</b></div>
    <div class="ci-acts"><button type="button" data-act="edit">Edit</button><button type="button" data-act="dup">Duplicate</button><button type="button" data-act="del">Delete</button></div>
  </div>`;
}
function editor(p) {
  const reg = personaStyle(p).register;
  const jobSel = JOB_GROUPS.map(g => `<optgroup label="${esc(g)}">${JOBS.filter(j => j.group === g).map(j =>
    `<option value="${j.id}"${p.jobId === j.id ? ' selected' : ''}>${esc(j.name)}</option>`).join('')}</optgroup>`).join('');
  const pick = (k, label) => `<select class="ci-in" data-pfield="photo.${k}" aria-label="${label}">${PHOTO[k].map(x =>
    `<option value="${x.id}"${p.photo?.[k] === x.id ? ' selected' : ''}>${esc(x.name)}</option>`).join('')}</select>`;
  return `<div class="ci-editor" data-id="${esc(p.id)}">
    <div class="ci-ed-left">${slot(p)}<div class="ci-small">PNG or JPG. Kept in this browser.</div>
      <button type="button" class="ci-btn" data-act="close">Done</button></div>
    <div class="ci-eg">
      <label class="ci-fld"><span class="ci-k">Name on the profile</span><input class="ci-in" data-pfield="handle" value="${esc(p.handle)}"></label>
      <label class="ci-fld"><span class="ci-k">Age · presents as</span><div class="ci-pair">
        <input class="ci-in ci-age" type="number" min="18" max="80" data-pfield="age" value="${esc(p.age)}">
        ${seg('gender', p.gender, [['f', 'Woman'], ['m', 'Man']])}</div></label>
      <label class="ci-fld"><span class="ci-k">Into</span>${seg('sexuality', p.sexuality || 'straight', [['straight', p.gender === 'm' ? 'Women' : 'Men'], ['gay', p.gender === 'm' ? 'Men' : 'Women'], ['bi', 'Both']])}
        <span class="ci-small">What the profile says. Who the player behind it is really into stays theirs: a catfish flirts in character, and that is an act.</span></label>
      <label class="ci-fld"><span class="ci-k">Job</span><select class="ci-in" data-pfield="jobId">${jobSel}</select></label>
      <label class="ci-fld"><span class="ci-k">Relationship status</span><select class="ci-in" data-pfield="status">${STATUSES.map(x =>
        `<option${p.status === x ? ' selected' : ''}>${esc(x)}</option>`).join('')}</select></label>
      <div class="ci-fld ci-full"><span class="ci-k">How they type <em>from the job · change it</em></span>
        <div class="ci-types"><span class="ci-reg">${esc(reg.toUpperCase())}</span><span class="ci-bubble">${esc(SAMPLE[reg])}</span>
        ${seg('register', p.register || '', [['', 'From the job'], ...Object.keys(SAMPLE).map(r => [r, r])])}</div></div>
      <div class="ci-fld ci-full"><span class="ci-k">Life details <em>each one is something they can be caught out on</em></span>
        <div class="ci-chips">${DETAILS.map(d => `<button type="button" class="ci-chip${(p.details || []).includes(d.id) ? ' on' : ''}" data-act="detail" data-v="${d.id}">${esc(d.name)}</button>`).join('')}</div></div>
      <div class="ci-fld ci-full"><span class="ci-k">Can get caught on <em>from the job and the details</em></span>
        <div class="ci-small ci-caught">${esc(tellsOf(p).map(t => TOPICS[t]?.label || t).join(' · ') || 'nothing yet')}</div></div>
      <div class="ci-fld ci-full"><span class="ci-k">Who would take it</span>
        <div class="ci-chips">${REASONS.map(r => `<button type="button" class="ci-chip${(p.reasons || []).includes(r) ? ' on' : ''}" data-act="reason" data-v="${r}">${r}</button>`).join('')}</div></div>
      <div class="ci-fld ci-full"><span class="ci-k">Bio <em>${p.bio ? 'yours · <button type="button" class="ci-link" data-act="bio-auto">write it from the picks</button>' : 'written from the picks · edit to make it yours'}</em></span>
        <textarea class="ci-in ci-bio" data-pfield="bio" rows="2">${esc(p.bio || bioFor(p))}</textarea></div>
      <div class="ci-fld ci-full"><span class="ci-k">Photo prompt <em>built from these picks</em></span>
        <div class="ci-pair ci-wrap">${pick('hair', 'Hair')}${pick('style', 'Style')}${pick('setting', 'Setting')}</div>
        <div class="ci-prompt"><span>${esc(promptFor(p))}</span><button type="button" class="ci-link" data-act="copy">copy</button></div></div>
    </div>
  </div>`;
}

export function renderCircleCastSetup() {
  const root = document.getElementById('sec-ci-cast');
  if (!root) return;
  const players = cast();
  const roles = circleRoles(players.map(p => p.name), cfg().ciSetup || {});
  const known = circleKnownAs(players);
  const pool = poolNow();
  const taken = takenBy();
  const d = dealt();
  const takenN = Object.keys(taken).length;
  const editing = pool.find(p => p.id === window._ciEditing);
  const starters = roles.filter(r => r === 'starter').length;
  // Three tabs (user, Plan 4b: "a tab switcher"): the plan, the pool, the photos.
  const sub = ['plan', 'pool', 'photos'].includes(window._ciSub) ? window._ciSub : 'plan';
  const tabsHTML = `<div class="ci-sub">${[['plan', 'Profile Plan'], ['pool', 'Catfish Pool'], ['photos', 'Photos']].map(([k, l]) =>
    `<button type="button" data-act="sub" data-v="${k}" class="${k === sub ? 'on' : ''}">${l}</button>`).join('')}<i class="ci-sub-ind ${sub}"></i></div>`;
  if (sub === 'photos') {
    root.innerHTML = tabsHTML + photosPanelHTML();
    if (!root._ciWired) { wire(root); root._ciWired = true; }
    afterPhotosRender(root);
    return;
  }
  root.innerHTML = tabsHTML + (sub === 'plan' ? `
    <div class="ci-panel">
      <div class="ci-phead"><div class="ci-ring"></div><div class="ci-ptitle">THE PROFILE PLAN</div>
        <div class="ci-pcount">${players.length} players · ${starters} on Day 1 · ${players.length - starters} arrive later · every field optional</div></div>
      ${planPanel(players, roles, known)}
    </div>` : `
    <div class="ci-panel">
      <div class="ci-phead"><div class="ci-ring ci-ring-pk"></div><div class="ci-ptitle">THE CATFISH POOL</div>
        <div class="ci-pcount"><span class="ci-pool-count">${d ? `${takenN} of ${pool.length} taken this season · ${pool.length - takenN} left as twist stock`
          : `${pool.length} persona${pool.length === 1 ? '' : 's'} · who takes one is decided when the season is dealt`}</span>
          ${Array.isArray(cfg().ciPool) ? '<button type="button" class="ci-btn" data-act="default">Default pool</button>' : '<span class="ci-small">the default pool</span>'}
          <button type="button" class="ci-btn ci-btn-pk" data-act="none">No catfish</button></div></div>
      <div class="ci-pool">
        ${pool.map(p => (editing && p.id === editing.id ? editor(p) : poolCard(p, taken))).join('')}
        <button type="button" class="ci-add" data-act="new"><span class="ci-plus">+</span>New persona<span class="ci-small">pick a job, a few details, and add your image</span></button>
      </div>
    </div>`);
  if (!root._ciWired) { wire(root); root._ciWired = true; }
  // Images come from IndexedDB: draw again once any not yet loaded arrive.
  const missing = pool.filter(p => p.face && !cachedPhoto(p.face));
  if (missing.length) Promise.all(missing.map(p => photoURL(p.face))).then(urls => { if (urls.some(Boolean)) renderCircleCastSetup(); });
}

// ── Changes ────────────────────────────────────────────────────────────
function personaIn(el) { const id = el.closest('[data-id]')?.dataset.id; return id ? { id, persona: ownPool().find(p => p.id === id) } : {}; }
const toggle = (list, v) => (list.includes(v) ? list.filter(x => x !== v) : [...list, v]);
let _n = 0;
const newId = () => `ci-p${Date.now().toString(36)}${(++_n).toString(36)}`;

function onClick(ev) {
  const b = ev.target.closest('[data-act]');
  if (!b) return;
  const act = b.dataset.act, v = b.dataset.v;
  if (act === 'sub') { window._ciSub = v; window._ciEditing = null; return renderCircleCastSetup(); }
  if (act === 'plan-tab') { window._ciPlanTab = v; window._ciPlanWho = null; return renderCircleCastSetup(); }
  if (act === 'plan-who') { window._ciPlanWho = v; window._ciPlanOverview = false; return renderCircleCastSetup(); }
  if (act === 'plan-overview') { window._ciPlanOverview = !window._ciPlanOverview; return renderCircleCastSetup(); }
  if (onPhotosClick(b)) return;
  const row = b.closest('.ci-row');
  if (row) {
    const s = setupFor(row.dataset.name);
    // An older pin (a persona id in `catfish`) keeps its persona when the answer changes.
    if (act === 'catfish' && s.catfish && !['never', 'always'].includes(s.catfish)) { s.persona ??= s.catfish; delete s.catfish; }
    if (act === 'jobCost') s.jobCost = Number(v);
    else if (v === '' || v == null) delete s[act];
    else s[act] = v;
    return done();
  }
  const c = cfg();
  if (act === 'default') { delete c.ciPool; window._ciEditing = null; return done(); }
  if (act === 'none') { c.ciPool = []; window._ciEditing = null; clearPins(() => true); return done(); }
  if (act === 'new') {
    const p = { id: newId(), handle: 'New persona', face: null, age: 25, gender: 'f', sexuality: 'straight', jobId: 'college-student', status: 'Single',
      hometown: null, details: [], photo: { hair: 'long-dark', style: 'casual', setting: 'home' }, reasons: ['strategic', 'protective'], bio: null, fits: {} };
    ownPool().push(p); window._ciEditing = p.id; return done();
  }
  if (act === 'close') { window._ciEditing = null; return done(); }
  const { id, persona } = personaIn(b);
  if (!persona) return;
  if (act === 'edit') window._ciEditing = id;
  else if (act === 'dup') { const copy = { ...JSON.parse(JSON.stringify(persona)), id: newId(), handle: `${persona.handle} 2`, face: persona.face }; ownPool().splice(ownPool().indexOf(persona) + 1, 0, copy); }
  else if (act === 'del') { c.ciPool = ownPool().filter(p => p.id !== id); clearPins(pin => pin === id); if (window._ciEditing === id) window._ciEditing = null; }
  else if (act === 'gender') persona.gender = v;
  else if (act === 'sexuality') persona.sexuality = v;
  else if (act === 'register') { if (v) persona.register = v; else delete persona.register; }
  else if (act === 'detail') persona.details = toggle(persona.details || [], v);
  else if (act === 'reason') persona.reasons = toggle(persona.reasons || [], v);
  else if (act === 'bio-auto') persona.bio = null;
  else if (act === 'copy') { try { navigator.clipboard?.writeText(promptFor(persona)); } catch { /* no clipboard */ } return; }
  return done();
}

function onChange(ev) {
  const el = ev.target;
  if (onPhotosChange(el)) return;
  const row = el.closest('.ci-row');
  if (row && el.dataset.field) {
    const s = setupFor(row.dataset.name);
    const f = el.dataset.field, v = el.value;
    if (v === '') delete s[f];
    else s[f] = f === 'age' ? Number(v) : v;
    return done();
  }
  if (el.dataset.photo) {
    const file = el.files?.[0];
    if (file) shrinkImage(file).then(putPhoto).then(pid => window.ciSetPersonaPhoto(el.dataset.photo, pid));
    return;
  }
  if (!el.dataset.pfield) return;
  const { persona } = personaIn(el);
  if (!persona) return;
  const f = el.dataset.pfield, v = el.value;
  if (f.startsWith('photo.')) (persona.photo ||= {})[f.slice(6)] = v;
  else if (f === 'age') persona.age = Number(v) || persona.age;
  else if (f === 'bio') persona.bio = v.trim() && v.trim() !== bioFor(persona) ? v.trim() : null;
  else if (f === 'jobId') { persona.jobId = v; delete persona.job; }
  else persona[f] = v;
  done();
}

/** A pin to a persona that is gone would be ignored by the engine: clear it. */
function clearPins(match) {
  for (const s of Object.values(cfg().ciSetup || {})) {
    if (s.catfish && !['never', 'always'].includes(s.catfish) && match(s.catfish)) delete s.catfish;
    if (s.persona && match(s.persona)) delete s.persona;
  }
}

function done(persist = true) { if (persist) save(); renderCircleCastSetup(); }

setPhotoContext({ cfg, ownPool, poolNow, cast, dealt, avatar: safeAvatar, done: persist => done(persist) });

function wire(root) {
  root.addEventListener('click', onClick);
  root.addEventListener('change', onChange);
  // Drop an image straight onto a persona's slot.
  root.addEventListener('dragover', e => { if (e.target.closest('.ci-slot')) e.preventDefault(); });
  root.addEventListener('dragover', e => { if (e.target.closest('.ci-photos')) e.preventDefault(); });
  root.addEventListener('drop', e => {
    // A batch dropped anywhere on the Photos tab sorts itself (ci-photos-ui.js).
    if (e.target.closest('.ci-photos')) { e.preventDefault(); onPhotosDrop(e.dataTransfer?.files || []); return; }
    const s = e.target.closest('.ci-slot'); const file = e.dataTransfer?.files?.[0];
    if (!s || !file) return;
    e.preventDefault();
    const id = s.querySelector('[data-photo]')?.dataset.photo;
    shrinkImage(file).then(putPhoto).then(pid => window.ciSetPersonaPhoto(id, pid));
  });
}

/** Put a kept image on a persona (the file input, a drop, and tests). */
export function ciSetPersonaPhoto(personaId, photoId) {
  const p = ownPool().find(x => x.id === personaId);
  if (!p) return;
  p.face = `photo:${photoId}`;
  done();
}

if (typeof window !== 'undefined') { window.renderCircleCastSetup = renderCircleCastSetup; window.ciSetPersonaPhoto = ciSetPersonaPhoto; }
