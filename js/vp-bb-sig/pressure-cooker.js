// ══════════════════════════════════════════════════════════════════════
// VP — PRESSURE COOKER: "THE 14-HOUR CLOCK"
// ══════════════════════════════════════════════════════════════════════
//
// The signature screen for bb-comps/signature.js → pressureCooker.
//
// The generic competition board is a sorted list, which is the wrong shape for
// this comp: Pressure Cooker is a CLOCK. Nobody scores anything. People simply
// stop being in the box, one at a time, at a time the viewer can read off the
// wall — and between the drops a mystery box opens and hands ONE named holder a
// decision nobody else in the room is offered. The screen therefore reveals
// chronologically, not by placement: every step is a minute of a marathon.
//
// Everything drawn here is read out of the competition's own beats — the hour
// stamps, the box numbers, the prize labels, the punishment lines, the grinder
// holds. Nothing is invented except the gauge readouts, which are deterministic
// on (ep.num, step index) so a rewatch is identical.
//
// This file imports NOTHING. Every helper it needs arrives on `u`:
//   { tvState, reveal, avatar, esc, cat, ordinal }
// ══════════════════════════════════════════════════════════════════════

// ── deterministic flavour ─────────────────────────────────────────────
// No Math.random anywhere on this screen: a VP screen is rebuilt from scratch
// on every single reveal click, so anything random would reshuffle the whole
// history of the competition every time the viewer pressed Next.
const _pick = (arr, seed) => arr[((seed % arr.length) + arr.length) % arr.length];

const GAUGE_DROP = [
  'INTERNAL TEMP HOLDING · ONE CONTACT PLATE GOES DARK',
  'CONTACT LOST · THE HORN RUNS FOR FOUR SECONDS AND STOPS',
  'PLATE RELEASED · THE BOX GETS QUIETER, NOT CALMER',
  'HAND OFF GLASS · THE OTHERS DO NOT LOOK OVER, ON PURPOSE',
  'CIRCUIT OPEN · SOMEBODY OUTSIDE WRITES DOWN A TIME',
  'ONE BUTTON RETURNS TO REST · NOBODY SAYS ANYTHING KIND',
];

const GAUGE_BOX = [
  'HATCH CYCLING · PRESSURE VENTS AND THE SMELL CHANGES',
  'OFFER LIVE · THE OTHER PLATES ARE STILL BEING WATCHED',
  'ONE NAME ON THE CARD · EVERYBODY ELSE PLAYS A DIFFERENT GAME NOW',
  'SEAL BROKEN ON A SINGLE COMPARTMENT · CAMERA MOVES IN',
  'LID UP · THE ROOM DOES THE ARITHMETIC OUT LOUD',
];

const GAUGE_PUNISH = [
  'ENVIRONMENT OVERRIDE · APPLIED TO EVERY PLATE STILL CLOSED',
  'CONDITIONS ADJUSTED · NO OPT-OUT ON THIS ONE',
  'HOUSE CONTROL ENGAGED · THE BOX ARGUES WITH ITSELF',
  'AMBIENT PENALTY LIVE · FATIGUE CURVE STEEPENS FOR ALL',
  'SYSTEM SPITE · THIS IS NOT AIMED AT ANYBODY IN PARTICULAR, WHICH IS WORSE',
];

const GAUGE_HOLD = [
  'PLATE STEADY · NO CHANGE IN THIRTY-EIGHT MINUTES',
  'STILL CLOSED · THE CLOCK IS THE ONLY THING MOVING',
  'CONTACT MAINTAINED · WHATEVER THIS COSTS IS BEING PAID QUIETLY',
  'GRIP NOMINAL · NOMINAL IS DOING A LOT OF WORK IN THAT SENTENCE',
  'HOLDING · THE GLASS HAS A HANDPRINT ON IT THAT WILL NOT WIPE OFF',
];

// ── beat parsing ──────────────────────────────────────────────────────
// The engine writes hours and box numbers into the prose, because the prose is
// where a viewer reads them. Pulling them back out is the only way the clock on
// this screen can agree with the clock in the narration.
const _hourFrom = t => {
  // The digits are followed by the sentence's full stop — "Hour 1.9. Dee
  // slides down the glass" — so a greedy [\d.]+ swallows it and yields "1.9.",
  // which is NaN, which renders as HOUR 0.0 on every card. Match the number
  // shape explicitly and refuse anything that is not finite.
  const m = /^Hour\s+(\d+(?:\.\d+)?)/.exec(t || '');
  if (m) { const v = Number(m[1]); return Number.isFinite(v) ? v : null; }
  const f = /^(\d+(?:\.\d+)?)\s+hours after the door sealed/.exec(t || '');
  if (!f) return null;
  const v = Number(f[1]);
  return Number.isFinite(v) ? v : null;
};
const _boxFrom = t => {
  const m = /^Box\s+(\d+)\s+opens/.exec(t || '');
  return m ? Number(m[1]) : null;
};
const _prizeFrom = t => {
  const m = /opens on (.+?), and it is offered to/.exec(t || '');
  return m ? m[1] : null;
};
/** Which dial the punishment moved — the engine has exactly four. */
const _punKind = t => {
  const s = String(t || '').toLowerCase();
  if (s.includes('the heat goes up') || s.includes(' heat ')) return 'heat';
  if (s.includes('the cold comes on') || s.includes(' cold ')) return 'cold';
  if (s.includes('strobe') || s.includes('lights')) return 'light';
  if (s.includes('a single tone') || s.includes('volume')) return 'noise';
  return 'heat';
};
const PUN_META = {
  heat: { label: 'HEAT', tint: '#ff7a2f' },
  cold: { label: 'COLD', tint: '#6fd0ff' },
  light: { label: 'LIGHT', tint: '#ffe14d' },
  noise: { label: 'NOISE', tint: '#c98bff' },
};

