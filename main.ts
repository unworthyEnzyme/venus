import { Statement } from "./ast.ts";
import {
  assignment,
  binary,
  call,
  channel_receive,
  channel_send,
  expression_statement,
  fun,
  identifier,
  lambda,
  number,
  object,
  print,
  property_access,
  spawn,
  string,
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
    fun("print_numbers", ["start", "end"], [
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
  //   message_channel <- 42
  // }
  // let message_channel = new_channel(0)
  // spawn sender(message_channel)
  // let message = <-message_channel
  // println message
  const channels_showcase: Statement[] = [
    fun("sender", ["message_channel"], [
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

  // let obj = {
  //   foo: 12,
  //   bar: {
  //     baz: 2
  //   },
  //   f: fun(x) {
  //     print x
  //   }
  // }

  // print obj.foo
  // print obj.bar.baz
  // obj.f(42)
  const object_showcase: Statement[] = [
    variable_declaration(
      "obj",
      object([
        { name: "foo", value: number(12) },
        {
          name: "bar",
          value: object([{ name: "baz", value: number(2) }]),
        },
        {
          name: "f",
          value: lambda(["x"], [print(identifier("x"))]),
        },
      ]),
    ),
    print(property_access(identifier("obj"), "foo")),
    print(property_access(property_access(identifier("obj"), "bar"), "baz")),
    expression_statement(
      call(property_access(identifier("obj"), "f"), [number(42)]),
    ),
  ];
  const vm = new VM();
  vm.run(coroutines_showcase);
}
