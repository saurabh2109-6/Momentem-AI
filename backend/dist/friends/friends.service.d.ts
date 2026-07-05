import { PrismaService } from '../prisma/prisma.service';
export declare class FriendsService {
    private prisma;
    constructor(prisma: PrismaService);
    sendFriendRequest(senderId: string, friendCode: string): Promise<{
        message: string;
        status: string;
    }>;
    acceptFriendRequest(userId: string, senderId: string): Promise<{
        message: string;
    }>;
    rejectFriendRequest(userId: string, friendId: string): Promise<{
        message: string;
    }>;
    blockUser(userId: string, friendId: string): Promise<{
        message: string;
    }>;
    unblockUser(userId: string, friendId: string): Promise<{
        message: string;
    }>;
    listFriends(userId: string): Promise<any[]>;
    listPendingRequests(userId: string): Promise<{
        userId: any;
        displayName: any;
        friendCode: any;
        avatarUrl: any;
        sentAt: any;
    }[]>;
}
