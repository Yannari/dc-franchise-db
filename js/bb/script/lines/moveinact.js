// ══════════════════════════════════════════════════════════════════════
// bb/script/lines/moveinact.js — move-in day, spoken
// ══════════════════════════════════════════════════════════════════════
//
// Week one opens on the house filling up (written by bb/script/ceremony.js).
// Nobody has met anybody: a first impression is about what somebody SAW
// in the last ten minutes (a handshake, a bed grab, a smile), never about a
// history they do not have. Each greeting is in the houseguest's own
// archetype's voice; a strategist's opening move is to look harmless, so a
// mastermind does not announce a plan out loud (the Diary Room is different).
//
//   moveinact.arrive.<archetype>   a walks in                         say + sometimes a DR
//   moveinact.meet.warm            a liked the look of b              DR
//   moveinact.meet.wary            a is not sure about b              DR

const A = (id, say, dr) => ({ id, turns: [{ by: 'a', say }, ...(dr ? [{ by: 'a', dr }] : [])] });

export default {
  'moveinact.arrive.mastermind': [
    A('mi7.ma1', "Hi! So nice to meet you all.", "Smile, learn every name, and say nothing that matters. That's day one."),
    A('mi7.ma2', "Wow, look at this place.", "Everybody's showing their cards in the first hour. I'm keeping mine."),
    A('mi7.ma3', "Hey, everyone. Where are we all sleeping?", "I want to know who picks which room. That tells me a lot."),
  ],
  'moveinact.arrive.schemer': [
    A('mi7.sc1', "Hello, new best friends!", "I'm going to be everybody's favourite person for about three weeks."),
    A('mi7.sc2', "Okay, who's going to show me around?", "Find the gossips first. They do half the work for you."),
    A('mi7.sc3', "Hi, hi, hi! I already love it here."),
  ],
  'moveinact.arrive.villain': [
    A('mi7.vi1', "Don't all get up at once.", "I'm not here to make friends. I'll make a few anyway. It's useful."),
    A('mi7.vi2', "So this is the competition?", "Half of these people won't last a month. I can tell already."),
    A('mi7.vi3', "Nice place. I'll take the best bed.", "Start as you mean to go on."),
  ],
  'moveinact.arrive.hero': [
    A('mi7.he1', "Hi, everybody! Need a hand with those bags?", "I want to be the person people can count on in here."),
    A('mi7.he2', "Hey! Come here, everybody, group hug.", "I'm going to play this game the honest way. We'll see how far that gets me."),
    A('mi7.he3', "Hi! I'm so happy to be here."),
  ],
  'moveinact.arrive.loyal-soldier': [
    A('mi7.ls1', "Hi, everyone. Good to meet you.", "Find my people early and stick with them. That's the plan."),
    A('mi7.ls2', "Hey! Who's in the room on the left?", "I just need a couple of people I can trust. Then I'm all in."),
  ],
  'moveinact.arrive.social-butterfly': [
    A('mi7.sb1', "Oh my gosh, hi! Hi! Hi!", "I want to know every single person in this house by tonight."),
    A('mi7.sb2', "Everybody, come here, I need names!"),
    A('mi7.sb3', "Hi! Is it okay if I hug everyone? I'm going to hug everyone.", "People talk to people they like. So I'm going to be very likeable."),
  ],
  'moveinact.arrive.showmancer': [
    A('mi7.sh1', "Well, hello, everyone.", "I'm not saying I'm looking for romance. I'm not saying I'm not."),
    A('mi7.sh2', "Hey there. Nice to meet you.", "A couple of people in here are very easy on the eyes. Focus. Focus."),
  ],
  'moveinact.arrive.hothead': [
    A('mi7.ho1', "Let's go! Let's do this!", "I'm loud, I'm honest, and if you've got a problem with me, you'll hear about it."),
    A('mi7.ho2', "What's up, everybody! Who's ready?", "I'm going to try to keep my cool. Try."),
  ],
  'moveinact.arrive.challenge-beast': [
    A('mi7.cb1', "Hey, everyone. Where's the backyard?", "I'm here to win competitions. The rest I'll work out as I go."),
    A('mi7.cb2', "What's up! I'm ready for the first comp already.", "People will look at me and see a threat. Fair enough. I am one."),
  ],
  'moveinact.arrive.wildcard': [
    A('mi7.wc1', "Hello, house! I've arrived!", "Nobody in here knows what to make of me. Good. Neither do I."),
    A('mi7.wc2', "Okay, which bed is haunted? I want that one."),
  ],
  'moveinact.arrive.chaos-agent': [
    A('mi7.ca1', "Hi! Let's make this interesting.", "The quieter this house gets, the more fun I'm going to have."),
    A('mi7.ca2', "Hello! Who here can keep a secret? Asking for a friend."),
  ],
  'moveinact.arrive.floater': [
    A('mi7.fl1', "Hi, everyone. Nice to meet you.", "Get along with everybody. Don't be anybody's first target. Easy."),
    A('mi7.fl2', "Hey! Love the kitchen.", "I'm going to be easy to like and hard to remember. That's the trick."),
  ],
  'moveinact.arrive.underdog': [
    A('mi7.ud1', "Hi! Wow. I can't believe I'm actually here.", "People are going to underestimate me. That's fine. They'll be wrong."),
    A('mi7.ud2', "Hey, everyone. Is there room for one more?"),
  ],
  'moveinact.arrive.goat': [
    A('mi7.go1', "Hi! Sorry, am I late? I think I'm late.", "I have no idea what I'm doing. I'm going to figure it out, though."),
    A('mi7.go2', "Hello! Which way's the bathroom?"),
  ],
  'moveinact.arrive.perceptive-player': [
    A('mi7.pp1', "Hi, everybody.", "Watch who sits next to who in the first hour. People tell you everything without meaning to."),
    A('mi7.pp2', "Hey. Nice to meet you all.", "Three people in here have already made a friend. I saw it happen."),
  ],
  'moveinact.meet.warm': [
    { id: 'mi7.w1', turns: [{ by: 'a', dr: "{b} made a space for me on the sofa the second I walked in. I like {b} already." }] },
    { id: 'mi7.w2', turns: [{ by: 'a', dr: "{b} seems genuinely nice. That might be a problem later. For now, I like {b}." }] },
    { id: 'mi7.w3', turns: [{ by: 'a', dr: "{b} remembered my name straight away. That counts for something in here." }] },
  ],
  'moveinact.meet.wary': [
    { id: 'mi7.y1', turns: [{ by: 'a', dr: "{b} has been very friendly. Very, very friendly. I'm keeping an eye on {b}." }] },
    { id: 'mi7.y2', turns: [{ by: 'a', dr: "{b} grabbed the best bed before anyone else had put a bag down. Noted." }] },
    { id: 'mi7.y3', turns: [{ by: 'a', dr: "I can't read {b} at all. I don't like that." }] },
  ],
};
