import { Expression, Token } from "./ast.ts";
import {
  binary,
  call,
  identifier,
  nil,
  number,
  property_access,
  string,
} from "./ast_builder.ts";
import { Parser } from "./parser.ts";
import { Tokenizer } from "./Tokenizer.ts";
import { assertEquals } from "https://deno.land/std@0.192.0/testing/asserts.ts";

Deno.test("parser_test", async (t) => {
  await t.step("tokenizer", () => {
    const source = `fun print_numbers () {} let = while < > <= >= == !=
          and or true false nil return yield spawn + - , ;
          <- -> "hello"`;
    const tokenizer = new Tokenizer(source);
    const tokens = tokenizer.tokenize();
    assertEquals(
      tokens,
      [
        { type: "Fun", lexeme: "fun" },
        { type: "Identifier", lexeme: "print_numbers" },
        { type: "LeftParen", lexeme: "(" },
        { type: "RightParen", lexeme: ")" },
        { type: "LeftBrace", lexeme: "{" },
        { type: "RightBrace", lexeme: "}" },
        { type: "Let", lexeme: "let" },
        { type: "Equal", lexeme: "=" },
        { type: "While", lexeme: "while" },
        { type: "LessThan", lexeme: "<" },
        { type: "GreaterThan", lexeme: ">" },
        { type: "LessThanEqual", lexeme: "<=" },
        { type: "GreaterThanEqual", lexeme: ">=" },
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
        { type: "String", lexeme: '"hello"' },
        { type: "EOF", lexeme: "" },
      ] satisfies Token[],
    );
  });

  await t.step("parser", async (t) => {
    await t.step("expressions", async (t) => {
      await t.step("number literal", () => {
        const source = "123";
        const parser = new Parser();
        parser.parse(source);
        const result = parser.parse_expression();
        assertEquals(result, number(123));
      });

      await t.step("binary expression", () => {
        const source = "1 + 2 < 5";
        const parser = new Parser();
        parser.parse(source);
        const result = parser.parse_expression();
        assertEquals(
          result,
          binary("+", number(1), binary("<", number(2), number(5))),
        );
      });

      await t.step("channel receive expression", () => {
        const source = "<-channel";
        const parser = new Parser();
        parser.parse(source);
        const result = parser.parse_expression();
        assertEquals(
          result,
          {
            type: "ChannelReceiveExpression",
            channel: { type: "IdentifierExpression", name: "channel" },
          } satisfies Expression,
        );
      });

      await t.step("string literal", () => {
        const source = '"hello"';
        const parser = new Parser();
        parser.parse(source);
        const result = parser.parse_expression();
        assertEquals(result, string("hello"));
      });

      await t.step("nil literal", () => {
        const source = "nil";
        const parser = new Parser();
        parser.parse(source);
        const result = parser.parse_expression();
        assertEquals(result, nil());
      });

      await t.step("identifier expression", () => {
        const source = "identifier";
        const parser = new Parser();
        parser.parse(source);
        const result = parser.parse_expression();
        assertEquals(
          result,
          identifier("identifier"),
        );
      });

      await t.step("member access", () => {
        const source = "object.property";
        const parser = new Parser();
        parser.parse(source);
        const result = parser.parse_expression();
        assertEquals(
          result,
          property_access(identifier("object"), "property"),
        );
      });

      await t.step("call", () => {
        const source = "max(a, b)";
        const parser = new Parser();
        parser.parse(source);
        const result = parser.parse_expression();
        assertEquals(
          result,
          call(identifier("max"), [identifier("a"), identifier("b")]),
        );
      });
    });
  });
});
