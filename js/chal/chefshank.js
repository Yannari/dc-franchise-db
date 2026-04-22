// js/chal/chefshank.js — The Chefshank Redemption prison challenge
import { gs, players, seasonConfig } from '../core.js';
import { pStats, pronouns, updateChalRecord, romanticCompat } from '../players.js';
import { addBond, getBond } from '../bonds.js';

// ── Text pools ──────────────────────────────────────────────────────────────

const PRISON_FOOD_HOST = {
  intro: [
    h => `${h} grins. "Welcome to Phase 1: Prison Food. One unfortunate soul from each tribe gets to eat whatever their rivals cook up. And trust me — you don't want to know what's in it."`,
    h => `"Alright convicts," ${h} announces, "Phase 1 is Prison Food. Your tribe cooks the slop. The other tribe's chosen victim has to eat it. Last one standing wins the Golden Shovel."`,
    h => `${h} lifts a rusted pot lid and recoils. "Phase 1. Your tribe decides what goes in the pot. The enemy eats it. Simple. Disgusting. Perfect."`,
  ],
  victimPicked: [
    (h, name, tribe) => `${h} points: "${name} — you're eating for ${tribe} tonight."`,
    (h, name, tribe) => `The ${tribe} tribe nominates ${name}. ${h} slow-claps. "Bold choice."`,
    (h, name, tribe) => `"${name} from ${tribe}," ${h} calls out. "Hope you skipped breakfast."`,
  ],
  cookingStart: [
    h => `${h} fires a starting pistol. "Cooks — you've got ten minutes. Make it count."`,
    h => `"Start cooking!" ${h} shouts. The tribes scramble for the mystery ingredients.`,
    h => `${h} gestures at the grimy kitchen counter. "You have ten minutes. Sanitation is optional."`,
  ],
  roundStart: [
    (h, r) => `${h} slides a steaming bowl forward. "Round ${r}. Bon appétit."`,
    (h, r) => `"Round ${r}!" ${h} announces, slapping a ladle on the table. "Dig in."`,
    (h, r) => `${h} raises an eyebrow. "Round ${r}. Things are getting… fragrant."`,
  ],
  vomit: [
    (h, name) => `${name} lurches forward — and that's it. ${h} blows the whistle. "We have a casualty."`,
    (h, name) => `${h} winces as ${name} loses the battle. "And down goes the contestant."`,
    (h, name) => `"Ohhh," ${h} groans theatrically as ${name} taps out. "That's gonna leave a mark."`,
  ],
  survive: [
    (h, name) => `${name} slams the empty bowl down and glares at ${h}. ${h} looks almost impressed.`,
    (h, name) => `${name} finishes every last bite. ${h} blinks. "Okay. I respect that."`,
    (h, name) => `${h} shakes his head slowly as ${name} survives the final round. "Unbelievable."`,
  ],
};

const PRISON_FOOD_COOKING = {
  sabotageIngredient: [
    (actor, pr) => `${actor} smirks and palms something unidentifiable into the pot when no one's looking.`,
    (actor, pr) => `${actor} digs through the mystery bin and pulls out something that makes ${pr.sub} gag — then dumps it straight in.`,
    (actor, pr) => `While the tribe debates seasoning, ${actor} quietly adds a handful of something green and moving.`,
  ],
  accidentalImprovement: [
    (actor, pr) => `${actor} adds what ${pr.sub} thinks is hot sauce — but the pot smells almost… good now. ${pr.Sub} looks confused.`,
    (actor, pr) => `${actor} sneezes into the spice rack and accidentally improves the dish. ${pr.PosAdj} tribe is suspicious.`,
    (actor, pr) => `${actor} tosses in an extra ingredient on instinct. The resulting aroma is somehow not awful.`,
  ],
  foreignObject: [
    (actor, pr) => `${actor}'s shoe lace snaps and half of it disappears into the pot. ${pr.Sub} pretends not to notice.`,
    (actor, pr) => `A button pops off ${actor}'s shirt mid-stir and sinks without a trace.`,
    (actor, pr) => `${actor} drops ${pr.posAdj} wristband into the slop. It doesn't come back out.`,
  ],
  tastTestBetrayal: [
    (actor, target, aPr, tPr) => `${actor} sidles up near ${target} and whispers a warning about what's in the pot. ${tPr.Sub} looks shaken.`,
    (actor, target, aPr, tPr) => `When no one's watching, ${actor} mouths something to ${target} across the challenge area. ${tPr.Sub} nods slightly.`,
    (actor, target, aPr, tPr) => `${actor} makes brief eye contact with ${target} and gives the faintest grimace — a warning. ${tPr.Sub} swallows hard.`,
  ],
};

const PRISON_FOOD_EATING = {
  gagReflex:            (v, pr) => `${v} gags visibly between bites but forces ${pr.posAdj} expression neutral.`,
  taunt:                (v, opp, vPr, oPr) => `${opp} leans over and taunts: "Gonna quit?" ${v} shoots ${oPr.obj} a death glare.`,
  encouragement:        (v, opp, vPr, oPr) => `Teammates shout encouragement from the sidelines. ${v} grits ${vPr.posAdj} teeth and pushes on.`,
  foreignObjectDiscovery:(v, pr) => `${v} pauses — something solid in the bowl that shouldn't be there. ${pr.Sub} keeps eating anyway.`,
  secondWind:           (v, pr) => `${v} exhales sharply, squares ${pr.posAdj} shoulders, and finds a second wind.`,
  smellHits:            (v, pr) => `The smell from the bowl hits ${v} like a wall. ${pr.Sub} sways but stays seated.`,
  sympathyGag:          (v, opp, vPr, oPr) => `${opp} makes a noise and ${v} nearly loses it in sympathy. ${vPr.Sub} clamps ${vPr.posAdj} hand over ${vPr.posAdj} mouth.`,
  chefCritique:         (v, pr) => `Chris leans in to commentate on the texture. The description makes ${v}'s face contort.`,
  crowdPressure:        (v, pr) => `The spectators start chanting. ${v} closes ${pr.posAdj} eyes, jaw tight.`,
  pokerFace:            (v, opp, vPr, oPr) => `${v} stares ${oPr.obj} dead in the eye and eats without blinking. ${opp} shifts uncomfortably.`,
  textureSurprise:      (v, pr) => `Something in the bowl moves slightly. ${v} freezes for a half-second before swallowing.`,
  spiteBite:            (v, pr) => `${v} thinks of who cooked this, sets ${pr.posAdj} jaw, and takes the biggest bite yet.`,
  nostrilFlare:         (v, pr) => `${v}'s nostrils flare at the next spoonful. ${pr.Sub} breathes through ${pr.posAdj} mouth the rest of the round.`,
  powerStare:           (v, opp, vPr, oPr) => `${v} locks eyes with ${opp} and lifts the bowl without looking away.`,
  stomachGrowl:         (v, pr) => `An audible gurgle from ${v}'s stomach. ${pr.Sub} pretends it didn't happen.`,
  flashback:            (v, pr) => `${v} goes somewhere else mentally — somewhere better — and the round passes in a blur.`,
};

// ── Phase 2 text pools ───────────────────────────────────────────────────────

const PRISON_BREAK_HOST = {
  intro: [
    h => `${h} grins and pulls a rusted lever. A siren wails. "Phase 2: Prison Break. You dug your way in — now dig your way out. First tribe to breach the wall wins immunity."`,
    h => `"Alright convicts," ${h} announces, arms wide, "Phase 2. Four obstacles stand between you and freedom. Your pusher goes first. Then everyone grabs a shovel." The siren blares.`,
    h => `${h} blows a whistle that echoes off the concrete. "Prison Break. Four obstacles, one tunnel, and whoever digs fastest walks free. The rest answer to me tonight."`,
  ],
  obstaclePass: [
    (h, name) => `${h} pumps a fist. "${name} clears it — moving on!"`,
    (h, name) => `"${name} pushes through!" ${h} calls. "Still in this thing!"`,
    (h, name) => `${name} emerges on the other side. ${h} taps the clipboard. "Clear."`,
  ],
  obstacleFail: [
    (h, name) => `${h} winces. "${name} eats it hard. That's going to cost them a dig round."`,
    (h, name) => `"Ohhh," ${h} groans as ${name} goes down. "Down a round. That hurt."`,
    (h, name) => `${name} doesn't make it through clean. ${h} scribbles something. "One less round for that tribe."`,
  ],
  digStart: [
    h => `${h} fires the starting pistol. "TUNNELS OPEN — DIG!"`,
    h => `"Start digging!" ${h} shouts. "First tribe to break the surface wins!"`,
    h => `${h} drops the flag. Both tribes hit their tunnels simultaneously, dirt flying.`,
  ],
  digEnd: [
    (h, tribe) => `${h} grabs the airhorn. "${tribe} breaks through first — IMMUNITY!"`,
    (h, tribe) => `"${tribe} is out!" ${h} shouts as the first fist punches through the wall. "That's immunity!"`,
    (h, tribe) => `The wall gives. Daylight floods in. ${h} points: "${tribe} — you're FREE. Everyone else, tribal tonight."`,
  ],
  winner: [
    (h, tribe) => `${h} raises the immunity token. "${tribe} served their time and earned it. You're safe."`,
    (h, tribe) => `"${tribe} breaks free!" ${h} announces to the arena. "Immunity is yours."`,
    (h, tribe) => `${h} hands over immunity. "${tribe}. You dug yourselves out. Well played."`,
  ],
};

