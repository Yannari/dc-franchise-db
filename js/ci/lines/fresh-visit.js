// More words for the visit (the user, 2026-10-20: "replace and fill more visit
// lines"). Data only; each list joins the pool of the same key.
//
// Most of a visit was built from pools of three: the knock at the door aired 15
// times in six seasons from 3 lines, the kiss 11 from 3, why somebody chose who
// to see 7-8 from 3, and every power's handover 4-6 from 3. A visit happens on
// most nights, so each of those was heard again every season or two.
//
//   visit.choose.<why>    a, blocked, on who they're going to see and why
//   visit.door.real       b knocks; a opens; b looks like the profile
//   visit.door.catfish    b knocks; a opens; b is not who the profile showed
//   visit.door.caught     a knocks; b opens; b is not who the profile showed
//   visit.door.both       neither is who their profile showed
//   visit.talk.<why> / visit.talk2.<why>   a (the visitor) and b, sitting down
//   visit.kiss            a and b kiss
//   visit.power.<kind>    a hands b a power, and says how it works
//   visit.hand            a warns b about c
//   visit.inperson.*      a, a Super Influencer, blocked b at b's door (bye);
//                         a, blocked in person by b, once b has gone (after)
//   visit.bye.cooled / walkout   how a visit that turned into an argument ends
//   visit.after.confront  a, after b came to have it out
const F = (key, list) => ({ [key]: list.map((x, i) => ({ id: `${key}.v${String(i + 1).padStart(2, '0')}`, ...x })) });
const S = (text, beat) => ({ turns: [{ by: 'a', say: text }], ...(beat ? { beat } : {}) });
const T = (...turns) => ({ turns: turns.map(([by, kind, text]) => ({ by, [kind]: text })) });
const B = (x, beat) => ({ ...x, beat });

