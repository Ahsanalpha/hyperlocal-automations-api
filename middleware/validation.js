// middleware/validation.js
const Joi = require('joi');

// User validation schema
const userSchema = Joi.object({
  business_name: Joi.string().required().min(1).max(255).trim(),
  address: Joi.string().required().min(1).max(500).trim(),
  site_url: Joi.string().uri().optional().allow('').trim(),
  gbp_id: Joi.string().optional().allow('').trim(),
  // actions: Joi.string().optional().allow('').trim()
});

// Update schema (all fields optional)
const updateUserSchema = Joi.object({
  business_name: Joi.string().optional().min(1).max(255).trim(),
  address: Joi.string().optional().min(1).max(500).trim(),
  site_url: Joi.string().uri().optional().allow('').trim(),
  gbp_id: Joi.string().optional().allow('').trim(),
  // actions: Joi.string().optional().allow('').trim()
});

const validateUser = (req, res, next) => {
  console.log(req.body)
  const { error } = userSchema.validate(req.body);
  
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: error.details.map(detail => detail.message)
    });
  }
  
  next();
};

const validateUserUpdate = (req, res, next) => {
  const { error } = updateUserSchema.validate(req.body);
  
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: error.details.map(detail => detail.message)
    });
  }
  
  next();
};

// Pagination validation
const validatePagination = (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  
  if (page < 1) {
    return res.status(400).json({
      success: false,
      message: 'Page must be a positive number'
    });
  }
  
  if (limit < 1 || limit > 100) {
    return res.status(400).json({
      success: false,
      message: 'Limit must be between 1 and 100'
    });
  }
  
  req.pagination = { page, limit };
  next();
};

module.exports = {
  validateUser,
  validateUserUpdate,
  validatePagination
};