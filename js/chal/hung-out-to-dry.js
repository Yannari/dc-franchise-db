// js/chal/hung-out-to-dry.js — "Hung Out to Dry" lie-detector handlebar hang (post-merge, individual immunity)
// DC "Carnival of Chaos". Contestants hang over a shark tank on a handlebar, three ropes tied to their
// harness, wearing polygraph helmets. They interrogate each other. Lie → the helmet catches it and cuts a
// rope (2 for a blatant/sarcastic lie). Tell the truth → keep every rope, but the honest answer LANDS
// socially (bonds swing, schemes get exposed, romances get outed). Lose your grip and you fall. Ropes at
// zero and you fall. Last soul hanging wins immunity.
import { gs, players, seasonConfig } from '../core.js';
import { pStats, pronouns, updateChalRecord, romanticCompat } from '../players.js';
import { addBond, getBond } from '../bonds.js';
import { _challengeRomanceSpark, _checkShowmanceChalMoment } from '../romance.js';

// ── HELPERS ──
function host() { return seasonConfig?.hostName || 'Chris'; }
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
function pickUniq(arr, used) {
  const fresh = arr.filter(x => !used.has(x));
  const chosen = (fresh.length ? fresh : arr)[Math.floor(Math.random() * (fresh.length || arr.length))];
  used.add(chosen); return chosen;
}
function noise(range = 2.5) { return (Math.random() - 0.5) * range; }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
function popDelta(name, delta) { if (!gs.popularity) gs.popularity = {}; gs.popularity[name] = (gs.popularity[name] || 0) + delta; }
function arch(name) { return players.find(p => p.name === name)?.archetype || 'floater'; }
function slugOf(name) { return players.find(p => p.name === name)?.slug || name.toLowerCase().replace(/\s+/g, '-'); }
function portrait(name, size = 38) {
  return `<img src="assets/avatars/${slugOf(name)}.png" alt="${name}" style="width:${size}px;height:${size}px;border-radius:5px;object-fit:contain;flex-shrink:0" onerror="this.style.display='none'">`;
}
const VILLAINY = ['villain', 'mastermind', 'schemer'];
const NICE = ['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat'];
function canScheme(name) {
  const a = arch(name);
  if (VILLAINY.includes(a)) return true;
  if (NICE.includes(a)) return false;
  const s = pStats(name);
  return s.strategic >= 6 && s.loyalty <= 4;
}

// ── GAME-STATE ACCESSORS (so questions reference REAL relationships, votes and romances) ──
function recentBoots(k = 3) { const e = gs.eliminated || []; return e.slice(-k).reverse(); }
function allyOf(name, alive) {
  const al = (gs.namedAlliances || []).find(a => a.active && a.members.includes(name) && a.members.some(m => m !== name && alive.includes(m)));
  if (al) {
    const m = al.members.filter(x => x !== name && alive.includes(x)).sort((a, b) => getBond(name, b) - getBond(name, a));
    if (m.length) return m[0];
  }
  const friends = alive.filter(m => m !== name && getBond(name, m) >= 3).sort((a, b) => getBond(name, b) - getBond(name, a));
  return friends[0] || null;
}
function romPartner(name, alive) {
  const sh = (gs.showmances || []).find(s => !s.broken && (s.players || []).includes(name));
  if (sh) { const o = sh.players.find(p => p !== name); if (o && alive.includes(o)) return o; }
  for (const s of (gs.romanticSparks || [])) {
    const ps = s.players || [s.a, s.b].filter(Boolean);
    if (ps.includes(name) && !s.broken) { const o = ps.find(p => p !== name); if (o && alive.includes(o)) return o; }
  }
  return null;
}
function rivalOf(name, alive) {
  const foes = alive.filter(m => m !== name && getBond(name, m) <= -2).sort((a, b) => getBond(name, a) - getBond(name, b));
  return foes[0] || null;
}
// who to name for an opinion jab: a real foe first, else the biggest strategic threat
function opinionTarget(name, alive) {
  const others = alive.filter(m => m !== name);
  if (!others.length) return null;
  const foes = others.filter(m => getBond(name, m) < 0).sort((a, b) => getBond(name, a) - getBond(name, b));
  if (foes.length) return foes[0];
  return [...others].sort((a, b) => pStats(b).strategic - pStats(a).strategic)[0];
}

// ── CONSEQUENCE HELPERS — a forced confession can reshape the game, not just a bond number ──
// Heat is "strong + short": it shapes THIS tribal, then fades in ~1 episode. (computeHeat reads
// gs._hungHeat / gs._hungBetrayHeat; episode.js expires them.)
function _epScope() { return (gs.episode || 0) + 3; }
// Direct target heat, EARNED BY SCOPE. A player already carrying scheme heat is "already hot" —
// we discount what they've got so we don't double-target a known schemer.
function _addHeat(name, want) {
  const already = gs._schemeHeat?.[name]?.amount || 0;
  const add = Math.max(0, want - already);
  if (add < 0.4) return 0; // already exposed enough — a fresh confession changes nothing
  if (!gs._hungHeat) gs._hungHeat = {};
  const prev = gs._hungHeat[name]?.amount || 0;
  gs._hungHeat[name] = { amount: Math.max(prev, add), expiresEp: _epScope() };
  return add;
}
// Targeted revenge heat: the betrayed ally hunts the betrayer at the vote.
function _betrayHeat(victimAlly, betrayer, amount) {
  if (!gs._hungBetrayHeat) gs._hungBetrayHeat = {};
  gs._hungBetrayHeat[victimAlly] = { target: betrayer, amount, expiresEp: _epScope() };
}
function _sharedAlliance(a, b) {
  return (gs.namedAlliances || []).find(al => al.active && al.members.includes(a) && al.members.includes(b));
}
// A 2-person pact snaps outright when one names the other as least-trusted; a bigger group is shaken.
function _fractureAlliance(al, betrayer, ally) {
  if (!al) return false;
  al.betrayals = al.betrayals || [];
  al.betrayals.push({ by: betrayer, target: ally, episode: (gs.episode || 0) + 1, reason: 'named least-trusted on a live lie detector' });
  if (al.members.length <= 2) { al.active = false; return true; }
  return false;
}

// ══════════════════════════════════════════════════════════════
// NARRATION POOLS
// ══════════════════════════════════════════════════════════════
const OPEN_TEXT = [
  (h) => `${h} gestures at a row of handlebars strung high over a churning shark tank. "Grab on. Three ropes each, one lie-detector helmet each. You ask the questions. Lie, and the helmet cuts a rope. Let go, you're shark bait. Last one hanging wins immunity."`,
  (h) => `A grinning ${h} snaps a polygraph helmet onto the nearest contestant. "The rules are cruel and simple. Hang on. Tell the truth or lie — the helmet knows the difference. Every lie costs you a rope. First to fall loses, last to hang wins immunity."`,
  (h) => `${h} pats a coil of rope over the water. "Welcome back to a fan favorite. You dangle, you interrogate each other, and the helmets keep everyone honest. Lie and lose a rope. Run out of rope or run out of grip — you swim with the sharks. Survive everyone else, win immunity."`,
];
const HANG_FLAVOR = [
  (n) => `${n} chalks up, grips the bar, and swings out over the water. No going back now.`,
  (n) => `The helmet clamps down on ${n}. A green light blinks to life above ${pronouns(n).posAdj} visor. "Calibrated," the tech says. "Don't lie."`,
  (n) => `${n} tests the ropes at ${pronouns(n).posAdj} waist, then locks both hands on the bar. Below, a fin cuts the surface.`,
  (n) => `${n} shakes out ${pronouns(n).posAdj} arms one last time and takes the bar. The platform drops away.`,
];
const FLASHBACK = [
  (n) => `${n} stares down at the water and, for a second, ${pronouns(n).sub === 'they' ? 'they freeze' : pronouns(n).sub + ' freezes'} — a bad memory of the last time a challenge went sideways. A neighbor knocks ${pronouns(n).posAdj} shoulder. "Hey. Focus." And ${pronouns(n).sub === 'they' ? 'they do' : pronouns(n).sub + ' does'}.`,
  (n) => `${n} grits ${pronouns(n).posAdj} teeth. "Not losing this one." The needle on the helmet reads it as truth.`,
];
const ROUND_BANNER = [
  { label: 'Warm-Up', text: `The helmets hum online. ${'{h}'} rings the bell. "Ask away." The first questions are gentle — reputations, opinions, who's the weak link. Nobody's arms are burning yet.` },
  { label: 'The Knife', text: `Grips are tightening. ${'{h}'} leans in. "Let's get to the good stuff." Now the questions cut — votes, alliances, who's really loyal to who. Every honest answer detonates something.` },
  { label: 'Final Interrogation', text: `Only a handful still hang, arms shaking over the sharks. ${'{h}'} drops ${'{his}'} voice. "Last chance. Make them squirm." The questions turn personal — feelings, endgame, the things nobody wants on tape.` },
];

// Helmet verdict tails — appended after the answer sentence.
const HELMET_CATCH = [
  (n, rl, eg) => `The helmet's needle SLAMS into the red${eg ? ' — sarcasm counts' : ''}. LIE DETECTED. ${rl === 2 ? 'Two ropes whip' : 'A rope whips'} loose from ${pronouns(n).posAdj} harness.`,
  (n, rl, eg) => `A shrill alarm — the polygraph flatlines to crimson.${eg ? ' The helmet doesn\'t buy the sarcasm for a second.' : ''} ${rl === 2 ? 'Two of ' + pronouns(n).posAdj + ' ropes drop' : 'One of ' + pronouns(n).posAdj + ' ropes drops'} away toward the water.`,
  (n, rl, eg) => `Busted. The dials spike scarlet and a blade snicks through ${rl === 2 ? 'two ropes' : 'a rope'} at ${n}'s waist.${eg ? ' "That was a WHOPPER," ' + host() + ' laughs.' : ''}`,
];
const HELMET_PASS = [
  (n) => `The needle never twitches. GREEN. Every rope holds — but the words are already out there.`,
  (n) => `The helmet reads it clean. Truth. ${n} keeps all ${pronouns(n).posAdj} ropes... and makes an enemy or two.`,
  (n) => `A steady green light. No lie here — just damage.`,
  (n) => `The polygraph stays calm. Honest. The ropes are safe; the fallout is not.`,
];
// A truthful answer costs the ASKER a rope (they asked, they pay) — the source-accurate twist.
const TRUTH_COST = [
  (asker, pr) => `The needle glows GREEN — honest. And honesty has a price: a rope drops from <b>${asker}</b>'s own harness for asking it.`,
  (asker, pr) => `Green light. True. But <b>${asker}</b> asked, and a straight answer costs the ASKER — one of ${pr.posAdj} ropes, cut loose.`,
  (asker, pr) => `The helmet stays calm. No lie. <b>${asker}</b> grimaces as a rope falls away — that's the toll for a truthful answer.`,
  (asker, pr) => `Clean read. Honest. The bar buzzes — and <b>${asker}</b> loses a rope for pulling the truth out of ${pr.obj}.`,
];
const GRIP_FALL = [
  (n) => `${n}'s fingers finally give out. A yell, a splash, and the safety divers move in. Out of the game.`,
  (n) => `${n}'s arms are jelly. ${pronouns(n).Sub} ${pronouns(n).sub === 'they' ? 'hang' : 'hangs'} on by the fingertips... then ${pronouns(n).sub === 'they' ? 'drop' : 'drops'} into the tank.`,
  (n) => `The bar slips out of ${n}'s cramping hands. Down ${pronouns(n).sub === 'they' ? 'they go' : pronouns(n).sub + ' goes'}, into the water.`,
  (n) => `${n} tries to re-grip, misses, and plunges into the shark tank with a shriek.`,
];
const ROPE_FALL = [
  (n) => `That was ${n}'s last rope. With nothing left holding ${pronouns(n).obj}, ${pronouns(n).sub === 'they' ? 'they slide' : pronouns(n).sub + ' slides'} off the bar and into the water. Eliminated.`,
  (n) => `The final rope parts. ${n} dangles by two hands for one desperate second — then the sharks get a visitor. Out.`,
  (n) => `Ropes gone, grip gone. ${n} lets the bar go and drops. Done.`,
];
const LETGO = [
  (n, tgt) => `Having said ${pronouns(n).posAdj} piece, ${n} looks around, mutters "I'm done here," and simply lets go — dropping into the water on ${pronouns(n).posAdj} own terms.`,
  (n, tgt) => `${n} got what ${pronouns(n).sub === 'they' ? 'they' : pronouns(n).sub} needed off ${pronouns(n).posAdj} chest. With a tired smile ${pronouns(n).sub === 'they' ? 'they release' : pronouns(n).sub + ' releases'} the bar and falls.`,
];
const WIN_TEXT = [
  (n) => `The last rival hits the water. ${n} hangs alone over the tank, arms trembling, and ${host()} rings the bell. "${n} — you can't be voted out tonight. IMMUNITY." ${pronouns(n).Sub} ${pronouns(n).sub === 'they' ? 'drop' : 'drops'} into a rescue raft, spent and safe.`,
  (n) => `Everyone else is soaked and eliminated. ${n} is the only soul still clinging to the bar. "That's it! ${n} wins immunity!" ${host()} bellows. ${pronouns(n).Sub} ${pronouns(n).sub === 'they' ? 'let' : 'lets'} go at last, grinning through the exhaustion.`,
  (n) => `One hand, then a bell. ${n} outlasted the whole cast over a tank of sharks. IMMUNITY — and a straight shot past tonight's vote.`,
];

