# Total Drama audio assets

All playback files are OGG Vorbis under `amb/`, `sfx/` and `voice/`. They are ready for explicit loading by the TD audio system; this asset-only change does not assign character voices or change playback code.

- **Ambience:** 12 stereo loops, exactly 90 seconds each, with overlapping loop transitions and no intentional fade to silence at the file boundary.
- **Effects:** 24 short cues, each below 3 seconds, with leading silence trimmed and short edge fades to avoid clicks.
- **Voice:** six original high, six mid and six low dialogue blips from dmochas's itch.io pack. The original register grouping is preserved.
- **Format:** 44.1 kHz stereo OGG Vorbis. Ambience is mixed more quietly than foreground cues; control final playback volume in the application.

Open [preview.html](preview.html) to audition every file. Ambience players loop; effects and blips play once. Playback begins only when you press Play. Automated checks cover decoding, duration, non-silence, clipping, leading silence and loop-boundary continuity; they do not replace listening.

## Sources and credits

[ CREDITS.md ](CREDITS.md) contains the required **dmochas / CC BY 4.0** credit and the public-domain recording credits. Preserve these credits with the project and include the blip credit in game audio credits when integrating playback.

[SOURCES.json](SOURCES.json) maps every output to its original recording, author, license, transformations and checksum. [verification.json](verification.json) summarizes the completed technical checks. License texts are kept in `licenses/`.

Most source recordings are by Joseph SARDIN / BigSoundBank, CC0. The crowd boo is NeoSpica's CC0 recording, retrieved from a credited public redistribution. Freesound and Pixabay blocked automated access during sourcing; no protected downloads were used.

Some cues are **designed approximations**, rather than exact field recordings:

| File | Material |
| --- | --- |
| `amb/carnival-day.ogg`, `amb/carnival-night.ogg` | Empty-fairground design: wind, sparse metal creaks, hum or night insects; no visitors or fairground music. |
| `amb/worldtour.ogg` | Cabin-style rumble assembled from ventilation and filtered propeller-plane audio. |
| `amb/rain.ogg` | Real rain on a terrace, rather than leaves. |
| `sfx/motorboat.ogg` | Ferry-engine/water excerpt, rather than a small outboard boat. |
| `sfx/bus-door.ogg` | Pneumatic-door design assembled from metal-door movement and a filtered breath hiss. |
| `sfx/jet.ogg` | Aircraft transition assembled from filtered plane audio and a rope whoosh. |
| `sfx/torch-light.ogg`, `sfx/torch-snuff.ogg` | Fire crackle layered with a whoosh or extinguishing breath. |
| `sfx/ballot-drop.ogg` | Paper-handling foley. |

## Rebuild

The development scripts require Python, NumPy and imageio-ffmpeg. No Python or FFmpeg is needed to play the assets.

1. Run `python tools/fetch_sources.py --cache <cache-directory>` to retrieve the CC0 originals.
2. Download and extract [Text/Dialogue Bleeps Pack](https://dmochas-assets.itch.io/dmochas-bleeps-pack) using itch.io's free download.
3. Run `python tools/prepare.py --sources <cache-directory> --blips <extracted-pack-directory>`.

The preparation script checks every encoded output and regenerates the manifests. Originals and tool binaries stay outside this repository.
