import { MongoClient } from 'mongodb';

async function checkMongoDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017';
  const client = new MongoClient(uri);
  
  try {
    console.log('Connecting to MongoDB...');
    await client.connect();
    
    console.log('Successfully connected to MongoDB');
    
    // List all databases
    const adminDb = client.db('admin');
    const result = await adminDb.admin().listDatabases();
    
    console.log('\n=== Available Databases ===');
    console.table(result.databases.map(db => ({
      name: db.name,
      size: (db.sizeOnDisk / (1024 * 1024)).toFixed(2) + ' MB',
      empty: db.empty ? 'Yes' : 'No'
    })));
    
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
  } finally {
    await client.close();
    process.exit(0);
  }
}

checkMongoDB();
