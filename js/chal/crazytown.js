// js/chal/crazytown.js — 3:10 to Crazytown Western challenge
import { gs, players, seasonConfig } from '../core.js';
import { pStats, pronouns, updateChalRecord, romanticCompat } from '../players.js';
import { addBond, getBond } from '../bonds.js';

// ── Text pools ──────────────────────────────────────────────────────────────

const HORSE_DIVE_JUMPED = {
  high: [
    (name, pr) => `${name} charges down the platform like ${pr.posAdj} boots are on fire, launching off the edge without so much as a flinch.`,
    (name, pr) => `${name} lets out a war whoop and goes airborne — ${pr.sub}'s in the saddle and the water's just the next stop on the trail.`,
    (name, pr) => `${name} tips ${pr.posAdj} hat to the crowd and steps off the edge like it's a sidewalk. Pure outlaw confidence.`,
    (name, pr) => `With a grin that'd scare a rattlesnake, ${name} blasts off the platform and drops into the tank below.`,
  ],
  mid: [
    (name, pr) => `${name} takes a breath, steadies ${pr.posAdj} nerve, and commits — off the edge and into the unknown.`,
    (name, pr) => `${name} mutters something under ${pr.posAdj} breath, then steps off the platform with grim determination.`,
    (name, pr) => `After a beat of hesitation, ${name} decides the water's better than the shame. ${pr.Sub} jumps.`,
    (name, pr) => `${name} plants both feet and goes — not pretty, not flashy, but the deed is done.`,
  ],
  low: [
    (name, pr) => `${name} shakes visibly at the edge before finally tipping forward, a yelp trailing ${pr.obj} all the way down.`,
    (name, pr) => `With closed eyes and a prayer, ${name} pushes off the platform — barely a jump, more of a controlled fall.`,
    (name, pr) => `${name} nearly turns back twice before ${pr.sub} pitches off the edge, arms flailing like a tumbleweed in a twister.`,
    (name, pr) => `${name} squeaks out a tiny "okay" and stumbles off the platform, splashing into the tank below with zero grace.`,
  ],
};

const HORSE_DIVE_CHICKEN = {
  high: [
    (name, pr) => `${name} pulls up hard at the lip of the platform, spurs scraping the planks — ${pr.sub} wasn't ready for THIS stretch of the trail.`,
    (name, pr) => `${name} gets to the edge, looks down, and shakes ${pr.posAdj} head once. Not today. ${pr.Sub} backs away without explanation.`,
    (name, pr) => `${name} plants ${pr.posAdj} boots and refuses to budge, staring down the drop with the eyes of someone who's done the math and doesn't like it.`,
    (name, pr) => `For all ${pr.posAdj} swagger, ${name} stops dead at the platform edge — the canyon's too wide, and ${pr.sub} knows it.`,
  ],
  mid: [
    (name, pr) => `${name} backs away from the platform, spurs scraping the planks — ${pr.sub} mutters something about the water looking "awful dark."`,
    (name, pr) => `${name} creeps to the edge, peers down, and retreats. No fanfare, just a quiet step back and a long sigh.`,
    (name, pr) => `${name} stands at the platform's lip for ten full seconds before ${pr.posAdj} nerve deserts ${pr.obj} entirely.`,
    (name, pr) => `The jump looks easy from the ground. Up here, ${name} decides it's a different story and backs off the platform.`,
  ],
  low: [
    (name, pr) => `${name} gets two steps from the edge and freezes — boots glued to the planks, face white as a ghost town.`,
    (name, pr) => `${name} shuffles toward the platform edge, spots the drop, and retreats with an audible "nope," spurs clicking against the wood.`,
    (name, pr) => `One look at the water and ${name} is done. ${pr.Sub} spins around so fast ${pr.posAdj} hat nearly flies off.`,
    (name, pr) => `${name} makes it exactly one step onto the platform before backing away, mumbling about a "bad feeling in ${pr.posAdj} boots."`,
  ],
};

const HORSE_DIVE_LANDING = {
  perfect: [
    (name, pr) => `${name} slices into the water clean as a whistle — the crowd sees the spray and the smile says it all.`,
    (name, pr) => `${name} hits the tank feet-first, picture-perfect. Even the judges in their rocking chairs have to tip their hats.`,
    (name, pr) => `A textbook entry. ${name} surfaces to a chorus of whoops — that's how you ride the bronco into the deep end.`,
  ],
  rough: [
    (name, pr) => `${name} makes it in but it's no oil painting — legs splayed, arms windmilling, landing in a tangle of limbs and splash.`,
    (name, pr) => `${name} hits the water sideways. ${pr.Sub} survives. The dignity doesn't fully recover, but ${pr.sub}'s in.`,
    (name, pr) => `It ain't pretty, but ${name} goes in and that's the point. The tribe takes the point and tries not to wince.`,
  ],
  bellyflop: [
    (name, pr) => `${name} goes flat as a pancake against the surface — the SLAP echoes across the lot. ${pr.Sub} bobs up red-faced.`,
    (name, pr) => `A full bellyflop from ${name}. Chris winces. The tribe winces. The water wins.`,
    (name, pr) => `${name} catches all the air on the way down and none of the angle — belly-first, maximum splash, minimum dignity.`,
  ],
  miss: [
    (name, pr) => `${name} clips the edge of the tank and tumbles in sideways — technically in, but the judges call it a miss. Zero points.`,
    (name, pr) => `${name} overcorrects mid-air and barely grazes the water outside the zone. The whistle blows. No score.`,
    (name, pr) => `A noble attempt from ${name}, but the landing is off the mark. Zero points, and a very long walk back to the tribe.`,
  ],
};

const HORSE_DIVE_HOST = {
  intro: [
    (host) => `${host} spreads ${host === 'Chris' ? 'his' : 'their'} arms wide from the top of the platform: "Welcome to the Horse Dive — where we separate the cowboys from the chickens! One at a time, partners!"`,
    (host) => `"Alright, saddle up!" ${host} bellows from the judge's booth. "Each of you rides the platform to the edge and takes the plunge. Points for style, points for courage — and zero for CHICKENING OUT!"`,
    (host) => `${host} tips ${host === 'Chris' ? 'his' : 'their'} wide-brimmed hat: "This ain't no petting zoo, folks. The tank's below, the platform's above, and there are no guarantees in the Wild West. Let's ride!"`,
  ],
  afterChicken: [
    (host, name) => `${host} shakes ${host === 'Chris' ? 'his' : 'their'} head slowly: "And ${name} loses ${host === 'Chris' ? 'their' : 'their'} nerve at the rail. Folks, that's what we in the business call… a chicken."`,
    (host, name) => `"${name}!" ${host} calls out. "The horse dove. You did not. Let's move on — try not to make eye contact with your tribe."`,
    (host, name) => `${host} sighs theatrically into the microphone. "Zero points for ${name}. The Wild West has no mercy for the faint of heart, pardner."`,
  ],
  afterBoldJump: [
    (host, name) => `${host} pumps a fist: "THAT'S what I'm talking about! ${name} with absolutely no hesitation — pure outlaw energy!"`,
    (host, name) => `"Oh, ${name} is NOT playing around today!" ${host} shouts. "That's the spirit of the frontier right there, folks!"`,
    (host, name) => `${host} grins from the booth: "${name} with ZERO fear. I love this cast sometimes."`,
  ],
  afterScaredJump: [
    (host, name) => `${host} gives a slow clap: "They were scared. They jumped anyway. That's a point for ${name} and a point for personal growth."`,
    (host, name) => `"Barely made it, but made it counts!" ${host} calls out. "${name} with the shaky but successful plunge!"`,
    (host, name) => `${host} nods approvingly: "Not pretty — but ${name} went over the edge and that's all the scoreboard needs."`,
  ],
};

const HORSE_DIVE_CONVINCE_SUCCESS = [
  (talker, chicken, tPr, cPr) => `${talker} gets alongside ${chicken} and talks ${cPr.obj} through it step by step — ${cPr.sub} nods, steadies, and goes.`,
  (talker, chicken, tPr, cPr) => `"You can do it," ${talker} says, and somehow that's enough. ${chicken} takes a breath and launches off the edge.`,
  (talker, chicken, tPr, cPr) => `${talker} puts a hand on ${chicken}'s shoulder and whispers something nobody else can hear. Whatever it is, ${cPr.sub} jumps.`,
  (talker, chicken, tPr, cPr) => `After thirty seconds of ${talker}'s steady talk, ${chicken} raises ${cPr.posAdj} chin and steps off the platform.`,
];

const HORSE_DIVE_CONVINCE_FAIL = [
  (talker, chicken, tPr, cPr) => `${talker} tries every angle but ${chicken} won't move. ${cPr.Sub} plants ${cPr.posAdj} boots and shakes ${cPr.posAdj} head.`,
  (talker, chicken, tPr, cPr) => `${talker}'s pep talk runs dry. ${chicken} listens politely and then steps back from the edge anyway.`,
  (talker, chicken, tPr, cPr) => `${talker} gestures, reasons, pleads — ${chicken} just stares at the water and refuses to move.`,
  (talker, chicken, tPr, cPr) => `All of ${talker}'s words can't shift ${chicken} from the spot. ${cPr.Sub} watches the others jump and does not follow.`,
];

const HORSE_DIVE_FORCE_SUCCESS = [
  (thrower, chicken, tPr, cPr) => `${thrower} runs out of patience, grabs ${chicken} by the arm, and the two of them go off the edge together — chaotic, but it counts.`,
  (thrower, chicken, tPr, cPr) => `With a sharp shove from ${thrower}, ${chicken} yelps and goes airborne. Not exactly voluntary, but the scoreboard doesn't care.`,
  (thrower, chicken, tPr, cPr) => `${thrower} physically maneuvers ${chicken} to the edge. There's a brief scuffle, and then ${cPr.sub}'s in the air — and then in the tank.`,
  (thrower, chicken, tPr, cPr) => `${thrower} roars "GO!" and gives ${chicken} just enough of a nudge. ${chicken} screams the whole way down.`,
];

const HORSE_DIVE_FORCE_FAIL = [
  (thrower, chicken, tPr, cPr) => `${thrower} tries to push ${chicken} forward and nearly goes over ${tPr.pos} instead. ${chicken} sidesteps and the moment collapses.`,
  (thrower, chicken, tPr, cPr) => `${chicken} braces hard against ${thrower}'s shove. Nobody moves. It's a stalemate, and the tribe groans.`,
  (thrower, chicken, tPr, cPr) => `${thrower} lunges toward ${chicken}, who ducks aside. The push misses completely and they both look foolish.`,
  (thrower, chicken, tPr, cPr) => `${thrower}'s intervention backfires — ${chicken} digs in harder and ${cPr.sub}'s going nowhere.`,
];

const HORSE_DIVE_HOST_INTERVENTION = {
  convinceSuccess: [
    (host, actor, chicken) => `${host} leans into the mic: "And ${actor} talks ${chicken} off the ledge — wait, no, ONTO the ledge. Impressive!"`,
    (host, actor, chicken) => `"I did NOT expect that pep talk to work," ${host} admits from the booth, "but here we are. ${chicken} is going in!"`,
    (host, actor, chicken) => `${host} scribbles a note: "Credit ${actor} with the assist. That's Western teamwork, folks."`,
  ],
  convinceFail: [
    (host, actor, chicken) => `${host} winces: "And the pep talk from ${actor}… goes absolutely nowhere. ${chicken} is unmoved."`,
    (host, actor, chicken) => `"${actor} gave it everything," ${host} sighs into the mic, "and ${chicken} gave them nothing. Moving on."`,
    (host, actor, chicken) => `${host} shrugs dramatically at the camera: "${actor} tried. ${chicken} refused. The scoreboard reflects accordingly."`,
  ],
  forceSuccess: [
    (host, actor, chicken) => `${host} raises an eyebrow: "Was that a jump or a push? Either way — the tank has ${chicken}. I'll allow it."`,
    (host, actor, chicken) => `"${actor} took matters into ${actor === 'Chris' ? 'his' : 'their'} own hands," ${host} observes, "and ${chicken} is now very wet. I respect the hustle."`,
    (host, actor, chicken) => `${host} cackles into the mic: "Classic ${actor}! One way or another, ${chicken} was getting in that tank!"`,
  ],
  forceFail: [
    (host, actor, chicken) => `${host} covers ${host === 'Chris' ? 'his' : 'their'} face: "That was painful to watch. ${actor} tried to move ${chicken}. ${chicken} did not move."`,
    (host, actor, chicken) => `"Nobody wins when brute force meets stubborn refusal," ${host} announces. "And that's the lesson of the day, courtesy of ${actor} and ${chicken}."`,
    (host, actor, chicken) => `${host} just shakes ${host === 'Chris' ? 'his' : 'their'} head at the camera: "${actor} pushed. ${chicken} didn't budge. Zero for everyone involved."`,
  ],
};

// ── Standoff text pools ──────────────────────────────────────────────────────

const STANDOFF_HOST = {
  intro: [
    (host) => `${host} strides into the center of the circle, revolver twirling: "Alright, gunslingers — welcome to the MEXICAN STANDOFF! Last tribe standing takes the round. Draw!"`,
    (host) => `"Saddle up, because Phase Two is no tea party!" ${host} bellows. "This is the Mexican Standoff — two shots to drop a cowboy, and EVERYONE is a target. Let's ride!"`,
    (host) => `${host} sweeps an arm across the dusty arena: "You survived the dive. Now survive each other. The standoff starts… NOW!"`,
  ],
  roundStart: [
    (host, roundNum) => `${host} fires a starter pistol into the air: "Round ${roundNum}! Pick your targets and make 'em count!"`,
    (host, roundNum) => `"Round ${roundNum}!" ${host} calls out. "The circle gets smaller. The stakes get bigger. Shoot smart, pardners."`,
    (host, roundNum) => `${host} tips ${host === 'Chris' ? 'his' : 'their'} hat: "Round ${roundNum} — you've seen who's dangerous. Now do something about it."`,
  ],
  elimination: [
    (host, name) => `${host} points a finger: "${name} takes the second hit! Holster up, partner — you're done."`,
    (host, name) => `"And that's two for ${name}!" ${host} announces. "You fought well. Now get off my film lot."`,
    (host, name) => `${host} shakes ${host === 'Chris' ? 'his' : 'their'} head in mock sympathy: "${name} has been outdrawn. The Wild West is cruel."`,
  ],
  finalRound: [
    (host) => `${host} grins at the survivors: "Last guns standing. Make this round count — there's no coming back from the next hit."`,
    (host) => `"Final survivors!" ${host} shouts. "This is it. The last round of the Standoff. Leave it all on the draw."`,
    (host) => `${host} spreads ${host === 'Chris' ? 'his' : 'their'} arms wide: "We're down to the wire, folks. One more exchange and we'll have our winner."`,
  ],
};

const STANDOFF_SHOT = {
  hit: [
    (shooter, target, sPr, tPr) => `${shooter} draws fast and true — the shot catches ${target} square. ${tPr.Sub} staggers back, marked.`,
    (shooter, target, sPr, tPr) => `${shooter} lines up ${sPr.posAdj} shot with a steady hand and fires. ${target} takes the hit and doesn't look happy about it.`,
    (shooter, target, sPr, tPr) => `${shooter} doesn't hesitate — ${sPr.sub} picks ${target} and pulls the trigger before ${tPr.sub} can react.`,
  ],
  miss: [
    (shooter, target, sPr, tPr) => `${shooter} fires wide — ${target} sidesteps and the shot kicks up dust beside ${tPr.obj}.`,
    (shooter, target, sPr, tPr) => `${shooter}'s aim wanders under pressure. The shot sails past ${target}, who barely blinks.`,
    (shooter, target, sPr, tPr) => `${shooter} pulls the trigger but nerves get the better of ${sPr.obj}. ${target} ducks and the round goes nowhere useful.`,
  ],
  shield: [
    (shooter, target, sPr, tPr) => `Before the shot lands on ${target}, a teammate steps into the line of fire — taking the hit to protect ${tPr.obj}.`,
    (shooter, target, sPr, tPr) => `A loyal hand throws ${target === 'Chris' ? 'himself' : 'themselves'} in front of ${target} — the bullet's theirs now. ${target} owes them one.`,
    (shooter, target, sPr, tPr) => `${target} would've taken that hit — but a loyal teammate absorbs it instead, staggering back with grim resolve.`,
  ],
  betrayal: [
    (shooter, target, sPr, tPr) => `${shooter} pivots — and fires directly at ${target}, ${sPr.posAdj} own ally. The circle goes quiet.`,
    (shooter, target, sPr, tPr) => `Nobody expected ${shooter} to turn the gun on ${target}. ${sPr.Sub} did it anyway, and the whole arena saw it.`,
    (shooter, target, sPr, tPr) => `${shooter} lined up the shot on an opponent — then at the last second, wheeled and shot ${target} instead. Cold.`,
  ],
  hesitation: [
    (shooter, target, sPr, tPr) => `${shooter} raises ${sPr.posAdj} gun toward ${target} — then lowers it. ${tPr.Sub} is someone ${sPr.sub} can't bring ${sPr.obj}self to shoot.`,
    (shooter, target, sPr, tPr) => `${shooter}'s hand shakes as ${sPr.sub} stares across at ${target}. The shot never comes. The moment passes.`,
    (shooter, target, sPr, tPr) => `${sPr.Sub} had the angle on ${target} but hesitates — something stops ${sPr.obj}, and the round ticks by without a shot from ${shooter}.`,
  ],
};

const STANDOFF_ELIMINATION = [
  (name, pr) => `${name} holsters ${pr.posAdj} gun and walks slowly away from the circle — two hits is two too many in this rodeo.`,
  (name, pr) => `${name} takes the second mark square and steps out of the standoff. ${pr.Sub} tips ${pr.posAdj} hat to the survivors and finds a seat in the dust.`,
  (name, pr) => `Two hits and ${name} is done. ${pr.Sub} backs out of the ring — outdrawn and outnumbered, but not out of the game yet.`,
  (name, pr) => `The circle closes on ${name}. ${pr.Sub} accepts the verdict with a jaw set tight and walks off the lot, spurs clinking.`,
];

