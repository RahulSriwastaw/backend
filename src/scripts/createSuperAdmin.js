// Script to create super admin in MongoDB
// Run: node src/scripts/createSuperAdmin.js

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Admin from '../models/Admin.js';
import crypto from 'crypto';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://rupantaranai_db_user:auC2C5rXl4nNleWd@cluster0.skr2l3f.mongodb.net/rupantar_ai?retryWrites=true&w=majority&appName=Cluster0';

const SUPER_ADMIN = {
  email: 'Rahul@Malik',
  password: 'Rupantramalik@rahul',
  name: 'Rahul Malik',
  role: 'super_admin',
};

async function createSuperAdmin() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check if super admin already exists
    const existingAdmin = await Admin.findOne({ email: SUPER_ADMIN.email.toLowerCase() });
    
    if (existingAdmin) {
      console.log('⚠️  Super admin already exists. Updating password...');
      // Hash password
      const hashedPassword = crypto.createHash('sha256').update(SUPER_ADMIN.password).digest('hex');
      existingAdmin.password = hashedPassword;
      existingAdmin.role = 'super_admin';
      existingAdmin.isActive = true;
      await existingAdmin.save();
      console.log('✅ Super admin password updated');
    } else {
      console.log('Creating super admin...');
      // Hash password
      const hashedPassword = crypto.createHash('sha256').update(SUPER_ADMIN.password).digest('hex');
      
      const superAdmin = new Admin({
        email: SUPER_ADMIN.email.toLowerCase(),
        password: hashedPassword,
        name: SUPER_ADMIN.name,
        role: SUPER_ADMIN.role,
        isActive: true,
        permissions: {
          users: { view: true, edit: true, delete: true },
          templates: { view: true, edit: true, approve: true },
          creators: { view: true, approve: true },
          transactions: { view: true, refund: true },
          moderation: { view: true, action: true },
          wallet: { view: true, adjust: true },
          aiConfig: { view: true, edit: true },
          finance: { view: true, export: true },
          reports: { view: true, export: true },
          settings: { view: true, edit: true },
          admins: { view: true, create: true },
        },
      });

      await superAdmin.save();
      console.log('✅ Super admin created successfully!');
      console.log('Email:', SUPER_ADMIN.email);
      console.log('Role:', SUPER_ADMIN.role);
    }

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

createSuperAdmin();

