// The same moment in six voices (Plan 3a+ Task 14, layer 1). Data only.
// Each entry is `when: { register }` (ci/register.js): warm, hype, dry,
// formal, flirty, blunt. A line written for the speaker's register wins
// most draws, so two players with nothing authored still sound different.
// Slots and facts are those of the pool each list joins.
const R = (key, byRegister, kind = 'say') => ({
  [key]: Object.entries(byRegister).flatMap(([register, lines]) => lines.map((line, i) => {
    const [text, beat] = Array.isArray(line) ? line : [line];
    return { id: `${key}.${register}${i + 1}`, when: { register }, turns: [{ by: 'a', [kind]: text }], ...(beat ? { beat } : {}) };
  })),
});

export const REGISTER_LINES = {
  // ── Ratings (said aloud to the Circle) ────────────────────────────────
  ...R('rate.middle', {
    warm: ["{b}, sweetheart, you're in the middle. I just need more time with you.", "Middle for {b}. I like {b.obj}. I want to like {b.obj} more."],
    hype: ["{b}! Middle! Solid! Let's keep it moving!", "Middle spot, {b}. Climb, baby, climb!"],
    dry: ["{b}. Middle. Sure.", "Middle. {b}. Next."],
    formal: ["I'm placing {b} in the middle. I don't know {b.obj} well enough yet.", "Circle, please put {b} in the middle position."],
    flirty: ["{b} in the middle. For now. Impress me.", "Middle, {b}. You could move up. You know how."],
    blunt: ["{b}, middle. I don't know you. Talk to me.", "Middle. {b} hasn't given me a reason for anything else."],
  }),
  ...R('rate.affection.top', {
    warm: ["{b}, you're my heart in here. First place, always.", "First place is {b}. I'd hug {b.obj} through the screen if I could."],
    hype: ["{b} FIRST! No question! Let's go!", "Number one, {b}! Circle, put it up there!"],
    dry: ["{b}. First. Obviously.", "First is {b}. Not a hard one."],
    formal: ["My first position goes to {b}. {b.Sub} has been consistent with me from the start.", "Circle, please place {b} first. I trust {b.obj}."],
    flirty: ["{b}, first place. Don't let it go to your head. Actually, do.", "Top spot goes to {b}. I think {b.sub} knows why."],
    blunt: ["{b} is first. {b} earned it. Done.", "First place, {b}. Easiest call I'll make all day."],
  }),
  ...R('rate.affection.bottom', {
    warm: ["I hate this part. {b}, I'm so sorry. You're last.", "{b} goes at the bottom, and I still wish {b.obj} well. I do."],
    hype: ["{b}, last! Nothing personal! Okay, a little personal!", "Bottom spot, {b}! Gotta go somewhere!"],
    dry: ["{b}. Last. We don't talk.", "Last is {b}. Shocking to nobody."],
    formal: ["I'm placing {b} last. We simply haven't connected.", "Circle, {b} goes in last position. I have very little to go on."],
    flirty: ["{b}, last. You never even tried to charm me.", "Bottom, {b}. No sparks. None."],
    blunt: ["{b}, last. I don't like you. There it is.", "Last place. {b}. Moving on."],
  }),
  ...R('rate.threat.top', {
    warm: ["{b} is going to go far, and I want {b.obj} to know I'm with {b.obj}. First.", "First is {b}. Strong players need friends too."],
    hype: ["{b} is a beast! Put the beast first! Stay on the beast's good side!", "First place, {b}! I want the winner on my team!"],
    dry: ["{b} is winning this. Might as well be first. Sure.", "First: {b}. Self-preservation."],
    formal: ["{b} is the strongest player in here. It's wiser to be {b.posAdj} ally. First position.", "Strategically, {b} goes first."],
    flirty: ["{b}, first. Powerful is very attractive, just so you know.", "First place for {b}. I like being close to the top."],
    blunt: ["{b} runs this place. I'm not dumb. First.", "First, {b}. You don't fight the strongest one. You join {b.obj}."],
  }),
  ...R('rate.threat.bottom', {
    warm: ["This breaks my heart. {b}, you're too good at this. Last.", "I adore {b}. That's the problem. Last place."],
    hype: ["{b} is too strong! Somebody's gotta do it! Last!", "Bottom for {b}! Big threat, big move!"],
    dry: ["{b} is winning. Not on my watch. Last.", "Last: {b}. It's math."],
    formal: ["{b} is the biggest threat in this game. I'm placing {b.obj} last.", "If {b} stays on top, none of us win. Last position."],
    flirty: ["{b}, last. It's because you're too good. Take it as a compliment.", "Sorry, gorgeous. {b} goes last. Too dangerous."],
    blunt: ["{b} has to go. Last.", "{b} is a threat. Bottom. I'll say it to {b.posAdj} face."],
  }),
  ...R('rate.suspicion.bottom', {
    warm: ["I want to believe {b}. I just can't yet. Last, and I'm sorry.", "{b}, if you're real, I'll make it up to you. Last."],
    hype: ["{b}, something's off! Last! Prove me wrong!", "Bottom for {b}! My gut is screaming!"],
    dry: ["{b}. Not real. Last.", "Last: {b}. The story doesn't hold."],
    formal: ["{b}'s answers don't line up. I'm placing {b.obj} last.", "Circle, {b} goes last. I don't believe the profile."],
    flirty: ["{b} is too perfect. Nobody's that perfect. Except me. Last.", "Last, {b}. Pretty pictures don't fool me."],
    blunt: ["{b} is a catfish. I'd bet on it. Last.", "Last. {b}. I don't buy any of it."],
  }),
  // ── Ratings results (reacting to the screen) ──────────────────────────
  ...R('result.middle', {
    warm: [["Middle is okay. People like me. I'll take it.", '{a} smiles, a little too hard.'], ["Middle. That's fine. I just want everyone to feel safe with me.", '{a} nods at the screen.']],
    hype: [["Middle! Okay! We climb from here!", '{a} claps once, loudly.'], ["Not bad! Not great! Next week, top!", '{a} points at the screen like it owes {a.obj} money.']],
    dry: [["Middle. Riveting.", "{a} doesn't even sit up."], ["Middle. Fine. Whatever.", '{a} shrugs at nobody.']],
    formal: [["Middle placement. That's acceptable for now.", '{a} writes something down on a notepad.'], ["The middle. I can work with that.", '{a} taps a pen against {a.posAdj} chin.']],
    flirty: [["Middle? Somebody's not paying attention.", '{a} flips {a.posAdj} hair over one shoulder.'], ["Middle. I'll have to turn it up.", '{a} winks at the camera.']],
    blunt: [["Middle. Not good enough.", '{a.posAdj} jaw tightens.'], ["Middle. Somebody's lying to me.", '{a} narrows {a.posAdj} eyes at the screen.']],
  }, 'react'),
  ...R('result.bottom', {
    warm: [["The bottom? But I love these people. Why don't they love me?", '{a} blinks back tears.'], ["I'm down there. That really hurts.", '{a} hugs a pillow to {a.posAdj} chest.']],
    hype: [["The BOTTOM? Are you kidding me right now?", '{a} jumps up off the couch.'], ["No. Nope. Not having it. I'm coming back!", '{a} paces the apartment, fired up.']],
    dry: [["Bottom. Great. Love that for me.", '{a} lies back and stares at the ceiling.'], ["Bottom. Cool. Cool cool cool.", '{a} slowly pulls a blanket over {a.posAdj} head.']],
    formal: [["The bottom. I need to reassess everything.", '{a} takes off {a.posAdj} shoes and starts pacing.'], ["Last. That's a clear message. I have to change my approach.", '{a} sits very still.']],
    flirty: [["The bottom? Me? Do they not see my pictures?", '{a} holds a mirror up to {a.posAdj} face, offended.'], ["Last. Okay. Time to get charming.", '{a} cracks {a.posAdj} knuckles.']],
    blunt: [["Bottom? Somebody here is a liar.", '{a} glares at the screen.'], ["Last. Fine. Now I know who my enemies are.", '{a} crosses {a.posAdj} arms.']],
  }, 'react'),
  ...R('ratings.done', {
    warm: [["Sent. I hope nobody's hurt. I really do.", '{a} presses both hands over {a.posAdj} heart.'], ["Done. I feel awful for whoever's at the bottom of mine.", '{a} sighs and sinks into the couch.']],
    hype: [["SENT! Let's go! Show me the results!", '{a} leaps off the couch.'], ["Done! That's the best ranking I've ever done!", '{a} does a victory lap around the kitchen.']],
    dry: [["Sent. Moving on.", '{a} is already opening the fridge.'], ["Done. I'll regret it or I won't.", '{a} shrugs and turns on the TV.']],
    formal: [["Rankings submitted. I stand by every position.", '{a} nods once, satisfied.'], ["That's done. I considered it carefully.", '{a} sets down {a.posAdj} notes.']],
    flirty: [["Sent. Somebody's gonna be very happy with me tonight.", '{a} blows a kiss at the screen.'], ["Done. I hope my number one notices.", '{a} smiles to {a.ref}.']],
    blunt: [["Sent. No regrets.", '{a} tosses the remote onto the couch.'], ["Done. Some people aren't gonna like it. Too bad.", '{a} leans back, arms folded.']],
  }),

  // ── The blocking ───────────────────────────────────────────────────────
  ...R('block.wait', {
    warm: ["Please be okay, everybody. Please be okay.", "Whoever it is, I love you. I'm so sorry."],
    hype: ["Come on, come on, COME ON!", "Say it! Just say it already!"],
    dry: ["Great. Dots. My favorite.", "Just type the name."],
    formal: ["Whatever happens, I've played honestly.", "I'd prefer they just got it over with."],
    flirty: ["If it's me, I'm going out looking good.", "Not me. They like me too much. Right?"],
    blunt: ["If it's me, I'm gonna find out why.", "Type it. I'm not scared."],
  }, 'react'),
  ...R('block.react.relief', {
    warm: ["Oh, {b}. I'm so sorry. I'm so glad it's not me, and I'm so sorry.", "Poor {b}. Somebody give {b.obj} a hug."],
    hype: ["NOT ME! Still here! Sorry, {b}!", "I survived! {b}, you'll be missed!"],
    dry: ["{b}. Huh. Okay.", "Not me. Noted."],
    formal: ["{b}. That's a significant move. I didn't expect it.", "I'm relieved. And sorry for {b}."],
    flirty: ["Still here. Obviously. Bye, {b}.", "Not me. Nobody blocks this face."],
    blunt: ["{b}. Called it.", "Not me. Good. {b} had it coming."],
  }, 'react'),
  ...R('block.after', {
    warm: ["I hope {b} knows it wasn't about who {b.sub} is.", "That hurt me more than it'll hurt {b}. I mean it."],
    hype: ["Big move! Huge move! Let's see what happens!", "Done! Pressure's off! Now we play!"],
    dry: ["Well. That happened.", "Done. Next week, someone does it to me."],
    formal: ["It was the right decision for my game. I stand by it.", "I explained my reasoning. That's all I can do."],
    flirty: ["I'll be charming again tomorrow. Tonight, I'm dangerous.", "Somebody had to be the bad guy. At least I looked good doing it."],
    blunt: ["{b} had to go. I'd do it again.", "No regrets. None."],
  }),
  ...R('block.react.self', {
    warm: ["Me? But I thought... I thought we were all friends.", ["It's me. Okay. I just hope everyone knows I loved them.", '{a} wipes {a.posAdj} eyes.']],
    hype: ["ME? Are you serious right now?", ["Me! Blocked! I was just getting started!", '{a} throws both hands up.']],
    dry: ["Me. Of course. Of course it's me.", "Cool. Blocked. Great day."],
    formal: ["Me. I didn't see that coming. I'd like to know why.", "I'm blocked. I'd like an explanation."],
    flirty: ["Me? They blocked me? Their loss.", "Blocked. Wow. Somebody's gonna miss this."],
    blunt: ["Me? Somebody's getting a visit.", ["Blocked. Fine. I know exactly who to talk to.", '{a} stands up and grabs {a.posAdj} jacket.']],
  }, 'react'),

  // ── The visit ──────────────────────────────────────────────────────────
  ...R('visit.wait', {
    warm: [["If {b} comes here, I'm giving {b.obj} a big hug. Whatever happens.", '{a} puts the kettle on, just in case.'], ["Poor {b}. Whoever gets that knock, be nice.", '{a} hugs {a.posAdj} knees on the couch.']],
    hype: [["Is it me? Is it me? Oh my God, is it me?", '{a} sprints to the door, then sprints away from it.'], ["I'm ready! I'm not ready! I'm so ready!", '{a} bounces on the couch.']],
    dry: [["If {b} knocks, I'm pretending I'm asleep.", '{a} lies down on the couch and closes {a.posAdj} eyes. They open again immediately.'], ["Can't wait for the awkward hug.", "{a} doesn't move from the couch."]],
    formal: [["If {b} comes here, I'll explain myself honestly.", '{a} straightens the cushions and sits very upright.'], ["Whoever {b} chooses, I hope it goes well.", '{a} folds {a.posAdj} hands in {a.posAdj} lap.']],
    flirty: [["If {b} comes here, at least I did my hair.", '{a} fluffs {a.posAdj} hair in the mirror.'], ["Knock knock, {b}. I'm ready for my close-up.", '{a} checks {a.posAdj} reflection in the TV.']],
    blunt: [["If {b} shows up here, {b.sub}'s getting the truth.", '{a} stands facing the door, arms folded.'], ["Let {b} come. I've got nothing to hide.", '{a} turns the music up.']],
  }, 'react'),

  // ── The goodbye video ──────────────────────────────────────────────────
  ...R('goodbye.guess', {
    warm: [["Oh, {b}. I hope you're okay. Let's hear it.", "{a} pulls a blanket around {a.posAdj} shoulders."], ["Whatever {b} says, I'm sending love.", "{a} holds a hand over {a.posAdj} heart."]],
    hype: [["Goodbye message! Let's go! Play it!", "{a} scoots right up to the screen."], ["Here it comes! What's {b} gonna say?", "{a} grabs a pillow and squeezes it."]],
    dry: [["Here we go. {b}'s farewell tour.", "{a} leans back with a bowl of cereal."], ["Can't wait. Truly.", "{a} doesn't look up from {a.posAdj} nails."]],
    formal: [["Let's see what {b} has to say.", "{a} sits forward, elbows on {a.posAdj} knees."], ["This will tell us a lot about {b}.", "{a} watches without blinking."]],
    flirty: [["If {b} says something about me, I hope it's nice.", "{a} checks {a.posAdj} hair in the reflection of the screen."], ["Come on, {b}. Say something juicy.", "{a} rubs {a.posAdj} hands together."]],
    blunt: [["Let's see if {b} was real.", "{a} crosses {a.posAdj} arms."], ["Okay, {b}. Tell the truth for once.", "{a} narrows {a.posAdj} eyes at the screen."]],
  }, 'react'),
  ...R('goodbye.react.surprised', {
    warm: [["Aw, {b}. I'm gonna miss {b.obj} so much.", '{a} presses a hand to {a.posAdj} heart.'], ["That was beautiful. Bye, {b}.", "{a} dabs {a.posAdj} eyes with a tissue."]],
    hype: [["Wow! Okay! {b} went out swinging!", "{a} applauds the screen."], ["That was wild! {b}, legend!", "{a} raises a glass to the screen."]],
    dry: [["Well. Bye, {b}.", "{a} gives the screen a small wave."], ["That was a video. With {b} in it.", "{a} goes back to {a.posAdj} cereal."]],
    formal: [["That was a gracious exit from {b}.", "{a} nods slowly."], ["{b} handled that well. Respect.", "{a} gives a small, approving nod."]],
    flirty: [["Bye, {b}. The Circle got a little less cute.", "{a} blows a kiss at the screen."], ["{b} looked good leaving, I'll say that.", "{a} fans {a.ref}."]],
    blunt: [["{b}'s gone. That's the game.", "{a} turns the TV off."], ["Bye, {b}. Next.", "{a} is already back on the couch."]],
  }, 'react'),

  // ── Circle Chat and the Newsfeed ──────────────────────────────────────
  ...R('circle.react', {
    warm: ["{b} always makes the chat feel like home.", "I love that {b} said that. So sweet."],
    hype: ["{b} is on fire today!", "Okay, {b}! Bring the energy!"],
    dry: ["Thank you, {b}, for that contribution.", "{b} typed words. Okay."],
    formal: ["That's an interesting thing for {b} to say in public.", "{b} is choosing words very carefully."],
    flirty: ["{b} is definitely talking to me there.", "Is {b} flirting? {b} is flirting."],
    blunt: ["{b} is full of it.", "Nobody asked, {b}."],
  }, 'react'),
  ...R('status.react', {
    warm: ["Aw, {b}. That made my morning.", "I love seeing {b} post. Always so real."],
    hype: ["{b}, yes! Post more!", "Ooh, {b} came to play today!"],
    dry: ["Riveting post, {b}.", "{b} posted. The world keeps turning."],
    formal: ["That's a smart post from {b}. Very deliberate.", "{b} knows exactly what {b.sub}'s doing with that one."],
    flirty: ["{b} knows what {b.sub}'s doing with that picture.", "Okay, {b}. I see you."],
    blunt: ["{b} is fishing for likes.", "That post is fake, {b}."],
  }, 'react'),
};
