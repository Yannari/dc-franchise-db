// ══════════════════════════════════════════════════════════════════════
// bb/script/lines/partner.js — the Head of Household puts their own showmance up
// ══════════════════════════════════════════════════════════════════════
//
// The read of 2026-10-29: Ben nominated Lacey, his showmance, "for seemingly no reason ... there wasnt even a
// reasoning or some fight/drama/cry". On the show it is the rarest nomination there is and the week is about it.
// bb-events/partner-up.js decides WHY, from the game, and the words follow the why:
//
// Keyed `partneract.` like a twist ceremony's own pools (tests/bb-script.test.js): each is one moment, a few times
// a season at most.
//
//   partneract.nominated   a the nominee, b the HOH (their showmance), after the ceremony       bedroom
//                       pawn      a agreed to sit there
//                       game      nothing told a it was coming: the shock, the tears, the row
//                       cold      it had been cooling, and this is where it ends
//                       wronged   b has a reason, and says it: what a did
//                       nochoice  the house ran out of other people
//   partneract.renom       a the replacement nominee, b the HOH who named them            living room → bedroom
//                       pawn | game | cold | wronged | nochoice (same reasons)
//   partneract.guilt       a the HOH, the morning after {gone} (their showmance) was evicted from their block
//                       guilt     they did it and it is sitting on them
//                       cold      they did it and they are fine with it
//   partneract.called      a a houseguest who says it out loud to b, the HOH: "you sent {gone} home"   kitchen

const S = (id, say) => ({ id, turns: [{ by: 'a', say }] });
const D = (id, dr) => ({ id, turns: [{ by: 'a', dr }] });

