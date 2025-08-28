require('dotenv').config();
const mongoose = require('mongoose');

async function fixPermissions() {
  try {
    // Connect to MongoDB
    const mongoUri = 'mongodb://127.0.0.1:27017/coupon-admin';
    console.log('Connecting to MongoDB at:', mongoUri);
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Get the user model
    const User = require('../models/User');
    
    // Update permissions format for all users
    const result = await User.updateMany(
      {},
      [
        {
          $set: {
            permissions: {
              $map: {
                input: "$permissions",
                as: "permission",
                in: {
                  $switch: {
                    branches: [
                      { case: { $eq: ["$$permission", "USER_VIEW"] }, then: "users.view" },
                      { case: { $eq: ["$$permission", "USER_CREATE"] }, then: "users.create" },
                      { case: { $eq: ["$$permission", "USER_EDIT"] }, then: "users.edit" },
                      { case: { $eq: ["$$permission", "USER_DELETE"] }, then: "users.delete" },
                      { case: { $eq: ["$$permission", "COUPON_VIEW"] }, then: "coupons.view" },
                      { case: { $eq: ["$$permission", "COUPON_CREATE"] }, then: "coupons.create" },
                      { case: { $eq: ["$$permission", "COUPON_EDIT"] }, then: "coupons.edit" },
                      { case: { $eq: ["$$permission", "COUPON_DELETE"] }, then: "coupons.delete" },
                      { case: { $eq: ["$$permission", "STORE_VIEW"] }, then: "stores.view" },
                      { case: { $eq: ["$$permission", "STORE_CREATE"] }, then: "stores.create" },
                      { case: { $eq: ["$$permission", "STORE_EDIT"] }, then: "stores.edit" },
                      { case: { $eq: ["$$permission", "STORE_DELETE"] }, then: "stores.delete" },
                      { case: { $eq: ["$$permission", "CATEGORY_VIEW"] }, then: "categories.view" },
                      { case: { $eq: ["$$permission", "CATEGORY_CREATE"] }, then: "categories.create" },
                      { case: { $eq: ["$$permission", "CATEGORY_EDIT"] }, then: "categories.edit" },
                      { case: { $eq: ["$$permission", "CATEGORY_DELETE"] }, then: "categories.delete" },
                    ],
                    default: "$$permission"
                  }
                }
              }
            }
          }
        }
      ]
    );

    console.log('Updated permissions for', result.nModified, 'users');
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error fixing permissions:', error);
    process.exit(1);
  }
}

fixPermissions();
