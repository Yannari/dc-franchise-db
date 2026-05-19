// js/chal/hawaiian-punch.js — Hawaiian Punch finale VP builders (no simulation)
import { gs, players, seasonConfig } from '../core.js';
import { pStats, pronouns } from '../players.js';
import { getBond } from '../bonds.js';

// ── HELPERS ──
function host() { return seasonConfig?.hostName || 'Chris'; }
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
function portrait(name, size = 42) {
  if (!name || typeof name !== 'string') return '';
  const slug = players.find(p => p.name === name)?.slug || name.toLowerCase().replace(/\s+/g, '-');
  return `<img src="assets/avatars/${slug}.png" alt="${name}" style="width:${size}px;height:${size}px;object-fit:cover;flex-shrink:0" onerror="this.style.display='none'">`;
}
function arch(name) { return players.find(p => p.name === name)?.archetype || ''; }
function pr(name) { return pronouns(name); }
function faction(name) {
  const a = arch(name);
  if (['villain','mastermind','schemer'].includes(a)) return 'villain';
  if (['hero','loyal-soldier','social-butterfly','underdog','showmancer'].includes(a)) return 'hero';
  return 'wild';
}

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
      btns.forEach(b => { b.style.opacity = '0.4'; b.style.pointerEvents = 'none'; });
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
  _updateSidebar(screenKey);
}

export function hpRevealAll(screenKey, totalSteps) {
  const st = _ensureState(screenKey, totalSteps);
  st.idx = st.total - 1;
  const suffix = screenKey.replace('hp-', '');
  _reapplyVisibility(suffix, st.idx, st.total);
  _updateSidebar(screenKey);
}

function _updateSidebar(screenKey) {
  try {
    const suffix = screenKey.replace('hp-', '');
    const sideEl = document.getElementById(`hp-sidebar-inner-${suffix}`);
    if (!sideEl) return;
    const st = _tvState[screenKey];
    if (!st) return;
    if (!window._hpSidebarMap) return;
    const meta = window._hpSidebarMap[screenKey];
    if (!meta) return;
    const revealed = st.idx;
    const replaceMode = meta._replace;
    if (replaceMode) {
      if (typeof meta._rebuildFn === 'function') {
        sideEl.innerHTML = meta._rebuildFn(revealed);
      } else {
        let lastHtml = '';
        for (const m of meta) {
          const gate = typeof m.stepIdx === 'number' ? m.stepIdx : 0;
          if (gate <= revealed && m.html) lastHtml = m.html;
        }
        if (lastHtml) sideEl.innerHTML = lastHtml;
      }
    } else {
      let html = '';
      for (let i = 0; i < meta.length; i++) {
        const m = meta[i];
        const gate = typeof m.stepIdx === 'number' ? m.stepIdx : i;
        if (gate <= revealed && m.html) html += m.html;
      }
      if (html) sideEl.innerHTML = html;
    }
  } catch (e) { /* sidebar update non-critical */ }
}

