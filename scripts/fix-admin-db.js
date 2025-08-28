const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function fixAdmin() {
  try {
    // Use the same connection string as the application
    const MONGODB_URI = 'mongodb://127.0.0.1:27017/coupon-admin';
    
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Get the User model
    const User = require('../models/User');
    
    // Define admin data with correct permissions
    const adminData = {
      username: 'admin',
      email: 'admin@example.com',
      password: await bcrypt.hash('admin123', 10),
      role: 'admin',
      status: 'active',
      permissions: [
        'users.view', 'users.create', 'users.edit', 'users.delete',
        'coupons.view', 'coupons.create', 'coupons.edit', 'coupons.delete',
        'stores.view', 'stores.create', 'stores.edit', 'stores.delete',
        'categories.view', 'categories.create', 'categories.edit', 'categories.delete'
      ]
    };

    // Update or create admin user
    const admin = await User.findOneAndUpdate(
      { email: adminData.email },
      adminData,
      { 
        upsert: true,
        new: true,
        setDefaultsOnInsert: true
      }
    );

    console.log('Admin user updated successfully:');
    console.log({
      email: admin.email,
      username: admin.username,
      role: admin.role,
      status: admin.status
    });

    process.exit(0);
  } catch (error) {
    console.error('Error updating admin user:', error);
    process.exit(1);
  }
}

fixAdmin();
