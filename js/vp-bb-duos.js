// ══════════════════════════════════════════════════════════════════════
// vp-bb-duos.js — Dynamic Duos, on screen
// ══════════════════════════════════════════════════════════════════════
//
// Four screens for the four moments the twist has after the announcement:
//
//   the key      somebody's partner is gone and they have been handed safety
//                they cannot use
//   the expiry   every key stops at once, and a house of bystanders is
//                suddenly nominatable
//   the week     what being chained to somebody does between ceremonies
//   re-paired    two loose ends handed to each other, in the mode with no keys
//
// (The announcement itself lives in vp-screens.js beside the other one, because
// it IS the other one — same wall, same eye, same voice.)
//
// ── these are house screens, not a theme of their own ──
//
// The first cut shipped a bespoke `.bbduo` shell with its own background, its
// own type, and — because it never set a width — a layout that ran edge to edge
// while every other screen in the viewing party sits in a 760px column. It read
// as a different product. So they are built out of the format's own furniture
// now: `rp-page bb-room` for the column and the room's light, `bbns-card` for
// anything the house is being told, `bbns-pill` for the tag on it.
//
// ONE mark belongs to this twist and nothing else: the chain drawn between two
// avatars, cut when a duo breaks. That is the whole of its visual identity, and
// for a season-long RULE — as opposed to a competition, which earns a world of
// its own — that is the right amount.
//
// WHY THEY EXIST AT ALL. The Twin Twist shipped with its changeover passed to a
// screen that never drew it: ten swaps in a real season, nothing visible
// anywhere, and a twist that read as doing nothing.
const CSS = `<style>
.bbduo-chain{position:relative;display:inline-block;width:26px;height:12px;margin:0 3px;
  vertical-align:middle;flex:0 0 auto;}
.bbduo-chain::before,.bbduo-chain::after{content:'';position:absolute;top:0;width:14px;height:12px;
  border:2px solid rgba(240,165,0,.8);border-radius:6px;}
.bbduo-chain::before{left:0;}
.bbduo-chain::after{right:0;}
.bbduo-chain.is-cut::before{border-color:rgba(248,81,73,.85);}
.bbduo-chain.is-cut::after{border-color:rgba(139,148,158,.3);border-style:dashed;}
.bbduo-hero{display:flex;align-items:center;justify-content:center;gap:8px;margin:2px 0 14px;}
.bbduo-who{text-align:center;}
.bbduo-who b{display:block;font-family:var(--font-display);font-size:16px;color:#f0f6fc;margin-top:5px;}
.bbduo-who.is-gone{opacity:.4;filter:grayscale(1);}
.bbduo-lead{text-align:center;font-size:12.5px;line-height:1.6;color:#8b949e;max-width:520px;
  margin:0 auto 16px;}
.bbduo-roster{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin:0 auto 16px;}
.bbduo-tag{font-family:ui-monospace,Consolas,monospace;font-size:9px;letter-spacing:1px;
  padding:4px 9px;border-radius:999px;border:1px solid rgba(139,148,158,.28);color:#8b949e;
  display:inline-flex;align-items:center;gap:3px;}
.bbduo-tag .bbduo-chain{width:20px;height:9px;margin:0 1px;}
.bbduo-tag .bbduo-chain::before,.bbduo-tag .bbduo-chain::after{width:11px;height:9px;border-width:1.5px;}
.bbduo-tag.is-key{border-color:rgba(240,165,0,.5);color:#f0a500;}
.bbduo-tag.is-key .bbduo-chain::before,.bbduo-tag.is-key .bbduo-chain::after{border-color:rgba(240,165,0,.6);}
.bbduo-tag.is-alone{border-color:rgba(248,81,73,.45);color:#f85149;}
</style>`;

