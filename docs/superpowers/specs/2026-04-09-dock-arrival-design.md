# TDI-Style Dock Arrival Cold Open

## Overview

Episode 1 gets a Total Drama Island-style arrival sequence where players arrive one by one at the dock. Each player gets a host intro, a reaction line, and occasionally a dock reaction from someone already there. Replaces the normal Cold Open for episode 1 only.

## Where It Lives

- `rpBuildColdOpen(ep)` detects `ep.num === 1 && ep.dockArrivals?.length` and renders the arrival sequence instead of the normal "Previously On" format
- `generateDockArrivals(ep)` — new engine function, called during episode 1 simulation (before `executeFirstImpressions`). Produces `ep.dockArrivals[]`
- `_textDockArrivals(ep, ln, sec)` — text backlog function
- Episodes 2+ keep the normal Cold Open unchanged

## Arrival Order Algorithm

### Energy Tiers

Archetypes grouped by energy level for contrast pairing:

- **Chill**: floater, loyal-soldier, social-butterfly, showmancer, underdog
- **Intense**: hero, challenge-beast, perceptive-player, mastermind
- **Volatile**: villain, hothead, chaos-agent, schemer, wildcard, goat

### Ordering

1. Pull out **first arrival** — random from chill tier (the "Beth" — enthusiastic, sets friendly tone)
2. Pull out **last arrival** — random from volatile tier (the "Izzy" — chaotic closer)
3. Remaining players ordered by **alternating tiers**: chill, volatile, intense, chill, volatile, intense... Within each tier pick, select randomly
4. Result: natural contrast — social-butterfly arrives, then villain, then mastermind, creating comedic collisions

## Dialogue System

Each arrival generates up to 3 pieces:

### 1. Host Intro Line

Driven by archetype with stat-flavor override ~40% of the time.

**Per-archetype pool (4-5 templates each):**

**villain:**
- `"Watch your backs, everyone. ${name} just arrived."`
- `"Oh, this should be interesting. Everyone, meet ${name}."`
- `"${name} is here. And no, ${pr.sub} ${pr.sub==='they'?'don\'t':'doesn\'t'} play nice."`
- `"Ladies and gentlemen... trouble just docked."`
- `"I'd say play nice, ${name}, but we both know that's not happening."`

**hero:**
- `"Give it up for ${name}!"`
- `"${name} is here. Finally, someone the audience can root for."`
- `"The golden child has arrived. Welcome, ${name}."`
- `"${name}! The one everyone wants on their team."`

**schemer:**
- `"${name}, welcome. Try not to scheme too hard on day one."`
- `"${name} is here. ${pr.Sub} already ${pr.sub==='they'?'look':'looks'} like ${pr.sub}'${pr.sub==='they'?'re':'s'} planning something."`
- `"Everyone smile at ${name}. ${pr.Sub}'${pr.sub==='they'?'re':'s'} definitely smiling at you."`
- `"Welcome, ${name}. I'm sure your intentions are pure."`

**mastermind:**
- `"${name} just arrived. ${pr.Sub}'${pr.sub==='they'?'re':'s'} already three moves ahead."`
- `"Welcome, ${name}. Try to enjoy the game, not just win it."`
- `"${name} is here. I can practically hear the gears turning."`
- `"Everyone, this is ${name}. The smartest person here just got competition."`

**hothead:**
- `"${name} is here, and ${pr.sub} already ${pr.sub==='they'?'look':'looks'} annoyed."`
- `"Welcome, ${name}. Deep breaths, we just started."`
- `"${name}! Try not to break anything on day one."`
- `"Aaaaand the temperature on the dock just went up. ${name}, everyone."`

**chaos-agent:**
- `"Brace yourselves. ${name} just arrived."`
- `"${name} is here. Lock up the supplies."`
- `"Welcome, ${name}. I'm already nervous."`
- `"Everyone, meet ${name}. No, I can't predict what happens next either."`

**loyal-soldier:**
- `"${name}! Good to have you here."`
- `"Welcome, ${name}. Solid, dependable — exactly what a team needs."`
- `"${name} is here. Someone you want in your corner."`
- `"Give it up for ${name}. The kind of player who keeps their word."`

