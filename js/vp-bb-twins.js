// ══════════════════════════════════════════════════════════════════════
// vp-bb-twins.js — the two of them, and the house that has one name for it
// ══════════════════════════════════════════════════════════════════════
//
// The audience knows and the house does not, so the screen is built around a
// thing only the viewer can see: two stat lines under one photograph, with the
// one currently in the building lit. Everything the house notices — a
// conversation that did not happen, a competition they should have won — is
// listed underneath as evidence nobody has assembled yet.
//
// The comparison bar is the whole idea. A viewer looking at it should be able
// to predict the tell before the house feels it: the twin who is three points
// down on endurance is going to come off that wall early, and somebody in that
// room is going to spend a week unable to say why.

const STYLE = `<style>
.bbtw{--tw-a:#58a6ff;--tw-b:#a371f7;--tw-warn:#e3b341;position:relative;color:#e6edf3}
.bbtw .tw-wrap{max-width:1100px;margin:0 auto;padding:0 12px 24px}
.bbtw .tw-bg{position:absolute;inset:46px 0 0 0;z-index:0;pointer-events:none;
  background:radial-gradient(60% 40% at 30% 0%,rgba(88,166,255,.14),transparent 60%),
    radial-gradient(60% 40% at 70% 0%,rgba(163,113,247,.14),transparent 60%),
    linear-gradient(180deg,#0d1020,#08090f 62%,#050508)}
.bbtw .tw-head{position:relative;z-index:2;text-align:center;padding:14px 6px 4px}
.bbtw .tw-eyebrow{font-family:ui-monospace,Consolas,monospace;font-size:9px;letter-spacing:4px;color:#8b949e}
.bbtw .tw-title{font-family:var(--font-display);font-size:32px;letter-spacing:3px;color:#fff;margin:7px 0 3px}
.bbtw .tw-sub{font-size:11.5px;color:#8b949e}

/* ── one photograph, two people ── */
.bbtw .tw-pair{position:relative;z-index:2;display:grid;grid-template-columns:1fr 128px 1fr;gap:14px;
  align-items:center;margin:16px auto 0;max-width:820px;padding:16px;border-radius:12px;
  background:linear-gradient(180deg,rgba(18,20,36,.94),rgba(8,9,16,.96));
  border:1px solid rgba(255,255,255,.1)}
@media(max-width:760px){.bbtw .tw-pair{grid-template-columns:1fr}}
.bbtw .tw-side{padding:12px;border-radius:10px;border:1px solid rgba(255,255,255,.08)}
.bbtw .tw-side.is-a{background:linear-gradient(180deg,rgba(88,166,255,.10),transparent)}
.bbtw .tw-side.is-b{background:linear-gradient(180deg,rgba(163,113,247,.10),transparent)}
.bbtw .tw-side.is-on{box-shadow:0 0 0 1px currentColor,0 0 26px rgba(255,255,255,.08)}
.bbtw .tw-side.is-a.is-on{color:var(--tw-a)}
.bbtw .tw-side.is-b.is-on{color:var(--tw-b)}
.bbtw .tw-who{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:9px}
.bbtw .tw-who b{font-family:var(--font-display);font-size:16px;color:#fff}
.bbtw .tw-who span{font-family:ui-monospace,Consolas,monospace;font-size:7.5px;letter-spacing:1.6px}
.bbtw .tw-row{display:flex;align-items:center;gap:7px;font-size:10.5px;color:#c9d1d9;margin-bottom:3px}
.bbtw .tw-row i{width:74px;font-style:normal;color:#8b949e;text-transform:capitalize}
.bbtw .tw-bar{flex:1;height:6px;border-radius:3px;background:rgba(255,255,255,.07);overflow:hidden}
.bbtw .tw-bar b{display:block;height:100%;border-radius:3px;background:currentColor;opacity:.85}
.bbtw .tw-row em{width:22px;text-align:right;font-style:normal;font-family:ui-monospace,Consolas,monospace;
  font-size:9.5px;color:#8b949e}
.bbtw .tw-row.is-up em{color:#7ee787}
.bbtw .tw-row.is-down em{color:#ff8b84}
.bbtw .tw-face{text-align:center}
.bbtw .tw-face figure{width:96px;height:96px;margin:0 auto;border-radius:10px;overflow:hidden;
  border:2px solid rgba(255,255,255,.18)}
.bbtw .tw-face figure .bb-av{width:96px!important;height:96px!important;border-radius:8px}
.bbtw .tw-face .tw-name{font-family:var(--font-display);font-size:17px;color:#fff;margin-top:7px}
.bbtw .tw-face .tw-note{font-family:ui-monospace,Consolas,monospace;font-size:7.5px;letter-spacing:1.4px;
  color:#8b949e;margin-top:3px}

.bbtw .tw-swap{position:relative;z-index:2;max-width:760px;margin:14px auto 0;padding:12px 15px;
  border-radius:10px;font-size:13.5px;line-height:1.6;color:#d6dde5;
  background:rgba(255,255,255,.04);border-left:3px solid var(--tw-warn)}
.bbtw .tw-swap b{display:block;font-family:ui-monospace,Consolas,monospace;font-size:8px;letter-spacing:1.8px;
  color:var(--tw-warn);margin-bottom:5px}
.bbtw .tw-tells{position:relative;z-index:2;max-width:760px;margin:14px auto 0;display:flex;
  flex-direction:column;gap:8px}
.bbtw .tw-tell{padding:11px 13px;border-radius:9px;font-size:13px;line-height:1.6;color:#d6dde5;
  background:linear-gradient(180deg,rgba(20,22,40,.9),rgba(10,11,20,.94));
  border:1px solid rgba(255,255,255,.07);border-left:3px solid var(--tw-a)}
.bbtw .tw-tell b{display:block;font-family:ui-monospace,Consolas,monospace;font-size:8px;letter-spacing:1.8px;
  color:#8b949e;margin-bottom:5px}
.bbtw .tw-tell.is-loud{border-left-color:#f85149}
.bbtw .tw-meter{position:relative;z-index:2;max-width:760px;margin:14px auto 0;padding:12px 15px;
  border-radius:10px;background:rgba(0,0,0,.3);border:1px solid rgba(255,255,255,.09)}
.bbtw .tw-meter-h{display:flex;justify-content:space-between;font-family:ui-monospace,Consolas,monospace;
  font-size:8.5px;letter-spacing:1.6px;color:#8b949e;margin-bottom:7px}
.bbtw .tw-meter-t{height:9px;border-radius:5px;background:rgba(255,255,255,.07);overflow:hidden}
.bbtw .tw-meter-t b{display:block;height:100%;background:linear-gradient(90deg,var(--tw-a),#f85149)}
.bbtw .tw-big{position:relative;z-index:2;max-width:760px;margin:16px auto 0;padding:24px 18px;
  border-radius:12px;text-align:center;border:1px solid rgba(227,179,65,.5);
  background:radial-gradient(70% 110% at 50% 0%,rgba(227,179,65,.22),rgba(0,0,0,.55))}
.bbtw .tw-big figure{width:88px;height:88px;border-radius:10px;overflow:hidden;display:inline-block;
  margin:0 6px;border:3px solid var(--tw-warn);box-shadow:0 0 30px rgba(227,179,65,.4);vertical-align:middle}
.bbtw .tw-big figure .bb-av{width:88px!important;height:88px!important;border-radius:7px}
.bbtw .tw-big h3{margin:12px 0 0;font-family:var(--font-display);font-size:clamp(22px,4vw,36px);color:#fff}
</style>`;

