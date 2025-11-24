import { logger } from '../utils/logger';

/**
 * Safely parse JSON response with fallback
 */
export async function safeJson(response: Response): Promise<any> {
  try {
    return await response.json();
  } catch (error) {
    logger.warn('Failed to parse JSON response', { 
      error: error.message, 
      status: response.status,
      statusText: response.statusText,
      url: response.url 
    });
    return {};
  }
}

/**
 * Make a POST request with JSON body and return parsed JSON
 */
export async function postJson(url: string, data: any, headers: Record<string, string> = {}): Promise<any> {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      logger.error('HTTP request failed', {
        url,
        status: response.status,
        statusText: response.statusText
      });
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await safeJson(response);
  } catch (error) {
    logger.error('Failed to make POST request', {
      url,
      error: error.message
    });
    throw error;
  }
}

/**
 * Make a GET request and return parsed JSON
 */
export async function getJson(url: string, headers: Record<string, string> = {}): Promise<any> {
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers
    });

    if (!response.ok) {
      logger.error('HTTP GET request failed', {
        url,
        status: response.status,
        statusText: response.statusText
      });
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await safeJson(response);
  } catch (error) {
    logger.error('Failed to make GET request', {
      url,
      error: error.message
    });
    throw error;
  }
}

/**
 * Create a fetch wrapper with default headers and error handling
 */
export function createHttpClient(defaultHeaders: Record<string, string> = {}) {
  return {
    post: (url: string, data: any, headers: Record<string, string> = {}) => 
      postJson(url, data, { ...defaultHeaders, ...headers }),
    
    get: (url: string, headers: Record<string, string> = {}) => 
      getJson(url, { ...defaultHeaders, ...headers }),
    
    safeJson
  };
}