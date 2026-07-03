import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterKeysDto, CreateRoomDto, SendMessageDto } from './dto/keys.dto';
import * as crypto from 'crypto';

@Injectable()
export class ChatService {
  constructor(private prisma: PrismaService) {}

  /**
   * Registers or updates a user's E2EE cryptographic public keys.
   */
  async registerKeys(userId: string, dto: RegisterKeysDto) {
    const keys = this.prisma.getMockSecurityKeys();
    const index = keys.findIndex((k) => k.userId === userId);

    const keyRecord = {
      userId,
      identityPublicKey: dto.identityPublicKey,
      signedPreKey: dto.signedPreKey,
      preKeySignature: dto.preKeySignature,
      oneTimePreKeys: JSON.stringify(dto.oneTimePreKeys), // store as JSON string
      updatedAt: new Date().toISOString(),
    };

    if (index > -1) {
      keys[index] = keyRecord;
    } else {
      keys.push(keyRecord);
    }

    this.prisma.saveMockSecurityKeys(keys);
    return { message: 'Cryptographic security keys registered successfully' };
  }

  /**
   * Fetches the key bundle of a recipient. Consumes one one-time prekey.
   */
  async getKeyBundle(recipientId: string) {
    const keys = this.prisma.getMockSecurityKeys();
    const keyBundle = keys.find((k) => k.userId === recipientId);

    if (!keyBundle) {
      throw new NotFoundException('Security keys not registered for this recipient');
    }

    const oneTimePreKeys = JSON.parse(keyBundle.oneTimePreKeys || '[]');

    if (oneTimePreKeys.length === 0) {
      throw new BadRequestException('No one-time prekeys left for this recipient');
    }

    // Pop the first one-time prekey to guarantee it is only used once (Forward Secrecy)
    const poppedKey = oneTimePreKeys.shift();

    // Update document with remaining keys
    keyBundle.oneTimePreKeys = JSON.stringify(oneTimePreKeys);
    keyBundle.updatedAt = new Date().toISOString();
    this.prisma.saveMockSecurityKeys(keys);

    return {
      userId: recipientId,
      identityPublicKey: keyBundle.identityPublicKey,
      signedPreKey: keyBundle.signedPreKey,
      preKeySignature: keyBundle.preKeySignature,
      oneTimePreKey: poppedKey, // return the single one-time prekey
    };
  }

  /**
   * Creates a DM or group chat room.
   */
  async createRoom(userId: string, dto: CreateRoomDto) {
    const rooms = this.prisma.getMockChatRooms();

    if (!dto.isGroup) {
      if (!dto.recipientId) {
        throw new BadRequestException('Recipient ID is required for a DM');
      }

      // Check if DM room already exists between these two users
      const existingRoom = rooms.find(
        (r) =>
          r.isGroup === false &&
          r.participants.includes(userId) &&
          r.participants.includes(dto.recipientId),
      );

      if (existingRoom) {
        return existingRoom;
      }

      // Create new DM room
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
    } else {
      // Create Group Chat Room
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

  /**
   * Lists all rooms the user is participating in, hydrating participant profiles.
   */
  async listRooms(userId: string) {
    const rooms = this.prisma.getMockChatRooms().filter((r) => r.participants.includes(userId));
    const profiles = this.prisma.getMockProfiles();
    const users = this.prisma.getMockUsers();
    
    const hydratedRooms = rooms.map((room) => {
      const recipients: any[] = [];
      room.participants.forEach((pId: string) => {
        if (pId === userId) return;
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

    // Sort by last message sentAt or room creation
    hydratedRooms.sort((a, b) => {
      const timeA = a.lastMessage?.sentAt || a.createdAt;
      const timeB = b.lastMessage?.sentAt || b.createdAt;
      return timeB.localeCompare(timeA);
    });

    return hydratedRooms;
  }

  /**
   * Saves an encrypted message to the subcollection.
   */
  async sendMessage(userId: string, roomId: string, dto: SendMessageDto) {
    const rooms = this.prisma.getMockChatRooms();
    const roomIndex = rooms.findIndex((r) => r.id === roomId);

    if (roomIndex === -1) {
      throw new NotFoundException('Chat room not found');
    }

    const room = rooms[roomIndex];
    if (!room.participants.includes(userId)) {
      throw new ForbiddenException('You are not authorized to send messages in this room');
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

    // Update parent room document lastMessage preview
    rooms[roomIndex].lastMessage = {
      text: '🔒 Encrypted Message',
      senderId: userId,
      sentAt: newMessage.sentAt,
    };
    rooms[roomIndex].updatedAt = new Date().toISOString();
    this.prisma.saveMockChatRooms(rooms);

    return newMessage;
  }

  /**
   * Lists historical messages in a room.
   */
  async listMessages(userId: string, roomId: string) {
    const rooms = this.prisma.getMockChatRooms();
    const room = rooms.find((r) => r.id === roomId);
    
    if (!room) {
      throw new NotFoundException('Chat room not found');
    }

    if (!room.participants.includes(userId)) {
      throw new ForbiddenException('You are not authorized to view messages in this room');
    }

    const messages = this.prisma.getMockChatMessages().filter((m) => m.roomId === roomId);

    // Sort ascending by sentAt
    messages.sort((a: any, b: any) => a.sentAt.localeCompare(b.sentAt));
    return messages;
  }
}
