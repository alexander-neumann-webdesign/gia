const { test, expect } = require('@playwright/test');

test('test tab panels height animation 2', async ({ page }) => {
  await page.goto('http://localhost:3000/demo/');

  const panels = page.locator('.tab-panels').first();
  console.log('H1:', await panels.boundingBox());

  await page.locator('button:has-text("Tab 2")').click();
  await page.waitForTimeout(150); // mid-animation
  console.log('H2:', await panels.boundingBox());
  await page.waitForTimeout(400); // end of animation
  console.log('H3:', await panels.boundingBox());
});
