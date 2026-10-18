// ══════════════════════════════════════════════════════════════════════
// longer/house.js — house life: blow-ups, homesickness, the vets and the rookies, joining a group
// ══════════════════════════════════════════════════════════════════════
//
// Two people each (a starts it). A kitchen blow-up is never about the eggs; the
// homesick one gets somebody who sits and listens; a vet talks down and a rookie
// talks back. Nothing claims a fact the scene does not have (who has been in the
// Arena, who won what).
export default {
  // ── a kitchen blow-up ──
  'kb.1': [0, 1, 2, 3,
    { by: 'a', say: "Don't tell me how to feel about it. You do this all the time." },
    { by: 'b', say: "All the time? Name one other time." },
    { by: 'a', say: "You leave your plates in the sink, you finish things and never say anything, and you never ask." },
    { by: 'b', say: "Then say something the first time instead of saving it all up for one big speech." },
    { by: 'a', say: "I'm saying it now." },
    { beat: '{b} drops the plate in the sink, loudly, and walks out.' },
    4],
  'kb.2': [0, 1, 2, 3, 4,
    { by: 'b', say: "Then clean it yourself if it bothers you that much." },
    { by: 'a', say: "I've been cleaning it. That's the problem. I'm the only one who does." },
    { by: 'b', say: "Nobody asked you to." },
    5,
    { by: 'a', conf: "Forget the dishes. {b} acts like the rest of us are staff." },
    { by: 'b', conf: "{a} has been looking for a reason to yell at me. The dishes were just the first thing {a.sub} found." }],
  'kb.3': [0, 1, 2,
    { by: 'b', say: "Is your name on it?" },
    { by: 'a', say: "No, but everybody knows that's my cup. You know it's my cup." },
    { by: 'b', say: "Okay. Here. Take your cup." },
    { beat: '{b} hands it back, still half full.' },
    { by: 'a', say: "You could have just used another one." },
    3],

  // ── homesick, and somebody comes ──
  'hs.c1': [0, 1, 2,
    { by: 'b', say: "Who do you miss the most?" },
    { by: 'a', say: "Everybody. Just being able to call somebody when I've had a bad day." },
    3,
    { by: 'a', say: "I know. I just don't know how to feel okay in here." },
    { by: 'b', say: "You don't have to feel okay. You just have to get to tomorrow." },
    { beat: 'They sit there for a long time without saying anything else.' },
    4],
  'hs.c2': [
    { beat: '{b} finds {a} crying and sits down without asking.' },
    0, 1, 2,
    { by: 'b', say: "What would you say if you could call home right now?" },
    { by: 'a', say: "That I'm okay. That I miss them. That I'm trying." },
    { by: 'b', say: "Then that's what you're doing. You're trying. That counts." },
    { by: 'a', say: "Thank you. Really." },
    3],
  'hs.c3': [0, 1,
    { beat: '{a} and {b} walk without talking for a while.' },
    { by: 'a', say: "I almost asked to go home today." },
    { by: 'b', say: "What stopped you?" },
    { by: 'a', say: "I don't know. I kept thinking I'd regret it the second I got on the plane." },
    { by: 'b', say: "You would. I know you would." },
    2],
  // ── homesick, alone ──
  'hs.a1': [
    { beat: '{a} is lying on a bunk with the lights off, wide awake.' },
    0,
    { by: 'a', conf: "I'm not going to quit. I just need people to know this is harder than it looks." }],
  'hs.a2': [0, 1,
    { by: 'a', conf: "If I can make it to the next daily, I can make it to the one after that. That's how I'm doing this." }],
  'hs.a3': [
    { beat: '{a} eats alone while everybody else talks.' },
    0],

  // ── joining a group ──
  'ag.1': [0, 1, 2,
    { by: 'b', say: "Who decided? Was it everybody, or just you?" },
    { by: 'a', say: "Everybody. We all talked about it." },
    { by: 'b', say: "And what do I have to do?" },
    { by: 'a', say: "Vote with us. Tell us what you hear. And don't make deals with anybody else without telling us first." },
    { by: 'b', say: "Okay. I can do that." },
    3],
  'ag.2': [0, 1, 2,
    { by: 'b', say: "Does everybody know? I don't want to walk in and have half of them surprised." },
    { by: 'a', say: "Everybody knows. Everybody said yes." },
    { by: 'b', say: "Okay. Then I'm in. And I'm not going to be the one who leaks anything." },
    { by: 'a', say: "I know. That's why we asked you." },
    3],
  'ag.3': [
    { by: 'a', say: "I talked to everybody. We want you in {alliance}." },
    { by: 'b', say: "Really? Okay. Yes." },
    { by: 'a', say: "Good. Keep your head down for a couple of days. Let people get used to it." },
    { by: 'b', say: "I can do that." },
    0],

  // ── a vet talks down to a rookie ──
  'vd.1': [0, 1,
    { by: 'a', say: "I'm serious. I've seen a lot of people like you come through here. Most of them don't last." },
    { by: 'b', say: "People like me? You don't even know me." },
    { by: 'a', say: "I know enough. Everybody's tough until their name gets called." },
    { by: 'b', say: "Then we'll see who's still here at the end." },
    2],
  'vd.2': [0, 1,
    { by: 'a', say: "Okay. Thinking for yourself is how rookies end up in the Arena." },
    { by: 'b', say: "Or it's how a vet ends up getting blindsided by a rookie." },
    { by: 'a', say: "Good luck with that." },
    { by: 'b', conf: "{a} wants the rookies to sit quietly and vote however the vets tell us. That's not happening." },
    { by: 'a', conf: "{b} has a lot of confidence for somebody who's never done this before. We'll see how long it lasts." }],
  'vd.3': [
    { by: 'a', say: "You rookies are all the same. You think the first week tells you how this works." },
    { by: 'b', say: "And you think you already know how it ends." },
    { by: 'a', say: "I do. I've done this before." },
    0],
};
