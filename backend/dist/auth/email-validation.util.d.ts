export interface EmailValidationResult {
    valid: boolean;
    normalizedEmail: string;
    message?: string;
}
export declare function validateEmailFormat(rawEmail: string): EmailValidationResult;
export declare function validateEmailWithDomain(rawEmail: string): Promise<EmailValidationResult>;