const PRISON_BREAK_OBSTACLES = {
  mudPit: {
    pass: [
      (pusher, pr) => `${pusher} charges the mud pit at full sprint and slogs through without breaking stride. ${pr.Sub} emerges filthy and grinning.`,
      (pusher, pr) => `${pusher} doesn't blink — ${pr.sub} hits the mud, pulls ${pr.posAdj} knees high, and punches out the other side.`,
      (pusher, pr) => `The mud sucks at ${pusher}'s feet, but ${pr.sub} powers through on pure stubbornness.`,
    ],
    fail: [
      (pusher, pr) => `${pusher} hits the mud at full tilt and goes face-first into it. ${pr.Sub} comes up spitting.`,
      (pusher, pr) => `The mud pit swallows ${pusher} to the knees. ${pr.Sub} struggles, loses time, loses ground.`,
      (pusher, pr) => `${pusher} sinks into the mud pit up to ${pr.posAdj} shins and can't get momentum back.`,
    ],
  },
  barbedWire: {
    pass: [
      (pusher, pr) => `${pusher} goes low and rolls under the barbed wire with eerie precision — not a scratch.`,
      (pusher, pr) => `${pusher} studies the wire for half a second, then moves through it like ${pr.sub} planned every inch.`,
      (pusher, pr) => `${pusher} keeps ${pr.posAdj} elbows tucked and slides under the barbed wire clean.`,
    ],
    fail: [
      (pusher, pr) => `${pusher} clips the wire on the way through and gets tangled. ${pr.Sub} tears free, but the time is gone.`,
      (pusher, pr) => `The barbed wire catches ${pusher}'s sleeve. ${pr.Sub} yanks loose with a grunt, shaken.`,
      (pusher, pr) => `${pusher} rushes the wire and snags ${pr.posAdj} shirt. The hesitation costs them.`,
    ],
  },
  guardTower: {
    pass: [
      (pusher, pr) => `${pusher} uses the blind spots in the guard tower route perfectly — ${pr.sub} slips through without a hit.`,
      (pusher, pr) => `${pusher} reads the pattern in the guards' sweep and times ${pr.posAdj} run exactly right.`,
      (pusher, pr) => `${pusher} ducks, pivots, and clears the guard tower zone without taking a shot.`,
    ],
    fail: [
      (pusher, pr) => `${pusher} misjudges the guard tower timing and takes a foam cannon blast square in the chest.`,
      (pusher, pr) => `${pusher} goes too fast and steps into the searchlight beam. Sirens blare. ${pr.Sub} has to reset.`,
      (pusher, pr) => `The guard tower sweep catches ${pusher} mid-run. ${pr.Sub} takes the penalty and falls back.`,
    ],
  },
  wallClimb: {
    pass: [
      (pusher, pr) => `${pusher} takes three big steps up the wall and hauls ${pr.obj} over the top like it was nothing.`,
      (pusher, pr) => `${pusher} gets a running start and claws ${pr.posAdj} way to the top — barely, but ${pr.sub} makes it.`,
      (pusher, pr) => `The wall goes down under ${pusher}'s boots. ${pr.Sub} vaults over and lands in a crouch.`,
    ],
    fail: [
      (pusher, pr) => `${pusher} slips halfway up the wall and drops back to the ground. ${pr.Sub} loses a dig round trying again.`,
      (pusher, pr) => `${pusher}'s fingers find nothing on the wall's slick surface. ${pr.Sub} can't get the grip to finish the climb.`,
      (pusher, pr) => `${pusher} makes it two-thirds of the way up, then slides. ${pr.Sub} burns a minute getting back to the top.`,
    ],
  },
};

const PRISON_BREAK_DIG_EVENTS = {
  hitRock: [
    (player, pr) => `${player}'s shovel rings off solid rock. ${pr.Sub} stares at it for a full second before trying to go around.`,
    (player, pr) => `${player} hits rock and ${pr.posAdj} dig contribution drops to nothing this round.`,
    (player, pr) => `A buried rock stops ${player} cold mid-round. ${pr.Sub} chips at it uselessly before giving up.`,
  ],
  findContraband: [
    (player, pr) => `${player} unearths something stashed in the tunnel wall — not a rock. ${pr.Sub} pockets it and digs faster.`,
    (player, pr) => `${player}'s shovel hits something that clunks wrong. ${pr.Sub} pulls out a rusted tin — old contraband. The whole tunnel buzzes with it next round.`,
    (player, pr) => `${player} reaches into a cavity and pulls out something that shouldn't be buried here. ${pr.Sub} holds it up. "This stays between us."`,
  ],
  caveInScare: [
    (player, pr) => `The ceiling groans above ${player}. A handful of dirt drops. ${pr.Sub} freezes, heart hammering.`,
    (player, pr) => `A crack runs down the tunnel wall near ${player}. ${pr.Sub} backs up, hesitates, almost doesn't go back in.`,
    (player, pr) => `${player} hears the sound before ${pr.sub} sees it — dirt shifting, support cracking. ${pr.Sub} scrambles backward in a panic.`,
  ],
  shortcut: [
    (player, pr) => `${player} reads the soil density and redirects the dig at an angle. The shortcut pays off.`,
    (player, pr) => `${player} spots a weak patch in the tunnel floor and calls the redirect. The tribe covers 20% more ground this round.`,
    (player, pr) => `${player} figures out a faster line through the rock layer and reroutes the dig. Efficiency goes up immediately.`,
  ],
  claustrophobia: [
    (player, pr) => `The walls close in on ${player}. ${pr.Sub} stops digging, presses ${pr.posAdj} back to the wall, and can't breathe.`,
    (player, pr) => `${player} makes it three feet in before the tunnel feels like a coffin. ${pr.Sub} stares at the ceiling and contributes nothing.`,
    (player, pr) => `${player} goes pale in the tunnel. ${pr.Sub} keeps ${pr.posAdj} eyes fixed ahead and moves ${pr.posAdj} shovel in silence, barely.`,
  ],
  wormNest: [
    (player, pr) => `${player}'s shovel hits a worm nest the size of a grapefruit. ${pr.Sub} gags and stops digging immediately.`,
    (player, pr) => `${player} pulls back a full shovel of wriggling things. ${pr.Sub} drops the shovel. ${pr.Sub} does not pick it back up right away.`,
    (player, pr) => `Something wet and wriggling lands on ${player}'s wrist. ${pr.Sub} screams — just a little — and loses the round.`,
  ],
  rivalSabotage: [
    (player, pr) => `${player} gets low and kicks a pile of loose dirt into the rival tunnel entrance. Subtle. Effective.`,
    (player, pr) => `${player} sends a shower of dirt into the enemy tunnel with a carefully misdirected shovel swing.`,
    (player, pr) => `${player} moves to the partition wall and digs sideways just enough to dump debris into the other tribe's path.`,
  ],
  motivationalSpeech: [
    (player, pr) => `${player} drops ${pr.posAdj} shovel for thirty seconds and goes person to person in the tunnel. Whatever ${pr.sub} says, the pace picks up.`,
    (player, pr) => `${player} shouts something over the scrape of shovels and the whole tribe digs faster this round.`,
    (player, pr) => `"We've got this!" ${player} calls from the back of the tunnel, and somehow everyone believes ${pr.obj}.`,
  ],
  tunnelFlood: [
    (player, pr) => `Water starts seeping in from the tunnel walls. ${player} tries to bail it out. The whole tribe slows down.`,
    (player, pr) => `The tunnel floods from below — an inch of standing water covers everyone's feet and kills the round's momentum.`,
    (player, pr) => `${player} spots the water before it gets bad, but not soon enough. The tribe loses ground in the flood.`,
  ],
  brokenShovel: [
    (player, pr) => `${player}'s shovel handle snaps clean in half. ${pr.Sub} stares at it. The golden shovel advantage is gone for this round.`,
    (player, pr) => `${player} hits a buried stone at the wrong angle and the shovel cracks at the head. The golden shovel's multiplier is offline.`,
    (player, pr) => `Snap. ${player} holds up both halves of the broken golden shovel. ${pr.Sub} looks at ${pr.posAdj} tribe. "We improvise."`,
  ],
  undergroundEcho: [
    (player, pr) => `${player} can hear the other tribe through the partition. They sound close. ${pr.Sub} digs harder.`,
    (player, pr) => `An echo from the rival tunnel — ${player} tracks the sound and gauges the gap. "We're ahead," ${pr.sub} calls back.`,
    (player, pr) => `${player} listens for the rival shovels and announces the distance estimate. The tunnel reacts accordingly.`,
  ],
  digFrenzy: [
    (player, pr) => `${player} finds a zone and doesn't stop — ${pr.sub} doubles ${pr.posAdj} output this round with pure physical rage.`,
    (player, pr) => `${player} plants ${pr.posAdj} feet and goes berserk on the dirt wall, throwing twice as much earth as anyone else.`,
    (player, pr) => `Something clicks for ${player} — ${pr.posAdj} technique, ${pr.posAdj} rhythm, ${pr.posAdj} output. ${pr.Sub} doubles it.`,
  ],
  looseSoil: [
    (player, pr) => `${player} breaks into a sandy pocket — the soil gives way like it was never there.`,
    (player, pr) => `${player} calls out: "Loose soil!" The whole tribe surges forward through the easiest section of the dig.`,
    (player, pr) => `${player} hits a sweet spot in the tunnel — soft earth, no resistance. The tribe clears 25% more ground.`,
  ],
  oxygenThin: [
    (player, pr) => `${player} slows down, breathing heavy. The air in the deep tunnel is getting thin.`,
    (player, pr) => `The whole tribe starts breathing harder as the dig goes deeper. ${player} steadies ${pr.posAdj} arm on the wall.`,
    (player, pr) => `${player} calls for a second to breathe. The tunnel's deep now and the air isn't refreshing anymore.`,
  ],
  findOldTunnel: [
    (player, pr) => `${player}'s shovel breaks through into a pre-existing void — an old tunnel, dug by someone who didn't make it. The tribe uses every inch.`,
    (player, pr) => `${player} hits hollow ground and punches through to a cavity. The tribe gains 30% distance for free.`,
    (player, pr) => `${player} spots the tell-tale soil pattern just before ${pr.posAdj} shovel breaks into a buried passage. "Old tunnel — GO."`,
  ],
  teammateClash: [
    (player1, player2, pr1, pr2) => `${player1} and ${player2} reach for the same section of wall and the argument that follows stalls the whole tunnel.`,
    (player1, player2, pr1, pr2) => `${player1} spins on ${player2} mid-dig. "You're in my line!" The argument echoes. Nobody moves dirt for a full minute.`,
    (player1, player2, pr1, pr2) => `${player1} and ${player2} have been at each other all challenge. It boils over in the tunnel — both lose their footing and their output.`,
  ],
  vanitySlacker: [
    (player, pr) => `${player} takes stock of ${pr.posAdj} nails, examines the state of ${pr.posAdj} shirt, and contributes approximately nothing.`,
    (player, pr) => `${player} moves the shovel but not the dirt. ${pr.Sub} is thinking about ${pr.posAdj} complexion in this light. The tribe is on its own.`,
    (player, pr) => `${player} makes a show of effort but ${pr.posAdj} shovel barely scratches the surface. The tribe gets nothing out of ${pr.obj} this round.`,
  ],
  overachiever: [
    (player, pr) => `${player} digs like ${pr.sub} personally owes the tunnel something. ${pr.Sub} doubles output and brings the tribe up with ${pr.obj}.`,
    (player, pr) => `${player} sets the pace — ${pr.sub}'s ahead of everyone by two lengths and ${pr.posAdj} teammates race to keep up.`,
    (player, pr) => `${player} moves like ${pr.posAdj} life depends on it. ${pr.Sub} doubles ${pr.posAdj} contribution and boosts the team.`,
  ],
  strategicCoasting: [
    (player, pr) => `${player} keeps a careful half-pace — working, but not hard enough to be memorable. ${pr.Sub} watches the others work.`,
    (player, pr) => `${player} conserves for the final push. ${pr.posAdj} contribution is deliberately moderate.`,
    (player, pr) => `${player} digs at exactly the pace ${pr.sub} needs and not a shovel more.`,
  ],
  rallyCarrier: [
    (player, pr) => `${player} hauls dirt AND keeps the tunnel talking — ${pr.posAdj} constant motion and encouragement pull the team along.`,
    (player, pr) => `${player} digs and rallies simultaneously. ${pr.posAdj} output lifts the whole tunnel's rhythm.`,
    (player, pr) => `${player} carries the tribe for this round — not just ${pr.posAdj} own work, but the energy that makes everyone else move faster.`,
  ],
  lazyExcuse: [
    (player, pr) => `${player} leans on the shovel and explains why ${pr.sub} can't dig right now. The tribe's patience is visibly thinning.`,
    (player, pr) => `${player} has reasons — ${pr.sub} always has reasons. The tribe digs around ${pr.obj} as ${pr.sub} contributes nothing.`,
    (player, pr) => `${player} stops digging to explain ${pr.posAdj} strategy. Nobody's listening. The tribe loses ground.`,
  ],
  proveThemWrong: [
    (player, pr) => `${player} has something to prove and the tunnel shows it — ${pr.sub} digs twice as hard as ${pr.posAdj} stats suggest possible.`,
    (player, pr) => `${player} is not going to be the weak link. ${pr.Sub} doubles ${pr.posAdj} output and stares at the dirt wall like it insulted ${pr.posAdj} family.`,
    (player, pr) => `Everyone counted ${player} out. ${pr.Sub} digs like ${pr.posAdj} survival depends on proving them wrong.`,
  ],
};

