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

  // ── 1. VICTIM DRAFT — circular targeting so each tribe picks from a different enemy ──
  const victims = {};
  // Circular: tribe[0] targets tribe[1], tribe[1] targets tribe[2], tribe[2] targets tribe[0]
  for (let ti = 0; ti < tribeMembers.length; ti++) {
    const tribe = tribeMembers[ti];
    const targetTribe = tribeMembers[(ti + 1) % tribeMembers.length];
    const scored = targetTribe.members.map(name => {
      const s = pStats(name);
      return { name, w: (10 - s.endurance) * 0.04 + (10 - s.boldness) * 0.03 + Math.random() * 0.5 };
    });
    scored.sort((a, b) => b.w - a.w);
    const victimName = scored[0].name;
    victims[tribe.name] = victimName;
    result.prisonFood.victims[tribe.name] = victimName;
    pushEvent(
      _rp(PRISON_FOOD_HOST.victimPicked)(host, victimName, targetTribe.name),
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

  const roundEscalation = [0.4, 0.55, 0.7, 0.85, 1.0];
  const numRounds = 4 + Math.floor(Math.random() * 2); // 4-5
  const eliminatedVictims = new Set();
  let vomitRound = null;

  const duelRounds = [];

  for (let r = 0; r < numRounds; r++) {
    const roundData = { round: r + 1, events: [], vomited: null, biteResults: [] };
    const escFactor = roundEscalation[r] || 1.3;

    pushEvent(_rp(PRISON_FOOD_HOST.roundStart)(host, r + 1), Object.values(duelVictims), `ROUND ${r + 1}`, 'purple');

    // Collect this round's victims with their stats
    const activeDuelTribes = tribeNames.filter(tName => duelVictims[tName] && !eliminatedVictims.has(duelVictims[tName]));

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

    // Each victim takes a bite — show status for ALL still-eating victims
    roundData.biteResults = [];
    for (const tName of tribeNames) {
      const v = duelVictims[tName];
      if (!v || eliminatedVictims.has(v)) continue;
      const resist = (victimResists[v] || 0) + Math.random() * 0.15;
      const disgust = (result.prisonFood.cooking[tName]?.disgustScore || 0) * escFactor;
      const survived = resist >= disgust;
      const margin = resist - disgust;
      roundData.biteResults.push({ victim: v, tribe: tName, survived, margin: margin.toFixed(2) });
      if (!survived) {
        eliminatedVictims.add(v);
        if (!vomitRound) vomitRound = r + 1;
        roundData.vomited = roundData.vomited || [];
        if (typeof roundData.vomited === 'string') roundData.vomited = [roundData.vomited];
        roundData.vomited.push(v);
        pushEvent(_rp(PRISON_FOOD_HOST.vomit)(host, v), [v], 'VOMIT', 'red');
      }
    }

    duelRounds.push(roundData);

    // End check: 2 tribes = first vomit ends it. 3+ = continue until 1 remains
    const stillEating = tribeNames.filter(t => duelVictims[t] && !eliminatedVictims.has(duelVictims[t]));
    if (stillEating.length <= 1) break;
    if (tribeNames.length === 2 && eliminatedVictims.size > 0) break;
  }

  // Determine loser: last to vomit, or tiebreak by lowest margin
  const vomitedList = [...eliminatedVictims];
  let duelLoser = vomitedList.length ? vomitedList[0] : null;
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

  // ── Showmance moment (cross-tribe, 40% chance) ────────────────────────────
  if (seasonConfig.romance !== false && Math.random() < 0.4) {
    const allNames = tribeMembers.flatMap(t => t.members);
    const crossPairs = [];
    for (let i = 0; i < tribeMembers.length; i++) {
      for (let j = i + 1; j < tribeMembers.length; j++) {
        for (const a of tribeMembers[i].members) {
          for (const b of tribeMembers[j].members) {
            const rc = romanticCompat(a, b);
            if (rc >= 0.4) crossPairs.push({ a, b, rc });
          }
        }
      }
    }
    if (crossPairs.length) {
      crossPairs.sort((x, y) => y.rc - x.rc);
      const { a, b } = crossPairs[0];
      const aPr = pronouns(a);
      const bPr = pronouns(b);
      addBond(a, b, 0.4);
      if (!gs.popularity) gs.popularity = {};
      gs.popularity[a] = (gs.popularity[a] || 0) + 1;
      gs.popularity[b] = (gs.popularity[b] || 0) + 1;
      const smTexts = [
        `Between phases, ${a} and ${b} slip away from their tribes. Nobody says anything — but everyone notices.`,
        `${a} catches ${b}'s eye during the yard break. The next moment ${aPr.sub} spends with ${aPr.posAdj} own tribe, ${aPr.sub}'s distracted.`,
        `${a} lingers near ${b} during the break — too long for strategy, too deliberate for accident. ${bPr.Sub} doesn't move away.`,
        `The challenge brings out something unexpected: ${a} and ${b} find each other in the chaos. ${aPr.Sub} can't explain it. ${bPr.Sub} doesn't try.`,
      ];
      const smText = smTexts[Math.floor(Math.random() * smTexts.length)];
      ep.campEvents[campKey].post.push({
        text: smText,
        players: [a, b],
        badgeText: 'PRISON ROMANCE',
        badgeClass: 'purple',
        tag: 'challenge',
      });
      result.showmanceMoment = { a, b };
    }
  }

  // ── Cold open — pick most dramatic moment ─────────────────────────────────
  let coldOpen = null;
  const pf = result.prisonFood;
  const pb = result.prisonBreak;

  // Priority 1: vomit on round 1 (early upset)
  if (!coldOpen && pf?.duel?.vomitRound === 1 && pf?.duel?.loser) {
    const loserTribe = pf.duel.loser;
    const loserVictim = Object.entries(pf.victims || {}).find(([t]) => t === loserTribe)?.[1];
    if (loserVictim) {
      coldOpen = `${loserVictim} didn't even make it past round one. One bowl. That's all it took.`;
    }
  }

  // Priority 2: all obstacles failed by one tribe
  if (!coldOpen && pb?.tribes) {
    const shutout = pb.tribes.find(t => t.obstacles && t.obstacles.length && t.obstacles.every(o => !o.passed));
    if (shutout) {
      coldOpen = `${shutout.pusher} couldn't clear a single obstacle. ${shutout.tribe} entered the tunnel with nothing.`;
    }
  }

  // Priority 3: rival sabotage in dig (from breakEvents or dig text)
  if (!coldOpen && result.breakEvents?.some(e => e.id === 'shiv-threat')) {
    const threat = result.breakEvents.find(e => e.id === 'shiv-threat');
    coldOpen = `Before the tunnel even opened, ${threat.actor} had already made a threat. This challenge got personal fast.`;
  }

  // Priority 4: accidental improvement caught
  if (!coldOpen && pf) {
    for (const [tName, cookData] of Object.entries(pf.cooking || {})) {
      const caught = cookData.events?.find(e => e.type === 'accidentalImprovement');
      if (caught) {
        coldOpen = `${caught.actor} accidentally made the slop edible — and their tribe was not happy about it.`;
        break;
      }
    }
  }

  // Priority 5: dramatic final round duel (vomit on last round or max round)
  if (!coldOpen && pf?.duel?.vomitRound && pf.duel.vomitRound >= 4) {
    const victim = pf.duel.vomitVictim || Object.entries(pf.victims || {})?.[0]?.[1];
    if (victim) {
      coldOpen = `${victim} made it to round ${pf.duel.vomitRound} before tapping out. This duel went to the wire.`;
    }
  }

  // Fallback
  if (!coldOpen) {
    const winnerTribe = pb?.winner || winnerName;
    coldOpen = `${winnerTribe} executed the Prison Break flawlessly. Their rivals never had a chance.`;
  }

  result.coldOpen = coldOpen;
}

export function _textChefshank(ep, ln, sec) {
  const cs = ep.chefshank;
  if (!cs) return;
  const host = seasonConfig.host || 'Chris';
  const _rp = arr => arr[Math.floor(Math.random() * arr.length)];

  sec('The Chefshank Redemption');

  const introLines = [
    `${host} unveils the prison set with visible glee — concrete walls, rusted bars, and a kitchen that looks like it's never been cleaned. "Two phases," he says. "Cook the slop. Eat the slop. Then dig your way out. Welcome to The Chefshank Redemption."`,
    `The tribes arrive to find a full prison mock-up erected overnight. ${host} is already in costume — warden's cap, clipboard. "Phase 1: Prison Food. Phase 2: Prison Break. Win both and you're free. Lose and it's tribal council — still in chains."`,
    `${host} leans against a rusty cell door and grins. "Today's challenge is a Total Drama classic. You cook the worst thing imaginable. The enemy eats it. Then everyone grabs a shovel. Last tribe standing walks free."`,
  ];
  ln(_rp(introLines));

  // ── Phase 1: Prison Food ──────────────────────────────────────────────────
  if (cs.prisonFood) {
    const pf = cs.prisonFood;

    sec('Phase 1: Prison Food');

    // Victim draft
    const tribeNames = Object.keys(pf.victims || {});
    for (const tName of tribeNames) {
      const victim = pf.victims[tName];
      if (!victim) continue;
      const vPr = pronouns(victim);
      const victimDraftLines = [
        `${tName} nominates ${victim} to eat whatever their rivals cook up. ${vPr.Sub} accepts — not gracefully.`,
        `The choice falls on ${victim}. ${tName} picks ${vPr.obj} to stomach the enemy's cooking. ${vPr.Sub} doesn't argue.`,
        `${victim} is the designated eater for ${tName}. ${vPr.Sub} cracks ${vPr.posAdj} knuckles and takes a seat.`,
      ];
      ln(_rp(victimDraftLines));
    }

    // Cooking highlights
    for (const [tName, cookData] of Object.entries(pf.cooking || {})) {
      if (!cookData?.events?.length) continue;
      for (const evt of cookData.events) {
        if (evt.text) ln(evt.text);
      }
    }

    // Duel narration
    const duel = pf.duel;
    if (duel?.rounds?.length) {
      const roundIntros = [
        r => `Round ${r}: ${host} slides another bowl forward. The eating continues.`,
        r => `Round ${r} arrives and neither eater looks particularly confident.`,
        r => `${host} announces round ${r}. The bowls keep coming.`,
      ];
      for (const round of duel.rounds) {
        ln(_rp(roundIntros)(round.round));
        for (const evt of (round.events || [])) {
          if (evt.text) ln(evt.text);
        }
        if (round.vomited) {
          const vomitLines = [
            `${round.vomited} reaches ${round.round} rounds before tapping out — hard.`,
            `Down goes ${round.vomited}. Round ${round.round} is the end of the line.`,
            `${round.vomited} can't hold it. ${host} blows the whistle. "That's it. We have a casualty."`,
          ];
          ln(_rp(vomitLines));
        }
      }

      // Final result
      if (duel.winner && duel.loser) {
        const survivor = pf.victims[duel.winner];
        const vomitVictim = pf.victims[duel.loser];
        if (duel.vomitRound) {
          const surviveLines = [
            `${survivor} survives all ${duel.rounds.length} rounds. ${pronouns(survivor).Sub} doesn't celebrate — just sets the bowl down and stares straight ahead.`,
            `After ${duel.rounds.length} rounds, ${survivor} finishes clean. ${vomitVictim || 'the other eater'} didn't make it. The Golden Shovel goes to ${duel.winner}.`,
            `${duel.winner} wins the duel. ${survivor} took every bowl they were handed and held it down. The Golden Shovel is theirs.`,
          ];
          ln(_rp(surviveLines));
        } else {
          // Tiebreak
          ln(`Neither eater vomited — ${host} judges by margin. ${duel.winner} holds the edge. Golden Shovel awarded.`);
        }
      }
    }

    // Golden Shovel
    if (cs.goldenShovel) {
      const shovelLines = [
        `${host} raises the Golden Shovel. "${cs.goldenShovel} — your Phase 2 advantage. Two extra dig rounds. Don't waste them."`,
        `The Golden Shovel goes to ${cs.goldenShovel}. Two bonus rounds in the tunnel. That could be everything.`,
        `${cs.goldenShovel} walks away with the Golden Shovel and a two-round advantage heading into Phase 2.`,
      ];
      ln(_rp(shovelLines));
    }
  }

  // ── Yard Time ─────────────────────────────────────────────────────────────
  if (cs.breakEvents?.length) {
    sec('Yard Time');
    for (const evt of cs.breakEvents) {
      if (evt.text) ln(evt.text);
    }
  }

  // ── Phase 2: Prison Break ─────────────────────────────────────────────────
  if (cs.prisonBreak) {
    const pb = cs.prisonBreak;
    sec('Phase 2: Prison Break');

    // Pusher selection
    for (const td of pb.tribes) {
      const pPr = pronouns(td.pusher);
      const pusherLines = [
        `${td.tribe} sends ${td.pusher} through the obstacle gauntlet. ${pPr.Sub}'s the strongest option and everyone knows it.`,
        `${td.pusher} volunteers to run the obstacles for ${td.tribe}. Nobody argues.`,
        `The choice for ${td.tribe} is obvious: ${td.pusher}. ${pPr.Sub} steps up without being asked.`,
      ];
      ln(_rp(pusherLines));
    }

    // Obstacle results
    for (const td of pb.tribes) {
      const pPr = pronouns(td.pusher);
      const cleared = td.obstacles.filter(o => o.passed).length;
      const total = td.obstacles.length;
      for (const obs of (td.obstacles || [])) {
        const obsName = obs.name.replace(/([A-Z])/g, ' $1').toLowerCase().trim();
        if (obs.passed) {
          const passLines = [
            `${td.pusher} clears the ${obsName}. ${pPr.Sub} keeps the tribe's dig rounds intact.`,
            `Through the ${obsName} — clean. ${td.tribe} doesn't lose ground.`,
            `${td.pusher} takes the ${obsName} without hesitation. Clear.`,
          ];
          ln(_rp(passLines));
        } else {
          const failLines = [
            `${td.pusher} trips up on the ${obsName}. That's a dig round gone.`,
            `The ${obsName} costs ${td.tribe} a round in the tunnel. ${td.pusher} picks ${pPr.obj}self up and moves on.`,
            `${td.pusher} doesn't make it through the ${obsName} clean. ${td.tribe} pays for it.`,
          ];
          ln(_rp(failLines));
        }
      }
      if (cleared === total) {
        ln(`${td.pusher} goes clean through every obstacle. ${td.tribe} enters the tunnel with a full complement of dig rounds.`);
      } else if (cleared === 0) {
        ln(`${td.tribe} starts the tunnel phase at a severe disadvantage — every obstacle cost them.`);
      }
    }

    // Shovel advantage
    if (pb.shovelTeam) {
      ln(`The Golden Shovel delivers: ${pb.shovelTeam} gets two extra rounds in the tunnel. That edge is real.`);
    }

    // Dig narration — round by round per tribe
    for (const td of pb.tribes) {
      if (!td.roundDistances?.length) continue;
      const digIntros = [
        `${td.tribe} hits the tunnel. Shovels go in. The race is on.`,
        `${td.tribe} drops into the dig with ${td.digRounds} rounds on the clock.`,
        `The ${td.tribe} tunnel: ${td.digRounds} rounds, one way out.`,
      ];
      ln(_rp(digIntros));

      td.roundDistances.forEach((dist, i) => {
        const r = i + 1;
        const distPct = Math.round(dist * 100);
        if (distPct > 25) {
          const goodRounds = [
            `Round ${r}: ${td.tribe} gains ground — a solid advance.`,
            `Round ${r} in the tunnel: ${td.tribe} makes real progress.`,
            `${td.tribe} — round ${r}. The dirt gives way and they push through.`,
          ];
          ln(_rp(goodRounds));
        } else {
          const poorRounds = [
            `Round ${r}: ${td.tribe} struggles. Something is slowing them down.`,
            `Round ${r} goes badly for ${td.tribe}. The tunnel doesn't cooperate.`,
            `${td.tribe} barely moves the needle in round ${r}.`,
          ];
          ln(_rp(poorRounds));
        }
      });
    }

    // Winner declared
    if (pb.winner) {
      const winLines = [
        `${pb.winner}'s fist punches through the wall first. Daylight floods in. ${host} grabs the airhorn — "${pb.winner} BREAKS FREE! Immunity is yours!"`,
        `The breakthrough: ${pb.winner} clears the final barrier and emerges. ${host}: "${pb.winner} — you're out. Everyone else, start thinking about tribal."`,
        `${pb.winner} wins Phase 2 and the challenge overall. The other tribe heads to tribal tonight.`,
      ];
      ln(_rp(winLines));
    }
  }

  // ── The Verdict ───────────────────────────────────────────────────────────
  sec('The Verdict');

  if (cs.tribeScores) {
    const sorted = Object.entries(cs.tribeScores).sort((a, b) => b[1] - a[1]);
    for (const [tribe, score] of sorted) {
      ln(`${tribe}: ${score} point${score !== 1 ? 's' : ''}.`);
    }
  }

  const winner = ep.winner?.name;
  const loser = ep.loser?.name;
  if (winner && loser) {
    const verdictLines = [
      `${winner} walks free. ${loser} is headed to tribal council — and someone won't be coming back.`,
      `Final score: ${winner} earns immunity. ${loser} faces the vote tonight.`,
      `${host} hands over immunity to ${winner}. ${loser} has a long night ahead.`,
    ];
    ln(_rp(verdictLines));
  }

  // Showmance moment addendum
  if (cs.showmanceMoment) {
    const { a, b } = cs.showmanceMoment;
    ln(`Away from the result ceremony, ${a} and ${b} have their own moment — the challenge brought them closer in a way they didn't expect.`);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// VP — Shell + CSS
// ═══════════════════════════════════════════════════════════════════════════

function _csShell(content, ep) {
  return `
<style>
@import url('https://fonts.googleapis.com/css2?family=Black+Ops+One&family=Inter:wght@400;600;700;900&display=swap');

/* ── Theme tokens ── */
.cs-shell{
  --cs-concrete:#4b5563;--cs-rust:#b45309;--cs-bar:#374151;
  --cs-jumpsuit:#ea580c;--cs-fluorescent:#e0f2fe;--cs-blood:#991b1b;
  --cs-mold:#4d7c0f;--cs-ink:#1e1b4b;--cs-metal:#6b7280;
  --cs-grime:#78716c;--cs-chain:#a8a29e;
  font-family:'Inter',sans-serif;color:#e2e8f0;
  background:linear-gradient(180deg,#374151 0%,#1f2937 20%,#111827 50%,#0f172a 85%,#020617 100%);
  padding:0;max-width:1100px;margin:0 auto;position:relative;min-height:400px;
  overflow:clip;border:3px solid #1e293b;box-shadow:inset 0 0 60px rgba(0,0,0,0.6),0 0 30px rgba(0,0,0,0.5);
}

/* ── Crack texture overlay ── */
.cs-shell::before{content:'';position:absolute;top:0;left:0;right:0;bottom:0;clip-path:inset(0);
  background:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='5' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.6'/%3E%3C/svg%3E");
  opacity:.04;pointer-events:none;z-index:5;mix-blend-mode:overlay;animation:cs-crack 8s linear infinite}

/* ── Fluorescent light ── */
.cs-fluorescent{position:absolute;top:0;left:10%;right:10%;height:3px;z-index:7;pointer-events:none;
  background:linear-gradient(90deg,transparent,rgba(224,242,254,0.5),rgba(224,242,254,0.7),rgba(224,242,254,0.5),transparent);
  box-shadow:0 0 20px rgba(224,242,254,0.15),0 0 60px rgba(224,242,254,0.08);
  animation:cs-flicker 6s linear infinite}

/* ── Cell bars top border ── */
.cs-bar-top{height:8px;
  background:repeating-linear-gradient(90deg,#374151 0px,#374151 6px,transparent 6px,transparent 18px);
  box-shadow:0 2px 6px rgba(0,0,0,0.5);position:relative;z-index:8}

/* ── Header ── */
.cs-header{background:linear-gradient(180deg,#1e293b 0%,#0f172a 100%);
  padding:14px 20px;display:flex;align-items:center;justify-content:space-between;
  border-bottom:2px solid var(--cs-rust);position:relative;z-index:6;
  box-shadow:inset 0 -2px 8px rgba(0,0,0,0.5),0 2px 10px rgba(0,0,0,0.4)}
.cs-title{font-family:'Black Ops One',cursive;font-size:16px;color:var(--cs-chain);
  text-shadow:2px 2px 0 rgba(0,0,0,0.6);letter-spacing:3px}
.cs-subtitle{font-size:9px;color:rgba(255,255,255,0.35);letter-spacing:4px;text-transform:uppercase;margin-top:2px}

/* ── Layout ── */
.cs-layout{display:flex;gap:14px;align-items:flex-start;padding:14px;position:relative;z-index:6}
.cs-feed{flex:1;min-width:0}
.cs-sidebar{width:260px;flex-shrink:0;position:sticky;top:0;max-height:100vh;overflow-y:auto;align-self:flex-start;
  scrollbar-width:thin;scrollbar-color:rgba(180,83,9,0.25) transparent;
  background:linear-gradient(180deg,rgba(30,41,59,0.9),rgba(15,23,42,0.95));
  backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);
  border:1px solid rgba(180,83,9,0.15);border-radius:4px;padding:12px;
  box-shadow:inset 0 0 20px rgba(0,0,0,0.4)}

/* ── HUD ── */
.cs-hud{display:flex;gap:2px;margin:0 14px 2px;position:relative;z-index:6}
.cs-hud-cell{flex:1;background:rgba(0,0,0,0.5);border:1px solid rgba(180,83,9,0.12);
  padding:8px 4px;text-align:center}
.cs-hud-cell:first-child{border-radius:4px 0 0 4px}.cs-hud-cell:last-child{border-radius:0 4px 4px 0}
.cs-hud-val{font-family:'Black Ops One',cursive;font-size:18px;font-weight:700;color:var(--cs-chain);
  text-shadow:0 0 8px rgba(168,162,158,0.3)}
.cs-hud-lbl{font-size:7px;letter-spacing:2px;color:rgba(255,255,255,0.35);margin-top:2px;text-transform:uppercase}

/* ── Event cards — metal tray (Phase 1) ── */
.cs-ev{background:linear-gradient(135deg,rgba(107,114,128,0.15),rgba(75,85,99,0.1));
  backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);
  border:1px solid rgba(107,114,128,0.15);border-left:3px solid var(--cs-metal);
  padding:12px 14px;margin-bottom:5px;display:flex;align-items:flex-start;gap:12px;
  border-radius:3px;animation:cs-fade-up 0.4s ease-out;position:relative}
.cs-ev.negative{border-left-color:var(--cs-blood)}
.cs-ev.positive{border-left-color:var(--cs-mold)}
.cs-ev.vomit{border-left-color:#16a34a;background:linear-gradient(135deg,rgba(77,124,15,0.15),rgba(22,163,74,0.08))}
.cs-ev.round-header{border-left-color:var(--cs-rust);
  background:linear-gradient(135deg,rgba(180,83,9,0.2),rgba(120,113,108,0.12));
  font-family:'Black Ops One',cursive}
/* Dirt/tunnel style for Phase 2 */
.cs-ev.tunnel{border-left-color:#92400e;
  background:linear-gradient(135deg,rgba(120,53,15,0.15),rgba(69,26,3,0.1))}
.cs-ev.obstacle{border-left-color:var(--cs-bar)}

/* ── Badges — red ink stamp ── */
.cs-ev-badge{display:inline-block;font-family:'Black Ops One',cursive;font-size:8px;letter-spacing:2px;
  padding:2px 8px;border-radius:2px;margin-bottom:4px;text-transform:uppercase;
  background:rgba(153,27,27,0.2);color:#fca5a5;border:1px solid rgba(153,27,27,0.3);
  transform:rotate(-1deg)}
.cs-ev-badge.gold{background:rgba(180,83,9,0.25);color:#fbbf24;border-color:rgba(180,83,9,0.3)}
.cs-ev-badge.red{background:rgba(153,27,27,0.3);color:#fca5a5;border-color:rgba(153,27,27,0.4)}
.cs-ev-badge.green{background:rgba(77,124,15,0.2);color:#86efac;border-color:rgba(77,124,15,0.3)}
.cs-ev-badge.blue{background:rgba(30,58,138,0.2);color:#93c5fd;border-color:rgba(30,58,138,0.3)}
.cs-ev-badge.orange{background:rgba(180,83,9,0.2);color:#fdba74;border-color:rgba(180,83,9,0.3)}
.cs-ev-badge.purple{background:rgba(88,28,135,0.2);color:#d8b4fe;border-color:rgba(88,28,135,0.3)}
.cs-ev-badge.gray{background:rgba(107,114,128,0.15);color:rgba(255,255,255,0.5);border-color:rgba(107,114,128,0.2)}
.cs-ev-badge.yellow{background:rgba(161,98,7,0.2);color:#fde68a;border-color:rgba(161,98,7,0.3)}
.cs-ev-text{font-size:13px;line-height:1.7;color:rgba(255,255,255,0.85)}

/* ═══ MUGSHOT PORTRAITS ═══ */
.cs-mugshot{display:inline-block;text-align:center;position:relative;
  background:linear-gradient(180deg,rgba(31,41,55,0.9),rgba(17,24,39,0.95));
  border:3px solid var(--cs-bar);border-radius:2px;padding:6px 6px 4px;
  box-shadow:3px 3px 10px rgba(0,0,0,0.5),inset 0 0 15px rgba(0,0,0,0.3)}
/* Height marker lines */
.cs-mugshot::before{content:'';position:absolute;top:4px;left:4px;right:4px;bottom:20px;
  background:repeating-linear-gradient(0deg,transparent 0px,transparent 8px,rgba(255,255,255,0.04) 8px,rgba(255,255,255,0.04) 9px);
  pointer-events:none;z-index:0}
.cs-mugshot img{display:block;margin:0 auto 4px;border-radius:1px;
  border:2px solid var(--cs-metal);position:relative;z-index:1;
  filter:contrast(1.1) brightness(0.95);
  box-shadow:inset 0 0 8px rgba(0,0,0,0.4)}
.cs-mugshot-name{font-family:'Black Ops One',cursive;font-size:7px;letter-spacing:1px;color:var(--cs-chain);
  white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:2px}
.cs-mugshot-id{font-family:'Black Ops One',cursive;font-size:6px;letter-spacing:2px;color:rgba(255,255,255,0.3);
  margin-top:1px}
.cs-mugshot.vomited img{filter:contrast(1.1) brightness(0.8) hue-rotate(80deg) saturate(1.5)}
.cs-mugshot.vomited::after{content:'SOLITARY';position:absolute;top:50%;left:50%;
  transform:translate(-50%,-50%) rotate(-12deg);font-family:'Black Ops One',cursive;font-size:14px;
  letter-spacing:3px;color:rgba(22,163,74,0.85);text-shadow:0 0 4px rgba(22,163,74,0.3);
  animation:cs-stamp-in 0.4s ease-out both;pointer-events:none;z-index:3;
  border:3px solid rgba(22,163,74,0.6);padding:2px 6px;border-radius:2px}

/* Compact sidebar variant */
.cs-mugshot.sm{padding:3px 2px 2px;border-width:2px}
.cs-mugshot.sm::before{display:none}
.cs-mugshot.sm .cs-mugshot-name{font-size:6px;letter-spacing:0.5px}
.cs-mugshot.sm .cs-mugshot-id{display:none}
.cs-mugshot.sm.vomited::after{font-size:8px;letter-spacing:1px;border-width:2px;padding:1px 3px}

/* ═══ INK STAMPS ═══ */
.cs-stamp{display:inline-block;font-family:'Black Ops One',cursive;font-size:10px;letter-spacing:3px;
  text-transform:uppercase;padding:4px 14px;border-radius:3px;position:relative;
  border:2px solid currentColor;transform:rotate(-2deg);
  animation:cs-stamp-in 0.5s ease-out both}
.cs-stamp.red{color:#ef4444;background:rgba(239,68,68,0.1);
  text-shadow:0 0 8px rgba(239,68,68,0.3);box-shadow:0 0 12px rgba(239,68,68,0.15)}
.cs-stamp.green{color:#22c55e;background:rgba(34,197,94,0.1);
  text-shadow:0 0 8px rgba(34,197,94,0.3);box-shadow:0 0 12px rgba(34,197,94,0.15)}
.cs-stamp.gold{color:#f59e0b;background:rgba(245,158,11,0.1);
  text-shadow:0 0 8px rgba(245,158,11,0.3);box-shadow:0 0 12px rgba(245,158,11,0.15)}
.cs-stamp.rust{color:var(--cs-rust);background:rgba(180,83,9,0.1);
  text-shadow:0 0 8px rgba(180,83,9,0.3)}

/* ═══ TALLY MARKS ═══ */
.cs-tally{display:inline-block;font-family:'Black Ops One',cursive;font-size:22px;color:var(--cs-chain);
  text-shadow:0 0 6px rgba(168,162,158,0.2);padding:0 3px;
  animation:cs-tally-scratch 0.4s ease-out}

/* ═══ CONTROLS ═══ */
.cs-btn-next{padding:10px 28px;
  background:linear-gradient(135deg,#374151,#1f2937);
  color:var(--cs-chain);border:2px solid rgba(168,162,158,0.3);border-radius:4px;cursor:pointer;
  font-family:'Black Ops One',cursive;font-size:11px;letter-spacing:3px;
  box-shadow:0 4px 15px rgba(0,0,0,0.5),inset 0 1px 0 rgba(255,255,255,0.05);
  transition:transform 0.15s,box-shadow 0.15s;text-transform:uppercase;position:relative}
/* Rivet details */
.cs-btn-next::before,.cs-btn-next::after{content:'';position:absolute;width:6px;height:6px;
  border-radius:50%;background:radial-gradient(circle,#6b7280,#374151);
  border:1px solid rgba(255,255,255,0.1);top:50%;transform:translateY(-50%)}
.cs-btn-next::before{left:6px}.cs-btn-next::after{right:6px}
.cs-btn-next:hover{transform:translateY(-2px);box-shadow:0 6px 20px rgba(0,0,0,0.6),inset 0 1px 0 rgba(255,255,255,0.08)}
.cs-btn-all{padding:8px 18px;background:rgba(255,255,255,0.04);color:rgba(255,255,255,0.35);
  border:1px solid rgba(255,255,255,0.08);border-radius:4px;cursor:pointer;font-size:11px;
  transition:background 0.15s}
.cs-btn-all:hover{background:rgba(255,255,255,0.1);color:rgba(255,255,255,0.6)}
.cs-controls{display:flex;gap:8px;justify-content:center;padding:16px 0;position:relative;z-index:6}

/* ── Sidebar sections ── */
.cs-side-sec{font-family:'Black Ops One',cursive;font-size:8px;letter-spacing:3px;
  color:rgba(180,83,9,0.5);border-bottom:1px solid rgba(180,83,9,0.12);
  padding-bottom:3px;margin:12px 0 6px;text-transform:uppercase}

/* ── Resistance meter ── */
.cs-resist-bar{height:6px;border-radius:3px;background:rgba(255,255,255,0.08);overflow:hidden;margin-top:3px}
.cs-resist-fill{height:100%;border-radius:3px;transition:width 0.3s ease}

/* ── Progress bar (dig) ── */
.cs-dig-bar{height:8px;border-radius:4px;background:rgba(255,255,255,0.06);overflow:hidden;margin-top:3px;
  border:1px solid rgba(180,83,9,0.15)}
.cs-dig-fill{height:100%;border-radius:3px;background:linear-gradient(90deg,#92400e,#b45309);transition:width 0.3s ease}

/* ── Rust stain corners ── */
.cs-shell::after{content:'';position:absolute;top:0;right:0;width:80px;height:80px;clip-path:inset(0);
  background:radial-gradient(ellipse at top right,rgba(180,83,9,0.08),transparent 70%);
  pointer-events:none;z-index:4}

/* ═══ KEYFRAMES ═══ */
@keyframes cs-flicker{
  0%{opacity:0.7}5%{opacity:0.4}10%{opacity:0.75}15%{opacity:0.6}20%{opacity:0.8}
  50%{opacity:0.75}55%{opacity:0.5}60%{opacity:0.78}80%{opacity:0.72}100%{opacity:0.7}}
@keyframes cs-stamp-in{
  0%{transform:translate(-50%,-50%) rotate(-12deg) scale(2.5);opacity:0}
  70%{transform:translate(-50%,-50%) rotate(-12deg) scale(0.95);opacity:1}
  100%{transform:translate(-50%,-50%) rotate(-12deg) scale(1);opacity:1}}
@keyframes cs-fade-up{0%{opacity:0;transform:translateY(12px)}100%{opacity:1;transform:translateY(0)}}
@keyframes cs-crack{0%{background-position:0 0}100%{background-position:100px 100px}}
@keyframes cs-tally-scratch{0%{clip-path:inset(0 100% 0 0)}100%{clip-path:inset(0 0 0 0)}}

/* ═══ prefers-reduced-motion ═══ */
@media (prefers-reduced-motion:reduce){
  .cs-shell::before,.cs-fluorescent{animation:none !important}
  .cs-ev,.cs-stamp,.cs-tally,.cs-mugshot.vomited::after{animation:none !important;transition:none !important}
}
</style>
<div class="cs-shell">
  <div class="cs-bar-top"></div>
  <div class="cs-fluorescent"></div>
  <div class="cs-header">
    <div>
      <div class="cs-title">THE CHEFSHANK REDEMPTION</div>
      <div class="cs-subtitle">Cook &middot; Eat &middot; Dig</div>
    </div>
    <div style="font-size:10px;color:rgba(255,255,255,0.3);letter-spacing:2px;font-family:'Black Ops One',cursive">EPISODE ${ep?.num || '?'}</div>
  </div>
  ${content}
</div>`;
}

// ── VP helpers ─────────────────────────────────────────────────────────────

function _csMugshot(name, size = 64) {
  const slug = players.find(p => p.name === name)?.slug || name.toLowerCase().replace(/\s+/g, '-');
  const outerWidth = size + 16;
  const idx = name.charCodeAt(0) % 99 + 1;
  return `<div class="cs-mugshot" style="width:${outerWidth}px">
    <img src="assets/avatars/${slug}.png" width="${size}" height="${size}" style="display:block;border-radius:1px" onerror="this.style.display='none'">
    <div class="cs-mugshot-name" style="max-width:${size}px">${name}</div>
    <div class="cs-mugshot-id">INMATE #${String(idx).padStart(2, '0')}</div>
  </div>`;
}

function _csSideMugshot(name, size = 32, extraClass = '') {
  const slug = players.find(p => p.name === name)?.slug || name.toLowerCase().replace(/\s+/g, '-');
  return `<div class="cs-mugshot sm ${extraClass}" style="width:${size + 8}px;flex-shrink:0">
    <img src="assets/avatars/${slug}.png" width="${size}" height="${size}" style="display:block;border-radius:1px" onerror="this.style.display='none'">
    <div class="cs-mugshot-name">${name}</div>
  </div>`;
}

function _csSmallPortrait(name, size = 44) {
  const slug = players.find(p => p.name === name)?.slug || name.toLowerCase().replace(/\s+/g, '-');
  return `<div style="width:${size}px;height:${size}px;flex-shrink:0;border-radius:2px;overflow:hidden;border:2px solid var(--cs-bar);box-shadow:0 2px 6px rgba(0,0,0,0.5)">
    <img src="assets/avatars/${slug}.png" width="${size}" height="${size}" style="display:block;object-fit:cover;filter:contrast(1.05) brightness(0.95)" onerror="this.style.display='none'">
  </div>`;
}

function _csStamp(text, color = 'red') {
  return `<span class="cs-stamp ${color}">${text}</span>`;
}

function _csTally(num) {
  return `<span class="cs-tally">${num}</span>`;
}

// ═══════════════════════════════════════════════════════════════════════════
// VP — Title Card
// ═══════════════════════════════════════════════════════════════════════════

export function rpBuildChefshankTitleCard(ep) {
  const cs = ep.chefshank;
  if (!cs) return '';
  const tribeNames = Object.keys(cs.tribeScores || {});
  const host = seasonConfig.host || 'Chris';

  const quotes = [
    `"Welcome to the toughest challenge in Total Drama history. Today, you eat what they cook — and you dig for your freedom."`,
    `"Two phases. Phase 1: Prison Food — cook the slop, force the enemy to eat it. Phase 2: Prison Break — four obstacles and a tunnel. First tribe out wins."`,
    `"You're all inmates now. Cook. Eat. Dig. Or don't — and face tribal council."`,
  ];
  const quote = quotes[(ep.num || 0) % quotes.length];

  return _csShell(`
    <div style="text-align:center;padding:50px 20px 80px;position:relative;z-index:6;">
      <div style="font-family:'Inter',sans-serif;font-size:11px;letter-spacing:4px;color:rgba(255,255,255,0.4);text-transform:uppercase;margin-bottom:12px;">${host} Presents</div>

      <div style="font-family:'Black Ops One',cursive;font-size:38px;color:var(--cs-chain);text-shadow:3px 3px 0 rgba(0,0,0,0.6);letter-spacing:4px;line-height:1.1;margin-bottom:6px;">THE CHEFSHANK<br>REDEMPTION</div>

      <div style="font-family:'Black Ops One',cursive;font-size:13px;letter-spacing:6px;color:var(--cs-rust);text-shadow:1px 1px 0 rgba(0,0,0,0.4);margin-bottom:20px;">COOK &middot; EAT &middot; DIG</div>

      <div style="display:inline-block;background:rgba(0,0,0,0.5);backdrop-filter:blur(8px);border:1px solid rgba(180,83,9,0.15);border-radius:8px;padding:14px 24px;margin-bottom:20px;">
        <div style="font-size:10px;letter-spacing:3px;color:rgba(255,255,255,0.35);text-transform:uppercase;margin-bottom:8px;">Warden's Briefing</div>
        <div style="font-size:13px;color:rgba(255,255,255,0.8);line-height:1.7;font-style:italic;max-width:500px">${host}: ${quote}</div>
      </div>

      <div style="display:flex;gap:16px;justify-content:center;margin-bottom:16px;flex-wrap:wrap">
        <div style="background:rgba(0,0,0,0.3);border:1px solid rgba(180,83,9,0.1);border-radius:6px;padding:10px 16px;text-align:center">
          <div style="font-family:'Black Ops One',cursive;font-size:9px;letter-spacing:2px;color:var(--cs-rust)">PHASE 1</div>
          <div style="font-size:12px;color:rgba(255,255,255,0.7);margin-top:2px">Prison Food</div>
        </div>
        <div style="background:rgba(0,0,0,0.3);border:1px solid rgba(180,83,9,0.1);border-radius:6px;padding:10px 16px;text-align:center">
          <div style="font-family:'Black Ops One',cursive;font-size:9px;letter-spacing:2px;color:var(--cs-rust)">PHASE 2</div>
          <div style="font-size:12px;color:rgba(255,255,255,0.7);margin-top:2px">Prison Break</div>
        </div>
      </div>

      <div style="display:flex;gap:20px;justify-content:center;font-size:11px;color:rgba(255,255,255,0.4);flex-wrap:wrap;">
        ${tribeNames.map(t => `<span>&#128681; ${t}</span>`).join('')}
        <span>&#9939; 2 Phases</span>
        ${cs.goldenShovel ? `<span>&#11088; Golden Shovel</span>` : ''}
      </div>
    </div>
  `, ep);
}

// ═══════════════════════════════════════════════════════════════════════════
// VP — Prison Food (eating duel)
// ═══════════════════════════════════════════════════════════════════════════

export function rpBuildChefshankPrisonFood(ep) {
  const cs = ep.chefshank;
  if (!cs?.prisonFood) return '';
  const pf = cs.prisonFood;

  if (!window._tvState) window._tvState = {};
  if (!window._tvState['cs-food']) window._tvState['cs-food'] = { idx: -1 };
  const revIdx = window._tvState['cs-food'].idx;

  const tribeNames = Object.keys(cs.tribeScores || {});
  const duelRounds = pf.duel?.rounds || [];

  // Steps: [victim draft per tribe] + [cooking per tribe] + [eating rounds]
  let feed = '';
  let stepIdx = 0;

  // Step 0: Victim Draft — who each tribe picked to eat and why
  let draftHtml = `<div class="cs-ev round-header"><div style="flex:1;text-align:center"><div style="font-family:'Black Ops One',sans-serif;font-size:16px;color:var(--cs-rust);letter-spacing:3px">VICTIM SELECTION</div><div style="font-size:10px;color:rgba(255,255,255,0.4);margin-top:2px">Each tribe picks an enemy to eat their cooking</div></div></div>`;
  for (const tName of tribeNames) {
    const victim = pf.victims?.[tName];
    if (!victim) continue;
    const vSt = pStats(victim);
    const targetTribeName = tribeNames[(tribeNames.indexOf(tName) + 1) % tribeNames.length] || '?';
    const weakStomach = vSt.endurance <= 4;
    const nervous = vSt.boldness <= 4;
    const reason = weakStomach && nervous ? `Known for a weak stomach AND shaky nerves — easy target.`
      : weakStomach ? `Not exactly known for keeping things down under pressure.`
      : nervous ? `Looks tough, but nerves might get the best of ${pronouns(victim).obj}.`
      : `A gamble — no obvious weakness, but ${tName} likes their odds.`;
    draftHtml += `<div class="cs-ev">
      ${_csSmallPortrait(victim, 44)}
      <div style="flex:1;min-width:0">
        <div class="cs-ev-badge orange">${tName} → ${targetTribeName}</div>
        <div class="cs-ev-text"><strong>${victim}</strong> from <strong>${targetTribeName}</strong> will eat ${tName}'s cooking. ${reason}</div>
      </div>
      ${_csStamp('CHOSEN', 'rust')}
    </div>`;
  }
  feed += `<div id="cs-step-food-${stepIdx}" style="${stepIdx <= revIdx ? '' : 'display:none'}">${draftHtml}</div>`;
  stepIdx++;

  // Step 1: Cooking Phase — what each tribe cooked + events
  for (const tName of tribeNames) {
    const cooking = pf.cooking?.[tName];
    if (!cooking) continue;
    let cookHtml = `<div class="cs-ev round-header"><div style="flex:1;text-align:center"><div class="cs-ev-badge gold">${tName}'s KITCHEN</div><div style="font-size:10px;color:rgba(255,255,255,0.4);margin-top:2px">Disgust Score: ${cooking.disgustScore?.toFixed(2) || '?'}</div></div></div>`;
    for (const evt of (cooking.events || [])) {
      const evtClass = evt.type === 'sabotageIngredient' ? 'negative' : evt.type === 'accidentalImprovement' ? 'positive' : '';
      cookHtml += `<div class="cs-ev ${evtClass}">
        ${evt.actor ? _csSmallPortrait(evt.actor, 36) : ''}
        <div style="flex:1;min-width:0">
          <div class="cs-ev-badge ${evt.type === 'sabotageIngredient' ? 'red' : evt.type === 'accidentalImprovement' ? 'green' : 'orange'}">${(evt.type || '').replace(/([A-Z])/g, ' $1').toUpperCase().trim()}</div>
          <div class="cs-ev-text">${evt.text || ''}</div>
        </div>
      </div>`;
    }
    feed += `<div id="cs-step-food-${stepIdx}" style="${stepIdx <= revIdx ? '' : 'display:none'}">${cookHtml}</div>`;
    stepIdx++;
  }

  // Steps 2+: Eating rounds
  for (let i = 0; i < duelRounds.length; i++) {
    const rd = duelRounds[i];
    let roundHtml = `<div class="cs-ev round-header"><div style="flex:1;text-align:center"><div style="font-family:'Black Ops One',sans-serif;font-size:16px;color:var(--cs-rust);letter-spacing:3px">ROUND ${rd.round}</div></div></div>`;

    // Bite status for each victim this round
    for (const bite of (rd.biteResults || [])) {
      const statusColor = bite.survived ? '#86efac' : '#fca5a5';
      const statusText = bite.survived ? `takes a bite and holds it down. (margin: ${bite.margin})` : `can't keep it down!`;
      roundHtml += `<div class="cs-ev ${bite.survived ? '' : 'vomit'}" style="border-left-color:${bite.survived ? 'var(--cs-mold)' : 'var(--cs-blood)'}">
        ${_csSmallPortrait(bite.victim, 36)}
        <div style="flex:1;min-width:0">
          <div class="cs-ev-badge ${bite.survived ? 'green' : 'red'}">${bite.tribe} — ${bite.victim}</div>
          <div class="cs-ev-text"><strong>${bite.victim}</strong> ${statusText}</div>
        </div>
      </div>`;
    }

    // Events within this round
    for (const evt of (rd.events || [])) {
      const evtColor = evt.resistDelta > 0 ? '#2d6a4f' : evt.resistDelta < 0 ? '#991b1b' : '#4b5563';
      const evtIcon = evt.resistDelta > 0 ? '💪' : evt.resistDelta < 0 ? '🤢' : '😐';
      roundHtml += `<div style="background:${evtColor}22;border:1px solid ${evtColor}44;border-left:4px solid ${evtColor};border-radius:4px;padding:8px 12px;margin:4px 0;display:flex;align-items:flex-start;gap:8px">
        <span style="font-size:16px;flex-shrink:0">${evtIcon}</span>
        ${_csSmallPortrait(evt.victim, 32)}
        <div style="flex:1;min-width:0">
          <div class="cs-ev-badge ${evt.resistDelta > 0 ? 'green' : evt.resistDelta < 0 ? 'red' : 'gray'}">${(evt.type || '').replace(/([A-Z])/g, ' $1').toUpperCase().trim()}</div>
          <div class="cs-ev-text" style="font-size:12px">${evt.text || ''}</div>
          ${evt.resistDelta ? `<div style="font-size:10px;color:${evt.resistDelta > 0 ? '#86efac' : '#fca5a5'};margin-top:2px">Resistance ${evt.resistDelta > 0 ? '+' : ''}${evt.resistDelta.toFixed(2)}</div>` : ''}
        </div>
      </div>`;
    }

    // Vomit stamps
    const vomitList = Array.isArray(rd.vomited) ? rd.vomited : rd.vomited ? [rd.vomited] : [];
    for (const v of vomitList) {
      roundHtml += `<div class="cs-ev vomit">
        ${_csSmallPortrait(v, 44)}
        <div style="flex:1;text-align:center">
          ${_csStamp('ELIMINATED', 'green')}
          <div class="cs-ev-text" style="margin-top:8px"><strong>${v}</strong> loses it. Out of the eating duel.</div>
        </div>
      </div>`;
    }

    feed += `<div id="cs-step-food-${stepIdx}" style="${stepIdx <= revIdx ? '' : 'display:none'}">${roundHtml}</div>`;
    stepIdx++;
  }

  const totalSteps = stepIdx;

  // Sidebar — only show revealed info
  const sidebar = _csBuildFoodSidebar(pf, revIdx, tribeNames, totalSteps);

  // HUD — minimal, no spoilers
  const revealedEnough = revIdx >= 1; // after draft
  const hudCells = tribeNames.map(t => {
    const victim = revIdx >= 0 ? (pf.victims?.[t] || '?') : '?';
    return `<div class="cs-hud-cell">
      <div class="cs-hud-val">${_csTally(victim === '?' ? '?' : victim.split(' ')[0])}</div>
      <div class="cs-hud-lbl">${t}</div>
    </div>`;
  }).join('');

  const pending = revIdx < totalSteps - 1;
  const controls = `<div id="cs-controls-food" class="cs-controls" ${!pending && totalSteps ? 'style="display:none"' : ''}>
    <button class="cs-btn-next" onclick="chefshankRevealNext('cs-food',${totalSteps})">NEXT</button>
    <button class="cs-btn-all" onclick="chefshankRevealAll('cs-food',${totalSteps})">Reveal All</button>
  </div>
  <div id="cs-done-food" style="${pending || !totalSteps ? 'display:none' : 'text-align:center;padding:12px 0'}">
    ${_csStamp(pf.duel?.winner ? pf.duel.winner + ' WINS PHASE 1 — GOLDEN SHOVEL EARNED' : 'PHASE COMPLETE', 'gold')}
  </div>`;

  return _csShell(`
    <div class="cs-hud">${hudCells}</div>
    <div class="cs-layout">
      <div class="cs-feed">${feed}${controls}</div>
      <div class="cs-sidebar" id="cs-sidebar-food">${sidebar}</div>
    </div>
  `, ep);
}

function _csBuildFoodSidebar(pf, revIdx, tribeNames, totalSteps) {
  // Steps layout: [0: draft] [1..N: cooking per tribe] [N+1..: eating rounds]
  const numTribes = tribeNames.length;
  const draftRevealed = revIdx >= 0;
  const cookingStartIdx = 1;
  const eatingStartIdx = cookingStartIdx + numTribes;
  const duelRounds = pf.duel?.rounds || [];

  let sidebar = '';

  // Victims — only after draft revealed
  if (draftRevealed) {
    sidebar += `<div class="cs-side-sec">&#127860; VICTIMS</div>`;
    for (const tName of tribeNames) {
      const victim = pf.victims?.[tName];
      if (!victim) continue;
      const cookingRevealed = revIdx >= cookingStartIdx + tribeNames.indexOf(tName);
      const eatingRevealed = revIdx >= eatingStartIdx;
      const revealedEatingRounds = eatingRevealed ? duelRounds.slice(0, revIdx - eatingStartIdx + 1) : [];
      const vomitHappened = revealedEatingRounds.some(r => r.vomited === victim);
      sidebar += `<div style="display:flex;align-items:center;gap:6px;padding:4px 0;font-size:11px;color:rgba(255,255,255,0.8)">
        ${_csSideMugshot(victim, 28, vomitHappened ? 'vomited' : '')}
        <div style="flex:1;min-width:0">
          <div style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${victim}</div>
          <div style="font-size:8px;color:rgba(255,255,255,0.4)">Eating for ${tName}</div>
        </div>
        ${vomitHappened ? `<span style="font-size:8px;color:#4ade80">VOMITED</span>` : eatingRevealed ? `<span style="font-size:8px;color:rgba(255,255,255,0.3)">holding...</span>` : ''}
      </div>`;
    }
  } else {
    sidebar += `<div class="cs-side-sec">&#127860; VICTIMS</div>`;
    sidebar += `<div style="font-size:10px;color:rgba(255,255,255,0.3);font-style:italic;padding:4px 0">Awaiting selection...</div>`;
  }

  // Cooking intel — only after cooking steps revealed
  for (let ti = 0; ti < tribeNames.length; ti++) {
    const tName = tribeNames[ti];
    if (revIdx < cookingStartIdx + ti) continue;
    const cooking = pf.cooking?.[tName];
    if (!cooking) continue;
    sidebar += `<div class="cs-side-sec">&#127859; ${tName.toUpperCase()}'S KITCHEN</div>`;
    sidebar += `<div style="font-size:9px;color:rgba(255,255,255,0.5);margin-bottom:4px">Disgust: ${cooking.disgustScore?.toFixed(2)}</div>`;
    for (const evt of (cooking.events || [])) {
      const icon = evt.type === 'sabotageIngredient' ? '☠️' : evt.type === 'accidentalImprovement' ? '🧂' : evt.type === 'foreignObject' ? '🦷' : '🤫';
      sidebar += `<div style="font-size:9px;color:rgba(255,255,255,0.4);padding-left:4px;margin-bottom:2px">${icon} ${evt.actor || '?'}</div>`;
    }
  }

  // Round log — only revealed eating rounds
  if (revIdx >= eatingStartIdx) {
    sidebar += `<div class="cs-side-sec">&#128203; ROUND LOG</div>`;
    const revealedEatingRounds = duelRounds.slice(0, revIdx - eatingStartIdx + 1);
    for (const rd of revealedEatingRounds) {
      const evtCount = (rd.events || []).length;
      sidebar += `<div style="font-size:10px;color:rgba(255,255,255,0.5);margin-bottom:2px">R${rd.round}: ${evtCount} events${rd.vomited ? ` — ${rd.vomited} VOMITED` : ''}</div>`;
    }
  }

  return sidebar;
}

// ═══════════════════════════════════════════════════════════════════════════
// VP — Prison Break (obstacles + dig)
// ═══════════════════════════════════════════════════════════════════════════

export function rpBuildChefshankPrisonBreak(ep) {
  const cs = ep.chefshank;
  if (!cs?.prisonBreak) return '';
  const pb = cs.prisonBreak;

  if (!window._tvState) window._tvState = {};
  if (!window._tvState['cs-break']) window._tvState['cs-break'] = { idx: -1 };
  const revIdx = window._tvState['cs-break'].idx;

  const tribes = pb.tribes || [];
  const tribeNames = tribes.map(t => t.tribe);

  // Build steps: first obstacles (interleaved per tribe), then dig rounds
  const steps = [];

  // Obstacles: 4 obstacles, interleaved across tribes
  const obstacleNames = ['mudPit', 'barbedWire', 'guardTower', 'wallClimb'];
  const obstacleLabels = { mudPit: 'Mud Pit', barbedWire: 'Barbed Wire', guardTower: 'Guard Tower', wallClimb: 'Wall Climb' };
  for (let oi = 0; oi < obstacleNames.length; oi++) {
    for (const td of tribes) {
      const obs = (td.obstacles || [])[oi];
      if (obs) steps.push({ type: 'obstacle', tribe: td.tribe, pusher: td.pusher, obstacle: obstacleLabels[obs.name] || obs.name, passed: obs.passed });
    }
  }

  // Dig rounds: interleaved by tribe
  const maxDigRounds = Math.max(...tribes.map(t => t.digRounds || 0));
  for (let di = 0; di < maxDigRounds; di++) {
    for (const td of tribes) {
      if (di < (td.digRounds || 0)) {
        const dist = (td.roundDistances || [])[di];
        steps.push({ type: 'dig', tribe: td.tribe, round: di + 1, distance: dist, totalSoFar: (td.roundDistances || []).slice(0, di + 1).reduce((s, v) => s + v, 0) });
      }
    }
  }

  const totalSteps = steps.length;

  // Feed
  let feed = '';
  for (let i = 0; i < totalSteps; i++) {
    const s = steps[i];
    const visible = i <= revIdx;

    if (s.type === 'obstacle') {
      const evClass = s.passed ? 'positive obstacle' : 'negative obstacle';
      feed += `<div id="cs-step-break-${i}" class="cs-ev ${evClass}" style="${visible ? '' : 'display:none'}">
        ${_csSmallPortrait(s.pusher, 44)}
        <div style="flex:1;min-width:0">
          <div class="cs-ev-badge ${s.passed ? 'green' : 'red'}">${s.tribe} &mdash; ${s.obstacle}</div>
          <div class="cs-ev-text"><strong>${s.pusher}</strong> ${s.passed ? 'clears' : 'fails'} the ${s.obstacle.toLowerCase()}.</div>
          <div style="margin-top:4px">${s.passed ? _csStamp('CLEAR', 'green') : _csStamp('PENALTY', 'red')}</div>
        </div>
      </div>`;
    } else {
      feed += `<div id="cs-step-break-${i}" class="cs-ev tunnel" style="${visible ? '' : 'display:none'}">
        <div style="flex:1;min-width:0">
          <div class="cs-ev-badge gold">${s.tribe} &mdash; DIG ROUND ${s.round}</div>
          <div class="cs-ev-text">Distance this round: <strong>${(s.distance || 0).toFixed(3)}</strong> &mdash; Total: ${(s.totalSoFar || 0).toFixed(3)}</div>
          <div class="cs-dig-bar" style="margin-top:6px"><div class="cs-dig-fill" style="width:${Math.min(100, ((s.totalSoFar || 0) / Math.max(...tribes.map(t => t.totalDistance || 1))) * 100)}%"></div></div>
        </div>
      </div>`;
    }
  }

  // Sidebar
  const sidebar = _csBuildBreakSidebar(pb, revIdx, steps);

  // HUD
  const hudCells = tribes.map(td => {
    const cleared = (td.obstacles || []).filter(o => o.passed).length;
    return `<div class="cs-hud-cell">
      <div class="cs-hud-val">${_csTally(td.totalDistance?.toFixed(1) || '0')}</div>
      <div class="cs-hud-lbl">${td.tribe}</div>
      <div style="font-size:9px;color:rgba(255,255,255,0.4);margin-top:2px">${cleared}/4 obs &middot; ${td.digRounds || 0}R</div>
    </div>`;
  }).join('');
  const shovelCell = `<div class="cs-hud-cell">
    <div class="cs-hud-val" style="font-size:14px">&#9935;</div>
    <div class="cs-hud-lbl">GOLDEN SHOVEL</div>
    <div style="font-size:9px;color:var(--cs-rust);margin-top:2px">${pb.shovelTeam || 'None'}</div>
  </div>`;

  const pending = revIdx < totalSteps - 1;
  const controls = `<div id="cs-controls-break" class="cs-controls" ${!pending && totalSteps ? 'style="display:none"' : ''}>
    <button class="cs-btn-next" onclick="chefshankRevealNext('cs-break',${totalSteps})">NEXT STEP</button>
    <button class="cs-btn-all" onclick="chefshankRevealAll('cs-break',${totalSteps})">Reveal All</button>
  </div>
  <div id="cs-done-break" style="${pending || !totalSteps ? 'display:none' : 'text-align:center;padding:12px 0'}">
    ${_csStamp(pb.winner ? pb.winner + ' BREAKS FREE' : 'PHASE COMPLETE', 'gold')}
  </div>`;

  return _csShell(`
    <div class="cs-hud">${hudCells}${shovelCell}</div>
    <div class="cs-layout">
      <div class="cs-feed">${feed}${controls}</div>
      <div class="cs-sidebar" id="cs-sidebar-break">${sidebar}</div>
    </div>
  `, ep);
}

function _csBuildBreakSidebar(pb, revIdx, steps) {
  const tribes = pb.tribes || [];
  const revealedSteps = steps ? steps.slice(0, revIdx + 1) : [];
  let sidebar = '';

  for (const td of tribes) {
    const isShovel = pb.shovelTeam === td.tribe;
    sidebar += `<div class="cs-side-sec">${td.tribe}${isShovel ? ' &#9935;' : ''}</div>`;

    // Pusher
    sidebar += `<div style="display:flex;align-items:center;gap:6px;padding:3px 0;margin-bottom:6px">
      ${_csSideMugshot(td.pusher, 28)}
      <div style="flex:1;min-width:0">
        <div style="font-size:10px;color:rgba(255,255,255,0.8)">${td.pusher}</div>
        <div style="font-size:8px;color:var(--cs-rust);letter-spacing:1px">PUSHER</div>
      </div>
    </div>`;

    // Obstacle icons
    const revealedObstacles = revealedSteps.filter(s => s.type === 'obstacle' && s.tribe === td.tribe);
    sidebar += `<div style="display:flex;gap:4px;margin-bottom:6px">`;
    for (let oi = 0; oi < 4; oi++) {
      const revObs = revealedObstacles[oi];
      const icon = revObs == null ? '&#10067;' : revObs.passed ? '&#9989;' : '&#10060;';
      sidebar += `<span style="font-size:14px">${icon}</span>`;
    }
    sidebar += `</div>`;

    // Dig progress
    const revealedDigs = revealedSteps.filter(s => s.type === 'dig' && s.tribe === td.tribe);
    const revealedDist = revealedDigs.length > 0 ? revealedDigs[revealedDigs.length - 1].totalSoFar || 0 : 0;
    const maxDist = Math.max(...tribes.map(t => t.totalDistance || 1));
    const pct = Math.min(100, (revealedDist / maxDist) * 100);

    sidebar += `<div style="font-size:9px;color:rgba(255,255,255,0.4);margin-bottom:2px">Dig: ${revealedDist.toFixed(2)} / ${(td.totalDistance || 0).toFixed(2)}</div>`;
    sidebar += `<div class="cs-dig-bar"><div class="cs-dig-fill" style="width:${pct}%"></div></div>`;
    sidebar += `<div style="font-size:8px;color:rgba(255,255,255,0.3);margin-top:2px">${revealedDigs.length}/${td.digRounds || 0} rounds dug</div>`;
  }

  return sidebar;
}

// ═══════════════════════════════════════════════════════════════════════════
// VP — Drama Break (Yard Time)
// ═══════════════════════════════════════════════════════════════════════════

export function rpBuildChefshankDramaBreak(ep) {
  const cs = ep.chefshank;
  if (!cs) return '';
  const events = cs.breakEvents;
  if (!events?.length) return '';

  let feed = '';
  for (const evt of events) {
    const firstPlayer = (evt.players || [])[0];
    feed += `<div class="cs-ev ${evt.badgeClass || ''}">
      ${firstPlayer ? _csSmallPortrait(firstPlayer, 44) : ''}
      <div style="flex:1;min-width:0">
        <div class="cs-ev-badge ${evt.badgeClass || 'gray'}">${evt.badge || 'YARD TIME'}</div>
        <div class="cs-ev-text">${evt.text || ''}</div>
        ${(evt.players || []).length > 1 ? `<div style="display:flex;gap:4px;margin-top:6px;flex-wrap:wrap">${evt.players.slice(1).map(n => {
          const s = players.find(p => p.name === n)?.slug || n.toLowerCase().replace(/\s+/g, '-');
          return `<img src="assets/avatars/${s}.png" width="24" height="24" style="border-radius:2px;border:1px solid var(--cs-bar);filter:contrast(1.05) brightness(0.95)" title="${n}" onerror="this.style.display='none'">`;
        }).join('')}</div>` : ''}
      </div>
    </div>`;
  }

  return _csShell(`
    <div style="padding:12px 14px;position:relative;z-index:6">
      <div style="text-align:center;font-family:'Black Ops One',cursive;font-size:13px;color:var(--cs-rust);letter-spacing:4px;margin-bottom:12px">YARD TIME</div>
      ${feed}
    </div>
  `, ep);
}

// ═══════════════════════════════════════════════════════════════════════════
// VP — Results (The Verdict)
// ═══════════════════════════════════════════════════════════════════════════

export function rpBuildChefshankResults(ep) {
  const cs = ep.chefshank;
  if (!cs) return '';

  const tribeScores = cs.tribeScores || {};
  const sorted = Object.entries(tribeScores).sort((a, b) => b[1] - a[1]);
  const winnerTribe = sorted[0]?.[0] || '???';
  const tribeNames = Object.keys(tribeScores);

  // Phase scoreboard
  const phaseData = [
    { label: 'PRISON FOOD', winner: cs.prisonFood?.duel?.winner },
    { label: 'PRISON BREAK', winner: cs.prisonBreak?.winner },
  ];

  let chalkRows = phaseData.map(ph => {
    const cells = tribeNames.map(t => {
      const isWinner = ph.winner === t;
      return `<td style="padding:6px 12px;text-align:center">${_csTally(isWinner ? 'W' : 'L')}</td>`;
    }).join('');
    return `<tr><td style="padding:6px 12px;text-align:left;font-family:'Black Ops One',cursive;font-size:9px;letter-spacing:2px;color:var(--cs-rust)">${ph.label}</td>${cells}</tr>`;
  }).join('');

  const headerCells = tribeNames.map(t =>
    `<th style="padding:6px 12px;text-align:center;font-family:'Black Ops One',cursive;font-size:9px;letter-spacing:2px;color:var(--cs-chain)">${t}</th>`
  ).join('');

  const totalCells = tribeNames.map(t =>
    `<td style="padding:8px 12px;text-align:center;border-top:2px solid rgba(180,83,9,0.3)">${_csTally(tribeScores[t])}</td>`
  ).join('');

  const scoreboard = `<div style="background:linear-gradient(135deg,rgba(15,23,42,0.9),rgba(30,41,59,0.8));border:2px solid var(--cs-bar);border-radius:4px;padding:12px;margin:12px 14px;box-shadow:inset 0 0 20px rgba(0,0,0,0.4)">
    <table style="width:100%;border-collapse:collapse;color:var(--cs-chain)">
      <thead><tr><th></th>${headerCells}</tr></thead>
      <tbody>${chalkRows}
        <tr><td style="padding:8px 12px;font-family:'Black Ops One',cursive;font-size:9px;letter-spacing:2px;color:var(--cs-chain);border-top:2px solid rgba(180,83,9,0.3)">TOTAL</td>${totalCells}</tr>
      </tbody>
    </table>
  </div>`;

  // Dig distance comparison
  let digCompare = '';
  if (cs.prisonBreak?.tribes) {
    digCompare = `<div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;padding:0 14px 12px">`;
    for (const td of cs.prisonBreak.tribes) {
      const pct = Math.min(100, (td.totalDistance / Math.max(...cs.prisonBreak.tribes.map(t => t.totalDistance || 1))) * 100);
      const isWinner = cs.prisonBreak.winner === td.tribe;
      digCompare += `<div style="flex:1;min-width:120px;max-width:250px;background:rgba(0,0,0,0.3);border:1px solid ${isWinner ? 'rgba(180,83,9,0.3)' : 'rgba(107,114,128,0.15)'};border-radius:6px;padding:10px;text-align:center">
        <div style="font-family:'Black Ops One',cursive;font-size:10px;color:${isWinner ? 'var(--cs-rust)' : 'rgba(255,255,255,0.4)'};letter-spacing:2px;margin-bottom:4px">${td.tribe}</div>
        <div style="font-size:20px;font-weight:900;color:${isWinner ? 'var(--cs-chain)' : 'rgba(255,255,255,0.5)'}">${td.totalDistance.toFixed(2)}</div>
        <div class="cs-dig-bar" style="margin-top:6px"><div class="cs-dig-fill" style="width:${pct}%"></div></div>
        <div style="font-size:9px;color:rgba(255,255,255,0.35);margin-top:4px">${(td.obstacles || []).filter(o => o.passed).length}/4 obstacles &middot; ${td.digRounds}R</div>
      </div>`;
    }
    digCompare += `</div>`;
  }

  // Standout mugshots
  let standouts = '<div style="display:flex;gap:14px;justify-content:center;flex-wrap:wrap;padding:8px 14px">';
  // Golden shovel
  if (cs.goldenShovel) {
    standouts += `<div style="text-align:center"><div style="font-size:9px;color:var(--cs-rust);letter-spacing:2px;font-family:'Black Ops One',cursive;margin-bottom:4px">GOLDEN SHOVEL</div>${_csStamp(cs.goldenShovel, 'gold')}</div>`;
  }
  // Phase 1 survivor
  if (cs.prisonFood?.duel?.winner) {
    const winTribe = cs.prisonFood.duel.winner;
    const survivor = cs.prisonFood.victims?.[winTribe];
    if (survivor) {
      standouts += `<div style="text-align:center">${_csMugshot(survivor, 56)}<div style="margin-top:4px">${_csStamp('SURVIVED', 'green')}</div></div>`;
    }
  }
  // Phase 1 casualty
  if (cs.prisonFood?.duel?.loser) {
    const loseTribe = cs.prisonFood.duel.loser;
    const casualty = cs.prisonFood.victims?.[loseTribe];
    if (casualty) {
      standouts += `<div style="text-align:center">${_csMugshot(casualty, 56)}<div style="margin-top:4px">${_csStamp('SOLITARY', 'red')}</div></div>`;
    }
  }
  standouts += '</div>';

  // Winner banner
  const winnerBanner = `<div style="text-align:center;padding:20px 0;position:relative;z-index:6">
    <div style="font-family:'Black Ops One',cursive;font-size:30px;color:var(--cs-chain);letter-spacing:4px;text-shadow:0 0 20px rgba(168,162,158,0.3),3px 3px 0 rgba(0,0,0,0.6)">${winnerTribe}</div>
    <div style="font-family:'Black Ops One',cursive;font-size:11px;letter-spacing:6px;color:var(--cs-rust);margin-top:4px">BREAKS FREE</div>
    <div style="margin-top:10px">${_csStamp('IMMUNITY', 'gold')}</div>
  </div>`;

  // Player leaderboard
  const scores = Object.entries(ep.chalMemberScores || {}).sort((a, b) => b[1] - a[1]);
  let leaderboard = '<div style="padding:0 14px 16px">';
  leaderboard += '<div class="cs-side-sec" style="text-align:center">INMATE RECORD</div>';
  leaderboard += '<div style="display:flex;flex-wrap:wrap;gap:10px;justify-content:center">';
  for (const [name, score] of scores) {
    leaderboard += `<div style="text-align:center">${_csMugshot(name, 56)}<div style="margin-top:4px;font-size:10px;color:var(--cs-chain)">${_csTally(score)}</div></div>`;
  }
  leaderboard += '</div></div>';

  return _csShell(`
    ${winnerBanner}
    ${scoreboard}
    ${digCompare}
    ${standouts}
    ${leaderboard}
  `, ep);
}

// ═══════════════════════════════════════════════════════════════════════════
// VP — Reveal functions
// ═══════════════════════════════════════════════════════════════════════════

export function chefshankRevealNext(screenKey, totalSteps) {
  if (!window._tvState) window._tvState = {};
  if (!window._tvState[screenKey]) window._tvState[screenKey] = { idx: -1 };
  const state = window._tvState[screenKey];
  if (state.idx >= totalSteps - 1) return;
  state.idx++;
  const suffix = screenKey.replace('cs-', '');
  const el = document.getElementById(`cs-step-${suffix}-${state.idx}`);
  if (el) {
    el.style.display = '';
    // Also show child event cards for food rounds
    let sib = el.nextElementSibling;
    while (sib && sib.id && sib.id.startsWith(`cs-step-${suffix}-${state.idx}-`)) {
      sib.style.display = '';
      sib = sib.nextElementSibling;
    }
    // For food: also show non-indexed event/vomit cards in this round block
    if (suffix === 'food') {
      sib = el.nextElementSibling;
      while (sib && !sib.id?.match(/^cs-step-food-\d+$/)) {
        sib.style.display = '';
        sib = sib.nextElementSibling;
      }
    }
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  if (state.idx >= totalSteps - 1) {
    const controls = document.getElementById(`cs-controls-${suffix}`);
    const done = document.getElementById(`cs-done-${suffix}`);
    if (controls) controls.style.display = 'none';
    if (done) done.style.display = '';
  }
  _csUpdateSidebar(screenKey, state.idx);
}

export function chefshankRevealAll(screenKey, totalSteps) {
  if (!window._tvState) window._tvState = {};
  if (!window._tvState[screenKey]) window._tvState[screenKey] = { idx: -1 };
  const state = window._tvState[screenKey];
  const suffix = screenKey.replace('cs-', '');
  for (let i = state.idx + 1; i < totalSteps; i++) {
    const el = document.getElementById(`cs-step-${suffix}-${i}`);
    if (el) el.style.display = '';
  }
  // Show all hidden children too
  const feed = document.querySelector('.cs-feed');
  if (feed) {
    feed.querySelectorAll('[style*="display:none"], [style*="display: none"]').forEach(el => { el.style.display = ''; });
  }
  state.idx = totalSteps - 1;
  const controls = document.getElementById(`cs-controls-${suffix}`);
  const done = document.getElementById(`cs-done-${suffix}`);
  if (controls) controls.style.display = 'none';
  if (done) done.style.display = '';
  const last = document.getElementById(`cs-step-${suffix}-${totalSteps - 1}`);
  if (last) last.scrollIntoView({ behavior: 'smooth', block: 'center' });
  _csUpdateSidebar(screenKey, totalSteps - 1);
}

function _csUpdateSidebar(screenKey, revIdx) {
  const ep = gs.episodeHistory?.[gs.episodeHistory.length - 1];
  if (!ep?.chefshank) return;
  const cs = ep.chefshank;
  const tribeNames = Object.keys(cs.tribeScores || {});

  if (screenKey === 'cs-food' && cs.prisonFood) {
    const sideEl = document.getElementById('cs-sidebar-food');
    if (sideEl) sideEl.innerHTML = _csBuildFoodSidebar(cs.prisonFood, revIdx, tribeNames);
  }
  if (screenKey === 'cs-break' && cs.prisonBreak) {
    const sideEl = document.getElementById('cs-sidebar-break');
    // Rebuild steps for sidebar calculation
    const tribes = cs.prisonBreak.tribes || [];
    const steps = [];
    const obstacleNames = ['mudPit', 'barbedWire', 'guardTower', 'wallClimb'];
    for (let oi = 0; oi < obstacleNames.length; oi++) {
      for (const td of tribes) {
        const obs = (td.obstacles || [])[oi];
        if (obs) steps.push({ type: 'obstacle', tribe: td.tribe, pusher: td.pusher, passed: obs.passed });
      }
    }
    const maxDigRounds = Math.max(...tribes.map(t => t.digRounds || 0));
    for (let di = 0; di < maxDigRounds; di++) {
      for (const td of tribes) {
        if (di < (td.digRounds || 0)) {
          steps.push({ type: 'dig', tribe: td.tribe, round: di + 1, distance: (td.roundDistances || [])[di], totalSoFar: (td.roundDistances || []).slice(0, di + 1).reduce((s, v) => s + v, 0) });
        }
      }
    }
    if (sideEl) sideEl.innerHTML = _csBuildBreakSidebar(cs.prisonBreak, revIdx, steps);
  }
}
