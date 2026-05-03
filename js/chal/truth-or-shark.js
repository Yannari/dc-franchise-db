// js/chal/truth-or-shark.js — Truth or Shark game show challenge (pre-merge tribe vs tribe)
import { gs, players, seasonConfig } from '../core.js';
import { pStats, pronouns, tribeColor, updateChalRecord } from '../players.js';
import { addBond, getBond } from '../bonds.js';
import { romanticCompat } from '../players.js';
import { _challengeRomanceSpark, _checkShowmanceChalMoment } from '../romance.js';

// ── HELPERS ──
function host() { return seasonConfig?.hostName || 'Chris'; }
const pick = arr => arr[Math.floor(Math.random() * arr.length)];
function noise(range = 2.5) { return (Math.random() - 0.5) * range; }
function popDelta(name, delta) {
  if (!gs.popularity) gs.popularity = {};
  gs.popularity[name] = (gs.popularity[name] || 0) + delta;
}
function arch(name) { return players.find(p => p.name === name)?.archetype || 'floater'; }
function portrait(name, size = 42) {
  const sl = players.find(p => p.name === name)?.slug || name.toLowerCase().replace(/\s+/g, '-');
  return `<img src="assets/avatars/${sl}.png" alt="${name}" style="width:${size}px;height:${size}px;border-radius:4px;object-fit:contain;flex-shrink:0" onerror="this.style.display='none'">`;
}
function slug(name) { return players.find(p => p.name === name)?.slug || name.toLowerCase().replace(/\s+/g, '-'); }
function canScheme(name) {
  const a = arch(name);
  if (['villain', 'mastermind', 'schemer'].includes(a)) return true;
  if (['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat'].includes(a)) return false;
  const s = pStats(name);
  return s.strategic >= 6 && s.loyalty <= 4;
}
function isNice(name) {
  return ['hero', 'loyal-soldier', 'social-butterfly', 'showmancer', 'underdog', 'goat'].includes(arch(name));
}
function isVillain(name) {
  return ['villain', 'mastermind', 'schemer'].includes(arch(name));
}

// ══════════════════════════════════════════════════════════════
// THE WHEEL — STUNTS
// ══════════════════════════════════════════════════════════════
const STUNTS = [
  { id: 'shark-splash',       name: 'Shark Tank Splash',    primary: 'physical',  secondary: 'boldness',   difficulty: 5,   icon: 'shark',  desc: 'Swim a lap in a tank with live sharks' },
  { id: 'slime-balance',      name: 'Slime Bucket Balance', primary: 'endurance', secondary: 'temperament',difficulty: 5,   icon: 'slime',  desc: 'Balance on a beam while slime dumps from above' },
  { id: 'ice-bath',           name: 'Ice Bath Endurance',   primary: 'endurance', secondary: 'mental',     difficulty: 5,   icon: 'bolt',   desc: 'Sit in an ice bath until the timer rings' },
  { id: 'gross-food',         name: 'Gross Food Gauntlet',  primary: 'boldness',  secondary: 'endurance',  difficulty: 6.5, icon: 'slime',  desc: 'Eat three mystery dishes without gagging' },
  { id: 'obstacle-sprint',    name: 'Obstacle Sprint',      primary: 'physical',  secondary: 'endurance',  difficulty: 6.5, icon: 'bolt',   desc: 'Complete a punishing obstacle course in 60 seconds' },
  { id: 'buzzer-hold',        name: 'Electric Buzzer Hold', primary: 'mental',    secondary: 'endurance',  difficulty: 6.5, icon: 'buzzer', desc: 'Hold a buzzing plate as the voltage climbs' },
  { id: 'shark-gauntlet',     name: 'Shark Gauntlet',       primary: 'physical',  secondary: 'boldness',   difficulty: 8,   icon: 'shark',  desc: 'Cross a balance beam above the shark tank' },
  { id: 'full-slime',         name: 'Full Slime Endurance', primary: 'endurance', secondary: 'physical',   difficulty: 8,   icon: 'slime',  desc: 'Stay standing in a slime flood for 90 seconds' },
  { id: 'nightmare-combo',    name: 'Nightmare Combo',      primary: 'physical',  secondary: 'boldness',   difficulty: 9.5, icon: 'crack',  desc: 'Sharks + slime + obstacles. All at once. Good luck.' },
];

// ══════════════════════════════════════════════════════════════
// TRUTH POOLS — per archetype + stat categories
// ══════════════════════════════════════════════════════════════
const TRUTH_POOLS = {
  lowPhysical: [
    n => `Who got piggy-backed off a hiking trail by a park ranger because their legs "stopped working" after one mile?`,
    n => `Who fainted during a trust fall exercise and their partner just stepped aside?`,
    n => `Who got out-arm-wrestled by their date on the first date and the waiter saw everything?`,
    n => `Who got stuck at the top of a climbing wall and had to be lowered down sobbing while a children's birthday party watched?`,
    n => `Who threw up on a treadmill at a crowded gym and it sprayed onto the person behind them?`,
    n => `Who pulled a muscle clapping too hard at a concert and had to leave in a sling?`,
    n => `Who got winded blowing up balloons for their own surprise party and passed out before the guests arrived?`,
    n => `Who fell off an exercise ball in a yoga class, knocked over the instructor, and dominoed three other people?`,
    n => `Who got carried bridal-style out of a haunted house by a teenage employee because they refused to walk?`,
    n => `Who got lapped by someone power-walking during a 5K run and the power-walker wasn't even in the race?`,
  ],
  lowMental: [
    n => `Who got a face tattoo in a language they thought meant "strength" but it actually says "soup"?`,
    n => `Who argued with a teacher for twenty minutes that Alaska was a separate country?`,
    n => `Who put metal in a microwave, started a small fire, and then tried to put it out with more metal?`,
    n => `Who sent a breakup text to the wrong person and accidentally broke up their parents?`,
    n => `Who showed up to a costume party on the wrong day, in full body paint, to a business dinner?`,
    n => `Who confidently pronounced "hors d'oeuvres" as "horse devores" at a fancy charity gala in front of 300 people?`,
    n => `Who Googled "how to boil water" while on a cooking date and their date saw the search history?`,
    n => `Who gave a presentation at work with their notes taped to the BACK of the slides and just read from a blank screen for ten minutes?`,
    n => `Who tried to scan a physical coupon by putting it face-down on their phone screen at a checkout line?`,
    n => `Who replied-all to a company-wide email with "this meeting could've been an email" and it was from the CEO?`,
  ],
  lowSocial: [
    n => `Who practiced asking someone to prom in the mirror, opened the door, and the person was standing right there and heard everything?`,
    n => `Who went in for a handshake, got left hanging, pivoted to a wave, and accidentally slapped someone in the face?`,
    n => `Who had "happy birthday" sung to them at a restaurant and it wasn't their birthday but they were too awkward to stop it?`,
    n => `Who got caught talking to a mannequin in a store because they thought it was a real person for five minutes?`,
    n => `Who accidentally video-called their ex at 2am and panicked so hard they threw their phone in the toilet?`,
    n => `Who showed up to a "casual hangout" in a full three-piece suit because they misread the vibe?`,
    n => `Who tried to make a toast at a dinner party, blanked completely, and just said "...food" and sat down?`,
    n => `Who hid in a restaurant bathroom for 45 minutes to avoid an ex sitting two tables away?`,
    n => `Who waved at someone across a mall for thirty seconds before realizing it was their own reflection in a mirror?`,
    n => `Who got ghosted by a pen pal?`,
  ],
  highSocial: [
    n => `Who has a private spreadsheet rating every person they've ever dated on a 100-point scale with subcategories?`,
    n => `Who intentionally befriended someone's new partner just to gather intel for the ex?`,
    n => `Who secretly started a group chat about their own friend and accidentally added them to it?`,
    n => `Who told two different people they were their "best friend" at the same party and they found out?`,
    n => `Who cried on command at a funeral for someone they barely knew just to make a good impression on the family?`,
    n => `Who pretended to be fluent in French for an entire vacation and got exposed by a six-year-old?`,
    n => `Who threw a "feel better" party for someone specifically to guilt-trip them about a favor they owed?`,
    n => `Who memorized everyone's coffee order at work not out of kindness but to make people feel indebted?`,
  ],
  highStrategic: [
    n => `Who bugged their roommate's conversations using a baby monitor hidden in a stuffed animal?`,
    n => `Who created fake online reviews to tank a rival's small business out of pure spite?`,
    n => `Who catfished someone in their own friend group for three months to extract secrets?`,
    n => `Who ghostwrote anonymous gossip articles about people in their own social circle and "investigated" them publicly?`,
    n => `Who kept a burn book with receipts — screenshots, timestamps, and threat-level ratings?`,
    n => `Who set up a fake scholarship to see who would lie on their applications?`,
    n => `Who secretly recorded a friend's embarrassing confession and kept it as "insurance"?`,
    n => `Who reverse-engineered a coworker's password from their pet's name and birth year to read their emails?`,
  ],
  mastermind: [
    n => `Who has a coded notebook rating every person they know by "usefulness" with quarterly reviews?`,
    n => `Who pretended to be terrible at poker for six months, then won $2,000 from their entire friend group in one night?`,
    n => `Who planted embarrassing fake secrets about themselves to see who would spread them — and kept a list of who did?`,
    n => `Who orchestrated a friend's breakup because the partner was "distracting them from the plan"?`,
    n => `Who had a voice-activated recorder running during every "private" conversation for an entire summer?`,
    n => `Who created three different social media personas to manipulate the same online debate from all sides?`,
    n => `Who memorized everyone's phone passcode by watching their fingers and never told anyone?`,
    n => `Who wrote a 40-page psychological profile on their college roommate and the roommate found it?`,
  ],
  schemer: [
    n => `Who stole their best friend's prom date by pretending the friend had already cancelled on them?`,
    n => `Who framed their sibling for a broken window using planted evidence and a false witness?`,
    n => `Who faked a medical emergency to get out of a commitment and got caught at a restaurant the same night?`,
    n => `Who anonymously reported their own party to the cops to end it early because they were losing at beer pong?`,
    n => `Who created a fake dating profile using their friend's photos without permission and it got 500 matches?`,
    n => `Who stole someone's diary, photocopied the juiciest pages, and distributed them as "anonymous art"?`,
    n => `Who convinced a coworker to quit a job by pretending to have inside info about layoffs — then applied for their position?`,
    n => `Who befriended someone's therapist at a bar specifically to fish for gossip about the patient?`,
  ],
  hothead: [
    n => `Who flipped a Monopoly board so hard it cracked a window and the little metal dog was never found?`,
    n => `Who screamed at a self-checkout machine until a manager escorted them out of the store?`,
    n => `Who punched a car dashboard during a traffic jam and set off both airbags?`,
    n => `Who got so angry at an online comment they drove to the poster's city before calming down in the parking lot?`,
    n => `Who threw a bowling ball overhand into the gutter so hard it cracked the lane and they got lifetime banned?`,
    n => `Who rage-quit a board game at Thanksgiving so hard the table flipped and the turkey hit the floor?`,
    n => `Who kicked a vending machine that fell on them and they had to be rescued by paramedics?`,
    n => `Who got into a screaming match with a GPS voice during a road trip and their passengers had to pull over?`,
  ],
  'challenge-beast': [
    n => `Who sobbed uncontrollably after losing a game of Connect Four to a kindergartner and the kindergartner tried to comfort them?`,
    n => `Who hired a personal trainer for a casual office charity fun-run and still came in fourth?`,
    n => `Who got so competitive during trivia night they accused the host of cheating and got kicked out of the bar?`,
    n => `Who practiced a victory dance for a competition they ended up placing last in — and the dance was caught on camera?`,
    n => `Who demanded a drug test for the winner of a casual family board game?`,
    n => `Who entered a child's talent show as a "guest competitor" and lost to an eight-year-old doing magic tricks?`,
    n => `Who kept a spreadsheet tracking their win-loss record against everyone they've ever played anything against?`,
    n => `Who challenged their elderly grandparent to a foot race at a reunion and still talks about the loss four years later?`,
  ],
  'social-butterfly': [
    n => `Who deep-liked a crush's photo from four years ago at 3am and the like notification woke them up?`,
    n => `Who crashed a stranger's wedding, gave a toast, and made the bride cry — then got caught during the photo lineup?`,
    n => `Who said "I love you" to a barista, realized what happened, and never went to that coffee shop again?`,
    n => `Who accidentally sent a screenshot of a conversation TO the person the conversation was about?`,
    n => `Who overshared their entire trauma history on a first date within the first ten minutes and the date excused themselves to the bathroom and never came back?`,
    n => `Who started a group chat called "people I'm better than" and accidentally added one of those people?`,
    n => `Who threw a surprise party for someone they'd known for one week and the person brought the cops because they thought it was a break-in?`,
    n => `Who was caught talking trash about someone in a voicemail they thought they'd hung up — they hadn't, and the voicemail was three minutes long?`,
  ],
  'loyal-soldier': [
    n => `Who ate their friend's cooking every day for a year — including a dish that gave them food poisoning twice — and still said "delicious" every time?`,
    n => `Who took the blame for a friend's fender bender, got their own license suspended, and the friend never paid them back?`,
    n => `Who lied under oath in small claims court to protect a friend who was 100% guilty?`,
    n => `Who carried a secret for so long they forgot what the secret was — and when it finally came out, it was about THEM?`,
    n => `Who missed their own graduation ceremony to drive a friend to a job interview that the friend didn't even show up to?`,
    n => `Who got a matching tattoo with a best friend who ghosted them three weeks later and now has "Bros 4 Life" on their ankle forever?`,
    n => `Who wrote someone's entire college application essay and that person got accepted to a school that rejected THEM?`,
    n => `Who let a friend copy their homework for two years and then got accused of being the one who copied?`,
  ],
  wildcard: [
    n => `Who showed up to a formal job interview in a full banana costume because "the email said come as you are"?`,
    n => `Who tried to adopt a raccoon, got bit, and the ER visit cost more than the raccoon was worth — so they tried again the next week?`,
    n => `Who ate a raw onion like an apple on a bus because "it builds character" and three people changed seats?`,
    n => `Who painted their entire apartment fluorescent green at 4am on a Tuesday because they "channeled the energy"?`,
    n => `Who got on the wrong flight, ended up in a different country, and didn't notice until they landed?`,
    n => `Who brought a live lobster as their plus-one to a wedding and introduced it to the bride's family?`,
    n => `Who pierced their own ear with a safety pin during a work meeting because they "felt inspired in the moment"?`,
    n => `Who shaved their head on a dare at a party and then cried for three days straight but told everyone they "meant to do it"?`,
  ],
  'chaos-agent': [
    n => `Who swapped the sugar and salt in an office kitchen and watched twelve people spit out their coffee without saying a word?`,
    n => `Who set every alarm clock in a department store to go off at 3am and hid in the parking lot to film the reaction?`,
    n => `Who put laxatives in the communal brownies at a potluck and took videos of the bathroom line?`,
    n => `Who signed their entire office up for a nudist colony newsletter using the company email and IT had to send a formal apology?`,
    n => `Who superglued a coin to a sidewalk and filmed people trying to pick it up for six hours?`,
    n => `Who changed the WiFi password at a party to "screamyourbigsecret" and told people they had to yell the password to get it?`,
    n => `Who rearranged every piece of furniture in a friend's apartment while they were on vacation — including moving the fridge into the bathroom?`,
    n => `Who hacked the school PA system to play fart sounds during the principal's speech and never got caught?`,
  ],
  floater: [
    n => `Who sat through an entire stranger's family dinner because they walked into the wrong house and were too embarrassed to leave?`,
    n => `Who was accidentally included in someone else's vacation photos for three days before the family noticed?`,
    n => `Who got tagged in a "people I've never spoken to" meme by someone in their own friend group?`,
    n => `Who went to a party, got forgotten on the couch, woke up at 6am, and the hosts screamed because they thought the house was empty?`,
    n => `Who applied to be a bridesmaid at a wedding they weren't even invited to as a guest?`,
    n => `Who realized at a ten-year reunion that nobody remembered them — including the person who sat next to them for four years?`,
    n => `Who blended into a stranger's group photo at Disney World and found themselves framed on that family's wall two years later?`,
    n => `Who spent an entire semester in a class they weren't enrolled in because nobody questioned them and they were too scared to leave?`,
  ],
  underdog: [
    n => `Who auditioned for the school play seven years in a row, finally got a role, and it was "Tree #3" — and they cried tears of joy?`,
    n => `Who trained for a marathon for eight months, finished dead last, and the cleanup crew was already packing up the finish line?`,
    n => `Who entered a baking competition with their grandma's secret recipe and the judges called it "aggressively mediocre"?`,
    n => `Who asked out their crush eleven times, got rejected eleven times, and it became a school-wide meme?`,
    n => `Who applied to their dream job fourteen times over three years and the rejection letters got progressively more apologetic?`,
    n => `Who got cut from the team every single year but still bought the jersey and wore it to every game?`,
    n => `Who was voted "most likely to be forgotten" in a yearbook superlatives poll that wasn't even official?`,
    n => `Who got a participation award at a competition they thought they won and gave a winner's speech before being corrected on stage?`,
  ],
  hero: [
    n => `Who jumped into a pool to "save" someone who was just doing a handstand and accidentally pantsed them in front of forty people?`,
    n => `Who tried to break up a fight between two strangers and both of them turned around and started yelling at THEM instead?`,
    n => `Who rescued what they thought was a stray dog, took it to the vet, bathed it, named it — and it was the neighbor's dog the entire time?`,
    n => `Who stood up to a bully in a dramatic speech, voice cracking, near tears — and then tripped over their own shoelace walking away?`,
    n => `Who volunteered to give blood, fainted in the chair, knocked over the blood bag, and had to be wheeled out in front of the entire donation center?`,
    n => `Who tried to carry an elderly person's groceries, dropped the eggs, slipped on the yolk, and took out a display of canned goods?`,
    n => `Who gave a passionate speech about recycling at a town hall and then accidentally threw their notes in the trash can instead of the recycling bin?`,
    n => `Who chased a "purse snatcher" for three blocks before the woman screamed that it was her husband carrying her bag?`,
  ],
  villain: [
    n => `Who got dumped, made a 45-minute diss track about their ex, uploaded it publicly, and it got two listens — both from their mom?`,
    n => `Who sabotaged a coworker's presentation by unplugging their laptop and then loudly offered to help fix it?`,
    n => `Who stole a class hamster over winter break, accidentally lost it, and blamed it on the janitor for years?`,
    n => `Who sent anonymous hate mail to themselves to get sympathy and accidentally used their own return address?`,
    n => `Who catfished their own ex using a fake profile, got emotionally attached to the fake persona, and then got jealous of themselves?`,
    n => `Who spread a rumor about a substitute teacher on Day One and the sub quit by lunch — and the class had a pop quiz instead?`,
    n => `Who stole someone's lunch every day for a month, got caught on the security camera, and it was their own assigned cubicle-mate?`,
    n => `Who tried to embarrass someone at a party by playing their search history on the TV but accidentally played their OWN?`,
  ],
  goat: [
    n => `Who microwaved a metal thermos, started a fire, blamed it on the microwave, and bought a new one — which they also microwaved a thermos in?`,
    n => `Who walked into a glass door at a restaurant so hard the entire patio thought it was a car accident?`,
    n => `Who accidentally sent a group text saying "I can't stand these people" TO those people?`,
    n => `Who showed up to an interview a full WEEK early, sat in the lobby for an hour before anyone said anything, and then came back on the right day pretending it never happened?`,
    n => `Who got their head stuck in a fence at a public park and the fire department had to cut them out while a tour group watched?`,
    n => `Who set off the fire alarm three separate times in one semester — once by burning toast, once by hairspray, and once by "testing" the alarm?`,
    n => `Who superglued their hand to their own face during an art project and had to go to the ER with their palm stuck to their cheek?`,
    n => `Who accidentally forwarded their therapist's email to their entire contacts list and the subject line was "re: your fear of being embarrassed in public"?`,
  ],
  'perceptive-player': [
    n => `Who correctly predicted every couple's breakup in their friend group and was caught keeping a public scoreboard with odds?`,
    n => `Who figured out their friend was lying about being sick, showed up at their house with soup, and caught them throwing a party?`,
    n => `Who deduced exactly what everyone got them for Christmas from the wrapping paper shapes and Amazon delivery times — and accidentally said "I know" before opening each one?`,
    n => `Who read their coworker's body language so accurately they predicted a pregnancy before the coworker knew — and said it out loud?`,
    n => `Who noticed two friends were secretly dating, confronted them in front of everyone at brunch, and both of them denied it until photos surfaced?`,
    n => `Who overheard a whispered conversation at a party, pieced together a secret relationship, and blurted it out as "fun trivia" during a game of charades?`,
    n => `Who figured out a friend was stealing from the tip jar by counting the bills before and after every shift — and presented the evidence in a PowerPoint?`,
    n => `Who caught someone in a lie so precisely they recited the exact timestamp, the weather that day, and what the liar was wearing?`,
  ],
  showmancer: [
    n => `Who wrote a love letter so intense the school principal called their parents and suggested "professional help"?`,
    n => `Who proposed to a summer camp crush on Day 2 with a ring made from a gum wrapper — and the camp counselor had to explain what "too fast" means?`,
    n => `Who created a fan account for someone they were dating and the person found it and broke up with them the same day?`,
    n => `Who slow-danced alone at prom to a fast song because their date hadn't arrived — and their date never came?`,
    n => `Who named their pet after their crush and the crush found out when they came over and the parrot screamed their name?`,
    n => `Who commissioned a portrait of themselves with someone they'd been on ONE date with and gave it to them as a "one-week anniversary" gift?`,
    n => `Who wrote their ex's name in the sand on a beach, filmed a dramatic crying video next to it, and it got reposted as a meme?`,
    n => `Who accidentally texted "I'm going to marry you someday" to the person it was about instead of to their best friend?`,
  ],
};

