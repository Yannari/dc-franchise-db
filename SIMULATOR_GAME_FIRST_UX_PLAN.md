# Simulator Game-First UX Modernization Plan

Transform the simulator from a configuration-heavy administration tool into a modern season-management game. Preserve the existing simulation depth while reorganizing the interface around three clear experiences: **Create**, **Play Season**, and **Legacy**.

## Scope

- **In:** Navigation, Season Hub, Cast Builder, Season Setup, episode presentation, ongoing results, franchise progression, responsive design, accessibility, spectator mode, and interactive mode.
- **Out:** Rewriting strategy formulas, API screenplay generation, large batches of new twists, or exposing Debug information in normal gameplay.

## Design principles

- Faces and stories appear before statistics.
- Every screen has one obvious primary action.
- Advanced controls remain accessible through progressive disclosure.
- Simulation truth and television presentation remain separate.
- Important outcomes are progressively revealed in spectator mode.
- Existing saves and exports remain compatible.
- Every screen answers: Where am I? What happened? What can I do next? Why does it matter?

## Target navigation

### Before a season

1. **Create Season**
2. **Franchise**

### During a season

1. **Season Hub**
2. **Cast**
3. **Season Overview**
4. **Production**
5. **Franchise**

### After the finale

1. **Season Retrospective**
2. **Cast**
3. **Franchise**
4. **New Season**

## Action items

### 1. Establish a shared game-first design system

- [ ] Extract repeated inline styling from `simulator.html` into reusable classes or a dedicated stylesheet.
- [ ] Define consistent spacing, typography, surfaces, buttons, badges, portraits, empty states, drawers, and modals.
- [ ] Preserve the broadcast identity without making every panel equally loud.
- [ ] Reserve one accent treatment for the current primary action.
- [ ] Add hover, focus, disabled, loading, success, and error states.
- [ ] Support reduced motion and keyboard navigation.

Likely files: `simulator.html`, shared simulator CSS, `js/run-ui.js`, `js/vp-ui.js`.

### 2. Replace the tab collection with a journey-based application shell

- [ ] Group Cast Builder and Season Setup under **Create Season** before initialization.
- [ ] Make **Season Hub** the default after initialization.
- [x] Rename Results to **Season Overview** during a season and **Season Retrospective** afterward.
- [ ] Move save, import, export, reset, and debug actions into a secondary Season menu.
- [ ] Keep the season title, episode, phase, and progress visible in the header.
- [ ] Preserve direct access to advanced production tools without making them primary navigation.

### 3. Build a persistent Season Hub

- [ ] Replace the operational Run Episode layout with a game-state dashboard.
- [ ] Show season title, episode, day, phase, setting, remaining portraits, tribe membership, public statuses, previous elimination, active storylines, upcoming twist, and compact episode history.
- [ ] Present one dominant state-aware action: Initialize Season, Play Episode, Continue Episode, View Aftermath, Begin Finale, or View Retrospective.
- [ ] Keep Quick Sim, Sim Five, Sim All, replay, save, and export secondary.
- [ ] Ensure the Hub never exposes private knowledge as public information.

Likely files: `simulator.html`, `js/run-ui.js`, `js/broadcast.js`, `js/recap.js`.

### 4. Add episode lifecycle states

- [x] Model the lifecycle states observable in the current synchronous simulator: Before Episode, Episode Aftermath, Historical Review, and Finale Complete. In Progress and Tribal Pending remain Visual Player phases because simulation does not pause at those points.
- [x] After an episode, show the eliminated contestant, vote shape, advantage impact, alliance fallout, relationship changes, reputation/adaptation changes, and a concise explanation of the vote.
- [x] Keep the complete strategic model in Visual Player and Debug rather than crowding the Hub.
- [x] Offer a clear Continue to Episode action after the aftermath.

### 5. Redesign Cast Builder as a visual casting room