export default {
  // ── at the ceremony: a = the HOH, b = their showmance (bb/script/ceremony.js whyOf) ──
  'noms.why.partner': [
    S('nw.s1', "{b}, this is the hardest name I'll ever say in this house. You and I are seen as one person in here, and I can't play this game as half of a pair. I'm sorry."),
    S('nw.s2', "{b}. I know what this looks like. I'm not going to explain it in front of everybody. I'll explain it to you."),
    S('nw.s3', "{b}, I care about you, and that's exactly why everyone in this room is waiting for me to protect you. I can't keep doing that."),
    S('nw.s4', "{b}, I've thought about this every minute since I won that key. I'm not doing this because of what we are. I'm doing it because of what this game is."),
    S('nw.s5', "{b}, I know you're going to be angry with me. I'd rather you were angry with me than have this whole house decide our game for us."),
    S('nw.s6', "{b}, I didn't tell you this was coming, and that's on me. I'll answer for it upstairs, not in here."),
  ],
  'noms.why.partnerpawn': [
    S('nw.sp1', "{b}, you know why you're sitting there. We talked about it, and you said yes. Thank you."),
    S('nw.sp2', "{b}, nobody in this room is more surprised than me that I'm saying your name. You know the plan. I'm sticking to it."),
    S('nw.sp3', "{b}, you trusted me with this. I won't let you down."),
    S('nw.sp4', "{b}, everybody in here is about to think something happened between us. Nothing did. You know why you're up there."),
    S('nw.sp5', "{b}, you said yes when I asked you, and I know what that cost you. You're not going anywhere."),
    S('nw.sp6', "{b}, you're sitting there because I asked you to, and because I trust you more than anybody in this room."),
  ],
  // ── in the Diary Room after it: a = the showmance, b = the HOH ──
  'noms.dr.partner': [
    D('nd.s1', "{b} put me up. {b}. I'm sitting on the block, and the person who did it slept next to me last night."),
    D('nd.s2', "I'm trying not to cry on camera. I'm failing. I didn't see this coming from {b}, not in a million years."),
    D('nd.s3', "Everybody in the house is staring at me and {b}, waiting for one of us to explode. I might."),
    D('nd.s4', "I thought {b} and I were in this together until the end. {b} decided it ends here instead."),
    D('nd.s5', "{b} couldn't even look at me when the key turned. I looked at {b} the whole time."),
    D('nd.s6', "Everybody kept saying {b} and I were a pair. {b} just showed the whole house we aren't, and did it on me."),
  ],
  'noms.dr.partnerpawn': [
    D('nd.sp1', "I agreed to this. {b} asked me in the bedroom and I said yes. Hearing my name out loud is still something else."),
    D('nd.sp2', "{b} says I'm safe. I believe {b}. I'm also a nominee in the Big Brother house, and believing people is how nominees go home."),
    D('nd.sp3', "The house thinks {b} and I have broken up. We haven't. I'm a pawn. That's the whole story, as long as the veto goes right."),
    D('nd.sp4', "{b} asked me to do this for us. I said yes. Now I need {b} to get me the votes I was promised."),
    D('nd.sp5', "Sitting next to the real target and pretending I'm worried is the strangest thing I've done in here. I am a bit worried."),
    D('nd.sp6', "If this goes wrong, it's not {b} who goes home. It's me. I knew that when I said yes."),
  ],
  'veto.renom.partner': [
    D('vr.s1', "{b} stood up and said my name. My own {b}. I didn't even look at the rest of the house, I just looked at {b}."),
    D('vr.s2', "Of everybody {b} could have named, {b} named me. I need to know why, and I need to know before Thursday."),
    D('vr.s3', "I was holding {b}'s hand ten minutes before that ceremony. Now I'm on the block next to the person {b} actually wants gone."),
    D('vr.s4', "{b} said it would never be me. Not as a pawn, not as anything. Then the veto came off, and it was me."),
    D('vr.s5', "I'm the replacement nominee, and the person who named me is the person I trusted most in this house."),
    D('vr.s6', "The whole room turned round to look at me when {b} said my name. Nobody saw it coming. I didn't see it coming."),
  ],

  'partneract.nominated.pawn': [
    { id: 'shn.p1', turns: [
      { beat: '{a} waits until the bedroom door is shut.' },
      { by: 'a', say: "Tell me again that this is a pawn thing." },
      { by: 'b', say: "It's a pawn thing. You're coming off, or {target} goes home. Either way you're fine." },
      { by: 'a', say: "And if the veto gets used on {target}?" },
      { by: 'b', say: "Then I put up someone with no votes. I've counted." },
      { by: 'a', dr: "I said yes to this. {b} asked me first, and I said yes. I still had to sit in that chair in front of everybody." }] },
    { id: 'shn.p2', turns: [
      { by: 'b', say: "Are you okay? You went really quiet at the ceremony." },
      { by: 'a', say: "I'm okay. It's just strange hearing you say my name like that." },
      { by: 'b', say: "I hated saying it." },
      { by: 'a', say: "I know. Just don't make me regret saying yes." },
      { by: 'b', dr: "{a} trusted me enough to sit up there for me. If this goes wrong, I don't know how I fix that." }] },
    { id: 'shn.p3', turns: [
      { by: 'a', say: "People are already asking me if we've broken up." },
      { by: 'b', say: "What did you say?" },
      { by: 'a', say: "That it's a game. That I agreed to it." },
      { by: 'b', say: "Good. That's the truth." },
      { by: 'a', dr: "Everyone thinks {b} put me up because something happened between us. Nothing happened. I'm a pawn. I hope I'm a pawn." }] },
    { id: 'shn.p4', turns: [
      { by: 'b', say: "You know I'd never let you go home." },
      { by: 'a', say: "You can't promise that. You don't vote unless it's a tie." },
      { by: 'b', say: "I can promise I'll spend every hour this week making sure it's {target}." },
      { by: 'a', say: "Then go and do that." },
      { by: 'a', dr: "{b} is going to work the house for me all week. That's the deal. I'm going to hold {b} to every minute of it." }] },
  ],
  'partneract.nominated.game': [
    { id: 'shn.g1', turns: [
      { beat: "{a} doesn't wait for the bedroom. It starts in the hallway." },
      { by: 'a', say: "You put me up. Me." },
      { by: 'b', say: "Can we talk about this somewhere else?" },
      { by: 'a', say: "No. You couldn't tell me before, so you can tell me now. Why?" },
      { by: 'b', say: "Because if I'd told you, you'd have tried to talk me out of it." },
      { by: 'a', say: "Yes! I would have!" },
      { by: 'a', dr: "I've been lying next to {b} every night. {b} knew for days that my name was going on that screen, and said nothing." }] },
    { id: 'shn.g2', turns: [
      { beat: '{a} is crying in the bathroom. {b} knocks twice and comes in anyway.' },
      { by: 'b', say: "I need you to hear me out." },
      { by: 'a', say: "I heard you. In the living room. With everyone watching me." },
      { by: 'b', say: "The house thinks we're a pair. I had to show them we're not." },
      { by: 'a', say: "So you showed them on me." },
      { by: 'b', dr: "I knew {a} would be hurt. I didn't think I'd have to watch it from this close." }] },
    { id: 'shn.g3', turns: [
      { by: 'a', say: "Was any of it real?" },
      { by: 'b', say: "All of it was real. This is the game." },
      { by: 'a', say: "You don't get to say that like it fixes it." },
      { by: 'b', say: "I'm not trying to fix it. I'm telling you why." },
      { by: 'a', say: "Then I'll tell you something. I'm going to win this veto, and I'm not going to forget this." },
      { by: 'a', dr: "{b} put me on the block and called it the game. Fine. Then I'll play it like a game, and {b} is in it." }] },
    { id: 'shn.g4', turns: [
      { beat: 'The whole house finds a reason to be in the kitchen while {a} and {b} argue in the bedroom.' },
      { by: 'a', say: "Do you have any idea how this looks?" },
      { by: 'b', say: "It looks like I'm playing my own game." },
      { by: 'a', say: "It looks like you threw me away the first time it cost you something." },
      { by: 'b', say: "That isn't what this is." },
      { by: 'a', dr: "Everybody in this house just watched {b} choose the game over me. I can't un-see that, and neither can they." }] },
    { id: 'shn.g5', turns: [
      { by: 'b', say: "Say something. Please." },
      { by: 'a', say: "I don't know what to say to you." },
      { by: 'b', say: "Yell at me. Anything." },
      { by: 'a', say: "I'm not going to yell. I'm going to go and talk to everybody else in this house about keeping me. Because you won't." },
      { by: 'b', dr: "{a} walked out without looking at me. I put my own person on the block, and now I have to live with it all week." }] },
  ],
  'partneract.nominated.cold': [
    { id: 'shn.c1', turns: [
      { by: 'a', say: "So that's how you tell me it's over." },
      { by: 'b', say: "It's been over for a week. You know that." },
      { by: 'a', say: "I knew we were struggling. I didn't know you'd put me on the block for it." },
      { by: 'b', say: "This isn't about us. You're a vote I don't have any more." },
      { by: 'a', dr: "We stopped talking at night a week ago. I didn't think {b} was planning my eviction while we did." }] },
    { id: 'shn.c2', turns: [
      { beat: "{a}'s bag is already packed into the other bedroom by the time {b} comes up." },
      { by: 'b', say: "You moved your things." },
      { by: 'a', say: "You moved my name onto the block. I'm just keeping up." },
      { by: 'b', say: "I'm not going to pretend I'm sorry." },
      { by: 'a', say: "Good. I'd hate for you to start pretending now." },
      { by: 'a', dr: "Whatever {b} and I were, it ended at that ceremony. At least now everybody knows." }] },
    { id: 'shn.c3', turns: [
      { by: 'a', say: "Were you waiting for HOH to do this?" },
      { by: 'b', say: "I was waiting to know what I wanted." },
      { by: 'a', say: "And you wanted me on the block." },
      { by: 'b', say: "I wanted to stop pretending we were still a pair." },
      { by: 'b', dr: "{a} and I fell apart weeks ago, and we kept acting like a couple because the house expected it. Not any more." }] },
  ],
  'partneract.nominated.wronged': [
    { id: 'shn.w1', turns: [
      { by: 'a', say: "You put me up." },
      { by: 'b', say: "You went behind my back. Did you think I wouldn't find out?" },
      { by: 'a', say: "That was a conversation. One conversation." },
      { by: 'b', say: "It was enough. You were making plans without me, so I made one without you." },
      { by: 'b', dr: "I found out what {a} was saying about me when I wasn't in the room. {a} went up for it." }] },
    { id: 'shn.w2', turns: [
      { by: 'a', say: "Is this about what I said?" },
      { by: 'b', say: "It's about what you did. I trusted you with everything in here." },
      { by: 'a', say: "And I never told anyone anything that hurt you." },
      { by: 'b', say: "That's not what I heard." },
      { by: 'a', dr: "Someone told {b} a story about me, and {b} believed it over me. That's the part that hurts." }] },
    { id: 'shn.w3', turns: [
      { beat: 'The bedroom door slams loud enough that the living room goes quiet.' },
      { by: 'b', say: "You voted against what I wanted. You looked at me and you did it anyway." },
      { by: 'a', say: "I had my reasons." },
      { by: 'b', say: "So did I. That's why you're sitting in that chair." },
      { by: 'a', dr: "I crossed {b} once in this game. One time. I'm on the block for it." }] },
  ],
  'partneract.nominated.nochoice': [
    { id: 'shn.n1', turns: [
      { by: 'b', say: "I need you to know I counted every way this could go." },
      { by: 'a', say: "There were only so many people left, weren't there?" },
      { by: 'b', say: "Everybody else was safe or already up there." },
      { by: 'a', say: "Then it's not your fault. It still hurts." },
      { by: 'a', dr: "There was nobody else for {b} to put up. I know that. I'm still the one sitting in the chair." }] },
    { id: 'shn.n2', turns: [
      { by: 'a', say: "Don't apologise. I'd have done the same." },
      { by: 'b', say: "Would you?" },
      { by: 'a', say: "I don't know. I'd like to think I wouldn't." },
      { by: 'b', say: "That's fair." },
      { by: 'b', dr: "This late in the game, there was no version of this week where {a} wasn't at risk. I still hated being the one to say it." }] },
  ],

  // the replacement nominee: the veto came off and {b} named their own showmance
  'partneract.renom.pawn': [
    { id: 'shr.p1', turns: [
      { by: 'a', say: "You said if the veto got used, it might be me." },
      { by: 'b', say: "And you said that was okay." },
      { by: 'a', say: "It was okay in the bedroom. It feels different in that chair." },
      { by: 'b', say: "The votes are there. You're not going anywhere." },
      { by: 'a', dr: "We talked about this. I agreed to it. I just didn't think the veto would actually come off." }] },
    { id: 'shr.p2', turns: [
      { by: 'b', say: "Four votes. I've got four votes to keep you. I've checked them twice." },
      { by: 'a', say: "Check them a third time." },
      { by: 'b', say: "I will." },
      { by: 'a', dr: "{b} named me as the replacement because I said yes to being the safe name. Now {b} has to make sure I am." }] },
  ],
  'partneract.renom.game': [
    { id: 'shr.g1', turns: [
      { beat: '{a} sits down in the chair and stares at {b}, who does not look back.' },
      { by: 'a', say: "Out of everybody in this house. Out of everybody." },
      { by: 'b', say: "We'll talk upstairs." },
      { by: 'a', say: "We'll talk now. You had a whole room of people to choose from." },
      { by: 'b', say: "And you were the one nobody would expect." },
      { by: 'a', dr: "{b} used the replacement to send a message to the house, and I'm the message. I'm the one who gets sent home for it." }] },
    { id: 'shr.g2', turns: [
      { by: 'a', say: "I was safe. I was sitting on the couch next to you." },
      { by: 'b', say: "I know." },
      { by: 'a', say: "You held my hand during the ceremony. Then you stood up and said my name." },
      { by: 'b', say: "I didn't want anyone to see it coming." },
      { by: 'a', say: "I didn't see it coming!" },
      { by: 'a', dr: "{b} held my hand for the whole veto meeting, and then put me on the block. I keep going back over that." }] },
    { id: 'shr.g3', turns: [
      { beat: "Upstairs, {a} is in tears. {b} sits on the end of the bed and doesn't try to touch {a.obj}." },
      { by: 'b', say: "If I'd put anyone else up, the house would have come for both of us next week." },
      { by: 'a', say: "So you decided it's me who pays for that." },
      { by: 'b', say: "I decided you're the one with the votes to stay." },
      { by: 'a', say: "You'd better be right." },
      { by: 'b', dr: "I'm betting {a} survives this. If I'm wrong, I sent my own person home." }] },
  ],
  'partneract.renom.cold': [
    { id: 'shr.c1', turns: [
      { by: 'a', say: "You didn't even hesitate." },
      { by: 'b', say: "We both know where we are." },
      { by: 'a', say: "I thought we were somewhere better than the block." },
      { by: 'a', dr: "{b} and I haven't been right for a while. I just didn't think it would end with {b} naming me as the replacement." }] },
  ],
  'partneract.renom.wronged': [
    { id: 'shr.w1', turns: [
      { by: 'a', say: "This is about the vote, isn't it?" },
      { by: 'b', say: "This is about you lying to me about the vote." },
      { by: 'a', say: "I didn't lie. I changed my mind." },
      { by: 'b', say: "Then I changed mine." },
      { by: 'b', dr: "{a} made a move without me and thought I wouldn't notice. I noticed. Now {a} is the replacement." }] },
  ],
  'partneract.renom.nochoice': [
    { id: 'shr.n1', turns: [
      { by: 'b', say: "I didn't have anybody else. You know that." },
      { by: 'a', say: "I know. I was counting while you were standing up." },
      { by: 'b', say: "I'm going to get you the votes." },
      { by: 'a', dr: "There were two people {b} could put up, and one of them was me. I understand it. I don't have to like it." }] },
  ],

  // the morning after: the HOH put their own showmance on the block, and the showmance went home
  'partneract.guilt.guilt': [
    { id: 'shg.g1', turns: [{ beat: "{a} is up before anyone else, sitting on the side of {gone}'s empty bed." }, { by: 'a', dr: "I put {gone} on the block. Me. And now {gone} is gone. I keep telling myself it was the right move for my game. It doesn't feel like it this morning." }] },
    { id: 'shg.g2', turns: [{ by: 'a', dr: "I told {gone} the votes were there. I believed it. Every single person I counted on told me one thing and wrote another, and {gone} paid for my mistake." }] },
    { id: 'shg.g3', turns: [{ beat: "{a} finds {gone}'s hoodie under the pillow and doesn't put it down." }, { by: 'a', dr: "I don't know how I'm going to look at {gone} in the jury house. I'm the reason {gone} is there." }] },
    { id: 'shg.g4', turns: [{ by: 'a', dr: "Everyone in this house is going to say I threw {gone} away. Maybe I did. I thought I was being clever, and I lost the one person I actually trusted in here." }] },
  ],
  'partneract.guilt.cold': [
    { id: 'shg.c1', turns: [{ by: 'a', dr: "People expect me to be upset about {gone}. I made a choice and the house finished it. {gone} would have been in my way sooner or later." }] },
    { id: 'shg.c2', turns: [{ by: 'a', dr: "{gone} going home is the best thing that could have happened to my game. I'm not going to cry about it on camera." }] },
  ],
  'partneract.called.scene': [
    { id: 'shc.1', turns: [
      { by: 'a', say: "You put {gone} up. You. Nobody made you." },
      { by: 'b', say: "I know what I did." },
      { by: 'a', say: "Do you? Because you're eating breakfast like nothing happened." },
      { by: 'b', say: "What do you want me to do, cry in front of you?" },
      { by: 'a', dr: "{b} put {gone} on the block and {gone} is gone. If {b} can do that to {gone}, {b} can do it to any of us." }] },
    { id: 'shc.2', turns: [
      { by: 'a', say: "Was it worth it?" },
      { by: 'b', say: "Was what worth it?" },
      { by: 'a', say: "{gone}. Was {gone} worth less to you than a week of looking like you're not a pair?" },
      { by: 'b', say: "That's not fair." },
      { by: 'a', say: "Neither was what you did to {gone}." },
      { by: 'b', dr: "{a} said what the whole house is thinking. I put {gone} up and {gone} went home. There isn't a way to say it that makes me look good." }] },
  ],
};
