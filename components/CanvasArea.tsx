
import React, { useRef, useEffect, useState } from 'react';
import { Annotation, StyleOptions, Point, DraggablePart } from '../types';

interface CanvasAreaProps {
  image: HTMLImageElement;
  annotations: Annotation[];
  styleOptions: StyleOptions;
  updateAnnotation: (annotation: Annotation) => void;
  deleteAnnotation: (id: string) => void;
  selectedAnnotationId: string | null;
  setSelectedAnnotationId: (id: string | null) => void;
  zoom: number;
  canvasSize: { width: number; height: number };
  isDrawingMode: boolean;
  drawingState: { step: number; points: Point[] };
  setDrawingState: React.Dispatch<React.SetStateAction<{ step: number; points: Point[] }>>;
  addAnnotation: (annotation: Annotation) => void;
  onToggleDrawingMode: () => void;
}

const HANDLE_RADIUS = 8;
const HIT_THRESHOLD = 6;

const calculateAnnotationPoints = (c1: Point, c2: Point, c3: Point) => {
    const v = { x: c2.x - c1.x, y: c2.y - c1.y };
    const n = { x: -v.y, y: v.x };
    const nLength = Math.hypot(n.x, n.y);
    
    if (nLength < 1e-6) {
      return { p1: c1, p2: c2, labelPos: c3 };
    }

    const n_normalized = { x: n.x / nLength, y: n.y / nLength };
    const w = { x: c3.x - c1.x, y: c3.y - c1.y };
    const d = w.x * n_normalized.x + w.y * n_normalized.y;
    const offsetVector = { x: d * n_normalized.x, y: d * n_normalized.y };

    const p1 = { x: c1.x + offsetVector.x, y: c1.y + offsetVector.y };
    const p2 = { x: c2.x + offsetVector.x, y: c2.y + offsetVector.y };
    const labelPos = { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };

    return { p1, p2, labelPos };
};

const DrawingInstructions: React.FC<{step: number}> = ({ step }) => {
    const messages = [
        "Click to set the first measurement point.",
        "Click to set the second measurement point.",
        "Move mouse to set offset, then click to place line."
    ];
    return (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-gray-900 bg-opacity-70 text-white text-sm px-4 py-2 rounded-lg pointer-events-none">
            {messages[step]}
        </div>
    )
};