- [ ] Make portrait cards the dominant surface.
- [ ] Open contestant editing in a drawer instead of permanently displaying the full form.
- [ ] Show portrait, name, archetype, tribe, returnee status, and strongest attributes on each card.
- [ ] Add filters for name, archetype, season, returnee status, gender, and tribe.
- [ ] Support drag-and-drop tribes with an accessible alternative.
- [ ] Add Balance Tribes, Randomize, Snake Draft, and Preserve Relationships tools.
- [ ] Warn about severe stat imbalance, missing tribes, concentrated archetypes, and overloaded pre-existing relationships.
- [ ] Move roster synchronization, presets, import, and export into a secondary management menu.

Likely files: `simulator.html`, `js/cast-ui.js`, `js/players.js`.

### 6. Split Season Setup into Quick and Advanced modes

- [ ] Create a Quick Setup flow for identity, cast/tribes, format preset, merge/jury/finale, and final validation.
- [ ] Provide Total Drama, Survivor, Disventure Camp, Chaos, and Custom presets.
- [ ] Keep existing detailed configuration under Advanced Production.
- [ ] Display a live blueprint such as `18 players → 3 tribes → swap at 14 → merge at 11 → jury at 9 → Final 3`.
- [ ] Validate incompatible twists and impossible schedules immediately.
- [ ] End with a Season Ready checklist and one Start Season button.

Likely files: `simulator.html`, `js/settings.js`, `js/run-ui.js`, `js/twists.js`.

### 7. Make Visual Player more theatrical and readable

- [ ] Present the episode as Previously On, Camp, Challenge, Scramble, Tribal, Vote Reveal, and Aftermath.
- [ ] Use portraits consistently beside conversations, votes, plans, and relationship changes.
- [ ] Add restrained transitions for challenge wins, target shifts, advantages, parchments, ties, and eliminations.
- [ ] Provide Watch, Quick Results, and Deep Dive viewing modes.
- [ ] Keep Debug structurally and visually separate.
- [ ] Respect reduced-motion preferences and never delay navigation for animation.

Likely files: `js/vp-ui.js`, `js/vp-screens.js`, `js/vp-finale.js`, `simulator.html`.

### 8. Turn Results into a midseason Season Overview

- [x] Populate it after Episode 1 rather than waiting for the finale.
- [x] Show placement board, tribe history, challenge leaders, votes received, alliance timeline, relationship movement, strategic influence, social status, public power rankings, rising/falling players, and storyline progress.
- [x] Clearly distinguish objective outcomes, simulator interpretation, and public/edit perception.
- [x] Transform this same screen into the existing retrospective after the finale. (The richer retrospective expansion remains item 9.)

Likely files: `simulator.html`, Results renderer, `js/stats-export.js`, `js/social-status.js`.

### 9. Expand the finale into a Season Retrospective

- [x] Show winner, jury vote, placement board, finalist paths, defining moves, mistakes, challenge records, alliance outcomes, relationship outcomes, and the season story timeline.
- [x] Keep final Summary and Statistics PDF exports here.
- [x] Add an explicit Record in Franchise confirmation state.
- [x] Offer Start New Season, Build All-Stars, Open Winner Career, and View Franchise actions.

### 10. Turn Franchise into the long-term progression layer

- [ ] Add player career pages with seasons, placements, wins, finales, challenge records, strategic records, allies, rivals, betrayals, loyalty, and reputation.
- [ ] Add a Hall of Fame, record book, season comparison, historic alliances/rivalries, best partnerships, and franchise eras.
- [ ] Add suggested returnees, unfinished stories, fallen angels, redemption candidates, and automatic All-Stars pools.
- [ ] Ensure test seasons cannot overwrite canonical franchise history accidentally.

Likely files: `js/franchise-ui.js`, `js/franchise-meta.js`, `simulator.html`.

### 11. Add optional meta-game progression after the core redesign

