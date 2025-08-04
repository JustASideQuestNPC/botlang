/* ----- src/utils/misc.ts ----- */

/**
 * Represents an error caused when an argument is of the correct type but still invalid for some
 * other reason.
 */
class InvalidArgumentError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "InvalidArgumentError";
    }
};

/** Converts an angle from degrees to radians. */
function degToRad(angle: number): number {
    return angle * Math.PI / 180;
}
/** Converts an angle from radians to degrees. */
function radToDeg(angle: number): number {
    return angle * 180 / Math.PI;
}

/* ----- end of file ----- */