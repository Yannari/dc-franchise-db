// ══════════════════════════════════════════════════════════════════════
// dr/data/entrances.js — the walk through the door, and the room's answer
// ══════════════════════════════════════════════════════════════════════
//
// The premiere's entrance is the one line every queen is remembered by
// before she has done anything, and until now this show did not have any.
// The arrivals screen was borrowing her first scene of the season, which is
// a scene about something else with her name in it.
//
// ── WHAT DECIDES THE LINE ─────────────────────────────────────────────
//
// Her DRAG STYLE picks the pool and her ATTITUDE picks within it. That order
// matters and it is the honest one: an entrance is a brand statement, and a
// pageant queen and a punk do not make the same one however bold they are.
// Attitude then decides whether she says it loud, dry, or barely at all.
//
//   style      one of the ten in js/dr/queen.js — the pool
//   attitude   'big'   boldness and star power high: she plays to camera
//              'dry'   low temperament or a schemer: she underplays it
//              'warm'  high social, low boldness: she arrives friendly
//
// Everything is PROPORTIONAL, as the project requires: attitude is picked
// from a weighted roll on her stats, never a threshold, so the same queen
// can arrive differently in two seasons and no stat line locks a bucket.
//
// ── AND THE ROOM ANSWERS ──────────────────────────────────────────────
//
// A line nobody reacts to is a line delivered to an empty room. The reaction
// pool is keyed by how it LANDED, which is her delivery against the room's
// appetite — not by whether the line was "good", which nothing can measure.
//
// `{a}` is the arriving queen. `{b}` is whoever was already standing there.

