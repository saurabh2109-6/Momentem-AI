import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

// Locate backend dev server task log file
const LOG_FILE_PATH = path.join(
  'C:',
  'Users',
  'Saurabh Chakarvarti',
  '.gemini',
  'antigravity',
  'brain',
  'd128ee28-93ed-46c8-b316-8fb0805a2db1',
  '.system_generated',
  'tasks',
  'task-1413.log'
);

async function runHttpApiCheck() {
  console.log('--- STARTING LIVE HTTP API CHECK ---');
  const baseUrl = 'http://localhost:3001/api';
  const testEmail = 'http_tester_' + Math.random().toString(36).substring(2, 7) + '@example.com';
  const testUsername = 'http_tester_' + Math.random().toString(36).substring(2, 7);
  const testPassword = 'Password123!';

  try {
    // 1. Request OTP Code
    console.log(`\nStep 1: Sending POST to /auth/otp/request for: ${testEmail}`);
    const reqRes = await axios.post(`${baseUrl}/auth/otp/request`, { email: testEmail });
    console.log('Response Status:', reqRes.status);
    console.log('Response Data:', reqRes.data);

    // Give the server a moment to log
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // 2. Read log file and parse OTP
    console.log('\nStep 2: Parsing OTP from backend dev server task logs...');
    if (!fs.existsSync(LOG_FILE_PATH)) {
      throw new Error(`Task log file not found at: ${LOG_FILE_PATH}`);
    }

    const logContent = fs.readFileSync(LOG_FILE_PATH, 'utf8');
    const regex = new RegExp(`Generated code for ${testEmail}: (\\d{6})`);
    const match = logContent.match(regex);

    if (!match) {
      throw new Error(`Could not find generated OTP code for ${testEmail} in logs!`);
    }

    const otpCode = match[1];
    console.log(`Successfully parsed OTP from logs: ${otpCode}`);

    // 3. Verify security: Test validation by sending a WRONG OTP code
    console.log('\nStep 3: Verification Security Check (Sending wrong OTP code "999999")...');
    try {
      await axios.post(`${baseUrl}/auth/otp/verify`, {
        email: testEmail,
        code: '999999',
      });
      console.log('❌ FAIL: Server accepted incorrect OTP code!');
    } catch (err: any) {
      console.log('✔ SUCCESS: Incorrect code blocked successfully! Server returned:', err.response?.data?.message);
    }

    // 4. Verify correct OTP
    console.log('\nStep 4: Verifying with CORRECT OTP code...');
    const verifyRes = await axios.post(`${baseUrl}/auth/otp/verify`, {
      email: testEmail,
      code: otpCode,
    });
    console.log('Response Status:', verifyRes.status);
    console.log('Response Data:', verifyRes.data);

    // 5. Complete Registration
    console.log('\nStep 5: Registering account using verified email...');
    const regRes = await axios.post(`${baseUrl}/auth/register`, {
      email: testEmail,
      username: testUsername,
      password: testPassword,
    });
    console.log('Response Status:', regRes.status);
    console.log('User registered user ID:', regRes.data.user.id);
    const accessToken = regRes.data.accessToken;

    // 6. Create Daily Task
    console.log('\nStep 6: Creating daily schedule task using auth token...');
    const goalRes = await axios.post(
      `${baseUrl}/goals`,
      {
        title: '📊 Verify HTTP API Flow',
        description: 'Automatic checker verified schedule endpoints',
        priority: 'HIGH',
        category: 'Test',
        startAt: new Date().toISOString(),
        endAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        estimatedTime: 60,
      },
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );
    console.log('Response Status:', goalRes.status);
    console.log('Created Goal title:', goalRes.data.title);

    // 7. List Schedule
    console.log('\nStep 7: Retrieving daily schedule list...');
    const listRes = await axios.get(`${baseUrl}/goals`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    console.log(`Successfully retrieved ${listRes.data.length} tasks!`);
    listRes.data.forEach((task: any, index: number) => {
      console.log(`  [${index + 1}] Title: ${task.title} | Priority: ${task.priority}`);
    });

    console.log('\n--- LIVE HTTP API CHECK COMPLETED SUCCESSFULY ---');
  } catch (err: any) {
    console.error('\n❌ HTTP API Check Failed:', err.response?.data || err.message);
  }
}

runHttpApiCheck();
