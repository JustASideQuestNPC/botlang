/* ----- src/bot-lang/interpreter.ts ----- */

/** Executes Botlang expressions and statements. */
namespace BL_Interpreter {
    // type alias so my lines aren't a billion characters long
    type ExprPromise = Promise<BL_Common.DataTypeUnion>;

    // the current variable scope
    let currentEnvironment: BL_Environment = null;
    // this is public because it's used for error checking with library variables
    export let globals: BL_Environment = null;
    // for local variable binding
    let currentLocalIndex = 0;
    let locals: { [key: number]: number } = {};
    export function resolveLocal(expr: BL_Exprs.Expr, depth: number) {
        expr.resolutionId = currentLocalIndex;
        locals[currentLocalIndex] = depth;
        ++currentLocalIndex;
    }

    // for dumping the environment chain when a crash occurs
    let dumpOrigin: BL_Environment = null;

    let killExecution = false;

    // will be called by the turtle to unpause after gliding
    export let resumeExecution: () => void;

    /**
     * Dummy "error" used to return a value from a function. I am going to hell for this.
     */
    export class ReturnInterrupt extends Error {
        value: BL_Common.DataTypeUnion; // the returned value
        constructor(value: BL_Common.DataTypeUnion) {
            super();
            this.name = "An affront to all that is good in this world.";
            this.value = value;
        }
    }

    // visitor functions for expressions
    // an array initializer list
    async function visitArrayExpr(expr: BL_Exprs.Array): ExprPromise {
        const items: BL_Common.DataTypeUnion[] = [];
        for (const item of expr.items) {
            items.push(await evaluate(item));
        }
        // the array instance just hangs out in global scope
        return new BL_ArrayInstance(globals.get("Array") as BL_Class, items);
    }

    // a variable assignment
    async function visitAssignmentExpr(expr: BL_Exprs.Assignment): ExprPromise {
        const value = await evaluate(expr.value);
        
        // check whether the value is in the lookup table
        // if (typeof expr.resolutionId === "number") {
        //     currentEnvironment.assignAt(expr.name.lexeme, value, locals[expr.resolutionId]);
        // }
        // else {
        //     globals.assign(expr.name.lexeme, value);
        // }

        currentEnvironment.assign(expr.name.lexeme, value);

        return value;
    }

    // a binary operator
    async function visitBinaryExpr(expr: BL_Exprs.Binary): ExprPromise {
        let left = await evaluate(expr.left);
        let right = await evaluate(expr.right);

        // addition is special and can be used to concatenate numbers or strings
        if (expr.operator.type === BL_Common.TokenType.PLUS) {
            if ((typeof left !== "number" && typeof left !== "string") &&
                (typeof right !== "number" && typeof right !== "string")) {
                
                throw new BL_Common.TypeError(
                    `BotLang.TypeError (line ${expr.operator.line}): Operands must be numbers ` +
                    `or strings.`
                );
            }

            if (typeof left === "string" || typeof right === "string") {
                // apparently strings have a toString() method?
                return left.toString() + right.toString();
            }

            return (left as number) + (right as number);
        }

        switch (expr.operator.type) {
            case BL_Common.TokenType.MINUS:
                checkNumberOperands(expr.operator, left, right);
                return (left as number) - (right as number);
            case BL_Common.TokenType.SLASH:
                checkNumberOperands(expr.operator, left, right);
                return (left as number) / (right as number);
            case BL_Common.TokenType.STAR:
                checkNumberOperands(expr.operator, left, right);
                return (left as number) * (right as number);
            case BL_Common.TokenType.CARET:
                checkNumberOperands(expr.operator, left, right);
                return Math.pow((left as number), (right as number));
            case BL_Common.TokenType.MOD:
                checkNumberOperands(expr.operator, left, right);
                return (left as number) % (right as number);
            // i couldn't decide whether i wanted the modulo operator to behave correctly or behave
            // like it does in other language, and i'm mildly embarrassed to admit how long it took
            // before i realized i could just...make another operator
            case BL_Common.TokenType.DOUBLE_MOD:
                checkNumberOperands(expr.operator, left, right);
                return (((left as number) % (right as number)) + (right as number)) % (right as number);
            case BL_Common.TokenType.GREATER:
                return left > right;
            case BL_Common.TokenType.GREATER_EQUAL:
                return left >= right;
            case BL_Common.TokenType.LESS:
                return left < right;
            case BL_Common.TokenType.LESS_EQUAL:
                return left <= right;
            case BL_Common.TokenType.DOUBLE_EQUAL:
                return left == right;
            case BL_Common.TokenType.NOT_EQUAL:
                return left != right;
        }

        // i'm pretty sure this is unreachable but i don't feel like doing the work to make sure
        return null;
    }

