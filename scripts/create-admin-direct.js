require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

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
    const mongoUri = 'mongodb://127.0.0.1:27017/coupon-admin';
    console.log('Connecting to MongoDB at:', mongoUri);
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    const User = mongoose.model('User', userSchema);
    
    // Check if admin already exists
    const existingAdmin = await User.findOne({
      $or: [
        { username: 'admin' },
        { email: 'admin@example.com' }
      ]
    });

    if (existingAdmin) {
      console.log('Admin user already exists');
      await mongoose.disconnect();
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);

    // Define all possible permissions
    const allPermissions = [
      'USER_VIEW', 'USER_CREATE', 'USER_EDIT', 'USER_DELETE',
      'COUPON_VIEW', 'COUPON_CREATE', 'COUPON_EDIT', 'COUPON_DELETE',
      'STORE_VIEW', 'STORE_CREATE', 'STORE_EDIT', 'STORE_DELETE',
      'CATEGORY_VIEW', 'CATEGORY_CREATE', 'CATEGORY_EDIT', 'CATEGORY_DELETE'
    ];

    // Create admin user
    const admin = new User({
      username: 'admin',
      email: 'admin@example.com',
      password: hashedPassword,
      role: 'admin',
      permissions: allPermissions,
      status: 'active'
    });

    await admin.save();
    console.log('Admin user created successfully!');
    console.log('Username: admin');
    console.log('Password: admin123');
    console.log('Please change the password after first login.');
    
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await mongoose.disconnect();
  }
}

// Run the function
createAdminUser();
