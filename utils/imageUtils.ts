import { Annotation, Point, StyleOptions } from '../types';

const drawTick = (ctx: CanvasRenderingContext2D, from: Point, to: Point, size: number) => {
    const angle = Math.atan2(to.y - from.y, to.x - from.x);
    ctx.save();
    ctx.translate(to.x, to.y);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(0, -size / 2);
    ctx.lineTo(0, size / 2);
    ctx.stroke();
    ctx.restore();
};

const drawLabel = (ctx: CanvasRenderingContext2D, ann: Annotation, styles: StyleOptions) => {
    ctx.font = `${styles.fontSize}px ${styles.fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const textToDisplay = `${ann.valueText}"`;
    const textMetrics = ctx.measureText(textToDisplay);
    const boxWidth = textMetrics.width + styles.labelBoxPadding * 2;
    const boxHeight = styles.fontSize + styles.labelBoxPadding * 2;
    const labelX = ann.labelPos.x;
    const labelY = ann.labelPos.y;

    if (styles.showLabelBox) {
        ctx.fillStyle = styles.labelBoxColor;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetY = 2;
        ctx.beginPath();
        ctx.roundRect(labelX - boxWidth / 2, labelY - boxHeight / 2, boxWidth, boxHeight, 8);
        ctx.fill();
        ctx.shadowColor = 'transparent';
    }

    ctx.fillStyle = styles.textColor;
    ctx.fillText(textToDisplay, labelX, labelY);
};


export const drawAnnotation = (ctx: CanvasRenderingContext2D, ann: Annotation, styles: StyleOptions) => {
    const color = ann.lineColor || styles.lineColor;
    ctx.strokeStyle = color;
    ctx.lineWidth = styles.strokeWidth;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(ann.p1.x, ann.p1.y);
    ctx.lineTo(ann.p2.x, ann.p2.y);
    ctx.stroke();

    drawTick(ctx, ann.p1, ann.p2, styles.arrowheadSize);
    drawTick(ctx, ann.p2, ann.p1, styles.arrowheadSize);
    drawLabel(ctx, ann, styles);
}
