/* ----- src/game-states.ts ----- */

/**
 * Transitions to a different game state and runs any transition-specific code. Use this to change
 * game states - do not set `Globals.gameState` directly!
 */
changeGameState = (newState: GameState) => {
    // run code for EXITING the current state
    switch (Globals.gameState) {
        case GameState.TEXT_EDITOR:
            TextEditor.active = false;
            break;
        // case GameState.DOCUMENTATION:
        //     // swap the active div
        //     Globals.sketchDiv.style.display = "block";
        //     Globals.docsDiv.style.display = "none";
        //     break;
    }
    // run code for ENTERING the new state
    switch (newState) {
        case GameState.TEXT_EDITOR:
            TextEditor.active = true;
            UIManager.setCurrentPage("text editor");
            break;
        case GameState.GAMEPLAY:
            UIManager.setCurrentPage("canvas");
            break;
        // case GameState.DOCUMENTATION:
        //     // swap the active div
        //     Globals.sketchDiv.style.display = "none";
        //     Globals.docsDiv.style.display = "block";
        //     break;
        
    }
    Globals.gameState = newState;
};

interface IGameStateHandler {
    update(): void;
    render(rt?: p5 | p5.Graphics): void;
    keyPressed?(e: KeyboardEvent): void;
    keyReleased?(e: KeyboardEvent): void;
    mousePressed?(e: MouseEvent): void;
    mouseReleased?(e: MouseEvent): void;
}

/**
 * Holds update and render functions for every game state.
 */
const GAME_STATE_HANDLERS: { [key in GameState]: IGameStateHandler } = {
    [GameState.TEXT_EDITOR]: {
        update() {
            TextEditor.update();
            UIManager.update();
        },
        render(rt) {
            TextEditor.render();
            UIManager.render();
        },
        keyPressed(e) {
            TextEditor.keyPressed(e);
        },
        keyReleased(e) {
            TextEditor.keyReleased(e);
        },
        mousePressed(e) {
            UIManager.mousePressed();
        },
    },
    // this is an IIFE so i can do some logic in it
    [GameState.GAMEPLAY]: (()=>{
        let showUI = true;
        return {
            update() {
                Turtle.updateGlide();
                if (showUI) {
                    UIManager.update();
                }
            },
            render(rt: p5 | p5.Graphics) {
                rt.background("#ffffff");
                Turtle.render();
                DevConsole.render();
                if (showUI && DevConsole.getDisplayMode() !== DevConsole.DisplayMode.FULL) {
                    UIManager.render();
                }
            },
            keyPressed(e: KeyboardEvent) {
                if (e.key === "e" && DevConsole.getDisplayMode() !== DevConsole.DisplayMode.FULL) {
                    showUI = !showUI;
                    if (showUI) {
                        DevConsole.setDisplayMode(DevConsole.DisplayMode.FIRST_LINE);
                    }
                    else {
                        DevConsole.setDisplayMode(DevConsole.DisplayMode.NONE);
                    }
                }
                else if (e.key === "`") {
                    const prevMode = DevConsole.getDisplayMode();
                    if (prevMode === DevConsole.DisplayMode.NONE) {
                        DevConsole.setDisplayMode(DevConsole.DisplayMode.FIRST_LINE);
                     }
                    else if (prevMode === DevConsole.DisplayMode.FIRST_LINE) {
                        DevConsole.setDisplayMode(DevConsole.DisplayMode.FULL);
                    }
                    else {
                        DevConsole.setDisplayMode(DevConsole.DisplayMode.NONE);
                    }
                }
                DevConsole.keyPressed(e);
            },
            mousePressed(e: MouseEvent) {
                if (showUI && DevConsole.getDisplayMode() !== DevConsole.DisplayMode.FULL) {
                    UIManager.mousePressed();
                }
                DevConsole.mousePressed();
            },
        };
    })(),
    // this is a dummy game state for use when viewing the docs. the update and render functions
    // do nothing, but still need to be defined because of how the system is structured
    // [GameState.DOCUMENTATION]: {
    //     update() {},
    //     render() {}
    // }
}

/* ----- end of file ----- */