// js/social/packs/perfect-match-voices.js
// The alumni hosts, watching the villa.
//
// Twelve DELIVERIES, the same twelve js/social/voices.js derives from a host's
// canonical profile, each given the six moments this show is watched for. A
// column read down has to sound like one person; the same people on the other
// shows live in their packs, and the voices must not bleed.
//
// `s` is the subject's display name. `finale` has no single subject and never
// names one: a couple wins.
//
// THE PUBLIC DECIDES. Nobody is voted out by a room here; islanders are dumped
// from the island, left single, stolen from, or the public's favourites.

export const HOST_TAKES = {
  // Short. Stops talking. The joke is that there is no joke.
  deadpan: {
    bombshell: [
      ({ s }) => `${s} walked in. Four couples remembered they had doubts.`,
      () => `New arrival. Same villa. Fewer certainties.`,
      ({ s }) => `${s} has been there an hour and already has a date. Efficient.`,
      () => `Everybody said they were closed off. Everybody turned round.`,
      () => `A text arrived and the whole garden stood up. Normal Tuesday.`,
    ],
    steal: [
      ({ s }) => `${s} took somebody's partner at the fire pit. The fire pit took it well.`,
      () => `A steal. Somebody is now single. That is the whole plot.`,
      ({ s }) => `${s} stood up. Somebody else sat down. Very quickly.`,
      () => `It was a recoupling. Things got recoupled.`,
      () => `Nobody saw it coming, except the person who did it.`,
    ],
    'casa-twist': [
      ({ s }) => `${s} came back with somebody new. The old somebody noticed.`,
      () => `Four days at Casa. Six weeks undone. Good ratio.`,
      ({ s }) => `${s} twisted. The villa did not.`,
      () => `The door opened and the explanation did not come through it.`,
      () => `Casa Amor worked as intended. Unfortunately.`,
    ],
    'bottom-couples': [
      ({ s }) => `${s} is in the bottom. The public have spoken, briefly.`,
      () => `Bottom couples. The phone lines were busy elsewhere.`,
      ({ s }) => `${s} found out what the country thinks. The country was not gentle.`,
      () => `Two couples, one bad night, no appeal.`,
      () => `Nobody likes the bottom. The bottom is still there.`,
    ],
    dumped: [
      ({ s }) => `${s} has been dumped from the island. The suitcase was already packed.`,
      () => `One night single. That is the rule. Nobody said it was kind.`,
      ({ s }) => `${s} was here. Now ${s} is on a plane.`,
      () => `The goodbye took longer than the decision.`,
      () => `Sad. Expected. Mostly expected.`,
    ],
    finale: [
      () => `A couple won. The public agreed with themselves.`,
      () => `The favourites won. Nobody fainted.`,
      () => `The result was settled weeks ago. Tonight was the confetti.`,
      () => `They won. Now they have to date in the real world. Good luck.`,
      () => `A lovely final. I have no notes and no speech.`,
    ],
  },

  // Long. Arrives at the point by way of feeling. Everything is an event.
  theatrical: {
    bombshell: [
      ({ s }) => `The steps. The music. ${s}. I watched every couple in that garden quietly rewrite their own futures in real time.`,
      ({ s }) => `${s} did not walk into that villa, ${s} arrived, and there is a difference, and every single one of them felt it.`,
      () => `A text, a hush, and suddenly the calmest villa on television became a weather system.`,
      () => `Nothing is safe now. Nothing was ever safe, darling, but now they know it.`,
      ({ s }) => `Let it be written that ${s} changed the season in the time it took to say hello.`,
    ],
    steal: [
      ({ s }) => `${s} rose at that fire pit like somebody who had rehearsed it in the mirror for a week, and I adored every second.`,
      () => `A steal! In front of everybody! The oldest, cruellest, most glorious move this show has.`,
      ({ s }) => `I have watched a hundred recouplings and I still gasped when ${s} said that name.`,
      () => `Somewhere in that villa, a heart has just learned what a fire pit is for.`,
      ({ s }) => `${s} chose honesty over kindness tonight, and the whole villa will be arguing about which was right until morning.`,
    ],
    'casa-twist': [
      ({ s }) => `The door opened, and there was ${s}, holding a stranger's hand, and I have not recovered and I will not.`,
      () => `Casa Amor is not a twist, it is a mirror, and tonight some of them did not like what it showed.`,
      ({ s }) => `${s} walked back into that villa carrying an entirely new life and the old one was waiting by the sofa.`,
      () => `Weeks of promises, undone in a single walk down a single set of stairs. This is opera.`,
      () => `The ones who stuck will be remembered for ever. The ones who twisted will be remembered longer.`,
    ],
    'bottom-couples': [
      ({ s }) => `The public have looked into their hearts and found ${s} in the bottom, and I felt that personally.`,
      () => `The cruellest words on television: the couples with the fewest votes are.`,
      ({ s }) => `${s} standing there, waiting to hear what the whole country thinks. I could barely watch.`,
      () => `A bottom placing is a love story's second act. Everyone forgets that.`,
      () => `Somebody's summer is about to end, and they are standing in the most beautiful villa on earth when it happens.`,
    ],
    dumped: [
      ({ s }) => `${s} has been dumped from the island, and the villa has lost a little of its light tonight. I mean that.`,
      ({ s }) => `The walk up those steps is the longest walk on television, and ${s} did it with their head up.`,
      () => `One recoupling, one empty seat, and a whole villa pretending not to cry.`,
      ({ s }) => `I will miss ${s}. The villa will miss ${s} more, and it will not say so until breakfast.`,
      () => `This is the part of the show nobody signs up for, and it is the part everybody remembers.`,
    ],
    finale: [
      () => `The names were read, the petals fell, and a love story became a winning one. I wept, obviously.`,
      () => `Weeks of recouplings, bombshells and one Casa Amor, and it ends with the country choosing love. Perfect.`,
      () => `They did not just win. They were chosen, by millions of people, and that is a different thing entirely.`,
      () => `Every final is an ending and a beginning, and this one was both at once.`,
      () => `The public picked the couple they believed in. I believe in them too. I am not crying, you are.`,
    ],
  },

  // Says the thing. Does not soften it. Slightly enjoys not softening it.
  blunt: {
    bombshell: [
      ({ s }) => `${s} is going to break up a couple by the weekend. That is why ${s} is there.`,
      () => `The new arrival is better looking than half the villa and everyone in there knows it.`,
      ({ s }) => `${s} picked the dates to cause trouble. Good.`,
      () => `If your couple is shaken by one new face, it was never a couple.`,
      () => `The villa needed this. It had got lazy.`,
    ],
    steal: [
      ({ s }) => `${s} stole someone's partner. It was the right call and it was also a bit nasty.`,
      () => `If a steal works, the couple was already dead. Nobody likes hearing that.`,
      ({ s }) => `${s} wanted that person and took them. That is the game.`,
      () => `The one who got stolen from should have seen it coming. Everybody else did.`,
      () => `People will call it disrespectful. It was just honest.`,
    ],
    'casa-twist': [
      ({ s }) => `${s} twisted after four days. That says everything about the last six weeks.`,
      () => `If you can be turned in a weekend, you were never closed off.`,
      ({ s }) => `${s} made the choice and now has to live with the photos.`,
      () => `The one who stuck looks better tonight. Loyalty ages well.`,
      () => `Casa does not create doubts. It finds them.`,
    ],
    'bottom-couples': [
      ({ s }) => `${s} is in the bottom because ${s} has been boring. Sorry.`,
      () => `The public do not vote for couples who are only together to stay.`,
      ({ s }) => `${s} needed a moment this week and did not have one.`,
      () => `The bottom is exactly who it should be.`,
      () => `Screen time wins votes. They had none.`,
    ],
    dumped: [
      ({ s }) => `${s} has been dumped from the island. Stayed single too long, simple as that.`,
      () => `You cannot wait to be picked in there. You have to go and get someone.`,
      ({ s }) => `${s} was likeable and got nowhere. Likeable is not enough.`,
      () => `The right person went home tonight, even if it stings.`,
      ({ s }) => `${s} will be fine. Better than fine, probably. Just not in there.`,
    ],
    finale: [
      () => `The public picked the favourites. Nobody should be surprised.`,
      () => `Best couple won. Second place had the better story. Both things are true.`,
      () => `The winners never had a bad week. That is how you win this.`,
      () => `It was the safe result. The public usually go safe.`,
      () => `Fair winners. Now we find out if it lasts past the airport.`,
    ],
  },

  // Builds the case before stating it. Precise about what is and is not known.
  formal: {
    bombshell: [
      ({ s }) => `The significance of ${s}'s arrival is not the dates chosen but the couples who noticeably avoided choosing a side.`,
      () => `A new arrival tests each couple independently. The strength of a couple is measured by how little it has to say afterwards.`,
      ({ s }) => `I would note that ${s} selected islanders from two different couples, which is a deliberate method rather than an accident.`,
      () => `The recoupling is where this arrival will be decided. The dates are preliminary.`,
      () => `The villa had become settled. Settled villas are precisely where arrivals are sent.`,
    ],
    steal: [
      ({ s }) => `${s}'s steal required two conditions: a willing partner and a couple already under strain. Both were present.`,
      () => `A steal is a public statement about a private situation. That is what makes it so costly for everyone involved.`,
      ({ s }) => `I would distinguish ${s}'s timing from ${s}'s intention. The intention was clear for days; the timing was the recoupling.`,
      () => `The islander left single has done nothing wrong, which is the reason the villa's sympathy will go to them.`,
      () => `The consequences of a steal are usually felt at the next recoupling, not the current one.`,
    ],
    'casa-twist': [
      ({ s }) => `${s}'s decision reflects the relationship as it stood, rather than a sudden change made at Casa.`,
      () => `Casa Amor does not introduce doubt. It measures the doubt that was already there.`,
      ({ s }) => `The photos will matter more than the choice itself, because they remove any account ${s} might give.`,
      () => `The couples that came through intact should now be regarded as the favourites.`,
      () => `A twist is only ever half a decision. The partner who stayed behind makes the other half tonight.`,
    ],
    'bottom-couples': [
      ({ s }) => `The public's placement of ${s} is a judgement on visibility as much as on the couple itself.`,
      () => `The shares indicate a clear favourite, and a much closer contest at the bottom.`,
      ({ s }) => `I would regard ${s}'s position as recoverable. It rarely is twice.`,
      () => `The bottom couples share one feature: neither has been given a storyline the public can follow.`,
      () => `This vote is a measure of trust. The public do not trust couples they cannot read.`,
    ],
    dumped: [
      ({ s }) => `${s} was dumped from the island as a consequence of being single at the wrong recoupling, not of anything ${s} did tonight.`,
      () => `The rule is simple and severe: a single islander at a dumping is at the mercy of the numbers.`,
      ({ s }) => `The departure of ${s} will change the balance of the villa more than any single arrival this week.`,
      () => `I would expect the remaining singles to act quickly now. They have seen what waiting costs.`,
      ({ s }) => `${s}'s friendships in there were real. They were simply not enough under this format.`,
    ],
    finale: [
      () => `The result reflects a sustained preference rather than a late swing. The winners led for several weeks.`,
      () => `The public rewarded consistency. The runners-up had the more eventful series, which is not the same thing.`,
      () => `A winning couple must be both liked and believed. On the evidence, they were both.`,
      () => `I would attribute the result to Casa Amor, where the winners' position was effectively secured.`,
      () => `The final confirmed what the vote shares had suggested for some time.`,
    ],
  },

  // Kind first, and the read arrives inside the kindness rather than after it.
  warm: {
    bombshell: [
      ({ s }) => `I hope ${s} is okay, walking in to a villa full of couples. That is a hard room to enter.`,
      () => `A new face is always good for them. It makes everyone be honest about what they want.`,
      ({ s }) => `${s} seemed lovely, and a little nervous under it. I liked that.`,
      () => `The couples who held hands a bit tighter tonight will be fine. The others have some talking to do.`,
      ({ s }) => `I think ${s} will find someone. I just hope it is not by breaking somebody's heart.`,
    ],
    steal: [
      ({ s }) => `I understand why ${s} did it, and I still felt terrible for the one left standing.`,
      () => `A steal hurts more because everyone watches it happen. That poor thing.`,
      ({ s }) => `${s} was honest, and honesty is not always kind. Tonight it was not.`,
      () => `I hope someone gives the one who was left a big hug tonight.`,
      () => `It will hurt for a few days. Then they will realise they deserve someone who chooses them.`,
    ],
    'casa-twist': [
      ({ s }) => `I think ${s} found something real at Casa, and I still wish it had been handled more gently.`,
      () => `The one who stuck did everything right. I hope they know that.`,
      ({ s }) => `${s} looked scared walking in. It is hard to disappoint someone you cared about.`,
      () => `Casa is brutal. It is supposed to be. It still breaks my heart every year.`,
      () => `Whoever was left waiting will come out of this stronger, and far more loved by the public.`,
    ],
    'bottom-couples': [
      ({ s }) => `${s} in the bottom does not mean nobody likes them. It means we have not seen enough of them.`,
      () => `Being in the bottom can bring a couple closer. I have seen it happen.`,
      ({ s }) => `I hope ${s} is not taking it too personally. It is only one night.`,
      () => `The bottom is a lonely place. I hope their partner holds on to them tonight.`,
      () => `A few good days on screen and they will be fine. They just need a chance.`,
    ],
    dumped: [
      ({ s }) => `${s} was one of the kindest people in there, and I am sad to see ${s} go.`,
      () => `Being dumped is never about being unlovable. The timing was just wrong.`,
      ({ s }) => `I hope ${s} watches it back and sees how much the villa loved having them there.`,
      () => `The goodbyes were so sweet. You could see who the real friends were.`,
      ({ s }) => `${s} will meet someone lovely on the outside. I would put money on it.`,
    ],
    finale: [
      () => `They deserved it. You could see how much they care about each other from the first week.`,
      () => `I love that the public chose love. It does not always happen.`,
      () => `Every couple in that final should be proud. Getting there is the hard part.`,
      () => `The winners looked like they could not believe it, which is always the loveliest reaction.`,
      () => `I just hope they are this happy in six months. I think they will be.`,
    ],
  },

  // Compliments that are load-bearing. Reads everything as a manoeuvre.
  manipulative: {
    bombshell: [
      ({ s }) => `${s} chose those dates beautifully. Two couples, two cracks, one very useful week.`,
      () => `Watch who welcomed the new arrival the warmest. That is the one who needs a way out.`,
      ({ s }) => `${s} was sweet to everybody tonight. Sweet is how you get picked at a recoupling.`,
      () => `The couples who acted unbothered are the ones already working out their options.`,
      ({ s }) => `Lovely entrance from ${s}. Nobody in there will say a word against ${s} this week, which is exactly the point.`,
    ],
    steal: [
      ({ s }) => `${s} spent a week being charming to that couple. Now we know why.`,
      () => `A perfect steal is the one where the villa blames the person who got stolen from. Watch it happen.`,
      ({ s }) => `Beautifully done by ${s}. Never a word out of place, right up until the name.`,
      () => `The loudest person defending the couple tomorrow will be the one who helped set it up.`,
      () => `A steal only works if somebody has quietly told the target it is coming. Somebody did.`,
    ],
    'casa-twist': [
      ({ s }) => `${s} twisted, and I promise you the explanation was written before the doors opened.`,
      () => `The clever move at Casa is to look torn. It buys you sympathy whichever way you go.`,
      ({ s }) => `${s} walked in holding hands and looking guilty. The guilt was doing a lot of work.`,
      () => `The one who stuck now has the public. That is worth more than a partner, if you play it right.`,
      () => `Watch the friends of the one who was left. One of them is about to take that seat.`,
    ],
    'bottom-couples': [
      ({ s }) => `${s} in the bottom is the best thing that could happen to ${s}. Now there is a story.`,
      () => `The couples near the top should be nervous. The public get bored of favourites.`,
      ({ s }) => `If I were ${s}, I would have a very public, very emotional chat by tomorrow.`,
      () => `A bottom placing is a gift if you know how to unwrap it.`,
      () => `The safest couple in there tonight is the one nobody noticed.`,
    ],
    dumped: [
      ({ s }) => `${s} was lovely to everyone and useful to no one. That is how you end up single.`,
      () => `The tears at the fire pit were sincere. Some of the hugs were strategic.`,
      ({ s }) => `Someone in there was very relieved to see ${s} go, and is hiding it beautifully.`,
      () => `The singles who survive tonight will be much less polite by breakfast.`,
      ({ s }) => `${s} trusted the wrong friendship. It happens to the nicest ones first.`,
    ],
    finale: [
      () => `The winners never once looked like they were trying to win. That is how you win.`,
      () => `A couple the public can relax about. That is the whole secret.`,
      () => `The runners-up played the villa. The winners played the public. Only one of those has phones.`,
      () => `They made it look effortless, which took a great deal of effort.`,
      () => `Lovely result. I would like to know who they were quietly kind to on camera.`,
    ],
  },

  // Worries out loud; apologises; is usually right, which is the joke.
  nervous: {
    bombshell: [
      ({ s }) => `Is it bad that I think ${s} is going to cause a break-up? Sorry. I just think it.`,
      () => `I would be so scared walking into a villa full of couples. I would just stand by the pool.`,
      ({ s }) => `${s} took two people from two different couples on dates, and I think — sorry — I think that was on purpose.`,
      () => `Everybody said they were fine with it. Nobody looked fine with it.`,
      () => `I just hope nobody gets their heart broken this week. Somebody will. I am sorry.`,
    ],
    steal: [
      ({ s }) => `I saw ${s} looking over at that couple all week and I did not say anything. I should have said something.`,
      () => `The silence after the steal. I felt sick for everyone. Is that normal?`,
      ({ s }) => `I don't want to be mean about ${s}, and I think it was quite unkind. Sorry.`,
      () => `Imagine walking back to the daybeds after that. I could not.`,
      () => `Is it awful that I sort of understood it? I understood it. I still feel bad.`,
    ],
    'casa-twist': [
      ({ s }) => `I knew ${s} would twist. I didn't want to know. I knew.`,
      () => `The one who stuck — I cannot watch that bit, I had to look away, sorry.`,
      ({ s }) => `${s} looked so guilty coming in. I think ${s} knows it was a mistake. Maybe it was not.`,
      () => `Casa scares me every year. It is always worse than I think it will be.`,
      () => `I hope the one who was left is okay. I am worried about them, honestly.`,
    ],
    'bottom-couples': [
      ({ s }) => `Oh no, ${s} in the bottom. I voted for them. Did I not vote enough?`,
      () => `I hate the bottom couples bit. My heart goes every single time.`,
      ({ s }) => `I think ${s} might be okay. I think. I really hope so.`,
      () => `Is it wrong that I saw this one coming? I saw it. I feel terrible.`,
      () => `Standing there waiting for your name. I would faint. I would actually faint.`,
    ],
    dumped: [
      ({ s }) => `I don't want to speak badly of anyone, and I think ${s} deserved longer. Sorry.`,
      () => `The goodbyes always make me cry. Every single time.`,
      ({ s }) => `I had a feeling ${s} would go tonight, and I hate that I was right.`,
      () => `Was it too harsh? It felt too harsh. It is the rules, I know. Sorry.`,
      ({ s }) => `I hope somebody is looking after ${s} tonight. It is a lot.`,
    ],
    finale: [
      () => `I was so nervous for them I could not watch the names being read. They won! I think. They won.`,
      () => `I thought the other couple might win and I didn't want to say. I am so glad I didn't say.`,
      () => `Is it silly that I cried? I cried a lot. Sorry.`,
      () => `I hope they stay together. I really, really hope they stay together.`,
      () => `I knew they would win. I didn't want to jinx it, so I said nothing. For weeks.`,
    ],
  },

  // Arrives mid-thought and stays there. Punctuation is optional; volume is not.
  excitable: {
    bombshell: [
      ({ s }) => `${s} IS HERE and I am SCREAMING and every couple in there just went pale`,
      () => `a bombshell a BOMBSHELL finally something is happening`,
      ({ s }) => `okay okay ${s} picked THOSE two for the dates?? oh this is going to be amazing`,
      () => `the whole villa stood up at once i have never loved television more`,
      () => `new arrival means recoupling chaos means i am not sleeping tonight`,
    ],
    steal: [
      ({ s }) => `${s} STOLE HER. HIM. THEM. i do not care i am on the FLOOR`,
      () => `a STEAL at the FIRE PIT i have waited all series for this`,
      ({ s }) => `no no no ${s} did NOT just do that. oh my god. yes. that actually happened`,
      () => `the silence!!! you could hear the pool!!!`,
      () => `this is the best recoupling in YEARS and i will fight anyone who disagrees`,
    ],
    'casa-twist': [
      ({ s }) => `${s} WALKED IN WITH SOMEONE ELSE i have lost my mind`,
      () => `CASA AMOR NIGHT IS THE BEST NIGHT OF THE YEAR and it just proved it`,
      ({ s }) => `the face when ${s} came in holding hands. THE FACE`,
      () => `i need the photos i need them now i need everyone to see them`,
      () => `i am shaking. i am actually shaking. what a night`,
    ],
    'bottom-couples': [
      ({ s }) => `${s} IN THE BOTTOM?? who is voting?? i am voting!! everyone vote!!`,
      () => `the bottom couples bit is so stressful i had to stand up`,
      ({ s }) => `okay ${s} has to survive this, has to, i cannot lose them now`,
      () => `the public are SO wrong tonight and i love that i get to be angry about it`,
      () => `this vote is chaos and i am here for every second`,
    ],
    dumped: [
      ({ s }) => `NOT ${s}. i had plans for ${s}. i had a whole storyline in my head`,
      () => `dumped from the island?? already?? i am not ready`,
      ({ s }) => `${s} gone and the villa already feels empty i am devastated`,
      () => `the goodbye made me cry and i am not even embarrassed`,
      () => `okay i am fine i am totally fine i am not fine`,
    ],
    finale: [
      () => `THEY WON THEY WON THEY WON i am screaming at the television`,
      () => `the confetti!!! the names!!! the hug!!! i am so happy`,
      () => `best final EVER and i will say that every single year`,
      () => `i knew it i KNEW it from week one i called this`,
      () => `i need them to get married immediately. tomorrow. today`,
    ],
  },

  // Every moment is an opportunity to mention their own season, and they take it.
  boastful: {
    bombshell: [
      ({ s }) => `${s} made a decent entrance. Mine is still the one they show in the adverts.`,
      () => `When I walked in as the new arrival, two couples broke up by the weekend. Just saying.`,
      ({ s }) => `${s} picked the right dates. I would have picked the same ones, and done it faster.`,
      () => `A good bombshell sets the villa on fire. I would know.`,
      () => `The new one is doing well. I did better. People still stop me in the street about it.`,
    ],
    steal: [
      ({ s }) => `${s}'s steal was bold. Mine was bolder, and I was only in there a day.`,
      () => `I pulled off the most famous steal this show has ever had. This one was nice, though.`,
      ({ s }) => `People forget I was stolen from and turned it around within a week. ${s} should watch that series.`,
      () => `The trick with a steal is to make it look like it was never planned. I was the master of that.`,
      () => `Decent recoupling. Not a patch on mine.`,
    ],
    'casa-twist': [
      ({ s }) => `${s} twisted. I stuck, and I walked in to the biggest cheer this show has ever had.`,
      () => `My Casa Amor is still the one everyone talks about. This one was close. Close.`,
      ({ s }) => `If ${s} had watched my series, ${s} would know how badly twisting goes with the public.`,
      () => `I was the one who stuck when everyone expected me to twist. That is why I am still loved.`,
      () => `Casa separates the real ones from the rest. I was a real one.`,
    ],
    'bottom-couples': [
      ({ s }) => `${s} in the bottom. I was never once in the bottom. Not once.`,
      () => `The public know who to vote for. They voted for me every single week.`,
      ({ s }) => `If ${s} wants to get out of the bottom, ${s} should do what I did: be unforgettable.`,
      () => `Bottom couples are a warning. I was never given one, because I never needed one.`,
      () => `I topped the public vote four weeks running. It can be done.`,
    ],
    dumped: [
      ({ s }) => `${s} got dumped for staying single. I was never single for a single night.`,
      () => `Getting dumped is the risk you take if you are not the one grafting. I always grafted.`,
      ({ s }) => `${s} was lovely. Lovely does not win. Trust me, I would know what wins.`,
      () => `Sad exit. Mine was never sad, because mine never happened. Final.`,
      () => `People underestimate how hard it is to last as long as I did.`,
    ],
    finale: [
      () => `Good winners. Not as good as the year I was in the final, but good.`,
      () => `They won with a big share. Mine was bigger.`,
      () => `A worthy couple. They remind me of us, a little, which is the highest compliment I give.`,
      () => `A solid final. My final is still the most watched, but solid.`,
      () => `They will be told this is the best night of their lives. It is. Mine was better.`,
    ],
  },

  // Asks questions it does not want answered. Praise, delivered as an autopsy.
  sarcastic: {
    bombshell: [
      ({ s }) => `A stunning surprise, ${s} arriving, if you had not seen the trailer, the adverts or the magazine cover.`,
      () => `The villa is shocked, shocked, that a new single person walked into a dating show.`,
      ({ s }) => `${s} is "just here to get to know everyone". All of them. Especially the ones in couples.`,
      () => `Everybody was completely closed off. Right up until the text.`,
      () => `Nothing says true love like forgetting your partner's name the moment someone new walks in.`,
    ],
    steal: [
      ({ s }) => `${s} was "not looking to step on anyone's toes". ${s} then stood on every toe available.`,
      () => `A beautiful moment of honesty, delivered in front of the person it was most unkind to.`,
      ({ s }) => `Truly nobody could have seen that coming, except anyone who watched ${s} this week.`,
      () => `The couple was rock solid. That is why it lasted until the first recoupling.`,
      () => `Such respect for the couple. Such enormous respect. Anyway, they are single now.`,
    ],
    'casa-twist': [
      ({ s }) => `${s} "never expected to find anyone at Casa". ${s} found someone at Casa on day one.`,
      () => `Six weeks of promises, beautifully honoured for four days.`,
      ({ s }) => `What a surprise that ${s} twisted, after the week of being totally sure.`,
      () => `Casa Amor, where nothing happens, repeatedly, on camera.`,
      () => `The photos are going to go really well for everybody.`,
    ],
    'bottom-couples': [
      ({ s }) => `${s} in the bottom. How could the public possibly have noticed a couple doing nothing?`,
      () => `A shocking result, if you had avoided the last five episodes entirely.`,
      ({ s }) => `The public have spoken, and what they said about ${s} was not very much.`,
      () => `Nothing boosts a relationship like finding out the country does not care about it.`,
      () => `Fascinating vote. The couple who were on screen did well. Who could have predicted it?`,
    ],
    dumped: [
      ({ s }) => `${s} has been dumped for being single, on a show about couples. The twist nobody saw coming.`,
      () => `A heartbreaking exit, if you had not seen them left standing at the last three recouplings.`,
      ({ s }) => `${s} is "going to find love on the outside". Where, presumably, there are fewer cameras.`,
      () => `The villa will be devastated for almost a whole morning.`,
      () => `Such a surprise. Nobody at all could have predicted the single person getting dumped.`,
    ],
    finale: [
      () => `The favourite couple won. A thrilling upset, if you had been in a coma since week two.`,
      () => `A love story for the ages. Or at least until the first magazine deal.`,
      () => `The public chose true love, and also the couple with the most screen time. Coincidence.`,
      () => `They won! Now for the easy part: staying together with half the country watching.`,
      () => `Deeply moving. Some of us even stayed awake for it.`,
    ],
  },

  // Short. Flat. No cushion, no ceremony, no interest in softening it.
  streetwise: {
    bombshell: [
      ({ s }) => `${s} came in to cause trouble. Fair enough.`,
      () => `New face. Couples getting twitchy. Standard.`,
      ({ s }) => `${s} knows exactly who to go for. Watch.`,
      () => `If your couple wobbles over one arrival, sort your couple out.`,
      () => `Villa got too comfy. Now it isn't.`,
    ],
    steal: [
      ({ s }) => `${s} saw what ${s} wanted and took it. That's it.`,
      () => `Steal worked because the couple was finished. Simple.`,
      ({ s }) => `Harsh from ${s}. Not wrong, though.`,
      () => `Should have seen it coming. Everyone else did.`,
      () => `Recoupling does what it says. Somebody got recoupled.`,
    ],
    'casa-twist': [
      ({ s }) => `${s} twisted. Weekend beat six weeks. Tells you everything.`,
      () => `Stick or twist sorts out who's real. Sorted.`,
      ({ s }) => `${s} made the call. Now ${s} lives with it.`,
      () => `Whoever stuck comes out of this looking good. Proper good.`,
      () => `Casa doesn't make doubts. It finds them.`,
    ],
    'bottom-couples': [
      ({ s }) => `${s} in the bottom. No moments, no votes.`,
      () => `Public don't vote for couples who are just surviving.`,
      ({ s }) => `${s} needs to show up this week or that's it.`,
      () => `Bottom's right. Nobody's robbed.`,
      () => `Screen time is votes. They had none.`,
    ],
    dumped: [
      ({ s }) => `${s} got dumped. Stayed single too long. That's the game.`,
      () => `You don't wait to be picked in there. You go and get it.`,
      ({ s }) => `${s} will be fine outside. Better, probably.`,
      () => `Right result. Still stings.`,
      () => `Single at the wrong time. That's all it was.`,
    ],
    finale: [
      () => `Favourites won. Nobody's shocked.`,
      () => `Best couple won. Now the hard bit starts.`,
      () => `Public went safe. Public usually do.`,
      () => `Deserved. Never had a bad week.`,
      () => `Good winners. Let's see if it lasts past the airport.`,
    ],
  },

  // Reads the room as weather. Oblique, unhurried, occasionally unnervingly right.
  mystical: {
    bombshell: [
      ({ s }) => `The villa changed temperature the moment ${s} reached the steps. Some couples felt it first.`,
      () => `A new arrival is a question the whole villa has to answer. Not everyone answers it honestly.`,
      ({ s }) => `${s} chose those dates the way water finds the cracks in stone.`,
      () => `The ones who laughed loudest at the entrance were the ones most afraid.`,
      () => `Something that was settled is not settled any more. You could see it on the terrace.`,
    ],
    steal: [
      ({ s }) => `${s} had been drifting towards that person for days. Tonight the tide simply came in.`,
      () => `A couple can end long before the fire pit says so. Tonight it only caught up.`,
      ({ s }) => `There was no anger in ${s} when it happened. Only a kind of certainty.`,
      () => `The one left standing will understand this better in a month than tonight.`,
      () => `You could feel it in how they sat. Nobody sits that far apart from someone they're sure of.`,
    ],
    'casa-twist': [
      ({ s }) => `${s} went to Casa and found the version of themselves that was waiting there.`,
      () => `Casa Amor does not change people. It shows them who they already were.`,
      ({ s }) => `There was a quiet in ${s} coming through that door. The kind that comes after a decision.`,
      () => `The one who stuck carried something steady into that room, and it will not leave them.`,
      () => `Some doors open onto a new beginning. Some open onto a very long night.`,
    ],
    'bottom-couples': [
      ({ s }) => `The country has been watching ${s} more closely than ${s} knows, and quietly deciding.`,
      () => `A couple can be together and not yet be seen. The public only vote for what they can see.`,
      ({ s }) => `${s} has been half in shadow all series. The bottom is only where the light didn't reach.`,
      () => `There is a story in that couple the public haven't been shown. It may yet arrive.`,
      () => `The bottom is not always an ending. Sometimes it is the start of being noticed.`,
    ],
    dumped: [
      ({ s }) => `${s} had been fading from the villa for days. The fire pit only said it out loud.`,
      () => `Some islanders are only passing through. You can feel it, early on, in how they stand.`,
      ({ s }) => `${s} carried something in there all summer that no one else could see. I hope it's lighter now.`,
      () => `The villa will feel a draught tomorrow morning where they used to be.`,
      ({ s }) => `I think ${s} was always going to find what ${s} was looking for somewhere else.`,
    ],
    finale: [
      () => `The public felt it before they voted for it. Some couples simply belong at the end.`,
      () => `There was a stillness between them all series. That is what the country was voting for.`,
      () => `The final only made visible what had been settled quietly weeks ago.`,
      () => `Love that survives that many eyes is love that has already been tested.`,
      () => `They walked in strangers and walked out chosen. That is a rare kind of journey.`,
    ],
  },
};