// ── inline SVG furniture ──────────────────────────────────────────────

/**
 * The wall clock, wound to the hour currently revealed.
 *
 * Fourteen divisions rather than twelve, because the comp is not measured in
 * afternoons — it is measured in how long a thumb lasts. The dial stretches if
 * a season runs long so the hand can never lap itself and lie.
 */
function _clock(hour, dialMax) {
  const frac = Math.max(0, Math.min(1, hour / dialMax));
  const deg = frac * 360;
  const R = 46, C = 2 * Math.PI * R;
  const ticks = [];
  for (let i = 0; i < dialMax; i++) {
    const a = (i / dialMax) * 2 * Math.PI - Math.PI / 2;
    const big = i % 7 === 0;
    const r1 = big ? 36 : 40, r2 = 45;
    ticks.push(`<line x1="${(60 + Math.cos(a) * r1).toFixed(1)}" y1="${(60 + Math.sin(a) * r1).toFixed(1)}"
      x2="${(60 + Math.cos(a) * r2).toFixed(1)}" y2="${(60 + Math.sin(a) * r2).toFixed(1)}"
      stroke="${big ? '#f2d06b' : '#7a6a33'}" stroke-width="${big ? 2.4 : 1.2}"/>`);
  }
  return `<svg class="sgc-clock" viewBox="0 0 120 120" role="img" aria-label="Hour ${hour}">
    <defs>
      <radialGradient id="sgcFace" cx="42%" cy="34%">
        <stop offset="0%" stop-color="#3b3517"/><stop offset="70%" stop-color="#1e1c0d"/>
        <stop offset="100%" stop-color="#100f07"/>
      </radialGradient>
    </defs>
    <circle cx="60" cy="60" r="55" fill="#0a0a06" stroke="#5c4f22" stroke-width="3"/>
    <circle cx="60" cy="60" r="50" fill="url(#sgcFace)" stroke="#2c2811" stroke-width="1"/>
    <circle class="sgc-arc" cx="60" cy="60" r="${R}" fill="none" stroke="#f0c53a" stroke-width="3"
      stroke-linecap="round" stroke-dasharray="${(C * frac).toFixed(1)} ${C.toFixed(1)}"
      transform="rotate(-90 60 60)" opacity="0.85"/>
    ${ticks.join('')}
    <g transform="rotate(${deg.toFixed(2)} 60 60)">
      <line x1="60" y1="62" x2="60" y2="24" stroke="#fff3c4" stroke-width="3" stroke-linecap="round"/>
      <line x1="60" y1="62" x2="60" y2="34" stroke="#ff8b3d" stroke-width="1.4" stroke-linecap="round"/>
    </g>
    <circle cx="60" cy="60" r="4.4" fill="#f0c53a" stroke="#120f06" stroke-width="1.6"/>
  </svg>`;
}

/** The mystery box, lid up or lid shut depending on how the offer went. */
function _boxIcon(taken) {
  const lid = taken ? 'rotate(-32 14 26)' : 'rotate(-8 14 26)';
  return `<svg class="sgc-boxicon ${taken ? 'is-taken' : ''}" viewBox="0 0 72 60" aria-hidden="true">
    <g transform="${lid}">
      <rect x="10" y="16" width="52" height="10" rx="2" fill="#4a3c14" stroke="#c9a23a" stroke-width="1.6"/>
      <rect x="31" y="16" width="10" height="10" fill="#c9a23a" opacity="0.65"/>
    </g>
    <rect x="12" y="26" width="48" height="28" rx="2" fill="#241f0c" stroke="#c9a23a" stroke-width="1.6"/>
    <rect x="31" y="26" width="10" height="28" fill="#c9a23a" opacity="0.45"/>
    <path d="M12 32 h48" stroke="#7d6420" stroke-width="1"/>
    ${taken ? `<circle cx="36" cy="12" r="5" fill="none" stroke="#ffd75e" stroke-width="1.6" opacity="0.9"/>` : ''}
  </svg>`;
}

/** A pressure dial — used for punishments and for the header read-out. */
function _dial(pct, tint, label) {
  const a = -Math.PI * 0.75 + Math.max(0, Math.min(1, pct)) * Math.PI * 1.5;
  return `<svg class="sgc-dial" viewBox="0 0 60 46" aria-hidden="true">
    <path d="M6 38 A24 24 0 0 1 54 38" fill="none" stroke="#3a3316" stroke-width="5" stroke-linecap="round"/>
    <path d="M6 38 A24 24 0 0 1 54 38" fill="none" stroke="${tint}" stroke-width="5" stroke-linecap="round"
      stroke-dasharray="${(Math.max(0, Math.min(1, pct)) * 56).toFixed(1)} 200" opacity="0.9"/>
    <line x1="30" y1="38" x2="${(30 + Math.cos(a) * 19).toFixed(1)}" y2="${(38 + Math.sin(a) * 19).toFixed(1)}"
      stroke="#fff0c0" stroke-width="2" stroke-linecap="round"/>
    <circle cx="30" cy="38" r="3" fill="${tint}"/>
    <text x="30" y="14" text-anchor="middle" font-size="8" fill="#b9a765" font-family="monospace">${label}</text>
  </svg>`;
}

