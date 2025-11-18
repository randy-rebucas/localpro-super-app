const mongoose = require('mongoose');

const providerProfessionalInfoSchema = new mongoose.Schema({
  provider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Provider',
    required: true,
    unique: true
  },
  specialties: [{
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ServiceCategory'
    },
    reference: {
      type: String,
      trim: true
    },
    experience: {
      type: Number, // years of experience
      min: 0
    },
    certifications: [{
      name: String,
      issuer: String,
      dateIssued: Date,
      expiryDate: Date,
      certificateNumber: String
    }],
    skills: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ProviderSkill'
    }],
    hourlyRate: {
      type: Number,
      min: 0
    },
    serviceAreas: [{
      city: String,
      state: String,
      radius: {
        type: Number, // in miles/km
        min: 0
      }
    }]
  }],
  languages: [String],
  availability: {
    monday: {
      start: String,
      end: String,
      available: {
        type: Boolean,
        default: true
      }
    },
    tuesday: {
      start: String,
      end: String,
      available: {
        type: Boolean,
        default: true
      }
    },
    wednesday: {
      start: String,
      end: String,
      available: {
        type: Boolean,
        default: true
      }
    },
    thursday: {
      start: String,
      end: String,
      available: {
        type: Boolean,
        default: true
      }
    },
    friday: {
      start: String,
      end: String,
      available: {
        type: Boolean,
        default: true
      }
    },
    saturday: {
      start: String,
      end: String,
      available: {
        type: Boolean,
        default: true
      }
    },
    sunday: {
      start: String,
      end: String,
      available: {
        type: Boolean,
        default: true
      }
    }
  },
  emergencyServices: {
    type: Boolean,
    default: false
  },
  travelDistance: {
    type: Number, // maximum travel distance
    min: 0
  },
  minimumJobValue: {
    type: Number,
    min: 0
  },
  maximumJobValue: {
    type: Number,
    min: 0
  }
}, {
  timestamps: true
});

// Indexes
// Note: provider already has unique: true which creates an index
providerProfessionalInfoSchema.index({ 'specialties.serviceAreas.city': 1, 'specialties.serviceAreas.state': 1 });
providerProfessionalInfoSchema.index({ 'specialties.skills': 1 });
providerProfessionalInfoSchema.index({ 'specialties.category': 1 });

// Methods
providerProfessionalInfoSchema.methods.addSpecialty = function(specialtyData) {
  if (!this.specialties) {
    this.specialties = [];
  }
  this.specialties.push(specialtyData);
  return this.save();
};

providerProfessionalInfoSchema.methods.removeSpecialty = function(specialtyId) {
  this.specialties = this.specialties.filter(
    specialty => specialty._id.toString() !== specialtyId.toString()
  );
  return this.save();
};

providerProfessionalInfoSchema.methods.updateSpecialty = function(specialtyId, updateData) {
  const specialty = this.specialties.id(specialtyId);
  if (specialty) {
    Object.assign(specialty, updateData);
    return this.save();
  }
  throw new Error('Specialty not found');
};

providerProfessionalInfoSchema.methods.addCertification = function(specialtyId, certificationData) {
  const specialty = this.specialties.id(specialtyId);
  if (specialty) {
    if (!specialty.certifications) {
      specialty.certifications = [];
    }
    specialty.certifications.push(certificationData);
    return this.save();
  }
  throw new Error('Specialty not found');
};

providerProfessionalInfoSchema.methods.addSkill = function(specialtyId, skillId) {
  const specialty = this.specialties.id(specialtyId);
  if (specialty) {
    if (!specialty.skills) {
      specialty.skills = [];
    }
    if (!specialty.skills.includes(skillId)) {
      specialty.skills.push(skillId);
    }
    return this.save();
  }
  throw new Error('Specialty not found');
};

providerProfessionalInfoSchema.methods.addServiceArea = function(specialtyId, serviceAreaData) {
  const specialty = this.specialties.id(specialtyId);
  if (specialty) {
    if (!specialty.serviceAreas) {
      specialty.serviceAreas = [];
    }
    specialty.serviceAreas.push(serviceAreaData);
    return this.save();
  }
  throw new Error('Specialty not found');
};

providerProfessionalInfoSchema.methods.addLanguage = function(language) {
  if (!this.languages) {
    this.languages = [];
  }
  if (!this.languages.includes(language)) {
    this.languages.push(language);
  }
  return this.save();
};

providerProfessionalInfoSchema.methods.removeLanguage = function(language) {
  if (this.languages) {
    this.languages = this.languages.filter(lang => lang !== language);
  }
  return this.save();
};

providerProfessionalInfoSchema.methods.updateAvailability = function(day, availabilityData) {
  const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  if (!validDays.includes(day.toLowerCase())) {
    throw new Error('Invalid day');
  }
  this.availability[day.toLowerCase()] = {
    ...this.availability[day.toLowerCase()],
    ...availabilityData
  };
  return this.save();
};

providerProfessionalInfoSchema.methods.getServiceAreas = function() {
  return this.specialties.flatMap(specialty => 
    specialty.serviceAreas.map(area => ({
      ...area
    }))
  );
};

providerProfessionalInfoSchema.methods.getSummary = function() {
  return {
    specialtiesCount: this.specialties ? this.specialties.length : 0,
    languages: this.languages || [],
    hasEmergencyServices: this.emergencyServices || false,
    travelDistance: this.travelDistance,
    minimumJobValue: this.minimumJobValue,
    maximumJobValue: this.maximumJobValue,
    availability: this.availability
  };
};

// Static methods
providerProfessionalInfoSchema.statics.findOrCreateForProvider = async function(providerId) {
  let professionalInfo = await this.findOne({ provider: providerId });
  if (!professionalInfo) {
    professionalInfo = new this({
      provider: providerId
    });
    await professionalInfo.save();
  }
  return professionalInfo;
};

module.exports = mongoose.model('ProviderProfessionalInfo', providerProfessionalInfoSchema);

