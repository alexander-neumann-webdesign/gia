const { test, expect } = require('@playwright/test');

test('test tabs snap', async ({ page }) => {
  await page.goto('http://localhost:3000/#Tabs');
  await page.waitForTimeout(2000);

  const p1 = await page.$('.tab-panels');
  const h1 = await p1.evaluate(el => el.getBoundingClientRect().height);
  console.log('Panel 1 height:', h1);

  await page.click('#tab-2');

  await page.waitForTimeout(100);
  const p2 = await page.$('.tab-panels');
  const h2 = await p2.evaluate(el => el.getBoundingClientRect().height);
  console.log('Panel 2 mid-height:', h2);

  await page.waitForTimeout(1000);
  const h3 = await p2.evaluate(el => el.getBoundingClientRect().height);
  console.log('Panel 2 final height:', h3);
});
