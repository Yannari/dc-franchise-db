// Written by tools/rr-spots.mjs: where each stage of a staged challenge happens (the shot it is drawn in, every plate
// job counted as back). Two teams at one challenge meet only in the same spot (leg.js).
export const SPOTS = {
 "home-city": {
  "tower": { "stairwell": "task-9434855", "burn": "task-9434855", "last-flights": "task-9434855", "stairs-top": "task-9434876", "elevator": "task-9434868", "clip-on": "task-9434827", "rail": "task-9434827", "deck-top": "task-9434876" },
  "zipline": { "clip-in": "task-zip-launch", "over-lake": "task-9435028", "grab-tip": "travel-9435206", "landing": "travel-9435206" }
 },
 "fire-mountain-isle": {
  "lava-falls": { "lava-bank": "task-22425117", "stepping-stones": "task-22426413", "lava-clearing": "task-22425118", "river-raft": "task-22425199", "behind-the-falls": "task-22425199", "falls-clearing": "task-22425118" },
  "lagoon": { "lagoon-wade": "present-22424825", "the-mine": "task-22425972", "far-rocks": "task-22426225" },
  "statue": { "log-pile": "task-22426261", "the-statue": "task-22426261", "up-the-volcano": "present-22426355", "the-crater": "chill-22426500" }
 },
 "badlands": {
  "dino": { "bone-dig": "task-22424409", "carry-bones": "task-22424403", "the-frame": "present-22424203", "inspection": "Dinosaur skeletons in a fossil display-7" },
  "oil-barrel": { "old-map": "task-drill-grid", "digging": "Empty quarry, jet, barrels, and drill rig-9", "barrel-stuck": "task-22424515", "rolled-out": "task-drill-grid" }
 },
 "stone-head-island": {
  "eggs": { "the-heads": "task-22423574", "cracks-and-chins": "task-22423574", "in-the-sand": "arrive-22423541", "three-eggs": "task-22423725" },
  "condor-nest": { "spire-foot": "task-22423848", "up-the-spire": "task-22423848", "the-condor": "present-22424060", "eggs-in": "present-22424060", "climb-down": "task-22423848" }
 },
 "grass-savanna": {
  "plums": { "plum-trees": "arrive-22422915", "plum-picking": "task-22422865", "footballs": "task-22422865", "full-basket": "task-plum-elder" },
  "gourds": { "gourd-row": "task-gourd-crowd", "first-swings": "task-22422938", "last-gourds": "task-22422938", "ten-for-ten": "task-gourd-crowd" },
  "safari": { "the-tracks": "task-22423089", "tall-grass": "task-22423157", "sleepy-dart": "task-22423107", "the-tag": "task-22423107" }
 },
 "bamboo-wall-hills": {
  "wall-race": { "wall-start": "task-22422301", "wall-steps": "task-22422376", "tower-to-tower": "task-22422384", "the-gong": "task-22422303" },
  "delicacies": { "the-bowl": "task-eating-table", "the-eggs": "task-eating-table", "the-scorpions": "task-eating-table", "the-soup": "task-eating-table", "bowl-empty": "task-eating-table" }
 },
 "great-falls": {
  "wedding-slots": { "the-lever": "task-22421546", "three-hearts": "task-chapel-altar", "the-rails": "task-22421563", "the-minister": "task-chapel-altar" },
  "tightrope": { "the-harness": "task-rope-start", "first-steps": "task-22421939", "the-spray": "task-22421939", "far-rim": "task-far-rim" }
 },
 "fjord-sea": {
  "longship": { "the-heap": "task-22420280", "the-hull": "task-22420282", "mast-and-sail": "task-22420282", "the-crossing": "task-22420473", "far-shore": "task-22420280" },
  "meatball-cannon": { "load-up": "task-22420280", "take-aim": "task-cannon-deck", "fire": "task-22420280", "bullseye": "task-cannon-deck" }
 },
 "red-outback": {
  "emu-catch": { "the-corral": "task-emu-gate", "emu-chase": "task-22419889", "the-halter": "task-22419889", "mounted": "task-22419889" },
  "sheep-bungee": { "the-platform": "task-22419968", "the-drop": "task-22419612", "sheep-grab": "task-22419761", "pulled-up": "task-22419611" },
  "shearing": { "hold-still": "task-shearing-shed", "the-clippers": "task-22419762", "bald-sheep": "task-22419762", "the-brand": "task-22419761" }
 },
 "secret-base-desert": {
  "sneak-in": { "off-the-road": "task-22419058", "searchlights": "task-22419058", "the-fence": "task-22419053", "hangar-door": "task-22419328" },
  "artifact": { "the-hangar": "task-22419433", "the-crates": "task-22419433", "lift-it": "task-22419433", "past-guards": "task-22419058", "the-agent": "task-22419053" }
 },
 "marble-temple-hill": {
  "hurdles": { "on-the-line": "task-stadium-stands", "first-hurdles": "task-22418528", "last-stretch": "task-22418528", "finish-line": "chill-22418530" },
  "high-jump": { "run-up": "task-22418529", "the-leap": "task-22418529", "the-mat": "task-jump-mat" },
  "ancient-games": { "reins": "task-22418324", "first-bend": "task-22418325", "far-side": "task-22418325", "full-lap": "task-22418324", "the-circle": "task-22418328", "first-fall": "task-22418328", "three-falls": "task-22418328", "the-wreath": "task-22418328" }
 },
 "twin-tower-bridge": {
  "kidnapper": { "first-note": "present-22417669", "battlements": "task-22417670", "the-dungeon": "task-22417886", "the-guards": "present-22417669", "guard-tip": "present-22417669" },
  "crown-jewel": { "the-vault": "task-22417892", "the-table": "task-22417865", "the-pick": "task-22417865", "the-light": "task-jewel-keeper", "real-jewel": "task-jewel-keeper" }
 },
 "cliff-pool-isle": {
  "falls-dive": { "the-edge": "task-22416404", "the-jump": "present-22416327", "the-bottom": "task-22416440", "cliff-path": "present-22416327", "chest-up": "task-22416404" },
  "bobsled": { "push-off": "task-22416594", "run-one": "task-22416594", "the-loop": "task-22416502", "run-three": "task-22416600", "the-board": "chill-22416513" }
 },
 "fishing-cove": {
  "welcome-rite": { "the-shack": "task-shack-inside", "the-glass": "task-shack-inside", "the-words": "task-shack-inside", "kiss-the-cod": "task-shack-inside", "honorary-locals": "task-cove-dock" }
 },
 "glass-pyramid-city": {
  "broken-statue": { "the-plinth": "task-22415175", "galleries": "task-22415179", "the-bear": "task-22415170", "fit-it": "task-22415175", "curator-nod": "task-22415175" },
  "runway": { "the-outfit": "task-backstage", "the-walk": "task-museum-runway", "the-pose": "task-museum-runway", "walk-back": "task-museum-runway", "applause": "task-museum-runway" }
 },
 "jungle-ruins": {
  "jungle-trail": { "painted-stones": "task-22414793", "piranha-log": "task-piranha-log", "caterpillars": "task-22414456", "ruins-foot": "present-22414264" },
  "golden-idol": { "idol-wall": "task-22414655", "carvings": "task-22414655", "pick-one": "task-idol-niches", "scratch-test": "task-idol-guide", "real-gold": "task-idol-guide" }
 },
 "snow-peaks": {
  "sausage": { "the-meat": "present-22413613", "the-grinder": "present-22413613", "tie-off": "present-22413613", "sausage-ride": "present-22413612", "bottom-line": "chill-22413853" },
  "slap-dance": { "lederhosen": "chill-22413853", "first-verse": "task-22414020", "fast-part": "task-22414020", "last-beat": "task-dance-stage" }
 },
 "torch-statue-harbour": {
  "statue-climb": { "statue-foot": "arrive-22412323", "the-climb": "task-22412320", "haul-carriage": "task-22412320", "rope-ride": "task-22412320", "the-landing": "arrive-22412323" },
  "sewer": { "into-drain": "task-22412479", "the-tunnels": "task-22412499", "the-gator": "task-22412499", "the-ladder": "task-sewer-ladder" },
  "big-apple": { "wade-in": "task-park-pond", "mouth-only": "task-park-pond", "load-up": "task-park-pond", "push-it": "task-22412326", "the-fountain": "chill-22413471" }
 },
 "game-show-city": {
  "pinball": { "padded-suit": "task-22411046", "the-launch": "task-22411122", "the-bumpers": "task-22411048", "the-panda": "task-22411118", "last-target": "task-22411122", "five-lit": "task-22411046" }
 },
 "tomb-sands": {
  "pyramid": { "pyramid-foot": "present-22409867", "the-steps": "present-22409867", "the-top": "present-22409867", "down-the-side": "present-22409867", "over-tip": "task-22410503", "tomb-door": "task-22410049", "three-doors": "task-22409901", "dart-trap": "task-22409957", "scarab-room": "task-22409944", "way-out": "task-22409920" },
  "reed-boat": { "the-reeds": "task-22410534", "tie-it": "task-22410542", "cast-off": "task-22410673", "the-crocs": "task-22410673", "far-bank": "chill-22410379" }
 },
 "skyline-finale": {
  "tower-stairs": { "the-lobby": "task-9450185", "first-flights": "task-9450082", "last-flights": "task-9450082", "the-briefcase": "task-observation-deck" },
  "buoys": { "row-out": "task-9450434", "buoy-hunt": "chill-9450523", "read-number": "task-9450504", "the-lock": "task-buoy-boat", "case-open": "task-9450434" }
 },
 "treasure-isles": {
  "pirate-map": { "the-museum": "task-9449549", "unroll-maps": "task-9449621", "tug-of-war": "task-9449549", "logo-map": "task-map-room" },
  "doubloons": { "tank-on": "task-9449601", "going-under": "task-9449592", "the-tunnels": "task-9449762", "the-gold": "task-9449759", "surface": "task-9449601" }
 },
 "tea-hills": {
  "tea-basket": { "baskets-on": "task-tea-terraces", "picking": "task-tea-terraces", "fill-up": "task-tea-terraces", "the-check": "task-9448188", "tea-tip": "task-9448188" },
  "toy-train": { "catch-train": "task-9448609", "back-carriage": "task-train-inside", "squeeze-through": "task-train-inside", "front-carriage": "task-train-inside", "off-train": "chill-9448657" }
 },
 "frozen-mine": {
  "ice-yacht": { "swimsuits": "task-yacht-start", "push-off": "task-9447678", "across-ice": "task-9447678", "mine-gate": "task-9447861" },
  "borehole": { "the-harness": "task-9447866", "going-down": "task-9447790", "ball-search": "task-9447790", "winch-up": "task-9447790", "red-ball": "task-9447861" }
 },
 "stilt-river": {
  "catfish": { "wade-in": "task-9447243", "feel-around": "task-9447033", "the-basket": "task-fish-basket", "six-fish": "task-fish-basket" },
  "tunnels": { "in-the-dark": "task-9447354", "the-traps": "task-9447366", "tunnel-ends": "task-9447366", "map-box": "task-9447366", "daylight": "task-9447315" }
 },
 "pyramid-coast": {
  "pepper-cliff": { "pick-pepper": "task-9446542", "eat-pepper": "task-9446542", "the-ledge": "present-9446604", "cliff-jump": "task-9446545", "milk-swim": "task-9446588", "milk-delivered": "task-pepper-edge" }
 },
 "neon-desert": {
  "buggy-magic": { "the-remote": "task-9445821", "first-flag": "task-9445891", "the-dunes": "task-9446121", "last-flag": "task-9446132", "buggy-tip": "task-9445874", "into-cage": "task-9445798", "the-levers": "task-9445798", "lion-stirs": "task-9445798", "vanished": "task-9445798", "magic-tip": "chill-9446241" }
 },
 "dragon-isle": {
  "venom": { "the-ranger": "task-stilt-shade", "distraction": "task-9445138", "the-sponge": "task-9445138", "fill-vial": "task-9445138", "vial-tip": "task-stilt-shade" },
  "rugs": { "rug-mountain": "task-rug-clearing", "dig-in": "task-9445496", "unroll": "task-rug-clearing", "the-weaver": "task-weaver-loom", "rug-tip": "task-weaver-loom" }
 },
 "ice-floe": {
  "narwhal": { "dig-ring": "task-9444616", "the-line": "task-9444731", "the-throw": "task-9444731", "ringed": "task-9444731" },
  "igloo": { "saw-blocks": "task-9444866", "first-ring": "task-9444815", "the-dome": "task-9444815", "local-test": "chill-9444869", "igloo-tip": "task-9445014" }
 },
 "prairie-ranch": {
  "beans": { "the-pot": "task-bean-wagon", "first-half": "task-beans-table", "bean-wall": "task-beans-table", "the-bottom": "task-beans-table", "beans-tip": "task-beans-close" },
  "bull": { "saddle-up": "task-9444134", "slow-start": "task-9444232", "full-buck": "task-9444232", "eight-seconds": "task-9444232" }
 },
 "fjord-peaks": {
  "jump-dance": { "harness": "task-9443374", "the-leap": "task-9443600", "the-grab": "task-9443640", "reel-up": "task-9443600", "fish-tip": "task-9443374", "dance-lesson": "task-9443648", "the-chant": "task-9443382", "for-the-elders": "task-9443382", "elders-nod": "task-9443648" }
 },
 "outback-farm": {
  "bunnies": { "the-farmer": "task-9442837", "into-wheat": "task-9442851", "white-rabbit": "task-9442855", "the-sack": "task-9442852", "the-count": "task-9442875" }
 },
 "swamp-prison": {
  "prison-cell": { "locked-in": "task-9442108", "way-out": "task-9442206", "the-dig": "task-9442257", "the-gate": "present-9442105", "fence-tip": "present-9442105" },
  "swamp-raft": { "the-junk": "task-9442424", "lash-it": "task-9442380", "launch": "task-9442475", "downriver": "task-9442475", "the-dock": "chill-9442481" }
 },
 "savanna-falls": {
  "falls-selfie": { "into-raft": "task-9441568", "the-edge": "task-9441609", "over-falls": "task-9441555", "the-check": "task-9441900", "selfie-tip": "task-9441526" },
  "rhino": { "the-ranger": "task-ranger-line", "creep-up": "task-9441761", "rhino-pose": "task-9441524", "the-photo": "task-9441524", "rhino-tip": "task-ranger-line" }
 },
 "rock-north": {
  "sauna": { "sauna-door": "task-9440922", "the-heat": "task-9440800", "the-melt": "task-9440800", "timer-rings": "task-sauna-bank" },
  "ice-river": { "river-bank": "task-river-near", "floe-hop": "task-9440942", "the-gap": "task-9440980", "far-bank-box": "task-river-far" },
  "air-guitar": { "backstage": "task-9441040", "the-riff": "task-9441025", "the-meter": "task-9441025", "encore": "task-9441310" }
 },
 "great-wall-hills": {
  "skydive": { "the-door": "task-plane-door", "the-jump": "present-9440276", "the-drift": "present-9440425", "the-landing": "task-9440310", "centre-tip": "task-9440310" },
  "skewers": { "the-tray": "task-food-stall", "thread-em": "task-food-stall", "the-fryer": "task-9440339", "eat-em": "task-9440339", "empty-sticks": "task-9440338" },
  "rickshaw": { "pick-up": "task-9440527", "the-climb": "task-9440527", "the-bump": "task-9440758", "the-wall": "task-9440558" }
 },
 "glass-tower-gulf": {
  "squeegee-serve": { "harness-up": "task-9439716", "the-drop": "task-9439718", "wash": "task-9439718", "the-column": "present-9439891", "squeegee-tip": "task-9439716", "racket-up": "task-tennis-court", "the-serve": "task-tennis-court", "the-return": "task-tennis-court", "serve-tip": "task-9439713" }
 },
 "lei-island": {
  "ring-dive": { "the-pier": "present-9439132", "dive-down": "task-9439253", "search-sand": "task-9439101", "ring-up": "task-9439253", "ring-tip": "present-9439132" },
  "fire-walk": { "grass-skirts": "task-skirt-hut", "the-lift": "task-9439223", "the-coals": "task-9439223", "fire-dancer": "task-coals-end" }
 },
 "haunted-castle": {
  "coffin": { "find-coffin": "task-9438457", "climb-in": "task-9438457", "the-push": "present-9438407", "graveyard-gate": "chill-9438461", "grave-digger": "task-9438688" },
  "gym": { "warm-up": "task-9438736", "the-split": "task-9438665", "the-vault": "task-9438665", "coach-nods": "task-9438665" }
 },
 "carnival-rainforest": {
  "ants": { "the-mitten": "task-ant-hut", "hand-in": "task-9438117", "ant-tip": "task-9438117", "swollen": "task-ant-hut" },
  "gorge": { "gorge-edge": "task-9437972", "the-swing": "task-9437835", "coconut-pile": "task-9437837", "the-coconut": "task-9437837" },
  "costume": { "feathers": "task-9438128", "headpiece": "task-9438128", "tailpiece": "task-9438128", "the-parade": "task-9438128", "judge-cheers": "task-parade-route" }
 },
 "geyser-island": {
  "telephone": { "the-speaker": "task-speaker-box", "the-geysers": "task-9437137", "the-local": "task-geyser-far", "phrase-tip": "task-geyser-far" },
  "feast-fossil": { "the-shark": "task-feast-hut", "sheeps-head": "task-feast-hut", "the-ram": "task-feast-hut", "the-shot": "task-feast-hut", "clean-plate": "task-feast-hut", "ice-cave": "task-9437332", "find-fossil": "task-9437332", "chip": "task-9437548", "lift-out": "task-9437548", "fossil-out": "task-9437332" }
 },
 "coast-palace": {
  "shark": { "suit-up": "task-shark-deck", "in-the-water": "task-9436629", "the-pass": "task-9436629", "back-aboard": "task-shark-stern" },
  "sand-palace": { "the-plan": "task-9436639", "walls": "task-9436921", "towers": "task-9436921", "the-verdict": "task-9436921", "the-nod": "task-9436921" }
 },
 "iron-tower-city": {
  "caricature": { "the-easel": "task-9435855", "the-pose": "present-9435854", "sketch": "task-9435855", "four-things": "present-9435854", "artist-laughs": "task-easel-close" },
  "catacombs": { "manhole": "task-9436001", "tunnels": "task-catacombs", "dead-end": "task-catacomb-end", "the-cheese": "task-cheese-cave", "way-out": "task-9436302" }
 },
 "red-sand-desert": {
  "spices": { "the-alley": "task-9435287", "sniff": "task-9435287", "the-kiosk": "task-9435344", "pay-up": "task-spice-scales" },
  "stew": { "the-chef": "task-stew-door", "first-spoon": "task-9435484", "half-bowl": "task-9435484", "last-drop": "task-9435484", "empty-bowl": "task-stew-table" }
 },
 "ice-river": {
  "ice-floes": { "first-floe": "task-22411751", "mid-river": "task-22411646", "last-jump": "task-22412146", "far-bank": "task-22411924" },
  "sled": { "harness": "present-22411651", "flags": "present-22411651", "bear": "task-22411840", "swap": "task-22411924", "cliff": "present-22411652" }
 },
 "pampas-ranch": {
  "tango": { "lesson": "task-dance-academy", "practice": "task-dance-academy", "routine": "task-dance-academy", "verdict": "task-tango-floor" },
  "emu": { "bolas": "task-gaucho-post", "ride-out": "present-9449278", "throw": "task-9449177", "lead-back": "task-gaucho-post" }
 }
};

/** The spot of stage `stage` of stretch `stretch` at `place`, or null (a stage the place doesn't shoot). */
export const spotOfStage = (place, stretch, stage) => SPOTS[place]?.[stretch]?.[stage] ?? null;