    // a function call
    async function visitCallExpr(expr: BL_Exprs.Call): ExprPromise {
        const callee = await evaluate(expr.callee);

        const args: BL_Common.DataTypeUnion[] = [];
        for (const arg of expr.args) {
            args.push(await evaluate(arg));
        }

        // verify that the callee is actually callable
        if (!(callee instanceof BL_StdFunction || callee instanceof BL_UserFunction ||
              callee instanceof BL_Class || callee instanceof BL_StdMethod)) {
            // print the variable name if possible, otherwise print the literal value
            if (expr.callee instanceof BL_Exprs.Variable) {
                throw new BL_Common.RuntimeError(`"${expr.callee.name}" is not a function.`);
            }
            else {
                throw new BL_Common.RuntimeError(
                    `"${BL_Common.valueToString(callee)}" is not a function.`
                );
            }
        }

        // verify argument number
        if (args.length !== callee.numArgs) {
            throw new BL_Common.RuntimeError(
                `${callee.name} expects ${callee.numArgs} arguments, but recieved ${args.length}.`
            );
        }

        return await callee.call(args);
    }

    // property access
    async function visitGetExpr(expr: BL_Exprs.Get): ExprPromise {
        const object = await evaluate(expr.object);
        if (object instanceof BL_Instance || object instanceof BL_Library) {
            return object.get(expr.name.lexeme);
        }
        // special case for string length
        if (typeof object === "string" && expr.name.lexeme === "length") {
            return object.length;
        }

        throw new BL_Common.RuntimeError(
            "Only classes and arrays have properties (strings also have a .length property)."
        );
    }

    // another expression in parentheses
    async function visitGroupingExpr(expr: BL_Exprs.Grouping): ExprPromise {
        return await evaluate(expr.expression);
    }

    // an array indexer
    async function visitIndexGetExpr(expr: BL_Exprs.IndexGet): ExprPromise {
        // make sure the indexee can actually be indexed
        if (!(expr.indexee instanceof BL_Exprs.Literal ||
              expr.indexee instanceof BL_Exprs.Variable)) {
            throw new BL_Common.TypeError(`Expected identifier or string before indexer.`);
        }
        const indexee = await evaluate(expr.indexee);
        // only arrays and strings can be indexed
        if (!(typeof indexee === "string" || indexee instanceof BL_ArrayInstance)) {
            throw new BL_Common.TypeError(`Only arrays and strings can be indexed.`);
        }

        // make sure the index is valid
        const index = await evaluate(expr.index);
        if (typeof index !== "number" || index % 1 !== 0) {
            // indexes? indices?
            throw new BL_Common.TypeError(`Indexes must be integer numbers.`);
        }

        // manually index strings because wrapping them in a class isn't worth it
        if (typeof indexee === "string") {
            if (index < -indexee.length || index >= indexee.length) {
                throw new BL_Common.RangeError(
                    `String index out of range (recieved index ${index} but string only has ` +
                    `${indexee.length} characters).`
                );
            }

            // negative numbers index backward from the rear
            if (index < 0) {
                return indexee[indexee.length + index];
            }
            return indexee[index];
        }

        return indexee.indexGet(index);
    }

    async function visitIndexSetExpr(expr: BL_Exprs.IndexSet): ExprPromise {
         // make sure the indexee can actually be indexed
        if (!(expr.indexee instanceof BL_Exprs.Literal ||
              expr.indexee instanceof BL_Exprs.Variable)) {
            throw new BL_Common.TypeError(`Expected identifier or string before indexer.`);
        }
        const indexee = await evaluate(expr.indexee);
        // only arrays and strings can be indexed
        if (!(typeof indexee === "string" || indexee instanceof BL_ArrayInstance)) {
            throw new BL_Common.TypeError(`Only arrays and strings can be indexed.`);
        }
        // only arrays can be set through an index, but i'm doing a second check for that so that i
        // can give a better error message
        if (typeof indexee === "string") {
            throw new BL_Common.TypeError("Strings cannot be set using an index.");
        }

        // make sure the index is valid
        const index = await evaluate(expr.index);
        if (typeof index !== "number" || index % 1 !== 0) {
            // indexes? indices?
            throw new BL_Common.TypeError(`Indexes must be integer numbers.`);
        }

        const value = await evaluate(expr.value);
        indexee.indexSet(index, value);
        return value;
    }