function _generateTruth(name) {
  const s = pStats(name);
  const a = arch(name);
  const pools = [];
  // Stat-based pools
  if (s.physical <= 4) pools.push(...TRUTH_POOLS.lowPhysical);
  if (s.mental <= 4) pools.push(...TRUTH_POOLS.lowMental);
  if (s.social <= 4) pools.push(...TRUTH_POOLS.lowSocial);
  if (s.social >= 7) pools.push(...TRUTH_POOLS.highSocial);
  if (s.strategic >= 7) pools.push(...TRUTH_POOLS.highStrategic);
  // Archetype pool
  if (TRUTH_POOLS[a]) pools.push(...TRUTH_POOLS[a]);
  // Fallback: always have options
  if (pools.length < 4) {
    pools.push(...TRUTH_POOLS.lowPhysical, ...TRUTH_POOLS.lowSocial);
  }
  const truthFn = pick(pools);
  const text = truthFn(name);
  const category = s.physical <= 4 ? 'physical weakness' : s.social >= 7 ? 'social scandal' : a;
  return { text, category, statBased: s.physical <= 4 || s.mental <= 4 || s.social <= 4 };
}

// ══════════════════════════════════════════════════════════════
// ARCHETYPE DECISION WEIGHTS
// ══════════════════════════════════════════════════════════════
const CONFESS_BASE = {
  mastermind: 0.55,       // calculates
  schemer: 0.25,          // ego
  hothead: 0.3,           // pride
  'challenge-beast': 0.35,// confident
  'social-butterfly': 0.8,// social capital
  'loyal-soldier': 0.75,  // duty
  wildcard: 0.5,          // coin flip
  'chaos-agent': 0.45,    // drama
  floater: 0.8,           // avoid attention
  underdog: 0.7,          // defiant pride
  hero: 0.7,              // honest
  villain: 0.15,          // dominance
  goat: 0.9,              // panic
  'perceptive-player': 0.5, // reads room
  showmancer: 0.6,        // vulnerability
};

function _decideConfessOrRefuse(name, fatigue, tribemates, roundNum, totalRounds) {
  const a = arch(name);
  const s = pStats(name);
  let prob = CONFESS_BASE[a] || 0.5;

  // Fatigue pushes toward confession
  prob += fatigue * 0.08;

  // Higher physical/endurance -> more willing to refuse (can handle stunts)
  prob -= (s.physical + s.endurance) * 0.015;

  // Higher bonds with tribemates -> confess for team
  let avgBond = 0;
  if (tribemates.length) {
    avgBond = tribemates.reduce((sum, t) => sum + getBond(name, t), 0) / tribemates.length;
  }
  prob += avgBond * 0.03;

  // Late rounds: mastermind refuses more, others confess more
  if (roundNum > 3) {
    if (a === 'mastermind') prob -= 0.15;
    else prob += 0.05;
  }

  // Showmancer with active showmance watching -> confess for vulnerability
  if (a === 'showmancer' && gs.showmances?.some(sm =>
    (sm.a === name || sm.b === name) && tribemates.includes(sm.a === name ? sm.b : sm.a)
  )) {
    prob += 0.2;
  }

  // Noise
  prob += noise(0.15);

  return Math.random() < Math.max(0.05, Math.min(0.95, prob)) ? 'confess' : 'refuse';
}

// ══════════════════════════════════════════════════════════════
// CONFESSION REACTION TEXT
// ══════════════════════════════════════════════════════════════
const CONFESSION_NARRATION = {
  confess: {
    goat: [
      (n, pr, truth) => `${n} blurted it out before ${host()} even finished reading. "${truth}" ${pr.Sub} turned bright red. "I panicked! I ALWAYS panic!"`,
      (n, pr, truth) => `${n}'s hand shot up. "IT WAS ME. ${truth.replace('Who ', 'I ')}" ${pr.Sub} covered ${pr.posAdj} face. "Can I take that back?" No.`,
      (n, pr, truth) => `${n} fell off ${pr.posAdj} chair. "I know it's me. Everyone knows it's me." ${pr.Sub} confessed before the question mark landed. "${truth}" Pure panic-confession.`,
      (n, pr, truth) => `"Oh no. Oh no oh no oh no." ${n} recognized the question immediately. ${pr.Sub} raised ${pr.posAdj} hand with the energy of someone surrendering. "That's me. Obviously."`,
    ],
    hero: [
      (n, pr, truth) => `${n} stood up straight. "Yes. That was me." ${truth.replace('Who ', pr.Sub + ' ')} Honest. Direct. Unapologetic.`,
      (n, pr, truth) => `${n} looked ${pr.posAdj} tribemates in the eye. "I'm not ashamed. ${truth.replace('Who ', 'I ')}" The tribe nodded. Respect.`,
      (n, pr, truth) => `"I'll own it," ${n} said calmly. "${truth.replace('Who ', 'I ')}" ${pr.Sub} sat back down. No drama. Just truth. The hero's way.`,
      (n, pr, truth) => `${n} stepped forward without hesitation. "That's my story and I'm not hiding from it." ${pr.Sub} confessed with the quiet dignity of someone who's made peace with their past.`,
    ],
    'social-butterfly': [
      (n, pr, truth) => `${n} laughed it off. "Okay FINE, yes. ${truth.replace('Who ', 'I ')}" ${pr.Sub} turned to ${pr.posAdj} tribe. "We've ALL done something weird, right? RIGHT?"`,
      (n, pr, truth) => `${n} sighed dramatically. "You got me. ${truth.replace('Who ', 'I ')}" ${pr.Sub} immediately started damage control, chatting up the nearest three people.`,
      (n, pr, truth) => `"Listen, it's not as bad as it sounds," ${n} began, already spinning the story. "${truth.replace('Who ', 'I ')}" By the end, half the tribe was laughing WITH ${pr.obj}. Social wizardry.`,
      (n, pr, truth) => `${n} raised ${pr.posAdj} hand like answering attendance. "Present and guilty." ${pr.Sub} shared the truth with a charming smile that made everyone forget to judge. Classic.`,
    ],
    underdog: [
      (n, pr, truth) => `${n} shrugged. "Yeah, so what? ${truth.replace('Who ', 'I ')}" The defiance in ${pr.posAdj} voice was electric. The tribe started clapping.`,
      (n, pr, truth) => `"You wanna embarrass me? I've been embarrassed my whole life." ${n} confessed with a grin. "${truth.replace('Who ', 'I ')}" Defiant pride.`,
      (n, pr, truth) => `${n} stood up slowly. "${truth.replace('Who ', 'I ')} And you know what? I'd do it again." The underdog owned it. The crowd loved it.`,
      (n, pr, truth) => `"Yeah, that's me," ${n} said, chin raised. "${truth.replace('Who ', 'I ')}" ${pr.Sub} looked around the studio. "Anyone else want to share? No? Just me being brave? Cool."`,
    ],
    'loyal-soldier': [
      (n, pr, truth) => `${n} sighed. "For the team." ${pr.Sub} confessed. "${truth.replace('Who ', 'I ')}" Duty over pride. Always.`,
      (n, pr, truth) => `"I'm not letting my tribe go down because of my ego." ${n} stepped forward. "${truth.replace('Who ', 'I ')}" The soldier's sacrifice.`,
      (n, pr, truth) => `${n} looked at ${pr.posAdj} tribemates, squared ${pr.posAdj} shoulders, and spoke. "${truth.replace('Who ', 'I ')}" For the team. Everything for the team.`,
      (n, pr, truth) => `"If confessing keeps us in this," ${n} said quietly, "then here goes." ${pr.Sub} told the truth. Not for ${pr.ref}. For the tribe.`,
    ],
    showmancer: [
      (n, pr, truth) => `${n} glanced at ${pr.posAdj} partner, took a deep breath, and confessed. "${truth.replace('Who ', 'I ')}" "I want you to know the real me." Vulnerability play. Devastating.`,
      (n, pr, truth) => `"I'm doing this because I trust you all." ${n} squeezed ${pr.posAdj} partner's hand and confessed. "${truth.replace('Who ', 'I ')}" The audience melted.`,
      (n, pr, truth) => `${n} locked eyes with ${pr.posAdj} showmance partner. "This is who I am." ${pr.Sub} confessed. "${truth.replace('Who ', 'I ')}" The vulnerability was real. So were the tears.`,
      (n, pr, truth) => `"I'd rather be honest with you than win any challenge." ${n} confessed the truth while looking at ${pr.posAdj} partner the entire time. Reality TV gold.`,
    ],
    _default: [
      (n, pr, truth) => `${n} raised ${pr.posAdj} hand. "${truth.replace('Who ', 'I ')}" The studio went quiet. Then ${host()} grinned. "That's a confession, folks!"`,
      (n, pr, truth) => `${n} stared at the floor for three seconds, then looked up. "${truth.replace('Who ', 'I ')}" Done. The truth is out.`,
      (n, pr, truth) => `"Fine. Yes." ${n} confessed. "${truth.replace('Who ', 'I ')}" ${pr.Sub} sat back down with the energy of someone who just defused a bomb.`,
      (n, pr, truth) => `${n} exhaled slowly. "${truth.replace('Who ', 'I ')}" The words hung in the studio air. ${host()}: "And THAT is what this show is about."`,
    ],
  },
  refuse: {
    villain: [
      (n, pr) => `${n} leaned back and smirked. "Spin the wheel." ${pr.Sub} wasn't afraid. ${pr.Sub} was daring them.`,
      (n, pr) => `"You think a little embarrassment scares me?" ${n} laughed. "I don't confess. I don't explain. SPIN IT."`,
      (n, pr) => `${n} crossed ${pr.posAdj} arms. "I'll take whatever the wheel gives me over giving you the satisfaction." Dominance. Pure dominance.`,
      (n, pr) => `${n} stared at ${host()} with dead eyes. "I don't play your little truth game." The studio temperature dropped three degrees.`,
    ],
    hothead: [
      (n, pr) => `"NO." ${n} slammed the podium. "I'm NOT telling you that. Spin the stupid wheel!"`,
      (n, pr) => `${n} turned red. "Over my dead body am I answering that." ${pr.Sub} pointed at the wheel. "DO IT."`,
      (n, pr) => `"You want the truth? HERE'S the truth." ${n} kicked ${pr.posAdj} chair. "I'D RATHER FIGHT A SHARK."`,
      (n, pr) => `${n}'s jaw clenched. ${pr.Sub} didn't speak for five seconds. Then: "Spin. The. Wheel." Each word a grenade.`,
    ],
    schemer: [
      (n, pr) => `${n} smirked. "Nice try. Wheel." ${pr.Sub} wasn't giving anyone leverage. Ever.`,
      (n, pr) => `"That information has value," ${n} said coolly. "And I don't give value away for free. Spin it."`,
      (n, pr) => `${n} examined ${pr.posAdj} fingernails. "I'll take the physical challenge." Not a trace of worry. All calculation.`,
      (n, pr) => `"Confessing is for people without plans," ${n} said. "I have plans." The wheel beckoned. ${pr.Sub} welcomed it.`,
    ],
    'challenge-beast': [
      (n, pr) => `${n} grinned. "Bring on the challenge." ${pr.Sub} cracked ${pr.posAdj} knuckles. "${pr.Sub === 'They' ? 'were' : 'was'} born for this."`,
      (n, pr) => `"Why would I confess when I can COMPETE?" ${n} was already stretching. The wheel was a gift, not a punishment.`,
      (n, pr) => `${n} stood up. "I came here to win challenges, not spill secrets. Let's go." The challenge beast was hungry.`,
      (n, pr) => `"Save the talking for the talkers," ${n} said. "I'll let my body do the answering." ${pr.Sub} eyed the wheel with anticipation, not fear.`,
    ],
    _default: [
      (n, pr) => `${n} shook ${pr.posAdj} head. "I'm not saying that. Spin the wheel." Defiant. Stubborn. Done.`,
      (n, pr) => `"Nope." ${n} crossed ${pr.posAdj} arms. "Whatever the wheel gives me, I'll take it."`,
      (n, pr) => `${n} looked at the wheel, looked at ${host()}, and made ${pr.posAdj} choice. "I refuse. Let's see what's behind door number random."`,
      (n, pr) => `"That's a hard no from me," ${n} said. The studio lights reflected off the spinning wheel. ${pr.Sub} didn't blink.`,
    ],
  },
};

// ══════════════════════════════════════════════════════════════
// REACTION TEXT
// ══════════════════════════════════════════════════════════════
const REACTION_TEXT = {
  sympathy: [
    (reactor, target, pr) => `${reactor} put a hand on ${target}'s shoulder. "Hey. Takes guts." Bond.`,
    (reactor, target, pr) => `${reactor} nodded quietly. "I've done worse. You're good." Genuine.`,
    (reactor, target, pr) => `${reactor} caught ${target}'s eye and gave a subtle thumbs up. Solidarity. No words needed.`,
    (reactor, target, pr) => `"That took courage," ${reactor} said to ${target}. "Respect." The bond was real.`,
  ],
  mockery: [
    (reactor, target, pr) => `${reactor} couldn't hold it in. A snort. Then full-body laughter. "${target}, REALLY?!" The whole tribe heard.`,
    (reactor, target, pr) => `${reactor} was CACKLING. Tears in ${pr.posAdj} eyes. "I'm sorry— I'm sorry—" ${pronouns(reactor).Sub} was not sorry. At all.`,
    (reactor, target, pr) => `"WAIT." ${reactor} held up a hand. "Say that again. Louder. For the people in the back." ${target} wanted to melt into the floor.`,
    (reactor, target, pr) => `${reactor} turned to the camera with the biggest grin. "Did y'all just hear that? ${target}?! I can't—" ${pronouns(reactor).Sub} literally doubled over.`,
    (reactor, target, pr) => `${reactor} mimicked ${target}'s confession back at them in a sing-song voice. The gallery was howling. ${target} stood there, mortified.`,
    (reactor, target, pr) => `"That's the funniest thing I've ever heard on this show," ${reactor} wheezed. "Oh, ${target}. Oh no. That's SO bad."`,
  ],
  shock: [
    (reactor, target, pr) => `${reactor}'s jaw dropped. "Wait, WHAT? ${target}?!" Genuine shock. Nobody saw that coming.`,
    (reactor, target, pr) => `${reactor} blinked three times. "I need a minute to process that." Stunned.`,
    (reactor, target, pr) => `"NO WAY." ${reactor} turned to the camera. "Did everyone else hear what ${target} just said?!"`,
    (reactor, target, pr) => `${reactor} stared at ${target} like ${pronouns(reactor).sub} was seeing them for the first time. "You... really?"`,
  ],
  respect: [
    (reactor, target, pr) => `${reactor} gave ${target} a firm nod. "That's real. I respect that."`,
    (reactor, target, pr) => `"You didn't have to share that," ${reactor} said. "But you did. That says something."`,
    (reactor, target, pr) => `${reactor} stood up and clapped. Not mocking. Genuine. "${target}'s got more spine than half this cast."`,
    (reactor, target, pr) => `${reactor} locked eyes with ${target}. "I see you different now. Better." Earned respect through vulnerability.`,
  ],
};

function _getReactionType(reactorName, targetName) {
  const a = arch(reactorName);
  const bond = getBond(reactorName, targetName);
  if (isVillain(reactorName) && canScheme(reactorName)) return 'mockery';
  if (isNice(reactorName)) return bond >= 0 ? 'sympathy' : 'respect';
  // Neutral
  if (bond >= 3) return 'sympathy';
  if (bond <= -3) return 'mockery';
  return Math.random() < 0.5 ? 'shock' : 'respect';
}

// ══════════════════════════════════════════════════════════════
// STUNT NARRATION TEXT
// ══════════════════════════════════════════════════════════════
const STUNT_PASS_TEXT = {
  'shark-splash': [
    (n, pr) => `${n} hit the water and SWAM. The sharks circled. ${pr.Sub} didn't slow down. Out the other side, dripping, gasping, ALIVE.`,
    (n, pr) => `${n} dove in without hesitation. The shark's fin brushed ${pr.posAdj} leg. ${pr.Sub} didn't scream. ${pr.Sub} finished. The studio erupted.`,
    (n, pr) => `${n} thrashed through the shark tank like a torpedo. Fang — the biggest shark — actually moved OUT of the way. Even the shark respected that.`,
    (n, pr) => `"GO GO GO!" The crowd chanted as ${n} powered through the tank. The sharks seemed confused. Nobody usually finishes this fast. ${n} climbed out, chest heaving. "I hate water."`,
  ],
  'slime-balance': [
    (n, pr) => `Green slime poured from above. ${n} wobbled, steadied, wobbled again — held it. Arms out, feet planted. The beam didn't beat ${pr.obj}.`,
    (n, pr) => `Slime everywhere. ${n}'s shoes were sliding. ${pr.posAdj} eyes were burning. But ${pr.sub} stayed UP. Sheer willpower. The beam accepted its defeat.`,
    (n, pr) => `${n} treated the slime like rain. Ignored it. Focused. Breathed. The beam was ${pr.posAdj} domain now. Not a single wobble after the first dump.`,
    (n, pr) => `"Is that all you've got?!" ${n} shouted through a face full of slime. ${pr.Sub} held the beam through three consecutive dumps. The crew ran out of slime before ${n} ran out of balance.`,
  ],
  'ice-bath': [
    (n, pr) => `${n} lowered into the ice and went SILENT. Eyes closed. Breathing steady. When the timer rang, ${pr.sub} stood up calmly. "That was... refreshing."`,
    (n, pr) => `Teeth chattering, lips blue, ${n} held on. Every second was agony. The timer rang. ${pr.Sub} climbed out and collapsed. But ${pr.sub} passed.`,
    (n, pr) => `${n} screamed for the first five seconds, then went eerily quiet. The entire studio watched in silence. When the buzzer hit, ${pr.sub} was still conscious. Barely. But still in.`,
    (n, pr) => `${n} gripped the sides of the tub until ${pr.posAdj} knuckles went white. The ice shifted and cracked around ${pr.obj}. The timer felt eternal. But when it rang, ${n} raised a frozen fist. Victory. Cold, painful victory.`,
  ],
  'gross-food': [
    (n, pr) => `${n} gagged on the first dish. Powered through the second. The third — mystery meat surprise — went down without a flinch. "Done."`,
    (n, pr) => `"Is this... eyeball?" ${n} stared at the plate. Then ate it. Then ate the next one. Then the next. No gag reflex. No mercy. No leftovers.`,
    (n, pr) => `${n} ate all three courses with a poker face that would make a professional gambler jealous. "Honestly? The third one was almost good."`,
    (n, pr) => `The first dish made ${n}'s eyes water. The second made ${pr.posAdj} hands shake. The third made the cameraman dry-heave. ${n} ate them all. "My compliments to the chef." Chef: "THAT WASN'T ME."`,
  ],
  'obstacle-sprint': [
    (n, pr) => `${n} tore through the course like it owed ${pr.obj} money. Wall climb, rope swing, tunnel crawl — all in under 40 seconds.`,
    (n, pr) => `${n} stumbled once, recovered, and FLEW through the remaining obstacles. The clock stopped with seconds to spare.`,
    (n, pr) => `"MOVE MOVE MOVE!" ${n} screamed at ${pr.ref}, attacking each obstacle like a personal enemy. The sprint was a blur of limbs and determination.`,
    (n, pr) => `${n} parkoured the first wall, vaulted the second, and army-crawled the tunnel section faster than anyone thought possible. "Is there a harder version?"`,
  ],
  'buzzer-hold': [
    (n, pr) => `The voltage climbed. ${n}'s hands trembled. ${pr.Sub} held on. Every muscle tensed. The buzzer rang. ${n} let go and fell backward. Survived.`,
    (n, pr) => `${n} gritted ${pr.posAdj} teeth through the escalating shocks. By the end, ${pr.posAdj} hair was standing up. But ${pr.sub} never let go.`,
    (n, pr) => `"Mind over matter. Mind over matter." ${n} chanted through the pain. The voltage peaked. ${pr.Sub} screamed. But ${pr.sub} held. The mind won.`,
    (n, pr) => `${n}'s grip strength was tested at voltage levels the producers called "maybe too high." ${pr.Sub} held on anyway. The interns started taking notes.`,
  ],
  'shark-gauntlet': [
    (n, pr) => `The balance beam was two inches wide and thirty feet above the shark tank. ${n} crossed it. No harness. No net. Just feet and faith.`,
    (n, pr) => `${n} walked the shark gauntlet beam like it was a sidewalk. Below, Fang breached the surface hungrily. ${pr.Sub} didn't look down. Not once.`,
    (n, pr) => `Halfway across, the beam started SHAKING. ${n} dropped to ${pr.posAdj} knees, steadied, and crawled the rest. Undignified? Yes. Alive? Also yes.`,
    (n, pr) => `${n} crossed the beam above the shark tank in seventeen seconds flat. The sharks circled in confusion. Nobody crosses that fast. ${n} was already climbing down the other side.`,
  ],
  'full-slime': [
    (n, pr) => `The slime flood rose to ${n}'s waist. Then chest. Then chin. ${pr.Sub} tilted ${pr.posAdj} head back, breathed through ${pr.posAdj} nose, and HELD. Ninety seconds of green hell. Survived.`,
    (n, pr) => `${n} stood in the slime like a statue. It was thick. It was warm. It smelled like expired pudding. ${pr.Sub} didn't move. The timer rang. ${pr.Sub} waded out, slime dripping, dignity... present.`,
    (n, pr) => `"This is disgusting." ${n} stated it as fact. Then ${pr.sub} endured it as fact. Ninety seconds. Not a flinch. The slime lost.`,
    (n, pr) => `The slime flood was relentless. ${n} closed ${pr.posAdj} eyes, clenched ${pr.posAdj} fists, and mentally went somewhere else entirely. When the buzzer rang, ${pr.sub} opened ${pr.posAdj} eyes. "Is it over? Good." Still standing.`,
  ],
  'nightmare-combo': [
    (n, pr) => `Sharks below. Slime above. Obstacles everywhere. ${n} survived ALL OF IT. The studio couldn't believe it. Neither could ${n}.`,
    (n, pr) => `The Nightmare Combo threw everything at ${n}. ${pr.Sub} threw everything back. Slime in ${pr.posAdj} eyes, sharks at ${pr.posAdj} feet, walls in ${pr.posAdj} way — none of it mattered. ${n} is BUILT DIFFERENT.`,
    (n, pr) => `${n} emerged from the Nightmare Combo looking like a creature from a swamp monster movie. But ${pr.sub} emerged STANDING. That's all that matters.`,
    (n, pr) => `The combination of challenges should have been impossible. ${n} made it look merely excruciating. Through sharks, slime, and obstacles — battered, bruised, but unbroken.`,
  ],
};

