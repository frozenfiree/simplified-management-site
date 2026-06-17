import { defineConfig } from 'vite'
import { resolve } from 'node:path'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  // Relative base so the build works under a GitHub Pages project subpath
  // (https://<user>.github.io/<repo>/) as well as at a domain root.
  base: './',
  plugins: [tailwindcss()],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        propertyManagementSoftware: resolve(
          __dirname,
          'services/property-management-software/index.html'
        ),
        channelManager: resolve(
          __dirname,
          'services/channel-manager/index.html'
        ),
        calendarSync: resolve(__dirname, 'services/calendar-sync/index.html'),
        partnerPayouts: resolve(
          __dirname,
          'services/partner-payouts/index.html'
        ),
      },
    },
  },
  server: {
    open: true,
  },
})
