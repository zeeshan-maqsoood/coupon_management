const { MongoClient } = require('mongodb');

async function checkDatabase() {
  const uri = 'mongodb://127.0.0.1:27017';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Successfully connected to MongoDB');
    
    const db = client.db('coupon-admin');
    
    // List all collections
    const collections = await db.listCollections().toArray();
    console.log('Collections:', collections.map(c => c.name));
    
    // Check users collection
    const users = db.collection('users');
    const userCount = await users.countDocuments();
    console.log(`Found ${userCount} users in the database`);
    
    // Show first user (if any)
    if (userCount > 0) {
      const firstUser = await users.findOne({});
      console.log('First user:', {
        email: firstUser.email,
        username: firstUser.username,
        permissions: firstUser.permissions,
        role: firstUser.role,
        status: firstUser.status
      });
    }
    
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
  } finally {
    await client.close();
  }
}

checkDatabase();
