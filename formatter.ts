import { Parser } from "./parser.ts";
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

export class Formatter {
  private indent_level = 0;
  private indent_size = 2;

  format(source: string): string {
    const parser = new Parser();
    const statements = parser.parse(source);
    return this.format_statements(statements);
  }

  format_statements(statements: Statement[]): string {
    return statements.map((stmt) => this.format_statement(stmt)).join("\n");
  }

  private indent(): string {
    return " ".repeat(this.indent_level * this.indent_size);
  }

  private format_statement(statement: Statement): string {
    if (statement instanceof Block) {
      return this.format_block(statement);
    } else if (statement instanceof FunctionDeclaration) {
      return this.format_function_declaration(statement);
    } else if (statement instanceof If) {
      return this.format_if(statement);
    } else if (statement instanceof ChannelSend) {
      return this.format_channel_send(statement);
    } else if (statement instanceof Return) {
      return this.format_return(statement);
    } else if (statement instanceof Spawn) {
      return this.format_spawn(statement);
    } else if (statement instanceof Yield) {
      return this.format_yield(statement);
    } else if (statement instanceof Print) {
      return this.format_print(statement);
    } else if (statement instanceof While) {
      return this.format_while(statement);
    } else if (statement instanceof ExpressionStatement) {
      return this.format_expression_statement(statement);
    } else if (statement instanceof VariableDeclaration) {
      return this.format_variable_declaration(statement);
    } else if (statement instanceof Assignment) {
      return this.format_assignment(statement);
    }
    return statement.toString();
  }

  private format_block(block: Block): string {
    if (block.statements.length === 0) {
      return "{}";
    }

    this.indent_level++;
    const body = block.statements
      .map((stmt) => `${this.indent()}${this.format_statement(stmt)}`)
      .join("\n");
    this.indent_level--;

    return `{\n${body}\n${this.indent()}}`;
  }

  private format_function_declaration(func: FunctionDeclaration): string {
    const params = func.parameters.join(", ");
    this.indent_level++;
    const body = func.body
      .map((stmt) => `${this.indent()}${this.format_statement(stmt)}`)
      .join("\n");
    this.indent_level--;

    return `fun ${func.name}(${params}) {\n${body}\n${this.indent()}}`;
  }

  private format_if(if_stmt: If): string {
    const condition = this.format_expression(if_stmt.condition);

    this.indent_level++;
    const then_branch = if_stmt.then_branch
      .map((stmt) => `${this.indent()}${this.format_statement(stmt)}`)
      .join("\n");
    let result = `if ${condition} {\n${then_branch}\n${this.indent()}}`;

    if (if_stmt.else_branch.length > 0) {
      const else_branch = if_stmt.else_branch
        .map((stmt) => `${this.indent()}${this.format_statement(stmt)}`)
        .join("\n");
      result += ` else {\n${else_branch}\n${this.indent()}}`;
    }

    this.indent_level--;
    return result;
  }

  private format_channel_send(send: ChannelSend): string {
    const channel = this.format_expression(send.channel);
    const value = this.format_expression(send.value);
    return `${channel} <- ${value};`;
  }

  private format_return(ret: Return): string {
    return `return ${this.format_expression(ret.expression)};`;
  }

  private format_spawn(spawn: Spawn): string {
    return `spawn ${this.format_expression(spawn.spawnee)};`;
  }

  private format_yield(_yield: Yield): string {
    return "yield;";
  }

  private format_print(print: Print): string {
    return `print ${this.format_expression(print.expression)};`;
  }

  private format_while(while_stmt: While): string {
    const condition = this.format_expression(while_stmt.condition);

    this.indent_level++;
    const body = while_stmt.body
      .map((stmt) => `${this.indent()}${this.format_statement(stmt)}`)
      .join("\n");
    this.indent_level--;

    return `while ${condition} {\n${body}\n${this.indent()}}`;
  }

  private format_expression_statement(stmt: ExpressionStatement): string {
    return `${this.format_expression(stmt.expression)};`;
  }

  private format_variable_declaration(decl: VariableDeclaration): string {
    return `let ${decl.name} = ${this.format_expression(decl.initializer)};`;
  }

  private format_assignment(assignment: Assignment): string {
    return `${assignment.name} = ${this.format_expression(assignment.value)};`;
  }

  private format_expression(expression: Expression): string {
    if (expression instanceof NumberLiteral) {
      return expression.value.toString();
    } else if (expression instanceof StringLiteral) {
      return `"${expression.value}"`;
    } else if (expression instanceof Binary) {
      return this.format_binary(expression);
    } else if (expression instanceof Identifier) {
      return expression.name;
    } else if (expression instanceof Call) {
      return this.format_call(expression);
    } else if (expression instanceof PropertyAccess) {
      return `${this.format_expression(expression.object)}.${expression.name}`;
    } else if (expression instanceof ObjectLiteral) {
      return this.format_object_literal(expression);
    } else if (expression instanceof Lambda) {
      return this.format_lambda(expression);
    } else if (expression instanceof NilLiteral) {
      return "nil";
    } else if (expression instanceof BooleanLiteral) {
      return expression.value.toString();
    } else if (expression instanceof ChannelReceive) {
      return `<-${this.format_expression(expression.channel)}`;
    }
    return expression.toString();
  }

  private format_binary(binary: Binary): string {
    const left = this.format_expression(binary.left);
    const right = this.format_expression(binary.right);

    // Map operator back to its symbol representation
    let operator = "";
    switch (binary.operator) {
      case "Plus":
        operator = "+";
        break;
      case "Minus":
        operator = "-";
        break;
      case "LessThan":
        operator = "<";
        break;
      case "GreaterThan":
        operator = ">";
        break;
      case "LessThanEqual":
        operator = "<=";
        break;
      case "GreaterThanEqual":
        operator = ">=";
        break;
    }

    return `${left} ${operator} ${right}`;
  }

  private format_call(call: Call): string {
    const callee = this.format_expression(call.callee);
    const args = call.args.map((arg) => this.format_expression(arg)).join(", ");
    return `${callee}(${args})`;
  }

  private format_object_literal(obj: ObjectLiteral): string {
    if (obj.properties.length === 0) {
      return "{}";
    }

    this.indent_level++;
    const props = obj.properties
      .map((prop) =>
        `${this.indent()}${prop.name}: ${this.format_expression(prop.value)}`
      )
      .join(",\n");
    this.indent_level--;

    return `{\n${props}\n${this.indent()}}`;
  }

  private format_lambda(lambda: Lambda): string {
    const params = lambda.parameters.join(", ");

    this.indent_level++;
    const body = lambda.body
      .map((stmt) => `${this.indent()}${this.format_statement(stmt)}`)
      .join("\n");
    this.indent_level--;

    return `|${params}| {\n${body}\n${this.indent()}}`;
  }
}

// CLI entry point
if (import.meta.main) {
  const args = Deno.args;

  if (args.length === 0) {
    console.log("Usage: deno run formatter.ts <file>");
    Deno.exit(1);
  }

  const file_path = args[0];
  try {
    const source = Deno.readTextFileSync(file_path);
    const formatter = new Formatter();
    const formatted = formatter.format(source);

    if (args.includes("--write")) {
      Deno.writeTextFileSync(file_path, formatted);
      console.log(`Formatted and saved: ${file_path}`);
    } else {
      console.log(formatted);
    }
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(error.message);
    }
    Deno.exit(1);
  }
}
