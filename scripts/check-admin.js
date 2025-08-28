require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Connect to MongoDB
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/coupon-admin', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}

// Check and create admin user
async function checkAdmin() {
  try {
    await connectDB();
    
    // Define User model
    const userSchema = new mongoose.Schema({
      _id: { type: mongoose.Schema.Types.ObjectId, required: true },
      email: { type: String, required: true, unique: true },
      username: { type: String, required: true },
      password: { type: String, required: true },
      role: { type: String, default: 'user' },
      permissions: { type: [String], default: [] },
    }, { timestamps: true });
    
    const User = mongoose.models.User || mongoose.model('User', userSchema);
    
    // Check if admin exists
    const adminEmail = 'admin@example.com';
    const adminPassword = 'admin123';
    
    let adminUser = await User.findOne({ email: adminEmail });
    
    if (!adminUser) {
      // Create admin user
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      adminUser = new User({
        _id: new mongoose.Types.ObjectId('000000000000000000000001'),
        email: adminEmail,
        username: 'admin',
        password: hashedPassword,
        role: 'admin',
        permissions: ['admin:all']
      });
      
      await adminUser.save();
      console.log('✅ Admin user created successfully!');
      console.log('Email: admin@example.com');
      console.log('Password: admin123');
    } else {
      console.log('ℹ️ Admin user already exists');
      console.log('Email:', adminUser.email);
      console.log('Role:', adminUser.role);
      
      // Update admin user with correct permissions if needed
      if (!adminUser.permissions.includes('admin:all')) {
        adminUser.permissions = ['admin:all'];
        adminUser.role = 'admin';
        await adminUser.save();
        console.log('✅ Updated admin permissions');
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run the function
checkAdmin();
