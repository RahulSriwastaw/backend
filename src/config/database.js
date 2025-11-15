import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://rupantaranai_db_user:auC2C5rXl4nNleWd@cluster0.skr2l3f.mongodb.net/rupantar_ai?retryWrites=true&w=majority&appName=Cluster0';

let isConnected = false;

// Configure Mongoose to not buffer operations when not connected
// This prevents "buffering timed out" errors
mongoose.set('bufferCommands', false);

export const connectDB = async (retries = 3, delay = 5000) => {
  if (isConnected) {
    console.log('MongoDB already connected');
    return;
  }

  for (let i = 0; i < retries; i++) {
    try {
      console.log(`Attempting to connect to MongoDB (attempt ${i + 1}/${retries})...`);
      const conn = await mongoose.connect(MONGODB_URI);
      
      isConnected = true;
      console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
      console.log(`✅ Database: ${conn.connection.name}`);
      
      // Handle connection events
      mongoose.connection.on('error', (err) => {
        console.error('MongoDB connection error:', err);
        isConnected = false;
      });

      mongoose.connection.on('disconnected', () => {
        console.log('⚠️  MongoDB disconnected - attempting to reconnect...');
        isConnected = false;
        // Attempt to reconnect after 5 seconds
        setTimeout(() => {
          if (!isConnected) {
            connectDB(1, 5000).catch(() => {
              console.log('Reconnection attempt failed, will retry on next operation');
            });
        }
        }, 5000);
      });

      mongoose.connection.on('reconnected', () => {
        console.log('✅ MongoDB reconnected');
        isConnected = true;
      });

      return conn;
    } catch (error) {
      console.error(`❌ MongoDB connection attempt ${i + 1} failed:`, error.message);
      
      if (i < retries - 1) {
        console.log(`⏳ Retrying in ${delay / 1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        console.error('❌ All MongoDB connection attempts failed');
        console.error('💡 Please check:');
        console.error('   1. MongoDB Atlas IP whitelist (add 0.0.0.0/0 for all IPs)');
        console.error('   2. MongoDB connection string in .env file');
        console.error('   3. Internet connection');
        isConnected = false;
        // Don't throw error - let server continue without DB
        return null;
      }
    }
  }
};

export const disconnectDB = async () => {
  if (!isConnected) return;
  
  try {
    await mongoose.disconnect();
    isConnected = false;
    console.log('MongoDB disconnected');
  } catch (error) {
    console.error('Error disconnecting MongoDB:', error.message);
  }
};

export default connectDB;

