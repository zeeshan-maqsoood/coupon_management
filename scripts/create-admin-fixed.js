require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
// Import the User model with the correct path
const User = require('..\models\User').default;

async function createAdmin() {
  try {
    // Connect to MongoDB using the same connection string as your app
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/coupon-admin', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Delete existing admin if any
    await User.deleteOne({ email: 'admin@example.com' });

    // Create new admin user
    const admin = new User({
      username: 'admin',
      email: 'admin@example.com',
      password: 'admin123', // Will be hashed by the pre-save hook
      role: 'admin',
      status: 'active',
      // Permissions will be set by the model based on the role
    });

    await admin.save();
    console.log('✅ Admin user created successfully!');
    console.log('Email: admin@example.com');
    console.log('Password: admin123');
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
    if (error.errors) {
      Object.values(error.errors).forEach(err => {
        console.error(`- ${err.properties?.message || err.message}`);
      });
    }
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

createAdmin();
