/* ----- src/bot-lang/libraries/math.ts ----- */

const BL_StdLib_Math: BL_LibraryDefinition = (()=>{
    /** Converts an angle from degrees to radians. */
    function degToRad(angle: number): number {
        return angle * Math.PI / 180;
    }
    /** Converts an angle from radians to degrees. */
    function radToDeg(angle: number): number {
        return angle * 180 / Math.PI;
    }

    return {
        name: "Math",
        functions: {
            sin: {
                argTypes: ["number"],
                fn(n: number) {
                    // native sin() is always in radians
                    return radToDeg(Math.sin(degToRad(n)));
                }
            },
            cos: {
                argTypes: ["number"],
                fn(n: number) {
                    // native sin() is always in radians
                    return radToDeg(Math.cos(degToRad(n)));
                }
            },
            tan: {
                argTypes: ["number"],
                fn(n: number) {
                    // native sin() is always in radians
                    return radToDeg(Math.tan(degToRad(n)));
                }
            },
        },
        variables: {
            PI: Math.PI,
            E: Math.E
        }
    } as BL_LibraryDefinition;
})();

/* ----- end of file ----- */