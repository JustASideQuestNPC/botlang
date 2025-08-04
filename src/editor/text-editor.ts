/* ----- src/editor/text-editor.ts ----- */

// TODO: refactor all my existing code to use typescript namespaces
namespace TextEditor {
    /**
     * Enum for all "types" of text. This does nothing right now and only exists as future-proofing
     * for if I ever get around to adding syntax highlighting.
     */
    enum EditorToken {
        TEXT_BASE, // currently used for all text
        // none of these are actually used but i'm still annotating them so i remember what they do
        KEYWORD, // base keywords (for, if, etc.)
        VARIABLE, // variable names
        FUNCTION, // function names
        STRING_LITERAL, // quoted strings
        NUMBER_LITERAL, // numbers
        BOOLEAN_LITERAL, // booleans
        COMMENT, // comments
    }

    /**
     * All editor colors.
     */
    const COLORS = [
        // this is actually my vscode color scheme, which is kind of cool
        "#abb2bf", // EditorToken.TEXT_BASE
        "#c678dd", // EditorToken.KEYWORD
        "#be5046", // EditorToken.VARIABLE
        "#61aeee", // EditorToken.FUNCTION
        "#98c379", // EditorToken.STRING_LITERAL
        "#d19a66", // EditorToken.NUMBER_LITERAL
        "#d19a66", // EditorToken.BOOLEAN_LITERAL
        "#5c6370"  // EditorToken.COMMENT
    ];

    const BACKGROUND_COLOR = "#282c34";
    const CURSOR_COLOR = "#61aeee";
    const INDENT_INDICATOR_COLOR = "#5c6370"; // lines showing indentation
    const LINE_NUMBER_COLOR = "#5c6370";
    const TAB_SIZE = 4;
    const TEXT_SIZE = 16;
    const MAX_LINES = 26;

    /**
     * All special keys that the editor should pick up.
     */
    const CONTROL_KEYS = [
        "Enter", "Backspace", "Delete", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Tab"
    ];

    /** Callback functions for hotkeys. */
    const HOTKEYS: { [key: string]: () => void } = {
        "r": () => {
            BotLang.run(getText());
            changeGameState(GameState.GAMEPLAY);
            controlHeld = false;
            keyQueue = [];
        }
    };

    let p5: p5;
    // all strings that have been pressed since the last update
    let keyQueue: string[];
    // line currently being typed on
    let currentLine: number;
    // cursor position on that line
    let cursorPos: number;
    // text sides for displaying stuff
    let charWidth: number;
    let lineHeight: number;
    let maxDisplayLength: number; // how many characters can be onscreen

    // offsets to keep the cursor onscreen
    let displayX: number;
    let displayY: number;

    /** Whether the control key is held down. */
    let controlHeld: boolean;

    /**
     * All text in the editor. Storing each line as an array of strings seems weird but it makes
     * coloring text a lot easier.
     */
    let editorText: string[][];
    let indentLevels: number[];

    // for the fancy visual effect where the cursor flashes
    let cursorFlashTimer: number;
    let showCursor: boolean;

    // sets the current line and handles display offsets
    function setCurrentLine(line: number) {
        currentLine = line;
        // there's probably a better way to do this but whatever
        while (displayY > currentLine) {
            --displayY;
        }
        while (displayY + MAX_LINES <= currentLine) {
            ++displayY;
        }
    }

    // sets the cursor position and handles display offsets
    function setCursorPos(pos: number) {
        cursorPos = pos;
        // there's probably a better way to do this but whatever
        while (displayX > cursorPos) {
            --displayX;
        }
        while (displayX + maxDisplayLength < cursorPos) {
            ++displayX;
        }
    }

    /**
     * Adds or inserts a character at the cursor position.
     */
    function addChar(char: string, color?: EditorToken): void;
    /**
     * Adds or inserts a character with a certain color.
     */
    function addChar(line: number, pos: number, char: string, color?: EditorToken): void;
    function addChar(line: number | string, pos: number | EditorToken, char?: string,
                     color: EditorToken = 0) {
        // handle overloads
        if (typeof line === "string") {
            color = pos ?? 0; // required because default parameters are weird when overloading
            char = line;
            line = currentLine;
            pos = cursorPos;
        }

        // each character is stored as a string where the first character is the character to
        // display and the next character is a number determining the color
        const charString = char + color.toString();
        // console.log(charString);

        // splice the line to push or insert - this assumes that the line exists because i don't
        // feel like adding error checking (probably a bad idea) and i trust myself not to screw
        // this up (DEFINITELY a bad idea)
        editorText[line].splice(pos, 0, charString);
    }
    /** Returns the character at a certain position. */
    function getChar(line: number, pos: number) {
        return editorText[line][pos].slice(0, 1);
    }

