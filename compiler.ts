import { Expression, Statement } from "./ast.ts";
import { Instruction } from "./instruction.ts";

export class Compiler {
  compile(statements: Statement[]): Instruction[] {
    const instructions: Instruction[] = [];
    for (const statement of statements) {
      switch (statement.type) {
        case "ExpressionStatement": {
          instructions.push(
            ...this.compileExpression(statement.expression),
          );
          instructions.push({ type: "Pop" });
          break;
        }
        case "ReturnStatement": {
          instructions.push(
            ...this.compileExpression(statement.expression),
          );
          instructions.push({ type: "Return" });
          break;
        }
        case "FunctionDeclarationStatement": {
          const body = this.compile(statement.body);
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
            instructions.push(...this.compileExpression(arg));
          }
          instructions.push(
            ...this.compileExpression(statement.spawnee),
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
            ...this.compileExpression(statement.expression),
          );
          instructions.push({ type: "Print" });
          break;
        }
        case "WhileStatement": {
          instructions.push({ type: "BlockStart" });
          const loopExpression = this.compileExpression(
            statement.condition,
          );
          instructions.push(...loopExpression);
          const loopBody = this.compile(statement.body);
          instructions.push({
            type: "JumpIfFalse",
            offset: loopBody.length + 1,
          });
          instructions.push(...loopBody);
          instructions.push({
            type: "Jump",
            offset: -(loopBody.length + loopExpression.length + 2),
          });
          instructions.push({ type: "BlockEnd" });
          break;
        }
        case "VariableDeclarationStatement": {
          instructions.push(
            ...this.compileExpression(statement.initializer),
          );
          instructions.push({
            type: "DeclareLocal",
            name: statement.name,
          });
          break;
        }
        case "AssignmentStatement": {
          instructions.push(
            ...this.compileExpression(statement.value),
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
  compileExpression(expression: Expression): Instruction[] {
    const instructions: Instruction[] = [];
    switch (expression.type) {
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
        instructions.push(...this.compileExpression(expression.left));
        instructions.push(...this.compileExpression(expression.right));
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
          instructions.push(...this.compileExpression(arg));
        }
        instructions.push(...this.compileExpression(expression.callee));
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
