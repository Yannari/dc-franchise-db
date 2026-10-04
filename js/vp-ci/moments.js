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
import { esc, hashify, faceUrl, ringOf, nameOf, realOf, isCatfish, bg, aptNo, captionHtml, dlg, cam, tile, where, upTo, speakerAt, bgUi, setImg } from './parts.js';
import { gameStage } from './boards.js';
import { visitStage } from './visit-stage.js';
import { voteStage } from './vote-stage.js';

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
  // The final ratings decide the winner, and finale night reveals them: a
  // ballot here shows only the names said out loud, never the whole order,
  // and the first place is a secret (user: "limit the final ratings screen
  // to just some placements to not spoil the results for the next episode").
  const teased = final && seen.some(x => x.key === 'final.rate.tease' && x.who === who);
  const slots = (ballot?.order || []).map((h, i) => {
    const open = (!final && sent) || placed.has(h);
    const now = st && placed.get(h) === st;
    const secret = teased && i === 0 && !open;
    return `<div class="civ-slot${open ? ' open' : ''}${now ? ' now' : ''}${now && fresh ? ' land' : ''}"><b>${i + 1}</b>${open ? tile(row, h, 'row')
      : secret ? '<div class="civ-mtile row hidden secret"><div class="ph">★</div><div class="n">KEPT SECRET</div></div>'
        : '<div class="civ-mtile row hidden"><div class="ph">?</div><div class="n">· · ·</div></div>'}</div>`;
  }).join('');
  return `<div class="civ-layer civ-rate">${bgUi}
    ${cam(row, who, 'side')}
    <div class="civ-board${n > 7 ? ' two' : ''}"><div class="hd">${ballot ? `${esc(nameOf(row, who).toUpperCase())} RATES` : 'RATE YOUR FELLOW PLAYERS'}</div>${slots || `<div class="civ-boardnote">${esc(final ? 'For the last time, rate your fellow Players.' : 'The top two will become Influencers.')}</div>`}
      ${sent ? '<div class="civ-stamp">SENT</div>' : ''}</div>
    ${where(title)}${dlg(row, st, fresh, 'right')}</div>`;
}