// ── Drama Break text pools ────────────────────────────────────────────────────

const DRAMA_BREAK_EVENTS = [
  {
    id: 'cross-tribe-taunt',
    badge: 'Trash Talk', badgeClass: 'red',
    check(tribeMembers) {
      const all = tribeMembers.flatMap(t => t.members.map(m => ({ name: m, tribe: t.name })));
      for (let i = 0; i < all.length; i++) {
        for (let j = i + 1; j < all.length; j++) {
          if (all[i].tribe !== all[j].tribe && getBond(all[i].name, all[j].name) <= -2) {
            return { actor: all[i].name, target: all[j].name };
          }
        }
      }
      return null;
    },
    apply({ actor, target }) {
      const aPr = pronouns(actor);
      const tPr = pronouns(target);
      addBond(actor, target, -0.3);
      if (!gs.popularity) gs.popularity = {};
      gs.popularity[actor] = (gs.popularity[actor] || 0) - 1;
      const lines = [
        `${actor} calls across the divide at ${target}: "Nice try out there, partner. Real nice." The venom underneath isn't lost on anyone.`,
        `${actor} locks eyes with ${target} and just grins — the kind of grin that says "I'm coming for you next." ${tPr.Sub} doesn't blink.`,
        `${actor} mutters something to ${aPr.posAdj} tribe about ${target} being overrated. It carries. ${target} hears every word.`,
      ];
      return { actor, target, text: lines[Math.floor(Math.random() * lines.length)], players: [actor, target] };
    },
  },
  {
    id: 'alliance-huddle',
    badge: 'War Council', badgeClass: 'blue',
    check(tribeMembers) {
      for (const t of tribeMembers) {
        for (const name of t.members) {
          const allies = t.members.filter(m => m !== name && getBond(name, m) >= 3);
          if (allies.length >= 1) return { actor: name, allies: allies.slice(0, 2), tribe: t.name };
        }
      }
      return null;
    },
    apply({ actor, allies, tribe }) {
      const aPr = pronouns(actor);
      for (const ally of allies) { addBond(actor, ally, 0.2); }
      const allyStr = allies.length === 1 ? allies[0] : `${allies[0]} and ${allies[1]}`;
      const lines = [
        `${actor} pulls ${allyStr} aside during the break and maps out the rest of the challenge in hushed tones. The circle tightens.`,
        `${actor} leans in close with ${allyStr} — not relaxing, strategizing. The tribe break is a war council in disguise.`,
        `Between phases, ${actor} and ${allyStr} are already talking targets. The next round is going to be personal.`,
      ];
      return { actor, allies, text: lines[Math.floor(Math.random() * lines.length)], players: [actor, ...allies] };
    },
  },
  {
    id: 'showmance-moment',
    badge: 'Showmance', badgeClass: 'pink',
    check(tribeMembers, result) {
      if (!seasonConfig.romance) return null;
      const all = tribeMembers.flatMap(t => t.members);
      for (const sm of (gs.showmances || [])) {
        if (all.includes(sm.a) && all.includes(sm.b) && romanticCompat(sm.a, sm.b) >= 0.4) {
          return { actor: sm.a, target: sm.b };
        }
      }
      return null;
    },
    apply({ actor, target }) {
      const aPr = pronouns(actor);
      const tPr = pronouns(target);
      addBond(actor, target, 0.3);
      const lines = [
        `${actor} catches ${target}'s eye across the arena and holds it a beat too long. The rest of the challenge fades out for a second.`,
        `During the break, ${actor} finds ${target} and says something quiet. ${tPr.Sub} laughs — actually laughs. The moment is short but real.`,
        `${actor} and ${target} orbit each other during downtime without a word. Everyone notices. Nobody says anything.`,
      ];
      return { actor, target, text: lines[Math.floor(Math.random() * lines.length)], players: [actor, target] };
    },
  },
  {
    id: 'injury-check',
    badge: 'Winded', badgeClass: 'gray',
    check(tribeMembers) {
      const all = tribeMembers.flatMap(t => t.members);
      const candidates = all.filter(n => pStats(n).endurance <= 4);
      if (candidates.length === 0) return null;
      return { actor: candidates[Math.floor(Math.random() * candidates.length)] };
    },
    apply({ actor }) {
      const aPr = pronouns(actor);
      const lines = [
        `${actor} bends over between phases, hands on ${aPr.posAdj} knees. The challenge is taking more out of ${aPr.obj} than ${aPr.sub} expected.`,
        `${actor} waves off concern from ${aPr.posAdj} tribe — ${aPr.sub}'s fine, ${aPr.sub} insists. The sweat soaking through ${aPr.posAdj} shirt says otherwise.`,
        `${actor} needs a moment. ${aPr.Sub} leans against the fence, catching ${aPr.posAdj} breath with the focus of someone trying very hard not to show weakness.`,
      ];
      if (!gs.popularity) gs.popularity = {};
      gs.popularity[actor] = (gs.popularity[actor] || 0) - 1;
      return { actor, text: lines[Math.floor(Math.random() * lines.length)], players: [actor] };
    },
  },
  {
    id: 'pep-talk',
    badge: 'Rally Cry', badgeClass: 'green',
    check(tribeMembers) {
      for (const t of tribeMembers) {
        for (const name of t.members) {
          const st = pStats(name);
          if (st.social >= 6 && st.loyalty >= 5) {
            const teammates = t.members.filter(m => m !== name);
            if (teammates.length > 0) return { actor: name, tribe: t.name, teammates: teammates.slice(0, 3) };
          }
        }
      }
      return null;
    },
    apply({ actor, tribe, teammates }) {
      const aPr = pronouns(actor);
      for (const tm of teammates) { addBond(actor, tm, 0.15); }
      if (!gs.popularity) gs.popularity = {};
      gs.popularity[actor] = (gs.popularity[actor] || 0) + 1;
      const lines = [
        `${actor} gathers ${aPr.posAdj} tribe and lays it out straight: "We're not done. We finish this together." The tribe stands a little taller.`,
        `${actor} moves through ${aPr.posAdj} teammates one by one — a word here, a hand on the shoulder there. By the end, the energy has shifted.`,
        `"Listen to me," ${actor} says, and people actually do. Whatever ${aPr.sub} tells the tribe, it lands. There's steel in the air now.`,
      ];
      return { actor, teammates, text: lines[Math.floor(Math.random() * lines.length)], players: [actor, ...teammates] };
    },
  },
  {
    id: 'strategy-whisper',
    badge: 'Scheming', badgeClass: 'purple',
    check(tribeMembers) {
      const all = tribeMembers.flatMap(t => t.members.map(m => ({ name: m, tribe: t.name })));
      for (const p of all) {
        const st = pStats(p.name);
        const arch = players.find(x => x.name === p.name)?.archetype;
        const canScheme = ['villain','mastermind','schemer'].includes(arch) ||
          (['hothead','challenge-beast','wildcard','chaos-agent','floater','perceptive-player'].includes(arch) && st.strategic >= 6 && st.loyalty <= 4);
        if (canScheme) {
          const cross = all.filter(q => q.tribe !== p.tribe && getBond(p.name, q.name) <= 0);
          if (cross.length > 0) return { actor: p.name, target: cross[0].name };
        }
      }
      return null;
    },
    apply({ actor, target }) {
      const aPr = pronouns(actor);
      const tPr = pronouns(target);
      addBond(actor, target, -0.2);
      const lines = [
        `${actor} glances at ${target} across the arena and pulls a teammate close. Whatever ${aPr.sub} says, it's not complimentary.`,
        `${actor} is already planning the next shot before the break is over — and ${target} is on the list. ${aPr.Sub} makes sure the tribe knows it.`,
        `Between phases, ${actor} moves fast. ${tPr.Sub} doesn't know it yet, but ${actor} is already working an angle.`,
      ];
      return { actor, target, text: lines[Math.floor(Math.random() * lines.length)], players: [actor, target] };
    },
  },
  {
    id: 'chicken-shame',
    badge: 'Side-Eye', badgeClass: 'orange',
    check(tribeMembers, result) {
      if (!result.horseDive) return null;
      const allChickens = result.horseDive.tribeResults.flatMap(tr => tr.chickens.filter(c => !tr.jumpers.find(j => j.name === c)));
      if (allChickens.length === 0) return null;
      const chicken = allChickens[Math.floor(Math.random() * allChickens.length)];
      return { actor: chicken };
    },
    apply({ actor }) {
      const aPr = pronouns(actor);
      if (!gs.popularity) gs.popularity = {};
      gs.popularity[actor] = (gs.popularity[actor] || 0) - 1;
      const lines = [
        `${actor} can feel it — the looks, the pointed silence from ${aPr.posAdj} tribe. Nobody has said anything yet. They don't have to.`,
        `${actor} tries to stay busy during the break, but ${aPr.posAdj} tribe keeps a noticeable distance after the platform incident.`,
        `The tribe around ${actor} moves through the break without really including ${aPr.obj}. The platform moment hangs in the air between them.`,
      ];
      return { actor, text: lines[Math.floor(Math.random() * lines.length)], players: [actor] };
    },
  },
  {
    id: 'throw-confrontation',
    badge: 'Caught Out', badgeClass: 'red',
    check(tribeMembers, result) {
      if (!result.horseDive) return null;
      const allThrowers = result.horseDive.throws?.throwers ? [...result.horseDive.throws.throwers] : [];
      if (allThrowers.length === 0) return null;
      const thrower = allThrowers[Math.floor(Math.random() * allThrowers.length)];
      for (const t of tribeMembers) {
        if (t.members.includes(thrower)) {
          const confronter = t.members.find(m => m !== thrower && pStats(m).intuition >= 6);
          if (confronter) return { actor: confronter, target: thrower };
        }
      }
      return null;
    },
    apply({ actor, target }) {
      const aPr = pronouns(actor);
      const tPr = pronouns(target);
      addBond(actor, target, -0.8);
      if (!gs.popularity) gs.popularity = {};
      gs.popularity[target] = (gs.popularity[target] || 0) - 2;
      const lines = [
        `${actor} squares up to ${target} during the break: "That jump was a choice. A very deliberate choice." ${tPr.Sub} doesn't answer.`,
        `${actor} pulls ${target} aside and asks the question directly. ${tPr.Sub} fumbles the answer. ${aPr.Sub} doesn't buy it.`,
        `${actor} knows what ${target} did on that platform — and says so, quietly, where only ${target} can hear. ${tPr.Sub} goes white.`,
      ];
      return { actor, target, text: lines[Math.floor(Math.random() * lines.length)], players: [actor, target] };
    },
  },
];

// ── Phase 1: Horse Dive ──────────────────────────────────────────────────────

function _simulateHorseDive(ep, tribeMembers, result) {
  const host = seasonConfig.host || 'Chris';
  const _rp = arr => arr[Math.floor(Math.random() * arr.length)];
  const allMembers = tribeMembers.flatMap(t => t.members);

  const throwResult = checkChallengeThrows(allMembers, { phase: 'pre-merge', tribes: gs.tribes });
  const throwers = throwResult.throwers;

  const tribeResults = [];

  for (const tribe of tribeMembers) {
    // Shuffle jump order
    const order = [...tribe.members].sort(() => Math.random() - 0.5);
    const jumpers = [];
    const chickens = [];
    const reactions = [];
    let momentum = 0;

    for (const name of order) {
      const st = pStats(name);
      const pr = pronouns(name);

      if (throwers.has(name)) {
        // Throw disguised as chicken
        const tier = st.boldness >= 7 ? 'high' : st.boldness <= 3 ? 'low' : 'mid';
        const text = _rp(HORSE_DIVE_CHICKEN[tier])(name, pr);
        reactions.push({ name, jumped: false, text, boldness: st.boldness, throwDisguised: true });
        chickens.push(name);
        momentum--;
      } else {
        const jumpChance = Math.min(0.95, Math.max(0.05,
          st.boldness * 0.05 + st.physical * 0.02 + st.loyalty * 0.02 + 0.08 + Math.max(-2, momentum) * 0.04
        ));

        if (Math.random() < jumpChance) {
          // Jumped
          const roll = st.physical * 0.06 + st.boldness * 0.04 + Math.random() * 0.3;
          let landingKey, landingPoints;
          if (roll >= 0.7) { landingKey = 'perfect'; landingPoints = 3; }
          else if (roll >= 0.5) { landingKey = 'rough'; landingPoints = 2; }
          else if (roll >= 0.3) { landingKey = 'bellyflop'; landingPoints = 1; }
          else { landingKey = 'miss'; landingPoints = 0; }

          const tier = st.boldness >= 7 ? 'high' : st.boldness <= 3 ? 'low' : 'mid';
          const jumpText = _rp(HORSE_DIVE_JUMPED[tier])(name, pr);
          const landText = _rp(HORSE_DIVE_LANDING[landingKey])(name, pr);
          const hostLine = st.boldness >= 7
            ? _rp(HORSE_DIVE_HOST.afterBoldJump)(host, name)
            : _rp(HORSE_DIVE_HOST.afterScaredJump)(host, name);

          reactions.push({ name, jumped: true, text: jumpText + ' ' + landText, hostLine, boldness: st.boldness, landingKey, landingPoints });
          jumpers.push({ name, landingPoints });
          momentum++;

          ep.chalMemberScores[name] = (ep.chalMemberScores[name] || 0) + landingPoints * 3;

          if (!gs.popularity) gs.popularity = {};
          if (landingKey === 'perfect') gs.popularity[name] = (gs.popularity[name] || 0) + 2;
        } else {
          // Chicken
          const tier = st.boldness >= 7 ? 'high' : st.boldness <= 3 ? 'low' : 'mid';
          const text = _rp(HORSE_DIVE_CHICKEN[tier])(name, pr);
          const hostLine = _rp(HORSE_DIVE_HOST.afterChicken)(host, name);
          reactions.push({ name, jumped: false, text, hostLine, boldness: st.boldness, throwDisguised: false });
          chickens.push(name);
          momentum--;

          if (!gs.popularity) gs.popularity = {};
          gs.popularity[name] = (gs.popularity[name] || 0) - 1;
        }
      }
    }

    // Interventions (max 2 per tribe)
    const interventions = [];
    const remainingChickens = [...chickens];
    let interventionCount = 0;

    for (const chicken of remainingChickens) {
      if (interventionCount >= 2) break;
      const chickenSt = pStats(chicken);
      const chickenPr = pronouns(chicken);

      // Find most motivated jumper
      let bestTalker = null;
      let bestMotivation = -Infinity;

      for (const j of jumpers) {
        const bond = getBond(j.name, chicken);
        const jSt = pStats(j.name);
        const motivation = Math.abs(bond) * 0.4 + jSt.social * 0.03 + jSt.physical * 0.02;
        if (motivation > bestMotivation) {
          bestMotivation = motivation;
          bestTalker = { name: j.name, bond, st: jSt };
        }
      }

      if (!bestTalker || bestMotivation < 0.3) continue;

      const talkerPr = pronouns(bestTalker.name);
      const bond = bestTalker.bond;
      const path = bond >= 2 ? 'convince' : bond <= -2 ? 'force' : (bestTalker.st.social > bestTalker.st.physical ? 'convince' : 'force');

      if (path === 'convince') {
        const chance = Math.min(0.80, Math.max(0.10,
          bestTalker.st.social * 0.06 + bond * 0.04 + chickenSt.loyalty * 0.03
        ));
        const success = Math.random() < chance;
        const convText = success
          ? _rp(HORSE_DIVE_CONVINCE_SUCCESS)(bestTalker.name, chicken, talkerPr, chickenPr)
          : _rp(HORSE_DIVE_CONVINCE_FAIL)(bestTalker.name, chicken, talkerPr, chickenPr);
        const hostLine = success
          ? _rp(HORSE_DIVE_HOST_INTERVENTION.convinceSuccess)(host, bestTalker.name, chicken)
          : _rp(HORSE_DIVE_HOST_INTERVENTION.convinceFail)(host, bestTalker.name, chicken);

        if (success) {
          addBond(bestTalker.name, chicken, 0.2);
          // Remove from chickens, add to jumpers with bellyflop score (1pt default for coerced)
          const idx = chickens.indexOf(chicken);
          if (idx !== -1) chickens.splice(idx, 1);
          jumpers.push({ name: chicken, landingPoints: 1 });
          ep.chalMemberScores[chicken] = (ep.chalMemberScores[chicken] || 0) + 3;
          // Update reaction
          const rx = reactions.find(r => r.name === chicken);
          if (rx) { rx.jumped = true; rx.intervention = { actor: bestTalker.name, path, success, text: convText, hostLine }; }
        } else {
          addBond(bestTalker.name, chicken, -0.1);
          const rx = reactions.find(r => r.name === chicken);
          if (rx) rx.intervention = { actor: bestTalker.name, path, success, text: convText, hostLine };
        }

        interventions.push({ actor: bestTalker.name, chicken, path, success, text: convText, hostLine });
      } else {
        // Force
        const physDiff = bestTalker.st.physical - chickenSt.physical;
        const chance = Math.min(0.75, Math.max(0.10,
          physDiff * 0.06 + bestTalker.st.boldness * 0.03 + 0.15
        ));
        const success = Math.random() < chance;
        const forceText = success
          ? _rp(HORSE_DIVE_FORCE_SUCCESS)(bestTalker.name, chicken, talkerPr, chickenPr)
          : _rp(HORSE_DIVE_FORCE_FAIL)(bestTalker.name, chicken, talkerPr, chickenPr);
        const hostLine = success
          ? _rp(HORSE_DIVE_HOST_INTERVENTION.forceSuccess)(host, bestTalker.name, chicken)
          : _rp(HORSE_DIVE_HOST_INTERVENTION.forceFail)(host, bestTalker.name, chicken);

        if (success) {
          addBond(bestTalker.name, chicken, -0.5);
          const idx = chickens.indexOf(chicken);
          if (idx !== -1) chickens.splice(idx, 1);
          jumpers.push({ name: chicken, landingPoints: 1 });
          ep.chalMemberScores[chicken] = (ep.chalMemberScores[chicken] || 0) + 3;
          const rx = reactions.find(r => r.name === chicken);
          if (rx) { rx.jumped = true; rx.intervention = { actor: bestTalker.name, path, success, text: forceText, hostLine }; }
        } else {
          addBond(bestTalker.name, chicken, -0.2);
          const rx = reactions.find(r => r.name === chicken);
          if (rx) rx.intervention = { actor: bestTalker.name, path, success, text: forceText, hostLine };
        }

        interventions.push({ actor: bestTalker.name, chicken, path, success, text: forceText, hostLine });
      }

      interventionCount++;
    }

    // Pressure reactions for remaining true chickens
    for (const chicken of chickens) {
      const rx = reactions.find(r => r.name === chicken && !r.throwDisguised && !r.jumped);
      if (!rx) continue;
      // Pick a random jumper to be frustrated
      if (jumpers.length > 0) {
        const frustrated = jumpers[Math.floor(Math.random() * jumpers.length)];
        addBond(frustrated.name, chicken, -0.1);
      }
      // Bond penalty from all teammates
      for (const teammate of tribe.members) {
        if (teammate !== chicken) addBond(teammate, chicken, -0.1);
      }
    }

    // Scoring
    const tribeScore = jumpers.length > 0
      ? jumpers.reduce((sum, j) => sum + j.landingPoints, 0) / jumpers.length
      : 0;

    tribeResults.push({ tribe: tribe.name, jumpers, chickens, reactions, interventions, tribeScore });
  }

  // Winner
  const sorted = [...tribeResults].sort((a, b) => b.tribeScore - a.tribeScore);
  const winnerTribe = sorted[0];
  result.tribeScores[winnerTribe.tribe] = (result.tribeScores[winnerTribe.tribe] || 0) + 1;

  // Throw processing
  const throwData = processChallengeThrows(throwResult, allMembers);

  result.horseDive = {
    tribeResults,
    throws: throwData,
    winner: winnerTribe.tribe,
  };
}

