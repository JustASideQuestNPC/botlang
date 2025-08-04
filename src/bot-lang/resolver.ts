/* ----- src/bot-lang/resolver.ts ----- */

/** Runs semantic analysis on the syntax tree to fix edge cases with variable scoping. */
namespace BL_Resolver {
    // stack with all (current) variable scopes
    let scopes: { [key: string]: boolean }[];

    // used for finding invalid returns
    enum FunctionType {
        NONE,
        FUNCTION,
        INITIALIZER,
        METHOD
    }
    let currentFunction: FunctionType;

    // used for finding invalid "this" uses
    enum ClassType {
        NONE,
        CLASS
    }
    let currentClass: ClassType;

    // visitor functions for expressions
    async function visitArrayExpr(expr: BL_Exprs.Array) {
        // resolve all items in the list
        for (const item of expr.items) {
            await resolveExpr(item);
        }
    }

    async function visitAssignmentExpr(expr: BL_Exprs.Assignment) {
        await resolveExpr(expr.value);
        resolveLocal(expr, expr.name);
    }

    async function visitBinaryExpr(expr: BL_Exprs.Binary) {
        await resolveExpr(expr.left);
        await resolveExpr(expr.right);
    }

    async function visitCallExpr(expr: BL_Exprs.Call) {
        await resolveExpr(expr.callee);

        for (const arg of expr.args) {
            await resolveExpr(arg);
        }
    }

    async function visitGetExpr(expr: BL_Exprs.Get) {
        await resolveExpr(expr.object);
    }

    async function visitGroupingExpr(expr: BL_Exprs.Grouping) {
        await resolveExpr(expr.expression);
    }

    async function visitIndexGetExpr(expr: BL_Exprs.IndexGet) {
        await resolveExpr(expr.indexee);
        await resolveExpr(expr.index);
    }

    async function visitIndexSetExpr(expr: BL_Exprs.IndexSet) {
        await resolveExpr(expr.indexee);
        await resolveExpr(expr.index);
        await resolveExpr(expr.value);
    }

    async function visitLogicalExpr(expr: BL_Exprs.Logical) {
        await resolveExpr(expr.left);
        await resolveExpr(expr.right);
    }

    async function visitSetExpr(expr: BL_Exprs.Set) {
        await resolveExpr(expr.value);
        await resolveExpr(expr.object);
    }

    async function visitSuperExpr(expr: BL_Exprs.Super) {
        resolveLocal(expr, expr.keyword);
    }

    async function visitThisExpr(expr: BL_Exprs.This) {
        if (currentClass === ClassType.NONE) {
            BotLang.error(expr.keyword.line, '"this" cannot be used outside of a class.');
            return;
        }

        resolveLocal(expr, expr.keyword);
    }

    async function visitUnaryExpr(expr: BL_Exprs.Unary) {
        await resolveExpr(expr.right);
    }

    async function visitVariableExpr(expr: BL_Exprs.Variable) {
        // the resolver only cares about local scopes
        if (scopes.length === 0) { return; }
        
        // prevent variables from being referred to in their own initializer "var a = a;"
        if (scopes[scopes.length - 1][expr.name.lexeme] === false) {
            BotLang.error(
                expr.name.line, "Local variables cannot be read in their own initializer"
            );
        }

        // *actually* resolve the variable
        resolveLocal(expr, expr.name);
    }

    // resolves a local variable
    function resolveLocal(expr: BL_Exprs.Expr, name: BL_Scanner.Token) {
        // step backward up the scopes until we either resolve the variable or run out of scopes (in
        // which case we assume the variable is global and ignore it)
        for (let i = scopes.length - 1; i >= 0; --i) {
            if (typeof scopes[i][name.lexeme] === "boolean") {
                BL_Common.verboseLog(`Resolved ${name.lexeme} at depth ${scopes.length - 1 - i}`);
                BL_Interpreter.resolveLocal(expr, scopes.length - 1 - i);
                return;
            }
        }
    }

    // dummy object so i can pass all the functions around at once
    const exprVisitor: BL_Exprs.IExprVisitor<Promise<void>> = {
        visitArrayExpr: visitArrayExpr,
        visitAssignmentExpr: visitAssignmentExpr,
        visitBinaryExpr: visitBinaryExpr,
        visitCallExpr: visitCallExpr,
        visitGetExpr: visitGetExpr,
        visitGroupingExpr: visitGroupingExpr,
        visitIndexGetExpr: visitIndexGetExpr,
        visitIndexSetExpr: visitIndexSetExpr,
        visitLiteralExpr: async ()=>{}, // literals don't require resolving
        visitLogicalExpr: visitLogicalExpr,
        visitSetExpr: visitSetExpr,
        visitSuperExpr: visitSuperExpr,
        visitThisExpr: visitThisExpr,
        visitUnaryExpr: visitUnaryExpr,
        visitVariableExpr: visitVariableExpr
    }

    // helper function to resolve expressions
    async function resolveExpr(expr: BL_Exprs.Expr) {
        await expr.accept(exprVisitor);
    }

