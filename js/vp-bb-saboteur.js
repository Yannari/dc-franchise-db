// ══════════════════════════════════════════════════════════════════════
// vp-bb-saboteur.js — the second game, on screen
// ══════════════════════════════════════════════════════════════════════
//
// This screen is the only one in the house drawn from the OTHER side of the
// glass. Every other twist screen shows the audience what the house is being
// put through; this one shows the audience the room the house is never allowed
// into — a card handed over in a Diary Room, a figure going up on a counter,
// and a board of names belonging to people who have worked out that something
// is wrong and reached for the wrong one.
//
// So the two halves are deliberately opposite in feel. The left is production:
// a mission card, clean and clerical, with a number on it. The right is the
// house: portraits with lines drawn to whoever each of them has convicted, most
// of which point at somebody innocent. The whole point of the twist is the gap
// between those two panels, and the screen is built so a viewer can see the gap
// without being told about it.

const STYLE = `<style>
.bbsab{--sb-red:#c9343c;--sb-ink:#0a0a0c;--sb-card:#efe9dc;--sb-gold:#e3b341;
  position:relative;color:#e6e4ea}
.bbsab .sb-wrap{max-width:1100px;margin:0 auto;padding:0 12px 26px}
.bbsab .sb-bg{position:absolute;inset:46px 0 0 0;z-index:0;pointer-events:none;
  background:radial-gradient(60% 40% at 50% 0%,rgba(201,52,60,.20),transparent 62%),
    linear-gradient(180deg,#140a0c,#08080b 60%,#050506)}
.bbsab .sb-head{position:relative;z-index:2;text-align:center;padding:14px 6px 6px}
.bbsab .sb-eyebrow{font-family:ui-monospace,Consolas,monospace;font-size:9px;letter-spacing:4px;color:var(--sb-red)}
.bbsab .sb-title{font-family:var(--font-display);font-size:34px;letter-spacing:3px;color:#fff;margin:7px 0 3px;
  text-shadow:0 0 26px rgba(201,52,60,.45)}
.bbsab .sb-sub{font-size:11.5px;color:#8b949e}

.bbsab .sb-grid{position:relative;z-index:2;display:grid;grid-template-columns:minmax(0,1fr) minmax(0,300px);
  gap:16px;align-items:start;margin-top:14px}
.bbsab .sb-grid > *{min-width:0}
@media(max-width:860px){.bbsab .sb-grid{grid-template-columns:1fr}}

/* ── the card production hands over ── */
.bbsab .sb-card{position:relative;padding:18px 20px 16px;border-radius:3px;color:#1b1712;
  background:linear-gradient(178deg,#f6f1e6,var(--sb-card));
  box-shadow:0 16px 36px rgba(0,0,0,.55);transform:rotate(-.35deg)}
.bbsab .sb-card::before{content:'';position:absolute;left:0;right:0;top:0;height:5px;
  background:repeating-linear-gradient(90deg,var(--sb-red) 0 14px,transparent 14px 28px)}
.bbsab .sb-stamp{position:absolute;right:14px;top:14px;font-family:ui-monospace,Consolas,monospace;font-size:10px;
  letter-spacing:2px;color:var(--sb-red);border:2px solid var(--sb-red);border-radius:3px;padding:3px 8px;
  transform:rotate(-9deg);opacity:.85}
.bbsab .sb-no{font-family:ui-monospace,Consolas,monospace;font-size:9px;letter-spacing:2px;color:#8a7f6b;
  max-width:calc(100% - 96px)}
.bbsab .sb-job{font-family:var(--font-display);font-size:25px;letter-spacing:1px;margin:6px 0 4px;color:#1b1712}
.bbsab .sb-brief{font-size:13.5px;line-height:1.6;color:#4a4034;font-style:italic}
.bbsab .sb-fee{margin-top:12px;padding-top:10px;border-top:1px dashed rgba(27,23,18,.28);
  display:flex;align-items:baseline;gap:10px}
.bbsab .sb-fee b{font-family:var(--font-display);font-size:26px;color:#1b1712}
.bbsab .sb-fee span{font-family:ui-monospace,Consolas,monospace;font-size:9px;letter-spacing:1.6px;color:#8a7f6b}

.bbsab .sb-beats{margin-top:16px;display:flex;flex-direction:column;gap:8px}
.bbsab .sb-beat{padding:11px 13px;border-radius:8px;font-size:13px;line-height:1.62;color:#d6dde5;
  background:linear-gradient(180deg,rgba(22,16,18,.92),rgba(12,10,12,.95));
  border:1px solid rgba(255,255,255,.07);border-left:3px solid rgba(139,148,158,.4)}
.bbsab .sb-beat.is-act{border-left-color:var(--sb-red)}
.bbsab .sb-beat.is-wrong{border-left-color:#f85149;background:linear-gradient(90deg,rgba(248,81,73,.10),rgba(12,10,12,.95))}
.bbsab .sb-beat.is-seen{border-left-color:var(--sb-gold)}
.bbsab .sb-beat b{display:block;font-family:ui-monospace,Consolas,monospace;font-size:8px;letter-spacing:1.8px;
  color:#8b949e;margin-bottom:5px}

/* ── what the house has decided ── */
.bbsab .sb-side{position:sticky;top:56px;padding:14px;border-radius:10px;
  background:linear-gradient(180deg,rgba(20,14,16,.95),rgba(8,7,9,.96));
  border:1px solid rgba(201,52,60,.3);box-shadow:0 12px 30px rgba(0,0,0,.5)}
.bbsab .sb-side-h{font-family:ui-monospace,Consolas,monospace;font-size:9px;letter-spacing:2px;color:var(--sb-red)}
.bbsab .sb-side-s{font-size:11px;color:#8b949e;line-height:1.5;margin:3px 0 11px}
.bbsab .sb-bank{margin-bottom:12px}
.bbsab .sb-bank-n{font-family:var(--font-display);font-size:28px;color:var(--sb-gold);line-height:1}
.bbsab .sb-bank-t{height:7px;border-radius:4px;background:rgba(255,255,255,.08);overflow:hidden;margin-top:6px}
.bbsab .sb-bank-t b{display:block;height:100%;background:linear-gradient(90deg,#8a6a12,var(--sb-gold))}
.bbsab .sb-bank-l{font-family:ui-monospace,Consolas,monospace;font-size:8.5px;letter-spacing:1.4px;color:#8b949e;
  margin-top:5px}
.bbsab .sb-row{display:flex;align-items:center;gap:8px;font-size:11.5px;color:#c9d1d9;margin-bottom:6px;
  padding:5px 7px;border-radius:6px;background:rgba(255,255,255,.03)}
.bbsab .sb-row figure{width:26px;height:26px;border-radius:50%;overflow:hidden;flex:0 0 auto;
  border:1px solid rgba(255,255,255,.16)}
.bbsab .sb-row figure .bb-av{width:26px!important;height:26px!important;border-radius:50%}
.bbsab .sb-row i{font-style:normal;color:#6e7681;font-size:10px}
.bbsab .sb-row.is-right{border-left:2px solid var(--sb-gold)}
.bbsab .sb-row.is-wrong{border-left:2px solid #f85149}
.bbsab .sb-row em{margin-left:auto;font-style:normal;font-family:ui-monospace,Consolas,monospace;font-size:8px;
  letter-spacing:1.2px}
.bbsab .sb-row.is-right em{color:var(--sb-gold)}
.bbsab .sb-row.is-wrong em{color:#ff8b84}
.bbsab .sb-quiet{font-size:11.5px;color:#6e7681;line-height:1.55;font-style:italic}

/* ── the reveal ── */
.bbsab .sb-reveal{position:relative;z-index:2;margin:18px auto 0;max-width:760px;padding:26px 20px;
  border-radius:12px;text-align:center;border:1px solid rgba(201,52,60,.5);
  background:radial-gradient(70% 110% at 50% 0%,rgba(201,52,60,.26),rgba(0,0,0,.55))}
.bbsab .sb-reveal figure{width:130px;height:130px;margin:0 auto 12px;border-radius:12px;overflow:hidden;
  border:3px solid var(--sb-red);box-shadow:0 0 42px rgba(201,52,60,.5)}
.bbsab .sb-reveal figure .bb-av{width:130px!important;height:130px!important;border-radius:9px}
.bbsab .sb-reveal h3{margin:0;font-family:var(--font-display);font-size:clamp(26px,5vw,44px);line-height:1;color:#fff}
.bbsab .sb-reveal .sb-money{margin-top:10px;font-family:var(--font-display);font-size:26px;color:var(--sb-gold)}
.bbsab .sb-reveal .sb-money.is-lost{color:#8b949e;text-decoration:line-through}
.bbsab .sb-tv{position:relative;margin:0 auto 16px;max-width:640px;border-radius:10px;overflow:hidden;
  border:1px solid rgba(255,255,255,.14);background:#0b0b0f;box-shadow:0 14px 34px rgba(0,0,0,.6)}
.bbsab .sb-tv-screen{position:relative;padding:26px 20px;text-align:center;
  background:repeating-linear-gradient(0deg,rgba(255,255,255,.045) 0 1px,transparent 1px 3px),
    radial-gradient(70% 100% at 50% 40%,rgba(201,52,60,.22),#08080b)}
.bbsab .sb-tv-sil{width:64px;height:64px;margin:0 auto 12px;border-radius:50% 50% 44% 44%;
  background:#040406;box-shadow:0 0 0 2px rgba(255,255,255,.07),0 0 26px rgba(201,52,60,.35)}
.bbsab .sb-tv-line{font-size:15px;line-height:1.65;color:#efe9dc;font-style:italic}
.bbsab .sb-tv-tag{margin-top:12px;font-family:ui-monospace,Consolas,monospace;font-size:8px;letter-spacing:2.4px;
  color:#8b949e}
.bbsab .sb-verdict{margin:14px 0 0;padding:13px 15px;border-radius:9px;font-size:13.5px;line-height:1.6}
.bbsab .sb-verdict.is-yes{background:rgba(201,52,60,.12);border:1px solid rgba(201,52,60,.45);color:#ffd0cc}
.bbsab .sb-verdict.is-no{background:rgba(139,148,158,.10);border:1px solid rgba(139,148,158,.35);color:#c9d1d9}
.bbsab .sb-verdict b{display:block;font-family:ui-monospace,Consolas,monospace;font-size:8.5px;
  letter-spacing:2px;margin-bottom:5px;color:#8b949e}
.bbsab .sb-pay{display:flex;gap:10px;flex-wrap:wrap;margin-top:12px}
.bbsab .sb-pay div{flex:1 1 120px;padding:9px 11px;border-radius:8px;background:rgba(255,255,255,.04);
  border:1px solid rgba(255,255,255,.09)}
.bbsab .sb-pay span{display:block;font-family:ui-monospace,Consolas,monospace;font-size:8px;letter-spacing:1.6px;
  color:#8b949e}
.bbsab .sb-pay b{display:block;font-family:var(--font-display);font-size:20px;color:var(--sb-gold);margin-top:3px}
.bbsab .sb-cleared{margin-top:14px;padding:11px;border-radius:8px;font-size:12px;line-height:1.6;
  color:#c9d1d9;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1)}
@media(prefers-reduced-motion:reduce){.bbsab *{animation:none!important}}
</style>`;