// ── PHYSICAL STRAIN LAYER — makes it FEEL like an endurance hang, not an interview ──
const STRAIN = [
  (n) => `${n}'s shoulders are screaming — a slow readjust of a slipping grip, one white-knuckled hand at a time.`,
  (n) => `Sweat sheets down ${n}'s arms and drips off ${pronouns(n).posAdj} elbows into the tank below.`,
  (n) => `${n}'s knuckles have gone bone-white on the bar. Every second up here is a war with gravity.`,
  (n) => `${n}'s forearms are shaking now, the burn setting in deep. ${pronouns(n).Sub} just ${pronouns(n).sub === 'they' ? 'grit' : 'grits'} ${pronouns(n).posAdj} teeth.`,
  (n) => `A tremor runs the length of ${n}'s arms; the bar bites into ${pronouns(n).posAdj} raw palms.`,
  (n) => `${n} swings ${pronouns(n).posAdj} legs slow, trying to pump blood back into two dead arms.`,
  (n) => `${n}'s grip creaks. The gallery goes quiet, bracing for a splash that doesn't come — not yet.`,
  (n) => `${n} blows out a ragged breath, chalk dust and sweat raining down toward the dark water.`,
  (n) => `The bar's slick with sweat under ${n}. ${pronouns(n).Sub} ${pronouns(n).sub === 'they' ? 're-grip' : 're-grips'} and hangs on out of pure spite.`,
  (n) => `${n}'s whole body trembles, toes curling over nothing but open air and hungry water.`,
];
const NEARMISS = [
  (n) => `${n}'s hand SLIPS clean off the bar — a scream from the crowd — but ${pronouns(n).sub === 'they' ? 'they slap' : pronouns(n).sub + ' slaps'} it back on a heartbeat before the drop. Still hanging.`,
  (n) => `${n} loses the swing and dangles one-handed over the fins... then hauls back up with a roar. Barely.`,
  (n) => `A rope snags and yanks at ${n}'s waist; for a sickening second the grip's gone — then it holds.`,
  (n) => `${n} drops a full six inches with a yelp before catching the bar again. The sharks circle, disappointed.`,
  (n) => `${n}'s sweaty palm gives — a gasp — and ${pronouns(n).sub === 'they' ? 'they catch' : pronouns(n).sub + ' catches'} the bar with two fingers at the last instant.`,
  (n) => `${n} nearly gasses out, arms buckling, then finds one more ounce of fight and clamps back down.`,
];
const HOST_TAUNT = [
  (h) => `${h} strolls beneath the dangling bodies, hands in pockets. "Arms getting heavy? The sharks are very patient. I'm not."`,
  (h) => `${h} taps the water with a boot; a fin rolls toward it. "Just let go. It's easier. They're hungry down there."`,
  (h) => `"Anyone want to quit and keep their dignity?" ${h} calls up. "No? Suit yourselves."`,
  (h) => `${h} checks a watch. "We can do this all day. Well — I can. YOU look cooked."`,
  (h) => `${h} grins up at the row of shaking arms. "Somebody's about to feed a shark. I love this challenge."`,
  (h) => `"Remember," ${h} shouts up, "lie and you lose a rope. Tell the truth and you lose a friend. Choose fast!"`,
];
// ── DRAMA: the ACCUSED answers back, IN THEIR OWN VOICE. The reaction style is chosen by the
// target's personality (archetype + temperament/boldness): a hothead EXPLODES, a schemer goes
// COLD, a hero STANDS FIRM, a shy player is STUNG (never explodes), a social type is WOUNDED.
// Two combative players can escalate into a real fight (COUNTER + FINAL_JAB). (t = who the truth
// was about, a = who said it.) Shared usedReact keeps every line unique in a game.
const REACTIONS = {
  clapback: { // named as worst / fake / a threat / next boot
    explosive: [
      (t, a, pr) => `${t} ERUPTS. "Excuse me?! Say that to my face again, ${a} — I DARE you!" The whole bar rattles.`,
      (t, a, pr) => `"Oh, it's ON." ${t} kicks toward ${a}. "You just made this personal. Big, BIG mistake."`,
      (t, a, pr) => `${t} loses it. "You've got some NERVE! I'm coming for you FIRST, ${a}, count on it!"`,
      (t, a, pr) => `${t} roars, "Big words! Let's see you back them up when I write your name TONIGHT!"`,
      (t, a, pr) => `${t} thrashes, nearly slipping. "Say it AGAIN! I've got two dead arms and a LOT to say to you, ${a}!"`,
      (t, a, pr) => `"WOW. Okay. OKAY." ${t} is shouting now. "You want war? You've got one!"`,
    ],
    cold: [
      (t, a, pr) => `${t} doesn't raise ${pr.posAdj} voice. "Interesting. You just told me exactly how to beat you, ${a}."`,
      (t, a, pr) => `${t} smiles, slow and mirthless. "Noted. I'll enjoy this more than I should."`,
      (t, a, pr) => `"Careful," ${t} murmurs. "People who say that to me tend to go home next. Ask around."`,
      (t, a, pr) => `${t} just nods once. "Okay. Now I know. And I don't forget, ${a}."`,
    ],
    composed: [
      (t, a, pr) => `${t} keeps ${pr.posAdj} cool. "That's your opinion, and that's fine. I'll let my game answer."`,
      (t, a, pr) => `${t} exhales, steady. "Disagree — but I respect the honesty. Doesn't change how I play, ${a}."`,
      (t, a, pr) => `${t} meets ${a}'s eyes, calm. "Noted. No hard feelings. But I won't forget you said it."`,
    ],
    timid: [
      (t, a, pr) => `${t} flinches and looks away. "...Oh. Okay. I didn't— okay." ${pr.Sub} ${pr.sub === 'they' ? 'go' : 'goes'} quiet.`,
      (t, a, pr) => `${t}'s voice barely carries. "That's... kind of harsh. But okay. If that's how you see me."`,
      (t, a, pr) => `${t} shrinks on the bar, stung, and doesn't fire back. The hurt just sits there.`,
    ],
    wounded: [
      (t, a, pr) => `${t}'s face crumples. "Wow. From YOU? That one actually hurt, ${a}."`,
      (t, a, pr) => `"After everything?" ${t}'s eyes shine. "I thought we were better than that."`,
      (t, a, pr) => `${t} presses ${pr.posAdj} lips tight, blinking hard. "...Okay. Noted." The sting is all over ${pr.posAdj} face.`,
    ],
  },
  betrayedAlly: { // an ally got outed / named least-trusted / thrown under the bus by a partner
    explosive: [
      (t, a, pr) => `${t} EXPLODES. "You SOLD me out?! On live TV?! We had a DEAL, ${a}!"`,
      (t, a, pr) => `"ARE YOU KIDDING ME." ${t} thrashes on the bar. "You're DEAD to me. Dead, ${a}!"`,
      (t, a, pr) => `${t} roars, "I gave you EVERYTHING and you torch me for a challenge?! UNBELIEVABLE!"`,
      (t, a, pr) => `"YOU?! Of all people, YOU?!" ${t} is beside ${pr.ref} with rage. "I'll bury you for this, ${a}!"`,
    ],
    cold: [
      (t, a, pr) => `${t} goes arctic. "Fine. You get nothing from me ever again. We're done, ${a}."`,
      (t, a, pr) => `"Duly noted." ${t}'s stare could freeze the tank. "Enjoy the target I'm about to put on you."`,
    ],
    composed: [
      (t, a, pr) => `${t} takes it hard but level. "That stung, ${a}. I trusted you. I'll remember this."`,
      (t, a, pr) => `${t} nods slowly, jaw tight. "Okay. I hear you. That changes everything between us."`,
    ],
    timid: [
      (t, a, pr) => `${t}'s face falls. "...Oh. I thought we were... never mind." ${pr.Sub} ${pr.sub === 'they' ? 'go' : 'goes'} silent.`,
      (t, a, pr) => `${t} can't even fire back — just looks away, quietly gutted.`,
    ],
    wounded: [
      (t, a, pr) => `${t}'s voice breaks. "You were my PERSON, ${a}. How could you do that?"`,
      (t, a, pr) => `"I would've gone to the end with you." ${t} blinks back tears. "And you did THIS."`,
    ],
  },
  warm: [ // a real compliment / "you're a real friend" — the target is touched and gives it right back
    (t, a, pr) => `${t}'s face softens. "...Yeah. You too, ${a}. Game or not, we're solid."`,
    (t, a, pr) => `${t} grins through the burn. "Careful, ${a} — people'll think we're actually friends."`,
    (t, a, pr) => `${t} gets a little choked up. "Didn't expect that. Means a lot. Right back at you, ${a}."`,
    (t, a, pr) => `"Don't make me cry over a shark tank," ${t} laughs. "But same. I've got you."`,
    (t, a, pr) => `${t} knocks a fist toward ${a} across the gap. "Ride or die. Even up here."`,
  ],
  romance: [ // partner responds to a feelings confession
    (t, a, pr) => `${t} freezes, then breaks into a helpless smile. "...I feel it too, ${a}. Have for a while."`,
    (t, a, pr) => `${t} goes scarlet. "You couldn't have said that on DRY LAND?!" — but ${pr.sub === 'they' ? "they're" : pr.sub + "'s"} beaming.`,
    (t, a, pr) => `${t} nearly lets go of the bar. "${a}. Oh my god. Yes. Obviously, yes."`,
    (t, a, pr) => `${t} can't stop grinning. "Ask me again on dry land and I'll say it back properly."`,
    (t, a, pr) => `${t} laughs, flustered. "Well, NOW everyone knows. ...Honestly? I'm glad they do."`,
  ],
  // COVER BLOWN — an alliance/scheme just got aired. The ally isn't BETRAYED (nobody stabbed them),
  // they're EXPOSED alongside — annoyed, resigned, or scrambling to distance themselves.
  exposed: [
    (t, a, pr) => `${t} rolls ${pr.posAdj} eyes. "Cool. Now the whole table knows. Thanks a lot, ${a}."`,
    (t, a, pr) => `${t} shoots ${a} a look. "Great. Now we've BOTH got targets on our backs."`,
    (t, a, pr) => `${t} sighs, resigned. "Well. No point hiding it now. ...Yeah, it's true."`,
    (t, a, pr) => `${t} bristles. "Did you HAVE to say it out loud, ${a}?" — but ${pr.sub} can't really blame the helmet.`,
    (t, a, pr) => `${t} mutters, "There goes our cover." The whole cast is eyeing the two of them now.`,
    (t, a, pr) => `${t} distances fast. "That was way more ${a}'s move than mine, for the record." Self-preservation.`,
    (t, a, pr) => `${t} just shrugs. "Fine. We're tight. Everybody kind of knew already anyway."`,
  ],
};
// The accuser fires BACK — only when both players are combative — and it can boil into a real fight.
const COUNTER = {
  explosive: [
    (a, t, pr) => `${a} isn't backing down. "You HEARD me! Come at me then — DO it!" Now they're both screaming over the sharks.`,
    (a, t, pr) => `"Oh, I'll say it TWICE!" ${a} fires right back. It's a full-blown shouting match now.`,
    (a, t, pr) => `${a} snaps, "BRING it! You've been coasting all game and everyone KNOWS it, ${t}!"`,
    (a, t, pr) => `"Cry about it!" ${a} bellows back. The other hangers lean away from the crossfire.`,
    (a, t, pr) => `${a} refuses to quit. "You're mad because it's TRUE, ${t}! Everyone here sees it!"`,
  ],
  cold: [
    (a, t, pr) => `${a} doesn't flinch. "Threaten me all you want. I meant every word." Ice meets ice.`,
    (a, t, pr) => `"Good," ${a} says softly. "Be angry. Angry people make mistakes." The tension goes razor-thin.`,
    (a, t, pr) => `${a} just smiles. "There it is. Now everyone sees the real ${t}." Chess, not checkers.`,
    (a, t, pr) => `${a} lets ${t} rage, then says quietly, "Done? Good. It's still true." Devastating.`,
  ],
};
const FINAL_JAB = [
  (t, a, pr) => `"See you at the vote, ${a}." ${t} gets the last word, and the whole bar goes dead silent.`,
  (t, a, pr) => `"We settle this on dry land," ${t} spits. Neither one blinks. The rivalry just went nuclear.`,
  (t, a, pr) => `${t} laughs, humorless. "Best. Challenge. Ever." Nobody's laughing with ${pr.obj}.`,
];

