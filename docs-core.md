# Botlang Core
Botlang's syntax is generally similar to Javascript, so it should be relatively easy to pick up if you're familiar with the latter. If something isn't covered in this section, you can assume that it behaves the same as in JS (if it doesn't, go bug NPC about it).

### Basics
- Semicolons are required at the end of all statements.
- All variables are declared using `var`.
- There are no multiline comments.
- To print something to the console, use `print foo;`. Parentheses are not required.

### Data and Operators
There are several changes to data and operators in Botlang:
- `null` is replaced with `nil`.
- Strings can be declared using single quotes (`'str'`) or double quotes (`"str"`). Like in JS, they can be added together using `+`, have a `.length` property, and can be indexed (`str[0]`).
- `&&` and `||` are replaced with `and` and `or`.
- There is no `++` or `--`. Use `+=` and `-=` instead.
- In addition to the standard operators, there are two new ones:
    - The `^` operator raises a number to some power. `3 ^ 2` returns 3 squared (**9**), `3 ^ 3` returns 3 cubed (**27**), and so on.
    - The `%%` operator behaves like the `%` operator, but always returns a positive value. For example, `-13 % 64` will return **-13**, whereas `-13 %% 64` will return **51**.

### Functions
Like in JS, functions are declared using `function`:
```js
function foo() {
    print "foo";
    return "bar";
}

var bar = foo();
```
Any function that does not return a value using `return` will automatically return `nil`. Botlang does not support anonymous functions (`var foo = function() {};`).

### Control Flow
Loops and conditionals in Botlang are also the same as in JS:
```js
if (foo > 0) {
    bar();
}
else if (foo < 0) {
    fizz();
}
else {
    buzz():
}

for (var i = 0; i < 10; i += 1) {
    bar();
}

while (foo) {
    bar();
}
```
Loops and conditionals **do not** have to be followed by a block:
```js
if (foo > 0) bar();
else if (foo < 0) fizz();
else buzz();

for (var i = 0; i < 10; i += 1) bar();
while (foo) bar();
```

### Arrays
Arrays can declared using an initializer list. They can also be created using `Array(n)`, which will return an array of length `n` where all elements are `nil`:
```js
var foo = [1, 2, 3, 4];
var bar = Array(4); // [nil, nil, nil, nil]
```

Arrays can be indexed using square brackets. **Negative values index from the back.** They have a `.length` property and the `push`, `pop`, `shift`, and `unshift` methods, which behave the same as in JS:
```js
var foo = ["a", "b"];
var bar = foo.length; // bar = 2
bar = foo[0]; // bar = "a";
bar = foo[-1]; // bar = "b";
bar = foo.push("c"); // bar = 3, foo = ["a", "b", "c"]
bar = foo.pop(); // bar = "buzz", foo = ["a", "b"]
bar = foo.unshift("c"); // bar = 3, foo = ["c", "a", "b"]
bar = foo.shift(); // bar = "c", foo = ["a", "b"]
```

### Classes
To define a class, use `class Foo {}` and place any methods inside the block. Other properties do not need to be part of the class definition, and can be created within methods at will.
```js
class Foo {
    foo() {
        print "foo";
    }
    bar(x) {
        this.bar = x;
    }
}
```
**Note:** All classes have the `hasProperty` method. It takes a string and returns whether the class has a property or method with that name.

To create instances of a class, call the name of the class like a function. Do not use `new`:
```js
var foo = Foo();
foo.foo();
foo.bar(1);
```

If a class has an `init` method, it will function as a constructor:
```js
class Foo {
    init(x, y) {
        this.bar = [x, y];
    }
}

var foo = Foo(1, 2);
```