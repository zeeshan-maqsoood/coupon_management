const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

async function createAdminUser() {
  const uri = 'mongodb://127.0.0.1:27017';
  const client = new MongoClient(uri);

  try {
    console.log('Connecting to MongoDB...');
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db('coupon-admin');
    const users = db.collection('users');

    // Check if admin already exists
    const existingAdmin = await users.findOne({
      $or: [
        { username: 'admin' },
        { email: 'admin@example.com' }
      ]
    });

    if (existingAdmin) {
      console.log('Admin user already exists');
      return;
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);

    // Create admin user
    await users.insertOne({
      username: 'admin',
      email: 'admin@example.com',
      password: hashedPassword,
      role: 'admin',
      permissions: [
        'USER_VIEW', 'USER_CREATE', 'USER_EDIT', 'USER_DELETE',
        'COUPON_VIEW', 'COUPON_CREATE', 'COUPON_EDIT', 'COUPON_DELETE',
        'STORE_VIEW', 'STORE_CREATE', 'STORE_EDIT', 'STORE_DELETE',
        'CATEGORY_VIEW', 'CATEGORY_CREATE', 'CATEGORY_EDIT', 'CATEGORY_DELETE'
      ],
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    console.log('Admin user created successfully!');
    console.log('Username: admin');
    console.log('Password: admin123');
    console.log('Please change the password after first login.');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.close();
  }
}

createAdminUser();
