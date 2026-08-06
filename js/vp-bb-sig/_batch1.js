/**
 * Batch-one competition screens: the Zingbot, To Drink or to Bluff, Who Said
 * It?, Drunk Speeches, Punch Slap Kick and The Black Box.
 *
 * Six screens in one file because they share one skeleton and nothing else.
 * The skeleton — read the beats, build steps, reveal them one at a time, draw a
 * result strip — is the same eighty lines in every themed screen in this
 * directory, and a seventh copy of it per competition is how this folder gets
 * to ten thousand lines of near-identical scaffolding.
 *
 * What is NOT shared is the look. Each screen below declares its own palette,
 * its own frame, its own stage furniture and its own word for what a step is,
 * because a roast on a stage and a man being hit by a machine in the dark are
 * not the same night and must not render as the same card with a different
 * colour. See feedback: theme from the subject.
 */

const _esc = u => (typeof u?.esc === 'function' ? u.esc : v => String(v ?? ''));

/**
 * The shared skeleton. Everything visual arrives through `skin`.
 *
 * @param {object} skin
 *   prefix     unique css/state prefix
 *   accent     the screen's colour
 *   bg         the frame's background (a full css value)
 *   title/sub  the header
 *   stepLabel  what one revealed thing is called on the counter
 *   frame(inner, ctx)   optional wrapper drawing the stage furniture
 *   card(beat, i, ctx)  draws one revealed beat
 *   result(ctx)         the closing strip, drawn once everything is revealed
 */
function _screen(ep, actType, u, skin) {
  const act = (ep?.acts || []).find(a => a.type === actType);
  const comp = act?.competition;
  if (!act || !comp || act.secret) return '';
  const beats = (comp.beats || []).filter(b => b && b.text);
  if (!beats.length) return '';

  const esc = _esc(u);
  const tvState = u.tvState || {};
  const reveal = typeof u.reveal === 'function' ? u.reveal : () => '';
  const stateKey = `bb_sig_${skin.prefix}_${ep.num}_${actType}${ep?._seg ? `_s${ep._seg}` : ''}`;
  if (!tvState[stateKey]) tvState[stateKey] = { idx: -1 };
  const state = tvState[stateKey];
  const done = state.idx >= beats.length - 1;

  const breakdown = comp.breakdown || comp.debug?.scoreBreakdown || {};
  const ctx = {
    esc, comp, act, ep, actType, breakdown,
    winner: act.winner || comp.winner || null,
    placements: comp.placements || [],
    detail: comp.detail || null,
    accent: skin.accent,
  };

  let inner = '';
  beats.forEach((b, i) => {
    inner += i <= state.idx
      ? skin.card(b, i, ctx)
      : `<div style="margin-bottom:8px;padding:11px;border:1px dashed ${skin.accent}33;border-radius:6px;opacity:.22;text-align:center;font-size:10px;letter-spacing:2px;color:${skin.accent}">• • •</div>`;
  });

  const body = skin.frame ? skin.frame(inner, ctx) : inner;
  const tail = done && skin.result ? skin.result(ctx) : '';

  return `<div class="rp-page" style="background:${skin.bg};border-radius:10px;padding:16px 14px">
    <div style="text-align:center;margin-bottom:4px;font-size:9px;letter-spacing:3px;color:${skin.accent}aa">${esc(skin.eyebrow || (actType === 'veto' ? 'POWER OF VETO' : 'HEAD OF HOUSEHOLD'))}</div>
    <div style="text-align:center;font-family:var(--font-display);font-size:24px;letter-spacing:2px;color:${skin.accent};text-shadow:0 0 22px ${skin.accent}55">${esc(skin.title)}</div>
    <div style="text-align:center;font-size:11px;color:#8b949e;margin:4px 0 14px">${esc(skin.sub)}</div>
    ${body}
    ${tail}
    <div style="display:flex;gap:8px;justify-content:center;margin-top:14px">
      ${done ? '' : `<button class="rp-btn" onclick="${reveal(ep, stateKey, Math.min(state.idx + 1, beats.length - 1))}">${esc(skin.stepLabel || 'Reveal next')}</button>`}
      ${done ? '' : `<button class="rp-btn rp-btn-ghost" onclick="${reveal(ep, stateKey, beats.length - 1)}">Reveal all</button>`}
      <span style="align-self:center;font-size:10px;color:var(--muted);letter-spacing:1px">${Math.min(beats.length, Math.max(0, state.idx + 1))} / ${beats.length}</span>
    </div>
  </div>`;
}

