// Jobs feature controller (migrated)
const Job = require('../../models/Job');
const JobCategory = require('../../models/JobCategory');
const User = require('../../models/User');
const CloudinaryService = require('../../services/cloudinaryService');
const EmailService = require('../../services/emailService');
const GoogleMapsService = require('../../services/googleMapsService');
const NotificationService = require('../../services/notificationService');
const mongoose = require('mongoose');
const logger = require('../../config/logger');
const {
  validatePagination,
  validateObjectId,
  validateNumericRange
} = require('../../utils/controllerValidation');
const {
  sendPaginated,
  sendSuccess,
  sendValidationError,
  sendNotFoundError,
  sendServerError,
  createPagination
} = require('../../utils/responseHelper');

// @desc    Get all jobs
// @route   GET /api/jobs
// @access  Public
const getAllJobs = async (req, res) => {
  const { page = 1, limit = 10, search, category, location, minSalary, maxSalary } = req.query;
  const { user } = req;

  try {
    const query = { status: 'active' };

    if (search) {
      query.$or = [{ title: { $regex: search, $options: 'i' } }, { description: { $regex: search, $options: 'i' } }];
    }

    if (category) {
      query.category = category;
    }

    if (location) {
      query.location = location;
    }

    if (minSalary || maxSalary) {
      query.salary = { $gte: minSalary, $lte: maxSalary };
    }

    const jobs = await Job.find(query)
      .populate('employer', 'name email')
      .populate('category', 'name')
      .populate('location', 'name')
      .skip((page - 1) * limit)
      .limit(limit);

    const total = await Job.countDocuments(query);

    res.json({
      data: jobs,
      pagination: createPagination(page, limit, total),
      message: 'Jobs retrieved successfully'
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Get single job
// @route   GET /api/jobs/:id
// @access  Public
const getJobById = async (req, res) => {
  const { id } = req.params;
  const { user } = req;

  try {
    const job = await Job.findById(id)
      .populate('employer', 'name email')
      .populate('category', 'name')
      .populate('location', 'name');

    if (!job) {
      return res.status(404).json({
        message: 'Job not found'
      });
    }

    res.json(job);
  } catch (error) {
    logger.error(error);
    res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Create new job
// @route   POST /api/jobs
// @access  Private (Employer/Admin)
const createJob = async (req, res) => {
  const { title, description, category, location, salary, status } = req.body;
  const { user } = req;

  try {
    const job = new Job({
      title,
      description,
      category,
      location,
      salary,
      status
    });

    await job.save();

    res.json({
      data: job,
      message: 'Job created successfully'
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Update job
// @route   PUT /api/jobs/:id
// @access  Private (Employer/Admin)
const updateJob = async (req, res) => {
  const { id } = req.params;
  const { title, description, category, location, salary, status } = req.body;
  const { user } = req;

  try {
    const job = await Job.findById(id);

    if (!job) {
      return res.status(404).json({
        message: 'Job not found'
      });
    }

    job.title = title;
    job.description = description;
    job.category = category;
    job.location = location;
    job.salary = salary;
    job.status = status;

    await job.save();

    res.json({
      data: job,
      message: 'Job updated successfully'
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Delete job
// @route   DELETE /api/jobs/:id
// @access  Private (Employer/Admin)
const deleteJob = async (req, res) => {
  const { id } = req.params;
  const { user } = req;

  try {
    const job = await Job.findById(id);

    if (!job) {
      return res.status(404).json({
        message: 'Job not found'
      });
    }

    await job.remove();

    res.json({
      message: 'Job deleted successfully'
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};

// @desc    Search jobs
// @route   GET /api/jobs/search
// @access  Public
const searchJobs = async (req, res) => {
  const { search, category, location, minSalary, maxSalary } = req.query;
  const { user } = req;

  try {
    const query = { status: 'active' };

    if (search) {
      query.$or = [{ title: { $regex: search, $options: 'i' } }, { description: { $regex: search, $options: 'i' } }];
    }

    if (category) {
      query.category = category;
    }

    if (location) {
      query.location = location;
    }

    if (minSalary || maxSalary) {
      query.salary = { $gte: minSalary, $lte: maxSalary };
    }

    const jobs = await Job.find(query)
      .populate('employer', 'name email')
      .populate('category', 'name')
      .populate('location', 'name');

    res.json({
      data: jobs,
      message: 'Jobs retrieved successfully'
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};

module.exports = {
  getAllJobs,
  getJobById,
  createJob,
  updateJob,
  deleteJob,
  searchJobs
};