const PRISON_DRAMA_EVENTS = [
  {
    id: 'guard-bribe',
    badge: 'Bribe Attempt', badgeClass: 'gold',
    check(tribeMembers) {
      const all = tribeMembers.flatMap(t => t.members);
      const schemers = all.filter(n => {
        const arch = players.find(p => p.name === n)?.archetype;
        return ['villain','mastermind','schemer','chaos-agent'].includes(arch);
      });
      if (!schemers.length) return null;
      const actor = schemers[Math.floor(Math.random() * schemers.length)];
      return { actor };
    },
    apply({ actor }) {
      const aPr = pronouns(actor);
      if (!gs.popularity) gs.popularity = {};
      gs.popularity[actor] = (gs.popularity[actor] || 0) + 1;
      const lines = [
        `${actor} slips something to the guard between phases — food, probably. The guard looks away at exactly the right moment. ${aPr.Sub} smiles.`,
        `${actor} has already figured out that the guards respond to incentives. By the break's end, ${aPr.sub} has one of them eating out of ${aPr.posAdj} hand.`,
        `${actor} corners a guard during the break. Not threatening — just… persuasive. Whatever ${aPr.sub} offered, it worked.`,
      ];
      return { actor, text: lines[Math.floor(Math.random() * lines.length)], players: [actor] };
    },
  },
  {
    id: 'cellmate-bond',
    badge: 'Cellmate Bond', badgeClass: 'blue',
    check(tribeMembers) {
      const all = tribeMembers.flatMap(t => t.members);
      for (let i = 0; i < all.length; i++) {
        for (let j = i + 1; j < all.length; j++) {
          if (getBond(all[i], all[j]) >= 2) return { actor: all[i], target: all[j] };
        }
      }
      return null;
    },
    apply({ actor, target }) {
      const aPr = pronouns(actor);
      const tPr = pronouns(target);
      addBond(actor, target, 0.3);
      const lines = [
        `${actor} and ${target} sit together during the break — not strategy, just two people who trust each other more than anyone else out here.`,
        `${actor} passes something to ${target} without comment. ${tPr.Sub} nods. The shorthand between them is visible from twenty feet away.`,
        `${actor} and ${target} are inseparable between phases. The cellmate bond runs deeper than anyone realized.`,
      ];
      return { actor, target, text: lines[Math.floor(Math.random() * lines.length)], players: [actor, target] };
    },
  },
  {
    id: 'contraband-trade',
    badge: 'Contraband', badgeClass: 'orange',
    check(tribeMembers) {
      const all = tribeMembers.flatMap(t => t.members);
      const traders = all.filter(n => {
        const st = pStats(n);
        return st.strategic >= 5 && st.social >= 5;
      });
      if (traders.length < 2) return null;
      return { actor: traders[0], target: traders[1] };
    },
    apply({ actor, target }) {
      const aPr = pronouns(actor);
      const tPr = pronouns(target);
      addBond(actor, target, 0.2);
      if (!gs.popularity) gs.popularity = {};
      gs.popularity[actor] = (gs.popularity[actor] || 0) + 1;
      const lines = [
        `${actor} and ${target} exchange something during the break that neither tribe is supposed to have. Both pretend it didn't happen.`,
        `${actor} produces something from ${aPr.posAdj} pocket and hands it to ${target}. Contraband trade, mid-challenge. The rules are guidelines.`,
        `${actor} catches ${target}'s eye and slips something across. ${tPr.Sub} tucks it away without looking. Neither one speaks.`,
      ];
      return { actor, target, text: lines[Math.floor(Math.random() * lines.length)], players: [actor, target] };
    },
  },
  {
    id: 'shiv-threat',
    badge: 'Shiv Threat', badgeClass: 'red',
    check(tribeMembers) {
      const all = tribeMembers.flatMap(t => t.members.map(m => ({ name: m, tribe: t.name })));
      for (const p of all) {
        const arch = players.find(x => x.name === p.name)?.archetype;
        if (!['villain','mastermind','schemer','hothead'].includes(arch)) continue;
        const target = all.find(q => q.tribe !== p.tribe && getBond(p.name, q.name) <= -2);
        if (target) return { actor: p.name, target: target.name };
      }
      return null;
    },
    apply({ actor, target }) {
      const aPr = pronouns(actor);
      const tPr = pronouns(target);
      addBond(actor, target, -0.5);
      if (!gs.popularity) gs.popularity = {};
      gs.popularity[actor] = (gs.popularity[actor] || 0) - 1;
      if (!gs._chefshankHeat) gs._chefshankHeat = {};
      gs._chefshankHeat[actor] = { target, amount: 1.0, expiresEp: (gs.episode || 1) + 2 };
      const lines = [
        `${actor} corners ${target} during the break and makes something very clear, very quietly. ${tPr.Sub} steps back.`,
        `${actor} doesn't threaten out loud — ${aPr.sub} doesn't have to. The message ${aPr.sub} delivers to ${target} between phases leaves nothing ambiguous.`,
        `${actor} leans toward ${target} with a look that's hard to misread. ${tPr.Sub} holds ${tPr.posAdj} ground, barely.`,
      ];
      return { actor, target, text: lines[Math.floor(Math.random() * lines.length)], players: [actor, target] };
    },
  },
  {
    id: 'yard-gossip',
    badge: 'Yard Gossip', badgeClass: 'purple',
    check(tribeMembers) {
      const all = tribeMembers.flatMap(t => t.members);
      const gossips = all.filter(n => pStats(n).social >= 6);
      if (!gossips.length) return null;
      const actor = gossips[Math.floor(Math.random() * gossips.length)];
      const target = all.find(n => n !== actor);
      if (!target) return null;
      return { actor, target };
    },
    apply({ actor, target }) {
      const aPr = pronouns(actor);
      addBond(actor, target, -0.2);
      const lines = [
        `${actor} works the yard during the break, planting something about ${target} with anyone who'll listen.`,
        `${actor} starts a quiet whisper campaign. ${target}'s name comes up once, twice — by the third time, people are nodding.`,
        `${actor} doesn't need to be loud to be devastating. A word here, a raised eyebrow there — the yard gossip spreads.`,
      ];
      return { actor, target, text: lines[Math.floor(Math.random() * lines.length)], players: [actor, target] };
    },
  },
  {
    id: 'solitary-fear',
    badge: 'Solitary', badgeClass: 'gray',
    check(tribeMembers) {
      const all = tribeMembers.flatMap(t => t.members);
      const loners = all.filter(n => {
        const st = pStats(n);
        return st.mental <= 4 || st.boldness <= 3;
      });
      if (!loners.length) return null;
      return { actor: loners[Math.floor(Math.random() * loners.length)] };
    },
    apply({ actor }) {
      const aPr = pronouns(actor);
      if (!gs.popularity) gs.popularity = {};
      gs.popularity[actor] = (gs.popularity[actor] || 0) - 1;
      const lines = [
        `${actor} sits alone during the break. The noise and chaos of the challenge seem to have gotten under ${aPr.posAdj} skin.`,
        `${actor} presses ${aPr.posAdj} back against the wall and watches everyone else. ${aPr.Sub} looks like ${aPr.sub}'s already somewhere else.`,
        `${actor} finds the quietest corner of the yard and doesn't move. ${aPr.Sub} needs a minute that's just ${aPr.posAdj}.`,
      ];
      return { actor, text: lines[Math.floor(Math.random() * lines.length)], players: [actor] };
    },
  },
  {
    id: 'wardens-pet',
    badge: "Warden's Pet", badgeClass: 'green',
    check(tribeMembers) {
      const all = tribeMembers.flatMap(t => t.members);
      const pets = all.filter(n => {
        const st = pStats(n);
        return st.loyalty >= 7 && st.social >= 6;
      });
      if (!pets.length) return null;
      const actor = pets[Math.floor(Math.random() * pets.length)];
      const accuser = all.find(n => n !== actor && getBond(n, actor) <= 0);
      if (!accuser) return null;
      return { actor, accuser };
    },
    apply({ actor, accuser }) {
      const aPr = pronouns(actor);
      const acPr = pronouns(accuser);
      addBond(accuser, actor, -0.3);
      const lines = [
        `${accuser} makes it known that ${actor} is playing both sides — a warden's pet, too cozy with the guards. ${aPr.Sub} denies it unconvincingly.`,
        `${accuser} accuses ${actor} of ratting during the break. ${actor} protests. The accusation sticks anyway.`,
        `"${actor}'s been telling the guards everything," ${accuser} announces. ${actor} goes pale. The yard goes quiet.`,
      ];
      return { actor, accuser, text: lines[Math.floor(Math.random() * lines.length)], players: [actor, accuser] };
    },
  },
  {
    id: 'tunnel-rumor',
    badge: 'Tunnel Rumor', badgeClass: 'yellow',
    check(tribeMembers) {
      const all = tribeMembers.flatMap(t => t.members);
      const paranoid = all.filter(n => pStats(n).intuition >= 6);
      if (!paranoid.length) return null;
      const actor = paranoid[Math.floor(Math.random() * paranoid.length)];
      return { actor };
    },
    apply({ actor }) {
      const aPr = pronouns(actor);
      const lines = [
        `${actor} comes back from the tunnel entrance with a theory about how far the rival tribe has dug. Half of it is guesswork. All of it stresses ${aPr.posAdj} tribe out.`,
        `${actor} starts a rumor: the other tribe found an old tunnel and is three rounds ahead. It's probably not true. But now everyone's nervous.`,
        `${actor} spreads the word that ${aPr.sub} heard something through the partition wall. The rumor spreads faster than the dig.`,
      ];
      return { actor, text: lines[Math.floor(Math.random() * lines.length)], players: [actor] };
    },
  },
];

