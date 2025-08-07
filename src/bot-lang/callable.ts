/* ----- src/bot-lang/callable.ts ----- */

interface BL_Callable {
    name: string; // used for a few errors
    numArgs: number;
    call(args: BL_Common.DataTypeUnion[]): Promise<BL_Common.DataTypeUnion>;
}

/** A predefined function in the Botlang standard library. */
type BL_StdFunctionCallback = (...args: BL_Common.DataTypeUnion[]) => BL_Common.DataTypeUnion | void;
class BL_StdFunction implements BL_Callable {
    name: string;
    numArgs: number;
    callback: BL_StdFunctionCallback;

    constructor(name: string, numArgs: number, callback: BL_StdFunctionCallback) {
        this.name = name;
        this.numArgs = numArgs;
        this.callback = callback;
    }

    async call(args: BL_Common.DataTypeUnion[]): Promise<BL_Common.DataTypeUnion> {
        // make sure any errors thrown by this function (which will DEFINITELY be caused by bugs in
        // the user's Botlang code and NOT because something is wrong the callback itself) don't
        // crash the entire program
        try {
            const returnValue = this.callback(...args);
            // Botlang functions with no return statement will return null, but i'm lazy and don't
            // want to make all my standard library functions return null
            if (returnValue === undefined) { return null; }
            return returnValue as BL_Common.DataTypeUnion;
        }
        // convert to a Botlang error for consistency
        catch (e) {
            // handle some special error types
            if (e instanceof TypeError) {
                throw new BL_Common.TypeError(e.message);
            }
            // if the error can't be cast to a specific type, it defaults to RuntimeError
            throw new BL_Common.RuntimeError(e.message);
        }
    }

    toString(): string {
        return `<function ${this.name}>`;
    }
}

/** A predefined class method in the Botlang standard library. */
type BL_StdMethodCallback = (
    instance: BL_Instance, ...args: BL_Common.DataTypeUnion[]) => void|BL_Common.DataTypeUnion;

class BL_StdMethod implements BL_Callable {
    name: string;
    numArgs: number;
    instance: BL_Instance; // the instance the method is bound to
    callback: BL_StdMethodCallback;

    constructor(name: string, numArgs: number, callback: BL_StdMethodCallback,
                instance: BL_Instance = null) {

        this.name = name;
        this.numArgs = numArgs;
        this.callback = callback;
        this.instance = instance;
    }

    async call(args: BL_Common.DataTypeUnion[]): Promise<BL_Common.DataTypeUnion> {
        // make sure we don't try to call a method that isn't attached to an instance
        if (this.instance === null) {
            throw new BL_Common.RuntimeError(
                `Attempted to call method "${this.name}" without binding it to a class instance. ` +
                `This is totally NPC's fault and you should go bug him about it.`
            );
        }

        // make sure any errors thrown by this function (which will DEFINITELY be caused by bugs in
        // the user's Botlang code and NOT because something is wrong the callback itself) don't
        // crash the entire program
        try {
            const returnValue = this.callback(this.instance, ...args);
            // Botlang functions with no return statement will return null, but i'm lazy and don't
            // want to make all my standard library functions return null
            if (returnValue === undefined) { return null; }
            return returnValue as BL_Common.DataTypeUnion;
        }
        // convert to a Botlang error for consistency
        catch (e) {
            // handle some special error types
            if (e instanceof TypeError) {
                throw new BL_Common.TypeError(e.message);
            }
            if (e instanceof RangeError) {
                throw new BL_Common.RangeError(e.message);
            }
            // if the error can't be cast to a specific type, it defaults to RuntimeError
            throw new BL_Common.RuntimeError(e.message);
        }
    }

    bind(instance: BL_Instance): BL_StdMethod {
        return new BL_StdMethod(this.name, this.numArgs, this.callback, instance);
    }

    toString(): string {
        return `<function ${this.name}>`;
    }
}

/** A user-defined Botlang function. */
class BL_UserFunction implements BL_Callable {
    name: string;
    numArgs: number;
    private closure: BL_Environment; // the environment the function was declared in
    private declaration: BL_Stmts.Function;
    private isInitializer: boolean; // used to forcibly override constructor return values

    constructor(declaration: BL_Stmts.Function, closure: BL_Environment,
                isInitializer: boolean=false) {
        this.name = declaration.name.lexeme;
        this.numArgs = declaration.params.length;
        this.declaration = declaration;
        this.closure = closure;
        this.isInitializer = isInitializer;
    }

    async call(args: BL_Common.DataTypeUnion[]): Promise<BL_Common.DataTypeUnion> {
        // to include arguments, we just create a new scope and include them as variables
        const environment = new BL_Environment(this.closure);
        for (let i = 0; i < this.declaration.params.length; ++i) {
            environment.define(this.declaration.params[i].lexeme, args[i]);
        }

        // try...catch for returning values
        try {
            await BL_Interpreter.executeBlock(this.declaration.body, environment);
        }
        catch (e) {
            // re-throw unexpected errors
            if (!(e instanceof BL_Interpreter.ReturnInterrupt)) {
                throw e;
            }

            // return the value and destroy the monstrosity it came from
            if (this.isInitializer) { return this.closure.get("this"); }
            return e.value;
        }

        // class initializers always return the class
        if (this.isInitializer) { return this.closure.get("this"); }
        return null;
    }

    // returns a copy of the function that is bound to a class instance
    bind(instance: BL_Instance): BL_UserFunction {
        const env = new BL_Environment(this.closure);
        env.define("this", instance);
        return new BL_UserFunction(this.declaration, env, this.isInitializer);
    }

    toString(): string {
        return `<function ${this.name}>`;
    }
}

/* ----- end of file ------ */