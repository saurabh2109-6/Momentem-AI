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
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
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
var PrismaService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
let PrismaService = PrismaService_1 = class PrismaService extends client_1.PrismaClient {
    logger = new common_1.Logger(PrismaService_1.name);
    isFallbackMode = false;
    dbPath = path.join(process.cwd(), '.db');
    usersFile = path.join(this.dbPath, 'prisma_users.json');
    profilesFile = path.join(this.dbPath, 'prisma_profiles.json');
    sessionsFile = path.join(this.dbPath, 'prisma_sessions.json');
    goalsFile = path.join(this.dbPath, 'prisma_goals.json');
    friendshipsFile = path.join(this.dbPath, 'prisma_friendships.json');
    commentsFile = path.join(this.dbPath, 'prisma_comments.json');
    reactionsFile = path.join(this.dbPath, 'prisma_reactions.json');
    habitsFile = path.join(this.dbPath, 'prisma_habits.json');
    securityKeysFile = path.join(this.dbPath, 'prisma_security_keys.json');
    chatRoomsFile = path.join(this.dbPath, 'prisma_chat_rooms.json');
    chatMessagesFile = path.join(this.dbPath, 'prisma_chat_messages.json');
    auditLogsFile = path.join(this.dbPath, 'prisma_audit_logs.json');
    async onModuleInit() {
        try {
            await this.$connect();
            this.logger.log('Successfully connected to Neon PostgreSQL database.');
            this.isFallbackMode = false;
        }
        catch (err) {
            this.logger.warn(`Neon PostgreSQL connection failed: ${err.message}. Enabling local JSON database fallback.`);
            this.isFallbackMode = true;
            this.initializeMockFiles();
        }
    }
    async onModuleDestroy() {
        try {
            await this.$disconnect();
        }
        catch {
        }
    }
    initializeMockFiles() {
        if (!fs.existsSync(this.dbPath)) {
            fs.mkdirSync(this.dbPath, { recursive: true });
        }
        const files = [
            this.usersFile,
            this.profilesFile,
            this.sessionsFile,
            this.goalsFile,
            this.friendshipsFile,
            this.commentsFile,
            this.reactionsFile,
            this.habitsFile,
            this.securityKeysFile,
            this.chatRoomsFile,
            this.chatMessagesFile,
            this.auditLogsFile,
        ];
        for (const file of files) {
            if (!fs.existsSync(file)) {
                fs.writeFileSync(file, JSON.stringify([]));
            }
        }
    }
    readTable(filePath) {
        try {
            const data = fs.readFileSync(filePath, 'utf8');
            const parsed = JSON.parse(data);
            return Array.isArray(parsed) ? parsed : [];
        }
        catch {
            return [];
        }
    }
    writeTable(filePath, data) {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    }
    getMockUsers() { return this.readTable(this.usersFile); }
    saveMockUsers(data) { this.writeTable(this.usersFile, data); }
    getMockProfiles() { return this.readTable(this.profilesFile); }
    saveMockProfiles(data) { this.writeTable(this.profilesFile, data); }
    getMockSessions() { return this.readTable(this.sessionsFile); }
    saveMockSessions(data) { this.writeTable(this.sessionsFile, data); }
    getMockGoals() { return this.readTable(this.goalsFile); }
    saveMockGoals(data) { this.writeTable(this.goalsFile, data); }
    getMockFriendships() { return this.readTable(this.friendshipsFile); }
    saveMockFriendships(data) { this.writeTable(this.friendshipsFile, data); }
    getMockComments() { return this.readTable(this.commentsFile); }
    saveMockComments(data) { this.writeTable(this.commentsFile, data); }
    getMockReactions() { return this.readTable(this.reactionsFile); }
    saveMockReactions(data) { this.writeTable(this.reactionsFile, data); }
    getMockHabits() { return this.readTable(this.habitsFile); }
    saveMockHabits(data) { this.writeTable(this.habitsFile, data); }
    getMockSecurityKeys() { return this.readTable(this.securityKeysFile); }
    saveMockSecurityKeys(data) { this.writeTable(this.securityKeysFile, data); }
    getMockChatRooms() { return this.readTable(this.chatRoomsFile); }
    saveMockChatRooms(data) { this.writeTable(this.chatRoomsFile, data); }
    getMockChatMessages() { return this.readTable(this.chatMessagesFile); }
    saveMockChatMessages(data) { this.writeTable(this.chatMessagesFile, data); }
    getMockAuditLogs() { return this.readTable(this.auditLogsFile); }
    saveMockAuditLogs(data) { this.writeTable(this.auditLogsFile, data); }
};
exports.PrismaService = PrismaService;
exports.PrismaService = PrismaService = PrismaService_1 = __decorate([
    (0, common_1.Injectable)()
], PrismaService);
//# sourceMappingURL=prisma.service.js.map