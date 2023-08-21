import { Expression, Statement } from "./ast.ts";

export class Tokenizer {
  private keywords: Record<string, TokenType> = {
    or: "Or",
    and: "And",
    false: "False",
    true: "True",
    fun: "Fun",
    let: "Let",
    nil: "Nil",
    print: "Print",
    return: "Return",
    while: "While",
    yield: "Yield",
    spawn: "Spawn",
  };

  constructor(
    private source: string,
    private current = 0,
    private tokens: Token[] = [],
  ) {}

  tokenize(): Token[] {
    while (!this.is_at_end(this.source)) {
      const c = this.advance();
      switch (c) {
        case "(":
          this.tokens.push({ type: "LeftParen", lexeme: c });
          break;
        case ")":
          this.tokens.push({ type: "RightParen", lexeme: c });
          break;
        case "{":
          this.tokens.push({ type: "LeftBrace", lexeme: c });
          break;
        case "}":
          this.tokens.push({ type: "RightBrace", lexeme: c });
          break;
        case ",":
          this.tokens.push({ type: "Comma", lexeme: c });
          break;
        case ".":
          this.tokens.push({ type: "Dot", lexeme: c });
          break;
        case "-":
          if (this.match(">")) {
            this.tokens.push({ type: "RightArrow", lexeme: "->" });
          } else {
            this.tokens.push({ type: "Minus", lexeme: c });
          }
          break;
        case "+":
          this.tokens.push({ type: "Plus", lexeme: c });
          break;
        case ";":
          this.tokens.push({ type: "Semicolon", lexeme: c });
          break;
        case "*":
          this.tokens.push({ type: "Star", lexeme: c });
          break;
        case "!": {
          if (this.match("=")) {
            this.tokens.push({
              type: "BangEqual",
              lexeme: "!=",
            });
          } else {
            this.tokens.push({ type: "Bang", lexeme: c });
          }
          break;
        }
        case "=": {
          if (this.match("=")) {
            this.tokens.push({
              type: "EqualEqual",
              lexeme: "==",
            });
          } else {
            this.tokens.push({ type: "Equal", lexeme: c });
          }
          break;
        }
        case "<": {
          if (this.match("-")) {
            this.tokens.push({ type: "LeftArrow", lexeme: "<-" });
          } else if (this.match("=")) {
            this.tokens.push({
              type: "LessThanEqual",
              lexeme: "<=",
            });
          } else {
            this.tokens.push({ type: "LessThan", lexeme: "<" });
          }
          break;
        }
        case ">": {
          if (this.match("=")) {
            this.advance();
            this.tokens.push({
              type: "GreaterThanEqual",
              lexeme: ">=",
            });
          } else {
            this.tokens.push({ type: "GreaterThan", lexeme: ">" });
          }
          break;
        }
        case "/":
          this.tokens.push({ type: "Slash", lexeme: c });
          break;
        case " ":
        case "\r":
        case "\t":
          break;
        case "\n":
          break;
        default: {
          if (this.is_digit(c)) {
            this.number();
          } else if (this.is_alpha(c)) {
            this.identifier();
          } else {
            throw new Error(`Unexpected character: ${c}`);
          }
        }
      }
    }
    this.tokens.push({ type: "EOF", lexeme: "" });
    return this.tokens;
  }

  private is_at_end(source: string) {
    return this.current >= source.length;
  }

  private advance() {
    return this.source[this.current++];
  }

  private match(expected: string) {
    if (this.is_at_end(this.source)) return false;
    if (this.source[this.current] !== expected) return false;

    this.current++;
    return true;
  }

  private is_digit(c: string) {
    return c >= "0" && c <= "9";
  }

  private peek() {
    if (this.is_at_end(this.source)) return "\0";
    return this.source[this.current];
  }

  private number() {
    const start = this.current;
    while (this.is_digit(this.peek())) this.advance();

    this.tokens.push({
      type: "Number",
      lexeme: this.source.substring(start - 1, this.current),
    });
  }

