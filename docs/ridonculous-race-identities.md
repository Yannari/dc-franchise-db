# The Ridonculous Race: team identities (draft)

A team is two people, a **relationship** (siblings, exes, parent and child…) and, optionally, an **identity**: what the two
of them are together. In the show that is the Goths, the Surfer Dudes, the Ice Dancers, the Police Cadets. Some teams
have no identity beyond the relationship (Father & Son, Sisters, BFFs) and that stays allowed.

An identity gives a team three things:

1. **Strengths and weaknesses by task type.** A proportional nudge on top of the stat blend the task already uses,
   never a gate: good = ×1.12 on that task's score, bad = ×0.88. The best swimmer in a weak-water identity can still win the swim.
2. **A voice.** What they say at a task, how they talk about the other teams, the jokes that come back all season.
3. **Natural friction and natural friends.** Who they rub the wrong way and who they warm to. This only seeds
   first-leg bonds; after that, what actually happens between teams decides.

## Task types

Every task in a leg is one or two of these (a Botch or Watch swim is Water; eating a bowl of eyeballs is Stomach;
finding one marked coconut in a pile of three thousand is Search + Patience).

| Type | What it covers |
|---|---|
| **Water** | swimming, diving, rowing, rafting, anything wet |
| **Heights** | climbing, abseiling, zip lines, bungee, ledges |
| **Strength** | carrying, digging, pulling, building something heavy |
| **Stomach** | eating and drinking awful things, smells, gross jobs |
| **Nerve** | animals, the dark, stunts, anything scary that is not about height |
| **Brains** | puzzles, memory, maths, codes, languages |
| **Search** | finding one thing among many, spotting, searching a place |
| **Perform** | singing, dancing, acting, presenting in front of a crowd |
| **People** | convincing, haggling, selling, asking locals for help |
| **Travel** | finding the way, driving, reading a map, booking the faster ride |
| **Hands** | precision, crafting, assembling, balancing, cooking |
| **Patience** | waiting, repetition, tasks that punish rushing |

## Do we need new stats? No.

The nine stats already cover a race. Each task type is a **blend** of them, the way Drag Race's `blendScore` answers a
challenge:

| Task type | Blend (weights) |
|---|---|
| Water | physical .4, endurance .4, boldness .2 |
| Heights | boldness .5, physical .3, temperament .2 |
| Strength | physical .6, endurance .4 |
| Stomach | endurance .5, temperament .3, boldness .2 |
| Nerve | boldness .6, temperament .4 |
| Brains | mental .7, intuition .3 |
| Search | intuition .5, mental .2, endurance .3 |
| Perform | social .5, boldness .5 |
| People | social .6, strategic .2, intuition .2 |
| Travel | mental .4, intuition .4, strategic .2 |
| Hands | mental .3, temperament .4, physical .3 |
| Patience | temperament .6, endurance .4 |

Three things that look like they need a stat and do not:

- **Teamwork** comes from the pair's bond and relationship. Two exes who hate each other lose time on every task that
  needs both of them; that is the bond doing it, and it changes as the bond changes.
- **Domain skill** (surfers swim, lumberjacks chop) is the identity. That is what identities are for.
- **Luck** (the taxi that breaks down, the flight that is full) is not a stat and never will be (a franchise rule). Travel
  mishaps are random events; Travel skill decides how much time a team loses when one hits them.

## Custom identities

Type any identity you want ("Synchronized Swimmers"). Then pick:

- **Strengths from:** the closest built-in identity (Lifeguards), or tick the task types yourself.
- **Voice from:** the closest built-in identity (Dancers).

**No new dialogue is required.** Every identity's lines are written in two kinds:

- **Voice lines** carry the attitude and never name the identity's specific things ("Count us in. Smile, they're
  watching."). A custom identity borrows these from its voice identity.
- **Specific lines** name the identity's world ("Board wax", "the bats are waking up"). These stay with the built-in
  identity and never leak into a custom one. A Goth line about bats would be wrong in the mouth of "Emo Poets".

Lines that say the team's name use `{identity}`, so a custom team hears its own name.

