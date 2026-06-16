import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  // Relative base so the build works under a GitHub Pages project subpath
  // (https://<user>.github.io/<repo>/) as well as at a domain root.
  base: './',
  plugins: [tailwindcss()],
  server: {
    open: true,
  },
})
