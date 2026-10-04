// ══════════════════════════════════════════════════════════════════════
// bb/script/lines/followup.js — unfinished business (Phase 6)
// ══════════════════════════════════════════════════════════════════════
//
// The words for bb-events/story-followups.js: scenes that only happen because
// an earlier one left something unsaid, inside the two weeks after it.
//
//   followup.isolation   a was left alone on the block; b kept away (kitchen)   honest | guarded
//   followup.overheard   a overheard b plotting in the storage room (living room)   admits | denies
//   followup.damage      a caught b lying; b tries to fix it (storage room)      owns | digs
//   followup.aftershock  a is hurt after a fight with {target}; b sits with a (bedroom)   scene

export default {
  'followup.isolation.honest': [
    { id: 'fi.h1', turns: [{ by: 'b', say: "I owe you an apology. I kept my distance this week." }, { by: 'a', say: "Was it personal, or the game?" }, { by: 'b', say: "The game. But that doesn't make it okay." }] },
    { id: 'fi.h2', turns: [{ by: 'a', say: "Why did you stop talking to me after nominations?" }, { by: 'b', say: "Because I was scared." }, { by: 'a', say: "Of what?" }, { by: 'b', say: "Of being next." }] },
    { id: 'fi.h3', turns: [{ beat: '{b} brings {a} a coffee.' }, { by: 'b', say: "I handled this badly." }, { by: 'a', say: "Yes, you did." }, { by: 'b', say: "Can I sit down?" }, { by: 'a', say: "...Go on." }] },
    { id: 'fi.h4', turns: [{ by: 'a', say: "Being ignored was worse than being nominated." }, { by: 'b', say: "I'm sorry. I really am." }] },
    { id: 'fi.h5', turns: [{ by: 'b', dr: "I avoided {a} all week. I finally said sorry. {a} didn't have to accept it, but {a} did listen." }] },
    { id: 'fi.h6', turns: [{ by: 'a', dr: "{b} actually owned it. That's more than anyone else has done." }] },
    { id: 'fi.h7', turns: [{ by: 'b', say: "I should have sat with you this week. I didn't. I'm sorry." }, { by: 'a', say: "Thank you for saying it." }] },
    { id: 'fi.h8', turns: [{ by: 'a', say: "Did you think I was going home?" }, { by: 'b', say: "Honestly? Yes. So I kept away. That was wrong." }] },
    { id: 'fi.h9', turns: [{ by: 'b', say: "Can we start again?" }, { by: 'a', say: "We can try." }] },
  ],
  'followup.isolation.guarded': [
    { id: 'fi.g1', turns: [{ by: 'a', say: "Why did you disappear after nominations?" }, { by: 'b', say: "Everyone needed space." }, { by: 'a', say: "Funny how I was the only one who had to take it." }] },
    { id: 'fi.g2', turns: [{ by: 'b', say: "It was just a strange week." }, { by: 'a', say: "It's been a strange week for a while now." }] },
    { id: 'fi.g3', turns: [{ by: 'a', say: "I want the truth." }, { by: 'b', say: "The truth is, it's a game." }, { by: 'a', dr: "That's not an answer. That's an excuse." }] },
    { id: 'fi.g4', turns: [{ by: 'b', say: "None of it was really my choice." }, { by: 'a', say: "Whose choice was it, then?" }, { beat: '{a} gets up and leaves.' }] },
    { id: 'fi.g5', turns: [{ by: 'a', dr: "{b} came to clear the air and just made it worse." }] },
    { id: 'fi.g6', turns: [{ by: 'b', dr: "I tried to explain myself to {a}. I don't think it came out right." }] },
    { id: 'fi.g7', turns: [{ by: 'a', say: "You walked out every time I walked in." }, { by: 'b', say: "That's not true." }, { by: 'a', say: "Every single time." }] },
    { id: 'fi.g8', turns: [{ by: 'b', say: "You know how it is when someone's on the block." }, { by: 'a', say: "I do now." }] },
    { id: 'fi.g9', turns: [{ by: 'a', dr: "{b} is acting like nothing happened. Something happened. I was there." }] },
  ],
  'followup.overheard.admits': [
    { id: 'fh2.a1', turns: [{ by: 'a', say: "What were you planning in the storage room?" }, { by: 'b', say: "You heard that?" }, { by: 'a', say: "Every word." }, { by: 'b', say: "Then I won't pretend I didn't say it." }] },
    { id: 'fh2.a2', turns: [{ by: 'a', say: "I heard my name through the storage room door." }, { by: 'b', say: "Yes. I said it. I was thinking about putting you up." }] },
    { id: 'fh2.a3', turns: [{ by: 'a', say: "Were you planning to come after me?" }, { by: 'b', say: "The plan was real. The timing wasn't." }, { by: 'a', say: "That's supposed to make me feel better?" }] },
    { id: 'fh2.a4', turns: [{ by: 'a', say: "Do you want to talk about this privately?" }, { by: 'b', say: "No. Here is fine." }] },
    { id: 'fh2.a5', turns: [{ by: 'b', dr: "{a} heard me. I'm not going to lie about it. Yes, I was thinking about going after {a}." }] },
    { id: 'fh2.a6', turns: [{ by: 'a', dr: "At least {b} admitted it. Now I know exactly where I stand." }] },
    { id: 'fh2.a7', turns: [{ by: 'b', say: "Yes, your name came up. It's a game. Your name comes up." }, { by: 'a', say: "It came up from you." }] },
    { id: 'fh2.a8', turns: [{ by: 'a', say: "So it's true?" }, { by: 'b', say: "It's true. I'm not going to insult you by lying." }] },
  ],
  'followup.overheard.denies': [
    { id: 'fh2.d1', turns: [{ by: 'a', say: "I heard you in the storage room." }, { by: 'b', say: "I don't know what you think you heard." }, { by: 'a', say: "My name." }, { by: 'b', say: "That wasn't about you." }] },
    { id: 'fh2.d2', turns: [{ by: 'b', say: "It was a misunderstanding." }, { by: 'a', say: "Which word did I misunderstand?" }] },
    { id: 'fh2.d3', turns: [{ by: 'b', say: "You only heard half of it." }, { by: 'a', say: "Then tell me the other half." }, { beat: '{b} has nothing to say.' }] },
    { id: 'fh2.d4', turns: [{ by: 'b', say: "You can't hear properly through those doors." }, { by: 'a', say: "I heard properly." }] },
    { id: 'fh2.d5', turns: [{ by: 'a', dr: "{b} looked me in the eye and denied it. Then got a detail wrong that I never even mentioned." }] },
    { id: 'fh2.d6', turns: [{ by: 'b', dr: "{a} heard more than I thought. I should have kept my voice down." }] },
    { id: 'fh2.d7', turns: [{ by: 'b', say: "I was talking about someone else." }, { by: 'a', say: "Who?" }, { by: 'b', say: "...It doesn't matter." }] },
    { id: 'fh2.d8', turns: [{ by: 'a', say: "Just admit it." }, { by: 'b', say: "There's nothing to admit." }, { by: 'a', dr: "There's plenty to admit." }] },
  ],
  'followup.damage.owns': [
    { id: 'fm.o1', turns: [{ by: 'b', say: "I lied to you. I know I did." }, { by: 'a', say: "Why?" }, { by: 'b', say: "Because I panicked. Ask me anything now. I'll answer." }] },
    { id: 'fm.o2', turns: [{ by: 'b', say: "It looked bad because it was bad. I'm sorry." }, { by: 'a', say: "...Okay. Keep talking." }] },
    { id: 'fm.o3', turns: [{ by: 'b', say: "Here's one name you can check. Go and ask." }, { by: 'a', say: "I will." }] },
    { id: 'fm.o4', turns: [{ by: 'a', dr: "{b} finally told me the truth. I'm not forgiving {b}. But I'm listening." }] },
    { id: 'fm.o5', turns: [{ by: 'b', dr: "No more stories. I told {a} the truth. It was the only move I had left." }] },
    { id: 'fm.o6', turns: [{ by: 'a', say: "Why should I believe you now?" }, { by: 'b', say: "Don't. Check it yourself." }] },
    { id: 'fm.o7', turns: [{ by: 'b', say: "You were right. I wasn't straight with you." }, { by: 'a', say: "What else haven't you been straight about?" }, { by: 'b', say: "Nothing. Ask me anything." }] },
    { id: 'fm.o8', turns: [{ by: 'a', dr: "{b} admitted it. That doesn't fix it. But it's a start." }] },
  ],
  'followup.damage.digs': [
    { id: 'fm.d1', turns: [{ by: 'b', say: "Let me clear things up." }, { beat: '{b} tells the same story again, just tidier.' }, { by: 'a', say: "That's the same story." }] },
    { id: 'fm.d2', turns: [{ by: 'b', say: "Everyone makes overlapping promises in here." }, { by: 'a', say: "Then why do yours need so much explaining?" }] },
    { id: 'fm.d3', turns: [{ by: 'a', say: "You still haven't answered my question." }, { by: 'b', say: "I have." }, { by: 'a', say: "No. You answered a different one." }] },
    { id: 'fm.d4', turns: [{ by: 'b', say: "I've got dates, names, everything." }, { by: 'a', say: "None of that explains why you lied." }] },
    { id: 'fm.d5', turns: [{ by: 'a', dr: "{b} came to fix it and just made it worse." }] },
    { id: 'fm.d6', turns: [{ by: 'b', dr: "I thought I could talk my way out of it with {a}. I was wrong." }] },
    { id: 'fm.d7', turns: [{ by: 'b', say: "You've got it all wrong." }, { by: 'a', say: "Then explain it." }, { beat: '{b} explains. It does not help.' }] },
    { id: 'fm.d8', turns: [{ by: 'b', say: "Can we just move on?" }, { by: 'a', say: "Not until you tell me the truth." }, { by: 'b', say: "I have." }, { by: 'a', say: "You haven't." }] },
    { id: 'fm.d9', turns: [{ by: 'a', dr: "Every time {b} explains, the story gets a bit longer and a bit less true." }] },
    { id: 'fm.d10', turns: [{ by: 'b', say: "Who told you that, anyway?" }, { by: 'a', say: "Don't change the subject." }] },
    { id: 'fm.d11', turns: [{ by: 'b', say: "I never actually lied. I just didn't tell you everything." }, { by: 'a', say: "That's the same thing in here." }] },
    { id: 'fm.d12', turns: [{ by: 'a', say: "Stop. Every time you explain, it gets worse." }, { by: 'b', say: "I'm just trying to..." }, { by: 'a', say: "I know what you're trying to do." }] },
    { id: 'fm.d13', turns: [{ by: 'b', dr: "{a} won't let it go. I've explained it three times. Maybe that's the problem." }] },
  ],
  'followup.aftershock.scene': [
    { id: 'fk.1', turns: [{ by: 'b', say: "Which part hurt the most?" }, { by: 'a', say: "When people laughed." }, { by: 'b', say: "Not everyone laughed." }] },
    { id: 'fk.2', turns: [{ beat: '{a} folds clothes much too hard. {b} starts helping.' }, { by: 'a', say: "I shouldn't have said that last bit." }, { by: 'b', say: "Probably not. But {target} started it." }] },
    { id: 'fk.3', turns: [{ by: 'a', say: "I'm over it." }, { by: 'b', say: "Then why are you still awake talking about it?" }] },
    { id: 'fk.4', turns: [{ by: 'b', say: "Do you want to know who stood up for you after you left?" }, { by: 'a', say: "...Who?" }, { by: 'b', say: "More people than you think." }] },
    { id: 'fk.5', turns: [{ by: 'a', dr: "The fight with {target} keeps playing in my head. {b} sat with me until it stopped." }] },
    { id: 'fk.6', turns: [{ by: 'b', dr: "{a} is still shaking after that fight with {target}. I'm not leaving {a} on {a.posAdj} own tonight." }] },
    { id: 'fk.7', turns: [{ by: 'b', say: "Do you want a hug or do you want to vent?" }, { by: 'a', say: "Vent." }, { by: 'b', say: "Go on, then." }] },
    { id: 'fk.8', turns: [{ by: 'a', say: "Was I out of line?" }, { by: 'b', say: "A bit. So was {target}. More than a bit." }] },
    { id: 'fk.9', turns: [{ by: 'a', say: "Everyone saw that." }, { by: 'b', say: "Everyone saw {target} start it, too." }] },
    { id: 'fk.10', turns: [{ beat: '{b} sits on the end of the bed.' }, { by: 'b', say: "You okay?" }, { by: 'a', say: "No. But I will be." }] },
    { id: 'fk.11', turns: [{ by: 'a', dr: "After the fight with {target}, I wanted to hide. {b} came and found me." }] },
    { id: 'fk.12', turns: [{ by: 'a', say: "I can't stop shaking." }, { by: 'b', say: "That's the adrenaline. Breathe. I'm here." }] },
    { id: 'fk.13', turns: [{ by: 'b', say: "Want me to get you some water?" }, { by: 'a', say: "Please." }, { by: 'a', dr: "{b} didn't ask about the fight with {target}. {b} just looked after me." }] },
    { id: 'fk.14', turns: [{ by: 'a', say: "I hate that it got that loud." }, { by: 'b', say: "It happens. It's that kind of house." }] },
  ],
};
