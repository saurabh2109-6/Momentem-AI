"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const auth_service_1 = require("./auth/auth.service");
const cache_service_1 = require("./cache/cache.service");
const goals_service_1 = require("./goals/goals.service");
const create_goal_dto_1 = require("./goals/dto/create-goal.dto");
async function runVerificationTest() {
    console.log('--- STARTING VERIFICATION TEST FLOW ---');
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule);
    const authService = app.get(auth_service_1.AuthService);
    const cacheService = app.get(cache_service_1.CacheService);
    const goalsService = app.get(goals_service_1.GoalsService);
    const testEmail = 'tester_' + Math.random().toString(36).substring(2, 7) + '@example.com';
    const testUsername = 'tester_' + Math.random().toString(36).substring(2, 7);
    const testPassword = 'SecurePassword123';
    try {
        console.log(`\nStep 1: Requesting OTP for email: ${testEmail}`);
        const requestRes = await authService.requestOtp(testEmail);
        console.log('Result:', requestRes);
        console.log('\nStep 2: Retrieving OTP from memory cache...');
        const otpCode = await cacheService.get(`otp:${testEmail}`);
        console.log(`Retrieved OTP Code: ${otpCode}`);
        if (!otpCode) {
            throw new Error('OTP was not saved in cache!');
        }
        console.log('\nStep 3: Verifying OTP Code...');
        const verifyRes = await authService.verifyOtp({ email: testEmail, code: otpCode });
        console.log('Result:', verifyRes);
        console.log('\nStep 4: Registering new user account details...');
        const registerRes = await authService.register({
            email: testEmail,
            username: testUsername,
            password: testPassword,
        });
        console.log('Registered User ID:', registerRes.user.id);
        const userId = registerRes.user.id;
        console.log('\nStep 5: Creating Daily Schedule Tasks...');
        const goal1 = await goalsService.createGoal(userId, {
            title: '🌅 Morning Meditation & Mindset',
            description: 'Align energy and priorities for the day',
            priority: create_goal_dto_1.GoalPriority.MEDIUM,
            category: 'Health',
            startAt: new Date().toISOString(),
            endAt: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
            estimatedTime: 30,
        });
        console.log('Created Task 1:', goal1.title);
        const goal2 = await goalsService.createGoal(userId, {
            title: '🚀 Code Authentication Verification Module',
            description: 'Write custom e2e test bootstrappers',
            priority: create_goal_dto_1.GoalPriority.URGENT,
            category: 'Work',
            startAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
            endAt: new Date(Date.now() + 150 * 60 * 1000).toISOString(),
            estimatedTime: 90,
        });
        console.log('Created Task 2:', goal2.title);
        console.log('\nStep 6: Listing all schedule tasks from local database...');
        const list = await goalsService.listGoals(userId);
        console.log(`Retrieved ${list.length} goals successfully!`);
        list.forEach((g, idx) => {
            console.log(`  [${idx + 1}] Title: ${g.title} | Status: ${g.status} | Priority: ${g.priority}`);
        });
        console.log('\n--- VERIFICATION TEST FLOW PASSED SUCCESSFULLY ---');
    }
    catch (err) {
        console.error('\n❌ Verification Flow Failed:', err.message);
    }
    finally {
        await app.close();
    }
}
runVerificationTest();
//# sourceMappingURL=test-e2e-bootstrap.js.map