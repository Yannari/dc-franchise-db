// ══════════════════════════════════════════════════════════════════════
// vp-bb-hacker.js — "ACCESS GRANTED"
// ══════════════════════════════════════════════════════════════════════
//
// Roadkill's screen is a corridor of doors: a competition played out of sight,
// rendered as architecture. The Hacker cannot reuse that and should not — it is
// not a room somebody walks into, it is a thing done to the house from inside
// it, three times, on three different nights.
//
// So this one is a terminal. Green phosphor, scanlines, a cursor, and command
// lines that execute one at a time. The field is a grid of nodes that get
// refused one after another until exactly one comes back GRANTED — and the name
// on that node is drawn as a redaction block, because the screen genuinely does
// not say it until the last card. The house never learns it at all.
//
// The rail down the side is the three authorities. On this screen the draw hack
// and the vote hack read PENDING no matter what the week did with them: the
// screen is standing at nomination night and refuses to know its own future.
// ══════════════════════════════════════════════════════════════════════

const _E = (u, v) => (typeof u.esc === 'function' ? u.esc(v) : String(v ?? ''));
const _AV = (u, n, px) => (typeof u.avatar === 'function' ? u.avatar(n, px) : '');
const _REV = u => (typeof u.reveal === 'function' ? u.reveal : () => '');

