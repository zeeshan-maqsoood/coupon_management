const { MongoClient } = require('mongodb');

async function updateAdminPermissions() {
  const uri = 'mongodb://127.0.0.1:27017';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db('coupon-admin');
    const users = db.collection('users');

    // Define the new permissions format
    const newPermissions = [
      'users.view', 'users.create', 'users.edit', 'users.delete',
      'coupons.view', 'coupons.create', 'coupons.edit', 'coupons.delete',
      'stores.view', 'stores.create', 'stores.edit', 'stores.delete',
      'categories.view', 'categories.create', 'categories.edit', 'categories.delete'
    ];

    // Update the admin user
    const result = await users.updateOne(
      { email: 'admin@example.com' },
      { 
        $set: { 
          permissions: newPermissions,
          // Reset password to 'admin123' (hashed automatically by pre-save hook)
          password: 'admin123'
        } 
      }
    );

    if (result.matchedCount === 0) {
      console.log('No admin user found with email admin@example.com');
    } else {
      console.log('Successfully updated admin permissions and reset password to "admin123"');
    }
  } finally {
    await client.close();
  }
}

updateAdminPermissions().catch(console.error);