    // a literal value
    async function visitLiteralExpr(expr: BL_Exprs.Literal): ExprPromise {
        return expr.value;
    }

    // an "and" or "or" operator
    async function visitLogicalExpr(expr: BL_Exprs.Logical): ExprPromise {
        // logical operators short-circuit
        const left = await evaluate(expr.left);
        if (expr.operator.type === BL_Common.TokenType.OR) {
            // if the left half of an "or" is true, the result will always be true
            if (isTruthy(left)) { return true; }
        }
        else {
            // if the left half of an "and" is false, the result will always be false
            if (!isTruthy(left)) { return false; }
        }

        // only evaluate the right side if we need to
        return await evaluate(expr.right);
    }

    // property assignment
    async function visitSetExpr(expr: BL_Exprs.Set): ExprPromise {
        const object = await evaluate(expr.object);
        // edge case for trying to set libraries (which have properties, but are read-only)
        if (object instanceof BL_Library) {
            throw new BL_Common.RuntimeError("Library objects. are read-only.")
        }
        if (!(object instanceof BL_Instance)) {
            throw new BL_Common.RuntimeError("Only classes have properties.");
        }

        const value = await evaluate(expr.value);
        object.set(expr.name.lexeme, value);
        return value;
    }

    // "super" expression for inheritance
    async function visitSuperExpr(expr: BL_Exprs.Super): ExprPromise {
        const distance = locals[expr.resolutionId];
        const superClass = currentEnvironment.getAt("super", distance) as BL_Class;
        const mainClass = currentEnvironment.getAt("this", distance - 1) as BL_Instance;
        
        const method = superClass.findMethod(expr.method.lexeme);

        // make sure the method exists
        if (!method) {
            throw new BL_Common.RuntimeError(`Undefined property "${expr.method.lexeme}".`);
        }

        return method.bind(mainClass);
    }

    // "this" expression for classes
    async function visitThisExpr(expr: BL_Exprs.This): ExprPromise {
        return currentEnvironment.get(expr.keyword.lexeme);
    }

    // a unary operator
    async function visitUnaryExpr(expr: BL_Exprs.Unary): ExprPromise {
        const right = await evaluate(expr.right);

        switch (expr.operator.type) {
            // negation
            case BL_Common.TokenType.MINUS:
                checkNumberOperand(expr.operator, right);
                return -right;

            // logical not
            case BL_Common.TokenType.NOT:
                return !isTruthy(right);
        }

        // i'm pretty sure this is unreachable but i don't feel like doing the work to make sure
        return null;
    }

    // variable access
    async function visitVariableExpr(expr: BL_Exprs.Variable): ExprPromise {
        // return lookupVariable(expr.name, expr);
        return currentEnvironment.get(expr.name.lexeme);
    }

    // type checks for unary and binary expressions
    function checkNumberOperand(operator: BL_Scanner.Token, operand: BL_Common.DataTypeUnion) {
        if (typeof operand !== "number") {
            throw new BL_Common.TypeError(
                `BotLang.TypeError (line ${operator.line}): Operand must be a number.`
            );
        }
    }
    function checkNumberOperands(operator: BL_Scanner.Token, left: BL_Common.DataTypeUnion,
                                 right: BL_Common.DataTypeUnion) {
        
        if (typeof left !== "number" || typeof right !== "number") {
            throw new BL_Common.TypeError(
                `BotLang.TypeError (line ${operator.line}): Operands must be numbers.`
            );
        }
    }

    /**
     * Finds the value of a variable, either in the lookup table or in global scope. Currently
     * disabled because it's not working (instead I've fallen back to the original recursive method
     * of getting values, which performs slightly worse and has a few edge cases, but works well
     * enough to use).
     */
    function lookupVariable(name: BL_Scanner.Token, expr: BL_Exprs.Expr): BL_Common.DataTypeUnion {
        if (typeof expr.resolutionId === "number") {
            return currentEnvironment.getAt(name.lexeme, locals[expr.resolutionId]);
        }
        else {
            return globals.get(name.lexeme);
        }
    }