**Optional:** a custom identity has room for up to a dozen of your own lines (at a task they are good at, at one they are
bad at, about another team). Yours are mixed in first; the borrowed voice fills the rest.

---

## The 48

Each identity: what they are good and bad at, their natural friction (✗) and friends (♥), and three sample lines:
at a task they are good at, at one they are bad at, and about another team. `{partner}` is the other teammate.

### Athletes

**Surfers**: good **Water, Nerve** · bad **Brains, Travel** · ✗ Rich Kids, Lawyers · ♥ Lifeguards, Hippies
- *Water:* "Okay, this is just paddling out. We've done this a thousand times. Stay on my left and don't fight the current."
- *Brains:* "I don't get it. Do you get it? Let's just put the big piece in first and see what happens."
- *Others:* "Those guys look really stressed. Should we ask if they're okay? Like, after we pass them."

**Ice Dancers**: good **Hands, Perform** · bad **Strength, Stomach** · ✗ Cheerleaders, Tennis Rivals · ♥ Dancers
- *Perform:* "Count us in. Five, six, seven, eight. And smile, {partner}, they're watching."
- *Stomach:* "I can't eat that. We have a weigh-in in three weeks. I'm not being dramatic, I actually can't."
- *Others:* "They keep falling and laughing about it. We trained for years so we'd never fall, and they're having more fun than us."

**Tennis Rivals**: good **Hands, Strength** · bad **People, Patience** · ✗ each other, Ice Dancers · ♥ nobody, on principle
- *Hands:* "Watch the wrist. You never watch the wrist. That's why I beat you in the final."
- *People:* "Can you ask him? You're better at talking. I'm saying that once and I'll deny it later."
- *Others:* "Don't wave at them. We're not friends with anyone here. We're barely friends with each other."

**Cheerleaders**: good **Perform, Heights** · bad **Brains, Stomach** · ✗ Goths, Punks · ♥ Beauty Queens
- *Heights:* "I've got your ankles. You've done this off a pyramid a hundred times. Up on three."
- *Brains:* "Why are there so many numbers on this? Who puts this many numbers on one sign?"
- *Others:* "The Goths haven't smiled once today. I'm making it my personal goal."

**Wrestlers**: good **Strength, Stomach** · bad **Hands, Patience** · ✗ Geniuses, Fashion Bloggers · ♥ Lumberjacks
- *Strength:* "Give me the heavy end. No, the heavier end. I want the heavy end."
- *Hands:* "My fingers are too big for this. Every bead I pick up, I drop two more."
- *Others:* "They keep looking at us like we're going to crush them. We might. Not on purpose."

**Skateboarders**: good **Nerve, Travel** · bad **Patience, Brains** · ✗ Police Cadets, Retirees · ♥ Punks
- *Nerve:* "It's just a drop. You've done worse off the stairs behind the library."
- *Patience:* "How long do we wait here? An hour? I'm going to lose my mind, dude."
- *Others:* "The Cadets keep giving us looks. We haven't even done anything. Yet."

### Performers

**Rockers**: good **Perform, Stomach** · bad **Patience, Hands** · ✗ Church Choir, Retirees · ♥ Punks, Party Animals
- *Perform:* "We've played to empty bars on a Tuesday. A square full of people is nothing. Go loud."
- *Hands:* "Fold it into a crane? I can't fold a t-shirt. Ask my mom."
- *Others:* "The choir kids are nice. Really nice. It's freaking me out a little."

**Rappers**: good **Perform, Brains** · bad **Water, Heights** · ✗ Debate Team · ♥ Vloggers
- *Brains:* "Give me the words. I'll have them in my head in two minutes. That's literally what we do."
- *Water:* "I don't swim. I'm saying it now so nobody's surprised later."
- *Others:* "The debate kids think they can out-talk us. Let them try."

**Actors**: good **Perform, People** · bad **Strength, Water** · ✗ Reality-TV Pros, Lawyers · ♥ Magicians
- *People:* "Just commit. If you believe you're a tour guide, he'll believe you're a tour guide."
- *Strength:* "My back is gone. I have an audition when this is over, {partner}. My back is GONE."
- *Others:* "The reality people aren't acting. They're just like that. Somehow that's worse."

