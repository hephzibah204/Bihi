import { logger } from '../utils/logger';

/**
 * Safe JSON parsing with fallback to empty object
 */
export async function safeJson(response: Response): Promise<any> {
  try {
    return await response.json();
  } catch (error) {
    logger.warn('Failed to parse JSON response', { error: error.message, status: response.status });
    return {};
  }
}

/**
 * Generic HTTP POST with JSON body and headers
 */
export async function postJson(
  url: string,
  body: any,
  headers: Record<string, string> = {},
  options: RequestInit = {}
): Promise<Response> {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(body),
    ...options,
  });
  
  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }
  
  return response;
}

/**
 * Generic HTTP GET with headers
 */
export async function getJson(
  url: string,
  headers: Record<string, string> = {},
  options: RequestInit = {}
): Promise<Response> {
  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    ...options,
  });
  
  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }
  
  return response;
}