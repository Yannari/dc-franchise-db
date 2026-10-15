// ══════════════════════════════════════════════════════════════════════
// ch/script/lines/intro.js — the premiere's introductions, in their own words
// ══════════════════════════════════════════════════════════════════════
//
// Each player introduces themselves as they come off the plane (the stepped
// viewer's intro package, js/vp-ch-ep): who they are, the show they come from,
// what happened to them there, and what they want here. Picked by the record
// (ch-run.js introOf), said in the speaker's voice (write.js voicedLine), plain
// first person, the way people talk to the camera on the real show's premiere.
// Slots: {show} their show, {where} a season ("Total Drama Season 3"), {place}
// a placing ("6th"), {job}, {home}, {rival}.

export const INTRO = {
  // who they are and where they come from
  champ: [
    { say: "I won {where}. I know exactly what it takes, and I came here to do it again.",
      v: { sharp: ["I won {where}. Everybody in this house knows that, and everybody should be worried."], dry: ["I've won this kind of thing before. {where}. I'd like another one."],
        loud: ["I WON {where}! And I'm here to win again!"], soft: ["I won {where}, and I still can't really believe it. I want to prove it wasn't luck."],
        odd: ["I won {where}. People still bring it up. I'd like them to have a second thing to bring up."] } },
  ],
  finalist: [
    { say: "I made it to the end of {where} and came up short. I'm not coming up short again.",
      v: { sharp: ["I was in the final on {where}. I lost. That's not happening twice."], dry: ["Final of {where}. So close. This time I'd like to skip the close part."],
        loud: ["I made the FINAL on {where}! I lost it! Not this time!"], soft: ["I got so close on {where}. I think about that final all the time."],
        odd: ["I got to the last day of {where} and didn't win. I've been thinking about it ever since."] } },
  ],
  placed: [
    { say: "I finished {place} on {where}. That's not the way I want to be remembered.",
      v: { sharp: ["{place} on {where}. People think that's my level. They're wrong."], dry: ["I came {place} on {where}. Respectable. Not what I came for."],
        loud: ["{place} on {where}! That's not who I am! Watch!"], soft: ["I finished {place} on {where}, and I left feeling like I had more to give."],
        odd: ["{place} on {where}. It's fine. I'd like a better number."] } },
  ],
  early: [
    { say: "I went home early on {where}. Everybody remembers that. I'm here to change it.",
      v: { sharp: ["I went out early on {where}. I was naive. I'm not anymore."], dry: ["{where} didn't go great. I left early. Let's not dwell on it."],
        loud: ["I went home EARLY on {where}! Never again!"], soft: ["Going home early on {where} really hurt. I've been waiting for a second chance."],
        odd: ["My time on {where} was short. I'm hoping this one is longer."] } },
  ],
  // a veteran of this show, before the ledger knew them
  vetHome: [
    { say: "This isn't my first season. I know how this game works, and I know who to watch.",
      v: { sharp: ["I've been here before. I know who lies, and I know who wins."], loud: ["I'm BACK! And I know exactly what I'm doing this time!"], soft: ["I've done this before, and it still makes me nervous. That's how I know it matters."] } },
    { say: "I've been in the Arena before. The rookies haven't. That's the difference.",
      v: { dry: ["I've done the dailies, I've done the Arena, and I still want the money."], odd: ["I've done this before. I still don't sleep the night before a vote."] } },
  ],
  vet: [
    { say: "I come from {show}, and I made it through a house like this already. This is the same, with more running.",
      v: { sharp: ["{show} taught me how to play people. This show is going to teach me how to beat them too."], loud: ["{show} didn't break me, and this won't either!"], soft: ["After {show}, I promised myself I'd try something harder. This is it."] } },
    { say: "People know me from {show}. That's a target, and I know it.",
      v: { dry: ["Everybody here watched me on {show}. They think they know me. They don't."], odd: ["Some of these people watched me on {show}. That's going to be weird."] } },
    { say: "I've done {show} before. I know what a house like this does to people.",
      v: { sharp: ["I come from {show}. I know how these games work, and I know how to win them."], dry: ["{show} veteran. I know the drill. Strangers, a house, everybody lying."],
        loud: ["{show} is in the house! And I'm not here to make friends!"], soft: ["I come from {show}. I made real friends there. I hope I can do that here too."],
        odd: ["I'm from {show}. Different show, same thing: people, a house and a lot of feelings."] } },
  ],
  rookieShow: [
    { say: "On {show} I didn't have to run up a mountain. Here I do. I'm still going to try.",
      v: { sharp: ["{show} was all talk. This is all legs. I can do both."], loud: ["From {show} to THIS! Let's go!"], soft: ["{show} was hard in a different way. I think that helps me here."] } },
    { say: "I come from {show}. Nobody here knows what I can do yet, and that's fine with me.",
      v: { sharp: ["I'm from {show}. Everybody here is going to underestimate me. Good."], dry: ["{show}. This is a different game. I'll figure it out."],
        loud: ["I'm from {show}, and I'm about to show everybody what that means!"], soft: ["I come from {show}. This is all new, and I'm nervous, but I'm ready."],
        odd: ["I'm from {show}. I've never done anything this physical. I'm going to try anyway."] } },
  ],
  rookie: [
    { say: "Nobody here knows who I am. By the end, they will.",
      v: { sharp: ["Nobody knows me yet. They'll learn."], loud: ["Nobody knows my name yet! They will!"], soft: ["Nobody here knows me, and honestly that's a relief. I get to start fresh."] } },
    { say: "I've watched this show my whole life. Now I'm actually here, and I can't believe it.",
      v: { dry: ["I've watched every season. Watching and doing are going to be different."], odd: ["I've seen every season of this. I know where the cameras are. That's all I know."] } },
    { say: "This is my first time doing anything like this. I'm scared, and I'm still going to win.",
      v: { sharp: ["First time. I don't care. I'm here to win."], dry: ["I've never done this before. How hard can it be? Don't answer that."],
        loud: ["First time EVER! Let's GO!"], soft: ["I've never done anything like this. I'm terrified, honestly. I'm still going to try my hardest."],
        odd: ["First time on a show like this. I've watched a lot of it. That has to count for something."] } },
  ],
  // about their life at home, when the roster knows it
  job: [
    { say: "Back home I'm a {job}. Out here none of that matters.",
      v: { sharp: ["At home I'm a {job}. Here I'm a threat."], loud: ["I'm a {job} back home! Here I'm a competitor!"], soft: ["At home I'm a {job}. My family is watching, and I want to make them proud."] } },
  ],
  home: [
    { say: "I'm from {home}, and I'm doing this for everybody back there.",
      v: { sharp: ["{home}. Where I'm from, you don't quit."], loud: ["{home}! This is for you!"], soft: ["I'm from {home}. I really miss it already."] } },
  ],
  // a rival in the house
  rival: [
    { say: "And {rival} is here. We have history, and it isn't good.",
      v: { sharp: ["{rival} is here. I haven't forgotten anything."], dry: ["{rival} is here. Of course {rival} is here."],
        loud: ["{rival} is HERE?! Oh, this is going to be a problem!"], soft: ["{rival} is here. I was hoping we'd left that behind."],
        odd: ["{rival} is here. We didn't end things well. We didn't really end them at all."] } },
  ],
};
