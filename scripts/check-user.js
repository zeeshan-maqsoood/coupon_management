require('dotenv').config();
const mongoose = require('mongoose');

async function checkUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://127.0.0.1:27017/coupon-admin', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // Get the user model
    const User = require('../models/User');
    
    // Find the admin user
    const admin = await User.findOne({ email: 'admin@example.com' });
    
    if (admin) {
      console.log('Found admin user:');
      console.log({
        email: admin.email,
        permissions: admin.permissions,
        status: admin.status
      });
    } else {
      console.log('No admin user found with email admin@example.com');
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error checking user:', error);
    process.exit(1);
  }
}

checkUser();
