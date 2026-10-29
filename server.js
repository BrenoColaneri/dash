const http = require('http');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
};

function garantirDadosAtualizados() {
  const dadosPath = path.join(ROOT, 'dados_planilha.js');
  const xlsxFiles = fs.readdirSync(ROOT).filter(f => f.endsWith('.xlsx'));
  if (!xlsxFiles.length) return;
  const xlsxStat = fs.statSync(path.join(ROOT, xlsxFiles[0]));
  if (!fs.existsSync(dadosPath) || fs.statSync(dadosPath).mtimeMs < xlsxStat.mtimeMs) {
    console.log('Sincronizando dados_planilha.js com a planilha Excel...');
    execFileSync(process.execPath, [path.join(ROOT, 'scripts', 'processar_planilha.js')], { stdio: 'inherit' });
  }
}

garantirDadosAtualizados();

const server = http.createServer((req, res) => {
  const urlPath = req.url.split('?')[0];
  if (urlPath === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', message: 'CTI Global – Portal de Inteligência Financeira (FP&A) ativo' }));
    return;
  }

  let filePath = path.join(ROOT, urlPath === '/' ? 'index.html' : urlPath);
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Arquivo não encontrado');
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
    res.end(content);
  });
});

server.listen(PORT, () => {
  console.log(`CTI Global | Portal Corporativo FP&A ativo em: http://localhost:${PORT}`);
});

