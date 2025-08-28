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

// Reset admin user
async function resetAdmin() {
  try {
    await connectDB();
    
    // Define User model
    const userSchema = new mongoose.Schema({
      email: { type: String, required: true, unique: true },
      username: { type: String, required: true },
      password: { type: String, required: true },
      role: { type: String, default: 'admin' },
      permissions: { type: [String], default: ['admin:all'] },
      status: { type: String, default: 'active' }
    }, { timestamps: true });
    
    const User = mongoose.models.User || mongoose.model('User', userSchema);
    
    // Delete existing admin user if exists
    await User.deleteOne({ email: 'admin@example.com' });
    console.log('Removed existing admin user');
    
    // Create new admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const adminUser = new User({
      _id: new mongoose.Types.ObjectId('000000000000000000000001'),
      email: 'admin@example.com',
      username: 'admin',
      password: hashedPassword,
      role: 'admin',
      permissions: ['admin:all'],
      status: 'active'
    });
    
    await adminUser.save();
    console.log('Created new admin user:');
    console.log('Email: admin@example.com');
    console.log('Password: admin123');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

// Run the function
resetAdmin();
