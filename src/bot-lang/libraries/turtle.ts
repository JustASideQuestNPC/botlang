/* ----- src/bot-lang/libraries/turtle.ts ----- */

function validateArgs(functionName: string, expected: ("number" | "string" | "boolean")[], 
                      values: BL_Common.DataTypeUnion[]) {
    
    for (let i = 0; i < values.length; ++i) {
        if (typeof values[i] !== expected[i]) {
            const expectedTypes = expected.join(", ");
            const valueString = values.map((i) => BL_Common.valueToString(i)).join(", ");
            throw new BL_Common.TypeError(
                `Invalid argument type(s) to ${functionName}: Expected (${expectedTypes}), but ` +
                `recieved (${valueString}).`
            );
        }
    }
}

const BL_StdLib_Turtle: BL_Library = {
    functions: {
        getMoveSpeed() {
            return Turtle.getMoveSpeed();
        },
        setMoveSpeed(speed: number) {
            validateArgs("setMoveSpeed", ["number"], [speed]);
            Turtle.setMoveSpeed(speed);
        },
        resetAll() {
            Turtle.resetAll();
        },
        goHome() {
            Turtle.resetPosition();
        },
        resetPen() {
            Turtle.resetPen();
        },
        clearCanvas() {
            Turtle.clearCanvas();
        },
        getX() {
            return Turtle.getPos().x;
        },
        getY() {
            return Turtle.getPos().y;
        },
        setPos(x: number, y: number) {
            validateArgs("setPos", ["number", "number"], [x, y]);
            Turtle.setPos(x, y);
        },
        moveFwd(distance: number) {
            validateArgs("moveFwd", ["number"], [distance]);
            Turtle.moveFwd(distance);
        },
        getAngle() {
            Turtle.getAngle();
        },
        setAngle(angle: number) {
            validateArgs("setAngle", ["number"], [angle]);
            Turtle.setAngle(angle);
        },
        rotate(angle: number) {
            validateArgs("rotate", ["number"], [angle]);
            Turtle.rotate(angle);
        },
        showRobot() {
            Turtle.show();
        },
        hideRobot() {
            Turtle.hide();
        },
        isHidden() {
            Turtle.isHidden();
        },
        penUp() {
            Turtle.penUp();
        },
        penDown() {
            Turtle.penDown();
        },
        setColor(c: number) {
            // edge case for if you try to use a css color with this function
            if (typeof c === "string") {
                throw new BL_Common.TypeError(
                    `setColor sets the draw color using a number or color constant. To set it ` +
                    `using a CSS string, use setColorCSS instead.`
                );
            }
            else if (typeof c !== "number") {
                throw new BL_Common.TypeError(
                    `Invalid argument type(s) to setColor: Expected (number), but recieved ` +
                    `(${BL_Common.valueToString(c)}).`
                );
            }

            // colors must be integers
            if (c % 1 !== 0) {
                throw new BL_Common.TypeError("Colors must be integer numbers.");
            }

            Turtle.setColor(c);
        },
        setColorCSS(c: string) {
            // edge case for if you try to use a number with this function
            if (typeof c === "number") {
                throw new BL_Common.TypeError(
                    `setColorCSS sets the draw color using a CSS string. To set it using a` +
                    `number or color constant, use setColor instead.`
                );
            }
            else if (typeof c !== "string") {
                throw new BL_Common.TypeError(
                    `Invalid argument type(s) to setColor: Expected (number), but recieved ` +
                    `(${BL_Common.valueToString(c)}).`
                );
            }

            Turtle.setColor(c);
        },
        setLineThickness(thickness: number) {
            validateArgs("setLineThickness", ["number"], [thickness]);
            Turtle.setLineThickness(thickness);
        },
        beginPoly() {
            Turtle.beginPoly();
        },
        endPoly() {
            Turtle.endPoly();
        },
        dropVertex() {
            Turtle.dropVertex();
        }
    },
    variables: {
        // color constants
        COLOR_BLACK: 0,
        COLOR_GRAY: 1,
        COLOR_WHITE: 2,
        COLOR_RED: 3,
        COLOR_ORANGE: 4,
        COLOR_YELLOW: 5,
        COLOR_GREEN: 6,
        COLOR_CYAN: 7,
        COLOR_SKY: 8,
        COLOR_BLUE: 9,
        COLOR_PURPLE: 10,
        COLOR_PINK: 11
    },
};

/* ----- end of file ----- */