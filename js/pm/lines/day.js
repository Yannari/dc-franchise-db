// pm/lines/day.js — the villa's day-to-day scenes (Plan 3, Task 2).
// Data only. Shape: { id, when?, stage?, turns: [[speaker, text] | variant block], beat? }.
// A variant block — { by, vary: [{ when?, turns, beat? }] } — lets the reply
// be the replier's own: its `when` is read from THAT speaker's point of view
// (pm/script.js). The option with no `when` is the plain reply, and the most
// seen, so it is the warmest, not the most guarded.
// Speakers: a, b, c, dior, narrator. Names and pronouns are placeholders —
// {a}, {b.obj}, {c.posAdj} — filled at render time. Never a name, never a
// guessed gender. A closing beat shows an action; it does not comment on it.
//
// One file per kind in ./day/ (data only); this one gathers them.
import { CHAT } from './day/chat.js';
import { DEEP_CHAT } from './day/deep-chat.js';
import { KISS } from './day/kiss.js';
import { FRIENDSHIP } from './day/friendship.js';
import { FRIEND_TALK } from './day/friend-talk.js';
import { GOSSIP } from './day/gossip.js';
import { COMEDY } from './day/comedy.js';
import { LOYALTY } from './day/loyalty.js';
import { ICK, CHALLENGE_KISS, CHALLENGE_WIN } from './day/challenge.js';
import { PULL_MORE } from './day/pull-more.js';
import { ARGUMENT_MORE } from './day/argument-more.js';