// ══════════════════════════════════════════════════════════════
// CSS ICON SYSTEM
// ══════════════════════════════════════════════════════════════
function _icon(type) {
  const defs = {
    fire: `background:var(--hp-lava);clip-path:polygon(40% 100%,0% 55%,20% 30%,35% 50%,50% 0%,65% 50%,80% 30%,100% 55%,60% 100%)`,
    volcano: `background:var(--hp-lava-hot);clip-path:polygon(50% 0%,15% 100%,85% 100%)`,
    lava: `background:linear-gradient(180deg,var(--hp-magma),var(--hp-lava));clip-path:polygon(0% 0%,100% 0%,100% 60%,80% 80%,60% 65%,40% 85%,20% 70%,0% 80%)`,
    sword: `background:var(--hp-bone);clip-path:polygon(45% 0%,55% 0%,55% 60%,70% 65%,70% 75%,55% 70%,55% 85%,65% 90%,65% 100%,35% 100%,35% 90%,45% 85%,45% 70%,30% 75%,30% 65%,45% 60%)`,
    shield: `background:var(--hp-gold);clip-path:polygon(50% 100%,5% 30%,5% 0%,95% 0%,95% 30%)`,
    shark: `background:var(--hp-teal);clip-path:polygon(0% 50%,30% 30%,50% 0%,50% 30%,100% 40%,100% 60%,50% 70%,50% 100%,30% 70%)`,
    tiki: `background:var(--hp-lava-hot);clip-path:polygon(30% 0%,70% 0%,75% 15%,65% 20%,70% 35%,60% 40%,65% 55%,55% 60%,60% 75%,55% 100%,45% 100%,40% 75%,35% 60%,45% 55%,40% 40%,30% 35%,35% 20%,25% 15%)`,
    palm: `background:var(--hp-leaf);clip-path:polygon(45% 100%,55% 100%,55% 55%,90% 20%,85% 15%,55% 45%,55% 40%,80% 5%,72% 2%,50% 35%,30% 0%,22% 5%,45% 40%,45% 45%,15% 15%,10% 20%,45% 55%)`,
    crown: `background:var(--hp-gold);clip-path:polygon(0% 100%,0% 40%,20% 60%,35% 20%,50% 50%,65% 20%,80% 60%,100% 40%,100% 100%)`,
    skull: `background:var(--hp-bone);clip-path:polygon(20% 100%,20% 75%,5% 60%,0% 40%,5% 20%,20% 5%,40% 0%,60% 0%,80% 5%,95% 20%,100% 40%,95% 60%,80% 75%,80% 100%,65% 90%,50% 100%,35% 90%)`,
    wave: `background:var(--hp-teal);clip-path:polygon(0% 60%,10% 40%,25% 55%,40% 35%,55% 55%,70% 35%,85% 55%,100% 40%,100% 100%,0% 100%)`,
    rope: `background:var(--hp-bone);clip-path:polygon(0% 40%,15% 35%,30% 45%,45% 35%,60% 45%,75% 35%,90% 45%,100% 40%,100% 60%,90% 55%,75% 65%,60% 55%,45% 65%,30% 55%,15% 65%,0% 60%)`,
    dummy: `background:var(--hp-lava-hot);clip-path:polygon(35% 0%,65% 0%,60% 20%,70% 25%,65% 35%,55% 30%,55% 50%,75% 65%,70% 70%,55% 55%,55% 75%,65% 100%,55% 100%,50% 80%,45% 100%,35% 100%,45% 75%,45% 55%,30% 70%,25% 65%,45% 50%,45% 30%,35% 35%,30% 25%,40% 20%)`,
    trap: `background:var(--hp-magma);clip-path:polygon(10% 50%,0% 40%,20% 30%,10% 20%,30% 15%,25% 5%,50% 0%,75% 5%,70% 15%,90% 20%,80% 30%,100% 40%,90% 50%,100% 60%,80% 65%,85% 80%,65% 75%,60% 100%,40% 100%,35% 75%,15% 80%,20% 65%,0% 60%)`,
    star: `background:var(--hp-gold);clip-path:polygon(50% 0%,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)`,
    heart: `background:var(--hp-bruise);clip-path:polygon(50% 100%,0% 35%,0% 15%,15% 0%,35% 0%,50% 20%,65% 0%,85% 0%,100% 15%,100% 35%)`,
    bolt: `background:var(--hp-gold);clip-path:polygon(60% 0%,25% 45%,50% 45%,35% 100%,80% 50%,55% 50%)`,
    mountain: `background:var(--hp-ash);clip-path:polygon(50% 0%,0% 100%,100% 100%)`,
    fist: `background:var(--hp-lava-hot);clip-path:polygon(25% 100%,20% 60%,10% 55%,10% 35%,20% 30%,20% 20%,30% 15%,35% 20%,35% 15%,45% 10%,50% 15%,55% 10%,65% 15%,65% 20%,75% 25%,80% 40%,75% 55%,65% 60%,60% 100%)`,
    pineapple: `background:var(--hp-gold);clip-path:polygon(35% 40%,25% 45%,20% 60%,25% 80%,35% 95%,50% 100%,65% 95%,75% 80%,80% 60%,75% 45%,65% 40%,70% 30%,60% 15%,65% 5%,55% 0%,50% 10%,45% 0%,35% 5%,40% 15%,30% 30%)`,
    megaphone: `background:var(--hp-gold);clip-path:polygon(0% 35%,0% 65%,30% 65%,100% 100%,100% 0%,30% 35%)`,
    eye: `background:var(--hp-teal);clip-path:polygon(0% 50%,15% 25%,35% 10%,50% 5%,65% 10%,85% 25%,100% 50%,85% 75%,65% 90%,50% 95%,35% 90%,15% 75%)`,
    torch: `background:linear-gradient(180deg,var(--hp-gold),var(--hp-lava));clip-path:polygon(40% 100%,40% 40%,25% 35%,30% 20%,40% 30%,45% 10%,50% 0%,55% 10%,60% 30%,70% 20%,75% 35%,60% 40%,60% 100%)`,
    confetti: `background:var(--hp-gold);clip-path:polygon(10% 0%,30% 10%,20% 30%,50% 20%,40% 40%,70% 30%,60% 50%,90% 40%,80% 60%,100% 80%,70% 70%,80% 90%,50% 80%,60% 100%,30% 90%,40% 70%,10% 80%,20% 60%,0% 40%)`,
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
  'Somewhere in the jungle, a bird screams.',
  'The air tastes of sulfur and ambition.',
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
  (a, b) => `Sudden death. The sharks below seem to sense it. ${a} and ${b} set their stances.`,
];

const SHARK_BEAT = [
  n => `A fin circles below. ${n} pretends not to notice.`,
  n => `Something bumps the platform from underneath. ${n}'s eyes go wide.`,
  n => `The water churns. A shadow passes beneath ${n}'s feet.`,
  n => `A dorsal fin slices past. ${n} edges toward the center of the platform.`,
];

const CROWD_CHEER = [
  (c, t) => `${c} screams from the shore: "COME ON, ${t.toUpperCase()}! YOU GOT THIS!"`,
  (c, t) => `${c} is on ${pr(c).posAdj} feet, fists pumping. All in on ${t}.`,
  (c, t) => `${c} starts a chant. "LET'S GO ${t.toUpperCase()}!" Others join in.`,
  (c, t) => `${c} bangs two coconuts together. The rhythm catches on. ${t} feeds off the energy.`,
];

const CROWD_HECKLE = [
  (c, t) => `${c} cups ${pr(c).posAdj} hands: "YOU'RE DONE, ${t.toUpperCase()}!"`,
  (c, t) => `${c} watches through ${pr(c).posAdj} fingers. "${t} is finished."`,
  (c, t) => `${c} shakes ${pr(c).posAdj} head slowly. "Saw this coming a mile away."`,
  (c, t) => `${c} turns to the person next to ${pr(c).obj}. "${t}'s got nothing left."`,
];

const HOST_LINES = [
  () => `${host()} leans toward the camera. "I give that a solid eight out of ten on the pain scale."`,
  () => `"Somebody is going to get VERY hurt," ${host()} observes cheerfully.`,
  () => `${host()} adjusts ${pr(host()).posAdj || 'his'} sunglasses. "This is why I love this job."`,
  () => `"We'll be right back," says ${host()}, "assuming there's anyone LEFT to come back to."`,
  () => `${host()} whistles. "That's going to leave a mark. Several marks, actually."`,
  () => `"Drama. Violence. Property damage." ${host()} counts on ${pr(host()).posAdj || 'his'} fingers. "We got all three."`,
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
  (n, s) => s > 5 ? `${n} picks the safest crossing and lands clean on the far side.` : `${n} dangles over the lava river for a terrifying three seconds.`,
];

const SUMMIT_ARRIVE = [
  (l, t) => `${l} reaches the summit first. ${t} is close behind, gasping for air.`,
  (l, t) => `${l} crests the ridge. Below, the crater glows. ${t} scrambles up seconds later.`,
  (l, t) => `Both racers reach the caldera rim. ${l} arrived first. ${t} is right there.`,
  (l, t) => `${l} plants ${pr(l).posAdj} dummy at the crater's edge. ${t} staggers up behind.`,
];

const MIND_GAME_ATK = {
  'taunt-provocation': [
    (att, def) => `${att} gets in ${def}'s face. "You don't deserve to be here."`,
    (att, def) => `${att}: "Nobody's rooting for you. Look around."`,
    (att, def) => `${att} laughs. "You peaked three episodes ago, ${def}."`,
    (att, def) => `${att} locks eyes with ${def}. "I've been carrying you all season."`,
  ],
  'emotional-manipulation': [
    (att, def) => `${att} drops ${pr(att).posAdj} voice. "Remember what you promised me? Remember the alliance?"`,
    (att, def) => `${att}'s eyes well up. "I thought we were friends, ${def}. I thought this MEANT something."`,
    (att, def) => `${att}: "Do you even remember why you came here? Because I do. And this isn't it."`,
    (att, def) => `${att} whispers something only ${def} can hear. ${def}'s expression changes.`,
  ],
  'desperate-plea': [
    (att, def) => `${att} reaches out. "Please. Just... let me have this one thing."`,
    (att, def) => `${att}'s voice cracks. "I have NOTHING outside this game. ${def}, please."`,
    (att, def) => `${att} drops to one knee. The crowd goes silent. "${def}. I'm begging you."`,
    (att, def) => `${att}: "You've already won everything. Give me this. Just this."`,
  ],
};

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

const ASSISTANT_CHEM_GOOD = [
  (h, f) => `${h} and ${f} work together like a well-oiled machine. Years of trust.`,
  (h, f) => `${h} knows exactly what ${f} needs before ${pr(f).sub} asks. Bond: strong.`,
  (h, f) => `${h} hands ${f} the next piece without being asked. They're in sync.`,
  (h, f) => `"Remember episode three?" ${h} grins. ${f} nods. They have a plan.`,
];

const ASSISTANT_CHEM_BAD = [
  (h, f) => `${h} passes ${f} the wrong piece. ${f} glares. The chemistry is... off.`,
  (h, f) => `${h} and ${f} keep bumping into each other. Not exactly a dream team.`,
  (h, f) => `${h} holds the frame while ${f} ties knots. The frame collapses. "Whose fault was that?"`,
  (h, f) => `${h} tries to help but ${f} waves ${pr(h).obj} away. "I'll do it myself."`,
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

const DUMMY_INSULT = [
  (n, rival) => `${n} looks at ${rival}'s dummy and laughs. "Is that supposed to be a PERSON?"`,
  (n, rival) => `${n}: "My dummy has more personality than ${rival}'s. And mine doesn't have a face."`,
  (n, rival) => `${n} glances at ${rival}'s dummy. "Looks like ${rival} built it in the dark." ${pr(n).Sub} did.`,
  (n, rival) => `${n} points at ${rival}'s creation. "That's not a dummy. That's an abstract sculpture."`,
];

const BENCH_RALLY = [
  (finalist, ct) => `The bench squad erupts! "${finalist.toUpperCase()}! ${finalist.toUpperCase()}!" All ${ct} voices thundering.`,
  (finalist, ct) => `${ct} supporters on the sideline lose their minds. The energy is electric.`,
  (finalist, ct) => `The ground itself seems to pulse with ${ct} people stomping for ${finalist}.`,
  (finalist, ct) => `"WE BELIEVE!" the bench roars. ${finalist} hears it. ${pr(finalist).Sub} pushes harder.`,
];

const DISTRACTION_PLAY = [
  (att, def, ref, success) => success
    ? `${att} brings up ${ref} to throw ${def} off. It WORKS -- ${def} loses focus for a crucial second.`
    : `${att} tries to rattle ${def} by mentioning ${ref}. ${def} doesn't take the bait.`,
  (att, def, ref, success) => success
    ? `${att} shouts something about ${ref}. ${def} whips around. Distraction: successful.`
    : `${att} drops ${ref}'s name mid-crossing. ${def} ignores it completely. Nice try.`,
  (att, def, ref, success) => success
    ? `"Hey ${def}! ${ref} told me what you REALLY think!" ${def} freezes. That cost ${pr(def).obj}.`
    : `${att} invokes ${ref} to break ${def}'s concentration. ${def}: "Not now." Unshakable.`,
  (att, def, ref, success) => success
    ? `${att}'s reference to ${ref} hits a nerve. ${def} stumbles on the next rope.`
    : `${att} mentions ${ref}. ${def} smirks. "I expected better from you."`,
];

const COUNTER_BLOCK = [
  (w, l, b) => `${w} intercepts ${l}'s move! ${b} is safe.`,
  (w, l, b) => `${w} reads ${l}'s play and shuts it DOWN. ${b} keeps going unharmed.`,
  (w, l, b) => `${w} blocks ${l} with a body feint. ${b}: "Thanks!"`,
  (w, l, b) => `${w} steps between ${l} and ${b}. "Not on my watch."`,
];

const GATHER_NARR = {
  winner: [
    (n, a) => ['challenge-beast', 'hero'].includes(a) ? `${n} rips through the supply pile with machine-like efficiency. Bamboo, rope, pineapples — sorted in seconds.` :
      ['mastermind', 'schemer'].includes(a) ? `${n} methodically selects the strongest materials while pretending to browse casually.` :
      ['underdog', 'goat'].includes(a) ? `${n} finds a perfect coconut husk hidden under debris. Lucky break — or instinct?` :
      `${n} gets first pick of materials. The best bamboo, the thickest rope, the freshest pineapple.`,
    (n, a) => `${n} moves through the supply station like ${pr(n).sub}'s done this before. Arms full in under a minute.`,
    (n, a) => `${n} grabs materials with purpose. Every piece selected, not grabbed. This is calculated.`,
    (n, a) => `While the other racer hesitates, ${n} locks in the premium bamboo and double-braided rope.`,
  ],
  loser: [
    (n, a) => ['hothead', 'chaos-agent'].includes(a) ? `${n} grabs whatever's closest. Strategy? What strategy?` :
      ['floater', 'goat'].includes(a) ? `${n} stares at the supply pile like it's a puzzle with no solution.` :
      `${n} arrives second. The good rope is gone. ${pr(n).Sub} makes do with what's left.`,
    (n, a) => `${n} fumbles through the scraps. The premium materials are already claimed.`,
    (n, a) => `${n} picks up a bamboo rod. It snaps. ${pr(n).Sub} picks up another. Also snaps. Not great.`,
    (n, a) => `${n} settles for second-tier materials. ${pr(n).Sub} can feel the deficit already.`,
  ],
};

const BUILD_MISHAP_NARR = {
  'rage-break': [
    n => `${n} snaps a critical support beam in frustration. ${pr(n).Sub} has to start the torso over.`,
    n => `${n} punches the dummy's head clean off. "COME ON!" Deep breath. Reattach.`,
    n => `${n} kicks the workstation. Materials fly. ${pr(n).Sub} has to collect them again.`,
    n => `${n}'s rage builds until the entire frame collapses. Three minutes wasted.`,
  ],
  'comical-fail': [
    n => `${n} ties the arm on backward. The dummy looks like it's doing yoga.`,
    n => `${n} steps on ${pr(n).posAdj} own rope. The dummy falls on ${pr(n).obj}. Under it now.`,
    n => `${n}'s dummy has two left arms and no head. This is... not going well.`,
    n => `The pineapple head rolls off for the fourth time. ${n} just stares at it.`,
  ],
  'brute-force': [
    n => `${n} tries to muscle the frame together. The bindings strain. Close to snapping.`,
    n => `${n} treats construction like a contact sport. Effective but messy — joints are crooked.`,
    n => `${n} forces pieces that don't fit. The dummy holds, but only barely.`,
    n => `Subtlety isn't ${n}'s approach. ${pr(n).Sub} jams bamboo together by sheer strength.`,
  ],
  fumble: [
    n => `${n} drops a critical piece and scrambles to recover it. Lost time.`,
    n => `${n}'s binding slips loose. The frame sags. Quick repair needed.`,
    n => `The rope tangles in ${n}'s hands. Precious seconds tick by.`,
    n => `${n} misreads the joint order and has to disassemble a section.`,
  ],
};

const BUILD_IMPRESSIVE_NARR = [
  (n, a) => ['mastermind', 'schemer', 'perceptive-player'].includes(a) ? `${n} builds with surgical precision. Every joint reinforced, every angle calculated. The dummy stands rock-solid.` :
    ['challenge-beast', 'hero'].includes(a) ? `${n} powers through construction like a machine. Physical strength meets surprising craftsmanship.` :
    `${n}'s dummy is taking shape beautifully. Proportional, stable, and ready for the climb.`,
  (n, a) => `${n} steps back and nods. The structure is solid. The pineapple head sits perfectly.`,
  (n, a) => `${n}'s dummy could pass for a real person from twenty feet away. Impressive work.`,
  (n, a) => `The dummy stands upright on its own. ${n} didn't even need the kickstand.`,
];

const DUMMY_QUALITY_NARR = {
  blowout: [
    (w, l) => `${w}'s dummy is a masterpiece. ${l}'s looks like modern art — and not the good kind.`,
    (w, l) => `No contest. ${w}'s dummy is structurally sound. ${l}'s is barely standing.`,
    (w, l) => `The gap in craftsmanship is staggering. ${w} dominated this phase.`,
  ],
  clear: [
    (w, l) => `${w}'s dummy is clearly the better build. ${l}'s will hold, but it's not pretty.`,
    (w, l) => `${w} takes Phase 1 with a solid lead. ${l}'s dummy wobbles when the wind hits it.`,
    (w, l) => `${w} finishes first with a quality build. ${l} is still tying the last arm on.`,
  ],
  close: [
    (w, l) => `Both dummies are comparable. ${w} edges it out, but only by the slimmest margin.`,
    (w, l) => `This could have gone either way. ${w} wins Phase 1, but ${l} is RIGHT there.`,
    (w, l) => `Photo finish on the build. ${w} clips ${l} by a fraction of a second.`,
  ],
};

const EARLY_CLIMB_NARR = {
  strong: [
    (n, a) => ['challenge-beast'].includes(a) ? `${n} attacks the volcano trail like ${pr(n).sub} was born on a mountain. Pure power.` :
      ['hero', 'loyal-soldier'].includes(a) ? `${n} sets a punishing pace, head down, legs pumping. Determined.` :
      `${n} charges up the initial slope. Strong footing. Good rhythm.`,
    (n, a) => `${n} makes the first hundred meters look easy. The wheelbarrow bounces but holds.`,
  ],
  steady: [
    (n, a) => `${n} finds a sustainable pace. Not flashy, but the kind that wins races.`,
    (n, a) => `${n} is making progress. Not the fastest start, but ${pr(n).sub}'s conserving energy.`,
  ],
  struggling: [
    (n, a) => ['goat', 'floater'].includes(a) ? `${n} is already gasping. The incline is brutal and the wheelbarrow feels like it weighs a thousand pounds.` :
      `${n} stumbles on loose volcanic gravel. The climb is steeper than it looked from the beach.`,
    (n, a) => `${n} pushes the wheelbarrow three feet and stops. Pushes again. Stops. This is going to be long.`,
  ],
};

const FINAL_PUSH_NARR = {
  strong: [
    (n, a) => ['challenge-beast', 'hero'].includes(a) ? `${n} SURGES for the summit ridge. ${pr(n).Sub} finds a gear nobody knew ${pr(n).sub} had.` :
      ['underdog'].includes(a) ? `${n} digs deep. The underdog finds reserves when it matters most.` :
      `${n} accelerates through the final stretch. Pure willpower.`,
    (n, a) => `${n} puts ${pr(n).posAdj} head down and SPRINTS the last section. The wheelbarrow bounces wildly.`,
  ],
  weak: [
    (n, a) => ['goat', 'floater'].includes(a) ? `${n}'s legs give out on the final push. ${pr(n).Sub} crawls the last few meters.` :
      `${n} hits the wall. The final stretch feels like it goes on forever.`,
    (n, a) => `${n}'s pace drops to a crawl. Every step is agony. The dummy feels heavier with each meter.`,
  ],
};

const RIVAL_RESPECT_NARR = [
  (lead, trail) => `${lead} looks back at ${trail}. A nod. No words needed. They both know what this means.`,
  (lead, trail) => `${lead} slows for a half-second. Not to taunt — to acknowledge. ${trail} returns the look.`,
  (lead, trail) => `Even in competition, ${lead} can't help but respect ${trail}'s fight. This is what a finale should be.`,
  (lead, trail) => `${lead} glances down at ${trail}. "You're still in this." It's not mockery. It's the truth.`,
];

const FOCUSED_CLIMB_NARR = [
  (n, a) => `${n} doesn't look back. Doesn't taunt. Doesn't breathe. Just climbs.`,
  (n, a) => `${n} is locked in. The rest of the world doesn't exist right now.`,
  (n, a) => `${n} blocks out the crowd, the lava, the competition. Pure tunnel vision.`,
  (n, a) => `${n}'s face says everything: this is not a game anymore. This is survival.`,
];

const BENCH_INTERF_NARR = {
  hostile: [
    (interf, target) => `${interf} "accidentally" rolls a coconut onto the trail. ${target} has to swerve.`,
    (interf, target) => `${interf} shouts misleading directions. "${target}, LEFT!" There IS no left path.`,
    (interf, target) => `${interf} throws a vine across the trail. ${target}'s wheelbarrow catches it.`,
    (interf, target) => `${interf} kicks debris downhill toward ${target}. "Oops. Gravity."`,
  ],
  helpful: [
    (interf, helped) => `${interf} clears rocks off the path ahead of ${helped}. Teamwork from the sideline.`,
    (interf, helped) => `"The left path is faster!" ${interf} shouts to ${helped}. Genuine intel.`,
    (interf, helped) => `${interf} stamps down loose gravel so ${helped}'s wheelbarrow rolls smoother.`,
    (interf, helped) => `${interf} coaches ${helped} through a tricky switchback. "Lean LEFT, then push!"`,
  ],
};

const LAVA_APPROACH_NARR = {
  calculated: [
    (n, a) => ['mastermind', 'perceptive-player', 'schemer'].includes(a) ? `${n} studies the rope layout like a chess board. Counting traps, mapping safe routes, calculating angles.` :
      `${n} reads the lava field carefully before committing. Smart.`,
    (n, a) => `${n} takes a breath, scans the ropes, and picks a line. ${pr(n).Sub} can see which ones are rigged.`,
  ],
  cautious: [
    (n, a) => `${n} approaches the lava field with care. Testing each rope before putting weight on it.`,
    (n, a) => `${n} inches toward the crossing. The heat hits like a wall. ${pr(n).Sub} grips the first rope.`,
  ],
  reckless: [
    (n, a) => ['hothead', 'chaos-agent'].includes(a) ? `${n} CHARGES into the lava field without checking a single rope. Bold or stupid — time will tell.` :
      `${n} grabs the first rope and swings. No planning. No caution. Just GO.`,
    (n, a) => `${n} doesn't even look before leaping. The heat singes ${pr(n).posAdj} eyebrows. Worth it? Unknown.`,
  ],
};

const HEAT_WAVE_NARR = {
  panicked: [
    (n, a) => ['hothead'].includes(a) ? `${n} screams profanity at the lava. The lava doesn't care. ${pr(n).Sub} loses ${pr(n).posAdj} grip for a terrifying second.` :
      ['goat', 'floater'].includes(a) ? `${n} freezes up as a geyser erupts nearby. Can't move. The heat is overwhelming.` :
      `The lava intensity spikes. ${n} flinches. ${pr(n).PosAdj} hands shake on the rope.`,
    (n, a) => `${n}'s face goes white — or as white as it can in this heat. The crossing just got harder.`,
  ],
  calm: [
    (n, a) => ['challenge-beast', 'hero'].includes(a) ? `A lava geyser erupts six feet from ${n}. ${pr(n).Sub} doesn't even blink. Built for this.` :
      `${n} pushes through the heat wave. Sweat pours, but ${pr(n).posAdj} grip is iron.`,
    (n, a) => `${n} treats the temperature spike like weather. Uncomfortable but manageable.`,
  ],
};

const DUMMY_CONDITION_NARR = {
  heavy: [
    (n) => `${n}'s dummy is barely recognizable. Both arms gone, pineapple head cracked. It's a stick with ambition.`,
    (n) => `${n} arrives at the far side holding what used to be a dummy. It's now a abstract sculpture.`,
  ],
  light: [
    (n) => `${n}'s dummy took a hit but it's still standing. One arm dangles, but the core holds.`,
    (n) => `${n}'s dummy has a new dent. Character-building, some might say.`,
  ],
  intact: [
    (n) => `${n}'s dummy crosses the lava field unscathed. Clean crossing.`,
    (n) => `Not a scratch on ${n}'s dummy. The ropes did their job.`,
  ],
};

const SUMMIT_ARRIVAL_NARR = {
  leader: [
    (n, a, gap) => ['challenge-beast', 'hero'].includes(a) ? `${n} crests the summit ridge first. ${pr(n).Sub} plants the dummy and turns back — eyes burning. The gap: ${gap} points.` :
      ['villain', 'mastermind'].includes(a) ? `${n} reaches the summit with cold composure. ${pr(n).Sub} surveys the crater like it's already ${pr(n).pos}. Lead: ${gap} points.` :
      `${n} reaches the caldera rim first. Gasping. Trembling. But first. Lead: ${gap} points.`,
    (n, a, gap) => `${n} staggers to the summit. The crater glows below. ${pr(n).Sub}'s ahead by ${gap} points.`,
  ],
  trailer: [
    (n, a) => ['underdog'].includes(a) ? `${n} hauls the dummy over the last ridge. Behind, but not broken. This is ${pr(n).posAdj} story.` :
      ['hothead', 'chaos-agent'].includes(a) ? `${n} arrives at the summit in a fury. Behind? BEHIND? Not for long.` :
      `${n} scrambles up seconds later. Close. So close. But not first.`,
    (n, a) => `${n} reaches the caldera rim. Both racers at the edge. The volcano rumbles.`,
  ],
};

const BENCH_ERUPTION_NARR = {
  winning: [
    (n, a) => `${n} is screaming ${pr(n).posAdj} lungs out from the sideline. "${pr(n).posAdj.toUpperCase()} PERSON is winning!"`,
    (n, a) => `${n} jumps up and down. Full victory dance before victory is declared. Premature but electric.`,
  ],
  losing: [
    (n, a) => `${n}'s face falls. ${pr(n).PosAdj} finalist is behind. But ${pr(n).sub} won't stop chanting.`,
    (n, a) => `${n} screams encouragement through cupped hands. "YOU CAN STILL DO THIS!"`,
  ],
};

const MIND_GAME_ATTEMPT_NARR = {
  'emotional-manipulation': [
    (att, def) => `${att} gets close to ${def}. Voice drops to a whisper. This isn't about the race anymore — it's about their history.`,
    (att, def) => `${att} brings up a memory. Something shared. Something ${def} didn't expect to hear right now.`,
    (att, def) => `${att}'s eyes glisten. Real? Fake? ${def} can't tell. That's the point.`,
    (att, def) => `"Remember what you said in week three?" ${att} asks. ${def} does. ${def} wishes ${pr(def).sub} didn't.`,
  ],
  'taunt-provocation': [
    (att, def) => `${att} gets in ${def}'s face. Not whispering. SHOUTING. "You don't DESERVE to be here!"`,
    (att, def) => `${att} laughs right at ${def}. "This is it? THIS is the big finale threat? Pathetic."`,
    (att, def) => `${att} kicks volcanic rock at ${def}'s feet. "You peaked three episodes ago."`,
    (att, def) => `"Nobody on that bench is rooting for you," ${att} snarls. "Look at their faces."`,
  ],
  'strategic-doubt': [
    (att, def) => `${att}: "You know they only kept you because you were useful. Not because they liked you."`,
    (att, def) => `${att} starts listing names. Alliances ${def} broke. Promises ${def} made and forgot.`,
    (att, def) => `"Every vote against you? I orchestrated them. And you never even noticed." ${att} lets that sink in.`,
    (att, def) => `${att} questions everything. ${def}'s strategy. ${def}'s alliances. ${def}'s reason for being here.`,
  ],
  'desperate-plea': [
    (att, def) => `${att}'s voice cracks. "Please. You know what this means to me. You KNOW."`,
    (att, def) => `${att} drops the game face. Raw emotion. "I need this more than you do."`,
    (att, def) => `${att} appeals to everything they've been through. The journey. The bond. The late-night talks.`,
    (att, def) => `"If you ever cared about me at all... you'll let me have this moment." ${att} means it.`,
  ],
};

const MIND_GAME_RESULT_NARR = {
  success: [
    (def, att) => `${def}'s hands shake. The dummy wobbles. Something in ${pr(def).posAdj} eyes breaks. ${att}'s words hit home.`,
    (def, att) => `${def} stumbles. Not physically — mentally. The confidence is gone. ${att} smells blood.`,
    (def, att) => `${def} looks away first. Fatal. ${att} surges past in the moment of hesitation.`,
    (def, att) => `The words land. ${def}'s grip loosens on the dummy. ${att} doesn't waste the opening.`,
  ],
  failure: [
    (def, att) => `${def} looks ${att} dead in the eye. "Is that all you've got?" Unbreakable.`,
    (def, att) => `${def} turns away from ${att} without a word. Ice cold. The mind game bounced off.`,
    (def, att) => `${def} smirks. "Nice try." And keeps moving. ${att}'s gambit failed completely.`,
    (def, att) => `${def}'s jaw tightens, but ${pr(def).posAdj} grip stays firm. "Not today." ${att} wasted the shot.`,
  ],
};

const SPRINT_FINISH_NARR = [
  (lead, trail) => `No mind games. No tricks. Just two racers sprinting for the crater with dummies on their backs. Pure willpower.`,
  (lead, trail) => `The final meters are silent except for footsteps and heavy breathing. ${lead} and ${trail} give everything.`,
  (lead, trail) => `Both racers charge the crater. The volcano rumbles beneath them. This is it.`,
  (lead, trail) => `No words left. No strategies. Just the crater, the dummies, and two people who refuse to lose.`,
];

const THROW_NARR = {
  winner: [
    (n, a) => ['challenge-beast', 'hero'].includes(a) ? `${n} LAUNCHES the dummy with a primal scream. It arcs through the smoke and DISAPPEARS into the crater. THE VOLCANO ERUPTS!` :
      ['villain', 'mastermind'].includes(a) ? `${n} calmly walks to the edge, looks back at the competition one last time, and pushes the dummy in. The volcano responds.` :
      ['underdog'].includes(a) ? `${n} can barely lift the dummy. But ${pr(n).sub} does. And ${pr(n).sub} throws it. And the volcano ANSWERS.` :
      `${n} heaves the dummy with everything left. It tumbles into the glowing crater. BOOM.`,
    (n, a) => `${n} swings the dummy overhead and releases. The pineapple head catches fire mid-air. The ground shakes.`,
    (n, a) => `With a roar that matches the volcano's, ${n} sends the dummy into the abyss. THE ISLAND SHAKES.`,
    (n, a) => `${n} plants ${pr(n).posAdj} feet, grips the dummy, and THROWS. The crater swallows it. Fire answers.`,
  ],
  loser: [
    (n, a) => ['hothead'].includes(a) ? `${n} throws ${pr(n).posAdj} dummy in anyway. Out of spite. The volcano barely notices.` :
      ['underdog', 'goat'].includes(a) ? `${n} sits down at the crater's edge. The dummy slumps next to ${pr(n).obj}. It's over.` :
      `${n}'s dummy slides into the crater moments later. But moments are everything in a finale.`,
    (n, a) => `${n} stands at the rim. The dummy in ${pr(n).posAdj} arms. ${pr(n).Sub} didn't throw first. ${pr(n).Sub} lost.`,
    (n, a) => `${n} watches ${pr(n).posAdj} dummy tumble into the lava. Second place. The hardest place.`,
  ],
};

const LOSER_REACT_NARR = {
  flipped: [
    (loser, winner) => `${loser} can't believe it. ${pr(loser).Sub} was AHEAD. ${pr(loser).Sub} had the lead. And then ${winner} got inside ${pr(loser).posAdj} head.`,
    (loser, winner) => `${loser} stands at the crater in shock. The mind game worked. ${winner} stole this from ${pr(loser).obj}.`,
  ],
  normal: [
    (loser, winner, a) => ['loyal-soldier', 'hero'].includes(a) ? `${loser} nods to ${winner}. "You earned it." Graceful in defeat.` :
      ['villain', 'hothead'].includes(a) ? `${loser} kicks a rock into the crater. "${winner} got lucky. That's all this was. LUCK."` :
      ['underdog', 'goat'].includes(a) ? `${loser}'s eyes fill. Not anger. Not regret. Just the weight of coming SO close.` :
      `${loser} watches the lava glow where ${pr(loser).posAdj} dummy disappeared. Second place. Again.`,
    (loser, winner, a) => `${loser} collapses to ${pr(loser).posAdj} knees at the crater's edge. The volcano doesn't care who's second.`,
  ],
};

// ══════════════════════════════════════════════════════════════
// STAT DISPLAY + CARDS
// ══════════════════════════════════════════════════════════════
const STAT_LABELS = [
  { key: 'social', label: 'SOCIAL' },
  { key: 'physical', label: 'PHYSICAL' },
  { key: 'strategic', label: 'STRATEGIC' },
  { key: 'mental', label: 'MENTAL' },
];

function _statBars(name) {
  const s = pStats(name);
  const fac = faction(name);
  const fillCls = fac === 'hero' ? 'h' : fac === 'villain' ? 'v' : 'w';
  return STAT_LABELS.map(sd => {
    const val = s[sd.key] || 5;
    const pct = Math.min(100, Math.max(5, val * 10));
    return `<div class="hp-stat-row">
      <span class="hp-stat-label">${sd.label}</span>
      <div class="hp-stat-bar"><div class="hp-stat-fill ${fillCls}" style="width:${pct}%"></div></div>
    </div>`;
  }).join('');
}

const ARCHETYPE_DESC = {
  mastermind: 'The Puppet Master', schemer: 'The Backstabber', hothead: 'The Powder Keg',
  'challenge-beast': 'The Machine', 'social-butterfly': 'The Diplomat', 'loyal-soldier': 'The Shield',
  wildcard: 'The Unpredictable', 'chaos-agent': 'The Anarchist', floater: 'The Ghost',
  underdog: 'The Long Shot', hero: 'The Champion', villain: 'The Menace',
  goat: 'The Passenger', 'perceptive-player': 'The Observer', showmancer: 'The Heartbreaker',
};

function _finalistPanel(name, idx) {
  const a = arch(name);
  const fac = faction(name);
  const desc = ARCHETYPE_DESC[a] || 'Competitor';
  return `<div class="hp-finalist" data-fac="${fac}">
    <div class="hp-finalist-rank">SEED ${String(idx + 1).padStart(2, '0')}</div>
    <div class="hp-av xl" data-fac="${fac}">${portrait(name, 72)}</div>
    <div class="hp-finalist-name">${name}</div>
    <div class="hp-finalist-archetype">${desc} · ${a.replace(/-/g, ' ')}</div>
    <div class="hp-finalist-meter">${_statBars(name)}</div>
  </div>`;
}

function _avatarBadge(name, size = 'sm') {
  if (!name || typeof name !== 'string') return '<div class="hp-av sm">?</div>';
  const fac = faction(name);
  const px = size === 'xl' ? 72 : size === 'lg' ? 52 : size === 'sm' ? 28 : 38;
  return `<div class="hp-av ${size}" data-fac="${fac}">${portrait(name, px)}</div>`;
}

// ══════════════════════════════════════════════════════════════
// CONTROLS BUILDER
// ══════════════════════════════════════════════════════════════
function _controls(screenKey, totalSteps) {
  const suffix = screenKey.replace('hp-', '');
  return `<div class="hp-controls" id="hp-controls-${suffix}">
    <button class="hp-ctrl-btn hp-btn" onclick="hpRevealNext('${screenKey}',${totalSteps})">
      NEXT ▸
    </button>
    <span class="hp-counter" id="hp-counter-${suffix}">0 / ${totalSteps}</span>
    <button class="hp-ctrl-btn hp-btn primary" onclick="hpRevealAll('${screenKey}',${totalSteps})">
      REVEAL ALL
    </button>
  </div>`;
}

// ══════════════════════════════════════════════════════════════
// SHELL WRAPPER — matches mockup exactly
// ══════════════════════════════════════════════════════════════
function _hpShell(content, ep, activeTab = 'title', phaseCls = '') {
  const tabs = [
    { id: 'title', num: '00', label: 'TITLE' },
    { id: 'tiebreaker', num: '01', label: 'TIEBREAKER' },
    { id: 'joust', num: '02', label: 'JOUST' },
    { id: 'volcano', num: '03', label: 'VOLCANO RACE' },
    { id: 'summit', num: '04', label: 'SUMMIT' },
    { id: 'endings', num: '05', label: 'ENDINGS' },
  ];

  const tabHtml = tabs.map(t =>
    `<div class="hp-tab${t.id === activeTab ? ' active' : ''}"><span class="num">${t.num}</span>${t.label}</div>`
  ).join('');

  // Deterministic ember positions
  const embers = Array.from({ length: 20 }, (_, i) => {
    const left = 5 + ((i * 23 + 7) % 85);
    const size = 2 + (i % 3);
    const dur = 5 + (i % 6);
    const delay = (i * 0.5) % 4;
    return `<div class="hp-ember" style="left:${left}%;width:${size}px;height:${size}px;animation-duration:${dur}s;animation-delay:${delay}s"></div>`;
  }).join('');

  // Stars
  const stars = Array.from({ length: 40 }, (_, i) => {
    const x = (i * 37 + 11) % 100;
    const y = (i * 23 + 5) % 55;
    const s = 1 + (i % 3);
    const d = (i * 0.7) % 3;
    return `<div class="hp-star" style="left:${x}%;top:${y}%;width:${s}px;height:${s}px;animation-delay:${d}s"></div>`;
  }).join('');

  // Waves
  const waves = Array.from({ length: 5 }, (_, i) =>
    `<div class="hp-wave" style="bottom:${10 + i * 20}px;animation-delay:${i * 1.6}s;opacity:${0.35 - i * 0.05}"></div>`
  ).join('');

  // Shark fins
  const fins = Array.from({ length: 3 }, (_, i) =>
    `<div class="hp-fin" style="animation-duration:${18 + i * 5}s;animation-delay:${i * 4}s;bottom:${5 + i * 10}px"></div>`
  ).join('');

  const epNum = gs.episodeHistory ? gs.episodeHistory.length : '?';
  const tickerText = `★ HAWAIIAN PUNCH — THE FINALE ★ EPISODE ${epNum} ★ ${host().toUpperCase()} PRESENTS ★ ONE MILLION DOLLAR PRIZE AT STAKE ★ THE VOLCANO STIRS ★ LAVA RIVER CONFIRMED ★`;

  const phase = phaseCls || activeTab;

  return `
<div class="hp-shell-wrap" data-phase="${phase}">
<style>
@import url('https://fonts.googleapis.com/css2?family=Bungee+Inline&family=Anton&family=Press+Start+2P&family=Inter:wght@400;500;600;700;900&family=Special+Elite&display=swap');

:root{
  --hp-night:#0a1929;
  --hp-deep:#06111c;
  --hp-ocean:#0e3a4e;
  --hp-teal:#1aa7a7;
  --hp-teal-deep:#0e6c6c;
  --hp-sand:#f3e7c9;
  --hp-sand-warm:#f7d59a;
  --hp-lava:#ff5a1f;
  --hp-lava-hot:#ff8a3b;
  --hp-magma:#c4182f;
  --hp-magma-deep:#7a0b1d;
  --hp-gold:#ffb547;
  --hp-gold-hot:#ffd166;
  --hp-leaf:#1f7a4a;
  --hp-leaf-deep:#0e4a2d;
  --hp-bone:#fbf6e7;
  --hp-ash:#2a2530;
  --hp-bruise:#ff3b6b;
}
.hp-shell-wrap{max-width:1100px;margin:0 auto;font-family:'Inter',sans-serif;color:var(--hp-bone);position:relative;min-height:100vh;}
.hp-shell-wrap *{box-sizing:border-box;}

/* ═════════════ BROADCAST CHROME ═════════════ */
.hp-chrome{position:absolute;top:0;left:0;right:0;z-index:100;height:36px;
  background:linear-gradient(90deg,#000 0%,var(--hp-magma-deep) 35%,#000 100%);
  border-bottom:2px solid var(--hp-gold);display:flex;align-items:center;justify-content:space-between;padding:0 14px;font-size:11px;}
.hp-live{display:flex;align-items:center;gap:6px;color:#ff5252;text-transform:uppercase;letter-spacing:2px;font-weight:800;font-size:10px;}
.hp-live-dot{width:8px;height:8px;background:#ff3030;border-radius:50%;animation:hp-blink 1s infinite;box-shadow:0 0 8px #ff3030;}
@keyframes hp-blink{0%,100%{opacity:1;}50%{opacity:.2;}}
.hp-finale-tag{padding:2px 8px;border:1px solid var(--hp-gold);color:var(--hp-gold);font-family:'Press Start 2P',monospace;font-size:8px;letter-spacing:2px;}
.hp-ticker{flex:1;overflow:hidden;margin:0 16px;height:18px;position:relative;}
.hp-ticker-inner{position:absolute;white-space:nowrap;animation:hp-scroll 38s linear infinite;font-size:10px;color:var(--hp-gold-hot);letter-spacing:2px;font-weight:600;}
@keyframes hp-scroll{0%{transform:translateX(100%);}100%{transform:translateX(-100%);}}
.hp-channel{font-family:'Bungee Inline',cursive;color:var(--hp-lava-hot);font-size:12px;letter-spacing:3px;}

/* ═════════════ PHASE TABS ═════════════ */
.hp-tabs{position:absolute;top:36px;left:0;right:0;z-index:99;display:flex;justify-content:center;gap:3px;flex-wrap:wrap;
  padding:7px 14px;background:rgba(6,17,28,.97);border-bottom:1px solid rgba(255,181,71,.18);}
.hp-tab{padding:5px 12px;border:1px solid rgba(255,181,71,.18);border-radius:3px;
  font-family:'Anton',sans-serif;font-size:11px;text-transform:uppercase;letter-spacing:2px;
  cursor:default;background:transparent;color:rgba(243,231,201,.5);transition:all .25s;}
.hp-tab.active{background:linear-gradient(180deg,var(--hp-lava),var(--hp-magma));color:#fff;border-color:var(--hp-lava);box-shadow:0 0 12px rgba(255,90,31,.4);}
.hp-tab .num{font-family:'Press Start 2P',monospace;font-size:7px;margin-right:5px;color:var(--hp-gold);}
.hp-tab.active .num{color:var(--hp-sand);}

/* ═════════════ AMBIENT BG ═════════════ */
.hp-bg{position:absolute;inset:0;z-index:0;pointer-events:none;overflow:hidden;
  background:
    radial-gradient(ellipse 80% 40% at 50% 100%,rgba(255,90,31,.18),transparent 70%),
    radial-gradient(ellipse 60% 70% at 80% 30%,rgba(196,24,47,.08),transparent 70%),
    linear-gradient(180deg,#06111c 0%,#0a1929 40%,#1a1018 100%);}
.hp-moon{position:absolute;top:90px;right:8%;width:84px;height:84px;border-radius:50%;
  background:radial-gradient(circle at 35% 35%,#fff9e0,#f0d68c 60%,#c9a558);
  box-shadow:0 0 60px rgba(255,200,120,.25),0 0 120px rgba(255,160,90,.12);}
.hp-stars{position:absolute;inset:0;}
.hp-star{position:absolute;width:2px;height:2px;background:#fff;border-radius:50%;animation:hp-twinkle 3s ease-in-out infinite;}
@keyframes hp-twinkle{0%,100%{opacity:.2;}50%{opacity:1;box-shadow:0 0 4px #fff;}}
.hp-volcano-far{position:absolute;bottom:0;left:-5%;width:0;height:0;
  border-style:solid;border-width:0 380px 280px 320px;
  border-color:transparent transparent #1a0e14 transparent;opacity:.7;}
.hp-volcano-far2{position:absolute;bottom:0;right:-8%;width:0;height:0;
  border-style:solid;border-width:0 320px 220px 280px;
  border-color:transparent transparent #0f1820 transparent;opacity:.8;}
.hp-ocean-bg{position:absolute;bottom:0;left:0;right:0;height:120px;
  background:linear-gradient(180deg,transparent,rgba(14,58,78,.6) 30%,rgba(14,58,78,.9));overflow:hidden;}
.hp-wave{position:absolute;left:-10%;right:-10%;height:3px;background:rgba(26,167,167,.25);border-radius:50%;animation:hp-wave-pan 8s linear infinite;}
@keyframes hp-wave-pan{0%{transform:translateX(0);}100%{transform:translateX(60px);}}

/* embers */
.hp-embers{position:absolute;inset:0;z-index:1;pointer-events:none;overflow:hidden;}
.hp-ember{position:absolute;width:3px;height:3px;background:var(--hp-lava-hot);border-radius:50%;
  box-shadow:0 0 6px var(--hp-lava),0 0 12px var(--hp-magma);animation:hp-ember-rise linear infinite;}
@keyframes hp-ember-rise{
  0%{transform:translateY(100%) translateX(0) scale(.6);opacity:0;bottom:0;}
  10%{opacity:1;}
  60%{opacity:.8;}
  100%{transform:translateY(-600px) translateX(-20px) scale(.2);opacity:0;}}

/* shark fins */
.hp-fins{position:absolute;left:0;right:0;bottom:60px;height:40px;z-index:1;pointer-events:none;overflow:hidden;}
.hp-fin{position:absolute;width:0;height:0;border-style:solid;border-width:0 12px 20px 12px;
  border-color:transparent transparent #1c2630 transparent;animation:hp-fin-cruise linear infinite;opacity:.6;}
@keyframes hp-fin-cruise{
  0%{transform:translateX(-50px) translateY(0);}
  50%{transform:translateX(50vw) translateY(-6px);}
  100%{transform:translateX(110vw) translateY(0);}}

/* ═════════════ CONTENT AREA ═════════════ */
.hp-content{position:relative;z-index:2;padding:86px 20px 80px;max-width:1100px;margin:0 auto;}

/* ═════════════ ICONS ═════════════ */
.hp-icon{display:inline-block;width:14px;height:14px;vertical-align:middle;flex-shrink:0;}

/* ═════════════ TITLE CARD ═════════════ */
.hp-title-stage{position:relative;height:600px;border-radius:18px;overflow:hidden;
  background:linear-gradient(180deg,#1a0a1f 0%,#3d0a14 40%,#7a0e1d 70%,#c4182f 90%,#ff5a1f 100%);
  border:3px solid var(--hp-gold);box-shadow:0 0 40px rgba(255,90,31,.3),inset 0 0 80px rgba(0,0,0,.4);margin-bottom:24px;}

/* Sun */
.hp-sun{position:absolute;top:32%;left:50%;transform:translateX(-50%);width:340px;height:340px;border-radius:50%;
  background:radial-gradient(circle,#ffd166 0%,#ffb547 35%,#ff8a3b 60%,#ff5a1f 80%,transparent 100%);
  box-shadow:0 0 80px rgba(255,138,59,.5);animation:hp-sun-throb 4s ease-in-out infinite;z-index:1;}
@keyframes hp-sun-throb{0%,100%{transform:translateX(-50%) scale(1);}50%{transform:translateX(-50%) scale(1.04);box-shadow:0 0 120px rgba(255,138,59,.7);}}

/* Palm silhouettes */
.hp-palm{position:absolute;bottom:0;z-index:3;animation:hp-palm-sway 6s ease-in-out infinite;transform-origin:bottom center;}
.hp-palm.left{left:3%;}
.hp-palm.right{right:3%;animation-delay:-2s;transform:scaleX(-1);}
.hp-palm svg{display:block;}
@keyframes hp-palm-sway{0%,100%{transform:rotate(-1.5deg);}50%{transform:rotate(1.5deg);}}
.hp-palm.right{animation-name:hp-palm-sway-r;}
@keyframes hp-palm-sway-r{0%,100%{transform:scaleX(-1) rotate(-1.5deg);}50%{transform:scaleX(-1) rotate(1.5deg);}}

/* Erupting volcano SVG */
.hp-volcano{position:absolute;bottom:0;left:50%;transform:translateX(-50%);width:560px;height:320px;z-index:2;}
.hp-volcano svg{display:block;width:100%;height:100%;overflow:visible;}
.hp-lava-spout{transform-origin:50% 100%;animation:hp-spout 2.4s ease-in-out infinite;}
@keyframes hp-spout{0%,100%{transform:translateY(0) scaleY(1);}50%{transform:translateY(-14px) scaleY(1.15);}}
.hp-lava-glow{animation:hp-lava-glow-anim 1.6s ease-in-out infinite;}
@keyframes hp-lava-glow-anim{0%,100%{opacity:.65;}50%{opacity:1;}}

/* lava drips */
.hp-drip{position:absolute;width:4px;background:linear-gradient(180deg,var(--hp-gold-hot),var(--hp-lava),var(--hp-magma));border-radius:0 0 3px 3px;box-shadow:0 0 8px var(--hp-lava);}
.hp-drip.d1{left:46%;bottom:120px;height:60px;animation:hp-drip-flow 3s ease-in infinite;}
.hp-drip.d2{left:53%;bottom:130px;height:80px;animation:hp-drip-flow 3.6s ease-in infinite -1s;}
.hp-drip.d3{left:49%;bottom:140px;height:50px;animation:hp-drip-flow 2.8s ease-in infinite -.5s;}
@keyframes hp-drip-flow{0%{transform:translateY(-20px);opacity:0;}20%{opacity:1;}80%{opacity:1;}100%{transform:translateY(40px);opacity:0;}}

/* Smoke puffs */
.hp-smoke{position:absolute;left:50%;bottom:280px;width:80px;height:80px;border-radius:50%;
  background:radial-gradient(circle,rgba(80,60,50,.6),rgba(40,30,28,.3) 70%,transparent);
  animation:hp-smoke-rise 5s ease-out infinite;}
.hp-smoke.s1{margin-left:-30px;animation-delay:0s;}
.hp-smoke.s2{margin-left:-60px;animation-delay:-1.7s;}
.hp-smoke.s3{margin-left:0px;animation-delay:-3.3s;}
@keyframes hp-smoke-rise{
  0%{transform:translateY(0) scale(.4);opacity:0;}
  20%{opacity:.7;}
  100%{transform:translateY(-260px) scale(2);opacity:0;}}

/* Title text */
.hp-title-text{position:absolute;top:46px;left:0;right:0;text-align:center;z-index:6;}
.hp-title-kicker{font-family:'Press Start 2P',monospace;font-size:11px;color:var(--hp-gold);letter-spacing:6px;
  text-shadow:0 0 12px rgba(255,181,71,.6),2px 2px 0 #000;margin-bottom:14px;animation:hp-flicker 2.4s infinite;}
@keyframes hp-flicker{0%,100%{opacity:1;}48%{opacity:1;}50%{opacity:.5;}52%{opacity:1;}}
.hp-title-main{font-family:'Bungee Inline',cursive;font-size:104px;line-height:.9;color:var(--hp-bone);
  text-shadow:
    0 0 30px rgba(255,138,59,.6),
    0 0 70px rgba(255,90,31,.4),
    4px 4px 0 var(--hp-magma-deep),
    8px 8px 0 #000;
  letter-spacing:2px;animation:hp-title-pulse 3s ease-in-out infinite;}
@keyframes hp-title-pulse{
  0%,100%{transform:scale(1);text-shadow:0 0 30px rgba(255,138,59,.6),0 0 70px rgba(255,90,31,.4),4px 4px 0 var(--hp-magma-deep),8px 8px 0 #000;}
  50%{transform:scale(1.02);text-shadow:0 0 50px rgba(255,138,59,.9),0 0 110px rgba(255,90,31,.6),4px 4px 0 var(--hp-magma-deep),8px 8px 0 #000;}}
.hp-title-sub{font-family:'Anton',sans-serif;font-size:18px;color:var(--hp-sand-warm);letter-spacing:8px;
  text-transform:uppercase;margin-top:18px;text-shadow:2px 2px 0 #000;}
.hp-title-ep{display:inline-flex;align-items:center;gap:10px;margin-top:16px;padding:6px 18px;
  background:rgba(0,0,0,.5);border:1px solid var(--hp-gold);border-radius:20px;
  font-family:'Press Start 2P',monospace;font-size:9px;color:var(--hp-gold-hot);letter-spacing:3px;}
.hp-title-ep .dot{width:6px;height:6px;background:var(--hp-lava);border-radius:50%;box-shadow:0 0 8px var(--hp-lava);}

/* Tiki torches */
.hp-tiki{position:absolute;bottom:40px;width:14px;height:120px;z-index:4;}
.hp-tiki.t-left{left:14%;}
.hp-tiki.t-right{right:14%;}
.hp-tiki-pole{position:absolute;bottom:0;left:3px;width:8px;height:90px;
  background:repeating-linear-gradient(180deg,#3a2410 0 6px,#5c3a1e 6px 14px);border-radius:2px;}
.hp-tiki-bowl{position:absolute;bottom:80px;left:-4px;width:22px;height:14px;background:#3a2410;border-radius:0 0 50% 50%;border-top:2px solid #5c3a1e;}
.hp-flame{position:absolute;bottom:92px;left:-2px;width:18px;height:36px;
  background:radial-gradient(ellipse at 50% 100%,var(--hp-bone),var(--hp-gold-hot) 30%,var(--hp-lava) 60%,var(--hp-magma) 90%);
  border-radius:50% 50% 50% 50% / 60% 60% 40% 40%;
  filter:blur(.4px);animation:hp-flame-anim 1.4s ease-in-out infinite;transform-origin:50% 100%;
  box-shadow:0 0 20px var(--hp-lava),0 0 40px var(--hp-magma);}
.hp-tiki.t-right .hp-flame{animation-delay:-.7s;}
@keyframes hp-flame-anim{0%,100%{transform:scaleY(1) skewX(-3deg);}25%{transform:scaleY(1.1) skewX(2deg);}50%{transform:scaleY(.95) skewX(-2deg);}75%{transform:scaleY(1.15) skewX(3deg);}}

/* Jouster stage */
.hp-jouster-stage{position:absolute;bottom:38px;left:0;right:0;height:200px;z-index:5;pointer-events:none;}
.hp-plank{position:absolute;bottom:120px;width:160px;height:8px;background:linear-gradient(180deg,#7a4a22,#3a2410);border-radius:2px;box-shadow:0 4px 0 rgba(0,0,0,.4);}
.hp-plank.p-left{left:18%;animation:hp-plank-wob 2s ease-in-out infinite;transform-origin:right center;}
.hp-plank.p-right{right:18%;animation:hp-plank-wob 2s ease-in-out infinite -1s;transform-origin:left center;}
@keyframes hp-plank-wob{0%,100%{transform:rotate(-1deg);}50%{transform:rotate(1.5deg);}}
.hp-jouster{position:absolute;bottom:128px;width:48px;height:80px;}
.hp-jouster.j-a{left:24%;animation:hp-jab-a 2s ease-in-out infinite;}
.hp-jouster.j-b{right:24%;animation:hp-jab-b 2s ease-in-out infinite -1s;transform:scaleX(-1);}
@keyframes hp-jab-a{0%,100%{transform:translateX(0) rotate(-2deg);}45%{transform:translateX(14px) rotate(4deg);}55%{transform:translateX(14px) rotate(4deg);}}
@keyframes hp-jab-b{0%,100%{transform:scaleX(-1) translateX(0) rotate(-2deg);}45%{transform:scaleX(-1) translateX(14px) rotate(4deg);}55%{transform:scaleX(-1) translateX(14px) rotate(4deg);}}
.j-head{position:absolute;top:0;left:14px;width:20px;height:20px;border-radius:50%;background:#e8b988;border:2px solid #2a1a10;overflow:hidden;}
.j-head img{width:100%;height:100%;object-fit:cover;border-radius:50%;}
.j-torso{position:absolute;top:20px;left:14px;width:20px;height:24px;background:#e8b988;border-radius:6px 6px 4px 4px;}
.j-skirt{position:absolute;top:38px;left:8px;width:32px;height:18px;
  background:repeating-linear-gradient(180deg,#1f7a4a 0 3px,#0e4a2d 3px 6px);
  border-radius:0 0 60% 60% / 0 0 30% 30%;border-top:3px solid #7a4a22;}
.j-bra{position:absolute;top:26px;left:10px;width:28px;height:10px;}
.j-bra::before,.j-bra::after{content:'';position:absolute;top:0;width:11px;height:10px;border-radius:50%;background:#5c3a1e;border:1.5px solid #2a1a10;}
.j-bra::before{left:0;}.j-bra::after{right:0;}
.j-leg{position:absolute;top:54px;left:12px;width:8px;height:18px;background:#e8b988;border-radius:2px;}
.j-leg.r{left:24px;}
.j-arm-fwd{position:absolute;top:24px;left:32px;width:28px;height:6px;background:#e8b988;border-radius:3px;transform:rotate(-10deg);transform-origin:left center;}
.j-stick{position:absolute;top:24px;left:54px;width:60px;height:5px;background:linear-gradient(90deg,#7a4a22,#3a2410);border-radius:3px;transform:rotate(-8deg);transform-origin:left center;box-shadow:0 1px 0 #000;}
.j-stick::after{content:'';position:absolute;right:-6px;top:-4px;width:14px;height:14px;background:radial-gradient(circle,#c4182f,#7a0b1d);border-radius:50%;box-shadow:0 0 8px rgba(255,90,31,.6);}

/* Impact spark */
.hp-impact{position:absolute;bottom:170px;left:50%;transform:translateX(-50%);width:80px;height:80px;animation:hp-impact-anim 2s ease-in-out infinite -1s;pointer-events:none;}
@keyframes hp-impact-anim{0%,30%{opacity:0;transform:translateX(-50%) scale(.4);}45%{opacity:1;transform:translateX(-50%) scale(1.2);}65%{opacity:0;transform:translateX(-50%) scale(1.6);}100%{opacity:0;}}
.hp-impact::before{content:'POW!';position:absolute;inset:0;display:flex;align-items:center;justify-content:center;
  font-family:'Bungee Inline',cursive;color:var(--hp-gold-hot);font-size:24px;
  text-shadow:2px 2px 0 var(--hp-magma),4px 4px 0 #000;letter-spacing:2px;}
.hp-impact-rays{position:absolute;inset:0;}
.hp-impact-rays::before,.hp-impact-rays::after{content:'';position:absolute;top:50%;left:50%;width:80px;height:4px;background:linear-gradient(90deg,transparent,var(--hp-gold-hot),transparent);transform-origin:center;}
.hp-impact-rays::before{transform:translate(-50%,-50%) rotate(20deg);}
.hp-impact-rays::after{transform:translate(-50%,-50%) rotate(-20deg);}

/* Climber */
.hp-climber{position:absolute;width:32px;height:48px;z-index:4;
  bottom:60px;left:50%;margin-left:-100px;
  animation:hp-climb 4s ease-in-out infinite;}
@keyframes hp-climb{
  0%{transform:translate(0,0) rotate(-12deg);}
  50%{transform:translate(60px,-110px) rotate(-8deg);}
  100%{transform:translate(0,0) rotate(-12deg);}}
.c-head{position:absolute;top:0;left:8px;width:16px;height:16px;border-radius:50%;background:#a87045;border:1.5px solid #000;overflow:hidden;}
.c-head img{width:100%;height:100%;object-fit:cover;border-radius:50%;}
.c-hair{position:absolute;top:-2px;left:7px;width:18px;height:8px;background:#1a0e08;border-radius:60% 60% 20% 20%;}
.c-body{position:absolute;top:14px;left:8px;width:16px;height:20px;background:#1aa7a7;border-radius:4px;}
.c-dummy{position:absolute;top:-10px;left:-4px;width:40px;height:14px;background:repeating-linear-gradient(90deg,#7a4a22 0 6px,#5c3a1e 6px 8px);border-radius:3px;transform:rotate(-8deg);}
.c-dummy::before{content:'';position:absolute;left:0;top:-4px;width:8px;height:8px;border-radius:50%;background:#ffb547;border:1px solid #7a0b1d;}
.c-leg{position:absolute;top:32px;left:10px;width:5px;height:14px;background:#3a1f0e;}
.c-leg.r{left:18px;}

/* Pineapple arc */
.hp-pineapple{position:absolute;bottom:200px;left:30%;width:22px;height:28px;z-index:3;animation:hp-pineapple-arc 4s ease-in-out infinite;}
@keyframes hp-pineapple-arc{
  0%{transform:translate(0,0) rotate(0);opacity:0;}
  10%{opacity:1;}
  50%{transform:translate(140px,-90px) rotate(360deg);opacity:1;}
  90%{opacity:1;}
  100%{transform:translate(280px,0) rotate(720deg);opacity:0;}}
.hp-pineapple::before{content:'';position:absolute;inset:6px 0 0 0;background:repeating-linear-gradient(45deg,var(--hp-gold-hot) 0 4px,var(--hp-lava) 4px 6px),var(--hp-gold);border-radius:40%;}
.hp-pineapple::after{content:'';position:absolute;top:0;left:6px;width:10px;height:10px;background:var(--hp-leaf);clip-path:polygon(20% 100%,40% 0%,60% 100%,80% 0%,50% 100%);}

/* Vine borders */
.hp-vine-top,.hp-vine-bottom{position:absolute;left:0;right:0;height:32px;z-index:7;display:flex;justify-content:space-around;align-items:center;pointer-events:none;}
.hp-vine-top{top:0;}
.hp-vine-bottom{bottom:0;transform:scaleY(-1);}
.hp-vine-leaf{width:22px;height:14px;background:linear-gradient(135deg,var(--hp-leaf),var(--hp-leaf-deep));border-radius:0 100% 0 100%;animation:hp-leaf-flutter 3s ease-in-out infinite;transform-origin:left center;}
.hp-vine-leaf:nth-child(odd){animation-delay:-1.5s;transform:scaleX(-1);}
@keyframes hp-leaf-flutter{0%,100%{transform:rotate(-3deg);}50%{transform:rotate(3deg);}}

/* ═════════════ CONTENT CARDS ═════════════ */
.hp-section-head{display:flex;align-items:baseline;gap:14px;margin:28px 0 14px;padding-bottom:8px;border-bottom:1px solid rgba(255,181,71,.18);}
.hp-section-num{font-family:'Press Start 2P',monospace;font-size:14px;color:var(--hp-lava-hot);}
.hp-section-title{font-family:'Anton',sans-serif;font-size:26px;letter-spacing:3px;text-transform:uppercase;color:var(--hp-bone);}
.hp-section-meta{margin-left:auto;font-size:10px;color:rgba(243,231,201,.4);letter-spacing:2px;text-transform:uppercase;}

.hp-card{background:linear-gradient(135deg,rgba(255,181,71,.04),rgba(196,24,47,.04));
  border:1px solid rgba(255,181,71,.12);border-radius:10px;padding:18px 22px;margin:12px 0;
  position:relative;overflow:hidden;animation:hp-card-in .55s cubic-bezier(.16,1,.3,1) forwards;}
.hp-card::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;
  background:linear-gradient(90deg,transparent,rgba(255,181,71,.4) 50%,transparent);}
@keyframes hp-card-in{from{transform:translateY(8px);opacity:0;}to{transform:none;opacity:1;}}

/* faction accents */
.hp-card[data-fac="hero"]{border-left:3px solid var(--hp-teal);background:linear-gradient(135deg,rgba(26,167,167,.07),rgba(196,24,47,.03));}
.hp-card[data-fac="villain"]{border-left:3px solid var(--hp-magma);background:linear-gradient(135deg,rgba(196,24,47,.09),rgba(0,0,0,.2));}
.hp-card[data-fac="wild"]{border-left:3px solid var(--hp-gold);background:linear-gradient(135deg,rgba(255,181,71,.08),rgba(196,24,47,.03));}
.hp-card[data-fac="host"]{border-left:3px solid var(--hp-bone);background:linear-gradient(135deg,rgba(243,231,201,.05),rgba(0,0,0,.2));}

.hp-card-hdr{display:flex;align-items:center;gap:10px;margin-bottom:10px;flex-wrap:wrap;}
.hp-card-title{font-family:'Anton',sans-serif;font-size:16px;letter-spacing:2px;color:var(--hp-bone);text-transform:uppercase;}
.hp-card-body{font-size:13.5px;line-height:1.65;color:rgba(243,231,201,.78);}
.hp-card-body strong{color:var(--hp-gold-hot);font-weight:700;}
.hp-card-body em{color:var(--hp-lava-hot);font-style:italic;}

.hp-badge{margin-left:auto;padding:3px 10px;border-radius:10px;font-size:9px;font-weight:800;letter-spacing:1.5px;white-space:nowrap;text-transform:uppercase;}
.hp-b-tie{background:rgba(255,181,71,.12);color:var(--hp-gold-hot);border:1px solid rgba(255,181,71,.3);}
.hp-b-joust{background:rgba(196,24,47,.15);color:#ff7080;border:1px solid rgba(196,24,47,.35);}
.hp-b-climb{background:rgba(26,167,167,.12);color:#3ad9d9;border:1px solid rgba(26,167,167,.3);}
.hp-b-volcano{background:rgba(255,90,31,.15);color:var(--hp-lava-hot);border:1px solid rgba(255,90,31,.35);}
.hp-b-end{background:rgba(243,231,201,.1);color:var(--hp-bone);border:1px solid rgba(243,231,201,.25);}
.hp-b-twist{background:rgba(255,59,107,.12);color:var(--hp-bruise);border:1px solid rgba(255,59,107,.3);}
.hp-b-ko{background:rgba(196,24,47,.2);color:#ff8080;border:1px solid rgba(196,24,47,.5);}
.hp-b-win{background:linear-gradient(90deg,var(--hp-gold),var(--hp-gold-hot));color:#3a1a04;border:1px solid var(--hp-gold);font-weight:900;}

/* ═════════════ AVATARS ═════════════ */
.hp-av{width:38px;height:38px;border-radius:50%;border:2px solid var(--hp-gold);background:var(--hp-ash);
  display:inline-flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;color:var(--hp-bone);flex-shrink:0;
  font-family:'Anton',sans-serif;letter-spacing:1px;position:relative;overflow:hidden;}
.hp-av img{width:100%;height:100%;object-fit:cover;border-radius:50%;}
.hp-av.sm{width:28px;height:28px;font-size:9px;}
.hp-av.lg{width:52px;height:52px;font-size:15px;border-width:3px;}
.hp-av.xl{width:72px;height:72px;font-size:20px;border-width:3px;}
.hp-av[data-fac="hero"]{border-color:var(--hp-teal);background:linear-gradient(135deg,#1aa7a7,#0e6c6c);}
.hp-av[data-fac="villain"]{border-color:var(--hp-magma);background:linear-gradient(135deg,#c4182f,#7a0b1d);}
.hp-av[data-fac="wild"]{border-color:var(--hp-gold);background:linear-gradient(135deg,#ffb547,#c47a04);color:#3a1a04;}
.hp-av[data-fac="dark"]{border-color:#888;background:linear-gradient(135deg,#444,#222);}
.hp-av.ko{filter:grayscale(.8) brightness(.5);opacity:.45;}
.hp-av.winner{box-shadow:0 0 0 3px var(--hp-night),0 0 0 5px var(--hp-gold),0 0 24px rgba(255,181,71,.6);animation:hp-winner-glow 2s ease-in-out infinite;}
@keyframes hp-winner-glow{0%,100%{box-shadow:0 0 0 3px var(--hp-night),0 0 0 5px var(--hp-gold),0 0 24px rgba(255,181,71,.6);}50%{box-shadow:0 0 0 3px var(--hp-night),0 0 0 5px var(--hp-gold-hot),0 0 48px rgba(255,181,71,1);}}

/* ═════════════ FINALIST PANELS ═════════════ */
.hp-finalists{display:grid;gap:14px;margin:24px 0;}
.hp-finalists.f3{grid-template-columns:1fr 1fr 1fr;}
.hp-finalists.f2{grid-template-columns:1fr 1fr;}
.hp-finalist{position:relative;padding:18px 16px;border-radius:12px;background:linear-gradient(180deg,rgba(0,0,0,.4),rgba(0,0,0,.2));
  border:2px solid rgba(255,181,71,.2);text-align:center;overflow:hidden;}
.hp-finalist[data-fac="villain"]{border-color:rgba(196,24,47,.5);}
.hp-finalist[data-fac="hero"]{border-color:rgba(26,167,167,.5);}
.hp-finalist[data-fac="wild"]{border-color:rgba(255,181,71,.5);}
.hp-finalist-rank{position:absolute;top:8px;right:10px;font-family:'Press Start 2P',monospace;font-size:8px;color:var(--hp-gold);letter-spacing:1px;}
.hp-finalist-name{font-family:'Anton',sans-serif;font-size:22px;letter-spacing:3px;margin-top:8px;text-transform:uppercase;}
.hp-finalist-archetype{font-size:10px;color:rgba(243,231,201,.5);letter-spacing:2px;text-transform:uppercase;margin-top:2px;}
.hp-finalist-meter{margin-top:14px;}
.hp-stat-row{display:flex;align-items:center;gap:8px;margin:5px 0;font-size:10px;}
.hp-stat-label{flex:0 0 72px;text-align:left;color:rgba(243,231,201,.5);letter-spacing:1px;text-transform:uppercase;}
.hp-stat-bar{flex:1;height:6px;background:rgba(255,255,255,.06);border-radius:3px;overflow:hidden;}
.hp-stat-fill{height:100%;border-radius:3px;}
.hp-stat-fill.h{background:linear-gradient(90deg,var(--hp-teal-deep),var(--hp-teal));}
.hp-stat-fill.v{background:linear-gradient(90deg,var(--hp-magma-deep),var(--hp-magma));}
.hp-stat-fill.w{background:linear-gradient(90deg,#c47a04,var(--hp-gold-hot));}

/* ═════════════ CONFESSIONAL ═════════════ */
.hp-confess{position:relative;padding:14px 18px 14px 56px;margin:12px 0;
  background:linear-gradient(135deg,rgba(196,24,47,.06),rgba(0,0,0,.3));
  border-left:3px solid var(--hp-magma);border-radius:0 8px 8px 0;}
.hp-confess[data-fac="hero"]{border-left-color:var(--hp-teal);background:linear-gradient(135deg,rgba(26,167,167,.06),rgba(0,0,0,.3));}
.hp-confess[data-fac="wild"]{border-left-color:var(--hp-gold);background:linear-gradient(135deg,rgba(255,181,71,.06),rgba(0,0,0,.3));}
.hp-confess-av{position:absolute;top:12px;left:10px;}
.hp-confess-name{font-family:'Anton',sans-serif;font-size:12px;letter-spacing:2px;color:var(--hp-gold-hot);text-transform:uppercase;margin-bottom:4px;display:flex;align-items:center;gap:8px;}
.hp-confess-tag{font-size:8px;padding:2px 6px;background:rgba(196,24,47,.2);border:1px solid rgba(196,24,47,.4);border-radius:3px;color:#ff7080;letter-spacing:1px;}
.hp-confess-text{font-family:'Special Elite',cursive;font-style:italic;font-size:13px;line-height:1.6;color:rgba(243,231,201,.85);}
.hp-confess-text::before{content:'“';font-size:24px;color:var(--hp-gold);margin-right:2px;}
.hp-confess-text::after{content:'”';font-size:24px;color:var(--hp-gold);margin-left:2px;}

/* ═════════════ HOST INTERSTITIAL ═════════════ */
.hp-host-line{padding:10px 16px;margin:14px 0;background:rgba(243,231,201,.04);border-top:1px dashed rgba(243,231,201,.2);border-bottom:1px dashed rgba(243,231,201,.2);
  font-family:'Special Elite',cursive;font-style:italic;font-size:12px;color:rgba(243,231,201,.55);text-align:center;letter-spacing:.5px;}
.hp-host-line::before{content:'HOST ▸ ';font-family:'Press Start 2P',monospace;font-size:8px;color:var(--hp-gold);letter-spacing:2px;font-style:normal;}

/* ═════════════ DIALOGUE ═════════════ */
.hp-dialogue{display:grid;grid-template-columns:1fr auto 1fr;gap:14px;align-items:start;
  padding:14px;background:rgba(0,0,0,.25);border:1px solid rgba(255,181,71,.1);border-radius:10px;margin:10px 0;}
.hp-dialog-side{display:flex;flex-direction:column;gap:8px;}
.hp-dialog-side.right{text-align:right;align-items:flex-end;}
.hp-dialog-name{font-family:'Anton',sans-serif;font-size:11px;letter-spacing:2px;color:var(--hp-gold-hot);text-transform:uppercase;}
.hp-dialog-quote{font-size:12px;font-style:italic;color:rgba(243,231,201,.7);line-height:1.5;}
.hp-vs{display:flex;align-items:center;justify-content:center;font-family:'Bungee Inline',cursive;font-size:24px;color:var(--hp-lava);
  text-shadow:0 0 12px rgba(255,90,31,.6);}

/* ═════════════ MATCHUP ═════════════ */
.hp-matchup{display:grid;grid-template-columns:1fr auto 1fr;gap:20px;align-items:center;padding:24px;
  background:radial-gradient(ellipse at center,rgba(196,24,47,.12),rgba(0,0,0,.4));
  border:2px solid var(--hp-magma);border-radius:14px;margin:18px 0;position:relative;overflow:hidden;}
.hp-matchup::before{content:'JOUST';position:absolute;font-family:'Bungee Inline',cursive;font-size:160px;color:rgba(196,24,47,.05);letter-spacing:10px;top:50%;left:50%;transform:translate(-50%,-50%);}
.hp-fighter{display:flex;flex-direction:column;align-items:center;gap:8px;position:relative;z-index:1;}
.hp-fighter-name{font-family:'Anton',sans-serif;font-size:18px;letter-spacing:2px;text-transform:uppercase;}
.hp-fighter-tag{font-size:9px;letter-spacing:2px;text-transform:uppercase;}
.hp-vs-big{font-family:'Bungee Inline',cursive;font-size:42px;color:var(--hp-gold);
  text-shadow:0 0 20px rgba(255,181,71,.6),3px 3px 0 var(--hp-magma-deep);
  animation:hp-vs-bounce 2s ease-in-out infinite;z-index:1;}
@keyframes hp-vs-bounce{0%,100%{transform:scale(1) rotate(-3deg);}50%{transform:scale(1.1) rotate(3deg);}}

/* HP bars */
.hp-bar{display:flex;align-items:center;gap:8px;font-size:10px;width:100%;}
.hp-bar-track{flex:1;height:8px;background:rgba(255,255,255,.08);border-radius:4px;overflow:hidden;}
.hp-bar-fill{height:100%;border-radius:4px;transition:width .8s ease;}
.hp-bar-fill.full{background:linear-gradient(90deg,var(--hp-teal-deep),var(--hp-teal));}
.hp-bar-fill.low{background:linear-gradient(90deg,var(--hp-magma-deep),var(--hp-magma));animation:hp-bar-pulse 1.2s infinite;}
@keyframes hp-bar-pulse{0%,100%{opacity:1;}50%{opacity:.6;}}
.hp-bar-val{font-family:'Press Start 2P',monospace;font-size:8px;min-width:32px;text-align:right;color:var(--hp-gold-hot);}

/* ═════════════ OUTCOME / KO ═════════════ */
.hp-outcome{text-align:center;padding:30px;margin:20px 0;border-radius:14px;position:relative;overflow:hidden;}
.hp-outcome.ko{background:radial-gradient(ellipse at center,rgba(196,24,47,.2),rgba(0,0,0,.6));border:2px solid var(--hp-magma);}
.hp-outcome.win{background:radial-gradient(ellipse at center,rgba(255,181,71,.18),rgba(0,0,0,.5));border:2px solid var(--hp-gold);}
.hp-outcome.twist{background:radial-gradient(ellipse at center,rgba(255,59,107,.15),rgba(0,0,0,.6));border:2px solid var(--hp-bruise);}
.hp-outcome-tag{font-family:'Press Start 2P',monospace;font-size:11px;color:var(--hp-gold);letter-spacing:4px;margin-bottom:10px;}
.hp-outcome-title{font-family:'Bungee Inline',cursive;font-size:48px;letter-spacing:3px;}
.hp-outcome.ko .hp-outcome-title{color:#ff8080;text-shadow:0 0 24px rgba(196,24,47,.6),3px 3px 0 #000;}
.hp-outcome.win .hp-outcome-title{color:var(--hp-gold-hot);text-shadow:0 0 30px rgba(255,181,71,.6),3px 3px 0 #000;animation:hp-win-pulse 2s ease-in-out infinite;}
.hp-outcome.twist .hp-outcome-title{color:var(--hp-bruise);text-shadow:0 0 24px rgba(255,59,107,.5),3px 3px 0 #000;}
@keyframes hp-win-pulse{0%,100%{transform:scale(1);}50%{transform:scale(1.04);}}
.hp-outcome-sub{font-size:14px;color:rgba(243,231,201,.7);margin-top:10px;letter-spacing:2px;text-transform:uppercase;}

/* Money case */
.hp-money{display:inline-block;margin-top:18px;padding:14px 22px;background:linear-gradient(135deg,#3a2410,#5c3a1e);border:2px solid var(--hp-gold);border-radius:8px;position:relative;}
.hp-money-stack{font-family:'Bungee Inline',cursive;font-size:36px;color:var(--hp-gold-hot);text-shadow:2px 2px 0 #000;letter-spacing:2px;}
.hp-money-sub{font-size:10px;color:var(--hp-sand-warm);letter-spacing:3px;text-transform:uppercase;margin-top:4px;}

/* ═════════════ SIDEBAR ═════════════ */
.hp-sidebar{position:sticky;top:96px;align-self:start;}
.hp-side-box{background:linear-gradient(135deg,rgba(0,0,0,.4),rgba(196,24,47,.04));
  border:1px solid rgba(255,181,71,.15);border-radius:10px;padding:14px;margin-bottom:12px;}
.hp-side-title{font-family:'Anton',sans-serif;font-size:12px;letter-spacing:3px;color:var(--hp-gold);
  text-transform:uppercase;margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid rgba(255,181,71,.15);
  display:flex;align-items:center;gap:6px;}
.hp-side-title::before{content:'';width:6px;height:6px;background:var(--hp-lava);border-radius:50%;box-shadow:0 0 6px var(--hp-lava);}
.hp-side-row{display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid rgba(255,255,255,.04);font-size:11px;}
.hp-side-row:last-child{border-bottom:none;}
.hp-side-name{flex:1;font-weight:600;}
.hp-side-stat{font-size:9px;color:rgba(243,231,201,.5);letter-spacing:1px;text-transform:uppercase;}
.hp-side-tag{font-size:8px;padding:2px 6px;border-radius:6px;letter-spacing:1px;font-weight:800;}

/* peanut gallery */
.hp-gallery{display:grid;grid-template-columns:repeat(5,1fr);gap:6px;}
.hp-gallery .hp-av{width:30px;height:30px;font-size:9px;border-width:2px;margin:0 auto;}

/* ═════════════ EXCHANGE / TALLY ═════════════ */
.hp-exchange{display:flex;align-items:center;gap:12px;padding:10px;background:rgba(0,0,0,.2);border-radius:8px;margin:4px 0;}
.hp-exchange-bar{flex:1;height:8px;background:rgba(255,255,255,.08);border-radius:4px;overflow:hidden;position:relative;}
.hp-exchange-fill{height:100%;border-radius:4px;transition:width 0.4s ease;}
.hp-tally{display:flex;gap:3px;align-items:center;}
.hp-tally-mark{width:3px;height:16px;background:var(--hp-gold);border-radius:1px;}
.hp-tally-mark.dim{opacity:0.2;}

/* ═════════════ REVEAL STEP ═════════════ */
.hp-step{display:none;}
.hp-step.hp-visible{display:block;}

/* ═════════════ SOCIAL CARDS ═════════════ */
.hp-social-card{background:rgba(26,167,167,.06);border:1px dashed rgba(26,167,167,.25);border-radius:8px;padding:12px 14px;margin:8px 0;position:relative;animation:hp-card-in .55s cubic-bezier(.16,1,.3,1) forwards;}
.hp-social-header{display:flex;align-items:center;gap:6px;margin-bottom:4px;}
.hp-social-label{font-size:8px;letter-spacing:2px;color:var(--hp-teal);text-transform:uppercase;font-family:'Press Start 2P',monospace;}

/* ═════════════ FLAVOR TEXT ═════════════ */
.hp-flavor{text-align:center;font-family:'Special Elite',cursive;font-size:11px;color:rgba(255,90,31,.3);letter-spacing:2px;padding:8px 0;font-style:italic;}

/* ═════════════ CONTROLS ═════════════ */
.hp-controls{position:fixed;bottom:0;left:0;right:0;z-index:1000;
  background:linear-gradient(0deg,#000,rgba(6,17,28,.95));border-top:2px solid var(--hp-gold);
  padding:10px 20px;display:flex;align-items:center;justify-content:center;gap:14px;backdrop-filter:blur(10px);}
.hp-btn{padding:8px 18px;border:1px solid var(--hp-gold);border-radius:4px;background:rgba(255,181,71,.08);
  color:var(--hp-bone);font-family:'Anton',sans-serif;font-size:12px;letter-spacing:2px;cursor:pointer;text-transform:uppercase;transition:all .2s;}
.hp-btn:hover{background:var(--hp-gold);color:#3a1a04;box-shadow:0 0 12px rgba(255,181,71,.5);}
.hp-btn.primary{background:linear-gradient(180deg,var(--hp-lava),var(--hp-magma));border-color:var(--hp-lava);color:#fff;}
.hp-btn.primary:hover{background:linear-gradient(180deg,var(--hp-lava-hot),var(--hp-lava));}
.hp-counter{font-family:'Press Start 2P',monospace;font-size:9px;color:var(--hp-gold-hot);letter-spacing:2px;}

/* ═════════════ SCREEN SHAKE ═════════════ */
.hp-shake{animation:hp-shake-anim 0.5s ease-out;}
@keyframes hp-shake-anim{0%{transform:translate(0)}15%{transform:translate(-4px,2px)}30%{transform:translate(4px,-2px)}45%{transform:translate(-3px,1px)}60%{transform:translate(3px,-1px)}75%{transform:translate(-1px,1px)}100%{transform:translate(0)}}

/* ═════════════ LAVA GLOW ═════════════ */
.hp-lava-glow{animation:hp-glow-pulse 2s ease-in-out infinite;}
@keyframes hp-glow-pulse{0%,100%{box-shadow:0 0 8px rgba(196,24,47,.15)}50%{box-shadow:0 0 24px rgba(196,24,47,.4)}}

/* ═════════════ PHASE BACKGROUNDS ═════════════ */

/* ── FIC (Hawaiian Style) — warm sunset beach ── */
[data-phase="fic"] .hp-bg{
  background:
    radial-gradient(ellipse 90% 50% at 50% 80%,rgba(26,167,167,.22),transparent 70%),
    radial-gradient(ellipse 60% 40% at 50% 30%,rgba(255,181,71,.18),transparent 70%),
    radial-gradient(ellipse 50% 30% at 20% 60%,rgba(255,138,59,.10),transparent 60%),
    linear-gradient(180deg,#1a0e2e 0%,#4a1830 15%,#a83a20 35%,#e87730 55%,#f0a535 70%,#0e6c6c 85%,#0a3848 100%);}
[data-phase="fic"] .hp-moon{
  background:radial-gradient(circle at 50% 50%,#fffbe8,#ffd166 40%,#ff8a3b 80%,transparent);
  width:220px;height:220px;top:10%;right:50%;transform:translateX(50%);
  box-shadow:0 0 80px rgba(255,181,71,.5),0 0 200px rgba(255,138,59,.25);
  opacity:.85;border-radius:50%;}
[data-phase="fic"] .hp-volcano-far,
[data-phase="fic"] .hp-volcano-far2{opacity:.25;}
[data-phase="fic"] .hp-ocean-bg{height:180px;
  background:linear-gradient(180deg,transparent,rgba(14,108,108,.35) 20%,rgba(26,167,167,.4) 60%,rgba(14,58,78,.8));}
[data-phase="fic"] .hp-wave{background:rgba(26,167,167,.45);height:4px;}
[data-phase="fic"] .hp-star{opacity:.15;}
[data-phase="fic"] .hp-ember{
  background:var(--hp-gold-hot) !important;
  box-shadow:0 0 8px var(--hp-gold),0 0 16px rgba(255,181,71,.4) !important;}
[data-phase="fic"] .hp-fin{opacity:.35;}
[data-phase="fic"] .hp-chrome{
  background:linear-gradient(90deg,rgba(14,58,78,.95) 0%,rgba(26,167,167,.3) 50%,rgba(14,58,78,.95) 100%);
  border-bottom-color:var(--hp-teal);}
[data-phase="fic"] .hp-tabs{border-bottom-color:rgba(26,167,167,.25);}

/* FIC animated surf shimmer */
.hp-surf-shimmer{display:none;}
[data-phase="fic"] .hp-surf-shimmer{display:block;position:absolute;bottom:0;left:0;right:0;height:200px;z-index:1;pointer-events:none;overflow:hidden;}
.hp-surf-line{position:absolute;left:-20%;right:-20%;height:2px;border-radius:50%;animation:hp-surf-drift linear infinite;}
.hp-surf-line:nth-child(1){bottom:30px;background:rgba(26,167,167,.5);animation-duration:7s;}
.hp-surf-line:nth-child(2){bottom:55px;background:rgba(26,167,167,.35);animation-duration:9s;animation-delay:-2s;}
.hp-surf-line:nth-child(3){bottom:80px;background:rgba(26,167,167,.25);animation-duration:11s;animation-delay:-4s;}
.hp-surf-line:nth-child(4){bottom:110px;background:rgba(255,181,71,.15);animation-duration:13s;animation-delay:-1s;}
.hp-surf-line:nth-child(5){bottom:140px;background:rgba(255,181,71,.1);animation-duration:15s;animation-delay:-6s;}
.hp-surf-line:nth-child(6){bottom:165px;background:rgba(255,138,59,.08);animation-duration:12s;animation-delay:-3s;}
@keyframes hp-surf-drift{0%{transform:translateX(0) scaleY(1);}25%{transform:translateX(40px) scaleY(1.8);}50%{transform:translateX(0) scaleY(1);}75%{transform:translateX(-40px) scaleY(1.5);}100%{transform:translateX(0) scaleY(1);}}

/* FIC torch glow spots */
.hp-torch-glow{display:none;}
[data-phase="fic"] .hp-torch-glow{display:block;position:absolute;z-index:1;pointer-events:none;}
.hp-torch-glow.tg-l{left:8%;bottom:30%;width:120px;height:200px;
  background:radial-gradient(ellipse at 50% 80%,rgba(255,138,59,.2),rgba(255,90,31,.08) 50%,transparent 80%);animation:hp-tg-flicker 2.2s ease-in-out infinite;}
.hp-torch-glow.tg-r{right:8%;bottom:30%;width:120px;height:200px;
  background:radial-gradient(ellipse at 50% 80%,rgba(255,138,59,.2),rgba(255,90,31,.08) 50%,transparent 80%);animation:hp-tg-flicker 2.2s ease-in-out infinite 1.1s;}
@keyframes hp-tg-flicker{0%,100%{opacity:.7;transform:scaleY(1);}50%{opacity:1;transform:scaleY(1.1);}}

/* ── TIEBREAKER — dark moonlit ocean, danger ── */
[data-phase="tiebreaker"] .hp-bg{
  background:
    radial-gradient(ellipse 50% 60% at 50% 40%,rgba(26,167,167,.06),transparent 70%),
    radial-gradient(ellipse 70% 50% at 50% 100%,rgba(14,58,78,.35),transparent 70%),
    linear-gradient(180deg,#020a18 0%,#061628 30%,#0a1e3a 60%,#0e3a4e 100%);}
[data-phase="tiebreaker"] .hp-moon{
  box-shadow:0 0 40px rgba(200,220,255,.2),0 0 100px rgba(150,180,220,.1);
  background:radial-gradient(circle at 35% 35%,#e8eef8,#b8c8e0 60%,#8898b0);}
[data-phase="tiebreaker"] .hp-ocean-bg{height:200px;
  background:linear-gradient(180deg,transparent,rgba(14,58,78,.5) 30%,rgba(6,17,28,.9));}
[data-phase="tiebreaker"] .hp-ember{opacity:.3 !important;}
[data-phase="tiebreaker"] .hp-fin{opacity:.9;}
[data-phase="tiebreaker"] .hp-wave{background:rgba(26,167,167,.12);}

/* Tiebreaker spotlight beams */
.hp-spotlights{display:none;}
[data-phase="tiebreaker"] .hp-spotlights{display:block;position:absolute;inset:0;z-index:1;pointer-events:none;overflow:hidden;}
.hp-spot-beam{position:absolute;top:-20%;width:3px;height:140%;
  background:linear-gradient(180deg,rgba(200,220,255,.12),rgba(200,220,255,.03) 40%,transparent 80%);
  animation:hp-spot-sweep 12s ease-in-out infinite;transform-origin:top center;}
.hp-spot-beam:nth-child(1){left:25%;animation-delay:0s;}
.hp-spot-beam:nth-child(2){left:50%;animation-delay:-4s;}
.hp-spot-beam:nth-child(3){left:75%;animation-delay:-8s;}
@keyframes hp-spot-sweep{0%,100%{transform:rotate(-15deg);opacity:.5;}50%{transform:rotate(15deg);opacity:1;}}

/* ── JOUST — fire arena, combat glow ── */
[data-phase="joust"] .hp-bg{
  background:
    radial-gradient(ellipse 80% 50% at 50% 70%,rgba(196,24,47,.2),transparent 70%),
    radial-gradient(ellipse 50% 40% at 30% 50%,rgba(255,90,31,.12),transparent 60%),
    radial-gradient(ellipse 50% 40% at 70% 50%,rgba(255,90,31,.12),transparent 60%),
    linear-gradient(180deg,#0a0408 0%,#1a0a0f 25%,#2a0c12 50%,#1a0e14 75%,#0a1929 100%);}
[data-phase="joust"] .hp-moon{opacity:.3;filter:saturate(0) brightness(.6);}
[data-phase="joust"] .hp-star{opacity:.25;}
[data-phase="joust"] .hp-ember{
  background:var(--hp-magma) !important;
  box-shadow:0 0 8px var(--hp-lava),0 0 16px rgba(196,24,47,.6) !important;}
[data-phase="joust"] .hp-ocean-bg{background:linear-gradient(180deg,transparent,rgba(26,12,18,.6) 30%,rgba(10,4,8,.9));}
[data-phase="joust"] .hp-wave{background:rgba(196,24,47,.12);}
[data-phase="joust"] .hp-fin{display:none;}
[data-phase="joust"] .hp-chrome{
  background:linear-gradient(90deg,#000 0%,rgba(196,24,47,.4) 50%,#000 100%);
  border-bottom-color:var(--hp-magma);}

/* Joust fire pillars */
.hp-fire-pillars{display:none;}
[data-phase="joust"] .hp-fire-pillars{display:block;position:absolute;inset:0;z-index:1;pointer-events:none;overflow:hidden;}
.hp-fire-col{position:absolute;bottom:0;width:60px;
  background:linear-gradient(180deg,transparent,rgba(255,90,31,.04) 30%,rgba(196,24,47,.12) 70%,rgba(255,90,31,.2));
  animation:hp-fire-col-pulse 3s ease-in-out infinite;}
.hp-fire-col:nth-child(1){left:5%;height:80%;animation-delay:0s;}
.hp-fire-col:nth-child(2){right:5%;height:80%;animation-delay:-1.5s;}
.hp-fire-col:nth-child(3){left:20%;height:50%;animation-delay:-0.7s;width:30px;}
.hp-fire-col:nth-child(4){right:20%;height:50%;animation-delay:-2.2s;width:30px;}
@keyframes hp-fire-col-pulse{0%,100%{opacity:.6;transform:scaleY(1);}50%{opacity:1;transform:scaleY(1.05);}}

/* ── VOLCANO RACE — ascending lava, heavy smoke ── */
[data-phase="volcano"] .hp-bg{
  background:
    radial-gradient(ellipse 90% 40% at 50% 100%,rgba(255,90,31,.3),transparent 70%),
    radial-gradient(ellipse 60% 50% at 50% 60%,rgba(196,24,47,.12),transparent 60%),
    linear-gradient(180deg,#0a0408 0%,#1a0a04 20%,#2a1008 45%,#3a1810 65%,#4a2014 80%,#2a0c08 100%);}
[data-phase="volcano"] .hp-moon{opacity:.15;filter:hue-rotate(20deg) brightness(.4);}
[data-phase="volcano"] .hp-star{display:none;}
[data-phase="volcano"] .hp-volcano-far{opacity:.9;}
[data-phase="volcano"] .hp-volcano-far2{opacity:.9;}
[data-phase="volcano"] .hp-ocean-bg{display:none;}
[data-phase="volcano"] .hp-fin{display:none;}
[data-phase="volcano"] .hp-ember{
  box-shadow:0 0 10px var(--hp-lava),0 0 20px var(--hp-magma) !important;}
[data-phase="volcano"] .hp-chrome{
  background:linear-gradient(90deg,#000 0%,rgba(255,90,31,.3) 50%,#000 100%);
  border-bottom-color:var(--hp-lava);}

/* Volcano rising heat */
.hp-heat-haze{display:none;}
[data-phase="volcano"] .hp-heat-haze,
[data-phase="summit"] .hp-heat-haze{display:block;position:absolute;bottom:0;left:0;right:0;height:60%;z-index:1;pointer-events:none;
  background:repeating-linear-gradient(0deg,transparent 0px,rgba(255,90,31,.02) 4px,transparent 8px);
  animation:hp-heat-shimmer 4s linear infinite;}
@keyframes hp-heat-shimmer{0%{transform:translateY(0);}100%{transform:translateY(-16px);}}

/* Lava rivers */
.hp-lava-rivers{display:none;}
[data-phase="volcano"] .hp-lava-rivers{display:block;position:absolute;bottom:0;left:0;right:0;height:40%;z-index:1;pointer-events:none;overflow:hidden;}
.hp-lava-river{position:absolute;height:3px;border-radius:2px;animation:hp-lava-flow linear infinite;}
.hp-lava-river:nth-child(1){bottom:15%;left:10%;width:30%;background:linear-gradient(90deg,transparent,var(--hp-lava),var(--hp-magma),transparent);animation-duration:6s;}
.hp-lava-river:nth-child(2){bottom:30%;left:50%;width:25%;background:linear-gradient(90deg,transparent,var(--hp-gold-hot),var(--hp-lava),transparent);animation-duration:8s;animation-delay:-2s;}
.hp-lava-river:nth-child(3){bottom:50%;left:25%;width:35%;background:linear-gradient(90deg,transparent,var(--hp-magma),var(--hp-lava-hot),transparent);animation-duration:7s;animation-delay:-4s;}
.hp-lava-river:nth-child(4){bottom:8%;left:60%;width:20%;background:linear-gradient(90deg,transparent,var(--hp-gold),var(--hp-lava),transparent);animation-duration:5s;animation-delay:-1s;}
@keyframes hp-lava-flow{0%{transform:translateX(-100%);}100%{transform:translateX(200%);}}

/* ── SUMMIT — peak eruption, extreme heat ── */
[data-phase="summit"] .hp-bg{
  background:
    radial-gradient(ellipse 80% 60% at 50% 20%,rgba(255,90,31,.25),transparent 60%),
    radial-gradient(ellipse 100% 50% at 50% 100%,rgba(196,24,47,.35),transparent 60%),
    linear-gradient(180deg,#2a0808 0%,#4a1008 25%,#6a1810 45%,#4a0c08 65%,#1a0408 100%);}
[data-phase="summit"] .hp-moon{display:none;}
[data-phase="summit"] .hp-star{display:none;}
[data-phase="summit"] .hp-volcano-far{opacity:1;border-color:transparent transparent #2a0c08 transparent;}
[data-phase="summit"] .hp-volcano-far2{opacity:1;border-color:transparent transparent #1a0808 transparent;}
[data-phase="summit"] .hp-ocean-bg{display:none;}
[data-phase="summit"] .hp-fin{display:none;}
[data-phase="summit"] .hp-ember{
  width:4px !important;height:4px !important;
  background:var(--hp-gold-hot) !important;
  box-shadow:0 0 12px var(--hp-lava),0 0 24px var(--hp-magma) !important;}
[data-phase="summit"] .hp-chrome{
  background:linear-gradient(90deg,#1a0404 0%,rgba(196,24,47,.5) 50%,#1a0404 100%);
  border-bottom-color:var(--hp-magma);animation:hp-chrome-pulse 3s ease-in-out infinite;}
@keyframes hp-chrome-pulse{0%,100%{border-bottom-color:var(--hp-magma);}50%{border-bottom-color:var(--hp-lava-hot);}}

/* Summit lava curtain */
.hp-lava-curtain{display:none;}
[data-phase="summit"] .hp-lava-curtain{display:block;position:absolute;top:0;left:0;right:0;height:100%;z-index:1;pointer-events:none;
  background:linear-gradient(180deg,rgba(255,90,31,.08) 0%,transparent 20%,transparent 80%,rgba(196,24,47,.12) 100%);
  animation:hp-curtain-breathe 5s ease-in-out infinite;}
@keyframes hp-curtain-breathe{0%,100%{opacity:.6;}50%{opacity:1;}}

/* ── ENDINGS — eruption aftermath, celebration ── */
[data-phase="endings"] .hp-bg{
  background:
    radial-gradient(ellipse 60% 40% at 50% 30%,rgba(255,181,71,.12),transparent 60%),
    radial-gradient(ellipse 80% 50% at 50% 90%,rgba(196,24,47,.15),transparent 60%),
    linear-gradient(180deg,#1a0a04 0%,#0a1929 40%,#0e3a4e 80%,#0a1929 100%);}
[data-phase="endings"] .hp-moon{
  background:radial-gradient(circle at 35% 35%,#fff9e0,#ffd166 60%,#ff8a3b);
  box-shadow:0 0 60px rgba(255,200,120,.35),0 0 140px rgba(255,160,90,.18);opacity:.7;}
[data-phase="endings"] .hp-ember{
  background:var(--hp-gold) !important;
  box-shadow:0 0 6px var(--hp-gold-hot),0 0 12px rgba(255,181,71,.4) !important;}
[data-phase="endings"] .hp-chrome{
  background:linear-gradient(90deg,#000 0%,rgba(255,181,71,.25) 50%,#000 100%);
  border-bottom-color:var(--hp-gold);}

/* Endings firework bursts */
.hp-fireworks{display:none;}
[data-phase="endings"] .hp-fireworks{display:block;position:absolute;inset:0;z-index:1;pointer-events:none;overflow:hidden;}
.hp-fw-burst{position:absolute;width:6px;height:6px;border-radius:50%;animation:hp-fw-pop ease-out infinite;}
.hp-fw-burst:nth-child(1){left:15%;top:20%;background:var(--hp-gold);animation-duration:4s;animation-delay:0s;}
.hp-fw-burst:nth-child(2){left:70%;top:15%;background:var(--hp-teal);animation-duration:5s;animation-delay:-1.5s;}
.hp-fw-burst:nth-child(3){left:40%;top:25%;background:var(--hp-bruise);animation-duration:4.5s;animation-delay:-3s;}
.hp-fw-burst:nth-child(4){left:85%;top:30%;background:var(--hp-lava-hot);animation-duration:3.5s;animation-delay:-0.8s;}
.hp-fw-burst:nth-child(5){left:25%;top:10%;background:var(--hp-gold-hot);animation-duration:5.5s;animation-delay:-2.5s;}
.hp-fw-burst:nth-child(6){left:55%;top:35%;background:var(--hp-teal);animation-duration:4.2s;animation-delay:-4s;}
@keyframes hp-fw-pop{
  0%{transform:scale(0);opacity:0;box-shadow:none;}
  10%{transform:scale(1);opacity:1;box-shadow:0 0 4px currentColor;}
  30%{transform:scale(3);opacity:1;box-shadow:0 0 20px currentColor,0 0 40px currentColor;}
  60%{transform:scale(5);opacity:.4;box-shadow:0 0 30px currentColor;}
  100%{transform:scale(8);opacity:0;box-shadow:none;}}

/* ═════════════ RESPONSIVE ═════════════ */
@media(max-width:980px){
  .hp-title-main{font-size:64px;}
  .hp-title-stage{height:480px;}
  .hp-finalists{grid-template-columns:1fr !important;}
  .hp-dialogue{grid-template-columns:1fr;}
  .hp-vs{display:none;}
  .hp-matchup{grid-template-columns:1fr;text-align:center;}
}
@media(prefers-reduced-motion:reduce){
  *{animation-duration:.01ms !important;animation-iteration-count:1 !important;}
  .hp-ember,.hp-star,.hp-fin,.hp-surf-shimmer,.hp-spotlights,.hp-fire-pillars,.hp-heat-haze,.hp-lava-rivers,.hp-lava-curtain,.hp-fireworks,.hp-torch-glow{display:none !important;}
}
</style>

<!-- CHROME -->
<div class="hp-chrome">
  <div style="display:flex;align-items:center;gap:10px">
    <div class="hp-live"><span class="hp-live-dot"></span> LIVE</div>
    <div class="hp-finale-tag">SEASON FINALE</div>
  </div>
  <div class="hp-ticker"><div class="hp-ticker-inner">${tickerText}</div></div>
  <div class="hp-channel">PUNCH.TV</div>
</div>

<!-- TABS -->
<div class="hp-tabs">${tabHtml}</div>

<!-- AMBIENT BG -->
<div class="hp-bg">
  <div class="hp-moon"></div>
  <div class="hp-stars">${stars}</div>
  <div class="hp-volcano-far"></div>
  <div class="hp-volcano-far2"></div>
  <div class="hp-ocean-bg">${waves}</div>
</div>
<div class="hp-embers">${embers}</div>
<div class="hp-fins">${fins}</div>

<!-- PHASE-SPECIFIC AMBIENT -->
<div class="hp-surf-shimmer">
  <div class="hp-surf-line"></div><div class="hp-surf-line"></div><div class="hp-surf-line"></div>
  <div class="hp-surf-line"></div><div class="hp-surf-line"></div><div class="hp-surf-line"></div>
</div>
<div class="hp-torch-glow tg-l"></div>
<div class="hp-torch-glow tg-r"></div>
<div class="hp-spotlights">
  <div class="hp-spot-beam"></div><div class="hp-spot-beam"></div><div class="hp-spot-beam"></div>
</div>
<div class="hp-fire-pillars">
  <div class="hp-fire-col"></div><div class="hp-fire-col"></div><div class="hp-fire-col"></div><div class="hp-fire-col"></div>
</div>
<div class="hp-heat-haze"></div>
<div class="hp-lava-rivers">
  <div class="hp-lava-river"></div><div class="hp-lava-river"></div><div class="hp-lava-river"></div><div class="hp-lava-river"></div>
</div>
<div class="hp-lava-curtain"></div>
<div class="hp-fireworks">
  <div class="hp-fw-burst"></div><div class="hp-fw-burst"></div><div class="hp-fw-burst"></div>
  <div class="hp-fw-burst"></div><div class="hp-fw-burst"></div><div class="hp-fw-burst"></div>
</div>

<!-- CONTENT -->
<div class="hp-content">
${content}
</div>

</div>`;
}

// ══════════════════════════════════════════════════════════════
// VOLCANO SVG (for title stage)
// ══════════════════════════════════════════════════════════════
function _volcanoSVG() {
  return `<svg viewBox="0 0 560 320" preserveAspectRatio="xMidYMax meet">
  <defs>
    <linearGradient id="hp-volc" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#3a1a08"/><stop offset="1" stop-color="#1a0a04"/>
    </linearGradient>
    <linearGradient id="hp-lavaG" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffd166"/><stop offset=".4" stop-color="#ff8a3b"/><stop offset="1" stop-color="#c4182f"/>
    </linearGradient>
    <radialGradient id="hp-craterGlow" cx="50%" cy="100%" r="50%">
      <stop offset="0" stop-color="#ffd166"/><stop offset=".5" stop-color="#ff5a1f"/><stop offset="1" stop-color="#7a0b1d" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <path d="M0 320 L160 60 L210 80 L240 50 L280 60 L320 50 L350 80 L400 60 L560 320 Z" fill="url(#hp-volc)" stroke="#1a0a04" stroke-width="2"/>
  <path d="M260 90 L256 130 L240 170 L226 220 L218 320" stroke="url(#hp-lavaG)" stroke-width="5" fill="none" stroke-linecap="round" class="hp-lava-glow"/>
  <path d="M300 88 L308 140 L320 180 L334 230 L344 320" stroke="url(#hp-lavaG)" stroke-width="6" fill="none" stroke-linecap="round" class="hp-lava-glow"/>
  <path d="M280 80 L284 120 L278 160 L278 200 L280 320" stroke="url(#hp-lavaG)" stroke-width="4" fill="none" stroke-linecap="round" class="hp-lava-glow"/>
  <ellipse cx="280" cy="60" rx="80" ry="20" fill="url(#hp-craterGlow)" class="hp-lava-glow"/>
  <g class="hp-lava-spout">
    <path d="M260 55 Q270 -10 280 -30 Q290 -10 300 55 Z" fill="url(#hp-lavaG)" opacity=".95"/>
    <circle cx="270" cy="-20" r="6" fill="#ffd166"/>
    <circle cx="288" cy="-40" r="5" fill="#ff8a3b"/>
    <circle cx="296" cy="-25" r="4" fill="#ffb547"/>
    <circle cx="276" cy="-50" r="3" fill="#ffd166"/>
  </g>
</svg>`;
}

// Palm SVG
function _palmSVG(side) {
  if (side === 'left') {
    return `<svg width="170" height="280" viewBox="0 0 170 280">
      <path d="M68 280 Q72 200 76 100 Q80 40 70 10" stroke="#1a0e08" stroke-width="10" fill="none" stroke-linecap="round"/>
      <path d="M70 30 Q20 10 0 50 Q40 30 70 40 Z" fill="#0e4a2d"/>
      <path d="M70 30 Q120 10 165 40 Q120 28 78 42 Z" fill="#1f7a4a"/>
      <path d="M70 30 Q40 -10 10 0 Q40 20 76 36 Z" fill="#1f7a4a"/>
      <path d="M70 30 Q110 -10 150 0 Q120 20 78 38 Z" fill="#0e4a2d"/>
      <path d="M70 30 Q35 30 5 90 Q40 50 76 44 Z" fill="#0e4a2d"/>
      <path d="M70 30 Q110 30 158 80 Q115 45 78 44 Z" fill="#1f7a4a"/>
      <circle cx="74" cy="44" r="6" fill="#3a1f0e"/><circle cx="62" cy="48" r="5" fill="#3a1f0e"/>
    </svg>`;
  }
  return `<svg width="170" height="280" viewBox="0 0 170 280">
    <path d="M100 280 Q96 200 92 100 Q88 40 100 10" stroke="#1a0e08" stroke-width="10" fill="none" stroke-linecap="round"/>
    <path d="M98 30 Q40 10 5 50 Q50 30 96 40 Z" fill="#1f7a4a"/>
    <path d="M98 30 Q140 10 168 40 Q130 28 100 42 Z" fill="#0e4a2d"/>
    <path d="M98 30 Q60 -10 30 0 Q60 20 96 36 Z" fill="#0e4a2d"/>
    <path d="M98 30 Q130 -10 160 0 Q130 20 100 38 Z" fill="#1f7a4a"/>
    <path d="M98 30 Q60 30 10 90 Q50 50 96 44 Z" fill="#1f7a4a"/>
    <path d="M98 30 Q140 30 165 80 Q130 45 100 44 Z" fill="#0e4a2d"/>
    <circle cx="92" cy="44" r="6" fill="#3a1f0e"/><circle cx="104" cy="48" r="5" fill="#3a1f0e"/>
  </svg>`;
}

// ══════════════════════════════════════════════════════════════
// HELPER: resolve bench lists from ep.benchAssignments
// ══════════════════════════════════════════════════════════════
function _getBenchLists(ep, finalists) {
  if (!ep.benchAssignments) return {};
  const result = {};
  for (const f of finalists) result[f] = ep.benchAssignments[f] || [];
  return result;
}

// ══════════════════════════════════════════════════════════════
// SCREEN 1: TITLE CARD
// ══════════════════════════════════════════════════════════════
export function rpBuildHPTitleCard(ep) {
  const finalists = ep.finaleFinalists || [];
  if (!finalists.length) return _hpShell('<p>No finale data.</p>', ep, 'title');

  const fCount = finalists.length;
  const gridCls = fCount >= 3 ? 'f3' : 'f2';
  const finalistCards = finalists.map((f, i) => _finalistPanel(f, i)).join('');

  const epNum = gs.episodeHistory ? gs.episodeHistory.length : '?';
  const seasonNum = gs.seasonNumber || '?';

  const vineLeaves = Array.from({ length: 12 }, () => '<span class="hp-vine-leaf"></span>').join('');

  const hostLine = pick([
    `"Three of you walked off that plane. Only one is leaving with a check. Welcome to <strong>Hawaiian Punch</strong>."`,
    `"This." ${host()} gestures at the volcano behind ${pr(host()).obj || 'him'}. "Is where legends are made. Or die trying."`,
    `"One challenge. One winner. One MILLION dollars." ${host()} grins. "And one very angry volcano."`,
    `"Forget everything you think you know." ${host()} cracks ${pr(host()).posAdj || 'his'} knuckles. "Tonight, it ends."`,
  ]);

  const stakeText = (() => {
    const hist = gs.episodeHistory || [];
    const epCount = hist.length;
    const elimCount = hist.filter(e => e.eliminated).length;
    const idolPlays = hist.reduce((n, e) => n + (e.idolPlays || []).filter(p => !p.misplay && !p.failed && (p.votesNegated || 0) > 0).length, 0);
    const medevacs = (gs.medevacs || []).length;
    const showmances = (gs.showmances || []).filter(s => s.phase !== 'broken-up').length;
    const breakups = (gs.showmances || []).filter(s => s.phase === 'broken-up').length;
    const blindsides = hist.filter(e => (e.campEvents && Object.values(e.campEvents).some(g => g.post?.some(ev => ev.type === 'blindside')))).length;

    const highlights = [];
    if (elimCount > 0) highlights.push(`<strong>${elimCount}</strong> eliminations`);
    if (blindsides > 0) highlights.push(`${blindsides} blindside${blindsides > 1 ? 's' : ''}`);
    if (idolPlays > 0) highlights.push(`${idolPlays} idol play${idolPlays > 1 ? 's' : ''}`);
    if (medevacs > 0) highlights.push(`${medevacs} medevac${medevacs > 1 ? 's' : ''}`);
    if (showmances > 0) highlights.push(`${showmances} showmance${showmances > 1 ? 's' : ''}`);
    if (breakups > 0) highlights.push(`${breakups} heartbreak${breakups > 1 ? 's' : ''}`);

    const recapLine = highlights.length > 0
      ? `After ${epCount} episodes of chaos — ${highlights.join(', ')} —`
      : `After ${epCount} episodes of chaos,`;

    const mechLine = fCount === 3
      ? 'first settle a tie. The winner of that joust faces the front-runner in a'
      : 'compete in a';
    return `${recapLine} the road ends here — on the slopes of an <em>active volcano</em>. The Final ${fCount === 3 ? 'Three' : 'Two'} must ${mechLine} sacrificial-dummy race up the mountain. Whoever throws their dummy into the crater first takes home the <strong>million dollars</strong>.`;
  })();

  return _hpShell(`
    <!-- ANIMATED TITLE STAGE -->
    <div class="hp-title-stage">
      <div class="hp-vine-top">${vineLeaves}</div>
      <div class="hp-sun"></div>
      <div class="hp-smoke s1"></div>
      <div class="hp-smoke s2"></div>
      <div class="hp-smoke s3"></div>

      <div class="hp-volcano">${_volcanoSVG()}</div>

      <div class="hp-climber">
        <div class="c-dummy"></div>
        <div class="c-hair"></div>
        <div class="c-head">${portrait(finalists[0], 16)}</div>
        <div class="c-body"></div>
        <div class="c-leg"></div>
        <div class="c-leg r"></div>
      </div>

      <div class="hp-pineapple"></div>
      <div class="hp-pineapple" style="animation-delay:-2s;left:50%"></div>

      <div class="hp-tiki t-left">
        <div class="hp-tiki-pole"></div>
        <div class="hp-tiki-bowl"></div>
        <div class="hp-flame"></div>
      </div>
      <div class="hp-tiki t-right">
        <div class="hp-tiki-pole"></div>
        <div class="hp-tiki-bowl"></div>
        <div class="hp-flame"></div>
      </div>

      <div class="hp-jouster-stage">
        <div class="hp-plank p-left"></div>
        <div class="hp-plank p-right"></div>
        <div class="hp-jouster j-a">
          <div class="j-head">${portrait(finalists[fCount >= 3 ? 1 : 0], 20)}</div>
          <div class="j-bra"></div>
          <div class="j-torso"></div>
          <div class="j-skirt"></div>
          <div class="j-leg"></div>
          <div class="j-leg r"></div>
          <div class="j-arm-fwd"></div>
          <div class="j-stick"></div>
        </div>
        <div class="hp-jouster j-b">
          <div class="j-head">${portrait(finalists[fCount >= 3 ? 2 : 1], 20)}</div>
          <div class="j-bra"></div>
          <div class="j-torso"></div>
          <div class="j-skirt"></div>
          <div class="j-leg"></div>
          <div class="j-leg r"></div>
          <div class="j-arm-fwd"></div>
          <div class="j-stick"></div>
        </div>
        <div class="hp-impact"><div class="hp-impact-rays"></div></div>
      </div>

      <div class="hp-palm left">${_palmSVG('left')}</div>
      <div class="hp-palm right">${_palmSVG('right')}</div>

      <div class="hp-title-text">
        <div class="hp-title-kicker">★ FINALE OF THE SEASON ★</div>
        <div class="hp-title-main">HAWAIIAN<br>PUNCH</div>
        <div class="hp-title-sub">The Million-Dollar Eruption</div>
        <div class="hp-title-ep"><span class="dot"></span> EP ${epNum} · SEASON ${seasonNum} · NIGHT <span class="dot"></span></div>
      </div>

      <div class="hp-vine-bottom">${vineLeaves}</div>
      <div class="hp-drip d1"></div>
      <div class="hp-drip d2"></div>
      <div class="hp-drip d3"></div>
    </div>

    <!-- FINALIST CARDS -->
    <div class="hp-section-head">
      <div class="hp-section-num">F${fCount}</div>
      <div class="hp-section-title">The Final ${fCount === 3 ? 'Three' : 'Two'}</div>
      <div class="hp-section-meta">${fCount} enter · 1 walks away with $1M</div>
    </div>

    <div class="hp-finalists ${gridCls}">
      ${finalistCards}
    </div>

    <div class="hp-card" data-fac="host">
      <div class="hp-card-hdr"><span class="hp-card-title">The Final Challenge</span><span class="hp-badge hp-b-volcano">VOLCANO</span></div>
      <div class="hp-card-body">${stakeText}</div>
    </div>

    <div class="hp-host-line">${hostLine} — ${host()}, smiling too wide</div>
  `, ep, 'title');
}

// ══════════════════════════════════════════════════════════════
// SCREEN 1B: HAWAIIAN STYLE — Final Immunity Challenge
// ══════════════════════════════════════════════════════════════

const ANIMAL_EMOJI = { jaguar:'🐆', shark:'🦈', dolphin:'🐬', hawk:'🦅', scorpion:'🦂', monkey:'🐒', deer:'🦌', turtle:'🐢', owl:'🦉', wolf:'🐺', parrot:'🦜' };
const ANIMAL_DESC = {
  jaguar:'Sleek, fast, and ruthlessly cunning', shark:'A relentless open-ocean predator', dolphin:'Graceful, social, deceptively smart',
  hawk:'Sharp-eyed and fiercely noble', scorpion:'Patient, venomous, strikes without warning', monkey:'Chaotic, unpredictable, always moving',
  deer:'Gentle but surprisingly resilient', turtle:'Slow, steady, outlasts them all', owl:'Silent, all-seeing, strikes from darkness',
  wolf:'Pack leader with killer instinct', parrot:'Loud, colorful, impossible to ignore',
};
const ANIMAL_PICK_TEXT = {
  jaguar: [
    (p) => `${p} eyes the jaguar's enclosure. "Fast. Smart. Dangerous." A knowing smile. "That one's mine."`,
    (p) => `"The jaguar," ${p} says without hesitation. Predators recognize predators.`,
  ],
  shark: [
    (p) => `${p} points at the shark tank. "Nothing stops a shark." ${host()} raises an eyebrow. "Bold choice."`,
    (p) => `"I want the one that scares people." ${p} grins at the circling shark. "Perfect."`,
  ],
  dolphin: [
    (p) => `${p} watches the dolphin arc through the water. "Beautiful AND smart? That's my energy."`,
    (p) => `"Everyone underestimates dolphins," ${p} says thoughtfully. "They shouldn't."`,
  ],
  hawk: [
    (p) => `${p} gazes up at the hawk perched above. "Sees everything. Strikes when ready." A nod. "That one."`,
    (p) => `The hawk locks eyes with ${p} from across the clearing. "I think it chose me," ${p} whispers.`,
  ],
  scorpion: [
    (p) => `${p} kneels beside the scorpion tank. "Small, quiet, and absolutely lethal." A thin smile. "We understand each other."`,
    (p) => `"The scorpion." ${p} doesn't blink. The other finalists exchange a look.`,
  ],
  monkey: [
    (p) => `"THE MONKEY!" ${p} practically leaps. The monkey screams back. Instant bond.`,
    (p) => `${p} locks eyes with the monkey. It throws a coconut. ${p} catches it. "We're doing this."`,
  ],
  deer: [
    (p) => `${p} notes the other animals — all teeth and claws — and quietly picks the deer. "Everyone laughs at the deer," ${p} says. "That's why it survives."`,
    (p) => `"The deer." The peanut gallery snickers. ${p} just smiles. "Laugh now."`,
  ],
  turtle: [
    (p) => `${p} watches the turtle plod along, unfazed by the volcano rumbling overhead. "That," ${p} says. "That's a winner's attitude."`,
    (p) => `"Slow and steady wins the race." ${p} picks up the turtle gently. "Let's prove them wrong."`,
  ],
  owl: [
    (p) => `${p} locks eyes with the owl perched silently in the shadows. Neither blinks. "That one sees everything," ${p} murmurs. "So do I."`,
    (p) => `"The owl." ${p} doesn't explain. Doesn't need to. The owl's golden eyes say enough.`,
  ],
  wolf: [
    (p) => `${p} stares down the wolf. It stares back. "We're the same," ${p} says flatly. "Hunters."`,
    (p) => `The wolf lets out a low growl as ${p} approaches. "Easy." A hand on its muzzle. "We've got a race to win."`,
  ],
  parrot: [
    (p) => `"BAWK! BAWK!" The parrot screams before ${p} even gets close. "Yeah," ${p} laughs. "That's the one."`,
    (p) => `${p} picks the parrot. It immediately starts mimicking ${host()}'s voice. The peanut gallery loses it.`,
  ],
};

// ── LAUNCH narration (beat 1 — explosive start) ──
const FIC_LAUNCH = {
  fast: [
    (p) => `${p} EXPLODES off the line — legs churning, arms pumping, volcanic ash flying in ${pr(p).posAdj} wake. First up the slope by a body length.`,
    (p) => `Like a cannon shot. ${p} hits the incline at full sprint, leaving the others scrambling to match the pace.`,
    (p) => `${p} takes the early lead with a burst of pure adrenaline. The crowd gasps at the raw speed.`,
    (p) => `"GO GO GO!" The peanut gallery erupts as ${p} tears up the slope like ${pr(p).sub} ${pr(p).sub === 'they' ? 'were' : 'was'} born on a volcano.`,
  ],
  normal: [
    (p) => `${p} settles into a steady rhythm on the volcanic slope. Not flashy, but consistent — saving energy for what's ahead.`,
    (p) => `${p} pushes up the path at a solid pace, eyes locked on the trail ahead. Smart. Measured.`,
    (p) => `A controlled start from ${p} — not the fastest, but not falling behind either. The mountain is long.`,
    (p) => `${p} finds ${pr(p).posAdj} footing on the loose pumice and starts climbing. One step at a time.`,
  ],
};

// ── MIDHILL narration (beat 2 — obstacles) ──
const FIC_MIDHILL = {
  stumble: [
    (p) => `${p} catches a foot on a chunk of loose volcanic rock and goes DOWN — tumbling sideways, scraping both knees on the pumice!`,
    (p) => `A BRUTAL stumble! The ash-covered trail gives way under ${p}'s weight and ${pr(p).sub} ${pr(p).sub === 'they' ? 'slide' : 'slides'} back three body lengths!`,
    (p) => `${p} slips on a steam vent — hot vapor blasts up as ${pr(p).sub} ${pr(p).sub === 'they' ? 'lose' : 'loses'} footing and crashes into the rocks!`,
    (p) => `The heat and loose terrain conspire against ${p} — a nasty stumble that costs precious seconds. The frustration is visible.`,
    (p) => `"NO!" ${p}'s ankle rolls on a piece of pumice. ${pr(p).Sub} ${pr(p).sub === 'they' ? 'go' : 'goes'} down HARD. The mountain is fighting back.`,
  ],
  clean: [
    (p) => `${p} powers through the midhill section — dodging steam vents, hopping over cracks in the volcanic crust like a pro.`,
    (p) => `The terrain gets brutal but ${p} adapts, picking a line through the rocks that the others didn't see.`,
    (p) => `${p} attacks the steepest section with confidence. Every step is deliberate. Every handhold is calculated.`,
    (p) => `While others struggle, ${p} finds a rhythm on the volcanic switchbacks. This is where endurance pays off.`,
    (p) => `${p} weaves through the steam vents without breaking stride. The heat is punishing but ${pr(p).sub} ${pr(p).sub === 'they' ? 'don\'t' : 'doesn\'t'} slow down.`,
  ],
};

// ── SUMMIT GRAB narration (beat 3) ──
const FIC_SUMMIT_GRAB = [
  (p, first) => first ? `${p} crests the ridge FIRST and SNATCHES the lei from the volcanic pedestal! The others are still climbing!` : `${p} arrives at the summit and grabs a lei — but ${pr(p).sub} ${pr(p).sub === 'they' ? 'aren\'t' : 'isn\'t'} first. Time lost.`,
  (p, first) => first ? `FIRST TO THE TOP! ${p} rips the lei off the altar stone while the volcano rumbles beneath ${pr(p).posAdj} feet.` : `${p} reaches the summit lei station moments behind. The gap is small but it's there.`,
  (p, first) => first ? `${p} lunges for the lei at the summit, grabbing it with a triumphant yell that echoes off the crater walls!` : `${p} grabs ${pr(p).posAdj} lei at the top, breathing hard. Not first, but not out of it.`,
];

// ── LEI STEAL narration ──
const FIC_STEAL = [
  (atk, vic, ok, arch) => ok
    ? `${atk} makes ${pr(atk).posAdj} move — SNATCHES ${vic}'s lei right off ${pr(vic).posAdj} neck mid-stride! ${arch === 'villain' || arch === 'schemer' ? `"Shouldn't have turned your back," ${atk} sneers.` : `"Sorry — not sorry!" ${atk} laughs.`}`
    : `${atk} lunges for ${vic}'s lei but ${vic} sees it coming — a swift block sends ${atk} stumbling! "NICE TRY!" ${vic} shouts back.`,
  (atk, vic, ok, arch) => ok
    ? `In a move straight out of the Courtney playbook, ${atk} YANKS ${vic}'s lei while ${pr(vic).sub} ${pr(vic).sub === 'they' ? 'aren\'t' : 'isn\'t'} looking! The peanut gallery goes BALLISTIC!`
    : `${atk} reaches for ${vic}'s lei — and gets a SHOVE for ${pr(atk).posAdj} trouble! ${vic}: "Get your OWN lei!"`,
  (atk, vic, ok) => ok
    ? `"Finders keepers!" ${atk} grabs ${vic}'s lei in one smooth motion. ${vic} doesn't even realize it's gone for three whole seconds.`
    : `${atk} makes a grab for the lei — ${vic}'s reflexes are faster. The lei stays put. The grudge doesn't.`,
  (atk, vic, ok) => ok
    ? `${atk} shoulder-checks ${vic} and SWIPES the lei in the chaos! The crowd erupts — half cheering, half booing.`
    : `${atk}'s lei-steal attempt is clumsy — ${vic} clutches it tight and accelerates away. "PATHETIC!" the crowd jeers.`,
];

// ── BOARD LAUNCH narration (surf beat 1) ──
const FIC_BOARD_LAUNCH = [
  (p) => `${p} grabs a board, takes one look at the volcanic rapids, and DROPS IN — immediately carving through the first set of waves.`,
  (p) => `${p} hits the water running, board under arm, and launches into the rapids with zero hesitation.`,
  (p) => `A deep breath. ${p} pushes off the cliff edge, lands on the board, and the descent begins. The volcano roars approval.`,
  (p) => `${p} studies the current for half a second — then commits. The board hits the water and ${pr(p).sub} ${pr(p).sub === 'they' ? 'are' : 'is'} OFF.`,
];

// ── RAPIDS narration (surf beat 2) ──
const FIC_RAPIDS = {
  wipeout: [
    (p) => `${p} catches an edge and goes FLYING — a spectacular cartwheel into the volcanic rapids! Board tumbling downstream!`,
    (p) => `The current GRABS ${p}'s board and spins it 180 — total wipeout! ${p} surfaces sputtering, desperately swimming for the board.`,
    (p) => `A rogue wave of volcanic runoff catches ${p} off guard — board goes one way, ${p} goes the other! DEVASTATING!`,
    (p) => `${p}'s board hits a submerged rock and LAUNCHES ${pr(p).obj} into an involuntary backflip. The peanut gallery winces collectively.`,
    (p) => `"OHHHH!" The crowd screams as ${p} hits a wave wrong and gets CHURNED under the rapids. Terrifying seconds before ${pr(p).sub} ${pr(p).sub === 'they' ? 'surface' : 'surfaces'}.`,
  ],
  clean: [
    (p) => `${p} reads the rapids like a book — cutting left, right, threading between volcanic rocks with terrifying precision.`,
    (p) => `The spray is blinding but ${p} doesn't flinch. Low center of gravity, perfect balance. This is a masterclass.`,
    (p) => `${p} surfs the volcanic current like ${pr(p).sub} ${pr(p).sub === 'they' ? 'were' : 'was'} born on a surfboard. The crowd is on its feet.`,
    (p) => `Smooth. Controlled. ${p} navigates the rapids without a single wobble. The volcano tried. The volcano failed.`,
  ],
};

// ── BEACH LANDING narration (surf beat 3) ──
const FIC_BEACH_LANDING = {
  first: [
    (p) => `${p} SHOOTS out of the rapids and slides onto the beach FIRST — sand spraying, arms raised! The animals await!`,
    (p) => `FIRST TO SHORE! ${p} leaps off the board and sprints toward the spirit animal pens without looking back!`,
  ],
  later: [
    (p) => `${p} washes ashore moments later — soaked, exhausted, but still in the race. The animal pen is RIGHT THERE.`,
    (p) => `${p} drags ${pr(p).ref} out of the surf and stumbles toward the spirit animals. Close. So close.`,
    (p) => `${p} hits the beach and immediately locks eyes on ${pr(p).posAdj} spirit animal. No time to rest. GO.`,
  ],
};

// ── ANIMAL APPROACH narration (lei beat 1) ──
const FIC_APPROACH = {
  attacked: [
    (p, animal) => `The ${animal} is NOT having it — ${p} reaches out and it SNAPS! ${p} stumbles backward, lei swinging wildly.`,
    (p, animal) => `${p} extends the lei toward the ${animal} — SWIPE! Claws rake the air inches from ${pr(p).posAdj} face! "${pr(p).Sub} is ANGRY!"`,
    (p, animal) => `"Easy… EASY—" The ${animal} LUNGES at ${p}, sending ${pr(p).obj} sprawling. The lei goes flying. Total chaos.`,
    (p, animal) => `The ${animal} eyes ${p}'s lei with suspicion, then charges. ${p} barely dodges. "COME ON!" ${pr(p).Sub} yells at the sky.`,
  ],
  clean: [
    (p, animal) => `${p} drops low, moves slowly, lets the ${animal} smell the lei. Patient. Reading its body language. This is strategy, not strength.`,
    (p, animal) => `${p} approaches the ${animal} from downwind, voice soft, movements glacial. The ${animal}'s ears flatten — but it doesn't bolt.`,
    (p, animal) => `A gentle hand extended. The ${animal} sniffs. ${p} doesn't flinch. Trust — earned one heartbeat at a time.`,
    (p, animal) => `${p} mirrors the ${animal}'s posture, crouching to eye level. A moment of mutual recognition. ${pr(p).Sub} is ready for the placement.`,
  ],
};

// ── LEI PLACEMENT narration (lei beat 2) ──
const FIC_LEI_PLACE = {
  crowned: [
    (p, animal) => `And the lei goes ON! ${p} drapes it over the ${animal}'s neck in one smooth motion. DONE! The crowd ERUPTS!`,
    (p, animal) => `${p} slips the lei around the ${animal}'s neck — the ${animal} stands perfectly still, as if it knows. It's over.`,
    (p, animal) => `With trembling hands, ${p} crowns the ${animal} with the lei. A breath held by everyone on the beach. It's good. IT'S GOOD!`,
    (p, animal) => `The ${animal} and ${p} lock eyes. ${p} reaches out. The lei slides on. Neither breaks eye contact. Respect.`,
  ],
  struggled: [
    (p, animal) => `${p} finally gets the lei around the ${animal}'s neck — but it took two attempts and the ${animal} is NOT happy about it.`,
    (p, animal) => `After a wrestling match with a very uncooperative ${animal}, ${p} manages to crown it. Barely. The sweat says it all.`,
    (p, animal) => `The ${animal} squirms. ${p} fumbles. The lei catches on an ear. But eventually — EVENTUALLY — it goes on. ${p} collapses in relief.`,
  ],
};

// ── HOST TRANSITIONS ──
const FIC_HOST_TRANSITIONS = {
  afterDraft: [
    () => `"Spirit animals chosen." ${host()} surveys the lineup of beasts and grins. "Now let's see who can keep up with theirs."`,
    () => `${host()} claps once. "Animals assigned. Volcano's waiting. Let's MOVE."`,
    () => `"Interesting choices." ${host()} strokes ${pr(host()).posAdj || 'his'} chin. "Very interesting. Now — RACE."`,
  ],
  afterSprint: [
    (leader) => `"${leader} takes the early lead!" ${host()} commentates from a helicopter above. "But the surf descent changes EVERYTHING."`,
    (leader) => `${host()} leans into the megaphone: "That was Phase ONE, people. The water is where this gets REAL."`,
    (leader) => `"Grab your boards!" ${host()} yells from the beach. "The volcano rapids don't care who was first up the mountain!"`,
  ],
  afterSurf: [
    () => `"LAST PHASE!" ${host()} bellows. "Crown your spirit animal and it's OVER! Immunity on the line!"`,
    () => `${host()} watches from the finish line. "This is it. One lei. One animal. One immunity necklace."`,
    () => `"The animals await." ${host()}'s voice drops to a whisper. "Careful, now. They bite."`,
  ],
};

// ── CONFESSIONAL narration ──
const FIC_CONFESSIONALS = {
  leader: [
    (p) => `I could feel them behind me. Every step — I could hear their breathing. But I was FIRST to that summit. That momentum? It's MINE now.`,
    (p) => `My legs are screaming but I don't care. I'm in front. I'm in FRONT. One more phase and this necklace is around my neck.`,
    (p) => `I trained for this. Every morning, running up hills while everyone else slept. This is MY moment.`,
  ],
  trailing: [
    (p) => `I can see ${pr(p).obj === 'them' ? 'them' : 'the others'} pulling ahead and... okay. Panic. Full panic. But I've come back from worse. I HAVE to.`,
    (p) => `Last place. LAST PLACE. After everything this season. No. No no no. I'm not going out like this. Not to a SURFBOARD.`,
    (p) => `My board is sideways, my lei is soaked, and I think a fish hit me in the face. But I'm still standing. That counts for something.`,
  ],
  'steal-victim': [
    (p) => `Are you KIDDING me?! ${pr(p).Sub} just STOLE my lei! In front of EVERYONE! Oh, this isn't over. This is NOT over.`,
    (p) => `I worked so hard to get to that summit first and they just... snatched it. I have never been this angry. Channel it. USE it.`,
  ],
  'steal-blocked': [
    (p) => `Nice try. I saw that coming from a MILE away. You want my lei? You're gonna have to EARN one.`,
    (p) => `The look on their face when I blocked that steal? PRICELESS. You don't survive this game without watching your back.`,
  ],
  'lei-winner': [
    (p) => `The animal — it just LET me put the lei on. Like it knew. Like we had a deal.`,
    (p) => `I looked that animal in the eye and we had an understanding. Lei on. Challenge over. Immunity MINE.`,
  ],
  'immunity-winner': [
    (p) => `I did it. The lei is on. The necklace is around my neck. I'm safe. I... I actually did it. [voice cracks] I'm safe.`,
    (p) => `When ${host()} put that necklace around my neck, I thought about every person who voted against me this season. Look at me NOW.`,
    (p) => `IMMUNITY! IMMUNITY, BABY! [slaps camera] The volcano couldn't stop me! The rapids couldn't stop me! NOBODY CAN STOP ME!`,
  ],
};

// ── SOCIAL EVENT narration (archetype-driven) ──
const _archLabel = a => (a || '').replace(/-/g, ' ');
const _isVillainArch = a => ['villain','mastermind','schemer'].includes(a);
const _isNiceArch = a => ['hero','loyal-soldier','social-butterfly','underdog','showmancer','goat'].includes(a);

const FIC_SOCIAL = {
  'cheer': [
    (e) => `"GO GO GO!" ${e.spectator} shouts from the gallery, fist raised toward ${e.target}. The ${_archLabel(e.specArch)} can't contain it.`,
    (e) => `${e.spectator} jumps to ${pr(e.spectator).posAdj} feet: "COME ON, ${e.target.toUpperCase()}!" ${e.isSupporter ? 'Loyalty runs deep.' : 'Even from the sideline, the energy is electric.'}`,
    (e) => `"That's what I'm TALKING about!" ${e.spectator} hollers as ${e.target} pushes ahead. ${_isVillainArch(e.specArch) ? `The ${_archLabel(e.specArch)} has skin in this game.` : `Pure, unfiltered support.`}`,
    (e) => `${e.spectator} cups ${pr(e.spectator).posAdj} hands and SCREAMS for ${e.target}. ${e.isSupporter ? `"I picked my side and I'm NOT quiet about it!"` : `Even old rivals can appreciate a good run.`}`,
  ],
  'cheer-leader': [
    (e) => `"THAT'S MY PERSON!" ${e.spectator} is on ${pr(e.spectator).posAdj} feet, pointing at ${e.target}, practically coaching from the gallery. ${_isNiceArch(e.specArch) ? 'Genuine warmth.' : 'Calculated investment.'}`,
    (e) => `${e.spectator} leads the ${e.target} section of the gallery in a chant: "${e.target.toUpperCase()}! ${e.target.toUpperCase()}!" The ${_archLabel(e.specArch)} wants this win BADLY.`,
    (e) => `"You've GOT this, ${e.target}!" ${e.spectator} shouts, leaning so far forward ${pr(e.spectator).sub} nearly falls off the bench. ${e.isSupporter ? `${pr(e.spectator).Sub}'s been in ${e.target}'s corner all season.` : `An unexpected alliance.`}`,
    (e) => `${e.spectator} can't sit still. Every time ${e.target} gains ground, the ${_archLabel(e.specArch)} reacts like it's ${pr(e.spectator).posAdj} OWN race. "PUSH! PUSH! PUSH!"`,
  ],
  'heckle': [
    (e) => `"NICE TRIP, ${e.target.toUpperCase()}!" ${e.spectator} cackles from the gallery. ${_isVillainArch(e.specArch) ? `The ${_archLabel(e.specArch)} lives for this.` : `Even ${e.spectator} has a petty side.`}`,
    (e) => `${e.spectator} slow-claps as ${e.target} struggles. "Wow. Inspiring performance." The sarcasm drips like lava. ${e.bondWithTarget < -3 ? 'Old grudges die hard.' : ''}`,
    (e) => `"Maybe try HARDER?" ${e.spectator} yells at ${e.target}, earning a sharp look. The ${_archLabel(e.specArch)} doesn't care — ${pr(e.spectator).sub} wanted ${e.target} to lose all season.`,
    (e) => `${e.spectator} leans over to the gallery: "I give ${e.target} about thirty more seconds before ${pr(e.target).sub} eats it." ${_isVillainArch(e.specArch) ? 'The prediction is savored.' : 'The frustration is genuine.'}`,
    (e) => `"That ALL you got?" ${e.spectator} hollers. ${e.target} pretends not to hear, but ${pr(e.target).posAdj} jaw tightens. ${e.isSupporter ? 'Tough love from an ally.' : 'Pure antagonism.'}`,
  ],
  'panic': [
    (e) => `"NO NO NO!" ${e.spectator}'s face is pure anguish watching ${e.target} fall behind. "PLEASE! DON'T GIVE UP!" ${e.isSupporter ? `${pr(e.spectator).Sub}'s invested EVERYTHING in this.` : ''}`,
    (e) => `${e.spectator} buries ${pr(e.spectator).posAdj} face in ${pr(e.spectator).posAdj} hands as ${e.target} stumbles. Then peeks. Then SCREAMS: "YOU CAN STILL DO THIS!" ${_isNiceArch(e.specArch) ? 'The emotion is real.' : 'Even schemers panic when their horse falters.'}`,
    (e) => `${e.spectator} grabs the nearest gallery member's arm. "Tell me ${e.target}'s okay. I can't LOOK." The ${_archLabel(e.specArch)} is falling apart.`,
    (e) => `"GET UP! GET UP GET UP GET UP!" ${e.spectator} is practically hyperventilating as ${e.target} struggles. ${e.bondWithTarget > 5 ? `They've been through too much together for it to end like this.` : `The gallery's emotional investment is off the charts.`}`,
  ],
  'argue': [
    (e) => e.argueWith
      ? `"${e.target} DESERVES this!" ${e.spectator} snaps at ${e.argueWith}. "More than YOUR person ever did!" The ${_archLabel(e.specArch)} and the ${_archLabel(e.argueWithArch)} are nose-to-nose. Gallery drama.`
      : `${e.spectator} is getting heated in the gallery, arguing with anyone who'll listen about why ${e.target} should win.`,
    (e) => e.argueWith
      ? `${e.spectator} and ${e.argueWith} are in a full-blown shouting match on the bench. "You SABOTAGED ${e.specSupports}!" "Oh PLEASE, ${e.argueWithSupports} did it to ${pr(e.argueWithSupports).ref}!" The finalists can hear every word.`
      : `The gallery erupts. ${e.spectator} is on ${pr(e.spectator).posAdj} feet, pointing fingers, relitigating grudges from three episodes ago.`,
    (e) => e.argueWith
      ? `"Sit DOWN, ${e.argueWith}!" ${e.spectator} hisses. "Some of us are actually LOYAL to our people." ${e.argueWith} fires back: "Loyalty? From a ${_archLabel(e.specArch)}? That's RICH." ${host()} watches the gallery like it's better TV than the challenge.`
      : `${e.spectator} can't keep it together. The ${_archLabel(e.specArch)} is heckling, debating, and generally making the gallery section as dramatic as the race itself.`,
    (e) => e.argueWith
      ? `What started as cheering has become a proxy war — ${e.spectator} backing ${e.specSupports}, ${e.argueWith} backing ${e.argueWithSupports}. The gallery sounds like tribal council.`
      : `${e.spectator} turns to the camera: "These people are DELUSIONAL if they think ${e.target} isn't the best player left." The ${_archLabel(e.specArch)} has opinions.`,
  ],
  'gallery-coach': [
    (e) => `"Slowly! SLOWLY!" ${e.spectator} coaches ${e.target} from the sideline. "Don't rush it — let the animal come to YOU!" ${_isNiceArch(e.specArch) ? 'Genuine mentorship.' : 'Strategic concern.'}`,
    (e) => `${e.spectator} cups ${pr(e.spectator).posAdj} hands: "${e.target}! From the LEFT side! It's calmer from the LEFT!" Whether it's true or not, ${e.target} listens.`,
    (e) => `"Remember what I told you at camp!" ${e.spectator} calls out to ${e.target}. The ${_archLabel(e.specArch)} has been coaching from the gallery all day. ${e.isSupporter ? 'This alliance runs deeper than the game.' : ''}`,
    (e) => `${e.spectator} is basically a sideline coach at this point, calling out timing advice to ${e.target}: "WAIT for it... NOW!" ${_isVillainArch(e.specArch) ? 'Even villains want their people to win.' : 'The bond is obvious.'}`,
  ],
  'showmance-moment': [
    (players) => players.length >= 2
      ? `A stolen glance between ${players[0]} and ${players[1]} mid-race — even now, even HERE, the connection is undeniable.`
      : `${players[0]} touches the bracelet ${pr(players[0]).posAdj} partner made. A deep breath. Then: back to racing.`,
    (players) => players.length >= 2
      ? `${players[0]} catches ${players[1]}'s eye across the rapids. A tiny nod. "After this," ${players[0]} mouths. Romance on a volcano.`
      : `${players[0]} races harder, thinking about who's watching from the sideline. Some things matter more than a million dollars. Most things don't.`,
  ],
  'rivalry-taunt': [
    (e) => `${e.playerA || e.spectator} and ${e.playerB || e.target} lock eyes on the slope. "See you at the bottom," ${e.playerA || e.spectator} spits. ${e.playerB || e.target}'s jaw tightens.`,
    (e) => `Even mid-race, the bad blood between ${e.playerA || e.spectator} and ${e.playerB || e.target} boils over — shoulder bumps, glares, whispered threats between breaths.`,
    (e) => `"You can't beat me at ANYTHING," ${e.playerA || e.spectator} hisses at ${e.playerB || e.target} as they run neck-and-neck. ${e.playerB || e.target}'s response is to accelerate.`,
  ],
};

function _galleryCard(evt) {
  if (!evt || !evt.spectator) return '';
  const type = evt.type;
  const pool = FIC_SOCIAL[type];
  if (!pool) return '';

  let text = '';
  if (type === 'showmance-moment') {
    text = pick(pool)(evt.players || [evt.spectator, evt.target]);
  } else if (type === 'rivalry-taunt') {
    text = pick(pool)(evt);
  } else {
    text = pick(pool)(evt);
  }

  const badgeMap = {
    'cheer': { badge: 'hp-b-climb', label: 'CHEERING', bg: 'rgba(26,167,167,.06)' },
    'cheer-leader': { badge: 'hp-b-climb', label: 'RALLYING', bg: 'rgba(26,167,167,.08)' },
    'heckle': { badge: 'hp-b-joust', label: 'HECKLING', bg: 'rgba(196,24,47,.06)' },
    'panic': { badge: 'hp-b-ko', label: 'PANIC', bg: 'rgba(255,90,31,.06)' },
    'argue': { badge: 'hp-b-twist', label: 'ARGUMENT', bg: 'rgba(196,24,47,.08)' },
    'gallery-coach': { badge: 'hp-b-end', label: 'COACHING', bg: 'rgba(255,181,71,.06)' },
    'showmance-moment': { badge: 'hp-b-twist', label: '♥ HEART', bg: 'rgba(255,59,107,.06)' },
    'rivalry-taunt': { badge: 'hp-b-joust', label: 'BAD BLOOD', bg: 'rgba(196,24,47,.08)' },
  };
  const cfg = badgeMap[type] || { badge: 'hp-b-end', label: 'GALLERY', bg: 'rgba(255,181,71,.05)' };

  const avatars = type === 'argue' && evt.argueWith
    ? `${_avatarBadge(evt.spectator, 'sm')} ${_avatarBadge(evt.argueWith, 'sm')}`
    : type === 'showmance-moment' && evt.players?.length >= 2
      ? evt.players.map(p => _avatarBadge(p, 'sm')).join(' ')
      : _avatarBadge(evt.spectator, 'sm');

  const archTag = evt.specArch ? `<span style="font-size:9px;opacity:.45;text-transform:uppercase;letter-spacing:1px;margin-left:6px">${_archLabel(evt.specArch)}</span>` : '';

  return `<div class="hp-card" data-fac="dark" style="border-style:dashed;background:${cfg.bg}">
    <div class="hp-card-hdr">${avatars}<span class="hp-card-title">Peanut Gallery${archTag}</span><span class="hp-badge ${cfg.badge}">${cfg.label}</span></div>
    <div class="hp-card-body">${text}</div>
  </div>`;
}

export function rpBuildHPChallenge(ep) {
  const fic = ep.hpFIC;
  if (!fic) return _hpShell('<p>No challenge data.</p>', ep, 'title');

  const finalists = ep.finaleFinalists || [];
  const placements = fic.placements || [];
  const winner = placements[0]?.player;
  const steps = [];
  const sidebarMeta = [];

  // ── STEP 0: CHALLENGE INTRO ──
  const introText = pick([
    `"Before the main event," ${host()} announces, surveying the three finalists, "you need to EARN your spot. Sprint up the volcano. Grab a lei. Surf back down. Crown your spirit animal. First one done? Immunity. The other two?" ${host()} grins. "They joust."`,
    `${host()} holds up a volcanic flower lei. "Hawaiian Style, people. Three phases. One winner. And a LOT of angry wildlife." ${pr(host()).Sub} ${pr(host()).sub === 'they' ? 'crack' : 'cracks'} ${pr(host()).posAdj || 'his'} knuckles. "Go."`,
    `"This isn't a nice little challenge." ${host()} paces in front of the three finalists. "You're sprinting up an ACTIVE VOLCANO, surfing VOLCANIC RAPIDS, and wrestling a SPIRIT ANIMAL. The survivor gets the necklace. Everyone else gets the joust."`,
  ]);

  steps.push(`<div class="hp-section-head">
    <div class="hp-section-num">FIC</div>
    <div class="hp-section-title">Hawaiian Style</div>
    <div class="hp-section-meta">Final Immunity Challenge · ${finalists.length} compete · 1 wins immunity</div>
  </div>
  <div class="hp-host-line">${introText} — ${host()}</div>
  <div class="hp-flavor">${pick(TIKI_FLAVOR)}</div>`);

  sidebarMeta.push({ stepIdx: 0, html: `<div class="hp-side-label">HAWAIIAN STYLE</div>` });

  // ── STEP 1: SPIRIT ANIMAL DRAFT ──
  const draftCards = (fic.animalDraft || []).map(d => {
    const animal = d.animal;
    const pickTextPool = ANIMAL_PICK_TEXT[animal] || [(p) => `${p} picks the ${animal}. An unusual choice.`];
    return `<div style="display:flex;align-items:flex-start;gap:12px;padding:12px 14px;background:rgba(0,0,0,.35);border-radius:10px;border:1px solid rgba(255,181,71,.15)">
      ${_avatarBadge(d.player, 'sm')}
      <div style="flex:1">
        <div style="font-weight:700;color:var(--hp-bone);font-size:14px;margin-bottom:2px">${d.player} <span style="font-size:10px;opacity:.5;text-transform:uppercase;letter-spacing:1px">${d.archetype.replace(/-/g,' ')}</span></div>
        <div style="font-size:12px;color:rgba(243,231,201,.7);line-height:1.5;margin-bottom:4px;font-style:italic">${pick(pickTextPool)(d.player)}</div>
        <div style="display:flex;align-items:center;gap:6px;margin-top:4px">
          <span style="font-size:20px">${ANIMAL_EMOJI[animal] || '🐾'}</span>
          <span style="font-size:10px;color:var(--hp-gold);text-transform:uppercase;letter-spacing:1px;font-weight:800">${animal}</span>
          <span style="font-size:9px;color:rgba(243,231,201,.4);margin-left:4px">${ANIMAL_DESC[animal] || ''}</span>
        </div>
      </div>
    </div>`;
  }).join('');

  steps.push(`<div class="hp-card" data-fac="wild">
    <div class="hp-card-hdr"><span class="hp-card-title">Spirit Animal Draft</span><span class="hp-badge hp-b-end">CHOOSE YOUR CHAMPION</span></div>
    <div class="hp-card-body" style="display:flex;flex-direction:column;gap:10px">${draftCards}</div>
  </div>`);

  // Host transition after draft
  steps.push(`<div class="hp-host-line">${pick(FIC_HOST_TRANSITIONS.afterDraft)()}</div>`);

  sidebarMeta.push({ stepIdx: steps.length - 1, html: finalists.map(f => {
    const animal = fic.spiritAnimals[f] || '?';
    return `<div class="hp-side-row">${_avatarBadge(f, 'sm')}<span class="hp-side-name">${f}</span><span class="hp-side-stat">${ANIMAL_EMOJI[animal] || ''} ${animal.toUpperCase()}</span></div>`;
  }).join('') });

  // Gallery event helper: render all social events for a phase+beat
  const socialEvents = fic.socialEvents || [];
  function _renderGalleryBeat(phase, beat) {
    const evts = socialEvents.filter(e => e.phase === phase && e.beat === beat);
    for (const evt of evts) {
      const card = _galleryCard(evt);
      if (card) steps.push(card);
    }
  }

  // ── PHASE 1: VOLCANO SPRINT ──
  const p1 = fic.phases[0];
  if (p1) {
    steps.push(`<div class="hp-section-head">
      <div class="hp-section-num">P1</div>
      <div class="hp-section-title">${p1.name}</div>
      <div class="hp-section-meta">Sprint up the volcanic slope · Grab a lei at the summit · First to the top leads</div>
    </div>`);

    // Beat 1: Launch
    if (p1.beats?.[0]) {
      for (const ev of p1.beats[0].events) {
        const pool = ev.fastStart ? FIC_LAUNCH.fast : FIC_LAUNCH.normal;
        steps.push(`<div class="hp-card" data-fac="${faction(ev.player)}">
          <div class="hp-card-hdr">${_avatarBadge(ev.player, 'sm')}<span class="hp-card-title">${ev.player}</span><span class="hp-badge ${ev.fastStart ? 'hp-b-climb' : 'hp-b-end'}">${ev.fastStart ? 'FAST START' : 'STEADY'}</span></div>
          <div class="hp-card-body">${pick(pool)(ev.player)}</div>
        </div>`);
      }
    }
    _renderGalleryBeat(1, 1);

    // Beat 2: Midhill
    if (p1.beats?.[1]) {
      for (const ev of p1.beats[1].events) {
        const pool = ev.stumble ? FIC_MIDHILL.stumble : FIC_MIDHILL.clean;
        steps.push(`<div class="hp-card" data-fac="${faction(ev.player)}">
          <div class="hp-card-hdr">${_avatarBadge(ev.player, 'sm')}<span class="hp-card-title">${ev.player}</span><span class="hp-badge ${ev.stumble ? 'hp-b-ko' : 'hp-b-climb'}">${ev.stumble ? 'STUMBLE!' : 'CLEAN'}</span></div>
          <div class="hp-card-body">${pick(pool)(ev.player)}</div>
        </div>`);
      }
    }
    _renderGalleryBeat(1, 2);

    // Beat 3: Summit grab
    if (p1.beats?.[2]) {
      const summitSorted = [...p1.beats[2].events].sort((a, b) => b.score - a.score);
      summitSorted.forEach((ev, i) => {
        const isFirst = i === 0;
        steps.push(`<div class="hp-card" data-fac="${faction(ev.player)}" ${isFirst ? 'style="border-color:var(--hp-gold);box-shadow:0 0 12px rgba(255,181,71,.2)"' : ''}>
          <div class="hp-card-hdr">${_avatarBadge(ev.player, 'sm')}<span class="hp-card-title">${isFirst ? 'FIRST TO THE LEI!' : ev.player + ' arrives'}</span><span class="hp-badge ${isFirst ? 'hp-b-win' : 'hp-b-end'}">${isFirst ? 'SUMMIT' : 'ARRIVES'}</span></div>
          <div class="hp-card-body">${pick(FIC_SUMMIT_GRAB)(ev.player, isFirst)}</div>
        </div>`);
      });
    }
    _renderGalleryBeat(1, 3);

    // Confessional from leader
    const leaderConf = (fic.confessionals || []).find(c => c.phase === 1 && c.type === 'leader');
    if (leaderConf) {
      steps.push(`<div class="hp-card" data-fac="${faction(leaderConf.player)}" style="border-left:3px solid var(--hp-gold)">
        <div class="hp-card-hdr"><div class="hp-confess-av">${_avatarBadge(leaderConf.player, 'sm')}</div><span class="hp-card-title">${leaderConf.player}</span><span class="hp-badge hp-b-end">CONFESSIONAL</span></div>
        <div class="hp-card-body" style="font-style:italic">${pick(FIC_CONFESSIONALS.leader)(leaderConf.player)}</div>
      </div>`);
    }

    // Lei steal event
    const stealEvt = (fic.events || []).find(e => e.type === 'lei-steal');
    if (stealEvt) {
      steps.push(`<div class="hp-card" data-fac="villain" style="border-color:var(--hp-magma);box-shadow:0 0 16px rgba(196,24,47,.3)">
        <div class="hp-card-hdr">${_avatarBadge(stealEvt.attacker, 'sm')}<span class="hp-card-title">LEI STEAL!</span><span class="hp-badge ${stealEvt.success ? 'hp-b-twist' : 'hp-b-ko'}">${stealEvt.success ? 'SNATCHED!' : 'BLOCKED!'}</span></div>
        <div class="hp-card-body">${pick(FIC_STEAL)(stealEvt.attacker, stealEvt.victim, stealEvt.success, stealEvt.attackerArch || '')}</div>
      </div>`);

      // Victim confessional
      const stealConf = (fic.confessionals || []).find(c => c.phase === 1 && (c.type === 'steal-victim' || c.type === 'steal-blocked'));
      if (stealConf) {
        steps.push(`<div class="hp-card" data-fac="${faction(stealConf.player)}" style="border-left:3px solid var(--hp-bruise)">
          <div class="hp-card-hdr"><div class="hp-confess-av">${_avatarBadge(stealConf.player, 'sm')}</div><span class="hp-card-title">${stealConf.player}</span><span class="hp-badge hp-b-end">CONFESSIONAL</span></div>
          <div class="hp-card-body" style="font-style:italic">${pick(FIC_CONFESSIONALS[stealConf.type] || FIC_CONFESSIONALS.leader)(stealConf.player)}</div>
        </div>`);
      }
    }

    // Host transition
    steps.push(`<div class="hp-host-line">${pick(FIC_HOST_TRANSITIONS.afterSprint)(p1.winner)}</div>`);

    sidebarMeta.push({ stepIdx: steps.length - 1, html: `<div class="hp-side-row">${_avatarBadge(p1.winner, 'sm')}<span class="hp-side-name">Sprint</span><span class="hp-side-tag" style="background:rgba(26,167,167,.12);color:#3ad9d9;border:1px solid rgba(26,167,167,.3);">1ST</span></div>` });
  }

  // ── PHASE 2: SURF DESCENT ──
  const p2 = fic.phases[1];
  if (p2) {
    steps.push(`<div class="hp-section-head">
      <div class="hp-section-num">P2</div>
      <div class="hp-section-title">${p2.name}</div>
      <div class="hp-section-meta">Surf the volcanic rapids back to the beach · Wipeouts cost dearly</div>
    </div>
    <div class="hp-flavor">${pick(TIKI_FLAVOR)}</div>`);

    // Beat 1: Board launch
    if (p2.beats?.[0]) {
      for (const ev of p2.beats[0].events) {
        steps.push(`<div class="hp-card" data-fac="${faction(ev.player)}">
          <div class="hp-card-hdr">${_avatarBadge(ev.player, 'sm')}<span class="hp-card-title">${ev.player} drops in</span><span class="hp-badge hp-b-climb">LAUNCH</span></div>
          <div class="hp-card-body">${pick(FIC_BOARD_LAUNCH)(ev.player)}</div>
        </div>`);
      }
    }
    _renderGalleryBeat(2, 1);

    // Beat 2: Rapids
    if (p2.beats?.[1]) {
      for (const ev of p2.beats[1].events) {
        const pool = ev.wipeout ? FIC_RAPIDS.wipeout : FIC_RAPIDS.clean;
        steps.push(`<div class="hp-card" data-fac="${faction(ev.player)}" ${ev.wipeout ? 'style="border-color:var(--hp-magma)"' : ''}>
          <div class="hp-card-hdr">${_avatarBadge(ev.player, 'sm')}<span class="hp-card-title">${ev.player}</span><span class="hp-badge ${ev.wipeout ? 'hp-b-ko' : 'hp-b-climb'}">${ev.wipeout ? 'WIPEOUT!' : 'CLEAN RIDE'}</span></div>
          <div class="hp-card-body">${pick(pool)(ev.player)}</div>
        </div>`);
      }
    }

    _renderGalleryBeat(2, 2);

    // Beat 3: Beach landing
    if (p2.beats?.[2]) {
      const landingSorted = [...p2.beats[2].events].sort((a, b) => b.score - a.score);
      landingSorted.forEach((ev, i) => {
        const pool = i === 0 ? FIC_BEACH_LANDING.first : FIC_BEACH_LANDING.later;
        steps.push(`<div class="hp-card" data-fac="${faction(ev.player)}" ${i === 0 ? 'style="border-color:var(--hp-teal)"' : ''}>
          <div class="hp-card-hdr">${_avatarBadge(ev.player, 'sm')}<span class="hp-card-title">${i === 0 ? 'FIRST TO SHORE!' : ev.player + ' reaches the beach'}</span><span class="hp-badge ${i === 0 ? 'hp-b-climb' : 'hp-b-end'}">${i === 0 ? 'BEACH' : 'ARRIVES'}</span></div>
          <div class="hp-card-body">${pick(pool)(ev.player)}</div>
        </div>`);
      });
    }
    _renderGalleryBeat(2, 3);

    // Confessional from trailing player
    const trailConf = (fic.confessionals || []).find(c => c.phase === 2 && c.type === 'trailing');
    if (trailConf) {
      steps.push(`<div class="hp-card" data-fac="${faction(trailConf.player)}" style="border-left:3px solid var(--hp-magma)">
        <div class="hp-card-hdr"><div class="hp-confess-av">${_avatarBadge(trailConf.player, 'sm')}</div><span class="hp-card-title">${trailConf.player}</span><span class="hp-badge hp-b-end">CONFESSIONAL</span></div>
        <div class="hp-card-body" style="font-style:italic">${pick(FIC_CONFESSIONALS.trailing)(trailConf.player)}</div>
      </div>`);
    }

    // Host transition
    steps.push(`<div class="hp-host-line">${pick(FIC_HOST_TRANSITIONS.afterSurf)()}</div>`);

    sidebarMeta.push({ stepIdx: steps.length - 1, html: `<div class="hp-side-row">${_avatarBadge(p2.winner, 'sm')}<span class="hp-side-name">Surf</span><span class="hp-side-tag" style="background:rgba(255,90,31,.15);color:var(--hp-lava-hot);border:1px solid rgba(255,90,31,.35);">1ST</span></div>` });
  }

  // ── PHASE 3: SPIRIT ANIMAL LEI ──
  const p3 = fic.phases[2];
  if (p3) {
    steps.push(`<div class="hp-section-head">
      <div class="hp-section-num">P3</div>
      <div class="hp-section-title">${p3.name}</div>
      <div class="hp-section-meta">Crown your spirit animal with the lei to finish · Patience vs speed</div>
    </div>`);

    _renderGalleryBeat(3, 0);

    // Beat 1: Approach
    if (p3.beats?.[0]) {
      for (const ev of p3.beats[0].events) {
        const animal = ev.animal || fic.spiritAnimals[ev.player] || 'turtle';
        const pool = ev.animalAttack ? FIC_APPROACH.attacked : FIC_APPROACH.clean;
        steps.push(`<div class="hp-card" data-fac="${faction(ev.player)}" ${ev.animalAttack ? 'style="border-color:var(--hp-magma)"' : ''}>
          <div class="hp-card-hdr">${_avatarBadge(ev.player, 'sm')}<span class="hp-card-title">${ev.player} approaches the ${animal} ${ANIMAL_EMOJI[animal] || ''}</span><span class="hp-badge ${ev.animalAttack ? 'hp-b-ko' : 'hp-b-climb'}">${ev.animalAttack ? 'ATTACKED!' : 'CAREFUL'}</span></div>
          <div class="hp-card-body">${pick(pool)(ev.player, animal)}</div>
        </div>`);
      }
    }
    _renderGalleryBeat(3, 1);

    // Beat 2: Lei placement
    if (p3.beats?.[1]) {
      const placementSorted = [...p3.beats[1].events].sort((a, b) => b.score - a.score);
      placementSorted.forEach((ev, i) => {
        const animal = ev.animal || fic.spiritAnimals[ev.player] || 'turtle';
        const isFirst = i === 0;
        const pool = isFirst ? FIC_LEI_PLACE.crowned : (ev.crowned ? FIC_LEI_PLACE.crowned : FIC_LEI_PLACE.struggled);
        steps.push(`<div class="hp-card" data-fac="${faction(ev.player)}" ${isFirst ? 'style="border-color:var(--hp-gold);box-shadow:0 0 16px rgba(255,181,71,.25)"' : ''}>
          <div class="hp-card-hdr">${_avatarBadge(ev.player, 'sm')}<span class="hp-card-title">${isFirst ? 'FIRST LEI PLACED!' : ev.player + ' crowns the ' + animal}</span><span class="hp-badge ${isFirst ? 'hp-b-win' : 'hp-b-end'}">${ANIMAL_EMOJI[animal] || '🐾'} ${isFirst ? 'CROWNED' : 'DONE'}</span></div>
          <div class="hp-card-body">${pick(pool)(ev.player, animal)}</div>
        </div>`);
      });
    }

    // Confessional from lei winner
    const leiConf = (fic.confessionals || []).find(c => c.phase === 3 && c.type === 'lei-winner');
    if (leiConf) {
      steps.push(`<div class="hp-card" data-fac="${faction(leiConf.player)}" style="border-left:3px solid var(--hp-gold)">
        <div class="hp-card-hdr"><div class="hp-confess-av">${_avatarBadge(leiConf.player, 'sm')}</div><span class="hp-card-title">${leiConf.player}</span><span class="hp-badge hp-b-end">CONFESSIONAL</span></div>
        <div class="hp-card-body" style="font-style:italic">${pick(FIC_CONFESSIONALS['lei-winner'])(leiConf.player)}</div>
      </div>`);
    }

    sidebarMeta.push({ stepIdx: steps.length - 1, html: `<div class="hp-side-row">${_avatarBadge(p3.winner, 'sm')}<span class="hp-side-name">Lei</span><span class="hp-side-tag" style="background:rgba(255,181,71,.12);color:var(--hp-gold-hot);border:1px solid rgba(255,181,71,.3);">1ST</span></div>` });
  }

  // ── FINAL RESULTS ──
  steps.push(`<div class="hp-section-head">
    <div class="hp-section-num">★</div>
    <div class="hp-section-title">Results</div>
    <div class="hp-section-meta">${winner} wins Final Immunity</div>
  </div>`);

  placements.forEach((p, i) => {
    const isWinner = i === 0;
    const phaseWins = (fic.phases || []).filter(ph => ph.winner === p.player).length;
    const phaseText = phaseWins > 0 ? ` · Won ${phaseWins} of 3 phases` : '';
    const resultText = isWinner
      ? pick([
        `${p.player} crosses the finish FIRST! ${host()} lifts the immunity necklace and drapes it around ${pr(p.player).posAdj} neck. "You're safe tonight."${phaseText}`,
        `IT'S ${p.player.toUpperCase()}! The lei is on, the necklace is earned, and the volcano ROARS its approval!${phaseText}`,
        `${host()} doesn't even need to announce it — the crowd does it for ${pr(host()).obj}. "${p.player.toUpperCase()}! ${p.player.toUpperCase()}!" The immunity necklace finds its owner.${phaseText}`,
      ])
      : pick([
        `${p.player} finishes ${i === 1 ? 'second' : 'third'}${phaseText}. Close — but close doesn't win immunity. The joust awaits.`,
        `${p.player} hits the mat in ${i === 1 ? 'second' : 'last'} place${phaseText}. ${pr(p.player).Sub} ${pr(p.player).sub === 'they' ? 'know' : 'knows'} what that means. The platform. The staffs. The sharks below.`,
        `No immunity for ${p.player}${phaseText}. ${pr(p.player).Sub} ${pr(p.player).sub === 'they' ? 'stare' : 'stares'} at the joust platform and takes a slow, deep breath.`,
      ]);

    steps.push(`<div class="hp-card" data-fac="${isWinner ? 'host' : faction(p.player)}" style="${isWinner ? 'border-color:var(--hp-gold);box-shadow:0 0 24px rgba(255,181,71,.35)' : ''}">
      <div class="hp-card-hdr">${_avatarBadge(p.player, isWinner ? 'lg' : 'sm')}<span class="hp-card-title">${isWinner ? '★ ' + p.player + ' ★' : p.player}</span><span class="hp-badge ${isWinner ? 'hp-b-win' : 'hp-b-end'}">${isWinner ? 'IMMUNITY' : '#' + (i + 1)}</span></div>
      <div class="hp-card-body">${resultText}</div>
    </div>`);
  });

  // Winner confessional
  const winConf = (fic.confessionals || []).find(c => c.phase === 4 && c.type === 'immunity-winner');
  if (winConf) {
    steps.push(`<div class="hp-card" data-fac="${faction(winConf.player)}" style="border-left:3px solid var(--hp-gold)">
      <div class="hp-card-hdr"><div class="hp-confess-av">${_avatarBadge(winConf.player, 'sm')}</div><span class="hp-card-title">${winConf.player}</span><span class="hp-badge hp-b-win">CONFESSIONAL</span></div>
      <div class="hp-card-body" style="font-style:italic">${pick(FIC_CONFESSIONALS['immunity-winner'])(winConf.player)}</div>
    </div>`);
  }

  sidebarMeta.push({ stepIdx: steps.length - 1, html: `<div class="hp-side-label" style="color:var(--hp-gold)">WINNER</div><div class="hp-side-row">${_avatarBadge(winner, 'sm')}<span class="hp-side-name">${winner}</span><span class="hp-side-tag" style="background:linear-gradient(90deg,var(--hp-gold),var(--hp-gold-hot));color:#3a1a04;border:1px solid var(--hp-gold);font-weight:900">IMMUNE</span></div>` });

  // ── SIDEBAR: REPLACE-MODE (map + leaderboard + intel) ──
  const phaseNames = ['Volcano Sprint', 'Surf Descent', 'Spirit Animal Lei'];
  const phaseStats = ['Physical · Endurance · Boldness', 'Physical · Boldness · Temperament', 'Mental · Boldness · Intuition'];
  const phaseIcons = ['🌋', '🌊', '🌺'];
  const zoneColors = ['var(--hp-lava-hot)', 'var(--hp-teal)', 'var(--hp-gold)'];

  // Precompute running scores after each phase
  const cumScores = [{}, {}, {}];
  const running = {};
  finalists.forEach(f => { running[f] = 0; });
  for (let pi = 0; pi < 3; pi++) {
    const ph = fic.phases?.[pi];
    if (ph) for (const r of (ph.results || [])) running[r.player] = (running[r.player] || 0) + r.score;
    for (const f of finalists) cumScores[pi][f] = running[f];
  }

  function _ficMap(currentPhase, keyMoment) {
    const zones = [
      { label: 'FINISH', icon: '🏁', idx: 4 },
      { label: 'LEI', icon: '🌺', idx: 3, phase: 3, color: 'var(--hp-gold)' },
      { label: 'SURF', icon: '🌊', idx: 2, phase: 2, color: 'var(--hp-teal)' },
      { label: 'SPRINT', icon: '🌋', idx: 1, phase: 1, color: 'var(--hp-lava-hot)' },
      { label: 'START', icon: '⛱️', idx: 0 },
    ];
    const playerZone = {};
    for (const f of finalists) playerZone[f] = Math.min(currentPhase, 4);

    let html = '';
    for (const z of zones) {
      const isActive = z.phase === currentPhase;
      const isDone = z.phase && z.phase < currentPhase;
      const isFinish = z.idx === 4 && currentPhase > 3;
      const dotCol = isActive ? (z.color || 'var(--hp-gold)') : isDone || isFinish ? 'var(--hp-teal)' : 'rgba(255,255,255,.12)';
      const labelCol = isActive ? (z.color || 'var(--hp-gold)') : isDone ? 'rgba(243,231,201,.5)' : 'rgba(243,231,201,.25)';
      const playersHere = finalists.filter(f => playerZone[f] === z.idx);
      const bg = isActive ? 'rgba(255,181,71,.04)' : 'transparent';

      html += `<div style="position:relative;padding:${playersHere.length ? '6' : '4'}px 8px ${playersHere.length ? '6' : '4'}px 22px;border-left:2px solid ${dotCol};margin-left:6px;background:${bg};border-radius:0 4px 4px 0">
        <div style="position:absolute;left:-5px;top:${playersHere.length ? '10' : '7'}px;width:8px;height:8px;border-radius:50%;background:${dotCol};${isActive ? `box-shadow:0 0 6px ${z.color || 'var(--hp-gold)'}` : ''}"></div>
        <div style="font-size:8px;font-weight:800;letter-spacing:1.5px;color:${labelCol}">${z.icon} ${z.label}${isActive ? ' ◂' : isDone ? ' ✓' : ''}</div>
        ${playersHere.length ? `<div style="display:flex;gap:3px;margin-top:3px">${playersHere.map(f => _avatarBadge(f, 'sm')).join('')}</div>` : ''}
      </div>`;
    }

    let intelHtml = '';
    if (currentPhase >= 1 && currentPhase <= 3) {
      const pi = currentPhase - 1;
      intelHtml = `<div style="margin-top:8px;padding:6px 8px;background:rgba(0,0,0,.25);border-radius:6px;border-left:2px solid ${zoneColors[pi]}">
        <div style="font-size:9px;font-weight:800;letter-spacing:1px;color:${zoneColors[pi]}">PHASE ${currentPhase}</div>
        <div style="font-size:10px;color:var(--hp-bone);margin-top:1px">${phaseNames[pi]}</div>
        <div style="font-size:8px;color:rgba(243,231,201,.4);margin-top:2px">${phaseStats[pi]}</div>
      </div>`;
    }
    if (keyMoment) {
      intelHtml += `<div style="margin-top:6px;padding:5px 8px;font-size:9px;color:var(--hp-bone);font-style:italic;background:rgba(0,0,0,.2);border-radius:4px;border-left:2px solid var(--hp-gold)">${keyMoment}</div>`;
    }
    return html + intelHtml;
  }

  function _ficBoard(pi) {
    if (pi < 0) return '';
    const scores = cumScores[pi] || {};
    const sorted = finalists.slice().sort((a, b) => (scores[b] || 0) - (scores[a] || 0));
    const maxS = Math.max(...sorted.map(f => scores[f] || 0), 0.1);
    const ph = fic.phases?.[pi];
    return `<div style="margin-top:10px;padding-top:8px;border-top:1px solid rgba(255,181,71,.08)">
      <div style="font-size:8px;font-weight:800;letter-spacing:2px;color:var(--hp-gold);margin-bottom:6px">STANDINGS</div>
      ${sorted.map((f, rank) => {
        const s = scores[f] || 0;
        const pct = Math.max(8, (s / maxS) * 100);
        const lead = rank === 0;
        const phRank = ph ? (ph.results || []).findIndex(r => r.player === f) + 1 : 0;
        const animal = fic.spiritAnimals?.[f] || '';
        return `<div style="margin-bottom:6px">
          <div style="display:flex;align-items:center;gap:5px">
            ${_avatarBadge(f, 'sm')}
            <div style="flex:1;min-width:0">
              <div style="display:flex;align-items:center;gap:4px">
                <span style="font-size:10px;font-weight:700;color:${lead ? 'var(--hp-gold)' : 'var(--hp-bone)'}">${f}</span>
                ${animal ? `<span style="font-size:10px">${ANIMAL_EMOJI[animal] || ''}</span>` : ''}
              </div>
              <div style="font-size:8px;color:rgba(243,231,201,.35)">${phRank > 0 ? `#${phRank} this phase` : ''}</div>
            </div>
            <span style="font-size:10px;font-weight:800;color:${lead ? 'var(--hp-gold)' : 'rgba(243,231,201,.3)'}">#${rank + 1}</span>
          </div>
          <div style="height:3px;border-radius:2px;background:rgba(255,255,255,.05);overflow:hidden;margin-top:3px">
            <div style="height:100%;width:${pct}%;background:${lead ? 'var(--hp-gold)' : 'rgba(243,231,201,.2)'};border-radius:2px"></div>
          </div>
        </div>`;
      }).join('')}
    </div>`;
  }

  // Build replace-mode sidebar entries at key moments
  const sideMeta = [];
  sideMeta._replace = true;

  // Step 0: intro — just the map at start
  sideMeta.push({ stepIdx: 0, html: _ficMap(0, 'Awaiting the start...') });

  // After draft: animals shown on map
  sideMeta.push({ stepIdx: 2, html: _ficMap(0,
    finalists.map(f => `${ANIMAL_EMOJI[fic.spiritAnimals?.[f]] || '🐾'} ${f}: ${fic.spiritAnimals?.[f] || '?'}`).join(' · ')
  ) });

  // Phase stepIdx lookup from the original sidebarMeta
  const p1StepIdx = sidebarMeta.find(m => m.html?.includes('Sprint'))?.stepIdx ?? steps.length - 1;
  const p2StepIdx = sidebarMeta.find(m => m.html?.includes('Surf'))?.stepIdx ?? steps.length - 1;
  const p3StepIdx = sidebarMeta.find(m => m.html?.includes('Lei'))?.stepIdx ?? steps.length - 1;
  const winStepIdx = sidebarMeta[sidebarMeta.length - 1]?.stepIdx ?? steps.length - 1;

  // P1 start: map enters sprint zone
  const p1StartIdx = sidebarMeta.find(m => m.html?.includes('Sprint'))?.stepIdx;
  const p1HeadIdx = Math.max(0, (p1StartIdx || 4) - (finalists.length * 2 + 2));
  sideMeta.push({ stepIdx: p1HeadIdx, html: _ficMap(1, 'The sprint begins!') });

  // P1 end: first standings
  const p1Winner = fic.phases?.[0]?.winner;
  sideMeta.push({ stepIdx: p1StepIdx, html: _ficMap(1, p1Winner ? `${p1Winner} leads after the sprint!` : 'Sprint complete.') + _ficBoard(0) });

  // P2 start
  const p2HeadIdx = Math.max(0, (p2StepIdx || p1StepIdx + 3) - (finalists.length * 2 + 2));
  sideMeta.push({ stepIdx: p2HeadIdx, html: _ficMap(2, 'Into the rapids!') + _ficBoard(0) });

  // P2 end
  const p2Winner = fic.phases?.[1]?.winner;
  sideMeta.push({ stepIdx: p2StepIdx, html: _ficMap(2, p2Winner ? `${p2Winner} hits the beach first!` : 'Surf complete.') + _ficBoard(1) });

  // P3 start
  const p3HeadIdx = Math.max(0, (p3StepIdx || p2StepIdx + 3) - (finalists.length * 2 + 2));
  sideMeta.push({ stepIdx: p3HeadIdx, html: _ficMap(3, 'Crown the spirit animal!') + _ficBoard(1) });

  // P3 end
  const p3Winner = fic.phases?.[2]?.winner;
  sideMeta.push({ stepIdx: p3StepIdx, html: _ficMap(3, p3Winner ? `${p3Winner} places the lei first!` : 'Lei complete.') + _ficBoard(2) });

  // Final results: winner
  sideMeta.push({ stepIdx: winStepIdx, html: _ficMap(4,null) + `
    <div style="margin-top:10px;padding:8px;background:linear-gradient(135deg,rgba(255,181,71,.1),rgba(255,181,71,.02));border-radius:8px;border:1px solid rgba(255,181,71,.25);text-align:center">
      <div style="font-size:8px;font-weight:800;letter-spacing:2px;color:var(--hp-gold);margin-bottom:4px">★ IMMUNITY WINNER ★</div>
      <div style="display:flex;align-items:center;justify-content:center;gap:8px">${_avatarBadge(winner, 'md')}
        <span style="font-family:'Bungee Inline',cursive;font-size:16px;color:var(--hp-gold)">${winner}</span>
      </div>
    </div>
  ` + _ficBoard(2) });

  // Build reveal steps
  const totalSteps = steps.length;
  const suffix = 'fic';
  const stateKey = 'hp-fic';
  _ensureState(stateKey, totalSteps);
  const revIdx = _tvState[stateKey].idx;

  const stepsHtml = steps.map((s, i) => `<div class="hp-step ${i <= revIdx ? 'hp-visible' : ''}" id="hp-step-${suffix}-${i}">${s}</div>`).join('');

  if (!window._hpSidebarMap) window._hpSidebarMap = {};
  window._hpSidebarMap[stateKey] = sideMeta;

  // Initial sidebar: last visible entry in replace mode
  let sideInitHtml = '';
  for (const m of sideMeta) {
    const gate = typeof m.stepIdx === 'number' ? m.stepIdx : 0;
    if (gate <= revIdx && m.html) sideInitHtml = m.html;
  }

  return _hpShell(`
    <div style="display:grid;grid-template-columns:1fr 240px;gap:20px;align-items:start">
      <div>
        ${stepsHtml}
      </div>
      <aside class="hp-sidebar">
        <div class="hp-side-box">
          <div class="hp-side-title">Hawaiian Style</div>
          <div id="hp-sidebar-inner-fic">${sideInitHtml}</div>
        </div>
      </aside>
    </div>
    ${_controls(stateKey, totalSteps)}
  `, ep, 'fic');
}

// ══════════════════════════════════════════════════════════════
// SCREEN 2: TIEBREAKER INTRO
// ══════════════════════════════════════════════════════════════
export function rpBuildHPTiebreaker(ep) {
  const tb = ep.hpTiebreaker;
  if (!tb) {
    const finalists = ep.finaleFinalists || [];
    return _hpShell(`
      <div class="hp-section-head">
        <div class="hp-section-num">01</div>
        <div class="hp-section-title">Straight to the Volcano</div>
        <div class="hp-section-meta">No tiebreaker needed</div>
      </div>

      <div class="hp-outcome win">
        <div class="hp-outcome-tag">★ FINAL TWO ★</div>
        <div class="hp-outcome-title">STRAIGHT TO<br>THE VOLCANO</div>
        <div class="hp-outcome-sub">
          With only two finalists, the volcano race begins immediately.
          ${finalists.map(f => `<strong>${f}</strong>`).join(' and ')} prepare to face the mountain.
        </div>
      </div>

      <div class="hp-host-line">${pick([
        `"No tie. No joust. Just you two and the volcano." ${host()} fires the starting flare.`,
        `${host()} points at the smoking peak. "Build your dummy. Race it up. Throw it in. First one wins."`,
        `The drums begin. The torches blaze. This is where the season ends.`,
        `"No safety net. No second chances." ${host()} grins. "Go."`,
      ])}</div>

      <div class="hp-flavor">${pick(TIKI_FLAVOR)}</div>
    `, ep, 'tiebreaker');
  }

  const safe = tb.immunityWinner;
  const [d1, d2] = tb.duelists;
  const safeFac = faction(safe);
  const d1Fac = faction(d1);
  const d2Fac = faction(d2);

  const introText = pick([
    `${host()} holds up the immunity necklace. "${safe} — Hawaiian Style was yours. You're safe tonight."`,
    `"${safe} won the surf." ${host()} turns to ${d1} and ${d2}. "You two... didn't."`,
    `${safe} clutches the necklace — earned on the slopes and the waves. The other two? They have to fight for it.`,
    `"The lei is around the neck and immunity keeps ${safe} in the game." ${host()} gestures to the platform over the water. "The rest of you — follow me."`,
  ]);

  const arenaText = pick([
    `Two platforms. Shark-infested water below. Fire-lit staffs above. The joust begins at moonrise.`,
    `The platforms hover above black water. Tiki torches line the edges. Something moves beneath the surface.`,
    `${host()} leads them to the waterfront. Two wooden platforms connected by nothing but air and ambition.`,
    `The arena: two volcanic rock platforms separated by open water. The rules are simple. The stakes aren't.`,
  ]);

  const d1Confess = pick([
    `I've come too far to lose it all to a jousting match on a VOLCANO. This is insane. This is... kind of amazing.`,
    `${safe} gets to sit and watch? Must be nice. Meanwhile I'm about to get knocked into shark water.`,
    `One fight. That's all that stands between me and the finale. I can do this. I HAVE to do this.`,
    `The crowd's screaming. The torches are lit. And somehow I'm standing on a plank above sharks. Classic.`,
  ]);

  const d2Confess = pick([
    `${d1} thinks ${pr(d1).sub} can beat me? ${pr(d1).Sub} hasn't seen what I'm capable of when there's a million dollars at stake.`,
    `I looked at that platform and thought: I'm either walking off it a finalist, or swimming away from sharks.`,
    `${pr(d2).Sub} got this far by being underestimated. Nobody's underestimating ${pr(d2).obj} anymore.`,
    `This is it. The joust. Everything I've done all season comes down to this one moment.`,
  ]);

  return _hpShell(`
    <div class="hp-section-head">
      <div class="hp-section-num">01</div>
      <div class="hp-section-title">The Tiebreaker</div>
      <div class="hp-section-meta">Resolve the deadlock · 1 of 2 advances</div>
    </div>

    <div class="hp-host-line">"${safe} sails through to the Final Two. But behind ${pr(safe).obj} — a <strong>TIE</strong>. ${d1} and ${d2}, you'll fight for the second spot."</div>

    <div class="hp-card" data-fac="host">
      <div class="hp-card-hdr">
        ${_avatarBadge(safe, 'sm')}
        <span class="hp-card-title">Immunity Winner: ${safe}</span>
        <span class="hp-badge hp-b-win">SAFE</span>
      </div>
      <div class="hp-card-body">${introText}</div>
    </div>

    <!-- VERSUS MATCHUP -->
    <div class="hp-matchup">
      <div class="hp-fighter">
        ${_avatarBadge(d1, 'xl')}
        <div class="hp-fighter-name">${d1}</div>
        <div class="hp-fighter-tag" style="color:${d1Fac === 'hero' ? '#3ad9d9' : d1Fac === 'villain' ? '#ff8080' : 'var(--hp-gold-hot)'}">${arch(d1).replace(/-/g, ' ').toUpperCase()}</div>
      </div>
      <div class="hp-vs-big">VS</div>
      <div class="hp-fighter">
        ${_avatarBadge(d2, 'xl')}
        <div class="hp-fighter-name">${d2}</div>
        <div class="hp-fighter-tag" style="color:${d2Fac === 'hero' ? '#3ad9d9' : d2Fac === 'villain' ? '#ff8080' : 'var(--hp-gold-hot)'}">${arch(d2).replace(/-/g, ' ').toUpperCase()}</div>
      </div>
    </div>

    <div class="hp-card" data-fac="host">
      <div class="hp-card-hdr">
        ${_icon('shark')}
        <span class="hp-card-title">The Arena Awaits</span>
        <span class="hp-badge hp-b-joust">JOUST</span>
      </div>
      <div class="hp-card-body">${arenaText}</div>
    </div>

    <div class="hp-confess" data-fac="${d1Fac}">
      <div class="hp-confess-av">${_avatarBadge(d1)}</div>
      <div class="hp-confess-name">${d1} <span class="hp-confess-tag"${d1Fac === 'hero' ? ' style="background:rgba(26,167,167,.2);border-color:rgba(26,167,167,.4);color:#3ad9d9"' : ''}>CONFESSIONAL</span></div>
      <div class="hp-confess-text">${d1Confess}</div>
    </div>

    <div class="hp-confess" data-fac="${d2Fac}">
      <div class="hp-confess-av">${_avatarBadge(d2)}</div>
      <div class="hp-confess-name">${d2} <span class="hp-confess-tag"${d2Fac === 'hero' ? ' style="background:rgba(26,167,167,.2);border-color:rgba(26,167,167,.4);color:#3ad9d9"' : ''}>CONFESSIONAL</span></div>
      <div class="hp-confess-text">${d2Confess}</div>
    </div>

    <div class="hp-flavor">${pick(TIKI_FLAVOR)}</div>
  `, ep, 'tiebreaker');
}

// ══════════════════════════════════════════════════════════════
// SCREEN 3: JOUST (click-to-reveal)
// ══════════════════════════════════════════════════════════════
export function rpBuildHPJoust(ep) {
  const tb = ep.hpTiebreaker;
  if (!tb) {
    return _hpShell(`
      <div class="hp-section-head">
        <div class="hp-section-num">02</div>
        <div class="hp-section-title">Joust</div>
        <div class="hp-section-meta">Skipped</div>
      </div>
      <div class="hp-card" data-fac="host">
        <div class="hp-card-hdr"><span class="hp-card-title">No Tiebreaker</span></div>
        <div class="hp-card-body">No tiebreaker this finale — the final two proceed directly to the volcano race.</div>
      </div>
    `, ep, 'joust');
  }

  const [dA, dB] = tb.duelists;
  const dAFac = faction(dA);
  const dBFac = faction(dB);
  const exchanges = tb.exchanges || [];
  const socialEvts = tb.socialEvents || [];
  const stateKey = 'hp-joust';

  const steps = [];

  for (let i = 0; i < exchanges.length; i++) {
    const ex = exchanges[i];
    const roundWinner = ex.winner;
    const roundLoser = roundWinner === dA ? dB : dA;
    const scoreA = ex.scoreA || 0;
    const scoreB = ex.scoreB || 0;
    const totalA = exchanges.slice(0, i + 1).reduce((s, e) => s + (e.winner === dA ? 1 : 0), 0);
    const totalB = exchanges.slice(0, i + 1).reduce((s, e) => s + (e.winner === dB ? 1 : 0), 0);

    // Sudden death banner — own step
    const isSuddenDeath = tb.suddenDeath && i === exchanges.length - 1;
    if (isSuddenDeath) {
      steps.push(`<div class="hp-card hp-lava-glow" data-fac="host" style="text-align:center;margin-bottom:8px">
        <div style="font-family:'Bungee Inline',cursive;font-size:22px;color:var(--hp-magma);letter-spacing:3px;text-shadow:0 0 16px rgba(196,24,47,.5)">SUDDEN DEATH</div>
        <div class="hp-card-body">${pick(JOUST_SUDDEN)(dA, dB)}</div>
      </div>`);
    }

    // Rally cards — each its own step
    if (ex.rallyA) {
      steps.push(`<div class="hp-social-card" style="border-color:rgba(31,122,74,.3)">
        <div class="hp-social-header">
          ${_avatarBadge(dA, 'sm')}
          <span class="hp-social-label" style="color:var(--hp-leaf)">RALLY</span>
        </div>
        <div class="hp-card-body">${pick(JOUST_RALLY)(dA)}</div>
      </div>`);
    }
    if (ex.rallyB) {
      steps.push(`<div class="hp-social-card" style="border-color:rgba(31,122,74,.3)">
        <div class="hp-social-header">
          ${_avatarBadge(dB, 'sm')}
          <span class="hp-social-label" style="color:var(--hp-leaf)">RALLY</span>
        </div>
        <div class="hp-card-body">${pick(JOUST_RALLY)(dB)}</div>
      </div>`);
    }

    // Exchange result card — own step
    const totalScore = scoreA + scoreB || 1;
    const pctA = Math.min(95, Math.max(5, (scoreA / totalScore) * 100));
    const winnerFac = faction(roundWinner);
    steps.push(`<div class="hp-card" data-fac="${winnerFac}">
      <div class="hp-card-hdr">
        ${_avatarBadge(roundWinner, 'sm')}
        <span class="hp-card-title">Round ${ex.round} · ${roundWinner} wins</span>
        <span class="hp-badge hp-b-joust">${roundWinner === dA ? '+' + scoreA.toFixed(0) : '+' + scoreB.toFixed(0)} DMG</span>
      </div>
      <div class="hp-card-body">${pick(JOUST_HIT)(roundWinner, roundLoser)}</div>
      <div class="hp-exchange" style="margin-top:10px">
        <span style="font-size:10px;min-width:50px;text-align:right;${roundWinner === dA ? 'color:var(--hp-gold-hot)' : ''}">${dA} <span style="font-family:'Press Start 2P',monospace;font-size:8px">${scoreA.toFixed(1)}</span></span>
        <div class="hp-exchange-bar">
          <div class="hp-exchange-fill" style="width:${pctA}%;background:linear-gradient(90deg,${dAFac === 'hero' ? 'var(--hp-teal)' : 'var(--hp-magma)'},${dBFac === 'hero' ? 'var(--hp-teal)' : 'var(--hp-magma)'})"></div>
        </div>
        <span style="font-size:10px;min-width:50px;${roundWinner === dB ? 'color:var(--hp-gold-hot)' : ''}">${dB} <span style="font-family:'Press Start 2P',monospace;font-size:8px">${scoreB.toFixed(1)}</span></span>
      </div>
      <div style="display:flex;justify-content:space-between;margin-top:8px;font-size:10px;color:rgba(243,231,201,.5)">
        <div class="hp-tally">${Array.from({ length: 3 }, (_, t) => `<div class="hp-tally-mark ${t < totalA ? '' : 'dim'}"></div>`).join('')}<span style="margin-left:4px">${totalA}W</span></div>
        <div class="hp-tally">${Array.from({ length: 3 }, (_, t) => `<div class="hp-tally-mark ${t < totalB ? '' : 'dim'}"></div>`).join('')}<span style="margin-left:4px">${totalB}W</span></div>
      </div>
    </div>`);

    // Shark beat every other round — own step
    if (i % 2 === 1) {
      steps.push(`<div class="hp-card" data-fac="host" style="opacity:.75">
        <div class="hp-card-hdr">${_icon('shark')}<span class="hp-card-title">Beneath the Surface</span></div>
        <div class="hp-card-body">${pick(SHARK_BEAT)(roundLoser)}</div>
      </div>`);
    }

    // Social events for this round — each its own step
    const roundSocial = socialEvts.filter(se => se.round === ex.round);
    for (const se of roundSocial) {
      steps.push(_renderJoustSocial(se, dA, dB));
    }

    // Flavor between rounds — own step
    if (i < exchanges.length - 1 && i % 2 === 0) {
      steps.push(`<div class="hp-flavor">${pick(TIKI_FLAVOR)}</div>`);
    }
  }

  // Final resolution — each card is its own step
  const finalSocials = socialEvts.filter(se => se.type === 'sudden-death');
  for (const se of finalSocials) {
    steps.push(_renderJoustSocial(se, dA, dB));
  }

  const winner = tb.winner;
  const loser = tb.loser;
  const winFac = faction(winner);
  const loseFac = faction(loser);

  // Result banner + portraits together (the big reveal)
  steps.push(`<div class="hp-outcome ko">
    <div class="hp-outcome-tag">★ JOUST RESULT ★</div>
    <div class="hp-outcome-title">${loser.toUpperCase()} ELIMINATED</div>
    <div class="hp-outcome-sub">${winner} advances · ${tb.suddenDeath ? 'Decided in sudden death' : `Final score: ${tb.winsA}-${tb.winsB}`}</div>
  </div>
  <div style="display:flex;justify-content:center;gap:24px;margin:16px 0">
    <div style="text-align:center">
      ${_avatarBadge(winner, 'lg')}
      <div style="font-family:'Anton',sans-serif;font-size:14px;color:var(--hp-gold-hot);margin-top:6px;letter-spacing:2px">${winner}</div>
      <span class="hp-badge hp-b-win" style="margin:0">ADVANCES</span>
    </div>
    <div style="text-align:center;opacity:.5">
      ${_avatarBadge(loser, 'lg')}
      <div style="font-family:'Anton',sans-serif;font-size:14px;color:#ff8080;margin-top:6px;letter-spacing:2px">${loser}</div>
      <span class="hp-badge hp-b-ko" style="margin:0">ELIMINATED</span>
    </div>
  </div>`);

  // Post-joust confessional — own step
  steps.push(`<div class="hp-confess" data-fac="${loseFac}">
    <div class="hp-confess-av">${_avatarBadge(loser, 'sm')}</div>
    <div class="hp-confess-name">${loser} <span class="hp-confess-tag"${loseFac === 'hero' ? ' style="background:rgba(26,167,167,.2);border-color:rgba(26,167,167,.4);color:#3ad9d9"' : ''}>POST-JOUST</span></div>
    <div class="hp-confess-text">${pick([
      `${loser} stares at the torch one last time. "I gave it everything." ${pr(loser).Sub} extends a hand to ${winner}. "${pr(winner).Sub} earned it."`,
      `The platform tilts. ${loser} catches ${pr(loser).posAdj} balance, then lets go. It's over. "Not bad for a ${arch(loser).replace(/-/g, ' ')}."`,
      `${loser} nods slowly. No words needed. The walk away is quiet. The crowd respects it.`,
      `"I made it further than anyone expected," ${loser} says with a crooked smile. "That counts for something."`,
    ])}</div>
  </div>`);

  const totalSteps = steps.length;
  _ensureState(stateKey, totalSteps);
  const revIdx = _tvState[stateKey].idx;

  const stepsRendered = steps.map((html, i) =>
    `<div class="hp-step ${i <= revIdx ? 'hp-visible' : ''}" id="hp-step-joust-${i}">${html}</div>`
  ).join('');

  return _hpShell(`
    <div class="hp-section-head">
      <div class="hp-section-num">02</div>
      <div class="hp-section-title">Coconut-Bra Joust</div>
      <div class="hp-section-meta">Defeat your rival · Save the hostage</div>
    </div>

    <div class="hp-host-line">"Grass skirts. Coconut bras. Jousting sticks. Knock the other one in the drink. <em>Try not to die.</em>"</div>

    <!-- MATCHUP HEADER -->
    <div class="hp-matchup">
      <div class="hp-fighter">
        ${_avatarBadge(dA, 'xl')}
        <div class="hp-fighter-name">${dA}</div>
        <div class="hp-fighter-tag" style="color:${dAFac === 'hero' ? '#3ad9d9' : '#ff8080'}">${dAFac.toUpperCase()}</div>
      </div>
      <div class="hp-vs-big">VS</div>
      <div class="hp-fighter">
        ${_avatarBadge(dB, 'xl')}
        <div class="hp-fighter-name">${dB}</div>
        <div class="hp-fighter-tag" style="color:${dBFac === 'hero' ? '#3ad9d9' : '#ff8080'}">${dBFac.toUpperCase()}</div>
      </div>
    </div>

    ${stepsRendered}

    ${_controls(stateKey, totalSteps)}
  `, ep, 'joust');
}

// ══════════════════════════════════════════════════════════════
// JOUST SOCIAL EVENT RENDERER
// ══════════════════════════════════════════════════════════════
function _renderJoustSocial(se, dA, dB) {
  if (se.type === 'crowd-roar') {
    const isCheer = se.cheersFor != null;
    const target = se.cheersFor || se.heckles || dA;
    const narr = isCheer ? pick(CROWD_CHEER)(se.spectator, target) : pick(CROWD_HECKLE)(se.spectator, target);
    return `<div class="hp-social-card" style="border-color:${isCheer ? 'rgba(26,167,167,.3)' : 'rgba(196,24,47,.3)'}">
      <div class="hp-social-header">
        ${_avatarBadge(se.spectator, 'sm')}
        <span class="hp-social-label" style="color:${isCheer ? 'var(--hp-teal)' : 'var(--hp-magma)'}">${isCheer ? 'CHEER' : 'HECKLE'}</span>
      </div>
      <div class="hp-card-body">${narr}</div>
    </div>`;
  }
  if (se.type === 'rival-fire') {
    const [r1, r2] = se.players;
    return `<div class="hp-social-card" style="border-color:rgba(196,24,47,.3)">
      <div class="hp-social-header">
        ${_avatarBadge(r1, 'sm')} ${_avatarBadge(r2, 'sm')}
        <span class="hp-social-label" style="color:var(--hp-magma)">RIVALRY</span>
      </div>
      <div class="hp-card-body">${pick([
        `${r1} and ${r2} lock eyes across the arena. The hatred is palpable.`,
        `There's history between ${r1} and ${r2}. Everyone can feel it.`,
        `${r1} glares at ${r2}. ${r2} doesn't look away. The crowd goes silent.`,
        `The rivalry between ${r1} and ${r2} burns hotter than the torches.`,
      ])}</div>
    </div>`;
  }
  if (se.type === 'showmance-tension') {
    const [s1, s2] = se.players;
    return `<div class="hp-social-card" style="border-color:rgba(255,59,107,.3)">
      <div class="hp-social-header">
        ${_avatarBadge(s1, 'sm')} ${_avatarBadge(s2, 'sm')}
        <span class="hp-social-label" style="color:var(--hp-bruise)">SHOWMANCE</span>
      </div>
      <div class="hp-card-body">${pick([
        `${s1} and ${s2} share a look. The game made them enemies, but the heart says otherwise.`,
        `Even in combat, ${s1} hesitates when ${s2} stumbles. Old feelings die hard.`,
        `${s2} catches ${s1}'s eye. A smile. A headshake. This is complicated.`,
        `The showmance between ${s1} and ${s2} adds a layer of pain to every exchange.`,
      ])}</div>
    </div>`;
  }
  if (se.type === 'shark-sighting') {
    return `<div class="hp-card" data-fac="host" style="opacity:.8">
      <div class="hp-card-hdr">${_icon('shark')}<span class="hp-card-title">Shark Sighting</span></div>
      <div class="hp-card-body">${pick(SHARK_BEAT)(se.flincher)}</div>
    </div>`;
  }
  if (se.type === 'desperation-plea') {
    return `<div class="hp-social-card" style="border-color:rgba(255,181,71,.3)">
      <div class="hp-social-header">
        ${_avatarBadge(se.player, 'sm')}
        <span class="hp-social-label" style="color:${se.success ? 'var(--hp-gold)' : 'var(--hp-magma)'}">${se.success ? 'RALLIED' : 'IGNORED'}</span>
        <span class="hp-badge ${se.success ? 'hp-b-tie' : 'hp-b-ko'}" style="margin-left:auto">DESPERATION</span>
      </div>
      <div class="hp-card-body">${pick([
        se.success
          ? `${se.player} screams for help from the sideline. Someone responds. The energy shifts.`
          : `${se.player} begs the crowd for support. Silence. Nobody moves.`,
        se.success
          ? `${se.player}'s plea cuts through the noise. The bench rallies. New fire in ${pr(se.player).posAdj} eyes.`
          : `${se.player} reaches out to the crowd. They look away. ${pr(se.player).Sub}'s on ${pr(se.player).posAdj} own.`,
        se.success
          ? `"SOMEONE BELIEVE IN ME!" ${se.player} cries. A chant begins. It worked.`
          : `${se.player}'s voice cracks. "Please..." The silence is deafening.`,
        se.success
          ? `${se.player} channels the desperation into raw energy. The crowd feels it. They respond.`
          : `${se.player} looks around for an ally. Every face is stone. This is the endgame.`,
      ])}</div>
    </div>`;
  }
  if (se.type === 'imm-winner-reaction') {
    const calcText = se.calculating
      ? pick([
          `${se.player} watches with cold calculation. ${pr(se.player).Sub}'s already planning ${pr(se.player).posAdj} next move.`,
          `${se.player} studies both fighters like chess pieces. Which outcome serves ${pr(se.player).obj} better?`,
          `Behind ${se.player}'s calm exterior, the gears are turning. Who does ${pr(se.player).sub} WANT to face?`,
          `${se.player} takes mental notes on every weakness displayed. This information is currency.`,
        ])
      : pick([
          `${se.player} grips the immunity necklace. Even with safety, the tension is killing ${pr(se.player).obj}.`,
          `${se.player} paces the beach. Safe, but not calm. Not even close.`,
          `${se.player}'s hands shake despite the necklace around ${pr(se.player).posAdj} neck. The wait is brutal.`,
          `${se.player} watches in agonized silence. Immunity doesn't protect you from caring.`,
        ]);
    return `<div class="hp-social-card" style="border-color:rgba(255,181,71,.3)">
      <div class="hp-social-header">
        ${_avatarBadge(se.player, 'sm')}
        <span class="hp-social-label" style="color:var(--hp-gold)">IMMUNITY HOLDER</span>
        <span class="hp-badge hp-b-tie" style="margin-left:auto">${se.calculating ? 'CALCULATING' : 'ANXIOUS'}</span>
      </div>
      <div class="hp-card-body">${calcText}</div>
    </div>`;
  }
  if (se.type === 'sudden-death') {
    return `<div class="hp-card hp-lava-glow" data-fac="host" style="text-align:center">
      <div style="font-family:'Bungee Inline',cursive;font-size:18px;color:var(--hp-gold);letter-spacing:2px;margin-bottom:4px">SUDDEN DEATH RESULT</div>
      <div class="hp-card-body">${pick([
        `${se.winner} lands the final blow. ${se.loser} falls.`,
        `In the end, it was ${se.winner}'s moment. ${se.loser} had nothing left.`,
        `${se.winner} strikes true. The joust is decided.`,
        `One last exchange. ${se.winner} prevails. ${se.loser} drops to ${pr(se.loser).posAdj} knees.`,
      ])}</div>
    </div>`;
  }
  return '';
}

// ══════════════════════════════════════════════════════════════
// SCREEN 4: VOLCANO RACE (click-to-reveal, individual cards)
// ══════════════════════════════════════════════════════════════
export function rpBuildHPVolcanoRace(ep) {
  const rd = ep.hpRaceData;
  if (!rd) return _hpShell('<p>No race data.</p>', ep, 'volcano');

  const [rA, rB] = rd.finalists;
  const stateKey = 'hp-volcano';
  const steps = [];
  const stepMeta = []; // per-step: { phase, event?, phaseScore?, cumA?, cumB? }
  const raceGallery = rd.galleryEvents || [];

  function _push(html, meta = {}) {
    steps.push(html);
    stepMeta.push(meta);
  }

  function _pushGallery(phase) {
    raceGallery.filter(e => e.phase === phase).forEach(evt => {
      const card = _galleryCard(evt);
      if (card) _push(card, { phase, event: 'gallery' });
    });
  }

  function _cumBar(label, sA, sB) {
    const total = sA + sB || 1;
    const pct = Math.min(95, Math.max(5, (sA / total) * 100));
    return `<div class="hp-exchange" style="margin-top:10px">
      <span style="font-size:10px;min-width:60px;text-align:right">${rA}</span>
      <div class="hp-exchange-bar">
        <div class="hp-exchange-fill" style="width:${pct}%;background:linear-gradient(90deg,${faction(rA) === 'hero' ? 'var(--hp-teal)' : 'var(--hp-magma)'},${faction(rB) === 'hero' ? 'var(--hp-teal)' : 'var(--hp-magma)'})"></div>
      </div>
      <span style="font-size:10px;min-width:60px">${rB}</span>
    </div>`;
  }

  // Pre-compute phase boundaries for sidebar gating
  const phaseBounds = {}; // { 1: { start, end, winner, scoreA, scoreB }, ... }
  let stepCount = 0;

  // ════════════ Phase 1: Build the Dummy ════════════
  const p1 = rd.phaseResults[0];
  if (p1) {
    const p1Start = stepCount;
    _push(`<div class="hp-section-head">
      <div class="hp-section-num">P1</div>
      <div class="hp-section-title">${p1.name || 'Build the Dummy'}</div>
      <div class="hp-section-meta">Construct your effigy</div>
    </div>
    <div class="hp-host-line">"Build a dummy of your opponent. Best dummy gets a head start. GO!"</div>
    <div class="hp-flavor">${pick(TIKI_FLAVOR)}</div>`, { phase: 1 });
    stepCount++;

    for (const ev of (p1.events || [])) {
      if (ev.type === 'gather-materials') {
        _push(`<div class="hp-card" data-fac="${faction(ev.winner)}">
          <div class="hp-card-hdr">${_avatarBadge(ev.winner, 'sm')}<span class="hp-card-title">Material Grab</span><span class="hp-badge hp-b-volcano">SUPPLIES</span></div>
          <div class="hp-card-body">${pick(GATHER_NARR.winner)(ev.winner, ev.archW)}</div>
        </div>`, { phase: 1, feed: `${ev.winner} grabs best materials` });
        stepCount++;
        _push(`<div class="hp-card" data-fac="${faction(ev.loser)}" style="opacity:.85">
          <div class="hp-card-hdr">${_avatarBadge(ev.loser, 'sm')}<span class="hp-card-title">Second Pick</span><span class="hp-badge hp-b-ko">LATE</span></div>
          <div class="hp-card-body">${pick(GATHER_NARR.loser)(ev.loser, ev.archL)}</div>
        </div>`, { phase: 1 });
        stepCount++;
      } else if (ev.type === 'assistant-chemistry') {
        const pool = ev.positive ? ASSISTANT_CHEM_GOOD : ASSISTANT_CHEM_BAD;
        _push(`<div class="hp-social-card" style="border-color:${ev.positive ? 'rgba(26,167,167,.3)' : 'rgba(196,24,47,.3)'}">
          <div class="hp-social-header">
            ${_avatarBadge(ev.assistant, 'sm')} ${_avatarBadge(ev.finalist, 'sm')}
            <span class="hp-social-label" style="color:${ev.positive ? 'var(--hp-teal)' : 'var(--hp-magma)'}">${ev.positive ? 'CHEMISTRY' : 'FRICTION'}</span>
          </div>
          <div class="hp-card-body">${pick(pool)(ev.assistant, ev.finalist)}</div>
        </div>`, { phase: 1, feed: `${ev.assistant} + ${ev.finalist}: ${ev.positive ? 'chemistry' : 'friction'}` });
        stepCount++;
      } else if (ev.type === 'assistant-working') {
        _push(`<div class="hp-social-card" style="border-color:rgba(255,181,71,.2)">
          <div class="hp-social-header">
            ${_avatarBadge(ev.assistant, 'sm')} ${_avatarBadge(ev.finalist, 'sm')}
            <span class="hp-social-label" style="color:var(--hp-gold)">WORKING</span>
          </div>
          <div class="hp-card-body">${ev.assistant} and ${ev.finalist} build side by side. Functional, if not magical.</div>
        </div>`, { phase: 1 });
        stepCount++;
      } else if (ev.type === 'build-mishap') {
        const pool = BUILD_MISHAP_NARR[ev.mishapType] || BUILD_MISHAP_NARR.fumble;
        _push(`<div class="hp-card" data-fac="${faction(ev.player)}">
          <div class="hp-card-hdr">${_avatarBadge(ev.player, 'sm')}<span class="hp-card-title">${ev.mishapType === 'rage-break' ? 'Rage Break!' : ev.mishapType === 'comical-fail' ? 'Disaster!' : ev.mishapType === 'brute-force' ? 'Brute Force' : 'Fumble'}</span><span class="hp-badge hp-b-ko">${ev.mishapType.toUpperCase().replace('-',' ')}</span></div>
          <div class="hp-card-body">${pick(pool)(ev.player)}</div>
        </div>`, { phase: 1, feed: `${ev.player}: ${ev.mishapType.replace('-',' ')}!`, color: 'magma' });
        stepCount++;
      } else if (ev.type === 'build-impressive') {
        _push(`<div class="hp-card" data-fac="${faction(ev.player)}">
          <div class="hp-card-hdr">${_avatarBadge(ev.player, 'sm')}<span class="hp-card-title">Impressive Build</span><span class="hp-badge hp-b-win">QUALITY</span></div>
          <div class="hp-card-body">${pick(BUILD_IMPRESSIVE_NARR)(ev.player, ev.arch)}</div>
        </div>`, { phase: 1, feed: `${ev.player}: impressive build`, color: 'teal' });
        stepCount++;
      } else if (ev.type === 'sabotage') {
        _push(`<div class="hp-card" data-fac="${faction(ev.player)}">
          <div class="hp-card-hdr">${_avatarBadge(ev.player, 'sm')}<span class="hp-card-title">Sabotage!</span><span class="hp-badge hp-b-ko">DIRTY PLAY</span></div>
          <div class="hp-card-body">${pick(SABOTAGE_EVENT)(ev.player, ev.target)}</div>
        </div>`, { phase: 1, feed: `${ev.player} sabotages ${ev.target}!`, color: 'magma' });
        stepCount++;
      } else if (ev.type === 'dummy-insult') {
        _push(`<div class="hp-card" data-fac="${faction(ev.player)}">
          <div class="hp-card-hdr">${_avatarBadge(ev.player, 'sm')}<span class="hp-card-title">Trash Talk</span><span class="hp-badge hp-b-joust">INSULT</span></div>
          <div class="hp-card-body">${pick(DUMMY_INSULT)(ev.player, ev.target)}</div>
        </div>`, { phase: 1, feed: `${ev.player} trash talks ${ev.target}` });
        stepCount++;
      } else if (ev.type === 'bench-rally') {
        _push(`<div class="hp-social-card" style="border-color:rgba(255,181,71,.3)">
          <div class="hp-social-header">${_avatarBadge(ev.rallier || ev.finalist, 'sm')}<span class="hp-social-label" style="color:var(--hp-gold)">BENCH RALLY</span></div>
          <div class="hp-card-body">${ev.rallier ? `${ev.rallier} leads the chant for ${ev.finalist}. ` : ''}${pick(BENCH_RALLY)(ev.finalist, ev.benchSize)}</div>
        </div>`, { phase: 1, feed: `Bench rallies for ${ev.finalist}`, color: 'gold' });
        stepCount++;
      } else if (ev.type === 'dummy-quality') {
        const pool = DUMMY_QUALITY_NARR[ev.verdict] || DUMMY_QUALITY_NARR.close;
        const p1Winner = ev.winner;
        _push(`<div class="hp-card" data-fac="${faction(p1Winner)}" style="border-width:2px">
          <div class="hp-card-hdr">${_icon('dummy')}<span class="hp-card-title">Phase 1: ${p1Winner} wins</span><span class="hp-badge hp-b-win">BUILD</span></div>
          <div class="hp-card-body">${pick(pool)(ev.winner, ev.loser)}
            <div style="margin-top:8px;font-size:12px;opacity:.7">Score: <strong>${p1.scoreA.toFixed(1)}</strong> (${rA}) vs <strong>${p1.scoreB.toFixed(1)}</strong> (${rB}).
            ${p1.carry ? ` ${p1.carry.player} carries a <strong>+${p1.carry.amount.toFixed(1)}</strong> advantage forward.` : ''}</div></div>
        </div>`, { phase: 1, phaseEnd: true, winner: p1Winner, scoreA: p1.scoreA, scoreB: p1.scoreB });
        stepCount++;
      }
    }

    _pushGallery(1);
    _push(`<div class="hp-host-line">${pick(HOST_LINES)()}</div>`, { phase: 1 });
    stepCount++;
    phaseBounds[1] = { start: p1Start, end: stepCount - 1, winner: p1.winner, scoreA: p1.scoreA, scoreB: p1.scoreB };
  }

  // ════════════ Phase 2: Uphill Race ════════════
  const p2 = rd.phaseResults[1];
  if (p2) {
    const p2Start = stepCount;
    _push(`<div class="hp-section-head">
      <div class="hp-section-num">P2</div>
      <div class="hp-section-title">${p2.name || 'Uphill Race'}</div>
      <div class="hp-section-meta">Wheelbarrow the dummy up the volcano</div>
    </div>
    <div class="hp-host-line">"Load your dummies. Push uphill. First to the lava field wins Phase 2. <em>Try not to die.</em>"</div>`, { phase: 2 });
    stepCount++;

    for (const ev of (p2.events || [])) {
      if (ev.type === 'wheelbarrow') {
        if (ev.advantage) {
          _push(`<div class="hp-card" data-fac="${faction(ev.finalist)}">
            <div class="hp-card-hdr">${_avatarBadge(ev.finalist, 'sm')}<span class="hp-card-title">Wheelbarrow Advantage</span><span class="hp-badge hp-b-climb">GEAR</span></div>
            <div class="hp-card-body"><strong>${ev.finalist}</strong> loads the dummy and grabs the handles.${ev.assistant ? ` <strong>${ev.assistant}</strong> pushes from behind — perfect teamwork.` : ''} The incline doesn't slow ${pr(ev.finalist).obj} down.</div>
          </div>`, { phase: 2, feed: `${ev.finalist} gets wheelbarrow edge`, color: 'teal' });
        } else {
          _push(`<div class="hp-card" data-fac="${faction(ev.finalist)}" style="opacity:.8">
            <div class="hp-card-hdr">${_avatarBadge(ev.finalist, 'sm')}<span class="hp-card-title">Wheelbarrow Loading</span><span class="hp-badge hp-b-volcano">GEAR</span></div>
            <div class="hp-card-body"><strong>${ev.finalist}</strong> loads up but the wheelbarrow feels heavier.${ev.assistant ? ` ${ev.assistant} helps, but the coordination isn't there.` : ''}</div>
          </div>`, { phase: 2 });
        }
        stepCount++;
      } else if (ev.type === 'early-climb') {
        for (const seg of (ev.segments || [])) {
          const pool = EARLY_CLIMB_NARR[seg.terrain] || EARLY_CLIMB_NARR.steady;
          _push(`<div class="hp-card" data-fac="${faction(seg.racer)}">
            <div class="hp-card-hdr">${_avatarBadge(seg.racer, 'sm')}<span class="hp-card-title">${seg.racer}'s Climb</span><span class="hp-badge hp-b-volcano">${seg.terrain.toUpperCase()}</span></div>
            <div class="hp-card-body">${pick(pool)(seg.racer, seg.arch)}</div>
          </div>`, { phase: 2, feed: `${seg.racer}: ${seg.terrain}`, color: seg.terrain === 'strong' ? 'teal' : seg.terrain === 'struggling' ? 'magma' : '' });
          stepCount++;
        }
      } else if (ev.type === 'stumble') {
        _push(`<div class="hp-card" data-fac="${faction(ev.player)}">
          <div class="hp-card-hdr">${_avatarBadge(ev.player, 'sm')}<span class="hp-card-title">${ev.severity === 'major' ? 'MAJOR Wipeout!' : 'Stumble!'}</span><span class="hp-badge hp-b-ko">${ev.severity === 'major' ? 'DOWN' : 'SLIP'}</span></div>
          <div class="hp-card-body">${pick(STUMBLE_EVENT)(ev.player)}${ev.severity === 'major' ? ` The ${ev.recovery.replace('-', ' ')} takes precious seconds.` : ''}</div>
        </div>`, { phase: 2, feed: `${ev.player} ${ev.severity} stumble!`, color: 'magma' });
        stepCount++;
      } else if (ev.type === 'shortcut') {
        _push(`<div class="hp-card" data-fac="${faction(ev.player)}">
          <div class="hp-card-hdr">${_avatarBadge(ev.player, 'sm')}<span class="hp-card-title">${ev.risky ? 'Risky Shortcut!' : 'Shortcut Found'}</span><span class="hp-badge hp-b-climb">${ev.risky ? 'GAMBLE' : 'DETOUR'}</span></div>
          <div class="hp-card-body">${pick(SHORTCUT_EVENT)(ev.player)}${ev.risky ? ' A dangerous gamble that paid off BIG.' : ''}</div>
        </div>`, { phase: 2, feed: `${ev.player} finds shortcut!`, color: 'teal' });
        stepCount++;
      } else if (ev.type === 'taunt-from-above') {
        _push(`<div class="hp-card" data-fac="${faction(ev.player)}">
          <div class="hp-card-hdr">${_avatarBadge(ev.player, 'sm')}<span class="hp-card-title">Taunt from Above</span><span class="hp-badge hp-b-joust">PSYCH</span></div>
          <div class="hp-card-body"><strong>${ev.player}</strong> looks down at <strong>${ev.target}</strong> from higher ground. "Enjoying the view down there?" The crowd reacts.</div>
        </div>`, { phase: 2, feed: `${ev.player} taunts ${ev.target}`, color: 'magma' });
        stepCount++;
      } else if (ev.type === 'rival-respect') {
        _push(`<div class="hp-social-card" style="border-color:rgba(26,167,167,.3)">
          <div class="hp-social-header">${_avatarBadge(ev.player, 'sm')} ${_avatarBadge(ev.target, 'sm')}<span class="hp-social-label" style="color:var(--hp-teal)">RESPECT</span></div>
          <div class="hp-card-body">${pick(RIVAL_RESPECT_NARR)(ev.player, ev.target)}</div>
        </div>`, { phase: 2, feed: `${ev.player} respects ${ev.target}`, color: 'teal' });
        stepCount++;
      } else if (ev.type === 'focused-climb') {
        _push(`<div class="hp-card" data-fac="${faction(ev.player)}">
          <div class="hp-card-hdr">${_avatarBadge(ev.player, 'sm')}<span class="hp-card-title">Locked In</span><span class="hp-badge hp-b-volcano">FOCUS</span></div>
          <div class="hp-card-body">${pick(FOCUSED_CLIMB_NARR)(ev.player, ev.arch)}</div>
        </div>`, { phase: 2 });
        stepCount++;
      } else if (ev.type === 'bench-interference') {
        const pool = ev.hostile ? BENCH_INTERF_NARR.hostile : BENCH_INTERF_NARR.helpful;
        _push(`<div class="hp-social-card" style="border-color:${ev.hostile ? 'rgba(196,24,47,.3)' : 'rgba(26,167,167,.3)'}">
          <div class="hp-social-header">${_avatarBadge(ev.interferer, 'sm')}<span class="hp-social-label" style="color:${ev.hostile ? 'var(--hp-magma)' : 'var(--hp-teal)'}">${ev.hostile ? 'SABOTAGE' : 'ASSIST'}</span></div>
          <div class="hp-card-body">${pick(pool)(ev.interferer, ev.target)}</div>
        </div>`, { phase: 2, feed: `${ev.interferer} ${ev.hostile ? 'sabotages' : 'helps'} ${ev.target}`, color: ev.hostile ? 'magma' : 'teal' });
        stepCount++;
      } else if (ev.type === 'final-push') {
        const pool = ev.strong ? FINAL_PUSH_NARR.strong : FINAL_PUSH_NARR.weak;
        _push(`<div class="hp-card" data-fac="${faction(ev.player)}">
          <div class="hp-card-hdr">${_avatarBadge(ev.player, 'sm')}<span class="hp-card-title">${ev.strong ? 'SURGE!' : 'Fading...'}</span><span class="hp-badge ${ev.strong ? 'hp-b-win' : 'hp-b-ko'}">${ev.strong ? 'BURST' : 'WALL'}</span></div>
          <div class="hp-card-body">${pick(pool)(ev.player, ev.arch)}</div>
        </div>`, { phase: 2, feed: `${ev.player} ${ev.strong ? 'surges!' : 'fading...'}`, color: ev.strong ? 'teal' : 'magma' });
        stepCount++;
      }
    }

    _pushGallery(2);

    const p2Winner = p2.winner || rA;
    _push(`<div class="hp-card" data-fac="${faction(p2Winner)}" style="border-width:2px">
      <div class="hp-card-hdr">${_icon('mountain')}<span class="hp-card-title">Phase 2: ${p2Winner} leads</span><span class="hp-badge hp-b-win">UPHILL</span></div>
      <div class="hp-card-body">Score: <strong>${p2.scoreA.toFixed(1)}</strong> (${rA}) vs <strong>${p2.scoreB.toFixed(1)}</strong> (${rB}).
        ${_cumBar('P1+P2', (rd.cumulativeScores?.[rA] || p2.scoreA) || 0, (rd.cumulativeScores?.[rB] || p2.scoreB) || 0)}</div>
    </div>`, { phase: 2, phaseEnd: true, winner: p2Winner, scoreA: p2.scoreA, scoreB: p2.scoreB });
    stepCount++;

    _push(`<div class="hp-flavor">${pick(TIKI_FLAVOR)}</div>`, { phase: 2 });
    stepCount++;
    phaseBounds[2] = { start: p2Start, end: stepCount - 1, winner: p2.winner, scoreA: p2.scoreA, scoreB: p2.scoreB };
  }

  // ════════════ Phase 3: Lava River Crossing ════════════
  const p3 = rd.phaseResults[2];
  if (p3) {
    const p3Start = stepCount;
    _push(`<div class="hp-section-head">
      <div class="hp-section-num">P3</div>
      <div class="hp-section-title">${p3.name || 'Lava River Crossing'}</div>
      <div class="hp-section-meta">Ropes · Traps · Don't fall in</div>
    </div>
    <div class="hp-host-line">"Cross the lava river. Helpers can cut ropes to drop traps on the OTHER team. <em>Try not to fall in.</em>"</div>`, { phase: 3 });
    stepCount++;

    for (const ev of (p3.events || [])) {
      if (ev.type === 'lava-approach') {
        const pool = LAVA_APPROACH_NARR[ev.approach] || LAVA_APPROACH_NARR.cautious;
        _push(`<div class="hp-card" data-fac="${faction(ev.player)}">
          <div class="hp-card-hdr">${_avatarBadge(ev.player, 'sm')}<span class="hp-card-title">${ev.player} approaches</span><span class="hp-badge hp-b-volcano">${ev.approach.toUpperCase()}</span></div>
          <div class="hp-card-body">${pick(pool)(ev.player, ev.arch)}</div>
        </div>`, { phase: 3, feed: `${ev.player}: ${ev.approach} approach` });
        stepCount++;
      } else if (ev.type === 'rope-cutting') {
        if (ev.ropeResults && ev.ropeResults.length) {
          let tableHtml = `<div class="hp-card" data-fac="host">
            <div class="hp-card-hdr">${_icon('rope')}<span class="hp-card-title">Rope Trap Results</span><span class="hp-badge hp-b-volcano">${ev.ropeResults.length} ROPES</span></div>
            <div style="overflow-x:auto">
            <table style="width:100%;border-collapse:collapse;font-size:12px;margin-top:8px">
              <thead><tr style="border-bottom:1px solid rgba(255,181,71,.2);text-align:left">
                <th style="padding:6px 8px;color:var(--hp-gold);font-family:'Press Start 2P',monospace;font-size:8px">ROPE</th>
                <th style="padding:6px 8px;color:var(--hp-gold);font-family:'Press Start 2P',monospace;font-size:8px">TRAP</th>
                <th style="padding:6px 8px;color:var(--hp-gold);font-family:'Press Start 2P',monospace;font-size:8px">TARGET</th>
                <th style="padding:6px 8px;color:var(--hp-gold);font-family:'Press Start 2P',monospace;font-size:8px">RESULT</th>
                <th style="padding:6px 8px;color:var(--hp-gold);font-family:'Press Start 2P',monospace;font-size:8px;text-align:right">PEN</th>
              </tr></thead><tbody>`;
          for (const rr of ev.ropeResults) {
            const result = rr.dodged ? 'DODGED' : rr.escaped ? 'ESCAPED' : rr.safe ? 'SAFE' : rr.mismatch ? 'BACKFIRE' : rr.hitTarget ? 'HIT' : 'MISS';
            const resultColor = (result === 'HIT' || result === 'BACKFIRE') ? 'var(--hp-magma)' : result === 'DODGED' || result === 'ESCAPED' ? 'var(--hp-teal)' : 'var(--hp-gold)';
            tableHtml += `<tr style="border-bottom:1px solid rgba(255,255,255,.04)">
              <td style="padding:6px 8px;font-family:'Press Start 2P',monospace;font-size:9px;color:var(--hp-lava-hot)">#${rr.rope}</td>
              <td style="padding:6px 8px;color:rgba(243,231,201,.7)">${rr.trap || '???'}</td>
              <td style="padding:6px 8px">${rr.hitTarget ? _avatarBadge(rr.hitTarget, 'sm') : '<span style="opacity:.4">—</span>'}</td>
              <td style="padding:6px 8px;color:${resultColor};font-weight:700;font-size:11px">${result}${rr.helper ? ` <span style="font-size:9px;opacity:.6">(${rr.helper})</span>` : ''}</td>
              <td style="padding:6px 8px;text-align:right;font-family:'Press Start 2P',monospace;font-size:8px;color:${rr.penalty > 0 ? 'var(--hp-magma)' : 'rgba(243,231,201,.3)'}">${rr.penalty > 0 ? '-' + rr.penalty.toFixed(1) : '0'}</td>
            </tr>`;
          }
          tableHtml += `</tbody></table></div></div>`;
          const hits = ev.ropeResults.filter(r => !r.dodged && !r.escaped && !r.safe).length;
          _push(tableHtml, { phase: 3, feed: `${ev.ropeResults.length} ropes, ${hits} hits`, color: hits > 2 ? 'magma' : 'gold' });
          stepCount++;

          for (const rr of ev.ropeResults) {
            if (rr.mismatch && rr.hitTarget) {
              _push(`<div class="hp-card hp-lava-glow" data-fac="${faction(rr.hitTarget)}">
                <div class="hp-card-hdr">${_icon('trap')}<span class="hp-card-title">BACKFIRE!</span><span class="hp-badge hp-b-ko">FRIENDLY FIRE</span></div>
                <div class="hp-card-body">The rope cut goes wrong! The ${rr.trap} swings back and hits <strong>${rr.hitTarget}</strong> — ${pr(rr.hitTarget).posAdj} own teammate's trap!</div>
              </div>`, { phase: 3, feed: `BACKFIRE on ${rr.hitTarget}!`, color: 'magma' });
              stepCount++;
            } else if (rr.escaped) {
              _push(`<div class="hp-card" data-fac="${faction(rr.hitTarget)}">
                <div class="hp-card-hdr">${_avatarBadge(rr.hitTarget, 'sm')}<span class="hp-card-title">Cage Escape!</span><span class="hp-badge hp-b-win">FREE</span></div>
                <div class="hp-card-body"><strong>${rr.hitTarget}</strong> BREAKS out of the cage through sheer force! The ${rr.trap} can't hold ${pr(rr.hitTarget).obj}.</div>
              </div>`, { phase: 3, feed: `${rr.hitTarget} escapes cage!`, color: 'teal' });
              stepCount++;
            } else if (rr.dodged) {
              _push(`<div class="hp-card" data-fac="${faction(rr.hitTarget)}" style="opacity:.85">
                <div class="hp-card-hdr">${_avatarBadge(rr.hitTarget, 'sm')}<span class="hp-card-title">Dodge!</span><span class="hp-badge hp-b-climb">MATRIX</span></div>
                <div class="hp-card-body"><strong>${rr.hitTarget}</strong> sees the ${rr.trap} falling and MOVES. Split-second reflexes.</div>
              </div>`, { phase: 3, feed: `${rr.hitTarget} dodges ${rr.trap}!`, color: 'teal' });
              stepCount++;
            }
          }
        }
      } else if (ev.type === 'heat-wave') {
        const pool = ev.panicked ? HEAT_WAVE_NARR.panicked : HEAT_WAVE_NARR.calm;
        _push(`<div class="hp-card" data-fac="${faction(ev.player)}">
          <div class="hp-card-hdr">${_icon('fire')}<span class="hp-card-title">${ev.panicked ? 'Heat Panic!' : 'Heat Wave'}</span><span class="hp-badge ${ev.panicked ? 'hp-b-ko' : 'hp-b-volcano'}">${ev.panicked ? 'PANIC' : 'ENDURED'}</span></div>
          <div class="hp-card-body">${pick(pool)(ev.player, ev.arch)}</div>
        </div>`, { phase: 3, feed: `${ev.player}: ${ev.panicked ? 'heat panic!' : 'endures heat'}`, color: ev.panicked ? 'magma' : '' });
        stepCount++;
      } else if (ev.type === 'distraction-play') {
        _push(`<div class="hp-card" data-fac="${faction(ev.attacker)}">
          <div class="hp-card-hdr">${_avatarBadge(ev.attacker, 'sm')}<span class="hp-card-title">Distraction Play</span><span class="hp-badge ${ev.success ? 'hp-b-twist' : 'hp-b-ko'}">${ev.success ? 'WORKED' : 'FAILED'}</span></div>
          <div class="hp-card-body">${pick(DISTRACTION_PLAY)(ev.attacker, ev.defender, ev.reference, ev.success)}</div>
        </div>`, { phase: 3, feed: `${ev.attacker} distracts ${ev.defender}: ${ev.success ? 'SUCCESS' : 'FAIL'}`, color: ev.success ? 'magma' : 'teal' });
        stepCount++;
      } else if (ev.type === 'counter-block') {
        _push(`<div class="hp-card" data-fac="${faction(ev.winner)}">
          <div class="hp-card-hdr">${_avatarBadge(ev.winner, 'sm')}<span class="hp-card-title">Counter-Block!</span><span class="hp-badge hp-b-climb">BLOCKED</span></div>
          <div class="hp-card-body">${pick(COUNTER_BLOCK)(ev.winner, ev.loser, ev.beneficiary)}</div>
        </div>`, { phase: 3, feed: `${ev.winner} blocks for ${ev.beneficiary}`, color: 'teal' });
        stepCount++;
      } else if (ev.type === 'dummy-condition') {
        const pool = DUMMY_CONDITION_NARR[ev.damage] || DUMMY_CONDITION_NARR.intact;
        if (ev.damage !== 'intact') {
          _push(`<div class="hp-card" data-fac="${faction(ev.player)}" style="opacity:.85">
            <div class="hp-card-hdr">${_avatarBadge(ev.player, 'sm')}<span class="hp-card-title">Dummy Status</span><span class="hp-badge ${ev.damage === 'heavy' ? 'hp-b-ko' : 'hp-b-volcano'}">${ev.damage.toUpperCase()}</span></div>
            <div class="hp-card-body">${pick(pool)(ev.player)}</div>
          </div>`, { phase: 3, feed: `${ev.player}'s dummy: ${ev.damage}`, color: ev.damage === 'heavy' ? 'magma' : 'gold' });
          stepCount++;
        }
      }
    }

    _pushGallery(3);

    const p3Winner = p3.winner || rA;
    _push(`<div class="hp-card" data-fac="${faction(p3Winner)}" style="border-width:2px">
      <div class="hp-card-hdr">${_icon('lava')}<span class="hp-card-title">Phase 3: ${p3Winner} crosses first</span><span class="hp-badge hp-b-win">LAVA</span></div>
      <div class="hp-card-body">Score: <strong>${p3.scoreA.toFixed(1)}</strong> (${rA}) vs <strong>${p3.scoreB.toFixed(1)}</strong> (${rB}).</div>
    </div>`, { phase: 3, phaseEnd: true, winner: p3Winner, scoreA: p3.scoreA, scoreB: p3.scoreB });
    stepCount++;
    _push(`<div class="hp-flavor">${pick(TIKI_FLAVOR)}</div>`, { phase: 3 });
    stepCount++;
    phaseBounds[3] = { start: p3Start, end: stepCount - 1, winner: p3.winner, scoreA: p3.scoreA, scoreB: p3.scoreB };
  }

  // ════════════ Phase 4: Summit Showdown ════════════
  const p4 = rd.phaseResults[3];
  if (p4) {
    const p4Start = stepCount;
    _push(`<div class="hp-section-head">
      <div class="hp-section-num">P4</div>
      <div class="hp-section-title">${p4.name || 'Summit Showdown'}</div>
      <div class="hp-section-meta">The crater's edge · Last chance</div>
    </div>`, { phase: 4 });
    stepCount++;

    for (const ev of (p4.events || [])) {
      if (ev.type === 'summit-arrival') {
        _push(`<div class="hp-card" data-fac="${faction(ev.leader)}">
          <div class="hp-card-hdr">${_avatarBadge(ev.leader, 'sm')}<span class="hp-card-title">First to the Summit</span><span class="hp-badge hp-b-volcano">LEADER</span></div>
          <div class="hp-card-body">${pick(SUMMIT_ARRIVAL_NARR.leader)(ev.leader, ev.leaderArch, ev.gap)}</div>
        </div>`, { phase: 4, feed: `${ev.leader} arrives first (+${ev.gap})` });
        stepCount++;
        _push(`<div class="hp-card" data-fac="${faction(ev.trailer)}">
          <div class="hp-card-hdr">${_avatarBadge(ev.trailer, 'sm')}<span class="hp-card-title">Arrives at the Summit</span><span class="hp-badge hp-b-ko">TRAILING</span></div>
          <div class="hp-card-body">${pick(SUMMIT_ARRIVAL_NARR.trailer)(ev.trailer, ev.trailerArch)}</div>
        </div>`, { phase: 4 });
        stepCount++;
      } else if (ev.type === 'summit-bench-eruption') {
        let benchHtml = '';
        for (const r of (ev.reactions || [])) {
          const pool = r.isWinning ? BENCH_ERUPTION_NARR.winning : BENCH_ERUPTION_NARR.losing;
          benchHtml += `<div style="display:flex;align-items:center;gap:8px;padding:4px 0;border-bottom:1px solid rgba(255,255,255,.04)">${_avatarBadge(r.name, 'sm')}<span style="flex:1;font-size:12px">${pick(pool)(r.name, r.arch)}</span></div>`;
        }
        _push(`<div class="hp-social-card" style="border-color:rgba(255,181,71,.3)">
          <div class="hp-social-header">${_icon('megaphone')}<span class="hp-social-label" style="color:var(--hp-gold)">THE BENCH ERUPTS</span></div>
          <div class="hp-card-body">${benchHtml}</div>
        </div>`, { phase: 4, feed: 'Bench erupts!', color: 'gold' });
        stepCount++;
      } else if (ev.type === 'showmance-vulnerability') {
        _push(`<div class="hp-social-card" style="border-color:rgba(255,59,107,.4)">
          <div class="hp-social-header">${_icon('heart')} ${_avatarBadge(ev.leader, 'sm')} ${_avatarBadge(ev.trailer, 'sm')}<span class="hp-social-label" style="color:var(--hp-bruise)">VULNERABILITY</span></div>
          <div class="hp-card-body">${ev.hasShowmance ? `The showmance complicates everything. ${ev.leader} can't shut ${ev.trailer} out emotionally.` : `The bond between them (${ev.bond >= 0 ? '+' : ''}${ev.bond}) creates an opening. ${ev.leader} cares too much to ignore ${ev.trailer}'s words.`}</div>
        </div>`, { phase: 4, feed: 'Emotional vulnerability!', color: 'magma' });
        stepCount++;
      } else if (ev.type === 'mind-game-attempt') {
        const pool = MIND_GAME_ATTEMPT_NARR[ev.mindGameType] || MIND_GAME_ATTEMPT_NARR['taunt-provocation'];
        _push(`<div class="hp-card hp-lava-glow" data-fac="${faction(ev.attacker)}" style="border-width:2px">
          <div class="hp-card-hdr">${_icon('eye')}<span class="hp-card-title">Mind Game: ${ev.mindGameType.replace(/-/g, ' ')}</span><span class="hp-badge hp-b-twist">PSYCH</span></div>
          <div class="hp-card-body">${pick(pool)(ev.attacker, ev.defender)}</div>
        </div>`, { phase: 4, feed: `${ev.attacker} uses ${ev.mindGameType.replace(/-/g,' ')}!`, color: 'gold' });
        stepCount++;
      } else if (ev.type === 'mind-game-result') {
        if (ev.success) {
          _push(`<div class="hp-card" data-fac="${faction(ev.defender)}">
            <div class="hp-card-hdr">${_avatarBadge(ev.defender, 'sm')}<span class="hp-card-title">${ev.defender} falters</span><span class="hp-badge hp-b-ko">CRACKED</span></div>
            <div class="hp-card-body">${pick(MIND_GAME_RESULT_NARR.success)(ev.defender, ev.attacker)}</div>
          </div>`, { phase: 4, feed: `${ev.defender} CRACKED!`, color: 'magma' });
          stepCount++;
          _push(`<div class="hp-outcome twist">
            <div class="hp-outcome-tag">★ MIND GAME FLIP ★</div>
            <div class="hp-outcome-title">OVERTAKEN!</div>
            <div class="hp-outcome-sub">${ev.attacker} seizes the moment. The trailer becomes the leader!</div>
          </div>`, { phase: 4, feed: 'MIND GAME FLIP!', color: 'gold' });
          stepCount++;
        } else {
          _push(`<div class="hp-card" data-fac="${faction(ev.defender)}">
            <div class="hp-card-hdr">${_avatarBadge(ev.defender, 'sm')}<span class="hp-card-title">${ev.defender} holds firm</span><span class="hp-badge hp-b-win">UNBROKEN</span></div>
            <div class="hp-card-body">${pick(MIND_GAME_RESULT_NARR.failure)(ev.defender, ev.attacker)}</div>
          </div>`, { phase: 4, feed: `${ev.defender} holds firm!`, color: 'teal' });
          stepCount++;
        }
      } else if (ev.type === 'sprint-finish') {
        _push(`<div class="hp-card" data-fac="host">
          <div class="hp-card-hdr">${_icon('bolt')}<span class="hp-card-title">Sprint to the Crater</span><span class="hp-badge hp-b-volcano">FINALE</span></div>
          <div class="hp-card-body">${pick(SPRINT_FINISH_NARR)(ev.leader, ev.trailer)}</div>
        </div>`, { phase: 4, feed: 'Sprint to the crater!' });
        stepCount++;
      } else if (ev.type === 'dummy-throw') {
        _push(`<div class="hp-card hp-lava-glow" data-fac="${faction(ev.winner)}" style="text-align:center;border-color:var(--hp-lava);border-width:2px">
          <div style="font-family:'Bungee Inline',cursive;font-size:18px;color:var(--hp-lava-hot);letter-spacing:3px;margin-bottom:6px">${_icon('dummy')} THE THROW ${_icon('dummy')}</div>
          <div class="hp-card-body">${pick(THROW_NARR.winner)(ev.winner, ev.winArch)}</div>
        </div>`, { phase: 4, phaseEnd: true, winner: ev.winner, feed: `${ev.winner} THROWS FIRST!`, color: 'gold' });
        stepCount++;
        _push(`<div class="hp-card" data-fac="${faction(ev.loser)}" style="opacity:.8">
          <div class="hp-card-hdr">${_avatarBadge(ev.loser, 'sm')}<span class="hp-card-title">${ev.loser}'s Throw</span><span class="hp-badge hp-b-ko">TOO LATE</span></div>
          <div class="hp-card-body">${pick(THROW_NARR.loser)(ev.loser, ev.loseArch)}</div>
        </div>`, { phase: 4 });
        stepCount++;
      } else if (ev.type === 'loser-reaction') {
        const pool = ev.flipped ? LOSER_REACT_NARR.flipped : LOSER_REACT_NARR.normal;
        _push(`<div class="hp-card" data-fac="${faction(ev.loser)}" style="opacity:.75">
          <div class="hp-card-hdr">${_avatarBadge(ev.loser, 'sm')}<span class="hp-card-title">${ev.loser}'s Reaction</span><span class="hp-badge hp-b-ko">LOSS</span></div>
          <div class="hp-card-body">${ev.flipped ? pick(pool)(ev.loser, ev.winner) : pick(pool)(ev.loser, ev.winner, ev.loseArch)}</div>
        </div>`, { phase: 4 });
        stepCount++;
      }
    }

    _pushGallery(4);
    _push(`<div class="hp-host-line">${pick(HOST_LINES)()}</div>`, { phase: 4 });
    stepCount++;
    phaseBounds[4] = { start: p4Start, end: stepCount - 1, winner: p4.winner };
  }

  // ── Store stepMeta on window for live sidebar rebuild ──
  window._hpVolcanoStepMeta = stepMeta;
  window._hpVolcanoPhaseBounds = phaseBounds;
  window._hpVolcanoFinalists = [rA, rB];
  window._hpVolcanoRd = rd;

  const totalSteps = steps.length;
  _ensureState(stateKey, totalSteps);
  const revIdx = _tvState[stateKey].idx;

  // Use _replace mode with _rebuildFn so sidebar rebuilds dynamically each click
  const sidebarProxy = [];
  sidebarProxy._replace = true;
  sidebarProxy._rebuildFn = (revealedIdx) =>
    _buildVolcanoSidebar(revealedIdx, rA, rB, rd, stepMeta, phaseBounds);
  if (!window._hpSidebarMap) window._hpSidebarMap = {};
  window._hpSidebarMap[stateKey] = sidebarProxy;

  const stepsRendered = steps.map((html, i) =>
    `<div class="hp-step ${i <= revIdx ? 'hp-visible' : ''}" id="hp-step-volcano-${i}">${html}</div>`
  ).join('');

  const sidebarHtml = _buildVolcanoSidebar(revIdx, rA, rB, rd, stepMeta, phaseBounds);

  return _hpShell(`
    <div style="display:grid;grid-template-columns:1fr 240px;gap:20px;align-items:start">
      <div>
        <div class="hp-section-head">
          <div class="hp-section-num">03</div>
          <div class="hp-section-title">The Sacrificial Dummy Race</div>
          <div class="hp-section-meta">Build · Climb · Cross · Throw</div>
        </div>
        <div class="hp-host-line">"Build a wooden-and-pineapple effigy of your opponent. First one to chuck theirs in the lava wins ONE MILLION DOLLARS."</div>
        ${stepsRendered}
      </div>
      <aside class="hp-sidebar"><div id="hp-sidebar-inner-volcano">${sidebarHtml}</div></aside>
    </div>
    ${_controls(stateKey, totalSteps)}
  `, ep, 'volcano');
}

