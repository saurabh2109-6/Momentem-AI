export declare class ChatMessageDto {
    message: string;
    history?: Array<{
        role: 'user' | 'model';
        parts: Array<{
            text: string;
        }>;
    }>;
}