const STUNT_FAIL_TEXT = {
  'shark-splash': [
    (n, pr) => `${n} jumped in. Saw the shark. Jumped OUT. Three seconds total. "NOPE. NOPE NOPE NOPE." Failed.`,
    (n, pr) => `${n} was halfway across when Fang surfaced. ${pr.Sub} froze. The shark didn't. ${n} was pulled out by the safety team. Done.`,
    (n, pr) => `${n} belly-flopped into the tank so hard it stunned ${pr.obj} for three seconds. Long enough for the sharks to circle. The producers called it. "That's a fail."`,
    (n, pr) => `${n} made it two strokes before the shark bumped ${pr.posAdj} leg. The scream could be heard in the parking lot. Safety pulled ${pr.obj} out. Challenge over.`,
  ],
  'slime-balance': [
    (n, pr) => `The first dump of slime hit ${n} square in the face. ${pr.Sub} slipped immediately. Arms windmilled. SPLAT. Off the beam. Done.`,
    (n, pr) => `${n} lasted eight seconds. The slime was too thick. The beam was too narrow. Physics won. ${n} did not.`,
    (n, pr) => `${n} tried to wipe the slime from ${pr.posAdj} eyes. Bad move. The weight shift toppled ${pr.obj} off the beam in slow motion. The audience winced collectively.`,
    (n, pr) => `Green slime cascaded down. ${n}'s left foot slid. Then the right. Then gravity. ${pr.Sub} hit the mat with the sound of a wet sponge dropped from the ceiling.`,
  ],
  'ice-bath': [
    (n, pr) => `${n} lasted twelve seconds. "NO! NO NO NO!" ${pr.Sub} launched out of the ice bath like a champagne cork. Failed.`,
    (n, pr) => `${n}'s body rejected the ice bath on a cellular level. ${pr.Sub} tried to stay. ${pr.Sub} could not stay. Out in under twenty seconds.`,
    (n, pr) => `${n} went in confident. Came out screaming. The ice bath timer had barely started. "I thought I was tough. I was wrong."`,
    (n, pr) => `${n} entered the ice bath. ${n} immediately exited the ice bath. The elapsed time was measured in disappointment.`,
  ],
  'gross-food': [
    (n, pr) => `${n} gagged on dish one. Retched on dish two. Didn't make it to dish three. The bucket arrived just in time.`,
    (n, pr) => `"What IS that?" ${n} poked the first dish. Took one bite. The color drained from ${pr.posAdj} face. "I can't. I physically can't." Failed.`,
    (n, pr) => `${n} made it through two courses before the third one — fermented squid surprise — broke ${pr.obj}. The sound ${pr.sub} made haunts the audio engineer to this day.`,
    (n, pr) => `${n} stared at the plate. The plate stared back. ${pr.Sub} lifted the fork. Smelled it. Set the fork down. "I choose death." ${pr.Sub} chose elimination instead.`,
  ],
  'obstacle-sprint': [
    (n, pr) => `${n} hit the first wall and bounced off. Literally. The clock ran out while ${pr.sub} was still on obstacle two of seven. Failed.`,
    (n, pr) => `${n} tripped on the rope swing, slammed into the tunnel entrance, and got stuck in the crawl section. The buzzer was mercy.`,
    (n, pr) => `${n} ran the course like ${pr.sub} was running through quicksand. Every obstacle took twice as long as it should. The clock didn't care about effort. Time's up.`,
    (n, pr) => `The wall climb took ${n} forty seconds alone. The rest of the course was impossible to complete in the remaining time. ${pr.Sub} tried anyway. The buzzer disagreed.`,
  ],
  'buzzer-hold': [
    (n, pr) => `The voltage hit level three. ${n}'s hands spasmed open. The buzzer fell. "I can't feel my fingers." Failed.`,
    (n, pr) => `${n} held on until the shocks reached ${pr.posAdj} threshold. Then ${pr.posAdj} body overruled ${pr.posAdj} mind. Hands open. Buzzer dropped. Over.`,
    (n, pr) => `"I GOT THIS I GOT THIS I—" ${n} dropped the buzzer. ${pr.Sub} did not, in fact, got this. The voltage won.`,
    (n, pr) => `${n}'s grip weakened at the fourth voltage level. ${pr.Sub} watched ${pr.posAdj} own fingers betray ${pr.obj} one by one. The buzzer clattered to the ground. Failed.`,
  ],
  'shark-gauntlet': [
    (n, pr) => `${n} looked down. Big mistake. The sharks were circling. ${pr.Sub} froze. Then wobbled. Then fell. SPLASH. The safety divers earned their pay.`,
    (n, pr) => `The beam swayed. ${n} grabbed for balance and found nothing but air. The fall was short. The sharks were close. The safety team was faster.`,
    (n, pr) => `${n} made it three-quarters across before the beam shook. One foot slipped. Then the other. ${pr.Sub} clung to the beam for five seconds before dropping into the tank. Fang was waiting.`,
    (n, pr) => `${n} tried the confident approach. Walked fast. Didn't look down. Stepped on a wet spot. The shark tank claimed another contestant.`,
  ],
  'full-slime': [
    (n, pr) => `The slime hit ${n}'s mouth. ${pr.Sub} gagged. The slime hit ${pr.posAdj} eyes. ${pr.Sub} panicked. ${pr.Sub} went down thirty seconds in. The slime didn't care.`,
    (n, pr) => `${n} underestimated the slime. It was thick. It was rising. It was everywhere. At forty seconds, ${pr.sub} sank to ${pr.posAdj} knees. Failed.`,
    (n, pr) => `"I'm fine. I'm fine. I'm—" ${n} was not fine. The slime flood overwhelmed ${pr.obj} at the one-minute mark. Down.`,
    (n, pr) => `${n} stood strong for the first minute. The second thirty seconds brought the slime to ${pr.posAdj} chin. ${pr.Sub} tried to breathe. Panicked. Went under. Safety pulled ${pr.obj} out.`,
  ],
  'nightmare-combo': [
    (n, pr) => `The Nightmare Combo ate ${n} alive. Sharks, slime, obstacles — ${pr.sub} failed at everything simultaneously. A historic defeat.`,
    (n, pr) => `${n} made it through the sharks only to be buried by slime. Got up from the slime only to eat the obstacle wall. Triple failure. The combo earned its name.`,
    (n, pr) => `${n} tried. ${n} really tried. But the Nightmare Combo is designed to break people, and it broke ${pr.obj}. No shame. Everyone breaks eventually.`,
    (n, pr) => `The obstacles tripped ${n}. The slime buried ${pr.obj}. The sharks... well, ${pr.sub} didn't even make it to the sharks. The Nightmare Combo is undefeated for a reason.`,
  ],
};

// ══════════════════════════════════════════════════════════════
// FORCED SECRET REVEAL TEXT (when eliminated)
// ══════════════════════════════════════════════════════════════
const FORCED_REVEAL_TEXT = [
  (n, truth, h) => `${h} grabbed the mic. "Since ${n} is out, let's reveal the truth anyway!" The screen lit up: "${truth}" ${n}'s face went white.`,
  (n, truth, h) => `"OH, and one more thing—" ${h} pulled out a card. "The truth ${n} refused to share: ${truth}" The gallery ERUPTED.`,
  (n, truth, h) => `${h} pointed at the big screen. "Roll it." The truth appeared in giant letters: "${truth}" ${n} buried ${pronouns(n).posAdj} face in ${pronouns(n).posAdj} hands from the heckler gallery.`,
  (n, truth, h) => `"You didn't want to confess? That's okay!" ${h}'s grin was evil. "We'll do it FOR you." The truth flashed: "${truth}" The studio gasped.`,
];

// ══════════════════════════════════════════════════════════════
// SOCIAL EVENT POOLS
// ══════════════════════════════════════════════════════════════
const SOCIAL_EVENT_TYPES = [
  'showmance-moment', 'rivalry-flare', 'alliance-whisper', 'heckler-outburst',
  'secret-weaponize', 'sympathy-bond', 'paranoia-seed', 'underdog-rally',
];

const SOCIAL_TEXT = {
  'showmance-moment': [
    (a, b) => `Between rounds, ${a} squeezed ${b}'s hand under the podium. "We'll get through this." A quiet moment in the chaos.`,
    (a, b) => `${a} caught ${b}'s eye across the studio. A look. A nod. Worth a thousand words. The cameras caught everything.`,
    (a, b) => `"Are you okay?" ${a} whispered to ${b} during a commercial break. "I am now," ${b} whispered back. The mic picked it all up.`,
    (a, b) => `${a} and ${b} shared a look that lasted exactly two seconds and said approximately everything. The audience shipped it HARD.`,
  ],
  'rivalry-flare': [
    (a, b) => `${a} pointed at ${b} across the studio. "YOUR tribe is going DOWN." ${b}: "Bring it." The temperature spiked.`,
    (a, b) => `${a} laughed when ${b}'s tribe lost a point. ${b} heard it. Remembered it. Filed it away.`,
    (a, b) => `"You call that a confession?" ${a} heckled ${b} from across the set. "I've seen braver kindergarteners." ${b}'s jaw tightened.`,
    (a, b) => `${a} and ${b} locked eyes during the stunt. No words. Just pure, seething competition. This was personal now.`,
  ],
  'alliance-whisper': [
    (a, b) => `${a} leaned over during a break. "If we lose, we vote together. Deal?" ${b} nodded. Alliance forged in chaos.`,
    (a, b) => `"We need to talk after this," ${a} muttered to ${b}. "About who goes." A strategic conversation disguised as casual chat.`,
    (a, b) => `${a} and ${b} exchanged a knowing glance. They'd been planning this conversation for two episodes. The game within the game.`,
    (a, b) => `"You and me, final five?" ${a} whispered to ${b} between rounds. ${b}: "Make it final three." Deal.`,
  ],
  'heckler-outburst': [
    (heckler, target) => `From the gallery, ${heckler} shouted: "YOU CAN'T DO IT, ${target}! I COULDN'T AND NEITHER CAN YOU!" Eliminated players make the worst hecklers.`,
    (heckler, target) => `${heckler} started a slow clap from the gallery. "Come ON, ${target}. Show us what failure looks like!" The crowd shifted uncomfortably.`,
    (heckler, target) => `"HEY ${target}!" ${heckler} yelled from the gallery. "THE SHARK TANK MISSES YOU! COME VISIT!" ${target} tried to ignore it. Failed.`,
    (heckler, target) => `${heckler} leaned forward in the gallery with a megaphone (where did ${pronouns(heckler).sub} get a megaphone?). "SPIN THE WHEEL AGAIN! I WANT TO SEE ${target} SUFFER!" Security considered intervening.`,
  ],
  'secret-weaponize': [
    (schemer, victim) => `${schemer} was taking notes. Literally. Every confession went into a mental vault for later use. ${victim}'s secret? Filed under "leverage."`,
    (schemer, victim) => `${schemer} whispered to a tribemate: "Did you hear what ${victim} said? That's... useful." The scheming never stops.`,
    (schemer, victim) => `${schemer}'s eyes narrowed when ${victim} confessed. Not sympathy. Recognition. "I can use that." The villain's mind was always working.`,
    (schemer, victim) => `${schemer} committed ${victim}'s confession to memory. Not because ${pronouns(schemer).sub} cared. Because secrets are currency, and ${schemer} just got richer.`,
  ],
  'sympathy-bond': [
    (defender, victim) => `${defender} stepped between ${victim} and the hecklers. "Leave them alone. They were honest. That takes more guts than any stunt."`,
    (defender, victim) => `"Hey." ${defender} sat next to ${victim} during the break. "You did the right thing. Don't let anyone tell you otherwise."`,
    (defender, victim) => `${defender} shot a look at anyone laughing at ${victim}'s confession. The laughing stopped. "We protect our own," ${defender} said. No further explanation needed.`,
    (defender, victim) => `${defender} wrapped an arm around ${victim}'s shoulders. "That confession was brave. Braver than anything the wheel could throw at you." The bond deepened.`,
  ],
  'paranoia-seed': [
    (perceiver, target) => `${perceiver} noticed something. ${target}'s reaction to that last confession was... off. Too calm? Too rehearsed? Something wasn't right.`,
    (perceiver, target) => `"Does anyone else think ${target} was lying?" ${perceiver} whispered. "That confession felt scripted." Doubt. Planted. Growing.`,
    (perceiver, target) => `${perceiver} watched ${target}'s body language during the last round. Crossed arms. Averted eyes. "Something's up with ${target}. I'm watching."`,
    (perceiver, target) => `${perceiver}'s gut said ${target} was playing an angle. No proof yet. Just instinct. And instinct was rarely wrong for this one.`,
  ],
  'underdog-rally': [
    (underdog, tribe) => `${underdog} stood up in front of the tribe. "We're not done yet. We're NOT done." The tribe rallied. Somehow, the underdog's words hit harder than any pep talk.`,
    (underdog, tribe) => `"They think we're finished?" ${underdog} looked around at ${pronouns(underdog).posAdj} beaten tribe. "We're just getting started." Underdog energy is contagious.`,
    (underdog, tribe) => `${underdog} refused to sit down after the last round. "I've been counted out my whole life. Look where I'm standing." The tribe drew strength from the defiance.`,
    (underdog, tribe) => `"One more round. That's all I'm asking." ${underdog}'s voice cracked but didn't break. "One more round and we turn this around." The tribe believed it. Against all odds.`,
  ],
};

// ══════════════════════════════════════════════════════════════
// WHEEL SPIN NARRATION
// ══════════════════════════════════════════════════════════════
const WHEEL_SPIN_TEXT = [
  (n, stunt, h) => `${h} grabbed the wheel. "Let's see what fate has in store for ${n}!" CLICK CLICK CLICK CLICK... it slowed... and landed on: ${stunt.name}. ${h}: "Oh, that's a good one."`,
  (n, stunt, h) => `The wheel spun. The studio held its breath. Click. Click. Click... ${stunt.name}. ${n}'s face changed colors. ${h}: "Better you than me!"`,
  (n, stunt, h) => `${h}: "Spin! That! Wheel!" The crowd chanted along. The arrow slowed... slowed... stopped on ${stunt.name}. ${h} whistled. "Ooh. Rough draw."`,
  (n, stunt, h) => `CLICK CLICK CLICK — the wheel was merciless. It landed on ${stunt.name}. ${n} stared at the board. ${h}: "The wheel has spoken! And the wheel says SUFFER."`,
  (n, stunt, h) => `The wheel blurred into a candy-colored circle of doom. When it stopped, the arrow pointed at ${stunt.name}. ${h} leaned in. "You know what that means." ${n} knew exactly what it meant.`,
  (n, stunt, h) => `${h} spun the wheel with theatrical flair. The studio lights reflected off the spinning surface. CLICK. CLICK. Click... ${stunt.name}. The audience gasped. ${h}: "LOVE IT."`,
];

// ══════════════════════════════════════════════════════════════
// HECKLER TEXT (from eliminated gallery)
// ══════════════════════════════════════════════════════════════
const HECKLER_TEXT = [
  (heckler, target) => `"COME JOIN US, ${target}! THE GALLERY HAS SNACKS!" — ${heckler}`,
  (heckler, target) => `"I BELIEVE IN YOU! ...JUST KIDDING! FAIL!" — ${heckler} from the peanut gallery`,
  (heckler, target) => `"${target} IS GOING DOWN! I CAN FEEL IT!" — ${heckler}, way too excited about someone else's suffering`,
  (heckler, target) => `"HEY ${target}! YOUR SECRET WAS WORSE THAN MINE!" — ${heckler}, still salty`,
  (heckler, target) => `"SHARK! SHARK! SHARK!" — ${heckler} started a chant. It caught on.`,
  (heckler, target) => `${heckler} held up a score card reading "2/10" from the gallery. Nobody asked for scores. ${heckler} gave them anyway.`,
];

// ══════════════════════════════════════════════════════════════
// ATMOSPHERIC FLAVOR TEXT (escalating chaos)
// ══════════════════════════════════════════════════════════════
const FLAVOR_TEXT = {
  early: [
    `LIVE FROM STUDIO 13 — the lights are bright, the secrets are dark, and the sharks are HUNGRY.`,
    `Producer's note: "Keep cameras on their faces. Every twitch. Every blink."`,
    `The studio audience shifts nervously. They signed waivers for this. They're starting to understand why.`,
    `A spotlight sweeps the set. Someone in the audience coughs. The tension is thick enough to cut.`,
    `The shark tank bubbles ominously in the background. Fang circles. Fang always circles.`,
  ],
  mid: [
    `Audience member faints in row 3. Medical is on it. The show continues.`,
    `Shark handler over radio: "Fang has NOT been fed today. Repeat: Fang is HUNGRY."`,
    `The studio lights flicker. A producer somewhere is having a great time. A different producer is calling their lawyer.`,
    `The confession counter hits double digits. The audience has stopped gasping. They're numb now.`,
    `A camera operator whispers to another: "Are we legally allowed to air this?" The other shrugs.`,
    `The slime budget is three times over. Nobody is stopping the spending.`,
  ],
  late: [
    `The intern just quit. Third one this episode. The fourth is considering it.`,
    `Legal department on line 2. ${host()} is ignoring line 2. Also lines 3 through 7.`,
    `Security is escorting a heckler — wait, that IS a contestant. Never mind. Carry on.`,
    `The studio lights are strobing. Nobody is controlling them anymore. They've achieved sentience.`,
    `The shark tank water has turned green. Nobody knows why. Nobody is investigating.`,
    `A producer screams into a walkie: "WE'RE ON TAKE ONE AND THIS IS ALL REAL." It is.`,
    `The audience has gone from shocked to delighted to concerned to strangely peaceful. This is the arc of Truth or Shark.`,
    `Somewhere, an insurance company is drafting a strongly-worded letter. ${host()} is already shredding it.`,
  ],
};

function _getFlavorText(roundNum, totalRounds) {
  if (roundNum <= 2) return pick(FLAVOR_TEXT.early);
  if (roundNum <= Math.ceil(totalRounds * 0.6)) return pick(FLAVOR_TEXT.mid);
  return pick(FLAVOR_TEXT.late);
}

// ══════════════════════════════════════════════════════════════
// HOST COMMENTARY
// ══════════════════════════════════════════════════════════════
const HOST_INTRO_TEXT = [
  (h, names) => `${h} stepped into the spotlight. "Welcome to TRUTH... OR... SHARK!" The studio roared. "Today, ${names} face their deepest secrets — or their worst nightmares. Confess the truth, or face the WHEEL." He gestured to the massive wheel behind him. "And below the wheel..." The camera panned down to the bubbling shark tank. "...motivation."`,
  (h, names) => `"LADIES AND GENTLEMEN!" ${h}'s voice echoed through the neon-lit studio. "It's time for the game show where honesty is the SECOND-best policy!" He winked. "First-best? Don't get eliminated." The shark tank gurgled ominously. "Today: ${names}. Secrets. Stunts. Sharks. Let's GO."`,
  (h, names) => `${h} appeared from behind the wheel in a burst of studio fog. "Truth or Shark! The only game show where telling the truth hurts your pride, and lying hurts your BODY." He spread his arms. "Tonight: ${names}. One tribe confesses. The others survive. Let's see who breaks first."`,
  (h, names) => `The studio lights blazed to life. ${h} stood center stage, silhouetted against the spinning wheel. "You all signed the waivers. You all know the rules. Confess... or face the consequences." He turned to the shark tank. Fang surfaced. ${h} grinned. "Ready? Neither am I. That's what makes it fun."`,
];

