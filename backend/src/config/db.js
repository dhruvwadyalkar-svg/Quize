import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mongodInstance = null;

import dns from 'dns';

export const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    console.log('✅ Already connected to database.');
    return;
  }

  // 1. Check for Cloud Database URI (e.g. MongoDB Atlas / Supabase / Remote DB)
  const mongoURI = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (mongoURI && mongoURI.trim().startsWith('mongodb')) {
    try {
      mongoose.set('strictQuery', false);
      console.log(`📡 Connecting to Cloud Database (MongoDB Atlas)...`);
      try {
        dns.setServers(['8.8.8.8', '1.1.1.1']);
      } catch (e) {
        // Ignore DNS set error if custom servers not allowed
      }
      await mongoose.connect(mongoURI.trim(), {
        serverSelectionTimeoutMS: 8000,
      });
      console.log('✅ MongoDB connected! Connected to Cloud Database successfully.');
      return;
    } catch (err) {
      console.error('❌ Cloud Database Connection Failed:', err.message);
    }
  }

  // 2. Try connecting to local installed MongoDB service
  const localUri = 'mongodb://127.0.0.1:27017/livequiz';
  try {
    mongoose.set('strictQuery', false);
    console.log(`Connecting to local MongoDB service at ${localUri}...`);
    await mongoose.connect(localUri, {
      serverSelectionTimeoutMS: 2000,
    });
    console.log('✅ Connected to local MongoDB service successfully.');
    return;
  } catch (error) {
    console.warn('⚠️ Local MongoDB service not detected. Starting persistent database engine...');
  }

  // 3. Persistent Local Database Storage (Saves users, login/register, quizzes, student marks across server restarts)
  try {
    const dbPath = path.resolve(__dirname, '../../data/db_storage');
    if (!fs.existsSync(dbPath)) {
      fs.mkdirSync(dbPath, { recursive: true });
    }

    if (!mongodInstance) {
      mongodInstance = await MongoMemoryServer.create({
        instance: {
          dbPath: dbPath,
          storageEngine: 'wiredTiger',
        },
      });
    }

    const uri = mongodInstance.getUri() + 'livequiz';
    console.log(`🚀 Persistent Database active at: ${dbPath}`);
    await mongoose.connect(uri);
    console.log('✅ Connected to persistent database engine successfully. Data will be saved permanently!');
  } catch (memError) {
    console.error('❌ Failed DB initialization:', memError);
    process.exit(1);
  }
};

