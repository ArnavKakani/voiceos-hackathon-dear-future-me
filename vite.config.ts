import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  assetsInclude: ['**/*.JPG', '**/*.JPEG', '**/*.PNG', '**/*.WEBP', '**/*.AVIF'],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
