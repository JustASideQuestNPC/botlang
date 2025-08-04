/* ----- src/bot-lang/expressions.ts ----- */

/**
 * All expressions used by Botlang. I normally avoid abbreviations like this, but pretty much every
 * compiler/interpreter uses `Expr` so that's what we're going with.
 */
namespace BL_Exprs {
    /** Base class for all expressions to extend. */
    export abstract class Expr {
        resolutionId: number;
        abstract accept<T>(visitor: IExprVisitor<T>): T;
    }

    /** Visitor pattern interface for expressions. */
    export interface IExprVisitor<T> {
        visitArrayExpr(expr: Array): T;
        visitAssignmentExpr(expr: Assignment): T;
        visitBinaryExpr(expr: Binary): T;
        visitCallExpr(expr: Call): T;
        visitGetExpr(expr: Get): T;
        visitGroupingExpr(expr: Grouping): T;
        visitIndexGetExpr(expr: IndexGet): T;
        visitIndexSetExpr(expr: IndexSet): T;
        visitLiteralExpr(expr: Literal): T;
        visitLogicalExpr(expr: Logical): T;
        visitSetExpr(expr: Set): T;
        visitSuperExpr(expr: Super): T;
        visitThisExpr(expr: This): T;
        visitUnaryExpr(expr: Unary): T;
        visitVariableExpr(expr: Variable): T;
    }

    /** An array initializer list. */
    export class Array extends Expr {
        items: Expr[];

        constructor(items: Expr[]) {
            super();
            this.items = items;
        }

        accept<T>(visitor: IExprVisitor<T>): T {
            return visitor.visitArrayExpr(this);
        }

        toString() {
            return `<array: [${this.items.map(i => i.toString()).join(",")}]>`;
        }
    }

    /** Variable assignment. */
    export class Assignment extends Expr {
        name: BL_Scanner.Token;
        value: Expr;

        constructor(name: BL_Scanner.Token, value: Expr) {
            super();
            this.name = name;
            this.value = value;
        }

        accept<T>(visitor: IExprVisitor<T>): T {
            return visitor.visitAssignmentExpr(this);
        }

        toString() {
            return `<assignment: "${this.name.lexeme}" ${this.value}>`;
        }
    }

    /** A binary operator. */
    export class Binary extends Expr {
        left: Expr;
        operator: BL_Scanner.Token;
        right: Expr;

        constructor(left: Expr, operator: BL_Scanner.Token, right: Expr) {
            super();
            this.left = left;
            this.operator = operator;
            this.right = right;
        }

        accept<T>(visitor: IExprVisitor<T>): T {
            return visitor.visitBinaryExpr(this);
        }

        toString() {
            return `<binary ${this.left} ${this.operator.type} ${this.right}>`;
        }
    }

    /** A function call. */
    export class Call extends Expr {
        callee: Expr;
        paren: BL_Scanner.Token;
        args: Expr[];

        constructor(callee: Expr, paren: BL_Scanner.Token, args: Expr[]) {
            super();
            this.callee = callee;
            this.paren = paren;
            this.args = args;
        }

        accept<T>(visitor: IExprVisitor<T>): T {
            return visitor.visitCallExpr(this);
        }

        toString() {
            const argString = this.args.map((expr) => expr.toString()).join(", ");
            return `<call ${this.callee}(${argString})>`;
        }
    }

    /** Property access. */
    export class Get extends Expr {
        object: Expr;
        name: BL_Scanner.Token;

        constructor(object: Expr, name: BL_Scanner.Token) {
            super();
            this.object = object;
            this.name = name;
        }

        accept<T>(visitor: IExprVisitor<T>): T {
            return visitor.visitGetExpr(this);
        }

        toString() {
            return `<get ${this.object} "${this.name.lexeme}">`;
        }
    }

    /** An expression grouped in parentheses */
    export class Grouping extends Expr {
        expression: Expr;

        constructor(expression: Expr) {
            super();
            this.expression = expression;
        }

        accept<T>(visitor: IExprVisitor<T>): T {
            return visitor.visitGroupingExpr(this);
        }

        toString() {
            return `<grouping (${this.expression})>`;
        }
    }

    /** Get a value at an index. */
    export class IndexGet extends Expr {
        indexee: Expr;
        index: Expr;

