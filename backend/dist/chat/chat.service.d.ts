import { PrismaService } from '../prisma/prisma.service';
import { RegisterKeysDto, CreateRoomDto, SendMessageDto } from './dto/keys.dto';
export declare class ChatService {
    private prisma;
    constructor(prisma: PrismaService);
    registerKeys(userId: string, dto: RegisterKeysDto): Promise<{
        message: string;
    }>;
    getKeyBundle(recipientId: string): Promise<{
        userId: string;
        identityPublicKey: any;
        signedPreKey: any;
        preKeySignature: any;
        oneTimePreKey: any;
    }>;
    createRoom(userId: string, dto: CreateRoomDto): Promise<any>;
    listRooms(userId: string): Promise<any[]>;
    sendMessage(userId: string, roomId: string, dto: SendMessageDto): Promise<{
        id: `${string}-${string}-${string}-${string}-${string}`;
        roomId: string;
        senderId: string;
        encryptedBody: string;
        nonce: string;
        isMedia: boolean;
        mediaUrl: string | null;
        sentAt: string;
    }>;
    listMessages(userId: string, roomId: string): Promise<any[]>;
}
