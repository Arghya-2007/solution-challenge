import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from "@tailwindcss/vite";

const rewriteDemoVideo = () => ({
  name: 'rewrite-demo-video',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      if (req.url === '/demo-video.mp4' || req.url === '/demo-vedeo.mp4') {
        req.url = '/index.html';
      }
      next();
    });
  }
});

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss(), rewriteDemoVideo()],
})
