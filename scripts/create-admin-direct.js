require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Ensure required environment variables are set
if (!process.env.MONGODB_URI) {
  console.error('Error: MONGODB_URI is not defined in .env.local');
  process.exit(1);
}

if (!process.env.ADMIN_EMAIL || !process.env.ADMIN_PASSWORD) {
  console.error('Error: ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env.local');
  process.exit(1);
}

// Define the User schema inline to avoid module resolution issues
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, select: false },
  role: { 
    type: String, 
    enum: ['admin', 'manager', 'editor', 'viewer'],
    default: 'viewer'
  },
  permissions: [{ type: String }],
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'active'
  },
  lastLogin: Date,
  refreshToken: { type: String, select: false },
  refreshTokenExpiry: { type: Date, select: false },
}, { timestamps: true });

async function createAdminUser() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    const User = mongoose.model('User', userSchema);
    
    // Check if admin already exists
    const adminEmail = process.env.ADMIN_EMAIL;
    const existingAdmin = await User.findOne({
      $or: [
        { username: 'admin' },
        { email: adminEmail }
      ]
    });

    if (existingAdmin) {
      console.log('Admin user already exists');
      await mongoose.disconnect();
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD, salt);

    // Define all possible permissions
    const allPermissions = [
      'USER_VIEW', 'USER_CREATE', 'USER_EDIT', 'USER_DELETE',
    ];

    // Create admin user
    const adminUser = new User({
      username: 'admin',
      email: process.env.ADMIN_EMAIL,
      password: hashedPassword,
      role: 'admin',
      permissions: ['admin:all'],
      status: 'active'
    });

    await adminUser.save();
    console.log('Admin user created successfully!');
    console.log('Username: admin');
    console.log('Email: ' + process.env.ADMIN_EMAIL);
    console.log('Password: [the password you set in .env.local]');
    console.log('Please change the password after first login.');
    
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await mongoose.disconnect();
  }
}

// Run the function
createAdminUser();
