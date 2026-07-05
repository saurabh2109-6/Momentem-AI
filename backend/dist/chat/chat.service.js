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
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const crypto = __importStar(require("crypto"));
let ChatService = class ChatService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async registerKeys(userId, dto) {
        const keys = this.prisma.getMockSecurityKeys();
        const index = keys.findIndex((k) => k.userId === userId);
        const keyRecord = {
            userId,
            identityPublicKey: dto.identityPublicKey,
            signedPreKey: dto.signedPreKey,
            preKeySignature: dto.preKeySignature,
            oneTimePreKeys: JSON.stringify(dto.oneTimePreKeys),
            updatedAt: new Date().toISOString(),
        };
        if (index > -1) {
            keys[index] = keyRecord;
        }
        else {
            keys.push(keyRecord);
        }
        this.prisma.saveMockSecurityKeys(keys);
        return { message: 'Cryptographic security keys registered successfully' };
    }
    async getKeyBundle(recipientId) {
        const keys = this.prisma.getMockSecurityKeys();
        const keyBundle = keys.find((k) => k.userId === recipientId);
        if (!keyBundle) {
            throw new common_1.NotFoundException('Security keys not registered for this recipient');
        }
        const oneTimePreKeys = JSON.parse(keyBundle.oneTimePreKeys || '[]');
        if (oneTimePreKeys.length === 0) {
            throw new common_1.BadRequestException('No one-time prekeys left for this recipient');
        }
        const poppedKey = oneTimePreKeys.shift();
        keyBundle.oneTimePreKeys = JSON.stringify(oneTimePreKeys);
        keyBundle.updatedAt = new Date().toISOString();
        this.prisma.saveMockSecurityKeys(keys);
        return {
            userId: recipientId,
            identityPublicKey: keyBundle.identityPublicKey,
            signedPreKey: keyBundle.signedPreKey,
            preKeySignature: keyBundle.preKeySignature,
            oneTimePreKey: poppedKey,
        };
    }
    async createRoom(userId, dto) {
        const rooms = this.prisma.getMockChatRooms();
        if (!dto.isGroup) {
            if (!dto.recipientId) {
                throw new common_1.BadRequestException('Recipient ID is required for a DM');
            }
            const existingRoom = rooms.find((r) => r.isGroup === false &&
                r.participants.includes(userId) &&
                r.participants.includes(dto.recipientId));
            if (existingRoom) {
                return existingRoom;
            }
            const newRoom = {
                id: crypto.randomUUID(),
                isGroup: false,
                name: null,
                participants: [userId, dto.recipientId],
                lastMessage: null,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            rooms.push(newRoom);
            this.prisma.saveMockChatRooms(rooms);
            return newRoom;
        }
        else {
            const participantIds = dto.participantIds || [];
            if (!participantIds.includes(userId)) {
                participantIds.push(userId);
            }
            const newRoom = {
                id: crypto.randomUUID(),
                isGroup: true,
                name: dto.name || 'Group Chat',
                participants: participantIds,
                lastMessage: null,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };
            rooms.push(newRoom);
            this.prisma.saveMockChatRooms(rooms);
            return newRoom;
        }
    }
    async listRooms(userId) {
        const rooms = this.prisma.getMockChatRooms().filter((r) => r.participants.includes(userId));
        const profiles = this.prisma.getMockProfiles();
        const users = this.prisma.getMockUsers();
        const hydratedRooms = rooms.map((room) => {
            const recipients = [];
            room.participants.forEach((pId) => {
                if (pId === userId)
                    return;
                const profile = profiles.find((p) => p.userId === pId) || {};
                const user = users.find((u) => u.id === pId) || {};
                recipients.push({
                    ...profile,
                    username: user.username || '',
                });
            });
            return {
                ...room,
                recipients,
            };
        });
        hydratedRooms.sort((a, b) => {
            const timeA = a.lastMessage?.sentAt || a.createdAt;
            const timeB = b.lastMessage?.sentAt || b.createdAt;
            return timeB.localeCompare(timeA);
        });
        return hydratedRooms;
    }
    async sendMessage(userId, roomId, dto) {
        const rooms = this.prisma.getMockChatRooms();
        const roomIndex = rooms.findIndex((r) => r.id === roomId);
        if (roomIndex === -1) {
            throw new common_1.NotFoundException('Chat room not found');
        }
        const room = rooms[roomIndex];
        if (!room.participants.includes(userId)) {
            throw new common_1.ForbiddenException('You are not authorized to send messages in this room');
        }
        const messages = this.prisma.getMockChatMessages();
        const newMessage = {
            id: crypto.randomUUID(),
            roomId,
            senderId: userId,
            encryptedBody: dto.encryptedBody,
            nonce: dto.nonce,
            isMedia: dto.isMedia || false,
            mediaUrl: dto.mediaUrl || null,
            sentAt: new Date().toISOString(),
        };
        messages.push(newMessage);
        this.prisma.saveMockChatMessages(messages);
        rooms[roomIndex].lastMessage = {
            text: '🔒 Encrypted Message',
            senderId: userId,
            sentAt: newMessage.sentAt,
        };
        rooms[roomIndex].updatedAt = new Date().toISOString();
        this.prisma.saveMockChatRooms(rooms);
        return newMessage;
    }
    async listMessages(userId, roomId) {
        const rooms = this.prisma.getMockChatRooms();
        const room = rooms.find((r) => r.id === roomId);
        if (!room) {
            throw new common_1.NotFoundException('Chat room not found');
        }
        if (!room.participants.includes(userId)) {
            throw new common_1.ForbiddenException('You are not authorized to view messages in this room');
        }
        const messages = this.prisma.getMockChatMessages().filter((m) => m.roomId === roomId);
        messages.sort((a, b) => a.sentAt.localeCompare(b.sentAt));
        return messages;
    }
};
exports.ChatService = ChatService;
exports.ChatService = ChatService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ChatService);
//# sourceMappingURL=chat.service.js.map