/** Entrance lines, by drag style, then by attitude. Eight of each: 240 lines. */
export const ENTRANCE_LINES = {
  pageant: {
    big: [
      "Move over girls, the crown's already packed!",
      "Three titles, two sashes, and I'm coming for a third!",
      "Ladies, the winner just walked in. You're welcome.",
      "I didn't come to play, I came to SLAY and I brought receipts!",
      "Step aside, girls. The pageant queen's here and she's taking the whole damn stage.",
      "Y'all can fight for second place, I've already won this in my head!",
      "I've got more crowns than most of you have wigs. Let's go!",
      "Who's ready to lose? Because I've been ready to WIN.",
    ],
    dry: [
      "I've done this before. Not this exactly, but the lighting's the same.",
      "Twelve years of pageants and the carpet's still the worst part.",
      "I'm not here to make friends. I'm here on a schedule.",
      "I've got a binder with tabs. That's all you need to know.",
      "My talent is winning things politely. It upsets people.",
      "I peaked at an interview round in 2019 and I've been chasing it since.",
      "Yeah, I've got a system. No, you can't borrow it.",
      "I iron my lashes. That should tell you everything.",
    ],
    warm: [
      "Hello! I've watched every season and I already cried once in the car!",
      "Oh, this room is BEAUTIFUL. Hi! I'm gonna hug everybody.",
      "I brought snacks. I don't know why. I always bring snacks.",
      "Hi! Anyone need a safety pin, a steamer, or a pep talk? I'm fully stocked!",
      "My mama's watching and she'll notice if I don't say hello right. Hi!",
      "I'm the girl who compliments your shoes and means it. Those shoes are INCREDIBLE.",
      "I've already rehearsed my thank-you speech and you're all in it!",
      "I'm gonna be so supportive it becomes a problem.",
    ],
  },
  comedy: {
    big: [
      "I've been rehearsing this walk since I was eleven, don't ruin it!",
      "Call the fire department! Not for me — I left something burning backstage.",
      "I'm the funny one, the role's taken, y'all can relax!",
      "I've got forty minutes of material and about nine seconds of look. Let's go!",
      "They said make an entrance. I made three. That was the third.",
      "Girls, the reading challenge starts NOW and I didn't bring notes!",
      "This is my serious face. It lasts about four seconds and then we're done.",
      "Who's ready to be read? Because I've been waiting ALL day.",
    ],
    dry: [
      "Hi. I'll be funny in about four days, once I'm comfortable.",
      "I had a great entrance line but I left it in the van.",
      "I'm here, I'm tired, and I'm gonna be hilarious about it.",
      "That's the entrance. I'm not doing another one.",
      "I do comedy, which means I'll be unbearable in exactly one week.",
      "Someone laugh so I know the room works. Thank you. That's all I needed.",
      "I'm funny. Not right now. But in general, absolutely.",
      "I brought a punchline and forgot the setup. Give me a minute.",
    ],
    warm: [
      "Oh good, other people! I was worried it was just me and the mirrors.",
      "Hi! I'm the one who talks too much. You'll get used to it or you won't!",
      "I already love it here and I've been here for nine seconds!",
      "Hello! I'm gonna laugh at everything today out of pure nerves.",
      "Hi — I've decided we're all friends. You had no say. It's done.",
      "I brought bits. I brought several bits. I don't have other personality traits.",
      "I'm here to make friends AND jokes, and the jokes will be about the friends.",
      "Everybody relax. I'm gonna make this weird and we're all gonna enjoy it.",
    ],
  },
  fashion: {
    big: [
      "The reference is obscure, the tailoring isn't, and neither is for you.",
      "I didn't come to compete. I came to be photographed.",
      "This is drag as a discipline. Take notes or don't — I'll be busy.",
      "Everything I'm wearing? Made by me. Everything you're wearing? Not.",
      "There's a silhouette in this room now. There wasn't one before.",
      "Some of y'all have a wig and a hope. I have a point of view.",
      "This is couture and most of you are looking at it from the wrong angle.",
      "I'm wearing the best thing in this room and I made it on my bedroom floor.",
    ],
    dry: [
      "I made this on a train. Don't touch the shoulder.",
      "Yeah, it's a look. No, it doesn't have a theme. That IS the theme.",
      "I'll be in the corner, not saying much, out-dressing everybody.",
      "The hem's raw on purpose. Everything about me is raw on purpose.",
      "I own four colours and I brought all of them.",
      "I'd explain the construction but you'd have to care about darts.",
      "I finished this at 4am and I've got opinions about every stitch.",
      "The seams are French. I'm not. The seams don't care.",
    ],
    warm: [
      "Hi — sorry, is anyone else obsessed with that wallpaper? No? Just me.",
      "Hello! I wanna see everybody's garments immediately, this is my favourite part!",
      "I'm so happy to be here I might sit down before I fall down!",
      "Hi! If your zip goes, come to me. I'm very good at other people's emergencies.",
      "Oh, the FABRIC in this room! Hello. Sorry. Hello properly.",
      "I've been sewing since I was nine and I still can't do a buttonhole. Hi!",
      "Touch the fabric. Actually wait — don't. Okay fine, touch it. Gently.",
      "I wanna see every garment in this room laid flat so I can take notes.",
    ],
  },
  camp: {
    big: [
      "Make room girls, the circus is in town!",
      "People say I'm expensive but I'm really just stupid! Both compliments!",
      "You wanted high art? Wrong door, baby. This one's got a whoopee cushion.",
      "I've never had a subtle thought in my life and it's served me beautifully!",
      "Someone told me to tone it down once. I ate them.",
      "This isn't a costume, it's a lifestyle and it's got a support group!",
      "None of this is ironic. ALL of this is ironic. Both at the same time!",
      "I've been too much since birth and I've got a mama who'll back that up!",
    ],
    dry: [
      "I'm dressed as a feeling. You'll work out which one.",
      "Everything I own is ridiculous. That was the plan.",
      "I'd explain the outfit but the explanation's worse.",
      "There's a joke happening on my body and it's not finished yet.",
      "I look like a mistake someone committed to. Correct.",
      "I dress like this at home. That's the frightening part.",
      "This is a character. The character's also me. It's complicated.",
      "I committed to the bit before I knew what the bit was. No regrets.",
    ],
    warm: [
      "HELLO! You girls can already go home, the winner is here!",
      "I brought joy and also a small horn. Don't ask about the horn yet!",
      "Oh, look at all of you! We're gonna be SO annoying together!",
      "Hi! I make things out of foam and love and neither is structural!",
      "I've got three costume changes and no plan. Hello!",
      "Everybody say hello to the thing on my head. It's got a name and feelings.",
      "I brought glitter for the room. Not for me — for the ROOM. This is a glitter room now!",
      "We're gonna have SO much fun and it's not optional!",
    ],
  },
  'club-kid': {
    big: [
      "It's four in the morning somewhere and that somewhere is inside my head.",
      "I don't do pretty. I do memorable, and you'll be seeing this in your sleep.",
      "The club called — they said I'm not allowed back until I win something!",
      "I've removed my own face and replaced it with a better idea.",
      "Nobody here's gonna out-weird me. Several of you will try. I encourage it.",
      "This is what happens when nobody stops you. Nobody stopped me.",
      "Art's supposed to make you uncomfortable. You're very welcome.",
      "I spent a week on this face and I can't eat in it and I'm NOT sorry!",
    ],
    dry: [
      "This took nine hours. I'd like everyone to know that and then never mention it.",
      "I'm made of foam and spite. Mostly foam.",
      "Nobody at home understands what I do either. Let's get on with it.",
      "I can't sit down in this. I've made peace with standing all day.",
      "Yeah, it lights up. No, I didn't test it near water.",
      "I've been described as a warning sign, and I took it well.",
      "I wore this on the bus. The bus handled it fine.",
      "This is fashion-forward. Or possibly fashion-sideways. You haven't seen it either way.",
    ],
    warm: [
      "Hi! Sorry if I bump into you, I genuinely can't see out of this!",
      "Oh my god, the LIGHTS in here! Hello. I'm obsessed. Hello!",
      "I'm gonna touch everybody's outfit with permission, one at a time.",
      "Hello! I look terrifying and I'm extremely delicate, please be gentle!",
      "Hi! Someone help me through the door, I've got a wingspan situation!",
      "I made this at 3am and I still like it, which never happens. Hi!",
      "I look completely insane and I give the best hugs. Both true.",
      "Everything on my body was made with love and hot glue and you can't tell which held what!",
    ],
  },
  spooky: {
    big: [
      "Something died to make this look and it isn't finished dying!",
      "I've come from somewhere much darker and the flight was fine, thank you.",
      "You smell that? That's fear. Or the glue. Mostly the glue.",
      "I was buried in this. Someone dug me up for the competition!",
      "The lights in here are too kind to me. Fix that.",
      "I'm the reason your parents checked the closet. Hello!",
      "I'm the nightmare you dressed up as when you were small, but upgraded.",
      "This face was built to haunt and it's doing exactly what it was built for.",
    ],
    dry: [
      "Yeah, there's blood. It's not mine. It's syrup, calm down.",
      "I'm the scary one. I'm also extremely polite, which people find worse.",
      "I was gonna do something gentle and then I remembered who I am.",
      "I've got one aesthetic and it's bad news. It works.",
      "Everything I make is upsetting and beautifully finished.",
      "I do horror. It's a service industry.",
      "I scared three people in the car park. Accidentally. Good start.",
      "Everything's fine. Everything's completely normal. Don't look behind me.",
    ],
    warm: [
      "Hi! I know I look like a warning but I'm actually very easy to get on with!",
      "Hello, gorgeous people! Ignore the teeth, they come off.",
      "I make horrible things and I'm delighted to be here making them near you!",
      "Hi! Anyone need fake blood? I've brought an unreasonable amount!",
      "Hello! I'm the friendliest ghoul you'll meet this year, genuinely!",
      "Oh, everyone is so PRETTY. I'm gonna ruin that and we'll all have fun!",
      "I'm very sweet and I'm covered in blood and there's no contradiction.",
      "The horror's just the gift wrap. Inside's a perfectly nice person!",
    ],
  },
  broadway: {
    big: [
      "I've been preparing for this since a school production nobody asked about!",
      "Someone give me a key change. I'll do the rest.",
      "I'm a triple threat and one of the three is being extremely loud!",
      "The lip sync? That's a formality, and I'd like that noted NOW.",
      "I sing live. I'm gonna keep saying that until it becomes a problem.",
      "I've got the range, the belt and the stamina. Two of those are threats.",
      "I've got a belt that'll clear this room and I haven't even warmed up!",
      "Someone cue the orchestra. Any orchestra. I'll take the air conditioning.",
    ],
    dry: [
      "I'll be doing my own vocals, which will become relevant later.",
      "I know every word to everything. It's a burden and a talent.",
      "I've been on tour. This dressing room's nicer, which is worrying.",
      "I've got a warm-up routine and I'll be doing it where you can hear me.",
      "I peaked as an understudy and I've been furious ever since.",
      "Musical theatre ruined my personality and built my career.",
      "I sight-read, I harmonise, and I don't do small talk.",
      "My vocal range is wider than my emotional range and both are professional.",
    ],
    warm: [
      "Hello! Anyone wanna warm up with me? Anyone? I'll go alone!",
      "Oh, I'm gonna cry, and then I'm gonna belt, and then I'll cry again!",
      "Hi! I'm the one who'll organise a group number nobody asked for!",
      "Hello! I've already worked out our harmonies. All of ours. You're welcome!",
      "Hi! I'll be singing constantly and I apologise in advance and not really!",
      "Oh this is a STAGE. Sorry. Hello. It is a stage though!",
      "I'll sing happy birthday to every queen in here and I'll mean it every time!",
      "Anyone wanna duet? I'm available right now and I know every key!",
    ],
  },
  dancer: {
    big: [
      "Save your knees, ladies. Mine are already gone and I'm STILL gonna win!",
      "I don't need a good song. I need a floor and about six seconds.",
      "Every one of you should be worried about the lip sync. That's all I'll say.",
      "I've never lost a lip sync and I'm not starting on television!",
      "You can teach a look. You can't teach THIS.",
      "Someone put a song on. Any song. I'm not joking.",
      "These legs have won me everything I've got and they're nowhere near done!",
      "I could do this in flats. I'm doing it in heels. That's the difference.",
    ],
    dry: [
      "I'll be stretching in the corner. Not for a bit — the whole time.",
      "I move well and talk badly. You'll see both today.",
      "I'm here for the part where someone's gotta actually perform.",
      "I've got two speeds and neither of them is conversation.",
      "My knees have a countdown on them. Let's use the time.",
      "I do one thing really well and I've built a whole life on it.",
      "I stretch before I socialise. Those are my priorities and that's their order.",
      "If this goes wrong I'll dance my way out and it'll look completely intentional.",
    ],
    warm: [
      "Hi! Anyone want choreography help? Genuinely, come find me!",
      "Hello! I'm so ready. I've BEEN so ready. I couldn't sleep!",
      "Oh, hi — sorry, I'm bouncing. I bounce when I'm happy!",
      "Hi! I'll teach anybody anything! I love a group number. No shame!",
      "Hello! Please stretch. I mean it. I'll be so annoying about this!",
      "I'm gonna be jumping around all season, don't let it worry you!",
      "My favourite thing is teaching someone a move they didn't think they could do!",
      "I've already counted the beats in the entrance music. I've got a whole routine!",
    ],
  },
  glamour: {
    big: [
      "Beauty is a job and I'm extremely employed!",
      "I'm the prettiest thing in this room and that was true in the parking lot!",
      "Y'all better get used to being photographed next to THIS.",
      "I don't have a bad angle. I've looked. Thoroughly.",
      "Someone dim these lights before I embarrass everybody!",
      "I'm here to be gorgeous professionally, which is harder than it looks.",
      "I don't have a bad angle and I've checked every mirror in this building.",
      "She's beautiful, she's here, and she's me!",
    ],
    dry: [
      "This face took two hours. Please act accordingly.",
      "I do one thing and I do it perfectly. That's a strategy.",
      "I'll be gorgeous and quiet until it becomes a problem for someone.",
      "Yeah, it's all mine. No, none of it's real. Both things are true.",
      "I've been called one-note. It's a very good note.",
      "I contour for a living and I'll be doing it in this room at volume.",
      "This isn't my best face. My best face takes three hours and I was given two.",
      "Pretty's a full-time job and I've never missed a shift.",
    ],
    warm: [
      "Hello! Everyone looks incredible and I mean that and I hate it!",
      "Hi! I'm gonna compliment all of you and I'll mean about eighty per cent of it!",
      "Oh, this is real. This is really real! Hi! Hello!",
      "Hello! Anyone want their face done? I brought way too much of everything!",
      "Hi! I'm so nervous I applied lashes twice. These are the second ones!",
      "Everybody is stunning and I'm gonna be insufferable about all of you!",
      "Everybody's gorgeous and I need foundation shades from this entire room!",
      "I came to compete and also to swap beauty tips. Honestly the tips matter more!",
    ],
  },
  art: {
    big: [
      "You won't understand this immediately and that's entirely correct.",
      "Drag is a question. I'm not here to answer it, I'm here to ask it LOUDER!",
      "I've made something nobody asked for and it's the best thing here!",
      "I've never been the prettiest but I've ALWAYS been the one you remember.",
      "This isn't for the front row. It's for whoever's still thinking about it tomorrow.",
      "I don't do looks. I do arguments you can wear.",
      "If you get this on the first look then I haven't done my job.",
      "I'm a statement. The statement's complicated and you're gonna need a minute.",
    ],
    dry: [
      "It's a concept. There's a whole document. I won't be sharing the document.",
      "I'd tell you what it means but then it'd mean that.",
      "I'm the weird one. Someone's gotta be, and I volunteered years ago.",
      "Half of this is deliberate. I won't be saying which half.",
      "I've been told this isn't drag. By people, out loud, to my face.",
      "It's about my childhood. Everything's about my childhood.",
      "I brought the concept. You bring the understanding. We'll meet in the middle eventually.",
      "Yeah, it's a look. No, I won't explain it. Not yet.",
    ],
    warm: [
      "Hi! I've brought a lot of ideas and about half of them are good!",
      "Hello! Please ask me what this is! Nobody ever asks and I get sad!",
      "Oh I like all of you already. This is gonna be a lovely disaster!",
      "Hi! I wanna know what everybody's scared of. Immediately. Sorry!",
      "Hello! I make strange things and I'm extremely normal, I promise!",
      "I've got a mood board. Eleven pages. Anyone wanna see it?",
      "I made this because I had a feeling and the feeling needed a shape.",
      "If anybody wants to talk about what drag means, I'm AVAILABLE and I brought notes!",
    ],
  },
};

