export const sanitizeFilename = (s: string): string => {
  if (!s) return 'document';
  return s.replace(/[^a-z0-9\-\s_]/gi, '').trim();
};

/**
 * Prepare element for printing by ensuring it's visible
 */
export function prepareElementForPrint(elementOrSelector: string | HTMLElement): { element: HTMLElement; restore: () => void } {
  const el: HTMLElement | null = typeof elementOrSelector === 'string'
    ? (document.querySelector(elementOrSelector) as HTMLElement)
    : (elementOrSelector as HTMLElement);
  
  if (!el) {
    throw new Error('Element not found for printing');
  }

  const hadOffscreen = el.classList.contains('offscreen');
  const originalDisplay = el.style.display;
  const originalVisibility = el.style.visibility;
  const originalOpacity = el.style.opacity;
  const originalPosition = el.style.position;
  const originalLeft = el.style.left;
  const originalTop = el.style.top;

  // Make element visible for printing
  if (hadOffscreen) {
    el.classList.remove('offscreen');
  }
  el.style.display = '';
  el.style.visibility = '';
  el.style.opacity = '';
  el.style.position = '';
  el.style.left = '';
  el.style.top = '';

  const restore = () => {
    if (hadOffscreen) {
      el.classList.add('offscreen');
    }
    el.style.display = originalDisplay;
    el.style.visibility = originalVisibility;
    el.style.opacity = originalOpacity;
    el.style.position = originalPosition;
    el.style.left = originalLeft;
    el.style.top = originalTop;
  };

  return { element: el, restore };
}

/**
 * Print an element by ensuring it's visible and triggering window.print()
 */
export function printElement(elementOrSelector?: string | HTMLElement) {
  try {
    let restore: (() => void) | null = null;
    
    if (elementOrSelector) {
      const prep = prepareElementForPrint(elementOrSelector);
      restore = prep.restore;
    }

    // Trigger print dialog
    window.print();

    // Restore after a short delay to allow print dialog to open
    if (restore) {
      setTimeout(() => {
        restore?.();
      }, 500);
    }
  } catch (error: any) {
    console.error('Print error:', error);
    // Fallback: just trigger print
    window.print();
  }
}

/**
 * Get html2canvas configuration that handles unsupported CSS functions
 */
