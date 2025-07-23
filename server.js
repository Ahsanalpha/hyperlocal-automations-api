// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const Database = require('./config/database');
const User = require('./models/User');
const UserRoutes = require('./routes/users');
const errorHandler = require('./middleware/errorHandler');

class Server {
  constructor() {
    this.app = express();
    this.port = process.env.PORT || 3000;
    this.database = Database.createDb();
  }

  async initialize() {
    try {
      // Connect to database
      await this.database.close();
      await this.database.connect();
      
      // Setup middleware
      this.setupMiddleware();
      
      // Setup routes
      this.setupRoutes();
      
      // Setup error handling
      this.setupErrorHandling();
      
      console.log('Server initialized successfully');
    } catch (error) {
      console.error('Failed to initialize server:', error);
      process.exit(1);
    }
  }

  setupMiddleware() {
    // Security middleware
    this.app.use(helmet());
    
    // CORS
    this.app.use(cors({
      origin: process.env.NODE_ENV === 'production' ? false : true,
      credentials: true
    }));
    
    // Rate limiting
    const limiter = rateLimit({
      windowMs: (process.env.RATE_LIMIT_WINDOW || 15) * 60 * 1000, // 15 minutes
      max: process.env.RATE_LIMIT_MAX || 100, // limit each IP to 100 requests per windowMs
      message: {
        success: false,
        message: 'Too many requests from this IP, please try again later.'
      }
    });
    this.app.use(limiter);
    
    // Body parsing
    this.app.use(express.json({ limit: '15mb' }));
    this.app.use(express.urlencoded({ extended: true }));
  }

  setupRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      });
    });

    // API info
    this.app.get('/api', (req, res) => {
      res.json({
        success: true,
        message: 'User Management API',
        version: '1.0.0',
        endpoints: {
          'GET /api/users/run-audit': 'Run the hyperlocal automation workflow',
          'GET /api/users': 'Get all users (with pagination and search)',
          'GET /api/users/:id': 'Get user by ID',
          'POST /api/users': 'Create new user',
          'PUT /api/users/:id': 'Update user',
          'DELETE /api/users/:id': 'Delete user'
        }
      });
    });

    // User routes
    const userModel = new User(this.database.db);
    const userRoutes = new UserRoutes(userModel);
    this.app.use('/api/users', userRoutes.getRouter());

    // 404 handler
    this.app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        message: 'Route not found'
      });
    });
  }

  setupErrorHandling() {
    this.app.use(errorHandler);
  }

  async start() {
    try {
      await this.initialize();
      
      this.server = this.app.listen(this.port, () => {
        console.log(`Server running on port ${this.port}`);
        console.log(`Health check: http://localhost:${this.port}/health`);
        console.log(`API info: http://localhost:${this.port}/api`);
      });

      // Graceful shutdown
      this.setupGracefulShutdown();
      
    } catch (error) {
      console.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  setupGracefulShutdown() {
    const shutdown = async (signal) => {
      console.log(`\nReceived ${signal}. Starting graceful shutdown...`);
      
      if (this.server) {
        this.server.close(async () => {
          console.log('HTTP server closed');
          await this.database.close();
          console.log('Database connection closed');
          process.exit(0);
        });
      }
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  }
}

// Start the server
if (require.main === module) {
  const server = new Server();
  server.start();
}

module.exports = Server;