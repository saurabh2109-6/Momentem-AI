import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '../generated/client';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  public isFallbackMode = false;
  private dbPath = path.join(process.cwd(), '.db');
  
  // File Paths for local fallback tables
  private usersFile = path.join(this.dbPath, 'prisma_users.json');
  private profilesFile = path.join(this.dbPath, 'prisma_profiles.json');
  private sessionsFile = path.join(this.dbPath, 'prisma_sessions.json');
  private goalsFile = path.join(this.dbPath, 'prisma_goals.json');
  private friendshipsFile = path.join(this.dbPath, 'prisma_friendships.json');
  private commentsFile = path.join(this.dbPath, 'prisma_comments.json');
  private reactionsFile = path.join(this.dbPath, 'prisma_reactions.json');
  private habitsFile = path.join(this.dbPath, 'prisma_habits.json');
  private securityKeysFile = path.join(this.dbPath, 'prisma_security_keys.json');
  private chatRoomsFile = path.join(this.dbPath, 'prisma_chat_rooms.json');
  private chatMessagesFile = path.join(this.dbPath, 'prisma_chat_messages.json');
  private auditLogsFile = path.join(this.dbPath, 'prisma_audit_logs.json');

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('Successfully connected to Neon PostgreSQL database.');
      this.isFallbackMode = false;
    } catch (err: any) {
      this.logger.warn(`Neon PostgreSQL connection failed: ${err.message}. Enabling local JSON database fallback.`);
      this.isFallbackMode = true;
      this.initializeMockFiles();
    }
  }

  async onModuleDestroy() {
    try {
      await this.$disconnect();
    } catch {
      // ignore
    }
  }

  private initializeMockFiles() {
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

  // --- HELPER GENERIC READ/WRITE FOR FALLBACK TABLES ---

  private readTable(filePath: string): any[] {
    try {
      const data = fs.readFileSync(filePath, 'utf8');
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private writeTable(filePath: string, data: any[]) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  }

  // --- MOCK TABLES GET / SET APIs ---

  getMockUsers() { return this.readTable(this.usersFile); }
  saveMockUsers(data: any[]) { this.writeTable(this.usersFile, data); }

  getMockProfiles() { return this.readTable(this.profilesFile); }
  saveMockProfiles(data: any[]) { this.writeTable(this.profilesFile, data); }

  getMockSessions() { return this.readTable(this.sessionsFile); }
  saveMockSessions(data: any[]) { this.writeTable(this.sessionsFile, data); }

  getMockGoals() { return this.readTable(this.goalsFile); }
  saveMockGoals(data: any[]) { this.writeTable(this.goalsFile, data); }

  getMockFriendships() { return this.readTable(this.friendshipsFile); }
  saveMockFriendships(data: any[]) { this.writeTable(this.friendshipsFile, data); }

  getMockComments() { return this.readTable(this.commentsFile); }
  saveMockComments(data: any[]) { this.writeTable(this.commentsFile, data); }

  getMockReactions() { return this.readTable(this.reactionsFile); }
  saveMockReactions(data: any[]) { this.writeTable(this.reactionsFile, data); }

  getMockHabits() { return this.readTable(this.habitsFile); }
  saveMockHabits(data: any[]) { this.writeTable(this.habitsFile, data); }

  getMockSecurityKeys() { return this.readTable(this.securityKeysFile); }
  saveMockSecurityKeys(data: any[]) { this.writeTable(this.securityKeysFile, data); }

  getMockChatRooms() { return this.readTable(this.chatRoomsFile); }
  saveMockChatRooms(data: any[]) { this.writeTable(this.chatRoomsFile, data); }

  getMockChatMessages() { return this.readTable(this.chatMessagesFile); }
  saveMockChatMessages(data: any[]) { this.writeTable(this.chatMessagesFile, data); }

  getMockAuditLogs() { return this.readTable(this.auditLogsFile); }
  saveMockAuditLogs(data: any[]) { this.writeTable(this.auditLogsFile, data); }
}
