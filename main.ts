import { Statement } from "./ast.ts";
import {
  assignment,
  binary,
  call,
  channel_receive,
  channel_send,
  expression_statement,
  function_,
  identifier,
  number,
  print,
  spawn,
  variable_declaration,
  while_,
  yield_,
} from "./ast_builder.ts";
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

  const coroutines_showcase: Statement[] = [
    function_("print_numbers", ["start", "end"], [
      variable_declaration("i", identifier("start")),
      while_(
        binary("<", identifier("i"), binary("+", identifier("end"), number(1))),
        [
          print(identifier("i")),
          yield_(),
          assignment("i", binary("+", identifier("i"), number(1))),
        ],
      ),
    ]),
    spawn(identifier("print_numbers"), [number(1), number(4)]),
    expression_statement(
      call(identifier("print_numbers"), [number(11), number(16)]),
    ),
  ];

  // fun sender(message_channel) {
  //     message_channel <- 42
  // }

  // let message_channel = new_channel(0)
  // spawn sender(message_channel)
  // let message = <-message_channel
  // println message
  // const channelsShowcase: Statement[] = [
  //   {
  //     type: "FunctionDeclarationStatement",
  //     name: "sender",
  //     parameters: ["message_channel"],
  //     body: [
  //       {
  //         type: "ChannelSendStatement",
  //         channel: {
  //           type: "IdentifierExpression",
  //           name: "message_channel",
  //         },
  //         value: {
  //           type: "NumberLiteralExpression",
  //           value: 42,
  //         },
  //       },
  //     ],
  //   },
  //   {
  //     type: "VariableDeclarationStatement",
  //     name: "message_channel",
  //     initializer: {
  //       type: "CallExpression",
  //       callee: {
  //         type: "IdentifierExpression",
  //         name: "new_channel",
  //       },
  //       args: [{ type: "NumberLiteralExpression", value: 1 }],
  //     },
  //   },
  //   {
  //     type: "SpawnStatement",
  //     spawnee: {
  //       type: "IdentifierExpression",
  //       name: "sender",
  //     },
  //     args: [
  //       {
  //         type: "IdentifierExpression",
  //         name: "message_channel",
  //       },
  //     ],
  //   },
  //   {
  //     type: "VariableDeclarationStatement",
  //     name: "message",
  //     initializer: {
  //       type: "ChannelReceiveExpression",
  //       channel: {
  //         type: "IdentifierExpression",
  //         name: "message_channel",
  //       },
  //     },
  //   },
  //   {
  //     type: "PrintStatement",
  //     expression: {
  //       type: "IdentifierExpression",
  //       name: "message",
  //     },
  //   },
  // ];

  const channels_showcase: Statement[] = [
    function_("sender", ["message_channel"], [
      channel_send(identifier("message_channel"), number(42)),
    ]),
    variable_declaration(
      "message_channel",
      call(identifier("new_channel"), [number(1)]),
    ),
    spawn(identifier("sender"), [identifier("message_channel")]),
    variable_declaration(
      "message",
      channel_receive(identifier("message_channel")),
    ),
    print(identifier("message")),
  ];

  const vm = new VM();
  vm.run(coroutines_showcase);
}
