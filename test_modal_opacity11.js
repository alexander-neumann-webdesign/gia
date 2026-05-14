const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ recordVideo: { dir: 'videos2/' } });
  const page = await context.newPage();

  await page.goto('http://localhost:3000/demo/');

  await page.waitForTimeout(1000);

  await page.evaluate(() => {
     const modal = document.querySelector('#my-modal');
     const originalShowModal = modal.showModal.bind(modal);
     modal.showModal = function() {
        modal.style.display = 'block';
        modal.getBoundingClientRect(); // force reflow
        modal.style.display = '';
        originalShowModal();
     };
  });

  // click modal button
  await page.click('button[data-modal-target="my-modal"]');
  await page.waitForTimeout(1000);

  // close
  await page.click('button[data-ref="closeButton"]');
  await page.waitForTimeout(1000);

  // click modal button again
  await page.click('button[data-modal-target="my-modal"]');
  await page.waitForTimeout(1000);

  await context.close();
  await browser.close();
})();