/** The shared chrome: fonts, phosphor, scanlines, card physics. */
function _shell(inner, title, sub) {
  return `<div class="rp-page bb-room bb-block sighk">
  <style>
  @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Inter:wght@400;500;600&display=swap');
  .sighk{--hk-gr:#6ef2a2;--hk-dim:#2f6b4a;--hk-ink:#d7ffe8;--hk-amb:#ffc247;--hk-red:#ff5f56;
    --hk-line:rgba(110,242,162,.22);
    max-width:1100px;margin:0 auto;color:var(--hk-ink);font-family:Inter,system-ui,sans-serif;
    background:radial-gradient(ellipse 60% 40% at 50% 0%,rgba(110,242,162,.10),transparent 70%),
      linear-gradient(180deg,#04120c,#010604 86%);
    position:relative;overflow:clip}
  /* the tube: scanlines and a slow roll */
  .sighk::before{content:'';position:absolute;inset:46px 0 0;pointer-events:none;z-index:6;
    background:repeating-linear-gradient(180deg,rgba(0,0,0,0) 0 2px,rgba(0,0,0,.28) 2px 3px);
    mix-blend-mode:multiply}
  .sighk::after{content:'';position:absolute;left:0;right:0;top:46px;height:120px;pointer-events:none;z-index:6;
    background:linear-gradient(180deg,rgba(110,242,162,.09),transparent);animation:hkRoll 7s linear infinite}
  @keyframes hkRoll{from{transform:translateY(-120px)}to{transform:translateY(760px)}}

  .hk-head{text-align:center;padding:16px 16px 10px;position:relative;z-index:2}
  .hk-week{font-family:'Share Tech Mono',monospace;font-size:10px;letter-spacing:3px;color:var(--hk-dim)}
  .hk-name{font-family:'Share Tech Mono',monospace;font-size:42px;line-height:1;letter-spacing:4px;
    text-transform:uppercase;color:#eafff2;text-shadow:0 0 24px rgba(110,242,162,.7),2px 0 0 rgba(255,95,86,.4),-2px 0 0 rgba(80,200,255,.35);margin:4px 0}
  .hk-tag{font-family:'Share Tech Mono',monospace;font-size:11px;letter-spacing:2.4px;color:var(--hk-gr)}

  /* the field as a node grid */
  .hk-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(88px,96px));gap:6px;
    justify-content:center;padding:10px 16px 4px;position:relative;z-index:2}
  .hk-node{border:1px solid var(--hk-line);border-radius:3px;padding:6px 4px;text-align:center;
    background:rgba(6,30,18,.7);transition:border-color .3s,background .3s,opacity .3s}
  .hk-node .bb-av{border-radius:2px;opacity:.5;filter:grayscale(.6)}
  .hk-nn{display:block;font-family:'Share Tech Mono',monospace;font-size:9px;letter-spacing:.5px;
    color:#9fd8bb;margin-top:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .hk-st{display:block;font-family:'Share Tech Mono',monospace;font-size:8px;letter-spacing:1.4px;
    color:var(--hk-dim);margin-top:2px}
  .hk-node.is-denied{opacity:.4}
  .hk-node.is-denied .hk-st{color:var(--hk-red)}
  .hk-node.is-granted{border-color:var(--hk-gr);background:rgba(110,242,162,.16);
    box-shadow:0 0 18px rgba(110,242,162,.35)}
  .hk-node.is-granted .hk-st{color:var(--hk-gr)}
  .hk-node.is-granted .bb-av{opacity:1;filter:none}
  .hk-node.is-granted.is-sealed .bb-av{filter:blur(6px) grayscale(1);opacity:.65}

  /* the three authorities */
  .hk-rail{display:flex;gap:7px;justify-content:center;flex-wrap:wrap;padding:8px 16px 2px;position:relative;z-index:2}
  .hk-auth{font-family:'Share Tech Mono',monospace;font-size:9px;letter-spacing:1.6px;
    border:1px solid var(--hk-line);border-radius:3px;padding:4px 10px;color:var(--hk-dim);
    display:flex;align-items:center;gap:7px;background:rgba(4,20,12,.8)}
  .hk-led{width:6px;height:6px;border-radius:50%;background:var(--hk-dim);box-shadow:0 0 6px currentColor}
  .hk-auth.is-spent{color:var(--hk-gr);border-color:var(--hk-line)}
  .hk-auth.is-spent .hk-led{background:var(--hk-gr);animation:hkPulse 1.6s ease-in-out infinite}
  .hk-auth.is-held{color:var(--hk-amb)}
  .hk-auth.is-held .hk-led{background:var(--hk-amb)}
  @keyframes hkPulse{0%,100%{opacity:1}50%{opacity:.35}}

  .hk-term{padding:10px 16px 0;position:relative;z-index:2}
  .hk-card{border:1px solid var(--hk-line);border-left:3px solid var(--hk-gr);border-radius:4px;
    padding:11px 13px;margin-bottom:8px;background:linear-gradient(180deg,rgba(8,38,24,.72),rgba(2,10,6,.85));
    animation:hkIn .26s steps(6,end) both}
  @keyframes hkIn{from{opacity:0;transform:translateX(-6px)}to{opacity:1;transform:none}}
  .hk-card.is-shut{opacity:.14;text-align:center;padding:7px;animation:none;background:none;
    border-left-color:var(--hk-dim)}
  .hk-lock{font-family:'Share Tech Mono',monospace;letter-spacing:4px;color:var(--hk-dim)}
  .hk-cmd{font-family:'Share Tech Mono',monospace;font-size:12px;letter-spacing:1.2px;
    color:var(--hk-gr);margin:0 0 6px}
  .hk-cmd::before{content:'> ';color:var(--hk-dim)}
  .hk-body{font-size:13.5px;line-height:1.65;margin:0}
  .hk-body b{color:#eafff2}
  .hk-quiet{color:#93c7ad;font-size:12.5px;margin-top:6px}
  .hk-rules{display:block;font-size:12px;color:#93c7ad;margin-top:5px}
  .hk-out{font-family:'Share Tech Mono',monospace;font-size:11px;letter-spacing:1.4px;
    color:var(--hk-amb);margin-top:6px}

  .hk-redact{display:inline-block;background:#0b2016;color:transparent;border-radius:2px;
    padding:0 8px;position:relative;user-select:none}
  .hk-redact::after{content:'████████';font-family:'Share Tech Mono',monospace;color:#12452c;
    letter-spacing:-1px}

  .hk-swap{display:grid;grid-template-columns:1fr auto 1fr;gap:12px;align-items:center;margin:9px 0 4px}
  .hk-slot{text-align:center;border:1px dashed var(--hk-line);border-radius:5px;padding:9px 6px;
    background:rgba(4,22,13,.7)}
  .hk-slot figcaption{font-family:'Share Tech Mono',monospace;font-size:10px;letter-spacing:1.2px;
    color:#bff0d5;margin-top:5px}
  .hk-slot.is-down{border-color:rgba(255,95,86,.4)}
  .hk-slot.is-down .bb-av{filter:grayscale(1);opacity:.55}
  .hk-slot.is-up{border-style:solid;border-color:var(--hk-gr);box-shadow:0 0 16px rgba(110,242,162,.22)}
  .hk-arrow{font-family:'Share Tech Mono',monospace;font-size:18px;color:var(--hk-gr)}

  .hk-truth{border-left-color:var(--hk-amb);background:linear-gradient(180deg,rgba(58,42,6,.5),rgba(2,10,6,.88))}
  .hk-truth .hk-cmd{color:var(--hk-amb)}
  .hk-truthb{display:flex;gap:13px;align-items:flex-start}
  .hk-truthb figure{margin:0;text-align:center;flex:none}
  .hk-truthb .bb-av{border-radius:4px;border:2px solid var(--hk-amb)}
  .hk-truthb figcaption{font-family:'Share Tech Mono',monospace;font-size:10px;letter-spacing:1px;
    color:#ffe4ad;margin-top:4px}

  .hk-guesses{display:flex;flex-direction:column;gap:5px;margin:8px 0}
  .hk-guess{display:grid;grid-template-columns:1fr auto 1fr auto;gap:9px;align-items:center;
    padding:5px 9px;border-radius:4px;background:rgba(110,242,162,.05)}
  .hk-guess span{display:flex;align-items:center;gap:6px;min-width:0}
  .hk-guess .bb-av{border-radius:2px}
  .hk-guess b{font-size:11.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .hk-guess em{font-style:normal;font-family:'Share Tech Mono',monospace;font-size:8px;
    letter-spacing:1.6px;color:var(--hk-dim)}
  .hk-guess i{font-style:normal;font-family:'Share Tech Mono',monospace;font-size:9px;letter-spacing:1px}
  .hk-guess.is-wrong{background:rgba(255,95,86,.12)}
  .hk-guess.is-wrong i{color:var(--hk-red)}
  .hk-guess.is-right i{color:var(--hk-gr)}

  /* the ballot that stops existing */
  .hk-ballot{display:flex;align-items:center;gap:11px;border:1px solid rgba(255,95,86,.35);
    border-radius:5px;padding:10px 12px;margin:9px 0;background:rgba(40,8,6,.5)}
  .hk-ballot .bb-av{border-radius:3px;filter:grayscale(1);opacity:.5}
  .hk-strike{text-decoration:line-through;text-decoration-color:var(--hk-red);
    text-decoration-thickness:2px;color:#ffb3ae}
  .hk-count{display:flex;gap:10px;justify-content:center;margin:8px 0 2px;flex-wrap:wrap}
  .hk-cnum{font-family:'Share Tech Mono',monospace;font-size:11px;letter-spacing:1.6px;
    border:1px solid var(--hk-line);border-radius:3px;padding:5px 11px;color:#bff0d5;
    background:rgba(4,22,13,.7)}
  .hk-cnum b{color:var(--hk-gr);font-size:14px}

  .hk-ctrl{position:sticky;bottom:0;z-index:7;display:flex;gap:9px;justify-content:center;
    align-items:center;padding:11px;
    background:linear-gradient(180deg,rgba(1,6,4,0),rgba(1,6,4,.97) 45%)}
  .hk-counter,.hk-done{font-family:'Share Tech Mono',monospace;font-size:10px;letter-spacing:2px;color:var(--hk-dim)}
  .hk-done{color:var(--hk-gr)}

  @media(max-width:700px){.hk-name{font-size:27px}
    .hk-swap{grid-template-columns:1fr}.hk-arrow{transform:rotate(90deg)}
    .hk-guess{grid-template-columns:1fr;gap:4px}}
  @media(prefers-reduced-motion:reduce){
    .sighk *,.sighk *::before,.sighk *::after{animation:none!important;transition:none!important}
  }
  </style>
  <div class="hk-head">
    <div class="hk-week">${title}</div>
    <div class="hk-name">The Hacker</div>
    <div class="hk-tag">${sub}</div>
  </div>
  ${inner}
</div>`;
}

