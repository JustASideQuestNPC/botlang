/* ----- src/bot-lang/libraries/turtle.ts ----- */
const BL_StdLib_Turtle: BL_LibraryDefinition = {
    name: "Robot",
    functions: {
        getMoveSpeed: {
            fn() {
                return Turtle.getMoveSpeed();
            }
        },
        setMoveSpeed: {
            argTypes: ["number"],
            fn(speed: number) {
                Turtle.setMoveSpeed(speed);
            }
        },
        resetAll: {
            fn() {
                Turtle.resetAll();
            }
        },
        goHome: {
            fn() {
                Turtle.resetPosition();
            }
        },
        resetPen: {
            fn() {
                Turtle.resetPen();
            }
        },
        clearCanvas: {
            fn() {
                Turtle.clearCanvas();
            }
        },
        getX: {
            fn() {
                return Turtle.getPos().x;
            }
        },
        getY: {
            fn() {
                return Turtle.getPos().y;
            }
        },
        setPos: {
            argTypes: ["number", "number"],
            fn(x: number, y: number) {
                Turtle.setPos(x, y);
            }
        },
        moveFwd: {
            argTypes: ["number"],
            fn(distance: number) {
                Turtle.moveFwd(distance);
            },
        },
        getAngle: {
            fn() {
                return Turtle.getAngle();
            }
        },
        setAngle: {
            argTypes: ["number"],
            fn(angle: number) {
                Turtle.setAngle(angle);
            }
        },
        rotate: {
            argTypes: ["number"],
            fn(angle: number) {
                Turtle.rotate(angle);
            }
        },
        show: {
            fn() {
                Turtle.show();
            }
        },
        hide: {
            fn() {
                Turtle.hide();
            }
        },
        penUp: {
            fn() {
                Turtle.penUp();
            }
        },
        penDown: {
            fn() {
                Turtle.penDown();
            }
        },
        setColor: {
            fn(c: number) {
                // edge case for if you try to use a css color with this function
                if (typeof c === "string") {
                    throw new BL_Common.TypeError(
                        `setColor sets the draw color using a number or color constant. To set ` +
                        `it using a CSS string, use setColorCSS instead.`
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
            }
        },
        setColorCSS: {
            fn(c: string) {
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
            }
        },
        setLineThickness: {
            fn(thickness: number) {
                Turtle.setLineThickness(thickness);
            }
        },
        beginPoly: {
            fn() {
                Turtle.beginPoly();
            }
        },
        endPoly: {
            fn() {
                Turtle.endPoly();
            }
        },
        dropVertex: {
            fn() {
                Turtle.dropVertex();
            }
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
        COLOR_PINK: 11,
        CANVAS_WIDTH: 600,
        CANVAS_HEIGHT: 600
    },
};

/* ----- end of file ----- */