/**
 * What the room does with it.
 *
 * Keyed by how the line LANDED — her delivery against the room's appetite —
 * rather than by whether it was "good", which nothing can measure. `{b}` is
 * whoever was already standing there when she came through.
 */
export const ENTRANCE_REACTIONS = {
  roars: [
    "The room goes UP. {b} screams first and loudest and {a} clocks it immediately.",
    "{b}'s on her feet before {a} even finishes. That's the whole welcome right there.",
    "Every queen makes the same noise at the same time. {a} doesn't stop walking.",
    '{b} goes "oh, we have a PROBLEM" and means it as the highest compliment.',
    "Someone drops something. Nobody picks it up. {b}'s already halfway across the room.",
    "It lands so hard {b} has to say it back twice before anyone can hear her.",
    "The noise this room makes is the one it'll spend the rest of the season trying to top.",
    "{b} points at {a}, points at the door, points at {a} again — she's lost the ability to speak.",
  ],
  warm: [
    "{b} laughs properly — not the polite one — and comes over to look at the garment.",
    "A real welcome. {b} gets there first and the hug lasts a beat longer than it should for a stranger.",
    "The room warms by a degree. {b} says the name back, testing it, decides she likes it.",
    "{b} nods slowly, the way you do when you've decided to keep an eye on someone kindly.",
    "Two or three of them laugh at once, which is more than most queens get. {b} makes room at the mirror.",
    '{b} goes "okay, she came to PLAY" to nobody in particular, and the room agrees.',
    "It goes down well. {a} gets a proper look-over from {b} and passes it.",
    "{b} grins and says the line back at her, badly, which is how you know it worked.",
  ],
  polite: [
    "A few laughs, one generous. {b}'s already looking at the shoes instead of the face.",
    "The room says hello and goes back to what it was doing. {a} notices exactly how long that took.",
    "{b} smiles with her mouth. {a}'s been doing this long enough to know the difference.",
    'Someone says "cute" from behind a mirror, all shady, and doesn\'t come out to say it properly.',
    "It lands about halfway. {b} gives her the nod you give a stranger in a lift.",
    "One laugh, slightly late. {a} takes it, because one isn't none.",
    "{b} says hello warmly and immediately turns back to her bag.",
    "A hum of hellos. Nobody moves toward her and she puts her case down herself.",
  ],
  cool: [
    "Nothing. Two seconds of nothing, which in this room is a paragraph.",
    "{b} looks up, looks back down, keeps unpacking. {a} keeps the smile on anyway.",
    "The line lands in a room that was mid-conversation and stays there, unclaimed.",
    'A single "hi" from somewhere near the back. {a} decides not to hear the tone of it.',
    "It goes quiet the way that means everybody heard it and nobody's helping.",
    '{b} says "hi" without turning round. {a} walks the rest of the way on her own.',
    "The room is several queens deep and has already made that noise for every one of them. It doesn't make it again.",
    "Someone laughs, realises they're the only one, and stops. {a} pretends not to hear that either.",
  ],
};

