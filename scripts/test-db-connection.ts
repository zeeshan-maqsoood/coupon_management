import mongoose from 'mongoose';
import dbConnect from "@/lib/mongodb"

async function testConnection() {
  try {
    console.log('Connecting to MongoDB...');
    await dbConnect();
    
    // Get the default connection
    const db = mongoose.connection;
    
    // List all collections
    const collections = await db.db.listCollections().toArray();
    console.log('\n=== Collections ===');
    console.table(collections.map(c => ({ name: c.name, type: c.type })));
    
    // Try to access the stores collection directly
    const storeCount = await db.db.collection('stores').countDocuments();
    console.log(`\nFound ${storeCount} stores in the database.`);
    
    if (storeCount > 0) {
      const firstStore = await db.db.collection('stores').findOne({});
      console.log('\nFirst store in database:');
      console.log(JSON.stringify(firstStore, null, 2));
    }
    
  } catch (error) {
    console.error('Error testing database connection:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

testConnection();
