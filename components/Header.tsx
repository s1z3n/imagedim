
import React from 'react';

interface HeaderProps {
  onGenerate: () => void;
  isGenerating: boolean;
  onClear: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  isDrawingMode: boolean;
  onToggleDrawingMode: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
  onGenerate, isGenerating, onClear, canUndo, canRedo, onRedo, onUndo, isDrawingMode, onToggleDrawingMode 
}) => {
  return (
    <header className="bg-white shadow-md p-4 flex items-center justify-between z-10">
      <h1 className="text-xl font-bold text-gray-800">Image Dimension Annotator</h1>
      <div className="flex items-center space-x-2">
        <button onClick={onUndo} disabled={!canUndo || isGenerating || isDrawingMode} className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed">Undo</button>
        <button onClick={onRedo} disabled={!canRedo || isGenerating || isDrawingMode} className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed">Redo</button>
        <button 
          onClick={onToggleDrawingMode}
          disabled={isGenerating}
          className={`px-4 py-2 text-sm font-medium border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 ${isDrawingMode ? 'bg-indigo-100 text-indigo-700 border-indigo-300' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
        >
          Add Dimension
        </button>
        <button 
          onClick={onGenerate}
          disabled={isGenerating || isDrawingMode}
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:bg-indigo-400 w-48"
        >
          {isGenerating ? (
            <div className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generating...
            </div>
          ) : 'Generate Annotations'}
        </button>
        <button onClick={onClear} disabled={isGenerating || isDrawingMode} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50">
          Clear
        </button>
      </div>
    </header>
  );
};

export default Header;