// ── Drama Break ───────────────────────────────────────────────────────────────

function _simulateDramaBreak(ep, tribeMembers, result, breakNum) {
  const campKey = gs.tribes[0]?.name || 'merge';
  const _rp = arr => arr[Math.floor(Math.random() * arr.length)];

  const shuffled = [...DRAMA_BREAK_EVENTS].sort(() => Math.random() - 0.5);
  const firedEvents = [];
  const usedPlayers = new Set();
  const targetCount = 4 + Math.floor(Math.random() * 3); // 4–6

  for (const evt of shuffled) {
    if (firedEvents.length >= targetCount) break;
    const ctx = evt.check(tribeMembers, result);
    if (!ctx) continue;

    // Avoid same player starring in consecutive events
    const starring = [ctx.actor, ctx.target].filter(Boolean);
    if (starring.some(p => usedPlayers.has(p))) continue;

    const outcome = evt.apply(ctx);
    if (!outcome) continue;

    firedEvents.push({ id: evt.id, badge: evt.badge, badgeClass: evt.badgeClass, ...outcome });

    // Camp event
    if (!ep.campEvents[campKey]) ep.campEvents[campKey] = { pre: [], post: [] };
    if (!ep.campEvents[campKey].post) ep.campEvents[campKey].post = [];
    ep.campEvents[campKey].post.push({
      text: outcome.text,
      players: outcome.players || [],
      badgeText: evt.badge.toUpperCase(),
      badgeClass: evt.badgeClass,
      tag: 'challenge',
    });

    // Track used players (only block for next iteration)
    starring.forEach(p => usedPlayers.add(p));
    // Reset after each event so only consecutive is blocked
    if (firedEvents.length % 2 === 0) usedPlayers.clear();
  }

  if (breakNum === 1) result.breakEvents1 = firedEvents;
  else result.breakEvents2 = firedEvents;
}

// ── Roundup text pools ────────────────────────────────────────────────────────

const ROUNDUP_HOST = {
  intro: [
    (host, cowboys, cattle) => `${host} fires a shot into the air: "Phase Three — the CATTLE ROUNDUP! ${cowboys}, you're the cowboys. ${cattle}, you're the cattle. Cowboys, rope 'em up. Cattle, don't get caught. Let's ride!"`,
    (host, cowboys, cattle) => `"Alright, partners!" ${host} bellows. "${cowboys} won the dive — which means ${cattle} better start running! Cowboys rope the cattle, cattle survive the rounds. Move it!"`,
    (host, cowboys, cattle) => `${host} grins wide: "You earned the lasso, ${cowboys}. Now use it. ${cattle} — I hope you've been practicing your footwork. The roundup starts NOW!"`,
  ],
  roundStart: [
    (host, roundNum) => `${host} fires the starting pistol: "Round ${roundNum}! Cowboys, pick your targets. Cattle, don't make it easy!"`,
    (host, roundNum) => `"Round ${roundNum}!" ${host} calls out. "Every head they catch is a point. Every dodge is survival. Ride hard!"`,
    (host, roundNum) => `${host} tips ${host === 'Chris' ? 'his' : 'their'} hat: "Round ${roundNum} — the herd's getting thinner. Make your lassos count."`,
  ],
  capture: [
    (host, captured) => `${host} points from the booth: "${captured} is roped! That's a mark for the cowboys — good lasso work!"`,
    (host, captured) => `"GOT ONE!" ${host} shouts. "${captured} is caught! Head count goes up!"`,
    (host, captured) => `${host} grins: "${captured} tried to run but the rope found ${host === 'Chris' ? 'them' : 'them'} anyway. Roped and recorded!"`,
  ],
  dodge: [
    (host, dodger) => `${host} leans forward: "${dodger} slips the lasso! That cow knows how to move!"`,
    (host, dodger) => `"${dodger} dodges!" ${host} calls out. "Still free range — for now."`,
    (host, dodger) => `${host} whistles: "${dodger} with the sidestep! The cowboys need better aim."`,
  ],
  finale: [
    (host, winner) => `${host} spreads ${host === 'Chris' ? 'his' : 'their'} arms: "And THAT is how you run a cattle drive! ${winner} takes the Roundup!"`,
    (host, winner) => `"Round up's done!" ${host} announces. "${winner} clears Phase Three — this Wild West showdown is settled!"`,
    (host, winner) => `${host} fires a celebratory shot: "Hats off to ${winner}! The best cowboys on the lot today!"`,
  ],
};

const ROUNDUP_LASSO = {
  hit: [
    (cowboy, target, cPr, tPr) => `${cowboy} swings the lasso wide and catches ${target} clean around the middle. ${tPr.Sub} yelps and gets tagged.`,
    (cowboy, target, cPr, tPr) => `${cowboy} reads ${target}'s movement and throws ahead of ${tPr.obj} — the rope lands true. Got 'em.`,
    (cowboy, target, cPr, tPr) => `${cowboy}'s lasso snaps out and finds ${target}. ${tPr.Sub} hits the rope and it's over.`,
  ],
  miss: [
    (cowboy, target, cPr, tPr) => `${cowboy} throws wide — the rope skips past ${target}, who barely changes pace.`,
    (cowboy, target, cPr, tPr) => `${cowboy}'s lasso arcs through the air and misses ${target} by a foot. ${tPr.Sub} doesn't look back.`,
    (cowboy, target, cPr, tPr) => `${cowboy} lets the rope fly and it lands in the dust. ${target} is already three steps ahead.`,
  ],
  tangle: [
    (cowboy, target, cPr, tPr) => `${cowboy} winds up and somehow catches ${target} — the wrong person entirely. Both of them stare at the rope in confusion.`,
    (cowboy, target, cPr, tPr) => `${cowboy}'s lasso goes wild and snags ${target}, who was nowhere near the intended target. The whole lot goes quiet, then erupts.`,
    (cowboy, target, cPr, tPr) => `${cowboy} throws the rope and it finds ${target} instead — comedy of errors. Neither of them is quite sure what just happened.`,
  ],
  teamwork: [
    (cowboy, target, cPr, tPr) => `${cowboy} and a teammate converge on ${target} from two angles — nowhere to run. The rope lands clean.`,
    (cowboy, target, cPr, tPr) => `${cowboy} coordinates the herd, cuts off ${target}'s escape route, and drops the lasso with precision.`,
    (cowboy, target, cPr, tPr) => `${cowboy} and ${cPr.posAdj} partner move in sync, boxing ${target} in before the lasso seals the deal.`,
  ],
};

const ROUNDUP_DODGE = {
  success: [
    (cattle, pr) => `${cattle} reads the lasso and ducks under it with a sharp pivot. Still free.`,
    (cattle, pr) => `${cattle} breaks left at the last second — the rope hits the ground where ${pr.sub} was standing a heartbeat ago.`,
    (cattle, pr) => `${cattle} spots the throw coming and sidesteps hard. The lasso finds nothing but air.`,
  ],
  fail: [
    (cattle, pr) => `${cattle} tries to juke right but the rope anticipates ${pr.obj}. Got.`,
    (cattle, pr) => `${cattle} stumbles mid-dodge and the lasso finds ${pr.obj} anyway. The crowd groans.`,
    (cattle, pr) => `${cattle} runs hard but the cowboy has the angle. The rope drops around ${pr.posAdj} shoulders. Caught.`,
  ],
};

const ROUNDUP_EVENTS = [
  {
    id: 'stampede',
    check(cattle, uncaptured) {
      return uncaptured.filter(c => Math.random() < pStats(c).physical * 0.08)[0] || null;
    },
    apply(leader, cowboyDebuffRef) {
      const pr = pronouns(leader);
      cowboyDebuffRef.value = 0.10;
      if (!gs.popularity) gs.popularity = {};
      gs.popularity[leader] = (gs.popularity[leader] || 0) + 1;
      const lines = [
        `${leader} rallies the remaining cattle with a shout — the whole herd surges at once, throwing the cowboys off their rhythm. Debuff incoming.`,
        `${leader} charges forward instead of running, scattering the cowboy formation. The lasso arms don't know where to aim.`,
        `${leader} leads a break — cattle scatter in every direction. The cowboys lose a step heading into the next round.`,
      ];
      return {
        text: lines[Math.floor(Math.random() * lines.length)],
        players: [leader],
        badgeText: 'STAMPEDE', badgeClass: 'orange',
        leader,
      };
    },
  },
  {
    id: 'showmance-standoff',
    check(cowboys, cattleNames) {
      if (!seasonConfig.romance) return null;
      for (const cowboy of cowboys) {
        for (const sm of (gs.showmances || [])) {
          const partner = sm.a === cowboy ? sm.b : sm.b === cowboy ? sm.a : null;
          if (partner && cattleNames.includes(partner) && romanticCompat(cowboy, partner) >= 0.3) {
            return { cowboy, partner };
          }
        }
      }
      return null;
    },
    apply({ cowboy, partner }, wastedRef) {
      const cPr = pronouns(cowboy);
      const pPr = pronouns(partner);
      wastedRef.add(cowboy);
      const lines = [
        `${cowboy} winds up the lasso — then sees ${partner} in the herd. ${cPr.Sub} can't bring ${cPr.obj}self to throw it. Wasted round.`,
        `${cowboy} has a clear shot at ${partner} but hesitates, arm dropping. Heart over competition, at least this round.`,
        `${cowboy} and ${partner} lock eyes across the lot. The lasso stays coiled. Nobody moves.`,
      ];
      return {
        text: lines[Math.floor(Math.random() * lines.length)],
        players: [cowboy, partner],
        badgeText: 'SHOWMANCE', badgeClass: 'pink',
        cowboy, partner,
      };
    },
  },
  {
    id: 'rope-tangle',
    check(cowboys) {
      if (cowboys.length === 0) return null;
      return cowboys[Math.floor(Math.random() * cowboys.length)];
    },
    apply(cowboy, wastedRef) {
      const pr = pronouns(cowboy);
      wastedRef.add(cowboy);
      const lines = [
        `${cowboy}'s lasso gets wrapped around ${pr.posAdj} own boots — ${pr.sub}'s fighting the rope more than the cattle. Completely wasted round.`,
        `${cowboy} tosses the lasso and it tangles mid-air, landing in a useless knot. ${pr.Sub} stares at it. The cattle stare at ${pr.obj}.`,
        `${cowboy} whirls the rope overhead and it catches on ${pr.posAdj} hat. By the time ${pr.sub} gets untangled, the window's gone.`,
      ];
      return {
        text: lines[Math.floor(Math.random() * lines.length)],
        players: [cowboy],
        badgeText: 'ROPE TANGLE', badgeClass: 'gray',
        cowboy,
      };
    },
  },
  {
    id: 'lasso-teamwork',
    check(cowboys, uncaptured) {
      if (cowboys.length < 2 || uncaptured.length === 0) return null;
      return true;
    },
    apply(cowboys, uncaptured, capturedSet) {
      // strongest uncaptured by physical
      const strongest = uncaptured.reduce((best, c) => pStats(c).physical > pStats(best).physical ? c : best, uncaptured[0]);
      const [c1, c2] = cowboys.slice(0, 2);
      addBond(c1, c2, 0.3);
      capturedSet.add(strongest);
      const cPr = pronouns(c1);
      const lines = [
        `${c1} and ${c2} work the herd together — they flush ${strongest} out and the rope lands clean. Guaranteed.`,
        `${c1} signals to ${c2}, who cuts off the escape. ${strongest} has nowhere to go and the lasso finds ${pronouns(strongest).obj}.`,
        `${c1} and ${c2} coordinate without a word — flanking ${strongest} from both sides. The capture is clean and clinical.`,
      ];
      return {
        text: lines[Math.floor(Math.random() * lines.length)],
        players: [c1, c2, strongest],
        badgeText: 'TEAMWORK', badgeClass: 'blue',
        cowboys: [c1, c2], target: strongest,
      };
    },
  },
];

// ── Phase 2: Mexican Standoff ─────────────────────────────────────────────────