/* ══════════════════════════════════════════════════════════════════
   THE REST OF THE ARRIVAL
   ══════════════════════════════════════════════════════════════════

   A premiere arrival is not a one-liner. Each queen walks in, the room
   answers, and then she TELLS THEM WHO SHE IS: what she does, how long
   she has been doing drag, where she is from, and the thing about her
   that is not on the CV. Then, when the room is full, the host arrives
   and the season starts.

   So an arrival is FIVE beats per queen plus one for the host:

     arrival:walk        her entrance line + the room's reaction
     arrival:impression  somebody already here decides something about her
     arrival:intro       name, city, what she does, years in drag
     arrival:backstory   the thing that is not on the CV
     arrival:host        RuPaul comes through the door

   ── PLACEHOLDERS EVERY POOL BELOW MAY USE ──
     {a}      the arriving queen's name
     {b}      a queen already in the room
     {city}   where she is from
     {job}    what she does out of drag
     {years}  how long she has been doing drag, as a numeral
     {style}  her drag style, in words ("a pageant queen")
*/

/**
 * "I'm {a}, I'm from {city}, I've been doing drag {years} years."
 *
 * Keyed by attitude, same three buckets as the entrance line, because the
 * queen who arrives dry introduces herself dry.
 */
export const ARRIVAL_INTROS = {
  big: [
    "I'm {a}, {city}, {years} years in drag, and I did NOT come here to be safe!",
    "{a}! {city}! {years} years of this! And every single one of them's been leading to this room!",
    "The name's {a}, I've been doing drag for {years} years, and I'm very, very good at it.",
    "{a}, {city}. {years} years. I work as {job} out of drag and in drag I work harder.",
    "My name's {a} and I've spent {years} years becoming the queen you're looking at right now.",
    "I'm {a}, I've been doing this {years} years, and if you haven't heard of me that's about to change.",
    "{a}. {years} years in drag. I came here to win and I dressed accordingly.",
    "I'm {a} and I've got {years} years of drag behind me and none of them were quiet!",
  ],
  dry: [
    "I'm {a}, I'm from {city}, I've been doing this {years} years, and I still have a day job I'm not gonna tell you about.",
    "{a}. {city}. {years} years. That's the whole introduction.",
    "My name's {a}, I've been doing drag for {years} years, and I'm tired but I look incredible.",
    "{a}, {years} years in. I work as {job} during the week and do this at the weekend and neither pays enough.",
    "I'm {a}. {city}. {years} years of this. I'm not gonna say anything inspirational.",
    "{a}. {years} years in drag. I work as {job} when nobody's watching.",
    "My name's {a} and I've been doing drag for {years} years and I've got very little else to say about that.",
    "I'm {a}, {years} years in drag. That's the short version and the long version's the same.",
  ],
  warm: [
    "Hi! I'm {a}, I'm from {city}, I've been doing drag {years} years, and I'm so happy to be in this room!",
    "Hello! I'm {a}! {city}! {years} years of drag and every one of them was worth it to get here!",
    "I'm {a}, I've been doing drag for {years} years, and I genuinely can't believe I'm standing here right now.",
    "My name's {a}, {city}, {years} years in drag, and I just want everybody to know I love what I do!",
    "I'm {a}! I work as {job} out of drag and I've been doing this for {years} years and I'm thrilled!",
    "{a}, {city}, {years} years in. I'm nervous and excited and I think those are the same thing right now.",
    "Hi, I'm {a}, {years} years of drag, and I'm gonna try very hard not to cry during this introduction.",
    "I'm {a} and I've been doing this {years} years and I still get butterflies every time I walk into a new room!",
  ],
};