function _buildVolcanoSidebar(revIdx, rA, rB, rd, meta, bounds) {
  const facA = faction(rA), facB = faction(rB);
  const colorA = facA === 'hero' ? 'var(--hp-teal)' : facA === 'villain' ? 'var(--hp-magma)' : 'var(--hp-gold)';
  const colorB = facB === 'hero' ? 'var(--hp-teal)' : facB === 'villain' ? 'var(--hp-magma)' : 'var(--hp-gold)';

  // Determine current phase
  let currentPhase = 0;
  for (let p = 1; p <= 4; p++) {
    if (bounds[p] && revIdx >= bounds[p].start) currentPhase = p;
  }

  // Cumulative scores up to revealed phases
  let cumA = 0, cumB = 0;
  const phaseNames = ['', 'Build', 'Uphill', 'Lava', 'Summit'];
  const phaseIcons = ['', 'dummy', 'mountain', 'lava', 'volcano'];
  let phaseRows = '';
  for (let p = 1; p <= 4; p++) {
    if (!bounds[p]) continue;
    const revealed = revIdx >= bounds[p].end;
    const active = currentPhase === p && !revealed;
    const bnd = bounds[p];
    if (revealed && bnd.scoreA != null) { cumA += bnd.scoreA; cumB += bnd.scoreB; }
    const winner = revealed ? bnd.winner : null;

    phaseRows += `<div style="display:flex;align-items:center;gap:6px;padding:5px 0;border-bottom:1px solid rgba(255,255,255,.04);${active ? 'background:rgba(255,181,71,.06);margin:0 -8px;padding:5px 8px;border-radius:4px' : ''}">
      <span style="font-family:'Press Start 2P',monospace;font-size:7px;color:${revealed ? 'var(--hp-gold)' : active ? 'var(--hp-lava-hot)' : 'rgba(243,231,201,.2)'};min-width:18px">P${p}</span>
      <span style="font-size:11px;flex:1;color:${revealed ? 'rgba(243,231,201,.9)' : 'rgba(243,231,201,.35)'}">${phaseNames[p]}</span>
      ${revealed && winner ? `${_avatarBadge(winner, 'sm')}<span style="font-family:'Press Start 2P',monospace;font-size:7px;color:var(--hp-gold)">WIN</span>` : active ? `<span style="font-family:'Press Start 2P',monospace;font-size:7px;color:var(--hp-lava-hot);animation:hp-pulse 1.5s infinite">LIVE</span>` : `<span style="font-size:9px;opacity:.2">—</span>`}
    </div>`;
  }

  // Score bar
  const cumTotal = cumA + cumB || 1;
  const pctA = Math.min(95, Math.max(5, (cumA / cumTotal) * 100));
  const scoreBarHtml = (cumA > 0 || cumB > 0) ? `
    <div style="margin-top:8px">
      <div style="display:flex;justify-content:space-between;font-family:'Press Start 2P',monospace;font-size:8px;margin-bottom:4px">
        <span style="color:${colorA}">${cumA.toFixed(1)}</span>
        <span style="color:${colorB}">${cumB.toFixed(1)}</span>
      </div>
      <div style="height:6px;background:rgba(0,0,0,.3);border-radius:3px;overflow:hidden">
        <div style="height:100%;width:${pctA}%;background:linear-gradient(90deg,${colorA},${colorB});border-radius:3px;transition:width .3s"></div>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:9px;opacity:.5;margin-top:2px">
        <span>${rA}</span><span>${rB}</span>
      </div>
    </div>` : '';

  // Event feed — last N events with feed text
  const feedEvents = [];
  for (let i = 0; i <= revIdx && i < meta.length; i++) {
    if (meta[i]?.feed) feedEvents.push(meta[i]);
  }
  const recentFeed = feedEvents.slice(-6);
  const feedHtml = recentFeed.length ? recentFeed.map(f => {
    const c = f.color === 'magma' ? 'var(--hp-magma)' : f.color === 'teal' ? 'var(--hp-teal)' : f.color === 'gold' ? 'var(--hp-gold)' : 'rgba(243,231,201,.6)';
    return `<div style="font-size:9px;color:${c};padding:2px 0;border-bottom:1px solid rgba(255,255,255,.02)">${f.feed}</div>`;
  }).join('') : '<div style="font-size:9px;opacity:.3">Awaiting events...</div>';

  // Bench teams (compact)
  const benchFac = rd.benchFaction || {};
  const benchByF = { [rA]: [], [rB]: [] };
  for (const [m, info] of Object.entries(benchFac)) {
    if (benchByF[info.supports]) benchByF[info.supports].push(m);
  }
  const benchHtml = [rA, rB].map(f => {
    const team = benchByF[f] || [];
    if (!team.length) return '';
    return `<div style="margin-bottom:6px">
      <div style="font-size:8px;font-weight:800;color:var(--hp-gold);letter-spacing:1.5px;text-transform:uppercase">${f} (${team.length})</div>
      <div style="font-size:9px;color:rgba(243,231,201,.4)">${team.join(', ')}</div>
    </div>`;
  }).filter(Boolean).join('');

  return `
    <div class="hp-side-box">
      <div class="hp-side-title" style="display:flex;align-items:center;gap:6px">${_icon('volcano')} Race Status</div>
      <div style="display:flex;gap:8px;margin-bottom:8px">
        <div style="flex:1;text-align:center;padding:6px 0;border-radius:4px;background:rgba(0,0,0,.2)">
          ${_avatarBadge(rA, 'sm')}
          <div style="font-size:10px;font-weight:700;margin-top:2px">${rA}</div>
          <div style="font-family:'Press Start 2P',monospace;font-size:10px;color:${colorA};margin-top:2px">${cumA.toFixed(1)}</div>
        </div>
        <div style="flex:1;text-align:center;padding:6px 0;border-radius:4px;background:rgba(0,0,0,.2)">
          ${_avatarBadge(rB, 'sm')}
          <div style="font-size:10px;font-weight:700;margin-top:2px">${rB}</div>
          <div style="font-family:'Press Start 2P',monospace;font-size:10px;color:${colorB};margin-top:2px">${cumB.toFixed(1)}</div>
        </div>
      </div>
      ${scoreBarHtml}
    </div>
    <div class="hp-side-box">
      <div class="hp-side-title">${_icon('fire')} Phases</div>
      ${phaseRows}
    </div>
    <div class="hp-side-box">
      <div class="hp-side-title">${_icon('bolt')} Event Feed</div>
      ${feedHtml}
    </div>
    ${benchHtml ? `<div class="hp-side-box">
      <div class="hp-side-title">${_icon('megaphone')} Teams</div>
      ${benchHtml}
    </div>` : ''}`;
}