function _simulateStandoff(ep, tribeMembers, result) {
  const host = seasonConfig.host || 'Chris';
  const _rp = arr => arr[Math.floor(Math.random() * arr.length)];

  // Build standing pool from Phase 1 jumpers
  const horseDive = result.horseDive;
  const standing = new Set();
  horseDive.tribeResults.forEach(tr => {
    tr.jumpers.forEach(j => standing.add(j.name));
  });

  if (standing.size < 2) {
    result.standoff = { skipped: true, reason: 'insufficient jumpers' };
    return;
  }

  // Player → tribe lookup
  const playerTribe = {};
  tribeMembers.forEach(t => t.members.forEach(m => { playerTribe[m] = t.name; }));

  const hits = {};
  standing.forEach(p => { hits[p] = 0; });

  const initialStandingCount = standing.size;
  const rounds = [];
  const eliminations = [];
  const killCount = {};
  standing.forEach(p => { killCount[p] = new Set(); });

  const MAX_ROUNDS = 5;

  for (let i = 0; i < MAX_ROUNDS; i++) {
    if (standing.size < 2) break;

    const roundData = {
      num: i + 1,
      hostLine: i === MAX_ROUNDS - 1
        ? _rp(STANDOFF_HOST.finalRound)(host)
        : i === 0
          ? _rp(STANDOFF_HOST.intro)(host)
          : _rp(STANDOFF_HOST.roundStart)(host, i + 1),
      shots: [],
      events: [],
      eliminations: [],
    };

    // Target selection
    const targets = {};
    for (const shooter of standing) {
      const candidates = [...standing].filter(c => c !== shooter);
      let bestTarget = null;
      let bestWeight = -Infinity;
      for (const candidate of candidates) {
        const crossBonus = playerTribe[candidate] !== playerTribe[shooter] ? 0.5 : 0;
        const enemyFactor = Math.max(0, -getBond(shooter, candidate)) * 0.3;
        const st = pStats(candidate);
        const threatFactor = (st.physical * 0.05 + st.strategic * 0.05) * 0.2;
        const noise = Math.random() * 0.3;
        const weight = crossBonus + enemyFactor + threatFactor + noise;
        if (weight > bestWeight) { bestWeight = weight; bestTarget = candidate; }
      }
      targets[shooter] = bestTarget;
    }

    // Check events before shots
    const hitOverrides = {}; // target -> forced miss
    const extraHits = {}; // target -> extra hit from events

    // Shield move (15% chance)
    if (Math.random() < 0.15) {
      const loyalCandidates = [...standing].filter(p => pStats(p).loyalty >= 7);
      if (loyalCandidates.length > 0) {
        const shielder = loyalCandidates[Math.floor(Math.random() * loyalCandidates.length)];
        const shielderTribe = playerTribe[shielder];
        // Find a teammate who's being targeted
        const protectedTeammate = [...standing].find(p =>
          p !== shielder && playerTribe[p] === shielderTribe &&
          Object.values(targets).includes(p)
        );
        if (protectedTeammate) {
          // shielder absorbs one hit meant for protectedTeammate
          extraHits[shielder] = (extraHits[shielder] || 0) + 1;
          hitOverrides[protectedTeammate] = (hitOverrides[protectedTeammate] || 0) + 1;
          addBond(shielder, protectedTeammate, 0.4);
          const sPr = pronouns(shielder);
          const tPr = pronouns(protectedTeammate);
          roundData.events.push({
            type: 'shield',
            actor: shielder,
            target: protectedTeammate,
            text: _rp(STANDOFF_SHOT.shield)(shielder, protectedTeammate, sPr, tPr),
            players: [shielder, protectedTeammate],
            badgeText: 'SHIELD MOVE', badgeClass: 'blue',
          });
        }
      }
    }

    // Betrayal shot (8% chance)
    if (Math.random() < 0.08) {
      const betrayerCandidates = [...standing].filter(p => {
        const arch = players.find(x => x.name === p)?.archetype;
        const st = pStats(p);
        return ['villain','mastermind','schemer'].includes(arch) && st.strategic >= 6;
      });
      if (betrayerCandidates.length > 0) {
        const betrayer = betrayerCandidates[Math.floor(Math.random() * betrayerCandidates.length)];
        const sameTribers = [...standing].filter(p => p !== betrayer && playerTribe[p] === playerTribe[betrayer]);
        if (sameTribers.length > 0) {
          const victim = sameTribers[Math.floor(Math.random() * sameTribers.length)];
          // Override target to own teammate
          targets[betrayer] = victim;
          // Everyone loses bond with betrayer
          [...standing].filter(w => w !== betrayer).forEach(w => addBond(w, betrayer, -1.0));
          if (!gs.popularity) gs.popularity = {};
          gs.popularity[betrayer] = (gs.popularity[betrayer] || 0) - 2;
          const bPr = pronouns(betrayer);
          const vPr = pronouns(victim);
          roundData.events.push({
            type: 'betrayal',
            actor: betrayer,
            target: victim,
            text: _rp(STANDOFF_SHOT.betrayal)(betrayer, victim, bPr, vPr),
            players: [betrayer, victim],
            badgeText: 'BETRAYAL', badgeClass: 'red',
          });
        }
      }
    }

    // Showmance hesitation (10% chance)
    if (Math.random() < 0.10 && seasonConfig.romance) {
      for (const sm of (gs.showmances || [])) {
        if (standing.has(sm.a) && standing.has(sm.b) && playerTribe[sm.a] !== playerTribe[sm.b]) {
          if (romanticCompat(sm.a, sm.b) >= 0.3) {
            // One of them wastes their shot
            const hesitator = Math.random() < 0.5 ? sm.a : sm.b;
            const partner = hesitator === sm.a ? sm.b : sm.a;
            hitOverrides[targets[hesitator]] = (hitOverrides[targets[hesitator]] || 0) + 1; // cancel the shot
            targets[hesitator] = null; // forced miss
            const hPr = pronouns(hesitator);
            const pPr = pronouns(partner);
            roundData.events.push({
              type: 'hesitation',
              actor: hesitator,
              target: partner,
              text: _rp(STANDOFF_SHOT.hesitation)(hesitator, partner, hPr, pPr),
              players: [hesitator, partner],
              badgeText: 'HESITATION', badgeClass: 'pink',
            });
            break;
          }
        }
      }
    }

    // Resolve shots
    for (const shooter of standing) {
      const target = targets[shooter];
      if (!target) continue; // forced miss / no target
      const st = pStats(shooter);
      const hitChance = st.mental * 0.06 + st.boldness * 0.04 + Math.random() * 0.3;
      const hit = hitChance > 0.5;
      const sPr = pronouns(shooter);
      const tPr = pronouns(target);
      const shotText = hit ? _rp(STANDOFF_SHOT.hit)(shooter, target, sPr, tPr)
                           : _rp(STANDOFF_SHOT.miss)(shooter, target, sPr, tPr);
      roundData.shots.push({ shooter, target, hit, text: shotText });
      if (hit) {
        hits[target] = (hits[target] || 0) + 1;
        if (killCount[shooter]) killCount[shooter].add(target);
        else killCount[shooter] = new Set([target]);
      }
    }

    // Apply extra/overridden hits from events
    for (const [p, count] of Object.entries(extraHits)) {
      hits[p] = (hits[p] || 0) + count;
    }
    // Overrides cancel shots that would have hit (already nulled targets, shield absorbed)
    // Shield victim protection: if protectedTeammate got a hit AND shield absorbed, the hit still landed on shielder
    // (handled by extraHits above — the real shooter's hit still lands on the original target unless we cancel it)
    // Actually: shield should cancel one incoming hit on the protected. Re-decrement:
    for (const [victim, cancelCount] of Object.entries(hitOverrides)) {
      if (typeof hits[victim] === 'number' && hits[victim] > 0) {
        hits[victim] = Math.max(0, hits[victim] - cancelCount);
      }
    }

    // Eliminations
    for (const p of [...standing]) {
      if (hits[p] >= 2) {
        standing.delete(p);
        const pr = pronouns(p);
        const elimText = _rp(STANDOFF_ELIMINATION)(p, pr);
        const hostLine = _rp(STANDOFF_HOST.elimination)(host, p);
        roundData.eliminations.push({ name: p, text: elimText, hostLine });
        eliminations.push({ name: p, round: i + 1 });
      }
    }

    rounds.push(roundData);

    // Early exit: one tribe has no standing members
    const tribeCounts = {};
    tribeMembers.forEach(t => { tribeCounts[t.name] = 0; });
    for (const p of standing) { tribeCounts[playerTribe[p]]++; }
    const extinctTribes = Object.entries(tribeCounts).filter(([, c]) => c === 0);
    if (extinctTribes.length > 0) break;
  }

  // Determine winner
  const finalTribeCounts = {};
  tribeMembers.forEach(t => { finalTribeCounts[t.name] = 0; });
  for (const p of standing) { finalTribeCounts[playerTribe[p]]++; }

  const sortedTribes = Object.entries(finalTribeCounts).sort((a, b) => b[1] - a[1]);
  let winner = null;
  if (sortedTribes[0][1] > sortedTribes[1][1]) {
    winner = sortedTribes[0][0];
    result.tribeScores[winner] = (result.tribeScores[winner] || 0) + 1;
  } else {
    // Tie — both get a point
    tribeMembers.forEach(t => { result.tribeScores[t.name] = (result.tribeScores[t.name] || 0) + 1; });
  }

  // Gunslingers: players who hit 3+ distinct targets
  const gunslingers = [];
  for (const [p, targetSet] of Object.entries(killCount)) {
    if (targetSet.size >= 3) gunslingers.push(p);
  }

  // chalMemberScores
  for (const [shooter, targetSet] of Object.entries(killCount)) {
    ep.chalMemberScores[shooter] = (ep.chalMemberScores[shooter] || 0) + targetSet.size * 5;
  }
  for (const p of standing) {
    ep.chalMemberScores[p] = (ep.chalMemberScores[p] || 0) + 2;
  }

  // Popularity
  if (!gs.popularity) gs.popularity = {};
  for (const g of gunslingers) {
    gs.popularity[g] = (gs.popularity[g] || 0) + 3;
  }

  // Final standings map
  const standings = {};
  tribeMembers.flatMap(t => t.members).forEach(p => {
    standings[p] = standing.has(p) ? 'standing' : 'eliminated';
  });

  result.standoff = {
    rounds,
    standings,
    eliminations,
    gunslingers,
    winner,
    participantCount: initialStandingCount,
  };
}

// ── Phase 3: Cattle Roundup ───────────────────────────────────────────────────

function _simulateRoundup(ep, tribeMembers, result) {
  const host = seasonConfig.host || 'Chris';
  const _rp = arr => arr[Math.floor(Math.random() * arr.length)];

  // Role assignment
  const p1Winner = result.horseDive?.winner;
  let cowboyTribeData, cattleTribeData;
  if (p1Winner) {
    cowboyTribeData = tribeMembers.find(t => t.name === p1Winner);
    cattleTribeData = tribeMembers.find(t => t.name !== p1Winner);
  } else {
    const shuffled = [...tribeMembers].sort(() => Math.random() - 0.5);
    cowboyTribeData = shuffled[0];
    cattleTribeData = shuffled[1];
  }

  const cowboys = [...cowboyTribeData.members];
  const cattle = [...cattleTribeData.members];
  const captured = new Set();
  const dodgeCounts = {};
  cattle.forEach(c => { dodgeCounts[c] = 0; });

  const rounds = [];
  const campKey = gs.tribes[0]?.name || 'merge';

  const hostIntroLine = _rp(ROUNDUP_HOST.intro)(host, cowboyTribeData.name, cattleTribeData.name);

  for (let i = 0; i < 3; i++) {
    const roundData = { num: i + 1, lassos: [], events: [], captures: [] };
    const cowboyDebuffRef = { value: 0 };
    const wastedCowboys = new Set();

    const uncaptured = cattle.filter(c => !captured.has(c));
    if (uncaptured.length === 0) break;

    // ── Events ──────────────────────────────────────────────────────────────

    // Lasso teamwork (12%)
    if (Math.random() < 0.12 && uncaptured.length > 0) {
      const twEvt = ROUNDUP_EVENTS.find(e => e.id === 'lasso-teamwork');
      if (twEvt.check(cowboys, uncaptured)) {
        const outcome = twEvt.apply(cowboys, uncaptured, captured);
        if (outcome) {
          roundData.events.push(outcome);
          roundData.captures.push(outcome.target);
          ep.campEvents[campKey].post.push({
            text: outcome.text, players: outcome.players,
            badgeText: outcome.badgeText, badgeClass: outcome.badgeClass, tag: 'challenge',
          });
          wastedCowboys.add(cowboys[0]);
          wastedCowboys.add(cowboys[1]);
        }
      }
    }

    // Stampede (10%)
    if (Math.random() < 0.10) {
      const stEvt = ROUNDUP_EVENTS.find(e => e.id === 'stampede');
      const leader = stEvt.check(cattle, uncaptured.filter(c => !captured.has(c)));
      if (leader) {
        const outcome = stEvt.apply(leader, cowboyDebuffRef);
        roundData.events.push(outcome);
        ep.campEvents[campKey].post.push({
          text: outcome.text, players: outcome.players,
          badgeText: outcome.badgeText, badgeClass: outcome.badgeClass, tag: 'challenge',
        });
      }
    }

    // Rope tangle (10%)
    if (Math.random() < 0.10) {
      const rtEvt = ROUNDUP_EVENTS.find(e => e.id === 'rope-tangle');
      const availCowboys = cowboys.filter(c => !wastedCowboys.has(c));
      const candidate = rtEvt.check(availCowboys);
      if (candidate) {
        const outcome = rtEvt.apply(candidate, wastedCowboys);
        roundData.events.push(outcome);
        ep.campEvents[campKey].post.push({
          text: outcome.text, players: outcome.players,
          badgeText: outcome.badgeText, badgeClass: outcome.badgeClass, tag: 'challenge',
        });
      }
    }

    // Showmance standoff (8%)
    if (Math.random() < 0.08 && seasonConfig.romance) {
      const ssEvt = ROUNDUP_EVENTS.find(e => e.id === 'showmance-standoff');
      const ssCtx = ssEvt.check(cowboys.filter(c => !wastedCowboys.has(c)), uncaptured);
      if (ssCtx) {
        const outcome = ssEvt.apply(ssCtx, wastedCowboys);
        roundData.events.push(outcome);
        ep.campEvents[campKey].post.push({
          text: outcome.text, players: outcome.players,
          badgeText: outcome.badgeText, badgeClass: outcome.badgeClass, tag: 'challenge',
        });
      }
    }

    // ── Rope checks ──────────────────────────────────────────────────────────

    for (const cowboy of cowboys) {
      if (wastedCowboys.has(cowboy)) continue;
      const currentUncaptured = cattle.filter(c => !captured.has(c));
      if (currentUncaptured.length === 0) break;

      const cSt = pStats(cowboy);

      // Target: prefer enemies, then strongest
      let bestTarget = null;
      let bestWeight = -Infinity;
      for (const target of currentUncaptured) {
        const tSt = pStats(target);
        const weight = Math.max(0, -getBond(cowboy, target)) * 0.3 + tSt.physical * 0.05 + Math.random() * 0.25;
        if (weight > bestWeight) { bestWeight = weight; bestTarget = target; }
      }
      if (!bestTarget) continue;

      const target = bestTarget;
      const tSt = pStats(target);
      const tPr = pronouns(target);
      const cPr = pronouns(cowboy);
      const gunslingerBuff = result.standoff?.gunslingers?.includes(cowboy) ? 0.08 : 0;

      const cowboyRoll = (cSt.physical * 0.06 + cSt.strategic * 0.04) * (1 + gunslingerBuff) * (1 - cowboyDebuffRef.value) + Math.random() * 0.3;
      const cattleRoll = tSt.physical * 0.05 + tSt.boldness * 0.04 + Math.random() * 0.3;

      if (cowboyRoll > cattleRoll) {
        // Capture
        captured.add(target);
        roundData.captures.push(target);
        const lassoText = _rp(ROUNDUP_LASSO.hit)(cowboy, target, cPr, tPr);
        const hostLine = _rp(ROUNDUP_HOST.capture)(host, target);
        roundData.lassos.push({ cowboy, target, success: true, text: lassoText, hostLine });
        ep.campEvents[campKey].post.push({
          text: lassoText, players: [cowboy, target],
          badgeText: 'LASSO HIT', badgeClass: 'gold', tag: 'challenge',
        });
      } else {
        // Dodge
        dodgeCounts[target] = (dodgeCounts[target] || 0) + 1;
        const dodgeText = _rp(ROUNDUP_DODGE.success)(target, tPr);
        const lassoText = _rp(ROUNDUP_LASSO.miss)(cowboy, target, cPr, tPr);
        const hostLine = _rp(ROUNDUP_HOST.dodge)(host, target);
        roundData.lassos.push({ cowboy, target, success: false, text: lassoText + ' ' + dodgeText, hostLine });
        ep.campEvents[campKey].post.push({
          text: dodgeText, players: [target],
          badgeText: 'DODGE', badgeClass: 'green', tag: 'challenge',
        });
      }
    }

    // ── Tables Turned (round 3 counter-rope if cattle tribe leads 2-0) ──────

    if (i === 2) {
      const scores = Object.entries(result.tribeScores);
      const cowboyScore = result.tribeScores[cowboyTribeData.name] || 0;
      const cattleScore = result.tribeScores[cattleTribeData.name] || 0;
      if (cattleScore >= cowboyScore + 2) {
        const counterCaptures = [];
        const stillFree = cattle.filter(c => !captured.has(c));
        for (const cattler of stillFree) {
          const cSt = pStats(cattler);
          const targetCowboy = cowboys[Math.floor(Math.random() * cowboys.length)];
          const tSt = pStats(targetCowboy);
          if (cSt.physical * 0.05 + cSt.boldness * 0.04 + Math.random() * 0.2 > tSt.physical * 0.05 + Math.random() * 0.2) {
            counterCaptures.push({ cattle: cattler, cowboy: targetCowboy });
            result.tribeScores[cowboyTribeData.name] = Math.max(0, (result.tribeScores[cowboyTribeData.name] || 0) - 2);
            const pr = pronouns(cattler);
            const cpPr = pronouns(targetCowboy);
            const line = `${cattler} finds a loose rope on the ground — and turns the tables, lassoing ${targetCowboy} instead. The crowd goes wild.`;
            ep.campEvents[campKey].post.push({
              text: line, players: [cattler, targetCowboy],
              badgeText: 'TABLES TURNED', badgeClass: 'red', tag: 'challenge',
            });
            roundData.events.push({ id: 'tables-turned', text: line, players: [cattler, targetCowboy], badgeText: 'TABLES TURNED', badgeClass: 'red' });
          }
        }
        if (counterCaptures.length > 0) {
          result.roundup = result.roundup || {};
          result.roundup.tablesTurned = true;
          result.roundup.tablesTurnedDetails = counterCaptures;
        }
      }
    }

    rounds.push(roundData);
  }

  // ── Scoring ──────────────────────────────────────────────────────────────────

  const cowboyPoints = captured.size;
  const cattlePoints = (cattle.length - captured.size) * 0.5;
  const roundupWinner = cowboyPoints >= cattlePoints ? cowboyTribeData.name : cattleTribeData.name;
  result.tribeScores[roundupWinner] = (result.tribeScores[roundupWinner] || 0) + 1;

  // chalMemberScores
  const cowboyCaptures = {};
  for (const rnd of rounds) {
    for (const lasso of rnd.lassos) {
      if (lasso.success) {
        cowboyCaptures[lasso.cowboy] = (cowboyCaptures[lasso.cowboy] || 0) + 1;
      }
    }
  }
  for (const cowboy of cowboys) {
    const caps = cowboyCaptures[cowboy] || 0;
    ep.chalMemberScores[cowboy] = (ep.chalMemberScores[cowboy] || 0) + caps * 4;
  }
  for (const c of cattle) {
    ep.chalMemberScores[c] = (ep.chalMemberScores[c] || 0) + (dodgeCounts[c] || 0) * 3;
  }

  // Sheriff: most captures
  let sheriff = null, maxCaps = 0;
  for (const [name, caps] of Object.entries(cowboyCaptures)) {
    if (caps > maxCaps) { maxCaps = caps; sheriff = name; }
  }
  if (sheriff) {
    if (!gs.popularity) gs.popularity = {};
    gs.popularity[sheriff] = (gs.popularity[sheriff] || 0) + 2;
  }

  // Stampede leader popularity already applied in event

  const hostFinale = _rp(ROUNDUP_HOST.finale)(host, roundupWinner);

  result.roundup = {
    ...(result.roundup || {}),
    cowboys: cowboyTribeData.name,
    cattle: cattleTribeData.name,
    cowboyMembers: cowboys,
    cattleMembers: cattle,
    rounds,
    captures: [...captured],
    dodgeCounts,
    sheriff,
    tablesTurned: result.roundup?.tablesTurned || false,
    winner: roundupWinner,
    hostIntro: hostIntroLine,
    hostFinale,
  };
}

