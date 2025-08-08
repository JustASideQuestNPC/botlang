/* ----- src/bot-lang/scanner.ts ----- */

/** Converts a string into a list of Botlang tokens. */
namespace BL_Scanner {
    

    /** A single token. */
    export class Token {
        type: BL_Common.TokenType;
        lexeme: string; // the actual characters that make up the token
        literalValue: BL_Common.DataTypeUnion; // literal value
        line: number; // the line that the token is on; used for error reporting

        constructor(type: BL_Common.TokenType, lexeme: string, literalValue: BL_Common.DataTypeUnion,
                    line: number,) {
            this.type = type;
            this.lexeme = lexeme;
            this.literalValue = literalValue;
            this.line = line;
        }
    }

    let source: string;
    let tokens: Token[];

    let start = 0; // index of the first character in the current lexeme
    let current = 0; // index of the character currently being checked
    let line = 0; // the line currently being scanned

    /** Returns whether the entire code string has been consumed. */
    function isAtEnd(): boolean {
        return current >= source.length;
    }

    /** Consumes and returns the next character. */
    function advance(): string {
        return source[current++];
    }

    /** Returns the next character without consuming it. */
    function peek(): string {
        if (isAtEnd()) { return ""; }
        return source[current];
    }

    /** Returns the character ahead of the next one, without consuming it. */
    function peekNext(): string {
        if (current + 1 >= source.length) { return ""; }
        return source[current + 1];
    }

    /**
     * Checks if the next character matches the expected character. If it does, the next character
     * is consumed.
     */
    function match(expected: string): boolean {
        if (isAtEnd() || source[current] !== expected) { return false; }
        ++current;
        return true;
    }

    /** Adds a new token. A literal value is only required for literal tokens. */
    function addToken(type: BL_Common.TokenType, literal: BL_Common.DataTypeUnion = null) {
        // automatically use the current lexeme
        const lexeme = source.slice(start, current);
        tokens.push(new Token(type, lexeme, literal, line));
    }

    /** Parses a string literal. */
    function parseString(startChar: '"' | "'") {
        // walk forward until we hit the end of the string
        while (peek() !== startChar && !isAtEnd()) {
            if (peek() === "\n") { ++line; }
            advance();
        }

        if (isAtEnd()) {
            BotLang.error(line, "Unclosed string.");
            return;
        }

        // consume the closing quote
        advance();

        // strip the surrounding quotes
        let str = source.slice(start + 1, current - 1);
        // handle escape characters using this regex that i shamelessly stole from stackoverflow
        str = str.replace(/[\n]/g,'\\n');
        str = str.replace(/[\r]/g,'\\r');
        str = str.replace(/[\t]/g,'\\t');
        str = str.replace(/[\b]/g,'\\b');
        str = str.replace(/[\f]/g,'\\f');

        BL_Common.verboseLog(`string literal: "${str}"`);
        addToken(BL_Common.TokenType.STRING, str);
    }

    /** Parses a number literal. */
    function parseNumber() {
        // consume the first part of the number
        while (isDigit(peek())) { advance(); }
        
        // look for a decimal part
        if (peek() === "." && isDigit(peekNext())) {
            // consume the decimal
            advance();

            // consume the rest of the number
            while(isDigit(peek())) { advance(); }
        }

        BL_Common.verboseLog(`number literal: ${Number.parseFloat(source.slice(start, current))}`);
        addToken(BL_Common.TokenType.NUMBER, Number.parseFloat(source.slice(start, current)));
    }

    /** Parses a keyword or identifier. */
    function parseIdentifier() {
        while(isAlphaNumeric(peek())) { advance(); }

        // add a keyword if the string exists in the lookup table, otherwise add an indentifier
        const text = source.slice(start, current);
        if (BL_Common.IDENTIFIER_KEYWORDS[text]) {
            addToken(BL_Common.IDENTIFIER_KEYWORDS[text]);
        }
        else {
            addToken(BL_Common.TokenType.IDENTIFIER);
        }
    }

    // character type checking
    function isDigit(char: string): boolean {
        // you will never convince me that regex isn't just a set of arcane runes we pulled out of a
        // cursed temple in the 60s
        return /^\d+$/.test(char);
    }
    function isAlpha(char: string): boolean {
        return /[a-zA-Z]|_/.test(char);
    }
    function isAlphaNumeric(char: string): boolean {
        return isAlpha(char) || isDigit(char);
    }

