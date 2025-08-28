const { MongoClient } = require('mongodb');

async function checkMongoDB() {
  const uri = 'mongodb://127.0.0.1:27017';
  const client = new MongoClient(uri);

  try {
    await client.connect();
    console.log('Successfully connected to MongoDB');
    
    // List all databases
    const adminDb = client.db('admin').admin();
    const dbs = await adminDb.listDatabases();
    console.log('Available databases:');
    dbs.databases.forEach(db => console.log(`- ${db.name}`));
    
    // Check if coupon-admin exists
    const db = client.db('coupon-admin');
    const collections = await db.listCollections().toArray();
    console.log('\nCollections in coupon-admin:');
    collections.forEach(coll => console.log(`- ${coll.name}`));
    
    // Check if users collection exists and has data
    try {
      const users = db.collection('users');
      const count = await users.countDocuments();
      console.log(`\nFound ${count} users in the database`);
      
      if (count > 0) {
        const user = await users.findOne({});
        console.log('Sample user:', {
          email: user.email,
          username: user.username,
          role: user.role,
          status: user.status
        });
      }
    } catch (e) {
      console.log('\nError accessing users collection:', e.message);
    }
    
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    console.log('\nPlease make sure MongoDB is running and accessible at mongodb://127.0.0.1:27017');
  } finally {
    await client.close();
    process.exit(0);
  }
}

checkMongoDB();
