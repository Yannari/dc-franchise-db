// ══════════════════════════════════════════════════════════════════════
// vp-ci/moments.js — the big moments, each on its own set (Plan 5, spec 18.3)
// ══════════════════════════════════════════════════════════════════════
//
// DETERMINISTIC like the rest of the stage: step N draws the same picture
// however you got there, and only the newest step animates. Nothing is drawn
// before its line: a ranking slot fills when the voter names it, a place on
// the board when its result is read, BLOCKED when the name is sent.
//
//   rate    — the Ratings: each voter's ranking screen, then the board read
//             from the bottom, the Influencers crowned.
//   hangout — two (or three) Influencers face to face on screens, the names
//             at risk between them, each one kept or cut as they talk.
//   blocked — the waiting, the dots, the name typed, BLOCKED on the tile.
//   room    — a real room: the hallway and the door for a visit (the only
//             time two players share a frame), the finale lounge for the meet.
//   video   — the goodbye video on the TV, the real face behind the profile.
//   studio  — the finale: the couch, the board from last place to the winner.
import { faceOf } from './steps.js';
import { esc, hashify, faceUrl, ringOf, nameOf, realOf, isCatfish, bg, aptNo, captionHtml, dlg, cam, tile, where, upTo, speakerAt, bgUi } from './parts.js';
import { gameStage } from './boards.js';

// ── THE RATINGS ────────────────────────────────────────────────────────
const RESULT = /^result\./;
function rateStage(row, screen, idx, fresh) {
  const d = screen.d || { ballots: [], results: [], influencers: [] };
  const final = screen.kind === 'final-ratings';
  const seen = upTo(screen, idx);
  const st = idx >= 0 ? screen.steps[idx] : null;
  const revealing = !final && seen.some(x => x.key === 'ratings.wait' || RESULT.test(x.key || '') || x.key === 'ratings.hidden');
  const who = speakerAt(screen, idx);
  const title = final ? 'THE FINAL RATINGS' : 'THE RATINGS';
  if (revealing) {
    // The board: the places from the bottom up, each drawn when its result is read.
    const shown = new Set();
    for (const x of seen) {
      if (!RESULT.test(x.key || '')) continue;
      if (x.on?.a) shown.add(x.on.a);
      if (x.key === 'result.influencers' && x.on?.b) shown.add(x.on.b);
    }
    const crowned = seen.some(x => ['result.influencers', 'result.sole', 'result.super', 'result.secret'].includes(x.key));
    const newest = st && RESULT.test(st.key || '') ? new Set([st.on?.a, st.key === 'result.influencers' ? st.on?.b : null]) : new Set();
    const rows = [...d.results].sort((a, b) => a.place - b.place).map(r => {
      const open = shown.has(r.profile);
      const infl = crowned && d.influencers.includes(r.profile);
      return `<div class="civ-slot${open ? ' open' : ''}${infl ? ' crown' : ''}${open && fresh && newest.has(r.profile) ? ' land' : ''}">
        <b>${r.place}</b>${open ? tile(row, r.profile, 'row', infl ? '<span class="civ-badge">INFLUENCER</span>' : '') : '<div class="civ-mtile row hidden"><div class="ph">?</div><div class="n">· · ·</div></div>'}</div>`;
    }).join('');
    return `<div class="civ-layer civ-rate reveal">${bgUi}
      <div class="civ-board${d.results.length > 7 ? ' two' : ''}"><div class="hd">${title}</div>${rows}</div>
      ${cam(row, who, 'side')}${where(`${title} · THE RESULTS`)}${dlg(row, st, fresh, 'right')}
      ${crowned && fresh && st && ['result.influencers', 'result.sole'].includes(st.key) ? '<div class="civ-confetti"></div>' : ''}</div>`;
  }
  // A voter's ranking screen: slots fill as they name them.
  const ballot = d.ballots.find(b => b.voter === who);
  const mine = seen.filter(x => x.on?.a === who && /^(rate|final\.rate)\./.test(x.key || ''));
  const sent = seen.some(x => /^(ratings|final)\.done$/.test(x.key || '') && x.who === who);
  const placed = new Map(mine.map(x => [x.on.b, x]));
  const n = ballot?.order.length || 0;
  const slots = (ballot?.order || []).map((h, i) => {
    const open = sent || placed.has(h);
    const now = st && placed.get(h) === st;
    return `<div class="civ-slot${open ? ' open' : ''}${now ? ' now' : ''}${now && fresh ? ' land' : ''}"><b>${i + 1}</b>${open ? tile(row, h, 'row') : '<div class="civ-mtile row hidden"><div class="ph">?</div><div class="n">· · ·</div></div>'}</div>`;
  }).join('');
  return `<div class="civ-layer civ-rate">${bgUi}
    ${cam(row, who, 'side')}
    <div class="civ-board${n > 7 ? ' two' : ''}"><div class="hd">${ballot ? `${esc(nameOf(row, who).toUpperCase())} RATES` : 'RATE YOUR FELLOW PLAYERS'}</div>${slots || `<div class="civ-boardnote">${esc(final ? 'For the last time, rate your fellow Players.' : 'The top two will become Influencers.')}</div>`}
      ${sent ? '<div class="civ-stamp">SENT</div>' : ''}</div>
    ${where(title)}${dlg(row, st, fresh, 'right')}</div>`;
}

