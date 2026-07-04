export declare class RegisterKeysDto {
    identityPublicKey: string;
    signedPreKey: string;
    preKeySignature: string;
    oneTimePreKeys: string[];
}
export declare class CreateRoomDto {
    recipientId?: string;
    name?: string;
    isGroup?: boolean;
    participantIds?: string[];
}
export declare class SendMessageDto {
    encryptedBody: string;
    nonce: string;
    isMedia?: boolean;
    mediaUrl?: string;
}