// ── THE HANGOUT ────────────────────────────────────────────────────────
// The Hangout (user, 2026-10-04: "when they discuss someone they open his
// profile so it's the focus, then they mark it safe or on the table ... more
// visually pleasing"; mockup/mockup-circle-hangout-focus.html, "perfect").
// The LED wall shows the board; on the first line about a player their
// profile opens across it (DISCUSSING, the other faces in a strip); the
// verdict stamps down on the line that settles it — never before; then the
// profile closes and their tile lands on the board with the mark.
const VIEW = /^hangout\.(?:solo\.)?view\.\w+\.(keep|cut)$/;
/** Each player's discussion: the run of lines about them, and how it ended. */
function discussions(screen) {
  const out = [];
  screen.steps.forEach((x, i) => {
    const m = VIEW.exec(x.key || '');
    const c = m && x.on?.c;
    if (!c) return;
    const last = out.at(-1);
    if (last && last.c === c && last.end === i - 1) last.end = i;
    else out.push({ c, start: i, end: i, verdict: m[1] });
  });
  return out;
}
function hangoutStage(row, screen, idx, fresh) {
  const d = screen.d || { atRisk: [], target: null };
  const st = idx >= 0 ? screen.steps[idx] : null;
  const seen = upTo(screen, idx);
  const infl = screen.who;
  const talks = discussions(screen);
  // A mark is on the board once the line that settled it has played.
  const verdict = {};
  for (const t of talks) if (idx >= t.end) verdict[t.c] = t.verdict;
  const now = talks.find(t => idx >= t.start && idx <= t.end) || null;
  const justClosed = !now && talks.find(t => t.end === idx - 1) || null;
  // The show cuts before the name (the decision airs in the blocking's
  // flashback): the board ends DECIDED with two names still on the table.
  const sealed = seen.some(x => /^hangout\.(solo\.)?sealed$/.test(x.key || ''));
  const talking = st?.who || speakerAt(screen, idx);
  const cams = infl.map((h, i) => `<div class="civ-hcam ${i === 0 ? 'L' : i === 1 ? 'R' : 'M'}${h === talking ? ' talk' : ''}">${cam(row, h, '', `INFLUENCER · ${realOf(row, h).toUpperCase()}`)}</div>`).join('');
  // America's Block (formats.js): the two names on the table go to the audience, who decide.
  const america = d.format === 'audience-block';
  const mark = v => (v === 'keep' ? '✓ SAFE' : america ? 'UP TO AMERICA' : 'ON THE TABLE');
  const tiles = d.atRisk.map(h => {
    const v = verdict[h];
    const url = faceUrl(faceOf(row, h, 'profile'));
    const land = fresh && justClosed?.c === h;
    return `<div class="civ-htile${v === 'keep' ? ' safe' : v === 'cut' ? ' cut' : ''}${land ? ' land' : ''}" data-h="${esc(h)}" style="--ring:${ringOf(row, h)}">
      <div class="ph"${bg(url)}>${url ? '' : esc(nameOf(row, h)[0] || '?')}</div>
      <div class="tx"><div class="n">${esc(nameOf(row, h).toUpperCase())}</div>${v ? `<span class="mk">${mark(v)}</span>` : ''}</div></div>`;
  }).join('');
  let wall;
  if (now) {
    const h = now.c, p = row.ci.profiles[h] || {};
    const url = faceUrl(faceOf(row, h, 'profile'));
    const stamped = idx === now.end ? now.verdict : null;
    const strip = d.atRisk.map(o => {
      const u = faceUrl(faceOf(row, o, 'profile'));
      const cls = o === h ? 'on' : verdict[o] === 'keep' ? 'safe' : verdict[o] === 'cut' ? 'cut' : '';
      return `<span class="${cls}"${bg(u)}>${u ? '' : esc(nameOf(row, o)[0] || '?')}</span>`;
    }).join('');
    const facts = [p.age, p.status].filter(x => x != null && x !== '').map(x => esc(String(x).toUpperCase())).join(' · ');
    wall = `<div class="civ-hwall focused"><div class="civ-hfocus${stamped === 'keep' ? ' ok' : stamped === 'cut' ? ' no' : ''}${fresh && idx === now.start ? ' opening' : ''}${fresh && stamped ? ' slam' : ''}" data-h="${esc(h)}" style="--ring:${ringOf(row, h)}">
      <div class="fph"${bg(url)}>${url ? '' : esc(nameOf(row, h)[0] || '?')}</div>
      <div class="finfo"><span class="pill"><i></i>DISCUSSING</span><div class="fname">${esc(nameOf(row, h).toUpperCase())}</div>
        ${facts ? `<div class="ffacts">${facts}</div>` : ''}${p.job ? `<div class="fjob">${esc(p.job)}</div>` : ''}${p.bio ? `<div class="fbio">“${esc(p.bio)}”</div>` : ''}</div>
      <div class="strip">${strip}</div>
      ${stamped ? `<div class="stamp ${stamped === 'keep' ? 'ok' : 'no'}">${mark(stamped)}</div>${fresh ? `<div class="flash ${stamped === 'keep' ? 'ok' : 'no'}"></div>` : ''}` : ''}
    </div></div>`;
  } else {
    wall = `<div class="civ-hwall"><div class="civ-atrisk${d.atRisk.length > 6 ? ' dense' : ''}${fresh && justClosed ? ' back' : ''}"><div class="hd">${sealed ? (america ? 'TWO NAMES GO TO AMERICA' : "THEY'VE DECIDED") : 'AT RISK'}</div><div class="grid">${tiles}</div></div></div>`;
  }
  return `<div class="civ-layer civ-hangout">${setImg('hangout')}${cams}${wall}
    ${where(america ? 'THE HANGOUT · TWO NAMES FOR AMERICA' : infl.length > 1 ? 'THE HANGOUT · INFLUENCERS ONLY' : 'THE INFLUENCER DECIDES')}${dlg(row, st, fresh)}</div>`;
}