// ── THE HANGOUT ────────────────────────────────────────────────────────
function hangoutStage(row, screen, idx, fresh) {
  const d = screen.d || { atRisk: [], target: null };
  const st = idx >= 0 ? screen.steps[idx] : null;
  const seen = upTo(screen, idx);
  const infl = screen.who;
  const verdict = {};
  const VIEW = /^hangout\.(?:solo\.)?view\.\w+\.(keep|cut)$/;
  for (const x of seen) {
    const m = VIEW.exec(x.key || '');
    if (m && x.on?.c) verdict[x.on.c] = m[1];
  }
  const current = VIEW.test(st?.key || '') ? st.on?.c : null;
  const decided = seen.some(x => /^hangout\.(agree|trade|yield|trio\.|solo\.decide)/.test(x.key || '')) ? d.target : null;
  const talking = st?.who || speakerAt(screen, idx);
  const cams = infl.map((h, i) => `<div class="civ-hcam ${i === 0 ? 'L' : i === 1 ? 'R' : 'M'}${h === talking ? ' talk' : ''}">${cam(row, h, '', `INFLUENCER · ${realOf(row, h).toUpperCase()}`)}</div>`).join('');
  const tiles = d.atRisk.map(h => {
    const v = verdict[h];
    const cls = [v === 'keep' ? 'keep' : v === 'cut' ? 'cut' : '', h === current ? 'talk' : '', h === decided ? 'doomed' : ''].join(' ');
    return tile(row, h, cls, v ? `<span class="civ-verdict">${v === 'keep' ? '✓ SAFE' : '✗ ON THE TABLE'}</span>` : '');
  }).join('');
  return `<div class="civ-layer civ-hangout">${bgUi}${cams}
    <div class="civ-atrisk"><div class="hd">${decided ? 'THE DECISION' : 'AT RISK'}</div><div class="grid">${tiles}</div></div>
    ${where(infl.length > 1 ? 'THE HANGOUT · INFLUENCERS ONLY' : 'THE INFLUENCER DECIDES')}${dlg(row, st, fresh)}</div>`;
}

