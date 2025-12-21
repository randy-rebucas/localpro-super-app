const JobCategory = require('../models/JobCategory');
const Job = require('../models/Job');
const logger = require('../config/logger');
const { 
  validatePagination, 
  validateObjectId 
} = require('../utils/controllerValidation');
const { 
  sendPaginated, 
  sendSuccess, 
  sendCreated,
  sendUpdated,
  sendDeleted,
  sendValidationError, 
  sendNotFoundError, 
  sendConflictError,
  sendServerError,
  createPagination 
} = require('../utils/responseHelper');

// @desc    Get all job categories
// @route   GET /api/job-categories
// @access  Public
const getAllJobCategories = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 100, 
      isActive,
      sortBy = 'displayOrder',
      sortOrder = 'asc'
    } = req.query;

    // Validate pagination
    const paginationValidation = validatePagination({ page, limit });
    if (!paginationValidation.isValid) {
      return sendValidationError(res, paginationValidation.errors);
    }

    const { page: pageNum, limit: limitNum } = paginationValidation.data;

    // Build filter
    const filter = {};
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }

    // Build sort
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    if (sortBy !== 'displayOrder') {
      sort.displayOrder = 1; // Secondary sort by displayOrder
    }
    if (sortBy !== 'name') {
      sort.name = 1; // Tertiary sort by name
    }

    // Execute query
    const skip = (pageNum - 1) * limitNum;
    const categories = await JobCategory.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limitNum)
      .select('-__v')
      .lean();

    const total = await JobCategory.countDocuments(filter);
    const pagination = createPagination(pageNum, limitNum, total);

    return sendPaginated(res, categories, pagination, 'Job categories retrieved successfully');
  } catch (error) {
    logger.error('Get all job categories error:', error);
    return sendServerError(res, error, 'Failed to retrieve job categories', 'JOB_CATEGORIES_RETRIEVAL_ERROR');
  }
};

// @desc    Get active job categories (public endpoint)
// @route   GET /api/job-categories/active
// @access  Public
const getActiveJobCategories = async (req, res) => {
  try {
    const categories = await JobCategory.getActiveCategories();
    
    // Transform to include id field
    const formattedCategories = categories.map((cat) => ({
      id: cat._id.toString(),
      _id: cat._id,
      name: cat.name,
      description: cat.description,
      displayOrder: cat.displayOrder,
      metadata: cat.metadata
    }));

    return sendSuccess(res, {
      categories: formattedCategories,
      count: formattedCategories.length
    }, 'Active job categories retrieved successfully');
  } catch (error) {
    logger.error('Get active job categories error:', error);
    return sendServerError(res, error, 'Failed to retrieve active job categories', 'ACTIVE_CATEGORIES_RETRIEVAL_ERROR');
  }
};

// @desc    Get job category by ID
// @route   GET /api/job-categories/:id
// @access  Public
const getJobCategoryById = async (req, res) => {
  try {
    // Validate ObjectId format
    if (!validateObjectId(req.params.id)) {
      return sendValidationError(res, [{
        field: 'id',
        message: 'Invalid job category ID format',
        code: 'INVALID_CATEGORY_ID'
      }]);
    }

    const category = await JobCategory.findById(req.params.id)
      .select('-__v')
      .lean();

    if (!category) {
      return sendNotFoundError(res, 'Job category not found', 'CATEGORY_NOT_FOUND');
    }

    return sendSuccess(res, category, 'Job category retrieved successfully');
  } catch (error) {
    logger.error('Get job category by ID error:', error);
    return sendServerError(res, error, 'Failed to retrieve job category', 'CATEGORY_RETRIEVAL_ERROR');
  }
};

// @desc    Create job category
// @route   POST /api/job-categories
// @access  Private (Admin only)
const createJobCategory = async (req, res) => {
  try {
    const { name, description, isActive, displayOrder, metadata } = req.body;

    // Validate required fields
    if (!name || !name.trim()) {
      return sendValidationError(res, [{
        field: 'name',
        message: 'Category name is required',
        code: 'REQUIRED_FIELD'
      }]);
    }

    // Check if category with same name already exists
    const existingCategory = await JobCategory.findOne({ 
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') }
    });

    if (existingCategory) {
      return sendConflictError(res, 'Job category with this name already exists', 'CATEGORY_EXISTS');
    }

    // Create category
    const categoryData = {
      name: name.trim(),
      description: description?.trim(),
      isActive: isActive !== undefined ? isActive : true,
      displayOrder: displayOrder !== undefined ? displayOrder : 0,
      metadata: metadata || {}
    };

    const category = await JobCategory.create(categoryData);

    logger.info('Job category created', {
      categoryId: category._id,
      categoryName: category.name,
      createdBy: req.user?.id
    });

    return sendCreated(res, category.toObject(), 'Job category created successfully');
  } catch (error) {
    logger.error('Create job category error:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return sendConflictError(res, 'Job category with this name already exists', 'CATEGORY_EXISTS');
    }

    return sendServerError(res, error, 'Failed to create job category', 'CATEGORY_CREATION_ERROR');
  }
};