// ── THE BLOCKING ───────────────────────────────────────────────────────
const NAMED = /^(block\.announce\.|vote\.result|block\.inperson\.tell)/;
function blockedStage(row, screen, idx, fresh) {
  const d = screen.d || { target: screen.who[1], by: [] };
  const st = idx >= 0 ? screen.steps[idx] : null;
  const seen = upTo(screen, idx);
  const target = d.target;
  // The message that names them (not the aside said aloud before sending it).
  const firstNamed = screen.steps.findIndex(x => NAMED.test(x.key || ''));
  const sentAt = screen.steps.findIndex(x => NAMED.test(x.key || '') && x.part === 'send');
  const namedAt = sentAt >= 0 ? sentAt : firstNamed;
  const named = namedAt >= 0 && namedAt <= idx;
  const slam = named && fresh && idx === namedAt;
  const typing = !named && seen.some(x => x.key === 'block.typing');
  // Everybody in the building when the name was sent: who is still in, and the one who leaves.
  const room = [...new Set([...(row.ci.active || []), ...(target ? [target] : []), ...screen.who])].filter(h => row.ci.profiles?.[h]);
  const waiting = st?.key === 'block.wait' ? st.who : null;
  const tiles = room.map(h => tile(row, h, [h === target && named ? 'out' : '', h === waiting ? 'talk' : ''].join(' '),
    d.by.includes(h) ? '<span class="civ-badge">INFLUENCER</span>' : h === target && named ? '<span class="civ-badge red">BLOCKED</span>' : '')).join('');
  const announcer = d.secret ? null : d.by[0];
  // THE FLASHBACK: the Hangout's decision, after the name (script.js).
  if (st?.fb) return flashbackStage(row, screen, idx, fresh, st);
  // The announcement builds a message at a time (lines/blocking-build.js):
  // the last two pieces stay up while the next is typed, then the name.
  const builtSteps = seen.filter(x => /^block\.build\./.test(x.key || '') && x.part === 'send');
  const built = builtSteps.map(x => x.text);
  // Whoever actually typed it (the boldest Influencer), not the first listed.
  const typist = builtSteps[0]?.who || screen.steps.find(x => NAMED.test(x.key || '') && x.part === 'send')?.who || announcer;
  const from = `<div class="from">${typist ? esc(nameOf(row, typist).toUpperCase()) : d.by.length ? 'THE INFLUENCERS' : 'THE CIRCLE'}</div>`;
  const lastBuilt = seen.length && /^block\.build\./.test(seen.at(-1).key || '') && fresh;
  const thread = built.slice(-2).map((t, i, l) => `<div class="civ-msgbox piece${lastBuilt && i === l.length - 1 ? ' sent' : ''}">${i === 0 ? from : ''}${hashify(t)}</div>`).join('');
  const msg = named ? `${thread}<div class="civ-msgbox sent">${built.length ? '' : from}${hashify(screen.steps[namedAt].text)}</div>`
    : typing ? `${thread}<div class="civ-msgbox">${built.length ? '' : from}<span class="civ-dots"><span></span><span></span><span></span></span></div>`
      : built.length ? thread
        : `<div class="civ-msgbox idle">${d.by.length ? 'The Influencers have made their decision.' : 'The Circle has made its decision.'}</div>`;
  // A stage direction keeps the camera on whoever it is about.
  const speaker = st?.who && st.part !== 'send' ? st.who : st?.part === 'stage' ? speakerAt(screen, idx) : null;
  return `<div class="civ-layer civ-blocked${named ? ' done' : ''}"><div class="civ-uibg"></div><div class="civ-redwash"></div>
    <div class="civ-bstack"><div class="civ-bgrid">${tiles}</div>${msg}</div>
    ${speaker ? cam(row, speaker, `side${fresh ? ' in' : ''}`) : ''}
    ${slam ? `<div class="civ-slam"><span>BLOCKED</span><small>${esc(nameOf(row, target).toUpperCase())}</small></div><div class="civ-flash red"></div>` : ''}
    ${where('THE BLOCKING')}${st && st.part !== 'send' ? dlg(row, st, fresh, speaker ? 'right' : '') : ''}</div>`;
}