    // returns whether a line has any non-whitespace characters in it
    function lineHasChars(line: string[]) {
        for (const str of line) {
            // spaces will still have a color attached to them because of how text is stored
            if (str[0] !== " ") { return true; }
        }

        return false;
    }

    /** Controls whether the editor should respond to keyboard input. */
    export let active: boolean = false;

    /** Initializes the editor. This *must* be called before using any other editor functions! */
    export function init(sketch: p5) {
        p5 = sketch;

        // figure out widths and heights
        p5.push();
        p5.textFont("Roboto Mono", TEXT_SIZE);

        // add a tiny bit of extra spacing between characters
        charWidth = p5.textWidth("#") + 0.05;
        lineHeight = p5.textLeading();
        maxDisplayLength = Math.floor((p5.width - 12) / charWidth) - 5;

        p5.pop();

        // will automatically reset everything important
        clear();

        // for testing; will be removed later
        // for (let i = 0; i < 30; ++i) {
        //     addChar(i, 0, (i % 10).toString(), i % 8);
        //     editorText.push([]);
        // }
    }

    /** Handles keyboard input and all that. */
    export function update() {
        // native delta time is in milliseconds
        cursorFlashTimer -= p5.deltaTime / 1000;
        if (cursorFlashTimer <= 0) {
            showCursor = !showCursor;
            cursorFlashTimer = 0.5;
        }

        // update text
        while (keyQueue.length > 0) {
            const char = keyQueue.shift();
            // used by most keys
            const currentLineLength = editorText[currentLine].length;
            switch (char) {
                case "Enter":
                    // move everything after the cursor down a line
                    const newLine = editorText[currentLine].slice(cursorPos);
                    editorText[currentLine] = editorText[currentLine].slice(0, cursorPos);
                    // TODO: add auto-indentation
                    editorText.splice(currentLine + 1, 0, newLine);
                    setCurrentLine(currentLine + 1);
                    setCursorPos(0);
                    break;
                case "Backspace":
                    if (cursorPos === 0 && currentLine > 0) {
                        // attach anything left on this line to the previous one
                        cursorPos = editorText[currentLine - 1].length;
                        editorText[currentLine - 1] = (
                            editorText[currentLine - 1].concat(editorText[currentLine])
                        );
                        editorText.splice(currentLine, 1);
                        setCurrentLine(currentLine - 1);
                    }
                    else if (currentLineLength > 0) {
                        // parenthesis auto-delete
                        if (cursorPos <= currentLineLength - 1 && cursorPos > 0) {
                            const currentChar = getChar(currentLine, cursorPos - 1);
                            const nextChar = getChar(currentLine, cursorPos);
                            if ((currentChar === "(" && nextChar === ")") ||
                                (currentChar === "[" && nextChar === "]") ||
                                (currentChar === "{" && nextChar === "}") ||
                                (currentChar === '"' && nextChar === '"') ||
                                (currentChar === "'" && nextChar === "'")) {
                                
                                editorText[currentLine].splice(cursorPos, 1);
                            }
                        }

                        editorText[currentLine].splice(cursorPos - 1, 1);
                        setCursorPos(cursorPos - 1);
                    }
                    break;
                case "Delete":
                    if (cursorPos === currentLineLength && currentLine < editorText.length - 1) {
                        // attach anything on the next line to this one
                        editorText[currentLine] = (
                            editorText[currentLine].concat(editorText[currentLine + 1])
                        );
                        editorText.splice(currentLine + 1, 1);
                    }
                    else if (currentLineLength > 0) {
                        editorText[currentLine].splice(cursorPos, 1);
                        // setCursorPos(cursorPos - 1);
                    }
                    break;
                case "ArrowUp":
                    if (currentLine > 0) {
                        setCurrentLine(currentLine - 1);
                        if (editorText[currentLine].length < cursorPos) {
                            setCursorPos(editorText[currentLine].length);
                        }
                    }
                    else if (cursorPos > 0) {
                        setCursorPos(0);
                    }
                    break;
                case "ArrowDown":
                    if (currentLine < editorText.length - 1) {
                        setCurrentLine(currentLine + 1);
                        if (editorText[currentLine].length < cursorPos) {
                            setCursorPos(editorText[currentLine].length);
                        }
                    }
                    else if (cursorPos < currentLineLength) {
                        setCursorPos(currentLineLength);
                    }
                    break;
                case "ArrowLeft":
                    if (cursorPos > 0) {
                        setCursorPos(cursorPos - 1);
                    }
                    else if (currentLine > 0) {
                        setCurrentLine(currentLine - 1);
                        setCursorPos(editorText[currentLine].length);
                    }
                    break;
                case "ArrowRight":
                    if (cursorPos < currentLineLength) {
                        setCursorPos(cursorPos + 1);
                    }
                    else if (currentLine < editorText.length - 1) {
                        setCurrentLine(currentLine + 1);
                        if (editorText[currentLine].length < cursorPos) {
                            setCursorPos(0);
                        }
                    }
                    break;
                case "Tab":
                    // add spaces to the next indentation level
                    do {
                        addChar(" ");
                        setCursorPos(cursorPos + 1);
                    } while (cursorPos % TAB_SIZE !== 0);
                    break;
                default:
                    addChar(char); // adds a character at the cursor with the default color
                    setCursorPos(cursorPos + 1);
                    // handle parenthesis autocomplete
                    if (char === "(") {
                        addChar(")");
                    }
                    else if (char === "[") {
                        addChar("]");
                    }
                    else if (char === "{") {
                        addChar("}");
                    }
                    else if (char === '"') {
                        addChar('"');
                    }
                    else if (char === "'") {
                        addChar("'");
                    }
                    break;
            }
            
            showCursor = true;
            cursorFlashTimer = 0.5;
        }
    }