- [ ] Add optional season objectives such as protecting a favorite, producing chaos, creating a strong Final Three, or getting a returnee to win.
- [ ] Add uncommon outcome achievements such as Perfect Game, Idol Nullification, Rock Survivor, Fallen Angel, Zero-Vote Finalist, and Successful Revenge Arc.
- [ ] Keep achievements descriptive so they never distort contestant AI.
- [ ] Add alternate-timeline comparison for replayed episodes without overwriting the primary timeline.
- [ ] Keep progression optional in spectator mode.

### 12. Preserve compatibility and isolate presentation changes

- [x] Avoid changing simulation fields solely for visual presentation.
- [x] Add optional UI state with safe defaults.
- [x] Confirm old season saves still load and continue.
- [x] Preserve Debug access to unchanged underlying data.
- [x] Preserve `current-season.html`, Worker, franchise exports, and AI-context PDF workflows.

### 13. Validate the redesign

- [ ] Add unit tests for navigation, Hub states, ongoing Results, and finale transitions.
- [ ] Add integration tests for season creation, save/reload, episode simulation, replay, merge, finale, and franchise recording.
- [ ] Add Playwright coverage for the primary journey.
- [ ] Test keyboard navigation, focus, contrast, reduced motion, and responsive layouts.
- [ ] Run `npm test`, focused browser tests, `git diff --check`, and the frontend UX audit.
- [ ] Manually test both LAN/local hosting and GitHub Pages.

## Delivery phases

### Phase 1 — Game-loop foundation

- Shared UI primitives
- Journey-based navigation
- Season Hub
- Episode lifecycle states
- Midseason Season Overview

**Success:** after initialization, the user understands the season and plays the next episode without relying on the administration sidebar.

### Phase 2 — Creation experience

- Visual Cast Builder
- Quick Setup
- Advanced Production separation
- Season Blueprint
- Ready-check validation

**Success:** a new user creates a valid season without understanding every advanced mechanic.

### Phase 3 — Presentation and game feel

- Visual Player modes
- Progressive reveals
- Portrait-driven strategy
- Episode aftermath
- Accessible transitions

**Success:** watching an episode remains entertaining without opening Debug.

### Phase 4 — Legacy and retention

- Season Retrospective
- Career pages
- Hall of Fame
- Franchise records
- Returnee and All-Stars tools

**Success:** completing a season creates meaningful persistent franchise progress.

### Phase 5 — Optional meta-game

- Objectives
- Achievements
- Alternate timelines
- Commissioner tools

**Success:** replay value increases without making contestant decisions less realistic.

## Risks and guardrails

- Do not put every existing metric on the Season Hub.
- Do not expose private knowledge as public state.
- Do not let animation delay navigation.
- Do not bury spectator mode beneath interactive controls.
- Do not remove advanced configuration when adding Quick Setup.
- Do not equate alliance membership with dependable ballots.
- Do not present directional relationships as automatically mutual.
- Do not treat power rankings as objective truth.
- Do not break old saves or franchise records.
- Do not redesign every screen simultaneously; validate one phase at a time.

## Definition of done

- [ ] The main journey is understandable without documentation.
- [ ] Every major screen has one dominant action.
- [ ] Results provide value after Episode 1.
- [ ] Season Hub is the normal home of an active season.
- [ ] Cast and setup complexity is progressively disclosed.
- [ ] Faces, relationships, and stories are more prominent than raw statistics.
- [ ] Debug remains available without leaking into normal presentation.
- [ ] Existing simulation behavior and saves remain compatible.
- [ ] Desktop and mobile layouts are usable.
- [ ] The complete automated test suite passes.

## Open questions

- Should the primary identity remain a television broadcast interface or lean further toward a reality-show management game?
- Should interactive mode represent the user as a producer, a selected contestant, or either one?
- Should Season Overview power rankings represent objective simulation strength, the television edit, or allow a toggle between both?
