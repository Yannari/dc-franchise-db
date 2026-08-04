// ══════════════════════════════════════════════════════════════════════
// vp-bb-sig/otev.js — OTEV's Amphitheater
// ══════════════════════════════════════════════════════════════════════
//
// The signature veto deserves better than a bar chart. OTEV is not a field
// sorted once; it is a series of small public humiliations administered by a
// rude animatronic, and the screen should be shaped like that: a slimy backyard
// amphitheatre, a stage box in the corner with the puppet in it, and a ramp
// roster that loses one name every time the viewer clicks.
//
// This file imports nothing. Everything it needs arrives in `u` from the caller
// (tvState, reveal, avatar, esc, cat, ordinal), and everything it renders is
// derived from the beats the competition already emitted in bb-comps/signature.js.
// Nothing is invented except connective flavour, and the connective flavour is
// picked off the episode number so a rebuild renders byte-identical.
//
// The beats OTEV emits, in order:
//   1. the creature's opening bit                        badge 'OTEV'
//   2. one elimination per round                         badge 'FIRST OUT' | 'ROUND n' | 'RUNNER-UP'
//      (a 'FINAL TWO' banner is emitted once, after the round that leaves two)
//   3. the crown                                         badge 'VETO'
//
// Steps map one-to-one onto that: opening, one card per elimination (the FINAL
// TWO banner riding on the card that follows it), then the crown.

// ── connective flavour ────────────────────────────────────────────────
//
// Deterministic by episode number and step index. No Math.random anywhere in
// this file: the whole screen is rebuilt from scratch on every reveal click,
// and a random line would reshuffle itself under the viewer mid-competition.

const PIT_AMBIENT = [
  'The pit smells like a pond that lost an argument.',
  'Somebody at the back of the pile has started turning names face-down. Nobody stops them.',
  'The ramp gets re-soaked between rounds, which is the only part of this production running on schedule.',
  'A stagehand tops up the foam. There was already enough foam.',
  'Half the field has stopped wiping their eyes and started simply accepting it.',
  'The horn goes early and nobody argues, because arguing with a horn is a losing position.',
  'Two names have been kicked clean off the pile and into the water. They are still valid answers.',
  'The stage lights swing over the pit and stay there, which helps nobody see anything at all.',
];

const IDLE_HECKLES = [
  'Nobody has lost yet. Give it a minute.',
  'I read your files. I was not impressed and I was not paid enough.',
  'Get in the pit. The pit is where you belong.',
  'One of you leaves here with a veto. The rest of you leave here wet.',
  'I have been awake ninety seconds and I already have notes.',
];

const pick = (list, seed) => list[Math.abs(Math.round(seed)) % list.length];

// ── beat parsing ──────────────────────────────────────────────────────

/**
 * The creature's name, taken off the page rather than guessed.
 *
 * Every creature is "OTEV the <Adjective> <Animal>", the opening beat starts
 * with it, and every elimination beat starts with it followed by " asks:". Two
 * ways in, because a competition that ends in one round has an opening beat and
 * not much else.
 */
function creatureName(beats) {
  for (const b of beats) {
    const t = String(b?.text || '');
    const m = /^(OTEV\s+the\s+[A-Za-z'-]+\s+[A-Za-z'-]+)/.exec(t);
    if (m) return m[1];
    const asks = /^(.{3,60}?)\s+asks:/.exec(t);
    if (asks) return asks[1];
  }
  return 'OTEV';
}

/**
 * An elimination beat, taken apart into its three moving pieces.
 *
 * The beat is built as `<creature> asks: <"question"> <how they lost> <insult>`.
 * The question is the only quoted run, and the insult is the only part after it
 * that says the creature's name — the wrong-answer and too-slow lines never do.
 * Anything that fails to split stays whole in `action`, which reads fine.
 */
function splitRound(text, creature) {
  let rest = String(text || '');
  let question = '';
  const qs = rest.indexOf('"');
  if (qs >= 0) {
    const qe = rest.indexOf('"', qs + 1);
    if (qe > qs) { question = rest.slice(qs + 1, qe).trim(); rest = rest.slice(qe + 1).trim(); }
  }
  let insult = '';
  if (creature) {
    const li = rest.lastIndexOf(creature);
    if (li > 0) { insult = rest.slice(li).trim(); rest = rest.slice(0, li).trim(); }
  }
  return { question, action: rest, insult };
}

// ── the puppet ────────────────────────────────────────────────────────

/**
 * A rude animatronic, drawn rather than emoji'd.
 *
 * The creature is different every season, so the drawing takes a hue and a
 * head-topper off the name — same name, same puppet, every rebuild. Nothing in
 * here moves: the only animation is the glisten, which is opacity, because a
 * looping transform on a face this size is a migraine.
 */
