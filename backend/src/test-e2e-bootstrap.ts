import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { AuthService } from './auth/auth.service';
import { CacheService } from './cache/cache.service';
import { GoalsService } from './goals/goals.service';
import { GoalPriority } from './goals/dto/create-goal.dto';

async function runVerificationTest() {
  console.log('--- STARTING VERIFICATION TEST FLOW ---');
  
  // Create NestJS Application Context (boots services without starting HTTP server)
  const app = await NestFactory.createApplicationContext(AppModule);
  
  const authService = app.get(AuthService);
  const cacheService = app.get(CacheService);
  const goalsService = app.get(GoalsService);

  const testEmail = 'tester_' + Math.random().toString(36).substring(2, 7) + '@example.com';
  const testUsername = 'tester_' + Math.random().toString(36).substring(2, 7);
  const testPassword = 'SecurePassword123';

  try {
    // 1. Request OTP Code
    console.log(`\nStep 1: Requesting OTP for email: ${testEmail}`);
    const requestRes = await authService.requestOtp(testEmail);
    console.log('Result:', requestRes);

    // 2. Fetch OTP from local cache
    console.log('\nStep 2: Retrieving OTP from memory cache...');
    const otpCode = await cacheService.get(`otp:${testEmail}`);
    console.log(`Retrieved OTP Code: ${otpCode}`);

    if (!otpCode) {
      throw new Error('OTP was not saved in cache!');
    }

    // 3. Verify OTP Code
    console.log('\nStep 3: Verifying OTP Code...');
    const verifyRes = await authService.verifyOtp({ email: testEmail, code: otpCode });
    console.log('Result:', verifyRes);

    // 4. Complete Registration
    console.log('\nStep 4: Registering new user account details...');
    const registerRes = await authService.register({
      email: testEmail,
      username: testUsername,
      password: testPassword,
    });
    console.log('Registered User ID:', registerRes.user.id);
    const userId = registerRes.user.id;

    // 5. Create Daily Schedule (Goals)
    console.log('\nStep 5: Creating Daily Schedule Tasks...');
    
    const goal1 = await goalsService.createGoal(userId, {
      title: '🌅 Morning Meditation & Mindset',
      description: 'Align energy and priorities for the day',
      priority: GoalPriority.MEDIUM,
      category: 'Health',
      startAt: new Date().toISOString(),
      endAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      estimatedTime: 30,
    });
    console.log('Created Task 1:', goal1.title);

    const goal2 = await goalsService.createGoal(userId, {
      title: '🚀 Code Authentication Verification Module',
      description: 'Write custom e2e test bootstrappers',
      priority: GoalPriority.URGENT,
      category: 'Work',
      startAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      endAt: new Date(Date.now() + 150 * 60 * 1000).toISOString(),
      estimatedTime: 90,
    });
    console.log('Created Task 2:', goal2.title);

    // 6. List and Verify Daily Schedule
    console.log('\nStep 6: Listing all schedule tasks from local database...');
    const list = await goalsService.listGoals(userId);
    console.log(`Retrieved ${list.length} goals successfully!`);
    list.forEach((g: any, idx: number) => {
      console.log(`  [${idx + 1}] Title: ${g.title} | Status: ${g.status} | Priority: ${g.priority}`);
    });

    console.log('\n--- VERIFICATION TEST FLOW PASSED SUCCESSFULLY ---');
  } catch (err: any) {
    console.error('\n❌ Verification Flow Failed:', err.message);
  } finally {
    await app.close();
  }
}

runVerificationTest();