function getHtml2CanvasConfig() {
  return {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
    ignoreElements: (element: any) => {
      // Skip elements that might cause issues
      return element.classList?.contains('no-pdf') || false;
    },
    onclone: (clonedDoc: Document) => {
      // Remove all existing stylesheets that might contain unsupported CSS functions
      const existingStyles = clonedDoc.querySelectorAll('style, link[rel="stylesheet"]');
      existingStyles.forEach(style => {
        if (style.textContent?.includes('oklch') || 
            style.textContent?.includes('color-mix') ||
            style.textContent?.includes('lab(') ||
            style.textContent?.includes('lch(') ||
            style.textContent?.includes('hwb(')) {
          style.remove();
        }
      });

      // Create a comprehensive CSS reset and override
      const style = clonedDoc.createElement('style');
      style.textContent = `
        /* Complete CSS reset for PDF generation */
        * {
          color: inherit !important;
          background-color: transparent !important;
          border-color: #d1d5db !important;
          animation: none !important;
          transition: none !important;
          transform: none !important;
          filter: none !important;
          backdrop-filter: none !important;
        }
        
        /* Base document styling */
        body, html {
          color: #111827 !important;
          background-color: #ffffff !important;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
        }
        
        /* Typography */
        h1, h2, h3, h4, h5, h6 { 
          color: #111827 !important; 
          font-weight: bold !important;
        }
        p, span, div, td, th { 
          color: #374151 !important; 
        }
        
        /* Common utility classes with safe hex colors */
        .text-gray-900, .text-slate-900 { color: #111827 !important; }
        .text-gray-800, .text-slate-800 { color: #1f2937 !important; }
        .text-gray-700, .text-slate-700 { color: #374151 !important; }
        .text-gray-600, .text-slate-600 { color: #4b5563 !important; }
        .text-gray-500, .text-slate-500 { color: #6b7280 !important; }
        .text-gray-400, .text-slate-400 { color: #9ca3af !important; }
        
        .bg-white { background-color: #ffffff !important; }
        .bg-gray-50, .bg-slate-50 { background-color: #f9fafb !important; }
        .bg-gray-100, .bg-slate-100 { background-color: #f3f4f6 !important; }
        .bg-gray-200, .bg-slate-200 { background-color: #e5e7eb !important; }
        
        .text-indigo-600 { color: #4f46e5 !important; }
        .text-indigo-500 { color: #6366f1 !important; }
        .bg-indigo-600 { background-color: #4f46e5 !important; }
        .bg-indigo-500 { background-color: #6366f1 !important; }
        .bg-indigo-50 { background-color: #eef2ff !important; }
        
        .text-red-600 { color: #dc2626 !important; }
        .text-red-500 { color: #ef4444 !important; }
        .bg-red-50 { background-color: #fef2f2 !important; }
        
        .text-green-600 { color: #16a34a !important; }
        .text-green-500 { color: #22c55e !important; }
        .bg-green-50 { background-color: #f0fdf4 !important; }
        
        .text-blue-600 { color: #2563eb !important; }
        .text-blue-500 { color: #3b82f6 !important; }
        .bg-blue-50 { background-color: #eff6ff !important; }
        
        /* Borders */
        .border-gray-200, .border-slate-200 { border-color: #e5e7eb !important; }
        .border-gray-300, .border-slate-300 { border-color: #d1d5db !important; }
        .border-gray-400, .border-slate-400 { border-color: #9ca3af !important; }
        
        /* Table styling */
        table { 
          border-collapse: collapse !important; 
          width: 100% !important;
        }
        th { 
          background-color: #f3f4f6 !important; 
          color: #111827 !important; 
          font-weight: bold !important;
          padding: 8px !important;
          border: 1px solid #d1d5db !important;
        }
        td { 
          color: #374151 !important; 
          padding: 8px !important;
          border: 1px solid #d1d5db !important;
        }
        
        /* Remove problematic pseudo-elements */
        *::before, *::after {
          display: none !important;
        }
        
        /* Ensure visibility */
        .printable-content, .report-card-page {
          background-color: #ffffff !important;
          color: #111827 !important;
          display: block !important;
          visibility: visible !important;
          opacity: 1 !important;
          position: static !important;
        }
      `;
      clonedDoc.head.appendChild(style);
      
      // Also remove any CSS custom properties that might contain unsupported functions
      const allElements = clonedDoc.querySelectorAll('*');
      allElements.forEach(el => {
        if (el instanceof HTMLElement) {
          // Clear inline styles that might contain problematic functions
          const style = el.getAttribute('style');
          if (style && (style.includes('oklch') || style.includes('color-mix') || style.includes('lab(') || style.includes('lch(') || style.includes('hwb('))) {
            el.removeAttribute('style');
          }
        }
      });
    }
  };
}

/**
 * Wait for PDF libraries to be loaded
 */
