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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FriendsController = void 0;
const common_1 = require("@nestjs/common");
const friends_service_1 = require("./friends.service");
const friend_request_dto_1 = require("./dto/friend-request.dto");
const firebase_auth_guard_1 = require("../auth/guards/firebase-auth.guard");
const get_user_decorator_1 = require("../auth/decorators/get-user.decorator");
let FriendsController = class FriendsController {
    friendsService;
    constructor(friendsService) {
        this.friendsService = friendsService;
    }
    async sendRequest(userId, dto) {
        return this.friendsService.sendFriendRequest(userId, dto.friendCode);
    }
    async acceptRequest(userId, dto) {
        return this.friendsService.acceptFriendRequest(userId, dto.friendId);
    }
    async rejectRequest(userId, dto) {
        return this.friendsService.rejectFriendRequest(userId, dto.friendId);
    }
    async block(userId, dto) {
        return this.friendsService.blockUser(userId, dto.friendId);
    }
    async unblock(userId, dto) {
        return this.friendsService.unblockUser(userId, dto.friendId);
    }
    async getFriends(userId) {
        return this.friendsService.listFriends(userId);
    }
    async getPendingRequests(userId) {
        return this.friendsService.listPendingRequests(userId);
    }
};
exports.FriendsController = FriendsController;
__decorate([
    (0, common_1.Post)('request'),
    __param(0, (0, get_user_decorator_1.GetUser)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, friend_request_dto_1.SendFriendRequestDto]),
    __metadata("design:returntype", Promise)
], FriendsController.prototype, "sendRequest", null);
__decorate([
    (0, common_1.Post)('accept'),
    __param(0, (0, get_user_decorator_1.GetUser)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, friend_request_dto_1.UpdateFriendshipDto]),
    __metadata("design:returntype", Promise)
], FriendsController.prototype, "acceptRequest", null);
__decorate([
    (0, common_1.Post)('reject'),
    __param(0, (0, get_user_decorator_1.GetUser)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, friend_request_dto_1.UpdateFriendshipDto]),
    __metadata("design:returntype", Promise)
], FriendsController.prototype, "rejectRequest", null);
__decorate([
    (0, common_1.Post)('block'),
    __param(0, (0, get_user_decorator_1.GetUser)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, friend_request_dto_1.UpdateFriendshipDto]),
    __metadata("design:returntype", Promise)
], FriendsController.prototype, "block", null);
__decorate([
    (0, common_1.Post)('unblock'),
    __param(0, (0, get_user_decorator_1.GetUser)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, friend_request_dto_1.UpdateFriendshipDto]),
    __metadata("design:returntype", Promise)
], FriendsController.prototype, "unblock", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, get_user_decorator_1.GetUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FriendsController.prototype, "getFriends", null);
__decorate([
    (0, common_1.Get)('pending'),
    __param(0, (0, get_user_decorator_1.GetUser)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FriendsController.prototype, "getPendingRequests", null);
exports.FriendsController = FriendsController = __decorate([
    (0, common_1.Controller)('friends'),
    (0, common_1.UseGuards)(firebase_auth_guard_1.FirebaseAuthGuard),
    __metadata("design:paramtypes", [friends_service_1.FriendsService])
], FriendsController);
//# sourceMappingURL=friends.controller.js.map