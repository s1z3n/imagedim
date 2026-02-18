import React, { useState, useCallback, useRef, useEffect } from 'react';
import type { Annotation, StyleOptions, Point } from './types';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useHistory } from './hooks/useHistory';
import { DEFAULT_STYLE_OPTIONS } from './constants';
import Header from './components/Header';
import ImageUploader from './components/ImageUploader';
import ControlsPanel from './components/ControlsPanel';
import CanvasArea from './components/CanvasArea';
import ZoomToolbar from './components/ZoomToolbar';
import { drawAnnotation as drawAnnotationOnCanvas } from './utils/imageUtils';

const calculateFitToScreenSize = (img: HTMLImageElement, container: HTMLElement): { width: number; height: number } => {
  const containerWidth = container.clientWidth;
  const containerHeight = container.clientHeight;

  if (containerWidth === 0 || containerHeight === 0 || !img.naturalWidth || !img.naturalHeight) {
    return { width: 0, height: 0 };
  }

  const imageAspectRatio = img.naturalWidth / img.naturalHeight;
  const containerAspectRatio = containerWidth / containerHeight;

  let finalWidth: number, finalHeight: number;

  if (imageAspectRatio > containerAspectRatio) {
    // Image is wider than container, so fit to width
    finalWidth = containerWidth;
    finalHeight = containerWidth / imageAspectRatio;
  } else {
    // Image is taller than container, so fit to height
    finalHeight = containerHeight;
    finalWidth = containerHeight * imageAspectRatio;
  }

  return { width: finalWidth, height: finalHeight };
};

const Instructions: React.FC = () => (
  <div className="bg-white p-4 rounded-lg shadow-md">
    <h2 className="text-lg font-semibold text-gray-700 mb-2">How to Use</h2>
    <ol className="list-decimal list-inside space-y-2 text-sm text-gray-600">
      <li>Upload your product image using the panel above.</li>
      <li>Click <span className="font-semibold text-indigo-600">"Add Dimension"</span> in the header to enter drawing mode.</li>
      <li>Click three times to define a dimension:
        <ul className="list-disc list-inside ml-4 mt-1">
          <li>First click: Start point.</li>
          <li>Second click: End point.</li>
          <li>Third click: Set distance from object.</li>
          <li className="font-semibold text-indigo-600">An input will appear on the line to enter the value.</li>
        </ul>
      </li>
      <li>Use the controls on the right to adjust styles.</li>
      <li>Click on any annotation to select, move, or resize it. Double-click a label to edit it.</li>
      <li>Click <span className="font-semibold text-gray-800">"Download JPG"</span> when you're finished.</li>
    </ol>
  </div>
);

