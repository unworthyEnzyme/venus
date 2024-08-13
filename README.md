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
