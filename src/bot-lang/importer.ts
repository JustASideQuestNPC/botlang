/* ----- src/bot-lang/importer.ts ----- */

interface BL_Library {
    functions: { [key: string]: BL_StdFunctionCallback };
    variables: { [key: string]: BL_Common.DataTypeUnion };
}

/**
 * Imports libraries. Currently only used for the standard libaries but may be moved into an
 * "import" statement of some kind.
 */
namespace BL_Importer {
    export function addLib(lib: BL_Library) {
        // convert functions to callable objects
        for (const [name, data] of Object.entries(lib.functions)) {
            // apparently functions have a "length" property??
            BL_Interpreter.globals.define(
                name, new BL_StdFunction(name, data.length, data), true
            );
        }

        // add variable
        for (const [name, value] of Object.entries(lib.variables)) {
            BL_Interpreter.globals.define(name, value, true);
        }
    }
}

/* ----- end of file ----- */