const mongoose = require('mongoose');

const providerBusinessInfoSchema = new mongoose.Schema({
  provider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Provider',
    required: true,
    unique: true
  },
  businessName: String,
  businessType: String,
  businessRegistration: String,
  taxId: String,
  businessAddress: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  businessPhone: String, // Business contact phone (not required to be unique - can be same as owner's personal phone)
  businessEmail: String,
  website: String,
  businessDescription: String,
  yearEstablished: Number,
  numberOfEmployees: Number
}, {
  timestamps: true
});

// Indexes
// Note: provider already has unique: true which creates an index
providerBusinessInfoSchema.index({ 'businessAddress.city': 1, 'businessAddress.state': 1 });
providerBusinessInfoSchema.index({ businessName: 1 });

// Methods
providerBusinessInfoSchema.methods.updateBusinessInfo = function(businessInfoData) {
  Object.assign(this, businessInfoData);
  return this.save();
};

providerBusinessInfoSchema.methods.updateBusinessAddress = function(addressData) {
  this.businessAddress = {
    ...this.businessAddress,
    ...addressData
  };
  return this.save();
};

providerBusinessInfoSchema.methods.setCoordinates = function(lat, lng) {
  if (!this.businessAddress) {
    this.businessAddress = {};
  }
  this.businessAddress.coordinates = { lat, lng };
  return this.save();
};

providerBusinessInfoSchema.methods.getFullAddress = function() {
  if (!this.businessAddress) {
    return null;
  }
  const parts = [
    this.businessAddress.street,
    this.businessAddress.city,
    this.businessAddress.state,
    this.businessAddress.zipCode,
    this.businessAddress.country
  ].filter(Boolean);
  return parts.join(', ') || null;
};

providerBusinessInfoSchema.methods.isComplete = function() {
  return !!(this.businessName && 
           this.businessType && 
           this.businessAddress && 
           this.businessAddress.city && 
           this.businessAddress.state);
};

providerBusinessInfoSchema.methods.getSummary = function() {
  return {
    businessName: this.businessName,
    businessType: this.businessType,
    businessAddress: this.businessAddress ? {
      city: this.businessAddress.city,
      state: this.businessAddress.state,
      country: this.businessAddress.country,
      coordinates: this.businessAddress.coordinates
    } : null,
    businessPhone: this.businessPhone,
    businessEmail: this.businessEmail,
    website: this.website,
    yearEstablished: this.yearEstablished,
    numberOfEmployees: this.numberOfEmployees,
    isComplete: this.isComplete()
  };
};

// Static methods
providerBusinessInfoSchema.statics.findOrCreateForProvider = async function(providerId) {
  let businessInfo = await this.findOne({ provider: providerId });
  if (!businessInfo) {
    businessInfo = new this({
      provider: providerId
    });
    await businessInfo.save();
  }
  return businessInfo;
};

module.exports = mongoose.model('ProviderBusinessInfo', providerBusinessInfoSchema);

