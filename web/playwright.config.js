// Tests de bout en bout : le site tourne en mode démo (données simulées), sans backend.
// Lancer : npm run test:e2e
import { defineConfig, devices } from '@playwright/test'

const PORT = 5190

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    // bannière cookies déjà acceptée (elle recouvre les boutons du bas de page)
    storageState: {
      cookies: [],
      origins: [{ origin: `http://127.0.0.1:${PORT}`, localStorage: [{ name: 'campussave-cookies', value: 'accepte' }] }],
    },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'bureau', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: `npx vite --port ${PORT} --strictPort --host 127.0.0.1`,
    url: `http://127.0.0.1:${PORT}`,
    reuseExistingServer: true,
    timeout: 60_000,
    env: { VITE_USE_MOCK: 'true' },
  },
})
