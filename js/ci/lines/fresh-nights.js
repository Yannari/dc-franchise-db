// More words for the nights and the end of the season: the Ratings, the
// Hangout, the blocking, the visit, the goodbye video, newcomers and the
// finale (the user, 2026-10-20: "yes write the remaining 749 lines"). Data
// only; each list joins the pool of the same key. Ratings lines claim no
// standing: they can air on the first night.
//
//   rate.*                a, out loud, placing b; callback.good: for what b did in {game}
//   ratings.* / result.*  the alert, the wait, the results; the two Influencers
//   hangout.*             the Influencers open the Hangout; weigh up c
//   block.*               the message's clue and its name ({c}); typing, dots,
//                         relief, after
//   visit.*               a catfish dreading a knock from b; b lets a in; goodbye
//   goodbye.*             before b's video, b on video, the room after
//   arrival*              a newcomer (a); the alert; a hoping to befriend b,
//                         falling for b or worried
//   welcome.warm          a welcomes b
//   aside.*               a, alone, after a chat with b (schemer: pleased with
//                         the angle; sweet: fond)
//   style.mismatch.suspicious  a thinks b doesn't type like b looks
//   final.* / meet.*      the finale: the last morning, the last ratings, leaving
//                         the apartment; meeting in person; a catfish forgiven
const F = (key, list) => ({ [key]: list.map((x, i) => ({ id: `${key}.f3${String(i + 1).padStart(2, '0')}`, ...x })) });
const S = (text, beat) => ({ turns: [{ by: 'a', say: text }], ...(beat ? { beat } : {}) });
const R = (text, beat) => ({ turns: [{ by: 'a', react: text }], ...(beat ? { beat } : {}) });
const V = text => ({ turns: [{ by: 'a', video: text }] });
const M = (text, beat) => ({ turns: [{ by: 'a', send: text }], ...(beat ? { beat } : {}) });
const T = (...turns) => ({ turns: turns.map(([by, kind, text, more]) => ({ by, [kind]: text, ...(more || {}) })) });
const B = (x, beat) => ({ ...x, beat });