**Dancers**: good **Perform, Hands** · bad **Stomach, Brains** · ✗ Wrestlers · ♥ Ice Dancers, Cheerleaders
- *Perform:* "Watch my feet, not the music. Copy my feet and you'll have it by the third try."
- *Stomach:* "I'm going to be sick. On a dance floor. That is my actual nightmare."
- *Others:* "The wrestlers asked us to teach them the step. I thought it was a joke. It was not a joke."

**Magicians**: good **Hands, Search** · bad **Strength, Water** · ✗ Scientists · ♥ Actors
- *Hands:* "It's a cheap lock. Give me ten seconds and don't watch. It's a trade secret."
- *Water:* "I've held my breath in a tank for two minutes, but the tank was rigged. This lake isn't rigged."
- *Others:* "The scientists keep asking how we did the card thing. We are never telling them."

**Beauty Queens**: good **People, Perform** · bad **Strength, Stomach** · ✗ Survivalists, Wrestlers · ♥ Cheerleaders, Cowboys
- *People:* "Smile at him and ask nicely. That works better than yelling nine times out of ten."
- *Strength:* "There's mud in my shoes and mud in my hair. Keep going. Keep going."
- *Others:* "One of the Cowboys called me ma'am. I liked it. Don't tell anybody."

### Subcultures

**Goths**: good **Nerve, Patience** · bad **Perform, People** · ✗ Cheerleaders, Influencers · ♥ Librarians
- *Nerve:* "A crypt. Finally, somewhere quiet."
- *Perform:* "I'll do the dance. I won't make it a happy dance, but I'll do it."
- *Others:* "The cheerleader keeps trying to make me smile. I'm not going to. She knows I'm not going to."

**Gamers**: good **Brains, Search** · bad **Strength, Water** · ✗ Lumberjacks · ♥ Streamers, Geniuses
- *Brains:* "It's a pattern. Every third tile repeats. We've beaten worse levels than this."
- *Strength:* "My legs don't do this. My legs have done this maybe twice in my life."
- *Others:* "The Lumberjacks asked what our high score was. I think they were making fun of us. I honestly can't tell."

**Cosplayers**: good **Hands, Perform** · bad **Strength, Travel** · ✗ Fashion Bloggers · ♥ Gamers, Actors
- *Hands:* "Give me glue and fabric and I'll make you anything. Wings? Twenty minutes."
- *Travel:* "Is that north? Why does everybody else just know where north is?"
- *Others:* "The fashion bloggers called my wig brave. I know what that means."

**Punks**: good **Nerve, Stomach** · bad **People, Patience** · ✗ Police Cadets, Beauty Queens · ♥ Rockers, Skateboarders
- *Stomach:* "Eat it. It's a bug. We've eaten worse after a show."
- *People:* "I'm not saying please to him. You say please. I'll stand over here."
- *Others:* "The Cadets keep standing next to us like statues. It's creepy, man."

**Hippies**: good **Patience, People** · bad **Travel, Strength** · ✗ Rich Kids, Soldiers · ♥ Surfers, Vegans
- *Patience:* "Breathe. The sheep can feel it when you're stressed. Just walk with them."
- *Travel:* "We don't really do maps. We usually go where it feels right."
- *Others:* "The soldiers are wound so tight. I offered them some of my tea. They said no, but they thought about it."

**Cowboys**: good **Strength, Nerve** · bad **Travel, Perform** · ✗ Vegans, Influencers · ♥ Farmers, Beauty Queens
- *Nerve:* "Easy, girl. Easy. You just talk to her low and slow and she'll come round."
- *Travel:* "This city has too many streets. Back home there's one, and it goes to the feed store."
- *Others:* "The vegans looked at my boots like the boots did something to them."

### Uniforms

**Police Cadets**: good **Search, Strength** · bad **Perform, Nerve** · ✗ Punks, Skateboarders · ♥ Soldiers, Firefighters
- *Search:* "Grid search. You take rows one to ten, I take eleven to twenty. Nobody skips a square."
- *Perform:* "Dance? There's nothing in the manual about dancing."
- *Others:* "Keep an eye on the punks. They haven't done anything. That's what worries me."