  private is_alpha(c: string) {
    return (c >= "a" && c <= "z") || (c >= "A" && c <= "Z") || c === "_";
  }

  private is_alphanumeric(c: string) {
    return this.is_alpha(c) || this.is_digit(c);
  }

  private identifier() {
    const start = this.current;
    while (this.is_alphanumeric(this.peek())) this.advance();

    const text = this.source.substring(start - 1, this.current);
    const type = this.keywords[text] ?? "Identifier";
    this.tokens.push({ type, lexeme: text });
  }
}

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

export class Parser {
  private tokens: Token[] = [];
  private current = 0;
  private prefix_parselets: Map<TokenType, PrefixParselet> = new Map();
  private infix_parselets: Map<TokenType, InfixParselet> = new Map();
  constructor() {
    this.register_prefix("Number", new NumberParselet());
    this.register_prefix("LeftArrow", new ChannelReceive());
    this.register_prefix("Identifier", new IdentifierParselet());
    this.register_binary("Plus", Precedence.SUM);
    this.register_binary("LessThan", Precedence.LESS_THAN);
    this.register_binary("GreaterThan", Precedence.GREATER_THAN);
  }
  parse(source: string): Statement[] {
    const tokenizer = new Tokenizer(source);
    this.tokens = tokenizer.tokenize();
    const statements: Statement[] = [];
    return statements;
  }

  parse_expression(precedence: number): Expression;
  parse_expression(): Expression;
  parse_expression(precedence?: number): Expression {
    if (precedence === undefined) return this.parse_expression(0);
    const token = this.advance();
    const prefix_parselet = this.prefix_parselets.get(token.type) ??
      raise(`No prefix parselet for ${token.type}`);
    let left = prefix_parselet.parse(this, token);
    while (precedence < this.get_precedence()) {
      const token = this.advance();
      const infix_parselet = this.infix_parselets.get(token.type) ??
        raise(`No infix parselet for ${token.type}`);
      left = infix_parselet.parse(this, left, token);
    }
    return left;
  }

  private get_precedence(): number {
    const token = this.peek();
    const parselet = this.infix_parselets.get(token.type);
    if (!parselet) return 0;
    return parselet.precedence();
  }

  private advance(): Token {
    return this.tokens[this.current++];
  }

  private peek(): Token {
    return this.tokens[this.current];
  }

  private register_prefix(token_type: TokenType, parselet: PrefixParselet) {
    this.prefix_parselets.set(token_type, parselet);
  }

  private register_infix(token_type: TokenType, parselet: InfixParselet) {
    this.infix_parselets.set(token_type, parselet);
  }

  private register_binary(token_type: TokenType, precedence: number) {
    this.register_infix(
      token_type,
      new BinaryExpressionParselet(precedence),
    );
  }
}

enum Precedence {
  SUM = 10,
  LESS_THAN = 20,
  GREATER_THAN = 20,
}

interface PrefixParselet {
  parse(parser: Parser, token: Token): Expression;
}

interface InfixParselet {
  parse(parser: Parser, left: Expression, token: Token): Expression;
  precedence(): number;
}

class NumberParselet implements PrefixParselet {
  parse(parser: Parser, token: Token): Expression {
    return { type: "NumberLiteralExpression", value: Number(token.lexeme) };
  }
}

class BinaryExpressionParselet implements InfixParselet {
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

class ChannelReceive implements PrefixParselet {
  parse(parser: Parser, token: Token): Expression {
    const channel = parser.parse_expression();
    return {
      type: "ChannelReceiveExpression",
      channel,
    };
  }
}

class IdentifierParselet implements PrefixParselet {
  parse(parser: Parser, token: Token): Expression {
    return { type: "IdentifierExpression", name: token.lexeme };
  }
}

function raise(message: string): never {
  throw new Error(message);
}
