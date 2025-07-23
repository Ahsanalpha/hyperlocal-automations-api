// middleware/errorHandler.js
const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // SQLite constraint errors
  if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
    return res.status(409).json({
      success: false,
      message: 'Duplicate entry: GBP ID already exists'
    });
  }

  // SQLite errors
  if (err.code && err.code.startsWith('SQLITE')) {
    return res.status(500).json({
      success: false,
      message: 'Database error occurred'
    });
  }

  // Default error
  res.status(500).json({
    success: false,
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
  });
};

module.exports = errorHandler;