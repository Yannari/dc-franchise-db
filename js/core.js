// ══════════════════════════════════════════════════════════════════════
// core.js — Constants, state, and serialization (extracted from simulator.html)
// ══════════════════════════════════════════════════════════════════════

export const STATS = [
  { key: 'physical',  label: 'PHY', name: 'Physical',  color: '#f97316', desc: 'Strength & speed challenges' },
  { key: 'endurance', label: 'END', name: 'Endurance', color: '#fb923c', desc: 'Balance & stamina challenges' },
  { key: 'mental',    label: 'MNT', name: 'Mental',    color: '#a78bfa', desc: 'Puzzle & memory challenges' },
  { key: 'social',    label: 'SOC', name: 'Social',    color: '#3b82f6', desc: 'Alliance formation, bonds, jury management' },
  { key: 'strategic', label: 'STR', name: 'Strategic', color: '#8b5cf6', desc: 'Game awareness, threat reads, vote decisions' },
  { key: 'loyalty',   label: 'LOY', name: 'Loyalty',   color: '#10b981', desc: 'Follows alliance votes, does not flip' },
  { key: 'boldness',    label: 'BLD', name: 'Boldness',    color: '#ef4444', desc: 'Big moves, idol plays, deviating when it matters' },
  { key: 'intuition',  label: 'INT', name: 'Intuition',  color: '#ec4899', desc: 'Reads the room, finds idols, sees votes coming' },
  { key: 'temperament',label: 'TMP', name: 'Temperament',color: '#06b6d4', desc: '1 = explosive & volatile. 10 = unshakeable calm. Drives who snaps, bonds, or melts down at camp.' },
];

export const ARCHETYPES = {
  'mastermind':        { physical:5, endurance:5, mental:8, social:7, strategic:9, loyalty:5, boldness:6, intuition:8, temperament:6, desc:'Controls votes from the shadows. Composed. Gets cut at F4 when the mask slips.' },
  'schemer':           { physical:5, endurance:5, mental:7, social:5, strategic:9, loyalty:2, boldness:9, intuition:7, temperament:3, desc:'Ruthless and disloyal. Burns bridges strategically. Jury rarely forgives them.' },
  'hothead':           { physical:7, endurance:6, mental:5, social:4, strategic:5, loyalty:4, boldness:9, intuition:5, temperament:2, desc:'Explosive temper. Creates enemies unintentionally. Goes far on comp wins, not on trust.' },
  'challenge-beast':   { physical:9, endurance:8, mental:5, social:5, strategic:5, loyalty:7, boldness:5, intuition:5, temperament:5, desc:'Dominates challenges. Jury rarely respects the game.' },
  'social-butterfly':  { physical:4, endurance:5, mental:5, social:9, strategic:6, loyalty:6, boldness:5, intuition:6, temperament:8, desc:"Everyone's friend. Hard to vote out. Can lose for being too nice." },
  'loyal-soldier':     { physical:7, endurance:8, mental:5, social:6, strategic:4, loyalty:9, boldness:3, intuition:5, temperament:7, desc:'Never flips. Gets dragged to F3 and loses 8-0.' },
  'wildcard':          { physical:5, endurance:5, mental:4, social:4, strategic:4, loyalty:3, boldness:9, intuition:4, temperament:4, desc:'Genuinely unpredictable. Instinctive chaos. Nobody can game-plan around them.' },
  'chaos-agent':       { physical:6, endurance:5, mental:6, social:6, strategic:6, loyalty:3, boldness:8, intuition:6, temperament:3, desc:'Deliberately stirs the pot. Survives by making drama useful. Gets cut when the tribe is exhausted.' },
  'floater':           { physical:5, endurance:5, mental:6, social:6, strategic:5, loyalty:6, boldness:4, intuition:6, temperament:6, desc:'Stays off radar. Votes with the majority. Reaches F5 without anyone noticing.' },
  'underdog':          { physical:4, endurance:5, mental:5, social:6, strategic:5, loyalty:8, boldness:5, intuition:6, temperament:7, desc:'Starts weak. Crowd favorite. Jury loves a comeback story.' },
  'hero':              { physical:6, endurance:7, mental:5, social:7, strategic:5, loyalty:9, boldness:8, intuition:6, temperament:7, desc:'Principled leader. Stands up for the weak. Plays with a moral code that sometimes costs them the game. Jury magnet.' },
  'villain':           { physical:7, endurance:5, mental:6, social:6, strategic:8, loyalty:2, boldness:9, intuition:7, temperament:4, desc:'Open aggression. Intimidation. Celebrates when enemies fall. Feared and targeted — but fiercely loyal to their inner circle.' },
  'goat':              { physical:4, endurance:4, mental:4, social:4, strategic:3, loyalty:6, boldness:3, intuition:4, temperament:6, desc:'Non-threatening. Gets dragged to the end. Loses FTC in a landslide.' },
  'perceptive-player': { physical:5, endurance:5, mental:7, social:8, strategic:6, loyalty:7, boldness:4, intuition:9, temperament:7, desc:'Reads deception. Detects betrayal early. Gets targeted for knowing too much.' },
  'showmancer':        { physical:5, endurance:5, mental:5, social:9, strategic:5, loyalty:8, boldness:6, intuition:6, temperament:8, desc:'Builds the game around one person. Magnetic, warm, dangerously easy to underestimate. Gets to the end on love — or goes home because of it.' },
};
export const ARCHETYPE_NAMES = {
  'mastermind': 'Mastermind', 'schemer': 'Schemer', 'hothead': 'Hothead',
  'challenge-beast': 'Challenge Beast', 'social-butterfly': 'Social Butterfly',
  'loyal-soldier': 'Loyal Soldier', 'hero': 'Hero', 'villain': 'Villain',
  'wildcard': 'Wildcard', 'chaos-agent': 'Chaos Agent',
  'floater': 'Floater', 'underdog': 'Underdog', 'goat': 'Goat', 'perceptive-player': 'Perceptive Player',
  'showmancer': 'Showmancer',
};
export const THREAT_TIERS = [
  { max: 3.0, label: 'Low', color: '#10b981' },
  { max: 5.0, label: 'Medium', color: '#f59e0b' },
  { max: 7.0, label: 'High', color: '#f97316' },
  { max: 10,  label: 'Extreme', color: '#ef4444' },
];
export const REL_TYPES = {
  hatred:      { label: 'Pure Hatred',     color: '#7f1d1d', bond:-10, bg: 'rgba(127,29,29,0.15)' },
  nemesis:     { label: 'Nemesis',         color: '#dc2626', bond: -8, bg: 'rgba(220,38,38,0.12)' },
  enemy:       { label: 'Enemy',           color: '#ef4444', bond: -5, bg: 'rgba(239,68,68,0.12)' },
  rival:       { label: 'Rival',           color: '#f97316', bond: -3, bg: 'rgba(249,115,22,0.12)' },
  cold:        { label: 'Cold',            color: '#a1a1aa', bond: -1, bg: 'rgba(161,161,170,0.12)' },
  neutral:     { label: 'Neutral',         color: '#94a3b8', bond:  0, bg: 'rgba(148,163,184,0.12)' },
  acquaintance:{ label: 'Acquaintance',    color: '#60a5fa', bond:  1, bg: 'rgba(96,165,250,0.12)' },
  ally:        { label: 'Ally',            color: '#3b82f6', bond:  3, bg: 'rgba(59,130,246,0.12)' },
  friend:      { label: 'Friend',          color: '#6366f1', bond:  5, bg: 'rgba(99,102,241,0.12)' },
  rideordie:   { label: 'Ride or Die',     color: '#22c55e', bond:  8, bg: 'rgba(34,197,94,0.12)' },
  unbreakable: { label: 'Unbreakable \u2605', color: '#10b981', bond: 10, bg: 'rgba(16,185,129,0.12)' },
};
export const ADVANTAGES = [
  { key: 'idol',      label: 'Hidden Immunity Idol', default: 2, defaultSources: ['camp'] },
  { key: 'beware',    label: 'Beware Advantage',     default: 0, defaultSources: ['camp'] },
  { key: 'voteSteal', label: 'Vote Steal',           default: 1, defaultSources: ['camp','journey','auction','exile'] },
  { key: 'extraVote', label: 'Extra Vote',            default: 1, defaultSources: ['camp','journey','auction','exile'] },
  { key: 'kip',       label: 'Knowledge is Power',   default: 0, defaultSources: ['camp'] },
  { key: 'legacy',    label: 'Legacy Advantage',     default: 0, defaultSources: ['camp'] },
  { key: 'amulet',    label: 'Amulet Advantage',     default: 0, defaultSources: [] },
  { key: 'secondLife', label: 'Second Life Amulet',  default: 0, defaultSources: ['camp','auction','exile'] },
  { key: 'teamSwap',   label: 'Team Swap',            default: 0, defaultSources: ['camp'] },
  { key: 'voteBlock',  label: 'Vote Block',           default: 0, defaultSources: ['camp','journey','auction','exile'] },
  { key: 'safetyNoPower', label: 'Safety Without Power', default: 0, defaultSources: ['journey','auction','exile'] },
  { key: 'soleVote', label: 'Sole Vote', default: 0, defaultSources: ['journey','auction','exile'] },
];
export const ADV_SOURCE_LABELS = { camp: '🏕️ Camp', journey: '🗺️ Journey', auction: '💰 Auction', exile: '🏝️ Exile' };

