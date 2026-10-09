// ══════════════════════════════════════════════════════════════════════
// td/story/lines/voices/batch4.js — the voice overhaul, batch 4
// ══════════════════════════════════════════════════════════════════════
// { entryId: { turnIndex: { tag: line } } }. Same meaning and facts as the line it varies.

export default {
  // deep.win (schemer)
  'ndp.w4': {
    1: { cruel: "Which means somebody else is in danger tonight because of me, and honestly, better them than me.", nerdy: "Which means somebody else is the easiest vote tonight because of me. I should work out who, and make them a friend before they work it out too." },
  },
  // vp2.pair (sand drawing)
  'nv4.p5': {
    1: { goofy: "Is it another drawing in the sand? Because the last one looked like a duck.", kid: "Is it another sand drawing?", warm: "Another drawing in the sand? Okay, show me." },
    3: { ditzy: "So they talk to each other a lot? That's nice, right?", quiet: "So they talk a lot.", kid: "So they're best friends?" },
    7: { quiet: "That scared me a little. I'm in that drawing too.", kid: "That was kind of scary. I'm in that drawing too, and I don't want to be the next line {a} rubs out.", anxious: "Watching that made my stomach hurt, because I'm in that drawing too, and I'd really like to stay on the right side of it." },
  },
  // run.pet.1: Gerald
  'nrn.p1': {
    1: { kid: "Everybody, everybody, this is Gerald!", theatrical: "Ladies and gentlemen, may I present to you, Gerald.", quiet: "This is Gerald." },
    2: { dry: "That's a crab.", kid: "That's a crab!", cruel: "That's a crab, and you've lost your mind." },
    6: { dry: "Crabs don't look at people. They don't have the attention span.", nerdy: "Crabs don't really look at people. Their eyes don't work like that.", kid: "Crabs can't look at people. Can they?" },
    8: { quiet: "We don't have enough food or sleep, and now we have Gerald.", cruel: "We're starving, we're exhausted, and now there's a crab with a name. I want to go home.", goofy: "We don't have enough food, we don't have enough sleep, but we do have Gerald, so honestly, things are looking up." },
    9: { kid: "Everybody in this game is going to trick me sooner or later, but Gerald won't. Gerald's my best friend here.", theatrical: "Everybody in this game will betray me eventually, but not Gerald. Gerald is loyal, Gerald is pure, Gerald is family.", quiet: "Everybody here will lie to me eventually. Gerald won't, so I trust Gerald more than anybody." },
  },
  // run.pet.2: Gerald's house
  'nrn.p2': {
    3: { dry: "Gerald has a house now. Of course he does.", kid: "Gerald has a house? That's so cool!", quiet: "Gerald has a house now?" },
    5: { dry: "Gerald isn't in it, for the record.", kid: "But Gerald's not in there." },
    9: { quiet: "{a} built a crab a house. I can't even build a fire.", kid: "{a} built Gerald a whole house! I want one too.", cruel: "{a} built a house for a crab, while the rest of us sleep on wet sand. I'm going to lose my mind." },
  },
  // vt2.decoy (asking a favour)
  'nvu.d3': {
    0: { quiet: "Can I ask you to do something tonight, no questions?", kid: "Can you do something for me tonight? And not ask why?", theatrical: "I need a favour tonight. A big one. And I need you not to ask me any questions about it." },
    1: { dry: "That depends very much on the something.", warm: "Of course, depending on what it is. What do you need?", kid: "Depends what it is." },
    8: { quiet: "I've never asked anybody for their vote before. It felt like asking for a lot.", kid: "I've never asked anybody for their vote before. It was really scary.", theatrical: "I've never begged for a vote in my life. It felt like asking somebody for one of their organs." },
  },
  // arc.ally.formed (trio names it)
  'nar.l1': {
    1: { quiet: "I think we should stick together. Properly.", kid: "I think we should be a team. Like, a real one.", theatrical: "I'm just going to say it, the three of us should be an alliance, a proper one, starting right now." },
    2: { ditzy: "Like an alliance? Like on TV?", kid: "Like a real alliance?" },
    4: { goofy: "I'm in. Please tell me we get a name.", kid: "I'm in! Do we get a name?", quiet: "I'm in. Is there a name?" },
    6: { quiet: "So I'm in {group}. I'm going to hold {a} to that.", kid: "We're {group} now! I'm going to make sure {a} keeps every promise.", cruel: "So I'm in {group}. It sounds lovely, and I'll be the first to know if {a} breaks a single word of it." },
  },
  // long.friend.drift.any (walked past the spot)
  'nl4.d1': {
    1: { kid: "Hey! I saved you a spot.", quiet: "I saved you a spot." },
    5: { quiet: "That's the third time today.", emotional: "That's the third thing today that wasn't a big deal, and I'm starting to feel like I'm the big deal.", kid: "That's like the third time today you said that." },
    7: { quiet: "Sure. Whenever you've got time.", tough: "Sure. Find me when I'm worth your time again.", kid: "Fine. Whenever you want to be my friend again." },
  },
  // psy.prove (lastBoot picked me first)
  'nps.p3': {
    0: { quiet: "{lastBoot} was the only one out here who picked me first.", kid: "{lastBoot} was the only person who always picked me first, for everything.", theatrical: "{lastBoot} was the one person on this island who ever chose me first, for anything at all." },
  },
  // vote.doubt.breaks (a's quiet flip)
  'nf.b2': {
    1: { quiet: "Do you think we're voting out the wrong person?", kid: "Do you ever think we're voting for the wrong person?" },
    3: { quiet: "I know. Forget it.", anxious: "I know we did, I know. Forget I said anything, please.", kid: "Never mind, forget it." },
  },
  // vote.swing.no (worried about somebody else)
  'nw.n4': {
    1: { quiet: "No. Sorry.", warm: "No, I'm sorry. I really am.", tough: "No.", kid: "No, sorry." },
    5: { quiet: "That's my business.", dry: "That's between me and my ballot tonight.", kid: "I'm not telling." },
  },
  // vp2.grudge (patient)
  'nv4.g2': {
    0: { warm: "You've been really calm about {target} lately. Are you okay?", kid: "Why are you being so nice to {target} now?", loud: "You've been weirdly calm about {target}, and it's freaking me out." },
    2: { quiet: "Very calm. After everything.", kid: "Like, really calm." },
    6: { quiet: "{a} has been smiling at {target} for days. It wasn't forgiveness.", kid: "{a} has been nice to {target} for days, and it was a trick the whole time. That's kind of scary.", anxious: "{a} has been smiling at {target} for days, and I just realised it was patience, not forgiveness. I hope {a} never smiles at me like that." },
  },
  // deep.swing (schemer)
  'ndp.s4': {
    0: { cruel: "Being the swing vote isn't about tonight. It's about who has to crawl back to me tomorrow.", nerdy: "Being the swing vote isn't about tonight. It's about who owes me tomorrow, and I'm keeping a list." },
  },
  // vp.solo.case.grudge
  'npl.sc6': {
    0: { quiet: "I don't have a strategy tonight. I don't like {target}, and that's all.", loud: "I'm not going to pretend this is strategy. I can't stand {target}, {target} can't stand me, and one of us is going home!", kid: "I don't have a big plan tonight. {target} doesn't like me, and I don't like {target}, so I'm voting for {target}.", cruel: "I don't need a strategy for this one. I don't like {target}, and I'll enjoy writing it.", warm: "I wish I had a better reason, but I just don't get along with {target}, and it's been eating at me for days." },
  },
  // long.alliance.form.any (both think they're next)
  'nl6.a1': {
    1: { dry: "Funny. I think I'm next.", kid: "Me too! I think I'm next too.", quiet: "So do I." },
    7: { goofy: "Does it get a name? It has to get a name.", kid: "Does it get a name?" },
    9: { quiet: "Ten minutes ago we were both going home. Now we're {group}.", kid: "Ten minutes ago we both thought we were going home, and now we're {group}! That was so fast.", theatrical: "Ten minutes ago we were both doomed, and now we're {group}. That's how fast everything turns out here." },
  },
  // long.crowd.project.any (a points, doesn't lift)
  'nj.p5': {
    1: { tough: "Are you going to help, or are you just going to point?", kid: "Are you going to help or just point at stuff?", quiet: "Are you helping, or pointing?" },
    3: { goofy: "The big picture is that log, and the log is heavy.", kid: "The big picture is that log. It's really heavy." },
    5: { warm: "Come on, {a}, just grab an end.", tough: "Grab an end, {a}. Now." },
    7: { quiet: "{a} wants to look like the leader and do none of the work. I made sure people saw.", kid: "{a} just pointed at stuff while we did all the work. Everybody saw it.", cruel: "{a} wants to look like the leader without lifting a finger. I made very sure everybody noticed." },
  },
  // long.friend.struggle.any
  'ny.st1': {
    2: { quiet: "I can't feel anything.", goofy: "I can't feel anything. I think I'm a ghost now.", kid: "I can't feel my anything." },
    4: { quiet: "Because if we stop, it doesn't get done.", tough: "Because if we stop, nobody else is going to do it.", kid: "Because nobody else will do it." },
  },
  // morning.nobody (who's next)
  'nm.n3': {
    2: { warm: "{lastBoot} has been gone, what, ten hours? Can we breathe first?", kid: "{lastBoot} only left like ten hours ago." },
    6: { kid: "No way! You go first.", goofy: "Absolutely not. You first." },
  },
  // vp.solo.case.sank
  'npl.sc2': {
    0: { quiet: "I don't need a meeting. {target} cost us the challenge.", warm: "I hate this, but {target} cost us the challenge, and everybody saw it, so I don't need a meeting to know where the votes are.", kid: "{target} made us lose. Everybody saw it, so I don't need to ask anybody.", cruel: "{target} cost us the challenge in front of everybody. I don't need a meeting, I need a pen.", loud: "Everybody saw {target} cost us that challenge! I don't need a meeting for this one!" },
  },
  // vote.swing.yes (b was waiting)
  'nw.y4': {
    1: { quiet: "Depends who for.", kid: "Who for?", dry: "Depends. Who's the lucky winner?" },
    3: { quiet: "{target}. I was wondering when somebody would say it.", kid: "{target}? I was waiting for somebody to say that.", cruel: "{target}. Finally, somebody said it." },
    6: { quiet: "I'd been waiting for somebody to say {target}. I didn't want to go first.", kid: "I wanted to vote {target} the whole time. I just didn't want to be the one who said it first." },
  },
  // long.cross.friend.any (saved food)
  'ny.f2': {
    0: { food: "I saved you some of our food, and it's the good bit, too. Don't tell my team.", kid: "I saved you some food! Don't tell my team." },
    4: { kid: "{a} keeps being nice to me even though we're on different teams. I really hope we never have to vote for each other.", quiet: "{a} keeps being kind to me, even on the other team. I hope we never have to vote against each other." },
  },
  // long.crowd.lost.any (warm but honest)
  'nbl.c3': {
    1: { quiet: "I'm fine. I just couldn't get it.", kid: "I'm fine. I just couldn't do it.", tough: "I'm fine. I just didn't get it, okay?" },
    3: { tough: "{a}. Stop.", dry: "{a}. Read the room." },
    5: { quiet: "{a} said it nicely. It still hurt.", kid: "{a} said it really nicely, but it still made me want to cry.", tough: "{a} said it nicely, and it still felt like a punch. I'm not going to forget it." },
  },
  // deep.betray (warm)
  'ndp.b2': {
    0: { quiet: "I keep picturing {friend}'s face when the votes get read, and I can't stop.", kid: "I keep thinking about {friend}'s face when they read the votes. I can't stop thinking about it." },
  },
  // long.friend.bond.any (nerdy)
  'ny.b4': {
    1: { warm: "You're doing it right now, you know.", dry: "You're doing it right now. Badly, but you're doing it.", kid: "You're doing it right now!" },
    3: { warm: "You talked to me, and I talked back, and now we're friends. That's really all it is.", kid: "You talked to me and I talked back. That's how it works!" },
    5: { quiet: "I think I have a friend here. I want to remember that.", kid: "I think I made a friend here! A real one!", emotional: "I think I actually have a friend here. I got a little teary, honestly, and I'm not even embarrassed." },
  },
  // long.friend.comfort.any (homesick)
  'ny.co1': {
    2: { quiet: "I'm fine.", tough: "I'm fine. Go away.", kid: "I'm okay." },
    4: { quiet: "...I miss home. That's all.", kid: "...I miss my family. It's dumb.", tough: "...I miss home, okay? Don't make it a thing." },
    5: { tough: "It's not stupid. I miss home every day too.", kid: "It's not dumb. I miss home too, every day.", dry: "It's not stupid. I miss home every single day, and I'm famously not fun to be around about it." },
  },
  // vt2.decoy (people went quiet)
  'ncx.d1': {
    1: { quiet: "I think it's me tonight.", theatrical: "I just know it's me tonight. I can feel it in my bones.", kid: "I think they're going to vote me tonight." },
    2: { warm: "Hey, who told you that? Talk to me.", tough: "Who told you that?", kid: "Who said that?" },
    6: { quiet: "People went quiet around me, and that's never good, so I'm not waiting.", kid: "Everybody stopped talking to me, and that's never good. I'm going to do something about it.", tough: "When people go quiet around me, I don't wait to find out why. I move first." },
  },
  // arc.spark.grudge (first of everything)
  'nl5.g1': {
    1: { quiet: "I had it first.", kid: "I had it first!", proud: "Excuse me, I had it first." },
    2: { quiet: "You always do.", cruel: "Of course you did. You always have it first.", kid: "You always have it first." },
    7: { quiet: "A week of {b} being {b}. I'm starting to think a vote fixes it.", kid: "{b} has been annoying me all week. Maybe if {b} goes home it'll stop.", cruel: "I've had a week of {b}. The vote can't come soon enough." },
  },
  // long.friend.thanks.any
  'ny.t1': {
    3: { quiet: "It was nothing.", warm: "Oh, it was nothing, honestly. I'd do it again.", kid: "It wasn't a big deal." },
    5: { quiet: "I barely remember helping {a}. {a} remembers.", kid: "I barely remember helping, but {a} remembered. That's really nice.", schemer: "I barely remember helping {a}, but {a} does, and people here always remember who helped them. Good to know." },
  },
  // arc.warn.told
  'nar.w3': {
    1: { anxious: "Wait, why {target}? Does that mean I'm next?", kid: "{target}? Why {target}?", quiet: "{target}? Why?" },
    5: { quiet: "{pitcher} is going after {target}, and I know first. That matters.", kid: "{pitcher} is going after {target}, and I found out first. That's important, right?", anxious: "So {pitcher} is going after {target}, and I know before half the camp. I should feel lucky, but mostly I feel nervous." },
  },
  // long.adv.found.idol
  'nk.af1': {
    1: { quiet: "Is that... it is, it's an idol.", kid: "Is that... it is! I actually found an idol!", theatrical: "Is that... oh my god, it is. I am holding an idol in my actual hands." },
  },
  // vote.swing.yes (that's {votes})
  'nw.y6': {
    0: { kid: "You've got your plan face on. Who is it?", quiet: "Who is it?" },
    2: { quiet: "Huh. I thought it'd be somebody else.", kid: "Really? I thought it was going to be somebody else." },
    6: { quiet: "Fine. I'm in.", warm: "Okay, I'm in. I trust you.", kid: "Okay, I'm in." },
  },
  // long.talk.scramble.any (loud)
  'nk.sc3': {
    1: { dry: "Hi to you too.", warm: "Hey, hi, breathe. What's going on?", kid: "Hi?" },
    3: { quiet: "Maybe they were just quiet.", dry: "Maybe they were just quiet. People do that sometimes." },
    5: { quiet: "I don't know who.", warm: "I honestly don't know who it is. I'd tell you if I did.", kid: "I don't know! I promise!" },
  },
  // long.crowd.lost.any (dry insinuation)
  'nbl.c6': {
    1: { quiet: "Don't.", tough: "Don't even start.", kid: "Don't." },
    5: { warm: "Okay, that's enough. Leave {b} alone.", tough: "Okay. That's enough." },
  },
  // vp2.idol (split vote)
  'nvr.i1': {
    1: { quiet: "Why do you think that?", kid: "How do you know?" },
    3: { warm: "People can just be happy, you know.", kid: "Maybe {target} is just happy?", dry: "People are allowed to be happy. Occasionally." },
    7: { quiet: "{a} has a backup plan for the backup plan. I'm just trying to remember whose name I'm writing.", kid: "{a} has a plan, and a plan for the plan. I just need to remember whose name I'm writing.", nerdy: "{a} built a contingency for the contingency, which is impressive. I'm mostly trying to remember my part." },
  },
  // long.cross.rival.any (mirror practice)
  'nly.x2': {
    0: { cruel: "How's your team doing? Oh, wait, everybody already knows.", kid: "How's your team doing? Oh wait, I know!", quiet: "How's your team? Never mind, I already know." },
    4: { quiet: "{a} talks big. I'll be there when {a} has to back it up.", kid: "{a} says a lot of big stuff. I want to see {a} actually do it.", cruel: "{a} talks a big game. I'm going to enjoy watching {a} lose right after saying all that." },
  },
  // vote.swing.yes (b says {target} is nice)
  'nv.y4': {
    1: { kid: "Oh no. What is it?", quiet: "Oh no. What?" },
    3: { kid: "But {target} is so nice!", quiet: "But {target} is nice." },
    6: { quiet: "I said yes. I feel sick about it.", kid: "I said yes, but I feel really bad about it.", emotional: "I said yes, and I feel sick about it, and I keep thinking about {target}'s face. But I said yes." },
  },
  // long.caught.face.none
  'nlx.k5': {
    0: { quiet: "Nothing to say?", loud: "Nothing? You've got NOTHING to say to me?", kid: "You're not even going to say anything?", cruel: "Nothing to say? How very brave of you." },
    3: { quiet: "{a} didn't even try. That told me enough.", kid: "{a} didn't even say sorry. Not even a little bit.", loud: "{a} couldn't even look at me! Not an apology, not an excuse, nothing, and that says everything!" },
  },
  // thr.grievance.1 (your vote on me)
  'nth.g2': {
    0: { kid: "Morning! Do you want some of this?", quiet: "Morning. Want some?" },
    5: { quiet: "I didn't think it mattered. You were never going home.", anxious: "I didn't think it would matter, I swear. You were never in danger, I promise.", kid: "I didn't think it mattered! You weren't going home anyway." },
    7: { quiet: "I wrote {a}'s name to stay with the group. {a} found out.", kid: "I voted for {a} because everybody else was, and I didn't think {a} would find out. Now {a} knows.", cruel: "I wrote {a}'s name to stay in the group. I didn't think {a} would notice, and I'm a little annoyed {a} did." },
  },
  // morning.blindside (b voted for lastBoot)
  'nm.b9': {
    1: { quiet: "...I did. I'm sorry.", tough: "Yeah, I did. I'm not going to lie to you.", kid: "...Yeah, I did. I'm sorry." },
    5: { quiet: "It wasn't about you.", kid: "It wasn't about you, I promise." },
    8: { quiet: "I could have lied. The way {a} looked at me was worse than a fight.", kid: "I could have lied to {a}, but I didn't. The way {a} looked at me made me feel really bad.", tough: "I could have lied. I didn't, and the look on {a}'s face is going to stay with me." },
  },
  // morning.blindside (merged, a angry)
  'nm.b7': {
    1: { quiet: "So that's how it is now.", kid: "Okay, so that's how it is now?", loud: "Oh, WOW, okay. So that's how it is now!" },
    2: { warm: "It's not like that, I promise. Come and sit down.", tough: "It's not like anything. Sit down." },
    7: { quiet: "I'm just saying.", kid: "I'm just saying!" },
  },
  // long.friend.rideordie.any
  'ny.rd1': {
    1: { quiet: "Depends what it is.", kid: "What is it?", warm: "Anything, well, almost anything. What is it?" },
    3: { quiet: "And then what?", kid: "And then what happens?" },
    5: { quiet: "...Okay. I promise.", kid: "Okay. Pinky promise.", tough: "...Fine. I promise." },
  },
  // vote.swing.yes (floater)
  'nw.y10': {
    1: { quiet: "I've been listening.", dry: "I've been listening to groups all week. It's been very educational.", kid: "I've just been listening to everybody." },
    5: { quiet: "...Fine. {target}.", kid: "...Okay. {target}." },
    6: { quiet: "Being the swing vote is great until you get it wrong. I'm not getting it wrong.", kid: "Being in the middle is fun until you pick wrong. I'm not picking wrong tonight.", anxious: "Being the swing vote is great until you swing the wrong way, and I'm so scared of swinging the wrong way tonight." },
  },
  // deep.win (again, silence)
  'ndp.w5': {
    0: { quiet: "Another win, another silence. I'm getting used to it.", kid: "I won again, and nobody clapped again. I'm kind of getting used to it, but I don't like it.", theatrical: "Another win, and another wall of silence. I'm learning to hear applause in my head." },
  },
  // long.friend.celebrate.any
  'nlx.c1': {
    2: { dry: "Somebody does have to cook tonight. It's going to be me.", kid: "But somebody has to cook." },
    6: { quiet: "For one night, nobody talked about the vote. I needed that.", kid: "For one whole night, nobody talked about voting. That was the best.", emotional: "For one night nobody talked about the vote, and I didn't realise how much I needed that until I nearly cried laughing." },
  },
};
