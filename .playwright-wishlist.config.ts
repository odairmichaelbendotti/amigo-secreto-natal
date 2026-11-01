import { defineConfig } from '@playwright/test';
import base from './playwright.config';
export default defineConfig({ ...base, webServer: undefined, reporter: 'list', workers: 2, outputDir: 'node_modules/.cache/wishlist-e2e-results', projects: [{ name: 'chrome', use: { ...base.projects?.[0]?.use, channel: 'chrome' } }] });
