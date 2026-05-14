const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('http://localhost:3000/demo/');

  await page.waitForTimeout(1000);

  await page.evaluate(() => {
     window.testOpacity = [];
     const modal = document.querySelector('#my-modal');
     const originalShowModal = modal.showModal.bind(modal);
     modal.showModal = function() {
        modal.style.display = 'block';
        modal.getBoundingClientRect(); // force reflow
        modal.style.display = '';
        originalShowModal();
        window.testOpacity.push(window.getComputedStyle(modal).opacity);
        requestAnimationFrame(() => {
           window.testOpacity.push(window.getComputedStyle(modal).opacity);
           requestAnimationFrame(() => {
              window.testOpacity.push(window.getComputedStyle(modal).opacity);
           });
        });
     };
  });

  // click modal button
  await page.click('button[data-modal-target="my-modal"]');
  await page.waitForTimeout(500);

  const results1 = await page.evaluate(() => window.testOpacity);
  console.log("First open opacities:", results1);

  await browser.close();
})();
