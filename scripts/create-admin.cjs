require('dotenv').config();
const { connectToDB } = require('../lib/api-utils');
const User = require('../models/User');
const { hashPassword } = require('../lib/jwt');
const { PERMISSIONS } = require('../models/User');

async function createAdminUser() {
  try {
    await connectToDB();

    const adminData = {
      username: 'admin',
      email: 'admin@example.com',
      password: await hashPassword('admin123'),
      role: 'admin',
      permissions: Object.values(PERMISSIONS),
      status: 'active',
    };

    // Check if admin already exists
    const existingAdmin = await User.findOne({
      $or: [
        { username: adminData.username },
        { email: adminData.email },
      ],
    });

    if (existingAdmin) {
      console.log('Admin user already exists');
      process.exit(0);
    }

    // Create admin user
    const admin = new User(adminData);
    await admin.save();

    console.log('Admin user created successfully!');
    console.log('Username: admin');
    console.log('Password: admin123');
    console.log('Please change the password after first login.');
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
}

createAdminUser();
