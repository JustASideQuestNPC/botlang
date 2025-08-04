/* ----- src/bot-lang/class.ts ----- */

/** Definition and method container for a user-defined class. */
class BL_Class implements BL_Callable {
    name: string;
    superClass: BL_Class;
    methods: { [key: string]: BL_UserFunction | BL_StdMethod } = {
        "hasProperty": new BL_StdMethod(
            "hasProperty", 1, (instance, name: string) => {
                if (typeof name !== "string") {
                    throw new BL_Common.TypeError(
                        `Property name must be a string (recieved ${BL_Common.valueToString(name)})`
                    );
                }
                return instance.hasProperty(name);
            }
        )
    };

    // hack to make constructor arguments work
    get numArgs() { 
        if (this.methods["init"]) {
            return this.methods["init"].numArgs;
        }
        return 0;
    }

    constructor(name: string, superClass: BL_Class, methods: { [key: string]: BL_UserFunction }) {
        this.name = name;
        this.superClass = superClass;
        // add methods one by one to not overwrite standard methods
        for (const [key, method] of Object.entries(methods)) {
            this.methods[key] = method;
        }
    }

    async call(args: BL_Common.DataTypeUnion[]): Promise<BL_Common.DataTypeUnion> {
        const instance = new BL_Instance(this);
        // defining an "init" method for a class makes it the constructor
        const initializer = this.findMethod("init");
        if (initializer) {
            await initializer.bind(instance).call(args);
        }

        return instance;
    }

    findMethod(name: string): BL_UserFunction | BL_StdMethod {
        if (this.methods[name]) { return this.methods[name]; }

        // if the method doesn't exist on this class, check the superclass if we have one
        if (this.superClass) {
            return this.superClass.findMethod(name);
        }

        return null;
    }

    toString(): string {
        return `<class ${this.name}>`
    }
}

/** Instance of a user-defined class. */
class BL_Instance {
    private parent: BL_Class;
    private fields: { [key: string]: BL_Common.DataTypeUnion } = {};

    constructor(parent: BL_Class) {
        this.parent = parent;
    }

    get(name: string): BL_Common.DataTypeUnion {
        // check for a variable
        if (this.fields[name]) { return this.fields[name]; }

        // check for a method
        const method = this.parent.findMethod(name);
        if (method !== null) { return method.bind(this); }

        throw new BL_Common.RuntimeError(`Undefined property "${name}"`);
    }

    set(name: string, value: BL_Common.DataTypeUnion) {
        this.fields[name] = value;
    }

    toString(): string {
        return `<instance of ${this.parent.name}>`
    }

    // this is called through a standard method on BL_Class
    hasProperty(name: string) {
        // check for a field
        if (this.fields[name] !== undefined) { return true; }
        // check for a method
        return (this.parent.findMethod(name) !== null);
    }
}

/* ----- end of file ----- */