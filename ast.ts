export abstract class Expression {
  abstract toString(): string;
}

export class NumberLiteral extends Expression {
  constructor(public value: number) {
    super();
  }

  toString() {
    return this.value.toString();
  }
}

export class StringLiteral extends Expression {
  constructor(public value: string) {
    super();
  }

  toString() {
    return this.value;
  }
}

const binary_operators = [
  "Plus",
  "GreaterThan",
  "LessThan",
  "GreaterThanEqual",
  "LessThanEqual",
] as const;
export type BinaryOperator = typeof binary_operators[number];

export class Binary extends Expression {
  constructor(
    public operator: BinaryOperator,
    public left: Expression,
    public right: Expression,
  ) {
    super();
  }

  toString() {
    return `(${this.left} ${this.operator} ${this.right})`;
  }
}

export class Identifier extends Expression {
  constructor(public name: string) {
    super();
  }

  toString() {
    return this.name;
  }
}

export class Call extends Expression {
  constructor(public callee: Expression, public args: Expression[]) {
    super();
  }

  toString() {
    return `${this.callee}(${this.args.join(", ")})`;
  }
}

export class PropertyAccess extends Expression {
  constructor(public object: Expression, public name: string) {
    super();
  }

  toString() {
    return `${this.object}.${this.name}`;
  }
}

export class ObjectLiteral extends Expression {
  constructor(public properties: { name: string; value: Expression }[]) {
    super();
  }

  toString() {
    return `{${
      this.properties.map((p) => `${p.name}: ${p.value}`).join(", ")
    }}`;
  }
}

export class Lambda extends Expression {
  constructor(public body: Statement[], public parameters: string[]) {
    super();
  }

  toString() {
    return `(${this.parameters.join(", ")}) => {${this.body.join("; ")}}`;
  }
}

export class NilLiteral extends Expression {
  toString() {
    return "nil";
  }
}

export class BooleanLiteral extends Expression {
  constructor(public value: boolean) {
    super();
  }

  toString() {
    return this.value.toString();
  }

  static readonly TRUE = new BooleanLiteral(true);
  static readonly FALSE = new BooleanLiteral(false);
}

export class ChannelReceive extends Expression {
  constructor(public channel: Expression) {
    super();
  }

  toString() {
    return `receive ${this.channel}`;
  }
}

export abstract class Statement {
  abstract toString(): string;
}

export class Block extends Statement {
  constructor(public statements: Statement[]) {
    super();
  }

  toString() {
    return `{${this.statements.join("; ")}}`;
  }
}

export class If extends Statement {
  constructor(
    public condition: Expression,
    public then_branch: Statement[],
    public else_branch: Statement[],
  ) {
    super();
  }

  toString() {
    return `if (${this.condition}) ${this.then_branch.join("; ")} else ${
      this.else_branch.join("; ")
    }`;
  }
}

export class ChannelSend extends Statement {
  constructor(public channel: Expression, public value: Expression) {
    super();
  }

  toString() {
    return `send ${this.channel} ${this.value}`;
  }
}

export class Return extends Statement {
  constructor(public expression: Expression) {
    super();
  }

  toString() {
    return `return ${this.expression}`;
  }
}

export class Spawn extends Statement {
  constructor(public spawnee: Call) {
    super();
  }

  toString() {
    return `spawn ${this.spawnee}`;
  }
}

export class Yield extends Statement {
  toString() {
    return "yield";
  }
}

export class Print extends Statement {
  constructor(public expression: Expression) {
    super();
  }

  toString() {
    return `print ${this.expression}`;
  }
}

export class While extends Statement {
  constructor(public condition: Expression, public body: Statement[]) {
    super();
  }

  toString() {
    return `while (${this.condition}) ${this.body.join("; ")}`;
  }
}

export class ExpressionStatement extends Statement {
  constructor(public expression: Expression) {
    super();
  }

  toString() {
    return this.expression.toString();
  }
}

export class VariableDeclaration extends Statement {
  constructor(public name: string, public initializer: Expression) {
    super();
  }

  toString() {
    return `let ${this.name} = ${this.initializer}`;
  }
}

export class Assignment extends Statement {
  constructor(public name: string, public value: Expression) {
    super();
  }

  toString() {
    return `${this.name} = ${this.value}`;
  }
}

export type Token = { type: TokenType; lexeme: string };
export type TokenType =
  | "If"
  | "Else"
  | "Colon"
  | "LeftParen"
  | "RightParen"
  | "LeftBrace"
  | "RightBrace"
  | "Comma"
  | "Dot"
  | "Minus"
  | "Plus"
  | "Semicolon"
  | "Slash"
  | "Star"
  | "Bang"
  | "BangEqual"
  | "Equal"
  | "EqualEqual"
  | "GreaterThan"
  | "GreaterThanEqual"
  | "LessThan"
  | "LessThanEqual"
  | "Identifier"
  | "String"
  | "Number"
  | "And"
  | "True"
  | "False"
  | "Fun"
  | "Nil"
  | "Or"
  | "Print"
  | "Return"
  | "Let"
  | "While"
  | "Yield"
  | "Spawn"
  | "LeftArrow"
  | "RightArrow"
  | "EOF";
