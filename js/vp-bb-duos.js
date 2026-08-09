// ══════════════════════════════════════════════════════════════════════
// vp-bb-duos.js — Dynamic Duos, and the Golden Key, on screen
// ══════════════════════════════════════════════════════════════════════
//
// Three screens, because the twist has three moments and each one is a
// different kind of news:
//
//   the pairing    who you are stuck with, said once, on night one
//   the key        somebody's partner is gone and they have been handed
//                  safety they cannot use
//   the expiry     every key stops at once, and a house of bystanders is
//                  suddenly nominatable
//
// WHY THIS EXISTS AT ALL. The Twin Twist shipped with its changeover passed to
// a screen that never drew it — ten swaps in a real season and nothing visible
// anywhere, so the twist read as doing nothing. A mechanic the audience cannot
// see is a mechanic that did not happen. These are written alongside the module
// rather than after it for exactly that reason.
const CSS = `
.bbduo{--gold:#f5b60b;--ink:#f4f1f7;position:relative;padding:26px 22px 30px;
  background:radial-gradient(ellipse at 50% 0%,rgba(245,182,11,.16),transparent 60%),#141018;
  color:var(--ink);font-family:system-ui,-apple-system,'Segoe UI',sans-serif;}
.bbduo .duo-eyebrow{font-size:11px;letter-spacing:.16em;font-weight:800;opacity:.6;text-align:center;}
.bbduo .duo-title{font-size:30px;font-weight:900;letter-spacing:-.01em;text-align:center;margin:6px 0 4px;}
.bbduo .duo-sub{text-align:center;opacity:.7;max-width:560px;margin:0 auto 20px;line-height:1.55;font-size:14px;}
.bbduo .duo-rules{max-width:640px;margin:0 auto 22px;display:flex;flex-direction:column;gap:8px;}
.bbduo .duo-rule{padding:10px 14px;border-left:3px solid var(--gold);background:rgba(245,182,11,.07);
  border-radius:0 8px 8px 0;font-size:13.5px;line-height:1.6;}
.bbduo .duo-pairs{display:flex;flex-wrap:wrap;gap:10px;justify-content:center;max-width:720px;margin:0 auto;}
.bbduo .duo-pair{display:flex;align-items:center;gap:8px;padding:9px 13px;border-radius:999px;
  border:1px solid rgba(245,182,11,.35);background:rgba(245,182,11,.08);font-weight:700;font-size:14px;}
.bbduo .duo-amp{opacity:.5;font-weight:400;}
.bbduo .duo-solo{margin:16px auto 0;max-width:520px;text-align:center;padding:11px 14px;
  border:1px dashed rgba(255,255,255,.25);border-radius:10px;font-size:13.5px;opacity:.8;}
.bbduo .duo-keycard{max-width:560px;margin:0 auto;padding:20px;border-radius:14px;
  border:1px solid rgba(245,182,11,.45);background:linear-gradient(160deg,rgba(245,182,11,.16),rgba(245,182,11,.04));
  text-align:center;}
.bbduo .duo-keyname{font-size:26px;font-weight:900;margin:8px 0 2px;}
.bbduo .duo-keysub{opacity:.75;font-size:13.5px;line-height:1.6;}
.bbduo .duo-ledger{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin:18px auto 0;max-width:640px;}
.bbduo .duo-chip{padding:7px 12px;border-radius:999px;font-size:12.5px;font-weight:700;
  border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.05);}
.bbduo .duo-chip.is-key{border-color:rgba(245,182,11,.5);color:var(--gold);}
.bbduo .duo-beats{max-width:600px;margin:20px auto 0;display:flex;flex-direction:column;gap:10px;}
.bbduo .duo-beat{padding:11px 14px;border-radius:10px;background:rgba(255,255,255,.045);
  border:1px solid rgba(255,255,255,.08);font-size:13.5px;line-height:1.6;}
.bbduo .duo-evs{max-width:640px;margin:0 auto;display:flex;flex-direction:column;gap:11px;}
.bbduo .duo-ev{padding:12px 15px;border-radius:11px;background:rgba(255,255,255,.05);
  border:1px solid rgba(255,255,255,.09);border-left:3px solid var(--gold);font-size:13.5px;line-height:1.62;}
.bbduo .duo-ev .duo-tag{display:inline-block;margin-bottom:6px;font-size:10.5px;letter-spacing:.13em;
  font-weight:800;padding:3px 8px;border-radius:999px;background:rgba(245,182,11,.2);color:var(--gold);}
.bbduo .duo-ev.k-red{border-left-color:#e0452e;}
.bbduo .duo-ev.k-red .duo-tag{background:rgba(224,69,46,.22);color:#ffb3a6;}
.bbduo .duo-ev.k-blue{border-left-color:#6ea8d8;}
.bbduo .duo-ev.k-blue .duo-tag{background:rgba(110,168,216,.2);color:#bcdcf5;}
.bbduo .duo-ev.k-green{border-left-color:#4fbf87;}
.bbduo .duo-ev.k-green .duo-tag{background:rgba(79,191,135,.2);color:#a9e8c8;}
.bbduo .duo-state{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin:0 auto 20px;max-width:680px;}
@media(prefers-reduced-motion:reduce){.bbduo *{animation:none!important;transition:none!important;}}
`;