// ══════════════════════════════════════════════════════════════
// SIMULATION
// ══════════════════════════════════════════════════════════════
export function simulateTruthOrShark(ep) {
  const tribes = gs.tribes.filter(t => t.members.filter(m => gs.activePlayers.includes(m)).length >= 2);
  if (tribes.length < 2) return;

  const tribeMembers = tribes.map(t => ({
    name: t.name,
    color: tribeColor(t.name),
    members: t.members.filter(m => gs.activePlayers.includes(m)),
  }));

  // Init camp events per tribe
  for (const t of tribeMembers) {
    const key = t.name.toLowerCase();
    if (!ep.campEvents) ep.campEvents = {};
    if (!ep.campEvents[key]) ep.campEvents[key] = { pre: [], post: [] };
  }

  if (!ep.chalMemberScores) ep.chalMemberScores = {};
  const allActive = tribeMembers.flatMap(t => t.members);
  allActive.forEach(n => { ep.chalMemberScores[n] = 0; });

  // Wheel state — start with all stunts, remove easiest after each round
  const wheelStunts = [...STUNTS];
  const removedStunts = [];
  const fatigue = {};
  allActive.forEach(n => { fatigue[n] = 0; });
  const eliminated = [];
  const hecklerGallery = [];
  const rounds = [];

  // Build player order: round-robin across ALL tribes, skip dead tribes
  const tribeQueues = {};
  tribeMembers.forEach(t => { tribeQueues[t.name] = [...t.members]; });

  const usedTruths = new Set();

  let roundNum = 0;
  let currentTribeIdx = Math.floor(Math.random() * tribeMembers.length);
  const tribeElimCounts = {};
  tribeMembers.forEach(t => { tribeElimCounts[t.name] = 0; });

  // Continue until only one tribe has members standing (safety cap at 200)
  while (roundNum < 200) {
    // Count alive tribes
    const aliveTribes = tribeMembers.filter(t =>
      t.members.some(m => !eliminated.some(e => e.player === m))
    );
    if (aliveTribes.length <= 1) break;

    // Skip dead tribes in rotation
    let skipCheck = 0;
    while (skipCheck < tribeMembers.length) {
      currentTribeIdx = currentTribeIdx % tribeMembers.length;
      const t = tribeMembers[currentTribeIdx];
      if (t.members.some(m => !eliminated.some(e => e.player === m))) break;
      currentTribeIdx++;
      skipCheck++;
    }
    if (skipCheck >= tribeMembers.length) break;

    roundNum++;
    const tribe = tribeMembers[currentTribeIdx];
    // Other tribes = all tribes except current (for social events, reactions)
    const otherTribes = tribeMembers.filter(t => t.name !== tribe.name);
    const otherTribe = { name: '_others', members: otherTribes.flatMap(t => t.members), color: '#fff' };

    // Pick target player from this tribe (who hasn't been eliminated)
    const alive = tribe.members.filter(m => !eliminated.some(e => e.player === m));
    if (alive.length === 0) break;

    // Round-robin from queue
    let target = tribeQueues[tribe.name].shift();
    while (target && eliminated.some(e => e.player === target)) {
      target = tribeQueues[tribe.name].shift();
    }
    if (!target) {
      // Refill queue
      tribeQueues[tribe.name] = alive.filter(m => !eliminated.some(e => e.player === m));
      target = tribeQueues[tribe.name].shift();
    }
    if (!target) break;

    // Re-add to end of queue
    tribeQueues[tribe.name].push(target);

    // Generate truth
    let truth = _generateTruth(target);
    let attempts = 0;
    while (usedTruths.has(truth.text) && attempts < 20) {
      truth = _generateTruth(target);
      attempts++;
    }
    usedTruths.add(truth.text);

    const round = {
      round: roundNum,
      truthOwner: target,
      tribe: tribe.name,
      tribeColor: tribe.color,
      truth,
      decision: null,
      confession: null,
      stuntPlayer: null,
      wheelSpin: null,
      stuntResult: null,
      elimination: null,
      revealedAnyway: false,
      resentment: null,
      socialEvents: [],
      hecklerEvents: [],
      flavorText: _getFlavorText(roundNum, allActive.length * 2),
    };

    // DECISION — the truth owner decides whether to confess
    const tribemates = alive.filter(m => m !== target);
    const decision = _decideConfessOrRefuse(target, fatigue[target] || 0, tribemates, roundNum, allActive.length * 2);
    round.decision = decision;

    if (decision === 'confess') {
      // ── CONFESSION ──
      ep.chalMemberScores[target] = (ep.chalMemberScores[target] || 0) + 3;
      popDelta(target, -1);

      const reactors = [...alive.filter(m => m !== target), ...otherTribe.members.filter(m => !eliminated.some(e => e.player === m))];
      const shuffled = reactors.sort(() => Math.random() - 0.5).slice(0, Math.min(3, reactors.length));
      const reactions = [];

      for (const reactor of shuffled) {
        const type = _getReactionType(reactor, target);
        const textPool = REACTION_TEXT[type];
        const text = pick(textPool)(reactor, target, pronouns(reactor));

        let bondDelta = 0;
        if (type === 'sympathy') { bondDelta = 0.5; addBond(reactor, target, 0.5); }
        else if (type === 'mockery') { bondDelta = -0.5; addBond(reactor, target, -0.5); popDelta(reactor, -1); }
        else if (type === 'respect') { bondDelta = 0.25; addBond(reactor, target, 0.25); }
        else { bondDelta = 0; }

        reactions.push({ player: reactor, type, text, bondDelta });
      }

      const a = arch(target);
      const confessPool = CONFESSION_NARRATION.confess[a] || CONFESSION_NARRATION.confess._default;
      const confessText = pick(confessPool)(target, pronouns(target), truth.text);

      round.confession = { popLoss: -1, reactions, text: confessText };

      const campKey = tribe.name.toLowerCase();
      ep.campEvents[campKey].post.push({
        type: 'truth-confession',
        players: [target, ...shuffled],
        badgeText: `${target} confessed a secret during Truth or Shark`,
        badgeClass: 'badge-info',
      });

    } else {
      // ── REFUSAL → RANDOM TRIBE MEMBER DOES THE STUNT ──
      const a = arch(target);
      const refusePool = CONFESSION_NARRATION.refuse[a] || CONFESSION_NARRATION.refuse._default;
      round.refusalText = pick(refusePool)(target, pronouns(target));

      // Pick random alive tribe member for the stunt (could be anyone, including the refuser)
      const stuntPlayer = pick(alive);
      round.stuntPlayer = stuntPlayer;

      // Spin the wheel
      const stunt = pick(wheelStunts);
      const spinText = pick(WHEEL_SPIN_TEXT)(stuntPlayer, stunt, host());
      round.wheelSpin = { stuntName: stunt.name, stuntId: stunt.id, difficulty: stunt.difficulty, spinText, icon: stunt.icon, stuntIdx: STUNTS.findIndex(s => s.id === stunt.id) };

      // Resolve stunt using the STUNT PLAYER's stats (not the truth owner)
      const s = pStats(stuntPlayer);
      const primaryVal = s[stunt.primary] || 5;
      const secondaryVal = s[stunt.secondary] || 5;
      let score;
      if (stunt.id === 'nightmare-combo') {
        score = ((primaryVal + s.endurance) / 2) * 0.6 + secondaryVal * 0.4 + noise(2.5);
      } else {
        score = primaryVal * 0.6 + secondaryVal * 0.4 + noise(2.5);
      }
      const threshold = stunt.difficulty + (fatigue[stuntPlayer] || 0) * 1.5;
      const passed = score > threshold;

      if (passed) {
        fatigue[stuntPlayer] = (fatigue[stuntPlayer] || 0) + 1;
        ep.chalMemberScores[stuntPlayer] = (ep.chalMemberScores[stuntPlayer] || 0) + 5;
        popDelta(stuntPlayer, 1);

        const passText = pick(STUNT_PASS_TEXT[stunt.id] || STUNT_PASS_TEXT['shark-splash'])(stuntPlayer, pronouns(stuntPlayer));
        round.stuntResult = { passed: true, score: Math.round(score * 10) / 10, threshold: Math.round(threshold * 10) / 10, fatigue: fatigue[stuntPlayer], text: passText, player: stuntPlayer };

        const campKey = tribe.name.toLowerCase();
        ep.campEvents[campKey].post.push({
          type: 'truth-stunt-pass',
          players: [stuntPlayer],
          badgeText: `${stuntPlayer} survived ${stunt.name} in Truth or Shark`,
          badgeClass: 'badge-success',
        });
      } else {
        // ELIMINATION of the stunt player
        const failText = pick(STUNT_FAIL_TEXT[stunt.id] || STUNT_FAIL_TEXT['shark-splash'])(stuntPlayer, pronouns(stuntPlayer));
        round.stuntResult = { passed: false, score: Math.round(score * 10) / 10, threshold: Math.round(threshold * 10) / 10, fatigue: fatigue[stuntPlayer] || 0, text: failText, player: stuntPlayer };

        eliminated.push({ player: stuntPlayer, tribe: tribe.name, round: roundNum, secret: truth.text });
        hecklerGallery.push(stuntPlayer);
        tribeElimCounts[tribe.name]++;
        popDelta(stuntPlayer, -2);

        // Chris SOMETIMES reveals the truth anyway (~55%)
        const chrisReveals = Math.random() < 0.55;
        round.revealedAnyway = chrisReveals;

        if (chrisReveals) {
          const forcedSecret = pick(FORCED_REVEAL_TEXT)(target, truth.text, host());
          round.elimination = { player: stuntPlayer, forcedSecret, truthOwner: target, tribe: tribe.name };
          popDelta(target, -2);

          // Resentment: if stunt victim ≠ truth owner, the eliminated player resents the refuser
          if (stuntPlayer !== target) {
            const resArchetype = arch(stuntPlayer);
            let resentDelta = -2;
            if (['hothead', 'villain'].includes(resArchetype)) resentDelta = -3;
            else if (['hero', 'loyal-soldier'].includes(resArchetype)) resentDelta = -1;
            else if (resArchetype === 'goat') resentDelta = -1;
            addBond(stuntPlayer, target, resentDelta);
            popDelta(target, -1);
            round.resentment = { from: stuntPlayer, to: target, bondDelta: resentDelta };

            const campKey = tribe.name.toLowerCase();
            ep.campEvents[campKey].post.push({
              type: 'truth-resentment',
              players: [stuntPlayer, target],
              badgeText: `${stuntPlayer} resents ${target} for refusing to confess (got eliminated because of it)`,
              badgeClass: 'badge-danger',
            });
          }
        } else {
          round.elimination = { player: stuntPlayer, forcedSecret: null, truthOwner: target, tribe: tribe.name };
        }

        const campKey = tribe.name.toLowerCase();
        ep.campEvents[campKey].post.push({
          type: 'truth-stunt-fail',
          players: [stuntPlayer],
          badgeText: `${stuntPlayer} was eliminated from Truth or Shark (failed ${stunt.name})`,
          badgeClass: 'badge-danger',
        });
      }

      // Remove easiest remaining stunt from wheel
      if (wheelStunts.length > 1) {
        wheelStunts.sort((a, b) => a.difficulty - b.difficulty);
        const removed = wheelStunts.shift();
        removedStunts.push(removed);
      }
    }

    // ── SOCIAL EVENTS (guaranteed 1, ~30% bonus) ──
    const socialCount = 1 + (Math.random() < 0.3 ? 1 : 0);
    for (let s = 0; s < socialCount; s++) {
      const event = _generateSocialEvent(target, tribe, otherTribe, eliminated, hecklerGallery, round, allActive, ep);
      if (event) {
        round.socialEvents.push(event);
        if (allActive.includes(event.players[0])) {
          ep.chalMemberScores[event.players[0]] = (ep.chalMemberScores[event.players[0]] || 0) + 1;
        }
        if (event.players[1] && allActive.includes(event.players[1])) {
          ep.chalMemberScores[event.players[1]] = (ep.chalMemberScores[event.players[1]] || 0) + 1;
        }
      }
    }

    // ── HECKLER EVENTS (from gallery if 2+ hecklers) ──
    if (hecklerGallery.length >= 2 && Math.random() < 0.5) {
      const heckler = pick(hecklerGallery);
      const hecklable = allActive.filter(m => !eliminated.some(e => e.player === m) && m !== heckler);
      if (hecklable.length) {
        const heckTarget = pick(hecklable);
        const text = pick(HECKLER_TEXT)(heckler, heckTarget);
        round.hecklerEvents.push({ player: heckler, text, target: heckTarget, bondDelta: -0.5 });
        addBond(heckler, heckTarget, -0.5);
        popDelta(heckler, -1);

        const campKey = tribe.name.toLowerCase();
        ep.campEvents[campKey].post.push({
          type: 'truth-heckler',
          players: [heckler, heckTarget],
          badgeText: `${heckler} heckled ${heckTarget} from the gallery`,
          badgeClass: 'badge-warning',
        });
      }
    }

    rounds.push(round);
    currentTribeIdx = (currentTribeIdx + 1) % tribeMembers.length;
  }

  // ── VICTORY ROUND: last tribe standing ──
  const aliveTribes = tribeMembers.filter(t =>
    t.members.some(m => !eliminated.some(e => e.player === m))
  );
  if (aliveTribes.length === 1) {
    const victorTribe = aliveTribes[0];
    const survivors = victorTribe.members.filter(m => !eliminated.some(e => e.player === m));
    const victoryRound = {
      type: 'victory',
      tribe: victorTribe,
      survivors,
      roundNum: roundNum + 1,
    };
    rounds.push(victoryRound);
  }

  // ── DETERMINE WINNER ──
  // Rank tribes by how many members survived (most alive = winner, fewest = loser)
  const tribesRanked = [...tribeMembers].sort((a, b) => {
    const aAlive = a.members.filter(m => !eliminated.some(e => e.player === m)).length;
    const bAlive = b.members.filter(m => !eliminated.some(e => e.player === m)).length;
    if (bAlive !== aAlive) return bAlive - aAlive;
    return (tribeElimCounts[a.name] || 0) - (tribeElimCounts[b.name] || 0);
  });
  const winningTribe = tribesRanked[0];
  const loser = tribesRanked[tribesRanked.length - 1];

  // Build tribe names string for host intro
  const tribeNames = tribeMembers.map(t => t.name);
  const tribeNamesStr = tribeNames.length === 2
    ? `${tribeNames[0]} versus ${tribeNames[1]}`
    : tribeNames.slice(0, -1).join(', ') + ', and ' + tribeNames[tribeNames.length - 1];

  // Survival bonus: +0.5 per round survived (rewards lasting longer)
  const totalRounds = rounds.length;
  for (const elim of eliminated) {
    const elimRound = rounds.findIndex(r => r.elimination?.player === elim.player);
    if (elimRound >= 0) {
      ep.chalMemberScores[elim.player] = (ep.chalMemberScores[elim.player] || 0) + (elimRound + 1) * 0.5;
    }
  }
  // Survivors get full round count bonus
  const survivors = allActive.filter(n => !eliminated.some(e => e.player === n));
  survivors.forEach(n => { ep.chalMemberScores[n] = (ep.chalMemberScores[n] || 0) + totalRounds * 0.5; });

  const result = {
    rounds,
    wheel: { stunts: STUNTS.map(s => ({ ...s })), removedStunts: removedStunts.map(s => ({ ...s })), remaining: wheelStunts.map(s => ({ ...s })) },
    fatigue: { ...fatigue },
    eliminated,
    hecklerGallery: [...hecklerGallery],
    winningTribe: winningTribe.name,
    losingTribe: loser.name,
    winningTribeColor: winningTribe.color,
    losingTribeColor: loser.color,
    tribeMembers,
    tribesRanked: tribesRanked.map(t => t.name),
    scores: { ...ep.chalMemberScores },
    hostIntro: pick(HOST_INTRO_TEXT)(host(), tribeNamesStr),
  };

  // Romance hooks
  const _romActive = gs.activePlayers.filter(p => p !== gs.exileDuelPlayer);
  for (let i = 0; i < _romActive.length; i++)
    for (let j = i + 1; j < _romActive.length; j++)
      _challengeRomanceSpark(_romActive[i], _romActive[j], ep, null, null, ep.chalMemberScores || {}, 'game show truth-telling');
  _checkShowmanceChalMoment(ep, null, null, ep.chalMemberScores || {}, 'truth-or-shark', _romActive);

  // Finalize
  ep.truthOrShark = result;
  ep.isTruthOrShark = true;
  ep.challengeType = 'truth-or-shark';
  ep.challengeLabel = 'Truth or Shark';
  ep.challengeCategory = 'social';

  // Winning tribe gets immunity
  ep.winner = winningTribe.name;
  ep.loser = loser.name;
  ep.tribalPlayers = loser.members;
  ep.immunityWinner = null; // tribe immunity, not individual

  // Winning tribe top scorer gets massive bonus
  const winMembers = winningTribe.members;
  const topScorer = winMembers.reduce((best, m) =>
    (ep.chalMemberScores[m] || 0) > (ep.chalMemberScores[best] || 0) ? m : best
  , winMembers[0]);
  const maxOther = Math.max(0, ...Object.entries(ep.chalMemberScores).filter(([n]) => n !== topScorer).map(([, s]) => s));
  ep.chalMemberScores[topScorer] = Math.max(ep.chalMemberScores[topScorer] || 0, maxOther) + allActive.length + 5;

  // chalPlacements: sorted by score
  ep.chalPlacements = Object.entries(ep.chalMemberScores)
    .sort((a, b) => b[1] - a[1])
    .map(([name]) => name);

  updateChalRecord(ep);
  return ep;
}

// ── Social event generator ──
function _generateSocialEvent(target, tribe, otherTribe, eliminated, hecklerGallery, round, allActive, ep) {
  const aliveInTribe = tribe.members.filter(m => !eliminated.some(e => e.player === m));
  const aliveInOther = otherTribe.members.filter(m => !eliminated.some(e => e.player === m));
  const aliveAll = [...aliveInTribe, ...aliveInOther];

  // Weight event types by availability
  const candidates = [];

  // Showmance moment
  if (gs.showmances?.length) {
    for (const sm of gs.showmances) {
      if (aliveAll.includes(sm.a) && aliveAll.includes(sm.b) && romanticCompat(sm.a, sm.b)) {
        candidates.push({ type: 'showmance-moment', players: [sm.a, sm.b], weight: 3 });
        break;
      }
    }
  }

  // Rivalry flare (cross-tribe)
  if (aliveInTribe.length && aliveInOther.length) {
    const a = pick(aliveInTribe);
    const b = pick(aliveInOther);
    if (getBond(a, b) <= 0) {
      candidates.push({ type: 'rivalry-flare', players: [a, b], weight: 2 });
    }
  }

  // Alliance whisper (same tribe)
  if (aliveInTribe.length >= 2) {
    const pair = aliveInTribe.sort(() => Math.random() - 0.5).slice(0, 2);
    if (getBond(pair[0], pair[1]) >= 1) {
      candidates.push({ type: 'alliance-whisper', players: pair, weight: 2 });
    }
  }

  // Heckler outburst
  if (hecklerGallery.length && aliveAll.length) {
    const heckler = pick(hecklerGallery);
    const heckTarget = pick(aliveAll.filter(m => m !== heckler));
    if (heckTarget) {
      candidates.push({ type: 'heckler-outburst', players: [heckler, heckTarget], weight: 2 });
    }
  }

  // Secret weaponize (villain only)
  if (round.decision === 'confess') {
    const schemers = aliveAll.filter(m => m !== target && canScheme(m));
    if (schemers.length) {
      candidates.push({ type: 'secret-weaponize', players: [pick(schemers), target], weight: 2 });
    }
  }

  // Sympathy bond (nice player defends confessor)
  if (round.decision === 'confess') {
    const niceOnes = aliveAll.filter(m => m !== target && isNice(m));
    if (niceOnes.length) {
      candidates.push({ type: 'sympathy-bond', players: [pick(niceOnes), target], weight: 3 });
    }
  }

  // Paranoia seed (perceptive player)
  const perceptives = aliveAll.filter(m => arch(m) === 'perceptive-player' || pStats(m).intuition >= 7);
  if (perceptives.length) {
    const suspectPool = aliveAll.filter(m => !perceptives.includes(m));
    if (suspectPool.length) {
      candidates.push({ type: 'paranoia-seed', players: [pick(perceptives), pick(suspectPool)], weight: 1 });
    }
  }

  // Underdog rally
  const underdogs = aliveInTribe.filter(m => arch(m) === 'underdog');
  if (underdogs.length && aliveInTribe.length >= 2) {
    candidates.push({ type: 'underdog-rally', players: [pick(underdogs), tribe.name], weight: 1 });
  }

  if (!candidates.length) return null;

  // Weighted selection
  const totalWeight = candidates.reduce((sum, c) => sum + c.weight, 0);
  let roll = Math.random() * totalWeight;
  let selected = candidates[0];
  for (const c of candidates) {
    roll -= c.weight;
    if (roll <= 0) { selected = c; break; }
  }

  // Generate text + consequences
  const textPool = SOCIAL_TEXT[selected.type];
  if (!textPool) return null;
  const text = pick(textPool)(selected.players[0], selected.players[1]);

  const consequences = {};
  switch (selected.type) {
    case 'showmance-moment':
      addBond(selected.players[0], selected.players[1], 0.5);
      consequences.bondDelta = 0.5;
      break;
    case 'rivalry-flare':
      addBond(selected.players[0], selected.players[1], -0.5);
      consequences.bondDelta = -0.5;
      break;
    case 'alliance-whisper':
      addBond(selected.players[0], selected.players[1], 0.25);
      consequences.bondDelta = 0.25;
      break;
    case 'heckler-outburst':
      addBond(selected.players[0], selected.players[1], -0.5);
      popDelta(selected.players[0], -1);
      consequences.bondDelta = -0.5;
      break;
    case 'secret-weaponize':
      addBond(selected.players[0], selected.players[1], -0.75);
      consequences.bondDelta = -0.75;
      {
        const campKey = tribe.name.toLowerCase();
        ep.campEvents[campKey].post.push({
          type: 'truth-secret-weapon',
          players: [selected.players[0], selected.players[1]],
          badgeText: `${selected.players[0]} is storing ${selected.players[1]}'s secret as leverage`,
          badgeClass: 'badge-danger',
        });
      }
      break;
    case 'sympathy-bond':
      addBond(selected.players[0], selected.players[1], 0.5);
      consequences.bondDelta = 0.5;
      break;
    case 'paranoia-seed':
      addBond(selected.players[0], selected.players[1], -0.25);
      consequences.bondDelta = -0.25;
      {
        const campKey = tribe.name.toLowerCase();
        ep.campEvents[campKey].post.push({
          type: 'truth-paranoia',
          players: [selected.players[0], selected.players[1]],
          badgeText: `${selected.players[0]} grew suspicious of ${selected.players[1]} during the challenge`,
          badgeClass: 'badge-warning',
        });
      }
      break;
    case 'underdog-rally':
      for (const m of aliveInTribe) { if (m !== selected.players[0]) addBond(selected.players[0], m, 0.25); }
      popDelta(selected.players[0], 1);
      consequences.bondDelta = 0.25;
      break;
  }

  return {
    type: selected.type,
    players: selected.players,
    description: text,
    consequences,
  };
}

