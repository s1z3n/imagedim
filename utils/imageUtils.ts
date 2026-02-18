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

export const getLabelBoundingBox = (ctx: CanvasRenderingContext2D, ann: Annotation, styles: StyleOptions): { x: number, y: number, width: number, height: number } => {
    ctx.font = `${styles.fontSize}px ${styles.fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const textToDisplay = `${ann.valueText}"`;
    const textMetrics = ctx.measureText(textToDisplay);
    const boxWidth = textMetrics.width + styles.labelBoxPadding * 2;
    const boxHeight = styles.fontSize + styles.labelBoxPadding * 2;
    return {
        x: ann.labelPos.x - boxWidth / 2,
        y: ann.labelPos.y - boxHeight / 2,
        width: boxWidth,
        height: boxHeight,
    };
};

const drawLabel = (ctx: CanvasRenderingContext2D, ann: Annotation, styles: StyleOptions) => {
    ctx.font = `${styles.fontSize}px ${styles.fontFamily}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const textToDisplay = `${ann.valueText}"`;
    let labelX = ann.labelPos.x;
    let labelY = ann.labelPos.y;

    if (styles.showLabelBox) {
        const textMetrics = ctx.measureText(textToDisplay);
        const boxWidth = textMetrics.width + styles.labelBoxPadding * 2;
        const boxHeight = styles.fontSize + styles.labelBoxPadding * 2;

        ctx.fillStyle = styles.labelBoxColor;
        ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetY = 2;
        ctx.beginPath();
        ctx.roundRect(labelX - boxWidth / 2, labelY - boxHeight / 2, boxWidth, boxHeight, 8);
        ctx.fill();
        ctx.shadowColor = 'transparent';
    } else {
        // Offset the label position when there's no box
        const dx = ann.p2.x - ann.p1.x;
        const dy = ann.p2.y - ann.p1.y;

        const length = Math.hypot(dx, dy);
        if (length > 1e-6) {
            const nx = -dy / length; // normalized normal vector
            const ny = dx / length;

            // Offset by half font size + a small gap
            const offset = styles.fontSize * 0.75;

            labelX += nx * offset;
            labelY += ny * offset;
        }
    }

    ctx.fillStyle = styles.textColor;
    ctx.fillText(textToDisplay, labelX, labelY);
};


export const drawAnnotation = (ctx: CanvasRenderingContext2D, ann: Annotation, styles: StyleOptions, isEditing: boolean = false) => {
    const color = ann.lineColor || styles.lineColor;
    ctx.strokeStyle = color;
    ctx.lineWidth = styles.strokeWidth;
    ctx.fillStyle = color;

    // Apply per-annotation line dash style
    const lineStyle = ann.lineStyle || 'solid';
    if (lineStyle === 'dashed') {
        ctx.setLineDash([8, 6]);
    } else if (lineStyle === 'dotted') {
        ctx.setLineDash([2, 4]);
    } else {
        ctx.setLineDash([]);
    }

    ctx.beginPath();
    ctx.moveTo(ann.p1.x, ann.p1.y);
    ctx.lineTo(ann.p2.x, ann.p2.y);
    ctx.stroke();

    // Reset dash so ticks and labels are always solid
    ctx.setLineDash([]);

    drawTick(ctx, ann.p1, ann.p2, styles.arrowheadSize);
    drawTick(ctx, ann.p2, ann.p1, styles.arrowheadSize);

    if (!isEditing) {
        drawLabel(ctx, ann, styles);
    }
}