// ══════════════════════════════════════════════════════════════
// SCREEN 5: SUMMIT — Eruption Sequence
// ══════════════════════════════════════════════════════════════
export function rpBuildHPSummit(ep) {
  const rd = ep.hpRaceData;
  if (!rd) return _hpShell('<p>No race data.</p>', ep, 'summit');

  const winner = rd.winner;
  const [rA, rB] = rd.finalists;
  const loser = winner === rA ? rB : rA;
  const winFac = faction(winner);
  const loseFac = faction(loser);

  // Dummy throw
  const throwText = pick(DUMMY_THROW)(winner, true);

  // Eruption
  const eruptionText = pick(ERUPTION_TEXT);

  // Feral cameo
  let feralHtml = '';
  if (rd.feralCameo) {
    const fp = rd.feralCameo.player;
    feralHtml = `
      <div class="hp-host-line" style="border-color:var(--hp-magma);color:var(--hp-lava-hot);">"Wait. Is that... <em>${fp}?!</em>"</div>
      <div class="hp-card" data-fac="wild">
        <div class="hp-card-hdr">
          ${_avatarBadge(fp, 'sm')}
          <span class="hp-card-title">FERAL ${fp.toUpperCase()} APPEARS</span>
          <span class="hp-badge hp-b-twist">GREMLIN</span>
        </div>
        <div class="hp-card-body">${pick(FERAL_CAMEO)(fp)}</div>
      </div>`;
  }

  // Loser reaction
  const loserThrowText = pick(DUMMY_THROW)(loser, false);

  return _hpShell(`
    <div class="hp-section-head">
      <div class="hp-section-num">04</div>
      <div class="hp-section-title">The Summit</div>
      <div class="hp-section-meta">Eruption · Destiny · Fire</div>
    </div>

    <!-- THE THROW -->
    <div class="hp-card hp-lava-glow" data-fac="${winFac}" style="text-align:center;border-color:var(--hp-lava);border-width:2px">
      <div style="font-family:'Bungee Inline',cursive;font-size:22px;color:var(--hp-lava-hot);letter-spacing:4px;margin-bottom:8px;text-shadow:0 0 16px rgba(255,90,31,.5)">
        ${_icon('dummy')} THE SACRIFICE ${_icon('dummy')}
      </div>
      <div class="hp-card-body" style="font-size:15px">${throwText}</div>
    </div>

    <!-- LOSER'S THROW -->
    <div class="hp-card" data-fac="${loseFac}" style="opacity:.8">
      <div class="hp-card-hdr">${_avatarBadge(loser, 'sm')}<span class="hp-card-title">${loser}'s dummy</span><span class="hp-badge hp-b-ko">TOO LATE</span></div>
      <div class="hp-card-body">${loserThrowText}</div>
    </div>

    <!-- ERUPTION -->
    <div class="hp-outcome ko hp-shake" style="margin:28px 0">
      <div class="hp-outcome-tag">★ ERUPTION ★</div>
      <div class="hp-outcome-title" style="font-size:52px;color:var(--hp-lava-hot);text-shadow:0 0 40px rgba(255,90,31,.8),0 0 80px rgba(196,24,47,.5),4px 4px 0 #000">
        VOLCANO<br>BLOWS
      </div>
      <div class="hp-outcome-sub">${eruptionText}</div>
    </div>

    ${feralHtml}

    <!-- WINNER DECLARED -->
    <div class="hp-outcome win" style="margin:28px 0">
      <div class="hp-outcome-tag">★ WINNER ★</div>
      <div class="hp-outcome-title">${winner.toUpperCase()}</div>
      <div class="hp-outcome-sub">${winner} threw the dummy first. The volcano answered. It is done.</div>
      <div style="margin-top:14px">${_avatarBadge(winner, 'xl')}</div>
    </div>

    <div class="hp-host-line" style="border-color:var(--hp-gold);color:var(--hp-gold-hot);">${pick([
      `"${winner} wins HAWAIIAN PUNCH!" ${host()} screams over the eruption. "SOMEBODY GET THE BOAT!"`,
      `${host()} grabs a megaphone. "${winner.toUpperCase()} TAKES THE MILLION! NOW RUN!"`,
      `"We have a WINNER!" ${host()} ducks a flaming boulder. "And we need EVAC!"`,
      `"${winner}! One million dollars! Assuming we survive the next thirty seconds!" ${host()} sprints for the beach.`,
    ])}</div>

    <div class="hp-flavor">${pick(TIKI_FLAVOR)}</div>
  `, ep, 'summit', 'eruption');
}

