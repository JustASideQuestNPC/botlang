/** ----- src/main.ts ----- */

// creates the actual sketch instance
const sketch = (p5: p5) => {
    p5.setup = () => {
        Globals.p5 = p5;

        // environment setup
        const canvas = p5.createCanvas(600, 600);

        // get a second reference to the canvas i just created, which i need because p5js is a
        // PERFECT library with NO FLAWS WHATSOEVER
        const c = document.getElementById(canvas.id());
        // helps make mouse and keyboard functions only trigger when they should
        c.tabIndex = -1;
        // disable the right-click menu
        c.addEventListener("contextmenu", (e) => e.preventDefault());
        // add input listeners for game states
        c.addEventListener("keydown", (e) => {
            // always let f12 (the console hotkey) pass through
            if (e.key === "F12") { return; }

            if (GAME_STATE_HANDLERS[Globals.gameState].keyPressed) {
                GAME_STATE_HANDLERS[Globals.gameState].keyPressed(e);
            }

            e.preventDefault();
        });
        c.addEventListener("keyup", (e) => {
            // always let f12 (the console hotkey) pass through
            if (e.key === "F12") { return; }

            if (GAME_STATE_HANDLERS[Globals.gameState].keyReleased) {
                GAME_STATE_HANDLERS[Globals.gameState].keyReleased(e);
            }

            e.preventDefault();
        });
        c.addEventListener("mousedown", (e) => {
            if (GAME_STATE_HANDLERS[Globals.gameState].mousePressed) {
                GAME_STATE_HANDLERS[Globals.gameState].mousePressed(e);
            }

            // e.preventDefault();
        });
        c.addEventListener("mouseup", (e) => {
            if (GAME_STATE_HANDLERS[Globals.gameState].mouseReleased) {
                GAME_STATE_HANDLERS[Globals.gameState].mouseReleased(e);
            }

            e.preventDefault();
        });

        // store references to the documentation and canvas containers
        Globals.sketchDiv = c;
        Globals.docsDiv = document.getElementById("docsContainer");

        // initialize everything
        UIManager.init(p5);
        TextEditor.init(p5);
        Turtle.init(p5);
        DevConsole.init(p5);
        DevConsole.setDisplayMode(DevConsole.DisplayMode.FIRST_LINE);

        // add ui pages
        UIManager.addPage({
            name: "text editor",
            elements: {
                "canvas": new TextButton({
                    x: 10, y: 540, width: 100, height: 50,
                    text: "Canvas",
                    cornerRadius: 6,
                    strokeWeight: 4,
                    strokeColor: "#61aeee",
                    fillColor: "#282c34",
                    textColor: "#61aeee",
                    hoverStrokeColor: "#c678dd",
                    hoverTextColor: "#c678dd",
                    textFont: "Roboto Mono",
                    textSize: 20,
                    callback() {
                        changeGameState(GameState.GAMEPLAY);
                    }
                }),
                "run code": new TextButton({
                    x: 120, y: 540, width: 125, height: 50,
                    text: "Run Code",
                    cornerRadius: 6,
                    strokeWeight: 4,
                    strokeColor: "#61aeee",
                    fillColor: "#282c34",
                    textColor: "#61aeee",
                    hoverStrokeColor: "#c678dd",
                    hoverTextColor: "#c678dd",
                    textFont: "Roboto Mono",
                    textSize: 20,
                    callback() {
                        BotLang.run(TextEditor.getText());
                        changeGameState(GameState.GAMEPLAY);
                    }
                }),
                // "docs": new TextButton({
                //     x: 255, y: 540, width: 70, height: 50,
                //     text: "Docs",
                //     cornerRadius: 6,
                //     strokeWeight: 4,
                //     strokeColor: "#61aeee",
                //     fillColor: "#282c34",
                //     textColor: "#61aeee",
                //     hoverStrokeColor: "#c678dd",
                //     hoverTextColor: "#c678dd",
                //     textFont: "Roboto Mono",
                //     textSize: 20,
                //     callback() {
                //         changeGameState(GameState.DOCUMENTATION);
                //     }
                // }),
                "load sample": new TextButton({
                    x: 335, y: 540, width: 160, height: 50,
                    text: "Load Sample",
                    cornerRadius: 6,
                    strokeWeight: 4,
                    strokeColor: "#61aeee",
                    fillColor: "#282c34",
                    textColor: "#61aeee",
                    hoverStrokeColor: "#c678dd",
                    hoverTextColor: "#c678dd",
                    textFont: "Roboto Mono",
                    textSize: 20,
                    callback() {
                        TextEditor.setText(SAMPLE_PROGRAMS["berry.bl"]);
                    }
                }),
            }
        });
        UIManager.addPage({
            name: "canvas",
            elements: {
                "editor": new TextButton({
                    x: 10, y: 540, width: 150, height: 50,
                    text: "Editor",
                    cornerRadius: 6,
                    strokeWeight: 4,
                    strokeColor: "#61aeee",
                    fillColor: "#ffffff",
                    textColor: "#61aeee",
                    hoverStrokeColor: "#c678dd",
                    hoverTextColor: "#c678dd",
                    textFont: "Roboto Mono",
                    textSize: 20,
                    callback() {
                        changeGameState(GameState.TEXT_EDITOR);
                    }
                }),
                "kill robot": new TextButton({
                    x: 170, y: 540, width: 200, height: 50,
                    text: "Stop Program",
                    cornerRadius: 6,
                    strokeWeight: 4,
                    strokeColor: "#61aeee",
                    fillColor: "#ffffff",
                    textColor: "#61aeee",
                    hoverStrokeColor: "#c678dd",
                    hoverTextColor: "#c678dd",
                    textFont: "Roboto Mono",
                    textSize: 20,
                    callback() {
                        BL_Interpreter.kill();
                    }
                }),
            }
        });
        
        BotLang.verboseLogging(CONSTANTS.VERBOSE_LOGGING);
        
        changeGameState(GameState.TEXT_EDITOR);
    };

    p5.draw = () => {
        GAME_STATE_HANDLERS[Globals.gameState].update();
        GAME_STATE_HANDLERS[Globals.gameState].render(p5);
    };
};

// error checks need to be disabled here because otherwise typescript explodes for some reason
// @ts-ignore
const instance = new p5(sketch);

/** ----- end of file ----- */