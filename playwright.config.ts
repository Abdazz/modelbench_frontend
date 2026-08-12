import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:4200',
  },
  projects: [
    { name: 'setup', testMatch: /auth\.setup\.ts/ },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], storageState: 'e2e/.auth/admin.json' },
      dependencies: ['setup'],
      testIgnore: /00-connexion\.spec\.ts/,
    },
    {
      name: 'chromium-connexion',
      use: { ...devices['Desktop Chrome'] },
      testMatch: /00-connexion\.spec\.ts/,
    },
  ],
  webServer: [
    {
      command: 'cd ../modelbench && ./mvnw spring-boot:run -Dspring-boot.run.profiles=h2',
      url: 'http://localhost:8090/v3/api-docs',
      timeout: 120_000,
      reuseExistingServer: !process.env['CI'],
    },
    {
      command: 'npm start',
      url: 'http://localhost:4200',
      timeout: 60_000,
      reuseExistingServer: !process.env['CI'],
    },
  ],
});
