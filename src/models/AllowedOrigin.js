const mongoose = require('mongoose');

const AllowedOriginSchema = new mongoose.Schema({
  origin: {
    type: String,
    required: true,
    unique: true,
    trim: true
  }
}, { timestamps: true });

module.exports = mongoose.model('AllowedOrigin', AllowedOriginSchema);