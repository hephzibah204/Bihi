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
      const canvas = await html2canvas(el, { 
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
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
        const canvas = await html2canvas(el, { 
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff'
        });
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
      const canvas = await html2canvas(el, { 
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
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
  } catch {
    return null;
  }
}
