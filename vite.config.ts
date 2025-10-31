import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const isDevelopment = mode === 'development';
    
    // Base configuration
    const config: any = {
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.HUGGINGFACE_API_KEY': JSON.stringify(env.HUGGINGFACE_API_KEY),
        // Banana credentials
        'process.env.BANANA_API_KEY': JSON.stringify(env.BANANA_API_KEY),
        'process.env.BANANA_MODEL_KEY': JSON.stringify(env.BANANA_MODEL_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        rollupOptions: {
          output: {
            manualChunks: {
              vendor: ['react', 'react-dom'],
              supabase: ['@supabase/supabase-js']
            }
          }
        }
      }
    };
    
    // Only add server config for development
    if (isDevelopment) {
      config.server = {
        port: 3002,
        host: '0.0.0.0',
        hmr: true,
        // Only use proxy if local API server is available
        proxy: env.VITE_USE_LOCAL_API === 'true' ? {
          '/api': {
            target: env.VITE_LOCAL_API_URL || 'http://localhost:3001',
            changeOrigin: true,
            secure: false,
          }
        } : undefined
      };
    }

    // Dev-only mock for /api/webviewClick when not using local API
    if (isDevelopment && env.VITE_USE_LOCAL_API !== 'true') {
      config.plugins.push({
        name: 'mock-api-endpoints',
        configureServer(server) {
          // Simple mock for /api/webviewClick
          server.middlewares.use('/api/webviewClick', (req, res) => {
            const method = req.method || 'GET';
            if (method !== 'POST' && method !== 'GET') {
              res.statusCode = 405;
              res.end('Method Not Allowed');
              return;
            }
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', () => {
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ ok: true, route: '/api/webviewClick', ts: Date.now() }));
            });
          });

          // Dev-only mock for signup endpoint to avoid 404 during local dev
          server.middlewares.use('/api/register', async (req, res) => {
            const method = req.method || 'GET';
            if (method !== 'POST') {
              res.statusCode = 405;
              res.end('Method Not Allowed');
              return;
            }
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', () => {
              try {
                const data = body ? JSON.parse(body) : {};
                // Basic validation (mirror UI requirements)
                const required = ['schoolName', 'subdomain', 'adminEmail', 'adminPassword', 'adminName'];
                const missing = required.filter(k => !data[k]);
                if (missing.length) {
                  res.statusCode = 400;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ error: 'Missing required fields', details: missing.join(', ') }));
                  return;
                }
                // Simulate success response
                res.statusCode = 201;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ message: 'Registration successful! (dev mock)' }));
              } catch (e) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Invalid JSON' }));
              }
            });
          });
        }
      });
    }
    
    return config;
});
