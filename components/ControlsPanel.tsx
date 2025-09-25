
import React, { useRef } from 'react';
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

const PRESET_COLORS = [
    { name: 'Black', value: '#111827' },
    { name: 'Light Grey', value: '#E5E7EB' },
    { name: 'Light Red', value: '#FCA5A5' },
];

const ColorSelector: React.FC<{label: string, currentColor: string, onColorChange: (color: string) => void}> = ({ label, currentColor, onColorChange }) => {
    const colorInputRef = useRef<HTMLInputElement>(null);

    return (
        <div>
            <label className="block text-sm font-medium text-gray-700">{label}</label>
            <div className="flex items-center space-x-2 mt-1">
                {PRESET_COLORS.map(color => (
                    <button
                        key={color.name}
                        title={color.name}
                        onClick={() => onColorChange(color.value)}
                        className={`w-8 h-8 rounded-full border-2 transition-all ${currentColor.toLowerCase() === color.value.toLowerCase() ? 'border-indigo-500 scale-110' : 'border-transparent'}`}
                        style={{ backgroundColor: color.value }}
                    />
                ))}
                <button
                    title="Choose a custom color"
                    onClick={() => colorInputRef.current?.click()}
                    className="w-8 h-8 rounded-full border-2 flex items-center justify-center bg-gray-100 hover:bg-gray-200"
                >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" fill="url(#a)"/><path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" stroke="#71717A" strokeWidth="2" strokeLinejoin="round"/><defs><radialGradient id="a" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="matrix(0 9 -9 0 12 12)"><stop stopColor="#fff"/><stop offset="1" stopOpacity="0"/></radialGradient></defs></svg>
                </button>
                <input
                    type="color"
                    ref={colorInputRef}
                    value={currentColor}
                    onChange={e => onColorChange(e.target.value)}
                    className="opacity-0 w-0 h-0 absolute"
                />
            </div>
        </div>
    );
};

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
          <div className='space-y-4'>
            <div>
                <label className="block text-sm font-medium text-gray-700">Dimension Text</label>
                <input
                    type="text"
                    value={selectedAnnotation.valueText}
                    onChange={(e) => updateAnnotation({ ...selectedAnnotation, valueText: e.target.value, labelPos: { ...selectedAnnotation.labelPos } })}
                    className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
            </div>
             <ColorSelector
                label="Line Color"
                currentColor={selectedAnnotation.lineColor || styleOptions.lineColor}
                onColorChange={color => updateAnnotation({ ...selectedAnnotation, lineColor: color })}
            />
          </div>
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">Line Styles</h2>
        <div className="space-y-4">
            <StyleSlider label="Stroke Width" value={styleOptions.strokeWidth} onChange={v => handleStyleChange('strokeWidth', v)} max={10}/>
            <StyleSlider label="Tick Size" value={styleOptions.arrowheadSize} onChange={v => handleStyleChange('arrowheadSize', v)}/>
            <ColorSelector label="Default Line Color" currentColor={styleOptions.lineColor} onColorChange={c => handleStyleChange('lineColor', c)} />
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