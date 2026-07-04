import { ProfileService } from './profile.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
export declare class ProfileController {
    private profileService;
    constructor(profileService: ProfileService);
    getMyProfile(userId: string): Promise<any>;
    updateMyProfile(userId: string, dto: UpdateProfileDto): Promise<any>;
    getProfileByCode(code: string): Promise<any>;
}
