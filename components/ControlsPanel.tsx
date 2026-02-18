import React, { useRef } from 'react';
import { Annotation, StyleOptions, LineStyle } from '../types';

interface ControlsPanelProps {
  styleOptions: StyleOptions;
  setStyleOptions: React.Dispatch<React.SetStateAction<StyleOptions>>;
  selectedAnnotation: Annotation | null;
  updateAnnotation: (annotation: Annotation) => void;
  onDownload: (quality?: number) => void;
  isImageLoaded: boolean;
}

const StyleSlider: React.FC<{ label: string, value: number, onChange: (v: number) => void, min?: number, max?: number, step?: number }> = ({ label, value, onChange, min = 1, max = 30, step = 1 }) => (
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
];

const ColorSelector: React.FC<{ label: string, currentColor: string, onColorChange: (color: string) => void }> = ({ label, currentColor, onColorChange }) => {
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
          className="w-8 h-8 rounded-full border-2 border-gray-300 hover:border-gray-400 flex items-center justify-center overflow-hidden"
          style={{ background: 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)' }}
        >
          <span className="w-3 h-3 rounded-full bg-white border border-gray-300" />
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

const LINE_STYLES: { label: string; value: LineStyle; dashArray: string }[] = [
  { label: 'Solid', value: 'solid', dashArray: '' },
  { label: 'Dashed', value: 'dashed', dashArray: '6,4' },
  { label: 'Dotted', value: 'dotted', dashArray: '2,3' },
];

const LineStyleSelector: React.FC<{ currentStyle: LineStyle; onStyleChange: (style: LineStyle) => void }> = ({ currentStyle, onStyleChange }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700">Line Style</label>
    <div className="flex items-center space-x-1 mt-1">
      {LINE_STYLES.map(s => (
        <button
          key={s.value}
          title={s.label}
          onClick={() => onStyleChange(s.value)}
          className={`flex-1 flex items-center justify-center px-2 py-1.5 rounded-md border text-xs font-medium transition-all ${currentStyle === s.value
            ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
            : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
            }`}
        >
          <svg width="24" height="8" className="mr-1">
            <line x1="0" y1="4" x2="24" y2="4" stroke="currentColor" strokeWidth="2" strokeDasharray={s.dashArray} />
          </svg>
          {s.label}
        </button>
      ))}
    </div>
  </div>
);

const ControlsPanel: React.FC<ControlsPanelProps> = ({ styleOptions, setStyleOptions, selectedAnnotation, updateAnnotation, onDownload, isImageLoaded }) => {
  const textInputRef = useRef<HTMLInputElement>(null);

  const handleStyleChange = <K extends keyof StyleOptions,>(key: K, value: StyleOptions[K]) => {
    setStyleOptions(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="w-1/4 max-w-xs bg-white rounded-lg shadow-md flex flex-col" style={{ maxHeight: '100%' }}>
      <div className="flex-1 overflow-y-auto p-4 space-y-6">

        {selectedAnnotation && (
          <div>
            <h2 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">Edit Annotation</h2>
            <div className='space-y-4'>
              <div>
                <label htmlFor="annotation-text" className="block text-sm font-medium text-gray-700">Dimension Text</label>
                <input
                  ref={textInputRef}
                  id="annotation-text"
                  type="text"
                  value={selectedAnnotation.valueText}
                  onChange={(e) => updateAnnotation({ ...selectedAnnotation, valueText: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              <ColorSelector
                label="Line Color"
                currentColor={selectedAnnotation.lineColor || styleOptions.lineColor}
                onColorChange={color => updateAnnotation({ ...selectedAnnotation, lineColor: color })}
              />
              <LineStyleSelector
                currentStyle={selectedAnnotation.lineStyle || 'solid'}
                onStyleChange={style => updateAnnotation({ ...selectedAnnotation, lineStyle: style })}
              />
            </div>
          </div>
        )}

        <div>
          <h2 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">Line Styles</h2>
          <div className="space-y-4">
            <StyleSlider label="Stroke Width" value={styleOptions.strokeWidth} onChange={v => handleStyleChange('strokeWidth', v)} max={10} />
            <StyleSlider label="Tick Size" value={styleOptions.arrowheadSize} onChange={v => handleStyleChange('arrowheadSize', v)} />
            <ColorSelector label="Default Line Color" currentColor={styleOptions.lineColor} onColorChange={c => handleStyleChange('lineColor', c)} />
          </div>
        </div>

        <div>
          <h2 className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">Label Styles</h2>
          <div className="space-y-4">
            <StyleSlider label="Font Size" value={styleOptions.fontSize} onChange={v => handleStyleChange('fontSize', v)} min={10} max={24} />
            <div>
              <label className="block text-sm font-medium text-gray-700">Text Color</label>
              <input type="color" value={styleOptions.textColor} onChange={e => handleStyleChange('textColor', e.target.value)} className="w-full h-8 p-0 border-none cursor-pointer rounded" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Label Box</span>
              <button onClick={() => handleStyleChange('showLabelBox', !styleOptions.showLabelBox)} className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${styleOptions.showLabelBox ? 'bg-indigo-600' : 'bg-gray-200'}`}>
                <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${styleOptions.showLabelBox ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
            {styleOptions.showLabelBox && (
              <StyleSlider label="Box Padding" value={styleOptions.labelBoxPadding} onChange={v => handleStyleChange('labelBoxPadding', v)} min={4} max={16} />
            )}
          </div>
        </div>
      </div>
      <div className="flex-shrink-0 p-4 border-t bg-white rounded-b-lg">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">Export</h2>
        <div className="space-y-2">
          <button
            onClick={() => onDownload(1.0)}
            disabled={!isImageLoaded}
            className="w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Download JPG (100%)
          </button>
          <button
            onClick={() => onDownload(0.7)}
            disabled={!isImageLoaded}
            className="w-full px-4 py-2 text-sm font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-md shadow-sm hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-100 disabled:text-gray-400 disabled:border-gray-200 disabled:cursor-not-allowed"
          >
            Download JPG (70%)
          </button>
        </div>
      </div>
    </div>
  );
};

export default ControlsPanel;