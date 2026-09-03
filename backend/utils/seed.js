require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Patient = require('../models/Patient');
const Screening = require('../models/Screening');
const Referral = require('../models/Referral');
const Camp = require('../models/Camp');

const samplePatients = [
  {
    patientId: 'PAT-2026-0001',
    name: 'Ramesh Gowda',
    age: 58,
    gender: 'Male',
    phone: '9845123456',
    village: 'Channapatna',
    district: 'Ramanagara',
    state: 'Karnataka',
    diabetesDuration: '10+ years',
    knownDiabetic: true,
    previousEyeProblems: 'Occasional blurred vision',
    emergencyContact: { name: 'Suresh Gowda', phone: '9845123457', relation: 'Son' },
  },
  {
    patientId: 'PAT-2026-0002',
    name: 'Lakshmi Devi',
    age: 62,
    gender: 'Female',
    phone: '9741234567',
    village: 'Kanakapura',
    district: 'Ramanagara',
    state: 'Karnataka',
    diabetesDuration: '5-10 years',
    knownDiabetic: true,
    previousEyeProblems: 'None',
    emergencyContact: { name: 'Venkatesh', phone: '9741234568', relation: 'Husband' },
  },
  {
    patientId: 'PAT-2026-0003',
    name: 'Mohammed Rafi',
    age: 49,
    gender: 'Male',
    phone: '9980123456',
    village: 'Magadi',
    district: 'Ramanagara',
    state: 'Karnataka',
    diabetesDuration: '1-5 years',
    knownDiabetic: true,
    previousEyeProblems: 'Floaters in left eye',
    emergencyContact: { name: 'Ayesha', phone: '9980123457', relation: 'Daughter' },
  },
  {
    patientId: 'PAT-2026-0004',
    name: 'Basavaraj Patil',
    age: 66,
    gender: 'Male',
    phone: '9448123456',
    village: 'Bidadi',
    district: 'Ramanagara',
    state: 'Karnataka',
    diabetesDuration: '10+ years',
    knownDiabetic: true,
    previousEyeProblems: 'Difficulty reading in dim light',
    emergencyContact: { name: 'Mallikarjun', phone: '9448123457', relation: 'Brother' },
  },
  {
    patientId: 'PAT-2026-0005',
    name: 'Anasuya Bai',
    age: 54,
    gender: 'Female',
    phone: '9611123456',
    village: 'Harohalli',
    district: 'Ramanagara',
    state: 'Karnataka',
    diabetesDuration: '< 1 year',
    knownDiabetic: true,
    previousEyeProblems: 'None',
    emergencyContact: { name: 'Gopal', phone: '9611123457', relation: 'Husband' },
  },
];

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB for seeding...');

    // Clear existing
    await User.deleteMany();
    await Patient.deleteMany();
    await Screening.deleteMany();
    await Referral.deleteMany();
    await Camp.deleteMany();

    // 1. Create Users
    const healthworker = await User.create({
      name: 'Sister Anjali Rao',
      email: 'healthworker@retina.ai',
      password: 'password123',
      role: 'healthworker',
      phone: '9845011223',
      organization: 'Ramanagara Primary Health Centre',
    });

    const doctor = await User.create({
      name: 'Dr. Sudhir Kulkarni, MS (Ophth)',
      email: 'doctor@retina.ai',
      password: 'password123',
      role: 'doctor',
      phone: '9845099887',
      organization: 'Minto Eye Hospital & Regional Institute',
    });

    const admin = await User.create({
      name: 'Admin Officer',
      email: 'admin@retina.ai',
      password: 'password123',
      role: 'admin',
      phone: '9845000111',
      organization: 'National Health Mission',
    });

    console.log('✅ Users created:');
    console.log('  Health Worker: healthworker@retina.ai / password123');
    console.log('  Doctor: doctor@retina.ai / password123');
    console.log('  Admin: admin@retina.ai / password123');

    // 2. Create Camp
    const camp = await Camp.create({
      name: 'Ramanagara Rural Diabetic Eye Screening Camp',
      location: 'Primary Health Centre, Channapatna',
      village: 'Channapatna',
      district: 'Ramanagara',
      state: 'Karnataka',
      startDate: new Date(),
      status: 'Active',
      targetScreenings: 150,
      createdBy: healthworker._id,
    });

    // 3. Create Patients
    const createdPatients = await Promise.all(
      samplePatients.map((p) =>
        Patient.create({
          ...p,
          screeningCamp: camp._id,
          createdBy: healthworker._id,
        })
      )
    );

    // 4. Create Screenings
    const screening1 = await Screening.create({
      patient: createdPatients[0]._id,
      screenedBy: healthworker._id,
      originalImageUrl: '/samples/13_left.jpeg',
      isMock: true,
      heatmapImageUrl: '',
      prediction: 'Proliferative DR',
      probabilities: { noDR: 0.01, mild: 0.02, moderate: 0.07, severe: 0.22, proliferative: 0.68 },
      confidence: 0.88,
      imageQuality: { status: 'good', score: 0.94 },
      riskLevel: 'critical',
      referralRequired: true,
      referralCreated: true,
      screeningCamp: camp._id,
      eyeSide: 'Right Eye (OD)',
      notes: 'Extensive neovascularization noted near optic disc.',
    });

    const screening2 = await Screening.create({
      patient: createdPatients[1]._id,
      screenedBy: healthworker._id,
      originalImageUrl: '/samples/13_left.jpeg',
      isMock: true,
      heatmapImageUrl: '',
      prediction: 'Moderate',
      probabilities: { noDR: 0.05, mild: 0.15, moderate: 0.72, severe: 0.06, proliferative: 0.02 },
      confidence: 0.79,
      imageQuality: { status: 'good', score: 0.89 },
      riskLevel: 'medium',
      referralRequired: true,
      referralCreated: true,
      screeningCamp: camp._id,
      eyeSide: 'Left Eye (OS)',
      notes: 'Microaneurysms and hard exudates in temporal quadrant.',
    });

    const screening3 = await Screening.create({
      patient: createdPatients[2]._id,
      screenedBy: healthworker._id,
      originalImageUrl: '/samples/13_left.jpeg',
      isMock: true,
      heatmapImageUrl: '',
      prediction: 'No DR',
      probabilities: { noDR: 0.94, mild: 0.04, moderate: 0.01, severe: 0.01, proliferative: 0.00 },
      confidence: 0.94,
      imageQuality: { status: 'good', score: 0.96 },
      riskLevel: 'low',
      referralRequired: false,
      screeningCamp: camp._id,
      eyeSide: 'Right Eye (OD)',
      notes: 'Clear retina. Normal macula and disc margins.',
    });

    // 5. Create Referrals
    await Referral.create({
      patient: createdPatients[0]._id,
      screening: screening1._id,
      createdBy: healthworker._id,
      assignedDoctor: doctor._id,
      priority: 'URGENT',
      status: 'Pending',
      hospitalName: 'Minto Regional Institute of Ophthalmology, Bangalore',
      appointmentDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      notes: 'High risk proliferative changes with threatened macula.',
    });

    await Referral.create({
      patient: createdPatients[1]._id,
      screening: screening2._id,
      createdBy: healthworker._id,
      assignedDoctor: doctor._id,
      priority: 'MODERATE',
      status: 'Under Review',
      hospitalName: 'District Hospital Ramanagara',
      appointmentDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      notes: 'Moderate NPDR. Follow-up dilated exam recommended.',
    });

    console.log('✅ Demo seed completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error.message);
    process.exit(1);
  }
};

seedData();