**social-butterfly:**
- `"${name} is here, and ${pr.sub}'${pr.sub==='they'?'re':'s'} already making friends."`
- `"Everyone's new best friend just arrived. Welcome, ${name}."`
- `"${name}! I give it five minutes before ${pr.sub} ${pr.sub==='they'?'know':'knows'} everyone's name."`
- `"Welcome, ${name}. The social game starts now."`

**showmancer:**
- `"${name} is here. Try to focus, people."`
- `"Welcome, ${name}. I see some heads turning already."`
- `"${name} just arrived. This should complicate things."`
- `"Ladies and gentlemen, ${name}. Hearts will be broken."`

**challenge-beast:**
- `"${name} is here. The challenges just got a lot more interesting."`
- `"Welcome, ${name}. You look like you could win every single one of these."`
- `"${name}! Built for this. Literally."`
- `"Everyone, meet your biggest challenge threat. ${name}, welcome."`

**floater:**
- `"${name}, welcome to the island."`
- `"And here's ${name}. Flying under the radar already."`
- `"${name} is here. Quiet entrance — noted."`
- `"Welcome, ${name}. Sometimes the quiet ones go the furthest."`

**wildcard:**
- `"${name} just docked. Your guess is as good as mine."`
- `"Welcome, ${name}. I genuinely don't know what to expect from you."`
- `"${name} is here. Even the producers aren't sure what's going to happen."`
- `"Everyone, this is ${name}. Expect the unexpected."`

**perceptive-player:**
- `"${name} is here. ${pr.Sub}'${pr.sub==='they'?'re':'s'} already reading everyone."`
- `"Welcome, ${name}. Nothing gets past this one."`
- `"${name} just arrived. ${pr.Sub} probably already ${pr.sub==='they'?'know':'knows'} who's lying."`
- `"Everyone, meet ${name}. The human lie detector."`

**underdog:**
- `"${name} is here. Don't count ${pr.obj} out."`
- `"Welcome, ${name}. The underdog story starts now."`
- `"${name}! Small in stature, big in heart."`
- `"Everyone, this is ${name}. They'll surprise you."`

**goat:**
- `"${name}, welcome!"`
- `"And here's ${name}. Welcome to the island."`
- `"${name} is here. Let's see what ${pr.sub} ${pr.sub==='they'?'bring':'brings'} to the table."`
- `"Welcome, ${name}. Make yourself at home."`

### Stat Flavor Override (~40% chance)

If a player's top stat is >= 8, the host line may be replaced with a stat-specific variant:

- **physical >= 8**: `"${name} just stepped off the boat looking like ${pr.sub} could flip it over."`
- **strategic >= 8**: `"${name} is here. I give it ten minutes before ${pr.sub} ${pr.sub==='they'?'have':'has'} a plan."`
- **social >= 8**: `"${name} just arrived, and somehow half the dock already likes ${pr.obj}."`
- **endurance >= 8**: `"${name} is here. Good luck outlasting this one."`
- **mental >= 8**: `"${name} just docked. The smartest person on this island might have just arrived."`
- **boldness >= 8**: `"${name} is here. ${pr.Sub} ${pr.sub==='they'?'don\'t':'doesn\'t'} do subtle."`
- **intuition >= 8**: `"${name} is here. ${pr.Sub} can read a room before ${pr.sub} even ${pr.sub==='they'?'walk':'walks'} into it."`
- **temperament <= 3** (inverse — low is notable): `"${name} just arrived. Let's hope nobody makes ${pr.obj} angry."`

### 2. Player Reaction Line

5-6 options per archetype. Reacts to the camp, the host, or the situation.

**villain:**
- `"Cute camp. I give it a week before I run this place."`
- `"So this is the competition? This'll be easier than I thought."`
- `"${host}, nice setup. Very... rustic. I'll survive."`
- `"Already see a few people I can work with. And a few I'll enjoy watching leave."`
- `"Don't worry, everyone. I'll be nice. For now."`

**hero:**
- `"Hey everyone! This is going to be amazing."`
- `"Camp looks rough, but that's half the fun, right?"`
- `"${host}! Great to be here. Seriously."`
- `"I'm here to compete, make friends, and do this the right way."`
- `"Whatever this place throws at us, we handle it together."`

