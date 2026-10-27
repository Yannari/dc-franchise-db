// What the browser pages put on `window` for the Big Brother viewer to reach
// (main.js exposes every module's exports there for onclick handlers), and the
// one Node global the shared code reads behind a `typeof process` guard.
// Read by tsconfig.bb.json only; nothing loads this file at runtime.

declare global {
  interface Window {
    gs: any;
    audio: any;
    vpScreens: any[];
    vpCurrentScreen: number;
    vpEpNum: number;
    _vpEpNum: number;
    vpNext: () => void;
    vpGoTo: (i: number) => void;
    openVisualPlayer: (...args: any[]) => void;
    _bbx: any;
    _bbxFast: any;
  }

  // Every HTML and SVG element has these (HTMLOrSVGElement, ElementCSSInlineStyle), but
  // querySelector returns a plain Element, which the DOM types leave them off.
  interface Element {
    dataset: DOMStringMap;
    style: CSSStyleDeclaration;
  }

  interface HTMLElement {
    /** Set once the viewer has hooked Esc-leaves-fullscreen on its player (vp-bb-ep/screens.js). */
    _bbxTvExit?: boolean;
  }

  // Tests and probes run the same modules under Node; browser code only reads
  // it as `typeof process !== 'undefined' && process.env...`.
  var process: { env: Record<string, string | undefined> } | undefined;
}

export {};
