import type { Instruction } from "./instruction.ts";

export type Value =
  | { type: "NativeFunction"; fn: (...args: Value[]) => Value; arity: number }
  | { type: "Nil" }
  | { type: "Number"; value: number }
  | { type: "Boolean"; value: boolean }
  | {
    type: "Function";
    body: Instruction[];
    parameters: string[];
  };

export function toString(value: Value) {
  switch (value.type) {
    case "Nil":
      return "nil";
    case "Number":
      return value.value.toString();
    case "Boolean":
      return value.value.toString();
    case "Function":
      return `<function ${value.parameters.join(", ")}>`;
  }
}
