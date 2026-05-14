const { test, expect } = require('@playwright/test');

test('Tabs screenshots', async ({ page }) => {
  await page.goto('http://localhost:3000/demo/');

  await page.waitForTimeout(500);
  await page.screenshot({ path: 'test-results/tabs-0.png' });

  await page.locator('button:has-text("Tab 2")').click();

  for (let i = 1; i <= 10; i++) {
    await page.waitForTimeout(50);
    await page.screenshot({ path: `test-results/tabs-${i}.png` });
  }
});
