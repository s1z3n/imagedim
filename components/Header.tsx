import React from 'react';

interface HeaderProps {
  onClear: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  isDrawingMode: boolean;
  onToggleDrawingMode: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
  onClear, canUndo, canRedo, onRedo, onUndo, isDrawingMode, onToggleDrawingMode 
}) => {
  return (
    <header className="bg-white shadow-md p-4 flex items-center justify-between z-10">
      <h1 className="text-xl font-bold text-gray-800">Image Dimension Annotator</h1>
      <div className="flex items-center space-x-2">
        <button onClick={onUndo} disabled={!canUndo || isDrawingMode} className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed">Undo</button>
        <button onClick={onRedo} disabled={!canRedo || isDrawingMode} className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed">Redo</button>
        <button 
          onClick={onToggleDrawingMode}
          className={`px-4 py-2 text-sm font-medium border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 ${isDrawingMode ? 'bg-indigo-100 text-indigo-700 border-indigo-300' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
        >
          Add Dimension
        </button>
        <button onClick={onClear} disabled={isDrawingMode} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50">
          Clear
        </button>
      </div>
    </header>
  );
};

export default Header;
