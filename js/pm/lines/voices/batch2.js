// pm/lines/voices/batch2.js — see index.js. [entry id, exact line, { voice: line }]
//
// Batch 2: every TAG its own words on the most-heard replies. The user, 2026-10-22:
// "how can u write someone loud shy flirty nerdy bossy calm etc" — batch 1 gave
// most speakers their FAMILY (an earnest islander and an anxious one both got
// "soft"), and the probe said so: 9.3% of lines voiced, 2.1% in the speaker's own
// top tag. These add the tags batch 1 left to their family, on the same lines
// (the voices merge onto the turn), so the speaker's own tag wins first.
//   earnest  plain and sincere, means every word      warm      affectionate, looks after you
//   calm     unhurried, steadying                     blunt     no padding at all
//   bossy    takes charge, tells you what happens     cruel     a put-down in it
//   tough    hard, unbothered                         competitive  turns it into winning
//   theatrical  big, dramatic                         nerdy     precise, a bit wordy
//   goofy    a silly joke                             chaotic   all over the place
//   ditzy    a step behind                            proud     it's about them
//   emotional  feelings spilling over
export const BATCH2 = [
  ['*', 'Go on.', {
    earnest: "Go on. I want to hear it.", warm: 'Go on. Take all the time you need.', calm: "Go on. No rush.", blunt: 'Say it.',
    bossy: 'Go on. From the start.', cruel: "Go on, then. This should be good.", tough: "Go on. I can take it.", competitive: "Go on. Bet I can top it.",
    theatrical: 'Go on! The suspense is killing me!', nerdy: 'Go on. Context first, please.', goofy: 'Go on. Drumroll.', chaotic: "Go on, go on, go on, I can't wait!",
    ditzy: 'Go on… wait, go on with what?', proud: "Go on. I probably already know.", emotional: "Go on. I'm already welling up." }],
  ['*', 'I know.', {
    earnest: 'I know. Honestly, I do.', warm: 'I know, I know. Come here.', calm: "I know. It's all right.", blunt: 'I know.',
    bossy: "I know. That's why I said it.", cruel: 'Obviously I know.', tough: 'I know. Not my first time.', competitive: 'I know. I knew first.',
    theatrical: 'I KNOW. Believe me, I know.', nerdy: "I know. I've thought about it a lot.", goofy: 'I know. I am very wise.', chaotic: 'I know! Do you know? We both know!',
    ditzy: 'I know! Wait, what do I know?', proud: 'Of course I know.', emotional: "I know. It's a lot, isn't it?" }],
  ['*', 'Me too.', {
    earnest: 'Me too. I mean that.', warm: "Me too, sweetheart. Me too.", calm: 'Me too.', blunt: 'Same.',
    bossy: "Me too. So that's settled.", cruel: 'Me too, unfortunately.', tough: 'Same here.', competitive: 'Me too. More, probably.',
    theatrical: 'Me too! Oh my God, me too!', nerdy: 'Me too. Statistically, we were bound to.', goofy: 'Me too! Jinx!', chaotic: 'Me too! Ha! Me too!',
    ditzy: 'Me too! Wait, me too what?', proud: "Me too. I'd say I did it better.", emotional: 'Me too. Stop, you\'ll set me off.' }],
  ['*', 'Good.', {
    earnest: "Good. I'm really glad.", warm: 'Good. That makes me happy.', calm: 'Good. That\'s good.', blunt: 'Good.',
    bossy: 'Good. Keep it that way.', cruel: 'Good. Took you long enough.', tough: 'Good.', competitive: 'Good. Point to me.',
    theatrical: 'Good! Wonderful! Marvellous!', nerdy: 'Good. That\'s the best outcome.', goofy: 'Good. Very good. Excellent. Splendid.', chaotic: 'Good! Great! What now?',
    ditzy: 'Good! …Good what?', proud: 'Good. I knew it would be.', emotional: "Good. Oh, I'm so relieved." }],
  ['*', 'Always.', {
    earnest: 'Always. You never have to ask.', warm: 'Always. You know I\'ve got you.', calm: 'Always.', blunt: 'Always.',
    bossy: 'Always. Don\'t ask again.', cruel: 'Always. Try to keep up.', tough: 'Always. No question.', competitive: 'Always. Every time.',
    theatrical: 'Always! Until the end of time!', nerdy: 'Always. Without exception.', goofy: 'Always. Even on Tuesdays.', chaotic: 'Always! Forever! Obviously!',
    ditzy: 'Always! I think so, yeah.', proud: 'Always. That\'s the kind of person I am.', emotional: "Always. Don't make me cry." }],
  ['*', 'No.', {
    earnest: "No. I'm sorry, but no.", warm: "Aw, no. Sorry.", calm: 'No.', blunt: 'No.',
    bossy: 'No. End of discussion.', cruel: 'No. Obviously not.', tough: 'Nah.', competitive: 'No. Not happening.',
    theatrical: 'No! Absolutely not! Never!', nerdy: 'No. For several reasons.', goofy: 'Nope. Nopity nope.', chaotic: 'No! Wait. No. Still no.',
    ditzy: 'No? No.', proud: 'No. I don\'t do that.', emotional: "No. I can't." }],
  ['*', 'Are we okay?', {
    earnest: 'Are we okay? I need to know.', warm: 'Are we okay? Come here and tell me.', calm: "Let's check in. Are we okay?", blunt: 'Are we okay or not?',
    bossy: 'Right. Are we okay? Yes or no.', cruel: 'Are we okay, or are you still sulking?', tough: 'We good?', competitive: "Are we okay? Because I'm not losing you over this.",
    theatrical: "Are we okay? I can't take the suspense!", nerdy: 'Are we okay? I want to understand where we stand.', goofy: 'Are we okay? Blink twice for yes.', chaotic: 'Are we okay? Are we? I need to know right now.',
    ditzy: 'Are we okay? I wasn\'t sure if we were fighting.', proud: "Are we okay? I'd hate for you to be upset with me.", emotional: "Are we okay? I can't stop thinking about it." }],
  ['*', 'Okay.', {
    earnest: 'Okay. Thank you for telling me.', warm: 'Okay. Whatever you need.', calm: 'Okay.', blunt: 'Fine.',
    bossy: 'Okay. Here\'s what we do.', cruel: 'Okay. Whatever.', tough: 'Cool.', competitive: 'Okay. Game on.',
    theatrical: 'Okay! Okay, okay, okay.', nerdy: 'Okay. Understood.', goofy: 'Okey-doke.', chaotic: 'Okay! Cool! Great!',
    ditzy: 'Okay! …What did I agree to?', proud: 'Okay. If you insist.', emotional: 'Okay. Okay. I\'m okay.' }],
  ['*', 'Right.', {
    earnest: 'Right. I hear you.', warm: "Right. Okay. I've got you.", calm: 'Right.', blunt: 'Right.',
    bossy: 'Right. Listen.', cruel: 'Right. Sure.', tough: 'Right.', competitive: 'Right. Noted.',
    theatrical: 'Right! Well!', nerdy: 'Right. That makes sense.', goofy: 'Right. Righty-ho.', chaotic: 'Right! Okay! Right!',
    ditzy: 'Right… right?', proud: 'Right. As I said.', emotional: 'Right. Okay. Right.' }],
  ['*', 'Obviously.', {
    earnest: 'Obviously. I mean it.', warm: 'Obviously. You silly thing.', calm: 'Obviously.', blunt: 'Obviously.',
    bossy: 'Obviously. Next question.', cruel: 'Obviously. Do you even need to ask?', tough: 'Obviously.', competitive: 'Obviously. No contest.',
    theatrical: 'Obviously! Was there ever a doubt?', nerdy: 'Obviously. It was the only logical answer.', goofy: 'Obviously. Duh-doy.', chaotic: 'Obviously! Wait, what are we talking about?',
    ditzy: 'Obviously! …Wait, really?', proud: 'Obviously. Look at me.', emotional: 'Obviously. Of course I would.' }],
  ['*', 'Come here.', {
    earnest: 'Come here. I mean it.', warm: 'Come here, you. Come on.', calm: 'Come here. It\'s okay.', blunt: 'Come here.',
    bossy: 'Come here. Now.', cruel: 'Come here, then, if you\'re going to sulk.', tough: 'Get here.', competitive: 'Come here. Bet I hug harder.',
    theatrical: 'Come HERE! Into my arms!', nerdy: 'Come here. A hug is scientifically good for you.', goofy: 'Come here. Bear hug incoming.', chaotic: 'Come here, come here, come here!',
    ditzy: 'Come here! No, the other way.', proud: 'Come here. You\'ve earned it.', emotional: 'Come here. I need a hug.' }],
  ['*', 'And?', {
    earnest: 'And? You can tell me.', warm: 'And? What happened? Are you okay?', calm: 'And?', blunt: 'And?',
    bossy: 'And? Finish the story.', cruel: 'And? Is there a point?', tough: 'And?', competitive: 'And? Who came out on top?',
    theatrical: 'And?! Don\'t leave me hanging!', nerdy: 'And? What happened next, exactly?', goofy: 'And? And? And?', chaotic: 'And?! And what?! Go!',
    ditzy: 'And? Sorry, I lost track.', proud: 'And? Did they mention me?', emotional: 'And? Oh, I can\'t bear it.' }],
  ['*', 'Really?', {
    earnest: 'Really? You mean that?', warm: 'Really? Oh, that\'s lovely.', calm: 'Really.', blunt: 'Really?',
    bossy: 'Really? Explain.', cruel: 'Really? That\'s what you\'re going with?', tough: 'For real?', competitive: 'Really? Prove it.',
    theatrical: 'Really?! Stop it!', nerdy: 'Really? That\'s surprising.', goofy: 'Really? Really really?', chaotic: 'Really?! No way! Really?!',
    ditzy: 'Really? Wait, which bit?', proud: 'Really? About me?', emotional: 'Really? Oh my God.' }],
  ['*', 'Thank you.', {
    earnest: 'Thank you. Honestly.', warm: 'Thank you. That means the world.', calm: 'Thank you.', blunt: 'Thanks.',
    bossy: 'Thank you. That was the right call.', cruel: 'Thanks, I suppose.', tough: 'Cheers.', competitive: 'Thank you. I\'ll pay you back double.',
    theatrical: 'Thank you! Truly! From the bottom of my heart!', nerdy: 'Thank you. I appreciate that.', goofy: 'Thank you. I\'d like to thank my {~mum}.', chaotic: 'Thank you! Thanks! Thank you!',
    ditzy: 'Oh! Thank you!', proud: 'Thank you. I know.', emotional: "Thank you. Sorry, I'm getting emotional." }],
  ['*', 'Truth or dare?', {
    earnest: 'Truth or dare? Pick truth. I want to know you.', warm: 'Truth or dare? I\'ll go easy.', calm: 'Truth or dare?', blunt: 'Truth or dare. Pick.',
    bossy: 'Truth or dare. You first.', cruel: 'Truth or dare? Pick truth. I dare you.', tough: 'Truth or dare. Don\'t be a wimp.', competitive: 'Truth or dare? Bet you pick truth.',
    theatrical: 'Truth… or… dare?', nerdy: 'Truth or dare? Truth is more interesting.', goofy: 'Truth or dare? Or a secret third thing?', chaotic: 'Truth or dare! Both! Pick both!',
    ditzy: 'Truth or dare? Wait, how does this one go?', proud: 'Truth or dare? I always pick dare.', emotional: "Truth or dare? I'm nervous already." }],
  ['*', 'Go on, then.', {
    earnest: 'Go on, then. I\'m listening.', warm: "Go on, then. I'm right here.", calm: 'Go on, then.', blunt: 'Go on.',
    bossy: 'Go on, then. Quickly.', cruel: 'Go on, then. Impress me.', tough: 'Go on, then.', competitive: 'Go on, then. Beat that.',
    theatrical: 'Go on, then! The stage is yours!', nerdy: 'Go on, then. I\'m curious.', goofy: 'Go on, then. I\'ll pretend to be surprised.', chaotic: 'Go on, then! Go!',
    ditzy: 'Go on, then! …With what?', proud: 'Go on, then. I\'m all ears.', emotional: 'Go on, then. I\'m ready. I think.' }],
  ['*', 'That was nice.', {
    earnest: 'That was really nice. Thank you.', warm: 'That was lovely. Really lovely.', calm: 'That was nice.', blunt: 'That was good.',
    bossy: 'That was nice. We\'re doing that again.', cruel: 'That was… surprisingly nice.', tough: 'Not bad.', competitive: 'That was nice. Best one yet.',
    theatrical: 'That was divine.', nerdy: 'That was nice. Genuinely.', goofy: 'That was nice. Five stars.', chaotic: 'That was nice! Again! Now!',
    ditzy: 'Oh, that was nice!', proud: 'That was nice. You\'re welcome.', emotional: 'That was so nice. I\'m all fuzzy.' }],
  ['*', 'Why?', {
    earnest: 'Why? I want to understand.', warm: 'Why? What\'s up? Talk to me.', calm: 'Why?', blunt: 'Why?',
    bossy: 'Why? Give me a reason.', cruel: 'Why? What\'s your excuse this time?', tough: 'Why?', competitive: 'Why? What\'s in it for me?',
    theatrical: 'Why?! Why would you say that?', nerdy: 'Why? What\'s the reasoning?', goofy: 'Why? Why is the sky blue? Why anything?', chaotic: 'Why?! Why why why?',
    ditzy: 'Why? Did I miss something?', proud: 'Why? Is it about me?', emotional: 'Why? Oh no, why?' }],
  ['*', 'Of course.', {
    earnest: 'Of course. I mean that.', warm: 'Of course. Any time at all.', calm: 'Of course.', blunt: 'Yes. Obviously.',
    bossy: 'Of course. Leave it to me.', cruel: 'Of course. Who else would?', tough: 'Of course.', competitive: 'Of course. Better than anyone.',
    theatrical: 'Of course! A thousand times, of course!', nerdy: 'Of course. Happy to.', goofy: 'Of course. At your service.', chaotic: 'Of course! Obviously! Yes!',
    ditzy: 'Of course! Wait, what is it?', proud: 'Of course. That\'s just who I am.', emotional: 'Of course. Oh, come here.' }],
  ['*', 'Sorry.', {
    earnest: "I'm sorry. I really am.", warm: "Sorry. Come here, give me a hug.", calm: "Sorry. That wasn't fair.", blunt: 'Sorry.',
    bossy: "Sorry. Now let's move on.", cruel: 'Sorry. Happy now?', tough: 'My bad.', competitive: "Sorry. That one's on me.",
    theatrical: "I'm sorry! I'm so, so sorry!", nerdy: "Sorry. I didn't think that through.", goofy: "Sorry. I'm an idiot.", chaotic: "Sorry! Sorry, sorry, sorry!",
    ditzy: "Sorry! I didn't realise!", proud: "Sorry. It's not like me.", emotional: "I'm sorry. I'm so sorry." }],
  ['*', 'Deal.', {
    earnest: 'Deal. I\'ll stick to it.', warm: "Deal. I'm so glad.", calm: 'Deal.', blunt: 'Deal.',
    bossy: 'Deal. Those are the terms.', cruel: 'Deal. Don\'t mess it up.', tough: 'Deal.', competitive: 'Deal. And I win.',
    theatrical: 'Deal! Let it be written!', nerdy: 'Deal. Agreed on all points.', goofy: 'Deal. Spit-shake? No? Fine.', chaotic: 'Deal! Done! Next!',
    ditzy: 'Deal! What did we agree?', proud: 'Deal. Good choice.', emotional: 'Deal. Oh, I\'m so glad.' }],
  ['*', 'Please.', {
    earnest: 'Please. It matters to me.', warm: 'Please. For me?', calm: 'Please.', blunt: 'Please. Just do it.',
    bossy: 'Please. Now.', cruel: 'Please. I\'m asking nicely, for once.', tough: 'Please.', competitive: 'Please. I\'ll owe you.',
    theatrical: 'Please! I\'m on my knees!', nerdy: 'Please. It would really help.', goofy: 'Please. Puppy eyes.', chaotic: 'Please please please please!',
    ditzy: 'Please? Pretty please?', proud: 'Please. I don\'t say that often.', emotional: 'Please. I need this.' }],
  ['*', "I'm fine.", {
    earnest: "I'm fine. Thank you for asking.", warm: "I'm fine, love. Don't worry about me.", calm: "I'm fine. Honestly.", blunt: "I'm fine.",
    bossy: "I'm fine. Stop fussing.", cruel: "I'm fine. Go and bother someone else.", tough: "I'm fine. Leave it.", competitive: "I'm fine. Better than fine.",
    theatrical: "I'm FINE. Everything is FINE.", nerdy: "I'm fine. Mostly. Seventy per cent.", goofy: "I'm fine. Fit as a fiddle.", chaotic: "I'm fine! Are you fine? We're fine!",
    ditzy: "I'm fine! I think? Yeah.", proud: "I'm fine. I'm always fine.", emotional: "I'm fine. I'm not fine. I'm fine." }],
  ['*', "I'm not going anywhere.", {
    earnest: "I'm not going anywhere. You have my word.", warm: "I'm not going anywhere, love. I'm right here.", calm: "I'm not going anywhere. Breathe.", blunt: "I'm not going anywhere.",
    bossy: "I'm not going anywhere, so stop worrying.", cruel: "I'm not going anywhere. Shame for some.", tough: "I'm not going anywhere.", competitive: "I'm not going anywhere. I'm in this to win it.",
    theatrical: "I'm not going anywhere! They'll have to drag me out!", nerdy: "I'm not going anywhere. Not for the foreseeable.", goofy: "I'm not going anywhere. I've nested.", chaotic: "Me? Leave? Never! Not going anywhere!",
    ditzy: "I'm not going anywhere! Where would I go?", proud: "I'm not going anywhere. Who'd leave all this?", emotional: "I'm not going anywhere. I promise you." }],
  ['*', 'I mean it.', {
    earnest: 'I mean it. Every word.', warm: 'I mean it. You deserve to hear it.', calm: 'I mean it.', blunt: 'I mean it.',
    bossy: 'I mean it. Don\'t argue.', cruel: 'I mean it. Don\'t test me.', tough: 'I mean it.', competitive: 'I mean it. More than anyone in here.',
    theatrical: 'I mean it! From the bottom of my heart!', nerdy: 'I mean it. Literally.', goofy: 'I mean it. Serious face.', chaotic: 'I mean it! I really, really mean it!',
    ditzy: 'I mean it! I think I mean it.', proud: 'I mean it. And I don\'t say that lightly.', emotional: 'I mean it. Look, I\'m shaking.' }],
  ['*', "That's not fair.", {
    earnest: "That's not fair, and I think you know it.", warm: "Hey. That's not fair on either of us.", calm: "That's not fair.", blunt: "That's not fair.",
    bossy: "That's not fair. Take it back.", cruel: "That's not fair. Not that you'd care.", tough: "That's out of order.", competitive: "That's not fair. I want a rematch.",
    theatrical: "That is SO not fair!", nerdy: "That's not fair. Logically, it doesn't hold.", goofy: "Unfair! Foul! Referee!", chaotic: "Not fair! Not fair at all! Unbelievable!",
    ditzy: "That's not fair! …Is it?", proud: "That's not fair. Not to me.", emotional: "That's not fair. That really hurt." }],
  ['*', 'Who?', {
    earnest: 'Who? You can trust me.', warm: 'Who? You can tell me anything.', calm: 'Who?', blunt: 'Who?',
    bossy: 'Who? Name them.', cruel: 'Who? Let me guess.', tough: 'Who?', competitive: 'Who? Bet I can guess.',
    theatrical: 'Who?! Tell me everything!', nerdy: 'Who, specifically?', goofy: 'Who? Was it the butler?', chaotic: 'Who?! Who who who?',
    ditzy: 'Who? Do I know them?', proud: 'Who? Not me, surely.', emotional: 'Who? Oh no.' }],
  ['*', 'What?', {
    earnest: 'What? Tell me.', warm: 'What is it, love?', calm: 'What?', blunt: 'What?',
    bossy: 'What? Out with it.', cruel: 'What now?', tough: 'What?', competitive: 'What? What did I miss?',
    theatrical: 'WHAT?', nerdy: 'Sorry, what?', goofy: 'What? Huh? What?', chaotic: 'What?! What happened?!',
    ditzy: 'What? Sorry, I was miles away.', proud: 'What? About me?', emotional: 'What? What is it?' }],
  ['*', 'Yeah.', {
    earnest: 'Yeah. I do.', warm: 'Yeah. Of course I do.', calm: 'Yeah.', blunt: 'Yeah.',
    bossy: 'Yeah. Obviously.', cruel: 'Yeah. Clearly.', tough: 'Yeah.', competitive: 'Yeah. Easily.',
    theatrical: 'Yes! A thousand times yes!', nerdy: 'Yeah. I\'d say so.', goofy: 'Yeah, yeah, yeah.', chaotic: 'Yeah! Yes! Yeah!',
    ditzy: 'Yeah! Wait. Yeah.', proud: 'Yeah. Naturally.', emotional: 'Yeah. I really do.' }],
  ['*', 'Exactly.', {
    earnest: 'Exactly. That\'s what I mean.', warm: 'Exactly. You get it.', calm: 'Exactly.', blunt: 'Exactly.',
    bossy: 'Exactly. So listen to me.', cruel: 'Exactly. Finally, someone gets it.', tough: 'Exactly.', competitive: 'Exactly. I said it first.',
    theatrical: 'EXACTLY!', nerdy: 'Exactly. That\'s precisely it.', goofy: 'Exactamundo.', chaotic: 'Exactly! Yes! That!',
    ditzy: 'Exactly! Wait, which bit?', proud: 'Exactly. I\'m always right.', emotional: 'Exactly. That\'s exactly how I feel.' }],
  ['*', 'Like what?', {
    earnest: 'Like what? I want to know.', warm: 'Like what? Tell me everything.', calm: 'Like what?', blunt: 'Like what?',
    bossy: 'Like what? Give me an example.', cruel: 'Like what? Go on, surprise me.', tough: 'Like what?', competitive: 'Like what? Bet I\'ve done worse.',
    theatrical: 'Like what?! Spill!', nerdy: 'Like what, specifically?', goofy: 'Like what? Like a llama?', chaotic: 'Like what?! Tell me now!',
    ditzy: 'Like what? Like, what like?', proud: 'Like what? Something about me?', emotional: 'Like what? Is it bad?' }],
  ['*', 'Nothing.', {
    earnest: "Nothing. Honestly.", warm: "Nothing, love. Don't worry.", calm: 'Nothing.', blunt: 'Nothing.',
    bossy: 'Nothing. Drop it.', cruel: 'Nothing you\'d understand.', tough: 'Nothing.', competitive: 'Nothing. Yet.',
    theatrical: 'Nothing! Nothing at all!', nerdy: 'Nothing. Nothing important.', goofy: 'Nothing. Absolutely zilch.', chaotic: 'Nothing! Everything! Nothing!',
    ditzy: 'Nothing! I forgot.', proud: 'Nothing. I\'m above it.', emotional: "Nothing. It's silly. It's nothing." }],
  ['*', 'Promise?', {
    earnest: 'Promise? You really mean it?', warm: "Promise? I'd really like that.", calm: 'Promise?', blunt: 'Promise?',
    bossy: 'Promise. Say it.', cruel: 'Promise? Your promises don\'t count for much.', tough: 'Swear?', competitive: 'Promise? I\'m holding you to it.',
    theatrical: 'Promise? Swear on everything?', nerdy: 'Promise? That\'s a commitment.', goofy: 'Promise? Spit on it.', chaotic: 'Promise?! Swear?!',
    ditzy: 'Promise? Which promise?', proud: 'Promise? Good.', emotional: 'Promise? Please.' }],
  ['*', 'Promise.', {
    earnest: 'I promise. Truly.', warm: 'I promise. Cross my heart.', calm: 'I promise.', blunt: 'Promise.',
    bossy: 'Promise. Now stop asking.', cruel: 'Promise. Happy now?', tough: 'On my life.', competitive: 'Promise. And I never lose a promise.',
    theatrical: 'I swear on everything!', nerdy: 'Promise. Binding.', goofy: 'Promise. Cross my heart and hope to fly.', chaotic: 'Promise! Swear! Pinky!',
    ditzy: 'Promise! What am I promising?', proud: 'Promise. My word means something.', emotional: 'I promise. I really, really promise.' }],
  ['*', 'Are you okay?', {
    earnest: 'Are you okay? Honestly?', warm: 'Are you okay, love? Come here.', calm: 'Are you okay? Take a breath.', blunt: 'You okay?',
    bossy: 'Are you okay? Sit down.', cruel: 'Are you okay? You look awful.', tough: 'You good?', competitive: "Are you okay? You can't give up now.",
    theatrical: 'Are you okay? You look like you\'ve seen a ghost!', nerdy: 'Are you okay? You seem off.', goofy: 'Are you okay? You look like a sad potato.', chaotic: 'Are you okay?! What happened?!',
    ditzy: 'Are you okay? Did something happen?', proud: 'Are you okay? I can help.', emotional: 'Are you okay? Oh, come here.' }],
  ['*', 'Can I grab you for a chat?', {
    earnest: 'Can I grab you for a chat? It\'s important.', warm: "Can I grab you for a chat? I've missed you today.", calm: 'Can I grab you for a chat?', blunt: 'Chat. Now.',
    bossy: 'Chat. You and me. Now.', cruel: 'Can I grab you? We need to talk.', tough: 'A word.', competitive: 'Can I grab you before anyone else does?',
    theatrical: 'Darling! A word, please!', nerdy: 'Can I grab you? I\'ve been thinking about something.', goofy: 'Can I borrow you? I\'ll return you in mint condition.', chaotic: 'You! Chat! Now! Come on!',
    ditzy: 'Can I grab you? I forgot what for, but it\'ll come back.', proud: 'Can I grab you? You\'ll want to hear this.', emotional: 'Can I grab you? I need to talk to someone.' }],
  ['*', 'What did I do?', {
    earnest: 'What did I do? Tell me, so I can fix it.', warm: "What did I do? Whatever it was, I'm sorry.", calm: 'What did I do?', blunt: 'What did I do?',
    bossy: 'What did I do? Spell it out.', cruel: 'What did I do now?', tough: 'What did I do?', competitive: 'What did I do? I didn\'t do anything.',
    theatrical: 'What did I do?! Tell me!', nerdy: 'What did I do, specifically?', goofy: 'What did I do? I\'m innocent. Probably.', chaotic: 'What did I do?! What happened?!',
    ditzy: 'What did I do? I genuinely don\'t know.', proud: 'What did I do? I never do anything wrong.', emotional: 'What did I do? I feel awful.' }],
  ['*', 'Goodnight.', {
    earnest: 'Goodnight. Thank you for today.', warm: 'Night night, love.', calm: 'Goodnight.', blunt: 'Night.',
    bossy: 'Goodnight. Bed. Now.', cruel: 'Night. Try not to snore.', tough: 'Night.', competitive: 'Goodnight. First one up wins.',
    theatrical: 'Goodnight, goodnight! Parting is such sweet sorrow.', nerdy: 'Goodnight. Eight hours, minimum.', goofy: 'Nighty night.', chaotic: 'Night! Wait. Night!',
    ditzy: 'Night! Wait, is it night?', proud: 'Goodnight. Dream of me.', emotional: 'Goodnight. Today was a lot.' }],
];