const esc0 = v => String(v ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/** The house column, the room's light, and a heading that matches the format. */
const page = (eyebrow, title, inner, esc) => `${CSS}<div class="rp-page bb-room bb-block bbns">
  <div class="rp-eyebrow">${esc(eyebrow)}</div>
  <div style="font-family:var(--font-display);font-size:26px;letter-spacing:2px;text-align:center;color:#f0a500;text-shadow:0 0 20px rgba(240,165,0,.25);margin-bottom:12px">${esc(title)}</div>
  ${inner}
</div>`;

const pillFor = cls => cls === 'red' ? 'red' : cls === 'green' ? 'green'
  : cls === 'blue' ? 'blue' : 'gold';

/** Anything the house is being told, in the card the house is always told it in. */
const card = (heading, body, cls, esc, faces = '') => `<div class="bbns-card">
  <div class="bbns-card-h">${faces}<span class="bbns-pill ${pillFor(cls)}">${esc(heading)}</span></div>
  <div class="bbns-card-b">${esc(body)}</div>
</div>`;

const beatCards = (act, esc, avatar) => (act.beats || []).length
  ? `<div class="bbns-cards">${act.beats.map(b => card(b.badgeText || 'THE HOUSE', b.text,
    b.badgeClass, esc, (b.players || []).slice(0, 2).map(n => avatar(n, 28)).join(''))).join('')}</div>`
  : '';

/** A partner is gone, and what is left is safety nobody can spend. */
export function rpBuildBBDuosKey(ep, act, u = {}) {
  if (!act) return '';
  const esc = typeof u.esc === 'function' ? u.esc : esc0;
  const avatar = typeof u.avatar === 'function' ? u.avatar : () => '';
  const others = (act.holders || []).filter(n => n !== act.holder);

  return page(`Week ${act.week} · The duo is broken`, 'GOLDEN KEY', `
    <div class="bbduo-hero">
      <div class="bbduo-who">${avatar(act.holder, 58)}<b>${esc(act.holder)}</b></div>
      <span class="bbduo-chain is-cut" aria-hidden="true"></span>
      <div class="bbduo-who is-gone">${avatar(act.partner, 58)}<b>${esc(act.partner)}</b></div>
    </div>
    <div class="bbduo-lead">${esc(act.partner)} is gone, so the key is theirs — safe from nomination
      and eviction until ${esc(act.keyAt)} are left, and competing for nothing at all until then.</div>
    ${others.length ? `<div class="bbduo-roster">${others.map(n =>
    `<span class="bbduo-tag is-key">${esc(n)} — key</span>`).join('')}</div>` : ''}
    ${beatCards(act, esc, avatar)}
  `, esc);
}

/** Every key stops at once. */
export function rpBuildBBDuosExpire(ep, act, u = {}) {
  if (!act) return '';
  const esc = typeof u.esc === 'function' ? u.esc : esc0;
  const avatar = typeof u.avatar === 'function' ? u.avatar : () => '';

  return page(`Week ${act.week} · ${act.keyAt} left`, 'THE KEYS ARE DONE', `
    <div class="bbduo-lead">Everybody who has been carried this far has to play now, against people
      who have been playing the whole time.</div>
    <div class="bbduo-roster">${(act.holders || []).map(n =>
    `<span class="bbduo-tag is-key">${esc(n)}</span>`).join('')}</div>
    ${beatCards(act, esc, avatar)}
  `, esc);
}

/** Two loose ends, handed to each other. */
export function rpBuildBBDuosRepair(ep, act, u = {}) {
  if (!act) return '';
  const esc = typeof u.esc === 'function' ? u.esc : esc0;
  const avatar = typeof u.avatar === 'function' ? u.avatar : () => '';

  return page(`Week ${act.week} · Big Brother decides`, 'RE-PAIRED', `
    <div class="bbduo-lead">Nobody who lost a partner gets to stay on their own. These two did not
      choose each other and are not being asked to.</div>
    ${(act.pairs || []).map(([a, b]) => `<div class="bbduo-hero">
      <div class="bbduo-who">${avatar(a, 52)}<b>${esc(a)}</b></div>
      <span class="bbduo-chain" aria-hidden="true"></span>
      <div class="bbduo-who">${avatar(b, 52)}<b>${esc(b)}</b></div>
    </div>`).join('')}
    ${act.waiting ? `<div class="bbduo-roster"><span class="bbduo-tag is-alone">${esc(act.waiting)} — still alone</span></div>` : ''}
    ${beatCards(act, esc, avatar)}
  `, esc);
}

/** The week in a Duos season: what being chained to somebody does. */
export function rpBuildBBDuosWeek(ep, act, u = {}) {
  if (!act) return '';
  const esc = typeof u.esc === 'function' ? u.esc : esc0;
  const avatar = typeof u.avatar === 'function' ? u.avatar : () => '';

  const state = [
    ...(act.pairs || []).map(([a, b]) =>
      `<span class="bbduo-tag">${esc(a)}<span class="bbduo-chain" aria-hidden="true"></span>${esc(b)}</span>`),
    ...(act.keys || []).map(n => `<span class="bbduo-tag is-key">${esc(n)} — key</span>`),
    ...(act.orphaned || []).map(n => `<span class="bbduo-tag is-alone">${esc(n)} — alone</span>`),
  ].join('');

  return page(`Week ${act.week} · ${act.goldenKey ? 'Golden Key season' : 'Pairs only'}`,
    'PLAYING IN TWOS', `
    <div class="bbduo-roster">${state}</div>
    <div class="bbns-cards">${(act.events || []).map(e => card(e.badgeText || 'THE HOUSE', e.text,
    e.badgeClass, esc, (e.players || []).slice(0, 2).map(n => avatar(n, 28)).join(''))).join('')}</div>
  `, esc);
}

/**
 * What it looks like when these two in particular come through the door.
 *
 * Branches on the kinship KEY where the act carries one, because matching prose
 * was already fragile with five relations and is hopeless with twenty —
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
      `${a} and ${b} arrive as one unit, and the house starts working out how to break it before `
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
    pools.push(`${a} and ${b} have history, and the room can see it from the doorway.`);
  } else if (/married|partner|engaged|dating/.test(L)) {
    pools.push(`${a} and ${b} arrive as one thing, which is two votes that were never available.`);
  } else if (/twin|sibling|cousin|parent|aunt|law|grand/.test(L)) {
    pools.push(`${a} and ${b} are family, and the house starts deciding which of them is the `
      + `dangerous one immediately.`);
  } else {
    pools.push(`${a} and ${b} knew each other before any of this, which in this house is either `
      + `the best thing you can walk in with or the worst.`);
  }
  pools.push(`Whatever ${a} and ${b} are to each other, from tonight they are one nomination.`);
  return pools[Math.abs(Number(salt) || 0) % pools.length];
}
