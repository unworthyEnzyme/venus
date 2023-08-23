export type Expression =
  | { type: "StringLiteralExpression"; value: string }
  | { type: "PropertyAccessExpression"; object: Expression; name: string }
  | {
    type: "ObjectExpression";
    properties: { name: string; value: Expression }[];
  }
  | { type: "ChannelReceiveExpression"; channel: Expression }
  | { type: "LambdaExpression"; body: Statement[]; parameters: string[] }
  | { type: "NilLiteralExpression" }
  | { type: "CallExpression"; callee: Expression; args: Expression[] }
  | {
    type: "BinaryExpression";
    operator: "LessThan" | "GreaterThan" | "Plus";
    left: Expression;
    right: Expression;
  }
  | { type: "IdentifierExpression"; name: string }
  | {
    type: "NumberLiteralExpression";
    value: number;
  };

export type Statement =
  | { type: "ChannelSendStatement"; channel: Expression; value: Expression }
  | { type: "ReturnStatement"; expression: Expression }
  | {
    type: "SpawnStatement";
    spawnee: Extract<Expression, { type: "CallExpression" }>;
  }
  | { type: "YieldStatement" }
  | { type: "PrintStatement"; expression: Expression }
  | { type: "WhileStatement"; condition: Expression; body: Statement[] }
  | { type: "ExpressionStatement"; expression: Expression }
  | {
    type: "VariableDeclarationStatement";
    name: string;
    initializer: Expression;
  }
  | { type: "AssignmentStatement"; name: string; value: Expression };

export type Token = { type: TokenType; lexeme: string };
export type TokenType =
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