**Soldiers**: good **Travel, Strength** · bad **Perform, People** · ✗ Hippies · ♥ Police Cadets
- *Travel:* "Map, compass, move. Twenty minutes if nobody stops to talk."
- *Perform:* "I'd rather do basic training again than sing in front of these people."
- *Others:* "The hippies offered us tea. I said no. It smelled pretty good, though."

**Firefighters**: good **Heights, Strength** · bad **Brains, Hands** · ✗ nobody much · ♥ Police Cadets, Nurses
- *Heights:* "Ladder's steady. Climb, I've got the bottom. I've done this with a lot more smoke."
- *Brains:* "If this was on fire, I'd know exactly what to do. It's a crossword. I don't know what to do."
- *Others:* "That team's struggling with the logs. Should we… yeah, we should. Quick, though."

**Lifeguards**: good **Water, Nerve** · bad **Brains, Perform** · ✗ Party Animals · ♥ Surfers
- *Water:* "Long strokes, breathe every third. I'll be right beside you the whole way."
- *Perform:* "I can save a drowning man. I can't sing in front of one."
- *Others:* "The party guys are going in the water after a drinking task. I'm keeping an eye on them."

**Nurses**: good **Stomach, Patience** · bad **Heights, Nerve** · ✗ Party Animals · ♥ Firefighters, Retirees
- *Stomach:* "It's just tissue, {partner}. I've seen worse on a Tuesday night shift. Chew and swallow."
- *Heights:* "I'm fine with blood. I'm not fine with this. Don't make me look down."
- *Others:* "That dad's going to pull something carrying that alone. I've told him twice."

**Flight Attendants**: good **Travel, People** · bad **Strength, Nerve** · ✗ Rich Kids · ♥ Retirees
- *Travel:* "That flight's full. The one after connects through the hub and lands twenty minutes earlier. Trust me."
- *Nerve:* "I'm calm in turbulence. I am not calm about that snake."
- *Others:* "The rich kids snapped their fingers at the gate agent. I've worked with people like that for nine years."

### Online

**Influencers**: good **People, Perform** · bad **Stomach, Patience** · ✗ Goths, Survivalists · ♥ Vloggers
- *People:* "Hi! Big fan of your shop! Can you tell us the fastest way to the harbour? We'll tag you."
- *Patience:* "We've been sorting rice for forty minutes. Forty. My followers think I'm dead."
- *Others:* "The survivalists said they don't even have phones. Like, at home. On purpose."

**Fashion Bloggers**: good **Hands, People** · bad **Water, Stomach** · ✗ Cosplayers, Wrestlers · ♥ Beauty Queens
- *Hands:* "Let me do the folds. You always do them too tight. Give it here."
- *Water:* "This is real silk. Was real silk. I'm getting in, but I want everyone to know it was silk."
- *Others:* "The wrestlers wore the same shirt three legs in a row. I counted."

**Vloggers**: good **Perform, Search** · bad **Patience, Brains** · ✗ Podcasters · ♥ Influencers, Rappers
- *Search:* "Hang on, I filmed the whole square on the way in. It's in the background. Scrub back."
- *Patience:* "Okay, we've been waiting long enough to film three intros. I'm doing a fourth."
- *Others:* "The podcast guys keep saying they'll talk about us on their show. Honestly, sure."

**Podcasters**: good **People, Brains** · bad **Strength, Nerve** · ✗ Vloggers · ♥ Debate Team, Lawyers
- *Brains:* "I did a two-hour episode on old ships. I know which flag that is. I know all the flags."
- *Nerve:* "I'm going to narrate this in my head so it feels like it's happening to someone else."
- *Others:* "The vloggers have filmed every single thing today. The bathroom. They filmed the bathroom."

**Streamers**: good **Brains, Hands** · bad **Strength, People** · ✗ Retirees · ♥ Gamers
- *Hands:* "Quick hands, that's the whole job. Give me the controls."
- *People:* "Can you talk to him? I'm better with people when there's a chat box between us."
- *Others:* "The retirees asked us what we do for a living. We tried to explain. It went badly."

