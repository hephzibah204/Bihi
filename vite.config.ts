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
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
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
    
    return config;
});
