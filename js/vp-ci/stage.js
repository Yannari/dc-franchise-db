// ══════════════════════════════════════════════════════════════════════
// vp-ci/stage.js — the Circle stage, drawn for step N (Plan 5)
// ══════════════════════════════════════════════════════════════════════
//
// DETERMINISTIC: the whole stage is drawn from the steps up to `idx`, so going
// back, jumping and revealing all draw the same picture. Only the newest step
// animates (`fresh`): a message springs in, a dictation types into the TV and
// fires, a line of dialogue rises. Motion carries the story (the user's rule
// after the Traitors stages): the camera is where the speaker is, the room
// cuts with a colour wipe, the send beam leaves one apartment and the other
// TV pings.
//
// THREE STAGES (vp-ci/steps.js stageOf):
//   apt   — the apartments: the real player on the cam card, the room built
//           from them, the TV running the Circle with the chat on it, the
//           SAYS ALOUD / TO THE CIRCLE box.
//   ui    — the Circle itself, full screen: the feed, the people grid, the
//           input bar; a player speaking aloud appears picture-in-picture.
//   alert — ALERT! with the aurora drawing itself, the shockwave, the flash,
//           and the building lighting up apartment by apartment.
//
// A catfish is two people on this stage: the TV and the feed show the
// PERSONA (its name, its photo); the cam card shows who is really typing.
import { teaserStage } from './teaser-stage.js';
import { webStage } from './web-stage.js';
import { faceOf } from './steps.js';
import { esc, hashify, faceUrl, ringOf, nameOf, realOf, isCatfish, bg, ringBg, avatar, THEMES, themeFor, aptNo,
  captionHtml, profileCard, starsText, facts } from './parts.js';
import { MOMENTS } from './moments.js';
import { PARTY_THEMES } from '../ci/games-data.js';

export { faceUrl, themeFor, starsText };


// ── where we are (user: "I don't know if they're in their private profile or
// in the chat"): a label in the corner of every screen, and in the apartments
// a chat window that stays on screen with the thread so far.
const CHATWIN = new Set(['group-chat', 'welcome', 'chat', 'date', 'plead', 'joker-chat', 'after-party']);
const WHERE = { chat: 'PRIVATE CHAT', date: 'A DATE', plead: 'THE LAST TWO', 'joker-chat': 'THE JOKER', 'after-party': 'THE AFTER-PARTY',
  life: 'IN THE APARTMENT', 'home-video': 'A VIDEO FROM HOME', report: 'AFTER THE VISIT', recognise: 'A FACE THEY KNOW',
  lurk: 'WATCHING IN SECRET', 'hack-undone': 'COMPARING NOTES', 'circle-chat': 'CIRCLE CHAT · EVERYONE', likes: 'THE NEWSFEED',
  status: 'STATUS UPDATES', ratings: 'THE RATINGS', 'final-ratings': 'THE FINAL RATINGS', hangout: 'THE HANGOUT', game: 'A GAME', party: 'THE PARTY' };
function whereLabel(row, screen) {
  // A group chat goes by its alliance's name.
  if (screen.kind === 'group-chat' && screen.d?.name) return `GROUP CHAT · ${String(screen.d.name).toUpperCase()}`;
  // One with no name (a peace talk, a ratings plan) goes by who is in it.
  if (screen.kind === 'group-chat') return `GROUP CHAT · ${screen.cast.map(h => nameOf(row, h)).join(', ')}`;
  const base = WHERE[screen.kind] || String(screen.title || '').toUpperCase();
  if (!CHATWIN.has(screen.kind) || screen.cast.length < 2) return base;
  return `${base} · ${screen.cast.map(h => nameOf(row, h)).join(' ↔ ')}`;
}
const whereHtml = (row, screen) => `<div class="civ-where">${esc(whereLabel(row, screen))}</div>`;
function chatWindow(row, screen, idx, fresh, me = null) {
  const feed = feedHtml(row, screen.steps, idx, fresh, me);
  return `<div class="civ-chatwin"><div class="civ-chatwin-hd">${esc(whereLabel(row, screen))}</div>
    <div class="civ-chatwin-feed">${feed || '<div class="civ-chatwin-empty">No messages yet</div>'}</div></div>`;
}

