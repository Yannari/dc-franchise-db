// ══════════════════════════════════════════════════════════════════════
// vp-bb-sig/knockout.js — "The Podiums"
//
// The themed screen for js/bb-comps/knockout.js (`variant: 'duel'`).
//
// This competition is not a scoreboard, it is a sequence of two-person
// confrontations, so the screen is built as one: every duel is a head-to-head
// card with the two houseguests facing each other across a lit buzzer, and
// every duel is preceded by the card that matters more — who SENT them, drawn
// as an arrow from the chooser to the two names they picked.
//
// A rail across the top holds the field, and houseguests go dark on it in the
// duel that took them out, so the room empties as the reveal advances.
//
// All narration comes from the competition's beats; who won and who went comes
// from breakdown[name].outDuel. Declines when the duel record is missing.
// u.reveal() only, gated on _tvState[stateKey].idx, no Math.random.
// ══════════════════════════════════════════════════════════════════════

import { isSealedHoh, planSeal, sealCss, sealCutCard, sealIronyCard } from './_sealed.js';

/** @returns {string} html, or '' to fall back to the generic screen */
export function rpBuildSigKnockout(ep, actType, u = {}) {
  const act = (ep?.acts || []).find(a => a.type === actType);
  const comp = act?.competition;
  if (!act || !comp) return '';
  const sealed = isSealedHoh(act, actType);

  const beats = (comp.beats || []).filter(b => b && b.text);
  if (!beats.length) return '';

  const breakdown = comp.breakdown || comp.debug?.scoreBreakdown || {};
  const hasDuels = Object.values(breakdown).some(v => v && typeof v.duels === 'number');
  if (!hasDuels) return '';

  const E = v => (typeof u.esc === 'function' ? u.esc(v) : String(v ?? ''));
  const AV = (n, px) => (typeof u.avatar === 'function' ? u.avatar(n, px) : '');
  const cat = (typeof u.cat === 'function' ? u.cat(comp.category) : u.cat) || { label: 'MEMORY', accent: '#e5484d' };
  // The buzzer red this screen is lit in; the category chip keeps its own.
  const accent = '#e5484d';
  const isHoh = actType === 'hoh';

  const stateKey = `bb_sig_knock_${ep.num}_${actType}${ep?._seg ? `_s${ep._seg}` : ''}`;
  if (!u.tvState) u.tvState = {};
  if (!u.tvState[stateKey]) u.tvState[stateKey] = { idx: -1 };
  const state = u.tvState[stateKey];

  const flav = (pool, salt) =>
    pool[Math.abs((Number(ep?.num) || 0) * 13 + salt * 3 + pool.length) % pool.length];

  const DUEL_FLAV = [
    'Two buzzers. One of them is going to matter.',
    'Nobody in the room is allowed to help, which does not stop anybody trying to.',
    'The picture stays up for exactly as long as it takes somebody to be brave.',
    'The gap between knowing it and being willing to say it is where this competition lives.',
    'Whoever wins this gets to decide who goes next, and everybody standing there knows it.',
  ];
  const PICK_FLAV = [
    'A pick is a public statement with no way to soften it afterwards.',
    'One of these two is not coming back from the podium, and the person who chose them picked that.',
    'Nobody forgets who sent them up. Nobody has ever forgotten who sent them up.',
    'It is the only competition in the house where winning makes you an enemy on purpose.',
  ];
  const WIN_FLAV = [
    'Last one holding a buzzer.',
    'The podiums get wheeled off. The list of people who were sent up stays.',
    'A competition won partly on reflex and mostly on other people.',
    'The room empties one duel at a time until there is nobody left to send.',
  ];

  // ── steps: a pick, then the duel it set up ───────────────────────────
  const OUTCOME = new Set(['ELIMINATED', 'WRONG ANSWER', 'BOTH OUT', 'ON THE BUZZER']);
  const DRE = /^Duel (\d+)\./;
  let steps = [];
  let cur = null;
  beats.forEach((b, i) => {
    const tag = String(b.badgeText || '').toUpperCase().trim();
    if (b.badgeClass === 'gold' || tag === 'HOH' || tag === 'VETO') { steps.push({ kind: 'win', beat: b }); cur = null; return; }
    if (tag === 'THE PICK') { steps.push({ kind: 'pick', beat: b }); cur = null; return; }
    if (tag === 'NO CHOICE') { steps.push({ kind: 'nochoice', beat: b }); cur = null; return; }
    const m = DRE.exec(b.text || '');
    if (m) {
      cur = { kind: 'duel', n: Number(m[1]), beat: b, outcome: null,
        pair: (b.players || []).filter(Boolean) };
      steps.push(cur);
      return;
    }
    if (OUTCOME.has(tag) && cur?.kind === 'duel') { cur.outcome = b; return; }
    if (i === 0) { steps.push({ kind: 'open', beat: b }); return; }
    steps.push({ kind: 'note', beat: b });
  });
  if (!steps.length) return '';

  // Who went out in each duel, read off the record rather than the sentence.
  steps.forEach(s => {
    if (s.kind !== 'duel') return;
    s.out = s.pair.filter(n => breakdown[n]?.outDuel === s.n);
    s.survivor = s.pair.find(n => !s.out.includes(n)) || null;
    s.wrong = String(s.outcome?.badgeText || '').toUpperCase() === 'WRONG ANSWER';
    s.bothOut = s.out.length > 1;
  });

  const roster = (act.participants && act.participants.length
    ? act.participants
    : (act.results || []).map(r => r.name)).filter(Boolean);
  const winner = act.winner || (act.results || [])[0]?.name || '';

  // Sealed: duels eliminate one houseguest at a time, so the survivor is
  // derivable as soon as the podiums are nearly empty. Stop while four are
  // still standing.
  if (sealed) {
    let left = roster.length;
    const keep = planSeal(steps, {
      floor: 4,
      survivorsAfter: st => st.kind === 'duel' ? (left -= (st.out || []).length) : null,
      isResult: st => st.kind === 'win',
    });
    steps = steps.slice(0, keep);
    steps.push({ kind: 'cut' }, { kind: 'irony' });
  }

  const total = steps.length;
  const revealed = Math.min(total, Math.max(0, state.idx + 1));
  const done = state.idx >= total - 1;

  const shownDuels = steps.slice(0, revealed).filter(s => s.kind === 'duel');
  const goneNow = new Set();
  shownDuels.forEach(s => (s.out || []).forEach(n => goneNow.add(n)));
  const standing = Math.max(1, roster.length - goneNow.size);
  const totalDuels = steps.filter(s => s.kind === 'duel').length;

  const rail = `<div class="kno-rail">
    ${roster.map((n, i) => {
      const out = goneNow.has(n);
      const at = breakdown[n]?.outDuel;
      const won = !sealed && done && n === winner;
      return `<div class="kno-hg ${out ? 'is-out' : ''} ${won ? 'is-win' : ''}" style="animation-delay:${(i % 8) * 45}ms"
           title="${E(n)}${out && at ? ` — out in duel ${at}` : ''}">
        <span class="kno-hg-av">${AV(n, 32)}</span>
        <span class="kno-hg-n">${E(String(n).split(' ')[0])}</span>
        ${out && at ? `<span class="kno-hg-d">D${E(at)}</span>` : ''}
      </div>`;
    }).join('')}
  </div>`;

  const strip = `<div class="kno-strip">
    <div><span class="kno-k">STILL STANDING</span><span class="kno-v"><b>${standing}</b><i>/ ${roster.length}</i></span></div>
    <div><span class="kno-k">DUELS</span><span class="kno-v"><b>${shownDuels.length}</b><i>/ ${totalDuels}</i></span></div>
    <div class="kno-strip-r"><span class="kno-k">${done ? 'RESULT' : 'AT THE PODIUMS'}</span>
      <span class="kno-v kno-v-txt">${sealed
        ? (done ? 'RESULT SEALED — THE HOUSE NEVER FINDS OUT' : 'RESULT SEALED')
        : done && winner
          ? `${E(winner)} — ${isHoh ? 'HEAD OF HOUSEHOLD' : 'POWER OF VETO'}`
          : shownDuels.length ? `DUEL ${shownDuels[shownDuels.length - 1].n} DONE` : 'BUZZERS LIVE'}</span></div>
  </div>`;

  const cards = steps.map((s, i) => {
    if (i > state.idx) return `<div class="kno-card is-locked"><span class="kno-lock">■ ■</span></div>`;

    if (s.kind === 'open') {
      return `<article class="kno-card kno-open">
        <header class="kno-hd"><span class="kno-tag">${E(s.beat.badgeText || 'THE PODIUMS')}</span>
          <span class="kno-sub">${roster.length} playing</span></header>
        <p class="kno-body">${E(s.beat.text)}</p>
      </article>`;
    }

    if (s.kind === 'cut') {
      return sealCutCard('kno', { standing: Math.max(1, roster.length - goneNow.size),
        unit: 'still holding a buzzer', salt: Number(ep.num) || 0 });
    }
    if (s.kind === 'irony') return sealIronyCard('kno', { winner, avatar: AV, esc: E, isHoh });

    if (s.kind === 'win') {
      const bd = breakdown[winner] || {};
      return `<article class="kno-card kno-win">
        <header class="kno-hd"><span class="kno-tag kno-tag-gold">${E(s.beat.badgeText || (isHoh ? 'HOH' : 'VETO'))}</span>
          <span class="kno-sub">last one standing</span></header>
        <div class="kno-win-b">
          <figure class="kno-win-av">${AV(winner, 72)}</figure>
          <div>
            <div class="kno-win-n">${E(winner)}</div>
            <p class="kno-body">${E(s.beat.text)}</p>
            <div class="kno-win-nums">
              <span><i>DUELS</i><b>${E(bd.duels ?? 0)}</b></span>
              <span><i>WON</i><b>${E(bd.wins ?? 0)}</b></span>
              <span><i>PICKS MADE</i><b>${E(bd.picks ?? 0)}</b></span>
            </div>
          </div>
        </div>
        <p class="kno-flav">${E(flav(WIN_FLAV, i))}</p>
      </article>`;
    }

    if (s.kind === 'pick') {
      const who = (s.beat.players || []).filter(Boolean);
      const chooser = who[0];
      const sent = who.slice(1);
      return `<article class="kno-card kno-pick">
        <header class="kno-hd"><span class="kno-tag kno-tag-pick">${E(s.beat.badgeText || 'THE PICK')}</span>
          <span class="kno-sub">one of them will not come back</span></header>
        <div class="kno-pick-b">
          <figure class="kno-pick-who">${AV(chooser, 46)}<figcaption>${E(chooser)}</figcaption></figure>
          <span class="kno-arrow" aria-hidden="true">
            <svg viewBox="0 0 60 24"><path d="M2 12h48M42 5l9 7-9 7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>
            <u>SENDS</u>
          </span>
          <div class="kno-pick-sent">
            ${sent.map(n => `<figure>${AV(n, 40)}<figcaption>${E(n)}</figcaption></figure>`).join('')}
          </div>
        </div>
        <p class="kno-body">${E(s.beat.text)}</p>
        <p class="kno-flav">${E(flav(PICK_FLAV, i))}</p>
      </article>`;
    }

    if (s.kind === 'nochoice' || s.kind === 'note') {
      return `<article class="kno-card kno-note">
        <header class="kno-hd"><span class="kno-tag kno-tag-quiet">${E(s.beat.badgeText || '')}</span></header>
        <p class="kno-body">${E(s.beat.text)}</p>
      </article>`;
    }

    // ── a duel ──
    const [a, b] = s.pair;
    const side = n => s.bothOut ? 'is-gone'
      : (s.out || []).includes(n) ? 'is-gone' : 'is-safe';
    return `<article class="kno-card kno-duel ${s.bothOut ? 'is-both' : ''}">
      <header class="kno-hd">
        <span class="kno-tag">${E(s.beat.badgeText || `DUEL ${s.n}`)}</span>
        <span class="kno-sub">${s.bothOut ? 'both eliminated' : s.wrong ? 'lost on a wrong answer' : 'eliminated on the buzzer'}</span>
      </header>

      <div class="kno-face">
        <figure class="kno-side ${side(a)}">
          ${AV(a, 58)}<figcaption>${E(a || '')}</figcaption>
          ${(s.out || []).includes(a) ? '<span class="kno-outmark">OUT</span>' : ''}
        </figure>
        <div class="kno-buzz">
          <span class="kno-buzz-btn ${s.bothOut ? 'is-dead' : ''}" aria-hidden="true"></span>
          <span class="kno-vs">VS</span>
        </div>
        <figure class="kno-side ${side(b)}">
          ${AV(b, 58)}<figcaption>${E(b || '')}</figcaption>
          ${(s.out || []).includes(b) ? '<span class="kno-outmark">OUT</span>' : ''}
        </figure>
      </div>

      <p class="kno-q">${E(s.beat.text)}</p>
      ${s.outcome ? `<p class="kno-outcome ${s.wrong ? 'is-wrong' : ''} ${s.bothOut ? 'is-both' : ''}">
        <span class="kno-outcome-tag">${E(s.outcome.badgeText || '')}</span>${E(s.outcome.text)}</p>` : ''}
      <p class="kno-flav">${E(flav(DUEL_FLAV, i))}</p>
    </article>`;
  }).join('');

  const weights = Object.entries(comp.stats || {}).sort((x, y) => y[1] - x[1]).slice(0, 4);

  return `<div class="rp-page bb-room ${isHoh ? 'bb-power' : 'bb-block'} sigknock">
  <style>
  @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Karla:wght@400;500;600&display=swap');
  .sigknock{--kn-ink:#f3eaea;--kn-dim:#a89094;--kn-line:rgba(229,72,77,.26);
    max-width:1100px;margin:0 auto;font-family:Karla,system-ui,sans-serif;color:var(--kn-ink);
    background:radial-gradient(115% 80% at 50% -12%,#2e1417 0%,#1a0d10 52%,#0a0507 100%);
    border-radius:12px;padding:18px 16px 0;position:relative;overflow:clip}
  .sigknock::before{content:'';position:absolute;inset:46px 0 0;pointer-events:none;
    background:radial-gradient(38% 55% at 26% 0%,rgba(255,170,170,.11),transparent 70%),
               radial-gradient(38% 55% at 74% 0%,rgba(255,170,170,.11),transparent 70%);
    animation:kno-lamp 6s ease-in-out infinite alternate}
  @keyframes kno-lamp{from{opacity:.5}to{opacity:1}}

  .kno-eyebrow{font-family:Oswald,sans-serif;font-size:10px;letter-spacing:4px;color:var(--kn-dim);text-align:center}
  .kno-title{font-family:Oswald,sans-serif;font-weight:700;font-size:36px;letter-spacing:6px;text-align:center;
    color:#fff0f0;text-shadow:0 0 26px ${accent}99;margin:2px 0}
  .kno-tagline{text-align:center;font-size:11.5px;letter-spacing:2px;color:var(--kn-dim);margin-bottom:12px}

  .kno-what{border:1px solid var(--kn-line);border-radius:10px;padding:10px 12px;margin-bottom:12px;
    background:linear-gradient(180deg,rgba(52,22,26,.62),rgba(16,9,11,.62))}
  .kno-what-h{display:flex;align-items:center;gap:8px;flex-wrap:wrap;font-family:Oswald,sans-serif;font-size:16px;letter-spacing:1px}
  .kno-what-c{font-size:9px;letter-spacing:2px;border:1px solid ${cat.accent || accent}66;color:${cat.accent || accent};padding:2px 6px;border-radius:3px}
  .kno-what-d{font-size:13px;line-height:1.55;color:var(--kn-dim);margin:6px 0 0}
  .kno-w{display:flex;gap:12px;flex-wrap:wrap;margin-top:8px}
  .kno-w span{display:flex;align-items:center;gap:6px;font-size:10px;letter-spacing:1.2px;color:var(--kn-dim);text-transform:uppercase}
  .kno-w s{text-decoration:none;display:inline-block;width:50px;height:4px;border-radius:2px;background:rgba(255,255,255,.1)}
  .kno-w s b{display:block;height:100%;border-radius:2px;background:${accent}}

  .kno-rail{display:flex;flex-wrap:wrap;gap:7px;justify-content:center;padding:11px 8px;margin-bottom:10px;
    border:1px solid var(--kn-line);border-radius:10px;background:rgba(9,5,6,.6)}
  .kno-hg{position:relative;display:flex;flex-direction:column;align-items:center;gap:3px;width:50px;animation:kno-in .3s ease both}
  .kno-hg .bb-av{border-radius:6px;border:2px solid ${accent}66}
  .kno-hg-n{font-family:Oswald,sans-serif;font-size:9px;letter-spacing:.8px;color:#eddadb}
  .kno-hg.is-out{opacity:.3;filter:grayscale(.85)}
  .kno-hg.is-out .bb-av{border-color:#5c4a4c}
  .kno-hg.is-win .bb-av{border-color:#ffd970;box-shadow:0 0 16px rgba(255,217,112,.6)}
  .kno-hg-d{position:absolute;top:-4px;right:-2px;font-family:Oswald,sans-serif;font-size:8px;
    background:#5c4a4c;color:#1a0d10;border-radius:3px;padding:0 3px}

  .kno-k{font-family:Oswald,sans-serif;font-size:9px;letter-spacing:2.2px;color:var(--kn-dim)}
  .kno-strip{position:sticky;top:46px;z-index:6;display:grid;grid-template-columns:1fr 1fr 1.5fr;gap:8px;
    padding:8px 10px;margin-bottom:14px;border:1px solid var(--kn-line);border-radius:8px;
    background:rgba(10,5,7,.95);backdrop-filter:blur(4px)}
  .kno-strip>div{display:flex;flex-direction:column;gap:2px;min-width:0}
  .kno-strip-r{border-left:1px solid var(--kn-line);padding-left:10px}
  .kno-v{font-family:Oswald,sans-serif;font-size:20px;display:flex;align-items:baseline;gap:5px}
  .kno-v b{color:${accent}}.kno-v i{font-style:normal;font-size:11px;color:var(--kn-dim)}
  .kno-v-txt{font-size:12.5px;letter-spacing:1.4px;display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}

  .kno-card{border:1px solid var(--kn-line);border-radius:10px;padding:12px 13px;margin-bottom:10px;
    background:linear-gradient(180deg,rgba(44,20,24,.72),rgba(13,7,9,.8));animation:kno-in .32s cubic-bezier(.2,.8,.25,1) both}
  @keyframes kno-in{from{opacity:0;transform:translateY(9px)}to{opacity:1;transform:none}}
  .kno-card.is-locked{padding:8px;text-align:center;opacity:.13;animation:none;background:none}
  .kno-lock{letter-spacing:6px;color:var(--kn-dim)}
  .kno-hd{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin-bottom:8px}
  .kno-sub{font-family:Oswald,sans-serif;font-size:9px;letter-spacing:2px;color:var(--kn-dim)}
  .kno-tag{font-family:Oswald,sans-serif;font-size:10.5px;letter-spacing:2.2px;color:${accent};
    border:1px solid ${accent}55;background:${accent}14;padding:2px 9px;border-radius:3px}
  .kno-tag-gold{color:#ffd970;border-color:#ffd97066;background:#ffd97018}
  .kno-tag-pick{color:#ffb057;border-color:#ffb05766;background:#ffb05716}
  .kno-tag-quiet{color:#a89094;border-color:#a8909444;background:#a8909411}
  .kno-body{font-size:14px;line-height:1.62;margin:0}
  .kno-flav{margin:9px 0 0;padding-top:7px;border-top:1px dashed rgba(210,150,155,.18);font-size:12px;color:#9b8488;font-style:italic}

  /* The pick: an arrow from the person who chose to the two who were chosen. */
  .kno-pick{border-color:rgba(255,176,87,.4)}
  .kno-pick-b{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:9px}
  .kno-pick-who{margin:0;text-align:center}
  .kno-pick-who .bb-av{border-radius:8px;border:2px solid #ffb057}
  .kno-pick-who figcaption,.kno-pick-sent figcaption{font-family:Oswald,sans-serif;font-size:11px;letter-spacing:1px;margin-top:4px}
  .kno-arrow{display:flex;flex-direction:column;align-items:center;gap:2px;color:#ffb057}
  .kno-arrow svg{width:56px;height:22px}
  .kno-arrow u{text-decoration:none;font-family:Oswald,sans-serif;font-size:8px;letter-spacing:2px}
  .kno-pick-sent{display:flex;gap:10px}
  .kno-pick-sent figure{margin:0;text-align:center}
  .kno-pick-sent .bb-av{border-radius:8px;border:2px solid rgba(255,255,255,.18)}

  /* The duel: two podiums and a buzzer between them. */
  .kno-face{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:10px;margin-bottom:10px}
  .kno-side{margin:0;text-align:center;position:relative;padding:9px 6px;border-radius:9px;
    border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.03)}
  .kno-side .bb-av{border-radius:8px;border:2px solid rgba(255,255,255,.16)}
  .kno-side figcaption{font-family:Oswald,sans-serif;font-size:14px;letter-spacing:1.4px;margin-top:5px;color:#f4e6e7}
  .kno-side.is-safe{border-color:${accent}77;background:${accent}10}
  .kno-side.is-gone{opacity:.55;filter:grayscale(.6)}
  .kno-outmark{position:absolute;top:-8px;left:50%;transform:translateX(-50%);font-family:Oswald,sans-serif;
    font-size:8px;letter-spacing:2px;background:#8b5b5e;color:#1a0d10;border-radius:3px;padding:1px 7px}
  .kno-buzz{display:flex;flex-direction:column;align-items:center;gap:5px}
  .kno-buzz-btn{display:block;width:26px;height:26px;border-radius:50%;
    background:radial-gradient(circle at 34% 30%,#ff8a8a,${accent});box-shadow:0 0 16px ${accent}88;
    animation:kno-pulse 1.9s ease-in-out infinite alternate}
  @keyframes kno-pulse{from{transform:scale(.92);box-shadow:0 0 8px ${accent}66}to{transform:scale(1.04);box-shadow:0 0 20px ${accent}cc}}
  .kno-buzz-btn.is-dead{background:radial-gradient(circle at 34% 30%,#6b5658,#3d2d2f);box-shadow:none;animation:none}
  .kno-vs{font-family:Oswald,sans-serif;font-size:11px;letter-spacing:2px;color:var(--kn-dim)}

  .kno-q{margin:0 0 8px;font-size:13.5px;line-height:1.55;color:#e7d6d8}
  .kno-outcome{margin:0;padding:9px 11px;border-radius:7px;font-size:13.5px;line-height:1.55;
    background:rgba(255,255,255,.04);border-left:3px solid ${accent}}
  .kno-outcome.is-wrong{border-left-color:#ffb057;background:rgba(255,176,87,.08)}
  .kno-outcome.is-both{border-left-color:#8b5b5e;background:rgba(139,91,94,.12)}
  .kno-outcome-tag{display:block;font-family:Oswald,sans-serif;font-size:8.5px;letter-spacing:2px;color:var(--kn-dim);margin-bottom:3px}
  .kno-duel.is-both{border-color:rgba(139,91,94,.5)}

  .kno-win{border-color:rgba(255,217,112,.5);background:linear-gradient(180deg,rgba(70,54,16,.5),rgba(13,7,9,.85))}
  .kno-win-b{display:flex;gap:14px;align-items:center}
  .kno-win-av .bb-av{border-radius:10px;border:3px solid #ffd970;box-shadow:0 0 26px rgba(255,217,112,.5)}
  .kno-win-n{font-family:Oswald,sans-serif;font-size:24px;letter-spacing:2px;color:#ffeab6;margin-bottom:4px}
  .kno-win-nums{display:flex;gap:14px;flex-wrap:wrap;margin-top:8px}
  .kno-win-nums span{display:flex;flex-direction:column;gap:1px}
  .kno-win-nums i{font-style:normal;font-family:Oswald,sans-serif;font-size:8.5px;letter-spacing:1.8px;color:#c9a877}
  .kno-win-nums b{font-family:Oswald,sans-serif;font-size:15px;color:#ffeab6}

  .kno-ctrl{position:sticky;bottom:0;z-index:7;display:flex;gap:8px;justify-content:center;align-items:center;
    padding:10px;margin:6px -16px 0;background:linear-gradient(180deg,rgba(10,5,7,0),rgba(10,5,7,.96) 40%);backdrop-filter:blur(3px)}
  .kno-count,.kno-done{font-family:Oswald,sans-serif;font-size:10px;letter-spacing:2.2px;color:var(--kn-dim)}
  .kno-done{color:${accent}}

  ${sealCss('kno', accent)}
  @media(max-width:700px){
    .kno-strip{grid-template-columns:1fr 1fr}
    .kno-strip-r{grid-column:1/-1;border-left:0;border-top:1px solid var(--kn-line);padding:6px 0 0}
    .kno-title{font-size:26px;letter-spacing:3px}
    .kno-face{grid-template-columns:1fr;gap:6px}
    .kno-pick-b{justify-content:center}
  }
  @media(prefers-reduced-motion:reduce){
    .sigknock *,.sigknock *::before,.sigknock *::after{animation:none!important;transition:none!important}
  }
  </style>

  <div class="kno-eyebrow">WEEK ${E(ep.num)} &middot; ${isHoh ? 'HEAD OF HOUSEHOLD' : 'POWER OF VETO'}</div>
  <div class="kno-title">${E((comp.name || 'KNOCKOUT').toUpperCase())}</div>
  <div class="kno-tagline">${sealed ? 'win the duel &middot; choose the next two &middot; and nobody sees who is left' : 'win the duel &middot; choose the next two &middot; live with it'}</div>

  <div class="kno-what">
    <div class="kno-what-h"><span class="kno-what-c">${E(cat.label)}</span><b>${E(comp.name || 'Knockout')}</b></div>
    ${comp.desc ? `<p class="kno-what-d">${E(comp.desc)}</p>` : ''}
    ${weights.length ? `<div class="kno-w">${weights.map(([k, w]) =>
      `<span>${E(k)}<s><b style="width:${Math.round(w * 100)}%"></b></s>${Math.round(w * 100)}%</span>`).join('')}</div>` : ''}
    ${(comp.excluded || []).filter(Boolean).length ? `<p class="kno-what-d">Sat out: ${
      (comp.excluded || []).filter(Boolean).map(E).join(', ')}${
      isHoh && act.outgoingHoh ? ` &middot; ${E(act.outgoingHoh)} cannot defend the room` : ''}</p>` : ''}
  </div>

  ${rail}
  ${strip}
  <div>${cards}</div>

  <div class="kno-ctrl">
    ${done ? `<span class="kno-done">${sealed ? 'THE HOUSE NEVER FINDS OUT.' : 'THE PODIUMS ARE EMPTY.'}</span>` : `
      <button class="rp-btn" onclick="${u.reveal(ep, stateKey, Math.min(state.idx + 1, total - 1))}requestAnimationFrame(()=>{const c=document.querySelectorAll('.kno-card:not(.is-locked)');const e=c[c.length-1];if(e)e.scrollIntoView({behavior:'smooth',block:'center'});});">${
        state.idx < 0 ? 'Send up the first two' : 'Next'}</button>
      <button class="rp-btn rp-btn-ghost" onclick="${u.reveal(ep, stateKey, total - 1)}">Reveal all</button>`}
    <span class="kno-count">${Math.min(total, revealed)} / ${total}</span>
  </div>
</div>`;
}
