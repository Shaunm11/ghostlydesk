const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./ghostlydesk.db');

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS inventory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ref TEXT, brand TEXT, model TEXT, cond TEXT,
    bought REAL, recon REAL, fees REAL, asking REAL,
    status TEXT, days INTEGER, notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS wishlist (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT, phone TEXT, brand TEXT, model TEXT,
    ref TEXT, budget REAL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
});

module.exports = db;
