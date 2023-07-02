import { Statement } from "./ast.ts";
import { Compiler } from "./compiler.ts";
import { Instruction } from "./instruction.ts";
import { Value, toString } from "./value.ts";

export class VM {
	private fiberQueue: Fiber[] = [];
	run(program: Statement[]) {
		const instructions = new Compiler().compile(program);
		const mainFiber = new Fiber([...instructions, { type: "Exit" }]);
		this.fiberQueue.push(mainFiber);
		while (this.fiberQueue.length > 0) {
			const fiber = this.fiberQueue.shift()!;
			executionLoop: while (true) {
				const frame = fiber.stack.at(-1);
				if (!frame) {
					//the fiber is returning from the first frame, so it's done
					break;
				}
				const instruction = frame.instructions[frame.ip++];
				switch (instruction.type) {
					case "Exit": {
						return;
					}
					case "Jump": {
						frame.ip += instruction.offset;
						break;
					}
					case "Push": {
						fiber.valueStack.push(instruction.value);
						break;
					}
					case "Pop": {
						fiber.valueStack.pop();
						break;
					}
					case "Print": {
						const value = fiber.valueStack.pop();
						if (!value) {
							throw new Error("Must have a value to print");
						}
						console.log(toString(value));
						break;
					}
					case "JumpIfFalse": {
						const value = fiber.valueStack.pop();
						if (value?.type !== "Boolean") {
							throw new Error("Expected boolean");
						}
						if (!value.value) {
							frame.ip += instruction.offset;
						}
						break;
					}
					case "Add": {
						const a = fiber.valueStack.pop();
						const b = fiber.valueStack.pop();
						if (a?.type !== "Number" || b?.type !== "Number") {
							throw new Error("Expected number");
						}
						fiber.valueStack.push({
							type: "Number",
							value: a.value + b.value,
						});
						break;
					}
					case "LessThan": {
						const b = fiber.valueStack.pop();
						const a = fiber.valueStack.pop();
						if (a?.type !== "Number" || b?.type !== "Number") {
							throw new Error("Expected number");
						}
						fiber.valueStack.push({
							type: "Boolean",
							value: a.value < b.value,
						});
						break;
					}
					case "GreaterThan": {
						const b = fiber.valueStack.pop();
						const a = fiber.valueStack.pop();
						if (a?.type !== "Number" || b?.type !== "Number") {
							throw new Error("Expected number");
						}
						fiber.valueStack.push({
							type: "Boolean",
							value: a.value > b.value,
						});
						break;
					}
					case "Return": {
						fiber.stack.pop();
						break;
					}
					case "GetLocal": {
						let value: Value | undefined;
						for (let i = frame.locals.length - 1; i >= 0; i--) {
							const locals = frame.locals.at(i)!;
							value = locals.get(instruction.name);
							if (value) {
								break;
							}
						}
						if (value) {
							fiber.valueStack.push(value);
							break;
						}
						throw new Error(
							`Undefined variable ${instruction.name}`
						);
					}
					case "SetLocal": {
						const value = fiber.valueStack.pop();
						if (value === undefined) {
							throw new Error(
								`You need set a value ${instruction.name}`
							);
						}
						const locals = frame.locals.find((locals) =>
							locals.has(instruction.name)
						);
						if (locals === undefined) {
							throw new Error(
								`Undefined variable ${instruction.name}`
							);
						}
						locals.set(instruction.name, value);
						break;
					}
					case "DeclareLocal": {
						const locals = frame.locals.at(-1)!;
						const initializer = fiber.valueStack.pop();
						if (initializer === undefined) {
							throw new Error(
								`You need to initialize ${instruction.name}`
							);
						}
						locals.set(instruction.name, initializer);
						break;
					}
					case "BlockStart": {
						frame.locals.push(new Map());
						break;
					}
					case "BlockEnd": {
						frame.locals.pop();
						break;
					}
					case "Call": {
						const callee = fiber.valueStack.pop();
						if (callee?.type !== "Function") {
							throw new Error("Expected function");
						}
						const locals = new Map<string, Value>();
						const parameters = callee.parameters.toReversed();
						for (const name of parameters) {
							const arg = fiber.valueStack.pop();
							if (arg === undefined) {
								throw new Error("Expected argument");
							}
							locals.set(name, arg);
						}
						fiber.stack.push({
							ip: 0,
							instructions: callee.body,
							locals: [locals],
						});
						break;
					}
					case "Yield": {
						this.fiberQueue.push(fiber);
						break executionLoop;
					}
					case "Spawn": {
						const callee = fiber.valueStack.pop();
						if (callee?.type !== "Function") {
							throw new Error("Expected function");
						}
						const locals = new Map<string, Value>();
						const parameters = callee.parameters.toReversed();
						for (const name of parameters) {
							const arg = fiber.valueStack.pop();
							if (arg === undefined) {
								throw new Error("Expected argument");
							}
							locals.set(name, arg);
						}
						const spawned = new Fiber(callee.body);
						spawned.stack.at(-1)!.locals = [locals];
						this.fiberQueue.push(spawned);
						break;
					}
				}
			}
		}
	}
}

class Fiber {
	stack: StackFrame[] = [];
	valueStack: Value[] = [];
	constructor(instructions: Instruction[]) {
		this.stack.push({ ip: 0, instructions, locals: [new Map()] });
	}
}

type StackFrame = {
	ip: number;
	instructions: Instruction[];
	locals: Map<string, Value>[];
};

// fun print_numbers(start, end) {
//     let i = start
//     while (i < end + 1) {
//         println i
//         yield
//         i = i + 1
//     }
// }

// spawn print_numbers(1, 4)
// print_numbers(11, 16)

const program: Statement[] = [
	{
		type: "FunctionDeclarationStatement",
		name: "print_numbers",
		parameters: ["start", "end"],
		body: [
			{
				type: "VariableDeclarationStatement",
				name: "i",
				initializer: {
					type: "IdentifierExpression",
					name: "start",
				},
			},
			{
				type: "WhileStatement",
				condition: {
					type: "BinaryExpression",
					operator: "LessThan",
					left: {
						type: "IdentifierExpression",
						name: "i",
					},
					right: {
						type: "BinaryExpression",
						operator: "Add",
						left: {
							type: "IdentifierExpression",
							name: "end",
						},
						right: {
							type: "NumberLiteralExpression",
							value: 1,
						},
					},
				},
				body: [
					{
						type: "PrintStatement",
						expression: {
							type: "IdentifierExpression",
							name: "i",
						},
					},
					{ type: "YieldStatement" },
					{
						type: "AssignmentStatement",
						name: "i",
						value: {
							type: "BinaryExpression",
							operator: "Add",
							left: {
								type: "IdentifierExpression",
								name: "i",
							},
							right: {
								type: "NumberLiteralExpression",
								value: 1,
							},
						},
					},
				],
			},
		],
	},
	{
		type: "SpawnStatement",
		spawnee: {
			type: "IdentifierExpression",
			name: "print_numbers",
		},
		args: [
			{ type: "NumberLiteralExpression", value: 1 },
			{ type: "NumberLiteralExpression", value: 4 },
		],
	},
	{
		type: "ExpressionStatement",
		expression: {
			type: "CallExpression",
			callee: {
				type: "IdentifierExpression",
				name: "print_numbers",
			},
			args: [
				{
					type: "NumberLiteralExpression",
					value: 11,
				},
				{
					type: "NumberLiteralExpression",
					value: 16,
				},
			],
		},
	},
];

const vm = new VM();
vm.run(program);