export const TWIST_CATALOG = [
  // Team Dynamics
  { id:'tribe-swap',       emoji:'🔀', name:'Tribe Swap',           category:'team',       phase:'pre-merge',  desc:'All players redistributed between existing tribes.',                        engineType:'tribe-swap'      },
  { id:'tribe-dissolve',   emoji:'💥', name:'Tribe Dissolve',       category:'team',       phase:'pre-merge',  desc:'Tribes reduced by one — all players reshuffled into fewer tribes.',         engineType:'tribe-dissolve'  },
  { id:'tribe-expansion',  emoji:'📈', name:'Tribe Expansion',      category:'team',       phase:'pre-merge',  desc:'A new tribe is formed — all players reshuffled into N+1 groups.',           engineType:'tribe-expansion' },
  { id:'mutiny',           emoji:'⚔️', name:'Mutiny',               category:'team',       phase:'pre-merge',  desc:'Players may voluntarily switch tribes during a challenge.',                  engineType:'mutiny'          },
  { id:'schoolyard-pick',  emoji:'👆', name:'Schoolyard Pick',      category:'team',       phase:'pre-merge',  desc:'Two captains draft teams. Last picked = bottom of the pecking order. Odd count sends unpicked to exile.', engineType:'schoolyard-pick', incompatible:['no-tribal','elimination-swap'] },
  { id:'abduction',        emoji:'🫳', name:'Abduction',            category:'team',       phase:'pre-merge',  desc:'Each tribe steals one player from a competing tribe.',                      engineType:'abduction'       },
  { id:'kidnapping',       emoji:'🫳', name:'Kidnapping',           category:'team',       phase:'pre-merge',  desc:'Challenge winner tribe kidnaps one player from the losing tribe. That player skips tribal (safe) and bonds with their captors. Returns next episode.', engineType:'kidnapping' },
  { id:'first-impressions',emoji:'👀', name:'First Impressions',    category:'team',       phase:'pre-merge',  desc:'Each tribe votes someone out on first impressions alone. The "eliminated" players swap tribes instead.', engineType:'first-impressions' },
  // Immunity
  { id:'shared-immunity',  emoji:'🛡️', name:'Shared Immunity',      category:'immunity',   phase:'post-merge', desc:'Immunity winner picks one other player to share the necklace with.',        engineType:'shared-immunity', incompatible:['double-safety','hero-duel'] },
  { id:'double-safety',    emoji:'🛡️', name:'Double Safety',        category:'immunity',   phase:'post-merge', desc:'Two players win immunity — the challenge winner and the runner-up.',         engineType:'double-safety',  incompatible:['shared-immunity','hero-duel'] },
  { id:'hero-duel',        emoji:'⚔️', name:'Hero Duel',            category:'immunity',   phase:'any',        desc:'Pre-merge: best vs worst on losing tribe duel for safety. Post-merge: 2nd place vs last place duel for immunity.', engineType:'hero-duel', incompatible:['shared-immunity','double-safety'] },
  { id:'guardian-angel',   emoji:'😇', name:'Guardian Angel',       category:'immunity',   phase:'post-merge', desc:'Player with most jury support earns a safety advantage.',                   engineType:'guardian-angel'  },
  { id:'endurance-test',   emoji:'⚡', name:'Endurance Marathon',   category:'immunity',   phase:'any',        desc:'Forces this episode\'s immunity to be an endurance challenge.',             engineType:'force-challenge-endurance' },
  { id:'knowledge-test',   emoji:'🧠', name:'Knowledge Test',       category:'immunity',   phase:'any',        desc:'Forces this episode\'s immunity to be a puzzle/mental challenge.',           engineType:'force-challenge-puzzle' },
  { id:'puzzle-immunity',  emoji:'🧩', name:'Puzzle Gauntlet',      category:'immunity',   phase:'any',        desc:'Forces this episode\'s immunity to be a puzzle challenge.',                  engineType:'force-challenge-puzzle' },
  { id:'physical-test',    emoji:'💪', name:'Physical Showdown',    category:'immunity',   phase:'any',        desc:'Forces this episode\'s immunity to be a physical challenge.',                engineType:'force-challenge-physical' },
  { id:'social-challenge', emoji:'🗣️', name:'Social Challenge',     category:'immunity',   phase:'any',        desc:'Forces this episode\'s immunity to be a social challenge.',                  engineType:'force-challenge-social' },
  { id:'balance-test',     emoji:'⚖️', name:'Balance Challenge',    category:'immunity',   phase:'any',        desc:'Forces this episode\'s immunity to be a balance challenge.',                 engineType:'force-challenge-balance' },
  { id:'no-tribal',        emoji:'🚫', name:'No Tribal Council',    category:'immunity',   phase:'any',        desc:'No elimination this episode. A reward is still possible.',                  engineType:'no-tribal'       },
  // Elimination
  { id:'double-elim',      emoji:'💀', name:'Double Elimination',   category:'elim',       phase:'post-merge', desc:'Two players are voted out this episode.',                                   engineType:'double-elim'     },
  { id:'double-tribal',    emoji:'🏕️', name:'Double Tribal',        category:'elim',       phase:'pre-merge',  desc:'Challenge runs, winner is safe — losing tribes merge into one council and vote out one player. Requires 3+ tribes.',  engineType:'double-tribal', minTribes: 3 },
  { id:'multi-tribal',     emoji:'🏕️', name:'Multi-Tribal',         category:'elim',       phase:'pre-merge',  desc:'Challenge runs, winner is safe — all other tribes each vote someone out independently. Requires 3+ tribes.',  engineType:'multi-tribal', minTribes: 3 },
  { id:'double-boot',      emoji:'🥾', name:'Double Boot',          category:'elim',       phase:'any',        desc:'Two separate votes — one after the other — same episode.',                  engineType:'double-elim'     },
  { id:'fire-making',      emoji:'🔥', name:'Second Life',          category:'elim',       phase:'any',        desc:'The voted-out player gets a second chance — they pick any non-immune player to challenge in a random duel (fire, puzzle, endurance, balance, or precision). Loser is eliminated.',        engineType:'fire-making'     },
  { id:'penalty-vote',     emoji:'⚠️', name:'Penalty Vote',         category:'elim',       phase:'any',        desc:'A player receives a penalty vote against them at the next tribal.',         engineType:'penalty-vote'    },
  // Challenge Replacements
  { id:'sudden-death',     emoji:'💀', name:'Sudden Death',         category:'challenge',  phase:'post-merge', desc:'No tribal council. Last place in the challenge is auto-eliminated on the spot. Pure performance — no vote, no strategy, no safety net.',  engineType:'sudden-death',    incompatible:['slasher-night','triple-dog-dare','say-uncle','phobia-factor','cliff-dive','awake-a-thon','dodgebrawl','talent-show','sucky-outdoors','up-the-creek','paintball-hunt','hells-kitchen','trust-challenge','basic-straining','x-treme-torture','lucky-hunt'] },
  { id:'slasher-night',    emoji:'🔪', name:'Slasher Night',        category:'challenge',  phase:'post-merge', desc:'A slasher hunts the tribe. Players are picked off round by round. Last one standing wins immunity. Lowest scorer is eliminated. No tribal council.',  engineType:'slasher-night',   incompatible:['sudden-death','triple-dog-dare','say-uncle','phobia-factor','cliff-dive','awake-a-thon','dodgebrawl','talent-show','sucky-outdoors','up-the-creek','paintball-hunt','hells-kitchen','trust-challenge','basic-straining','x-treme-torture','lucky-hunt'] },
  { id:'triple-dog-dare',  emoji:'🎯', name:'Triple Dog Dare',      category:'challenge',  phase:'post-merge', desc:'Eliminated players dare the tribe. Accept to earn freebies, redirect to spend them. Run out of freebies and fail a dare? You\'re out. No tribal council.', engineType:'triple-dog-dare', incompatible:['sudden-death','slasher-night','say-uncle','phobia-factor','cliff-dive','awake-a-thon','dodgebrawl','talent-show','sucky-outdoors','up-the-creek','paintball-hunt','hells-kitchen','trust-challenge','basic-straining','x-treme-torture','lucky-hunt'] },
  { id:'say-uncle', emoji:'💪', name:'Say Uncle', category:'challenge', phase:'post-merge', desc:'The Dungeon of Misfortune. 4-phase torture endurance: The Wheel, The Gauntlet, The Rack, The Final Sentence. Survive 10 seconds or say uncle. Dominate to pick the next victim — but if they pass, YOU go to the pillory. Last one standing wins immunity.', engineType:'say-uncle', incompatible:['sudden-death','slasher-night','triple-dog-dare','phobia-factor','cliff-dive','awake-a-thon','dodgebrawl','talent-show','sucky-outdoors','up-the-creek','paintball-hunt','hells-kitchen','trust-challenge','basic-straining','x-treme-torture','lucky-hunt'] },
  { id:'brunch-of-disgustingness', emoji:'🤮', name:'Brunch of Disgustingness', category:'challenge', phase:'post-merge', desc:'Boys vs girls eating challenge at merge. 9 courses of disgusting food — every member must eat or the team loses the course. Chain vomiting. Eat-off tiebreaker. Losing team goes to tribal.', engineType:'brunch-of-disgustingness', incompatible:['sudden-death','slasher-night','triple-dog-dare','say-uncle','phobia-factor','cliff-dive','awake-a-thon','dodgebrawl','talent-show','sucky-outdoors','up-the-creek','paintball-hunt','hells-kitchen','trust-challenge','basic-straining','x-treme-torture','brunch-of-disgustingness','lucky-hunt'] },
  { id:'phobia-factor', emoji:'😱', name:'Phobia Factor', category:'challenge', phase:'pre-merge', desc:'Each player faces their worst fear. Tribe with the best completion rate wins immunity. Worst tribe goes to tribal. Triple points clutch for losing tribe.', engineType:'phobia-factor', incompatible:['sudden-death','slasher-night','triple-dog-dare','say-uncle','cliff-dive','awake-a-thon','dodgebrawl','talent-show','sucky-outdoors','up-the-creek','paintball-hunt','hells-kitchen','trust-challenge','basic-straining','x-treme-torture'] },
  { id:'cliff-dive', emoji:'🏔️', name:'Cliff Dive', category:'challenge', phase:'pre-merge', desc:'Three-phase tribe challenge: cliff jump (willingness), crate haul (physical), hot tub build (mental). Chickens get blame on losing tribe.', engineType:'cliff-dive', incompatible:['sudden-death','slasher-night','triple-dog-dare','say-uncle','phobia-factor','awake-a-thon','dodgebrawl','talent-show','sucky-outdoors','up-the-creek','paintball-hunt','hells-kitchen','trust-challenge','basic-straining','x-treme-torture'] },
  { id:'awake-a-thon', emoji:'😴', name:'Awake-A-Thon', category:'challenge', phase:'pre-merge', desc:'Three-phase endurance: 20km run, feast trap, then stay awake. Last team standing wins. Mid-challenge social events fire between dropouts.', engineType:'awake-a-thon', incompatible:['sudden-death','slasher-night','triple-dog-dare','say-uncle','phobia-factor','cliff-dive','dodgebrawl','talent-show','sucky-outdoors','up-the-creek','paintball-hunt','hells-kitchen','trust-challenge','basic-straining','x-treme-torture'] },
  { id:'dodgebrawl', emoji:'🏐', name:'Dodgebrawl', category:'challenge', phase:'pre-merge', desc:'Multi-round dodgeball. All tribes on the court — first to 3 wins immunity. Highlights, heroics, and blame.', engineType:'dodgebrawl', minTribes:2, incompatible:['sudden-death','slasher-night','triple-dog-dare','say-uncle','phobia-factor','cliff-dive','awake-a-thon','talent-show','sucky-outdoors','up-the-creek','paintball-hunt','hells-kitchen','trust-challenge','basic-straining','x-treme-torture'] },
  { id:'talent-show', emoji:'🎭', name:'Talent Show', category:'challenge', phase:'pre-merge', desc:'Camp talent show. Each tribe auditions, captain picks 3 acts. Chef scores 0-9. Disasters, clutch moments, and villain sabotage.', engineType:'talent-show', minTribes:2, incompatible:['sudden-death','slasher-night','triple-dog-dare','say-uncle','phobia-factor','cliff-dive','awake-a-thon','dodgebrawl','sucky-outdoors','up-the-creek','paintball-hunt','hells-kitchen','trust-challenge','basic-straining','x-treme-torture'] },
  { id:'sucky-outdoors', emoji:'🏕️', name:'The Sucky Outdoors', category:'challenge', phase:'pre-merge', desc:'Overnight survival in the woods. Five phases of drama. First tribe back in the morning wins. Getting lost can cost your team everything.', engineType:'sucky-outdoors', minTribes:2, incompatible:['sudden-death','slasher-night','triple-dog-dare','say-uncle','phobia-factor','cliff-dive','awake-a-thon','dodgebrawl','talent-show','up-the-creek','paintball-hunt','hells-kitchen','trust-challenge','basic-straining','x-treme-torture'] },
  { id:'up-the-creek', emoji:'🛶', name:'Up the Creek', category:'challenge', phase:'pre-merge', desc:'Canoe race to Boney Island and back. Pick your partner. Portage through danger. Build a fire. Race home. Partner chemistry matters.', engineType:'up-the-creek', minTribes:2, incompatible:['sudden-death','slasher-night','triple-dog-dare','say-uncle','phobia-factor','cliff-dive','awake-a-thon','dodgebrawl','talent-show','sucky-outdoors','paintball-hunt','hells-kitchen','trust-challenge','basic-straining','x-treme-torture'] },
  { id:'paintball-hunt', emoji:'🎯', name:'Paintball Deer Hunter', category:'challenge', phase:'pre-merge', desc:'Paintball hunt. Half your tribe are hunters, half are deer. Hunters track opposing deer. Last tribe with unpainted deer wins. Social chaos guaranteed.', engineType:'paintball-hunt', minTribes:2, incompatible:['sudden-death','slasher-night','triple-dog-dare','say-uncle','phobia-factor','cliff-dive','awake-a-thon','dodgebrawl','talent-show','sucky-outdoors','up-the-creek','hells-kitchen','trust-challenge','basic-straining','x-treme-torture'] },
  { id:'hells-kitchen', emoji:'🔥', name:"Hell's Kitchen", category:'challenge', phase:'pre-merge', desc:'Cooking challenge. Head chef leads the team through 3 courses. Kitchen chaos, sabotage, and food fights determine who serves the best meal.', engineType:'hells-kitchen', minTribes:2, incompatible:['sudden-death','slasher-night','triple-dog-dare','say-uncle','phobia-factor','cliff-dive','awake-a-thon','dodgebrawl','talent-show','sucky-outdoors','up-the-creek','paintball-hunt','trust-challenge','basic-straining','x-treme-torture'] },
  { id:'trust-challenge', emoji:'🤝', name:"Who Can You Trust?", category:'challenge', phase:'pre-merge', desc:'Three trust tests. Chris picks the worst pairs. Rock climb, fugu cooking, blind challenges. Trust is earned or destroyed.', engineType:'trust-challenge', minTribes:2, incompatible:['sudden-death','slasher-night','triple-dog-dare','say-uncle','phobia-factor','cliff-dive','awake-a-thon','dodgebrawl','talent-show','sucky-outdoors','up-the-creek','paintball-hunt','hells-kitchen','basic-straining','x-treme-torture'] },
  { id:'basic-straining', emoji:'🎖️', name:'Basic Straining', category:'challenge', phase:'any', desc:"Chef's military boot camp. 6 phases of escalating challenges. Players quit or get eliminated. Last team standing (pre-merge) or last player standing (post-merge) wins.", engineType:'basic-straining', incompatible:['sudden-death','slasher-night','triple-dog-dare','say-uncle','phobia-factor','cliff-dive','awake-a-thon','dodgebrawl','talent-show','sucky-outdoors','up-the-creek','paintball-hunt','hells-kitchen','trust-challenge','basic-straining','x-treme-torture','lucky-hunt'] },
  { id:'x-treme-torture', emoji:'🤸', name:'X-Treme Torture', category:'challenge', phase:'pre-merge', desc:'Three extreme sport events: Sofa Bed Skydiving, Rodeo Moose Riding, and Mud Skiing. One player per tribe per event. Injuries, sabotage, and social chaos. Opposing tribe drives your skier.', engineType:'x-treme-torture', minTribes:2, incompatible:['sudden-death','slasher-night','triple-dog-dare','say-uncle','phobia-factor','cliff-dive','awake-a-thon','dodgebrawl','talent-show','sucky-outdoors','up-the-creek','paintball-hunt','hells-kitchen','trust-challenge','basic-straining','x-treme-torture'] },
  { id:'lucky-hunt', emoji:'🗝️', name:'Lucky Hunt', category:'challenge', phase:'post-merge', desc:'Post-merge scavenger hunt. Every player searches for a key. One chest hides immunity — the others hold food, traps, and surprises. Hunt, help, steal, and scheme.', engineType:'lucky-hunt', incompatible:['sudden-death','slasher-night','triple-dog-dare','say-uncle','phobia-factor','cliff-dive','awake-a-thon','dodgebrawl','talent-show','sucky-outdoors','up-the-creek','paintball-hunt','hells-kitchen','trust-challenge','basic-straining','x-treme-torture','brunch-of-disgustingness','wawanakwa-gone-wild'] },
  { id:'hide-and-be-sneaky', emoji:'🔫', name:'Hide and Be Sneaky', category:'challenge', phase:'post-merge', desc:'Post-merge hide-and-seek. Chef hunts with a water gun. Stay hidden, escape to home base, or betray allies. 1-2 immunity winners. Betrayal mechanics, archetype-driven loyalty decisions.', engineType:'hide-and-be-sneaky', incompatible:['sudden-death','slasher-night','triple-dog-dare','say-uncle','phobia-factor','cliff-dive','awake-a-thon','dodgebrawl','talent-show','sucky-outdoors','up-the-creek','paintball-hunt','hells-kitchen','trust-challenge','basic-straining','x-treme-torture','brunch-of-disgustingness','lucky-hunt','off-the-chain','wawanakwa-gone-wild'] },
  { id:'off-the-chain', emoji:'🚲', name:"That's Off the Chain!", category:'challenge', phase:'post-merge', desc:'Post-merge bike-building and racing. Build a bike, swap with a rival, two-part race with obstacle gauntlet. Bikes fall apart mid-race. Sabotage, rivalry, and demolition derby chaos.', engineType:'off-the-chain', incompatible:['slasher-night','triple-dog-dare','say-uncle','phobia-factor','cliff-dive','awake-a-thon','dodgebrawl','talent-show','sucky-outdoors','up-the-creek','paintball-hunt','hells-kitchen','trust-challenge','basic-straining','x-treme-torture','brunch-of-disgustingness','lucky-hunt','hide-and-be-sneaky','wawanakwa-gone-wild'] },
  { id:'wawanakwa-gone-wild', emoji:'🐻', name:'Wawanakwa Gone Wild!', category:'challenge', phase:'post-merge', desc:'Post-merge animal hunt. Draw an animal, grab gear from the boathouse, and hunt it down. First capture wins immunity + a feast. Last place cleans the bathrooms. Tranq gun chaos, alliance offers, and animal mishaps.', engineType:'wawanakwa-gone-wild', incompatible:['sudden-death','slasher-night','triple-dog-dare','say-uncle','phobia-factor','cliff-dive','awake-a-thon','dodgebrawl','talent-show','sucky-outdoors','up-the-creek','paintball-hunt','hells-kitchen','trust-challenge','basic-straining','x-treme-torture','brunch-of-disgustingness','lucky-hunt','hide-and-be-sneaky','off-the-chain','tri-armed-triathlon'] },
  { id:'tri-armed-triathlon', emoji:'⛓️', name:'Trial by Tri-Armed Triathlon', category:'challenge', phase:'post-merge', desc:'Post-merge handcuffed pair challenge. Three sub-events: Competitive Chowdown, Idol Haul, Totem Pole of Shame. Wimp key available before each event (costs invincibility). Triple-tie = no invincibility tonight. Requires even player count (≥4); odd count gives one spectator.', engineType:'tri-armed-triathlon', incompatible:['sudden-death','slasher-night','triple-dog-dare','say-uncle','phobia-factor','cliff-dive','awake-a-thon','dodgebrawl','talent-show','sucky-outdoors','up-the-creek','paintball-hunt','hells-kitchen','trust-challenge','basic-straining','x-treme-torture','brunch-of-disgustingness','lucky-hunt','hide-and-be-sneaky','off-the-chain','wawanakwa-gone-wild'], minPlayers: 4 },
  { id:'cultural-reset',   emoji:'🔄', name:'Cultural Reset',       category:'elim',       phase:'any',        desc:'All alliances exposed publicly. Weak alliances dissolve, strong ones survive but become targets. Double-dippers are caught. The social game resets.',        engineType:'cultural-reset'  },
  { id:'rock-draw',        emoji:'🪨', name:'Rock Draw',            category:'elim',       phase:'any',        desc:'No re-vote on a tie — non-immune, non-tied players draw rocks. Random exit.', engineType:'rock-draw'      },
  { id:'open-vote',        emoji:'📢', name:'Open Vote',            category:'elim',       phase:'any',        desc:'Votes are public — cast one by one in an order chosen by the immunity winner. Cascade pressure builds. Everyone sees who said whose name.', engineType:'open-vote' },
  { id:'ambassadors',     emoji:'🤝', name:'Ambassadors',          category:'elim',       phase:'any',       desc:'Schedule on the merge episode. Each tribe names an ambassador. They meet and must agree on one elimination — or one ambassador draws the wrong rock.',  engineType:'ambassadors' },
  { id:'emissary-vote', emoji:'🕵️', name:'Emissary Vote', category:'elim', phase:'pre-merge', desc:'Winning tribe sends an emissary to losing tribe\'s tribal. After the normal vote, the emissary eliminates a second player.', engineType:'emissary-vote', incompatible:['ambassadors','double-tribal','multi-tribal','kidnapping','no-tribal'], minTribes:2 },
  // Returns
  { id:'returning-player', emoji:'🔁', name:'Returning Player',     category:'returns',    phase:'any',        desc:'1-3 previously eliminated players return, each for a chosen reason (unfinished business, entertainment, strategic threat, underdog, or random). One tribal still runs.',  engineType:'returning-player'},
  { id:'spirit-island',    emoji:'👻', name:'Spirit Island',        category:'returns',    phase:'post-merge', desc:'A jury member returns to camp for one day as a temporary visitor. They observe, reconnect, and share what the jury thinks.',    engineType:'spirit-island'   },
  // ri-duel removed — RI duels fire automatically when RI is enabled, not as a schedulable twist
  { id:'second-chance',    emoji:'🎯', name:'Second Chance Vote',   category:'returns',    phase:'any',        desc:'Fans vote one eliminated player back. Tribal still runs — someone goes home. Net zero change. Incompatible with Redemption/Rescue Island.',  engineType:'second-chance'},
  // Advantages
  { id:'three-gifts',      emoji:'🎁', name:'The Summit',            category:'advantages', phase:'pre-merge',  desc:'One nominee per tribe travels to a private location and chooses: tribal survival kit, hidden idol clue, or Immunity Totem. Works with any number of tribes.', engineType:'three-gifts' },
  { id:'tiebreaker-challenge', emoji:'🏅', name:'Challenge Tiebreaker (episode override)', category:'elim', phase:'any', desc:'Forces challenge tiebreaker this episode regardless of season tiebreaker mode.',              engineType:'tiebreaker-challenge' },
  { id:'auction',          emoji:'🏷️', name:'Survivor Auction',      category:'advantages', phase:'post-merge', desc:'Players receive $500 each and bid on food, comfort, advantages, and a blind-bid immunity item.', engineType:'auction' },
  { id:'elimination-swap', emoji:'🔀', name:'Elimination Swap',       category:'elim',       phase:'pre-merge',  desc:'The voted-out player is sent to another tribe instead. They pick one member of the new tribe to swap back in exchange.', engineType:'elimination-swap' },
  { id:'exile-duel',       emoji:'⚔️', name:'Exile Duel',            category:'elim',       phase:'any',        desc:'Voted-out player goes to exile. Next boot faces them in a duel — loser is permanently eliminated.', engineType:'exile-duel', incompatible:['ri'] },
  { id:'exile-island',     emoji:'🏝️', name:'Exile Island',         category:'advantages', phase:'any',        desc:'One player is exiled, missing tribal but getting an idol clue.',            engineType:'exile-island'    },
  { id:'journey',          emoji:'🗺️', name:'Journey',              category:'advantages', phase:'any',        desc:'Select players go on a journey for a chance at an advantage.',              engineType:'journey'         },
  // legacy-awakens removed — Legacy Advantage auto-activates at F13/F6
  // amulet-activate removed — Amulet power scales automatically as holders are eliminated
  { id:'idol-wager',       emoji:'🗿', name:'Idol Wager',           category:'advantages', phase:'any',        desc:'Players can wager their idol for a larger power — or lose it.',             engineType:'idol-wager'      },
  // Social
  { id:'loved-ones',       emoji:'❤️', name:'Loved Ones Visit',     category:'social',     phase:'post-merge', desc:"Loved ones visit before tribal. Bonds shift dramatically. Tribal still runs — someone goes home.",  engineType:'loved-ones'      },
  { id:'the-feast',        emoji:'🍗', name:'The Feast',            category:'social',     phase:'pre-merge',  desc:'All tribes share a feast — bonds form across tribal lines. Strategic deals and emotional moments.',  engineType:'the-feast'       },
  { id:'merge-reward',     emoji:'🎉', name:'Merge Feast',          category:'social',     phase:'post-merge', desc:'A feast marks the merge. Bonds shift as alliances reorder. Tribal still runs.',              engineType:'merge-reward'    },
  { id:'reward-challenge', emoji:'🏅', name:'Reward Challenge',     category:'advantages', phase:'any',        desc:'A reward challenge runs before immunity. Winner picks who shares it. Tribal still runs.',     engineType:'reward-challenge'},
  { id:'fan-vote-boot',    emoji:'📱', name:'Fan Vote Save',        category:'social',     phase:'post-merge', desc:'Fans vote to save the most popular player — pre-merge: tribal immunity; post-merge: Extra Vote.',  engineType:'fan-vote-boot'   },
  { id:'jury-elimination', emoji:'⚖️', name:'Jury Elimination',     category:'elim',       phase:'post-merge', desc:'All eliminated players (jury) vote to boot one active player. Immunity winner is safe.',        engineType:'jury-elimination'},
  { id:'aftermath',       emoji:'🎬', name:'Aftermath Show',       category:'social',     phase:'any',        desc:'Total Drama Aftermath: Chris interviews eliminated players, reveals secrets, shows unseen footage.', engineType:'aftermath' },
  { id:'tied-destinies',  emoji:'🔗', name:'Tied Destinies',       category:'elim',       phase:'post-merge', desc:'Players randomly paired. Vote someone out and their partner goes too. Paired immunity challenge. Double elimination.', engineType:'tied-destinies', incompatible:['pre-merge'] },
];

