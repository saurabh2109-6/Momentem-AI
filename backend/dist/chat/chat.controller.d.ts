import { ChatService } from './chat.service';
import { RegisterKeysDto, CreateRoomDto, SendMessageDto } from './dto/keys.dto';
export declare class ChatController {
    private chatService;
    constructor(chatService: ChatService);
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
    getRooms(userId: string): Promise<any[]>;
    getMessages(userId: string, roomId: string): Promise<any[]>;
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
}
