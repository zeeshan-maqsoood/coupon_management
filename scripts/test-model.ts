import dbConnect from "@/lib/mongodb"
import mongoose from 'mongoose';

async function testModel() {
  try {
    console.log('Connecting to database...');
    await dbConnect();
    
    // Check if Store model is registered
    const isStoreModel = mongoose.models.Store !== undefined;
    console.log('Store model registered:', isStoreModel);
    
    if (isStoreModel) {
      // Try to count documents
      const count = await mongoose.models.Store.countDocuments({});
      console.log(`Found ${count} stores in the database.`);
      
      // Try to find one store
      const store = await mongoose.models.Store.findOne({}).lean();
      console.log('First store:', JSON.stringify(store, null, 2));
    } else {
      console.log('Store model is not registered. Checking models:');
      console.log(Object.keys(mongoose.models));
    }
    
  } catch (error) {
    console.error('Error in testModel:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

testModel();