// ── Triple Dog Dare — dare pools by category ──
export const DARE_POOL = {
  'gross': [
    { title: 'The Armpit Lick', desc: 'Lick another player\'s armpit. Slowly. While they watch.', severity: 'harsh' },
    { title: 'Mystery Meat Slurry', desc: 'Drink a blended puree of camp mystery meat. Every last drop.', severity: 'harsh' },
    { title: 'Gum Archaeology', desc: 'Chew a piece of gum scraped from under the bench. For 60 seconds.', severity: 'mild' },
    { title: 'Swamp Water Smoothie', desc: 'Fill a glass with swamp water. Drink it through a straw. No gagging.', severity: 'harsh' },
    { title: 'The Bug Buffet', desc: 'Eat a live bug. Chew thoroughly. Swallow. Smile.', severity: 'harsh' },
    { title: 'Sole Food', desc: 'Lick the bottom of someone else\'s shoe. Both shoes.', severity: 'mild' },
    { title: 'Raw Egg Crunch', desc: 'Eat a raw egg. Shell and all. No water to wash it down.', severity: 'harsh' },
    { title: 'Fish Gut Chug', desc: 'Drink a cup of blended fish guts. In one go.', severity: 'harsh' },
    { title: 'Toenail Tartare', desc: 'Clip someone\'s toenail. Put it in your mouth. Chew slowly.', severity: 'harsh' },
    { title: 'Three-Day Surprise', desc: 'Eat a spoonful of camp leftovers from three days ago. Don\'t ask what it was.', severity: 'harsh' },
    { title: 'Belly Button Jelly', desc: 'Eat grape jelly out of another player\'s belly button. Nine spoonfuls.', severity: 'harsh' },
    { title: 'Toilet Punch', desc: 'Drink fruit punch mixed in the communal toilet. With a straw.', severity: 'harsh' },
    { title: 'Dog Food Deluxe', desc: 'Eat an entire can of dog food. Describe the flavor profile while you chew.', severity: 'mild' },
    { title: 'Hair Sandwich', desc: 'Make a sandwich with hair clippings from the camp floor. Eat half.', severity: 'harsh' },
    { title: 'Nose Gummy', desc: 'Pick someone else\'s nose. Eat what you find. No napkins.', severity: 'harsh' },
    { title: 'Pond Scum Gargle', desc: 'Gargle a mouthful of pond water for 30 seconds. Swallow.', severity: 'harsh' },
    { title: 'Blended Camp Special', desc: 'Blend together rice, fish bait, and sunscreen. Drink the smoothie.', severity: 'mild' },
    { title: 'The Toe Jam Lick', desc: 'Lick between someone\'s toes. All five gaps. Both feet.', severity: 'harsh' },
    { title: 'Crab Bait Chew', desc: 'Chew on a piece of old crab bait for 2 minutes. No spitting.', severity: 'mild' },
    { title: 'Earwax Appetizer', desc: 'Q-tip someone\'s ear. Lick the Q-tip. Twice.', severity: 'mild' },
    { title: 'The Firepit Lick', desc: 'Lick the log in the firepit. Both ends.', severity: 'harsh' },
    { title: 'Dirt Snack', desc: 'Eat a handful of camp dirt. Chew. Swallow. Smile.', severity: 'mild' },
    { title: 'Mystery Jar', desc: 'Drink whatever is in the mystery jar Chef found behind the cabin.', severity: 'harsh' },
    { title: 'Ground Gum', desc: 'Chew a piece of gum you find stuck under the picnic table.', severity: 'harsh' },
    { title: 'Shoe Lick', desc: 'Lick somebody else\'s shoe. Top and bottom.', severity: 'mild' },
    { title: 'Mud Smoothie', desc: 'Blend camp mud with whatever Chef has in the fridge. Drink it warm.', severity: 'harsh' },
    { title: 'Garbage Dive', desc: 'Sort through the camp garbage with your bare hands for 60 seconds.', severity: 'mild' },
    { title: 'Leftover Soup', desc: 'Combine every piece of leftover food into one bowl and eat it cold.', severity: 'harsh' },
    { title: 'Spit Swap', desc: 'Drink a cup of water that has been passed mouth-to-mouth around the entire tribe.', severity: 'harsh' },
    { title: 'The Skunk Log', desc: 'Roll the skunk-sprayed log from the woodpile into the center of camp. Using your face.', severity: 'harsh' },
  ],
  'public': [
    { title: 'The Runway', desc: 'Put on the most ridiculous outfit camp has to offer. Walk the runway. Pose.', severity: 'mild' },
    { title: 'Chicken Dance', desc: 'Do a full chicken dance in front of everyone for 60 seconds. Clucking included.', severity: 'mild' },
    { title: 'Five Across the Face', desc: 'Slap yourself in the face. Hard. Five times. While everyone counts.', severity: 'harsh' },
    { title: 'Love Ballad', desc: 'Serenade the host with an improvised love song. Eye contact mandatory.', severity: 'mild' },
    { title: 'Undying Love', desc: 'Get on one knee and declare your undying love to the player you like the least.', severity: 'harsh' },
    { title: 'Baby Time', desc: 'Wear a diaper. Crawl around camp. Cry for your bottle. Five minutes.', severity: 'harsh' },
    { title: 'Human Canvas', desc: 'Let the tribe draw whatever they want on your face with permanent marker.', severity: 'mild' },
    { title: 'The Confession', desc: 'Stand up and give a dramatic monologue about your biggest weakness. Sell it.', severity: 'mild' },
    { title: 'Interpretive Dance', desc: 'Perform an interpretive dance recapping your entire game so far. No words.', severity: 'mild' },
    { title: 'On Your Knees', desc: 'Get on your knees and beg your biggest rival for forgiveness. Mean it. Or fake it.', severity: 'harsh' },
    { title: 'Sock Puppet Kiss', desc: 'Kiss a sweaty sock puppet. On the lips. For 10 seconds. In front of everyone.', severity: 'mild' },
    { title: 'The Hula', desc: 'Do the hula in a grass skirt and coconut bra. For 2 full minutes. No stopping.', severity: 'mild' },
    { title: 'Pig Squeal', desc: 'Get on all fours and squeal like a pig for 30 seconds. Make eye contact with someone.', severity: 'harsh' },
    { title: 'Wedgie Walk', desc: 'Give yourself a wedgie and walk the entire length of camp. Waving.', severity: 'harsh' },
    { title: 'Stand-Up Roast', desc: 'Do a 60-second stand-up comedy roast of yourself. Make the tribe laugh.', severity: 'mild' },
    { title: 'Nickname Tattoo', desc: 'Let the tribe vote on a humiliating nickname. Wear it on a name tag all day.', severity: 'mild' },
    { title: 'Fan Letter', desc: 'Write a fan letter to your biggest rival. Read it aloud. Be sincere.', severity: 'mild' },
    { title: 'Victory Lap', desc: 'Run a victory lap around camp in your underwear. Arms raised. Screaming.', severity: 'harsh' },
    { title: 'The Bow', desc: 'Kneel before the person with the most freebies. Call them "Your Majesty." Kiss their hand.', severity: 'harsh' },
    { title: 'Camp Mascot', desc: 'Become the camp mascot for the next hour. Wear a costume. Do a cheer. Commit.', severity: 'mild' },
    { title: 'Table Poem', desc: 'Stand on the dining table and recite an original love poem. Eye contact with the audience.', severity: 'mild' },
    { title: 'National Anthem', desc: 'Sing the national anthem to the whole camp. All verses. No humming.', severity: 'mild' },
    { title: 'Tree Wedding', desc: 'Propose marriage to a tree in front of witnesses. Make it romantic.', severity: 'harsh' },
    { title: 'Dedication Dance', desc: 'Do a victory dance and dedicate it to {target} by name.', severity: 'mild', target: 'named' },
    { title: 'Public Apology', desc: 'Stand up and publicly apologize to {target} for the most embarrassing thing you\'ve done this game.', severity: 'harsh', target: 'named' },
    { title: 'Camp Announcement', desc: 'Announce over the imaginary loudspeaker your deepest insecurity. Three times.', severity: 'harsh' },
    { title: 'Talent Show Encore', desc: "Perform a 60-second talent that the tribe has to vote on by applause.", severity: 'mild' },
    { title: 'Villain Monologue', desc: 'Do your best villain monologue about the game. Own it. Commit.', severity: 'mild' },
    { title: 'Tribute Cheer', desc: "Lead a cheer for the person you've talked the most trash about.", severity: 'harsh', target: 'named' },
    { title: 'Sock Puppet Press Conference', desc: 'Hold a press conference using a sock puppet as your spokesperson. 2 minutes of Q&A.', severity: 'harsh' },
  ],
  'physical': [
    { title: 'Bear Nurple', desc: 'Walk into the woods. Find a sleeping bear. Give it a purple nurple. Run.', severity: 'harsh' },
    { title: 'Leech Bath', desc: 'Swim in a pool of leeches for 30 seconds. No screaming.', severity: 'harsh' },
    { title: 'Anthill Seat', desc: 'Sit on an active anthill for 60 seconds. No standing. No brushing them off.', severity: 'harsh' },
    { title: 'Hot Coal Walk', desc: 'Walk barefoot across a bed of hot coals. One direction. No stopping.', severity: 'harsh' },
    { title: 'Raccoon Wrestling', desc: 'Wrestle a raccoon. Pin it. Or at least survive the attempt.', severity: 'harsh' },
    { title: 'Scorpion Handshake', desc: 'Hold a live scorpion in your open palm for 30 seconds. Don\'t flinch.', severity: 'harsh' },
    { title: 'Bee Beard', desc: 'Wear a honey-covered shirt and stand in a swarm of bees. 30 seconds.', severity: 'harsh' },
    { title: 'Snake Scarf', desc: 'Let a snake wrap around your neck. Wear it like a scarf. Smile for the camera.', severity: 'mild' },
    { title: 'Polar Plunge', desc: 'Jump into freezing water. Stay submerged for 2 full minutes.', severity: 'mild' },
    { title: 'Fire Hose', desc: 'Stand still while you get blasted by a fire hose at close range. Don\'t fall.', severity: 'harsh' },
    { title: 'Cannon Fodder', desc: 'Get fired out of a cannon into a mud pit. Helmet optional.', severity: 'harsh' },
    { title: 'Jellyfish Pool', desc: 'Jump into a pool of jellyfish. Stay for 20 seconds. No crying.', severity: 'harsh' },
    { title: 'Electric Fence Grab', desc: 'Grab an electric fence wire. Hold on for 10 seconds. Teeth clenched.', severity: 'harsh' },
    { title: 'Pepper Roulette', desc: 'Eat a mystery pepper. Could be mild. Could be Carolina Reaper. No milk for 5 minutes.', severity: 'mild' },
    { title: 'Cactus Hug', desc: 'Hug a cactus. Shirtless. For 5 seconds. Let go when you can.', severity: 'mild' },
    { title: 'Ice Bucket Burial', desc: 'Get buried under 50 pounds of ice. Stay still for 90 seconds.', severity: 'mild' },
    { title: 'Stingray Shuffle', desc: 'Walk blindfolded through shallow water known for stingrays. Slowly.', severity: 'mild' },
    { title: 'Tarantula Necklace', desc: 'Let a tarantula crawl across your face. Mouth closed. Eyes open.', severity: 'mild' },
    { title: 'The Gauntlet', desc: 'Run through a gauntlet of tribe members swinging wet towels. No dodging.', severity: 'mild' },
    { title: 'Thunder Dome', desc: 'Sit inside a metal cage while they bang pots and pans around you for 60 seconds.', severity: 'mild' },
    { title: 'Push-Up Gauntlet', desc: 'Do 30 push-ups right now. Without stopping.', severity: 'mild' },
    { title: "Chef's Arm Wrestling", desc: 'Arm-wrestle Chef. Best of three.', severity: 'harsh' },
    { title: 'Camp Sprint', desc: 'Run a full lap around camp in under 90 seconds. No shortcuts.', severity: 'mild' },
    { title: 'Plank Hold', desc: 'Hold a full plank until the next dare is drawn. No resting.', severity: 'harsh' },
    { title: 'Log Lift', desc: 'Deadlift the heaviest log in the woodpile overhead. Three times.', severity: 'mild' },
    { title: 'Cold Swim', desc: 'Swim to the far dock and back without stopping.', severity: 'mild' },
    { title: 'Burpee Century', desc: 'Complete 25 burpees back-to-back. No pause between reps.', severity: 'harsh' },
    { title: 'Tree Climb', desc: 'Climb the tallest tree in camp and touch the highest branch you can reach.', severity: 'harsh' },
    { title: 'Carry the Load', desc: 'Carry two full water buckets across camp without spilling a drop.', severity: 'mild' },
    { title: 'Handstand Mile', desc: 'Walk on your hands for 20 feet. No touch-down allowed.', severity: 'harsh' },
  ],
  'truth': [
    { title: 'The Shave', desc: 'Sit in the chair. Let the host shave your head. All of it.', severity: 'harsh' },
    { title: 'Luxury Destroyed', desc: 'Your one comfort item from home. Smash it. Burn it. Gone.', severity: 'harsh' },
    { title: 'Reward Forfeit', desc: 'Give up your next reward challenge win. The tribe eats. You don\'t.', severity: 'harsh' },
    { title: 'Barefoot for Life', desc: 'Burn your camp shoes. Walk barefoot for the rest of the game.', severity: 'harsh' },
    { title: 'Rice Sacrifice', desc: 'Eat the entire tribe\'s rice ration for tomorrow. In front of everyone.', severity: 'harsh' },
    { title: 'Name on Paper', desc: 'Write your closest ally\'s name on a piece of paper. Hand it to the host. That\'s your next vote.', severity: 'harsh' },
    { title: 'Sleep on the Ground', desc: 'Surrender your sleeping spot in the shelter. Sleep on the ground. Rest of the game.', severity: 'mild' },
    { title: 'Smash the Gear', desc: 'Take the tribe\'s fishing gear. Smash it against a rock. No more fish.', severity: 'harsh' },
    { title: 'Personal Memento', desc: 'Hand your personal memento to the host. You won\'t get it back.', severity: 'harsh' },
    { title: 'The Sign', desc: 'Wear a sign around your neck that says "VOTE ME OUT" for the rest of the day.', severity: 'mild' },
    { title: 'Burn the Shelter', desc: 'Set fire to one wall of the shelter. Watch it burn. Sleep in the rain.', severity: 'harsh' },
    { title: 'Secret Spill', desc: 'Tell the entire tribe your biggest secret in the game. Alliances, deals, everything.', severity: 'harsh' },
    { title: 'Idol Surrender', desc: 'If you have a hidden immunity idol, hand it to the host. If you don\'t, swear on your family you don\'t.', severity: 'harsh' },
    { title: 'Apology Tour', desc: 'Apologize — sincerely — to every person you\'ve wronged in this game. One by one. On camera.', severity: 'mild' },
    { title: 'Torch Snuff', desc: 'Snuff your own torch. Relight it. Carry the memory of what that felt like.', severity: 'mild' },
    { title: 'Last Meal', desc: 'Give away your next 3 meals to other players. You choose who eats. You don\'t.', severity: 'harsh' },
    { title: 'Public Diary', desc: 'Read your private journal entry from last night to the entire tribe. Unedited.', severity: 'mild' },
    { title: 'Alliance Reveal', desc: 'Stand up and name every alliance you\'re in. Every deal. Every handshake. Right now.', severity: 'harsh' },
    { title: 'Comfort Surrender', desc: 'Give your buff to another player. Wear a plain shirt. You\'re not special anymore.', severity: 'mild' },
    { title: 'The Kneel', desc: 'Kneel at tribal council instead of sitting. For the rest of the game. Every tribal.', severity: 'mild' },
    { title: 'Vote Confession', desc: 'Admit who you would vote for tonight if you had to vote right now.', severity: 'harsh' },
    { title: 'Fear Drop', desc: 'Confess your biggest fear to {target} — while looking them in the eye.', severity: 'mild', target: 'named' },
    { title: 'Real Reason', desc: 'Tell {target} the real reason you\'re actually here.', severity: 'harsh', target: 'named' },
    { title: 'Player Rating', desc: 'Rate every active player from 1 to 10 and commit to your rankings out loud.', severity: 'harsh' },
    { title: 'Alliance Roll Call', desc: "Name every alliance deal you've made this season. Don't leave one out.", severity: 'harsh' },
    { title: 'Trust Ranking', desc: 'Tell {target} exactly how much you trust them — and give a reason.', severity: 'mild', target: 'named' },
    { title: 'Game Plan', desc: 'Explain your actual strategy in the game. Every beat.', severity: 'harsh' },
    { title: 'Apology Owed', desc: 'Apologize to {target} for something real that happened in this game.', severity: 'mild', target: 'named' },
    { title: 'Threat Level', desc: 'Tell {target} honestly whether you consider them a threat to you.', severity: 'harsh', target: 'named' },
    { title: 'Jury Speech', desc: "Give your final jury speech right now, as if it's the finale. All of it.", severity: 'harsh' },
  ],
};
export const DARE_CATEGORIES = Object.keys(DARE_POOL);