    // visitor functions for statements
    async function visitBlockStmt(stmt: BL_Stmts.Block) {
        // add a new scope, then resolve all statements inside that scope
        scopes.push({});

        for (const statement of stmt.statements) {
            await resolveStmt(statement);
        }

        // exit back into the previous scope
        scopes.pop();
    }

    async function visitClassStmt(stmt: BL_Stmts.Class) {
        // enable using "this" if it isn't already enabled
        const enclosingClass = currentClass;
        currentClass = ClassType.CLASS;

        declare(stmt.name);
        define(stmt.name);
        
        // only resolve the superclass if it exists
        let hasSuperClass = false;
        if (stmt.superClass !== null) {
            // classes (obviously) cannot inherit from themselves
            if (stmt.superClass.name.lexeme === stmt.name.lexeme) {
                BotLang.error(stmt.name.line, "A class cannot inherit from itself.");
            }
            else {
                hasSuperClass = true;
            }
        }

        if (hasSuperClass) {
            await resolveExpr(stmt.superClass);

            // start a new scope chain (inheritance is weird like that)
            scopes.push({
                super: true,
            });
        }

        scopes.push({
            // all classes have "this"
            this: true
        });
        
        // handle methods
        for (const method of stmt.methods) {
            let declaration = FunctionType.METHOD;
            // initializers (constructors) have a few special properties
            if (method.name.lexeme === "init") {
                declaration = FunctionType.INITIALIZER;
            }
            await resolveFunction(method, declaration);
        }
        scopes.pop();

        // also exit the superclass chain
        if (hasSuperClass) {
            scopes.pop();
        }

        currentClass = enclosingClass;
    }

    async function visitExpressionStmt(stmt: BL_Stmts.Expression) {
        await resolveExpr(stmt.expression);
    }

    async function visitFunctionStmt(stmt: BL_Stmts.Function) {
        declare(stmt.name);
        define(stmt.name);
        await resolveFunction(stmt, FunctionType.FUNCTION);
    }

    async function visitIfStmt(stmt: BL_Stmts.If) {
        await resolveExpr(stmt.condition);
        // resolve both branches immediately
        await resolveStmt(stmt.thenBranch);
        if (stmt.elseBranch) { resolveStmt(stmt.elseBranch); }
    }

    async function visitReturnStmt(stmt: BL_Stmts.Return) {
        if (currentFunction === FunctionType.NONE) {
            BotLang.error(stmt.keyword.line, '"return" can only be used inside a function.');
        }
        if (stmt.value) {
            // initializers cannot return a value
            if (currentFunction === FunctionType.INITIALIZER) {
                BotLang.error(stmt.keyword.line, 'Class initializers cannot return a value.');
            }
            await resolveExpr(stmt.value);
        }
    }

    async function visitPrintStmt(stmt: BL_Stmts.Print) {
        await resolveExpr(stmt.expression);
    }

    async function visitVarStmt(stmt: BL_Stmts.Var) {
        declare(stmt.name);
        if (stmt.initializer) {
            await resolveExpr(stmt.initializer)
        }
        define(stmt.name);
    }

    async function visitWhileStmt(stmt: BL_Stmts.While) {
        await resolveExpr(stmt.condition);
        await resolveStmt(stmt.body);
    }

    // declares a variable in the current scope
    function declare(name: BL_Scanner.Token) {
        // the resolver only cares about local scopes
        if (scopes.length === 0) { return; }

        // check for redefines
        if (typeof scopes[scopes.length - 1][name.lexeme] === "boolean") {
            BotLang.error(
                name.line,
                `"${name.lexeme}" is already defined in this scope, did you mean to assign to it ` +
                `instead?`
            );
        }

        // put an uninitialized variable in the current scope
        scopes[scopes.length - 1][name.lexeme] = false;
    }

    // defines (initializes) a variable in the current scope
    function define(name: BL_Scanner.Token) {
        if (scopes.length === 0) { return; }
        
        // put an initialized variable in the current scope
        scopes[scopes.length - 1][name.lexeme] = true;
    }

    // resolves a function in the current scope
    async function resolveFunction(fn: BL_Stmts.Function, type: FunctionType) {
        const enclosingFunction = currentFunction;
        currentFunction = type;

        scopes.push({});

        // resolve parameters
        for (const param of fn.params) {
            declare(param);
            define(param);
        }

        // resolve everything else
        await resolve(fn.body);

        scopes.pop();
        currentFunction = enclosingFunction;
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

    // helper function to resolve statments
    async function resolveStmt(stmt: BL_Stmts.Stmt) {
        await stmt.accept(stmtVisitor);
    }

    export function init() {
        scopes = [];
        currentFunction = FunctionType.NONE;
        currentClass = ClassType.NONE;
    }

    export async function resolve(statements: BL_Stmts.Stmt[]) {
        for (const statement of statements) {
            await resolveStmt(statement);
        }
    }
}

/* ----- end of file ----- */