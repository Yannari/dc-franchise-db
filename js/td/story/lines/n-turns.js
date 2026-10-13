// ══════════════════════════════════════════════════════════════════════
// td/story/lines/n-turns.js — a relationship turns on something somebody did (td/story/turns.js)
// ══════════════════════════════════════════════════════════════════════
// Every scene here happens because of two real things between a and b: an aired setup, and something one of
// them did to the other later (turns.js has the cases and who plays a and b). The data:
//   {remark}  the exact line from the setup, quoted only to or by the person who said it (see each pool)
//   {deed}    what was done, in the words of the person it was done TO ("sat with me when I was falling apart",
//             "took the credit for my work"): said only by them, as "You {deed}" or "{x} {deed}"
//   {thing}   the kit's thing a mockery was about, in the third person ("her astrology"): said ABOUT b, never to b
// Ids: 'ntn.'.
export default {
  // a mocked b; now b has helped a. a has to say thank you, and b gets to enjoy it
  'turn.mockhelp.any': [
    { id: 'ntn.mh1', when: { thing: true, remark: true }, turns: [
      { beat: "{a} finds {b} alone, and takes a moment before speaking." },
      { by: 'a', say: "So. You {deed}." },
      { by: 'b', say: "I did, and you're allowed to say thank you, you know. It doesn't hurt.", v: { dry: "I did. The thank-you goes here, in case you were wondering.", warm: "I did. You don't have to make it a big thing." } },
      { by: 'a', say: "After what I said about you, I figured you'd let me struggle." },
      { by: 'b', say: "“{remark}” Yeah, I remember that, and I did think about letting you struggle, but only for about a second." },
      { by: 'a', say: "Fine, thank you. You could have just stood there and watched, and you didn't." },
      { by: 'b', say: "You're welcome. And I'm still going to talk about it, by the way." },
      { by: 'a', say: "Of course you are." },
      { by: 'a', conf: "I made fun of {b} for {thing}, and then {b} {deed}. I said thank you. I meant it, which is the annoying part." },
    ] },
    { id: 'ntn.mh2', when: { thing: true }, turns: [
      { by: 'b', say: "Before you say anything, no, I'm not going to make you apologise." },
      { by: 'a', say: "I wasn't going to apologise, I was going to say thanks, because you {deed} and I noticed." },
      { by: 'b', say: "That's almost an apology, coming from you." },
      { by: 'a', say: "Don't push it." },
      { by: 'b', say: "And next time I bring up the thing you think is ridiculous?" },
      { by: 'a', say: "I'll probably still think it's ridiculous. I'll just say it a bit quieter.", v: { cruel: "I'll still roll my eyes. I'll just do it where you can't see.", warm: "I'll listen. Properly, this time." } },
      { by: 'b', conf: "{a} has made fun of {thing} since the first day. Then {a} needed somebody, and I was the one standing there. I'm not going to pretend I didn't enjoy the thank-you." },
    ] },
    { id: 'ntn.mh3', when: { remark: true }, turns: [
      { by: 'a', say: "Okay, I'll say this once: you {deed}, so thanks." },
      { by: 'b', say: "Once? I was hoping to hear it a few more times." },
      { by: 'a', say: "Don't get used to it. I didn't think you'd do that for me, after the way I've been." },
      { by: 'b', say: "“{remark}” That's the way you've been. I remember it word for word." },
      { by: 'a', say: "I know I said it, and I'm not proud of it.", v: { tough: "I said it and I'd probably say it again, but you still did it, so thanks.", schemer: "That was a bad day, and this is me saying thank you, so let's call it even." } },
      { by: 'b', say: "We're not even. But it's a start." },
      { by: 'a', conf: "{b} {deed}, after what I said to {b.obj}. I don't really know what to do with that, except say thank you and mean it." },
    ] },
    { id: 'ntn.mh4', turns: [
      { beat: "{b} is sitting on a log. {a} sits down at the other end of it." },
      { by: 'a', say: "Why would you do that for me?" },
      { by: 'b', say: "Because you needed it. Why, did you think I'd let you fall on your face?" },
      { by: 'a', say: "Honestly? After what I said to you, yeah." },
      { by: 'b', say: "I'm not like you. That's sort of the point." },
      { by: 'a', say: "...That's fair. Thank you.", v: { cruel: "Ouch, but that's fair, and thanks.", anxious: "Okay, I deserved that, and thank you, really." } },
      { by: 'a', conf: "{b} {deed}, and I've been nothing but rude to {b.obj}. I'd like to say I'll stop, but I'll probably just be rude more quietly." },
    ] },
  ],
  // a mocked b, and now a has helped b: a tries to make up for it, and b isn't sure that's enough
  'turn.mockamends.any': [
    { id: 'ntn.ma1', when: { remark: true }, turns: [
      { by: 'b', say: "You {deed}. Why?" },
      { by: 'a', say: "Because you needed it, and I was there." },
      { by: 'b', say: "“{remark}” That was you too. I haven't forgotten." },
      { by: 'a', say: "I know. This was me trying to be better than that.", v: { tough: "I'm not going to say sorry for everything. But I wasn't going to leave you on your own.", schemer: "People can say stupid things and still be useful. This time I was useful." } },
      { by: 'b', say: "It helps. It doesn't erase it." },
      { by: 'a', say: "I'm not asking it to." },
      { by: 'b', conf: "{a} {deed}. After what {a} said, I don't know if that's guilt, strategy or an actual apology. I'm going to keep watching." },
    ] },
    { id: 'ntn.ma2', when: { thing: true }, turns: [
      { by: 'a', say: "Can I say something without you throwing anything at me?" },
      { by: 'b', say: "Depends what it is." },
      { by: 'a', say: "What I said about you before was out of line. I don't really get it, but I didn't have to be a jerk about it." },
      { by: 'b', say: "And that's why you {deed}?" },
      { by: 'a', say: "No, that was just me being decent. This is the apology." },
      { by: 'b', say: "Okay. I'll take it." },
      { by: 'b', conf: "{a} has given me a hard time about {thing} all week. Then {a} {deed}. I don't know which one is the real {a} yet." },
    ] },
    { id: 'ntn.ma3', when: { remark: true }, turns: [
      { by: 'b', say: "I keep waiting for the joke." },
      { by: 'a', say: "There isn't one." },
      { by: 'b', say: "From the person who said “{remark}”? Forgive me if I check for the punchline." },
      { by: 'a', say: "That's fair. I'd check too." },
      { by: 'b', conf: "{a} {deed}. {a} being nice to me is more stressful than {a} being mean to me. At least I knew what to do with mean." },
    ] },
    { id: 'ntn.ma4', turns: [
      { by: 'b', say: "You {deed}. I don't know what to do with that." },
      { by: 'a', say: "You could say thanks." },
      { by: 'b', say: "After the way you've talked about me? I'm working up to it." },
      { by: 'a', say: "That's fair, because I've been a jerk to you, and I'm not saying that to get anything out of it.", v: { tough: "That's fair. I've been rough on you, but that doesn't mean I'd leave you on your own." } },
      { by: 'b', say: "...Thanks." },
      { by: 'b', conf: "{a} {deed}. The same {a} who's been making fun of me. I'm keeping the thank-you short until I know which one is real." },
    ] },
  ],
  // a wronged b (a lie, stolen credit, blame); now a has helped b
  'turn.amends.any': [
    { id: 'ntn.am1', when: { remark: true }, turns: [
      { by: 'b', say: "You {deed}. I didn't expect that from you." },
      { by: 'a', say: "Because of before?" },
      { by: 'b', say: "Because of “{remark}”. Yes, because of before." },
      { by: 'a', say: "I know how that looked. I'm trying to make up for it.", v: { schemer: "Before was the game. This was me.", tough: "I'm not going to grovel. But I'm not going to pretend it didn't happen either." } },
      { by: 'b', say: "Then keep trying. One good day doesn't fix it." },
      { by: 'b', conf: "{a} {deed}. I want to believe it means something. I also remember exactly what {a} did to me, so I'm going to take it one day at a time." },
    ] },
    { id: 'ntn.am2', turns: [
      { by: 'a', say: "Are we okay?" },
      { by: 'b', say: "We're better than we were, because you {deed}, and that counts for something." },
      { by: 'a', say: "But not everything." },
      { by: 'b', say: "Not everything. You'll know when it's everything." },
      { by: 'a', conf: "I messed up with {b}. I've been trying to fix it, and I think {b} has finally noticed. It's a start." },
    ] },
  ],
  // a mocked or wronged b, and did it again: b has had enough
  'turn.mockagain.any': [
    { id: 'ntn.mg1', when: { remark: true }, turns: [
      { by: 'b', say: "Twice. You've done it twice now." },
      { by: 'a', say: "Done what?" },
      { by: 'b', say: "“{remark}” First that. And now you {deed}." },
      { by: 'a', say: "It's a joke. You used to be able to take a joke.", v: { cruel: "If you didn't make it so easy, I wouldn't keep doing it.", anxious: "I didn't think you'd take it so seriously, honestly." } },
      { by: 'b', say: "I took the first one. I'm not taking any more." },
      { by: 'b', conf: "Once, I can let go, but then {a} {deed}, and that's not an accident any more, that's a choice." },
    ] },
    { id: 'ntn.mg2', when: { remark: true }, turns: [
      { beat: "{b} walks straight up to {a}." },
      { by: 'b', say: "What's your problem with me?" },
      { by: 'a', say: "I don't have a problem." },
      { by: 'b', say: "You said “{remark}”, and now you {deed}. That's a problem." },
      { by: 'a', say: "Fine, relax, it's not that serious." },
      { by: 'b', say: "It is to me." },
      { by: 'a', conf: "Apparently {b} has been keeping score, so okay, noted, I'll be careful. Probably." },
    ] },
    { id: 'ntn.mg3', turns: [
      { by: 'b', say: "I let it go the first time." },
      { by: 'a', say: "Let what go?" },
      { by: 'b', say: "You know what. And then you {deed}, like I wasn't going to notice." },
      { by: 'a', say: "Everybody's taking shots at everybody out here. Don't make it about you.", v: { warm: "Okay, that wasn't fair of me, and I'm sorry.", tough: "If you can't handle it, that's on you." } },
      { by: 'b', conf: "I gave {a} a pass once. I'm not giving out a second one." },
    ] },
  ],
  // a and b fought; now b has helped a. Neither of them knows what this makes them
  'turn.clashhelp.any': [
    { id: 'ntn.ch1', turns: [
      { by: 'a', say: "Don't think this means we're friends now." },
      { by: 'b', say: "Wouldn't dream of it." },
      { by: 'a', say: "But you {deed}, so thanks, I suppose." },
      { by: 'b', say: "You suppose. That's the nicest thing you've ever said to me." },
      { by: 'a', say: "Don't get used to it." },
      { by: 'a', conf: "After the way {b} and I went at each other, {b} {deed}. I still don't like {b}. I just like {b} a bit more than I used to." },
    ] },
    { id: 'ntn.ch2', turns: [
      { by: 'b', say: "Are you okay?" },
      { by: 'a', say: "I'm fine. Why do you care?" },
      { by: 'b', say: "Because I'm not a monster. We argued, so what? People argue all the time out here." },
      { by: 'a', say: "We did more than argue." },
      { by: 'b', say: "And I still helped you. Maybe that tells you something.", v: { tough: "And I still helped you. Think about that before the next fight.", warm: "And I still helped. I don't want to keep fighting with you." } },
      { by: 'a', say: "Maybe it does." },
      { by: 'a', conf: "{b} {deed}, of everybody here, and I don't know what to do with that yet." },
    ] },
    { id: 'ntn.ch3', turns: [
      { by: 'a', say: "So that's where we are now? You {deed}, and I have to be nice to you?" },
      { by: 'b', say: "You don't have to do anything. I'd just like you to stop yelling at me." },
      { by: 'a', say: "I don't yell." },
      { by: 'b', say: "You're a little bit yelling right now." },
      { by: 'a', say: "...Okay. Truce.", v: { cruel: "Fine. Truce, until you annoy me again.", warm: "Okay, truce, and thanks, actually." } },
      { by: 'a', conf: "I wanted to stay angry at {b}. Then {b} {deed}, and staying angry got a lot harder." },
    ] },
  ],
  // b helped (or stood up for) a once; now a has done it back. b is the one it was done for this time
  'turn.helpback.any': [
    { id: 'ntn.hb1', turns: [
      { by: 'b', say: "You {deed}. You didn't have to do that." },
      { by: 'a', say: "You did it for me first. I owed you." },
      { by: 'b', say: "I wasn't keeping score." },
      { by: 'a', say: "I know. I was." },
      { by: 'b', say: "So we're even?" },
      { by: 'a', say: "We're better than even. We're the two people out here who actually show up for each other." },
      { by: 'b', conf: "I helped {a} when nobody else would, and {a} remembered. Out here people forget who helped them by dinner. {a} didn't." },
    ] },
    { id: 'ntn.hb2', turns: [
      { by: 'a', say: "That's one each now." },
      { by: 'b', say: "One what?" },
      { by: 'a', say: "You looked out for me. Now I looked out for you." },
      { by: 'b', say: "You {deed}, and yeah, I noticed.", v: { dry: "You {deed}. I'm still saying mine was more impressive.", warm: "You {deed}. I'm really glad it was you." } },
      { by: 'a', say: "Good. That's all I wanted." },
      { by: 'b', conf: "{a} {deed} without me even asking, and that's what makes it count." },
    ] },
    { id: 'ntn.hb3', turns: [
      { by: 'b', say: "Thanks, seriously, because you {deed}." },
      { by: 'a', say: "Don't thank me. You did the same for me, and I never really said thank you for that either." },
      { by: 'b', say: "So let's say both thank-yous now and then never talk about feelings again." },
      { by: 'a', say: "Deal." },
      { by: 'a', conf: "We keep catching each other, me and {b}. At some point that stops being luck and starts being an alliance." },
    ] },
  ],
  // a stood up for b; now b has turned on a
  'turn.defendbetray.any': [
    { id: 'ntn.db1', when: { remark: true }, turns: [
      { by: 'a', say: "“{remark}” Do you remember me saying that? For you, in front of everybody?" },
      { by: 'b', say: "I remember." },
      { by: 'a', say: "And then you {deed}." },
      { by: 'b', say: "It's a game. It wasn't personal.", v: { anxious: "I panicked, okay? It wasn't supposed to go like that.", schemer: "It was strategic. You'd have done the same." } },
      { by: 'a', say: "It's personal to me. I stuck my neck out for you." },
      { by: 'b', say: "I didn't ask you to." },
      { by: 'a', conf: "I stood up for {b} when nobody else would, and then {b} {deed}. Lesson learned, and I won't make that mistake twice." },
    ] },
    { id: 'ntn.db2', when: { remark: true }, turns: [
      { by: 'a', say: "Can you explain something to me? Because I can't work it out." },
      { by: 'b', say: "Go on." },
      { by: 'a', say: "I defended you, I said “{remark}” and I meant it, and then you {deed}." },
      { by: 'b', say: "And I appreciated what you said. This was different." },
      { by: 'a', say: "How? How was it different?" },
      { by: 'b', say: "This was about me staying in the game." },
      { by: 'a', conf: "I keep replaying it. I defended {b}, and {b} {deed} the first chance {b} got. I feel stupid, and I hate feeling stupid." },
    ] },
    { id: 'ntn.db3', turns: [
      { beat: "{a} finds {b} alone and doesn't bother sitting down." },
      { by: 'a', say: "When everybody was having a go at you, I was the one who spoke up. You remember that?" },
      { by: 'b', say: "I remember." },
      { by: 'a', say: "And then you {deed}." },
      { by: 'b', say: "I'm not going to apologise for playing the game.", v: { anxious: "I know, I know, and I don't even know why I did it.", warm: "You're right. That wasn't fair to you." } },
      { by: 'a', say: "Nobody asked you to apologise. I just wanted you to know I noticed." },
      { by: 'a', conf: "I stood up for {b}, and then {b} {deed}, so I won't be standing up for {b} again." },
    ] },
  ],
  // a helped b once; now b has turned on a
  'turn.helpbetray.any': [
    { id: 'ntn.hx1', when: { remark: true }, turns: [
      { by: 'a', say: "You told me “{remark}”. Remember?" },
      { by: 'b', say: "...Yeah." },
      { by: 'a', say: "So what was that? You {deed}." },
      { by: 'b', say: "Because it's a game. I can't let that stuff decide everything.", v: { emotional: "I know, okay? I felt terrible the second I did it.", cruel: "Because I don't owe anybody anything out here." } },
      { by: 'a', say: "I was there for you when you needed it. That's not nothing." },
      { by: 'a', conf: "I helped {b} when {b} was struggling. Then {b} {deed}. Remember that the next time somebody tells you nice people finish first." },
    ] },
    { id: 'ntn.hx2', turns: [
      { beat: "{a} waits until the others have gone ahead, then stops {b} on the path." },
      { by: 'a', say: "I helped you once. You remember that?" },
      { by: 'b', say: "I remember. You want me to say thank you again?" },
      { by: 'a', say: "I want you to explain why you {deed}." },
      { by: 'b', say: "Because it was you or me, and I picked me." },
      { by: 'b', conf: "I owe {a}, I know I do. But I can't play this whole game paying people back. I picked myself, and I'd do it again." },
    ] },
    { id: 'ntn.hx3', turns: [
      { by: 'a', say: "Can I ask you something? When you were struggling, who was there?" },
      { by: 'b', say: "You were. I know where this is going." },
      { by: 'a', say: "Then you know what I'm going to say. You {deed}." },
      { by: 'b', say: "It wasn't about you.", v: { cruel: "And? You helped me once, and that doesn't mean you own me.", emotional: "I know it was stupid, and I'm sorry." } },
      { by: 'a', say: "It felt like it was about me." },
      { by: 'a', conf: "I don't help people so they'll owe me. But I didn't expect {b} to turn on me like that either." },
    ] },
  ],
  // a told b something real (a secret, a weak moment); now b has turned on a
  'turn.confidebetray.any': [
    { id: 'ntn.cb1', turns: [
      { by: 'a', say: "I told you things I haven't told anybody out here." },
      { by: 'b', say: "I know. I haven't told anyone." },
      { by: 'a', say: "That's not the point. I trusted you, and then you {deed}." },
      { by: 'b', say: "Those are two different things.", v: { emotional: "I know how it looks, and I'm sorry, I really am.", cruel: "You're being dramatic. It's one bad moment." } },
      { by: 'a', say: "Not to me, they're not." },
      { by: 'a', conf: "I opened up to {b}, which I never do, and then {b} {deed}. Next time I'll keep my mouth shut." },
    ] },
    { id: 'ntn.cb2', turns: [
      { beat: "{a} sits down next to {b} and doesn't say anything for a while." },
      { by: 'b', say: "Are you going to say it, or just sit there?" },
      { by: 'a', say: "You {deed}. After I sat right here and told you all that stuff." },
      { by: 'b', say: "What you told me has nothing to do with it." },
      { by: 'a', say: "It does to me. That's what you don't get." },
      { by: 'b', conf: "{a} thinks telling me something private means I owe {a.obj} forever. I like {a}. I just don't owe {a.obj} my game." },
    ] },
    { id: 'ntn.cb3', turns: [
      { by: 'a', say: "Do you remember what I told you?" },
      { by: 'b', say: "Of course I do." },
      { by: 'a', say: "Then why would you treat me like that? You {deed}." },
      { by: 'b', say: "I didn't think about it like that.", v: { warm: "You're right, I didn't think, and I'm sorry.", tough: "Because that's got nothing to do with this game." } },
      { by: 'a', conf: "The scary thing isn't what {b} did. It's that {b} knows the things {b} knows about me now." },
    ] },
  ],
  // a and b had a deal; now b has turned on a
  'turn.pactbetray.any': [
    { id: 'ntn.pb1', turns: [
      { by: 'a', say: "We had a deal." },
      { by: 'b', say: "We still have a deal." },
      { by: 'a', say: "You {deed}. You don't do that to somebody you've got a deal with." },
      { by: 'b', say: "The deal was about votes.", v: { schemer: "The deal covers the votes. It never covered anything else.", anxious: "I didn't mean it like that! It just happened!" } },
      { by: 'a', say: "Then I'll remember that when it's time to vote." },
      { by: 'a', conf: "{b} and I shook on it. Then {b} {deed}. If the deal doesn't count there, I don't see why it should count anywhere." },
    ] },
    { id: 'ntn.pb2', turns: [
      { by: 'b', say: "Are you still mad about earlier?" },
      { by: 'a', say: "Mad isn't the word. I trusted you, and you {deed}." },
      { by: 'b', say: "We're still good for the vote. Nothing's changed." },
      { by: 'a', say: "Everything's changed. I just haven't decided what to do about it yet." },
      { by: 'b', conf: "{a} won't let it go. I might have just lost the only person I could count on out here." },
    ] },
  ],
};
