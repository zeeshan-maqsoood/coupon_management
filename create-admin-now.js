const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/coupon_admin';

async function createAdmin() {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Define the User model inline since we can't import it directly
    const userSchema = new mongoose.Schema({
      username: { type: String, required: true, unique: true },
      email: { type: String, required: true, unique: true },
      password: { type: String, required: true },
      role: { type: String, default: 'admin' },
      status: { type: String, default: 'active' }
    });

    // Check if admin already exists
    const User = mongoose.models.User || mongoose.model('User', userSchema);
    
    const existingAdmin = await User.findOne({ email: 'admin@example.com' });
    if (existingAdmin) {
      console.log('Admin user already exists');
      return process.exit(0);
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    const admin = new User({
      username: 'admin',
      email: 'admin@example.com',
      password: hashedPassword,
      role: 'admin',
      status: 'active'
    });

    await admin.save();
    console.log('Admin user created successfully!');
    console.log('Email: admin@example.com');
    console.log('Password: admin123');
    console.log('\nPlease change the default password after first login!');
    
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

createAdmin();