**schemer:**
- `"Nice to meet everyone. I mean that. Mostly."`
- `"This camp has potential. Just needs the right person pulling the strings."`
- `"I'm already thinking three steps ahead. Can't help it."`
- `"${host}, you forgot to mention the part where I win."`
- `"Everyone looks so trusting. That's... useful."`

**mastermind:**
- `"Interesting. I've already identified four potential alliance structures."`
- `"The game started the moment I stepped off that boat."`
- `"${host}, I've studied every season. I know how this works."`
- `"Camp's fine. The people are what matter. And I'm watching."`
- `"Let's not pretend this isn't a chess match. I'm ready."`

**hothead:**
- `"This place better have food because I'm already in a mood."`
- `"If anyone tries anything, they'll hear about it. Loudly."`
- `"${host}, where's the real camp? This can't be it."`
- `"I'm not here to make friends. I'm here to win."`
- `"Someone already looked at me wrong. We're gonna have problems."`

**chaos-agent:**
- `"This place is a dump. I LOVE it."`
- `"So when do things start getting weird? Because I'm ready."`
- `"${host}! Big fan. Huge fan. Is anything on fire yet?"`
- `"Everyone looks so serious. That's gonna change."`
- `"I brought fireworks. Not metaphorical ones."`

**loyal-soldier:**
- `"Hey, good to be here. Let's do this."`
- `"Camp looks solid. I've seen worse."`
- `"Just point me to my team and I'm ready to work."`
- `"I'm here to compete hard and keep my word. Simple as that."`
- `"${host}, where do I sign up? I'm all in."`

**social-butterfly:**
- `"Oh my gosh, hi everyone! This is SO exciting!"`
- `"I already love this place. And all of you. Seriously."`
- `"${host}! Can I get a tour? I want to see everything."`
- `"I've been looking forward to this for months. Let's be friends!"`
- `"This camp is giving me summer camp vibes and I am HERE for it."`

**showmancer:**
- `"Well, hello everyone."`
- `"${host}, this is... charming. In a rugged kind of way."`
- `"I see some interesting people here. Very interesting."`
- `"I'm here for the experience. Whatever happens... happens."`
- `"Nice camp. Better company, though."`

**challenge-beast:**
- `"Where's the gym? Kidding. Sort of."`
- `"This place looks tough. Good. I like tough."`
- `"I've been training for this. Bring on the challenges."`
- `"${host}, I hope those challenges are as brutal as they look on TV."`
- `"If there's a physical challenge on day one, I'm winning it."`

**floater:**
- `"Hey. Cool. So... where do I put my stuff?"`
- `"This seems fine."`
- `"Not bad. I can work with this."`
- `"${host}. Hi. Yeah, I'm here. That's... cool."`
- `"I'm just gonna hang back and see how this plays out."`

**wildcard:**
- `"Is that a raccoon? I love raccoons."`
- `"${host}! This is either going to be amazing or terrible. I'm excited either way."`
- `"I don't really have a plan. Plans are boring."`
- `"Whatever everyone else is doing, I'm probably doing the opposite."`
- `"This camp smells weird. I'm into it."`

**perceptive-player:**
- `"Interesting group. I can already tell who's faking it."`
- `"${host}, nice poker face. Almost bought it."`
- `"I've been watching everyone from the boat. Already have notes."`
- `"Camp's fine. The real game is the people. And they're fascinating."`
- `"Three people here are already lying. It's been five minutes."`

**underdog:**
- `"I know I don't look like much. That's the point."`
- `"Everyone always underestimates me. That's fine. Keep doing it."`
- `"${host}, I'm here to prove something. To myself."`
- `"This place is rough. Perfect. I'm used to rough."`
- `"Hi everyone. Remember my face — you're going to see a lot of it."`

**goat:**
- `"Wow, this is a real camp! With trees and everything!"`
- `"Hi! Is this where we sleep? It's so... outdoorsy."`
- `"${host}! I'm so happy to be here. What do we do first?"`
- `"I just want to have fun and not get voted out first. Is that too much to ask?"`
- `"Everyone seems really intense. Am I supposed to be intense too?"`

