import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base: "./" keeps asset paths relative, so the build works whether it's
// served from a user/org page or a project page (username.github.io/repo/)
// without needing to hardcode the repo name.
export default defineConfig({
  plugins: [react()],
  base: "./",
});