// ── EARLIER, IN THE HANGOUT ────────────────────────────────────────────
// The flashback after the name: warm, faded and grainy so it reads as
// "earlier" at a glance; the Influencers on their cameras, who they settled
// on and why, and the lines that settled it.
const WHY = { fake: "WE DON'T THINK THEY'RE REAL", threat: 'TOO BIG A THREAT', grudge: 'IT GOT PERSONAL', noBond: 'NO REAL CONNECTION', offer: 'AN OFFER WAS MADE' };
function flashbackStage(row, screen, idx, fresh, st) {
  const d = screen.d || {};
  const opening = fresh && st.fb === 'flashback-open';
  const talking = st.who || speakerAt(screen, idx);
  const cams = (d.by || []).slice(0, 3).map((h, i) => `<div class="civ-fbcam ${i === 0 ? 'L' : i === 1 ? 'R' : 'M'}${h === talking ? ' talk' : ''}">${cam(row, h, '', `INFLUENCER · ${realOf(row, h).toUpperCase()}`)}</div>`).join('');
  const why = WHY[d.reason] || '';
  return `<div class="civ-layer civ-fbk${opening ? ' open' : ''}">${setImg('hangout', 'fbk')}<div class="civ-fbk-grain"></div>
    <div class="civ-fbk-band">EARLIER<b>IN THE HANGOUT</b></div>${cams}
    <div class="civ-fbk-mid"><div class="lbl">THEY SETTLED ON</div><div class="nm">${esc(nameOf(row, d.target).toUpperCase())}</div>${why ? `<div class="why">${why}</div>` : ''}</div>
    <div class="civ-fbk-vig"></div>${opening ? '<div class="civ-fbk-flash"></div>' : ''}
    ${where('THE HANGOUT · EARLIER')}${dlg(row, st, fresh, 'fb')}</div>`;
}