**Reality-TV Pros**: good **People, Perform** · bad **Hands, Patience** · ✗ Actors · ♥ nobody, they say that's the point
- *People:* "Make a deal with them now. Help at this task, cut them loose at the next. That's how it works."
- *Hands:* "I've been on four shows and I have never once had to do arts and crafts."
- *Others:* "The actors think they're better than us because they get paid to pretend. We get paid to be ourselves. Harder job."

### Brains

**Geniuses**: good **Brains, Travel** · bad **Strength, Nerve** · ✗ Wrestlers · ♥ Gamers, Librarians
- *Brains:* "The numbers are the ages of the statues in order. Two, nine, one, four. Try it."
- *Strength:* "This weighs more than I do. I've done the maths. It weighs more than both of us."
- *Others:* "The wrestlers offered to carry ours. I said no. I regret saying no."

**Debate Team**: good **People, Brains** · bad **Strength, Water** · ✗ Rappers · ♥ Podcasters, Lawyers
- *People:* "Let me talk to him. Three points: we're polite, we're in a hurry, and we'll be gone in five minutes."
- *Water:* "We prepped for everything. We did not prep for a lake."
- *Others:* "The rappers beat us at the rhyming task. Fine. It was a fair round."

**Scientists**: good **Brains, Hands** · bad **Perform, Stomach** · ✗ Magicians, Hippies · ♥ Geniuses
- *Hands:* "Measure twice. Pour once. We are not starting this over."
- *Stomach:* "I know exactly what's in this and that's the problem."
- *Others:* "The magicians did the card thing again. There's a trick to it. There's always a trick."

**Lawyers**: good **People, Brains** · bad **Stomach, Nerve** · ✗ Surfers, Actors · ♥ Debate Team
- *People:* "We're not asking him for a favour. We're offering him a deal. There's a difference."
- *Nerve:* "There's no clause for this. Nobody signs up to hold a tarantula."
- *Others:* "The surfers keep helping everyone. It's lovely. It's going to cost them the race."

**Chess Players**: good **Brains, Patience** · bad **Strength, Perform** · ✗ Party Animals · ♥ Geniuses, Retirees
- *Patience:* "Don't rush. The team that rushes this does it twice."
- *Perform:* "I can see eight moves ahead. I can't see how to dance."
- *Others:* "The party guys sprinted to the wrong pier. I could have told them. Nobody asked."

**Librarians**: good **Search, Brains** · bad **Nerve, Perform** · ✗ Party Animals · ♥ Goths, Retirees
- *Search:* "Everything gets filed somewhere. We just need to work out how they filed it."
- *Nerve:* "It's dark in there. I'm going in. I want it on record that I'm going in."
- *Others:* "The Goths are surprisingly good company. They don't talk much."

### Hands-on

**Lumberjacks**: good **Strength, Hands** · bad **Travel, Perform** · ✗ Gamers · ♥ Wrestlers, Farmers
- *Strength:* "Feet apart, let the axe do the work. Don't swing at it, swing through it."
- *Perform:* "Nobody said there'd be singing. I'd have stayed in the woods."
- *Others:* "The gamer kids are all right. Skinny. They should eat more."

**Farmers**: good **Strength, Stomach** · bad **Travel, Perform** · ✗ Rich Kids · ♥ Cowboys, Lumberjacks
- *Stomach:* "You've cleaned out worse, {partner}. Remember the pig barn in August?"
- *Travel:* "Taxi, bus, train. We've got a truck at home. One truck."
- *Others:* "The rich kids had never seen a goat up close. They screamed. The goat didn't."

**Survivalists**: good **Nerve, Search** · bad **People, Travel** · ✗ Influencers · ♥ Fishers
- *Search:* "Tracks go that way, broken branch at knee height. Somebody came through here an hour ago."
- *People:* "I don't like asking strangers for things. Strangers ask you things back."
- *Others:* "The influencers have a ring light in their backpack. In a jungle."