// @desc    Update job category
// @route   PUT /api/job-categories/:id
// @access  Private (Admin only)
const updateJobCategory = async (req, res) => {
  try {
    // Validate ObjectId format
    if (!validateObjectId(req.params.id)) {
      return sendValidationError(res, [{
        field: 'id',
        message: 'Invalid job category ID format',
        code: 'INVALID_CATEGORY_ID'
      }]);
    }

    const category = await JobCategory.findById(req.params.id);

    if (!category) {
      return sendNotFoundError(res, 'Job category not found', 'CATEGORY_NOT_FOUND');
    }

    const { name, description, isActive, displayOrder, metadata } = req.body;

    // If name is being updated, check for duplicates
    if (name && name.trim() !== category.name) {
      const existingCategory = await JobCategory.findOne({ 
        name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
        _id: { $ne: req.params.id }
      });

      if (existingCategory) {
        return sendConflictError(res, 'Job category with this name already exists', 'CATEGORY_EXISTS');
      }
    }

    // Update fields
    if (name !== undefined) category.name = name.trim();
    if (description !== undefined) category.description = description?.trim();
    if (isActive !== undefined) category.isActive = isActive;
    if (displayOrder !== undefined) category.displayOrder = displayOrder;
    if (metadata !== undefined) {
      category.metadata = { ...category.metadata, ...metadata };
    }

    await category.save();

    logger.info('Job category updated', {
      categoryId: category._id,
      categoryName: category.name,
      updatedBy: req.user?.id
    });

    return sendUpdated(res, category.toObject(), 'Job category updated successfully');
  } catch (error) {
    logger.error('Update job category error:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return sendConflictError(res, 'Job category with this name already exists', 'CATEGORY_EXISTS');
    }

    return sendServerError(res, error, 'Failed to update job category', 'CATEGORY_UPDATE_ERROR');
  }
};

// @desc    Delete job category
// @route   DELETE /api/job-categories/:id
// @access  Private (Admin only)
const deleteJobCategory = async (req, res) => {
  try {
    // Validate ObjectId format
    if (!validateObjectId(req.params.id)) {
      return sendValidationError(res, [{
        field: 'id',
        message: 'Invalid job category ID format',
        code: 'INVALID_CATEGORY_ID'
      }]);
    }

    const category = await JobCategory.findById(req.params.id);

    if (!category) {
      return sendNotFoundError(res, 'Job category not found', 'CATEGORY_NOT_FOUND');
    }

    // Check if category is being used by any jobs
    const jobsUsingCategory = await Job.countDocuments({ 
      category: req.params.id,
      status: { $in: ['draft', 'active', 'featured'] }
    });

    if (jobsUsingCategory > 0) {
      return sendConflictError(
        res, 
        `Cannot delete category. It is being used by ${jobsUsingCategory} active job(s). Please deactivate the category instead.`,
        'CATEGORY_IN_USE'
      );
    }

    // Delete the category
    await JobCategory.findByIdAndDelete(req.params.id);

    logger.info('Job category deleted', {
      categoryId: req.params.id,
      categoryName: category.name,
      deletedBy: req.user?.id
    });

    return sendDeleted(res, 'Job category deleted successfully');
  } catch (error) {
    logger.error('Delete job category error:', error);
    return sendServerError(res, error, 'Failed to delete job category', 'CATEGORY_DELETION_ERROR');
  }
};

// @desc    Get job category statistics
// @route   GET /api/job-categories/:id/stats
// @access  Public
const getJobCategoryStats = async (req, res) => {
  try {
    // Validate ObjectId format
    if (!validateObjectId(req.params.id)) {
      return sendValidationError(res, [{
        field: 'id',
        message: 'Invalid job category ID format',
        code: 'INVALID_CATEGORY_ID'
      }]);
    }

    const category = await JobCategory.findById(req.params.id);

    if (!category) {
      return sendNotFoundError(res, 'Job category not found', 'CATEGORY_NOT_FOUND');
    }

    // Get statistics
    const totalJobs = await Job.countDocuments({ category: req.params.id });
    const activeJobs = await Job.countDocuments({ 
      category: req.params.id,
      status: { $in: ['active', 'featured'] },
      isActive: true
    });
    const draftJobs = await Job.countDocuments({ 
      category: req.params.id,
      status: 'draft'
    });
    const closedJobs = await Job.countDocuments({ 
      category: req.params.id,
      status: { $in: ['closed', 'filled'] }
    });

    const stats = {
      categoryId: category._id,
      categoryName: category.name,
      totalJobs,
      activeJobs,
      draftJobs,
      closedJobs,
      isActive: category.isActive
    };

    return sendSuccess(res, stats, 'Job category statistics retrieved successfully');
  } catch (error) {
    logger.error('Get job category stats error:', error);
    return sendServerError(res, error, 'Failed to retrieve job category statistics', 'CATEGORY_STATS_ERROR');
  }
};

module.exports = {
  getAllJobCategories,
  getActiveJobCategories,
  getJobCategoryById,
  createJobCategory,
  updateJobCategory,
  deleteJobCategory,
  getJobCategoryStats
};

