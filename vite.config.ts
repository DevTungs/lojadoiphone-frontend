import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import type { ConfigEnv } from 'vite';

export default ({ mode }: ConfigEnv) => {
  const env = loadEnv(mode, process.cwd(), '');

  const apiUrl = env.VITE_API_URL || 'http://localhost:3000/api';

  return defineConfig({
    plugins: [react()],
    define: {
      'import.meta.env.VITE_API_URL': JSON.stringify(apiUrl),
    },
    server: {
      port: 5173,
    },
  });
};
