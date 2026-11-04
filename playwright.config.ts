import { defineConfig } from "@playwright/test"
export default defineConfig({
  testDir: "test/browser",
  fullyParallel: true,
  timeout: process.env.ATOMIC_EXPLAINER_SOFTWARE_GL ? 300_000 : 120_000,
  expect: { timeout: process.env.ATOMIC_EXPLAINER_SOFTWARE_GL ? 45_000 : 15_000 },
  workers: 1,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://127.0.0.1:4323",
    viewport: { width: 1440, height: 900 },
    launchOptions: {
      channel: process.env.PLAYWRIGHT_CHANNEL || undefined,
      args: process.env.ATOMIC_EXPLAINER_SOFTWARE_GL
        ? ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"]
        : [],
    },
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run build:eval && node dist/studio.js",
    url: "http://127.0.0.1:4323/api/config",
    timeout: 120_000,
    reuseExistingServer: !process.env.CI,
    env: {
      ATOMIC_EXPLAINER_STUDIO_PORT: "4323",
      ATOMIC_EXPLAINER_SITE_DIR: "dist-eval",
      OPENAI_API_KEY: "",
      TRIPO_API_KEY: "",
      AI_GATEWAY_API_KEY: "",
    },
  },
})
