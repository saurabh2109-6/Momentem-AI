import { AiService } from './ai.service';
import { ChatMessageDto } from './dto/chat.dto';
export declare class AiController {
    private aiService;
    constructor(aiService: AiService);
    chatWithAssistant(userId: string, dto: ChatMessageDto): Promise<{
        reply: any;
    }>;
    optimizeSchedule(userId: string): Promise<{
        message: string;
        suggestions: any;
    }>;
}