// ══════════════════════════════════════════════════════════════
// CSS — GAME SHOW CHAOS OVERDRIVE
// ══════════════════════════════════════════════════════════════
function _css() {
  return `<style>
  @import url('https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@400;600;700&display=swap');

  .tls-shell{
    --neon-pink:#ff2d95;--neon-cyan:#00f0ff;--acid-yellow:#e8ff00;
    --navy:#0a0a2e;--dark-navy:#06061a;--studio-red:#ff3333;
    --slime-green:#39ff14;--shark-blue:#0066cc;
    font-family:'Inter',sans-serif;font-weight:600;color:#fff;
    background:var(--navy);
    padding:0;max-width:1100px;margin:0 auto;position:relative;min-height:400px;
    overflow:clip;border:3px solid var(--neon-cyan);
    box-shadow:0 0 30px rgba(0,240,255,0.2),0 0 60px rgba(255,45,149,0.1);
  }

  /* CRT scan line overlay */
  .tls-shell::before{content:'';position:absolute;inset:0;pointer-events:none;z-index:50;
    background:repeating-linear-gradient(0deg,
      transparent 0px,transparent 2px,
      rgba(0,240,255,0.03) 2px,rgba(0,240,255,0.03) 4px);
    mix-blend-mode:overlay}

  /* Studio spotlight sweep */
  .tls-shell::after{content:'';position:absolute;inset:0;pointer-events:none;z-index:0;
    background:radial-gradient(ellipse at 30% 20%,rgba(255,45,149,0.12) 0%,transparent 50%),
               radial-gradient(ellipse at 70% 30%,rgba(0,240,255,0.08) 0%,transparent 45%)}

  @media(prefers-reduced-motion:reduce){
    .tls-shell::before,.tls-shell::after,.tls-fin,.tls-spotlight,.tls-bubble,
    .tls-evt,.tls-shell-shake,.tls-sfx,.tls-sfx-inline,.tls-confetti::before,.tls-confetti::after,
    .tls-wheel-spinning,.tls-chyron-text,.tls-glitch::before,.tls-glitch::after,
    .tls-confessional::before,.tls-energy-fill,.tls-bubble-particle,
    .tls-reaction,.tls-cracked::after,.tls-tombstone::before,.tls-envelope .tls-evt-body,
    .tls-envelope::after{animation:none!important;transition:none!important}
    .tls-shell--chaos{animation:none!important}
    .tls-hud-bar-fill{transition:none!important}
    .tls-envelope .tls-evt-body{max-height:none!important;opacity:1!important;transform:none!important}
  }

  /* ═══ LAYOUT ═══ */
  .tls-layout{display:flex;gap:0;position:relative;z-index:5;min-height:300px}
  .tls-feed{flex:1;padding:16px 20px;min-width:0}
  .tls-sidebar{width:240px;flex-shrink:0;padding:14px;
    background:linear-gradient(180deg,rgba(10,10,46,0.95),rgba(6,6,26,0.98));
    border-left:2px solid var(--neon-cyan);position:sticky;top:0;align-self:flex-start;max-height:80vh;overflow-y:auto}

  /* ═══ HUD ═══ */
  .tls-hud{display:flex;justify-content:center;gap:0;padding:10px 0;position:relative;z-index:5;
    border-bottom:2px solid var(--neon-pink);overflow:hidden;
    background:linear-gradient(180deg,rgba(255,45,149,0.15),rgba(10,10,46,0.9))}
  .tls-hud-cell{flex:1;text-align:center;padding:4px 12px;border-right:1px solid rgba(0,240,255,0.2);position:relative;z-index:2}
  .tls-hud-cell:last-child{border-right:none}
  .tls-hud-val{font-family:'Anton',sans-serif;font-size:26px;color:var(--neon-cyan);text-shadow:0 0 10px rgba(0,240,255,0.5)}
  .tls-hud-lbl{font-size:8px;letter-spacing:3px;color:rgba(255,255,255,0.5);text-transform:uppercase}

  /* ═══ EVENT CARD SYSTEM (identity pattern) ═══ */
  .tls-evt{display:flex;gap:0;margin:12px 0;border-radius:6px;overflow:hidden;position:relative;
    background:linear-gradient(135deg,rgba(10,10,46,0.85),rgba(6,6,26,0.95));
    box-shadow:0 4px 20px rgba(0,0,0,0.5),inset 0 0 30px rgba(0,0,0,0.2)}
  .tls-evt::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;
    background:linear-gradient(90deg,transparent,var(--neon-cyan),transparent);opacity:0.4}

  /* Left accent — the "screen frame" with portrait */
  .tls-evt-frame{flex:0 0 60px;display:flex;flex-direction:column;align-items:center;justify-content:center;
    padding:10px 6px;position:relative;gap:4px}
  .tls-evt-frame::after{content:'';position:absolute;top:8px;bottom:8px;right:0;width:1px;
    background:linear-gradient(180deg,transparent,var(--neon-cyan),transparent);opacity:0.3}
  .tls-evt-frame img{border-radius:3px;border:2px solid rgba(0,240,255,0.4);
    box-shadow:0 0 8px rgba(0,240,255,0.15)}
  .tls-evt-frame-name{font-size:7px;color:rgba(255,255,255,0.5);letter-spacing:0.5px;
    text-align:center;max-width:56px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}

  /* Right body — tag + narration */
  .tls-evt-body{flex:1;padding:12px 14px;display:flex;flex-direction:column;gap:6px;
    border-left:3px solid var(--neon-cyan)}
  .tls-evt-head{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
  .tls-evt-tag{font-family:'Inter',sans-serif;font-size:9px;font-weight:700;letter-spacing:2px;
    text-transform:uppercase;padding:2px 8px;border:1px solid;border-radius:3px;
    display:inline-flex;align-items:center;gap:4px;white-space:nowrap}
  .tls-evt-name{font-family:'Anton',sans-serif;font-size:15px;letter-spacing:0.5px}
  .tls-evt-text{font-size:13px;color:rgba(255,255,255,0.88);line-height:1.7}
  .tls-evt-consequence{font-size:9px;padding:2px 6px;border-radius:10px;font-weight:700;
    display:inline-block;margin-top:2px}

  /* ── Per-type color theming ── */
  .tls-evt--truth .tls-evt-body{border-color:var(--acid-yellow)}
  .tls-evt--truth .tls-evt-tag{color:var(--acid-yellow);border-color:var(--acid-yellow)}
  .tls-evt--truth .tls-evt-frame img{border-color:var(--acid-yellow)}
  .tls-evt--truth{animation:tls-flip 0.4s ease-out}
  @keyframes tls-flip{from{transform:rotateX(-90deg);opacity:0}to{transform:rotateX(0);opacity:1}}

  .tls-evt--confess .tls-evt-body{border-color:var(--slime-green)}
  .tls-evt--confess .tls-evt-tag{color:var(--slime-green);border-color:var(--slime-green)}
  .tls-evt--confess .tls-evt-frame img{border-color:var(--slime-green)}
  .tls-evt--confess .tls-evt-name{color:var(--slime-green)}
  .tls-evt--confess{animation:tls-bounce 0.3s ease-out}
  @keyframes tls-bounce{0%{transform:scale(0.9)}50%{transform:scale(1.03)}100%{transform:scale(1)}}

  .tls-evt--refuse .tls-evt-body{border-color:var(--studio-red)}
  .tls-evt--refuse .tls-evt-tag{color:var(--studio-red);border-color:var(--studio-red)}
  .tls-evt--refuse{animation:tls-shake 0.3s ease-out}
  @keyframes tls-shake{0%,100%{transform:translateX(0)}25%{transform:translateX(-4px)}75%{transform:translateX(4px)}}

  .tls-evt--stunt .tls-evt-body{border-color:var(--neon-pink)}
  .tls-evt--stunt .tls-evt-tag{color:var(--neon-pink);border-color:var(--neon-pink)}
  .tls-evt--stunt .tls-evt-frame img{border-color:var(--neon-pink)}
  .tls-evt--stunt .tls-evt-name{color:var(--neon-pink)}
  .tls-evt--stunt{animation:tls-spiral 0.4s ease-out}
  @keyframes tls-spiral{from{transform:rotate(-10deg) scale(0.8);opacity:0}to{transform:rotate(0) scale(1);opacity:1}}

  .tls-evt--elim .tls-evt-body{border-color:var(--studio-red)}
  .tls-evt--elim .tls-evt-tag{color:var(--studio-red);border-color:var(--studio-red)}
  .tls-evt--elim .tls-evt-frame img{border-color:var(--studio-red);box-shadow:0 0 12px rgba(255,51,51,0.3)}
  .tls-evt--elim .tls-evt-name{color:var(--studio-red)}
  .tls-evt--elim{animation:tls-crack 0.5s ease-out;
    background:linear-gradient(135deg,rgba(255,51,51,0.1),rgba(6,6,26,0.95))}
  @keyframes tls-crack{0%{clip-path:inset(0 50% 0 50%)}100%{clip-path:inset(0)}}

  .tls-evt--wheel .tls-evt-body{border-color:var(--acid-yellow)}
  .tls-evt--wheel .tls-evt-tag{color:var(--acid-yellow);border-color:var(--acid-yellow)}
  .tls-evt--wheel{background:linear-gradient(135deg,rgba(232,255,0,0.05),rgba(6,6,26,0.95))}

  .tls-evt--reveal .tls-evt-body{border-color:var(--acid-yellow)}
  .tls-evt--reveal .tls-evt-tag{color:var(--acid-yellow);border-color:var(--acid-yellow)}
  .tls-evt--reveal{animation:tls-flash 0.4s ease-out}
  @keyframes tls-flash{0%{filter:brightness(2)}100%{filter:brightness(1)}}

  .tls-evt--resentment .tls-evt-body{border-color:var(--studio-red)}
  .tls-evt--resentment .tls-evt-tag{color:var(--studio-red);border-color:var(--studio-red)}

  .tls-evt--social .tls-evt-body{border-color:var(--neon-cyan)}
  .tls-evt--social .tls-evt-tag{color:var(--neon-cyan);border-color:var(--neon-cyan)}
  .tls-evt--social{border:2px dashed rgba(0,240,255,0.25);border-radius:6px}
  .tls-evt--social .tls-evt-frame::after{opacity:0}

  .tls-evt--heckler .tls-evt-body{border-color:rgba(255,51,51,0.5)}
  .tls-evt--heckler .tls-evt-tag{color:var(--studio-red);border-color:rgba(255,51,51,0.4)}
  .tls-evt--heckler{border:1px dashed rgba(255,51,51,0.3);border-radius:6px;
    background:rgba(255,51,51,0.03)}

  /* No-portrait variant (mystery question) */
  .tls-evt--noframe .tls-evt-frame{display:none}
  .tls-evt--noframe .tls-evt-body{border-left-width:4px;padding:14px 16px}

  /* Multi-portrait (2 players) */
  .tls-evt-frame--duo{flex:0 0 60px;gap:2px}
  .tls-evt-frame--duo img{width:24px;height:24px}

  .tls-card-flavor{border:none;margin:8px 0;padding:8px 12px;
    color:rgba(0,240,255,0.5);font-size:11px;font-style:italic;letter-spacing:1px;
    border-left:2px solid rgba(0,240,255,0.2)}

  /* ═══ ICONS (CSS-only) ═══ */
  .tls-icon{display:inline-block;width:18px;height:18px;vertical-align:middle;margin:0 3px;flex-shrink:0}
  .tls-icon-shark{width:0;height:0;border-left:9px solid transparent;border-right:9px solid transparent;
    border-bottom:18px solid var(--shark-blue);position:relative;display:inline-block;vertical-align:middle;margin:0 3px}
  .tls-icon-buzzer{width:16px;height:16px;border-radius:50%;border:3px solid var(--acid-yellow);
    background:radial-gradient(circle,var(--acid-yellow),transparent);display:inline-block;vertical-align:middle;margin:0 3px}
  .tls-icon-wheel{width:16px;height:16px;border-radius:50%;border:2px solid var(--neon-pink);position:relative;
    background:conic-gradient(var(--neon-pink) 0deg 60deg,var(--neon-cyan) 60deg 120deg,var(--acid-yellow) 120deg 180deg,
    var(--slime-green) 180deg 240deg,var(--studio-red) 240deg 300deg,var(--shark-blue) 300deg 360deg);
    display:inline-block;vertical-align:middle;margin:0 3px}
  .tls-icon-spotlight{width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;
    border-top:18px solid var(--acid-yellow);opacity:0.7;display:inline-block;vertical-align:middle;margin:0 3px}
  .tls-icon-slime{width:16px;height:12px;border-radius:0 0 8px 8px;background:var(--slime-green);position:relative;
    display:inline-block;vertical-align:middle;margin:0 3px}
  .tls-icon-slime::before{content:'';position:absolute;top:-4px;left:2px;width:6px;height:6px;border-radius:50%;background:var(--slime-green)}
  .tls-icon-slime::after{content:'';position:absolute;top:-6px;right:2px;width:4px;height:8px;border-radius:50%;background:var(--slime-green)}
  .tls-icon-bolt{display:inline-block;width:12px;height:18px;vertical-align:middle;margin:0 3px;position:relative}
  .tls-icon-bolt::before{content:'';position:absolute;top:0;left:2px;width:8px;height:10px;
    background:var(--acid-yellow);clip-path:polygon(50% 0%,100% 55%,60% 55%,70% 100%,0% 45%,40% 45%)}
  .tls-icon-megaphone{width:0;height:0;border-top:6px solid transparent;border-bottom:6px solid transparent;
    border-left:14px solid var(--neon-cyan);display:inline-block;vertical-align:middle;margin:0 3px}
  .tls-icon-gavel{width:14px;height:14px;background:var(--neon-pink);border-radius:2px;position:relative;
    display:inline-block;vertical-align:middle;margin:0 3px}
  .tls-icon-gavel::after{content:'';position:absolute;bottom:-4px;left:5px;width:4px;height:8px;background:var(--neon-pink);border-radius:1px}
  .tls-icon-sweat{width:8px;height:12px;border-radius:50% 50% 50% 0;background:var(--neon-cyan);opacity:0.7;
    transform:rotate(-45deg);display:inline-block;vertical-align:middle;margin:0 3px}
  .tls-icon-crack{width:14px;height:18px;position:relative;display:inline-block;vertical-align:middle;margin:0 3px}
  .tls-icon-crack::before{content:'';position:absolute;top:0;left:5px;width:3px;height:18px;
    background:var(--studio-red);clip-path:polygon(0 0,100% 0,100% 30%,60% 35%,100% 40%,80% 55%,100% 60%,100% 100%,0 100%,0 65%,40% 60%,0 55%,20% 45%,0 40%)}

  /* ═══ OVERDRIVE: SCREEN SHAKE ═══ */
  .tls-shell-shake{animation:tls-screenShake 0.5s ease-out}
  @keyframes tls-screenShake{
    0%,100%{transform:translate(0)}
    10%{transform:translate(-3px,-2px)}
    20%{transform:translate(4px,1px)}
    30%{transform:translate(-2px,3px)}
    40%{transform:translate(3px,-1px)}
    50%{transform:translate(-1px,2px)}
    60%{transform:translate(2px,-3px)}
    70%{transform:translate(-4px,1px)}
    80%{transform:translate(1px,-2px)}
    90%{transform:translate(-2px,2px)}
  }

  /* ═══ OVERDRIVE: SFX TEXT BURST ═══ */
  .tls-sfx{position:absolute;font-family:'Anton',sans-serif;font-size:32px;letter-spacing:4px;
    pointer-events:none;z-index:80;animation:tls-sfxBurst 1.2s cubic-bezier(0.16,1,0.3,1) forwards;
    text-shadow:0 0 20px currentColor,0 0 40px currentColor;white-space:nowrap}
  .tls-sfx-inline{position:relative;display:inline-block;font-family:'Anton',sans-serif;font-size:20px;
    letter-spacing:3px;margin:8px 0;animation:tls-sfxPop 0.6s cubic-bezier(0.16,1,0.3,1) both;
    text-shadow:0 0 12px currentColor}
  @keyframes tls-sfxBurst{
    0%{transform:scale(0.3) rotate(-8deg);opacity:0}
    30%{transform:scale(1.3) rotate(3deg);opacity:1}
    100%{transform:scale(1) rotate(0deg);opacity:0}
  }
  @keyframes tls-sfxPop{
    0%{transform:scale(0) rotate(-5deg);opacity:0}
    50%{transform:scale(1.2) rotate(2deg);opacity:1}
    100%{transform:scale(1) rotate(0);opacity:1}
  }

  /* ═══ OVERDRIVE: CONFETTI / SPARKS ═══ */
  .tls-confetti{position:relative;overflow:visible;pointer-events:none}
  .tls-confetti::before,.tls-confetti::after{content:'';position:absolute;top:-10px;
    width:100%;height:60px;pointer-events:none;z-index:10}
  .tls-confetti::before{left:0;background:
    radial-gradient(3px 3px at 10% 20%, var(--neon-cyan) 50%, transparent 51%),
    radial-gradient(2px 2px at 25% 40%, var(--neon-pink) 50%, transparent 51%),
    radial-gradient(3px 3px at 40% 15%, var(--acid-yellow) 50%, transparent 51%),
    radial-gradient(2px 2px at 55% 35%, var(--slime-green) 50%, transparent 51%),
    radial-gradient(3px 3px at 70% 25%, var(--neon-pink) 50%, transparent 51%),
    radial-gradient(2px 2px at 85% 10%, var(--acid-yellow) 50%, transparent 51%),
    radial-gradient(3px 3px at 95% 30%, var(--neon-cyan) 50%, transparent 51%);
    animation:tls-confettiFall 1.5s ease-out forwards}
  .tls-confetti::after{right:0;background:
    radial-gradient(2px 2px at 15% 30%, var(--slime-green) 50%, transparent 51%),
    radial-gradient(3px 3px at 30% 10%, var(--acid-yellow) 50%, transparent 51%),
    radial-gradient(2px 2px at 50% 40%, var(--neon-cyan) 50%, transparent 51%),
    radial-gradient(3px 3px at 65% 20%, var(--neon-pink) 50%, transparent 51%),
    radial-gradient(2px 2px at 80% 35%, var(--slime-green) 50%, transparent 51%),
    radial-gradient(3px 3px at 90% 5%, var(--acid-yellow) 50%, transparent 51%);
    animation:tls-confettiFall 1.5s ease-out 0.1s forwards}
  @keyframes tls-confettiFall{
    0%{transform:translateY(-20px);opacity:1}
    100%{transform:translateY(50px);opacity:0}
  }

  /* ═══ OVERDRIVE: CONFESSION BOOTH ═══ */
  .tls-confessional{position:relative;border:2px solid var(--slime-green);border-radius:6px;overflow:hidden;
    background:radial-gradient(ellipse at center,rgba(10,10,46,0.9),rgba(0,0,0,0.95));
    box-shadow:inset 0 0 60px rgba(0,0,0,0.8),0 0 20px rgba(57,255,20,0.1)}
  .tls-confessional::before{content:'● REC';position:absolute;top:8px;right:12px;
    font-family:'Inter',sans-serif;font-size:9px;font-weight:700;color:var(--studio-red);
    letter-spacing:1px;animation:tls-recBlink 1.2s step-end infinite;z-index:10}
  .tls-confessional::after{content:'';position:absolute;inset:0;pointer-events:none;
    background:radial-gradient(ellipse at center,transparent 50%,rgba(0,0,0,0.6) 100%);z-index:5}
  .tls-confessional-tc{position:absolute;bottom:8px;left:12px;font-family:'Inter',sans-serif;
    font-size:8px;color:rgba(255,255,255,0.3);letter-spacing:1px;z-index:10;font-variant-numeric:tabular-nums}
  @keyframes tls-recBlink{0%,100%{opacity:1}50%{opacity:0}}

  /* ═══ OVERDRIVE: WHEEL SPIN ═══ */
  .tls-wheel-spinning{animation:tls-wheelSpin 2.5s cubic-bezier(0.2,0.8,0.3,1) forwards}
  @keyframes tls-wheelSpin{
    0%{transform:rotate(0deg)}
    100%{transform:rotate(var(--spin-deg, 1440deg))}
  }

  /* ═══ OVERDRIVE: HOST CHYRON ═══ */
  .tls-chyron{overflow:hidden;height:24px;position:relative;margin:6px 0;
    background:linear-gradient(90deg,var(--neon-pink),rgba(255,45,149,0.6),var(--neon-pink));
    border:1px solid var(--neon-pink)}
  .tls-chyron-text{display:inline-block;white-space:nowrap;padding:4px 0;
    font-family:'Anton',sans-serif;font-size:12px;letter-spacing:2px;color:#fff;
    animation:tls-chyronScroll 8s linear infinite}
  .tls-chyron-label{position:absolute;left:0;top:0;bottom:0;padding:4px 8px;z-index:2;
    background:var(--dark-navy);border-right:2px solid var(--neon-pink);
    font-family:'Inter',sans-serif;font-size:9px;font-weight:700;color:var(--neon-pink);
    letter-spacing:2px;display:flex;align-items:center}
  @keyframes tls-chyronScroll{from{transform:translateX(100%)}to{transform:translateX(-100%)}}

  /* ═══ OVERDRIVE: GLITCH TRANSITION ═══ */
  .tls-glitch{position:relative;margin:16px 0;height:12px;overflow:hidden}
  .tls-glitch::before{content:'';position:absolute;inset:0;
    background:repeating-linear-gradient(90deg,
      var(--neon-cyan) 0px,var(--neon-cyan) 2px,transparent 2px,transparent 8px);
    animation:tls-glitchScan 0.3s steps(4) 3}
  .tls-glitch::after{content:'';position:absolute;top:3px;left:0;right:0;height:3px;
    background:linear-gradient(90deg,transparent 0%,var(--neon-pink) 20%,var(--acid-yellow) 50%,var(--neon-cyan) 80%,transparent 100%);
    animation:tls-glitchSlide 0.4s ease-out}
  @keyframes tls-glitchScan{
    0%{clip-path:inset(0 0 80% 0)}
    25%{clip-path:inset(20% 0 40% 0)}
    50%{clip-path:inset(60% 0 10% 0)}
    75%{clip-path:inset(30% 0 50% 0)}
    100%{clip-path:inset(0)}
  }
  @keyframes tls-glitchSlide{from{transform:translateX(-100%)}to{transform:translateX(100%)}}

  /* ═══ OVERDRIVE: PROGRESSIVE CHAOS (applied via data-chaos on .tls-shell) ═══ */
  .tls-shell[data-chaos="1"]{border-color:var(--neon-cyan)}
  .tls-shell[data-chaos="2"]{border-color:color-mix(in srgb,var(--neon-cyan) 60%,var(--neon-pink));
    box-shadow:0 0 30px rgba(255,45,149,0.2),0 0 60px rgba(0,240,255,0.1)}
  .tls-shell[data-chaos="3"]{border-color:var(--neon-pink);
    box-shadow:0 0 40px rgba(255,45,149,0.3),0 0 80px rgba(255,51,51,0.15)}
  .tls-shell[data-chaos="4"]{border-color:var(--studio-red);
    box-shadow:0 0 50px rgba(255,51,51,0.4),0 0 100px rgba(255,45,149,0.2)}

  /* Chaos CRT intensification */
  .tls-shell[data-chaos="3"]::before{
    background:repeating-linear-gradient(0deg,
      transparent 0px,transparent 1px,
      rgba(0,240,255,0.06) 1px,rgba(0,240,255,0.06) 2px)!important}
  .tls-shell[data-chaos="4"]::before{
    background:repeating-linear-gradient(0deg,
      transparent 0px,transparent 1px,
      rgba(255,45,149,0.08) 1px,rgba(255,45,149,0.08) 2px)!important;
    animation:tls-crtJitter 0.1s steps(2) infinite}
  @keyframes tls-crtJitter{0%{transform:translateY(0)}50%{transform:translateY(1px)}}

  /* ═══ TITLE CARD ═══ */
  .tls-cover{text-align:center;padding:40px 20px 30px;position:relative;
    background:linear-gradient(180deg,rgba(255,45,149,0.1),rgba(10,10,46,0.95))}
  .tls-cover-title{font-family:'Anton',sans-serif;font-size:72px;line-height:0.9;letter-spacing:4px;
    color:#fff;text-shadow:0 0 20px var(--neon-pink),0 0 40px rgba(255,45,149,0.3);
    position:relative;z-index:2;margin:12px 0}
  .tls-cover-sub{font-size:14px;letter-spacing:6px;color:var(--neon-cyan);
    text-shadow:0 0 8px rgba(0,240,255,0.5);position:relative;z-index:2}
  .tls-cover-roster{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-top:20px;position:relative;z-index:2}
  .tls-tribe-badge{display:flex;align-items:center;gap:4px;padding:3px 8px;border-radius:4px;
    border:1px solid rgba(255,255,255,0.2);font-size:11px}

  /* ═══ SHARK TANK ═══ */
  .tls-tank{height:40px;background:linear-gradient(180deg,rgba(0,102,204,0.3),rgba(0,40,80,0.6));
    border-top:2px solid rgba(0,240,255,0.3);position:relative;overflow:hidden}
  .tls-fin{position:absolute;top:5px;animation:tls-swim 6s linear infinite}
  @keyframes tls-swim{from{left:-30px}to{left:calc(100% + 30px)}}
  .tls-bubble{position:absolute;bottom:0;width:6px;height:6px;border-radius:50%;
    background:rgba(0,240,255,0.2);animation:tls-rise 3s ease-in infinite}
  @keyframes tls-rise{from{bottom:0;opacity:0.5}to{bottom:40px;opacity:0}}

  /* ═══ SIDEBAR ═══ */
  .tls-side-sec{font-family:'Anton',sans-serif;font-size:12px;letter-spacing:3px;
    color:var(--neon-pink);border-bottom:1px solid rgba(255,45,149,0.3);
    padding:6px 0 3px;margin-top:10px;text-transform:uppercase}
  .tls-side-sec:first-child{margin-top:0}

  .tls-side-player{display:flex;align-items:center;gap:5px;padding:3px 0;font-size:11px}
  .tls-side-elim{opacity:0.4;text-decoration:line-through}

  .tls-fatigue-dots{display:inline-flex;gap:1px}
  .tls-fatigue-dot{width:6px;height:9px;border-radius:50% 50% 50% 0;background:var(--neon-cyan);opacity:0.7;transform:rotate(-45deg)}

  .tls-wheel-item{display:flex;align-items:center;gap:4px;padding:2px 0;font-size:10px;color:rgba(255,255,255,0.6)}
  .tls-wheel-removed{text-decoration:line-through;opacity:0.3}

  .tls-crowd-bar{height:8px;background:rgba(255,255,255,0.1);border-radius:4px;overflow:hidden;margin-top:4px}
  .tls-crowd-fill{height:100%;border-radius:4px;transition:width 0.5s ease;
    background:linear-gradient(90deg,var(--neon-cyan),var(--neon-pink))}

  /* ═══ REVEAL CONTROLS ═══ */
  .tls-controls{position:fixed;bottom:0;left:50%;transform:translateX(-50%);z-index:999;
    display:flex;gap:8px;padding:10px 20px;
    background:rgba(6,6,26,0.95);border:1px solid var(--neon-cyan);border-bottom:none;border-radius:8px 8px 0 0;
    box-shadow:0 -4px 20px rgba(0,240,255,0.2)}
  .tls-btn{padding:6px 16px;border:1px solid var(--neon-cyan);border-radius:4px;cursor:pointer;
    font-family:'Inter',sans-serif;font-weight:700;font-size:12px;color:var(--neon-cyan);
    background:transparent;transition:all 0.2s}
  .tls-btn:hover{background:rgba(0,240,255,0.15)}
  .tls-btn-pink{border-color:var(--neon-pink);color:var(--neon-pink)}
  .tls-btn-pink:hover{background:rgba(255,45,149,0.15)}
  .tls-counter{font-size:11px;color:rgba(255,255,255,0.5);align-self:center}

  .tls-done{display:none;text-align:center;padding:12px;color:var(--slime-green);
    font-family:'Anton',sans-serif;font-size:14px;letter-spacing:3px}

  /* ═══ RESULTS ═══ */
  .tls-results-winner{text-align:center;padding:20px;position:relative;
    background:linear-gradient(135deg,rgba(57,255,20,0.1),rgba(10,10,46,0.9))}
  .tls-results-loser{text-align:center;padding:20px;position:relative;
    background:linear-gradient(135deg,rgba(255,51,51,0.1),rgba(10,10,46,0.9));
    border-top:2px solid rgba(255,51,51,0.3)}
  .tls-results-table{width:100%;border-collapse:collapse;font-size:11px;margin-top:10px}
  .tls-results-table th{text-align:left;padding:4px 8px;border-bottom:1px solid rgba(0,240,255,0.3);
    color:var(--neon-cyan);font-size:10px;letter-spacing:2px;text-transform:uppercase}
  .tls-results-table td{padding:4px 8px;border-bottom:1px solid rgba(255,255,255,0.05)}

  .tls-mvp{display:inline-block;padding:6px 16px;border:2px solid var(--acid-yellow);border-radius:4px;
    color:var(--acid-yellow);font-family:'Anton',sans-serif;font-size:16px;letter-spacing:3px;
    text-shadow:0 0 8px rgba(232,255,0,0.3);margin-top:12px}

  /* Portrait in cards */
  .tls-portrait{display:flex;align-items:center;gap:8px;margin-bottom:8px}
  .tls-portrait-name{font-family:'Anton',sans-serif;font-size:16px;letter-spacing:1px}
  .tls-portrait-tribe{font-size:10px;letter-spacing:2px;opacity:0.6}

  /* ═══ AUDIENCE ENERGY METER ═══ */
  .tls-energy{position:relative;margin:8px 0;padding:4px 10px;display:flex;align-items:center;gap:8px;
    background:rgba(0,0,0,0.3);border-radius:4px;border:1px solid rgba(255,255,255,0.08)}
  .tls-energy-label{font-size:8px;letter-spacing:2px;color:rgba(255,255,255,0.4);text-transform:uppercase;
    font-family:'Inter',sans-serif;font-weight:700;white-space:nowrap}
  .tls-energy-bar{flex:1;height:10px;background:rgba(255,255,255,0.06);border-radius:5px;overflow:hidden;position:relative}
  .tls-energy-fill{height:100%;border-radius:5px;transition:width 0.6s cubic-bezier(0.4,0,0.2,1);
    background:linear-gradient(90deg,var(--neon-cyan),var(--slime-green),var(--acid-yellow),var(--neon-pink),var(--studio-red));
    background-size:200% 100%;animation:tls-energyShimmer 2s linear infinite}
  .tls-energy-fill[data-level="high"]{animation:tls-energyShimmer 1s linear infinite,tls-energyPulse 0.5s ease-in-out infinite}
  .tls-energy-val{font-family:'Anton',sans-serif;font-size:14px;color:var(--acid-yellow);min-width:28px;text-align:right}
  @keyframes tls-energyShimmer{from{background-position:200% 0}to{background-position:0% 0}}
  @keyframes tls-energyPulse{0%,100%{transform:scaleY(1)}50%{transform:scaleY(1.4)}}

  /* ═══ SHARK TANK BUBBLES ═══ */
  .tls-bubbles{position:absolute;bottom:0;left:0;right:0;height:100%;pointer-events:none;overflow:hidden;z-index:1}
  .tls-bubble-particle{position:absolute;bottom:-10px;border-radius:50%;
    background:radial-gradient(circle at 30% 30%,rgba(0,240,255,0.4),rgba(0,102,204,0.1));
    animation:tls-bubbleRise var(--dur,4s) ease-in infinite;animation-delay:var(--delay,0s)}
  @keyframes tls-bubbleRise{0%{transform:translateY(0) scale(1);opacity:0.6}
    50%{transform:translateY(-40vh) scale(0.8);opacity:0.3}
    100%{transform:translateY(-80vh) scale(0.4);opacity:0}}


  /* ═══ PLAYER REACTION STRIP ═══ */
  .tls-reactions{display:flex;gap:6px;justify-content:center;margin:8px 0;padding:6px 0;
    border-top:1px solid rgba(255,255,255,0.05);border-bottom:1px solid rgba(255,255,255,0.05)}
  .tls-reaction{display:flex;flex-direction:column;align-items:center;gap:2px;animation:tls-reactPop 0.4s ease-out both}
  .tls-reaction:nth-child(2){animation-delay:0.08s}
  .tls-reaction:nth-child(3){animation-delay:0.16s}
  .tls-reaction:nth-child(4){animation-delay:0.24s}
  .tls-reaction img{border-radius:3px;border:1px solid rgba(255,255,255,0.2);width:22px;height:22px}
  .tls-reaction-lbl{font-size:7px;font-weight:700;letter-spacing:1px;text-transform:uppercase;
    color:rgba(255,255,255,0.6);font-family:'Inter',sans-serif}
  @keyframes tls-reactPop{from{transform:scale(0) translateY(10px);opacity:0}to{transform:scale(1) translateY(0);opacity:1}}

  /* ═══ FATIGUE CRACKS ON PORTRAITS ═══ */
  .tls-cracked{position:relative;display:inline-block}
  .tls-cracked::after{content:'';position:absolute;inset:0;pointer-events:none;
    background:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Cpath d='M20 0L18 12L22 14L17 22L24 26L20 40' stroke='%23ff3333' fill='none' stroke-width='1.5' opacity='0.7'/%3E%3C/svg%3E") center/contain no-repeat;
    opacity:var(--crack-opacity,0);animation:tls-crackGrow 0.3s ease-out forwards}
  .tls-cracked[data-fatigue="2"]::after{--crack-opacity:0.5}
  .tls-cracked[data-fatigue="3"]::after{--crack-opacity:0.75}
  .tls-cracked[data-fatigue="4"]::after{--crack-opacity:1}
  .tls-cracked[data-fatigue="4"]{filter:saturate(0.6)}
  .tls-cracked[data-fatigue="3"] img,.tls-cracked[data-fatigue="4"] img{
    clip-path:polygon(0 0,48% 0,45% 20%,52% 30%,47% 45%,54% 60%,48% 75%,50% 100%,0 100%,100% 100%,100% 0,52% 0,55% 15%,48% 28%,53% 42%,47% 55%,52% 70%,50% 100%)}
  @keyframes tls-crackGrow{from{opacity:0;transform:scale(0.8)}to{opacity:var(--crack-opacity,0);transform:scale(1)}}

  /* ═══ ELIMINATION TOMBSTONE ═══ */
  .tls-tombstone{text-align:center;padding:16px;position:relative;
    background:linear-gradient(180deg,rgba(0,0,0,0.9),rgba(20,20,20,0.95));
    border:2px solid rgba(255,51,51,0.4);border-radius:6px;overflow:hidden}
  .tls-tombstone::before{content:'';position:absolute;inset:0;
    background:repeating-linear-gradient(0deg,transparent 0px,transparent 3px,rgba(255,255,255,0.02) 3px,rgba(255,255,255,0.02) 4px);
    animation:tls-staticNoise 0.15s steps(3) infinite;pointer-events:none}
  .tls-tombstone img{filter:grayscale(1) contrast(1.2);border-radius:4px;
    border:3px solid rgba(255,51,51,0.5);box-shadow:0 0 20px rgba(255,51,51,0.3)}
  .tls-tombstone-name{font-family:'Anton',sans-serif;font-size:20px;color:rgba(255,255,255,0.6);
    letter-spacing:4px;margin-top:8px;text-shadow:0 0 8px rgba(255,51,51,0.3)}
  .tls-tombstone-epitaph{font-size:10px;color:rgba(255,255,255,0.3);font-style:italic;margin-top:4px;letter-spacing:1px}
  @keyframes tls-staticNoise{0%{transform:translateY(0)}33%{transform:translateY(-2px)}66%{transform:translateY(1px)}}

  /* ═══ TRUTH ENVELOPE ═══ */
  .tls-envelope{position:relative;overflow:hidden;padding:0}
  .tls-envelope .tls-evt-body{animation:tls-envelopeOpen 0.8s cubic-bezier(0.4,0,0.2,1) forwards}
  .tls-envelope::after{content:'';position:absolute;top:0;left:0;right:0;height:50%;
    background:linear-gradient(180deg,rgba(232,255,0,0.08),transparent);
    clip-path:polygon(0 0,50% 100%,100% 0);pointer-events:none;opacity:0;
    animation:tls-envelopeFlapUp 0.4s ease-out 0.1s forwards}
  @keyframes tls-envelopeOpen{0%{max-height:0;opacity:0;transform:translateY(-10px)}100%{max-height:300px;opacity:1;transform:translateY(0)}}
  @keyframes tls-envelopeFlapUp{from{opacity:0.6;transform:scaleY(1)}to{opacity:0;transform:scaleY(0)}}

  /* ═══ STUDIO CAMERA CLOSE-UP ═══ */
  .tls-closeup{position:relative;padding:16px;text-align:center;
    background:radial-gradient(ellipse at center,rgba(10,10,46,0.6),rgba(0,0,0,0.95));
    border:2px solid rgba(255,255,255,0.1);border-radius:6px}
  .tls-closeup::before{content:'';position:absolute;inset:0;
    background:radial-gradient(ellipse at center,transparent 40%,rgba(0,0,0,0.7) 100%);
    pointer-events:none;border-radius:6px}
  .tls-closeup img{border-radius:6px;border:3px solid rgba(255,255,255,0.15);
    box-shadow:0 0 30px rgba(0,0,0,0.5);position:relative;z-index:1}
  .tls-closeup-label{position:absolute;top:8px;left:12px;font-family:'Inter',sans-serif;
    font-size:8px;font-weight:700;letter-spacing:3px;color:rgba(255,255,255,0.3);
    text-transform:uppercase;z-index:2}
  .tls-closeup-text{font-size:14px;color:rgba(255,255,255,0.9);margin-top:10px;
    font-style:italic;position:relative;z-index:1;line-height:1.6}
</style>`;
}

