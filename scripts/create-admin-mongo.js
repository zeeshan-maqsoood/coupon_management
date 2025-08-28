const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

async function createAdmin() {
  const uri = 'mongodb://127.0.0.1:27017';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db('coupon-admin');
    const users = db.collection('users');

    // Delete existing admin if any
    await users.deleteOne({ email: 'admin@example.com' });

    // Hash the password
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Create admin user
    const result = await users.insertOne({
      username: 'admin',
      email: 'admin@example.com',
      password: hashedPassword,
      role: 'admin',
      permissions: [
        'users.view', 'users.create', 'users.edit', 'users.delete',
        'coupons.view', 'coupons.create', 'coupons.edit', 'coupons.delete',
        'stores.view', 'stores.create', 'stores.edit', 'stores.delete',
        'categories.view', 'categories.create', 'categories.edit', 'categories.delete'
      ],
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    console.log('Admin user created successfully!');
    console.log('Email: admin@example.com');
    console.log('Password: admin123');
    
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await client.close();
    process.exit(0);
  }
}

createAdmin();