// ══════════════════════════════════════════════════════════════
// QUESTION SYSTEM — every question references REAL game state and carries a real consequence.
// buildQuestion returns { kind, q, stakes, truthText, lieClaim, applyTruth, applyLie }.
// stakes 0..1 = how damaging the HONEST answer is (drives the lie decision).
// ══════════════════════════════════════════════════════════════
const Q_WORST_LEADER = ["Who's the worst leader left in this game?", "If you HAD to follow someone here, who'd sink the ship fastest?", "Who's been making the dumbest moves lately?"];
const Q_LEAST = ["Who pulls the least weight around camp?", "Who's been carried this whole time?", "Who does the least and takes the most credit?"];
const Q_OVERRATED = ["Who here is the most overrated?", "Who believes their own hype the hardest?", "Who's coasting on a reputation they haven't earned?"];
const Q_FAKEST = ["Who's the most two-faced person still hanging here?", "Who smiles to your face and stabs you the second you turn around?", "Who here can you trust the least?"];
const Q_VOTE = (boot) => [`What was your REAL role in voting ${boot} out?`, `Be honest — did you have a hand in sending ${boot} home?`, `Whose idea was the ${boot} blindside, really?`];
const Q_ALLY = (a) => [`Are you and ${a} secretly working together?`, `Is there a final-two deal between you and ${a}?`, `Come clean — is ${a} your number one?`];
const Q_TRUSTLEAST = ["Who in your OWN alliance do you trust the least?", "If your alliance cracked tomorrow, who breaks first?", "Who's the weak link in your own group?"];
const Q_FLIP = ["Is there anyone here you'd flip on tomorrow if it helped you?", "Who would you throw under the bus first?", "Who's the next name YOU want written down?"];
const Q_FEELINGS = ["Do you have romantic feelings for anyone still in this game?", "Is there something going on between you and someone here?", "Be honest — are you catching feelings for anybody?"];
const Q_NEVERSIT = ["Who would you NEVER take with you to the end?", "Who's the one person you refuse to sit next to at the final?", "Who beats you if they're in the finale with you?"];
const Q_REALFRIEND = (a) => [`Is ${a} a real friend — or just a number to you?`, `When this is over, does your bond with ${a} survive? Or is it all game?`, `${a}: ally of convenience, or the real thing?`];
const Q_REGRET = ["What's your biggest regret in this game so far?", "If you could take back one move, what would it be?", "What's the thing you'd do differently if you started over?"];
const Q_COMEDIC = [
  "What's the most embarrassing thing you've ever done to impress someone you liked?",
  "What's a secret about yourself the whole cast would gasp at?",
  "What's the pettiest reason you've ever ended a friendship?",
  "What's the biggest lie you've told to get out of plans?",
  "What's something you pretend to be good at but absolutely are not?",
];

function _camp(ep, campKey, ev) {
  if (!ep.campEvents) ep.campEvents = {};
  if (!ep.campEvents[campKey]) ep.campEvents[campKey] = { pre: [], post: [] };
  ep.campEvents[campKey].post.push(ev);
}

// Build a resolved question for (asker → answerer) at round tier ri (0/1/2).
function buildQuestion(asker, answerer, ri, alive, ep, campKey) {
  const pr = pronouns(answerer);
  // candidate kinds by tier, preferring ones with a real game hook
  const cand = [];
  const push = (k) => cand.push(k);

  if (ri === 0) { ['worstLeader', 'least', 'overrated', 'fakest', 'comedic'].forEach(push); }
  else if (ri === 1) { ['vote', 'ally', 'trustLeast', 'flip', 'fakest'].forEach(push); }
  else { ['feelings', 'neverSit', 'realFriend', 'flip', 'regret', 'comedic'].forEach(push); }

  // In the final round, if the answerer actually has a partner hanging beside them, the
  // "feelings" question is the one the show WANTS — bias hard toward it so the romance surfaces.
  if (ri === 2 && romPartner(answerer, alive) && Math.random() < 0.7) {
    const rf = _resolve('feelings', asker, answerer, ri, alive, ep, campKey);
    if (rf) return rf;
  }

  // try candidates in a shuffled order until one resolves
  const order = cand.sort(() => Math.random() - 0.5);
  for (const kind of order) {
    const r = _resolve(kind, asker, answerer, ri, alive, ep, campKey);
    if (r) return r;
  }
  // guaranteed fallback: comedic
  return _resolve('comedic', asker, answerer, ri, alive, ep, campKey, true);
}

function _resolve(kind, asker, answerer, ri, alive, ep, campKey, force) {
  const pr = pronouns(answerer);
  const nm = answerer;

  // ── OPINION JABS (name a rival/threat) ──
  if (kind === 'worstLeader' || kind === 'least' || kind === 'overrated' || kind === 'fakest') {
    const tgt = opinionTarget(answerer, alive);
    if (!tgt) return null;
    const harsh = kind === 'fakest';
    const qpool = kind === 'worstLeader' ? Q_WORST_LEADER : kind === 'least' ? Q_LEAST : kind === 'overrated' ? Q_OVERRATED : Q_FAKEST;
    return {
      kind, q: pick(qpool), stakes: harsh ? 0.4 : 0.3, target: tgt,
      truthText: pick([
        `${nm} grimaces, then says it: "...${tgt}." No dressing it up.`,
        `${nm} blows out a breath. "Fine. ${tgt}. That's the honest answer."`,
        `${nm} doesn't sugarcoat it: "${tgt}. Easy call."`,
        `${nm} hesitates, then names ${pr.obj === 'them' ? 'a name' : 'one'}: "${tgt}."`,
      ]),
      lieClaim: pick([
        `${nm} tries to dodge — names some harmless nobody instead.`,
        `${nm} throws out a safe, meaningless name to protect ${pr.posAdj} real opinion.`,
        `${nm} forces a shrug. "Honestly? Nobody. We're all solid." A total cop-out.`,
      ]),
      applyTruth: () => {
        addBond(answerer, tgt, harsh ? -2 : -1.3); addBond(tgt, answerer, harsh ? -1.6 : -1);
        popDelta(tgt, -0.2); popDelta(answerer, 0.1);
      },
      applyLie: () => { popDelta(answerer, -0.1); },
    };
  }

  // ── VOTE HISTORY (expose a scheme) ──
  if (kind === 'vote') {
    const boot = recentBoots(1)[0];
    if (!boot) return null;
    const involved = canScheme(answerer) || pStats(answerer).strategic >= 6;
    const allies = alive.filter(m => m !== answerer && getBond(answerer, m) >= 3);
    return {
      kind, q: pick(Q_VOTE(boot)), stakes: involved ? 0.68 : 0.35, target: boot,
      truthText: involved
        ? `${nm} exhales. "Fine. I helped steer that vote. I fed the plan and I counted the numbers on ${boot}." The others go very quiet.`
        : `${nm} shrugs. "Honestly? I just followed the group on ${boot}. That's the truth."`,
      lieClaim: `${nm} plays innocent — "I had nothing to do with ${boot} going home."`,
      applyTruth: () => {
        if (involved) {
          popDelta(answerer, 0.2); // fans respect the honesty
          allies.forEach(a => addBond(answerer, a, -1.2)); // partners hate being exposed
          // CUSTOM: admitting you ARCHITECTED a real multi-person vote earns a target. Scope =
          // co-conspirators exposed. A lone follower (!involved) never reaches here → no heat,
          // exactly your rule: "I just followed the group" shouldn't paint a target.
          const scope = allies.length;
          const heatAdded = scope >= 1 ? _addHeat(answerer, clamp(1.2 + 0.5 * scope, 1.2, 2.4)) : 0;
          if (allies.length) _camp(ep, campKey, {
            icon: '🎙️', badgeText: heatAdded ? 'EXPOSED — TARGET' : 'EXPOSED', badgeClass: 'bad', players: [answerer, ...allies.slice(0, 2)],
            text: `Wired to a lie detector, ${answerer} admitted running the ${boot} vote — burning ${allies.slice(0, 2).join(' and ')}, who never wanted it public.${heatAdded ? ` The whole cast is gunning for ${answerer} now.` : ''}`,
          });
        } else { popDelta(answerer, 0.05); }
      },
      applyLie: () => { popDelta(answerer, -0.15); },
    };
  }

  // ── ALLIANCE (out a real partnership) ──
  if (kind === 'ally') {
    const a = allyOf(answerer, alive);
    if (!a) return null;
    // "strong" = an actual named alliance together, or a very tight bond (a real final deal).
    // A loose friendship gets outed but doesn't earn heat — scope rule again.
    const strong = !!_sharedAlliance(answerer, a) || getBond(answerer, a) >= 5;
    return {
      kind, q: pick(Q_ALLY(a)), stakes: 0.6, target: a,
      truthText: `${nm} can't beat the machine. "Yeah. Me and ${a}... we've been tight for a while." The whole cast files that away.`,
      lieClaim: `${nm} scoffs — "${a}? We're barely even friends."`,
      applyTruth: () => {
        addBond(answerer, a, -1); popDelta(answerer, -0.1); popDelta(a, -0.1);
        let paired = false;
        if (strong) { _addHeat(answerer, 1.5); _addHeat(a, 1.5); paired = true; } // the table wants the pair split
        _camp(ep, campKey, {
          icon: '🤝', badgeText: paired ? 'PAIR OUTED — SPLIT UP' : 'ALLIANCE OUTED', badgeClass: 'warn', players: [answerer, a],
          text: paired
            ? `The helmet forced ${answerer} to confirm a tight pact with ${a}. Now everyone knows they're a duo — and the others will try to break them apart at the vote.`
            : `The helmet forced ${answerer} to confirm working with ${a}. Their cover is blown — the cast sees them as a pair now.`,
        });
      },
      applyLie: () => { popDelta(answerer, -0.1); },
    };
  }

  // ── TRUST LEAST (betray an ally) ──
  if (kind === 'trustLeast') {
    const a = allyOf(answerer, alive);
    if (!a) return null;
    return {
      kind, q: pick(Q_TRUSTLEAST), stakes: 0.7, target: a,
      truthText: pick([
        `${nm} winces. "...${a}. If it came down to it, ${a} would cut me loose. So I don't fully trust ${pronouns(a).obj}." ${a}'s face falls.`,
        `${nm} can't lie to the helmet. "${a}. I love ${pronouns(a).obj}, but ${a}'s the one I'd watch." ${a} looks gutted.`,
        `"${a}," ${nm} admits quietly. "In my own group, ${a} is the loose thread." ${a} hears it and goes cold.`,
      ]),
      lieClaim: pick([
        `${nm} lies through ${pr.posAdj} teeth — "I trust everyone in my group completely."`,
        `${nm} covers — "My alliance is rock solid, all of us." The needle knows better.`,
      ]),
      applyTruth: () => {
        addBond(answerer, a, -2); addBond(a, answerer, -2.4); popDelta(a, -0.1);
        // CUSTOM: naming your own closest ally as least-trusted, to their face, is a real break.
        // The pact fractures (a 2-person alliance snaps outright) and ${a} now hunts ${answerer}.
        const al = _sharedAlliance(answerer, a);
        const snapped = _fractureAlliance(al, answerer, a);
        _betrayHeat(a, answerer, 1.6);
        _camp(ep, campKey, {
          icon: '💔', badgeText: snapped ? 'ALLIANCE SHATTERED' : 'BETRAYAL', badgeClass: 'bad', players: [answerer, a],
          text: snapped
            ? `Forced to be honest, ${answerer} named ${a} as the ally they trust least — to ${a}'s face. Their pact is DONE, and ${a} wants ${answerer} gone.`
            : `Forced to be honest, ${answerer} named ${a} as the ally they trust least — to ${a}'s face. ${a} won't forget it, and is gunning for ${answerer} now.`,
        });
      },
      applyLie: () => { popDelta(answerer, -0.1); },
    };
  }

  // ── FLIP / NEXT TARGET ──
  if (kind === 'flip') {
    const tgt = rivalOf(answerer, alive) || opinionTarget(answerer, alive);
    if (!tgt) return null;
    return {
      kind, q: pick(Q_FLIP), stakes: 0.6, target: tgt,
      truthText: pick([
        `${nm} nods slowly. "If I'm being honest — ${tgt}. ${tgt}'s the next name I want gone." ${tgt} stares daggers.`,
        `${nm} meets ${tgt}'s eyes. "You want the truth? You. I'd flip on you tomorrow." The tank gets very quiet.`,
        `"${tgt}," ${nm} admits. "The second it helps me, ${tgt} is the one I cut loose." ${tgt} doesn't blink.`,
        `${nm} exhales. "There's one name I've got circled. ${tgt}." No taking that back.`,
      ]),
      lieClaim: pick([
        `${nm} smiles too wide — "Flip? Me? Never. I'm loyal to the end."`,
        `${nm} swears up and down there's nobody — "I don't have a target." The needle disagrees.`,
      ]),
      applyTruth: () => { addBond(answerer, tgt, -1.8); addBond(tgt, answerer, -1.5); popDelta(answerer, -0.1); },
      applyLie: () => { popDelta(answerer, -0.1); },
    };
  }

  // ── ROMANCE (out or protect real feelings) ──
  if (kind === 'feelings') {
    const p = romPartner(answerer, alive);
    if (p && romanticCompat(answerer, p)) {
      return {
        kind, q: pick(Q_FEELINGS), stakes: 0.72, target: p,
        truthText: `${nm} goes red under the helmet. "...Yeah. ${p}. I do." The needle stays green. Somewhere, ${p} hears every word.`,
        lieClaim: `${nm} shakes ${pr.posAdj} head fast — "No. Nobody. I'm here to play the game."`,
        applyTruth: () => {
          popDelta(answerer, 0.3); popDelta(p, 0.2);
          // CUSTOM: going public STRENGTHENS the showmance (now official — they'll protect each
          // other) but also flags a power-couple the others want split. Mild heat (< a real scheme).
          // Guard so a couple confessing in BOTH directions only pays off the big moment once.
          const sh = (gs.showmances || []).find(s => !s.broken && (s.players || []).includes(answerer) && (s.players || []).includes(p));
          if (sh && sh.public) { addBond(answerer, p, 0.5); return; } // already out — just a warm nod
          addBond(answerer, p, 3);
          if (sh) sh.public = true;
          _addHeat(answerer, 1.0); _addHeat(p, 1.0);
          _camp(ep, campKey, {
            icon: '💘', badgeText: 'POWER COUPLE', badgeClass: 'good', players: [answerer, p],
            text: `Over a shark tank, ${answerer} confessed real feelings for ${p} — you can't beat the helmet. They're official now... which also makes them a target the others will want to split up.`,
          });
        },
        applyLie: () => { popDelta(answerer, -0.05); if (p) addBond(answerer, p, -0.5); }, // denying stings the partner a little
      };
    }
    // no romance → they can answer "no" honestly, low stakes
    return {
      kind, q: pick(Q_FEELINGS), stakes: 0.12, target: null,
      truthText: `${nm} laughs. "Honestly? No. I'm all business out here." Green light — the truth.`,
      lieClaim: `${nm} invents a crush to seem interesting — the helmet is not fooled.`,
      applyTruth: () => { popDelta(answerer, 0.05); },
      applyLie: () => { popDelta(answerer, -0.05); },
    };
  }

  // ── NEVER SIT / endgame threat ──
  if (kind === 'neverSit') {
    const tgt = alive.filter(m => m !== answerer).sort((a, b) => pStats(b).social + pStats(b).strategic - pStats(a).social - pStats(a).strategic)[0];
    if (!tgt) return null;
    return {
      kind, q: pick(Q_NEVERSIT), stakes: 0.6, target: tgt,
      truthText: pick([
        `${nm} doesn't hesitate. "${tgt}. No way I sit next to ${pronouns(tgt).obj} at the end — ${tgt} wins that vote." ${tgt} clocks it.`,
        `"${tgt}," ${nm} says flatly. "Anyone but ${tgt} in the finale. I'm not handing over the money." ${tgt} files it away.`,
        `${nm} shakes ${pr.posAdj} head. "${tgt}. If ${tgt}'s next to me at the end, I lose. So — never." ${tgt} hears every word.`,
      ]),
      lieClaim: pick([
        `${nm} deflects — "I'd sit next to anyone, I back myself." The needle disagrees.`,
        `${nm} plays it cool — "No one scares me at the end." The helmet says otherwise.`,
      ]),
      applyTruth: () => { addBond(answerer, tgt, -2); addBond(tgt, answerer, -1.4); popDelta(tgt, 0.1); },
      applyLie: () => { popDelta(answerer, -0.1); },
    };
  }

  // ── REAL FRIEND (branches on the ACTUAL bond) ──
  if (kind === 'realFriend') {
    const a = allyOf(answerer, alive);
    if (!a) return null;
    const genuine = getBond(answerer, a) >= 4;
    return {
      kind, q: pick(Q_REALFRIEND(a)), stakes: genuine ? 0.25 : 0.62, target: a,
      truthText: genuine
        ? `${nm} softens. "${a}? That one's real. Game or no game, ${a}'s my friend." The needle glows green and ${a} smiles.`
        : `${nm} hesitates, then tells the truth: "...A number. ${a}'s a number to me." ${a} hears it, and something closes off.`,
      lieClaim: genuine
        ? `${nm} downplays it — "Eh, ${a}'s just a number." But the helmet knows ${pr.sub} ${pr.sub === 'they' ? 'care' : 'cares'}.`
        : `${nm} gushes about how ${a} is family — the needle buries into the red.`,
      applyTruth: () => {
        if (genuine) { addBond(answerer, a, 2); popDelta(answerer, 0.2); popDelta(a, 0.2); }
        else { addBond(answerer, a, -2); addBond(a, answerer, -2); popDelta(a, -0.1); }
      },
      applyLie: () => { popDelta(answerer, -0.1); },
    };
  }

  // ── REGRET (vulnerable, mostly positive) ──
  if (kind === 'regret') {
    const boot = recentBoots(1)[0];
    return {
      kind, q: pick(Q_REGRET), stakes: 0.3, target: null,
      truthText: boot
        ? `${nm} looks down at the water. "Voting ${boot} out. I keep replaying it. I don't know if it was the right call." Raw, and true.`
        : `${nm} lets ${pr.posAdj} guard down. "Playing it too safe early. I should've trusted my gut." Honest.`,
      lieClaim: `${nm} claims ${pr.sub} ${pr.sub === 'they' ? 'have' : 'has'} zero regrets — the helmet calls it instantly.`,
      applyTruth: () => { popDelta(answerer, 0.15); addBond(answerer, asker, 0.5); },
      applyLie: () => { popDelta(answerer, -0.05); },
    };
  }

  // ── COMEDIC (low stakes, crowd-pleaser) ──
  if (kind === 'comedic' || force) {
    return {
      kind: 'comedic', q: pick(Q_COMEDIC), stakes: 0.14, target: null,
      truthText: pick([
        `${nm} groans and spills it — and it is DEEPLY embarrassing. The gallery howls.`,
        `${nm} cringes, then confesses something mortifying. Even ${host()} winces.`,
        `${nm} caves and tells the truth. It's so bad the whole cast loses it.`,
        `${nm} buries ${pr.posAdj} face for a second, then admits it. The crowd ERUPTS.`,
      ]),
      lieClaim: pick([
        `${nm} tries to lie ${pr.posAdj} way out of an easy one, out of sheer pride.`,
        `${nm} makes up something wholesome instead — vanity over ropes.`,
      ]),
      applyTruth: () => { popDelta(answerer, 0.1); addBond(answerer, asker, 0.5); },
      applyLie: () => { popDelta(answerer, -0.05); },
    };
  }

  return null;
}

