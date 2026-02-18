import React from 'react';

interface ZoomToolbarProps {
    zoom: number;
    setZoom: (zoom: number) => void;
}

const ZOOM_STEP = 0.25;
const MIN_ZOOM = 0.25;
const MAX_ZOOM = 3;

const ZoomToolbar: React.FC<ZoomToolbarProps> = ({ zoom, setZoom }) => {
    const zoomIn = () => setZoom(Math.min(MAX_ZOOM, Math.round((zoom + ZOOM_STEP) * 100) / 100));
    const zoomOut = () => setZoom(Math.max(MIN_ZOOM, Math.round((zoom - ZOOM_STEP) * 100) / 100));
    const resetZoom = () => setZoom(1);

    const btnClass = "w-8 h-8 flex items-center justify-center rounded-md hover:bg-white/20 transition-colors text-white/90 hover:text-white";

    return (
        <div className="flex items-center gap-1 bg-gray-900/80 backdrop-blur-sm rounded-lg px-2 py-1.5 shadow-lg border border-white/10">
            {/* Zoom Out */}
            <button
                onClick={zoomOut}
                disabled={zoom <= MIN_ZOOM}
                className={`${btnClass} disabled:opacity-30 disabled:cursor-not-allowed`}
                title="Zoom out"
            >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <line x1="4" y1="8" x2="12" y2="8" />
                </svg>
            </button>

            {/* Zoom Percentage — click to reset */}
            <button
                onClick={resetZoom}
                className="min-w-[52px] px-2 h-8 flex items-center justify-center rounded-md hover:bg-white/20 transition-colors text-white text-xs font-medium tabular-nums"
                title="Reset to 100%"
            >
                {Math.round(zoom * 100)}%
            </button>

            {/* Zoom In */}
            <button
                onClick={zoomIn}
                disabled={zoom >= MAX_ZOOM}
                className={`${btnClass} disabled:opacity-30 disabled:cursor-not-allowed`}
                title="Zoom in"
            >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <line x1="4" y1="8" x2="12" y2="8" />
                    <line x1="8" y1="4" x2="8" y2="12" />
                </svg>
            </button>

            {/* Divider */}
            <div className="w-px h-5 bg-white/20 mx-1" />

            {/* Fit to screen */}
            <button
                onClick={resetZoom}
                className={btnClass}
                title="Fit to screen"
            >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="12" height="12" rx="1.5" />
                    <polyline points="5,2 5,5 2,5" />
                    <polyline points="11,2 11,5 14,5" />
                    <polyline points="5,14 5,11 2,11" />
                    <polyline points="11,14 11,11 14,11" />
                </svg>
            </button>
        </div>
    );
};

export default ZoomToolbar;
