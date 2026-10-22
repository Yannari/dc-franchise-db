// pm/lines/voices/batch1.js — see index.js. [entry id, exact line, { voice: line }]
//
// Batch 1: the short replies a season says most (measured over six seasons, two
// casts: the top of the aired list is "Go on." 249 times, "I know." 232, "Me
// too." 202 …). Keyed '*' because each is the same reply in every scene it is
// in. The families carry most speakers (soft · loud · dry · sharp · odd, in
// that order of airtime); a tag of its own only where that kind of person
// really says it differently. Flirty only where the line is to a love interest.
export const BATCH1 = [
  ['*', 'Go on.', {
    sharp: 'Spit it out.', dry: 'Go on, then.', loud: 'Go on! Out with it.', soft: "Go on. I'm listening.",
    odd: 'Ooh. Go on, go on.', anxious: 'Go on… what is it?', quiet: 'Mm. Go on.', schemer: "Go on. I'm all ears." }],
  ['*', 'I know.', {
    sharp: 'I know. You don\'t need to tell me.', dry: 'Yeah. I know.', loud: 'I know! I know.', soft: 'I know. I really do.',
    odd: 'I know. I know everything.', anxious: 'I know. That\'s the problem.', quiet: 'Mm. I know.' }],
  ['*', 'Me too.', {
    sharp: 'Same.', dry: 'Same here.', loud: 'Me too! Obviously.', soft: 'Me too. Honestly.',
    odd: 'Me too! Twins.', anxious: 'Me too. I didn\'t want to say it first.', quiet: 'Same.' }],
  ['*', 'Good.', {
    sharp: 'Good. Keep it that way.', dry: 'Good.', loud: 'Good! Right answer.', soft: "Good. I'm glad.",
    odd: 'Good. Correct answer. Gold star.', anxious: 'Oh, thank God. Good.' }],
  ['*', 'Always.', {
    sharp: 'Always. Obviously.', dry: 'Always.', loud: 'Always! Don\'t even ask.', soft: 'Always. You know that.',
    odd: 'Always. Forever. Even after.', anxious: 'Always. I promise.' }],
  ['*', 'No.', {
    sharp: 'No. And don\'t ask again.', dry: 'No.', loud: 'No! No chance.', soft: 'No. Sorry.',
    odd: 'Nope. Big no.', anxious: 'No… no, I don\'t think so.', schemer: 'No. Not yet, anyway.' }],
  ['*', 'Are we okay?', {
    sharp: 'Are we good, or not?', dry: 'So. Are we okay?', loud: 'Be honest with me. Are we okay or what?', soft: 'Are we okay? I hate this.',
    odd: 'Scale of one to ten, how okay are we?', anxious: 'Are we… are we okay? Please say yes.', flirty: 'Are we okay? Because I really want us to be.' }],
  ['*', 'Okay.', {
    sharp: 'Fine.', dry: 'Okay.', loud: 'Okay! Fine!', soft: 'Okay. Thank you.',
    odd: 'Okay. Noted. Filed away.', anxious: 'Okay… okay.', quiet: 'Mm. Okay.' }],
  ['*', 'Right.', {
    sharp: 'Right. Got it.', dry: 'Right.', loud: 'Right! Okay!', soft: 'Right. Okay.',
    odd: 'Riiight.', anxious: 'Right… right.' }],
  ['*', 'Obviously.', {
    sharp: 'Obviously. Keep up.', dry: 'Well, obviously.', loud: 'Obviously! Come on!', soft: 'Of course. Obviously.',
    odd: 'Obviously. Duh.', anxious: 'Obviously… I think?' }],
  ['*', 'Come here.', {
    sharp: 'Come here. Now.', dry: 'Come here, you.', loud: 'Get over here!', soft: 'Come here. Give me a cuddle.',
    odd: 'Come here. Group hug, but just us.', flirty: 'Come here. Closer than that.', anxious: 'Come here? If you want.' }],
  ['*', 'And?', {
    sharp: 'And? Finish it.', dry: 'And?', loud: 'And?! Don\'t stop there!', soft: 'And? What happened?',
    odd: 'And?! The suspense!', anxious: 'And… what? Is it bad?', schemer: 'And? Then what?' }],
  ['*', 'Really?', {
    sharp: 'Really. You expect me to believe that?', dry: 'Really.', loud: 'Really?! No way!', soft: 'Really? Honestly?',
    odd: 'Really really?', anxious: 'Wait, really?' }],
  ['*', 'Thank you.', {
    sharp: 'Thanks.', dry: 'Thanks. I mean it.', loud: 'Thank you! Seriously!', soft: 'Thank you. That means a lot.',
    odd: 'Thank you. I accept this award.', anxious: 'Thank you. Sorry. Thank you.' }],
  ['*', 'Truth or dare?', {
    sharp: 'Truth or dare. Choose carefully.', dry: 'Truth or dare. Pick one.', loud: 'Truth or dare! Come on, pick!', soft: 'Truth or dare? Go easy on me.',
    odd: 'Truth or dare? Pick dare. Pick dare.', flirty: 'Truth or dare? I know which one I want you to pick.' }],
  ['*', 'Go on, then.', {
    sharp: 'Go on, then. I\'m waiting.', dry: 'Go on, then.', loud: 'Go on, then! Let\'s hear it!', soft: 'Go on, then. Tell me.',
    odd: 'Go on, then. Dazzle me.', anxious: 'Go on, then… if you have to.' }],
  ['*', 'That was nice.', {
    sharp: 'That was all right.', dry: 'That was nice. Very nice.', loud: 'That was so good!', soft: 'That was really nice.',
    odd: 'That was nice. Ten out of ten. Would do again.', flirty: 'That was nice. Let\'s do it again.', anxious: 'That was nice… wasn\'t it?' }],
  ['*', 'Why?', {
    sharp: 'Why? Explain.', dry: 'Why?', loud: 'Why?! What for?', soft: 'Why? What\'s wrong?',
    odd: 'Why? Why why why?', anxious: 'Why? What did I do?', schemer: 'Why do you ask?' }],
  ['*', 'Just tired.', {
    sharp: 'Tired. Leave it.', dry: 'Tired. That\'s all.', loud: 'I\'m just tired, all right?', soft: 'Just tired, honestly. I\'m okay.',
    odd: 'Tired. My brain went to bed without me.', quiet: 'Tired.' }],
  ['*', 'Of course.', {
    sharp: 'Of course. Why wouldn\'t I?', dry: 'Of course.', loud: 'Of course! Don\'t even ask!', soft: 'Of course. Any time.',
    odd: 'Of course! Easiest yes of my life.', anxious: 'Of course… yeah, of course.' }],
  ['*', 'Sorry.', {
    sharp: 'Fine. Sorry.', dry: 'Sorry.', loud: 'Sorry! I\'m sorry, okay?', soft: 'I\'m sorry. I really am.',
    odd: 'Sorry. Very, very sorry.', anxious: 'Sorry. Sorry. I\'m so sorry.' }],
  ['*', 'And now?', {
    sharp: 'And now? Be honest.', dry: 'And now?', loud: 'And now?! Come on!', soft: 'And now? How do you feel now?',
    odd: 'And now? Update me.', anxious: 'And now? Has it changed?' }],
  ['*', 'Deal.', {
    sharp: 'Deal. Don\'t back out.', dry: 'Deal.', loud: 'Deal! Shake on it!', soft: 'Deal. Promise.',
    odd: 'Deal. Pinky swear.', schemer: 'Deal. Pleasure doing business.' }],
  ['*', 'Truce?', {
    sharp: 'Truce? For now.', dry: 'Truce?', loud: 'Truce? Come on, truce!', soft: 'Truce? Please?',
    odd: 'Truce? I come in peace.', anxious: 'Truce? Can we?' }],
  ['*', 'Truce.', {
    sharp: 'Truce. For now.', dry: 'Truce.', loud: 'Truce! Fine!', soft: 'Truce. I hate fighting.',
    odd: 'Truce. Peace in our time.' }],
  ['*', 'Please.', {
    sharp: 'Please. Just do it.', dry: 'Please.', loud: 'Please! I\'m begging.', soft: 'Please. For me.',
    odd: 'Please. Pretty please.', anxious: 'Please… please.' }],
  ['*', "I'm not.", {
    sharp: "I'm not. Drop it.", dry: "I'm not.", loud: "I'm not! I swear!", soft: "I'm not. Honestly.",
    odd: "I'm not. Not even a bit.", anxious: "I'm not… am I?" }],
  ['*', 'Where?', {
    sharp: 'Where? Show me.', dry: 'Where?', loud: 'Where?! Where are they?', soft: 'Where? Are you sure?',
    odd: 'Where? Point.', anxious: 'Where? Oh God, where?' }],
  ['*', "Don't be.", {
    sharp: "Don't be. It's fine.", dry: "Don't be.", loud: "Don't be! Seriously!", soft: "Don't be. It's okay.",
    odd: "Don't be. No sorries allowed.", anxious: "Don't be. Please don't be." }],
  ['*', 'About what?', {
    sharp: 'About what, exactly?', dry: 'About what?', loud: 'About what?! Tell me!', soft: 'About what? You can tell me.',
    odd: 'About what? I love a secret.', anxious: 'About what? Is it about me?', schemer: 'About what? Go on.' }],
  ['*', "You don't know that.", {
    sharp: "You don't know that. Nobody does.", dry: "You don't know that.", loud: "You don't know that! Nobody knows that!", soft: "You don't know that. It could still be fine.",
    odd: "You don't know that. You can't see the future.", anxious: "You don't know that… do you?" }],
  ['*', "I'm fine.", {
    sharp: "I'm fine. Stop asking.", dry: "I'm fine.", loud: "I'm fine! Honestly!", soft: "I'm fine. Thank you for asking.",
    odd: "I'm fine. Totally, extremely fine.", anxious: "I'm fine. I'm fine. I'm… fine.", quiet: 'Fine.' }],
  ["*", "I'm not going anywhere.", {
    sharp: "I'm not going anywhere. Get used to it.", dry: "I'm not going anywhere.", loud: "I'm not going anywhere! You're stuck with me!", soft: "I'm not going anywhere. I promise.",
    odd: "I'm not going anywhere. I've unpacked.", anxious: "I'm not going anywhere. Unless you want me to?", flirty: "I'm not going anywhere. Not without you." }],
  ['*', 'Do what?', {
    sharp: 'Do what, exactly?', dry: 'Do what?', loud: 'Do what?!', soft: 'Do what? What do you mean?',
    odd: 'Do what? I\'ll do anything once.', anxious: 'Do what? What did I do?' }],
  ['*', "That's not what I said.", {
    sharp: "That's not what I said, and you know it.", dry: "That's not what I said.", loud: "That is NOT what I said!", soft: "That's not what I said. I didn't mean it like that.",
    odd: "That's not what I said. That's not even close.", anxious: "That's not what I said… is it?" }],
  ['*', 'In a minute.', {
    sharp: 'In a minute. Don\'t rush me.', dry: 'In a minute.', loud: 'In a minute! Hold on!', soft: 'In a minute, I promise.',
    odd: 'In a minute. Or five.' }],
  ['*', 'I mean it.', {
    sharp: 'I mean it. Every word.', dry: 'I mean it.', loud: 'I mean it! I really do!', soft: 'I mean it. Honestly.',
    odd: 'I mean it. Cross my heart.', anxious: 'I mean it. I really, really do.', flirty: 'I mean it. Every single word.' }],
  ['*', "That's not fair.", {
    sharp: "That's not fair, and you know it.", dry: "That's not fair.", loud: "That's not fair! That's not fair at all!", soft: "That's not fair. That really hurts.",
    odd: "That's not fair. I want a recount.", anxious: "That's not fair… is it?" }],
  ['*', 'When?', {
    sharp: 'When? Exactly when?', dry: 'When?', loud: 'When?! Tell me!', soft: 'When? When was this?',
    odd: 'When? Give me a date and time.', anxious: 'When? Was it today?' }],
  ['*', 'What?', {
    sharp: 'What?', dry: 'What?', loud: 'What?! Say that again.', soft: 'What? What is it?',
    odd: 'What? What what?', anxious: 'What? What\'s wrong?' }],
  ['*', 'Let them.', {
    sharp: 'Let them. I don\'t care.', dry: 'Let them.', loud: 'Let them! Let them talk!', soft: 'Let them. It doesn\'t matter.',
    odd: 'Let them. They\'re just jealous.', schemer: 'Let them. It helps us.' }],
  ['*', 'Who?', {
    sharp: 'Who? Name.', dry: 'Who?', loud: 'Who?! Who was it?', soft: 'Who? You can tell me.',
    odd: 'Who? I need names.', anxious: 'Who? Oh no. Who?' }],
  ['*', 'Goodnight.', {
    sharp: 'Night.', dry: 'Night, then.', loud: 'Night! Sleep well!', soft: 'Goodnight. Sleep well.',
    odd: 'Goodnight. Don\'t let the bed bugs bite.', flirty: 'Goodnight. I\'ll be thinking about you.' }],
  ['*', 'Already?', {
    sharp: 'Already? Fine.', dry: 'Already?', loud: 'Already?! No way!', soft: 'Already? That went so quickly.',
    odd: 'Already? Who sped up the clock?', anxious: 'Already? I\'m not ready.' }],
  ['*', 'Yeah.', {
    sharp: 'Yeah.', dry: 'Yeah.', loud: 'Yeah! Of course!', soft: 'Yeah. I think so.',
    odd: 'Yeah. Yep. Yes.', anxious: 'Yeah… I think so.' }],
  ['*', 'Never.', {
    sharp: 'Never. Not in a million years.', dry: 'Never.', loud: 'Never! Never ever!', soft: 'Never. I wouldn\'t.',
    odd: 'Never. Not even for money.', anxious: 'Never. I swear I wouldn\'t.' }],
  ['*', 'Exactly.', {
    sharp: 'Exactly. Finally.', dry: 'Exactly.', loud: 'Exactly! That\'s what I said!', soft: 'Exactly. You get it.',
    odd: 'Exactly! Brain twins.', schemer: 'Exactly. Now you see it.' }],
  ['*', 'Like what?', {
    sharp: 'Like what? Be specific.', dry: 'Like what?', loud: 'Like what?! Go on!', soft: 'Like what? Tell me.',
    odd: 'Like what? I want details.', anxious: 'Like what? Something bad?', schemer: 'Like what, exactly?' }],
  ['*', "That's fair.", {
    sharp: "Fair enough.", dry: "That's fair.", loud: "That's fair! I'll give you that.", soft: "That's fair. I get it.",
    odd: "That's fair. Point to you." }],
  ['*', "Please don't.", {
    sharp: "Don't.", dry: "Please don't.", loud: "Don't! Please don't!", soft: "Please don't. I couldn't bear it.",
    odd: "Please don't. I'm begging you.", anxious: "Please don't. Please." }],
  ['*', "I'll take it.", {
    sharp: "I'll take it.", dry: "I'll take it.", loud: "I'll take it! Done!", soft: "I'll take it. Thank you.",
    odd: "I'll take it. No refunds.", schemer: "I'll take it. For now." }],
  ['*', 'You were.', {
    sharp: 'You were. Don\'t deny it.', dry: 'You were.', loud: 'You were! I saw you!', soft: 'You were. It\'s okay.',
    odd: 'You were. Totally were.' }],
  ['*', "I wasn't.", {
    sharp: "I wasn't. Drop it.", dry: "I wasn't.", loud: "I wasn't! I swear!", soft: "I wasn't. Honestly, I wasn't.",
    odd: "I wasn't. Not even slightly.", anxious: "I wasn't… was I?" }],
  ['*', 'What did I do?', {
    sharp: 'What did I do, then?', dry: 'What did I do?', loud: 'What did I do?! Tell me!', soft: 'What did I do? I want to fix it.',
    odd: 'What did I do? I genuinely have no idea.', anxious: 'What did I do? Oh no. What did I do?' }],
  ['*', 'Nothing.', {
    sharp: 'Nothing. Leave it.', dry: 'Nothing.', loud: 'Nothing! It\'s nothing!', soft: 'Nothing. Honestly, it\'s nothing.',
    odd: 'Nothing. Absolutely nothing. Nothing at all.', anxious: 'Nothing… it\'s nothing.', quiet: 'Nothing.' }],
  ['*', "You'd better.", {
    sharp: "You'd better.", dry: "You'd better.", loud: "You'd better! I mean it!", soft: "You'd better. I'll hold you to it.",
    odd: "You'd better. I've written it down." }],
  ['*', 'I hate fighting with you.', {
    sharp: "I don't like this. Fighting with you.", dry: 'I hate fighting with you.', loud: 'I hate this! I hate fighting with you!', soft: 'I hate fighting with you. I really do.',
    odd: 'I hate fighting with you. You\'re my favourite person to not fight with.', anxious: 'I hate fighting with you. It makes me feel sick.' }],
  ['*', 'Do you want a drink?', {
    sharp: 'Drink?', dry: 'Do you want a drink?', loud: 'Drinks! Who wants a drink? You do.', soft: 'Do you want a drink? I\'ll get you one.',
    odd: 'Can I interest you in a drink?', flirty: 'Can I get you a drink?' }],
  ['*', "That's what I said.", {
    sharp: "That's what I said. Keep up.", dry: "That's what I said.", loud: "That's what I said!", soft: "That's what I said, I promise.",
    odd: "That's what I said! Word for word." }],
  ['*', 'It really is.', {
    sharp: 'It is.', dry: 'It really is.', loud: 'It really is! Honestly!', soft: 'It really is. I love it.',
    odd: 'It really, really is.' }],
  ['*', "We're fine.", {
    sharp: "We're fine. Don't worry about us.", dry: "We're fine.", loud: "We're fine! Honestly!", soft: "We're fine. We're good.",
    odd: "We're fine. Better than fine.", anxious: "We're fine… I think we're fine." }],
  ['*', 'You know what I mean.', {
    sharp: 'You know exactly what I mean.', dry: 'You know what I mean.', loud: 'You know what I mean!', soft: 'You know what I mean, don\'t you?',
    odd: 'You know what I mean. You get it.' }],
  ['*', 'Give it a week.', {
    sharp: 'Give it a week. You\'ll see.', dry: 'Give it a week.', loud: 'Give it a week! Watch!', soft: 'Give it a week. It\'ll be better.',
    odd: 'Give it a week. I\'m always right about this.' }],
  ['*', "It's freezing.", {
    sharp: "It's freezing. Who opened that?", dry: "It's freezing.", loud: "It's FREEZING!", soft: "It's freezing. Come here and keep me warm.",
    odd: "It's freezing. I can't feel my toes." }],
  ['*', 'Our secret.', {
    sharp: 'Our secret. Nobody else.', dry: 'Our secret.', loud: 'Our secret! Shh!', soft: 'Our secret. Just us.',
    odd: 'Our secret. Take it to the grave.', schemer: 'Our secret. Nobody needs to know.' }],
  ['*', 'Are you okay?', {
    sharp: 'You okay?', dry: 'Are you okay?', loud: 'Hey! Are you okay?', soft: 'Are you okay? Talk to me.',
    odd: 'Are you okay? You look like you need a snack.', anxious: 'Are you okay? You\'re worrying me.' }],
  ['*', "I'm not saying.", {
    sharp: "I'm not saying. Work it out.", dry: "I'm not saying.", loud: "I'm not saying! No way!", soft: "I'm not saying. Not yet.",
    odd: "I'm not saying. My lips are sealed.", schemer: "I'm not saying. Not here." }],
  ['*', 'What are you thinking about?', {
    sharp: 'What are you thinking about? You\'re miles away.', dry: 'What are you thinking about?', loud: 'Oi. What are you thinking about?', soft: 'What are you thinking about? You can tell me.',
    odd: 'What are you thinking about? Penny for them.', flirty: 'What are you thinking about? Is it me?' }],
  ['*', 'Promise?', {
    sharp: 'Promise? Properly?', dry: 'Promise?', loud: 'Promise?! You swear?', soft: 'Promise? You mean it?',
    odd: 'Promise? Pinky promise?', anxious: 'Promise? You won\'t change your mind?' }],
  ['*', 'Promise.', {
    sharp: 'Promise.', dry: 'Promise.', loud: 'Promise! I swear!', soft: 'I promise. Really.',
    odd: 'Pinky promise.', anxious: 'I promise. I really do.' }],
  ['*', 'I will.', {
    sharp: 'I will.', dry: 'I will.', loud: 'I will! Watch me!', soft: 'I will. I promise.',
    odd: 'I will. Mark my words.' }],
  ['*', 'Good answer.', {
    sharp: 'Right answer.', dry: 'Good answer.', loud: 'Good answer! Love that!', soft: 'Good answer. I like that.',
    odd: 'Good answer. Ten points.', flirty: 'Good answer. Very good answer.' }],
  ['*', 'Is that a yes?', {
    sharp: 'Is that a yes or not?', dry: 'Is that a yes?', loud: 'Is that a yes?! Say yes!', soft: 'Is that a yes? Please say it\'s a yes.',
    odd: 'Is that a yes? I\'m hearing a yes.', anxious: 'Is that… is that a yes?' }],
  ['*', 'Is that a compliment?', {
    sharp: 'Is that meant to be a compliment?', dry: 'Is that a compliment?', loud: 'Is that a compliment?!', soft: 'Is that a compliment? I\'ll take it.',
    odd: 'Is that a compliment? I\'m keeping it either way.' }],
  ['*', 'For what?', {
    sharp: 'For what, exactly?', dry: 'For what?', loud: 'For what?!', soft: 'For what? You don\'t need to.',
    odd: 'For what? What did I win?' }],
  ['*', 'Are you?', {
    sharp: 'Are you, though?', dry: 'Are you?', loud: 'Are you?! Really?', soft: 'Are you? Honestly?',
    odd: 'Are you? Are you really?', anxious: 'Are you? You\'re sure?' }],
  ['*', 'What was that for?', {
    sharp: 'What was that for?', dry: 'What was that for?', loud: 'Whoa! What was that for?', soft: 'What was that for? Not that I\'m complaining.',
    odd: 'What was that for? Do it again and I\'ll tell you.', flirty: 'What was that for? Not that I minded.' }],
  ['*', 'Later.', {
    sharp: 'Later. Not now.', dry: 'Later.', loud: 'Later! I promise!', soft: 'Later. I promise.',
    odd: 'Later. Put it in the diary.' }],
  ['*', "That's the plan.", {
    sharp: "That's the plan.", dry: "That's the plan.", loud: "That's the plan! Watch this!", soft: "That's the plan. Hopefully.",
    odd: "That's the plan. It's a very good plan.", schemer: "That's the plan. Keep it to yourself." }],
  ['*', "That's not the point.", {
    sharp: "That's not the point, and you know it.", dry: "That's not the point.", loud: "That's not the point!", soft: "That's not the point. It's how it made me feel.",
    odd: "That's not the point. The point is over there." }],
  ['*', "I don't want to jinx it.", {
    sharp: "I'm not saying anything. Not yet.", dry: "I don't want to jinx it.", loud: "Don't say it! You'll jinx it!", soft: "I don't want to jinx it. It's too nice.",
    odd: "Shh. I don't want to jinx it. Touch wood.", anxious: "I don't want to jinx it. Things always go wrong when I say it." }],
  ['*', 'Can I grab you for a chat?', {
    sharp: 'You. Chat. Now.', dry: 'Can I grab you for a chat?', loud: 'Oi! Can I grab you for a chat?', soft: 'Can I grab you for a chat? Only if you want.',
    odd: 'Can I borrow you? For a chat. I\'ll bring you back.', anxious: 'Can I… grab you for a chat? If that\'s okay?', flirty: 'Can I steal you for a bit?' }],
  ['*', 'Can I steal you?', {
    sharp: 'You. With me.', dry: 'Can I steal you?', loud: 'I\'m stealing you! Come on!', soft: 'Can I steal you for a minute?',
    odd: 'Can I steal you? I\'ll bring you back. Probably.', anxious: 'Can I steal you? Only if that\'s okay.', flirty: 'Can I steal you? I\'ve been waiting all day.' }],
  ['*', 'Thanks for listening.', {
    sharp: 'Thanks. For listening.', dry: 'Thanks for listening.', loud: 'Thanks for listening to me go on!', soft: 'Thanks for listening. It really helps.',
    odd: 'Thanks for listening. I owe you a biscuit.', anxious: 'Thanks for listening. Sorry I went on so long.' }],
  ['*', "That's what I'm here for.", {
    sharp: "That's what I'm here for.", dry: "That's what I'm here for.", loud: "That's what I'm here for! Any time!", soft: "That's what I'm here for. Always.",
    odd: "That's what I'm here for. Part-time listener, full-time friend." }],
  ['*', 'Same time tomorrow?', {
    sharp: 'Same time tomorrow. Don\'t be late.', dry: 'Same time tomorrow?', loud: 'Same time tomorrow? Yes? Yes!', soft: 'Same time tomorrow? I\'d like that.',
    odd: 'Same time tomorrow? I\'ll book us in.' }],
  ['*', 'Both.', {
    sharp: 'Both. Obviously.', dry: 'Both.', loud: 'Both! Why choose?', soft: 'Both, honestly.',
    odd: 'Both. Greedy, I know.' }],
  ['*', 'Zip me up?', {
    sharp: 'Zip me up. Quick.', dry: 'Zip me up?', loud: 'Zip me up! We\'re late!', soft: 'Can you zip me up?',
    odd: 'Zip me up? I can\'t reach. My arms are too short.', flirty: 'Zip me up? Gently.' }],
  ['*', 'It was.', {
    sharp: 'It was.', dry: 'It was.', loud: 'It was! It really was!', soft: 'It was. It really was.',
    odd: 'It was. It so was.' }],
  ['*', "I'm sorry about earlier.", {
    sharp: "About earlier. I was out of line.", dry: "I'm sorry about earlier.", loud: "I'm sorry about earlier! I lost it.", soft: "I'm sorry about earlier. I've been thinking about it all day.",
    odd: "About earlier. Can we pretend that was someone else?", anxious: "I'm sorry about earlier. I couldn't stop thinking about it." }],
  ['*', 'Not a chance.', {
    sharp: 'Not a chance.', dry: 'Not a chance.', loud: 'Not a chance! No way!', soft: 'Not a chance, sorry.',
    odd: 'Not a chance. Not in this lifetime.' }],
  ['*', "Don't push it.", {
    sharp: "Don't push it.", dry: "Don't push it.", loud: "Don't push it! I mean it!", soft: "Don't push it. Please.",
    odd: "Don't push it. You're on thin ice." }],
  ['*', 'You look amazing tonight.', {
    sharp: 'You look good tonight. Really good.', dry: 'You look amazing tonight. Just saying.', loud: 'Look at you! You look amazing tonight!', soft: 'You look amazing tonight. Honestly.',
    odd: 'You look amazing tonight. I nearly walked into the door.', anxious: 'You look… you look amazing tonight.', flirty: 'You look amazing tonight. I can\'t stop looking.' }],
  ['*', 'I think we\'d be good together.', {
    sharp: 'We\'d be good together. You know it.', dry: 'I think we\'d be good together.', loud: 'We\'d be so good together! Come on!', soft: 'I think we\'d be really good together.',
    odd: 'I think we\'d be good together. Call it a hunch.', anxious: 'I think… I think we\'d be good together. Is that mad?', flirty: 'I think we\'d be good together. Really good.' }],
  ['*', 'Why wouldn\'t we be?', {
    sharp: 'Why wouldn\'t we be?', dry: 'Why wouldn\'t we be?', loud: 'Why wouldn\'t we be?!', soft: 'Why wouldn\'t we be? We\'re okay.',
    odd: 'Why wouldn\'t we be? We\'re great.', anxious: 'Why wouldn\'t we be? Should we not be?' }],
  ['*', "That's not how it works.", {
    sharp: "That's not how it works.", dry: "That's not how it works.", loud: "That's not how it works!", soft: "That's not how it works, sadly.",
    odd: "That's not how any of this works." }],
  ['*', "That'll do.", {
    sharp: "That'll do.", dry: "That'll do.", loud: "That'll do! Perfect!", soft: "That'll do. That's lovely.",
    odd: "That'll do nicely." }],
  ['*', 'Thanks for understanding.', {
    sharp: 'Thanks. For getting it.', dry: 'Thanks for understanding.', loud: 'Thanks for understanding! Seriously!', soft: 'Thanks for understanding. It means a lot.',
    odd: 'Thanks for understanding. You\'re a saint.', anxious: 'Thanks for understanding. I was so worried.' }],
  ['*', "I know you have.", {
    sharp: "I know you have.", dry: "I know you have.", loud: "I know you have! I can tell!", soft: "I know you have. I can see it.",
    odd: "I know you have. It's written all over you." }],
  ['*', 'Hug?', {
    sharp: 'Hug. Come on.', dry: 'Hug?', loud: 'Hug! Get in!', soft: 'Hug? I need one.',
    odd: 'Hug? Bring it in.', anxious: 'Hug? If that\'s okay?' }],
  ['*', 'Rate today out of ten.', {
    sharp: 'Today. Out of ten. Go.', dry: 'Rate today out of ten.', loud: 'Out of ten! Today! Go!', soft: 'Rate today out of ten. Be honest.',
    odd: 'Scores, please. Today, out of ten.' }],
  ['*', "I'm just tired.", {
    sharp: "I'm tired. That's all.", dry: "I'm just tired.", loud: "I'm just tired! That's all!", soft: "I'm just tired. I'm okay, honestly.",
    odd: "I'm just tired. Running on fumes.", quiet: 'Just tired.' }],
  ['*', 'What did you think?', {
    sharp: 'Well? What did you think?', dry: 'What did you think?', loud: 'Go on, what did you think?', soft: 'What did you think? Honestly?',
    odd: 'What did you think? Out of ten.', anxious: 'What did you think? Was it okay?' }],
  ['*', 'You said that ten minutes ago.', {
    sharp: 'You said that ten minutes ago.', dry: 'You said that ten minutes ago.', loud: 'You said that ten minutes ago!', soft: 'You said that ten minutes ago, to be fair.',
    odd: 'You said that ten minutes ago. I timed it.' }],
  ['*', 'Do you trust me?', {
    sharp: 'Do you trust me? Yes or no.', dry: 'Do you trust me?', loud: 'Do you trust me? Be honest!', soft: 'Do you trust me? Really?',
    odd: 'Do you trust me? Don\'t answer that.', anxious: 'Do you trust me? Please say yes.', schemer: 'You trust me, don\'t you?' }],
];