/**
 * The thing that is not on the CV.
 *
 * Keyed by drag style, because what a pageant queen volunteers about
 * herself and what an art queen volunteers are different confessions.
 */
export const ARRIVAL_BACKSTORY = {
  pageant: [
    "I started in pageants because somebody told me I had stage presence and I believed them. I have been trying to prove them right ever since.",
    "My first pageant I came fourth out of four and I drove home with the sash I bought myself. I have not come fourth since.",
    "People think pageant queens have it together. I do not have it together. I have a system, and the system works, and behind the system it is chaos.",
    "I paid for drag school with tips from a diner I worked at six nights a week. The diner is gone. The drag is not.",
    "My mother made my first gown out of curtain lining because we could not afford fabric. I still have the gown. It is terrible. I love it.",
    "Every title I have won was won in a borrowed pair of shoes. I still cannot afford the shoes. I can afford everything else.",
  ],
  comedy: [
    "I started doing drag because I was funny and nobody was paying me for it. Now they pay me for it and I am still not sure they should.",
    "I bombed my first gig so badly the bar owner turned the lights on. I went back the next week. And the week after that. And now the bar is closed and I am here.",
    "People say comedy queens cannot do glamour. I cannot do glamour. That is not the point. The point is I am funnier than your glamour.",
    "I was the class clown and then I was the office clown and then I was the bar clown and at some point the clown became the career.",
    "My day job is {job} and the only thing that gets me through it is knowing I have a gig at the weekend where nobody calls me sir.",
    "I have never been the prettiest queen in the room and I decided very early that being the funniest was a better thing to be anyway.",
  ],
  fashion: [
    "I have been sewing since I was a child. My grandmother taught me on her machine and I still use her scissors. They are the only thing of hers I have.",
    "I do not buy drag. I build drag. Every garment I own was made by me in a room that is too small for the fabric and too cold for the glue.",
    "Fashion saved me. I know that sounds like a line but the truth is I did not know who I was until I started making things and the things told me.",
    "I design everything I wear and I have never worn anything twice. That is not a brag, it is an illness.",
    "People look at the garment. I want them to look at the construction. The construction is where the work is and the work is the whole point.",
    "My first collection was six looks made out of bin bags and I showed it in a car park to three people and one of them was my flatmate. I think about that night all the time.",
  ],
  camp: [
    "I fell into drag because nothing else I was doing was silly enough. I needed somewhere to put the silly and drag was the only place that wanted it.",
    "I once glued four hundred plastic flowers to a bodysuit and wore it to the corner shop. Nobody said a word. I have been chasing that silence ever since.",
    "My drag is not pretty and it is not meant to be. It is meant to make you laugh and then think about why you laughed and then feel slightly uncomfortable about the answer.",
    "People ask if I am always like this and the answer is yes, I am always like this, and no, I do not know how to stop, and honestly I do not want to.",
    "My whole thing is excess. More is more. If it is not too much it is not enough, and I have never once known where that line is.",
    "I started making costumes out of things that were not costumes because I could not afford things that were. The habit stuck. The aesthetic followed.",
  ],
  'club-kid': [
    "I started going to clubs when I was far too young and the clubs taught me that the best version of me was the one nobody recognised.",
    "I do not do pretty. I do not do ugly. I do the thing where you cannot tell which one it is and that confusion is the whole show.",
    "It takes me nine hours to get ready and about four minutes for somebody to decide I am not for them. Both of those numbers are correct.",
    "My parents do not understand what I do. I have shown them photographs. The photographs did not help. I love them and they are baffled by me.",
    "I build things out of foam and wire and paint and I wear them in public and sometimes people cross the street. That is feedback.",
    "The first time I went out in a look I had actually built from scratch, somebody asked if I was a public art installation. I said yes.",
  ],
  spooky: [
    "I have always been drawn to the dark. Not the edgy dark, the beautiful dark — the dark where everything is more interesting because you cannot see all of it.",
    "I do horror and people think that means I am scary. I am not scary. I am a very gentle person who happens to find beauty in things that make other people look away.",
    "My first drag look was a ghost and my mother cried. Not because it was good. Because she did not understand why I wanted to be frightening and beautiful at the same time.",
    "I am a spooky queen because the first queen I ever saw was a spooky queen and she looked like something I had never seen before and I wanted to look like that.",
    "People ask why I always do horror. The answer is that horror lets you be ugly on purpose and the on-purpose is the art.",
    "I make everything by hand. The blood, the prosthetics, the contacts. If it is not handmade it is not mine and if it is not mine it does not go on my face.",
  ],
  broadway: [
    "I have been singing since before I could talk. That is not a metaphor. My mother has recordings. They are terrible. The instinct was there.",
    "I wanted to be on a stage from the moment I saw a stage. Drag was the stage that said yes first and I have been saying yes back ever since.",
    "I trained in musical theatre and the training taught me that the voice is the one thing you cannot fake. Everything else is costumes. The voice is real.",
    "I have been an understudy three times and performed once and the once was the best night of my life. I am here because I want more of those nights.",
    "My whole drag is built around the voice. If I can sing it, I can sell it. If I cannot sing it, I learn it. There is nothing in my repertoire I cannot perform live.",
    "I come from a theatre family. My mother was chorus. My aunt was chorus. I am not going to be chorus.",
  ],
  dancer: [
    "I have been dancing since I was four and I have had two knee surgeries and I still cannot stop. The knees are a problem. The dancing is not negotiable.",
    "People underestimate dancers. They think we are just the body and not the brain. The brain decides every count and the body does what it is told. It is the hardest thinking I do.",
    "I started dancing in heels because a queen told me it was impossible and I wanted to prove her wrong. I proved her wrong. I kept the heels.",
    "My body is my instrument and the instrument has some wear on it but the wear is honest and the honest is the performance.",
    "I work as {job} and I dance at night and the dancing is the part that makes the rest of it bearable.",
    "Every queen I have ever lost to was a better lip syncer than a dancer. I am here to prove that the dancing is the lip sync.",
  ],
  glamour: [
    "I have been beautiful on purpose since I was fifteen and I do not apologise for it. Beauty is a skill. I practised.",
    "People think glamour is lazy. It is the opposite of lazy. This face takes two hours and the two hours are the most focused two hours of my day.",
    "I come from a town where nobody does drag and I am the prettiest thing it has ever produced and the town does not know what to do with that.",
    "My first mug was terrible. I looked like a haunted painting. But the instinct — the instinct to transform, to become — that was there from the start and the skill caught up.",
    "I am a glamour queen and I know what people think that means and I am going to change what they think by the time I leave.",
    "I do not have a secret talent. I do not have a hidden skill. What you see is what I spent two hours building and the building is the talent.",
  ],
  art: [
    "I make things that do not make sense on purpose. The not-making-sense is the point. If it made sense it would be an outfit.",
    "I was the weird kid and then I was the weird teenager and then I found drag and the weird became the whole aesthetic and I stopped trying to explain it.",
    "My drag is not for everybody. I know that. The first time somebody told me my look was ugly I said thank you and I meant it and they did not know what to do.",
    "I have a concept for every look and the concept has a concept and behind that concept there is usually something I am actually trying to say about being alive.",
    "I do not come from a drag scene. I come from an art scene and the art scene said you are too much and the drag scene said you are not enough and I decided both of them were wrong.",
    "People ask me what my drag is about and I cannot answer that question in a sentence. I can answer it in a look. That is why I do looks instead of sentences.",
  ],
};

