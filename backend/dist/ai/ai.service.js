"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var AiService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const axios_1 = __importDefault(require("axios"));
let AiService = AiService_1 = class AiService {
    prisma;
    logger = new common_1.Logger(AiService_1.name);
    geminiUrl = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
    constructor(prisma) {
        this.prisma = prisma;
    }
    async chatWithAssistant(userId, userMessage, history = []) {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            this.logger.warn('GEMINI_API_KEY missing. Falling back to local mock AI responses.');
            return this.getMockResponse(userMessage);
        }
        try {
            const formattedContents = [
                ...history,
                { role: 'user', parts: [{ text: userMessage }] }
            ];
            const response = await axios_1.default.post(`${this.geminiUrl}?key=${apiKey}`, {
                contents: formattedContents,
                systemInstruction: {
                    parts: [{
                            text: 'You are Momentum AI, a premium personal productivity coach and schedule optimizer. Keep responses actionable, concise, and professional. Guide users on time blocking, habit streaks, and burnout mitigation.'
                        }]
                }
            });
            const candidate = response.data?.candidates?.[0];
            const reply = candidate?.content?.parts?.[0]?.text;
            if (!reply) {
                throw new Error('Empty model output');
            }
            return { reply };
        }
        catch (err) {
            this.logger.error(`Gemini API error: ${err.message}`);
            return this.getMockResponse(userMessage);
        }
    }
    async optimizeSchedule(userId) {
        let goals = [];
        if (this.prisma.isFallbackMode) {
            goals = this.prisma.getMockGoals().filter((g) => g.userId === userId);
        }
        else {
            goals = await this.prisma.goal.findMany({ where: { userId } });
        }
        if (goals.length === 0) {
            return {
                message: 'No upcoming goals found to optimize. Create some goals in your planner first!',
                suggestions: 'No upcoming goals found to optimize. Create some goals in your planner first!',
            };
        }
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return this.getMockScheduleOptimizations(goals);
        }
        try {
            const prompt = `Analyze these daily goals and recommend an optimized schedule (reordering task order, recommending breaks, predicting fatigue): ${JSON.stringify(goals)}. Return a clean, concise recommendation summary followed by list of proposed time slots.`;
            const response = await axios_1.default.post(`${this.geminiUrl}?key=${apiKey}`, {
                contents: [{ parts: [{ text: prompt }] }],
                systemInstruction: {
                    parts: [{
                            text: 'You are an advanced time-blocking scheduler. Rearrange tasks by priority (Urgent/High first) and time estimations. Suggest breaks. Output results clearly.'
                        }]
                }
            });
            const reply = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
            return {
                message: 'Schedule optimized successfully via Momentum AI.',
                suggestions: reply || 'Could not compute suggestions.'
            };
        }
        catch (err) {
            this.logger.error(`Gemini Optimization Error: ${err.message}`);
            return this.getMockScheduleOptimizations(goals);
        }
    }
    getMockResponse(msg) {
        const lower = msg.toLowerCase();
        let reply = 'I am Momentum AI. How can I help you optimize your daily workflow, habit streaks, or goal schedule?';
        if (lower.includes('burnout') || lower.includes('tired')) {
            reply = 'Momentum AI Warning: Your cognitive intensity index is rising. We recommend implementing a 50/10 Pomodoro block: work focused for 50 minutes, then completely disconnect for 10 minutes. Avoid scheduling high-priority goals after 6:00 PM today.';
        }
        else if (lower.includes('schedule') || lower.includes('optimize') || lower.includes('plan')) {
            reply = 'I can optimize your planner layout! Use the \"Optimize Schedule\" button on your dashboard to let me auto-arrange tasks by priority and energy curves (High priority in the morning, administrative tasks post-lunch).';
        }
        else if (lower.includes('streak') || lower.includes('habit')) {
            reply = 'Consistency is the key to Momentum. Try linking habits together (e.g. \"Do meditation immediately after pouring morning coffee\"). This triggers automatic routines in the brain.';
        }
        return { reply };
    }
    getMockScheduleOptimizations(goals) {
        const sorted = [...goals].sort((a, b) => {
            const priorityOrder = { URGENT: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
            const orderA = priorityOrder[a.priority] ?? 2;
            const orderB = priorityOrder[b.priority] ?? 2;
            return orderA - orderB;
        });
        const suggestions = sorted.map((g) => {
            let timeBlock = '09:00 AM';
            if (g.priority === 'URGENT')
                timeBlock = '09:00 AM - 10:30 AM (Peak Focus)';
            else if (g.priority === 'HIGH')
                timeBlock = '10:45 AM - 12:00 PM (High Energy)';
            else if (g.priority === 'MEDIUM')
                timeBlock = '01:30 PM - 03:00 PM (Post-lunch block)';
            else
                timeBlock = '03:30 PM - 04:30 PM (Low intensity block)';
            return `- **${g.title}**: Suggested Slot: ${timeBlock}. Reason: Aligned with standard energy curve.`;
        }).join('\n');
        return {
            message: 'Schedule optimized successfully (Mock AI Fallback Mode).',
            suggestions: `Based on your daily priorities, here is the optimized sequence:\n\n${suggestions}\n\n*Tip: We've inserted a 15-minute recovery block at 10:30 AM to prevent burnout.*`
        };
    }
};
exports.AiService = AiService;
exports.AiService = AiService = AiService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AiService);
//# sourceMappingURL=ai.service.js.map