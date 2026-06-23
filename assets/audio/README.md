# Ambient background music (drop-in)

The simulator's **sound effects** (torch snuff, vote ticks, idol sting, etc.)
are synthesized in the browser — no files needed. The **background ambient
beds** play your own mp3s instead. Until you add the files below, the
background is **silent** (the old synth drone is gone), and only SFX play.

## How to enable

Drop these files into this folder (`assets/audio/`). Each plays, looped, low
in the mix under its scene. Any file you omit simply stays silent.

| Filename               | Plays under…                                  |
|------------------------|-----------------------------------------------|
| `bed-camp-day.mp3`     | Daytime camp / cold open / merge              |
| `bed-camp-night.mp3`   | Nighttime camp / jury life / finale camp      |
| `bed-tribal.mp3`       | Tribal council, votes, jury vote, fan vote    |
| `bed-victory.mp3`      | Winner ceremony / reunion                     |
| `bed-challenge.mp3`    | Immunity / reward / finale & all challenges   |
| `bed-aftermath.mp3`    | The Aftermath / Aftermayhem show              |

## File tips

- **Format:** `.mp3` (broadly supported; `.ogg`/`.m4a` also decode in most
  browsers, but keep the `.mp3` name or update the path in `js/audio.js`).
- **Loopable:** pick a track that loops cleanly — it repeats seamlessly.
- **Length:** 20–60s loops are plenty; shorter = smaller download.
- **Level:** mixed low automatically (each bed has its own volume in
  `BED_CATALOG`), so a normal-loudness track is fine.
- **Size:** keep them small (a minute of mp3 ≈ 1 MB) — they ship with the site.

## Changing volume / filenames

Edit `BED_CATALOG` in `js/audio.js` — each bed has `file` (the path) and
`volume` (0–1). Set `file: null` on a bed to fall back to the synth pad.