/**
 * A week of the second game.
 *
 * @param ep    the episode record
 * @param act   the saboteur act
 * @param u     { esc, avatar } from vp-screens, which owns those helpers
 */
export function rpBuildBBSaboteur(ep, act, u = {}) {
  if (!act) return '';
  const esc = typeof u.esc === 'function' ? u.esc : v => String(v ?? '');
  const avatar = typeof u.avatar === 'function' ? u.avatar : () => '';
  const m = act.mission || {};
  const notices = act.notices || [];
  const right = notices.filter(n => n.correct);
  const wrong = notices.filter(n => !n.correct);

  const beat = b => {
    const cls = b.badgeClass === 'gold' ? 'is-seen'
      : b.badgeText === 'THE WRONG DOOR' ? 'is-wrong'
        : b.badgeClass === 'red' ? 'is-act' : '';
    return `<div class="sb-beat ${cls}"><b>${esc(b.badgeText || 'THE JOB')}</b>${b.text}</div>`;
  };

  const board = notices.length
    ? notices.map(n => `<div class="sb-row ${n.correct ? 'is-right' : 'is-wrong'}">
        <figure>${avatar(n.observer, 26)}</figure>
        <span>${esc(n.observer)}</span><i>&rarr;</i><span>${esc(n.named)}</span>
        <em>${n.correct ? 'DEAD ON' : 'WRONG'}</em>
      </div>`).join('')
    : `<div class="sb-quiet">Nobody felt a thing. As far as this house is concerned, it was a normal week —
        which is the best possible outcome and the least satisfying one to watch.</div>`;

  const toBank = Math.max(0, (act.bankWeek || 0) - (act.week || 0));

  return `<div class="rp-page bbsab">${STYLE}
    <div class="sb-bg"></div>
    <div class="sb-wrap">
      <div class="sb-head">
        <div class="sb-eyebrow">WEEK ${esc(act.week)} &middot; THE ROOM THE HOUSE NEVER SEES</div>
        <div class="sb-title">THE SABOTEUR</div>
        <div class="sb-sub">Everybody in that house knows one of them is doing this. Only you know which one.</div>
      </div>

      <div class="sb-grid">
        <div>
          <div class="sb-card">
            <div class="sb-stamp">${act.worked ? 'COMPLETE' : 'FAILED'}</div>
            <div class="sb-no">MISSION ${String(act.week).padStart(2, '0')} &middot; FOR THE ATTENTION OF ${esc(act.saboteur).toUpperCase()}</div>
            <div class="sb-job">${esc(m.name || 'A job')}</div>
            <div class="sb-brief">${esc(m.brief || '')}</div>
            <div class="sb-fee"><b>$${Number(m.pay || 0).toLocaleString()}</b><span>ON COMPLETION</span></div>
          </div>
          <div class="sb-verdict ${act.worked ? 'is-yes' : 'is-no'}">
            <b>${act.worked ? 'IT CAME OFF' : 'IT DID NOT COME OFF'}</b>
            ${act.worked
              ? `The job is done and the house has no idea it was a job. It paid $${Number(act.paid || 0).toLocaleString()}.`
              : `The job is not done. Nothing is paid for a near miss — and a near miss is louder than a clean one, `
                + `because being nearly caught is how people get caught.`}
          </div>
          <div class="sb-beats">${(act.beats || []).map(beat).join('')}</div>
        </div>

        <aside class="sb-side">
          <div class="sb-bank">
            <div class="sb-side-h">BANKED</div>
            <div class="sb-bank-n">$${Number(act.banked || 0).toLocaleString()}</div>
            <div class="sb-bank-t"><b style="width:${Math.min(100, Math.round(((act.banked || 0)
              / Math.max(1, act.prize || 50000)) * 100))}%"></b></div>
            <div class="sb-bank-l">${toBank > 0
              ? `${toBank} WEEK${toBank === 1 ? '' : 'S'} TO THE BANK DATE`
              : 'THE BANK DATE IS THIS WEEK'}</div>
          </div>
          <div class="sb-pay">
            <div><span>THIS WEEK</span><b>$${Number(act.paid || 0).toLocaleString()}</b></div>
            <div><span>APPLAUSE</span><b>${Number(act.applause || 0) >= 0 ? '+' : ''}${Number(act.applause || 0)}</b></div>
          </div>
          <div class="sb-side-h" style="margin-top:12px">WHO THINKS IT IS WHO</div>
          <div class="sb-side-s">${notices.length
            ? `${right.length} of ${notices.length} ${right.length === 1 ? 'has' : 'have'} the right name.
               The rest are about to be very unfair to somebody.`
            : 'Nothing reached anybody this week.'}</div>
          ${board}
        </aside>
      </div>
    </div>
  </div>`;
}

