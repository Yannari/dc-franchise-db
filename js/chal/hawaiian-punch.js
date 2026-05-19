// js/chal/hawaiian-punch.js — Hawaiian Punch finale VP builders (no simulation)
import { gs, players, seasonConfig } from '../core.js';
import { pStats, pronouns } from '../players.js';
import { getBond } from '../bonds.js';

// ── HELPERS ──
function host() { return seasonConfig?.hostName || 'Chris'; }
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
function portrait(name, size = 42) {
  const slug = players.find(p => p.name === name)?.slug || name.toLowerCase().replace(/\s+/g, '-');
  return `<img src="assets/avatars/${slug}.png" alt="${name}" style="width:${size}px;height:${size}px;border-radius:4px;object-fit:contain;flex-shrink:0" onerror="this.style.display='none'">`;
}
function arch(name) { return players.find(p => p.name === name)?.archetype || ''; }
function pr(name) { return pronouns(name); }

// ══════════════════════════════════════════════════════════════
// REVEAL STATE
// ══════════════════════════════════════════════════════════════
const _tvState = {};
function _ensureState(key, total) {
  if (!_tvState[key]) _tvState[key] = { idx: -1, total };
  return _tvState[key];
}

function _reapplyVisibility(suffix, upToIdx, total) {
  for (let i = 0; i <= upToIdx && i < total; i++) {
    const el = document.getElementById(`hp-step-${suffix}-${i}`);
    if (el) el.classList.add('hp-visible');
  }
  const counter = document.getElementById(`hp-counter-${suffix}`);
  if (counter) counter.textContent = `${Math.min(upToIdx + 1, total)} / ${total}`;
  if (upToIdx >= total - 1) {
    const controls = document.getElementById(`hp-controls-${suffix}`);
    if (controls) {
      const btns = controls.querySelectorAll('.hp-ctrl-btn');
      btns.forEach(b => { b.style.opacity = '0.4'; });
    }
  }
}