// ══════════════════════════════════════════════════════════════
// SIMULATION
// ══════════════════════════════════════════════════════════════
function _hangBase(n) { const s = pStats(n); return 6 + s.endurance * 0.5 + s.physical * 0.25 + s.temperament * 0.25 + s.boldness * 0.15; }

export function simulateHungOutToDry(ep) {
  const active = gs.activePlayers.filter(p => p !== gs.exileDuelPlayer);
  const campKey = gs.mergeName || 'merge';
  if (!ep.campEvents) ep.campEvents = {};
  if (!ep.campEvents[campKey]) ep.campEvents[campKey] = { pre: [], post: [] };
  if (!ep.chalMemberScores) ep.chalMemberScores = {};
  active.forEach(n => { ep.chalMemberScores[n] = 0; });

  const result = {
    open: pick(OPEN_TEXT)(host()),
    rounds: [
      { label: ROUND_BANNER[0].label, events: [] },
      { label: ROUND_BANNER[1].label, events: [] },
      { label: ROUND_BANNER[2].label, events: [] },
    ],
    outOrder: [],   // worst-first: {name, reason, round}
    reachedFinal: [],
    winner: null,
  };

  const ropes = {}, truths = {}, askedCount = {}, asAsker = {}, grip = {}, gripStart = {};
  active.forEach(n => {
    ropes[n] = 3; truths[n] = 0; askedCount[n] = 0; asAsker[n] = 0;
    grip[n] = 12 + pStats(n).endurance * 0.7 + pStats(n).physical * 0.25 + pStats(n).temperament * 0.2 + noise(2);
    gripStart[n] = grip[n];
  });
  let alive = [...active];

  // Snapshot carries who's TREMBLING (lowest grip / almost out of rope). As FATIGUE builds over the
  // rounds, a bigger slice of the field is shaking — so the arena shakes more puppets as time passes.
  const snapOf = () => {
    const fallenCt = result.outOrder.length;
    const k = clamp(1 + Math.floor(fallenCt * 0.45), 1, alive.length);
    const rank = [...alive].sort((a, b) => grip[a] - grip[b]);
    const low = new Set(rank.slice(0, k));
    alive.forEach(n => { if (ropes[n] <= 1 || grip[n] < gripStart[n] * 0.35) low.add(n); });
    return { ropes: { ...ropes }, out: result.outOrder.map(o => ({ name: o.name, reason: o.reason })), winner: result.winner, trembling: [...low] };
  };
  const pushEv = (ri, ev) => { ev.snap = snapOf(); result.rounds[ri].events.push(ev); };
  const eliminate = (n, reason) => {
    if (!result.outOrder.find(o => o.name === n)) result.outOrder.push({ name: n, reason });
    alive = alive.filter(x => x !== n);
  };

  // ── THE ASKING LAYER — who grills whom, and WHY ──
  // A truthful answer costs the ASKER a rope; a caught lie costs the ANSWERER a rope. So asking is a
  // gamble: press a likely-liar and THEY bleed; press an honest player and YOU bleed (but you drag a
  // secret into the open). Askers pick targets emotionally (a rival), strategically (a liar with
  // ropes / a threat), or at random — driven by archetype + relationships.
  const lieProne = (t) => {
    const s = pStats(t); let v = canScheme(t) ? 0.7 : 0.28;
    v -= s.boldness * 0.03 + s.loyalty * 0.02;
    if ((gs.namedAlliances || []).some(al => al.active && al.members.includes(t))) v += 0.1;   // has a scheme to hide
    if ((gs.showmances || []).some(sh => !sh.broken && (sh.players || []).includes(t))) v += 0.06; // has a heart to hide
    return clamp(v, 0.05, 0.9);
  };
  const threatVal = (t) => pStats(t).endurance * 0.5 + pStats(t).strategic * 0.3;
  const chooseMode = (asker) => {
    const a = arch(asker), s = pStats(asker), r = Math.random();
    if (a === 'hothead') return r < 0.75 ? 'emotional' : 'random';
    if (['mastermind', 'schemer', 'perceptive-player'].includes(a)) return r < 0.7 ? 'strategic' : (r < 0.85 ? 'emotional' : 'random');
    if (['chaos-agent', 'wildcard', 'floater'].includes(a)) return r < 0.55 ? 'random' : (r < 0.8 ? 'emotional' : 'strategic');
    if (a === 'villain') return r < 0.5 ? 'strategic' : 'emotional';
    if (NICE.includes(a)) return r < 0.5 ? 'strategic' : (r < 0.78 ? 'random' : 'emotional'); // nice players are less vindictive
    if (s.strategic >= 6 && s.temperament >= 5) return r < 0.6 ? 'strategic' : 'random';
    if (s.boldness >= 6 && s.temperament <= 4) return r < 0.6 ? 'emotional' : 'random';
    return r < 0.5 ? 'strategic' : (r < 0.8 ? 'random' : 'emotional');
  };
  const chooseTarget = (asker) => {
    const pool = alive.filter(n => n !== asker);
    if (!pool.length) return null;
    let mode = chooseMode(asker);
    const foes = pool.filter(n => getBond(asker, n) <= -2).sort((a, b) => getBond(asker, a) - getBond(asker, b));
    if (mode === 'emotional' && !foes.length) mode = Math.random() < 0.5 ? 'strategic' : 'random';
    if (mode === 'emotional') return { target: foes[0], mode };           // go after someone you dislike
    if (mode === 'random') return { target: pick(pool), mode };           // chaos — no plan
    // strategic: drain a likely-liar who still has ropes, or knock a threat; avoid your own allies
    const scored = pool.map(n => ({ n, sc: lieProne(n) * (0.6 + ropes[n]) + threatVal(n) * 0.08 - Math.max(0, getBond(asker, n)) * 0.15 + Math.random() * 0.4 }));
    scored.sort((a, b) => b.sc - a.sc);
    return { target: scored[0].n, mode };
  };

  // ── one Q&A exchange ──
  const runExchange = (ri) => {
    if (alive.length < 2) return;
    const asker = [...alive].sort((a, b) => asAsker[a] - asAsker[b] || Math.random() - 0.5)[0]; // rotate who asks
    const chosen = chooseTarget(asker);
    if (!chosen || !chosen.target) return;
    const answerer = chosen.target, mode = chosen.mode;
    asAsker[asker]++; askedCount[answerer]++;

    const q = buildQuestion(asker, answerer, ri, alive, ep, campKey);
    const s = pStats(answerer);
    // lie decision — schemers/cowards hide damaging truths; the bold & loyal take the honest hit
    let base = canScheme(answerer) ? 0.55 : (NICE.includes(arch(answerer)) ? 0.10 : 0.30);
    base -= s.boldness * 0.02 + s.loyalty * 0.01;
    let pLie = clamp(base * (0.35 + q.stakes), 0.02, 0.82);
    if (q.stakes < 0.15) pLie = 0.04;
    const lying = Math.random() < pLie;

    const qcard = (verdict, body, extra = {}) => pushEv(ri, {
      type: 'exchange', asker, answerer, mode, players: [asker, answerer], q: q.q, kind: q.kind,
      verdict, text: `<span class="hd-q"><b>${asker}</b> → <b>${answerer}</b>: "${q.q}"</span><span class="hd-a">${body}</span>`, ...extra,
    });

    if (lying) {
      const egregious = s.boldness >= 7 || Math.random() < 0.22;
      const rl = egregious ? 2 : 1;
      ropes[answerer] = Math.max(0, ropes[answerer] - rl);
      q.applyLie();
      qcard('lie', `${q.lieClaim} ${pick(HELMET_CATCH)(answerer, rl, egregious)}`, { ropeLoser: answerer, ropesLost: rl });
      if (ropes[answerer] <= 0) {
        eliminate(answerer, 'out of rope');
        pushEv(ri, { type: 'fall', player: answerer, players: [answerer], reason: 'out of rope', text: pick(ROPE_FALL)(answerer) });
      }
    } else {
      ropes[asker] = Math.max(0, ropes[asker] - 1); // the honest answer costs the ONE WHO ASKED
      q.applyTruth();
      truths[answerer]++;
      ep.chalMemberScores[answerer] = (ep.chalMemberScores[answerer] || 0) + 2;
      qcard('truth', `${q.truthText} ${pick(TRUTH_COST)(asker, pronouns(asker))}`, { ropeLoser: asker, ropesLost: 1 });
      // the person the truth was ABOUT answers back (reactionBeat decides if/how)
      if (alive.length > 1) reactionBeat(ri, answerer, q.kind, q.target);
      if (ropes[asker] <= 0) {
        eliminate(asker, 'out of rope');
        pushEv(ri, { type: 'fall', player: asker, players: [asker], reason: 'out of rope', text: pick(ROPE_FALL)(asker) });
      }
    }
  };

  // ── FATIGUE — grip drains at the end of every round, and the drain GROWS as the challenge wears
  // on. Low-endurance hangers gas out first. This is the physical clock that thins the field. ──
  const applyFatigue = (ri, intensity) => {
    alive.forEach(n => { grip[n] -= (3 + intensity * 2.2) * (1 + (7 - pStats(n).endurance) * 0.05) + Math.abs(noise(2)); });
    const gone = alive.filter(n => grip[n] <= 0).sort((a, b) => grip[a] - grip[b]);
    gone.forEach(n => { if (alive.length <= 1) return; eliminate(n, 'lost grip'); pushEv(ri, { type: 'fall', player: n, players: [n], reason: 'lost grip', text: pick(GRIP_FALL)(n) }); });
  };

  // ══ INTRO: hang + a flashback beat (round 0) ══
  const hi = host(), his = pronouns(hi)?.posAdj || 'his';
  // opening hang flavor for a couple of players
  const flavPlayers = [...active].sort(() => Math.random() - 0.5).slice(0, Math.min(2, active.length));

  // strain layer: shake up the physical toll between Q&A beats (uses the weakest hangers)
  const strainBeat = (ri) => { const n = [...alive].sort((a, b) => grip[a] - grip[b])[0]; if (n) pushEv(ri, { type: 'strain', player: n, players: [n], text: pick(STRAIN)(n) }); };
  const nearMiss = (ri) => { const c = [...alive].sort((a, b) => grip[a] - grip[b]); const n = c[Math.min(c.length - 1, Math.floor(Math.random() * 2))]; if (n) pushEv(ri, { type: 'nearmiss', player: n, players: [n], text: pick(NEARMISS)(n) }); };
  const taunt = (ri) => pushEv(ri, { type: 'taunt', text: pick(HOST_TAUNT)(hi) });

  // DRAMA: the PERSON the truth was about answers back, in a voice that fits their personality.
  const usedReact = new Set();
  // reaction style from archetype + temperament/boldness — a shy player never explodes.
  const reactStyle = (name) => {
    const ar = arch(name), st = pStats(name);
    if (ar === 'hothead' || (st.boldness >= 7 && st.temperament <= 4)) return 'explosive';
    if (['hero', 'loyal-soldier'].includes(ar)) return st.temperament >= 6 ? 'composed' : 'explosive'; // nice: firm or fiery, never cold menace
    if (['social-butterfly', 'showmancer'].includes(ar)) return 'wounded';
    if (['villain', 'mastermind', 'schemer'].includes(ar) || (st.strategic >= 7 && st.temperament <= 5)) return 'cold';
    if ((['goat', 'floater', 'underdog'].includes(ar) && st.boldness <= 4) || st.boldness <= 3) return 'timid';
    if (st.temperament >= 7) return 'composed';
    return st.boldness >= 6 ? 'explosive' : 'composed';
  };
  const combative = (name) => ['explosive', 'cold'].includes(reactStyle(name));

  const reactionBeat = (ri, answerer, kind, target) => {
    // WHO the truth hit + the valence
    let victim = null, cat = null;
    if (kind === 'feelings') { victim = target; cat = 'romance'; }
    else if (kind === 'realFriend') { victim = target; cat = getBond(answerer, target) >= 4 ? 'warm' : 'betrayedAlly'; } // "just a number" to their face = real betrayal
    else if (kind === 'trustLeast') { victim = target; cat = 'betrayedAlly'; } // named least-trusted, to their face = real betrayal
    else if (kind === 'ally') { victim = target; cat = 'exposed'; } // alliance outed = shared cover blown, NOT a betrayal
    else if (kind === 'vote') { victim = alive.find(n => n !== answerer && getBond(answerer, n) >= 3); cat = 'exposed'; } // a co-conspirator gets implicated
    else if (['flip', 'neverSit', 'worstLeader', 'least', 'overrated', 'fakest'].includes(kind)) { victim = target; cat = 'clapback'; }
    else return; // comedic / regret — no direct target
    if (!victim || victim === answerer || !alive.includes(victim)) return;
    const rate = cat === 'clapback' ? 0.72 : cat === 'exposed' ? 0.68 : cat === 'warm' ? 0.75 : cat === 'romance' ? 0.9 : 0.85;
    if (Math.random() > rate) return;

    let style = null, text;
    if (cat === 'warm' || cat === 'romance' || cat === 'exposed') {
      text = pickUniq(REACTIONS[cat], usedReact)(victim, answerer, pronouns(victim));
    } else {
      style = reactStyle(victim);
      const pool = REACTIONS[cat][style] || REACTIONS[cat].composed || REACTIONS[cat].cold;
      text = pickUniq(pool, usedReact)(victim, answerer, pronouns(victim));
    }
    // consequences
    if (cat === 'clapback') { addBond(victim, answerer, style === 'timid' ? -0.4 : -0.8); addBond(answerer, victim, -0.3); }
    else if (cat === 'betrayedAlly') { addBond(victim, answerer, -1.2); popDelta(victim, 0.1); }
    else if (cat === 'exposed') { addBond(victim, answerer, -0.3); } // mild annoyance at the cover being blown — they're still allies
    else if (cat === 'warm') { addBond(victim, answerer, 1); popDelta(answerer, 0.1); popDelta(victim, 0.1); }
    else if (cat === 'romance') { addBond(victim, answerer, 1.5); popDelta(answerer, 0.15); popDelta(victim, 0.1); }
    pushEv(ri, { type: 'reaction', reactor: victim, players: [answerer, victim], cat, style, text });

    // ESCALATION into a real fight — the more they DISLIKE each other, and the SHORTER their fuses
    // (low temperament), the more likely it boils over. A calm pair, or two players with no real
    // beef, just won't blow up — even if both are combative types.
    const _dislike = Math.max(0, -getBond(victim, answerer));            // 0..10, how much they clash
    const _minTemp = Math.min(pStats(victim).temperament, pStats(answerer).temperament); // shortest fuse
    let _esc = _dislike * 0.08 + Math.max(0, 6 - _minTemp) * 0.10;
    if (!(combative(victim) && combative(answerer))) _esc *= 0.35;       // a composed head cools it off
    _esc = clamp(_esc, 0, 0.85);
    if ((cat === 'clapback' || cat === 'betrayedAlly') && Math.random() < _esc) {
      const aStyle = reactStyle(answerer) === 'explosive' ? 'explosive' : 'cold';
      const cText = pickUniq(COUNTER[aStyle], usedReact)(answerer, victim, pronouns(answerer));
      addBond(answerer, victim, -0.6); addBond(victim, answerer, -0.5);
      pushEv(ri, { type: 'reaction', reactor: answerer, players: [victim, answerer], cat: 'fight', style: aStyle, text: cText });
      // the target may get the last word
      if (Math.random() < 0.45) {
        const fText = pickUniq(FINAL_JAB, usedReact)(victim, answerer, pronouns(victim));
        addBond(victim, answerer, -0.4); popDelta(victim, -0.05); popDelta(answerer, -0.05);
        pushEv(ri, { type: 'reaction', reactor: victim, players: [answerer, victim], cat: 'fight', text: fText });
      }
    }
  };

  for (let ri = 0; ri < 3; ri++) {
    if (ri === 2) result.reachedFinal = [...alive];
    // round banner
    pushEv(ri, { type: 'round', label: result.rounds[ri].label, text: ROUND_BANNER[ri].text.replace('{h}', hi).replace('{his}', his) });
    if (ri === 0) {
      flavPlayers.forEach(n => pushEv(0, { type: 'flavor', player: n, players: [n], text: pick(HANG_FLAVOR)(n) }));
      const fb = [...alive].sort((a, b) => (pStats(a).temperament) - (pStats(b).temperament))[0];
      if (fb) pushEv(0, { type: 'flavor', player: fb, players: [fb], text: pick(FLASHBACK)(fb) });
    } else {
      taunt(ri); // host stokes the pressure as the burn sets in
    }
    const nEx = ri === 0 ? Math.min(6, alive.length + 1) : ri === 1 ? Math.min(6, alive.length + 1) : Math.min(7, alive.length + 2);
    for (let e = 0; e < nEx && alive.length > 1; e++) {
      runExchange(ri);
      // interleave the physical toll so it reads like a hang, not an interrogation
      if (alive.length > 1 && Math.random() < 0.7) strainBeat(ri);
      if (alive.length > 2 && Math.random() < 0.22) nearMiss(ri);
    }
    if (alive.length > 1) { taunt(ri); applyFatigue(ri, ri); } // fatigue bites harder each round (intensity 0→1→2)
  }

  // ── overtime: escalating fatigue (+ a few last questions) until one soul remains ──
  let ot = 3, safety = 0;
  while (alive.length > 1 && safety++ < 30) {
    if (alive.length > 2) { runExchange(2); if (Math.random() < 0.5) strainBeat(2); }
    if (alive.length === 3) nearMiss(2);
    applyFatigue(2, ot); ot += 1.3;
  }

  // ── WINNER ──
  const winner = alive[0] || result.outOrder[result.outOrder.length - 1]?.name || active[0];
  result.winner = winner;
  pushEv(2, { type: 'win', player: winner, players: [winner], text: pick(WIN_TEXT)(winner) });
  popDelta(winner, 1.2);

  // ══ ROMANCE HOOKS ══
  for (let i = 0; i < active.length; i++)
    for (let j = i + 1; j < active.length; j++)
      _challengeRomanceSpark(active[i], active[j], ep, null, null, ep.chalMemberScores || {}, 'lie-detector hang');
  _checkShowmanceChalMoment(ep, null, null, ep.chalMemberScores || {}, 'hang', active);

  // ══ FINALIZE ══
  ep.hungOut = result;
  ep.isHungOut = true;
  ep.challengeType = 'hung-out-to-dry';
  ep.challengeLabel = 'Hung Out to Dry';
  ep.challengeCategory = 'social';
  ep.immunityWinner = winner;
  ep.tribalPlayers = active;

  // placements: winner #1, everyone else by how long they hung (outOrder is worst-first → reverse)
  const elimBetterFirst = result.outOrder.map(o => o.name).reverse();
  ep.chalPlacements = [...new Set([winner, ...elimBetterFirst].filter(Boolean))];

  const N = active.length;
  ep.chalPlacements.forEach((name, idx) => {
    ep.chalMemberScores[name] = (ep.chalMemberScores[name] || 0) + Math.max(1, N - idx);
  });
  result.reachedFinal.forEach(name => {
    ep.chalMemberScores[name] = (ep.chalMemberScores[name] || 0) + Math.round(N * 0.4);
  });
  if (winner) ep.chalMemberScores[winner] = (ep.chalMemberScores[winner] || 0) + N + 5;

  updateChalRecord(ep);
  ep.episodeHistory = ep.episodeHistory || {};
  ep.episodeHistory.challenge = { type: 'hung-out-to-dry', label: 'Hung Out to Dry', winner };
  return ep;
}

