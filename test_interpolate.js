const fs = require('fs');
let scss = fs.readFileSync('demo/demo.scss', 'utf8');

// I also need to provide interpolate-size in the css? Or does view-transitions take care of that?