/** The end of it, either way. */
export function rpBuildBBSaboteurReveal(ep, act, u = {}) {
  if (!act) return '';
  const esc = typeof u.esc === 'function' ? u.esc : v => String(v ?? '');
  const avatar = typeof u.avatar === 'function' ? u.avatar : () => '';
  const cleared = [...new Set(act.wronglyBlamed || [])];

  return `<div class="rp-page bbsab">${STYLE}
    <div class="sb-bg"></div>
    <div class="sb-wrap">
      <div class="sb-head">
        <div class="sb-eyebrow">${act.evicted ? 'OUT OF THE DOOR' : 'THE BANK DATE'}</div>
        <div class="sb-title">${act.evicted ? 'AND THE MONEY GOES WITH THEM' : 'IT WAS THEM ALL ALONG'}</div>
        <div class="sb-sub">${act.evicted
          ? 'Six weeks of it, and nothing to show for any of it.'
          : 'The house finds out at the same moment it stops mattering to the person who did it.'}</div>
      </div>

      <div class="sb-reveal">
        <figure>${avatar(act.saboteur, 130)}</figure>
        <h3>${esc(act.saboteur || '')}</h3>
        <div class="sb-money ${act.evicted ? 'is-lost' : ''}">$${Number(
          act.evicted ? (act.lost || 0) : (act.banked || 0)).toLocaleString()}</div>
        <div class="sb-beats" style="text-align:left;margin-top:16px">
          ${(act.beats || []).map(b => `<div class="sb-beat is-act">
            <b>${esc(b.badgeText || '')}</b>${b.text}</div>`).join('')}
        </div>
        ${cleared.length ? `<div class="sb-cleared">
          Convicted of it at some point, by somebody, and innocent the whole time:
          <strong>${cleared.map(esc).join(', ')}</strong>. Not one of them will ever get that week back.
        </div>` : ''}
      </div>
    </div>
  </div>`;
}