// ── the Circle UI ──────────────────────────────────────────────────────
const ICONS = { home: 'M12 3l9 8h-3v9h-5v-6h-2v6H6v-9H3z', chat: 'M4 4h16v12H8l-4 4z', bolt: 'M13 2L4 14h6l-1 8 9-12h-6z', me: 'M12 12a4 4 0 100-8 4 4 0 000 8zm-8 9c0-4 4-6 8-6s8 2 8 6z', img: 'M3 5h18v14H3zm3 11h12l-4-5-3 4-2-2z', bars: 'M4 20V10h4v10zm6 0V4h4v16zm6 0v-7h4v7z' };
const PLANE = '<svg viewBox="0 0 24 24"><path d="M2 21l21-9L2 3v7l15 2-15 2z"/></svg>';
const rail = sel => `<div class="civ-rail">${Object.entries(ICONS).map(([k, d]) => `<div class="${k === sel ? 'sel' : ''}"><svg viewBox="0 0 24 24"><path d="${d}"/></svg></div>`).join('')}</div>`;
const MSG = new Set(['send', 'post', 'video']);
function msgHtml(row, st, cls = '', tick = '') {
  const kind = st.part === 'post' ? ' post' : st.part === 'video' ? ' video' : '';
  return `<div class="civ-msg ${cls}" style="--ring:${ringOf(row, st.who)}">${avatar(row, st.who)}<div class="civ-card${kind}"><div class="nm">${esc(nameOf(row, st.who))}</div><div class="tx">${hashify(st.text)}</div>${tick ? `<div class="civ-tick">${tick}</div>` : ''}</div></div>`;
}
function typingHtml(row, h) {
  return `<div class="civ-typing" style="--ring:${ringOf(row, h)}">${avatar(row, h)}<div class="civ-card"><span class="civ-dots"><span></span><span></span><span></span></span></div></div>`;
}
// THE WHOLE THREAD, like a chat (user: "the part of the screen with the chat
// should act like it"). Every message so far, newest at the bottom; the feed
// scrolls (paintStage glides it down to the new one, and the viewer can
// scroll back). `me` is whose screen this is: their own messages sit on the
// right, everybody else's on the left, the way a phone draws a chat. The
// last message they sent says Seen once the other side has answered.
function feedHtml(row, steps, idx, fresh, me = null) {
  const shown = [];
  for (let i = 0; i <= idx; i++) if (MSG.has(steps[i].part) && steps[i].who) shown.push(i);
  const lastMine = me ? [...shown].reverse().find(i => steps[i].who === me) : undefined;
  const seen = lastMine != null && steps.slice(lastMine + 1, idx + 1).some(x => x.who && x.who !== me);
  const body = shown.map(i => {
    const isNew = fresh && i === idx;
    const mine = me && steps[i].who === me;
    const tick = i === lastMine ? (seen ? '✓✓ Seen' : '✓ Delivered') : '';
    // An incoming message is typed first; your own was typed in the bar.
    return (isNew && !mine ? typingHtml(row, steps[i].who) : '') + msgHtml(row, steps[i], `${mine ? 'mine' : ''}${isNew ? (mine ? ' new' : ' new late') : ''}`, tick);
  }).join('');
  return body ? `<div class="civ-thread">${body}</div>` : '';
}
function peopleHtml(row, cast, talking, title) {
  const who = cast.length ? cast : row.ci.active || [];
  return `<div class="civ-people"><div class="hd">${esc(title)}</div>${who.map(h => {
    const url = faceUrl(faceOf(row, h, 'profile'));
    return `<div class="civ-tile${h === talking ? ' talk' : ''}"><div class="ph"${bg(url)}>${url ? '' : esc(nameOf(row, h)[0] || '?')}</div><div class="n">${esc(nameOf(row, h).toUpperCase())}</div></div>`;
  }).join('')}</div>`;
}
const inbar = (text = '', typing = false) => `<div class="civ-inbar"><div class="civ-box${typing ? ' caret' : ''}"${typing ? ` data-type="${esc(text)}"` : ''}>${typing ? '' : esc(text)}</div><div class="civ-send">${PLANE}</div></div>`;
function uiStage(row, screen, idx, fresh) {
  const steps = screen.steps, st = steps[idx] || null;
  const talking = st?.who || null;
  const pip = st && st.who && !MSG.has(st.part) ? (() => {
    const cam = faceUrl(faceOf(row, st.who, 'cam'));
    const label = st.part === 'react' ? 'reacts' : 'says aloud';
    return `<div class="civ-pip${fresh ? ' new' : ''}" style="--glow:${ringOf(row, st.who)}"><div class="cam"${bg(cam)}>${cam ? '' : esc(realOf(row, st.who)[0])}</div>
      <div class="bub"><span class="civ-chip say">${esc(realOf(row, st.who).toUpperCase())} ${label.toUpperCase()}</span>${esc(st.text)}</div></div>`;
  })() : '';
  const cap = st && !st.who ? captionHtml(st, fresh) : '';
  const typingSend = fresh && st?.part === 'send';
  // A party: the lights go down, the theme and the props across the top.
  const party = screen.kind === 'party' && screen.d ? (() => {
    const th = PARTY_THEMES.find(x => x.id === screen.d.theme);
    return `<div class="civ-partybar"><b>${esc((th?.name || 'THE PARTY').toUpperCase())}</b>${(screen.d.props || []).map(x => `<span>${esc(x)}</span>`).join('')}</div>`;
  })() : '';
  return `<div class="civ-layer${party ? ' civ-party' : ''}">${party}<div class="civ-uibg"></div>
    <div class="civ-aurora" style="left:34%;top:-8%;width:60%;aspect-ratio:1"></div><div class="civ-aurora soft" style="left:34%;top:-8%;width:60%;aspect-ratio:1"></div>
    ${rail(screen.kind === 'likes' || screen.kind === 'status' ? 'home' : screen.kind === 'ratings' || screen.kind === 'final-ratings' ? 'bars' : 'chat')}
    <div class="civ-feed">${feedHtml(row, steps, idx, fresh)}</div>
    ${peopleHtml(row, screen.cast, talking, screen.title.toUpperCase())}
    ${inbar(typingSend ? st.text : '', typingSend)}${cap}${pip}${whereHtml(row, screen)}</div>`;
}

