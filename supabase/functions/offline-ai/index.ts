import { offlineAiInputSchema, validateAndSanitize, getSecurityHeaders } from "../_shared/validation.ts";

export default { 
  async fetch(req: Request): Promise<Response> {
    const securityHeaders = getSecurityHeaders();
    
    try {
      // Only allow POST requests
      if (req.method !== 'POST') {
        return new Response(
          JSON.stringify({ error: 'Method not allowed' }), 
          { 
            status: 405, 
            headers: { 
              'Content-Type': 'application/json',
              ...securityHeaders 
            } 
          }
        );
      }

      // Parse and validate request body
      let body;
      try {
        body = await req.json();
      } catch (parseError) {
        return new Response(
          JSON.stringify({ error: 'Invalid JSON in request body' }), 
          { 
            status: 400, 
            headers: { 
              'Content-Type': 'application/json',
              ...securityHeaders 
            } 
          }
        );
      }

      // Validate and sanitize input using Zod schema
      let validatedInput;
      try {
        validatedInput = validateAndSanitize(offlineAiInputSchema, body);
      } catch (validationError) {
        return new Response(
          JSON.stringify({ 
            error: 'Validation failed', 
            details: validationError instanceof Error ? validationError.message : 'Invalid input data'
          }), 
          { 
            status: 400, 
            headers: { 
              'Content-Type': 'application/json',
              ...securityHeaders 
            } 
          }
        );
      }

      const { input, role, tenantId } = validatedInput;
      
      // Additional input length check for DoS prevention
      if (input.length > 10000) {
        return new Response(
          JSON.stringify({ error: 'input_too_long' }), 
          { 
            status: 400, 
            headers: { 
              'Content-Type': 'application/json',
              ...securityHeaders 
            } 
          }
        );
      }

      const { runOfflineModel } = await import('../../../lib/ai/offline-engine/offline_llm');
      const text = await runOfflineModel({ 
        prompt: input, 
        role: role as any, 
        tenantId 
      });
      
      return new Response(
        JSON.stringify({ content: text }), 
        { 
          headers: { 
            'content-type': 'application/json',
            ...securityHeaders
          } 
        }
      );
    } catch (error) {
      console.error('Offline AI error:', error);
      return new Response(
        JSON.stringify({ error: 'offline_failure' }), 
        { 
          status: 500, 
          headers: { 
            'content-type': 'application/json',
            ...securityHeaders
          } 
        }
      );
    }
  } 
};