// ══════════════════════════════════════════════════════════════
// ICON HELPER
// ══════════════════════════════════════════════════════════════
function _icon(type) {
  const map = {
    shark: '<span class="tls-icon-shark"></span>',
    buzzer: '<span class="tls-icon-buzzer"></span>',
    wheel: '<span class="tls-icon-wheel"></span>',
    spotlight: '<span class="tls-icon-spotlight"></span>',
    slime: '<span class="tls-icon-slime"></span>',
    bolt: '<span class="tls-icon-bolt"></span>',
    megaphone: '<span class="tls-icon-megaphone"></span>',
    gavel: '<span class="tls-icon-gavel"></span>',
    sweat: '<span class="tls-icon-sweat"></span>',
    crack: '<span class="tls-icon-crack"></span>',
  };
  return map[type] || '';
}

function _stuntIcon(stunt) {
  return _icon(stunt.icon || 'shark');
}

const REACTION_WORDS = {
  confess: ['GASP', 'CRINGE', 'OOF', 'YIKES', 'RESPECT', 'OUCH', 'NO WAY', 'DEAD'],
  refuse: ['BOLD', 'SCARY', 'BRAVE?', 'HORROR', 'YOLO', 'MADNESS', 'WHOA', 'RIP'],
  elim: ['BRUTAL', 'GONE', 'F', 'SAVAGE', 'COLD', 'MERCILESS', 'DAMN', 'OVER'],
  pass: ['LEGEND', 'CLUTCH', 'INSANE', 'HERO', 'BEAST', 'WOW', 'GOAT', 'KING'],
};

function _reactionStrip(type, allActive, excluded, eliminated) {
  const available = allActive.filter(m => m !== excluded && !eliminated.some(e => e.player === m));
  if (available.length < 3) return '';
  const reactors = [];
  const pool = [...available];
  for (let i = 0; i < Math.min(4, pool.length); i++) {
    const idx = Math.floor(Math.random() * pool.length);
    reactors.push(pool.splice(idx, 1)[0]);
  }
  const words = REACTION_WORDS[type] || REACTION_WORDS.confess;
  return `<div class="tls-reactions">${reactors.map(m =>
    `<div class="tls-reaction">${portrait(m, 22)}<span class="tls-reaction-lbl">${pick(words)}</span></div>`
  ).join('')}</div>`;
}

function _energyMeter(energy) {
  const pct = Math.min(100, Math.max(0, energy));
  const level = pct >= 75 ? 'high' : '';
  return `<div class="tls-energy">
    <span class="tls-energy-label">${_icon('megaphone')} CROWD</span>
    <div class="tls-energy-bar"><div class="tls-energy-fill" data-level="${level}" style="width:${pct}%"></div></div>
    <span class="tls-energy-val">${Math.round(pct)}</span>
  </div>`;
}

function _tombstone(playerName, round, epitaph) {
  return `<div class="tls-tombstone">
    ${portrait(playerName, 48)}
    <div class="tls-tombstone-name">${playerName.toUpperCase()}</div>
    <div class="tls-tombstone-epitaph">${epitaph || `Eliminated — Round ${round}`}</div>
  </div>`;
}

const EPITAPHS = [
  (n, stunt) => `Fell to the ${stunt}. The crowd went silent.`,
  (n, stunt) => `${stunt} claimed another victim. They never stood a chance.`,
  (n, stunt) => `Pride before the fall. The ${stunt} was unforgiving.`,
  (n, stunt) => `Refused the truth. Faced the wheel. Lost everything.`,
  (n, stunt) => `The gallery gains another voice. Eliminated by ${stunt}.`,
  (n, stunt) => `Fatigue caught up. The ${stunt} finished what exhaustion started.`,
];

function _closeup(playerName, text) {
  return `<div class="tls-closeup">
    <span class="tls-closeup-label">CLOSE-UP</span>
    ${portrait(playerName, 52)}
    <div class="tls-closeup-text">${text}</div>
  </div>`;
}

// ══════════════════════════════════════════════════════════════
// SHELL WRAPPER
// ══════════════════════════════════════════════════════════════
function _shell(content, ep, chaosLevel = 0) {
  const bubbleCount = 4 + chaosLevel * 2;
  const bubbles = Array.from({ length: bubbleCount }, (_, i) => {
    const left = 5 + (i * 37 + 13) % 90;
    const size = 4 + Math.floor(i * 7 % 6);
    const dur = 3 + (i % 4);
    const delay = (i * 0.7) % 3;
    return `<div class="tls-bubble-particle" style="left:${left}%;width:${size}px;height:${size}px;--dur:${dur}s;--delay:${delay}s"></div>`;
  }).join('');
  return `${_css()}<div class="tls-shell" data-chaos="${chaosLevel}">
    <div class="tls-bubbles">${bubbles}</div>
    ${content}
  </div>`;
}