// ── Say Uncle — endurance dare pools (survive 10 seconds) ──
export const SAY_UNCLE_POOL = {
  'pain': [
    { title: 'Turtle Puck Shots', desc: 'Stand in a hockey net while Chef fires angry snapping turtles at you.' },
    { title: 'Electric Shock Chair', desc: 'Sit in the chair. Mild shocks every 2 seconds. Don\'t stand up.' },
    { title: 'Ant Hill Sit', desc: 'Sit on an active anthill for 10 seconds. No brushing them off.' },
    { title: 'Wooden Shorts', desc: 'Wear wooden shorts while a woodpecker goes to town.' },
    { title: 'Spike Bed', desc: 'Lay down on a bed of blunt spikes. Stay flat. 10 seconds.' },
    { title: 'Hot Coal Walk', desc: 'Walk barefoot across hot coals. One direction. No stopping.' },
    { title: 'Ice Bucket Burial', desc: 'Get buried under 50 pounds of ice. Stay still.' },
    { title: 'Water Balloon Headshots', desc: 'Stand still while Chef launches water balloons at your face.' },
    { title: 'Yellow Jacket', desc: 'Have your front covered in bees. Don\'t swat.' },
    { title: 'Grizzly Bear Log Roll', desc: 'Survive 10 seconds of log rolling against a grizzly bear.' },
    { title: 'Cactus Shirt', desc: 'Wear a shirt lined with cactus needles. Hug yourself.' },
    { title: 'Fire Ant Gloves', desc: 'Wear gloves full of fire ants. Keep them on.' },
    { title: 'Rubber Band Barrage', desc: 'Stand still while the tribe snaps rubber bands at you. 10 seconds.' },
    { title: 'Cattle Prod Poke', desc: 'One poke every 3 seconds. Four total. Don\'t move.' },
    { title: 'Frozen Hands', desc: 'Grip two blocks of ice. Hold on for 10 seconds.' },
    { title: 'Tar and Feather', desc: 'Get tarred and feathered. Stand there and take it.' },
    { title: 'Pepper Spray Breeze', desc: 'Stand downwind of a pepper spray fan. Eyes open.' },
    { title: 'Nail Bed Press', desc: 'Lay face-down on a bed of nails. Weight placed on your back.' },
    { title: 'Thunder Clap Drums', desc: 'Sit between two massive drums being hammered. Don\'t cover your ears.' },
    { title: 'Wrecking Ball Dodge', desc: 'Stand in a circle while a wrecking ball swings. Don\'t leave the circle.' },
  ],
  'fear': [
    { title: 'Snake Box', desc: 'Step into a box full of snakes. Stay inside. 10 seconds.' },
    { title: 'Sasquatchanakwa Crate', desc: 'Get inside a wooden crate with Sasquatchanakwa. Survive.' },
    { title: 'Jellyfish Pool', desc: 'Jump into a pool of jellyfish. Stay submerged.' },
    { title: 'Tarantula Face Walk', desc: 'Let a tarantula walk across your face. Mouth closed. Eyes open.' },
    { title: 'Scorpion Pit', desc: 'Stand in a pit of scorpions. Don\'t move.' },
    { title: 'Bat Cave Sit', desc: 'Sit in a dark cave full of bats. Don\'t run.' },
    { title: 'Wolf Staredown', desc: 'Make eye contact with a wolf for 10 seconds. Don\'t look away.' },
    { title: 'Shark Cage Dunk', desc: 'Get lowered into shark-infested water in a rusty cage.' },
    { title: 'Cliff Edge Blindfold', desc: 'Stand blindfolded on the edge of a cliff. Don\'t step back.' },
    { title: 'Coffin Close', desc: 'Lay in a coffin. Lid closes. 10 seconds in the dark.' },
    { title: 'Croc Teeth Cleaning', desc: 'Put your hand in a crocodile\'s mouth. Clean a tooth.' },
    { title: 'Dark Room', desc: 'Sit alone in a pitch-black room. Sounds play. Don\'t scream.' },
    { title: 'Rat Swarm', desc: 'Stand still while rats climb over you.' },
    { title: 'Piranha Pedicure', desc: 'Dip your feet in piranha water. They nibble. Don\'t pull out.' },
    { title: 'Wasp Nest Poke', desc: 'Poke a wasp nest with a short stick. Stand your ground.' },
    { title: 'Skunk Jump', desc: 'Jump over a line of skunks between rocks. Don\'t get sprayed.' },
    { title: 'Bull Pen', desc: 'Stand in a bull pen. Don\'t run. Don\'t wave anything red.' },
    { title: 'Bear Cave Nap', desc: 'Lay down at the entrance of a bear cave. Close your eyes.' },
    { title: 'Quicksand Stand', desc: 'Stand in quicksand up to your waist. Don\'t panic. Don\'t struggle.' },
    { title: 'Haunted Maze Sprint', desc: 'Sprint through a haunted maze. Finish in 10 seconds.' },
  ],
  'gross': [
    { title: 'Lake Leeches Barrel', desc: 'Sit in a barrel full of water and lake leeches.' },
    { title: 'Poison Ivy Spa', desc: 'Have your face wrapped in poison ivy. Don\'t scratch.' },
    { title: 'Nose Hair Pull', desc: 'Have all your nose hairs pulled at once. Don\'t flinch.' },
    { title: 'Manure Face Mask', desc: 'Get a face mask made of actual manure. Sit with it.' },
    { title: 'Got Milk?', desc: 'Attempt to milk an angry goat. Whatever happens, happens.' },
    { title: 'Goo Shoes', desc: 'Wear shoes filled with mystery goo. Walk 20 steps.' },
    { title: 'Worm Bath Soak', desc: 'Lay in a bathtub full of worms. Submerge.' },
    { title: 'Dumpster Dive Sit', desc: 'Sit inside a dumpster. Lid closes. Breathe through your mouth.' },
    { title: 'Maggot Massage', desc: 'Lay still while maggots are spread across your back.' },
    { title: 'Fish Scale Facial', desc: 'Get a facial made of fish scales and fish oil.' },
    { title: 'Sewage Snorkel', desc: 'Snorkel in murky swamp water. Face down. 10 seconds.' },
    { title: 'Slug Trail Necklace', desc: 'Wear a necklace of live slugs. They leave trails.' },
    { title: 'Mystery Goo Helmet', desc: 'Wear a helmet filled with unknown slime. It drips down your face.' },
    { title: 'Swamp Mud Burial', desc: 'Get buried in swamp mud up to your neck. Don\'t gag.' },
    { title: 'Bird Dropping Shower', desc: 'Stand under a birdcage. Look up. 10 seconds.' },
    { title: 'Catfish Kiss', desc: 'Kiss a live catfish. On the mouth. Hold it.' },
    { title: 'Rotten Egg Sauna', desc: 'Sit in a sauna filled with rotten egg smell. Breathe normally.' },
    { title: 'Cockroach Crown', desc: 'Wear a crown of live cockroaches on your head.' },
    { title: 'Blister Beetle Bracelet', desc: 'Wear a bracelet of blister beetles. They secrete. Don\'t remove it.' },
    { title: 'Roadkill Pillow', desc: 'Lay your head on a roadkill pillow. Close your eyes. 10 seconds.' },
  ],
  'humiliation': [
    { title: 'Cow Costume Parade', desc: 'Wear a cow costume. Parade around camp. Moo on command.' },
    { title: 'Wawanakwa Hair Salon', desc: 'Get a haircut from Chef. With a chainsaw.' },
    { title: 'Baby Diaper Dance', desc: 'Wear a diaper. Do a baby dance. In front of everyone.' },
    { title: 'Tickle Onslaught', desc: 'Endure one minute of constant tickling from two people.' },
    { title: 'Voice to Self', desc: 'Listen to a recording of your own voice on repeat. Don\'t cringe.' },
    { title: 'Marshmallow Waxing', desc: 'Get your face waxed using melted marshmallows.' },
    { title: 'Wedgie Marathon', desc: 'Give yourself a wedgie. Walk the length of camp. Waving.' },
    { title: 'Clown Makeover', desc: 'Full clown makeup. Nose. Wig. Do a routine.' },
    { title: 'Public Love Letter', desc: 'Read a love letter you wrote (to no one) aloud to the tribe.' },
    { title: 'Stand-Up About Yourself', desc: 'Do 60 seconds of stand-up comedy roasting yourself.' },
    { title: 'Dunce Cap Walk', desc: 'Wear a dunce cap. Sit in the corner. Everyone watches.' },
    { title: 'Sing Your Worst Moment', desc: 'Sing a song about your most embarrassing game moment.' },
    { title: 'Kiss the Fish', desc: 'Kiss a dead fish on camera. Maintain eye contact with the tribe.' },
    { title: 'Belly Flop Contest', desc: 'Do a belly flop off the dock. Maximum splash. Maximum pain.' },
    { title: 'Dance Battle Solo', desc: 'Dance battle against nobody. No music. Full commitment.' },
    { title: 'Serenade Your Enemy', desc: 'Serenade the person you like least. Be romantic.' },
    { title: 'Wear Rival\'s Clothes', desc: 'Wear your rival\'s clothes for the rest of the day. Their style.' },
    { title: 'Human Pinata', desc: 'Get hung up like a pinata. Tribe throws soft balls at you.' },
    { title: 'Truth Serum', desc: 'Answer any question the tribe asks. Honestly. For 60 seconds.' },
    { title: 'Walk of Shame Lap', desc: 'Walk a lap around camp while everyone slow-claps.' },
  ],
};
export const SAY_UNCLE_CATEGORIES = Object.keys(SAY_UNCLE_POOL);

