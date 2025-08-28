import mongoose from 'mongoose';

// Import models to ensure they're registered
import Store from '@/models/Store';
import Category from '@/models/Category';
import SubCategory from '@/models/SubCategory';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

// Enable debug mode in development
if (process.env.NODE_ENV === 'development') {
  mongoose.set('debug', true);
}

// Initialize cached variable with the correct type
declare global {
  var mongoose: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  };
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  console.log('Connecting to MongoDB...');
  console.log('MongoDB URI:', MONGODB_URI ? `${MONGODB_URI.split('@').pop()?.split('?')[0]}` : 'Not set');

  if (cached.conn) {
    console.log('Using cached database connection');
    return cached.conn as typeof mongoose;
  }

  if (!cached.promise) {
    const opts: ConnectOptions = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 10000, // 10 seconds timeout
      socketTimeoutMS: 45000, // 45 seconds timeout
    };

    console.log('Creating new database connection...');
    
    cached.promise = mongoose.connect(MONGODB_URI!, opts)
      .then((mongooseInstance) => {
        console.log('Successfully connected to MongoDB');
        return mongooseInstance;
      })
      .catch((error) => {
        console.error('MongoDB connection error:', error);
        throw error;
      });
  }

  try {
    console.log('Waiting for connection...');
    cached.conn = await cached.promise;
    console.log('Database connection established');
    
    // Test the connection
    const db = mongoose.connection;
    console.log('MongoDB connected to database:', db.name);
    
    // List all collections - safely access db.db
    if (db.db) {
      try {
        const collections = await db.db.listCollections().toArray();
        console.log('Available collections:', collections.map((c: any) => c.name));
      } catch (error) {
        console.error('Error listing collections:', error);
      }
    } else {
      console.log('Database instance not available');
    }
    
  } catch (e) {
    console.error('Error in dbConnect:', e);
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default dbConnect