// ── the apartments ────────────────────────────────────────────────────
function aptOwner(screen, idx) {
  for (let i = idx; i >= 0; i--) if (screen.steps[i]?.who) return screen.steps[i].who;
  return screen.cast[0] || null;
}
function aptStage(row, screen, idx, fresh) {
  const steps = screen.steps, st = idx >= 0 ? steps[idx] : null;
  const h = aptOwner(screen, Math.max(0, idx));
  if (!h) return uiStage(row, screen, idx, fresh);
  const side = screen.cast.indexOf(h) > 0 ? 'R' : 'L';
  const real = (row.ci.profiles?.[h]?.people || [])[0] || nameOf(row, h);
  const t = themeFor(real);
  const peer = screen.cast.find(x => x !== h) || h;
  const cam = faceUrl(faceOf(row, h, 'cam'));
  const prevOwner = idx > 0 ? aptOwner(screen, idx - 1) : null;
  const cut = fresh && idx > 0 && prevOwner !== h;
  const sending = fresh && st?.part === 'send' && st.who === h;
  // The other TV pings: a message landed from the apartment we just left.
  const ping = cut && steps[idx - 1]?.part === 'send';
  const catfish = isCatfish(row, h) ? `<div class="civ-catfish"><span class="mini"${bg(faceUrl(faceOf(row, h, 'profile')))}></span>Playing as "${esc(nameOf(row, h))}" · catfish</div>` : '';
  const plate = st?.who ? `<div class="civ-plate">${esc(real)}${isCatfish(row, st.who) ? ` <i>· as ${esc(nameOf(row, st.who))}</i>` : ''}</div>` : '';
  const line = !st ? '' : st.part === 'send'
    ? `<div class="civ-line"><span class="civ-chip cmd">TO THE CIRCLE</span><span class="civ-cmd">${esc(st.spoken || `Message: "${st.text}" Send.`)}</span></div>`
    : st.who ? `<div class="civ-line"><span class="civ-chip say">${st.part === 'react' ? 'REACTS' : 'SAYS ALOUD'}</span>${esc(st.text)}</div>`
      : `<div class="civ-line stage">${st.host ? '<b>THE CIRCLE · </b>' : ''}${esc(st.text)}</div>`;
  const tvUi = `<div class="civ-uibg"></div><div class="civ-aurora" style="left:30%;top:-20%;width:70%;aspect-ratio:1"></div>${rail('chat')}
    <div class="civ-feed">${feedHtml(row, steps, sending ? idx - 1 : idx, false, h)}</div>
    ${peopleHtml(row, [peer], null, screen.kind === 'recognise' ? 'PROFILE' : 'CHAT')}${inbar(sending ? st.text : '', sending)}`;
  // A face they know: the TV has their profile open, full screen.
  const tv = screen.kind === 'recognise' && peer !== h ? `<div class="civ-uibg"></div>${profileCard(row, peer, 'PROFILE')}` : tvUi;
  const win = CHATWIN.has(screen.kind);
  return `<div class="civ-layer civ-apt ${side}${win ? ' haswin' : ''}${sending ? ' push sent' : ''}${cut || (fresh && idx === 0) ? ' enter' : ''}">
    <div class="civ-room">
      <div class="civ-wall" style="background:${t.pat ? `${t.pat},` : ''}${t.wall}"></div><div class="civ-dado" style="background:${t.dado}"></div><div class="civ-floor"></div>
      <div class="civ-poster" style="${side === 'L' ? 'left:4%' : 'right:5%'};top:10%;width:17%;height:42%;background:${t.p1}"></div>
      <div class="civ-poster" style="${side === 'L' ? 'right:5%' : 'left:4%'};top:6%;width:15%;height:34%;background:${t.p2}"></div>
      <div class="civ-lamp" style="background:${t.lamp};${side === 'L' ? 'right' : 'left'}:0"></div>
      <div class="civ-tvset" style="--bias:${t.bias}${side === 'R' ? ';left:26%' : ''}">${tv}</div>
      ${ping ? '<div class="civ-ping"></div>' : ''}
      <div class="civ-rim" style="${side === 'L' ? 'left' : 'right'}:0;background:${ringOf(row, h)}"></div>
      <div class="civ-bust ${side}" data-cam="CAM ${aptNo(row, h)} · ${esc(real.toUpperCase())}" style="--glow:${ringOf(row, h)}${cam ? `;background-image:url('${esc(cam)}')` : ''}">${cam ? '' : esc(real[0] || '?')}</div>
    </div>
    <div class="civ-hud"><span>APARTMENT ${aptNo(row, h)} · DAY ${esc(row.day)}</span><span class="lv">Live</span></div>
    ${catfish}<div class="civ-beam"></div>${win ? chatWindow(row, screen, idx, fresh, h) : ''}${whereHtml(row, screen)}
    ${st ? `<div class="civ-dlg${fresh ? ' new' : ''}">${plate}${line}</div>` : ''}
    ${cut ? '<div class="civ-wipe run"></div>' : ''}
  </div>`;
}