const shell = inner => `<style>${CSS}</style><div class="bbduo">${inner}</div>`;
const esc0 = v => String(v ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const beats = (act, esc) => (act.beats || []).length
  ? `<div class="duo-beats">${act.beats.map(b =>
      `<div class="duo-beat">${esc(b.text)}</div>`).join('')}</div>`
  : '';

/**
 * Night one, and it is a move-in.
 *
 * REBUILT because the first version was a stack of grey rule cards with the
 * pairs listed underneath as chips, which is a settings page rather than a
 * night of television. The house already has a language for people coming
 * through that door — the front-door feed, the HUD, the wall of frames filling
 * one face at a time, the close-up with an intro quote and the room's first
 * read — and this is the same night with one difference: they arrive in twos.
 *
 * So it uses the move-in's own furniture (`bb-room`, `bbf-*` in
 * css/simulator.css) rather than inventing a look, and reveals ONE DUO AT A
 * TIME. The chain between two frames is the only new primitive, because it is
 * the only new idea.
 *
 * The onclick bakes its target index in and recreates the state key on every
 * click: renderVPScreen wipes `_tvState` after every paint, so a guard of the
 * form `if(state){...}` silently no-ops forever.
 */
export function rpBuildBBDuosOpen(ep, act, u = {}) {
  if (!act) return '';
  const esc = typeof u.esc === 'function' ? u.esc : esc0;
  const slug = typeof u.slug === 'function' ? u.slug
    : name => String(name || '').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const quote = typeof u.quote === 'function' ? u.quote : () => '';
  const reads = typeof u.reads === 'function' ? u.reads : () => [];

  const pairs = (act.pairs || []).map(p => [...p]);
  const kin = act.kin || [];
  const singles = act.singles || [];
  const epNum = Number(ep?.num) || 1;
  const key = `bbduos-open-${epNum}`;
  const TV = (typeof _tvState !== 'undefined' && _tvState) || {};
  /* OPEN BY DEFAULT, AND THAT IS DELIBERATE.
     renderVPScreen wipes `_tvState` after every paint, so a screen that starts
     sealed is sealed for every reader who does not click and for every guard
     that renders it — which would hide the twist's own rules and the names of
     everybody who came in alone. So the wall arrives full, clicking a duo
     brings up their close-up, and "Watch them come in" plays it back one pair
     at a time for anybody who wants the arrival. */
  const at = Number.isFinite(TV[key]?.idx) ? TV[key].idx : pairs.length - 1;
  const look = Number.isFinite(TV[key]?.look) ? TV[key].look : 0;
  const shown = Math.min(at + 1, pairs.length);
  const done = shown >= pairs.length;

  const jump = (idx, lookAt = idx) => `onclick="if(!_tvState['${key}'])_tvState['${key}']={idx:-1};`
    + `_tvState['${key}'].idx=${idx};_tvState['${key}'].look=${lookAt};`
    + `const ep=gs.episodeHistory.find(e=>e.num===${epNum});`
    + `if(ep){const m=document.querySelector('.rp-main');const st=m?m.scrollTop:0;`
    + `buildVPScreens(ep);renderVPScreen();if(m)m.scrollTop=st;}"`;

  const frame = (name, inHouse) => `<div class="bbf-frame">
    ${inHouse ? `<img src="assets/avatars/${slug(name)}.png" alt=""
        onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
      <span style="display:none;width:100%;height:100%;align-items:center;justify-content:center;font-weight:800;color:#30363d">${esc((name || '?')[0])}</span>`
    : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:#222831;font-size:17px;font-weight:800">?</div>`}
  </div>`;

  // ── the wall, in pairs ──
  const wall = pairs.map(([a, b], i) => {
    const inHouse = i <= at;
    return `<div class="bbdn-duo ${i === look ? 'is-now' : ''} ${inHouse ? 'is-in' : ''}"
      ${inHouse ? jump(at, i) : ''}>
      <div class="bbdn-two">
        <div class="bbf-tile">${frame(a, inHouse)}<div class="bbf-name">${inHouse ? esc(a) : '—'}</div></div>
        <div class="bbdn-link" aria-hidden="true"></div>
        <div class="bbf-tile">${frame(b, inHouse)}<div class="bbf-name">${inHouse ? esc(b) : '—'}</div></div>
      </div>
      <div class="bbdn-kin">${inHouse ? esc(kin[i] || 'Came in together') : 'WHO?'}</div>
    </div>`;
  }).join('');

  const current = look >= 0 && look < pairs.length ? pairs[look] : null;

  let html = `<style>${OPEN_CSS}</style><div class="rp-page bb-room bb-open">
    <div class="rp-co-eyebrow">A SEASON-LONG TWIST</div>
    <div class="bbdn-title">DYNAMIC DUOS</div>
    <div class="bbdn-strap">Nobody walked into this house on their own. The Head of Household does not
      nominate two houseguests — they nominate two who came in together.</div>

    <div class="bbdn-rules">
      ${(act.rules || []).map((r, i) => `<div class="bbdn-rule${i === 1 ? ' is-hard' : ''}">${esc(r)}</div>`).join('')}
    </div>

    <div class="bbf-feed">
      <div class="bbf-hud">
        <span class="bbf-rec">LIVE</span>
        <span>CAM 01 &middot; FRONT DOOR</span>
        <span>DAY 1</span>
        <span class="bbf-hud-sp">${shown} / ${pairs.length} DUOS THROUGH THE DOOR</span>
      </div>
      <div class="bbdn-wall">${wall}</div>`;

  // ── the close-up: the two who just came through ──
  if (current) {
    const [a, b] = current;
    const label = kin[look] || 'Came in together';
    html += `<div class="bbdn-spot">
      <div class="bbdn-spot-head">
        <div class="bbdn-portraits">
          <div class="bbdn-port">${frame(a, true)}<span>${esc(a)}</span></div>
          <div class="bbdn-link is-big" aria-hidden="true"></div>
          <div class="bbdn-port">${frame(b, true)}<span>${esc(b)}</span></div>
        </div>
        <div class="bbdn-kinbig">${esc(label)}</div>
        <div class="bbdn-arrival">${esc(_duoArrival(a, b, label, look))}</div>
      </div>
      <div class="bbdn-says">
        ${[a, b].map(n => `<div class="bbdn-say">
          <div class="bbdn-sayname">${esc(n)}</div>
          <div class="bbf-introq">${esc(quote(n))}</div>
          <div class="bbf-reads">
            <span class="bbf-reads-k">FIRST READ</span>
            ${(reads(n) || []).map(r => `<span class="bbf-read">${esc(r)}</span>`).join('')}
          </div>
        </div>`).join('')}
      </div>
    </div>`;
  } else {
    html += `<div class="bbdn-empty">${pairs.length} pairs, one door, and a wall of frames with
      nobody in them.</div>`;
  }
  html += `</div>`;

  // ── the reveal controls ──
  html += `<div class="bbdn-ctrl">
    ${!done
    ? `<button class="rp-btn" ${jump(Math.min(at + 1, pairs.length - 1), Math.min(at + 1, pairs.length - 1))}>Next duo</button>
       <button class="rp-btn" ${jump(pairs.length - 1, look)}>Open the door</button>`
    : `<button class="rp-btn" ${jump(0, 0)}>Watch them come in</button>`}
    <span class="bbdn-count">${shown} of ${pairs.length} through the door</span>
  </div>`;

  // ── whoever came alone ──
  {
    if (singles.length) {
      html += `<div class="bbdn-alone">
        <div class="bbdn-alone-k">CAME IN ALONE</div>
        <div class="bbdn-alone-n">${singles.map(n => esc(n)).join(' &middot; ')}</div>
        <div class="bbdn-alone-t">${singles.length === 1 ? 'This houseguest has' : 'These houseguests have'}
          nobody to be nominated beside${act.goldenKey === false
    ? ', which makes them the cheapest name on that wall — a Head of Household can put them up and it costs nobody else.'
    : ' — and no partner to lose, which means no Golden Key to win.'}</div>
      </div>`;
    }
  }

  html += `</div>`;
  return html;
}

/** What it looks like when these two in particular come through the door. */
function _duoArrival(a, b, label, salt = 0) {
  const L = String(label || '').toLowerCase();
  const pools = [];
  if (/ex/.test(L)) {
    pools.push(`${a} comes through first and does not hold the door. ${b} catches it. The room works `
      + `out what it is looking at before either of them says the word.`);
    pools.push(`They arrive four seconds apart and stand further from each other than anybody else in `
      + `the house is standing. ${a} says it out loud so ${b} does not have to.`);
  } else if (/married|partner/.test(L)) {
    pools.push(`${a} and ${b} come in holding hands, which lasts until somebody counts the votes in `
      + `their head and the whole room does the same sum at once.`);
    pools.push(`They walk in together and the temperature of the greeting drops about halfway through. `
      + `Two people who arrive as one thing are two votes that were never available.`);
  } else if (/twin|sibling|cousin|parent/.test(L)) {
    pools.push(`The resemblance does the announcing before either of them opens their mouth. ${a} `
      + `goes in first anyway, which the house also notices.`);
    pools.push(`${a} and ${b} come in one after the other and the room spends the next hour deciding `
      + `which of them is the dangerous one.`);
  } else if (/estranged/.test(L)) {
    pools.push(`${a} and ${b} are family and have not been in the same room in years. They are about `
      + `to be in the same room for eleven weeks.`);
  } else if (/worked|colleague/.test(L)) {
    pools.push(`${a} and ${b} have spent more hours in each other's company than anybody else here has `
      + `spent with anyone, and neither of them chose a single one of them.`);
  } else {
    pools.push(`${a} and ${b} knew each other before any of this, which in this house is either the `
      + `best thing you can walk in with or the worst.`);
    pools.push(`They come through together, and the room starts counting immediately.`);
  }
  pools.push(`Whatever ${a} and ${b} are to each other, from tonight they are one nomination.`);
  return pools[Math.abs(Number(salt) || 0) % pools.length];
}

