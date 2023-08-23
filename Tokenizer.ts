import { Token, TokenType } from "./ast.ts";

export class Tokenizer {
  private keywords: Record<string, TokenType> = {
    if: "If",
    else: "Else",
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
        case ":":
          this.tokens.push({ type: "Colon", lexeme: c });
          break;
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
        case '"': {
          const start = this.current - 1;
          while (this.peek() !== '"' && !this.is_at_end(this.source)) {
            this.advance();
          }
          if (this.is_at_end(this.source)) {
            throw new Error("Unterminated string");
          }
          this.advance();
          const lexeme = this.source.substring(start, this.current);
          this.tokens.push({ type: "String", lexeme });
          break;
        }
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
    if (this.is_at_end(this.source)) {
      return false;
    }
    if (this.source[this.current] !== expected) {
      return false;
    }

    this.current++;
    return true;
  }

  private is_digit(c: string) {
    return c >= "0" && c <= "9";
  }

  private peek() {
    if (this.is_at_end(this.source)) {
      return "\0";
    }
    return this.source[this.current];
  }

  private number() {
    const start = this.current;
    while (this.is_digit(this.peek())) {
      this.advance();
    }

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
    while (this.is_alphanumeric(this.peek())) {
      this.advance();
    }

    const text = this.source.substring(start - 1, this.current);
    const type = this.keywords[text] ?? "Identifier";
    this.tokens.push({ type, lexeme: text });
  }
}