export function simulateCrazytown(ep) {
  const tribes = gs.tribes;
  if (!tribes || tribes.length < 2) return;
  const tribeMembers = tribes.map(t => ({ name: t.name, members: [...t.members] }));

  const result = {
    phases: [],
    tribeScores: {},
    horseDive: null,
    standoff: null,
    roundup: null,
    breakEvents1: null,
    breakEvents2: null,
  };
  tribeMembers.forEach(t => { result.tribeScores[t.name] = 0; });

  ep.crazytown = result;
  ep.challengeType = 'crazytown';

  if (!ep.campEvents) ep.campEvents = {};
  const campKey = gs.tribes[0]?.name || 'merge';
  if (!ep.campEvents[campKey]) ep.campEvents[campKey] = { pre: [], post: [] };
  if (!ep.campEvents[campKey].post) ep.campEvents[campKey].post = [];

  if (!ep.chalMemberScores) ep.chalMemberScores = {};
  tribeMembers.flatMap(t => t.members).forEach(n => { ep.chalMemberScores[n] = 0; });

  _simulateHorseDive(ep, tribeMembers, result);
  result.phases.push('horseDive');

  _simulateDramaBreak(ep, tribeMembers, result, 1);
  _simulateStandoff(ep, tribeMembers, result);
  result.phases.push('standoff');
  _simulateDramaBreak(ep, tribeMembers, result, 2);

  _simulateRoundup(ep, tribeMembers, result);
  result.phases.push('roundup');

  // Heat: betrayal shots from standoff (victim-keyed)
  if (!gs._crazytownHeat) gs._crazytownHeat = {};
  const heatExpiresEp = (gs.episode || 1) + 2;
  if (result.standoff) {
    for (const round of (result.standoff.rounds || [])) {
      for (const evt of (round.events || [])) {
        if (evt.type === 'betrayal' && evt.actor && evt.target) {
          gs._crazytownHeat[evt.target] = { target: evt.actor, amount: 1.5, expiresEp: heatExpiresEp };
        }
      }
    }
  }

  // Tiebreaker: sudden-death quick-draw
  {
    const scores = Object.entries(result.tribeScores);
    const topScore = Math.max(...scores.map(s => s[1]));
    const tied = scores.filter(s => s[1] === topScore);
    if (tied.length >= 2) {
      const duelists = tied.map(([tribeName]) => {
        const members = tribeMembers.find(t => t.name === tribeName).members;
        return members.reduce((best, m) => pStats(m).mental > pStats(best).mental ? m : best, members[0]);
      });
      const score0 = pStats(duelists[0]).mental * 0.08 + pStats(duelists[0]).boldness * 0.05 + Math.random() * 0.2;
      const score1 = pStats(duelists[1]).mental * 0.08 + pStats(duelists[1]).boldness * 0.05 + Math.random() * 0.2;
      const tbWinner = score0 >= score1 ? tied[0][0] : tied[1][0];
      result.tribeScores[tbWinner] += 1;
      result.tiebreaker = { duelists, winner: tbWinner };
    }
  }

  const sorted = Object.entries(result.tribeScores).sort((a, b) => b[1] - a[1]);
  const winnerName = sorted[0][0];
  const loserName = sorted[sorted.length - 1][0];
  ep.winner = tribes.find(t => t.name === winnerName);
  ep.loser = tribes.find(t => t.name === loserName);
  ep.tribalPlayers = [...ep.loser.members];
  ep.safeTribes = tribes.filter(t => t.name !== loserName && t.name !== winnerName);

  updateChalRecord(ep);

  ep.campEvents[campKey].post.push({
    text: `3:10 to Crazytown: ${winnerName} wins the Western showdown. ${loserName} heads to tribal council.`,
    players: tribeMembers.flatMap(t => t.members),
    badgeText: '3:10 TO CRAZYTOWN', badgeClass: 'gold',
    tag: 'challenge',
  });

  // ── Showmance challenge moments (cross-tribe only)
  if (seasonConfig.romance !== false && gs.showmances?.length) {
    for (const sm of gs.showmances) {
      const { a, b } = sm;
      const aInGame = tribeMembers.some(t => t.members.includes(a));
      const bInGame = tribeMembers.some(t => t.members.includes(b));
      if (!aInGame || !bInGame) continue;
      const crossTribe = !tribeMembers.some(t => t.members.includes(a) && t.members.includes(b));
      if (!crossTribe) continue;
      if (!romanticCompat(a, b)) continue;
      if (Math.random() < 0.4) {
        const pr = pronouns(a);
        ep.campEvents[campKey].post.push({
          type: 'crazytown-showmance',
          text: `After the dust settles, ${a} catches ${b}'s eye across the set. A quick nod — something unspoken passes between them. ${pr.Sub} turns away before anyone notices.`,
          players: [a, b],
          badgeText: 'Western Romance', badgeClass: 'gold',
        });
        addBond(a, b, 0.3);
        break;
      }
    }
  }

  // ── Cold open: pick most dramatic moment
  let coldOpen = null;
  if (result.horseDive?.throws?.some(t => t.caught)) {
    const caught = result.horseDive.throws.find(t => t.caught);
    coldOpen = { type: 'throw-caught', text: 'Someone is about to get caught throwing the challenge...', player: caught.thrower };
  } else if (result.standoff?.gunslingers?.length) {
    coldOpen = { type: 'gunslinger', text: 'One player is about to dominate the standoff like never before...', player: result.standoff.gunslingers[0] };
  } else if (result.roundup?.tablesTurned) {
    coldOpen = { type: 'tables-turned', text: 'The tables are about to turn in spectacular fashion...', player: null };
  } else if (result.standoff?.rounds?.some(r => r.events?.some(e => e.id === 'betrayal-shot' || e.type === 'betrayal'))) {
    const betrayalRound = result.standoff.rounds.find(r => r.events?.some(e => e.id === 'betrayal-shot' || e.type === 'betrayal'));
    const betrayalEvt = betrayalRound?.events?.find(e => e.id === 'betrayal-shot' || e.type === 'betrayal');
    coldOpen = { type: 'betrayal', text: 'Trust is about to be shattered in the standoff circle...', player: betrayalEvt?.actor || null };
  } else if (result.horseDive) {
    const allChickens = result.horseDive.tribeResults.flatMap(tr => tr.chickens);
    if (allChickens.length >= 3) {
      coldOpen = { type: 'chicken-cascade', text: 'Fear is about to spread like wildfire on the platform...', player: allChickens[0] };
    }
  }
  result.coldOpen = coldOpen;

  ep._debugCrazytown = {
    tribeScores: { ...result.tribeScores },
    phases: [...result.phases],
    horseDiveWinner: result.horseDive?.winner,
    standoffWinner: result.standoff?.winner,
    roundupWinner: result.roundup?.winner,
    gunslingers: result.standoff?.gunslingers || [],
    sheriff: result.roundup?.sheriff,
    tablesTurned: result.roundup?.tablesTurned || false,
    tiebreaker: result.tiebreaker || null,
    coldOpen: coldOpen?.type || null,
    heatGenerated: Object.keys(gs._crazytownHeat || {}).length,
  };
}

