const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('http://localhost:3000/demo/');

  await page.waitForTimeout(1000);

  // Try to see if it needs a layout read to force starting-style evaluation
  await page.evaluate(() => {
     // override stateChange?
  });

  await browser.close();
})();
