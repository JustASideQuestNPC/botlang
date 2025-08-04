/* ----- src/turtle.ts ----- */

/** This is DEFINITELY a robot, and NOT an amphibious reptile with a pen. */
namespace Turtle {
    // object types for drawing everything onscreen
    interface Line {
        type: "line"; // for distinguishing between lines and polygons
        thickness: number;
        color: string;
        start: Vector2D;
        end: Vector2D;
    }
    interface Polygon {
        type: "polygon"; // for distinguishing between lines and polygons
        color: string;
        vertices: Vector2D[]
    }

    /** Array of default colors - this allows them to be cycled through using integer constants. */
    const BASE_COLORS = [
        "#000000",
        "#616178",
        "#ffffff",
        "#f54242",
        "#f57e42",
        "#f5dd42",
        "#78f542",
        "#42f59c",
        "#42d1f5",
        "#4245f5",
        "#aa42f5",
        "#f542dd",
    ];

    const DEFAULT_SPEED = 250;
    const DEFAULT_COLOR = "#000000";
    const DEFAULT_LINE_THICKNESS = 2;

    let renderTarget: p5 | p5.Graphics;

    let position = new Vector2D();
    let glidePos = new Vector2D(); // where the turtle is gliding to
    let heading = 0;
    let drawing = true; // whether the pen is up or down
    let hideSprite = false; // whether to show the turtle
    let currentColor = DEFAULT_COLOR;
    let lineThickness = DEFAULT_LINE_THICKNESS;
    let glideSpeed = DEFAULT_SPEED; // movement speed in pixels per second
    let gliding = false;

    let drawnShapes: (Line | Polygon)[] = [];
    let currentShape: (Line | Polygon) = null;
    let drawingPolygon = false;

    /** Draws a shape. */
    function drawShape(shape: Line | Polygon) {
        switch (shape.type) {
            case "line":
                renderTarget.stroke(shape.color);
                renderTarget.strokeWeight(shape.thickness);
                renderTarget.line(shape.start.x, shape.start.y, shape.end.x, shape.end.y);
                break;
            case "polygon":
                renderTarget.noStroke();
                renderTarget.fill(shape.color);
                renderTarget.beginShape();
                for (const v of shape.vertices) {
                    renderTarget.vertex(v.x, v.y);
                }
                renderTarget.endShape("close");
                break;
        }
    }

    /** Initializes the turtle. */
    export function init(p5: p5, rt?: p5.Graphics) {
        renderTarget = rt ?? p5;
        resetAll();
        clearCanvas();
    }

    /** Updates glide position. */
    export function updateGlide() {
        if (gliding) {
            // native delta time is in milliseconds
            const dt = Globals.p5.deltaTime / 1000;

            const moveDistance = glideSpeed * dt;
            // end the glide if we're close enough
            if (moveDistance > position.dist(glidePos)) {
                position.set(glidePos);

                if (currentShape) {
                    switch (currentShape.type) {
                        case "line":
                            currentShape.end.set(position);
                            break;
                        case "polygon":
                            currentShape.vertices[currentShape.vertices.length - 1]
                                        .set(this.position);
                            break;
                    }

                    if (currentShape.type === "line") {
                        drawnShapes.push(currentShape);
                        currentShape = null;
                    }
                }

                gliding = false;
                // unpause the interpreter
                if (BL_Interpreter.resumeExecution) {
                    BL_Interpreter.resumeExecution();
                }
            }
            // otherwise, keep going
            else {
                const moveAngle = glidePos.copy().sub(position).heading();
                position.add(Vector2D.fromPolar(moveAngle, moveDistance));

                // update shape positions for smooth drawing
                if (currentShape) {
                    switch (currentShape.type) {
                        case "line":
                            currentShape.end.set(position);
                            break;
                        case "polygon":
                            currentShape.vertices[currentShape.vertices.length - 1]
                                        .set(this.position);
                            break;
                    }
                }
            }
        }
    }

    /** Renders all drawn shapes and the turtle's sprite (if enabled). */
    export function render() {
        for (const shape of drawnShapes) {
            drawShape(shape);
        }

        // this is only used while gliding and drawing polygons
        if (currentShape) {
            drawShape(currentShape);
        }

        // draw the sprite
        if (!hideSprite) {
            renderTarget.stroke("#000000");
            renderTarget.strokeWeight(2);
            renderTarget.fill("#ffffff");

            renderTarget.push();
            // console.log(`(${this.position.x}, ${this.position.y})`);
            renderTarget.translate(position.x, position.y);
            renderTarget.rotate(heading + Math.PI / 2);
            renderTarget.triangle(
                 0, -10,
                 7,  10,
                -7,  10
            );
            renderTarget.pop();
        }
    }

