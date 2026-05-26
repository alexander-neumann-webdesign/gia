const { test, expect } = require('@playwright/test');

test('range slider issue', async ({ page }) => {
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.error(`Page Error: ${msg.text()}`);
    }
  });
  page.on('pageerror', error => {
    console.error(`Uncaught Error: ${error.message}`);
  });

  await page.goto('http://localhost:5173/demo/index.html');
  await page.waitForLoadState('networkidle');

  // Wait a bit
  await page.waitForTimeout(2000);
});
