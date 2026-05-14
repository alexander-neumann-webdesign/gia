const fs = require('fs');
let code = fs.readFileSync('examples/Tabs.js', 'utf8');
code = code.replace(
  'const updateDOM = () => {',
  'const updateDOM = () => {\n' +
  '                const currentHeight = panelsContainer.offsetHeight;\n' +
  '                panelsContainer.style.height = currentHeight + "px";\n' +
  '                panelsContainer.style.overflow = "hidden";\n'
);
fs.writeFileSync('examples/Tabs.js', code);