// ══════════════════════════════════════════════════════════════
// VP — NEON POLYGRAPH INTERROGATION OVER SHARK WATER
// ══════════════════════════════════════════════════════════════
function css() {
  return `<style>
  @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@600;800&family=Share+Tech+Mono&family=Rajdhani:wght@500;700&display=swap');
  .hd-shell{--water:#04141c;--deep:#020a10;--cyan:#22e0e6;--amber:#f6b23e;--lie:#ff3b5c;--truth:#37ffa0;--ink:#d6f2f6;--steel:#0e3340;
    font-family:'Rajdhani',sans-serif;color:var(--ink);position:relative;max-width:1100px;margin:0 auto;min-height:460px;overflow:visible;
    background:linear-gradient(180deg,#06202b 0%,#052330 34%,#031722 70%,#020c12 100%);
    border:4px solid #041c26;box-shadow:0 0 0 2px #0b3d4c,0 16px 44px rgba(0,0,0,0.7)}
  /* caustic light + moving water shimmer */
  .hd-shell::before{content:'';position:absolute;inset:0;z-index:0;pointer-events:none;opacity:.5;
    background:radial-gradient(ellipse at 30% 12%,rgba(34,224,230,0.14),transparent 40%),
      radial-gradient(ellipse at 78% 78%,rgba(20,120,150,0.18),transparent 46%);
    animation:hd-caust 7s ease-in-out infinite alternate}
  @keyframes hd-caust{0%{opacity:.35;transform:translateY(0)}100%{opacity:.6;transform:translateY(-8px)}}
  .hd-shell::after{content:'';position:absolute;left:0;right:0;bottom:0;height:120px;z-index:1;pointer-events:none;opacity:.5;
    background:repeating-linear-gradient(100deg,transparent 0 22px,rgba(34,224,230,0.05) 22px 24px);
    animation:hd-wave 6s linear infinite}
  @keyframes hd-wave{0%{transform:translateX(0)}100%{transform:translateX(-48px)}}
  @media(prefers-reduced-motion:reduce){.hd-shell::before,.hd-shell::after,.hd-ekg-line{animation:none!important}}

  /* polygraph EKG strip across the top */
  .hd-ekg{position:relative;z-index:5;height:34px;background:linear-gradient(180deg,#031017,#04161e);border-bottom:1px solid #0b3d4c;overflow:hidden}
  .hd-ekg svg{position:absolute;top:0;left:0;width:200%;height:100%}
  .hd-ekg-line{stroke:var(--truth);stroke-width:2;fill:none;filter:drop-shadow(0 0 5px var(--truth));animation:hd-scan 5s linear infinite}
  @keyframes hd-scan{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}

  .hd-cover{position:relative;z-index:5;text-align:center;padding:30px 22px 26px}
  .hd-title{font-family:'Orbitron',sans-serif;font-weight:800;font-size:50px;line-height:0.95;color:#fff;letter-spacing:2px;
    text-shadow:0 0 20px rgba(34,224,230,0.6),0 0 3px #000}
  .hd-title b{color:var(--lie)}
  .hd-sub{font-family:'Share Tech Mono',monospace;font-size:11px;letter-spacing:4px;color:var(--cyan);margin-top:10px}
  .hd-tag{font-family:'Rajdhani';font-size:13px;color:#a9d8de;margin:14px auto 0;max-width:620px;line-height:1.5;font-weight:500}
  .hd-roster{display:flex;flex-wrap:wrap;justify-content:center;gap:8px;margin-top:20px}
  .hd-badge{width:58px;text-align:center;position:relative}
  .hd-badge img{width:48px;height:48px;object-fit:contain;border-radius:6px;border:2px solid #0b3d4c;background:#031017;box-shadow:0 0 8px rgba(34,224,230,0.25)}
  .hd-badge .hd-helm{position:absolute;top:-4px;left:50%;transform:translateX(-50%);width:26px;height:8px;border-radius:8px 8px 0 0;
    background:linear-gradient(180deg,#1a5566,#0b3d4c);border:1px solid var(--cyan);box-shadow:0 0 6px rgba(34,224,230,0.5)}
  .hd-badge span{display:block;font-size:9px;color:#9fc7ce;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}

  .hd-layout{display:flex;gap:0;position:relative;z-index:5;min-height:320px}
  .hd-feed{flex:1;padding:16px 18px 96px;min-width:0}
  .hd-side{width:236px;flex-shrink:0;padding:14px 12px;background:linear-gradient(180deg,rgba(4,26,34,0.9),rgba(2,12,18,0.95));
    border-left:2px solid #0b3d4c;position:sticky;top:338px;align-self:flex-start;max-height:calc(100vh - 350px);overflow-y:auto;z-index:6}
  .hd-side-h{font-family:'Orbitron';font-size:10px;letter-spacing:2px;color:var(--cyan);border-bottom:1px solid rgba(34,224,230,0.25);padding-bottom:4px;margin:12px 0 8px}
  .hd-side-h:first-child{margin-top:0}
  .hd-srow{display:flex;align-items:center;gap:6px;padding:4px 0;font-size:12px}
  .hd-srow img{width:22px;height:22px;object-fit:contain;border-radius:4px}
  .hd-srow.out{opacity:.42}.hd-srow.out img{filter:grayscale(1)}
  .hd-srow.out .hd-nm{text-decoration:line-through;color:#7d9299}
  .hd-srow.win .hd-nm{color:var(--amber);font-weight:700}
  .hd-nm{color:#cfe9ee;font-weight:600}
  .hd-mini{font-size:8px;color:#6f8a91;margin-left:auto;font-family:'Share Tech Mono'}
  /* rope meter */
  .hd-ropes{display:flex;gap:2px;margin-left:auto}
  .hd-rope{width:5px;height:14px;border-radius:1px;background:var(--amber);box-shadow:0 0 4px rgba(246,178,62,0.6)}
  .hd-rope.cut{background:#3a2a12;box-shadow:none;opacity:.5}

  .hd-round{position:relative;z-index:2;margin:16px 0 12px;padding:12px 16px;border-radius:6px;text-align:center;
    background:linear-gradient(90deg,rgba(34,224,230,0.06),rgba(34,224,230,0.16),rgba(34,224,230,0.06));border:1px solid #0b5566}
  .hd-round-t{font-family:'Orbitron';font-size:20px;letter-spacing:2px;color:var(--cyan);text-shadow:0 0 12px rgba(34,224,230,0.5)}
  .hd-round-x{font-size:12.5px;line-height:1.5;color:#9fc7ce;margin-top:5px;font-weight:500}

  .hd-step{margin:9px 0;transition:opacity .3s;scroll-margin-top:20px}
  .hd-card{background:linear-gradient(180deg,rgba(6,30,40,0.94),rgba(3,16,22,0.94));border:1px solid #0b3d4c;border-radius:8px;
    padding:10px 12px;display:flex;gap:10px;align-items:flex-start;box-shadow:0 4px 14px rgba(0,0,0,0.4)}
  .hd-card .hd-txt{font-size:13px;line-height:1.5;color:#dbeef2}
  .hd-q{display:block;color:#bfe6ea;font-weight:600}
  .hd-a{display:block;margin-top:5px;color:#e8f6f8;padding-left:8px;border-left:2px solid #0b5566}
  .hd-avs{display:flex}.hd-avs img{width:30px;height:30px;object-fit:contain;border-radius:5px;border:1px solid #0b3d4c;margin-left:-8px;background:#031017}
  .hd-avs img:first-child{margin-left:0}
  .hd-card.truth{border-left:4px solid var(--truth)}
  .hd-card.lie{border-left:4px solid var(--lie);background:linear-gradient(180deg,rgba(50,8,20,0.6),rgba(3,16,22,0.94));animation:hd-buzz .4s}
  @keyframes hd-buzz{0%,100%{transform:translateX(0)}25%{transform:translateX(-3px)}75%{transform:translateX(3px)}}
  .hd-card.fall{border-left:4px solid #1f6d86;background:linear-gradient(180deg,rgba(6,40,54,0.7),rgba(3,16,22,0.94));font-style:italic}
  .hd-card.flavor{border-left:3px solid #14515f;background:rgba(5,24,32,0.7);font-style:italic;opacity:.95}
  .hd-card.win{border:2px solid var(--amber);background:linear-gradient(90deg,rgba(246,178,62,0.16),rgba(3,16,22,0.9));animation:hd-glow 1.4s ease-in-out infinite alternate}
  @keyframes hd-glow{from{box-shadow:0 0 8px rgba(246,178,62,0.3)}to{box-shadow:0 0 24px rgba(246,178,62,0.7)}}
  .hd-stamp{display:inline-block;font-family:'Orbitron';font-size:9px;letter-spacing:1px;padding:2px 7px;border-radius:3px;margin-bottom:4px;transform:rotate(-3deg)}
  .hd-stamp.truth{background:rgba(55,255,160,0.15);color:var(--truth);border:1px solid var(--truth)}
  .hd-stamp.lie{background:rgba(255,59,92,0.15);color:var(--lie);border:1px solid var(--lie)}
  .hd-stamp.fall{background:rgba(31,109,134,0.2);color:#7fd4e8;border:1px solid #1f6d86}
  .hd-stamp.win{background:rgba(246,178,62,0.18);color:var(--amber);border:1px solid var(--amber)}

  .hd-ctrl{position:sticky;bottom:0;z-index:20;display:flex;gap:8px;align-items:center;justify-content:center;
    padding:10px;margin:0 -18px -96px;background:linear-gradient(0deg,#020c12,rgba(2,12,18,0.85) 70%,transparent);backdrop-filter:blur(2px)}
  .hd-btn{font-family:'Orbitron';font-size:11px;letter-spacing:1px;cursor:pointer;padding:8px 16px;border-radius:5px;
    border:1px solid #0b5566;background:linear-gradient(180deg,#083040,#04202b);color:var(--ink)}
  .hd-btn:hover{border-color:var(--cyan);color:var(--cyan)}
  .hd-btn.all{border-color:var(--amber)}
  .hd-cnt{font-family:'Share Tech Mono';font-size:11px;color:#8fb4bc}
  .hd-done{font-family:'Orbitron';font-size:11px;color:var(--cyan);text-align:center;padding:10px;letter-spacing:1px}
  /* strain / near-miss / host taunt cards */
  .hd-card.strain{border-left:4px solid #f6b23e;background:linear-gradient(180deg,rgba(60,40,10,0.5),rgba(3,16,22,0.94));font-style:italic}
  .hd-card.nearmiss{border-left:4px solid var(--lie);background:linear-gradient(180deg,rgba(50,10,20,0.5),rgba(3,16,22,0.94));animation:hd-buzz .4s}
  .hd-card.taunt{border-left:4px dashed #8af0f7;background:rgba(8,40,50,0.6);align-items:center}
  .hd-card.taunt .hd-ico{font-size:20px;margin-right:2px}
  .hd-stamp.strain{background:rgba(246,178,62,0.15);color:#f6b23e;border:1px solid #f6b23e}
  .hd-stamp.near{background:rgba(255,59,92,0.15);color:var(--lie);border:1px solid var(--lie)}
  /* asker intent tags + the "who pays the rope" stamp */
  .hd-mode{display:inline-block;font-family:'Orbitron';font-size:8px;letter-spacing:1px;padding:2px 6px;border-radius:3px;margin-bottom:4px;vertical-align:middle}
  .hd-mode.emotional{background:rgba(255,59,92,0.15);color:#ff9aa6;border:1px solid var(--lie)}
  .hd-mode.strategic{background:rgba(34,224,230,0.14);color:#8af0f7;border:1px solid var(--cyan)}
  .hd-mode.random{background:rgba(246,178,62,0.14);color:#f6c96a;border:1px solid var(--amber)}
  .hd-stamp.cost{background:rgba(246,178,62,0.14);color:#f6c96a;border:1px solid #f6b23e}
  /* reaction cards (drama) */
  .hd-card.reaction{border-left:4px solid #b07de0;background:linear-gradient(180deg,rgba(44,22,64,0.55),rgba(3,16,22,0.94))}
  .hd-card.reaction.clapback{border-left-color:var(--lie);background:linear-gradient(180deg,rgba(50,10,20,0.5),rgba(3,16,22,0.94))}
  .hd-card.reaction.betrayedAlly{border-left-color:var(--lie)}
  .hd-card.reaction.exposed{border-left-color:var(--amber);background:linear-gradient(180deg,rgba(60,44,10,0.4),rgba(3,16,22,0.94))}
  .hd-card.reaction.exposed .hd-stamp.react{background:rgba(246,178,62,0.14);color:#f6c96a;border-color:var(--amber)}
  .hd-card.reaction.warm{border-left-color:var(--truth);background:linear-gradient(180deg,rgba(10,50,30,0.45),rgba(3,16,22,0.94))}
  .hd-card.reaction.romance{border-left-color:#ff86c8;background:linear-gradient(180deg,rgba(60,20,44,0.5),rgba(3,16,22,0.94))}
  .hd-card.reaction.hurt{border-left-color:#7f8fb0;background:linear-gradient(180deg,rgba(28,34,54,0.5),rgba(3,16,22,0.94))}
  .hd-card.reaction.fight{border-left:4px solid #ff2233;background:linear-gradient(180deg,rgba(74,10,16,0.62),rgba(3,16,22,0.95));box-shadow:0 0 16px rgba(255,40,60,0.2) inset;animation:hd-buzz .4s}
  .hd-stamp.react{background:rgba(176,125,224,0.16);color:#d3b6f4;border:1px solid #b07de0}
  .hd-card.reaction.clapback .hd-stamp.react,.hd-card.reaction.betrayedAlly .hd-stamp.react{background:rgba(255,59,92,0.15);color:#ffb3c0;border-color:var(--lie)}
  .hd-card.reaction.hurt .hd-stamp.react{background:rgba(127,143,176,0.16);color:#c3ccdf;border-color:#7f8fb0}
  .hd-card.reaction.fight .hd-stamp.react{background:rgba(255,34,51,0.2);color:#ff9aa6;border-color:#ff2233;font-weight:800}
  .hd-card.reaction.warm .hd-stamp.react{background:rgba(55,255,160,0.14);color:#9affd0;border-color:var(--truth)}
  .hd-card.reaction.romance .hd-stamp.react{background:rgba(255,134,200,0.16);color:#ffc4e2;border-color:#ff86c8}

  /* ═══ HANG ARENA — live falling puppets over a shark tank ═══ */
  .hd-arena{position:sticky;top:0;height:330px;z-index:12;overflow:hidden;border-bottom:3px solid #0c2027;box-shadow:0 8px 20px rgba(0,0,0,0.55);
    background:linear-gradient(180deg,#1c4650 0%,#154049 30%,#0e2f39 52%,#08222b 68%,#04141b 100%)}
  .hd-arena::after{content:'';position:absolute;inset:0;z-index:1;opacity:.4;pointer-events:none;
    background-image:radial-gradient(rgba(0,0,0,.4) 1px,transparent 1px);background-size:4px 4px}
  .hd-hud{position:absolute;top:9px;left:14px;right:14px;display:flex;justify-content:space-between;z-index:9;
    font-family:'Orbitron';font-weight:800;letter-spacing:1px;color:#ffd7a0;text-shadow:2px 2px 0 #000;font-size:14px}
  .hd-hud-r{color:#8af0f7}
  .hd-rig{position:absolute;top:0;height:56px;width:6px;background:linear-gradient(180deg,#6b4a2a,#3a2410);left:12%;z-index:2}
  .hd-rig.hd-r{left:auto;right:12%}
  .hd-bar{position:absolute;top:50px;left:5%;right:5%;height:26px;border-radius:6px;z-index:3;
    background:linear-gradient(180deg,#9a6530,#5c3a18 70%,#43290f);border:2px solid #2a1a0a;
    box-shadow:0 6px 14px rgba(0,0,0,0.55),inset 0 -5px 10px rgba(0,0,0,0.4)}
  .hd-bar::after{content:'';position:absolute;inset:4px 10px;border-radius:3px;
    background:repeating-linear-gradient(90deg,rgba(0,0,0,0.14) 0 4px,transparent 4px 26px)}
  .hd-pups{position:absolute;top:62px;left:0;right:0;height:200px;z-index:4}
  .hd-slot{position:absolute;top:0;width:128px;transform:translateX(-50%) scale(var(--s,1));transform-origin:top center}
  .hd-sway{position:relative;width:128px;transform-origin:50% 8px;animation:hd-sway 3s ease-in-out infinite}
  .hd-sway.trem{animation:hd-sway 3s ease-in-out infinite, hd-trem .12s linear infinite}
  @keyframes hd-sway{0%,100%{transform:rotate(-5deg)}50%{transform:rotate(5deg)}}
  @keyframes hd-trem{0%,100%{margin-left:0}25%{margin-left:-2.5px}75%{margin-left:2.5px}}
  .hd-sway.hd-jolt{animation:hd-joltk .4s}
  @keyframes hd-joltk{0%,100%{transform:rotate(0)}25%{transform:rotate(-9deg)}75%{transform:rotate(9deg)}}
  .hd-p-helm{position:absolute;top:32px;left:50%;transform:translateX(-50%);width:60px;height:26px;border-radius:15px 15px 5px 5px;z-index:4;
    background:linear-gradient(180deg,#3f3475,#231c46);border:2px solid #6a5acd;box-shadow:0 0 10px rgba(106,90,205,0.5)}
  .hd-p-scr{position:absolute;top:5px;left:50%;transform:translateX(-50%);width:20px;height:12px;border-radius:2px;
    background:#7a1020;box-shadow:0 0 7px rgba(255,59,92,0.6);display:flex;align-items:center;justify-content:center;font-size:9px;color:#ffd;
    transition:background .15s,box-shadow .15s}
  /* helmet verdict lights: steady GREEN on truth, ambulance-buzz RED on a caught lie */
  .hd-p-scr.hd-truth{background:#0a9a34;box-shadow:0 0 14px #37ffa0,0 0 4px #37ffa0;animation:hd-scr-green 1.5s ease-out}
  @keyframes hd-scr-green{0%{box-shadow:0 0 4px #37ffa0}25%{box-shadow:0 0 18px #37ffa0}100%{box-shadow:0 0 10px #37ffa0}}
  .hd-p-scr.hd-lie{animation:hd-scr-amb .26s steps(1) 6}
  @keyframes hd-scr-amb{0%{background:#ff2233;box-shadow:0 0 18px #ff3b5c}50%{background:#2a0308;box-shadow:0 0 2px #300}100%{background:#ff2233;box-shadow:0 0 18px #ff3b5c}}
  .hd-p-face{position:absolute;top:44px;left:50%;transform:translateX(-50%);width:52px;height:52px;border-radius:9px;object-fit:cover;border:2px solid #1c120a;z-index:3;background:#0d1a1f}
  .hd-p-name{position:absolute;top:150px;left:50%;transform:translateX(-50%);font-family:'Share Tech Mono';font-size:10px;
    color:#d8f0f4;white-space:nowrap;text-shadow:0 1px 3px #000;z-index:6;background:rgba(6,20,26,0.6);padding:1px 5px;border-radius:3px}
  .hd-ropebox{position:absolute;top:132px;left:50%;transform:translateX(-50%);display:flex;gap:5px;z-index:5}
  .hd-strand{width:4px;height:30px;background:linear-gradient(180deg,#e6b45a,#8a5a2b);border-radius:2px;box-shadow:0 0 3px rgba(230,180,90,0.5)}
  .hd-strand.cut{height:10px;opacity:.55;background:#5a3a18;box-shadow:none}
  .hd-sweat{position:absolute;width:5px;height:7px;border-radius:50%/60% 60% 40% 40%;background:#bfe9f2;opacity:.8;z-index:6}
  .hd-sweat.a{top:42px;left:26px;animation:hd-swf 1.4s ease-in infinite}
  .hd-sweat.b{top:46px;right:26px;animation:hd-swf 1.7s ease-in .5s infinite}
  @keyframes hd-swf{0%{transform:translateY(0);opacity:.8}100%{transform:translateY(30px);opacity:0}}
  .hd-slot.hd-winner .hd-p-face{border-color:var(--amber);box-shadow:0 0 16px var(--amber)}
  .hd-slot.hd-falling{animation:hd-fall 1.1s cubic-bezier(.5,0,.9,.4) forwards;z-index:9}
  @keyframes hd-fall{0%{transform:translateX(-50%) scale(var(--s,1)) translateY(0) rotate(0)}
    100%{transform:translateX(-50%) scale(var(--s,1)) translateY(250px) rotate(55deg);opacity:.1}}
  .hd-water{position:absolute;left:0;right:0;bottom:0;height:108px;z-index:5;overflow:hidden;
    background:linear-gradient(180deg,rgba(8,50,60,0.25),#0a2f38 34%,#06222b 70%,#031017);border-top:2px solid rgba(150,240,245,0.3)}
  .hd-water::before{content:'';position:absolute;top:-2px;left:0;right:0;height:12px;
    background:repeating-linear-gradient(90deg,transparent 0 22px,rgba(170,240,245,0.2) 22px 27px);animation:hd-ripple 4s linear infinite}
  @keyframes hd-ripple{to{background-position:54px 0}}
  .hd-shark{position:absolute;bottom:30px;width:150px;height:44px;z-index:5;opacity:.5;animation:hd-glide 11s ease-in-out infinite}
  @keyframes hd-glide{0%{left:-18%}50%{left:70%}100%{left:-18%}}
  .hd-fin{position:absolute;bottom:70px;width:0;height:0;border-left:12px solid transparent;border-right:12px solid transparent;
    border-bottom:22px solid #0d3a44;filter:drop-shadow(0 3px 3px rgba(0,0,0,.5));animation:hd-swim 8s linear infinite;z-index:6}
  @keyframes hd-swim{0%{left:-6%}100%{left:106%}}
  .hd-bob{position:absolute;bottom:20px;width:38px;height:38px;border-radius:7px;object-fit:cover;filter:grayscale(1) brightness(.6);
    border:2px solid #0a2b33;z-index:7;animation:hd-bobbing 2.4s ease-in-out infinite}
  @keyframes hd-bobbing{0%,100%{transform:translateY(0) rotate(-6deg)}50%{transform:translateY(-5px) rotate(6deg)}}
  @media(prefers-reduced-motion:reduce){.hd-sway,.hd-slot.hd-falling,.hd-shark,.hd-fin,.hd-bob,.hd-sweat,.hd-water::before{animation:none!important}}
  </style>`;
}