// ══════════════════════════════════════════════════════════════
// SIDEBAR BUILDER
// ══════════════════════════════════════════════════════════════
function _buildSidebar(tls, revealedUpToRound) {
  let html = '';

  // Tribe survival
  for (const t of tls.tribeMembers) {
    const aliveCount = t.members.filter(m =>
      !tls.eliminated.some(e => e.player === m && e.round <= revealedUpToRound)
    ).length;
    html += `<div class="tls-side-sec" style="color:${t.color}">${_icon('spotlight')} ${t.name.toUpperCase()}</div>`;
    html += `<div style="font-size:20px;font-family:'Anton',sans-serif;color:${t.color};text-shadow:0 0 8px ${t.color}40">${aliveCount} / ${t.members.length}</div>`;

    for (const m of t.members) {
      const elim = tls.eliminated.find(e => e.player === m && e.round <= revealedUpToRound);
      const fatVal = revealedUpToRound >= 0 ? (tls.fatigue[m] || 0) : 0;
      // Only show fatigue up to revealed rounds
      let displayFatigue = 0;
      for (const r of tls.rounds) {
        if (r.type === 'victory') break;
        if (r.round > revealedUpToRound) break;
        if (r.stuntPlayer === m && r.stuntResult?.passed) displayFatigue++;
      }
      html += `<div class="tls-side-player ${elim ? 'tls-side-elim' : ''}">
        ${portrait(m, 18)}
        <span style="color:${elim ? 'rgba(255,255,255,0.3)' : '#fff'};font-size:11px">${m}</span>
        ${!elim && displayFatigue > 0 ? `<span class="tls-fatigue-dots">${Array(displayFatigue).fill('<span class="tls-fatigue-dot"></span>').join('')}</span>` : ''}
        ${elim ? `<span style="font-size:8px;color:var(--studio-red)">R${elim.round}</span>` : ''}
      </div>`;
    }
  }

  // Current round
  html += `<div class="tls-side-sec">${_icon('gavel')} ROUND</div>`;
  html += `<div style="font-size:22px;font-family:'Anton',sans-serif;color:var(--acid-yellow)">${Math.min(revealedUpToRound + 1, tls.rounds.length)} / ${tls.rounds.length}</div>`;

  // Wheel stunts
  html += `<div class="tls-side-sec">${_icon('wheel')} WHEEL</div>`;
  const removedByRound = new Set();
  for (let i = 0; i < tls.rounds.length && tls.rounds[i].round <= revealedUpToRound; i++) {
    const r = tls.rounds[i];
    if (r.type === 'victory') break;
    if (r.wheelSpin) {
      // After this round, the easiest gets removed
      // Track based on removedStunts order
    }
  }
  // Count how many stunts removed up to this round
  let removedCount = 0;
  for (const r of tls.rounds) {
    if (r.type === 'victory') break;
    if (r.round > revealedUpToRound) break;
    if (r.wheelSpin) removedCount++;
  }
  // Show each stunt, cross out if removed
  const removedIds = new Set(tls.wheel.removedStunts.slice(0, Math.max(0, removedCount)).map(s => s.id));
  for (const st of tls.wheel.stunts) {
    const removed = removedIds.has(st.id);
    html += `<div class="tls-wheel-item ${removed ? 'tls-wheel-removed' : ''}">
      ${_icon(st.icon)} ${st.name}
    </div>`;
  }

  // Heckler gallery
  const hecklers = tls.eliminated.filter(e => e.round <= revealedUpToRound);
  if (hecklers.length) {
    html += `<div class="tls-side-sec" style="color:var(--studio-red)">${_icon('megaphone')} GALLERY</div>`;
    for (const h of hecklers) {
      html += `<div class="tls-side-player" style="opacity:0.6">
        <span style="filter:grayscale(0.6)">${portrait(h.player, 16)}</span>
        <span style="font-size:10px;color:rgba(255,255,255,0.4)">${h.player}</span>
      </div>`;
    }
  }

  // Crowd energy — matches the in-feed meter formula
  const confessionCount = tls.rounds.filter(rr => rr.type !== 'victory' && rr.round <= revealedUpToRound && rr.decision === 'confess').length;
  const elimCount = hecklers.length;
  const roundsShown = tls.rounds.filter(rr => rr.type !== 'victory' && rr.round <= revealedUpToRound).length;
  const energy = Math.min(100, Math.round(15 + confessionCount * 6 + elimCount * 12 + roundsShown * 1.5));
  const energyLevel = energy >= 75 ? 'high' : '';
  html += `<div class="tls-side-sec">${_icon('bolt')} CROWD ENERGY</div>`;
  html += `<div class="tls-crowd-bar"><div class="tls-crowd-fill" data-level="${energyLevel}" style="width:${energy}%"></div></div>`;
  html += `<div style="font-size:10px;color:var(--acid-yellow);text-align:center;margin-top:2px">${energy}%${energy >= 75 ? ' HYPE' : ''}</div>`;

  return html;
}

// ══════════════════════════════════════════════════════════════
// VP SCREEN: TITLE CARD
// ══════════════════════════════════════════════════════════════
export function rpBuildTlsTitleCard(ep) {
  const tls = ep.truthOrShark;
  if (!tls) return '';

  const rosterHtml = (tribe) => tribe.members.map(m =>
    `<div class="tls-tribe-badge" style="border-color:${tribe.color}">
      ${portrait(m, 24)}
      <span style="color:${tribe.color}">${m}</span>
    </div>`
  ).join('');

  const wheelHtml = tls.wheel.stunts.map(s =>
    `<span style="display:inline-flex;align-items:center;gap:3px;padding:2px 6px;border:1px solid rgba(0,240,255,0.2);border-radius:3px;font-size:9px;color:rgba(255,255,255,0.6);margin:2px">${_icon(s.icon)} ${s.name}</span>`
  ).join('');

  const fins = `<div class="tls-tank">
    <div class="tls-fin" style="animation-delay:0s"><span class="tls-icon-shark"></span></div>
    <div class="tls-fin" style="animation-delay:3s;top:12px"><span class="tls-icon-shark"></span></div>
    <div class="tls-bubble" style="left:20%;animation-delay:0.5s"></div>
    <div class="tls-bubble" style="left:50%;animation-delay:1.2s"></div>
    <div class="tls-bubble" style="left:75%;animation-delay:2s"></div>
  </div>`;

  // Build tribe blocks — vertical stack, VS dividers between each
  const tribeBlocks = tls.tribeMembers.map((t, i) => {
    const vsBar = i < tls.tribeMembers.length - 1
      ? `<div style="display:flex;align-items:center;gap:12px;justify-content:center;margin:12px 0">
          <div style="flex:1;max-width:120px;height:1px;background:linear-gradient(90deg,transparent,var(--neon-pink))"></div>
          <span style="font-family:'Anton',sans-serif;font-size:20px;color:var(--neon-pink);text-shadow:0 0 12px rgba(255,45,149,0.4);letter-spacing:4px">VS</span>
          <div style="flex:1;max-width:120px;height:1px;background:linear-gradient(90deg,var(--neon-pink),transparent)"></div>
        </div>`
      : '';
    return `<div style="text-align:center">
      <div style="font-family:'Anton',sans-serif;font-size:20px;color:${t.color};text-shadow:0 0 10px ${t.color}50;margin-bottom:8px;letter-spacing:2px">${t.name}</div>
      <div class="tls-cover-roster" style="justify-content:center">${rosterHtml(t)}</div>
    </div>${vsBar}`;
  }).join('');

  return _shell(`
    <div class="tls-cover">
      <div style="font-size:10px;letter-spacing:6px;color:rgba(0,240,255,0.4);position:relative;z-index:2">TOTAL DRAMA PRESENTS</div>
      <div class="tls-cover-title">TRUTH<br>OR SHARK</div>
      <div class="tls-cover-sub">A ${host().toUpperCase()} PRODUCTION</div>
      <div style="margin-top:16px;font-size:12px;color:rgba(255,255,255,0.6);position:relative;z-index:2;max-width:600px;margin-left:auto;margin-right:auto;line-height:1.6">
        ${_icon('shark')} <b>Confess your darkest secret</b> — or face the WHEEL.<br>
        ${_icon('wheel')} <b>Survive the stunt</b> — or join the heckler gallery.<br>
        ${_icon('megaphone')} <b>Last tribe standing</b> wins immunity.
      </div>
      <div style="margin-top:24px;position:relative;z-index:2;max-width:700px;margin-left:auto;margin-right:auto">
        ${tribeBlocks}
      </div>
      <div style="margin-top:16px;font-size:11px;color:rgba(255,255,255,0.5);position:relative;z-index:2">THE WHEEL</div>
      <div style="display:flex;flex-wrap:wrap;justify-content:center;gap:4px;margin-top:6px;position:relative;z-index:2">${wheelHtml}</div>
    </div>
    ${fins}
    <div style="padding:12px 20px;font-size:12px;color:rgba(255,255,255,0.7);line-height:1.7;position:relative;z-index:2">
      ${tls.hostIntro}
    </div>
  `, ep);
}

// ══════════════════════════════════════════════════════════════
// VP SCREEN: ROUNDS (click-to-reveal)
// ══════════════════════════════════════════════════════════════
export function rpBuildTlsRounds(ep) {
  const tls = ep.truthOrShark;
  if (!tls) return '';

  const stateKey = 'tls-rounds';
  if (!window._tvState) window._tvState = {};
  if (!window._tvState[stateKey]) window._tvState[stateKey] = { idx: -1 };
  const revIdx = window._tvState[stateKey].idx;

  // Store tls data on window for sidebar updates
  window._tlsRoundData = tls;

  // Count total steps: each round has variable steps
  // For simplicity, each round = 1 step with all its content
  const totalSteps = tls.rounds.length;

  // Build steps
  let stepsHtml = '';
  for (let i = 0; i < tls.rounds.length; i++) {
    const r = tls.rounds[i];
    const visible = i <= revIdx;
    const tribeObj = tls.tribeMembers.find(t => t.name === r.tribe);
    const tColor = tribeObj?.color || '#6366f1';

    let roundHtml = '';

    // ── VICTORY CARD (last tribe standing) ──
    if (r.type === 'victory') {
      roundHtml += `<div class="tls-glitch"></div>`;
      roundHtml += `<div class="tls-sfx" style="color:var(--slime-green);font-size:26px">GAME OVER!</div>`;
      roundHtml += `<div class="tls-confetti"><div class="tls-evt tls-evt--noframe" style="border:3px solid ${r.tribe.color};box-shadow:0 0 30px ${r.tribe.color}40">
        <div class="tls-evt-body" style="border:none;text-align:center;padding:24px">
          <div style="font-size:10px;letter-spacing:5px;color:var(--slime-green);margin-bottom:12px">${_icon('spotlight')} LAST TRIBE STANDING ${_icon('spotlight')}</div>
          <div style="font-family:'Anton',sans-serif;font-size:38px;color:${r.tribe.color};text-shadow:0 0 20px ${r.tribe.color}60;margin-bottom:16px">${r.tribe.name.toUpperCase()}</div>
          <div style="display:flex;flex-wrap:wrap;justify-content:center;gap:12px;margin-bottom:16px">
            ${r.survivors.map(m => `<div style="display:flex;flex-direction:column;align-items:center;gap:4px">
              ${portrait(m, 36)}
              <span style="font-size:11px;font-weight:700;color:${r.tribe.color}">${m}</span>
            </div>`).join('')}
          </div>
          <div style="font-size:12px;color:rgba(255,255,255,0.7);line-height:1.5">${r.survivors.length === 1
            ? `${r.survivors[0]} stood alone. The last warrior standing. ${pronouns(r.survivors[0]).Sub} won immunity for ${r.tribe.name}.`
            : `${r.survivors.slice(0, -1).join(', ')} and ${r.survivors[r.survivors.length - 1]} refused to fall. Together they held the line and won immunity for ${r.tribe.name}.`}</div>
        </div>
      </div></div>`;
      stepsHtml += `<div id="tls-step-rounds-${i}" style="${visible ? '' : 'display:none'}">${roundHtml}</div>`;
      continue;
    }

    // Calculate chaos level (0-4) based on eliminations so far
    const elimsSoFar = tls.rounds.slice(0, i).filter(rr => rr.elimination).length;
    const chaosLevel = Math.min(4, Math.floor(elimsSoFar / 2) + (i >= tls.rounds.length * 0.7 ? 1 : 0));

    // ── Glitch transition between rounds (not first round) ──
    if (i > 0) {
      roundHtml += `<div class="tls-glitch"></div>`;
    }

    // ── Round header bar ──
    roundHtml += `<div style="display:flex;align-items:center;gap:0;margin:20px 0 12px;border-bottom:2px solid ${tColor}40">
      <div style="font-family:'Anton',sans-serif;font-size:28px;color:var(--acid-yellow);padding:0 12px 4px 0;text-shadow:0 0 12px rgba(232,255,0,0.3)">ROUND ${r.round}</div>
      <div style="font-size:10px;letter-spacing:3px;color:${tColor};padding:3px 10px;border:1px solid ${tColor};border-radius:2px;margin-left:auto">${r.tribe.toUpperCase()}</div>
    </div>`;

    // Flavor text
    roundHtml += `<div class="tls-card-flavor">${r.flavorText}</div>`;

    // ── Audience energy meter ──
    const confessionsSoFar = tls.rounds.slice(0, i).filter(rr => rr.decision === 'confess').length;
    const elimsSoFarEnergy = tls.rounds.slice(0, i).filter(rr => rr.elimination).length;
    const energy = Math.min(100, 15 + confessionsSoFar * 6 + elimsSoFarEnergy * 12 + i * 1.5);
    roundHtml += _energyMeter(energy);

    // ── Truth question ── (envelope opening) + SFX buzzer
    roundHtml += `<div class="tls-sfx-inline" style="color:var(--acid-yellow)">BZZZZT!</div>`;
    roundHtml += `<div class="tls-evt tls-evt--truth tls-evt--noframe tls-envelope">
      <div class="tls-evt-body">
        <div class="tls-evt-head">
          ${_icon('gavel')}
          <span class="tls-evt-tag">THE QUESTION</span>
          <span style="font-size:10px;color:${tColor}">${r.tribe.toUpperCase()}</span>
        </div>
        <div class="tls-evt-text" style="font-size:15px;font-weight:700;padding:4px 0">"${r.truth.text}"</div>
      </div>
    </div>`;

    // Decision
    if (r.decision === 'confess') {
      // ── Confession — confessional booth framing ──
      const timecode = `00:${String(Math.floor(r.round * 2.3)).padStart(2, '0')}:${String(Math.floor(Math.random() * 59)).padStart(2, '0')}`;
      roundHtml += `<div class="tls-confessional">
        <div class="tls-confessional-tc">CAM B — ${timecode}</div>
        <div class="tls-evt tls-evt--confess" style="border:none;border-radius:0;background:transparent;box-shadow:none;margin:0">
          <div class="tls-evt-frame" style="z-index:6">
            ${portrait(r.truthOwner, 40)}
            <div class="tls-evt-frame-name">${r.truthOwner.split(' ').pop()}</div>
          </div>
          <div class="tls-evt-body" style="z-index:6">
            <div class="tls-evt-head">
              ${_icon('spotlight')}
              <span class="tls-evt-tag">CONFESSION</span>
              <span class="tls-evt-name">${r.truthOwner}</span>
            </div>
            <div class="tls-evt-text">${r.confession.text}</div>
          </div>
        </div>
      </div>`;

      // Reactions
      if (r.confession.reactions.length) {
        for (const reaction of r.confession.reactions) {
          const rMod = reaction.type === 'mockery' ? 'tls-evt--heckler' : reaction.type === 'sympathy' ? 'tls-evt--social' : 'tls-evt--social';
          const rColor = reaction.type === 'mockery' ? 'var(--studio-red)' : reaction.type === 'sympathy' ? 'var(--slime-green)' : 'var(--neon-cyan)';
          roundHtml += `<div class="tls-evt ${rMod}" style="margin:6px 0">
            <div class="tls-evt-frame">
              ${portrait(reaction.player, 28)}
              <div class="tls-evt-frame-name">${reaction.player.split(' ').pop()}</div>
            </div>
            <div class="tls-evt-body" style="border-color:${rColor}">
              <div class="tls-evt-head">
                <span class="tls-evt-tag" style="color:${rColor};border-color:${rColor}">${reaction.type.toUpperCase()}</span>
                ${reaction.bondDelta !== 0 ? `<span class="tls-evt-consequence" style="color:${reaction.bondDelta > 0 ? 'var(--slime-green)' : 'var(--studio-red)'};background:${reaction.bondDelta > 0 ? 'rgba(57,255,20,0.1)' : 'rgba(255,51,51,0.1)'}">${reaction.bondDelta > 0 ? '+' : ''}${reaction.bondDelta} bond</span>` : ''}
              </div>
              <div class="tls-evt-text">${reaction.text}</div>
            </div>
          </div>`;
        }
      }
      // Reaction strip after confession
      roundHtml += _reactionStrip('confess', tls.tribeMembers.flatMap(t => t.members), r.truthOwner, tls.eliminated.filter(e => e.round < r.round));
    } else {
      // ── Refusal — close-up on the silence ──
      roundHtml += _closeup(r.truthOwner || r.stuntPlayer || tls.tribeMembers[0].members[0],
        pick([`The studio held its breath. Nobody moved.`, `Eyes darted. Hands stayed down. The silence was deafening.`,
          `A bead of sweat. A nervous gulp. But no confession.`, `The truth stayed buried. For now.`]));
      roundHtml += `<div class="tls-evt tls-evt--refuse tls-evt--noframe">
        <div class="tls-evt-body">
          <div class="tls-evt-head">
            ${_icon('crack')}
            <span class="tls-evt-tag">NOBODY CONFESSED</span>
          </div>
          <div class="tls-evt-text">${r.refusalText}</div>
        </div>
      </div>`;
      roundHtml += _reactionStrip('refuse', tls.tribeMembers.flatMap(t => t.members), r.truthOwner, tls.eliminated.filter(e => e.round < r.round));

      // ── Random stunt victim selected ──
      if (r.stuntPlayer) {
        const playerFatigue = tls.fatigue[r.stuntPlayer] || 0;
        const fatigueWrap = playerFatigue >= 2 ? `<span class="tls-cracked" data-fatigue="${Math.min(4, playerFatigue)}">` : '';
        const fatigueClose = playerFatigue >= 2 ? '</span>' : '';
        roundHtml += `<div class="tls-evt tls-evt--stunt" style="margin:8px 0">
          <div class="tls-evt-frame">
            ${fatigueWrap}${portrait(r.stuntPlayer, 36)}${fatigueClose}
            <div class="tls-evt-frame-name">${r.stuntPlayer.split(' ').pop()}</div>
          </div>
          <div class="tls-evt-body">
            <div class="tls-evt-head">
              ${_icon('shark')}
              <span class="tls-evt-tag">SELECTED FOR STUNT</span>
              <span class="tls-evt-name">${r.stuntPlayer}</span>
            </div>
            <div class="tls-evt-text" style="font-size:11px;color:rgba(255,255,255,0.5)">Randomly chosen by the production wheel</div>
          </div>
        </div>`;
      }

      // ── Real wheel ──
      if (r.wheelSpin) {
        const wheelSegments = tls.wheel.stunts;
        const segAngle = 360 / wheelSegments.length;
        const WHEEL_COLORS = ['#ff2d95','#00f0ff','#e8ff00','#39ff14','#ff3333','#0066cc','#ff8c00','#9b59b6','#00cec9'];
        const segmentsCss = wheelSegments.map((s, si) => {
          const startDeg = si * segAngle;
          const endDeg = startDeg + segAngle;
          const color = WHEEL_COLORS[si % WHEEL_COLORS.length];
          const isLanded = s.id === r.wheelSpin.stuntId;
          const arcPts = [];
          const steps = Math.max(4, Math.ceil(segAngle / 10));
          for (let k = 0; k <= steps; k++) {
            const a = (startDeg + (endDeg - startDeg) * k / steps) * Math.PI / 180;
            arcPts.push(`${(50 + 50 * Math.sin(a)).toFixed(2)}% ${(50 - 50 * Math.cos(a)).toFixed(2)}%`);
          }
          const clipPath = `polygon(50% 50%,${arcPts.join(',')})`;
          return `<div style="position:absolute;inset:0;clip-path:${clipPath};background:${color};opacity:${isLanded ? 1 : 0.35}">
            <div style="position:absolute;top:${50 - 32 * Math.cos((startDeg + segAngle / 2) * Math.PI / 180)}%;left:${50 + 32 * Math.sin((startDeg + segAngle / 2) * Math.PI / 180)}%;transform:translate(-50%,-50%) rotate(${startDeg + segAngle / 2}deg);font-size:7px;font-weight:700;color:#000;text-align:center;width:50px;line-height:1.1">${s.name.split(' ').slice(0, 2).join(' ')}</div>
          </div>`;
        }).join('');

        // Calculate spin degrees — land on the correct segment
        const landedSegIdx = wheelSegments.findIndex(s => s.id === r.wheelSpin.stuntId);
        const landAngle = landedSegIdx >= 0 ? (landedSegIdx * segAngle + segAngle / 2) : 0;
        const spinDeg = 1440 + (360 - landAngle); // 4 full rotations + offset to land

        roundHtml += `<div class="tls-sfx-inline" style="color:var(--acid-yellow)">CLICK-CLICK-CLICK...</div>`;
        roundHtml += `<div class="tls-evt tls-evt--wheel tls-evt--noframe">
          <div class="tls-evt-body" style="text-align:center;align-items:center">
            <div class="tls-evt-head" style="justify-content:center">
              ${_icon('wheel')}
              <span class="tls-evt-tag">SPIN THE WHEEL</span>
            </div>
            <div style="position:relative;width:200px;height:200px;margin:12px auto;border-radius:50%;border:3px solid var(--acid-yellow);overflow:hidden;box-shadow:0 0 20px rgba(232,255,0,0.2),0 0 40px rgba(232,255,0,0.1)">
              <div class="tls-wheel-spinning" style="--spin-deg:${spinDeg}deg;position:absolute;inset:0">
                ${segmentsCss}
              </div>
            </div>
            <div style="width:0;height:0;border-left:10px solid transparent;border-right:10px solid transparent;border-top:16px solid var(--acid-yellow);margin:-3px auto 0;position:relative;z-index:5"></div>
            <div style="margin-top:12px;font-family:'Anton',sans-serif;font-size:22px;color:var(--acid-yellow);text-shadow:0 0 12px rgba(232,255,0,0.4)">${r.wheelSpin.stuntName}</div>
            <div style="font-size:10px;color:rgba(255,255,255,0.5);margin-top:2px">Difficulty: ${r.wheelSpin.difficulty}${(tls.fatigue[r.stuntPlayer] || 0) > 0 ? ` + ${((tls.fatigue[r.stuntPlayer] || 0) * 1.5).toFixed(1)} fatigue` : ''}</div>
          </div>
        </div>`;

        // ── Stunt result ──
        if (r.stuntResult) {
          const sp = r.stuntResult.player || r.stuntPlayer;
          if (r.stuntResult.passed) {
            // SFX + confetti burst
            roundHtml += `<div class="tls-sfx-inline" style="color:var(--slime-green)">SAFE!</div>`;
            roundHtml += `<div class="tls-confetti"><div class="tls-evt tls-evt--stunt">
              <div class="tls-evt-frame">
                ${portrait(sp, 36)}
                <div class="tls-evt-frame-name">${sp.split(' ').pop()}</div>
              </div>
              <div class="tls-evt-body">
                <div class="tls-evt-head">
                  ${_icon('bolt')}
                  <span class="tls-evt-tag" style="color:var(--slime-green);border-color:var(--slime-green)">SURVIVED</span>
                  <span class="tls-evt-name" style="color:var(--slime-green)">${sp}</span>
                </div>
                <div class="tls-evt-text">${r.stuntResult.text}</div>
                <div style="display:flex;gap:8px;align-items:center;margin-top:4px;font-size:10px;color:rgba(255,255,255,0.4)">
                  <span>Score: ${r.stuntResult.score} vs ${r.stuntResult.threshold}</span>
                  ${r.stuntResult.fatigue > 0 ? `<span>Fatigue: ${Array(r.stuntResult.fatigue).fill(_icon('sweat')).join('')}</span>` : ''}
                </div>
              </div>
            </div></div>`;
            // Reaction strip — crowd loves a survivor
            roundHtml += _reactionStrip('pass', tls.tribeMembers.flatMap(t => t.members), sp, tls.eliminated.filter(e => e.round <= r.round));
          } else {
            // Screen shake + SFX on elimination
            roundHtml += `<div class="tls-sfx-inline" style="color:var(--studio-red)">SPLASH!</div>`;
            roundHtml += `<div class="tls-shell-shake"><div class="tls-evt tls-evt--elim">
              <div class="tls-evt-frame">
                ${portrait(sp, 40)}
                <div class="tls-evt-frame-name">${sp.split(' ').pop()}</div>
              </div>
              <div class="tls-evt-body">
                <div class="tls-evt-head">
                  ${_icon('crack')}
                  <span class="tls-evt-tag">ELIMINATED</span>
                  <span class="tls-evt-name">${sp}</span>
                </div>
                <div class="tls-evt-text">${r.stuntResult.text}</div>
                <div style="font-size:10px;color:rgba(255,255,255,0.4);margin-top:4px">Score: ${r.stuntResult.score} vs ${r.stuntResult.threshold}</div>
              </div>
            </div></div>`;

            // Tombstone memorial
            const epitaph = pick(EPITAPHS)(sp, r.wheelSpin?.stuntName || 'the wheel');
            roundHtml += _tombstone(sp, r.round, epitaph);

            // Crowd reaction to elimination
            roundHtml += _reactionStrip('elim', tls.tribeMembers.flatMap(t => t.members), sp, tls.eliminated.filter(e => e.round <= r.round));

            // Chris reveals truth (sometimes)
            if (r.revealedAnyway && r.elimination?.forcedSecret) {
              roundHtml += `<div class="tls-evt tls-evt--reveal">
                <div class="tls-evt-frame">
                  ${portrait(r.elimination.truthOwner || r.truthOwner, 36)}
                  <div class="tls-evt-frame-name">${(r.elimination.truthOwner || r.truthOwner).split(' ').pop()}</div>
                </div>
                <div class="tls-evt-body">
                  <div class="tls-evt-head">
                    ${_icon('megaphone')}
                    <span class="tls-evt-tag">${host().toUpperCase()} REVEALS</span>
                    <span class="tls-evt-name" style="color:var(--acid-yellow)">${r.elimination.truthOwner || r.truthOwner}</span>
                  </div>
                  <div class="tls-evt-text">${r.elimination.forcedSecret}</div>
                </div>
              </div>`;

              // Resentment card
              if (r.resentment) {
                roundHtml += `<div class="tls-evt tls-evt--resentment">
                  <div class="tls-evt-frame tls-evt-frame--duo">
                    ${portrait(r.resentment.from, 24)}
                    ${portrait(r.resentment.to, 24)}
                  </div>
                  <div class="tls-evt-body">
                    <div class="tls-evt-head">
                      <span class="tls-evt-tag">RESENTMENT</span>
                      <span class="tls-evt-consequence" style="color:var(--studio-red);background:rgba(255,51,51,0.1)">${r.resentment.bondDelta} bond</span>
                    </div>
                    <div class="tls-evt-text">${r.resentment.from} blames ${r.resentment.to} for not confessing.</div>
                  </div>
                </div>`;
              }
            } else if (!r.revealedAnyway) {
              roundHtml += `<div class="tls-card-flavor" style="color:rgba(255,255,255,0.4)">The secret stays buried... for now.</div>`;
            }
          }
        }
      }
    }

    // Social events
    for (const se of r.socialEvents) {
      const SE_CONFIG = {
        'showmance-moment': { icon: 'spotlight', color: 'var(--neon-pink)', label: 'SHOWMANCE' },
        'rivalry-flare': { icon: 'crack', color: 'var(--studio-red)', label: 'RIVALRY' },
        'alliance-whisper': { icon: 'megaphone', color: 'var(--neon-cyan)', label: 'ALLIANCE' },
        'heckler-outburst': { icon: 'shark', color: 'var(--studio-red)', label: 'HECKLER' },
        'secret-weaponize': { icon: 'gavel', color: 'var(--acid-yellow)', label: 'WEAPONIZED' },
        'sympathy-bond': { icon: 'slime', color: 'var(--slime-green)', label: 'SYMPATHY' },
        'paranoia-seed': { icon: 'buzzer', color: 'var(--acid-yellow)', label: 'PARANOIA' },
        'underdog-rally': { icon: 'bolt', color: 'var(--slime-green)', label: 'RALLY' },
      };
      const cfg = SE_CONFIG[se.type] || { icon: 'shark', color: 'var(--neon-cyan)', label: se.type.replace(/-/g, ' ').toUpperCase() };
      const p1 = typeof se.players[0] === 'string' && players.find(p => p.name === se.players[0]) ? se.players[0] : null;
      const p2 = typeof se.players[1] === 'string' && players.find(p => p.name === se.players[1]) ? se.players[1] : null;

      const p1Tribe = p1 ? tls.tribeMembers.find(t => t.members.includes(p1)) : null;
      roundHtml += `<div class="tls-evt tls-evt--social">
        <div class="tls-evt-frame ${p2 ? 'tls-evt-frame--duo' : ''}">
          ${p1 ? portrait(p1, p2 ? 24 : 30) : ''}
          ${p2 ? portrait(p2, 24) : ''}
          ${p1 && !p2 ? `<div class="tls-evt-frame-name">${p1.split(' ').pop()}</div>` : ''}
        </div>
        <div class="tls-evt-body" style="border-color:${cfg.color}">
          <div class="tls-evt-head">
            ${p1Tribe ? `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${p1Tribe.color};margin-right:4px"></span>` : ''}
            ${_icon(cfg.icon)}
            <span class="tls-evt-tag" style="color:${cfg.color};border-color:${cfg.color}">${cfg.label}</span>
            <span style="font-size:8px;color:rgba(255,255,255,0.3);margin-left:auto">R${i + 1}</span>
            ${se.consequences?.bondDelta ? `<span class="tls-evt-consequence" style="color:${se.consequences.bondDelta > 0 ? 'var(--slime-green)' : 'var(--studio-red)'};background:${se.consequences.bondDelta > 0 ? 'rgba(57,255,20,0.1)' : 'rgba(255,51,51,0.1)'}">${se.consequences.bondDelta > 0 ? '+' : ''}${se.consequences.bondDelta} bond</span>` : ''}
          </div>
          <div class="tls-evt-text">${se.description}</div>
        </div>
      </div>`;
    }

    // Heckler events
    for (const he of r.hecklerEvents) {
      roundHtml += `<div class="tls-evt tls-evt--heckler">
        <div class="tls-evt-frame">
          ${portrait(he.player, 22)}
          <div class="tls-evt-frame-name">${he.player.split(' ').pop()}</div>
        </div>
        <div class="tls-evt-body">
          <div class="tls-evt-head">
            ${_icon('megaphone')}
            <span class="tls-evt-tag">HECKLER</span>
            <span class="tls-evt-consequence" style="color:var(--studio-red);background:rgba(255,51,51,0.1)">${he.bondDelta} bond</span>
          </div>
          <div class="tls-evt-text">${he.text}</div>
        </div>
      </div>`;
    }

    // ── Host chyron (every 3-4 rounds or on elimination) ──
    if (r.elimination || i % 3 === 2) {
      const CHYRON_POOL = [
        `THAT'S GOTTA HURT! ● THIS IS GREAT TELEVISION ● SOMEBODY GET THE MEDIC ● THE RATINGS ARE THROUGH THE ROOF`,
        `DID THAT JUST HAPPEN?! ● NOBODY SAW THAT COMING ● THE DRAMA WRITES ITSELF ● I LOVE MY JOB`,
        `OHHH! ● BRUTAL! ● THE GALLERY IS LOSING IT ● THIS IS PURE CHAOS ● EVEN I'M SHOCKED`,
        `WOW! ● THAT CONFESSION THOUGH ● THE AUDIENCE CAN'T HANDLE THIS ● PEAK TELEVISION RIGHT HERE`,
        `SPICY! ● THE SECRETS KEEP COMING ● WHO WRITES THIS STUFF? OH WAIT, THEY DO ● INCREDIBLE`,
      ];
      const chyronText = pick(CHYRON_POOL);
      roundHtml += `<div class="tls-chyron">
        <div class="tls-chyron-label">${_icon('megaphone')} LIVE</div>
        <div class="tls-chyron-text" style="padding-left:60px">${chyronText}</div>
      </div>`;
    }

    stepsHtml += `<div id="tls-step-rounds-${i}" style="${visible ? '' : 'display:none'}">${roundHtml}</div>`;
  }

  // Overall chaos level for the shell (based on total eliminations)
  const overallChaos = Math.min(4, Math.floor(tls.eliminated.length / 2));

  // Build sidebar (gated by revIdx)
  const sidebarHtml = _buildSidebar(tls, revIdx >= 0 ? tls.rounds[Math.min(revIdx, tls.rounds.length - 1)]?.round || 0 : 0);

  return _shell(`
    <div class="tls-hud">
      <div class="tls-hud-cell">
        <div class="tls-hud-val">${tls.rounds.length}</div>
        <div class="tls-hud-lbl">ROUNDS</div>
      </div>
      <div class="tls-hud-cell">
        <div class="tls-hud-val">${tls.eliminated.length}</div>
        <div class="tls-hud-lbl">ELIMINATED</div>
      </div>
      <div class="tls-hud-cell">
        <div class="tls-hud-val">${tls.rounds.filter(r => r.decision === 'confess').length}</div>
        <div class="tls-hud-lbl">CONFESSIONS</div>
      </div>
      <div class="tls-hud-cell">
        <div class="tls-hud-val">${tls.wheel.remaining.length}</div>
        <div class="tls-hud-lbl">STUNTS LEFT</div>
      </div>
    </div>
    <div class="tls-layout">
      <div class="tls-feed">
        ${stepsHtml}
      </div>
      <div class="tls-sidebar" id="tls-sidebar-rounds">
        ${sidebarHtml}
      </div>
    </div>
    <div class="tls-controls" id="tls-controls-rounds">
      <button class="tls-btn" onclick="tlsRevealNext('tls-rounds',${totalSteps})">NEXT ${_icon('gavel')}</button>
      <button class="tls-btn tls-btn-pink" onclick="tlsRevealAll('tls-rounds',${totalSteps})">REVEAL ALL</button>
      <span class="tls-counter">${Math.max(0, revIdx + 1)} / ${totalSteps}</span>
    </div>
    <div class="tls-done" id="tls-done-rounds" style="display:none">${_icon('shark')} ALL ROUNDS REVEALED ${_icon('shark')}</div>
  `, ep, overallChaos);
}