const OPEN_CSS = `
.bb-open .bbdn-title{font-family:var(--font-display);font-size:30px;letter-spacing:3px;text-align:center;
  color:var(--accent-gold);text-shadow:0 0 22px rgba(240,165,0,.45);margin:8px 0 6px;}
.bb-open .bbdn-strap{text-align:center;font-size:12.5px;line-height:1.6;color:#8b949e;max-width:560px;
  margin:0 auto 12px;}
.bb-open .bbdn-wall{display:grid;grid-template-columns:repeat(auto-fill,minmax(168px,1fr));
  gap:12px;padding:14px 12px 6px;}
.bb-open .bbdn-duo{border:1px solid rgba(139,148,158,.16);border-radius:6px;padding:9px 8px 7px;
  background:rgba(255,255,255,.02);transition:border-color .18s,box-shadow .18s;}
.bb-open .bbdn-duo.is-in{cursor:pointer;border-color:rgba(240,165,0,.28);}
.bb-open .bbdn-duo.is-now{border-color:#f0a500;box-shadow:0 0 18px rgba(240,165,0,.3);}
.bb-open .bbdn-two{display:grid;grid-template-columns:1fr 26px 1fr;align-items:start;gap:2px;}
.bb-open .bbdn-two .bbf-tile{min-width:0;}
/* the only new primitive: two frames, one chain */
.bb-open .bbdn-link{position:relative;height:46px;}
.bb-open .bbdn-link::before,.bb-open .bbdn-link::after{content:'';position:absolute;top:50%;
  width:13px;height:10px;border:2px solid rgba(240,165,0,.75);border-radius:5px;
  transform:translateY(-50%);}
.bb-open .bbdn-link::before{left:-1px;}
.bb-open .bbdn-link::after{right:-1px;}
.bb-open .bbdn-link.is-big{height:96px;width:40px;}
.bb-open .bbdn-link.is-big::before,.bb-open .bbdn-link.is-big::after{width:19px;height:14px;border-width:2.5px;}
.bb-open .bbdn-kin{margin-top:5px;text-align:center;font-family:ui-monospace,Consolas,monospace;
  font-size:7.5px;letter-spacing:1.5px;text-transform:uppercase;color:#f0a500;opacity:.85;}
.bb-open .bbdn-duo:not(.is-in) .bbdn-kin{color:#3d444d;}
.bb-open .bbdn-spot{margin:6px 12px 14px;padding:14px;border-radius:6px;
  border:1px solid rgba(240,165,0,.22);background:rgba(240,165,0,.045);}
.bb-open .bbdn-portraits{display:flex;align-items:center;justify-content:center;gap:6px;}
.bb-open .bbdn-port{width:96px;text-align:center;}
.bb-open .bbdn-port .bbf-frame{width:96px;height:96px;}
.bb-open .bbdn-port span{display:block;margin-top:5px;font-family:var(--font-display);font-size:15px;
  color:#f0f6fc;}
.bb-open .bbdn-kinbig{text-align:center;margin:10px 0 4px;font-family:ui-monospace,Consolas,monospace;
  font-size:9px;letter-spacing:2.4px;text-transform:uppercase;color:#f0a500;}
.bb-open .bbdn-arrival{text-align:center;font-size:12.5px;line-height:1.65;color:#c9d1d9;
  max-width:520px;margin:0 auto;}
.bb-open .bbdn-says{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:10px;
  margin-top:14px;}
.bb-open .bbdn-say{padding:10px 12px;border-radius:5px;background:rgba(0,0,0,.25);
  border:1px solid rgba(139,148,158,.14);}
.bb-open .bbdn-sayname{font-family:ui-monospace,Consolas,monospace;font-size:8px;letter-spacing:1.6px;
  text-transform:uppercase;color:#f0a500;margin-bottom:6px;}
.bb-open .bbdn-empty{text-align:center;padding:22px 16px;margin:0 12px 14px;border-radius:6px;
  border:1px dashed rgba(139,148,158,.2);font-size:12.5px;color:#8b949e;}
.bb-open .bbdn-ctrl{display:flex;gap:8px;justify-content:center;align-items:center;margin-top:14px;}
.bb-open .bbdn-count{font-family:ui-monospace,Consolas,monospace;font-size:9px;letter-spacing:1.4px;
  color:#6e7681;}
.bb-open .bbdn-rules{max-width:640px;margin:16px auto 0;display:flex;flex-direction:column;gap:7px;}
.bb-open .bbdn-rule{padding:10px 13px;border-left:3px solid #f0a500;background:rgba(240,165,0,.06);
  border-radius:0 5px 5px 0;font-size:12.5px;line-height:1.6;color:#c9d1d9;}
.bb-open .bbdn-rule.is-hard{border-left-color:#f85149;background:rgba(248,81,73,.08);color:#f0f6fc;}
.bb-open .bbdn-alone{max-width:640px;margin:12px auto 0;padding:12px 14px;border-radius:6px;
  border:1px dashed rgba(248,81,73,.35);background:rgba(248,81,73,.05);text-align:center;}
.bb-open .bbdn-alone-k{font-family:ui-monospace,Consolas,monospace;font-size:8px;letter-spacing:2px;
  color:#f85149;}
.bb-open .bbdn-alone-n{font-family:var(--font-display);font-size:17px;color:#f0f6fc;margin:5px 0 6px;}
.bb-open .bbdn-alone-t{font-size:12px;line-height:1.6;color:#8b949e;max-width:480px;margin:0 auto;}
@media(prefers-reduced-motion:reduce){.bb-open .bbdn-duo{transition:none;}}
`;


