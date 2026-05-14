const { test, expect } = require('@playwright/test');

test('view transition dom sync', async ({ page }) => {
  await page.goto('http://localhost:3000/demo/');

  const h = await page.evaluate(async () => {
    let old = document.querySelector('.tab-panels').offsetHeight;
    let end;

    // remove transitions from all panels to measure instant height change
    document.querySelectorAll('[role="tabpanel"]').forEach(p => {
      p.style.transition = 'none';
      p.style.display = p.hidden ? 'none' : 'block';
    });

    document.querySelector('#panel-1').hidden = true;
    document.querySelector('#panel-2').hidden = false;

    document.querySelectorAll('[role="tabpanel"]').forEach(p => {
      p.style.display = p.hidden ? 'none' : 'block';
    });

    end = document.querySelector('.tab-panels').offsetHeight;

    return [old, end];
  });
  console.log(h);
});
