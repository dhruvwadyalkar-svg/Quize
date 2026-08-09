import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';
import dns from 'dns';

dotenv.config();

// Standard DNS fallback for Windows SRV queries
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {}

const uri = process.env.MONGODB_URI;

if (!uri) {
  console.error('❌ MONGODB_URI is not defined in .env!');
  process.exit(1);
}

const client = new MongoClient(uri);

async function testConnection() {
  try {
    console.log('📡 Connecting to MongoDB Atlas using MONGODB_URI...');
    await client.connect();
    console.log('✅ MongoDB connected!');
    await client.db().admin().ping();
    console.log('🎉 Ping successfully received from MongoDB database cluster!');
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
  } finally {
    await client.close();
  }
}

testConnection();
