let obj = {
  foo: 12,
  bar: {
    baz: 2
  },
  f: |x| {
    print x;
  }
};

print obj.foo;
print obj.bar.baz;
obj.f(42);