// ── THE BLOCKING ───────────────────────────────────────────────────────
const NAMED = /^(block\.announce\.|vote\.result|block\.inperson\.tell)/;
function blockedStage(row, screen, idx, fresh) {
  const d = screen.d || { target: screen.who[1], by: [] };
  const st = idx >= 0 ? screen.steps[idx] : null;
  const seen = upTo(screen, idx);
  const target = d.target;
  const namedAt = screen.steps.findIndex(x => NAMED.test(x.key || ''));
  const named = namedAt >= 0 && namedAt <= idx;
  const slam = named && fresh && idx === namedAt;
  const typing = !named && seen.some(x => x.key === 'block.typing');
  // Everybody in the building when the name was sent: who is still in, and the one who leaves.
  const room = [...new Set([...(row.ci.active || []), ...(target ? [target] : []), ...screen.who])].filter(h => row.ci.profiles?.[h]);
  const waiting = st?.key === 'block.wait' ? st.who : null;
  const tiles = room.map(h => tile(row, h, [h === target && named ? 'out' : '', h === waiting ? 'talk' : ''].join(' '),
    d.by.includes(h) ? '<span class="civ-badge">INFLUENCER</span>' : h === target && named ? '<span class="civ-badge red">BLOCKED</span>' : '')).join('');
  const announcer = d.secret ? null : d.by[0];
  const msg = named ? `<div class="civ-msgbox sent">${announcer ? `<div class="from">${esc(nameOf(row, announcer).toUpperCase())}</div>` : '<div class="from">THE CIRCLE</div>'}${hashify(screen.steps[namedAt].text)}</div>`
    : typing ? `<div class="civ-msgbox"><div class="from">${d.by.length ? 'THE INFLUENCERS' : 'THE CIRCLE'}</div><span class="civ-dots"><span></span><span></span><span></span></span></div>`
      : `<div class="civ-msgbox idle">${d.by.length ? 'The Influencers have made their decision.' : 'The Circle has made its decision.'}</div>`;
  // A stage direction keeps the camera on whoever it is about.
  const speaker = st?.who && st.part !== 'send' ? st.who : st?.part === 'stage' ? speakerAt(screen, idx) : null;
  return `<div class="civ-layer civ-blocked${named ? ' done' : ''}"><div class="civ-uibg"></div><div class="civ-redwash"></div>
    <div class="civ-bstack"><div class="civ-bgrid">${tiles}</div>${msg}</div>
    ${speaker ? cam(row, speaker, `side${fresh ? ' in' : ''}`) : ''}
    ${slam ? `<div class="civ-slam"><span>BLOCKED</span><small>${esc(nameOf(row, target).toUpperCase())}</small></div><div class="civ-flash red"></div>` : ''}
    ${where('THE BLOCKING')}${st && st.part !== 'send' ? dlg(row, st, fresh, speaker ? 'right' : '') : ''}</div>`;
}

// ── A REAL ROOM: the visit and the finale meet ─────────────────────────
const TOGETHER = /^visit\.(door|sit|talk|power|hand|kiss|bye|inperson\.bye)/;
function roomStage(row, screen, idx, fresh) {
  const st = idx >= 0 ? screen.steps[idx] : null;
  if (screen.kind === 'meet') return meetStage(row, screen, idx, fresh, st);
  const [visitor, host] = screen.who;
  const k = st?.key || '';
  const doorAt = screen.steps.findIndex(x => TOGETHER.test(x.key || ''));
  const together = doorAt >= 0 && idx >= doorAt && !/^visit\.(after|inperson\.after)/.test(k);
  const opening = together && fresh && idx === doorAt;
  if (together) {
    const person = h => `<div class="civ-person${h === st?.who ? ' talk' : ''}">${cam(row, h, 'big', realOf(row, h).toUpperCase())}
      ${isCatfish(row, h) ? `<div class="civ-wasnt">played as <b>${esc(nameOf(row, h))}</b> · catfish</div>` : `<div class="civ-was">the real ${esc(nameOf(row, h))}</div>`}</div>`;
    return `<div class="civ-layer civ-room2${opening ? ' open' : ''}"><div class="civ-realroom"></div><div class="civ-door L"></div><div class="civ-door R"></div>
      <div class="civ-two">${person(visitor)}${person(host)}</div>
      ${where('FACE TO FACE · ONE ROOM, TWO PLAYERS')}${dlg(row, st, fresh)}</div>`;
  }
  if (/^visit\.(after|inperson\.after)/.test(k)) {
    return `<div class="civ-layer civ-room2 after"><div class="civ-realroom"></div>${cam(row, st.who || host, 'center')}${where('AFTER THE VISIT')}${dlg(row, st, fresh)}</div>`;
  }
  // Before the door: the one walking the hallway, and every apartment wondering whose door it is.
  const waiting = [...new Set(upTo(screen, idx).filter(x => /^visit\.wait/.test(x.key || '')).map(x => x.who))];
  const walking = /^visit\.(choose|walk)/.test(k) || !waiting.length;
  return `<div class="civ-layer civ-hall${walking ? ' walking' : ''}"><div class="civ-corridor"><i></i><i></i><i></i><i></i></div>
    ${walking ? cam(row, visitor, 'center', `THE HALLWAY · ${realOf(row, visitor).toUpperCase()}`)
      : `<div class="civ-waits">${waiting.map(h => cam(row, h, h === st?.who ? 'now' : '')).join('')}</div><div class="civ-knock">Whose door?</div>`}
    ${where(walking ? 'A VISIT · THE BLOCKED PLAYER WALKS' : 'A VISIT · EVERYBODY WAITS')}${dlg(row, st, fresh)}</div>`;
}
function meetStage(row, screen, idx, fresh, st) {
  const [arriving, ...present] = screen.who;
  const walkedIn = idx >= 0 && present.length > 0;
  const everyone = walkedIn ? [...present, arriving] : present.length ? present : [arriving];
  const faces = everyone.map(h => `<div class="civ-person small${h === arriving && fresh && idx === 0 ? ' enter' : ''}${h === st?.who ? ' talk' : ''}">${cam(row, h, 'big', realOf(row, h).toUpperCase())}
    ${isCatfish(row, h) ? `<div class="civ-wasnt">was <b>${esc(nameOf(row, h))}</b></div>` : `<div class="civ-was">${esc(nameOf(row, h))}</div>`}</div>`).join('');
  return `<div class="civ-layer civ-room2 lounge"><div class="civ-realroom lounge"></div><div class="civ-two many">${faces}</div>
    ${where('THE FINALE · MEETING IN PERSON')}${dlg(row, st, fresh)}</div>`;
}

