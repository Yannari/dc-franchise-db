// ══════════════════════════════════════════════════════════════════════
// td/story/lines/n-long2.js — full scenes for the moments that only had sketches
// ══════════════════════════════════════════════════════════════════════
// The long versions of engine moments (td/script/lines headers have the meanings; same roles,
// same endings). Each opens on where they are and what they're doing, and ends on what changed.
// Ids: 'nlx.'.

export default {
  // a keeps going against the odds; b sees it
  'long.life.underdog.driven': [
    { id: 'nlx.u1', turns: [
      { beat: "Long after everyone else has gone back to the {quarters}, {a} is still at the challenge course, running the same balance beam again and again." },
      { by: 'b', say: "You know the challenge is over, right?" },
      { by: 'a', say: "I know. I fell off this thing three times today. I'm not falling off it again." },
      { by: 'b', say: "It's getting dark." },
      { by: 'a', say: "Then I'll do it in the dark." },
      { beat: "{b} watches for a minute, then sits down at the end of the beam to spot {a.obj}." },
      { by: 'b', conf: "Everybody here wrote {a} off on the first day. I'm starting to think that was a really big mistake." },
    ] },
  ],
  'long.life.underdog.unseen': [
    { id: 'nlx.u2', turns: [
      { beat: "{a} quietly fixes the leak in the {quarters} roof while everybody else is at the water." },
      { by: 'b', say: "Wait, did you do that?" },
      { by: 'a', say: "Somebody had to. It was dripping on your head all night." },
      { by: 'b', say: "Why didn't you tell anybody?" },
      { by: 'a', say: "Nobody asks me anything. I figured I'd just do it." },
      { by: 'b', conf: "{a} has been holding this camp together and none of us even noticed. That's either really sad or really smart. Maybe both." },
    ] },
  ],
  // a goes unnoticed, on purpose; b realises it
  'long.life.floater.any': [
    { id: 'nlx.f1', turns: [
      { by: 'b', say: "Wait, where were you during all the drama this morning?" },
      { by: 'a', say: "Getting firewood." },
      { by: 'b', say: "You're always getting firewood when something happens." },
      { by: 'a', say: "We always need firewood when something happens." },
      { by: 'b', conf: "I just realised I've never once heard {a} say a name out loud. Not once. Every fight, every plan, {a} is somewhere else, getting firewood." },
      { by: 'a', conf: "I stay quiet, and I'm fine with people thinking that means I'm not playing. It's kept my name out of every conversation so far.", v: {"anxious":"I'm quiet because I'm scared of saying the wrong thing. It just happens to also be working."} },
    ] },
  ],
  // a stands up for b, whose name keeps coming up
  'long.friend.defend.loud': [
    { id: 'nlx.d1', turns: [
      { beat: "The group around the fire is talking about {b}. {a} has heard enough." },
      { by: 'a', say: "Okay, can we stop? {b} isn't even here to defend {b.ref}." },
      { by: 'c', opt: true, say: "We're just talking." },
      { by: 'a', say: "You're talking about who should go, and you keep saying the same name. I'm saying it's not happening." },
      { beat: "The fire goes quiet." },
      { by: 'a', conf: "Maybe that just put a target on me. I don't care. {b} has done more for this team than half the people sitting at that fire." },
    ] },
  ],
  'long.friend.defend.quiet': [
    { id: 'nlx.d2', turns: [
      { by: 'a', say: "Hey. I heard your name come up again today." },
      { by: 'b', say: "Great. From who?" },
      { by: 'a', say: "Doesn't matter. I told them you're not an easy vote, and I meant it." },
      { by: 'b', say: "You didn't have to do that." },
      { by: 'a', say: "I know I didn't. I wanted to." },
      { by: 'b', conf: "{a} stuck up for me when I wasn't even there. Nobody's done that for me in this game, or honestly, out of it." },
    ] },
  ],
  'long.friend.defend.surprise': [
    { id: 'nlx.d3', turns: [
      { by: 'b', say: "Why did you stick up for me back there? We barely talk." },
      { by: 'a', say: "Because what they were saying wasn't true." },
      { by: 'b', say: "That's it?" },
      { by: 'a', say: "That's it. I don't like people getting piled on." },
      { by: 'b', conf: "Out of everybody here, {a} was the last person I expected to have my back. Now I don't know what to do with that." },
    ] },
  ],
  // a starts a celebration; b and c join in
  'long.friend.celebrate.any': [
    { id: 'nlx.c1', turns: [
      { beat: "{a} grabs two sticks and starts drumming on a log." },
      { by: 'a', say: "We are celebrating! We're alive, we're here, and nobody has to cook tonight!" },
      { by: 'b', say: "Somebody does have to cook tonight." },
      { by: 'a', say: "Not with that attitude! Dance with me!" },
      { by: 'c', say: "Fine. One song.", v: { goofy: "I've been waiting all week for somebody to ask!" } },
      { beat: "One song turns into five. Even the people pretending not to watch are tapping their feet." },
      { by: 'b', conf: "For one night, nobody talked about the vote. I didn't know how much I needed that." },
    ] },
  ],
  // a tells b something real about life outside
  'long.friend.secret.any': [
    { id: 'nlx.s1', turns: [
      { beat: "{a} and {b} sit on the dock after everyone else is asleep, feet in the water." },
      { by: 'a', say: "Can I tell you something I haven't told anybody here?" },
      { by: 'b', say: "Of course." },
      { by: 'a', say: "Back home, nobody really thinks I can do this. My family bet I'd be out first." },
      { by: 'b', say: "Seriously?" },
      { by: 'a', say: "Seriously. So every day I'm still here, I win the bet a little bit more." },
      { by: 'b', say: "Then you'd better keep winning." },
      { by: 'b', conf: "That's the most real thing anybody has said to me since we got here. I'm not going to forget it, and I'm definitely not using it against {a}." },
    ] },
  ],
  // a and b find their way back to each other
  'long.friend.rekindle.any': [
    { id: 'nlx.r1', turns: [
      { by: 'a', say: "Hey. Can we talk?" },
      { by: 'b', say: "We haven't really talked in days." },
      { by: 'a', say: "I know. That's kind of the point. I miss it." },
      { by: 'b', say: "I miss it too, honestly." },
      { by: 'a', say: "Whatever happened, I don't even remember why we stopped." },
      { by: 'b', say: "Me neither. Sit down." },
      { by: 'a', conf: "The game pulls people apart and you don't even notice it happening. I'm not letting it take {b} too." },
    ] },
  ],
  // a resents b's challenge wins
  'long.drama.jealous.any': [
    { id: 'nlx.j1', turns: [
      { beat: "Everybody's crowded around {b}, replaying {b.posAdj} big moment from the challenge. {a} stays at the back." },
      { by: 'c', opt: true, say: "Did you see {b} out there? Unreal." },
      { by: 'a', say: "Yeah. Amazing. Again." },
      { by: 'b', say: "What's that supposed to mean?" },
      { by: 'a', say: "Nothing. It's just funny how it's always you." },
      { by: 'a', conf: "I work just as hard as {b}. Harder, maybe. But {b} gets the moment every single time, and I get to clap." },
    ] },
  ],
  // b confronts a, who answers the engine's way
  'long.caught.face.apology': [
    { id: 'nlx.k1', turns: [
      { by: 'b', say: "We need to talk about what you did." },
      { by: 'a', say: "I know. I'm sorry. I really am." },
      { by: 'b', say: "That's it? Sorry?" },
      { by: 'a', say: "I don't have a good reason. I panicked, and I made a bad call, and you got hurt by it." },
      { by: 'b', conf: "{a} didn't make excuses, which I wasn't expecting. I don't know if that makes it better. I'm still deciding." },
    ] },
  ],
  'long.caught.face.explain': [
    { id: 'nlx.k2', turns: [
      { by: 'b', say: "Explain it to me. Why would you do that?" },
      { by: 'a', say: "Because if I hadn't, we'd both be in trouble right now, and I can show you why." },
      { by: 'b', say: "Go on, then." },
      { by: 'a', say: "Count the votes with me. Every way you count it, I did the only thing that kept us here." },
      { by: 'b', conf: "I went in angry and came out half-convinced, and that scares me. {a} is very good at this.", v: {"tough":"{a} talked me in circles. I'm still angry. I'm just angry and confused now."} },
    ] },
  ],
  'long.caught.face.refusal': [
    { id: 'nlx.k3', turns: [
      { by: 'b', say: "Are you even going to apologise?" },
      { by: 'a', say: "For playing the game? No." },
      { by: 'b', say: "Unbelievable." },
      { by: 'a', say: "You'd have done the same thing if you'd thought of it first." },
      { by: 'b', conf: "{a} looked me in the eye and refused to say sorry. Okay. At least now I know exactly who I'm dealing with." },
    ] },
  ],
  'long.caught.face.denial': [
    { id: 'nlx.k4', turns: [
      { by: 'b', say: "I know what you did." },
      { by: 'a', say: "I don't know what you're talking about." },
      { by: 'b', say: "Don't. I know." },
      { by: 'a', say: "Then whoever told you is lying to you." },
      { by: 'b', conf: "{a} is lying to my face, and doing it really well. That's somehow worse than whatever {a} did in the first place." },
    ] },
  ],
  'long.caught.face.none': [
    { id: 'nlx.k5', turns: [
      { by: 'b', say: "Nothing to say? Really?" },
      { beat: "{a} just keeps doing the dishes." },
      { by: 'b', say: "Wow. Okay." },
      { by: 'b', conf: "{a} didn't even try. Not an apology, not an excuse, nothing. That tells me everything I need to know." },
    ] },
  ],
  // a, ruthless with everyone else, promises b protection
  'long.villain.loyal.any': [
    { id: 'nlx.v1', turns: [
      { by: 'a', say: "Listen to me. Whatever happens with the rest of them, you're safe with me." },
      { by: 'b', say: "Why me?" },
      { by: 'a', say: "Because you're the only one here I actually like. Don't spread it around." },
      { by: 'b', say: "That's oddly sweet." },
      { by: 'a', say: "I'm not sweet. I'm just loyal to the right people." },
      { by: 'b', conf: "Everybody's scared of {a}, and {a} just promised to protect me. I'd rather have {a} with me than against me, that's for sure." },
    ] },
  ],
  // a, a villain, lets b (a's worst enemy) know b is next
  'long.villain.loom.any': [
    { id: 'nlx.v2', turns: [
      { beat: "{a} walks past {b} at the water pump, slows down, and smiles." },
      { by: 'a', say: "Enjoy your water." },
      { by: 'b', say: "What's that supposed to mean?" },
      { by: 'a', say: "Just that I'd enjoy everything, if I were you. While it lasts." },
      { by: 'b', conf: "I smiled back, but my heart was pounding. {a} just threatened me, really politely, and I'm not going to sleep tonight.", v: {"tough":"{a} wants me scared. I'm not going to give {a.obj} the satisfaction of seeing it.","dry":"That was the friendliest threat I've ever received. I'd almost like to frame it."} },
    ] },
  ],
  // a, a villain, says out loud who runs the camp, and b is there
  'long.villain.power.any': [
    { id: 'nlx.v3', turns: [
      { by: 'a', say: "Let's be honest, everybody here does what I say. They just pretend they came up with it." },
      { by: 'b', say: "You really think that?" },
      { by: 'a', say: "Name one vote that didn't go my way." },
      { beat: "{b} opens {b.posAdj} mouth, then closes it." },
      { by: 'a', say: "That's what I thought." },
      { by: 'b', conf: "The worst part about {a} saying that is I couldn't think of a single example. I need to change that, fast." },
    ] },
  ],
  // a, alone, is nearly sure {target} is holding a {power}
  'long.spot.power.any': [
    { id: 'nlx.p1', turns: [
      { beat: "{a} watches {target} come back to camp and tuck something deep into a bag." },
      { by: 'a', conf: "That's the second time today {target} has checked that bag when nobody was looking. I'd bet anything there's an advantage in there." },
      { by: 'a', conf: "Now I just have to decide who I tell, and whether telling anybody is worth more than keeping it to myself." },
    ] },
  ],
  // a defended b when b wasn't there; the camera hears it
  'long.loyal.defend.any': [
    { id: 'nlx.l1', turns: [
      { by: 'a', conf: "They were talking about {b} this afternoon, and I shut it down. {b} has no idea, and I'm not going to tell {b.obj}." },
      { by: 'a', conf: "That's just what you do for your people. You don't do it so they owe you. You do it because it's right.", v: { schemer: "{b} doesn't know I did it. Yet. When the time is right, {b} will find out, and {b} will owe me." } },
    ] },
  ],
};