// ══════════════════════════════════════════════════════════════
// VP SCREEN: RESULTS
// ══════════════════════════════════════════════════════════════
export function rpBuildTlsResults(ep) {
  const tls = ep.truthOrShark;
  if (!tls) return '';

  const stateKey = 'tls-results';
  if (!window._tvState) window._tvState = {};
  if (!window._tvState[stateKey]) window._tvState[stateKey] = { idx: -1 };
  const revIdx = window._tvState[stateKey].idx;

  // Steps: winner + one per non-winning tribe + breakdown
  const winTribe = tls.tribeMembers.find(t => t.name === tls.winningTribe);
  const rankedTribes = (tls.tribesRanked || [tls.winningTribe, tls.losingTribe])
    .map(name => tls.tribeMembers.find(t => t.name === name))
    .filter(Boolean);
  const nonWinners = rankedTribes.filter(t => t.name !== tls.winningTribe);
  const totalSteps = 1 + nonWinners.length + 1; // winner + losers + breakdown

  // Step 0: Winner celebration
  let step0 = `<div class="tls-sfx" style="color:var(--acid-yellow);font-size:22px">DING DING DING!</div>
  <div class="tls-confetti"><div class="tls-results-winner">
    <div style="font-size:10px;letter-spacing:4px;color:var(--slime-green);margin-bottom:8px">${_icon('spotlight')} WINNER ${_icon('spotlight')}</div>
    <div style="font-family:'Anton',sans-serif;font-size:42px;color:${winTribe.color};text-shadow:0 0 20px ${winTribe.color}60">${tls.winningTribe}</div>
    <div style="font-size:13px;color:rgba(255,255,255,0.7);margin-top:8px">Tribe immunity earned! Safe from tribal council.</div>
    <div class="tls-cover-roster" style="margin-top:12px">
      ${winTribe.members.map(m => `<div class="tls-tribe-badge" style="border-color:${winTribe.color}">
        ${portrait(m, 28)} <span style="color:${winTribe.color}">${m}</span>
        <span style="font-size:9px;color:rgba(255,255,255,0.4)">${tls.scores[m] || 0}pts</span>
      </div>`).join('')}
    </div>
  </div></div>`;

  // Steps 1..N: Non-winning tribes (ranked best to worst)
  const loserSteps = nonWinners.map((loseTribe, li) => {
    const isLastPlace = li === nonWinners.length - 1;
    return `<div class="tls-results-loser">
      <div style="font-size:10px;letter-spacing:4px;color:var(--studio-red);margin-bottom:8px">${_icon('crack')} ${isLastPlace ? 'DEFEATED' : 'ELIMINATED'} ${_icon('crack')}</div>
      <div style="font-family:'Anton',sans-serif;font-size:36px;color:${loseTribe.color};opacity:0.6">${loseTribe.name}</div>
      <div style="font-size:13px;color:rgba(255,255,255,0.5);margin-top:8px">${isLastPlace ? 'Heading to tribal council.' : 'Safe, but barely.'}</div>
      <div class="tls-cover-roster" style="margin-top:12px">
        ${loseTribe.members.map(m => {
          const elim = tls.eliminated.find(e => e.player === m);
          return `<div class="tls-tribe-badge" style="border-color:${loseTribe.color};opacity:${elim ? '0.4' : '1'}">
            ${portrait(m, 28)} <span style="color:${loseTribe.color}">${m}</span>
            ${elim ? `<span style="font-size:8px;color:var(--studio-red)">ELIM R${elim.round}</span>` : `<span style="font-size:9px;color:rgba(255,255,255,0.4)">${tls.scores[m] || 0}pts</span>`}
          </div>`;
        }).join('')}
      </div>
    </div>`;
  });

  // Breakdown step
  const allPlayers = tls.tribeMembers.flatMap(t => t.members);
  let rows = allPlayers
    .sort((a, b) => (tls.scores[b] || 0) - (tls.scores[a] || 0))
    .map(m => {
      const confessions = tls.rounds.filter(r => r.truthOwner === m && r.decision === 'confess').length;
      const stunts = tls.rounds.filter(r => r.stuntPlayer === m && r.stuntResult?.passed).length;
      const fails = tls.rounds.filter(r => r.stuntPlayer === m && r.stuntResult && !r.stuntResult.passed).length;
      const tribe = tls.tribeMembers.find(t => t.members.includes(m));
      return `<tr>
        <td>${portrait(m, 18)} ${m}</td>
        <td style="color:${tribe?.color || '#fff'}">${tribe?.name || '?'}</td>
        <td>${confessions}</td>
        <td>${stunts}</td>
        <td style="color:var(--studio-red)">${fails}</td>
        <td>${tls.fatigue[m] || 0}</td>
        <td style="font-weight:700;color:var(--acid-yellow)">${tls.scores[m] || 0}</td>
      </tr>`;
    }).join('');

  // MVP = top scorer from winning tribe
  const mvp = winTribe.members.reduce((best, m) =>
    (tls.scores[m] || 0) > (tls.scores[best] || 0) ? m : best, winTribe.members[0]);

  let step2 = `<div style="padding:16px">
    <div style="font-size:10px;letter-spacing:3px;color:var(--neon-cyan);margin-bottom:8px">${_icon('gavel')} FULL BREAKDOWN</div>
    <table class="tls-results-table">
      <tr><th>Player</th><th>Tribe</th><th>Confessions</th><th>Stunts Passed</th><th>Fails</th><th>Fatigue</th><th>Score</th></tr>
      ${rows}
    </table>

    <div style="margin-top:16px;text-align:center">
      <div style="font-size:10px;letter-spacing:3px;color:var(--acid-yellow);margin-bottom:6px">MOST VALUABLE PLAYER</div>
      <div style="display:flex;align-items:center;gap:8px;justify-content:center">
        ${portrait(mvp, 40)}
        <div class="tls-mvp">${mvp}</div>
      </div>
    </div>

    <div style="margin-top:16px">
      <div style="font-size:10px;letter-spacing:3px;color:var(--neon-pink);margin-bottom:6px">${_icon('megaphone')} SOCIAL EVENTS SUMMARY</div>
      <div style="font-size:11px;color:rgba(255,255,255,0.6);line-height:1.6">
        ${tls.rounds.flatMap(r => r.socialEvents).length} social events fired across ${tls.rounds.length} rounds.
        ${tls.rounds.filter(r => r.decision === 'confess').length} confessions.
        ${tls.eliminated.length} eliminations.
        ${tls.hecklerGallery.length} hecklers in the gallery.
      </div>
    </div>
  </div>`;

  // Build all result steps dynamically
  let stepsHtml = `<div id="tls-step-results-0" style="${revIdx >= 0 ? '' : 'display:none'}">${step0}</div>`;
  loserSteps.forEach((html, i) => {
    stepsHtml += `<div id="tls-step-results-${i + 1}" style="${revIdx >= i + 1 ? '' : 'display:none'}">${html}</div>`;
  });
  const breakdownIdx = 1 + loserSteps.length;
  stepsHtml += `<div id="tls-step-results-${breakdownIdx}" style="${revIdx >= breakdownIdx ? '' : 'display:none'}">${step2}</div>`;

  return _shell(`
    ${stepsHtml}
    <div class="tls-controls" id="tls-controls-results">
      <button class="tls-btn" onclick="tlsRevealNext('tls-results',${totalSteps})">NEXT ${_icon('gavel')}</button>
      <button class="tls-btn tls-btn-pink" onclick="tlsRevealAll('tls-results',${totalSteps})">REVEAL ALL</button>
      <span class="tls-counter">${Math.max(0, revIdx + 1)} / ${totalSteps}</span>
    </div>
    <div class="tls-done" id="tls-done-results" style="display:none">${_icon('shark')} RESULTS REVEALED ${_icon('shark')}</div>
  `, ep);
}

// ══════════════════════════════════════════════════════════════
// REVEAL SYSTEM
// ══════════════════════════════════════════════════════════════
function _tlsUpdateSidebar(screenKey, idx) {
  if (screenKey !== 'tls-rounds') return;
  const tls = window._tlsRoundData;
  if (!tls) return;
  const sideEl = document.getElementById('tls-sidebar-rounds');
  if (!sideEl) return;
  const revealedRound = idx >= 0 && tls.rounds[idx] ? tls.rounds[idx].round : 0;
  sideEl.innerHTML = _buildSidebar(tls, revealedRound);
}

export function tlsRevealNext(screenKey, totalSteps) {
  if (!window._tvState) window._tvState = {};
  if (!window._tvState[screenKey]) window._tvState[screenKey] = { idx: -1 };
  const state = window._tvState[screenKey];
  if (state.idx >= totalSteps - 1) return;
  state.idx++;
  const suffix = screenKey.replace('tls-', '');
  const el = document.getElementById(`tls-step-${suffix}-${state.idx}`);
  if (el) { el.style.display = ''; el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
  if (state.idx >= totalSteps - 1) {
    const controls = document.getElementById(`tls-controls-${suffix}`);
    const done = document.getElementById(`tls-done-${suffix}`);
    if (controls) controls.style.display = 'none';
    if (done) done.style.display = '';
  }
  _tlsUpdateSidebar(screenKey, state.idx);
}

export function tlsRevealAll(screenKey, totalSteps) {
  if (!window._tvState) window._tvState = {};
  if (!window._tvState[screenKey]) window._tvState[screenKey] = { idx: -1 };
  const state = window._tvState[screenKey];
  const suffix = screenKey.replace('tls-', '');
  for (let i = state.idx + 1; i < totalSteps; i++) {
    const el = document.getElementById(`tls-step-${suffix}-${i}`);
    if (el) el.style.display = '';
  }
  state.idx = totalSteps - 1;
  const controls = document.getElementById(`tls-controls-${suffix}`);
  const done = document.getElementById(`tls-done-${suffix}`);
  if (controls) controls.style.display = 'none';
  if (done) done.style.display = '';
  _tlsUpdateSidebar(screenKey, state.idx);
}