/** A result strip every screen can use, in its own colours. */
function _podium(ctx, label, valueOf) {
  const rows = (ctx.placements || []).slice(0, 5).map((name, i) => {
    const v = valueOf ? valueOf(ctx.breakdown[name] || {}, name) : '';
    return `<div style="display:flex;align-items:center;gap:8px;margin-bottom:3px">
      <div style="width:16px;font-size:10px;color:${i === 0 ? ctx.accent : '#8b949e'}">${i + 1}</div>
      <div style="flex:1;font-size:11px;color:${i === 0 ? '#e6edf3' : '#c9d1d9'}">${ctx.esc(name)}</div>
      <div style="font-size:10px;color:${ctx.accent}cc">${ctx.esc(v)}</div>
    </div>`;
  }).join('');
  return `<div style="margin-top:14px;padding:11px;border-radius:8px;border:1px solid ${ctx.accent}44;background:#00000055">
    <div style="font-size:9px;letter-spacing:2px;color:${ctx.accent};margin-bottom:7px">${ctx.esc(label)}</div>${rows}</div>`;
}

// ══════════════════════════════════════════════════════════════════════
// 1. The Zingbot — a roast on a lit stage
// ══════════════════════════════════════════════════════════════════════

const _ZING_BOT = `<svg viewBox="0 0 64 64" width="54" height="54" aria-hidden="true">
  <rect x="18" y="20" width="28" height="24" rx="4" fill="#c0c6d0" stroke="#7d8590" stroke-width="2"/>
  <rect x="24" y="27" width="16" height="8" rx="2" fill="#111" stroke="#3fb950"/>
  <circle cx="29" cy="31" r="2" fill="#3fb950"/><circle cx="35" cy="31" r="2" fill="#3fb950"/>
  <rect x="27" y="38" width="10" height="2" fill="#7d8590"/>
  <line x1="32" y1="20" x2="32" y2="12" stroke="#7d8590" stroke-width="2"/><circle cx="32" cy="10" r="3" fill="#f0a500"/>
  <rect x="12" y="26" width="6" height="12" rx="2" fill="#9aa2ad"/><rect x="46" y="26" width="6" height="12" rx="2" fill="#9aa2ad"/>
  <rect x="22" y="44" width="20" height="10" rx="2" fill="#8b949e"/>
</svg>`;

export function rpBuildSigZingbot(ep, actType, u = {}) {
  return _screen(ep, actType, u, {
    prefix: 'zing', accent: '#f0a500',
    bg: 'radial-gradient(120% 80% at 50% 0%, #2a1d02 0%, #120c00 60%, #0a0a0a 100%)',
    title: 'THE ZINGBOT', sub: 'It has come a very long way to be rude to everybody.',
    stepLabel: 'Next zing',
    frame: (inner, ctx) => `<div style="text-align:center;margin-bottom:10px">${_ZING_BOT}</div>
      <div style="border-top:1px solid ${ctx.accent}33;padding-top:12px">${inner}</div>`,
    card: (b, i, ctx) => {
      const zing = /ZING!/.test(b.text);
      const landed = b.badgeText === 'THAT ONE LANDED';
      return `<div style="margin-bottom:8px;padding:11px 12px;border-radius:8px;
        border:1px solid ${zing ? (landed ? '#f8514966' : ctx.accent + '55') : '#30363d'};
        background:${zing ? (landed ? 'rgba(248,81,73,.07)' : 'rgba(240,165,0,.06)') : 'rgba(255,255,255,.02)'};
        ${zing ? `box-shadow:0 0 18px ${landed ? 'rgba(248,81,73,.12)' : 'rgba(240,165,0,.10)'} inset;` : ''}">
        <div style="font-size:8.5px;letter-spacing:2px;color:${landed ? '#f85149' : ctx.accent};margin-bottom:5px">${ctx.esc(b.badgeText || 'ZING')}</div>
        <div style="font-size:11.5px;line-height:1.55;color:#e6edf3">${b.text}</div>
      </div>`;
    },
    result: ctx => _podium(ctx, 'ZINGS MATCHED', row => (row.correct != null ? `${row.correct}/${row.asked}` : '')),
  });
}

