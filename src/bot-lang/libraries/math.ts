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
            abs: {
                argTypes: ["number"],
                fn(n: number) {
                    return Math.abs(n);
                }
            },
            acos: {
                argTypes: ["number"],
                fn(n: number) {
                    // native sin() is always in radians
                    return radToDeg(Math.acos(degToRad(n)));
                }
            },
            asin: {
                argTypes: ["number"],
                fn(n: number) {
                    // native sin() is always in radians
                    return radToDeg(Math.asin(degToRad(n)));
                }
            },
            atan: {
                argTypes: ["number"],
                fn(n: number) {
                    // native sin() is always in radians
                    return radToDeg(Math.atan(degToRad(n)));
                }
            },
            ceil: {
                argTypes: ["number"],
                fn(n: number) {
                    return Math.ceil(n);
                }
            },
            cos: {
                argTypes: ["number"],
                fn(n: number) {
                    // native sin() is always in radians
                    return radToDeg(Math.cos(degToRad(n)));
                }
            },
            floor: {
                argTypes: ["number"],
                fn(n: number) {
                    return Math.floor(n);
                }
            },
            ln: {
                argTypes: ["number"],
                fn(n: number) {
                    return Math.log(n);
                }
            },
            log: {
                argTypes: ["number"],
                fn(n: number) {
                    return Math.log10(n);
                }
            },
            random: {
                fn() {
                    return Math.random();
                }
            },
            root: {
                argTypes: ["number"],
                fn(n: number, root: number) {
                    return Math.pow(n, 1 / root);
                }
            },
            round: {
                argTypes: ["number"],
                fn(n: number) {
                    return Math.round(n);
                }
            },
            sin: {
                argTypes: ["number"],
                fn(n: number) {
                    // native sin() is always in radians
                    return radToDeg(Math.sin(degToRad(n)));
                }
            },
            sqrt: {
                argTypes: ["number"],
                fn(n: number) {
                    return Math.sqrt(n);
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
            TWO_PI: Math.PI * 2,
            HALF_PI: Math.PI / 2,
            THREE_HALVES_PI: Math.PI * 3 / 2,
            E: Math.E,
        }
    } as BL_LibraryDefinition;
})();

/* ----- end of file ----- */