export const FRESH_NIGHTS = {
  // ── the Ratings ───────────────────────────────────────────────────────
  ...F('rate.affection.top', [
    S("{b} goes first. {b} makes this whole place feel smaller in the best way."),
    S("First place: {b}. Every chat with {b} is the best part of my day."),
    S("{b}, number one. I don't even have to think about it."),
    S("Circle, put {b} first. {b} is real, and real is rare in here."),
    S("{b} first. We've laughed more than I thought anyone could in a place like this."),
    S("Top of my list is {b}. I'd trust {b} with my life. Or at least my ratings."),
    S("{b} gets first place. {b} was kind to me before anybody else was."),
    S("First is {b}. I want {b} in the final with me."),
    S("{b}. First. I'll fight anybody who disagrees."),
    S("My first goes to {b}. Loyalty, all the way."),
    S("{b}, you're first. You've earned it every single day."),
    S("First place is {b}, and it was never close."),
    S("Circle, first: {b}. {b} always checks on me."),
    S("{b} in first. Talking to {b} feels like talking to a friend from home."),
    S("{b} goes up top. I'm not hiding it anymore."),
    S("First position is {b}. {b} has never once made me feel small."),
    S("{b}, first. Thank you for being my person in here."),
    S("Number one. {b}. Easy."),
    S("I'm putting {b} first because {b} put me first. I know it."),
    S("{b} at the top. Heart says {b}, head says {b}. Done."),
    S("First place to {b}. I want {b} to see that and smile."),
    S("{b} first. We'd be best friends outside of here."),
    S("Circle, top spot: {b}. That one's from the heart."),
    S("{b}, number one. You make me laugh even on the bad days."),
    S("First is {b}. Somebody I actually trust. Imagine that."),
    S("{b} goes first, and I'll say it to {b}'s face someday."),
    S("My number one is {b}. No strategy. Just love."),
    S("{b} tops my list. We've had each other's backs since day one."),
    S("First spot for {b}. Everybody needs a {b} in here."),
    S("Circle, put {b} at the top. I mean it."),
    S("{b} first. I don't have to explain that one."),
    S("{b}, you're my first. Always."),
    S("First place goes to {b}, my favorite person to talk to in here."),
  ]),
  ...F('rate.affection.bottom', [
    S("{b}, last. We just haven't connected."),
    S("Last place goes to {b}. I barely know {b}."),
    S("{b} at the bottom. Talk to me more and that changes."),
    S("I'm sorry, {b}. Last. It's about what I know."),
    S("{b}, last. Our chats never went anywhere."),
    S("Bottom spot is {b}. Nothing personal. Just nothing yet."),
  ]),
  ...F('rate.threat.bottom', [
    S("{b}, last. You're too good at this, and I'm scared of it."),
    S("{b} goes at the bottom. Too many friends, too much power."),
    S("Last place: {b}. I like {b}. That's the problem."),
    S("{b}, bottom. If I don't do it now, it'll be too late."),
  ]),
  ...F('rate.middle', [
    S("{b} in the middle. Still getting to know {b}."),
    S("Middle spot, {b}. That could go either way next time."),
  ]),
  ...F('rate.callback.good', [
    S("And {b} looked out for me in {game}. That counts."),
    S("{b} was good to me in {game}. I haven't forgotten."),
    S("After {game}, {b} was always going up high."),
  ]),
  ...F('ratings.open', [
    T(['a', 'react', "'It's time for the Ratings.' Already? Okay."], ['a', 'say', "Think. Who's been real with me?"]),
    T(['a', 'react', "'You must rank your fellow Players from favorite to least favorite.' The worst part of the day."]),
    T(['a', 'react', "The Ratings. Okay. Nobody talk to me."], ['a', 'say', "Top is easy. Bottom is the problem."]),
  ]),
  ...F('ratings.wait', [
    R("Please let it be good. Please."),
    R("I can't breathe until I see it."),
    R("Okay, Circle. I'm ready. I'm so not ready."),
    R("Whatever it says, I'll be okay. I'll be okay.", '{a} grips the edge of the couch.'),
    R("This waiting is the worst part. The absolute worst."),
    R("Come on, come on. Show me."),
    R("My heart is pounding. Is that normal? That's normal."),
  ]),
  ...F('result.top', [
    R("High up! People like me!"),
  ]),
  ...F('result.bottom', [
    R("The bottom. I didn't think it would be me."),
    T(['a', 'react', "Down there? Okay."], ['a', 'say', "Tomorrow I fight. Tonight I sulk."]),
  ]),
  ...F('result.influencers', [
    T(['a', 'react', "Me? I'm an Influencer?"], ['b', 'react', "And me? Oh no. Oh, this is serious."]),
    B(T(['a', 'react', "We did it! Wait. Now we have to block somebody."], ['b', 'react', "I know. I feel sick."]), 'Two apartments, one scream, one long silence.'),
  ]),

  // ── the Hangout ───────────────────────────────────────────────────────
  ...F('hangout.open', [
    T(['a', 'send', "Hi. So. We're the ones deciding"], ['b', 'send', "I hate it already. Let's talk"]),
    T(['a', 'send', "Okay partner. Let's be honest with each other in here"], ['b', 'send', "Totally honest. Nothing leaves this chat"]),
  ]),
  ...F('hangout.view.threat.cut', [
    M("I keep coming back to {c}. Too strong to leave alone"),
    M("{c} has everybody on side. That's the problem"),
    M("If we don't take {c} out now, we never will"),
    M("{c} is the biggest threat in this building. I hate saying it"),
    M("Everybody I talk to loves {c}. That scares me"),
    M("{c} would block us without blinking. I'm sure of it"),
    M("Honestly? I think {c} could win this whole thing"),
    M("{c} knows too much. About everybody"),
    M("We'll regret it if we leave {c} in. I can feel it"),
    M("{c} plays the nicest game in here, and it's working too well"),
    M("Strategically, it's {c}. My heart says no. My head says {c}"),
  ]),
  ...F('hangout.view.noBond.keep', [
    M("I don't see a reason to block {c}. Not tonight"),
  ]),

  // ── the blocking ──────────────────────────────────────────────────────
  ...F('block.build.clue.threat', [
    M("The person we're blocking is somebody everybody likes. That's exactly why"),
    M("This is someone we think could go all the way"),
  ]),
  ...F('block.announce.threat', [
    M("This person is a huge threat, and we'd never beat them at the end. We are blocking... {c}", 'Every apartment waits on the dots.'),
    M("It's not personal. It's the game. We are blocking... {c}"),
    M("This person has a friend in every chat, and that's the problem. We are blocking... {c}"),
    M("We love this person. That's why it hurts. We are blocking... {c}", 'The dots appear, disappear, and appear again.'),
    M("Everyone in here trusts this person, and that's too much power. We are blocking... {c}"),
    M("This was the hardest name to type. We are blocking... {c}"),
    M("This person could win the whole thing. We are blocking... {c}"),
  ]),
  ...F('block.typing', [
    S("Okay. One name. Let's get this over with."),
  ]),
  ...F('block.fear.dots', [
    R("Just say the name. Just say it!"),
  ]),
  ...F('block.react.relief', [
    R("Safe! Oh, I'm sorry, {b}. I'm so sorry."),
    R("Not me. Thank God. Bye, {b}."),
    R("{b}? Wow. I really thought it was me."),
    R("I'm still here. Poor {b}."),
    R("Safe again. That was way too close."),
    R("{b} didn't deserve that. But I'm still here."),
  ]),
  ...F('block.after', [
    S("I keep thinking about {b}. I hope {b} is okay."),
    S("That's the worst part of this game. The very worst."),
    S("I need a minute. Maybe ten.", '{a} sits on the edge of the bed, staring at the floor.'),
    S("Okay. It's done. I can't take it back."),
  ]),

  // ── the visit ─────────────────────────────────────────────────────────
  ...F('visit.wait.catfish', [
    R("If {b} comes here, everything I built is gone.", '{a} sits very still on the couch.'),
    S("Please, {b}, pick anybody else.", '{a} closes {a.posAdj} eyes.'),
    R("I'm not ready for {b} to see me. I'm not ready.", '{a} pulls a hood up over {a.posAdj} head.'),
    S("{b} thinks I'm somebody else. That door would change everything.", '{a} stares at the door.'),
    R("If that's {b} in the hallway, I'm in so much trouble.", '{a} listens for footsteps.'),
    S("I'll tell {b} everything if it's me. I just hope it's not me.", '{a} rubs {a.posAdj} hands together.'),
    R("{b} is going to be so confused if that door opens.", '{a} tugs at {a.posAdj} sleeves.'),
    S("This is the moment every catfish is scared of.", '{a} paces from one end of the room to the other.'),
    R("Walk past, {b}. Please walk past.", '{a} holds {a.posAdj} breath.'),
    S("If {b} sees me, I lose more than the game. I lose a friend.", '{a} sits down on the floor.'),
    R("Okay. If it's me, I'm honest. That's the only way.", '{a} nods, then shakes {a.posAdj} head.'),
    S("I've been so careful. One knock and it's over.", '{a} glances at the profile on the screen.'),
    R("Please don't be my door. Please don't be my door.", '{a} squeezes a pillow against {a.posAdj} chest.'),
  ]),
  ...F('visit.sit', [
    T(['b', 'say', "Come in! Sit anywhere."], ['a', 'say', "I can't believe I'm actually here."], ['b', 'say', "Me neither. Hi!"]),
    T(['a', 'say', "So this is where you've been typing from."], ['b', 'say', "This is it. My little world."], ['a', 'say', "It's nice. Really nice."]),
    T(['b', 'say', "Do you want some water? Snacks? Anything?"], ['a', 'say', "Just a minute with you."], ['b', 'say', "Okay. Sit, sit."]),
    T(['a', 'say', "I only have a minute, so I'm just going to talk fast."], ['b', 'say', "Talk as fast as you want."], ['a', 'say', "Okay. Here goes."]),
  ]),
  ...F('visit.bye', [
    T(['a', 'say', "I have to go. Win this, okay?"], ['b', 'say', "For both of us."]),
    T(['b', 'say', "Thank you for coming here."], ['a', 'say', "There was nowhere else I'd go."]),
    B(T(['a', 'say', "Okay. That's my time."], ['b', 'say', "I'll see you out there."]), '{a} hugs {b} one last time and walks out.'),
    T(['a', 'say', "Don't trust everybody. Trust yourself."], ['b', 'say', "I will. Bye."]),
    T(['b', 'say', "I'm going to miss you in here."], ['a', 'say', "You won't have time. You'll be busy winning."]),
    B(T(['a', 'say', "Bye. Really, really bye."], ['b', 'say', "Bye. Go."]), 'The door clicks shut, and the apartment goes quiet.'),
    T(['a', 'say', "Okay. I'm going before I cry."], ['b', 'say', "Too late. I'm already crying."]),
  ]),

  // ── the goodbye video ─────────────────────────────────────────────────
  ...F('goodbye.guess', [
    R("Okay, {b}. Let's hear it."),
    R("I'm nervous. Why am I nervous? I'm not the one who left."),
    R("{b} is going to say something. I just know it."),
    R("Please be kind, {b}. Please."),
    R("I really want to know what {b} thought of everybody."),
    R("{b} gets the last word. This could be bad."),
    R("Okay. Here comes {b}.", '{a} sits forward on the couch.'),
    R("I hope {b} says nice things. Mostly about me."),
    R("{b} knows a lot. Too much, maybe."),
    R("This is going to be emotional. I can feel it already."),
    R("I'm ready for anything. I'm not ready for anything."),
    R("Let's see who {b} really was."),
    R("If {b} calls anybody out, it's going to be chaos."),
    R("{b}, be nice. You can be nice."),
    R("Okay, Circle. Play it."),
    R("I hope {b} isn't angry. I'd understand if {b} is."),
    R("Here it is. The truth about {b}."),
    R("{b} had a lot of friends in here. This could be sad."),
    R("I'm going to cry. I know I'm going to cry.", '{a} grabs a tissue, just in case.'),
    R("What is {b} going to say about me?"),
    R("Okay. Deep breath. Here we go."),
    R("I think {b} will be classy about it. I hope."),
  ]),
  ...F('goodbye.video.close', [
    V("Thank you all. It was a crazy ride. Good luck."),
    V("Be nice to each other in there. Bye, Circle!"),
    V("I'm going to miss this. Good luck, everybody."),
  ]),
  ...F('goodbye.warning.distrusts', [
    V("One more thing. Keep an eye on {c}."),
    V("And everybody, think twice before you trust {c}."),
  ]),
  ...F('goodbye.react.surprised', [
    R("Wow. I didn't expect that at all."),
    R("{b} was so sweet about it."),
    R("That was so honest. I respect it."),
    R("Okay, that got me a little."),
    R("{b} went out with so much class."),
    R("I'm going to miss {b}. I really am."),
    R("That was not what I thought {b} would say."),
    R("Wow. {b} meant every word of that."),
    R("That was emotional. Give me a minute."),
    R("{b} just made everybody in this building think."),
    R("That was so {b}. Perfectly {b}."),
    R("I'm not crying. Okay, I'm crying."),
    R("Classy, {b}. Really classy."),
    R("That video is going to change things in here."),
  ]),
  ...F('goodbye.react.guilty', [
    R("I did that. I sent {b} home. Oof."),
    R("{b} was so nice. That makes it so much worse."),
    R("I'm sorry, {b}. It was the game."),
  ]),
  ...F('goodbye.react.warned', [
    R("Me? Why me? What did I do?"),
    R("Great. Now everybody's going to look at me."),
    R("{b}, that was so unfair."),
  ]),

  // ── newcomers ─────────────────────────────────────────────────────────
  ...F('arrival', [
    S("Okay. New face, fresh start. Let's go."),
  ]),
  ...F('arrival.alert', [
    R("A new Player! Here we go again.", 'Every screen in the building lights up.'),
  ]),
  ...F('arrival.react.ally', [
    S("{b} doesn't have friends yet. I can be the first."),
    R("A new face! I'm messaging {b} before anybody else does."),
    S("{b} hasn't picked a side. My side looks good, {b}."),
    R("Fresh start in the building. Hi, {b}!"),
    S("If I get to {b} first, I've got a new ally."),
    R("Ooh, {b}! I'm being so nice to {b}."),
    S("{b} is going to need somebody in here. Why not me?"),
  ]),
  ...F('arrival.react.crush', [
    R("Oh, hello, {b}. Welcome. Please stay."),
    S("{b} just changed my whole week."),
  ]),
  ...F('arrival.react.worried', [
    R("Another new Player? I'm still at the bottom!"),
    S("Everybody's going to love the new one. Great."),
  ]),
  ...F('welcome.warm', [
    T(['a', 'send', "Welcome, {b}! So happy you're here"], ['b', 'send', "Thank you so much! I'm so nervous"], ['a', 'send', "You'll be great. I promise"]),
    T(['a', 'send', "Hi {b}! Anything you need, just ask"], ['b', 'send', "You're so sweet! Thank you"]),
    T(['a', 'send', "{b}! Welcome to the Circle!"], ['b', 'send', "Hi! I'm so glad somebody said hi"]),
    T(['a', 'send', "Welcome, {b}. It's a lot at first. You'll love it"], ['b', 'send', "I already kind of do"]),
    T(['a', 'send', "Hey {b}! I wanted to be one of the first to say hi"], ['b', 'send', "You are! Hi!"]),
  ]),

  // ── alone after a chat ────────────────────────────────────────────────
  ...F('aside.schemer.warm', [
    S("{b} is on my side now. Easy."),
    S("That went exactly the way I wanted it to."),
    S("{b} likes me. That's going to be useful."),
    S("One more friend, one more vote. Good chat."),
    S("{b} has no idea how well that went for me."),
    S("Keep {b} close. That's the plan, and it's working."),
    S("I didn't even have to try. {b} came right to me."),
    S("{b} trusts me. I'll take that. I'll use that."),
  ]),
  ...F('aside.sweet.warm', [
    S("{b} is genuinely lovely. I'm lucky."),
    S("I didn't expect to make a real friend in here. Then {b}."),
    S("That chat with {b} was the best part of today."),
    S("I hope {b} knows how much I mean it."),
  ]),
  ...F('style.mismatch.suspicious', [
    R("{b} types like a totally different person than that photo."),
    S("The way {b} talks doesn't match the pictures. At all."),
    R("Something about {b}'s messages feels off. I can't say what."),
    S("{b}'s profile and {b}'s typing are two different people."),
    R("Hm. {b} doesn't sound like {b} looks."),
  ]),

  // ── the finale ────────────────────────────────────────────────────────
  ...F('final.morning.friend', [
    S("I made it to the final because of {b}. I'll never forget that."),
    S("Last morning. The first thing I want to do is hug {b}."),
    S("{b} was there for me from the very start. Thank you, {b}."),
    S("Whatever happens today, {b} is my friend for life."),
    S("I couldn't have done this without {b}. I really couldn't."),
    S("I hope {b} knows how much those chats meant to me.", '{a} smiles at the screen for a long moment.'),
    S("Day one, I didn't know anybody. Now I have {b}."),
    S("{b} and me in the final. I still can't believe it."),
    S("The best thing I'm taking home from here is {b}."),
  ]),
  ...F('final.rate.middle', [
    S("{b} in the middle. You were a huge part of my game."),
    S("Middle spot to {b}. There's nothing but love here."),
    S("{b}, the middle. That was the hardest place to put anybody."),
    S("{b} lands in the middle. You deserve so much more."),
    S("Middle for {b}. Thank you for everything."),
    S("{b}, middle. I'll explain when we meet. You'll understand."),
    S("I'm putting {b} in the middle, and it hurts a little."),
    S("{b} in the middle. No place feels right for you, honestly."),
    S("Middle spot goes to {b}. You played this beautifully."),
  ]),
  ...F('final.leave', [
    S("Goodbye, apartment. You were weird, and I loved you.", '{a} looks around one last time.'),
    S("This couch knows all my secrets. Goodbye, couch.", '{a} pats the couch on the way out.'),
    S("I can't believe it's over. I really can't.", '{a} turns off the lights, one by one.'),
    S("Circle, thank you. For all of it.", '{a} switches off the screen.'),
    S("Okay. Deep breath. Let's go meet everybody.", '{a} grabs a jacket and opens the door.'),
    S("I came in alone. I'm leaving with a lot of friends.", '{a} takes one last look and closes the door.'),
    S("Bye, Circle. Bye, apartment. Bye, everything.", '{a} waves at the empty room.'),
  ]),
  ...F('meet.react', [
    R("Oh my God. {b}! Come here!"),
    R("{b}! It's really you!"),
    R("I've been waiting so long to meet you, {b}!"),
    R("{b}! Look at you! Okay, come here!"),
    R("Finally! {b}! Hi!"),
    R("{b}, you have no idea how happy I am to see you."),
    R("Is that {b}? That's {b}!"),
  ]),
  ...F('meet.talk.catfishfriend.forgive', [
    T(['a', 'say', "So. I'm not exactly who you thought. My name is {a.real}."], ['b', 'react', "Wait. What?"], ['b', 'say', "You know what? I don't care. You were still my friend."]),
    T(['b', 'say', "You're not {a}, are you?"], ['a', 'say', "No. I'm {a.real}. But every conversation was real."], ['b', 'say', "I believe you. Come here."]),
    T(['a', 'say', "I'm so sorry I lied to you."], ['b', 'say', "You lied about a picture. You didn't lie about being kind."], ['a', 'react', "Okay, now I'm crying."]),
    T(['a', 'say', "Hi. I'm {a.real}. I was {a} the whole time."], ['b', 'react', "No way."], ['b', 'say', "That's wild. And you're still my person."]),
    T(['b', 'say', "I knew something was off. I didn't care."], ['a', 'say', "You knew?"], ['b', 'say', "I knew you were a good friend. That's all that mattered."]),
    T(['a', 'say', "Please don't hate me."], ['b', 'say', "Hate you? You got me through the hardest days in there."], ['a', 'react', "Thank you. Thank you so much."]),
  ]),
};
