module.exports = (req, res) => {
  let sqliteAvailable = false;
  let sqliteError = null;
  try {
    const sqlite = require('node:sqlite');
    sqliteAvailable = !!sqlite;
  } catch (err) {
    sqliteError = err.message;
  }

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    nodeVersion: process.version,
    sqliteAvailable,
    sqliteError,
    env: process.env.NODE_ENV,
    cwd: process.cwd(),
    files: fsExists()
  }));
};

function fsExists() {
  const fs = require('fs');
  const path = require('path');
  return {
    dbGz: fs.existsSync(path.join(process.cwd(), 'students.db.gz')),
    dbRaw: fs.existsSync('/tmp/students.db')
  };
}
