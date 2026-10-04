// ══════════════════════════════════════════════════════════════════════
// bb/script/lines/campact.js — Camp Comeback, spoken (Phase 7)
// ══════════════════════════════════════════════════════════════════════
//
// What houseguests say when an eviction does not send anybody home, and on
// the night the camp door opens (written by bb/script/ceremony.js).
// Votes are secret: a camper never knows who voted them out. Only the voter
// does, so only the voter talks about it.
//
//   campact.arrive   a is evicted and told to stay, in camp      first | more | last
//   campact.voters   a voted b out, and b still lives here       scene
//   campact.open     a is one of the campers, before the comp    scene
//   campact.out      a loses the return comp and leaves          scene
//   campact.back     a wins and walks back into the game         long | tonight
//   campact.enemy    a is in the house; b, a's worst enemy, is back   scene

export default {
  'campact.arrive.first': [
    { id: 'cc7.f1', turns: [{ by: 'a', say: "Wait. I'm staying?" }, { by: 'a', dr: "I'm evicted, and I'm still here. I don't know what that means yet." }] },
    { id: 'cc7.f2', turns: [{ by: 'a', dr: "I said all my goodbyes. Then I had to walk back in and sit down." }] },
    { id: 'cc7.f3', turns: [{ by: 'a', say: "So I just live here now? With no game?" }, { beat: 'Nobody in the room knows what to say.' }] },
    { id: 'cc7.f4', turns: [{ by: 'a', dr: "I can't vote, I can't compete and I can't be put up. But I can listen. And I'm going to." }] },
    { id: 'cc7.f5', turns: [{ by: 'a', dr: "First one in camp. If anyone's coming back, I want it to be me." }] },
    { id: 'cc7.f6', turns: [{ by: 'a', say: "I've got a uniform. Of course I've got a uniform." }] },
  ],
  'campact.arrive.more': [
    { id: 'cc7.m1', turns: [{ by: 'a', dr: "I've watched people sit in that camp room. Now it's my turn." }] },
    { id: 'cc7.m2', turns: [{ by: 'a', say: "Move over. I'm in camp too now." }] },
    { id: 'cc7.m3', turns: [{ by: 'a', dr: "Being evicted and staying is worse than leaving. Everyone still playing has to look at me." }] },
    { id: 'cc7.m4', turns: [{ by: 'a', dr: "There's more of us in camp now. Only one of us gets back in. I've done that maths already." }] },
    { id: 'cc7.m5', turns: [{ by: 'a', say: "Well. At least I know where I'm sleeping." }] },
    { id: 'cc7.m6', turns: [{ by: 'a', dr: "I'm out of the game and still in the house. I'm going to use every day of it." }] },
  ],
  'campact.arrive.last': [
    { id: 'cc7.l1', turns: [{ by: 'a', dr: "Camp is full now, which means the door opens tonight. I've been in camp for about a minute." }] },
    { id: 'cc7.l2', turns: [{ by: 'a', say: "I'm the last one in? So we play now?" }] },
    { id: 'cc7.l3', turns: [{ by: 'a', dr: "Everyone else in camp has had weeks to get ready for this. I've had none. I'm still playing." }] },
    { id: 'cc7.l4', turns: [{ by: 'a', dr: "Evicted and given another chance on the same night. I'm not wasting it." }] },
    { id: 'cc7.l5', turns: [{ by: 'a', say: "Four of us. Let's go." }] },
    { id: 'cc7.l6', turns: [{ by: 'a', dr: "I walked into camp and straight into the competition to get out of it." }] },
  ],
  'campact.voters.scene': [
    { id: 'cc7.v1', turns: [{ by: 'a', dr: "I voted {b} out. Now {b}'s at the breakfast table every morning, and {b} has no idea." }] },
    { id: 'cc7.v2', turns: [{ by: 'b', say: "Pass the milk?" }, { by: 'a', say: "Sure." }, { by: 'a', dr: "I wrote {b}'s name down. Now I'm passing {b} the milk. Very awkward." }] },
    { id: 'cc7.v3', turns: [{ by: 'a', dr: "You vote someone out so you don't have to see them any more. That isn't how this week went." }] },
    { id: 'cc7.v4', turns: [{ by: 'a', dr: "If {b} ever finds out it was my vote, and {b} comes back, I'm in trouble." }] },
    { id: 'cc7.v5', turns: [{ by: 'b', say: "Morning." }, { by: 'a', say: "Morning." }, { by: 'a', dr: "That's as far as we get these days." }] },
    { id: 'cc7.v6', turns: [{ by: 'a', dr: "{b} still lives here and listens to everything. I'm being extra nice, just in case." }] },
  ],
  'campact.open.scene': [
    { id: 'cc7.o1', turns: [{ by: 'a', dr: "All of us in camp, and only one way back in. I've waited for this." }] },
    { id: 'cc7.o2', turns: [{ by: 'a', say: "Good luck, everyone. I mean it. Mostly." }] },
    { id: 'cc7.o3', turns: [{ by: 'a', dr: "I've watched this game from a camp bed. I know who said what. I just need to win." }] },
    { id: 'cc7.o4', turns: [{ by: 'a', say: "One of us goes back in. Let it be me." }] },
    { id: 'cc7.o5', turns: [{ by: 'a', dr: "Everyone still playing is watching us right now. Half of them are hoping I lose." }] },
    { id: 'cc7.o6', turns: [{ by: 'a', dr: "This is it. If I lose, I'm evicted twice." }] },
  ],
  'campact.out.scene': [
    { id: 'cc7.x1', turns: [{ by: 'a', dr: "Evicted twice. Not many people can say that. I'd rather not have been one of them." }] },
    { id: 'cc7.x2', turns: [{ by: 'a', say: "That's me done, then. Properly, this time." }] },
    { id: 'cc7.x3', turns: [{ by: 'a', dr: "I gave it everything. It wasn't enough. At least I got to stay a bit longer." }] },
    { id: 'cc7.x4', turns: [{ by: 'a', say: "Well. That's me." }, { beat: '{a} hugs the other campers and picks up a bag.' }] },
    { id: 'cc7.x5', turns: [{ by: 'a', dr: "I'm leaving with my head up. It's just a lot later than I thought it would be." }] },
    { id: 'cc7.x6', turns: [{ by: 'a', say: "Bye, everybody. Again." }] },
  ],
  'campact.back.long': [
    { id: 'cc7.b1', turns: [{ by: 'a', say: "I'm back!" }, { by: 'a', dr: "I've heard every conversation in this house since I was evicted. Now I get to use it." }] },
    { id: 'cc7.b2', turns: [{ by: 'a', dr: "They all thought my game was over. I've been listening the whole time." }] },
    { id: 'cc7.b3', turns: [{ by: 'a', say: "Did you miss me?" }, { beat: 'Some of the house claps. Some of it does not.' }] },
    { id: 'cc7.b4', turns: [{ by: 'a', dr: "Camp was miserable. It was also the most useful time I've had in this house." }] },
    { id: 'cc7.b5', turns: [{ by: 'a', dr: "I know who wanted me gone. I know who was nice to me when I couldn't do anything for them. That matters now." }] },
    { id: 'cc7.b6', turns: [{ by: 'a', say: "Hi again, everybody." }, { by: 'a', dr: "Back in the game. Not wasting a second." }] },
  ],
  'campact.back.tonight': [
    { id: 'cc7.t1', turns: [{ by: 'a', dr: "Evicted and back in the game in the same night. I'll take it." }] },
    { id: 'cc7.t2', turns: [{ by: 'a', say: "I didn't even get to unpack in camp." }] },
    { id: 'cc7.t3', turns: [{ by: 'a', dr: "The others had weeks in camp. I had one evening, and I'm the one back in the game." }] },
    { id: 'cc7.t4', turns: [{ by: 'a', say: "Hello again. I wasn't gone very long." }] },
    { id: 'cc7.t5', turns: [{ by: 'a', dr: "The people who voted me out tonight have to see me tomorrow morning. Good." }] },
    { id: 'cc7.t6', turns: [{ by: 'a', dr: "That's the shortest eviction in history. I'm back." }] },
  ],
  'campact.enemy.scene': [
    { id: 'cc7.e1', turns: [{ by: 'a', dr: "{b} is back. {b} heard everything I said about {b} in this house. That's a problem." }] },
    { id: 'cc7.e2', turns: [{ by: 'a', say: "Welcome back, {b}." }, { by: 'b', say: "Thanks. I bet." }] },
    { id: 'cc7.e3', turns: [{ by: 'a', dr: "Of all the people who could have come back, it had to be {b}." }] },
    { id: 'cc7.e4', turns: [{ by: 'a', dr: "I need to talk to {b} tonight, before {b} talks to everyone else about me." }] },
    { id: 'cc7.e5', turns: [{ by: 'a', dr: "{b} and I never got on. Now {b} is back in the game, and probably coming for me." }] },
    { id: 'cc7.e6', turns: [{ by: 'b', say: "We should talk." }, { by: 'a', say: "Should we?" }, { by: 'b', say: "We should." }] },
  ],
};
