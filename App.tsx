import React, { useState, useCallback, useRef, useEffect } from 'react';
import type { Annotation, StyleOptions, Point } from './types';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useHistory } from './hooks/useHistory';
import { DEFAULT_STYLE_OPTIONS } from './constants';
import Header from './components/Header';
import ImageUploader from './components/ImageUploader';
import ControlsPanel from './components/ControlsPanel';
import CanvasArea from './components/CanvasArea';
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
      <li>Click three times on the image to define a dimension line:
          <ul className="list-disc list-inside ml-4 mt-1">
              <li>First click: Start point.</li>
              <li>Second click: End point.</li>
              <li>Third click: Set distance from object.</li>
          </ul>
      </li>
      <li>Use the controls on the right to adjust styles and zoom.</li>
      <li>Click on any annotation to select, move, or resize it.</li>
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
  
  const { state: annotations, setState: setAnnotations, undo, redo, canUndo, canRedo } = useHistory<Annotation[]>([]);
  
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [drawingState, setDrawingState] = useState<{ step: number; points: Point[] }>({ step: 0, points: [] });

  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  const toggleDrawingMode = useCallback((force?: boolean) => {
    setIsDrawingMode(prev => {
      const isNowDrawing = force !== undefined ? force : !prev;
      if (isNowDrawing) {
        setSelectedAnnotationId(null);
      }
      setDrawingState({ step: 0, points: [] }); // Reset on every toggle/change
      return isNowDrawing;
    });
  }, []);

  useEffect(() => {
    const resizeObserver = new ResizeObserver(entries => {
      if (entries[0] && canvasContainerRef.current) {
        const container = canvasContainerRef.current;
        if(image) {
          const newSize = calculateFitToScreenSize(image, container);
          if (newSize.width > 0) {
            setCanvasSize(newSize);
          }
        } else {
            const { width, height } = entries[0].contentRect;
            setCanvasSize({ width, height });
        }
      }
    });

    if (canvasContainerRef.current) {
      resizeObserver.observe(canvasContainerRef.current);
    }
    
    return () => resizeObserver.disconnect();
  }, [image]);


  const handleImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        setImage(img);
        setOriginalFileName(file.name);
        setAnnotations([], true);
        setZoom(1); // Reset zoom to 100% (which is now fit-to-screen)
        toggleDrawingMode(true);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };
  
  const handleClear = () => {
    setAnnotations([]);
    setSelectedAnnotationId(null);
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
    const qualitySuffix = Math.round(quality * 100);
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
          <Instructions />
        </div>
        
        <div className="flex-grow flex flex-col items-center justify-center bg-gray-200 rounded-lg shadow-inner overflow-hidden" ref={canvasContainerRef}>
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
              canvasSize={canvasSize}
              isDrawingMode={isDrawingMode}
              drawingState={drawingState}
              setDrawingState={setDrawingState}
              addAnnotation={addAnnotation}
              onToggleDrawingMode={toggleDrawingMode}
            />
          ) : (
            <div className="text-gray-500">Please upload an image to begin</div>
          )}
        </div>

        <ControlsPanel
          styleOptions={styleOptions}
          setStyleOptions={setStyleOptions}
          zoom={zoom}
          setZoom={setZoom}
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