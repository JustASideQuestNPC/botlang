/* ----- src/bot-lang/utils.ts ----- */

/**
 * Miscellaneous utilities for the Botlang interpreter.
 */
namespace BL_Common {
    /** Max number of loop iterations before an `InfiniteLoopError` is thrown. */
    export const MAX_LOOP_ITERATIONS = 10000;

    /** All data types that can be stored in a variable. */
    export type DataTypeUnion = number | string | boolean | BL_StdFunction | BL_UserFunction |
                                BL_Class | BL_Instance | null;
    
    /** All possible tokens. */
    export enum TokenType {
        // single-character tokens
        LEFT_PAREN    = "LEFT_PAREN",    // "("
        RIGHT_PAREN   = "RIGHT_PAREN",   // ")"
        LEFT_BRACKET  = "LEFT_BRACKET",  // "["
        RIGHT_BRACKET = "RIGHT_BRACKET", // "]"
        LEFT_BRACE    = "LEFT_BRACE",    // "{"
        RIGHT_BRACE   = "RIGHT_BRACE",   // "}"
        COMMA         = "COMMA",         // ","
        DOT           = "DOT",           // "."
        SEMICOLON     = "SEMICOLON",     // ";"
        CARET         = "CARET",         // "^"

        // single- or double-character tokens
        PLUS          = "PLUS",          // "+"
        PLUS_EQUAL    = "PLUS_EQUAL",    // "+="
        MINUS         = "MINUS",         // "-"
        MINUS_EQUAL   = "MINUS_EQUAL",   // "-="
        SLASH         = "SLASH",         // "/"
        SLASH_EQUAL   = "SLASH_EQUAL",   // "/="
        STAR          = "STAR",          // "*"
        STAR_EQUAL    = "STAR_EQUAL",    // "*="
        NOT           = "NOT",           // "!"
        NOT_EQUAL     = "NOT_EQUAL",     // "!="
        EQUAL         = "EQUAL",         // "="
        DOUBLE_EQUAL  = "DOUBLE_EQUAL",  // "=="
        GREATER       = "GREATER",       // ">"
        GREATER_EQUAL = "GREATER_EQUAL", // ">="
        LESS          = "LESS",          // "<"
        LESS_EQUAL    = "LESS_EQUAL",    // "<="
        MOD           = "MOD",           // "%"
        DOUBLE_MOD    = "DOUBLE_MOD",    // "%%"

        // literals
        IDENTIFIER = "IDENTIFIER",
        STRING     = "STRING",
        NUMBER     = "NUMBER",

        // keywords
        AND      = "AND",
        CLASS    = "CLASS",
        ELSE     = "ELSE",
        FALSE    = "FALSE",
        FUNCTION = "FUNCTION",
        FOR      = "FOR",
        IF       = "IF",
        NIL      = "NIL", // Botlang uses "nil" instead of "null"
        OR       = "OR",
        PRINT    = "PRINT",
        RETURN   = "RETURN",
        SUPER    = "SUPER",
        THIS     = "THIS",
        TRUE     = "TRUE",
        VAR      = "VAR",
        WHILE    = "WHILE",

        // dummy token for end of code
        EOF = "EOF"
    }

    /** Maps keywords to their respective token types. */
    export const IDENTIFIER_KEYWORDS: { [key: string]: TokenType } = {
        "and":      TokenType.AND,
        "class":    TokenType.CLASS,
        "else":     TokenType.ELSE,
        "false":    TokenType.FALSE,
        "function": TokenType.FUNCTION,
        "for":      TokenType.FOR,
        "if":       TokenType.IF,
        "nil":      TokenType.NIL,
        "or":       TokenType.OR,
        "print":    TokenType.PRINT,
        "return":   TokenType.RETURN,
        "super":    TokenType.SUPER,
        "this":     TokenType.THIS,
        "true":     TokenType.TRUE,
        "var":      TokenType.VAR,
        "while":    TokenType.WHILE,
    }

    /**
     * Enables additional printouts when parsing and running code. WARNING: This will result in LOTS
     * of logs when running larger blocks of code. You have been warned.
     */
    export let verboseLogging = false;

    /** Prints a log to the console if verbose logging is enabled. */
    export function verboseLog(...message: any[]) {
        if (verboseLogging) {
            console.log(...message);
        }
    }

    /** Prints a warning to the console if verbose logging is enabled. */
    export function verboseWarn(...message: any[]) {
        if (verboseLogging) {
            console.warn(...message);
        }
    }

    /** Prints an error to the console if verbose logging is enabled. */
    export function verboseError(...message: any[]) {
        if (verboseLogging) {
            console.error(...message);
        }
    }

    /** Converts a value to a Botlang-formatted string. */
    export function valueToString(value: BL_Common.DataTypeUnion): string {
        if (value === null) {
            return "nil";
        }
        return value.toString();
    }

    /** Represents any error in Botlang code that shouldn't crash the JS environment. */
    export abstract class BL_Error extends Error {
        constructor(message: string) {
            super(message);
            this.name = "BotLang.Error";
        }
    }

    /** Represents an error caused when a loop runs for too many iterations. */
    export class InfiniteLoopError extends BL_Error {
        constructor(message: string) {
            super(message);
            this.name = "BotLang.InfiniteLoopError";
        }
    }

    /** Represents a syntax error found while parsing. */
    export class ParseError extends BL_Error {
        constructor(message: string) {
            super(message);
            this.name = "BotLang.ParseError";
        }
    }

    /** Represents an error caused when an array or string index is out of range. */
    export class RangeError extends BL_Error {
        constructor(message: string) {
            super(message);
            this.name = "BotLang.RangeError";
        }
    }

    /** Represents a miscellaneous runtime error that doesn't fall into any other categories. */
    export class RuntimeError extends BL_Error {
        constructor(message: string) {
            super(message);
            this.name = "BotLang.RuntimeError";
        }
    }

    /** Botlang equivalent of the JS `TypeError`. */
    export class TypeError extends BL_Error {
        constructor(message: string) {
            super(message);
            this.name = "BotLang.TypeError";
        }
    }
}

/* ----- end of file ----- */