### Returnee Variant Pool

When a player has `isReturnee: true` (set per-player in cast builder), they draw from a separate archetype-driven pool:

**villain returnee:**
- `"Miss me? No? Good. That means I did my job last time."`
- `"I'm back. And I remember every name that wrote mine down."`
- `"Round two. This time they know what I am — and they still can't stop me."`
- `"The villain returns. Try to act surprised."`

**hero returnee:**
- `"Unfinished business. That's why I'm here."`
- `"Last time I played with honor. This time I play smarter AND with honor."`
- `"I'm back, and I'm not leaving until I finish what I started."`
- `"Being back feels right. This time I know what I'm up against."`

**schemer returnee:**
- `"They really invited me back? Their mistake."`
- `"Last time was practice. This is the real game."`
- `"I learned a lot last time. Mostly what NOT to get caught doing."`
- `"Back for round two. New plans, same brain."`

**mastermind returnee:**
- `"I've replayed every move from last time. I know exactly what went wrong."`
- `"Back with a better playbook. Let's see if anyone can keep up."`
- `"Experience is the ultimate advantage. And I've got plenty."`
- `"I've had time to think. That should scare everyone."`

**hothead returnee:**
- `"Yeah, I'm back. And I'm still angry about how last time went."`
- `"Same camp, same game. Different me. Maybe. We'll see."`
- `"They told me to stay calm this time. I'll try. No promises."`
- `"Last time I let my temper get me. This time... okay, it might still get me."`

**chaos-agent returnee:**
- `"You thought season one was chaotic? Buckle up."`
- `"I'm baaack! Did you miss the chaos? I missed the chaos."`
- `"Round two of me is going to be so much worse for everyone. I can't wait."`
- `"They invited me back KNOWING what I did last time. I respect that."`

**loyal-soldier returnee:**
- `"Back again. Same player, same values. Let's go."`
- `"I kept my word last time and I'll keep it this time too."`
- `"Being back feels like coming home. Weird, smelly home. But home."`
- `"I know this game now. Loyalty still wins. I'll prove it."`

**social-butterfly returnee:**
- `"Oh my gosh, I'm BACK! I missed this place!"`
- `"New people to meet! Well, not new, but we get to start over, right?"`
- `"Last time was amazing. This time is going to be BETTER."`
- `"I already know everyone and I already love everyone. Let's GO."`

**showmancer returnee:**
- `"Back for more. And yes, I'm single. In case anyone's wondering."`
- `"Last time the romance distracted me. This time... well, we'll see."`
- `"I'm here to play, not to fall in love again. Probably."`
- `"Same dock, same butterflies. Some things don't change."`

**challenge-beast returnee:**
- `"I've been training since the day I left. Nobody's beating me this time."`
- `"Back and stronger. The challenges don't scare me. The people might."`
- `"Last time I relied on winning. This time I've got a social game too. Sort of."`
- `"Round two. Let's see if anyone can keep up."`

**floater returnee:**
- `"Yep, I'm back. Surprised? Most people are."`
- `"Last time I flew under the radar. This time... probably the same thing."`
- `"Nobody expected me to come back. That's kind of my whole thing."`
- `"Back again. Still here. Still quiet. Still dangerous."`

**wildcard returnee:**
- `"They let me come back! That's either brave or stupid."`
- `"Round two! I have no idea what I'm doing and that's the plan!"`
- `"Last time was a wild ride. This time I brought snacks."`
- `"Back and even more unpredictable. You're welcome."`

**perceptive-player returnee:**
- `"I know everyone's game this time. That's a problem — for them."`
- `"Back with better reads. Last time I saw everything. This time I'll use it."`
- `"Everyone's tells are exactly the same. This should be fun."`
- `"I've been watching from home. I know who's fake. All of them."`

**underdog returnee:**
- `"I wasn't supposed to make it last time. I wasn't supposed to come back. Yet here I am."`
- `"They counted me out once. They'll do it again. And I'll prove them wrong again."`
- `"Back with something to prove. Same as always."`
- `"The underdog returns. Honestly, this is my favorite role."`

