const { test, expect } = require('@playwright/test');

test('test tab panels height animation waapi manually', async ({ page }) => {
  await page.goto('http://localhost:3000/demo/');

  const panels = page.locator('.tab-panels').first();
  await page.evaluate(() => {
    // Disable startViewTransition to test fallback
    document.startViewTransition = null;
  });

  console.log('H1:', await panels.boundingBox());

  await page.locator('button:has-text("Tab 2")').click();
  await page.waitForTimeout(200); // mid-animation
  console.log('H2:', await panels.boundingBox());
  await page.waitForTimeout(300); // end of animation
  console.log('H3:', await panels.boundingBox());
});
