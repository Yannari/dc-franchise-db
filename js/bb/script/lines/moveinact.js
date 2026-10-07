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
//
// Move-in night runs the way the live show runs it (the user, 2026-10-06: "check how move-in
// actually happens: entering in groups, first they're on the set with the host"):
//   moveinact.stage.<voice>        a answers the host on the stage, beside their group
//                                  (player | fighter | heart | quiet, from the archetype)
//   moveinact.group.first          the first group through the front door: a, b, c
//   moveinact.group.next           a later group (a, b), greeted by c, who is already inside
// On the stage the rest of the group is standing right there: a strategist does not say the
// plan out loud, and nobody claims to know anybody they have not met.

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
  // a walks in and somebody already inside is somebody they knew before the show. The house
  // does not know; the Diary Room does. By kinship word, then by its group.
  'moveinact.known.married': [
    { id: 'mik.m1', turns: [{ beat: '{a} walks in and sees {b}. Neither of them lets it show.' }, { by: 'a', dr: "{b} and I are married. If this house finds out, we're both on the block by the weekend." }] },
  ],
  'moveinact.known.engaged': [
    { id: 'mik.e1', turns: [{ beat: '{a} walks in and sees {b}. {a} looks away first.' }, { by: 'a', dr: "{b} and I are engaged. Nobody in here can know that." }] },
  ],
  'moveinact.known.together': [
    { id: 'mik.t1', turns: [{ beat: '{a} walks in and sees {b}. Neither of them lets it show.' }, { by: 'a', dr: "{b} and I are together. Nobody in this house knows, and it has to stay that way." }] },
    { id: 'mik.t2', turns: [{ beat: '{a} shakes hands with {b} like they have never met.' }, { by: 'a', dr: "That's my partner I just shook hands with. We agreed: strangers, for as long as we can manage it." }] },
  ],
  'moveinact.known.twins': [
    { id: 'mik.w1', turns: [{ beat: '{a} walks in. {b} is already on the sofa, and does not get up.' }, { by: 'a', dr: "{b} is my twin. We agreed to play this alone for as long as nobody notices." }] },
  ],
  'moveinact.known.family': [
    { id: 'mik.f1', turns: [{ beat: '{a} walks in and sees {b}. A quick look, then nothing.' }, { by: 'a', dr: "{b} and I are family. Nobody in here needs to know that yet." }] },
  ],
  'moveinact.known.friends': [
    { id: 'mik.r1', turns: [{ beat: '{a} walks in and spots {b} straight away.' }, { by: 'a', dr: "I know {b} from before the show. We're going to act like we just met. For now." }] },
  ],
  'moveinact.known.exes': [
    { id: 'mik.x1', turns: [{ beat: '{a} walks in, sees {b} and stops for half a second.' }, { by: 'a', dr: "{b} is my ex. Of all the people to walk through that door." }] },
  ],
  'moveinact.known.history': [
    { id: 'mik.h1', turns: [{ beat: '{a} walks in, sees {b} and the smile goes.' }, { by: 'a', dr: "{b} and I have history. Not the good kind. And now we live together." }] },
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

  // ── on the stage, answering the host ──
  'moveinact.stage.player': [
    { id: 'mi8.sp1', turns: [{ by: 'a', say: "I'm just here to have fun and meet people." }, { beat: '{a} smiles at the camera a little too long.' }] },
    { id: 'mi8.sp2', turns: [{ by: 'a', say: "Honestly? I'm going to listen more than I talk." }] },
    { id: 'mi8.sp3', turns: [{ by: 'a', say: "I've watched this show my whole life. I know what not to do." }] },
    { id: 'mi8.sp4', turns: [{ by: 'a', say: "Strategy? Me? I'm just a nice person who likes games." }, { beat: 'Nobody standing next to {a} believes a word of it.' }] },
    { id: 'mi8.sp5', turns: [{ by: 'a', say: "Make friends first. Everything else comes later." }] },
    { id: 'mi8.sp6', turns: [{ by: 'a', say: "I'll tell you after I win." }] },
  ],
  'moveinact.stage.fighter': [
    { id: 'mi8.sf1', turns: [{ by: 'a', say: "I'm here to win competitions. All of them." }] },
    { id: 'mi8.sf2', turns: [{ by: 'a', say: "If you come for me, I'm coming right back." }] },
    { id: 'mi8.sf3', turns: [{ by: 'a', say: "I don't do quiet. Everybody's going to know I'm in there." }] },
    { id: 'mi8.sf4', turns: [{ by: 'a', say: "Put a comp in front of me and get out of the way." }] },
    { id: 'mi8.sf5', turns: [{ by: 'a', say: "I'm going to be honest, and some people aren't going to like it." }] },
    { id: 'mi8.sf6', turns: [{ by: 'a', say: "Nobody's going to see me coming. Well. Everybody's going to see me coming. They just won't stop me." }] },
  ],
  'moveinact.stage.heart': [
    { id: 'mi8.sh1', turns: [{ by: 'a', say: "I want to play an honest game and make the people at home proud." }] },
    { id: 'mi8.sh2', turns: [{ by: 'a', say: "I'm loyal. If I give you my word, that's it." }] },
    { id: 'mi8.sh3', turns: [{ by: 'a', say: "I'm going to be everybody's friend. I can't help it." }] },
    { id: 'mi8.sh4', turns: [{ by: 'a', say: "I just want to meet everyone. I'm so excited I could cry." }] },
    { id: 'mi8.sh5', turns: [{ by: 'a', say: "Win or lose, I want to walk out of there as myself." }] },
    { id: 'mi8.sh6', turns: [{ by: 'a', say: "Good people, good game. That's the plan." }] },
  ],
  'moveinact.stage.quiet': [
    { id: 'mi8.sq1', turns: [{ by: 'a', say: "Stay out of trouble. See how far that gets me." }] },
    { id: 'mi8.sq2', turns: [{ by: 'a', say: "People are going to underestimate me. That's fine." }] },
    { id: 'mi8.sq3', turns: [{ by: 'a', say: "I'll go with the flow. The flow usually knows where it's going." }] },
    { id: 'mi8.sq4', turns: [{ by: 'a', say: "Honestly, I'm just hoping I don't trip on the way in." }] },
    { id: 'mi8.sq5', turns: [{ by: 'a', say: "I'm not the loudest. I don't need to be." }] },
    { id: 'mi8.sq6', turns: [{ by: 'a', say: "Nobody thinks I can win this. I like that." }] },
  ],
  // ── a group through the front door ──
  'moveinact.group.first': [
    { id: 'mi8.gf1', turns: [{ beat: 'The front door bursts open. {a}, {b} and {c} pile in, screaming.' }, { by: 'a', say: "Oh my god. Oh my god, it's real!" }, { by: 'b', say: "Look at the kitchen!" }, { by: 'c', say: "Forget the kitchen. Beds. Now." }, { beat: 'Three people sprint for the bedrooms at once.' }] },
    { id: 'mi8.gf2', turns: [{ beat: 'The door opens. {a} walks in first, very slowly, like the floor might be a trick.' }, { by: 'b', say: "Go in, then!" }, { by: 'a', say: "I'm savouring it!" }, { by: 'c', say: "Savour it faster. I want a bed." }] },
    { id: 'mi8.gf3', turns: [{ beat: '{a}, {b} and {c} burst through the front door and stop dead in the living room.' }, { by: 'b', say: "It's smaller than on TV." }, { by: 'a', say: "It's bigger than on TV." }, { by: 'c', say: "It's exactly the same as on TV. Where's the Diary Room?" }] },
    { id: 'mi8.gf4', turns: [{ beat: 'First through the door. {a} runs straight to the memory wall and finds their own face.' }, { by: 'a', say: "That's me! I'm on the wall!" }, { by: 'b', say: "We're all on the wall." }, { by: 'a', say: "Let me have this." }, { by: 'c', say: "I'm taking the bed by the window." }] },
    { id: 'mi8.gf5', turns: [{ beat: 'The first group is in. {a} is already opening every cupboard in the kitchen.' }, { by: 'b', say: "What are you looking for?" }, { by: 'a', say: "Everything. I want to know where everything is before anyone else does." }, { by: 'c', say: "That's either very organised or very suspicious." }] },
    { id: 'mi8.gf6', turns: [{ beat: '{a}, {b} and {c} come through the door holding hands, the way they agreed on the stage.' }, { by: 'b', say: "Okay, we can let go now." }, { by: 'c', say: "We're not letting go. We're a team now." }, { by: 'a', say: "We've known each other four minutes." }, { by: 'c', say: "Best four minutes of my life." }] },
  ],
  'moveinact.group.next': [
    { id: 'mi8.gn1', turns: [{ beat: 'The front door opens again. The people already inside run to meet the new group.' }, { by: 'c', say: "Welcome home! Hi! I'm {c}!" }, { by: 'a', say: "Hi! Oh, you've already picked beds, haven't you?" }, { by: 'c', say: "...Some beds. Not all the beds." }, { by: 'b', say: "Which means all the good beds." }] },
    { id: 'mi8.gn2', turns: [{ beat: 'Another group through the door. {c} is waiting in the hallway like a host at a party.' }, { by: 'c', say: "Come in, come in. Shoes wherever. Nobody's made a rule yet." }, { by: 'b', say: "Are you the welcome committee?" }, { by: 'c', say: "I am now." }] },
    { id: 'mi8.gn3', turns: [{ beat: 'The door bursts open. {a} and {b} walk straight into a hug from {c}.' }, { by: 'a', say: "Hello! Oh, we're hugging. Okay, great." }, { by: 'c', say: "We hug here." }, { by: 'b', say: "Since when?" }, { by: 'c', say: "Since about ten minutes ago." }] },
    { id: 'mi8.gn4', turns: [{ beat: 'New faces. The living room fills up. {c} starts doing introductions nobody can keep track of.' }, { by: 'c', say: "That's... and that's... I've forgotten already. Everybody just say your name." }, { by: 'a', say: "{a}." }, { by: 'b', say: "{b}. Where's the toilet?" }] },
    { id: 'mi8.gn5', turns: [{ beat: 'The next group is in. {a} heads straight for the bedrooms and comes back looking betrayed.' }, { by: 'a', say: "There's one bed left in the big room." }, { by: 'c', say: "Early bird." }, { by: 'b', say: "I'll fight you for it." }, { by: 'a', say: "You'll lose." }] },
    { id: 'mi8.gn6', turns: [{ beat: 'The door opens on new faces. {c} waves at them from the kitchen.' }, { by: 'c', say: "There's pasta if you want it. Nobody's worked out the oven yet." }, { by: 'b', say: "Pasta how, then?" }, { by: 'c', say: "Optimism, mostly." }] },
  ],
};
