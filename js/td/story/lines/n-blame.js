// Whole conversations for existing events. Roles and outcomes come from the simulator.
export default {
  "story.chal.lost": [
    { id: "nbw.l1", place: "public", turns: [
      {"by":"a","say":"You had our lowest score, {b}. What are we supposed to do with that?"},
      {"by":"b","say":"Tell me what to improve. You can do that without announcing me to the whole camp."},
      {"by":"a","say":"Everybody here saw the challenge."},
      {"by":"c","say":"Then everybody saw a team lose. Let {b} answer before you finish the speech."},
      {"by":"b","say":"I want another chance. I also want teammates who actually want me to do well."},
      {"by":"b","conf":"The score was bad enough. Having to ask whether my own team wants me to recover? That was worse."}
    ] },
    { id: "nbw.l2", place: "public", when: {"streak":["two","many"]}, turns: [
      {"by":"a","say":"{streak} losses in a row, and now this score. How long are we supposed to stay cheerful?"},
      {"by":"b","say":"Nobody asked you to be cheerful. Just stop making me responsible for the whole streak."},
      {"by":"a","say":"I'm talking about today."},
      {"by":"c","say":"Then why did you open with the streak?"},
      {"by":"b","say":"Exactly. My score today is mine. You don't get to hand me every loss because it makes the meeting shorter."},
      {"by":"c","conf":"I can admit {b} struggled without letting {a} rewrite the other challenges."}
    ] },
    { id: "nbw.l3", place: "public", when: {"voice":["dry","schemer","calm"]}, turns: [
      {"by":"a","say":"I'd love to hear the explanation for that score."},
      {"by":"b","say":"Would you? Or have you already picked the part where you interrupt?"},
      {"by":"c","say":"Let {b} finish. I want an explanation too."},
      {"by":"b","say":"I did badly. I need to work out how to do better, and I need about five minutes without an audience."},
      {"by":"a","say":"Five minutes doesn't change the result."},
      {"by":"b","say":"Neither does this conversation, but you seem very committed to it."},
      {"by":"c","conf":"I wanted {b} to take the result seriously. {b} did. Now I want {a} to notice."}
    ] },
    { id: "nbw.l4", place: "public", when: {"voice":["loud","tough","competitive"]}, turns: [
      {"by":"a","say":"I hate losing, {b}. I hate coming back here knowing we could have done better."},
      {"by":"b","say":"You think I enjoyed seeing my score?"},
      {"by":"a","say":"Then give me something besides excuses."},
      {"by":"c","say":"What excuse? {b} asked you a question."},
      {"by":"b","say":"I know I let the team down. I'm still on the team. Talk to me like it."},
      {"by":"b","conf":"I can take criticism. I'm having a much harder time taking orders from someone who thinks volume counts as leadership."}
    ] },
    { id: "nbw.l5", place: "public", when: {"voice":["warm","earnest","emotional"]}, turns: [
      {"by":"a","say":"I want you to feel included, {b}. I also need to know we can count on you."},
      {"by":"b","say":"You said those two things like I have to choose one."},
      {"by":"a","say":"That's not what I meant. Your score scared me."},
      {"by":"c","say":"Then ask what would help. Don't make {b} audition to be a teammate."},
      {"by":"b","say":"Ask me what I need next time. I can answer that. I can't promise to magically stop having bad days."},
      {"by":"a","conf":"I thought saying it gently would make it easier. Then {b} said it sounded like being included and being reliable were two different choices. I had to hear that."}
    ] }
  ],
  "story.chal.regroup": [
    { id: "nbw.r1", place: "public", turns: [
      {"by":"b","say":"If this is another meeting about who disappointed everyone, I know where to sit."},
      {"by":"a","say":"Sit next to me. We need to work out what you can do better."},
      {"by":"b","say":"That sounds suspiciously like the same meeting."},
      {"by":"c","say":"Except this time you get to tell us what help you need."},
      {"by":"b","say":"Can we decide what we're doing before everyone starts giving different instructions?"},
      {"by":"a","say":"Yes. One plan, and we check that everybody actually understands it."},
      {"by":"b","conf":"I was ready to defend myself. Being asked what I needed threw me completely. I almost forgot I had an answer."}
    ] },
    { id: "nbw.r2", place: "public", turns: [
      {"by":"b","say":"I had the lowest score. You can say it."},
      {"by":"a","say":"You just did. Now tell me which part you want help with."},
      {"by":"c","say":"I can stay while we figure it out. Nobody needs to perform for the cameras."},
      {"by":"b","say":"Can I think for a minute without someone deciding I'm making excuses?"},
      {"by":"a","say":"Take the minute. I'd rather hear a useful answer than a fast apology."},
      {"by":"b","conf":"I still feel awful about the challenge. But {a} waited for me to think, and {c} stayed. That made it easier to actually talk."}
    ] },
    { id: "nbw.r3", place: "public", when: {"voice":["goofy","dry","chaotic"]}, turns: [
      {"by":"a","say":"Team meeting. Attendance is compulsory; dramatic resignations are limited to one each."},
      {"by":"b","say":"Can I use mine now?"},
      {"by":"c","say":"Save it. We have not even chosen who takes the minutes."},
      {"by":"a","say":"Fine, no minutes. {b}, what would make the next challenge easier to handle?"},
      {"by":"b","say":"Less pressure to say I understand before I actually do."},
      {"by":"c","say":"Then we make time for questions. Including the ones we think sound stupid."},
      {"by":"b","conf":"I expected a joke at my expense. Getting to make the joke myself helped me say what was actually bothering me."}
    ] },
    { id: "nbw.r4", place: "public", when: {"streak":"many"}, turns: [
      {"by":"c","say":"{streak} losses. I'm running out of encouraging things to say."},
      {"by":"a","say":"Then don't give a speech. Sit with us and help us figure this out."},
      {"by":"b","say":"Even if I don't have a brilliant answer?"},
      {"by":"a","say":"Especially then. I'd like one conversation where we admit we don't know everything."},
      {"by":"c","say":"I can offer an extremely thorough list of things I don't know."},
      {"by":"b","say":"Good. I thought I was going to have to write the whole thing."},
      {"by":"c","conf":"Nobody promised we would win the next one. We just stayed and talked instead of leaving {b} alone with the result."}
    ] }
  ],
  "long.crowd.lost.any": [
    { id: "nbw.c1", place: "public", turns: [
      {"by":"a","say":"So, {b}. Lowest score. Are we discussing that, or am I supposed to pretend I missed it?"},
      {"by":"b","say":"Discuss it. Just leave room for me to speak."},
      {"by":"a","say":"I'm listening."},
      {"by":"c","say":"You're standing over {b} with your arms folded. Try listening from over here."},
      {"by":"b","say":"I know I did badly. What I don't know is whether you want me to improve or just look worse than you."},
      {"by":"a","say":"I want us to win."},
      {"by":"c","say":"Then let us talk about what helps {b} do better."},
      {"by":"b","conf":"{c} didn't pretend my score was good. That's why the defense mattered. I needed someone to stop the pile-on, not lie for me."}
    ] },
    { id: "nbw.c2", place: "public", when: {"voice":["cruel","proud"]}, turns: [
      {"by":"a","say":"Congratulations, {b}. You managed to become the main topic of our team meeting."},
      {"by":"b","say":"And you managed to make yourself the host. Was there an audition?"},
      {"by":"c","say":"I'd have voted for a quieter host."},
      {"by":"a","say":"Someone has to address that performance."},
      {"by":"b","say":"Address it, then. You have spent more time introducing the complaint than explaining it."},
      {"by":"c","conf":"I want {b} to improve. I also enjoyed watching {a} lose control of a meeting nobody asked for."}
    ] },
    { id: "nbw.c3", place: "public", when: {"voice":["warm","earnest","anxious"]}, turns: [
      {"by":"a","say":"I'm worried about how today went, {b}. I need you to understand that."},
      {"by":"b","say":"I understand. I saw my score too."},
      {"by":"a","say":"I know. I just need to hear that you care."},
      {"by":"c","say":"Look at {b}. You don't need a bigger apology to prove that."},
      {"by":"b","say":"I care enough that this is humiliating. Can we work on the problem before you ask me to feel worse?"},
      {"by":"a","say":"Okay. Tell me what would help."},
      {"by":"b","conf":"{a} was scared about losing. I get that. But I was the one standing there trying not to fall apart, and I needed {c} to say it."}
    ] },
    { id: "nbw.c4", place: "public", turns: [
      {"by":"b","say":"Before the meeting starts: yes, I saw my score. No, I'm not happy with it."},
      {"by":"a","say":"You don't get to write both sides of the conversation."},
      {"by":"b","say":"Then stop looking so disappointed that I used your opening line."},
      {"by":"c","say":"We could skip the opening and get to something useful."},
      {"by":"a","say":"Fine. What changes next time?"},
      {"by":"b","say":"For a start, I tell you when I need help instead of worrying you will turn it into this."},
      {"by":"c","conf":"That was an actual answer. Uncomfortable for {a}, but an actual answer."}
    ] },
    { id: "nbw.c5", place: "public", when: {"voice":["loud","tough","competitive","bossy"]}, turns: [
      {"by":"a","say":"Everybody listen. We can't keep acting like that result is acceptable."},
      {"by":"b","say":"Who accepted it? Show me the person celebrating."},
      {"by":"c","say":"Nobody is celebrating. You're shouting at people who are already upset."},
      {"by":"a","say":"Because being upset doesn't win challenges!"},
      {"by":"b","say":"Neither does making us sit through your angry acceptance speech for team captain."},
      {"by":"c","say":"You want to lead? Ask {b} a question and wait for the answer."},
      {"by":"b","conf":"My score gave {a} something real to complain about. It didn't automatically put {a} in charge of me."}
    ] },
    { id: "nbw.c6", place: "public", when: {"voice":["dry","schemer","calm"]}, turns: [
      {"by":"a","say":"I have a concern about our chances if today is what we can expect from {b}."},
      {"by":"b","say":"Then ask me about today. Don't turn one score into a prediction of my entire life."},
      {"by":"c","say":"That's fair. What do you actually want to know, {a}?"},
      {"by":"a","say":"Whether we can rely on {b} under pressure."},
      {"by":"b","say":"You can rely on me to admit I did badly. Can I rely on you to help me improve?"},
      {"by":"c","say":"I'd like to hear the answer to that one too."},
      {"by":"a","conf":"I came in wanting {b} to answer for the result. Now {c} is waiting for my answer. That's irritatingly effective."}
    ] },
    { id: "nbw.c7", place: "public", when: {"age":"teen"}, turns: [
      {"by":"a","say":"That score is going to be very hard to explain, {b}."},
      {"by":"b","say":"To who? You're the only one doing a press conference."},
      {"by":"c","say":"I do have a question. When does the press conference end?"},
      {"by":"a","say":"When we work out how not to lose."},
      {"by":"b","say":"Great. Ask me what I'd change instead of telling everyone I was bad. We covered that part at the challenge."},
      {"by":"c","conf":"{b} is embarrassed, {a} is angry, and somehow I'm moderating. I should have walked back slower."}
    ] },
    { id: "nbw.c8", place: "public", when: {"age":["thirties","older"]}, turns: [
      {"by":"a","say":"Let us be adults about this. Your performance hurt the team, {b}."},
      {"by":"b","say":"Adults can hear an answer without rolling their eyes. Can we start there?"},
      {"by":"c","say":"We can. {a}, give {b} a minute."},
      {"by":"a","say":"I'm trying to have a serious conversation."},
      {"by":"b","say":"So am I. I want to know what we can change, not whether you approve of my apology."},
      {"by":"c","say":"Then we talk about the next challenge. No one has to ask permission to finish a sentence."},
      {"by":"b","conf":"Being spoken to like a child really makes you appreciate the one person who says you can finish talking."}
    ] }
  ],
  "long.blame.loss.any": [
    { id: "nbw.b1", place: "public", turns: [
      {"by":"a","say":"I'm still annoyed about the challenge, {b}. I'd rather tell you than let it sit."},
      {"by":"b","say":"Then tell me what bothered you. Don't just say my name like it explains everything."},
      {"by":"a","say":"I need to feel like we have a chance when we compete together."},
      {"by":"b","say":"I want that too. If you have something useful for me, say it. If you just need someone to be angry at, I need a break."},
      {"by":"b","conf":"I stayed for the conversation. That doesn't mean I agreed to stand there while {a} worked through every bad feeling about the loss."}
    ] },
    { id: "nbw.b2", place: "public", when: {"voice":["schemer","cruel"]}, turns: [
      {"by":"a","say":"People are going to remember how that challenge went."},
      {"by":"b","say":"Including me. What is the warning supposed to accomplish?"},
      {"by":"a","say":"I thought you might want to think about how it looks."},
      {"by":"b","say":"I'm thinking about doing better. You seem much more interested in making sure I feel watched."},
      {"by":"a","conf":"{b} noticed exactly what I was doing. I wanted a nervous apology, and I got a very public objection."}
    ] },
    { id: "nbw.b3", place: "public", when: {"voice":["warm","emotional"]}, turns: [
      {"by":"a","say":"I want to talk about the loss before we let it get awkward."},
      {"by":"b","say":"It's already awkward. I can hear how carefully you're choosing every word."},
      {"by":"a","say":"Because I don't want to hurt you. I also can't pretend I'm happy with the result."},
      {"by":"b","say":"You don't have to be happy. I just need to know you still want to work with me."},
      {"by":"a","say":"I do. That's why I came over instead of leaving you alone."},
      {"by":"b","say":"Then stay a minute. I'm not ready to make a big speech about fixing everything."},
      {"by":"a","conf":"I came over expecting to discuss the challenge. {b} wanted to know whether I'd still sit there after a loss. I can do that."}
    ] }
  ]
};
