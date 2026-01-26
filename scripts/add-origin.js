// Usage: node scripts/add-origin.js <origin>
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });


const AllowedOrigin = require('../src/models/AllowedOrigin');
const dbUri = process.env.MONGODB_URI || process.env.DB_URI || 'mongodb://localhost:27017/localpro';

async function addOrigin(origin) {
  if (!origin) {
    console.error('Usage: node scripts/add-origin.js <origin>');
    process.exit(1);
  }
  try {
    await mongoose.connect(dbUri, { useNewUrlParser: true, useUnifiedTopology: true });
    const exists = await AllowedOrigin.findOne({ origin });
    if (exists) {
      console.log('Origin already exists:', origin);
    } else {
      await AllowedOrigin.create({ origin });
      console.log('Origin added:', origin);
    }
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error adding origin:', err.message);
    process.exit(1);
  }
}

addOrigin(process.argv[2]);
