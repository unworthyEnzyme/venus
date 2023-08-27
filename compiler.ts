import * as ast from "./ast.ts";
import { Instruction } from "./instruction.ts";
import {
  BooleanValue,
  FunctionValue,
  Nil,
  NumberValue,
  ObjectValue,
  StringValue,
} from "./value.ts";

export class Compiler {
  compile(statements: ast.Statement[]): Instruction[] {
    const instructions: Instruction[] = [];
    for (const statement of statements) {
      if (statement instanceof ast.Block) {
        instructions.push({ type: "BlockStart" });
        instructions.push(...this.compile(statement.statements));
        instructions.push({ type: "BlockEnd" });
      } else if (statement instanceof ast.Print) {
        instructions.push(
          ...this.compile_expression(statement.expression),
        );
        instructions.push({ type: "Print" });
      } else if (statement instanceof ast.While) {
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
          offset: -(
            loop_body.length +
            loop_expression.length +
            2
          ),
        });
        instructions.push({ type: "BlockEnd" });
      } else if (statement instanceof ast.VariableDeclaration) {
        instructions.push(
          ...this.compile_expression(statement.initializer),
        );
        instructions.push({
          type: "DeclareLocal",
          name: statement.name,
        });
      } else if (statement instanceof ast.Assignment) {
        instructions.push(
          ...this.compile_expression(statement.value),
        );
        instructions.push({
          type: "SetLocal",
          name: statement.name,
        });
      } else if (statement instanceof ast.If) {
        instructions.push({ type: "BlockStart" });
        instructions.push(...this.compile_expression(statement.condition));
        const then_branch = this.compile(statement.then_branch);
        const else_branch = this.compile(statement.else_branch);
        instructions.push({
          type: "JumpIfFalse",
          offset: then_branch.length + 1,
        });
        instructions.push(...then_branch);
        instructions.push({
          type: "Jump",
          offset: else_branch.length,
        });
        instructions.push(...else_branch);
        instructions.push({ type: "BlockEnd" });
      } else if (statement instanceof ast.ChannelSend) {
        instructions.push(
          ...this.compile_expression(statement.value),
        );
        instructions.push(
          ...this.compile_expression(statement.channel),
        );
        instructions.push({ type: "ChannelSend" });
      } else if (statement instanceof ast.ExpressionStatement) {
        instructions.push(
          ...this.compile_expression(statement.expression),
        );
        instructions.push({ type: "Pop" });
      } else if (statement instanceof ast.Return) {
        instructions.push(
          ...this.compile_expression(statement.expression),
        );
        instructions.push({ type: "Return" });
      } else if (statement instanceof ast.Spawn) {
        for (const arg of statement.spawnee.args) {
          instructions.push(...this.compile_expression(arg));
        }
        instructions.push(
          ...this.compile_expression(statement.spawnee.callee),
        );
        instructions.push({
          type: "Spawn",
          arity: statement.spawnee.args.length,
        });
      } else if (statement instanceof ast.Yield) {
        instructions.push({ type: "Yield" });
      }
    }
    return instructions;
  }
  compile_expression(expression: ast.Expression): Instruction[] {
    const instructions: Instruction[] = [];
    if (expression instanceof ast.BooleanLiteral) {
      instructions.push({
        type: "Push",
        value: new BooleanValue(expression.value),
      });
    } else if (expression instanceof ast.Binary) {
      instructions.push(...this.compile_expression(expression.left));
      instructions.push(...this.compile_expression(expression.right));
      switch (expression.operator) {
        case "LessThan":
          instructions.push({ type: "LessThan" });
          break;
        case "GreaterThan":
          instructions.push({ type: "GreaterThan" });
          break;
        case "Plus":
          instructions.push({ type: "Plus" });
          break;
        case "GreaterThanEqual":
          instructions.push({ type: "GreaterThanEqual" });
          break;
        case "LessThanEqual":
          instructions.push({ type: "LessThanEqual" });
      }
    } else if (expression instanceof ast.Identifier) {
      instructions.push({
        type: "GetLocal",
        name: expression.name,
      });
    } else if (expression instanceof ast.Call) {
      for (const arg of expression.args) {
        instructions.push(...this.compile_expression(arg));
      }
      instructions.push(
        ...this.compile_expression(expression.callee),
      );
      instructions.push({
        type: "Call",
        arity: expression.args.length,
      });
    } else if (expression instanceof ast.Lambda) {
      const body = this.compile(expression.body);
      const doesItHaveReturn = body.some(
        (instruction) => instruction.type === "Return",
      );
      if (!doesItHaveReturn) {
        body.push({ type: "Push", value: new Nil() });
        body.push({ type: "Return" });
      }

      instructions.push({
        type: "Push",
        value: new FunctionValue(expression.parameters, body),
      });
    } else if (expression instanceof ast.StringLiteral) {
      instructions.push({
        type: "Push",
        value: new StringValue(expression.value),
      });
    } else if (expression instanceof ast.PropertyAccess) {
      instructions.push(
        ...this.compile_expression(expression.object),
      );
      instructions.push({
        type: "AccessProperty",
        name: expression.name,
      });
    } else if (expression instanceof ast.ObjectLiteral) {
      instructions.push({
        type: "Push",
        value: new ObjectValue({}),
      });
      for (const property of expression.properties) {
        instructions.push(
          ...this.compile_expression(property.value),
        );
        instructions.push({
          type: "DefineProperty",
          name: property.name,
        });
      }
    } else if (expression instanceof ast.ChannelReceive) {
      instructions.push(
        ...this.compile_expression(expression.channel),
      );
      instructions.push({ type: "ChannelReceive" });
    } else if (expression instanceof ast.NumberLiteral) {
      instructions.push({
        type: "Push",
        value: new NumberValue(expression.value),
      });
    } else if (expression instanceof ast.NilLiteral) {
      instructions.push({
        type: "Push",
        value: new Nil(),
      });
    }
    return instructions;
  }
}
