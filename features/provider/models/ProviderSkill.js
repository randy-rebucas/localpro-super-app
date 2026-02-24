const mongoose = require('mongoose');

const providerSkillSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    unique: true
  },
  description: {
    type: String,
    trim: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ServiceCategory',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  displayOrder: {
    type: Number,
    default: 0
  },
  metadata: {
    icon: String,
    tags: [String],
    requirements: [String]
  }
}, {
  timestamps: true
});

// Indexes
providerSkillSchema.index({ isActive: 1, displayOrder: 1 });
providerSkillSchema.index({ category: 1, isActive: 1 });
// Note: name already has unique: true which creates an index

// Static method to get active skills ordered by displayOrder
providerSkillSchema.statics.getActiveSkills = function(category = null) {
  const query = { isActive: true };
  if (category) {
    // Convert string to ObjectId if needed
    if (mongoose.Types.ObjectId.isValid(category)) {
      query.category = typeof category === 'string' 
        ? new mongoose.Types.ObjectId(category)
        : category;
    } else {
      throw new Error(`Invalid category ObjectId: ${category}`);
    }
  }
  return this.find(query)
    .populate('category', 'key name description metadata')
    .sort({ displayOrder: 1, name: 1 })
    .select('-__v -createdAt -updatedAt');
};

// Static method to get skills by category
providerSkillSchema.statics.getSkillsByCategory = function() {
  return this.aggregate([
    { $match: { isActive: true } },
    {
      $lookup: {
        from: 'servicecategories',
        localField: 'category',
        foreignField: '_id',
        as: 'categoryInfo'
      }
    },
    {
      $unwind: {
        path: '$categoryInfo',
        preserveNullAndEmptyArrays: true
      }
    },
    {
      $group: {
        _id: '$category',
        categoryName: { $first: '$categoryInfo.name' },
        categoryDescription: { $first: '$categoryInfo.description' },
        categoryMetadata: { $first: '$categoryInfo.metadata' },
        skills: {
          $push: {
            id: '$_id',
            name: '$name',
            description: '$description',
            displayOrder: '$displayOrder',
            metadata: '$metadata'
          }
        }
      }
    },
    { $sort: { categoryName: 1 } }
  ]);
};

module.exports = mongoose.model('ProviderSkill', providerSkillSchema);

