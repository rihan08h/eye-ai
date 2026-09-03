const mongoose = require('mongoose');
const { isProduction } = require('./env');

let isConnecting = false;

const connectDB = async () => {
  if (isConnecting) return;
  isConnecting = true;

  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 4000,
      socketTimeoutMS: 45000,
    });
    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
    isConnecting = false;
  } catch (error) {
    isConnecting = false;

    if (isProduction()) {
      // Retrying quietly in production means the process stays up and keeps
      // serving requests without a database — which is how a misconfigured
      // MONGODB_URI turns into an app running on seeded demo accounts.
      // Exit so the orchestrator restarts or alerts instead.
      console.error(`✖ [Database] Connection failed: ${error.message}`);
      console.error('  Refusing to run in production without a database.');
      process.exit(1);
    }

    console.warn(`⚠️ [Database] MongoDB connection failed (${error.message}).`);
    console.warn('👉 Set a valid MONGODB_URI in backend/.env. Using the in-memory dev store meanwhile.');
    setTimeout(connectDB, 15000);
  }
};

module.exports = connectDB;
