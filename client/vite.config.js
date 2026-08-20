import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import legacy from '@vitejs/plugin-legacy';

export default defineConfig({
  plugins: [
    react(),
    // The wall-mounted tablet tops out at iOS 10. Production builds therefore
    // include a transpiled SystemJS fallback bundle plus usage-based core-js polyfills.
    // Modern browsers still receive Vite's normal, smaller module bundle.
    //
    // This only applies to `vite build`; the Vite development server remains a
    // modern-browser tool. The iPad should use the build served on port 3001.
    legacy({
      targets: ['iOS >= 10'],
      // TanStack Query creates an AbortController before it runs every query.
      // Safari on iOS 10 has fetch(), but not AbortController, so without this
      // DOM shim all API queries fail before they can request the family data.
      additionalLegacyPolyfills: [
        'abortcontroller-polyfill/dist/abortcontroller-polyfill-only',
      ],
    }),
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3001',
    },
  },
});