function puppetSvg(creature) {
  let hash = 0;
  for (let i = 0; i < creature.length; i++) hash = (hash + creature.charCodeAt(i) * (i + 3)) % 997;
  const hue = 72 + (hash % 42);            // swamp green through bile yellow
  const hide = `hsl(${hue},46%,30%)`;
  const hideDark = `hsl(${hue},50%,19%)`;
  const hideLit = `hsl(${hue},52%,42%)`;
  const belly = `hsl(${(hue + 18) % 360},44%,52%)`;
  const topper = hash % 3;                 // 0 horns, 1 spines, 2 antennae

  const crest = topper === 0
    ? `<path d="M62 44 C56 24 44 18 36 20 C46 26 50 36 52 50 Z" fill="${hideDark}"/>
       <path d="M138 44 C144 24 156 18 164 20 C154 26 150 36 148 50 Z" fill="${hideDark}"/>`
    : topper === 1
      ? `<path d="M74 34 L82 12 L90 34 Z" fill="${hideDark}"/>
         <path d="M92 30 L100 6 L108 30 Z" fill="${hideDark}"/>
         <path d="M110 34 L118 12 L126 34 Z" fill="${hideDark}"/>`
      : `<path d="M78 40 C70 18 54 14 48 22" stroke="${hideDark}" stroke-width="5" fill="none" stroke-linecap="round"/>
         <circle cx="47" cy="21" r="7" fill="${belly}"/>
         <path d="M122 40 C130 18 146 14 152 22" stroke="${hideDark}" stroke-width="5" fill="none" stroke-linecap="round"/>
         <circle cx="153" cy="21" r="7" fill="${belly}"/>`;

  return `<svg class="sgo-puppet" viewBox="0 0 200 158" role="img" aria-label="${creature}">
    ${crest}
    <!-- arms, slung over the front of the stage box -->
    <path d="M26 108 C6 104 2 122 8 136 C14 148 30 148 36 138" fill="${hideDark}"/>
    <path d="M8 136 l-7 8 M14 141 l-6 9 M21 143 l-4 10" stroke="${hideDark}" stroke-width="5" stroke-linecap="round"/>
    <path d="M174 108 C194 104 198 122 192 136 C186 148 170 148 164 138" fill="${hideDark}"/>
    <path d="M192 136 l7 8 M186 141 l6 9 M179 143 l4 10" stroke="${hideDark}" stroke-width="5" stroke-linecap="round"/>
    <!-- head -->
    <path d="M22 150 C10 92 40 34 100 34 C160 34 190 92 178 150 Z" fill="${hide}"/>
    <path d="M46 150 C40 118 62 96 100 96 C138 96 160 118 154 150 Z" fill="${belly}" opacity="0.55"/>
    <!-- eyes, heavy-lidded and looking away from you -->
    <ellipse cx="72" cy="70" rx="21" ry="19" fill="#f2ffd4"/>
    <ellipse cx="128" cy="70" rx="21" ry="19" fill="#f2ffd4"/>
    <circle cx="80" cy="74" r="8.5" fill="#12180a"/>
    <circle cx="136" cy="74" r="8.5" fill="#12180a"/>
    <path d="M51 70 C56 52 88 52 93 68 Z" fill="${hideLit}"/>
    <path d="M107 68 C112 52 144 52 149 70 Z" fill="${hideLit}"/>
    <!-- one continuous unimpressed brow -->
    <path d="M46 56 C64 42 84 44 96 54 C108 44 128 42 146 56 L150 46 C130 30 108 32 96 42 C84 32 62 30 42 46 Z" fill="${hideDark}"/>
    <!-- snout -->
    <ellipse cx="88" cy="100" rx="4" ry="6" fill="${hideDark}" transform="rotate(-16 88 100)"/>
    <ellipse cx="112" cy="100" rx="4" ry="6" fill="${hideDark}" transform="rotate(16 112 100)"/>
    <!-- mouth: wide, downturned, badly maintained -->
    <path d="M56 118 C76 140 124 140 144 118 C124 128 76 128 56 118 Z" fill="#170f06"/>
    <path d="M56 118 C76 140 124 140 144 118" stroke="${hideDark}" stroke-width="4" fill="none" stroke-linecap="round"/>
    <path d="M74 124 l5 11 l6 -9 Z" fill="#eef7cf"/>
    <path d="M95 127 l4 12 l6 -11 Z" fill="#eef7cf"/>
    <path d="M117 124 l6 10 l4 -11 Z" fill="#e2ecc0"/>
    <!-- warts -->
    <circle cx="42" cy="96" r="6" fill="${hideDark}" opacity="0.8"/>
    <circle cx="56" cy="86" r="4" fill="${hideDark}" opacity="0.7"/>
    <circle cx="158" cy="96" r="6" fill="${hideDark}" opacity="0.8"/>
    <circle cx="144" cy="84" r="4" fill="${hideDark}" opacity="0.7"/>
    <!-- glisten: the only thing on this puppet that is allowed to move -->
    <ellipse class="sgo-glint sgo-g1" cx="66" cy="52" rx="13" ry="6" fill="#fbffe8" opacity="0.5"/>
    <ellipse class="sgo-glint sgo-g2" cx="134" cy="54" rx="9" ry="4.5" fill="#fbffe8" opacity="0.35"/>
    <ellipse class="sgo-glint sgo-g3" cx="100" cy="150" rx="26" ry="5" fill="#dff58f" opacity="0.28"/>
  </svg>`;
}

