/* ----- src/bot-lang/parser.ts ----- */

/** Converts an array of tokens into a syntax tree, while performing error checks. */
namespace BL_Parser {

    /**
     * For those who've taken a compilers class and/or are just curious, here's the entire grammar
     * for Botlang (it's just a *tiny* bit complicated). Parentheses group things, '*' repeat them 0
     * or more times, '?' makes them optional. If you have no idea what this is, it's not required
     * for understanding the rest of the code so you can just skip it.
     * 
     * program      -> declaration* EOF ;
     * 
     * declaration  -> classDecl | functionDecl | varDecl | statement ;
     * 
     * classDecl    -> "class" IDENTIFIER "{" function* "}" ;
     * 
     * functionDecl -> "function" IDENTIFIER "(" parameters? ")" block ;
     * parameters   -> IDENTIFIER ("," IDENTIFIER)* ;
     * 
     * varDecl      -> "var" IDENTIFIER ( "=" expression )? ";" ;
     * 
     * statement    -> exprStmt | forStmt | ifStmt | returnStmt | printStmt | whileStmt | block ;
     * 
     * exprStmt     -> expression ";" ;
     * forStmt      -> "for" "(" (varDecl | exprStmt | ";") expression? ";" expression? ")"
     *                statement ;
     * ifStmt       -> "if" "(" expression ")" statement ("else" statement)? ;
     * returnStmt   -> "return" expression? ";" ;
     * printStmt    -> "print" expression ";" ;
     * whileStmt    -> "while" "(" expression ")" statement ;
     * block        -> "{" declaration* "}" ;
     * 
     * expression   -> assignment ;
     * assignment   -> (call ".")? (IDENTIFIER "=" assignment) | incrementer ;
     * incrementer  -> (call ".")? (IDENTIFIER ("+=" | "-=" | "*=" | "/=") ) | logic_or ;
     * logic_or     -> logic_and ("or" logic_and)* ;
     * logic_and    -> equality ("and" equality)* ;
     * equality     -> comparison (("!=" | "==") comparison)* ;
     * comparison   -> term ((">" | ">=" | "<" | "<=") term)* ;
     * term         -> factor (("-" | "+") factor)* ;
     * factor       -> modulo (("*" | "/") modulo)* ;
     * modulo       -> unary (("%" | "%%") unary)* ;
     * unary        -> ("!" | "-") unary | call ;
     * call         -> primary (("(" arguments? ")" | "." IDENTIFIER) | ("[" NUMBER "]"))* ;
     * primary      -> NUMBER | STRING | "true" | "false" | "nil" | "(" expression ")" | "this" |
     *                 "[" arguments* "]" | IDENTIFIER ;
     * 
     * arguments    -> expression ("," expression)* ;
     */

    /** The current list of tokens. */
    let tokens_: BL_Scanner.Token[];
    /** Current index in the token list. */
    let currentToken = -1;

    /** All tokens that can start a statement. Used for synchronizing after a syntax error. */
    const STATEMENT_START_TOKENS = [
        BL_Common.TokenType.CLASS,
        BL_Common.TokenType.FUNCTION,
        BL_Common.TokenType.FOR,
        BL_Common.TokenType.IF,
        BL_Common.TokenType.WHILE,
        BL_Common.TokenType.PRINT,
        BL_Common.TokenType.RETURN
    ];

    /** Parses tokens into an array of statements. */
    export function parse(tokens: BL_Scanner.Token[]): BL_Stmts.Stmt[] {
        tokens_ = tokens.slice();
        currentToken = 0;

        const statements: BL_Stmts.Stmt[] = [];
        while (!isAtEnd()) {
            statements.push(declaration());
        }

        return statements;
    }

    /**
     * Reports a parsing error message to the user, then returns (but does not throw) a
     * `BL_Common.ParseError` representing it.
     */
    function reportError(token: BL_Scanner.Token, message: string): BL_Common.ParseError {
        if (token.type === BL_Common.TokenType.EOF) {
            BotLang.error(token.line, "at end", message);
        }
        else {
            BotLang.error(token.line, `at "${token.lexeme}"`, message);
        }
        return new BL_Common.ParseError(message);
    }

    /** Returns whether all tokens have been consumed. */
    function isAtEnd(): boolean {
        return peek().type === BL_Common.TokenType.EOF;
    }

