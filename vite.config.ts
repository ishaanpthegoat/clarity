import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ command }) => ({
  // Production is served from a GitHub Pages *project* page
  // (github.io/clarity/), not a custom domain — every asset URL needs this
  // prefix there. Dev and preview stay at root, or the Browser pane / e2e
  // suite (which navigate to "/") would 404 on every request.
  // Vite rewrites its own emitted <script>/<link> tags for this automatically;
  // raw string paths elsewhere (video/img src, CSS url()) do not get it for
  // free — see src/lib/asset.ts.
  base: command === "build" ? "/clarity/" : "/",
  server: {
    host: "::",
    // Honour PORT when the harness assigns one, so two sessions can run side
    // by side; otherwise keep the project's usual 5173.
    port: Number(process.env.PORT) || 5173,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"],
  },
}));