/**
 * The host's arrival, once the room is full.
 *
 * Keyed by how the room is feeling when she walks in — a room that has
 * been screaming for twenty minutes and a room that has gone quiet get
 * different first words.
 */
export const ARRIVAL_HOST = {
  loud: [
    "Hello, hello, HELLO! Now I know you have been making a LOT of noise in here and I have heard every bit of it. Welcome to the competition. This is where it starts.",
    "I could hear this room from the hallway and I have to say — that is exactly the energy I wanted to walk into. {b}, I see you. I see all of you. Let's go.",
    "Well! Somebody has been having a good time in here. I love that for you. I love it less for your neighbours. {b}, you started this, I heard you first.",
    "The VOLUME in this room tells me you are ready and the looks in this room tell me I was right to cast you. Hello. Hello to all of you. Hello to {b}, who was loud first.",
    "I walked in and the energy hit me before the light did. That is a good room. That is a room full of queens who came to do something. Hello, gorgeous people.",
  ],
  nervous: [
    "Hello, my beautiful queens. I know some of you are nervous. You should be. This is the real thing. But I would not have brought you here if I did not believe you belonged in this room.",
    "Good evening. I see some faces in here that are trying very hard to look calm and I want you to know — that is exactly how every queen who has won this thing looked on night one. {b}, breathe.",
    "Hello. I can feel the nerves in this room and I want to say something about that: nerves mean you care. The queens who do not care do not shake. You are shaking because this matters to you.",
    "Some of you are terrified. I can see it. I want you to know that is allowed and it is correct and the queen who wins this will tell you she was terrified too. Hello. Welcome. You are here now.",
    "Look at this room. Look at these faces. {b}, I see you. I see all of you. The nerves are normal. What you do with the nerves is the show.",
  ],
  ready: [
    "Good evening, queens. You look ready. You look like a room full of people who packed for a fight and I am here to tell you the fight starts now.",
    "Hello, gorgeous people. I see a room that is prepared and I see looks that are correct and I see queens who have done their homework. {b}, you set the tone. Now let's see what the rest of you do with it.",
    "This is the room. These are the queens. This is the moment where everything you have done in drag up until now becomes the reason you are standing here. Hello. Let's begin.",
    "I look at this room and I see queens who are ready to work. That is what I want. That is what this competition asks for. {b} was the first through the door and the rest of you followed and now the door is closed.",
    "Hello. You are here because you earned it. Every one of you. The looks, the talent, the nerve — I can see it in this room already. Now show me what you do with it.",
  ],
};

