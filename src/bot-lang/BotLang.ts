/* ----- src/bot-lang/BotLang.ts ----- */

/**
 * BotLang is a custom-built interpreted programming language. It was originally named BotScript,
 * but the rather unfortunate acronym forced me to change it.
 */
namespace BotLang {
    let hadError = false;

    /** Parses and runs a string with BotLang code. */
    export async function run(code: string) {
        hadError = false;
        // clear output from the previous program
        DevConsole.clear();

        BL_Interpreter.init();
        BL_Resolver.init();

        // scan code into tokens
        BL_Common.verboseLog("Scanning...");
        const tokens = BL_Scanner.scan(code);

        // parse tokens into expressions and statements
        BL_Common.verboseLog(`Scanned ${tokens.length} tokens, parsing...`);
        const statements = BL_Parser.parse(tokens);
        if (!statements || hadError) {
            BL_Common.verboseLog("Parsing failed, execution aborted.");
            return;
        }

        // resolve local variables
        BL_Common.verboseLog(`Successfully parsed ${statements.length} statements, resoving...`);
        await BL_Resolver.resolve(statements);
        if (hadError) {
            BL_Common.verboseLog("Resolution failed, execution aborted.");
            return;
        }

        BL_Common.verboseLog("Resolution successful, importing standard libraries...");
        BL_Importer.addLib(BL_StdLib_Math);
        BL_Importer.addLib(BL_StdLib_Turtle);

        BL_Common.verboseLog("Imports successful, executing...");
        BL_Common.verboseLog("----------");
        Turtle.resetAll();
        Turtle.clearCanvas();
        await BL_Interpreter.interpret(statements);
    }

    /**
     * Sets whether verbose logging is enabled. Call without arguments to get whether verbose
     * logging is enabled.
     */
    export function verboseLogging(value?: boolean): boolean {
        if (typeof value === "boolean") {
            BL_Common.verboseLogging = value;
        }
        return BL_Common.verboseLogging;
    }

    /** Prints an error to the console and sets the error flag.. */
    export function error(line: number, message: string): void;
    /** Prints an error to the console and sets the error flag. */
    export function error(line: number, where: string, message: string): void;
    export function error(line: number, where: string, message?: string): void {
        // handle overloads
        if (!message) {
            message = where;
            where = "";
        }
        else {
            // add a separator between the line number
            where = " " + where;
        }

        // lines start at index zero
        DevConsole.error(`Error [line ${line}${where}]: ${message}`);
        hadError = true;
    }
}

/* ----- end of file ----- */