    /** Consumes and returns the next token. */
    function advance(): BL_Scanner.Token {
        if (!isAtEnd()) { ++currentToken; }
        return previous();
    }

    /** Returns the current token without consuming it. */
    function peek(): BL_Scanner.Token {
        return tokens_[currentToken];
    }

    /** Returns the previous token. */
    function previous(): BL_Scanner.Token {
        return tokens_[currentToken - 1];
    }

    /**
     * Returns whether the current token matches the expected type. Does not consume the current
     * token.
     */
    function check(type: BL_Common.TokenType): boolean {
        if (isAtEnd()) { return false; }
        return peek().type === type;
    }

    /**
     * Checks if the current token matches any of the expected types. If it does, the current token
     * is consumed.
     */
    function match(...tokens: BL_Common.TokenType[]): boolean {
        for (const type of tokens) {
            if (check(type)) {
                advance();
                return true;
            }
        }
        return false;
    }

    /**
     * Checks whether the current token is of the given type. If it is, the token is consumed and
     * the next token is returned. Otherwise, a `BL_ParseError` is thrown.
     */
    function consume(type: BL_Common.TokenType, message: string): BL_Scanner.Token {
        if (check(type)) { return advance(); }
        throw reportError(peek(), message);
    }
    
    /** Attempts to synchronize the parser after a syntax error is found. */
    function synchronize() {
        // step past the offending token
        advance();

        // walk forward until we hit the start of the next statement
        while (!isAtEnd()) {
            if (previous().type === BL_Common.TokenType.SEMICOLON ||
                STATEMENT_START_TOKENS.includes(peek().type)) {
                
                return;
            }

            advance();
        }
    }

    /** Parses an expression. */
    function expression(): BL_Exprs.Expr {
        return incrementer();
    }

    /** Parses a variable incrementer expression. */
    function incrementer(): BL_Exprs.Expr {
        const expr = assignment();

        if (match(BL_Common.TokenType.PLUS_EQUAL, BL_Common.TokenType.MINUS_EQUAL,
                  BL_Common.TokenType.SLASH_EQUAL, BL_Common.TokenType.STAR_EQUAL)) {

            // hack in a fake operator to use for the assignment
            let prev = previous();
            let operator: BL_Scanner.Token = null;
            switch (prev.type) {
                case BL_Common.TokenType.PLUS_EQUAL:
                    operator = new BL_Scanner.Token(
                        BL_Common.TokenType.PLUS, prev.lexeme, prev.literalValue, prev.line
                    );
                    break;
                case BL_Common.TokenType.MINUS_EQUAL:
                    operator = new BL_Scanner.Token(
                        BL_Common.TokenType.MINUS, prev.lexeme, prev.literalValue, prev.line
                    );
                    break;
                case BL_Common.TokenType.SLASH_EQUAL:
                    operator = new BL_Scanner.Token(
                        BL_Common.TokenType.SLASH, prev.lexeme, prev.literalValue, prev.line
                    );
                    break;
                case BL_Common.TokenType.STAR_EQUAL:
                    operator = new BL_Scanner.Token(
                        BL_Common.TokenType.STAR, prev.lexeme, prev.literalValue, prev.line
                    );
                    break;
            }

            const value = incrementer();

            // generate the right setter expression
            if (expr instanceof BL_Exprs.Variable) {
                return new BL_Exprs.Assignment(
                    expr.name, new BL_Exprs.Binary(expr, operator, value)
                );
            }
            // convert an index getter into an index setter
            else if (expr instanceof BL_Exprs.IndexGet) {
                return new BL_Exprs.IndexSet(
                    expr.indexee, expr.index, new BL_Exprs.Binary(expr, operator, value)
                );
            }
            // convert a get expression into a set expression - this allows for chained property
            // incrementing ("a.b.c += d") to work
            else if (expr instanceof BL_Exprs.Get) {
                return new BL_Exprs.Set(
                    expr.object, expr.name, new BL_Exprs.Binary(expr, operator, value)
                );
            }

            // this isn't worth throwing an error for
            reportError(prev, "Invalid assignment target.");
        }

        return expr;
    }

