/* ----- src/bot-lang/statements.ts ----- */

/**
 * All statements used by Botlang. I normally avoid abbreviations like this, but pretty much every
 * compiler/interpreter uses `Stmt` so that's what we're going with.
 */
namespace BL_Stmts {
    /** Base class for all statements to extend. */
    export abstract class Stmt {
        debugName: string;
        abstract accept<T>(visitor: IStmtVisitor<T>): T;
    }

    /** Visitor pattern interface for statements. */
    export interface IStmtVisitor<T> {
        visitBlockStmt(stmt: Block): T;
        visitClassStmt(stmt: Class): T;
        visitFunctionStmt(stmt: Function): T;
        visitExpressionStmt(stmt: Expression): T;
        visitIfStmt(stmt: If): T;
        visitReturnStmt(stmt: Return): T;
        visitPrintStmt(stmt: Print): T;
        visitVarStmt(stmt: Var): T;
        visitWhileStmt(stmt: While): T;
    }

    /** A block of statements. */
    export class Block extends Stmt {
        debugName = "BlockStmt";
        statements: Stmt[];

        constructor(statements: Stmt[]) {
            super();
            this.statements = statements;
        }

        accept<T>(visitor: IStmtVisitor<T>): T {
            return visitor.visitBlockStmt(this);
        }
    }

    /** A class declaration. */
    export class Class extends Stmt {
        debugName = "ClassStmt";
        name: BL_Scanner.Token;
        superClass: BL_Exprs.Variable;
        methods: Function[];

        constructor(name: BL_Scanner.Token, superClass: BL_Exprs.Variable, methods: Function[]) {
            super();
            this.name = name;
            this.superClass = superClass;
            this.methods = methods;
        }

        accept<T>(visitor: IStmtVisitor<T>): T {
            return visitor.visitClassStmt(this);
        }
    }

    /** Default statement for an expression. */
    export class Expression extends Stmt {
        debugName = "ExpressionStmt";
        expression: BL_Exprs.Expr;

        constructor(expression: BL_Exprs.Expr) {
            super();
            this.expression = expression;
        }

        accept<T>(visitor: IStmtVisitor<T>): T {
            return visitor.visitExpressionStmt(this);
        }
    }

    /** A user-defined function. */
    export class Function extends Stmt {
        debugName = "FunctionStmt";
        name: BL_Scanner.Token;
        params: BL_Scanner.Token[];
        body: Stmt[];

        constructor(name: BL_Scanner.Token, params: BL_Scanner.Token[], body: Stmt[]) {
            super();
            this.name = name;
            this.params = params;
            this.body = body;
        }

        accept<T>(visitor: IStmtVisitor<T>): T {
            return visitor.visitFunctionStmt(this);
        }
    }

    /** If (and else) statements. */
    export class If extends Stmt {
        debugName = "IfStmt";
        condition: BL_Exprs.Expr;
        thenBranch: Stmt;
        elseBranch: Stmt;

        constructor(condition: BL_Exprs.Expr, thenBranch: Stmt, elseBranch: Stmt) {
            super();
            this.condition = condition;
            this.thenBranch = thenBranch;
            this.elseBranch = elseBranch;
        }

        accept<T>(visitor: IStmtVisitor<T>): T {
            return visitor.visitIfStmt(this);
        }
    }

    /** Return values. */
    export class Return extends Stmt {
        debugName = "ReturnStmt";
        keyword: BL_Scanner.Token;
        value: BL_Exprs.Expr | null;

        constructor(keyword: BL_Scanner.Token, value: BL_Exprs.Expr | null) {
            super();
            this.keyword = keyword;
            this.value = value;
        }

        accept<T>(visitor: IStmtVisitor<T>): T {
            return visitor.visitReturnStmt(this);
        }
    }

    /**
     * Prints the result of an expression to the console. This is temporary and will eventually be
     * replaced with a print function in the standard library.
     */
    export class Print extends Stmt {
        debugName = "PrintStmt";
        expression: BL_Exprs.Expr;

        constructor(expression: BL_Exprs.Expr) {
            super();
            this.expression = expression;
        }

        accept<T>(visitor: IStmtVisitor<T>): T {
            return visitor.visitPrintStmt(this);
        }
    }

    /** Variable declaration. */
    export class Var extends Stmt {
        debugName = "VarStmt";
        name: BL_Scanner.Token;
        initializer: BL_Exprs.Expr;

        constructor(name: BL_Scanner.Token, initializer: BL_Exprs.Expr) {
            super();
            this.name = name;
            this.initializer = initializer;
        }

        accept<T>(visitor: IStmtVisitor<T>): T {
            return visitor.visitVarStmt(this);
        }
    }

    /** While loop. */
    export class While extends Stmt {
        debugName = "WhileStmt";
        condition: BL_Exprs.Expr;
        body: BL_Stmts.Stmt;

        constructor(condition: BL_Exprs.Expr, body: BL_Stmts.Stmt) {
            super();
            this.condition = condition;
            this.body = body;
        }

        accept<T>(visitor: IStmtVisitor<T>): T {
            return visitor.visitWhileStmt(this);
        }
    }
}

/* ----- end of file ----- */