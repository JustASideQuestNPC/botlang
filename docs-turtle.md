# Robot
All functions and constants for controlling the robot are defined on the `Robot` object.

## Constants
### Colors
The 12 color constants correspond to the 12 preset colors that can be used in `Robot.setColor()`. They are integers from 0-11, in the following order:
- `Robot.COLOR_BLACK = 0`
- `Robot.COLOR_GRAY = 1`
- `Robot.COLOR_WHITE = 2`
- `Robot.COLOR_RED = 3`
- `Robot.COLOR_ORANGE = 4`
- `Robot.COLOR_YELLOW = 5`
- `Robot.COLOR_GREEN = 6`
- `Robot.COLOR_CYAN = 7`
- `Robot.COLOR_SKY = 8`
- `Robot.COLOR_BLUE = 9`
- `Robot.COLOR_PURPLE = 10`
- `Robot.COLOR_PINK = 11`

### Other
- `Robot.CANVAS_WIDTH = 600`: The width of the drawing canvas.
- `Robot.CANVAS_HEIGHT = 600`: The height of the drawing canvas.

## Functions
### getMoveSpeed
Returns the robot's current movement speed in pixels per second. The default movement speed is **250** pixels per second, and can be changed using `Robot.setMoveSpeed()`.
#### Syntax
```js
Robot.getMoveSpeed(): number
```

### setMoveSpeed
Sets the robot's current movement speed in pixels per second. Setting the speed to 0 or a negative number will make the robot move instantly without animating. The default movement speed is **250** pixels per second.
#### Syntax
```js
Robot.setMoveSpeed(number)
```

### resetAll
Resets the robot's position, rotation, color, and line thickness, and clears all drawn shapes. This function is equivalent to calling `Robot.goHome()`, `Robot.resetPen()`, `Robot.clearCanvas()`, an `Robot.setMoveSpeed(250)` at the same time.
#### Syntax
```js
Robot.resetAll()
```

### goHome
Resets the robot's position and rotation angle to their default values. The default position is (300, 300), which is the center of the canvas. The default angle is **0**, which points straight up.
#### Syntax
```js
Robot.goHome()
```

### resetPen
Resets the robot's line thickness and drawing color, and finishes a polygon if one is being drawn. The default line thickness is **1** pixel. The default drawing color is **solid black**, which is equivalent to `Robot.COLOR_BLACK` or `#000000`.
#### Syntax
```js
Robot.resetPen()
```

### clearCanvas
Removes everything that has been drawn so far.
#### Syntax
```js
Robot.clearCanvas()
```

### getX
Returns the robot's current x coordinate. The default x coordinate is **300**, which is the center of the canvas.
#### Syntax
```js
Robot.getX(): number
```

### getY
Returns the robot's current y coordinate. The default y coordinate is **300**, which is the center of the canvas.
#### Syntax
```js
Robot.getY(): number
```

### setPos
Sets the robot's current x and y position. The default position is **(300, 300)**, which is the center of the canvas.
#### Syntax
```js
Robot.setPos(number, number)
```

### moveFwd
Moves the robot forward by some distance (measured in pixels). If the pen is down and a polygon is not being drawn, the robot will draw a line behind it as it moves.
#### Syntax
```js
Robot.moveFwd(number)
```

### getAngle
Returns the robot's current rotation angle in degrees. The rotation angle is always between 0 and 360, where 0 points straight up. The robot's default angle is **0**.
#### Syntax
```js
Robot.getAngle(): number
```

### setAngle
Sets the robot's current rotation angle in degrees. The default angle is **0**, which points straight up.
#### Syntax
```js
Robot.setAngle(number)
```

### rotate
Rotates the robot by some angle (measured in degrees). Positive angles rotate clockwise and negative angles rotate counterclockwise.
#### Syntax
```js
Robot.rotate(number)
```

### hide
Hides the robot's sprite. This does not affect whether it draws things while moving.
#### Syntax
```js
Robot.hide()
```

### show
Shows the robot's sprite. This does not affect whether it draws things while moving.
#### Syntax
```js
Robot.show()
```

### penUp
Lifts the pen. While the pen is up, the robot does not draw anything while moving. *This function does nothing while a polygon is being drawn.*
#### Syntax
```js
Robot.penUp()
```

### penDown
Lowers the pen. While the pen is down, the robot draws lines whenever it moves.
#### Syntax
```js
Robot.penDown()
```

### setColor
Sets the drawing color using one of the 12 color constants. Alternatively, the color can be set using any integer number (numbers < 0 or > 11 will "wrap around" to the start or end of this range). The default drawing color is **solid black**, which is equivalent to `Robot.COLOR_BLACK` or `#000000`. *This function does nothing while a polygon is being drawn.*

To set the drawing color using a CSS string, use `Robot.setColorCSS()` instead.
#### Syntax
```js
Robot.setColor(number)
```

### setColorCSS
Sets the drawing color using a CSS string (formatted as `#rrggbb` or `#rrggbbaa`). There is no built-in color picker in the editor (yet...), but googling "color picker" will show you one without requiring an external webside. The default drawing color is **solid black**, which is equivalent to `Robot.COLOR_BLACK` or `#000000`. *This function does nothing while a polygon is being drawn.*

To set the drawing color using a color constant or number, use `Robot.setColor()` instead.
#### Syntax
```js
Robot.setColorCSS(string)
```

### setLineThickness
Sets the thickness of drawn lines (this behaves like `strokeWeight()` in PJS). Setting the stroke weight to 0 or a negative number will cause nothing to be drawn. *This function does nothing while a polygon is being drawn.*
#### Syntax
```js
Robot.setLineThickness(number)
```

### beginPoly
Starts drawing a filled polygon. While drawing a polygon, the robot will never draw lines while moving forward, and `Robot.dropVertex()` can be used to add vertices to the polygon. The polygon's fill color is whatever the current drawing color is set to. ~~This function cannot be used while the pen is up or when a polygon is already being drawn.~~
#### Syntax
```js
Robot.beginPoly()
```

### endPoly
Finishes drawing the current polygon and re-enables line drawing. ~~This function cannot be used when a polygon is not being drawn.~~
#### Syntax
```js
Robot.endPoly()
```

### dropVertex
Adds a vertex to the current polygon, at the robot's current position. `Robot.beginPoly()` and `Robot.endPoly()` also drop a single vertex automatically. ~~This function cannot be used when a polygon is not being drawn.~~
#### Syntax
```js
Robot.dropVertex()
```