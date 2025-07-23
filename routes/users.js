// routes/users.js
const express = require("express");
const {main} = require('../jumper-media-automate/main')

const {
  validateUser,
  validateUserUpdate,
  validatePagination,
} = require("../middleware/validation");

class UserRoutes {
  constructor(userModel) {
    this.userModel = userModel;
    this.router = express.Router();
    this.setupRoutes();
  }

  setupRoutes() {
    // Secret key for header-based auth
    const API_KEY = "my-secure-api-key"; // you can load this from a .env file if you prefer

    this.router.get("/run-audit", async (req, res) => {
      const apiKey = req.headers["x-api-key"];
      const { auditBusinessName, auditBusinessUrl } = req.query;
      console.log("hitted automations endpoint")
      // Check for header
      if (apiKey !== API_KEY) {
        console.log("Invalid API key",api-key)
        return res.status(403).json({ error: "Forbidden: Invalid API Key" });
      }

      // Validate required query params
      if (!auditBusinessName || !auditBusinessUrl) {
        return res
          .status(400)
          .json({
            error:
              "Missing query parameters: auditBusinessName and auditBusinessUrl are required.",
          });
      }

      try {
        const workflowResponse = await main(auditBusinessName, auditBusinessUrl);
        console.log("Audit Main Response:::",workflowResponse)
        res.status(200).json({succcess:true,googleDriveUrl:workflowResponse.googleDriveLink,processReport:workflowResponse.processReport});
        console.log(`Successfully ran the audit for ${auditBusinessUrl}`);
        console.log(`Google Doc for ${auditBusinessName}: ${googleDocUrl}`);
      } catch (error) {
        console.log("Error running main():", error);
        res.status(500).json({ error: "Internal Server Error" });
      } finally {
        console.log("System ready for another audit...");
      }
    });

    // GET /api/users - Get all users with pagination and search
    this.router.get("/", validatePagination, async (req, res, next) => {
      try {
        const { page, limit } = req.pagination;
        const search = req.query.search || "";
        const result = await this.userModel.findAll(page, limit, search);

        res.json({
          success: true,
          data: result.users,
          pagination: result.pagination,
        });
      } catch (error) {
        next(error);
      }
    });

    // GET /api/users/:id - Get user by ID
    this.router.get("/:id", async (req, res, next) => {
      try {
        const { id } = req.params;

        if (!id || isNaN(id)) {
          return res.status(400).json({
            success: false,
            message: "Invalid user ID",
          });
        }

        const user = await this.userModel.findById(id);

        if (!user) {
          return res.status(404).json({
            success: false,
            message: "User not found",
          });
        }

        res.json({
          success: true,
          data: user,
        });
      } catch (error) {
        next(error);
      }
    });

    // POST /api/users - Create new user
    this.router.post("/", validateUser, async (req, res, next) => {
      try {
        const user = await this.userModel.create(req.body);

        res.status(201).json({
          success: true,
          message: "User created successfully",
          data: user,
        });
      } catch (error) {
        next(error);
      }
    });

    // PUT /api/users/:id - Update user
    this.router.put("/:id", validateUserUpdate, async (req, res, next) => {
      try {
        const { id } = req.params;

        if (!id || isNaN(id)) {
          return res.status(400).json({
            success: false,
            message: "Invalid user ID",
          });
        }

        // Check if user exists
        const existingUser = await this.userModel.findById(id);
        if (!existingUser) {
          return res.status(404).json({
            success: false,
            message: "User not found",
          });
        }

        const result = await this.userModel.update(id, req.body);

        if (result.changes === 0) {
          return res.status(404).json({
            success: false,
            message: "User not found",
          });
        }

        // Get updated user
        const updatedUser = await this.userModel.findById(id);

        res.json({
          success: true,
          message: "User updated successfully",
          data: updatedUser,
        });
      } catch (error) {
        next(error);
      }
    });

    // DELETE /api/users/:id - Delete user
    this.router.delete("/:id", async (req, res, next) => {
      try {
        const { id } = req.params;

        if (!id || isNaN(id)) {
          return res.status(400).json({
            success: false,
            message: "Invalid user ID",
          });
        }

        const result = await this.userModel.delete(id);

        if (result.changes === 0) {
          return res.status(404).json({
            success: false,
            message: "User not found",
          });
        }

        res.json({
          success: true,
          message: "User deleted successfully",
        });
      } catch (error) {
        next(error);
      }
    });
  }

  getRouter() {
    return this.router;
  }
}

module.exports = UserRoutes;
