/**
 * Automated Test Suite: Per-User Data Isolation
 * Verifies that User A and User B cannot view, search, update, or delete each other's records.
 */
process.env.NODE_ENV = 'development';
process.env.USE_MOCK_ML = 'true';
process.env.PORT = '8099';

const http = require('http');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');

// Start the server
const app = require('./index');
const PORT = 8099;
const BASE_URL = `http://localhost:${PORT}/api`;

let testsPassed = 0;
let testsFailed = 0;

function assert(condition, message) {
  if (condition) {
    testsPassed++;
    console.log(`  ✓ ${message}`);
  } else {
    testsFailed++;
    console.error(`  ✗ FAIL: ${message}`);
  }
}

async function runTests() {
  console.log('\n======================================================');
  console.log('   RUNNING PER-USER DATA ISOLATION TEST SUITE');
  console.log('======================================================\n');

  // Allow server a moment to settle
  await new Promise((r) => setTimeout(r, 1200));

  try {
    // 1. Register User A & User B
    console.log('Test 1: User Registration');
    const timestamp = Date.now();
    const userARes = await axios.post(`${BASE_URL}/auth/register`, {
      name: 'User A',
      email: `user_a_${timestamp}@example.com`,
      password: 'password123',
      role: 'healthworker',
      organization: 'Clinic Alpha',
    });
    assert(userARes.status === 201, 'User A registered successfully');
    const cookieA = userARes.headers['set-cookie'];

    const userBRes = await axios.post(`${BASE_URL}/auth/register`, {
      name: 'User B',
      email: `user_b_${timestamp}@example.com`,
      password: 'password123',
      role: 'healthworker',
      organization: 'Clinic Alpha', // Same organization!
    });
    assert(userBRes.status === 201, 'User B registered successfully in same organization');
    const cookieB = userBRes.headers['set-cookie'];

    const clientA = axios.create({
      baseURL: BASE_URL,
      headers: { Cookie: cookieA },
      validateStatus: () => true,
    });

    const clientB = axios.create({
      baseURL: BASE_URL,
      headers: { Cookie: cookieB },
      validateStatus: () => true,
    });

    // 2. Patient Isolation
    console.log('\nTest 2: Patient Creation & Isolation');
    const patARes = await clientA.post('/patients', {
      name: 'Ramesh Patel (User A Patient)',
      age: 52,
      gender: 'Male',
      phone: '9876543210',
      village: 'Alpha Village',
      district: 'Bengaluru Rural',
      state: 'Karnataka',
    });
    assert(patARes.status === 201, 'User A creates Patient A');
    const patientA = patARes.data.patient;

    const patBRes = await clientB.post('/patients', {
      name: 'Suresh Kumar (User B Patient)',
      age: 48,
      gender: 'Male',
      phone: '9123456780',
      village: 'Beta Village',
      district: 'Bengaluru Rural',
      state: 'Karnataka',
    });
    assert(patBRes.status === 201, 'User B creates Patient B');
    const patientB = patBRes.data.patient;

    // 3. Patient List Isolation
    console.log('\nTest 3: Patient Listing Isolation');
    const listA = await clientA.get('/patients');
    assert(
      listA.data.patients.some((p) => p._id === patientA._id) &&
      !listA.data.patients.some((p) => p._id === patientB._id),
      'User A sees Patient A but NOT Patient B'
    );

    const listB = await clientB.get('/patients');
    assert(
      listB.data.patients.some((p) => p._id === patientB._id) &&
      !listB.data.patients.some((p) => p._id === patientA._id),
      'User B sees Patient B but NOT Patient A'
    );

    // 4. Cross-Tenant Patient Access by ID
    console.log('\nTest 4: Cross-Tenant Direct Record Access (Patient by ID)');
    const aGetsB = await clientA.get(`/patients/${patientB._id}`);
    assert(aGetsB.status === 404, 'User A getting Patient B returns 404 Not Found');

    const bGetsA = await clientB.get(`/patients/${patientA._id}`);
    assert(bGetsA.status === 404, 'User B getting Patient A returns 404 Not Found');

    // 5. Patient Search Isolation
    console.log('\nTest 5: Patient Search Isolation');
    const searchAForB = await clientA.get('/patients?search=Suresh');
    assert(searchAForB.data.patients.length === 0, 'User A searching for Patient B name returns 0 results');

    const searchBForA = await clientB.get('/patients?search=Ramesh');
    assert(searchBForA.data.patients.length === 0, 'User B searching for Patient A name returns 0 results');

    // 6. Cross-Tenant Patient Update
    console.log('\nTest 6: Cross-Tenant Patient Update');
    const aUpdatesB = await clientA.put(`/patients/${patientB._id}`, {
      name: 'Hacked Patient B Name',
      age: 60,
      gender: 'Male',
      village: 'Beta Village',
      district: 'Bengaluru Rural',
      state: 'Karnataka',
    });
    assert(aUpdatesB.status === 404, 'User A updating Patient B returns 404 Not Found');

    // 7. Cross-Tenant Patient Deletion
    console.log('\nTest 7: Cross-Tenant Patient Deletion');
    const aDeletesB = await clientA.delete(`/patients/${patientB._id}`);
    assert(aDeletesB.status === 404, 'User A deleting Patient B returns 404 Not Found');

    // 8. Screening Creation & Cross-Tenant Protection
    console.log('\nTest 8: Screening Isolation');
    const dummyImagePath = path.join(__dirname, 'test_dummy_fundus.jpg');
    fs.writeFileSync(dummyImagePath, 'dummy-image-bytes-for-screening-test');

    // User A creates screening for Patient A
    const formA = new FormData();
    formA.append('patientId', patientA._id);
    formA.append('eyeSide', 'Right Eye (OD)');
    formA.append('notes', 'Screening A notes');
    formA.append('image', fs.createReadStream(dummyImagePath));

    const screenARes = await clientA.post('/screenings', formA, {
      headers: formA.getHeaders(),
    });
    assert(screenARes.status === 201, 'User A creates Screening A for Patient A');
    const screeningA = screenARes.data.screening;

    // User B tries to create screening for Patient A (belonging to User A)
    const formBforA = new FormData();
    formBforA.append('patientId', patientA._id);
    formBforA.append('eyeSide', 'Left Eye (OS)');
    formBforA.append('image', fs.createReadStream(dummyImagePath));

    const screenBforARes = await clientB.post('/screenings', formBforA, {
      headers: formBforA.getHeaders(),
    });
    assert(screenBforARes.status === 404, 'User B creating screening for User A Patient returns 404');

    // User B creates screening for Patient B
    const formB = new FormData();
    formB.append('patientId', patientB._id);
    formB.append('eyeSide', 'Left Eye (OS)');
    formB.append('notes', 'Screening B notes');
    formB.append('image', fs.createReadStream(dummyImagePath));

    const screenBRes = await clientB.post('/screenings', formB, {
      headers: formB.getHeaders(),
    });
    assert(screenBRes.status === 201, 'User B creates Screening B for Patient B');
    const screeningB = screenBRes.data.screening;

    // 9. Screening List & Direct Access Isolation
    console.log('\nTest 9: Screening List & Direct Access Isolation');
    const screenListA = await clientA.get('/screenings');
    assert(
      screenListA.data.screenings.some((s) => s._id === screeningA._id) &&
      !screenListA.data.screenings.some((s) => s._id === screeningB._id),
      'User A screenings list contains Screening A and NOT Screening B'
    );

    const screenListB = await clientB.get('/screenings');
    assert(
      screenListB.data.screenings.some((s) => s._id === screeningB._id) &&
      !screenListB.data.screenings.some((s) => s._id === screeningA._id),
      'User B screenings list contains Screening B and NOT Screening A'
    );

    const aGetsScreenB = await clientA.get(`/screenings/${screeningB._id}`);
    assert(aGetsScreenB.status === 404, 'User A accessing Screening B returns 404');

    const bGetsScreenA = await clientB.get(`/screenings/${screeningA._id}`);
    assert(bGetsScreenA.status === 404, 'User B accessing Screening A returns 404');

    // 10. Referral Isolation
    console.log('\nTest 10: Referral Isolation');
    // User A creates referral for Screening A
    const refARes = await clientA.post('/referrals', {
      patient: patientA._id,
      screening: screeningA._id,
      priority: 'URGENT',
      notes: 'Urgent laser needed',
    });
    assert(refARes.status === 201, 'User A creates Referral A');
    const referralA = refARes.data.referral;

    // User B tries to create referral referencing User A's screening
    const refBforARes = await clientB.post('/referrals', {
      patient: patientA._id,
      screening: screeningA._id,
      priority: 'HIGH',
    });
    assert(refBforARes.status === 404, 'User B creating referral for User A screening returns 404');

    // Referral list isolation
    const refListA = await clientA.get('/referrals');
    assert(
      refListA.data.referrals.some((r) => r._id === referralA._id),
      'User A referral list contains Referral A'
    );

    const refListB = await clientB.get('/referrals');
    assert(
      !refListB.data.referrals.some((r) => r._id === referralA._id),
      'User B referral list does NOT contain Referral A'
    );

    // Cross-tenant get referral by ID
    const bGetsRefA = await clientB.get(`/referrals/${referralA._id}`);
    assert(bGetsRefA.status === 404, 'User B accessing Referral A by ID returns 404');

    // Cross-tenant update referral status
    const bUpdatesRefA = await clientB.patch(`/referrals/${referralA._id}/status`, {
      status: 'Completed',
    });
    assert(bUpdatesRefA.status === 404, 'User B updating Referral A returns 404');

    // 11. Dashboard Analytics Isolation
    console.log('\nTest 11: Dashboard Analytics Isolation');
    const dashA = await clientA.get('/analytics/dashboard');
    assert(dashA.status === 200, 'User A fetched dashboard analytics');
    assert(dashA.data.totalPatients === 1, `User A dashboard totalPatients === 1 (got ${dashA.data.totalPatients})`);
    assert(dashA.data.totalScreenings === 1, `User A dashboard totalScreenings === 1 (got ${dashA.data.totalScreenings})`);
    assert(dashA.data.pendingReferrals === 1, `User A dashboard pendingReferrals === 1 (got ${dashA.data.pendingReferrals})`);

    const dashB = await clientB.get('/analytics/dashboard');
    assert(dashB.status === 200, 'User B fetched dashboard analytics');
    assert(dashB.data.totalPatients === 1, `User B dashboard totalPatients === 1 (got ${dashB.data.totalPatients})`);
    assert(dashB.data.totalScreenings === 1, `User B dashboard totalScreenings === 1 (got ${dashB.data.totalScreenings})`);
    assert(dashB.data.pendingReferrals === 0, `User B dashboard pendingReferrals === 0 (got ${dashB.data.pendingReferrals})`);

    // 12. Deletion by Owner & Cascade
    console.log('\nTest 12: Owner Deletes Patient');
    const deleteARes = await clientA.delete(`/patients/${patientA._id}`);
    assert(deleteARes.status === 200, 'User A successfully deletes own Patient A');

    const postDelListA = await clientA.get('/patients');
    assert(postDelListA.data.patients.length === 0, 'User A patient list is now empty');

    const postDelListB = await clientB.get('/patients');
    assert(
      postDelListB.data.patients.some((p) => p._id === patientB._id),
      'User B patient list still contains Patient B intact'
    );

    // Clean up test file
    try {
      fs.unlinkSync(dummyImagePath);
    } catch {}

    console.log('\n======================================================');
    console.log(`TEST SUMMARY: ${testsPassed} PASSED, ${testsFailed} FAILED`);
    console.log('======================================================\n');

    process.exit(testsFailed === 0 ? 0 : 1);
  } catch (error) {
    console.error('Test execution error:', error.response?.data || error.message);
    process.exit(1);
  }
}

runTests();