**goat returnee:**
- `"I'm back! I actually got invited back! Can you believe it?"`
- `"Last time I didn't really know what was going on. Now I kind of do!"`
- `"Everyone told me I'd never come back. WELL HERE I AM."`
- `"I'm so excited. Is it weird that I'm excited? I don't care, I'm excited."`

### 3. Dock Reactions (30-40% of arrivals)

When a new arrival steps onto the dock, check if any player already there matches a **chemistry pair**. If yes, ~60% chance it fires (so roughly 30-40% of all arrivals get one). If multiple pairs qualify, pick the strongest contrast.

**Chemistry pairs and reaction pools:**

**villain arrives, hero on dock (tension):**
- `${reactor} crosses ${rPr.posAdj} arms and says nothing. The look says everything.`
- `${reactor} watches ${name} step off the boat. ${rPr.Sub} already ${rPr.sub==='they'?'don\'t':'doesn\'t'} trust ${pr.obj}.`
- `"Great," ${reactor} mutters. "This should be fun."`

**hero arrives, villain on dock (sizing up):**
- `${reactor} smirks. "Oh, we've got a Boy Scout."`
- `${reactor} looks ${name} up and down. "Easy target," ${rPr.sub} ${rPr.sub==='they'?'think':'thinks'}.`
- `Something flickers behind ${reactor}'s eyes. Competition.`

**hothead arrives, anyone calm on dock (intimidation):**
- `${reactor} takes a small step back. Just instinct.`
- `The dock gets quieter when ${name} arrives. ${reactor} notices.`
- `${reactor} glances at ${name} and decides to stand somewhere else.`

**showmancer arrives, high-social player on dock (attraction/interest):**
- `${reactor} does a double take. Tries to play it cool. Fails.`
- `${reactor} suddenly becomes very interested in fixing ${rPr.posAdj} hair.`
- `Something about ${name} catches ${reactor}'s attention. ${rPr.Sub} ${rPr.sub==='they'?'don\'t':'doesn\'t'} look away fast enough.`

**chaos-agent arrives, loyal-soldier on dock (dread):**
- `${reactor} watches ${name} arrive and gets a bad feeling about this.`
- `"Oh no," ${reactor} says quietly. ${rPr.Sub} can already tell.`
- `${reactor} and ${name} make eye contact. It's instantly clear they're going to have problems.`

**challenge-beast arrives, another challenge-beast on dock (rivalry):**
- `${reactor} sizes up ${name}. Finally, some real competition.`
- `${reactor} stands a little taller when ${name} steps onto the dock.`
- `Two athletes. One dock. ${reactor} and ${name} exchange a nod. Game on.`

**goat arrives, villain/schemer on dock (predatory interest):**
- `${reactor}'s eyes light up. Not in a nice way.`
- `${reactor} watches ${name} fumble off the boat and smiles. Perfect.`
- `${reactor} just found ${rPr.posAdj} new best friend. ${name} has no idea.`

**underdog arrives, hero on dock (encouragement):**
- `${reactor} gives ${name} a genuine smile. "Welcome."`
- `${reactor} nods at ${name}. Sees something the others don't.`
- `"Hey, glad you're here," ${reactor} says to ${name}. And means it.`

**mastermind arrives, another mastermind on dock (recognition):**
- `${reactor} and ${name} lock eyes. They both know what the other is.`
- `${reactor} nods once at ${name}. Respect. And concern.`
- `Two people in this game just realized they can't fool each other. ${reactor} and ${name}.`

**wildcard arrives, perceptive-player on dock (curiosity):**
- `${reactor} can't quite figure ${name} out. That almost never happens.`
- `${reactor} tilts ${rPr.posAdj} head. ${name} is... different.`
- `${reactor} watches ${name} carefully. No read yet. Interesting.`

## VP Rendering

Inside `rpBuildColdOpen(ep)`, when `ep.num === 1 && ep.dockArrivals?.length`:

### Layout

