/**
 * Simple PDF generation utility that bypasses complex CSS
 * This is a fallback when the main PDF generation fails
 */

export async function generateSimplePDF(elementId: string, filename: string): Promise<boolean> {
  try {
    const w = window as any;
    const { html2canvas, jspdf } = w;
    
    if (!html2canvas || !jspdf) {
      throw new Error('PDF libraries not loaded');
    }

    const element = document.getElementById(elementId);
    if (!element) {
      throw new Error('Element not found');
    }

    // Create a simplified clone of the element
    const clone = element.cloneNode(true) as HTMLElement;
    
    // Remove all existing styles and classes
    const allElements = clone.querySelectorAll('*');
    allElements.forEach(el => {
      if (el instanceof HTMLElement) {
        el.removeAttribute('class');
        el.removeAttribute('style');
      }
    });
    
    // Apply basic inline styles
    clone.style.cssText = `
      background: white;
      color: black;
      font-family: Arial, sans-serif;
      font-size: 14px;
      line-height: 1.4;
      padding: 20px;
      width: 800px;
      max-width: none;
    `;
    
    // Style tables
    const tables = clone.querySelectorAll('table');
    tables.forEach(table => {
      if (table instanceof HTMLElement) {
        table.style.cssText = `
          width: 100%;
          border-collapse: collapse;
          margin: 10px 0;
        `;
      }
    });
    
    const cells = clone.querySelectorAll('th, td');
    cells.forEach(cell => {
      if (cell instanceof HTMLElement) {
        cell.style.cssText = `
          border: 1px solid #ccc;
          padding: 8px;
          text-align: left;
        `;
        if (cell.tagName === 'TH') {
          cell.style.backgroundColor = '#f0f0f0';
          cell.style.fontWeight = 'bold';
        }
      }
    });
    
    // Style headings
    const headings = clone.querySelectorAll('h1, h2, h3, h4, h5, h6');
    headings.forEach(heading => {
      if (heading instanceof HTMLElement) {
        heading.style.cssText = `
          color: black;
          font-weight: bold;
          margin: 15px 0 10px 0;
        `;
      }
    });
    
    // Style paragraphs
    const paragraphs = clone.querySelectorAll('p');
    paragraphs.forEach(p => {
      if (p instanceof HTMLElement) {
        p.style.cssText = `
          margin: 8px 0;
          color: black;
        `;
      }
    });
    
    // Create a temporary container
    const tempContainer = document.createElement('div');
    tempContainer.style.cssText = `
      position: absolute;
      left: -9999px;
      top: -9999px;
      background: white;
    `;
    tempContainer.appendChild(clone);
    document.body.appendChild(tempContainer);
    
    try {
      // Generate PDF with minimal configuration
      const canvas = await html2canvas(clone, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: true,
        allowTaint: true,
        foreignObjectRendering: false
      });
      
      const { jsPDF } = jspdf;
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgData = canvas.toDataURL('image/png', 1.0);
      
      const A4_WIDTH = 210;
      const A4_HEIGHT = 297;
      pdf.addImage(imgData, 'PNG', 0, 0, A4_WIDTH, A4_HEIGHT, undefined, 'FAST');
      
      // Download the PDF
      const blob = pdf.output('blob');
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      
      return true;
    } finally {
      document.body.removeChild(tempContainer);
    }
  } catch (error) {
    console.error('Simple PDF generation failed:', error);
    return false;
  }
}

export function showPrintInstructions() {
  const instructions = `
PDF Generation Failed - Alternative Method:

1. Click the "Print" button below
2. In the print dialog, select "Save as PDF" or "Microsoft Print to PDF"
3. Choose your save location and filename
4. Click "Save"

This method works in all browsers and bypasses technical limitations.
  `;
  
  alert(instructions);
}
