const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
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

  for (let i = 0; i < 10; i++) {
    const opacity = await page.evaluate(() => {
      const modal = document.querySelector('#my-modal');
      return window.getComputedStyle(modal).opacity;
    });
    console.log(`Open 2 - Frame ${i}: opacity = ${opacity}`);
    await page.waitForTimeout(50);
  }

  await browser.close();
})();