// ── THE GOODBYE VIDEO ──────────────────────────────────────────────────
function videoStage(row, screen, idx, fresh) {
  const st = idx >= 0 ? screen.steps[idx] : null;
  const [h] = screen.who;
  const vids = screen.steps.map((x, i) => (x.part === 'video' ? i : -1)).filter(i => i >= 0);
  const played = vids.filter(i => i <= idx).length;
  const playing = st?.part === 'video';
  const after = played > 0 && !playing;
  const url = faceUrl(faceOf(row, h, 'cam'));
  const pic = faceUrl(faceOf(row, h, 'profile'));
  const screenInner = played
    ? `<div class="civ-vid${playing ? ' play' : ''}"${bg(url)}>${url ? '' : esc(realOf(row, h)[0])}</div>
       <div class="civ-vidname">${esc(realOf(row, h).toUpperCase())}${isCatfish(row, h) ? ` <i>· the real face behind "${esc(nameOf(row, h))}"</i>` : ''}</div>
       ${playing ? `<div class="civ-sub">${esc(st.text)}</div>` : ''}
       <div class="civ-bar"><i style="width:${Math.round(played / Math.max(1, vids.length) * 100)}%"></i></div>`
    : `<div class="civ-vidcard"><div class="ph"${bg(pic)}>${pic ? '' : esc(nameOf(row, h)[0])}</div><div>A VIDEO MESSAGE FROM<br><b>${esc(nameOf(row, h).toUpperCase())}</b></div><div class="civ-play">▶</div></div>`;
  const last = st?.part === 'stage' ? speakerAt(screen, idx) : st?.who;
  const watcher = !playing && last && last !== h ? last : null;
  return `<div class="civ-layer civ-video${after ? ' after' : ''}">${bgUi}
    <div class="civ-bigtv">${screenInner}</div>
    ${watcher ? cam(row, watcher, `side${fresh ? ' in' : ''}`) : ''}
    ${where('THE GOODBYE VIDEO')}${playing ? '' : dlg(row, st, fresh, watcher ? 'right' : '')}</div>`;
}

