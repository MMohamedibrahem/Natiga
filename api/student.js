const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Writable path in Vercel serverless functions
const DB_PATH = '/tmp/students.db';
const GZ_PATH = path.join(process.cwd(), 'students.db.gz');

let db = null;
let searchStmt = null;

function initializeDatabase() {
  if (db && searchStmt) return;

  // Check if database is already decompressed in /tmp
  if (!fs.existsSync(DB_PATH)) {
    console.log('Database not found in /tmp. Extracting from gzip...');
    if (!fs.existsSync(GZ_PATH)) {
      throw new Error(`Compressed database file not found at: ${GZ_PATH}`);
    }
    
    // Read and decompress
    const gzipBuffer = fs.readFileSync(GZ_PATH);
    const dbBuffer = zlib.gunzipSync(gzipBuffer);
    fs.writeFileSync(DB_PATH, dbBuffer);
    console.log('Database successfully decompressed to /tmp/students.db');
  } else {
    console.log('Database already exists in /tmp. Reusing connection.');
  }

  // Open database sync
  const sqliteModule = 'node:sqlite';
  const { DatabaseSync } = require(sqliteModule);
  db = new DatabaseSync(DB_PATH);
  searchStmt = db.prepare('SELECT seating_no, arabic_name, total_degree, student_case_desc FROM students WHERE seating_no = ?');
}

module.exports = (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    return res.end();
  }

  const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
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
    initializeDatabase();
    
    const student = searchStmt.get(seatingNo);
    
    if (!student) {
      res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8' });
      return res.end(JSON.stringify({ success: false, error: 'Student not found' }));
    }

    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    return res.end(JSON.stringify({ success: true, student }));
  } catch (error) {
    console.error('Serverless DB Error:', error);
    res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8' });
    return res.end(JSON.stringify({ success: false, error: `Database error: ${error.message}` }));
  }
};
