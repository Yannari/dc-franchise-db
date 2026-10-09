// ══════════════════════════════════════════════════════════════════════
// td/story/lines/voices/batch6.js — the voice overhaul, batch 6
// ══════════════════════════════════════════════════════════════════════
// { entryId: { turnIndex: { tag: line } } }. Same meaning and facts as the line it varies.

export default {
  // vote.swing.no (b won't whisper)
  'nv.n4': {
    6: { calm: "{b} won't play along, and that's fine. One less person I have to keep informed.", loud: "{b} said no to my face! Fine, that's one less person to worry about!", schemer: "{b} won't play along, and good. Somebody who refuses to whisper is somebody who won't hear anything either.", earnest: "{b} was honest with me, and I respect that, even if it costs me a vote." },
  },
  // long.crowd.chores.any
  'ny.c2': {
    2: { warm: "Because we're the ones who notice it needs doing, and I'd rather it was us than nobody.", calm: "Because we notice it needs doing. Somebody has to.", competitive: "Because we're the ones who actually get things done around here." },
    4: { warm: "Then who'd do it? Come on, it's nearly done.", dry: "Then who'd do it? The crabs?" },
  },
  // psy.control (my name came up)
  'nps.c1': {
    0: { calm: "My name came up last night. Not enough to send me home, but enough that I'm going to be more careful.", loud: "My name came up last night! Not enough to send me home, but enough to make me really angry.", competitive: "My name came up last night. Somebody's watching me, which means somebody thinks I'm winning.", warm: "My name came up last night, and it hurt more than I thought it would. Somebody's watching me." },
    1: { schemer: "The better you play, the more people see you playing. So I'm going to play where they can't see.", calm: "The better you play, the more people notice. I'm going to slow down for a few days.", competitive: "The better you play, the more people see it. I'm not going to stop playing, I'm just going to stop showing it." },
  },
  // vp2.threat (who you'd least want at the end)
  'nv4.t1': {
    2: { dry: "All the time. It's my bedtime story.", warm: "All the time, and I hate that I think about it." },
    4: { warm: "{target}? But {target} is lovely.", loud: "{target}?! But everybody loves {target}!", calm: "{target}? {target} is great, though." },
    8: { competitive: "I like {target}. I also know I lose to {target} at the end, and I didn't come here to lose.", schemer: "I like {target}, and that's exactly why {target} has to go. The ones everybody likes are the ones who win.", calm: "I like {target}, and so does everybody. That's why it has to be soon." },
  },
  // long.friend.rekindle.any
  'nlx.r1': {
    1: { warm: "We haven't really talked in days. I've missed you.", dry: "We haven't talked in days. I assumed you'd been abducted.", tough: "We haven't talked in days. Your choice, not mine." },
    6: { warm: "This game pulls people apart and you don't even notice it happening. I'm not letting it take {b} from me.", competitive: "The game pulls people apart without you noticing. I'm not losing {b} to it.", calm: "The game pulls people apart slowly. I'm glad I noticed before it was too late with {b}.", schemer: "The game pulls people apart. I'd rather have {b} back on my side before somebody else notices {b} is alone." },
  },
  // arc.ally.formed (trio)
  'nar.l3': {
    1: { warm: "Is it weird that you two are the only people here I actually like?", loud: "Okay, is it weird that you two are the only people here I can stand?", dry: "Is it weird that you two are the only people here I tolerate?" },
    5: { warm: "I trust these two, and they trust me, and I haven't felt this safe since the day we got here.", competitive: "Three people who trust each other, voting together. I feel better about this game than I have in days.", loud: "I trust these two with my life, and they trust me, and I haven't felt this safe since we got here!" },
  },
  // morning.nobody (nobody says lastBoot's name)
  'nm.n2': {
    0: { warm: "Is it weird that nobody's mentioned {lastBoot} all morning? It feels wrong.", quiet: "Nobody's said {lastBoot}'s name all morning." },
    2: { warm: "Do you want to say something about {lastBoot}? We can.", cruel: "What do you want, a moment of silence?", dry: "What do you want, a memorial service?" },
    7: { warm: "You're the worst. I love you, but you're the worst.", loud: "You are the WORST.", dry: "You're a monster." },
  },
  // psy.prove (my name came up)
  'nps.p1': {
    0: { calm: "My name came up last night. I'm the one people think they can get rid of whenever they want.", loud: "My name came up last night! Of course it did! I'm the one everybody thinks is easy to get rid of!", warm: "My name came up last night, and it stung. I'm the one everybody thinks they can let go." },
    1: { competitive: "People have underestimated me my whole life, and I've beaten them my whole life. I'm going to beat these ones too.", calm: "I've been underestimated my whole life, and I've always proved people wrong. I'm not worried, I'm just ready.", earnest: "I've been underestimated my whole life, and I've always worked harder to prove people wrong. I'll do that here too." },
  },
  // long.friend.rideordie.any (merged)
  'ny.rd2': {
    3: { calm: "Let them come. They have to get through both of us.", loud: "Let them come! They've got to get through both of us first!" },
    6: { warm: "{b} is the only person here I'd trust with my vote without asking. I really hope that's smart.", schemer: "{b} is the only person I'd trust with my vote without asking. I've never said that about anybody in a game.", calm: "{b} is the only one here I'd trust with my vote without asking. I'm at peace with that." },
  },
  // vote.target.safe (warm, the boot is sure)
  'nv.a7': {
    0: { earnest: "I feel good about tonight. I think it's {wrote}, and I really hope {wrote} isn't too upset.", warm: "I feel really good about tonight! I think it's {wrote}, and I hope {wrote} knows it isn't personal.", ditzy: "I feel pretty good about tonight. It's {wrote}, I think, yeah, it's definitely {wrote}." },
  },
  // drama.dispute (keep the strong ones)
  'nd.dp2': {
    1: { warm: "No. {sank} had one bad day, that's all.", loud: "No way! {sank} had ONE bad day!", calm: "No, {sank} had one bad day. Let's not overreact." },
    3: { earnest: "{sank} has been loyal to us from day one. You'd throw that away for one challenge?", loud: "{sank} is loyal to us! You'd really throw that away over one challenge?" },
    5: { calm: "And when it's you having the bad day?", warm: "And when it's you having the bad day? Who's going to stand up for you?" },
  },
  // long.romance.flirt.any (nerdy, berries)
  'ns.f4': {
    1: { warm: "Aw, you didn't have to do that. That's so sweet.", dry: "You saved me berries. That's either sweet or a poisoning.", flirty: "You saved me berries? Okay, now I like you even more." },
    3: { warm: "It's a little weird, and it's also really, really sweet.", flirty: "It's a little weird. It's also the nicest thing anybody's done for me out here." },
    5: { flirty: "You can stay. I'd like you to stay.", warm: "You can stay, you know. I want you to." },
  },
  // long.romance.moment.crush
  'ns.mr2': {
    2: { flirty: "I like helping. Mostly when it's you.", calm: "I like helping." },
    6: { flirty: "Fine, I don't like chores. I like doing chores next to {b}, and those are very different things.", earnest: "Okay, I'll be honest. I don't like chores, I like being near {b}, and I'm not sure what to do about that.", tough: "Fine, I don't like chores, I like {b}. Don't tell anybody." },
  },
  // long.friend.rally.any
  'ny.ra1': {
    1: { dry: "We have kind of been losing, though. Consistently.", anxious: "But we have been losing. A lot." },
    6: { warm: "That speech was so cheesy, and it worked, and I actually feel better.", calm: "That was cheesy, but it worked. I feel a lot better.", cruel: "That speech was unbearably cheesy, and it worked, and I'll never forgive {a} for that." },
  },
  // long.friend.meal.any (half each)
  'nl6.m2': {
    0: { warm: "Here, do you want the rest of mine?", food: "Do you want the rest of mine? I can't believe I'm offering, but do you?", quiet: "Want mine?" },
    3: { dry: "Nobody here is not hungry. Try again.", warm: "Nobody out here is not hungry. Come on." },
    7: { warm: "{a} tried to give me {a.posAdj} food. Out here, that's huge, and I'm going to remember it for a long time.", competitive: "{a} tried to give me {a.posAdj} food. Out here, that's loyalty, and I don't forget loyalty.", calm: "{a} offered me {a.posAdj} food. Out here, that means a lot, and I'm going to remember it." },
  },
  // long.drama.explode.any
  'nh.e1': {
    1: { quiet: "What did I say?", loud: "What did I even SAY?", warm: "Wait, what did I say? I'm sorry if I upset you." },
    3: { tough: "Okay. Enough.", warm: "Okay, that's enough, both of you.", calm: "Okay, let's all breathe for a second." },
    7: { tough: "{a} had been waiting to explode at somebody for days, and I was there. Good thing {c} was too.", warm: "{a} was going to explode at somebody, and it happened to be me. I'm really grateful {c} stepped in." },
  },
  // psy.belong (numbers don't write names)
  'nl4.p2': {
    1: { warm: "What? Of course they do, why would you even ask that?", dry: "Of course they do. Mostly." },
    5: { warm: "Okay, fair. But I didn't write it, and I'd tell you straight away if I knew who did.", blunt: "Fair. I didn't write it, and if I knew who did, I'd tell you." },
    8: { calm: "Getting votes is one thing. Not knowing who's being honest with me is what's keeping me up.", loud: "Getting votes, fine! Not knowing who's being nice and who's lying to my face, THAT's what I can't sleep through!", schemer: "Getting votes is fine. Not knowing who wrote them is a problem I intend to solve." },
  },
  // vt2.decoy (conversations stop)
  'nvt.d2': {
    1: { calm: "You're making everybody nervous, walking around like that.", warm: "Hey, you're making everybody nervous. Are you okay?", dry: "You're making everybody nervous. Which, to be fair, is a talent." },
    3: { warm: "That could be about anybody, you know.", calm: "It could be about anybody." },
    8: { warm: "{a} is so sure it's {a} tonight, and I'm scared {a} might be right.", calm: "{a} is convinced it's {a} tonight. I've looked at it, and I'm not sure {a} is wrong.", schemer: "{a} is convinced it's {a} tonight, and I'm not going to tell {a} whether that's right." },
  },
  // psy.belong (organiser with nothing to organise)
  'nps.b4': {
    0: { loud: "Back home I organise EVERYTHING. Parties, group chats, all of it. Here, nobody needs me to organise anything, and it's driving me crazy.", warm: "Back home I'm the one who organises everything for everybody, and here nobody needs me to, and I feel a bit lost." },
    1: { warm: "So I've been helping with chores, not because I like chores, but because people talk to you when you're helping.", schemer: "So I help with chores. Not because I enjoy them. People talk while they work, and I listen." },
  },
  // morning.blindside (schemer fishing)
  'nm.b5': {
    1: { warm: "Mind if I fish here with you?", loud: "Mind if I fish here?", quiet: "Can I fish here?" },
    3: { warm: "You're taking it pretty well, about {lastBoot}. Are you okay?", blunt: "You're taking {lastBoot} pretty well." },
    7: { anxious: "I don't know what you want me to say. I really don't.", tough: "I don't know what you want me to say, and I don't like your tone." },
    10: { anxious: "{a} is way too calm about this, and it's making my stomach hurt.", warm: "{a} is way too calm about {lastBoot}, and I don't think that's a good sign for whoever did it." },
  },
  // psy.redemption
  'nps.e4': {
    0: { calm: "{lastBoot} going home felt like my own vote all over again. I'm trying to sit with it rather than run from it.", loud: "Watching {lastBoot} go felt like my own boot all over again! Same stomach drop, same everything!", warm: "{lastBoot} going home last night broke my heart. It felt exactly like the night they voted me out." },
    1: { competitive: "I can't save everybody, and I'm finally learning that. I just have to be the one still standing at the end.", earnest: "I can't save everybody, I know that now. I just have to keep going for the people who are still here." },
  },
  // long.romance.flirt.any (jacket)
  'ns.f2': {
    2: { tough: "I'm fine.", proud: "I'm fine. I don't get cold." },
    5: { calm: "I'll sit closer to the fire, and closer to you, if that's okay.", loud: "I'll just sit closer to the fire, and to you, if that's okay!", earnest: "I'll sit closer to the fire, and closer to you, if you don't mind. I'd like that." },
  },
  // long.alliance.form.couple
  'na.c1': {
    2: { warm: "We've been together since we got here. Of course they think that.", calm: "We've barely been apart since we got here. Of course they do." },
    9: { warm: "That's a terrible name, and I love it.", loud: "That is the WORST name. I love it.", calm: "That's a terrible name. Let's keep it." },
  },
  // arc.adv.steal
  'nar.t3': {
    1: { schemer: "Taking somebody's vote in front of everybody makes enemies. I'd better be right, and I usually am.", loud: "I'm about to take somebody's vote in front of EVERYBODY. I'm going to make enemies, so I'd better be right!", calm: "Taking somebody's vote in front of everybody will make me enemies. I'm sure about this, though." },
  },
  // vp2.pair (trio, sharing a bowl)
  'nvr.p1': {
    1: { warm: "They share everything. It's really sweet.", cruel: "They share everything. It's revolting.", dry: "They share everything. Even germs." },
    7: { warm: "We're splitting up the only happy couple on this island. I feel terrible, and I'm still going to do it.", cruel: "We're breaking up the island's only happy couple. I'm going to be the villain at the reunion, and I'll wear it well.", calm: "We're splitting up the only happy couple here. I'll be the bad guy at the reunion, and I've made my peace with it." },
  },
  // vote.swing.no (gave my word)
  'nv.n3': {
    5: { earnest: "I already gave my word to somebody, and I don't break my word.", loud: "I already gave my word! I don't change my vote every time somebody new walks over!", calm: "I've already given my word. I'm not going to change it every time somebody new asks." },
    6: { calm: "{b} is locked into something. That worries me more than a straight no.", loud: "{b} is locked into something and won't tell me what! That's worse than a no!", schemer: "{b} gave somebody else a promise. I need to find out whose, and what it's worth." },
  },
  // long.romance.night.kiss (spin the bottle)
  'ns.k1': {
    4: { flirty: "Then I'm making a new rule, and you're going to like it.", schemer: "Then I'm making a new rule." },
    7: { warm: "It was just a game, and I'm going to be thinking about it all night.", calm: "It was just a game, and I'll be thinking about it all night anyway.", flirty: "It was just a game. I'm going to be thinking about that game for a very long time." },
  },
  // long.adv.search.any
  'nk.as1': {
    1: { schemer: "I don't care how this looks. I'm getting myself some insurance.", loud: "I don't care how this looks! I'm getting some insurance!", warm: "I know how this looks. I just want something to keep me safe." },
    3: { calm: "Nothing. I'm covered in dirt and I've got nothing, so if anybody asks, I was going to the bathroom.", loud: "NOTHING! I'm covered in dirt and I have nothing! If anybody asks, I was going to the bathroom!", anxious: "Nothing, and now I'm covered in dirt, and if anybody asks, I was going to the bathroom. Please don't ask." },
  },
  // morning.blindside (loud declares war)
  'nm.b11': {
    2: { quiet: "Oh no.", dry: "Oh no. Here we go.", warm: "Oh no. {a}, please." },
    4: { calm: "Can you not do this in front of everyone?", warm: "Please, can you not do this in front of everyone?" },
    8: { calm: "{a} just declared war on the whole camp before breakfast. I'm going to stay out of the way.", warm: "{a} just declared war on everybody before breakfast. I'm worried about {a}, honestly.", schemer: "{a} declared war on the whole camp before breakfast. That makes the next vote very easy for somebody." },
  },
  // vote.swing.yes (carrying chores)
  'nw.y5': {
    2: { warm: "Always. What's the catch?", dry: "Always, but what's the catch? There's always a catch." },
    7: { calm: "{a} carried half my chores to get my vote. That seems fair to me.", warm: "{a} helped me with my chores and asked for my vote. I didn't mind at all.", schemer: "{a} paid for my vote with half my chores. Cheap, but fair." },
  },
  // vp.solo.case.group
  'npl.sc5': {
    0: { calm: "{target} is with {theirs}, and I'm not, so this is an easy one.", loud: "{target} is with {theirs}, and I'm not with {theirs}! Easiest decision of the week!", warm: "I don't have anything against {target}. {target} is just with {theirs}, and I'm not.", competitive: "{target} is with {theirs}, and {theirs} are the ones I have to beat. Easy decision." },
  },
  // long.caught.face.apology
  'nlx.k1': {
    1: { warm: "I know, and I'm so sorry. I really am.", calm: "I know. I'm sorry, and I mean it.", tough: "I know, I'm sorry. I'm not going to make excuses." },
    2: { loud: "That's IT? Sorry?", calm: "That's it? Just sorry?", warm: "That's all? Just sorry?" },
    4: { warm: "{a} didn't make excuses, which I wasn't expecting. I want to forgive {a}, I'm just not there yet.", tough: "{a} didn't make excuses, and I respect that. I'm still angry." },
  },
  // vt2.decoy (walks in twos)
  'nvu.d5': {
    3: { warm: "You're one of my two. Always.", calm: "You're one of my two.", tough: "You're one of my two. That's settled." },
    8: { calm: "Maybe it's not me, and I'm just tired and hungry and paranoid. If it is me, though, I'm going to fight.", loud: "Maybe I'm just tired and hungry and paranoid! But if it IS me, I'm not going quietly!", competitive: "Maybe it isn't me. If it is, I'm going to make them work for it." },
  },
  // arc.spark.pair (finish sentences)
  'nar.p2': {
    3: { schemer: "It's cute until you realise it's two votes I'll never get. Somebody has to split {b} and {c} up soon.", warm: "It's really cute, and I hate that my first thought was that I'll never get either of their votes.", competitive: "It's cute until it's two votes walking to the end together. That's not happening on my watch." },
  },
  // run.food.1 (emergency crackers)
  'nrn.f1': {
    2: { dry: "Those are emergency crackers. Obviously.", goofy: "Those are emergency crackers. For emergencies." },
    9: { calm: "I'm not sorry about the snacks. If I didn't hide my food on group trips, I didn't eat my food.", loud: "I'm NOT sorry about the snacks! If you don't hide your food on a group trip, you don't eat your food!" },
  },
  // vp2.sank (trio)
  'nvr.s1': {
    1: { warm: "Please don't say it.", quiet: "Don't." },
    4: { warm: "I feel awful about this.", quiet: "This is awful." },
    7: { calm: "I feel bad about this one. {target} tried, and I'm still writing the name, because we can't keep losing.", competitive: "{target} tried, I know. We still can't afford to lose again, so I'm writing the name." },
  },
  // long.crowd.chores.any (bossy assigns jobs)
  'nl.c1': {
    3: { goofy: "Don't say latrine, please, I'm begging you.", loud: "Don't say latrine! Do NOT say latrine!" },
    6: { dry: "It's not the easy one. It's heavy, and it's uphill.", tough: "It's not the easy one. Try carrying it." },
  },
  // psy.belong (eighth grade)
  'nps.b3': {
    1: { calm: "Of course they do. What's going on?", loud: "What? Of course they do!", tough: "Of course they do. Who said they don't?" },
    5: { calm: "Well, you've got me. That counts for something.", tough: "You've got me. That's not nothing." },
    6: { calm: "{b} said 'you've got me' like it was nothing. It meant a lot, and I'm going to hold onto that.", tough: "{b} said 'you've got me', and I didn't say anything back, but it meant everything.", loud: "{b} said 'you've got me' like it was nothing! It was everything!" },
  },
  // long.villain.loom.any
  'nlx.v2': {
    2: { loud: "What's THAT supposed to mean?", quiet: "...What does that mean?", tough: "What's that supposed to mean? Say it properly." },
  },
};
