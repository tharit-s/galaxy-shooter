const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 3000;
const SCORES_FILE = path.join(__dirname, 'scores.json');
const GAME_FILE = path.join(__dirname, 'game.html');

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function readScores() {
  try {
    const data = fs.readFileSync(SCORES_FILE, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    return { scores: [] };
  }
}

function writeScores(data) {
  fs.writeFileSync(SCORES_FILE, JSON.stringify(data, null, 2), 'utf8');
}

function sendJSON(res, statusCode, body) {
  const payload = JSON.stringify(body);
  res.writeHead(statusCode, {
    ...CORS_HEADERS,
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(payload),
  });
  res.end(payload);
}

function sendError(res, statusCode, message) {
  sendJSON(res, statusCode, { error: message });
}

const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url, true);
  const pathname = parsed.pathname;
  const method = req.method.toUpperCase();

  // Handle OPTIONS preflight
  if (method === 'OPTIONS') {
    res.writeHead(200, CORS_HEADERS);
    res.end();
    return;
  }

  // Serve game HTML at / and /src/game.html
  if (method === 'GET' && (pathname === '/' || pathname === '/src/game.html')) {
    fs.readFile(GAME_FILE, (err, data) => {
      if (err) {
        res.writeHead(500, { ...CORS_HEADERS, 'Content-Type': 'text/plain' });
        res.end('Error reading game file');
        return;
      }
      res.writeHead(200, {
        ...CORS_HEADERS,
        'Content-Type': 'text/html',
        'Content-Length': data.length,
      });
      res.end(data);
    });
    return;
  }

  // GET /api/scores — return top 10 scores sorted by score descending
  if (method === 'GET' && pathname === '/api/scores') {
    const data = readScores();
    const top10 = data.scores
      .slice()
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
    sendJSON(res, 200, { scores: top10 });
    return;
  }

  // POST /api/scores — save a new score entry
  if (method === 'POST' && pathname === '/api/scores') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      let parsed;
      try {
        parsed = JSON.parse(body);
      } catch (e) {
        sendError(res, 400, 'Invalid JSON body');
        return;
      }

      const { name, score, wave } = parsed;

      // Validate fields
      if (typeof name !== 'string' || name.trim().length === 0) {
        sendError(res, 400, 'name is required and must be a non-empty string');
        return;
      }
      if (typeof score !== 'number' || !isFinite(score)) {
        sendError(res, 400, 'score is required and must be a number');
        return;
      }
      if (typeof wave !== 'number' || !isFinite(wave)) {
        sendError(res, 400, 'wave is required and must be a number');
        return;
      }

      const entry = {
        id: Date.now(),
        name: name.trim().slice(0, 20),
        score: score,
        wave: wave,
        date: new Date().toISOString(),
      };

      const data = readScores();
      data.scores.push(entry);

      // Keep only top 100 by score
      data.scores.sort((a, b) => b.score - a.score);
      data.scores = data.scores.slice(0, 100);

      writeScores(data);
      sendJSON(res, 201, entry);
    });
    req.on('error', () => {
      sendError(res, 500, 'Error reading request body');
    });
    return;
  }

  // 404 for everything else
  sendError(res, 404, 'Not found');
});

server.listen(PORT, () => {
  console.log(`Leaderboard API server running on http://localhost:${PORT}`);
});
