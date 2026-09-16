import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// host: true exposes the dev server on your local network,
// so you can open the app on your phone at http://<your-computer-ip>:5173
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    watch: {
      // Static, rarely-changed event photos (see src/data/eventImages.js) —
      // no reason for the dev file watcher to track ~70 binary assets. They
      // don't need HMR (swapping one requires a manual refresh anyway since
      // it's resolved by filename, not content), and leaving them watched
      // was extra dev-server overhead on top of the eager-glob issue this
      // fixes. Everything else (JSX/CSS/data files) keeps normal HMR.
      ignored: ['**/src/assets/img/events/**'],
    },
  },
});
