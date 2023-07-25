import type { Channel } from "./concurrency.ts";
import type { Instruction } from "./instruction.ts";

export type Value =
  | { type: "String"; value: string }
  | { type: "Object"; properties: Record<string, Value> }
  | { type: "Channel"; channel: Channel }
  | { type: "NativeFunction"; fn: (...args: Value[]) => Value; arity: number }
  | { type: "Nil" }
  | { type: "Number"; value: number }
  | { type: "Boolean"; value: boolean }
  | {
    type: "Function";
    body: Instruction[];
    parameters: string[];
  };

export function to_string(value: Value) {
  switch (value.type) {
    case "String":
      return value.value;
    case "Nil":
      return "nil";
    case "Number":
      return value.value.toString();
    case "Boolean":
      return value.value.toString();
    case "Function":
      return `<function ${value.parameters.join(", ")}>`;
    case "Channel":
      return `<channel>`;
  }
}