/**
 * THE JOB — the briefing, at the top of the week.
 *
 * Deliberately the quieter of the two screens: a card, a television, and no
 * result. The audience is being shown what is about to be done to a house that
 * does not know it, and the whole value of the moment is that nothing has
 * happened yet.
 */
export function rpBuildBBSaboteurBrief(ep, act, u = {}) {
  if (!act) return '';
  const esc = typeof u.esc === 'function' ? u.esc : v => String(v ?? '');
  const avatar = typeof u.avatar === 'function' ? u.avatar : () => '';
  const m = act.mission || {};
  const toBank = Math.max(0, (act.bankWeek || 0) - (act.week || 0));

  return `<div class="rp-page bbsab">${STYLE}
    <div class="sb-bg"></div>
    <div class="sb-wrap">
      <div class="sb-head">
        <div class="sb-eyebrow">WEEK ${esc(act.week)} &middot; WRITTEN BY THE AUDIENCE</div>
        <div class="sb-title">THIS WEEK'S JOB</div>
        <div class="sb-sub">Nothing has happened yet. That is the only reason this is fun.</div>
      </div>

      <div class="sb-tv">
        <div class="sb-tv-screen">
          <div class="sb-tv-sil"></div>
          <div class="sb-tv-line">${esc(act.taunt || '')}</div>
          <div class="sb-tv-tag">LIVING ROOM &middot; SOURCE UNKNOWN &middot; VOICE ALTERED</div>
        </div>
      </div>

      <div class="sb-grid">
        <div>
          <div class="sb-card">
            <div class="sb-stamp">${act.accepted ? 'ACCEPTED' : 'DECLINED'}</div>
            <div class="sb-no">MISSION ${String(act.week).padStart(2, '0')} &middot; FOR THE ATTENTION OF ${esc(act.saboteur).toUpperCase()}</div>
            <div class="sb-job">${esc(m.name || 'A job')}</div>
            <div class="sb-brief">${esc(m.brief || '')}</div>
            <div class="sb-fee"><b>$${Number(m.pay || 0).toLocaleString()}</b><span>IF IT COMES OFF</span></div>
          </div>
          <div class="sb-beats">${(act.beats || [])
            // The broadcast is drawn as the television above. Printing it again
            // as a card underneath is the same sentence twice on one screen.
            .filter(b => b.badgeText !== 'ON THE HOUSE TELEVISION')
            .map(b => `<div class="sb-beat ${b.badgeClass === 'red' ? 'is-act' : ''}">
              <b>${esc(b.badgeText || '')}</b>${b.text}</div>`).join('')}</div>
        </div>

        <aside class="sb-side">
          <div class="sb-side-h">THE EMPLOYER</div>
          <div class="sb-side-s">The audience writes the jobs and the audience decides what they were worth.
            Doing them well is not the same as doing them entertainingly, and only one of those pays.</div>
          <div class="sb-pay">
            <div><span>BANKED</span><b>$${Number(act.banked || 0).toLocaleString()}</b></div>
            <div><span>APPLAUSE</span><b>${Number(act.applause || 0) >= 0 ? '+' : ''}${Number(act.applause || 0)}</b></div>
          </div>
          <div class="sb-bank-l" style="margin-top:10px">${toBank > 0
            ? `${toBank} WEEK${toBank === 1 ? '' : 'S'} TO THE BANK DATE`
            : 'THE BANK DATE IS THIS WEEK'}</div>
          <div class="sb-side-s" style="margin-top:10px">Being watched: ${Math.round((act.exposure || 0) * 100)}%
            of the way to a house that has made up its mind.</div>
          <div class="sb-row"><figure>${avatar(act.saboteur, 26)}</figure>
            <span>${esc(act.saboteur)}</span><em>${act.accepted ? 'ON THE JOB' : 'SITTING THIS ONE OUT'}</em></div>
        </aside>
      </div>
    </div>
  </div>`;
}
