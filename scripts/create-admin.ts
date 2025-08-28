import { connectDB } from '../lib/db';
import User from '../models/User';
import bcrypt from 'bcryptjs';
import { ROLE_PERMISSIONS } from '../models/User';

async function createAdmin() {
  try {
    // Connect to the database
    await connectDB();

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@example.com' });
    if (existingAdmin) {
      console.log('Admin user already exists');
      process.exit(0);
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    const admin = new User({
      username: 'admin',
      email: 'admin@example.com',
      password: hashedPassword,
      role: 'admin',
      permissions: ROLE_PERMISSIONS['admin'],
      status: 'active'
    });

    await admin.save();
    console.log('Admin user created successfully!');
    console.log('Email: admin@example.com');
    console.log('Password: admin123');
    console.log('\nPlease change the default password after first login!');
    
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

createAdmin();
