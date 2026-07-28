const http = require('http');
const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, 'students.db');
const PUBLIC_DIR = path.join(__dirname, 'public');

// Initialize database connection
let db;
try {
  db = new DatabaseSync(DB_PATH);
  console.log('Successfully connected to SQLite database:', DB_PATH);
} catch (error) {
  console.error('Failed to open database:', error);
  process.exit(1);
}

// Prepare the statement once for high performance
const searchStmt = db.prepare('SELECT seating_no, arabic_name, total_degree, student_case_desc FROM students WHERE seating_no = ?');

// Helper to determine Content-Type
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

const server = http.createServer((req, res) => {
  const urlObj = new URL(req.url, `http://${req.headers.host}`);
  const pathname = urlObj.pathname;

  // API Endpoint: /api/student
  if (pathname === '/api/student' && req.method === 'GET') {
    const seatingNoStr = urlObj.searchParams.get('seating_no');
    
    if (!seatingNoStr) {
      res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify({ success: false, error: 'Missing seating_no parameter' }));
    }

    const seatingNo = parseInt(seatingNoStr, 10);
    if (isNaN(seatingNo)) {
      res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify({ success: false, error: 'seating_no must be a valid number' }));
    }

    try {
      // Execute indexed lookup
      const student = searchStmt.get(seatingNo);
      
      if (!student) {
        res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
        return res.end(JSON.stringify({ success: false, error: 'Student not found' }));
      }

      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify({ success: true, student }));
    } catch (dbError) {
      console.error('Database query error:', dbError);
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify({ success: false, error: 'Internal database error' }));
    }
  }

  // Static File Serving
  let filePath = path.join(PUBLIC_DIR, pathname === '/' ? 'index.html' : pathname);

  // Prevent Directory Traversal
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    return res.end('Forbidden');
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // Fallback for clean URLs or 404
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end('<h1>404 Not Found</h1><p>The page or resource you requested does not exist.</p>');
    }

    res.writeHead(200, { 'Content-Type': contentType });
    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
});

server.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
