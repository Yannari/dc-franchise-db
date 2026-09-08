// ══════════════════════════════════════════════════════════════════════
// vp-dr/screens.js — the seventeen screens, in the running order
// ══════════════════════════════════════════════════════════════════════
//
// ONE LIST, TWO READERS. The viewing party and the text backlog both build
// from this file, which is the whole reason it exists: the Traitors put its
// screen table in one place after the transcript quietly stopped mentioning
// a screen nobody had remembered to add to the second copy. A screen that is
// not in this list is not in either place, and a screen that is, is in both.
//
// ── HOW A SCENE FINDS ITS SCREEN ──────────────────────────────────────
//
// The engine already emits SECTION MARKERS as it plays — `cold-open`,
// `werk-morning`, `mini`, `maxi-announce`, `prep-room`, `main-stage`,
// `runway`, `critiques`, `untucked`, `results`, `lipsync`, `exit`, and the
// finale's own three. So nothing here re-derives what happened. The scene
// list is walked ONCE in order; a marker opens its section and every scene
// after it belongs to that section until the next marker opens the next.
//
// That ordering is the point. An episode carries 100-130 scenes and they are
// already in running order, so assigning them by kind-matching would need a
// rule per kind — 150-odd of them — and a kind nobody wrote a rule for would
// vanish off the end of the show without a word. `tests/dr-vp-registry`
// asserts that EVERY scene reaches a screen, which is the only version of
// this that stays true as the engine grows new scene kinds.
import { _shell, _portrait, _icon } from './style.js';
import { _controls, _state } from './reveal.js';
import { rpBuildChart } from './chart.js';
import { rpBuildColdOpen, rpBuildWerkMorning, rpBuildWerkElimDay } from './werk.js';
import { rpBuildArrivals } from './arrivals.js';
import { rpBuildMini, rpBuildMaxiAnnounce, rpBuildChoice, rpBuildPrep, rpBuildMaxi } from './challenge.js';
import { rpBuildMainStage, rpBuildRunway, rpBuildCritiques, rpBuildUntucked } from './stage.js';
import { rpBuildResults, rpBuildLipSync, rpBuildExit, rpBuildFinaleOpen } from './results.js';
import { rpBuildSmackdown } from './smackdown.js';
import { rpBuildCrowning } from './crowning.js';

