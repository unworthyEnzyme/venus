import { Compiler } from "./compiler.ts";
import { Channel, Fiber } from "./concurrency.ts";
import { Parser } from "./parser.ts";
import { to_string, Value } from "./value.ts";

export class VM {
  private fiber_queue: Fiber[] = [];
  public current_fiber: Fiber | null = null;
  private globals = new Map<string, Value>();
  constructor() {
    this.globals.set("meaning_of_life", {
      type: "NativeFunction",
      arity: 0,
      fn: () => {
        return { type: "Number", value: 42 };
      },
    });
    this.globals.set("new_channel", {
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
  run(source: string) {
    const program = new Parser().parse(source);
    const instructions = new Compiler().compile(program);
    const main_fiber = new Fiber([...instructions, { type: "Exit" }]);
    this.current_fiber = main_fiber;
    this.fiber_queue.push(this.current_fiber);
    while (this.fiber_queue.length > 0) {
      this.current_fiber = this.fiber_queue.shift()!;
      while (true) {
        if (!this.current_fiber) {
          break;
        }
        const frame = this.current_fiber.stack.at(-1);
        if (!frame) {
          //the fiber is returning from the first frame, so it's done
          break;
        }
        const instruction = frame.instructions[frame.ip++];
        switch (instruction.type) {
          case "AccessProperty": {
            const object = this.current_fiber.value_stack.pop();
            if (object?.type !== "Object") {
              throw new Error("Expected object");
            }
            const value = object.properties[instruction.name];
            if (value === undefined) {
              throw new Error(
                `Undefined property ${instruction.name}`,
              );
            }
            this.current_fiber.value_stack.push(value);
            break;
          }
          case "DefineProperty": {
            const value = this.current_fiber.value_stack.pop();
            if (value === undefined) {
              throw new Error("Expected value");
            }
            const object = this.current_fiber.value_stack.pop();
            if (object?.type !== "Object") {
              throw new Error("Expected object");
            }
            object.properties[instruction.name] = value;
            this.current_fiber.value_stack.push(object);
            break;
          }
          case "ChannelSend": {
            const channel = this.current_fiber.value_stack.pop();
            const value = this.current_fiber.value_stack.pop();
            if (channel?.type !== "Channel") {
              throw new Error("Expected channel");
            }
            if (value === undefined) {
              throw new Error("Expected value");
            }
            channel.channel.send(this, value);
            break;
          }
          case "ChannelReceive": {
            const channel = this.current_fiber.value_stack.pop();
            if (channel?.type !== "Channel") {
              throw new Error("Expected channel");
            }
            channel.channel.receive(this);
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
            this.current_fiber.value_stack.push(instruction.value);
            break;
          }
          case "Pop": {
            this.current_fiber.value_stack.pop();
            break;
          }
          case "Print": {
            const value = this.current_fiber.value_stack.pop();
            if (!value) {
              throw new Error("Must have a value to print");
            }
            console.log(to_string(value));
            break;
          }
          case "JumpIfFalse": {
            const value = this.current_fiber.value_stack.pop();
            if (value?.type !== "Boolean") {
              throw new Error("Expected boolean");
            }
            if (!value.value) {
              frame.ip += instruction.offset;
            }
            break;
          }
          case "Plus": {
            const a = this.current_fiber.value_stack.pop();
            const b = this.current_fiber.value_stack.pop();
            if (a?.type !== "Number" || b?.type !== "Number") {
              throw new Error("Expected number");
            }
            this.current_fiber.value_stack.push({
              type: "Number",
              value: a.value + b.value,
            });
            break;
          }
          case "LessThan": {
            const b = this.current_fiber.value_stack.pop();
            const a = this.current_fiber.value_stack.pop();
            if (a?.type !== "Number" || b?.type !== "Number") {
              throw new Error("Expected number");
            }
            this.current_fiber.value_stack.push({
              type: "Boolean",
              value: a.value < b.value,
            });
            break;
          }
          case "GreaterThan": {
            const b = this.current_fiber.value_stack.pop();
            const a = this.current_fiber.value_stack.pop();
            if (a?.type !== "Number" || b?.type !== "Number") {
              throw new Error("Expected number");
            }
            this.current_fiber.value_stack.push({
              type: "Boolean",
              value: a.value > b.value,
            });
            break;
          }
          case "Return": {
            this.current_fiber.stack.pop();
            break;
          }
          case "GetLocal": {
            const locals = frame.locals.find((locals) =>
              locals.has(instruction.name)
            );
            if (locals === undefined) {
              if (this.globals.has(instruction.name)) {
                this.current_fiber.value_stack.push(
                  this.globals.get(instruction.name)!,
                );
                break;
              }
              throw new Error(
                `Undefined variable ${instruction.name}`,
              );
            }
            const value = locals.get(instruction.name)!;
            this.current_fiber.value_stack.push(value);
            break;
          }
          case "SetLocal": {
            const value = this.current_fiber.value_stack.pop();
            if (value === undefined) {
              throw new Error(
                `You need set a value ${instruction.name}`,
              );
            }
            const locals = frame.locals.find((locals) =>
              locals.has(instruction.name)
            );
            if (locals === undefined) {
              if (this.globals.has(instruction.name)) {
                this.globals.set(instruction.name, value);
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
            const initializer = this.current_fiber.value_stack.pop();
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
            const callee = this.current_fiber.value_stack.pop();
            if (callee?.type === "Function") {
              const locals = new Map<string, Value>();
              const parameters = callee.parameters.toReversed();
              for (const name of parameters) {
                const arg = this.current_fiber.value_stack.pop();
                if (arg === undefined) {
                  throw new Error("Expected argument");
                }
                locals.set(name, arg);
              }
              this.current_fiber.stack.push({
                ip: 0,
                instructions: callee.body,
                locals: [locals],
              });
            } else if (callee?.type === "NativeFunction") {
              const args: Value[] = [];
              for (let i = 0; i < instruction.arity; i++) {
                const arg = this.current_fiber.value_stack.pop();
                if (arg === undefined) {
                  throw new Error("Expected argument");
                }
                args.push(arg);
              }
              const result = callee.fn(...args.toReversed());
              this.current_fiber.value_stack.push(result);
              break;
            } else {
              throw new Error("Expected function");
            }
            break;
          }
          case "Yield": {
            this.yield_current_fiber();
            break;
          }
          case "Spawn": {
            const callee = this.current_fiber.value_stack.pop();
            if (callee?.type !== "Function") {
              throw new Error("Expected function");
            }
            const locals = new Map<string, Value>();
            const parameters = callee.parameters.toReversed();
            for (const name of parameters) {
              const arg = this.current_fiber.value_stack.pop();
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

  yield_current_fiber() {
    this.enqueue_fiber(this.current_fiber!);
    this.current_fiber = null;
  }
}
