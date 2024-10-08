import { Tokenizer } from "./Tokenizer.ts";
import {
  Call,
  Expression,
  Identifier,
  Statement,
  Token,
  TokenType,
} from "./ast.ts";
import * as builder from "./ast_builder.ts";
import {
  BinaryExpressionParselet,
  CallParselet,
  ChannelReceive,
  FalseLiteralParselet,
  IdentifierParselet,
  InfixParselet,
  LambdaParselet,
  NilParselet,
  NumberParselet,
  ObjectLiteralParselet,
  PrefixParselet,
  PropertyAccessParselet,
  StringParselet,
  TrueLiteralParselet,
} from "./parselet.ts";

export class Parser {
  private tokens: Token[] = [];
  private current = 0;
  private prefix_parselets: Map<TokenType, PrefixParselet> = new Map();
  private infix_parselets: Map<TokenType, InfixParselet> = new Map();
  constructor() {
    this.register_prefix("True", new TrueLiteralParselet());
    this.register_prefix("False", new FalseLiteralParselet());
    this.register_prefix("LeftBrace", new ObjectLiteralParselet());
    this.register_prefix("Pipe", new LambdaParselet());
    this.register_prefix("Number", new NumberParselet());
    this.register_prefix("LeftArrow", new ChannelReceive());
    this.register_prefix("Identifier", new IdentifierParselet());
    this.register_prefix("String", new StringParselet());
    this.register_prefix("Nil", new NilParselet());
    this.register_infix("Dot", new PropertyAccessParselet());
    this.register_infix("LeftParen", new CallParselet());
    this.register_binary("Plus", Precedence.SUM);
    this.register_binary("LessThan", Precedence.LESS_THAN);
    this.register_binary("GreaterThan", Precedence.GREATER_THAN);
    this.register_binary("GreaterThanEqual", Precedence.GREATER_THAN_EQUAL);
    this.register_binary("LessThanEqual", Precedence.LESS_THAN_EQUAL);
    this.register_binary("Minus", Precedence.SUM);
  }
  parse(source: string): Statement[] {
    const tokenizer = new Tokenizer(source);
    this.tokens = tokenizer.tokenize();
    const statements: Statement[] = [];
    while (!this.is_at_end()) {
      statements.push(this.parse_statement());
    }
    return statements;
  }

  parse_statement(): Statement {
    if (this.match("Fun")) {
      const name = this.consume("Identifier").lexeme;
      this.consume("LeftParen");
      const parameters = this.parse_delimited(
        "Comma",
        "RightParen",
        () => this.consume("Identifier").lexeme,
      );
      this.consume("LeftBrace");
      const body = this.parse_block();
      return builder.function_declaration(name, parameters, body);
    }
    if (this.match("LeftBrace")) {
      return builder.block(this.parse_block());
    }
    if (this.match("If")) {
      const condition = this.parse_expression();
      this.consume("LeftBrace");
      const then_branch = this.parse_block();
      let else_branch: Statement[] = [];
      if (this.match("Else")) {
        this.consume("LeftBrace");
        else_branch = this.parse_block();
      }
      return builder.if_(condition, then_branch, else_branch);
    }
    if (this.match("Spawn")) {
      const spawnee = this.parse_expression();
      if (!(spawnee instanceof Call)) {
        throw new Error(`Expected call expression, got ${spawnee}`);
      }
      this.consume("Semicolon");
      return builder.spawn(spawnee);
    }
    if (this.match("Yield")) {
      this.consume("Semicolon");
      return builder.yield_();
    }
    if (this.match("Print")) {
      const expression = this.parse_expression();
      this.consume("Semicolon");
      return builder.print(expression);
    }

    if (this.match("Return")) {
      const expression = this.parse_expression();
      this.consume("Semicolon");
      return builder.return_(expression);
    }

    if (this.match("Let")) {
      const name = this.consume("Identifier").lexeme;
      this.consume("Equal");
      const initializer = this.parse_expression();
      this.consume("Semicolon");
      return builder.variable_declaration(name, initializer);
    }

    if (this.match("While")) {
      const condition = this.parse_expression();
      this.consume("LeftBrace");
      const body = this.parse_block();
      return builder.while_(condition, body);
    }

    const expr = this.parse_expression();
    if (this.match("LeftArrow")) {
      const channel = expr;
      const value = this.parse_expression();
      this.consume("Semicolon");
      return builder.channel_send(channel, value);
    }
    if (this.match("Equal")) {
      const value = this.parse_expression();
      if (!(expr instanceof Identifier)) {
        throw new Error(`Expected identifier expression, got ${value}`);
      }
      this.consume("Semicolon");
      return builder.assignment(expr.name, value);
    }
    this.consume("Semicolon");
    return builder.expression_statement(expr);
  }

  private parse_block(): Statement[] {
    const statements: Statement[] = [];
    while (!this.is_at_end() && this.peek().type !== "RightBrace") {
      statements.push(this.parse_statement());
    }
    this.consume("RightBrace");
    return statements;
  }

  parse_delimited<T>(
    delimiter: TokenType,
    ends_with: TokenType,
    parser: () => T,
  ) {
    const list: T[] = [];
    while (!this.is_at_end() && this.peek().type !== ends_with) {
      list.push(parser());
      if (this.peek().type === delimiter) {
        this.advance();
      }
    }
    this.consume(ends_with);
    return list;
  }

  private expression_statement(): Statement {
    const expression = this.parse_expression();
    this.consume("Semicolon");
    return builder.expression_statement(expression);
  }

  private match(token_type: Token["type"]): boolean {
    if (this.peek().type === token_type) {
      this.advance();
      return true;
    }
    return false;
  }

  private is_at_end(): boolean {
    return this.peek().type === "EOF";
  }

  parse_expression_from_source(source: string): Expression {
    const tokenizer = new Tokenizer(source);
    const tokens = tokenizer.tokenize();
    const parser = new Parser();
    parser.tokens = tokens;
    return parser.parse_expression();
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

  peek(): Token {
    return this.tokens[this.current];
  }

  consume(token: TokenType): Token {
    const current = this.advance();
    if (current.type !== token) {
      throw new Error(`Expected ${token}, got ${current.type}`);
    }
    return current;
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

export enum Precedence {
  LESS_THAN = 10,
  GREATER_THAN = 10,
  LESS_THAN_EQUAL = 10,
  GREATER_THAN_EQUAL = 10,
  SUM = 20,
  CALL = 30,
  MEMBER_ACCESS = 40,
}

function raise(message: string): never {
  throw new Error(message);
}
