const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Import the PERMISSIONS from the User model
const { PERMISSIONS } = require('../models/User');

async function createAdminUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://127.0.0.1:27017/coupon-admin', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Hash the password
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Import the User model properly to ensure schema is registered
    const User = require('../models/User').default;

    // Delete existing admin if any
    await User.deleteOne({ email: 'admin@example.com' });

    // Create new admin user with correct permission values
    const adminUser = new User({
      username: 'admin',
      email: 'admin@example.com',
      password: hashedPassword,
      role: 'admin',
      permissions: [
        PERMISSIONS.USER_VIEW, PERMISSIONS.USER_CREATE, PERMISSIONS.USER_EDIT, PERMISSIONS.USER_DELETE,
        PERMISSIONS.COUPON_VIEW, PERMISSIONS.COUPON_CREATE, PERMISSIONS.COUPON_EDIT, PERMISSIONS.COUPON_DELETE,
        PERMISSIONS.STORE_VIEW, PERMISSIONS.STORE_CREATE, PERMISSIONS.STORE_EDIT, PERMISSIONS.STORE_DELETE,
        PERMISSIONS.CATEGORY_VIEW, PERMISSIONS.CATEGORY_CREATE, PERMISSIONS.CATEGORY_EDIT, PERMISSIONS.CATEGORY_DELETE
      ],
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    await adminUser.save();
    console.log('Admin user created successfully!');
    console.log('Email: admin@example.com');
    console.log('Password: admin123');
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

createAdminUser();
