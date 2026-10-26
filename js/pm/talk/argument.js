// ══════════════════════════════════════════════════════════════════════
// pm/talk/argument.js — {a} and {b} row
// ══════════════════════════════════════════════════════════════════════
//
// WHY is the engine's (events.js argumentReasons), and every row says it:
//   jealous   {b}, {a}'s partner, flirted with {about} today, in front of everyone
//   mismatch  {a} is further in than {b}, {a}'s partner
//   stress    {a} snaps at {b}, the partner, from stress
//   bicker    the small stuff, between partners
//   envy      {b} is coupled with {about}, the one {a} {~fancies}
//   rival     {b} is after {about}, {a}'s partner
//   stole     {b} took {about} from {a} at a recoupling
//   voted     {b} voted against {a} at the fire pit
//   told      {b} told {about} about {a}'s secret
//   clash     two who just don't get on
// How it ends is the engine's too (`end`: make-up · walk-off · simmer).
//   start      the accusation, its subject named
//   defend     {b}'s side
//   escalate   it gets worse
//   end        the engine's ending
import { build } from './build.js';

const PARTNERS = ['jealous', 'mismatch', 'stress', 'bicker'];

export const ARGUMENT = build('argument', {
  after: [],
  plans: {
    featured: ['start', 'defend', 'escalate', 'escalate?', 'end'],
    short: ['start', 'defend', 'end'],
  },
  moves: {
    start: [
      { when: { cause: 'jealous' }, stage: "{a} storms over to {b} by the pool.", turns: [
        ['a', "Can I have a word? Now?"],
        ['b', "What's wrong with you?"],
        ['a', "What's wrong with me? I've just watched you sit there with {about} for half an hour, laughing at every single thing {about} said. In front of everyone. In front of me."],
      ] },
      { when: { cause: 'jealous' }, stage: "{a} confronts {b} on the terrace.", turns: [
        ['a', "Do you want to explain what that was with {about}?"],
        ['b', "What what was?"],
        ['a', "Don't do that. Don't act like you don't know. Everyone saw it. People were looking at me to see how I'd react."],
      ] },
      { when: { cause: 'jealous' }, stage: "{a} sits down next to {b}, arms folded.", turns: [
        ['a', "I'm going to ask you once. What's going on with you and {about}?"],
        ['b', "Nothing's going on."],
        ['a', "It didn't look like nothing. It looked like a lot of something."],
      ] },
      { when: { cause: 'mismatch' }, stage: "{a} pulls {b} aside on the daybeds.", turns: [
        ['a', "Can I say something? I feel like I'm putting in all the effort here. I'm the one who comes and finds you. I'm the one who says the nice things. And you just... let me."],
        ['b', "That's not fair."],
        ['a', "Isn't it? When was the last time you came and found me?"],
      ] },
      { when: { cause: 'mismatch' }, stage: "{a} and {b} sit on the swing seat. It's tense.", turns: [
        ['a', "I told you yesterday how I feel about you, and you said thanks. Thanks. Like I'd passed you the salt."],
        ['b', "I didn't know what else to say."],
        ['a', "That's sort of my point."],
      ] },
      { when: { cause: 'stress' }, stage: "{b} tries to talk to {a} in the kitchen.", turns: [
        ['b', "Are you all right? You've been really short with me all day."],
        ['a', "I'm fine. Can you just leave it?"],
        ['b', "No, because you're clearly not fine, and you're taking it out on me."],
        ['a', "I said leave it!"],
      ] },
      { when: { cause: 'stress' }, stage: "{a} snaps at {b} over nothing at the dinner table.", turns: [
        ['b', "Why are you biting my head off? I only asked if you wanted a drink."],
        ['a', "Because you keep asking me things! Every five minutes, are you okay, do you want this, do you want that. I just want five minutes to myself."],
      ] },
      { when: { cause: 'bicker' }, stage: "{a} and {b} start bickering in the bedroom.", turns: [
        ['a', "You've left your stuff all over my side again."],
        ['b', "It's a few clothes."],
        ['a', "It's not a few clothes. It's every day. I'm not your cleaner."],
      ] },
      { when: { cause: 'bicker' }, stage: "{a} and {b} are bickering on the daybeds.", turns: [
        ['b', "Why did you say that in front of everyone?"],
        ['a', "Say what?"],
        ['b', "That I snore. At dinner. Everyone laughed."],
        ['a', "Because you do snore! It was a joke!"],
      ] },
      { when: { cause: 'bicker' }, stage: "{a} and {b} bicker over the last of the bread.", turns: [
        ['a', "You've eaten it. You've eaten the last bit. I said I wanted it."],
        ['b', "You didn't say you wanted it."],
        ['a', "I literally said, I'm having that later."],
      ] },
      { when: { cause: 'envy' }, stage: "{a} confronts {b} by the fire pit.", turns: [
        ['a', "Can I ask you something? Do you actually even like {about}? Because from where I'm sitting, it looks like you're just there because it's easy."],
        ['b', "Sorry? What's it got to do with you?"],
        ['a', "It's got everything to do with me, and you know it."],
      ] },
      { when: { cause: 'envy' }, stage: "{a} stops {b} on the stairs.", turns: [
        ['a', "You know {about} would be happier with someone who actually gives {about.obj} the time of day."],
        ['b', "Someone like you, you mean?"],
        ['a', "I didn't say that."],
        ['b', "You didn't have to."],
      ] },
      { when: { cause: 'rival' }, stage: "{a} walks straight up to {b} in the garden.", turns: [
        ['a', "Can you stop it with {about}? Seriously. I've seen you. Every time I turn my back, you're there, making {about} laugh, sitting next to {about.obj}."],
        ['b', "I'm allowed to talk to people."],
        ['a', "Not like that, you're not. Not to my partner."],
      ] },
      { when: { cause: 'rival' }, stage: "{a} confronts {b} on the terrace.", turns: [
        ['a', "I know what you're doing with {about}. Everyone knows. You're not subtle."],
        ['b', "What am I doing?"],
        ['a', "You're trying to turn {about.posAdj} head, and you're doing it right in front of me."],
      ] },
      { when: { cause: 'stole' }, stage: "{a} finally confronts {b} about the recoupling.", turns: [
        ['a', "I need to say this, because I've been biting my tongue. You stood up at that recoupling and took {about} from me. You knew how I felt. You knew. And you did it anyway."],
        ['b', "It's a game. You knew it could happen."],
        ['a', "Don't tell me it's a game."],
      ] },
      { when: { cause: 'stole' }, stage: "{a} sits down opposite {b}.", turns: [
        ['a', "Do you ever think about what you did? With {about}?"],
        ['b', "I did what I had to do. I came here to find someone."],
        ['a', "You came here and took someone. There's a difference."],
      ] },
      { when: { cause: 'voted' }, stage: "{a} pulls {b} aside after the fire pit.", turns: [
        ['a', "You voted for me. At the fire pit. You stood there and put my name down."],
        ['b', "I had to put someone down."],
        ['a', "You had a choice. You chose me. After everything I've done for you in here."],
      ] },
      { when: { cause: 'voted' }, stage: "{a} corners {b} by the kitchen.", turns: [
        ['a', "So, I'm still here. No thanks to you."],
        ['b', "Don't start."],
        ['a', "Don't start? You tried to send me home, and you're telling me not to start?"],
      ] },
      { when: { cause: 'told' }, stage: "{a} goes looking for {b} and finds {b.obj} on the daybeds.", turns: [
        ['a', "You went to {about}. You went straight to {about} and told {about.obj} everything."],
        ['b', "I told the truth."],
        ['a', "You told your version of the truth, and you didn't even have the decency to come to me first."],
      ] },
      { when: { cause: 'told' }, stage: "{a} confronts {b} in front of the whole villa.", turns: [
        ['a', "Thanks for that. Really. Thanks for going behind my back and stirring it with {about}."],
        ['b', "I didn't stir anything. You did that all on your own."],
      ] },
      { when: { cause: 'clash' }, stage: "{a} and {b} clash at the dinner table.", turns: [
        ['a', "Can you not talk over me? Every single time I open my mouth, you've got something to say."],
        ['b', "Maybe if you said something worth listening to."],
        ['a', "Wow. Okay. Here we go."],
      ] },
      { when: { cause: 'clash' }, stage: "A fight breaks out between {a} and {b} in the garden.", turns: [
        ['a', "I'm sick of the attitude. I'm sick of the eye-rolling every time I speak. If you've got a problem with me, say it to my face."],
        ['b', "Fine. I've got a problem with you."],
        ['a', "Go on, then."],
      ] },
      { when: { cause: 'clash' }, stage: "{a} and {b} start sniping at each other by the pool.", turns: [
        ['b', "You think you're the main person in here, don't you?"],
        ['a', "Sorry, what?"],
        ['b', "You walk around like everyone should be grateful you're talking to them."],
      ] },
    ],

    defend: [
      { when: { cause: 'jealous' }, turns: [
        ['b', "It was a chat! It was literally a chat. {about} was telling me a story, and it was funny, so I laughed. Am I not allowed to laugh now? Do I have to check with you first before I find something funny?"],
        ['a', "Don't twist it."],
        ['b', "I'm not twisting it. You're making it into something it's not."],
      ] },
      { when: { cause: 'jealous' }, turns: [
        ['b', "You're being paranoid. I'm with you. I chose you. I sleep next to you every night. What more do you want me to do?"],
        ['a', "I want you to not make me feel like an idiot in front of the whole villa."],
      ] },
      { when: { cause: 'mismatch' }, turns: [
        ['b', "I'm not like you. I don't say everything I feel the second I feel it. It doesn't mean I don't care. It just means I take longer. And it's not fair to make me feel bad for that."],
        ['a', "I'm not trying to make you feel bad."],
        ['b', "Well, you are."],
      ] },
      { when: { cause: 'mismatch' }, turns: [
        ['b', "I didn't know you felt like this. Why didn't you say something before it got to this?"],
        ['a', "I'm saying it now."],
        ['b', "You're not saying it. You're shouting it."],
      ] },
      { when: { cause: ['stress', 'bicker'] }, turns: [
        ['b', "I'm not doing anything! I'm trying to be nice to you, and you're biting my head off for it. I don't know what's going on with you today, but don't take it out on me."],
        ['a', "I'm not taking it out on you."],
        ['b', "You literally are, right now."],
      ] },
      { when: { cause: 'bicker' }, turns: [
        ['b', "Oh my God, it's not that deep. You're making this into a massive thing, and it's not a massive thing."],
        ['a', "It's not about the thing! It's about you never listening to me."],
      ] },
      { when: { cause: 'envy' }, turns: [
        ['b', "You're jealous. That's all this is. You're jealous because I've got what you want, and you can't stand it."],
        ['a', "I'm not jealous."],
        ['b', "You're green. You're actually green."],
      ] },
      { when: { cause: 'rival' }, turns: [
        ['b', "If you're that worried about me talking to {about}, maybe the problem isn't me. Maybe it's that you know {about}'s not happy."],
        ['a', "Don't you dare."],
        ['b', "I'm just saying what everyone's thinking."],
      ] },
      { when: { cause: 'stole' }, turns: [
        ['b', "I'm not going to apologise for following my heart. I liked {about}, {about} liked me, and I did something about it. If it had been the other way round, you'd have done exactly the same."],
        ['a', "No, I wouldn't."],
        ['b', "You would."],
      ] },
      { when: { cause: 'voted' }, turns: [
        ['b', "It wasn't personal. I had to vote for the couple I thought was weakest, and that was you. It's not about whether I like you."],
        ['a', "It feels personal."],
        ['b', "Well, it wasn't."],
      ] },
      { when: { cause: 'told' }, turns: [
        ['b', "If you didn't want people to know, maybe you shouldn't have done it. I'm not going to keep your secrets for you while {about} walks around thinking everything's fine."],
        ['a', "It wasn't your place."],
        ['b', "It was my place, actually. {about}'s my friend."],
      ] },
      { when: { cause: 'clash' }, turns: [
        ['b', "I don't have to like everyone in here. And I don't like you. I've tried, I really have, but there's something about you that just rubs me up the wrong way."],
        ['a', "The feeling's mutual."],
        ['b', "Good. At least we agree on something."],
      ] },
      { when: { cause: 'clash' }, turns: [
        ['b', "I'm not going to stand here and be shouted at. If you want to have a conversation, have a conversation. But don't come at me like that."],
        ['a', "I'm not coming at you."],
        ['b', "You're literally pointing at me."],
      ] },
      { turns: [
        ['b', "I can't believe you're doing this here. Everyone's listening."],
        ['a', "Let them listen. I don't care anymore."],
      ] },
    ],

    escalate: [
      { turns: [
        ['a', "You always do this. Every time I try and talk to you about something, you turn it round on me, and somehow I end up being the bad guy."],
        ['b', "Because you start it!"],
        ['a', "I start it? Are you hearing yourself?"],
      ] },
      { turns: [
        ['b', "Do you know what? I'm not doing this. I'm not going to stand here and be spoken to like that. You can calm down and come and find me when you're ready to have an actual conversation."],
        ['a', "Don't walk away from me."],
        ['b', "Watch me."],
      ] },
      { when: { cause: PARTNERS }, turns: [
        ['a', "I don't even know why I bother. I put everything into this, and you can't even be bothered to have a {~proper} conversation with me about it."],
        ['b', "That's not fair, and you know it."],
        ['a', "Then tell me I'm wrong. Go on."],
        ['b', "You're wrong!"],
      ] },
      { when: { cause: PARTNERS }, turns: [
        ['b', "Maybe we just want different things. Have you ever thought about that?"],
        ['a', "Don't say that."],
        ['b', "Why not? It's true."],
        ['a', "Because if you say it, I'm going to start believing it."],
      ] },
      { turns: [
        ['a', "Everyone in this villa can see what you're doing. Everyone. You're the only one who can't."],
        ['b', "Oh, so now you've got the whole villa on your side?"],
        ['a', "I don't need the whole villa. I've got eyes."],
      ] },
      { turns: [
        ['b', "You said what you said."],
        ['a', "And I meant it."],
        ['b', "Then there's nothing else to talk about, is there?"],
      ] },
      { turns: [
        ['a', "Don't roll your eyes at me."],
        ['b', "I'll roll my eyes at whatever I want."],
        ['a', "This is exactly what I'm talking about. This, right here."],
      ] },
      { when: { cause: ['jealous', 'rival', 'stole'] }, turns: [
        ['a', "Do you know how humiliating it is? Sitting there, watching it happen, with everyone looking at you, waiting to see what you'll do?"],
        ['b', "Nobody was looking at you."],
        ['a', "Everybody was looking at me!"],
      ] },
      { when: { cause: ['voted', 'told', 'clash', 'envy'] }, turns: [
        ['b', "You know what your problem is? You can dish it out, but you can't take it. The second someone says something back, you fall apart."],
        ['a', "I'm not falling apart. I'm standing right here."],
        ['b', "Shouting."],
        ['a', "Because you're not listening!"],
      ] },
      { turns: [
        ['a', "I'm not going to say sorry for how I feel."],
        ['b', "Nobody's asking you to say sorry for how you feel. I'm asking you to say sorry for how you're acting."],
      ] },
    ],

    end: [
      { when: { end: 'make-up' }, turns: [
        ['a', "Can we stop? I don't want to do this anymore."],
        ['b', "Neither do I."],
        ['a', "I'm sorry. I got carried away. I should have just talked to you instead of shouting."],
        ['b', "I'm sorry too. I didn't help. Come here."],
      ], beat: "They hug it out, and the villa breathes again." },
      { when: { end: 'make-up' }, turns: [
        ['b', "This is stupid. We're arguing about something stupid."],
        ['a', "It is stupid."],
        ['b', "Truce?"],
        ['a', "Truce. But you're still wrong."],
        ['b', "I'll take that."],
      ] },
      { when: { end: 'make-up', cause: PARTNERS }, turns: [
        ['a', "I hate fighting with you. I hate it. It makes me feel sick."],
        ['b', "Me too. I'm sorry. I didn't mean half of what I said."],
        ['a', "Which half?"],
        ['b', "The mean half."],
      ], beat: "{a} laughs despite {a.ref}, and {b} pulls {a.obj} in for a kiss." },
      { when: { end: 'make-up' }, turns: [
        ['b', "Look, I don't want us to be like this. Can we just start again? Clean slate?"],
        ['a', "Clean slate. Yeah. I'd like that."],
      ], beat: "They shake on it, awkwardly, and then both laugh." },
      { when: { end: 'walk-off' }, turns: [
        ['a', "Forget it. I'm done."],
      ], beat: "{a} storms off into the villa, and the door bangs behind {a.obj}." },
      { when: { end: 'walk-off' }, turns: [
        ['b', "I'm not listening to this anymore."],
        ['a', "Fine. Go."],
      ], beat: "{b} walks off across the lawn. {a} stands there, shaking with anger." },
      { when: { end: 'walk-off' }, turns: [
        ['a', "Don't talk to me. Seriously. Don't talk to me for the rest of the day."],
        ['b', "Suits me."],
      ], beat: "They go to opposite ends of the villa, and nobody dares say a word." },
      { when: { end: 'walk-off', cause: PARTNERS }, turns: [
        ['b', "I'm sleeping on the daybed tonight."],
        ['a', "Good. Do."],
      ], beat: "{b} grabs a pillow and goes outside. The bedroom goes very quiet." },
      { when: { end: 'simmer' }, turns: [
        ['a', "Let's just leave it."],
        ['b', "Fine."],
        ['a', "Fine."],
      ], beat: "Neither of them moves. Neither of them speaks. It's not over." },
      { when: { end: 'simmer' }, turns: [
        ['b', "We'll talk about it later."],
        ['a', "Will we?"],
        ['b', "When you've calmed down."],
      ], beat: "{a} doesn't calm down for the rest of the day." },
      { when: { end: 'simmer' }, turns: [
        ['a', "Whatever. Believe what you want."],
        ['b', "I will."],
      ], beat: "They sit at opposite ends of the dinner table that night, not looking at each other." },
      { when: { end: 'simmer', cause: 'clash' }, turns: [
        ['a', "Just stay out of my way."],
        ['b', "Happily."],
      ], beat: "The dinner table splits down the middle, and it's not hard to see who's on which side." },
    ],
  },

  notes: [
    { stage: "{a} and {b} have a fight that the whole villa hears." },
  ],
});
