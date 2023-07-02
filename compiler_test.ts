import { Statement } from "./ast.ts";
import { Compiler } from "./compiler.ts";
import { assertEquals } from "https://deno.land/std@0.192.0/testing/asserts.ts";

Deno.test("compiler_test", async (t) => {
	await t.step("Compiles expressions", async (t) => {
		await t.step("Compiles nil expressions", () => {
			const compiler = new Compiler();
			const instructions = compiler.compileExpression({
				type: "NilLiteralExpression",
			});
			assertEquals(instructions, [
				{ type: "Push", value: { type: "Nil" } },
			]);
		});
		await t.step("Compiles number expressions", () => {
			const compiler = new Compiler();
			const instructions = compiler.compileExpression({
				type: "NumberLiteralExpression",
				value: 10,
			});
			assertEquals(instructions, [
				{ type: "Push", value: { type: "Number", value: 10 } },
			]);
		});
		await t.step("Compiles binary expressions", () => {
			const compiler = new Compiler();
			const instructions = compiler.compileExpression({
				type: "BinaryExpression",
				operator: "Add",
				left: { type: "NumberLiteralExpression", value: 10 },
				right: { type: "NumberLiteralExpression", value: 20 },
			});
			assertEquals(instructions, [
				{ type: "Push", value: { type: "Number", value: 10 } },
				{ type: "Push", value: { type: "Number", value: 20 } },
				{ type: "Add" },
			]);
		});
		await t.step("Compiles identifier expressions", () => {
			const compiler = new Compiler();
			const instructions = compiler.compileExpression({
				type: "IdentifierExpression",
				name: "x",
			});
			assertEquals(instructions, [{ type: "GetLocal", name: "x" }]);
		});
		await t.step("Call expressions", () => {
			const compiler = new Compiler();
			const instructions = compiler.compileExpression({
				type: "CallExpression",
				callee: {
					type: "IdentifierExpression",
					name: "add",
				},
				args: [
					{ type: "NumberLiteralExpression", value: 10 },
					{ type: "NumberLiteralExpression", value: 20 },
				],
			});
			assertEquals(instructions, [
				{ type: "Push", value: { type: "Number", value: 10 } },
				{ type: "Push", value: { type: "Number", value: 20 } },
				{ type: "GetLocal", name: "add" },
				{ type: "Call", arity: 2 },
			]);
		});
	});
	await t.step("Compiles statements", async (t) => {
		await t.step("Compiles while statements", () => {
			//while (x < 10) { x = x + 1; }
			const statement: Statement = {
				type: "WhileStatement",
				condition: {
					type: "BinaryExpression",
					operator: "LessThan",
					left: {
						type: "IdentifierExpression",
						name: "x",
					},
					right: {
						type: "NumberLiteralExpression",
						value: 10,
					},
				},
				body: [
					{
						type: "AssignmentStatement",
						name: "x",
						value: {
							type: "BinaryExpression",
							operator: "Add",
							left: { type: "IdentifierExpression", name: "x" },
							right: {
								type: "NumberLiteralExpression",
								value: 1,
							},
						},
					},
				],
			};
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
				{ type: "Add" },
				{ type: "SetLocal", name: "x" },
				{ type: "Jump", offset: -9 },
				{ type: "BlockEnd" },
			]);
		});
		await t.step("Compiles expression statements", () => {
			const compiler = new Compiler();
			const instructions = compiler.compile([
				{
					type: "ExpressionStatement",
					expression: { type: "NumberLiteralExpression", value: 10 },
				},
			]);
			assertEquals(instructions, [
				{ type: "Push", value: { type: "Number", value: 10 } },
				{ type: "Pop" },
			]);
		});
		await t.step("Compiles return statements", () => {
			const compiler = new Compiler();
			const instructions = compiler.compile([
				{
					type: "ReturnStatement",
					expression: { type: "NumberLiteralExpression", value: 10 },
				},
			]);
			assertEquals(instructions, [
				{ type: "Push", value: { type: "Number", value: 10 } },
				{ type: "Return" },
			]);
		});
		await t.step("Compiles function declaration statements", () => {
			const compiler = new Compiler();
			const body: Statement[] = [
				{
					type: "ReturnStatement",
					expression: {
						type: "BinaryExpression",
						operator: "Add",
						left: {
							type: "IdentifierExpression",
							name: "x",
						},
						right: {
							type: "IdentifierExpression",
							name: "y",
						},
					},
				},
			];
			const instructions = compiler.compile([
				{
					type: "FunctionDeclarationStatement",
					name: "add",
					parameters: ["x", "y"],
					body: body,
				},
			]);
			assertEquals(instructions, [
				{
					type: "Push",
					value: {
						type: "Function",
						parameters: ["x", "y"],
						body: compiler.compile(body),
					},
				},
				{ type: "DeclareLocal", name: "add" },
			]);
		});
		await t.step("Compiles spawn statements", () => {
			const compiler = new Compiler();
			const expression: Statement = {
				type: "SpawnStatement",
				args: [{ type: "NumberLiteralExpression", value: 10 }],
				spawnee: {
					type: "LambdaExpression",
					body: [
						{
							type: "PrintStatement",
							expression: {
								type: "IdentifierExpression",
								name: "x",
							},
						},
					],
					parameters: ["x"],
				},
			};
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
			const instructions = compiler.compile([{ type: "YieldStatement" }]);
			assertEquals(instructions, [{ type: "Yield" }]);
		});
		await t.step("Compiles print statements", () => {
			const compiler = new Compiler();
			const instructions = compiler.compile([
				{
					type: "PrintStatement",
					expression: { type: "NumberLiteralExpression", value: 10 },
				},
			]);
			assertEquals(instructions, [
				{ type: "Push", value: { type: "Number", value: 10 } },
				{ type: "Print" },
			]);
		});
		await t.step("Compiles variable declaration statements", () => {
			const compiler = new Compiler();
			const instructions = compiler.compile([
				{
					type: "VariableDeclarationStatement",
					name: "x",
					initializer: { type: "NumberLiteralExpression", value: 10 },
				},
			]);
			assertEquals(instructions, [
				{ type: "Push", value: { type: "Number", value: 10 } },
				{ type: "DeclareLocal", name: "x" },
			]);
		});
		await t.step("Compiles assignment statements", () => {
			const compiler = new Compiler();
			const instructions = compiler.compile([
				{
					type: "AssignmentStatement",
					name: "x",
					value: { type: "NumberLiteralExpression", value: 10 },
				},
			]);
			assertEquals(instructions, [
				{ type: "Push", value: { type: "Number", value: 10 } },
				{ type: "SetLocal", name: "x" },
			]);
		});
	});
});
