import { Statement } from "./ast.ts";
import { Compiler } from "./compiler.ts";
import { Channel, Fiber } from "./concurrency.ts";
import { to_string, Value } from "./value.ts";

export class VM {
  private fiber_queue: Fiber[] = [];
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
      fn: (capacity: Value) => {
        if (capacity.type !== "Number") {
          throw new Error("Expected number");
        }
        return {
          type: "Channel",
          channel: new Channel(capacity.value),
        };
      },
    });
  }
  run(program: Statement[]) {
    const instructions = new Compiler().compile(program);
    const main_fiber = new Fiber([...instructions, { type: "Exit" }]);
    this.fiber_queue.push(main_fiber);
    while (this.fiber_queue.length > 0) {
      const fiber = this.fiber_queue.shift()!;
      execution_loop:
      while (true) {
        const frame = fiber.stack.at(-1);
        if (!frame) {
          //the fiber is returning from the first frame, so it's done
          break;
        }
        const instruction = frame.instructions[frame.ip++];
        switch (instruction.type) {
          case "ChannelSend": {
            const channel = fiber.value_stack.pop();
            const value = fiber.value_stack.pop();
            if (channel?.type !== "Channel") {
              throw new Error("Expected channel");
            }
            if (value === undefined) {
              throw new Error("Expected value");
            }
            const blocked = channel.channel.send(this, value);
            if (blocked) {
              break execution_loop;
            }
            break;
          }
          case "ChannelReceive": {
            const channel = fiber.value_stack.pop();
            if (channel?.type !== "Channel") {
              throw new Error("Expected channel");
            }
            const value = channel.channel.receive(fiber);
            if (value === null) {
              break execution_loop;
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
            fiber.value_stack.push(instruction.value);
            break;
          }
          case "Pop": {
            fiber.value_stack.pop();
            break;
          }
          case "Print": {
            const value = fiber.value_stack.pop();
            if (!value) {
              throw new Error("Must have a value to print");
            }
            console.log(to_string(value));
            break;
          }
          case "JumpIfFalse": {
            const value = fiber.value_stack.pop();
            if (value?.type !== "Boolean") {
              throw new Error("Expected boolean");
            }
            if (!value.value) {
              frame.ip += instruction.offset;
            }
            break;
          }
          case "Add": {
            const a = fiber.value_stack.pop();
            const b = fiber.value_stack.pop();
            if (a?.type !== "Number" || b?.type !== "Number") {
              throw new Error("Expected number");
            }
            fiber.value_stack.push({
              type: "Number",
              value: a.value + b.value,
            });
            break;
          }
          case "LessThan": {
            const b = fiber.value_stack.pop();
            const a = fiber.value_stack.pop();
            if (a?.type !== "Number" || b?.type !== "Number") {
              throw new Error("Expected number");
            }
            fiber.value_stack.push({
              type: "Boolean",
              value: a.value < b.value,
            });
            break;
          }
          case "GreaterThan": {
            const b = fiber.value_stack.pop();
            const a = fiber.value_stack.pop();
            if (a?.type !== "Number" || b?.type !== "Number") {
              throw new Error("Expected number");
            }
            fiber.value_stack.push({
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
                fiber.value_stack.push(this.gloabals.get(instruction.name)!);
                break;
              }
              throw new Error(
                `Undefined variable ${instruction.name}`,
              );
            }
            const value = locals.get(instruction.name)!;
            fiber.value_stack.push(value);
            break;
          }
          case "SetLocal": {
            const value = fiber.value_stack.pop();
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
            const initializer = fiber.value_stack.pop();
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
            const callee = fiber.value_stack.pop();
            if (callee?.type === "Function") {
              const locals = new Map<string, Value>();
              const parameters = callee.parameters.toReversed();
              for (const name of parameters) {
                const arg = fiber.value_stack.pop();
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
                const arg = fiber.value_stack.pop();
                if (arg === undefined) {
                  throw new Error("Expected argument");
                }
                args.push(arg);
              }
              const result = callee.fn(...args.toReversed());
              fiber.value_stack.push(result);
              break;
            } else {
              throw new Error("Expected function");
            }
            break;
          }
          case "Yield": {
            this.fiber_queue.push(fiber);
            break execution_loop;
          }
          case "Spawn": {
            const callee = fiber.value_stack.pop();
            if (callee?.type !== "Function") {
              throw new Error("Expected function");
            }
            const locals = new Map<string, Value>();
            const parameters = callee.parameters.toReversed();
            for (const name of parameters) {
              const arg = fiber.value_stack.pop();
              if (arg === undefined) {
                throw new Error("Expected argument");
              }
              locals.set(name, arg);
            }
            const spawned = new Fiber(callee.body);
            spawned.stack.at(-1)!.locals = [locals];
            this.fiber_queue.push(spawned);
            break;
          }
        }
      }
    }
  }

  enqueue_fiber(fiber: Fiber) {
    this.fiber_queue.push(fiber);
  }
  enqueue_fiber_to_front(fiber: Fiber) {
    this.fiber_queue.unshift(fiber);
  }
}
