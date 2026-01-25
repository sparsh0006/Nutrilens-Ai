// src/lib/db/mongodb.ts

import { MongoClient, Db } from 'mongodb';

if (!process.env.MONGODB_URI) {
  console.warn('MONGODB_URI is not defined. MongoDB features will be unavailable.');
}

const uri = process.env.MONGODB_URI || '';
const dbName = process.env.MONGODB_DB_NAME || 'nutrilens';

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function connectToDatabase(): Promise<{
  client: MongoClient;
  db: Db;
}> {
  // Return cached connection if available
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  if (!uri) {
    throw new Error('MongoDB URI is not defined. Please set MONGODB_URI in your environment variables.');
  }

  // Create new connection
  const client = new MongoClient(uri, {
    maxPoolSize: 10,
    minPoolSize: 5,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  });

  await client.connect();
  const db = client.db(dbName);

  // Cache the connection
  cachedClient = client;
  cachedDb = db;

  console.log(`✅ Connected to MongoDB: ${dbName}`);

  return { client, db };
}

// Helper function to get database instance
export async function getDatabase(): Promise<Db> {
  const { db } = await connectToDatabase();
  return db;
}

// Helper function to close connection (use in cleanup scenarios)
export async function closeDatabaseConnection(): Promise<void> {
  if (cachedClient) {
    await cachedClient.close();
    cachedClient = null;
    cachedDb = null;
    console.log('MongoDB connection closed');
  }
}

// Health check function
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    if (!uri) return false;
    
    const { db } = await connectToDatabase();
    await db.admin().ping();
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}

export default connectToDatabase;