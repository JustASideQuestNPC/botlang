/* ----- src/bot-lang/libraries/math.ts ----- */

const BL_StdLib_Math: BL_Library = (()=>{
    /** Converts an angle from degrees to radians. */
    function degToRad(angle: number): number {
        return angle * Math.PI / 180;
    }
    /** Converts an angle from radians to degrees. */
    function radToDeg(angle: number): number {
        return angle * 180 / Math.PI;
    }

    return {
        functions: {
            sin(n: number) {
                if (typeof n !== "number") {
                    throw new BL_Common.TypeError(
                        `sin() expects a number but recieved ${BL_Common.valueToString(n)}).`
                    );
                }

                // native sin() is always in radians
                return radToDeg(Math.sin(degToRad(n)));
            },
            cos(n: number) {
                if (typeof n !== "number") {
                    throw new BL_Common.TypeError(
                        `cos() expects a number but recieved ${BL_Common.valueToString(n)}).`
                    );
                }

                // native sin() is always in radians
                return radToDeg(Math.cos(degToRad(n)));
            },
            tan(n: number) {
                if (typeof n !== "number") {
                    throw new BL_Common.TypeError(
                        `tan() expects a number but recieved ${BL_Common.valueToString(n)}).`
                    );
                }

                // native sin() is always in radians
                return radToDeg(Math.tan(degToRad(n)));
            }
        },
        variables: {
            PI: Math.PI,
            E: Math.E
        }
    }
})();

/* ----- end of file ----- */