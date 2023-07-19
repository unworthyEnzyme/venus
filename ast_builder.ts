import { Expression, Statement } from "./ast.ts";

export function number(value: number): Expression {
  return { type: "NumberLiteralExpression", value };
}

export function identifier(name: string): Expression {
  return { type: "IdentifierExpression", name };
}

export function binary(
  operator: "<" | ">" | "+",
  left: Expression,
  right: Expression,
): Expression {
  const mapped_operator = operator === "<"
    ? "LessThan"
    : operator === ">"
    ? "GreaterThan"
    : "Add";
  return { type: "BinaryExpression", operator: mapped_operator, left, right };
}

export function call(
  callee: Expression,
  args: Expression[],
): Expression {
  return { type: "CallExpression", callee, args };
}

export function nil(): Expression {
  return { type: "NilLiteralExpression" };
}

export function lambda(
  parameters: string[],
  body: Statement[],
): Expression {
  return { type: "LambdaExpression", parameters, body };
}

export function channel_receive(channel: Expression): Expression {
  return { type: "ChannelReceiveExpression", channel };
}

export function channel_send(
  channel: Expression,
  value: Expression,
): Statement {
  return { type: "ChannelSendStatement", channel, value };
}

export function function_(
  name: string,
  parameters: string[],
  body: Statement[],
): Statement {
  return { type: "FunctionDeclarationStatement", name, parameters, body };
}

export function spawn(spawnee: Expression, args: Expression[]): Statement {
  return { type: "SpawnStatement", spawnee, args };
}

export function yield_(): Statement {
  return { type: "YieldStatement" };
}

export function print(expression: Expression): Statement {
  return { type: "PrintStatement", expression };
}

export function while_(
  condition: Expression,
  body: Statement[],
): Statement {
  return { type: "WhileStatement", condition, body };
}

export function expression_statement(expression: Expression): Statement {
  return { type: "ExpressionStatement", expression };
}

export function variable_declaration(
  name: string,
  initializer: Expression,
): Statement {
  return { type: "VariableDeclarationStatement", name, initializer };
}

export function assignment(
  name: string,
  value: Expression,
): Statement {
  return { type: "AssignmentStatement", name, value };
}

export function return_(expression: Expression): Statement {
  return { type: "ReturnStatement", expression };
}