// ══════════════════════════════════════════════════════════════════════
// BRUNCH OF DISGUSTINGNESS — FOOD & REACTION POOLS
// ══════════════════════════════════════════════════════════════════════
export const BRUNCH_FOOD_POOL = {
  'meat-gross': [
    { name: 'Bovine Testicles', desc: 'Bull parts. Rubbery. Chewy. Exactly what you think they are.', category: 'meat-gross' },
    { name: 'Mystery Meat Stew', desc: 'Nobody knows what animal this came from. Possibly several.', category: 'meat-gross' },
    { name: 'Pig Snout Pâté', desc: 'Snout, ground into paste. Smells like a barn on a hot day.', category: 'meat-gross' },
    { name: 'Tongue Tartare', desc: 'Raw cow tongue, diced. Still has taste buds on it.', category: 'meat-gross' },
    { name: 'Tripe Tacos', desc: 'Stomach lining in a tortilla. The texture is the problem.', category: 'meat-gross' },
    { name: 'Brain Fritters', desc: 'Deep-fried sheep brain. Creamy inside. Don\'t think about it.', category: 'meat-gross' },
    { name: 'Sweetbread Sliders', desc: 'Thymus gland on a mini bun. "Sweetbread" is a lie.', category: 'meat-gross' },
    { name: 'Head Cheese', desc: 'Not cheese. Jellied meat from a head. Every part of the head.', category: 'meat-gross' },
    { name: 'Blood Sausage', desc: 'Cooked blood in a casing. Dark red, almost black. Metallic taste.', category: 'meat-gross' },
    { name: 'Chicken Feet Soup', desc: 'Feet. In broth. The toenails are still on.', category: 'meat-gross' },
    { name: 'Haggis', desc: 'Sheep organs minced inside a stomach lining. A Scottish tradition.', category: 'meat-gross' },
    { name: 'Rocky Mountain Oysters', desc: 'Not oysters. Not from the ocean. From a bull.', category: 'meat-gross' },
    { name: 'Liver Smoothie', desc: 'Blended raw liver with a splash of beet juice. Iron-rich.', category: 'meat-gross' },
    { name: 'Oxtail Jelly', desc: 'Gelatinous oxtail in aspic. Wobbles on the plate.', category: 'meat-gross' },
    { name: 'Meat Mystery Loaf', desc: 'Chef won\'t say what\'s in it. The texture changes every bite.', category: 'meat-gross' },
  ],
  'bug-gross': [
    { name: 'Live Grasshopper Pizza', desc: 'Spicy jellyfish sauce, live anchovies, and grasshoppers that are still moving.', category: 'bug-gross' },
    { name: 'Cockroach Crumble', desc: 'Baked cockroaches with a brown sugar crust. Crunchy.', category: 'bug-gross' },
    { name: 'Beetle Bruschetta', desc: 'Toasted bread topped with sautéed beetles and garlic.', category: 'bug-gross' },
    { name: 'Cricket Casserole', desc: 'Hundreds of crickets baked in cream sauce. They crunch.', category: 'bug-gross' },
    { name: 'Mealworm Muffins', desc: 'Blueberry muffins but the blueberries are mealworms.', category: 'bug-gross' },
    { name: 'Ant Egg Omelette', desc: 'Fluffy omelette filled with ant eggs. They pop in your mouth.', category: 'bug-gross' },
    { name: 'Scorpion Skewers', desc: 'Skewered and deep-fried. The stinger is still attached.', category: 'bug-gross' },
    { name: 'Tarantula Tempura', desc: 'Battered and fried whole. The legs stick out of the batter.', category: 'bug-gross' },
    { name: 'Fly Larvae Risotto', desc: 'Creamy risotto. The rice has been replaced with maggots.', category: 'bug-gross' },
    { name: 'Centipede Ceviche', desc: 'Raw centipede marinated in lime. Still curling.', category: 'bug-gross' },
    { name: 'Wasp Crackers', desc: 'Rice crackers studded with whole wasps. Stingers removed. Probably.', category: 'bug-gross' },
    { name: 'Locust Loaf', desc: 'Ground locust bread. Dense, nutty, and deeply wrong.', category: 'bug-gross' },
    { name: 'Silk Worm Sushi', desc: 'Silk worm pupae on rice. They\'re boiled, not raw. Small comfort.', category: 'bug-gross' },
    { name: 'Grub Goulash', desc: 'Fat white grubs in paprika sauce. They burst when you bite down.', category: 'bug-gross' },
    { name: 'Mosquito Mousse', desc: 'Whipped chocolate mousse mixed with dried mosquitoes. Gritty.', category: 'bug-gross' },
  ],
  'texture-gross': [
    { name: 'Earthworms in Snail Slime', desc: 'Live earthworms coated in actual snail mucus. With hairball garnish.', category: 'texture-gross' },
    { name: 'Pre-Chewed Gum Platter', desc: 'Already chewed by Chef. Assorted flavours. All flat.', category: 'texture-gross' },
    { name: 'Hairball Pasta', desc: 'Spaghetti made from actual hair. In a slime sauce.', category: 'texture-gross' },
    { name: 'Slug Soufflé', desc: 'Whipped slug. Light, airy, and leaves a trail on the plate.', category: 'texture-gross' },
    { name: 'Mucus Meringue', desc: 'Meringue made with... not egg whites. Stringy.', category: 'texture-gross' },
    { name: 'Gelatin Eyeballs', desc: 'Gelatin moulded into eyeball shapes. They stare back.', category: 'texture-gross' },
    { name: 'Fish Scale Flakes', desc: 'Dried fish scales served like cereal. In warm milk.', category: 'texture-gross' },
    { name: 'Toenail Croutons', desc: 'Baked and seasoned toenail clippings on a salad.', category: 'texture-gross' },
    { name: 'Skin Pudding', desc: 'A pudding with the texture of skin. Because it is.', category: 'texture-gross' },
    { name: 'Blister Broth', desc: 'Broth made from boiled blisters. Salty. Warm. Wrong.', category: 'texture-gross' },
    { name: 'Earwax Caramel', desc: 'Caramel with the colour and consistency of earwax. Tastes similar.', category: 'texture-gross' },
    { name: 'Dandruff Dust Seasoning', desc: 'Your meal, seasoned with scalp flakes. Adds... crunch.', category: 'texture-gross' },
    { name: 'Scab Brittle', desc: 'Peanut brittle but the peanuts have been replaced with scabs.', category: 'texture-gross' },
    { name: 'Belly Button Lint Balls', desc: 'Rolled, compressed, and served on a stick. Fuzzy.', category: 'texture-gross' },
    { name: 'Pus Pastry', desc: 'Cream puff. The cream is not cream. It\'s from a boil.', category: 'texture-gross' },
  ],
  'mystery-gross': [
    { name: 'Painted Sandal', desc: 'A sandal painted with a happy face. You must eat the sandal.', category: 'mystery-gross' },
    { name: 'Bunion Soup', desc: 'French bunion soup with hangnail crackers. Straight from Chef\'s bathroom floor.', category: 'mystery-gross' },
    { name: 'Dumpster Juice Cocktail', desc: 'Liquid from the bottom of a dumpster. Strained. Garnished with a lemon.', category: 'mystery-gross' },
    { name: 'Gym Sock Tea', desc: 'Steeped gym socks. One sugar. Served hot.', category: 'mystery-gross' },
    { name: 'Armpit Sweat Lemonade', desc: 'Lemonade with an extra ingredient. Salty.', category: 'mystery-gross' },
    { name: 'Banana Peel Soup', desc: 'Banana peels, fish heads, and soda cans. Boiled into a soup.', category: 'mystery-gross' },
    { name: 'Drain Hair Dumplings', desc: 'Dumplings stuffed with shower drain hair. Chewy.', category: 'mystery-gross' },
    { name: 'Floor Sweepings Pie', desc: 'Everything swept off the kitchen floor, baked in a pie crust.', category: 'mystery-gross' },
    { name: 'Dust Bunny Donuts', desc: 'Donuts rolled in actual dust bunnies instead of powdered sugar.', category: 'mystery-gross' },
    { name: 'Old Sponge Sashimi', desc: 'Sliced kitchen sponge. Aged. Served raw.', category: 'mystery-gross' },
    { name: 'Lint Roller Lollipop', desc: 'A used lint roller sheet wrapped around a stick. Lick.', category: 'mystery-gross' },
    { name: 'Mystery Can Roulette', desc: 'An unlabelled can. Could be anything. Probably bad.', category: 'mystery-gross' },
    { name: 'Used Bandaid Bisque', desc: 'A creamy soup with used bandaids floating in it.', category: 'mystery-gross' },
    { name: 'Toilet Seat Tartine', desc: 'Open-faced sandwich on a toilet seat-shaped bread. The bread touched a real one.', category: 'mystery-gross' },
    { name: 'Belly Button Lint Soup', desc: 'A warm broth of collected belly button lint. Seasoned.', category: 'mystery-gross' },
  ],
  'morally-questionable': [
    { name: 'Dolphin Wieners', desc: 'Hot dogs made from dolphin. They\'re your ocean friends.', category: 'morally-questionable' },
    { name: 'Endangered Fish Sushi', desc: 'Made from a fish that\'s almost extinct. Rolls beautifully.', category: 'morally-questionable' },
    { name: 'Baby Seal Jerky', desc: 'Dried baby seal meat. Those eyes will haunt you.', category: 'morally-questionable' },
    { name: 'Panda Bear Pepperoni', desc: 'Black and white pepperoni. From what you think.', category: 'morally-questionable' },
    { name: 'Whale Blubber Bites', desc: 'Cubed whale fat. Rubbery. The ethical implications are worse than the taste.', category: 'morally-questionable' },
    { name: 'Horse Burger', desc: 'A burger. From a horse. Not a unicorn. That\'s next course.', category: 'morally-questionable' },
    { name: 'Bald Eagle Eggs Benedict', desc: 'Poached eggs from a national symbol. With hollandaise.', category: 'morally-questionable' },
    { name: 'Koala Kebab', desc: 'Skewered koala. They were so cute. Now they\'re on a stick.', category: 'morally-questionable' },
    { name: 'Sea Turtle Soup', desc: 'An ancient creature, boiled. It lived 80 years for this.', category: 'morally-questionable' },
    { name: 'Manatee Meatball', desc: 'The sea cow, balled up. Gentle giants. Gentle flavour.', category: 'morally-questionable' },
    { name: 'Dodo Bird Drumstick', desc: 'They went extinct once. Chef found more. Somehow.', category: 'morally-questionable' },
    { name: 'Puffin Poutine', desc: 'Fries, gravy, cheese curds, and shredded puffin.', category: 'morally-questionable' },
    { name: 'Penguin Pot Pie', desc: 'Under the crust, a penguin. A whole one.', category: 'morally-questionable' },
    { name: 'Albatross Alfredo', desc: 'Pasta in a creamy albatross sauce. Bad luck to eat one.', category: 'morally-questionable' },
    { name: 'Narwhal Nuggets', desc: 'The unicorn of the sea, breaded and fried.', category: 'morally-questionable' },
  ],
};
export const BRUNCH_FOOD_CATEGORIES = Object.keys(BRUNCH_FOOD_POOL);
export const BRUNCH_EATOFF_DISH = { name: 'Cockroach Smoothie Shots', desc: 'Eight cockroaches blended into a chunky smoothie. Rich in vitamins. Fifteen shot glasses. Drink up.', category: 'eatoff' };

// ── Brunch reaction text pools ──
// Each reaction is a function: (playerName, pronounsObj, dishNameOrContext) => string
export const BRUNCH_REACTIONS = {
  eatSuccess: [
    (p, pr, dish) => `${p} held ${pr.posAdj} nose and swallowed. Done. Don't ask how it tasted.`,
    (p, pr, dish) => `${p} closed ${pr.posAdj} eyes, meditated for three seconds, and ate ${dish} like it was air.`,
    (p, pr, dish) => `${p} poured it straight down ${pr.posAdj} throat, bypassing tongue and taste buds entirely.`,
    (p, pr, dish) => `${p} chewed exactly once then swallowed whole. Speed over flavour.`,
    (p, pr, dish) => `${p} covered it in hot sauce first. "Now it just tastes like hot sauce."`,
    (p, pr, dish) => `${p} stared at the ceiling the entire time and refused to look down.`,
    (p, pr, dish) => `${p} ate it so fast nobody could tell if it was bravery or panic.`,
    (p, pr, dish) => `${p} put it between two crackers like that makes it a sandwich. It doesn't.`,
  ],
  eatArchetype: {
    'villain':    [(p, pr, dish) => `${p} ate ${dish} with a smirk, then looked at the other team. "Your turn."`,
                   (p, pr, dish) => `${p} finished the plate and licked ${pr.posAdj} fingers. A performance.`],
    'schemer':    [(p, pr, dish) => `${p} watched everyone else struggle first, then ate ${dish} like it was nothing. Calculated.`,
                   (p, pr, dish) => `${p} ate it quietly. No reaction. ${pr.Sub} ${pr.sub === 'they' ? 'want' : 'wants'} the other team to wonder.`],
    'mastermind': [(p, pr, dish) => `"It's just protein." ${p} ate ${dish} with clinical detachment.`,
                   (p, pr, dish) => `${p} analysed the dish, identified the least offensive bite, and worked systematically.`],
    'hero':       [(p, pr, dish) => `${p} grimaced but powered through. For the team.`,
                   (p, pr, dish) => `${p} ate it like a soldier eating rations. Not enjoyable. Not the point.`],
    'loyal-soldier': [(p, pr, dish) => `${p} looked at ${pr.posAdj} teammates, nodded, and ate. That's loyalty.`,
                      (p, pr, dish) => `${p} wasn't going to be the one to let the team down.`],
    'chaos-agent':[(p, pr, dish) => `${p} asked for seconds. Actually asked for seconds. The table went silent.`,
                   (p, pr, dish) => `${p} ate ${dish} and smiled. A real smile. That's the scary part.`],
    'hothead':    [(p, pr, dish) => `${p} slammed the plate after finishing. "NEXT."`,
                   (p, pr, dish) => `${p} angry-ate ${dish}. Every bite was a statement.`],
    'wildcard':   [(p, pr, dish) => `${p} took one look at ${dish} and said "I've had worse." Nobody knows if that's true.`,
                   (p, pr, dish) => `${p}'s reaction to ${dish} was... confusing. ${pr.Sub} hummed.`],
    'underdog':   [(p, pr, dish) => `Nobody expected ${p} to handle ${dish}. ${pr.Sub} did. The table noticed.`,
                   (p, pr, dish) => `${p} proved something today. ${pr.Sub} ate ${dish} without flinching.`],
    'floater':    [(p, pr, dish) => `${p} ate it without fanfare. Just... did it. Quietly effective.`,
                   (p, pr, dish) => `${p} finished before anyone noticed ${pr.sub} started.`],
    'showmancer': [(p, pr, dish) => `${p} gagged dramatically, recovered dramatically, and finished dramatically. The crowd loved it.`,
                   (p, pr, dish) => `${p} made eating ${dish} look like a performance. Horrified and glamorous at the same time.`],
    'social-butterfly': [(p, pr, dish) => `${p} rallied the table while eating. "We can DO this!" Mouth full.`,
                         (p, pr, dish) => `${p} turned eating ${dish} into a group moment. Everyone cheered ${pr.obj} on.`],
  },
  eatStruggle: [
    (p, pr, dish) => `${p} gagged mid-bite. Jaw locked. Teammates talked ${pr.obj} through opening ${pr.posAdj} mouth again.`,
    (p, pr, dish) => `${p} swallowed and couldn't speak for 30 seconds. Just... stared.`,
    (p, pr, dish) => `Tears streaming. "I'm not crying, my eyes are watering." Nobody believed ${p}.`,
    (p, pr, dish) => `${p} finished the plate then walked outside for a full minute.`,
    (p, pr, dish) => `${p} technically ate it — held it in ${pr.posAdj} mouth for the full countdown then spit it out after the point was scored.`,
    (p, pr, dish) => `${p}'s whole body shuddered. But ${pr.sub} kept it down. That counts.`,
    (p, pr, dish) => `${p} made a sound that wasn't a word. But ${pr.sub} made it through.`,
  ],
  eatDominant: [
    (p, pr, dish) => `${p} ate ${dish} and asked what's for dessert. The table couldn't believe it.`,
    (p, pr, dish) => `${p} finished first. Looked around. "Was that supposed to be hard?"`,
    (p, pr, dish) => `${p} ate ${dish} like it was gourmet. Either brave or broken.`,
    (p, pr, dish) => `${p} didn't just eat it — ${pr.sub} savoured it. The other team lost their nerve watching.`,
    (p, pr, dish) => `${p} cleaned the plate. Burped. Smiled. The power move of the day.`,
  ],
  eatFail: [
    (p, pr, dish) => `${p} tried. You could see ${pr.obj} trying. But ${dish} won.`,
    (p, pr, dish) => `${p} got it halfway to ${pr.posAdj} mouth and put it back down. "I can't."`,
    (p, pr, dish) => `${p} took one bite, turned green, and it came back up. The team loses this course.`,
    (p, pr, dish) => `${p} looked at ${dish} for ten seconds without moving. Then pushed the plate away.`,
    (p, pr, dish) => `${p} gagged before it touched ${pr.posAdj} lips. The smell alone was enough.`,
    (p, pr, dish) => `${p} held it in ${pr.posAdj} mouth for three seconds. Then lost the battle.`,
    (p, pr, dish) => `"Nope." ${p} didn't even try. Plate untouched. Course lost.`,
    (p, pr, dish) => `${p} put it in ${pr.posAdj} mouth. Chewed once. The texture was the end.`,
  ],
  refuseMoral: [
    (p, pr, dish) => `${p} looked at ${dish} and said "I won't eat that. I don't care if we lose."`,
    (p, pr, dish) => `"That's not food. That's an animal that trusts people." ${p} pushed the plate away.`,
    (p, pr, dish) => `${p} stood up. "I'm not eating ${dish}. Vote me out if you want."`,
  ],
  refuseDisgust: [
    (p, pr, dish) => `${p} physically can't. Opens mouth, gags, pushes plate away. The body said no.`,
    (p, pr, dish) => `${p} picked it up, smelled it, put it back down, and said "I have made my decision."`,
    (p, pr, dish) => `${p} looked at ${dish} so long the host asked if ${pr.sub} ${pr.sub === 'they' ? 'were' : 'was'} trying to kill it with ${pr.posAdj} eyes.`,
  ],
  refuseProtest: [
    (p, pr, dish) => `"This isn't food. This is a war crime." ${p} folded ${pr.posAdj} arms.`,
    (p, pr, dish) => `${p} tried to negotiate. "What if I eat half?" Host said no.`,
    (p, pr, dish) => `"I'd rather go to tribal." ${p} knows what refusing costs. Doesn't care.`,
  ],
  refuseHalfway: [
    (p, pr, dish) => `${p} started eating. Got halfway. The texture changed and ${pr.sub} couldn't finish. Team gets nothing.`,
    (p, pr, dish) => `${p} was so close. Three bites left. But the body quit before the brain did.`,
  ],
  convinced: [
    (p, pr, c) => `${c} put a hand on ${p}'s shoulder. "You can do this. For us." ${p} closed ${pr.posAdj} eyes and ate.`,
    (p, pr, c) => `${c} stared at ${p}. "If I ate it, you can eat it." Peer pressure won.`,
    (p, pr, c) => `${p} looked at ${c}, took a breath, and forced it down. Not gracefully. But done.`,
    (p, pr, c) => `"Fine. FINE." ${p} ate it aggressively, glaring at ${c} the entire time.`,
    (p, pr, c) => `${c} counted to three. ${p} ate on three. Teamwork, technically.`,
  ],
  convincedCrossTeam: [
    (p, pr, partner) => `${partner} mouthed "you got this" from the other team. ${p} ate. The whole room noticed.`,
    (p, pr, partner) => `${partner} gave ${p} a look that said everything. ${p} picked up the fork. The team behind ${partner} was not happy.`,
    (p, pr, partner) => `${p} looked at ${partner} across the table. ${partner} nodded. ${p} ate. Both teams had feelings about it.`,
  ],
  chainVomitTrigger: [
    (p, pr) => `${p} lost it. The sound alone was enough to start a chain reaction.`,
    (p, pr) => `${p}'s whole body rejected the food. Violently. The table went quiet, then went green.`,
    (p, pr) => `${p} didn't just fail — ${pr.sub} created a biohazard. What came out was worse than what went in.`,
  ],
  chainVomitAffected: [
    (p, pr) => `${p} was fine until ${pr.sub} saw that. Now ${pr.sub} ${pr.sub === 'they' ? 'aren\'t' : 'isn\'t'} fine.`,
    (p, pr) => `${p} tried to look away. Too late. The sympathy gag hit hard.`,
    (p, pr) => `${p} held it together for three seconds after the chain started. Then lost it.`,
  ],
  chainVomitResisted: [
    (p, pr) => `${p} somehow kept it together while everyone around ${pr.obj} lost it. Iron stomach.`,
    (p, pr) => `${p} gripped the table, breathed through ${pr.posAdj} nose, and refused to join the cascade.`,
  ],
  spectatorImpressed: [
    (p, pr, eater) => `Even ${p} had to respect what ${eater} just did.`,
    (p, pr, eater) => `${p} watched ${eater} eat that and said nothing. But the expression said everything.`,
  ],
  spectatorDisgusted: [
    (p, pr, eater) => `${p} turned away watching ${eater} eat. Couldn't handle it even as a spectator.`,
    (p, pr, eater) => `${p} covered ${pr.posAdj} eyes. Watching the other team eat was almost as bad as eating.`,
  ],
  spectatorTaunting: [
    (p, pr, eater) => `"That's it? We finished ours already." ${p} grinned at ${eater}.`,
    (p, pr, eater) => `${p} slow-clapped from the other side. The sarcasm was audible.`,
  ],
  spectatorNervous: [
    (p, pr, eater) => `${p} watched ${eater} succeed and went pale. They're next.`,
    (p, pr, eater) => `${p}'s confidence dropped watching ${eater} dominate that dish.`,
  ],
  postEat: [
    (p, pr) => `${p} sat very still and breathed through ${pr.posAdj} nose for a concerning amount of time.`,
    (p, pr) => `${p} made a noise that wasn't a word.`,
    (p, pr) => `${p} smiled. Nobody believed the smile.`,
    (p, pr) => `${p} burped and the entire table flinched.`,
    (p, pr) => `"Never speak of this again." ${p} pushed the empty plate away.`,
    (p, pr) => `${p} stared at the empty plate like it owed ${pr.obj} money.`,
  ],
};