// ── THE FINALE STUDIO ──────────────────────────────────────────────────
function studioStage(row, screen, idx, fresh) {
  const st = idx >= 0 ? screen.steps[idx] : null;
  const pl = [...(screen.d?.placements || [])].sort((a, b) => a.place - b.place);
  const seen = upTo(screen, idx);
  const shown = new Set(seen.filter(x => /^reveal\./.test(x.key || '')).map(x => x.on?.a).filter(Boolean));
  const winner = seen.some(x => x.key === 'reveal.winner') ? pl[0]?.profile : null;
  const newest = st && /^reveal\./.test(st.key || '') ? st.on?.a : null;
  const board = pl.map(p => {
    const open = shown.has(p.profile);
    return `<div class="civ-slot${open ? ' open' : ''}${p.profile === winner ? ' crown' : ''}${open && fresh && p.profile === newest ? ' land' : ''}"><b>${p.place}</b>${open
      ? `${tile(row, p.profile, 'row')}<span class="civ-aka">${isCatfish(row, p.profile) ? `aka ${esc(realOf(row, p.profile))}` : ''}</span>`
      : '<div class="civ-mtile row hidden"><div class="ph">?</div><div class="n">· · ·</div></div>'}</div>`;
  }).join('');
  const couch = pl.map(p => p.profile).map(h => `<div class="civ-seat${h === st?.who ? ' talk' : ''}${h === winner ? ' win' : ''}">${cam(row, h, 'seat', realOf(row, h).toUpperCase())}</div>`).join('');
  return `<div class="civ-layer civ-studio"><div class="civ-studiobg"></div><div class="civ-aurora big" style="left:50%;top:-30%;width:70%;aspect-ratio:1;margin-left:-35%"></div>
    <div class="civ-board studio"><div class="hd">THE FINAL BOARD</div>${board}</div>
    <div class="civ-couch">${couch}</div>
    ${winner && fresh && st?.key === 'reveal.winner' ? '<div class="civ-confetti"></div><div class="civ-winner">WINNER</div>' : ''}
    ${where('THE FINALE · LIVE')}${dlg(row, st, fresh)}</div>`;
}

// ── THE NEWSFEED ───────────────────────────────────────────────────────
// This morning's posts and the likes they got: hidden until the first line,
// then counted up and ranked, the most-liked crowned, a post nobody liked
// left at zero. The lines on this screen talk about exactly this board.
function postsOf(row) {
  const out = {};
  for (const s of row.ci.aired || []) {
    if (s.kind !== 'status') continue;
    const l = (s.script?.blocks || []).flatMap(b => b.lines || []).find(x => x.kind === 'post' && x.text);
    if (l && s.who?.[0]) out[s.who[0]] = l.text;
  }
  return out;
}
function feedStage(row, screen, idx, fresh) {
  const st = idx >= 0 ? screen.steps[idx] : null;
  const counts = screen.d?.counts || {};
  const posts = postsOf(row);
  const shown = idx >= 0;
  const who = Object.keys(counts).filter(h => row.ci.profiles?.[h]);
  const order = shown ? [...who].sort((a, b) => counts[b] - counts[a] || nameOf(row, a).localeCompare(nameOf(row, b))) : who;
  const top = shown && order.length ? counts[order[0]] : null;
  const talking = st?.who || null;
  const cards = order.map((h, i) => {
    const n = counts[h] || 0;
    const cls = [shown && n === top && n > 0 ? 'top' : '', shown && n === 0 ? 'zero' : '', h === talking ? 'talk' : ''].join(' ');
    const url = faceUrl(faceOf(row, h, 'profile'));
    return `<div class="civ-fpost ${cls}" style="--ring:${ringOf(row, h)};--i:${i}">
      <div class="ph"${bg(url)}>${url ? '' : esc(nameOf(row, h)[0] || '?')}</div>
      <div class="bd"><div class="nm">${esc(nameOf(row, h).toUpperCase())}${shown && n === top && n > 0 ? '<span class="civ-fcrown">♛ MOST LIKES</span>' : ''}</div>
        <div class="tx">${posts[h] ? hashify(posts[h]) : '<i>posted this morning</i>'}</div></div>
      <div class="lk${fresh && shown && idx === 0 ? ' count' : ''}"><span class="hrt">♥</span><b>${shown ? n : '?'}</b></div></div>`;
  }).join('');
  return `<div class="civ-layer civ-feedb">${bgUi}<div class="civ-fhd">THE NEWSFEED<small>This morning's posts · likes</small></div>
    <div class="civ-fgrid">${cards}</div>${where('THE NEWSFEED')}${dlg(row, st, fresh)}</div>`;
}

export const MOMENTS = { feed: feedStage, game: gameStage, rate: rateStage, hangout: hangoutStage, blocked: blockedStage, room: roomStage, video: videoStage, studio: studioStage };
