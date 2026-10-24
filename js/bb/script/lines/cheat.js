// ══════════════════════════════════════════════════════════════════════
// bb/script/lines/cheat.js — a showmance with somebody waiting at home
// ══════════════════════════════════════════════════════════════════════
//
// The words for bb-events/cheating.js. {home} is the partner at home said about
// the one cheating ("her husband", or their name), {myhome} the same in their
// own mouth ("my husband"), {yourhome} said to them ("your husband"), {homeword}
// the bare word ("husband") and {status} "married", "engaged" or "with someone".
// {Home}, {Myhome} and {Yourhome} open a sentence.
//
//   cheat.remorse   a is cheating on {myhome} with b; alone with it       guilt | cold
//   cheat.gossip    a and b say it out loud about c; {partner} is c's other half   scene
//   cheat.confront  a hears that b, a's showmance, is {status}            done | stays
//   cheat.endit     a ends it with b, for {myhome}                        scene

export default {
  'cheat.remorse.guilt': [
    { id: 'cht.rg1', turns: [{ by: 'a', dr: "{Myhome} is watching this. Every night I tell myself that, and every morning I sit next to {b} anyway." }] },
    { id: 'cht.rg2', turns: [{ beat: 'Lights out. {b} is asleep. {a} is lying on top of the covers, staring at the ceiling.' }, { by: 'a', dr: "I'm not this person. I didn't come in here to be this person." }] },
    { id: 'cht.rg3', turns: [{ by: 'b', say: "You've been quiet all day." }, { by: 'a', say: "I'm fine." }, { by: 'b', say: "You're not." }, { by: 'a', dr: "How do I tell {b} I'm thinking about {myhome}? While I'm holding {b}'s hand?" }] },
    { id: 'cht.rg4', turns: [{ by: 'a', dr: "I keep doing the maths on what {myhome} has seen. The cuddling. The bed. I can't stop doing it." }] },
    { id: 'cht.rg5', turns: [{ beat: '{a} sits on the bathroom floor with the door locked, knees up.' }, { by: 'a', dr: "I said vows. I'm {status}. And I let this happen in front of cameras." }] },
    { id: 'cht.rg6', turns: [{ by: 'b', say: "Come here." }, { beat: '{a} moves over, then stops halfway.' }, { by: 'a', say: "Not tonight. I'm tired." }, { by: 'a', dr: "I'm not tired. I'm ashamed." }] },
    { id: 'cht.rg7', turns: [{ by: 'a', dr: "If {myhome} did this to me, I'd be done. So what does that make me?" }] },
    { id: 'cht.rg8', turns: [{ by: 'a', dr: "In here it feels like the real world doesn't exist. Then I remember {myhome} and it hits me all at once." }] },
  ],
  'cheat.remorse.cold': [
    { id: 'cht.rc1', turns: [{ by: 'a', dr: "What happens in the house stays in the house. {Myhome} knows how this game works." }] },
    { id: 'cht.rc2', turns: [{ by: 'a', dr: "Do I feel bad? A little. Do I feel bad enough to stop? Clearly not." }] },
    { id: 'cht.rc3', turns: [{ by: 'b', say: "Do you ever think about home?" }, { by: 'a', say: "Not in here." }, { by: 'a', dr: "That's the honest answer. It's not the nice one." }] },
    { id: 'cht.rc4', turns: [{ by: 'a', dr: "I'll deal with {myhome} when I'm out. Right now {b} is my vote and my company. That's the game." }] },
    { id: 'cht.rc5', turns: [{ beat: '{a} and {b} share a blanket on the backyard couch, in full view of the cameras.' }, { by: 'a', dr: "People will judge me. People at home always do." }] },
    { id: 'cht.rc6', turns: [{ by: 'a', dr: "{Myhome} and I have been through worse than a TV show. We'll be fine. Probably." }] },
    { id: 'cht.rc7', turns: [{ by: 'b', say: "Does this bother you? Because of... you know." }, { by: 'a', say: "If it bothered me, I wouldn't be here." }] },
  ],
  'cheat.gossip.scene': [
    { id: 'cht.g1', turns: [{ beat: 'Kitchen. {a} is drying a plate. {b} leans on the counter.' }, { by: 'a', say: "Can we talk about {c} and {partner}?" }, { by: 'b', say: "I was waiting for somebody to say it." }, { by: 'a', say: "{c} is {status}. Like, actually {status}." }, { by: 'b', say: "And not acting like it." }] },
    { id: 'cht.g2', turns: [{ by: 'a', say: "Didn't {c} talk about {home} on day one?" }, { by: 'b', say: "For about twenty minutes." }, { by: 'a', say: "And now look." }, { by: 'b', dr: "I'd hate to be {home}, watching this from the sofa." }] },
    { id: 'cht.g3', turns: [{ by: 'b', say: "Is it just me, or is {c} way too comfortable with {partner}?" }, { by: 'a', say: "It's not just you. Everyone's seen it." }, { by: 'b', say: "{c} has {home} waiting at home." }, { by: 'a', say: "Exactly. That's the part I can't get past." }] },
    { id: 'cht.g4', turns: [{ by: 'a', say: "Somebody should say something to {partner}." }, { by: 'b', say: "Does {partner} even know?" }, { by: 'a', say: "Does {partner} know that {c} is {status}?" }, { by: 'b', say: "...I genuinely don't know." }] },
    { id: 'cht.g5', turns: [{ by: 'a', dr: "{c} spent the first week telling everyone about {home}. Now {c} spends every night in {partner}'s bed. I can't trust someone like that with my game." }] },
    { id: 'cht.g6', turns: [{ beat: '{a} and {b} watch {c} and {partner} from across the room, voices low.' }, { by: 'b', say: "Is that what you'd do if you were {status}?" }, { by: 'a', say: "No. And it tells me a lot about {c}." }] },
    { id: 'cht.g7', turns: [{ by: 'a', say: "I'm not judging." }, { by: 'b', say: "You're judging a little." }, { by: 'a', say: "Fine. I'm judging. {c} is {status}." }] },
  ],
  'cheat.confront.done': [
    { id: 'cht.cd1', turns: [{ by: 'a', say: "Were you going to tell me?" }, { by: 'b', say: "Tell you what?" }, { by: 'a', say: "That you're {status}. Half the house knows. I had to hear it in the kitchen." }, { by: 'b', say: "It's complicated." }, { by: 'a', say: "It's really not. We're done." }] },
    { id: 'cht.cd2', turns: [{ by: 'a', say: "You have a {homeword}." }, { by: 'b', say: "I never lied to you." }, { by: 'a', say: "You never said it either." }, { beat: '{a} takes a pillow off the bed and walks out.' }, { by: 'a', dr: "I'm not going to be the reason somebody's {homeword} watches this and cries." }] },
    { id: 'cht.cd3', turns: [{ by: 'a', say: "Everyone's been laughing at me behind my back, haven't they?" }, { by: 'b', say: "Nobody's laughing." }, { by: 'a', say: "You're {status}, {b}." }, { by: 'b', say: "I know." }, { by: 'a', say: "Then go back to it. I'm out." }] },
    { id: 'cht.cd4', turns: [{ by: 'a', dr: "I liked {b}. I really did. But I'm not going to be somebody's secret on national television." }] },
    { id: 'cht.cd5', turns: [{ by: 'a', say: "Is it true? Are you {status}?" }, { beat: '{b} doesn\'t answer straight away. That is the answer.' }, { by: 'a', say: "Okay. Don't sleep in my bed tonight." }] },
    { id: 'cht.cd6', turns: [{ by: 'a', say: "I can't do this. You're {status}." }, { by: 'b', say: "I didn't plan this." }, { by: 'a', say: "Nobody plans it. You still did it." }] },
  ],
  'cheat.confront.stays': [
    { id: 'cht.cs1', turns: [{ by: 'a', say: "Were you going to tell me you're {status}?" }, { by: 'b', say: "I didn't know how." }, { by: 'a', say: "...I'm still here. I don't know why I'm still here." }, { by: 'a', dr: "I should walk away. I know I should." }] },
    { id: 'cht.cs2', turns: [{ by: 'a', say: "Does {yourhome} know about me?" }, { by: 'b', say: "{Yourhome} will." }, { by: 'a', say: "That's not an answer." }, { by: 'b', say: "It's the only one I've got." }, { by: 'a', dr: "I'm staying. Mostly because I don't have anyone else in here." }] },
    { id: 'cht.cs3', turns: [{ by: 'a', dr: "{b} has a {homeword}. I found out from the house. And I'm still sleeping next to {b}. Don't judge me." }] },
    { id: 'cht.cs4', turns: [{ by: 'a', say: "Somebody told me you're {status}." }, { by: 'b', say: "I should have told you myself." }, { by: 'a', say: "Just be honest with me from now on." }, { by: 'b', say: "I will." }, { beat: 'They sit in silence. Neither of them believes it.' }] },
    { id: 'cht.cs5', turns: [{ by: 'a', say: "So what happens when you walk out of here?" }, { by: 'b', say: "I don't know." }, { by: 'a', say: "Right. Neither do I." }, { by: 'a', dr: "It's different now. I just haven't left yet." }] },
    { id: 'cht.cs6', turns: [{ by: 'a', say: "You should have told me on day one." }, { by: 'b', say: "On day one there was nothing to tell." }, { by: 'a', dr: "That's the worst part. {b} is right." }] },
  ],
  'cheat.endit.scene': [
    { id: 'cht.e1', turns: [{ by: 'a', say: "I can't keep doing this." }, { by: 'b', say: "Doing what?" }, { by: 'a', say: "This. Us. I have {myhome} at home." }, { by: 'b', say: "You've had {myhome} at home for weeks." }, { by: 'a', say: "I know. That's why I'm stopping." }] },
    { id: 'cht.e2', turns: [{ by: 'a', dr: "I ended it with {b} today. It wasn't fair to {b}, and it definitely wasn't fair to {myhome}." }] },
    { id: 'cht.e3', turns: [{ beat: 'Backyard, late. {a} asks {b} to sit down.' }, { by: 'a', say: "You've done nothing wrong. I have." }, { by: 'b', say: "So that's it?" }, { by: 'a', say: "That's it. I'm sorry." }, { by: 'b', dr: "{a} chose {home}. I always knew that's how it would go." }] },
    { id: 'cht.e4', turns: [{ by: 'a', say: "I want to be able to look {myhome} in the eye when I walk out." }, { by: 'b', say: "And you can't if we keep going." }, { by: 'a', say: "No. I can't." }] },
    { id: 'cht.e5', turns: [{ by: 'a', dr: "Ending it with {b} was the hardest thing I've done in here. And the only one I'm proud of." }] },
    { id: 'cht.e6', turns: [{ by: 'b', say: "Is this about the game?" }, { by: 'a', say: "It's about {myhome}." }, { by: 'b', say: "Okay." }, { by: 'b', dr: "I can't even be angry. {a} is doing the right thing. It just hurts." }] },
  ],
};