    /**
     * Returns whether a value evaluates to true when used in a boolean expression (yes, "truthy" is
     * the actual term for this).
     */
    function isTruthy(value: BL_Common.DataTypeUnion): boolean {
        // anything that isn't 0, false, or null is truthy
        return value !== 0 && value !== false && value !== null;
    }

    // dummy object so i can pass all the functions around at once
    const exprVisitor: BL_Exprs.IExprVisitor<Promise<BL_Common.DataTypeUnion>> = {
        visitArrayExpr: visitArrayExpr,
        visitAssignmentExpr: visitAssignmentExpr,
        visitBinaryExpr: visitBinaryExpr,
        visitCallExpr: visitCallExpr,
        visitGetExpr: visitGetExpr,
        visitGroupingExpr: visitGroupingExpr,
        visitIndexGetExpr: visitIndexGetExpr,
        visitIndexSetExpr: visitIndexSetExpr,
        visitLiteralExpr: visitLiteralExpr,
        visitLogicalExpr: visitLogicalExpr,
        visitSetExpr: visitSetExpr,
        visitSuperExpr: visitSuperExpr,
        visitThisExpr: visitThisExpr,
        visitUnaryExpr: visitUnaryExpr,
        visitVariableExpr: visitVariableExpr
    }

    // helper function to evaluate expressions
    async function evaluate(expr: BL_Exprs.Expr): ExprPromise {
        return await expr.accept(exprVisitor);
    }

    // visitor functions for statements
    // executes a block of statements
    async function visitBlockStmt(stmt: BL_Stmts.Block) {
        await executeBlock(stmt.statements, new BL_Environment(currentEnvironment));
    }

    // defines a class
    async function visitClassStmt(stmt: BL_Stmts.Class) {
        // evaluate superclass
        let superClass: BL_Common.DataTypeUnion = null;
        if (stmt.superClass) {
            superClass = await evaluate(stmt.superClass);
            if (!(superClass instanceof BL_Class)) {
                throw new BL_Common.RuntimeError("Superclass must be a class.");
            }
        }

        // the superclass exists in another scope that wraps around the class
        if (superClass) {
            currentEnvironment = new BL_Environment(currentEnvironment);
            currentEnvironment.define("super", superClass);
        }

        // assign methods
        const methods: { [name: string]: BL_UserFunction } = {};
        for (const methodStmt of stmt.methods) {
            methods[methodStmt.name.lexeme] = new BL_UserFunction(methodStmt, currentEnvironment);
        }

        currentEnvironment.define(stmt.name.lexeme,
            new BL_Class(stmt.name.lexeme, superClass as (BL_Class | null), methods)
        );

        // back out of the superclass scope
        if (superClass) {
            currentEnvironment = currentEnvironment.enclosing;
        }
    }

    // evaluates an expression and then discards the value
    async function visitExpressionStmt(stmt: BL_Stmts.Expression) {
        await evaluate(stmt.expression);
    }

    // defines a function
    async function visitFunctionStmt(stmt: BL_Stmts.Function) {
        currentEnvironment.define(stmt.name.lexeme, new BL_UserFunction(stmt, currentEnvironment));
    }

    // an if statement
    async function visitIfStmt(stmt: BL_Stmts.If) {
        if (isTruthy(await evaluate(stmt.condition))) {
            await execute(stmt.thenBranch);
        }
        else if (stmt.elseBranch) {
            await execute(stmt.elseBranch);
        }
    }

    // returns a value from a function
    async function visitReturnStmt(stmt: BL_Stmts.Return) {
        // as much as i despise this, throwing an error is the simplest way to return from a
        // function (at least with a recursive interpreter). return statements need to exit the
        // function no matter how deep they are in if statements and loops, and the easiest way to
        // do that is to throw an error and catch it at the top of the function call
        let value: BL_Common.DataTypeUnion = null;
        if (stmt.value !== null) {
            value = await evaluate(stmt.value);
        }

        throw new ReturnInterrupt(value);
    }

    // prints a value
    async function visitPrintStmt(stmt: BL_Stmts.Print) {
        DevConsole.log(BL_Common.valueToString(await evaluate(stmt.expression)));
    }

    // declares and optionally initializes a variable
    async function visitVarStmt(stmt: BL_Stmts.Var) {
        // evaluate the initializer if it exists, otherwise set the variable to null
        let value: BL_Common.DataTypeUnion = null;
        if (stmt.initializer !== null) {
            value = await evaluate(stmt.initializer);
        }

        currentEnvironment.define(stmt.name.lexeme, value);
    }

