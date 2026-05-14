const { test, expect } = require('@playwright/test');

test('test tab panels height animation waapi', async ({ page }) => {
  await page.goto('http://localhost:3000/demo/');

  await page.evaluate(() => {
    const tabs = document.querySelector('div[data-component="Tabs"]').__giaComponent;
    const oldStateChange = tabs.stateChange.bind(tabs);
    tabs.stateChange = function(stateChanges) {
      const panelsContainer = this.ref.panel[0]?.parentElement;
      const startHeight = panelsContainer.offsetHeight;
      oldStateChange(stateChanges);
      const endHeight = panelsContainer.offsetHeight;

      panelsContainer.animate([
        { height: `${startHeight}px` },
        { height: `${endHeight}px` }
      ], {
        duration: 400,
        easing: 'ease'
      });
    };
  });

  const panels = page.locator('.tab-panels').first();
  console.log('H1:', await panels.boundingBox());

  await page.locator('button:has-text("Tab 2")').click();
  await page.waitForTimeout(50);
  console.log('H2:', await panels.boundingBox());
  await page.waitForTimeout(400);
  console.log('H3:', await panels.boundingBox());
});