function _ekg() {
  // a repeating polygraph waveform (doubled so the scroll loops seamlessly)
  const seg = 'l14 0 l4 -12 l5 24 l5 -22 l4 10 l14 0';
  let d = 'M0 17 ';
  for (let i = 0; i < 24; i++) d += seg + ' ';
  return `<div class="hd-ekg"><svg viewBox="0 0 1100 34" preserveAspectRatio="none"><path class="hd-ekg-line" d="${d}"/></svg></div>`;
}

function _shell(content) { return `${css()}<div class="hd-shell">${_ekg()}${content}</div>`; }

// ── sidebar from a state snapshot ──
function _sidebar(roster, snap) {
  const outMap = {}; (snap.out || []).forEach(o => { outMap[o.name] = o.reason; });
  const winner = snap.winner;
  const hanging = roster.filter(n => !outMap[n] && n !== winner);
  let h = `<div class="hd-side-h">🦈 THE BAR</div>`;
  if (winner) h += `<div class="hd-srow win">${portrait(winner, 22)}<span class="hd-nm">${winner}</span><span class="hd-mini">IMMUNE ✦</span></div>`;
  h += `<div class="hd-side-h">STILL HANGING (${hanging.length})</div>`;
  hanging.forEach(n => {
    const r = snap.ropes?.[n] ?? 3;
    const ropes = [0, 1, 2].map(i => `<span class="hd-rope ${i < r ? '' : 'cut'}"></span>`).join('');
    h += `<div class="hd-srow">${portrait(n, 22)}<span class="hd-nm">${n}</span><span class="hd-ropes">${ropes}</span></div>`;
  });
  const out = (snap.out || []);
  if (out.length) {
    h += `<div class="hd-side-h" style="color:var(--lie)">💦 IN THE TANK (${out.length})</div>`;
    out.forEach(o => {
      const tag = o.reason === 'out of rope' ? 'NO ROPE' : o.reason === 'let go' ? 'LET GO' : 'SLIPPED';
      h += `<div class="hd-srow out">${portrait(o.name, 22)}<span class="hd-nm">${o.name}</span><span class="hd-mini">${tag}</span></div>`;
    });
  }
  return h;
}