**Chefs**: good **Hands, Stomach** · bad **Patience, Water** · ✗ Vegans · ♥ Farmers, Fishers
- *Hands:* "Mince, don't chop. Smaller. Smaller. That's a chop, I said mince."
- *Patience:* "I've waited in kitchens for a sauce to reduce. This is worse."
- *Others:* "The vegans and I had a long talk about tofu. We didn't agree. It was a good talk."

**Mechanics**: good **Hands, Travel** · bad **Perform, People** · ✗ Rich Kids · ♥ Farmers
- *Travel:* "Give me the keys. I'll drive. You navigate and don't argue with the road."
- *People:* "I fix things. I don't talk people into things. You talk."
- *Others:* "The rich kids' car broke down and they called somebody. Called somebody. It was a fan belt."

**Fishers**: good **Water, Patience** · bad **Travel, Perform** · ✗ Party Animals · ♥ Survivalists, Chefs
- *Water:* "Stay low in the boat and let me row. Pulling hard won't help, you've got to pull steady."
- *Perform:* "I'd rather gut a hundred fish than sing one song."
- *Others:* "The party guys tipped their boat over in a calm bay. Calm."

### Lifestyle

**Vegans**: good **Patience, Water** · bad **Stomach, Strength** · ✗ Chefs, Cowboys · ♥ Hippies
- *Stomach:* "We're not eating it. We'll take the penalty. We decided that before we got here."
- *Strength:* "We're strong, just not lift-a-cow strong. It's a different kind of strong."
- *Others:* "The cowboy said he respects it. He doesn't get it, but he respects it. That's fair."

**Rich Kids**: good **Travel, Perform** · bad **Strength, Stomach** · ✗ Farmers, Mechanics, Surfers · ♥ each other
- *Travel:* "Book the earlier flight. Yes, the expensive one. No, wait, we can't pay for that here. Ugh."
- *Stomach:* "I've never eaten anything I didn't pick off a menu, {partner}. I'm not starting now."
- *Others:* "The farmers keep calling us city folk. We're from three cities."

**Retirees**: good **Patience, People** · bad **Strength, Heights** · ✗ Skateboarders · ♥ Nurses, Librarians, Flight Attendants
- *Patience:* "Slow and steady. Everybody else is rushing and doing it twice."
- *Heights:* "My knees have opinions about this, and they're not good ones."
- *Others:* "The skateboard boys are nice once you talk to them. One of them called me grandpa. I didn't mind."

**Adversity Twins**: good **Nerve, Patience** · bad **Hands, Heights** · ✗ nobody, they're too busy surviving · ♥ Firefighters, Nurses
- *Nerve:* "We've broken more bones than most people have. This is nothing. Probably."
- *Hands:* "If anything's going to go wrong, it's going to go wrong to us. I'm holding it very carefully."
- *Others:* "The nurses keep checking on us. Honestly? Thank you."
- *Mechanic:* mishap events pick them more often (a weight on a random event, never a stat), and how they take it is their story.

**Party Animals**: good **Stomach, People** · bad **Patience, Travel** · ✗ Librarians, Nurses, Chess Players · ♥ Rockers
- *Stomach:* "Down in one. We've done this at four in the morning, we can do it at noon."
- *Travel:* "Which pier was it? Pier nine? Pier six? It was a number."
- *Others:* "The librarians shushed us. On a beach. Outdoors."

**Church Choir**: good **Perform, Patience** · bad **Nerve, Stomach** · ✗ Rockers (friendly) · ♥ Retirees
- *Perform:* "Find the note, {partner}. Breathe from down here. We've sung for bigger crowds every Sunday."
- *Nerve:* "I'm praying. Quietly. Out loud would scare the bats."
- *Others:* "The rock boys aren't so bad. One of them can really sing. He just won't admit it."

---

## Writing these for real

These samples show the voice; the real pools are written after the episode-by-episode read of both shows. For every
identity:

- each task type gets lines at **winning, struggling, losing, quitting** (Botch or Watch alone needs swimming and watching)
- lines about each friction and friend identity, and lines for when that first-leg friction turns into a real alliance or a real feud
- voice lines and specific lines kept apart, so custom identities can borrow
- plain spoken English: no quips, no one-liners written for an audience, lines that answer what was said before them