// ── Phobia Factor — fear pools (face your phobia) ──
export const PHOBIA_POOL = {
  // Fears framed as real phobias — "I'm afraid of X" not "do this dare"
  // The challenge is: face the thing you said you're scared of
  'pain': [
    { title: 'Bees', desc: 'Stand still in a swarm of bees. Don\'t swat. Don\'t run.' },
    { title: 'Needles', desc: 'Get a (fake) injection. Sit still. Watch the needle go in.' },
    { title: 'Ice', desc: 'Submerge your hands in ice water until the timer runs out.' },
    { title: 'Fire', desc: 'Stand between two walls of flame. Stay centered. Don\'t flinch.' },
    { title: 'Jellyfish', desc: 'Walk into water where jellyfish are swimming. Stay in.' },
    { title: 'Ants', desc: 'Let fire ants crawl over your hands and arms. Don\'t shake them off.' },
    { title: 'Hail', desc: 'Stand under pelting hail. Small but deadly. Don\'t move.' },
    { title: 'Electric Eels', desc: 'Put your hand in a tank with electric eels. Keep it there.' },
    { title: 'Wasps', desc: 'Stand next to a wasp nest. Stay calm. Stay still.' },
    { title: 'Hot Sauce', desc: 'Eat a ghost pepper. Chew slowly. No water for 5 minutes.' },
    { title: 'Thorns', desc: 'Walk barefoot through a patch of thorny bushes.' },
    { title: 'Sunburn', desc: 'Sit in a heat box under intense UV lamps. Don\'t leave.' },
    { title: 'Freezing Cold', desc: 'Stand outside in freezing conditions wearing only a swimsuit.' },
    { title: 'Mosquitoes', desc: 'Sit in a mosquito-filled tent. No repellent. Don\'t scratch.' },
    { title: 'Stinging Nettles', desc: 'Walk through a field of stinging nettles. Arms out.' },
    { title: 'Boiling Water', desc: 'Hold your hand over a pot of boiling water. Steam rising. Don\'t pull away.' },
    { title: 'Paper Cuts', desc: 'Shuffle a deck of cards bare-handed. Faster. Don\'t stop.' },
    { title: 'Cactus', desc: 'Hug a cactus. Shirtless. 5 seconds.' },
  ],
  'fear': [
    { title: 'Snakes', desc: 'Pick up a live snake. Let it wrap around your arm.' },
    { title: 'Spiders', desc: 'Let a tarantula crawl across your hand and up your arm.' },
    { title: 'Being Buried Alive', desc: 'Get sealed in a glass box under sand. 5 minutes.' },
    { title: 'Heights', desc: 'Stand on the edge of a cliff and look straight down.' },
    { title: 'The Dark', desc: 'Get locked in a pitch-black room. Alone. 60 seconds.' },
    { title: 'Tight Spaces', desc: 'Crawl into a coffin-sized box. Lid closes. 10 seconds.' },
    { title: 'Deep Water', desc: 'Get lowered into deep, dark water in a rusty cage.' },
    { title: 'Rats', desc: 'Stand in a room while rats run around your feet.' },
    { title: 'Bats', desc: 'Sit in a pitch-black cave full of bats. Don\'t run.' },
    { title: 'Thunderstorms', desc: 'Sit through a simulated thunderstorm at deafening volume.' },
    { title: 'Clowns', desc: 'Sit in a room with a silent clown staring at you. 60 seconds.' },
    { title: 'Being Alone in the Woods', desc: 'Spend 6 hours alone in the forest. At night.' },
    { title: 'Wolves', desc: 'Make eye contact with a wolf. Don\'t look away.' },
    { title: 'Flying', desc: 'Ride in a rickety plane that shakes, dips, and nearly crashes.' },
    { title: 'Sumo Wrestlers', desc: 'Face off against a sumo wrestler. In the ring. Alone.' },
    { title: 'Mimes', desc: 'A mime follows you everywhere. Imitates everything you do. 10 minutes.' },
    { title: 'Zombies', desc: 'Walk through a zombie obstacle course. They grab at you.' },
    { title: 'Open Water', desc: 'Float in the middle of a lake. Can\'t see the bottom. Can\'t touch.' },
    { title: 'Dolls', desc: 'Sit in a room full of porcelain dolls. They stare. You sit.' },
    { title: 'The Dentist', desc: 'Sit in a dentist chair. Mouth open. Drill sounds. 60 seconds.' },
  ],
  'gross': [
    { title: 'Worms', desc: 'Jump into a pool full of worms. Let them crawl on you.' },
    { title: 'Leeches', desc: 'Sit in a barrel of water with leeches. They attach.' },
    { title: 'Cockroaches', desc: 'Let cockroaches crawl across your face and neck.' },
    { title: 'Vomit', desc: 'Watch the most disgusting compilation ever made. Don\'t gag.' },
    { title: 'Rotten Eggs', desc: 'Sit in a sauna that smells like rotten eggs. Breathe normally.' },
    { title: 'Maggots', desc: 'Let maggots crawl on your bare skin. Lay still.' },
    { title: 'Raw Meat', desc: 'Stick your hands into a bucket of raw organs. Fish around.' },
    { title: 'Slugs', desc: 'Let slugs crawl across your arms. They leave trails.' },
    { title: 'Sewage', desc: 'Wade through knee-deep swamp water. Don\'t think about what\'s in it.' },
    { title: 'Dumpsters', desc: 'Climb into a dumpster. Close the lid. Sit there.' },
    { title: 'Mold', desc: 'Eat a piece of bread covered in mold. Chew slowly.' },
    { title: 'Mud', desc: 'Get buried in thick mud up to your neck. Stay calm.' },
    { title: 'Blood', desc: 'Watch a (fake) blood draw happening on your own arm. Don\'t look away.' },
    { title: 'Bad Breath', desc: 'Let someone breathe directly in your face for 30 seconds.' },
    { title: 'Dirty Water', desc: 'Gargle swamp water. 10 seconds. Don\'t spit.' },
    { title: 'Fungus', desc: 'Walk barefoot through a mushroom-covered forest floor.' },
    { title: 'Hair', desc: 'Eat a meal with someone else\'s hair in it. Every bite.' },
    { title: 'Earwigs', desc: 'Let earwigs crawl on your ears. Stay perfectly still.' },
  ],
  'humiliation': [
    { title: 'Green Jelly', desc: 'Dive into a pool of green jelly from a high diving board.' },
    { title: 'Chickens', desc: 'Sit in a chicken pen for 3 minutes. They peck. They cluck. They judge.' },
    { title: 'Singing in Public', desc: 'Sing a love song in front of everyone. Badly. Loudly.' },
    { title: 'Bad Haircuts', desc: 'Let Chef cut your hair. With clippers. Whatever happens, happens.' },
    { title: 'Being Laughed At', desc: 'Stand on stage while the entire tribe laughs at you. 60 seconds.' },
    { title: 'Wearing a Costume', desc: 'Wear a ridiculous costume all day. Cow, chicken, baby — your choice.' },
    { title: 'Public Crying', desc: 'Watch the saddest video ever made in front of everyone. Don\'t hide it.' },
    { title: 'Dancing', desc: 'Dance alone in front of everyone. No music. Full commitment.' },
    { title: 'Embarrassing Secrets', desc: 'Tell the tribe your most embarrassing secret. The real one.' },
    { title: 'Nudity', desc: 'Strip down to your underwear and stand in front of everyone. 30 seconds.' },
    { title: 'Being Ignored', desc: 'Talk to the tribe for 2 minutes while they all pretend you don\'t exist.' },
    { title: 'Public Speaking', desc: 'Give a speech about yourself. 3 minutes. No notes. No stopping.' },
    { title: 'Being a Baby', desc: 'Wear a diaper. Suck a pacifier. Crawl around camp. 5 minutes.' },
    { title: 'Love Confessions', desc: 'Confess your love to the person you like least. Mean it. Or fake it convincingly.' },
    { title: 'Looking Ugly', desc: 'Wear the ugliest wig and the worst outfit available. All day. No mirror.' },
    { title: 'Being Vulnerable', desc: 'Tell the tribe what you\'re really afraid of losing. Not the game — in life.' },
    { title: 'Rejection', desc: 'Ask every tribe member if they like you. Listen to the honest answers.' },
    { title: 'Being the Joke', desc: 'Let the tribe roast you for 60 seconds. You can\'t respond.' },
  ],
};
export const PHOBIA_CATEGORIES = Object.keys(PHOBIA_POOL);

// S10 preset data
export const S10_TRIBES = [
  // CHAMPIONS
  { name:'Bowie',     tribe:'Champions' },
  { name:'Mickey',    tribe:'Champions' },
  { name:'Scott',     tribe:'Champions' },
  { name:'Zoey',      tribe:'Champions' },
  { name:'Gwen',      tribe:'Champions' },
  { name:'Cody',      tribe:'Champions' },
  { name:'Carrie',    tribe:'Champions' },
  { name:'Ryan',      tribe:'Champions' },
  { name:'Sanders',   tribe:'Champions' },
  // CONTENDERS
  { name:'Priya',     tribe:'Contenders' },
  { name:'Hicks',     tribe:'Contenders' },
  { name:'Jasmine',   tribe:'Contenders' },
  { name:'Josee',     tribe:'Contenders' },
  { name:'Sam',       tribe:'Contenders' },
  { name:'Brick',     tribe:'Contenders' },
  { name:'Stephanie', tribe:'Contenders' },
  { name:'Courtney',  tribe:'Contenders' },
  { name:'Tyler',     tribe:'Contenders' },
];
export const S10_BONDS_PRESET = [
  { a: 'Cody',  b: 'Carrie', type: 'unbreakable', note: 'S7 duo — built Lawa together, reached F3 as a pair' },
  { a: 'Bowie', b: 'Priya',  type: 'rival',       note: 'Former Unbreakable Bond — Bowie betrayed Priya at F7 in S9' },
  { a: 'Ryan',  b: 'Mickey', type: 'friend',      note: 'Ryan cast the S5 FTC tiebreaker that made Mickey champion. Mickey never repaid it.' },
  { a: 'Scott', b: 'Zoey',   type: 'rival',       note: 'Scott voted Zoey out in both S3 and S4. She voted FOR him at S3 FTC anyway.' },
];

// S9 preset — tribe assignments only; stats/archetype pulled from FRANCHISE_ROSTER at load time
export const S9_TRIBES = [
  // YELLOW TRIBE
  { name:'Bowie',      tribe:'Yellow' },
  { name:'Chase',      tribe:'Yellow' },
  { name:'Ripper',     tribe:'Yellow' },
  { name:'Scary Girl', tribe:'Yellow' },
  { name:'Nichelle',   tribe:'Yellow' },
  { name:'Axel',       tribe:'Yellow' },
  // RED TRIBE
  { name:'Zee',        tribe:'Red'    },
  { name:'Brightly',   tribe:'Red'    },
  { name:'Hicks',      tribe:'Red'    },
  { name:'Emmah',      tribe:'Red'    },
  { name:'Millie',     tribe:'Red'    },
  { name:'Caleb',      tribe:'Red'    },
  // BLUE TRIBE
  { name:'Wayne',      tribe:'Blue'   },
  { name:'Raj',        tribe:'Blue'   },
  { name:'Julia',      tribe:'Blue'   },
  { name:'Priya',      tribe:'Blue'   },
  { name:'MK',         tribe:'Blue'   },
  { name:'Damien',     tribe:'Blue'   },
];
// S9 is all newbies — no pre-game relationships
export const S9_BONDS_PRESET = [];

// ══════════════════════════════════════════════════════════════════════
// CONFIG FUNCTION (must come before state declarations)
// ══════════════════════════════════════════════════════════════════════

export function defaultConfig() {
  return {
    name: '', year: '', days: 39, gameMode: 'spectator',
    teams: 2, mergeAt: 12, finaleSize: 3, finaleFormat: 'traditional', finaleAssistants: false, jurySize: 9,
    ri: false, riReentryAt: 12, riFormat: 'redemption', riReturnPoints: 1, riSecondReturnAt: 5, journey: false, shotInDark: false,
    firemaking: false, tiebreakerMode: 'survivor', qem: false, idolRehide: false,
    advExpire: 4, foodWater: 'disabled', survivalDifficulty: 'casual',
    mole: 'disabled', molePlayers: [], moleCoordination: 'independent',
    romance: 'enabled',
    aftermath: 'disabled',
    fanVoteFrequency: 'disabled',
    host: 'Chris',
    advantages: Object.fromEntries(ADVANTAGES.map(a => [a.key, { enabled: a.default > 0, count: a.default }])),
    twistSchedule: [],
    tribes: [],  // [{ name, color }]
    popularityEnabled: true,
  };
}

// ══════════════════════════════════════════════════════════════════════
// STATE
// ══════════════════════════════════════════════════════════════════════

export let players       = [];
export let editingId     = null;
export let activeTab     = 'cast';
export let seasonConfig  = defaultConfig();
export let relationships = [];
export let editingRelId  = null;
export let activeRelType = 'neutral';
export let gs            = null;   // game state
export let gsCheckpoints = {};     // { [epNum]: deep clone of gs before that episode ran }
export let viewingEpNum  = null;   // which episode is displayed in run tab
export let selectedEpisodes  = new Set();
export let currentTwistFilter = 'all';
export let preGameAlliances = JSON.parse(localStorage.getItem('simulator_prealliances') || '[]');
export let editingAllianceId = null;
export let alliancePerm = 'normal';

// Setter functions for mutable state (used by window getters/setters in main.js)
export function setPlayers(v) { players = v; }
export function setEditingId(v) { editingId = v; }
export function setActiveTab(v) { activeTab = v; }
export function setSeasonConfig(v) { seasonConfig = v; }
export function setRelationships(v) { relationships = v; }
export function setEditingRelId(v) { editingRelId = v; }
export function setActiveRelType(v) { activeRelType = v; }
export function setGs(v) { gs = v; }
export function setGsCheckpoints(v) { gsCheckpoints = v; }
export function setViewingEpNum(v) { viewingEpNum = v; }
export function setSelectedEpisodes(v) { selectedEpisodes = v; }
export function setCurrentTwistFilter(v) { currentTwistFilter = v; }
export function setPreGameAlliances(v) { preGameAlliances = v; }
export function setEditingAllianceId(v) { editingAllianceId = v; }
export function setAlliancePerm(v) { alliancePerm = v; }

// ══════════════════════════════════════════════════════════════════════
// SERIALIZATION
// ══════════════════════════════════════════════════════════════════════

// JSON.parse loses Sets (they become {}). Restore them after any gs load.
export function repairGsSets(g) {
  if (!g) return;
  const SET_FIELDS = ['blowupHeatNextEp', 'knownIdolHoldersThisEp', 'knownIdolHoldersPersistent',
                      'knownAmuletHoldersThisEp', 'knownAmuletHoldersPersistent',
                      'socialBombHeatThisEp', 'injuredThisEp', 'scramblingThisEp', 'beastDrillsThisEp', 'lieTargetsThisEp',
                      'knownTeamSwapHolders', 'knownVoteBlockHolders', 'knownVoteStealHolders', 'knownSafetyNoPowerHolders', 'knownSoleVoteHolders', 'shotInDarkUsed', '_volunteerExileUsed'];
  SET_FIELDS.forEach(f => {
    if (g[f] instanceof Set) return; // already a Set
    if (Array.isArray(g[f])) { g[f] = new Set(g[f]); return; } // saved as array — restore
    g[f] = new Set();
  });
}
// Pre-save: convert Sets to arrays so JSON.stringify preserves them
export function prepGsForSave(g) {
  if (!g) return g;
  const SET_FIELDS = ['blowupHeatNextEp', 'knownIdolHoldersThisEp', 'knownIdolHoldersPersistent',
                      'knownAmuletHoldersThisEp', 'knownAmuletHoldersPersistent',
                      'socialBombHeatThisEp', 'injuredThisEp', 'scramblingThisEp', 'beastDrillsThisEp', 'lieTargetsThisEp',
                      'knownTeamSwapHolders', 'knownVoteBlockHolders', 'knownVoteStealHolders', 'knownSafetyNoPowerHolders', 'knownSoleVoteHolders', 'shotInDarkUsed', '_volunteerExileUsed'];
  SET_FIELDS.forEach(f => { if (g[f] instanceof Set) g[f] = [...g[f]]; });
  return g;
}