/**
 * The first impression — the moment somebody already in the room decides
 * something about the queen who just walked in.
 *
 * `{b}` is the one doing the deciding and `{a}` is the new arrival, which is
 * the reverse of every other pool here: this is HER read of the room, not the
 * room's read of her. Keyed by which way it went. The bond it moves is
 * already real whether or not this pool has a line — see js/dr/arrivals.js —
 * so a line here is the SENTENCE for a thing that already happened.
 */
export const ARRIVAL_IMPRESSIONS = {
  nice: [
    "{b} watches {a} come through the door and says to nobody in particular: she is going to be good. You can just tell.",
    "{b} clocks the garment before the face and the garment is enough. She turns to the queen next to her and says: I want to know who made that.",
    "{a} walks in and {b} is already smiling, the real smile, the one that means she has decided this is somebody she wants to know.",
    "{b} sees {a} and something in her posture changes — she stands a little straighter, the way you do when somebody walks into the room who makes you want to be better.",
    "{a} arrives and {b} says: okay, she came correct. That is said with respect. The respect is genuine.",
    "{b} nods at {a} from across the room, the slow nod, the one that means I see you and I like what I see and I am going to remember you.",
    "{a} walks in and {b} whispers to the queen next to her: that is a real one. You can see it in the walk.",
    "{b} watches {a} settle in and decides she is somebody worth talking to. The decision is quiet but it is made and it is not going to change.",
    "{a} comes through the door and {b} says: we needed her. I did not know that until she walked in and now I know it.",
    "{b} sees {a} and the first thing she thinks is: I want to be in a room with her for a long time. That thought is the beginning of something.",
  ],
  shady: [
    "{b} watches {a} walk in and the look she gives the queen beside her says everything her mouth is too polite to say.",
    "{a} comes through the door and {b} takes one look at the garment and one look at the wig and turns back to her mirror. The turning-back is the read.",
    "{b} clocks {a} and says, very quietly, to nobody who will repeat it: well. That is going to be interesting. She does not mean interesting kindly.",
    "{a} walks in and {b} smiles the smile that is not a smile. It is an assessment. The assessment is not going well.",
    "{b} watches {a} arrive and something about the entrance bothers her and she is not going to say what it is yet. She is going to save it.",
    "{a} comes through the door and {b} says to the room: oh, so they cast one of THOSE. The room knows what she means. Nobody asks.",
    "{b} takes one look at {a} and decides she has seen better. The decision is in the eyes and the eyes are not hiding it.",
    "{a} arrives and {b} looks her up and down — the full scan, shoulder to shoe — and the verdict is a single raised eyebrow that says more than a sentence.",
    "{b} watches {a} walk in and says to the queen next to her: she is going to think she is competition. That sentence has a shape to it and the shape is not a compliment.",
    "{a} comes through the door and {b} gives the look — the specific look that means I have already decided where you are going to place and it is below me.",
  ],
};

