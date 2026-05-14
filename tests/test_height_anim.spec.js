const { test, expect } = require('@playwright/test');

test('test height anim', async ({ page }) => {
  await page.goto('http://localhost:3000/test_height_anim.html');
  await page.waitForTimeout(1000);

  const c = await page.$('#container');
  console.log('Container height 1:', await c.evaluate(el => el.getBoundingClientRect().height));

  await page.click('button');

  await page.waitForTimeout(100);
  console.log('Container height mid1:', await c.evaluate(el => el.getBoundingClientRect().height));

  await page.waitForTimeout(100);
  console.log('Container height mid2:', await c.evaluate(el => el.getBoundingClientRect().height));

  await page.waitForTimeout(100);
  console.log('Container height mid3:', await c.evaluate(el => el.getBoundingClientRect().height));

  await page.waitForTimeout(500);
  console.log('Container height after:', await c.evaluate(el => el.getBoundingClientRect().height));
});