function _ctrl(suffix, total, revIdx) {
  const done = revIdx >= total - 1;
  return `<div class="hd-ctrl" id="hd-ctrl-${suffix}" style="${done ? 'display:none' : ''}">
      <button class="hd-btn" onclick="hungRevealNext('hd-${suffix}',${total})">Next →</button>
      <span class="hd-cnt" id="hd-cnt-${suffix}">${Math.max(0, revIdx + 1)} / ${total}</span>
      <button class="hd-btn all" onclick="hungRevealAll('hd-${suffix}',${total})">Reveal all</button>
    </div>
    <div class="hd-done" id="hd-done-${suffix}" style="${done ? '' : 'display:none'}">— the tank goes quiet —</div>`;
}
function _steps(suffix, stepHtmls, revIdx) {
  return stepHtmls.map((html, i) =>
    `<div class="hd-step" id="hd-step-${suffix}-${i}" style="display:${i <= revIdx ? '' : 'none'}">${html}</div>`).join('');
}

function _evCard(ev) {
  const avs = (ev.players && ev.players.length) ? `<div class="hd-avs">${ev.players.map(n => portrait(n, 30)).join('')}</div>` : '';
  if (ev.type === 'round') return `<div class="hd-round"><div class="hd-round-t">${ev.label}</div><div class="hd-round-x">${ev.text}</div></div>`;
  if (ev.type === 'flavor') return `<div class="hd-card flavor">${avs}<div class="hd-txt">${ev.text}</div></div>`;
  if (ev.type === 'exchange') {
    const modeTag = { emotional: '🎯 GOING AT A RIVAL', strategic: '🧠 HUNTING A LIAR', random: '🎲 ASKS AT RANDOM' }[ev.mode];
    const modeHtml = modeTag ? `<span class="hd-mode ${ev.mode}">${modeTag}</span> ` : '';
    const stamp = ev.verdict === 'truth'
      ? `<span class="hd-stamp truth">TRUTH ✓</span> <span class="hd-stamp cost">${ev.asker} −1 🪢</span>`
      : `<span class="hd-stamp lie">LIE ✗ &nbsp;${ev.answerer} −${ev.ropesLost || 1} 🪢</span>`;
    return `<div class="hd-card ${ev.verdict}">${avs}<div class="hd-txt">${modeHtml}${stamp}<br>${ev.text}</div></div>`;
  }
  if (ev.type === 'fall') {
    const tag = ev.reason === 'out of rope' ? 'OUT OF ROPE' : ev.reason === 'let go' ? 'LET GO' : 'LOST GRIP';
    return `<div class="hd-card fall">${avs}<div class="hd-txt"><span class="hd-stamp fall">💦 ${tag}</span><br>${ev.text}</div></div>`;
  }
  if (ev.type === 'win') return `<div class="hd-card win">${avs}<div class="hd-txt"><span class="hd-stamp win">IMMUNITY ✦ — LAST ONE HANGING</span><br>${ev.text}</div></div>`;
  if (ev.type === 'strain') return `<div class="hd-card strain">${avs}<div class="hd-txt"><span class="hd-stamp strain">💪 THE BURN</span><br>${ev.text}</div></div>`;
  if (ev.type === 'nearmiss') return `<div class="hd-card nearmiss">${avs}<div class="hd-txt"><span class="hd-stamp near">⚠ ONE HAND SLIPS</span><br>${ev.text}</div></div>`;
  if (ev.type === 'taunt') return `<div class="hd-card taunt"><span class="hd-ico">🎙️</span><div class="hd-txt">${ev.text}</div></div>`;
  if (ev.type === 'reaction') {
    const styleLbl = {
      clapback: { explosive: '💢 GOES OFF', cold: '🧊 ICE COLD', composed: '😤 STANDS FIRM', timid: '😟 STUNG', wounded: '💔 THAT HURT' },
      betrayedAlly: { explosive: '🗯️ FURIOUS', cold: '🧊 GOES COLD', composed: '💔 BETRAYED', timid: '😞 CRUSHED', wounded: '💔 HEARTBROKEN' },
    };
    let lbl;
    if (ev.cat === 'fight') lbl = '🔥 IT ESCALATES';
    else if (ev.cat === 'warm') lbl = '🤝 RIGHT BACK AT YOU';
    else if (ev.cat === 'romance') lbl = '💘 RECIPROCATED';
    else if (ev.cat === 'exposed') lbl = '😬 COVER BLOWN';
    else lbl = (styleLbl[ev.cat] && styleLbl[ev.cat][ev.style]) || '👀 REACTION';
    const cls = ev.cat === 'fight' ? 'fight' : (ev.cat === 'clapback' && (ev.style === 'timid' || ev.style === 'wounded')) ? 'hurt' : ev.cat;
    return `<div class="hd-card reaction ${cls}">${avs}<div class="hd-txt"><span class="hd-stamp react">${lbl}</span><br>${ev.text}</div></div>`;
  }
  return `<div class="hd-card">${avs}<div class="hd-txt">${ev.text}</div></div>`;
}

