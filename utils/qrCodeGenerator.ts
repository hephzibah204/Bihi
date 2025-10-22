// Simple QR Code generator using canvas
// This is a basic implementation for demonstration purposes

export interface QRCodeOptions {
  width?: number;
  margin?: number;
  color?: {
    dark?: string;
    light?: string;
  };
}

export class QRCodeGenerator {
  private static generateMatrix(text: string, size: number = 21): boolean[][] {
    // This is a simplified QR code matrix generator
    // In a real implementation, you would use proper QR code algorithms
    const matrix: boolean[][] = [];
    
    // Initialize matrix
    for (let i = 0; i < size; i++) {
      matrix[i] = new Array(size).fill(false);
    }
    
    // Add finder patterns (corners)
    this.addFinderPattern(matrix, 0, 0);
    this.addFinderPattern(matrix, size - 7, 0);
    this.addFinderPattern(matrix, 0, size - 7);
    
    // Add data (simplified - just create a pattern based on text)
    const textHash = this.simpleHash(text);
    for (let i = 9; i < size - 9; i++) {
      for (let j = 9; j < size - 9; j++) {
        matrix[i][j] = ((i + j + textHash) % 3) === 0;
      }
    }
    
    return matrix;
  }
  
  private static addFinderPattern(matrix: boolean[][], startX: number, startY: number): void {
    const pattern = [
      [true, true, true, true, true, true, true],
      [true, false, false, false, false, false, true],
      [true, false, true, true, true, false, true],
      [true, false, true, true, true, false, true],
      [true, false, true, true, true, false, true],
      [true, false, false, false, false, false, true],
      [true, true, true, true, true, true, true]
    ];
    
    for (let i = 0; i < 7; i++) {
      for (let j = 0; j < 7; j++) {
        if (startX + i < matrix.length && startY + j < matrix[0].length) {
          matrix[startX + i][startY + j] = pattern[i][j];
        }
      }
    }
  }
  
  private static simpleHash(text: string): number {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
  
  static toDataURL(text: string, options: QRCodeOptions = {}): Promise<string> {
    return new Promise((resolve, reject) => {
      try {
        const {
          width = 200,
          margin = 2,
          color = { dark: '#000000', light: '#FFFFFF' }
        } = options;
        
        const matrix = this.generateMatrix(text);
        const moduleSize = Math.floor((width - margin * 2) / matrix.length);
        const actualWidth = matrix.length * moduleSize + margin * 2;
        
        const canvas = document.createElement('canvas');
        canvas.width = actualWidth;
        canvas.height = actualWidth;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        
        // Fill background
        ctx.fillStyle = color.light || '#FFFFFF';
        ctx.fillRect(0, 0, actualWidth, actualWidth);
        
        // Draw modules
        ctx.fillStyle = color.dark || '#000000';
        for (let i = 0; i < matrix.length; i++) {
          for (let j = 0; j < matrix[i].length; j++) {
            if (matrix[i][j]) {
              ctx.fillRect(
                margin + j * moduleSize,
                margin + i * moduleSize,
                moduleSize,
                moduleSize
              );
            }
          }
        }
        
        resolve(canvas.toDataURL());
      } catch (error) {
        reject(error);
      }
    });
  }
}