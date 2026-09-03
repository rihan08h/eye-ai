const bcrypt = require('bcryptjs');

/**
 * High-performance In-Memory Development Store.
 * Active ONLY when MongoDB is not connected so hackathon demos & local UI testing
 * work 100% instantly without waiting for or configuring a database.
 */
class DevMemoryStore {
  constructor() {
    this.users = [];
    this.patients = [];
    this.screenings = [];
    this.referrals = [];
    this.camps = [];

    // Pre-populate with realistic demo accounts so you can login immediately
    this._initDefaultData();
  }

  async _initDefaultData() {
    const passwordHash = await bcrypt.hash('password123', 10);

    const hw = {
      _id: 'dev_user_hw_01',
      name: 'Sister Anjali Rao',
      email: 'healthworker@retina.ai',
      password: passwordHash,
      role: 'healthworker',
      phone: '9845011223',
      organization: 'Ramanagara Primary Health Centre',
      isActive: true,
      createdAt: new Date(),
    };

    const doc = {
      _id: 'dev_user_doc_01',
      name: 'Dr. Sudhir Kulkarni, MS (Ophth)',
      email: 'doctor@retina.ai',
      password: passwordHash,
      role: 'doctor',
      phone: '9845099887',
      organization: 'Minto Eye Hospital & Regional Institute',
      isActive: true,
      createdAt: new Date(),
    };

    const admin = {
      _id: 'dev_user_admin_01',
      name: 'Admin Officer',
      email: 'admin@retina.ai',
      password: passwordHash,
      role: 'admin',
      phone: '9845000111',
      organization: 'National Health Mission',
      isActive: true,
      createdAt: new Date(),
    };

    this.users.push(hw, doc, admin);

    // Initialise empty collections — no hardcoded mock patients, screenings, camps, or referrals.
    // All records are created dynamically by the user through the interface.
    this.camps = [];
    this.patients = [];
    this.screenings = [];
    this.referrals = [];
  }
}

const devStore = new DevMemoryStore();

module.exports = devStore;
