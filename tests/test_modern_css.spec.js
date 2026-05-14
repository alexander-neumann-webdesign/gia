const { test, expect } = require('@playwright/test');

test('test modern css', async ({ page }) => {
  await page.goto('http://localhost:3000/test_modern_css.html');
  await page.waitForTimeout(1000);

  const c = await page.$('#container');
  console.log('Container height 1:', await c.evaluate(el => el.getBoundingClientRect().height));

  await page.click('button');

  await page.waitForTimeout(100);
  console.log('Container height mid:', await c.evaluate(el => el.getBoundingClientRect().height));

  await page.waitForTimeout(2000);
  console.log('Container height 2:', await c.evaluate(el => el.getBoundingClientRect().height));
});