/** A thumb still on a plate — the strip icon over each avatar still inside. */
const _plate = () => `<svg class="sgc-plate" viewBox="0 0 28 10" aria-hidden="true">
  <rect x="1" y="3" width="26" height="6" rx="3" fill="#2a2410" stroke="#c9a23a" stroke-width="1.2"/>
  <rect x="9" y="1" width="10" height="5" rx="2.5" fill="#f0c53a" opacity="0.85"/></svg>`;

// ── the screen ────────────────────────────────────────────────────────

export function rpBuildSigPressureCooker(ep, actType, u) {
  const act = (ep?.acts || []).find(a => a.type === actType);
  const comp = act?.competition;
  // The Invisible HOH seals the result; a screen whose entire spine is "watch
  // the last thumb come off" cannot keep that secret, so it stands down and
  // lets the generic sealed board run instead.
  if (!act || !comp || act.secret || !(act.results || []).length) return '';

  const isHoh = actType === 'hoh';
  const cat = u.cat(comp.category);
  const esc = u.esc;
  const stateKey = `bb_sig_cooker_${ep.num}_${actType}${ep?._seg ? `_s${ep._seg}` : ''}`;
  if (!u.tvState[stateKey]) u.tvState[stateKey] = { idx: -1 };
  const state = u.tvState[stateKey];

  const rows = (act.results || []).map((r, i) => ({ ...r, place: i + 1 }));
  const winner = act.winner || rows[0]?.name;
  // The dispatcher normalises a competition result and files the per-player
  // numbers under debug.scoreBreakdown; only a RAW engine result (unit tests,
  // direct simulate calls) carries them at the top level. Reading just one of
  // the two renders every stat on this screen as zero.
  const breakdown = comp.breakdown || comp.debug?.scoreBreakdown || {};
  const satOut = (comp.excluded || []).filter(Boolean);
  const field = (act.participants || []).filter(Boolean).length
    ? act.participants.filter(Boolean) : rows.map(r => r.name);

  // ── every beat, in the order it happened, with the clock read off it ──
  const inside = new Set(field);
  let hour = 0, box = 0;
  const steps = (comp.beats || []).map((b, i) => {
    const text = String(b?.text || '');
    const bt = String(b?.badgeText || '').toUpperCase();
    const who = (b?.players || []).filter(Boolean);
    const h = _hourFrom(text);
    if (h !== null) hour = h;
    const bx = _boxFrom(text);
    if (bx !== null) box = bx;

    const kind = bt === 'SEALED IN' ? 'seal'
      : bt === 'TOOK THE PRIZE' ? 'took'
      : bt === 'REFUSED THE PRIZE' ? 'refused'
      : bt === 'PUNISHMENT' ? 'punish'
      : bt === 'STILL HOLDING' ? 'hold'
      : (bt === 'HOH' || bt === 'VETO') ? 'win'
      : 'drop';

    const leaver = (kind === 'drop' || kind === 'took') ? who[0] : null;
    const before = inside.size;
    // Placement falls out of the room: dropping while five thumbs are down is
    // fifth place, and the screen should say so without consulting the board.
    const place = leaver ? before : null;
    if (leaver) inside.delete(leaver);

    return {
      i, kind, text, who, hour, box,
      threw: bt === 'THREW IT',
      badge: bt,
      leaver, place,
      prize: kind === 'took' ? (breakdown[leaver]?.tookPrize || _prizeFrom(text))
        : kind === 'refused' ? _prizeFrom(text) : null,
      pun: kind === 'punish' ? _punKind(text) : null,
      holdingAfter: Array.from(inside),
      // The last two thumbs in a glass box is its own genre of television.
      duel: inside.size === 2 && kind !== 'win',
    };
  });

  const total = steps.length;
  if (!total) return '';
  const revealed = Math.max(0, Math.min(total, state.idx + 1));
  const done = state.idx >= total - 1;
  const cur = state.idx >= 0 ? steps[Math.min(state.idx, total - 1)] : null;

  const finalHour = steps.reduce((m, s) => Math.max(m, s.hour || 0), 0);
  const dialMax = Math.max(14, Math.ceil(finalHour));
  const shownHour = cur ? cur.hour : 0;
  const shownBox = cur ? cur.box : 0;
  const holding = cur ? cur.holdingAfter : field.slice();
  const inDuel = !!(cur && (cur.duel || (holding.length === 2 && !done)));

  // Fatigue read-out: the drag the engine has actually applied to whoever is
  // still in there, averaged, so the header dial means something real.
  const drags = holding.map(n => Number(breakdown[n]?.fatigueDrag) || 0);
  const avgDrag = drags.length ? drags.reduce((a, b) => a + b, 0) / drags.length : 0;

  const weights = Object.entries(comp.stats || {}).sort((a, b) => b[1] - a[1]).slice(0, 4);

  // ── header: the wall, the clock, the gauges ──
  const header = `<div class="sgc-wall">
    <div class="sgc-clockwrap">
      ${_clock(shownHour, dialMax)}
      <div class="sgc-hour">HOUR <b>${shownHour ? shownHour.toFixed(1) : '0.0'}</b></div>
      <div class="sgc-hourcap">of a ${dialMax}-hour face</div>
    </div>
    <div class="sgc-readout">
      <div class="sgc-comp">${esc(comp.name || 'Pressure Cooker')}</div>
      <div class="sgc-catrow"><span class="sgc-cat" style="color:${cat.accent};border-color:${cat.accent}66">${esc(cat.label)}</span>
        <span class="sgc-for">${isHoh ? 'FOR HEAD OF HOUSEHOLD' : 'FOR THE POWER OF VETO'}</span></div>
      ${comp.desc ? `<p class="sgc-desc">${esc(comp.desc)}</p>` : ''}
      ${weights.length ? `<div class="sgc-weights">${weights.map(([s, w]) => `<span class="sgc-w">
        <i>${esc(s)}</i><span class="sgc-wbar"><b style="width:${Math.round(w * 100)}%"></b></span><u>${Math.round(w * 100)}%</u>
      </span>`).join('')}</div>` : ''}
      <div class="sgc-gauges">
        <div class="sgc-gauge">${_dial(shownBox / Math.max(1, field.length + 4), '#c9a23a', 'BOXES')}<span>${shownBox} opened</span></div>
        <div class="sgc-gauge">${_dial(1 - holding.length / Math.max(1, field.length), '#ff7a2f', 'EMPTY')}<span>${field.length - holding.length} out of ${field.length}</span></div>
        <div class="sgc-gauge">${_dial(Math.min(1, avgDrag / 4), '#6fd0ff', 'FATIGUE')}<span>${avgDrag.toFixed(2)} drag</span></div>
      </div>
      ${satOut.length ? `<div class="sgc-sat">Sat out — outside the glass: ${satOut.map(esc).join(' · ')}${
        isHoh && act.outgoingHoh ? ` · ${esc(act.outgoingHoh)} cannot defend the room` : ''}</div>` : ''}
    </div>
  </div>`;

  // ── the strip of thumbs still down ──
  const strip = `<div class="sgc-strip ${inDuel ? 'is-duel' : ''}">
    <div class="sgc-strip-h">${inDuel ? 'TWO THUMBS LEFT' : 'HANDS STILL ON THE BUTTON'}
      <span>${holding.length}/${field.length}</span></div>
    <div class="sgc-strip-row">
      ${field.map(n => {
        const still = holding.includes(n);
        return `<span class="sgc-hand ${still ? '' : 'is-off'}" title="${esc(n)}">
          ${still ? _plate() : '<span class="sgc-plate-off"></span>'}
          ${u.avatar(n, 34)}
          <em>${esc(String(n).split(' ')[0])}</em></span>`;
      }).join('')}
    </div>
  </div>`;

  // ── the marathon, one moment at a time ──
  const cards = steps.map((s, i) => {
    if (i > state.idx) {
      return `<div class="sgc-step is-hidden"><div class="sgc-locked">&#183;</div></div>`;
    }
    const stamp = s.hour ? `HOUR ${s.hour.toFixed(1)}` : 'HOUR 0.0';
    const avs = s.who.slice(0, 4).map(n => u.avatar(n, 36)).join('');

    if (s.kind === 'seal') {
      return `<div class="sgc-step"><article class="sgc-card sgc-seal">
        <div class="sgc-stamp">${stamp}</div>
        <div class="sgc-badge sgc-b-seal">${esc(s.badge || 'SEALED IN')}</div>
        <div class="sgc-body"><div class="sgc-avs">${avs}</div><p>${esc(s.text)}</p></div>
        <div class="sgc-gaugetext">DOOR SEALED &#183; ${field.length} PLATES CLOSED &#183; CLOCK RUNNING</div>
      </article></div>`;
    }

    if (s.kind === 'win') {
      const bd = breakdown[winner] || {};
      return `<div class="sgc-step"><article class="sgc-card sgc-win">
        <div class="sgc-neon">${isHoh ? 'HEAD OF HOUSEHOLD' : 'POWER OF VETO'}</div>
        <div class="sgc-winbody">
          <div class="sgc-winav">${u.avatar(winner, 92)}</div>
          <div>
            <div class="sgc-winname">${esc(winner)}</div>
            <p>${esc(s.text)}</p>
            <div class="sgc-winstats">
              <span><b>${(Number(bd.hoursHeld) || s.hour || 0).toFixed(1)}</b>hours held</span>
              <span><b>${Number(bd.boxesOpened) || s.box || 0}</b>boxes opened</span>
              <span><b>${Number(bd.tempted) || 0}</b>offers refused</span>
            </div>
          </div>
        </div>
      </article></div>`;
    }

    if (s.kind === 'took' || s.kind === 'refused') {
      const taken = s.kind === 'took';
      return `<div class="sgc-step"><article class="sgc-card sgc-offer ${taken ? 'is-took' : 'is-refused'}">
        <div class="sgc-stamp">${stamp}${s.box ? ` &#183; BOX ${s.box}` : ''}</div>
        <div class="sgc-badge ${taken ? 'sgc-b-gold' : 'sgc-b-green'}">${esc(s.badge)}</div>
        <div class="sgc-offerbody">
          ${_boxIcon(taken)}
          <div class="sgc-offertext">
            ${s.prize ? `<div class="sgc-prize"><span>ON OFFER, TO ONE NAME ONLY</span><b>${esc(s.prize)}</b></div>` : ''}
            <div class="sgc-avs">${avs}</div>
            <p>${esc(s.text)}</p>
            <div class="sgc-verdict ${taken ? 'took' : 'refused'}">${taken
              ? `TOOK IT &#183; walks out of the box ${u.ordinal(s.place || 0)} and keeps the prize`
              : `REFUSED IT &#183; thumb never left the plate`}</div>
          </div>
        </div>
        <div class="sgc-gaugetext">${_pick(GAUGE_BOX, ep.num + i * 3)}</div>
      </article></div>`;
    }

    if (s.kind === 'punish') {
      const meta = PUN_META[s.pun] || PUN_META.heat;
      return `<div class="sgc-step"><article class="sgc-card sgc-punish" style="--pun:${meta.tint}">
        <div class="sgc-stamp">${stamp}${s.box ? ` &#183; BOX ${s.box}` : ''}</div>
        <div class="sgc-badge sgc-b-red">${esc(s.badge)} &#183; ${meta.label}</div>
        <div class="sgc-punbody">
          ${_dial(0.86, meta.tint, meta.label)}
          <div><div class="sgc-avs">${avs}</div><p>${esc(s.text)}</p></div>
        </div>
        <div class="sgc-gaugetext">${_pick(GAUGE_PUNISH, ep.num + i * 5)}</div>
      </article></div>`;
    }

    if (s.kind === 'hold') {
      return `<div class="sgc-step"><article class="sgc-card sgc-hold">
        <div class="sgc-stamp">${stamp}</div>
        <div class="sgc-badge sgc-b-grey">${esc(s.badge || 'STILL HOLDING')}</div>
        <div class="sgc-body"><div class="sgc-avs">${avs}</div><p>${esc(s.text)}</p></div>
        <div class="sgc-gaugetext">${_pick(GAUGE_HOLD, ep.num + i * 7)}</div>
      </article></div>`;
    }

    // a drop — the card slides off the button the way the hand did
    const bd = breakdown[s.leaver] || {};
    return `<div class="sgc-step"><article class="sgc-card sgc-drop ${s.threw ? 'is-threw' : ''} ${s.duel ? 'is-duel' : ''}">
      <div class="sgc-stamp">${stamp}</div>
      <div class="sgc-badge ${s.threw ? 'sgc-b-grey' : 'sgc-b-drop'}">${esc(s.badge || 'BUTTON RELEASED')}</div>
      <div class="sgc-body">
        <div class="sgc-avs sgc-fall">${avs}</div>
        <div>
          <p>${esc(s.text)}</p>
          <div class="sgc-droprow">
            <span class="sgc-place">${s.place ? u.ordinal(s.place).toUpperCase() : ''}</span>
            <span class="sgc-mini">${(Number(bd.hoursHeld) || s.hour || 0).toFixed(1)}h on the button</span>
            ${Number(bd.tempted) ? `<span class="sgc-mini">refused ${Number(bd.tempted)} offer${Number(bd.tempted) > 1 ? 's' : ''}</span>` : ''}
            ${s.threw ? '<span class="sgc-threwtag">LET GO ON PURPOSE</span>' : ''}
          </div>
        </div>
      </div>
      <div class="sgc-gaugetext">${_pick(GAUGE_DROP, ep.num + i * 11)}</div>
    </article></div>`;
  }).join('');

  const nextLabel = state.idx < 0 ? 'Seal the door'
    : (cur && cur.duel) ? 'Watch them stare' : 'Another hour passes';

  return `<div class="rp-page bb-room ${isHoh ? 'bb-power' : 'bb-block'} sigcooker">
  ${_css()}
  <div class="sgc-shell">
    <div class="sgc-steam" aria-hidden="true"></div>
    <div class="rp-eyebrow">Week ${ep.num}</div>
    <div class="sgc-title">THE ${dialMax}-HOUR CLOCK</div>
    <div class="sgc-sub">ONE BUTTON EACH &#183; LIFT A THUMB AND YOU ARE OUT &#183; EVERY EXIT OPENS A BOX</div>
    ${header}
    ${strip}
    <div class="sgc-feed">${cards}</div>
    <div class="sgc-ctrl">
      ${done ? '<span class="sgc-done">THE CLOCK HAS RUN OUT.</span>' : `
        <button class="sgc-btn" onclick="${u.reveal(ep, stateKey, Math.min(state.idx + 1, total - 1))}">${nextLabel}</button>
        <button class="sgc-btn all" onclick="${u.reveal(ep, stateKey, total - 1)}">Run the clock out</button>`}
      <span class="sgc-cnt">${revealed} / ${total}</span>
    </div>
  </div>
</div>`;
}

// ── styling: a sealed box in kitchen yellow ───────────────────────────
// Every looping animation on this screen is light only — opacity, filter,
// drop-shadow. Nothing loops on transform, because a page that is rebuilt
// wholesale on every click would restart a moving layout mid-read.
function _css() {
  return `<style>
  @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=IBM+Plex+Mono:wght@400;600&family=Barlow+Condensed:wght@400;600;700&display=swap');
  .sigcooker .sgc-shell{--yolk:#f0c53a;--grease:#c9a23a;--steam:#b9b3a0;--scald:#ff7a2f;--go:#7fd97f;--stop:#ff4d4d;--ink:#efe6cb;
    /* clip, not hidden: overflow hidden makes this a scroll container, which
       silently kills position sticky on the reveal controls inside it, and the
       button scrolled away with the page instead of staying at the bottom.
       (No backticks in here — this whole stylesheet is a template literal.) */
    --wall:#151409;position:relative;max-width:1100px;margin:0 auto;padding:18px 20px 0;overflow:clip;
    font-family:'Barlow Condensed',sans-serif;color:var(--ink);
    background:linear-gradient(180deg,#1d1b0d 0%,#171509 42%,#100f07 100%);
    border:3px solid #3a3316;box-shadow:inset 0 0 90px rgba(0,0,0,0.75),0 14px 40px rgba(0,0,0,0.6)}
  .sigcooker .sgc-shell::before{content:'';position:absolute;inset:0;pointer-events:none;z-index:0;
    background:repeating-linear-gradient(0deg,transparent 0 3px,rgba(0,0,0,0.16) 3px 4px);opacity:.45}
  .sigcooker .sgc-steam{position:absolute;top:46px;left:0;right:0;bottom:0;pointer-events:none;z-index:1;
    background:radial-gradient(ellipse at 22% 8%,rgba(240,197,58,0.10),transparent 46%),
      radial-gradient(ellipse at 80% 30%,rgba(200,200,190,0.09),transparent 44%),
      radial-gradient(ellipse at 50% 92%,rgba(255,122,47,0.08),transparent 50%);
    animation:sgc-steam 9s ease-in-out infinite alternate}
  @keyframes sgc-steam{from{opacity:.45;filter:blur(0px)}to{opacity:.85;filter:blur(3px)}}
  .sigcooker .sgc-shell>*:not(.sgc-steam){position:relative;z-index:2}

  .sigcooker .sgc-title{font-family:'Bebas Neue',sans-serif;font-size:52px;line-height:.92;letter-spacing:4px;text-align:center;
    color:#fff6d6;text-shadow:0 0 24px rgba(240,197,58,0.45),0 2px 0 #000;animation:sgc-buzz 4.5s ease-in-out infinite alternate}
  @keyframes sgc-buzz{from{text-shadow:0 0 14px rgba(240,197,58,0.28),0 2px 0 #000}
    to{text-shadow:0 0 30px rgba(240,197,58,0.6),0 2px 0 #000}}
  .sigcooker .sgc-sub{font-family:'IBM Plex Mono',monospace;font-size:9.5px;letter-spacing:2.4px;text-align:center;color:#a89b6a;margin:8px 0 16px}

  .sigcooker .sgc-wall{display:flex;gap:18px;align-items:stretch;flex-wrap:wrap;
    background:linear-gradient(180deg,rgba(30,28,14,0.86),rgba(14,13,7,0.9));border:1px solid #3a3316;border-radius:6px;padding:14px 16px}
  .sigcooker .sgc-clockwrap{width:180px;flex-shrink:0;text-align:center}
  .sigcooker .sgc-clock{width:150px;height:150px;filter:drop-shadow(0 0 14px rgba(240,197,58,0.28));animation:sgc-tick 6s ease-in-out infinite alternate}
  @keyframes sgc-tick{from{filter:drop-shadow(0 0 8px rgba(240,197,58,0.18))}to{filter:drop-shadow(0 0 20px rgba(240,197,58,0.42))}}
  .sigcooker .sgc-hour{font-family:'Bebas Neue';font-size:19px;letter-spacing:3px;color:#a89b6a;margin-top:4px}
  .sigcooker .sgc-hour b{color:var(--yolk);font-size:26px}
  .sigcooker .sgc-hourcap{font-family:'IBM Plex Mono';font-size:8.5px;letter-spacing:1.4px;color:#6f6743}
  .sigcooker .sgc-readout{flex:1;min-width:240px}
  .sigcooker .sgc-comp{font-family:'Bebas Neue';font-size:30px;letter-spacing:2px;color:var(--yolk)}
  .sigcooker .sgc-catrow{display:flex;gap:8px;align-items:center;margin:2px 0 6px;flex-wrap:wrap}
  .sigcooker .sgc-cat{font-family:'IBM Plex Mono';font-size:8.5px;letter-spacing:1.6px;border:1px solid;border-radius:3px;padding:2px 6px}
  .sigcooker .sgc-for{font-family:'IBM Plex Mono';font-size:8.5px;letter-spacing:1.6px;color:#8b8158}
  .sigcooker .sgc-desc{font-size:13px;line-height:1.5;color:#cbc2a2;margin:0 0 8px;max-width:640px}
  .sigcooker .sgc-weights{display:flex;flex-wrap:wrap;gap:10px;margin-bottom:10px}
  .sigcooker .sgc-w{display:flex;align-items:center;gap:5px;font-family:'IBM Plex Mono';font-size:9px;color:#9d9263}
  .sigcooker .sgc-w i{font-style:normal;letter-spacing:1px}
  .sigcooker .sgc-wbar{width:46px;height:5px;background:#2c2811;border-radius:3px;overflow:hidden}
  .sigcooker .sgc-wbar b{display:block;height:100%;background:var(--grease)}
  .sigcooker .sgc-w u{text-decoration:none;color:#7a7048}
  .sigcooker .sgc-gauges{display:flex;gap:16px;flex-wrap:wrap}
  .sigcooker .sgc-gauge{text-align:center}
  .sigcooker .sgc-dial{width:64px;height:48px}
  .sigcooker .sgc-gauge span{display:block;font-family:'IBM Plex Mono';font-size:8.5px;color:#8b8158;letter-spacing:1px}
  .sigcooker .sgc-sat{font-family:'IBM Plex Mono';font-size:8.5px;letter-spacing:1.2px;color:#7a7048;margin-top:8px}

  .sigcooker .sgc-strip{margin:14px 0 6px;border:1px solid #3a3316;border-radius:6px;padding:10px 12px;background:rgba(20,19,10,0.8)}
  .sigcooker .sgc-strip.is-duel{border-color:var(--scald);box-shadow:0 0 22px rgba(255,122,47,0.28);animation:sgc-duel 2.6s ease-in-out infinite alternate}
  @keyframes sgc-duel{from{box-shadow:0 0 10px rgba(255,122,47,0.18)}to{box-shadow:0 0 30px rgba(255,122,47,0.45)}}
  .sigcooker .sgc-strip-h{font-family:'IBM Plex Mono';font-size:9px;letter-spacing:2px;color:#a89b6a;display:flex;justify-content:space-between;margin-bottom:8px}
  .sigcooker .sgc-strip.is-duel .sgc-strip-h{color:var(--scald)}
  .sigcooker .sgc-strip-row{display:flex;flex-wrap:wrap;gap:8px}
  .sigcooker .sgc-hand{width:52px;text-align:center;transition:opacity .3s}
  .sigcooker .sgc-plate{display:block;width:28px;height:10px;margin:0 auto 2px}
  .sigcooker .sgc-plate-off{display:block;width:28px;height:10px;margin:0 auto 2px;border-bottom:1px dashed #4a4224}
  .sigcooker .sgc-hand em{display:block;font-style:normal;font-size:9.5px;color:#b3a877;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .sigcooker .sgc-hand.is-off{opacity:.32}
  .sigcooker .sgc-hand.is-off .bb-av img{filter:grayscale(1)}
  .sigcooker .sgc-hand.is-off em{text-decoration:line-through;color:#6f6743}

  .sigcooker .sgc-feed{padding:12px 0 90px}
  .sigcooker .sgc-step{margin:10px 0;scroll-margin-top:24px}
  .sigcooker .sgc-step.is-hidden .sgc-locked{border:1px dashed #35301a;border-radius:6px;padding:9px;text-align:center;color:#4a4426;font-size:11px;opacity:.5}
  .sigcooker .sgc-card{position:relative;border:1px solid #3a3316;border-left:4px solid var(--grease);border-radius:6px;padding:11px 13px;
    background:linear-gradient(180deg,rgba(30,28,14,0.9),rgba(13,12,7,0.94));box-shadow:0 5px 16px rgba(0,0,0,0.45)}
  .sigcooker .sgc-card p{font-size:13.5px;line-height:1.55;color:#e3d9b8;margin:6px 0 0}
  .sigcooker .sgc-stamp{font-family:'IBM Plex Mono';font-size:9px;letter-spacing:1.6px;color:#8b8158}
  .sigcooker .sgc-badge{display:inline-block;font-family:'IBM Plex Mono';font-size:8.5px;letter-spacing:1.4px;padding:2px 7px;border-radius:3px;margin-top:5px}
  .sigcooker .sgc-b-seal{background:rgba(240,197,58,0.12);color:var(--yolk);border:1px solid #6b5a20}
  .sigcooker .sgc-b-drop{background:rgba(255,122,47,0.12);color:var(--scald);border:1px solid #6d3b17}
  .sigcooker .sgc-b-grey{background:rgba(185,179,160,0.10);color:#b9b3a0;border:1px solid #4a4738}
  .sigcooker .sgc-b-gold{background:rgba(240,197,58,0.18);color:#ffdf7a;border:1px solid var(--grease)}
  .sigcooker .sgc-b-green{background:rgba(127,217,127,0.12);color:var(--go);border:1px solid #33632f}
  .sigcooker .sgc-b-red{background:rgba(255,77,77,0.12);color:var(--stop);border:1px solid #6d2020}
  .sigcooker .sgc-body{display:flex;gap:11px;align-items:flex-start;margin-top:4px}
  .sigcooker .sgc-avs{display:flex;flex-shrink:0}
  .sigcooker .sgc-avs .bb-av{margin-left:-9px;border:1px solid #4a4224;border-radius:5px;background:#14130a}
  .sigcooker .sgc-avs .bb-av:first-child{margin-left:0}
  .sigcooker .sgc-gaugetext{font-family:'IBM Plex Mono';font-size:8px;letter-spacing:1.3px;color:#6f6743;margin-top:8px;border-top:1px dashed #2f2b16;padding-top:5px}

  .sigcooker .sgc-seal{border-left-color:var(--yolk);text-align:left}
  .sigcooker .sgc-hold{border-left-color:#b9b3a0;font-style:italic;opacity:.96}
  .sigcooker .sgc-drop{border-left-color:var(--scald)}
  .sigcooker .sgc-drop.is-threw{border-left-color:#b9b3a0}
  .sigcooker .sgc-drop.is-duel{border-left-color:#ffb066;box-shadow:0 0 24px rgba(255,122,47,0.22)}
  .sigcooker .sgc-fall{animation:sgc-slip .55s cubic-bezier(.3,.9,.4,1) both}
  @keyframes sgc-slip{0%{transform:translate(0,-14px);opacity:0}60%{transform:translate(6px,3px);opacity:1}100%{transform:translate(0,0)}}
  .sigcooker .sgc-droprow{display:flex;gap:9px;align-items:center;flex-wrap:wrap;margin-top:7px}
  .sigcooker .sgc-place{font-family:'Bebas Neue';font-size:16px;letter-spacing:2px;color:var(--scald)}
  .sigcooker .sgc-mini{font-family:'IBM Plex Mono';font-size:8.5px;color:#8b8158;letter-spacing:1px}
  .sigcooker .sgc-threwtag{font-family:'IBM Plex Mono';font-size:8px;letter-spacing:1.2px;color:#b9b3a0;border:1px solid #4a4738;border-radius:3px;padding:1px 5px}

  .sigcooker .sgc-offer{border-left-color:var(--grease);background:linear-gradient(120deg,rgba(52,43,14,0.9),rgba(15,14,8,0.95))}
  .sigcooker .sgc-offer.is-took{box-shadow:0 0 26px rgba(240,197,58,0.22)}
  .sigcooker .sgc-offer.is-refused{border-left-color:var(--go)}
  .sigcooker .sgc-offerbody{display:flex;gap:12px;align-items:flex-start;margin-top:6px}
  .sigcooker .sgc-boxicon{width:84px;height:70px;flex-shrink:0;filter:drop-shadow(0 0 6px rgba(201,162,58,0.35))}
  .sigcooker .sgc-boxicon.is-taken{animation:sgc-shine 2.4s ease-in-out infinite alternate}
  @keyframes sgc-shine{from{filter:drop-shadow(0 0 4px rgba(240,197,58,0.3))}to{filter:drop-shadow(0 0 16px rgba(240,197,58,0.75))}}
  .sigcooker .sgc-offertext{flex:1;min-width:0}
  .sigcooker .sgc-prize{border:1px dashed var(--grease);border-radius:5px;padding:6px 9px;background:rgba(240,197,58,0.07)}
  .sigcooker .sgc-prize span{display:block;font-family:'IBM Plex Mono';font-size:8px;letter-spacing:1.6px;color:#8b8158}
  .sigcooker .sgc-prize b{display:block;font-size:14px;color:#ffe6a0;line-height:1.4;margin-top:2px}
  .sigcooker .sgc-verdict{margin-top:7px;font-family:'IBM Plex Mono';font-size:9px;letter-spacing:1.2px}
  .sigcooker .sgc-verdict.took{color:#ffdf7a}
  .sigcooker .sgc-verdict.refused{color:var(--go)}

  .sigcooker .sgc-punish{border-left-color:var(--pun,#ff4d4d);background:linear-gradient(180deg,rgba(46,18,14,0.75),rgba(13,12,7,0.94))}
  .sigcooker .sgc-punbody{display:flex;gap:12px;align-items:flex-start;margin-top:6px}
  .sigcooker .sgc-punish .sgc-dial{width:76px;height:56px;flex-shrink:0;filter:drop-shadow(0 0 6px var(--pun));animation:sgc-pun 2.2s ease-in-out infinite alternate}
  @keyframes sgc-pun{from{opacity:.72}to{opacity:1}}

  .sigcooker .sgc-win{border:2px solid var(--yolk);border-left-width:2px;background:linear-gradient(120deg,rgba(70,54,12,0.85),rgba(16,14,7,0.95));
    padding:16px;animation:sgc-sign 2.2s ease-in-out infinite alternate}
  @keyframes sgc-sign{from{box-shadow:0 0 12px rgba(240,197,58,0.25)}to{box-shadow:0 0 42px rgba(240,197,58,0.7)}}
  .sigcooker .sgc-neon{font-family:'Bebas Neue';font-size:22px;letter-spacing:6px;text-align:center;color:#fff3c4;
    text-shadow:0 0 16px rgba(240,197,58,0.8);margin-bottom:10px}
  .sigcooker .sgc-winbody{display:flex;gap:16px;align-items:center;flex-wrap:wrap}
  .sigcooker .sgc-winav .bb-av{border:2px solid var(--yolk);border-radius:8px;background:#14130a;filter:drop-shadow(0 0 12px rgba(240,197,58,0.5))}
  .sigcooker .sgc-winname{font-family:'Bebas Neue';font-size:34px;letter-spacing:3px;color:var(--yolk);line-height:1}
  .sigcooker .sgc-winstats{display:flex;gap:14px;flex-wrap:wrap;margin-top:9px}
  .sigcooker .sgc-winstats span{font-family:'IBM Plex Mono';font-size:8.5px;letter-spacing:1.2px;color:#9d9263}
  .sigcooker .sgc-winstats b{display:block;font-family:'Bebas Neue';font-size:22px;letter-spacing:1px;color:#ffe6a0}

  .sigcooker .sgc-ctrl{position:sticky;bottom:0;z-index:20;display:flex;gap:9px;align-items:center;justify-content:center;
    padding:11px;margin:0 -20px;background:linear-gradient(0deg,#0d0c06,rgba(13,12,6,0.88) 70%,transparent)}
  .sigcooker .sgc-btn{font-family:'Bebas Neue';font-size:15px;letter-spacing:2px;cursor:pointer;padding:7px 18px;border-radius:4px;
    border:1px solid #6b5a20;background:linear-gradient(180deg,#3a3316,#221f0e);color:#f4ead0}
  .sigcooker .sgc-btn:hover{border-color:var(--yolk);color:var(--yolk)}
  .sigcooker .sgc-btn.all{border-color:#4a4224;color:#b3a877}
  .sigcooker .sgc-cnt{font-family:'IBM Plex Mono';font-size:10px;color:#8b8158;letter-spacing:1.4px}
  .sigcooker .sgc-done{font-family:'Bebas Neue';font-size:15px;letter-spacing:3px;color:var(--yolk)}

  @media(max-width:640px){
    .sigcooker .sgc-title{font-size:34px}
    .sigcooker .sgc-clockwrap{width:100%}
    .sigcooker .sgc-offerbody,.sigcooker .sgc-punbody{flex-direction:column}
  }
  @media(prefers-reduced-motion:reduce){
    .sigcooker .sgc-steam,.sigcooker .sgc-title,.sigcooker .sgc-clock,.sigcooker .sgc-strip.is-duel,
    .sigcooker .sgc-fall,.sigcooker .sgc-boxicon.is-taken,.sigcooker .sgc-punish .sgc-dial,
    .sigcooker .sgc-win{animation:none!important}
  }
  </style>`;
}