1. **Title card**: Season name in eyebrow, "THE ARRIVAL" in large display font, camp tagline below ("Welcome to Camp Wawanakwa" / configured location)
2. **Host intro monologue**: Hardcoded TDI-style opening. Uses `seasonConfig.host` and `seasonConfig.name`. Styled as italic gold text in a card. Content:
   - `"Yo! We're coming at you live from Camp Wawanakwa! I'm your host, ${host}. ${playerCount} players have signed up to spend eight weeks at this crummy old summer camp. They'll compete in challenges, vote each other out at tribal council, and the last one standing wins the prize. Every moment will be caught on camera. Who will crumble? Who will rise? Find out right here on... ${seasonName}!"`
   - For All-Stars: `"They've played before. They've been voted out, blindsided, betrayed. And they all came back for more. I'm ${host}, and this is ${seasonName} — All Stars. ${playerCount} returning players. One winner. Let's see who learned from their mistakes... and who's about to make new ones."`
3. **Click-to-reveal arrival cards**: `_tvState['dock_arrivals']` pattern, REVEAL NEXT / REVEAL ALL buttons
4. Each card:
   - Player portrait (medium) on the left
   - Host line in gold italic (small, 11px)
   - Player reaction in white (main dialogue, 13px)
   - Dock reaction below in muted gray if present (12px, italic)
   - Returnee badge `RETURNING` on portrait if `player.isReturnee`
5. **After all revealed**: "GROUP PHOTO" card — all portraits in a flex grid, host one-liner below
6. **Tribe assignment card**: "THE TEAMS" — show tribe names + members (connects to First Impressions if active)

### No Gameplay Consequences

This is pure narrative/atmosphere. No bond changes, no state mutations. First Impressions handles actual ep1 gameplay.

## Data Shape

```javascript
ep.dockArrivals = [
  {
    name: 'PlayerName',
    order: 0,
    archetype: 'villain',
    isReturnee: false,
    hostLine: "Watch your backs, everyone. PlayerName just arrived.",
    playerLine: "Cute camp. I give it a week before I run this place.",
    dockReaction: {           // null if no reaction fired
      reactor: 'HeroName',
      text: "HeroName crosses his arms and says nothing...",
      chemType: 'tension'
    },
    statFlavor: 'strategic',  // which stat drove the host line, or null
  },
  // ... one per player in arrival order
];
```

## Episode History

- `patchEpisodeHistory` gets: `if (!h.dockArrivals && ep.dockArrivals) h.dockArrivals = ep.dockArrivals;`
- Saved in both episode history push locations alongside existing fields

## Text Backlog

`_textDockArrivals(ep, ln, sec)`:
- Section header: `THE ARRIVAL`
- Per arrival: `[Host] "hostLine"` then `[PlayerName] "playerLine"` then optional `[DockReaction] "text"`
- Wired into `generateSummaryText` before `_textFirstImpressions`

## Config

- Per-player `isReturnee` flag set in the cast builder. Each player row gets a small toggle/checkbox.
- When `isReturnee` is true, that player draws from the returnee dialogue pool. When false, newbie pool.
- Mixed seasons (Fans vs Favorites, Champions vs Contenders) work naturally — some players are returnees, some aren't.
- All-Stars seasons: just set every player's flag to true.
- The flag is stored on the player object in the cast array (e.g. `players[i].isReturnee = true`).
- Host opening monologue detects whether the season is all-returnees, all-newbies, or mixed:
  - All newbies: standard TDI opening
  - All returnees: All-Stars opening
  - Mixed: `"Tonight, ${returneeCount} returning players face off against ${newbieCount} brand new competitors. The veterans think they know this game. The rookies think they can beat it. I'm ${host}, and this is ${seasonName}. Let's find out who's right."`

## Scope

### Included
- `generateDockArrivals(ep)` — arrival order + dialogue generation
- VP rendering in `rpBuildColdOpen` (ep1 special path)
- Text backlog `_textDockArrivals`
- Episode history save
- Per-player `isReturnee` flag in cast builder
- 15 archetype dialogue pools (newbie + returnee) + stat flavor overrides
- 10 chemistry pair reaction pools
- Host opening monologue

### Not Included
- Per-player custom lines in roster JSON (YAGNI — archetype pools provide enough variety)
- Cross-season placement tracking (YAGNI — per-player `isReturnee` flag is sufficient)
- Bond changes from arrival interactions (pure narrative, no gameplay)
- Arrival animations/transitions beyond the reveal pattern