    /** Parses a variable assignment expression. */
    function assignment(): BL_Exprs.Expr {
        // logical operators have precedence over assignment
        const expr = logicalOr();

        if (match(BL_Common.TokenType.EQUAL)) {
            const equals = previous();
            // you can chain assignments, so "a = b = 0", will assign to both "a" and "b".
            const value = assignment();

            if (expr instanceof BL_Exprs.Variable) {
                return new BL_Exprs.Assignment(expr.name, value);
            }
            // convert an index getter into an index setter
            else if (expr instanceof BL_Exprs.IndexGet) {
                return new BL_Exprs.IndexSet(expr.indexee, expr.index, value);
            }
            // convert a get expression into a set expression - this allows for chained property
            // assignment ("a.b.c = d") to work
            else if (expr instanceof BL_Exprs.Get) {
                return new BL_Exprs.Set(expr.object, expr.name, value);
            }

            // this isn't worth throwing an error for
            reportError(equals, "Invalid assignment target.");
        }

        return expr;
    }

    /** Parses a logical `or` expression. */
    function logicalOr(): BL_Exprs.Expr {
        // for some reason logical operators have an order? idk why they don't have the same
        // precedence like comparisons do, but this is what other languages do, and when in rome...
        let expr = logicalAnd();

        while (match(BL_Common.TokenType.OR)) {
            const operator = previous();
            const right = logicalOr();
            expr = new BL_Exprs.Logical(expr, operator, right);
        }
        
        return expr;
    }

    /** Parses a logical `and` expression */
    function logicalAnd(): BL_Exprs.Expr {
        // equalities have precedence over logical and
        let expr = equality();

        while (match(BL_Common.TokenType.AND)) {
            const operator = previous();
            const right = logicalAnd();
            expr = new BL_Exprs.Logical(expr, operator, right);
        }
        
        return expr;
    }

    /** Parses an equality (!= or ==) expression. */
    function equality(): BL_Exprs.Expr {
        // comparisons have precedence over equality
        let expr = comparison();

        // all equality expressions are either "x == y" or "x != y", so we recursively consume until
        // we find a token that isn't one of those operators
        while (match(BL_Common.TokenType.NOT_EQUAL, BL_Common.TokenType.DOUBLE_EQUAL)) {
            const operator = previous();
            const right = equality();
            expr = new BL_Exprs.Binary(expr, operator, right);
        }

        return expr;
    }

    /** Parses a comparison (<, <=, >, or >=) expression. */
    function comparison(): BL_Exprs.Expr {
        // addition and subtraction have precedence over comparisons
        let expr = term();

        // recursively parse the right side of the expression
        while (match(BL_Common.TokenType.LESS, BL_Common.TokenType.LESS_EQUAL,
                     BL_Common.TokenType.GREATER, BL_Common.TokenType.GREATER_EQUAL)) {

            const operator = previous();
            const right = comparison();
            expr = new BL_Exprs.Binary(expr, operator, right);
        }

        return expr;
    }

    /** Parses an addition or subtraction expression. */
    function term(): BL_Exprs.Expr {
        // multiplication and division has precedence over addition and subtraction
        let expr = factor();

        // are you seeing a theme yet?
        while (match(BL_Common.TokenType.PLUS, BL_Common.TokenType.MINUS)) {
            const operator = previous();
            const right = term();
            expr = new BL_Exprs.Binary(expr, operator, right);
        }

        return expr;
    }

    /** Parses a multiplication or division expression. */
    function factor(): BL_Exprs.Expr {
        // exponent expressions have precedence over multiplication and division
        let expr = exponent();

        while (match(BL_Common.TokenType.SLASH, BL_Common.TokenType.STAR)) {
            const operator = previous();
            const right = factor();
            expr = new BL_Exprs.Binary(expr, operator, right);
        }

        return expr;
    }

    /** Parses an exponent expression. */
    function exponent(): BL_Exprs.Expr {
        // modulo expressions have precedence over multiplication and division
        let expr = modulo();

        while (match(BL_Common.TokenType.CARET)) {
            const operator = previous();
            const right = exponent();
            expr = new BL_Exprs.Binary(expr, operator, right);
        }

        return expr;
    }

    /** Parses a remainder (%) or modulo (%%) expression. */
    function modulo(): BL_Exprs.Expr {
        // unary expressions have precedence over modulo expressions
        let expr = unary();

        while (match(BL_Common.TokenType.MOD, BL_Common.TokenType.DOUBLE_MOD)) {
            const operator = previous();
            const right = modulo();
            expr = new BL_Exprs.Binary(expr, operator, right);
        }

        return expr;
    }

