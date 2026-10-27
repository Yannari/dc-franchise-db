// ══════════════════════════════════════════════════════════════════════
// bb/script/lines/styleact.js — a way of playing, seen in what somebody does
// ══════════════════════════════════════════════════════════════════════
//
// The moves of bb-events/game-style.js. The user, 2026-10-27: "don't announce every
// strategy, rather show it with their actions". So these are mostly the action: the
// laps, the flashcards, the seat next to the strongest player, the visit to the key.
// When somebody speaks to the Diary Room it is about what they just did, never a
// statement of their game plan.
//
//   style.comp.<train|study>        a gets ready for the next competition; b is around
//   style.coattail.<winner|scene>   a sticks to b, the strongest player; c notices
//   style.float.scene               a is with b, the HOH; c notices
//   style.social.scene              a makes time for b and c, the two a knows least
//   style.lowkey.scene              b asks a in on a plan against c; a stays out
//   style.rise.scene                a, quiet all season, brings b in on going after c
//   style.alliance.<target|scene>   a checks with b, from {alliance}, where the vote is going (c: the target)
//   style.read.scene                a tells b that c and d are working together (they are)
// Ids 'sty.'.

export default {
  'style.comp.train': [
    { id: 'sty.ct1', turns: [{ beat: '{a} is doing sprints up and down the yard in the heat. {b} watches from a sun lounger.' }, { by: 'b', say: "You know there's no comp today." }, { by: 'a', say: "There's one on Thursday." }] },
    { id: 'sty.ct2', turns: [{ beat: '{a} is hanging from the bar of the swing set, counting seconds out loud.' }, { by: 'b', say: "How long are you going to do that?" }, { by: 'a', say: "Until I can't." }, { by: 'a', dr: "The last endurance comp went three hours. I want to be the one still hanging at hour four." }] },
    { id: 'sty.ct3', turns: [{ beat: 'Early morning. {a} is already out doing push-ups while the rest of the house sleeps.' }, { by: 'b', say: "It's seven in the morning." }, { by: 'a', say: "Then I'm late." }] },
    { id: 'sty.ct4', turns: [{ beat: '{a} is balancing on the edge of the pool with eyes shut, arms out.' }, { by: 'b', say: "What is this one for?" }, { by: 'a', say: "Every comp in this house is balance at some point." }, { by: 'b', dr: "{a} trains for competitions nobody has announced yet. That's either brilliant or the reason {a} goes up next." }] },
    { id: 'sty.ct5', turns: [{ beat: '{a} is carrying two full water jugs back and forth across the yard.' }, { by: 'b', say: "Do you want help?" }, { by: 'a', say: "No. That's the point." }, { by: 'a', dr: "If I win, I'm safe. If I'm safe, nobody gets to decide anything about me. That's the whole plan for this week." }] },
    { id: 'sty.ct6', turns: [{ beat: '{a} is running laps of the yard again. {b} has stopped asking why.' }, { by: 'b', say: "Lap twenty?" }, { by: 'a', say: "Thirty-one." }, { by: 'b', dr: "Every time {a} runs past, half the house remembers who to be scared of." }] },
  ],
  'style.comp.study': [
    { id: 'sty.cs1', turns: [{ beat: '{a} is sitting on the floor with a notepad, writing down the order of every comp so far.' }, { by: 'b', say: "What is that?" }, { by: 'a', say: "Every competition we've had, in order. They repeat." }] },
    { id: 'sty.cs2', turns: [{ beat: '{a} is quizzing {b} on who won every competition so far, in order.' }, { by: 'b', say: "Why do you know this?" }, { by: 'a', say: "Because somebody's going to ask on a quiz." }, { by: 'b', dr: "{a} knows what I wore on day three. I don't know what I wore yesterday." }] },
    { id: 'sty.cs3', turns: [{ beat: "{a} is walking slowly past the memory wall, mouthing everybody's names in order." }, { by: 'b', say: "Are you okay?" }, { by: 'a', say: "Shh. I'm on week three." }] },
    { id: 'sty.cs4', turns: [{ beat: '{a} has made flashcards out of a cereal box and is going through them alone.' }, { by: 'b', say: "You made flashcards." }, { by: 'a', say: "I lost the last quiz by one answer. Not again." }, { by: 'a', dr: "I don't have the numbers in here. I have my memory. So I'm using it." }] },
    { id: 'sty.cs5', turns: [{ beat: '{a} is asking {b} questions about the last competition, very specific ones.' }, { by: 'a', say: "What colour was the third puzzle piece?" }, { by: 'b', say: "I have no idea." }, { by: 'a', say: "Blue. It was blue." }, { by: 'b', dr: "{a} remembers everything. In here, that's the scariest thing anybody can do." }] },
    { id: 'sty.cs6', turns: [{ beat: '{a} is lying on the floor with eyes closed, reciting the order of the HOHs so far.' }, { by: 'b', say: "You know we can see you doing that." }, { by: 'a', say: "Good. Let them worry." }] },
  ],
  'style.coattail.winner': [
    { id: 'sty.tw1', when: { third: true }, turns: [{ beat: '{a} pulls up a stool next to {b} at dinner, the way {a} has every night this week.' }, { by: 'b', say: "You're always on my side of the table." }, { by: 'a', say: "It's the winning side." }, { by: 'c', dr: "Wherever {b} goes, {a} goes. If you want {a} gone, you have to get through {b}." }] },
    { id: 'sty.tw2', turns: [{ beat: '{a} is cheering {b} on in the yard, louder than anybody.' }, { by: 'b', say: "You're my biggest fan." }, { by: 'a', say: "I'm your only fan. Everybody else wants you out." }, { by: 'a', dr: "As long as {b} keeps winning, nobody has the power to touch me. I'll cheer as loud as I need to." }] },
    { id: 'sty.tw3', when: { third: true }, turns: [{ by: 'a', say: "Whatever you need this week. My vote's yours." }, { by: 'b', say: "You didn't even ask what I need." }, { by: 'a', say: "I don't need to." }, { by: 'c', dr: "{a} hasn't won a thing. {a} just stands next to {b}, and somehow that's enough." }] },
    { id: 'sty.tw4', turns: [{ beat: '{a} brings {b} a drink after the competition without being asked.' }, { by: 'b', say: "What's this for?" }, { by: 'a', say: "For winning. Again." }, { by: 'a', dr: "{b} wins the comps. I keep {b} company. It's a good arrangement for both of us." }] },
    { id: 'sty.tw5', turns: [{ by: 'b', say: "People are saying you just follow me around." }, { by: 'a', say: "People say a lot." }, { by: 'b', say: "Do you?" }, { by: 'a', say: "I follow the person I trust most in here. That's you." }] },
    { id: 'sty.tw6', when: { third: true }, turns: [{ beat: '{a} and {b} are sitting together again, heads close, while the house goes past.' }, { by: 'c', dr: "Put {b} up and you've got {a} to deal with. Put {a} up and {b} will fight for {a}. Those two are one problem." }] },
  ],
  'style.coattail.scene': [
    { id: 'sty.ts7', turns: [{ by: 'b', say: "What do you think I should do this week?" }, { by: 'a', say: "Whatever you think. I trust your read more than mine." }, { by: 'b', say: "That's not really an answer." }, { by: 'a', say: "It's the only honest one I've got." }] },
    { id: 'sty.ts8', when: { third: true }, turns: [{ beat: '{a} is carrying {b}’s bag up the stairs after the competition.' }, { by: 'c', dr: "{a} would carry {b} up the stairs if {b} asked. Everybody knows whose side {a} is on." }] },
    { id: 'sty.ts1', turns: [{ beat: '{a} sits down next to {b} on the sofa, the way {a} does every evening.' }, { by: 'b', say: "Do you ever sit anywhere else?" }, { by: 'a', say: "Why would I?" }] },
    { id: 'sty.ts2', turns: [{ by: 'a', say: "Whatever you decide this week, I'm with you." }, { by: 'b', say: "You haven't heard what I'm deciding." }, { by: 'a', say: "I don't have to." }, { by: 'a', dr: "{b} is the strongest person in this house who actually likes me. So I stand next to {b}." }] },
    { id: 'sty.ts3', when: { early: false, third: true }, turns: [{ beat: '{a} laughs at something {b} says. A second later, so does the rest of the table.' }, { by: 'c', dr: "{a} goes where {b} goes. Every time." }] },
    { id: 'sty.ts4', turns: [{ by: 'b', say: "Who are you voting for?" }, { by: 'a', say: "Who are you voting for?" }, { by: 'b', say: "I asked you first." }, { by: 'a', say: "And I'm voting with you. So you tell me." }] },
    { id: 'sty.ts5', when: { early: false, third: true }, turns: [{ beat: '{a} saves {b} a seat at dinner before anybody else sits down.' }, { by: 'b', say: "Thanks." }, { by: 'a', say: "Always." }, { by: 'c', dr: "Everybody knows {a} is {b}'s. Nobody's bothered to ask {a} what {a} wants." }] },
    { id: 'sty.ts6', when: { early: false }, turns: [{ by: 'a', say: "If they come for you, they come for me." }, { by: 'b', say: "That's a lot of loyalty for somebody I met a few weeks ago." }, { by: 'a', say: "It's a few weeks in here. That's a long time." }] },
  ],
  'style.float.scene': [
    { id: 'sty.f7', turns: [{ beat: '{a} knocks on the HOH door with a plate of toast for {b}.' }, { by: 'b', say: "I didn't ask for toast." }, { by: 'a', say: "Nobody asks for toast. That's what makes it nice." }] },
    { id: 'sty.f8', turns: [{ by: 'a', say: "If you need a vote this week, it's yours." }, { by: 'b', say: "I haven't even said who I'm putting up." }, { by: 'a', say: "Doesn't matter. I'm with whoever's got the key." }, { by: 'a', dr: "{b} has the power this week, so {b} has my vote this week. It's not complicated." }] },
    { id: 'sty.f9', when: { third: true }, turns: [{ beat: '{a} is lying across the foot of {b}’s bed, chatting like they have been friends for years.' }, { by: 'c', dr: "Two weeks ago {a} barely spoke to {b}. Then {b} won HOH." }] },
    { id: 'sty.f1', when: { early: false, third: true }, turns: [{ beat: '{a} is on the end of {b}’s bed again, laughing at {b}’s stories.' }, { by: 'b', say: "You've been up here a lot this week." }, { by: 'a', say: "It's the nicest room in the house." }, { by: 'c', dr: "Last week {a} was always in the last HOH's room. This week it's {b}'s. {a} just moves with the key." }] },
    { id: 'sty.f2', turns: [{ by: 'a', say: "Congratulations again, by the way. You deserved it." }, { by: 'b', say: "That's the third time you've said that." }, { by: 'a', say: "Then I really mean it." }] },
    { id: 'sty.f3', turns: [{ beat: '{a} brings {b} breakfast in bed.' }, { by: 'b', say: "What did I do to deserve this?" }, { by: 'a', say: "Won." }, { by: 'a', dr: "Whoever holds the key this week is my best friend this week. Next week, we'll see." }] },
    { id: 'sty.f4', when: { early: false }, turns: [{ by: 'a', say: "I'm with you this week. Whatever you need." }, { by: 'b', say: "You said that to the last HOH." }, { by: 'a', say: "And I meant it then too." }, { by: 'b', dr: "{a} is honest about being on whatever side is winning. I don't know if that's comforting or not." }] },
    { id: 'sty.f5', when: { early: false, third: true }, turns: [{ beat: '{a} is helping {b} hang the HOH photos back up after they fell.' }, { by: 'c', dr: "{a} has helped every HOH unpack. Every single one." }] },
    { id: 'sty.f6', turns: [{ by: 'b', say: "Who should I be worried about?" }, { by: 'a', say: "Not me. Honestly, not me." }, { by: 'b', say: "Then who?" }, { by: 'a', say: "Whoever isn't up here asking you that." }, { by: 'a', dr: "I'm not a threat to anybody with power. That's why I'm still here." }] },
  ],
  'style.social.scene': [
    { id: 'sty.s7', turns: [{ beat: '{a} brings {b} a cup of tea without being asked, then sits down with {c} for a game of cards.' }, { by: 'b', say: "How did you know I wanted tea?" }, { by: 'a', say: "You always want tea at this time." }, { by: 'b', dr: "I didn't think {a} noticed me at all. {a} notices everyone." }] },
    { id: 'sty.s8', turns: [{ by: 'a', say: "I don't think we've ever had a proper conversation." }, { by: 'c', say: "We haven't." }, { by: 'a', say: "Then let's have one. Not about the game." }, { by: 'c', say: "What else is there in here?" }, { by: 'a', say: "Everything else." }] },
    { id: 'sty.s1', turns: [{ beat: '{a} sits down next to {b}, somebody {a} has barely spoken to all week.' }, { by: 'a', say: "I realised I don't know anything about you." }, { by: 'b', say: "What do you want to know?" }, { by: 'a', say: "Everything. We've got time." }] },
    { id: 'sty.s2', turns: [{ beat: '{a} spends the afternoon going from {b} to {c} and back, never talking game.' }, { by: 'b', say: "You haven't asked me about the vote once." }, { by: 'a', say: "I don't want to talk about the vote. I want to talk to you." }, { by: 'a', dr: "Nobody votes out somebody they actually like. So I'm making sure everybody actually likes me." }] },
    { id: 'sty.s3', turns: [{ beat: '{a} helps {c} with the washing up, then sits with {b} on the steps.' }, { by: 'c', say: "You didn't have to do that." }, { by: 'a', say: "I know. I wanted to." }] },
    { id: 'sty.s4', turns: [{ by: 'a', say: "How are you doing, really?" }, { by: 'b', say: "Nobody's asked me that in here." }, { by: 'a', say: "Then I'm asking." }, { by: 'b', dr: "I'm not close to {a}. Or I wasn't. I think I might be now." }] },
    { id: 'sty.s5', turns: [{ beat: '{a} is teaching {b} and {c} a card game, and losing to both of them on purpose.' }, { by: 'c', say: "You're letting us win." }, { by: 'a', say: "I would never." }] },
    { id: 'sty.s6', turns: [{ beat: '{a} asks {b} about home over breakfast, and actually listens to the answer.' }, { by: 'b', say: "Nobody asks about home in here." }, { by: 'a', say: "I'm asking." }, { by: 'b', dr: "{a} listened to all of it. Nobody else in this house has." }] },
  ],
  'style.lowkey.scene': [
    { id: 'sty.l1', turns: [{ by: 'b', say: "We're going after {c} this week. Are you in?" }, { by: 'a', say: "I'll vote how the house votes." }, { by: 'b', say: "That's not an answer." }, { by: 'a', say: "It's the only one I've got." }, { by: 'a', dr: "Let the big players knock each other out. I'll still be here when they're done." }] },
    { id: 'sty.l2', turns: [{ by: 'b', say: "I need your help with something." }, { by: 'a', say: "If it's about {c}, I don't want to know." }, { by: 'b', say: "It is about {c}." }, { by: 'a', say: "Then I really don't want to know." }] },
    { id: 'sty.l3', when: { early: false }, turns: [{ beat: '{b} is trying to pull {a} into a conversation about {c}. {a} keeps changing the subject to dinner.' }, { by: 'b', dr: "{a} will not take a side. I've tried three times this week." }] },
    { id: 'sty.l4', turns: [{ by: 'b', say: "You never say anything in these meetings." }, { by: 'a', say: "I listen." }, { by: 'b', say: "Listen to this, then: {c} has to go." }, { by: 'a', say: "Okay. I heard you." }, { by: 'a', dr: "My name isn't on anybody's plan. That's not luck. I've kept it that way." }] },
    { id: 'sty.l5', turns: [{ by: 'b', say: "Who do you want out?" }, { by: 'a', say: "Honestly? Nobody yet." }, { by: 'b', say: "You must want somebody out." }, { by: 'a', say: "When I do, you'll be the first to know." }] },
    { id: 'sty.l6', turns: [{ beat: '{b} lays out the whole plan against {c}. {a} nods, says nothing, and goes to make tea.' }, { by: 'a', dr: "If that plan works, I didn't do anything. If it fails, I didn't do anything. Either way, nobody's angry with me." }] },
  ],
  'style.rise.scene': [
    { id: 'sty.r1', turns: [{ by: 'a', say: "I need to say something, and I need you to just listen." }, { by: 'b', say: "Okay." }, { by: 'a', say: "{c} wins this if nobody does anything. So I'm doing something." }, { by: 'b', say: "You? You've never made a move." }, { by: 'a', say: "That's why it's going to work." }] },
    { id: 'sty.r2', turns: [{ by: 'a', say: "Everybody thinks I'm just happy to be here." }, { by: 'b', say: "Aren't you?" }, { by: 'a', say: "I'm happy to be in the final few. {c} is between me and the end." }, { by: 'a', dr: "I've sat quiet for weeks while everybody else did the damage. Now it's my turn." }] },
    { id: 'sty.r3', turns: [{ by: 'a', say: "If I win the next HOH, {c} goes up." }, { by: 'b', say: "That's the first time I've heard you name anybody." }, { by: 'a', say: "I've been saving it." }] },
    { id: 'sty.r4', turns: [{ beat: '{a} closes the door and sits down across from {b}.' }, { by: 'a', say: "I'm done flying under the radar. {c} has to go, and I want you with me." }, { by: 'b', say: "Since when do you want anybody gone?" }, { by: 'a', say: "Since there are this few of us left." }] },
    { id: 'sty.r5', turns: [{ by: 'a', say: "Who's beating {c} at the end?" }, { by: 'b', say: "Nobody, probably." }, { by: 'a', say: "Then {c} can't get to the end." }, { by: 'b', dr: "I didn't know {a} had this in {a.obj}. Nobody did. That's the scary part." }] },
    { id: 'sty.r6', turns: [{ by: 'a', say: "I've voted with the house every single week." }, { by: 'b', say: "I know." }, { by: 'a', say: "This week I'm not. This week we take out {c}." }] },
  ],
  'style.alliance.target': [
    { id: 'sty.a7', turns: [{ by: 'a', say: "Say the name for me." }, { by: 'b', say: "{c}." }, { by: 'a', say: "And tomorrow?" }, { by: 'b', say: "Still {c}. I'm not moving." }, { by: 'a', dr: "I don't take anything for granted in {alliance}. I hear every vote out loud before Thursday." }] },
    { id: 'sty.a8', turns: [{ by: 'a', say: "Somebody in this house is going to try to save {c} tonight." }, { by: 'b', say: "Not with my vote." }, { by: 'a', say: "Good. Make sure everyone else in {alliance} says that too." }] },
    { id: 'sty.a1', turns: [{ by: 'a', say: "Where's your vote this week?" }, { by: 'b', say: "{c}. Same as we said." }, { by: 'a', say: "Good. I'm asking everyone in {alliance}." }, { by: 'a', dr: "I check with every person in {alliance} before every vote. Nobody gets to surprise me." }] },
    { id: 'sty.a2', turns: [{ by: 'a', say: "Has anybody tried to talk you out of {c}?" }, { by: 'b', say: "Somebody tried." }, { by: 'a', say: "Who?" }, { by: 'b', say: "Doesn't matter. Didn't work." }] },
    { id: 'sty.a3', turns: [{ beat: '{a} is going person to person, quietly, the afternoon before the vote.' }, { by: 'a', say: "Still {c}?" }, { by: 'b', say: "Still {c}." }] },
    { id: 'sty.a4', turns: [{ by: 'a', say: "I want to hear you say it. Who are you voting out?" }, { by: 'b', say: "{c}. Relax." }, { by: 'a', say: "I'll relax on Friday." }, { by: 'b', dr: "{a} runs {alliance} like it's a job. Honestly, that's why it works." }] },
    { id: 'sty.a5', turns: [{ by: 'a', say: "If anybody in {alliance} is going soft on {c}, I need to know today." }, { by: 'b', say: "Nobody's going soft." }, { by: 'a', say: "Then we're fine." }] },
    { id: 'sty.a6', turns: [{ by: 'a', say: "Tell me where everyone in {alliance} is." }, { by: 'b', say: "Everyone's on {c}. I've talked to all of them." }, { by: 'a', say: "Talk to them again tomorrow." }] },
  ],
  'style.alliance.scene': [
    { id: 'sty.as1', turns: [{ by: 'a', say: "How are you feeling about {alliance}?" }, { by: 'b', say: "Good. Why?" }, { by: 'a', say: "Just checking. I check on everyone." }] },
    { id: 'sty.as2', turns: [{ by: 'a', say: "Have you been talking to anybody outside {alliance}?" }, { by: 'b', say: "Only about the dishes." }, { by: 'a', say: "Keep it to the dishes." }] },
    { id: 'sty.as3', turns: [{ beat: '{a} catches {b} in the hallway for a quick word about {alliance}.' }, { by: 'a', say: "We're solid?" }, { by: 'b', say: "We're solid." }] },
    { id: 'sty.as4', turns: [{ by: 'a', say: "If {alliance} has a problem, I want to hear about it from you, not from the house." }, { by: 'b', say: "There's no problem." }, { by: 'a', say: "Good. Keep it that way." }, { by: 'a', dr: "Nobody else in {alliance} is checking on everybody every day. That's why it's mine." }] },
    { id: 'sty.as5', turns: [{ by: 'a', say: "Anybody asked you to flip?" }, { by: 'b', say: "Not yet." }, { by: 'a', say: "When they do, you tell me first." }] },
    { id: 'sty.as6', turns: [{ by: 'a', say: "I've talked to everyone in {alliance} today except you." }, { by: 'b', say: "And?" }, { by: 'a', say: "And now I've talked to you." }] },
  ],
  'style.read.scene': [
    { id: 'sty.rd1', turns: [{ by: 'a', say: "Watch {c} and {d} at dinner tonight." }, { by: 'b', say: "Why?" }, { by: 'a', say: "They never sit together, and they always leave the room at the same time." }, { by: 'a', dr: "{c} and {d} are working together. They're hiding it well. Not well enough." }] },
    { id: 'sty.rd2', turns: [{ by: 'a', say: "{c} and {d} are together. In the game, I mean." }, { by: 'b', say: "They barely talk." }, { by: 'a', say: "In front of us." }] },
    { id: 'sty.rd3', turns: [{ beat: '{a} is watching {c} and {d} across the room, very still.' }, { by: 'b', say: "What?" }, { by: 'a', say: "{d} just looked at {c} before answering a question. Twice." }] },
    { id: 'sty.rd4', when: { early: false }, turns: [{ by: 'a', say: "Every time {c} says a name, {d} says the same name a day later." }, { by: 'b', say: "Coincidence." }, { by: 'a', say: "Every single time?" }, { by: 'b', dr: "{a} notices things the rest of us walk straight past. I'm glad {a} is on my side." }] },
    { id: 'sty.rd5', turns: [{ by: 'a', say: "Can I tell you something you can't repeat?" }, { by: 'b', say: "Go on." }, { by: 'a', say: "{c} and {d} have a deal. I'd bet my vote on it." }] },
    { id: 'sty.rd6', turns: [{ beat: '{a} clocks {c} and {d} coming out of the same room, two minutes apart.' }, { by: 'a', dr: "Two minutes apart, same room, both pretending they'd been somewhere else. {c} and {d} are a pair." }] },
  ],
};
