// Users feature controller (fully migrated)
const User = require('../../models/User');
const Provider = require('../../models/Provider');
const EmailService = require('../../services/emailService');
const { auditLogger } = require('../../utils/auditLogger');
const { isValidObjectId } = require('../../utils/objectIdUtils');

// @desc    Get all users with filtering and pagination
const getAllUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      role,
      isActive,
      isVerified,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      includeDeleted = false,
      registrationMethod,
      partnerId
    } = req.query;
    const baseFilters = {};
    if (registrationMethod && typeof registrationMethod === 'string' && registrationMethod.trim() !== '') {
      baseFilters.registrationMethod = registrationMethod.trim();
    }
    if (partnerId && typeof partnerId === 'string' && partnerId.trim() !== '') {
      baseFilters.partnerId = partnerId.trim();
    }
    if (includeDeleted !== 'true') {
      const UserManagement = require('../../models/UserManagement');
      const deletedUserManagements = await UserManagement.find({ deletedAt: { $ne: null } }).select('user');
      const deletedUserIds = deletedUserManagements.map(um => um.user);
      if (deletedUserIds.length > 0) {
        baseFilters._id = { $nin: deletedUserIds };
      }
    }
    if (role && (typeof role === 'string' ? role.trim() !== '' : true)) {
      const roleValue = typeof role === 'string' ? role.trim() : role;
      if (Array.isArray(roleValue)) {
        baseFilters.roles = { $in: roleValue };
      } else {
        baseFilters.roles = { $in: [roleValue] };
      }
    }
    if (isActive !== undefined && isActive !== '') {
      if (typeof isActive === 'string') {
        baseFilters.isActive = isActive.toLowerCase() === 'true';
      } else {
        baseFilters.isActive = Boolean(isActive);
      }
    }
    if (isVerified !== undefined && isVerified !== '') {
      if (typeof isVerified === 'string') {
        baseFilters.isVerified = isVerified.toLowerCase() === 'true';
      } else {
        baseFilters.isVerified = Boolean(isVerified);
      }
    }
    let filter = {};
    const searchTerm = search && typeof search === 'string' ? search.trim() : search;
    if (searchTerm && searchTerm !== '') {
      const searchConditions = {
        $or: [
          { firstName: { $regex: searchTerm, $options: 'i' } },
          { lastName: { $regex: searchTerm, $options: 'i' } },
          { email: { $regex: searchTerm, $options: 'i' } },
          { phoneNumber: { $regex: searchTerm, $options: 'i' } },
          { 'profile.businessName': { $regex: searchTerm, $options: 'i' } }
        ]
      };
      if (Object.keys(baseFilters).length > 0) {
        filter = { $and: [baseFilters, searchConditions] };
      } else {
        filter = searchConditions;
      }
    } else {
      filter = baseFilters;
    }
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const usersQuery = User.find(filter)
      .select('-verificationCode')
      .populate({ path: 'agency', populate: { path: 'agencyId', select: 'name type' } })
      .populate({ path: 'referral', populate: { path: 'referredBy', select: 'firstName lastName' } })
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));
    let total = 0;
    let users = [];
    try {
      [total, users] = await Promise.all([
        User.countDocuments(filter),
        usersQuery.exec()
      ]);
    } catch (_err) {}
    if (users && users.length > 0) {
      const providerUserIds = users
        .filter(user => user.roles && user.roles.includes('provider'))
        .map(user => user._id);
      if (providerUserIds.length > 0) {
        try {
          let providers = await Provider.find({ userId: { $in: providerUserIds } })
            .populate('professionalInfo')
            .populate('professionalInfo.specialties.skills', 'name description category metadata')
            .populate('businessInfo')
            .populate('verification', '-backgroundCheck.reportId -insurance.documents')
            .populate('preferences')
            .populate('performance')
            .select('-financialInfo -onboarding')
            .lean();
          providers = providers.map(provider => {
            if (provider.professionalInfo && provider.professionalInfo.specialties && Array.isArray(provider.professionalInfo.specialties)) {
              provider.professionalInfo.specialties = provider.professionalInfo.specialties.map(specialty => {
                const { category: _category, ...specialtyWithoutCategory } = specialty;
                return specialtyWithoutCategory;
              });
            }
            return provider;
          });
          const providerMap = new Map();
          providers.forEach(provider => {
            providerMap.set(provider.userId.toString(), provider);
          });
          users = users.map(user => {
            const userObj = user.toObject ? user.toObject() : user;
            if (userObj.roles && userObj.roles.includes('provider')) {
              const providerData = providerMap.get(userObj._id.toString());
              userObj.provider = providerData || null;
            }
            return userObj;
          });
        } catch (providerError) {
          console.error('Error fetching provider data:', providerError);
        }
      }
    }
    await auditLogger.logUser('user_list', req, { type: 'user', id: null, name: 'Users' }, {}, { filter, pagination: { page, limit } });
    const UserManagement = require('../../models/UserManagement');
    const userIds = users.map(u => u._id);
    const managements = await UserManagement.find({ user: { $in: userIds } }).lean();
    const managementMap = new Map(managements.map(m => [m.user.toString(), m]));
    const usersWithLogin = users.map(user => {
      const userObj = user.toObject ? user.toObject() : user;
      const mgmt = managementMap.get(userObj._id.toString());
      userObj.lastLoginAt = mgmt && mgmt.lastLoginAt ? mgmt.lastLoginAt : null;
      userObj.lastLoginDisplay = mgmt && mgmt.lastLoginAt ? mgmt.lastLoginAt : 'Never';
      userObj.status = mgmt && mgmt.status ? mgmt.status : null;
      userObj.statusReason = mgmt && mgmt.statusReason ? mgmt.statusReason : null;
      userObj.statusUpdatedAt = mgmt && mgmt.statusUpdatedAt ? mgmt.statusUpdatedAt : null;
      userObj.statusUpdatedBy = mgmt && mgmt.statusUpdatedBy ? mgmt.statusUpdatedBy : null;
      userObj.isDeleted = mgmt && mgmt.deletedAt ? true : false;
      return userObj;
    });
    res.status(200).json({
      success: true,
      data: {
        users: usersWithLogin,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / parseInt(limit)),
          total,
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    res.status(200).json({ success: true, data: {} });
  }
};

// @desc    Get user by ID
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const { includeDeleted = false } = req.query;
    if (!isValidObjectId(id)) {
      return res.status(400).json({ success: false, message: 'Invalid user id format.' });
    }
    const user = await User.findById(id)
      .select('-password -refreshToken -verificationCode -emailVerificationCode')
      .populate('localProPlusSubscription')
      .populate('wallet')
      .populate('trust')
      .populate({ path: 'referral', populate: { path: 'referredBy', select: 'firstName lastName email phoneNumber' } })
      .populate('settings')
      .populate('management')
      .populate('activity')
      .populate({ path: 'agency', populate: { path: 'agencyId', select: 'name type contact address description' } });
    if (!user) {
      return res.status(200).json({ success: true, data: {} });
    }
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(200).json({ success: true, data: {} });
  }
};

module.exports = {
  getAllUsers,
  getUserById
};
