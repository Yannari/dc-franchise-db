// Voice versions, batch 6a: the visit, aloud (waiting for the knock; the blocked player's first words face to face).
// The answer follows the line, so a version keeps its meaning and its question. Same rules as batch1.js. No brand
// names anywhere.
export const VOICES = [
  // ── waiting for the knock ─────────────────────────────────────────────
  ['visit.wait.m01', "If there's a knock, I'm hiding in the shower.", {
    hype: "If there's a KNOCK, I'm HIDING in the SHOWER!", dry: "If there's a knock, I'm hiding in the shower. With the curtain closed.", blunt: "Knock, and I'm in the shower.",
    goofy: "If there's a knock, I'm hiding in the shower! With a rubber duck! For protection!", shy: "If there's a knock, I might just hide in the shower.", chill: "If there's a knock, I'm hiding in the shower, dude.",
    catty: "If there's a knock, I'm hiding in the shower. Let them knock.", diva: "If there's a knock, darling, I'm making my exit. Into the shower.", stoic: "Knock means shower." }],
  ['visit.wait.m02', "Please walk past my door. Please keep walking.", {
    hype: "PLEASE walk past my door! PLEASE keep WALKING!", dry: "Please walk past my door. Keep walking. Lovely hallway, isn't it.", blunt: "Walk past my door.",
    goofy: "Please walk past my door! Keep walking! The next door is nicer! It has a plant!", shy: "Please walk past my door. Please keep walking.", chill: "Walk past my door, dude. Keep walking.",
    catty: "Please walk past my door. There are better doors.", diva: "Walk on, darling. Past my door. Please.", stoic: "Keep walking." }],
  ['visit.wait.m03', "Somebody's in the hallway. I can hear them. Or I'm imagining it.", {
    hype: "Somebody's in the HALLWAY! I can HEAR them! Or I'm IMAGINING it!", dry: "Somebody's in the hallway. Or I'm imagining it. Fifty-fifty.", blunt: "Someone's in the hallway. Maybe.",
    goofy: "Somebody's in the hallway! I can hear them! Or it's my stomach! It's my stomach!", shy: "Somebody's in the hallway. I can hear them. Or I'm imagining it.", chill: "Somebody's in the hallway, dude. Or I'm imagining it.",
    catty: "Somebody's in the hallway. I can hear them. Not very stealthy.", diva: "Footsteps in the hallway, darling. Or my imagination.", stoic: "Someone's in the hallway." }],
  ['visit.wait.m04', "I've been nothing but nice to {b}. That's either very good or very bad right now.", {
    hype: "I've been NOTHING but nice to {b}! That's either VERY good or VERY bad!", dry: "I've been nothing but nice to {b}. Very good or very bad. Can't tell.", blunt: "I've been nice to {b}. Good or bad, we'll see.",
    goofy: "I've been nothing but nice to {b}! That's either very good or very bad! Like a coin flip!", shy: "I've been nothing but nice to {b}. That's either very good or very bad right now.", chill: "I've been nothing but nice to {b}, dude. Good or bad, who knows.",
    catty: "I've been nothing but nice to {b}. That's either very good or very bad. Probably good.", diva: "I've been nothing but lovely to {b}, darling. Good or bad, I can't say.", stoic: "Nice to {b}. Good or bad." }],
  ['visit.wait.m05', "Okay. If it's me, I'm offering {b} a snack. Everybody likes a snack.", {
    hype: "Okay! If it's me, I'm offering {b} a SNACK! EVERYBODY likes a snack!", dry: "If it's me, I'm offering {b} a snack. Everybody likes a snack. Supposedly.", blunt: "If it's me, {b} gets a snack.",
    goofy: "Okay! If it's me, I'm offering {b} a snack! Everybody likes a snack! It's science!", shy: "Okay. If it's me, I'll offer {b} a snack. Everybody likes a snack.", chill: "If it's me, I'm offering {b} a snack, dude. Everybody likes snacks.",
    catty: "If it's me, I'm offering {b} a snack. It's hard to yell with your mouth full.", diva: "If it's me, darling, I'll offer {b} refreshments.", stoic: "If it's me, a snack." }],
  ['visit.wait.01', "'The blocked Player is on their way to visit one of you.' Oh no. Oh no, no, no.", {
    hype: "'The blocked Player is on their way to visit one of you.' OH NO! OH NO, NO, NO!", dry: "'The blocked Player is on their way to visit one of you.' Oh no. Wonderful.", blunt: "'The blocked Player is on their way to visit one of you.' Oh no.",
    goofy: "'The blocked Player is on their way to visit one of you.' Oh no! Oh no, no, no! I'm under the table!", shy: "'The blocked Player is on their way to visit one of you.' Oh no. Oh no, no, no.", chill: "'The blocked Player is on their way to visit one of you.' Oh no, dude.",
    catty: "'The blocked Player is on their way to visit one of you.' Oh, this should be fun.", diva: "'The blocked Player is on their way to visit one of you.' Oh no, darling. Oh no.", stoic: "'The blocked Player is on their way to visit one of you.' Okay." }],
  ['visit.wait.02', "Is {b} coming here? Please don't come here.", {
    hype: "Is {b} coming HERE?! PLEASE don't come here!", dry: "Is {b} coming here. Please don't come here.", blunt: "{b} coming here? Don't.",
    goofy: "Is {b} coming here? Please don't come here! I haven't vacuumed! I don't have a vacuum!", shy: "Is {b} coming here? Please don't come here.", chill: "Is {b} coming here? Please don't, dude.",
    catty: "Is {b} coming here? Please don't. I'm busy.", diva: "Is {b} coming here, darling? Please, no.", stoic: "{b}. Don't come here." }],
  ['visit.wait.03', "If {b} walks through that door, what do I say? 'Hi, sorry you got blocked'?", {
    hype: "If {b} walks through that door, what do I SAY?! 'Hi, sorry you got BLOCKED'?!", dry: "If {b} walks in, what do I say. 'Hi, sorry you got blocked.' Perfect.", blunt: "If {b} walks in, what do I say?",
    goofy: "If {b} walks through that door, what do I say? 'Hi, sorry you got blocked'? 'Want a cookie'?", shy: "If {b} walks through that door, what do I even say? 'Hi, sorry you got blocked'?", chill: "If {b} walks in, what do I say, dude? 'Sorry you got blocked'?",
    catty: "If {b} walks through that door, what do I say? 'Hi, sorry you got blocked'? I'm not sorry.", diva: "If {b} enters, darling, what's my line? 'So sorry you got blocked'?", stoic: "If {b} walks in. What do I say?" }],
  ['visit.wait.04', "I'm not even wearing pants. Why am I not wearing pants?", {
    hype: "I'm not even wearing PANTS! WHY am I not wearing pants?!", dry: "I'm not wearing pants. Why am I not wearing pants. Great timing.", blunt: "No pants. Bad timing.",
    goofy: "I'm not even wearing pants! Why am I not wearing pants? Where are my pants? Pants!", shy: "I'm not even wearing pants. Why am I not wearing pants?", chill: "Not even wearing pants, dude. Why am I not wearing pants?",
    catty: "I'm not even wearing pants. Whoever it is can wait.", diva: "I'm not even dressed, darling! Costume, costume!", stoic: "No pants." }],
  ['visit.wait.05', "Every sound in this building is the door. That's the door. Is that the door?", {
    hype: "EVERY sound in this building is the DOOR! That's the door! IS that the door?!", dry: "Every sound in this building is the door. That's the door. That's not the door.", blunt: "Every sound is the door. Is that it?",
    goofy: "Every sound in this building is the door! That's the door! Is that the door? That was the fridge! Again!", shy: "Every sound in this building is the door. Is that the door?", chill: "Every sound's the door, dude. Is that the door?",
    catty: "Every sound in this building is the door. Is that the door? Just knock already.", diva: "Every sound is the door, darling! Is that it? Is that the door?", stoic: "Is that the door?" }],
  ['visit.wait.06', "If it's me, I'm just gonna say sorry. For everything. Just in case.", {
    hype: "If it's me, I'm just gonna say SORRY! For EVERYTHING! Just in case!", dry: "If it's me, I'm saying sorry. For everything. Just in case.", blunt: "If it's me, I'm saying sorry.",
    goofy: "If it's me, I'm just gonna say sorry! For everything! Even things I didn't do! Especially those!", shy: "If it's me, I'm just going to say sorry. For everything. Just in case.", chill: "If it's me, I'll just say sorry for everything, dude.",
    catty: "If it's me, I'm saying sorry. For nothing in particular.", diva: "If it's me, darling, I'll apologize for everything. Just in case.", stoic: "If it's me, sorry." }],
  ['visit.wait.07', "Somebody's walking the halls right now. What if it's to my door?", {
    hype: "Somebody's walking the halls RIGHT NOW! What if it's to MY door?!", dry: "Somebody's walking the halls. What if it's to my door. Lovely.", blunt: "Someone's walking the halls. My door?",
    goofy: "Somebody's walking the halls right now! What if it's to my door? What if it's to the snack machine?", shy: "Somebody's walking the halls right now. What if it's to my door?", chill: "Someone's walking the halls, dude. What if it's my door?",
    catty: "Somebody's walking the halls right now. If it's to my door, fine.", diva: "Someone walks the halls, darling. What if it's my door?", stoic: "Someone's in the halls." }],
  ['visit.wait.08', "Okay. Hair, fine. Kitchen, disaster. No time.", {
    hype: "Okay! Hair, FINE! Kitchen, DISASTER! NO TIME!", dry: "Hair, fine. Kitchen, disaster. No time. Classic.", blunt: "Hair fine. Kitchen bad. No time.",
    goofy: "Okay! Hair, fine! Kitchen, disaster! No time! I'll just stand in front of the sink!", shy: "Okay. Hair's fine. Kitchen's a disaster. No time.", chill: "Hair, fine. Kitchen, disaster. No time, dude.",
    catty: "Hair, perfect. Kitchen, disaster. Nobody looks at the kitchen.", diva: "Hair, fine, darling. Kitchen, a tragedy. No time!", stoic: "Hair fine. Kitchen not." }],
  ['visit.wait.w01', "Please walk past my door. Please walk past my door.", {
    hype: "PLEASE walk past my door! PLEASE walk past my door!", dry: "Please walk past my door. Please. Walk.", blunt: "Walk past my door.",
    goofy: "Please walk past my door! Please! I'll give you a dollar! I don't have a dollar!", shy: "Please walk past my door. Please walk past my door.", chill: "Walk past my door, dude. Please.",
    catty: "Please walk past my door. I'm not in the mood.", diva: "Walk past my door, darling. I beg you.", stoic: "Walk past." }],
  ['visit.wait.w02', "If {b} comes here, I'm opening that door with a smile. Right?", {
    hype: "If {b} comes here, I'm opening that door with a SMILE! Right?!", dry: "If {b} comes here, I'm opening the door with a smile. Right. Sure.", blunt: "If {b} comes, I'm smiling. Right?",
    goofy: "If {b} comes here, I'm opening that door with a smile! A huge smile! A slightly scary smile!", shy: "If {b} comes here, I'll open that door with a smile. Right?", chill: "If {b} comes here, I'm opening the door with a smile. Right, dude?",
    catty: "If {b} comes here, I'm opening that door with a smile. A practiced one.", diva: "If {b} comes, darling, I'll open the door with a radiant smile.", stoic: "If {b} comes, I smile." }],
  ['visit.wait.w03', "{b} is out there somewhere. In the building. Right now.", {
    hype: "{b} is OUT THERE somewhere! In the BUILDING! RIGHT NOW!", dry: "{b} is out there. In the building. Right now. Fun.", blunt: "{b}'s in the building. Right now.",
    goofy: "{b} is out there somewhere! In the building! Right now! Like a ghost! A friendly ghost?", shy: "{b} is out there somewhere. In the building. Right now.", chill: "{b}'s out there somewhere, dude. In the building.",
    catty: "{b} is out there somewhere. In the building. Plotting, probably.", diva: "{b} is somewhere in the building, darling. Right now.", stoic: "{b}'s in the building." }],
  ['visit.wait.w04', "I haven't done anything wrong. So why am I sweating?", {
    hype: "I haven't done ANYTHING wrong! So WHY am I SWEATING?!", dry: "I haven't done anything wrong. So why am I sweating.", blunt: "Did nothing wrong. Still sweating.",
    goofy: "I haven't done anything wrong! So why am I sweating? I'm a puddle! A guilty puddle!", shy: "I haven't done anything wrong. So why am I sweating?", chill: "Haven't done anything wrong, dude. Why am I sweating?",
    catty: "I haven't done anything wrong. So why am I sweating? It's warm in here. That's all.", diva: "I've done nothing wrong, darling. Why am I perspiring?", stoic: "Nothing wrong. Sweating anyway." }],
  ['visit.wait.w05', "Okay. If it's me, I'm offering {b} a drink. Hospitality.", {
    hype: "Okay! If it's me, I'm offering {b} a DRINK! HOSPITALITY!", dry: "If it's me, I'm offering {b} a drink. Hospitality. Or bribery.", blunt: "If it's me, {b} gets a drink.",
    goofy: "Okay! If it's me, I'm offering {b} a drink! Hospitality! With a little umbrella!", shy: "Okay. If it's me, I'll offer {b} a drink.", chill: "If it's me, I'm offering {b} a drink, dude. Hospitality.",
    catty: "If it's me, I'm offering {b} a drink. Hospitality. It disarms people.", diva: "If it's me, darling, {b} gets a drink. One must be gracious.", stoic: "If it's me, a drink." }],
  ['visit.wait.w06', "I hear footsteps. I definitely hear footsteps.", {
    hype: "I HEAR footsteps! I DEFINITELY hear footsteps!", dry: "I hear footsteps. Definitely footsteps. Probably.", blunt: "Footsteps.",
    goofy: "I hear footsteps! I definitely hear footsteps! Big ones! Little ones! Some footsteps!", shy: "I hear footsteps. I definitely hear footsteps.", chill: "I hear footsteps, dude. Definitely.",
    catty: "I hear footsteps. Not very subtle.", diva: "Footsteps, darling! I hear footsteps!", stoic: "Footsteps." }],
  ['visit.wait.catfish.01', "If {b} knocks on my door, my whole game is over.", {
    hype: "If {b} knocks on MY door, my WHOLE GAME is OVER!", dry: "If {b} knocks on my door, my whole game is over. No pressure.", blunt: "{b} knocks, I'm done.",
    goofy: "If {b} knocks on my door, my whole game is over! Game over! Insert coin!", shy: "If {b} knocks on my door, my whole game is over.", chill: "If {b} knocks on my door, my game's over, dude.",
    catty: "If {b} knocks on my door, my whole game is over. {b} wouldn't dare.", diva: "If {b} knocks, darling, the curtain falls on my whole performance.", stoic: "{b} knocks, game over." }],
  ['visit.wait.catfish.02', "{b} opens that door, sees me, and it's done. Please go somewhere else. Anywhere else.", {
    hype: "{b} opens that door, SEES me, and it's DONE! PLEASE go somewhere else! ANYWHERE else!", dry: "{b} opens that door, sees me, done. Please go somewhere else. Anywhere.", blunt: "{b} sees me, it's done. Go elsewhere.",
    goofy: "{b} opens that door, sees me, and it's done! Please go somewhere else! Go to the gym! There's no gym!", shy: "{b} opens that door, sees me, and it's done. Please go somewhere else. Anywhere else.", chill: "{b} opens that door, sees me, done, dude. Go somewhere else.",
    catty: "{b} opens that door, sees me, and it's done. Go bother someone else, {b}.", diva: "{b} opens that door and sees me, darling, and it's over. Go elsewhere!", stoic: "{b} sees me, done. Go elsewhere." }],
  ['visit.wait.catfish.03', "Okay. If it's me, I just tell the truth. That's all I can do.", {
    hype: "Okay! If it's me, I just tell the TRUTH! That's ALL I can do!", dry: "If it's me, I tell the truth. That's all I can do. Great plan.", blunt: "If it's me, the truth.",
    goofy: "Okay! If it's me, I just tell the truth! The whole truth! With a hand on my heart!", shy: "Okay. If it's me, I just tell the truth. That's all I can do.", chill: "If it's me, I just tell the truth, dude. That's all.",
    catty: "If it's me, I tell the truth. A version of it.", diva: "If it's me, darling, I'll tell the truth. A grand confession.", stoic: "If it's me, the truth." }],
  ['visit.wait.catfish.04', "I have never been this scared of a door in my life.", {
    hype: "I have NEVER been this SCARED of a DOOR in my LIFE!", dry: "Never been this scared of a door. New experience.", blunt: "Never been this scared of a door.",
    goofy: "I have never been this scared of a door in my life! It's just a door! A terrifying door!", shy: "I have never been this scared of a door in my life.", chill: "Never been this scared of a door, dude.",
    catty: "I have never been this scared of a door in my life. It's humiliating.", diva: "Never have I feared a door so, darling.", stoic: "Scared of a door." }],
  ['visit.wait.catfish.w01', "If that door opens, {b} is gonna see someone {b.sub} has never seen before.", {
    hype: "If that door opens, {b} is gonna see someone {b.sub} has NEVER seen before!", dry: "If that door opens, {b} sees someone {b.sub} has never seen before. Surprise.", blunt: "Door opens, {b} sees a stranger.",
    goofy: "If that door opens, {b} is gonna see someone {b.sub} has never seen before! Surprise! It's a stranger!", shy: "If that door opens, {b} is going to see someone {b.sub} has never seen before.", chill: "If that door opens, {b}'s gonna see someone {b.sub}'s never seen, dude.",
    catty: "If that door opens, {b} is going to see someone {b.sub} has never seen before. Brace yourself, {b}.", diva: "If that door opens, darling, {b} meets a total stranger.", stoic: "Door opens. {b} sees a stranger." }],
  ['visit.wait.catfish.w02', "Hide? Can I hide? Where would I even hide?", {
    hype: "HIDE?! Can I HIDE?! WHERE would I even hide?!", dry: "Hide. Can I hide. Where would I even hide.", blunt: "Where would I hide?",
    goofy: "Hide? Can I hide? Where would I even hide? The fridge! No! Too cold!", shy: "Hide? Can I hide? Where would I even hide?", chill: "Hide? Where would I even hide, dude?",
    catty: "Hide? I don't hide. Where would I hide?", diva: "Hide, darling? Where would I even go?", stoic: "Nowhere to hide." }],
  ['visit.wait.catfish.w03', "Please. Anybody but me. My face is not my profile.", {
    hype: "PLEASE! ANYBODY but me! My face is NOT my profile!", dry: "Please. Anybody but me. My face is not my profile.", blunt: "Not me. My face isn't my profile.",
    goofy: "Please! Anybody but me! My face is not my profile! My face is a surprise!", shy: "Please. Anybody but me. My face is not my profile.", chill: "Anybody but me, dude. My face isn't my profile.",
    catty: "Please. Anybody but me. My face is not my profile. Unfortunately for them.", diva: "Anyone but me, darling. My face is not the face on my profile.", stoic: "Not me. Wrong face." }],
  ['visit.wait.catfish.w04', "If it's me, I'm explaining everything. Fast.", {
    hype: "If it's me, I'm explaining EVERYTHING! FAST!", dry: "If it's me, I'm explaining everything. Fast.", blunt: "If it's me, I explain. Fast.",
    goofy: "If it's me, I'm explaining everything! Fast! Like an auctioneer!", shy: "If it's me, I'm explaining everything. Fast.", chill: "If it's me, I'm explaining everything, dude. Fast.",
    catty: "If it's me, I'm explaining everything. Fast. Before they can think.", diva: "If it's me, darling, I'll explain everything. Swiftly.", stoic: "If it's me, I explain." }],
  ['visit.wait.catfish.w05', "All this work, and one knock could end it.", {
    hype: "ALL this work, and ONE KNOCK could END it!", dry: "All this work, and one knock could end it.", blunt: "One knock ends it.",
    goofy: "All this work, and one knock could end it! Knock knock! Who's there? Disaster!", shy: "All this work, and one knock could end it.", chill: "All this work, dude, and one knock could end it.",
    catty: "All this work, and one knock could end it. That would be so annoying.", diva: "All this work, darling, and one knock could end it.", stoic: "One knock ends it." }],
  // ── face to face: the blocked player's first words ────────────────────
  ['visit.talk.friend.01', "I just wanted you to know you were my favorite person in here.", {
    hype: "I just wanted you to know you were my FAVORITE person in here!", dry: "I just wanted you to know you were my favorite person in here. Don't let it go to your head.", blunt: "You were my favorite in here.",
    goofy: "I just wanted you to know you were my favorite person in here! You and the couch. You win!", shy: "I just wanted you to know you were my favorite person in here.", chill: "Just wanted you to know you were my favorite person in here, dude.",
    catty: "I just wanted you to know you were my favorite person in here. Out of a weak field, but still.", diva: "I wanted you to know, darling, you were my favorite in here.", stoic: "You were my favorite." }],
  ['visit.talk.friend.02', "Win this for me, okay? I mean it.", {
    hype: "WIN THIS for me, okay?! I MEAN it!", dry: "Win this for me. Okay. I mean it.", blunt: "Win this for me.",
    goofy: "Win this for me, okay? I mean it! Win it twice!", shy: "Win this for me, okay? I mean it.", chill: "Win this for me, okay, dude? I mean it.",
    catty: "Win this for me, okay? Don't let any of them have it.", diva: "Win this for me, darling. I mean it.", stoic: "Win it for me." }],
  ['visit.talk.friend.03', "I know. I'm not here about the game. I'm here because I like you.", {
    hype: "I KNOW! I'm not here about the GAME! I'm here because I LIKE you!", dry: "I know. Not here about the game. I'm here because I like you. Shocking.", blunt: "Not about the game. I like you.",
    goofy: "I know! I'm not here about the game! I'm here because I like you! And you have good snacks!", shy: "I know. I'm not here about the game. I'm here because I like you.", chill: "I know. Not here about the game, dude. I just like you.",
    catty: "I know. I'm not here about the game. I'm here because I actually like you. Rare.", diva: "Not about the game, darling. I'm here because I adore you.", stoic: "Not the game. I like you." }],
  ['visit.talk.friend.04', "I didn't come here to talk about the game.", {
    hype: "I did NOT come here to talk about the GAME!", dry: "I didn't come here to talk about the game. For once.", blunt: "Not here for the game.",
    goofy: "I didn't come here to talk about the game! I came for a hug! And a juice box!", shy: "I didn't come here to talk about the game.", chill: "Didn't come here to talk about the game, dude.",
    catty: "I didn't come here to talk about the game. I've had enough of the game.", diva: "I didn't come here for the game, darling.", stoic: "Not here for the game." }],
  ['visit.talk.friend.05', "Out of everybody. It wasn't even close.", {
    hype: "Out of EVERYBODY! It wasn't even CLOSE!", dry: "Out of everybody. It wasn't even close.", blunt: "Out of everybody. Not close.",
    goofy: "Out of everybody! It wasn't even close! Not even in the same zip code!", shy: "Out of everybody. It wasn't even close.", chill: "Out of everybody, dude. Not even close.",
    catty: "Out of everybody. It wasn't even close. The others weren't trying.", diva: "Out of everyone, darling. It wasn't close.", stoic: "Not close." }],
  ['visit.talk.friend.06', "You're even funnier in person. That's not fair.", {
    hype: "You're even FUNNIER in person! That's NOT FAIR!", dry: "You're even funnier in person. That's not fair.", blunt: "Funnier in person. Unfair.",
    goofy: "You're even funnier in person! That's not fair! I need a minute! My sides hurt!", shy: "You're even funnier in person. That's not fair.", chill: "You're even funnier in person, dude. Not fair.",
    catty: "You're even funnier in person. That's not fair. I'm the funny one.", diva: "You're even funnier in person, darling. How unfair.", stoic: "Funnier in person." }],
  ['visit.talk.friend.07', "Don't be mad. Be smart. Stay in this.", {
    hype: "DON'T be mad! Be SMART! STAY in this!", dry: "Don't be mad. Be smart. Stay in this.", blunt: "Don't be mad. Be smart. Stay in.",
    goofy: "Don't be mad! Be smart! Stay in this! Like a hermit crab in its shell!", shy: "Don't be mad. Be smart. Stay in this.", chill: "Don't be mad, dude. Be smart. Stay in this.",
    catty: "Don't be mad. Be smart. Stay in this. Beat them for me.", diva: "Don't be angry, darling. Be clever. Stay in this.", stoic: "Be smart. Stay in." }],
  ['visit.talk.friend.08', "I needed one real hug before I go.", {
    hype: "I NEEDED one REAL hug before I go!", dry: "I needed one real hug before I go. Just one.", blunt: "One real hug before I go.",
    goofy: "I needed one real hug before I go! A big squeezy one! Squeeze!", shy: "I needed one real hug before I go.", chill: "Needed one real hug before I go, dude.",
    catty: "I needed one real hug before I go. Don't tell anyone.", diva: "One real embrace before I go, darling.", stoic: "One hug before I go." }],
  ['visit.talk.answers.01', "So. Why me?", {
    hype: "SO! WHY ME?!", dry: "So. Why me.", blunt: "Why me?",
    goofy: "So! Why me? Was it my socks? It was the socks!", shy: "So. Why me?", chill: "So. Why me, dude?",
    catty: "So. Why me?", diva: "So, darling. Why me?", stoic: "Why me?" }],
  ['visit.talk.answers.02', "I thought we were good. What happened?", {
    hype: "I THOUGHT we were GOOD! What HAPPENED?!", dry: "I thought we were good. What happened.", blunt: "Thought we were good. What happened?",
    goofy: "I thought we were good! What happened? Did I say something weird? I say a lot of weird things!", shy: "I thought we were good. What happened?", chill: "Thought we were good, dude. What happened?",
    catty: "I thought we were good. What happened? Because something did.", diva: "I thought we were good, darling. What happened?", stoic: "We were good. What happened?" }],
  ['visit.talk.answers.03', "Of course I came here. You owe me an answer.", {
    hype: "Of COURSE I came here! You OWE me an answer!", dry: "Of course I came here. You owe me an answer.", blunt: "You owe me an answer.",
    goofy: "Of course I came here! You owe me an answer! And a juice! Mostly the answer!", shy: "Of course I came here. I think you owe me an answer.", chill: "Of course I came here, dude. You owe me an answer.",
    catty: "Of course I came here. You owe me an answer. A good one.", diva: "Of course I came, darling. You owe me an answer.", stoic: "You owe me an answer." }],
  ['visit.talk.answers.04', "Just be honest with me. Was it you?", {
    hype: "Just be HONEST with me! Was it YOU?!", dry: "Just be honest with me. Was it you.", blunt: "Honestly. Was it you?",
    goofy: "Just be honest with me! Was it you? Blink twice if it was you!", shy: "Just be honest with me. Was it you?", chill: "Just be honest with me, dude. Was it you?",
    catty: "Just be honest with me. Was it you? I'll know if you lie.", diva: "Be honest with me, darling. Was it you?", stoic: "Was it you?" }],
  ['visit.talk.answers.05', "I'm not mad. I'm hurt. There's a difference.", {
    hype: "I'm NOT mad! I'm HURT! There's a DIFFERENCE!", dry: "I'm not mad. I'm hurt. There's a difference.", blunt: "Not mad. Hurt.",
    goofy: "I'm not mad! I'm hurt! There's a difference! Mad is red! Hurt is blue!", shy: "I'm not mad. I'm hurt. There's a difference.", chill: "I'm not mad, dude. I'm hurt. Big difference.",
    catty: "I'm not mad. I'm hurt. And I'm a little mad.", diva: "I'm not angry, darling. I'm wounded.", stoic: "Not mad. Hurt." }],
  ['visit.talk.answers.06', "Why me? Tell me the truth.", {
    hype: "WHY ME?! Tell me the TRUTH!", dry: "Why me. Tell me the truth.", blunt: "Why me? The truth.",
    goofy: "Why me? Tell me the truth! The whole truth! And nothing but the snacks!", shy: "Why me? Please tell me the truth.", chill: "Why me, dude? Tell me the truth.",
    catty: "Why me? Tell me the truth. I can take it.", diva: "Why me, darling? The truth.", stoic: "Why me? Truth." }],
  ['visit.talk.answers.07', "Then you know I'm not leaving without a straight answer.", {
    hype: "Then you KNOW I'm NOT leaving without a STRAIGHT answer!", dry: "Then you know I'm not leaving without a straight answer.", blunt: "Not leaving without a straight answer.",
    goofy: "Then you know I'm not leaving without a straight answer! I'll sit on your couch forever!", shy: "Then you know I'm not leaving without a straight answer.", chill: "Then you know I'm not leaving without a straight answer, dude.",
    catty: "Then you know I'm not leaving without a straight answer. I have all night.", diva: "Then you know, darling, I'm not leaving without a straight answer.", stoic: "Straight answer. Then I go." }],
  ['visit.talk.answers.08', "Was it something I said?", {
    hype: "Was it something I SAID?!", dry: "Was it something I said.", blunt: "Something I said?",
    goofy: "Was it something I said? I say so many things! Which one?", shy: "Was it something I said?", chill: "Was it something I said, dude?",
    catty: "Was it something I said? Because I said a lot.", diva: "Was it something I said, darling?", stoic: "Something I said?" }],
  ['visit.talk.answers.09', "Whose idea was it? Yours or theirs?", {
    hype: "WHOSE idea was it?! YOURS or THEIRS?!", dry: "Whose idea was it. Yours or theirs.", blunt: "Your idea or theirs?",
    goofy: "Whose idea was it? Yours or theirs? Or a third person? A secret person?", shy: "Whose idea was it? Yours or theirs?", chill: "Whose idea was it, dude? Yours or theirs?",
    catty: "Whose idea was it? Yours or theirs? I'd like to know who to thank.", diva: "Whose idea, darling? Yours or theirs?", stoic: "Yours or theirs?" }],
  ['visit.talk.answers.10', "So it was all you. Nobody else to blame.", {
    hype: "So it was ALL YOU! NOBODY else to blame!", dry: "So it was all you. Nobody else to blame.", blunt: "All you. Nobody else.",
    goofy: "So it was all you! Nobody else to blame! Not even the Circle!", shy: "So it was all you. Nobody else to blame.", chill: "So it was all you, dude. Nobody else to blame.",
    catty: "So it was all you. Nobody else to blame. Good to know.", diva: "So it was all you, darling. No one else to blame.", stoic: "All you." }],
  ['visit.talk.answers.11', "Don't be sorry. Just tell me why.", {
    hype: "DON'T be sorry! Just tell me WHY!", dry: "Don't be sorry. Just tell me why.", blunt: "Not sorry. Why.",
    goofy: "Don't be sorry! Just tell me why! Sorry is for when you step on a toe!", shy: "Don't be sorry. Just tell me why.", chill: "Don't be sorry, dude. Just tell me why.",
    catty: "Don't be sorry. Just tell me why. Sorry is cheap.", diva: "Don't be sorry, darling. Just tell me why.", stoic: "Don't be sorry. Why?" }],
  ['visit.talk.answers.12', "Did you even think about it, or was it easy?", {
    hype: "Did you even THINK about it, or was it EASY?!", dry: "Did you even think about it. Or was it easy.", blunt: "Did you think about it, or was it easy?",
    goofy: "Did you even think about it, or was it easy? Like picking a donut?", shy: "Did you even think about it, or was it easy?", chill: "Did you even think about it, dude, or was it easy?",
    catty: "Did you even think about it, or was it easy? Be honest.", diva: "Did you even think about it, darling, or was it easy?", stoic: "Hard, or easy?" }],
  ['visit.talk.answers.13', "You were so sweet to me in every chat.", {
    hype: "You were SO sweet to me in EVERY chat!", dry: "You were so sweet to me in every chat. Every one.", blunt: "You were sweet to me in every chat.",
    goofy: "You were so sweet to me in every chat! Like a cupcake! A sneaky cupcake!", shy: "You were so sweet to me in every chat.", chill: "You were so sweet to me in every chat, dude.",
    catty: "You were so sweet to me in every chat. Very convincing.", diva: "You were so sweet to me in every chat, darling.", stoic: "Sweet in every chat." }],
  ['visit.talk.answers.14', "I would have kept you safe. You know that, right?", {
    hype: "I WOULD have kept you SAFE! You KNOW that, right?!", dry: "I would have kept you safe. You know that. Right.", blunt: "I'd have kept you safe.",
    goofy: "I would have kept you safe! You know that, right? Like a bodyguard! A tiny one!", shy: "I would have kept you safe. You know that, right?", chill: "I would've kept you safe, dude. You know that, right?",
    catty: "I would have kept you safe. You know that, right? Think about that.", diva: "I'd have kept you safe, darling. You know that.", stoic: "I'd have kept you safe." }],
  ['visit.talk.truth.01', "I had to see for myself. I had my doubts about you.", {
    hype: "I HAD to see for myself! I had my DOUBTS about you!", dry: "I had to see for myself. I had my doubts about you.", blunt: "Had to see. I had doubts.",
    goofy: "I had to see for myself! I had my doubts about you! Big doubts! Doubt soup!", shy: "I had to see for myself. I had my doubts about you.", chill: "Had to see for myself, dude. I had my doubts.",
    catty: "I had to see for myself. I had my doubts about you. Clearly.", diva: "I had to see for myself, darling. I had my doubts.", stoic: "Had to see. Had doubts." }],
  ['visit.talk.truth.02', "I've wondered about you since day one.", {
    hype: "I've WONDERED about you since DAY ONE!", dry: "I've wondered about you since day one.", blunt: "Wondered about you since day one.",
    goofy: "I've wondered about you since day one! Day one! Even before day one!", shy: "I've wondered about you since day one.", chill: "Wondered about you since day one, dude.",
    catty: "I've wondered about you since day one. I'm rarely wrong.", diva: "I've wondered about you since the very first day, darling.", stoic: "Since day one." }],
  ['visit.talk.truth.03', "I'm leaving, so I don't need to play anymore. I just wanted the truth.", {
    hype: "I'm LEAVING, so I don't need to PLAY anymore! I just wanted the TRUTH!", dry: "I'm leaving. No need to play anymore. I just wanted the truth.", blunt: "I'm leaving. I want the truth.",
    goofy: "I'm leaving, so I don't need to play anymore! I just wanted the truth! It's like a dessert at the end!", shy: "I'm leaving, so I don't need to play anymore. I just wanted the truth.", chill: "I'm leaving, dude. No need to play. Just want the truth.",
    catty: "I'm leaving, so I don't need to play anymore. I just wanted the truth. Give it to me.", diva: "I'm leaving, darling. The game is over for me. I want the truth.", stoic: "I'm leaving. The truth." }],
  ['visit.talk.apology.01', "I need to say sorry. I wasn't always honest with you.", {
    hype: "I NEED to say SORRY! I wasn't ALWAYS honest with you!", dry: "I need to say sorry. I wasn't always honest with you.", blunt: "Sorry. I wasn't always honest.",
    goofy: "I need to say sorry! I wasn't always honest with you! Like when I said I liked cardio!", shy: "I need to say sorry. I wasn't always honest with you.", chill: "Need to say sorry, dude. Wasn't always honest with you.",
    catty: "I need to say sorry. I wasn't always honest with you. Nobody in here is.", diva: "I must apologize, darling. I wasn't always honest with you.", stoic: "Sorry. I wasn't honest." }],
  ['visit.talk.apology.02', "You were so good to me, and I played you. I'm sorry.", {
    hype: "You were SO good to me, and I PLAYED you! I'm SORRY!", dry: "You were good to me, and I played you. I'm sorry.", blunt: "You were good to me. I played you. Sorry.",
    goofy: "You were so good to me, and I played you! Like a kazoo! I'm sorry!", shy: "You were so good to me, and I played you. I'm sorry.", chill: "You were so good to me, dude, and I played you. Sorry.",
    catty: "You were so good to me, and I played you. I'm sorry. Genuinely.", diva: "You were so good to me, darling, and I played you. I'm sorry.", stoic: "You were good. I played you. Sorry." }],
  ['visit.talk.apology.03', "I came here to apologize, not to explain. You didn't deserve that.", {
    hype: "I came here to APOLOGIZE, not to EXPLAIN! You didn't DESERVE that!", dry: "I came here to apologize, not explain. You didn't deserve that.", blunt: "I'm here to apologize. You didn't deserve it.",
    goofy: "I came here to apologize, not to explain! You didn't deserve that! You deserve a parade!", shy: "I came here to apologize, not to explain. You didn't deserve that.", chill: "Came here to apologize, dude, not explain. You didn't deserve that.",
    catty: "I came here to apologize, not to explain. You didn't deserve that. Some of them did.", diva: "I came to apologize, darling, not to explain. You didn't deserve that.", stoic: "Here to apologize. You didn't deserve it." }],
  ['visit.talk.confront.fire.01', "You smiled at me in every chat, and then you blocked me. Who does that?", {
    hype: "You SMILED at me in EVERY chat, and then you BLOCKED me! WHO does that?!", dry: "You smiled at me in every chat, then blocked me. Who does that.", blunt: "Smiled in every chat, then blocked me. Who does that?",
    goofy: "You smiled at me in every chat, and then you blocked me! Who does that? A smiling shark!", shy: "You smiled at me in every chat, and then you blocked me. Who does that?", chill: "You smiled at me in every chat, dude, then blocked me. Who does that?",
    catty: "You smiled at me in every chat, and then you blocked me. Who does that? Oh. You.", diva: "You smiled at me in every chat, darling, then blocked me. Who does that?", stoic: "Every chat, a smile. Then blocked." }],
  ['visit.talk.confront.fire.02', "Fake. You are so fake.", {
    hype: "FAKE! You are SO FAKE!", dry: "Fake. You are so fake.", blunt: "You're fake.",
    goofy: "Fake! You are so fake! Like a plastic banana!", shy: "Fake. You are so fake.", chill: "Fake, dude. So fake.",
    catty: "Fake. You are so fake. I should have seen it.", diva: "Fake, darling. Utterly fake.", stoic: "Fake." }],
  ['visit.talk.confront.fire.03', "You didn't even have the guts to tell me anything in a chat first.", {
    hype: "You didn't even have the GUTS to tell me ANYTHING in a chat first!", dry: "You didn't have the guts to tell me anything in a chat first.", blunt: "No guts to tell me first.",
    goofy: "You didn't even have the guts to tell me anything in a chat first! Not even a sad emoji!", shy: "You didn't even tell me anything in a chat first.", chill: "You didn't even have the guts to tell me in a chat first, dude.",
    catty: "You didn't even have the guts to tell me anything in a chat first. Cowardly.", diva: "You didn't even have the courage to warn me in a chat, darling.", stoic: "No warning. No guts." }],
  ['visit.talk.confront.fire.04', "Wow. You haven't even heard what I came to say.", {
    hype: "WOW! You haven't even HEARD what I came to SAY!", dry: "Wow. You haven't even heard what I came to say.", blunt: "You haven't heard what I came to say.",
    goofy: "Wow! You haven't even heard what I came to say! I had a speech! With jokes!", shy: "Wow. You haven't even heard what I came to say.", chill: "Wow, dude. You haven't even heard what I came to say.",
    catty: "Wow. You haven't even heard what I came to say. Rude.", diva: "You haven't even heard my speech, darling.", stoic: "You haven't heard me yet." }],
  ['visit.talk.confront.fire.05', "I trusted you. I told you things I didn't tell anybody.", {
    hype: "I TRUSTED you! I told you things I didn't tell ANYBODY!", dry: "I trusted you. I told you things I didn't tell anybody.", blunt: "I trusted you. Told you everything.",
    goofy: "I trusted you! I told you things I didn't tell anybody! Not even my goldfish!", shy: "I trusted you. I told you things I didn't tell anybody.", chill: "I trusted you, dude. Told you things I didn't tell anybody.",
    catty: "I trusted you. I told you things I didn't tell anybody. My mistake.", diva: "I trusted you, darling. I told you my secrets.", stoic: "I trusted you." }],
  ['visit.talk.confront.take.01', "Do you have any idea what you just did to me?", {
    hype: "Do you have ANY IDEA what you just DID to me?!", dry: "Do you have any idea what you just did to me.", blunt: "Do you know what you did to me?",
    goofy: "Do you have any idea what you just did to me? I'm a mess! A walking mess!", shy: "Do you have any idea what you just did to me?", chill: "Do you have any idea what you just did to me, dude?",
    catty: "Do you have any idea what you just did to me? Clearly not.", diva: "Do you have any idea what you've done to me, darling?", stoic: "Do you know what you did?" }],
  ['visit.talk.confront.take.02', "I'm so angry I can't even sit down.", {
    hype: "I'm SO ANGRY I can't even SIT DOWN!", dry: "I'm so angry I can't sit down.", blunt: "Too angry to sit.",
    goofy: "I'm so angry I can't even sit down! My legs won't bend! Angry legs!", shy: "I'm so angry I can't even sit down.", chill: "I'm so angry I can't even sit, dude.",
    catty: "I'm so angry I can't even sit down. And your couch isn't that nice.", diva: "I'm too furious to sit, darling.", stoic: "Too angry to sit." }],
  ['visit.talk.confront.take.03', "You could've picked anybody. Anybody! You picked me.", {
    hype: "You could've picked ANYBODY! ANYBODY! You picked ME!", dry: "You could've picked anybody. You picked me.", blunt: "Anybody. You picked me.",
    goofy: "You could've picked anybody! Anybody! The lamp! You picked me!", shy: "You could've picked anybody. Anybody. You picked me.", chill: "You could've picked anybody, dude. You picked me.",
    catty: "You could've picked anybody. Anybody! Some of them deserved it. You picked me.", diva: "You could have chosen anyone, darling. You chose me.", stoic: "Anybody. You picked me." }],
  ['visit.talk.confront.take.04', "Don't act brave now. You weren't brave when you typed my name.", {
    hype: "DON'T act brave NOW! You weren't brave when you TYPED my name!", dry: "Don't act brave now. You weren't brave when you typed my name.", blunt: "Don't act brave. You weren't when you typed my name.",
    goofy: "Don't act brave now! You weren't brave when you typed my name! Your fingers were shaking! I bet!", shy: "Don't act brave now. You weren't brave when you typed my name.", chill: "Don't act brave now, dude. You weren't brave when you typed my name.",
    catty: "Don't act brave now. You weren't brave when you typed my name. Hiding behind a screen.", diva: "Don't act brave now, darling. You weren't when you typed my name.", stoic: "You weren't brave typing my name." }],
  ['visit.talk.confront.take.05', "Say something! Don't just sit there and nod at me!", {
    hype: "SAY SOMETHING! Don't just SIT there and NOD at me!", dry: "Say something. Don't just sit there and nod at me.", blunt: "Say something. Stop nodding.",
    goofy: "Say something! Don't just sit there and nod at me! You look like a bobblehead!", shy: "Say something. Please don't just sit there and nod at me.", chill: "Say something, dude. Don't just nod at me.",
    catty: "Say something! Don't just sit there and nod at me. It's insulting.", diva: "Say something, darling! Don't just sit there nodding!", stoic: "Say something." }],
  ['visit.talk.confront.defend.01', "Why me? And don't give me 'it was a game move.'", {
    hype: "WHY ME?! And DON'T give me 'it was a game move.'", dry: "Why me. And don't give me 'it was a game move.'", blunt: "Why me? Not 'it was a game move.'",
    goofy: "Why me? And don't give me 'it was a game move.' Game moves are for checkers!", shy: "Why me? And please don't say 'it was a game move.'", chill: "Why me, dude? And don't give me 'it was a game move.'",
    catty: "Why me? And don't give me 'it was a game move.' Be original.", diva: "Why me, darling? And spare me 'it was a game move.'", stoic: "Why me? Not 'a game move.'" }],
  ['visit.talk.confront.defend.02', "You owe me an explanation.", {
    hype: "You OWE me an EXPLANATION!", dry: "You owe me an explanation.", blunt: "Explain.",
    goofy: "You owe me an explanation! A long one! With diagrams!", shy: "I think you owe me an explanation.", chill: "You owe me an explanation, dude.",
    catty: "You owe me an explanation. A good one.", diva: "You owe me an explanation, darling.", stoic: "Explain." }],
  ['visit.talk.confront.defend.03', "You looked me in the eye in that chat and told me I was safe.", {
    hype: "You looked me in the EYE in that chat and told me I was SAFE!", dry: "You looked me in the eye in that chat and told me I was safe.", blunt: "You told me I was safe.",
    goofy: "You looked me in the eye in that chat and told me I was safe! Well, in the emoji! You looked me in the emoji!", shy: "You looked me in the eye in that chat and told me I was safe.", chill: "You looked me in the eye in that chat, dude, and said I was safe.",
    catty: "You looked me in the eye in that chat and told me I was safe. And I believed you.", diva: "You looked me in the eye in that chat, darling, and told me I was safe.", stoic: "You said I was safe." }],
  ['visit.talk.confront.defend.04', "Whose idea was it? Yours or the other one's?", {
    hype: "WHOSE idea was it?! YOURS or the OTHER one's?!", dry: "Whose idea was it. Yours or the other one's.", blunt: "Yours or the other one's idea?",
    goofy: "Whose idea was it? Yours or the other one's? Or was it a group project?", shy: "Whose idea was it? Yours or the other one's?", chill: "Whose idea was it, dude? Yours or the other one's?",
    catty: "Whose idea was it? Yours or the other one's? I'd like names.", diva: "Whose idea, darling? Yours or the other one's?", stoic: "Yours or theirs?" }],
  ['visit.talk.confront.defend.05', "Just tell me what I did wrong.", {
    hype: "Just TELL me what I did WRONG!", dry: "Just tell me what I did wrong.", blunt: "What did I do wrong?",
    goofy: "Just tell me what I did wrong! I'll fix it! I'll fix it with tape!", shy: "Just tell me what I did wrong.", chill: "Just tell me what I did wrong, dude.",
    catty: "Just tell me what I did wrong. I'm curious what you'll make up.", diva: "Just tell me what I did wrong, darling.", stoic: "What did I do wrong?" }],
  ['visit.talk.crush.01', "So. You're even better in person.", {
    hype: "SO! You're even BETTER in person!", dry: "So. You're even better in person. Annoying.", blunt: "You're better in person.",
    goofy: "So! You're even better in person! Like pizza! Pizza is better in person too!", shy: "So. You're even better in person.", chill: "So. You're even better in person, dude.",
    catty: "So. You're even better in person. I'll allow it.", diva: "So, darling. You're even better in person.", stoic: "Better in person." }],
  ['visit.talk.crush.02', "Who else would I come to see?", {
    hype: "WHO ELSE would I come to see?!", dry: "Who else would I come to see.", blunt: "Who else would I see?",
    goofy: "Who else would I come to see? The lamp? No! You!", shy: "Who else would I come to see?", chill: "Who else would I come to see, dude?",
    catty: "Who else would I come to see? Obviously you.", diva: "Who else would I come to see, darling?", stoic: "Who else?" }],
  ['visit.talk.crush.03', "I had to know if it was real.", {
    hype: "I HAD to know if it was REAL!", dry: "I had to know if it was real.", blunt: "Had to know if it was real.",
    goofy: "I had to know if it was real! Pinch me! Gently!", shy: "I had to know if it was real.", chill: "Had to know if it was real, dude.",
    catty: "I had to know if it was real. Nothing else in here is.", diva: "I had to know if it was real, darling.", stoic: "Had to know if it's real." }],
  ['visit.talk.family.01', "Whatever happens now, I'm so proud of you.", {
    hype: "Whatever happens NOW, I'm SO PROUD of you!", dry: "Whatever happens now, I'm proud of you. Very.", blunt: "Whatever happens, I'm proud of you.",
    goofy: "Whatever happens now, I'm so proud of you! I'm bursting! Like a balloon!", shy: "Whatever happens now, I'm so proud of you.", chill: "Whatever happens now, dude, I'm so proud of you.",
    catty: "Whatever happens now, I'm so proud of you. You're better than all of them.", diva: "Whatever happens, darling, I'm so proud of you.", stoic: "Proud of you." }],
  ['visit.talk.family.02', "Don't be sorry. Be smart. You're still in.", {
    hype: "DON'T be sorry! Be SMART! You're STILL IN!", dry: "Don't be sorry. Be smart. You're still in.", blunt: "Don't be sorry. You're still in.",
    goofy: "Don't be sorry! Be smart! You're still in! Go get 'em!", shy: "Don't be sorry. Be smart. You're still in.", chill: "Don't be sorry, dude. Be smart. You're still in.",
    catty: "Don't be sorry. Be smart. You're still in. Use it.", diva: "Don't be sorry, darling. Be clever. You're still in.", stoic: "Be smart. You're in." }],
  ['visit.talk.family.03', "You know you're the reason I lasted this long.", {
    hype: "You KNOW you're the REASON I lasted this long!", dry: "You know you're the reason I lasted this long.", blunt: "You're why I lasted.",
    goofy: "You know you're the reason I lasted this long! You and snacks! Mostly you!", shy: "You know you're the reason I lasted this long.", chill: "You're the reason I lasted this long, dude.",
    catty: "You know you're the reason I lasted this long. Nobody else helped.", diva: "You're the reason I lasted this long, darling.", stoic: "You're why I lasted." }],
  ['visit.talk.power.01', "I didn't come to say goodbye. I came to give you something.", {
    hype: "I DIDN'T come to say goodbye! I came to GIVE you something!", dry: "I didn't come to say goodbye. I came to give you something.", blunt: "Not goodbye. I've got something for you.",
    goofy: "I didn't come to say goodbye! I came to give you something! It's not a cookie! It's better!", shy: "I didn't come to say goodbye. I came to give you something.", chill: "Didn't come to say goodbye, dude. Came to give you something.",
    catty: "I didn't come to say goodbye. I came to give you something. Use it well.", diva: "I didn't come to say goodbye, darling. I came bearing a gift.", stoic: "Not goodbye. Something for you." }],
  ['visit.talk.power.02', "You were always good to me. So I'm going to be good to you.", {
    hype: "You were ALWAYS good to me! So I'm gonna be GOOD to you!", dry: "You were always good to me. So I'll be good to you.", blunt: "You were good to me. My turn.",
    goofy: "You were always good to me! So I'm going to be good to you! Goodness boomerang!", shy: "You were always good to me. So I'm going to be good to you.", chill: "You were always good to me, dude. So I'll be good to you.",
    catty: "You were always good to me. So I'm going to be good to you. Unlike some.", diva: "You were always good to me, darling. Now I return the favor.", stoic: "You were good to me. Now me." }],
  ['visit.talk.power.03', "They don't get my time. You do.", {
    hype: "THEY don't get my time! YOU do!", dry: "They don't get my time. You do.", blunt: "Not them. You.",
    goofy: "They don't get my time! You do! All of it! Every minute!", shy: "They don't get my time. You do.", chill: "They don't get my time, dude. You do.",
    catty: "They don't get my time. You do. They don't deserve it.", diva: "They don't get my time, darling. You do.", stoic: "Not them. You." }],
];