export function loadAll() {
  try { const c = localStorage.getItem('simulator_cast'); if (c) players = JSON.parse(c); } catch(e) { players = []; }
  try { const cfg = localStorage.getItem('simulator_config'); if (cfg) { const saved = JSON.parse(cfg); seasonConfig = { ...defaultConfig(), ...saved }; seasonConfig.advantages = { ...defaultConfig().advantages, ...(saved.advantages || {}) }; } } catch(e) {}
  try { const r = localStorage.getItem('simulator_rels'); if (r) relationships = JSON.parse(r); } catch(e) { relationships = []; }
  try { const g = localStorage.getItem('simulator_gs'); if (g) { gs = JSON.parse(g); repairGsSets(gs); } } catch(e) { gs = null; }
  // Restore per-episode checkpoints
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('simulator_cp_')) {
        const epNum = Number(key.replace('simulator_cp_', ''));
        if (epNum) { gsCheckpoints[epNum] = JSON.parse(localStorage.getItem(key)); repairGsSets(gsCheckpoints[epNum]); }
      }
    }
  } catch(e) {}
}


// ══════════════════════════════════════════════════════════════════════
// DEFAULT_STATS, CHALLENGE_DB, REWARD_POOL — shared engine constants
// ══════════════════════════════════════════════════════════════════════

export const DEFAULT_STATS = { physical:5, endurance:5, mental:5, social:5, strategic:5, loyalty:5, boldness:5, intuition:5, temperament:5 };

