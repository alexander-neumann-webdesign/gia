const { createServer } = require('http');
const fs = require('fs');
const path = require('path');
const server = createServer((req, res) => {
  let filePath = path.join(__dirname, req.url === '/' ? 'demo/index.html' : req.url);
  if (!fs.existsSync(filePath)) {
    res.writeHead(404);
    res.end();
    return;
  }
  res.writeHead(200);
  res.end(fs.readFileSync(filePath));
});
server.listen(3000);
