import { assertEquals } from "https://deno.land/std@0.192.0/testing/asserts.ts";
import { Statement } from "./ast.ts";
import {
  assignment,
  binary,
  block,
  boolean,
  call,
  expression_statement,
  identifier,
  if_,
  lambda,
  nil,
  number,
  print,
  return_,
  spawn,
  variable_declaration,
  while_,
  yield_,
} from "./ast_builder.ts";
import { Compiler } from "./compiler.ts";
import { Parser } from "./parser.ts";

Deno.test("compiler_test", async (t) => {
  await t.step("Compiles expressions", async (t) => {
    await t.step("Compiles boolean expressions", () => {
      const compiler = new Compiler();
      const instructions = compiler.compile_expression(boolean(true));
      assertEquals(instructions, [{
        type: "Push",
        value: { type: "Boolean", value: true },
      }]);

      const instructions2 = compiler.compile_expression(boolean(false));
      assertEquals(instructions2, [{
        type: "Push",
        value: { type: "Boolean", value: false },
      }]);
    });
    await t.step("Compiles nil expressions", () => {
      const compiler = new Compiler();
      const instructions = compiler.compile_expression(nil());
      assertEquals(instructions, [
        { type: "Push", value: { type: "Nil" } },
      ]);
    });
    await t.step("Compiles number expressions", () => {
      const compiler = new Compiler();
      const instructions = compiler.compile_expression(number(10));
      assertEquals(instructions, [
        { type: "Push", value: { type: "Number", value: 10 } },
      ]);
    });
    await t.step("Compiles binary expressions", () => {
      const compiler = new Compiler();
      const instructions = compiler.compile_expression(
        binary("+", number(10), number(20)),
      );
      assertEquals(instructions, [
        { type: "Push", value: { type: "Number", value: 10 } },
        { type: "Push", value: { type: "Number", value: 20 } },
        { type: "Plus" },
      ]);
    });
    await t.step("Compiles identifier expressions", () => {
      const compiler = new Compiler();
      const instructions = compiler.compile_expression(identifier("x"));
      assertEquals(instructions, [{ type: "GetLocal", name: "x" }]);
    });
    await t.step("Call expressions", () => {
      const compiler = new Compiler();
      const instructions = compiler.compile_expression(
        call(identifier("Plus"), [number(10), number(20)]),
      );
      assertEquals(instructions, [
        { type: "Push", value: { type: "Number", value: 10 } },
        { type: "Push", value: { type: "Number", value: 20 } },
        { type: "GetLocal", name: "Plus" },
        { type: "Call", arity: 2 },
      ]);
    });
  });
  await t.step("Compiles statements", async (t) => {
    await t.step("block statements", () => {
      const statement = block([print(number(10))]);
      const compiler = new Compiler();
      const instructions = compiler.compile([statement]);
      assertEquals(instructions, [
        { type: "BlockStart" },
        { type: "Push", value: { type: "Number", value: 10 } },
        { type: "Print" },
        { type: "BlockEnd" },
      ]);
    });
    await t.step("compiles if statements", async (t) => {
      await t.step("if without else", () => {
        const statement = if_(identifier("x"), [print(number(10))], []);
        const compiler = new Compiler();
        const then_body = compiler.compile(statement.then_branch);
        const instructions = compiler.compile([statement]);
        assertEquals(instructions, [
          { type: "BlockStart" },
          { type: "GetLocal", name: "x" },
          { type: "JumpIfFalse", offset: then_body.length + 1 },
          { type: "Push", value: { type: "Number", value: 10 } },
          { type: "Print" },
          { type: "Jump", offset: 0 },
          { type: "BlockEnd" },
        ]);
      });
      await t.step("if with else", () => {
        const source = "if x { print 10; } else { print 20; }";
        const statement = new Parser().parse(source)[0] as Extract<
          Statement,
          { type: "IfStatement" }
        >;
        const compiler = new Compiler();
        const then_body = compiler.compile(statement.then_branch);
        const else_body = compiler.compile(statement.else_branch!);
        const instructions = compiler.compile([statement]);
        assertEquals(instructions, [
          { type: "BlockStart" },
          { type: "GetLocal", name: "x" },
          { type: "JumpIfFalse", offset: then_body.length + 1 },
          { type: "Push", value: { type: "Number", value: 10 } },
          { type: "Print" },
          { type: "Jump", offset: else_body.length },
          { type: "Push", value: { type: "Number", value: 20 } },
          { type: "Print" },
          { type: "BlockEnd" },
        ]);
      });
    });
    await t.step("Compiles while statements", () => {
      //while (x < 10) { x = x + 1; }
      const statement: Statement = while_(
        binary("<", identifier("x"), number(10)),
        [assignment("x", binary("+", identifier("x"), number(1)))],
      );
      const compiler = new Compiler();
      const instructions = compiler.compile([statement]);
      assertEquals(instructions, [
        { type: "BlockStart" },
        { type: "GetLocal", name: "x" },
        { type: "Push", value: { type: "Number", value: 10 } },
        { type: "LessThan" },
        { type: "JumpIfFalse", offset: 5 },
        { type: "GetLocal", name: "x" },
        { type: "Push", value: { type: "Number", value: 1 } },
        { type: "Plus" },
        { type: "SetLocal", name: "x" },
        { type: "Jump", offset: -9 },
        { type: "BlockEnd" },
      ]);
    });
    await t.step("Compiles expression statements", () => {
      const compiler = new Compiler();
      const instructions = compiler.compile([
        expression_statement(number(10)),
      ]);
      assertEquals(instructions, [
        { type: "Push", value: { type: "Number", value: 10 } },
        { type: "Pop" },
      ]);
    });
    await t.step("Compiles return statements", () => {
      const compiler = new Compiler();
      const instructions = compiler.compile([return_(number(10))]);
      assertEquals(instructions, [
        { type: "Push", value: { type: "Number", value: 10 } },
        { type: "Return" },
      ]);
    });

    await t.step("Compiles spawn statements", () => {
      const compiler = new Compiler();
      const expression: Statement = spawn(
        call(lambda(["x"], [print(identifier("x"))]), [number(10)]),
      );
      const instructions = compiler.compile([expression]);
      assertEquals(instructions, [
        { type: "Push", value: { type: "Number", value: 10 } },
        {
          type: "Push",
          value: {
            type: "Function",
            parameters: ["x"],
            body: [
              { type: "GetLocal", name: "x" },
              { type: "Print" },
              { type: "Push", value: { type: "Nil" } },
              { type: "Return" },
            ],
          },
        },
        { type: "Spawn", arity: 1 },
      ]);
    });
    await t.step("Compiles yield statements", () => {
      const compiler = new Compiler();
      const instructions = compiler.compile([yield_()]);
      assertEquals(instructions, [{ type: "Yield" }]);
    });
    await t.step("Compiles print statements", () => {
      const compiler = new Compiler();
      const instructions = compiler.compile([print(number(10))]);
      assertEquals(instructions, [
        { type: "Push", value: { type: "Number", value: 10 } },
        { type: "Print" },
      ]);
    });
    await t.step("Compiles variable declaration statements", () => {
      const compiler = new Compiler();
      const instructions = compiler.compile([
        variable_declaration("x", number(10)),
      ]);
      assertEquals(instructions, [
        { type: "Push", value: { type: "Number", value: 10 } },
        { type: "DeclareLocal", name: "x" },
      ]);
    });
    await t.step("Compiles assignment statements", () => {
      const compiler = new Compiler();
      const instructions = compiler.compile([
        assignment("x", number(10)),
      ]);
      assertEquals(instructions, [
        { type: "Push", value: { type: "Number", value: 10 } },
        { type: "SetLocal", name: "x" },
      ]);
    });
  });
});
