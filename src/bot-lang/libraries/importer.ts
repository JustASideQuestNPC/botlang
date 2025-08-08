/* ----- src/bot-lang/importer.ts ----- */

interface BL_LibraryFunction {
    fn: BL_StdFunctionCallback;
    // "number" | "string" | "boolean" | "array" | "instance"  | "class" | "function"
    argTypes?: ("array" | "boolean" | "class" | "function" | "instance" | "nil" | "number" | "string")[];
}

interface BL_LibraryDefinition {
    name: string;
    functions: { [key: string]: BL_LibraryFunction };
    variables: { [key: string]: BL_Common.DataTypeUnion };
}

/**
 * An object with standard library functions.
 */
class BL_Library {
    private name: string;
    private fields: { [key: string]: BL_Common.DataTypeUnion } = {};

    constructor({ name, functions, variables }: BL_LibraryDefinition) {
        this.name = name;
        // variables pass through directly
        for (const [name, value] of Object.entries(variables)) {
            this.fields[name] = value;
        }

        // convert functions to callable objects
        for (const [fnName, data] of Object.entries(functions)) {
            // if the function has no argument types listed, pass it through directly
            if (!data.argTypes || data.argTypes.length === 0) {
                this.fields[fnName] = new BL_StdFunction(fnName, data.fn.length, data.fn);
            }
            // otherwise, add argument type checking
            else {
                const callback = (...args: BL_Common.DataTypeUnion[]) => {
                    const argTypes: string[] = [];
                    let invalidArg = false; // whether at least one type was invalid
                    for (let i = 0; i < data.argTypes.length; ++i) {
                        const type = BL_Common.typeToString(args[i]);
                        // normally i'd stop immediately if the type is invalid, but i want to
                        // report every argument type in the error message
                        if (type !== data.argTypes[i]) { invalidArg = true; }
                        argTypes.push(type);
                    }
                    
                    if (invalidArg) {
                        throw new BL_Common.RuntimeError(
                            `Invalid argument types to ${this.name}.${fnName}: Expected (` +
                            `${data.argTypes.join(", ")}), recieved (${argTypes.join(", ")}).`
                        );
                    }

                    return data.fn(...args);
                };
                this.fields[fnName] = new BL_StdFunction(fnName, data.fn.length, callback);
            }
        }
    }
    
    get(name: string): BL_Common.DataTypeUnion {
        if (this.fields[name]) { return this.fields[name]; }
        throw new BL_Common.RuntimeError(`"${name}" does not exist in library "${this.name}".`);
    }

    toString(): string {
        return `<library ${this.name}>`;
    }
}

/* ----- end of file ----- */