    /** Parses a not (!) or negation (-) expression. */
    function unary(): BL_Exprs.Expr {
        if (match(BL_Common.TokenType.NOT, BL_Common.TokenType.MINUS)) {
            const operator = previous();
            // chain unary expressions until we run out of operators
            const right = unary();
            return new BL_Exprs.Unary(operator, right);
        }

        // if there's no operator, pass to a function call
        return call();
    }

    /** Parses the start of a function call or property access expression. */
    function call(): BL_Exprs.Expr {
        // primary expressions have precedence over calls
        let expr = primary();

        // loop repeatedly to allow multiple calls to be chained together
        while (true) {
            // function call
            if (match(BL_Common.TokenType.LEFT_PAREN)) {
                expr = finishCall(expr);
            }
            // array or string indexer
            else if (match(BL_Common.TokenType.LEFT_BRACKET)) {
                expr = indexer(expr);
            }
            // class property access
            else if (match(BL_Common.TokenType.DOT)) {
                const name = consume(
                    BL_Common.TokenType.IDENTIFIER, 'Expected property name after ".".'
                );
                expr = new BL_Exprs.Get(expr, name);
            }
            else {
                break;
            }
        }

        return expr;
    }

    /** Parses the argument list and closing parenthesis of a function call. */
    function finishCall(callee: BL_Exprs.Expr): BL_Exprs.Expr {
        // parse argument list
        const args: BL_Exprs.Expr[] = [];
        if (!check(BL_Common.TokenType.RIGHT_PAREN)) {
            do {
                args.push(expression());
            } while (match(BL_Common.TokenType.COMMA));
        }

        // make sure there's a closing parenthesis
        const paren = consume(
            BL_Common.TokenType.RIGHT_PAREN, 'Expected ")" after argument list.'
        );

        return new BL_Exprs.Call(callee, paren, args);
    }

    /** Parses a primary expression. */
    function primary(): BL_Exprs.Expr {
        if (match(BL_Common.TokenType.TRUE)) { return new BL_Exprs.Literal(true); }
        if (match(BL_Common.TokenType.FALSE)) { return new BL_Exprs.Literal(false); }
        if (match(BL_Common.TokenType.NIL)) { return new BL_Exprs.Literal(null); }

        if (match(BL_Common.TokenType.NUMBER, BL_Common.TokenType.STRING)) {
            return new BL_Exprs.Literal(previous().literalValue);
        }

        if (match(BL_Common.TokenType.SUPER)) {
            const keyword = previous();
            consume(BL_Common.TokenType.DOT, 'Expected "." after "super".');
            const method = consume(
                BL_Common.TokenType.IDENTIFIER, 'Expected superclass method name.'
            );
            return new BL_Exprs.Super(keyword, method);
        }

        if (match(BL_Common.TokenType.THIS)) {
            return new BL_Exprs.This(previous());
        }

        if (match(BL_Common.TokenType.IDENTIFIER)) {
            return new BL_Exprs.Variable(previous());
        }

        // array initializer list
        if (match(BL_Common.TokenType.LEFT_BRACKET)) {
            return arrayList();
        }

        if (match(BL_Common.TokenType.LEFT_PAREN)) {
            const expr = expression();

            // check for a closing parenthesis
            consume(BL_Common.TokenType.RIGHT_PAREN, 'Expected ")" after expression.');
            return new BL_Exprs.Grouping(expr);
        }

        // if we get this far, we're at a token that can't start an expression
        throw reportError(peek(), "Expected an expression.");
    }

    /** Parses an array initializer list. */
    function arrayList(): BL_Exprs.Array {
        // loop through and get all the items (if any)
        const items: BL_Exprs.Expr[] = [];
        if (!check(BL_Common.TokenType.RIGHT_BRACKET)) {
            do {
                // handle trailing commas
                if (check(BL_Common.TokenType.RIGHT_BRACKET)) {
                    break;
                }
                else {
                    items.push(expression());
                }
            } while (match(BL_Common.TokenType.COMMA))
        }

        // check for a closing bracket
        consume(BL_Common.TokenType.RIGHT_BRACKET, 'Expected "]" after array initializer.');

        return new BL_Exprs.Array(items);
    }

