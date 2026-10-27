// Shapes the Big Brother code passes around, for the type checker only
// (tsconfig.bb.json, `npm run typecheck:bb`). Nothing loads this at runtime.
// Use them from JSDoc as `BB.Step`, `BB.Ballot`... with no import. The shapes every show
// shares (stats, archetypes, pronouns) are in franchise.d.ts as `DC.*`.

declare namespace BB {
  /** What one click of the stepped viewer shows (js/vp-bb-ep/screens.js draws the six kinds). */
  type StepKind = 'beat' | 'bb' | 'host' | 'say' | 'dr' | 'voice';

  interface Step {
    /** A StepKind. Typed as a string because plain JS widens 'beat' to string the moment a step
     *  sits in a variable; tests/bb-step-kinds.test.js checks every written kind instead. */
    k: string;
    /** The words on screen. */
    t: string;
    /** Who says it, for `say`, `dr` and `voice`. */
    by?: string;
    /** Which rule of the twist this step explains (the rule card beside it). */
    rule?: string | number;
    /** A banner: [text, colour]. */
    toast?: string[];
    /** Moves the ledger's Head of Household badge to this name from here on. */
    hoh?: string;
    /** Where people stand: [name, percent across]. */
    at?: (string | number)[][];
    /** The many one-off animation cues (shake, confetti, door, vetoPlay...). */
    [cue: string]: any;
  }

  /** One line of a written scene (js/bb/story/write.js). */
  interface Line {
    kind: string;
    text: string;
    by?: string;
    [more: string]: any;
  }

  /** A written house-life scene (js/bb/story/write.js), as the director airs it. */
  interface Scene {
    id: string;
    type?: string;
    step?: string;
    outcome?: string;
    room?: string;
    roomName?: string;
    cast: string[];
    lines?: Line[];
    /** The side panel's reasons, and the alliance title when one forms on screen. */
    why?: any[];
    title?: any;
    [more: string]: any;
  }

  /** One houseguest's vote to evict, as week.js builds and then moves it before the live vote. */
  interface Ballot {
    voter: string;
    /** Who they vote out tonight. */
    evict: string;
    /** Who they wanted out before anything moved them. */
    preference?: string;
    changed?: boolean;
    margin?: number;
    /** What they told the house they would do, and whether that was a lie. */
    stated?: string;
    lied?: any;
    brokePromiseTo?: string;
    /** What moved the vote: a final plea, the Diamond Power of Veto replay, an alliance. */
    pleaMove?: any;
    dpovMove?: boolean;
    dpovAdded?: boolean;
    blocMove?: string;
    [more: string]: any;
  }
}