const esc = v => String(v ?? '').replace(/[&<>"]/g, c =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/**
 * The sections, in the order they happen.
 *
 * `opens` are the scene kinds that START this section. `phase` picks the
 * atmosphere. `accent` picks the panel rail's colour family, so a reader can
 * tell what KIND of thing a panel is without reading a word of it.
 */
const SECTIONS = [
  { id: 'dr-arrivals', label: 'Arrivals', suffix: 'arrivals', phase: 'werk', accent: 'dr-a-room',
    opens: ['arrivals', 'entrance-order'], badge: { text: 'ENTRANCES', color: '#FFC83D' },
    title: 'Entrances', subtitle: 'the first thirteen through the door' },
  /* ── A QUEEN COMES BACK ──
     First screen of the night when the season books one, because the return
     is the first thing that happens: she is through the door before the room
     has finished waking up. Ahead of the cold open on purpose. */
  { id: 'dr-return', label: 'She’s Back', suffix: 'return', phase: 'werk',
    accent: 'dr-a-bond',
    opens: ['return:return-door', 'return:return-walk', 'return:return-room',
      'return:return-rule'],
    badge: { text: 'RETURNS', color: '#3BE08A' },
    title: 'She’s Back', subtitle: 'somebody the show already sent home' },
  { id: 'dr-cold-open', label: 'Cold Open', suffix: 'coldopen', phase: 'werk', accent: 'dr-a-room',
    opens: ['cold-open'], badge: null, title: 'Cold Open', subtitle: 'the room, before anything' },
  { id: 'dr-werk-morning', label: 'The Werk Room', suffix: 'morning', phase: 'werk', accent: 'dr-a-room',
    opens: ['werk-morning'], badge: null, title: 'The Werk Room', subtitle: 'morning' },
  { id: 'dr-mini', label: 'Mini', suffix: 'mini', phase: 'werk', accent: 'dr-a-score',
    opens: ['mini'], badge: { text: 'MINI', color: '#00E5FF' },
    title: 'The Mini Challenge', subtitle: 'first blood' },
  { id: 'dr-announce', label: 'The Brief', suffix: 'announce', phase: 'werk', accent: 'dr-a-room',
    opens: ['maxi-announce'], badge: null, title: 'The Maxi Challenge', subtitle: 'the brief' },
  { id: 'dr-choice', label: 'The Draft', suffix: 'choice', phase: 'werk', accent: 'dr-a-bond',
    opens: ['improv-premises', 'snatch-picks', 'ball-theme', 'group-parts', 'roast-order',
      'makeover-pairs', 'singing-order', 'walkthrough'],
    badge: { text: 'PICKS', color: '#7B2FF7' }, title: 'The Draft', subtitle: 'who takes what' },
  { id: 'dr-prep', label: 'Prep', suffix: 'prep', phase: 'werk', accent: 'dr-a-room',
    opens: ['prep-room', 'writing-room', 'band-rehearsal', 'recording-booth', 'ball-build',
      'makeover-build', 'no-rehearsal'],
    badge: null, title: 'The Work Room', subtitle: 'building it' },
  /* OPENS ON THE STEP, NOT ON A LIST OF KINDS. This named seven scene kinds
     — improv-take, snatch-taping, group-number, roast-set, ball-walks,
     makeover-reveal, singing-performance — and there are nineteen
     challenges. The other twelve emit their own kinds, so nine of them
     opened no maxi section at all: their performances were swept into
     whichever screen was open before, and The Talent Show Extravaganza,
     The Rusical, Acting, Design, Photoshoot, Choreography, Commercial, the
     Runway Challenge and the Lalaparuza each ran a full challenge that had
     no screen. The scenes were all there. Thirty-one of them, on the talent
     show, rendered under the previous heading.

     An allowlist of kinds is the wrong shape for this: it has to be
     extended every time a challenge is added and nothing fails when it is
     not. Every maxi scene carries `maxi-pre` or `maxi-main` as its step,
     whatever its kind, so the step is what opens the section — and a
     twentieth challenge gets a screen without anybody remembering to. */
  { id: 'dr-maxi', label: 'The Maxi', suffix: 'maxi', phase: 'stage', accent: 'dr-a-score',
    opens: [],
    opensStep: ['maxi-pre', 'maxi-main'],
    badge: { text: 'MAXI', color: '#FF3D9A' }, title: 'The Challenge', subtitle: 'tape rolls' },
  { id: 'dr-elim-day', label: 'Elimination Day', suffix: 'elimday', phase: 'werk', accent: 'dr-a-room',
    opens: ['werk-elim-day'], badge: null, title: 'Elimination Day', subtitle: 'the last hour in the room' },
  { id: 'dr-main-stage', label: 'Main Stage', suffix: 'mainstage', phase: 'stage', accent: 'dr-a-score',
    opens: ['main-stage'], badge: null, title: 'The Main Stage', subtitle: 'the panel takes its seats' },
  { id: 'dr-runway', label: 'Runway', suffix: 'runway', phase: 'stage', accent: 'dr-a-score',
    opens: ['runway'], badge: { text: 'RUNWAY', color: '#FF7BC8' },
    title: 'The Runway', subtitle: 'category is…' },
  { id: 'dr-critiques', label: 'Critiques', suffix: 'critiques', phase: 'stage', accent: 'dr-a-score',
    opens: ['critiques'], badge: null, title: 'The Critiques', subtitle: 'the panel speaks' },
  { id: 'dr-untucked', label: 'Untucked', suffix: 'untucked', phase: 'untucked', accent: 'dr-a-bond',
    opens: ['untucked'], badge: { text: 'UNTUCKED', color: '#7B2FF7' },
    title: 'Untucked', subtitle: 'Illusions Lounge' },
  { id: 'dr-results', label: 'The Call', suffix: 'results', phase: 'stage', accent: 'dr-a-score',
    opens: ['results'], badge: null, title: 'The Call', subtitle: 'who is safe' },
  { id: 'dr-lipsync', label: 'Lip Sync', suffix: 'lipsync', phase: 'lipsync', accent: 'dr-a-lip',
    opens: ['lipsync'], badge: { text: 'LIP SYNC', color: '#FF294B' },
    title: 'Lip Sync For Your Life', subtitle: 'two queens, one song' },
  { id: 'dr-exit', label: 'Sashay', suffix: 'exit', phase: 'lipsync', accent: 'dr-a-lip',
    opens: ['exit'], badge: null,
    title: 'Sashay Away', subtitle: 'the mirror message' },

  /* ── THE SMACKDOWN ──
     Its own screen because it is its own night: a bracket, not a main stage.
     None of its scene kinds matched a section before, so all eight of them
     fell into the cold-open fallback and the episode arrived blank. */
  { id: 'dr-smackdown', label: 'Smackdown', suffix: 'smackdown', phase: 'lipsync', accent: 'dr-a-lip',
    opens: ['smackdown-open', 'smackdown-duel', 'smackdown-crown'],
    badge: { text: 'SMACKDOWN', color: '#FF294B' },
    title: 'The Lip Sync Smackdown', subtitle: 'the queens who already went home' },

  /* ── THE REUNION ──
     Between the last elimination and the crowning, which is where the real
     show's own track record chart puts it. It is the one episode that reads
     the WHOLE season rather than the row in front of it, and every topic on
     it was derived from what actually happened. */
  { id: 'dr-reunion', label: 'The Reunion', suffix: 'reunion', phase: 'untucked', accent: 'dr-a-bond',
    opens: ['reunion-open'], badge: { text: 'REUNITED', color: '#7B2FF7' },
    title: 'The Reunion', subtitle: 'the season, argued about' },

  /* ── THE FINALE, WHICH IS ITS OWN NIGHT ──
     All of this used to fall into `dr-exit` above — the stage opening, every
     duel and the crowning, drawn under a heading that reads "Sashay Away: the
     mirror message". The last night of a season was a footnote to somebody
     leaving. These eight sections follow the order the show runs, and any of
     them whose scenes are absent is skipped by `when` on its own: a bracket
     finale has no cut, so it never draws a cut screen. */
  { id: 'dr-finale-open', label: 'Grand Finale', suffix: 'finopen', phase: 'stage', accent: 'dr-a-score',
    opens: ['finale-open'], badge: { text: 'FINALE', color: '#FFC83D' },
    title: 'Grand Finale', subtitle: 'one of them gets crowned tonight' },
  { id: 'dr-finale-return', label: 'The Cast Returns', suffix: 'finreturn', phase: 'werk', accent: 'dr-a-room',
    opens: ['finale:finale-return'], badge: { text: 'REUNION', color: '#7B2FF7' },
    title: 'The Season Comes Back', subtitle: 'everybody who went home, through that door' },
  { id: 'dr-finale-runway', label: 'Eleganza', suffix: 'finrunway', phase: 'stage', accent: 'dr-a-score',
    opens: ['finale:finale-eleganza'], badge: { text: 'RUNWAY', color: '#FF7BC8' },
    title: 'Grande Finale Eleganza', subtitle: 'the best look she owns' },
  { id: 'dr-finale-interview', label: 'Interviews', suffix: 'fininterview', phase: 'werk', accent: 'dr-a-bond',
    opens: ['finale:finale-interview'], badge: { text: 'ONE ON ONE', color: '#00E5FF' },
    title: 'The Interviews', subtitle: 'why should it be you' },
  { id: 'dr-finale-showcase', label: 'The Showcase', suffix: 'finshowcase', phase: 'stage', accent: 'dr-a-score',
    opens: ['finale:finale-showcase-open'], badge: { text: 'SHOWCASE', color: '#FF3D9A' },
    title: 'The Showcase', subtitle: 'individual show-stopping original numbers' },
  { id: 'dr-finale-cut', label: 'The Cut', suffix: 'fincut', phase: 'stage', accent: 'dr-a-lip',
    opens: ['finale:finale-cut'], badge: { text: 'THE CUT', color: '#FF294B' },
    title: 'The Cut', subtitle: 'the field becomes two' },
  { id: 'dr-finale-lipsync', label: 'For The Crown', suffix: 'fincrownls', phase: 'lipsync', accent: 'dr-a-lip',
    opens: ['finale:finale-crown-lipsync'], badge: { text: 'FOR THE CROWN', color: '#FF294B' },
    title: 'Lip Sync For The Crown', subtitle: 'two queens stand before me' },
  { id: 'dr-finale-crown', label: 'The Crowning', suffix: 'fincrown', phase: 'stage', accent: 'dr-a-score',
    /* `crowning` catches every beat of the new ceremony pool, whose scenes
       all carry that step; the two `finale:` kinds are the older five-line
       version, still drawn while a tier of the new pool is unwritten. */
    opens: ['finale:finale-congeniality', 'finale:finale-runnerup', 'crowning'],
    badge: { text: 'CROWNED', color: '#FFC83D' },
    title: 'The Crowning', subtitle: "America's Next Drag Superstar" },
];

/** The chart is not a section of an episode; it is the season, every episode. */
const CHART = {
  id: 'dr-chart', label: 'Track Record', suffix: 'chart', phase: 'chart',
  badge: { text: 'CHART', color: '#facc15' },
};

/**
 * Every scene, filed under the section it happened in.
 *
 * Returns a Map of section id → scenes. Anything before the first marker goes
 * to the first section rather than being dropped: an episode that opens on a
 * kind nobody has listed is still an episode, and losing its opening scenes
 * silently is the failure this whole file is arranged against.
 */
export function sceneSections(row) {
  const scenes = row?.dr?.scenes || [];
  const openerOf = new Map();
  for (const s of SECTIONS) for (const k of s.opens || []) openerOf.set(k, s.id);
  // A section may also open on a STEP, which is what a screen serving many
  // challenges needs: the kinds differ per challenge and the step does not.
  const openerByStep = new Map();
  for (const s of SECTIONS) for (const k of s.opensStep || []) openerByStep.set(k, s.id);

  const out = new Map(SECTIONS.map(s => [s.id, []]));
  let current = null;
  for (const sc of scenes) {
    // Kind first: it is the more specific claim.
    const opened = openerOf.get(sc.kind) ?? openerByStep.get(sc.step);
    if (opened) current = opened;
    // Before any marker: the first section that this row actually has.
    if (!current) current = SECTIONS.find(s => s.id !== 'dr-arrivals')?.id || SECTIONS[0].id;
    out.get(current).push(sc);
  }
  return out;
}

/** One scene, as a revealable step. */
function step(sc, i, suffix, ep, accent) {
  const players = sc?.data?.players || [];
  const who = players.length
    ? `<span class="dr-who">${players.slice(0, 2).map(n =>
      _portrait(n, ep, { size: 46, station: true })).join('')}</span>` : '';
  /* NO TIER CHIP. `open`, `shaky`, `strong`, `blowout` are the names of
     prose POOLS — an author's filing labels — and they were being printed
     on the card in front of the line they selected, which both leaked the
     internals and told the reader the verdict before the sentence did. The
     same leak was removed from the smackdown's bracket earlier. */
  const tier = '';
  /* ONLY WHEN THE LINE DOES NOT ALREADY SAY IT. Most scene prose opens with
     her name, so prefixing unconditionally produced "Q1 Q1 is the one who
     reads the mirror message out loud" — visible the moment a transcript was
     read, invisible to every assertion. */
  const first = String(players[0] || '');
  const firstSentence = String(sc.text || '').split(/(?<=[.!?])\s/)[0] || '';
  const opensWithName = first && firstSentence.includes(first);
  const name = first && !opensWithName ? `<b class="dr-disp">${esc(first)}</b> ` : '';
  return `<div class="dr-step" id="dr-step-${suffix}-${i}">
    <div class="dr-panel ${accent} dr-scene">
      ${who}<div class="dr-scene-body">${tier}${name}${esc(sc.text || '')}</div>
    </div></div>`;
}

const EXTRA_CSS = `
.dr-scene{display:grid;grid-template-columns:auto 1fr;gap:14px;align-items:start;
  padding:14px 16px 14px 20px}
.dr-scene:not(:has(.dr-who)){grid-template-columns:1fr}
.dr-who{display:flex;gap:7px}
.dr-scene-body{color:#f4e3ed}
/* ══ TWO SETS FOR THE SCREENS WITHOUT THEIR OWN ══ */
.dr-hallwrap{position:relative}
.dr-hall{position:absolute;inset:-24px -18px;z-index:-1;pointer-events:none;overflow:hidden}
.dr-hall i{position:absolute;display:block}
/* THE GALA: the finale's stage, lit from above and gold at the floor. */
.dr-hall-gala{background:radial-gradient(120% 70% at 50% 0%,rgba(255,200,61,.15),transparent 62%)}
.dr-hall-gala .dr-hall-key{top:0;left:50%;width:420px;height:70%;transform:translateX(-50%);
  background:linear-gradient(180deg,rgba(255,233,168,.18),transparent 72%);
  clip-path:polygon(40% 0,60% 0,100% 100%,0 100%)}
.dr-hall-gala .dr-hall-floor{left:0;right:0;bottom:0;height:22%;
  background:linear-gradient(180deg,transparent,rgba(255,200,61,.12));
  border-top:1px solid rgba(255,200,61,.22)}
/* THE SOFA: a reunion is a talk show, so it gets a talk show's key light. */
.dr-hall-sofa{background:radial-gradient(100% 60% at 70% 0%,rgba(123,47,247,.20),transparent 62%)}
.dr-hall-sofa .dr-hall-key{top:6%;right:8%;width:260px;height:260px;border-radius:50%;
  background:radial-gradient(circle,rgba(255,233,168,.16),transparent 66%)}
.dr-hall-sofa .dr-hall-floor{left:6%;right:6%;bottom:8%;height:110px;border-radius:16px 16px 0 0;
  background:linear-gradient(180deg,rgba(123,47,247,.18),rgba(0,0,0,.3));
  border-top:2px solid rgba(255,255,255,.08)}

.dr-waiting{opacity:.5}
.dr-up{font-size:9px;letter-spacing:.16em;text-transform:uppercase;color:#3BE08A}
.dr-duel{display:flex;align-items:center;gap:9px;flex-wrap:wrap;padding:8px 0;
  border-bottom:1px solid rgba(255,255,255,.09)}
.dr-vs{color:#FF294B;font-size:18px}
.dr-duel-song{color:#C9A6BC;margin-left:auto}
.dr-duel-win{color:#FFC83D}
.dr-places{list-style:none;counter-reset:pl;padding:0;margin:0}
.dr-places li{counter-increment:pl;display:flex;align-items:center;gap:9px;padding:5px 0}
.dr-places li::before{content:counter(pl);font-variant-numeric:tabular-nums;
  color:#C9A6BC;min-width:20px}
`;

/**
 * The sidebar: who is still in it, and who has been up so far.
 *
 * THE METER WAS `width:60%`, TYPED. Every queen on every one of these
 * screens carried a bar filled to exactly the same hardcoded fraction, next
 * to her name, on a night whose whole subject is that they are not equal —
 * a reader takes that for a score, because it is drawn where a score goes.
 * It was left as a placeholder with a comment saying the real sidebars come
 * later, and the later never came. A bar that means nothing is worse than
 * no bar, so it is gone.
 *
 * What replaces it is true and is gated: as the steps reveal, the queens who
 * have already been up are ticked. The rail now tells you where you are in
 * the running order, which is the one thing you cannot see from the cards.
 */
function railFor(row, scenes, ep) {
  const living = row?.dr?.living || [];
  if (!living.length) return [];
  const upBy = [];
  const seen = new Set();
  for (const sc of scenes) {
    for (const n of (sc?.data?.players || [])) seen.add(n);
    upBy.push(new Set(seen));
  }
  const panelAt = done => `<h4 class="dr-disp">In the room · ${living.length}</h4>${
    living.map(n => `<div class="dr-slot${done.has(n) ? '' : ' dr-waiting'}">
      ${_portrait(n, ep, { size: 38 })}
      <div><div class="dr-nm">${esc(n)}</div></div>
      <span class="dr-up">${done.has(n) ? 'up' : ''}</span></div>`).join('')}`;
  return scenes.map((_, i) => panelAt(upBy[i] || new Set()));
}

function buildSection(sec, row) {
  const ep = { num: row?.num ?? row?.dr?.ep ?? 0, format: 'drag-race', dr: row?.dr || {} };
  const scenes = sceneSections(row).get(sec.id) || [];
  if (!scenes.length) return '';
  const steps = scenes.map((sc, i) => step(sc, i, sec.suffix, ep, sec.accent)).join('');
  if (typeof window !== 'undefined') {
    if (!window._drSidebar) window._drSidebar = {};
    window._drSidebar[sec.suffix] = railFor(row, scenes, ep);
  }
  const rail = railFor(row, scenes, ep)[0] || '';
  /* THE SEVEN SCREENS NOBODY BUILT A ROOM FOR. Everything without its own
     builder falls here — the reunion and five sections of the finale night —
     and they were drawn on the same gradient as a Tuesday in the werk room.
     They are not a Tuesday. Two sets cover all of them: the finale's big
     stage, gold and lit from above, and the reunion's sofa under a hot
     television key light. Chosen from the section id, so a section added
     later gets one without anybody remembering to. */
  const set = sec.id.startsWith('dr-finale') ? 'gala'
    : sec.id === 'dr-reunion' ? 'sofa' : '';
  const room = set ? `<div class="dr-hall dr-hall-${set}" aria-hidden="true">
      <i class="dr-hall-key"></i><i class="dr-hall-floor"></i></div>` : '';
  return `<style>${EXTRA_CSS}</style>${_shell(
    `<div class="dr-hallwrap">${room}${steps}</div>`, ep, {
      phase: sec.phase, title: sec.title, subtitle: sec.subtitle, sidebar: rail,
    })}${_controls(sec.suffix, scenes.length, ep.num)}`;
}

/* THE SCREENS THAT HAVE THEIR OWN BUILDER. Everything else falls back to the
   generic scene renderer above, which is how a section stays reachable from
   the day the registry lists it — Tasks 6-8 replace the rest the same way. */
const BUILDERS = {
  'dr-arrivals': rpBuildArrivals,
  'dr-cold-open': rpBuildColdOpen,
  'dr-werk-morning': rpBuildWerkMorning,
  'dr-elim-day': rpBuildWerkElimDay,
  'dr-mini': rpBuildMini,
  'dr-announce': rpBuildMaxiAnnounce,
  'dr-choice': rpBuildChoice,
  'dr-prep': rpBuildPrep,
  'dr-maxi': rpBuildMaxi,
  'dr-main-stage': rpBuildMainStage,
  'dr-runway': rpBuildRunway,
  'dr-critiques': rpBuildCritiques,
  'dr-untucked': rpBuildUntucked,
  'dr-results': rpBuildResults,
  'dr-lipsync': rpBuildLipSync,
  'dr-exit': rpBuildExit,
  /* THE CROWNING HAS ITS OWN SCREEN NOW. It used to share rpBuildExit with
     a weekly sashay, which is why the payoff of a whole season arrived as a
     bracket, a list and a portrait with WINNER over it. js/vp-dr/crowning.js
     stages it: a sticky line of lit name plates that goes dark from the
     bottom up as the places are called. */
  'dr-finale-crown': rpBuildCrowning,
  // `finale-open` is a marker with no prose, so the generic renderer drew
  // this screen empty on every finale.
  'dr-finale-open': rpBuildFinaleOpen,
  'dr-smackdown': rpBuildSmackdown,
};

const _sections = SECTIONS.map(sec => ({
    id: sec.id,
    label: sec.label,
    suffix: sec.suffix,
    badge: sec.badge,
    /* SCENES, AND ONLY SCENES. This used to carry `|| (sec.id === 'dr-exit'
       && row.dr.finale)`, which forced the sashay screen onto the finale back
       when the crowning had nowhere else to live. The finale has its own eight
       screens now, and that clause drew "Sashay Away: the mirror message" over
       a night on which nobody sashays and there is no mirror message. */
    when: row => (sceneSections(row).get(sec.id) || []).length > 0,
    build: row => (BUILDERS[sec.id] ? BUILDERS[sec.id](row) : buildSection(sec, row)),
    revealAllName: 'drRevealAll',
  }));

/** The registry: seventeen entries, in the running order. */
export const DRAG_SCREENS = [
  ..._sections,
  {
    id: CHART.id,
    label: CHART.label,
    suffix: CHART.suffix,
    badge: CHART.badge,
    when: row => Object.keys(row?.dr?.record || {}).length > 0,
    build: row => rpBuildChart(row),
    // Its own handlers: this screen steps by EPISODE, not by card.
    revealAllName: 'drChartRevealAll',
  },
];

/** The screens this episode actually has, built in order. */
export function dragScreens(row) {
  return DRAG_SCREENS
    .filter(s => s.when(row))
    .map(s => ({ id: s.id, label: s.label, html: s.build(row) }))
    .filter(s => s.html);
}

/**
 * The same screens, fully revealed, for the transcript.
 *
 * ON A RENUMBERED COPY. Reveal state is keyed by episode number, so building
 * the transcript against the real row would consume the viewer's own reveals
 * — they would come back to an episode already opened. The negative number
 * cannot collide with a real one. This is the Traitors' trick and it is not
 * optional.
 */
export function dragScreensRevealed(row) {
  const shadow = { ...row, num: -Math.abs(row?.num ?? row?.dr?.ep ?? 1) };
  const out = DRAG_SCREENS.filter(s => s.when(shadow)).map(s => {
    const html = s.build(shadow);
    if (!html) return null;
    const total = (sceneSections(shadow).get(s.id) || []).length;
    if (total && typeof window !== 'undefined') _state(shadow, s.suffix).idx = total - 1;
    return { id: s.id, label: s.label, html };
  }).filter(Boolean);
  return out;
}