// ══════════════════════════════════════════════════════════════
// SCREEN 6: ENDINGS — Victory Celebration
// ══════════════════════════════════════════════════════════════
export function rpBuildHPEndings(ep) {
  const rd = ep.hpRaceData;
  if (!rd) return _hpShell('<p>No race data.</p>', ep, 'endings');

  const winner = rd.winner;
  const [rA, rB] = rd.finalists;
  const loser = winner === rA ? rB : rA;
  const winFac = faction(winner);
  const loseFac = faction(loser);
  const seasonName = seasonConfig?.name || 'the season';

  // Phase winners summary
  const phaseNames = ['Build the Dummy', 'Uphill Race', 'Lava River', 'Summit Showdown'];
  const phaseWinners = (rd.phaseResults || []).map((p, i) => ({
    name: p.name || phaseNames[i] || `Phase ${i + 1}`,
    winner: p.winner || '???',
  }));

  // Bond between finalists
  let bondVal = 0;
  try { bondVal = getBond(rA, rB); } catch (e) { /* no bond data */ }
  const bondLabel = bondVal >= 5 ? 'DEEP RESPECT' : bondVal >= 2 ? 'MUTUAL RESPECT' : bondVal >= 0 ? 'NEUTRAL' : bondVal >= -3 ? 'RIVALRY' : 'BITTER ENEMIES';
  const bondColor = bondVal >= 2 ? 'var(--hp-teal)' : bondVal >= 0 ? 'var(--hp-gold)' : 'var(--hp-magma)';
  const bondPct = Math.min(100, Math.max(0, (bondVal + 10) * 5));

  // Tiebreaker mention
  const tb = ep.hpTiebreaker;
  let tiebreakerHtml = '';
  if (tb) {
    tiebreakerHtml = `
    <div class="hp-card" data-fac="${faction(tb.loser)}" style="opacity:.7">
      <div class="hp-card-hdr">${_avatarBadge(tb.loser, 'sm')}<span class="hp-card-title">Eliminated in the Joust</span><span class="hp-badge hp-b-ko">3RD PLACE</span></div>
      <div class="hp-card-body"><strong>${tb.loser}</strong> was eliminated in the tiebreaker joust. ${pr(tb.loser).Sub} fought hard but fell to <strong>${tb.winner}</strong>.</div>
    </div>`;
  }

  // Winner confessional
  const winConfess = pick([
    `I can't believe it. I actually won. After everything — the blindsides, the betrayals, the VOLCANO — I won.`,
    `They said I couldn't do it. They said I wasn't built for this. Well, ${pr(winner).sub} just won a million dollars on top of a volcano. So.`,
    `This is surreal. I'm standing in lava smoke holding a million-dollar check. My mom is going to LOSE IT.`,
    `Every single day in this game, someone tried to take me out. And here I am. Last one standing. Champion of ${seasonName}.`,
  ]);

  // Loser confessional
  const loseConfess = pick([
    `Second place. I got so close I could taste the money. And then ${winner} threw that dummy and... yeah. It's over.`,
    `I'm proud of how far I got. Am I disappointed? Obviously. But ${winner} earned it. I can admit that.`,
    `The volcano erupted and I thought, "Well, at least I don't have to worry about taxes on a million dollars."`,
    `${winner} was the better racer today. Not the better player — the better RACER. I'll carry that distinction to my grave.`,
  ]);

  // Host outro
  const hostOutro = pick([
    `"That's a wrap on ${seasonName}!" ${host()} surveys the smoking crater. "We'll be back. Same drama. New idiots. <em>Bye!</em>"`,
    `${host()} turns to camera, hair singed. "Join us next time for more betrayal, romance, and property destruction. I'm ${host()}. Good NIGHT."`,
    `"${winner} takes home the million. The volcano takes home... everything else." ${host()} salutes. "See you next season."`,
    `"This has been HAWAIIAN PUNCH." ${host()} ducks another boulder. "And I... need a raise."`,
  ]);

  return _hpShell(`
    <div class="hp-section-head">
      <div class="hp-section-num">05</div>
      <div class="hp-section-title">The Ending</div>
      <div class="hp-section-meta">Champion crowned · ${seasonName}</div>
    </div>

    <!-- WINNER CARD -->
    <div class="hp-outcome win" style="margin-bottom:24px">
      <div class="hp-outcome-tag">★ CHAMPION ★</div>
      <div class="hp-outcome-title" style="font-size:56px">${winner.toUpperCase()}</div>
      <div class="hp-outcome-sub">Winner of ${seasonName}</div>
      <div style="margin-top:16px">${_avatarBadge(winner, 'xl')}</div>
      <div class="hp-money">
        <div class="hp-money-stack">$1,000,000</div>
        <div class="hp-money-sub">property of ${winner.toLowerCase()}</div>
      </div>
    </div>

    <!-- RACE SUMMARY -->
    <div class="hp-card" data-fac="host">
      <div class="hp-card-hdr">${_icon('volcano')}<span class="hp-card-title">Race Summary</span><span class="hp-badge hp-b-volcano">4 PHASES</span></div>
      <div class="hp-card-body">
        ${phaseWinners.map(pw => `<div style="display:flex;align-items:center;gap:8px;padding:4px 0;border-bottom:1px solid rgba(255,255,255,.04)">
          ${_avatarBadge(pw.winner, 'sm')}
          <span style="flex:1;font-size:12px">${pw.name}</span>
          <span style="font-family:'Press Start 2P',monospace;font-size:8px;color:${pw.winner === winner ? 'var(--hp-gold-hot)' : 'rgba(243,231,201,.5)'}">${pw.winner}</span>
        </div>`).join('')}
      </div>
    </div>

    <!-- FINALIST BOND METER -->
    <div class="hp-card" data-fac="host">
      <div class="hp-card-hdr">${_icon('heart')}<span class="hp-card-title">Finalist Bond</span><span class="hp-badge hp-b-end">${bondLabel}</span></div>
      <div class="hp-card-body">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px">
          ${_avatarBadge(rA, 'sm')}
          <div style="flex:1">
            <div class="hp-bar-track"><div class="hp-bar-fill ${bondVal >= 0 ? 'full' : 'low'}" style="width:${bondPct}%"></div></div>
          </div>
          ${_avatarBadge(rB, 'sm')}
        </div>
        <div style="text-align:center;font-size:11px;color:${bondColor};letter-spacing:2px">${bondLabel} (${bondVal >= 0 ? '+' : ''}${bondVal})</div>
      </div>
    </div>

    ${tiebreakerHtml}

    <!-- WINNER CONFESSIONAL -->
    <div class="hp-confess" data-fac="${winFac}">
      <div class="hp-confess-av">${_avatarBadge(winner, 'sm')}</div>
      <div class="hp-confess-name">${winner} <span class="hp-confess-tag"${winFac === 'hero' ? ' style="background:rgba(26,167,167,.2);border-color:rgba(26,167,167,.4);color:#3ad9d9"' : ''}>CHAMPION</span></div>
      <div class="hp-confess-text">${winConfess}</div>
    </div>

    <!-- LOSER CONFESSIONAL -->
    <div class="hp-confess" data-fac="${loseFac}" style="opacity:.8">
      <div class="hp-confess-av">${_avatarBadge(loser, 'sm')}</div>
      <div class="hp-confess-name">${loser} <span class="hp-confess-tag"${loseFac === 'hero' ? ' style="background:rgba(26,167,167,.2);border-color:rgba(26,167,167,.4);color:#3ad9d9"' : ''}>RUNNER-UP</span></div>
      <div class="hp-confess-text">${loseConfess}</div>
    </div>

    <!-- HOST OUTRO -->
    <div class="hp-host-line" style="border-color:var(--hp-gold);color:var(--hp-gold-hot);font-size:14px">${hostOutro}</div>

    <div class="hp-flavor" style="margin-top:24px;font-size:13px;color:rgba(255,90,31,.4)">${pick(TIKI_FLAVOR)}</div>
  `, ep, 'endings');
}
