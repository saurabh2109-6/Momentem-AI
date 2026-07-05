"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const LOG_FILE_PATH = path.join('C:', 'Users', 'Saurabh Chakarvarti', '.gemini', 'antigravity', 'brain', 'd128ee28-93ed-46c8-b316-8fb0805a2db1', '.system_generated', 'tasks', 'task-1413.log');
async function runHttpApiCheck() {
    console.log('--- STARTING LIVE HTTP API CHECK ---');
    const baseUrl = 'http://localhost:3001/api';
    const testEmail = 'http_tester_' + Math.random().toString(36).substring(2, 7) + '@example.com';
    const testUsername = 'http_tester_' + Math.random().toString(36).substring(2, 7);
    const testPassword = 'Password123!';
    try {
        console.log(`\nStep 1: Sending POST to /auth/otp/request for: ${testEmail}`);
        const reqRes = await axios_1.default.post(`${baseUrl}/auth/otp/request`, { email: testEmail });
        console.log('Response Status:', reqRes.status);
        console.log('Response Data:', reqRes.data);
        await new Promise((resolve) => setTimeout(resolve, 2000));
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
        console.log('\nStep 3: Verification Security Check (Sending wrong OTP code "999999")...');
        try {
            await axios_1.default.post(`${baseUrl}/auth/otp/verify`, {
                email: testEmail,
                code: '999999',
            });
            console.log('❌ FAIL: Server accepted incorrect OTP code!');
        }
        catch (err) {
            console.log('✔ SUCCESS: Incorrect code blocked successfully! Server returned:', err.response?.data?.message);
        }
        console.log('\nStep 4: Verifying with CORRECT OTP code...');
        const verifyRes = await axios_1.default.post(`${baseUrl}/auth/otp/verify`, {
            email: testEmail,
            code: otpCode,
        });
        console.log('Response Status:', verifyRes.status);
        console.log('Response Data:', verifyRes.data);
        console.log('\nStep 5: Registering account using verified email...');
        const regRes = await axios_1.default.post(`${baseUrl}/auth/register`, {
            email: testEmail,
            username: testUsername,
            password: testPassword,
        });
        console.log('Response Status:', regRes.status);
        console.log('User registered user ID:', regRes.data.user.id);
        const accessToken = regRes.data.accessToken;
        console.log('\nStep 6: Creating daily schedule task using auth token...');
        const goalRes = await axios_1.default.post(`${baseUrl}/goals`, {
            title: '📊 Verify HTTP API Flow',
            description: 'Automatic checker verified schedule endpoints',
            priority: 'HIGH',
            category: 'Test',
            startAt: new Date().toISOString(),
            endAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
            estimatedTime: 60,
        }, {
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        console.log('Response Status:', goalRes.status);
        console.log('Created Goal title:', goalRes.data.title);
        console.log('\nStep 7: Retrieving daily schedule list...');
        const listRes = await axios_1.default.get(`${baseUrl}/goals`, {
            headers: { Authorization: `Bearer ${accessToken}` },
        });
        console.log(`Successfully retrieved ${listRes.data.length} tasks!`);
        listRes.data.forEach((task, index) => {
            console.log(`  [${index + 1}] Title: ${task.title} | Priority: ${task.priority}`);
        });
        console.log('\n--- LIVE HTTP API CHECK COMPLETED SUCCESSFULY ---');
    }
    catch (err) {
        console.error('\n❌ HTTP API Check Failed:', err.response?.data || err.message);
    }
}
runHttpApiCheck();
//# sourceMappingURL=test-http-api.js.map