export const FRESH_VISIT = {
  // ── who they go to see ────────────────────────────────────────────────
  ...F('visit.choose.friend', [
    S("There's one person who made this whole thing worth it. I'm going there.", '{a} pulls on a hoodie and heads for the door.'),
    S("I don't need answers. I need a hug from my friend."),
    T(['a', 'react', "'You may visit one Player.' Easy."], ['a', 'say', "I'm going to see the person who kept me sane in here."]),
    S("I'm not leaving without meeting the one person I actually trust.", '{a} checks the mirror once, then goes.'),
    S("No drama. No questions. I just want to see my friend's face."),
    S("If I only get one door, it's my friend's door."),
    S("I'm going to say thank you in person. That's all I want."),
    S("Some people you meet once and you know. I'm going to see mine.", '{a} walks out with a small smile.'),
  ]),
  ...F('visit.choose.crush', [
    S("I've been flirting through a screen for days. Time to see if it's real.", '{a} fixes {a.posAdj} hair one last time.'),
    S("There's one person I'd never forgive myself for not meeting."),
    T(['a', 'react', "One visit? Oh, I know exactly where I'm going."], ['a', 'say', "And I'm nervous. Really nervous."]),
    S("If the spark is real, I want to find out tonight."),
    S("I'm going to meet the person who made this place fun.", '{a} sprays on a little perfume, just in case.'),
    S("Every chat with {b.obj} felt like a date. Now I get a real one. Sort of."),
    S("Goodbye game, hello crush."),
    S("I'm going to see {b.obj} before I lose my nerve.", '{a} practically runs out the door.'),
  ]),
  ...F('visit.choose.truth', [
    S("I've had questions about one profile since day one. Tonight I get answers."),
    S("I'm going to knock on the door I've wondered about the most.", '{a} grabs the door handle with a determined face.'),
    S("If that profile isn't real, I want to see it with my own eyes."),
    S("One person in there has been lying to everybody. I'm finding out who's behind the screen."),
    S("I don't care about anything else. I want the truth."),
    S("My gut has been screaming about one profile. Let's see if my gut was right.", '{a} walks out quickly.'),
    S("I'm leaving with an answer. That's my prize."),
    S("Somebody's about to get a very surprising knock."),
  ]),
  ...F('visit.choose.apology', [
    S("I wasn't fair to somebody in there. I'm going to fix that before I go."),
    S("There's an apology I owe, and I want to say it to a face, not a screen.", '{a} takes a long breath at the door.'),
    S("I played somebody who didn't deserve it. I'm going to tell {b.obj}."),
    S("If I'm leaving, I'm leaving with a clean conscience."),
    S("I have one thing left to do in this game, and it's say sorry."),
    S("Somebody trusted me, and I let {b.obj} down. {b.Sub} should hear it from me.", '{a} walks slowly down the hall.'),
    S("I'm not going for me. I'm going for {b.obj}."),
    S("Pride can wait. I need to apologize."),
  ]),
  ...F('visit.choose.family', [
    S("I'm going to see the person who matters most. Obviously.", '{a} is out the door before the screen finishes.'),
    S("There's only one door I'd ever choose. Family first."),
    S("I'm going to hug the person I love most in this building."),
    S("I need {b.obj} to hear me say I'm proud. In person."),
    S("No question. No hesitation. I'm going to {b.obj}."),
    S("I came in for {b.obj}, and I'm leaving through {b.posAdj} door.", '{a} wipes {a.posAdj} eyes on the way out.'),
    S("I'm going to tell {b.obj} to win this for both of us."),
    S("Of course I'm going there. Where else would I go?"),
  ]),
  ...F('visit.choose.power', [
    S("I've got something to give away. And I know exactly who deserves it.", '{a} tucks something into a pocket and heads out.'),
    S("I can't win. But I can make sure somebody I trust has a better shot."),
    S("I'm not leaving empty-handed, and neither is my friend."),
    T(['a', 'react', "'You have a power to pass on.' Oh, this is good."], ['a', 'say', "There's only one person I'd hand this to."]),
    S("This power is going to the person who always had my back."),
    S("Somebody's about to get a very good surprise.", '{a} grins at the empty hallway.'),
    S("I'm handing over my last move. Let's make it count."),
    S("If I can't play, I can still change the game."),
  ]),
  ...F('visit.choose.confront', [
    S("Somebody blocked me with a smile. I want to see that smile up close.", '{a} walks out without looking back.'),
    S("I'm not going for a goodbye. I'm going for an explanation."),
    S("They want to block me? Fine. They can say why to my face."),
    S("I have a few things to say, and I'm saying them in person."),
    S("This isn't going to be a nice visit.", '{a} pulls the door shut a little too hard.'),
    S("I'm going to look {b.obj} in the eye and ask why. That's all."),
    S("They thought typing it would be enough. It isn't."),
  ]),
  ...F('visit.choose.answers', [
    S("I want to know exactly why it was me. And I want to hear it from {b.obj}."),
    S("Somebody made a choice tonight. I'm going to ask {b.obj} about it.", '{a} walks straight to the stairs.'),
    S("No hard feelings. Mostly. I just need to understand."),
    S("I'm going to get the answer the Circle didn't give me."),
    S("If I don't ask, I'll wonder forever. So I'm asking."),
  ]),

  // ── the door ──────────────────────────────────────────────────────────
  ...F('visit.door.real', [
    B(T(['a', 'react', "Is somebody knocking? Somebody's knocking!"], ['b', 'react', "It's me!"], ['a', 'react', "Oh my God! Come here!"]), '{a} pulls {b} into a hug before the door is all the way open.'),
    T(['b', 'react', "Surprise."], ['a', 'react', "No way. You look exactly like your pictures!"], ['b', 'react', "Told you they were real."]),
    B(T(['a', 'react', "Footsteps. Footsteps outside my door."], ['b', 'react', "Hi! It's me. The real me."], ['a', 'react', "You're real! You're actually real!"]), '{a} and {b} both start laughing in the doorway.'),
    T(['b', 'react', "Hey, you."], ['a', 'react', "Oh. Oh, it's you! Get in here!"]),
    B(T(['a', 'react', "Wait. Is that... it is! It's you!"], ['b', 'react', "It's me! Hi!"]), '{a} and {b} hug and sway a little in the doorway.'),
    T(['b', 'react', "Knock knock. Sorry. I had to."], ['a', 'react', "You're the best. You're exactly how I pictured. Come in!"]),
    B(T(['a', 'react', "Who is it? Who is it?"], ['b', 'react', "Who do you think?"], ['a', 'react', "Oh my God, it's you!"]), '{a} jumps up and down in the doorway.'),
    T(['b', 'react', "Hi. I hope this is okay."], ['a', 'react', "Okay? This is perfect. You look just like you!"]),
    B(T(['a', 'react', "Somebody's at my door. Oh no. Oh yes."], ['b', 'react', "Hi, friend."], ['a', 'react', "It's really you. Come in, come in."]), '{a} holds the door wide open.'),
  ]),
  ...F('visit.door.catfish', [
    T(['a', 'react', "Hi? Can I help you?"], ['b', 'react', "It's me. I'm {b}."], ['a', 'react', "You're {b}? No. Wait. Really?"]),
    B(T(['b', 'react', "Hi. Don't freak out."], ['a', 'react', "Who are you?"], ['b', 'react', "{b}. The one you've been talking to."]), '{a} stares, then slowly starts to laugh.'),
    T(['a', 'react', "Sorry, I think you have the wrong apartment."], ['b', 'react', "No, I've got the right one. It's {b}."], ['a', 'react', "Shut up. Shut UP. Get in here and explain."]),
    B(T(['b', 'react', "So. Surprise. I'm {b}."], ['a', 'react', "You are absolutely not {b}."], ['b', 'react', "I absolutely am. Kind of."]), '{a} pulls {b} inside before anybody can see.'),
    T(['a', 'react', "Hello? Do I know you?"], ['b', 'react', "Better than you think. I'm {b}."], ['a', 'react', "I need to sit down. Come in. I need to sit down."]),
    T(['b', 'react', "Hi. I'm the person behind {b}."], ['a', 'react', "The person behind... oh my God."], ['b', 'react', "Can I come in? I'll explain everything."]),
    B(T(['a', 'react', "Who's this? I wasn't expecting anybody I don't know."], ['b', 'react', "You know me. I'm {b}."], ['a', 'react', "No. No way!"]), '{a} covers {a.posAdj} mouth with both hands.'),
    T(['b', 'react', "Before you say anything, yes, it's really me. {b}."], ['a', 'react', "Okay, you have so much explaining to do."]),
  ]),
  ...F('visit.door.caught', [
    T(['a', 'react', "Hi. I'm here to see {b}."], ['b', 'react', "That's me. Please come in. Quickly."], ['a', 'react', "I knew it. I knew something was off."]),
    B(T(['b', 'react', "Oh. Oh no. It's you."], ['a', 'react', "And you're {b}? Really?"]), '{b} glances down the hallway and pulls {a} inside.'),
    T(['a', 'react', "You're {b}? You don't look anything like your pictures."], ['b', 'react', "I know. I can explain. Please."]),
    T(['b', 'react', "Hi. Please don't scream."], ['a', 'react', "I'm not screaming. I'm just very, very surprised."]),
    B(T(['a', 'react', "This is {b}'s apartment?"], ['b', 'react', "It is. I'm {b}. Sort of."], ['a', 'react', "Sort of. Okay. I'm coming in."]), '{a} walks in and turns around to look at {b} properly.'),
    T(['b', 'react', "I was hoping it wouldn't be you."], ['a', 'react', "And I was hoping I was wrong about you."]),
    T(['a', 'react', "So it's true."], ['b', 'react', "It's true. Come in before somebody hears."]),
    B(T(['b', 'react', "You came to my door."], ['a', 'react', "I came to see who {b} really is."], ['b', 'react', "Well. Here I am."]), '{a} and {b} stand in silence for a second.'),
  ]),
  ...F('visit.door.both', [
    T(['b', 'react', "Hi. So, I'm {b}. Except I'm not."], ['a', 'react', "That's funny, because I'm {a}. Except I'm not either."]),
    B(T(['a', 'react', "Wait. You're {b}?"], ['b', 'react', "And you're {a}?"]), 'They look at each other and burst out laughing.'),
    T(['b', 'react', "I have a confession."], ['a', 'react', "Me too. You first."], ['b', 'react', "I'm not really {b}."], ['a', 'react', "I'm not really {a}!"]),
    B(T(['a', 'react', "Neither of us looks like our pictures."], ['b', 'react', "Not even a little."]), '{a} and {b} high-five in the doorway.'),
    T(['b', 'react', "Okay, this is the strangest moment of my life."], ['a', 'react', "Two fakes, one door. Come in."]),
    T(['a', 'react', "You're not {b}."], ['b', 'react', "And you're definitely not {a}."], ['a', 'react', "Well. This is awkward. Come in."]),
    B(T(['b', 'react', "We've both been lying this whole time?"], ['a', 'react', "Looks like it. Want a snack?"]), 'They both laugh so hard they have to sit down.'),
    T(['a', 'react', "I thought I was the only one."], ['b', 'react', "Me too. We should talk."]),
  ]),

  // ── the talk ──────────────────────────────────────────────────────────
  ...F('visit.talk.friend', [
    T(['a', 'say', "I couldn't leave without seeing you."], ['b', 'say', "I'm so glad it's you. I was so scared it'd be somebody else."]),
    B(T(['a', 'say', "You made this whole thing worth it."], ['b', 'say', "You did that for me too. Every day."]), '{a} and {b} sit shoulder to shoulder on the couch.'),
    T(['a', 'say', "Promise me you'll keep being you in there."], ['b', 'say', "I promise. Even when it's hard."]),
    T(['b', 'say', "I'm going to miss you so much in here."], ['a', 'say', "You'll be fine. You've got this."]),
  ]),
  ...F('visit.talk2.friend', [
    T(['a', 'say', "When this is over, we're getting dinner. A real one."], ['b', 'say', "Deal. You're paying."]),
    T(['b', 'say', "Who do I talk to when you're gone?"], ['a', 'say', "Talk to yourself. You're good company."]),
    T(['a', 'say', "I knew you'd be like this. Exactly like this."], ['b', 'say', "Is that good?"], ['a', 'say', "It's the best."]),
    T(['b', 'say', "Thank you for picking me."], ['a', 'say', "It was never going to be anybody else."]),
  ]),
  ...F('visit.talk.crush', [
    B(T(['a', 'say', "Okay. You're real. And you're... wow."], ['b', 'say', "Stop. You're making me nervous."]), '{a} and {b} sit closer than they need to.'),
    T(['b', 'say', "I've been wondering what your voice sounds like for days."], ['a', 'say', "And?"], ['b', 'say', "Better than I imagined."]),
    T(['a', 'say', "I've thought about this moment a lot."], ['b', 'say', "Me too. A lot a lot."]),
    T(['b', 'say', "So this is what you look like when you're nervous."], ['a', 'say', "I'm not nervous. Okay, I'm very nervous."]),
    B(T(['a', 'say', "I didn't know what I'd say when I got here."], ['b', 'say', "You don't have to say anything."]), 'They just look at each other for a moment.'),
    T(['b', 'say', "You came to see me. Out of everybody."], ['a', 'say', "Out of everybody. Obviously."]),
  ]),
  ...F('visit.talk2.crush', [
    T(['b', 'say', "Is it weird that I already miss you and you're still here?"], ['a', 'say', "Not weird. Same."]),
    T(['a', 'say', "Find me when this is over. I mean it."], ['b', 'say', "I'll find you. That's a promise."]),
    T(['b', 'say', "This is the best goodbye I could have asked for."], ['a', 'say', "It's not goodbye. It's see you soon."]),
    T(['a', 'say', "I'm leaving, but I'm not done with you."], ['b', 'say', "Good. I'm not done with you either."]),
    T(['b', 'say', "Okay, now the game is going to be so boring."], ['a', 'say', "Win it. Then you can tell me all about it."]),
    T(['a', 'say', "I'm really glad the spark was real."], ['b', 'say', "Me too. So, so glad."]),
  ]),
  ...F('visit.talk.truth', [
    T(['a', 'say', "So. You're the one behind the profile."], ['b', 'say', "Guilty. Are you mad?"], ['a', 'say', "I'm not mad. I'm impressed."]),
    T(['b', 'say', "You figured me out before anybody."], ['a', 'say', "I had a feeling from the start."]),
    T(['a', 'say', "Why the fake profile?"], ['b', 'say', "I didn't think people would like the real me."], ['a', 'say', "I think they would. I do."]),
    T(['b', 'say', "Go ahead. Ask me anything."], ['a', 'say', "Okay. Was any of it you?"], ['b', 'say', "All the important parts."]),
    T(['a', 'say', "I knew it. I knew it the whole time."], ['b', 'say', "Then why didn't you say anything?"], ['a', 'say', "I wanted to be sure."]),
    T(['b', 'say', "Please don't hate me."], ['a', 'say', "I don't hate you. I just needed to know."]),
  ]),
  ...F('visit.talk2.truth', [
    T(['a', 'say', "Your secret is safe with me."], ['b', 'say', "Really? You'd do that?"], ['a', 'say', "You were good to me. That's what counts."]),
    T(['b', 'say', "What happens now?"], ['a', 'say', "Now you go win it. As whoever you want."]),
    T(['a', 'say', "The person behind the profile is better than the profile."], ['b', 'say', "That's the nicest thing anybody's said to me in here."]),
    T(['b', 'say', "Are you going to tell everybody in your video?"], ['a', 'say', "No. That's not mine to tell."]),
    T(['a', 'say', "I came here for the truth. I got a friend."], ['b', 'say', "You did. I promise you did."]),
  ]),
  ...F('visit.talk.apology', [
    T(['a', 'say', "I came here to say I'm sorry. I mean it."], ['b', 'say', "Thank you. I didn't expect that."]),
    T(['a', 'say', "I wasn't always fair to you. I know that."], ['b', 'say', "It's okay. It's a hard game."]),
    T(['a', 'say', "You deserved better from me."], ['b', 'say', "Maybe. But you're here now. That matters."]),
    T(['a', 'say', "I used you a little. I'm not proud of it."], ['b', 'say', "I kind of knew. I'm glad you said it."]),
    T(['a', 'say', "I couldn't leave without apologizing."], ['b', 'say', "That takes guts. Thank you."]),
  ]),
  ...F('visit.talk2.apology', [
    T(['b', 'say', "We're okay. Really."], ['a', 'say', "Are you sure?"], ['b', 'say', "I'm sure."]),
    T(['a', 'say', "If I could do it again, I'd do it differently."], ['b', 'say', "I believe you."]),
    T(['b', 'say', "I'm glad you came. I would have wondered."], ['a', 'say', "Now you don't have to."]),
    T(['a', 'say', "Can we start over? Outside of here?"], ['b', 'say', "I'd like that."]),
  ]),
  ...F('visit.talk.family', [
    T(['a', 'say', "I'm so proud of you. You know that, right?"], ['b', 'say', "Stop. You'll make me cry."], ['a', 'say', "Good. Cry. It's allowed."]),
    T(['b', 'say', "I can't believe they got you."], ['a', 'say', "It's okay. You're the one that matters now."]),
    T(['a', 'say', "Remember who you are in there."], ['b', 'say', "I will. I promise."]),
    T(['b', 'say', "Do you think I can actually win?"], ['a', 'say', "I know you can. I've always known."]),
    T(['a', 'say', "Everybody back home is going to be watching you now."], ['b', 'say', "No pressure, then."], ['a', 'say', "Just a little."]),
  ]),
  ...F('visit.talk2.family', [
    T(['b', 'say', "Tell everybody I love them."], ['a', 'say', "You can tell them yourself. When you win."]),
    T(['a', 'say', "Eat something real. Not just cereal."], ['b', 'say', "How did you know about the cereal?"]),
    T(['b', 'say', "It's going to be lonely without you."], ['a', 'say', "You're not alone. I'm right outside. Sort of."]),
    T(['a', 'say', "Trust your gut. It's a good gut."], ['b', 'say', "I got it from you."]),
    T(['b', 'say', "I'll win this for both of us."], ['a', 'say', "That's all I wanted to hear."]),
  ]),
  ...F('visit.talk.power', [
    T(['a', 'say', "I've got something for you. And it's a big deal."], ['b', 'say', "What do you mean? What is it?"]),
    T(['a', 'say', "Before I go, I'm giving you a little help."], ['b', 'say', "Help? What kind of help?"]),
    T(['a', 'say', "The Circle let me pass something on. It's yours."], ['b', 'say', "Wait. Are you serious?"]),
    T(['a', 'say', "You're the only one I'd trust with this."], ['b', 'say', "Trust me with what?"]),
    T(['a', 'say', "I'm out. But I'm not leaving you with nothing."], ['b', 'say', "What are you talking about?"]),
  ]),
  ...F('visit.talk2.power', [
    T(['b', 'say', "I won't waste it. I promise."], ['a', 'say', "I know you won't. That's why it's yours."]),
    T(['a', 'say', "Don't tell anybody where it came from."], ['b', 'say', "My lips are sealed."]),
    T(['b', 'say', "This changes everything."], ['a', 'say', "That's the idea."]),
    T(['a', 'say', "Make them regret blocking me."], ['b', 'say', "Oh, they will."]),
    T(['b', 'say', "I don't know how to thank you."], ['a', 'say', "Win. That's how."]),
  ]),
  ...F('visit.kiss', [
    B(T(['a', 'say', "Can I kiss you? Is that okay?"], ['b', 'say', "I was hoping you'd ask."]), '{a} and {b} kiss, and for a second nobody is playing a game.'),
    B(T(['b', 'say', "This is so cheesy."], ['a', 'say', "Then let's be cheesy."]), '{a} leans in and kisses {b}.'),
    B(T(['a', 'say', "I've wanted to do this since day two."], ['b', 'say', "Day two? I was day one."]), 'They kiss, laughing in the middle of it.'),
    B(T(['b', 'say', "Come here."], ['a', 'say', "Gladly."]), '{a} and {b} kiss by the door.'),
    B(T(['a', 'say', "Okay. Before I lose my nerve."], ['b', 'say', "Don't lose it."]), '{a} kisses {b}, quick and then not so quick.'),
    B(T(['b', 'say', "So we're doing this?"], ['a', 'say', "We're doing this."]), '{a} and {b} kiss, and the camera very politely stays wide.'),
    B(T(['a', 'say', "One kiss. For the road."], ['b', 'say', "Just one?"]), 'It is not just one.'),
    B(T(['b', 'say', "I'm going to kiss you now."], ['a', 'say', "Okay. Yes. Please."]), '{a} and {b} kiss in the middle of the living room.'),
  ]),
  ...F('visit.hand', [
    T(['a', 'say', "Before I go: be careful with {c}."], ['b', 'say', "Why {c}?"], ['a', 'say', "Something about {c} never added up for me."]),
    T(['a', 'say', "Watch {c}. I don't think {c} is who {c} says."], ['b', 'say', "I've had the same feeling."]),
    T(['a', 'say', "Do me a favor and keep an eye on {c}."], ['b', 'say', "I will. Thank you for telling me."]),
    T(['a', 'say', "If anybody in there is fake, it's {c}."], ['b', 'say', "You really think so?"], ['a', 'say', "I'd bet on it."]),
    T(['a', 'say', "Don't tell {c} anything you don't want everybody to know."], ['b', 'say', "Noted. Seriously, thank you."]),
    T(['a', 'say', "One warning, then I'm gone. {c}."], ['b', 'say', "Okay. I'll be careful."]),
  ]),
  ...F('visit.power.immunity', [
    T(['a', 'say', "You're safe at the next blocking. Nobody can touch you."], ['b', 'react', "What? You'd do that for me?"]),
    B(T(['a', 'say', "The Circle gave me something to pass on. You're safe at the next blocking."], ['b', 'react', "I'm safe? I'm actually safe?"]), '{b} throws {b.posAdj} arms around {a}.'),
    T(['a', 'say', "Next blocking, you can't go home. Whatever happens."], ['b', 'react', "I don't even know what to say."]),
    T(['a', 'say', "I can't stay. But I can keep you safe for one more night."], ['b', 'react', "That's the best gift anybody's ever given me."]),
    T(['a', 'say', "You're safe next time. Use the night well."], ['b', 'react', "I owe you. I owe you so much."]),
  ]),
  ...F('visit.power.hacker', [
    T(['a', 'say', "You're the Hacker. Tomorrow you take over somebody's profile for one chat."], ['b', 'react', "Anybody? I can be anybody?"]),
    B(T(['a', 'say', "Pick a profile, slide into one chat as them, say whatever you want."], ['b', 'react', "Oh, this is dangerous. I love it."]), "{b}'s eyes go wide."),
    T(['a', 'say', "One chat as somebody else. Nobody will know it's you until it's done."], ['b', 'react', "I already know who I'm hacking."]),
    T(['a', 'say', "Use it to find out what they really think."], ['b', 'react', "That is so evil. Thank you."]),
    T(['a', 'say', "The Circle tells everybody afterwards. So make it count."], ['b', 'react', "Oh, I'll make it count."]),
  ]),
  ...F('visit.power.burner', [
    T(['a', 'say', "Here's a second profile. It's yours to play, and it gets its own vote."], ['b', 'react', "Two votes? That's a lot of power."]),
    B(T(['a', 'say', "Play it alongside yours. Just don't let anybody catch you."], ['b', 'react', "A secret second me. Okay. Wow."]), '{b} looks at the second login like it might explode.'),
    T(['a', 'say', "Two ratings with two votes. Use them wisely."], ['b', 'react', "I've never been this nervous about a gift."]),
    T(['a', 'say', "If anybody figures it out, it's gone. So be careful."], ['b', 'react', "Careful is my middle name now."]),
    T(['a', 'say', "Make the burner sound nothing like you."], ['b', 'react', "Oh, I'm going to have fun with this."]),
  ]),
  ...F('visit.power.joker', [
    T(['a', 'say', "You're the Joker. A secret profile, and you get to pick an Influencer."], ['b', 'react', "I pick an Influencer? Me?"]),
    B(T(['a', 'say', "You meet the new players first, and nobody knows it's you."], ['b', 'react', "A secret identity. I'm so in."]), '{b} sits down hard on the couch.'),
    T(['a', 'say', "At the next ratings, you name one of the Influencers. Choose well."], ['b', 'react', "That's a lot of power. Okay."]),
    T(['a', 'say', "The room knows a Joker exists. They just won't know it's you."], ['b', 'react', "Then I'd better be very good at hiding."]),
    T(['a', 'say', "Play it quiet. The Joker wins by being forgotten."], ['b', 'react', "Quiet. Got it. So quiet."]),
  ]),

  // ── the goodbye video, with nobody to call out ───────────────────────
  ...F('goodbye.video.lesson', [
    { turns: [{ by: 'a', video: "I learned you can make real friends through a screen. I didn't believe that before." }, { by: 'a', video: "So thank you. All of you." }] },
    { turns: [{ by: 'a', video: "Play with your heart. It didn't win me the game, but I'm proud of how I played." }, { by: 'a', video: "Remember that when it gets hard." }] },
    { turns: [{ by: 'a', video: "If I did it again, I'd trust my gut sooner. That's the lesson." }, { by: 'a', video: "Take that from somebody who learned it the hard way." }] },
    { turns: [{ by: 'a', video: "Be kind in there. It's a game, but the people are real." }, { by: 'a', video: "Some of you are going to be friends for life." }] },
    { turns: [{ by: 'a', video: "I came in scared to be myself. I'm leaving glad I was." }, { by: 'a', video: "Every single one of you helped with that." }] },
    { turns: [{ by: 'a', video: "Don't take it too seriously. I did, and look where I am." }, { by: 'a', video: "Have fun with it. Seriously." }] },
    { turns: [{ by: 'a', video: "No hard feelings. Whoever blocked me, you played the game. I get it." }, { by: 'a', video: "I'd have done the same thing." }] },
    { turns: [{ by: 'a', video: "I wish I'd talked to more of you. Talk to everybody. That's my advice." }, { by: 'a', video: "You never know who you'll miss." }] },
    { turns: [{ by: 'a', video: "I'm going home with friends I never would have met. That's a win to me." }, { by: 'a', video: "I wouldn't trade that for anything." }] },
    { turns: [{ by: 'a', video: "Honestly? I loved every minute. Even the scary ones." }, { by: 'a', video: "I'm going to miss this place." }] },
  ]),

  // ── the in-person blocking ────────────────────────────────────────────
  ...F('visit.inperson.bye', [
    T(['a', 'say', "I'm sorry it had to be like this."], ['b', 'say', "At least you said it to my face."]),
    B(T(['a', 'say', "I'll go. I just couldn't send a message."], ['b', 'say', "I respect that. I don't like it, but I respect it."]), '{a} pauses at the door before leaving.'),
    T(['a', 'say', "I hope you understand one day."], ['b', 'say', "Maybe one day. Not today."]),
    T(['a', 'say', "You were great in there. I mean that."], ['b', 'say', "Then why me?"], ['a', 'say', "Because you were great in there."]),
    T(['a', 'say', "Okay. I'm going. I'm so sorry."], ['b', 'say', "Go. Make it worth it."]),
    B(T(['a', 'say', "That was the hardest knock of my life."], ['b', 'say', "It was a hard one to answer, too."]), 'The door closes quietly behind {a}.'),
  ]),
  ...F('visit.inperson.after', [
    S("{b} knocked on my door to block me. At least {b} was brave about it.", '{a} sits back down on the couch, slowly.'),
    S("I opened the door thinking it was a friend. It was a goodbye."),
    S("That's a face I'm never going to forget.", '{a} stares at the closed door.'),
    S("{b} looked me in the eye. I'll give {b} that."),
    S("Of all the ways to go home. Okay."),
    S("I'm not even mad. Okay, I'm a little mad.", '{a} paces the length of the apartment.'),
  ]),

  // ── when a visit turns into an argument ───────────────────────────────
  ...F('visit.bye.cooled', [
    B(T(['a', 'say', "Okay. I'm still angry. But I get it."], ['b', 'say', "That's more than I deserved."]), '{a} gives {b} a short, stiff hug.'),
    T(['b', 'say', "Are we good?"], ['a', 'say', "We're getting there. Slowly."]),
    T(['a', 'say', "I came here to yell. I'm leaving a little calmer."], ['b', 'say', "I'll take a little calmer."]),
    B(T(['b', 'say', "Thank you for hearing me out."], ['a', 'say', "Thank you for not hiding."]), '{a} nods once and walks out.'),
    T(['a', 'say', "Win it, then. Make it worth sending me home."], ['b', 'say', "I'll try. I really will."]),
  ]),
  ...F('visit.bye.walkout', [
    B(T(['a', 'say', "I've heard enough."]), '{a} walks out and lets the door swing shut.'),
    T(['b', 'say', "Wait. Can we at least...?"], ['a', 'say', "No. Goodbye."]),
    B(T(['a', 'say', "Good luck. You'll need it more than I did."]), 'The door slams, and the apartment goes very quiet.'),
    T(['b', 'say', "I'm sorry. I really am."], ['a', 'say', "Say it to the next person you block."]),
    B(T(['a', 'say', "Enjoy the game. I hope it's worth it."]), '{a} leaves without looking back.'),
  ]),
  ...F('visit.after.confront', [
    S("Okay. That was intense. I need to sit down.", '{a} drops onto the couch.'),
    S("{b} had a lot to say. Some of it was fair. Most of it wasn't."),
    S("My heart is still racing. That was a real fight."),
    S("I did what I had to do. {b} just didn't like hearing it.", '{a} stares at the door for a long time.'),
    S("{b} is going to tell everybody about this in that video. I just know it."),
  ]),
};
