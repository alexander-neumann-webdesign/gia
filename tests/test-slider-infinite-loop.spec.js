const { test, expect } = require('@playwright/test');
const path = require('path');

test('FilterableList with dual range slider does not trigger infinite loop', async ({ page }) => {
  let errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`Page Error: ${msg.text()}`);
      errors.push(msg.text());
    }
  });
  page.on('pageerror', error => {
    console.log(`Uncaught Error: ${error.message}`);
    errors.push(error.message);
  });

  await page.goto('file://' + path.join(__dirname, '../demo/pages/FilterableList.html'));
  await page.waitForLoadState('networkidle');

  await page.evaluate(() => {
    const listEl = document.querySelector('[data-component="FilterableList"]');
    if (listEl) {
       const inputs = listEl.querySelectorAll('input[type="range"]');
       if (inputs.length > 0) {
           // We emulate a change to trigger the sync logic, which previously failed.
           inputs[0].value = 20;
           inputs[0].dispatchEvent(new Event('input', { bubbles: true }));
           inputs[0].dispatchEvent(new Event('change', { bubbles: true }));
       }
    }
  });

  await page.waitForTimeout(2000);

  // The errors array should not contain "Maximum call stack size exceeded"
  const callStackErrors = errors.filter(e => e.includes('Maximum call stack size exceeded'));
  expect(callStackErrors.length).toBe(0);
});
