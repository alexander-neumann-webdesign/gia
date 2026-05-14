const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  await page.goto('http://localhost:3000/demo/');

  await page.waitForTimeout(1000);

  await page.evaluate(() => {
     window.testOpacity = [];
     const modal = document.querySelector('#main-menu');
     const originalShowModal = modal.showModal.bind(modal);
     modal.showModal = function() {
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
  await page.click('button[data-offcanvas-target="main-menu"]');
  await page.waitForTimeout(500);

  const results1 = await page.evaluate(() => window.testOpacity);
  console.log("First open opacities:", results1);

  // close
  await page.click('button[data-action="click->handleCloseClick"]');
  await page.waitForTimeout(1000);

  // click modal button again
  await page.evaluate(() => {
     window.testOpacity = [];
  });
  await page.click('button[data-offcanvas-target="main-menu"]');

  await page.waitForTimeout(500);
  const results2 = await page.evaluate(() => window.testOpacity);
  console.log("Second open opacities:", results2);

  await browser.close();
})();
