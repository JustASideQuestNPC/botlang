/* ----- src/bot-lang/environment.ts ----- */

interface BL_Variable {
    value: BL_Common.DataTypeUnion;
    isLibraryVariable: boolean;
}

/**
 * Runtime environment that stores all variables in a scope.
 */
class BL_Environment {
    private variables: { [key: string]: BL_Variable } = {};
    // for debugging
    private depth: number;
    // for block scoping
    enclosing: BL_Environment;

    constructor(enclosing: BL_Environment = null) {
        this.enclosing = enclosing;
        if (enclosing !== null) {
            this.depth = enclosing.depth + 1;
        }
        else {
            this.depth = 0;
        }
    }

    /** Declares and optionally assigns to a variable. */
    define(name: string, value: BL_Common.DataTypeUnion, isLibraryVariable: boolean = false) {
        BL_Common.verboseLog(`Defining ${isLibraryVariable ? 'library ' : ''}variable "${name}"`);

        // library variables can't be redefined anywhere
        if (BL_Interpreter.globals.variables[name] &&
            BL_Interpreter.globals.variables[name].isLibraryVariable) {
            
            if (BL_Interpreter.globals.variables[name] instanceof BL_StdFunction) {
                throw new BL_Common.RuntimeError(
                    `"${name}" is a builtin function and cannot be redefined.`
                );
            }
            else {
                throw new BL_Common.RuntimeError(
                    `"${name}" is a builtin variable and cannot be redefined.`
                );
            }
        }

        // nothing can be redefined in the same scope, but the resolver already checks for that (I
        // can't make it check for library variables, because those are defined at runtime and
        // aren't in the code that gets parsed). local scopes will never trigger this because of the
        // resolver, but i still need this for global variables
        if (this.variables[name]) {
            throw new BL_Common.RuntimeError(
                `"${name}" is already defined in this scope, did you mean to assign to it instead?`
            );
        }

        this.variables[name] = {
            value: value,
            isLibraryVariable: isLibraryVariable
        };
    }

    /** Gets the value of a variable. */
    get(name: string): BL_Common.DataTypeUnion {
        BL_Common.verboseLog(`getting from depth ${this.depth}`);
        // BL_Common.verboseLog(this.variables[name]);
        if (this.variables[name]) {
            return this.variables[name].value;
        }

        // if the variable doesn't exist in this scope, cascade up to the outer scope (if it exists)
        if (this.enclosing !== null) {
            return this.enclosing.get(name);
        }

        throw new BL_Common.RuntimeError(`Variable "${name}" is undefined.`);
    }

    /** Assigns to a variable. */
    assign(name: string, value: BL_Common.DataTypeUnion) {
        // library variables are read-only
        if (BL_Interpreter.globals.variables[name] &&
            BL_Interpreter.globals.variables[name].isLibraryVariable) {
            throw new BL_Common.RuntimeError(`Variable "${name}" is read-only.`);
        }

        if (this.variables[name]) {
            this.variables[name].value = value;
            return;
        }

        // if the variable doesn't exist in this scope, cascade up to the outer scope (if it exists)
        if (this.enclosing !== null) {
            BL_Common.verboseLog("step up");
            this.enclosing.assign(name, value);
            return;
        }

        throw new BL_Common.RuntimeError(`Variable "${name}" is undefined.`);
    }

    /** Gets a variable at a specified depth. */
    getAt(name: string, depth: number): BL_Common.DataTypeUnion {
        BL_Common.verboseLog(`Getting variable ${name} at depth ${depth}`);
        return this.ancestor(depth).get(name);
    }

    /** Assigns to a variable at a specified depth. */
    assignAt(name: string, value: BL_Common.DataTypeUnion, depth: number) {
        BL_Common.verboseLog(`Assigning to variable ${name} at depth ${depth}`);
        return this.ancestor(depth).assign(name, value);
    }

    /** Prints the contents of the environment; for debugging. */
    dump() {
        const lines: string[] = [
            `DEPTH ${this.depth}: [`
        ];

        for (const [name, value] of Object.entries(this.variables)) {
            lines.push(`"${name}" = ${BL_Common.valueToString(value.value)}`);
        }

        lines.push(']');
        console.error(lines.join("\n"));

        if (this.enclosing) {
            this.enclosing.dump();
        }
    }

    private ancestor(depth: number): BL_Environment {
        let env: BL_Environment = this;
        for (let i = 0; i < depth; ++i) {
            env = env.enclosing;
        }
        return env;
    }
 }

/* ----- end of file ----- */