/** The three-authority rail. `states` is { block, draw, vote } of spent|held|pending. */
function _rail(states) {
  const cell = (label, state) => {
    const cls = state === 'spent' ? 'is-spent' : state === 'held' ? 'is-held' : '';
    const word = state === 'spent' ? 'EXECUTED' : state === 'held' ? 'DECLINED' : 'PENDING';
    return `<span class="hk-auth ${cls}"><i class="hk-led"></i>${label} · ${word}</span>`;
  };
  return `<div class="hk-rail">
    ${cell('01 BLOCK', states.block)}
    ${cell('02 DRAW', states.draw)}
    ${cell('03 VOTE', states.vote)}
  </div>`;
}

/**
 * Nomination night: the competition nobody watched, and the block rewriting
 * itself.
 *
 * @param {object} ep   the week record
 * @param {object} act  the `hacker` act
 * @param {object} u    { tvState, reveal, avatar, esc }
 */
export function rpBuildBBHacker(ep, act, u = {}) {
  if (!act || !act.winner) return '';
  const E = v => _E(u, v);
  const AV = (n, px) => _AV(u, n, px);
  const reveal = _REV(u);

  const stateKey = `bb_hacker_${ep.num}${ep?._seg ? `_s${ep._seg}` : ''}`;
  if (!u.tvState) u.tvState = {};
  if (!u.tvState[stateKey]) u.tvState[stateKey] = { idx: -1 };
  const state = u.tvState[stateKey];

  const field = (act.results || []).map(r => r.name).filter(Boolean);
  const comp = act.competition || {};
  const hack = act.blockHack || null;
  const guesses = (ep.hackerGuesses || []).filter(g => g && g.who && g.guess);

  const steps = [
    { kind: 'boot' },
    ...field.map(name => ({ kind: 'node', name })),
    { kind: 'granted' },
    { kind: 'block' },
    { kind: 'truth' },
    ...(guesses.length ? [{ kind: 'blame' }] : []),
  ];
  const total = steps.length;
  const idx = state.idx;
  const revealed = Math.min(total, Math.max(0, idx + 1));
  const done = idx >= total - 1;

  const nodesDone = steps.slice(0, revealed).filter(s => s.kind === 'node').length;
  const granted = steps.slice(0, revealed).some(s => s.kind === 'granted');
  const told = steps.slice(0, revealed).some(s => s.kind === 'truth');
  const blockShown = steps.slice(0, revealed).some(s => s.kind === 'block');

  // Nothing in the grid may single the winner out before the truth card. The
  // field arrives in finishing order, so lighting their node at the GRANTED
  // step would put the answer in the first cell every single week — the
  // ACCESS GRANTED card carries a redaction instead, and the node only lights
  // once the viewer has already been told.
  const grid = `<div class="hk-grid">
    ${field.map((name, k) => {
    const isWinner = name === act.winner;
    const reached = k < nodesDone;
    const lit = isWinner && told;
    const cls = lit ? 'is-granted' : reached ? 'is-denied' : '';
    const label = reached || lit ? E(String(name).split(' ')[0]) : '····';
    const status = lit ? 'GRANTED' : reached ? 'DENIED' : granted ? 'CLOSED' : 'QUEUED';
    return `<div class="hk-node ${cls}">
        ${AV(name, 30)}
        <span class="hk-nn">${label}</span><span class="hk-st">${status}</span>
      </div>`;
  }).join('')}
  </div>`;

  const rail = _rail({
    block: !blockShown ? 'pending' : (hack ? 'spent' : 'held'),
    draw: 'pending', vote: 'pending',
  });

  const cards = steps.map((s, i) => {
    if (i > idx) return '<article class="hk-card is-shut"><span class="hk-lock">· · · · ·</span></article>';

    if (s.kind === 'boot') {
      return `<article class="hk-card">
        <p class="hk-cmd">RUN hacker_comp --solo --field=${field.length}</p>
        <p class="hk-body">They play it one at a time, with nobody watching and nothing announced.
          ${comp.name ? `Tonight it is <b>${E(comp.name)}</b>.` : ''}
          ${comp.desc ? `<span class="hk-rules">${E(comp.desc)}</span>` : ''}</p>
        <p class="hk-out">AUTHORITIES AVAILABLE: 3 · IDENTITY: WITHHELD · DURATION: ONE WEEK</p>
      </article>`;
    }

    if (s.kind === 'node') {
      // Every card in this stretch reads the same SHAPE — a houseguest goes in,
      // nothing comes back — because marking the winner's differently would
      // hand the answer over on whichever card happens to be theirs. The
      // wording varies by position so twelve of them do not read as one card
      // printed twelve times.
      const first = E(String(s.name).split(' ')[0]);
      const line = [
        `<b>${E(s.name)}</b> plays, finishes, and is told nothing at all on the way out — which is exactly what everybody before ${first} was told.`,
        `<b>${E(s.name)}</b> goes in. Whatever happens in there happens with the door shut, and ${first} comes back out with the same expression ${first} went in with.`,
        `<b>${E(s.name)}</b> takes a turn. No time is read out, no placing, no reaction — the room gets a person walking back to the sofa and nothing else.`,
        `<b>${E(s.name)}</b> is next. The rest of the house watches the door rather than the competition, which tells them precisely as much.`,
        `<b>${E(s.name)}</b> plays it blind: no idea what the field has done, no idea what would be good enough, and no way to find out afterwards.`,
        `<b>${E(s.name)}</b> comes back out and gets asked how it went. "Fine." That is the entire briefing anybody in this house receives tonight.`,
      ][i % 6];
      return `<article class="hk-card">
        <p class="hk-cmd">AUTH ${E(String(s.name).split(' ')[0].toUpperCase())} — no answer</p>
        <p class="hk-body">${line}</p>
      </article>`;
    }

    if (s.kind === 'granted') {
      return `<article class="hk-card">
        <p class="hk-cmd">ACCESS GRANTED</p>
        <p class="hk-body">One houseguest gets a different message, alone, in a room with the door
          shut: three things they may do this week, any of them, none of them, and their name
          attached to none of it.</p>
        <p class="hk-out">HOLDER: <span class="hk-redact"></span> · VISIBILITY: NOBODY</p>
      </article>`;
    }

    if (s.kind === 'block') {
      if (!hack) {
        return `<article class="hk-card">
          <p class="hk-cmd">EXEC hack_block — DECLINED</p>
          <p class="hk-body">Nothing happens to the wall. The block stays exactly as the Head of
            Household built it, and the house spends the rest of the week bracing for a move that
            has already been decided against.</p>
          <p class="hk-quiet">An authority nobody spends is an authority nobody can trace.</p>
        </article>`;
      }
      return `<article class="hk-card">
        <p class="hk-cmd">EXEC hack_block --down=${E(String(hack.down).split(' ')[0])} --up=${E(String(hack.up).split(' ')[0])}</p>
        <div class="hk-swap">
          <figure class="hk-slot is-down">${AV(hack.down, 54)}<figcaption>${E(hack.down)}<br>REMOVED</figcaption></figure>
          <div class="hk-arrow">&#9654;&#9654;</div>
          <figure class="hk-slot is-up">${AV(hack.up, 54)}<figcaption>${E(hack.up)}<br>NOMINATED</figcaption></figure>
        </div>
        <p class="hk-body">The wall changes with nobody standing at it. <b>${E(hack.down)}</b> comes down;
          <b>${E(hack.up)}</b> goes up in the empty chair, and the ceremony everybody watched an hour
          ago is now a record of something that is no longer true.</p>
        ${hack.why ? `<p class="hk-quiet">${E(hack.why)}</p>` : ''}
        <p class="hk-out">NOTE: ${E(hack.down).toUpperCase()} IS NOT SAFE — STILL ELIGIBLE AS REPLACEMENT AT THE VETO CEREMONY</p>
      </article>`;
    }

    if (s.kind === 'truth') {
      return `<article class="hk-card hk-truth">
        <p class="hk-cmd">ONLY YOU KNOW THIS</p>
        <div class="hk-truthb">
          <figure>${AV(act.winner, 60)}<figcaption>${E(act.winner)}</figcaption></figure>
          <div>
            <p class="hk-body"><b>${E(act.winner)}</b> won the Hacker Competition${hack
  ? `, took ${E(hack.down)} off the block and put ${E(hack.up)} up`
  : ' and left the block alone'}.</p>
            <p class="hk-body hk-quiet">Nobody in that house is ever told this. Not at the ceremony,
              not at the vote, not on the way out the door. Two more authorities are still
              unspent, and the week does not know it yet.</p>
          </div>
        </div>
      </article>`;
    }

    const wrong = guesses.filter(g => !g.correct);
    return `<article class="hk-card">
      <p class="hk-cmd">WHAT THE HOUSE DECIDED INSTEAD — ${wrong.length}/${guesses.length} WRONG</p>
      <div class="hk-guesses">
        ${guesses.map(g => `<div class="hk-guess ${g.correct ? 'is-right' : 'is-wrong'}">
          <span>${AV(g.who, 24)}<b>${E(g.who)}</b></span><em>blames</em>
          <span>${AV(g.guess, 24)}<b>${E(g.guess)}</b></span>
          <i>${g.correct ? 'correct' : 'incorrect'}</i>
        </div>`).join('')}
      </div>
      <p class="hk-body hk-quiet">${wrong.length
    ? 'Every wrong name up there is a real enemy made this week by somebody who did nothing at all.'
    : 'The house read it correctly. It will not manage that every time.'}</p>
    </article>`;
  }).join('');

  const ctrl = `<div class="hk-ctrl">
    ${done ? '<span class="hk-done">THE HOUSE NEVER FINDS OUT.</span>' : `
      <button class="rp-btn" onclick="${reveal(ep, stateKey, Math.min(idx + 1, total - 1))}requestAnimationFrame(()=>{const c=document.querySelectorAll('.hk-card:not(.is-shut)');const e=c[c.length-1];if(e)e.scrollIntoView({behavior:'smooth',block:'center'});});">${
  idx < 0 ? 'Run it' : granted && !told ? 'Who was it' : 'Next'}</button>
      <button class="rp-btn rp-btn-ghost" onclick="${reveal(ep, stateKey, total - 1)}">Reveal all</button>`}
    <span class="hk-counter">${revealed} / ${total}</span>
  </div>`;

  return _shell(`${grid}${rail}<div class="hk-term">${cards}</div>${ctrl}`,
    `WEEK ${E(ep.num)} &middot; NOMINATIONS`,
    'PLAYED ALONE &middot; RESULT SEALED &middot; THREE AUTHORITIES');
}