// ── Phase 1 implementation ───────────────────────────────────────────────────

function _simulatePrisonFood(ep, tribeMembers, result) {
  const host = seasonConfig.host || 'Chris';
  const _rp = arr => arr[Math.floor(Math.random() * arr.length)];
  const _shuffle = arr => { const a = [...arr]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

  result.prisonFood = { victims: {}, cooking: {}, duel: { rounds: [], winner: null, loser: null, vomitRound: null } };

  const campKey = gs.tribes[0]?.name || 'merge';
  const pushEvent = (text, playerList, badge, cls) => {
    ep.campEvents[campKey].post.push({ text, players: playerList, badgeText: badge, badgeClass: cls, tag: 'challenge' });
  };

  // Host intro
  pushEvent(_rp(PRISON_FOOD_HOST.intro)(host), tribeMembers.flatMap(t => t.members), 'PRISON FOOD', 'purple');

  // ── 1. VICTIM DRAFT ──
  const victims = {};
  for (const tribe of tribeMembers) {
    const enemies = tribeMembers.filter(t => t.name !== tribe.name).flatMap(t => t.members);
    const scored = enemies.map(name => {
      const s = pStats(name);
      return { name, w: (10 - s.endurance) * 0.04 + (10 - s.boldness) * 0.03 + Math.random() * 0.5 };
    });
    scored.sort((a, b) => b.w - a.w);
    const victimName = scored[0].name;
    victims[tribe.name] = victimName;
    result.prisonFood.victims[tribe.name] = victimName;
    const victimTribe = tribeMembers.find(t => t.members.includes(victimName));
    pushEvent(
      _rp(PRISON_FOOD_HOST.victimPicked)(host, victimName, victimTribe?.name || ''),
      [victimName], 'VICTIM PICKED', 'red'
    );
  }

  // ── 2. COOKING PHASE ──
  pushEvent(_rp(PRISON_FOOD_HOST.cookingStart)(host), tribeMembers.flatMap(t => t.members), 'COOKING PHASE', 'orange');

  // Check for mole/thrower
  const thrower = ep.thrower || null;

  for (const tribe of tribeMembers) {
    const s = tribe.members.map(n => pStats(n));
    const avgMental = s.reduce((a, m) => a + m.mental, 0) / s.length;
    const avgStrat = s.reduce((a, m) => a + m.strategic, 0) / s.length;
    let disgustScore = avgMental * 0.04 + avgStrat * 0.03;

    const cookingEvents = [];
    const usedActors = new Set();

    // Identify the victim eaten by this tribe (i.e. the victim from enemy tribe)
    const enemyVictimEntry = Object.entries(victims).find(([tName]) => tName !== tribe.name);
    const enemyVictim = enemyVictimEntry ? enemyVictimEntry[1] : null;

    // Build event candidates
    const candidates = [];

    // sabotageIngredient
    const saboteurs = tribe.members.filter(n => {
      const arch = players.find(p => p.name === n)?.archetype;
      return ['villain', 'mastermind', 'schemer', 'chaos-agent'].includes(arch);
    });
    if (saboteurs.length) candidates.push({ type: 'sabotageIngredient', actors: saboteurs });

    // accidentalImprovement
    const improvers = tribe.members.filter(n => {
      const s2 = pStats(n);
      return s2.loyalty * 0.1 > 0.5 + Math.random() * 0.3;
    });
    if (improvers.length) candidates.push({ type: 'accidentalImprovement', actors: improvers });

    // foreignObject — any random member
    candidates.push({ type: 'foreignObject', actors: [...tribe.members] });

    // tasteTestBetrayal — need cross-tribe bond or high strategic
    if (enemyVictim) {
      const betrayers = tribe.members.filter(n => {
        const s2 = pStats(n);
        return getBond(n, enemyVictim) >= 3 || s2.strategic >= 7;
      });
      if (betrayers.length) candidates.push({ type: 'tastTestBetrayal', actors: betrayers, target: enemyVictim });
    }

    const numEvents = 2 + Math.floor(Math.random() * 2); // 2-3
    _shuffle(candidates);

    for (const cand of candidates) {
      if (cookingEvents.length >= numEvents) break;
      const eligibleActors = cand.actors.filter(n => !usedActors.has(n));
      if (!eligibleActors.length) continue;
      const actor = _rp(eligibleActors);
      usedActors.add(actor);
      const aPr = pronouns(actor);
      const tPr = cand.target ? pronouns(cand.target) : null;

      let text = '';
      let disEffect = 0;
      let involvedPlayers = [actor];

      if (cand.type === 'sabotageIngredient') {
        text = _rp(PRISON_FOOD_COOKING.sabotageIngredient)(actor, aPr);
        disEffect = 0.3;
        if (enemyVictim) { addBond(actor, enemyVictim, -0.2); }
        if (!gs.popularity) gs.popularity = {};
        gs.popularity[actor] = (gs.popularity[actor] || 0) - 1;
        if (ep.chalMemberScores[actor] !== undefined) ep.chalMemberScores[actor] += 3;

      } else if (cand.type === 'accidentalImprovement') {
        text = _rp(PRISON_FOOD_COOKING.accidentalImprovement)(actor, aPr);
        disEffect = -0.2;
        // Detect check: intuition from teammates
        const detectors = tribe.members.filter(n => n !== actor);
        if (detectors.length) {
          const detectorStats = detectors.map(n => pStats(n));
          const avgIntuition = detectorStats.reduce((a, m) => a + m.intuition, 0) / detectorStats.length;
          if (avgIntuition * 0.08 > 0.5 + Math.random() * 0.3) {
            detectors.forEach(n => addBond(n, actor, -0.3));
            if (!gs.popularity) gs.popularity = {};
            gs.popularity[actor] = (gs.popularity[actor] || 0) - 1;
            involvedPlayers = [...involvedPlayers, ...detectors];
          }
        }

      } else if (cand.type === 'foreignObject') {
        text = _rp(PRISON_FOOD_COOKING.foreignObject)(actor, aPr);
        disEffect = 0.15;
        if (!gs.popularity) gs.popularity = {};
        gs.popularity[actor] = (gs.popularity[actor] || 0) + 1;

      } else if (cand.type === 'tastTestBetrayal') {
        const target = cand.target;
        text = _rp(PRISON_FOOD_COOKING.tastTestBetrayal)(actor, target, aPr, tPr);
        addBond(actor, target, 0.3);
        // Detect check
        const detectChance = pStats(actor).strategic * 0.05;
        if (detectChance < Math.random()) {
          // undetected — apply cross-tribe bond silently
        } else {
          // detected — apply heat
          if (!gs._schemeHeat) gs._schemeHeat = {};
          gs._schemeHeat[actor] = (gs._schemeHeat[actor] || 0) + 1;
        }
        involvedPlayers = [actor, target];
        disEffect = 0;
      }

      disgustScore += disEffect;
      cookingEvents.push({ type: cand.type, actor, text, disEffect, involvedPlayers });

      if (text) {
        pushEvent(text, involvedPlayers, cand.type.toUpperCase().replace(/_/g, ' '), 'orange');
      }
    }

    // THROW INTEGRATION: thrower sets their disgust contribution to 0
    if (thrower && tribe.members.includes(thrower)) {
      const ts = pStats(thrower);
      const throwerContrib = (ts.mental * 0.04 + ts.strategic * 0.03);
      disgustScore -= throwerContrib;
    }

    result.prisonFood.cooking[tribe.name] = { disgustScore, events: cookingEvents };
  }

  // ── 3. EATING DUEL ──
  const tribeNames = tribeMembers.map(t => t.name);
  const victimsByTribe = {}; // tribeName: name of the victim who eats (enemy victim of that tribe)
  // victim[tribeName] = who the ENEMY nominated = who eats on behalf of their OWN tribe
  // Actually: tribe A nominated victim from tribe B; so tribe B's victim eats tribe A's food
  // Let's clarify: victims[tribeA] = player from enemy tribe who eats tribe A's food
  // So we need: for tribe T, who is eating T's food? That's victims[T].
  // And their disgust score source is cooking[T].
  const duelVictims = {}; // tribeName -> victim name (eats that tribe's cooking)
  for (const [tName, vName] of Object.entries(victims)) {
    duelVictims[tName] = vName;
  }

  // Compute victim resist margins
  const victimMargins = {}; // victimName -> cumulative margin
  const victimResists = {}; // victimName -> current resist
  for (const tName of tribeNames) {
    const v = duelVictims[tName];
    if (v) {
      const vs = pStats(v);
      victimResists[v] = vs.endurance * 0.06 + vs.boldness * 0.04;
      victimMargins[v] = 0;
    }
  }

  const roundEscalation = [0.7, 0.85, 1.0, 1.15, 1.3];
  const numRounds = 4 + Math.floor(Math.random() * 2); // 4-5
  let duelLoser = null;
  let vomitRound = null;

  const duelRounds = [];

  for (let r = 0; r < numRounds; r++) {
    const roundData = { round: r + 1, events: [], vomited: null };
    const escFactor = roundEscalation[r] || 1.3;

    pushEvent(_rp(PRISON_FOOD_HOST.roundStart)(host, r + 1), Object.values(duelVictims), `ROUND ${r + 1}`, 'purple');

    // Collect this round's victims with their stats
    const activeDuelTribes = tribeNames.filter(tName => !duelLoser || duelVictims[tName] !== duelLoser);

    // Build event pool for this round
    const eventPool = [];
    const allVictims = tribeNames.map(tName => duelVictims[tName]).filter(Boolean);

    // Helper: pick 2-3 events from pool
    const addPoolEvent = (type, victim, opponent, weight) => {
      eventPool.push({ type, victim, opponent, weight });
    };

    for (const tName of tribeNames) {
      const v = duelVictims[tName];
      if (!v) continue;
      const vs = pStats(v);
      const opp = allVictims.find(n => n !== v) || null;
      const oppPr = opp ? pronouns(opp) : null;
      const tribe = tribeMembers.find(t => t.name === tName);
      const teammates = tribe ? tribe.members.filter(n => n !== v) : [];
      const hasForObj = result.prisonFood.cooking[tName]?.events.some(e => e.type === 'foreignObject');
      const margin = (victimResists[v] || 0) - (result.prisonFood.cooking[tName]?.disgustScore || 0) * escFactor;

      addPoolEvent('gagReflex', v, opp, 0.4);
      if (opp) {
        const oppStats = pStats(opp);
        if (oppStats.boldness * 0.08 > 0.3 + Math.random() * 0.3) addPoolEvent('taunt', v, opp, 0.35);
      }
      if (teammates.length) {
        const avgLoyalty = teammates.reduce((a, n) => a + pStats(n).loyalty, 0) / teammates.length;
        if (avgLoyalty * 0.08 > 0.3 + Math.random() * 0.3) addPoolEvent('encouragement', v, opp, 0.35);
      }
      if (hasForObj) addPoolEvent('foreignObjectDiscovery', v, opp, 0.45);
      if (vs.endurance * 0.08 > 0.4 + Math.random() * 0.3) addPoolEvent('secondWind', v, opp, 0.3);
      if (r >= 2) addPoolEvent('smellHits', v, opp, 0.4);
      if (opp && Math.abs(margin) < 0.1) addPoolEvent('sympathyGag', opp, v, 0.35);
      addPoolEvent('chefCritique', v, opp, 0.3);
      if (tribeMembers.flatMap(t => t.members).length >= 4) addPoolEvent('crowdPressure', v, opp, 0.35);
      if (vs.strategic * 0.08 > 0.4 + Math.random() * 0.3) addPoolEvent('pokerFace', v, opp, 0.3);
      if (r >= 2) addPoolEvent('textureSurprise', v, opp, 0.4);
      const hasCookEnemy = tribeMembers.find(t => t.name !== tName)?.members.some(n => getBond(v, n) <= -3);
      if (hasCookEnemy) addPoolEvent('spiteBite', v, opp, 0.35);
      addPoolEvent('nostrilFlare', v, opp, 0.35);
      if (vs.boldness * 0.08 > 0.4 + Math.random() * 0.3) addPoolEvent('powerStare', v, opp, 0.3);
      if (r >= 1) addPoolEvent('stomachGrowl', v, opp, 0.35);
      if (vs.mental * 0.08 > 0.4 + Math.random() * 0.3) addPoolEvent('flashback', v, opp, 0.3);
    }

    // Normalize + pick 2-3
    const totalW = eventPool.reduce((a, e) => a + e.weight, 0);
    const numEvts = 2 + Math.floor(Math.random() * 2);
    const pickedEvents = [];
    const usedTypes = new Set();
    for (let pick = 0; pick < numEvts && eventPool.length > 0; pick++) {
      let rand = Math.random() * totalW;
      for (const evt of eventPool) {
        rand -= evt.weight;
        if (rand <= 0 && !usedTypes.has(evt.type + evt.victim)) {
          pickedEvents.push(evt);
          usedTypes.add(evt.type + evt.victim);
          break;
        }
      }
    }

    // Apply events + resist modifications
    for (const evt of pickedEvents) {
      const { type, victim, opponent } = evt;
      const vPr = pronouns(victim);
      const oPr = opponent ? pronouns(opponent) : null;
      const tName = tribeNames.find(t => duelVictims[t] === victim);
      let resist = victimResists[victim] || 0;
      let text = '';
      let resistDelta = 0;

      if (type === 'gagReflex')              { text = PRISON_FOOD_EATING.gagReflex(victim, vPr); }
      else if (type === 'taunt')             { resistDelta = -0.05; text = PRISON_FOOD_EATING.taunt(victim, opponent, vPr, oPr); }
      else if (type === 'encouragement')     { resistDelta = +0.05; text = PRISON_FOOD_EATING.encouragement(victim, opponent, vPr, oPr); }
      else if (type === 'foreignObjectDiscovery') { resistDelta = -0.15; text = PRISON_FOOD_EATING.foreignObjectDiscovery(victim, vPr); }
      else if (type === 'secondWind')        { resistDelta = +0.1;  text = PRISON_FOOD_EATING.secondWind(victim, vPr); }
      else if (type === 'smellHits')         { resistDelta = -0.08; text = PRISON_FOOD_EATING.smellHits(victim, vPr); }
      else if (type === 'sympathyGag')       {
        // affect opponent
        if (opponent && victimResists[opponent] !== undefined) victimResists[opponent] -= 0.05;
        text = PRISON_FOOD_EATING.sympathyGag(victim, opponent, vPr, oPr);
      }
      else if (type === 'chefCritique')      { resistDelta = -0.06; text = PRISON_FOOD_EATING.chefCritique(victim, vPr); }
      else if (type === 'crowdPressure')     { resistDelta = +0.04; text = PRISON_FOOD_EATING.crowdPressure(victim, vPr); }
      else if (type === 'pokerFace')         {
        if (opponent && victimResists[opponent] !== undefined) victimResists[opponent] -= 0.03;
        text = PRISON_FOOD_EATING.pokerFace(victim, opponent, vPr, oPr);
      }
      else if (type === 'textureSurprise')   { resistDelta = -0.1;  text = PRISON_FOOD_EATING.textureSurprise(victim, vPr); }
      else if (type === 'spiteBite')         { resistDelta = +0.08; text = PRISON_FOOD_EATING.spiteBite(victim, vPr); }
      else if (type === 'nostrilFlare')      { resistDelta = -0.07; text = PRISON_FOOD_EATING.nostrilFlare(victim, vPr); }
      else if (type === 'powerStare')        {
        resistDelta = +0.06;
        if (opponent && victimResists[opponent] !== undefined) victimResists[opponent] -= 0.03;
        text = PRISON_FOOD_EATING.powerStare(victim, opponent, vPr, oPr);
      }
      else if (type === 'stomachGrowl')      { resistDelta = -0.04; text = PRISON_FOOD_EATING.stomachGrowl(victim, vPr); }
      else if (type === 'flashback')         { resistDelta = +0.05; text = PRISON_FOOD_EATING.flashback(victim, vPr); }

      victimResists[victim] = (victimResists[victim] || 0) + resistDelta;
      const margin = (victimResists[victim] || 0) - (tName ? (result.prisonFood.cooking[tName]?.disgustScore || 0) * escFactor : 0);
      victimMargins[victim] = (victimMargins[victim] || 0) + margin;
      roundData.events.push({ type, victim, text, resistDelta, margin });

      if (text) {
        pushEvent(text, opponent ? [victim, opponent] : [victim], type.replace(/([A-Z])/g, ' $1').toUpperCase().trim(), 'blue');
      }
    }

    // Check for vomit
    for (const tName of tribeNames) {
      const v = duelVictims[tName];
      if (!v || duelLoser) continue;
      const resist = victimResists[v] || 0;
      const disgust = (result.prisonFood.cooking[tName]?.disgustScore || 0) * escFactor;
      if (resist < disgust) {
        duelLoser = v;
        vomitRound = r + 1;
        roundData.vomited = v;
        pushEvent(_rp(PRISON_FOOD_HOST.vomit)(host, v), [v], 'VOMIT', 'red');
        break;
      }
    }

    duelRounds.push(roundData);
    if (duelLoser) break;
  }

  // Tiebreak: lowest cumulative margin loses
  if (!duelLoser && tribeNames.length >= 2) {
    const sortedMargins = tribeNames
      .map(tName => ({ tName, v: duelVictims[tName], m: victimMargins[duelVictims[tName]] || 0 }))
      .sort((a, b) => a.m - b.m);
    duelLoser = sortedMargins[0].v;
  }

  // Determine winner tribe + loser tribe
  const loserTribeName = tribeNames.find(tName => duelVictims[tName] === duelLoser) || null;
  const winnerTribeName = tribeNames.find(tName => tName !== loserTribeName) || null;

  result.prisonFood.duel.rounds = duelRounds;
  result.prisonFood.duel.winner = winnerTribeName;
  result.prisonFood.duel.loser = loserTribeName;
  result.prisonFood.duel.vomitRound = vomitRound;

  // Survivor popularity
  if (!gs.popularity) gs.popularity = {};
  if (winnerTribeName) {
    const survivor = duelVictims[winnerTribeName];
    if (survivor) {
      gs.popularity[survivor] = (gs.popularity[survivor] || 0) + 2;
      if (ep.chalMemberScores[survivor] !== undefined) ep.chalMemberScores[survivor] += 5;
      pushEvent(_rp(PRISON_FOOD_HOST.survive)(host, survivor), [survivor], 'SURVIVED', 'gold');
    }
  }
  if (loserTribeName) {
    const loserVictim = duelVictims[loserTribeName];
    if (loserVictim && ep.chalMemberScores[loserVictim] !== undefined) {
      ep.chalMemberScores[loserVictim] += 0;
    }
  }

  // Golden Shovel reward
  if (winnerTribeName) {
    result.goldenShovel = winnerTribeName;
    result.tribeScores[winnerTribeName] = (result.tribeScores[winnerTribeName] || 0) + 1;
  }

  result.phases.push('prisonFood');
}

// ── Phase 2: Prison Break ────────────────────────────────────────────────────

function _simulatePrisonBreak(ep, tribeMembers, result) {
  const host = seasonConfig.host || 'Chris';
  const _rp = arr => arr[Math.floor(Math.random() * arr.length)];
  const campKey = gs.tribes[0]?.name || 'merge';
  const pushEvent = (text, playerList, badge, cls) => {
    ep.campEvents[campKey].post.push({ text, players: playerList, badgeText: badge, badgeClass: cls, tag: 'challenge' });
  };

  const shovelTeam = result.goldenShovel || null;

  pushEvent(_rp(PRISON_BREAK_HOST.intro)(host), tribeMembers.flatMap(t => t.members), 'PRISON BREAK', 'purple');

  // ── 1. PUSHER SELECTION ──
  const tribeData = tribeMembers.map(tribe => {
    const sorted = [...tribe.members].sort((a, b) => {
      const sa = pStats(a); const sb = pStats(b);
      return (sb.physical * 0.6 + sb.endurance * 0.4) - (sa.physical * 0.6 + sa.endurance * 0.4);
    });
    const pusher = sorted[0];
    return { tribe: tribe.name, pusher, members: tribe.members };
  });

  // ── 2. OBSTACLE GAUNTLET ──
  const obstacles = [
    { name: 'mudPit',     check: s => s.physical * 0.07 + s.endurance * 0.04 + Math.random() * 0.3 > 0.5 },
    { name: 'barbedWire', check: s => s.mental * 0.06 + s.temperament * 0.05 + Math.random() * 0.3 > 0.5 },
    { name: 'guardTower', check: s => s.strategic * 0.07 + s.intuition * 0.04 + Math.random() * 0.3 > 0.5 },
    { name: 'wallClimb',  check: s => s.physical * 0.06 + s.boldness * 0.05 + Math.random() * 0.3 > 0.5 },
  ];

  const thrower = ep.thrower || null;

  for (const td of tribeData) {
    td.obstacleResults = [];
    let digRounds = 5;
    const pusherStats = pStats(td.pusher);
    const pusherPr = pronouns(td.pusher);
    const isThrowingPusher = thrower === td.pusher;

    for (const obs of obstacles) {
      const passed = isThrowingPusher ? false : obs.check(pusherStats);
      td.obstacleResults.push({ name: obs.name, passed });

      const pool = PRISON_BREAK_OBSTACLES[obs.name];
      const text = _rp(passed ? pool.pass : pool.fail)(td.pusher, pusherPr);
      pushEvent(text, [td.pusher], obs.name.toUpperCase().replace(/([A-Z])/g, ' $1').trim(), passed ? 'green' : 'red');

      const hostLine = _rp(passed ? PRISON_BREAK_HOST.obstaclePass : PRISON_BREAK_HOST.obstacleFail)(host, td.pusher);
      pushEvent(hostLine, [td.pusher], passed ? 'CLEAR' : 'PENALTY', passed ? 'green' : 'orange');

      if (!passed) digRounds = Math.max(2, digRounds - 1);

      if (!ep.chalMemberScores) ep.chalMemberScores = {};
      if (passed) ep.chalMemberScores[td.pusher] = (ep.chalMemberScores[td.pusher] || 0) + 5;
    }

    // Popularity for pusher who clears all 4
    const allPassed = td.obstacleResults.every(o => o.passed);
    if (allPassed) {
      if (!gs.popularity) gs.popularity = {};
      gs.popularity[td.pusher] = (gs.popularity[td.pusher] || 0) + 3;
    }

    // Golden Shovel bonus rounds
    if (shovelTeam === td.tribe) digRounds += 2;
    td.digRounds = digRounds;
  }

  pushEvent(_rp(PRISON_BREAK_HOST.digStart)(host), tribeMembers.flatMap(t => t.members), 'DIG START', 'gold');

  // ── 3. TUNNEL DIG ──
  for (const td of tribeData) {
    td.roundDistances = [];
    td.totalDistance = 0;

    const hasShovel = shovelTeam === td.tribe;
    let shovelBroken = false;

    for (let round = 0; round < td.digRounds; round++) {
      // Per-member base contributions
      const contributions = {};
      for (const name of td.members) {
        const st = pStats(name);
        let contrib = st.physical * 0.05 + st.mental * 0.03 + Math.random() * 0.2;
        if (thrower === name) contrib = 0;
        contributions[name] = contrib;
      }

      let roundMultiplier = 1.0;
      if (hasShovel && !shovelBroken) roundMultiplier = 1.25;

      // Build event pool
      const eventPool = [];
      const allTribes = tribeData;
      const rivals = allTribes.filter(t => t.tribe !== td.tribe);
      const cumulativeLeader = allTribes.reduce((best, t) => t.totalDistance > best.totalDistance ? t : best, allTribes[0]);
      const isAhead = cumulativeLeader.tribe === td.tribe;

      for (const name of td.members) {
        const st = pStats(name);
        const arch = players.find(p => p.name === name)?.archetype;
        const pr = pronouns(name);

        // hitRock — random
        eventPool.push({ type: 'hitRock', weight: 0.35, name });
        // findContraband — random
        eventPool.push({ type: 'findContraband', weight: 0.25, name });
        // caveInScare — random
        eventPool.push({ type: 'caveInScare', weight: 0.3, name });
        // shortcut — mental check
        if (st.mental * 0.08 > 0.4 + Math.random() * 0.3) eventPool.push({ type: 'shortcut', weight: 0.4, name });
        // claustrophobia — low boldness
        if (st.boldness * 0.08 < 0.3) eventPool.push({ type: 'claustrophobia', weight: 0.45, name });
        // wormNest — low endurance
        if (st.endurance * 0.08 < 0.3) eventPool.push({ type: 'wormNest', weight: 0.4, name });
        // rivalSabotage — villain archetypes
        if (['villain','schemer','chaos-agent'].includes(arch) && rivals.length) {
          eventPool.push({ type: 'rivalSabotage', weight: 0.4, name, rival: rivals[0] });
        }
        // motivationalSpeech — social check
        if (st.social * 0.08 > 0.4 + Math.random() * 0.3) eventPool.push({ type: 'motivationalSpeech', weight: 0.35, name });
        // tunnelFlood — round >= 3
        if (round >= 3) eventPool.push({ type: 'tunnelFlood', weight: 0.3, name });
        // brokenShovel — shovel team only
        if (hasShovel && !shovelBroken) eventPool.push({ type: 'brokenShovel', weight: 0.2, name });
        // undergroundEcho
        eventPool.push({ type: 'undergroundEcho', weight: 0.3, name });
        // digFrenzy — physical check
        if (st.physical * 0.08 > 0.5 + Math.random() * 0.3) eventPool.push({ type: 'digFrenzy', weight: 0.4, name });
        // looseSoil — random
        eventPool.push({ type: 'looseSoil', weight: 0.3, name });
        // oxygenThin — round >= 4
        if (round >= 4) eventPool.push({ type: 'oxygenThin', weight: 0.4, name });
        // findOldTunnel — intuition check
        if (st.intuition * 0.08 > 0.5 + Math.random() * 0.3) eventPool.push({ type: 'findOldTunnel', weight: 0.45, name });
        // vanitySlacker
        if (['showmancer','social-butterfly'].includes(arch) || st.social * 0.08 > 0.6) {
          eventPool.push({ type: 'vanitySlacker', weight: 0.35, name });
        }
        // overachiever
        if (['hero','loyal-soldier','challenge-beast'].includes(arch) || st.physical * 0.08 > 0.5) {
          eventPool.push({ type: 'overachiever', weight: 0.4, name });
        }
        // strategicCoasting
        if (['floater','perceptive-player'].includes(arch) && st.strategic * 0.08 > 0.5) {
          eventPool.push({ type: 'strategicCoasting', weight: 0.35, name });
        }
        // rallyCarrier — social+loyalty check
        if (st.social * 0.08 > 0.4 && st.loyalty * 0.08 > 0.4) {
          eventPool.push({ type: 'rallyCarrier', weight: 0.4, name });
        }
        // lazyExcuse — low loyalty
        if (st.loyalty * 0.08 < 0.25) eventPool.push({ type: 'lazyExcuse', weight: 0.35, name });
        // proveThemWrong — underdog
        if (arch === 'underdog') eventPool.push({ type: 'proveThemWrong', weight: 0.45, name });
      }

      // teamMateClash — look for hostile pairs
      for (let i = 0; i < td.members.length; i++) {
        for (let j = i + 1; j < td.members.length; j++) {
          if (getBond(td.members[i], td.members[j]) <= -2) {
            eventPool.push({ type: 'teammateClash', weight: 0.4, name: td.members[i], name2: td.members[j] });
          }
        }
      }

      // Pick 2-3 events from pool
      const numEvents = 2 + (Math.random() < 0.4 ? 1 : 0);
      const usedTypes = new Set();
      const usedNames = new Set();
      const pickedEvents = [];
      const totalW = eventPool.reduce((s, e) => s + e.weight, 0);

      for (let pick = 0; pick < numEvents && eventPool.length; pick++) {
        let rand = Math.random() * totalW;
        for (const evt of eventPool) {
          rand -= evt.weight;
          if (rand <= 0 && !usedTypes.has(evt.type) && !usedNames.has(evt.name)) {
            pickedEvents.push(evt);
            usedTypes.add(evt.type);
            usedNames.add(evt.name);
            if (evt.name2) usedNames.add(evt.name2);
            break;
          }
        }
      }

      // Apply events
      let roundTribeMod = 0;
      for (const evt of pickedEvents) {
        const st = pStats(evt.name);
        const pr = pronouns(evt.name);
        let text = '';

        if (evt.type === 'hitRock') {
          contributions[evt.name] = 0;
          text = _rp(PRISON_BREAK_DIG_EVENTS.hitRock)(evt.name, pr);

        } else if (evt.type === 'findContraband') {
          roundTribeMod += 0.1;
          text = _rp(PRISON_BREAK_DIG_EVENTS.findContraband)(evt.name, pr);

        } else if (evt.type === 'caveInScare') {
          const panicCheck = st.temperament * 0.08 > 0.4 + Math.random() * 0.4;
          if (!panicCheck) contributions[evt.name] = 0;
          text = _rp(PRISON_BREAK_DIG_EVENTS.caveInScare)(evt.name, pr);

        } else if (evt.type === 'shortcut') {
          roundTribeMod += 0.2;
          text = _rp(PRISON_BREAK_DIG_EVENTS.shortcut)(evt.name, pr);

        } else if (evt.type === 'claustrophobia') {
          contributions[evt.name] = 0;
          text = _rp(PRISON_BREAK_DIG_EVENTS.claustrophobia)(evt.name, pr);

        } else if (evt.type === 'wormNest') {
          contributions[evt.name] = 0;
          text = _rp(PRISON_BREAK_DIG_EVENTS.wormNest)(evt.name, pr);

        } else if (evt.type === 'rivalSabotage') {
          // Applied to rival tribe's round modifier — store for later
          if (evt.rival) evt.rival._sabotage = (evt.rival._sabotage || 0) - 0.1;
          text = _rp(PRISON_BREAK_DIG_EVENTS.rivalSabotage)(evt.name, pr);
          if (!gs.popularity) gs.popularity = {};
          gs.popularity[evt.name] = (gs.popularity[evt.name] || 0) - 1;

        } else if (evt.type === 'motivationalSpeech') {
          roundTribeMod += 0.08;
          text = _rp(PRISON_BREAK_DIG_EVENTS.motivationalSpeech)(evt.name, pr);

        } else if (evt.type === 'tunnelFlood') {
          roundTribeMod -= 0.15;
          text = _rp(PRISON_BREAK_DIG_EVENTS.tunnelFlood)(evt.name, pr);

        } else if (evt.type === 'brokenShovel') {
          shovelBroken = true;
          roundMultiplier = 1.0;
          text = _rp(PRISON_BREAK_DIG_EVENTS.brokenShovel)(evt.name, pr);

        } else if (evt.type === 'undergroundEcho') {
          roundTribeMod += isAhead ? 0.05 : -0.05;
          text = _rp(PRISON_BREAK_DIG_EVENTS.undergroundEcho)(evt.name, pr);

        } else if (evt.type === 'digFrenzy') {
          contributions[evt.name] = (contributions[evt.name] || 0) * 2;
          text = _rp(PRISON_BREAK_DIG_EVENTS.digFrenzy)(evt.name, pr);
          if (!gs.popularity) gs.popularity = {};
          gs.popularity[evt.name] = (gs.popularity[evt.name] || 0) + 1;

        } else if (evt.type === 'looseSoil') {
          roundTribeMod += 0.25;
          text = _rp(PRISON_BREAK_DIG_EVENTS.looseSoil)(evt.name, pr);

        } else if (evt.type === 'oxygenThin') {
          roundTribeMod -= 0.1;
          text = _rp(PRISON_BREAK_DIG_EVENTS.oxygenThin)(evt.name, pr);

        } else if (evt.type === 'findOldTunnel') {
          roundTribeMod += 0.3;
          text = _rp(PRISON_BREAK_DIG_EVENTS.findOldTunnel)(evt.name, pr);

        } else if (evt.type === 'teammateClash') {
          contributions[evt.name] = 0;
          if (evt.name2) contributions[evt.name2] = 0;
          const pr2 = pronouns(evt.name2);
          text = _rp(PRISON_BREAK_DIG_EVENTS.teammateClash)(evt.name, evt.name2, pr, pr2);
          addBond(evt.name, evt.name2, -0.3);

        } else if (evt.type === 'vanitySlacker') {
          contributions[evt.name] = 0;
          text = _rp(PRISON_BREAK_DIG_EVENTS.vanitySlacker)(evt.name, pr);
          if (!gs.popularity) gs.popularity = {};
          gs.popularity[evt.name] = (gs.popularity[evt.name] || 0) - 1;

        } else if (evt.type === 'overachiever') {
          contributions[evt.name] = (contributions[evt.name] || 0) * 2;
          roundTribeMod += 0.05;
          text = _rp(PRISON_BREAK_DIG_EVENTS.overachiever)(evt.name, pr);
          if (!gs.popularity) gs.popularity = {};
          gs.popularity[evt.name] = (gs.popularity[evt.name] || 0) + 1;
          addBond(evt.name, td.members.filter(n => n !== evt.name)[0] || evt.name, 0.2);

        } else if (evt.type === 'strategicCoasting') {
          contributions[evt.name] = (contributions[evt.name] || 0) * 0.5;
          text = _rp(PRISON_BREAK_DIG_EVENTS.strategicCoasting)(evt.name, pr);

        } else if (evt.type === 'rallyCarrier') {
          contributions[evt.name] = (contributions[evt.name] || 0) * 1.5;
          roundTribeMod += 0.05;
          text = _rp(PRISON_BREAK_DIG_EVENTS.rallyCarrier)(evt.name, pr);

        } else if (evt.type === 'lazyExcuse') {
          contributions[evt.name] = 0;
          text = _rp(PRISON_BREAK_DIG_EVENTS.lazyExcuse)(evt.name, pr);
          for (const tm of td.members) { if (tm !== evt.name) addBond(tm, evt.name, -0.2); }
          if (!gs.popularity) gs.popularity = {};
          gs.popularity[evt.name] = (gs.popularity[evt.name] || 0) - 1;

        } else if (evt.type === 'proveThemWrong') {
          contributions[evt.name] = (contributions[evt.name] || 0) * 2;
          text = _rp(PRISON_BREAK_DIG_EVENTS.proveThemWrong)(evt.name, pr);
        }

        if (text) {
          const involvedPlayers = evt.name2 ? [evt.name, evt.name2] : [evt.name];
          pushEvent(text, involvedPlayers, evt.type.replace(/([A-Z])/g, ' $1').toUpperCase().trim(), 'blue');
        }

        // chalMemberScores for diggers
        ep.chalMemberScores[evt.name] = (ep.chalMemberScores[evt.name] || 0) + (contributions[evt.name] || 0) * 10;
      }

      // Apply pending rival sabotage
      if (td._sabotage) {
        roundTribeMod += td._sabotage;
        td._sabotage = 0;
      }

      // Compute round distance = avg contribution * roundMultiplier * (1 + mod)
      const avgContrib = Object.values(contributions).reduce((s, v) => s + v, 0) / td.members.length;
      const roundDist = avgContrib * roundMultiplier * (1 + roundTribeMod);
      td.roundDistances.push(roundDist);
      td.totalDistance += roundDist;
    }

    // Shovel team bonus score
    if (shovelTeam === td.tribe) {
      for (const name of td.members) {
        ep.chalMemberScores[name] = (ep.chalMemberScores[name] || 0) + 2;
      }
    }
  }

  // ── 4. DETERMINE WINNER ──
  const sorted = [...tribeData].sort((a, b) => b.totalDistance - a.totalDistance);
  const winnerTd = sorted[0];

  pushEvent(_rp(PRISON_BREAK_HOST.digEnd)(host, winnerTd.tribe), tribeMembers.flatMap(t => t.members), 'BREAKTHROUGH', 'gold');
  pushEvent(_rp(PRISON_BREAK_HOST.winner)(host, winnerTd.tribe), tribeMembers.flatMap(t => t.members), 'IMMUNITY', 'gold');

  result.tribeScores[winnerTd.tribe] = (result.tribeScores[winnerTd.tribe] || 0) + 2;

  result.prisonBreak = {
    tribes: tribeData.map(td => ({
      tribe: td.tribe,
      pusher: td.pusher,
      obstacles: td.obstacleResults,
      digRounds: td.digRounds,
      roundDistances: td.roundDistances,
      totalDistance: td.totalDistance,
    })),
    shovelTeam,
    winner: winnerTd.tribe,
  };

  result.phases.push('prisonBreak');

  // Heat: rival sabotage victims
  if (!gs._chefshankHeat) gs._chefshankHeat = {};
  const heatExpires = (gs.episode || 1) + 2;
  for (const td of tribeData) {
    if (td._sabotage && td._sabotage < 0) {
      const rival = tribeData.find(t => t.tribe !== td.tribe);
      if (rival) {
        const sabotagePusher = rival.pusher;
        if (!gs._chefshankHeat[sabotagePusher]) {
          gs._chefshankHeat[sabotagePusher] = { target: td.pusher, amount: 0.8, expiresEp: heatExpires };
        }
      }
    }
  }
}

// ── Drama Break ──────────────────────────────────────────────────────────────

function _simulatePrisonDramaBreak(ep, tribeMembers, result) {
  const campKey = gs.tribes[0]?.name || 'merge';
  const _rp = arr => arr[Math.floor(Math.random() * arr.length)];

  const firedEvents = [];
  const usedPlayers = new Set();
  const minCount = 4;
  const targetCount = 4 + Math.floor(Math.random() * 3); // 4–6

  for (let pass = 0; pass < 2; pass++) {
    if (pass === 1 && firedEvents.length >= minCount) break;
    if (pass === 1) usedPlayers.clear();
    const shuffled = [...PRISON_DRAMA_EVENTS].sort(() => Math.random() - 0.5);
    for (const evt of shuffled) {
      if (firedEvents.length >= targetCount) break;
      const ctx = evt.check(tribeMembers, result);
      if (!ctx) continue;

      const starring = [ctx.actor, ctx.target, ctx.accuser].filter(Boolean);
      if (pass === 0 && starring.some(p => usedPlayers.has(p))) continue;
      if (firedEvents.some(e => e.id === evt.id)) continue;

      const outcome = evt.apply(ctx);
      if (!outcome) continue;

      firedEvents.push({ id: evt.id, badge: evt.badge, badgeClass: evt.badgeClass, ...outcome });

      if (!ep.campEvents[campKey]) ep.campEvents[campKey] = { pre: [], post: [] };
      if (!ep.campEvents[campKey].post) ep.campEvents[campKey].post = [];
      ep.campEvents[campKey].post.push({
        text: outcome.text,
        players: outcome.players || [],
        badgeText: evt.badge.toUpperCase(),
        badgeClass: evt.badgeClass,
        tag: 'challenge',
      });

      starring.forEach(p => usedPlayers.add(p));
      if (firedEvents.length % 2 === 0) usedPlayers.clear();
    }
  }

  result.breakEvents = firedEvents;
}

export function simulateChefshank(ep) {
  const tribes = gs.tribes;
  if (!tribes || tribes.length < 2) return;
  const tribeMembers = tribes.map(t => ({ name: t.name, members: [...t.members] }));

  const result = {
    phases: [],
    tribeScores: {},
    prisonFood: null,
    prisonBreak: null,
    breakEvents: null,
    goldenShovel: null,
  };
  tribeMembers.forEach(t => { result.tribeScores[t.name] = 0; });

  ep.chefshank = result;
  ep.challengeType = 'chefshank';
  ep.challengeLabel = 'The Chefshank Redemption';

  if (!ep.campEvents) ep.campEvents = {};
  const campKey = gs.tribes[0]?.name || 'merge';
  if (!ep.campEvents[campKey]) ep.campEvents[campKey] = { pre: [], post: [] };
  if (!ep.campEvents[campKey].post) ep.campEvents[campKey].post = [];

  if (!ep.chalMemberScores) ep.chalMemberScores = {};
  tribeMembers.flatMap(t => t.members).forEach(n => { ep.chalMemberScores[n] = 0; });

  _simulatePrisonFood(ep, tribeMembers, result);
  _simulatePrisonDramaBreak(ep, tribeMembers, result);
  _simulatePrisonBreak(ep, tribeMembers, result);

  const sorted = Object.entries(result.tribeScores).sort((a, b) => b[1] - a[1]);
  const winnerName = sorted[0][0];
  const loserName = sorted[sorted.length - 1][0];
  ep.winner = tribes.find(t => t.name === winnerName);
  ep.loser = tribes.find(t => t.name === loserName);
  ep.tribalPlayers = [...ep.loser.members];
  ep.safeTribes = tribes.filter(t => t.name !== loserName && t.name !== winnerName);

  updateChalRecord(ep);

  ep.campEvents[campKey].post.push({
    text: `The Chefshank Redemption: ${winnerName} breaks free. ${loserName} stays locked up — tribal council tonight.`,
    players: tribeMembers.flatMap(t => t.members),
    badgeText: 'CHEFSHANK REDEMPTION', badgeClass: 'gold',
    tag: 'challenge',
  });

  ep._debugChefshank = {
    tribeScores: { ...result.tribeScores },
    phases: [...result.phases],
    goldenShovel: result.goldenShovel,
    prisonFood: result.prisonFood ? {
      duelWinner: result.prisonFood.duel.winner,
      duelLoser: result.prisonFood.duel.loser,
      vomitRound: result.prisonFood.duel.vomitRound,
    } : null,
    prisonBreak: result.prisonBreak ? {
      shovelTeam: result.prisonBreak.shovelTeam,
      winner: result.prisonBreak.winner,
      tribes: result.prisonBreak.tribes.map(t => ({
        tribe: t.tribe,
        pusher: t.pusher,
        obstaclesCleared: t.obstacles.filter(o => o.passed).length,
        digRounds: t.digRounds,
        totalDistance: t.totalDistance.toFixed(3),
      })),
    } : null,
    dramaBreak: result.breakEvents ? result.breakEvents.map(e => e.id) : [],
  };
}

export function _textChefshank(ep, ln, sec) {
  const cs = ep.chefshank;
  if (!cs) return;
  sec('The Chefshank Redemption');
  ln('The teams face a prison-themed challenge — cook disgusting food, then dig their way to freedom.');
}

export function rpBuildChefshankTitleCard(ep) {
  if (!ep.chefshank) return '';
  return '<div style="padding:40px;text-align:center;color:#6b7280;font-family:serif;"><h1>⛓️ THE CHEFSHANK REDEMPTION</h1><p>Title Card — Full VP coming soon</p></div>';
}

export function chefshankRevealNext() {}
export function chefshankRevealAll() {}
