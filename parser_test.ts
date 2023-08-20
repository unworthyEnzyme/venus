import { Token, Tokenizer } from "./parser.ts";
import { assertEquals } from "https://deno.land/std@0.192.0/testing/asserts.ts";

Deno.test("parser_test", async (t) => {
    await t.step("tokenizer", () => {
        const source = `fun print_numbers () {} let = while < > <= >= == !=
          and or true false nil return yield spawn + - , ;
          <- ->`;
        const tokenizer = new Tokenizer(source);
        const tokens = tokenizer.tokenize();
        assertEquals(tokens, [
            { type: "Fun", lexeme: "fun" },
            { type: "Identifier", lexeme: "print_numbers" },
            { type: "LeftParen", lexeme: "(" },
            { type: "RightParen", lexeme: ")" },
            { type: "LeftBrace", lexeme: "{" },
            { type: "RightBrace", lexeme: "}" },
            { type: "Let", lexeme: "let" },
            { type: "Equal", lexeme: "=" },
            { type: "While", lexeme: "while" },
            { type: "Less", lexeme: "<" },
            { type: "Greater", lexeme: ">" },
            { type: "LessEqual", lexeme: "<=" },
            { type: "GreaterEqual", lexeme: ">=" },
            { type: "EqualEqual", lexeme: "==" },
            { type: "BangEqual", lexeme: "!=" },
            { type: "And", lexeme: "and" },
            { type: "Or", lexeme: "or" },
            { type: "True", lexeme: "true" },
            { type: "False", lexeme: "false" },
            { type: "Nil", lexeme: "nil" },
            { type: "Return", lexeme: "return" },
            { type: "Yield", lexeme: "yield" },
            { type: "Spawn", lexeme: "spawn" },
            { type: "Plus", lexeme: "+" },
            { type: "Minus", lexeme: "-" },
            { type: "Comma", lexeme: "," },
            { type: "Semicolon", lexeme: ";" },
            { type: "LeftArrow", lexeme: "<-" },
            { type: "RightArrow", lexeme: "->" },
            { type: "EOF", lexeme: "" },
        ] satisfies Token[]);
    });
});
