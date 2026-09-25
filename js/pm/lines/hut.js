// pm/lines/hut.js — beach-hut cutaways (Plan 3, Task 5). Data only.
//
// One speaker, straight to camera, about THE SCENE IT CUTS AWAY FROM. Every
// entry names the scene it answers — `kind`, or a `family` of scenes — and
// there is no general fallback: a cutaway with nothing to say about its scene
// is skipped (user: "the confessional have nothing to do with the events").
//
// {a} is the speaker; {b} is the other person in the scene. `role` is the
// speaker's part in it:
//   pull            0 did the pulling · 1 was pulled
//   loyalty         0 said no · 1 was turned down
//   argument        0 started it · 1 was on the end of it
//   gossip          0 told · 1 was told · 2 was talked about
//   ick             0 went off {b} · 1 is who they went off
//   challenge-kiss  0 did the kissing · 1 was kissed
// `stance` picks the pool: honest says what the speaker feels; two-faced is
// somebody hiding something (a fresh secret, or a mask). The honest hut of a
// FAKER is the giveaway (§6.5): the audience hears what the villa does not.
import { JUST_MET_HUT } from './day/just-met.js';
import { NIGHT_ONE_HUT } from './night-one.js';
import { DEBRIEF_HUT } from './debrief.js';
import { MOVIE_NIGHT_HUT } from './movie-night.js';
import { CASA_HUT } from './casa.js';
import { SECRET_HUT } from './secrets.js';
import { BLOWUP_HUT } from './blowup.js';
import { BREAKDOWN_HUT } from './breakdown.js';
import { TRIANGLE_HUT } from './triangle.js';
import { LIE_HUT } from './lie-detector.js';
const B = { withB: true };
const K = (kind, more = {}) => ({ kind, ...more });
const T = { taken: true };
export const HUT = {
  honest: [
    ...JUST_MET_HUT.honest,
    ...NIGHT_ONE_HUT.honest,
    ...DEBRIEF_HUT.honest,
    ...MOVIE_NIGHT_HUT.honest,
    ...CASA_HUT.honest,
    ...SECRET_HUT.honest,
    ...BLOWUP_HUT.honest,
    ...BREAKDOWN_HUT.honest,
    ...TRIANGLE_HUT.honest,
    ...LIE_HUT.honest,
    // chat
    { id: 'hut.chat.h1', when: K('chat', B), turns: [['a', "I could sit on that daybed with {b} all day. I basically have."]] },
    { id: 'hut.chat.h2', when: K('chat', B), turns: [['a', "It's the little chats with {b} I like the most. Nobody else is in them."]] },
    { id: 'hut.chat.h3', when: K('chat', { ...B, early: true }), turns: [['a', "We're still getting to know each other. So far I like everything I'm finding out."]] },
    { id: 'hut.chat.h4', when: K('chat', { ...B, rung: ['exclusive', 'official'] }), turns: [['a', "We don't even need to talk about anything big any more. It's just easy with {b}."]] },
    { id: 'hut.chat.h5', when: K('chat', { ...B, gap: true }), turns: [['a', "I still don't really know where I stand with {b}. I'm trying not to let it get to me."]] },
    { id: 'hut.chat.h6', when: K('chat', { ...B, mood: 'stressed' }), turns: [['a', "I've had a hard day. Ten minutes with {b} and I feel like a person again."]] },
    { id: 'hut.chat.h7', when: K('chat', { ...B, attachment: 'anxious' }), turns: [['a', "When {b} says we're fine, I believe it. For about an hour."]] },
    { id: 'hut.chat.h8', when: K('chat', { ...B, faking: true }), turns: [['a', "{b} talks. I nod. It's working, so I'm not going to change it."]] },
    // deep-chat
    { id: 'hut.deep.h1', when: K('deep-chat', B), turns: [['a', "I've never told anyone that. Not even at home. I don't know why I told {b}. Actually, I do."]] },
    { id: 'hut.deep.h2', when: K('deep-chat', B), turns: [['a', "That's the first time in here I've actually been honest about me. It was scary, and it was worth it."]] },
    { id: 'hut.deep.h3', when: K('deep-chat', { ...B, role: 1 }), turns: [['a', "{b} opened up to me today. I'm not going to take that lightly."]] },
    { id: 'hut.deep.h4', when: K('deep-chat', { ...B, attachment: 'avoidant' }), turns: [['a', "That was a lot for me. I don't do that. I'm glad it was {b}, though."]] },
    { id: 'hut.deep.h5', when: K('deep-chat', { ...B, mood: 'heartbroken' }), turns: [['a', "I didn't think I'd be able to talk about the last one without crying. I nearly managed it."]] },
    { id: 'hut.deep.h6', when: K('deep-chat', { ...B, faking: true }), turns: [['a', "{b} told me something really personal. I said all the right things. I'm good at the right things."]] },
    // kiss
    { id: 'hut.kiss.h1', when: K('kiss', B), turns: [['a', "Every time {b} kisses me I forget there are cameras. Hi, by the way."]] },
    { id: 'hut.kiss.h2', when: K('kiss', { ...B, early: true }), turns: [['a', "That was our first real kiss. I'm trying to act normal about it and I'm not managing."]] },
    { id: 'hut.kiss.h3', when: K('kiss', { ...B, rung: ['exclusive', 'official'] }), turns: [['a', "I still get butterflies with {b}. I thought that would have stopped by now."]] },
    { id: 'hut.kiss.h4', when: K('kiss', { ...B, gap: true }), turns: [['a', "When {b} kisses me like that, it's hard to remember I'm not sure where we stand."]] },
    { id: 'hut.kiss.h5', when: K('kiss', { ...B, faking: true }), turns: [['a', "It's a kiss. It's television. {b} is lovely, and I'm doing what I need to do."]] },
    // pull
    { id: 'hut.pull.h1', when: K('pull', { ...B, role: 0 }), turns: [['a', "I went for it with {b}. I'm not going to sit here in a few weeks wondering what if."]] },
    { id: 'hut.pull.h2', when: K('pull', { ...B, role: 0 }), turns: [['a', "{b} makes me nervous. Good nervous. The kind you don't get very often."]] },
    { id: 'hut.pull.h3', when: K('pull', { ...B, role: 0, taken: true }), turns: [['a', "I know I'm coupled up. I also know I'd regret not talking to {b}."]] },
    { id: 'hut.pull.h4', when: K('pull', { ...B, role: 0, bombshell: true }), turns: [['a', "I didn't come in here to sit on the sidelines. {b} is the one I want to get to know."]] },
    { id: 'hut.pull.h5', when: K('pull', { ...B, role: 1, rebuffed: false }), turns: [['a', "I didn't see that coming from {b}. I don't hate it, either."]] },
    { id: 'hut.pull.h6', when: K('pull', { ...B, role: 1, taken: true }), turns: [['a', "I'm with someone. I know I'm with someone. It's still nice to be asked."]] },
    { id: 'hut.pull.h7', when: K('pull', { ...B, role: 1, taken: true, loyal: true }), turns: [['a', "Nothing's going to happen with {b}. I'm telling you, and I'll be telling my partner too."]] },
    { id: 'hut.pull.h8', when: K('pull', { ...B, role: 1, persona: 'wallflower' }), turns: [['a', "Nobody ever pulls me for a chat. I didn't know what to do with my hands."]] },
    // loyalty
    { id: 'hut.loyalty.h1', when: K('loyalty', { ...B, role: 0 }), turns: [['a', "{b} tried it. Fair play for trying. But I'm not interested."]] },
    { id: 'hut.loyalty.h2', when: K('loyalty', { ...B, role: 0 }), turns: [['a', "It's nice to be wanted. It's nicer to know exactly who I want."]] },
    { id: 'hut.loyalty.h3', when: K('loyalty', { ...B, role: 0, myRung: ['exclusive', 'official'] }), turns: [['a', "I said I was closed off, and I meant it. That was me proving it."]] },
    { id: 'hut.loyalty.h4', when: K('loyalty', { ...B, role: 1 }), turns: [['a', "I got turned down by {b}. I'll live. I'll just be dramatic about it for about an hour."]] },
    { id: 'hut.loyalty.h5', when: K('loyalty', { ...B, role: 1 }), turns: [['a', "{b} said no. I respect it. I'm a bit {~gutted}, but I respect it."]] },
    // argument
    { id: 'hut.argument.h1', when: K('argument', { ...B, role: 0 }), turns: [['a', "I lost my temper with {b}. I'm not proud of it. I'm not sorry about all of it, either."]] },
    { id: 'hut.argument.h2', when: K('argument', { ...B, role: 0, coupled: true }), turns: [['a', "Couples argue. That's what I keep telling myself. It's just a lot louder with a microphone on."]] },
    { id: 'hut.argument.h3', when: K('argument', { ...B, role: 0, archetype: 'hothead' }), turns: [['a', "People say I overreact. Maybe I do. At least I say what I'm thinking."]] },
    { id: 'hut.argument.h4', when: K('argument', { ...B, role: 1 }), turns: [['a', "I didn't even know I'd done anything until {b} was standing in front of me."]] },
    { id: 'hut.argument.h5', when: K('argument', { ...B, role: 1, coupled: true }), turns: [['a', "I love {b}, but when {b} gets like that, there's no talking. I just have to wait."]] },
    { id: 'hut.argument.h6', when: K('argument', { ...B, coupled: false }), turns: [['a', "{b} and I were never going to be friends. I just didn't think it'd all kick off today."]] },
    { id: 'hut.argument.h7', when: K('argument', { ...B, mood: 'jealous' }), turns: [['a', "I don't want to be the jealous one. I've been the jealous one before. It's horrible."]] },
    // friendship
    { id: 'hut.friend.h1', when: K('friendship', B), turns: [['a', "{b} is the one I'll call first when we get out. I think {b} knows that."]] },
    { id: 'hut.friend.h2', when: K('friendship', B), turns: [['a', "Forget the couples. {b} is the best thing I've found in here."]] },
    { id: 'hut.friend.h3', when: K('friendship', B), turns: [['a', "You need someone in here who isn't part of your love life. For me, that's {b}."]] },
    { id: 'hut.friend.h4', when: K('friendship', { ...B, gender: 'f', bGender: 'f' }), turns: [['a', "The girls are the reason I've lasted this long. {b} most of all."]] },
    { id: 'hut.friend.h5', when: K('friendship', { ...B, gender: 'm', bGender: 'm' }), turns: [['a', "{b}'s a real {~a-mate}. Tells me when I'm being an idiot, which is a lot."]] },
    { id: 'hut.friend.h6', when: K('friendship', { ...B, mood: 'heartbroken' }), turns: [['a', "I don't know what I'd have done this week without {b}. Honestly."]] },
    { id: 'hut.friend.h7', when: K('friendship', { ...B, late: true }), turns: [['a', "I came in for a relationship. I'm going to leave with a best friend, whatever happens."]] },
    // gossip
    { id: 'hut.gossip.h1', when: K('gossip', { ...B, role: 0 }), turns: [['a', "I didn't want to be the one to tell {b}. But I'd want to know, so I told."]] },
    { id: 'hut.gossip.h2', when: K('gossip', { ...B, role: 0, persona: 'girls-girl', gender: 'f' }), turns: [['a', "Girl code is girl code. I don't care who it upsets."]] },
    { id: 'hut.gossip.h3', when: K('gossip', { ...B, role: 0 }), turns: [['a', "I've probably just made an enemy. I'd rather that than watch {b} get lied to."]] },
    { id: 'hut.gossip.h4', when: K('gossip', { ...B, role: 1 }), turns: [['a', "I trusted them. That's the bit I can't get over. I trusted them."]] },
    { id: 'hut.gossip.h5', when: K('gossip', { ...B, role: 1, attachment: 'avoidant' }), turns: [["a", "I'm not going to cry about it on camera. I'll do that later, when nobody's looking."]] },
    { id: 'hut.gossip.h6', when: K('gossip', { ...B, role: 1 }), turns: [['a', "I'm glad {b} told me. I'm not glad about what {b} told me."]] },
    { id: 'hut.gossip.h7', when: K('gossip', { role: 2 }), turns: [['a', "Everyone's looking at me like I've run someone over. I had a chat. A chat went too far."]] },
    // comedy — nobody else in the scene
    { id: 'hut.comedy.h1', when: K('comedy'), turns: [['a', "Somebody has to keep this place going. It might as well be me."]] },
    { id: 'hut.comedy.h2', when: K('comedy'), turns: [['a', "If I can make them laugh on a day like today, I've done my job."]] },
    { id: 'hut.comedy.h3', when: K('comedy', { mood: 'stressed' }), turns: [['a', "I make jokes when I'm stressed. I've been making a lot of jokes."]] },
    { id: 'hut.comedy.h4', when: K('comedy', { mood: 'lonely' }), turns: [['a', "Everyone laughs at the jokes. Nobody asks how I'm doing. That's fine. Mostly."]] },
    // ick
    { id: 'hut.ick.h1', when: K('ick', { ...B, role: 0 }), turns: [['a', "I can't explain it. I just can't un-see it now. Poor {b}."]] },
    { id: 'hut.ick.h2', when: K('ick', { ...B, role: 0 }), turns: [['a', "I feel awful. {b} hasn't done anything wrong. It's just gone."]] },
    { id: 'hut.ick.h3', when: K('ick', { ...B, role: 1 }), turns: [['a', "{b}'s gone a bit quiet on me. I don't know what I've done."]] },
    // challenge-kiss
    { id: 'hut.ckiss.h1', when: K('challenge-kiss', { ...B, role: 0, taken: true }), turns: [['a', "It was a game. I just hope my partner sees it that way."]] },
    { id: 'hut.ckiss.h2', when: K('challenge-kiss', { ...B, role: 0, taken: false }), turns: [['a', "I got to kiss {b} and call it a challenge. Best day in here so far."]] },
    { id: 'hut.ckiss.h3', when: K('challenge-kiss', { ...B, role: 1 }), turns: [['a', "Out of everyone in that line, {b} picked me. I'm going to be thinking about that all night."]] },
    { id: 'hut.ckiss.h4', when: K('challenge-kiss', { ...B, role: 1, taken: true }), turns: [['a', "I didn't pick it. I didn't stop it, either. I'll have some explaining to do."]] },
    // challenge-win
    { id: 'hut.cwin.h1', when: K('challenge-win', B), turns: [['a', "We won, and the first thing I wanted to do was look at {b}. That's new for me."]] },
    { id: 'hut.cwin.h2', when: K('challenge-win', B), turns: [['a', "{b} and I make a good team. I'd like to find out what else we're good at."]] },
    // more for the scenes the villa has most of
    { id: 'hut.chat.h9', when: K('chat', B), turns: [['a', "Nothing happened today, really. I just spent it with {b}, and it was one of my favourite days in here."]] },
    { id: 'hut.chat.h10', when: K('chat', { ...B, late: true }), turns: [['a', "We've been together a while now. I still look forward to talking to {b} every morning."]] },
    { id: 'hut.friend.h8', when: K('friendship', B), turns: [['a', "Everyone thinks it's all about the couples. Half my best moments in here have been with {b}."]] },
    { id: 'hut.friend.h9', when: K('friendship', { ...B, taken: true }), turns: [['a', "When it goes wrong with my partner, {b} is the one I go and find. Every time."]] },
    { id: 'hut.friend.h10', when: K('friendship', { ...B, mood: 'lonely' }), turns: [['a', "I was feeling a bit on my own today. {b} noticed without me saying anything."]] },
    { id: 'hut.pull.h9', when: K('pull', { ...B, role: 0 }), turns: [['a', "I was so nervous going over to {b}. I don't think it showed. I hope it didn't show."]] },
    { id: 'hut.pull.h10', when: K('pull', { ...B, role: 1, rebuffed: false }), turns: [['a', "{b} wants to get to know me. I'm going to let {b}, and see what happens."]] },
    { id: 'hut.kiss.h6', when: K('kiss', B), turns: [['a', "I don't care who saw that. I'd do it again."]] },
    { id: 'hut.argument.h8', when: K('argument', { ...B, role: 1 }), turns: [['a', "I'm not going to shout back. That's what {b} wants. I'm going to wait until it's calmed down."]] },
    { id: 'hut.deep.h7', when: K('deep-chat', B), turns: [['a', "I feel lighter. I didn't know I was carrying all that until I put it down."]] },
    // the ladder
    { id: 'hut.close.h1', when: K('close-off', { ...B, role: 0 }), turns: [['a', "I've never closed myself off for anyone before. It's terrifying. I'm glad I did it."]] },
    { id: 'hut.close.h2', when: K('close-off', { ...B, role: 1 }), turns: [['a', "{b} closed off for me. I didn't know I needed to hear it until I heard it."]] },
    { id: 'hut.close.h3', when: K('close-off', { ...B, role: 1, feels: 'little' }), turns: [['a', "{b} closed off for me today. I don't feel the same yet, and I don't know what to do with that."]] },
    { id: 'hut.open.h1', when: K('keeping-open', { ...B, role: 0 }), turns: [['a', "I'd rather be honest now than hurt {b} later. I'm not ready to close off."]] },
    { id: 'hut.open.h2', when: K('keeping-open', { ...B, role: 1 }), turns: [['a', "{b} is keeping options open. Fine. I heard it. I don't like it."]] },
    { id: 'hut.reopen.h1', when: K('open-back-up', { ...B, role: 0 }), turns: [['a', "That was the hardest conversation I've had in here. {b} didn't deserve it. I still had to have it."]] },
    { id: 'hut.reopen.h2', when: K('open-back-up', { ...B, role: 1 }), turns: [['a', "{b} told me it was me. Now it isn't. I don't know what to believe any more."]] },
    { id: 'hut.turned.h1', when: K('head-turned'), turns: [['a', "I'm happy where I am. I keep saying it. I'm starting to wonder who I'm saying it for."]] },
    { id: 'hut.turned.h2', when: K('head-turned', { taken: true }), turns: [['a', "{pa} hasn't done anything wrong. That's what makes it so hard."]] },
    { id: 'hut.ask.h1', when: K('exclusive-ask', { ...B, role: 0 }), turns: [['a', "I was so nervous. My hands were shaking. And {b} said yes."]] },
    { id: 'hut.ask.h2', when: K('exclusive-ask', { ...B, role: 1 }), turns: [['a', "{b} asked me to be exclusive. I've been smiling for about an hour."]] },
    { id: 'hut.ask.h3', when: K('official-ask', { ...B, role: 0 }), turns: [['a', "{b} is my {b.gf}. I'm going to be saying that a lot."]] },
    { id: 'hut.ask.h4', when: K('official-ask', { ...B, role: 1 }), turns: [['a', "{b} asked me to make it official. I'm never going to forget that."]] },
    { id: 'hut.declined.h1', when: K('ask-declined', { ...B, role: 0 }), turns: [['a', "{b} said no. Not yet, anyway. I asked too soon, maybe. It still hurts."]] },
    { id: 'hut.declined.h2', when: K('ask-declined', { ...B, role: 1 }), turns: [['a', "I couldn't say yes to {b}. Not when I don't feel it yet. I hate that I hurt {b}."]] },
    { id: 'hut.love.h1', when: K('love-said', B), turns: [['a', "I said it, and {b} said it back. I don't think I've ever been this happy."]] },
    { id: 'hut.love.h2', when: K('love-hanging', { ...B, role: 0 }), turns: [['a', "I told {b} I love {b.obj}. And {b} didn't say it back. I shouldn't have said it."]] },
    { id: 'hut.love.h3', when: K('love-hanging', { ...B, role: 1 }), turns: [['a', "{b} said the L word. I couldn't say it back. I wasn't going to lie about something like that."]] },
    { id: 'hut.hide.h1', when: K('hideaway', B), turns: [['a', "A night in the hideaway with {b}. I'm not telling you anything else."]] },
    // the feelings
    { id: 'hut.torch.h1', when: K('torch', B), turns: [['a', "Seeing {b} go in there with someone else — I thought I was over that. I'm not."]] },
    { id: 'hut.confront.h1', when: K('jealous-confront', { ...B, role: 0 }), turns: [['a', "I had to say something to {b}. I'd have exploded if I didn't."]] },
    { id: 'hut.confront.h2', when: K('jealous-confront', { ...B, role: 1 }), turns: [['a', "{b} thinks I've got something going on. I haven't. At least, I don't think I have."]] },
    { id: 'hut.sulk.h1', when: K('jealous-sulk', T), turns: [['a', "I'm not going to cause a scene. I'm just going to sit here and be upset quietly."]] },
    { id: 'hut.sulk.h2', when: K('jealous-sulk', T), turns: [['a', "If {pa} can't see why I'm upset, that's a problem in itself."]] },
    { id: 'hut.retaliate.h1', when: K('jealous-retaliate', { role: 0 }), turns: [['a', "Two can play that game. I know it's childish. I'm doing it anyway."]] },
    { id: 'hut.retaliate.h2', when: K('jealous-retaliate', { ...B, role: 1 }), turns: [['a', "I know {b} was only talking to me to make a point. I'm not stupid. It was still nice."]] },
    { id: 'hut.reassure.h1', when: K('reassurance', { ...B, role: 0 }), turns: [['a', "I needed to hear that from {b}. I feel like I can breathe again."]] },
    { id: 'hut.reassure.h2', when: K('reassurance', { ...B, role: 1 }), turns: [['a', "{b} worries. I get it. I'll say it as many times as {b} needs to hear it."]] },
    { id: 'hut.reassure.h3', when: K('reassurance', { ...B, role: 1, attachment: 'avoidant' }), turns: [['a', "I love {b}. I just can't keep having the same conversation every night."]] },
    { id: 'hut.overthink.h1', when: K('overthinking', T), turns: [['a', "Nothing's even happened. That's the worst bit. My head's just making things up."]] },
    { id: 'hut.confess.h1', when: K('confession', { ...B, role: 0 }), turns: [['a', "I told {b}. I feel sick. But I couldn't carry it any more."]] },
    { id: 'hut.confess.h2', when: K('confession', { ...B, role: 1 }), turns: [['a', "At least {b} told me. That's the only thing I can say for {b.obj} right now."]] },
    { id: 'hut.advice.h1', when: K('advice', { ...B, role: 0 }), turns: [['a', "I'd rather {b} hears it from a friend than finds out the hard way."]] },
    { id: 'hut.advice.h2', when: K('advice', { ...B, role: 1 }), turns: [['a', "When someone who knows me that well says something, I have to listen. Even if I don't want to."]] },
    { id: 'hut.double.h1', when: K('double-standard', B), turns: [['a', "Everyone keeps saying they're not judging. They're judging. Just not {b}."]] },
    // the ladder and the feelings (their own scenes are written in Task 3)
    { id: 'hut.couple.h1', when: { kind: ['chat', 'deep-chat', 'kiss', 'challenge-win'], ...B }, turns: [['a', "I didn't expect to like {b} this much. It's annoying, actually. I had a whole plan."]] },
    { id: 'hut.couple.h2', when: { kind: ['chat', 'deep-chat', 'kiss', 'challenge-win'], ...B, rung: ['exclusive', 'official'] }, turns: [['a', "I don't look up any more when someone new walks in. That's how I know."]] },
    { id: 'hut.couple.h3', when: { kind: ['chat', 'deep-chat', 'kiss', 'challenge-win'], ...B, rung: 'official' }, turns: [['a', "I'm official. On {~telly}. There's no taking that back now, and I don't want to."]] },
    { id: 'hut.jealous.h1', when: { kind: ['argument', 'jealous-confront'], role: 0 }, turns: [['a', "I know I'm being jealous. Knowing doesn't make it stop."]] },
    // the moments (their own scenes are written in Task 4)
    { id: 'hut.dump.h1', when: { family: 'dumping' }, turns: [['a', "The fire pit is the worst place in the world. It's also where everything gets decided."]] },
    { id: 'hut.dump.h2', when: { family: 'dumping' }, turns: [['a', "My hands are still shaking. Look at them."]] },
    { id: 'hut.dump.l1', when: { family: 'dumping', leaving: true }, turns: [['a', "I'm heartbroken. I'm not going to pretend I'm not. But I'm going home with my head held high."]] },
    { id: 'hut.dump.l2', when: { family: 'dumping', leaving: true }, turns: [['a', "I came in for love, and I'm leaving with a lot of friends. That's not nothing."]] },
    { id: 'hut.dump.l3', when: { family: 'dumping', leaving: true }, turns: [['a', "I wasn't ready. I don't think you ever are."]] },
    { id: 'hut.dump.h3', when: { kind: 'recouple-pick', role: 0 }, turns: [['a', "I stood up there and said it out loud. Whatever happens now, I said it."]] },
    { id: 'hut.dump.h4', when: { kind: 'recouple-pick', role: 1 }, turns: [['a', "I didn't know until my name came out. I was holding my breath the whole speech."]] },
    { id: 'hut.casa.h1', when: { kind: 'photos', role: 0 }, turns: [['a', "Casa Amor is where couples go to die. I just didn't think it would be mine."]] },
    { id: 'hut.casa.h2', when: { kind: 'casa-return', role: 0, choice: 'stick', of: 'returned' }, turns: [['a', "I walked back in on my own. Whatever's waiting for me, I can look it in the eye."]] },
    { id: 'hut.casa.h3', when: { kind: 'photos', role: 0 }, turns: [['a', "You can say you trust someone all you want. Then there's a photo, and it's in your hand."]] },
    { id: 'hut.final.h1', when: { kind: 'declaration', role: 0 }, turns: [['a', "I meant every word of that. I'd say it again in front of the whole country."]] },
    { id: 'hut.final.h2', when: { kind: 'declaration', role: 1, withB: true }, turns: [['a', "Nobody has ever said anything like that to me. I didn't know {b} felt all of that."]] },
    { id: 'hut.final.h3', when: { kind: 'reveal' }, turns: [['a', "I forgot that was even filmed. I'm going to hear about that one for years."]] },
    { id: 'hut.final.h4', when: { kind: 'walk' }, turns: [['a', "It's the hardest decision I've made in here. I know it's the right one."]] },
    { id: 'hut.casa.h4', when: { kind: 'casa-return', role: 0, choice: 'twist', taken: true }, turns: [['a', "I knew I'd be the bad guy walking back in. I still think I made the right choice."]] },
    { id: 'hut.casa.h5', when: { kind: 'casa-return', role: 1, choice: 'twist' }, turns: [['a', "I've just walked into a villa where half the people hate me already. Brilliant."]] },
    { id: 'hut.casa.h6', when: { kind: 'casa-return', role: 0, choice: 'stick', of: 'returned' }, turns: [['a', "I didn't do anything at Casa I'd be ashamed of. I can look my partner in the eye."]] },
    { id: 'hut.entrance.h1', when: { kind: 'entrance' }, turns: [['a', "Walking down those steps with everyone looking at me was terrifying. I'd do it again."]] },
    { id: 'hut.date.h1', when: { kind: 'date', ...B, role: 0 }, turns: [['a', "The date with {b} went better than I thought it would. Watch this space."]] },
    { id: 'hut.date.h2', when: { kind: 'date', ...B, role: 1 }, turns: [['a', "I went on a date with {b}. It was nice. I don't know what it means yet."]] },
    { id: 'hut.ritual.h1', when: { kind: 'heart-rate' }, turns: [['a', "You can't lie to a heart monitor. I've just found that out the hard way."]] },
    { id: 'hut.ritual.h2', when: { kind: 'movie-night', role: 0 }, turns: [['a', "I didn't think anyone would ever see that. Now everyone has."]] },
    { id: 'hut.ritual.h3', when: { kind: 'families', ...B, role: 0 }, turns: [['a', "Seeing my family with {b} made it all feel real."]] },
    { id: 'hut.ritual.h4', when: { kind: 'notes', role: 1 }, turns: [['a', "Whoever wrote that note, I hope you're happy. I'm not."]] },
    { id: 'hut.flirt.h1', when: { family: 'flirting', ...B, bombshell: true }, turns: [['a', "I came in here for {b}. I'm not going to pretend I didn't."]] },
  ],
  'two-faced': [
    ...JUST_MET_HUT['two-faced'],
    ...NIGHT_ONE_HUT['two-faced'],
    ...DEBRIEF_HUT['two-faced'],
    ...MOVIE_NIGHT_HUT['two-faced'],
    ...CASA_HUT['two-faced'],
    ...SECRET_HUT['two-faced'],
    ...BLOWUP_HUT['two-faced'],
    ...BREAKDOWN_HUT['two-faced'],
    ...TRIANGLE_HUT['two-faced'],
    ...LIE_HUT['two-faced'],
    // chat
    { id: 'hut.chat.t1', when: K('chat', B), turns: [['a', "{b} asked me if everything's okay. I said yes. It's mostly yes."]] },
    { id: 'hut.chat.t2', when: K('chat', B), turns: [['a', "Sitting there with {b}, all I could think about was earlier. I can't tell {b} that."]] },
    { id: 'hut.chat.t3', when: K('chat', { ...B, faking: true }), turns: [['a', "{b} really likes me. I really like being liked. That'll do for now."]] },
    // deep-chat
    { id: 'hut.deep.t1', when: K('deep-chat', B), turns: [['a', "{b} was being so honest with me, and I was sitting there hiding something. I felt sick."]] },
    { id: 'hut.deep.t2', when: K('deep-chat', { ...B, faking: true }), turns: [['a', "Everyone thinks I'm head over heels. Let them. Head over heels gets votes."]] },
    // kiss
    { id: 'hut.kiss.t1', when: K('kiss', B), turns: [['a', "Kissing {b} is nice. Kissing {b} is safe. I'm just not sure I came in here for safe."]] },
    { id: 'hut.kiss.t2', when: K('kiss', B), turns: [['a', "If {b} knew what I'd been doing, that kiss wouldn't have happened. So {b} doesn't know."]] },
    // pull
    { id: 'hut.pull.t1', when: K('pull', { ...B, role: 0, taken: true }), turns: [['a', "I'm coupled up, but I'm not blind. And {b} is very hard not to look at."]] },
    { id: 'hut.pull.t2', when: K('pull', { ...B, role: 0 }), turns: [['a', "It was a chat. It was a long chat. It was a very, very long chat."]] },
    { id: 'hut.pull.t3', when: K('pull', { ...B, role: 1, taken: true }), turns: [['a', "Nothing happened with {b}. And if something did, it was very small, and nobody saw."]] },
    // loyalty
    { id: 'hut.loyalty.t1', when: K('loyalty', { ...B, role: 0 }), turns: [['a', "I said no to {b} in front of everyone. It helps if people think I'm loyal. Especially this week."]] },
    // argument
    { id: 'hut.argument.t1', when: K('argument', B), turns: [['a', "An argument's handy, actually. Nobody asks where you've been if you're busy shouting."]] },
    { id: 'hut.argument.t2', when: K('argument', { ...B, role: 0 }), turns: [['a', "I'm upset with {b}. I'm also aware I'm not really in a position to be upset. Both things are true."]] },
    // friendship
    { id: 'hut.friend.t1', when: K('friendship', B), turns: [['a', "{b} tells me everything. That's useful. That's also why I'm not telling {b} everything."]] },
    { id: 'hut.friend.t2', when: K('friendship', B), turns: [['a', "I love {b}. I just can't tell {b} what I did. Not yet."]] },
    // gossip
    { id: 'hut.gossip.t1', when: K('gossip', { role: 2 }), turns: [['a', "It wasn't what it looked like. It was a bit what it looked like."]] },
    { id: 'hut.gossip.t2', when: K('gossip', { role: 2 }), turns: [['a', "Whoever {~grassed} on me needs to have a long look at themselves. I'm not saying I didn't do it."]] },
    { id: 'hut.gossip.t3', when: K('gossip', { ...B, role: 0 }), turns: [['a', "I told {b} because {b} deserved to know. And because it doesn't hurt me if that couple goes."]] },
    // comedy
    { id: 'hut.comedy.t1', when: K('comedy'), turns: [['a', "If everyone's laughing, nobody's asking questions. Works every time."]] },
    // ick, challenge
    { id: 'hut.ick.t1', when: K('ick', { ...B, role: 0 }), turns: [['a', "The ick's real. It's also a good excuse, and I'm not going to tell {b} why I need one."]] },
    { id: 'hut.ckiss.t1', when: K('challenge-kiss', { ...B, role: 0 }), turns: [['a', "It's a challenge. That's my excuse, and I'm sticking to it."]] },
    { id: 'hut.cwin.t1', when: K('challenge-win', B), turns: [['a', "Winning with {b} felt great. It'd feel better if I wasn't keeping something from {b}."]] },
    // more for the scenes the villa has most of
    { id: 'hut.chat.t4', when: K('chat', B), turns: [['a', "{b} was telling me how happy {b} is. I was nodding. I was thinking about someone else."]] },
    { id: 'hut.chat.t5', when: K('chat', { ...B, mood: 'guilty' }), turns: [['a', "Every time {b} is nice to me, I feel worse. And {b} is always nice to me."]] },
    { id: 'hut.deep.t3', when: K('deep-chat', B), turns: [['a', "I meant most of what I said to {b}. Most of it."]] },
    { id: 'hut.kiss.t3', when: K('kiss', { ...B, mood: 'guilty' }), turns: [['a', "{b} kissed me, and I kissed back, and the whole time I was thinking, if you knew."]] },
    { id: 'hut.pull.t4', when: K('pull', { ...B, role: 0 }), turns: [['a', "If my partner asks, it was a chat about the challenge. It wasn't a chat about the challenge."]] },
    { id: 'hut.pull.t5', when: K('pull', { ...B, role: 1 }), turns: [['a', "I told {b} I'm happy where I am. I didn't say how happy. There's a difference."]] },
    { id: 'hut.friend.t3', when: K('friendship', B), turns: [['a', "{b} asked me straight out if I'd done anything. I said no. I hated saying no."]] },
    { id: 'hut.friend.t4', when: K('friendship', { ...B, taken: true }), turns: [['a', "If {b} finds out before my partner does, it's over. So {b} can't find out."]] },
    { id: 'hut.argument.t3', when: K('argument', { ...B, role: 1 }), turns: [['a', "{b} was shouting at me about the wrong thing. I let {b}. Better that than {b} finding out what I actually did."]] },
    { id: 'hut.loyalty.t2', when: K('loyalty', { ...B, role: 1 }), turns: [['a', "{b} said no today. That doesn't mean no tomorrow."]] },
    { id: 'hut.comedy.t2', when: K('comedy', { mood: 'guilty' }), turns: [['a', "I've been the funny one all day. It's easier than being the one with something to say."]] },
    { id: 'hut.cwin.t2', when: K('challenge-win', { ...B, mood: 'guilty' }), turns: [['a', "{b} hugged me after we won and said we're the best couple in here. I couldn't look at {b}."]] },
    { id: 'hut.ckiss.t2', when: K('challenge-kiss', { ...B, role: 1 }), turns: [['a', "The whole villa thinks that was for the points. It wasn't all for the points."]] },
    // the ladder and the feelings
    { id: 'hut.close.t1', when: K('close-off', { ...B, role: 0 }), turns: [['a', "I told {b} I've closed off. I have. Mostly."]] },
    { id: 'hut.ask.t1', when: K('exclusive-ask', { ...B, role: 1 }), turns: [['a', "I said yes to {b}. Now I just have to make sure nothing else comes out."]] },
    { id: 'hut.love.t1', when: K('love-said', B), turns: [['a', "I said it back. I think I mean it. I want to mean it."]] },
    { id: 'hut.confront.t1', when: K('jealous-confront', { ...B, role: 1 }), turns: [['a', "{b} hasn't got the whole story. And I'm not going to be the one to give it."]] },
    { id: 'hut.reassure.t1', when: K('reassurance', { ...B, role: 1 }), turns: [['a', "{b} needed to hear it, so I said it. Whether it's still true is another question."]] },
    { id: 'hut.confess.t1', when: K('confession', { ...B, role: 0 }), turns: [['a', "I told {b} some of it. Not all of it. The rest can wait."]] },
    { id: 'hut.advice.t1', when: K('advice', { ...B, role: 0 }), turns: [['a', "I told {b} what I think of {b.posAdj} partner. I didn't say why I care so much."]] },
    { id: 'hut.hide.t1', when: K('hideaway', B), turns: [['a', "The hideaway was lovely. I kept thinking about what {b} would say if {b} knew."]] },
    // the ladder, feelings and moments (Tasks 3 and 4)
    { id: 'hut.couple.t1', when: { kind: ['chat', 'deep-chat', 'kiss', 'challenge-win'], ...B }, turns: [['a', "Everyone keeps saying we're solid. On paper, maybe. I'll see how this week goes, and then I'll decide."]] },
    { id: 'hut.couple.t2', when: { kind: ['chat', 'deep-chat', 'kiss', 'challenge-win'], ...B, rung: ['closed-off', 'exclusive'] }, turns: [['a', "I told {b} I'd closed myself off. I have. Mostly. There's a {~little} window I haven't shut."]] },
    { id: 'hut.jealous.t1', when: { kind: ['argument', 'jealous-confront', 'jealous-sulk'] }, turns: [['a', "I'm going to act like I'm upset about this. And I am. Just not for the reason they think."]] },
    { id: 'hut.dump.t1', when: { kind: ['dump-verdict', 'dump-verdict-couple', 'dump-verdict-singles', 'dump-reaction', 'dump-goodbye', 'dump-fallout'], leaving: false }, turns: [['a', "I stood there looking sad. I was a bit sad. I was mostly relieved it wasn't me."]] },
    { id: 'hut.dump.t2', when: { kind: 'recouple-pick', role: 0 }, turns: [['a', "Did I pick with my heart or my head? I picked with the bit that wants to stay in the villa."]] },
    { id: 'hut.casa.t1', when: { kind: 'casa-return', role: 0, choice: 'stick', of: 'returned' }, turns: [['a', "What happens at Casa stays at Casa. That's what everyone says, isn't it?"]] },
  ],
};