    /** Draws the editor onscreen. */
    export function render() {
        p5.background(BACKGROUND_COLOR);

        // draw text
        p5.textFont("Roboto Mono", TEXT_SIZE);
        p5.textAlign("left", "top");

        p5.push();
        // easier than trying to offset everything in the display functions
        p5.translate(-displayX * charWidth, -displayY * lineHeight);

        for (let y = displayY; y < editorText.length && y < displayY + MAX_LINES; ++y) {
            // line numbers
            p5.noStroke();
            p5.fill(LINE_NUMBER_COLOR);
            p5.text(`${y + 1}`.padStart(3), displayX * charWidth + 6, y * lineHeight + 6);

            // divider
            p5.stroke(LINE_NUMBER_COLOR);
            p5.strokeWeight(1);
            p5.line(
                charWidth * (displayX + 4) + 6, y * lineHeight + 3,
                charWidth * (displayX + 4) + 6, (y + 1) * lineHeight + 3
            );

            if (lineHasChars(editorText[y])) {
                let reachedChar = false; // for showing indentation level
                for (let x = displayX; x < editorText[y].length; ++x) {
                    // the first character in the string is the character to display
                    const char = editorText[y][x][0];
                    if (char !== " ") {
                        // remaining characters are a number determining the color
                        const colorString = editorText[y][x].slice(1);
                        p5.noStroke();
                        p5.fill(COLORS[Number.parseInt(colorString)]);
                        
                        p5.text(char, (x + 5) * charWidth + 6, y * lineHeight + 6);

                        reachedChar = true;
                    }
                    else if (!reachedChar && x !== 0 && x % TAB_SIZE === 0) {
                        // display indentation level
                        p5.stroke(INDENT_INDICATOR_COLOR);
                        p5.strokeWeight(1);
                        p5.line(
                            (x + 5) * charWidth + 6, y * lineHeight + 3,
                            (x + 5) * charWidth + 6, (y + 1) * lineHeight + 3
                        )
                    }
                }
            }
        }

        // draw cursor
        if (showCursor) {
            const cursorX = charWidth * (cursorPos + 5) + 6;
            p5.stroke(CURSOR_COLOR);
            p5.strokeWeight(2);
            p5.line(
                cursorX, currentLine * lineHeight + 6, cursorX, (currentLine + 1) * lineHeight + 2
            );
        }

        p5.pop();
    }

    /** Returns all text in the editor as a single string. */
    export function getText() {
        let output = "";
        for (const line of editorText) {
            for (const char of line) {
                output += char[0];
            }
            output += "\n";
        }
        // remove the trailing newline
        return output.slice(0, -1);
    }

    /** Replaces all text in the editor with a new block of text. */
    export function setText(text: string) {
        clear();
        for (const char of text) {
            if (char === "\n") {
                editorText.push([]);
                setCurrentLine(currentLine + 1);
                setCursorPos(0);
            }
            else {
                addChar(char);
                setCursorPos(cursorPos + 1);
            }
        }
        // reset cursor position to the top
        setCurrentLine(0);
        setCursorPos(0);
    }

    /** Removes all text in the editor. */
    export function clear() {
        keyQueue = [];
        currentLine = 0;
        cursorPos = 0;
        editorText = [[]];
        indentLevels = [0];
        cursorFlashTimer = 0.5;
        showCursor = true;
        displayX = 0;
        displayY = 0;
        controlHeld = false;
    }

    export function keyPressed(e: KeyboardEvent) {
        if (e.key === "Control") {
            controlHeld = true;
        }
        // handle hotkeys
        if (controlHeld) {
            if (HOTKEYS[e.key]) { HOTKEYS[e.key](); }
        }
        // otherwise ignore everything except control keys and displayable characters
        else if ((e.key.length === 1 || CONTROL_KEYS.includes(e.key)) && !controlHeld) {
            keyQueue.push(e.key);
        }
    }

    export function keyReleased(e: KeyboardEvent) {
        if (e.key === "Control") {
            controlHeld = false;
        }
    }
}

/* ----- end of file ----- */