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
    type: String,
    enum: [
      'construction',
      'mechanical',
      'technology',
      'service',
      'transportation',
      'health_safety',
      'beauty',
      'cleaning'
    ],
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
providerSkillSchema.index({ name: 1 });

// Static method to get active skills ordered by displayOrder
providerSkillSchema.statics.getActiveSkills = function(category = null) {
  const query = { isActive: true };
  if (category) {
    query.category = category;
  }
  return this.find(query)
    .sort({ displayOrder: 1, name: 1 })
    .select('-__v -createdAt -updatedAt');
};

// Static method to get skills by category
providerSkillSchema.statics.getSkillsByCategory = function() {
  return this.aggregate([
    { $match: { isActive: true } },
    {
      $group: {
        _id: '$category',
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
    { $sort: { _id: 1 } }
  ]);
};

module.exports = mongoose.model('ProviderSkill', providerSkillSchema);

