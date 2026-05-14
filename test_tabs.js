const { test, expect } = require('@playwright/test');
test('tabs snap', async ({ page }) => {
  await page.goto('http://localhost:3000/#Tabs');
  // click tab 2
  await page.click('#tab-2');
  await page.waitForTimeout(1000);
});
