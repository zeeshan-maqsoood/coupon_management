const mongoose = require('mongoose');

async function testConnection() {
  try {
    console.log('Attempting to connect to MongoDB...');
    
    // Try with direct connection
    await mongoose.connect('mongodb://127.0.0.1:27017/coupon-admin', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('Successfully connected to MongoDB');
    
    // List all collections in the database
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Collections in database:');
    collections.forEach(c => console.log(`- ${c.name}`));
    
    // Check if users collection exists
    if (collections.some(c => c.name === 'users')) {
      const users = await mongoose.connection.db.collection('users').find({}).toArray();
      console.log('\nUsers in database:');
      console.log(users);
    } else {
      console.log('\nUsers collection does not exist');
    }
    
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

testConnection();