/** A partner is gone, and what is left is safety nobody can spend. */
export function rpBuildBBDuosKey(ep, act, u = {}) {
  if (!act) return '';
  const esc = typeof u.esc === 'function' ? u.esc : esc0;
  const avatar = typeof u.avatar === 'function' ? u.avatar : () => '';

  return shell(`
    <div class="duo-eyebrow">WEEK ${esc(act.week)} &middot; THE DUO IS BROKEN</div>
    <div class="duo-title">GOLDEN KEY</div>

    <div class="duo-keycard">
      ${avatar(act.holder, 84)}
      <div class="duo-keyname">${esc(act.holder)}</div>
      <div class="duo-keysub">
        ${esc(act.partner)} is gone, so the key is theirs.<br>
        Safe from nomination and eviction until ${esc(act.keyAt)} are left —
        and competing for nothing at all until then.
      </div>
    </div>

    ${(act.holders || []).length > 1 ? `<div class="duo-ledger">
      ${act.holders.map(n => `<div class="duo-chip is-key">🔑 ${esc(n)}</div>`).join('')}
    </div>` : ''}

    ${beats(act, esc)}
  `);
}

/** Every key stops at once. */
export function rpBuildBBDuosExpire(ep, act, u = {}) {
  if (!act) return '';
  const esc = typeof u.esc === 'function' ? u.esc : esc0;
  const avatar = typeof u.avatar === 'function' ? u.avatar : () => '';

  return shell(`
    <div class="duo-eyebrow">WEEK ${esc(act.week)} &middot; ${esc(act.keyAt)} LEFT</div>
    <div class="duo-title">THE KEYS ARE DONE</div>
    <div class="duo-sub">Everybody who has been carried this far has to play now,
      against people who have been playing the whole time.</div>

    <div class="duo-pairs">
      ${(act.holders || []).map(n => `<div class="duo-pair">
        ${avatar(n, 26)}<span>${esc(n)}</span></div>`).join('')}
    </div>

    ${beats(act, esc)}
  `);
}

