import React, { useState, useCallback, useRef, useEffect } from 'react';
import type { Annotation, StyleOptions, Point } from './types';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useHistory } from './hooks/useHistory';
import { DEFAULT_STYLE_OPTIONS } from './constants';
import Header from './components/Header';
import ImageUploader from './components/ImageUploader';
import ControlsPanel from './components/ControlsPanel';
import CanvasArea from './components/CanvasArea';

const App: React.FC = () => {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [styleOptions, setStyleOptions] = useLocalStorage<StyleOptions>('styleOptions', DEFAULT_STYLE_OPTIONS);
  const [zoom, setZoom] = useState(1);
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null);
  
  const { state: annotations, setState: setAnnotations, undo, redo, canUndo, canRedo } = useHistory<Annotation[]>([]);
  
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [drawingState, setDrawingState] = useState<{ step: number; points: Point[] }>({ step: 0, points: [] });

  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const resizeObserver = new ResizeObserver(entries => {
      if (entries[0]) {
        const { width } = entries[0].contentRect;
        if(image) {
          const aspectRatio = image.naturalWidth / image.naturalHeight;
          setCanvasSize({ width, height: width / aspectRatio });
        } else {
            const height = entries[0].contentRect.height;
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
        const containerWidth = canvasContainerRef.current?.clientWidth || 800;
        const aspectRatio = img.naturalWidth / img.naturalHeight;
        setCanvasSize({ width: containerWidth, height: containerWidth / aspectRatio });
        setAnnotations([], true);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };
  
  const handleClear = () => {
    setAnnotations([]);
    setSelectedAnnotationId(null);
  };

  const toggleDrawingMode = useCallback(() => {
    setIsDrawingMode(prev => {
        const isNowDrawing = !prev;
        if (isNowDrawing) {
            setSelectedAnnotationId(null);
        }
        setDrawingState({ step: 0, points: [] }); // Reset on every toggle
        return isNowDrawing;
    });
  }, []);

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
        onToggleDrawingMode={toggleDrawingMode}
      />
      <main className="flex-grow flex p-4 gap-4 overflow-hidden">
        <div className="flex flex-col w-1/4 max-w-sm space-y-4">
          <div className="bg-white p-4 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold text-gray-700 mb-2">1. Upload Image</h2>
            <ImageUploader onImageUpload={handleImageUpload} />
          </div>
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
        />
      </main>
    </div>
  );
};

export default App;
