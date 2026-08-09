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

/**
 * What it looks like when these two in particular come through the door.
 *
 * Branches on the kinship KEY where the act carries one, because matching
 * prose was already fragile with five relations and is hopeless with twenty —
 * "Ex-best-friends" and "Exes" share a substring, "Grandparent" contains
 * "parent", and a new label could silently join somebody else's branch.
 */
export function duoArrivalLine(a, b, label, salt = 0, kinKey = '') {
  const k = String(kinKey || '');
  const byKey = {
    exes: [
      `${a} comes through first and does not hold the door. ${b} catches it. The room works out `
        + `what it is looking at before either of them says the word.`,
      `They arrive four seconds apart and stand further from each other than anybody else in this `
        + `house is standing. ${a} says it out loud so ${b} does not have to.`,
    ],
    'ex-friends': [
      `${a} and ${b} were each other's person once and have not spoken in a long time. They are `
        + `about to be one nomination.`,
      `Whatever ended it, it did not end quietly. ${a} walks in first and ${b} takes the long way `
        + `round the sofa.`,
    ],
    estranged: [
      `${a} and ${b} are family and have not been in the same room in years. They are about to be `
        + `in the same room for eleven weeks.`,
    ],
    married: [
      `${a} and ${b} come in holding hands, which lasts until somebody counts the votes in their `
        + `head and the whole room does the same sum at once.`,
      `They walk in together and the temperature of the greeting drops halfway through. Two people `
        + `who arrive as one thing are two votes that were never available.`,
    ],
    engaged: [
      `${a} and ${b} are getting married after this, which everybody in the room hears as a `
        + `deadline rather than a plan.`,
    ],
    partners: [
      `${a} and ${b} arrive as one unit and the house starts working out how to break it before `
        + `the bags are down.`,
    ],
    dating: [
      `${a} and ${b} have not been together long enough to know how this goes, and they are about `
        + `to find out in front of everybody.`,
    ],
    twins: [
      `The room takes a second, then takes a step back. ${a} and ${b} let it happen.`,
      `${a} and ${b} come in one after the other and nobody in this house is going to stop `
        + `checking which one is which.`,
    ],
    siblings: [
      `The resemblance does the announcing before either of them opens their mouth. ${a} goes in `
        + `first anyway, which the house also notices.`,
      `${a} and ${b} come in together and the room spends the next hour deciding which of them is `
        + `the dangerous one.`,
    ],
    'step-siblings': [
      `${a} and ${b} became family on somebody else's decision and have made it work. The house is `
        + `going to ask how well.`,
    ],
    'parent-child': [
      `${a} and ${b} walk in together and the room does the arithmetic out loud without meaning `
        + `to. Nobody here has ever had to vote out somebody's child before.`,
      `One of them raised the other. Both of them are about to be asked, repeatedly, which of them `
        + `is really playing.`,
    ],
    grandparent: [
      `Two generations through one door. ${a} and ${b} get the warmest welcome anybody gets all `
        + `night, and the house means every word of it and will still vote.`,
    ],
    'aunt-uncle': [
      `${a} and ${b} are family in the way that does not come with any of the baggage, which in `
        + `this house makes them harder to break than most.`,
    ],
    cousins: [
      `${a} and ${b} have known each other their whole lives and have never once had to choose `
        + `each other. This week they do.`,
    ],
    'in-laws': [
      `${a} and ${b} are family by somebody else's wedding, and the house is going to spend eleven `
        + `weeks working out whether that counts.`,
    ],
    'best-friends': [
      `${a} and ${b} come through that door the way people do when they have been planning it for `
        + `months. Everybody else in the room quietly moves them to the top of a list.`,
      `The two of them are obvious about it, which is the problem: the house can see a pair from `
        + `the doorway and has already started counting.`,
    ],
    'childhood-friends': [
      `${a} and ${b} have known each other since before either of them was interesting, and it `
        + `shows in about four seconds.`,
    ],
    roommates: [
      `${a} and ${b} have lived together, which means they already know exactly how the other one `
        + `behaves at two in the morning. Nobody else here has that.`,
    ],
    colleagues: [
      `${a} and ${b} have spent more hours in each other's company than anybody else here has `
        + `spent with anyone, and neither of them chose a single one of them.`,
    ],
    teammates: [
      `${a} and ${b} have won things together before. The house hears that as a warning rather `
        + `than a story.`,
    ],
    chained: [
      `${a} and ${b} did not walk in together and are a duo anyway. Big Brother decided.`,
    ],
  };
  const keyed = byKey[k];
  if (keyed) {
    return [...keyed, `Whatever ${a} and ${b} are to each other, from tonight they are one `
      + `nomination.`][Math.abs(Number(salt) || 0) % (keyed.length + 1)];
  }

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

