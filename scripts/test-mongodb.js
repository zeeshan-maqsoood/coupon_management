const mongoose = require('mongoose');

async function testConnection() {
  try {
    const mongoUri = 'mongodb://127.0.0.1:27017/coupon-admin';
    console.log('Connecting to MongoDB at:', mongoUri);
    
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('Successfully connected to MongoDB');
    
    // List all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('Collections in database:');
    collections.forEach(collection => console.log('-', collection.name));
    
    // Check if users collection exists
    const usersCollection = collections.find(c => c.name === 'users');
    if (usersCollection) {
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
  }
}

testConnection();
