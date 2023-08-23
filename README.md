#goroutines-in-ts

Minimal implementation of goroutines aka stackful, non-first-class, asymmetric
coroutines in typescript. I copied the example code for the hypothetical
language from [this](https://abhinavsarkar.net/posts/implementing-co-3/) blog
post, although the implementation is vastly different. It uses a custom
instruction format, it's not compact as bytecode but it is enough to implement a
stack machine. Coroutines are represented with `Fiber` and `StackFrame` because
fiber sounds cooler. Each time we yield we add the current executing to a queue.
Because i want to experiment quickly and don't want to bother with syntax, i
didn't write a parser.

To run a program:
`deno run --allow-read main.ts path/to/the/program`