/**
 * Eviction night: one ballot stops existing, in front of everybody, and the
 * count comes up short.
 */
export function rpBuildBBHackerVote(ep, act, u = {}) {
  if (!act || !act.voter) return '';
  const E = v => _E(u, v);
  const AV = (n, px) => _AV(u, n, px);
  const reveal = _REV(u);

  const stateKey = `bb_hackervote_${ep.num}${ep?._seg ? `_s${ep._seg}` : ''}`;
  if (!u.tvState) u.tvState = {};
  if (!u.tvState[stateKey]) u.tvState[stateKey] = { idx: -1 };
  const state = u.tvState[stateKey];

  const cast = (ep.votingLog || []).length;
  const believed = cast + 1;   // everybody who thinks they voted
  const steps = [{ kind: 'summons' }, { kind: 'strike' }, { kind: 'count' }, { kind: 'truth' }];
  const total = steps.length;
  const idx = state.idx;
  const revealed = Math.min(total, Math.max(0, idx + 1));
  const done = idx >= total - 1;

  const cards = steps.map((s, i) => {
    if (i > idx) return '<article class="hk-card is-shut"><span class="hk-lock">· · · · ·</span></article>';

    if (s.kind === 'summons') {
      return `<article class="hk-card">
        <p class="hk-cmd">EXEC hack_vote --target=${E(String(act.voter).split(' ')[0])}</p>
        <p class="hk-body"><b>${E(act.voter)}</b> is called in before the house votes and told two things:
          that tonight's ballot will not be counted, and that not one word of this may be said out loud.</p>
        <p class="hk-out">INSTRUCTION: SAY NOTHING · DURATION: PERMANENT</p>
      </article>`;
    }

    if (s.kind === 'strike') {
      return `<article class="hk-card">
        <p class="hk-cmd">VOID ballot</p>
        <div class="hk-ballot">
          ${AV(act.voter, 44)}
          <div>
            <p class="hk-body hk-strike">${E(act.voter)} votes to evict ${E(act.wouldHaveVoted)}.</p>
            <p class="hk-quiet">Cast, sealed, and gone before anybody counts it.</p>
          </div>
        </div>
      </article>`;
    }

    if (s.kind === 'count') {
      return `<article class="hk-card">
        <p class="hk-cmd">TALLY</p>
        <div class="hk-count">
          <span class="hk-cnum">BELIEVE THEY VOTED <b>${believed}</b></span>
          <span class="hk-cnum">VOTES READ OUT <b>${cast}</b></span>
          <span class="hk-cnum">DIFFERENCE <b>1</b></span>
        </div>
        <p class="hk-body">${act.flips
  ? `It is the vote the night turned on. <b>${E(act.saved)}</b> was leaving by one, and is not.`
  : act.levels
    ? `It levels the count, and a level count belongs to the Head of Household. <b>${E(act.saved)}</b> is now one tiebreak away from staying.`
    : 'It does not change who walks out of that door tonight — which is a thing the hacker gets to think about all week.'}</p>
        <p class="hk-body hk-quiet">The house is very good at arithmetic and has nothing else to do.
          By Sunday somebody will have worked out that a ballot went missing, and by Monday they will
          have decided, incorrectly, whose fault that is.</p>
      </article>`;
    }

    return `<article class="hk-card hk-truth">
      <p class="hk-cmd">ONLY YOU KNOW THIS</p>
      <div class="hk-truthb">
        <figure>${AV(act.winner, 56)}<figcaption>${E(act.winner)}</figcaption></figure>
        <div>
          <p class="hk-body"><b>${E(act.winner)}</b> cancelled it — the third authority, spent on the
            last night it existed.</p>
          <p class="hk-body hk-quiet">${E(act.voter)} will never know. The house will never know.
            The only person in that room who can connect the missing vote to a face is the one who
            took it.</p>
        </div>
      </div>
    </article>`;
  }).join('');

  const ctrl = `<div class="hk-ctrl">
    ${done ? '<span class="hk-done">ONE SHORT. NOBODY TO ASK.</span>' : `
      <button class="rp-btn" onclick="${reveal(ep, stateKey, Math.min(idx + 1, total - 1))}requestAnimationFrame(()=>{const c=document.querySelectorAll('.hk-card:not(.is-shut)');const e=c[c.length-1];if(e)e.scrollIntoView({behavior:'smooth',block:'center'});});">${idx < 0 ? 'Open the file' : 'Next'}</button>
      <button class="rp-btn rp-btn-ghost" onclick="${reveal(ep, stateKey, total - 1)}">Reveal all</button>`}
    <span class="hk-counter">${revealed} / ${total}</span>
  </div>`;

  return _shell(`${_rail({
    block: ep.hacker?.blockHack ? 'spent' : 'held',
    draw: ep.hacker?.vetoHack?.pick ? 'spent' : 'held',
    vote: 'spent',
  })}
    <div class="hk-term">${cards}</div>${ctrl}`,
  `WEEK ${E(ep.num)} &middot; EVICTION NIGHT`,
  'ONE BALLOT &middot; VOIDED &middot; UNATTRIBUTED');
}