const App: React.FC = () => {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [originalFileName, setOriginalFileName] = useState<string | null>(null);
  const [styleOptions, setStyleOptions] = useLocalStorage<StyleOptions>('styleOptions', DEFAULT_STYLE_OPTIONS);
  const [zoom, setZoom] = useState(1);
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null);
  const [editingAnnotationId, setEditingAnnotationId] = useState<string | null>(null);
  const [sidebarText, setSidebarText] = useState('');

  const { state: annotations, setState: setAnnotations, undo, redo, canUndo, canRedo } = useHistory<Annotation[]>([]);

  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [drawingState, setDrawingState] = useState<{ step: number; points: Point[] }>({ step: 0, points: [] });

  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const prevCanvasSizeRef = useRef(canvasSize);

  const toggleDrawingMode = useCallback((force?: boolean) => {
    setIsDrawingMode(prev => {
      const isNowDrawing = force !== undefined ? force : !prev;
      if (isNowDrawing) {
        setSelectedAnnotationId(null);
        setEditingAnnotationId(null);
      }
      setDrawingState({ step: 0, points: [] }); // Reset on every toggle/change
      return isNowDrawing;
    });
  }, []);

  // Initial sizing: compute canvas size once when image loads
  useEffect(() => {
    if (!image || !canvasContainerRef.current) return;

    const container = canvasContainerRef.current;

    // Use ResizeObserver to wait for the container to have a valid size,
    // then compute canvas size once and disconnect.
    const resizeObserver = new ResizeObserver(() => {
      const newSize = calculateFitToScreenSize(image, container);
      if (newSize.width > 0) {
        setCanvasSize(newSize);
        resizeObserver.disconnect(); // Only need the first valid measurement
      }
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, [image]);

  // Window resize: recalculate canvas size when browser window is resized
  useEffect(() => {
    if (!image || !canvasContainerRef.current) return;

    const handleWindowResize = () => {
      if (!canvasContainerRef.current || !image) return;
      const newSize = calculateFitToScreenSize(image, canvasContainerRef.current);
      if (newSize.width > 0) {
        setCanvasSize(newSize);
      }
    };

    window.addEventListener('resize', handleWindowResize);
    return () => window.removeEventListener('resize', handleWindowResize);
  }, [image]);

  // Rescale annotations proportionally when canvas size changes (e.g. different-resolution image)
  useEffect(() => {
    const prev = prevCanvasSizeRef.current;
    if (
      prev.width > 0 && prev.height > 0 &&
      canvasSize.width > 0 && canvasSize.height > 0 &&
      (prev.width !== canvasSize.width || prev.height !== canvasSize.height) &&
      annotations.length > 0
    ) {
      const sx = canvasSize.width / prev.width;
      const sy = canvasSize.height / prev.height;
      const scalePoint = (p: Point) => ({ x: p.x * sx, y: p.y * sy });
      setAnnotations(
        annotations.map(a => ({
          ...a,
          p1: scalePoint(a.p1),
          p2: scalePoint(a.p2),
          labelPos: scalePoint(a.labelPos),
          ext1: a.ext1 ? scalePoint(a.ext1) : undefined,
          ext2: a.ext2 ? scalePoint(a.ext2) : undefined,
        })),
        true
      );
    }
    prevCanvasSizeRef.current = canvasSize;
  }, [canvasSize]);


  const handleImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        setImage(img);
        setOriginalFileName(file.name);
        toggleDrawingMode(true);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleClear = () => {
    setAnnotations([]);
    setSelectedAnnotationId(null);
    setEditingAnnotationId(null);
  };

  const addAnnotation = useCallback((annotation: Annotation) => {
    setAnnotations(prev => [...prev, annotation]);
  }, [setAnnotations]);

  const updateAnnotation = (updatedAnnotation: Annotation) => {
    setAnnotations(annotations.map(a => a.id === updatedAnnotation.id ? updatedAnnotation : a), true);
  };

  const deleteAnnotation = (id: string) => {
    setAnnotations(annotations.filter(a => a.id !== id));
    if (selectedAnnotationId === id) {
      setSelectedAnnotationId(null);
    }
    if (editingAnnotationId === id) {
      setEditingAnnotationId(null);
    }
  };

  const handleDownload = async (quality: number = 1.0) => {
    if (!image) return;

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
      drawAnnotationOnCanvas(tempCtx, scaledAnn, scaledStyles);
    });

    const link = document.createElement('a');
    let baseName = 'annotated-image';
    if (originalFileName) {
      const lastDotIndex = originalFileName.lastIndexOf('.');
      baseName = lastDotIndex === -1 ? originalFileName : originalFileName.substring(0, lastDotIndex);
    }
    const qualitySuffix = 100; // Always suffix with 100 as requested
    link.download = `${baseName}_${qualitySuffix}.jpg`;
    link.href = tempCanvas.toDataURL('image/jpeg', quality);
    link.click();
  };

  const selectedAnnotation = annotations.find(a => a.id === selectedAnnotationId) || null;

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <Header
        onClear={handleClear}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undo}
        onRedo={redo}
        isDrawingMode={isDrawingMode}
        onToggleDrawingMode={() => toggleDrawingMode()}
      />
      <main className="flex-grow flex p-4 gap-4 overflow-hidden">
        <div className="flex flex-col w-1/4 max-w-sm space-y-4">
          <div className="bg-white p-4 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold text-gray-700 mb-2">1. Upload Image</h2>
            <ImageUploader onImageUpload={handleImageUpload} />
          </div>
          <div className="bg-white p-4 rounded-lg shadow-md">
            <label htmlFor="sidebar-text-input" className="block text-lg font-semibold text-gray-700 mb-2">
              2. Notes
            </label>
            <textarea
              id="sidebar-text-input"
              value={sidebarText}
              onChange={(event) => setSidebarText(event.target.value)}
              placeholder="Paste or type any notes here..."
              className="w-full h-32 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-gray-700 resize-none"
            />
          </div>
          <Instructions />
        </div>

        <div className="flex-grow flex flex-col relative">
          <div className="flex-grow flex flex-col items-center justify-center bg-gray-200 rounded-lg shadow-inner overflow-auto" ref={canvasContainerRef}>
            {image ? (
              <CanvasArea
                image={image}
                annotations={annotations}
                styleOptions={styleOptions}
                updateAnnotation={updateAnnotation}
                deleteAnnotation={deleteAnnotation}
                selectedAnnotationId={selectedAnnotationId}
                setSelectedAnnotationId={setSelectedAnnotationId}
                zoom={zoom}
                setZoom={setZoom}
                containerRef={canvasContainerRef}
                canvasSize={canvasSize}
                isDrawingMode={isDrawingMode}
                drawingState={drawingState}
                setDrawingState={setDrawingState}
                addAnnotation={addAnnotation}
                onToggleDrawingMode={toggleDrawingMode}
                editingAnnotationId={editingAnnotationId}
                setEditingAnnotationId={setEditingAnnotationId}
              />
            ) : (
              <div className="text-gray-500">Please upload an image to begin</div>
            )}
          </div>
          {image && (
            <div className="absolute bottom-3 right-3 z-20">
              <ZoomToolbar
                zoom={zoom}
                setZoom={setZoom}
              />
            </div>
          )}
        </div>

        <ControlsPanel
          styleOptions={styleOptions}
          setStyleOptions={setStyleOptions}
          selectedAnnotation={selectedAnnotation}
          updateAnnotation={updateAnnotation}
          onDownload={handleDownload}
          isImageLoaded={!!image}
        />
      </main>
    </div>
  );
};

export default App;