export function _textCrazytown(ep, ln, sec) {
  const ct = ep.crazytown;
  if (!ct) return;
  const host = seasonConfig.host || 'Chris';

  // ── Cold open
  if (ct.coldOpen) {
    const co = ct.coldOpen;
    if (co.player) {
      ln(`[COLD OPEN] ${co.player}: "${co.text}"`);
    } else {
      ln(`[COLD OPEN] ${co.text}`);
    }
  }

  // ── Title
  sec('3:10 to Crazytown');
  ln(`${host} struts onto the Western film set in a cowboy hat and spurs. "Welcome to 3:10 to Crazytown! Three challenges. One tribe walks away safe. The other? Tribal council."`);

  // ── Phase 1: Horse Dive
  if (ct.horseDive) {
    sec('Phase 1: The Horse Dive');
    ln(`${host}: "Your first challenge — jump off a 100-foot platform onto a moving horse. Simple!"`);

    for (const tr of ct.horseDive.tribeResults) {
      ln(`\n— ${tr.tribe} —`);
      for (const r of tr.reactions) {
        if (r.text) ln(r.text);
        if (r.intervention) {
          if (r.intervention.text) ln(r.intervention.text);
          if (r.intervention.hostLine) ln(r.intervention.hostLine);
        }
        if (r.jumped && r.landingQuality) {
          const q = r.landingQuality;
          if (q === 'perfect') ln(`Perfect landing! The crowd goes wild.`);
          else if (q === 'rough') ln(`A rough landing — but it counts.`);
          else if (q === 'bellyflop') ln(`That's going to leave a mark.`);
          else if (q === 'miss') ln(`Complete miss. Zero points.`);
        }
      }
      const sc = typeof tr.tribeScore === 'number' ? tr.tribeScore.toFixed(1) : tr.tribeScore;
      ln(`${tr.tribe} Horse Dive score: ${sc}`);
    }

    if (ct.horseDive.winner) {
      ln(`${host}: "${ct.horseDive.winner} takes Phase 1!"`);
    }

    if (ct.horseDive.throws?.length) {
      for (const t of ct.horseDive.throws) {
        if (t.caught) {
          const suspectList = t.detectedBy?.join(', ') || 'someone';
          const reasonLine = t.reason === 'showmance-protection'
            ? `Was ${t.thrower} throwing to protect ${t.beneficiary}?`
            : `Something about ${t.thrower}'s performance doesn't add up.`;
          ln(`${suspectList} noticed something off. ${reasonLine} Suspicion is brewing.`);
        }
      }
    }
  }

  // ── Drama Break 1
  if (ct.breakEvents1?.length) {
    sec('Between Phases');
    for (const evt of ct.breakEvents1) {
      if (evt.text) ln(evt.text);
    }
  }

  // ── Phase 2: Mexican Standoff
  if (ct.standoff) {
    sec('Phase 2: The Mexican Standoff');
    ln(`${host}: "Everybody into the circle. Water guns loaded. Last tribe standing wins the phase."`);
    ln(`${ct.standoff.participantCount || 'All'} players step into the standoff circle.`);

    for (const round of ct.standoff.rounds) {
      ln(`\n— Round ${round.num} —`);
      const hits = (round.shots || []).filter(s => s.hit);
      const misses = (round.shots || []).filter(s => !s.hit);
      for (const s of hits) {
        ln(`${s.shooter} nails ${s.target}!`);
      }
      if (misses.length > 2) {
        ln(`${misses.length} shots go wide.`);
      } else {
        for (const s of misses) {
          ln(`${s.shooter} misses ${s.target}.`);
        }
      }
      for (const evt of (round.events || [])) {
        if (evt.text) ln(evt.text);
      }
      for (const elim of (round.eliminations || [])) {
        const elimName = typeof elim === 'string' ? elim : elim.name;
        ln(`${elimName} takes their second hit — OUT of the standoff!`);
      }
    }

    if (ct.standoff.gunslingers?.length) {
      ln(`\n${ct.standoff.gunslingers.join(' & ')} earned the GUNSLINGER badge with 3+ eliminations!`);
    }
    if (ct.standoff.winner) {
      ln(`${host}: "${ct.standoff.winner} wins the standoff!"`);
    }
  }

  // ── Drama Break 2
  if (ct.breakEvents2?.length) {
    sec('Rising Tension');
    for (const evt of ct.breakEvents2) {
      if (evt.text) ln(evt.text);
    }
  }

  // ── Phase 3: Cattle Roundup
  if (ct.roundup) {
    sec('Phase 3: The Cattle Roundup');
    ln(`${host}: "${ct.roundup.cowboys} — you're the cowboys. ${ct.roundup.cattle} — you're the cattle. Cowboys, rope 'em. Cattle, run."`);

    for (const round of ct.roundup.rounds) {
      ln(`\n— Round ${round.num} —`);
      for (const l of (round.lassos || [])) {
        if (l.captured) {
          ln(`${l.cowboy} ropes ${l.target}! Captured!`);
        } else {
          ln(`${l.cowboy} throws the lasso at ${l.target} — and misses!`);
        }
      }
      for (const evt of (round.events || [])) {
        if (evt.text) ln(evt.text);
      }
    }

    if (ct.roundup.tablesTurned) {
      ln(`\nTABLES TURNED! The cattle found loose rope and counter-roped the cowboys!`);
    }
    if (ct.roundup.sheriff) {
      ln(`${ct.roundup.sheriff} earns the SHERIFF badge for most captures!`);
    }
    if (ct.roundup.winner) {
      ln(`${host}: "${ct.roundup.winner} wins the roundup!"`);
    }
  }

  // ── Final Result
  sec('The Verdict');
  const scores = ct.tribeScores || {};
  const scoreStr = Object.entries(scores).map(([t, s]) => `${t}: ${s}`).join(' | ');
  ln(`Final scores: ${scoreStr}`);

  if (ct.tiebreaker) {
    const duelStr = ct.tiebreaker.duelists?.join(' vs ') || 'two players';
    ln(`It's tied! ${duelStr} face off in a sudden-death quick-draw!`);
    ln(`${ct.tiebreaker.winner} wins the tiebreaker!`);
  }

  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  if (sorted.length >= 2) {
    ln(`${host}: "${sorted[0][0]} rides into the sunset with immunity! ${sorted[sorted.length - 1][0]}... I'll see you at tribal council."`);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// VP SHELL — Spaghetti Western CSS + helpers
// ═══════════════════════════════════════════════════════════════════════════

function _ctShell(content, ep) {
  return `
<style>
@import url('https://fonts.googleapis.com/css2?family=Rye&family=Inter:wght@400;600;700;900&display=swap');

/* ── Theme tokens ── */
.ct-shell{
  --ct-sepia:#d4a574;--ct-leather:#8b4513;--ct-dust:#c4a882;
  --ct-blood:#8b0000;--ct-gold:#daa520;--ct-iron:#4a4a4a;
  --ct-wanted:#f5e6c8;--ct-chalk:#e8e8e8;--ct-wood:#654321;
  --ct-neon-green:#39ff14;--ct-neon-red:#ff073a;--ct-neon-gold:#ffd700;
  --ct-parchment:#f4e4c1;--ct-ink:#2b1810;
  font-family:'Inter',sans-serif;color:var(--ct-ink);
  background:linear-gradient(180deg,#d4a574 0%,#a0724a 20%,#654321 50%,#2d1810 85%,#1a0e08 100%);
  padding:0;max-width:1100px;margin:0 auto;position:relative;min-height:400px;
  overflow:hidden;border:3px solid #3d200b;box-shadow:inset 0 0 60px rgba(0,0,0,0.4),0 0 30px rgba(0,0,0,0.5);
}

/* ── Film grain overlay ── */
.ct-shell::before{content:'';position:absolute;top:0;left:0;right:0;bottom:0;
  background:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E");
  opacity:.06;pointer-events:none;z-index:5;animation:ct-grain 0.5s steps(6) infinite;
  mix-blend-mode:overlay;filter:sepia(0.3)}

/* ── Projector flicker ── */
.ct-shell::after{content:'';position:absolute;top:0;left:0;right:0;bottom:0;
  background:transparent;pointer-events:none;z-index:4;animation:ct-flicker 4s linear infinite}

/* ── Header — weathered wood plank ── */
.ct-header{background:linear-gradient(180deg,#3d200b 0%,#2a1508 50%,#1e0f05 100%);
  padding:16px 20px;display:flex;align-items:center;justify-content:space-between;
  border-bottom:3px solid var(--ct-gold);position:relative;z-index:6;
  box-shadow:inset 0 -2px 8px rgba(0,0,0,0.5),0 2px 10px rgba(0,0,0,0.4)}
.ct-title{font-family:'Rye',serif;font-size:18px;color:var(--ct-gold);
  text-shadow:2px 2px 0 var(--ct-blood),4px 4px 0 rgba(0,0,0,0.4);letter-spacing:3px}
.ct-subtitle{font-size:10px;color:rgba(255,255,255,0.5);letter-spacing:4px;text-transform:uppercase;margin-top:2px}

/* ── Layout ── */
.ct-layout{display:flex;gap:14px;align-items:flex-start;padding:14px;position:relative;z-index:6}
.ct-feed{flex:1;min-width:0}
.ct-sidebar{width:260px;flex-shrink:0;position:sticky;top:60px;max-height:calc(100vh - 80px);overflow-y:auto;align-self:flex-start;
  scrollbar-width:thin;scrollbar-color:rgba(218,165,32,0.25) transparent;
  background:linear-gradient(180deg,rgba(59,27,10,0.85),rgba(30,15,5,0.9));
  backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);
  border:1px solid rgba(218,165,32,0.15);border-radius:4px;padding:12px;
  box-shadow:inset 0 0 20px rgba(0,0,0,0.3)}

/* ── HUD — chalk scoreboard ── */
.ct-hud{display:flex;gap:2px;margin:0 14px 2px;position:relative;z-index:6}
.ct-hud-cell{flex:1;background:rgba(0,0,0,0.45);border:1px solid rgba(218,165,32,0.12);
  padding:8px 4px;text-align:center}
.ct-hud-cell:first-child{border-radius:4px 0 0 4px}.ct-hud-cell:last-child{border-radius:0 4px 4px 0}
.ct-hud-val{font-family:'Rye',serif;font-size:18px;font-weight:700;color:var(--ct-chalk);
  text-shadow:0 0 8px rgba(232,232,232,0.3),0 0 20px rgba(232,232,232,0.1)}
.ct-hud-lbl{font-size:7px;letter-spacing:2px;color:rgba(255,255,255,0.35);margin-top:2px;text-transform:uppercase}

/* ── Event cards — parchment with torn edges ── */
.ct-ev{background:linear-gradient(135deg,rgba(244,228,193,0.12),rgba(196,168,130,0.08));
  backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);
  border:1px solid rgba(218,165,32,0.1);border-left:3px solid var(--ct-gold);
  padding:12px 14px;margin-bottom:5px;display:flex;align-items:flex-start;gap:12px;
  border-radius:3px;animation:ct-fade-up 0.4s ease-out;position:relative}
.ct-ev::after{content:'';position:absolute;top:0;right:0;bottom:0;width:6px;
  background:linear-gradient(180deg,transparent 0%,rgba(139,69,19,0.1) 15%,transparent 30%,
  rgba(139,69,19,0.08) 50%,transparent 65%,rgba(139,69,19,0.12) 80%,transparent 100%);
  pointer-events:none}
.ct-ev.negative{border-left-color:var(--ct-blood)}
.ct-ev.positive{border-left-color:var(--ct-gold)}
.ct-ev.showmance{border-left-color:#c2185b}
.ct-ev.round-header{border-left-color:var(--ct-leather);
  background:linear-gradient(135deg,rgba(139,69,19,0.2),rgba(101,67,33,0.15));
  font-family:'Rye',serif}
.ct-ev-badge{display:inline-block;font-family:'Rye',serif;font-size:7px;letter-spacing:2px;
  padding:2px 8px;border-radius:2px;margin-bottom:4px;text-transform:uppercase;
  background:rgba(255,255,255,0.08);color:rgba(255,255,255,0.7)}
.ct-ev-badge.gold{background:rgba(218,165,32,0.2);color:var(--ct-gold)}
.ct-ev-badge.red{background:rgba(139,0,0,0.25);color:#e53935}
.ct-ev-badge.teal{background:rgba(57,255,20,0.1);color:var(--ct-neon-green)}
.ct-ev-badge.blue{background:rgba(33,150,243,0.15);color:#64b5f6}
.ct-ev-badge.orange{background:rgba(255,152,0,0.15);color:#ffb74d}
.ct-ev-badge.pink{background:rgba(194,24,91,0.15);color:#f48fb1}
.ct-ev-badge.gray{background:rgba(255,255,255,0.06);color:rgba(255,255,255,0.4)}
.ct-ev-badge.purple{background:rgba(156,39,176,0.15);color:#ce93d8}
.ct-ev-badge.green{background:rgba(57,255,20,0.1);color:#81c784}
.ct-ev-text{font-size:13px;line-height:1.7;color:rgba(255,255,255,0.85)}
.ct-ev-port{width:44px;height:44px;border-radius:50%;overflow:hidden;flex-shrink:0;display:flex;
  align-items:center;justify-content:center;border:2px solid rgba(139,69,19,0.5)}
.ct-ev-port img{width:44px;height:44px;border-radius:50%;object-fit:cover;filter:sepia(0.2)}

/* ═══ WANTED POSTER PORTRAITS ═══ */
.ct-portrait{display:inline-block;text-align:center;position:relative;
  background:linear-gradient(135deg,var(--ct-wanted),#e8d5a8);
  border:4px solid var(--ct-wood);border-radius:2px;padding:8px 6px 4px;
  box-shadow:3px 3px 10px rgba(0,0,0,0.5),inset 0 0 15px rgba(139,69,19,0.15)}
.ct-portrait::before{content:'WANTED';display:block;font-family:'Rye',serif;font-size:8px;
  letter-spacing:4px;color:var(--ct-blood);margin-bottom:4px;text-align:center;
  text-shadow:0 1px 0 rgba(0,0,0,0.1)}
.ct-portrait img{display:block;margin:0 auto 4px;border-radius:2px;
  border:2px solid var(--ct-leather);filter:sepia(0.35) contrast(1.1);
  box-shadow:inset 0 0 8px rgba(0,0,0,0.3)}
.ct-portrait-name{font-family:'Rye',serif;font-size:8px;letter-spacing:1px;color:var(--ct-ink);
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:2px}
.ct-portrait[data-bounty]::after{content:'$' attr(data-bounty);display:block;font-family:'Rye',serif;
  font-size:7px;color:var(--ct-blood);letter-spacing:1px;margin-top:2px}

/* DEAD stamp */
.ct-portrait.dead img{filter:grayscale(1) sepia(0.2) contrast(0.8)}
.ct-portrait.dead::after{content:'DEAD';position:absolute;top:50%;left:50%;
  transform:translate(-50%,-50%) rotate(-15deg);font-family:'Rye',serif;font-size:18px;
  letter-spacing:4px;color:rgba(139,0,0,0.8);text-shadow:0 0 4px rgba(139,0,0,0.3);
  animation:ct-stamp 0.4s ease-out both;pointer-events:none;z-index:2;
  border:3px solid rgba(139,0,0,0.6);padding:2px 8px;border-radius:3px}

/* CHICKEN stamp */
.ct-portrait.chicken img{filter:sepia(0.4) saturate(0.7)}
.ct-portrait.chicken::after{content:'CHICKEN';position:absolute;top:50%;left:50%;
  transform:translate(-50%,-50%) rotate(-12deg);font-family:'Rye',serif;font-size:14px;
  letter-spacing:3px;color:rgba(218,165,32,0.9);text-shadow:0 0 4px rgba(218,165,32,0.3);
  animation:ct-stamp 0.4s ease-out both;pointer-events:none;z-index:2;
  border:3px solid rgba(218,165,32,0.6);padding:2px 6px;border-radius:3px}

/* ═══ NEON BADGES — the wow factor ═══ */
.ct-badge-neon{display:inline-block;font-family:'Rye',serif;font-size:9px;letter-spacing:3px;
  text-transform:uppercase;padding:4px 12px;border-radius:4px;position:relative;
  background:rgba(0,0,0,0.6);border:1px solid currentColor;
  animation:ct-neon-flicker 4s ease-in-out infinite}
.ct-badge-neon.gold{color:var(--ct-neon-gold);
  text-shadow:0 0 7px var(--ct-neon-gold),0 0 15px var(--ct-neon-gold),0 0 30px var(--ct-neon-gold),0 0 50px rgba(255,215,0,0.4);
  box-shadow:inset 0 0 10px rgba(255,215,0,0.1),0 0 15px rgba(255,215,0,0.2)}
.ct-badge-neon.chicken,.ct-badge-neon.red{color:var(--ct-neon-red);
  text-shadow:0 0 7px var(--ct-neon-red),0 0 15px var(--ct-neon-red),0 0 30px var(--ct-neon-red),0 0 50px rgba(255,7,58,0.4);
  box-shadow:inset 0 0 10px rgba(255,7,58,0.1),0 0 15px rgba(255,7,58,0.2)}
.ct-badge-neon.gunslinger{color:var(--ct-neon-gold);
  text-shadow:0 0 7px var(--ct-neon-gold),0 0 15px var(--ct-neon-gold),0 0 30px var(--ct-neon-gold),0 0 60px rgba(255,215,0,0.5);
  box-shadow:inset 0 0 12px rgba(255,215,0,0.15),0 0 20px rgba(255,215,0,0.3);
  animation:ct-neon-flicker 4s ease-in-out infinite,ct-neon-glow 2s ease-in-out infinite}
.ct-badge-neon.sheriff{color:var(--ct-neon-green);
  text-shadow:0 0 7px var(--ct-neon-green),0 0 15px var(--ct-neon-green),0 0 30px var(--ct-neon-green),0 0 50px rgba(57,255,20,0.4);
  box-shadow:inset 0 0 10px rgba(57,255,20,0.1),0 0 15px rgba(57,255,20,0.2)}
.ct-badge-neon.outlaw{color:var(--ct-neon-red);
  text-shadow:0 0 7px var(--ct-neon-red),0 0 15px var(--ct-neon-red),0 0 40px var(--ct-neon-red),0 0 60px rgba(255,7,58,0.5);
  box-shadow:inset 0 0 14px rgba(255,7,58,0.15),0 0 20px rgba(255,7,58,0.3);
  animation:ct-neon-flicker 2s ease-in-out infinite}

/* ═══ SALOON DOORS ═══ */
.ct-saloon-door{perspective:800px;display:flex;width:100%;overflow:hidden;position:relative;min-height:60px}
.ct-saloon-door .ct-door-left,.ct-saloon-door .ct-door-right{
  width:50%;background:linear-gradient(180deg,#5c3310,#3d200b);
  border:2px solid #7a4a1e;position:relative;z-index:2;
  box-shadow:inset 0 0 20px rgba(0,0,0,0.4);transform-origin:left center;
  transition:transform 0.8s cubic-bezier(0.34,1.56,0.64,1)}
.ct-saloon-door .ct-door-right{transform-origin:right center}
.ct-saloon-door .ct-door-left::after,.ct-saloon-door .ct-door-right::after{
  content:'';position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
  width:12px;height:12px;border-radius:50%;background:var(--ct-gold);
  box-shadow:0 0 8px rgba(218,165,32,0.4)}
.ct-saloon-door.open .ct-door-left{transform:rotateY(-85deg)}
.ct-saloon-door.open .ct-door-right{transform:rotateY(85deg)}
.ct-saloon-reveal{position:absolute;top:0;left:0;right:0;bottom:0;z-index:1;
  display:flex;align-items:center;justify-content:center;padding:12px}

/* ═══ POKER CARDS ═══ */
.ct-poker-card{width:80px;height:112px;position:relative;perspective:600px;cursor:pointer;
  display:inline-block;margin:4px;transition:transform 0.3s}
.ct-poker-card:hover{transform:translateY(-4px)}
.ct-poker-card .ct-card-inner{position:relative;width:100%;height:100%;
  transition:transform 0.6s cubic-bezier(0.4,0,0.2,1);transform-style:preserve-3d}
.ct-poker-card.flipped .ct-card-inner{transform:rotateY(180deg)}
.ct-poker-card .ct-card-front,.ct-poker-card .ct-card-back{
  position:absolute;top:0;left:0;width:100%;height:100%;backface-visibility:hidden;
  border-radius:6px;overflow:hidden;border:2px solid rgba(218,165,32,0.3)}
.ct-poker-card .ct-card-back{background:linear-gradient(135deg,#5c3310,#3d200b);
  display:flex;align-items:center;justify-content:center;font-size:28px;
  box-shadow:inset 0 0 15px rgba(0,0,0,0.4),0 2px 8px rgba(0,0,0,0.3)}
.ct-poker-card .ct-card-back::before{content:'';position:absolute;top:6px;left:6px;right:6px;bottom:6px;
  border:1px solid rgba(218,165,32,0.2);border-radius:3px;
  background:repeating-linear-gradient(45deg,transparent,transparent 4px,rgba(218,165,32,0.05) 4px,rgba(218,165,32,0.05) 8px)}
.ct-poker-card .ct-card-front{background:var(--ct-parchment);transform:rotateY(180deg);
  padding:6px;font-size:10px;color:var(--ct-ink);display:flex;flex-direction:column;
  align-items:center;justify-content:center;text-align:center;
  box-shadow:inset 0 0 10px rgba(139,69,19,0.1),0 2px 8px rgba(0,0,0,0.3)}
.ct-poker-card.dealing{animation:ct-card-deal 0.5s ease-out both}

/* ═══ CHALK SCOREBOARD ═══ */
.ct-chalk-board{background:linear-gradient(135deg,#1a2a1a,#0d1a0d,#1a2a1a);
  border:3px solid #3d200b;border-radius:4px;padding:12px;position:relative;
  box-shadow:inset 0 0 30px rgba(0,0,0,0.5)}
.ct-chalk-board::before{content:'';position:absolute;top:0;left:0;right:0;bottom:0;
  background:url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='c'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.2' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23c)'/%3E%3C/svg%3E");
  opacity:.03;pointer-events:none;mix-blend-mode:overlay;border-radius:2px}
.ct-chalk-num{display:inline-block;font-family:'Rye',serif;font-size:24px;color:var(--ct-chalk);
  text-shadow:0 0 6px rgba(232,232,232,0.2);padding:0 3px;
  animation:ct-chalk-flip 0.4s ease-out}

/* ═══ AMBIENT — tumbleweed ═══ */
.ct-tumbleweed{position:absolute;z-index:3;pointer-events:none;font-size:20px;
  animation:ct-tumbleweed 14s linear infinite;opacity:0.5}

/* ═══ AMBIENT — dust motes ═══ */
.ct-dust-mote{position:absolute;width:3px;height:3px;border-radius:50%;
  background:rgba(212,165,116,0.4);z-index:3;pointer-events:none;
  animation:ct-dust-float 6s ease-in-out infinite}

/* ═══ CONTROLS ═══ */
.ct-btn-next{padding:10px 28px;
  background:linear-gradient(135deg,var(--ct-leather),var(--ct-wood));
  color:var(--ct-gold);border:2px solid rgba(218,165,32,0.3);border-radius:4px;cursor:pointer;
  font-family:'Rye',serif;font-size:12px;letter-spacing:3px;
  box-shadow:0 4px 15px rgba(101,67,33,0.5),inset 0 1px 0 rgba(255,255,255,0.1);
  transition:transform 0.15s,box-shadow 0.15s;text-transform:uppercase}
.ct-btn-next:hover{transform:translateY(-2px);box-shadow:0 6px 20px rgba(101,67,33,0.6),inset 0 1px 0 rgba(255,255,255,0.15)}
.ct-btn-all{padding:8px 18px;background:rgba(255,255,255,0.06);color:rgba(255,255,255,0.45);
  border:1px solid rgba(255,255,255,0.1);border-radius:4px;cursor:pointer;font-size:11px;
  transition:background 0.15s}
.ct-btn-all:hover{background:rgba(255,255,255,0.12);color:rgba(255,255,255,0.7)}
.ct-controls{display:flex;gap:8px;justify-content:center;padding:16px 0;position:relative;z-index:6}

/* ── Sidebar sections ── */
.ct-side-sec{font-family:'Rye',serif;font-size:8px;letter-spacing:3px;
  color:rgba(218,165,32,0.4);border-bottom:1px solid rgba(218,165,32,0.1);
  padding-bottom:3px;margin:12px 0 6px;text-transform:uppercase}

/* ═══ KEYFRAMES ═══ */
@keyframes ct-grain{
  0%{transform:translate(0,0)}16%{transform:translate(-2px,1px)}
  33%{transform:translate(1px,-1px)}50%{transform:translate(-1px,2px)}
  66%{transform:translate(2px,-1px)}83%{transform:translate(-2px,-1px)}
  100%{transform:translate(0,0)}}
@keyframes ct-flicker{
  0%{opacity:1}25%{opacity:0.97}50%{opacity:1}75%{opacity:0.96}100%{opacity:1}}
@keyframes ct-neon-flicker{
  0%{opacity:1}5%{opacity:0.8}10%{opacity:1}15%{opacity:0.9}20%{opacity:1}100%{opacity:1}}
@keyframes ct-neon-glow{
  0%,100%{filter:brightness(1)}50%{filter:brightness(1.3)}}
@keyframes ct-tumbleweed{
  0%{left:-60px;opacity:0;transform:rotate(0deg)}
  8%{opacity:0.5}85%{opacity:0.5}
  100%{left:calc(100% + 60px);opacity:0;transform:rotate(720deg)}}
@keyframes ct-dust-float{
  0%{opacity:0;transform:translate(0,0)}
  20%{opacity:0.6}50%{opacity:0.4;transform:translate(var(--dx,2px),var(--dy,-15px))}
  80%{opacity:0.2}100%{opacity:0;transform:translate(calc(var(--dx,2px)*2),calc(var(--dy,-15px)*1.5))}}
@keyframes ct-saloon-swing{
  0%{transform:rotateY(90deg)}40%{transform:rotateY(-10deg)}70%{transform:rotateY(5deg)}100%{transform:rotateY(0deg)}}
@keyframes ct-card-deal{
  0%{transform:translateY(-80px) rotate(-5deg);opacity:0}
  60%{transform:translateY(4px) rotate(1deg);opacity:1}
  100%{transform:translateY(0) rotate(0deg);opacity:1}}
@keyframes ct-card-flip{0%{transform:rotateY(0deg)}100%{transform:rotateY(180deg)}}
@keyframes ct-fade-up{0%{opacity:0;transform:translateY(12px)}100%{opacity:1;transform:translateY(0)}}
@keyframes ct-stamp{
  0%{transform:translate(-50%,-50%) rotate(-15deg) scale(3);opacity:0}
  70%{transform:translate(-50%,-50%) rotate(-15deg) scale(0.95);opacity:1}
  100%{transform:translate(-50%,-50%) rotate(-15deg) scale(1);opacity:1}}
@keyframes ct-chalk-flip{
  0%{transform:rotateX(0deg)}50%{transform:rotateX(-90deg)}100%{transform:rotateX(0deg)}}
@keyframes ct-countdown{0%,100%{transform:scale(1)}50%{transform:scale(1.5)}}
@keyframes ct-eyes-narrow{0%{clip-path:inset(0)}100%{clip-path:inset(35% 0)}}
@keyframes ct-heartbeat{0%,100%{transform:scale(1)}50%{transform:scale(1.06)}}
@keyframes ct-lasso{0%{stroke-dashoffset:300}100%{stroke-dashoffset:0}}
@keyframes ct-brand-sizzle{
  0%{filter:brightness(1);box-shadow:none}
  50%{filter:brightness(1.5);box-shadow:0 0 15px rgba(139,0,0,0.6)}
  100%{filter:brightness(1);box-shadow:none}}

/* ═══ prefers-reduced-motion ═══ */
@media (prefers-reduced-motion:reduce){
  .ct-shell::before,.ct-shell::after,.ct-tumbleweed,.ct-dust-mote{animation:none !important}
  .ct-ev,.ct-poker-card,.ct-poker-card .ct-card-inner,.ct-badge-neon,
  .ct-saloon-door .ct-door-left,.ct-saloon-door .ct-door-right,
  .ct-chalk-num,.ct-portrait.dead::after,.ct-portrait.chicken::after{
    animation:none !important;transition:none !important}
  .ct-tumbleweed,.ct-dust-mote{display:none}
}
</style>
<div class="ct-shell">
  <div class="ct-header">
    <div>
      <div class="ct-title">3:10 TO CRAZYTOWN</div>
      <div class="ct-subtitle">Dive &middot; Draw &middot; Rope</div>
    </div>
    <div style="font-size:10px;color:rgba(255,255,255,0.35);letter-spacing:2px;font-family:'Rye',serif;">EPISODE ${ep?.num || '?'}</div>
  </div>
  ${content}
</div>`;
}

// ── VP helpers ─────────────────────────────────────────────────────────────

function _ctPortrait(name, size = 64) {
  const slug = players.find(p => p.name === name)?.slug || name.toLowerCase().replace(/\s+/g, '-');
  return `<div class="ct-portrait" style="width:${size}px">
    <img src="assets/avatars/${slug}.png" width="${size}" height="${size}" style="display:block;border-radius:2px;">
    <div class="ct-portrait-name">${name}</div>
  </div>`;
}

function _ctNeonBadge(text, type = 'gold') {
  return `<span class="ct-badge-neon ${type}">${text}</span>`;
}

function _ctChalkNum(num) {
  return `<span class="ct-chalk-num">${num}</span>`;
}

function _ctPokerCard(content, id, faceDown = true) {
  return `<div class="ct-poker-card ${faceDown ? '' : 'flipped'} dealing" data-card-id="${id}">
    <div class="ct-card-inner">
      <div class="ct-card-back"></div>
      <div class="ct-card-front">${content}</div>
    </div>
  </div>`;
}

// ═══════════════════════════════════════════════════════════════════════════
// VP — Title Card
// ═══════════════════════════════════════════════════════════════════════════

export function rpBuildCrazytownTitleCard(ep) {
  const ct = ep.crazytown;
  if (!ct) return '';
  const tribeNames = Object.keys(ct.tribeScores || {});
  const allPlayers = gs.tribes ? gs.tribes.flatMap(t => t.members) : [];
  const host = seasonConfig.host || 'Chris';

  return _ctShell(`
    <!-- Tumbleweed layer -->
    <div class="ct-tumbleweed" style="top:20%">&#127806;</div>
    <div class="ct-tumbleweed" style="top:60%;animation-delay:-5s;animation-duration:15s">&#127806;</div>
    <div class="ct-tumbleweed" style="top:40%;animation-delay:-8s;animation-duration:18s;font-size:14px">&#127806;</div>

    <!-- Dust motes -->
    <div class="ct-dust-mote" style="left:15%;top:30%;--dx:3px;--dy:-20px"></div>
    <div class="ct-dust-mote" style="left:45%;top:50%;--dx:-2px;--dy:-15px;animation-delay:-2s"></div>
    <div class="ct-dust-mote" style="left:75%;top:25%;--dx:4px;--dy:-25px;animation-delay:-4s"></div>
    <div class="ct-dust-mote" style="left:60%;top:70%;--dx:-3px;--dy:-18px;animation-delay:-1s"></div>
    <div class="ct-dust-mote" style="left:30%;top:55%;--dx:2px;--dy:-22px;animation-delay:-3s"></div>
    <div class="ct-dust-mote" style="left:85%;top:45%;--dx:-4px;--dy:-16px;animation-delay:-5s"></div>

    <div style="text-align:center;padding:50px 20px 80px;position:relative;z-index:6;">
      <div style="font-family:'Inter',sans-serif;font-size:11px;letter-spacing:4px;color:rgba(255,255,255,0.5);text-transform:uppercase;margin-bottom:12px;">${host} Presents</div>

      <div style="font-family:'Rye',serif;font-size:42px;color:var(--ct-gold);text-shadow:3px 3px 0 var(--ct-blood),6px 6px 0 rgba(0,0,0,0.3);letter-spacing:4px;line-height:1.1;margin-bottom:6px;">3:10 TO<br>CRAZYTOWN</div>

      <div style="font-family:'Rye',serif;font-size:14px;letter-spacing:6px;color:var(--ct-sepia);text-shadow:1px 1px 0 rgba(0,0,0,0.3);margin-bottom:20px;">DIVE &middot; DRAW &middot; ROPE</div>

      <div style="display:inline-block;background:rgba(0,0,0,0.4);backdrop-filter:blur(8px);border:1px solid rgba(218,165,32,0.15);border-radius:8px;padding:14px 24px;margin-bottom:20px;">
        <div style="font-size:10px;letter-spacing:3px;color:rgba(255,255,255,0.4);text-transform:uppercase;margin-bottom:8px;">Today's Showdown</div>
        <div style="font-size:14px;color:rgba(255,255,255,0.9);font-weight:700;">Horse Dive / Standoff / Roundup</div>
      </div>

      <div style="display:flex;gap:20px;justify-content:center;font-size:11px;color:rgba(255,255,255,0.5);flex-wrap:wrap;">
        <span>&#129312; ${allPlayers.length} Contestants</span>
        <span>&#128052; 3 Phases</span>
        ${tribeNames.map(t => `<span>&#128681; ${t}</span>`).join('')}
      </div>
    </div>
  `, ep);
}

// ═══════════════════════════════════════════════════════════════════════════
// VP — Horse Dive
// ═══════════════════════════════════════════════════════════════════════════

export function rpBuildCrazytownHorseDive(ep) {
  const ct = ep.crazytown;
  if (!ct?.horseDive) return '';
  const hd = ct.horseDive;

  if (!window._tvState) window._tvState = {};
  if (!window._tvState['ct-dive']) window._tvState['ct-dive'] = { idx: -1 };
  const revIdx = window._tvState['ct-dive'].idx;

  // Build interleaved steps from all tribe reactions
  const steps = [];
  const maxLen = Math.max(...hd.tribeResults.map(t => t.reactions.length));
  for (let i = 0; i < maxLen; i++) {
    for (const tr of hd.tribeResults) {
      if (i < tr.reactions.length) {
        steps.push({ ...tr.reactions[i], tribe: tr.tribe });
      }
    }
  }

  // Sidebar
  let sidebar = '';
  for (const tr of hd.tribeResults) {
    const jumpers = tr.reactions.filter(r => r.jumped);
    const chickens = tr.reactions.filter(r => !r.jumped);
    sidebar += `<div class="ct-side-sec">${tr.tribe}</div>`;
    for (const r of tr.reactions) {
      const slug = players.find(p => p.name === r.name)?.slug || r.name.toLowerCase().replace(/\s+/g, '-');
      const icon = r.jumped ? '&#9989;' : '&#128020;';
      const scoreHtml = r.jumped && r.landingScore != null ? ` ${_ctChalkNum(r.landingScore)}` : '';
      const intBadge = r.intervention ? `<span style="font-size:8px;color:var(--ct-sepia);margin-left:4px">${r.intervention.type === 'convince' ? 'TALKED' : 'PUSHED'}</span>` : '';
      sidebar += `<div style="display:flex;align-items:center;gap:6px;padding:3px 0;font-size:11px;color:rgba(255,255,255,0.8)">
        <img src="assets/avatars/${slug}.png" width="32" height="32" style="border-radius:2px;border:1px solid var(--ct-leather);filter:sepia(0.2)" onerror="this.style.display='none'">
        <span style="flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${r.name}</span>
        <span>${icon}</span>${scoreHtml}${intBadge}
      </div>`;
    }
    sidebar += `<div style="text-align:right;padding:4px 0;border-top:1px solid rgba(218,165,32,0.1);margin-top:4px">
      <span style="font-size:9px;color:rgba(255,255,255,0.4)">TRIBE SCORE</span> ${_ctChalkNum(tr.tribeScore)}
    </div>`;
  }

  // Feed — poker card reveals
  let feed = '';
  for (let i = 0; i < steps.length; i++) {
    if (i > revIdx) break;
    const s = steps[i];
    const slug = players.find(p => p.name === s.name)?.slug || s.name.toLowerCase().replace(/\s+/g, '-');
    const cardContent = s.jumped
      ? `<img src="assets/avatars/${slug}.png" width="40" height="40" style="border-radius:2px;filter:sepia(0.2);margin-bottom:4px" onerror="this.style.display='none'"><div style="font-family:'Rye',serif;font-size:8px;color:var(--ct-blood)">${s.landingQuality || 'JUMPED'}</div><div style="font-family:'Rye',serif;font-size:14px;color:var(--ct-ink)">${s.landingScore ?? ''}</div>`
      : `<img src="assets/avatars/${slug}.png" width="40" height="40" style="border-radius:2px;filter:sepia(0.4) saturate(0.5);margin-bottom:4px" onerror="this.style.display='none'"><div style="font-family:'Rye',serif;font-size:10px;color:var(--ct-gold)">CHICKEN</div>`;

    feed += `<div class="ct-ev ${s.jumped ? 'positive' : 'negative'}" style="animation-delay:${i * 0.05}s">
      <div class="ct-ev-port"><img src="assets/avatars/${slug}.png" onerror="this.style.display='none'"></div>
      <div style="flex:1;min-width:0">
        <div class="ct-ev-badge ${s.jumped ? 'gold' : 'red'}">${s.tribe} &mdash; ${s.jumped ? 'JUMPED' : 'CHICKEN'}</div>
        <div class="ct-ev-text">${s.text || ''}</div>
        ${s.jumped && s.landingScore != null ? `<div style="margin-top:4px">${_ctNeonBadge('SCORE: ' + s.landingScore, 'gold')}</div>` : ''}
      </div>
      <div style="flex-shrink:0">${_ctPokerCard(cardContent, 'dive-' + i, false)}</div>
    </div>`;

    // Intervention card
    if (s.intervention) {
      const iv = s.intervention;
      const ivSlug = players.find(p => p.name === iv.by)?.slug || iv.by.toLowerCase().replace(/\s+/g, '-');
      feed += `<div class="ct-ev ${iv.success ? 'positive' : 'negative'}">
        <div class="ct-ev-port"><img src="assets/avatars/${ivSlug}.png" onerror="this.style.display='none'"></div>
        <div style="flex:1;min-width:0">
          <div class="ct-ev-badge ${iv.success ? 'teal' : 'orange'}">${iv.type === 'convince' ? 'PEP TALK' : 'SHOVE'} &mdash; ${iv.success ? 'SUCCESS' : 'FAILED'}</div>
          <div class="ct-ev-text">${iv.text || `${iv.by} ${iv.type === 'convince' ? 'tried to talk' : 'tried to push'} ${s.name} off the platform.`}</div>
          ${iv.hostLine ? `<div style="margin-top:4px;font-style:italic;font-size:11px;color:var(--ct-sepia)">${iv.hostLine}</div>` : ''}
        </div>
      </div>`;
    }
  }

  // HUD
  const hudCells = hd.tribeResults.map(tr => {
    const j = tr.reactions.filter(r => r.jumped).length;
    const c = tr.reactions.filter(r => !r.jumped).length;
    return `<div class="ct-hud-cell">
      <div class="ct-hud-val">${_ctChalkNum(tr.tribeScore)}</div>
      <div class="ct-hud-lbl">${tr.tribe}</div>
      <div style="font-size:9px;color:rgba(255,255,255,0.4);margin-top:2px">${j}J / ${c}C</div>
    </div>`;
  }).join('');

  const pending = revIdx < steps.length - 1;
  const controls = `<div class="ct-controls">
    ${pending ? `<button class="ct-btn-next" onclick="crazytownRevealNext('ct-dive')">NEXT JUMP</button>` : ''}
    ${pending ? `<button class="ct-btn-all" onclick="crazytownRevealAll('ct-dive')">Reveal All</button>` : ''}
    ${!pending && steps.length ? `<div>${_ctNeonBadge(hd.winner ? hd.winner + ' WINS THE DIVE' : 'PHASE COMPLETE', 'gold')}</div>` : ''}
  </div>`;

  return _ctShell(`
    <div class="ct-hud">${hudCells}</div>
    <div class="ct-layout">
      <div class="ct-feed">${feed}${controls}</div>
      <div class="ct-sidebar">${sidebar}</div>
    </div>
  `, ep);
}

// ═══════════════════════════════════════════════════════════════════════════
// VP — Standoff
// ═══════════════════════════════════════════════════════════════════════════

export function rpBuildCrazytownStandoff(ep) {
  const ct = ep.crazytown;
  if (!ct?.standoff) return '';
  const so = ct.standoff;

  if (!window._tvState) window._tvState = {};
  if (!window._tvState['ct-standoff']) window._tvState['ct-standoff'] = { idx: -1 };
  const revIdx = window._tvState['ct-standoff'].idx;

  const allNames = Object.keys(so.standings || {});
  const gunslingerSet = new Set(so.gunslingers || []);

  // Sidebar — player roster with status
  let sidebar = `<div class="ct-side-sec">COMBATANTS</div>`;
  for (const name of allNames) {
    const status = so.standings[name];
    const isDead = status === 'eliminated';
    const isGun = gunslingerSet.has(name);
    const slug = players.find(p => p.name === name)?.slug || name.toLowerCase().replace(/\s+/g, '-');
    // Count hits taken
    let hits = 0;
    for (const r of (so.rounds || [])) {
      for (const s of (r.shots || [])) {
        if (s.target === name && s.hit) hits++;
      }
    }
    const pips = Array.from({ length: 3 }, (_, i) => `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;margin:0 1px;background:${i < hits ? 'var(--ct-neon-red)' : 'rgba(255,255,255,0.1)'};box-shadow:${i < hits ? '0 0 4px var(--ct-neon-red)' : 'none'}"></span>`).join('');

    sidebar += `<div style="display:flex;align-items:center;gap:6px;padding:3px 0;font-size:11px;color:rgba(255,255,255,${isDead ? '0.35' : '0.8'})">
      <div class="ct-portrait ${isDead ? 'dead' : ''}" style="width:36px;padding:3px 2px 2px">
        <img src="assets/avatars/${slug}.png" width="32" height="32" style="display:block;border-radius:2px;border:1px solid var(--ct-leather)">
        <div class="ct-portrait-name" style="font-size:6px">${name}</div>
      </div>
      <div style="flex:1">
        <div style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${name}</div>
        <div>${pips}</div>
      </div>
      ${isGun ? `<span style="flex-shrink:0">${_ctNeonBadge('GUN', 'gunslinger')}</span>` : ''}
    </div>`;
  }

  // Count standing per tribe
  const tribeStanding = {};
  if (gs.tribes) {
    for (const t of gs.tribes) {
      const alive = t.members.filter(m => so.standings[m] === 'standing').length;
      tribeStanding[t.name] = alive;
    }
  }

  // Feed — round-by-round reveals
  let feed = '';
  const rounds = so.rounds || [];
  for (let ri = 0; ri < rounds.length; ri++) {
    if (ri > revIdx) break;
    const r = rounds[ri];

    // Splitcam intro — pick 3-4 shooters from this round
    const camNames = (r.shots || []).slice(0, 4).map(s => s.shooter);
    let splitcam = `<div class="ct-splitcam" style="display:flex;gap:2px;margin:8px 0;overflow:hidden;border-radius:4px;border:2px solid var(--ct-iron)">`;
    camNames.forEach((n, ci) => {
      const sl = players.find(p => p.name === n)?.slug || n.toLowerCase().replace(/\s+/g, '-');
      splitcam += `<div style="flex:1;height:80px;overflow:hidden;position:relative">
        <img src="assets/avatars/${sl}.png" style="width:100%;height:200%;object-fit:cover;object-position:center 30%;animation:ct-eyes-narrow 1.5s ease-in-out ${ci * 0.2}s forwards" onerror="this.style.display='none'">
      </div>`;
    });
    splitcam += `</div>`;

    // Round header
    feed += `<div class="ct-ev round-header">
      <div style="flex:1;text-align:center">
        <div style="font-family:'Rye',serif;font-size:16px;color:var(--ct-gold);letter-spacing:4px">ROUND ${r.num}</div>
      </div>
    </div>`;
    feed += splitcam;

    // Countdown
    feed += `<div style="text-align:center;padding:6px 0;font-family:'Rye',serif;font-size:14px;color:var(--ct-sepia);letter-spacing:6px;animation:ct-countdown 1s ease-out">3&hellip; 2&hellip; 1&hellip; <span style="color:var(--ct-neon-gold);text-shadow:0 0 10px var(--ct-neon-gold)">DRAW!</span></div>`;

    // Shot results
    for (const s of (r.shots || [])) {
      const sSlug = players.find(p => p.name === s.shooter)?.slug || s.shooter.toLowerCase().replace(/\s+/g, '-');
      const tSlug = players.find(p => p.name === s.target)?.slug || s.target.toLowerCase().replace(/\s+/g, '-');
      feed += `<div class="ct-ev ${s.hit ? 'negative' : ''}">
        <div class="ct-ev-port"><img src="assets/avatars/${sSlug}.png" onerror="this.style.display='none'"></div>
        <div style="flex:1;min-width:0">
          <div class="ct-ev-badge ${s.hit ? 'red' : 'gray'}">${s.hit ? 'HIT' : 'MISS'}</div>
          <div class="ct-ev-text"><strong>${s.shooter}</strong> fires at <strong>${s.target}</strong> &mdash; ${s.hit ? '<span style="color:var(--ct-neon-red)">DIRECT HIT!</span>' : '<span style="color:rgba(255,255,255,0.4)">Wide.</span>'}</div>
        </div>
        <div class="ct-ev-port"><img src="assets/avatars/${tSlug}.png" onerror="this.style.display='none'" style="${s.hit ? 'filter:grayscale(0.6) sepia(0.3)' : ''}"></div>
      </div>`;
    }

    // Events
    for (const evt of (r.events || [])) {
      feed += `<div class="ct-ev ${evt.type === 'betrayal' ? 'negative' : evt.type === 'shield' ? 'positive' : ''}">
        <div style="flex:1;min-width:0">
          <div class="ct-ev-badge ${evt.type === 'betrayal' ? 'red' : evt.type === 'shield' ? 'teal' : 'purple'}">${(evt.type || evt.id || 'EVENT').toUpperCase()}</div>
          <div class="ct-ev-text">${evt.text || ''}</div>
        </div>
      </div>`;
    }

    // Eliminations
    for (const elim of (r.eliminations || [])) {
      const eSlug = players.find(p => p.name === elim)?.slug || elim.toLowerCase().replace(/\s+/g, '-');
      feed += `<div class="ct-ev negative">
        <div class="ct-portrait dead" style="width:48px;padding:4px 3px 2px">
          <img src="assets/avatars/${eSlug}.png" width="44" height="44" style="display:block;border-radius:2px;border:1px solid var(--ct-leather)">
          <div class="ct-portrait-name" style="font-size:7px">${elim}</div>
        </div>
        <div style="flex:1;min-width:0">
          <div class="ct-ev-badge red">ELIMINATED</div>
          <div class="ct-ev-text"><strong>${elim}</strong> is out of the standoff.</div>
        </div>
      </div>`;
    }
  }

  // HUD
  const hudCells = Object.entries(tribeStanding).map(([t, c]) =>
    `<div class="ct-hud-cell"><div class="ct-hud-val">${_ctChalkNum(c)}</div><div class="ct-hud-lbl">${t} STANDING</div></div>`
  ).join('') + `<div class="ct-hud-cell"><div class="ct-hud-val">${_ctChalkNum(Math.min(revIdx + 1, rounds.length))}/${_ctChalkNum(rounds.length)}</div><div class="ct-hud-lbl">ROUND</div></div>`;

  const pending = revIdx < rounds.length - 1;
  const controls = `<div class="ct-controls">
    ${pending ? `<button class="ct-btn-next" onclick="crazytownRevealNext('ct-standoff')">NEXT ROUND</button>` : ''}
    ${pending ? `<button class="ct-btn-all" onclick="crazytownRevealAll('ct-standoff')">Reveal All</button>` : ''}
    ${!pending && rounds.length ? `<div>${_ctNeonBadge(so.winner ? so.winner + ' WINS THE STANDOFF' : 'STANDOFF COMPLETE', 'gold')}</div>` : ''}
  </div>`;

  return _ctShell(`
    <div class="ct-hud">${hudCells}</div>
    <div class="ct-layout">
      <div class="ct-feed">${feed}${controls}</div>
      <div class="ct-sidebar">${sidebar}</div>
    </div>
  `, ep);
}

// ═══════════════════════════════════════════════════════════════════════════
// VP — Roundup
// ═══════════════════════════════════════════════════════════════════════════

export function rpBuildCrazytownRoundup(ep) {
  const ct = ep.crazytown;
  if (!ct?.roundup) return '';
  const ru = ct.roundup;

  if (!window._tvState) window._tvState = {};
  if (!window._tvState['ct-roundup']) window._tvState['ct-roundup'] = { idx: -1 };
  const revIdx = window._tvState['ct-roundup'].idx;

  const capturedSet = new Set(ru.captures || []);
  const dodgeCounts = ru.dodgeCounts || {};

  // Sidebar
  let sidebar = `<div class="ct-side-sec">&#129312; COWBOYS &mdash; ${ru.cowboys}</div>`;
  for (const name of (ru.cowboyMembers || [])) {
    const slug = players.find(p => p.name === name)?.slug || name.toLowerCase().replace(/\s+/g, '-');
    let captures = 0;
    for (const r of (ru.rounds || [])) for (const l of (r.lassos || [])) if (l.cowboy === name && l.captured) captures++;
    const isSheriff = ru.sheriff === name;
    sidebar += `<div style="display:flex;align-items:center;gap:6px;padding:3px 0;font-size:11px;color:rgba(255,255,255,0.8)">
      <img src="assets/avatars/${slug}.png" width="32" height="32" style="border-radius:2px;border:1px solid var(--ct-leather);filter:sepia(0.2)" onerror="this.style.display='none'">
      <span style="flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${name}</span>
      <span style="font-size:9px;color:var(--ct-gold)">${captures} &#127935;</span>
      ${isSheriff ? `<span style="flex-shrink:0">${_ctNeonBadge('SHERIFF', 'sheriff')}</span>` : ''}
    </div>`;
  }
  sidebar += `<div class="ct-side-sec">&#128004; CATTLE &mdash; ${ru.cattle}</div>`;
  for (const name of (ru.cattleMembers || [])) {
    const slug = players.find(p => p.name === name)?.slug || name.toLowerCase().replace(/\s+/g, '-');
    const caught = capturedSet.has(name);
    const dodges = dodgeCounts[name] || 0;
    sidebar += `<div style="display:flex;align-items:center;gap:6px;padding:3px 0;font-size:11px;color:rgba(255,255,255,${caught ? '0.35' : '0.8'})">
      <img src="assets/avatars/${slug}.png" width="32" height="32" style="border-radius:2px;border:1px solid var(--ct-leather);filter:${caught ? 'grayscale(0.8) sepia(0.2)' : 'sepia(0.2)'}" onerror="this.style.display='none'">
      <span style="flex:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${name}</span>
      ${caught ? `<span style="font-size:9px;color:var(--ct-neon-red)">ROPED</span>` : `<span style="font-size:9px;color:var(--ct-neon-green)">${dodges} dodges</span>`}
    </div>`;
  }

  // Feed — round reveals
  let feed = '';
  const rounds = ru.rounds || [];
  for (let ri = 0; ri < rounds.length; ri++) {
    if (ri > revIdx) break;
    const r = rounds[ri];

    feed += `<div class="ct-ev round-header">
      <div style="flex:1;text-align:center">
        <div style="font-family:'Rye',serif;font-size:16px;color:var(--ct-gold);letter-spacing:4px">ROUND ${r.num}</div>
        <div style="font-size:9px;color:var(--ct-sepia);letter-spacing:2px">COWBOYS vs CATTLE</div>
      </div>
    </div>`;

    // Lasso attempts
    for (const l of (r.lassos || [])) {
      const cSlug = players.find(p => p.name === l.cowboy)?.slug || l.cowboy.toLowerCase().replace(/\s+/g, '-');
      const tSlug = players.find(p => p.name === l.target)?.slug || l.target.toLowerCase().replace(/\s+/g, '-');
      feed += `<div class="ct-ev ${l.captured ? 'positive' : ''}">
        <div class="ct-ev-port"><img src="assets/avatars/${cSlug}.png" onerror="this.style.display='none'"></div>
        <div style="flex:1;min-width:0;position:relative">
          <svg width="100%" height="20" style="display:block;margin:4px 0"><line x1="0" y1="10" x2="100%" y2="10" stroke="${l.captured ? 'var(--ct-gold)' : 'var(--ct-iron)'}" stroke-width="2" stroke-dasharray="${l.captured ? '0' : '8,4'}" ${l.captured ? 'style="animation:ct-lasso 0.6s ease-out forwards;stroke-dasharray:300;stroke-dashoffset:300"' : ''}/></svg>
          <div class="ct-ev-badge ${l.captured ? 'gold' : 'gray'}">${l.captured ? 'CAPTURED!' : 'DODGED'}</div>
          <div class="ct-ev-text"><strong>${l.cowboy}</strong> throws at <strong>${l.target}</strong> &mdash; ${l.captured ? `<span style="color:var(--ct-neon-gold);animation:ct-brand-sizzle 0.8s ease-out">ROPED!</span>` : `<span style="color:rgba(255,255,255,0.4)">Slipped away.</span>`}</div>
        </div>
        <div class="ct-ev-port" style="${!l.captured ? 'animation:ct-fade-up 0.3s ease-out' : ''}"><img src="assets/avatars/${tSlug}.png" onerror="this.style.display='none'" style="${l.captured ? 'filter:grayscale(0.6) sepia(0.3)' : ''}"></div>
      </div>`;
    }

    // Events
    for (const evt of (r.events || [])) {
      feed += `<div class="ct-ev">
        <div style="flex:1;min-width:0">
          <div class="ct-ev-badge orange">${(evt.id || evt.type || 'EVENT').toUpperCase()}</div>
          <div class="ct-ev-text">${evt.text || ''}</div>
        </div>
      </div>`;
    }
  }

  // Tables turned
  if (ru.tablesTurned && revIdx >= rounds.length - 1) {
    feed += `<div class="ct-ev positive" style="border-left-color:var(--ct-neon-green)">
      <div style="flex:1;text-align:center;padding:8px 0">
        ${_ctNeonBadge('TABLES TURNED', 'sheriff')}
        <div class="ct-ev-text" style="margin-top:8px">The cattle broke free and turned the tide! Roles reversed in the final push.</div>
      </div>
    </div>`;
  }

  // HUD
  const capturedCount = capturedSet.size;
  const freeCount = (ru.cattleMembers || []).length - capturedCount;
  const hudCells = `<div class="ct-hud-cell"><div class="ct-hud-val">${_ctChalkNum(capturedCount)}</div><div class="ct-hud-lbl">CAPTURED</div></div>
    <div class="ct-hud-cell"><div class="ct-hud-val">${_ctChalkNum(freeCount)}</div><div class="ct-hud-lbl">FREE</div></div>
    <div class="ct-hud-cell"><div class="ct-hud-val">${_ctChalkNum(Math.min(revIdx + 1, rounds.length))}/${_ctChalkNum(rounds.length)}</div><div class="ct-hud-lbl">ROUND</div></div>`;

  const pending = revIdx < rounds.length - 1;
  const controls = `<div class="ct-controls">
    ${pending ? `<button class="ct-btn-next" onclick="crazytownRevealNext('ct-roundup')">NEXT ROUND</button>` : ''}
    ${pending ? `<button class="ct-btn-all" onclick="crazytownRevealAll('ct-roundup')">Reveal All</button>` : ''}
    ${!pending && rounds.length ? `<div>${_ctNeonBadge(ru.winner ? ru.winner + ' WINS THE ROUNDUP' : 'ROUNDUP COMPLETE', 'gold')}</div>` : ''}
  </div>`;

  return _ctShell(`
    <div class="ct-hud">${hudCells}</div>
    <div class="ct-layout">
      <div class="ct-feed">${feed}${controls}</div>
      <div class="ct-sidebar">${sidebar}</div>
    </div>
  `, ep);
}

// ═══════════════════════════════════════════════════════════════════════════
// VP — Drama Break (intermission)
// ═══════════════════════════════════════════════════════════════════════════

export function rpBuildCrazytownDramaBreak(ep, breakNum) {
  const ct = ep.crazytown;
  if (!ct) return '';
  const events = breakNum === 1 ? ct.breakEvents1 : ct.breakEvents2;
  if (!events?.length) return '';

  let feed = '';
  for (const evt of events) {
    const firstPlayer = (evt.players || [])[0];
    const slug = firstPlayer ? (players.find(p => p.name === firstPlayer)?.slug || firstPlayer.toLowerCase().replace(/\s+/g, '-')) : null;
    feed += `<div class="ct-ev ${evt.badgeClass || ''}">
      ${slug ? `<div class="ct-ev-port"><img src="assets/avatars/${slug}.png" onerror="this.style.display='none'"></div>` : ''}
      <div style="flex:1;min-width:0">
        <div class="ct-ev-badge ${evt.badgeClass || 'gray'}">${evt.badge || evt.badgeText || 'INTERMISSION'}</div>
        <div class="ct-ev-text">${evt.text || ''}</div>
        ${(evt.players || []).length > 1 ? `<div style="display:flex;gap:4px;margin-top:6px;flex-wrap:wrap">${evt.players.slice(1).map(n => {
          const s = players.find(p => p.name === n)?.slug || n.toLowerCase().replace(/\s+/g, '-');
          return `<img src="assets/avatars/${s}.png" width="24" height="24" style="border-radius:2px;border:1px solid var(--ct-leather);filter:sepia(0.2)" title="${n}" onerror="this.style.display='none'">`;
        }).join('')}</div>` : ''}
      </div>
    </div>`;
  }

  return _ctShell(`
    <div style="padding:12px 14px;position:relative;z-index:6">
      <div style="text-align:center;font-family:'Rye',serif;font-size:14px;color:var(--ct-sepia);letter-spacing:4px;margin-bottom:12px">${breakNum === 1 ? 'INTERMISSION' : 'RISING TENSION'}</div>
      ${feed}
    </div>
    <div class="ct-tumbleweed" style="top:30%">&#127806;</div>
    <div class="ct-dust-mote" style="left:20%;top:40%;--dx:3px;--dy:-18px"></div>
    <div class="ct-dust-mote" style="left:70%;top:60%;--dx:-2px;--dy:-14px;animation-delay:-2s"></div>
  `, ep);
}

// ═══════════════════════════════════════════════════════════════════════════
// VP — Results (Final Verdict)
// ═══════════════════════════════════════════════════════════════════════════

export function rpBuildCrazytownResults(ep) {
  const ct = ep.crazytown;
  if (!ct) return '';

  const tribeScores = ct.tribeScores || {};
  const sorted = Object.entries(tribeScores).sort((a, b) => b[1] - a[1]);
  const winnerTribe = sorted[0]?.[0] || '???';

  // Phase scoreboard
  const phaseData = [
    { label: 'HORSE DIVE', data: ct.horseDive },
    { label: 'STANDOFF', data: ct.standoff },
    { label: 'ROUNDUP', data: ct.roundup },
  ];
  const tribeNames = Object.keys(tribeScores);

  let chalkRows = phaseData.map(ph => {
    const cells = tribeNames.map(t => {
      let score = '—';
      if (ph.data?.winner === t) score = 'W';
      else if (ph.data?.winner) score = 'L';
      // Try to get actual tribe score from phase
      if (ph.data?.tribeResults) {
        const tr = ph.data.tribeResults.find(r => r.tribe === t);
        if (tr) score = tr.tribeScore ?? score;
      }
      return `<td style="padding:6px 12px;text-align:center">${_ctChalkNum(score)}</td>`;
    }).join('');
    return `<tr><td style="padding:6px 12px;text-align:left;font-family:'Rye',serif;font-size:10px;letter-spacing:2px;color:var(--ct-sepia)">${ph.label}</td>${cells}</tr>`;
  }).join('');

  const headerCells = tribeNames.map(t =>
    `<th style="padding:6px 12px;text-align:center;font-family:'Rye',serif;font-size:9px;letter-spacing:2px;color:var(--ct-gold)">${t}</th>`
  ).join('');

  // Total row
  const totalCells = tribeNames.map(t =>
    `<td style="padding:8px 12px;text-align:center;border-top:2px solid rgba(218,165,32,0.3)">${_ctChalkNum(tribeScores[t])}</td>`
  ).join('');

  let chalkBoard = `<div class="ct-chalk-board" style="margin:12px 14px">
    <table style="width:100%;border-collapse:collapse;color:var(--ct-chalk)">
      <thead><tr><th></th>${headerCells}</tr></thead>
      <tbody>${chalkRows}
        <tr><td style="padding:8px 12px;font-family:'Rye',serif;font-size:10px;letter-spacing:2px;color:var(--ct-gold);border-top:2px solid rgba(218,165,32,0.3)">TOTAL</td>${totalCells}</tr>
      </tbody>
    </table>
  </div>`;

  // Tiebreaker
  let tiebreakerHtml = '';
  if (ct.tiebreaker) {
    const tb = ct.tiebreaker;
    tiebreakerHtml = `<div class="ct-ev positive" style="margin:0 14px 8px">
      <div style="flex:1;text-align:center">
        ${_ctNeonBadge('TIEBREAKER DUEL', 'outlaw')}
        <div class="ct-ev-text" style="margin-top:6px"><strong>${tb.duelists.join('</strong> vs <strong>')}</strong> &mdash; Quick-draw showdown!</div>
        <div style="margin-top:6px">${_ctNeonBadge(tb.winner + ' WINS', 'gold')}</div>
      </div>
    </div>`;
  }

  // Standouts
  let standouts = '<div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;padding:8px 14px">';
  if (ct.standoff?.gunslingers?.length) {
    standouts += ct.standoff.gunslingers.map(n =>
      `<div style="text-align:center">${_ctPortrait(n, 48)}<div style="margin-top:4px">${_ctNeonBadge('GUNSLINGER', 'gunslinger')}</div></div>`
    ).join('');
  }
  if (ct.roundup?.sheriff) {
    standouts += `<div style="text-align:center">${_ctPortrait(ct.roundup.sheriff, 48)}<div style="margin-top:4px">${_ctNeonBadge('SHERIFF', 'sheriff')}</div></div>`;
  }
  standouts += '</div>';

  // Winner banner
  const winnerBanner = `<div style="text-align:center;padding:20px 0;position:relative;z-index:6">
    <div style="font-family:'Rye',serif;font-size:32px;color:var(--ct-neon-gold);letter-spacing:4px;text-shadow:0 0 20px var(--ct-neon-gold),0 0 40px rgba(255,215,0,0.4),3px 3px 0 var(--ct-blood);animation:ct-neon-glow 2s ease-in-out infinite">${winnerTribe}</div>
    <div style="font-family:'Rye',serif;font-size:12px;letter-spacing:6px;color:var(--ct-sepia);margin-top:4px">WINS THE SHOWDOWN</div>
  </div>`;

  // Player leaderboard
  const scores = Object.entries(ep.chalMemberScores || {}).sort((a, b) => b[1] - a[1]);
  let leaderboard = '<div style="padding:0 14px 16px">';
  leaderboard += '<div class="ct-side-sec" style="text-align:center">BOUNTY BOARD</div>';
  leaderboard += '<div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center">';
  for (const [name, score] of scores) {
    leaderboard += `<div class="ct-portrait" style="width:64px" data-bounty="${score}">
      <img src="assets/avatars/${(players.find(p => p.name === name)?.slug || name.toLowerCase().replace(/\s+/g, '-'))}.png" width="56" height="56" style="display:block;border-radius:2px;border:2px solid var(--ct-leather)">
      <div class="ct-portrait-name">${name}</div>
    </div>`;
  }
  leaderboard += '</div></div>';

  return _ctShell(`
    ${winnerBanner}
    ${chalkBoard}
    ${tiebreakerHtml}
    ${standouts}
    ${leaderboard}
    <div class="ct-tumbleweed" style="top:15%">&#127806;</div>
    <div class="ct-tumbleweed" style="top:55%;animation-delay:-6s;animation-duration:16s">&#127806;</div>
    <div class="ct-dust-mote" style="left:25%;top:35%;--dx:3px;--dy:-20px"></div>
    <div class="ct-dust-mote" style="left:65%;top:50%;--dx:-2px;--dy:-15px;animation-delay:-3s"></div>
  `, ep);
}

// ═══════════════════════════════════════════════════════════════════════════
// VP — Reveal functions
// ═══════════════════════════════════════════════════════════════════════════

export function crazytownRevealNext(screenKey) {
  if (!window._tvState) window._tvState = {};
  if (!window._tvState[screenKey]) window._tvState[screenKey] = { idx: -1 };
  window._tvState[screenKey].idx++;
  const ep = gs.episodeHistory?.[gs.episodeHistory.length - 1];
  if (!ep) return;
  if (window.buildVPScreens) {
    const screens = window.buildVPScreens(ep);
    const idx = screens.findIndex(s => s.id === screenKey);
    if (idx >= 0) window.vpCurrentScreen = idx;
  }
  if (window.renderVPScreen) window.renderVPScreen();
}

export function crazytownRevealAll(screenKey) {
  if (!window._tvState) window._tvState = {};
  if (!window._tvState[screenKey]) window._tvState[screenKey] = { idx: -1 };
  window._tvState[screenKey].idx = 9999;
  const ep = gs.episodeHistory?.[gs.episodeHistory.length - 1];
  if (!ep) return;
  if (window.buildVPScreens) {
    const screens = window.buildVPScreens(ep);
    const idx = screens.findIndex(s => s.id === screenKey);
    if (idx >= 0) window.vpCurrentScreen = idx;
  }
  if (window.renderVPScreen) window.renderVPScreen();
}
