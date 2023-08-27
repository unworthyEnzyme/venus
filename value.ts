import type { Instruction } from "./instruction.ts";

export abstract class Value {
  abstract toString(): string;
}

export class StringValue extends Value {
  constructor(public value: string) {
    super();
  }

  toString() {
    return this.value;
  }
}

export class ObjectValue extends Value {
  constructor(public properties: Record<string, Value>) {
    super();
  }

  toString() {
    return `{${
      Object.entries(this.properties).map(([name, value]) =>
        `${name}: ${value}`
      ).join(", ")
    }}`;
  }
}

export class NativeFunction extends Value {
  constructor(
    public name: string,
    public arity: number,
    public fn: (...args: Value[]) => Value,
  ) {
    super();
  }

  toString() {
    return `<native function ${this.name}>`;
  }
}

export class Nil extends Value {
  constructor() {
    super();
  }
  toString() {
    return "nil";
  }
}

export class NumberValue extends Value {
  constructor(public value: number) {
    super();
  }

  toString() {
    return this.value.toString();
  }
}

export class BooleanValue extends Value {
  constructor(public value: boolean) {
    super();
  }

  toString() {
    return this.value.toString();
  }
}

export class FunctionValue extends Value {
  constructor(
    public parameters: string[],
    public body: Instruction[],
  ) {
    super();
  }

  toString() {
    return `<function ${this.parameters.join(", ")}>`;
  }
}