export function hpRevealNext(screenKey, totalSteps) {
  const st = _ensureState(screenKey, totalSteps);
  if (st.idx >= st.total - 1) return;
  st.idx++;
  const suffix = screenKey.replace('hp-', '');
  _reapplyVisibility(suffix, st.idx, st.total);
  const el = document.getElementById(`hp-step-${suffix}-${st.idx}`);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

export function hpRevealAll(screenKey, totalSteps) {
  const st = _ensureState(screenKey, totalSteps);
  st.idx = st.total - 1;
  const suffix = screenKey.replace('hp-', '');
  _reapplyVisibility(suffix, st.idx, st.total);
}

// ══════════════════════════════════════════════════════════════
// CSS ICON SYSTEM
// ══════════════════════════════════════════════════════════════
function _icon(type) {
  const defs = {
    fire: `background:var(--hp-red);clip-path:polygon(40% 100%,0% 55%,20% 30%,35% 50%,50% 0%,65% 50%,80% 30%,100% 55%,60% 100%)`,
    volcano: `background:var(--hp-orange);clip-path:polygon(50% 0%,15% 100%,85% 100%)`,
    lava: `background:linear-gradient(180deg,var(--hp-red),var(--hp-orange));clip-path:polygon(0% 0%,100% 0%,100% 60%,80% 80%,60% 65%,40% 85%,20% 70%,0% 80%)`,
    sword: `background:var(--hp-bone);clip-path:polygon(45% 0%,55% 0%,55% 60%,70% 65%,70% 75%,55% 70%,55% 85%,65% 90%,65% 100%,35% 100%,35% 90%,45% 85%,45% 70%,30% 75%,30% 65%,45% 60%)`,
    shield: `background:var(--hp-gold);clip-path:polygon(50% 100%,5% 30%,5% 0%,95% 0%,95% 30%)`,
    shark: `background:var(--hp-teal);clip-path:polygon(0% 50%,30% 30%,50% 0%,50% 30%,100% 40%,100% 60%,50% 70%,50% 100%,30% 70%)`,
    tiki: `background:var(--hp-orange);clip-path:polygon(30% 0%,70% 0%,75% 15%,65% 20%,70% 35%,60% 40%,65% 55%,55% 60%,60% 75%,55% 100%,45% 100%,40% 75%,35% 60%,45% 55%,40% 40%,30% 35%,35% 20%,25% 15%)`,
    palm: `background:var(--hp-green);clip-path:polygon(45% 100%,55% 100%,55% 55%,90% 20%,85% 15%,55% 45%,55% 40%,80% 5%,72% 2%,50% 35%,30% 0%,22% 5%,45% 40%,45% 45%,15% 15%,10% 20%,45% 55%)`,
    crown: `background:var(--hp-gold);clip-path:polygon(0% 100%,0% 40%,20% 60%,35% 20%,50% 50%,65% 20%,80% 60%,100% 40%,100% 100%)`,
    skull: `background:var(--hp-bone);clip-path:polygon(20% 100%,20% 75%,5% 60%,0% 40%,5% 20%,20% 5%,40% 0%,60% 0%,80% 5%,95% 20%,100% 40%,95% 60%,80% 75%,80% 100%,65% 90%,50% 100%,35% 90%)`,
    wave: `background:var(--hp-teal);clip-path:polygon(0% 60%,10% 40%,25% 55%,40% 35%,55% 55%,70% 35%,85% 55%,100% 40%,100% 100%,0% 100%)`,
    rope: `background:var(--hp-bone);clip-path:polygon(0% 40%,15% 35%,30% 45%,45% 35%,60% 45%,75% 35%,90% 45%,100% 40%,100% 60%,90% 55%,75% 65%,60% 55%,45% 65%,30% 55%,15% 65%,0% 60%)`,
    dummy: `background:var(--hp-orange);clip-path:polygon(35% 0%,65% 0%,60% 20%,70% 25%,65% 35%,55% 30%,55% 50%,75% 65%,70% 70%,55% 55%,55% 75%,65% 100%,55% 100%,50% 80%,45% 100%,35% 100%,45% 75%,45% 55%,30% 70%,25% 65%,45% 50%,45% 30%,35% 35%,30% 25%,40% 20%)`,
    trap: `background:var(--hp-red);clip-path:polygon(10% 50%,0% 40%,20% 30%,10% 20%,30% 15%,25% 5%,50% 0%,75% 5%,70% 15%,90% 20%,80% 30%,100% 40%,90% 50%,100% 60%,80% 65%,85% 80%,65% 75%,60% 100%,40% 100%,35% 75%,15% 80%,20% 65%,0% 60%)`,
    star: `background:var(--hp-gold);clip-path:polygon(50% 0%,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)`,
    heart: `background:var(--hp-pink);clip-path:polygon(50% 100%,0% 35%,0% 15%,15% 0%,35% 0%,50% 20%,65% 0%,85% 0%,100% 15%,100% 35%)`,
    bolt: `background:var(--hp-gold);clip-path:polygon(60% 0%,25% 45%,50% 45%,35% 100%,80% 50%,55% 50%)`,
    mountain: `background:var(--hp-charcoal);clip-path:polygon(50% 0%,0% 100%,100% 100%)`,
    fist: `background:var(--hp-orange);clip-path:polygon(25% 100%,20% 60%,10% 55%,10% 35%,20% 30%,20% 20%,30% 15%,35% 20%,35% 15%,45% 10%,50% 15%,55% 10%,65% 15%,65% 20%,75% 25%,80% 40%,75% 55%,65% 60%,60% 100%)`,
    pineapple: `background:var(--hp-gold);clip-path:polygon(35% 40%,25% 45%,20% 60%,25% 80%,35% 95%,50% 100%,65% 95%,75% 80%,80% 60%,75% 45%,65% 40%,70% 30%,60% 15%,65% 5%,55% 0%,50% 10%,45% 0%,35% 5%,40% 15%,30% 30%)`,
    megaphone: `background:var(--hp-gold);clip-path:polygon(0% 35%,0% 65%,30% 65%,100% 100%,100% 0%,30% 35%)`,
    eye: `background:var(--hp-teal);clip-path:polygon(0% 50%,15% 25%,35% 10%,50% 5%,65% 10%,85% 25%,100% 50%,85% 75%,65% 90%,50% 95%,35% 90%,15% 75%)`,
  };
  const d = defs[type] || defs.fire;
  return `<span class="hp-icon" style="${d}"></span>`;
}

// ══════════════════════════════════════════════════════════════
// NARRATION POOLS
// ══════════════════════════════════════════════════════════════
const TIKI_FLAVOR = [
  'The torches flicker in the salt wind.',
  'Drums echo from the volcano peak.',
  'Smoke curls from the crater above.',
  'The tide pulls back, revealing black sand.',
  'A conch horn sounds in the distance.',
  'Fireflies trace paths through the palms.',
  'The volcano rumbles. The island listens.',
  'Hot stone hisses where lava meets sea.',
  'The moon hangs low over the caldera.',
  'Palm fronds snap in the rising heat.',
];

const JOUST_HIT = [
  (a, b) => `${a} cracks ${b} square in the chest. The platform shakes.`,
  (a, b) => `A vicious swing from ${a} catches ${b} off-guard. The crowd gasps.`,
  (a, b) => `${a} feints left, strikes right. ${b} barely keeps ${pr(b).posAdj} footing.`,
  (a, b) => `${a}'s staff connects with ${b}'s shoulder. CRACK. That one echoed.`,
  (a, b) => `${a} drives forward with a two-handed thrust. ${b} staggers back.`,
  (a, b) => `Pure aggression from ${a}. ${b} has to grip the edge to stay up.`,
];

const JOUST_RALLY = [
  n => `${n} plants ${pr(n).posAdj} feet and ROARS. Something just clicked.`,
  n => `${n} wipes blood from ${pr(n).posAdj} lip and grins. "${pr(n).Sub}'s not done."`,
  n => `The crowd starts chanting ${n}'s name. ${pr(n).Sub} feeds off it.`,
  n => `${n} catches the staff mid-swing and THROWS IT BACK. Pure instinct.`,
];

const JOUST_SUDDEN = [
  (a, b) => `Tied at the brink. One final exchange. The torches burn higher.`,
  (a, b) => `Everything rides on this. ${a} and ${b} circle each other, staffs raised.`,
  (a, b) => `The drums stop. The wind dies. ${a} and ${b} lock eyes. Last round.`,
];

const SHARK_BEAT = [
  n => `A fin circles below. ${n} pretends not to notice.`,
  n => `Something bumps the platform from underneath. ${n}'s eyes go wide.`,
  n => `The water churns. A shadow passes beneath ${n}'s feet.`,
  n => `A dorsal fin slices past. ${n} edges toward the center of the platform.`,
];

const CROWD_ROAR = [
  (c, t, cheer) => cheer
    ? `${c} screams from the shore: "COME ON, ${t.toUpperCase()}! YOU GOT THIS!"`
    : `${c} cups ${pr(c).posAdj} hands: "FINISH ${pr(t).obj.toUpperCase()}!"`,
  (c, t, cheer) => cheer
    ? `${c} is on ${pr(c).posAdj} feet, fists pumping. All in on ${t}.`
    : `${c} watches through ${pr(c).posAdj} fingers. "${t} is done."`,
  (c, t, cheer) => cheer
    ? `${c} starts a chant. "LET'S GO ${t.toUpperCase()}!" Others join in.`
    : `${c} shakes ${pr(c).posAdj} head. "Saw this coming a mile away."`,
  (c, t, cheer) => cheer
    ? `${c} bangs two coconuts together. The rhythm catches on.`
    : `${c} turns to the person next to ${pr(c).obj}. "It's over."`,
];

const BUILD_NARR = [
  (n, s) => s > 5 ? `${n} works with surgical precision, lashing the dummy frame tight.` : `${n} fumbles with the binding. The dummy's arm falls off. Again.`,
  (n, s) => s > 5 ? `${n}'s dummy is taking shape fast. ${pr(n).Sub} clearly had a plan.` : `${n} stares at the materials like they're written in another language.`,
  (n, s) => s > 5 ? `Methodical. Focused. ${n}'s dummy looks almost lifelike.` : `${n}'s dummy looks like it was assembled during an earthquake.`,
  (n, s) => s > 5 ? `${n} steps back and nods. The structure is solid.` : `The head keeps rolling off. ${n} ties it on with vines. Barely holds.`,
];

const UPHILL_NARR = [
  (n, s) => s > 5 ? `${n} powers up the slope, legs churning, dummy bouncing in the wheelbarrow.` : `${n} slips on loose gravel. The wheelbarrow tips. The dummy tumbles.`,
  (n, s) => s > 5 ? `${n} finds the rhythm, each stride eating up the incline.` : `${n}'s wheelbarrow catches a root. The dummy does a full somersault.`,
  (n, s) => s > 5 ? `Pure determination from ${n}. The volcano trail doesn't slow ${pr(n).obj} down.` : `${n} has to stop and rebuild the dummy. It fell apart on a bump.`,
  (n, s) => s > 5 ? `${n} looks back. The other racer is falling behind. ${pr(n).Sub} pushes harder.` : `Sweat pours. Legs burn. ${n} is crawling up this thing.`,
];

const LAVA_NARR = [
  (n, s) => s > 5 ? `${n} reads the rope lines and picks a path through the lava field.` : `${n} grabs a rope and immediately regrets it. The heat is unreal.`,
  (n, s) => s > 5 ? `${n} swings across the lava flow with one hand on the rope, dummy in the other.` : `${n}'s dummy catches fire. ${pr(n).Sub} pats it out. Most of it.`,
  (n, s) => s > 5 ? `Calculated swings. ${n} clears the crossing without breaking stride.` : `The rope frays. ${n} scrambles to reach the far ledge before it snaps.`,
  (n, s) => s > 5 ? `${n} picks the safest crossing and lands clean on the far side.` : `${n} dandles over the lava river for a terrifying three seconds.`,
];

const SUMMIT_ARRIVE = [
  (l, t) => `${l} reaches the summit first. ${t} is close behind, gasping for air.`,
  (l, t) => `${l} crests the ridge. Below, the crater glows. ${t} scrambles up seconds later.`,
  (l, t) => `Both racers reach the caldera rim. ${l} arrived first. ${t} is right there.`,
  (l, t) => `${l} plants ${pr(l).posAdj} dummy at the crater's edge. ${t} staggers up behind.`,
];

const MIND_GAME_ATK = [
  (t, l, type) => type === 'taunt' ? `${t} gets in ${l}'s face. "You don't deserve to be here."` : `${t} lunges at ${l}'s dummy, trying to knock it into the crater first.`,
  (t, l, type) => type === 'taunt' ? `${t}: "Nobody's rooting for you. Look around."` : `${t} shoulder-checks ${l} as ${pr(t).sub} passes. Deliberate.`,
  (t, l, type) => type === 'taunt' ? `${t} laughs. "You peaked three episodes ago, ${l}."` : `${t} grabs ${l}'s wheelbarrow handle. A split-second of chaos.`,
  (t, l, type) => type === 'taunt' ? `${t} locks eyes with ${l}. "I've been carrying you all season."` : `${t} kicks volcanic rock toward ${l}'s path. Subtle. Effective.`,
];

const MIND_GAME_DEF = [
  (l, t) => `${l} doesn't even flinch. "Save it for tribal."`,
  (l, t) => `${l} ignores ${t} completely. Focus unbroken.`,
  (l, t) => `${l} side-steps and keeps moving. "Nice try."`,
  (l, t) => `${l} smirks. "That all you got?" The crowd roars.`,
];

const MIND_GAME_FAIL = [
  (l, t) => `${l} stumbles. ${t}'s words got under ${pr(l).posAdj} skin.`,
  (l, t) => `${l} hesitates for a crucial second. ${t} closes the gap.`,
  (l, t) => `${l}'s focus cracks. The dummy wobbles in ${pr(l).posAdj} grip.`,
  (l, t) => `${l} whips around to respond and almost drops the dummy. Rookie mistake.`,
];

const DUMMY_THROW = [
  (n, w) => w ? `${n} HURLS the dummy into the crater! It catches fire mid-air. The volcano ERUPTS!` : `${n} heaves the dummy toward the crater. It tumbles in. The volcano glows.`,
  (n, w) => w ? `${n} launches the dummy with everything ${pr(n).sub} has left. The volcano SWALLOWS it. BOOM!` : `${n} pushes the dummy over the rim. It slides down into the lava below.`,
  (n, w) => w ? `With a scream that echoes off the caldera walls, ${n} sends the dummy flying. THE VOLCANO ANSWERS.` : `${n}'s dummy topples into the crater. The glow intensifies. It's done.`,
  (n, w) => w ? `${n} grabs the dummy with both hands and THROWS. The island shakes. ${host()}: "WE HAVE A WINNER!"` : `The dummy disappears into the crater. ${n} collapses to ${pr(n).posAdj} knees.`,
];

const ERUPTION_TEXT = [
  `The volcano ERUPTS! Lava fountains light up the sky! The entire island shakes!`,
  `KABOOM! The crater explodes in a column of fire and smoke! The cast screams!`,
  `The volcano blows its top! Hot rocks rain down! The cameras barely survive!`,
  `A blast of heat. A roar from the earth itself. The volcano erupts on cue!`,
];

const FERAL_CAMEO = [
  n => `Wait-- is that ${n}?! Living in the volcano?! ${pr(n).Sub} emerges from behind a rock, completely feral, wearing a coconut shell.`,
  n => `${n} pops out of a volcanic vent like a prairie dog. ${pr(n).Sub}'s been living up here since ${pr(n).posAdj} elimination. Nobody knew.`,
  n => `A figure emerges from the smoke: ${n}, sunburned, wild-eyed, holding a sharpened stick. "THIS IS MY MOUNTAIN NOW."`,
  n => `${host()} squints. "Is that... ${n}?" Indeed it is. ${pr(n).Sub} built a shelter IN the volcano. ${pr(n).Sub} looks... okay, actually.`,
];

const SABOTAGE_EVENT = [
  (who, target) => `${who} "accidentally" kicks ${target}'s supplies into the dirt. Oops.`,
  (who, target) => `${who} swaps ${target}'s binding rope with a frayed one. ${target} doesn't notice.`,
  (who, target) => `${who} hides one of ${target}'s dummy limbs under a rock. Innocent face.`,
  (who, target) => `${who} bumps ${target}'s workstation. Materials scatter. "My bad!"`,
];

const ASSISTANT_CHEM = [
  (helper, finalist) => `${helper} and ${finalist} work together like a well-oiled machine. Years of trust.`,
  (helper, finalist) => `${helper} knows exactly what ${finalist} needs before ${pr(finalist).sub} asks. Bond: strong.`,
  (helper, finalist) => `${helper} hands ${finalist} the next piece without being asked. They're in sync.`,
  (helper, finalist) => `"Remember episode three?" ${helper} grins. ${finalist} nods. They have a plan.`,
];

const STUMBLE_EVENT = [
  n => `${n} hits a root and goes DOWN. The wheelbarrow flips. The dummy goes flying.`,
  n => `${n}'s foot catches a loose stone. A spectacular wipeout on the volcano trail.`,
  n => `${n} loses grip on the wheelbarrow handle. It rolls backward. ${pr(n).Sub} chases it.`,
  n => `${n} slips on volcanic ash. Knees hit the ground. The dummy bounces out.`,
];

const SHORTCUT_EVENT = [
  n => `${n} spots a narrow goat trail cutting uphill. Risky, but faster. ${pr(n).Sub} takes it.`,
  n => `${n} veers off the main path. There's a gap in the rocks. ${pr(n).Sub} squeezes through.`,
  n => `${n} finds a dry stream bed that runs straight up. ${pr(n).Sub} gambles on it. It pays off.`,
  n => `${n} remembers the trail from earlier and cuts through the underbrush. Smart move.`,
];

const BENCH_HELP_EVENT = [
  (helper, finalist) => `${helper} shouts directions from the sideline: "GO LEFT! LEFT!" ${finalist} listens.`,
  (helper, finalist) => `${helper} tosses a water bottle to ${finalist} at the checkpoint. "KEEP GOING!"`,
  (helper, finalist) => `${helper} runs alongside the trail, pointing out the best footholds.`,
  (helper, finalist) => `${helper} starts a chant. The whole bench joins in. ${finalist} finds another gear.`,
];

const BENCH_SABOTAGE_EVENT = [
  (sab, finalist) => `${sab} points ${finalist} toward the wrong trail. "That way!" It's a dead end.`,
  (sab, finalist) => `${sab} throws coconuts onto the path ahead of ${finalist}. "Oops! Wind!"`,
  (sab, finalist) => `${sab} shouts contradictory directions. ${finalist} hesitates. Precious seconds lost.`,
  (sab, finalist) => `${sab} "accidentally" trips into ${finalist}'s path. "Sorry! Slippery out here!"`,
];

const DISTRACTION_EVENT = [
  (n, src) => `A burst of steam from the vent blinds ${n} for a moment. ${pr(n).Sub} gropes forward.`,
  (n, src) => `Falling rocks force ${n} to dodge sideways. The rope swings wildly.`,
  (n, src) => `The heat intensifies. ${n}'s grip weakens. The dummy slips.`,
  (n, src) => `A gust of volcanic gas stings ${n}'s eyes. ${pr(n).Sub} squints through the haze.`,
];

const COUNTER_BLOCK = [
  n => `${n} braces against the rope cut. The line holds. Barely.`,
  n => `${n} swings to a backup rope just in time. The cut one snaps behind ${pr(n).obj}.`,
  n => `${n} grabs the fraying rope with both hands and holds on through sheer will.`,
  n => `${n} sees the trap and avoids it. "Not today."`,
];

const DUMMY_INSULT = [
  (n, rival) => `${n} looks at ${rival}'s dummy and laughs. "Is that supposed to be a PERSON?"`,
  (n, rival) => `${n}: "My dummy has more personality than ${rival}'s. And mine doesn't have a face."`,
  (n, rival) => `${n} glances at ${rival}'s dummy. "Looks like ${rival} built it in the dark." ${pr(n).Sub} did.`,
  (n, rival) => `${n} points at ${rival}'s creation. "That's not a dummy. That's an abstract sculpture."`,
];

const BENCH_RALLY = [
  (bench, finalist) => `The bench squad erupts! "${finalist.toUpperCase()}! ${finalist.toUpperCase()}!" The energy is electric.`,
  (bench, finalist) => `${bench[0] || 'The crowd'} leads the chant. Every voice on the beach joins in for ${finalist}.`,
  (bench, finalist) => `${finalist}'s supporters stomp their feet. The ground itself seems to pulse with their support.`,
  (bench, finalist) => `"WE BELIEVE!" the bench roars. ${finalist} hears it. ${pr(finalist).Sub} pushes harder.`,
];

// ══════════════════════════════════════════════════════════════
// STAT DISPLAY HELPERS
// ══════════════════════════════════════════════════════════════
const STAT_DISPLAY = [
  { key: 'social', label: 'CHARM', color: 'var(--hp-coral)' },
  { key: 'physical', label: 'STRENGTH', color: 'var(--hp-magenta)' },
  { key: 'strategic', label: 'STRATEGY', color: 'var(--hp-teal)' },
  { key: 'mental', label: 'RESOLVE', color: 'var(--hp-gold)' },
];

function _statBars(name) {
  const s = pStats(name);
  return STAT_DISPLAY.map(sd => {
    const val = s[sd.key] || 5;
    const pct = Math.min(100, Math.max(5, val * 10));
    return `<div class="hp-stat-row">
      <span class="hp-stat-label">${sd.label}</span>
      <div class="hp-stat-track"><div class="hp-stat-fill" style="width:${pct}%;background:${sd.color}"></div></div>
      <span class="hp-stat-val" style="color:${sd.color}">${val}</span>
    </div>`;
  }).join('');
}

function _finalistCard(name, extra = '') {
  const a = arch(name);
  const descriptors = {
    mastermind: 'The Puppet Master', schemer: 'The Backstabber', hothead: 'The Powder Keg',
    'challenge-beast': 'The Machine', 'social-butterfly': 'The Diplomat', 'loyal-soldier': 'The Shield',
    wildcard: 'The Unpredictable', 'chaos-agent': 'The Anarchist', floater: 'The Ghost',
    underdog: 'The Long Shot', hero: 'The Champion', villain: 'The Menace',
    goat: 'The Passenger', 'perceptive-player': 'The Observer', showmancer: 'The Heartbreaker',
  };
  const desc = descriptors[a] || 'Competitor';
  return `<div class="hp-finalist-card">
    <div class="hp-finalist-avatar">${portrait(name, 60)}</div>
    <div class="hp-finalist-name">${name.toUpperCase()}</div>
    <div class="hp-finalist-arch">${a.replace(/-/g, ' ').toUpperCase()} ${_icon('fire')}</div>
    <div class="hp-finalist-desc">${desc}</div>
    ${_statBars(name)}
    ${extra}
  </div>`;
}

function _avatarRing(name, size = 42, color = 'var(--hp-orange)') {
  return `<div class="hp-av-ring" style="--ring-color:${color}">
    ${portrait(name, size)}
  </div>`;
}

// ══════════════════════════════════════════════════════════════
// CONTROLS BUILDER
// ══════════════════════════════════════════════════════════════
function _controls(screenKey, totalSteps) {
  const suffix = screenKey.replace('hp-', '');
  return `<div class="hp-controls" id="hp-controls-${suffix}">
    <button class="hp-ctrl-btn" onclick="hpRevealNext('${screenKey}',${totalSteps})">
      ${_icon('fire')} NEXT
    </button>
    <span class="hp-counter" id="hp-counter-${suffix}">0 / ${totalSteps}</span>
    <button class="hp-ctrl-btn hp-ctrl-all" onclick="hpRevealAll('${screenKey}',${totalSteps})">
      ALL ${_icon('volcano')}
    </button>
  </div>`;
}

// ══════════════════════════════════════════════════════════════
// SHELL WRAPPER
// ══════════════════════════════════════════════════════════════
function _hpShell(content, ep, activeTab = 'title') {
  const tabs = [
    { id: 'title', label: '00 TITLE' },
    { id: 'tiebreaker', label: '01 TIEBREAKER' },
    { id: 'joust', label: '02 JOUST' },
    { id: 'volcano', label: '03 VOLCANO RACE' },
    { id: 'summit', label: '04 SUMMIT' },
    { id: 'endings', label: '05 ENDINGS' },
  ];

  const tabHtml = tabs.map(t =>
    `<span class="hp-tab ${t.id === activeTab ? 'hp-tab-active' : ''}">${t.label}</span>`
  ).join('');

  // Generate deterministic ember positions
  const embers = Array.from({ length: 14 }, (_, i) => {
    const left = 5 + ((i * 23 + 7) % 85);
    const size = 2 + (i % 3);
    const dur = 4 + (i % 5);
    const delay = (i * 0.6) % 4;
    const drift = -15 + ((i * 11) % 30);
    return `<div class="hp-ember" style="left:${left}%;width:${size}px;height:${size}px;--dur:${dur}s;--delay:${delay}s;--drift:${drift}px"></div>`;
  }).join('');

  const tickerLines = [
    `HAWAIIAN PUNCH FINALE ${_icon('fire')} LIVE FROM THE VOLCANO`,
    `${host().toUpperCase()} PRESENTS THE ULTIMATE SHOWDOWN`,
    `WHO WILL CLAIM THE MILLION? ${_icon('star')}`,
    `TIKI TORCHES LIT ${_icon('tiki')} THE ISLAND AWAITS`,
  ];
  const ticker = tickerLines.join('  ///  ');

  return `
<div class="hp-shell" data-tab="${activeTab}">
<style>
@import url('https://fonts.googleapis.com/css2?family=Permanent+Marker&family=Russo+One&family=Special+Elite&display=swap');

.hp-shell{--hp-bg:#0a1929;--hp-card:rgba(20,40,65,0.85);--hp-red:#c41e1e;--hp-orange:#ff5a1f;--hp-gold:#ffd166;--hp-bone:#fbf6e7;--hp-teal:#1a8a7d;--hp-pink:#e8457a;--hp-coral:#e8740c;--hp-magenta:#c41e6e;--hp-green:#2d8a4e;--hp-charcoal:#1e293b;--hp-deep:#0f1b2d;max-width:1100px;margin:0 auto;font-family:'Russo One',sans-serif;color:var(--hp-bone);position:relative;background:var(--hp-bg);border-radius:12px;overflow:hidden;min-height:500px;}
.hp-shell *{box-sizing:border-box;}

/* ── Top bar ── */
.hp-topbar{display:flex;align-items:center;padding:6px 14px;background:linear-gradient(90deg,rgba(0,0,0,0.95),rgba(10,25,41,0.95));border-bottom:2px solid rgba(255,90,31,0.3);gap:10px;position:relative;z-index:10;}
.hp-live{display:flex;align-items:center;gap:4px;font-size:10px;letter-spacing:2px;font-weight:700;text-transform:uppercase;}
.hp-live-dot{width:7px;height:7px;background:#22c55e;border-radius:50%;animation:hp-blink 1s infinite;}
.hp-live-label{color:#22c55e;}
@keyframes hp-blink{0%,100%{opacity:1}50%{opacity:.2}}
.hp-finale-badge{padding:2px 10px;border:1px solid var(--hp-gold);border-radius:3px;font-size:9px;letter-spacing:3px;color:var(--hp-gold);text-transform:uppercase;}
.hp-ticker{flex:1;overflow:hidden;height:16px;position:relative;}
.hp-ticker-text{position:absolute;white-space:nowrap;animation:hp-scroll 30s linear infinite;font-size:10px;color:var(--hp-gold);letter-spacing:1px;opacity:0.6;}
@keyframes hp-scroll{0%{transform:translateX(100%)}100%{transform:translateX(-100%)}}
.hp-channel{font-family:'Permanent Marker',cursive;color:var(--hp-orange);font-size:13px;letter-spacing:2px;}

/* ── Tab nav ── */
.hp-tabs{display:flex;gap:4px;padding:8px 14px;background:rgba(0,0,0,0.4);border-bottom:1px solid rgba(255,90,31,0.1);flex-wrap:wrap;}
.hp-tab{padding:3px 10px;border-radius:12px;font-size:9px;letter-spacing:1px;color:rgba(251,246,231,0.4);cursor:default;text-transform:uppercase;}
.hp-tab-active{background:var(--hp-red);color:var(--hp-bone);box-shadow:0 0 8px rgba(196,30,30,0.4);}

/* ── Moon ── */
.hp-moon{position:absolute;top:60px;right:20px;width:60px;height:60px;background:radial-gradient(circle at 40% 35%,#f0d68c,#d4a853);border-radius:50%;opacity:0.3;z-index:1;box-shadow:0 0 30px rgba(240,214,140,0.15);}

/* ── Embers ── */
.hp-embers{position:absolute;top:0;left:0;right:0;bottom:0;pointer-events:none;overflow:hidden;z-index:0;}
.hp-ember{position:absolute;bottom:-10px;background:var(--hp-orange);border-radius:50%;opacity:0;animation:hp-rise var(--dur,4s) var(--delay,0s) infinite;}
@keyframes hp-rise{0%{opacity:0;transform:translateY(0) translateX(0)}10%{opacity:0.8}50%{opacity:0.5;transform:translateY(-300px) translateX(var(--drift,0px))}100%{opacity:0;transform:translateY(-600px) translateX(calc(var(--drift,0px) * 2))}}
@media(prefers-reduced-motion:reduce){
  .hp-ember{animation:none !important;display:none;}
  .hp-live-dot{animation:none !important;opacity:1;}
  .hp-ticker-text{animation:none !important;position:static;white-space:normal;}
  .hp-lava-glow{animation:none !important;}
  .hp-card{animation:none !important;opacity:1;transform:none !important;}
  .hp-shake{animation:none !important;}
  .hp-erupt-flash{animation:none !important;}
}

/* ── Content area ── */
.hp-content{position:relative;z-index:2;padding:16px 20px 80px;}

/* ── Icons ── */
.hp-icon{display:inline-block;width:14px;height:14px;vertical-align:middle;flex-shrink:0;}

/* ── Cards ── */
.hp-card{background:var(--hp-card);border:1px solid rgba(255,90,31,0.2);border-radius:8px;padding:12px 14px;margin:8px 0;position:relative;overflow:hidden;animation:hp-card-in .5s cubic-bezier(.34,1.56,.64,1) forwards;}
@keyframes hp-card-in{0%{opacity:0;transform:translateY(25px) scale(.97)}60%{opacity:1;transform:translateY(-3px) scale(1.01)}100%{opacity:1;transform:translateY(0) scale(1)}}
.hp-card::before{content:'';position:absolute;top:0;left:0;width:4px;height:100%;}
.hp-card.hp-combat::before{background:var(--hp-red);}
.hp-card.hp-social::before{background:var(--hp-teal);}
.hp-card.hp-event::before{background:var(--hp-orange);}
.hp-card.hp-danger::before{background:var(--hp-magenta);}
.hp-card.hp-victory::before{background:var(--hp-gold);}
.hp-card.hp-rally::before{background:var(--hp-green);}
.hp-card-header{display:flex;align-items:center;gap:8px;margin-bottom:4px;}
.hp-card-label{font-size:8px;text-transform:uppercase;letter-spacing:2px;color:rgba(251,246,231,0.4);}
.hp-card-score{margin-left:auto;font-family:'Permanent Marker',cursive;font-size:18px;color:var(--hp-gold);text-shadow:0 0 8px rgba(255,209,102,0.3);}
.hp-card-text{font-size:12px;color:rgba(251,246,231,0.85);line-height:1.6;}
.hp-card-text strong{color:var(--hp-gold);}

/* ── Social cards ── */
.hp-social-card{background:rgba(26,138,125,0.08);border:1px dashed rgba(26,138,125,0.3);border-radius:8px;padding:10px 14px;margin:6px 0;position:relative;animation:hp-card-in .5s cubic-bezier(.34,1.56,.64,1) forwards;}
.hp-social-card::before{content:'';position:absolute;top:0;left:0;width:4px;height:100%;background:var(--hp-teal);}
.hp-social-header{display:flex;align-items:center;gap:6px;margin-bottom:3px;}
.hp-social-label{font-size:8px;letter-spacing:2px;color:var(--hp-teal);text-transform:uppercase;}

/* ── Finalist cards ── */
.hp-finalist-card{background:var(--hp-card);border:1px solid rgba(255,90,31,0.25);border-radius:10px;padding:16px;text-align:center;width:220px;flex-shrink:0;}
.hp-finalist-avatar{margin:0 auto 8px;}
.hp-finalist-avatar img{width:60px;height:60px;border-radius:50%;border:3px solid var(--hp-orange);object-fit:contain;}
.hp-finalist-name{font-family:'Permanent Marker',cursive;font-size:16px;letter-spacing:2px;color:var(--hp-bone);margin-bottom:2px;}
.hp-finalist-arch{font-size:8px;letter-spacing:2px;color:var(--hp-orange);text-transform:uppercase;display:flex;align-items:center;justify-content:center;gap:4px;}
.hp-finalist-desc{font-family:'Special Elite',cursive;font-size:11px;color:rgba(251,246,231,0.5);margin:4px 0 10px;font-style:italic;}
.hp-stat-row{display:flex;align-items:center;gap:6px;margin:3px 0;}
.hp-stat-label{font-size:8px;letter-spacing:1px;width:65px;text-align:right;color:rgba(251,246,231,0.5);}
.hp-stat-track{flex:1;height:6px;background:rgba(255,255,255,0.08);border-radius:3px;overflow:hidden;}
.hp-stat-fill{height:100%;border-radius:3px;transition:width 0.6s ease;}
.hp-stat-val{font-size:10px;width:18px;text-align:left;}

/* ── Avatar ring ── */
.hp-av-ring{display:inline-flex;align-items:center;justify-content:center;border-radius:50%;padding:3px;border:2px solid var(--ring-color,var(--hp-orange));box-shadow:0 0 8px color-mix(in srgb,var(--ring-color,var(--hp-orange)) 40%,transparent);}
.hp-av-ring img{border-radius:50%;object-fit:contain;}

/* ── Reveal step ── */
.hp-step{display:none;}
.hp-step.hp-visible{display:block;}

/* ── Flavor text ── */
.hp-flavor{text-align:center;font-family:'Special Elite',cursive;font-size:11px;color:rgba(255,90,31,0.35);letter-spacing:2px;padding:4px 0;font-style:italic;}

/* ── Section header ── */
.hp-section{font-family:'Permanent Marker',cursive;font-size:20px;color:var(--hp-orange);letter-spacing:2px;padding:16px 0 8px;border-bottom:1px solid rgba(255,90,31,0.15);margin-bottom:8px;display:flex;align-items:center;gap:8px;}

/* ── Phase header ── */
.hp-phase{font-family:'Permanent Marker',cursive;font-size:15px;color:var(--hp-gold);letter-spacing:1px;padding:10px 0 6px;display:flex;align-items:center;gap:6px;}

/* ── Status pills ── */
.hp-pill{display:inline-block;padding:2px 8px;border-radius:3px;font-size:9px;font-weight:700;letter-spacing:1px;text-transform:uppercase;}
.hp-pill-danger{background:rgba(196,30,30,0.2);color:#ef4444;border:1px solid rgba(196,30,30,0.3);}
.hp-pill-warn{background:rgba(255,90,31,0.15);color:var(--hp-orange);border:1px solid rgba(255,90,31,0.3);}
.hp-pill-ok{background:rgba(45,138,78,0.15);color:#22c55e;border:1px solid rgba(45,138,78,0.3);}
.hp-pill-info{background:rgba(26,138,125,0.15);color:var(--hp-teal);border:1px solid rgba(26,138,125,0.3);}
.hp-pill-gold{background:rgba(255,209,102,0.15);color:var(--hp-gold);border:1px solid rgba(255,209,102,0.3);}

/* ── Versus ── */
.hp-vs{display:flex;align-items:center;justify-content:center;gap:16px;margin:12px 0;}
.hp-vs-name{font-family:'Permanent Marker',cursive;font-size:14px;letter-spacing:1px;}
.hp-vs-divider{font-family:'Permanent Marker',cursive;font-size:22px;color:var(--hp-red);text-shadow:0 0 12px rgba(196,30,30,0.4);}

/* ── Controls ── */
.hp-controls{position:fixed;bottom:0;left:50%;transform:translateX(-50%);max-width:1100px;width:100%;display:flex;align-items:center;justify-content:center;gap:16px;padding:10px 20px;background:linear-gradient(180deg,rgba(10,25,41,0.85),rgba(10,25,41,0.98));border-top:1px solid rgba(255,90,31,0.2);backdrop-filter:blur(8px);z-index:100;}
.hp-ctrl-btn{background:var(--hp-red);color:var(--hp-bone);border:none;padding:6px 16px;border-radius:4px;font-family:'Russo One',sans-serif;font-size:11px;letter-spacing:1px;cursor:pointer;display:flex;align-items:center;gap:6px;transition:background 0.2s;}
.hp-ctrl-btn:hover{background:#d42a2a;}
.hp-ctrl-all{background:rgba(255,90,31,0.2);border:1px solid var(--hp-orange);}
.hp-ctrl-all:hover{background:rgba(255,90,31,0.35);}
.hp-counter{font-size:11px;color:rgba(251,246,231,0.5);letter-spacing:1px;min-width:60px;text-align:center;}

/* ── Lava glow on later phases ── */
.hp-lava-border{border-color:rgba(196,30,30,0.4) !important;box-shadow:0 0 12px rgba(196,30,30,0.15);}
.hp-lava-glow{animation:hp-glow-pulse 3s ease-in-out infinite;}
@keyframes hp-glow-pulse{0%,100%{box-shadow:0 0 8px rgba(196,30,30,0.1)}50%{box-shadow:0 0 20px rgba(196,30,30,0.3)}}

/* ── Screen shake ── */
.hp-shake{animation:hp-shake-anim 0.5s ease-out;}
@keyframes hp-shake-anim{0%{transform:translate(0)}15%{transform:translate(-4px,2px)}30%{transform:translate(4px,-2px)}45%{transform:translate(-3px,1px)}60%{transform:translate(3px,-1px)}75%{transform:translate(-1px,1px)}100%{transform:translate(0)}}

/* ── Eruption flash ── */
.hp-erupt-flash{animation:hp-erupt 1s ease-out;}
@keyframes hp-erupt{0%{background:rgba(255,90,31,0.3)}50%{background:rgba(196,30,30,0.15)}100%{background:transparent}}

/* ── Elimination card ── */
.hp-elim-card{background:linear-gradient(135deg,rgba(196,30,30,0.15),rgba(20,40,65,0.85));border:2px solid var(--hp-red);border-radius:10px;padding:16px;text-align:center;margin:12px 0;position:relative;overflow:hidden;}
.hp-elim-card::after{content:'';position:absolute;top:0;left:0;right:0;bottom:0;background:linear-gradient(180deg,transparent 60%,rgba(196,30,30,0.1));pointer-events:none;}

/* ── Winner card ── */
.hp-winner-card{background:linear-gradient(135deg,rgba(255,209,102,0.1),rgba(20,40,65,0.85));border:2px solid var(--hp-gold);border-radius:10px;padding:20px;text-align:center;margin:12px 0;position:relative;overflow:hidden;box-shadow:0 0 30px rgba(255,209,102,0.15);}
.hp-winner-title{font-family:'Permanent Marker',cursive;font-size:28px;color:var(--hp-gold);letter-spacing:3px;text-shadow:0 0 20px rgba(255,209,102,0.3);}

/* ── Hazard table ── */
.hp-hazard-table{width:100%;border-collapse:collapse;margin:8px 0;}
.hp-hazard-table th{font-size:9px;letter-spacing:2px;color:rgba(251,246,231,0.4);text-align:left;padding:6px 8px;border-bottom:1px solid rgba(255,90,31,0.15);text-transform:uppercase;}
.hp-hazard-table td{font-size:11px;padding:6px 8px;border-bottom:1px solid rgba(255,255,255,0.04);}

/* ── Collapsible ── */
.hp-collapse-header{display:flex;align-items:center;gap:8px;padding:8px 12px;background:rgba(0,0,0,0.2);border:1px solid rgba(255,90,31,0.1);border-radius:6px;cursor:pointer;margin:6px 0;font-size:11px;letter-spacing:1px;color:var(--hp-gold);text-transform:uppercase;}
.hp-collapse-header:hover{background:rgba(0,0,0,0.3);}
.hp-collapse-body{padding:8px 12px;display:none;}
.hp-collapse-open .hp-collapse-body{display:block;}
.hp-collapse-arrow{transition:transform 0.2s;font-size:8px;color:var(--hp-orange);}
.hp-collapse-open .hp-collapse-arrow{transform:rotate(90deg);}

/* ── Roster dots ── */
.hp-dot-row{display:flex;flex-wrap:wrap;gap:6px;padding:4px 0;}
.hp-dot{display:inline-flex;align-items:center;gap:4px;padding:2px 8px;background:rgba(0,0,0,0.2);border-radius:12px;font-size:10px;border:1px solid rgba(255,255,255,0.06);}
.hp-dot img{width:18px;height:18px;border-radius:50%;object-fit:contain;}

/* ── Volcano SVG scene ── */
.hp-volcano-scene{position:relative;width:100%;max-width:500px;margin:0 auto 16px;height:180px;}

/* ── Finalist row ── */
.hp-finalists-row{display:flex;justify-content:center;gap:16px;flex-wrap:wrap;margin:16px 0;}

/* ── Rope vis ── */
.hp-rope-vis{display:flex;align-items:center;gap:4px;margin:4px 0;padding:6px 10px;background:rgba(0,0,0,0.15);border-radius:6px;}
.hp-rope-line{flex:1;height:3px;background:var(--hp-bone);border-radius:2px;position:relative;}
.hp-rope-cut{position:absolute;top:-6px;width:12px;height:15px;background:var(--hp-red);clip-path:polygon(20% 0%,80% 0%,100% 40%,60% 100%,40% 100%,0% 40%);left:50%;transform:translateX(-50%);}

/* ── Exchange box ── */
.hp-exchange{display:flex;align-items:center;gap:12px;padding:10px;background:rgba(0,0,0,0.2);border-radius:8px;margin:4px 0;}
.hp-exchange-bar{flex:1;height:8px;background:rgba(255,255,255,0.08);border-radius:4px;overflow:hidden;position:relative;}
.hp-exchange-fill{height:100%;border-radius:4px;transition:width 0.4s ease;}

/* ── Tally marks ── */
.hp-tally{display:flex;gap:3px;align-items:center;}
.hp-tally-mark{width:3px;height:16px;background:var(--hp-gold);border-radius:1px;}
.hp-tally-mark.dim{opacity:0.2;}
</style>

<div class="hp-topbar">
  <div class="hp-live"><div class="hp-live-dot"></div><span class="hp-live-label">LIVE</span></div>
  <div class="hp-finale-badge">SEASON FINALE</div>
  <div class="hp-ticker"><span class="hp-ticker-text">${ticker}</span></div>
  <div class="hp-channel">PUNCH.TV</div>
</div>

<div class="hp-tabs">${tabHtml}</div>

<div class="hp-moon"></div>
<div class="hp-embers">${embers}</div>

<div class="hp-content">
${content}
</div>

</div>`;
}

// ══════════════════════════════════════════════════════════════
// VOLCANO SVG SCENE
// ══════════════════════════════════════════════════════════════
function _volcanoSVG() {
  return `<svg viewBox="0 0 500 180" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:100%">
  <defs>
    <linearGradient id="hp-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#0a1929"/><stop offset="100%" stop-color="#1e293b"/></linearGradient>
    <linearGradient id="hp-mtn" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#3b2017"/><stop offset="70%" stop-color="#1a0f0a"/></linearGradient>
    <linearGradient id="hp-lavaflow" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#ff5a1f"/><stop offset="100%" stop-color="#c41e1e"/></linearGradient>
    <radialGradient id="hp-crater-glow" cx="50%" cy="30%" r="50%"><stop offset="0%" stop-color="#ff5a1f" stop-opacity="0.6"/><stop offset="100%" stop-color="transparent"/></radialGradient>
    <linearGradient id="hp-water" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#1a8a7d" stop-opacity="0.4"/><stop offset="100%" stop-color="#0a1929"/></linearGradient>
  </defs>
  <rect width="500" height="180" fill="url(#hp-sky)"/>
  <!-- Stars -->
  <circle cx="50" cy="20" r="1" fill="#fbf6e7" opacity="0.4"/>
  <circle cx="150" cy="35" r="1.2" fill="#fbf6e7" opacity="0.3"/>
  <circle cx="400" cy="15" r="0.8" fill="#fbf6e7" opacity="0.5"/>
  <circle cx="320" cy="30" r="1" fill="#fbf6e7" opacity="0.35"/>
  <circle cx="450" cy="45" r="1.3" fill="#fbf6e7" opacity="0.25"/>
  <!-- Moon -->
  <circle cx="420" cy="30" r="18" fill="#f0d68c" opacity="0.3"/>
  <circle cx="414" cy="26" r="16" fill="#0a1929" opacity="0.5"/>
  <!-- Volcano -->
  <polygon points="250,25 140,160 360,160" fill="url(#hp-mtn)"/>
  <!-- Crater glow -->
  <ellipse cx="250" cy="30" rx="25" ry="10" fill="url(#hp-crater-glow)"/>
  <!-- Lava rivers -->
  <path d="M242,40 Q230,80 220,120 Q215,140 210,160" stroke="url(#hp-lavaflow)" stroke-width="3" fill="none" opacity="0.7"/>
  <path d="M258,40 Q270,85 280,125 Q285,145 290,160" stroke="url(#hp-lavaflow)" stroke-width="2.5" fill="none" opacity="0.6"/>
  <path d="M248,35 Q250,70 252,110 Q253,135 255,160" stroke="url(#hp-lavaflow)" stroke-width="2" fill="none" opacity="0.5"/>
  <!-- Palm trees left -->
  <rect x="80" y="130" width="4" height="30" fill="#5c3a1e" rx="1"/>
  <path d="M82,130 Q90,115 105,118" stroke="#2d8a4e" stroke-width="3" fill="none"/>
  <path d="M82,130 Q72,112 58,116" stroke="#2d8a4e" stroke-width="3" fill="none"/>
  <path d="M82,128 Q88,108 95,105" stroke="#1e6b3a" stroke-width="2.5" fill="none"/>
  <!-- Palm trees right -->
  <rect x="390" y="125" width="4" height="35" fill="#5c3a1e" rx="1"/>
  <path d="M392,125 Q400,110 415,114" stroke="#2d8a4e" stroke-width="3" fill="none"/>
  <path d="M392,125 Q382,108 368,112" stroke="#2d8a4e" stroke-width="3" fill="none"/>
  <path d="M392,123 Q398,103 408,100" stroke="#1e6b3a" stroke-width="2.5" fill="none"/>
  <!-- Tiki torches -->
  <rect x="120" y="135" width="3" height="25" fill="#8b6914"/>
  <ellipse cx="121.5" cy="132" rx="4" ry="6" fill="#ff5a1f" opacity="0.8"/>
  <ellipse cx="121.5" cy="130" rx="2.5" ry="4" fill="#ffd166" opacity="0.7"/>
  <rect x="370" y="132" width="3" height="28" fill="#8b6914"/>
  <ellipse cx="371.5" cy="129" rx="4" ry="6" fill="#ff5a1f" opacity="0.8"/>
  <ellipse cx="371.5" cy="127" rx="2.5" ry="4" fill="#ffd166" opacity="0.7"/>
  <!-- Water -->
  <rect x="0" y="155" width="500" height="25" fill="url(#hp-water)"/>
  <path d="M0,160 Q30,155 60,160 Q90,165 120,160 Q150,155 180,160 Q210,165 240,160 Q270,155 300,160 Q330,165 360,160 Q390,155 420,160 Q450,165 480,160 L500,160 L500,180 L0,180Z" fill="#1a8a7d" opacity="0.15"/>
</svg>`;
}

// ══════════════════════════════════════════════════════════════
// SCREEN 1: TITLE CARD
// ══════════════════════════════════════════════════════════════
export function rpBuildHPTitleCard(ep) {
  const finalists = ep.finaleFinalists || [];
  if (!finalists.length) return _hpShell('<p>No finale data.</p>', ep, 'title');

  const finalistCards = finalists.map(f => _finalistCard(f)).join('');

  const hostLine = pick([
    `${host()} adjusts ${pr(host()).posAdj || 'his'} torch and grins at the camera. "Welcome to the FINALE."`,
    `"This." ${host()} gestures at the volcano behind ${pr(host()).obj || 'him'}. "Is where legends are made."`,
    `${host()} stands on black sand, volcano glowing behind. "One challenge. One winner. One MILLION dollars."`,
    `"Forget everything you think you know." ${host()} cracks ${pr(host()).posAdj || 'his'} knuckles. "Tonight, it ends."`,
  ]);

  return _hpShell(`
    <div class="hp-volcano-scene">${_volcanoSVG()}</div>

    <div style="text-align:center;margin-bottom:8px">
      <div style="font-size:10px;letter-spacing:6px;color:rgba(255,90,31,0.4)">TOTAL DRAMA PRESENTS</div>
      <div style="font-family:'Permanent Marker',cursive;font-size:42px;color:var(--hp-red);letter-spacing:4px;text-shadow:3px 3px 0 rgba(0,0,0,0.5),0 0 30px rgba(196,30,30,0.3);line-height:1.1;margin:8px 0">
        HAWAIIAN<br>PUNCH
      </div>
      <div style="font-size:11px;letter-spacing:4px;color:var(--hp-gold);border:1px solid rgba(255,209,102,0.3);display:inline-block;padding:3px 14px;border-radius:3px">FINALE OF THE SEASON</div>
    </div>

    <div style="margin:16px 0;padding:12px 16px;font-family:'Special Elite',cursive;font-size:12px;color:rgba(251,246,231,0.7);line-height:1.7;text-align:center">
      ${hostLine}
    </div>

    <div class="hp-section">${_icon('fire')} THE FINALISTS</div>

    <div class="hp-finalists-row">
      ${finalistCards}
    </div>

    <div class="hp-flavor">${pick(TIKI_FLAVOR)}</div>
  `, ep, 'title');
}

// ══════════════════════════════════════════════════════════════
// SCREEN 2: TIEBREAKER INTRO
// ══════════════════════════════════════════════════════════════
export function rpBuildHPTiebreaker(ep) {
  const tb = ep.hpTiebreaker;
  if (!tb) {
    // F2 — no tiebreaker needed
    const finalists = ep.finaleFinalists || [];
    return _hpShell(`
      <div class="hp-section">${_icon('sword')} FINAL TWO</div>
      <div class="hp-card hp-event">
        <div class="hp-card-header">
          <div class="hp-card-label">NO TIEBREAKER</div>
        </div>
        <div class="hp-card-text">
          With only two finalists remaining, the volcano race begins immediately.
          ${finalists.map(f => `<strong>${f}</strong>`).join(' and ')} prepare for the final challenge.
        </div>
      </div>
      <div class="hp-flavor">${pick(TIKI_FLAVOR)}</div>
    `, ep, 'tiebreaker');
  }

  const safe = tb.immunityWinner;
  const [d1, d2] = tb.duelists;
  const safePr = pr(safe);
  const d1Pr = pr(d1);
  const d2Pr = pr(d2);

  const introText = pick([
    `${host()} holds up the immunity necklace. "${safe} — you won the final immunity challenge. You're safe tonight."`,
    `"${safe} earned safety." ${host()} turns to ${d1} and ${d2}. "You two... didn't."`,
    `${safe} clutches the necklace. Safe. The other two? They have to fight for it.`,
    `"Immunity keeps ${safe} in the game." ${host()} gestures to the platform over the water. "The rest of you — follow me."`,
  ]);

  const arenaText = pick([
    `Two platforms. Shark-infested water below. Fire-lit staffs above. The joust begins at moonrise.`,
    `The platforms hover above black water. Tiki torches line the edges. Something moves beneath the surface.`,
    `${host()} leads them to the waterfront. Two wooden platforms connected by nothing but air and ambition.`,
    `The arena: two volcanic rock platforms separated by open water. The rules are simple. The stakes aren't.`,
  ]);

  return _hpShell(`
    <div class="hp-section">${_icon('sword')} THE TIEBREAKER</div>

    <div class="hp-card hp-event">
      <div class="hp-card-header">
        ${_avatarRing(safe, 36, 'var(--hp-gold)')}
        <div>
          <div class="hp-card-label">IMMUNITY WINNER</div>
          <div style="font-family:'Permanent Marker',cursive;font-size:14px;color:var(--hp-gold)">${safe}</div>
        </div>
        <span class="hp-pill hp-pill-gold" style="margin-left:auto">SAFE</span>
      </div>
      <div class="hp-card-text">${introText}</div>
    </div>

    <div class="hp-vs">
      <div style="text-align:center">
        ${_avatarRing(d1, 48, 'var(--hp-red)')}
        <div class="hp-vs-name" style="color:var(--hp-red)">${d1}</div>
        <div style="font-size:9px;color:rgba(251,246,231,0.4)">${arch(d1).replace(/-/g, ' ')}</div>
      </div>
      <div class="hp-vs-divider">VS</div>
      <div style="text-align:center">
        ${_avatarRing(d2, 48, 'var(--hp-orange)')}
        <div class="hp-vs-name" style="color:var(--hp-orange)">${d2}</div>
        <div style="font-size:9px;color:rgba(251,246,231,0.4)">${arch(d2).replace(/-/g, ' ')}</div>
      </div>
    </div>

    <div class="hp-card hp-danger">
      <div class="hp-card-header">
        ${_icon('shark')}
        <div class="hp-card-label">THE ARENA AWAITS</div>
      </div>
      <div class="hp-card-text">${arenaText}</div>
    </div>

    <div class="hp-flavor">${pick(TIKI_FLAVOR)}</div>
  `, ep, 'tiebreaker');
}

// ══════════════════════════════════════════════════════════════
// SCREEN 3: JOUST
// ══════════════════════════════════════════════════════════════
export function rpBuildHPJoust(ep) {
  const tb = ep.hpTiebreaker;
  if (!tb) {
    return _hpShell(`
      <div class="hp-section">${_icon('sword')} JOUST</div>
      <div class="hp-card hp-event">
        <div class="hp-card-text">No tiebreaker this finale — the final two proceed directly to the volcano race.</div>
      </div>
    `, ep, 'joust');
  }

  const [d1, d2] = tb.duelists;
  const exchanges = tb.exchanges || [];
  const socialEvts = tb.socialEvents || [];
  const stateKey = 'hp-joust';

  // Build steps: each exchange + social events after it + final resolution
  const steps = [];

  for (let i = 0; i < exchanges.length; i++) {
    const ex = exchanges[i];
    const roundWinner = ex.winner;
    const roundLoser = roundWinner === d1 ? d2 : d1;
    const d1Score = ex.scores[d1] || 0;
    const d2Score = ex.scores[d2] || 0;
    const totalD1 = exchanges.slice(0, i + 1).reduce((s, e) => s + (e.winner === d1 ? 1 : 0), 0);
    const totalD2 = exchanges.slice(0, i + 1).reduce((s, e) => s + (e.winner === d2 ? 1 : 0), 0);

    let exchangeHtml = '';

    // Sudden death label
    if (ex.suddenDeath) {
      exchangeHtml += `<div class="hp-card hp-danger hp-lava-glow" style="text-align:center;margin-bottom:8px">
        <div style="font-family:'Permanent Marker',cursive;font-size:18px;color:var(--hp-red);letter-spacing:3px">SUDDEN DEATH</div>
        <div class="hp-card-text">${pick(JOUST_SUDDEN)(d1, d2)}</div>
      </div>`;
    }

    // Rally text
    if (ex.d1Rally) {
      exchangeHtml += `<div class="hp-card hp-rally">
        <div class="hp-card-header">${_avatarRing(d1, 28, 'var(--hp-green)')}<div class="hp-card-label">RALLY</div></div>
        <div class="hp-card-text">${pick(JOUST_RALLY)(d1)}</div>
      </div>`;
    }
    if (ex.d2Rally) {
      exchangeHtml += `<div class="hp-card hp-rally">
        <div class="hp-card-header">${_avatarRing(d2, 28, 'var(--hp-green)')}<div class="hp-card-label">RALLY</div></div>
        <div class="hp-card-text">${pick(JOUST_RALLY)(d2)}</div>
      </div>`;
    }

    // Exchange result
    const d1Pct = Math.min(100, Math.max(5, (d1Score / (d1Score + d2Score)) * 100));
    exchangeHtml += `<div class="hp-card hp-combat">
      <div class="hp-card-header">
        ${_icon('sword')}
        <div class="hp-card-label">ROUND ${ex.round}</div>
        <span class="hp-card-score">${roundWinner === d1 ? d1 : d2}</span>
      </div>
      <div class="hp-card-text">${pick(JOUST_HIT)(roundWinner, roundLoser)}</div>
      <div class="hp-exchange" style="margin-top:8px">
        <span style="font-size:10px;min-width:50px;text-align:right;${roundWinner === d1 ? 'color:var(--hp-gold)' : ''}">${d1} <span style="font-size:12px;font-family:'Permanent Marker',cursive">${d1Score.toFixed(1)}</span></span>
        <div class="hp-exchange-bar">
          <div class="hp-exchange-fill" style="width:${d1Pct}%;background:linear-gradient(90deg,${roundWinner === d1 ? 'var(--hp-gold)' : 'var(--hp-red)'},${roundWinner === d2 ? 'var(--hp-gold)' : 'var(--hp-red)'})"></div>
        </div>
        <span style="font-size:10px;min-width:50px;${roundWinner === d2 ? 'color:var(--hp-gold)' : ''}">${d2} <span style="font-size:12px;font-family:'Permanent Marker',cursive">${d2Score.toFixed(1)}</span></span>
      </div>
      <div style="display:flex;justify-content:space-between;margin-top:6px;font-size:10px;color:rgba(251,246,231,0.5)">
        <div class="hp-tally">${Array.from({ length: 3 }, (_, t) => `<div class="hp-tally-mark ${t < totalD1 ? '' : 'dim'}"></div>`).join('')}<span style="margin-left:4px">${totalD1}W</span></div>
        <div class="hp-tally">${Array.from({ length: 3 }, (_, t) => `<div class="hp-tally-mark ${t < totalD2 ? '' : 'dim'}"></div>`).join('')}<span style="margin-left:4px">${totalD2}W</span></div>
      </div>
    </div>`;

    // Shark beat (every other round)
    if (i % 2 === 1) {
      exchangeHtml += `<div class="hp-card hp-danger" style="opacity:0.7">
        <div class="hp-card-header">${_icon('shark')}<div class="hp-card-label">BENEATH THE SURFACE</div></div>
        <div class="hp-card-text">${pick(SHARK_BEAT)(roundLoser)}</div>
      </div>`;
    }

    // Social events after this exchange
    const roundSocial = socialEvts[i] || [];
    for (const se of roundSocial) {
      if (se.type === 'crowd-roar' && se.crowd && se.target) {
        exchangeHtml += `<div class="hp-social-card">
          <div class="hp-social-header">
            ${_avatarRing(se.crowd, 22, 'var(--hp-teal)')}
            <span class="hp-social-label">CROWD</span>
          </div>
          <div class="hp-card-text">${pick(CROWD_ROAR)(se.crowd, se.target, se.isCheer)}</div>
        </div>`;
      }
    }

    // Flavor between rounds
    if (i < exchanges.length - 1 && i % 2 === 0) {
      exchangeHtml += `<div class="hp-flavor">${pick(TIKI_FLAVOR)}</div>`;
    }

    steps.push(exchangeHtml);
  }

  // Final resolution step
  let resolutionHtml = '';
  const winner = tb.winner;
  const loser = tb.loser;
  const winPr = pr(winner);
  const losePr = pr(loser);

  resolutionHtml += `<div class="hp-elim-card">
    <div style="font-family:'Permanent Marker',cursive;font-size:22px;color:var(--hp-gold);letter-spacing:2px;margin-bottom:8px">${winner} WINS THE JOUST</div>
    <div style="display:flex;justify-content:center;gap:24px;margin:12px 0">
      <div style="text-align:center">
        ${_avatarRing(winner, 48, 'var(--hp-gold)')}
        <div style="font-size:12px;color:var(--hp-gold);margin-top:4px">${winner}</div>
        <span class="hp-pill hp-pill-ok">ADVANCES</span>
      </div>
      <div style="text-align:center;opacity:0.5">
        ${_avatarRing(loser, 48, 'var(--hp-red)')}
        <div style="font-size:12px;color:var(--hp-red);margin-top:4px">${loser}</div>
        <span class="hp-pill hp-pill-danger">ELIMINATED</span>
      </div>
    </div>
    <div class="hp-card-text" style="text-align:center;margin-top:8px">
      ${pick([
        `${loser} stumbles. ${losePr.Sub} looks down at the water. The sharks circle. ${host()}: "${loser}. The tribe has spoken."`,
        `${winner} stands tall. ${loser} stares at the torch one last time before it's snuffed.`,
        `The platform tilts. ${loser} catches ${losePr.posAdj} balance, then lets go. It's over.`,
        `${loser} nods. No words needed. ${losePr.Sub} extends a hand to ${winner}. "${winPr.Sub} earned it."`,
      ])}
    </div>
    <div class="hp-card-text" style="text-align:center;margin-top:6px;font-size:11px;color:rgba(251,246,231,0.4)">
      ${tb.suddenDeath ? 'DECIDED IN SUDDEN DEATH' : `Final score: ${tb.d1Wins}-${tb.d2Wins}`}
    </div>
  </div>`;

  steps.push(resolutionHtml);

  const totalSteps = steps.length;
  _ensureState(stateKey, totalSteps);
  const revIdx = _tvState[stateKey].idx;

  const stepsRendered = steps.map((html, i) =>
    `<div class="hp-step ${i <= revIdx ? 'hp-visible' : ''}" id="hp-step-joust-${i}">${html}</div>`
  ).join('');

  return _hpShell(`
    <div class="hp-section">${_icon('sword')} THE JOUST</div>

    <div class="hp-vs" style="margin-bottom:12px">
      <div style="text-align:center">
        ${_avatarRing(d1, 36, 'var(--hp-red)')}
        <div class="hp-vs-name" style="color:var(--hp-red);font-size:12px">${d1}</div>
      </div>
      <div class="hp-vs-divider" style="font-size:16px">VS</div>
      <div style="text-align:center">
        ${_avatarRing(d2, 36, 'var(--hp-orange)')}
        <div class="hp-vs-name" style="color:var(--hp-orange);font-size:12px">${d2}</div>
      </div>
    </div>

    ${stepsRendered}

    ${_controls(stateKey, totalSteps)}
  `, ep, 'joust');
}

// ══════════════════════════════════════════════════════════════
// SCREEN 4: VOLCANO RACE (Build + Uphill + Lava)
// ══════════════════════════════════════════════════════════════
export function rpBuildHPVolcanoRace(ep) {
  const rd = ep.hpRaceData;
  if (!rd) return _hpShell('<p>No race data available.</p>', ep, 'volcano');

  const [rA, rB] = rd.finalists;
  const phases = rd.phases || [];
  const stateKey = 'hp-volcano';
  const steps = [];

  // Intro step
  {
    const asstA = ep.assistants?.[rA];
    const asstB = ep.assistants?.[rB];
    const benchA = ep.benchAssignments ? Object.entries(ep.benchAssignments).filter(([supporter, finalist]) => {
      if (Array.isArray(ep.benchAssignments[rA])) return false; // handled below
      return finalist === rA;
    }).map(([s]) => s) : [];
    // Handle both formats: { finalist: [supporters] } and { supporter: finalist }
    let benchAList, benchBList;
    if (ep.benchAssignments && Array.isArray(ep.benchAssignments[rA])) {
      benchAList = ep.benchAssignments[rA] || [];
      benchBList = ep.benchAssignments[rB] || [];
    } else if (ep.benchAssignments) {
      benchAList = Object.entries(ep.benchAssignments).filter(([, f]) => f === rA).map(([s]) => s);
      benchBList = Object.entries(ep.benchAssignments).filter(([, f]) => f === rB).map(([s]) => s);
    } else {
      benchAList = [];
      benchBList = [];
    }

    let introHtml = `<div class="hp-card hp-event">
      <div class="hp-card-header">${_icon('volcano')}<div class="hp-card-label">THE VOLCANO RACE</div></div>
      <div class="hp-card-text">
        ${pick([
          `${host()} points at the volcano. "Build your dummy. Race it up. Throw it in the crater. First one to do it wins a MILLION DOLLARS."`,
          `"Four phases. One volcano. Two dummies." ${host()} pauses. "Well, two dummy-dummies. You're all dummies."`,
          `The volcano rumbles. ${host()} grins. "Your final challenge awaits. Build, climb, cross, throw. Go."`,
          `${host()} fires a flare into the sky. "THE VOLCANO RACE BEGINS... NOW!"`,
        ])}
      </div>
    </div>`;

    // Racer cards
    introHtml += `<div class="hp-vs" style="margin:12px 0">
      <div style="text-align:center">
        ${_avatarRing(rA, 42, 'var(--hp-red)')}
        <div class="hp-vs-name" style="font-size:12px">${rA}</div>
        ${asstA ? `<div style="font-size:9px;color:var(--hp-teal);margin-top:2px">${_icon('heart')} Asst: ${asstA}</div>` : ''}
        <div style="font-size:9px;color:rgba(251,246,231,0.4);margin-top:2px">${benchAList.length} supporter${benchAList.length !== 1 ? 's' : ''}</div>
      </div>
      <div class="hp-vs-divider" style="font-size:16px">VS</div>
      <div style="text-align:center">
        ${_avatarRing(rB, 42, 'var(--hp-orange)')}
        <div class="hp-vs-name" style="font-size:12px">${rB}</div>
        ${asstB ? `<div style="font-size:9px;color:var(--hp-teal);margin-top:2px">${_icon('heart')} Asst: ${asstB}</div>` : ''}
        <div style="font-size:9px;color:rgba(251,246,231,0.4);margin-top:2px">${benchBList.length} supporter${benchBList.length !== 1 ? 's' : ''}</div>
      </div>
    </div>`;

    steps.push(introHtml);
  }

  // Phase 1: Build the Dummy
  const buildPhase = phases.find(p => p.name === 'Build the Dummy');
  if (buildPhase) {
    let html = `<div class="hp-phase">${_icon('dummy')} PHASE 1: BUILD THE DUMMY</div>`;

    const scoreA = buildPhase.scores[rA] || 0;
    const scoreB = buildPhase.scores[rB] || 0;
    const buildWinner = buildPhase.winner;

    // Build narration
    html += `<div class="hp-card hp-event">
      <div class="hp-card-header">${_avatarRing(rA, 24, 'var(--hp-red)')}<div class="hp-card-label">BUILDING</div>
        <span class="hp-card-score">${scoreA.toFixed(1)}</span></div>
      <div class="hp-card-text">${pick(BUILD_NARR)(rA, scoreA)}</div>
    </div>`;
    html += `<div class="hp-card hp-event">
      <div class="hp-card-header">${_avatarRing(rB, 24, 'var(--hp-orange)')}<div class="hp-card-label">BUILDING</div>
        <span class="hp-card-score">${scoreB.toFixed(1)}</span></div>
      <div class="hp-card-text">${pick(BUILD_NARR)(rB, scoreB)}</div>
    </div>`;

    // Build events
    const bEvents = buildPhase.events || [];
    for (const evt of bEvents) {
      if (evt.type === 'sabotage') {
        html += `<div class="hp-card hp-danger">
          <div class="hp-card-header">${_icon('trap')}<div class="hp-card-label">SABOTAGE</div></div>
          <div class="hp-card-text">${pick(SABOTAGE_EVENT)(evt.who || 'Someone', evt.target || rB)}</div>
        </div>`;
      } else if (evt.type === 'assistant-chemistry') {
        html += `<div class="hp-social-card">
          <div class="hp-social-header">${_icon('heart')}<span class="hp-social-label">TEAMWORK</span></div>
          <div class="hp-card-text">${pick(ASSISTANT_CHEM)(evt.helper || 'The assistant', evt.finalist || rA)}</div>
        </div>`;
      } else if (evt.type === 'dummy-insult') {
        html += `<div class="hp-card hp-combat">
          <div class="hp-card-header">${_icon('megaphone')}<div class="hp-card-label">TRASH TALK</div></div>
          <div class="hp-card-text">${pick(DUMMY_INSULT)(evt.who || rA, evt.target || rB)}</div>
        </div>`;
      } else if (evt.type === 'bench-rally') {
        const benchNames = evt.bench || [];
        html += `<div class="hp-social-card">
          <div class="hp-social-header">${_icon('megaphone')}<span class="hp-social-label">BENCH RALLY</span></div>
          <div class="hp-card-text">${pick(BENCH_RALLY)(benchNames, evt.finalist || rA)}</div>
        </div>`;
      }
    }

    // Phase winner
    html += `<div style="text-align:center;margin:8px 0;font-size:11px;color:var(--hp-gold);letter-spacing:1px">
      ${_icon('star')} <strong>${buildWinner || 'Tie'}</strong> finishes the dummy first
    </div>`;

    steps.push(html);
  }

  // Phase 2: Uphill Race
  const uphillPhase = phases.find(p => p.name === 'Uphill Race');
  if (uphillPhase) {
    let html = `<div class="hp-phase">${_icon('mountain')} PHASE 2: UPHILL RACE</div>`;

    const scoreA = uphillPhase.scores[rA] || 0;
    const scoreB = uphillPhase.scores[rB] || 0;
    const holder = uphillPhase.wheelbarrowHolder;

    if (holder) {
      html += `<div class="hp-card hp-event" style="opacity:0.8">
        <div class="hp-card-header">${_icon('fist')}<div class="hp-card-label">WHEELBARROW ADVANTAGE</div></div>
        <div class="hp-card-text"><strong>${holder}</strong> pushes the wheelbarrow. ${holder === rA ? rB : rA} carries the dummy on ${pr(holder === rA ? rB : rA).posAdj} back.</div>
      </div>`;
    }

    html += `<div class="hp-card hp-event">
      <div class="hp-card-header">${_avatarRing(rA, 24, 'var(--hp-red)')}<div class="hp-card-label">CLIMBING</div>
        <span class="hp-card-score">${scoreA.toFixed(1)}</span></div>
      <div class="hp-card-text">${pick(UPHILL_NARR)(rA, scoreA)}</div>
    </div>`;
    html += `<div class="hp-card hp-event">
      <div class="hp-card-header">${_avatarRing(rB, 24, 'var(--hp-orange)')}<div class="hp-card-label">CLIMBING</div>
        <span class="hp-card-score">${scoreB.toFixed(1)}</span></div>
      <div class="hp-card-text">${pick(UPHILL_NARR)(rB, scoreB)}</div>
    </div>`;

    // Uphill events
    const uEvents = uphillPhase.events || [];
    for (const evt of uEvents) {
      if (evt.type === 'stumble') {
        html += `<div class="hp-card hp-danger">
          <div class="hp-card-header">${_icon('trap')}<div class="hp-card-label">STUMBLE</div></div>
          <div class="hp-card-text">${pick(STUMBLE_EVENT)(evt.who || rA)}</div>
        </div>`;
      } else if (evt.type === 'shortcut') {
        html += `<div class="hp-card hp-rally">
          <div class="hp-card-header">${_icon('eye')}<div class="hp-card-label">SHORTCUT</div></div>
          <div class="hp-card-text">${pick(SHORTCUT_EVENT)(evt.who || rA)}</div>
        </div>`;
      } else if (evt.type === 'taunt') {
        html += `<div class="hp-card hp-combat">
          <div class="hp-card-header">${_icon('megaphone')}<div class="hp-card-label">TAUNT</div></div>
          <div class="hp-card-text">${pick(MIND_GAME_ATK)(evt.who || rA, evt.target || rB, 'taunt')}</div>
        </div>`;
      } else if (evt.type === 'bench-help') {
        html += `<div class="hp-social-card">
          <div class="hp-social-header">${_icon('megaphone')}<span class="hp-social-label">BENCH SUPPORT</span></div>
          <div class="hp-card-text">${pick(BENCH_HELP_EVENT)(evt.helper || 'A supporter', evt.finalist || rA)}</div>
        </div>`;
      } else if (evt.type === 'bench-sabotage') {
        html += `<div class="hp-card hp-danger">
          <div class="hp-card-header">${_icon('trap')}<div class="hp-card-label">BENCH SABOTAGE</div></div>
          <div class="hp-card-text">${pick(BENCH_SABOTAGE_EVENT)(evt.who || 'A rival supporter', evt.target || rA)}</div>
        </div>`;
      }
    }

    html += `<div class="hp-flavor">${pick(TIKI_FLAVOR)}</div>`;
    steps.push(html);
  }

  // Phase 3: Lava River Crossing
  const lavaPhase = phases.find(p => p.name === 'Lava River Crossing');
  if (lavaPhase) {
    let html = `<div class="hp-phase">${_icon('lava')} PHASE 3: LAVA RIVER CROSSING</div>`;

    const scoreA = lavaPhase.scores[rA] || 0;
    const scoreB = lavaPhase.scores[rB] || 0;

    html += `<div class="hp-card hp-event hp-lava-border">
      <div class="hp-card-header">${_avatarRing(rA, 24, 'var(--hp-red)')}<div class="hp-card-label">CROSSING</div>
        <span class="hp-card-score">${scoreA.toFixed(1)}</span></div>
      <div class="hp-card-text">${pick(LAVA_NARR)(rA, scoreA)}</div>
    </div>`;
    html += `<div class="hp-card hp-event hp-lava-border">
      <div class="hp-card-header">${_avatarRing(rB, 24, 'var(--hp-orange)')}<div class="hp-card-label">CROSSING</div>
        <span class="hp-card-score">${scoreB.toFixed(1)}</span></div>
      <div class="hp-card-text">${pick(LAVA_NARR)(rB, scoreB)}</div>
    </div>`;

    // Rope cuts
    const ropeCuts = lavaPhase.ropeCuts || [];
    for (const rc of ropeCuts) {
      const cutter = rc.helper || 'Someone';
      const intended = rc.intendedTarget || 'the target';
      const actual = rc.actualVictim || intended;
      const mismatch = rc.mismatch;
      const dodged = rc.dodged;
      const trap = rc.trap || '';
      const damage = rc.damage || 0;

      let statusPill = '';
      if (dodged) {
        statusPill = `<span class="hp-pill hp-pill-ok">DODGED</span>`;
      } else if (mismatch) {
        statusPill = `<span class="hp-pill hp-pill-warn">BACKFIRE</span>`;
      } else {
        statusPill = `<span class="hp-pill hp-pill-danger">HIT</span>`;
      }

      let cutText = '';
      if (dodged) {
        cutText = pick(COUNTER_BLOCK)(actual);
      } else if (mismatch) {
        cutText = `${cutter} cuts a rope meant for ${intended} -- but it hits ${actual} instead! ${damage > 0 ? `(${damage.toFixed(1)} penalty)` : ''}`;
      } else {
        cutText = `${cutter} slashes the rope! ${actual} swings wildly over the lava. ${damage > 0 ? `(${damage.toFixed(1)} penalty)` : ''}`;
      }

      html += `<div class="hp-card ${dodged ? 'hp-rally' : 'hp-danger'} hp-lava-border">
        <div class="hp-card-header">
          ${_icon('rope')}
          <div class="hp-card-label">ROPE CUT${trap ? ` -- ${trap.toUpperCase()}` : ''}</div>
          ${statusPill}
        </div>
        <div class="hp-card-text">${cutText}</div>
        <div class="hp-rope-vis">
          <span style="font-size:10px;color:rgba(251,246,231,0.4)">${cutter}</span>
          <div class="hp-rope-line">${!dodged ? '<div class="hp-rope-cut"></div>' : ''}</div>
          <span style="font-size:10px;color:${dodged ? 'var(--hp-green)' : 'var(--hp-red)'}">${actual}</span>
        </div>
      </div>`;
    }

    // Lava events
    const lEvents = lavaPhase.events || [];
    for (const evt of lEvents) {
      if (evt.type === 'distraction') {
        html += `<div class="hp-card hp-danger hp-lava-border">
          <div class="hp-card-header">${_icon('fire')}<div class="hp-card-label">HAZARD</div></div>
          <div class="hp-card-text">${pick(DISTRACTION_EVENT)(evt.who || rA, evt.source || 'lava')}</div>
        </div>`;
      } else if (evt.type === 'counter-block') {
        html += `<div class="hp-card hp-rally">
          <div class="hp-card-header">${_icon('shield')}<div class="hp-card-label">BLOCK</div></div>
          <div class="hp-card-text">${pick(COUNTER_BLOCK)(evt.who || rA)}</div>
        </div>`;
      }
    }

    html += `<div class="hp-flavor" style="color:rgba(196,30,30,0.4)">The lava river glows beneath them. No turning back.</div>`;
    steps.push(html);
  }

  // Running scores summary
  {
    const cumulA = rd.scores?.[rA] || phases.reduce((s, p) => s + (p.scores?.[rA] || 0), 0);
    const cumulB = rd.scores?.[rB] || phases.reduce((s, p) => s + (p.scores?.[rB] || 0), 0);
    const totalMax = Math.max(cumulA, cumulB, 1);
    const pctA = Math.round((cumulA / (cumulA + cumulB)) * 100);

    let html = `<div class="hp-phase">${_icon('star')} RACE STANDINGS</div>`;
    html += `<div class="hp-card hp-event">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
        ${_avatarRing(rA, 24, 'var(--hp-red)')}
        <span style="font-size:12px">${rA}</span>
        <span style="margin-left:auto;font-family:'Permanent Marker',cursive;font-size:16px;color:var(--hp-gold)">${cumulA.toFixed(1)}</span>
      </div>
      <div class="hp-exchange-bar" style="margin-bottom:8px">
        <div class="hp-exchange-fill" style="width:${pctA}%;background:linear-gradient(90deg,var(--hp-red),var(--hp-orange))"></div>
      </div>
      <div style="display:flex;align-items:center;gap:8px">
        ${_avatarRing(rB, 24, 'var(--hp-orange)')}
        <span style="font-size:12px">${rB}</span>
        <span style="margin-left:auto;font-family:'Permanent Marker',cursive;font-size:16px;color:var(--hp-gold)">${cumulB.toFixed(1)}</span>
      </div>
      <div class="hp-exchange-bar" style="margin-top:6px">
        <div class="hp-exchange-fill" style="width:${100 - pctA}%;background:linear-gradient(90deg,var(--hp-orange),var(--hp-red))"></div>
      </div>
      <div style="text-align:center;margin-top:8px;font-size:10px;color:rgba(251,246,231,0.4)">
        ${cumulA > cumulB ? `${rA} leads heading into the summit` : cumulB > cumulA ? `${rB} leads heading into the summit` : 'Dead even heading into the summit'}
      </div>
    </div>`;

    steps.push(html);
  }

  const totalSteps = steps.length;
  _ensureState(stateKey, totalSteps);
  const revIdx = _tvState[stateKey].idx;

  const stepsRendered = steps.map((html, i) =>
    `<div class="hp-step ${i <= revIdx ? 'hp-visible' : ''}" id="hp-step-volcano-${i}">${html}</div>`
  ).join('');

  return _hpShell(`
    <div class="hp-section">${_icon('volcano')} THE VOLCANO RACE</div>

    <div class="hp-vs" style="margin-bottom:12px">
      <div style="text-align:center">
        ${_avatarRing(rA, 36, 'var(--hp-red)')}
        <div class="hp-vs-name" style="color:var(--hp-red);font-size:12px">${rA}</div>
      </div>
      <div class="hp-vs-divider" style="font-size:16px">VS</div>
      <div style="text-align:center">
        ${_avatarRing(rB, 36, 'var(--hp-orange)')}
        <div class="hp-vs-name" style="color:var(--hp-orange);font-size:12px">${rB}</div>
      </div>
    </div>

    ${stepsRendered}

    ${_controls(stateKey, totalSteps)}
  `, ep, 'volcano');
}

// ══════════════════════════════════════════════════════════════
// SCREEN 5: SUMMIT SHOWDOWN
// ══════════════════════════════════════════════════════════════
export function rpBuildHPSummit(ep) {
  const rd = ep.hpRaceData;
  if (!rd) return _hpShell('<p>No race data available.</p>', ep, 'summit');

  const [rA, rB] = rd.finalists;
  const summitPhase = (rd.phases || []).find(p => p.name === 'Summit Showdown');
  const stateKey = 'hp-summit';
  const steps = [];

  // Summit arrival
  if (summitPhase) {
    const leader = summitPhase.leader || rA;
    const trailer = summitPhase.trailer || rB;

    let arriveHtml = `<div class="hp-phase">${_icon('mountain')} THE SUMMIT</div>`;
    arriveHtml += `<div class="hp-card hp-event hp-lava-glow">
      <div class="hp-card-header">${_icon('volcano')}<div class="hp-card-label">ARRIVAL</div></div>
      <div class="hp-card-text">${pick(SUMMIT_ARRIVE)(leader, trailer)}</div>
    </div>`;
    steps.push(arriveHtml);

    // Mind games
    const mg = summitPhase.mindGames;
    if (mg && !mg.noAttempt) {
      let mgHtml = '';
      const attackType = mg.attackType || 'taunt';
      const mgTrailer = mg.trailer || trailer;
      const mgLeader = mg.leader || leader;

      mgHtml += `<div class="hp-card hp-combat hp-lava-border">
        <div class="hp-card-header">${_icon('eye')}<div class="hp-card-label">MIND GAMES</div>
          <span class="hp-pill ${mg.success ? 'hp-pill-danger' : 'hp-pill-ok'}">${mg.success ? 'SUCCESS' : 'BLOCKED'}</span>
        </div>
        <div class="hp-card-text">${pick(MIND_GAME_ATK)(mgTrailer, mgLeader, attackType)}</div>
      </div>`;

      if (mg.success) {
        mgHtml += `<div class="hp-card hp-danger hp-shake">
          <div class="hp-card-header">${_icon('fist')}<div class="hp-card-label">IT WORKED</div></div>
          <div class="hp-card-text">${pick(MIND_GAME_FAIL)(mgLeader, mgTrailer)}</div>
        </div>`;
      } else {
        mgHtml += `<div class="hp-card hp-rally">
          <div class="hp-card-header">${_icon('shield')}<div class="hp-card-label">BLOCKED</div></div>
          <div class="hp-card-text">${pick(MIND_GAME_DEF)(mgLeader, mgTrailer)}</div>
        </div>`;
      }

      if (mg.hasShowmance) {
        const bond = mg.bond || 0;
        mgHtml += `<div class="hp-social-card">
          <div class="hp-social-header">${_icon('heart')}<span class="hp-social-label">SHOWMANCE TENSION</span></div>
          <div class="hp-card-text">${bond > 3
            ? `The bond between ${mgTrailer} and ${mgLeader} makes this personal. Every word cuts deeper.`
            : `Whatever they had, it's buried now. This is about winning.`
          }</div>
        </div>`;
      }

      steps.push(mgHtml);
    }

    // The throw + flip possibility
    {
      let throwHtml = '';
      const actualWinner = rd.winner;
      const flip = summitPhase.flip;

      if (flip) {
        throwHtml += `<div class="hp-card hp-danger hp-shake" style="border-color:var(--hp-red)">
          <div class="hp-card-header">${_icon('bolt')}<div class="hp-card-label">THE FLIP</div></div>
          <div class="hp-card-text">${pick([
            `${trailer} surges past ${leader} at the last second! A DESPERATE lunge!`,
            `${leader}'s dummy slips! ${trailer} sees the opening and TAKES IT!`,
            `Out of nowhere, ${trailer} finds another gear. ${leader}'s lead evaporates.`,
            `${trailer} hip-checks ${leader}'s dummy aside and SPRINTS to the crater!`,
          ])}</div>
        </div>`;
      }

      throwHtml += `<div class="hp-winner-card ${flip ? 'hp-shake' : ''}">
        <div style="margin-bottom:8px">${_avatarRing(actualWinner, 64, 'var(--hp-gold)')}</div>
        <div class="hp-winner-title">${actualWinner.toUpperCase()} WINS!</div>
        <div class="hp-card-text" style="margin-top:12px">${pick(DUMMY_THROW)(actualWinner, true)}</div>
      </div>`;

      // Eruption
      const eruption = rd.eruption;
      if (eruption && eruption.triggered) {
        throwHtml += `<div class="hp-card hp-danger hp-erupt-flash hp-lava-glow">
          <div class="hp-card-header">${_icon('volcano')}<div class="hp-card-label">ERUPTION</div>
            <span class="hp-pill hp-pill-danger">${(eruption.cause || 'volcanic').toUpperCase().replace(/-/g, ' ')}</span>
          </div>
          <div class="hp-card-text" style="font-family:'Permanent Marker',cursive;font-size:14px;color:var(--hp-orange);text-shadow:0 0 8px rgba(255,90,31,0.3)">
            ${pick(ERUPTION_TEXT)}
          </div>
        </div>`;
      }

      // Feral cameo
      if (rd.feralCameo) {
        throwHtml += `<div class="hp-social-card" style="border-color:rgba(255,90,31,0.4)">
          <div class="hp-social-header">${_icon('skull')}<span class="hp-social-label">UNEXPECTED GUEST</span></div>
          <div class="hp-card-text">${pick(FERAL_CAMEO)(rd.feralCameo)}</div>
        </div>`;
      }

      // Loser's moment
      const loserName = actualWinner === rA ? rB : rA;
      throwHtml += `<div class="hp-card hp-event" style="margin-top:8px;opacity:0.7">
        <div class="hp-card-header">${_avatarRing(loserName, 28, 'var(--hp-red)')}<div class="hp-card-label">RUNNER-UP</div></div>
        <div class="hp-card-text">${pick([
          `${loserName} stands at the crater's edge. So close. ${pr(loserName).Sub} throws ${pr(loserName).posAdj} dummy in anyway. "Had to finish."`,
          `${loserName} watches the eruption. ${pr(loserName).Sub} came this far. No regrets.`,
          `${loserName} sits on the volcanic rock and stares at the sky. "Next time."`,
          `${host()} puts a hand on ${loserName}'s shoulder. "That was one hell of a fight, ${loserName}."`,
        ])}</div>
      </div>`;

      steps.push(throwHtml);
    }
  } else {
    // No summit phase data — just show winner
    steps.push(`<div class="hp-winner-card">
      <div style="margin-bottom:8px">${_avatarRing(rd.winner, 64, 'var(--hp-gold)')}</div>
      <div class="hp-winner-title">${rd.winner.toUpperCase()} WINS!</div>
      <div class="hp-card-text" style="margin-top:8px">The first dummy into the volcano claims the million!</div>
    </div>`);
  }

  const totalSteps = steps.length;
  _ensureState(stateKey, totalSteps);
  const revIdx = _tvState[stateKey].idx;

  const stepsRendered = steps.map((html, i) =>
    `<div class="hp-step ${i <= revIdx ? 'hp-visible' : ''}" id="hp-step-summit-${i}">${html}</div>`
  ).join('');

  return _hpShell(`
    <div class="hp-section">${_icon('volcano')} SUMMIT SHOWDOWN</div>

    ${stepsRendered}

    ${_controls(stateKey, totalSteps)}
  `, ep, 'summit');
}

// ══════════════════════════════════════════════════════════════
// SCREEN 6: ENDINGS (Collapsible sections)
// ══════════════════════════════════════════════════════════════
export function rpBuildHPEndings(ep) {
  const rd = ep.hpRaceData;
  const tb = ep.hpTiebreaker;
  const finalists = ep.finaleFinalists || [];

  // Build FINAL THREE/TWO section
  const finalistDots = finalists.map(f => `<div class="hp-dot">
    ${portrait(f, 18)} <span>${f}</span>
    <span class="hp-pill ${f === rd?.winner ? 'hp-pill-gold' : f === tb?.loser ? 'hp-pill-danger' : 'hp-pill-info'}">${f === rd?.winner ? 'WINNER' : f === tb?.loser ? 'ELIMINATED' : f === ep.immunityWinner ? 'IMMUNE' : 'FINALIST'}</span>
  </div>`).join('');

  // Peanut gallery
  let benchHtml = '';
  if (ep.benchAssignments) {
    const allSupporters = new Set();
    const supporterMap = {};

    if (Array.isArray(Object.values(ep.benchAssignments)[0])) {
      // Format: { finalist: [supporters] }
      for (const [finalist, supporters] of Object.entries(ep.benchAssignments)) {
        for (const s of supporters) {
          allSupporters.add(s);
          supporterMap[s] = finalist;
        }
      }
    } else {
      // Format: { supporter: finalist }
      for (const [supporter, finalist] of Object.entries(ep.benchAssignments)) {
        if (finalists.includes(supporter)) continue; // skip finalists in old format
        allSupporters.add(supporter);
        supporterMap[supporter] = finalist;
      }
    }

    const sortedSupporters = [...allSupporters].sort((a, b) => {
      const fA = supporterMap[a] || '';
      const fB = supporterMap[b] || '';
      return fA.localeCompare(fB);
    });

    const colorMap = {};
    const finalistColors = ['var(--hp-red)', 'var(--hp-orange)', 'var(--hp-teal)'];
    finalists.forEach((f, i) => { colorMap[f] = finalistColors[i % finalistColors.length]; });

    benchHtml = `<div class="hp-dot-row">${sortedSupporters.map(s => {
      const supportedFinalist = supporterMap[s] || '?';
      const col = colorMap[supportedFinalist] || 'var(--hp-bone)';
      return `<div class="hp-dot" style="border-color:${col}">
        ${portrait(s, 18)}
        <span>${s}</span>
        <span style="font-size:8px;color:${col}">${_icon('heart')} ${supportedFinalist}</span>
      </div>`;
    }).join('')}</div>`;
    benchHtml += `<div style="font-size:10px;color:rgba(251,246,231,0.3);margin-top:4px">${allSupporters.size} supporter${allSupporters.size !== 1 ? 's' : ''} on the beach</div>`;
  }

  // Hazard log
  const hazards = rd?.hazardLog || [];
  let hazardRows = '';
  if (hazards.length) {
    hazardRows = hazards.map(h => {
      const pillClass = h.status === 'HIT' ? 'hp-pill-danger' :
                        h.status === 'DODGED' ? 'hp-pill-ok' :
                        h.status === 'CROSSED' ? 'hp-pill-info' :
                        h.status === 'BACKFIRE' ? 'hp-pill-warn' : 'hp-pill-info';
      return `<tr>
        <td>${_icon(h.name?.toLowerCase().includes('lava') ? 'lava' : h.name?.toLowerCase().includes('cage') ? 'trap' : h.name?.toLowerCase().includes('rope') ? 'rope' : 'fire')} ${h.name || 'Unknown'}</td>
        <td><span class="hp-pill ${pillClass}">${h.status || '?'}</span></td>
      </tr>`;
    }).join('');
  }

  // Collapsible toggle script inline with onclick
  const toggleId = id => `document.getElementById('${id}').classList.toggle('hp-collapse-open')`;

  return _hpShell(`
    <div class="hp-section">${_icon('crown')} AFTERMATH</div>

    <!-- FINAL THREE -->
    <div class="hp-collapse-open" id="hp-col-finalists" onclick="${toggleId('hp-col-finalists')}">
      <div class="hp-collapse-header">
        <span class="hp-collapse-arrow">${_icon('fire')}</span>
        FINAL ${finalists.length === 3 ? 'THREE' : 'TWO'}
      </div>
      <div class="hp-collapse-body" onclick="event.stopPropagation()">
        <div class="hp-dot-row">${finalistDots}</div>
      </div>
    </div>

    <!-- PEANUT GALLERY -->
    ${benchHtml ? `
    <div id="hp-col-bench" onclick="${toggleId('hp-col-bench')}">
      <div class="hp-collapse-header">
        <span class="hp-collapse-arrow">${_icon('megaphone')}</span>
        PEANUT GALLERY
      </div>
      <div class="hp-collapse-body" onclick="event.stopPropagation()">
        ${benchHtml}
      </div>
    </div>` : ''}

    <!-- HAZARD LOG -->
    ${hazards.length ? `
    <div id="hp-col-hazards" onclick="${toggleId('hp-col-hazards')}">
      <div class="hp-collapse-header">
        <span class="hp-collapse-arrow">${_icon('trap')}</span>
        HAZARD LOG
      </div>
      <div class="hp-collapse-body" onclick="event.stopPropagation()">
        <table class="hp-hazard-table">
          <thead><tr><th>HAZARD</th><th>STATUS</th></tr></thead>
          <tbody>${hazardRows}</tbody>
        </table>
      </div>
    </div>` : ''}

    <!-- PRIZE STATUS -->
    <div class="hp-collapse-open" id="hp-col-prize" onclick="${toggleId('hp-col-prize')}">
      <div class="hp-collapse-header">
        <span class="hp-collapse-arrow">${_icon('star')}</span>
        PRIZE STATUS
      </div>
      <div class="hp-collapse-body" onclick="event.stopPropagation()">
        <div style="display:flex;align-items:center;gap:12px;padding:8px">
          <div style="font-family:'Permanent Marker',cursive;font-size:28px;color:var(--hp-gold);text-shadow:0 0 12px rgba(255,209,102,0.3)">$1,000,000</div>
          <div>
            <div style="font-size:10px;color:rgba(251,246,231,0.4);letter-spacing:1px">STATUS</div>
            <div style="font-size:11px;color:var(--hp-orange);font-family:'Special Elite',cursive">${rd?.eruption?.triggered ? 'LAST SEEN ENTERING VOLCANO' : 'AWARDED TO WINNER'}</div>
          </div>
        </div>
        ${rd?.winner ? `<div style="font-size:11px;color:var(--hp-gold);padding:4px 8px">${_icon('crown')} Winner: <strong>${rd.winner}</strong></div>` : ''}
      </div>
    </div>

    <!-- WINNER CARD -->
    ${rd?.winner ? `
    <div class="hp-winner-card" style="margin-top:16px">
      <div style="margin-bottom:8px">${_avatarRing(rd.winner, 56, 'var(--hp-gold)')}</div>
      <div class="hp-winner-title">${_icon('crown')} SOLE SURVIVOR</div>
      <div style="font-family:'Permanent Marker',cursive;font-size:20px;color:var(--hp-bone);margin-top:4px">${rd.winner.toUpperCase()}</div>
      <div style="font-family:'Special Elite',cursive;font-size:12px;color:rgba(251,246,231,0.5);margin-top:8px">
        ${pick([
          `Against all odds. Against the volcano itself. ${rd.winner} stands alone.`,
          `The torch burns. The title is claimed. ${rd.winner} is the winner of Total Drama.`,
          `From day one to the final eruption. ${rd.winner}'s game was legendary.`,
          `The volcano chose its champion. ${rd.winner} walks away with everything.`,
        ])}
      </div>
    </div>` : ''}

    <div class="hp-flavor" style="margin-top:20px">${pick(TIKI_FLAVOR)}</div>
  `, ep, 'endings');
}
