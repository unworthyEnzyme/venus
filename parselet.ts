import { Expression, Token } from "./ast.ts";
import { Parser } from "./parser.ts";

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

  private to_operator(token: Token): "LessThan" | "GreaterThan" | "Plus" {
    switch (token.type) {
      case "LessThan":
        return "LessThan";
      case "GreaterThan":
        return "GreaterThan";
      case "Plus":
        return "Plus";
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
