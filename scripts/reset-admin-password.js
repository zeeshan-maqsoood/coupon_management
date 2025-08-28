const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

async function resetAdminPassword() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://127.0.0.1:27017/coupon-admin');
    console.log('Connected to MongoDB');

    // Hash the new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);

    // Update the admin user
    const result = await mongoose.connection.db.collection('users').updateOne(
      { username: 'admin' },
      { 
        $set: { 
          password: hashedPassword,
          updatedAt: new Date()
        } 
      }
    );

    if (result.modifiedCount === 1) {
      console.log('Admin password has been reset successfully!');
      console.log('Username: admin');
      console.log('New Password: admin123');
    } else {
      console.log('Admin user not found or password not updated');
    }
  } catch (error) {
    console.error('Error resetting admin password:', error);
  } finally {
    await mongoose.disconnect();
  }
}

resetAdminPassword();