// ── ALERT ──────────────────────────────────────────────────────────────
function alertStage(row, screen, idx, fresh) {
  const st = idx >= 0 ? screen.steps[idx] : null;
  const go = fresh && idx === 0;
  const who = row.ci.active || Object.keys(row.ci.profiles || {});
  const building = go ? `<div class="civ-building">${who.slice(0, 12).map((h, i) => {
    const t = themeFor((row.ci.profiles?.[h]?.people || [])[0] || h);
    return `<div class="civ-win" style="background:${t.pat ? `${t.pat},` : ''}${t.wall};animation-delay:${(2.4 + (i % 4) * 0.09 + Math.floor(i / 4) * 0.14).toFixed(2)}s"><div class="tv">ALERT!</div><div class="who">${esc(nameOf(row, h).toUpperCase())}</div></div>`;
  }).join('')}</div>` : '';
  return `<div class="civ-layer civ-alert${go ? ' go' : ''}"><div class="civ-alertbg"></div>
    <div class="civ-aurora big" style="left:50%;top:44%;width:62%;aspect-ratio:1;margin:-31% 0 0 -31%"></div>
    <div class="civ-aurora big soft" style="left:50%;top:44%;width:62%;aspect-ratio:1;margin:-31% 0 0 -31%"></div>
    <div class="civ-shock"></div><div class="civ-alertTxt">ALERT!</div>
    ${st ? `<div class="civ-alertSub${fresh ? ' new' : ''}">${st.who ? `<b>${esc(nameOf(row, st.who))}:</b> ` : ''}${hashify(st.text)}</div>` : ''}
    <div class="civ-flash"></div>${building}<div class="civ-where">ALERT</div></div>`;
}

// ── MEET THE PLAYERS ───────────────────────────────────────────────────
// A player walks in. The viewer is told who they really are (their name, age,
// job, hometown and fame, from Create Character) and what they plan to be,
// and watches the TV build the profile the room will see. A reaction is the
// other side: somebody else's apartment, and on their TV only the PROFILE.
const FAME = { celebrity: 'CELEBRITY', villain: 'KNOWN VILLAIN', threat: 'A BIG THREAT', known: 'SEEN ON TV' };
const REASON_WHY = {
  strategic: 'Strategic: a different face will get further in this room.',
  protective: 'Protective: so nobody judges them for who they really are.',
  family: 'Family: playing someone from their own life.',
  experimental: 'Experimental: to see how the room treats somebody else.',
};
const EDIT_WORDS = { age: 'age', job: 'job', status: 'relationship status' };

