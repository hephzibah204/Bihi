/**
 * Clean PDF Generator - Creates PDFs by extracting content and rebuilding with safe HTML/CSS
 * This completely bypasses any CSS compatibility issues
 */

interface TableData {
  headers: string[];
  rows: string[][];
}

interface ContentSection {
  type: 'heading' | 'paragraph' | 'table' | 'grid';
  content: string | TableData | { [key: string]: string };
  level?: number; // for headings
}

export async function generateCleanPDF(elementId: string, filename: string): Promise<boolean> {
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

    // Extract content from the original element
    const content = extractContent(element);
    
    // Create clean HTML
    const cleanHtml = createCleanHtml(content);
    
    // Create temporary container with clean HTML
    const tempContainer = document.createElement('div');
    tempContainer.innerHTML = cleanHtml;
    tempContainer.style.cssText = `
      position: absolute;
      left: -9999px;
      top: -9999px;
      width: 800px;
      background: white;
      font-family: Arial, sans-serif;
      font-size: 14px;
      line-height: 1.4;
      color: black;
      padding: 20px;
    `;
    
    document.body.appendChild(tempContainer);
    
    try {
      // Generate PDF with the clean HTML
      const canvas = await html2canvas(tempContainer, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
        useCORS: false,
        allowTaint: false,
        foreignObjectRendering: false,
        removeContainer: false
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
    console.error('Clean PDF generation failed:', error);
    return false;
  }
}

function extractContent(element: HTMLElement): ContentSection[] {
  const content: ContentSection[] = [];
  
  // Extract headings
  const headings = element.querySelectorAll('h1, h2, h3, h4, h5, h6');
  headings.forEach(heading => {
    const level = parseInt(heading.tagName.charAt(1));
    content.push({
      type: 'heading',
      content: heading.textContent || '',
      level
    });
  });
  
  // Extract paragraphs
  const paragraphs = element.querySelectorAll('p');
  paragraphs.forEach(p => {
    const text = p.textContent?.trim();
    if (text) {
      content.push({
        type: 'paragraph',
        content: text
      });
    }
  });
  
  // Extract tables
  const tables = element.querySelectorAll('table');
  tables.forEach(table => {
    const tableData = extractTableData(table);
    if (tableData.headers.length > 0 || tableData.rows.length > 0) {
      content.push({
        type: 'table',
        content: tableData
      });
    }
  });
  
  // Extract key-value pairs from divs (for report card info)
  const infoSections = element.querySelectorAll('.grid, .flex');
  infoSections.forEach(section => {
    const gridData: { [key: string]: string } = {};
    const items = section.querySelectorAll('div, p, span');
    
    items.forEach(item => {
      const text = item.textContent?.trim();
      if (text && text.includes(':')) {
        const [key, ...valueParts] = text.split(':');
        const value = valueParts.join(':').trim();
        if (key && value) {
          gridData[key.trim()] = value;
        }
      }
    });
    
    if (Object.keys(gridData).length > 0) {
      content.push({
        type: 'grid',
        content: gridData
      });
    }
  });
  
  return content;
}

function extractTableData(table: HTMLTableElement): TableData {
  const headers: string[] = [];
  const rows: string[][] = [];
  
  // Extract headers
  const headerRow = table.querySelector('thead tr, tr:first-child');
  if (headerRow) {
    const headerCells = headerRow.querySelectorAll('th, td');
    headerCells.forEach(cell => {
      headers.push(cell.textContent?.trim() || '');
    });
  }
  
  // Extract data rows
  const dataRows = table.querySelectorAll('tbody tr, tr:not(:first-child)');
  dataRows.forEach(row => {
    const rowData: string[] = [];
    const cells = row.querySelectorAll('td, th');
    cells.forEach(cell => {
      rowData.push(cell.textContent?.trim() || '');
    });
    if (rowData.length > 0) {
      rows.push(rowData);
    }
  });
  
  return { headers, rows };
}

function createCleanHtml(content: ContentSection[]): string {
  let html = `
    <div style="
      background: white;
      color: black;
      font-family: Arial, sans-serif;
      font-size: 14px;
      line-height: 1.4;
      padding: 20px;
      max-width: none;
    ">
  `;
  
  content.forEach(section => {
    switch (section.type) {
      case 'heading':
        const level = section.level || 1;
        const fontSize = Math.max(24 - (level * 2), 14);
        html += `
          <h${level} style="
            color: black;
            font-size: ${fontSize}px;
            font-weight: bold;
            margin: 20px 0 10px 0;
            text-align: center;
          ">${escapeHtml(section.content as string)}</h${level}>
        `;
        break;
        
      case 'paragraph':
        html += `
          <p style="
            color: black;
            margin: 8px 0;
            line-height: 1.4;
          ">${escapeHtml(section.content as string)}</p>
        `;
        break;
        
      case 'table':
        const tableData = section.content as TableData;
        html += createTableHtml(tableData);
        break;
        
      case 'grid':
        const gridData = section.content as { [key: string]: string };
        html += createGridHtml(gridData);
        break;
    }
  });
  
  html += '</div>';
  return html;
}

function createTableHtml(tableData: TableData): string {
  let html = `
    <table style="
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
      background: white;
    ">
  `;
  
  // Headers
  if (tableData.headers.length > 0) {
    html += '<thead><tr>';
    tableData.headers.forEach(header => {
      html += `
        <th style="
          border: 1px solid #ccc;
          padding: 8px;
          background: #f0f0f0;
          color: black;
          font-weight: bold;
          text-align: left;
        ">${escapeHtml(header)}</th>
      `;
    });
    html += '</tr></thead>';
  }
  
  // Rows
  if (tableData.rows.length > 0) {
    html += '<tbody>';
    tableData.rows.forEach(row => {
      html += '<tr>';
      row.forEach(cell => {
        html += `
          <td style="
            border: 1px solid #ccc;
            padding: 8px;
            color: black;
            text-align: left;
          ">${escapeHtml(cell)}</td>
        `;
      });
      html += '</tr>';
    });
    html += '</tbody>';
  }
  
  html += '</table>';
  return html;
}

function createGridHtml(gridData: { [key: string]: string }): string {
  let html = `
    <div style="
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
      margin: 15px 0;
      padding: 10px;
      border: 1px solid #ddd;
      background: #f9f9f9;
    ">
  `;
  
  Object.entries(gridData).forEach(([key, value]) => {
    html += `
      <div style="color: black;">
        <strong>${escapeHtml(key)}:</strong> ${escapeHtml(value)}
      </div>
    `;
  });
  
  html += '</div>';
  return html;
}

function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

export function showAdvancedPrintInstructions() {
  const modal = document.createElement('div');
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
  `;
  
  modal.innerHTML = `
    <div style="
      background: white;
      padding: 30px;
      border-radius: 8px;
      max-width: 500px;
      margin: 20px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
    ">
      <h2 style="margin-top: 0; color: #333;">PDF Generation Help</h2>
      
      <h3 style="color: #555; margin-top: 20px;">Method 1: Browser Print to PDF</h3>
      <ol style="color: #666; line-height: 1.6;">
        <li>Click the "Print" button</li>
        <li>In the print dialog, change destination to "Save as PDF"</li>
        <li>Adjust settings if needed (margins, scale)</li>
        <li>Click "Save" and choose location</li>
      </ol>
      
      <h3 style="color: #555; margin-top: 20px;">Method 2: Try Different Browser</h3>
      <p style="color: #666; line-height: 1.6;">
        Chrome and Edge typically work best for PDF generation. Firefox and Safari may have compatibility issues.
      </p>
      
      <h3 style="color: #555; margin-top: 20px;">Method 3: Disable Extensions</h3>
      <p style="color: #666; line-height: 1.6;">
        Ad blockers and other browser extensions can interfere with PDF generation. Try disabling them temporarily.
      </p>
      
      <button onclick="this.parentElement.parentElement.remove()" style="
        background: #4f46e5;
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 4px;
        cursor: pointer;
        margin-top: 20px;
        float: right;
      ">Close</button>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  // Close on background click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.remove();
    }
  });
}
