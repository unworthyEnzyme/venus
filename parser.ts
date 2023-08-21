import { Tokenizer } from "./Tokenizer.ts";
import { Expression, Statement, Token, TokenType } from "./ast.ts";
import {
  BinaryExpressionParselet,
  ChannelReceive,
  IdentifierParselet,
  InfixParselet,
  NumberParselet,
  PrefixParselet,
  StringParselet,
} from "./parselet.ts";

export class Parser {
  private tokens: Token[] = [];
  private current = 0;
  private prefix_parselets: Map<TokenType, PrefixParselet> = new Map();
  private infix_parselets: Map<TokenType, InfixParselet> = new Map();
  constructor() {
    this.register_prefix("Number", new NumberParselet());
    this.register_prefix("LeftArrow", new ChannelReceive());
    this.register_prefix("Identifier", new IdentifierParselet());
    this.register_prefix("String", new StringParselet());
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

function raise(message: string): never {
  throw new Error(message);
}
