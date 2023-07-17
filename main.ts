import { Statement } from "./ast.ts";
import { VM } from "./vm.ts";

if (import.meta.main) {
  //This example code is shamelessly copied from https://abhinavsarkar.net/posts/implementing-co-3/
  // fun print_numbers(start, end) {
  //     let i = start
  //     while (i < end + 1) {
  //         println i
  //         yield
  //         i = i + 1
  //     }
  // }

  // spawn print_numbers(1, 4)
  // print_numbers(11, 16)

  const program: Statement[] = [
    {
      type: "FunctionDeclarationStatement",
      name: "print_numbers",
      parameters: ["start", "end"],
      body: [
        {
          type: "VariableDeclarationStatement",
          name: "i",
          initializer: {
            type: "IdentifierExpression",
            name: "start",
          },
        },
        {
          type: "WhileStatement",
          condition: {
            type: "BinaryExpression",
            operator: "LessThan",
            left: {
              type: "IdentifierExpression",
              name: "i",
            },
            right: {
              type: "BinaryExpression",
              operator: "Add",
              left: {
                type: "IdentifierExpression",
                name: "end",
              },
              right: {
                type: "NumberLiteralExpression",
                value: 1,
              },
            },
          },
          body: [
            {
              type: "PrintStatement",
              expression: {
                type: "IdentifierExpression",
                name: "i",
              },
            },
            { type: "YieldStatement" },
            {
              type: "AssignmentStatement",
              name: "i",
              value: {
                type: "BinaryExpression",
                operator: "Add",
                left: {
                  type: "IdentifierExpression",
                  name: "i",
                },
                right: {
                  type: "NumberLiteralExpression",
                  value: 1,
                },
              },
            },
          ],
        },
      ],
    },
    {
      type: "SpawnStatement",
      spawnee: {
        type: "IdentifierExpression",
        name: "print_numbers",
      },
      args: [
        { type: "NumberLiteralExpression", value: 1 },
        { type: "NumberLiteralExpression", value: 4 },
      ],
    },
    {
      type: "ExpressionStatement",
      expression: {
        type: "CallExpression",
        callee: {
          type: "IdentifierExpression",
          name: "print_numbers",
        },
        args: [
          {
            type: "NumberLiteralExpression",
            value: 11,
          },
          {
            type: "NumberLiteralExpression",
            value: 16,
          },
        ],
      },
    },
  ];

  // fun sender(message_channel) {
  //     message_channel <- 42
  // }

  // let message_channel = new_channel()
  // spawn sender(message_channel)
  // let message = <-message_channel
  // println message
  const program2: Statement[] = [
    {
      type: "FunctionDeclarationStatement",
      name: "sender",
      parameters: ["message_channel"],
      body: [
        {
          type: "ChannelSendStatement",
          channel: {
            type: "IdentifierExpression",
            name: "message_channel",
          },
          value: {
            type: "NumberLiteralExpression",
            value: 42,
          },
        },
      ],
    },
    {
      type: "VariableDeclarationStatement",
      name: "message_channel",
      initializer: {
        type: "CallExpression",
        callee: {
          type: "IdentifierExpression",
          name: "new_channel",
        },
        args: [],
      },
    },
    {
      type: "SpawnStatement",
      spawnee: {
        type: "IdentifierExpression",
        name: "sender",
      },
      args: [
        {
          type: "IdentifierExpression",
          name: "message_channel",
        },
      ],
    },
    {
      type: "VariableDeclarationStatement",
      name: "message",
      initializer: {
        type: "ChannelReceiveExpression",
        channel: {
          type: "IdentifierExpression",
          name: "message_channel",
        },
      },
    },
    {
      type: "PrintStatement",
      expression: {
        type: "IdentifierExpression",
        name: "message",
      },
    },
  ];

  const vm = new VM();
  vm.run(program2);
}