const CanvasArea: React.FC<CanvasAreaProps> = ({
  image, annotations, styleOptions, updateAnnotation, deleteAnnotation,
  selectedAnnotationId, setSelectedAnnotationId, zoom, canvasSize,
  isDrawingMode, drawingState, setDrawingState, addAnnotation, onToggleDrawingMode
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dragging, setDragging] = useState<{ part: DraggablePart; id: string; initialMousePos: Point, initialAnnotation: Annotation } | null>(null);
  const [mousePos, setMousePos] = useState<Point | null>(null);

  const getMousePos = (e: React.MouseEvent): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / zoom,
      y: (e.clientY - rect.top) / zoom,
    };
  };

  const draw = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    ctx.save();
    ctx.scale(zoom, zoom);
    
    ctx.drawImage(image, 0, 0, canvasSize.width, canvasSize.height);

    annotations.forEach(ann => {
      drawAnnotation(ctx, ann, styleOptions, ann.id === selectedAnnotationId);
    });

    if (isDrawingMode) {
      drawDrawingPreview(ctx);
    }

    ctx.restore();
  };

  const drawAnnotation = (ctx: CanvasRenderingContext2D, ann: Annotation, styles: StyleOptions, isSelected: boolean) => {
      ctx.strokeStyle = styles.lineColor;
      ctx.lineWidth = styles.strokeWidth;
      ctx.fillStyle = styles.lineColor;
      ctx.beginPath();
      ctx.moveTo(ann.p1.x, ann.p1.y);
      ctx.lineTo(ann.p2.x, ann.p2.y);
      ctx.stroke();

      drawTick(ctx, ann.p1, ann.p2, styles.arrowheadSize);
      drawTick(ctx, ann.p2, ann.p1, styles.arrowheadSize);
      drawLabel(ctx, ann, styles);

      if (isSelected) {
        drawHandle(ctx, ann.p1, 'point');
        drawHandle(ctx, ann.p2, 'point');
        drawHandle(ctx, ann.labelPos, 'label');
      }
  }
  
  const drawDrawingPreview = (ctx: CanvasRenderingContext2D) => {
    ctx.save();
    ctx.strokeStyle = 'rgba(79, 70, 229, 0.7)';
    ctx.fillStyle = 'rgba(79, 70, 229, 0.7)';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);

    drawingState.points.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
        ctx.fill();
    });

    if (mousePos && drawingState.points.length > 0) {
      if (drawingState.step === 1) {
        const p1 = drawingState.points[0];
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(mousePos.x, mousePos.y);
        ctx.stroke();
      } else if (drawingState.step === 2) {
        const c1 = drawingState.points[0];
        const c2 = drawingState.points[1];
        const { p1, p2 } = calculateAnnotationPoints(c1, c2, mousePos);
        const previewAnn: Annotation = { id: '', label: '', valueText: '??', p1, p2, ext1: c1, ext2: c2, labelPos: {x:0, y:0} };
        drawAnnotation(ctx, previewAnn, styleOptions, false);
      }
    }
    ctx.restore();
  }

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
  
  const drawHandle = (ctx: CanvasRenderingContext2D, pos: Point, type: 'point' | 'label' = 'point') => {
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, HANDLE_RADIUS / zoom, 0, 2 * Math.PI);
    const colors = { point: 'rgba(255, 255, 255, 0.9)', label: 'rgba(200, 255, 200, 0.9)'};
    ctx.fillStyle = colors[type];
    ctx.fill();
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1 / zoom;
    ctx.stroke();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedAnnotationId) {
        deleteAnnotation(selectedAnnotationId);
      }
      if (e.key === 'Escape' && isDrawingMode) {
        onToggleDrawingMode();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedAnnotationId, deleteAnnotation, isDrawingMode, onToggleDrawingMode]);

  useEffect(draw, [image, annotations, styleOptions, zoom, selectedAnnotationId, canvasSize, isDrawingMode, drawingState, mousePos]);

  const hittest = (pos: Point): { part: DraggablePart; id: string } | null => {
    for (let i = annotations.length - 1; i >= 0; i--) {
        const ann = annotations[i];
        
        // Check handles first
        if (Math.hypot(pos.x - ann.p1.x, pos.y - ann.p1.y) <= HANDLE_RADIUS / zoom) return { part: 'p1', id: ann.id };
        if (Math.hypot(pos.x - ann.p2.x, pos.y - ann.p2.y) <= HANDLE_RADIUS / zoom) return { part: 'p2', id: ann.id };
        if (Math.hypot(pos.x - ann.labelPos.x, pos.y - ann.labelPos.y) <= HANDLE_RADIUS / zoom) return { part: 'label', id: ann.id };

        // Check line
        const dx = ann.p2.x - ann.p1.x;
        const dy = ann.p2.y - ann.p1.y;
        const lenSq = dx * dx + dy * dy;
        if (lenSq === 0) continue;

        const t = Math.max(0, Math.min(1, ((pos.x - ann.p1.x) * dx + (pos.y - ann.p1.y) * dy) / lenSq));
        const closestX = ann.p1.x + t * dx;
        const closestY = ann.p1.y + t * dy;

        if (Math.hypot(pos.x - closestX, pos.y - closestY) <= HIT_THRESHOLD / zoom) {
            return { part: 'line', id: ann.id };
        }
    }
    return null;
  };

  const handleSelectMouseDown = (e: React.MouseEvent) => {
    const pos = getMousePos(e);
    const hit = hittest(pos);
    if (hit) {
      const ann = annotations.find(a => a.id === hit.id);
      if (ann) {
        setSelectedAnnotationId(hit.id);
        setDragging({ part: hit.part, id: hit.id, initialMousePos: pos, initialAnnotation: ann });
      }
    } else {
      setSelectedAnnotationId(null);
    }
  };
  
  const handleDrawingMouseDown = (e: React.MouseEvent) => {
    const pos = getMousePos(e);
    const newPoints = [...drawingState.points, pos];
    
    if (newPoints.length === 3) {
      const [c1, c2, c3] = newPoints;
      const { p1, p2, labelPos } = calculateAnnotationPoints(c1, c2, c3);
      const newAnnotation: Annotation = {
          id: `ann-${Date.now()}`,
          label: 'New Dimension', valueText: '??',
          ext1: c1, ext2: c2, p1, p2, labelPos,
      };
      addAnnotation(newAnnotation);
      setDrawingState({ step: 0, points: [] });
    } else {
      setDrawingState({ step: newPoints.length, points: newPoints });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const pos = getMousePos(e);
    setMousePos(pos);
    if (!dragging) return;
    
    const { initialAnnotation, initialMousePos, part } = dragging;
    const dx = pos.x - initialMousePos.x;
    const dy = pos.y - initialMousePos.y;

    const updatedAnn = { ...initialAnnotation };

    switch(part) {
        case 'line':
            updatedAnn.p1 = { x: initialAnnotation.p1.x + dx, y: initialAnnotation.p1.y + dy };
            updatedAnn.p2 = { x: initialAnnotation.p2.x + dx, y: initialAnnotation.p2.y + dy };
            updatedAnn.labelPos = { x: initialAnnotation.labelPos.x + dx, y: initialAnnotation.labelPos.y + dy };
            if (updatedAnn.ext1) updatedAnn.ext1 = { x: initialAnnotation.ext1!.x + dx, y: initialAnnotation.ext1!.y + dy };
            if (updatedAnn.ext2) updatedAnn.ext2 = { x: initialAnnotation.ext2!.x + dx, y: initialAnnotation.ext2!.y + dy };
            break;
        case 'p1':
            updatedAnn.p1 = { x: initialAnnotation.p1.x + dx, y: initialAnnotation.p1.y + dy };
            updatedAnn.labelPos = { x: (updatedAnn.p1.x + updatedAnn.p2.x) / 2, y: (updatedAnn.p1.y + updatedAnn.p2.y) / 2 };
            break;
        case 'p2':
            updatedAnn.p2 = { x: initialAnnotation.p2.x + dx, y: initialAnnotation.p2.y + dy };
            updatedAnn.labelPos = { x: (updatedAnn.p1.x + updatedAnn.p2.x) / 2, y: (updatedAnn.p1.y + updatedAnn.p2.y) / 2 };
            break;
        case 'label':
            updatedAnn.labelPos = { x: initialAnnotation.labelPos.x + dx, y: initialAnnotation.labelPos.y + dy };
            break;
    }
    
    updateAnnotation(updatedAnn);
  };

  const handleMouseUp = () => setDragging(null);
  
  const handleDownload = async (quality: number) => {
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return;

    tempCanvas.width = image.naturalWidth;
    tempCanvas.height = image.naturalHeight;
    const scale = image.naturalWidth / canvasSize.width;
    tempCtx.drawImage(image, 0, 0);
    
    const scaledStyles = {
        ...styleOptions,
        strokeWidth: styleOptions.strokeWidth * scale,
        arrowheadSize: styleOptions.arrowheadSize * scale,
        fontSize: styleOptions.fontSize * scale,
        labelBoxPadding: styleOptions.labelBoxPadding * scale,
    };

    annotations.forEach(ann => {
        const scaledAnn = {
            ...ann,
            p1: { x: ann.p1.x * scale, y: ann.p1.y * scale },
            p2: { x: ann.p2.x * scale, y: ann.p2.y * scale },
            labelPos: { x: ann.labelPos.x * scale, y: ann.labelPos.y * scale },
            ext1: ann.ext1 ? { x: ann.ext1.x * scale, y: ann.ext1.y * scale } : undefined,
            ext2: ann.ext2 ? { x: ann.ext2.x * scale, y: ann.ext2.y * scale } : undefined,
        };
        drawAnnotation(tempCtx, scaledAnn, scaledStyles, false);
    });

    const link = document.createElement('a');
    link.download = `annotated-image.jpg`;
    link.href = tempCanvas.toDataURL('image/jpeg', quality);
    link.click();
  };

  return (
    <div className='relative w-full h-full flex items-center justify-center'>
       <canvas
        ref={canvasRef}
        width={canvasSize.width * zoom}
        height={canvasSize.height * zoom}
        style={{ width: canvasSize.width * zoom, height: canvasSize.height * zoom, cursor: isDrawingMode ? 'crosshair' : (dragging ? 'grabbing' : 'grab') }}
        onMouseDown={isDrawingMode ? handleDrawingMouseDown : handleSelectMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => { handleMouseUp(); setMousePos(null); }}
        className="bg-white shadow-lg"
      />
      {isDrawingMode && <DrawingInstructions step={drawingState.step} />}
      <div className="absolute bottom-2 right-2 flex space-x-2">
         <button onClick={() => handleDownload(1.0)} className="px-3 py-1.5 text-xs font-medium text-white bg-gray-700 border border-transparent rounded-md shadow-sm hover:bg-gray-800">Download JPG</button>
      </div>
    </div>
  );
};

export default CanvasArea;
