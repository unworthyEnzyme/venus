import {
  Assignment,
  Binary,
  Block,
  BooleanLiteral,
  Call,
  ChannelReceive,
  ChannelSend,
  Expression,
  ExpressionStatement,
  FunctionDeclaration,
  Identifier,
  If,
  Lambda,
  NilLiteral,
  NumberLiteral,
  ObjectLiteral,
  Print,
  PropertyAccess,
  Return,
  Spawn,
  Statement,
  StringLiteral,
  VariableDeclaration,
  While,
  Yield,
} from "./ast.ts";

export function string(value: string): StringLiteral {
  return new StringLiteral(value);
}

export function property_access(
  object: Expression,
  name: string,
): PropertyAccess {
  return new PropertyAccess(object, name);
}

export function object(
  properties: { name: string; value: Expression }[],
): ObjectLiteral {
  return new ObjectLiteral(properties);
}

export function number(value: number): NumberLiteral {
  return new NumberLiteral(value);
}

export function identifier(name: string): Identifier {
  return new Identifier(name);
}

export function binary(
  operator: "<" | ">" | "+",
  left: Expression,
  right: Expression,
): Binary {
  const mapped_operator = operator === "<"
    ? "LessThan"
    : operator === ">"
    ? "GreaterThan"
    : "Plus";
  return new Binary(mapped_operator, left, right);
}

export function call(
  callee: Expression,
  args: Expression[],
): Call {
  return new Call(callee, args);
}

export function nil(): NilLiteral {
  return new NilLiteral();
}

export function lambda(parameters: string[], body: Statement[]): Lambda {
  return new Lambda(body, parameters);
}

export function channel_receive(channel: Expression): ChannelReceive {
  return new ChannelReceive(channel);
}

export function channel_send(
  channel: Expression,
  value: Expression,
): ChannelSend {
  return new ChannelSend(channel, value);
}

export function spawn(
  spawnee: Call,
): Spawn {
  return new Spawn(spawnee);
}

export function yield_(): Yield {
  return new Yield();
}

export function print(expression: Expression): Print {
  return new Print(expression);
}

export function while_(condition: Expression, body: Statement[]): While {
  return new While(condition, body);
}

export function expression_statement(
  expression: Expression,
): ExpressionStatement {
  return new ExpressionStatement(expression);
}

export function variable_declaration(
  name: string,
  initializer: Expression,
): VariableDeclaration {
  return new VariableDeclaration(name, initializer);
}

export function assignment(name: string, value: Expression): Assignment {
  return new Assignment(name, value);
}

export function return_(expression: Expression): Return {
  return new Return(expression);
}

export function if_(
  condition: Expression,
  then_branch: Statement[],
  else_branch: Statement[],
): If {
  return new If(condition, then_branch, else_branch);
}

export function boolean(value: boolean): BooleanLiteral {
  return new BooleanLiteral(value);
}

export function block(statements: Statement[]): Block {
  return new Block(statements);
}

export function function_declaration(
  name: string,
  parameters: string[],
  body: Statement[],
): FunctionDeclaration {
  return new FunctionDeclaration(name, parameters, body);
}
