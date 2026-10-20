// Don's Chill Zone intro at the newer places (the 34 legs added after batch 1): (a beat and) two lines, the first
// welcoming us to that place's own mat (its `mat` plate), the second saying the last team in MAY be going home (it
// airs on non-elimination legs too, so never "will"). Same shape as the place-gated entries in narration-2.js.
const don = say => ({ by: 'don', say });
const c = (id, place, ...lines) => ({ id, ...(place ? { when: { place } } : {}),
  turns: lines.map(l => (typeof l === 'string' ? don(l) : l)) });

export default {
  'don-narrate.chill': [
    // Coast Palace: the harbour pier
    c('nc2.cp1', 'coast-palace', "The harbour pier. Home of yachts, royals, and a sea breeze that does wonders for my hair.",
      "It's this leg's Chill Zone. The last team off the motorboat may be sailing straight home."),
    c('nc2.cp2', 'coast-palace', { beat: 'Don leans on a bollard at the end of the pier, sunglasses on, yachts bobbing behind him.' },
      "Welcome to the Chill Zone. Every yacht in this harbour costs more than the prize. I asked.",
      "The last team to reach the pier could be out of the race. No pressure. Well, some pressure."),
    // Geyser Island: the rock wall
    c('nc2.gi1', 'geyser-island', "The rock wall. Home of steam, ice, and a smell like somebody boiled a giant egg.",
      "It's also the Chill Zone. The last team to get here might be heading home, fossil or no fossil."),
    c('nc2.gi2', 'geyser-island', { beat: 'Don stands on the mat at the foot of a black rock wall. A geyser blows off behind him, right on cue.' },
      "Right on time. Like me. Welcome to the Chill Zone.",
      "The last team to reach the wall may be leaving the race. In a cloud of steam, if they're lucky."),
    // Carnival Rainforest: the beach
    c('nc2.cr1', 'carnival-rainforest', "The beach. Home of golden sand, hang gliders, and the only spot in this forest with no ants in it.",
      "It's the Chill Zone for this leg. The last team to land here could be flying home."),
    c('nc2.cr2', 'carnival-rainforest', { beat: 'Don stands on the mat in a huge feathered carnival headpiece. He has clearly been wearing it all day.' },
      "Yes, I made one too. Yes, it's better than yours. Welcome to the Chill Zone.",
      "The last team to hit the sand may be out of the race. The party goes on without them."),
    // Haunted Castle: the night Chill Zone by the castle
    c('nc2.hc1', 'haunted-castle', "The castle at midnight. Home of bats, ghosts, and the best lighting I've had all season.",
      "It's this leg's Chill Zone. The last team to get here may be leaving the race. In a coffin, if they like. We have spares."),
    c('nc2.hc2', 'haunted-castle', { beat: 'Don stands on the mat below the castle walls, holding a lantern under his chin and grinning.' },
      "Welcome to the spookiest Chill Zone in the race. Relax. The only scary thing here is how good I look.",
      "The last team to find me in the dark could be going home. Boo."),
    // Lei Island: the tiki hut
    c('nc2.li1', 'lei-island', "The tiki hut. Home of flower necklaces, coconut drinks, and the best hammock on the island. It's mine.",
      "It's also the Chill Zone for this leg. The last team to arrive may get a lei and a ticket home."),
    c('nc2.li2', 'lei-island', { beat: 'Don lounges in a hammock beside the tiki hut, a flower tucked behind one ear.' },
      "Welcome to the Chill Zone. I walked over the coals too. In my head. It was very hard.",
      "The last team here could be out of the race. At least their feet get a rest."),
    // Glass Tower Gulf: the gold market
    c('nc2.gtg1', 'glass-tower-gulf', "The gold market. Gold rings, gold chains, gold watches. Finally, a Chill Zone that matches my taste.",
      "The last team to reach the mat may be going home. With no gold at all."),
    c('nc2.gtg2', 'glass-tower-gulf', { beat: 'Don stands on the mat outside the gold market, admiring a very chunky gold watch on his wrist.' },
      "Welcome to the Chill Zone. Yes, I bought it. No, it wasn't in the budget.",
      "The last team to get here might be out of the race. Sparkle while you can."),
    // Swamp Prison: the dock pavilion on the swamp
    c('nc2.sp1', 'swamp-prison', "The dock on the swamp. Home of gators, mosquitoes, and the only dry boards for miles.",
      "It's the Chill Zone for this leg. The last raft to bump into it could be carrying a team that's going home."),
    c('nc2.sp2', 'swamp-prison', { beat: 'Don waits in the pavilion on the swamp dock, swatting at mosquitoes with a tiny paper fan.' },
      "Welcome to the Chill Zone! Some of you broke out of prison today. I broke out a fresh shirt.",
      "The last team to float in may be serving the rest of their time at home."),
    // Outback Farm: the valley mat
    c('nc2.of1', 'outback-farm', "The valley. Home of rolling hills, gum trees, and absolutely no rabbits. I made sure.",
      "It's this leg's Chill Zone. The last team to touch down may be packing their bags."),
    c('nc2.of2', 'outback-farm', { beat: 'Don stands on the mat in the valley, shading his eyes as gliders drift down out of the sky.' },
      "Welcome to the Chill Zone. Coming in to land? Aim for me. Everybody does.",
      "The last team to land here could be out of the race. Soft landing, hard news."),
    // Fjord Peaks: the lake mat
    c('nc2.fp1', 'fjord-peaks', "The lake. Home of snowy peaks, still water, and a reflection of me that is honestly perfect.",
      "It's the Chill Zone for this leg. The last team to arrive might be taking one more plunge. Out of the race."),
    c('nc2.fp2', 'fjord-peaks', { beat: 'Don stands on the mat by the lake, practising a move from the gorge dance and getting it wrong.' },
      "I've been learning the dance. Don't look. Welcome to the Chill Zone.",
      "The last team to reach the lake may be heading home. With or without a fish."),
    // Prairie Ranch: the cliff-top mat
    c('nc2.pr1', 'prairie-ranch', "The cliff top. Home of big skies, tumbleweed, and a breeze that's very welcome after all those beans.",
      "It's this leg's Chill Zone. The last team up here may be riding off into the sunset. For good."),
    c('nc2.pr2', 'prairie-ranch', { beat: 'Don stands on the mat at the cliff edge in a cowboy hat, thumbs hooked in his belt.' },
      "Howdy, partners. Welcome to the Chill Zone. The hat stays on. It's working for me.",
      "The last team to ride in could be out of the race. Yee-haw. Sort of."),
    // Ice Floe: the ice Chill Zone
    c('nc2.if1', 'ice-floe', "The top of the world. Home of polar winds, narwhals, and the coldest mat in the race. Finally, a Chill Zone that means it.",
      "The last team across the ice may be going home. Somewhere warmer, at least."),
    c('nc2.if2', 'ice-floe', { beat: 'Don stands on the mat in an enormous fur hood, his breath steaming.' },
      "Welcome to the Chill Zone. I can't feel my face, and it's my best feature.",
      "The last team to get here might be left out in the cold. And out of the race."),
    // Dragon Isle: the hill mat at sunset
    c('nc2.di1', 'dragon-isle', "The hilltop at sunset. Home of jungle views, warm breezes, and no lizards. I asked twice.",
      "It's this leg's Chill Zone. The last team to climb up here could be on the next boat home."),
    c('nc2.di2', 'dragon-isle', { beat: 'Don stands on the mat at the top of the hill. A giant lizard dozes a little too close behind him.' },
      "Welcome to the Chill Zone. Don't mind him. He's harmless. Mostly. Probably.",
      "The last team to reach the hill may be out of the race. He'll see them off."),
    // Neon Desert: the magic theatre
    c('nc2.nd1', 'neon-desert', "The magic theatre. Home of lions, card tricks, and the brightest lights on the strip. Present company included.",
      "It's the Chill Zone for this leg. The last team to arrive may be doing a disappearing act. For real."),
    c('nc2.nd2', 'neon-desert', { beat: 'Don stands on the mat outside the theatre in a sparkly cape, holding a top hat.' },
      "For my next trick, I'll make a Chill Zone appear! Ta-da. Okay, it was already here.",
      "The last team through these doors could vanish from the race. Now that's magic."),
    // Pyramid Coast: the step pyramid
    c('nc2.pc1', 'pyramid-coast', "The step pyramid. Home of ancient stones, slow burros, and a sea view that's second only to my mirror.",
      "It's this leg's Chill Zone. The last team to ride in may be getting off that burro for good."),
    c('nc2.pc2', 'pyramid-coast', { beat: 'Don stands on the mat at the foot of the pyramid, sipping a tall glass of milk.' },
      "Welcome to the Chill Zone. The milk's for me. You ate the peppers. I ate nothing. Smart.",
      "The last team to reach the steps might be out of the race. That burns."),
    // Stilt River: the temple path at sunset
    c('nc2.sr1', 'stilt-river', "The temple path at sunset. Home of old stones, golden light, and a host who has never looked better.",
      "It's this leg's Chill Zone. The last team out of those tunnels may be taking the long boat home."),
    c('nc2.sr2', 'stilt-river', { beat: 'Don waits on the mat on the temple path, wiping river mud off one shoe with a hanky.' },
      "Welcome to the Chill Zone. If you caught a catfish with your bare hands today, please don't hug me.",
      "The last team to arrive could be leaving the race. Fishy, but true."),
    // Frozen Mine: the sauna
    c('nc2.fm1', 'frozen-mine', "The sauna. Home of steam, hot rocks, and the warmest Chill Zone we've ever had. Funny, that.",
      "The last team to sweat it out in here may be going home."),
    c('nc2.fm2', 'frozen-mine', { beat: 'Don sits on the top bench of the sauna in a towel, glowing.' },
      "Welcome to the Chill Zone. After ice yachts in swimsuits, you've earned this. I earned it by watching.",
      "The last team in here could be out of the race. Shame. The steam is lovely."),
    // Tea Hills: the station platform
    c('nc2.th1', 'tea-hills', "The little hill station. Home of steam trains, mountain views, and the best cup of tea I've ever had. Twelve cups, actually.",
      "It's this leg's Chill Zone. The last team off that train may be going home."),
    c('nc2.th2', 'tea-hills', { beat: 'Don stands on the station platform with a tiny teacup, little finger raised.' },
      "Welcome to the Chill Zone. Tea? No? More for me.",
      "The last team to reach the platform could be leaving the race. That's the way the tea leaf crumbles."),
    // Pampas Ranch: the cliff mat
    c('nc2.pmr1', 'pampas-ranch', "The cliff over the grasslands. Home of wild horses, wide skies, and today, a lot of emus.",
      "It's this leg's Chill Zone. The last team to walk their emu in may be going home."),
    c('nc2.pmr2', 'pampas-ranch', { beat: 'Don strikes a tango pose on the mat, a rose between his teeth. He takes it out to speak.' },
      "Welcome to the Chill Zone. It takes two to tango. It takes one to look this good.",
      "The last team in might be out of the race. Bring the emu anyway. He's earned it."),
    // Game Show City: the game show stage
    c('nc2.gsc1', 'game-show-city', "The game show stage. Home of neon, buzzers, and a studio audience that loves me. As it should.",
      "It's this leg's Chill Zone. The last team to get here may be going home without a consolation prize."),
    c('nc2.gsc2', 'game-show-city', { beat: 'Don stands on the mat under the stage lights. Behind him, a man in a panda suit waves at nobody.' },
      "Welcome to the Chill Zone! Tonight's star prize: staying in the race. Tonight's star: me.",
      "The last team to reach the stage could be out of the race. Bzzt. Wrong answer."),
    // Ice River: the ice cliff finish
    c('nc2.ir1', 'ice-river', "The ice cliff. Home of snow, wind, and a polar bear I'm told is very, very far away.",
      "It's this leg's Chill Zone. The last team to sled in here may be flying home."),
    c('nc2.ir2', 'ice-river', { beat: 'Don stands on the mat at the top of the ice cliff, glancing over his shoulder every few seconds.' },
      "Welcome to the Chill Zone. Nobody look behind me. Everything's fine.",
      "The last team to arrive could be out of the race. So hurry. For lots of reasons."),
    // Snow Peaks: the finish banner at the bottom of the slope
    c('nc2.snp1', 'snow-peaks', "The bottom of the slope. Home of mountain goats, fresh snow, and the smell of sausage. So much sausage.",
      "It's this leg's Chill Zone. The last team down the mountain may be heading home."),
    c('nc2.snp2', 'snow-peaks', { beat: 'Don stands under the finish banner in a very tight ski suit, poles crossed.' },
      "Welcome to the Chill Zone. Yes, I ski. Yes, I look this good doing it.",
      "The last team to slide in here could be out of the race. And that's the wurst."),
    // Jungle Ruins: the top of the mountain ruins
    c('nc2.jr1', 'jungle-ruins', "The top of the ruins. Home of ancient stones, golden idols, and a view almost as stunning as me.",
      "It's this leg's Chill Zone. The last team up these steps may be taking them back down. And going home."),
    c('nc2.jr2', 'jungle-ruins', { beat: 'Don stands at the top of the ruins with a golden idol under one arm, catching his breath.' },
      "Welcome to the Chill Zone. Relax, this idol's a fake. Like my tan.",
      "The last team to climb up here could be out of the race. The piranhas will be so disappointed."),
    // Glass Pyramid City: the glass pyramid at night
    c('nc2.gpc1', 'glass-pyramid-city', "The glass pyramid at night. Home of great art, bright lights, and the most famous smile in the world. Mine.",
      "The last team to reach the pyramid could be on the next flight out."),
    c('nc2.gpc2', 'glass-pyramid-city', { beat: 'Don strikes a runway pose on the mat in front of the glowing pyramid.' },
      "Welcome to the Chill Zone. I walked the runway too. Nobody saw. It was perfect.",
      "The last team to arrive could be walking right off the runway and out of the race."),
    // Fishing Cove: the red shack on the beach
    c('nc2.fc1', 'fishing-cove', "The red shack on the beach. Home of fishing boats, salty air, and a cod I did not kiss. I'm saving myself.",
      "It's this leg's Chill Zone. The last team to row ashore may not be racing tomorrow."),
    c('nc2.fc2', 'fishing-cove', { beat: "Don waits outside the red shack, holding a cod at arm's length." },
      "Welcome to the Chill Zone. You're all honorary locals now. Please stand over there.",
      "The last team here could be out of the race. And that's the cod's honest truth."),
    // Cliff Pool Isle: the resort pool
    c('nc2.cpi1', 'cliff-pool-isle', "The resort pool. Home of sun loungers, fruity drinks, and a tan I've been perfecting since breakfast.",
      "The last team to splash in could be checking out of the race. And the resort."),
    c('nc2.cpi2', 'cliff-pool-isle', { beat: 'Don floats on an inflatable chair in the pool, sunglasses on, drink in hand.' },
      "Welcome to the Chill Zone. Waterfalls, treasure, bobsleds. I did none of it, and I feel great.",
      "The last team to arrive could be out of the race. Please don't splash me on your way."),
    // Twin Tower Bridge: the foggy street
    c('nc2.ttb1', 'twin-tower-bridge', "A foggy street at night. Home of red buses, cobbled lanes, and royal guards who won't laugh at my jokes.",
      "It's this leg's Chill Zone. The last team out of the fog may be going home."),
    c('nc2.ttb2', 'twin-tower-bridge', { beat: 'Don steps out of the fog onto the mat, in a long coat and a deerstalker hat.' },
      "Welcome to the Chill Zone. The fog is free. The coat is not.",
      "The last team to find me could be out of the race. Elementary."),
    // Marble Temple Hill: the finish line by the ruins
    c('nc2.mth1', 'marble-temple-hill', "The finish line by the old ruins. Home of marble columns, ancient champions, and now, me.",
      "It's this leg's Chill Zone. The last team over the line may be running their final lap."),
    c('nc2.mth2', 'marble-temple-hill', { beat: 'Don stands on the mat in a white robe and a laurel wreath, holding a gold medal up to the light.' },
      "Welcome to the Chill Zone. The wreath? I won it. In a race against nobody. Still counts.",
      "The last team to cross the line could be leaving the race. Not every hero gets a statue."),
    // Secret Base Desert: the night desert
    c('nc2.sbd1', 'secret-base-desert', "The desert at night. Home of stars, strange lights, and a base that officially does not exist. Neither does this mat.",
      "The last team to sneak in here may get escorted all the way home."),
    c('nc2.sbd2', 'secret-base-desert', { beat: 'Don stands on the mat in the dark desert in sunglasses. A small green light blinks in the sky above him.' },
      "Welcome to the Chill Zone. If anybody asks, you never saw me. Or that.",
      "The last team to arrive could be out of the race. Beamed straight home."),
    // Fjord Sea: the buoy
    c('nc2.fs1', 'fjord-sea', "The buoy. Home of cold water, longships, and a host with excellent balance.",
      "It's this leg's Chill Zone. The last team to row out here may be rowing straight home."),
    c('nc2.fs2', 'fjord-sea', { beat: 'Don stands on a buoy in the middle of the fjord, arms out, wobbling.' },
      "Welcome to the Chill Zone. It floats. Mostly. I'd row faster if I were you.",
      "The last team to reach the buoy could be out of the race. And possibly in the water."),
    // Great Falls: the rim of the falls
    c('nc2.gf1', 'great-falls', "The rim of the falls. Home of mist, rainbows, and honeymooners who keep asking for my autograph.",
      "It's this leg's Chill Zone. The last team over that tightrope may be going home."),
    c('nc2.gf2', 'great-falls', { beat: 'Don stands on the mat at the rim of the falls, a fine spray settling on his hair.' },
      "Welcome to the Chill Zone. The mist is great for the skin. You're welcome.",
      "The last team to arrive could be out of the race. Honeymoon's over."),
    // Bamboo Wall Hills: the end of the wall at sunrise
    c('nc2.bwh1', 'bamboo-wall-hills', "The end of the wall at sunrise. Home of bamboo, old stones, and a monk with a very loud gong.",
      "The last team to reach the end of the wall might be hearing that gong for the very last time."),
    c('nc2.bwh2', 'bamboo-wall-hills', { beat: 'Don stands on the mat at the end of the wall, a gong mallet in his hand.' },
      "Welcome to the Chill Zone. The monk let me hold the mallet. He's regretting it.",
      "The last team here could be out of the race. Saved by the gong? Maybe not today."),
    // Grass Savanna: the open plain
    c('nc2.gsv1', 'grass-savanna', "The open plain. Home of zebras, lions, and the tallest grass I've ever lost a sunhat in.",
      "It's this leg's Chill Zone. The last team to track their way here may be hanging up their safari hats."),
    c('nc2.gsv2', 'grass-savanna', { beat: 'Don waits on the mat on the open plain, a sleepy-dart sticking out of his hat.' },
      "Welcome to the Chill Zone. Who did this? I'm not an animal. I'm a star.",
      "The last team to reach me could be out of the race. Sweet dreams."),
    // Stone Head Island: the grass dune
    c('nc2.shi1', 'stone-head-island', "The grass dune. Home of sea breezes, giant stone heads, and one more very handsome face. Mine.",
      "The last team to the dune may be saying goodbye to the race."),
    c('nc2.shi2', 'stone-head-island', { beat: 'Don stands on the mat on the dune, striking exactly the same pose as the stone heads behind him.' },
      "Welcome to the Chill Zone. Same jawline. Coincidence? I think not.",
      "The last team to reach the dune could be leaving the race. The condor will see them out."),
    // Badlands: the fire under the stars
    c('nc2.bl1', 'badlands', "The fire in the badlands. Home of hoodoos, dinosaur bones, and the best toasted marshmallows I've ever made.",
      "It's this leg's Chill Zone. The last team to reach the fire may be heading home with dirt under their nails."),
    c('nc2.bl2', 'badlands', { beat: 'Don sits by the fire under the stars, toasting a marshmallow on a long stick.' },
      "Welcome to the Chill Zone. Grab a log. Not that one. That's a fossil.",
      "The last team to get here could be out of the race. Extinct, you might say."),
  ],
};