// ══════════════════════════════════════════════════════════════════════
// 2. To Drink or to Bluff — a lit table, and one bad glass
// ══════════════════════════════════════════════════════════════════════

const _GLASS = (poisoned, size = 26) => `<svg viewBox="0 0 24 34" width="${size}" height="${size * 1.4}" aria-hidden="true">
  <path d="M5 4 h14 l-2 14 a5 5 0 0 1 -10 0 z" fill="${poisoned ? '#2f6b3a' : '#3b4a5a'}" stroke="#c9d1d9" stroke-width="1.2"/>
  <line x1="12" y1="24" x2="12" y2="29" stroke="#c9d1d9" stroke-width="1.4"/>
  <rect x="7" y="29" width="10" height="1.8" rx="0.9" fill="#c9d1d9"/>
  ${poisoned ? '<circle cx="12" cy="12" r="1.6" fill="#7ee787"><animate attributeName="cy" values="16;7" dur="2.2s" repeatCount="indefinite"/></circle>' : ''}
</svg>`;

export function rpBuildSigDrinkOrBluff(ep, actType, u = {}) {
  return _screen(ep, actType, u, {
    prefix: 'bluff', accent: '#7ee787',
    bg: 'radial-gradient(100% 70% at 50% 10%, #10251a 0%, #0b1410 55%, #080c0a 100%)',
    title: 'TO DRINK OR TO BLUFF', sub: 'One glass is worse than the others. Only one person knows which.',
    stepLabel: 'Next round',
    frame: (inner, ctx) => {
      const n = Math.min(6, (ctx.act.participants || []).length || 5);
      const row = Array.from({ length: n }, (_, i) => _GLASS(false, 20)).join('');
      return `<div style="display:flex;justify-content:center;gap:6px;margin-bottom:12px;opacity:.75">${row}</div>${inner}`;
    },
    card: (b, i, ctx) => {
      const caught = b.badgeText === 'CAUGHT';
      const gotAway = b.badgeText === 'GOT AWAY WITH IT';
      const verdict = caught || gotAway;
      return `<div style="margin-bottom:8px;padding:11px 12px;border-radius:8px;display:flex;gap:10px;align-items:flex-start;
        border:1px solid ${verdict ? (gotAway ? ctx.accent + '66' : '#f8514966') : '#30363d'};
        background:${verdict ? (gotAway ? 'rgba(126,231,135,.07)' : 'rgba(248,81,73,.07)') : 'rgba(255,255,255,.02)'}">
        ${verdict ? `<div style="flex:0 0 auto">${_GLASS(gotAway, 18)}</div>` : ''}
        <div style="flex:1">
          <div style="font-size:8.5px;letter-spacing:2px;color:${gotAway ? ctx.accent : caught ? '#f85149' : '#8b949e'};margin-bottom:5px">${ctx.esc(b.badgeText || '')}</div>
          <div style="font-size:11.5px;line-height:1.55;color:#e6edf3">${b.text}</div>
        </div>
      </div>`;
    },
    result: ctx => _podium(ctx, 'POINTS', row => `${row.points ?? 0} pts${row.bluffsHeld ? ` · ${row.bluffsHeld} bluff${row.bluffsHeld === 1 ? '' : 's'} held` : ''}`),
  });
}

