/**
 * Jury Statements — "THE FINAL WORD"
 *
 * Part three is the only competition in the house the JURY plays, and the only
 * one where the people being talked about are sitting in the room. So the screen
 * is not a quiz board. It is a darkened studio with a bench along the top: seven
 * faces the finalists put on that bench, lit one at a time as each of them is
 * played back.
 *
 * The card is a playback panel — the juror on the monitor, the front half of
 * their sentence typed out with the ending cut off, and three lit plaques
 * underneath. Both finalists' answers are stamped ONTO the plaques they chose,
 * so a wrong answer is visibly a finalist reaching for the wrong ending while
 * the person who wrote it watches from six feet away.
 *
 * Nothing here is shared with another competition screen: the bench, the
 * playback frame, the plaques and the two podium columns exist because this
 * competition is two people being asked how well they know the jury they made.
 */

const _STYLE = `<style>
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&family=Barlow+Condensed:wght@400;500;600&display=swap');
.sigjst{--jt-ink:#07080f;--jt-deep:#0d1024;--jt-gold:#d9b46a;--jt-gold2:#f2dfae;--jt-blue:#5f7fd0;
  --jt-ok:#4bbf7a;--jt-no:#c8503f;--jt-glass:rgba(255,255,255,.06);
  font-family:'Barlow Condensed',system-ui,sans-serif;color:#e8e6f2;position:relative;overflow:clip}
.sigjst .jt-wrap{max-width:1100px;margin:0 auto;position:relative;z-index:2;padding:0 12px 78px}

/* ── the studio ── */
.sigjst .jt-bg{position:absolute;inset:46px 0 0 0;z-index:0;pointer-events:none;
  background:
    radial-gradient(58% 34% at 50% -4%,rgba(217,180,106,.20),transparent 62%),
    radial-gradient(90% 60% at 50% 108%,rgba(95,127,208,.14),transparent 60%),
    linear-gradient(180deg,var(--jt-deep),var(--jt-ink) 62%,#04040a)}
.sigjst .jt-bg::before{content:'';position:absolute;left:50%;top:0;width:min(760px,86%);height:70%;
  transform:translateX(-50%);pointer-events:none;
  background:linear-gradient(180deg,rgba(242,223,174,.13),transparent 72%);
  clip-path:polygon(38% 0,62% 0,100% 100%,0 100%);animation:jtBeam 9s ease-in-out infinite}
@keyframes jtBeam{0%,100%{opacity:.55}50%{opacity:.85}}
.sigjst .jt-dust{position:absolute;inset:46px 0 0 0;z-index:1;pointer-events:none;opacity:.5;
  background-image:radial-gradient(1.6px 1.6px at 18% 30%,rgba(255,255,255,.5),transparent),
    radial-gradient(1.3px 1.3px at 64% 18%,rgba(255,255,255,.4),transparent),
    radial-gradient(1.7px 1.7px at 82% 54%,rgba(242,223,174,.45),transparent),
    radial-gradient(1.2px 1.2px at 33% 72%,rgba(255,255,255,.35),transparent);
  animation:jtDrift 22s linear infinite}
@keyframes jtDrift{from{transform:translateY(0)}to{transform:translateY(-90px)}}

/* ── head ── */
.sigjst .jt-head{text-align:center;padding:16px 8px 4px}
.sigjst .jt-eyebrow{font-size:9.5px;letter-spacing:5px;color:var(--jt-gold);text-transform:uppercase}
.sigjst .jt-title{font-family:'Cormorant Garamond',serif;font-weight:600;font-size:46px;line-height:1;
  margin:8px 0 4px;color:#fff;text-shadow:0 0 34px rgba(217,180,106,.4)}
.sigjst .jt-sub{font-family:'Cormorant Garamond',serif;font-style:italic;font-size:15px;color:#c9c4de}
.sigjst .jt-rules{max-width:680px;margin:10px auto 0;padding:9px 12px;border-radius:4px;font-size:12px;
  line-height:1.6;color:#bdb8d4;background:rgba(255,255,255,.045);border:1px solid rgba(217,180,106,.22)}
.sigjst .jt-weights{display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin:9px auto 2px;max-width:760px}
.sigjst .jt-w{display:flex;align-items:center;gap:5px;font-size:9.5px;letter-spacing:.8px;opacity:.9;
  text-transform:uppercase;color:var(--jt-gold2)}
.sigjst .jt-wb{width:42px;height:5px;border-radius:3px;background:rgba(255,255,255,.14);overflow:hidden}
.sigjst .jt-wb b{display:block;height:100%;border-radius:3px;background:currentColor}
.sigjst .jt-w u{text-decoration:none;opacity:.7}
.sigjst .jt-w.is-beh{opacity:.72;text-transform:none;letter-spacing:0;font-size:10.5px;color:#c9c4de;
  font-family:'Cormorant Garamond',serif;font-style:italic}

/* ── the bench ── */
.sigjst .jt-bench{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin:14px auto 4px;
  padding:11px 10px 9px;max-width:920px;border-radius:6px;background:linear-gradient(180deg,rgba(255,255,255,.05),rgba(0,0,0,.35));
  border:1px solid rgba(217,180,106,.18);box-shadow:inset 0 1px 0 rgba(255,255,255,.06)}
.sigjst .jt-seat{width:52px;text-align:center;opacity:.28;filter:grayscale(1);transition:all .35s ease}
.sigjst .jt-seat figure{width:44px;height:44px;margin:0 auto;border-radius:50%;overflow:hidden;
  border:2px solid rgba(255,255,255,.15)}
.sigjst .jt-seat img{width:100%;height:100%;object-fit:cover}
.sigjst .jt-seat span{display:block;font-size:9.5px;letter-spacing:.6px;margin-top:3px;color:#cfcae4;
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sigjst .jt-seat.is-heard{opacity:.62;filter:none}
.sigjst .jt-seat.is-live{opacity:1;filter:none;transform:translateY(-3px) scale(1.1)}
.sigjst .jt-seat.is-live figure{border-color:var(--jt-gold);box-shadow:0 0 0 3px rgba(217,180,106,.2),0 6px 18px rgba(0,0,0,.5)}
.sigjst .jt-seat.is-live span{color:var(--jt-gold2)}
.sigjst .jt-bench-h{width:100%;text-align:center;font-size:9px;letter-spacing:4px;color:#8b86a6;margin-bottom:2px}

.sigjst .jt-grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,246px);gap:16px;align-items:start;
  margin-top:14px}
.sigjst .jt-grid > *{min-width:0}
@media(max-width:880px){.sigjst .jt-grid{grid-template-columns:1fr}}

/* ── a playback panel ── */
.sigjst .jt-card{position:relative;margin-bottom:18px;border-radius:8px;overflow:hidden;
  background:linear-gradient(180deg,rgba(20,22,44,.96),rgba(8,9,20,.96));
  border:1px solid rgba(217,180,106,.24);box-shadow:0 18px 40px rgba(0,0,0,.55);
  animation:jtIn .45s ease both}
@keyframes jtIn{from{opacity:0;transform:translateY(14px) scale(.99)}to{opacity:1;transform:none}}
.sigjst .jt-card::after{content:'';position:absolute;inset:0;pointer-events:none;opacity:.16;
  background:repeating-linear-gradient(180deg,rgba(255,255,255,.10) 0 1px,transparent 1px 3px)}
.sigjst .jt-bar{display:flex;align-items:center;gap:9px;padding:7px 12px;font-size:10px;letter-spacing:2.4px;
  color:#a9a3c6;background:rgba(0,0,0,.45);border-bottom:1px solid rgba(217,180,106,.16)}
.sigjst .jt-rec{display:inline-flex;align-items:center;gap:5px;color:#e56a5a}
.sigjst .jt-rec i{width:7px;height:7px;border-radius:50%;background:#e56a5a;animation:jtBlink 1.4s steps(2) infinite}
@keyframes jtBlink{50%{opacity:.15}}
.sigjst .jt-bar b{margin-left:auto;color:var(--jt-gold);font-weight:500}

.sigjst .jt-body{display:grid;grid-template-columns:96px minmax(0,1fr);gap:14px;padding:15px 15px 6px}
@media(max-width:620px){.sigjst .jt-body{grid-template-columns:1fr}}
.sigjst .jt-mon{position:relative;border-radius:5px;overflow:hidden;aspect-ratio:1;background:#12142c;
  border:1px solid rgba(255,255,255,.14);box-shadow:inset 0 0 26px rgba(0,0,0,.7)}
.sigjst .jt-mon img{width:100%;height:100%;object-fit:cover;filter:contrast(1.06) saturate(.92)}
.sigjst .jt-mon figcaption{position:absolute;left:0;right:0;bottom:0;padding:3px 4px;text-align:center;
  font-size:10px;letter-spacing:1px;color:#f0ecff;background:linear-gradient(180deg,transparent,rgba(0,0,0,.85))}
.sigjst .jt-stem{font-family:'Cormorant Garamond',serif;font-style:italic;font-size:20px;line-height:1.45;
  color:#f4f1ff;padding-left:14px;border-left:2px solid var(--jt-gold)}
.sigjst .jt-stem em{font-style:normal;color:var(--jt-gold);letter-spacing:2px}

/* ── the three endings ── */
.sigjst .jt-opts{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px;padding:12px 15px 4px}
@media(max-width:620px){.sigjst .jt-opts{grid-template-columns:1fr}}
.sigjst .jt-opt{position:relative;padding:10px 10px 9px;border-radius:5px;text-align:center;
  background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.12)}
.sigjst .jt-opt u{display:block;text-decoration:none;font-size:9.5px;letter-spacing:3px;color:#8b86a6}
.sigjst .jt-opt b{display:block;font-family:'Cormorant Garamond',serif;font-size:19px;font-weight:600;
  color:#efecff;margin-top:2px}
.sigjst .jt-opt.is-truth{background:linear-gradient(180deg,rgba(217,180,106,.26),rgba(217,180,106,.08));
  border-color:var(--jt-gold);box-shadow:0 0 22px rgba(217,180,106,.24)}
.sigjst .jt-opt.is-truth u{color:var(--jt-gold2)}
.sigjst .jt-opt.is-truth::after{content:'THE ANSWER';position:absolute;left:50%;top:-8px;transform:translateX(-50%);
  font-size:8px;letter-spacing:2px;padding:1px 7px;border-radius:8px;background:var(--jt-gold);color:#1a1405}
.sigjst .jt-picks{display:flex;gap:5px;justify-content:center;margin-top:8px;min-height:24px}
.sigjst .jt-pick{display:inline-flex;align-items:center;gap:4px;padding:2px 7px 2px 2px;border-radius:12px;
  font-size:10px;letter-spacing:.4px;background:rgba(0,0,0,.4);border:1px solid rgba(255,255,255,.18)}
.sigjst .jt-pick span{width:17px;height:17px;border-radius:50%;overflow:hidden;display:block}
.sigjst .jt-pick img{width:100%;height:100%;object-fit:cover}
.sigjst .jt-pick.is-ok{border-color:var(--jt-ok);color:#c6f0d6}
.sigjst .jt-pick.is-no{border-color:var(--jt-no);color:#f2c3bb}

/* ── the verdict strip ── */
.sigjst .jt-verd{display:flex;flex-wrap:wrap;gap:8px;padding:10px 15px 14px}
.sigjst .jt-vrow{flex:1 1 220px;display:flex;align-items:center;gap:8px;padding:7px 10px;border-radius:5px;
  background:rgba(255,255,255,.04);border-left:3px solid rgba(255,255,255,.2);font-size:12.5px;color:#d9d5ee}
.sigjst .jt-vrow.is-ok{border-left-color:var(--jt-ok)}
.sigjst .jt-vrow.is-no{border-left-color:var(--jt-no)}
.sigjst .jt-vrow strong{font-weight:600;color:#fff}
.sigjst .jt-vrow em{font-style:normal;color:#a9a3c6}
.sigjst .jt-vrow i{margin-left:auto;font-style:normal;font-size:10px;letter-spacing:1.6px;
  padding:2px 7px;border-radius:9px;border:1px solid currentColor;opacity:.9}
.sigjst .jt-vrow i.is-ok{color:var(--jt-ok)}
.sigjst .jt-vrow i.is-no{color:var(--jt-no)}
.sigjst .jt-vrow u{text-decoration:none;font-size:15px;font-weight:600;color:var(--jt-gold2);min-width:14px;
  text-align:right}
.sigjst .jt-line{padding:0 15px 14px;font-size:13px;line-height:1.65;color:#c6c1dc}

/* ── the chalkboard tiebreak ── */
.sigjst .jt-chalk{margin-bottom:18px;padding:16px;border-radius:6px;text-align:center;
  background:linear-gradient(180deg,#20372e,#152520);border:5px solid #6b4a26;
  box-shadow:0 16px 34px rgba(0,0,0,.5),inset 0 0 40px rgba(0,0,0,.45);font-family:'Cormorant Garamond',serif}
.sigjst .jt-chalk h4{margin:0 0 8px;font-size:19px;color:#e8f2e6;font-weight:500}
.sigjst .jt-boards{display:flex;gap:12px;justify-content:center;flex-wrap:wrap}
.sigjst .jt-board{padding:8px 14px;border:2px dashed rgba(232,242,230,.4);border-radius:3px;color:#e8f2e6}
.sigjst .jt-board b{display:block;font-size:26px;letter-spacing:1px}
.sigjst .jt-board span{font-size:11px;font-family:'Barlow Condensed',sans-serif;letter-spacing:1.6px;opacity:.75}
.sigjst .jt-board.is-win{border-style:solid;border-color:var(--jt-gold);color:var(--jt-gold2)}
.sigjst .jt-target{margin-top:9px;font-size:13px;color:#bcd6c2}

.sigjst .jt-crown{margin-bottom:18px;padding:18px;border-radius:8px;text-align:center;
  background:radial-gradient(70% 100% at 50% 0%,rgba(217,180,106,.28),rgba(0,0,0,.5));
  border:1px solid var(--jt-gold)}
.sigjst .jt-crown figure{width:76px;height:76px;margin:0 auto 8px;border-radius:50%;overflow:hidden;
  border:3px solid var(--jt-gold);box-shadow:0 0 30px rgba(217,180,106,.45)}
.sigjst .jt-crown img{width:100%;height:100%;object-fit:cover}
.sigjst .jt-crown b{display:block;font-family:'Cormorant Garamond',serif;font-size:24px;color:#fff}
.sigjst .jt-crown p{margin:5px auto 0;max-width:520px;font-size:13px;line-height:1.6;color:#d5d0ea}

.sigjst .jt-locked{margin-bottom:18px;min-height:74px;border:1px dashed rgba(217,180,106,.22);border-radius:8px;
  display:grid;place-items:center;font-size:10px;letter-spacing:4px;color:rgba(217,180,106,.32)}

/* ── the two podiums ── */
.sigjst .jt-side{position:sticky;top:56px;padding:13px;border-radius:6px;
  background:linear-gradient(180deg,rgba(20,22,44,.94),rgba(6,7,16,.94));
  border:1px solid rgba(217,180,106,.26);box-shadow:0 12px 30px rgba(0,0,0,.5)}
.sigjst .jt-side-h{font-family:'Cormorant Garamond',serif;font-size:16px;color:var(--jt-gold2);margin-bottom:1px}
.sigjst .jt-side-s{font-size:11px;color:#8b86a6;line-height:1.5;margin-bottom:11px}
.sigjst .jt-pod{display:flex;align-items:center;gap:9px;padding:8px;border-radius:5px;margin-bottom:8px;
  background:rgba(255,255,255,.045);border:1px solid rgba(255,255,255,.09)}
.sigjst .jt-pod figure{width:38px;height:38px;border-radius:50%;overflow:hidden;flex:0 0 auto;
  border:2px solid rgba(217,180,106,.5)}
.sigjst .jt-pod img{width:100%;height:100%;object-fit:cover}
.sigjst .jt-pod-n{flex:1;min-width:0}
.sigjst .jt-pod-n b{display:block;font-size:13px;color:#fff;letter-spacing:.4px}
.sigjst .jt-pod-t{height:6px;border-radius:3px;background:rgba(255,255,255,.1);overflow:hidden;margin-top:5px}
.sigjst .jt-pod-t b{display:block;height:100%;background:linear-gradient(90deg,var(--jt-gold),var(--jt-gold2))}
.sigjst .jt-pod-s{font-size:24px;font-weight:600;color:var(--jt-gold2);min-width:20px;flex:0 0 auto;text-align:right}
.sigjst .jt-read{margin-top:9px;padding-top:9px;border-top:1px solid rgba(255,255,255,.09)}
.sigjst .jt-read-h{font-size:9.5px;letter-spacing:2px;color:#8b86a6;margin-bottom:6px}
.sigjst .jt-rrow{display:flex;align-items:center;gap:7px;font-size:11.5px;color:#cfcae4;margin-bottom:5px}
.sigjst .jt-rbar{flex:1;height:5px;border-radius:3px;background:rgba(255,255,255,.09);overflow:hidden}
.sigjst .jt-rbar b{display:block;height:100%;background:linear-gradient(90deg,var(--jt-blue),#a9c0ff)}
.sigjst .jt-rrow em{font-style:normal;font-size:10.5px;color:#8b86a6;min-width:30px;text-align:right}

.sigjst .jt-ctl{position:fixed;left:0;right:0;bottom:0;z-index:30;display:flex;gap:8px;justify-content:center;
  align-items:center;padding:10px 12px;background:linear-gradient(180deg,rgba(0,0,0,.4),rgba(0,0,0,.8));
  backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);border-top:1px solid rgba(217,180,106,.24)}
.sigjst .jt-count{font-family:'Cormorant Garamond',serif;font-size:14px;letter-spacing:2px;color:var(--jt-gold2)}
@media(prefers-reduced-motion:reduce){
  .sigjst *,.sigjst *::before,.sigjst *::after{animation:none!important;transition:none!important}
}
</style>`;

