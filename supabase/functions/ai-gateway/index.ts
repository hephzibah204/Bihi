// supabase/functions/ai-gateway/index.ts
// Secure AI Gateway with input validation and sanitization

import { aiGatewayInputSchema, validateAndSanitize, getSecurityHeaders } from "../_shared/validation.ts";

export default {
  async fetch(req: Request): Promise<Response> {
    // Add security headers to all responses
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
        validatedInput = validateAndSanitize(aiGatewayInputSchema, body);
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

      const { input, conversationId, role, tenantId, topK, useOffline } = validatedInput;
      
      // Use the input field as the primary prompt source
      const prompt = input || body.prompt || '';
      
      if (!prompt) {
        return new Response(
          JSON.stringify({ error: 'empty_input' }), 
          { 
            status: 400, 
            headers: { 
              'Content-Type': 'application/json',
              ...securityHeaders 
            } 
          }
        );
      }

      // Additional input length check for DoS prevention
      if (prompt.length > 10000) {
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

      if (useOffline) {
        try {
          const { runOfflineModel } = await import('../../../lib/ai/offline-engine/offline_llm');
          const text = await runOfflineModel({ 
            prompt, 
            role: role as any, 
            tenantId, 
            conversationHistory: [], 
            topK 
          });
          
          const encoder = new TextEncoder();
          const stream = new ReadableStream({
            start(controller) {
              controller.enqueue(encoder.encode(JSON.stringify({ content: text })));
              controller.close();
            }
          });
          
          return new Response(stream, { 
            headers: { 
              'Content-Type': 'text/event-stream',
              ...securityHeaders 
            } 
          });
        } catch (offlineError) {
          console.error('Offline model error:', offlineError);
          return new Response(
            JSON.stringify({ error: 'offline_model_error' }), 
            { 
              status: 500, 
              headers: { 
                'Content-Type': 'application/json',
                ...securityHeaders 
              } 
            }
          );
        }
      }

      // Online model not configured
      return new Response(
        JSON.stringify({ content: 'online_not_configured' }), 
        { 
          headers: { 
            'Content-Type': 'application/json',
            ...securityHeaders 
          } 
        }
      );
    } catch (error) {
      console.error('AI Gateway error:', error);
      return new Response(
        JSON.stringify({ error: 'gateway_failure' }), 
        { 
          status: 500, 
          headers: { 
            'Content-Type': 'application/json',
            ...securityHeaders 
          } 
        }
      );
    }
  }
};