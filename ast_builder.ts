import { Expression, Statement } from "./ast.ts";

export function string(value: string): Expression {
  return { type: "StringLiteralExpression", value };
}

export function property_access(object: Expression, name: string): Expression {
  return { type: "PropertyAccessExpression", object, name };
}

export function object(
  properties: { name: string; value: Expression }[],
): Expression {
  return { type: "ObjectExpression", properties };
}

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
    : "Plus";
  return { type: "BinaryExpression", operator: mapped_operator, left, right };
}

export function call(
  callee: Expression,
  args: Expression[],
): Extract<Expression, { type: "CallExpression" }> {
  return { type: "CallExpression", callee, args };
}

export function nil(): Expression {
  return { type: "NilLiteralExpression" };
}

export function lambda(parameters: string[], body: Statement[]): Expression {
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

export function spawn(
  spawnee: Extract<Expression, { type: "CallExpression" }>,
): Statement {
  return { type: "SpawnStatement", spawnee };
}

export function yield_(): Statement {
  return { type: "YieldStatement" };
}

export function print(expression: Expression): Statement {
  return { type: "PrintStatement", expression };
}

export function while_(condition: Expression, body: Statement[]): Statement {
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

export function assignment(name: string, value: Expression): Statement {
  return { type: "AssignmentStatement", name, value };
}

export function return_(expression: Expression): Statement {
  return { type: "ReturnStatement", expression };
}

export function if_(
  condition: Expression,
  then_branch: Statement[],
  else_branch: Statement[] | null,
): Statement {
  return { type: "IfStatement", condition, then_branch, else_branch };
}
