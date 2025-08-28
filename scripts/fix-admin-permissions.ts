import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { PERMISSIONS } from '../models/User';

dotenv.config();

async function fixAdminPermissions() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/coupon-admin');
    console.log('Connected to MongoDB');

    // Get the User model
    const { default: User } = await import('../models/User');

    // Find the admin user
    const admin = await User.findOne({ email: 'admin@example.com' });
    
    if (!admin) {
      console.log('Admin user not found');
      return;
    }

    console.log('Current permissions:', admin.permissions);

    // Map old permissions to new format
    const permissionMap = {
      'USER_VIEW': PERMISSIONS.USER_VIEW,
      'USER_CREATE': PERMISSIONS.USER_CREATE,
      'USER_EDIT': PERMISSIONS.USER_EDIT,
      'USER_DELETE': PERMISSIONS.USER_DELETE,
      'COUPON_VIEW': PERMISSIONS.COUPON_VIEW,
      'COUPON_CREATE': PERMISSIONS.COUPON_CREATE,
      'COUPON_EDIT': PERMISSIONS.COUPON_EDIT,
      'COUPON_DELETE': PERMISSIONS.COUPON_DELETE,
      'STORE_VIEW': PERMISSIONS.STORE_VIEW,
      'STORE_CREATE': PERMISSIONS.STORE_CREATE,
      'STORE_EDIT': PERMISSIONS.STORE_EDIT,
      'STORE_DELETE': PERMISSIONS.STORE_DELETE,
      'CATEGORY_VIEW': PERMISSIONS.CATEGORY_VIEW,
      'CATEGORY_CREATE': PERMISSIONS.CATEGORY_CREATE,
      'CATEGORY_EDIT': PERMISSIONS.CATEGORY_EDIT,
      'CATEGORY_DELETE': PERMISSIONS.CATEGORY_DELETE
    };

    // Update permissions to new format
    admin.permissions = admin.permissions.map(perm => permissionMap[perm] || perm);
    
    // Also set the password to a known value (admin123)
    admin.password = 'admin123';
    
    await admin.save();
    
    console.log('Updated admin permissions:', admin.permissions);
    console.log('Admin password has been reset to: admin123');
    
  } catch (error) {
    console.error('Error updating admin permissions:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

fixAdminPermissions();