// ══════════════════════════════════════════════════════════════
// HANG ARENA — a live wooden bar of dangling puppets over a shark tank.
// Built from a state snapshot; on each reveal a fallen player's puppet drops into the water.
// ══════════════════════════════════════════════════════════════
function _ropeStrands(r) { return [0, 1, 2].map(i => `<div class="hd-strand ${i < r ? '' : 'cut'}"></div>`).join(''); }

function _hdPuppet(name, ropes, trembling, left, scale, isWinner) {
  const sl = slugOf(name);
  return `<div class="hd-slot ${isWinner ? 'hd-winner' : ''}" data-name="${name.replace(/"/g, '&quot;')}" style="left:${left}%;--s:${scale}">
    <div class="hd-sway ${trembling ? 'trem' : ''}">
      <svg width="128" height="180" viewBox="0 0 128 180" style="position:absolute;top:0;left:0">
        <path d="M52 60 C40 42 40 20 46 6" stroke="#e8b48a" stroke-width="10" fill="none" stroke-linecap="round"/>
        <path d="M76 60 C88 42 88 20 82 6" stroke="#e8b48a" stroke-width="10" fill="none" stroke-linecap="round"/>
        <path d="M44 34 q6 -8 10 0" stroke="#c88a58" stroke-width="3" fill="none" stroke-linecap="round"/>
        <path d="M74 34 q6 -8 10 0" stroke="#c88a58" stroke-width="3" fill="none" stroke-linecap="round"/>
        <circle cx="45" cy="5" r="8" fill="#f0c096" stroke="#a06a3a" stroke-width="2"/>
        <circle cx="83" cy="5" r="8" fill="#f0c096" stroke="#a06a3a" stroke-width="2"/>
        <path d="M48 82 Q64 76 80 82 L77 128 Q64 134 51 128 Z" fill="#e8b48a" stroke="#b07a4a" stroke-width="1.5"/>
        <path d="M64 86 L64 122" stroke="#c88a58" stroke-width="1.5" opacity=".7"/>
        <path d="M54 100 h20 M55 110 h18" stroke="#c88a58" stroke-width="1.2" opacity=".55"/>
        <path d="M50 126 h28 v8 h-28 Z" fill="#2a4a8a"/>
        <path d="M57 134 L54 166" stroke="#e8b48a" stroke-width="8" stroke-linecap="round"/>
        <path d="M71 134 L74 166" stroke="#e8b48a" stroke-width="8" stroke-linecap="round"/>
        <g stroke="#fff" stroke-width="2" opacity="0.5" stroke-linecap="round"><path d="M34 24 l-8 -4"/><path d="M94 24 l8 -4"/></g>
      </svg>
      <div class="hd-p-helm"><div class="hd-p-scr">☠</div></div>
      <img class="hd-p-face" src="assets/avatars/${sl}.png" onerror="this.style.visibility='hidden'">
      ${trembling ? '<div class="hd-sweat a"></div><div class="hd-sweat b"></div>' : ''}
      <div class="hd-ropebox">${_ropeStrands(ropes)}</div>
      <div class="hd-p-name">${name}</div>
    </div>
  </div>`;
}
function _hdBob(name, left) { return `<img class="hd-bob" src="assets/avatars/${slugOf(name)}.png" style="left:${left}%" onerror="this.style.visibility='hidden'">`; }
function _waterDeco() {
  return `<svg class="hd-shark" viewBox="0 0 150 44"><path d="M2 30 Q40 8 96 22 Q120 26 148 14 Q132 34 116 34 Q126 44 108 42 Q96 34 78 36 Q40 40 2 30 Z" fill="#0a2c34"/></svg>
    <div class="hd-fin"></div><div class="hd-fin" style="animation-delay:-3.5s"></div>`;
}
function _hangingCount(roster, snap) { const out = new Set((snap.out || []).map(o => o.name)); return roster.filter(n => !out.has(n)).length; }

function _hdArenaHTML(roster, slots, scale, snap, label) {
  const out = new Set((snap.out || []).map(o => o.name));
  const tremble = new Set(snap.trembling || []);
  const hanging = roster.filter(n => !out.has(n));
  const pup = hanging.map(n => _hdPuppet(n, snap.ropes?.[n] ?? 3, tremble.has(n), slots[n] ?? 50, scale, n === snap.winner)).join('');
  const bobs = (snap.out || []).map(o => _hdBob(o.name, slots[o.name] ?? 50)).join('');
  return `<div class="hd-hud"><span>STILL HANGING · <span class="hd-hud-cnt">${hanging.length}</span></span><span class="hd-hud-r">${label}</span></div>
    <div class="hd-rig"></div><div class="hd-rig hd-r"></div><div class="hd-bar"></div>
    <div class="hd-pups">${pup}</div>
    <div class="hd-water">${_waterDeco()}${bobs}</div>`;
}
// live mutation of the arena as a single reveal step plays out
function _hdArenaStep(suffix, revIdx) {
  const events = window[`hd_${suffix}_events`]; if (!events) return;
  const ev = events[revIdx]; if (!ev) return;
  const arena = document.getElementById(`hd-arena-${suffix}`); if (!arena) return;
  const snap = ev.snap || {};
  const roster = window.hdRoster || [];
  const cnt = arena.querySelector('.hd-hud-cnt'); if (cnt) cnt.textContent = _hangingCount(roster, snap);
  const tremble = new Set(snap.trembling || []);
  const slots = [...arena.querySelectorAll('.hd-slot')];
  slots.forEach(el => { const sw = el.querySelector('.hd-sway'); if (sw) sw.classList.toggle('trem', tremble.has(el.dataset.name)); });
  const slotFor = (name) => slots.find(el => el.dataset.name === name);
  if (ev.type === 'fall') {
    const el = slotFor(ev.player);
    if (el) {
      el.classList.add('hd-falling');
      const left = parseFloat(el.style.left) || 50;
      setTimeout(() => { try { el.remove(); const w = arena.querySelector('.hd-water'); if (w) w.insertAdjacentHTML('beforeend', _hdBob(ev.player, left)); } catch (e) {} }, 1050);
    }
  } else if (ev.type === 'exchange') {
    // flash the ANSWERER's helmet: green = truth, ambulance-red buzz = caught lie
    const ael = slotFor(ev.answerer);
    if (ael) {
      const scr = ael.querySelector('.hd-p-scr');
      if (scr) { scr.classList.remove('hd-truth', 'hd-lie'); void scr.offsetWidth; scr.classList.add(ev.verdict === 'truth' ? 'hd-truth' : 'hd-lie'); setTimeout(() => scr.classList.remove('hd-truth', 'hd-lie'), 1600); }
    }
    // fray the ROPE-LOSER's strands (asker pays on a truth, answerer pays on a lie) + jolt them
    const loser = ev.ropeLoser || (ev.verdict === 'lie' ? ev.answerer : ev.asker);
    const lel = slotFor(loser);
    if (lel) {
      const box = lel.querySelector('.hd-ropebox'); if (box) box.innerHTML = _ropeStrands(snap.ropes?.[loser] ?? 0);
      const sw = lel.querySelector('.hd-sway'); if (sw) { sw.classList.add('hd-jolt'); setTimeout(() => sw.classList.remove('hd-jolt'), 420); }
    }
  } else if (ev.type === 'win') {
    const el = slotFor(ev.player); if (el) el.classList.add('hd-winner');
  }
}
function _hdArenaSync(suffix, snap, label) {
  const arena = document.getElementById(`hd-arena-${suffix}`); if (!arena) return;
  arena.innerHTML = _hdArenaHTML(window.hdRoster || [], window.hdSlots || {}, window.hdScale || 1, snap, label);
}

export function rpBuildHungTitleCard(ep) {
  const r = ep.hungOut; if (!r) return '';
  const active = ep.tribalPlayers || [];
  const badges = active.map(n =>
    `<div class="hd-badge"><div class="hd-helm"></div><img src="assets/avatars/${slugOf(n)}.png" onerror="this.style.display='none'"><span>${n}</span></div>`
  ).join('');
  return _shell(`
    <div class="hd-cover">
      <div class="hd-sub">STAWAKI CARNIVAL · LIE-DETECTOR CLASSIC</div>
      <div class="hd-title">HUNG OUT<br>TO <b>DRY</b></div>
      <div class="hd-sub" style="margin-top:10px">3 ROPES · 1 HELMET · ${active.length} LIARS OVER A SHARK TANK</div>
      <div class="hd-tag">"${r.open}"</div>
      <div class="hd-tag" style="color:var(--truth)">Tell the truth and keep your ropes — but the truth will cost you friends. Lie and the helmet cuts a rope. Fall, and the sharks say hello. Last one hanging is safe tonight.</div>
      <div class="hd-roster">${badges}</div>
    </div>
  `);
}

// generic round screen
function _renderRound(ep, ri, suffix, title) {
  const r = ep.hungOut; if (!r) return '';
  const key = `hd-${suffix}`;
  if (!window._tvState) window._tvState = {};
  if (!window._tvState[key]) window._tvState[key] = { idx: -1 };
  const revIdx = window._tvState[key].idx;
  window.hdData = r; r._roster = ep.tribalPlayers || [];

  const evs = r.rounds[ri].events;
  const steps = evs.map(_evCard);
  window[`hd_${suffix}_snaps`] = evs.map(e => e.snap);
  window[`hd_${suffix}_events`] = evs;
  window[`hd_${suffix}_label`] = title;

  const firstSnap = evs[0]?.snap || { ropes: {}, out: [], winner: null };
  const curSnap = evs[Math.max(0, revIdx)]?.snap || firstSnap;

  // fixed horizontal slot per roster player (so a puppet — or its water splash — stays put across rounds)
  const roster = r._roster;
  const N = roster.length;
  const slots = {}; roster.forEach((n, i) => { slots[n] = N > 1 ? 6 + i * (88 / (N - 1)) : 50; });
  const scale = clamp(9 / Math.max(1, N), 0.52, 1);
  window.hdRoster = roster; window.hdSlots = slots; window.hdScale = scale;

  return _shell(`
    <div class="hd-arena" id="hd-arena-${suffix}">${_hdArenaHTML(roster, slots, scale, curSnap, title)}</div>
    <div class="hd-layout">
      <div class="hd-feed">
        <div class="hd-round-t" style="font-size:24px;margin:2px 0 4px">${title}</div>
        ${_steps(suffix, steps, revIdx)}
        ${_ctrl(suffix, steps.length, revIdx)}
      </div>
      <div class="hd-side" id="hd-side-${suffix}">${_sidebar(r._roster, curSnap)}</div>
    </div>
  `);
}

export function rpBuildHungWarmup(ep) { return _renderRound(ep, 0, 'warmup', 'Round I · Warm-Up'); }
export function rpBuildHungKnife(ep) { return _renderRound(ep, 1, 'knife', 'Round II · The Knife'); }
export function rpBuildHungFinal(ep) { return _renderRound(ep, 2, 'final', 'Round III · Final Interrogation'); }

function _hdUpdateSidebar(screenKey, revIdx) {
  const suffix = screenKey.replace('hd-', '');
  const sideEl = document.getElementById(`hd-side-${suffix}`);
  const r = window.hdData;
  if (!sideEl || !r) return;
  const snaps = window[`hd_${suffix}_snaps`] || [];
  const snap = snaps[Math.max(0, revIdx)] || snaps[0] || { ropes: {}, out: [], winner: null };
  sideEl.innerHTML = _sidebar(r._roster || [], snap);
}

export function hungRevealNext(screenKey, total) {
  if (!window._tvState) window._tvState = {};
  if (!window._tvState[screenKey]) window._tvState[screenKey] = { idx: -1 };
  const st = window._tvState[screenKey];
  if (st.idx >= total - 1) return;
  st.idx++;
  const suffix = screenKey.replace('hd-', '');
  const el = document.getElementById(`hd-step-${suffix}-${st.idx}`);
  if (el) { el.style.display = ''; el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
  const cnt = document.getElementById(`hd-cnt-${suffix}`);
  if (cnt) cnt.textContent = `${st.idx + 1} / ${total}`;
  if (st.idx >= total - 1) {
    const c = document.getElementById(`hd-ctrl-${suffix}`); if (c) c.style.display = 'none';
    const d = document.getElementById(`hd-done-${suffix}`); if (d) d.style.display = '';
  }
  _hdUpdateSidebar(screenKey, st.idx);
  try { _hdArenaStep(suffix, st.idx); } catch (e) {}
}

export function hungRevealAll(screenKey, total) {
  if (!window._tvState) window._tvState = {};
  if (!window._tvState[screenKey]) window._tvState[screenKey] = { idx: -1 };
  const st = window._tvState[screenKey];
  const suffix = screenKey.replace('hd-', '');
  for (let i = st.idx + 1; i < total; i++) {
    const el = document.getElementById(`hd-step-${suffix}-${i}`);
    if (el) el.style.display = '';
  }
  st.idx = total - 1;
  const cnt = document.getElementById(`hd-cnt-${suffix}`);
  if (cnt) cnt.textContent = `${total} / ${total}`;
  const c = document.getElementById(`hd-ctrl-${suffix}`); if (c) c.style.display = 'none';
  const d = document.getElementById(`hd-done-${suffix}`); if (d) d.style.display = '';
  _hdUpdateSidebar(screenKey, st.idx);
  // jump the arena straight to the final state of this round
  try {
    const snaps = window[`hd_${suffix}_snaps`] || [];
    _hdArenaSync(suffix, snaps[total - 1] || snaps[snaps.length - 1] || {}, window[`hd_${suffix}_label`] || '');
  } catch (e) {}
}
