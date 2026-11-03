import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { createPlaybackHandler } from "./server/playback.ts";

export default defineConfig(({ mode }) => {
  // Unprefixed values stay on the server. Never put playback configuration in `define`.
  const environment = loadEnv(mode, process.cwd(), "");
  const handler = createPlaybackHandler(environment);
  const localPlayback: Plugin = {
    name: "local-playback-api",
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        if (request.url?.split("?")[0] !== "/api/playback") return next();
        void handler(request, response);
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use((request, response, next) => {
        if (request.url?.split("?")[0] !== "/api/playback") return next();
        void handler(request, response);
      });
    },
  };
  return {
    plugins: [react(), localPlayback],
    server: { host: "127.0.0.1", port: 5000, strictPort: true },
    preview: { host: "127.0.0.1", port: 5000, strictPort: true },
    build: { sourcemap: false },
  };
});