    /** Parses an array indexer. */
    function indexer(indexee: BL_Exprs.Expr): BL_Exprs.IndexGet {
        // indexers must have exactly one argument
        if (check(BL_Common.TokenType.RIGHT_BRACKET)) {
            throw reportError(peek(), "Expected argument to array or string indexer.");
        }

        const index = expression();

        // check for a closing bracket
        consume(BL_Common.TokenType.RIGHT_BRACKET, 'Expected "]" after index.');

        return new BL_Exprs.IndexGet(indexee, index);
    }

    /** Parses a statement and handles error synchronization. */
    function declaration(): BL_Stmts.Stmt {
        // try...catch to synchronize after syntax errors
        try {
            // check for a class, function, or variable declaration
            if (match(BL_Common.TokenType.CLASS)) { return classStmt(); }
            if (match(BL_Common.TokenType.FUNCTION)) { return functionStmt("function"); }
            if (match(BL_Common.TokenType.VAR)) { return varStmt(); }
            // otherwise delegate to the base statement parser
            return statement();
        }
        catch (e) {
            // re-throw unexpected errors
            if (!(e instanceof BL_Common.ParseError)) {
                throw e;
            }

            // synchronize so we can keep parsing and find as many syntax errors as possible
            synchronize();
            return null;
        }
    }

    /** Parses a class declaration. */
    function classStmt(): BL_Stmts.Class {
        const name = consume(BL_Common.TokenType.IDENTIFIER, "Expected class name.");

        // check for a superclass to inherit from
        let superClass: BL_Exprs.Variable = null;
        // superclassing is currently disabled because i can't get it to work and i want to spend my
        // time on more important things lmao
        // if (match(BL_Common.TokenType.LESS)) {
        //     consume(BL_Common.TokenType.IDENTIFIER, 'Expected superclass name.');
        //     superClass = new BL_Exprs.Variable(previous());
        // }

        consume(BL_Common.TokenType.LEFT_BRACE, 'Expected "{" before class body.');

        const methods: BL_Stmts.Function[] = [];
        while (!check(BL_Common.TokenType.RIGHT_BRACE) && !isAtEnd()) {
            methods.push(functionStmt("method"));
        }

        consume(BL_Common.TokenType.RIGHT_BRACE, 'Expected "}" after class body.');

        return new BL_Stmts.Class(name, superClass, methods);
    }
    
    /** Parses a function or method definition. */
    function functionStmt(type: "function" | "method"): BL_Stmts.Function {
        const name = consume(BL_Common.TokenType.IDENTIFIER, `Expected ${type} name.`);
        consume(BL_Common.TokenType.LEFT_PAREN, `Expected "(" after ${type} name.`);
        
        // parse argument list
        const params: BL_Scanner.Token[] = [];
        if (!check(BL_Common.TokenType.RIGHT_PAREN)) {
            do {
                params.push(consume(BL_Common.TokenType.IDENTIFIER, "Expected parameter name."));
            } while (match(BL_Common.TokenType.COMMA));
        }
        consume(BL_Common.TokenType.RIGHT_PAREN, `Expected ")" after parameter list.`);

        consume(BL_Common.TokenType.LEFT_BRACE, `Expected "{" before ${type} body.`);
        const body = block();
        return new BL_Stmts.Function(name, params, body);
    }

    /** Parses a variable declaration. */
    function varStmt(): BL_Stmts.Var {
        // the variable name ("var foo") is required
        const name = consume(BL_Common.TokenType.IDENTIFIER, "Expected a variable name.");

        // the initializer ("= bar") is not required
        let initializer: BL_Exprs.Expr = null;
        if (match(BL_Common.TokenType.EQUAL)) {
            initializer = expression();
        }

        consume(BL_Common.TokenType.SEMICOLON, 'Expected ";" after variable declaration.');
        return new BL_Stmts.Var(name, initializer);
    }

    /** Parses any (non-declaration) statement. */
    function statement(): BL_Stmts.Stmt {
        if (match(BL_Common.TokenType.FOR)) { return forStmt(); }
        if (match(BL_Common.TokenType.IF)) { return ifStmt(); }
        if (match(BL_Common.TokenType.RETURN)) { return returnStmt(); }
        if (match(BL_Common.TokenType.PRINT)) { return printStmt(); }
        if (match(BL_Common.TokenType.WHILE)) { return whileStmt(); }
        if (match(BL_Common.TokenType.LEFT_BRACE)) { return new BL_Stmts.Block(block()); }

        // expression statements are the "default" statement
        return expressionStmt();
    }