async function waitForPdfLibraries(maxWait = 5000): Promise<{ html2canvas: any; jsPDF: any }> {
  const w = window as any;
  const startTime = Date.now();
  
  while (Date.now() - startTime < maxWait) {
    const html2canvas = w.html2canvas;
    let jsPDF = null;
    
    // Try different ways jsPDF might be exposed
    if (w.jspdf?.jsPDF) {
      jsPDF = w.jspdf.jsPDF;
    } else if (w.jsPDF) {
      jsPDF = w.jsPDF;
    } else if (w.jspdf && typeof w.jspdf === 'function') {
      jsPDF = w.jspdf;
    }
    
    if (html2canvas && jsPDF) {
      return { html2canvas, jsPDF };
    }
    
    // Wait a bit before checking again
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  throw new Error('PDF libraries failed to load. Please refresh the page and try again.');
}

function triggerPdfDownload(pdf: any, filename: string) {
  try {
    const blob = pdf.output('blob');
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = sanitizeFilename(filename) + '.pdf';
    document.body.appendChild(a);
    a.click();
    // Small delay before removing to ensure download starts
    setTimeout(() => {
      a.remove();
      URL.revokeObjectURL(url);
    }, 100);
  } catch (e) {
    // Fallback to built-in save if necessary
    try { 
      pdf.save(sanitizeFilename(filename) + '.pdf'); 
    } catch (error: any) {
      console.error('Failed to save PDF:', error?.message || error);
      alert('Failed to download PDF. Please try using the Print button instead.');
    }
  }
}

/**
 * Download a single DOM element as an A4 PDF using html2canvas + jsPDF.
 * Pass a selector string (e.g., '.printable-content') or a direct HTMLElement.
 */
export async function downloadElementAsPdf(
  elementOrSelector: string | HTMLElement,
  filename: string,
  options?: { shouldCancel?: () => boolean }
) {
  try {
    // Wait for libraries to be available
    const { html2canvas, jsPDF: JsPDFClass } = await waitForPdfLibraries();
    
    const el: HTMLElement | null = typeof elementOrSelector === 'string'
      ? (document.querySelector(elementOrSelector) as HTMLElement)
      : (elementOrSelector as HTMLElement);
    if (!el) {
      alert('Printable content not found.');
      return;
    }

    if (options?.shouldCancel && options.shouldCancel()) return;
    
    // Ensure element is visible for capture
    const originalDisplay = el.style.display;
    const originalVisibility = el.style.visibility;
    const originalOpacity = el.style.opacity;
    const hadOffscreen = el.classList.contains('offscreen');
    if (hadOffscreen) {
      el.classList.remove('offscreen');
    }
    el.style.display = '';
    el.style.visibility = '';
    el.style.opacity = '';
    
    try {
      const canvas = await html2canvas(el, getHtml2CanvasConfig());
      
      if (options?.shouldCancel && options.shouldCancel()) return;
      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new JsPDFClass('p', 'mm', 'a4');
      const A4_WIDTH = 210;
      const A4_HEIGHT = 297;
      
      if (options?.shouldCancel && options.shouldCancel()) return;
      pdf.addImage(imgData, 'PNG', 0, 0, A4_WIDTH, A4_HEIGHT, undefined, 'FAST');
      if (options?.shouldCancel && options.shouldCancel()) return;
      triggerPdfDownload(pdf, filename);
    } finally {
      // Restore original styles
      if (hadOffscreen) {
        el.classList.add('offscreen');
      }
      el.style.display = originalDisplay;
      el.style.visibility = originalVisibility;
      el.style.opacity = originalOpacity;
    }
  } catch (error: any) {
    console.error('PDF download error:', error);
    alert(error?.message || 'Failed to generate PDF. Please try again or use the Print button.');
  }
}

/**
 * Download multiple elements (e.g., pages marked with '.page-break')
 * into a single A4 PDF file.
 */
export async function downloadElementsAsPdf(
  elementsOrSelector: string | HTMLElement[],
  filename: string,
  options?: { shouldCancel?: () => boolean }
) {
  try {
    // Wait for libraries to be available
    const { html2canvas, jsPDF: JsPDFClass } = await waitForPdfLibraries();
    
    let elements: HTMLElement[] = [];
    if (typeof elementsOrSelector === 'string') {
      elements = Array.from(document.querySelectorAll(elementsOrSelector)) as HTMLElement[];
    } else {
      elements = elementsOrSelector as HTMLElement[];
    }
    if (!elements.length) {
      alert('No printable pages found.');
      return;
    }

    const pdf = new JsPDFClass('p', 'mm', 'a4');
    const A4_WIDTH = 210;
    const A4_HEIGHT = 297;

    for (let i = 0; i < elements.length; i++) {
      if (options?.shouldCancel && options.shouldCancel()) return;
      
      const el = elements[i];
      // Ensure element is visible for capture
      const hadOffscreen = el.classList.contains('offscreen');
      if (hadOffscreen) {
        el.classList.remove('offscreen');
      }
      const originalDisplay = el.style.display;
      const originalVisibility = el.style.visibility;
      el.style.display = '';
      el.style.visibility = '';
      
      try {
        const canvas = await html2canvas(el, getHtml2CanvasConfig());
        if (options?.shouldCancel && options.shouldCancel()) return;
        const imgData = canvas.toDataURL('image/png', 1.0);
        if (i > 0) pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, 0, A4_WIDTH, A4_HEIGHT, undefined, 'FAST');
      } finally {
        // Restore original styles
        if (hadOffscreen) {
          el.classList.add('offscreen');
        }
        el.style.display = originalDisplay;
        el.style.visibility = originalVisibility;
      }
    }
    if (options?.shouldCancel && options.shouldCancel()) return;
    triggerPdfDownload(pdf, filename);
  } catch (error: any) {
    console.error('PDF download error:', error);
    alert(error?.message || 'Failed to generate PDF. Please try again or use the Print button.');
  }
}

