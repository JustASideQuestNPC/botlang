/* ----- src/ui/ui-page.ts ----- */

interface ITextButtonArgs {
    x: number;
    y: number;
    width: number;
    height: number;
    text: string;
    textSize: number;
    textFont: string;
    cornerRadius: number;
    strokeWeight: number;
    strokeColor: string;
    fillColor: string;
    textColor: string;
    hoverStrokeColor?: string;
    hoverFillColor?: string;
    hoverTextColor?: string;
    callback: () => void;
}

/** A UI button with some text on it. */
class TextButton extends UIElementBase {
    x: number;
    y: number;
    width: number;
    height: number;
    text: string;
    textSize: number;
    textFont: string;
    cornerRadius: number;
    strokeWeight: number;
    strokeColor: string;
    fillColor: string;
    textColor: string;
    hoverStrokeColor: string;
    hoverFillColor: string;
    hoverTextColor: string;
    callback: () => void;

    constructor({x, y, width, height, text, textSize, textFont, cornerRadius, strokeWeight,
                 strokeColor, fillColor, textColor, hoverFillColor, hoverStrokeColor,
                 hoverTextColor, callback}: ITextButtonArgs) {
        super();
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.text = text;
        this.textSize = textSize;
        this.textFont = textFont;
        this.cornerRadius = cornerRadius;
        this.strokeWeight = strokeWeight;
        this.strokeColor = strokeColor;
        this.fillColor = fillColor;
        this.textColor = textColor;
        this.hoverStrokeColor = hoverStrokeColor ?? strokeColor;
        this.hoverFillColor = hoverFillColor ?? fillColor;
        this.hoverTextColor = hoverTextColor ?? textColor;
        this.callback = callback;
    }

    checkHover(mouseX: number, mouseY: number): boolean {
        return (
            mouseX >= this.x && mouseX <= this.x + this.width &&
            mouseY >= this.y && mouseY <= this.y + this.height
        );
    }

    render(rt: p5 | p5.Graphics): void {
        rt.push();
        rt.strokeWeight(this.strokeWeight);
        rt.stroke(this.hovered ? this.hoverStrokeColor : this.strokeColor);
        rt.fill(this.hovered ? this.hoverFillColor : this.fillColor);
        rt.rect(this.x, this.y, this.width, this.height, this.cornerRadius);
        rt.noStroke();
        rt.fill(this.hovered ? this.hoverTextColor : this.textColor);
        rt.textFont(this.textFont, this.textSize);
        rt.textAlign("center", "center");
        rt.text(this.text, this.x + this.width / 2, this.y + this.height / 2);
        rt.pop();
    }

    onClick(): void {
        this.callback();
    }
}

/* ----- end of file ----- */