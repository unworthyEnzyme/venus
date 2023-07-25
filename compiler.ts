import { Expression, Statement } from "./ast.ts";
import { Instruction } from "./instruction.ts";

export class Compiler {
  compile(statements: Statement[]): Instruction[] {
    const instructions: Instruction[] = [];
    for (const statement of statements) {
      switch (statement.type) {
        case "ChannelSendStatement": {
          instructions.push(...this.compile_expression(statement.value));
          instructions.push(...this.compile_expression(statement.channel));
          instructions.push({ type: "ChannelSend" });
          break;
        }
        case "ExpressionStatement": {
          instructions.push(
            ...this.compile_expression(statement.expression),
          );
          instructions.push({ type: "Pop" });
          break;
        }
        case "ReturnStatement": {
          instructions.push(
            ...this.compile_expression(statement.expression),
          );
          instructions.push({ type: "Return" });
          break;
        }
        case "FunctionDeclarationStatement": {
          const body = this.compile(statement.body);
          const does_it_have_return = body.some(
            (instruction) => instruction.type === "Return",
          );
          if (!does_it_have_return) {
            body.push({ type: "Push", value: { type: "Nil" } });
            body.push({ type: "Return" });
          }
          instructions.push({
            type: "Push",
            value: {
              type: "Function",
              parameters: statement.parameters,
              body: body,
            },
          });
          instructions.push({
            type: "DeclareLocal",
            name: statement.name,
          });
          break;
        }
        case "SpawnStatement": {
          for (const arg of statement.args) {
            instructions.push(...this.compile_expression(arg));
          }
          instructions.push(
            ...this.compile_expression(statement.spawnee),
          );
          instructions.push({
            type: "Spawn",
            arity: statement.args.length,
          });
          break;
        }
        case "YieldStatement": {
          instructions.push({ type: "Yield" });
          break;
        }
        case "PrintStatement": {
          instructions.push(
            ...this.compile_expression(statement.expression),
          );
          instructions.push({ type: "Print" });
          break;
        }
        case "WhileStatement": {
          instructions.push({ type: "BlockStart" });
          const loop_expression = this.compile_expression(
            statement.condition,
          );
          instructions.push(...loop_expression);
          const loop_body = this.compile(statement.body);
          instructions.push({
            type: "JumpIfFalse",
            offset: loop_body.length + 1,
          });
          instructions.push(...loop_body);
          instructions.push({
            type: "Jump",
            offset: -(loop_body.length + loop_expression.length + 2),
          });
          instructions.push({ type: "BlockEnd" });
          break;
        }
        case "VariableDeclarationStatement": {
          instructions.push(
            ...this.compile_expression(statement.initializer),
          );
          instructions.push({
            type: "DeclareLocal",
            name: statement.name,
          });
          break;
        }
        case "AssignmentStatement": {
          instructions.push(
            ...this.compile_expression(statement.value),
          );
          instructions.push({
            type: "SetLocal",
            name: statement.name,
          });
          break;
        }
      }
    }
    return instructions;
  }
  compile_expression(expression: Expression): Instruction[] {
    const instructions: Instruction[] = [];
    switch (expression.type) {
      case "StringLiteralExpression": {
        instructions.push({
          type: "Push",
          value: { type: "String", value: expression.value },
        });
        break;
      }
      case "PropertyAccessExpression": {
        instructions.push(...this.compile_expression(expression.object));
        instructions.push({
          type: "AccessProperty",
          name: expression.name,
        });
        break;
      }
      case "ObjectExpression": {
        instructions.push({
          type: "Push",
          value: { type: "Object", properties: {} },
        });
        for (const property of expression.properties) {
          instructions.push(...this.compile_expression(property.value));
          instructions.push({
            type: "DefineProperty",
            name: property.name,
          });
        }
        break;
      }
      case "ChannelReceiveExpression": {
        instructions.push(...this.compile_expression(expression.channel));
        instructions.push({ type: "ChannelReceive" });
        break;
      }
      case "NumberLiteralExpression": {
        instructions.push({
          type: "Push",
          value: { type: "Number", value: expression.value },
        });
        break;
      }
      case "NilLiteralExpression": {
        instructions.push({
          type: "Push",
          value: { type: "Nil" },
        });
        break;
      }
      case "BinaryExpression": {
        instructions.push(...this.compile_expression(expression.left));
        instructions.push(...this.compile_expression(expression.right));
        switch (expression.operator) {
          case "LessThan":
            instructions.push({ type: "LessThan" });
            break;
          case "GreaterThan":
            instructions.push({ type: "GreaterThan" });
            break;
          case "Add":
            instructions.push({ type: "Add" });
            break;
        }
        break;
      }
      case "IdentifierExpression": {
        instructions.push({
          type: "GetLocal",
          name: expression.name,
        });
        break;
      }
      case "CallExpression": {
        for (const arg of expression.args) {
          instructions.push(...this.compile_expression(arg));
        }
        instructions.push(...this.compile_expression(expression.callee));
        instructions.push({
          type: "Call",
          arity: expression.args.length,
        });
        break;
      }
      case "LambdaExpression": {
        const body = this.compile(expression.body);
        const doesItHaveReturn = body.some(
          (instruction) => instruction.type === "Return",
        );
        if (!doesItHaveReturn) {
          body.push({ type: "Push", value: { type: "Nil" } });
          body.push({ type: "Return" });
        }

        instructions.push({
          type: "Push",
          value: {
            type: "Function",
            parameters: expression.parameters,
            body: body,
          },
        });
        break;
      }
    }
    return instructions;
  }
}
