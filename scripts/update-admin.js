require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { PERMISSIONS } = require('../models/User');

async function updateAdmin() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/coupon-admin', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Get the User model
    const User = require('../models/User');

    // Define admin data
    const adminData = {
      username: 'admin',
      email: 'admin@example.com',
      password: 'admin123',
      role: 'admin',
      status: 'active',
      permissions: Object.values(PERMISSIONS) // This will include all permissions
    };

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    adminData.password = await bcrypt.hash(adminData.password, salt);

    // Update or create admin user
    const options = { upsert: true, new: true, setDefaultsOnInsert: true };
    const admin = await User.findOneAndUpdate(
      { email: adminData.email },
      adminData,
      options
    );

    console.log('Admin user updated/created successfully:');
    console.log({
      email: admin.email,
      username: admin.username,
      role: admin.role,
      status: admin.status,
      permissions: admin.permissions
    });

    process.exit(0);
  } catch (error) {
    console.error('Error updating admin user:', error);
    process.exit(1);
  }
}

updateAdmin();
