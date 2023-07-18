import { Statement } from "./ast.ts";
import { Compiler } from "./compiler.ts";
import { Channel, Fiber } from "./concurrency.ts";
import { toString, Value } from "./value.ts";

export class VM {
  private fiberQueue: Fiber[] = [];
  private gloabals = new Map<string, Value>();
  constructor() {
    this.gloabals.set("meaning_of_life", {
      type: "NativeFunction",
      arity: 0,
      fn: () => {
        return { type: "Number", value: 42 };
      },
    });
    this.gloabals.set("new_channel", {
      type: "NativeFunction",
      arity: 0,
      fn: () => {
        return {
          type: "Channel",
          channel: new Channel(),
        };
      },
    });
  }
  run(program: Statement[]) {
    const instructions = new Compiler().compile(program);
    const mainFiber = new Fiber([...instructions, { type: "Exit" }]);
    this.fiberQueue.push(mainFiber);
    while (this.fiberQueue.length > 0) {
      const fiber = this.fiberQueue.shift()!;
      executionLoop:
      while (true) {
        const frame = fiber.stack.at(-1);
        if (!frame) {
          //the fiber is returning from the first frame, so it's done
          break;
        }
        const instruction = frame.instructions[frame.ip++];
        switch (instruction.type) {
          case "ChannelSend": {
            const channel = fiber.valueStack.pop();
            const value = fiber.valueStack.pop();
            if (channel?.type !== "Channel") {
              throw new Error("Expected channel");
            }
            if (value === undefined) {
              throw new Error("Expected value");
            }
            const blocked = channel.channel.send(this, value);
            if (blocked) {
              break executionLoop;
            }
            break;
          }
          case "ChannelReceive": {
            const channel = fiber.valueStack.pop();
            if (channel?.type !== "Channel") {
              throw new Error("Expected channel");
            }
            const value = channel.channel.receive(fiber);
            if (value === null) {
              break executionLoop;
            }
            break;
          }
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
            const locals = frame.locals.find((locals) =>
              locals.has(instruction.name)
            );
            if (locals === undefined) {
              if (this.gloabals.has(instruction.name)) {
                fiber.valueStack.push(this.gloabals.get(instruction.name)!);
                break;
              }
              throw new Error(
                `Undefined variable ${instruction.name}`,
              );
            }
            const value = locals.get(instruction.name)!;
            fiber.valueStack.push(value);
            break;
          }
          case "SetLocal": {
            const value = fiber.valueStack.pop();
            if (value === undefined) {
              throw new Error(
                `You need set a value ${instruction.name}`,
              );
            }
            const locals = frame.locals.find((locals) =>
              locals.has(instruction.name)
            );
            if (locals === undefined) {
              if (this.gloabals.has(instruction.name)) {
                this.gloabals.set(instruction.name, value);
                break;
              }
              throw new Error(
                `Undefined variable ${instruction.name}`,
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
                `You need to initialize ${instruction.name}`,
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
            if (callee?.type === "Function") {
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
            } else if (callee?.type === "NativeFunction") {
              const args: Value[] = [];
              for (let i = 0; i < instruction.arity; i++) {
                const arg = fiber.valueStack.pop();
                if (arg === undefined) {
                  throw new Error("Expected argument");
                }
                args.push(arg);
              }
              const result = callee.fn(...args.toReversed());
              fiber.valueStack.push(result);
              break;
            } else {
              throw new Error("Expected function");
            }
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

  pushFiberToEnd(fiber: Fiber) {
    this.fiberQueue.push(fiber);
  }
  pushFiberToFront(fiber: Fiber) {
    this.fiberQueue.unshift(fiber);
  }
}