// ── A REAL ROOM: the visit and the finale meet ─────────────────────────
function roomStage(row, screen, idx, fresh) {
  const st = idx >= 0 ? screen.steps[idx] : null;
  if (screen.kind === 'meet') return meetStage(row, screen, idx, fresh, st);
  // The visit: the hallway, everybody's apartment, the door (visit-stage.js).
  return visitStage(row, screen, idx, fresh);
}
function meetStage(row, screen, idx, fresh, st) {
  const [arriving, ...present] = screen.who;
  const walkedIn = idx >= 0 && present.length > 0;
  const everyone = walkedIn ? [...present, arriving] : present.length ? present : [arriving];
  const faces = everyone.map(h => `<div class="civ-person small${h === arriving && fresh && idx === 0 ? ' enter' : ''}${h === st?.who ? ' talk' : ''}">${cam(row, h, 'big', realOf(row, h).toUpperCase())}
    ${isCatfish(row, h) ? `<div class="civ-wasnt">was <b>${esc(nameOf(row, h))}</b></div>` : `<div class="civ-was">${esc(nameOf(row, h))}</div>`}</div>`).join('');
  return `<div class="civ-layer civ-room2 lounge">${setImg('lounge')}<div class="civ-two many">${faces}</div>
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
// User (2026-10-04): "the way they're placed in the winner screen spoiled the
// final result"; "the final board should have more suspense". The couch is in
// the order they arrived at the meeting, never the order they finished. A
// place opens only on the line that names it (the host's build-up before it
// knows who it is about, and must not show it): the slot pulses through the
// pause, the last two stand in a spotlight, then the winner.
const ORD = n => `${n}${n % 10 === 1 && n !== 11 ? 'ST' : n % 10 === 2 && n !== 12 ? 'ND' : n % 10 === 3 && n !== 13 ? 'RD' : 'TH'}`;
function studioStage(row, screen, idx, fresh) {
  const st = idx >= 0 ? screen.steps[idx] : null;
  const k = st?.key || '';
  const pl = [...(screen.d?.placements || [])].sort((a, b) => a.place - b.place);
  const finalists = pl.map(p => p.profile);
  const seen = upTo(screen, idx);
  const winnerOut = seen.some(x => x.key === 'reveal.winner');
  // Open: a place named by the host; the winner's line opens the top two.
  const shown = new Set(seen.filter(x => x.key === 'reveal.place').map(x => x.on?.a).filter(Boolean));
  if (winnerOut) for (const p of pl.slice(0, 2)) shown.add(p.profile);
  const winner = winnerOut ? pl[0]?.profile : null;
  const placeOf = h => pl.find(p => p.profile === h)?.place;
  const nextHidden = [...pl].reverse().find(p => !shown.has(p.profile));
  const final2 = !winnerOut && seen.some(x => x.key === 'reveal.final2');
  const standing = final2 ? (() => { const f = seen.filter(x => x.key === 'reveal.final2').at(-1); return [f.on?.a, f.on?.b]; })() : [];
  const drum = k === 'reveal.suspense' ? new Set([nextHidden?.place]) : final2 ? new Set([1, 2]) : new Set();
  const newest = k === 'reveal.place' ? st.on?.a : k === 'reveal.winner' ? winner : null;
  const board = pl.map(p => {
    const open = shown.has(p.profile);
    return `<div class="civ-slot${open ? ' open' : ''}${p.profile === winner ? ' crown' : ''}${!open && drum.has(p.place) ? ' drum' : ''}${open && fresh && (p.profile === newest || (k === 'reveal.winner' && p.place <= 2)) ? ' land' : ''}"><b>${p.place}</b>${open
      ? `${tile(row, p.profile, 'row')}<span class="civ-aka">${isCatfish(row, p.profile) ? `aka ${esc(realOf(row, p.profile))}` : ''}</span>`
      : '<div class="civ-mtile row hidden"><div class="ph">?</div><div class="n">· · ·</div></div>'}</div>`;
  }).join('');
  // The couch, in the order they walked into the meeting.
  const seats = (screen.d?.seats || []).filter(h => finalists.includes(h));
  const order = seats.length === finalists.length ? seats : [...finalists].sort((a, b) => nameOf(row, a).localeCompare(nameOf(row, b)));
  const fanSeen = seen.some(x => x.key === 'reveal.fan') ? screen.d?.fan : null;
  const speech = /^reveal\.speech/.test(k);
  const couch = order.map(h => {
    const placed = shown.has(h);
    const cls = [h === st?.who ? 'talk' : '', h === winner ? 'win' : '', final2 && standing.includes(h) ? 'stand' : '', final2 && !standing.includes(h) ? 'dim' : '',
      !placed && k === 'reveal.suspense' ? 'tense' : '', speech && h === winner ? 'spot' : ''].filter(Boolean).join(' ');
    return `<div class="civ-seat ${cls}">${cam(row, h, 'seat', realOf(row, h).toUpperCase())}${placed ? `<span class="civ-seatplace${h === winner ? ' gold' : ''}">${h === winner ? 'WINNER' : ORD(placeOf(h))}</span>` : ''}${fanSeen === h ? '<span class="civ-seatfan">FAN FAVORITE</span>' : ''}</div>`;
  }).join('');
  // The blocked players are in the studio audience; the host talks with some of them first.
  const audience = (screen.cast || []).filter(h => !finalists.includes(h));
  const crowd = audience.length ? `<div class="civ-crowd"><span class="hd">IN THE AUDIENCE</span>${audience.map(h => {
    const u = faceUrl(faceOf(row, h, 'profile'));
    return `<span class="${h === st?.who ? 'talk' : ''}${fanSeen === h ? ' fan' : ''}"${bg(u)}>${u ? '' : esc(nameOf(row, h)[0] || '?')}</span>`;
  }).join('')}</div>` : '';
  const label = speech ? "THE WINNER'S SPEECH" : final2 ? 'THE FINALE · THE LAST TWO' : 'THE FINALE · LIVE';
  return `<div class="civ-layer civ-studio${final2 ? ' final2' : ''}">${setImg('studio')}
    <div class="civ-board studio"><div class="hd">THE FINAL BOARD</div>${board}</div>
    ${crowd}<div class="civ-couch">${couch}</div>
    ${final2 ? '<div class="civ-spot"></div>' : ''}
    ${winner && fresh && k === 'reveal.winner' ? '<div class="civ-confetti"></div><div class="civ-winner">WINNER</div>' : ''}
    ${where(label)}${dlg(row, st, fresh)}</div>`;
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

export const MOMENTS = { vote: voteStage, feed: feedStage, game: gameStage, rate: rateStage, hangout: hangoutStage, blocked: blockedStage, room: roomStage, video: videoStage, studio: studioStage };