/** A hanging slime drip. Static shape, animated light. */
const dripStrip = () => `<svg class="sgo-drip-strip" viewBox="0 0 400 26" preserveAspectRatio="none" aria-hidden="true">
  <path d="M0 0 H400 V7 C380 7 372 22 360 22 C348 22 344 7 328 7 C300 7 292 18 280 18 C266 18 262 7 240 7
           C214 7 208 25 194 25 C180 25 176 7 150 7 C124 7 118 20 104 20 C90 20 86 7 62 7 C40 7 34 16 22 16
           C12 16 8 7 0 7 Z" fill="var(--sgo-slime)"/>
  <circle class="sgo-bead sgo-b1" cx="360" cy="24" r="3" fill="var(--sgo-bile)"/>
  <circle class="sgo-bead sgo-b2" cx="194" cy="26" r="3.4" fill="var(--sgo-bile)"/>
  <circle class="sgo-bead sgo-b3" cx="104" cy="22" r="2.6" fill="var(--sgo-bile)"/>
</svg>`;

// ══════════════════════════════════════════════════════════════════════
// The screen
// ══════════════════════════════════════════════════════════════════════

export function rpBuildSigOtev(ep, actType, u) {
  const act = (ep?.acts || []).find(a => a.type === actType);
  const comp = act?.competition;
  const rows = act?.results || [];
  const beats = Array.isArray(comp?.beats) ? comp.beats.filter(b => b && b.text) : [];

  // The Invisible HOH seals its result; a screen built entirely out of who went
  // out when cannot keep that secret, so it hands the week back to the generic
  // board. Same for anything half-serialised.
  if (act?.secret) return '';
  if (!act || !comp || !rows.length || !beats.length) return '';

  const esc = u.esc, avatar = u.avatar, ordinal = u.ordinal;
  const cat = u.cat(comp.category);
  const stateKey = `bb_sig_otev_${ep.num}_${actType}${ep?._seg ? `_s${ep._seg}` : ''}`;
  if (!u.tvState[stateKey]) u.tvState[stateKey] = { idx: -1 };
  const state = u.tvState[stateKey];

  const isHoh = actType === 'hoh';
  const prize = isHoh ? 'HEAD OF HOUSEHOLD' : 'POWER OF VETO';
  const creature = creatureName(beats);
  // Normalised results file per-player numbers under debug.scoreBreakdown; a
  // raw engine result carries them at the top level. Read both or every stat
  // on this screen renders as zero.
  const breakdown = comp.breakdown || comp.debug?.scoreBreakdown || {};
  const winner = act.winner || rows[0]?.name || '';

  // ── beats → steps ──
  const opening = beats[0];
  const eliminations = [];
  let crown = null;
  let pendingBanner = null;
  beats.slice(1).forEach(b => {
    const badge = String(b.badgeText || '').toUpperCase();
    if (badge === 'FINAL TWO') { pendingBanner = b; return; }
    if (badge === 'VETO' || badge === 'HEAD OF HOUSEHOLD') { crown = b; return; }
    if (!(b.players || []).length) return;
    eliminations.push({ beat: b, banner: pendingBanner });
    pendingBanner = null;
  });

  const roster = (act.participants || comp.participants || rows.map(r => r.name))
    .map(v => (typeof v === 'string' ? v : v?.name)).filter(Boolean);
  const outNames = eliminations.map(e => e.beat.players[0]);

  const steps = [{ kind: 'open' }, ...eliminations.map(e => ({ kind: 'round', ...e })), { kind: 'crown' }];
  const total = steps.length;
  const revealed = Math.max(0, Math.min(total, state.idx + 1));
  const done = state.idx >= total - 1;

  // How many eliminations the viewer has actually seen — the ramp roster and the
  // puppet's mouth are both gated on this and nothing else.
  const seenOuts = Math.max(0, Math.min(eliminations.length, state.idx));
  const goneNow = outNames.slice(0, seenOuts);

  // ── the puppet's current line ──
  let bubble = pick(IDLE_HECKLES, ep.num);
  let bubbleWho = '';
  if (state.idx === 0) {
    bubble = String(opening.text || '').replace(new RegExp(`^${creature.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*`), '');
    bubble = bubble.charAt(0).toUpperCase() + bubble.slice(1);
  } else if (state.idx > 0 && state.idx <= eliminations.length) {
    const e = eliminations[state.idx - 1];
    const parts = splitRound(e.beat.text, creature);
    bubble = parts.insult || `${creature} has nothing kind to say, and says it anyway.`;
    bubbleWho = e.beat.players[0];
  } else if (done && crown) {
    const li = String(crown.text).lastIndexOf(creature);
    bubble = li > 0 ? String(crown.text).slice(li) : String(crown.text);
    bubbleWho = winner;
  }

  // ── stat weights, because the viewer cannot read a result without them ──
  const weights = Object.entries(comp.stats || {}).sort((a, b) => b[1] - a[1]).slice(0, 4);

  const bar = (v, max, colour) => `<span class="sgo-bar"><i style="width:${
    Math.max(4, Math.min(100, Math.round((Number(v) || 0) / max * 100)))}%;background:${colour}"></i></span>`;

  // ── cards ──
  const cards = steps.map((s, i) => {
    if (i > state.idx) {
      return `<div class="sgo-card sgo-locked" aria-hidden="true"><span class="sgo-slat"></span></div>`;
    }

    if (s.kind === 'open') {
      const front = (opening.players || []).filter(Boolean);
      return `<article class="sgo-card sgo-open">
        <header class="sgo-ch"><span class="sgo-tag sgo-tag-otev">${esc(opening.badgeText || 'OTEV')}</span>
          <span class="sgo-left">${roster.length} in the pit</span></header>
        <p class="sgo-body">${esc(opening.text)}</p>
        ${front.length ? `<div class="sgo-front">
          <span class="sgo-front-l">front row</span>
          ${front.map(n => `<span class="sgo-face" title="${esc(n)}">${avatar(n, 30)}</span>`).join('')}
        </div>` : ''}
      </article>`;
    }

    if (s.kind === 'crown') {
      const b = breakdown[winner] || {};
      const survived = Number(b.roundsSurvived);
      const line = crown && (crown.players || [])[0] === winner
        ? esc(crown.text)
        : `${esc(winner)} is the last houseguest on the ramp, and takes the ${esc(prize.toLowerCase())}.`;
      return `<article class="sgo-card sgo-crown">
        <div class="sgo-crown-glow" aria-hidden="true"></div>
        <header class="sgo-ch"><span class="sgo-tag sgo-tag-gold">${esc(prize)}</span>
          ${Number.isFinite(survived) ? `<span class="sgo-left">${survived} round${survived === 1 ? '' : 's'} survived</span>` : ''}
        </header>
        <div class="sgo-crown-b">
          <span class="sgo-crown-face">${avatar(winner, 74)}</span>
          <div>
            <div class="sgo-crown-name">${esc(winner)}</div>
            <p class="sgo-body">${line}</p>
          </div>
        </div>
      </article>`;
    }

    // ── a round ──
    const name = s.beat.players[0];
    const parts = splitRound(s.beat.text, creature);
    const bk = breakdown[name] || {};
    const place = rows.findIndex(r => r.name === name) + 1;
    const left = roster.length - i;          // still on the ramp after this one goes
    const wrong = !!bk.wrongAnswer;
    return `<article class="sgo-card sgo-round">
      ${s.banner ? `<div class="sgo-banner"><span class="sgo-tag sgo-tag-gold">${
        esc(s.banner.badgeText || 'FINAL TWO')}</span><p>${esc(s.banner.text)}</p></div>` : ''}
      <header class="sgo-ch">
        <span class="sgo-tag ${String(s.beat.badgeClass) === 'red' ? 'sgo-tag-red' : 'sgo-tag-round'}">${
          esc(s.beat.badgeText || `ROUND ${i}`)}</span>
        <span class="sgo-left">${Math.max(0, left)} left on the ramp</span>
      </header>
      ${parts.question ? `<blockquote class="sgo-q"><span class="sgo-q-l">the question</span>${esc(parts.question)}</blockquote>` : ''}
      <div class="sgo-ambient">${esc(pick(PIT_AMBIENT, ep.num * 7 + i))}</div>
      <div class="sgo-out">
        <span class="sgo-out-face">${avatar(name, 46)}</span>
        <div class="sgo-out-b">
          <div class="sgo-out-h">
            <b>${esc(name)}</b>
            <span class="sgo-pill ${wrong ? 'sgo-pill-red' : 'sgo-pill-amber'}">${wrong ? 'WRONG ANSWER' : 'LAST UP THE RAMP'}</span>
            ${place > 0 ? `<span class="sgo-place">${esc(ordinal(place))}</span>` : ''}
          </div>
          <p class="sgo-body">${esc(parts.action || s.beat.text)}</p>
        </div>
      </div>
      ${(Number.isFinite(Number(bk.recall)) || Number.isFinite(Number(bk.scramble))) ? `<div class="sgo-stats">
        <span class="sgo-stat"><i>recall</i>${bar(bk.recall, 13, 'var(--sgo-bile)')}<u>${Number(bk.recall).toFixed(1)}</u></span>
        <span class="sgo-stat"><i>ramp</i>${bar(bk.scramble, 13, 'var(--sgo-slime)')}<u>${Number(bk.scramble).toFixed(1)}</u></span>
        ${Number.isFinite(Number(bk.roundsSurvived)) ? `<span class="sgo-stat sgo-stat-n"><i>survived</i><u>${bk.roundsSurvived}</u></span>` : ''}
      </div>` : ''}
      ${parts.insult ? `<div class="sgo-heckle"><span class="sgo-heckle-l">${esc(creature)}</span>${esc(parts.insult)}</div>` : ''}
    </article>`;
  }).join('');

  // ── the ramp roster ──
  const rampRows = roster.map(n => {
    const outIdx = goneNow.indexOf(n);
    const gone = outIdx >= 0;
    const isWin = done && n === winner;
    return `<div class="sgo-ramp-row ${gone ? 'is-out' : ''} ${isWin ? 'is-win' : ''}">
      <span class="sgo-ramp-face">${avatar(n, 24)}</span>
      <span class="sgo-ramp-name">${esc(n)}</span>
      <span class="sgo-ramp-tag">${gone ? (outIdx === 0 ? 'OUT 1st' : `OUT R${outIdx + 1}`) : (isWin ? 'VETO' : '')}</span>
    </div>`;
  }).join('');

  const standing = roster.length - goneNow.length;

  return `<div class="rp-page bb-room ${isHoh ? 'bb-power' : 'bb-block'} sigotev">
<style>
@import url('https://fonts.googleapis.com/css2?family=Titan+One&family=Karla:ital,wght@0,400;0,600;0,800;1,400&display=swap');
.sigotev{--sgo-ink:#0b1206;--sgo-moss:#16220e;--sgo-moss2:#1e2f13;--sgo-slime:#5aa832;--sgo-bile:#c3e64f;
  --sgo-rot:#3c5c1f;--sgo-gold:#f0c23a;--sgo-red:#e2603c;--sgo-mud:#8ea277;
  font-family:'Karla',system-ui,sans-serif;color:#e8f4d6;position:relative;overflow:clip}
.sigotev .sgo-wrap{max-width:1100px;margin:0 auto;position:relative;z-index:2}
.sigotev .sgo-bg{position:absolute;inset:46px 0 0 0;z-index:0;pointer-events:none;
  background:radial-gradient(circle at 50% 0%,rgba(90,168,50,0.22),transparent 62%),
             radial-gradient(circle at 12% 78%,rgba(195,230,79,0.09),transparent 55%),
             linear-gradient(180deg,var(--sgo-ink),#070d04 70%)}
.sigotev .sgo-bg::after{content:'';position:absolute;inset:0;
  background:repeating-linear-gradient(115deg,rgba(195,230,79,0.05) 0 2px,transparent 2px 9px);
  animation:sgoWash 7s ease-in-out infinite}
@keyframes sgoWash{0%,100%{opacity:0.35}50%{opacity:0.75}}

/* ── header ── */
.sigotev .sgo-head{text-align:center;padding:14px 8px 6px}
.sigotev .sgo-eyebrow{font-size:10px;letter-spacing:3px;color:var(--sgo-mud);text-transform:uppercase}
.sigotev .sgo-title{font-family:'Titan One',cursive;font-size:52px;line-height:1;letter-spacing:3px;margin:6px 0 2px;
  color:var(--sgo-bile);text-shadow:0 3px 0 var(--sgo-rot),0 0 26px rgba(195,230,79,0.35);animation:sgoLamp 5s ease-in-out infinite}
@keyframes sgoLamp{0%,100%{filter:brightness(1)}50%{filter:brightness(1.16)}}
.sigotev .sgo-creature{font-size:13px;font-style:italic;color:#cfe4a6;margin-bottom:8px}
.sigotev .sgo-meta{display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-bottom:8px}
.sigotev .sgo-chip{font-size:9.5px;letter-spacing:1.6px;font-weight:800;padding:3px 9px;border-radius:999px;
  border:1px solid rgba(195,230,79,0.35);background:rgba(90,168,50,0.12);color:#dff0b6;text-transform:uppercase}
.sigotev .sgo-desc{max-width:720px;margin:0 auto 10px;font-size:12.5px;line-height:1.65;color:#c7d9ac}
.sigotev .sgo-weights{display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-bottom:6px}
.sigotev .sgo-w{display:flex;align-items:center;gap:5px;font-size:10px;letter-spacing:1px;color:#b8ce97}
.sigotev .sgo-w b{display:block;height:100%;border-radius:3px}
.sigotev .sgo-w .sgo-wb{width:44px;height:5px;border-radius:3px;background:rgba(255,255,255,0.09);overflow:hidden}

/* ── layout ── */
.sigotev .sgo-grid{display:grid;grid-template-columns:minmax(0,1fr) 268px;gap:16px;align-items:start}
@media(max-width:820px){.sigotev .sgo-grid{grid-template-columns:1fr}}

/* ── cards ── */
.sigotev .sgo-card{position:relative;border-radius:12px;padding:14px;margin-bottom:12px;
  border:1px solid rgba(195,230,79,0.16);border-left:4px solid var(--sgo-slime);
  background:linear-gradient(160deg,rgba(30,47,19,0.94),rgba(11,18,6,0.94));
  box-shadow:0 12px 26px rgba(0,0,0,0.45);animation:sgoIn .42s cubic-bezier(.2,.9,.25,1) both}
@keyframes sgoIn{from{opacity:0;transform:translateY(14px) scale(.985)}to{opacity:1;transform:none}}
.sigotev .sgo-locked{min-height:56px;display:flex;align-items:center;justify-content:center;opacity:.22;
  border-left-color:rgba(140,160,120,0.4);animation:none;box-shadow:none}
.sigotev .sgo-slat{display:block;width:78%;height:10px;border-radius:5px;
  background:repeating-linear-gradient(135deg,rgba(195,230,79,0.28) 0 7px,transparent 7px 14px)}
.sigotev .sgo-ch{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:9px}
.sigotev .sgo-tag{font-size:9.5px;font-weight:800;letter-spacing:1.7px;padding:3px 8px;border-radius:4px}
.sigotev .sgo-tag-otev{color:#0c1206;background:var(--sgo-bile)}
.sigotev .sgo-tag-round{color:#dff0b6;background:rgba(90,168,50,0.24);border:1px solid rgba(195,230,79,0.3)}
.sigotev .sgo-tag-red{color:#180a06;background:var(--sgo-red)}
.sigotev .sgo-tag-gold{color:#1a1303;background:var(--sgo-gold)}
.sigotev .sgo-left{font-size:10px;letter-spacing:1.2px;color:var(--sgo-mud);text-transform:uppercase}
.sigotev .sgo-body{font-size:12.8px;line-height:1.68;color:#e2eed2;margin:0}
.sigotev .sgo-front{display:flex;align-items:center;gap:7px;margin-top:10px}
.sigotev .sgo-front-l{font-size:9px;letter-spacing:1.6px;color:var(--sgo-mud);text-transform:uppercase}

.sigotev .sgo-q{margin:0 0 9px;padding:9px 12px;border-radius:8px;border:1px dashed rgba(195,230,79,0.34);
  background:rgba(90,168,50,0.08);font-size:14px;line-height:1.5;color:#f0ffd8;font-style:italic}
.sigotev .sgo-q-l{display:block;font-style:normal;font-size:8.5px;letter-spacing:2px;color:var(--sgo-mud);
  text-transform:uppercase;margin-bottom:4px}
.sigotev .sgo-ambient{font-size:11px;line-height:1.55;color:#9fb385;margin-bottom:10px;padding-left:10px;
  border-left:2px solid rgba(195,230,79,0.22)}
.sigotev .sgo-out{display:flex;gap:11px;align-items:flex-start}
.sigotev .sgo-out-b{flex:1;min-width:0}
.sigotev .sgo-out-h{display:flex;align-items:center;gap:7px;flex-wrap:wrap;margin-bottom:5px}
.sigotev .sgo-out-h b{font-family:'Titan One',cursive;font-size:15px;letter-spacing:.5px;color:#f2ffd9}
.sigotev .sgo-pill{font-size:8.5px;font-weight:800;letter-spacing:1.3px;padding:2px 7px;border-radius:999px}
.sigotev .sgo-pill-red{color:#1a0a06;background:var(--sgo-red)}
.sigotev .sgo-pill-amber{color:#1a1303;background:#d8a33a}
.sigotev .sgo-place{font-size:10px;letter-spacing:1px;color:var(--sgo-mud)}
.sigotev .sgo-stats{display:flex;gap:14px;flex-wrap:wrap;margin-top:10px;padding-top:9px;
  border-top:1px solid rgba(195,230,79,0.12)}
.sigotev .sgo-stat{display:flex;align-items:center;gap:6px;font-size:9.5px;letter-spacing:1.2px;color:#a9bd8c}
.sigotev .sgo-stat i{font-style:normal;text-transform:uppercase}
.sigotev .sgo-stat u{text-decoration:none;color:#e6f3d2;font-weight:800;font-size:11px}
.sigotev .sgo-bar{display:block;width:62px;height:5px;border-radius:3px;background:rgba(255,255,255,0.09);overflow:hidden}
.sigotev .sgo-bar i{display:block;height:100%;border-radius:3px}
.sigotev .sgo-heckle{margin-top:10px;padding:9px 11px;border-radius:8px;font-size:12px;line-height:1.6;
  color:#0e1406;background:linear-gradient(180deg,var(--sgo-bile),#a9cf3c);font-weight:600}
.sigotev .sgo-heckle-l{display:block;font-family:'Titan One',cursive;font-size:9px;letter-spacing:2px;
  text-transform:uppercase;opacity:.72;margin-bottom:3px}
.sigotev .sgo-banner{margin:-4px -4px 11px;padding:9px 11px;border-radius:9px;
  background:rgba(240,194,58,0.12);border:1px solid rgba(240,194,58,0.4)}
.sigotev .sgo-banner p{margin:6px 0 0;font-size:12.4px;line-height:1.6;color:#f7ecc4}

.sigotev .sgo-crown{border-left-color:var(--sgo-gold);border-color:rgba(240,194,58,0.45);
  background:linear-gradient(160deg,rgba(60,48,10,0.95),rgba(14,16,6,0.96))}
.sigotev .sgo-crown-glow{position:absolute;inset:0;border-radius:12px;pointer-events:none;
  box-shadow:inset 0 0 44px rgba(240,194,58,0.28);animation:sgoGold 4.5s ease-in-out infinite}
@keyframes sgoGold{0%,100%{opacity:.55}50%{opacity:1}}
.sigotev .sgo-crown-b{display:flex;gap:14px;align-items:center;position:relative}
.sigotev .sgo-crown-name{font-family:'Titan One',cursive;font-size:26px;letter-spacing:1px;color:var(--sgo-gold);
  text-shadow:0 0 22px rgba(240,194,58,0.4);margin-bottom:4px}

/* ── stage box ── */
.sigotev .sgo-side{position:sticky;top:56px;display:flex;flex-direction:column;gap:12px}
.sigotev .sgo-stage{position:relative;border-radius:12px;overflow:hidden;padding:10px 10px 0;
  border:1px solid rgba(195,230,79,0.22);
  background:radial-gradient(ellipse at 50% 12%,rgba(195,230,79,0.2),transparent 62%),
             linear-gradient(180deg,#101a09,#070d04)}
.sigotev .sgo-stage-l{font-size:8.5px;letter-spacing:2px;color:var(--sgo-mud);text-transform:uppercase;margin-bottom:6px}
.sigotev .sgo-bubble{position:relative;background:#f4ffe0;color:#131c09;border-radius:10px;padding:9px 11px;
  font-size:11.6px;line-height:1.55;font-weight:600;margin-bottom:12px;box-shadow:0 6px 18px rgba(0,0,0,0.4)}
.sigotev .sgo-bubble::after{content:'';position:absolute;left:26px;bottom:-9px;border:9px solid transparent;
  border-top-color:#f4ffe0;border-bottom:0}
.sigotev .sgo-bubble-who{display:block;font-family:'Titan One',cursive;font-size:8.5px;letter-spacing:1.8px;
  text-transform:uppercase;color:#5d7a2e;margin-bottom:3px}
.sigotev .sgo-puppet{display:block;width:100%;height:auto;filter:drop-shadow(0 -6px 16px rgba(195,230,79,0.28));
  animation:sgoLit 6s ease-in-out infinite}
@keyframes sgoLit{0%,100%{filter:drop-shadow(0 -6px 14px rgba(195,230,79,0.2))}
  50%{filter:drop-shadow(0 -6px 22px rgba(195,230,79,0.45))}}
.sigotev .sgo-glint{animation:sgoGlint 3.6s ease-in-out infinite}
.sigotev .sgo-g2{animation-delay:.7s}.sigotev .sgo-g3{animation-delay:1.4s}
@keyframes sgoGlint{0%,100%{opacity:.18}50%{opacity:.72}}
.sigotev .sgo-drip-strip{display:block;width:100%;height:22px}
.sigotev .sgo-bead{animation:sgoBead 3.2s ease-in-out infinite}
.sigotev .sgo-b2{animation-delay:.9s}.sigotev .sgo-b3{animation-delay:1.8s}
@keyframes sgoBead{0%,100%{opacity:.15}55%{opacity:.95}}

/* ── ramp roster ── */
.sigotev .sgo-ramp{border-radius:12px;padding:11px;border:1px solid rgba(195,230,79,0.16);
  background:linear-gradient(180deg,rgba(30,47,19,0.9),rgba(11,18,6,0.92))}
.sigotev .sgo-ramp-h{display:flex;align-items:baseline;justify-content:space-between;margin-bottom:8px}
.sigotev .sgo-ramp-h b{font-family:'Titan One',cursive;font-size:11px;letter-spacing:1.6px;color:var(--sgo-bile)}
.sigotev .sgo-ramp-h span{font-size:9.5px;letter-spacing:1.2px;color:var(--sgo-mud)}
.sigotev .sgo-ramp-row{display:flex;align-items:center;gap:8px;padding:4px 5px;border-radius:6px;
  transition:opacity .35s ease,background .35s ease}
.sigotev .sgo-ramp-name{flex:1;min-width:0;font-size:11.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.sigotev .sgo-ramp-tag{font-size:8.5px;letter-spacing:1.2px;color:var(--sgo-red);font-weight:800}
.sigotev .sgo-ramp-row.is-out{opacity:.34}
.sigotev .sgo-ramp-row.is-out .sgo-ramp-name{text-decoration:line-through;color:#93a67f}
.sigotev .sgo-ramp-row.is-win{background:rgba(240,194,58,0.14)}
.sigotev .sgo-ramp-row.is-win .sgo-ramp-tag{color:var(--sgo-gold)}
.sigotev .sgo-ramp-row.is-win .sgo-ramp-name{font-weight:800;color:var(--sgo-gold)}

/* ── controls ── */
.sigotev .sgo-controls{position:sticky;bottom:0;z-index:5;display:flex;gap:8px;justify-content:center;align-items:center;
  margin-top:10px;padding:10px;border-radius:12px 12px 0 0;
  background:linear-gradient(180deg,rgba(11,18,6,0.4),rgba(11,18,6,0.96));
  backdrop-filter:blur(5px);border-top:1px solid rgba(195,230,79,0.22)}
.sigotev .sgo-count{font-size:10px;letter-spacing:1.6px;color:var(--sgo-mud)}
.sigotev .sgo-done{font-size:10.5px;letter-spacing:1.6px;color:var(--sgo-bile);text-transform:uppercase}

@media(prefers-reduced-motion:reduce){
  .sigotev *,.sigotev *::before,.sigotev *::after{animation:none!important;transition:none!important}
}
</style>
  <div class="sgo-bg" aria-hidden="true"></div>
  <div class="sgo-wrap">
    <header class="sgo-head">
      <div class="sgo-eyebrow">Week ${esc(ep.num)} &middot; ${esc(prize)}</div>
      <h1 class="sgo-title">OTEV</h1>
      <div class="sgo-creature">${esc(creature)} presides over the amphitheatre.</div>
      <div class="sgo-meta">
        <span class="sgo-chip" style="border-color:${cat.accent}66;color:${cat.accent}">${esc(cat.label)}</span>
        <span class="sgo-chip">${roster.length} in the pit</span>
        <span class="sgo-chip">${eliminations.length} round${eliminations.length === 1 ? '' : 's'}</span>
      </div>
      ${(comp.excluded || []).filter(Boolean).length ? `<div class="sgo-creature">Sat out: ${
        (comp.excluded || []).filter(Boolean).map(esc).join(', ')}${
        actType === 'hoh' && act.outgoingHoh ? ` &middot; ${esc(act.outgoingHoh)} cannot defend the room` : ''}</div>` : ''}
      ${comp.desc ? `<p class="sgo-desc">${esc(comp.desc)}</p>` : ''}
      ${weights.length ? `<div class="sgo-weights">${weights.map(([k, w]) => `<span class="sgo-w">
        <i>${esc(k)}</i><span class="sgo-wb"><b style="width:${Math.round(w * 100)}%;background:${cat.accent}"></b></span>
        <u style="text-decoration:none">${Math.round(w * 100)}%</u></span>`).join('')}</div>` : ''}
    </header>
    ${dripStrip()}
    <div class="sgo-grid">
      <main class="sgo-main">${cards}</main>
      <aside class="sgo-side">
        <div class="sgo-stage">
          <div class="sgo-stage-l">the stage box</div>
          <div class="sgo-bubble">
            ${bubbleWho ? `<span class="sgo-bubble-who">to ${esc(bubbleWho)}</span>` : ''}
            ${esc(bubble)}
          </div>
          ${puppetSvg(creature)}
        </div>
        <div class="sgo-ramp">
          <div class="sgo-ramp-h"><b>ON THE RAMP</b><span>${standing} / ${roster.length}</span></div>
          ${rampRows}
        </div>
      </aside>
    </div>
    <div class="sgo-controls">
      ${done ? '<span class="sgo-done">The pit is empty. Somebody has the veto.</span>' : `
        <button class="rp-btn" onclick="${u.reveal(ep, stateKey, Math.min(state.idx + 1, total - 1))}">${
          state.idx < 0 ? 'Open the amphitheatre' : 'Next round'}</button>
        <button class="rp-btn rp-btn-ghost" onclick="${u.reveal(ep, stateKey, total - 1)}">Reveal all</button>`}
      <span class="sgo-count">${revealed} / ${total}</span>
    </div>
  </div>
</div>`;
}
