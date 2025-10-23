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
        'process.env.HUGGINGFACE_API_KEY': JSON.stringify(env.HUGGINGFACE_API_KEY)
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
        name: 'mock-webviewClick',
        configureServer(server) {
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
        }
      });
    }
    
    return config;
});
