require('dotenv').config();
const mongoose = require('mongoose');

async function updateAdminPermissions() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://127.0.0.1:27017/coupon-admin', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Get the user model
    const User = require('../models/User');
    
    // Define the correct permissions format
    const adminPermissions = [
      'users.view', 'users.create', 'users.edit', 'users.delete',
      'coupons.view', 'coupons.create', 'coupons.edit', 'coupons.delete',
      'stores.view', 'stores.create', 'stores.edit', 'stores.delete',
      'categories.view', 'categories.create', 'categories.edit', 'categories.delete'
    ];

    // Update the admin user
    const result = await User.updateOne(
      { email: 'admin@example.com' },
      { $set: { permissions: adminPermissions } }
    );

    if (result.nModified === 0) {
      console.log('No user found with email admin@example.com');
    } else {
      console.log('Successfully updated admin permissions');
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error updating admin permissions:', error);
    process.exit(1);
  }
}

updateAdminPermissions();
