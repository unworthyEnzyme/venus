# venus

A language with go style coroutines and channels.

## To run a program:

`deno run --allow-read main.ts path/to/the/program`

## Sneak peek

```
let print_numbers = fun(start, end) {
    let i = start;
    while i < end + 1 {
        print i;
        yield;
        i = i + 1;
    }
};
spawn print_numbers(1, 4);
print_numbers(11, 16);
```

To see other examples, go to the `/examples` folder.

## Syntax

### Variables

```
let a = 42;
```

### Literals

```
let numbers = 42;
let strings = "hello";
let booleans = true;
let objects = {
    x: 2,
    y: 3
};
```

### Control Flow

```
if x < y {
  print "x is smaller";
} else {
  print "y is smaller or equal";
}
```

```
while true {
    yield;
}
```

### Functions

There are two ways of defining a function, one is globally visible and a statement:

```
function fib(n) {
    if n < 2 {
        return n;
    } else {
        return fib(n - 1) + fib(n - 2);
    }
}
```

Another is an expression and anonymous:

```
let lambda = |x| {
    print x;
}
```

### Operators

By increasing precedence:

-   Boolean: <, >, <=, >=
-   Numeric: +, -
-   Member access: . (e.g `object.x`)

### Coroutines

A coroutine is started via `spawn` keywords. It works just like goroutines.

```
let print_numbers = |start, end| {
    let i = start;
    while i < end + 1 {
        print i;
        yield;
        i = i + 1;
    }
};
spawn print_numbers(1, 4);
print_numbers(11, 16);
```

### Channels

The syntax is just like Go's.

```
let sender = |message_channel| {
    message_channel <- 42;
};
let message_channel = Channel(0);
spawn sender(message_channel);
let message = <-message_channel;
print message;
```

### IO

We only support reading and writing to the stdio.

```
let input = prompt("Enter a message: ")
print input;
```

## References
- [Implementing Co](https://abhinavsarkar.net/posts/implementing-co-1/): I highly recommend this blog post. It's an excellent read. I used it to understand the concepts more and the example at `/examples/coroutines.vs` is taken from this blog post.
