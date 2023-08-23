import { assertEquals } from "https://deno.land/std@0.192.0/testing/asserts.ts";
import { Expression, Token } from "./ast.ts";
import {
  assignment,
  binary,
  call,
  expression_statement,
  identifier,
  lambda,
  nil,
  number,
  object,
  print,
  property_access,
  return_,
  string,
  variable_declaration,
  while_,
} from "./ast_builder.ts";
import { Parser } from "./parser.ts";
import { Tokenizer } from "./Tokenizer.ts";

Deno.test("parser_test", async (t) => {
  await t.step("tokenizer", () => {
    const source = `fun print_numbers () {} let = while < > <= >= == !=
          and or true false nil return yield spawn + - , ;
          <- -> "hello" :`;
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
        { type: "Colon", lexeme: ":" },
        { type: "EOF", lexeme: "" },
      ] satisfies Token[],
    );
  });

  await t.step("parser", async (t) => {
    await t.step("expressions", async (t) => {
      await t.step("object literal", () => {
        const source = "{ a: 1, b: { x: 2 } }";
        const parser = new Parser();
        const result = parser.parse_expression_from_source(source);
        assertEquals(
          result,
          object([{ name: "a", value: number(1) }, {
            name: "b",
            value: object([{ name: "x", value: number(2) }]),
          }]),
        );
      });
      await t.step("lambda", () => {
        const source = "fun (x) { x + 1; }";
        const parser = new Parser();
        const result = parser.parse_expression_from_source(source);
        assertEquals(
          result,
          lambda(["x"], [
            expression_statement(binary("+", identifier("x"), number(1))),
          ]),
        );
      });
      await t.step("number literal", () => {
        const source = "123";
        const parser = new Parser();
        const result = parser.parse_expression_from_source(source);
        assertEquals(result, number(123));
      });

      await t.step("binary expression", () => {
        const source = "1 + 2 < 5";
        const parser = new Parser();
        const result = parser.parse_expression_from_source(source);
        assertEquals(
          result,
          binary("<", binary("+", number(1), number(2)), number(5)),
        );
      });

      await t.step("channel receive expression", () => {
        const source = "<-channel";
        const parser = new Parser();
        const result = parser.parse_expression_from_source(source);
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
        const result = parser.parse_expression_from_source(source);
        assertEquals(result, string("hello"));
      });

      await t.step("nil literal", () => {
        const source = "nil";
        const parser = new Parser();
        const result = parser.parse_expression_from_source(source);
        assertEquals(result, nil());
      });

      await t.step("identifier expression", () => {
        const source = "identifier";
        const parser = new Parser();
        const result = parser.parse_expression_from_source(source);
        assertEquals(
          result,
          identifier("identifier"),
        );
      });

      await t.step("member access", () => {
        const source = "object.property.name";
        const parser = new Parser();
        const result = parser.parse_expression_from_source(source);
        assertEquals(
          result,
          property_access(
            property_access(identifier("object"), "property"),
            "name",
          ),
        );
      });

      await t.step("call", () => {
        const source = "max(a, b)";
        const parser = new Parser();
        const result = parser.parse_expression_from_source(source);
        assertEquals(
          result,
          call(identifier("max"), [identifier("a"), identifier("b")]),
        );
      });
    });

    await t.step("statements", async (t) => {
      await t.step("channel send", () => {
        const source = "channel <- 42;";
        const parser = new Parser();
        const result = parser.parse(source);
        assertEquals(
          result[0],
          {
            type: "ChannelSendStatement",
            channel: identifier("channel"),
            value: number(42),
          },
        );
      });
      await t.step("assignment", () => {
        const source = "x = 42;";
        const parser = new Parser();
        const result = parser.parse(source);
        assertEquals(
          result[0],
          assignment("x", number(42)),
        );
      });
      await t.step("yield", () => {
        const source = "yield;";
        const parser = new Parser();
        const result = parser.parse(source);
        assertEquals(result[0], { type: "YieldStatement" });
      });

      await t.step("print", () => {
        const source = "print 42;";
        const parser = new Parser();
        const result = parser.parse(source);
        assertEquals(result[0], print(number(42)));
      });

      await t.step("return", () => {
        const source = "return 42;";
        const parser = new Parser();
        const result = parser.parse(source);
        assertEquals(result[0], return_(number(42)));
      });

      await t.step("variable declaration", () => {
        const source = "let x = 42;";
        const parser = new Parser();
        const result = parser.parse(source);
        assertEquals(
          result[0],
          variable_declaration("x", number(42)),
        );
      });

      await t.step("while", () => {
        const source = "while x { print 42; }";
        const parser = new Parser();
        const result = parser.parse(source);
        assertEquals(while_(identifier("x"), [print(number(42))]), result[0]);
      });
    });
  });
});