const KEYS = ['physical', 'endurance', 'mental', 'social', 'strategic',
  'loyalty', 'boldness', 'intuition', 'temperament'];

function statPanel(label, tag, stats, other, side, on, esc) {
  const rows = KEYS.map(k => {
    const v = Number(stats?.[k]) || 0;
    const d = v - (Number(other?.[k]) || 0);
    return `<div class="tw-row ${d > 0 ? 'is-up' : d < 0 ? 'is-down' : ''}">
      <i>${k}</i><span class="tw-bar"><b style="width:${v * 10}%"></b></span>
      <em>${v}${d ? (d > 0 ? '▲' : '▼') : ''}</em></div>`;
  }).join('');
  return `<div class="tw-side is-${side} ${on ? 'is-on' : ''}">
    <div class="tw-who"><b>${esc(label)}</b><span>${on ? 'IN THE HOUSE' : 'IN THE STOREROOM'}</span></div>
    ${rows}</div>`;
}

/** A week of one of them being in and the other not. */
export function rpBuildBBTwinWeek(ep, act, u = {}) {
  if (!act) return '';
  const esc = typeof u.esc === 'function' ? u.esc : v => String(v ?? '');
  const avatar = typeof u.avatar === 'function' ? u.avatar : () => '';
  const st = act.twins || {};
  const onA = (act.swap?.active || st.active || 'a') === 'a';
  const tells = act.tells?.beats || [];

  return `<div class="rp-page bbtw">${STYLE}
    <div class="tw-bg"></div>
    <div class="tw-wrap">
      <div class="tw-head">
        <div class="tw-eyebrow">WEEK ${esc(act.week)} &middot; ONLY YOU CAN SEE THIS</div>
        <div class="tw-title">TWO OF THEM</div>
        <div class="tw-sub">The house has one name for this person and has never counted them.</div>
      </div>

      <div class="tw-pair">
        ${statPanel(esc(act.front), 'a', st.statsA, st.statsB, 'a', onA, esc)}
        <div class="tw-face">
          <figure>${avatar(act.front, 96)}</figure>
          <div class="tw-name">${esc(act.front)}</div>
          <div class="tw-note">ONE PHOTOGRAPH ON THAT WALL</div>
        </div>
        ${statPanel(esc(st.other || 'the other one'), 'b', st.statsB, st.statsA, 'b', !onA, esc)}
      </div>

      ${act.swap ? `<div class="tw-swap"><b>THE SWAP</b>${act.swap.text}</div>` : ''}

      ${tells.length ? `<div class="tw-tells">${tells.map(b => `<div class="tw-tell ${
        b.badgeClass === 'red' ? 'is-loud' : ''}"><b>${esc(b.badgeText || '')}</b>${b.text}</div>`).join('')}</div>`
    : `<div class="tw-swap" style="border-left-color:#3fb950"><b>NOBODY FELT A THING</b>
        A whole week of one of them at a time, and not one person in that house noticed anything worth
        mentioning. Which is the best possible week and the least interesting one to watch.</div>`}

      <div class="tw-meter">
        <div class="tw-meter-h"><span>HOW CLOSE THE HOUSE IS</span><span>${
          Math.round((act.exposureLevel || 0) * 100)}%</span></div>
        <div class="tw-meter-t"><b style="width:${Math.round((act.exposureLevel || 0) * 100)}%"></b></div>
      </div>
    </div>
  </div>`;
}

