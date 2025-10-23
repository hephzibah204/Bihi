export const sanitizeFilename = (s: string): string => {
  if (!s) return 'document';
  return s.replace(/[^a-z0-9\-\s_]/gi, '').trim();
};

/**
 * Download a single DOM element as an A4 PDF using html2canvas + jsPDF.
 * Pass a selector string (e.g., '.printable-content') or a direct HTMLElement.
 */
export async function downloadElementAsPdf(elementOrSelector: string | HTMLElement, filename: string) {
  const w = window as any;
  const { html2canvas, jspdf } = w;
  if (!html2canvas || !jspdf) {
    alert('PDF export library not loaded. Please try again.');
    return;
  }
  const el: HTMLElement | null = typeof elementOrSelector === 'string'
    ? (document.querySelector(elementOrSelector) as HTMLElement)
    : (elementOrSelector as HTMLElement);
  if (!el) {
    alert('Printable content not found.');
    return;
  }

  const { jsPDF } = jspdf;
  const canvas = await html2canvas(el, { scale: 2 });
  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF('p', 'mm', 'a4');
  const A4_WIDTH = 210;
  const A4_HEIGHT = 297;
  pdf.addImage(imgData, 'PNG', 0, 0, A4_WIDTH, A4_HEIGHT, undefined, 'FAST');
  pdf.save(sanitizeFilename(filename) + '.pdf');
}

/**
 * Download multiple elements (e.g., pages marked with '.page-break')
 * into a single A4 PDF file.
 */
export async function downloadElementsAsPdf(elementsOrSelector: string | HTMLElement[], filename: string) {
  const w = window as any;
  const { html2canvas, jspdf } = w;
  if (!html2canvas || !jspdf) {
    alert('PDF export library not loaded. Please try again.');
    return;
  }
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

  const { jsPDF } = jspdf;
  const pdf = new jsPDF('p', 'mm', 'a4');
  const A4_WIDTH = 210;
  const A4_HEIGHT = 297;

  for (let i = 0; i < elements.length; i++) {
    const canvas = await html2canvas(elements[i], { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    if (i > 0) pdf.addPage();
    pdf.addImage(imgData, 'PNG', 0, 0, A4_WIDTH, A4_HEIGHT, undefined, 'FAST');
  }

  pdf.save(sanitizeFilename(filename) + '.pdf');
}