    export function isGliding() {
        return gliding;
    }

    export function stopGlide() {
        gliding = false;
    }

    export function getMoveSpeed() {
        return glideSpeed;
    }

    export function setMoveSpeed(speed: number) {
        glideSpeed = speed;
    }

    // library functions
    export function resetAll() {
        resetPosition();
        resetPen();
        clearCanvas();
        glideSpeed = DEFAULT_SPEED;
    }

    export function resetPosition() {
        position.set(renderTarget.width / 2, renderTarget.height / 2);
        heading = -Math.PI / 2;
        hideSprite = false;
        gliding = false;
    }

    export function resetPen() {
        currentColor = DEFAULT_COLOR;
        lineThickness = DEFAULT_LINE_THICKNESS;
        if (drawingPolygon) {
            endPoly();
        }
        drawingPolygon = false;
        drawing = true;
        currentShape = null;
    }

    export function clearCanvas() {
        currentShape = null;
        drawingPolygon = false;
        drawnShapes = [];
    }

    export function getPos() {
        return position.copy();
    }

    export function setPos(x: number, y: number) {
        position.set(x, y);
    }

    export function moveFwd(distance: number) {
        glidePos = position.copy().add(Vector2D.fromPolar(heading, distance));

        // if the glide speed is negative, immediately teleport to the endpoint
        if (glideSpeed <= 0) {
            // draw a line
            if (drawing && !drawingPolygon) {
                drawnShapes.push({
                    type: "line",
                    thickness: lineThickness,
                    color: currentColor,
                    start: position.copy(),
                    end: glidePos.copy()
                });
            }
            position.set(glidePos);
        }
        else {
            gliding = true;
            if (drawing && !drawingPolygon) {
                currentShape = {
                    type: "line",
                    thickness: lineThickness,
                    color: currentColor,
                    start: position.copy(),
                    end: position.copy()
                }
            }
        }
    }

    export function getAngle() {
        return radToDeg(heading) + 90
    }

    export function setAngle(angle: number) {
        heading = degToRad(angle - 90);
        heading = ((heading % (Math.PI * 2)) + (Math.PI * 2)) % (Math.PI * 2);
    }

    export function rotate(angle: number) {
        heading += degToRad(angle);
        heading = ((heading % (Math.PI * 2)) + (Math.PI * 2)) % (Math.PI * 2);
    }

    export function show() {
        hideSprite = false;
    }

    export function hide() {
        hideSprite = true;
    }

    export function isHidden() {
        return hideSprite;
    }

    export function penUp() {
        if (drawingPolygon) { return; }
        drawing = false;
    }

    export function penDown() {
        if (drawingPolygon) { return; }
        drawing = true;
    }

    export function setColor(c: number | string) {
        if (drawingPolygon) { return; }

        // numbers act as indexes in the color array
        if (typeof c === "number") {
            const i = ((c % BASE_COLORS.length) + BASE_COLORS.length) % BASE_COLORS.length;
            currentColor = BASE_COLORS[i]
        }
        else {
            currentColor = c;
        }
    }

    export function setLineThickness(thickness: number) {
        lineThickness = thickness;
    }

    export function beginPoly() {
        if (!drawing) {
            console.warn("Attempted to start a polygon while not drawing.");
            return;
        }

        if (drawingPolygon) {
            throw new BL_Common.RuntimeError(
                "beginPoly() was called while already drawing a polygon."
            );
        }

        // finish drawing a line
        if (currentShape) {
            drawnShapes.push(currentShape);
        }

        // place the first vertex at our position and add a fake vertex for smooth polygon drawing
        currentShape = {
            type: "polygon",
            color: currentColor,
            vertices: [position.copy(), position.copy()]
        };

        drawingPolygon = true;
    }

    export function endPoly() {
        if (!drawing) {
            console.warn("Attempted to end a polygon while not drawing.");
            return;
        }

        if (!drawingPolygon) {
            throw new BL_Common.RuntimeError("endPoly() was called while not drawing a polygon.");
        }

        // place a final vertex where we end the shape
        dropVertex();
        drawnShapes.push(currentShape);
        currentShape = null;
        drawingPolygon = false;
    }

    export function dropVertex() {
        if (!drawingPolygon) {
            throw new BL_Common.RuntimeError(
                "dropVertex() was called while not drawing a polygon."
            );
        }

        if (currentShape && currentShape.type === "polygon") {
            currentShape.vertices[currentShape.vertices.length - 1].set(position);
            currentShape.vertices.push(position.copy());
        }
    }
}

/* ----- end of file ----- */