/** Both of them, at last. */
export function rpBuildBBTwinEntry(ep, act, u = {}) {
  if (!act) return '';
  const esc = typeof u.esc === 'function' ? u.esc : v => String(v ?? '');
  const avatar = typeof u.avatar === 'function' ? u.avatar : () => '';
  return `<div class="rp-page bbtw">${STYLE}
    <div class="tw-bg"></div>
    <div class="tw-wrap">
      <div class="tw-head">
        <div class="tw-eyebrow">WEEK ${esc(act.week)} &middot; THE CALENDAR, BEATEN</div>
        <div class="tw-title">BOTH OF THEM</div>
        <div class="tw-sub">${act.exposed
          ? 'Half this house had it worked out. It made no difference at all.'
          : 'Nobody had it. The house is one body bigger than it was this morning.'}</div>
      </div>
      <div class="tw-big">
        <figure>${avatar(act.front, 88)}</figure><figure>${avatar(act.other, 88)}</figure>
        <h3>${esc(act.front)} &amp; ${esc(act.other)}</h3>
      </div>
      <div class="tw-tells">${(act.beats || []).map(b => `<div class="tw-tell">
        <b>${esc(b.badgeText || '')}</b>${b.text}</div>`).join('')}</div>
    </div>
  </div>`;
}

/** One eviction, two people. */
export function rpBuildBBTwinOut(ep, act, u = {}) {
  if (!act) return '';
  const esc = typeof u.esc === 'function' ? u.esc : v => String(v ?? '');
  const avatar = typeof u.avatar === 'function' ? u.avatar : () => '';
  return `<div class="rp-page bbtw">${STYLE}
    <div class="tw-bg"></div>
    <div class="tw-wrap">
      <div class="tw-head">
        <div class="tw-eyebrow">WEEK ${esc(act.week)} &middot; ONE VOTE, TWO PEOPLE</div>
        <div class="tw-title">THERE WERE TWO</div>
        <div class="tw-sub">The house gets its answer about four seconds too late to use it.</div>
      </div>
      <div class="tw-big" style="border-color:rgba(248,81,73,.5);
        background:radial-gradient(70% 110% at 50% 0%,rgba(248,81,73,.22),rgba(0,0,0,.55))">
        <figure style="border-color:#f85149;box-shadow:0 0 30px rgba(248,81,73,.4)">${avatar(act.front, 88)}</figure>
        <figure style="border-color:#f85149;box-shadow:0 0 30px rgba(248,81,73,.4);filter:grayscale(.6)">${avatar(act.front, 88)}</figure>
        <h3>${esc(act.front)}</h3>
      </div>
      <div class="tw-tells">${(act.beats || []).map(b => `<div class="tw-tell is-loud">
        <b>${esc(b.badgeText || '')}</b>${b.text}</div>`).join('')}</div>
    </div>
  </div>`;
}