// The first five of each, written for the voice check (spec §16.5).
const PULL_05 = [
    { id: 'pull.01', when: { bTaken: true },
      turns: [
        ['a', 'Can I be honest with you? Really honest.'],
        ['b', 'Go on.'],
        ['a', "If you'd walked in on day one, I don't think you'd be sitting on that bed with them."],
        { by: 'b', vary: [
          { turns: [['b', "You can't say stuff like that to me."], ['a', "I know. I've said it now."]],
            beat: "{b} doesn't get up." },
          { when: { loyal: true },
            turns: [['b', "Don't. I mean it. I'm happy."], ['a', 'Are you, though?'], ['b', 'Yeah. I am.']],
            beat: '{b} gets up and goes back to {b.posAdj} partner.' },
          { when: { mood: 'lonely' },
            turns: [['b', '…Why are you telling me this now?'], ['a', "Because I didn't have the guts yesterday."]],
            beat: "{b} doesn't get up." },
        ] },
      ] },
    { id: 'pull.02', when: { bombshell: true, early: true },
      turns: [
        ['a', "I've been here a day and you're the only person I've wanted to talk to properly."],
        { by: 'b', vary: [
          { turns: [['b', "You've been here a day. You haven't talked to anyone properly."],
            ['a', "Fair. But I'm talking to you now, aren't I?"], ['b', '…Go on, then. What do you want to know?']],
            beat: '{b} moves up on the daybed to make room.' },
          { when: { persona: 'wallflower' },
            turns: [['b', '…Me? Why me?'], ['a', "Because you haven't tried to impress me once."]],
            beat: '{b} goes red and moves up on the daybed.' },
          { when: { taken: true, loyal: true },
            turns: [['b', "That's nice. But I'm coupled up, you know that."], ['a', "I'm only asking for a chat."]],
            beat: '{b} gives {a.obj} five minutes, then goes back to the others.' },
        ] },
      ] },
    { id: 'pull.03', when: { persona: 'fuckboy' },
      turns: [
        ['a', 'What are you doing tonight?'],
        ['b', "What's anyone doing tonight? We're in a villa."],
        ['a', 'Then do nothing with me. On the terrace, later.'],
        { by: 'b', vary: [
          { turns: [['b', "That's the worst chat-up line I've ever heard."], ['a', "And you're still smiling."]],
            beat: '{b} laughs and tells {a.obj} to get lost.' },
          { when: { persona: 'checklist' },
            turns: [['b', 'Do you say that to everyone?'], ['a', 'Only the ones I like.'], ['b', 'So everyone.']],
            beat: '{b} goes back to sunbathing.' },
          { when: { persona: 'hopeless-romantic' },
            turns: [['b', '…Okay.']],
            beat: '{b} is on the terrace ten minutes early.' },
        ] },
      ] },
    { id: 'pull.04', when: { persona: 'game-player', bTaken: true },
      turns: [
        ['a', "Can I be straight with you? I think we'd be good together, and I think you know it."],
        ['b', "I'm coupled up."],
        ['a', "You're coupled up with someone who's been looking at the door since day two."],
        { by: 'b', vary: [
          { turns: [['b', "That's not fair."], ['a', "I'm not saying it to be fair. I'm saying it because it's true."]],
            beat: '{b} looks across the lawn to where {b.posAdj} partner is sitting.' },
          { when: { loyal: true },
            turns: [['b', "You'd say anything to get what you want. Leave it."]],
            beat: '{b} walks back across the lawn to {b.posAdj} partner.' },
          { when: { persona: 'game-player' },
            turns: [['b', 'Nice try.'], ['a', 'Was it?'], ['b', 'It was nearly good.']],
            beat: 'Neither of them gets up.' },
        ] },
      ] },
    { id: 'pull.05',
      turns: [
        ['a', 'Can I borrow you for a minute?'],
        { by: 'b', vary: [
          { turns: [['b', 'Me? Go on, then.'], ['a', "I feel like we haven't had a real chat yet, and I wanted one."],
            ['b', "That's actually really sweet."]],
            beat: '{b} follows {a.obj} out to the daybeds, smiling.' },
          { when: { persona: 'hopeless-romantic' },
            turns: [['b', "I was hoping you'd ask, to be honest."]],
            beat: "{b}'s already getting up." },
          { when: { persona: 'villa-clown' },
            turns: [['b', 'Depends. Is this a chat, or a chat chat?'], ['a', '…The second one.'], ['b', "Then I'm bringing my drink."]],
            beat: '{b} brings the drink.' },
          { when: { persona: 'wallflower' },
            turns: [['b', '…Me? Yeah. Okay.']],
            beat: '{a} does most of the talking. {b} keeps smiling at the floor.' },
          { when: { taken: true, loyal: true },
            turns: [['b', "I'll come, but I'm happy where I am. Just so you know."], ['a', 'Noted.']],
            beat: '{b} sits at the far end of the daybed.' },
        ] },
      ] },
];
const ARGUMENT_05 = [
    { id: 'argument.01', when: { coupled: true },
      turns: [
        ['b', "Don't tell me how I should feel."],
        ['a', "I'm not doing that, I'm just saying—"],
        ['b', "You are. Every time. You decide what the problem is, then you tell me I'm the problem for having it."],
        { by: 'a', vary: [
          { turns: [['a', "Alright. Then tell me what it is, because I've been guessing all day."]],
            beat: "{b} walks off toward the kitchen. {a} doesn't follow." },
          { when: { archetype: 'hothead' },
            turns: [['a', 'Oh, here we go. Go on, then. What have I done now?']],
            beat: '{b} walks off toward the kitchen. {a} kicks a cushion off the daybed.' },
          { when: { attachment: 'avoidant' },
            turns: [['a', "I'm not doing this right now."]],
            beat: '{a} goes to the gym and stays there for an hour.' },
          { when: { archetype: ['hero', 'loyal-soldier'] },
            turns: [['a', "…You're right. I do that. I'm sorry."]],
            beat: '{b} stops halfway to the kitchen and comes back.' },
        ] },
      ] },
    { id: 'argument.02', when: { coupled: true, mood: 'jealous' },
      stage: '{a} finds {b} at the fire pit.',
      turns: [
        ['a', 'Were you going to tell me, or was I meant to hear it from someone else?'],
        ['b', 'Tell you what? Nothing happened.'],
        ['a', 'Then why is everyone being weird with me?'],
        { by: 'b', vary: [
          { turns: [['b', "Because you're being weird with everyone. I've not done anything."]],
            beat: '{a} starts to answer, then heads up to bed instead.' },
          { when: { archetype: ['villain', 'mastermind', 'schemer'] },
            turns: [['b', 'Go and ask them, then, if you trust them more than me.']],
            beat: '{a} starts to answer, then heads up to bed instead.' },
          { when: { mood: 'guilty' },
            turns: [['b', '…Who said something?'], ['a', 'So there is something.']],
            beat: "{b} doesn't answer." },
        ] },
      ] },
    { id: 'argument.03', when: { mood: 'stressed' },
      turns: [
        ['b', "You've bitten my head off three times today."],
        ['a', "Because you keep asking me if I'm alright."],
        ['b', "Because you're clearly not."],
        ['a', "I'm tired, I'm hot, and there's nowhere in this villa to be on my own. I'm allowed to be in a mood."],
        { by: 'b', vary: [
          { turns: [['b', "You are. You're just not allowed to take it out on me."]],
            beat: '{a} goes quiet and starts clearing the plates.' },
          { when: { loyal: true, coupled: true },
            turns: [['b', 'Then come here. Sit down with me for five minutes.']],
            beat: '{a} sits down next to {b.obj}.' },
        ] },
      ] },
    { id: 'argument.04', when: { coupled: false },
      stage: 'It starts over who used the last of the hot water.',
      turns: [
        ['a', "Five minutes. That's all I'm asking. Five minutes in the shower like a normal person."],
        ['b', 'I was in there ten minutes, tops.'],
        ['a', "You were in there so long I thought you'd moved in."],
        { by: 'b', vary: [
          { turns: [['b', 'Say it to my face next time, instead of to the whole kitchen.'], ['a', 'I am saying it to your face.']],
            beat: 'Half the villa has stopped eating to watch.' },
          { when: { persona: 'villa-clown' },
            turns: [['b', "I'm sorry, is this an intervention? Should I sit down?"], ['a', "It's not funny."],
              ['b', "It's a bit funny."]],
            beat: 'Somebody at the table laughs, and {a} gives up.' },
        ] },
      ] },
    { id: 'argument.05', when: { persona: 'messy' },
      turns: [
        ['a', "No, we're doing this now. In front of everyone. I don't care."],
        ['b', 'Can we not? Please. Not here.'],
        ['a', 'Why, so you can tell your side first?'],
        { by: 'b', vary: [
          { turns: [['b', "There aren't sides. I just don't want to do this with everyone watching."]],
            beat: '{b} gets up and walks inside. {a} follows, still talking.' },
          { when: { archetype: 'hothead' },
            turns: [['b', "Fine. You want to do it in front of everyone? Let's do it."]],
            beat: 'Nobody else at the table moves.' },
        ] },
      ] },
  ];

export const DAY = {
  chat: CHAT,
  'deep-chat': DEEP_CHAT,
  kiss: KISS,
  friendship: [...FRIENDSHIP, ...FRIEND_TALK],
  gossip: GOSSIP,
  comedy: COMEDY,
  ick: ICK,
  'challenge-kiss': CHALLENGE_KISS,
  'challenge-win': CHALLENGE_WIN,
  loyalty: LOYALTY,
  pull: [...PULL_05, ...PULL_MORE],
  argument: [...ARGUMENT_05, ...ARGUMENT_MORE],
};
