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
          className={`inline-flex items-center px-4 py-2 text-sm font-medium border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 ${
            isDrawingMode 
              ? 'bg-indigo-100 text-indigo-700 border-indigo-300' 
              : 'bg-indigo-600 text-white border-transparent hover:bg-indigo-700'
          }`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 3a1 1 0 000 2v10a1 1 0 001 1h12a1 1 0 100-2H5V5h10a1 1 0 100-2H4a1 1 0 00-1 1zm3 2a1 1 0 011-1h1a1 1 0 110 2H7a1 1 0 01-1-1zm3 0a1 1 0 011-1h3a1 1 0 110 2h-3a1 1 0 01-1-1zm5 0a1 1 0 011-1h1a1 1 0 110 2h-1a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
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