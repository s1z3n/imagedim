import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Annotation, StyleOptions, Point, DraggablePart } from '../types';
import { drawAnnotation, getLabelBoundingBox } from '../utils/imageUtils';

interface CanvasAreaProps {
  image: HTMLImageElement;
  annotations: Annotation[];
  styleOptions: StyleOptions;
  updateAnnotation: (annotation: Annotation) => void;
  deleteAnnotation: (id: string) => void;
  selectedAnnotationId: string | null;
  setSelectedAnnotationId: (id: string | null) => void;
  zoom: number;
  setZoom: (zoom: number) => void;
  containerRef: React.RefObject<HTMLDivElement>;
  canvasSize: { width: number; height: number };
  isDrawingMode: boolean;
  drawingState: { step: number; points: Point[] };
  setDrawingState: React.Dispatch<React.SetStateAction<{ step: number; points: Point[] }>>;
  addAnnotation: (annotation: Annotation) => void;
  onToggleDrawingMode: (force?: boolean) => void;
  editingAnnotationId: string | null;
  setEditingAnnotationId: (id: string | null) => void;
}

const HANDLE_RADIUS = 8;
const HIT_THRESHOLD = 6;
const SNAP_ANGLE_RADIANS = (15 * Math.PI) / 180; // 15 degrees in radians

const snapPointToAngle = (point: Point, anchor: Point): Point => {
  const dx = point.x - anchor.x;
  const dy = point.y - anchor.y;
  const distance = Math.hypot(dx, dy);
  if (distance === 0) return point;

  const angle = Math.atan2(dy, dx);
  const snappedAngle = Math.round(angle / SNAP_ANGLE_RADIANS) * SNAP_ANGLE_RADIANS;

  return {
    x: anchor.x + distance * Math.cos(snappedAngle),
    y: anchor.y + distance * Math.sin(snappedAngle),
  };
};

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

const DrawingInstructions: React.FC<{ step: number }> = ({ step }) => {
  const messages = [
    "Click to set the first measurement point.",
    "Click to set the second measurement point.",
    "Move mouse to set offset, then click to place line."
  ];
  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none z-10">
      <div className="bg-gray-900 bg-opacity-70 text-white text-sm px-4 py-2 rounded-lg shadow-md">
        {messages[step]}
      </div>
      <div className="bg-gray-800 bg-opacity-70 text-gray-200 text-xs px-3 py-1 rounded-full shadow">
        Press <kbd className="px-1.5 py-0.5 border border-gray-600 bg-gray-900/50 rounded-md text-xs font-sans">Esc</kbd> to exit Add Dimension mode
      </div>
    </div>
  )
};

