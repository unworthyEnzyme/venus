import { Expression, Statement, Token } from "./ast.ts";
import { lambda } from "./ast_builder.ts";
import { Parser, Precedence } from "./parser.ts";

export interface PrefixParselet {
  parse(parser: Parser, token: Token): Expression;
}

export interface InfixParselet {
  parse(parser: Parser, left: Expression, token: Token): Expression;
  precedence(): number;
}

export class NumberParselet implements PrefixParselet {
  parse(_parser: Parser, token: Token): Expression {
    return { type: "NumberLiteralExpression", value: Number(token.lexeme) };
  }
}

type BinaryOperator = Extract<
  Expression,
  { type: "BinaryExpression" }
>["operator"];

export class BinaryExpressionParselet implements InfixParselet {
  private _precedence: number;
  constructor(precedence: number) {
    this._precedence = precedence;
  }

  parse(parser: Parser, left: Expression, token: Token): Expression {
    const right = parser.parse_expression(this.precedence());
    return {
      type: "BinaryExpression",
      operator: this.to_operator(token),
      left,
      right,
    };
  }

  precedence(): number {
    return this._precedence;
  }

  private to_operator(
    token: Token,
  ): BinaryOperator {
    switch (token.type) {
      case "LessThan":
      case "GreaterThan":
      case "Plus":
      case "LessThanEqual":
      case "GreaterThanEqual":
        return token.type;
      default:
        throw new Error(`Unexpected token: ${token.type}`);
    }
  }
}

export class ChannelReceive implements PrefixParselet {
  parse(parser: Parser, _token: Token): Expression {
    const channel = parser.parse_expression();
    return {
      type: "ChannelReceiveExpression",
      channel,
    };
  }
}

export class IdentifierParselet implements PrefixParselet {
  parse(_parser: Parser, token: Token): Expression {
    return { type: "IdentifierExpression", name: token.lexeme };
  }
}

export class StringParselet implements PrefixParselet {
  parse(_parser: Parser, token: Token): Expression {
    const value = token.lexeme.substring(1, token.lexeme.length - 1);
    return { type: "StringLiteralExpression", value };
  }
}

export class NilParselet implements PrefixParselet {
  parse(_parser: Parser, _token: Token): Expression {
    return { type: "NilLiteralExpression" };
  }
}

export class PropertyAccessParselet implements InfixParselet {
  parse(parser: Parser, left: Expression, _token: Token): Expression {
    const property = parser.consume("Identifier");
    return {
      type: "PropertyAccessExpression",
      object: left,
      name: property.lexeme,
    };
  }

  precedence(): number {
    return Precedence.MEMBER_ACCESS;
  }
}

export class CallParselet implements InfixParselet {
  parse(parser: Parser, left: Expression, _token: Token): Expression {
    const args = parser.parse_delimited("Comma", "RightParen", () => {
      return parser.parse_expression();
    });
    return {
      type: "CallExpression",
      callee: left,
      args,
    };
  }

  precedence(): number {
    return Precedence.CALL;
  }
}

export class LambdaParselet implements PrefixParselet {
  parse(parser: Parser, _token: Token): Expression {
    parser.consume("LeftParen");
    const params = parser.parse_delimited("Comma", "RightParen", () => {
      return parser.consume("Identifier").lexeme;
    });
    parser.consume("LeftBrace");
    const body: Statement[] = [];
    while (parser.peek().type !== "RightBrace") {
      body.push(parser.parse_statement());
    }
    parser.consume("RightBrace");
    return lambda(params, body);
  }
}

export class ObjectLiteralParselet implements PrefixParselet {
  parse(parser: Parser, _token: Token): Expression {
    const properties = parser.parse_delimited("Comma", "RightBrace", () => {
      const name = parser.consume("Identifier").lexeme;
      parser.consume("Colon");
      const value = parser.parse_expression();
      return { name, value };
    });
    return {
      type: "ObjectExpression",
      properties,
    };
  }
}

export class TrueLiteralParselet implements PrefixParselet {
  parse(_parser: Parser, _token: Token): Expression {
    return { type: "BooleanLiteralExpression", value: true };
  }
}

export class FalseLiteralParselet implements PrefixParselet {
  parse(_parser: Parser, _token: Token): Expression {
    return { type: "BooleanLiteralExpression", value: false };
  }
}