    /** Parses an expression statement. */
    function expressionStmt(): BL_Stmts.Expression {
        // expression statements just evaluate an expression
        const value = expression();
        consume(BL_Common.TokenType.SEMICOLON, 'Expected ";" after expression.');
        return new BL_Stmts.Expression(value);
    }

    /** Parses a for statement. */
    function forStmt(): BL_Stmts.Stmt {
        consume(BL_Common.TokenType.LEFT_PAREN, 'Expected "(" after "for".');

        let initializer: BL_Stmts.Stmt;
        if (match(BL_Common.TokenType.SEMICOLON)) {
            initializer = null;
        }
        else if (match(BL_Common.TokenType.VAR)) {
            initializer = varStmt();
        }
        else {
            initializer = expressionStmt();
        }

        let condition: BL_Exprs.Expr = null;
        if (!check(BL_Common.TokenType.SEMICOLON)) {
            condition = expression();
        }
        consume(BL_Common.TokenType.SEMICOLON, 'Expected ";" after loop condition.');

        let increment: BL_Exprs.Expr = null;
        if (!check(BL_Common.TokenType.RIGHT_PAREN)) {
            increment = expression();
        }
        consume(BL_Common.TokenType.RIGHT_PAREN, 'Expected ")" after loop clauses.');

        let body = statement();

        if (increment !== null) {
            body = new BL_Stmts.Block([
                body, new BL_Stmts.Expression(increment)
            ]);
        }

        if (condition === null) {
            condition = new BL_Exprs.Literal(true);
        }

        // for loops are a lie, it's all actually while loops in blocks
        body = new BL_Stmts.While(condition, body);

        if (initializer !== null) {
            body = new BL_Stmts.Block([initializer, body]);
        }

        return body;
    }

    /** Parses an if (and else) statement. */
    function ifStmt(): BL_Stmts.If {
        consume(BL_Common.TokenType.LEFT_PAREN, 'Expected "(" after "if".');
        const condition = expression();
        consume(BL_Common.TokenType.RIGHT_PAREN, 'Expected ")" after if condition.');

        // if statements don't have to be followed by a block in curly braces, you can use them with
        // a single statement too ("if (condition) thing()"). you can actually do this in JS too,
        // but the KA sandbox won't let you (which is good)
        const thenBranch = statement();
        // only create an else branch if it exists
        let elseBranch = null;
        if (match(BL_Common.TokenType.ELSE)) {
            // note that we don't need to explicitly check for "else if" here
            elseBranch = statement();
        }

        return new BL_Stmts.If(condition, thenBranch, elseBranch);
    }

    /** Parses a return statement. */
    function returnStmt(): BL_Stmts.Return {
        const keyword = previous();
        let value: BL_Exprs.Expr = null;
        // a return value is optional
        if (!check(BL_Common.TokenType.SEMICOLON)) {
            value = expression();
        }

        consume(
            BL_Common.TokenType.SEMICOLON,
            value ? 'Expected ";" after return value.' : 'Expected ";" after "return".'
        );

        return new BL_Stmts.Return(keyword, value);
    }

    /** Parses a print statement. */
    function printStmt(): BL_Stmts.Print {
        // print statements print an expression
        const value = expression();
        consume(BL_Common.TokenType.SEMICOLON, 'Expected ";" after value.');
        return new BL_Stmts.Print(value);
    }

    /** Parses a while statement. */
    function whileStmt(): BL_Stmts.While {
        consume(BL_Common.TokenType.LEFT_PAREN, 'Expected "(" after "while".');
        const condition = expression();
        consume(BL_Common.TokenType.RIGHT_PAREN, 'Expected ")" after while loop condition.');

        // while loops also don't have to be followed by an entire block
        const body = statement();

        return new BL_Stmts.While(condition, body);
    }

    /** Parses a list of statements for use in a block statement, function, or method. */
    function block(): BL_Stmts.Stmt[] {
        const statements: BL_Stmts.Stmt[] = [];
        while (!check(BL_Common.TokenType.RIGHT_BRACE) && !isAtEnd()) {
            statements.push(declaration());
        }
        consume(BL_Common.TokenType.RIGHT_BRACE, 'Expected "}" after block.');
        return statements;
    }
}

/* ----- end of file ----- */