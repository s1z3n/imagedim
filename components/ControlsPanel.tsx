
import React from 'react';
import { Annotation, StyleOptions } from '../types';

interface ControlsPanelProps {
  styleOptions: StyleOptions;
  setStyleOptions: React.Dispatch<React.SetStateAction<StyleOptions>>;
  zoom: number;
  setZoom: (zoom: number) => void;
  selectedAnnotation: Annotation | null;
  updateAnnotation: (annotation: Annotation) => void;
}

const StyleSlider: React.FC<{label: string, value: number, onChange: (v: number) => void, min?: number, max?: number, step?: number}> = ({label, value, onChange, min=1, max=30, step=1}) => (
    <div>
        <label className="block text-sm font-medium text-gray-700">{label}</label>
        <div className="flex items-center space-x-2">
            <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={value}
                onChange={(e) => onChange(parseFloat(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <span className="text-sm w-10 text-right">{value}px</span>
        </div>
    </div>
);

const ControlsPanel: React.FC<ControlsPanelProps> = ({ styleOptions, setStyleOptions, zoom, setZoom, selectedAnnotation, updateAnnotation }) => {

  const handleStyleChange = <K extends keyof StyleOptions,>(key: K, value: StyleOptions[K]) => {
    setStyleOptions(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="w-1/4 max-w-xs bg-white p-4 rounded-lg shadow-md space-y-6 overflow-y-auto">
      <div>
        <h2 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">View Controls</h2>
        <div>
            <label className="block text-sm font-medium text-gray-700">Zoom</label>
            <div className="flex items-center space-x-2">
                <input
                    type="range"
                    min="0.25"
                    max="2"
                    step="0.05"
                    value={zoom}
                    onChange={(e) => setZoom(parseFloat(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-sm w-12 text-right">{(zoom * 100).toFixed(0)}%</span>
            </div>
        </div>
      </div>
      
      {selectedAnnotation && (
        <div>
          <h2 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">Edit Annotation</h2>
          <div>
              <label className="block text-sm font-medium text-gray-700">Dimension Text</label>
              <input
                  type="text"
                  value={selectedAnnotation.valueText}
                  onChange={(e) => updateAnnotation({ ...selectedAnnotation, valueText: e.target.value, labelPos: { ...selectedAnnotation.labelPos } })}
                  className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
          </div>
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">Line Styles</h2>
        <div className="space-y-4">
            <StyleSlider label="Stroke Width" value={styleOptions.strokeWidth} onChange={v => handleStyleChange('strokeWidth', v)} max={10}/>
            <StyleSlider label="Tick Size" value={styleOptions.arrowheadSize} onChange={v => handleStyleChange('arrowheadSize', v)}/>
            <div>
                <label className="block text-sm font-medium text-gray-700">Line Color</label>
                <input type="color" value={styleOptions.lineColor} onChange={e => handleStyleChange('lineColor', e.target.value)} className="w-full h-8 p-0 border-none cursor-pointer rounded"/>
            </div>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">Label Styles</h2>
        <div className="space-y-4">
            <StyleSlider label="Font Size" value={styleOptions.fontSize} onChange={v => handleStyleChange('fontSize', v)} min={10} max={24}/>
            <div>
                <label className="block text-sm font-medium text-gray-700">Text Color</label>
                <input type="color" value={styleOptions.textColor} onChange={e => handleStyleChange('textColor', e.target.value)} className="w-full h-8 p-0 border-none cursor-pointer rounded"/>
            </div>
            <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Label Box</span>
                 <button onClick={() => handleStyleChange('showLabelBox', !styleOptions.showLabelBox)} className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${styleOptions.showLabelBox ? 'bg-indigo-600' : 'bg-gray-200'}`}>
                    <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${styleOptions.showLabelBox ? 'translate-x-6' : 'translate-x-1'}`}/>
                </button>
            </div>
            {styleOptions.showLabelBox && (
                 <StyleSlider label="Box Padding" value={styleOptions.labelBoxPadding} onChange={v => handleStyleChange('labelBoxPadding', v)} min={4} max={16}/>
            )}
        </div>
      </div>
    </div>
  );
};

export default ControlsPanel;