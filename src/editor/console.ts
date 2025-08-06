/* ----- src/editor/console.ts ----- */

/** Displays program output onscreen. */
namespace DevConsole {
    export enum DisplayMode {
        NONE, // displays nothing onscreen
        FIRST_LINE, // displays the most recent output at the top of the screen
        FULL, // convers the entire screen and displays all output
    }
    let displayMode: DisplayMode = DisplayMode.FIRST_LINE;
    export function getDisplayMode() { return displayMode; }
    export function setDisplayMode(mode: DisplayMode) { displayMode = mode; }

    enum MessageType {
        LOG,
        WARNING,
        ERROR
    }

    /** Message colors. */
    const COLORS = [
        "#d0d0d0", // log
        "#ffb52b", // warning
        "#ff4747"  // error
    ]

    const BACKGROUND_COLOR = "#282c34";
    const SCROLL_INDICATOR_COLOR = "#36f2ff"; // the "v v v v v v" indicator when scrolling up
    const TEXT_SIZE = 14;
    const MAX_LINES = 33;
    const BUFFER_SIZE = 100; // how many lines of output history are stored

    let p5: p5;
    let charWidth: number;
    let lineHeight: number;
    let maxDisplayLength: number;

    // the actual console output
    let output: { type: MessageType, message: string }[];

    // lines displayed onscreen when the console is in fullscreen mode, with newlines applied
    let displayLines: { color: string, text: string }[];

    // single line displayed at the top when the console is in first line mode
    let firstLine: { color: string, text: string };

    // which output types to display
    let showLogs = true;
    let showWarnings = true;
    let showErrors = true;

    function updateDisplayedLines() {
        displayLines = [];
        for (const line of output) {
            // skip anything that's been filtered out
            if (line.type === MessageType.LOG && !showLogs) { continue; }
            if (line.type === MessageType.WARNING && !showWarnings) { continue; }
            if (line.type === MessageType.ERROR && !showErrors) { continue; }

            // handle line wrapping
            for (let i = 0; i < line.message.length; i += maxDisplayLength) {
                displayLines.push({
                    color: COLORS[line.type],
                    text: line.message.slice(i, i + maxDisplayLength)
                });
            }
        }

        // update the first line
        if (output.length > 0) {
            const line = output[output.length - 1];
            if (line.message.length < maxDisplayLength) {
                firstLine = {
                    color: COLORS[line.type],
                    text: line.message
                };
            }
            else {
                firstLine = {
                    color: COLORS[line.type],
                    text: line.message.slice(0, maxDisplayLength - 3) + "..."
                };
            }
        }
        else {
            firstLine = null;
        }
    }

    /** Initializes the console. This *must* be called before using any other console functions! */
    export function init(sketch: p5) {
        p5 = sketch;

        // figure out text widths and heights
        p5.push();
        p5.textFont("Roboto Mono", TEXT_SIZE);

        charWidth = p5.textWidth("#");
        lineHeight = p5.textLeading();
        maxDisplayLength = Math.floor((p5.width - 8) / charWidth);
        p5.pop();

        // will update display history and all that
        clear();
    }

    /** Renders the console onscreen. */
    export function render() {
        if (displayMode === DisplayMode.FIRST_LINE) {
            p5.push();

            p5.noStroke();
            p5.fill(BACKGROUND_COLOR);
            p5.rect(0, 0, p5.width, lineHeight + 2);

            if (firstLine) {
                p5.textFont("Roboto Mono", TEXT_SIZE);
                p5.textAlign("left", "top");
                p5.fill(firstLine.color);
                p5.text(firstLine.text, 4, 3);
            }

            p5.pop();
        }
        else if (displayMode === DisplayMode.FULL) {
            p5.background(BACKGROUND_COLOR);
            p5.push();

            // render filter buttons
            p5.textFont("Red Hat Display", 14);
            p5.textAlign("center", "center");
            // p5.rectMode("center");

            p5.noStroke();
            p5.fill(showErrors ? "#ffffff" : "#a0a0a0");
            p5.text("Errors", 28, 18);
            p5.fill(showWarnings ? "#ffffff" : "#a0a0a0");
            p5.text("Warnings", 96, 18);
            p5.fill(showLogs ? "#ffffff" : "#a0a0a0");
            p5.text("Logs", 158, 18);

            p5.noFill();
            p5.strokeWeight(2);
            p5.stroke(showErrors ? "#ffffff" : "#a0a0a0");
            p5.rect(5, 5, 48, 24);
            p5.stroke(showWarnings ? "#ffffff" : "#a0a0a0");
            p5.rect(62, 5, 68, 24);
            p5.stroke(showLogs ? "#ffffff" : "#a0a0a0");
            p5.rect(138, 5, 41, 24);

            // p5.textAlign("left", "center");
            // p5.noStroke();
            // p5.fill("#ffffff");
            // p5.text("Use up/down arrows to scroll.", 187, 18);

            // render text
            p5.textFont("Roboto Mono", TEXT_SIZE);
            p5.textAlign("left", "top");
            p5.noStroke();

            // loop from the bottom so that the console scrolls in the right direction
            p5.push();
            p5.translate(0, MAX_LINES * lineHeight);
            for (let y = displayLines.length - 1;
                 y >= 0 && y > displayLines.length - MAX_LINES; --y) {
                
                const line = displayLines[y];

                p5.fill(line.color);
                p5.text(line.text, 4, 3);

                p5.translate(0, -lineHeight);
            }
            p5.pop();

            p5.pop();
        }
    }

    /** Clears the console. */
    export function clear() {
        output = [];
        displayLines = [];
        firstLine = null;
    }

    /** Prints a log to both this console and the browser console. */
    export function log(message: any) {
        output.push({ type: MessageType.LOG, message: message.toString() });
        if (output.length > BUFFER_SIZE) { output.shift(); }
        updateDisplayedLines();
        // mirror to the browser console
        console.log(message);
    }

    /** Prints a warning to both this console and the browser console. */
    export function warn(message: any) {
        output.push({ type: MessageType.WARNING, message: message.toString() });
        if (output.length > BUFFER_SIZE) { output.shift(); }
        updateDisplayedLines();
        // mirror to the browser console
        console.warn(message);
    }

    /** Prints an error to both this console and the browser console. */
    export function error(message: any) {
        output.push({ type: MessageType.ERROR, message: message.toString() });
        if (output.length > BUFFER_SIZE) { output.shift(); }
        updateDisplayedLines();
        // mirror to the browser console
        console.error(message);
    }

    export function mousePressed() {
        // filter buttons are only visible when the console is in fullscreen
        if (displayMode === DisplayMode.FULL) {
            // error filter button
            if (p5.mouseX >= 5 && p5.mouseX <= 53 && p5.mouseY >= 5 && p5.mouseY <= 29) {
                showErrors = !showErrors;
                updateDisplayedLines();
            }
            // warning filter button
            else if (p5.mouseX >= 62 && p5.mouseX <= 130 && p5.mouseY >= 5 && p5.mouseY <= 29) {
                showWarnings = !showWarnings;
                updateDisplayedLines();
            }
            else if (p5.mouseX >= 138 && p5.mouseX <= 179 && p5.mouseY >= 5 && p5.mouseY <= 29) {
                showLogs = !showLogs;
                updateDisplayedLines();
            }
        }
    }

    export function keyPressed(e: KeyboardEvent) {
        // scrolling is only applied when the console is in fullscreen
        if (displayMode === DisplayMode.FULL) {
            if (e.key === "ArrowUp") {

            }
            else if (e.key === "ArrowDown") {

            }
        }
    }
}

/* ----- end of file ----- */