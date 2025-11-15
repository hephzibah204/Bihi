// A utility function to convert an array of objects to a CSV string and trigger a download.

export const exportToCSV = (data: any[], filename: string) => {
    if (!data || data.length === 0) {
        alert("No data to export.");
        return;
    }

    const headers = Object.keys(data[0]);
    
    // Function to handle values that might contain commas
    const escapeCsvValue = (value: any): string => {
        if (value === null || value === undefined) {
            return '';
        }
        const stringValue = String(value);
        // If the value contains a comma, double quote, or newline, wrap it in double quotes
        if (/[",\n\r]/.test(stringValue)) {
            return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
    };

    const csvRows = [
        headers.join(','), // Header row
        ...data.map(row => 
            headers.map(header => escapeCsvValue(row[header])).join(',')
        )
    ];

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};

export const parseCSV = (text: string): { headers: string[]; rows: string[][] } => {
    const rows: string[][] = [];
    let i = 0;
    const len = text.length;
    let current: string[] = [];
    let field = '';
    let inQuotes = false;
    while (i < len) {
        const ch = text[i];
        if (inQuotes) {
            if (ch === '"') {
                if (text[i + 1] === '"') {
                    field += '"';
                    i += 2;
                    continue;
                } else {
                    inQuotes = false;
                    i++;
                    continue;
                }
            } else {
                field += ch;
                i++;
                continue;
            }
        } else {
            if (ch === '"') {
                inQuotes = true;
                i++;
                continue;
            }
            if (ch === ',') {
                current.push(field.trim());
                field = '';
                i++;
                continue;
            }
            if (ch === '\n') {
                current.push(field.trim());
                field = '';
                if (current.some(v => v !== '')) rows.push(current);
                current = [];
                i++;
                continue;
            }
            if (ch === '\r') {
                i++;
                continue;
            }
            field += ch;
            i++;
        }
    }
    current.push(field.trim());
    if (current.some(v => v !== '')) rows.push(current);
    const headers = (rows.shift() || []).map(h => h.trim());
    return { headers, rows };
};
