const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ recordVideo: { dir: 'videos/' } });
  const page = await context.newPage();

  await page.goto('http://localhost:3000/demo/');

  // Wait for loading
  await page.waitForTimeout(1000);

  // click modal button
  await page.click('button[data-modal-target="my-modal"]');

  // wait a bit for animation
  await page.waitForTimeout(1000);

  // close
  await page.click('button[data-ref="closeButton"]');
  await page.waitForTimeout(1000);

  // click modal button again
  await page.click('button[data-modal-target="my-modal"]');

  // wait a bit for animation
  await page.waitForTimeout(1000);

  await context.close();
  await browser.close();
})();
