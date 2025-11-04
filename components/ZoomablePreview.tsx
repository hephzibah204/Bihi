import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';

interface ZoomablePreviewProps {
  children: React.ReactNode;
  minScale?: number;
  maxScale?: number;
  step?: number;
}

// Inject minimal print CSS to disable transform during printing
function ensurePrintStyles() {
  if (typeof document === 'undefined') return;
  const id = 'zoomable-preview-print-style';
  if (document.getElementById(id)) return;
  const style = document.createElement('style');
  style.id = id;
  style.textContent = `@media print { .zoomable-content { transform: none !important; } .zoom-controls { display: none !important; } }`;
  document.head.appendChild(style);
}

const ZoomablePreview: React.FC<ZoomablePreviewProps> = ({ children, minScale = 0.4, maxScale = 2.5, step = 0.1 }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => { ensurePrintStyles(); }, []);

  const fitToWidth = () => {
    const container = containerRef.current;
    const content = contentRef.current;
    if (!container || !content) return;
    const containerWidth = container.clientWidth;
    const contentWidth = content.scrollWidth || content.clientWidth || 1;
    const s = Math.max(minScale, Math.min(1, containerWidth / contentWidth));
    setScale(Number(s.toFixed(2)));
  };

  useLayoutEffect(() => {
    // Initial fit: prefer fit for narrow screens
    fitToWidth();
    const onResize = () => fitToWidth();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const zoomIn = () => setScale(s => Math.min(maxScale, Number((s + step).toFixed(2))));
  const zoomOut = () => setScale(s => Math.max(minScale, Number((s - step).toFixed(2))));
  const reset = () => setScale(1);

  return (
    <div className="w-full" ref={containerRef}>
      <div className="zoom-controls no-print flex items-center gap-2 justify-center mb-2">
        <button type="button" className="px-3 py-1.5 rounded bg-gray-100 hover:bg-gray-200 text-gray-800" onClick={zoomOut} aria-label="Zoom out">−</button>
        <div className="text-xs text-gray-600 w-12 text-center">{Math.round(scale * 100)}%</div>
        <button type="button" className="px-3 py-1.5 rounded bg-gray-100 hover:bg-gray-200 text-gray-800" onClick={zoomIn} aria-label="Zoom in">+</button>
        <button type="button" className="ml-2 px-3 py-1.5 rounded bg-gray-100 hover:bg-gray-200 text-gray-800" onClick={fitToWidth} aria-label="Fit to width">Fit</button>
        <button type="button" className="px-3 py-1.5 rounded bg-gray-100 hover:bg-gray-200 text-gray-800" onClick={reset} aria-label="Actual size">100%</button>
      </div>
      <div className="overflow-auto rounded-md border border-gray-100 bg-white shadow-sm">
        <div
          ref={contentRef}
          className="zoomable-content origin-top mx-auto"
          style={{ transform: `scale(${scale})`, transformOrigin: 'top center', width: 'fit-content' }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

export default ZoomablePreview;