    // while loop
    async function visitWhileStmt(stmt: BL_Stmts.While) {
        // TODO: replace this with some kind of global recursion counter
        let numIterations = BL_Common.MAX_LOOP_ITERATIONS;
        while (isTruthy(await evaluate(stmt.condition))) {
            await execute(stmt.body);

            // check for infinite loop
            if (--numIterations <= 0) {
                throw new BL_Common.InfiniteLoopError(
                    `Maximum number of loop iterations (${BL_Common.MAX_LOOP_ITERATIONS}) exceeded.`
                );
            }
        }
    }

    // dummy object so i can pass all the functions around at once
    const stmtVisitor: BL_Stmts.IStmtVisitor<Promise<void>> = {
        visitBlockStmt: visitBlockStmt,
        visitClassStmt: visitClassStmt,
        visitExpressionStmt: visitExpressionStmt,
        visitFunctionStmt: visitFunctionStmt,
        visitIfStmt: visitIfStmt,
        visitReturnStmt: visitReturnStmt,
        visitPrintStmt: visitPrintStmt,
        visitVarStmt: visitVarStmt,
        visitWhileStmt: visitWhileStmt
    }

    // helper function to execute statements
    async function execute(stmt: BL_Stmts.Stmt) {
        BL_Common.verboseLog(`Executing ${stmt.debugName}`);

        // we need to pause execution when the turtle is animating, regardless of what statement
        // we're in or how many blocks deep we are. rather than try to sprinkle several hundred if
        // statements everywhere (which still might not work), i launch a promise and then set
        // resumeExecution to the promise's resolve function (which exits the promise). the promise
        // will then keep spinning (which pauses this function) until the turtle finishes moving and
        // calls resumeExecution, which will end the promise and let the interpreter keep going
        if (Turtle.isGliding()) {
            await new Promise((resolve) => {
                resumeExecution = () => {
                    resolve(null);
                };
            });
            resumeExecution = null;
        }

        // break out if the interpreter has been stopped
        if (killExecution) {
            throw new BL_Common.RuntimeError("Interpreter was killed.");
        }

        await stmt.accept(stmtVisitor);
    }

    // helper function to execute an entire block of statements. this is public because
    // BL_UserFunction has to call it
    export async function executeBlock(statements: BL_Stmts.Stmt[], environment: BL_Environment) {
        const prevEnvironment = currentEnvironment;
        currentEnvironment = environment;
        dumpOrigin = environment;
        try {
            for (const statement of statements) {
                await execute(statement);
            }
            // only update the dump origin if no error occurred
            dumpOrigin = prevEnvironment;
        }
        catch (e) {
            // catch and then immediately re-throw so that the loop breaks but the "finally" still
            // triggers to exit the scope (this is important in the event that i decide to add
            // try...catch statements to Botlang, or give the errors some kind of stack trace)
            // BL_Common.verboseLog("caught error");
            throw e;
        }
        // personally, i think i should win TCO just for finding a way to make use of "finally"
        finally {
            currentEnvironment = prevEnvironment;
        }
    }

    /** Initializes the interpreter and resets everything from the last run. */
    export function init() {
        currentLocalIndex = 0;
        locals = {};
        globals = new BL_Environment();
        currentEnvironment = globals;

        // add standard libary stuff
        globals.define("Array", new BL_Array("Array", null, {}), true);
    }
    
    /** Interprets a list of statements. */
    export async function interpret(statements: BL_Stmts.Stmt[]) {
        killExecution = false;
        try {
            // global scope is really just one big block when you think about it
            await executeBlock(statements, currentEnvironment);
        }
        catch (e) {
            // re-throw unexpected errors
            if (!(e instanceof BL_Common.BL_Error)) {
                throw e;
            }
            // execute block doesn't print the error, just catches it, cleans up some stuff, and
            // re-throws it back up the chain
            DevConsole.error(e.message);
            console.error(e);
            // dump the current environment chain
            if (BotLang.verboseLogging()) {
                console.error("Dumping environment...");
                dumpOrigin.dump();
            }
        }
    }

    /** Immediately stops the interpreter if it is running. */
    export function kill() {
        killExecution = true;
        // also break out of a glide
        if (resumeExecution) { resumeExecution(); }
        Turtle.stopGlide();
    }
}

/* ----- end of file ----- */