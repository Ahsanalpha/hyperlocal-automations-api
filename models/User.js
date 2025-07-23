// models/User.js
class User {
  constructor(db) {
    this.db = db;
  }

  // Create a new user
  create(userData) {
    return new Promise((resolve, reject) => {
      const { business_name, address, site_url, gbp_id, actions } = userData;
      
      const query = `
        INSERT INTO users (business_name, address, site_url, gbp_id, actions)
        VALUES (?, ?, ?, ?, ?)
      `;
      
      this.db.run(query, [business_name, address, site_url, gbp_id, actions], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, ...userData });
        }
      });
    });
  }

  // Get all users with pagination
  findAll(page = 1, limit = 10, search = '') {
    return new Promise((resolve, reject) => {
      const offset = (page - 1) * limit;
      let query = 'SELECT * FROM users';
      let countQuery = 'SELECT COUNT(*) as total FROM users';
      let params = [];

      if (search) {
        query += ' WHERE business_name LIKE ? OR address LIKE ? OR gbp_id LIKE ?';
        countQuery += ' WHERE business_name LIKE ? OR address LIKE ? OR gbp_id LIKE ?';
        const searchParam = `%${search}%`;
        params = [searchParam, searchParam, searchParam];
      }

      query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
      
      // Get total count first
      this.db.get(countQuery, params, (err, countResult) => {
        if (err) {
          reject(err);
          return;
        }

        // Get paginated results
        this.db.all(query, [...params, limit, offset], (err, rows) => {
          if (err) {
            reject(err);
          } else {
            resolve({
              users: rows,
              pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: countResult.total,
                pages: Math.ceil(countResult.total / limit)
              }
            });
          }
        });
      });
    });
  }

  // Get user by ID
  findById(id) {
    return new Promise((resolve, reject) => {
      const query = 'SELECT * FROM users WHERE id = ?';
      
      this.db.get(query, [id], (err, row) => {
        if (err) {
          reject(err);
        } else {
          resolve(row);
        }
      });
    });
  }

  // Update user
  update(id, userData) {
    return new Promise((resolve, reject) => {
      const { business_name, address, site_url, gbp_id, actions } = userData;
      
      const query = `
        UPDATE users 
        SET business_name = ?, address = ?, site_url = ?, gbp_id = ?, actions = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `;
      
      this.db.run(query, [business_name, address, site_url, gbp_id, actions, id], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ changes: this.changes });
        }
      });
    });
  }

  // Delete user
  delete(id) {
    return new Promise((resolve, reject) => {
      const query = 'DELETE FROM users WHERE id = ?';
      
      this.db.run(query, [id], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ changes: this.changes });
        }
      });
    });
  }
}

module.exports = User;