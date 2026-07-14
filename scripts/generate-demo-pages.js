const fs = require('fs');
const path = require('path');

const examplesDir = path.join(__dirname, '../examples');
const demoPagesDir = path.join(__dirname, '../demo/pages');
const demoIndexHtml = path.join(__dirname, '../demo/index.html');

if (!fs.existsSync(demoPagesDir)) {
    fs.mkdirSync(demoPagesDir, { recursive: true });
}

// Read demo/index.html to extract component markup and vendor scripts
let demoIndexContent = '';
if (fs.existsSync(demoIndexHtml)) {
    demoIndexContent = fs.readFileSync(demoIndexHtml, 'utf-8');
}

// Extract vendor scripts and links
const vendorScripts = [];
const scriptRegex = /<script\s+id="[^"]*"\s+data-src="[^"]*"(?:><\/script>|\s*\/>|>.*?<\/script>)/g;
const linkRegex = /<link\s+id="[^"]*"\s+rel="stylesheet"\s+data-href="[^"]*"(?:\s*crossorigin="")?\s*\/?>/g;

let match;
while ((match = scriptRegex.exec(demoIndexContent)) !== null) {
    vendorScripts.push(match[0]);
}
while ((match = linkRegex.exec(demoIndexContent)) !== null) {
    vendorScripts.push(match[0]);
}
const vendorScriptsHtml = vendorScripts.join('\n  ');

// Read all component files
const files = fs.readdirSync(examplesDir).filter(f => f.endsWith('.js'));
const components = files.map(f => f.replace('.js', ''));

// Function to extract section from demo/index.html
function getComponentMarkup(componentName) {
    const sectionRegex = new RegExp(`<section[^>]*id="${componentName}"[^>]*>([\\s\\S]*?)</section>`, 'i');
    const secMatch = demoIndexContent.match(sectionRegex);
    if (secMatch) {
        // Return the inner HTML of the section
        return secMatch[1].trim();
    }
    
    // Fallback markup
    return `<div class="demo-block">
      <div data-component="${componentName}">
         <p>Placeholder for ${componentName} component markup.</p>
      </div>
    </div>`;
}

// HTML Template
const generateHtmlTemplate = (componentName, optionsString, markup) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${componentName} - Gia Components Demo</title>
  
  <!-- Vendor scripts from demo/index.html -->
  ${vendorScriptsHtml}
  
  <link rel="stylesheet" href="../demo.css">
  <style>
    body {
      font-family: system-ui, sans-serif;
      max-width: 1000px;
      margin: 0 auto;
      padding: 2rem;
    }
    .demo-block {
      margin-top: 1rem;
      border: 1px dashed #aaa;
      padding: 1rem;
      border-radius: 8px;
    }
    .options-pre {
      background: #f4f4f4;
      padding: 1rem;
      border-radius: 4px;
      overflow-x: auto;
    }
    nav {
      margin-bottom: 2rem;
    }
  </style>
</head>
<body>
  <nav>
    <a href="index.html">&larr; Back to all components</a>
  </nav>
  
  <h1>${componentName}</h1>
  <p>Demo showcasing all configuration options for <strong>${componentName}</strong>.</p>
  
  <h2>Available Options</h2>
  <pre class="options-pre"><code>${optionsString}</code></pre>
  
  <section id="${componentName}">
    <h2>Interactive Demo</h2>
    ${markup}
  </section>

  <!-- Core library -->
  <script src="../../dist/gia.full.umd.js"></script>
  
  <!-- Component scripts -->
  ${components.map(c => `<script src="../../examples/${c}.js"></script>`).join('\n  ')}

  <!-- Initialization -->
  <script>
    document.addEventListener('DOMContentLoaded', () => {
        if (window.gia && window.gia.components) {
            gia.loadComponents(window.gia.components);
        }
    });
  </script>
</body>
</html>`;

components.forEach(comp => {
    // Try to extract options from the JS file
    const content = fs.readFileSync(path.join(examplesDir, `${comp}.js`), 'utf-8');
    const optionsMatch = content.match(/this\.options\s*=\s*({[\s\S]*?});/);
    let optionsString = 'No default options found.';
    if (optionsMatch && optionsMatch[1]) {
        optionsString = optionsMatch[1];
        
        // Dedent the options string
        const lines = optionsString.split('\n');
        const minTabs = Math.min(...lines.filter(l => l.trim() && l !== '{').map(l => {
            const m = l.match(/^\t+/);
            return m ? m[0].length : 0;
        }));
        if (minTabs > 0 && minTabs !== Infinity) {
            optionsString = lines.map(l => l.replace(new RegExp(`^\t{1,${minTabs}}`), '')).join('\n');
        }
    }
    
    // Escape HTML in options string so SVGs don't render
    optionsString = optionsString.replace(/</g, '&lt;').replace(/>/g, '&gt;');
    
    let markup = getComponentMarkup(comp);
    // Fix relative paths for images, videos, and css
    markup = markup.replace(/(src|href)="([^"]*\.(jpg|png|mp4|css))"/gi, (match, attr, val) => {
        if (!val.startsWith('http') && !val.startsWith('/') && !val.startsWith('.')) {
            return `${attr}="../${val}"`;
        }
        return match;
    });

    const htmlContent = generateHtmlTemplate(comp, optionsString, markup);
    fs.writeFileSync(path.join(demoPagesDir, `${comp}.html`), htmlContent);
});

// Generate Index Page
const indexHtmlTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Gia Components - All Pages</title>
  <style>
    body {
      font-family: system-ui, sans-serif;
      max-width: 1000px;
      margin: 0 auto;
      padding: 2rem;
    }
    ul {
      list-style-type: none;
      padding: 0;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
      gap: 1rem;
    }
    li a {
      display: block;
      padding: 1rem;
      border: 1px solid #ccc;
      border-radius: 8px;
      text-decoration: none;
      color: #333;
      transition: background 0.2s, box-shadow 0.2s;
    }
    li a:hover {
      background: #f9f9f9;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
  </style>
</head>
<body>
  <h1>Gia Components Library</h1>
  <p>Select a component to view its demo and configuration options.</p>
  <ul>
    ${components.map(comp => `<li><a href="${comp}.html">${comp}</a></li>`).join('\n    ')}
  </ul>
</body>
</html>`;

fs.writeFileSync(path.join(demoPagesDir, 'index.html'), indexHtmlTemplate);

console.log('Demo pages generated successfully with UMD scripts and extracted markup.');
