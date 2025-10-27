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

// --- Standardized Payload Utilities ---

// Very lightweight checksum (sum of char codes mod 65535) to help detect typos
export function computeChecksum(input: string): string {
  let sum = 0;
  for (let i = 0; i < input.length; i++) sum = (sum + input.charCodeAt(i)) & 0xffff;
  return sum.toString(16).toUpperCase().padStart(4, '0');
}

/**
 * Build a standardized QR payload for attendance and verification.
 * Format: RS1|SID=<studentId>|ADM=<admissionNo>|TS=<unix_ms>|CS=<hex4>
 * - RS1: ReportSheet payload version 1
 * - SID: Student ID (preferred)
 * - ADM: Admission Number (legacy fallback)
 * - TS: Timestamp in ms since epoch
 * - CS: 4-hex checksum of the content without CS
 */
export function buildStandardQRPayload(studentId?: string, admissionNo?: string, timestamp?: number): string {
  const ts = typeof timestamp === 'number' ? timestamp : Date.now();
  const core = `RS1|SID=${studentId || ''}|ADM=${admissionNo || ''}|TS=${ts}`;
  const cs = computeChecksum(core);
  return `${core}|CS=${cs}`;
}

/**
 * Parse standardized payload. Returns null if format or checksum invalid.
 */
export function parseStandardQRPayload(payload: string): { studentId?: string; admissionNo?: string; timestamp?: number; signature?: string } | null {
  if (!payload || !payload.startsWith('RS1|')) return null;
  const parts = payload.split('|');
  const coreParts = [] as string[];
  let csPart = '';
  let sigPart = '';
  for (let i = 0; i < parts.length; i++) {
    if (parts[i].startsWith('CS=')) csPart = parts[i];
    else if (parts[i].startsWith('SIG=')) sigPart = parts[i];
    else coreParts.push(parts[i]);
  }
  const core = coreParts.join('|');
  if (!csPart.startsWith('CS=')) return null;
  const expected = csPart.slice(3);
  const actual = computeChecksum(core);
  if (expected !== actual) return null;
  const map = new Map<string, string>();
  for (let i = 1; i < parts.length; i++) {
    if (parts[i].startsWith('CS=') || parts[i].startsWith('SIG=')) continue;
    const [k, v] = parts[i].split('=');
    map.set(k, v);
  }
  const sid = map.get('SID') || undefined;
  const adm = map.get('ADM') || undefined;
  const tsStr = map.get('TS');
  const ts = tsStr ? Number(tsStr) : undefined;
  const signature = sigPart ? sigPart.slice(4) : undefined;
  return { studentId: sid, admissionNo: adm, timestamp: ts, signature };
}

// --- Signature (Demo) ---

async function sha256Base64(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hash = await crypto.subtle.digest('SHA-256', data);
  const bytes = new Uint8Array(hash);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

/**
 * Build RS1 payload with a demo signature (SHA-256 over core + secret, base64).
 * Note: For production, use HMAC (crypto.subtle.sign with 'HMAC') and a server-side secret.
 */
export async function buildSignedQRPayload(studentId?: string, admissionNo?: string, timestamp?: number, secret?: string): Promise<string> {
  const core = buildStandardQRPayload(studentId, admissionNo, timestamp);
  if (!secret) return core; // no signature
  const sig = await sha256Base64(core + '|' + secret);
  return `${core}|SIG=${sig}`;
}

/**
 * Verify RS1 payload signature (demo). Returns true if signature is present and matches.
 */
export async function verifyPayloadSignature(payload: string, secret?: string): Promise<boolean> {
  if (!secret || !payload.includes('SIG=')) return true; // nothing to verify
  // Extract signature
  const parts = payload.split('|');
  const sigPart = parts.find(p => p.startsWith('SIG='));
  if (!sigPart) return true;
  const provided = sigPart.slice(4);
  const core = parts.filter(p => !p.startsWith('SIG=')).join('|');
  const expected = await sha256Base64(core + '|' + secret);
  return provided === expected;
}