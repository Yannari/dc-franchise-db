// ══════════════════════════════════════════════════════════════════════
// bb/story/lines/camptalk.js — the nominees work the house
// ══════════════════════════════════════════════════════════════════════
//
// The user, 2026-10-06: "do they even campaign in your house life? I don't see anyone
// campaigning like the old version". The campaign days are the heart of a real week: the
// people on the block get each voter alone and make their case. The engine already writes
// what each nominee argues and how the voter answers (bb/script/lines/campaign.js); these
// pools build the conversation around it (bb/story/write.js writeCampaignScene):
//
//   camp.open                 a (the nominee) gets b (the voter) alone; small talk, then in
//   ...the engine's case and the voter's reply...
//   camp.close.<outcome>      the last push, and how it is left (receptive | unmoved | worn)
//   camp.vdr.<outcome>        b in the Diary Room: where their head really is
//   camp.pdr.<outcome>        a in the Diary Room: how a nominee reads it (not always right)
//
// a never knows b's vote; b knows their own mind. No line names anybody else, because the
// engine's case already did.

const D = (id, by, dr) => ({ id, turns: [{ by, dr }] });

export default {
  'camp.open': [
    { id: 'cpg.o1', turns: [{ beat: '{a} waits until the room clears, then sits down on the end of {b}’s bed.' }, { by: 'b', say: "I wondered when you'd come and find me." }, { by: 'a', say: "Have you got five minutes?" }, { by: 'b', say: "For you? Go on." }] },
    { id: 'cpg.o2', room: 'storage-room', turns: [{ beat: 'The storage room. {a} follows {b} in and pulls the door to.' }, { by: 'b', say: "Subtle." }, { by: 'a', say: "I've got about two minutes before somebody needs cereal." }, { by: 'b', say: "Then talk fast." }] },
    { id: 'cpg.o3', room: 'backyard', turns: [{ beat: 'The backyard. {b} is on the hammock. {a} sits down on the grass beside it.' }, { by: 'a', say: "Can I steal you?" }, { by: 'b', say: "You've already sat down." }, { by: 'a', say: "Then I've already stolen you." }] },
    { id: 'cpg.o4', turns: [{ beat: '{a} catches {b} on the way out of the bathroom.' }, { by: 'a', say: "Hey. Can we talk? Properly?" }, { by: 'b', say: "Is this the talk?" }, { by: 'a', say: "This is the talk." }] },
    { id: 'cpg.o5', room: 'kitchen', turns: [{ beat: 'The kitchen, late. {b} is washing up. {a} picks up a towel and starts drying without being asked.' }, { by: 'b', say: "You're drying. You never dry." }, { by: 'a', say: "I'm on the block. I dry now." }, { by: 'b', say: "Fair. Go on, then." }] },
    { id: 'cpg.o6', room: 'bedroom', turns: [{ beat: 'Bedroom, lights low. {a} crouches by {b}’s bed and whispers.' }, { by: 'a', say: "Are you awake?" }, { by: 'b', say: "I am now." }, { by: 'a', say: "Sorry. It can't wait." }] },
    { id: 'cpg.o7', turns: [{ beat: '{a} has been circling {b} all afternoon. Finally, {b} is alone.' }, { by: 'b', say: "You've been waiting for me to be on my own." }, { by: 'a', say: "Is it that obvious?" }, { by: 'b', say: "It's the campaign. Everyone's doing it. Sit down." }] },
    { id: 'cpg.o8', room: 'backyard', turns: [{ beat: 'The backyard. {a} and {b} are doing laps of the yard, side by side, keeping their voices down.' }, { by: 'a', say: "I'm not going to waste your time." }, { by: 'b', say: "You never do." }] },
    { id: 'cpg.o9', room: 'bedroom', turns: [{ beat: 'Bedroom. {a} knocks on the door frame even though the door is open.' }, { by: 'b', say: "Since when do you knock?" }, { by: 'a', say: "Since I need something from you." }, { by: 'b', say: "At least you're honest. Come in." }] },
    { id: 'cpg.o10', room: 'living-room', turns: [{ beat: 'Living room, after everyone else has gone to bed. {a} sits down at the other end of {b}’s sofa.' }, { by: 'b', say: "Campaign hours?" }, { by: 'a', say: "Campaign hours." }] },
    { id: 'cpg.o11', room: 'kitchen', turns: [{ beat: 'Kitchen, early. {a} has made {b} a coffee and slides it over.' }, { by: 'b', say: "This is a bribe." }, { by: 'a', say: "It's a coffee. The bribe comes after." }, { by: 'b', say: "...I'm listening." }] },
    { id: 'cpg.o12', turns: [{ beat: '{a} sits down beside {b} and does not say anything for a moment.' }, { by: 'b', say: "You've got your speech face on." }, { by: 'a', say: "I don't have a speech. I have about three sentences." }, { by: 'b', say: "Then let's hear them." }] },
    { id: 'cpg.o13', room: 'storage-room', turns: [{ beat: 'The storage room. {b} is counting tins. {a} slips in and leans on the shelf.' }, { by: 'a', say: "Find anything good?" }, { by: 'b', say: "Beans. Lots of beans." }, { by: 'a', say: "Can I have a minute with you, away from the beans?" }] },
    { id: 'cpg.o14', room: 'backyard', turns: [{ beat: 'The backyard, by the pool. {a} sits down and puts both feet in the water next to {b}.' }, { by: 'b', say: "It's cold, isn't it?" }, { by: 'a', say: "Freezing. I'm not moving, though. I need to say something." }] },
  ],
  'camp.close.receptive': [
    { id: 'cpg.cr1', turns: [{ by: 'a', say: "That's all I'm asking. Just think about it." }, { by: 'b', say: "I will. Honestly, I will." }, { beat: '{a} stands up, squeezes {b}’s shoulder, and goes.' }] },
    { id: 'cpg.cr2', turns: [{ by: 'a', say: "So where are you at?" }, { by: 'b', say: "Closer to you than I was this morning." }, { by: 'a', say: "I'll take closer." }] },
    { id: 'cpg.cr3', turns: [{ by: 'b', say: "Don't tell anyone we had this conversation." }, { by: 'a', say: "What conversation?" }, { by: 'b', say: "Exactly." }] },
    { id: 'cpg.cr4', turns: [{ by: 'a', say: "Can I count on you?" }, { by: 'b', say: "Give me till Thursday. But it's looking good." }, { beat: '{a} nods, very carefully, like any sudden movement might change {b}’s mind.' }] },
    { id: 'cpg.cr5', turns: [{ by: 'b', say: "You've made a better case than I expected." }, { by: 'a', say: "Is that a compliment?" }, { by: 'b', say: "It's an opening." }] },
    { id: 'cpg.cr6', turns: [{ by: 'a', say: "I'll let you sleep on it." }, { by: 'b', say: "I don't think I'll sleep much. But yeah. I hear you." }] },
    { id: 'cpg.cr7', turns: [{ by: 'a', say: "Am I wasting my breath?" }, { by: 'b', say: "No. You're not." }, { by: 'a', say: "Then I'll stop talking while I'm ahead." }] },
    { id: 'cpg.cr8', turns: [{ by: 'a', say: "One vote. That's all I need from you." }, { by: 'b', say: "You might have it." }, { by: 'a', say: "Might is more than I had an hour ago." }] },
    { id: 'cpg.cr9', turns: [{ by: 'b', say: "I need to talk to a couple of people first." }, { by: 'a', say: "That's fine. Just remember who came to you first." }, { by: 'b', say: "I'll remember." }] },
    { id: 'cpg.cr10', turns: [{ beat: 'There is a long pause. {b} looks at the floor, then at {a}.' }, { by: 'b', say: "Yeah. Alright. I'm thinking about it." }, { by: 'a', say: "That's all I wanted." }] },
  ],
  'camp.close.unmoved': [
    { id: 'cpg.cu1', turns: [{ by: 'a', say: "So is there anything I can say?" }, { by: 'b', say: "You've said it. I heard it." }, { beat: 'Which is not the same as yes, and both of them know it.' }] },
    { id: 'cpg.cu2', turns: [{ by: 'a', say: "Just promise me you'll think about it." }, { by: 'b', say: "I'll think about it." }, { beat: '{b} says it the way people say they’ll call.' }] },
    { id: 'cpg.cu3', turns: [{ by: 'b', say: "I'm not going to lie to you and tell you it's a yes." }, { by: 'a', say: "I'd rather you didn't." }, { by: 'b', say: "Then it's not a yes." }] },
    { id: 'cpg.cu4', turns: [{ by: 'a', say: "Is it already decided?" }, { by: 'b', say: "Nothing's decided until Thursday." }, { by: 'a', say: "That's what people say when it's decided." }] },
    { id: 'cpg.cu5', turns: [{ by: 'b', say: "I like you. I want you to know that." }, { by: 'a', say: "But." }, { by: 'b', say: "...But." }] },
    { id: 'cpg.cu6', turns: [{ by: 'a', say: "Okay. I'll leave you alone." }, { by: 'b', say: "You don't have to." }, { by: 'a', say: "I think I do." }, { beat: '{a} goes. {b} lets out a long breath.' }] },
    { id: 'cpg.cu7', turns: [{ by: 'b', say: "You're good at this, you know." }, { by: 'a', say: "Not good enough, by the look on your face." }, { by: 'b', say: "My face is just tired." }] },
    { id: 'cpg.cu8', turns: [{ by: 'a', say: "If you change your mind..." }, { by: 'b', say: "You'll be the first to know." }, { beat: 'Neither of them believes it.' }] },
    { id: 'cpg.cu9', turns: [{ by: 'a', say: "You've gone quiet." }, { by: 'b', say: "I'm listening." }, { by: 'a', say: "You're being polite. That's different." }] },
    { id: 'cpg.cu10', turns: [{ by: 'b', say: "I've got to go. People will notice." }, { by: 'a', say: "Let them notice. I'm fighting for my life here." }, { by: 'b', say: "I know you are. I'm sorry." }] },
  ],
  'camp.close.worn': [
    { id: 'cpg.cw1', turns: [{ by: 'b', say: "You're not going to stop, are you?" }, { by: 'a', say: "Not till Thursday." }, { by: 'b', say: "...Fine. You've got a point. I'll think about it properly." }] },
    { id: 'cpg.cw2', turns: [{ by: 'b', say: "Second time today." }, { by: 'a', say: "Third, actually." }, { by: 'b', say: "And somehow it's working. Don't tell anyone." }] },
    { id: 'cpg.cw3', turns: [{ by: 'a', say: "I just need you to hear it one more time." }, { by: 'b', say: "I've heard it. I think I actually heard it this time." }] },
    { id: 'cpg.cw4', turns: [{ beat: '{b} rubs both eyes.' }, { by: 'b', say: "Okay. You win. I'm listening now." }, { by: 'a', say: "That's all I ever wanted." }] },
    { id: 'cpg.cw5', turns: [{ by: 'b', say: "You've worn me down." }, { by: 'a', say: "Is that a good thing?" }, { by: 'b', say: "For you? Yeah." }] },
    { id: 'cpg.cw6', presumes: ['noms'], turns: [{ by: 'a', say: "Same argument as yesterday." }, { by: 'b', say: "Funny. It sounds better today." }] },
  ],
  'camp.vdr.receptive': [
    D('cpd.vr1', 'b', "I walked into that conversation voting one way. I'm not sure any more. {a} made a real point."),
    D('cpd.vr2', 'b', "{a} said something I can't stop thinking about. That's dangerous on a campaign week."),
    D('cpd.vr3', 'b', "I didn't expect {a} to change my mind. {a} might have."),
    D('cpd.vr4', 'b', "Honestly? {a} had a better argument than the people telling me how to vote."),
    D('cpd.vr5', 'b', "Everybody comes to you on the block. Most of it is noise. That wasn't noise."),
    D('cpd.vr6', 'b', "I've got a decision to make now. Two days ago I didn't."),
    D('cpd.vr7', 'b', "{a} didn't beg. {a} made sense. That's harder to say no to."),
    D('cpd.vr8', 'b', "I'm going to have to have some uncomfortable conversations before Thursday."),
  ],
  'camp.vdr.unmoved': [
    D('cpd.vu1', 'b', "{a} gave it everything. I respect it. It doesn't change my vote."),
    D('cpd.vu2', 'b', "I like {a}. I'm still voting the way I was voting."),
    D('cpd.vu3', 'b', "{a} came in with a good speech. I came in with my mind made up."),
    D('cpd.vu4', 'b', "It's hard looking someone in the eye when you know you're going to vote them out."),
    D('cpd.vu5', 'b', "{a} doesn't know where my vote is going. I'd like to keep it that way."),
    D('cpd.vu6', 'b', "Nice try. Genuinely. Nice try."),
    D('cpd.vu7', 'b', "I felt bad the whole time. Not bad enough to change anything."),
    D('cpd.vu8', 'b', "{a} has nobody left to campaign to who'll say yes. I think {a} knows."),
  ],
  'camp.vdr.worn': [
    D('cpd.vw1', 'b', "I said no the first time. {a} came back. Persistence counts for something in here."),
    D('cpd.vw2', 'b', "{a} caught me twice. The second time, it landed."),
    D('cpd.vw3', 'b', "I didn't change my mind because of the speech. I changed it because {a} kept fighting."),
    D('cpd.vw4', 'b', "Okay. {a} got to me. I don't love admitting that."),
    D('cpd.vw5', 'b', "You hear something once, you dismiss it. You hear it twice, you start checking."),
  ],
  'camp.pdr.receptive': [
    D('cpd.pr1', 'a', "I think that landed. I saw {b}’s face change. That's my first good moment all week."),
    D('cpd.pr2', 'a', "{b} didn't say yes. But {b} didn't say no. On the block, that's a win."),
    D('cpd.pr3', 'a', "One conversation at a time. That one went well. I think."),
    D('cpd.pr4', 'a', "{b} is thinking about it. Thinking is all I need. Then it's counting."),
    D('cpd.pr5', 'a', "For the first time since that key turned, I feel like I've got a chance."),
  ],
  'camp.pdr.unmoved': [
    D('cpd.pu1', 'a', "That was a wall. A friendly wall. But a wall."),
    D('cpd.pu2', 'a', "I think that went well? I can't tell. Everybody's nice to you when you're on the block."),
    D('cpd.pu3', 'a', "{b} wouldn't look at me when I asked. That's never good."),
    D('cpd.pu4', 'a', "I said everything I came to say. I'm not sure any of it went in."),
    D('cpd.pu5', 'a', "Every conversation, I'm trying to read the vote off their face. {b}’s face gave me nothing."),
    D('cpd.pu6', 'a', "I think {b} is with me. I think. I hope."),
  ],
};
