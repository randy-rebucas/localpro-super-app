const { validationResult, body } = require('express-validator');
const User = require('../models/User');
const { sendCreated, sendValidationError, sendServerError } = require('../utils/responseHelper');

// Validation rules for early registration input
const earlyRegistrationValidation = [
  body('phoneNumber')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Phone number is required')
    .isLength({ min: 7, max: 20 })
    .withMessage('Phone number must be 7-20 characters'),
  body('firstName')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ max: 100 })
    .withMessage('First name must be 100 characters or less'),
  body('lastName')
    .isString()
    .trim()
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ max: 100 })
    .withMessage('Last name must be 100 characters or less')
];

// Controller to create an early registration entry
const createEarlyRegistration = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formatted = errors.array().map(err => ({ field: err.path, message: err.msg }));
    return sendValidationError(res, formatted);
  }

  try {
    const { phoneNumber, firstName, lastName } = req.body;

    const normalizedPhone = String(phoneNumber).trim().replace(/\s+/g, '');

    // Upsert user by phoneNumber; if exists, update names if provided
    const now = new Date();
    const updated = await User.findOneAndUpdate(
      { phoneNumber: normalizedPhone },
      {
        $setOnInsert: {
          phoneNumber: normalizedPhone,
          status: 'pending_verification',
          isActive: true,
          createdAt: now
        },
        $set: {
          firstName: String(firstName).trim(),
          lastName: String(lastName).trim(),
          updatedAt: now
        }
      },
      { new: true, upsert: true }
    );

    return sendCreated(res, {
      id: updated._id,
      phoneNumber: updated.phoneNumber,
      firstName: updated.firstName,
      lastName: updated.lastName,
      status: updated.status,
      createdAt: updated.createdAt
    }, 'Registered user for early access');
  } catch (err) {
    return sendServerError(res, err);
  }
};

module.exports = {
  earlyRegistrationValidation,
  createEarlyRegistration
};