function planOf(p) {
  if (p.mode === 'catfish') {
    return { chip: `<span class="civ-planchip cat">CATFISH · Playing as ${esc([p.name, p.age, p.job].filter(x => x != null).join(', '))}</span>`,
      why: REASON_WHY[p.reason] || '' };
  }
  const who = p.people.length > 1 ? 'TWO PLAYERS, ONE PROFILE' : 'PLAYING AS THEMSELVES';
  if (p.mode === 'edited') {
    const changed = (p.edits || []).map(e => EDIT_WORDS[e]).filter(Boolean);
    const why = [changed.length ? `Changed on the profile: ${changed.join(', ')}.` : '',
      (p.edits || []).includes('fame') ? 'Left their TV past off it.' : ''].filter(Boolean).join(' ');
    return { chip: `<span class="civ-planchip edit">${who} · A FEW THINGS CHANGED</span>`, why };
  }
  if (p.mode === 'polished') return { chip: `<span class="civ-planchip">${who} · BEST PHOTOS ONLY</span>`, why: '' };
  return { chip: `<span class="civ-planchip">${who}</span>`, why: '' };
}
function idCard(row, h) {
  const p = row.ci.profiles[h];
  const reals = p.people || [];
  const t = row.ci.cast?.[reals[0]] || {};
  const known = FAME[t.rep];
  const fame = known ? `<div class="civ-fame"><b>${known}</b>${t.stars > 0 ? ` <span class="st">${starsText(t.stars)}</span>` : ''}
    <small>${p.mode === 'catfish' || (p.edits || []).includes('fame') ? 'Hiding it from the room' : 'The room may recognise them'}</small></div>` : '';
  const plan = planOf(p);
  return `<div class="civ-id"><div class="nm">${esc(reals.join(' & ') || nameOf(row, h))}</div>
    <div class="fx">${reals.length > 1 ? '' : facts(t.age, t.job, t.hometown)}</div>${fame}${plan.chip}
    ${plan.why ? `<div class="civ-why">${esc(plan.why)}</div>` : ''}</div>`;
}
function arriveStage(row, screen, idx, fresh) {
  const steps = screen.steps, st = idx >= 0 ? steps[idx] : null;
  const about = st?.about && row.ci.profiles?.[st.about] ? st.about : null;
  const title = screen.kind === 'profiles' ? 'MEET THE PLAYERS' : 'A NEW PLAYER';
  // Who is speaking on this step: the line's speaker, or for a stage
  // direction, the last one who spoke in the same block.
  let speaker = st?.who || null;
  for (let i = idx; !speaker && i >= 0 && steps[i].about === st?.about; i--) { speaker = steps[i].who || null; if (steps[i].entry) break; }
  const react = about && speaker && speaker !== about;
  const build = fresh && st?.entry && about && !react;
  const order = [...new Set(steps.map(x => x.about).filter(Boolean))];
  const introduced = new Set(steps.slice(0, idx + 1).map(x => x.about).filter(Boolean));
  const roll = screen.kind === 'profiles' && order.length > 1 ? `<div class="civ-roll">${order.map(h => {
    const url = faceUrl(faceOf(row, h, 'profile'));
    return `<span class="${introduced.has(h) ? 'on' : ''}${h === about ? ' cur' : ''}" ${ringBg(ringOf(row, h), introduced.has(h) ? url : '')}>${introduced.has(h) && !url ? esc(nameOf(row, h)[0]) : ''}</span>`;
  }).join('')}<b>${introduced.size} / ${order.length}</b></div>` : '';
  const bgl = `<div class="civ-uibg"></div><div class="civ-aurora" style="left:52%;top:-14%;width:56%;aspect-ratio:1"></div><div class="civ-aurora soft" style="left:52%;top:-14%;width:56%;aspect-ratio:1"></div>`;
  const where = `<div class="civ-where">${title}</div>`;
  if (!about) {
    return `<div class="civ-layer civ-arrive rest">${bgl}<div class="civ-arrtitle${fresh && idx === 0 ? ' new' : ''}">${title}<small>${esc(screen.kind === 'profiles' ? `${order.length} strangers · one building · nobody can see anybody` : 'A new Player has entered the Circle')}</small></div>
      ${roll}${where}${st ? captionHtml(st, fresh) : ''}</div>`;
  }
  const cam = faceUrl(faceOf(row, react ? speaker : about, 'cam'));
  const camOf = react ? speaker : about;
  const real = realOf(row, camOf);
  const plate = `<div class="civ-plate">${esc(real)}${react ? ' <i>· sees the new profile</i>' : ''}</div>`;
  const line = !st.who ? `<div class="civ-line stage">${esc(st.text)}</div>`
    : `<div class="civ-line"><span class="civ-chip say">${st.part === 'react' ? 'REACTS' : 'SAYS ALOUD'}</span>${esc(st.text)}</div>`;
  const enter = fresh && st.entry;
  return `<div class="civ-layer civ-arrive${build ? ' build' : ''}${react ? ' react' : ''}${enter ? ' enter' : ''}">${bgl}
    <div class="${react ? 'civ-watch' : 'civ-cam'}" data-cam="CAM ${aptNo(row, camOf)} · ${esc(real.toUpperCase())}" style="--glow:${ringOf(row, camOf)}${cam ? `;background-image:url('${esc(cam)}')` : ''}">${cam ? '' : esc(real[0] || '?')}</div>
    ${react ? `<div class="civ-watchnote">APARTMENT ${aptNo(row, camOf)}<b>${esc(real)}</b>sees a new face on the Circle</div>` : idCard(row, about)}
    <div class="civ-tvframe" style="--bias:${ringOf(row, about)}">${profileCard(row, about, react ? 'A NEW PLAYER' : 'THE PROFILE THE ROOM WILL SEE')}</div>
    ${roll}${where}
    <div class="civ-dlg${fresh ? ' new' : ''}">${plate}${line}</div>
    ${enter && idx > 0 ? '<div class="civ-wipe run"></div>' : ''}</div>`;
}

