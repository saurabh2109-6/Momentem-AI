import { FriendsService } from './friends.service';
import { SendFriendRequestDto, UpdateFriendshipDto } from './dto/friend-request.dto';
export declare class FriendsController {
    private friendsService;
    constructor(friendsService: FriendsService);
    sendRequest(userId: string, dto: SendFriendRequestDto): Promise<{
        message: string;
        status: string;
    }>;
    acceptRequest(userId: string, dto: UpdateFriendshipDto): Promise<{
        message: string;
    }>;
    rejectRequest(userId: string, dto: UpdateFriendshipDto): Promise<{
        message: string;
    }>;
    block(userId: string, dto: UpdateFriendshipDto): Promise<{
        message: string;
    }>;
    unblock(userId: string, dto: UpdateFriendshipDto): Promise<{
        message: string;
    }>;
    getFriends(userId: string): Promise<any[]>;
    getPendingRequests(userId: string): Promise<{
        userId: any;
        displayName: any;
        friendCode: any;
        avatarUrl: any;
        sentAt: any;
    }[]>;
}
