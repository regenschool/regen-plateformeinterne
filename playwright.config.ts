import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Charger les variables d'environnement depuis .env.test
const envPath = path.resolve(__dirname, '.env.test');
console.log('Loading .env.test from:', envPath);
const result = dotenv.config({ path: envPath });
console.log('Dotenv result:', result.error ? result.error.message : `Loaded ${Object.keys(result.parsed || {}).length} vars`);

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: 'html',
  timeout: 30000, // 30s par test
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Firefox et webkit désactivés en CI pour économiser du temps
    ...(process.env.CI ? [] : [
      {
        name: 'firefox',
        use: { ...devices['Desktop Firefox'] },
      },
      {
        name: 'webkit',
        use: { ...devices['Desktop Safari'] },
      },
    ]),
  ],

  webServer: {
    command: 'npm run build && npm run preview -- --port=4173',
    url: 'http://localhost:4173',
    reuseExistingServer: false,
    timeout: 240000, // 4 minutes pour le build + preview en CI
  },
});