export const CHALLENGE_DB = [
  // ── PHYSICAL ── mode: 'team'=team only, 'individual'=individual only, 'both'=either
  { name:'On the Block',        desc:'Tribes race to chop through a log pile, stack the pieces into a staircase, and raise a flag. Brute effort from start to finish.',                                           category:'physical',  mode:'team', stat:s=>s.physical },
  { name:'Heavy Load',           desc:'Each player hauls a weighted crate across a series of obstacles and delivers it to a platform. The tribe that keeps everyone moving wins.',                                  category:'physical',  mode:'both', stat:s=>s.physical*0.7+s.endurance*0.3 },
  { name:'Knock \'Em Down',      desc:'Tribes square off on floating platforms, using padded bags to push opponents into the water. Last tribe with a player standing wins.',                                      category:'physical',  mode:'both', stat:s=>s.physical*0.6+s.boldness*0.4 },
  { name:'Crash the Course',     desc:'Sprint through a full obstacle course — over walls, under nets, through mud pits — to retrieve a flag and race back. Speed and strength decide it.',                        category:'physical',  mode:'both', stat:s=>s.physical },
  { name:'Blood in the Water',   desc:'Wade through chest-deep water hauling a massive supply crate to shore, then drag it up a ramp to the platform. A test of raw power.',                                        category:'physical',  mode:'individual', stat:s=>s.physical*0.6+s.endurance*0.4 },
  { name:'Sumo at Sea',          desc:'One-on-one matchups on a floating platform — first to knock the opponent into the water scores a point. First tribe to five points wins immunity.',                          category:'physical',  mode:'both', stat:s=>s.physical*0.6+s.boldness*0.4 },
  { name:'Log Rolling Relay',    desc:'Race up a hill, cut ropes to free logs, ride them back down while snatching pennants. Most pennants wins.',                                                                category:'physical',  mode:'individual', stat:s=>s.physical*0.6+s.endurance*0.2+s.boldness*0.2 },
  { name:'Dodgeball',            desc:'Full-tribe dodgeball played in elimination rounds. It\'s chaotic, physical, and ends exactly the way you\'d expect it to.',                                                category:'physical',  mode:'both', stat:s=>s.physical*0.5+s.endurance*0.3+s.boldness*0.2 },
  { name:'Capture the Flag',     desc:'A paintball-style capture-the-flag game across a jungle course. Speed, coordination, and a little strategy all have a say in the outcome.',                                category:'physical',  mode:'both', stat:s=>s.physical*0.5+s.strategic*0.3+s.mental*0.2 },
  { name:'The Gauntlet',         desc:'Sprint through a course while obstacles are hurled from the sidelines. Reach the end and fill a bucket before the other tribe does.',                                       category:'physical',  mode:'both', stat:s=>s.physical*0.5+s.endurance*0.3+s.boldness*0.2 },
  { name:'Tug of War',           desc:'Two tribes face off in a classic tug of war over a mud pit. Pure strength and teamwork. Losers get dragged through the mud.',                                                category:'physical',  mode:'team', stat:s=>s.physical*0.6+s.endurance*0.3+s.loyalty*0.1 },
  { name:'Wreck It',             desc:'Smash through wooden walls, crawl through tunnels, and carry a heavy crate to the finish. First to complete the course wins.',                                                   category:'physical',  mode:'both', stat:s=>s.physical*0.6+s.endurance*0.2+s.boldness*0.2 },
  { name:'Chopping Block',       desc:'Each player chops through a rope holding a weight. First to release their weight drops a flag. Speed and power — nothing else.',                                              category:'physical',  mode:'both', stat:s=>s.physical*0.7+s.endurance*0.3 },
  { name:'Tackle Zone',          desc:'Players race to grab a ball and bring it back to their zone while defenders try to stop them. Full contact. Full chaos.',                                                     category:'physical',  mode:'both', stat:s=>s.physical*0.5+s.boldness*0.3+s.endurance*0.2 },
  // ── ENDURANCE ──
  { name:'Last One Standing',    desc:'Hold a bucket of water above your head. Lower your arms and you\'re out. The last player standing wins immunity for their tribe.',                                          category:'endurance', mode:'individual', stat:s=>s.endurance },
  { name:'Uncomfortably Numb',   desc:'Stand barefoot on a narrow, tapered post above water. Platforms shrink at intervals. The last person still standing wins.',                                                category:'endurance', mode:'individual', stat:s=>s.endurance*0.7+s.mental*0.3 },
  { name:'Dead Weight',          desc:'Hold a bag of weight overhead as the load increases with each elimination. The last player still holding wins.',                                                            category:'endurance', mode:'both', stat:s=>s.endurance*0.6+s.physical*0.4 },
  { name:'Awake-A-Thon',         desc:'Stay awake the longest. No sitting. No lying down. The environment does the rest — this one comes down to pure mental discipline.',                                        category:'endurance', mode:'both', stat:s=>s.endurance*0.5+s.mental*0.5 },
  { name:'Hanging On',           desc:'Grip a horizontal bar as long as possible while conditions worsen around you. Last player still holding wins immunity.',                                                    category:'endurance', mode:'both', stat:s=>s.endurance*0.7+s.physical*0.3 },
  { name:'Fire & Ice',           desc:'Tribes keep a fire burning through the night. First tribe whose fire goes out loses. Fall asleep and you\'re disqualified from tending it.',                               category:'endurance', mode:'team', stat:s=>s.endurance*0.5+s.loyalty*0.3+s.mental*0.2 },
  { name:'The Long Haul',        desc:'Tribes paddle an outrigger canoe to a distant buoy, retrieve pieces, then paddle back. Distance and physical demand separate the strong from the spent.',                   category:'endurance', mode:'team', stat:s=>s.endurance*0.6+s.physical*0.4 },
  { name:'Going in Circles',     desc:'Ride a carousel platform that speeds up, slows down, and reverses direction without warning. Last player not to fall off wins.',                                            category:'endurance', mode:'both', stat:s=>s.endurance*0.5+s.physical*0.3+s.mental*0.2 },
  { name:'Pain Cave',            desc:'Submerge in ice-cold water up to your neck. Last player still in wins. Your body wants out. Your mind has to say no.',                                                        category:'endurance', mode:'team', stat:s=>s.endurance*0.5+s.temperament*0.3+s.mental*0.2 },
  { name:'Weight of the World',  desc:'Hold a pole across your shoulders while weight is added every five minutes. Drop the pole and you\'re done. Last one holding wins.',                                          category:'endurance', mode:'both', stat:s=>s.endurance*0.5+s.physical*0.4+s.mental*0.1 },
  { name:'Dig Deep',             desc:'Dig through sand to find buried puzzle pieces, then solve the puzzle. Stamina to dig, brains to solve. The combination matters.',                                             category:'endurance', mode:'both', stat:s=>s.endurance*0.4+s.physical*0.3+s.mental*0.3 },
  { name:'When It Rains',        desc:'Stand on a platform while buckets of water are dumped on you at random intervals. No warning. Last player still standing wins.',                                               category:'endurance', mode:'both', stat:s=>s.endurance*0.5+s.temperament*0.3+s.boldness*0.2 },
  // ── BALANCE ──
  { name:'Walk the Plank',       desc:'Balance on a narrow beam over water and use your body to knock opponents off. Last person still on the beam wins.',                                                        category:'balance',   mode:'individual', stat:s=>s.endurance*0.6+s.physical*0.4 },
  { name:'Steady as She Goes',   desc:'Two tribe members carry a ball on a shared platform — no hands. Navigate a course together without dropping it. Any drop means starting over.',                            category:'balance',   mode:'team', stat:s=>s.endurance*0.5+s.physical*0.3+s.social*0.2 },
  { name:'On the Edge',          desc:'Stand on a shrinking ledge above water. At intervals, move down to a smaller platform. Last player standing wins.',                                                        category:'balance',   mode:'individual', stat:s=>s.endurance*0.7+s.mental*0.3 },
  { name:'Stacked',              desc:'Build the tallest stack of wooden blocks using only a long paddle — no hands. Tallest stack still standing after ten seconds wins.',                                        category:'balance',   mode:'both', stat:s=>s.endurance*0.4+s.mental*0.4+s.physical*0.2 },
  { name:'Sinking Fast',         desc:'Players stand on floating platforms that slowly deflate over time. Last player still elevated wins individual immunity.',                                                   category:'balance',   mode:'individual', stat:s=>s.endurance*0.6+s.physical*0.4 },
  { name:'Tightrope',            desc:'Cross a tightrope suspended over water while carrying a stack of blocks. Drop a block and you start over. Steadiest hands win.',                                               category:'balance',   mode:'individual', stat:s=>s.endurance*0.5+s.mental*0.3+s.temperament*0.2 },
  { name:'House of Cards',       desc:'Build a tower of cards on a wobbly table. Tallest tower after 10 minutes wins. One sneeze and it\'s over.',                                                                    category:'balance',   mode:'individual', stat:s=>s.temperament*0.4+s.mental*0.3+s.endurance*0.3 },
  // ── PUZZLE ──
  { name:'Scrambled',            desc:'One tribe member directs blindfolded teammates through a course to retrieve pieces. First tribe to fully assemble the puzzle wins.',                                        category:'puzzle',    mode:'team', stat:s=>s.mental*0.5+s.social*0.3+s.strategic*0.2 },
  { name:'By the Numbers',       desc:'Retrieve weighted bags from an obstacle course — numbers on them unlock a combination. First tribe to open the lock and release their flag wins.',                          category:'puzzle',    mode:'team', stat:s=>s.mental*0.6+s.physical*0.4 },
  { name:'Memory Lane',          desc:'Study a sequence of symbols, then replicate it from memory. One mistake and you start over. Speed and precision both matter.',                                             category:'puzzle',    mode:'both', stat:s=>s.mental*0.7+s.strategic*0.3 },
  { name:'Break the Code',       desc:'Retrieve lettered bags from a field and use the letters to spell out a hidden word. First tribe to deliver the correct word wins.',                                        category:'puzzle',    mode:'team', stat:s=>s.mental*0.6+s.physical*0.4 },
  { name:'Reconstruct',          desc:'Assemble a disassembled structure from scattered pieces with no reference guide. First complete and standing reconstruction wins.',                                        category:'puzzle',    mode:'both', stat:s=>s.mental*0.7+s.strategic*0.3 },
  { name:'Signal Fire',          desc:'Decode a sequence of flag signals into a hidden phrase. First tribe to correctly deliver the message wins.',                                                               category:'puzzle',    mode:'team', stat:s=>s.mental*0.6+s.intuition*0.4 },
  { name:'Under Pressure',       desc:'One player is lowered underwater to retrieve submerged pieces while their partner guides them using a map and headset.',                                                   category:'puzzle',    mode:'team', stat:s=>s.mental*0.5+s.endurance*0.3+s.social*0.2 },
  { name:'Slippery Slope',       desc:'Slide down a greased hill to collect numbered tiles, then carry them back up to solve a puzzle at the top. Faster sliding means earlier access.',                          category:'puzzle',    mode:'both', stat:s=>s.mental*0.5+s.physical*0.3+s.endurance*0.2 },
  { name:'Domino Effect',         desc:'Set up a chain of dominoes that must knock over a flag at the end. One wrong placement and the chain breaks. Precision under pressure.',                                    category:'puzzle',    mode:'individual', stat:s=>s.mental*0.4+s.temperament*0.3+s.endurance*0.3 },
  { name:'Countdown',            desc:'A series of math puzzles that get harder every round. Solve them in order. First player to complete all five wins.',                                                           category:'puzzle',    mode:'individual', stat:s=>s.mental*0.6+s.strategic*0.2+s.endurance*0.2 },
  { name:'Jigsaw Sprint',        desc:'Race to a station, grab puzzle pieces, race back. You can only carry three at a time. First to complete their puzzle wins. Strategy meets speed.',                             category:'puzzle',    mode:'both', stat:s=>s.mental*0.4+s.physical*0.3+s.strategic*0.3 },
  { name:'Crack the Safe',       desc:'Players receive clue after clue pointing to a combination. First to crack the code and open the safe wins. Every wrong guess adds a time penalty.',                           category:'puzzle',    mode:'individual', stat:s=>s.mental*0.4+s.intuition*0.3+s.strategic*0.3 },
  // ── SOCIAL ──
  { name:'Truth or Dare',        desc:'Contestants are assigned dares one by one. Refuse and your tribe takes a time penalty. Last tribe to refuse wins.',                                                        category:'social',    mode:'both', stat:s=>s.boldness*0.5+s.social*0.3+s.endurance*0.2 },
  { name:'Questionnaire',        desc:'Answer questions about your tribemates. The more your answers match the majority, the more points you score. Knowing people pays out here.',                               category:'social',    mode:'individual', stat:s=>s.social*0.5+s.intuition*0.3+s.mental*0.2 },
  { name:'Who Said What',        desc:'Match quotes to the castaways who said them. A test of how closely you\'ve actually been listening to the people around you.',                                             category:'social',    mode:'individual', stat:s=>s.social*0.4+s.intuition*0.4+s.mental*0.2 },
  { name:'Wheel of Misfortune',  desc:'Spin wheels to randomly pair castaways, then complete the center action — compliment, truth, or dare. Refuse and your tribe loses a point.',                               category:'social',    mode:'both', stat:s=>s.boldness*0.5+s.social*0.5 },
  { name:'Cooking for Survival', desc:'Two players cook while the rest gather assigned ingredients. The dish is judged on quality — and the losing tribe eats whatever they made.',                                category:'social',    mode:'team', stat:s=>s.social*0.4+s.loyalty*0.3+s.mental*0.3 },
  // ── MIXED ──
  { name:'Relay of Pain',        desc:'A multi-stage relay: swim to a platform, climb a rope wall, cross a balance beam, sprint to a flag. The tribe that syncs up fastest wins.',                                category:'mixed',     mode:'team', stat:s=>(s.physical+s.endurance+s.mental)/3 },
  { name:'Into the Dark',        desc:'Navigate a pitch-black cave using only touch and sound to find the exit. One wrong turn costs time — and time is the only currency.',                                      category:'mixed',     mode:'both', stat:s=>s.mental*0.5+s.endurance*0.3+s.intuition*0.2 },
  { name:'Build It Up',          desc:'Construct a functional raft from limited materials, then paddle it to a buoy and back. A slow raft is dead weight — the build matters as much as the paddle.',             category:'mixed',     mode:'team', stat:s=>(s.physical+s.endurance+s.mental)/3 },
  { name:'Maze of Fear',         desc:'Navigate a maze while confronting obstacles representing each player\'s worst fear. Refuse and your tribe takes a time penalty.',                                          category:'mixed',     mode:'both', stat:s=>s.mental*0.4+s.boldness*0.3+s.endurance*0.3 },
  { name:'Three-Part Triathlon', desc:'Swim to a buoy, scale a wall, then sprint to the finish. Three disciplines tested in sequence — all three have to hold up.',                                               category:'mixed',     mode:'both', stat:s=>(s.physical+s.endurance)/2 },
  { name:'Scavenger Hunt',       desc:'Race through the jungle following a series of clues to a hidden cache. Speed helps — but you don\'t move unless you can read the room.',                                  category:'mixed',     mode:'both', stat:s=>s.mental*0.4+s.physical*0.4+s.intuition*0.2 },
  { name:'Beast Mode',           desc:'Crawl under nets, smash through walls, climb a cargo rope, then solve a puzzle at the top. The tribe that doesn\'t quit wins.',                                           category:'mixed',     mode:'team', stat:s=>(s.physical+s.endurance+s.mental)/3 },
  { name:'Night Hunt',           desc:'Players search the jungle at night for a hidden flag — no torches provided. The first player back wins. Whatever you hear in the dark is your problem.',                  category:'mixed',     mode:'individual', stat:s=>s.physical*0.3+s.mental*0.3+s.intuition*0.2+s.boldness*0.2 },
  { name:'Firestarting Duel',    desc:'Two players face off head-to-head: first to light a fire using flint and steel wins. Patience and technique count for more than speed.',                                  category:'mixed',     mode:'individual', stat:s=>s.endurance*0.4+s.mental*0.4+s.physical*0.2 },
  { name:'Drop Zone',            desc:'Race through an underwater course to retrieve bags, then use the contents to solve a rope puzzle on shore. The water slows everything — plan for it.',                    category:'mixed',     mode:'team', stat:s=>s.physical*0.4+s.endurance*0.3+s.mental*0.3 },
  { name:'Pairs and Perils',     desc:'Randomly paired tribe members complete a gauntlet of mini-challenges: cliff jump, tug of war, fire-starting. Each pair\'s result feeds the tribe total.',                category:'mixed',     mode:'team', stat:s=>(s.physical+s.endurance+s.social)/3 },
  { name:'Sandbag Sabotage',     desc:'Players race to retrieve sandbags buried across a large pit and load them into their tribe\'s chute. Most sandbags loaded before time runs out wins.',                    category:'mixed',     mode:'team', stat:s=>s.physical*0.6+s.endurance*0.4 },
  { name:'Find the Exit',        desc:'Navigate a pitch-dark mineshaft while avoiding traps and obstacles. The first tribe to get all members to the surface wins.',                                              category:'mixed',     mode:'team', stat:s=>s.mental*0.4+s.endurance*0.3+s.boldness*0.3 },
  // ── BOLDNESS-HEAVY ──
  { name:'Leap of Faith',       desc:'Jump off increasingly high platforms into water. Each round the height doubles. Last person still jumping wins.',                                                                  category:'mixed',     mode:'individual', stat:s=>s.boldness*0.5+s.physical*0.3+s.endurance*0.2 },
  { name:'All or Nothing',      desc:'Players bet portions of their rice supply on challenge performance. Go big or go home. The boldest bets with the best results win.',                                              category:'mixed',     mode:'individual', stat:s=>s.boldness*0.5+s.strategic*0.3+s.mental*0.2 },
  { name:'Cliff Dive Relay',    desc:'Teams race along a cliff trail, each member must jump at a designated point. Refuse to jump and your team takes a time penalty.',                                                 category:'physical',  mode:'team', stat:s=>s.boldness*0.4+s.physical*0.4+s.endurance*0.2 },
  { name:'Double Dare',         desc:'Players challenge each other to escalating dares. Refuse and you\'re out. Last player standing wins. Heart matters more than muscle.',                                            category:'social',    mode:'individual', stat:s=>s.boldness*0.5+s.social*0.3+s.endurance*0.2 },
  // ── INTUITION-HEAVY ──
  { name:'Spy Game',            desc:'Players are given 60 seconds to study a detailed scene, then answer questions about what they saw. Observation is everything.',                                                    category:'puzzle',    mode:'individual', stat:s=>s.intuition*0.5+s.mental*0.4+s.strategic*0.1 },
  { name:'Liar\'s Table',       desc:'Each player makes two true statements and one lie. The tribe votes on which is the lie. Best liars and best detectors score points.',                                             category:'social',    mode:'both', stat:s=>s.intuition*0.4+s.social*0.3+s.strategic*0.3 },
  { name:'Blindfolded Trust',   desc:'One player directs their blindfolded partner through an obstacle course using only voice commands. Trust and awareness decide it.',                                                category:'social',    mode:'team', stat:s=>s.intuition*0.4+s.social*0.4+s.endurance*0.2 },
  { name:'Read the Room',       desc:'Players privately rank each other on various traits. The player whose rankings most closely match the group consensus wins.',                                                      category:'social',    mode:'individual', stat:s=>s.intuition*0.5+s.social*0.3+s.mental*0.2 },
  // ── STRATEGIC-HEAVY ──
  { name:'Auction Blitz',       desc:'A speed auction — items flash on screen for 3 seconds. Bid too high, you lose points. Bid too low, you miss it. Best portfolio wins.',                                           category:'puzzle',    mode:'individual', stat:s=>s.strategic*0.5+s.mental*0.3+s.boldness*0.2 },
  { name:'Alliance Roulette',   desc:'Players secretly pick partners. Matched pairs earn points. Unmatched players lose points. It\'s a game theory nightmare.',                                                        category:'social',    mode:'individual', stat:s=>s.strategic*0.4+s.social*0.3+s.intuition*0.3 },
  { name:'The Negotiation',     desc:'Players negotiate trades of challenge advantages in real-time. Best deal at the end of 5 minutes wins. Pure strategy under pressure.',                                            category:'social',    mode:'individual', stat:s=>s.strategic*0.4+s.social*0.4+s.boldness*0.2 },
  { name:'Chess Rush',          desc:'A giant life-sized board game. Players move through squares making strategic choices — shortcuts have risks, safe paths take longer.',                                             category:'mixed',     mode:'both', stat:s=>s.strategic*0.4+s.mental*0.3+s.boldness*0.3 },
  // ── TEMPERAMENT / COMPOSURE ──
  { name:'Keep Your Cool',      desc:'Players must complete a simple task while the host and eliminated players try to distract, taunt, and provoke them. Lose your temper, you\'re out.',                              category:'endurance', mode:'team', stat:s=>s.temperament*0.5+s.endurance*0.3+s.mental*0.2 },
  { name:'Patience is Power',   desc:'A timed challenge where doing NOTHING scores points. Every 5 minutes, players can choose to act — but acting wrong costs everything.',                                            category:'endurance', mode:'individual', stat:s=>s.temperament*0.4+s.strategic*0.3+s.endurance*0.3 },
  { name:'Pressure Cooker',     desc:'Players answer questions while standing on shrinking platforms. Wrong answer = platform shrinks. Panic and you fall. Stay calm and you win.',                                      category:'mixed',     mode:'individual', stat:s=>s.temperament*0.3+s.mental*0.3+s.endurance*0.2+s.boldness*0.2 },
  // ── LOYALTY / SOCIAL DILEMMA ──
  { name:'Prisoner\'s Dilemma', desc:'Paired players secretly choose to share or steal points. Both share = both score. Both steal = both lose. One steals = stealer wins big.',                                        category:'social',    mode:'individual', stat:s=>s.loyalty*0.4+s.strategic*0.3+s.social*0.3 },
  { name:'Trust Fall Relay',    desc:'Teammates must catch falling partners from increasing heights. Drop someone and your tribe loses a point. Trust is the only equipment.',                                           category:'social',    mode:'team', stat:s=>s.loyalty*0.3+s.social*0.3+s.physical*0.2+s.boldness*0.2 },
  // ── CREATIVE / TOTAL DRAMA STYLE ──
  { name:'Talent Show',         desc:'Each tribe performs a talent show judged by the host. Coordination, creativity, and showmanship all count. The best performance wins.',                                            category:'social',    mode:'team', stat:s=>s.social*0.4+s.boldness*0.3+s.mental*0.3 },
  { name:'Gross Food Challenge',desc:'Eat increasingly disgusting local delicacies. Last player still eating wins. It\'s not about taste — it\'s about willpower.',                                                     category:'endurance', mode:'both', stat:s=>s.boldness*0.4+s.endurance*0.4+s.temperament*0.2 },
  { name:'Escape Room',         desc:'Tribes are locked in a themed room with puzzles, locks, and hidden clues. First tribe to escape wins. Brains over brawn.',                                                        category:'puzzle',    mode:'team', stat:s=>s.mental*0.4+s.intuition*0.3+s.strategic*0.3 },
  { name:'Wipeout',             desc:'A massive obstacle course with spinning arms, foam walls, and slippery surfaces. Fall and you restart. First through wins. Chaos guaranteed.',                                     category:'physical',  mode:'both', stat:s=>s.physical*0.3+s.endurance*0.3+s.boldness*0.2+s.temperament*0.2 },
  { name:'Freeze Frame',        desc:'Players must hold a pose perfectly still. Any movement detected by judges eliminates you. Last player frozen wins. Endurance meets discipline.',                                   category:'endurance', mode:'individual', stat:s=>s.endurance*0.4+s.temperament*0.4+s.mental*0.2 },
  { name:'Treasure Hunt',       desc:'Clues are hidden around camp. Each clue leads to the next. First player to find the final treasure wins. Speed, smarts, and gut instinct.',                                       category:'mixed',     mode:'individual', stat:s=>s.intuition*0.3+s.physical*0.3+s.mental*0.2+s.strategic*0.2 },
  { name:'Human Slingshot',     desc:'Players launch themselves via a giant slingshot at targets in the water. Closest to the bullseye wins. It\'s ridiculous. It\'s Total Drama.',                                     category:'physical',  mode:'individual', stat:s=>s.boldness*0.4+s.physical*0.3+s.endurance*0.3 },
  { name:'Confessional Recall', desc:'Players are quizzed on things their tribemates said in confessionals throughout the season. The player who remembers the most wins.',                                              category:'puzzle',    mode:'individual', stat:s=>s.intuition*0.4+s.social*0.3+s.mental*0.3 },
  // ── TOTAL DRAMA STYLE (BATCH 2) ──
  // — balance —
  { name:'Jelly Beam',           desc:'Cross a balance beam slathered in industrial jelly. Fall off and you land in a kiddie pool of mystery slime. First tribe to get everyone across wins.',                               category:'balance',   mode:'team', stat:s=>s.endurance*0.5+s.physical*0.3+s.temperament*0.2 },
  { name:'Stack Attack',         desc:'Stack crates on a wobbly platform while standing on a spinning disc. Tallest tower still standing after the buzzer wins. Gravity is not your friend.',                                category:'balance',   mode:'individual', stat:s=>s.endurance*0.4+s.mental*0.3+s.temperament*0.3 },
  { name:'Dizzy Dash',           desc:'Spin around a baseball bat ten times, then sprint across a balance beam to place a flag. First tribe with all flags placed wins. Expect collisions.',                                 category:'balance',   mode:'both', stat:s=>s.endurance*0.4+s.physical*0.3+s.temperament*0.3 },
  { name:'Plate Spinner',        desc:'Keep as many plates spinning on poles as possible. Every 30 seconds a new plate is added. Drop one and you\'re out. Last player still spinning wins.',                                category:'balance',   mode:'individual', stat:s=>s.endurance*0.4+s.mental*0.3+s.temperament*0.3 },
  { name:'Surfboard Showdown',   desc:'Stand on a surfboard mounted on a rolling log. Opponents throw water balloons at you. Last player still on their board wins immunity.',                                               category:'balance',   mode:'individual', stat:s=>s.endurance*0.5+s.physical*0.3+s.boldness*0.2 },
  { name:'Egg Head',             desc:'Balance an egg on a spoon while navigating an obstacle course. Break your egg and you restart with a new one. First to finish with an intact egg wins.',                               category:'balance',   mode:'both', stat:s=>s.temperament*0.4+s.endurance*0.3+s.physical*0.3 },
  // — social —
  { name:'Roast Battle',         desc:'Players take turns roasting each other in front of the tribe. The host judges on wit, delivery, and crowd reaction. Best roaster wins. Feelings are optional.',                       category:'social',    mode:'individual', stat:s=>s.social*0.4+s.boldness*0.3+s.mental*0.3 },
  { name:'Impression Idol',      desc:'Each player does an impression of another castaway. The tribe votes on accuracy. Most votes wins. Getting impersonated badly hurts more than losing.',                                 category:'social',    mode:'individual', stat:s=>s.social*0.5+s.intuition*0.3+s.boldness*0.2 },
  { name:'Secret Ballot',        desc:'Players anonymously answer brutal questions about each other — who\'s the weakest, who\'s two-faced, who\'d you vote out right now. Most correct guesses about the majority wins.',    category:'social',    mode:'individual', stat:s=>s.intuition*0.4+s.social*0.3+s.strategic*0.3 },
  { name:'Buddy System',         desc:'Tribes are handcuffed in pairs for the entire challenge. Complete an obstacle course while literally attached to someone. Coordination — or lack of it — decides everything.',         category:'social',    mode:'team', stat:s=>s.social*0.3+s.physical*0.3+s.endurance*0.2+s.temperament*0.2 },
  // — physical —
  { name:'Demolition Derby',     desc:'Players ride shopping carts down a hill through destructible walls. Farthest distance without wiping out wins. Safety was never the point.',                                           category:'physical',  mode:'individual', stat:s=>s.boldness*0.4+s.physical*0.3+s.endurance*0.3 },
  { name:'Mud Pit Melee',        desc:'Tribes wrestle in a massive mud pit trying to retrieve flags planted on the opposite side. First tribe to collect all their flags wins. Expect chaos.',                                category:'physical',  mode:'team', stat:s=>s.physical*0.5+s.endurance*0.3+s.boldness*0.2 },
  // — endurance —
  { name:'Bug Burial',           desc:'Lie in a coffin-shaped box while it slowly fills with insects. Last player to tap out wins. Your skin crawls. Your brain screams. Stay anyway.',                                      category:'endurance', mode:'individual', stat:s=>s.endurance*0.4+s.temperament*0.3+s.boldness*0.3 },
  { name:'Spin Cycle',           desc:'Hang onto a giant rotating wheel that speeds up every minute. Centrifugal force does the rest. Last player clinging on wins.',                                                        category:'endurance', mode:'both', stat:s=>s.endurance*0.5+s.physical*0.3+s.boldness*0.2 },
  // — puzzle —
  { name:'Bomb Defusal',         desc:'Each player has a fake bomb with colored wires. The host reads cryptic clues — cut the right wire in order or your paint bomb explodes. Last player not splattered wins.',             category:'puzzle',    mode:'individual', stat:s=>s.mental*0.4+s.intuition*0.3+s.temperament*0.3 },
  { name:'Total Recall',         desc:'Study a ridiculous crime scene for 60 seconds — an overturned canoe, 14 rubber ducks, a pirate flag. Then answer rapid-fire questions. Most correct answers wins.',                   category:'puzzle',    mode:'both', stat:s=>s.mental*0.4+s.intuition*0.4+s.strategic*0.2 },
  // — mixed —
  { name:'Fear Factor',          desc:'Three rounds of escalating fear stunts: eat something vile, jump from a height, endure something crawling on you. Points for completing each. Most points wins.',                     category:'mixed',     mode:'both', stat:s=>s.boldness*0.4+s.endurance*0.3+s.temperament*0.3 },
  { name:'Wrecking Ball',        desc:'Swing on a rope over a mud pit to knock down targets on the other side. Miss your target and you faceplant in the mud. Most targets down wins.',                                      category:'mixed',     mode:'both', stat:s=>s.physical*0.4+s.boldness*0.3+s.endurance*0.3 },
];

export const REWARD_POOL = [
  { id:'feast',     phase:'any',        label:'Feast',             desc:'A full spread of hot food, cold drinks, and enough to eat until they forget they are playing a game.' },
  { id:'comfort',   phase:'any',        label:'Comfort Package',   desc:'Hammock, blankets, pillows, and enough snacks to almost forget where they are.' },
  { id:'overnight', phase:'any',        label:'Overnight Trip',    desc:'A night away from camp — real beds, hot showers, full meals. The game pauses. The game never pauses.' },
  { id:'supplies',  phase:'pre-merge',  label:'Supply Cache',      desc:'Rope, tools, extra tarp, and enough rice to last the week.' },
  { id:'clue',      phase:'post-merge', label:'Idol Clue',         desc:'An envelope. Inside: a clue to the location of a hidden immunity idol near camp.' },
  { id:'letters',   phase:'post-merge', label:'Letters from Home', desc:'A sealed letter from someone waiting back home. Some players broke down before they even opened it.' },
  { id:'spa',       phase:'post-merge', label:'Spa Day',           desc:'Hot showers, a massage table, real food. The body forgets what discomfort feels like, briefly.' },
];