/**
 * Whichever question this beat is narrating, matched on the statement itself.
 *
 * Beats and questions are written in step, but the competition also emits a
 * tiebreak beat and a closing beat, and the fallback branch emits questions
 * with no juror at all — so a running index drifts and a card ends up showing
 * one juror's face above another juror's sentence.
 */
function _questionFor(beat, questions, used) {
  for (const q of questions) {
    if (used.has(q)) continue;
    if (q.stem && beat.text.includes(q.stem)) return q;
  }
  return null;
}

export function rpBuildSigJuryStatements(ep, actType, u = {}) {
  const act = (ep?.acts || []).find(a => a.type === actType);
  const comp = act?.competition;
  if (!act || !comp) return '';
  const beats = (comp.beats || []).filter(b => b && b.text);
  if (!beats.length) return '';

  const esc = typeof u.esc === 'function' ? u.esc : v => String(v ?? '');
  const avatar = typeof u.avatar === 'function' ? u.avatar : () => '';
  const tvState = u.tvState || {};
  const reveal = typeof u.reveal === 'function' ? u.reveal : () => '';
  const stateKey = `bb_sig_jst_${ep.num}_${actType}${ep?._seg ? `_s${ep._seg}` : ''}`;
  if (!tvState[stateKey]) tvState[stateKey] = { idx: -1 };
  const state = tvState[stateKey];
  const done = state.idx >= beats.length - 1;

  const questions = comp.detail?.questions || [];
  const tiebreak = comp.detail?.tiebreak || null;
  const breakdown = comp.breakdown || comp.debug?.scoreBreakdown || {};
  const winner = act.winner || comp.winner || null;
  const finalists = act.participants?.length ? [...act.participants]
    : (comp.placements || []).slice(0, 2);
  const jury = questions.map(q => q.juror).filter(Boolean);

  // Which juror is on the monitor right now, and how many have been played —
  // the bench reads as a countdown of people the finalists have to know.
  let liveJuror = null;
  let heard = 0;

  const used = new Set();
  let asked = 0;
  let cards = '';

  beats.forEach((b, i) => {
    if (i > state.idx) { cards += `<div class="jt-locked">NOT YET PLAYED</div>`; return; }

    const q = _questionFor(b, questions, used);
    if (q) {
      used.add(q);
      asked++;
      if (q.juror) { liveJuror = q.juror; heard++; }
      const truth = q.options[q.truthIndex];
      const picksOn = idx => finalists.map(f => {
        const a = q.answers?.[f];
        if (!a || a.answer !== idx) return '';
        return `<span class="jt-pick ${a.right ? 'is-ok' : 'is-no'}">
          <span>${avatar(f, 17)}</span>${esc(f)}</span>`;
      }).join('');
      const opts = q.options.map((o, idx) => `<div class="jt-opt ${idx === q.truthIndex ? 'is-truth' : ''}">
        <u>${'ABC'[idx] || idx + 1}</u><b>${esc(o)}</b>
        <div class="jt-picks">${picksOn(idx)}</div></div>`).join('');

      // The running score as of THIS statement, counted from the answers the
      // viewer has actually watched — the card has to be readable on its own.
      const running = {};
      finalists.forEach(f => { running[f] = 0; });
      [...used].forEach(seen => finalists.forEach(f => {
        if (seen.answers?.[f]?.right) running[f]++;
      }));

      const verdicts = finalists.map(f => {
        const a = q.answers?.[f];
        if (!a) return '';
        return `<div class="jt-vrow ${a.right ? 'is-ok' : 'is-no'}">
          <strong>${esc(f)}</strong> <em>said</em> ${esc(q.options[a.answer] ?? '—')}
          <i class="${a.right ? 'is-ok' : 'is-no'}">${a.right ? 'RIGHT' : 'WRONG'}</i>
          <u>${running[f]}</u></div>`;
      }).join('');

      // The beat opens with the juror, the statement and all three endings,
      // every one of which is already drawn above as a plaque. Splitting on
      // whitespace to get past it left "C. Fern" glued to the front of the
      // sentence, so the prefix is rebuilt exactly as the competition wrote it
      // and removed by identity.
      const prefix = `${q.juror ? `${q.juror}: ` : ''}${q.stem} — `
        + q.options.map((o, idx) => `${'ABC'[idx]}. ${o}`).join('  ') + ' ';
      const rest = (b.text.startsWith(prefix) ? b.text.slice(prefix.length) : b.text)
        .split(' The answer was ')[0].trim();
      cards += `<div class="jt-card">
        <div class="jt-bar"><span class="jt-rec"><i></i>PLAYBACK</span>
          <span>STATEMENT ${asked} OF ${questions.length || asked}</span>
          <b>${q.juror ? esc(q.juror).toUpperCase() : 'THE HOUSE'}</b></div>
        <div class="jt-body">
          <figure class="jt-mon">${q.juror ? avatar(q.juror, 96) : ''}
            <figcaption>${esc(q.juror || 'HOUSE RECORD')}</figcaption></figure>
          <div class="jt-stem">${esc(q.stem.replace(/^"|"$/g, '').replace(/\.\.\.$/, '').trim())} <em>…</em></div>
        </div>
        <div class="jt-opts">${opts}</div>
        <div class="jt-verd">${verdicts}</div>
        <div class="jt-line">${b.text.includes(' The answer was ')
          ? esc(rest) + ` The answer was <b style="color:var(--jt-gold2)">${esc(truth)}</b>.`
          : b.text}</div>
      </div>`;
      return;
    }

    // The chalkboards.
    if (tiebreak && b.text.includes(tiebreak.question)) {
      const boards = Object.entries(tiebreak.guesses || {})
        .sort((x, y) => Math.abs(x[1] - tiebreak.target) - Math.abs(y[1] - tiebreak.target))
        .map(([name, g]) => `<div class="jt-board ${name === tiebreak.winner ? 'is-win' : ''}">
          <b>${esc(g)}</b><span>${esc(name)}</span></div>`).join('');
      cards += `<div class="jt-chalk">
        <h4>${esc(tiebreak.question)}</h4>
        <div class="jt-boards">${boards}</div>
        <div class="jt-target">The answer is <b>${esc(tiebreak.target)}</b> — ${esc(tiebreak.winner)} is closest.</div>
      </div>`;
      return;
    }

    // The last card: somebody is the final Head of Household.
    const named = finalists.find(f => b.text.startsWith(f)) || winner;
    cards += `<div class="jt-crown">
      <figure>${avatar(named, 76)}</figure>
      <b>${esc(named || '')}</b>
      <p>${b.text.replace(new RegExp(`^${esc(named || '')}\\s*`), '')}</p>
    </div>`;
  });

  const bench = jury.map((name, i) => {
    const cls = name === liveJuror ? 'is-live' : i < heard ? 'is-heard' : '';
    return `<div class="jt-seat ${cls}"><figure>${avatar(name, 44)}</figure><span>${esc(name)}</span></div>`;
  }).join('');

  // The podiums. Score is counted from what has been played, never from the
  // final breakdown — the sidebar is not allowed to know the result early.
  const played = [...used];
  const running = {};
  finalists.forEach(f => { running[f] = 0; });
  played.forEach(q => finalists.forEach(f => { if (q.answers?.[f]?.right) running[f]++; }));
  const most = Math.max(1, ...finalists.map(f => running[f]));
  const podiums = [...finalists].sort((a, b) => running[b] - running[a]).map(f => `
    <div class="jt-pod">
      <figure>${avatar(f, 38)}</figure>
      <div class="jt-pod-n"><b>${esc(f)}</b>
        <div class="jt-pod-t"><b style="width:${Math.round((running[f] / most) * 100)}%"></b></div></div>
      <div class="jt-pod-s">${running[f]}</div>
    </div>`).join('');

  // What the season says each of them knew about that bench — the number the
  // whole competition is really about, and a spoiler until it is over.
  const reads = done ? finalists.map(f => {
    const r = Number(breakdown[f]?.juryRead) || 0;
    return `<div class="jt-rrow"><span style="min-width:54px">${esc(f)}</span>
      <span class="jt-rbar"><b style="width:${Math.round(r * 100)}%"></b></span>
      <em>${Math.round(r * 100)}%</em></div>`;
  }).join('') : '';

  return `<div class="rp-page sigjst">${_STYLE}
    <div class="jt-bg"></div><div class="jt-dust"></div>
    <div class="jt-wrap">
      <div class="jt-head">
        <div class="jt-eyebrow">Final Head of Household &middot; Part Three</div>
        <div class="jt-title">JURY STATEMENTS</div>
        <div class="jt-sub">Every one of them recorded a sentence. Neither of you gets to hear the end of it.</div>
        ${comp.desc ? `<div class="jt-rules">${esc(comp.desc)}</div>` : ''}
        ${(() => {
          const w = Object.entries(comp.stats || {}).sort((a, b) => b[1] - a[1]);
          const bars = w.map(([k, v]) => `<span class="jt-w"><i>${esc(k)}</i><span class="jt-wb"><b style="width:${Math.round(v * 100)}%"></b></span><u>${Math.round(v * 100)}%</u></span>`).join('');
          // The behaviour terms matter more here than the stats do, and the
          // profile says so — so they are drawn beside the bar rather than
          // left off it.
          const beh = (comp.behaviour || []).map(b => `<span class="jt-w is-beh"><i>${esc(b.label)}</i><u>${Math.round(b.weight * 100)}%</u></span>`).join('');
          return bars || beh ? `<div class="jt-weights">${bars}${beh}</div>` : '';
        })()}
      </div>
      ${jury.length ? `<div class="jt-bench"><div class="jt-bench-h">THE JURY BENCH</div>${bench}</div>` : ''}
      <div class="jt-grid">
        <div>${cards}</div>
        <aside class="jt-side">
          <div class="jt-side-h">The podiums</div>
          <div class="jt-side-s">${played.length
            ? `After ${played.length} statement${played.length === 1 ? '' : 's'}. A point each, most points takes the last power in this game.`
            : 'Nothing played yet. A point per juror, most points wins.'}</div>
          ${podiums}
          ${reads ? `<div class="jt-read"><div class="jt-read-h">HOW WELL THEY KNEW THAT BENCH</div>${reads}</div>` : ''}
        </aside>
      </div>
      <div class="jt-ctl">
        ${done ? '' : `<button class="rp-btn" onclick="${reveal(ep, stateKey, Math.min(state.idx + 1, beats.length - 1))}">Play the next statement</button>`}
        ${done ? '' : `<button class="rp-btn rp-btn-ghost" onclick="${reveal(ep, stateKey, beats.length - 1)}">Play them all</button>`}
        <span class="jt-count">${Math.min(beats.length, Math.max(0, state.idx + 1))} / ${beats.length}</span>
      </div>
    </div>
  </div>`;
}