/** The stage for this screen after step `idx` (-1: at rest, before the first line). */
export function stageInner(row, screen, idx, fresh = false) {
  if (screen.stage === 'teaser') return teaserStage(row, screen, idx, fresh);
  if (screen.stage === 'web') return webStage(row, screen, idx, fresh);
  if (MOMENTS[screen.stage]) return MOMENTS[screen.stage](row, screen, idx, fresh);
  if (screen.stage === 'arrive') return arriveStage(row, screen, idx, fresh);
  if (screen.stage === 'alert') return alertStage(row, screen, idx, fresh);
  if (screen.stage === 'apt') return aptStage(row, screen, idx, fresh);
  return uiStage(row, screen, idx, fresh);
}

/** Draw it, and type any dictated message into its input bar. */
const FEEDS = '.civ-feed, .civ-chatwin-feed';
export function paintStage(el, row, screen, idx, fresh = false) {
  if (!el) return;
  // A chat does not redraw from the top: where each feed was scrolled is
  // kept, then it glides to the newest message.
  const was = [...el.querySelectorAll(FEEDS)].map(f => f.scrollTop);
  el.innerHTML = stageInner(row, screen, idx, fresh);
  const feeds = [...el.querySelectorAll(FEEDS)];
  feeds.forEach((f, i) => {
    if (was[i] != null) f.scrollTop = was[i];
    const glide = () => { try { f.scrollTo({ top: f.scrollHeight, behavior: fresh ? 'smooth' : 'auto' }); } catch { f.scrollTop = f.scrollHeight; } };
    if (typeof requestAnimationFrame === 'function') requestAnimationFrame(glide); else glide();
    // a message that lands late (after its typing dots) grows the feed again
    if (fresh && typeof setTimeout === 'function') setTimeout(() => { if (f.isConnected) glide(); }, 1350);
  });

  const box = el.querySelector('.civ-box[data-type]');
  if (!box) return;
  const text = box.dataset.type;
  const still = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (still || typeof setTimeout !== 'function') { box.textContent = text; box.classList.remove('caret'); return; }
  let i = 0;
  const step = () => {
    if (!box.isConnected) return;
    box.textContent = text.slice(0, ++i);
    if (i < text.length) setTimeout(step, Math.max(8, 1100 / Math.max(1, text.length)));
    else setTimeout(() => { if (box.isConnected) { box.textContent = ''; box.classList.remove('caret'); } }, 250);
  };
  step();
}