const CanvasArea: React.FC<CanvasAreaProps> = ({
  image, annotations, styleOptions, updateAnnotation, deleteAnnotation,
  selectedAnnotationId, setSelectedAnnotationId, zoom, setZoom,
  containerRef, canvasSize, isDrawingMode,
  drawingState, setDrawingState, addAnnotation, onToggleDrawingMode,
  editingAnnotationId, setEditingAnnotationId
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inlineInputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState<{ part: DraggablePart; id: string; initialMousePos: Point, initialAnnotation: Annotation } | null>(null);
  const [mousePos, setMousePos] = useState<Point | null>(null);
  const [inlineEditText, setInlineEditText] = useState('');

  const editingAnnotation = annotations.find(a => a.id === editingAnnotationId);

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

    ctx.drawImage(image, 0, 0, canvasSize.width, canvasSize.height);

    annotations.forEach(ann => {
      drawAnnotation(ctx, ann, styleOptions, ann.id === editingAnnotationId);
      if (ann.id === selectedAnnotationId) {
        drawHandle(ctx, ann.p1, 'point');
        drawHandle(ctx, ann.p2, 'point');
        drawHandle(ctx, ann.labelPos, 'label');
      }
    });

    if (isDrawingMode) {
      drawDrawingPreview(ctx);
    }
  };

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
        const previewAnn: Annotation = { id: '', label: '', valueText: '??', p1, p2, ext1: c1, ext2: c2, labelPos: { x: 0, y: 0 } };
        drawAnnotation(ctx, previewAnn, styleOptions);
      }
    }
    ctx.restore();
  }

  const drawHandle = (ctx: CanvasRenderingContext2D, pos: Point, type: 'point' | 'label' = 'point') => {
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, HANDLE_RADIUS, 0, 2 * Math.PI);
    const colors = { point: 'rgba(255, 255, 255, 0.9)', label: 'rgba(200, 255, 200, 0.9)' };
    ctx.fillStyle = colors[type];
    ctx.fill();
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.stroke();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      // Don't interfere with inline editing
      if (target.id === 'inline-annotation-input') {
        return;
      }
      // Prevent deletion if the user is typing in an input, textarea, or contenteditable element
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }

      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedAnnotationId) {
        deleteAnnotation(selectedAnnotationId);
      }
      if (e.key === 'Escape' && isDrawingMode) {
        onToggleDrawingMode(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedAnnotationId, deleteAnnotation, isDrawingMode, onToggleDrawingMode]);

  useEffect(() => {
    if (editingAnnotationId && inlineInputRef.current) {
      const ann = annotations.find(a => a.id === editingAnnotationId);
      if (ann) {
        setInlineEditText(ann.valueText);
        inlineInputRef.current.style.fontSize = `${styleOptions.fontSize}px`;
        inlineInputRef.current.focus();
        inlineInputRef.current.select();
      }
    }
  }, [editingAnnotationId, annotations, styleOptions.fontSize]);

  useEffect(draw, [image, annotations, styleOptions, selectedAnnotationId, canvasSize, isDrawingMode, drawingState, mousePos, editingAnnotationId]);

  const hittest = (pos: Point): { part: DraggablePart; id: string } | null => {
    for (let i = annotations.length - 1; i >= 0; i--) {
      const ann = annotations[i];

      // Check handles first
      if (Math.hypot(pos.x - ann.p1.x, pos.y - ann.p1.y) <= HANDLE_RADIUS) return { part: 'p1', id: ann.id };
      if (Math.hypot(pos.x - ann.p2.x, pos.y - ann.p2.y) <= HANDLE_RADIUS) return { part: 'p2', id: ann.id };
      if (Math.hypot(pos.x - ann.labelPos.x, pos.y - ann.labelPos.y) <= HANDLE_RADIUS) return { part: 'label', id: ann.id };

      // Check line
      const dx = ann.p2.x - ann.p1.x;
      const dy = ann.p2.y - ann.p1.y;
      const lenSq = dx * dx + dy * dy;
      if (lenSq === 0) continue;

      const t = Math.max(0, Math.min(1, ((pos.x - ann.p1.x) * dx + (pos.y - ann.p1.y) * dy) / lenSq));
      const closestX = ann.p1.x + t * dx;
      const closestY = ann.p1.y + t * dy;

      if (Math.hypot(pos.x - closestX, pos.y - closestY) <= HIT_THRESHOLD) {
        return { part: 'line', id: ann.id };
      }
    }
    return null;
  };

  const labelHitTest = (pos: Point): string | null => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return null;

    // Check in reverse order so top-most annotations are checked first
    for (let i = annotations.length - 1; i >= 0; i--) {
      const ann = annotations[i];
      if (!styleOptions.showLabelBox) continue; // Only hit-test if the box is visible

      // Temporarily apply font settings to get accurate metrics for this annotation
      ctx.font = `${styleOptions.fontSize}px ${styleOptions.fontFamily}`;

      const box = getLabelBoundingBox(ctx, ann, styleOptions);
      if (
        pos.x >= box.x &&
        pos.x <= box.x + box.width &&
        pos.y >= box.y &&
        pos.y <= box.y + box.height
      ) {
        return ann.id;
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
    } else if (editingAnnotationId) {
      // If clicking outside while editing, commit the edit
      commitInlineEdit();
      setSelectedAnnotationId(null);
    } else {
      setSelectedAnnotationId(null);
    }
  };

  const handleDrawingMouseDown = (e: React.MouseEvent) => {
    let pos = getMousePos(e);

    if (drawingState.step === 1 && drawingState.points.length > 0 && e.shiftKey) {
      const anchor = drawingState.points[0];
      pos = snapPointToAngle(pos, anchor);
    }

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
      setSelectedAnnotationId(newAnnotation.id);
      setEditingAnnotationId(newAnnotation.id);
      setDrawingState({ step: 0, points: [] });
    } else {
      setDrawingState({ step: newPoints.length, points: newPoints });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    let rawMousePos = getMousePos(e);
    let effectiveMousePos = rawMousePos;

    // Update the preview position, snapping if necessary when drawing
    if (e.shiftKey && isDrawingMode && drawingState.step === 1 && drawingState.points.length > 0) {
      const anchor = drawingState.points[0];
      effectiveMousePos = snapPointToAngle(rawMousePos, anchor);
    }
    setMousePos(effectiveMousePos);

    if (!dragging) return;

    const { initialAnnotation, initialMousePos, part } = dragging;
    const dx = rawMousePos.x - initialMousePos.x;
    const dy = rawMousePos.y - initialMousePos.y;

    const updatedAnn = { ...initialAnnotation };

    switch (part) {
      case 'line':
        updatedAnn.p1 = { x: initialAnnotation.p1.x + dx, y: initialAnnotation.p1.y + dy };
        updatedAnn.p2 = { x: initialAnnotation.p2.x + dx, y: initialAnnotation.p2.y + dy };
        updatedAnn.labelPos = { x: initialAnnotation.labelPos.x + dx, y: initialAnnotation.labelPos.y + dy };
        if (updatedAnn.ext1) updatedAnn.ext1 = { x: initialAnnotation.ext1!.x + dx, y: initialAnnotation.ext1!.y + dy };
        if (updatedAnn.ext2) updatedAnn.ext2 = { x: initialAnnotation.ext2!.x + dx, y: initialAnnotation.ext2!.y + dy };
        break;
      case 'p1': {
        let newP1 = { x: initialAnnotation.p1.x + dx, y: initialAnnotation.p1.y + dy };
        if (e.shiftKey) {
          const anchor = initialAnnotation.p2;
          newP1 = snapPointToAngle(newP1, anchor);
        }
        updatedAnn.p1 = newP1;
        updatedAnn.labelPos = { x: (updatedAnn.p1.x + updatedAnn.p2.x) / 2, y: (updatedAnn.p1.y + updatedAnn.p2.y) / 2 };
        break;
      }
      case 'p2': {
        let newP2 = { x: initialAnnotation.p2.x + dx, y: initialAnnotation.p2.y + dy };
        if (e.shiftKey) {
          const anchor = initialAnnotation.p1;
          newP2 = snapPointToAngle(newP2, anchor);
        }
        updatedAnn.p2 = newP2;
        updatedAnn.labelPos = { x: (updatedAnn.p1.x + updatedAnn.p2.x) / 2, y: (updatedAnn.p1.y + updatedAnn.p2.y) / 2 };
        break;
      }
      case 'label':
        updatedAnn.labelPos = { x: initialAnnotation.labelPos.x + dx, y: initialAnnotation.labelPos.y + dy };
        break;
    }

    updateAnnotation(updatedAnn);
  };

  const handleMouseUp = () => setDragging(null);

  const handleDoubleClick = (e: React.MouseEvent) => {
    if (isDrawingMode) return;
    const pos = getMousePos(e);
    const hitId = labelHitTest(pos);
    if (hitId) {
      setSelectedAnnotationId(hitId);
      setEditingAnnotationId(hitId);
    }
  };

  const commitInlineEdit = () => {
    if (!editingAnnotationId) return;
    const ann = annotations.find(a => a.id === editingAnnotationId);
    if (ann && ann.valueText !== inlineEditText) {
      updateAnnotation({ ...ann, valueText: inlineEditText });
    }
    setEditingAnnotationId(null);
  };

  const cancelInlineEdit = () => {
    setEditingAnnotationId(null);
  };

  const handleInlineInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commitInlineEdit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelInlineEdit();
    }
  };

  // Ctrl+wheel zoom
  const handleWheel = useCallback((e: WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      setZoom(Math.max(0.25, Math.min(3, Math.round((zoom + delta) * 100) / 100)));
    }
  }, [zoom, setZoom]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [handleWheel, containerRef]);



  return (
    <div style={{ width: canvasSize.width * zoom, height: canvasSize.height * zoom, flexShrink: 0 }}>
      <div
        className='relative'
        style={{
          width: canvasSize.width,
          height: canvasSize.height,
          transform: `scale(${zoom})`,
          transformOrigin: 'top left',
        }}
      >
        <canvas
          ref={canvasRef}
          width={canvasSize.width}
          height={canvasSize.height}
          style={{ width: canvasSize.width, height: canvasSize.height, cursor: isDrawingMode ? 'crosshair' : (dragging ? 'grabbing' : 'default') }}
          onMouseDown={isDrawingMode ? handleDrawingMouseDown : handleSelectMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => { handleMouseUp(); setMousePos(null); }}
          onDoubleClick={handleDoubleClick}
          className="bg-white shadow-lg"
        />
        {editingAnnotation && (
          <input
            ref={inlineInputRef}
            id="inline-annotation-input"
            type="text"
            value={inlineEditText}
            onChange={e => setInlineEditText(e.target.value)}
            onBlur={commitInlineEdit}
            onKeyDown={handleInlineInputKeyDown}
            className="absolute p-1 border border-indigo-500 rounded-sm shadow-md bg-white text-black text-center"
            style={{
              top: `${editingAnnotation.labelPos.y}px`,
              left: `${editingAnnotation.labelPos.x}px`,
              transform: 'translate(-50%, -50%)',
              width: `${(inlineEditText.length + 2) * (styleOptions.fontSize * 0.6)}px`,
              minWidth: '50px',
              fontFamily: styleOptions.fontFamily,
            }}
          />
        )}
        {isDrawingMode && <DrawingInstructions step={drawingState.step} />}
      </div>
    </div>
  );
};

export default CanvasArea;