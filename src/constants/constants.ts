/** ----- src/constants.ts ----- */

/** Shared container for constants. */
const CONSTANTS = {
    /**
     * If true, logs waaay more debug info to the console when running BotScript.
     * NOTE: This will result in MANY more logs when running larger programs. You have been warned.
     */
    VERBOSE_LOGGING: false
};

enum GameState {
    TEXT_EDITOR,  // writing code in the editor
    GAMEPLAY,     // running code
    DOCUMENTATION // dummy game state used when showing the documentation
}

interface IGlobals {
    p5: p5;
    gameState: GameState;
    sketchDiv: HTMLElement;
    docsDiv: HTMLElement;
}

/** Shared container for global variables. */
const Globals: IGlobals = {
    p5: null,        // the main sketch instance
    gameState: null, // the current game state
    sketchDiv: null, // html div containing the p5 canvas
    docsDiv: null    // html div containing the documentation
};

// predefine to keep typescript happy
let changeGameState: (newState: GameState) => void;

/** ----- end of file ----- */