export async function renderElementAsPdfBlob(elementOrSelector: string | HTMLElement) {
  try {
    const { html2canvas, jsPDF: JsPDFClass } = await waitForPdfLibraries();
    const el: HTMLElement | null = typeof elementOrSelector === 'string'
      ? (document.querySelector(elementOrSelector) as HTMLElement)
      : (elementOrSelector as HTMLElement);
    if (!el) return null;
    
    // Ensure element is visible for capture
    const hadOffscreen = el.classList.contains('offscreen');
    if (hadOffscreen) {
      el.classList.remove('offscreen');
    }
    const originalDisplay = el.style.display;
    const originalVisibility = el.style.visibility;
    el.style.display = '';
    el.style.visibility = '';
    
    try {
      // Try with aggressive CSS reset first
      let canvas;
      try {
        canvas = await html2canvas(el, getHtml2CanvasConfig());
      } catch (cssError) {
        console.warn('First attempt failed, trying with minimal config:', cssError);
        // Fallback with minimal configuration
        canvas = await html2canvas(el, {
          scale: 1,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          allowTaint: true,
          foreignObjectRendering: false,
          ignoreElements: () => false,
          onclone: (clonedDoc: Document) => {
            // Minimal CSS reset - just remove problematic stylesheets
            const links = clonedDoc.querySelectorAll('link[rel="stylesheet"]');
            links.forEach(link => link.remove());
            const styles = clonedDoc.querySelectorAll('style');
            styles.forEach(style => {
              if (style.textContent?.includes('oklch') || 
                  style.textContent?.includes('color-mix') ||
                  style.textContent?.includes('lab(') ||
                  style.textContent?.includes('lch(') ||
                  style.textContent?.includes('hwb(')) {
                style.remove();
              }
            });
            
            // Add only essential styles
            const basicStyle = clonedDoc.createElement('style');
            basicStyle.textContent = `
              * { color: #000 !important; background: transparent !important; }
              body { background: #fff !important; }
              table { border-collapse: collapse !important; }
              th, td { border: 1px solid #ccc !important; padding: 4px !important; }
              th { background: #f0f0f0 !important; }
            `;
            clonedDoc.head.appendChild(basicStyle);
          }
        });
      }
      
      const imgData = canvas.toDataURL('image/png', 1.0);
      const pdf = new JsPDFClass('p', 'mm', 'a4');
      const A4_WIDTH = 210;
      const A4_HEIGHT = 297;
      pdf.addImage(imgData, 'PNG', 0, 0, A4_WIDTH, A4_HEIGHT, undefined, 'FAST');
      return pdf.output('blob');
    } finally {
      if (hadOffscreen) {
        el.classList.add('offscreen');
      }
      el.style.display = originalDisplay;
      el.style.visibility = originalVisibility;
    }
  } catch (error) {
    console.error('PDF blob generation failed:', error);
    return null;
  }
}