/**
 * Her attitude, PROPORTIONALLY.
 *
 * A weighted roll on boldness, social and temperament — never a threshold,
 * so a bold queen usually arrives big and sometimes arrives dry, and nothing
 * about a stat line locks a bucket. Returns 'big' | 'dry' | 'warm'.
 */
export function entranceAttitude(stats = {}, rng = Math.random) {
  const n = k => Math.max(1, Math.min(10, Number(stats[k]) || 5));
  const weights = {
    big: n('boldness') * 1.2 + n('social') * 0.4,
    dry: (11 - n('social')) * 0.7 + (11 - n('temperament')) * 0.8 + n('strategic') * 0.5,
    warm: n('social') * 1.1 + n('temperament') * 0.6 + (11 - n('boldness')) * 0.4,
  };
  const total = weights.big + weights.dry + weights.warm;
  let roll = rng() * total;
  for (const [k, w] of Object.entries(weights)) {
    roll -= w;
    if (roll <= 0) return k;
  }
  return 'warm';
}

/**
 * How hard the line landed, PROPORTIONALLY.
 *
 * Her delivery (boldness, social, and the star power the show has already
 * decided it wants) against a room that gets harder to impress as it fills
 * up: the twelfth queen through the door walks into a room that has already
 * made that noise eleven times.
 */
export function entranceLanding(stats = {}, { star = 5, position = 0, castSize = 12 } = {}, rng = Math.random) {
  const n = k => Math.max(1, Math.min(10, Number(stats[k]) || 5));
  const fatigue = castSize > 1 ? (position / (castSize - 1)) * 2.4 : 0;
  const score = n('boldness') * 0.34 + n('social') * 0.3 + Number(star || 5) * 0.36
    - fatigue + (rng() - 0.5) * 3.2;
  if (score >= 7.4) return 'roars';
  if (score >= 5.6) return 'warm';
  if (score >= 4.0) return 'polite';
  return 'cool';
}