        constructor(indexee: Expr, index: Expr) {
            super();
            this.indexee = indexee;
            this.index = index;
        }

        accept<T>(visitor: IExprVisitor<T>): T {
            return visitor.visitIndexGetExpr(this);
        }

        toString() {
            return `<index get ${this.indexee.toString()}[${this.index.toString()}]>`
        }
    }

    /** Set a value at an index. */
    export class IndexSet extends Expr {
        indexee: Expr;
        index: Expr;
        value: Expr;

        constructor(indexee: Expr, index: Expr, value: Expr) {
            super();
            this.indexee = indexee;
            this.index = index;
            this.value = value;
        }

        accept<T>(visitor: IExprVisitor<T>): T {
            return visitor.visitIndexSetExpr(this);
        }

        toString() {
            return `<index set ${this.indexee.toString()}[${this.index.toString()}] = ` +
                   `${this.value.toString()}>`
        }
    }

    /** A literal value (number, string, boolean, null). */
    export class Literal extends Expr {
        value: BL_Common.DataTypeUnion;

        constructor(value: BL_Common.DataTypeUnion) {
            super();
            this.value = value;
        }

        accept<T>(visitor: IExprVisitor<T>): T {
            return visitor.visitLiteralExpr(this);
        }

        toString() {
            return `<literal ${this.value}>`;
        }
    }

    /** An `and` or `or` operator. */
    export class Logical extends Expr {
        left: Expr;
        operator: BL_Scanner.Token;
        right: Expr;

        constructor(left: Expr, operator: BL_Scanner.Token, right: Expr) {
            super();
            this.left = left;
            this.operator = operator;
            this.right = right;
        }

        accept<T>(visitor: IExprVisitor<T>): T {
            return visitor.visitLogicalExpr(this);
        }

        toString() {
            return `<logical ${this.left} ${this.operator.type} ${this.right}>`;
        }
    }

    /** Property assignment. */
    export class Set extends Expr {
        object: Expr;
        name: BL_Scanner.Token;
        value: Expr;

        constructor(object: Expr, name: BL_Scanner.Token, value: Expr) {
            super();
            this.object = object;
            this.name = name;
            this.value = value;
        }

        accept<T>(visitor: IExprVisitor<T>): T {
            return visitor.visitSetExpr(this);
        }

        toString() {
            return `<set ${this.object} "${this.name.lexeme}" ${this.value}>`;
        }
    }

    /** A `super` expression for inheritance. */
    export class Super extends Expr {
        keyword: BL_Scanner.Token;
        method: BL_Scanner.Token;

        constructor(keyword: BL_Scanner.Token, method: BL_Scanner.Token) {
            super();
            this.keyword = keyword;
            this.method = method;
        }

        accept<T>(visitor: IExprVisitor<T>): T {
            return visitor.visitSuperExpr(this);
        }

        toString() {
            return `<super "${this.keyword.lexeme}" "${this.method.lexeme}">`;
        }
    }

    /** A `this` expression for classes. */
    export class This extends Expr {
        keyword: BL_Scanner.Token;

        constructor(keyword: BL_Scanner.Token) {
            super();
            this.keyword = keyword;
        }

        accept<T>(visitor: IExprVisitor<T>): T {
            return visitor.visitThisExpr(this);
        }

        toString() {
            return `<this "${this.keyword.lexeme}">`;
        }
    }

    /** A unary (`!` or `-`) operator. */
    export class Unary extends Expr {
        operator: BL_Scanner.Token;
        right: Expr;

        constructor(operator: BL_Scanner.Token, right: Expr) {
            super();
            this.operator = operator;
            this.right = right;
        }

        accept<T>(visitor: IExprVisitor<T>): T {
            return visitor.visitUnaryExpr(this);
        }

        toString() {
            return `<unary ${this.operator.type} ${this.right}>`;
        }
    }

    /** Variable access. */
    export class Variable extends Expr {
        name: BL_Scanner.Token;

        constructor(name: BL_Scanner.Token) {
            super();
            this.name = name;
        }

        accept<T>(visitor: IExprVisitor<T>): T {
            return visitor.visitVariableExpr(this);
        }

        toString() {
            return `<variable "${this.name.lexeme}">`;
        }
    }
}

/* ----- end of file ----- */