    /** Scans the next token. */
    function scanToken() {
        const c = advance();
        switch (c) {
            // for a comment, consume everything until we hit the end of the line
            case "#":
                while (peek() !== "\n" && !isAtEnd()) { advance(); }
                break;

            // ignore whitespace
            case " ": case "\r": case "\t": break;
            case "\n": ++line; break;

            // single-character tokens
            case "(": addToken(BL_Common.TokenType.LEFT_PAREN); break;
            case ")": addToken(BL_Common.TokenType.RIGHT_PAREN); break;
            case "[": addToken(BL_Common.TokenType.LEFT_BRACKET); break;
            case "]": addToken(BL_Common.TokenType.RIGHT_BRACKET); break;
            case "{": addToken(BL_Common.TokenType.LEFT_BRACE); break;
            case "}": addToken(BL_Common.TokenType.RIGHT_BRACE); break;
            case ",": addToken(BL_Common.TokenType.COMMA); break;
            case ".": addToken(BL_Common.TokenType.DOT); break;
            case ";": addToken(BL_Common.TokenType.SEMICOLON); break;
            case "^": addToken(BL_Common.TokenType.CARET); break;

            // 1- or 2- character tokens
            case "+": 
                if (match("=")) {
                    addToken(BL_Common.TokenType.PLUS_EQUAL);
                }
                else {
                    addToken(BL_Common.TokenType.PLUS);
                }
                break;
            case "-": 
                if (match("=")) {
                    addToken(BL_Common.TokenType.MINUS_EQUAL);
                }
                else {
                    addToken(BL_Common.TokenType.MINUS);
                }
                break;
            case "/": 
                if (match("=")) {
                    addToken(BL_Common.TokenType.SLASH_EQUAL);
                }
                else {
                    addToken(BL_Common.TokenType.SLASH);
                }
                break;
            case "*": 
                if (match("=")) {
                    addToken(BL_Common.TokenType.STAR_EQUAL);
                }
                else {
                    addToken(BL_Common.TokenType.STAR);
                }
                break;
            case "!": 
                if (match("=")) {
                    addToken(BL_Common.TokenType.NOT_EQUAL);
                }
                else {
                    addToken(BL_Common.TokenType.NOT);
                }
                break;
            case "!":
                if (match("=")) {
                    addToken(BL_Common.TokenType.NOT_EQUAL);
                }
                else {
                    addToken(BL_Common.TokenType.NOT);
                }
                break;
            case "=":
                if (match("=")) {
                    addToken(BL_Common.TokenType.DOUBLE_EQUAL);
                }
                else {
                    addToken(BL_Common.TokenType.EQUAL);
                }
                break;
            case ">":
                if (match("=")) {
                    addToken(BL_Common.TokenType.GREATER_EQUAL);
                }
                else {
                    addToken(BL_Common.TokenType.GREATER);
                }
                break;
            case "<":
                if (match("=")) {
                    addToken(BL_Common.TokenType.LESS_EQUAL);
                }
                else {
                    addToken(BL_Common.TokenType.LESS);
                }
                break;
            case "%":
                if (match("%")) {
                    addToken(BL_Common.TokenType.DOUBLE_MOD);
                }
                else {
                    addToken(BL_Common.TokenType.MOD);
                }
                break;

            // string literals
            case '"':
                parseString('"');
                break;
            case "'":
                parseString("'");
                break;

            default:
                if (isDigit(c)) {
                    parseNumber();
                }
                else if (isAlpha(c)) {
                    parseIdentifier();
                }
                else {
                    // report an error but keep going so we can find as many errors as possible
                    BotLang.error(line, `Unexpected character "${c}".`);
                }
                break;
        }
    }

    /** Scans and returns all tokens in a string. */
    export function scan(code: string): Token[] {
        source = code;
        tokens = [];
        current = 0;

        while (!isAtEnd()) {
            // reset the start of the current token
            start = current;
            scanToken();
        }

        // add a dummy token to mark the end of the code
        tokens.push(new Token(BL_Common.TokenType.EOF, "", null, line));
        return tokens.slice();
    }
}

/* ----- end of file ----- */