/** Two loose ends, handed to each other. */
export function rpBuildBBDuosRepair(ep, act, u = {}) {
  if (!act) return '';
  const esc = typeof u.esc === 'function' ? u.esc : esc0;
  const avatar = typeof u.avatar === 'function' ? u.avatar : () => '';

  return shell(`
    <div class="duo-eyebrow">WEEK ${esc(act.week)} &middot; BIG BROTHER DECIDES</div>
    <div class="duo-title">RE-PAIRED</div>
    <div class="duo-sub">Nobody in this house lost a partner and got to stay on their own.
      These two did not choose each other and are not being asked to.</div>

    <div class="duo-pairs">
      ${(act.pairs || []).map(([a, b]) => `<div class="duo-pair">
        ${avatar(a, 26)}<span>${esc(a)}</span><span class="duo-amp">&amp;</span>
        ${avatar(b, 26)}<span>${esc(b)}</span></div>`).join('')}
    </div>

    ${act.waiting ? `<div class="duo-solo"><b>${esc(act.waiting)}</b> is still on their own \u2014 and an
      orphan can be put on that block alone, which costs the next Head of Household nobody at all.</div>` : ''}

    ${beats(act, esc)}
  `);
}

/** The week in a Duos season: what being chained to somebody does. */
export function rpBuildBBDuosWeek(ep, act, u = {}) {
  if (!act) return '';
  const esc = typeof u.esc === 'function' ? u.esc : esc0;
  const kind = e => e.badgeClass === 'red' ? 'k-red'
    : e.badgeClass === 'green' ? 'k-green' : e.badgeClass === 'blue' ? 'k-blue' : '';

  return shell(`
    <div class="duo-eyebrow">WEEK ${esc(act.week)} &middot; ${act.goldenKey ? 'GOLDEN KEY SEASON' : 'PAIRS ONLY'}</div>
    <div class="duo-title">PLAYING IN TWOS</div>

    <div class="duo-state">
      ${(act.pairs || []).map(([a, b]) =>
    `<div class="duo-chip">${esc(a)} &amp; ${esc(b)}</div>`).join('')}
      ${(act.keys || []).map(n => `<div class="duo-chip is-key">\ud83d\udd11 ${esc(n)}</div>`).join('')}
      ${(act.orphaned || []).map(n => `<div class="duo-chip">${esc(n)} \u2014 alone</div>`).join('')}
    </div>

    <div class="duo-evs">
      ${(act.events || []).map(e => `<div class="duo-ev ${kind(e)}">
        <div class="duo-tag">${esc(e.badgeText || '')}</div>
        <div>${esc(e.text)}</div>
      </div>`).join('')}
    </div>
  `);
}