// ══════════════════════════════════════════════════════════════════════
// 3. Who Said It? — statements on a board
// ══════════════════════════════════════════════════════════════════════

export function rpBuildSigWhoSaidIt(ep, actType, u = {}) {
  return _screen(ep, actType, u, {
    prefix: 'wsi', accent: '#58a6ff',
    bg: 'linear-gradient(180deg,#0d1b2a 0%,#0a1420 60%,#080f18 100%)',
    title: 'WHO SAID IT?', sub: 'Every statement is true of exactly one person in this house.',
    stepLabel: 'Next statement',
    card: (b, i, ctx) => {
      // The quoted half is the evidence and gets the board; the rest is the room.
      const quote = (b.text.match(/"([^"]+)"/) || [])[1];
      const rest = quote ? b.text.replace(`"${quote}"`, '').trim() : b.text;
      return `<div style="margin-bottom:9px">
        ${quote ? `<div style="padding:12px 14px;border-radius:6px;border-left:3px solid ${ctx.accent};
          background:rgba(88,166,255,.07);font-size:12.5px;line-height:1.5;color:#e6edf3;font-style:italic">"${ctx.esc(quote)}"</div>` : ''}
        <div style="padding:8px 4px 0;font-size:11px;color:#c9d1d9">${quote ? rest : b.text}</div>
      </div>`;
    },
    result: ctx => _podium(ctx, 'CORRECT ANSWERS', row => (row.correct != null ? `${row.correct}/${row.asked}` : '')),
  });
}

// ══════════════════════════════════════════════════════════════════════
// 4. Drunk Speeches — a tape running slow
// ══════════════════════════════════════════════════════════════════════

const _WAVE = accent => `<svg viewBox="0 0 240 26" width="100%" height="26" preserveAspectRatio="none" aria-hidden="true">
  ${Array.from({ length: 40 }, (_, i) => {
    const h = 4 + ((i * 37) % 17);
    return `<rect x="${i * 6}" y="${13 - h / 2}" width="3" height="${h}" fill="${accent}" opacity="${0.25 + (i % 5) * 0.12}"/>`;
  }).join('')}
</svg>`;

export function rpBuildSigDrunkSpeeches(ep, actType, u = {}) {
  return _screen(ep, actType, u, {
    prefix: 'drunk', accent: '#bc8cff',
    bg: 'linear-gradient(180deg,#1b1226 0%,#140e1c 60%,#0c0912 100%)',
    title: 'DRUNK SPEECHES', sub: 'The tape is slowed until nobody sounds like themselves. Name the day.',
    stepLabel: 'Play the next one',
    frame: (inner, ctx) => `<div style="margin-bottom:12px;padding:8px 10px;border:1px solid ${ctx.accent}33;border-radius:6px;background:#00000055">
      ${_WAVE(ctx.accent)}
      <div style="text-align:center;font-size:8.5px;letter-spacing:3px;color:${ctx.accent}99;margin-top:4px">PLAYBACK · 0.66×</div>
    </div>${inner}`,
    card: (b, i, ctx) => {
      const quote = (b.text.match(/"([^"]+)"/) || [])[1];
      const rest = quote ? b.text.replace(`"${quote}"`, '').trim() : b.text;
      return `<div style="margin-bottom:9px;padding:11px 12px;border-radius:8px;border:1px solid ${ctx.accent}33;background:rgba(188,140,255,.05)">
        <div style="font-size:8.5px;letter-spacing:2px;color:${ctx.accent};margin-bottom:6px">${ctx.esc(b.badgeText || '')}</div>
        ${quote ? `<div style="font-size:12.5px;line-height:1.6;color:#e6edf3;letter-spacing:1.5px;font-style:italic">"${ctx.esc(quote)}"</div>` : ''}
        <div style="padding-top:7px;font-size:11px;color:#c9d1d9">${quote ? rest : b.text}</div>
      </div>`;
    },
    result: ctx => _podium(ctx, 'DAYS DATED CORRECTLY', row => (row.correct != null ? `${row.correct}/${row.asked}` : '')),
  });
}

// ══════════════════════════════════════════════════════════════════════
// 5. Punch, Slap, Kick — the contraption
// ══════════════════════════════════════════════════════════════════════

export function rpBuildSigPunchSlapKick(ep, actType, u = {}) {
  return _screen(ep, actType, u, {
    prefix: 'psk', accent: '#f85149',
    bg: 'radial-gradient(90% 70% at 50% 0%, #2a1010 0%, #170a0a 55%, #0b0606 100%)',
    title: 'PUNCH, SLAP, KICK', sub: 'Remember the order. While it is happening to you.',
    stepLabel: 'Next houseguest',
    card: (b, i, ctx) => {
      const n = Number((b.badgeText || '').match(/^(\d+)/)?.[1] || 0);
      // The sequence they survived, drawn as the hits themselves.
      const hits = Array.from({ length: Math.min(9, Math.max(1, n)) }, (_, k) =>
        `<div style="width:9px;height:9px;border-radius:2px;background:${k < n ? ctx.accent : '#30363d'};opacity:${k < n ? 1 : .4}"></div>`).join('');
      return `<div style="margin-bottom:8px;padding:11px 12px;border-radius:8px;border:1px solid ${n >= 4 ? ctx.accent + '55' : '#30363d'};background:rgba(248,81,73,.04)">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
          <div style="display:flex;gap:3px">${hits}</div>
          <div style="font-size:8.5px;letter-spacing:2px;color:${n >= 4 ? ctx.accent : '#8b949e'}">${ctx.esc(b.badgeText || '')}</div>
        </div>
        <div style="font-size:11.5px;line-height:1.55;color:#e6edf3">${b.text}</div>
      </div>`;
    },
    result: ctx => _podium(ctx, 'LONGEST CLEAN SEQUENCE', row => (row.sequence != null ? `${row.sequence} hits` : '')),
  });
}

// ══════════════════════════════════════════════════════════════════════
// 6. The Black Box — the screen goes dark
// ══════════════════════════════════════════════════════════════════════

export function rpBuildSigBlackBox(ep, actType, u = {}) {
  return _screen(ep, actType, u, {
    prefix: 'box', accent: '#8b949e',
    bg: 'radial-gradient(70% 50% at 50% 40%, #14171c 0%, #0a0c0f 55%, #000 100%)',
    title: 'THE BLACK BOX', sub: 'No light at all. Find it by hand or do not find it.',
    stepLabel: 'Open the door',
    card: (b, i, ctx) => {
      const placed = Number((b.badgeText || '').match(/(\d+)/)?.[1] || 0);
      const markers = Array.from({ length: 5 }, (_, k) =>
        `<div style="width:10px;height:10px;border-radius:50%;border:1px solid #30363d;background:${k < placed ? '#c9d1d9' : 'transparent'};box-shadow:${k < placed ? '0 0 8px rgba(201,209,217,.5)' : 'none'}"></div>`).join('');
      return `<div style="margin-bottom:8px;padding:11px 12px;border-radius:8px;border:1px solid #21262d;background:rgba(255,255,255,.015)">
        <div style="display:flex;align-items:center;gap:9px;margin-bottom:6px">
          <div style="display:flex;gap:4px">${markers}</div>
          <div style="font-size:8.5px;letter-spacing:2px;color:${placed >= 3 ? '#c9d1d9' : '#6e7681'}">${ctx.esc(b.badgeText || '')}</div>
        </div>
        <div style="font-size:11.5px;line-height:1.55;color:#adbac7">${b.text}</div>
      </div>`;
    },
    result: ctx => _podium(ctx, 'PLACED · TIME', (row) => {
      if (row.placed == null) return '';
      const s = Number(row.seconds) || 0;
      return `${row.placed}/5 · ${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
    }),
  });
}
