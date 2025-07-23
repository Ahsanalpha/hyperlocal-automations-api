// config/database.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class Database {
  constructor() {
    this.db = null;
  }

  connect() {
    return new Promise((resolve, reject) => {
      const dbPath = path.join(__dirname, '..', process.env.DB_NAME || 'users.db');
      
      this.db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
          console.error('Error connecting to SQLite database:', err.message);
          reject(err);
        } else {
          console.log('Connected to SQLite database');
          this.initializeTables()
            .then(resolve)
            .catch(reject);
        }
      });
    });
  }

  initializeTables() {
    return new Promise((resolve, reject) => {
      const createUsersTable = `CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT,business_name TEXT NOT NULL,address TEXT NOT NULL,site_url TEXT,gbp_id TEXT UNIQUE,actions TEXT,created_at DATETIME DEFAULT CURRENT_TIMESTAMP,updated_at DATETIME DEFAULT CURRENT_TIMESTAMP)`;

      // Create index for better query performance
    //   const createIndexes = `
    //     CREATE INDEX IF NOT EXISTS idx_business_name ON users(business_name);
    //     CREATE INDEX IF NOT EXISTS idx_gbp_id ON users(gbp_id);
    //   `;

      this.db.exec(createUsersTable, (err) => {
        if (err) {
          console.error('Error creating tables:', err.message);
          reject(err);
        } else {
          console.log('Database tables initialized');
          resolve();
        }
      });
    });
  }

  close() {
    return new Promise((resolve) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) {
            console.error('Error closing database:', err.message);
          } else {
            console.log('Database connection closed');
          }
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}


let db;

const createDb = () => {
  if(!db) {
    db = new Database();
  }
  return db;
}

module.exports = {Database, createDb};