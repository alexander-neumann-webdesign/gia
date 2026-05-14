const fs = require('fs');

const tabsJs = fs.readFileSync('examples/Tabs.js', 'utf8');
const newTabsJs = tabsJs.replace(/const panelsContainer = this\.ref\.panel\[0\]\?\.parentElement;[\s\S]*?\} else \{\n\t\t\t\tupdateDOM\(\);\n\t\t\t\}/, `updateDOM();`);
fs.writeFileSync('examples/Tabs.js', newTabsJs);

const demoScss = fs.readFileSync('demo/demo.scss', 'utf8');
const newDemoScss = demoScss.replace(/\.tab-panels \{\n    display: grid;/, `.tab-panels {
    @supports (interpolate-size: allow-keywords) {
      height: max-content;
      transition: height 0.4s ease;
      overflow: hidden;
    }
    display: grid;`);
fs.writeFileSync('demo/demo.scss', newDemoScss);
