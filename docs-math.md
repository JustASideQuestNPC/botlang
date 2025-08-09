# Math
The `Math` object contains various math functions.

## Constants
- `Math.PI = 3.14159`: The ratio of the circumference of a circle to its diameter.
- `Math.TWO_PI = 6.28318`: Equivalent to `Math.PI * 2`.
- `Math.HALF_PI = 1.57080`: Equivalent to `Math.PI / 2`.
- `Math.THREE_HALVES_PI = 4.712385`: Equivalent to `Math.PI * 3 / 2`.
- `Math.E`: Euler's number, the base of natural logarithms.

## Functions
### abs
Returns the absolute value of a number.
#### Syntax
```ts
Math.abs(number): number;
```

### acos
Returns the inverse cosine (in degrees) of a number.
#### Syntax
```ts
Math.acos(number): number;
```

### asin
Returns the inverse sine (in degrees) of a number.
#### Syntax
```ts
Math.asin(number): number;
```

### atan
Returns the inverse tangent (in degrees) of a number.
#### Syntax
```ts
Math.atan(number): number;
```

### ceil
Returns the smallest integer greater than or equal to a number.
#### Syntax
```ts
Math.ceil(number): number;
```

### cos
Returns the cosine (in degrees) of a number.
#### Syntax
```ts
Math.(number): number;
```

### floor
Returns the smallest integer less than or equal to a number.
#### Syntax
```ts
Math.floor(number): number;
```

### ln 
Returns the natural logarithm of a number.
#### Syntax
```ts
Math.ln(number): number;
```

### log
Returns the base 10 logarithm of a number.
#### Syntax
```ts
Math.log(number): number;
```

### random 
Returns a random number between 0 and 1.
#### Syntax
```ts
Math.random(): number;
```

### root 
Returns the nth root of a number. `Math.root(n, 2)` returns the square root of n, `Math.root(n, 3)` returns the cube root of n, and so on. `Math.root(n, r)` is also equivalent to `n ^ (1 / r)`.
#### Syntax
```ts
Math.root(number, number): number;
```

### round 
Returns a number rounded to the nearest integer.
#### Syntax
```ts
Math.round(number): number;
```

### sin 
Returns the sine (in degrees) of a number.
#### Syntax
```ts
Math.sin(number): number;
```

### sqrt 
Returns the square root of a number. `Math.sqrt(n)` is also equivalent to `Math.root(n, 2)` or `n ^ (1 / 2)`.
#### Syntax
```ts
Math.sqrt(number): number;
```

### tan 
Returns the tangent (in degrees) of a number.
#### Syntax
```ts
Math.tangent(number): number;
```