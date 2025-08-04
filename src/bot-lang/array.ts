/* ----- src/bot-lang/array.ts ----- */

/** Method container for a user-defined array. */
class BL_Array extends BL_Class {
    methods: { [key: string]: BL_UserFunction | BL_StdMethod } = {
        "hasProperty": new BL_StdMethod(
            "hasProperty", 1, (instance, name: string) => {
                if (typeof name !== "string") {
                    throw new BL_Common.TypeError(
                        `Property name must be a string (recieved ` +
                        `${BL_Common.valueToString(name)}).`
                    );
                }
                return instance.hasProperty(name);
            }
        ),
        "init": new BL_StdMethod(
            "init", 1, (instance, length: number) => {
                if (typeof length !== "number") {
                    throw new BL_Common.TypeError(
                        `Array length must be a string (recieved ` +
                        `${BL_Common.valueToString(length)}).`
                    );
                }
                console.warn(
                    '"Array(n)" creates an array of length n, did you mean to use an initializer ' +
                    'list instead?'
                );
                (instance as BL_ArrayInstance).items = Array(length).fill(null);
            }
        ),
        "push": new BL_StdMethod(
            "push", 1, (instance, item: BL_Common.DataTypeUnion) => {
                return (instance as BL_ArrayInstance).items.push(item);
            }
        ),
        "pop": new BL_StdMethod(
            "pop", 0, (instance) => {
                return (instance as BL_ArrayInstance).items.pop();
            }
        ),
        "unshift": new BL_StdMethod(
            "unshift", 0, (instance, item: BL_Common.DataTypeUnion) => {
                return (instance as BL_ArrayInstance).items.unshift(item);
            }
        ),
        "shift": new BL_StdMethod(
            "shift", 0, (instance) => {
                return (instance as BL_ArrayInstance).items.shift();
            }
        ),
    };

    get numArgs() {
        return 1;
    }

    // override call exclusively because it needs to return an array instance
    async call(args: BL_Common.DataTypeUnion[]): Promise<BL_Common.DataTypeUnion> {
        const instance = new BL_ArrayInstance(this, []);
        // defining an "init" method for a class makes it the constructor
        const initializer = this.findMethod("init");
        if (initializer) {
            await initializer.bind(instance).call(args);
        }

        return instance;
    }
}

/** A user-defined array. */
class BL_ArrayInstance extends BL_Instance {
    items: BL_Common.DataTypeUnion[];

    constructor(parent: BL_Class, items: BL_Common.DataTypeUnion[]) {
        super(parent);
        this.items = items;
    }

    /**
     * Returns an item at an index. Negative numbers index from the rear of the array. If the index
     * is out of range, a `BL_Common.RangeError` is thrown.
     */
    indexGet(i: number): BL_Common.DataTypeUnion {
        if (i < -this.items.length || i >= this.items.length) {
            throw new BL_Common.RangeError(
                `Array index out of range (recieved index ${i} but array only has ` +
                `${this.items.length} items).`
            );
        }

        // negative numbers index from the rear
        if (i < 0) {
            return this.items[this.items.length + i];
        }
        return this.items[i];
    }

    /**
     * Sets an item at an index. Negative numbers index from the rear of the array. If the index is
     * out of range, a `BL_Common.RangeError` is thrown.
     */
    indexSet(i: number, value: BL_Common.DataTypeUnion) {
        if (i < -this.items.length || i >= this.items.length) {
            throw new BL_Common.RangeError(
                `Array index out of range (recieved index ${i} but array only has ` +
                `${this.items.length} items).`
            );
        }

        // negative numbers index from the rear
        if (i < 0) {
            this.items[this.items.length + 1] = value;
        }
        this.items[i] = value;
    }

    get(name: string): BL_Common.DataTypeUnion {
        if (name === "length") { return this.items.length; }
        return super.get(name);
    }

    // make all array properties read-only
    set(name: string, value: BL_Common.DataTypeUnion): void {
        if (name === "length") {
            throw new BL_Common.RuntimeError("Array length is read-only.");
        }
        throw new BL_Common.RuntimeError("Properties cannot be added to arrays.");
    }

    toString() {
        const itemStrings = this.items.map(i => BL_Common.valueToString(i));
        return `[${itemStrings.join(", ")}]`;
    }
}

/* ----- end of file ----- */